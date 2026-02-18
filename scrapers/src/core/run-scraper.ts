import robotsParser from 'robots-parser';
import { createWriteStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chunkTextByWords } from './chunking.js';
import { extractContentFromHtml, isHtmlResponse } from './extract.js';
import { fetchTextWithRetries } from './http.js';
import { closeWriteStream, writeJsonlLine } from './io.js';
import { collectSitemapPages, extractSitemapUrls } from './sitemap.js';
import { sha256, sleep } from './utils.js';
import type {
  ChunkRecord,
  DocumentRecord,
  ExtractedContent,
  FetchTextResult,
  RobotRules,
  RunManifest,
  RunStats,
  RuntimeOptions,
  SiteDefinition,
} from './types.js';

type RobotsParserFactory = (url: string, robotsTxt: string) => RobotRules;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isAllowedByRobots(robots: RobotRules, url: string, userAgent: string): boolean {
  const allowed = robots.isAllowed(url, userAgent);
  return allowed !== false;
}

function resolveOutputDir(site: SiteDefinition, explicitOutputDir: string | null, runId: string): string {
  if (explicitOutputDir) {
    return path.resolve(process.cwd(), explicitOutputDir);
  }
  return path.resolve(__dirname, '..', '..', 'data', site.outputDirectoryName, runId);
}

