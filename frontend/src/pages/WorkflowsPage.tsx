import LanguageSwitch from '../components/LanguageSwitch';
import { api } from '../lib/convexApi';
import type { GuidedSession } from '../types/guided';
import { useNavigate } from '@tanstack/react-router';
import { T } from '@tolgee/react';
import { useQuery } from 'convex/react';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, FileText } from 'lucide-react';

const WorkflowsPage = () => {
  const navigate = useNavigate();
  const sessionsQuery = useQuery(api.guided.getHistory);
  const sessions = (sessionsQuery ?? []) as GuidedSession[];
  const isLoading = sessionsQuery === undefined;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-10 border-b border-indigo-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              <T keyName="workflows.title" />
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <button
              type="button"
              onClick={() => navigate({ to: '/dashboard' })}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <T keyName="workflows.backToDashboard" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
              <span>
                <T keyName="workflows.loading" />
              </span>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50 text-center">
            <FileText className="mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900">
              <T keyName="workflows.empty.title" />
            </h3>
            <p className="text-slate-500">
              <T keyName="workflows.empty.body" />
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: '/guided' })}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-lg"
            >
              <T keyName="workflows.empty.cta" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      session.is_complete
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {session.is_complete ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Clock className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 capitalize">
                      {session.workflow_id.replace(/_/g, ' ')}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="font-mono text-xs text-slate-400">
                        <T keyName="workflows.sessionId" params={{ id: session.id.slice(0, 8) }} />
                      </span>
                      <span>•</span>
                      <span className={session.is_complete ? 'text-green-600' : 'text-blue-600'}>
                        {session.is_complete ? (
                          <T keyName="workflows.status.completed" />
                        ) : (
                          <T keyName="workflows.status.inProgress" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate({ to: '/guided' })}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-700"
                >
                  <T keyName="workflows.open" />
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkflowsPage;
