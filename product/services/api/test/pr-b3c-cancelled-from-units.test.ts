/**
 * PR-B3c (Round 5, v1.0.5, BE-D2) – contract 0.3.13 bổ sung 1j, DOM FB-R5-DOM-ARC-148-02 (ARC review #148 mục 5):
 * `Reservation.cancellation.cancelledFrom` – pure parts, no DB:
 * - the DTO: `hold` | `confirmed` from `status_before_cancel` inside `cancellation`; absent while the booking is not
 *   cancelled; a `no_show` has no `cancellation`; any other stored value → the key is absent (never null);
 * - the role serializer (x-visible-to FD+): OWN, MGR, FDL, FD see it; SAL and CTV keep `cancellation` without it –
 *   on `getReservation` and on the `changeRoom` copy of the schema.
 * Fake data only.
 */
import { describe, expect, it } from 'vitest';
import { toReservationDto } from '../src/modules/reservations/internal/reservation-dto';
import type { ReservationRow } from '../src/modules/reservations/internal/reservation-store';
import { serializeResponse, serializeSchema } from '../src/shared/serialization/serializer';

const CANCELLED_AT = new Date('2026-11-21T03:01:00Z');

const row = (over: Partial<ReservationRow>): ReservationRow =>
  ({
    id: '01890000-0000-7000-8000-0000000000b3',
    code: 'OTM-00042',
    status: 'cancelled',
    stay_type: 'short',
    channel_id: '01890000-0000-7000-8000-0000000000c1',
    channel_code: 'direct',
    channel_group: 'direct',
    payment_model: 'direct',
    external_contract: false,
    manual_long_stay: null,
    arrival_date: '2026-12-20',
    departure_date: '2026-12-22',
    adults: 2,
    children_6_11: 0,
    children_under_6: 0,
    pricing_snapshot: {},
    cancelled_at: CANCELLED_AT,
    cancel_reason_code: 'hold_expired',
    cancel_note: null,
    status_before_cancel: 'hold',
    conflict_state: 'none',
    capacity_conflict_at: null,
    room_disclosed_to_guest: false,
    cards_issued: null,
    house_rules_sent_at: null,
    hold_created_at: null,
    confirmed_at: null,
    actual_checkin_at: null,
    actual_checkout_at: null,
    deposit_required_vnd: 0,
    total_room_vnd: 0,
    version: 4,
    ...over,
  }) as unknown as ReservationRow;

const dto = (r: ReservationRow) =>
  toReservationDto({
    row: r,
    segments: [],
    booker: null,
    nights: [],
    actions: [],
    iso: (i) => i.toISOString(),
    noShowAvailableFrom: null,
    depositPaidVnd: 0,
  });

const FD_PLUS = [['owner'], ['manager'], ['front_desk_lead'], ['front_desk']];
const SALES = [['sales_staff'], ['collaborator']];

describe('toReservationDto – cancellation.cancelledFrom (1j, DOM 148-02)', () => {
  it('cancelled while a hold (J1) → cancelledFrom hold, next to cancelledAt and reasonCode', () => {
    expect(dto(row({})).cancellation).toEqual({
      cancelledAt: CANCELLED_AT.toISOString(),
      reasonCode: 'hold_expired',
      cancelledFrom: 'hold',
    });
  });

  it('a confirmed booking cancelled → cancelledFrom confirmed', () => {
    expect(
      dto(row({ status_before_cancel: 'confirmed', cancel_reason_code: 'ota_cancelled' }))
        .cancellation,
    ).toEqual({
      cancelledAt: CANCELLED_AT.toISOString(),
      reasonCode: 'ota_cancelled',
      cancelledFrom: 'confirmed',
    });
  });

  it('a no-show (status_before_cancel confirmed) has no cancellation at all', () => {
    const d = dto(
      row({ status: 'no_show', status_before_cancel: 'confirmed', cancelled_at: null }),
    );
    expect(d).not.toHaveProperty('cancellation');
    expect(JSON.stringify(d)).not.toContain('cancelledFrom');
  });

  it('a booking not cancelled has no cancellation (also with a stale column value)', () => {
    for (const status of ['hold', 'confirmed', 'in_house', 'checked_out'] as const) {
      expect(
        dto(row({ status, status_before_cancel: 'hold', cancelled_at: null })),
      ).not.toHaveProperty('cancellation');
    }
  });

  it('any other stored value → the key is absent, never null', () => {
    for (const s of [null, 'in_house', 'HOLD', '']) {
      const c = dto(row({ status_before_cancel: s })).cancellation as Record<string, unknown>;
      expect(c).toMatchObject({ cancelledAt: CANCELLED_AT.toISOString() });
      expect(c).not.toHaveProperty('cancelledFrom');
    }
  });
});

describe('role serializer – cancelledFrom is FD+ only (x-visible-to)', () => {
  const body = dto(row({}));

  const getAs = (role: string) =>
    (serializeResponse('getReservation', 200, body, { roles: [role] }) as { cancellation: unknown })
      .cancellation;

  it.each(FD_PLUS)('getReservation as %s → cancelledFrom kept', (role) => {
    expect(getAs(role!)).toEqual({
      cancelledAt: CANCELLED_AT.toISOString(),
      reasonCode: 'hold_expired',
      cancelledFrom: 'hold',
    });
  });

  it.each(SALES)('getReservation as %s → cancellation kept, cancelledFrom dropped', (role) => {
    expect(getAs(role!)).toEqual({
      cancelledAt: CANCELLED_AT.toISOString(),
      reasonCode: 'hold_expired',
    });
  });

  it('the Reservation schema (SSE / outbox payloads) follows the same rule', () => {
    const as = (roles: string[]) =>
      (serializeSchema('Reservation', body, { roles }) as { cancellation: unknown }).cancellation;
    expect(as(['front_desk'])).toMatchObject({ cancelledFrom: 'hold' });
    expect(as(['sales_staff'])).not.toHaveProperty('cancelledFrom');
    expect(as(['collaborator'])).not.toHaveProperty('cancelledFrom');
    expect(as([])).not.toHaveProperty('cancelledFrom');
  });

  it('the changeRoom answer (an inline copy of Reservation) carries the same FD+ rule', () => {
    const as = (roles: string[]) =>
      (serializeResponse('changeRoom', 200, body, { roles }) as { cancellation: unknown })
        .cancellation;
    expect(as(['front_desk'])).toMatchObject({ cancelledFrom: 'hold' });
    expect(as(['sales_staff'])).not.toHaveProperty('cancelledFrom');
  });
});
