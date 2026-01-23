import { Message } from '../../types';
import ChatMessage from './ChatMessage';
import { Lightbulb } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onQuestionClick?: (q: string) => void;
}

const suggestedQuestions = [
  'How do I apply for Swedish citizenship?',
  'What are the requirements for a work permit?',
  'How long does a residence permit application take?',
  'Can I bring my family to Sweden?',
  'What documents do I need for asylum?',
];

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onQuestionClick }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-8">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-300 select-none">
            <p className="text-lg">Start a conversation</p>
            {onQuestionClick && (
              <div className="mt-8 w-full max-w-2xl">
                <div className="mb-4 flex items-center gap-2 text-slate-600">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-semibold">Suggested questions</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => onQuestionClick(q)}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-700 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} onQuestionClick={onQuestionClick} />
          ))
        )}

        {isLoading && (
          <div className="flex animate-pulse items-center gap-2 p-4 text-slate-400">
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
