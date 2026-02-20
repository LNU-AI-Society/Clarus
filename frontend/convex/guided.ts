import type { Doc } from './_generated/dataModel';
import { api } from './_generated/api';
import { action, mutation, query } from './_generated/server';
import { getStep, getWorkflow, WORKFLOWS } from './workflows';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { v } from 'convex/values';

const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const env =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const readEnv = (name: string) => env[name]?.trim() || undefined;
const getApiKey = () => readEnv('OPENROUTER_API_KEY');
const resolveModel = () => readEnv('OPENROUTER_MODEL') || DEFAULT_MODEL;
const resolveBaseUrl = () => readEnv('OPENROUTER_BASE_URL') || DEFAULT_OPENROUTER_BASE_URL;

const buildOpenRouterHeaders = (): Record<string, string> | undefined => {
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
};

const buildTasksAndWarnings = (workflowId: string, answers: Record<string, string>) => {
  const tasks: Array<{ id: string; title: string; description: string; due_date?: string }> = [];
  const warnings: string[] = [];

  if (workflowId === 'renewal') {
    const expiry = answers.expiry_date;
    if (expiry) {
      tasks.push({
        id: 't-renewal-1',
        title: 'Prepare renewal application',
        description: `Draft the renewal package before ${expiry}.`,
        due_date: expiry,
      });
    }
    if (answers.employment_status?.includes('No')) {
      warnings.push('Switching employers may require a new permit application.');
    }
  }

  if (workflowId === 'change_employer') {
    if (answers.permit_duration === 'Less than 24 months') {
      warnings.push('Changing employers within 24 months requires a new application.');
      tasks.push({
        id: 't-change-1',
        title: 'Start a new permit application',
        description: 'Begin the application before starting the new role.',
      });
    } else {
      tasks.push({
        id: 't-change-2',
        title: 'Confirm role alignment',
        description: 'Check if your new role matches the existing permit scope.',
      });
    }
  }

  if (tasks.length === 0) {
    tasks.push({
      id: 't-general-1',
      title: 'Review official guidance',
      description: 'Verify details on the Swedish Migration Agency site.',
    });
  }

  return { tasks, warnings };
};

const mapSession = (session: Doc<'guidedSessions'>) => ({
  id: session._id,
  workflow_id: session.workflow_id,
  current_step_id: session.current_step_id,
  answers: session.answers,
  is_complete: session.is_complete,
  tasks: session.tasks,
  warnings: session.warnings,
});

type AuthContext = {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>;
  };
};

type SummarySession = {
  workflow_id: string;
  answers: Record<string, string>;
  tasks: Array<{ id: string; title: string; description: string; due_date?: string }>;
  warnings: string[];
  is_complete: boolean;
};

const requireUserId = async (ctx: AuthContext) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthorized');
  }
  return identity.subject;
};

const buildFallbackSummary = (session: SummarySession) => {
  const workflow = getWorkflow(session.workflow_id);
  const workflowTitle = workflow?.title ?? session.workflow_id;
  const answers = session.answers ?? {};
  const answerLines = Object.entries(answers)
    .filter(([, value]) => value?.trim())
    .map(([stepId, value]) => {
      const stepTitle = workflow?.steps.find((step) => step.id === stepId)?.title ?? stepId;
      return `- ${stepTitle}: ${value}`;
    });
  const warningLines = (session.warnings ?? []).map((warning) => `- ${warning}`);
  const taskLines = (session.tasks ?? []).map((task) => {
    const due = task.due_date ? ` (Due ${task.due_date})` : '';
    return `- ${task.title}${due}: ${task.description}`;
  });

  const sections: string[] = [`Workflow: ${workflowTitle}.`];

  if (answerLines.length > 0) {
    sections.push(`Key answers:\n${answerLines.join('\n')}`);
  }
  if (warningLines.length > 0) {
    sections.push(`Warnings:\n${warningLines.join('\n')}`);
  }
  if (taskLines.length > 0) {
    sections.push(`Next steps:\n${taskLines.join('\n')}`);
  }

  return sections.join('\n\n');
};

export const listWorkflows = query({
  handler: async (ctx) => {
    await requireUserId(ctx);
    return WORKFLOWS.map((workflow) => ({
      id: workflow.id,
      title: workflow.title,
      description: workflow.description,
    }));
  },
});

export const getWorkflowStep = query({
  args: { workflowId: v.string(), stepId: v.string() },
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    const step = getStep(args.workflowId, args.stepId);
    if (!step) {
      throw new Error('Step not found');
    }
    return step;
  },
});

