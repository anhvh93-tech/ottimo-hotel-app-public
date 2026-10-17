#!/usr/bin/env node
// CLI report of the dist checks (same functions as src/checks/dist.test.ts, which is what CI runs).
// Usage: pnpm --filter @ottimo/landing-web check:dist   (after `build`; honours LANDING_SITE_URL, LANDING_INDEXABLE)
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runAll } from './dist-checks.mjs';

const dist = fileURLToPath(new URL('../dist', import.meta.url));
if (!existsSync(dist)) {
  console.error('dist/ missing – run `pnpm --filter @ottimo/landing-web build` first');
  process.exit(2);
}
const site = JSON.parse(readFileSync(new URL('../src/content/site.json', import.meta.url), 'utf8'));
const opts = {
  siteUrl: (process.env.LANDING_SITE_URL ?? 'https://ottimo.vn').replace(/\/+$/, ''),
  langs: ['en', 'vi'],
  indexable: process.env.LANDING_INDEXABLE === 'true',
  bookingRequest: site.features?.bookingRequest === true,
};
const results = runAll(dist, opts);
let failed = 0;
for (const [name, problems] of Object.entries(results)) {
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${name}`);
  for (const p of problems) console.log(`     - ${p}`);
  failed += problems.length;
}
process.exit(failed ? 1 : 0);
