import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import GuidedHistoryPage from './pages/GuidedHistoryPage';
import GuidedPage from './pages/GuidedPage';
import LandingPage from './pages/LandingPage';
import WorkflowsPage from './pages/WorkflowsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div className="font-['DM_Sans','Segoe_UI',sans-serif] text-[#1f2937]">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <>
                <SignedIn>
                  <DashboardPage />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/guided" element={<GuidedPage />} />
          <Route path="/guided/history" element={<GuidedHistoryPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
