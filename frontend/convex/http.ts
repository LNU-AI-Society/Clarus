import { httpAction } from './_generated/server';
import { httpRouter } from 'convex/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_ORIGIN = 'http://localhost:5173';
const SYSTEM_PROMPT =
  'You are Clarus, a helpful Swedish legal assistant. Be clear, concise, and avoid legal advice.';
const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the current time in ISO format for a given time zone.',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: 'IANA time zone name (e.g. Europe/Stockholm).',
          },
        },
      },
    },
  },
];

const runTool = (name: string, args: { timezone?: string }) => {
  if (name !== 'get_current_time') {
    return { error: `Unknown tool: ${name}` };
  }

  const timeZone = args.timezone || 'Europe/Stockholm';
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    dateStyle: 'full',
    timeStyle: 'long',
  });

  return {
    timeZone,
    iso: now.toISOString(),
    formatted: formatter.format(now),
  };
};

const buildMessages = (message: string, history?: Array<{ role: string; content: string }>) => {
  const mappedHistory = (history ?? []).map((item) => ({
    role: item.role === 'model' ? 'assistant' : 'user',
    content: item.content,
  }));

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...mappedHistory,
    { role: 'user', content: message },
  ];
};

const corsHeaders = (origin: string) => {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin');
  return headers;
};

const http = httpRouter();

http.route({
  path: '/chat/stream',
  method: 'OPTIONS',
  handler: httpAction(async (_ctx, request) => {
    const origin = request.headers.get('Origin') ?? env.CLIENT_ORIGIN ?? DEFAULT_ORIGIN;
    return new Response(null, { headers: corsHeaders(origin) });
  }),
});

http.route({
  path: '/chat/stream',
  method: 'POST',
  handler: httpAction(async (_ctx, request) => {
    const origin = request.headers.get('Origin') ?? env.CLIENT_ORIGIN ?? DEFAULT_ORIGIN;
    const headers = corsHeaders(origin);
    headers.set('Content-Type', 'text/event-stream; charset=utf-8');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');
    headers.set('X-Accel-Buffering', 'no');

    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response('OpenRouter API key is not configured.', { status: 500, headers });
    }

    const body = await request.json().catch(() => null);
    if (!body?.message) {
      return new Response('Message is required.', { status: 400, headers });
    }

    const messages = buildMessages(body.message, body.history);
    const openRouterResponse = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.OPENROUTER_HTTP_REFERER || origin,
        'X-Title': env.OPENROUTER_APP_NAME || 'Clarus',
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL || DEFAULT_MODEL,
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 600,
        stream: true,
      }),
    });

    if (!openRouterResponse.ok || !openRouterResponse.body) {
      const errorText = await openRouterResponse.text();
      return new Response(errorText || 'OpenRouter request failed.', {
        status: openRouterResponse.status,
        headers,
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openRouterResponse.body?.getReader();
        if (!reader) {
          controller.error(new Error('Streaming response not available.'));
          return;
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        const toolCalls: Record<
          number,
          { id?: string; name?: string; arguments: string }
        > = {};
        let buffer = '';
        let hasToolCall = false;
        let doneReading = false;

        const sendSse = (data: string) => {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        const updateToolCalls = (
          calls: Array<{
            index?: number;
            id?: string;
            function?: { name?: string; arguments?: string };
          }>,
        ) => {
          for (const call of calls) {
            const index = call.index ?? 0;
            const entry = toolCalls[index] ?? { arguments: '' };
            if (call.id) {
              entry.id = call.id;
            }
            if (call.function?.name) {
              entry.name = call.function.name;
            }
            if (call.function?.arguments) {
              entry.arguments += call.function.arguments;
            }
            toolCalls[index] = entry;
          }
        };

        while (!doneReading) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) {
              continue;
            }

            const data = trimmed.replace(/^data:\s*/, '');
            if (data === '[DONE]') {
              if (!hasToolCall) {
                sendSse('[DONE]');
              }
              doneReading = true;
              break;
            }

            try {
              const payload = JSON.parse(data) as {
                choices?: Array<{
                  delta?: {
                    content?: string;
                    tool_calls?: Array<{
                      index?: number;
                      id?: string;
                      function?: { name?: string; arguments?: string };
                    }>;
                  };
                }>;
              };

              const delta = payload.choices?.[0]?.delta;
              if (delta?.tool_calls && delta.tool_calls.length > 0) {
                hasToolCall = true;
                updateToolCalls(delta.tool_calls);
              }

              if (!hasToolCall) {
                sendSse(data);
              }
            } catch (error) {
              if (!hasToolCall) {
                sendSse(data);
              }
            }
          }
        }

        if (!hasToolCall) {
          controller.close();
          return;
        }

        const assistantToolCalls = Object.entries(toolCalls).map(([index, call]) => ({
          id: call.id ?? `tool-${index}`,
          type: 'function',
          function: {
            name: call.name ?? 'unknown',
            arguments: call.arguments || '{}',
          },
        }));

        const toolMessages = Object.entries(toolCalls).map(([index, call]) => {
          let parsedArgs: { timezone?: string } = {};
          if (call.arguments) {
            try {
              parsedArgs = JSON.parse(call.arguments) as { timezone?: string };
            } catch {
              parsedArgs = {};
            }
          }

          const result = runTool(call.name ?? 'unknown', parsedArgs);
          return {
            role: 'tool',
            tool_call_id: call.id ?? `tool-${index}`,
            content: JSON.stringify(result),
          };
        });

        const followUpResponse = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': env.OPENROUTER_HTTP_REFERER || origin,
            'X-Title': env.OPENROUTER_APP_NAME || 'Clarus',
          },
          body: JSON.stringify({
            model: env.OPENROUTER_MODEL || DEFAULT_MODEL,
            messages: [
              ...messages,
              { role: 'assistant', tool_calls: assistantToolCalls },
              ...toolMessages,
            ],
            tools,
            tool_choice: 'auto',
            temperature: 0.3,
            max_tokens: 600,
            stream: true,
          }),
        });

        if (!followUpResponse.ok || !followUpResponse.body) {
          const errorText = await followUpResponse.text();
          controller.error(
            new Error(
              `OpenRouter tool follow-up failed: ${followUpResponse.status} ${errorText}`,
            ),
          );
          return;
        }

        const followReader = followUpResponse.body.getReader();
        while (true) {
          const { value, done } = await followReader.read();
          if (done) {
            break;
          }
          controller.enqueue(value);
        }

        controller.close();
      },
    });

    return new Response(stream, { status: 200, headers });
  }),
});

export default http;
