import { convexClient } from '../convexClient';
import { ChatResponse, WorkflowMetadata, GuidedSession, GuidedStep } from '../types';

const convex = convexClient as unknown as {
  query: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
  mutation: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
  action: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
};

export const sendMessage = async (
  message: string,
  history: { role: string; content: string }[] = [],
): Promise<ChatResponse> => {
  return (await convex.action('chat:sendMessage', { message, history })) as ChatResponse;
};

export const analyzeDocument = async (file: File) => {
  return await convex.action('documents:analyzeDocument', {
    filename: file.name,
    fileType: file.type || undefined,
    size: file.size,
  });
};

// Guided Mode
export const getWorkflows = async (): Promise<WorkflowMetadata[]> => {
  return (await convex.query('guided:listWorkflows', {})) as WorkflowMetadata[];
};

export const startSession = async (workflowId: string): Promise<GuidedSession> => {
  return (await convex.mutation('guided:startSession', { workflowId })) as GuidedSession;
};

export const getSession = async (sessionId: string): Promise<GuidedSession> => {
  return (await convex.query('guided:getSession', { sessionId })) as GuidedSession;
};

export const getStep = async (workflowId: string, stepId: string): Promise<GuidedStep> => {
  return (await convex.query('guided:getWorkflowStep', {
    workflowId,
    stepId,
  })) as GuidedStep;
};

export const submitAnswer = async (sessionId: string, answer: string): Promise<GuidedSession> => {
  return (await convex.mutation('guided:submitAnswer', {
    sessionId,
    answer,
  })) as GuidedSession;
};

export const getHistory = async (): Promise<GuidedSession[]> => {
  return (await convex.query('guided:getHistory', {})) as GuidedSession[];
};
