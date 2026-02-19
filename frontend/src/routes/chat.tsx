import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';
import ChatPage from '../pages/ChatPage';

export const Route = createFileRoute('/chat')({
  component: ChatRoute,
});

function ChatRoute() {
  return (
    <>
      <SignedIn>
        <ChatPage />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
