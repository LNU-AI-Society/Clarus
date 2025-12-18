import { ChatRequest, ChatResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000'; // In prod, rely on proxy or env var

export const sendMessage = async (message: string, history: { role: string; content: string }[] = []): Promise<ChatResponse> => {
    const requestBody: ChatRequest = {
        message,
        history
    };

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    return data;
};

export const analyzeDocument = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/documents/analyze`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Analysis Error: ${response.statusText}`);
    }

    return await response.json();
};

// Guided Mode
export const getWorkflows = async (): Promise<WorkflowMetadata[]> => {
    const response = await fetch(`${API_BASE_URL}/api/guided/workflows`);
    if (!response.ok) throw new Error('Failed to fetch workflows');
    return await response.json();
};

export const startSession = async (workflowId: string): Promise<GuidedSession> => {
    const response = await fetch(`${API_BASE_URL}/api/guided/start?workflow_id=${workflowId}`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to start session');
    return await response.json();
};

export const getSession = async (sessionId: string): Promise<GuidedSession> => {
    const response = await fetch(`${API_BASE_URL}/api/guided/session/${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch session');
    return await response.json();
};

export const getStep = async (workflowId: string, stepId: string): Promise<GuidedStep> => {
    const response = await fetch(`${API_BASE_URL}/api/guided/step/${workflowId}/${stepId}`);
    if (!response.ok) throw new Error('Failed to fetch step');
    return await response.json();
};

export const submitAnswer = async (sessionId: string, answer: string): Promise<GuidedSession> => {
    const response = await fetch(`${API_BASE_URL}/api/guided/answer?session_id=${sessionId}&answer=${encodeURIComponent(answer)}`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to submit answer');
    return await response.json();
};
