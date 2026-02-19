import { getHistory } from '../services/api';
import { GuidedSession } from '../types';
import Navbar from '../components/Navbar';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Plus,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useTranslate } from '@tolgee/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GuidedHistoryPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslate();
  const [sessions, setSessions] = useState<GuidedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getHistory()
      .then((data) => {
        setSessions(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const getWorkflowTitle = (workflowId: string) => {
    const titles: Record<string, string> = {
      renewal: t('guidedHistory.workflow.renewal.title'),
      change_employer: t('guidedHistory.workflow.change_employer.title'),
      job_loss: t('guidedHistory.workflow.job_loss.title'),
    };
    return (
      titles[workflowId] || workflowId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  const getWorkflowDescription = (workflowId: string) => {
    const descriptions: Record<string, string> = {
      renewal: t('guidedHistory.workflow.renewal.description'),
      change_employer: t('guidedHistory.workflow.change_employer.description'),
      job_loss: t('guidedHistory.workflow.job_loss.description'),
    };
    return descriptions[workflowId] || t('guidedHistory.workflow.defaultDescription');
  };

  return (
    <div className="relative min-h-screen text-[#1f2937]">
      <div className="fixed inset-0 z-0 bg-[linear-gradient(135deg,_#f7f2ed_0%,_#fbf7f2_45%,_#eef6f3_100%)]">
        <div className="pointer-events-none absolute -left-[200px] -top-[240px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,231,214,0.9),_transparent_70%)] opacity-70 blur-[0.5px]" />
        <div className="pointer-events-none absolute -bottom-[260px] -right-[220px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(221,244,241,0.8),_transparent_70%)] opacity-70 blur-[0.5px]" />
      </div>
      <div className="relative z-10 min-h-screen">
        <Navbar
          backTo="/guided"
          backAriaLabel={t('guidedHistory.back')}
          actions={
            <button
              type="button"
              onClick={() => navigate('/guided')}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#0f7a6a] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(15,122,106,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#0b6b5e]"
            >
              <Plus className="h-4 w-4" />
              {t('guidedHistory.newSession')}
            </button>
          }
        />
        <main className="mx-auto w-full max-w-[1120px] px-[18px] py-10 sm:px-6">
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex items-center gap-3 text-[#9aa2a0]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e5ded8] border-t-[#0f7a6a]" />
                <span>{t('guidedHistory.loading')}</span>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-3xl border border-[#efe7e0] bg-white/80 p-12 text-center shadow-[0_18px_40px_rgba(31,41,55,0.12)]">
              <div className="mb-6 rounded-full bg-[#f1eee9] p-6">
                <FileText className="h-12 w-12 text-[#6b4e42]" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-[#1f2937]">
                {t('guidedHistory.empty.title')}
              </h2>
              <p className="mb-8 text-[#6b7280]">
                {t('guidedHistory.empty.body')}
              </p>
              <button
                type="button"
                onClick={() => navigate('/guided')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f7a6a] px-[22px] py-3 font-semibold text-white shadow-[0_16px_30px_rgba(15,122,106,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#0b6b5e]"
              >
                <Plus className="h-5 w-5" />
                {t('guidedHistory.empty.cta')}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold text-[#1f2937]">
                  {t('guidedHistory.title')}
                </h1>
                <p className="text-[#6b7280]">{t('guidedHistory.subtitle')}</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="group flex flex-col rounded-[20px] border border-[rgba(229,222,216,0.8)] bg-white p-6 shadow-[0_14px_30px_rgba(31,41,55,0.1)] transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-1 text-lg font-bold text-[#1f2937] transition-colors group-hover:text-[#0f7a6a]">
                          {getWorkflowTitle(session.workflow_id)}
                        </h3>
                        <p className="text-sm text-[#6b7280]">
                          {getWorkflowDescription(session.workflow_id)}
                        </p>
                      </div>
                      {session.is_complete ? (
                        <span className="flex items-center gap-1 rounded-full bg-[#e8f3f0] px-3 py-1 text-xs font-medium text-[#0f7a6a]">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t('guidedHistory.status.complete')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-[#f1eee9] px-3 py-1 text-xs font-medium text-[#6b6f6c]">
                          <Clock className="h-3.5 w-3.5" />
                          {t('guidedHistory.status.inProgress')}
                        </span>
                      )}
                    </div>

                    <div className="mb-4 flex flex-wrap gap-3">
                      <div className="flex items-center gap-1.5 rounded-lg bg-[#f9f5f1] px-3 py-1.5 text-xs text-[#6b7280]">
                        <Calendar className="h-3.5 w-3.5" />
                        {t('guidedHistory.sessionId', { id: session.id.slice(0, 8) })}
                      </div>
                      {session.tasks.length > 0 && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-[#e8f3f0] px-3 py-1.5 text-xs text-[#0f7a6a]">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {session.tasks.length}{' '}
                          {session.tasks.length === 1
                            ? t('guidedHistory.tasks.singular')
                            : t('guidedHistory.tasks.plural')}
                        </div>
                      )}
                      {session.warnings.length > 0 && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-[#fff7ed] px-3 py-1.5 text-xs text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {session.warnings.length}{' '}
                          {session.warnings.length === 1
                            ? t('guidedHistory.warnings.singular')
                            : t('guidedHistory.warnings.plural')}
                        </div>
                      )}
                    </div>

                    {session.warnings.length > 0 && (
                      <div className="mb-4 flex-1">
                        <div className="rounded-lg border border-amber-100 bg-[#fff7ed] p-3">
                          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                            <AlertTriangle className="h-3 w-3" />
                            {session.warnings.length === 1
                              ? t('guidedHistory.warningBadge.single')
                              : t('guidedHistory.warningBadge.multiple')}
                          </div>
                          <p className="line-clamp-2 text-xs text-amber-900">{session.warnings[0]}</p>
                          {session.warnings.length > 1 && (
                            <p className="mt-1 text-xs text-amber-700">
                              {session.warnings.length === 2
                                ? t('guidedHistory.moreWarning', {
                                    count: session.warnings.length - 1,
                                  })
                                : t('guidedHistory.moreWarnings', {
                                    count: session.warnings.length - 1,
                                  })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate('/guided')}
                      className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-[#e5ded8] py-2.5 text-sm font-medium text-[#5c6664] transition-all hover:border-[#0f7a6a] hover:bg-[#e8f3f0] hover:text-[#0f7a6a]"
                    >
                      {session.is_complete
                        ? t('guidedHistory.button.viewDetails')
                        : t('guidedHistory.button.resume')}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/guided')}
                  className="group flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-medium text-[#5c6664] shadow-sm transition-all hover:border-[#0f7a6a] hover:text-[#0f7a6a]"
                >
                  <Plus className="h-5 w-5 text-[#0f7a6a] transition-transform group-hover:scale-110" />
                  {t('guidedHistory.button.startNew')}
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
