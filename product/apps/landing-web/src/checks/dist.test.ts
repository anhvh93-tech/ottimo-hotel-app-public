// Checks on the built site (ADR-014 2.4–2.6, 3.3, 5, 7, 9; concept v1.2.1 2.3, 5.5, 11, 12; US-151 AC3, US-153 AC8).
// `pnpm test` builds the booking-form review build and the live-form test build first; turbo runs `build` (dist/)
// before `test`.
//  - dist/                 = the production build: feature off → no form, no form script, no privacy page;
//  - dist-booking-preview/ = review build with the form rendered (never deployed) → the form rules of SEC UXD-08;
//  - dist-booking-live/    = LANDING_BOOKING_FORM=true (slug dl01, same-origin API) → what ottimo.vn serves once the
//    production Desk runs (US-155 v1.0): api transport, privacy notice pages, footer link.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as checks from '../../scripts/dist-checks.mjs';
import { PRIVACY_NOTICE } from '../content/privacy';
import { BOOKING_REQUEST_ENABLED, PUBLIC_FORM_API_BASE } from '../lib/booking-request';
import { INDEXABLE, LANGS, SITE_URL } from '../lib/i18n';

const builds = [
  { name: 'dist', form: BOOKING_REQUEST_ENABLED, live: BOOKING_REQUEST_ENABLED },
  { name: 'dist-booking-preview', form: true, live: false },
  { name: 'dist-booking-live', form: true, live: true },
] as const;

describe.each(builds)('$name', ({ name, form, live }) => {
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
    apiOrigin: name === 'dist' ? PUBLIC_FORM_API_BASE : '',
  };

  it('builds the EN and VI home pages and a 404 per language (+ the privacy notice with the form)', () => {
    const privacy = form ? ['/privacy/', '/vi/privacy/'] : [];
    expect(d.html.map((p) => p.path).sort()).toEqual(
      ['/', '/404/', '/vi/', '/vi/404/', ...privacy].sort(),
    );
  });
  it('form endpoint: preview never sends; live = api, slug, notice version, same-origin API (US-155 v1.0)', () => {
    expect(checks.checkFormEndpoint(d, opts)).toEqual([]);
    const forms = d.html
      .map((p) => checks.tags(p.source).find((x) => x.name === 'form'))
      .filter((x) => !!x)
      .map((x) => x.attrs as Record<string, string>);
    expect(forms).toHaveLength(form ? 2 : 0);
    for (const f of forms) {
      expect(f['data-transport']).toBe(live ? 'api' : 'preview');
      if (live) expect(f['data-consent-version']).toBe(PRIVACY_NOTICE.version);
    }
  });
  if (form)
    it('privacy notice: EN/VI pages with the anchors the form links to, footer link on every page', () => {
      const en = d.html.find((p) => p.path === '/privacy/')!;
      const vi = d.html.find((p) => p.path === '/vi/privacy/')!;
      expect(en.source).toContain(`id="${PRIVACY_NOTICE.en.anchor}"`);
      expect(vi.source).toContain(`id="${PRIVACY_NOTICE.vi.anchor}"`);
      expect(en.source).toContain(`Version ${PRIVACY_NOTICE.version}`);
      expect(vi.source).toContain(`Phiên bản ${PRIVACY_NOTICE.version}`);
      const home = d.html.find((p) => p.path === '/')!;
      expect(home.source).toContain(`href="/privacy/#${PRIVACY_NOTICE.en.anchor}"`);
      for (const p of d.html.filter((x) => !/404/.test(x.path)))
        expect(p.source, p.path).toMatch(/<a href="(\/vi)?\/privacy\/">/);
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
  it('wording: boutique stay, no room count, no plain "Book", no hotel wording, no fees on the page (FB-INV-002, INV 24/10)', () => {
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
    expect(checks.checkBudgets(d, opts)).toEqual([]);
  });
  it('gives every photo width/height/alt, lazy except the hero, ≤ 960 w on phones', () => {
    expect(checks.checkImages(d)).toEqual([]);
  });
  it('only uses characters covered by the self-hosted font subsets (concept 3.3)', () => {
    expect(checks.checkGlyphCoverage(d)).toEqual([]);
  });
  if (!form)
    it('ships no booking-form code and no JetBrains Mono while the form is off', () => {
      expect(d.files.filter((f) => /BookingForm|jetbrains-mono/.test(f))).toEqual([]);
    });
  else
    it('ships JetBrains Mono latin 400 for the request number (UXD FE-S4-21)', () => {
      expect(
        d.files.filter((f) => /jetbrains-mono-latin-400-normal\.[\w-]+\.woff2$/.test(f)),
      ).toHaveLength(1);
    });
});
