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

export interface WorkflowMetadata {
    id: string;
    title: string;
    description: string;
}

export interface GuidedStep {
    id: string;
    title: string;
    question: string;
    type: 'text' | 'date' | 'radio' | 'info';
    options?: string[];
    next?: string;
}

export interface GuidedTask {
    id: string;
    title: string;
    description: string;
    due_date?: string;
}

export interface GuidedSession {
    id: string;
    workflow_id: string;
    current_step_id?: string;
    answers: Record<string, string>;
    is_complete: boolean;
    tasks: GuidedTask[];
    warnings: string[];
}
