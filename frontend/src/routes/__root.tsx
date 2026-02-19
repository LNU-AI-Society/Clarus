import { Outlet, createRootRoute } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootRouteComponent,
});

function RootRouteComponent() {
  return (
    <div className="font-sans text-ink">
      <Outlet />
    </div>
  );
}
