#!/usr/bin/env node

import { runSiteFromArgv } from './core/site-runner.js';
import { migrationsverketSite } from './sites/migrationsverket.js';

runSiteFromArgv(migrationsverketSite, process.argv.slice(2), 'npm run scrape:migrationsverket').catch(
  (error: unknown) => {
    process.stderr.write(`[fatal] ${String(error)}\n`);
    process.exit(1);
  },
);
