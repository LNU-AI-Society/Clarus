export interface Citation {
    id: string;
    title: string;
    url: string;
    snippet: string;
    source_type: string;
}

export interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    isError?: boolean;
    citations?: Citation[];
}

export interface ChatRequest {
    message: string;
    history: { role: string; content: string }[];
}

export interface ChatResponse {
    answer: string;
    citations?: Citation[];
}
