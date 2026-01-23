import { convexClient } from '../convexClient';
import { AnalysisResult, ChatResponse, WorkflowMetadata, GuidedSession, GuidedStep } from '../types';

const convex = convexClient as unknown as {
  query: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
  mutation: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
  action: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
};

const resolveConvexSiteUrl = () => {
  const envSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL as string | undefined;
  const envCloudUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
  if (envSiteUrl) {
    return envSiteUrl.replace(/\/$/, '');
  }
  if (envCloudUrl) {
    return envCloudUrl.replace('.convex.cloud', '.convex.site').replace(/\/$/, '');
  }
  return 'http://localhost:3210';
};

export const sendMessage = async (
  message: string,
  history: { role: string; content: string }[] = [],
): Promise<ChatResponse> => {
  return (await convex.action('chat:sendMessage', { message, history })) as ChatResponse;
};

export const analyzeDocument = async (file: File): Promise<AnalysisResult> => {
  return (await convex.action('documents:analyzeDocument', {
    filename: file.name,
    fileType: file.type || undefined,
    size: file.size,
  })) as AnalysisResult;
};

export const streamChat = async (
  message: string,
  history: { role: string; content: string }[] = [],
  onChunk?: (chunk: string) => void,
) => {
  const siteUrl = resolveConvexSiteUrl();
  const response = await fetch(`${siteUrl}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to stream chat response.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) {
        continue;
      }

      const data = trimmed.replace(/^data:\s*/, '');
      if (data === '[DONE]') {
        return;
      }

      try {
        const payload = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
        };
        const delta =
          payload.choices?.[0]?.delta?.content ?? payload.choices?.[0]?.message?.content;
        if (delta && onChunk) {
          onChunk(delta);
        }
      } catch (error) {
        console.error('Failed to parse streaming chunk', error);
      }
    }
  }
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