export async function runSiteScraper(site: SiteDefinition, options: RuntimeOptions): Promise<void> {
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = resolveOutputDir(site, options.outputDir, runId);
  const rawHtmlDir = path.join(outputDir, 'raw_html');

  await fs.mkdir(outputDir, { recursive: true });
  if (options.saveRawHtml) {
    await fs.mkdir(rawHtmlDir, { recursive: true });
  }

  const documentsPath = path.join(outputDir, 'documents.jsonl');
  const chunksPath = path.join(outputDir, 'chunks.jsonl');

  const documentsStream = createWriteStream(documentsPath, { encoding: 'utf8' });
  const chunksStream = createWriteStream(chunksPath, { encoding: 'utf8' });

  const stats: RunStats = {
    sitemap_urls_discovered: 0,
    sitemap_pages_discovered: 0,
    candidate_pages_after_filters: 0,
    pages_attempted: 0,
    pages_saved: 0,
    chunks_saved: 0,
    skipped_fetch_error: 0,
    skipped_http_status: 0,
    skipped_non_html: 0,
    skipped_robots: 0,
    skipped_short_content: 0,
    skipped_duplicate_content: 0,
    skipped_extract_error: 0,
  };

  const startedAt = new Date().toISOString();

  try {
    process.stdout.write(`[start] ${site.displayName} (${options.baseUrl})\n`);

    const robotsResponse = await fetchTextWithRetries(options.robotsUrl, {
      userAgent: options.userAgent,
      timeoutMs: options.timeoutMs,
      retries: options.retries,
    });
    if (robotsResponse.status < 200 || robotsResponse.status >= 300) {
      throw new Error(`robots.txt fetch failed with status ${robotsResponse.status}`);
    }

    const createRobots = robotsParser as unknown as RobotsParserFactory;
    const robots = createRobots(options.robotsUrl, robotsResponse.body);

    const robotsSitemaps = extractSitemapUrls(robotsResponse.body);
    const fallbackSitemaps = robots.getSitemaps?.() || [];
    const sitemapUrls = Array.from(new Set([...robotsSitemaps, ...fallbackSitemaps]));

    if (sitemapUrls.length === 0) {
      throw new Error('No Sitemap entries found in robots.txt');
    }

    stats.sitemap_urls_discovered = sitemapUrls.length;
    process.stdout.write(`[robots] sitemap entries: ${sitemapUrls.length}\n`);

    const sitemapPages = await collectSitemapPages({
      sitemapUrls,
      requestOptions: {
        userAgent: options.userAgent,
        timeoutMs: options.timeoutMs,
        retries: options.retries,
      },
      delayMs: options.delayMs,
      canonicalizeUrl: site.canonicalizeUrl,
      log: (message) => process.stdout.write(`${message}\n`),
    });

    stats.sitemap_pages_discovered = sitemapPages.size;
    process.stdout.write(`[sitemap] page URLs discovered: ${sitemapPages.size}\n`);

    const candidates: Array<{ url: string; lastmod: string | null; changefreq: string | null; priority: string | null }> = [];

    for (const [url, meta] of sitemapPages.entries()) {
      const parsed = new URL(url);
      if (site.shouldSkipPath(parsed.pathname)) continue;
      if (!isAllowedByRobots(robots, url, options.userAgent)) continue;
      candidates.push({ url, ...meta });
    }

    if (options.maxPages > 0) {
      candidates.splice(options.maxPages);
    }

    stats.candidate_pages_after_filters = candidates.length;
    process.stdout.write(`[filter] candidate pages: ${candidates.length}\n`);

    const seenContentHashes = new Set<string>();

    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      stats.pages_attempted += 1;
      process.stdout.write(`[page ${index + 1}/${candidates.length}] ${candidate.url}\n`);

      let pageResponse: FetchTextResult;
      try {
        pageResponse = await fetchTextWithRetries(candidate.url, {
          userAgent: options.userAgent,
          timeoutMs: options.timeoutMs,
          retries: options.retries,
        });
      } catch (error: unknown) {
        stats.skipped_fetch_error += 1;
        process.stdout.write(`  -> fetch error: ${String(error)}\n`);
        await sleep(options.delayMs);
        continue;
      }

      await sleep(options.delayMs);

      if (pageResponse.status < 200 || pageResponse.status >= 300) {
        stats.skipped_http_status += 1;
        continue;
      }

      const finalCanonicalUrl = site.canonicalizeUrl(pageResponse.finalUrl || candidate.url);
      if (!finalCanonicalUrl) {
        stats.skipped_non_html += 1;
        continue;
      }

      const finalParsed = new URL(finalCanonicalUrl);
      if (site.shouldSkipPath(finalParsed.pathname)) {
        stats.skipped_non_html += 1;
        continue;
      }

      if (!isAllowedByRobots(robots, finalCanonicalUrl, options.userAgent)) {
        stats.skipped_robots += 1;
        continue;
      }

      if (!isHtmlResponse(pageResponse.contentType, pageResponse.body)) {
        stats.skipped_non_html += 1;
        continue;
      }

      const extractor = site.extractContent || extractContentFromHtml;
      let extracted: ExtractedContent;
      try {
        extracted = extractor(pageResponse.body, finalCanonicalUrl);
      } catch (error: unknown) {
        stats.skipped_extract_error += 1;
        process.stdout.write(`  -> extract error: ${String(error)}\n`);
        continue;
      }

      if (extracted.content.length < options.minContentChars) {
        stats.skipped_short_content += 1;
        continue;
      }

      const contentHash = sha256(extracted.content);
      if (seenContentHashes.has(contentHash)) {
        stats.skipped_duplicate_content += 1;
        continue;
      }
      seenContentHashes.add(contentHash);

      const fetchedAt = new Date().toISOString();
      const docId = `${site.id}_${sha256(finalCanonicalUrl).slice(0, 16)}`;
      const wordCount = extracted.content.split(/\s+/).filter(Boolean).length;

      let rawHtmlFile: string | null = null;
      if (options.saveRawHtml) {
        rawHtmlFile = path.join('raw_html', `${docId}.html`);
        const rawHtmlPath = path.join(outputDir, rawHtmlFile);
        await fs.writeFile(rawHtmlPath, pageResponse.body, 'utf8');
      }

      const documentRecord: DocumentRecord = {
        doc_id: docId,
        url: finalCanonicalUrl,
        source: site.source,
        title: extracted.title,
        description: extracted.description,
        lang: extracted.lang,
        headings: extracted.headings,
        content: extracted.content,
        word_count: wordCount,
        content_hash: contentHash,
        fetched_at: fetchedAt,
        lastmod: candidate.lastmod,
        changefreq: candidate.changefreq,
        priority: candidate.priority,
        raw_html_file: rawHtmlFile,
      };

      await writeJsonlLine(documentsStream, documentRecord);
      stats.pages_saved += 1;

      const chunkData = chunkTextByWords(extracted.content, options.chunkSize, options.chunkOverlap);
      for (let chunkIndex = 0; chunkIndex < chunkData.length; chunkIndex += 1) {
        const chunk = chunkData[chunkIndex];
        const chunkWords = chunk.chunkText.split(/\s+/).filter(Boolean).length;

        const chunkRecord: ChunkRecord = {
          chunk_id: `${docId}_c${String(chunkIndex).padStart(4, '0')}`,
          doc_id: docId,
          url: finalCanonicalUrl,
          source: site.source,
          title: extracted.title,
          lang: extracted.lang,
          chunk_index: chunkIndex,
          chunk_text: chunk.chunkText,
          chunk_word_count: chunkWords,
          start_word: chunk.startWord,
          end_word: chunk.endWord,
          content_hash: contentHash,
          fetched_at: fetchedAt,
        };

        await writeJsonlLine(chunksStream, chunkRecord);
        stats.chunks_saved += 1;
      }
    }
  } finally {
    await closeWriteStream(documentsStream);
    await closeWriteStream(chunksStream);
  }

  const finishedAt = new Date().toISOString();
  const manifest: RunManifest = {
    run_id: runId,
    site: {
      id: site.id,
      display_name: site.displayName,
      source: site.source,
    },
    started_at: startedAt,
    finished_at: finishedAt,
    config: {
      base_url: options.baseUrl,
      robots_url: options.robotsUrl,
      user_agent: options.userAgent,
      delay_ms: options.delayMs,
      timeout_ms: options.timeoutMs,
      retries: options.retries,
      max_pages: options.maxPages,
      min_content_chars: options.minContentChars,
      chunk_size: options.chunkSize,
      chunk_overlap: options.chunkOverlap,
      save_raw_html: options.saveRawHtml,
    },
    output: {
      documents_jsonl: path.join(outputDir, 'documents.jsonl'),
      chunks_jsonl: path.join(outputDir, 'chunks.jsonl'),
      raw_html_dir: options.saveRawHtml ? path.join(outputDir, 'raw_html') : null,
    },
    stats,
  };

  await fs.writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  process.stdout.write('[done]\n');
  process.stdout.write(`  site: ${site.id}\n`);
  process.stdout.write(`  documents: ${stats.pages_saved}\n`);
  process.stdout.write(`  chunks: ${stats.chunks_saved}\n`);
  process.stdout.write(`  output: ${outputDir}\n`);
}
