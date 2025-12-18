import React, { useState } from 'react';
import ChatInput from '../components/chat/ChatInput';
import ChatWindow from '../components/chat/ChatWindow';
import { Message } from '../types';
import { sendMessage } from '../services/api';

const ChatPage = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!userInput.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: userInput.trim()
        };

        setMessages(prev => [...prev, userMsg]);
        setUserInput('');
        setIsLoading(true);

        try {
            // Build history for API (excluding temporary error messages if we had any)
            const history = messages
                .filter(m => !m.isError)
                .map(m => ({ role: m.role, content: m.text }));

            const answer = await sendMessage(userMsg.text, history);

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: answer
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: 'Sorry, something went wrong. Please try again.',
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header can go here optionally */}

            <ChatWindow messages={messages} isLoading={isLoading} />

            <ChatInput
                userInput={userInput}
                setUserInput={setUserInput}
                onSend={handleSend}
                isLoading={isLoading}
            />
        </div>
    );
};

export default ChatPage;
