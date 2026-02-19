import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';
import WorkflowsPage from '../pages/WorkflowsPage';

export const Route = createFileRoute('/workflows')({
  component: WorkflowsRoute,
});

function WorkflowsRoute() {
  return (
    <>
      <SignedIn>
        <WorkflowsPage />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
