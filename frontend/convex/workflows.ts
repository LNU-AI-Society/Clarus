export type WorkflowStep = {
  id: string;
  title: string;
  question: string;
  type: 'text' | 'date' | 'radio';
  options?: string[];
  next?: string;
};

export type Workflow = {
  id: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
};

export const WORKFLOWS: Workflow[] = [
  {
    id: 'renewal',
    title: 'Work Permit Renewal',
    description: 'Prepare the basics for extending your Swedish work permit.',
    steps: [
      {
        id: 'expiry_date',
        title: 'Permit Expiry',
        question: 'When does your current permit expire?',
        type: 'date',
        next: 'employment_status',
      },
      {
        id: 'employment_status',
        title: 'Employment Status',
        question: 'Are you staying with the same employer?',
        type: 'radio',
        options: ['Yes, same employer', 'No, switching employers'],
        next: 'supporting_docs',
      },
      {
        id: 'supporting_docs',
        title: 'Supporting Documents',
        question: 'Any documents you want to keep in mind?',
        type: 'text',
      },
    ],
  },
  {
    id: 'change_employer',
    title: 'Change Employer',
    description: 'Check what you need when moving to a new employer.',
    steps: [
      {
        id: 'permit_duration',
        title: 'Permit Duration',
        question: 'How long have you held your current permit?',
        type: 'radio',
        options: ['Less than 24 months', '24 months or more'],
        next: 'new_role',
      },
      {
        id: 'new_role',
        title: 'New Role',
        question: 'Describe the role you are moving into.',
        type: 'text',
      },
    ],
  },
];

export const getWorkflow = (workflowId: string) =>
  WORKFLOWS.find((workflow) => workflow.id === workflowId);

export const getStep = (workflowId: string, stepId: string) => {
  const workflow = getWorkflow(workflowId);
  return workflow?.steps.find((step) => step.id === stepId);
};
