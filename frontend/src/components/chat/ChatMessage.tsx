import { Message } from '../../types';
import AnalysisView from './AnalysisView';
import { User, Bot } from 'lucide-react';
import React from 'react';

interface ChatMessageProps {
  message: Message;
  onQuestionClick?: (q: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onQuestionClick }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`mb-4 flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}
      >
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-blue-100' : 'bg-purple-100'}`}
        >
          {isUser ? (
            <User className="h-5 w-5 text-blue-600" />
          ) : (
            <Bot className="h-5 w-5 text-purple-600" />
          )}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
            isUser
              ? 'rounded-tr-sm bg-blue-600 text-white'
              : 'rounded-tl-sm border border-slate-100 bg-white text-slate-700'
          } ${message.isError ? 'border-red-200 bg-red-50 text-red-600' : ''}`}
        >
          {message.text}

          {/* Analysis View */}
          {message.analysis && onQuestionClick && (
            <AnalysisView analysis={message.analysis} onQuestionClick={onQuestionClick} />
          )}

          {/* Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 border-t border-slate-100/50 pt-3">
              <p className="mb-2 text-xs font-semibold opacity-70">Sources:</p>
              <div className="space-y-1">
                {message.citations.map((doc, idx) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block max-w-[250px] truncate text-xs opacity-90 hover:underline"
                  >
                    [{idx + 1}] {doc.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
