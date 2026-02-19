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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`; // Set to scrollHeight, max 150
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
          ? 'border-t border-[#e5ded8] bg-white/85 p-4'
          : 'border-t border-[#e5ded8] bg-white/70 px-4 pb-2 pt-4 backdrop-blur'
      }
    >
      <div
        className={
          isEmbedded
            ? 'relative flex w-full items-end overflow-hidden rounded-2xl border border-[#e5ded8] bg-white shadow-[0_10px_24px_rgba(31,41,55,0.08)] transition-all focus-within:border-[#0f7a6a] focus-within:ring-2 focus-within:ring-[#0f7a6a]/15'
            : 'relative mx-auto flex max-w-5xl items-end overflow-hidden rounded-3xl border border-[#e5ded8] bg-white/85 shadow-[0_10px_24px_rgba(31,41,55,0.08)] transition-all focus-within:border-[#0f7a6a] focus-within:ring-2 focus-within:ring-[#0f7a6a]/15'
        }
      >
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chatInput.placeholder')}
          className="max-h-[150px] w-full resize-none border-none bg-transparent py-4 pl-5 pr-12 leading-relaxed text-[#2c3b3a] placeholder-[#9aa2a0] focus:ring-0"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={onSend}
          disabled={userInput.trim() === '' || isLoading}
          className="absolute bottom-2 right-2 rounded-full bg-[#0f7a6a] p-2 text-white transition-colors hover:bg-[#0b6b5e] disabled:opacity-50 disabled:hover:bg-[#0f7a6a]"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
