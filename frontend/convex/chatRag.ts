import { tool } from 'ai';
import { z } from 'zod';
import { RagSearchResult, searchRagChunks } from './ragSearch';

export const SYSTEM_PROMPT = [
  'You are Clarus, a helpful legal assistant. Be clear, concise, and avoid legal advice.',
  "Answer in the user's language.",
  '',
  'When factual or legal grounding is needed, call tool rag_search_sv.',
  'Before calling, rewrite the user intent into Swedish search queries.',
  'Keep queries short and focused; include Swedish legal terms and synonyms.',
  'If results are empty, broaden Swedish terms and retry once (tool also falls back).',
  '',
  'Use retrieved context and cite sources. If context is insufficient, say so.',
  'Do not call the tool for greetings or general chit-chat.',
].join('\n');

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const emptyRagResult = (): RagSearchResult => ({
  context: '',
  citations: [],
  embedding_model: 'unknown',
  total_candidates: 0,
  total_matches: 0,
});

const normalizeMessageRole = (role: string): ChatMessage['role'] =>
  role === 'assistant' || role === 'model' ? 'assistant' : 'user';

export const buildChatMessages = (
  message: string,
  history?: Array<{ role: string; content: string }>,
): ChatMessage[] => {
  const messages = (history ?? []).map((item) => ({
    role: normalizeMessageRole(item.role),
    content: item.content,
  }));

  messages.push({ role: 'user', content: message });
  return messages;
};

type SearchContext = Parameters<typeof searchRagChunks>[0];

export const createRagSearchTool = (
  ctx: SearchContext,
  options?: { siteId?: string; limit?: number },
) =>
  tool({
    description: 'Search Swedish legal sources. Input must be Swedish.',
    parameters: z.object({
      query_sv: z.string().min(1).describe('Swedish search query'),
      site_id: z.string().optional().describe('Override site id'),
      limit: z.number().int().positive().optional().describe('Max results'),
    }),
    execute: async ({ query_sv, site_id, limit }) => {
      const resolvedSiteId = site_id ?? options?.siteId;
      const resolvedLimit = limit ?? options?.limit;

      try {
        const primary = await searchRagChunks(ctx, {
          query: query_sv,
          site_id: resolvedSiteId,
          lang: 'sv',
          limit: resolvedLimit,
        });

        if (primary.total_matches > 0) {
          return primary;
        }

        return await searchRagChunks(ctx, {
          query: query_sv,
          site_id: resolvedSiteId,
          limit: resolvedLimit,
        });
      } catch (error) {
        console.error('RAG tool failed', error);
        return emptyRagResult();
      }
    },
  });
