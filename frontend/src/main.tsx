import App from './App.tsx';
import { convexClient } from './convexClient';
import './index.css';
import { ConvexProvider } from 'convex/react';
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexProvider client={convexClient}>
      <App />
    </ConvexProvider>
  </React.StrictMode>,
);
