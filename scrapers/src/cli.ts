#!/usr/bin/env node

import { COMMON_OPTION_LINES } from './core/cli.js';
import { runSiteFromArgv } from './core/site-runner.js';
import { getSiteById, listSiteIds } from './sites/index.js';

interface ParsedTopLevelArgs {
  siteId: string | null;
  remainingArgs: string[];
  showHelp: boolean;
}

function parseTopLevelArgs(argv: string[]): ParsedTopLevelArgs {
  let siteId: string | null = null;
  let showHelp = false;
  const remainingArgs: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      showHelp = true;
      continue;
    }

    if (arg === '--site') {
      i += 1;
      if (i >= argv.length) {
        throw new Error('Missing value for --site');
      }
      siteId = argv[i];
      continue;
    }

    if (arg.startsWith('--site=')) {
      siteId = arg.slice('--site='.length);
      continue;
    }

    remainingArgs.push(arg);
  }

  return { siteId, remainingArgs, showHelp };
}

function printGlobalHelp(): void {
  const siteLines = listSiteIds().map((siteId) => `  - ${siteId}`);

  process.stdout.write(
    [
      'Usage: npm run scrape -- --site <site-id> [options]',
      '',
      'Available sites:',
      ...siteLines,
      '',
      'Common options:',
      ...COMMON_OPTION_LINES,
      '',
      'Example: npm run scrape -- --site migrationsverket --max-pages 100',
      '',
    ].join('\n'),
  );
}

async function main(): Promise<void> {
  const { siteId, remainingArgs, showHelp } = parseTopLevelArgs(process.argv.slice(2));

  if (!siteId) {
    printGlobalHelp();
    if (!showHelp) {
      process.exitCode = 1;
    }
    return;
  }

  const site = getSiteById(siteId);
  if (!site) {
    const knownSites = listSiteIds().join(', ');
    throw new Error(`Unknown site '${siteId}'. Available sites: ${knownSites}`);
  }

  const siteArgs = showHelp ? ['--help', ...remainingArgs] : remainingArgs;
  await runSiteFromArgv(site, siteArgs, `npm run scrape -- --site ${site.id}`);
}

main().catch((error: unknown) => {
  process.stderr.write(`[fatal] ${String(error)}\n`);
  process.exit(1);
});
