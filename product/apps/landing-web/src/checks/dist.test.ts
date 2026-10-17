// Checks on the built site (ADR-014 2.4–2.6, 3.3, 5, 7, 9; concept v1.2.1 2.3, 5.5, 11, 12; US-151 AC3, US-153 AC8).
// `pnpm test` builds the booking-form review build first; turbo runs `build` (dist/) before `test`.
//  - dist/                 = the production build: feature off → no form, no form script;
//  - dist-booking-preview/ = review build with the form rendered (never deployed) → the form rules of SEC UXD-08.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as checks from '../../scripts/dist-checks.mjs';
import { BOOKING_REQUEST_ENABLED } from '../lib/booking-request';
import { INDEXABLE, LANGS, SITE_URL } from '../lib/i18n';

const builds = [
  { name: 'dist', form: BOOKING_REQUEST_ENABLED },
  { name: 'dist-booking-preview', form: true },
] as const;

describe.each(builds)('$name', ({ name, form }) => {
  const dir = fileURLToPath(new URL(`../../${name}`, import.meta.url));
  if (!existsSync(dir))
    throw new Error(
      `${name}/ missing – run \`pnpm --filter @ottimo/landing-web build\` / \`build:booking-preview\``,
    );
  const d = checks.loadDist(dir);
  const opts = {
    siteUrl: SITE_URL,
    langs: [...LANGS],
    indexable: name === 'dist' ? INDEXABLE : false,
    bookingRequest: form,
  };

  it('builds the EN and VI home pages and a 404 per language', () => {
    expect(d.html.map((p) => p.path).sort()).toEqual(['/', '/404/', '/vi/', '/vi/404/']);
  });
  it('has no inline script/style, no style= or on*= attribute (CSP, ADR-014 2.4)', () => {
    expect(checks.checkInlineCode(d)).toEqual([]);
  });
  it('loads nothing from another origin, sets no cookie; calls no network unless the form is on (SEC C-1)', () => {
    expect(checks.checkThirdParty(d, SITE_URL, opts)).toEqual([]);
  });
  it('has exactly one H1 per page', () => {
    expect(checks.checkSingleH1(d)).toEqual([]);
  });
  it('forms: none while off; rendered = hidden, no action, honeypot, unticked consent (SEC UXD-08); no OTA link', () => {
    expect(checks.checkForms(d, opts)).toEqual([]);
  });
  it('wording: boutique stay, no room count, no plain "Book", hotel only as comparison (FB-INV-002, concept 2.3)', () => {
    expect(checks.checkWording(d)).toEqual([]);
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
  it('stays within the byte budgets (concept 12.2, ADR-014 7.7 and 9)', () => {
    expect(checks.checkBudgets(d)).toEqual([]);
  });
  it('gives every photo width/height/alt, lazy except the hero, ≤ 960 w on phones', () => {
    expect(checks.checkImages(d)).toEqual([]);
  });
  it('only uses characters covered by the self-hosted font subsets (concept 3.3)', () => {
    expect(checks.checkGlyphCoverage(d)).toEqual([]);
  });
  if (!form)
    it('ships no booking-form code at all while the form is off', () => {
      expect(d.files.filter((f) => /BookingForm/.test(f))).toEqual([]);
    });
});
