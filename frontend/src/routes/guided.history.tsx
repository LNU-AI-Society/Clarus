import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';
import GuidedHistoryPage from '../pages/GuidedHistoryPage';

export const Route = createFileRoute('/guided/history')({
  component: GuidedHistoryRoute,
});

function GuidedHistoryRoute() {
  return (
    <>
      <SignedIn>
        <GuidedHistoryPage />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
