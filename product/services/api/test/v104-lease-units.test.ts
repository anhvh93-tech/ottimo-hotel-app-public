/**
 * v1.0.4 P4-11 (BE-C) – pure parts, no DB:
 * - `manualLongStay.leaseEndDate` read order (ARC plan v1.0.4 decision 6.1) and the DTO field;
 * - B16 rule BR-313 vs BR-428 by the lease end (DOM FB-R4-DOM-FE-A-01 rest, FB-R4-DOM-BE-A-04);
 * - If-Match with a content-coding suffix (`"6-gzip"`, decision 6.2 / V3-09).
 * Fake data only.
 */
import { describe, expect, it } from 'vitest';
import { earlyDepartureRuleOf } from '../src/modules/frontdesk/public/stay-rules';
import { toReservationDto } from '../src/modules/reservations/internal/reservation-dto';
import type { ReservationRow } from '../src/modules/reservations/internal/reservation-store';
import {
  LEASE_END_DATE_KEY,
  type LeaseEndSource,
  leaseEndDateOf,
} from '../src/modules/reservations/public/lease-end';
import { parseEntityTag } from '../src/shared/http/precondition';

const CHECKED_IN = new Date('2026-12-01T08:00:00Z');

/** HĐ 3 tháng căn 101 (DOM FB-R4-DOM-FE-A-01): vào 20/11/2026, kết thúc 20/02/2027, gia hạn B13 tới 27/02. */
const lease = (over: Partial<LeaseEndSource> = {}): LeaseEndSource => ({
  stay_type: 'long',
  external_contract: true,
  manual_long_stay: { monthly_rent_vnd: 8_500_000 },
  actual_checkin_at: null,
  departure_date: '2027-02-20',
  booked_departure_date: '2027-02-20',
  ...over,
});

describe('leaseEndDateOf – ARC plan v1.0.4 decision 6.1', () => {
  it('the key written at check-in wins over departure_date (B13 moved it to 27/02)', () => {
    expect(
      leaseEndDateOf(
        lease({
          manual_long_stay: { monthly_rent_vnd: 8_500_000, [LEASE_END_DATE_KEY]: '2027-02-20' },
          actual_checkin_at: CHECKED_IN,
          departure_date: '2027-02-27',
        }),
      ),
    ).toBe('2027-02-20');
  });

  it('not checked in yet → departure_date (a PATCH before check-in changes the lease)', () => {
    expect(
      leaseEndDateOf(lease({ departure_date: '2027-03-20', booked_departure_date: '2027-02-20' })),
    ).toBe('2027-03-20');
  });

  it('checked in before v1.0.4 (no key) → booked_departure_date, not the B13-moved departure', () => {
    expect(
      leaseEndDateOf(lease({ actual_checkin_at: CHECKED_IN, departure_date: '2027-02-27' })),
    ).toBe('2027-02-20');
  });

  it('checked in, no key, no booked date → departure_date', () => {
    expect(
      leaseEndDateOf(
        lease({
          actual_checkin_at: CHECKED_IN,
          departure_date: '2027-02-27',
          booked_departure_date: null,
        }),
      ),
    ).toBe('2027-02-27');
  });

  it('a malformed stored key is ignored (falls back as if absent)', () => {
    expect(
      leaseEndDateOf(
        lease({
          manual_long_stay: { monthly_rent_vnd: 8_500_000, [LEASE_END_DATE_KEY]: '20/02/2027' },
          actual_checkin_at: CHECKED_IN,
          departure_date: '2027-02-27',
        }),
      ),
    ).toBe('2027-02-20');
  });

  it('null for a short stay, a long stay without manual data, or no external contract', () => {
    expect(leaseEndDateOf(lease({ stay_type: 'short' }))).toBeNull();
    expect(leaseEndDateOf(lease({ manual_long_stay: null }))).toBeNull();
    expect(leaseEndDateOf(lease({ external_contract: false }))).toBeNull();
  });
});

