/**
 * Pure stay rules of the front desk (no I/O – unit-tested with the BR oracle tests/fixtures/br-examples.json).
 * Every number comes from parameters passed in (coding-standards 1.2): tiers, grace, rounding unit.
 *
 * - earlyCheckinSurcharge   BR-411 tiers [from, to), BR-417 before the business-day rollover → previous night,
 *                           BR-413 long stay: free from rollover to check-in time when the room was vacant.
 * - lateCheckoutSurcharge   BR-412 tiers (after, until], grace (no same-day arrival), > last tier → extension
 *                           (BR-416); BR-413 long stay free until `long_stay_free_late_until` without arrival.
 *                           Times on the BUSINESS-DAY axis: 00:00–05:59 is after midnight (DOM G-16).
 * - departureReminderState  US-031 / BR-425 marks.
 * - earlyDepartureRefund    BR-428 / BR-011.
 */
import type { LocalDate, LocalTime } from '../../../shared/time';
import { divideRoundVnd } from '../../platform/public/money';
import { applyPct, nightsOf, noticeDays } from '../../reservations/public/pricing';

export interface EarlyTier {
  from: LocalTime;
  to: LocalTime;
  pct: number;
}

export interface LateTier {
  after: LocalTime;
  until: LocalTime;
  pct: number;
}

const DAY_MINUTES = 24 * 60;

