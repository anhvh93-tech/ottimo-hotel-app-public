/**
 * FB-INV-012: the long stay a meter reading / monthly statement belongs to, read straight from the reservation tables
 * (read-only, same property through RLS – the billing module never writes them). Contract mục 5: a booking that is not a
 * long stay with a monthly rent (`stay_type='long'`, `manual_long_stay.monthly_rent_vnd`) → 422 NOT_LONG_STAY.
 */
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { type LocalDate, addDays } from '../../../shared/time';
import { optionalText } from '../../../shared/validation';
import { looksLikeIdNumber } from '../../../shared/sensitive-number';

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Contract mục 4: exceptions, photo waiver, prior adjustment, void of an issued statement – FDL+. */
export const FDL_PLUS: readonly string[] = ['owner', 'manager', 'front_desk_lead'];
export const isFdlPlus = (roles: readonly string[]): boolean =>
  roles.some((r) => FDL_PLUS.includes(r));

export interface BillingActor {
  userId: string;
  roles: readonly string[];
  requestId?: string;
}

export interface Segment {
  roomId: string;
  roomNo: string;
  from: LocalDate;
  /** Exclusive (night of `to` not included). */
  to: LocalDate;
}

export interface LongStay {
  id: string;
  code: string;
  status: string;
  folioId: string;
  arrival: LocalDate;
  departure: LocalDate;
  lastNight: LocalDate;
  monthlyRentVnd: number;
  guestFullName: string | null;
  segments: Segment[];
}

export async function loadLongStay(
  tx: Tx,
  reservationId: string,
  opts: { lock?: boolean } = {},
): Promise<LongStay> {
  if (!UUID.test(reservationId)) throw problem('NOT_FOUND');
  const { rows } = await tx.query<{
    id: string;
    code: string;
    status: string;
    stay_type: string;
    folio_id: string;
    arrival_date: string;
    departure_date: string;
    rent: string | null;
    full_name: string | null;
  }>(
    `SELECT r.id, r.code, r.status, r.stay_type, r.folio_id, r.arrival_date::text, r.departure_date::text,
            r.manual_long_stay->>'monthly_rent_vnd' AS rent, g.full_name
       FROM reservation r LEFT JOIN guest g ON g.id = r.booker_guest_id
      WHERE r.id = $1${opts.lock ? ' FOR KEY SHARE OF r' : ''}`,
    [reservationId],
  );
  const r = rows[0];
  if (!r) throw problem('NOT_FOUND');
  const rent = r.rent === null ? NaN : Number(r.rent);
  if (r.stay_type !== 'long' || !Number.isSafeInteger(rent) || rent <= 0)
    throw problem('NOT_LONG_STAY');
  const seg = await tx.query<{
    room_id: string;
    room_no: string;
    from_date: string;
    to_date: string;
  }>(
    `SELECT s.room_id, rm.room_no, s.from_date::text, s.to_date::text
       FROM reservation_segment s JOIN room rm ON rm.id = s.room_id
      WHERE s.reservation_id = $1 AND s.active AND s.room_id IS NOT NULL
      ORDER BY s.from_date, s.id`,
    [reservationId],
  );
  return {
    id: r.id,
    code: r.code,
    status: r.status,
    folioId: r.folio_id,
    arrival: r.arrival_date,
    departure: r.departure_date,
    lastNight: addDays(r.departure_date, -1),
    monthlyRentVnd: rent,
    guestFullName: r.full_name,
    segments: seg.rows.map((s) => ({
      roomId: s.room_id,
      roomNo: s.room_no,
      from: s.from_date,
      to: s.to_date,
    })),
  };
}

/** Optional free text 3–300 (note, reason) – card numbers (422 CARD_NUMBER_DETECTED) and ID numbers refused. */
export function freeText(
  field: string,
  value: unknown,
  opts: { required?: boolean; min?: number; max?: number } = {},
): string | null {
  const max = opts.max ?? 300;
  const text = optionalText(field, value, max);
  if (text === null) {
    if (opts.required)
      throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'REASON_REQUIRED' }] });
    return null;
  }
  const collapsed = text.replace(/\s+/g, ' ');
  if (collapsed.length < (opts.min ?? 3)) {
    throw problem('VALIDATION_FAILED', {
      errors: [{ field, code: opts.required ? 'REASON_REQUIRED' : 'TOO_SHORT' }],
    });
  }
  if (looksLikeIdNumber(collapsed)) {
    throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'ID_NUMBER_DETECTED' }] });
  }
  return collapsed;
}

export function obj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

export const isLocalDate = (v: unknown): v is LocalDate =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) &&
  new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

/** A Postgres unique violation on `constraint`. */
export function isUniqueViolation(err: unknown, constraint: string): boolean {
  const e = err as { code?: string; constraint?: string } | null;
  return !!e && e.code === '23505' && e.constraint === constraint;
}
