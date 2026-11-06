/**
 * V5-25 (BUG-R5-001, BUG-R5-003; DOM rules-v1.0.5 8.4 and 12.1–12.3; ARC contract 0.3.13 bổ sung 1, 1.24) – the
 * shapes of the structured parameters that the price engine reads, as pure functions with no I/O. One source for:
 * - the save rules of `setParameter` (platform/internal/parameter-rules.ts → 422 PARAM_OUT_OF_RANGE);
 * - the defensive read of `min_stay` in the three places that apply it (quote, createReservation, web estimate);
 * - the defensive read of `damage_catalog` (BR-512) in the charge catalogue / addFolioLine and the line labels of
 *   getFolio / getBill (folio/internal/damage-catalog-read.ts).
 *
 * Every check returns the FIRST problem it finds (`ShapeIssue`), or null. `field` follows ARC 1.24: `value` (the
 * whole value), `value[<i>]` (one element) or `value[<i>].<key>`; `code` comes from the existing field-code table
 * (REQUIRED, VALIDATION_FAILED, VALUE_OUT_OF_RANGE, NOT_IN_LIST, DUPLICATE, NOT_ALLOWED, DATE_INVALID, DATE_ORDER,
 * TOO_LONG);
 * `extras` only uses the existing names `min`, `max`, `allowed`.
 */

/** Weekday codes of `weekend_nights` and `min_stay.arrivalWeekdays` (DOM 8.4: never the numbers 1–7). */
export const WEEKDAY_CODES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
/** Channel groups a `min_stay` rule may name (DOM 12.2: no `internal` – BR-113 never applies there). */
export const MIN_STAY_CHANNEL_GROUPS = ['direct', 'agent', 'ota'] as const;
export const MIN_STAY_CHANNELS_ALLOWED = ['all', ...MIN_STAY_CHANNEL_GROUPS] as const;
/** DOM 12.1: at most 20 rules; `nights` 1–7 (and ≤ short_stay_max_nights). */
export const MIN_STAY_MAX_RULES = 20;
export const MIN_STAY_MAX_NIGHTS = 7;
const MIN_STAY_KEYS = ['nights', 'channels', 'arrivalWeekdays', 'arrivalOnSpecialDates'] as const;

export interface ShapeIssue {
  field: string;
  code: string;
  extras: { min?: number; max?: number; allowed?: readonly unknown[] };
}

const issue = (field: string, code: string, extras: ShapeIssue['extras'] = {}): ShapeIssue => ({
  field,
  code,
  extras,
});

