import Navbar from '../components/Navbar';
import { api } from '../lib/convexApi';
import type {
  GuidedSession,
  GuidedTask,
  GuidedWorkflowMetadata,
  GuidedWorkflowStep,
} from '../types/guided';
import { Link, useNavigate } from '@tanstack/react-router';
import { T, useTolgee, useTranslate } from '@tolgee/react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { AlertTriangle, ArrowRight, Calendar, CheckCircle, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { useEffect, useState } from 'react';

const workflowCopy: Record<string, { titleKey: string; descriptionKey: string }> = {
  renewal: {
    titleKey: 'guided.workflows.renewal.title',
    descriptionKey: 'guided.workflows.renewal.description',
  },
  change_employer: {
    titleKey: 'guided.workflows.change_employer.title',
    descriptionKey: 'guided.workflows.change_employer.description',
  },
};

const stepCopy: Record<string, Record<string, { titleKey: string; questionKey: string }>> = {
  renewal: {
    expiry_date: {
      titleKey: 'guided.steps.renewal.expiry_date.title',
      questionKey: 'guided.steps.renewal.expiry_date.question',
    },
    employment_status: {
      titleKey: 'guided.steps.renewal.employment_status.title',
      questionKey: 'guided.steps.renewal.employment_status.question',
    },
    supporting_docs: {
      titleKey: 'guided.steps.renewal.supporting_docs.title',
      questionKey: 'guided.steps.renewal.supporting_docs.question',
    },
  },
  change_employer: {
    permit_duration: {
      titleKey: 'guided.steps.change_employer.permit_duration.title',
      questionKey: 'guided.steps.change_employer.permit_duration.question',
    },
    new_role: {
      titleKey: 'guided.steps.change_employer.new_role.title',
      questionKey: 'guided.steps.change_employer.new_role.question',
    },
  },
};

