import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
} from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const fullIntroText =
    'Chat, guided workflows, and document analysis tailored to Swedish law - built for HR teams and individuals.';
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
    <div className="landing-shell">
      <div className="landing-orb landing-orb--peach" />
      <div className="landing-orb landing-orb--mint" />
      <div className="landing-orb landing-orb--gold" />
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <div className="landing-brand">Clarus</div>
          <div className="landing-nav-actions">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="landing-button landing-button--primary landing-button--small">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <SignOutButton>
                <button className="landing-button landing-button--ghost landing-button--small">
                  Sign out
                </button>
              </SignOutButton>
            </SignedIn>
          </div>
        </div>
      </header>
      <main className="landing-container">
        <div className="flex flex-col gap-12 pb-16 pt-12 lg:flex-row lg:items-center">
          <section className="flex-1 space-y-8">
            <div className="landing-badge">
              <span className="landing-badge-dot" />
              AI legal assistant
            </div>
            <div className="space-y-4">
              <h1 className="landing-heading">
                Clear answers for Swedish employment &amp; immigration.
              </h1>
              <p className="landing-subhead">
                {typedIntroText}
                {!isTypingComplete && <span className="typewriter-caret" aria-hidden="true" />}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="landing-button landing-button--primary">Start free</button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="landing-button landing-button--ghost">View demo</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <button
                  className="landing-button landing-button--primary"
                  onClick={() => navigate('/chat')}
                >
                  Open chat
                </button>
                <button
                  className="landing-button landing-button--ghost"
                  onClick={() => navigate('/guided')}
                >
                  Explore workflows
                </button>
              </SignedIn>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="landing-stat">
                <div className="landing-stat-value">98%</div>
                <div className="landing-stat-label">case clarity</div>
              </div>
              <div className="landing-stat">
                <div className="landing-stat-value">24/7</div>
                <div className="landing-stat-label">instant replies</div>
              </div>
            </div>
          </section>
          <section className="flex-1">
            <div className="landing-app-card">
              <div className="landing-app-header">
                <div>
                  <div className="landing-app-title">Case summary</div>
                  <div className="landing-app-subtitle">Employment contract review</div>
                </div>
                <div className="landing-live">
                  <span className="landing-live-dot" />
                  Live
                </div>
              </div>
              <div className="landing-summary-card">
                <div className="landing-summary-title">Key findings</div>
                <ul className="landing-summary-list">
                  <li>Probation clause not enforceable</li>
                  <li>Notice period: 1 month</li>
                  <li>Work permit valid until 2027</li>
                </ul>
              </div>
              <div className="landing-chat">
                <div className="landing-chat-row landing-chat-row--user">
                  <div className="landing-chat-bubble landing-chat-bubble--user">
                    Can I terminate during probation?
                  </div>
                </div>
                <div className="landing-chat-row">
                  <div className="landing-chat-bubble">
                    Yes, if the contract allows it and you give notice in writing.
                  </div>
                </div>
              </div>
              <div className="landing-progress">
                <div className="landing-progress-ring">
                  <span>60%</span>
                </div>
                <div className="landing-progress-meta">
                  <div>Guided checklist</div>
                  <span>3 of 5 steps completed</span>
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
