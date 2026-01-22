import { httpAction } from './_generated/server';
import { httpRouter } from 'convex/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_ORIGIN = 'http://localhost:5173';
const SYSTEM_PROMPT =
  'You are Clarus, a helpful Swedish legal assistant. Be clear, concise, and avoid legal advice.';
const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

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

    return new Response(openRouterResponse.body, { status: 200, headers });
  }),
});

export default http;
