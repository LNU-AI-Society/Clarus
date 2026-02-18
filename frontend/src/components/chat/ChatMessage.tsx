import { Message } from '../../types';
import AnalysisView from './AnalysisView';
import { User, Bot } from 'lucide-react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
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
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isUser ? 'bg-[#e8f3f0]' : 'bg-[#f1eee9]'
          }`}
        >
          {isUser ? (
            <User className="h-5 w-5 text-[#0f7a6a]" />
          ) : (
            <Bot className="h-5 w-5 text-[#6b4e42]" />
          )}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'rounded-tr-sm bg-[#0f7a6a] text-white whitespace-pre-wrap'
              : 'rounded-tl-sm border border-[#e5ded8] bg-[#fdfcfb] text-[#2c3b3a]'
          } ${message.isError ? 'border-red-200 bg-red-50 text-red-600' : ''}`}
        >
          {isUser ? (
            message.text
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-headings:mt-3 prose-headings:mb-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  a: ({ href, children, ...props }) => (
                    <a href={href} target="_blank" rel="noreferrer" {...props}>
                      {children}
                    </a>
                  ),
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}

          {/* Analysis View */}
          {message.analysis && onQuestionClick && (
            <AnalysisView analysis={message.analysis} onQuestionClick={onQuestionClick} />
          )}

          {/* Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 border-t border-[#e5ded8] pt-3">
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
