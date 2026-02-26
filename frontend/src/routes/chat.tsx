import ChatPage from '../pages/ChatPage';
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';

type ChatSearch = {
  conversationId?: string;
};

export const Route = createFileRoute('/chat')({
  validateSearch: (search: Record<string, unknown>): ChatSearch => {
    const conversationId =
      typeof search.conversationId === 'string' ? search.conversationId : undefined;
    return conversationId ? { conversationId } : {};
  },
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
