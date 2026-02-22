import { tool } from 'ai';
import { z } from 'zod';
import { RagSearchResult, searchRagChunks } from './ragSearch';

export const SYSTEM_PROMPT = [
  '<instructions>',
  'You are Clarus, a helpful legal assistant. Be clear, concise, and avoid legal advice.',
  'Reply in the same language as the user. If uncertain, ask which language to use.',
  '</instructions>',
  '',
  '<system-reminder priority="high">',
  'IMPORTANT: Use rag_search_sv when factual or legal grounding is needed.',
  'Rewrite intent into Swedish search queries before calling the tool.',
  'Keep queries short; include Swedish legal terms and synonyms.',
  'If results are empty, broaden terms and retry once.',
  'Use retrieved context and cite sources. If context is insufficient, say so.',
  '</system-reminder>',
  '',
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
    description: [
      '<instructions>',
      'Search Swedish legal sources. Input must be Swedish.',
      '</instructions>',
    ].join('\n'),
    inputSchema: z.object({
      query_sv: z.string().optional().describe('Swedish search query'),
      query: z.string().optional().describe('Fallback query key for compatibility'),
      site_id: z.string().optional().describe('Override site id'),
      limit: z.number().int().positive().optional().describe('Max results'),
    }),
    execute: async ({ query_sv, query, site_id, limit }) => {
      const resolvedQuery = (query_sv?.trim() || query?.trim() || '').trim();
      if (!resolvedQuery) {
        return emptyRagResult();
      }

      const resolvedSiteId = site_id ?? options?.siteId;
      const resolvedLimit = limit ?? options?.limit;

      try {
        const primary = await searchRagChunks(ctx, {
          query: resolvedQuery,
          site_id: resolvedSiteId,
          lang: 'sv',
          limit: resolvedLimit,
        });

        if (primary.total_matches > 0) {
          return primary;
        }

        return await searchRagChunks(ctx, {
          query: resolvedQuery,
          site_id: resolvedSiteId,
          limit: resolvedLimit,
        });
      } catch (error) {
        console.error('RAG tool failed', error);
        return emptyRagResult();
      }
    },
  });