export const startSession = mutation({
  args: { workflowId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const workflow = getWorkflow(args.workflowId);
    if (!workflow || workflow.steps.length === 0) {
      throw new Error('Workflow not found');
    }

    const now = Date.now();
    const sessionId = await ctx.db.insert('guidedSessions', {
      user_id: userId,
      workflow_id: workflow.id,
      current_step_id: workflow.steps[0].id,
      answers: {},
      is_complete: false,
      tasks: [],
      warnings: [],
      created_at: now,
      updated_at: now,
    });

    const session = await ctx.db.get(sessionId);
    if (!session) {
      throw new Error('Failed to create session');
    }
    return mapSession(session);
  },
});

export const submitAnswer = mutation({
  args: { sessionId: v.id('guidedSessions'), answer: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    if (session.user_id !== userId) {
      throw new Error('Session not found');
    }

    const workflow = getWorkflow(session.workflow_id);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const answers = { ...session.answers };
    if (session.current_step_id) {
      answers[session.current_step_id] = args.answer;
    }

    const currentStep = session.current_step_id
      ? workflow.steps.find((step) => step.id === session.current_step_id)
      : undefined;
    const nextStepId = currentStep?.next;

    const isComplete = !nextStepId;
    const { tasks, warnings } = isComplete
      ? buildTasksAndWarnings(session.workflow_id, answers)
      : { tasks: session.tasks, warnings: session.warnings };

    await ctx.db.patch(args.sessionId, {
      answers,
      current_step_id: nextStepId,
      is_complete: isComplete,
      tasks,
      warnings,
      updated_at: Date.now(),
    });

    const updated = await ctx.db.get(args.sessionId);
    if (!updated) {
      throw new Error('Session update failed');
    }
    return mapSession(updated);
  },
});

export const getSession = query({
  args: { sessionId: v.id('guidedSessions') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    if (session.user_id !== userId) {
      throw new Error('Session not found');
    }
    return mapSession(session);
  },
});

export const getHistory = query({
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const sessions = await ctx.db
      .query('guidedSessions')
      .withIndex('by_user_created', (q) => q.eq('user_id', userId))
      .order('desc')
      .collect();
    return sessions.map((session) => mapSession(session));
  },
});

export const generateSummary = action({
  args: {
    sessionId: v.id('guidedSessions'),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    const runQuery = ctx.runQuery as (
      queryRef: unknown,
      args: Record<string, unknown>,
    ) => Promise<unknown>;
    const session = (await runQuery(api.guided.getSession, {
      sessionId: args.sessionId,
    })) as SummarySession | null;

    if (!session) {
      throw new Error('Session not found');
    }

    const fallbackSummary = buildFallbackSummary(session);
    const apiKey = getApiKey();
    if (!apiKey) {
      return { summary: fallbackSummary };
    }

    const workflow = getWorkflow(session.workflow_id);
    const workflowTitle = workflow?.title ?? session.workflow_id;
    const language = args.language?.trim() || 'en';
    const answers = Object.entries(session.answers ?? {})
      .filter(([, value]) => value?.trim())
      .map(([stepId, value]) => {
        const stepTitle = workflow?.steps.find((step) => step.id === stepId)?.title ?? stepId;
        return `${stepTitle}: ${value}`;
      })
      .join('\n');
    const warnings = (session.warnings ?? []).join('\n');
    const tasks = (session.tasks ?? [])
      .map((task) => {
        const due = task.due_date ? ` (Due ${task.due_date})` : '';
        return `${task.title}${due}: ${task.description}`;
      })
      .join('\n');

    const prompt = [
      `Language: ${language}`,
      `Workflow: ${workflowTitle}`,
      session.is_complete ? 'Status: complete' : 'Status: in progress',
      'Answers:',
      answers || 'None',
      'Warnings:',
      warnings || 'None',
      'Tasks:',
      tasks || 'None',
    ].join('\n');

    const openrouter = createOpenAI({
      apiKey,
      baseURL: resolveBaseUrl(),
      headers: buildOpenRouterHeaders(),
    });

    try {
      const result = await generateText({
        model: openrouter.chat(resolveModel()),
        system:
          'You are Clarus, a helpful legal assistant. Summarize the guided workflow outcome in plain language. Do not add legal advice. Do not invent facts. Keep it concise and use short paragraphs or bullets. Respond in the specified language.',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 320,
      });

      return { summary: result.text?.trim() || fallbackSummary };
    } catch (error) {
      console.error('Guided summary generation failed', error);
      return { summary: fallbackSummary };
    }
  },
});
