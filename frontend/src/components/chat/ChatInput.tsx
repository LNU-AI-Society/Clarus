import { Send } from 'lucide-react';
import React, { KeyboardEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
  userInput: string;
  setUserInput: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ userInput, setUserInput, onSend, isLoading }) => {
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
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="relative mx-auto flex max-w-3xl items-end overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a legal question..."
          className="max-h-[150px] w-full resize-none border-none bg-transparent py-4 pr-12 pl-5 leading-relaxed text-slate-700 placeholder-slate-400 focus:ring-0"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={onSend}
          disabled={userInput.trim() === '' || isLoading}
          className="absolute right-2 bottom-2 rounded-full bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
