import React, { KeyboardEvent, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

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
        <div className="bg-white border-t border-slate-200 p-4">
            <div className="max-w-3xl mx-auto relative flex items-end border border-slate-200 rounded-3xl bg-slate-50 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all overflow-hidden shadow-sm">
                <textarea
                    ref={textareaRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a legal question..."
                    className="w-full max-h-[150px] py-4 pl-5 pr-12 bg-transparent border-none focus:ring-0 resize-none text-slate-700 placeholder-slate-400 leading-relaxed"
                    rows={1}
                    disabled={isLoading}
                />
                <button
                    onClick={onSend}
                    disabled={userInput.trim() === '' || isLoading}
                    className="absolute right-2 bottom-2 p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
