import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
} from '@clerk/clerk-react';
import { User } from 'lucide-react';
import { useTranslate } from '@tolgee/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSwitch from '../components/LanguageSwitch';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslate();
  const fullIntroText = t('landing.hero.intro');
  const [typedIntroText, setTypedIntroText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f2ed] text-[#1f2937]">
      <div className="pointer-events-none absolute -left-[140px] -top-[180px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,231,214,0.9),_transparent_70%)] blur-[0.4px]" />
      <div className="pointer-events-none absolute -bottom-[200px] -right-[180px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(221,244,241,0.85),_transparent_70%)] blur-[0.4px]" />
      <div className="pointer-events-none absolute right-[120px] top-[-100px] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,241,204,0.85),_transparent_70%)] blur-[0.4px]" />
      <header className="relative z-20">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-6 px-[18px] py-5 sm:px-6">
          <div className="font-['Sora'] text-[20px] font-bold text-[#1f2937]">Clarus</div>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <SignedOut>
              <SignInButton mode="modal">
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f7a6a] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(15,122,106,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#0b6b5e]">
                  {t('landing.auth.signIn')}
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                  aria-label={t('landing.auth.profileMenu')}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(167,185,180,0.7)] bg-white/90 text-[#0f7a6a] shadow-[0_10px_24px_rgba(31,41,55,0.08)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#f5f1ec] hover:shadow-[0_14px_30px_rgba(31,41,55,0.12)]"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                </button>
                <div
                  role="menu"
                  aria-hidden={!isProfileOpen}
                  className={`absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border border-[rgba(229,222,216,0.8)] bg-white/95 p-2 text-sm text-[#1f2937] shadow-[0_18px_40px_rgba(31,41,55,0.16)] backdrop-blur-sm transition-all duration-150 ${
                    isProfileOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'
                  }`}
                >
                  <SignOutButton>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-medium text-[#5c6664] transition-colors hover:bg-[#f5f1ec]"
                    >
                      {t('landing.auth.signOut')}
                    </button>
                  </SignOutButton>
                </div>
              </div>
            </SignedIn>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1120px] px-[18px] sm:px-6">
        <div className="flex flex-col gap-12 pb-16 pt-12 lg:flex-row lg:items-center">
          <section className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f3f0] px-3.5 py-1.5 text-xs font-semibold text-[#0f7a6a]">
              <span className="h-2 w-2 rounded-full bg-[#0f7a6a]" />
              {t('landing.badge')}
            </div>
            <div className="space-y-4">
              <h1 className="font-['Sora'] text-[clamp(2.2rem,3.2vw,3.4rem)] leading-[1.1] text-[#1f2937]">
                {t('landing.hero.title')}
              </h1>
              <p className="max-w-[32rem] text-base leading-[1.6] text-[#4b5563]">
                {typedIntroText}
                {!isTypingComplete && (
                  <span
                    className="ml-1.5 inline-block h-[1.1em] w-[2px] animate-[typewriterBlink_0.9s_step-end_infinite] align-text-bottom bg-current motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f7a6a] px-[22px] py-3 font-semibold text-white shadow-[0_16px_30px_rgba(15,122,106,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#0b6b5e]">
                    {t('landing.cta.startFree')}
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(167,185,180,0.7)] bg-white/90 px-[22px] py-3 font-semibold text-[#0f7a6a] transition-all duration-200 hover:shadow-[0_14px_30px_rgba(31,41,55,0.1)]">
                    {t('landing.cta.viewDemo')}
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f7a6a] px-[22px] py-3 font-semibold text-white shadow-[0_16px_30px_rgba(15,122,106,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#0b6b5e]"
                  onClick={() => navigate('/chat')}
                >
                  {t('landing.cta.openChat')}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(167,185,180,0.7)] bg-white/90 px-[22px] py-3 font-semibold text-[#0f7a6a] transition-all duration-200 hover:shadow-[0_14px_30px_rgba(31,41,55,0.1)]"
                  onClick={() => navigate('/guided')}
                >
                  {t('landing.cta.exploreWorkflows')}
                </button>
              </SignedIn>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[rgba(229,222,216,0.7)] bg-white/90 px-4 py-3.5 shadow-[0_12px_24px_rgba(31,41,55,0.08)]">
                <div className="font-['Sora'] text-[18px] font-bold text-[#1f2937]">98%</div>
                <div className="text-xs text-[#6b7280]">{t('landing.stats.caseClarityLabel')}</div>
              </div>
              <div className="rounded-2xl border border-[rgba(229,222,216,0.7)] bg-white/90 px-4 py-3.5 shadow-[0_12px_24px_rgba(31,41,55,0.08)]">
                <div className="font-['Sora'] text-[18px] font-bold text-[#1f2937]">24/7</div>
                <div className="text-xs text-[#6b7280]">{t('landing.stats.instantRepliesLabel')}</div>
              </div>
            </div>
          </section>
          <section className="flex-1">
            <div className="rounded-[28px] border border-[rgba(229,222,216,0.6)] bg-white p-5 shadow-[0_18px_40px_rgba(31,41,55,0.12)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-['Sora'] text-[18px] font-bold text-[#1f2937]">
                    {t('landing.caseSummary.title')}
                  </div>
                  <div className="text-[12px] text-[#7c8784]">
                    {t('landing.caseSummary.subtitle')}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f7f4] px-2.5 py-1 text-[11px] font-semibold text-[#2f9e7c]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2f9e7c]" />
                  {t('landing.caseSummary.live')}
                </div>
              </div>
              <div className="mb-4 rounded-2xl bg-[#f8f3ee] p-4 sm:rounded-[18px]">
                <div className="mb-2 text-[12px] font-bold text-[#8b6b5f]">
                  {t('landing.caseSummary.keyFindings')}
                </div>
                <ul className="list-disc pl-[18px] text-[13px] leading-[1.5] text-[#4b3d36]">
                  <li>{t('landing.caseSummary.finding1')}</li>
                  <li>{t('landing.caseSummary.finding2')}</li>
                  <li>{t('landing.caseSummary.finding3')}</li>
                </ul>
              </div>
              <div className="mb-4 grid gap-2.5">
                <div className="flex justify-end">
                  <div className="max-w-[260px] rounded-2xl bg-[#0f7a6a] px-3.5 py-2.5 text-[13px] leading-[1.4] text-white">
                    {t('landing.caseSummary.question')}
                  </div>
                </div>
                <div className="flex">
                  <div className="max-w-[260px] rounded-2xl bg-[#f1f5f4] px-3.5 py-2.5 text-[13px] leading-[1.4] text-[#2c3b3a]">
                    {t('landing.caseSummary.answer')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-[#f9fafb] p-3 sm:rounded-[18px]">
                <div className="relative grid h-14 w-14 place-items-center rounded-full bg-[conic-gradient(#0f7a6a_60%,_#e4efec_0)] text-[11px] font-bold text-[#0f7a6a]">
                  <span className="absolute inset-[6px] rounded-full bg-[#f9fafb]" />
                  <span className="relative z-10">60%</span>
                </div>
                <div className="flex flex-col gap-0.5 text-[12px] font-bold text-[#1f2937]">
                  <div>{t('landing.caseSummary.guidedChecklistTitle')}</div>
                  <span className="font-medium text-[#6b7280]">
                    {t('landing.caseSummary.guidedChecklistSubtitle')}
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
