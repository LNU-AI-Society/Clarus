import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';

const GuidedPlaceholder = () => (
  <div className="p-8 text-center text-slate-500">Guided Mode Coming Soon</div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/guided" element={<GuidedPlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
