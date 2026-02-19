import { parseIntegerOption } from './utils.js';
import type { RuntimeOptions, SiteDefinition } from './types.js';

export const COMMON_OPTION_LINES = [
  '  --max-pages <number>         Limit number of pages (0 = no limit)',
  '  --delay-ms <number>          Delay between HTTP requests (default: 1200)',
  '  --timeout-ms <number>        Timeout per request (default: 25000)',
  '  --retries <number>           Retries for 429/5xx/timeout (default: 3)',
  '  --min-content-chars <n>      Skip pages with short extracted text (default: 350)',
  '  --chunk-size <number>        Chunk size in words (default: 220)',
  '  --chunk-overlap <number>     Word overlap between chunks (default: 40)',
  '  --output-dir <path>          Explicit output directory',
  '  --user-agent <string>        Custom user-agent',
  '  --base-url <url>             Override site base URL',
  '  --robots-url <url>           Override robots.txt URL',
  '  --no-raw-html                Do not save raw HTML snapshots',
  '  --help                       Show this help text',
] as const;

export function createRuntimeDefaults(site: SiteDefinition): RuntimeOptions {
  return {
    baseUrl: site.baseUrl,
    robotsUrl: site.robotsUrl,
    userAgent: site.defaultUserAgent,
    delayMs: 1200,
    timeoutMs: 25000,
    retries: 3,
    maxPages: 0,
    minContentChars: 350,
    chunkSize: 220,
    chunkOverlap: 40,
    saveRawHtml: true,
    outputDir: null,
  };
}

export function printSiteHelp(command: string, site: SiteDefinition): void {
  process.stdout.write(
    [
      `Usage: ${command} [options]`,
      '',
      `Site: ${site.displayName} (${site.id})`,
      '',
      'Options:',
      ...COMMON_OPTION_LINES,
      '',
      `Example: ${command} --max-pages 100 --delay-ms 1500`,
      '',
    ].join('\n'),
  );
}

export interface ParseRuntimeArgsResult {
  options: RuntimeOptions;
  showHelp: boolean;
}

export function parseRuntimeArgs(argv: string[], defaults: RuntimeOptions): ParseRuntimeArgsResult {
  const options: RuntimeOptions = { ...defaults };
  let showHelp = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;

    const equalsIndex = arg.indexOf('=');
    const flag = equalsIndex >= 0 ? arg.slice(0, equalsIndex) : arg;
    const inlineValue = equalsIndex >= 0 ? arg.slice(equalsIndex + 1) : undefined;

    const readValue = (): string => {
      if (inlineValue !== undefined) return inlineValue;
      i += 1;
      if (i >= argv.length) {
        throw new Error(`Missing value for ${flag}`);
      }
      return argv[i];
    };

    if (flag === '--help') {
      showHelp = true;
      continue;
    }

    if (flag === '--no-raw-html') {
      options.saveRawHtml = false;
      continue;
    }

    if (flag === '--max-pages') {
      options.maxPages = parseIntegerOption(flag, readValue());
      continue;
    }

    if (flag === '--delay-ms') {
      options.delayMs = parseIntegerOption(flag, readValue());
      continue;
    }

    if (flag === '--timeout-ms') {
      options.timeoutMs = parseIntegerOption(flag, readValue());
      continue;
    }

    if (flag === '--retries') {
      options.retries = parseIntegerOption(flag, readValue());
      continue;
    }

    if (flag === '--min-content-chars') {
      options.minContentChars = parseIntegerOption(flag, readValue());
      continue;
    }

    if (flag === '--chunk-size') {
      options.chunkSize = parseIntegerOption(flag, readValue());
      continue;
    }

    if (flag === '--chunk-overlap') {
      options.chunkOverlap = parseIntegerOption(flag, readValue());
      continue;
    }

    if (flag === '--output-dir') {
      options.outputDir = readValue();
      continue;
    }

    if (flag === '--user-agent') {
      options.userAgent = readValue();
      continue;
    }

    if (flag === '--base-url') {
      options.baseUrl = readValue();
      continue;
    }

    if (flag === '--robots-url') {
      options.robotsUrl = readValue();
      continue;
    }

    throw new Error(`Unknown option: ${flag}`);
  }

  if (options.chunkOverlap >= options.chunkSize) {
    throw new Error('--chunk-overlap must be less than --chunk-size');
  }

  return { options, showHelp };
}
