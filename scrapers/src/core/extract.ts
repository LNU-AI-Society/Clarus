import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

import { normalizeWhitespace } from './utils.js';
import type { ExtractedContent, NullableString } from './types.js';

export function isHtmlResponse(contentType: NullableString, body: string): boolean {
  if (contentType) {
    const normalized = contentType.toLowerCase();
    if (normalized.includes('text/html') || normalized.includes('application/xhtml+xml')) {
      return true;
    }
  }

  const snippet = body.slice(0, 500).toLowerCase();
  return snippet.includes('<html') || snippet.includes('<!doctype html');
}

export function extractContentFromHtml(html: string, pageUrl: string): ExtractedContent {
  const dom = new JSDOM(html, { url: pageUrl });

  try {
    const document = dom.window.document;
    const readability = new Readability(document, { charThreshold: 180 });
    const article = readability.parse();

    const titleCandidates: Array<NullableString | undefined> = [
      article?.title,
      document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      document.title,
      pageUrl,
    ];

    const title =
      titleCandidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0)?.trim() ||
      pageUrl;

    const description = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || null;

    const primaryText = article?.textContent || '';
    const fallbackText = document.querySelector('main')?.textContent || document.body?.textContent || '';
    const content = normalizeWhitespace(primaryText || fallbackText);

    const lang = (document.documentElement.getAttribute('lang') || '').trim() || null;

    const headings: string[] = [];
    const seen = new Set<string>();
    for (const heading of document.querySelectorAll('h1, h2, h3')) {
      const value = normalizeWhitespace(heading.textContent || '');
      if (!value || seen.has(value)) continue;
      seen.add(value);
      headings.push(value);
      if (headings.length >= 30) break;
    }

    return {
      title,
      description,
      lang,
      headings,
      content,
    };
  } finally {
    dom.window.close();
  }
}
