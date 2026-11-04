// Language codes and their per-language constants – safe for browser scripts (no environment, no site URL; lib/i18n.ts
// re-exports them for the build). LP-v2 (R4, FB-INV-008, ARC lp-v2-design 3.1).
/** Order of the language list (INV): English · Tiếng Việt · 한국어 · 简体中文 · Русский. */
export const LANGS = ['en', 'vi', 'ko', 'zh', 'ru'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

/**
 * `<html lang>` per language (ARC D10): `zh` is Simplified Chinese, so the page says `zh-Hans` and the browser picks
 * Simplified glyph shapes for the shared Han code points. hreflang and URLs keep the bare code (ADR-014 3.3).
 */
export const HTML_LANG: Record<Lang, string> = {
  en: 'en',
  vi: 'vi',
  ko: 'ko',
  zh: 'zh-Hans',
  ru: 'ru',
};

/** Open Graph locale per language (ogp.me). */
export const OG_LOCALE: Record<Lang, string> = {
  en: 'en_US',
  vi: 'vi_VN',
  ko: 'ko_KR',
  zh: 'zh_CN',
  ru: 'ru_RU',
};

/** Language name written in that language (header switch, suggestion bar). */
export const LANG_NAME: Record<Lang, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  ko: '한국어',
  zh: '简体中文',
  ru: 'Русский',
};

/** BCP 47 locale for Intl (dates, numbers, plural rules) on the page of each language. */
export const INTL_LOCALE: Record<Lang, string> = {
  en: 'en-GB',
  vi: 'vi-VN',
  ko: 'ko-KR',
  zh: 'zh-CN',
  ru: 'ru-RU',
};

/** Languages whose pages use the international hotline (+84 …): guests calling from abroad (CPY lp-v2 1.3). */
export const INTERNATIONAL_PHONE: readonly Lang[] = ['ko', 'zh', 'ru'];

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

/** Language of an `<html lang>` value (inverse of HTML_LANG): 'zh-Hans' → 'zh'; unknown → English. */
export function langOfHtml(value: string | null | undefined): Lang {
  const primary = (value ?? '').toLowerCase().split('-')[0];
  return isLang(primary) ? primary : DEFAULT_LANG;
}

/** Languages other than the default – the `[lang]` routes (pages/[lang]/*). */
export const PREFIXED_LANGS = LANGS.filter((l) => l !== DEFAULT_LANG);
