import { migrationsverketSite } from './migrationsverket.js';
import type { SiteDefinition } from '../core/types.js';

export const siteRegistry = {
  migrationsverket: migrationsverketSite,
} as const;

export type SiteId = keyof typeof siteRegistry;

export function getSiteById(siteId: string): SiteDefinition | undefined {
  return siteRegistry[siteId as SiteId];
}

export function listSiteIds(): SiteId[] {
  return Object.keys(siteRegistry) as SiteId[];
}
