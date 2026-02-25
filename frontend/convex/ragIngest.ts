import { internal } from './_generated/api';
import { action, internalMutation, internalQuery } from './_generated/server';
import { createOpenAI } from '@ai-sdk/openai';
import { embedMany } from 'ai';
import { v } from 'convex/values';

const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_EMBEDDING_MODEL = 'openai/text-embedding-3-small';
const EXPECTED_EMBEDDING_DIMENSIONS = 1536;
const MAX_CHUNKS_PER_BATCH = 24;
const FINALIZE_PAGE_SIZE = 100;

const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

const chunkInput = v.object({
  chunk_id: v.string(),
  doc_id: v.string(),
  url: v.string(),
  title: v.string(),
  lang: v.optional(v.string()),
  chunk_index: v.number(),
  chunk_text: v.string(),
  chunk_word_count: v.number(),
  start_word: v.number(),
  end_word: v.number(),
  content_hash: v.string(),
  fetched_at: v.string(),
});

const embeddedChunkInput = v.object({
  chunk_id: v.string(),
  doc_id: v.string(),
  url: v.string(),
  title: v.string(),
  lang: v.optional(v.string()),
  chunk_index: v.number(),
  chunk_text: v.string(),
  chunk_word_count: v.number(),
  start_word: v.number(),
  end_word: v.number(),
  content_hash: v.string(),
  fetched_at: v.string(),
  embedding: v.array(v.float64()),
});

function readEnv(name: string): string | undefined {
  const value = env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`${name} is required in Convex environment variables.`);
  }
  return value;
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

function resolveEmbeddingModel(explicitModel: string | undefined): string {
  const selected = explicitModel?.trim();
  if (selected) return selected;
  return readEnv('OPENROUTER_EMBEDDING_MODEL') || DEFAULT_EMBEDDING_MODEL;
}

function assertIngestionAuthorized(authToken: string): void {
  const expected = requireEnv('RAG_INGESTION_SECRET');
  if (authToken !== expected) {
    throw new Error('Invalid ingestion token.');
  }
}

const internalApi = internal as unknown as {
  ragIngest: {
    upsertEmbeddedChunkBatchInternal: unknown;
    deactivateStaleChunksInternal: unknown;
    getActiveChunksPageInternal: unknown;
    deactivateChunksInternal: unknown;
  };
};

