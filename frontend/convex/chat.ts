import { action } from "./_generated/server";
import { v } from 'convex/values';

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
    const summary = args.history && args.history.length > 0 ? 'I reviewed your recent context.' : '';
    return {
      answer: `Thanks for your question: "${args.message}". ${summary} (Convex migration stub)`,
      citations: [],
    };
  },
});
