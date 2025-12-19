import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GuidedSession } from '../types';
import { getHistory } from '../services/api';
import { FileText, CheckCircle, Clock } from 'lucide-react';

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
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🛡️</span>
                    <span className="font-bold text-slate-900 text-lg">My Dashboard</span>
                </div>
                <button
                    onClick={logout}
                    className="text-sm text-slate-500 hover:text-slate-900"
                >
                    Logout
                </button>
            </header>

            <main className="max-w-5xl mx-auto p-8">
                <div className="grid md:grid-cols-2 gap-8">

                    {/* Workflows Section */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            My Workflows
                        </h2>

                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <div className="p-8 bg-white rounded-xl border border-dashed border-slate-300 text-center">
                                    <p className="text-slate-500 mb-4">No workflows started yet.</p>
                                    <button
                                        onClick={() => navigate('/guided')}
                                        className="text-blue-600 font-medium hover:underline"
                                    >
                                        Start a new workflow
                                    </button>
                                </div>
                            ) : (
                                history.map(session => (
                                    <div key={session.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-slate-900 capitalize">
                                                {session.workflow_id.replace('_', ' ')}
                                            </h3>
                                            {session.is_complete ? (
                                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Completed
                                                </span>
                                            ) : (
                                                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> In Progress
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mb-4">
                                            ID: {session.id.slice(0, 8)}...
                                        </p>
                                        {/* Resume logic could go here */}
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Chat Section (Placeholder for now) */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-500" />
                            Recent Chats
                        </h2>
                        <div className="p-8 bg-white rounded-xl border border-dashed border-slate-300 text-center">
                            <p className="text-slate-500 mb-4">Chat history coming soon.</p>
                            <button
                                onClick={() => navigate('/chat')}
                                className="text-blue-600 font-medium hover:underline"
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
