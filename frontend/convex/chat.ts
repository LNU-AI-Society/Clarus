import { action } from './_generated/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { v } from 'convex/values';
import { buildChatMessages, createRagSearchTool, SYSTEM_PROMPT } from './chatRag';

const DEFAULT_MODEL = 'gemini-3-flash-preview';
const DEFAULT_RAG_LIMIT = 6;
const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const getApiKey = () => env.GEMINI_API_KEY?.trim();
const resolveModel = () => env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
const isRagEnabled = () => (env.RAG_ENABLED?.trim().toLowerCase() ?? 'true') !== 'false';

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
          'Gemini is not configured yet. Set GEMINI_API_KEY in your Convex env to enable chat responses.',
        citations: [],
      };
    }

    const google = createGoogleGenerativeAI({ apiKey });
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

    const result = await generateText({
      model: google(resolveModel()),
      system: SYSTEM_PROMPT,
      messages,
      tools,
      maxSteps: isRagEnabled() ? 4 : 1,
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
    const answer = result.text?.trim() || 'No response generated.';

    return {
      answer,
      citations,
    };
  },
});
