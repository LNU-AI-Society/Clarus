import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

import type { ChunkRecord, RunManifest } from "./core/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const DEFAULT_BATCH_SIZE = 12;
const MAX_BATCH_SIZE = 24;
const MAX_RETRIES = 4;

type JsonObject = Record<string, unknown>;

interface CliOptions {
  runDir: string | null;
  chunksFile: string | null;
  runId: string | null;
  siteId: string | null;
  source: string | null;
  convexUrl: string | null;
  ingestToken: string | null;
  embeddingModel: string | null;
  batchSize: number;
  finalizeRun: boolean;
}

interface ResolvedInputs {
  runId: string;
  siteId: string;
  source: string;
  chunksFilePath: string;
  runDirForReport: string;
}

interface IngestBatchResult {
  embedding_model: string;
  embedding_dimensions: number;
  embedding_tokens: number;
  inserted_chunks: number;
  updated_chunks: number;
}

interface FinalizeResult {
  deactivated_chunks: number;
  active_chunks: number;
}

interface IngestionReport {
  started_at: string;
  finished_at: string;
  run_id: string;
  site_id: string;
  source: string;
  chunks_file: string;
  convex_url: string;
  embedding_model: string | null;
  embedding_dimensions: number | null;
  stats: {
    chunks_read: number;
    batches_sent: number;
    inserted_chunks: number;
    updated_chunks: number;
    embedding_tokens: number;
    deactivated_chunks: number;
    active_chunks_after_finalize: number | null;
  };
}

type ActionClient = {
  action: (
    functionName: string,
    args?: Record<string, unknown>,
  ) => Promise<unknown>;
};

function printHelp(): void {
  process.stdout.write(
    [
      "Usage: npm run ingest:convex -- [options]",
      "",
      "Options:",
      "  --run-dir <path>            Run directory containing manifest.json (recommended)",
      "  --chunks-file <path>        Path to chunks.jsonl (used if run-dir is omitted)",
      "  --run-id <id>               Run ID (required without --run-dir)",
      "  --site-id <id>              Site ID (required without --run-dir)",
      "  --source <source>           Source domain (required without --run-dir)",
      "  --convex-url <url>          Convex deployment URL (or CONVEX_URL env)",
      "  --ingest-token <token>      Ingestion token (or RAG_INGESTION_SECRET env)",
      "  --embedding-model <model>   Override embedding model for ingestion",
      `  --batch-size <number>       Batch size for ingest action (default: ${DEFAULT_BATCH_SIZE})`,
      "  --no-finalize               Skip final stale-chunk deactivation step",
      "  --help                      Show this help text",
      "",
      "Examples:",
      "  npm run ingest:convex -- --run-dir ./data/migrationsverket/2026-02-18T18-35-10-899Z",
      "  npm run ingest:convex -- --chunks-file ./data/run/chunks.jsonl --run-id run-1 --site-id migrationsverket --source migrationsverket.se",
      "",
    ].join("\n"),
  );
}

function parseInteger(flag: string, value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    throw new Error(`Invalid integer for ${flag}: ${value}`);
  }
  return parsed;
}

function parseArgs(argv: string[]): { options: CliOptions; showHelp: boolean } {
  const options: CliOptions = {
    runDir: null,
    chunksFile: null,
    runId: null,
    siteId: null,
    source: null,
    convexUrl: process.env.CONVEX_URL?.trim() || null,
    ingestToken:
      process.env.RAG_INGESTION_SECRET?.trim() ||
      process.env.CONVEX_RAG_INGESTION_SECRET?.trim() ||
      null,
    embeddingModel: process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || null,
    batchSize: DEFAULT_BATCH_SIZE,
    finalizeRun: true,
  };

  let showHelp = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;

    const equalsIndex = arg.indexOf("=");
    const flag = equalsIndex >= 0 ? arg.slice(0, equalsIndex) : arg;
    const inlineValue =
      equalsIndex >= 0 ? arg.slice(equalsIndex + 1) : undefined;

    const readValue = (): string => {
      if (inlineValue !== undefined) return inlineValue;
      i += 1;
      if (i >= argv.length) {
        throw new Error(`Missing value for ${flag}`);
      }
      return argv[i];
    };

    if (flag === "--help") {
      showHelp = true;
      continue;
    }

    if (flag === "--no-finalize") {
      options.finalizeRun = false;
      continue;
    }

    if (flag === "--run-dir") {
      options.runDir = readValue();
      continue;
    }

    if (flag === "--chunks-file") {
      options.chunksFile = readValue();
      continue;
    }

    if (flag === "--run-id") {
      options.runId = readValue();
      continue;
    }

    if (flag === "--site-id") {
      options.siteId = readValue();
      continue;
    }

    if (flag === "--source") {
      options.source = readValue();
      continue;
    }

    if (flag === "--convex-url") {
      options.convexUrl = readValue();
      continue;
    }

    if (flag === "--ingest-token") {
      options.ingestToken = readValue();
      continue;
    }

    if (flag === "--embedding-model") {
      options.embeddingModel = readValue();
      continue;
    }

    if (flag === "--batch-size") {
      options.batchSize = parseInteger(flag, readValue());
      continue;
    }

    throw new Error(`Unknown option: ${flag}`);
  }

  if (options.batchSize < 1) {
    throw new Error("--batch-size must be greater than 0");
  }
  if (options.batchSize > MAX_BATCH_SIZE) {
    throw new Error(`--batch-size cannot exceed ${MAX_BATCH_SIZE}`);
  }

  return { options, showHelp };
}

