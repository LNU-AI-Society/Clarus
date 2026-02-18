import ChatInput from '../components/chat/ChatInput';
import ChatWindow from '../components/chat/ChatWindow';
import FileUploadArea from '../components/chat/FileUploadArea';
import LanguageSwitch from '../components/LanguageSwitch';
import { analyzeDocument, streamChat } from '../services/api';
import { Message } from '../types';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { useTranslate } from '@tolgee/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isEmpty = messages.length === 0;
  const suggestedQuestions = [
    t('chat.suggested.q1'),
    t('chat.suggested.q2'),
    t('chat.suggested.q3'),
    t('chat.suggested.q4'),
    t('chat.suggested.q5'),
  ];

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
                      text: t('chat.errors.noResponse'),
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
                    text: t('chat.errors.generic'),
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
      text: t('chat.uploadedDocument', { name: file.name }),
    };
    setMessages((prev) => [...prev, uploadMsg]);

    try {
      const result = await analyzeDocument(file);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: t('chat.analysis.summaryIntro'),
        analysis: result,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: t('chat.errors.fileAnalysisFailed'),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,_#f7f2ed_0%,_#fbf7f2_45%,_#eef6f3_100%)] text-[#1f2937]">
      <div className="pointer-events-none absolute -left-[200px] -top-[240px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,231,214,0.9),_transparent_70%)] opacity-70 blur-[0.5px]" />
      <div className="pointer-events-none absolute -bottom-[260px] -right-[220px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(221,244,241,0.8),_transparent_70%)] opacity-70 blur-[0.5px]" />
      <div className="relative z-10 flex h-screen flex-col overflow-hidden">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="fixed left-4 top-4 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(229,222,216,0.9)] bg-white/85 text-[#5c6664] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#a7b9b4] hover:text-[#0f7a6a] sm:left-6 sm:top-6"
          aria-label={t('chat.backToHomeAria')}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6">
          <LanguageSwitch />
        </div>
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
                <h3 className="text-sm font-semibold">{t('chat.suggested.title')}</h3>
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
