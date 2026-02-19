import { action } from './_generated/server';
import { searchRagChunks } from './ragSearch';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { v } from 'convex/values';

const DEFAULT_MODEL = 'gemini-3-flash-preview';
const DEFAULT_RAG_LIMIT = 6;
const SYSTEM_PROMPT =
  'You are Clarus, a helpful Swedish legal assistant. Be clear, concise, and avoid legal advice.';
const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const getApiKey = () => env.GEMINI_API_KEY?.trim();
const resolveModel = () => env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
const isRagEnabled = () => (env.RAG_ENABLED?.trim().toLowerCase() ?? 'true') !== 'false';

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
          query: args.message,
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
    const prompt = buildPrompt(args.message, args.history, ragContext);
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
