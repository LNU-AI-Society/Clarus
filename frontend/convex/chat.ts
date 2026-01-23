import { action } from './_generated/server';
import { v } from 'convex/values';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
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

const buildMessages = (
  message: string,
  history?: Array<{ role: string; content: string }>,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> => {
  const systemPrompt =
    'You are Clarus, a helpful Swedish legal assistant. Be clear, concise, and avoid legal advice.';

  const mappedHistory = (history ?? []).map((item) => ({
    role: item.role === 'model' ? 'assistant' : 'user',
    content: item.content,
  }));

  return [
    { role: 'system', content: systemPrompt },
    ...mappedHistory,
    { role: 'user', content: message },
  ];
};

export const sendMessage = action({
  args: {
    message: v.string(),
    history: v.optional(
      v.array(
        v.object({
          role: v.string(),
          content: v.string(),
        }),
      ),
    ),
  },
  handler: async (_ctx, args) => {
    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return {
        answer:
          'OpenRouter is not configured yet. Set OPENROUTER_API_KEY in your Convex env to enable chat responses.',
        citations: [],
      };
    }

    const messages = buildMessages(args.message, args.history);
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.OPENROUTER_HTTP_REFERER || 'http://localhost:5173',
        'X-Title': env.OPENROUTER_APP_NAME || 'Clarus',
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL || DEFAULT_MODEL,
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
          tool_calls?: Array<{
            id: string;
            function?: { name?: string; arguments?: string };
          }>;
        };
      }>;
    };

    const firstMessage = data.choices?.[0]?.message;
    const toolCalls = firstMessage?.tool_calls ?? [];
    if (toolCalls.length > 0 && firstMessage) {
      const toolMessages = toolCalls.map((toolCall) => {
        const name = toolCall.function?.name ?? '';
        const parsedArgs = toolCall.function?.arguments
          ? (JSON.parse(toolCall.function.arguments) as { timezone?: string })
          : {};
        const result = runTool(name, parsedArgs);
        return {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        };
      });

      const followUpResponse = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': env.OPENROUTER_HTTP_REFERER || 'http://localhost:5173',
          'X-Title': env.OPENROUTER_APP_NAME || 'Clarus',
        },
        body: JSON.stringify({
          model: env.OPENROUTER_MODEL || DEFAULT_MODEL,
          messages: [...messages, firstMessage, ...toolMessages],
          tools,
          tool_choice: 'auto',
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (!followUpResponse.ok) {
        const errorText = await followUpResponse.text();
        throw new Error(`OpenRouter tool follow-up failed: ${followUpResponse.status} ${errorText}`);
      }

      const followUpData = (await followUpResponse.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const answer =
        followUpData.choices?.[0]?.message?.content?.trim() || 'No response generated.';

      return {
        answer,
        citations: [],
      };
    }

    const answer = firstMessage?.content?.trim() || 'No response generated.';

    return {
      answer,
      citations: [],
    };
  },
});
