/**
 * FB-INV-012 – the pure rules of the monthly statement (no I/O, unit-tested with DOM's numbers): periods, rent, meter
 * consumption, utility amounts with VAT, rounding, overdue level, the parameters' shapes. Contract
 * `rounds/round-05/fb-inv-012/contract.md` (D3, mục 2.4, 3, 5.1), DOM BR-LS-01…16, INV 17/11 (+ bổ sung opening reading).
 *
 * Money: VND integers only (BR-004). Water is handled in TENTHS of m³ (one decimal – BR-LS-11), never as a float sum.
 */
import { type LocalDate, addDays } from '../../../shared/time';

// ───────────────────────── dates ─────────────────────────

/** "2026-12" or "2026-12-01" → "2026-12-01"; anything else → null. */
export function parseMonth(raw: unknown): LocalDate | null {
  if (typeof raw !== 'string') return null;
  const m = /^(\d{4})-(\d{2})(?:-01)?$/.exec(raw.trim());
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return `${m[1]}-${m[2]}-01`;
}

export const monthOf = (date: LocalDate): LocalDate => `${date.slice(0, 7)}-01`;

/** First day of the month `n` months after the month of `month` (n may be negative). */
export function addMonths(month: LocalDate, n: number): LocalDate {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 10);
}

/** Last day of the month of `date`. */
export const monthEnd = (date: LocalDate): LocalDate => addDays(addMonths(monthOf(date), 1), -1);

/** Days of [from, to], both included. */
export function daysInclusive(from: LocalDate, to: LocalDate): number {
  return (
    Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1
  );
}

export interface Period {
  from: LocalDate;
  to: LocalDate;
}

export const monthPeriod = (month: LocalDate): Period => ({ from: month, to: monthEnd(month) });

/** Intersection of a period with [arrival, lastNight]; null when empty. */
export function clip(p: Period, arrival: LocalDate, lastNight: LocalDate): Period | null {
  const from = p.from > arrival ? p.from : arrival;
  const to = p.to < lastNight ? p.to : lastNight;
  return from <= to ? { from, to } : null;
}

