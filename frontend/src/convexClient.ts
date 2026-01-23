import { ConvexReactClient } from 'convex/react';

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'http://localhost:3210';

export const convexClient = new ConvexReactClient(convexUrl);
