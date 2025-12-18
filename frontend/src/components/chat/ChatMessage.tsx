import React from 'react';
import { Message } from '../../types';
import { User, Bot } from 'lucide-react';
import AnalysisView from './AnalysisView';

interface ChatMessageProps {
    message: Message;
    onQuestionClick?: (q: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onQuestionClick }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>

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

                    {/* Analysis View */}
                    {message.analysis && onQuestionClick && (
                        <AnalysisView analysis={message.analysis} onQuestionClick={onQuestionClick} />
                    )}

                    {/* Citations */}
                    {message.citations && message.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100/50">
                            <p className="text-xs font-semibold mb-2 opacity-70">Sources:</p>
                            <div className="space-y-1">
                                {message.citations.map((doc, idx) => (
                                    <a
                                        key={doc.id}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block text-xs hover:underline opacity-90 truncate max-w-[250px]"
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
