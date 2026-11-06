/**
 * Business day vs calendar day (BR-010 v0.5.12; DOM rules-v1.0.5 V5-10, V5-11; OpenAPI 0.3.13 `checkOut` "Quy đổi giờ
 * trả", `earlyDeparture` W). Before `business_day_rollover` the clock still belongs to the previous business day, so
 * the night of that business day is already slept. ONE place for the clock rules of the stay actions – the reservation
 * buttons (`allowedActions`), the "Hôm nay" rows (reporting), check-out (B18, its summary and its VietQR) and early
 * departure (B16) all read them from here (ORC decision-log 06/11, PR-A1a):
 * - W ("cửa sổ sau nửa đêm"): 00:00 to before the rollover – the calendar date is the business date + 1;
 * - the post-midnight window of a departure (DOM S3-9 b): W while the calendar date is that departure;
 * - B18's day (0.3.6 bổ sung 2): the business date is the departure, or the clock is in its post-midnight window;
 * - the earliest calendar date a stay may end on now ("ngày lịch tối thiểu" – B16 V5-11, B18 V5-10).
 * Pure: the caller passes the clock (`dayClock`) or the two dates it already has.
 */
import { type LocalDate, type LocalTime, businessDate, localDate } from './time';

/** The property clock at one instant: business date (BR-010) and calendar date. */
export interface DayClock {
  /** Business date (`businessDate` – before the rollover = the previous day). */
  today: LocalDate;
  /** Calendar date at the same instant (no rollover). */
  calendarDate: LocalDate;
}

export function dayClock(at: Date, tz: string, rollover: LocalTime): DayClock {
  return { today: businessDate(at, tz, rollover), calendarDate: localDate(at, tz) };
}

/** W: 00:00 to before `business_day_rollover` – the calendar day has started, the business day has not. */
export function inEarlyHours(c: DayClock): boolean {
  return c.calendarDate > c.today;
}

/**
 * "Ngày lịch tối thiểu" (BR-428 v0.5.12, DOM V5-11): the earliest calendar date a stay may end on at this clock. In W
 * the night of the business date D is already slept, so it is D + 1 (the calendar date); otherwise the business date.
 */
export function minCalendarDate(c: DayClock): LocalDate {
  return inEarlyHours(c) ? c.calendarDate : c.today;
}

/** Post-midnight window of `departure` (DOM S3-9 b): business date = departure − 1 and calendar date = departure. */
export function inPostMidnightWindow(c: DayClock, departure: LocalDate): boolean {
  return inEarlyHours(c) && c.calendarDate === departure;
}

/**
 * B18 may run now for a stay leaving on `departure` (its effective departure – BR-422): the business date is the
 * departure, or the clock is in the departure's post-midnight window (button from 00:00 of the departure day –
 * BUG-R4-036). A stay past its departure (V5-15 `overdue`) is not covered here.
 */
export function isCheckoutDay(c: DayClock, departure: LocalDate): boolean {
  return c.today === departure || inPostMidnightWindow(c, departure);
}
