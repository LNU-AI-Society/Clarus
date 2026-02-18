import { createRuntimeDefaults, parseRuntimeArgs, printSiteHelp } from './cli.js';
import { runSiteScraper } from './run-scraper.js';
import type { SiteDefinition } from './types.js';

export async function runSiteFromArgv(
  site: SiteDefinition,
  argv: string[],
  commandLabel: string,
): Promise<void> {
  const defaults = createRuntimeDefaults(site);
  const { options, showHelp } = parseRuntimeArgs(argv, defaults);

  if (showHelp) {
    printSiteHelp(commandLabel, site);
    return;
  }

  await runSiteScraper(site, options);
}
