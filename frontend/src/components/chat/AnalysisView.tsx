import { AnalysisResult } from '../../types';
import { ShieldAlert, CheckCircle, HelpCircle, FileText } from 'lucide-react';
import React from 'react';

interface AnalysisViewProps {
  analysis: AnalysisResult;
  onQuestionClick: (q: string) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onQuestionClick }) => {
  return (
    <div className="mt-4 flex w-full flex-col gap-4">
      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
          <FileText className="h-4 w-4 text-blue-600" />
          <h3>Document Summary</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{analysis.summary}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Key Points */}
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-green-800">
            <CheckCircle className="h-4 w-4" />
            <h3>Key Points</h3>
          </div>
          <ul className="space-y-2">
            {analysis.key_points.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-green-500">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-amber-800">
            <ShieldAlert className="h-4 w-4" />
            <h3>Potential Risks</h3>
          </div>
          <ul className="space-y-2">
            {analysis.risks.map((risk, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-amber-500">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold text-blue-800">
          <HelpCircle className="h-4 w-4" />
          <h3>Suggested Questions</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.suggested_questions.map((q, i) => (
            <button
              key={i}
              onClick={() => onQuestionClick(q)}
              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-center text-[10px] italic text-slate-400">
        Clarus analysis is informational only and does not constitute legal advice.
      </p>
    </div>
  );
};

export default AnalysisView;
