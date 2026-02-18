import { XMLParser } from 'fast-xml-parser';

import { fetchTextWithRetries, type HttpRequestOptions } from './http.js';
import { asArray, sleep } from './utils.js';
import type { FetchTextResult, SitemapMeta } from './types.js';

interface SitemapIndexNode {
  loc?: string;
}

interface SitemapUrlNode {
  loc?: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface ParsedSitemapDocument {
  sitemapindex?: {
    sitemap?: SitemapIndexNode | SitemapIndexNode[];
  };
  urlset?: {
    url?: SitemapUrlNode | SitemapUrlNode[];
  };
}

export interface CollectSitemapPagesOptions {
  sitemapUrls: string[];
  requestOptions: HttpRequestOptions;
  delayMs: number;
  canonicalizeUrl: (rawUrl: string) => string | null;
  log: (message: string) => void;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
  removeNSPrefix: true,
});

export function extractSitemapUrls(robotsTxt: string): string[] {
  return robotsTxt
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^sitemap:/i.test(line))
    .map((line) => line.split(':').slice(1).join(':').trim())
    .filter(Boolean);
}

export async function collectSitemapPages({
  sitemapUrls,
  requestOptions,
  delayMs,
  canonicalizeUrl,
  log,
}: CollectSitemapPagesOptions): Promise<Map<string, SitemapMeta>> {
  const queue = [...new Set(sitemapUrls)];
  const seenSitemaps = new Set<string>();
  const pages = new Map<string, SitemapMeta>();

  while (queue.length > 0) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl || seenSitemaps.has(sitemapUrl)) continue;
    seenSitemaps.add(sitemapUrl);

    let response: FetchTextResult;
    try {
      response = await fetchTextWithRetries(sitemapUrl, requestOptions);
    } catch (error: unknown) {
      log(`[sitemap] fetch error ${sitemapUrl}: ${String(error)}`);
      await sleep(delayMs);
      continue;
    }

    await sleep(delayMs);

    if (response.status < 200 || response.status >= 300) {
      log(`[sitemap] skipped (${response.status}) ${sitemapUrl}`);
      continue;
    }

    let parsed: ParsedSitemapDocument;
    try {
      parsed = xmlParser.parse(response.body) as ParsedSitemapDocument;
    } catch {
      log(`[sitemap] invalid xml ${sitemapUrl}`);
      continue;
    }

    const nestedSitemaps = asArray(parsed.sitemapindex?.sitemap);
    if (nestedSitemaps.length > 0) {
      for (const node of nestedSitemaps) {
        if (node.loc) queue.push(String(node.loc));
      }
      continue;
    }

    const urlEntries = asArray(parsed.urlset?.url);
    for (const node of urlEntries) {
      if (!node.loc) continue;
      const canonical = canonicalizeUrl(String(node.loc));
      if (!canonical) continue;

      if (!pages.has(canonical)) {
        pages.set(canonical, {
          lastmod: node.lastmod ? String(node.lastmod) : null,
          changefreq: node.changefreq ? String(node.changefreq) : null,
          priority: node.priority ? String(node.priority) : null,
        });
      }
    }
  }

  return pages;
}
