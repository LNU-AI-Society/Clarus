import { getHistory } from '../services/api';
import { GuidedSession } from '../types';
import Navbar from '../components/Navbar';
import { FileText, CheckCircle, Clock, AlertTriangle,LayoutDashboard,Bell} from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* Navbar */}
      <header className="sticky top-0 z-10 border-b border-indigo-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-600 p-2 text-white shadow-lg shadow-indigo-200">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Clarus Dashboard</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            ← Back to Home
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Current Investigation</h2>
          <p className="mt-2 text-slate-500">Case ID: #CIA-2025-0042 • Status: <span className="font-medium text-blue-600">Active Investigation</span></p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Situation Summary */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Situation Summary</h3>
                <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  {mockSituation.riskLevel} Risk
                </span>
              </div>
              <p className="leading-relaxed text-slate-600">
                {mockSituation.summary}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <Clock size={14} />
                Updated {mockSituation.lastUpdated}
              </div>
            </section>

            {/* 2. Tasks List */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Pending Tasks</h3>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
              </div>
              <div className="space-y-3">
                {mockTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-indigo-50/50 hover:border-indigo-100">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center
                        ${task.status === 'completed' ? 'border-green-500 bg-green-50' : 'border-slate-300'}
                      `}>
                        {task.status === 'completed' && <div className="h-2.5 w-2.5 rounded-full bg-green-500" />}
                      </div>
                      <div>
                        <h4 className={`font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Due: {task.due}</p>
                      </div>
                    </div>
                    {task.status === 'in-progress' && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">

            {/* 4. Progress Indicator */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
              <h3 className="mb-6 text-lg font-bold text-slate-800">Investigation Progress</h3>
              <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
                {/* Circle Background */}
                <svg className="absolute h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
                {/* Progress Circle */}
                <svg className="absolute h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-indigo-600 transition-all duration-1000 ease-out"
                    strokeDasharray={`${mockProgress.percentage}, 100`}
                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-slate-900">{mockProgress.percentage}%</span>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-500">
                Step <span className="font-semibold text-slate-900">{mockProgress.currentCtep}</span> of {mockProgress.totalSteps}
              </div>
            </section>

            {/* 3. Warnings Section */}
            <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-amber-800">
                <Bell size={20} className="fill-amber-800" />
                <h3 className="font-bold">Attention Required</h3>
              </div>
              <ul className="space-y-3">
                {mockWarnings.map((warning, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-amber-900">
                    <div className="mt-0.5">
                      <AlertTriangle size={16} className="text-amber-600" />
                    </div>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </section>

          </div>
        </div>
      </main>
      </div>

    </div>
  );
};

export default DashboardPage;