export const ingestChunkBatch = action({
  args: {
    auth_token: v.string(),
    run_id: v.string(),
    site_id: v.string(),
    source: v.string(),
    embedding_model: v.optional(v.string()),
    chunks: v.array(chunkInput),
  },
  handler: async (ctx, args) => {
    assertIngestionAuthorized(args.auth_token);
    const runMutation = ctx.runMutation as (
      mutation: unknown,
      args: Record<string, unknown>,
    ) => Promise<unknown>;

    if (args.chunks.length === 0) {
      return {
        embedding_model: resolveEmbeddingModel(args.embedding_model),
        embedding_dimensions: EXPECTED_EMBEDDING_DIMENSIONS,
        embedding_tokens: 0,
        inserted_chunks: 0,
        updated_chunks: 0,
      };
    }

    if (args.chunks.length > MAX_CHUNKS_PER_BATCH) {
      throw new Error(`Chunk batch size cannot exceed ${MAX_CHUNKS_PER_BATCH}.`);
    }

    const apiKey = requireEnv('OPENROUTER_API_KEY');
    const baseURL = readEnv('OPENROUTER_BASE_URL') || DEFAULT_OPENROUTER_BASE_URL;
    const embeddingModel = resolveEmbeddingModel(args.embedding_model);
    const openrouter = createOpenAI({ apiKey, baseURL });

    const { embeddings, usage } = await embedMany({
      model: openrouter.embedding(embeddingModel),
      values: args.chunks.map((chunk) => chunk.chunk_text),
      headers: buildOpenRouterHeaders(),
    });

    if (embeddings.length !== args.chunks.length) {
      throw new Error('Embedding response size does not match the input batch size.');
    }

    const embeddingDimensions = embeddings[0]?.length ?? 0;
    if (embeddingDimensions !== EXPECTED_EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding dimensions mismatch: expected ${EXPECTED_EMBEDDING_DIMENSIONS}, received ${embeddingDimensions}.`,
      );
    }

    const records = args.chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
    }));

    const upsertResult = (await runMutation(
      internalApi.ragIngest.upsertEmbeddedChunkBatchInternal,
      {
        run_id: args.run_id,
        site_id: args.site_id,
        source: args.source,
        embedding_model: embeddingModel,
        embedding_dimensions: embeddingDimensions,
        records,
      },
    )) as { inserted_chunks: number; updated_chunks: number };

    return {
      ...upsertResult,
      embedding_model: embeddingModel,
      embedding_dimensions: embeddingDimensions,
      embedding_tokens: usage?.tokens ?? 0,
    };
  },
});

export const finalizeIngestionRun = action({
  args: {
    auth_token: v.string(),
    run_id: v.string(),
    site_id: v.string(),
    embedding_model: v.optional(v.string()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertIngestionAuthorized(args.auth_token);
    const runMutation = ctx.runMutation as (
      mutation: unknown,
      args: Record<string, unknown>,
    ) => Promise<unknown>;
    const runQuery = ctx.runQuery as (
      query: unknown,
      args: Record<string, unknown>,
    ) => Promise<unknown>;

    const embeddingModel = resolveEmbeddingModel(args.embedding_model);
    const page = (await runQuery(internalApi.ragIngest.getActiveChunksPageInternal, {
      site_id: args.site_id,
      embedding_model: embeddingModel,
      cursor: args.cursor,
      page_size: FINALIZE_PAGE_SIZE,
    })) as {
      entries: Array<{ id: string; last_seen_run_id: string }>;
      continue_cursor: string | null;
      is_done: boolean;
    };

    const idsToDeactivate = page.entries
      .filter((entry) => entry.last_seen_run_id !== args.run_id)
      .map((entry) => entry.id);

    let deactivatedChunks = 0;
    if (idsToDeactivate.length > 0) {
      const mutationResult = (await runMutation(internalApi.ragIngest.deactivateChunksInternal, {
        ids: idsToDeactivate,
      })) as { deactivated_chunks: number };
      deactivatedChunks = mutationResult.deactivated_chunks;
    }

    return {
      deactivated_chunks: deactivatedChunks,
      active_chunks: null as number | null,
      continue_cursor: page.continue_cursor,
      is_done: page.is_done,
    };
  },
});

export const upsertEmbeddedChunkBatchInternal = internalMutation({
  args: {
    run_id: v.string(),
    site_id: v.string(),
    source: v.string(),
    embedding_model: v.string(),
    embedding_dimensions: v.number(),
    records: v.array(embeddedChunkInput),
  },
  handler: async (ctx, args) => {
    let insertedChunks = 0;
    let updatedChunks = 0;
    const now = Date.now();

    for (const record of args.records) {
      const existing = await ctx.db
        .query('ragChunks')
        .withIndex('by_site_chunk_model', (q) =>
          q
            .eq('site_id', args.site_id)
            .eq('chunk_id', record.chunk_id)
            .eq('embedding_model', args.embedding_model),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          source: args.source,
          doc_id: record.doc_id,
          url: record.url,
          title: record.title,
          lang: record.lang,
          chunk_text: record.chunk_text,
          chunk_index: record.chunk_index,
          chunk_word_count: record.chunk_word_count,
          start_word: record.start_word,
          end_word: record.end_word,
          content_hash: record.content_hash,
          fetched_at: record.fetched_at,
          last_seen_run_id: args.run_id,
          embedding_dimensions: args.embedding_dimensions,
          embedding: record.embedding,
          is_active: true,
          updated_at: now,
        });
        updatedChunks += 1;
        continue;
      }

      await ctx.db.insert('ragChunks', {
        site_id: args.site_id,
        source: args.source,
        doc_id: record.doc_id,
        chunk_id: record.chunk_id,
        url: record.url,
        title: record.title,
        lang: record.lang,
        chunk_text: record.chunk_text,
        chunk_index: record.chunk_index,
        chunk_word_count: record.chunk_word_count,
        start_word: record.start_word,
        end_word: record.end_word,
        content_hash: record.content_hash,
        fetched_at: record.fetched_at,
        last_seen_run_id: args.run_id,
        embedding_model: args.embedding_model,
        embedding_dimensions: args.embedding_dimensions,
        embedding: record.embedding,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
      insertedChunks += 1;
    }

    return {
      inserted_chunks: insertedChunks,
      updated_chunks: updatedChunks,
    };
  },
});

export const deactivateStaleChunksInternal = internalMutation({
  args: {
    run_id: v.string(),
    site_id: v.string(),
    embedding_model: v.string(),
  },
  handler: async (ctx, args) => {
    const activeChunks = await ctx.db
      .query('ragChunks')
      .withIndex('by_site_model_active', (q) =>
        q
          .eq('site_id', args.site_id)
          .eq('embedding_model', args.embedding_model)
          .eq('is_active', true),
      )
      .collect();

    let deactivatedChunks = 0;
    const now = Date.now();

    for (const chunk of activeChunks) {
      if (chunk.last_seen_run_id === args.run_id) {
        continue;
      }

      await ctx.db.patch(chunk._id, {
        is_active: false,
        updated_at: now,
      });
      deactivatedChunks += 1;
    }

    return {
      deactivated_chunks: deactivatedChunks,
      active_chunks: activeChunks.length - deactivatedChunks,
    };
  },
});

export const getActiveChunksPageInternal = internalQuery({
  args: {
    site_id: v.string(),
    embedding_model: v.string(),
    cursor: v.optional(v.string()),
    page_size: v.number(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query('ragChunks')
      .withIndex('by_site_model_active', (q) =>
        q
          .eq('site_id', args.site_id)
          .eq('embedding_model', args.embedding_model)
          .eq('is_active', true),
      )
      .paginate({
        cursor: args.cursor ?? null,
        numItems: Math.max(1, args.page_size),
      });

    return {
      entries: page.page.map((chunk) => ({
        id: chunk._id,
        last_seen_run_id: chunk.last_seen_run_id,
      })),
      continue_cursor: page.continueCursor ?? null,
      is_done: page.isDone,
    };
  },
});

export const deactivateChunksInternal = internalMutation({
  args: {
    ids: v.array(v.id('ragChunks')),
  },
  handler: async (ctx, args) => {
    let deactivatedChunks = 0;
    const now = Date.now();

    for (const id of args.ids) {
      const chunk = await ctx.db.get(id);
      if (!chunk || !chunk.is_active) {
        continue;
      }

      await ctx.db.patch(id, {
        is_active: false,
        updated_at: now,
      });
      deactivatedChunks += 1;
    }

    return {
      deactivated_chunks: deactivatedChunks,
    };
  },
});
