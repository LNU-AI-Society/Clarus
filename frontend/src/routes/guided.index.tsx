import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';
import GuidedPage from '../pages/GuidedPage';

export const Route = createFileRoute('/guided/')({
  component: GuidedIndexRoute,
});

function GuidedIndexRoute() {
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
