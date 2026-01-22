import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import GuidedPage from './pages/GuidedPage';
import LandingPage from './pages/LandingPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/guided" element={<GuidedPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
