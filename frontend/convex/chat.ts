import { internal } from './_generated/api';
import { action, internalMutation, internalQuery } from './_generated/server';
import { searchRagChunks } from './ragSearch';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { v } from 'convex/values';

const DEFAULT_MODEL = 'gemini-3-flash-preview';
const DEFAULT_RAG_LIMIT = 6;
const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHAT_RATE_LIMIT_MAX_REQUESTS = 12;
const MAX_MESSAGE_LENGTH = 4_000;
const SYSTEM_PROMPT =
  'You are Clarus, a helpful Swedish legal assistant. Be clear, concise, and avoid legal advice.';
const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const getApiKey = () => env.GEMINI_API_KEY?.trim();
const resolveModel = () => env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
const isRagEnabled = () => (env.RAG_ENABLED?.trim().toLowerCase() ?? 'true') !== 'false';

type UsageAction = 'chat' | 'document';

type AuthContext = {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>;
  };
};

type ActionContext = {
  runQuery: unknown;
  runMutation: unknown;
};

const requireUserId = async (ctx: AuthContext) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthorized');
  }
  return identity.subject;
};

const enforceActionRateLimit = async (
  ctx: ActionContext,
  userId: string,
  actionType: UsageAction,
  windowMs: number,
  maxRequests: number,
) => {
  const now = Date.now();
  const since = now - windowMs;
  const runQuery = ctx.runQuery as (
    queryRef: unknown,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
  const runMutation = ctx.runMutation as (
    mutationRef: unknown,
    args: Record<string, unknown>,
  ) => Promise<unknown>;

  const usageCount = (await runQuery(internal.chat.countUsageSinceInternal, {
    user_id: userId,
    action: actionType,
    since,
    limit: maxRequests,
  })) as number;

  if (usageCount >= maxRequests) {
    throw new Error('Too many requests. Please wait a moment and try again.');
  }

  await runMutation(internal.chat.recordUsageEventInternal, {
    user_id: userId,
    action: actionType,
    created_at: now,
  });
};

const normalizeRole = (role: string) =>
  role === 'assistant' || role === 'model' ? 'Assistant' : 'User';

const buildPrompt = (
  message: string,
  history?: Array<{ role: string; content: string }>,
  ragContext?: string,
) => {
  const lines = [SYSTEM_PROMPT];

  if (ragContext) {
    lines.push(
      [
        'Use the following retrieval context if it is relevant to the user question.',
        'If the context is insufficient, clearly say what is uncertain.',
        '',
        ragContext,
      ].join('\n'),
    );
  }

  for (const item of history ?? []) {
    lines.push(`${normalizeRole(item.role)}: ${item.content}`);
  }

  lines.push(`User: ${message}`);

  return lines.join('\n\n');
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
    rag_site_id: v.optional(v.string()),
    rag_lang: v.optional(v.string()),
    rag_limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const message = args.message.trim();
    if (!message) {
      throw new Error('Message is required.');
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new Error('Message is too long.');
    }

    await enforceActionRateLimit(
      ctx,
      userId,
      'chat',
      CHAT_RATE_LIMIT_WINDOW_MS,
      CHAT_RATE_LIMIT_MAX_REQUESTS,
    );

    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        answer:
          'Gemini is not configured yet. Set GEMINI_API_KEY in your Convex env to enable chat responses.',
        citations: [],
      };
    }

    let ragContext = '';
    let citations: Array<{
      id: string;
      title: string;
      url: string;
      snippet: string;
      source_type: string;
    }> = [];

    if (isRagEnabled()) {
      try {
        const ragResult = await searchRagChunks(ctx, {
          query: message,
          site_id: args.rag_site_id,
          lang: args.rag_lang,
          limit: args.rag_limit ?? DEFAULT_RAG_LIMIT,
        });

        ragContext = ragResult.context;
        citations = ragResult.citations;
      } catch (error) {
        console.error('RAG search failed for chat request', error);
      }
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const prompt = buildPrompt(message, args.history, ragContext);
    const result = await generateText({
      model: google(resolveModel()),
      prompt,
    });
    const answer = result.text?.trim() || 'No response generated.';

    return {
      answer,
      citations,
    };
  },
});

export const countUsageSinceInternal = internalQuery({
  args: {
    user_id: v.string(),
    action: v.union(v.literal('chat'), v.literal('document')),
    since: v.number(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('actionUsageEvents')
      .withIndex('by_user_action_created', (q) =>
        q.eq('user_id', args.user_id).eq('action', args.action).gt('created_at', args.since),
      )
      .order('desc')
      .take(args.limit);

    return events.length;
  },
});

export const recordUsageEventInternal = internalMutation({
  args: {
    user_id: v.string(),
    action: v.union(v.literal('chat'), v.literal('document')),
    created_at: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('actionUsageEvents', {
      user_id: args.user_id,
      action: args.action,
      created_at: args.created_at,
    });
  },
});
