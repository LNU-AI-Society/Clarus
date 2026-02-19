import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { TolgeeProvider } from '@tolgee/react';
import { RouterProvider } from '@tanstack/react-router';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { convexClient } from './convexClient';
import './index.css';
import { router } from './router';
import { tolgee } from './tolgee';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        <TolgeeProvider tolgee={tolgee} fallback="Loading...">
          <RouterProvider router={router} />
        </TolgeeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>,
);