export function minutesOf(t: LocalTime): number {
  const [h, m] = t.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

/** Minutes on the business-day axis: a time before the rollover belongs to the next calendar day. */
export function businessMinutes(t: LocalTime, rollover: LocalTime): number {
  const m = minutesOf(t);
  return m < minutesOf(rollover) ? m + DAY_MINUTES : m;
}

export interface EarlyCheckinInput {
  checkinTime: LocalTime;
  standardCheckinTime: LocalTime;
  rollover: LocalTime;
  tiers: readonly EarlyTier[];
  baseNightVnd: number;
  unit: number;
  /** Long stay (BR-413): was the room vacant the previous night (no departure the same day)? */
  longStay?: { vacantPreviousNight: boolean } | null;
}

export interface EarlyCheckinResult {
  tierPct: number;
  baseNightVnd: number;
  amountVnd: number;
  addsPreviousNight: boolean;
  ruleRef: 'BR-411' | 'BR-413' | 'BR-417';
}

export function earlyCheckinSurcharge(i: EarlyCheckinInput): EarlyCheckinResult {
  const t = minutesOf(i.checkinTime);
  const base = { baseNightVnd: i.baseNightVnd, tierPct: 0, amountVnd: 0, addsPreviousNight: false };
  const ref = i.longStay ? 'BR-413' : 'BR-411';
  if (t >= minutesOf(i.standardCheckinTime)) return { ...base, ruleRef: ref };
  if (t < minutesOf(i.rollover)) return { ...base, addsPreviousNight: true, ruleRef: 'BR-417' };
  if (i.longStay?.vacantPreviousNight) return { ...base, ruleRef: 'BR-413' };
  const tier = i.tiers.find((x) => t >= minutesOf(x.from) && t < minutesOf(x.to));
  const pct = tier?.pct ?? 0;
  return {
    ...base,
    tierPct: pct,
    amountVnd: pct > 0 ? applyPct(i.baseNightVnd, pct, i.unit) : 0,
    ruleRef: ref,
  };
}

export interface LateCheckoutInput {
  checkoutTime: LocalTime;
  standardCheckoutTime: LocalTime;
  rollover: LocalTime;
  tiers: readonly LateTier[];
  graceUntil: LocalTime | null;
  graceRequiresNoArrival: boolean;
  sameDayArrival: boolean;
  baseNightVnd: number;
  unit: number;
  /** Long stay (BR-413): free until this time when nobody arrives in the room the same day. */
  longStay?: { freeUntil: LocalTime } | null;
}

export interface LateCheckoutResult {
  tierPct: number;
  baseNightVnd: number;
  amountVnd: number;
  /** After the last tier (BR-412 > 18:00, BR-416) – must be an extension of one night. */
  treatAsExtension: boolean;
  inGrace: boolean;
  ruleRef: 'BR-412' | 'BR-413' | 'BR-416';
}

export function lateCheckoutSurcharge(i: LateCheckoutInput): LateCheckoutResult {
  const r = i.rollover;
  const t = businessMinutes(i.checkoutTime, r);
  const zero = {
    tierPct: 0,
    baseNightVnd: i.baseNightVnd,
    amountVnd: 0,
    treatAsExtension: false,
    inGrace: false,
  };
  const ref = i.longStay ? 'BR-413' : 'BR-412';
  if (t <= businessMinutes(i.standardCheckoutTime, r)) return { ...zero, ruleRef: ref };
  const last = Math.max(...i.tiers.map((x) => businessMinutes(x.until, r)));
  if (t > last) return { ...zero, treatAsExtension: true, ruleRef: 'BR-416' };
  const graceOk = !i.graceRequiresNoArrival || !i.sameDayArrival;
  if (i.graceUntil && graceOk && t <= businessMinutes(i.graceUntil, r)) {
    return { ...zero, inGrace: true, ruleRef: 'BR-412' };
  }
  if (i.longStay && !i.sameDayArrival && t <= businessMinutes(i.longStay.freeUntil, r)) {
    return { ...zero, ruleRef: 'BR-413' };
  }
  const tier = i.tiers.find(
    (x) => t > businessMinutes(x.after, r) && t <= businessMinutes(x.until, r),
  );
  const pct = tier?.pct ?? 0;
  return {
    ...zero,
    tierPct: pct,
    amountVnd: pct > 0 ? applyPct(i.baseNightVnd, pct, i.unit) : 0,
    ruleRef: ref,
  };
}

/** BR-102 / BR-413: nightly equivalent of a monthly rent (÷ 30, rounded to the night-rate unit). */
export function nightlyEquivalent(monthlyRentVnd: number, divisor: number, unit: number): number {
  return divideRoundVnd(monthlyRentVnd, divisor, unit);
}

export type DepartureReminderState =
  'reminded_waiting' | 'replied' | 'call_needed' | 'overdue' | 'checked_out';

export interface CheckoutReminders {
  /** e.g. ["20:00-1d", "09:00", "11:00"] – the LAST same-day mark is "call the guest" (BR-425). */
  before: readonly string[];
  overdueWithSameDayArrival: LocalTime;
  overdueOtherwise: LocalTime;
}

/** US-031: state of a departure today at `nowTime` (property local time, business-day axis). */
export function departureReminderState(i: {
  nowTime: LocalTime;
  rollover: LocalTime;
  checkedOut: boolean;
  replied: boolean;
  sameDayArrival: boolean;
  reminders: CheckoutReminders;
}): DepartureReminderState {
  if (i.checkedOut) return 'checked_out';
  const now = businessMinutes(i.nowTime, i.rollover);
  const overdue = businessMinutes(
    i.sameDayArrival ? i.reminders.overdueWithSameDayArrival : i.reminders.overdueOtherwise,
    i.rollover,
  );
  if (now >= overdue) return 'overdue';
  if (i.replied) return 'replied';
  const sameDay = i.reminders.before.filter((b) => !b.endsWith('-1d'));
  const call = sameDay[sameDay.length - 1];
  if (call && now >= businessMinutes(call, i.rollover)) return 'call_needed';
  return 'reminded_waiting';
}

export const REMINDER_ORDER: Record<DepartureReminderState, number> = {
  overdue: 0,
  call_needed: 1,
  reminded_waiting: 2,
  replied: 3,
  checked_out: 4,
};

export interface EarlyDepartureRefundPolicy {
  minNoticeDays: number;
  refundPct: number;
}

/**
 * BR-428 (INV ESC-006): notice counted per BR-011 against the NEW departure date (business date of the
 * notice); ≥ minNoticeDays → refundPct of the unstayed nights' room money, else nothing.
 */
export function earlyDepartureRefund(i: {
  newDeparture: LocalDate;
  businessDateAtNotice: LocalDate;
  droppedNightsVnd: number;
  policy: EarlyDepartureRefundPolicy;
  unit: number;
}): { noticeDays: number; refundVnd: number } {
  const days = noticeDays(i.newDeparture, i.businessDateAtNotice);
  const refundVnd =
    days >= i.policy.minNoticeDays ? applyPct(i.droppedNightsVnd, i.policy.refundPct, i.unit) : 0;
  return { noticeDays: days, refundVnd };
}

export { nightsOf };
