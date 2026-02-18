import type { NullableString } from './types.js';

export interface CanonicalizeUrlRules {
  allowedHosts: string[];
  preferredHost?: string;
  forceHttps?: boolean;
  dropHash?: boolean;
  dropSearch?: boolean;
  stripPathPatterns?: RegExp[];
  trimTrailingSlash?: boolean;
}

export function canonicalizeUrlWithRules(
  rawUrl: string,
  {
    allowedHosts,
    preferredHost,
    forceHttps = true,
    dropHash = true,
    dropSearch = true,
    stripPathPatterns = [],
    trimTrailingSlash = true,
  }: CanonicalizeUrlRules,
): NullableString {
  try {
    const parsed = new URL(rawUrl);
    const allowedHostSet = new Set(allowedHosts);
    if (!allowedHostSet.has(parsed.hostname)) return null;
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

    if (forceHttps) {
      parsed.protocol = 'https:';
    }
    if (preferredHost) {
      parsed.hostname = preferredHost;
    }
    if (dropHash) {
      parsed.hash = '';
    }
    if (dropSearch) {
      parsed.search = '';
    }

    for (const pattern of stripPathPatterns) {
      parsed.pathname = parsed.pathname.replace(pattern, '');
    }

    if (trimTrailingSlash && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
