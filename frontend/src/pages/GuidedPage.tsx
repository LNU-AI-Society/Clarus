import { getWorkflows, startSession, getStep, submitAnswer } from '../services/api';
import { WorkflowMetadata, GuidedSession, GuidedStep } from '../types';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GuidedPage = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<WorkflowMetadata[]>([]);
  const [session, setSession] = useState<GuidedSession | null>(null);
  const [currentStep, setCurrentStep] = useState<GuidedStep | null>(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const topRow = (
    <header className="landing-nav">
      <div className="landing-container landing-nav-inner">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#5c6664] transition hover:text-[#1f2937]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={() => window.location.href = '/guided/history'}
          className="landing-button landing-button--ghost landing-button--small"
        >
          View history
        </button>
      </div>
    </header>
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
        <div className="app-shell">
          <div className="app-content min-h-screen">
            {topRow}
            <div className="landing-container py-10">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#1f2937]">Guided mode</h1>
                <p className="text-[#6b7280]">
                  Select a scenario to get step-by-step guidance.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {workflows.map((wf) => (
                  <div
                    key={wf.id}
                    onClick={() => handleStart(wf.id)}
                    className="app-card group cursor-pointer p-6 transition-all hover:-translate-y-0.5 hover:border-[#a7b9b4]"
                  >
                    <h3 className="mb-2 flex items-center justify-between text-lg font-semibold text-[#1f2937] group-hover:text-[#0f7a6a]">
                      {wf.title}
                      <ChevronRight className="h-5 w-5 text-[#c0b4ac] group-hover:text-[#0f7a6a]" />
                    </h3>
                    <p className="text-sm text-[#5c6664]">{wf.description}</p>
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
        <div className="app-shell">
          <div className="app-content min-h-screen">
            {topRow}
            <div className="landing-container py-10">
              <div className="app-card p-8">
                <div className="mb-6 flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-[#2f9e7c]" />
                  <h1 className="text-2xl font-bold text-[#1f2937]">Analysis complete</h1>
                </div>

                {session.warnings.length > 0 && (
                  <div className="mb-8 rounded-2xl border border-amber-100 bg-[#fff7ed] p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-amber-800">
                      <AlertTriangle className="h-5 w-5" />
                      Important warnings
                    </h3>
                    <ul className="space-y-2">
                      {session.warnings.map((w, i) => (
                        <li key={i} className="flex gap-2 text-sm text-amber-900">
                          <span>•</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1f2937]">
                  <Calendar className="h-5 w-5 text-[#0f7a6a]" />
                  Action plan
                </h3>
                <div className="space-y-4">
                  {session.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-4 rounded-2xl border border-[#efe7e0] bg-white p-4 transition-colors"
                    >
                      <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 border-[#cbd5d1]" />
                      <div>
                        <h4 className="font-medium text-[#1f2937]">{task.title}</h4>
                        <p className="mt-1 text-sm text-[#5c6664]">{task.description}</p>
                        {task.due_date && (
                          <p className="mt-2 text-xs font-medium text-[#0f7a6a]">
                            Due: {task.due_date}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSession(null)}
                  className="mt-8 text-sm font-semibold text-[#5c6664] hover:text-[#1f2937]"
                >
                  ← Start another session
                </button>
              </div>
            </div>
          </div>
        </div>
      );
  }

  // 3. Wizard: Step View
  if (!currentStep) {
    return <div className="p-8 text-center text-[#9aa2a0]">Loading step...</div>;
  }

  return (
    <div className="app-shell">
      <div className="app-content min-h-screen">
        {topRow}
        <div className="landing-container py-10">
          <div className="app-card p-8">
            <div className="mb-8">
              <button
                onClick={() => setSession(null)}
                className="mb-4 text-xs text-[#9aa2a0] hover:text-[#5c6664]"
              >
                Cancel
              </button>
              <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-[#f1eee9]">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-[#0f7a6a]" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-[#1f2937]">
                {currentStep.title}
              </h2>
              <p className="text-lg text-[#5c6664]">{currentStep.question}</p>
            </div>

            <div className="space-y-4">
              {currentStep.type === 'text' && (
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full rounded-2xl border border-[#e5ded8] bg-white px-4 py-3 outline-none focus:border-[#0f7a6a] focus:ring-2 focus:ring-[#0f7a6a]/15"
                  placeholder="Type your answer..."
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
                      {opt}
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
                  'Processing...'
                ) : (
                  <>
                    Next step <ArrowRight className="h-4 w-4" />
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
