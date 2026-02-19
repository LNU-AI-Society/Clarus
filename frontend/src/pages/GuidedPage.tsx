import { getWorkflows, startSession, getStep, submitAnswer } from '../services/api';
import { WorkflowMetadata, GuidedSession, GuidedStep } from '../types';
import Navbar from '../components/Navbar';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { useTranslate } from '@tolgee/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GuidedPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslate();
  const [workflows, setWorkflows] = useState<WorkflowMetadata[]>([]);
  const [session, setSession] = useState<GuidedSession | null>(null);
  const [currentStep, setCurrentStep] = useState<GuidedStep | null>(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const workflowCopy: Record<string, { title: string; description: string }> = {
    renewal: {
      title: t('guided.workflows.renewal.title'),
      description: t('guided.workflows.renewal.description'),
    },
    change_employer: {
      title: t('guided.workflows.change_employer.title'),
      description: t('guided.workflows.change_employer.description'),
    },
  };

  const stepCopy: Record<string, Record<string, { title: string; question: string }>> = {
    renewal: {
      expiry_date: {
        title: t('guided.steps.renewal.expiry_date.title'),
        question: t('guided.steps.renewal.expiry_date.question'),
      },
      employment_status: {
        title: t('guided.steps.renewal.employment_status.title'),
        question: t('guided.steps.renewal.employment_status.question'),
      },
      supporting_docs: {
        title: t('guided.steps.renewal.supporting_docs.title'),
        question: t('guided.steps.renewal.supporting_docs.question'),
      },
    },
    change_employer: {
      permit_duration: {
        title: t('guided.steps.change_employer.permit_duration.title'),
        question: t('guided.steps.change_employer.permit_duration.question'),
      },
      new_role: {
        title: t('guided.steps.change_employer.new_role.title'),
        question: t('guided.steps.change_employer.new_role.question'),
      },
    },
  };

  const optionCopy: Record<string, Record<string, Record<string, string>>> = {
    renewal: {
      employment_status: {
        'Yes, same employer': t('guided.steps.renewal.employment_status.options.same'),
        'No, switching employers': t('guided.steps.renewal.employment_status.options.switch'),
      },
    },
    change_employer: {
      permit_duration: {
        'Less than 24 months': t('guided.steps.change_employer.permit_duration.options.less'),
        '24 months or more': t('guided.steps.change_employer.permit_duration.options.more'),
      },
    },
  };

  const taskCopy: Record<
    string,
    { titleKey: string; descriptionKey: string; requiresDate?: boolean }
  > = {
    't-renewal-1': {
      titleKey: 'guided.tasks.renewal.prepare.title',
      descriptionKey: 'guided.tasks.renewal.prepare.description',
      requiresDate: true,
    },
    't-change-1': {
      titleKey: 'guided.tasks.change_employer.new_application.title',
      descriptionKey: 'guided.tasks.change_employer.new_application.description',
    },
    't-change-2': {
      titleKey: 'guided.tasks.change_employer.role_alignment.title',
      descriptionKey: 'guided.tasks.change_employer.role_alignment.description',
    },
    't-general-1': {
      titleKey: 'guided.tasks.general.review.title',
      descriptionKey: 'guided.tasks.general.review.description',
    },
  };

  const warningCopy: Record<string, string> = {
    'Switching employers may require a new permit application.':
      'guided.warnings.renewal.switch_employer',
    'Changing employers within 24 months requires a new application.':
      'guided.warnings.change_employer.within_24_months',
  };

  const getWorkflowTitle = (workflow: WorkflowMetadata) =>
    workflowCopy[workflow.id]?.title ?? workflow.title;

  const getWorkflowDescription = (workflow: WorkflowMetadata) =>
    workflowCopy[workflow.id]?.description ?? workflow.description;

  const getStepTitle = (workflowId: string, stepId: string, fallback: string) =>
    stepCopy[workflowId]?.[stepId]?.title ?? fallback;

  const getStepQuestion = (workflowId: string, stepId: string, fallback: string) =>
    stepCopy[workflowId]?.[stepId]?.question ?? fallback;

  const getOptionLabel = (workflowId: string, stepId: string, option: string) =>
    optionCopy[workflowId]?.[stepId]?.[option] ?? option;

  const translateTask = (task: { id: string; title: string; description: string; due_date?: string }) => {
    const config = taskCopy[task.id];
    if (!config) {
      return task;
    }

    const description = config.requiresDate
      ? task.due_date
        ? t(config.descriptionKey, { date: task.due_date })
        : task.description
      : t(config.descriptionKey);

    return {
      ...task,
      title: t(config.titleKey),
      description,
    };
  };

  const translateWarning = (warning: string) => {
    const key = warningCopy[warning];
    return key ? t(key) : warning;
  };

  const navbar = (
    <Navbar
      backTo="/"
      backAriaLabel={t('guided.top.back')}
      actions={
        <button
          type="button"
          onClick={() => navigate('/guided/history')}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(167,185,180,0.7)] bg-white/90 px-4 py-2 text-sm font-semibold text-[#0f7a6a] transition-all duration-200 hover:shadow-[0_14px_30px_rgba(31,41,55,0.1)]"
        >
          {t('guided.top.viewHistory')}
        </button>
      }
    />
  );

  // Initial load
  useEffect(() => {
    getWorkflows().then(setWorkflows).catch(console.error);
  }, []);

  // Fetch step details when session updates
  useEffect(() => {
    if (session && session.current_step_id && !session.is_complete) {
      getStep(session.workflow_id, session.current_step_id)
        .then(setCurrentStep)
        .catch(console.error);
    }
  }, [session]);

  const handleStart = async (id: string) => {
    setIsLoading(true);
    try {
      const newSession = await startSession(id);
      setSession(newSession);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (!session || !answer) return;
    setIsLoading(true);
    try {
      const updatedSession = await submitAnswer(session.id, answer);
      setSession(updatedSession);
      setAnswer('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Views ---

  // 1. Home: Workflow List
  if (!session) {
    return (
      <div className="relative min-h-screen text-[#1f2937]">
        <div className="fixed inset-0 z-0 bg-[linear-gradient(135deg,_#f7f2ed_0%,_#fbf7f2_45%,_#eef6f3_100%)]">
          <div className="pointer-events-none absolute -left-[200px] -top-[240px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,231,214,0.9),_transparent_70%)] opacity-70 blur-[0.5px]" />
          <div className="pointer-events-none absolute -bottom-[260px] -right-[220px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(221,244,241,0.8),_transparent_70%)] opacity-70 blur-[0.5px]" />
        </div>
        <div className="relative z-10 min-h-screen">
          {navbar}
          <div className="mx-auto w-full max-w-[1120px] px-[18px] py-10 sm:px-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#1f2937]">{t('guided.list.title')}</h1>
              <p className="text-[#6b7280]">{t('guided.list.subtitle')}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  onClick={() => handleStart(wf.id)}
                  className="group cursor-pointer rounded-[20px] border border-[rgba(229,222,216,0.8)] bg-white p-6 shadow-[0_14px_30px_rgba(31,41,55,0.1)] transition-all hover:-translate-y-0.5 hover:border-[#a7b9b4]"
                >
                  <h3 className="mb-2 flex items-center justify-between text-lg font-semibold text-[#1f2937] group-hover:text-[#0f7a6a]">
                    {getWorkflowTitle(wf)}
                    <ChevronRight className="h-5 w-5 text-[#c0b4ac] group-hover:text-[#0f7a6a]" />
                  </h3>
                  <p className="text-sm text-[#5c6664]">{getWorkflowDescription(wf)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Dashboard: Completed Session
  if (session.is_complete) {
    return (
      <div className="relative min-h-screen text-[#1f2937]">
        <div className="fixed inset-0 z-0 bg-[linear-gradient(135deg,_#f7f2ed_0%,_#fbf7f2_45%,_#eef6f3_100%)]">
          <div className="pointer-events-none absolute -left-[200px] -top-[240px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,231,214,0.9),_transparent_70%)] opacity-70 blur-[0.5px]" />
          <div className="pointer-events-none absolute -bottom-[260px] -right-[220px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(221,244,241,0.8),_transparent_70%)] opacity-70 blur-[0.5px]" />
        </div>
        <div className="relative z-10 min-h-screen">
          {navbar}
          <div className="mx-auto w-full max-w-[1120px] px-[18px] py-10 sm:px-6">
            <div className="rounded-[20px] border border-[rgba(229,222,216,0.8)] bg-white p-8 shadow-[0_14px_30px_rgba(31,41,55,0.1)]">
              <div className="mb-6 flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-[#2f9e7c]" />
                <h1 className="text-2xl font-bold text-[#1f2937]">{t('guided.complete.title')}</h1>
              </div>

              {session.warnings.length > 0 && (
                <div className="mb-8 rounded-2xl border border-amber-100 bg-[#fff7ed] p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-amber-800">
                    <AlertTriangle className="h-5 w-5" />
                    {t('guided.complete.warnings')}
                  </h3>
                  <ul className="space-y-2">
                    {session.warnings.map((w, i) => (
                      <li key={i} className="flex gap-2 text-sm text-amber-900">
                        <span>•</span> {translateWarning(w)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1f2937]">
                <Calendar className="h-5 w-5 text-[#0f7a6a]" />
                {t('guided.complete.actionPlan')}
              </h3>
              <div className="space-y-4">
                {session.tasks.map((task) => {
                  const translatedTask = translateTask(task);
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-4 rounded-2xl border border-[#efe7e0] bg-white p-4 transition-colors"
                    >
                      <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 border-[#cbd5d1]" />
                      <div>
                        <h4 className="font-medium text-[#1f2937]">
                          {translatedTask.title}
                        </h4>
                        <p className="mt-1 text-sm text-[#5c6664]">
                          {translatedTask.description}
                        </p>
                        {task.due_date && (
                          <p className="mt-2 text-xs font-medium text-[#0f7a6a]">
                            {t('guided.complete.due', { date: task.due_date })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setSession(null)}
                className="mt-8 text-sm font-semibold text-[#5c6664] hover:text-[#1f2937]"
              >
                {t('guided.complete.startAnother')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Wizard: Step View
  if (!currentStep) {
    return (
      <div className="p-8 text-center text-[#9aa2a0]">{t('guided.step.loading')}</div>
    );
  }

  return (
    <div className="relative min-h-screen text-[#1f2937]">
      <div className="fixed inset-0 z-0 bg-[linear-gradient(135deg,_#f7f2ed_0%,_#fbf7f2_45%,_#eef6f3_100%)]">
        <div className="pointer-events-none absolute -left-[200px] -top-[240px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,231,214,0.9),_transparent_70%)] opacity-70 blur-[0.5px]" />
        <div className="pointer-events-none absolute -bottom-[260px] -right-[220px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(221,244,241,0.8),_transparent_70%)] opacity-70 blur-[0.5px]" />
      </div>
      <div className="relative z-10 min-h-screen">
        {navbar}
        <div className="mx-auto w-full max-w-[1120px] px-[18px] py-10 sm:px-6">
          <div className="rounded-[20px] border border-[rgba(229,222,216,0.8)] bg-white p-8 shadow-[0_14px_30px_rgba(31,41,55,0.1)]">
            <div className="mb-8">
              <button
                onClick={() => setSession(null)}
                className="mb-4 text-xs text-[#9aa2a0] hover:text-[#5c6664]"
              >
                {t('guided.step.cancel')}
              </button>
              <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-[#f1eee9]">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-[#0f7a6a]" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-[#1f2937]">
                {getStepTitle(session.workflow_id, currentStep.id, currentStep.title)}
              </h2>
              <p className="text-lg text-[#5c6664]">
                {getStepQuestion(session.workflow_id, currentStep.id, currentStep.question)}
              </p>
            </div>

            <div className="space-y-4">
              {currentStep.type === 'text' && (
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full rounded-2xl border border-[#e5ded8] bg-white px-4 py-3 outline-none focus:border-[#0f7a6a] focus:ring-2 focus:ring-[#0f7a6a]/15"
                  placeholder={t('guided.step.placeholder')}
                  autoFocus
                />
              )}

              {currentStep.type === 'date' && (
                <input
                  type="date"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full rounded-2xl border border-[#e5ded8] bg-white px-4 py-3 outline-none focus:border-[#0f7a6a] focus:ring-2 focus:ring-[#0f7a6a]/15"
                  autoFocus
                />
              )}

              {currentStep.type === 'radio' && currentStep.options && (
                <div className="grid gap-3">
                  {currentStep.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setAnswer(opt);
                      }}
                      className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                        answer === opt
                          ? 'border-[#0f7a6a] bg-[#e8f3f0] text-[#0f7a6a] ring-1 ring-[#0f7a6a]/30'
                          : 'border-[#e5ded8] hover:border-[#a7b9b4] hover:bg-white/70'
                      }`}
                    >
                      {getOptionLabel(session.workflow_id, currentStep.id, opt)}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleAnswer}
                disabled={!answer || isLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f7a6a] py-4 font-semibold text-white transition-all hover:bg-[#0b6b5e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  t('guided.step.processing')
                ) : (
                  <>
                    {t('guided.step.next')} <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedPage;
