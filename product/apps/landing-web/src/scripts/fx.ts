// Estimate in the currency of the page language (FB-INV-011, contract rounds/round-05/fb-inv-011/contract.md): the
// optional `fx` block of getPublicMonthlyRates gives, per currency, the VND for one unit (Vietcombank selling rate or
// an owner override). The page converts a VND figure itself: amount = VND ÷ rate, rounded UP to a step per currency.
// The VND figure stays the real price (payment in VND); the converted one is shown as "≈ …" with the rate date.
// No `fx`, a missing or odd rate, a stale date (> 7 days) or the vi page → nothing converted, VND only.
// Pure logic, no DOM – unit-tested in fx.test.ts.
import { INTL_LOCALE, type Lang } from '../lib/langs';

export type FxCurrency = 'USD' | 'KRW' | 'CNY' | 'RUB';

/** INV 17/11: en → USD, ko → KRW, zh → CNY, ru → RUB, vi → no conversion. */
export const FX_CURRENCY: Record<Lang, FxCurrency | null> = {
  en: 'USD',
  vi: null,
  ko: 'KRW',
  zh: 'CNY',
  ru: 'RUB',
};

/** Rounding up (contract): USD 1, KRW 1,000, CNY 1, RUB 100. */
export const FX_STEP: Record<FxCurrency, number> = { USD: 1, KRW: 1000, CNY: 1, RUB: 100 };

/**
 * VND per unit outside which a rate is treated as wrong data (a typo in the Desk override, a unit mix-up) and the page
 * shows VND only. Wide on purpose: about 0.4× to 2.5× the rates of November 2026.
 */
export const FX_SANE: Record<FxCurrency, readonly [number, number]> = {
  USD: [10_000, 65_000],
  KRW: [7, 50],
  CNY: [1_400, 9_000],
  RUB: [100, 800],
};

/** The contract drops `fx` older than 7 days; the page checks again (cached answers, clock of the guest). */
export const FX_MAX_AGE_DAYS = 7;

/** One currency for this page: what convert() needs. */
export interface FxQuote {
  currency: FxCurrency;
  /** VND for 1 unit. */
  rate: number;
  /** YYYY-MM-DD of the rate. */
  asOf: string;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const dayNumber = (iso: string): number | null => {
  if (!ISO_DAY.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const t = Date.UTC(y, m - 1, d);
  const back = new Date(t).toISOString().slice(0, 10);
  return back === iso ? t / 86_400_000 : null;
};

/**
 * The quote of the page language from a getPublicMonthlyRates body, or null (VND only).
 * @param today YYYY-MM-DD in the property time zone (todayIn).
 */
export function fxQuote(body: unknown, lang: Lang, today: string): FxQuote | null {
  const currency = FX_CURRENCY[lang];
  if (!currency || !body || typeof body !== 'object') return null;
  const fx = (body as { fx?: unknown }).fx;
  if (!fx || typeof fx !== 'object') return null;
  const f = fx as { base?: unknown; asOf?: unknown; rates?: unknown };
  if (f.base !== 'VND' || typeof f.asOf !== 'string') return null;
  if (!f.rates || typeof f.rates !== 'object') return null;
  const rate = (f.rates as Record<string, unknown>)[currency];
  if (typeof rate !== 'number' || !Number.isFinite(rate)) return null;
  const [lo, hi] = FX_SANE[currency];
  if (rate < lo || rate > hi) return null;
  const asOfDay = dayNumber(f.asOf);
  const todayDay = dayNumber(today);
  if (asOfDay === null || todayDay === null) return null;
  const age = todayDay - asOfDay;
  // one day ahead is accepted (the rate of the next Vietcombank day published before midnight)
  if (age > FX_MAX_AGE_DAYS || age < -1) return null;
  return { currency, rate, asOf: f.asOf };
}

/** VND → whole units of the quote currency, rounded up to the step. null when the result is not a positive number. */
export function convertVnd(vnd: number, q: FxQuote): number | null {
  if (!Number.isFinite(vnd) || vnd <= 0) return null;
  const step = FX_STEP[q.currency];
  // toFixed(6) first: 8,144,000 ÷ 25,450 must give 320, not 320.00000000000006 → 321
  const units = Number((vnd / q.rate / step).toFixed(6));
  const out = Math.ceil(units) * step;
  return Number.isFinite(out) && out > 0 ? out : null;
}

/** Amount in the way of the page language: en US$334 · ko ₩4,670,000 · zh ¥2,415 · ru 29 400 ₽. */
export function formatFx(amount: number, q: FxQuote, lang: Lang): string {
  return new Intl.NumberFormat(INTL_LOCALE[lang], {
    style: 'currency',
    currency: q.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Rate date in the way of the page language: en "17 Nov 2026" · ko "2026년 11월 17일" · zh "2026年11月17日" ·
 * ru "17.11.2026" (the short Russian form ends in "г.", which would give "г.." before the next sentence).
 */
export function formatFxDate(asOf: string, lang: Lang): string {
  const [y, m, d] = asOf.split('-').map(Number) as [number, number, number];
  const opts: Intl.DateTimeFormatOptions =
    lang === 'ru'
      ? { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }
      : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], opts).format(new Date(Date.UTC(y, m - 1, d)));
}

export interface FxStrings {
  /** "≈ {amount} / month" – amount already through formatFx. */
  month: (amount: string) => string;
  /** "Estimate at the {date} rate. Payment in VND." */
  note: (date: string) => string;
}

/** The two lines under a VND figure, or null (VND only). */
export function fxLines(
  vnd: number,
  q: FxQuote | null,
  S: FxStrings,
  lang: Lang,
): { month: string; note: string; value: number } | null {
  if (!q) return null;
  const value = convertVnd(vnd, q);
  if (value === null) return null;
  return {
    month: S.month(formatFx(value, q, lang)),
    note: S.note(formatFxDate(q.asOf, lang)),
    value,
  };
}
