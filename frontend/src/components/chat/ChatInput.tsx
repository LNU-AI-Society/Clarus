import { Send } from 'lucide-react';
import { useTranslate } from '@tolgee/react';
import React, { KeyboardEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
  userInput: string;
  setUserInput: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isEmbedded?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  userInput,
  setUserInput,
  onSend,
  isLoading,
  isEmbedded = false,
}) => {
  const { t } = useTranslate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userInput]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      className={
        isEmbedded
          ? 'border-t border-border bg-surface/85 p-4'
          : 'border-t border-border bg-surface/70 px-4 pb-2 pt-4 backdrop-blur'
      }
    >
      <div
        className={
          isEmbedded
            ? 'relative flex w-full items-end overflow-hidden rounded-2xl border border-border bg-surface shadow-soft transition-all focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15'
            : 'relative mx-auto flex max-w-5xl items-end overflow-hidden rounded-3xl border border-border bg-surface/85 shadow-soft transition-all focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15'
        }
      >
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chatInput.placeholder')}
          className="max-h-40 w-full resize-none border-none bg-transparent py-4 pl-5 pr-12 leading-relaxed text-chat placeholder-faint focus:ring-0"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={userInput.trim() === '' || isLoading}
          className="absolute bottom-2 right-2 rounded-full bg-brand p-2 text-white transition-colors hover:bg-brand-hover disabled:opacity-50 disabled:hover:bg-brand"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
