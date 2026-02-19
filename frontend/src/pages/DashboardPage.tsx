import { getHistory } from '../services/api';
import { GuidedSession } from '../types';
import Navbar from '../components/Navbar';
import { FileText, CheckCircle, Clock, AlertTriangle,LayoutDashboard,Bell} from 'lucide-react';
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
    <div className="relative min-h-screen text-[#1f2937]">
      <div className="fixed inset-0 z-0 bg-[linear-gradient(135deg,_#f7f2ed_0%,_#fbf7f2_45%,_#eef6f3_100%)]">
        <div className="pointer-events-none absolute -left-[200px] -top-[240px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,231,214,0.9),_transparent_70%)] opacity-70 blur-[0.5px]" />
        <div className="pointer-events-none absolute -bottom-[260px] -right-[220px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(221,244,241,0.8),_transparent_70%)] opacity-70 blur-[0.5px]" />
      </div>
      <div className="relative z-10 min-h-screen">
        <Navbar backTo="/" backAriaLabel={t('dashboard.backToHome')} />
        <main className="mx-auto w-full max-w-[1120px] px-[18px] py-10 sm:px-6">
          <div className="mb-8 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f3f0] px-3 py-1.5 text-xs font-semibold text-[#0f7a6a]">
              {t('dashboard.badge')}
            </span>
            <span className="text-sm font-semibold text-[#1f2937]">
              {t('dashboard.subtitle')}
            </span>
          </div>
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* Navbar */}
      <header className="sticky top-0 z-10 border-b border-indigo-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-600 p-2 text-white shadow-lg shadow-indigo-200">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Clarus Dashboard</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            ← Back to Home
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Current Investigation</h2>
          <p className="mt-2 text-slate-500">Case ID: #CIA-2025-0042 • Status: <span className="font-medium text-blue-600">Active Investigation</span></p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Situation Summary */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Situation Summary</h3>
                <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  {mockSituation.riskLevel} Risk
                </span>
              </div>
              <p className="leading-relaxed text-slate-600">
                {mockSituation.summary}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <Clock size={14} />
                Updated {mockSituation.lastUpdated}
              </div>
            </section>

            {/* 2. Tasks List */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Pending Tasks</h3>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
              </div>
              <div className="space-y-3">
                {mockTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-indigo-50/50 hover:border-indigo-100">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center
                        ${task.status === 'completed' ? 'border-green-500 bg-green-50' : 'border-slate-300'}
                      `}>
                        {task.status === 'completed' && <div className="h-2.5 w-2.5 rounded-full bg-green-500" />}
                      </div>
                      <div>
                        <h4 className={`font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Due: {task.due}</p>
                      </div>
                    </div>
                    {task.status === 'in-progress' && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">

            {/* 4. Progress Indicator */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
              <h3 className="mb-6 text-lg font-bold text-slate-800">Investigation Progress</h3>
              <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
                {/* Circle Background */}
                <svg className="absolute h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
                {/* Progress Circle */}
                <svg className="absolute h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-indigo-600 transition-all duration-1000 ease-out"
                    strokeDasharray={`${mockProgress.percentage}, 100`}
                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-slate-900">{mockProgress.percentage}%</span>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-500">
                Step <span className="font-semibold text-slate-900">{mockProgress.currentCtep}</span> of {mockProgress.totalSteps}
              </div>
            </section>

            {/* 3. Warnings Section */}
            <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-amber-800">
                <Bell size={20} className="fill-amber-800" />
                <h3 className="font-bold">Attention Required</h3>
              </div>
              <ul className="space-y-3">
                {mockWarnings.map((warning, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-amber-900">
                    <div className="mt-0.5">
                      <AlertTriangle size={16} className="text-amber-600" />
                    </div>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </section>

          </div>
        </div>
      </main>
      </div>

    </div>
  );
};

export default DashboardPage;
