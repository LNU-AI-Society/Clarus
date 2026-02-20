import Navbar from '../components/Navbar';
import { api } from '../lib/convexApi';
import type { GuidedSession } from '../types/guided';
import { useNavigate } from '@tanstack/react-router';
import { T, useTranslate } from '@tolgee/react';
import { useMutation, useQuery } from 'convex/react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

const workflowTitleKeys: Record<string, string> = {
  renewal: 'guidedHistory.workflow.renewal.title',
  change_employer: 'guidedHistory.workflow.change_employer.title',
  job_loss: 'guidedHistory.workflow.job_loss.title',
};

const workflowDescriptionKeys: Record<string, string> = {
  renewal: 'guidedHistory.workflow.renewal.description',
  change_employer: 'guidedHistory.workflow.change_employer.description',
  job_loss: 'guidedHistory.workflow.job_loss.description',
};

const formatWorkflowTitle = (workflowId: string) => {
  return workflowId.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
};

const GuidedHistoryPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslate();
  const sessionsQuery = useQuery(api.guided.getHistory);
  const sessions = (sessionsQuery ?? []) as GuidedSession[];
  const isLoading = sessionsQuery === undefined;
  const deleteSession = useMutation(api.guided.deleteSession);
  const clearHistory = useMutation(api.guided.clearHistory);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const hasSessions = sessions.length > 0;

  const handleDelete = async (sessionId: string) => {
    if (!window.confirm(t('guidedHistory.deleteConfirm'))) {
      return;
    }

    setDeletingId(sessionId);
    try {
      await deleteSession({ sessionId });
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClear = async () => {
    if (!window.confirm(t('guidedHistory.clearConfirm'))) {
      return;
    }

    setIsClearing(true);
    try {
      await clearHistory();
    } catch (error) {
      console.error(error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="from-app-bg via-app-bg-soft to-app-bg-cool text-ink relative min-h-screen overflow-hidden bg-linear-to-br">
      <div className="from-halo-peach/90 pointer-events-none absolute -top-60 -left-52 h-96 w-96 rounded-full bg-radial to-transparent opacity-70" />
      <div className="from-halo-mint/80 pointer-events-none absolute -right-56 -bottom-64 h-96 w-96 rounded-full bg-radial to-transparent opacity-70" />
      <div className="relative z-10 min-h-screen">
        <Navbar backTo="/guided" />
        <main className="max-w-layout mx-auto w-full px-4 py-10 sm:px-6">
          {isLoading ? (
            <div className="flex min-h-96 items-center justify-center">
              <div className="text-faint flex items-center gap-3">
                <div className="border-border border-t-brand h-8 w-8 animate-spin rounded-full border-4" />
                <span>
                  <T keyName="guidedHistory.loading" />
                </span>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="border-border bg-surface/80 shadow-panel mx-auto flex max-w-2xl flex-col items-center justify-center rounded-3xl border p-12 text-center">
              <div className="bg-surface-cream mb-6 rounded-full p-6">
                <FileText className="text-olive h-12 w-12" />
              </div>
              <h2 className="text-ink mb-3 text-2xl font-bold">
                <T keyName="guidedHistory.empty.title" />
              </h2>
              <p className="text-subtle mb-8">
                <T keyName="guidedHistory.empty.body" />
              </p>
              <button
                type="button"
                onClick={() => navigate({ to: '/guided' })}
                className="bg-brand shadow-brand hover:bg-brand-hover inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-px"
              >
                <Plus className="h-5 w-5" />
                <T keyName="guidedHistory.empty.cta" />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-ink mb-2 text-3xl font-bold">
                  <T keyName="guidedHistory.title" />
                </h1>
                <p className="text-subtle">
                  <T keyName="guidedHistory.subtitle" />
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {hasSessions && (
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={isClearing}
                      className="border-border/70 bg-surface/85 text-rose-600 hover:border-rose-300 hover:text-rose-700 inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      <T keyName="guidedHistory.clearHistory" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate({ to: '/guided' })}
                    className="bg-brand shadow-brand hover:bg-brand-hover inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px"
                  >
                    <Plus className="h-4 w-4" />
                    <T keyName="guidedHistory.newSession" />
                  </button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => {
                  const workflowTitleKey = workflowTitleKeys[session.workflow_id];
                  const workflowDescriptionKey =
                    workflowDescriptionKeys[session.workflow_id] ??
                    'guidedHistory.workflow.defaultDescription';

                  return (
                    <div
                      key={session.id}
                      className="group rounded-card border-border/80 bg-surface shadow-card flex flex-col border p-6 transition-all duration-300 hover:-translate-y-0.5"
                    >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-ink group-hover:text-brand mb-1 text-lg font-bold transition-colors">
                          {workflowTitleKey ? (
                            <T keyName={workflowTitleKey} />
                          ) : (
                            formatWorkflowTitle(session.workflow_id)
                          )}
                        </h3>
                        <p className="text-subtle text-sm">
                          <T keyName={workflowDescriptionKey} />
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.is_complete ? (
                          <span className="bg-brand-soft text-brand flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <T keyName="guidedHistory.status.complete" />
                          </span>
                        ) : (
                          <span className="bg-surface-cream text-neutral flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            <T keyName="guidedHistory.status.inProgress" />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(session.id)}
                          aria-label={t('guidedHistory.deleteSession')}
                          disabled={deletingId === session.id}
                          className="border-border/70 bg-surface/85 text-muted hover:border-rose-200 hover:text-rose-600 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                      <div className="mb-4 flex flex-wrap gap-3">
                        <div className="bg-surface-panel text-subtle flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5" />
                          <T
                            keyName="guidedHistory.sessionId"
                            params={{ id: session.id.slice(0, 8) }}
                          />
                        </div>
                        {session.tasks.length > 0 && (
                          <div className="bg-brand-soft text-brand flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {session.tasks.length}{' '}
                            {session.tasks.length === 1 ? (
                              <T keyName="guidedHistory.tasks.singular" />
                            ) : (
                              <T keyName="guidedHistory.tasks.plural" />
                            )}
                          </div>
                        )}
                        {session.warnings.length > 0 && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {session.warnings.length}{' '}
                            {session.warnings.length === 1 ? (
                              <T keyName="guidedHistory.warnings.singular" />
                            ) : (
                              <T keyName="guidedHistory.warnings.plural" />
                            )}
                          </div>
                        )}
                      </div>

                      {session.warnings.length > 0 && (
                        <div className="mb-4 flex-1">
                          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                              <AlertTriangle className="h-3 w-3" />
                              {session.warnings.length === 1 ? (
                                <T keyName="guidedHistory.warningBadge.single" />
                              ) : (
                                <T keyName="guidedHistory.warningBadge.multiple" />
                              )}
                            </div>
                            <p className="line-clamp-2 text-xs text-amber-900">
                              {session.warnings[0]}
                            </p>
                            {session.warnings.length > 1 && (
                              <p className="mt-1 text-xs text-amber-700">
                                {session.warnings.length === 2 ? (
                                  <T
                                    keyName="guidedHistory.moreWarning"
                                    params={{ count: session.warnings.length - 1 }}
                                  />
                                ) : (
                                  <T
                                    keyName="guidedHistory.moreWarnings"
                                    params={{ count: session.warnings.length - 1 }}
                                  />
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => navigate({ to: '/guided' })}
                        className="border-border text-muted hover:border-brand hover:bg-brand-soft hover:text-brand mt-auto flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all"
                      >
                        {session.is_complete ? (
                          <T keyName="guidedHistory.button.viewDetails" />
                        ) : (
                          <T keyName="guidedHistory.button.resume" />
                        )}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate({ to: '/guided' })}
                  className="group bg-surface text-muted hover:border-brand hover:text-brand flex items-center gap-2 rounded-2xl border border-transparent px-6 py-3 font-medium shadow-sm transition-all"
                >
                  <Plus className="text-brand h-5 w-5 transition-transform group-hover:scale-110" />
                  <T keyName="guidedHistory.button.startNew" />
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default GuidedHistoryPage;
