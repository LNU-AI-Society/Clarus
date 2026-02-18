# Scrapers

This directory contains standalone scraping tools used to build RAG-ready datasets.

The scraper code is now structured as a reusable pipeline so you can add more websites without duplicating crawling logic.

## Architecture

Core modules live in `src/core/`:

- `cli.ts` - shared CLI parsing and help output
- `http.ts` - retried fetching + gzip handling
- `sitemap.ts` - robots sitemap extraction and recursive sitemap crawling
- `extract.ts` - default HTML extraction (Readability + JSDOM)
- `chunking.ts` - word-based chunking
- `io.ts` - JSONL streaming writes
- `run-scraper.ts` - shared crawl pipeline
- `types.ts` - shared contracts/interfaces
- `url.ts` - reusable URL canonicalization helper

Site definitions live in `src/sites/` and only contain site-specific rules:

- URL canonicalization
- path filters
- source metadata
- default robots/base URLs

## Setup

```bash
cd scrapers
npm install
```

## Usage

Generic multi-site CLI:

```bash
cd scrapers
npm run scrape -- --site migrationsverket
```

Site-specific shortcut:

```bash
cd scrapers
npm run scrape:migrationsverket
```

Useful options:

- `--max-pages 200`
- `--delay-ms 1500`
- `--timeout-ms 30000`
- `--retries 4`
- `--chunk-size 220`
- `--chunk-overlap 40`
- `--min-content-chars 350`
- `--output-dir ./data/migrationsverket/custom-run`
- `--base-url https://www.example.com`
- `--robots-url https://www.example.com/robots.txt`
- `--no-raw-html`
- `--user-agent "ClarusRAGBot/1.0 (+contact: team@example.com)"`

## Output

By default, each run writes into a timestamped directory:

`data/<site>/<run-id>/`

- `documents.jsonl` - one JSON object per source page
- `chunks.jsonl` - one JSON object per text chunk
- `manifest.json` - run metadata and counters
- `raw_html/` - canonical raw HTML snapshots (unless `--no-raw-html`)

## JSONL schema

`documents.jsonl` records contain:

- `doc_id`, `url`, `source`, `title`, `description`, `lang`
- `headings`, `content`, `word_count`, `content_hash`
- `fetched_at`, `lastmod`, `changefreq`, `priority`
- `raw_html_file`

`chunks.jsonl` records contain:

- `chunk_id`, `doc_id`, `url`, `source`, `title`, `lang`
- `chunk_index`, `chunk_text`, `chunk_word_count`
- `start_word`, `end_word`, `content_hash`, `fetched_at`

## Adding a new site

1. Create a site definition in `src/sites/<site-id>.ts` implementing `SiteDefinition`.
2. Register it in `src/sites/index.ts`.
3. Run with `npm run scrape -- --site <site-id>`.
4. Optional: add a dedicated shortcut script in `package.json`.

This keeps all generic crawling logic in one place and site logic small and composable.

## Notes for RAG ingestion

- Embed `chunk_text` from `chunks.jsonl`
- Store `url`, `title`, `doc_id`, `chunk_id`, and `lang` as retriever metadata
- Keep `content_hash` for deduplication and reindex checks
