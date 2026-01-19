import { Message } from '../../types';
import ChatMessage from './ChatMessage';
import React, { useEffect, useRef } from 'react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onQuestionClick?: (q: string) => void;
}

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
