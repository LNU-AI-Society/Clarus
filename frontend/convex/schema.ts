import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const RAG_EMBEDDING_DIMENSIONS = 1536;

export default defineSchema({
  guidedSessions: defineTable({
    user_id: v.optional(v.string()),
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
  }).index('by_user_created', ['user_id', 'created_at']),
  chatConversations: defineTable({
    user_id: v.string(),
    title: v.string(),
    last_message_preview: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
    last_message_at: v.number(),
  })
    .index('by_user_created', ['user_id', 'created_at'])
    .index('by_user_last_message', ['user_id', 'last_message_at']),
  chatMessages: defineTable({
    user_id: v.optional(v.string()),
    conversation_id: v.optional(v.id('chatConversations')),
    role: v.string(),
    content: v.string(),
    is_error: v.optional(v.boolean()),
    citations: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          url: v.string(),
          snippet: v.string(),
          source_type: v.string(),
        }),
      ),
    ),
    analysis: v.optional(
      v.object({
        summary: v.string(),
        key_points: v.array(v.string()),
        risks: v.array(v.string()),
        suggested_questions: v.array(v.string()),
      }),
    ),
    created_at: v.number(),
  })
    .index('by_conversation_created', ['conversation_id', 'created_at'])
    .index('by_user_created', ['user_id', 'created_at']),
  actionUsageEvents: defineTable({
    user_id: v.string(),
    action: v.string(),
    created_at: v.number(),
  }).index('by_user_action_created', ['user_id', 'action', 'created_at']),
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
