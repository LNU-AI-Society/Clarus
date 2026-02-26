import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { action, internalMutation, internalQuery, mutation, query } from './_generated/server';
import { buildChatMessages, buildSystemPrompt, createRagSearchTool } from './chatRag';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, stepCountIs } from 'ai';
import { v } from 'convex/values';

const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_RAG_LIMIT = 6;
const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHAT_RATE_LIMIT_MAX_REQUESTS = 12;
const MAX_MESSAGE_LENGTH = 4_000;
const DEFAULT_CONVERSATION_TITLE = '';
const LEGACY_DEFAULT_CONVERSATION_TITLE = 'New chat';
const MAX_CONVERSATION_TITLE_LENGTH = 80;
const MAX_PREVIEW_LENGTH = 140;
const DEFAULT_CONVERSATION_LIST_LIMIT = 50;
const MAX_CONVERSATION_LIST_LIMIT = 100;
const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const readEnv = (name: string) => env[name]?.trim() || undefined;
const getApiKey = () => readEnv('OPENROUTER_API_KEY');
const resolveModel = () => readEnv('OPENROUTER_MODEL') || DEFAULT_MODEL;
const resolveBaseUrl = () => readEnv('OPENROUTER_BASE_URL') || DEFAULT_OPENROUTER_BASE_URL;
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

const citationValidator = v.object({
  id: v.string(),
  title: v.string(),
  url: v.string(),
  snippet: v.string(),
  source_type: v.string(),
});

const analysisValidator = v.object({
  summary: v.string(),
  key_points: v.array(v.string()),
  risks: v.array(v.string()),
  suggested_questions: v.array(v.string()),
});

const clampLimit = (value: number) =>
  Math.max(1, Math.min(MAX_CONVERSATION_LIST_LIMIT, Math.floor(value)));

