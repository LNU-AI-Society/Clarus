import React from 'react';
import { AnalysisResult } from '../../types';
import { ShieldAlert, CheckCircle, HelpCircle, FileText } from 'lucide-react';

interface AnalysisViewProps {
    analysis: AnalysisResult;
    onQuestionClick: (q: string) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onQuestionClick }) => {
    return (
        <div className="mt-4 flex flex-col gap-4 w-full">
            {/* Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h3>Document Summary</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{analysis.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Key Points */}
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 mb-3 text-green-800 font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        <h3>Key Points</h3>
                    </div>
                    <ul className="space-y-2">
                        {analysis.key_points.map((point, i) => (
                            <li key={i} className="text-sm text-slate-700 flex gap-2">
                                <span className="text-green-500">•</span>
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Risks */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 mb-3 text-amber-800 font-semibold">
                        <ShieldAlert className="w-4 h-4" />
                        <h3>Potential Risks</h3>
                    </div>
                    <ul className="space-y-2">
                        {analysis.risks.map((risk, i) => (
                            <li key={i} className="text-sm text-slate-700 flex gap-2">
                                <span className="text-amber-500">•</span>
                                {risk}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Suggested Questions */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-3 text-blue-800 font-semibold">
                    <HelpCircle className="w-4 h-4" />
                    <h3>Suggested Questions</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {analysis.suggested_questions.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => onQuestionClick(q)}
                            className="px-3 py-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-600 hover:text-white transition-colors text-left"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-2 italic">
                Clarus analysis is informational only and does not constitute legal advice.
            </p>
        </div>
    );
};

export default AnalysisView;