export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const isInt = (v: unknown): v is number => Number.isSafeInteger(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** A field path made only of the fixed names of these rules (no text taken from the stored value). */
const LOG_SAFE_FIELD = /^value(\[\d+\])?(\.[A-Za-z]+(\[\d+\])?)?$/;

/**
 * SEC FB-R5-SEC-BE-V525-01: the field path of a dropped element as a defensive read may write it into a log line. The
 * name of an unknown key is part of the stored value (it can be long, or hold a line break that forges a log line), so
 * NOT_ALLOWED gives `value[<i>].<unknown key>`; any other path is written only when it is made of the fixed names of
 * the rules (`value`, `value[<i>]`, `value[<i>].<key>`, `value[<i>].<key>[<j>]`), else `value[<i>]`. The 422 of a
 * save keeps the real path (ARC 1.24) – the sender owns the data.
 */
export function logSafeField(field: string, code: string, index?: number): string {
  const at = index === undefined ? 'value' : `value[${index}]`;
  if (code === 'NOT_ALLOWED') return `${at}.<unknown key>`;
  return LOG_SAFE_FIELD.test(field) ? field : at;
}

/** null/absent → REQUIRED; anything else of the wrong type → VALIDATION_FAILED (OpenAPI field-code table). */
const missingOrType = (v: unknown): 'REQUIRED' | 'VALIDATION_FAILED' =>
  v === undefined || v === null ? 'REQUIRED' : 'VALIDATION_FAILED';

/** First key of `obj` outside `allowed` (a typo such as `arrivalWeekday` – DOM 12.1). */
function unknownKey(obj: Record<string, unknown>, allowed: readonly string[]): string | null {
  return Object.keys(obj).find((k) => !allowed.includes(k)) ?? null;
}

/** A list of weekday codes: strings of WEEKDAY_CODES, no duplicate (empty allowed – callers decide). */
function weekdaysIssue(v: unknown, field: string): ShapeIssue | null {
  const allowed = { allowed: [...WEEKDAY_CODES] };
  if (!Array.isArray(v)) return issue(field, missingOrType(v), allowed);
  for (const [i, d] of v.entries()) {
    if (typeof d !== 'string' || !(WEEKDAY_CODES as readonly string[]).includes(d)) {
      return issue(`${field}[${i}]`, 'NOT_IN_LIST', allowed);
    }
    if (v.indexOf(d) !== i) return issue(`${field}[${i}]`, 'DUPLICATE', allowed);
  }
  return null;
}

/** `weekend_nights` (DOM 8.4, ARC 1.24): `Weekday[]`, at least one, no duplicate. Production `["FRI","SAT"]`. */
export function weekendNightsIssue(value: unknown): ShapeIssue | null {
  if (Array.isArray(value) && value.length === 0) {
    return issue('value', 'REQUIRED', { allowed: [...WEEKDAY_CODES] });
  }
  return weekdaysIssue(value, 'value');
}

/**
 * One `min_stay` rule (DOM 12.1). `maxNights` = min(7, short_stay_max_nights in force). Order of the checks (the
 * first one wins): element shape, unknown key, `nights`, `channels`, `arrivalWeekdays`, `arrivalOnSpecialDates`,
 * "applies to at least one day".
 */
export function minStayRuleIssue(rule: unknown, i: number, maxNights: number): ShapeIssue | null {
  const at = `value[${i}]`;
  if (!isPlainObject(rule)) return issue(at, missingOrType(rule));
  const extra = unknownKey(rule, MIN_STAY_KEYS);
  if (extra !== null) return issue(`${at}.${extra}`, 'NOT_ALLOWED');
  const nightsRange = { min: 1, max: maxNights };
  if (!isInt(rule.nights)) return issue(`${at}.nights`, missingOrType(rule.nights), nightsRange);
  if (rule.nights < 1 || rule.nights > maxNights) {
    return issue(`${at}.nights`, 'VALUE_OUT_OF_RANGE', nightsRange);
  }
  const channels = { allowed: [...MIN_STAY_CHANNELS_ALLOWED] };
  const ch = rule.channels;
  if (ch === undefined || ch === null) return issue(`${at}.channels`, 'REQUIRED', channels);
  if (ch !== 'all') {
    // A lone string such as "direct" is refused: the engine would read it as a substring test (DOM 12.2).
    if (!Array.isArray(ch) || ch.length === 0)
      return issue(`${at}.channels`, 'NOT_IN_LIST', channels);
    for (const [j, g] of ch.entries()) {
      if (typeof g !== 'string' || !(MIN_STAY_CHANNEL_GROUPS as readonly string[]).includes(g)) {
        return issue(`${at}.channels[${j}]`, 'NOT_IN_LIST', channels);
      }
      if (ch.indexOf(g) !== j) return issue(`${at}.channels[${j}]`, 'DUPLICATE', channels);
    }
  }
  if (rule.arrivalWeekdays !== undefined) {
    const bad = weekdaysIssue(rule.arrivalWeekdays, `${at}.arrivalWeekdays`);
    if (bad) return bad;
  }
  const special = rule.arrivalOnSpecialDates;
  if (special !== undefined && typeof special !== 'boolean') {
    return issue(`${at}.arrivalOnSpecialDates`, 'VALIDATION_FAILED');
  }
  const days = Array.isArray(rule.arrivalWeekdays) ? rule.arrivalWeekdays.length : 0;
  if (days === 0 && special !== true) return issue(at, 'REQUIRED');
  return null;
}

/** `min_stay` (DOM 12.1): a list of 0–20 rules; `[]` = no minimum stay on any day. */
export function minStayIssue(value: unknown, maxNights: number): ShapeIssue | null {
  if (!Array.isArray(value)) return issue('value', missingOrType(value));
  if (value.length > MIN_STAY_MAX_RULES) {
    return issue('value', 'VALUE_OUT_OF_RANGE', { max: MIN_STAY_MAX_RULES });
  }
  for (const [i, r] of value.entries()) {
    const bad = minStayRuleIssue(r, i, maxNights);
    if (bad) return bad;
  }
  return null;
}

/** The nights cap of a `min_stay` rule: min(7, short_stay_max_nights) – 7 when the latter is unknown. */
export function minStayNightsCap(shortStayMaxNights: unknown): number {
  return isInt(shortStayMaxNights) && shortStayMaxNights >= 1
    ? Math.min(MIN_STAY_MAX_NIGHTS, shortStayMaxNights)
    : MIN_STAY_MAX_NIGHTS;
}

/** The largest whole `nights` of a stored `min_stay` value (0 when none) – the reverse check of DOM 12.2. */
export function minStayLargestNights(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  let n = 0;
  for (const r of value) {
    if (isPlainObject(r) && isInt(r.nights) && r.nights > n) n = r.nights;
  }
  return n;
}

/** The usable rules of a stored `min_stay` value (DOM 12.3) and what was left out. */
export interface MinStayRead<R> {
  rules: R[];
  /** The value is not a list: read as "no rule". */
  notAList: boolean;
  /** Index + first problem of each rule left out. */
  dropped: Array<{ index: number; field: string; code: string }>;
}

/**
 * DOM 12.3 defensive read: a value that is not a list → no rule; a broken rule → that rule is left out, the good
 * ones still apply. Never throws; no default number (DOM 12.3, coding-standards 1.2).
 */
export function readMinStayRules<R>(value: unknown, maxNights: number): MinStayRead<R> {
  if (!Array.isArray(value)) return { rules: [], notAList: true, dropped: [] };
  const rules: R[] = [];
  const dropped: MinStayRead<R>['dropped'] = [];
  for (const [i, r] of value.entries()) {
    const bad = minStayRuleIssue(r, i, maxNights);
    if (bad) dropped.push({ index: i, field: bad.field, code: bad.code });
    else rules.push(r as R);
  }
  return { rules, notAList: false, dropped };
}

// ── other structured keys on the quote / booking / web estimate / check-in / check-out paths (V5-25 rà khóa) ──

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isLocalDate = (v: unknown): v is string =>
  typeof v === 'string' &&
  DATE.test(v) &&
  !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) &&
  new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
