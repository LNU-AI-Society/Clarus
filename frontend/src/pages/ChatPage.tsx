import ChatInput from '../components/chat/ChatInput';
import ChatWindow from '../components/chat/ChatWindow';
import FileUploadArea from '../components/chat/FileUploadArea';
import { analyzeDocument, streamChat } from '../services/api';
import { Message } from '../types';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text: string = userInput) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
    };

    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = {
      id: botMsgId,
      role: 'model',
      text: '',
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setUserInput('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => !m.isError)
        .map((m) => ({ role: m.role, content: m.text }));
      let hasStreamingStarted = false;

      await streamChat(userMsg.text, history, (chunk) => {
        if (!hasStreamingStarted) {
          hasStreamingStarted = true;
          setIsLoading(false);
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? {
                  ...msg,
                  text: msg.text + chunk,
                }
              : msg,
          ),
        );
      });

      if (!hasStreamingStarted) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? {
                  ...msg,
                  text: 'No response generated.',
                  isError: true,
                }
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? {
                ...msg,
                text: 'Sorry, something went wrong. Please try again.',
                isError: true,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    // Add a "User uploaded file" message
    const uploadMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: `Uploaded document: ${file.name}`,
    };
    setMessages((prev) => [...prev, uploadMsg]);

    try {
      const result = await analyzeDocument(file);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I've analyzed the document. Here is a summary of the key points and risks:",
        analysis: result,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'Failed to analyze document. Please try again.',
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="mx-auto w-full max-w-3xl px-4 pt-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back home
        </button>
      </div>
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        onQuestionClick={(q) => handleSend(q)}
      />

      <div className="mx-auto w-full max-w-3xl px-4">
        <FileUploadArea onFileSelect={handleFileSelect} isLoading={isLoading} />
      </div>

      <ChatInput
        userInput={userInput}
        setUserInput={setUserInput}
        onSend={() => handleSend(userInput)}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ChatPage;
