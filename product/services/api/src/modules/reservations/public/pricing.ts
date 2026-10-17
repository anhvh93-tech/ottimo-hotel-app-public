/**
 * Pure booking-rule calculations (BR-002, 005, 011, 103–113, 302–305, 309, 812) – no I/O, no clock.
 * Every number comes from the caller (parameters read by PricingService, coding-standards 1.2); money is
 * integer VND and every division goes through divideRoundVnd/roundVnd (coding-standards 4).
 * The QA oracle product/tests/fixtures/br-examples.json is replayed against these functions
 * (test/reservations-pricing.test.ts).
 */
import { divideRoundVnd, roundVnd } from '../../platform/public/money';
import { type LocalDate, type LocalTime, addDays, atLocal } from '../../../shared/time';

export type ChannelGroup = 'direct' | 'agent' | 'ota' | 'internal';
export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
const WEEKDAYS: readonly Weekday[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** Percent (may be fractional, e.g. 15.5) → basis points as an integer, for integer money maths. */
export function pctToBp(pct: number): number {
  if (!Number.isFinite(pct) || pct < 0) throw new RangeError('percent must be ≥ 0');
  return Math.round(pct * 100);
}

/** `amount × pct %` rounded to `unit` (coding-standards 4.3 applyPct – integer only). */
export function applyPct(amount: number, pct: number, unit: number): number {
  return divideRoundVnd(amount * pctToBp(pct), 10_000, unit);
}

/** BR-002: nights of [arrival, departure). */
export function nightsOf(arrival: LocalDate, departure: LocalDate): number {
  return Math.round(
    (Date.parse(`${departure}T00:00:00Z`) - Date.parse(`${arrival}T00:00:00Z`)) / 86_400_000,
  );
}

export function nightDates(arrival: LocalDate, departure: LocalDate): LocalDate[] {
  const n = nightsOf(arrival, departure);
  return Array.from({ length: Math.max(0, n) }, (_, i) => addDays(arrival, i));
}

/** BR-002 K2: half-open ranges overlap (departure of A = arrival of B is NOT an overlap). */
export function rangesOverlap(
  a: { from: LocalDate; to: LocalDate },
  b: { from: LocalDate; to: LocalDate },
): boolean {
  return a.from < b.to && b.from < a.to;
}

export function weekdayOf(date: LocalDate): Weekday {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()] as Weekday;
}

/** Parameter `special_dates`: half-open [from, to) ranges (DS-E note; BR-104 "gồm cả hai đầu" on nights). */
export interface SpecialDate {
  name?: string;
  from: LocalDate;
  to: LocalDate;
}

export function isSpecialDate(date: LocalDate, specials: readonly SpecialDate[]): boolean {
  return specials.some((s) => date >= s.from && date < s.to);
}

/** `weekend_uplift_channels` / `special_uplift_channels`: 'all' or a list of channel groups. */
export type ChannelScope = 'all' | readonly string[];

function inScope(scope: ChannelScope, group: ChannelGroup): boolean {
  return scope === 'all' || scope.includes(group);
}

export interface CalendarRules {
  weekendNights: readonly Weekday[];
  weekendUpliftPct: number;
  weekendChannels: ChannelScope;
  specialDates: readonly SpecialDate[];
  specialUpliftPct: number;
  specialChannels: ChannelScope;
}

/**
 * BR-103/104: one night = base × (1 + uplift), ONE uplift (special > weekend > 0), rounded per channel
 * (direct/agent: rounding.night_rate; ota: OTA unit).
 */
export function calendarRate(
  baseVnd: number,
  date: LocalDate,
  group: ChannelGroup,
  rules: CalendarRules,
  unit: number,
): { rateVnd: number; uplift: 'special' | 'weekend' | 'none' } {
  if (isSpecialDate(date, rules.specialDates) && inScope(rules.specialChannels, group)) {
    return { rateVnd: applyPct(baseVnd, 100 + rules.specialUpliftPct, unit), uplift: 'special' };
  }
  if (rules.weekendNights.includes(weekdayOf(date)) && inScope(rules.weekendChannels, group)) {
    return { rateVnd: applyPct(baseVnd, 100 + rules.weekendUpliftPct, unit), uplift: 'weekend' };
  }
  return { rateVnd: roundVnd(baseVnd, unit), uplift: 'none' };
}

export interface LosTier {
  minNights: number;
  pct: number;
}

/** BR-107: the highest tier whose minNights ≤ nights (0 when none). */
export function losDiscountPct(nights: number, tiers: readonly LosTier[]): number {
  let best = 0;
  for (const t of tiers) if (nights >= t.minNights && t.pct > best) best = t.pct;
  return best;
}

/** BR-107: discount on each night AFTER the calendar, each rounded to `unit`. */
export function applyNightDiscount(rates: readonly number[], pct: number, unit: number): number[] {
  if (pct <= 0) return [...rates];
  return rates.map((r) => applyPct(r, 100 - pct, unit));
}