export const isLocalTime = (v: unknown): v is string => typeof v === 'string' && TIME.test(v);
const minutesOf = (t: string): number => {
  const [h, m] = t.split(':').map(Number) as [number, number];
  return h * 60 + m;
};
const nightsBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/** Technical caps of the lists (a pasted block, not a real setting). [GIẢ ĐỊNH – DOM chốt, V5-25 PR]. */
export const SPECIAL_DATES_MAX = 100;
/** One range of `special_dates` covers at most 31 nights – catches a year typed wrong (2027 → 2028). [GIẢ ĐỊNH] */
export const SPECIAL_DATE_MAX_NIGHTS = 31;
export const TIER_LIST_MAX = 10;

/** A list whose elements are objects with exactly `keys` (all required unless listed in `optional`). */
function listOf(
  value: unknown,
  max: number,
  keys: readonly string[],
  optional: readonly string[],
  each: (o: Record<string, unknown>, at: string, i: number) => ShapeIssue | null,
): ShapeIssue | null {
  if (!Array.isArray(value)) return issue('value', missingOrType(value));
  if (value.length > max) return issue('value', 'VALUE_OUT_OF_RANGE', { max });
  for (const [i, o] of value.entries()) {
    const at = `value[${i}]`;
    if (!isPlainObject(o)) return issue(at, missingOrType(o));
    const extra = unknownKey(o, keys);
    if (extra !== null) return issue(`${at}.${extra}`, 'NOT_ALLOWED');
    const missing = keys.find(
      (k) => !optional.includes(k) && (o[k] === undefined || o[k] === null),
    );
    if (missing) return issue(`${at}.${missing}`, 'REQUIRED');
    const bad = each(o, at, i);
    if (bad) return bad;
  }
  return null;
}

/**
 * A percent 0–100 with at most 2 decimals (DOM rules-v1.0.5 13.1: the engine works in basis points – `pctToBp` rounds –
 * so 12,345 would silently become 12,35). Above 100 or below 0 the engine throws (RangeError → 500). A third decimal →
 * VALIDATION_FAILED with min/max (ARC review #96, 9).
 */
