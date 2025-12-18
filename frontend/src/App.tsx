import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

const ChatPlaceholder = () => (
    <div className="p-8 text-center text-slate-500">Chat Mode Coming Soon</div>
);

const GuidedPlaceholder = () => (
    <div className="p-8 text-center text-slate-500">Guided Mode Coming Soon</div>
);

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/chat" element={<ChatPlaceholder />} />
                <Route path="/guided" element={<GuidedPlaceholder />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
