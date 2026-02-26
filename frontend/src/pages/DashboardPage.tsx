import LanguageSwitch from '../components/LanguageSwitch';
import type { ChatConversation } from '../components/chat/types';
import { api } from '../lib/convexApi';
import type { GuidedSession } from '../types/guided';
import { useNavigate } from '@tanstack/react-router';
import { T, useTranslate } from '@tolgee/react';
import { useMutation, useQuery } from 'convex/react';
import { CheckCircle, Clock, FileText, MessageSquare, Plus } from 'lucide-react';

const LEGACY_DEFAULT_CONVERSATION_TITLE = 'New chat';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslate();
  const historyQuery = useQuery(api.guided.getHistory);
  const history = (historyQuery ?? []) as GuidedSession[];
  const isLoading = historyQuery === undefined;
  const conversationsQuery = useQuery(api.chat.listConversations, { limit: 3 });
  const conversations = (conversationsQuery ?? []) as ChatConversation[];
  const isChatsLoading = conversationsQuery === undefined;
  const createConversation = useMutation(api.chat.createConversation);

  const handleStartChat = async () => {
    try {
      const created = (await createConversation({})) as ChatConversation;
      navigate({
        to: '/chat',
        search: { conversationId: created.id },
      });
    } catch (error) {
      console.error(error);
      navigate({ to: '/chat' });
    }
  };

  const getConversationTitle = (conversation: ChatConversation) => {
    const title = conversation.title.trim();
    if (!title || title === LEGACY_DEFAULT_CONVERSATION_TITLE) {
      return t('chat.conversations.new');
    }
    return title;
  };

  return (
    <div className="from-app-bg via-app-bg-soft to-app-bg-cool text-ink relative min-h-screen overflow-hidden bg-linear-to-br">
      <div className="from-halo-peach/90 pointer-events-none absolute -top-60 -left-52 h-96 w-96 rounded-full bg-radial to-transparent opacity-70" />
      <div className="from-halo-mint/80 pointer-events-none absolute -right-56 -bottom-64 h-96 w-96 rounded-full bg-radial to-transparent opacity-70" />
      <div className="relative z-10 min-h-screen">
        <header className="border-border/80 bg-surface/75 border-b backdrop-blur-lg">
          <div className="max-w-layout mx-auto flex w-full items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="bg-brand-soft text-brand inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
                <T keyName="dashboard.badge" />
              </span>
              <span className="text-ink text-sm font-semibold">
                <T keyName="dashboard.subtitle" />
              </span>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitch />
              <button
                type="button"
                onClick={() => navigate({ to: '/' })}
                className="text-muted hover:text-ink text-sm font-medium"
              >
                <T keyName="dashboard.backToHome" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-layout mx-auto w-full px-4 py-10 sm:px-6">
          <div className="grid gap-8 md:grid-cols-2">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-ink flex items-center gap-2 text-xl font-bold">
                  <FileText className="text-brand h-5 w-5" />
                  <T keyName="dashboard.workflows.title" />
                </h2>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/guided/history' })}
                  className="text-brand hover:text-brand-hover text-sm font-semibold"
                >
                  <T keyName="dashboard.workflows.viewAll" />
                </button>
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="rounded-card border-border/80 bg-surface text-subtle shadow-card border p-6 text-sm">
                    <T keyName="dashboard.workflows.loading" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="rounded-card border-border/80 bg-surface shadow-card border p-8 text-center">
                    <p className="text-subtle mb-4">
                      <T keyName="dashboard.workflows.empty" />
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate({ to: '/guided' })}
                      className="text-brand hover:text-brand-hover text-sm font-semibold"
                    >
                      <T keyName="dashboard.workflows.startNew" />
                    </button>
                  </div>
                ) : (
                  history.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-card border-border/80 bg-surface shadow-card border p-6"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="text-ink font-semibold capitalize">
                          {session.workflow_id.replace('_', ' ')}
                        </h3>
                        {session.is_complete ? (
                          <span className="bg-brand-soft text-brand flex items-center gap-1 rounded-full px-2 py-1 text-xs">
                            <CheckCircle className="h-3 w-3" />
                            <T keyName="dashboard.session.completed" />
                          </span>
                        ) : (
                          <span className="bg-surface-cream text-neutral flex items-center gap-1 rounded-full px-2 py-1 text-xs">
                            <Clock className="h-3 w-3" />
                            <T keyName="dashboard.session.inProgress" />
                          </span>
                        )}
                      </div>
                      <p className="text-subtle mb-4 text-sm">
                        <T
                          keyName="dashboard.session.idLabel"
                          params={{ id: session.id.slice(0, 8) }}
                        />
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 className="text-ink mb-4 flex items-center gap-2 text-xl font-bold">
                <MessageSquare className="text-olive h-5 w-5" />
                <T keyName="dashboard.recent.title" />
              </h2>
              <div className="rounded-card border-border/80 bg-surface shadow-card border p-6">
                {isChatsLoading ? (
                  <p className="text-subtle text-sm">
                    <T keyName="dashboard.recent.loading" />
                  </p>
                ) : conversations.length === 0 ? (
                  <div className="text-center">
                    <p className="text-subtle mb-4">
                      <T keyName="dashboard.recent.empty" />
                    </p>
                    <button
                      type="button"
                      onClick={handleStartChat}
                      className="text-brand hover:text-brand-hover text-sm font-semibold"
                    >
                      <T keyName="dashboard.recent.start" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conversations.map((conversation) => (
                      <button
                        type="button"
                        key={conversation.id}
                        onClick={() =>
                          navigate({
                            to: '/chat',
                            search: { conversationId: conversation.id },
                          })
                        }
                        className="border-border/80 hover:border-brand/40 hover:bg-brand-soft/30 bg-surface-soft flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-ink truncate text-sm font-semibold">
                            {getConversationTitle(conversation)}
                          </p>
                          <p className="text-subtle truncate text-xs">
                            {conversation.last_message_preview || (
                              <T keyName="chat.conversations.noMessages" />
                            )}
                          </p>
                        </div>
                        <Clock className="text-muted h-4 w-4 shrink-0" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleStartChat}
                      className="text-brand hover:text-brand-hover inline-flex items-center gap-2 text-sm font-semibold"
                    >
                      <Plus className="h-4 w-4" />
                      <T keyName="dashboard.recent.start" />
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
