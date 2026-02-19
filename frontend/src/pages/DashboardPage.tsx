import { getHistory } from '../services/api';
import { GuidedSession } from '../types';
import Navbar from '../components/Navbar';
import { CheckCircle, Clock, FileText } from 'lucide-react';
import { useTranslate } from '@tolgee/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSwitch from '../components/LanguageSwitch';
import { api } from '../lib/convexApi';
import type { GuidedSession } from '../types/guided';
import { useNavigate } from '@tanstack/react-router';
import { T } from '@tolgee/react';
import { useQuery } from 'convex/react';
import { FileText, CheckCircle, Clock } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const historyQuery = useQuery(api.guided.getHistory);
  const history = (historyQuery ?? []) as GuidedSession[];
  const isLoading = historyQuery === undefined;

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
                <Clock className="text-olive h-5 w-5" />
                <T keyName="dashboard.recent.title" />
              </h2>
              <div className="rounded-card border-border/80 bg-surface shadow-card border p-8 text-center">
                <p className="text-subtle mb-4">
                  <T keyName="dashboard.recent.empty" />
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/chat' })}
                  className="text-brand hover:text-brand-hover text-sm font-semibold"
                >
                  <T keyName="dashboard.recent.start" />
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
    );
};

export default DashboardPage;
