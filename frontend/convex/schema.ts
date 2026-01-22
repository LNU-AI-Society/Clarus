import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

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
});
