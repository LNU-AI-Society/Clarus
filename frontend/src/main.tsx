import { ClerkProvider } from '@clerk/clerk-react';
import { ConvexProvider } from 'convex/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { convexClient } from './convexClient';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ConvexProvider client={convexClient}>
        <App />
      </ConvexProvider>
    </ClerkProvider>
  </React.StrictMode>,
);
