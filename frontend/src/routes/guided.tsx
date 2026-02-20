import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/guided')({
  component: GuidedRoute,
});

function GuidedRoute() {
  return <Outlet />;
}
