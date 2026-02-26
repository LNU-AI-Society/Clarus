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

export interface ChatConversation {
  id: string;
  title: string;
  last_message_preview: string;
  created_at: number;
  updated_at: number;
  last_message_at: number;
}
