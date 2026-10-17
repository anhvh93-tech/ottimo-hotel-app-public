/**
 * Read-only view of the booking that the registration and guest-portal modules need (code, dates, persons,
 * booker name, room, actual times) – through BE-A's port `reservations/public/stay-view.ts` (ARC 4.3): this
 * module never reads the reservations tables itself. `actor` is the session's (SEC H2: SAL/CTV only their
 * own bookings); jobs and the guest session (bound to its booking by the token) pass SYSTEM_ACTOR
 * EXPLICITLY – no default (SEC-BE-52 (2): a new call never falls back to the system scope silently).
 */
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';
import {
  type StayViewRow,
  activeRootBookings,
  stayView,
  stayViews,
} from '../../reservations/public/stay-view';

export interface StayView {
  reservationId: string;
  code: string;
  status: 'hold' | 'confirmed' | 'in_house' | 'checked_out' | 'cancelled' | 'no_show';
  stayType: 'short' | 'long';
  arrivalDate: LocalDate;
  departureDate: LocalDate;
  /** BR-601/608: everyone to declare, children under 6 included. */
  personsTotal: number;
  bookerName: string;
  bookerFirstName: string;
  preferredLocale: string | null;
  roomNo: string | null;
  actualCheckinAt: Date | null;
  actualCheckoutAt: Date | null;
  /** When the booking was cancelled / marked no-show (J16 end-of-stay mark – BE-C, re-verification 17/10). */
  cancelledAt: Date | null;
  noShowMarkedAt: Date | null;
  /** Latest departure of the booking and its open children (B9a, OTA extension) – see StayViewRow. */
  effectiveDepartureDate: LocalDate;
  parentReservationId: string | null;
}

export { SYSTEM_ACTOR } from '../../reservations/public/stay-view';

export interface StayActor {
  userId: string;
  roles: readonly string[];
}

function toView(r: StayViewRow): StayView {
  const words = r.bookerName.trim().split(/\s+/);
  return {
    reservationId: r.reservationId,
    code: r.code,
    status: r.status,
    stayType: r.stayType,
    arrivalDate: r.arrivalDate,
    departureDate: r.departureDate,
    personsTotal: r.personsTotal,
    bookerName: r.bookerName,
    // Vietnamese order puts the given name last ("Nguyễn Văn An" → "An"); a foreign "Daniel Weber" keeps
    // the first word. Vietnamese = letters that only Vietnamese uses (ă â đ ê ô ơ ư, tone marks
    // U+1EA0–U+1EF9). Display only (guest-web greeting, D01 at level 1 – ĐK-2).
    bookerFirstName:
      words.length > 1 && /[ăâđêôơưĂÂĐÊÔƠƯ\u1ea0-\u1ef9]/.test(r.bookerName)
        ? (words.at(-1) ?? '')
        : (words[0] ?? ''),
    preferredLocale: r.bookerPreferredLocale,
    roomNo: r.roomNo,
    actualCheckinAt: r.actualCheckinAt,
    actualCheckoutAt: r.actualCheckoutAt,
    cancelledAt: r.cancelledAt,
    noShowMarkedAt: r.noShowMarkedAt,
    effectiveDepartureDate: r.effectiveDepartureDate,
    parentReservationId: r.parentReservationId,
  };
}

export async function readStay(
  tx: Tx,
  reservationId: string,
  actor: StayActor,
): Promise<StayView | null> {
  const v = await stayView(tx, reservationId, actor);
  return v ? toView(v) : null;
}

export async function readStays(
  tx: Tx,
  ids: readonly string[],
  actor: StayActor,
): Promise<Map<string, StayView>> {
  const views = await stayViews(tx, ids, actor);
  return new Map([...views].map(([id, v]) => [id, toView(v)]));
}

/** Root bookings without a registration yet (created before the module, or by a path without hooks). */
export async function bookingsWithoutRegistration(
  tx: Tx,
): Promise<Array<{ id: string; persons: number }>> {
  const open = await activeRootBookings(tx);
  if (open.length === 0) return [];
  const { rows } = await tx.query<{ reservation_id: string }>(
    'SELECT reservation_id FROM registration WHERE reservation_id = ANY($1::uuid[])',
    [open.map((b) => b.id)],
  );
  const have = new Set(rows.map((r) => r.reservation_id));
  return open.filter((b) => !have.has(b.id)).slice(0, 200);
}