function pctIssue(v: unknown, field: string): ShapeIssue | null {
  if (!isNum(v)) return issue(field, missingOrType(v), { min: 0, max: 100 });
  if (v < 0 || v > 100) return issue(field, 'VALUE_OUT_OF_RANGE', { min: 0, max: 100 });
  if (Number(v.toFixed(2)) !== v) return issue(field, 'VALIDATION_FAILED', { min: 0, max: 100 });
  return null;
}

function intIssue(v: unknown, field: string, min: number, max: number): ShapeIssue | null {
  if (!isInt(v)) return issue(field, missingOrType(v), { min, max });
  if (v < min || v > max) return issue(field, 'VALUE_OUT_OF_RANGE', { min, max });
  return null;
}

/** `special_dates` (BR-104): [{name?, from, to}] – real dates, half-open [from, to), 1–31 nights each. */
export function specialDatesIssue(value: unknown): ShapeIssue | null {
  return listOf(value, SPECIAL_DATES_MAX, ['name', 'from', 'to'], ['name'], (o, at) => {
    if (o.name !== undefined && (typeof o.name !== 'string' || o.name.length > 100)) {
      return issue(`${at}.name`, typeof o.name === 'string' ? 'TOO_LONG' : 'VALIDATION_FAILED');
    }
    if (!isLocalDate(o.from)) return issue(`${at}.from`, 'DATE_INVALID');
    if (!isLocalDate(o.to)) return issue(`${at}.to`, 'DATE_INVALID');
    const n = nightsBetween(o.from, o.to);
    if (n < 1) return issue(`${at}.to`, 'DATE_ORDER');
    if (n > SPECIAL_DATE_MAX_NIGHTS) {
      return issue(`${at}.to`, 'VALUE_OUT_OF_RANGE', { max: SPECIAL_DATE_MAX_NIGHTS });
    }
    return null;
  });
}

/** `los_discount` (BR-107): [{minNights 1–89, pct 0–100}], minNights not repeated; `[]` = no discount. */
export function losDiscountIssue(value: unknown): ShapeIssue | null {
  const seen = new Set<number>();
  return listOf(value, TIER_LIST_MAX, ['minNights', 'pct'], [], (o, at) => {
    const n = intIssue(o.minNights, `${at}.minNights`, 1, 89);
    if (n) return n;
    if (seen.has(o.minNights as number)) return issue(`${at}.minNights`, 'DUPLICATE');
    seen.add(o.minNights as number);
    return pctIssue(o.pct, `${at}.pct`);
  });
}

/**
 * `cancel_policy_direct` (BR-309): [{minDays 0–365, refundPct 0–100}], minDays not repeated, at least one tier (DOM
 * 13.1: the engine reads `[]` as "no refund in any case", so clearing the cell would change the policy silently; no
 * refund at all is `[{"minDays":0,"refundPct":0}]`).
 */
export function cancelPolicyIssue(value: unknown): ShapeIssue | null {
  if (Array.isArray(value) && value.length === 0) return issue('value', 'REQUIRED');
  const seen = new Set<number>();
  return listOf(value, TIER_LIST_MAX, ['minDays', 'refundPct'], [], (o, at) => {
    const n = intIssue(o.minDays, `${at}.minDays`, 0, 365);
    if (n) return n;
    if (seen.has(o.minDays as number)) return issue(`${at}.minDays`, 'DUPLICATE');
    seen.add(o.minDays as number);
    return pctIssue(o.refundPct, `${at}.refundPct`);
  });
}

/** `early_checkin_tiers` (BR-411): [{from, to: HH:mm, from < to, pct 0–100}], ranges [from, to) never overlap. */
export function earlyCheckinTiersIssue(value: unknown): ShapeIssue | null {
  const ranges: Array<[number, number]> = [];
  return listOf(value, TIER_LIST_MAX, ['from', 'to', 'pct'], [], (o, at) => {
    if (!isLocalTime(o.from)) return issue(`${at}.from`, 'VALIDATION_FAILED');
    if (!isLocalTime(o.to)) return issue(`${at}.to`, 'VALIDATION_FAILED');
    const [a, b] = [minutesOf(o.from), minutesOf(o.to)];
    if (a >= b) return issue(`${at}.to`, 'VALUE_OUT_OF_RANGE');
    if (ranges.some(([x, y]) => a < y && x < b)) return issue(at, 'DUPLICATE');
    ranges.push([a, b]);
    return pctIssue(o.pct, `${at}.pct`);
  });
}

