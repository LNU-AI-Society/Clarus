export interface Message {
    id: string;
    role: 'user' | 'model'; // Matching backend "role" field
    text: string;
    isError?: boolean;
}

export interface ChatRequest {
    message: string;
    history: { role: string; content: string }[];
}


export interface ChatResponse {
    answer: string;
}
