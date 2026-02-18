import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const RAG_EMBEDDING_DIMENSIONS = 1536;

export default defineSchema({
  guidedSessions: defineTable({
    workflow_id: v.string(),
    current_step_id: v.optional(v.string()),
    answers: v.record(v.string(), v.string()),
    is_complete: v.boolean(),
    tasks: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        due_date: v.optional(v.string()),
      }),
    ),
    warnings: v.array(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  }),
  chatMessages: defineTable({
    role: v.string(),
    content: v.string(),
    created_at: v.number(),
  }),
  ragChunks: defineTable({
    site_id: v.string(),
    source: v.string(),
    doc_id: v.string(),
    chunk_id: v.string(),
    url: v.string(),
    title: v.string(),
    lang: v.optional(v.string()),
    chunk_text: v.string(),
    chunk_index: v.number(),
    chunk_word_count: v.number(),
    start_word: v.number(),
    end_word: v.number(),
    content_hash: v.string(),
    fetched_at: v.string(),
    last_seen_run_id: v.string(),
    embedding_model: v.string(),
    embedding_dimensions: v.number(),
    embedding: v.array(v.float64()),
    is_active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index('by_site_chunk_model', ['site_id', 'chunk_id', 'embedding_model'])
    .index('by_site_model_active', ['site_id', 'embedding_model', 'is_active'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: RAG_EMBEDDING_DIMENSIONS,
      filterFields: ['embedding_model', 'site_id', 'lang', 'is_active'],
    }),
});