function isChunkRecord(value: unknown): value is ChunkRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as JsonObject;
  return (
    typeof record.chunk_id === "string" &&
    typeof record.doc_id === "string" &&
    typeof record.url === "string" &&
    typeof record.title === "string" &&
    typeof record.chunk_index === "number" &&
    typeof record.chunk_text === "string" &&
    typeof record.chunk_word_count === "number" &&
    typeof record.start_word === "number" &&
    typeof record.end_word === "number" &&
    typeof record.content_hash === "string" &&
    typeof record.fetched_at === "string"
  );
}

async function resolveInputs(options: CliOptions): Promise<ResolvedInputs> {
  if (options.runDir) {
    const runDirPath = path.resolve(process.cwd(), options.runDir);
    const manifestPath = path.join(runDirPath, "manifest.json");
    const manifestRaw = await fs.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(manifestRaw) as RunManifest;

    const runId = options.runId || manifest.run_id;
    const siteId = options.siteId || manifest.site.id;
    const source = options.source || manifest.site.source;
    const chunkPathFromManifest = manifest.output.chunks_jsonl;
    const chunksFilePath = path.resolve(
      runDirPath,
      options.chunksFile || chunkPathFromManifest || "chunks.jsonl",
    );

    if (!runId)
      throw new Error("Unable to resolve run_id from manifest or CLI args.");
    if (!siteId)
      throw new Error("Unable to resolve site_id from manifest or CLI args.");
    if (!source)
      throw new Error("Unable to resolve source from manifest or CLI args.");

    return {
      runId,
      siteId,
      source,
      chunksFilePath,
      runDirForReport: runDirPath,
    };
  }

  if (
    !options.chunksFile ||
    !options.runId ||
    !options.siteId ||
    !options.source
  ) {
    throw new Error(
      "Without --run-dir you must provide --chunks-file, --run-id, --site-id, and --source.",
    );
  }

  return {
    runId: options.runId,
    siteId: options.siteId,
    source: options.source,
    chunksFilePath: path.resolve(process.cwd(), options.chunksFile),
    runDirForReport: path.dirname(
      path.resolve(process.cwd(), options.chunksFile),
    ),
  };
}

