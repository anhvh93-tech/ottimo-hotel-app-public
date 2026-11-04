// Language and URL rules of the landing (ADR-014 section 3).
// English is the default and lives at the root without a prefix; every other language lives under /<code>/. No
// redirect by browser language anywhere: every URL serves the same content to every person and bot.
// LP-v2 (R4, FB-INV-008, ARC lp-v2-design 3.1): Korean /ko/, Simplified Chinese /zh/, Russian /ru/. A new language =
// add it here + its copy (content/<code>.ts, privacy.ts, scripts/booking-strings/<code>.ts); pages/[lang]/* build it.

export {
  DEFAULT_LANG,
  HTML_LANG,
  INTERNATIONAL_PHONE,
  INTL_LOCALE,
  LANGS,
  LANG_NAME,
  OG_LOCALE,
  PREFIXED_LANGS,
  isLang,
  langOfHtml,
  type Lang,
} from './langs';
import { DEFAULT_LANG, LANGS, isLang, type Lang } from './langs';

/** Production origin. One build serves staging and production (ADR-014 1.2): absolute URLs always point here. */
export const SITE_URL = (process.env.LANDING_SITE_URL ?? 'https://ottimo.vn').replace(/\/+$/, '');

/** Pages that exist in every published language. Slug '' = home. Slugs are the same in every language. */
export const PAGES = [''] as const;
export type PageSlug = (typeof PAGES)[number];

/** Root-relative path of a page in a language, always with a trailing slash (`trailingSlash: 'always'`). */
export function pathFor(lang: Lang, slug: string = ''): string {
  const clean = slug.replace(/^\/+|\/+$/g, '');
  const parts = [lang === DEFAULT_LANG ? '' : lang, clean].filter(Boolean);
  return parts.length ? `/${parts.join('/')}/` : '/';
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/** Language of a root-relative path: /vi/, /ko/, /zh/, /ru/ by prefix, everything else English. */
export function langOfPath(pathname: string): Lang {
  const first = pathname.split('/').filter(Boolean)[0];
  return isLang(first) && first !== DEFAULT_LANG ? first : DEFAULT_LANG;
}

export interface Alternate {
  hreflang: Lang | 'x-default';
  href: string;
}

/**
 * hreflang set of a page (ADR-014 3.3): every published language including the page itself (links must be
 * two-way) plus x-default = the English version of the same page. Used by <head> and the sitemap alike.
 */
export function alternatesFor(slug: string = ''): Alternate[] {
  const list: Alternate[] = LANGS.map((lang) => ({
    hreflang: lang,
    href: absoluteUrl(pathFor(lang, slug)),
  }));
  list.push({ hreflang: 'x-default', href: absoluteUrl(pathFor(DEFAULT_LANG, slug)) });
  return list;
}

/**
 * Indexing switch (US-146 AC4): until INV approves the copy and the preview (gate LP-v1), every build is a preview –
 * `noindex` on every page and a robots.txt that disallows everything. The production build sets
 * LANDING_INDEXABLE=true (OPS, after the gate).
 */
export const INDEXABLE = process.env.LANDING_INDEXABLE === 'true';

/** Brand Ivory for `theme-color` (Brand Guidelines v1.0; equals --brand-ivory – brand.test.ts). */
export const THEME_COLOR = '#F4F0E8';

/** Social share image (US-154): JPEG 1200×630 at a fixed path under /og/ (ADR-014 1.4, 5). */
export const OG_IMAGE = { path: '/og/ottimo-1200x630.jpg', width: 1200, height: 630 };
