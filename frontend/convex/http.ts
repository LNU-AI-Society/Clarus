import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { httpRouter } from 'convex/server';

import { httpAction } from './_generated/server';
import { buildChatMessages, createRagSearchTool, SYSTEM_PROMPT } from './chatRag';

const DEFAULT_MODEL = 'gemini-3-flash-preview';
const DEFAULT_ORIGIN = 'http://localhost:5173';
const DEFAULT_RAG_LIMIT = 6;
const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const getApiKey = () => env.GEMINI_API_KEY?.trim();
const resolveModel = () => env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
const isRagEnabled = () => (env.RAG_ENABLED?.trim().toLowerCase() ?? 'true') !== 'false';

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
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get('Origin') ?? env.CLIENT_ORIGIN ?? DEFAULT_ORIGIN;
    return new Response(null, { headers: corsHeaders(origin) });
  }),
});

http.route({
  path: '/chat/stream',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get('Origin') ?? env.CLIENT_ORIGIN ?? DEFAULT_ORIGIN;
    const headers = corsHeaders(origin);
    const apiKey = getApiKey();
    if (!apiKey) {
      return new Response('Gemini API key is not configured.', { status: 500, headers });
    }

    const body = await request.json().catch(() => null);
    if (!body?.message) {
      return new Response('Message is required.', { status: 400, headers });
    }

    try {
      const google = createGoogleGenerativeAI({ apiKey });
      const messages = buildChatMessages(body.message, body.history);
      const tools = isRagEnabled()
        ? {
            rag_search_sv: createRagSearchTool(ctx, {
              siteId: body.rag_site_id,
              limit: body.rag_limit ?? DEFAULT_RAG_LIMIT,
            }),
          }
        : undefined;
      const result = streamText({
        model: google(resolveModel()),
        system: SYSTEM_PROMPT,
        messages,
        tools,
        maxSteps: isRagEnabled() ? 4 : 1,
      });
      const reader = result.textStream.getReader();
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode(value));
        },
        cancel() {
          reader.cancel();
        },
      });

      headers.set('Content-Type', 'text/plain; charset=utf-8');

      return new Response(stream, { status: 200, headers });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate response.';
      return new Response(message, { status: 500, headers });
    }
  }),
});

export default http;
