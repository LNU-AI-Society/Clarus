import { useAuth } from '@clerk/clerk-react';
import Navbar from '../components/Navbar';
import ChatInput from '../components/chat/ChatInput';
import ChatWindow from '../components/chat/ChatWindow';
import FileUploadArea from '../components/chat/FileUploadArea';
import { Message } from '../components/chat/types';
import { api } from '../lib/convexApi';
import { T, useTranslate } from '@tolgee/react';
import { useAction } from 'convex/react';
import { Lightbulb } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const resolveChatEndpoint = () => {
  const siteUrl = import.meta.env.VITE_CONVEX_SITE_URL?.trim();
  if (siteUrl) {
    return `${trimTrailingSlash(siteUrl)}/chat`;
  }

  const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim() || 'http://localhost:3210';
  return `${trimTrailingSlash(convexUrl)}/chat`;
};

const ChatPage = () => {
  const { t } = useTranslate();
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const analyzeDocument = useAction(api.documents.analyzeDocument);
  const chatEndpoint = resolveChatEndpoint();
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

    const trimmedText = text.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmedText,
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const errorMsgId = (Date.now() + 2).toString();
    const history = messages
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.role, content: m.text }));

    setMessages((prev) => [...prev, userMsg, { id: assistantMsgId, role: 'model', text: '' }]);
    setUserInput('');
    setIsLoading(true);

    try {
      const token = await getToken({ template: 'convex' });
      if (!token) {
        throw new Error('Unauthorized');
      }

      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMsg.text,
          history,
        }),
      });

      if (!response.ok) {
        const errorText = (await response.text()).trim();
        throw new Error(errorText || `Request failed with status ${response.status}.`);
      }

      if (!response.body) {
        throw new Error('No stream received from server.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const contentType = response.headers.get('Content-Type') ?? '';
      const isEventStream = contentType.toLowerCase().includes('text/event-stream');
      let streamedCitations: Message['citations'];

      const updateAssistantMessage = (nextText: string, nextCitations?: Message['citations']) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  text: nextText,
                  citations: nextCitations,
                }
              : msg,
          ),
        );
      };

      let streamedText = '';

      if (isEventStream) {
        let streamBuffer = '';

        const consumeSseEvent = (rawEvent: string) => {
          if (!rawEvent.trim()) {
            return;
          }

          const lines = rawEvent.replace(/\r/g, '').split('\n');
          let eventName = 'message';
          const dataLines: string[] = [];

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
              continue;
            }
            if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trimStart());
            }
          }

          const data = dataLines.join('\n');
          if (eventName === 'text') {
            let delta = data;
            try {
              const parsed = JSON.parse(data) as unknown;
              if (typeof parsed === 'string') {
                delta = parsed;
              }
            } catch {
              // Keep raw data fallback when parsing fails.
            }
            streamedText += delta;
            updateAssistantMessage(streamedText, streamedCitations);
            return;
          }

          if (eventName === 'citations') {
            try {
              const parsed = JSON.parse(data) as unknown;
              if (Array.isArray(parsed)) {
                streamedCitations = parsed as Message['citations'];
                updateAssistantMessage(streamedText, streamedCitations);
              }
            } catch (parseError) {
              console.warn('Failed to parse citations from stream event', parseError);
            }
            return;
          }

          if (eventName === 'error') {
            let message = 'Failed to generate response.';
            try {
              const parsed = JSON.parse(data) as { message?: string };
              if (parsed?.message) {
                message = parsed.message;
              }
            } catch {
              if (data.trim()) {
                message = data.trim();
              }
            }
            throw new Error(message);
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          streamBuffer += decoder.decode(value, { stream: true });
          let boundary = streamBuffer.indexOf('\n\n');
          while (boundary !== -1) {
            const rawEvent = streamBuffer.slice(0, boundary);
            streamBuffer = streamBuffer.slice(boundary + 2);
            consumeSseEvent(rawEvent);
            boundary = streamBuffer.indexOf('\n\n');
          }
        }

        streamBuffer += decoder.decode();
        if (streamBuffer.trim()) {
          for (const rawEvent of streamBuffer.split('\n\n')) {
            consumeSseEvent(rawEvent);
          }
        }
      } else {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          streamedText += decoder.decode(value, { stream: true });
          updateAssistantMessage(streamedText, streamedCitations);
        }

        streamedText += decoder.decode();
      }

      const finalText = streamedText.trim() || t('chat.errors.noResponse');
      updateAssistantMessage(finalText, streamedCitations);
    } catch (error) {
      console.error(error);
      const genericErrorText = t('chat.errors.generic');

      setMessages((prev) => {
        const assistantMessage = prev.find((msg) => msg.id === assistantMsgId);
        if (!assistantMessage) {
          return [
            ...prev,
            {
              id: errorMsgId,
              role: 'model',
              text: genericErrorText,
              isError: true,
            },
          ];
        }

        if (assistantMessage.text.trim()) {
          return [
            ...prev,
            {
              id: errorMsgId,
              role: 'model',
              text: genericErrorText,
              isError: true,
            },
          ];
        }

        return prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: genericErrorText,
                isError: true,
              }
            : msg,
        );
      });
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
        <Navbar backTo="/" />
        <main className="flex flex-1 flex-col pt-6" style={{ paddingBottom: footerPadding }}>

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
