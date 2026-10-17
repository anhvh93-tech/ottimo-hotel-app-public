// Checks on the built site (ADR-014 2.4–2.6, 3.3, 5, 7, 9; concept 11; US-151 AC3, US-153 AC8).
// turbo runs `build` before `test` for this package; run `pnpm build` first when calling vitest directly.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import * as checks from '../../scripts/dist-checks.mjs';
import { BOOKING_REQUEST_ENABLED } from '../lib/booking-request';
import { INDEXABLE, LANGS, SITE_URL } from '../lib/i18n';

const dist = fileURLToPath(new URL('../../dist', import.meta.url));
const opts = {
  siteUrl: SITE_URL,
  langs: [...LANGS],
  indexable: INDEXABLE,
  bookingRequest: BOOKING_REQUEST_ENABLED,
};
let d: ReturnType<typeof checks.loadDist>;

beforeAll(() => {
  if (!existsSync(dist))
    throw new Error('dist/ missing – run `pnpm --filter @ottimo/landing-web build` first');
  d = checks.loadDist(dist);
});

describe('dist (LP-v1)', () => {
  it('builds the EN and VI home pages and a 404 per language', () => {
    expect(d.html.map((p) => p.path).sort()).toEqual(['/', '/404/', '/vi/', '/vi/404/']);
  });
  it('has no inline script/style, no style= or on*= attribute (CSP, ADR-014 2.4)', () => {
    expect(checks.checkInlineCode(d)).toEqual([]);
  });
  it('loads nothing from another origin, sets no cookie, calls no network (SEC C-1, ADR-014 2.6)', () => {
    expect(checks.checkThirdParty(d, SITE_URL, opts)).toEqual([]);
  });
  it('has exactly one H1 per page', () => {
    expect(checks.checkSingleH1(d)).toEqual([]);
  });
  it('has no form unless the booking request is on (then same-origin POST only); no OTA link', () => {
    expect(checks.checkForms(d, opts)).toEqual([]);
  });
  it('declares lang, canonical, two-way hreflang + x-default, OG, JSON-LD (ADR-014 3.3, 5)', () => {
    expect(checks.checkSeo(d, opts)).toEqual([]);
  });
  it('has a sitemap with every language + x-default and robots.txt for the build mode', () => {
    expect(checks.checkSitemapRobots(d, opts)).toEqual([]);
  });
  it('uses only the brand palette in built CSS, inline SVG and SVG files (Brand Guidelines v1.0)', () => {
    expect(checks.checkBrandColors(d)).toEqual([]);
  });
  it('stays within the byte budgets (concept 11.2, ADR-014 7.7 and 9)', () => {
    expect(checks.checkBudgets(d)).toEqual([]);
  });
  it('gives every photo width/height/alt, lazy except the hero, ≤ 960 w on phones', () => {
    expect(checks.checkImages(d)).toEqual([]);
  });
  it('only uses characters covered by the self-hosted font subsets (concept 3.3)', () => {
    expect(checks.checkGlyphCoverage(d)).toEqual([]);
  });
});
