import { internal } from './_generated/api';
import { action } from './_generated/server';
import { v } from 'convex/values';

const DOCUMENT_RATE_LIMIT_WINDOW_MS = 5 * 60_000;
const DOCUMENT_RATE_LIMIT_MAX_REQUESTS = 5;

type AuthContext = {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>;
  };
};

const requireUserId = async (ctx: AuthContext) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthorized');
  }
  return identity.subject;
};

export const analyzeDocument = action({
  args: {
    filename: v.string(),
    fileType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const since = now - DOCUMENT_RATE_LIMIT_WINDOW_MS;
    const runQuery = ctx.runQuery as (
      queryRef: unknown,
      args: Record<string, unknown>,
    ) => Promise<unknown>;
    const runMutation = ctx.runMutation as (
      mutationRef: unknown,
      args: Record<string, unknown>,
    ) => Promise<unknown>;

    const usageCount = (await runQuery(internal.chat.countUsageSinceInternal, {
      user_id: userId,
      action: 'document',
      since,
      limit: DOCUMENT_RATE_LIMIT_MAX_REQUESTS,
    })) as number;

    if (usageCount >= DOCUMENT_RATE_LIMIT_MAX_REQUESTS) {
      throw new Error('Too many document analyses. Please wait a few minutes and try again.');
    }

    await runMutation(internal.chat.recordUsageEventInternal, {
      user_id: userId,
      action: 'document',
      created_at: now,
    });

    return {
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
    };
  },
});