/**
 * `late_checkout_tiers` (BR-412): [{after, until: HH:mm, pct 0–100}], after < until on the business-day axis
 * (a time before `rollover` belongs to the next calendar day – DOM G-16); ranges (after, until] never overlap.
 */
export function lateCheckoutTiersIssue(value: unknown, rollover: unknown): ShapeIssue | null {
  const roll = isLocalTime(rollover) ? minutesOf(rollover) : 0;
  const axis = (t: string) => (minutesOf(t) < roll ? minutesOf(t) + 24 * 60 : minutesOf(t));
  const ranges: Array<[number, number]> = [];
  return listOf(value, TIER_LIST_MAX, ['after', 'until', 'pct'], [], (o, at) => {
    if (!isLocalTime(o.after)) return issue(`${at}.after`, 'VALIDATION_FAILED');
    if (!isLocalTime(o.until)) return issue(`${at}.until`, 'VALIDATION_FAILED');
    const [a, b] = [axis(o.after), axis(o.until)];
    if (a >= b) return issue(`${at}.until`, 'VALUE_OUT_OF_RANGE');
    if (ranges.some(([x, y]) => a < y && x < b)) return issue(at, 'DUPLICATE');
    ranges.push([a, b]);
    return pctIssue(o.pct, `${at}.pct`);
  });
}

/** `early_departure_refund` (BR-428): {minNoticeDays 0–365, refundPct 0–100}. */
export function earlyDepartureRefundIssue(value: unknown): ShapeIssue | null {
  if (!isPlainObject(value)) return issue('value', missingOrType(value));
  const extra = unknownKey(value, ['minNoticeDays', 'refundPct']);
  if (extra !== null) return issue(`value.${extra}`, 'NOT_ALLOWED');
  return (
    intIssue(value.minNoticeDays, 'value.minNoticeDays', 0, 365) ??
    pctIssue(value.refundPct, 'value.refundPct')
  );
}

const REMINDER_MARK = /^([01]\d|2[0-3]):[0-5]\d(-1d)?$/;

/** `checkout_reminders` (BR-425): {before: up to 6 marks "HH:mm" or "HH:mm-1d", two overdue times "HH:mm"}. */
export function checkoutRemindersIssue(value: unknown): ShapeIssue | null {
  const keys = ['before', 'overdueWithSameDayArrival', 'overdueOtherwise'];
  if (!isPlainObject(value)) return issue('value', missingOrType(value));
  const extra = unknownKey(value, keys);
  if (extra !== null) return issue(`value.${extra}`, 'NOT_ALLOWED');
  const before = value.before;
  if (!Array.isArray(before)) return issue('value.before', missingOrType(before));
  if (before.length > 6) return issue('value.before', 'VALUE_OUT_OF_RANGE', { max: 6 });
  for (const [i, b] of before.entries()) {
    if (typeof b !== 'string' || !REMINDER_MARK.test(b)) {
      return issue(`value.before[${i}]`, 'VALIDATION_FAILED');
    }
    if (before.indexOf(b) !== i) return issue(`value.before[${i}]`, 'DUPLICATE');
  }
  for (const k of ['overdueWithSameDayArrival', 'overdueOtherwise']) {
    if (!isLocalTime(value[k])) return issue(`value.${k}`, missingOrType(value[k]));
  }
  return null;
}

/** `weekend_uplift_channels` / `special_uplift_channels` (text): "all" or one channel group. */
export const UPLIFT_CHANNELS_ALLOWED = ['all', 'direct', 'agent', 'ota'] as const;
export function upliftChannelsIssue(value: unknown): ShapeIssue | null {
  return typeof value === 'string' && (UPLIFT_CHANNELS_ALLOWED as readonly string[]).includes(value)
    ? null
    : issue('value', 'NOT_IN_LIST', { allowed: [...UPLIFT_CHANNELS_ALLOWED] });
}

