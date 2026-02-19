import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory } from '../services/api';
import { GuidedSession } from '../types';
import Navbar from '../components/Navbar';
import { FileText, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { useTranslate } from '@tolgee/react';

const WorkflowsPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslate();
    const [sessions, setSessions] = useState<GuidedSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getHistory()
            .then(setSessions)
            .catch((err) => console.error('Failed to fetch history:', err))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar
                backTo="/dashboard"
                backAriaLabel={t('workflows.backToDashboard')}
                containerClassName="max-w-4xl px-6"
            />

            <main className="mx-auto max-w-4xl p-6">
                <div className="mb-6">
                    <h1 className="text-xl font-bold tracking-tight text-slate-800">
                        {t('workflows.title')}
                    </h1>
                </div>
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"></div>
                            <span>{t('workflows.loading')}</span>
                        </div>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50 text-center">
                        <FileText size={48} className="mb-4 text-slate-300" />
                        <h3 className="text-lg font-medium text-slate-900">{t('workflows.empty.title')}</h3>
                        <p className="text-slate-500">{t('workflows.empty.body')}</p>
                        <button
                            onClick={() => navigate('/guided')}
                            className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-lg"
                        >
                            {t('workflows.empty.cta')}
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
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${session.is_complete ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {session.is_complete ? <CheckCircle size={24} /> : <Clock size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 capitalize">
                                            {session.workflow_id.replace(/_/g, ' ')}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="font-mono text-xs text-slate-400">
                                                {t('workflows.sessionId', { id: session.id.slice(0, 8) })}
                                            </span>
                                            <span>•</span>
                                            <span className={session.is_complete ? 'text-green-600' : 'text-blue-600'}>
                                                {session.is_complete
                                                    ? t('workflows.status.completed')
                                                    : t('workflows.status.inProgress')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/guided')}
                                    className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-700"
                                >
                                    {t('workflows.open')}
                                    <ArrowRight size={16} />
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
