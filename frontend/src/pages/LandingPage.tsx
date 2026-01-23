import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
} from '@clerk/clerk-react';
import { BookOpen, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="page-intro" />
      <header className="relative z-10 w-full border-b border-blue-200/50 bg-blue-500/10 shadow-[0_0_35px_rgba(37,99,235,0.45)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <div className="text-lg font-semibold text-slate-900">
            Clarus <span className="text-blue-600">Assistant</span>
          </div>
          <div className="flex items-center justify-end">
            <SignedOut>
              <div className="flex items-center gap-3">
                <SignInButton mode="modal">
                  <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-full border border-blue-200/40 bg-blue-50/70 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:shadow-lg">
                    Sign up
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
          <SignedIn>
              <SignOutButton>
                <button className="rounded-full border border-blue-200/40 bg-blue-50/70 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:shadow-lg">
                  Sign out
                </button>
              </SignOutButton>
            </SignedIn>
          </div>
        </div>
      </header>
      <div className="relative z-10 flex min-h-[calc(100vh-76px)] flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
          Clarus <span className="text-blue-600">Assistant</span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-slate-600">
          Your AI-powered guide to Swedish employment and immigration law. Get instant answers or
          follow detailed workflows.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <SignedIn>
            <button
              onClick={() => navigate('/chat')}
              className="group relative flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/60 p-8 shadow-xl backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl"
            >
              <div className="mb-4 rounded-full bg-blue-50 p-4 transition-transform group-hover:scale-110">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Chat Mode</h3>
              <p className="mt-2 text-slate-500">Ask questions freely and get cited answers</p>
            </button>

            <button
              onClick={() => navigate('/guided')}
              className="group relative flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/60 p-8 shadow-xl backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl"
            >
              <div className="mb-4 rounded-full bg-purple-50 p-4 transition-transform group-hover:scale-110">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Guided Mode</h3>
              <p className="mt-2 text-slate-500">Follow structured workflows for common tasks</p>
            </button>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="group relative flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/60 p-8 text-left shadow-xl backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl">
                <div className="mb-4 rounded-full bg-blue-50 p-4 transition-transform group-hover:scale-110">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Chat Mode</h3>
                <p className="mt-2 text-slate-500">Sign in to start chatting</p>
              </button>
            </SignInButton>

            <SignInButton mode="modal">
              <button className="group relative flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/60 p-8 text-left shadow-xl backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl">
                <div className="mb-4 rounded-full bg-purple-50 p-4 transition-transform group-hover:scale-110">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Guided Mode</h3>
                <p className="mt-2 text-slate-500">Sign in to continue your workflow</p>
              </button>
            </SignInButton>
          </SignedOut>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
