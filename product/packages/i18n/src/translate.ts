// Strings are owned by UXD in design/copy/strings-{vi,en}.json and imported directly (no copy to drift).
// pending.*.json holds keys FE needs that UXD has not added yet – the test fails once UXD adds them.
import enUxd from '../../../design/copy/strings-en.json';
import viUxd from '../../../design/copy/strings-vi.json';
import enPending from './pending.en.json';
import viPending from './pending.vi.json';

export type Locale = 'vi' | 'en';
export const LOCALES: readonly Locale[] = ['vi', 'en'];
export type Args = Record<string, string | number>;
type Dict = Record<string, unknown>;

const DICTS: Record<Locale, Dict[]> = {
  vi: [viUxd, viPending],
  en: [enUxd, enPending],
};

function lookup(locale: Locale, key: string): string | undefined {
  for (const dict of DICTS[locale]) {
    const v = dict[key];
    if (typeof v === 'string') return v;
  }
  return undefined;
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

/** Locale → EN fallback (strings-vi `_meta.fallback`) → the key itself (visible in QA, never blank). */
export function translate(locale: Locale, key: string, args?: Args): string {
  const text = lookup(locale, key) ?? lookup('en', key) ?? key;
  return interpolate(text, args);
}

export function allKeys(locale: Locale): Set<string> {
  const keys = new Set<string>();
  for (const dict of DICTS[locale])
    for (const k of Object.keys(dict)) if (k !== '_meta') keys.add(k);
  return keys;
}

export function uxdKeys(locale: Locale): Set<string> {
  return new Set(Object.keys(DICTS[locale][0]!).filter((k) => k !== '_meta'));
}

export function pendingKeys(locale: Locale): Set<string> {
  return new Set(Object.keys(DICTS[locale][1]!).filter((k) => k !== '_meta'));
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
