import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { v } from 'convex/values';

import { action } from './_generated/server';

const DEFAULT_MODEL = 'gemini-3-flash-preview';
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
    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        answer:
          'Gemini is not configured yet. Set GEMINI_API_KEY in your Convex env to enable chat responses.',
        citations: [],
      };
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const prompt = buildPrompt(args.message, args.history);
    const result = await generateText({
      model: google(resolveModel()),
      prompt,
    });
    const answer = result.text?.trim() || 'No response generated.';

    return {
      answer,
      citations: [],
    };
  },
});