function mapChunkForIngest(chunk: ChunkRecord) {
  return {
    chunk_id: chunk.chunk_id,
    doc_id: chunk.doc_id,
    url: chunk.url,
    title: chunk.title,
    lang: chunk.lang || undefined,
    chunk_index: chunk.chunk_index,
    chunk_text: chunk.chunk_text,
    chunk_word_count: chunk.chunk_word_count,
    start_word: chunk.start_word,
    end_word: chunk.end_word,
    content_hash: chunk.content_hash,
    fetched_at: chunk.fetched_at,
  };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function callActionWithRetry<T>(
  client: ActionClient,
  functionName: string,
  args: Record<string, unknown>,
): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return (await client.action(functionName, args)) as T;
    } catch (error: unknown) {
      lastError = error;
      if (attempt >= MAX_RETRIES) break;
      const backoffMs = 500 * 2 ** (attempt - 1);
      process.stdout.write(
        `  -> retry ${attempt}/${MAX_RETRIES - 1} after ${backoffMs}ms\n`,
      );
      await sleep(backoffMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function main(): Promise<void> {
  const { options, showHelp } = parseArgs(process.argv.slice(2));
  if (showHelp) {
    printHelp();
    return;
  }

  if (!options.convexUrl) {
    throw new Error("Convex URL is required. Set --convex-url or CONVEX_URL.");
  }

  if (!options.ingestToken) {
    throw new Error(
      "Ingestion token is required. Set --ingest-token or RAG_INGESTION_SECRET/CONVEX_RAG_INGESTION_SECRET.",
    );
  }

  const inputs = await resolveInputs(options);
  await fs.access(inputs.chunksFilePath);

  const client = new ConvexHttpClient(
    options.convexUrl,
  ) as unknown as ActionClient;

  const startedAt = new Date().toISOString();
  process.stdout.write(
    `[start] convex ingestion for ${inputs.siteId} (${inputs.runId})\n`,
  );
  process.stdout.write(`[chunks] ${inputs.chunksFilePath}\n`);
  process.stdout.write(`[convex] ${options.convexUrl}\n`);

  const stats = {
    chunksRead: 0,
    batchesSent: 0,
    insertedChunks: 0,
    updatedChunks: 0,
    embeddingTokens: 0,
    deactivatedChunks: 0,
    activeChunksAfterFinalize: null as number | null,
  };

  let selectedEmbeddingModel: string | null = null;
  let selectedEmbeddingDimensions: number | null = null;
  const pendingBatch: ChunkRecord[] = [];

  const flushBatch = async (): Promise<void> => {
    if (pendingBatch.length === 0) return;

    const batch = pendingBatch.splice(0, pendingBatch.length);
    stats.batchesSent += 1;

    process.stdout.write(
      `[batch ${stats.batchesSent}] ingesting ${batch.length} chunks (processed ${stats.chunksRead})\n`,
    );

    const result = await callActionWithRetry<IngestBatchResult>(
      client,
      "ragIngest:ingestChunkBatch",
      {
        auth_token: options.ingestToken,
        run_id: inputs.runId,
        site_id: inputs.siteId,
        source: inputs.source,
        embedding_model: options.embeddingModel || undefined,
        chunks: batch.map(mapChunkForIngest),
      },
    );

    selectedEmbeddingModel = result.embedding_model;
    selectedEmbeddingDimensions = result.embedding_dimensions;
    stats.insertedChunks += result.inserted_chunks;
    stats.updatedChunks += result.updated_chunks;
    stats.embeddingTokens += result.embedding_tokens;
  };

  const stream = createReadStream(inputs.chunksFilePath, { encoding: "utf8" });
  const lineReader = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  for await (const line of lineReader) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parsed = JSON.parse(trimmed) as unknown;
    if (!isChunkRecord(parsed)) {
      throw new Error("Invalid chunk record encountered in JSONL input.");
    }

    pendingBatch.push(parsed);
    stats.chunksRead += 1;

    if (pendingBatch.length >= options.batchSize) {
      await flushBatch();
    }
  }

  await flushBatch();

  if (options.finalizeRun) {
    process.stdout.write("[finalize] deactivating stale chunks\n");
    const finalizeResult = await callActionWithRetry<FinalizeResult>(
      client,
      "ragIngest:finalizeIngestionRun",
      {
        auth_token: options.ingestToken,
        run_id: inputs.runId,
        site_id: inputs.siteId,
        embedding_model: options.embeddingModel || undefined,
      },
    );

    stats.deactivatedChunks = finalizeResult.deactivated_chunks;
    stats.activeChunksAfterFinalize = finalizeResult.active_chunks;
  }

  const finishedAt = new Date().toISOString();

  const report: IngestionReport = {
    started_at: startedAt,
    finished_at: finishedAt,
    run_id: inputs.runId,
    site_id: inputs.siteId,
    source: inputs.source,
    chunks_file: inputs.chunksFilePath,
    convex_url: options.convexUrl,
    embedding_model: selectedEmbeddingModel,
    embedding_dimensions: selectedEmbeddingDimensions,
    stats: {
      chunks_read: stats.chunksRead,
      batches_sent: stats.batchesSent,
      inserted_chunks: stats.insertedChunks,
      updated_chunks: stats.updatedChunks,
      embedding_tokens: stats.embeddingTokens,
      deactivated_chunks: stats.deactivatedChunks,
      active_chunks_after_finalize: stats.activeChunksAfterFinalize,
    },
  };

  const reportPath = path.join(inputs.runDirForReport, "ingestion_report.json");
  await fs.writeFile(
    reportPath,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );

  process.stdout.write("[done]\n");
  process.stdout.write(`  chunks read: ${stats.chunksRead}\n`);
  process.stdout.write(`  inserted: ${stats.insertedChunks}\n`);
  process.stdout.write(`  updated: ${stats.updatedChunks}\n`);
  process.stdout.write(`  tokens: ${stats.embeddingTokens}\n`);
  process.stdout.write(`  deactivated: ${stats.deactivatedChunks}\n`);
  process.stdout.write(`  report: ${reportPath}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`[error] ${String(error)}\n`);
  process.exitCode = 1;
});