/** `max_open_holds_per_user` (SEC-BE-28): {collaborator, sales_staff: whole number 0–50}, both required (DOM 13.1). */
export const HOLD_LIMIT_ROLES = ['collaborator', 'sales_staff'] as const;
export function maxOpenHoldsIssue(value: unknown): ShapeIssue | null {
  if (!isPlainObject(value)) return issue('value', missingOrType(value));
  const extra = unknownKey(value, HOLD_LIMIT_ROLES);
  if (extra !== null) {
    return issue(`value.${extra}`, 'NOT_ALLOWED', { allowed: [...HOLD_LIMIT_ROLES] });
  }
  // DOM 13.1: both roles required – `assertOpenHoldLimit` reads a missing role as "no limit" (SEC-BE-28 lost).
  for (const role of HOLD_LIMIT_ROLES) {
    const bad = intIssue(value[role], `value.${role}`, 0, 50);
    if (bad) return bad;
  }
  return null;
}

/**
 * `lease_terms` (BR-201) – only what the short-stay quote reads (BR-108 one-month alternative): a non-empty list of
 * terms, each `months` whole 1–60 and not repeated, `discountPct` (when given) 0–100. The other fields of a term
 * (deposit factors, billing cycle, commission columns) are not read on these paths and are left as they are (V5-30
 * moves the commission columns).
 */
export function leaseTermsIssue(value: unknown): ShapeIssue | null {
  if (!Array.isArray(value)) return issue('value', missingOrType(value));
  if (value.length === 0) return issue('value', 'REQUIRED');
  if (value.length > 12) return issue('value', 'VALUE_OUT_OF_RANGE', { max: 12 });
  const seen = new Set<number>();
  for (const [i, o] of value.entries()) {
    const at = `value[${i}]`;
    if (!isPlainObject(o)) return issue(at, missingOrType(o));
    const m = intIssue(o.months, `${at}.months`, 1, 60);
    if (m) return m;
    if (seen.has(o.months as number)) return issue(`${at}.months`, 'DUPLICATE');
    seen.add(o.months as number);
    if (o.discountPct !== undefined) {
      const bad = pctIssue(o.discountPct, `${at}.discountPct`);
      if (bad) return bad;
    }
  }
  return null;
}

// ── damage_catalog (BR-512): the charge catalogue / addFolioLine and the damage line labels of getFolio / getBill ──

/**
 * A damage item code (DOM rules-v1.0.5 13.4): its folio charge code is `damage.<code>` (charge-catalog,
 * `folio_line.charge_code`). Lower case letters, digits and `_`, 1–40 characters – every value the team ships fits
 * (production-defaults.ts and the DS-E BR-512 rows: `bath_towel`, `glass`, `remote`).
 */
export const DAMAGE_CODE = /^[a-z0-9_]{1,40}$/;
/** DOM 13.4: at most 100 items (a 10-unit property needs about 20–50; catches a pasted block). */
export const DAMAGE_CATALOG_MAX = 100;
/** DOM 13.4: a name of at most 100 characters (code points – `char_length` in the read-only SQL check). */
export const DAMAGE_NAME_MAX = 100;
/**
 * DOM 13.4: whole VND 1.000–20.000.000. 0 is an empty cell, not a price; a larger item (TV, air conditioner, mattress)
 * goes "outside the table" (MGR+ prices it, with a photo – BR-512). An INV table with dearer items → the team raises
 * the cap, no ESC.
 */
export const DAMAGE_PRICE_MIN_VND = 1_000;
export const DAMAGE_PRICE_MAX_VND = 20_000_000;
const DAMAGE_KEYS = ['code', 'name', 'priceVnd'] as const;
/** The spaces trimmed at both ends of a name – the same set as `btrim(…, E' \t\n\r\f\x0B')` in the SQL check. */
const NAME_EDGE_SPACES = /^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$/g;

/** One usable item of the damage table. */
export interface DamageItem {
  code: string;
  name: string;
  priceVnd: number;
}

/** How two names are compared (DOM 13.4: not repeated, ignoring case and the spaces at both ends). */
export const damageNameKey = (name: string): string =>
  name.replace(NAME_EDGE_SPACES, '').toLowerCase();

