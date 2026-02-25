import { internal } from './_generated/api';
import { action, internalQuery } from './_generated/server';
import { createOpenAI } from '@ai-sdk/openai';
import { embed, generateText } from 'ai';
import { v } from 'convex/values';
import { getLanguageLabel, normalizeLanguageTag } from '../src/i18n/languages';

const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_EMBEDDING_MODEL = 'openai/text-embedding-3-small';
const DEFAULT_TRANSLATION_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_SITE_ID = 'migrationsverket';
const EXPECTED_EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;
const MAX_CANDIDATES = 256;
const MAX_CONTEXT_CHARS = 9000;
const SNIPPET_MAX_CHARS = 280;

const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

interface RagCitation {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source_type: string;
}

interface RagChunkSummary {
  id: string;
  chunk_id: string;
  doc_id: string;
  source: string;
  title: string;
  url: string;
  lang?: string;
  chunk_text: string;
  content_hash: string;
  embedding_model: string;
  is_active: boolean;
}

export interface RagSearchResult {
  context: string;
  citations: RagCitation[];
  embedding_model: string;
  total_candidates: number;
  total_matches: number;
}

interface SearchRagArgs {
  query: string;
  site_id?: string;
  lang?: string;
  target_lang?: string;
  limit?: number;
  embedding_model?: string;
}

interface SearchCtx {
  vectorSearch: unknown;
  runQuery: unknown;
}

const internalApi = internal as unknown as {
  ragSearch: {
    getChunksByIdsInternal: unknown;
  };
};

