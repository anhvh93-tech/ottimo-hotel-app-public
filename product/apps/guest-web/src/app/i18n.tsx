// Guest-web strings: VI / EN / RU straight from design/copy (UXD owns the text, no local copy).
// @ottimo/i18n covers the staff apps (VI/EN only); the guest page also offers RU, whose file is a partial
// draft – a missing RU key falls back to EN per key (strings-ru `_meta.fallback`, EP14 mục 5).
import { interpolate, type Args } from '@ottimo/i18n';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import en from '../../../../design/copy/strings-en.json';
import ru from '../../../../design/copy/strings-ru.json';
import vi from '../../../../design/copy/strings-vi.json';

export type GuestLocale = 'vi' | 'en' | 'ru';
export const GUEST_LOCALES: readonly GuestLocale[] = ['vi', 'en', 'ru'];

type Dict = Record<string, unknown>;
const DICTS: Record<GuestLocale, Dict> = { vi, en, ru };

function lookup(locale: GuestLocale, key: string): string | undefined {
  const v = DICTS[locale][key];
  return typeof v === 'string' ? v : undefined;
}

/**
 * Legal text of the check-in (data notice + consent) stays in the approved EN on the RU page until a
 * reviewed RU exists (content-guide HR-01, EP06 8.5: "không dịch máy"). The RU drafts (UXD S3 đợt 2)
 * are marked "cần người dịch duyệt"; consent evidence must not rest on an unreviewed text.
 * Decision-log 17/10 (ORC, SEC + UXD): remove a key only when UXD + SEC sign the reviewed RU text and
 * `privacy_notice_version` is bumped.
 */
const RU_UNREVIEWED_LEGAL = new Set([
  'gw.notice_body',
  'guest.oci.why',
  'guest.oci.consent_q',
  'guest.oci.consent',
  'guest.oci.consent_no',
  'guest.oci.consent_optional',
  'guest.oci.withdraw_hint',
  'gw.notice_read', // the confirm button reads in the language of the text it confirms (SEC (a) 2)
]);

function effective(locale: GuestLocale, key: string): GuestLocale {
  return locale === 'ru' && RU_UNREVIEWED_LEGAL.has(key) ? 'en' : locale;
}

export function hasGuestKey(key: string, locale: GuestLocale = 'en'): boolean {
  return lookup(locale, key) !== undefined;
}

/** Locale whose text is actually shown for `key` (RU → EN fallback). Recorded as consent evidence (R-CON-02). */
export function shownLocale(locale: GuestLocale, key: string): GuestLocale {
  const loc = effective(locale, key);
  if (lookup(loc, key) !== undefined) return loc;
  return lookup('en', key) !== undefined ? 'en' : locale;
}

export function translateGuest(locale: GuestLocale, key: string, args?: Args): string {
  const text = lookup(effective(locale, key), key) ?? lookup('en', key) ?? key;
  return interpolate(text, args);
}

/**
 * Browser language when the session gives none (P-S4-10, DS 11.2 mục 3 – "tiếng Anh dẫn dắt"):
 * `vi*` → VI, `ru*` → RU, anything else → EN. A language the guest chose (`setGuestLocale`) comes back in
 * the session and wins over this.
 */
export function browserLocale(
  languages: readonly string[] = globalThis.navigator?.languages ?? [],
): GuestLocale {
  const first = (languages[0] ?? '').toLowerCase();
  if (first.startsWith('vi')) return 'vi';
  if (first.startsWith('ru')) return 'ru';
  return 'en';
}

/**
 * Brand moments (greeting, tagline, room name) are English in every language; the support line under
 * them is in the page language – or in Vietnamese on the English page (DS 11.2 mục 1, 11.2.2).
 */
export function supportLocale(locale: GuestLocale): GuestLocale {
  return locale === 'en' ? 'vi' : locale;
}

export function isGuestLocale(v: unknown): v is GuestLocale {
  return v === 'vi' || v === 'en' || v === 'ru';
}

const BCP47: Record<GuestLocale, string> = { vi: 'vi-VN', en: 'en-GB', ru: 'ru-RU' };

/** `YYYY-MM-DD` → `19/10` (VI) or `19 Oct` (EN/RU) without time-zone shifts (EP14 2.1). */
export function shortDate(locale: GuestLocale, value: string | undefined | null): string {
  const m = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  if (!m) return value ?? '';
  if (locale === 'vi') return `${m[3]}/${m[2]}`;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return new Intl.DateTimeFormat(BCP47[locale], {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(d);
}

/** Nights between two stay dates (BR-002: departure − arrival). */
export function nightsBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/** Integer VND in a sentence with its unit (`common.currency_vnd`): 100.000 đ · 100,000 VND (content-guide 4). */
export function money(locale: GuestLocale, amount: number): string {
  const n = new Intl.NumberFormat(BCP47[locale], { maximumFractionDigits: 0 }).format(amount);
  return translateGuest(locale, 'common.currency_vnd', { amount: n });
}

/** ISO instant → "20:10" in the property time zone (BR-001), whatever the guest's phone says. */
export function clockTime(value: string | undefined | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export interface GuestI18n {
  locale: GuestLocale;
  t: (key: string, args?: Args) => string;
  shortDate: (value: string | undefined | null) => string;
  money: (amount: number) => string;
}

const Ctx = createContext<GuestI18n | null>(null);

/**
 * The locale is NOT persisted on the device: it lives in the guest session on the server
 * (`setGuestLocale`), so a shared phone keeps no trace of the stay (ĐK-3).
 */
export function GuestI18nProvider({
  locale,
  children,
}: {
  locale: GuestLocale;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo<GuestI18n>(
    () => ({
      locale,
      t: (key, args) => translateGuest(locale, key, args),
      shortDate: (v) => shortDate(locale, v),
      money: (amount) => money(locale, amount),
    }),
    [locale],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): GuestI18n {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useT outside GuestI18nProvider');
  return ctx;
}
