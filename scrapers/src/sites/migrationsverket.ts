import { canonicalizeUrlWithRules } from '../core/url.js';
import type { SiteDefinition } from '../core/types.js';

const ALLOWED_HOSTS = ['www.migrationsverket.se', 'migrationsverket.se'];
const SKIP_PATH_PREFIXES = [
  '/imagedescription.action2',
  '/checkoutimages.action2',
  '/mybookmarks/addbookmark.action2',
  '/mybookmarks/removebookmark.action2',
];
const SKIP_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.svg',
  '.webp',
  '.ico',
  '.css',
  '.js',
  '.json',
  '.xml',
  '.zip',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.mp3',
  '.mp4',
  '.avi',
  '.mov',
  '.wmv',
];

export const migrationsverketSite: SiteDefinition = {
  id: 'migrationsverket',
  displayName: 'Migrationsverket',
  source: 'migrationsverket.se',
  baseUrl: 'https://www.migrationsverket.se',
  robotsUrl: 'https://www.migrationsverket.se/robots.txt',
  outputDirectoryName: 'migrationsverket',
  defaultUserAgent: 'ClarusRAGBot/1.0 (+contact: team@example.com)',
  canonicalizeUrl(rawUrl: string): string | null {
    return canonicalizeUrlWithRules(rawUrl, {
      allowedHosts: ALLOWED_HOSTS,
      preferredHost: 'www.migrationsverket.se',
      forceHttps: true,
      dropHash: true,
      dropSearch: true,
      stripPathPatterns: [/;jsessionid=[^/;?#]*/gi],
      trimTrailingSlash: true,
    });
  },
  shouldSkipPath(pathname: string): boolean {
    const lowerPath = pathname.toLowerCase();

    if (lowerPath.endsWith('.html.printable')) return true;
    if (SKIP_PATH_PREFIXES.some((prefix) => lowerPath.startsWith(prefix.toLowerCase()))) return true;
    if (SKIP_EXTENSIONS.some((ext) => lowerPath.endsWith(ext))) return true;

    return false;
  },
};