function readEnv(name: string): string | undefined {
  const value = env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildOpenRouterHeaders(): Record<string, string> | undefined {
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
}

function resolveSiteId(explicitSiteId?: string): string {
  const fromArg = explicitSiteId?.trim();
  if (fromArg) {
    return fromArg;
  }
  return readEnv('RAG_DEFAULT_SITE_ID') || DEFAULT_SITE_ID;
}

function resolveEmbeddingModel(explicitModel?: string): string {
  const fromArg = explicitModel?.trim();
  if (fromArg) {
    return fromArg;
  }
  return readEnv('OPENROUTER_EMBEDDING_MODEL') || DEFAULT_EMBEDDING_MODEL;
}

function resolveTranslationModel(): string {
  return readEnv('OPENROUTER_TRANSLATION_MODEL') || readEnv('OPENROUTER_MODEL') || DEFAULT_TRANSLATION_MODEL;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeQuery(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildSnippet(value: string): string {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= SNIPPET_MAX_CHARS) {
    return normalized;
  }
  return `${normalized.slice(0, SNIPPET_MAX_CHARS - 1).trimEnd()}…`;
}

function normalizeLimit(input?: number): number {
  if (!input || Number.isNaN(input)) {
    return DEFAULT_LIMIT;
  }
  const floored = Math.floor(input);
  return Math.max(1, Math.min(MAX_LIMIT, floored));
}

async function translateText(
  openrouter: ReturnType<typeof createOpenAI>,
  model: string,
  text: string,
  targetLang: string,
): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const languageLabel = getLanguageLabel(targetLang);
  const system = [
    'You are a translation engine.',
    `Translate the input to ${languageLabel}.`,
    'Preserve legal terminology, names, numbers, and URLs.',
    'Return only the translated text with no commentary.',
  ].join(' ');

  try {
    const result = await generateText({
      model: openrouter.chat(model),
      system,
      prompt: trimmed,
    });
    return result.text?.trim() || null;
  } catch (error) {
    console.warn('RAG translation failed', error);
    return null;
  }
}

function emptyResult(embeddingModel: string): RagSearchResult {
  return {
    context: '',
    citations: [],
    embedding_model: embeddingModel,
    total_candidates: 0,
    total_matches: 0,
  };
}

export async function searchRagChunks(
  ctx: SearchCtx,
  args: SearchRagArgs,
): Promise<RagSearchResult> {
  const query = normalizeQuery(args.query);
  const siteId = resolveSiteId(args.site_id);
  const embeddingModel = resolveEmbeddingModel(args.embedding_model);
  const filterLang = normalizeLanguageTag(args.lang);
  const targetLang = normalizeLanguageTag(args.target_lang);

  if (!query || !siteId) {
    return emptyResult(embeddingModel);
  }

  const apiKey = readEnv('OPENROUTER_API_KEY');
  if (!apiKey) {
    return emptyResult(embeddingModel);
  }

  const baseURL = readEnv('OPENROUTER_BASE_URL') || DEFAULT_OPENROUTER_BASE_URL;
  const openrouter = createOpenAI({
    apiKey,
    baseURL,
    headers: buildOpenRouterHeaders(),
  });
  const { embedding } = await embed({
    model: openrouter.embedding(embeddingModel),
    value: query,
    headers: buildOpenRouterHeaders(),
  });

  if (embedding.length !== EXPECTED_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Query embedding dimensions mismatch: expected ${EXPECTED_EMBEDDING_DIMENSIONS}, received ${embedding.length}.`,
    );
  }

  const limit = normalizeLimit(args.limit);
  const candidateLimit = Math.min(MAX_CANDIDATES, Math.max(limit * 8, limit));
  const vectorSearch = ctx.vectorSearch as (
    tableName: string,
    indexName: string,
    query: {
      vector: number[];
      limit?: number;
      filter?: (q: { eq: (field: string, value: unknown) => unknown }) => unknown;
    },
  ) => Promise<Array<{ _id: string; _score: number }>>;
  const vectorHits = await vectorSearch('ragChunks', 'by_embedding', {
    vector: embedding as number[],
    limit: candidateLimit,
    filter: (q) => q.eq('site_id', siteId),
  });

  if (vectorHits.length === 0) {
    return emptyResult(embeddingModel);
  }

  const runQuery = ctx.runQuery as (
    queryRef: unknown,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
  const chunkRows = (await runQuery(internalApi.ragSearch.getChunksByIdsInternal, {
    ids: vectorHits.map((hit) => hit._id),
  })) as RagChunkSummary[];

  const byId = new Map(chunkRows.map((chunk) => [chunk.id, chunk]));
  const selected: RagChunkSummary[] = [];
  const seenContent = new Set<string>();

  for (const hit of vectorHits) {
    const chunk = byId.get(hit._id);
    if (!chunk || !chunk.is_active) {
      continue;
    }
    if (chunk.embedding_model !== embeddingModel) {
      continue;
    }
    const chunkLang = normalizeLanguageTag(chunk.lang);
    if (filterLang && chunkLang !== filterLang) {
      continue;
    }
    if (seenContent.has(chunk.content_hash)) {
      continue;
    }

    seenContent.add(chunk.content_hash);
    selected.push(chunk);

    if (selected.length >= limit) {
      break;
    }
  }

  if (selected.length === 0) {
    return {
      ...emptyResult(embeddingModel),
      total_candidates: vectorHits.length,
    };
  }

  const translationModel = targetLang ? resolveTranslationModel() : null;
  const contextChunks: Array<{
    chunk: RagChunkSummary;
    context_title: string;
    context_text: string;
  }> = [];

  for (const chunk of selected) {
    if (!targetLang || !translationModel) {
      contextChunks.push({
        chunk,
        context_title: chunk.title,
        context_text: chunk.chunk_text,
      });
      continue;
    }

    const chunkLang = normalizeLanguageTag(chunk.lang);
    if (chunkLang && chunkLang === targetLang) {
      contextChunks.push({
        chunk,
        context_title: chunk.title,
        context_text: chunk.chunk_text,
      });
      continue;
    }

    const translatedTitle = await translateText(openrouter, translationModel, chunk.title, targetLang);
    const translatedText = await translateText(openrouter, translationModel, chunk.chunk_text, targetLang);
    if (!translatedTitle || !translatedText) {
      continue;
    }

    contextChunks.push({
      chunk,
      context_title: translatedTitle,
      context_text: translatedText,
    });
  }

  if (contextChunks.length === 0) {
    return {
      ...emptyResult(embeddingModel),
      total_candidates: vectorHits.length,
    };
  }

  const citations: RagCitation[] = [];
  const sections: string[] = [];
  let usedChars = 0;

  for (const { chunk, context_title, context_text } of contextChunks) {
    const cleanText = normalizeWhitespace(context_text);
    if (!cleanText) {
      continue;
    }

    const sourceIndex = citations.length + 1;
    const header = `[${sourceIndex}] ${context_title}\nURL: ${chunk.url}\n`;
    const remaining = MAX_CONTEXT_CHARS - usedChars - header.length;
    if (remaining <= 120) {
      break;
    }

    const body =
      cleanText.length <= remaining
        ? cleanText
        : `${cleanText.slice(0, Math.max(0, remaining - 1)).trimEnd()}…`;

    const block = `${header}${body}`;
    sections.push(block);
    usedChars += block.length + 2;

    citations.push({
      id: chunk.chunk_id,
      title: context_title,
      url: chunk.url,
      snippet: buildSnippet(cleanText),
      source_type: 'web',
    });
  }

  return {
    context: sections.join('\n\n'),
    citations,
    embedding_model: embeddingModel,
    total_candidates: vectorHits.length,
    total_matches: citations.length,
  };
}

export const searchChunks = action({
  args: {
    query: v.string(),
    site_id: v.optional(v.string()),
    lang: v.optional(v.string()),
    target_lang: v.optional(v.string()),
    limit: v.optional(v.number()),
    embedding_model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await searchRagChunks(ctx, args);
  },
});

export const getChunksByIdsInternal = internalQuery({
  args: {
    ids: v.array(v.id('ragChunks')),
  },
  handler: async (ctx, args) => {
    const chunks: RagChunkSummary[] = [];

    for (const id of args.ids) {
      const chunk = await ctx.db.get(id);
      if (!chunk) {
        continue;
      }

      chunks.push({
        id: chunk._id,
        chunk_id: chunk.chunk_id,
        doc_id: chunk.doc_id,
        source: chunk.source,
        title: chunk.title,
        url: chunk.url,
        lang: chunk.lang,
        chunk_text: chunk.chunk_text,
        content_hash: chunk.content_hash,
        embedding_model: chunk.embedding_model,
        is_active: chunk.is_active,
      });
    }

    return chunks;
  },
});
