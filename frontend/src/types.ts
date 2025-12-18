export interface Citation {
    id: string;
    title: string;
    url: string;
    snippet: string;
    source_type: string;
}

export interface AnalysisResult {
    summary: string;
    key_points: string[];
    risks: string[];
    suggested_questions: string[];
}

export interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    isError?: boolean;
    citations?: Citation[];
    analysis?: AnalysisResult;
}

export interface ChatRequest {
    message: string;
    history: { role: string; content: string }[];
}

export interface ChatResponse {
    answer: string;
    citations?: Citation[];
}
