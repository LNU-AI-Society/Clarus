import { createOpenAI } from '@ai-sdk/openai';
import { stepCountIs, streamText } from 'ai';
import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { buildChatMessages, createRagSearchTool, SYSTEM_PROMPT } from './chatRag';

const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_ORIGIN = 'http://localhost:5173';
const DEFAULT_RAG_LIMIT = 6;
const MAX_MESSAGE_LENGTH = 4_000;
const CHAT_PATHS = ['/chat', '/chat/stream'] as const;
const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const readEnv = (name: string) => env[name]?.trim() || undefined;
const getApiKey = () => readEnv('OPENROUTER_API_KEY');
const resolveModel = () => readEnv('OPENROUTER_MODEL') || DEFAULT_MODEL;
const resolveBaseUrl = () => readEnv('OPENROUTER_BASE_URL') || DEFAULT_OPENROUTER_BASE_URL;
const isRagEnabled = () => (env.RAG_ENABLED?.trim().toLowerCase() ?? 'true') !== 'false';

const buildOpenRouterHeaders = (): Record<string, string> | undefined => {
  const referer = readEnv('OPENROUTER_HTTP_REFERER');
  const title = readEnv('OPENROUTER_X_TITLE');
  const headers: Record<string, string> = {};

  if (referer) {
    headers['HTTP-Referer'] = referer;
  }
  if (title) {
    headers['X-Title'] = title;
  }

  return Object.keys(headers).length > 0 ? headers : undefined;
};

type ChatRequestBody = {
  message?: unknown;
  history?: unknown;
  rag_site_id?: unknown;
  rag_limit?: unknown;
};

type Citation = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source_type: string;
};

const isHistoryMessage = (value: unknown): value is { role: string; content: string } => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeMessage = value as { role?: unknown; content?: unknown };
  return typeof maybeMessage.role === 'string' && typeof maybeMessage.content === 'string';
};

const corsHeaders = (origin: string) => {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin');
  return headers;
};

const http = httpRouter();

const optionsHandler = httpAction(async (_ctx, request) => {
  const origin = request.headers.get('Origin') ?? env.CLIENT_ORIGIN ?? DEFAULT_ORIGIN;
  return new Response(null, { headers: corsHeaders(origin) });
});

const postHandler = httpAction(async (ctx, request) => {
  const origin = request.headers.get('Origin') ?? env.CLIENT_ORIGIN ?? DEFAULT_ORIGIN;
  const headers = corsHeaders(origin);
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return new Response('Unauthorized', { status: 401, headers });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return new Response('OpenRouter API key is not configured.', { status: 500, headers });
  }

  const body = (await request.json().catch(() => null)) as ChatRequestBody | null;
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return new Response('Message is required.', { status: 400, headers });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return new Response('Message is too long.', { status: 400, headers });
  }

  const history = Array.isArray(body?.history)
    ? body.history.filter(isHistoryMessage)
    : undefined;
  const ragSiteId = typeof body?.rag_site_id === 'string' ? body.rag_site_id : undefined;
  const ragLimit = typeof body?.rag_limit === 'number' ? body.rag_limit : undefined;

  try {
    const wantsEventStream =
      (request.headers.get('Accept') ?? '').toLowerCase().includes('text/event-stream');
    const openrouter = createOpenAI({
      apiKey,
      baseURL: resolveBaseUrl(),
      headers: buildOpenRouterHeaders(),
    });
    const messages = buildChatMessages(message, history);
    const tools = isRagEnabled()
      ? {
          rag_search_sv: createRagSearchTool(ctx, {
            siteId: ragSiteId,
            limit: ragLimit ?? DEFAULT_RAG_LIMIT,
          }),
        }
      : undefined;
    let citations: Citation[] = [];
    const result = streamText({
      model: openrouter.chat(resolveModel()),
      system: SYSTEM_PROMPT,
      messages,
      tools,
      stopWhen: stepCountIs(isRagEnabled() ? 4 : 1),
      onStepFinish: ({ toolResults }) => {
        for (const toolResult of toolResults ?? []) {
          if (toolResult.toolName === 'rag_search_sv') {
            const ragResult = toolResult.output as {
              citations?: Citation[];
            };
            citations = ragResult?.citations ?? [];
          }
        }
      },
    });

    const encoder = new TextEncoder();
    if (wantsEventStream) {
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const writeEvent = (eventName: string, payload: string) => {
            controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${payload}\n\n`));
          };

          try {
            for await (const chunk of result.textStream) {
              writeEvent('text', JSON.stringify(chunk));
            }

            writeEvent('citations', JSON.stringify(citations));
            writeEvent('done', '{}');
            controller.close();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate response.';
            writeEvent('error', JSON.stringify({ message }));
            controller.close();
          }
        },
      });

      headers.set('Content-Type', 'text/event-stream; charset=utf-8');
      headers.set('Cache-Control', 'no-cache');

      return new Response(stream, { status: 200, headers });
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    headers.set('Content-Type', 'text/plain; charset=utf-8');

    return new Response(stream, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate response.';
    return new Response(message, { status: 500, headers });
  }
});

for (const path of CHAT_PATHS) {
  http.route({
    path,
    method: 'OPTIONS',
    handler: optionsHandler,
  });

  http.route({
    path,
    method: 'POST',
    handler: postHandler,
  });
}

export default http;
