import {
  isApiError,
  type Channel,
  type ReservationStatus,
  type RoomConflict,
  type RoomSuggestion,
} from '@ottimo/api-client';
import { formatInstant, formatLocalDate, formatNumber, type Args } from '@ottimo/i18n';
import { fieldErrorText, problemView } from './problem';

type T = (key: string, args?: Args) => string;

/** v1.0.4 P4-40 (FE-B): string keys (UXD P4-01) are inline in `t('…')`, so `i18n-keys.test.ts` checks each one. */

export const STATUS_KEY: Record<ReservationStatus, string> = {
  hold: 'status.booking.hold',
  confirmed: 'status.booking.confirmed',
  in_house: 'status.booking.in_house',
  checked_out: 'status.booking.checked_out',
  cancelled: 'status.booking.cancelled',
  no_show: 'status.booking.no_show',
};

export const STATUS_TONE: Record<ReservationStatus, 'ok' | 'warn' | 'bad' | 'info' | 'neutral'> = {
  hold: 'warn',
  confirmed: 'ok',
  in_house: 'info',
  checked_out: 'neutral',
  cancelled: 'neutral',
  no_show: 'bad',
};

/** Channel display name: `listChannels` name when loaded, otherwise the raw code. */
export function channelName(channels: Channel[] | undefined, code?: string, id?: string): string {
  const c = channels?.find((x) => (id ? x.id === id : x.code === code));
  return c?.name ?? code ?? '';
}

