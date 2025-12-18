import React from 'react';
import { Message } from '../../types';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
    message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>

                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {isUser ? <User className="w-5 h-5 text-blue-600" /> : <Bot className="w-5 h-5 text-purple-600" />}
                </div>

                {/* Bubble */}
                <div className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${isUser
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                    } ${message.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}`}>
                    {message.text}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
