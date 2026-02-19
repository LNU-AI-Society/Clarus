import { httpAction } from './_generated/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { httpRouter } from 'convex/server';

const DEFAULT_MODEL = 'gemini-3-flash-preview';
const DEFAULT_ORIGIN = 'http://localhost:5173';
const SYSTEM_PROMPT =
  'You are Clarus, a helpful Swedish legal assistant. Be clear, concise, and avoid legal advice.';
const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const getApiKey = () => env.GEMINI_API_KEY?.trim();
const resolveModel = () => env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

const normalizeRole = (role: string) =>
  role === 'assistant' || role === 'model' ? 'Assistant' : 'User';

const buildPrompt = (message: string, history?: Array<{ role: string; content: string }>) => {
  const lines = [SYSTEM_PROMPT];

  for (const item of history ?? []) {
    lines.push(`${normalizeRole(item.role)}: ${item.content}`);
  }

  lines.push(`User: ${message}`);

  return lines.join('\n\n');
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
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get('Origin') ?? env.CLIENT_ORIGIN ?? DEFAULT_ORIGIN;
    const headers = corsHeaders(origin);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response('Unauthorized', { status: 401, headers });
    }

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
      const prompt = buildPrompt(body.message, body.history);
      const result = streamText({
        model: google(resolveModel()),
        prompt,
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
