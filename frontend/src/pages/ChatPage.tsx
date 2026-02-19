import LanguageSwitch from '../components/LanguageSwitch';
import ChatInput from '../components/chat/ChatInput';
import ChatWindow from '../components/chat/ChatWindow';
import FileUploadArea from '../components/chat/FileUploadArea';
import { Message } from '../components/chat/types';
import { T, useTranslate } from '@tolgee/react';
import { api } from '../../convex/_generated/api';
import { useAction } from 'convex/react';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const sendMessage = useAction(api.chat.sendMessage);
  const analyzeDocument = useAction(api.documents.analyzeDocument);
  const isEmpty = messages.length === 0;
  const suggestedQuestionKeys = [
    'chat.suggested.q1',
    'chat.suggested.q2',
    'chat.suggested.q3',
    'chat.suggested.q4',
    'chat.suggested.q5',
  ] as const;

  const handleSend = async (text: string = userInput) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => !m.isError)
        .map((m) => ({ role: m.role, content: m.text }));
      const response = await sendMessage({
        message: userMsg.text,
        history,
      });
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.answer?.trim() || t('chat.errors.noResponse'),
        citations: response.citations,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: t('chat.errors.generic'),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMsg]);
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
      const result = await analyzeDocument({
        filename: file.name,
        fileType: file.type || undefined,
        size: file.size,
      });

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

  const handleSuggestedQuestion = (keyName: (typeof suggestedQuestionKeys)[number]) => {
    void handleSend(t(keyName));
  };

  useEffect(() => {
    const element = footerRef.current;
    if (!element) return;

    const updateHeight = () => {
      setFooterHeight(element.offsetHeight);
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const footerPadding = footerHeight
    ? `calc(${footerHeight}px + env(safe-area-inset-bottom))`
    : 'calc(var(--chat-footer-fallback-height) + env(safe-area-inset-bottom))';

  return (
    <div className="text-ink relative min-h-screen">
      <div className="from-app-bg via-app-bg-soft to-app-bg-cool fixed inset-0 z-0 bg-linear-to-br">
        <div className="from-halo-peach/90 pointer-events-none absolute -top-60 -left-52 h-96 w-96 rounded-full bg-radial to-transparent opacity-70" />
        <div className="from-halo-mint/80 pointer-events-none absolute -right-56 -bottom-64 h-96 w-96 rounded-full bg-radial to-transparent opacity-70" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="border-border/90 bg-surface/85 text-muted hover:border-border-strong hover:text-brand fixed top-4 left-4 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-px sm:top-6 sm:left-6"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="fixed top-4 right-4 z-30 sm:top-6 sm:right-6">
          <LanguageSwitch />
        </div>
        <main className="flex flex-1 flex-col pt-16" style={{ paddingBottom: footerPadding }}>
          {isEmpty ? (
            <div className="flex flex-1 flex-col justify-end gap-6">
              <div className="flex w-full items-center justify-center">
                <ChatWindow
                  messages={messages}
                  isLoading={isLoading}
                  onQuestionClick={(q) => handleSend(q)}
                  isEmpty={isEmpty}
                />
              </div>
              <div className="mx-auto w-full max-w-5xl px-4 pb-6">
                <div className="text-chat-hint mb-3 flex items-center gap-2">
                  <Lightbulb className="text-brand h-5 w-5" />
                  <h3 className="text-sm font-semibold">
                    <T keyName="chat.suggested.title" />
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {suggestedQuestionKeys.map((keyName) => (
                    <button
                      type="button"
                      key={keyName}
                      onClick={() => handleSuggestedQuestion(keyName)}
                      className="border-border bg-surface/90 text-chat-soft hover:border-brand hover:text-brand rounded-2xl border p-4 text-left text-sm shadow-sm transition-all hover:shadow-md"
                    >
                      <T keyName={keyName} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              onQuestionClick={(q) => handleSend(q)}
              isEmpty={isEmpty}
            />
          )}
        </main>
        <div ref={footerRef} className="fixed right-0 bottom-0 left-0 z-20">
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