const optionCopy: Record<string, Record<string, Record<string, string>>> = {
  renewal: {
    employment_status: {
      'Yes, same employer': 'guided.steps.renewal.employment_status.options.same',
      'No, switching employers': 'guided.steps.renewal.employment_status.options.switch',
    },
  },
  change_employer: {
    permit_duration: {
      'Less than 24 months': 'guided.steps.change_employer.permit_duration.options.less',
      '24 months or more': 'guided.steps.change_employer.permit_duration.options.more',
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

type GuidedPageProps = {
  initialSessionId?: string;
};

type GuidedSummaryResult = {
  summary?: string;
};

const GuidedPage = ({ initialSessionId }: GuidedPageProps) => {
  const navigate = useNavigate();
  const tolgee = useTolgee(['language']);
  const { t } = useTranslate();
  const [session, setSession] = useState<GuidedSession | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const workflows = (useQuery(api.guided.listWorkflows) ?? []) as GuidedWorkflowMetadata[];
  const sessionQuery = useQuery(
    api.guided.getSession,
    initialSessionId ? { sessionId: initialSessionId } : 'skip',
  ) as GuidedSession | undefined;
  const currentStep = useQuery(
    api.guided.getWorkflowStep,
    session && session.current_step_id && !session.is_complete
      ? {
          workflowId: session.workflow_id,
          stepId: session.current_step_id,
        }
      : 'skip',
  ) as GuidedWorkflowStep | undefined;
  const startSessionMutation = useMutation(api.guided.startSession);
  const submitAnswerMutation = useMutation(api.guided.submitAnswer);
  const generateSummaryAction = useAction(api.guided.generateSummary);
  const language = tolgee.getLanguage() ?? 'en';
  const isSessionLoading = Boolean(initialSessionId && sessionQuery === undefined && !session);

  useEffect(() => {
    if (sessionQuery) {
      setSession(sessionQuery);
    }
  }, [sessionQuery]);

  useEffect(() => {
    setSummary(null);
    setSummaryError(false);
  }, [session?.id]);

  useEffect(() => {
    if (!session?.is_complete || summary || summaryLoading || summaryError) {
      return;
    }

    setSummaryLoading(true);
    generateSummaryAction({ sessionId: session.id, language })
      .then((result) => {
        const summaryResult = result as GuidedSummaryResult;
        if (summaryResult?.summary) {
          setSummary(summaryResult.summary);
        } else {
          setSummaryError(true);
        }
      })
      .catch((error) => {
        console.error(error);
        setSummaryError(true);
      })
      .finally(() => {
        setSummaryLoading(false);
      });
  }, [
    generateSummaryAction,
    language,
    session?.id,
    session?.is_complete,
    summary,
    summaryError,
    summaryLoading,
  ]);

  const getWorkflowTitleKey = (workflowId: string) => workflowCopy[workflowId]?.titleKey;

  const getWorkflowDescriptionKey = (workflowId: string) =>
    workflowCopy[workflowId]?.descriptionKey;

  const getStepTitleKey = (workflowId: string, stepId: string) =>
    stepCopy[workflowId]?.[stepId]?.titleKey;

  const getStepQuestionKey = (workflowId: string, stepId: string) =>
    stepCopy[workflowId]?.[stepId]?.questionKey;

  const getOptionLabelKey = (workflowId: string, stepId: string, option: string) =>
    optionCopy[workflowId]?.[stepId]?.[option];

  const renderTaskTitle = (task: GuidedTask) => {
    const config = taskCopy[task.id];
    return config ? <T keyName={config.titleKey} /> : task.title;
  };

  const renderTaskDescription = (task: GuidedTask) => {
    const config = taskCopy[task.id];
    if (!config) {
      return task.description;
    }

    if (config.requiresDate && task.due_date) {
      return <T keyName={config.descriptionKey} params={{ date: task.due_date }} />;
    }

    if (config.requiresDate) {
      return task.description;
    }

    return <T keyName={config.descriptionKey} />;
  };

  const renderWarning = (warning: string) => {
    const key = warningCopy[warning];
    return key ? <T keyName={key} /> : warning;
  };

  const handleResetSession = () => {
    setSession(null);
    navigate({ to: '/guided' });
  };

  const topRow = <Navbar backTo="/" />;

  const handleStart = async (id: string) => {
    setIsLoading(true);
    try {
      const newSession = (await startSessionMutation({ workflowId: id })) as GuidedSession;
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
      const updatedSession = (await submitAnswerMutation({
        sessionId: session.id,
        answer,
      })) as GuidedSession;
      setSession(updatedSession);
      setAnswer('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="p-8 text-center text-faint">
        <T keyName="guided.step.loading" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-app-bg via-app-bg-soft to-app-bg-cool text-ink">
        <div className="pointer-events-none absolute -left-52 -top-60 h-96 w-96 rounded-full bg-radial from-halo-peach/90 to-transparent opacity-70" />
        <div className="pointer-events-none absolute -bottom-64 -right-56 h-96 w-96 rounded-full bg-radial from-halo-mint/80 to-transparent opacity-70" />
        <div className="relative z-10 min-h-screen">
          {topRow}
          <div className="mx-auto w-full max-w-layout px-4 py-10 sm:px-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-ink">
                <T keyName="guided.list.title" />
              </h1>
              <p className="text-subtle">
                <T keyName="guided.list.subtitle" />
              </p>
              <div className="mt-4">
                <Link
                  to="/guided/history"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border-strong/70 bg-surface/90 px-4 py-2 text-sm font-semibold text-brand shadow-soft transition-all duration-200 hover:shadow-card"
                >
                  <T keyName="guided.top.viewHistory" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {workflows.map((workflow) => {
                const workflowTitleKey = getWorkflowTitleKey(workflow.id);
                const workflowDescriptionKey = getWorkflowDescriptionKey(workflow.id);

                return (
                  <button
                    key={workflow.id}
                    type="button"
                    onClick={() => handleStart(workflow.id)}
                    className="group cursor-pointer rounded-card border border-border/80 bg-surface p-6 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-border-strong"
                  >
                    <h3 className="mb-2 flex items-center justify-between text-lg font-semibold text-ink group-hover:text-brand">
                      {workflowTitleKey ? <T keyName={workflowTitleKey} /> : workflow.title}
                      <ChevronRight className="h-5 w-5 text-border-strong group-hover:text-brand" />
                    </h3>
                    <p className="text-sm text-muted">
                      {workflowDescriptionKey ? (
                        <T keyName={workflowDescriptionKey} />
                      ) : (
                        workflow.description
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (session.is_complete) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-app-bg via-app-bg-soft to-app-bg-cool text-ink">
        <div className="pointer-events-none absolute -left-52 -top-60 h-96 w-96 rounded-full bg-radial from-halo-peach/90 to-transparent opacity-70" />
        <div className="pointer-events-none absolute -bottom-64 -right-56 h-96 w-96 rounded-full bg-radial from-halo-mint/80 to-transparent opacity-70" />
        <div className="relative z-10 min-h-screen">
          {topRow}
          <div className="mx-auto w-full max-w-layout px-4 py-10 sm:px-6">
            <div className="rounded-card border border-border/80 bg-surface p-8 shadow-card">
              <div className="mb-6 flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-positive" />
                <h1 className="text-2xl font-bold text-ink">
                  <T keyName="guided.complete.title" />
                </h1>
              </div>

              {session.warnings.length > 0 && (
                <div className="mb-8 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-amber-800">
                    <AlertTriangle className="h-5 w-5" />
                    <T keyName="guided.complete.warnings" />
                  </h3>
                  <ul className="space-y-2">
                    {session.warnings.map((warning) => (
                      <li key={warning} className="flex gap-2 text-sm text-amber-900">
                        <span>•</span> {renderWarning(warning)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-8 rounded-2xl border border-border/80 bg-surface-panel p-4">
                <h3 className="mb-3 text-sm font-semibold text-ink">
                  <T keyName="guided.summary.title" />
                </h3>
                {summaryLoading ? (
                  <p className="text-sm text-muted">
                    <T keyName="guided.summary.loading" />
                  </p>
                ) : summary ? (
                  <div className="prose prose-sm prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-headings:mt-3 prose-headings:mb-2 max-w-none text-muted">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                      {summary}
                    </ReactMarkdown>
                  </div>
                ) : summaryError ? (
                  <p className="text-sm text-muted">
                    <T keyName="guided.summary.error" />
                  </p>
                ) : null}
              </div>

              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
                <Calendar className="h-5 w-5 text-brand" />
                <T keyName="guided.complete.actionPlan" />
              </h3>
              <div className="space-y-4">
                {session.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors"
                  >
                    <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 border-ring-track" />
                    <div>
                      <h4 className="font-medium text-ink">{renderTaskTitle(task)}</h4>
                      <p className="mt-1 text-sm text-muted">{renderTaskDescription(task)}</p>
                      {task.due_date && (
                        <p className="mt-2 text-xs font-medium text-brand">
                          <T keyName="guided.complete.due" params={{ date: task.due_date }} />
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleResetSession}
                className="mt-8 text-sm font-semibold text-muted hover:text-ink"
              >
                <T keyName="guided.complete.startAnother" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="p-8 text-center text-faint">
        <T keyName="guided.step.loading" />
      </div>
    );
  }

  const stepTitleKey = getStepTitleKey(session.workflow_id, currentStep.id);
  const stepQuestionKey = getStepQuestionKey(session.workflow_id, currentStep.id);

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-app-bg via-app-bg-soft to-app-bg-cool text-ink">
      <div className="pointer-events-none absolute -left-52 -top-60 h-96 w-96 rounded-full bg-radial from-halo-peach/90 to-transparent opacity-70" />
      <div className="pointer-events-none absolute -bottom-64 -right-56 h-96 w-96 rounded-full bg-radial from-halo-mint/80 to-transparent opacity-70" />
      <div className="relative z-10 min-h-screen">
        {topRow}
        <div className="mx-auto w-full max-w-layout px-4 py-10 sm:px-6">
          <div className="rounded-card border border-border/80 bg-surface p-8 shadow-card">
            <div className="mb-8">
              <button
                type="button"
                onClick={handleResetSession}
                className="mb-4 text-xs text-faint hover:text-muted"
              >
                <T keyName="guided.step.cancel" />
              </button>
              <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-surface-cream">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-brand" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-ink">
                {stepTitleKey ? <T keyName={stepTitleKey} /> : currentStep.title}
              </h2>
              <p className="text-lg text-muted">
                {stepQuestionKey ? <T keyName={stepQuestionKey} /> : currentStep.question}
              </p>
            </div>

            <div className="space-y-4">
              {currentStep.type === 'text' && (
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  placeholder={t('guided.step.placeholder')}
                />
              )}

              {currentStep.type === 'date' && (
                <input
                  type="date"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              )}

              {currentStep.type === 'radio' && currentStep.options && (
                <div className="grid gap-3">
                  {currentStep.options.map((option) => {
                    const optionLabelKey = getOptionLabelKey(
                      session.workflow_id,
                      currentStep.id,
                      option,
                    );
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setAnswer(option);
                        }}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          answer === option
                            ? 'border-brand bg-brand-soft text-brand ring-1 ring-brand/30'
                            : 'border-border hover:border-border-strong hover:bg-surface/70'
                        }`}
                      >
                        {optionLabelKey ? <T keyName={optionLabelKey} /> : option}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={handleAnswer}
                disabled={!answer || isLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 font-semibold text-white transition-all hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <T keyName="guided.step.processing" />
                ) : (
                  <>
                    <T keyName="guided.step.next" /> <ArrowRight className="h-4 w-4" />
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
