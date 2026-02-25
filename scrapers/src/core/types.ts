export type NullableString = string | null;

export interface RuntimeOptions {
  baseUrl: string;
  robotsUrl: string;
  userAgent: string;
  delayMs: number;
  timeoutMs: number;
  retries: number;
  maxPages: number;
  minContentChars: number;
  chunkSize: number;
  chunkOverlap: number;
  saveRawHtml: boolean;
  outputDir: NullableString;
}

export interface FetchTextResult {
  status: number;
  body: string;
  bodyBuffer: Buffer;
  finalUrl: string;
  contentType: NullableString;
}

export interface SitemapMeta {
  lastmod: NullableString;
  changefreq: NullableString;
  priority: NullableString;
}

export interface ExtractedContent {
  title: string;
  description: NullableString;
  lang: NullableString;
  headings: string[];
  content: string;
}

export interface ChunkSlice {
  chunkText: string;
  startWord: number;
  endWord: number;
}

export interface RunStats {
  sitemap_urls_discovered: number;
  sitemap_pages_discovered: number;
  candidate_pages_after_filters: number;
  pages_attempted: number;
  pages_saved: number;
  chunks_saved: number;
  skipped_fetch_error: number;
  skipped_http_status: number;
  skipped_non_html: number;
  skipped_robots: number;
  skipped_short_content: number;
  skipped_duplicate_content: number;
  skipped_extract_error: number;
  skipped_content_filter: number;
}

export interface DocumentRecord {
  doc_id: string;
  url: string;
  source: string;
  title: string;
  description: NullableString;
  lang: NullableString;
  headings: string[];
  content: string;
  word_count: number;
  content_hash: string;
  fetched_at: string;
  lastmod: NullableString;
  changefreq: NullableString;
  priority: NullableString;
  raw_html_file: NullableString;
}

export interface ChunkRecord {
  chunk_id: string;
  doc_id: string;
  url: string;
  source: string;
  title: string;
  lang: NullableString;
  chunk_index: number;
  chunk_text: string;
  chunk_word_count: number;
  start_word: number;
  end_word: number;
  content_hash: string;
  fetched_at: string;
}

export interface RobotRules {
  isAllowed(url: string, ua?: string): boolean | undefined;
  getSitemaps?: () => string[];
}

export interface SiteDefinition {
  id: string;
  displayName: string;
  source: string;
  baseUrl: string;
  robotsUrl: string;
  outputDirectoryName: string;
  defaultUserAgent: string;
  sitemapUrls?: string[];
  seedUrls?: string[];
  crawlLinks?: boolean;
  canonicalizeUrl: (rawUrl: string) => NullableString;
  shouldSkipPath: (pathname: string) => boolean;
  extractContent?: (html: string, pageUrl: string) => ExtractedContent | Promise<ExtractedContent>;
  extractPdfContent?: (
    data: Buffer,
    pageUrl: string,
    contentType: NullableString,
  ) => ExtractedContent | Promise<ExtractedContent>;
  filterContent?: (content: ExtractedContent, pageUrl: string) => boolean;
}

export interface RunManifest {
  run_id: string;
  site: {
    id: string;
    display_name: string;
    source: string;
  };
  started_at: string;
  finished_at: string;
  config: {
    base_url: string;
    robots_url: string;
    user_agent: string;
    delay_ms: number;
    timeout_ms: number;
    retries: number;
    max_pages: number;
    min_content_chars: number;
    chunk_size: number;
    chunk_overlap: number;
    save_raw_html: boolean;
  };
  output: {
    documents_jsonl: string;
    chunks_jsonl: string;
    raw_html_dir: NullableString;
  };
  stats: RunStats;
}