/** [from, to) dates → number of nights (BR-002). */
export function nightsBetween(from: string, to: string): number {
  if (!from || !to) return 0;
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** dd/mm for compact rack / list labels. */
export const dayMonth = (date: string) => formatLocalDate(date).slice(0, 5);

/** One room segment of a stay (`Reservation.segments[]`). */
export interface StaySegment {
  roomId: string | null;
  roomNo?: string | null;
  fromDate: string;
  toDate: string;
}
/**
 * K11-03 (ARC 16.19): the room the stay is in TODAY – the segment with `fromDate ≤ today < toDate`, never
 * `segments[0]` (after a mid-stay B14 that is the room left). On the departure day (today = last `toDate`,
 * the post-midnight window included) or later → the last segment; before arrival → the first one.
 */
export function currentSegment<S extends StaySegment>(
  segments: readonly S[] | undefined,
  today: string,
): S | undefined {
  if (!segments?.length) return undefined;
  const sorted = [...segments].sort((a, b) => a.fromDate.localeCompare(b.fromDate));
  return (
    sorted.find((s) => s.fromDate <= today && today < s.toDate) ??
    (today >= sorted[sorted.length - 1]!.fromDate ? sorted[sorted.length - 1] : sorted[0])
  );
}

/** Remaining h / m until an instant (hold countdown, US-085). Negative → 0. */
export function remaining(untilIso: string | undefined, now = Date.now()) {
  if (!untilIso) return null;
  const ms = Math.max(0, Date.parse(untilIso) - now);
  const total = Math.floor(ms / 60_000);
  return { ms, h: Math.floor(total / 60), m: String(total % 60).padStart(2, '0') };
}

/** ESC-014: people counted for capacity = adults + children 6–11 (under 6 not counted). */
export function occupancy(adults: number, children6to11: number, base: number) {
  const occ = adults + children6to11;
  return { occ, extra: Math.max(0, occ - base) };
}

export const problemOf = (e: unknown) => (isApiError(e) ? e.problem : undefined);

export function conflictsOf(e: unknown): RoomConflict[] {
  const c = problemOf(e)?.conflicts;
  return Array.isArray(c) ? (c as RoomConflict[]) : [];
}

export function suggestionsOf(e: unknown): RoomSuggestion[] {
  const s = problemOf(e)?.suggestions;
  return Array.isArray(s) ? s : [];
}

/**
 * V5-48 (OpenAPI 0.3.13 add. 1, SEC B002-01): `confirmPaymentReceived` / `createVietQr` on a booking already closed
 * answer 409 `INVALID_TRANSITION` with `reservationStatus` – the BOOKING's status (`currentState` there is the
 * payment's). Read before `currentState` (UXD 9.1a). Undefined: another error, or an older server.
 */
export function closedReservationStatus(error: unknown): 'cancelled' | 'no_show' | undefined {
  if (!isApiError(error) || error.code !== 'INVALID_TRANSITION') return undefined;
  const s = error.problem.reservationStatus;
  return s === 'cancelled' || s === 'no_show' ? s : undefined;
}

/**
 * V5-48 (UXD 9.1a): what to tell the person when the booking closed under the deposit / VietQR box – never "reload"
 * (`rsv.transition_changed`): reloading does not help, they need to know what to do with the money. `salesOnly` =
 * SAL/CTV with no FD+ role (they pass the money to the front desk); FD+ are pointed to "Ghi tiền về sau khi hủy"
 * (V5-5B 5B-1, on the booking). Null: not this error.
 */
export function closedBookingPaymentText(t: T, error: unknown, salesOnly: boolean): string | null {
  const closed = closedReservationStatus(error);
  return closed ? closedBookingSentence(t, closed, salesOnly) : null;
}

/** The UXD 9.1a sentence for a booking known to be closed (`status`); see `closedBookingPaymentText`. */
export function closedBookingSentence(
  t: T,
  status: 'cancelled' | 'no_show',
  salesOnly: boolean,
): string {
  const a = { status: t(STATUS_KEY[status]) };
  return t(salesOnly ? 'error.closed_booking_payment_sales' : 'error.closed_booking_payment', a);
}

/** Night list of a conflict → `from` = first night, `to` = morning after the last night. */
function rangeOf(c: RoomConflict | undefined) {
  const nights = [...(c?.nights ?? [])].sort();
  if (!nights.length) return { from: '', to: '' };
  return { from: formatLocalDate(nights[0]), to: formatLocalDate(addDays(nights.at(-1)!, 1)) };
}

export interface RsvErrorContext {
  /** V5-48 (UXD 9.1a): SAL/CTV with no FD+ role – the closed-booking sentence for sales (`closedBookingPaymentText`). */
  salesOnly?: boolean;
  locale?: 'vi' | 'en';
  roomNo?: string;
  /** Current status (for INVALID_TRANSITION – after a reload). */
  status?: ReservationStatus;
  /** Values the client knows for DEPOSIT_INSUFFICIENT when the problem has no `required`/`paid`. */
  required?: number;
  paid?: number;
  /** FD+ may see the occupying guest's name (booking.error.conflict); others get the no-name form. */
  canSeeGuest?: boolean;
  /**
   * v1.0.4 BUG-R3-044 (2): deposit already received on the hold (`Reservation.depositPaidVnd`). > 0 → the
   * `HOLD_EXPIRED` sentence for a hold WITH money (the booking is not cancelled, the room is still held) – never
   * "the room is back on sale". The Desk knows the amount, so no new Problem extra is needed (ARC tech plan 4).
   */
  holdPaidVnd?: number;
  /** The hold's deadline (`Reservation.hold.expiresAt`) – the `{time}` of `HOLD_EXPIRED_PAID` when the Problem has no `expiredAt`. */
  holdExpiresAt?: string;
}

/**
 * Request-level message for EP02 problems with the arguments the UXD strings need (room, dates, max,
 * amounts, status). Problem extension fields follow OpenAPI 0.3.5 §3.1 (`currentState`,
 * `depositRequiredVnd`/`depositPaidVnd`, `roomNo`, `max`, `expiredAt`). Anything else → `problemView`.
 */
export function rsvErrorText(t: T, error: unknown, ctx: RsvErrorContext = {}): string {
  if (!isApiError(error)) return problemView(t, error).text;
  const p = error.problem as Record<string, unknown>;
  const locale = ctx.locale ?? 'vi';
  const vnd = (n: unknown) => formatNumber(locale, Number(n ?? 0));
  const first = conflictsOf(error)[0];
  const room = (p.roomNo as string | undefined) ?? first?.roomNo ?? ctx.roomNo ?? '';
  switch (error.code) {
    case 'ROOM_UNAVAILABLE': {
      const r = rangeOf(first);
      if (ctx.canSeeGuest && first?.guestDisplayName)
        return t('booking.error.conflict', { room, guest: first.guestDisplayName, ...r });
      return t('booking.error.conflict_noname', { room, ...r });
    }
    case 'ROOM_OCCUPIED':
      return t('error.ROOM_OCCUPIED', { room });
    case 'VALIDATION_FAILED': {
      // First field error with the Problem extras as arguments (e.g. HOLD_LIMIT_REACHED {max}).
      const fe = error.fieldErrors[0];
      return fe
        ? fieldErrorText(t, fe, { max: String(p.max ?? ''), n: String(p.minStayNights ?? '') })
        : problemView(t, error).text;
    }
    case 'ROOM_BLOCKED':
      return t('error.ROOM_BLOCKED', { room, ...rangeOf(first) });
    case 'ROOM_NOT_SELLABLE':
      return t('error.ROOM_NOT_SELLABLE', { room });
    case 'CAPACITY_EXCEEDED':
      return t('error.CAPACITY_EXCEEDED', { room, max: String(p.max ?? '') });
    case 'DEPOSIT_INSUFFICIENT':
      return t('error.DEPOSIT_INSUFFICIENT', {
        required: vnd(p.depositRequiredVnd ?? ctx.required),
        paid: vnd(p.depositPaidVnd ?? ctx.paid),
      });
    case 'INVALID_TRANSITION': {
      const closed = closedBookingPaymentText(t, error, ctx.salesOnly === true);
      if (closed) return closed;
      const st = (p.currentState as ReservationStatus | undefined) ?? ctx.status;
      return st && STATUS_KEY[st]
        ? t('rsv.transition_changed', { status: t(STATUS_KEY[st]) })
        : t('rsv.transition_changed_unknown');
    }
    case 'ROOM_NOT_READY': {
      const st = typeof p.roomStatus === 'string' ? p.roomStatus : '';
      return t('error.ROOM_NOT_READY', { room, status: st ? t(`status.room.${st}`) : '' });
    }
    case 'LATE_CHECKOUT_CONFLICT':
      return t('error.LATE_CHECKOUT_CONFLICT', {
        room,
        guest: String(p.guest ?? p.guestDisplayName ?? ''),
        eta: String(p.eta ?? p.etaTime ?? ''),
      });
    case 'HOLD_EXPIRED':
      if ((ctx.holdPaidVnd ?? 0) > 0) {
        // FB-R4-UXD-FE-P440-02: no `_notime` variant – without `expiredAt` the booking's own deadline is the time.
        const at = typeof p.expiredAt === 'string' ? p.expiredAt : ctx.holdExpiresAt;
        return t('error.HOLD_EXPIRED_PAID', {
          time: at ? formatInstant(locale, at) : '',
          // UXD key note: `{paid}` is money with its unit ("200.000 đ").
          paid: t('common.currency_vnd', { amount: vnd(ctx.holdPaidVnd) }),
        });
      }
      return typeof p.expiredAt === 'string'
        ? t('error.HOLD_EXPIRED', { time: formatInstant(locale, p.expiredAt) })
        : t('error.HOLD_EXPIRED_notime');
    default:
      return problemView(t, error).text;
  }
}

/** Status of a 409 INVALID_TRANSITION (0.3.5 `currentState`, always present). */
export function currentStateOf(e: unknown): ReservationStatus | undefined {
  const p = problemOf(e) as Record<string, unknown> | undefined;
  const s = p?.currentState;
  return typeof s === 'string' && s in STATUS_KEY ? (s as ReservationStatus) : undefined;
}

/**
 * v1.0.4 BUG-R3-042: `<input type="datetime-local">` value (`YYYY-MM-DDTHH:mm`) of an instant in the property
 * time zone (the desk types the time the money arrived on the hotel's wall clock, never the browser's).
 */
export function toLocalInput(d: Date, timeZone = 'Asia/Ho_Chi_Minh'): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/**
 * The zoned ISO instant (`…+07:00`, as in the `confirmDeposit` example) of a `datetime-local` value read in the
 * property zone – OTTIMO is Asia/Ho_Chi_Minh (+07:00, no DST), the offset ExtendHoldDialog uses too. Bad → null.
 */
export function fromLocalInput(v: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const iso = `${v}:00+07:00`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}
