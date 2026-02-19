import { getHistory } from '../services/api';
import { GuidedSession } from '../types';
import LanguageSwitch from '../components/LanguageSwitch';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { useTranslate } from '@tolgee/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslate();
  const [history, setHistory] = useState<GuidedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,_#f7f2ed_0%,_#fbf7f2_45%,_#eef6f3_100%)] text-[#1f2937]">
      <div className="pointer-events-none absolute -left-[200px] -top-[240px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,231,214,0.9),_transparent_70%)] opacity-70 blur-[0.5px]" />
      <div className="pointer-events-none absolute -bottom-[260px] -right-[220px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(221,244,241,0.8),_transparent_70%)] opacity-70 blur-[0.5px]" />
      <div className="relative z-10 min-h-screen">
        <header className="border-b border-[rgba(229,222,216,0.8)] bg-white/75 backdrop-blur-[18px]">
          <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-[18px] py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f3f0] px-3 py-1.5 text-xs font-semibold text-[#0f7a6a]">
                {t('dashboard.badge')}
              </span>
              <span className="text-sm font-semibold text-[#1f2937]">
                {t('dashboard.subtitle')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitch />
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm font-medium text-[#5c6664] hover:text-[#1f2937]"
              >
                {t('dashboard.backToHome')}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1120px] px-[18px] py-10 sm:px-6">
          <div className="grid gap-8 md:grid-cols-2">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold text-[#1f2937]">
                  <FileText className="h-5 w-5 text-[#0f7a6a]" />
                  {t('dashboard.workflows.title')}
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/guided/history')}
                  className="text-sm font-semibold text-[#0f7a6a] hover:text-[#0b6b5e]"
                >
                  {t('dashboard.workflows.viewAll')}
                </button>
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="rounded-[20px] border border-[rgba(229,222,216,0.8)] bg-white p-6 text-sm text-[#6b7280] shadow-[0_14px_30px_rgba(31,41,55,0.1)]">
                    {t('dashboard.workflows.loading')}
                  </div>
                ) : history.length === 0 ? (
                  <div className="rounded-[20px] border border-[rgba(229,222,216,0.8)] bg-white p-8 text-center shadow-[0_14px_30px_rgba(31,41,55,0.1)]">
                    <p className="mb-4 text-[#6b7280]">{t('dashboard.workflows.empty')}</p>
                    <button
                      type="button"
                      onClick={() => navigate('/guided')}
                      className="text-sm font-semibold text-[#0f7a6a] hover:text-[#0b6b5e]"
                    >
                      {t('dashboard.workflows.startNew')}
                    </button>
                  </div>
                ) : (
                  history.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-[20px] border border-[rgba(229,222,216,0.8)] bg-white p-6 shadow-[0_14px_30px_rgba(31,41,55,0.1)]"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-[#1f2937] capitalize">
                          {session.workflow_id.replace('_', ' ')}
                        </h3>
                        {session.is_complete ? (
                          <span className="flex items-center gap-1 rounded-full bg-[#e8f3f0] px-2 py-1 text-xs text-[#0f7a6a]">
                            <CheckCircle className="h-3 w-3" />
                            {t('dashboard.session.completed')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-[#f1eee9] px-2 py-1 text-xs text-[#6b6f6c]">
                            <Clock className="h-3 w-3" />
                            {t('dashboard.session.inProgress')}
                          </span>
                        )}
                      </div>
                      <p className="mb-4 text-sm text-[#6b7280]">
                        {t('dashboard.session.idLabel', { id: session.id.slice(0, 8) })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#1f2937]">
                <Clock className="h-5 w-5 text-[#6b4e42]" />
                {t('dashboard.recent.title')}
              </h2>
              <div className="rounded-[20px] border border-[rgba(229,222,216,0.8)] bg-white p-8 text-center shadow-[0_14px_30px_rgba(31,41,55,0.1)]">
                <p className="mb-4 text-[#6b7280]">{t('dashboard.recent.empty')}</p>
                <button
                  type="button"
                  onClick={() => navigate('/chat')}
                  className="text-sm font-semibold text-[#0f7a6a] hover:text-[#0b6b5e]"
                >
                  {t('dashboard.recent.start')}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
