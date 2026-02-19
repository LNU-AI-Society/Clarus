import { AnalysisResult } from './types';
import { T } from '@tolgee/react';
import { CheckCircle, FileText, HelpCircle, ShieldAlert } from 'lucide-react';
import React from 'react';

interface AnalysisViewProps {
  analysis: AnalysisResult;
  onQuestionClick: (q: string) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onQuestionClick }) => {
  return (
    <div className="mt-4 flex w-full flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
          <FileText className="h-4 w-4 text-blue-600" />
          <h3>
            <T keyName="analysis.summaryTitle" />
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{analysis.summary}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-green-800">
            <CheckCircle className="h-4 w-4" />
            <h3>
              <T keyName="analysis.keyPoints" />
            </h3>
          </div>
          <ul className="space-y-2">
            {analysis.key_points.map((point) => (
              <li key={point} className="flex gap-2 text-sm text-slate-700">
                <span className="text-green-500">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-amber-800">
            <ShieldAlert className="h-4 w-4" />
            <h3>
              <T keyName="analysis.risks" />
            </h3>
          </div>
          <ul className="space-y-2">
            {analysis.risks.map((risk) => (
              <li key={risk} className="flex gap-2 text-sm text-slate-700">
                <span className="text-amber-500">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold text-blue-800">
          <HelpCircle className="h-4 w-4" />
          <h3>
            <T keyName="analysis.suggestedQuestions" />
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.suggested_questions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onQuestionClick(q)}
              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-slate-400 italic">
        <T keyName="analysis.disclaimer" />
      </p>
    </div>
  );
};

export default AnalysisView;
