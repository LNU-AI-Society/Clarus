import { action } from "./_generated/server";
import { v } from 'convex/values';

export const analyzeDocument = action({
  args: {
    filename: v.string(),
    fileType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (_ctx, args) => ({
    summary: `This is a preliminary analysis for ${args.filename}.`,
    key_points: [
      `File type: ${args.fileType || 'unknown'}.`,
      `File size: ${args.size ? `${args.size} bytes` : 'unknown size'}.`,
      'Full parsing will be added in the next migration step.',
    ],
    risks: ['Document parsing is not enabled yet.'],
    suggested_questions: [
      'Which clauses are most important?',
      'Are there any deadlines mentioned?',
      'Do I need supporting documentation?',
    ],
  }),
});