/** Same day of month `months` later, end of month clamped (31/01 + 1 → 28/02 – BR-209). */
export function plusMonthsDate(date: LocalDate, months: number): LocalDate {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

// ───────────────────────── parameters (contract mục 3) ─────────────────────────

export type RentTiming = 'advance' | 'arrears';
export type PartialFirstMonthRent = 'at_checkin' | 'first_statement';

export interface StatementRules {
  rentTiming: RentTiming;
  dueDay: number;
  totalRoundingVnd: number;
  partialFirstMonthRent: PartialFirstMonthRent;
  readingWindow: { daysBeforeMonthEnd: number; daysAfter: number };
}

export interface UtilityUnitPrice {
  electricityVndPerKwh: number;
  waterVndPerM3: number;
}

export interface UtilityVatRate {
  electricity: number;
  water: number;
}

export const STATEMENT_RULES_KEY = 'monthly_statement_rules';
export const UTILITY_UNIT_PRICE_KEY = 'utility_unit_price';
export const UTILITY_VAT_RATE_KEY = 'utility_vat_rate';

/** Contract defaults (also the catalogue defaults of 0099) – used when a stored value is unreadable. */
export const DEFAULT_RULES: StatementRules = {
  rentTiming: 'advance',
  dueDay: 5,
  totalRoundingVnd: 1000,
  partialFirstMonthRent: 'at_checkin',
  readingWindow: { daysBeforeMonthEnd: 0, daysAfter: 1 },
};

export const VAT_RATES_ALLOWED = [0, 5, 8, 10] as const;
export const TOTAL_ROUNDING_ALLOWED = [1, 100, 1000] as const;
export const UNIT_PRICE_BOUNDS = {
  electricityVndPerKwh: { min: 1, max: 20_000 },
  waterVndPerM3: { min: 1, max: 200_000 },
} as const;
/** Reading window bounds (not in the contract table – BE: a window wider than a week is a typo). */
export const READING_WINDOW_MAX_DAYS = 7;

export interface ParamIssue {
  field: string;
  code: 'REQUIRED' | 'VALIDATION_FAILED' | 'NOT_ALLOWED' | 'PARAM_OUT_OF_RANGE';
  extras?: { min?: number; max?: number; allowed?: readonly unknown[] };
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const isInt = (v: unknown): v is number => Number.isSafeInteger(v);

function unknownKeys(v: Record<string, unknown>, allowed: readonly string[]): ParamIssue | null {
  const extra = Object.keys(v).find((k) => !allowed.includes(k));
  return extra ? { field: `value.${extra}`, code: 'NOT_ALLOWED' } : null;
}

/** setParameter hook check of `utility_unit_price` (first problem, or null). */
export function unitPriceIssue(v: unknown): ParamIssue | null {
  if (!isObj(v)) return { field: 'value', code: 'VALIDATION_FAILED' };
  const extra = unknownKeys(v, ['electricityVndPerKwh', 'waterVndPerM3']);
  if (extra) return extra;
  for (const k of ['electricityVndPerKwh', 'waterVndPerM3'] as const) {
    const x = v[k];
    if (x === undefined || x === null) return { field: `value.${k}`, code: 'REQUIRED' };
    if (!isInt(x)) return { field: `value.${k}`, code: 'VALIDATION_FAILED' };
    const b = UNIT_PRICE_BOUNDS[k];
    if (x < b.min || x > b.max) {
      return {
        field: `value.${k}`,
        code: 'PARAM_OUT_OF_RANGE',
        extras: { min: b.min, max: b.max },
      };
    }
  }
  return null;
}

/** setParameter hook check of `utility_vat_rate`. */
export function vatRateIssue(v: unknown): ParamIssue | null {
  if (!isObj(v)) return { field: 'value', code: 'VALIDATION_FAILED' };
  const extra = unknownKeys(v, ['electricity', 'water']);
  if (extra) return extra;
  for (const k of ['electricity', 'water'] as const) {
    const x = v[k];
    if (x === undefined || x === null) return { field: `value.${k}`, code: 'REQUIRED' };
    if (typeof x !== 'number') return { field: `value.${k}`, code: 'VALIDATION_FAILED' };
    if (!(VAT_RATES_ALLOWED as readonly number[]).includes(x)) {
      return {
        field: `value.${k}`,
        code: 'PARAM_OUT_OF_RANGE',
        extras: { allowed: VAT_RATES_ALLOWED },
      };
    }
  }
  return null;
}

/** setParameter hook check of `monthly_statement_rules`. */
export function rulesIssue(v: unknown): ParamIssue | null {
  if (!isObj(v)) return { field: 'value', code: 'VALIDATION_FAILED' };
  const extra = unknownKeys(v, [
    'rentTiming',
    'dueDay',
    'totalRoundingVnd',
    'partialFirstMonthRent',
    'readingWindow',
  ]);
  if (extra) return extra;
  const enumIssue = (k: string, allowed: readonly unknown[]): ParamIssue | null => {
    const x = v[k];
    if (x === undefined || x === null) return { field: `value.${k}`, code: 'REQUIRED' };
    if (!allowed.includes(x))
      return { field: `value.${k}`, code: 'PARAM_OUT_OF_RANGE', extras: { allowed } };
    return null;
  };
  const a = enumIssue('rentTiming', ['advance', 'arrears']);
  if (a) return a;
  const due = v.dueDay;
  if (due === undefined || due === null) return { field: 'value.dueDay', code: 'REQUIRED' };
  if (!isInt(due)) return { field: 'value.dueDay', code: 'VALIDATION_FAILED' };
  if (due < 1 || due > 28)
    return { field: 'value.dueDay', code: 'PARAM_OUT_OF_RANGE', extras: { min: 1, max: 28 } };
  const r = enumIssue('totalRoundingVnd', TOTAL_ROUNDING_ALLOWED);
  if (r) return r;
  const p = enumIssue('partialFirstMonthRent', ['at_checkin', 'first_statement']);
  if (p) return p;
  const w = v.readingWindow;
  if (w === undefined || w === null) return { field: 'value.readingWindow', code: 'REQUIRED' };
  if (!isObj(w)) return { field: 'value.readingWindow', code: 'VALIDATION_FAILED' };
  const wExtra = Object.keys(w).find((k) => !['daysBeforeMonthEnd', 'daysAfter'].includes(k));
  if (wExtra) return { field: `value.readingWindow.${wExtra}`, code: 'NOT_ALLOWED' };
  for (const k of ['daysBeforeMonthEnd', 'daysAfter'] as const) {
    const x = w[k];
    if (x === undefined || x === null)
      return { field: `value.readingWindow.${k}`, code: 'REQUIRED' };
    if (!isInt(x)) return { field: `value.readingWindow.${k}`, code: 'VALIDATION_FAILED' };
    if (x < 0 || x > READING_WINDOW_MAX_DAYS) {
      return {
        field: `value.readingWindow.${k}`,
        code: 'PARAM_OUT_OF_RANGE',
        extras: { min: 0, max: READING_WINDOW_MAX_DAYS },
      };
    }
  }
  return null;
}

/** A stored value read defensively: a broken value falls back to the contract default (never throws). */
export function readRules(v: unknown): StatementRules {
  return rulesIssue(v) === null ? (v as StatementRules) : DEFAULT_RULES;
}
export function readUnitPrice(v: unknown): UtilityUnitPrice {
  return unitPriceIssue(v) === null
    ? (v as UtilityUnitPrice)
    : { electricityVndPerKwh: 4000, waterVndPerM3: 25000 };
}
export function readVatRate(v: unknown): UtilityVatRate {
  return vatRateIssue(v) === null ? (v as UtilityVatRate) : { electricity: 8, water: 5 };
}

// ───────────────────────── periods of a statement (D3) ─────────────────────────

export interface StatementPeriods {
  rent: Period;
  utility: Period;
  service: Period;
  dueDate: LocalDate;
}

/**
 * Statement of month M: `advance` (BR-LS-01) – rent of M, utilities and services of M−1; `arrears` – everything of M−1.
 * Due on `dueDay` of M (never before the arrival – the statement of the arrival month is paid at check-in).
 */
export function statementPeriods(
  month: LocalDate,
  rules: StatementRules,
  arrival: LocalDate,
): StatementPeriods {
  const prev = monthPeriod(addMonths(month, -1));
  const due = `${month.slice(0, 7)}-${String(rules.dueDay).padStart(2, '0')}`;
  return {
    rent: rules.rentTiming === 'advance' ? monthPeriod(month) : prev,
    utility: prev,
    service: prev,
    dueDate: due < arrival ? arrival : due,
  };
}

// ───────────────────────── rent (BR-LS-03, BR-LS-04, BR-210) ─────────────────────────

export interface RentLineCalc {
  period: Period;
  quantity: number;
  unit: 'month' | 'day';
  unitPriceVnd: number;
  amountVnd: number;
}

/**
 * Rent of one period of a stay: the whole month → the monthly rent of the contract (BR-LS-06); a part of it → the
 * daily rent (rent ÷ `long_stay_daily_divisor`, rounded – BR-LS-03) × days. Null when the stay does not cover it.
 */
export function rentFor(
  period: Period,
  stay: { arrival: LocalDate; lastNight: LocalDate },
  monthlyRentVnd: number,
  dailyRentVnd: number,
): RentLineCalc | null {
  const c = clip(period, stay.arrival, stay.lastNight);
  if (!c) return null;
  const full = c.from === monthOf(c.from) && c.to === monthEnd(c.from);
  if (full)
    return {
      period: c,
      quantity: 1,
      unit: 'month',
      unitPriceVnd: monthlyRentVnd,
      amountVnd: monthlyRentVnd,
    };
  const days = daysInclusive(c.from, c.to);
  return {
    period: c,
    quantity: days,
    unit: 'day',
    unitPriceVnd: dailyRentVnd,
    amountVnd: dailyRentVnd * days,
  };
}

/**
 * Rent of the whole contract (BR-LS-04 "tiền thuê × số tháng HĐ", BR-210 odd days): whole contract months from the
 * arrival (a departure one day before a month mark still counts the month – DOM D-A7-1), then odd days × daily rent.
 */
export function contractRentVnd(
  arrival: LocalDate,
  departure: LocalDate,
  monthlyRentVnd: number,
  dailyRentVnd: number,
): number {
  let months = 0;
  let start = arrival;
  for (;;) {
    const end = plusMonthsDate(arrival, months + 1);
    if (end <= departure || addDays(departure, 1) === end) {
      months += 1;
      start = end;
      if (start >= departure) break;
      continue;
    }
    break;
  }
  const oddDays = start < departure ? daysInclusive(start, addDays(departure, -1)) : 0;
  return months * monthlyRentVnd + oddDays * dailyRentVnd;
}

// ───────────────────────── meters (BR-LS-10…12, INV 17/11) ─────────────────────────

export type Meter = 'electricity' | 'water';
/** Scale of a stored value: electricity whole kWh, water tenths of m³. */
export const METER_SCALE: Record<Meter, number> = { electricity: 1, water: 10 };

export type MeterException =
  | { type: 'replaced'; oldFinal: number; newStart: number; replacedOn: LocalDate }
  | { type: 'rollover'; maxValue: number };

/** Typed value → stored value, the fraction DROPPED (BR-LS-11: never rounded up). Scaled integer. */
export function truncScaled(meter: Meter, value: number): number {
  return Math.floor(value * METER_SCALE[meter] + 1e-9);
}

export const fromScaled = (meter: Meter, scaled: number): number =>
  meter === 'electricity' ? scaled : scaled / 10;

/**
 * Usage between two readings of one meter (scaled integers). Without an exception `to − from` (may be < 0 – the caller
 * refuses it). Meter replaced: (old meter's last value − from) + (to − new meter's first value). Rollover:
 * (max + 1 step − from) + to. BR-LS-12 example: 1.250 → 1.310 (old), 0 → 82 (new) = 60 + 82 = 142 kWh.
 */
export function usageScaled(
  meter: Meter,
  from: number,
  to: number,
  exception: MeterException | null,
): number {
  if (!exception) return to - from;
  if (exception.type === 'replaced') {
    return (
      truncScaled(meter, exception.oldFinal) - from + (to - truncScaled(meter, exception.newStart))
    );
  }
  return truncScaled(meter, exception.maxValue) + 1 - from + to;
}

/** Shape of an exception sent with a reading (errors at `<prefix>.exception.*`). */
export function exceptionIssue(
  raw: unknown,
  prefix: string,
): { field: string; code: string } | null {
  if (raw === undefined || raw === null) return null;
  if (!isObj(raw)) return { field: `${prefix}.exception`, code: 'VALIDATION_FAILED' };
  const num = (k: string) =>
    typeof raw[k] === 'number' && Number.isFinite(raw[k]) && (raw[k] as number) >= 0;
  if (raw.type === 'replaced') {
    for (const k of ['oldFinal', 'newStart']) {
      if (!num(k))
        return {
          field: `${prefix}.exception.${k}`,
          code: raw[k] === undefined ? 'REQUIRED' : 'VALIDATION_FAILED',
        };
    }
    const on = raw.replacedOn;
    if (
      typeof on !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(on) ||
      Number.isNaN(Date.parse(`${on}T00:00:00Z`))
    ) {
      return {
        field: `${prefix}.exception.replacedOn`,
        code: on === undefined ? 'REQUIRED' : 'DATE_INVALID',
      };
    }
    const extra = Object.keys(raw).find(
      (k) => !['type', 'oldFinal', 'newStart', 'replacedOn'].includes(k),
    );
    return extra ? { field: `${prefix}.exception.${extra}`, code: 'NOT_ALLOWED' } : null;
  }
  if (raw.type === 'rollover') {
    if (!num('maxValue')) {
      return {
        field: `${prefix}.exception.maxValue`,
        code: raw.maxValue === undefined ? 'REQUIRED' : 'VALIDATION_FAILED',
      };
    }
    const extra = Object.keys(raw).find((k) => !['type', 'maxValue'].includes(k));
    return extra ? { field: `${prefix}.exception.${extra}`, code: 'NOT_ALLOWED' } : null;
  }
  return {
    field: `${prefix}.exception.type`,
    code: raw.type === undefined ? 'REQUIRED' : 'NOT_IN_LIST',
  };
}

// ───────────────────────── utility amounts (BR-LS-07/08/09) ─────────────────────────

export interface UtilityAmounts {
  quantity: number;
  unitPriceNetVnd: number;
  /** Unit price including VAT, rounded to the đồng – the folio line's unit price (contract 2.4). */
  unitPriceGrossVnd: number;
  netVnd: number;
  vatVnd: number;
  amountVnd: number;
}

/**
 * Net = round(quantity × unit price before VAT); amount = round(quantity × unit price incl. VAT rounded to the đồng)
 * – the folio keeps "amount = round(quantity × unit price)" (folio-lines.service.ts); VAT = amount − net.
 * DOM: 142 kWh × 4.000 + 8 % = 568.000 + 45.440 = 613.440; 3,4 m³ × 25.000 + 5 % = 85.000 + 4.250 = 89.250.
 */
export function utilityAmounts(
  meter: Meter,
  usage: number,
  unitPriceNetVnd: number,
  vatRatePct: number,
): UtilityAmounts {
  const scale = METER_SCALE[meter];
  const unitPriceGrossVnd = Math.round((unitPriceNetVnd * (100 + vatRatePct)) / 100);
  const netVnd = Math.round((usage * unitPriceNetVnd) / scale);
  const amountVnd = Math.round((usage * unitPriceGrossVnd) / scale);
  return {
    quantity: fromScaled(meter, usage),
    unitPriceNetVnd,
    unitPriceGrossVnd,
    netVnd,
    vatVnd: amountVnd - netVnd,
    amountVnd,
  };
}

/** BR-LS-09: total rounded DOWN to `unit` (never more than the invoice); the remainder is a negative "Làm tròn" line. */
export function roundDownTotal(
  subtotalVnd: number,
  unit: number,
): { totalVnd: number; roundingVnd: number } {
  if (subtotalVnd <= 0) return { totalVnd: subtotalVnd, roundingVnd: 0 };
  const totalVnd = Math.floor(subtotalVnd / unit) * unit;
  return { totalVnd, roundingVnd: totalVnd - subtotalVnd };
}

// ───────────────────────── overdue (BR-LS-02, D6) ─────────────────────────

export type AlertLevel = 'due_today' | 'overdue' | 'alert' | 'escalate';

/**
 * Derived, never stored: an issued statement still owing money on its due date is `due_today`; from the next day
 * `overdue`; `alertDays` days after the due date `alert` (red for the manager); `escalateDays` days → `escalate`.
 */
export function overdueOf(
  today: LocalDate,
  dueDate: LocalDate | null,
  owing: boolean,
  alertDays: number,
  escalateDays: number,
): { overdueDays: number; alertLevel: AlertLevel | null } {
  if (!dueDate || !owing || today < dueDate) return { overdueDays: 0, alertLevel: null };
  if (today === dueDate) return { overdueDays: 0, alertLevel: 'due_today' };
  const days = daysInclusive(dueDate, today) - 1;
  if (days >= escalateDays) return { overdueDays: days, alertLevel: 'escalate' };
  if (days >= alertDays) return { overdueDays: days, alertLevel: 'alert' };
  return { overdueDays: days, alertLevel: 'overdue' };
}

// ───────────────────────── display ─────────────────────────

/** "Nguyễn Văn Minh" → "N. Minh" (the short name of the lists – no full name in lists, contract 5.1). */
export function shortGuestName(fullName: string | null | undefined): string | null {
  const words = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  if (words.length === 1) return words[0] as string;
  const first = words[0] as string;
  return `${first.charAt(0).toLocaleUpperCase('vi')}. ${words[words.length - 1]}`;
}

/** Statement code (contract 2.2): `TT-<yymm>-<room no>`, a replacement `-R<n>`. */
export function statementCode(month: LocalDate, roomNo: string, replacement: number): string {
  const yymm = `${month.slice(2, 4)}${month.slice(5, 7)}`;
  const room = roomNo.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'X';
  return `TT-${yymm}-${room}${replacement > 0 ? `-R${replacement}` : ''}`;
}

/** Last 4 digits only (contract 5.2 – the full number is inside the QR payload only). */
export const last4Masked = (accountNo: string): string => `••••${accountNo.slice(-4)}`;
