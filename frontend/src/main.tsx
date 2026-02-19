
import { ClerkProvider } from '@clerk/clerk-react';
import { TolgeeProvider } from '@tolgee/react';
import { ConvexProvider } from 'convex/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { convexClient } from './convexClient';
import './index.css';
import { tolgee } from './tolgee';


const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ConvexProvider client={convexClient}>
        <TolgeeProvider tolgee={tolgee} fallback="Loading...">
          <App />
        </TolgeeProvider>
      </ConvexProvider>
    </ClerkProvider>
  </React.StrictMode>,
);