/**
 * One `damage_catalog` item on its own (DOM 13.4): an object with exactly `code`, `name`, `priceVnd`. Order of the
 * checks (the first one wins, like `listOf`): element shape, unknown key, missing key, `code`, `name`, `priceVnd`.
 */
export function damageItemIssue(item: unknown, i: number): ShapeIssue | null {
  const at = `value[${i}]`;
  if (!isPlainObject(item)) return issue(at, missingOrType(item));
  const extra = unknownKey(item, DAMAGE_KEYS);
  if (extra !== null) return issue(`${at}.${extra}`, 'NOT_ALLOWED');
  const missing = DAMAGE_KEYS.find((k) => item[k] === undefined || item[k] === null);
  if (missing) return issue(`${at}.${missing}`, 'REQUIRED');
  if (item.code === '') return issue(`${at}.code`, 'REQUIRED');
  if (typeof item.code !== 'string' || !DAMAGE_CODE.test(item.code)) {
    return issue(`${at}.code`, 'VALIDATION_FAILED');
  }
  if (typeof item.name !== 'string') return issue(`${at}.name`, 'VALIDATION_FAILED');
  if (damageNameKey(item.name) === '') return issue(`${at}.name`, 'REQUIRED');
  if ([...item.name].length > DAMAGE_NAME_MAX) return issue(`${at}.name`, 'TOO_LONG');
  return intIssue(item.priceVnd, `${at}.priceVnd`, DAMAGE_PRICE_MIN_VND, DAMAGE_PRICE_MAX_VND);
}

/** A good item whose `code` or name (DOM 13.4) was already seen; otherwise remembers both. */
function damageRepeatIssue(
  item: DamageItem,
  i: number,
  codes: Set<string>,
  names: Set<string>,
): ShapeIssue | null {
  if (codes.has(item.code)) return issue(`value[${i}].code`, 'DUPLICATE');
  const name = damageNameKey(item.name);
  if (names.has(name)) return issue(`value[${i}].name`, 'DUPLICATE');
  codes.add(item.code);
  names.add(name);
  return null;
}

/** `damage_catalog` (BR-512, DOM 13.4): 0–100 items, `code` and name not repeated; `[]` = no table (all "outside"). */
export function damageCatalogIssue(value: unknown): ShapeIssue | null {
  if (!Array.isArray(value)) return issue('value', missingOrType(value));
  if (value.length > DAMAGE_CATALOG_MAX) {
    return issue('value', 'VALUE_OUT_OF_RANGE', { max: DAMAGE_CATALOG_MAX });
  }
  const codes = new Set<string>();
  const names = new Set<string>();
  for (const [i, item] of value.entries()) {
    const bad = damageItemIssue(item, i) ?? damageRepeatIssue(item as DamageItem, i, codes, names);
    if (bad) return bad;
  }
  return null;
}

/** The usable items of a stored `damage_catalog` value and what was left out. */
export interface DamageCatalogRead {
  items: DamageItem[];
  /** The value is not a list: read as an empty table. */
  notAList: boolean;
  /** Index + first problem of each item left out. */
  dropped: Array<{ index: number; field: string; code: string }>;
}

/**
 * Defensive read (DOM 13.2, as 12.3 for `min_stay`): a value that is not a list → no table (the desk uses "outside the
 * table"); a broken item, or a later item repeating a code or a name already read → that item is left out, the good
 * ones still apply. Never throws. The 100-item cap is a save rule only (a long list read in full is harmless).
 */
export function readDamageCatalogItems(value: unknown): DamageCatalogRead {
  if (!Array.isArray(value)) return { items: [], notAList: true, dropped: [] };
  const items: DamageItem[] = [];
  const dropped: DamageCatalogRead['dropped'] = [];
  const codes = new Set<string>();
  const names = new Set<string>();
  for (const [i, item] of value.entries()) {
    const bad = damageItemIssue(item, i) ?? damageRepeatIssue(item as DamageItem, i, codes, names);
    if (bad) {
      dropped.push({ index: i, field: bad.field, code: bad.code });
      continue;
    }
    const { code, name, priceVnd } = item as DamageItem;
    items.push({ code, name, priceVnd });
  }
  return { items, notAList: false, dropped };
}
