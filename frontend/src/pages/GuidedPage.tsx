import { getWorkflows, startSession, getStep, submitAnswer } from '../services/api';
import { WorkflowMetadata, GuidedSession, GuidedStep } from '../types';
import { ArrowRight, CheckCircle, AlertTriangle, Calendar, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const GuidedPage = () => {
  const [workflows, setWorkflows] = useState<WorkflowMetadata[]>([]);
  const [session, setSession] = useState<GuidedSession | null>(null);
  const [currentStep, setCurrentStep] = useState<GuidedStep | null>(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      <div className="mx-auto max-w-4xl p-8">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Guided Mode</h1>
        <p className="mb-8 text-slate-500">Select a scenario to get step-by-step guidance.</p>

        <div className="grid gap-4 md:grid-cols-2">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              onClick={() => handleStart(wf.id)}
              className="group cursor-pointer rounded-xl border bg-white p-6 transition-all hover:border-blue-400 hover:shadow-md"
            >
              <h3 className="mb-2 flex items-center justify-between text-lg font-semibold text-slate-800 group-hover:text-blue-600">
                {wf.title}
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500" />
              </h3>
              <p className="text-sm text-slate-600">{wf.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Dashboard: Completed Session
  if (session.is_complete) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <h1 className="text-2xl font-bold text-slate-900">Analysis Complete</h1>
          </div>

          {/* Warnings */}
          {session.warnings.length > 0 && (
            <div className="mb-8 rounded-xl border border-amber-100 bg-amber-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                Important Warnings
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

          {/* Action Plan */}
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Calendar className="h-5 w-5 text-blue-500" />
            Action Plan
          </h3>
          <div className="space-y-4">
            {session.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-slate-50"
              >
                <div className="mt-0.5 h-6 w-6 flex-shrink-0 rounded-full border-2 border-slate-300" />
                <div>
                  <h4 className="font-medium text-slate-900">{task.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">{task.description}</p>
                  {task.due_date && (
                    <p className="mt-2 text-xs font-medium text-blue-600">Due: {task.due_date}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setSession(null)}
            className="mt-8 px-6 py-2 font-medium text-slate-600 hover:text-slate-900"
          >
            ← Start another session
          </button>
        </div>
      </div>
    );
  }

  // 3. Wizard: Step View
  if (!currentStep) return <div className="p-8 text-center text-slate-400">Loading step...</div>;

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-8">
        <button
          onClick={() => setSession(null)}
          className="mb-4 text-xs text-slate-400 hover:text-slate-600"
        >
          Cancel
        </button>
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-500" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">{currentStep.title}</h2>
        <p className="text-lg text-slate-600">{currentStep.question}</p>
      </div>

      <div className="space-y-4">
        {currentStep.type === 'text' && (
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full rounded-xl border p-4 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your answer..."
            autoFocus
          />
        )}

        {currentStep.type === 'date' && (
          <input
            type="date"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full rounded-xl border p-4 outline-none focus:ring-2 focus:ring-blue-500"
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
                className={`rounded-xl border p-4 text-left transition-all ${
                  answer === opt
                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                    : 'hover:border-slate-400 hover:bg-slate-50'
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
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            'Processing...'
          ) : (
            <>
              Next Step <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GuidedPage;
