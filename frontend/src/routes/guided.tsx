import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';
import GuidedPage from '../pages/GuidedPage';

export const Route = createFileRoute('/guided')({
  component: GuidedRoute,
});

function GuidedRoute() {
  return (
    <>
      <SignedIn>
        <GuidedPage />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
