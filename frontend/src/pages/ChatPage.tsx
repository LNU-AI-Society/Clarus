import ChatInput from '../components/chat/ChatInput';
import ChatWindow from '../components/chat/ChatWindow';
import FileUploadArea from '../components/chat/FileUploadArea';
import { analyzeDocument, streamChat } from '../services/api';
import { Message } from '../types';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const suggestedQuestions = [
  'How do I apply for Swedish citizenship?',
  'What are the requirements for a work permit?',
  'How long does a residence permit application take?',
  'Can I bring my family to Sweden?',
  'What documents do I need for asylum?',
];

const ChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isEmpty = messages.length === 0;

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
    <div className="app-shell">
      <div className="app-content flex h-screen flex-col overflow-hidden">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="nav-icon-button fixed left-4 top-4 z-30 sm:left-6 sm:top-6"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <main className={`flex min-h-0 flex-1 flex-col ${isEmpty ? 'pb-72' : 'pb-52 pt-16'}`}>
          {isEmpty ? (
            <div className="flex min-h-0 flex-1 flex-col justify-end gap-6">
              <div className="flex w-full items-center justify-center">
                <ChatWindow
                  messages={messages}
                  isLoading={isLoading}
                  onQuestionClick={(q) => handleSend(q)}
                  isEmpty={isEmpty}
                />
              </div>
            </div>
          ) : (
            <>
              <ChatWindow
                messages={messages}
                isLoading={isLoading}
                onQuestionClick={(q) => handleSend(q)}
                isEmpty={isEmpty}
              />
            </>
          )}
        </main>
        <div className="fixed bottom-0 left-0 right-0 z-20">
          {isEmpty && (
            <div className="mx-auto w-full max-w-5xl px-4 pb-3">
              <div className="mb-3 flex items-center gap-2 text-[#54605e]">
                <Lightbulb className="h-5 w-5 text-[#0f7a6a]" />
                <h3 className="text-sm font-semibold">Suggested questions</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="rounded-2xl border border-[#e5ded8] bg-white/90 p-4 text-left text-sm text-[#334155] shadow-sm transition-all hover:border-[#0f7a6a] hover:text-[#0f7a6a] hover:shadow-md"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mx-auto w-full max-w-5xl px-4 pb-2">
            <FileUploadArea
              onFileSelect={handleFileSelect}
              isLoading={isLoading}
              className="mb-2"
            />
          </div>
          <ChatInput
            userInput={userInput}
            setUserInput={setUserInput}
            onSend={() => handleSend(userInput)}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
