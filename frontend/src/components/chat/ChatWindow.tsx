import React, { useEffect, useRef } from 'react';
import { Message } from '../../types';
import ChatMessage from './ChatMessage';

interface ChatWindowProps {
    messages: Message[];
    isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 select-none">
                        <p className="text-lg">Start a conversation</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} />
                    ))
                )}

                {isLoading && (
                    <div className="flex items-center gap-2 p-4 text-slate-400 animate-pulse">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default ChatWindow;
