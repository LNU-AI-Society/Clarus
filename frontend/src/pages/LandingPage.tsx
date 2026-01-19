import { MessageSquare, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
          Clarus <span className="text-blue-600">Assistant</span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-slate-600">
          Your AI-powered guide to Swedish employment and immigration law. Get instant answers or
          follow detailed workflows.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <button
            onClick={() => navigate('/chat')}
            className="group relative flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="mb-4 rounded-full bg-blue-50 p-4 transition-transform group-hover:scale-110">
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Chat Mode</h3>
            <p className="mt-2 text-slate-500">Ask questions freely and get cited answers</p>
          </button>

          <button
            onClick={() => navigate('/guided')}
            className="group relative flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="mb-4 rounded-full bg-purple-50 p-4 transition-transform group-hover:scale-110">
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Guided Mode</h3>
            <p className="mt-2 text-slate-500">Follow structured workflows for common tasks</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
