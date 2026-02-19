import AnalysisView from './AnalysisView';
import { Message } from './types';
import { T } from '@tolgee/react';
import { User, Bot } from 'lucide-react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: Message;
  onQuestionClick?: (q: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onQuestionClick }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`mb-4 flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex max-w-5/6 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}
      >
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isUser ? 'bg-brand-soft' : 'bg-surface-cream'
          }`}
        >
          {isUser ? (
            <User className="text-brand h-5 w-5" />
          ) : (
            <Bot className="text-olive h-5 w-5" />
          )}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-brand rounded-tr-sm whitespace-pre-wrap text-white'
              : 'border-border bg-surface-soft text-chat rounded-tl-sm border'
          } ${message.isError ? 'border-red-200 bg-red-50 text-red-600' : ''}`}
        >
          {isUser ? (
            message.text
          ) : (
            <div className="prose prose-sm prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-headings:mt-3 prose-headings:mb-2 max-w-none">
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
            <div className="border-border mt-4 border-t pt-3">
              <p className="mb-2 text-xs font-semibold opacity-70">
                <T keyName="chatMessage.sources" />
              </p>
              <div className="space-y-1">
                {message.citations.map((doc, idx) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block max-w-64 truncate text-xs opacity-90 hover:underline"
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
