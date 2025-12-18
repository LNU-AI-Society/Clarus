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