describe('earlyDepartureRuleOf – B16 BR-313 vs BR-428 (FB-R4-DOM-BE-A-04)', () => {
  const inHouse = lease({
    manual_long_stay: { monthly_rent_vnd: 8_500_000, [LEASE_END_DATE_KEY]: '2027-02-20' },
    actual_checkin_at: CHECKED_IN,
    departure_date: '2027-02-27',
  });

  it('HĐ đã gia hạn, rời trước ngày kết thúc HĐ (10/02) → BR-313', () => {
    expect(earlyDepartureRuleOf(inHouse, '2027-02-10')).toEqual({
      rule: 'BR-313',
      leaseEndDate: '2027-02-20',
    });
  });

  it('HĐ đã gia hạn, rời trong phần gia hạn (24/02) → BR-428 (đã ở đủ HĐ)', () => {
    expect(earlyDepartureRuleOf(inHouse, '2027-02-24')).toEqual({
      rule: 'BR-428',
      leaseEndDate: '2027-02-20',
    });
  });

  it('rời đúng ngày kết thúc HĐ → BR-428 (không vi phạm)', () => {
    expect(earlyDepartureRuleOf(inHouse, '2027-02-20').rule).toBe('BR-428');
  });

  it('short stay → BR-428, no lease end', () => {
    expect(earlyDepartureRuleOf(lease({ stay_type: 'short' }), '2027-02-10')).toEqual({
      rule: 'BR-428',
      leaseEndDate: null,
    });
  });
});

describe('toReservationDto – manualLongStay.leaseEndDate', () => {
  const row = (over: Partial<ReservationRow>): ReservationRow =>
    ({
      id: 'r1',
      code: 'OTM-00001',
      status: 'in_house',
      stay_type: 'long',
      channel_group: 'direct',
      external_contract: true,
      manual_long_stay: {
        monthly_rent_vnd: 8_500_000,
        deposit_held_vnd: 8_500_000,
        [LEASE_END_DATE_KEY]: '2027-02-20',
      },
      arrival_date: '2026-11-20',
      departure_date: '2027-02-27',
      booked_departure_date: '2027-02-20',
      actual_checkin_at: CHECKED_IN,
      adults: 1,
      children_6_11: 0,
      children_under_6: 0,
      pricing_snapshot: {},
      version: 3,
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

  it('in house after B13: leaseEndDate = the frozen date, departureDate = the extension end', () => {
    const d = dto(row({}));
    expect(d.manualLongStay).toEqual({
      monthlyRentVnd: 8_500_000,
      depositHeldVnd: 8_500_000,
      leaseEndDate: '2027-02-20',
    });
    expect(d.departureDate).toBe('2027-02-27');
  });

  it('confirmed (not checked in): leaseEndDate = departureDate', () => {
    const d = dto(
      row({
        status: 'confirmed',
        actual_checkin_at: null,
        manual_long_stay: { monthly_rent_vnd: 8_500_000 },
        departure_date: '2027-03-20',
      }),
    );
    expect(d.manualLongStay).toEqual({ monthlyRentVnd: 8_500_000, leaseEndDate: '2027-03-20' });
  });

  it('the internal jsonb key never leaks under its own name', () => {
    expect(JSON.stringify(dto(row({})))).not.toContain(LEASE_END_DATE_KEY);
  });

  it('a short stay has no manualLongStay', () => {
    expect(
      dto(row({ stay_type: 'short', external_contract: false, manual_long_stay: null })),
    ).not.toHaveProperty('manualLongStay');
  });
});

describe('parseEntityTag – If-Match with a content-coding suffix (V3-09, plan v1.0.4 6.2)', () => {
  it.each([
    ['"6"', 6],
    ['W/"6"', 6],
    ['6', 6],
    ['"6-gzip"', 6],
    ['"6-zstd"', 6],
    ['"6-br"', 6],
    ['W/"6-gzip"', 6],
    [' "12-br" ', 12],
  ])('%s → %s', (raw, v) => {
    expect(parseEntityTag(raw)).toBe(v);
  });

  it.each([
    '*',
    '"6", "7"',
    '"6-deflate"',
    '"6-gzip-br"',
    '"6-"',
    '"-gzip"',
    '"6-gzip',
    '6-gzip"',
    // FB-R4-ARC-BE-C-P411-03: the coding suffix is read only inside quotes.
    '6-gzip',
    'W/6-br',
    '"abc"',
    '"1234567890"',
  ])('%s → null', (raw) => {
    expect(parseEntityTag(raw)).toBeNull();
  });
});
