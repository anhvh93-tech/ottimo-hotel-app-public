/**
 * FB-INV-012 contract §12.1 (A127): bounds of a backdated arrival – a long stay already in house before Desk, entered
 * with an arrival date in the past (`createReservation.backdatedArrival`, `checkInBackdated`). One function for both
 * paths. `today` = business day of the property (T).
 * - arrival = T → `USE_CHECK_IN` (the normal check-in);
 * - arrival ∈ [T − 45, T − 1] (45 is a constant, not a parameter) → else `BACKDATE_OUT_OF_RANGE` (+ `earliest`);
 * - an arrival in the month before T's month only while the closing reading of that month can still be typed late,
 *   i.e. T ≤ last day of that month + readingWindow.daysAfter + lateMaxDays → else `PREVIOUS_MONTH_CLOSED` (otherwise
 *   the next statement would wait for a closing nobody can type any more – DOM G2). Two months back → same code.
 */
import { type LocalDate, addDays } from './time';

export const BACKDATE_MAX_DAYS = 45;
const LATE_MAX_DAYS_DEFAULT = 10;

export interface BackdateWindowRules {
  readingWindow: { daysAfter: number; lateMaxDays?: number };
}

export type BackdateIssue =
  | { code: 'BACKDATE_OUT_OF_RANGE'; earliest: LocalDate }
  | { code: 'PREVIOUS_MONTH_CLOSED'; earliest: LocalDate }
  | { code: 'USE_CHECK_IN' };

const monthOf = (d: LocalDate): LocalDate => `${d.slice(0, 7)}-01`;

function nextMonth(month: LocalDate): LocalDate {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
}

/** null = `arrival` is a valid backdated arrival on business day `today`. */
export function backdateBounds(
  today: LocalDate,
  arrival: LocalDate,
  rules: BackdateWindowRules,
): BackdateIssue | null {
  const earliest = addDays(today, -BACKDATE_MAX_DAYS);
  if (arrival === today) return { code: 'USE_CHECK_IN' };
  if (arrival > today || arrival < earliest) return { code: 'BACKDATE_OUT_OF_RANGE', earliest };
  const thisMonth = monthOf(today);
  const arrivalMonth = monthOf(arrival);
  if (arrivalMonth === thisMonth) return null;
  if (nextMonth(arrivalMonth) !== thisMonth) {
    return { code: 'PREVIOUS_MONTH_CLOSED', earliest: thisMonth };
  }
  const lateUntil = addDays(
    addDays(thisMonth, -1),
    rules.readingWindow.daysAfter + (rules.readingWindow.lateMaxDays ?? LATE_MAX_DAYS_DEFAULT),
  );
  return today <= lateUntil ? null : { code: 'PREVIOUS_MONTH_CLOSED', earliest: thisMonth };
}

/** The statement rules key the bounds read (`monthly_statement_rules`, contract mục 3). */
export const MONTHLY_STATEMENT_RULES_KEY = 'monthly_statement_rules';

/** Reads `readingWindow` of a `monthly_statement_rules` value, with the catalogue defaults when absent. */
export function backdateRulesOf(value: unknown): BackdateWindowRules {
  const w =
    value && typeof value === 'object'
      ? ((value as { readingWindow?: { daysAfter?: unknown; lateMaxDays?: unknown } })
          .readingWindow ?? {})
      : {};
  const daysAfter = typeof w.daysAfter === 'number' ? w.daysAfter : 1;
  const lateMaxDays = typeof w.lateMaxDays === 'number' ? w.lateMaxDays : LATE_MAX_DAYS_DEFAULT;
  return { readingWindow: { daysAfter, lateMaxDays } };
}
