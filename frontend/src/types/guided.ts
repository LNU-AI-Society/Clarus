export type GuidedTask = {
  id: string;
  title: string;
  description: string;
  due_date?: string;
};

export type GuidedSession = {
  id: string;
  workflow_id: string;
  current_step_id?: string;
  answers: Record<string, string>;
  is_complete: boolean;
  tasks: GuidedTask[];
  warnings: string[];
};

export type GuidedWorkflowMetadata = {
  id: string;
  title: string;
  description: string;
};

export type GuidedWorkflowStep = {
  id: string;
  title: string;
  question: string;
  type: 'text' | 'date' | 'radio';
  options?: string[];
};
