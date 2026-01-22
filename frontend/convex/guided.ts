import { mutation, query } from "./_generated/server";
import { v } from 'convex/values';

import { getStep, getWorkflow, WORKFLOWS } from './workflows';

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

const mapSession = (session: {
  _id: string;
  workflow_id: string;
  current_step_id?: string;
  answers: Record<string, string>;
  is_complete: boolean;
  tasks: Array<{ id: string; title: string; description: string; due_date?: string }>;
  warnings: string[];
}) => ({
  id: session._id,
  workflow_id: session.workflow_id,
  current_step_id: session.current_step_id,
  answers: session.answers,
  is_complete: session.is_complete,
  tasks: session.tasks,
  warnings: session.warnings,
});

export const listWorkflows = query({
  handler: async () =>
    WORKFLOWS.map((workflow) => ({
      id: workflow.id,
      title: workflow.title,
      description: workflow.description,
    })),
});

export const getWorkflowStep = query({
  args: { workflowId: v.string(), stepId: v.string() },
  handler: async (_ctx, args) => {
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
    const workflow = getWorkflow(args.workflowId);
    if (!workflow || workflow.steps.length === 0) {
      throw new Error('Workflow not found');
    }

    const now = Date.now();
    const sessionId = await ctx.db.insert('guidedSessions', {
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
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
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
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    return mapSession(session);
  },
});

export const getHistory = query({
  handler: async (ctx) => {
    const sessions = await ctx.db.query('guidedSessions').collect();
    return sessions
      .sort((a, b) => b.created_at - a.created_at)
      .map((session) => mapSession(session));
  },
});
