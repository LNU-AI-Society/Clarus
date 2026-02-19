import { Message } from '../../types';
import ChatMessage from './ChatMessage';
import React, { useEffect, useRef } from 'react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onQuestionClick?: (q: string) => void;
  isEmpty?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  onQuestionClick,
  isEmpty = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div
      className={
        isEmpty
          ? 'w-full space-y-6 px-4 pb-6 md:px-8'
          : 'flex-1 space-y-6 px-4 pb-6 md:px-8'
      }
    >
      <div
        className={
          isEmpty
            ? 'mx-auto flex w-full max-w-5xl flex-col gap-6'
            : 'mx-auto flex min-h-full max-w-5xl flex-col justify-end gap-6'
        }
      >
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-end pb-8 text-[#9aa2a0] select-none" />
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} onQuestionClick={onQuestionClick} />
          ))
        )}

        {isLoading && (
          <div className="flex animate-pulse items-center gap-2 p-4 text-[#9aa2a0]">
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-[#0f7a6a]"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-[#0f7a6a]"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-[#0f7a6a]"
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
