#!/usr/bin/env node
// CLI report of the dist checks (same functions as src/checks/dist.test.ts, which is what CI runs).
// Usage: pnpm --filter @ottimo/landing-web check:dist [-- --dir dist-booking-preview]
// (after `build` / `build:booking-preview`; honours LANDING_SITE_URL, LANDING_INDEXABLE)
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runAll } from './dist-checks.mjs';

const i = process.argv.indexOf('--dir');
const name = i >= 0 ? process.argv[i + 1] : 'dist';
const dist = fileURLToPath(new URL(`../${name}`, import.meta.url));
if (!existsSync(dist)) {
  console.error(`${name}/ missing – build it first`);
  process.exit(2);
}
const site = JSON.parse(readFileSync(new URL('../src/content/site.json', import.meta.url), 'utf8'));
const preview = name === 'dist-booking-preview';
const opts = {
  siteUrl: (process.env.LANDING_SITE_URL ?? 'https://ottimo.vn').replace(/\/+$/, ''),
  langs: ['en', 'vi'],
  indexable: !preview && process.env.LANDING_INDEXABLE === 'true',
  bookingRequest: preview || site.features?.bookingRequest === true,
};
const results = runAll(dist, opts);
let failed = 0;
for (const [check, problems] of Object.entries(results)) {
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${check}`);
  for (const p of problems) console.log(`     - ${p}`);
  failed += problems.length;
}
process.exit(failed ? 1 : 0);
