import Navbar from '../components/Navbar';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from '@tanstack/react-router';
import { T, useTranslate } from '@tolgee/react';
import { useEffect, useState } from 'react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslate();
  const fullIntroText = t('landing.hero.intro');
  const [typedIntroText, setTypedIntroText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setTypedIntroText(fullIntroText);
      setIsTypingComplete(true);
      return;
    }

    let currentIndex = 0;
    let intervalId: number | undefined;
    setTypedIntroText('');
    setIsTypingComplete(false);

    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        currentIndex += 1;
        setTypedIntroText(fullIntroText.slice(0, currentIndex));

        if (currentIndex >= fullIntroText.length) {
          window.clearInterval(intervalId);
          setIsTypingComplete(true);
        }
      }, 28);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [fullIntroText]);

  return (
    <div className="bg-app-bg text-ink relative min-h-screen overflow-hidden">
      <div className="from-halo-peach/90 pointer-events-none absolute -top-44 -left-36 h-96 w-96 rounded-full bg-radial to-transparent" />
      <div className="from-halo-mint/85 pointer-events-none absolute -right-44 -bottom-52 h-96 w-96 rounded-full bg-radial to-transparent" />
      <div className="from-halo-gold/85 pointer-events-none absolute -top-24 right-24 h-64 w-64 rounded-full bg-radial to-transparent" />
      <Navbar />
      <main className="max-w-layout mx-auto w-full px-4 sm:px-6">
        <div className="flex flex-col gap-12 pt-12 pb-16 lg:flex-row lg:items-center">
          <section className="flex-1 space-y-8">
            <div className="bg-brand-soft text-brand inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold">
              <span className="bg-brand h-2 w-2 rounded-full" />
              <T keyName="landing.badge" />
            </div>
            <div className="space-y-4">
              <h1 className="font-display text-ink text-4xl leading-tight sm:text-5xl">
                <T keyName="landing.hero.title" />
              </h1>
              <p className="text-subtle max-w-lg text-base leading-relaxed">
                {typedIntroText}
                {!isTypingComplete && (
                  <span
                    className="animate-typewriter-blink ml-1.5 inline-block h-4 w-px bg-current align-text-bottom motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="bg-brand shadow-brand hover:bg-brand-hover inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-px"
                  >
                    <T keyName="landing.cta.startFree" />
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="border-border-strong/70 bg-surface/90 text-brand shadow-soft hover:shadow-card inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 font-semibold transition-all duration-200"
                  >
                    <T keyName="landing.cta.viewDemo" />
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <button
                  type="button"
                  className="bg-brand shadow-brand hover:bg-brand-hover inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-px"
                  onClick={() => navigate({ to: '/chat' })}
                >
                  <T keyName="landing.cta.openChat" />
                </button>
                <button
                  type="button"
                  className="border-border-strong/70 bg-surface/90 text-brand shadow-soft hover:shadow-card inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 font-semibold transition-all duration-200"
                  onClick={() => navigate({ to: '/guided' })}
                >
                  <T keyName="landing.cta.exploreWorkflows" />
                </button>
              </SignedIn>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-border/70 bg-surface/90 shadow-soft rounded-2xl border px-4 py-3.5">
                <div className="font-display text-ink text-lg font-bold">98%</div>
                <div className="text-subtle text-xs">
                  <T keyName="landing.stats.caseClarityLabel" />
                </div>
              </div>
              <div className="border-border/70 bg-surface/90 shadow-soft rounded-2xl border px-4 py-3.5">
                <div className="font-display text-ink text-lg font-bold">24/7</div>
                <div className="text-subtle text-xs">
                  <T keyName="landing.stats.instantRepliesLabel" />
                </div>
              </div>
            </div>
          </section>
          <section className="flex-1">
            <div className="rounded-panel border-border/60 bg-surface shadow-panel border p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-display text-ink text-lg font-bold">
                    <T keyName="landing.caseSummary.title" />
                  </div>
                  <div className="text-note text-xs">
                    <T keyName="landing.caseSummary.subtitle" />
                  </div>
                </div>
                <div className="bg-brand-soft-alt text-positive inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
                  <span className="bg-positive h-1.5 w-1.5 rounded-full" />
                  <T keyName="landing.caseSummary.live" />
                </div>
              </div>
              <div className="bg-surface-panel sm:rounded-soft mb-4 rounded-2xl p-4">
                <div className="text-note-warm mb-2 text-xs font-bold">
                  <T keyName="landing.caseSummary.keyFindings" />
                </div>
                <ul className="text-note-dark list-disc pl-5 text-sm leading-snug">
                  <li>
                    <T keyName="landing.caseSummary.finding1" />
                  </li>
                  <li>
                    <T keyName="landing.caseSummary.finding2" />
                  </li>
                  <li>
                    <T keyName="landing.caseSummary.finding3" />
                  </li>
                </ul>
              </div>
              <div className="mb-4 grid gap-2.5">
                <div className="flex justify-end">
                  <div className="bg-brand max-w-64 rounded-2xl px-3.5 py-2.5 text-sm leading-snug text-white">
                    <T keyName="landing.caseSummary.question" />
                  </div>
                </div>
                <div className="flex">
                  <div className="bg-surface-mint text-chat max-w-64 rounded-2xl px-3.5 py-2.5 text-sm leading-snug">
                    <T keyName="landing.caseSummary.answer" />
                  </div>
                </div>
              </div>
              <div className="bg-surface-card sm:rounded-soft flex items-center gap-3 rounded-2xl p-3">
                <div className="border-halo-track border-r-brand border-t-brand text-brand relative grid h-14 w-14 place-items-center rounded-full border-4 text-xs font-bold">
                  <span className="bg-surface-card absolute inset-1 rounded-full" />
                  <span className="relative z-10">60%</span>
                </div>
                <div className="text-ink flex flex-col gap-0.5 text-xs font-bold">
                  <div>
                    <T keyName="landing.caseSummary.guidedChecklistTitle" />
                  </div>
                  <span className="text-subtle font-medium">
                    <T keyName="landing.caseSummary.guidedChecklistSubtitle" />
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
