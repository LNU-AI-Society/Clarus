import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  LayoutDashboard,
  Bell
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();

  // Mock Data
  const mockSituation = {
    summary: "You are currently investigating a potential compliance violation in the Southeast Asia region regarding a third-party vendor. Initial reports suggest inconsistencies in procurement documentation.",
    lastUpdated: "2 hours ago",
    riskLevel: "High"
  };

  const mockTasks = [
    { id: 1, title: "Review Initial Incident Report", status: "completed", due: "Yesterday" },
    { id: 2, title: "Interview Procurement Manager", status: "in-progress", due: "Today, 5:00 PM" },
    { id: 3, title: "Collect Vendor Invoices (2023-2024)", status: "pending", due: "Tomorrow" },
    { id: 4, title: "Analyze Email Correspondence", status: "pending", due: "Oct 24, 2025" },
  ];

  const mockWarnings = [
    "Urgent: Legal hold notice has not been acknowledged by 3 key custodians.",
    "Data Retention policy expires for relevant sector in 5 days."
  ];

  const mockProgress = {
    currentCtep: 2,
    totalSteps: 8,
    percentage: 25
  };

  return (
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
  );
};

export default DashboardPage;