/**
 * BR-111 / BR-429 (a1) v0.3.8: the return-guest % a booking made from a quote carries (`pricing_snapshot.quote`
 * – BR-006 snapshot of the quote) and whether that quote stacked it on the BR-107 tier (`stackable`).
 */
export interface ReturnGuestDiscount {
  pct: number;
  stacked: boolean;
}

export function returnGuestOf(snapshot: unknown): ReturnGuestDiscount {
  const q = (snapshot as { quote?: { returnGuestPct?: unknown; calc?: { warnings?: unknown } } })
    ?.quote;
  const pct = typeof q?.returnGuestPct === 'number' && q.returnGuestPct > 0 ? q.returnGuestPct : 0;
  const warnings = Array.isArray(q?.calc?.warnings) ? (q?.calc?.warnings as unknown[]) : [];
  return { pct, stacked: pct > 0 && warnings.includes('return_code_stacked') };
}

/**
 * The % a re-priced stay carries (BR-429 (a1)): the better of the BR-107 tier of the new number of nights and
 * the return-guest %, never both – unless the quote stacked them (then the tier, the return % applied after).
 * Stored as `pricing_snapshot.losDiscountPct` (the % in force) so a later change compares like with like.
 */
export function effectiveDiscountPct(losPct: number, ret: ReturnGuestDiscount): number {
  return ret.stacked ? losPct : Math.max(losPct, ret.pct);
}

/** Gross of a night from its calendar price with the BR-107 tier and the BR-111 % (BR-429 (a1)). */
export function discountedNight(
  calendarVnd: number,
  losPct: number,
  ret: ReturnGuestDiscount,
  unit: number,
): number {
  if (ret.stacked && ret.pct > 0) {
    const tier = applyNightDiscount([calendarVnd], losPct, unit)[0] as number;
    return applyNightDiscount([tier], ret.pct, unit)[0] as number;
  }
  return applyNightDiscount([calendarVnd], effectiveDiscountPct(losPct, ret), unit)[0] as number;
}

/** BR-105: floor/ceiling of a base price (rate_floor_pct / rate_ceiling_pct), rounded to `unit`. */
export function rateBounds(
  baseVnd: number,
  floorPct: number,
  ceilingPct: number,
  unit: number,
): { floorVnd: number; ceilingVnd: number } {
  return {
    floorVnd: applyPct(baseVnd, floorPct, unit),
    ceilingVnd: applyPct(baseVnd, ceilingPct, unit),
  };
}

export interface Party {
  adults: number;
  children6to11: number;
  childrenUnder6: number;
}

/** BR-110: people counted for occupancy (children under 6 are not counted). */
export function countedPersons(p: Party): number {
  return p.adults + p.children6to11;
}

/**
 * BR-110 extra persons: adults fill the base occupancy first, so the extra persons are charged at the lower
 * band. Returns extra adults/children and the per-night fee.
 */
export function extraPersons(
  p: Party,
  baseOccupancy: number,
  fees: { adultVnd: number; child611Vnd: number },
): { extraCount: number; extraAdults: number; extraChildren: number; perNightVnd: number } {
  const extraAdults = Math.max(0, p.adults - baseOccupancy);
  const freeAfterAdults = Math.max(0, baseOccupancy - p.adults);
  const extraChildren = Math.max(0, p.children6to11 - freeAfterAdults);
  return {
    extraCount: extraAdults + extraChildren,
    extraAdults,
    extraChildren,
    perNightVnd: extraAdults * fees.adultVnd + extraChildren * fees.child611Vnd,
  };
}

/** BR-305: short-stay deposit = pct × room total (no extra-person fee), rounded to rounding.deposit. */
export function shortDeposit(roomTotalVnd: number, depositPct: number, unit: number): number {
  return applyPct(roomTotalVnd, depositPct, unit);
}

/** OTA total split evenly per night, whole VND, remainder on the last night (erd 8, DATA FB-06). */
export function splitEvenly(totalVnd: number, nights: number): number[] {
  if (nights <= 0) return [];
  const each = Math.floor(totalVnd / nights);
  const out = Array.from({ length: nights }, () => each);
  out[nights - 1] = totalVnd - each * (nights - 1);
  return out;
}

/** BR-302: hold deadline = min(created + hours, latest time on the arrival day); same-day hold refused. */
export function holdDeadline(
  createdAt: Date,
  holdHours: number,
  arrival: LocalDate,
  today: LocalDate,
  latestOnArrival: LocalTime,
  tz: string,
): { allowed: false } | { allowed: true; expiresAt: Date } {
  if (arrival <= today) return { allowed: false };
  const byHours = new Date(createdAt.getTime() + holdHours * 3_600_000);
  const cap = atLocal(arrival, latestOnArrival, tz);
  return { allowed: true, expiresAt: byHours < cap ? byHours : cap };
}

