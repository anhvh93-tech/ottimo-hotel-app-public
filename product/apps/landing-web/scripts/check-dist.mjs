#!/usr/bin/env node
// CLI report of the dist checks (same functions as src/checks/dist.test.ts, which is what CI runs).
// Usage: pnpm --filter @ottimo/landing-web check:dist [-- --dir dist-booking-preview | dist-booking-live]
// (after `build` / `build:booking-preview` / `build:booking-live-test`; honours LANDING_SITE_URL, LANDING_INDEXABLE,
// LANDING_BOOKING_FORM and PUBLIC_FORM_API_BASE of the build being checked)
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
const live =
  name === 'dist-booking-live' ||
  process.env.LANDING_BOOKING_FORM === 'true' ||
  site.features?.bookingRequest === true;
let apiOrigin = '';
try {
  apiOrigin = process.env.PUBLIC_FORM_API_BASE
    ? new URL(process.env.PUBLIC_FORM_API_BASE).origin
    : '';
} catch {
  apiOrigin = 'invalid';
}
const opts = {
  siteUrl: (process.env.LANDING_SITE_URL ?? 'https://ottimo.vn').replace(/\/+$/, ''),
  langs: ['en', 'vi'],
  indexable: !preview && name !== 'dist-booking-live' && process.env.LANDING_INDEXABLE === 'true',
  bookingRequest: preview || live,
  apiOrigin,
};
const results = runAll(dist, opts);
let failed = 0;
for (const [check, problems] of Object.entries(results)) {
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${check}`);
  for (const p of problems) console.log(`     - ${p}`);
  failed += problems.length;
}
process.exit(failed ? 1 : 0);
