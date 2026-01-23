import { getHistory } from '../services/api';
import { useAuth } from '../context/useAuth';
import { GuidedSession } from '../types';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Plus,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GuidedHistoryPage = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<GuidedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }
    setIsLoading(true);
    getHistory(token)
      .then((data) => {
        setSessions(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [isAuthenticated, token, navigate]);

  const getWorkflowTitle = (workflowId: string) => {
    const titles: Record<string, string> = {
      renewal: 'Permit Renewal',
      change_employer: 'Change of Employer',
      job_loss: 'Job Loss Guidance',
    };
    return (
      titles[workflowId] || workflowId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  const getWorkflowDescription = (workflowId: string) => {
    const descriptions: Record<string, string> = {
      renewal: 'Renew your work permit before it expires',
      change_employer: 'Process for changing your employer',
      job_loss: 'Steps to take when you lose your job',
    };
    return descriptions[workflowId] || 'Guided workflow session';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-purple-600" />
            <span className="text-xl font-bold text-slate-900">Session History</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/guided')}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              New Session
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-purple-500" />
              <span>Loading sessions...</span>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mb-6 rounded-full bg-purple-50 p-6">
              <FileText className="h-12 w-12 text-purple-400" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-slate-900">No Sessions Yet</h2>
            <p className="mb-8 text-slate-500">
              Start a guided workflow to see your history here. Get step-by-step guidance for common
              immigration and employment scenarios.
            </p>
            <button
              type="button"
              onClick={() => navigate('/guided')}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-8 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-purple-700"
            >
              <Plus className="h-5 w-5" />
              Start Your First Session
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold text-slate-900">Your Guided Sessions</h1>
              <p className="text-slate-600">View and manage your previous workflow sessions</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-purple-400 hover:shadow-xl"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 text-lg font-bold text-slate-900 transition-colors group-hover:text-purple-600">
                        {getWorkflowTitle(session.workflow_id)}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {getWorkflowDescription(session.workflow_id)}
                      </p>
                    </div>
                    {session.is_complete ? (
                      <span className="flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Complete
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                        <Clock className="h-3.5 w-3.5" />
                        In Progress
                      </span>
                    )}
                  </div>

                  <div className="mb-4 flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                      <Calendar className="h-3.5 w-3.5" />
                      Session ID: {session.id.slice(0, 8)}
                    </div>
                    {session.tasks.length > 0 && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs text-purple-700">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {session.tasks.length} {session.tasks.length === 1 ? 'Task' : 'Tasks'}
                      </div>
                    )}
                    {session.warnings.length > 0 && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {session.warnings.length}{' '}
                        {session.warnings.length === 1 ? 'Warning' : 'Warnings'}
                      </div>
                    )}
                  </div>

                  {session.warnings.length > 0 && (
                    <div className="mb-4 flex-1">
                      <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                          <AlertTriangle className="h-3 w-3" />
                          {session.warnings.length === 1 ? 'Important' : 'Important Alerts'}
                        </div>
                        <p className="line-clamp-2 text-xs text-amber-900">{session.warnings[0]}</p>
                        {session.warnings.length > 1 && (
                          <p className="mt-1 text-xs text-amber-700">
                            +{session.warnings.length - 1} more warning
                            {session.warnings.length > 2 && 's'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate('/guided')}
                    className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700"
                  >
                    {session.is_complete ? 'View Details' : 'Resume Session'}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => navigate('/guided')}
                className="group flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-medium text-slate-600 shadow-sm transition-all hover:border-purple-400 hover:shadow-md"
              >
                <Plus className="h-5 w-5 text-purple-600 transition-transform group-hover:scale-110" />
                Start a New Guided Session
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default GuidedHistoryPage;
