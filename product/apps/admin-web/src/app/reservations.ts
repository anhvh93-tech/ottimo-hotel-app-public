import {
  isApiError,
  type Channel,
  type ReservationStatus,
  type RoomConflict,
  type RoomSuggestion,
} from '@ottimo/api-client';
import { formatLocalDate, formatNumber, type Args } from '@ottimo/i18n';
import { problemView } from './problem';

type T = (key: string, args?: Args) => string;

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

/** Night list of a conflict → `from` = first night, `to` = morning after the last night. */
function rangeOf(c: RoomConflict | undefined) {
  const nights = [...(c?.nights ?? [])].sort();
  if (!nights.length) return { from: '', to: '' };
  return { from: formatLocalDate(nights[0]), to: formatLocalDate(addDays(nights.at(-1)!, 1)) };
}

export interface RsvErrorContext {
  locale?: 'vi' | 'en';
  roomNo?: string;
  /** Current status (for INVALID_TRANSITION – after a reload). */
  status?: ReservationStatus;
  /** Values the client knows for DEPOSIT_INSUFFICIENT when the problem has no `required`/`paid`. */
  required?: number;
  paid?: number;
  /** FD+ may see the occupying guest's name (booking.error.conflict); others get the no-name form. */
  canSeeGuest?: boolean;
}

/**
 * Request-level message for EP02 problems with the arguments the UXD strings need
 * (room, dates, max, amounts, status). Anything else → the generic `problemView`.
 */
export function rsvErrorText(t: T, error: unknown, ctx: RsvErrorContext = {}): string {
  if (!isApiError(error)) return problemView(t, error).text;
  const p = error.problem as Record<string, unknown>;
  const vnd = (n: unknown) => formatNumber(ctx.locale ?? 'vi', Number(n ?? 0));
  const first = conflictsOf(error)[0];
  const room = first?.roomNo ?? ctx.roomNo ?? '';
  switch (error.code) {
    case 'ROOM_UNAVAILABLE': {
      const r = rangeOf(first);
      if (ctx.canSeeGuest && first?.guestDisplayName)
        return t('booking.error.conflict', { room, guest: first.guestDisplayName, ...r });
      return t('booking.error.conflict_noname', { room, ...r });
    }
    case 'ROOM_BLOCKED':
      return t('error.ROOM_BLOCKED', { room, ...rangeOf(first) });
    case 'ROOM_NOT_SELLABLE':
      return t('error.ROOM_NOT_SELLABLE', { room });
    case 'CAPACITY_EXCEEDED':
      return t('error.CAPACITY_EXCEEDED', { room, max: String(p.max ?? '') });
    case 'DEPOSIT_INSUFFICIENT':
      return t('error.DEPOSIT_INSUFFICIENT', {
        required: vnd(p.required ?? ctx.required),
        paid: vnd(p.paid ?? ctx.paid),
      });
    case 'INVALID_TRANSITION': {
      const st = (p.currentStatus as ReservationStatus | undefined) ?? ctx.status;
      return t('error.INVALID_TRANSITION', { status: st ? t(STATUS_KEY[st]) : '' });
    }
    case 'HOLD_EXPIRED':
      return t('error.HOLD_EXPIRED', { time: String(p.expiredAt ?? '') });
    default:
      return problemView(t, error).text;
  }
}

/** "Ngày đến – ngày đi" → one label per date input (UXD has no separate keys yet – requested). */
export function dateLabels(t: T): { arrival: string; departure: string } {
  const [arrival = '', departure = ''] = t('booking.field.dates').split(/\s+[–-]\s+/);
  return { arrival, departure: departure.charAt(0).toUpperCase() + departure.slice(1) };
}
