import React, { useEffect, useState } from 'react';
import { WorkflowMetadata, GuidedSession, GuidedStep } from '../types';
import { getWorkflows, startSession, getSession, getStep, submitAnswer } from '../services/api';
import { ArrowRight, CheckCircle, AlertTriangle, Calendar, ChevronRight } from 'lucide-react';

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
            <div className="max-w-4xl mx-auto p-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Guided Mode</h1>
                <p className="text-slate-500 mb-8">Select a scenario to get step-by-step guidance.</p>

                <div className="grid md:grid-cols-2 gap-4">
                    {workflows.map(wf => (
                        <div key={wf.id}
                            onClick={() => handleStart(wf.id)}
                            className="border p-6 rounded-xl hover:shadow-md hover:border-blue-400 cursor-pointer transition-all bg-white group">
                            <h3 className="font-semibold text-lg text-slate-800 mb-2 group-hover:text-blue-600 flex items-center justify-between">
                                {wf.title}
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
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
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <h1 className="text-2xl font-bold text-slate-900">Analysis Complete</h1>
                    </div>

                    {/* Warnings */}
                    {session.warnings.length > 0 && (
                        <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <h3 className="flex items-center gap-2 font-semibold text-amber-800 mb-3">
                                <AlertTriangle className="w-5 h-5" />
                                Important Warnings
                            </h3>
                            <ul className="space-y-2">
                                {session.warnings.map((w, i) => (
                                    <li key={i} className="text-amber-900 text-sm flex gap-2">
                                        <span>•</span> {w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Action Plan */}
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Action Plan
                    </h3>
                    <div className="space-y-4">
                        {session.tasks.map(task => (
                            <div key={task.id} className="flex items-start gap-4 p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-slate-900">{task.title}</h4>
                                    <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                                    {task.due_date && (
                                        <p className="text-xs text-blue-600 mt-2 font-medium">Due: {task.due_date}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setSession(null)}
                        className="mt-8 px-6 py-2 text-slate-600 hover:text-slate-900 font-medium"
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
        <div className="max-w-2xl mx-auto p-8">
            <div className="mb-8">
                <button
                    onClick={() => setSession(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 mb-4"
                >
                    Cancel
                </button>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
                    <div className="bg-blue-500 h-full w-1/3 animate-pulse rounded-full" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{currentStep.title}</h2>
                <p className="text-lg text-slate-600">{currentStep.question}</p>
            </div>

            <div className="space-y-4">
                {currentStep.type === 'text' && (
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Type your answer..."
                        autoFocus
                    />
                )}

                {currentStep.type === 'date' && (
                    <input
                        type="date"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        autoFocus
                    />
                )}

                {currentStep.type === 'radio' && currentStep.options && (
                    <div className="grid gap-3">
                        {currentStep.options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => { setAnswer(opt); }}
                                className={`p-4 rounded-xl border text-left transition-all ${answer === opt
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
                    className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                    {isLoading ? 'Processing...' : (
                        <>
                            Next Step <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default GuidedPage;
