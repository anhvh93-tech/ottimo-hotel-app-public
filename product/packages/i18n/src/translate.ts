// Strings are owned by UXD in design/copy/strings-{vi,en}.json and imported directly (no copy to drift).
// A key FE needs that UXD has not written yet is requested from UXD (no local pending copy since R2 S1).
// VI (default) ships in the main bundle; EN is a separate chunk loaded when a user picks English
// (`loadLocale`) – halves the strings every Vietnamese user downloads (main bundle < 500 KB).
import viUxd from '../../../design/copy/strings-vi.json';

export type Locale = 'vi' | 'en';
export const LOCALES: readonly Locale[] = ['vi', 'en'];
export type Args = Record<string, string | number>;
type Dict = Record<string, unknown>;

const DICTS: Partial<Record<Locale, Dict>> = { vi: viUxd };
const LOADERS: Record<Locale, () => Promise<Dict>> = {
  vi: async () => viUxd,
  en: () => import('../../../design/copy/strings-en.json').then((m) => m.default as Dict),
};
const pending = new Map<Locale, Promise<void>>();

export function isLocaleLoaded(locale: Locale): boolean {
  return DICTS[locale] !== undefined;
}

/** Load a locale's strings once (EN is lazy). Safe to call many times. */
export function loadLocale(locale: Locale): Promise<void> {
  if (DICTS[locale]) return Promise.resolve();
  let p = pending.get(locale);
  if (!p) {
    p = LOADERS[locale]().then((d) => {
      DICTS[locale] = d;
    });
    pending.set(locale, p);
  }
  return p;
}

function lookup(locale: Locale, key: string): string | undefined {
  const v = DICTS[locale]?.[key];
  return typeof v === 'string' ? v : undefined;
}

export function hasKey(key: string, locale: Locale = 'vi'): boolean {
  return lookup(locale, key) !== undefined;
}

export function interpolate(text: string, args?: Args): string {
  if (!args) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) =>
    args[name] === undefined ? m : String(args[name]),
  );
}

/**
 * Locale → EN fallback (strings-vi `_meta.fallback`) → VI while EN is still loading → the key itself
 * (visible in QA, never blank).
 */
export function translate(locale: Locale, key: string, args?: Args): string {
  const text = lookup(locale, key) ?? lookup('en', key) ?? lookup('vi', key) ?? key;
  return interpolate(text, args);
}

/** All keys of a loaded locale (call `loadLocale` first for EN). */
export function allKeys(locale: Locale): Set<string> {
  const d = DICTS[locale];
  if (!d) throw new Error(`Locale ${locale} not loaded – await loadLocale('${locale}')`);
  return new Set(Object.keys(d).filter((k) => k !== '_meta'));
}

const BCP47: Record<Locale, string> = { vi: 'vi-VN', en: 'en-GB' };

/** Integer VND with thousands separator, no decimals (BR-004, content-guide §4). */
export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(BCP47[locale], { maximumFractionDigits: 0 }).format(value);
}

/** `YYYY-MM-DD` (stay/business date) → dd/mm/yyyy without time-zone shifts. */
export function formatLocalDate(value: string | undefined | null): string {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}

/** ISO instant → dd/mm/yyyy HH:mm in the property time zone (BR-001: Asia/Ho_Chi_Minh). */
export function formatInstant(
  locale: Locale,
  value: string | undefined | null,
  timeZone = 'Asia/Ho_Chi_Minh',
): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const parts = new Intl.DateTimeFormat(BCP47[locale], {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}
