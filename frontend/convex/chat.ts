import { action } from './_generated/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, stepCountIs } from 'ai';
import { v } from 'convex/values';
import { buildChatMessages, createRagSearchTool, SYSTEM_PROMPT } from './chatRag';

const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_RAG_LIMIT = 6;
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
    const messages = buildChatMessages(args.message, args.history);
    const tools = isRagEnabled()
      ? {
          rag_search_sv: createRagSearchTool(ctx, {
            siteId: args.rag_site_id,
            limit: args.rag_limit ?? DEFAULT_RAG_LIMIT,
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
        system: SYSTEM_PROMPT,
        messages,
        tools,
        stopWhen: stepCountIs(isRagEnabled() ? 4 : 1),
        onStepFinish: ({ toolResults }) => {
          for (const toolResult of toolResults ?? []) {
            if (toolResult.toolName === 'rag_search_sv') {
              const ragResult = toolResult.result as {
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
