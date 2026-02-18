import { getHistory } from '../services/api';
import { GuidedSession } from '../types';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
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
    <div className="app-shell">
      <div className="app-content min-h-screen">
        <header className="app-nav">
          <div className="landing-container flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <span className="app-chip">Dashboard</span>
              <span className="text-sm font-semibold text-[#1f2937]">Your workflows</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm font-medium text-[#5c6664] hover:text-[#1f2937]"
            >
              Back to home
            </button>
          </div>
        </header>

        <main className="landing-container py-10">
          <div className="grid gap-8 md:grid-cols-2">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold text-[#1f2937]">
                  <FileText className="h-5 w-5 text-[#0f7a6a]" />
                  My workflows
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/guided/history')}
                  className="text-sm font-semibold text-[#0f7a6a] hover:text-[#0b6b5e]"
                >
                  View all →
                </button>
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="app-card p-6 text-sm text-[#6b7280]">Loading sessions...</div>
                ) : history.length === 0 ? (
                  <div className="app-card p-8 text-center">
                    <p className="mb-4 text-[#6b7280]">No workflows started yet.</p>
                    <button
                      type="button"
                      onClick={() => navigate('/guided')}
                      className="text-sm font-semibold text-[#0f7a6a] hover:text-[#0b6b5e]"
                    >
                      Start a new workflow
                    </button>
                  </div>
                ) : (
                  history.map((session) => (
                    <div key={session.id} className="app-card p-6">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-[#1f2937] capitalize">
                          {session.workflow_id.replace('_', ' ')}
                        </h3>
                        {session.is_complete ? (
                          <span className="flex items-center gap-1 rounded-full bg-[#e8f3f0] px-2 py-1 text-xs text-[#0f7a6a]">
                            <CheckCircle className="h-3 w-3" /> Completed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-[#f1eee9] px-2 py-1 text-xs text-[#6b6f6c]">
                            <Clock className="h-3 w-3" /> In Progress
                          </span>
                        )}
                      </div>
                      <p className="mb-4 text-sm text-[#6b7280]">ID: {session.id.slice(0, 8)}...</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#1f2937]">
                <Clock className="h-5 w-5 text-[#6b4e42]" />
                Recent chats
              </h2>
              <div className="app-card p-8 text-center">
                <p className="mb-4 text-[#6b7280]">Chat history coming soon.</p>
                <button
                  type="button"
                  onClick={() => navigate('/chat')}
                  className="text-sm font-semibold text-[#0f7a6a] hover:text-[#0b6b5e]"
                >
                  Start a new chat
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
