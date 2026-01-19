import { useAuth } from '../context/AuthContext';
import { getHistory } from '../services/api';
import { GuidedSession } from '../types';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { token, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<GuidedSession[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (token) {
      getHistory(token).then(setHistory).catch(console.error);
    }
  }, [isAuthenticated, token, navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <span className="text-lg font-bold text-slate-900">My Dashboard</span>
        </div>
        <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-900">
          Logout
        </button>
      </header>

      <main className="mx-auto max-w-5xl p-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Workflows Section */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
              <FileText className="h-5 w-5 text-blue-500" />
              My Workflows
            </h2>

            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <p className="mb-4 text-slate-500">No workflows started yet.</p>
                  <button
                    onClick={() => navigate('/guided')}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Start a new workflow
                  </button>
                </div>
              ) : (
                history.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="font-semibold capitalize text-slate-900">
                        {session.workflow_id.replace('_', ' ')}
                      </h3>
                      {session.is_complete ? (
                        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          <CheckCircle className="h-3 w-3" /> Completed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">
                          <Clock className="h-3 w-3" /> In Progress
                        </span>
                      )}
                    </div>
                    <p className="mb-4 text-sm text-slate-500">ID: {session.id.slice(0, 8)}...</p>
                    {/* Resume logic could go here */}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Chat Section (Placeholder for now) */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
              <Clock className="h-5 w-5 text-purple-500" />
              Recent Chats
            </h2>
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="mb-4 text-slate-500">Chat history coming soon.</p>
              <button
                onClick={() => navigate('/chat')}
                className="font-medium text-blue-600 hover:underline"
              >
                Start a new chat
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
