import Navbar from '../components/Navbar';
import ChatInput from '../components/chat/ChatInput';
import ChatWindow from '../components/chat/ChatWindow';
import FileUploadArea from '../components/chat/FileUploadArea';
import type { ChatConversation, Message } from '../components/chat/types';
import { DEFAULT_LANGUAGE, normalizeSupportedLanguage } from '../i18n/languages';
import { api } from '../lib/convexApi';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { T, useTolgee, useTranslate } from '@tolgee/react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { Lightbulb, MessagesSquare, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const CONVERSATION_LIST_LIMIT = 60;
const LEGACY_DEFAULT_CONVERSATION_TITLE = 'New chat';

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
  const navigate = useNavigate();
  const search = useSearch({ from: '/chat' });
  const requestedConversationId =
    typeof search.conversationId === 'string' ? search.conversationId : undefined;
  const { t } = useTranslate();
  const tolgee = useTolgee(['language']);
  const { getToken } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  const footerRef = useRef<HTMLDivElement | null>(null);
  const analyzeDocument = useAction(api.documents.analyzeDocument);
  const createConversation = useMutation(api.chat.createConversation);
  const appendMessage = useMutation(api.chat.appendMessage);

  const conversationsQuery = useQuery(api.chat.listConversations, {
    limit: CONVERSATION_LIST_LIMIT,
  });
  const conversations = useMemo(
    () => (conversationsQuery ?? []) as ChatConversation[],
    [conversationsQuery],
  );
  const selectedConversation = conversations.find(
    (conversation) => conversation.id === requestedConversationId,
  );
  const activeConversationId = selectedConversation?.id;

  const messagesQuery = useQuery(
    api.chat.getConversationMessages,
    activeConversationId ? { conversationId: activeConversationId } : 'skip',
  ) as Message[] | undefined;

  const isConversationListLoading = conversationsQuery === undefined;
  const isConversationMessagesLoading = Boolean(
    activeConversationId && messagesQuery === undefined,
  );
  const isRestoringMostRecent =
    !requestedConversationId && !isConversationListLoading && conversations.length > 0;
  const isConversationLoading = isConversationMessagesLoading || isRestoringMostRecent;

  const chatEndpoint = resolveChatEndpoint();
  const currentLanguage = normalizeSupportedLanguage(tolgee.getLanguage()) ?? DEFAULT_LANGUAGE;
  const suggestedQuestionKeys = [
    'chat.suggested.q1',
    'chat.suggested.q2',
    'chat.suggested.q3',
    'chat.suggested.q4',
    'chat.suggested.q5',
  ] as const;

  useEffect(() => {
    if (isConversationListLoading) {
      return;
    }

    if (!requestedConversationId) {
      if (conversations.length > 0) {
        navigate({
          to: '/chat',
          search: { conversationId: conversations[0].id },
          replace: true,
        });
      }
      return;
    }

    if (selectedConversation) {
      return;
    }

    if (conversations.length > 0) {
      navigate({
        to: '/chat',
        search: { conversationId: conversations[0].id },
        replace: true,
      });
      return;
    }

    navigate({ to: '/chat', search: {}, replace: true });
  }, [
    conversations,
    isConversationListLoading,
    navigate,
    requestedConversationId,
    selectedConversation,
  ]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    if (messagesQuery === undefined) {
      return;
    }

    setMessages(messagesQuery);
  }, [activeConversationId, isLoading, messagesQuery]);

  const ensureConversation = async (initialMessage?: string) => {
    if (activeConversationId) {
      return activeConversationId;
    }

    const created = (await createConversation(
      initialMessage ? { initialMessage } : {},
    )) as ChatConversation;
    const conversationId = created.id;

    navigate({
      to: '/chat',
      search: { conversationId },
      replace: true,
    });

    return conversationId;
  };

  const handleOpenConversation = (conversationId: string) => {
    if (isLoading || conversationId === activeConversationId) {
      return;
    }

    navigate({
      to: '/chat',
      search: { conversationId },
    });
  };

  const handleStartNewConversation = async () => {
    if (isLoading || isCreatingConversation) {
      return;
    }

    setIsCreatingConversation(true);
    try {
      const created = (await createConversation({})) as ChatConversation;
      navigate({
        to: '/chat',
        search: { conversationId: created.id },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleSend = async (text: string = userInput) => {
    if (!text.trim() || isLoading) {
      return;
    }

    const trimmedText = text.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmedText,
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const errorMsgId = (Date.now() + 2).toString();
    const history = messages
      .filter((message) => !message.isError)
      .map((message) => ({ role: message.role, content: message.text }));

    setMessages((prev) => [...prev, userMsg, { id: assistantMsgId, role: 'model', text: '' }]);
    setUserInput('');
    setIsLoading(true);

    let conversationId: string | null = activeConversationId ?? null;
    let streamedText = '';
    let streamedCitations: Message['citations'];

    try {
      conversationId = await ensureConversation(trimmedText);
      await appendMessage({
        conversationId,
        role: 'user',
        content: userMsg.text,
        createdAt: Date.now(),
      });

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
          rag_lang: currentLanguage,
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

      const updateAssistantMessage = (nextText: string, nextCitations?: Message['citations']) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMsgId
              ? {
                  ...message,
                  text: nextText,
                  citations: nextCitations,
                }
              : message,
          ),
        );
      };

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

      await appendMessage({
        conversationId,
        role: 'model',
        content: finalText,
        citations: streamedCitations,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error(error);
      const genericErrorText = t('chat.errors.generic');
      const partialText = streamedText.trim();

      setMessages((prev) => {
        const assistantMessage = prev.find((message) => message.id === assistantMsgId);
        if (!assistantMessage || assistantMessage.text.trim()) {
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

        return prev.map((message) =>
          message.id === assistantMsgId
            ? {
                ...message,
                text: genericErrorText,
                isError: true,
              }
            : message,
        );
      });

      if (conversationId) {
        try {
          if (partialText) {
            await appendMessage({
              conversationId,
              role: 'model',
              content: partialText,
              citations: streamedCitations,
              createdAt: Date.now(),
            });
          }

          await appendMessage({
            conversationId,
            role: 'model',
            content: genericErrorText,
            isError: true,
            createdAt: Date.now(),
          });
        } catch (persistError) {
          console.error('Failed to persist chat error state', persistError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    let conversationId: string | null = activeConversationId ?? null;
    const uploadedText = t('chat.uploadedDocument', { name: file.name });

    try {
      conversationId = await ensureConversation(uploadedText);
      const uploadMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: uploadedText,
      };
      setMessages((prev) => [...prev, uploadMsg]);

      await appendMessage({
        conversationId,
        role: 'user',
        content: uploadedText,
        createdAt: Date.now(),
      });

      const result = await analyzeDocument({
        filename: file.name,
        fileType: file.type || undefined,
        size: file.size,
      });

      const botText = t('chat.analysis.summaryIntro');
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: botText,
        analysis: result,
      };
      setMessages((prev) => [...prev, botMsg]);

      await appendMessage({
        conversationId,
        role: 'model',
        content: botText,
        analysis: result,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error(error);
      const errorText = t('chat.errors.fileAnalysisFailed');
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorText,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);

      if (conversationId) {
        try {
          await appendMessage({
            conversationId,
            role: 'model',
            content: errorText,
            isError: true,
            createdAt: Date.now(),
          });
        } catch (persistError) {
          console.error('Failed to persist analysis error', persistError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (keyName: (typeof suggestedQuestionKeys)[number]) => {
    void handleSend(t(keyName));
  };

  const getConversationTitle = (conversation: ChatConversation) => {
    const title = conversation.title.trim();
    if (!title || title === LEGACY_DEFAULT_CONVERSATION_TITLE) {
      return t('chat.conversations.new');
    }
    return title;
  };

  useEffect(() => {
    const element = footerRef.current;
    if (!element) {
      return;
    }

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

  const isEmpty = !isConversationLoading && messages.length === 0;
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
          <section className="mx-auto w-full max-w-5xl px-4 pb-4">
            <div className="border-border/80 bg-surface/90 shadow-soft rounded-2xl border p-3 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-chat-hint flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                  <MessagesSquare className="h-4 w-4" />
                  <T keyName="chat.conversations.title" />
                </div>
                <button
                  type="button"
                  onClick={handleStartNewConversation}
                  disabled={isLoading || isCreatingConversation}
                  className="bg-brand shadow-brand hover:bg-brand-hover inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <T keyName="chat.conversations.new" />
                </button>
              </div>

              {isConversationListLoading ? (
                <p className="text-faint text-sm">
                  <T keyName="chat.conversations.loading" />
                </p>
              ) : conversations.length === 0 ? (
                <p className="text-chat-hint text-sm">
                  <T keyName="chat.conversations.empty" />
                </p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {conversations.map((conversation) => (
                    <button
                      type="button"
                      key={conversation.id}
                      onClick={() => handleOpenConversation(conversation.id)}
                      disabled={isLoading}
                      className={`max-w-60 min-w-44 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                        conversation.id === activeConversationId
                          ? 'border-brand bg-brand-soft/70 text-brand'
                          : 'border-border bg-surface text-chat-soft hover:border-brand/60 hover:bg-surface-soft'
                      }`}
                    >
                      <p className="truncate text-sm font-semibold">
                        {getConversationTitle(conversation)}
                      </p>
                      <p className="truncate text-xs opacity-80">
                        {conversation.last_message_preview || t('chat.conversations.noMessages')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {isConversationLoading ? (
            <div className="flex flex-1 items-center justify-center px-4 pb-8">
              <div className="text-faint flex items-center gap-3">
                <div className="border-border border-t-brand h-7 w-7 animate-spin rounded-full border-4" />
                <span className="text-sm">
                  <T keyName="chat.conversations.openingMostRecent" />
                </span>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-1 flex-col justify-end gap-6">
              <div className="flex w-full items-center justify-center">
                <ChatWindow
                  messages={messages}
                  isLoading={isLoading}
                  onQuestionClick={(question) => handleSend(question)}
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
              onQuestionClick={(question) => handleSend(question)}
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