const truncate = (value: string, maxLength: number) => {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return '';
  }
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3).trimEnd()}...`
    : normalized;
};

const buildConversationTitle = (seed?: string) => {
  if (!seed) {
    return DEFAULT_CONVERSATION_TITLE;
  }
  const candidate = truncate(seed, MAX_CONVERSATION_TITLE_LENGTH);
  return candidate || DEFAULT_CONVERSATION_TITLE;
};

const buildMessagePreview = (content: string) => truncate(content, MAX_PREVIEW_LENGTH);

const mapConversation = (conversation: Doc<'chatConversations'>) => ({
  id: conversation._id,
  title: conversation.title,
  last_message_preview: conversation.last_message_preview,
  created_at: conversation.created_at,
  updated_at: conversation.updated_at,
  last_message_at: conversation.last_message_at,
});

const mapChatMessage = (message: Doc<'chatMessages'>) => ({
  id: message._id,
  role: message.role === 'user' ? 'user' : 'model',
  text: message.content,
  isError: message.is_error,
  citations: message.citations,
  analysis: message.analysis,
});

const assertConversationOwner = async (
  ctx: { db: { get: (id: Id<'chatConversations'>) => Promise<Doc<'chatConversations'> | null> } },
  conversationId: Id<'chatConversations'>,
  userId: string,
) => {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation || conversation.user_id !== userId) {
    throw new Error('Conversation not found');
  }
  return conversation;
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
          'OpenRouter is not configured yet. Set OPENROUTER_API_KEY in your Convex env to enable chat responses.',
        citations: [],
      };
    }

    const openrouter = createOpenAI({
      apiKey,
      baseURL: resolveBaseUrl(),
      headers: buildOpenRouterHeaders(),
    });
    const messages = buildChatMessages(message, args.history);
    const ragLang = args.rag_lang?.trim() || undefined;
    const tools = isRagEnabled()
      ? {
          rag_search_sv: createRagSearchTool(ctx, {
            siteId: args.rag_site_id,
            limit: args.rag_limit ?? DEFAULT_RAG_LIMIT,
            targetLang: ragLang,
          }),
        }
      : undefined;
    let citations: Array<{
      id: string;
      title: string;
      url: string;
      snippet: string;
      source_type: string;
    }> = [];

    try {
      const result = await generateText({
        model: openrouter.chat(resolveModel()),
        system: buildSystemPrompt(ragLang),
        messages,
        tools,
        stopWhen: stepCountIs(isRagEnabled() ? 4 : 1),
        onStepFinish: ({ toolResults }) => {
          for (const toolResult of toolResults ?? []) {
            if (toolResult.toolName === 'rag_search_sv') {
              const ragResult = toolResult.output as {
                citations?: typeof citations;
              };
              citations = ragResult?.citations ?? [];
            }
          }
        },
      });

      if (!result.text?.trim()) {
        console.warn('Chat returned empty text', {
          finishReason: result.finishReason,
          rawFinishReason: result.rawFinishReason,
          steps: result.steps.map((step) => ({
            finishReason: step.finishReason,
            rawFinishReason: step.rawFinishReason,
            toolCalls: step.toolCalls.length,
            toolResults: step.toolResults.length,
            textLength: step.text.length,
          })),
        });
      }
      const answer = result.text?.trim() || 'No response generated.';

      return {
        answer,
        citations,
      };
    } catch (error) {
      const providerError = error as {
        message?: string;
        statusCode?: number;
        url?: string;
        responseBody?: unknown;
      };
      console.error('Chat provider call failed', {
        message: providerError.message,
        statusCode: providerError.statusCode,
        url: providerError.url,
        responseBody: providerError.responseBody,
      });
      throw error;
    }
  },
});

export const listConversations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const limit = clampLimit(args.limit ?? DEFAULT_CONVERSATION_LIST_LIMIT);
    const conversations = await ctx.db
      .query('chatConversations')
      .withIndex('by_user_last_message', (q) => q.eq('user_id', userId))
      .order('desc')
      .take(limit);

    return conversations.map(mapConversation);
  },
});

export const getConversationMessages = query({
  args: {
    conversationId: v.id('chatConversations'),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await assertConversationOwner(ctx, args.conversationId, userId);

    const messages = await ctx.db
      .query('chatMessages')
      .withIndex('by_conversation_created', (q) => q.eq('conversation_id', args.conversationId))
      .order('asc')
      .collect();

    return messages.map(mapChatMessage);
  },
});

export const createConversation = mutation({
  args: {
    initialMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const title = buildConversationTitle(args.initialMessage);
    const preview = args.initialMessage ? buildMessagePreview(args.initialMessage) : '';

    const conversationId = await ctx.db.insert('chatConversations', {
      user_id: userId,
      title,
      last_message_preview: preview,
      created_at: now,
      updated_at: now,
      last_message_at: now,
    });

    const created = await ctx.db.get(conversationId);
    if (!created) {
      throw new Error('Failed to create conversation');
    }

    return mapConversation(created);
  },
});

export const appendMessage = mutation({
  args: {
    conversationId: v.id('chatConversations'),
    role: v.union(v.literal('user'), v.literal('model')),
    content: v.string(),
    isError: v.optional(v.boolean()),
    citations: v.optional(v.array(citationValidator)),
    analysis: v.optional(analysisValidator),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const conversation = await assertConversationOwner(ctx, args.conversationId, userId);
    const content = args.content.trim();

    if (!content) {
      throw new Error('Message content is required.');
    }

    const createdAt = args.createdAt ?? Date.now();
    const messageId = await ctx.db.insert('chatMessages', {
      user_id: userId,
      conversation_id: args.conversationId,
      role: args.role,
      content,
      is_error: args.isError,
      citations: args.citations,
      analysis: args.analysis,
      created_at: createdAt,
    });

    const updates: {
      title?: string;
      updated_at: number;
      last_message_at: number;
      last_message_preview: string;
    } = {
      updated_at: createdAt,
      last_message_at: createdAt,
      last_message_preview: buildMessagePreview(content),
    };

    if (
      args.role === 'user' &&
      (conversation.title === DEFAULT_CONVERSATION_TITLE ||
        conversation.title === LEGACY_DEFAULT_CONVERSATION_TITLE)
    ) {
      updates.title = buildConversationTitle(content);
    }

    await ctx.db.patch(args.conversationId, updates);

    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error('Failed to store message');
    }

    return mapChatMessage(message);
  },
});

export const deleteConversation = mutation({
  args: {
    conversationId: v.id('chatConversations'),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await assertConversationOwner(ctx, args.conversationId, userId);

    const messages = await ctx.db
      .query('chatMessages')
      .withIndex('by_conversation_created', (q) => q.eq('conversation_id', args.conversationId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    await ctx.db.delete(args.conversationId);
    return { deletedMessages: messages.length };
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