/** BR-303: extension = current + extra hours, never past the BR-302 cap. */
export function holdExtension(
  currentExpiresAt: Date,
  extraHours: number,
  arrival: LocalDate,
  latestOnArrival: LocalTime,
  tz: string,
): Date {
  const extended = new Date(currentExpiresAt.getTime() + extraHours * 3_600_000);
  const cap = atLocal(arrival, latestOnArrival, tz);
  return extended < cap ? extended : cap;
}

/** BR-011: notice days = anchor date − business date at notification (calendar days). */
export function noticeDays(anchor: LocalDate, businessDateAtNotice: LocalDate): number {
  return nightsOf(businessDateAtNotice, anchor);
}

export interface CancelTier {
  minDays: number;
  refundPct: number;
}

/**
 * BR-309: refund of the paid deposit by notice days (tiers of cancel_policy_direct); a stay with at least one
 * special (peak) night refunds nothing when cancel_peak_no_refund. Refund rounded to `unit`.
 */
export function directCancelRefund(
  depositPaidVnd: number,
  notice: number,
  tiers: readonly CancelTier[],
  peakNoRefund: boolean,
  unit: number,
): { refundVnd: number; cancelFeeVnd: number; refundPct: number } {
  let refundPct = 0;
  if (!peakNoRefund) {
    const sorted = [...tiers].sort((a, b) => b.minDays - a.minDays);
    refundPct = sorted.find((t) => notice >= t.minDays)?.refundPct ?? 0;
  }
  const refundVnd = Math.min(depositPaidVnd, applyPct(depositPaidVnd, refundPct, unit));
  return { refundVnd, cancelFeeVnd: depositPaidVnd - refundVnd, refundPct };
}

export interface MinStayRule {
  arrivalWeekdays?: readonly Weekday[];
  arrivalOnSpecialDates?: boolean;
  nights: number;
  channels: ChannelScope;
}

/** BR-113: required minimum nights for an arrival date and channel group (0 = no rule). */
export function minStayNights(
  arrival: LocalDate,
  group: ChannelGroup,
  rules: readonly MinStayRule[],
  specials: readonly SpecialDate[],
): number {
  let need = 0;
  for (const r of rules) {
    if (!inScope(r.channels, group)) continue;
    const byDay = r.arrivalWeekdays?.includes(weekdayOf(arrival)) ?? false;
    const bySpecial = r.arrivalOnSpecialDates === true && isSpecialDate(arrival, specials);
    if ((byDay || bySpecial) && r.nights > need) need = r.nights;
  }
  return need;
}

/**
 * BR-113 orphan-night exception: the requested [arrival, departure) exactly fills a gap of the room
 * between the previous booking (ends on arrival) and the next one (starts on departure).
 */
export function isOrphanGap(
  arrival: LocalDate,
  departure: LocalDate,
  occupied: ReadonlyArray<{ from: LocalDate; to: LocalDate }>,
): boolean {
  const before = occupied.some((o) => o.to === arrival);
  const after = occupied.some((o) => o.from === departure);
  return before && after;
}

/** BR-112: last bookable arrival = today + window − 1 (365 days counting today). */
export function lastBookableArrival(today: LocalDate, windowDays: number): LocalDate {
  return addDays(today, windowDays - 1);
}

/**
 * BR-812 (2) + DOM D-10 (BR v0.3.2): kit task due = check-in time on the arrival day, but never before
 * `confirmedAt + midstayMinutes` (a booking confirmed late gets a task that is not overdue at birth).
 */
export function extraGuestKitDue(
  arrival: LocalDate,
  checkinTime: LocalTime,
  tz: string,
  confirmed?: { at: Date; midstayMinutes: number },
): Date {
  const atCheckin = atLocal(arrival, checkinTime, tz);
  if (!confirmed) return atCheckin;
  const earliest = new Date(confirmed.at.getTime() + confirmed.midstayMinutes * 60_000);
  return atCheckin > earliest ? atCheckin : earliest;
}

/** BR-316: orphan nights a booking would leave on a room (free gap of exactly 1 night on either side). */
export function orphanNightsLeft(
  arrival: LocalDate,
  departure: LocalDate,
  occupied: ReadonlyArray<{ from: LocalDate; to: LocalDate }>,
): number {
  let n = 0;
  const nextStart = occupied
    .filter((o) => o.from >= departure)
    .map((o) => o.from)
    .sort()[0];
  if (nextStart && nightsOf(departure, nextStart) === 1) n += 1;
  const prevEnd = occupied
    .filter((o) => o.to <= arrival)
    .map((o) => o.to)
    .sort()
    .pop();
  if (prevEnd && nightsOf(prevEnd, arrival) === 1) n += 1;
  return n;
}
