import { useNavigate } from 'react-router-dom';
import { MessageSquare, BookOpen } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
          Clarus <span className="text-blue-600">Assistant</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Your AI-powered guide to Swedish employment and immigration law. Get instant answers or
          follow detailed workflows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <button
            onClick={() => navigate('/chat')}
            className="group relative flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:-translate-y-1"
          >
            <div className="p-4 bg-blue-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Chat Mode</h3>
            <p className="text-slate-500 mt-2">Ask questions freely and get cited answers</p>
          </button>

          <button
            onClick={() => navigate('/guided')}
            className="group relative flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:-translate-y-1"
          >
            <div className="p-4 bg-purple-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Guided Mode</h3>
            <p className="text-slate-500 mt-2">Follow structured workflows for common tasks</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
