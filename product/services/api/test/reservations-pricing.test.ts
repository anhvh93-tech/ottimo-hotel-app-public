/**
 * Booking rules replayed against QA's oracle product/tests/fixtures/br-examples.json (coding-standards 10.2:
 * every BR number example is a golden test). Pure functions of reservations/public/pricing.ts and
 * PricingService.price() with the DS-E parameters – and, per row, the row's own `params` on top (v1.0.4 P4-11,
 * FB-R4-QA-DOM-PR25-01 (a)): the rows of the 01/11 price table run through the same engine with their values.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { divideRoundVnd, roundVnd } from '../src/modules/platform/public/money';
import {
  applyNightDiscount,
  calendarRate,
  countedPersons,
  directCancelRefund,
  extraGuestKitDue,
  extraPersons,
  holdDeadline,
  holdExtension,
  isOrphanGap,
  lastBookableArrival,
  losDiscountPct,
  minStayNights,
  nightDates,
  nightsOf,
  noticeDays,
  orphanNightsLeft,
  rangesOverlap,
  rateBounds,
  shortDeposit,
  splitEvenly,
} from '../src/modules/reservations/public/pricing';
import {
  type PricingParams,
  PricingService,
} from '../src/modules/reservations/public/pricing.service';
import { mergeRanges } from '../src/modules/reservations/internal/rack.service';
import { allowedActions } from '../src/modules/reservations/internal/allowed-actions';
import { addMonths } from '../src/modules/reservations/internal/reservations.service';
import { businessDate } from '../src/shared/time';

interface Example {
  id: string;
  br: string;
  calc: string | null;
  /** Parameters the example was worked with (BR mục 13 keys) – overlay DS-E (FB-R4-QA-DOM-PR25-01 (a)). */
  params?: Record<string, unknown>;
  pendingFix?: string;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
}

const oracle = JSON.parse(
  readFileSync(join(__dirname, '../../../tests/fixtures/br-examples.json'), 'utf8'),
) as { examples: Example[] };
const ds = JSON.parse(
  readFileSync(join(__dirname, '../../../tests/fixtures/seed/ds-e.json'), 'utf8'),
) as {
  parameters: Array<{ param: string; value: unknown }>;
  rooms: Array<{
    roomNo: string;
    baseOccupancy: number;
    maxOccupancy: number;
    monthlyListPriceVnd: number;
  }>;
};
const PARAMS = new Map(ds.parameters.map((x) => [x.param, x.value]));
const ROOMS = Object.fromEntries(ds.rooms.map((r) => [r.roomNo, r]));
const TZ = 'Asia/Ho_Chi_Minh';

/**
 * v1.0.4 P4-11 – FB-R4-QA-DOM-PR25-01 (a): DS-E parameters with the example's `params` on top, so a row worked with
 * the 01/11 price table (`weekend_uplift_pct` 0, `los_discount` [], `child_fee_6_11` 150.000, 30-night mark…) is
 * recomputed with THOSE values, not with DS-E. Keys:
 * - a BR mục 13 parameter key → replaces the DS-E value;
 * - `special_dates_added` → appended to `special_dates` (same `from` not repeated);
 * - `room.<no>.base_occupancy` / `room.<no>.max_occupancy` → the room (see `roomOf`), not a parameter.
 * A row without `params` = DS-E (the price table before the switch date S).
 */
function paramMap(e?: Example): Map<string, unknown> {
  const m = new Map(PARAMS);
  for (const [k, v] of Object.entries(e?.params ?? {})) {
    if (k.startsWith('room.')) continue;
    if (k === 'special_dates_added') {
      const cur = (m.get('special_dates') as Array<{ from: string }> | undefined) ?? [];
      const add = (v as Array<{ from: string }>).filter((x) => !cur.some((c) => c.from === x.from));
      m.set('special_dates', [...cur, ...add]);
      continue;
    }
    m.set(k, v);
  }
  return m;
}

function pricingParams(m: Map<string, unknown>): PricingParams {
  const p = <T = never>(key: string): T => m.get(key) as T;
  return {
    asOf: '2026-10-15',
    // BR-103 OTA base per group (DS-E roomGroups.otaBaseRateVnd – `ota_base_rate`, ARC s2-contract 8.1).
    otaBaseRates: { L12: 760_000, N: 1_050_000, NPLUS: 980_000 },
    nightRateUnit: p('rounding.night_rate'),
    otaRateUnit: p('rounding.monthly_rent'),
    depositUnit: p('rounding.deposit'),
    feeUnit: p('rounding.fee'),
    calendar: {
      weekendNights: p('weekend_nights'),
      weekendUpliftPct: p('weekend_uplift_pct'),
      weekendChannels: p('weekend_uplift_channels'),
      specialDates: p('special_dates'),
      specialUpliftPct: p('special_uplift_pct'),
      specialChannels: p('special_uplift_channels'),
    },
    losTiers: p('los_discount'),
    extraAdultFeeVnd: p('extra_adult_fee'),
    child611FeeVnd: p('child_fee_6_11'),
    depositPct: p('short_stay_deposit_pct'),
    rateFloorPct: p('rate_floor_pct'),
    rateCeilingPct: p('rate_ceiling_pct'),
    minStay: p('min_stay'),
    minStayOrphanException: p('min_stay_orphan_night_exception'),
    bookingWindowDays: p('booking_window_days'),
    shortStayMaxNights: p('short_stay_max_nights'),
    longStayRequiredFromNights: p('long_stay_required_from_nights'),
    cancelPolicy: p('cancel_policy_direct'),
    cancelPeakNoRefund: p('cancel_peak_no_refund'),
    rescheduleWindowMonths: p('reschedule_window_months'),
    rescheduleMaxTimes: p('reschedule_max_times'),
    checkinTime: p('checkin_time'),
  };
}

/** DS-E parameters (tests that are not one oracle row). */
const params: PricingParams = pricingParams(PARAMS);
const PP = new Map<string, PricingParams>();
/** Pricing parameters of one oracle row: DS-E + the row's `params`. */
const pp = (e: Example): PricingParams => {
  let v = PP.get(e.id);
  if (!v) PP.set(e.id, (v = pricingParams(paramMap(e))));
  return v;
};
/** One parameter of one oracle row: DS-E + the row's `params`. */
const Pe = <T = never>(e: Example, key: string): T => paramMap(e).get(key) as T;
/** The row's room: DS-E room, occupancies from `room.<no>.*` in the row's `params` when given. */
function roomOf(e: Example, roomNo = e.input.roomNo as string) {
  const room = ROOMS[roomNo];
  if (!room) throw new Error(`${e.id}: room ${roomNo} is not in DS-E`);
  const o = e.params ?? {};
  return {
    ...room,
    baseOccupancy: (o[`room.${roomNo}.base_occupancy`] as number | undefined) ?? room.baseOccupancy,
    maxOccupancy: (o[`room.${roomNo}.max_occupancy`] as number | undefined) ?? room.maxOccupancy,
  };
}

const byCalc = (calc: string) => oracle.examples.filter((e) => e.calc === calc);
const ex = (id: string) => oracle.examples.find((e) => e.id === id) as Example;

function persons(input: Record<string, unknown>) {
  const ages = (input.childrenAges as number[]) ?? [];
  return {
    adults: (input.adults as number) + ages.filter((a) => a >= 12).length,
    children6to11: ages.filter((a) => a >= 6 && a < 12).length,
    childrenUnder6: ages.filter((a) => a < 6).length,
  };
}

describe('br-examples.json – booking rules (BE-A Sprint 2)', () => {
  it.each(byCalc('nights').map((e) => [e.id, e] as const))('%s nights (BR-002)', (_id, e) => {
    const i = e.input as { arrivalDate: string; departureDate: string };
    expect(nightsOf(i.arrivalDate, i.departureDate)).toBe(e.expected.nights);
    expect(nightDates(i.arrivalDate, i.departureDate)).toEqual(e.expected.nightDates);
  });

  it.each(byCalc('rangesOverlap').map((e) => [e.id, e] as const))(
    '%s half-open ranges',
    (_id, e) => {
      const i = e.input as Record<string, unknown>;
      const r = (v: unknown) =>
        Array.isArray(v)
          ? { from: v[0] as string, to: v[1] as string }
          : {
              from: (v as { arrivalDate: string }).arrivalDate,
              to: (v as { departureDate: string }).departureDate,
            };
      const [a, b] = i.a ? [r(i.a), r(i.b)] : [r(i.block), r(i.booking)];
      expect(rangesOverlap(a, b)).toBe(e.expected.overlap);
    },
  );

  it.each(byCalc('roundNearest').map((e) => [e.id, e] as const))(
    '%s rounding (BR-005)',
    (_id, e) => {
      expect(roundVnd(e.input.valueVnd as number, e.input.stepVnd as number)).toBe(
        e.expected.roundedVnd,
      );
    },
  );

  it.each(byCalc('nightlyListPrice').map((e) => [e.id, e] as const))(
    '%s list price (BR-101)',
    (_id, e) => {
      expect(
        divideRoundVnd(
          e.input.monthlyListPriceVnd as number,
          Pe(e, 'night_from_month_divisor'),
          pp(e).nightRateUnit,
        ),
      ).toBe(e.expected.nightlyListPriceVnd);
    },
  );

  it.each(byCalc('otaWeekendRate').map((e) => [e.id, e] as const))(
    '%s OTA weekend (BR-103)',
    (_id, e) => {
      const r = calendarRate(
        e.input.otaBaseRateVnd as number,
        e.input.nightDate as string,
        'ota',
        pp(e).calendar,
        pp(e).otaRateUnit,
      );
      expect(r.rateVnd).toBe(e.expected.otaRateVnd);
    },
  );

  it.each(byCalc('calendarRate').map((e) => [e.id, e] as const))(
    '%s calendar (BR-104)',
    (_id, e) => {
      const group = e.input.channel === 'ota' ? 'ota' : 'direct';
      const unit = group === 'ota' ? pp(e).otaRateUnit : pp(e).nightRateUnit;
      expect(
        calendarRate(
          e.input.baseRateVnd as number,
          e.input.nightDate as string,
          group,
          pp(e).calendar,
          unit,
        ).rateVnd,
      ).toBe(e.expected.rateVnd);
    },
  );

  it.each(byCalc('rateFloorCeiling').map((e) => [e.id, e] as const))(
    '%s floor/ceiling (BR-105)',
    (_id, e) => {
      expect(
        rateBounds(
          e.input.otaBaseRateVnd as number,
          pp(e).rateFloorPct,
          pp(e).rateCeilingPct,
          pp(e).otaRateUnit,
        ),
      ).toEqual({
        floorVnd: e.expected.floorVnd,
        ceilingVnd: e.expected.ceilingVnd,
      });
    },
  );

  it.each(byCalc('losDiscount').map((e) => [e.id, e] as const))(
    '%s length-of-stay discount (BR-107)',
    (_id, e) => {
      const i = e.input as {
        arrivalDate: string;
        nights: number;
        nightlyListPriceVnd: number;
        nightlyRatesVnd: number[];
      };
      const dates = nightDates(
        i.arrivalDate,
        new Date(Date.parse(`${i.arrivalDate}T00:00:00Z`) + i.nights * 86_400_000)
          .toISOString()
          .slice(0, 10),
      );
      const calendar = dates.map(
        (d) =>
          calendarRate(i.nightlyListPriceVnd, d, 'direct', pp(e).calendar, pp(e).nightRateUnit)
            .rateVnd,
      );
      expect(calendar).toEqual(i.nightlyRatesVnd);
      const pct = losDiscountPct(i.nights, pp(e).losTiers);
      expect(pct * 100).toBe(e.expected.discountBp);
      const discounted = applyNightDiscount(calendar, pct, pp(e).nightRateUnit);
      expect(discounted).toEqual(e.expected.discountedNightlyRatesVnd);
      expect(discounted.reduce((a, b) => a + b, 0)).toBe(e.expected.roomTotalVnd);
    },
  );

  it('BR-107 / BR-305 end to end through PricingService.price(): 202, 7 nights → 5.205.000, deposit 1.600.000', () => {
    const r = new PricingService({} as never).price(params, {
      room: {
        roomId: 'r202',
        baseOccupancy: 2,
        listPrices: [{ effectiveFrom: '2026-10-01', nightlyVnd: 792_000 }],
      },
      channelGroup: 'direct',
      arrival: '2026-11-09',
      departure: '2026-11-16',
      party: { adults: 3, children6to11: 0, childrenUnder6: 0 },
    });
    expect(r.totalRoomVnd).toBe(5_205_000);
    expect(r.depositRequiredVnd).toBe(1_600_000);
    expect(r.extraPersonFeeVnd).toBe(1_050_000); // BR-305-02: 150.000 × 7, not in the deposit
    expect(r.losDiscountPct).toBe(10);
  });

  it.each(byCalc('extraPersonFee').map((e) => [e.id, e] as const))(
    '%s extra persons (BR-110 / BR-812)',
    (_id, e) => {
      const room = roomOf(e);
      const party = persons(e.input);
      const counted = countedPersons(party);
      if (e.expected.countedPersons !== undefined) expect(counted).toBe(e.expected.countedPersons);
      expect(counted <= room.maxOccupancy).toBe(e.expected.accepted);
      if (!e.expected.accepted) return;
      const x = extraPersons(party, room.baseOccupancy, {
        adultVnd: pp(e).extraAdultFeeVnd,
        child611Vnd: pp(e).child611FeeVnd,
      });
      if (e.expected.extraGuestKits !== undefined)
        expect(x.extraCount).toBe(e.expected.extraGuestKits);
      if (e.expected.extraPersonFeeVnd !== undefined) {
        // BR-812-07: OTA price already covers its guest count → no surcharge, but the kit is still prepared.
        const charged = e.input.channel === undefined || e.input.channel === 'direct';
        expect(charged ? x.perNightVnd * (e.input.nights as number) : 0).toBe(
          e.expected.extraPersonFeeVnd,
        );
      }
    },
  );

  it.each(byCalc('shortDeposit').map((e) => [e.id, e] as const))(
    '%s short deposit (BR-305)',
    (_id, e) => {
      const deposit = shortDeposit(
        e.input.roomTotalVnd as number,
        pp(e).depositPct,
        pp(e).depositUnit,
      );
      expect(deposit).toBe(e.expected.depositVnd);
      expect((e.input.roomTotalVnd as number) - deposit).toBe(e.expected.remainingAtCheckinVnd);
      if (e.expected.dueAtCheckinVnd !== undefined) {
        expect(
          (e.input.roomTotalVnd as number) - deposit + (e.input.extraPersonFeeVnd as number),
        ).toBe(e.expected.dueAtCheckinVnd);
      }
    },
  );

  it.each(byCalc('holdDeadline').map((e) => [e.id, e] as const))(
    '%s hold deadline (BR-001/BR-302)',
    (_id, e) => {
      const created = new Date(e.input.createdAt as string);
      const today = businessDate(created, TZ, Pe(e, 'business_day_rollover'));
      const r = holdDeadline(
        created,
        e.input.holdHours as number,
        e.input.arrivalDate as string,
        today,
        Pe(e, 'hold_latest_time_on_arrival'),
        TZ,
      );
      if (e.expected.holdAllowed === false) expect(r.allowed).toBe(false);
      else {
        expect(r.allowed).toBe(true);
        if (r.allowed)
          expect(r.expiresAt.getTime()).toBe(new Date(e.expected.expiresAt as string).getTime());
      }
    },
  );

  it.each(byCalc('holdExtension').map((e) => [e.id, e] as const))(
    '%s hold extension cap (BR-303)',
    (_id, e) => {
      const next = holdExtension(
        new Date(e.input.currentExpiresAt as string),
        e.input.extendHours as number,
        e.input.arrivalDate as string,
        Pe(e, 'hold_latest_time_on_arrival'),
        TZ,
      );
      expect(next.getTime()).toBe(new Date(e.expected.newExpiresAt as string).getTime());
    },
  );

  it.each(byCalc('noticeDays').map((e) => [e.id, e] as const))(
    '%s notice days (BR-011)',
    (_id, e) => {
      const bd = businessDate(
        new Date(e.input.notifiedAt as string),
        TZ,
        Pe(e, 'business_day_rollover'),
      );
      expect(noticeDays(e.input.anchorDate as string, bd)).toBe(e.expected.noticeDays);
    },
  );

  it.each(byCalc('directCancelRefund').map((e) => [e.id, e] as const))(
    '%s cancellation refund (BR-309)',
    (_id, e) => {
      const bd = businessDate(
        new Date(e.input.notifiedAt as string),
        TZ,
        Pe(e, 'business_day_rollover'),
      );
      const n = noticeDays(e.input.arrivalDate as string, bd);
      expect(n).toBe(e.expected.noticeDays);
      const r = directCancelRefund(
        e.input.depositVnd as number,
        n,
        pp(e).cancelPolicy,
        (e.input.peakNight as boolean) && pp(e).cancelPeakNoRefund,
        pp(e).feeUnit,
      );
      expect(r.refundVnd).toBe(e.expected.refundVnd);
      expect(r.cancelFeeVnd).toBe(e.expected.cancelFeeVnd);
    },
  );

  it('BR-309 peak night: no refund after the deposit', () => {
    expect(
      directCancelRefund(700_000, 20, params.cancelPolicy, true, params.feeUnit),
    ).toMatchObject({ refundVnd: 0, cancelFeeVnd: 700_000 });
  });

  it.each(byCalc('bookingWindow').map((e) => [e.id, e] as const))(
    '%s booking window (BR-112)',
    (_id, e) => {
      expect(lastBookableArrival(e.input.today as string, pp(e).bookingWindowDays)).toBe(
        e.expected.lastBookableArrivalDate,
      );
    },
  );

  it.each(
    byCalc('extraGuestKitDue')
      .filter((e) => e.input.arrivalDate && !e.input.confirmedEarlyCheckinTime)
      .map((e) => [e.id, e] as const),
  )('%s kit task due at check-in time (BR-812 (2))', (_id, e) => {
    expect(
      extraGuestKitDue(
        e.input.arrivalDate as string,
        pp(e).checkinTime,
        TZ,
        e.input.confirmedAt
          ? { at: new Date(e.input.confirmedAt as string), midstayMinutes: 60 }
          : undefined,
      ).getTime(),
    ).toBe(new Date(e.expected.dueAt as string).getTime());
  });

  it('BR-113-01: arrival Saturday 24/10, 1 night → minimum 2 nights (all channels)', () => {
    const e = ex('BR-113-01');
    expect(
      minStayNights(
        e.input.arrivalDate as string,
        'direct',
        params.minStay,
        params.calendar.specialDates,
      ),
    ).toBe(e.expected.minStayNights);
    expect(minStayNights('2026-10-24', 'ota', params.minStay, params.calendar.specialDates)).toBe(
      2,
    );
    expect(
      minStayNights('2026-10-20', 'direct', params.minStay, params.calendar.specialDates),
    ).toBe(0);
    expect(
      minStayNights('2026-12-31', 'direct', params.minStay, params.calendar.specialDates),
    ).toBe(2); // special date
  });

  it('BR-113-02: an orphan night between two stays is accepted for 1 night', () => {
    expect(
      isOrphanGap('2026-10-24', '2026-10-25', [
        { from: '2026-10-20', to: '2026-10-24' },
        { from: '2026-10-25', to: '2026-10-27' },
      ]),
    ).toBe(true);
    expect(
      isOrphanGap('2026-10-24', '2026-10-25', [{ from: '2026-10-25', to: '2026-10-27' }]),
    ).toBe(false);
  });

  it('BR-316-01: fewest orphan nights first (201 leaves none, 202 leaves 22/10)', () => {
    expect(
      orphanNightsLeft('2026-10-20', '2026-10-22', [{ from: '2026-10-22', to: '2026-10-25' }]),
    ).toBe(0);
    expect(
      orphanNightsLeft('2026-10-20', '2026-10-22', [{ from: '2026-10-23', to: '2026-10-25' }]),
    ).toBe(1);
  });

  it('OTA total split evenly, remainder on the last night (erd 8)', () => {
    expect(splitEvenly(2_000_000, 3)).toEqual([666_666, 666_666, 666_668]);
    expect(splitEvenly(2_460_000, 3).reduce((a, b) => a + b, 0)).toBe(2_460_000);
  });

  it('rack merges adjacent/overlapping ranges for SAL/CTV (availability only)', () => {
    expect(
      mergeRanges([
        { from: '2026-10-20', to: '2026-10-22' },
        { from: '2026-10-22', to: '2026-10-23' },
        { from: '2026-10-25', to: '2026-10-26' },
      ]),
    ).toEqual([
      { from: '2026-10-20', to: '2026-10-23' },
      { from: '2026-10-25', to: '2026-10-26' },
    ]);
  });

  it('BR-309 postpone window: + 3 months, end of month clamped', () => {
    expect(addMonths('2026-10-22', 3)).toBe('2027-01-22');
    expect(addMonths('2026-11-30', 3)).toBe('2027-02-28');
  });

  it('allowedActions follow state AND role (US-020 AC2)', () => {
    const base = {
      conflictState: 'none' as const,
      channelGroup: 'direct' as const,
      arrivalDate: '2026-10-20',
      departureDate: '2026-10-22',
      today: '2026-10-15',
      holdExpired: false,
      holdExtendedCount: 0,
      own: true,
      noShowMarkable: false,
      restoreWithinRules: true,
      rescheduleCount: 0,
      rescheduleMaxTimes: 1,
    };
    const ev = (
      roles: string[],
      status: Parameters<typeof allowedActions>[1]['status'],
      extra = {},
    ) => allowedActions(roles, { ...base, status, ...extra }).map((a) => a.event);
    expect(ev(['front_desk'], 'hold')).toEqual(['confirm_deposit', 'extend_hold', 'cancel_hold']);
    expect(ev(['collaborator'], 'hold')).toEqual(['extend_hold', 'cancel_hold']);
    expect(ev(['collaborator'], 'hold', { own: false })).toEqual([]);
    expect(ev(['front_desk'], 'confirmed')).toEqual(['move', 'cancel']);
    expect(ev(['manager'], 'confirmed')).toEqual(['move', 'postpone', 'cancel']);
    expect(ev(['front_desk'], 'confirmed', { conflictState: 'open' })).toEqual([
      'assign_room',
      'move',
      'cancel',
    ]);
    expect(ev(['front_desk'], 'confirmed', { today: '2026-10-20', noShowMarkable: true })).toEqual([
      'check_in',
      'move',
      'cancel',
      'mark_no_show',
    ]);
    expect(
      allowedActions(['front_desk'], { ...base, status: 'no_show', restoreWithinRules: false })[0],
    ).toMatchObject({
      event: 'restore_no_show',
      requiresApproval: true,
    });
    expect(ev(['front_desk'], 'cancelled')).toEqual([]);
    expect(ev(['sales_staff'], 'confirmed')).toEqual(['cancel']);
    expect(ev(['housekeeping'], 'confirmed')).toEqual([]);
  });
});

/**
 * v1.0.4 P4-11 – FB-R4-QA-DOM-PR25-01 (Major, QA review PR #25): the rows of the 01/11 price table (BR v0.5.1) run
 * through the Desk pricing engine with THEIR parameters (`pp(e)` = DS-E + `row.params`), not only through QA's
 * validator. While a row is still `calc: null` it is replayed here by id; once DOM gives it a `calc` (P4-20) the
 * generic `byCalc` block above replays it – and the guard below fails if that `calc` has no block in this file
 * (no silent "xanh giả", BUG-R4-013). Web estimate rows (BR-114-01, BR-115, BR-116) need the public price module of
 * LP-v2: replayed after `main@L` (P4-11 phase B).
 */
describe('br-examples.json – 01/11 price table through the pricing engine (FB-R4-QA-DOM-PR25-01)', () => {
  const DESK_ROWS = [
    'BR-101-12',
    'BR-103-04',
    'BR-104-10',
    'BR-104-11',
    'BR-107-07',
    'BR-108-02',
    'BR-108-03',
    'BR-110-18',
    'BR-110-19',
    'BR-110-20',
    'BR-114-02',
  ] as const;
  const WEB_ROWS = [
    'BR-114-01',
    'BR-115-01',
    'BR-115-02',
    'BR-115-03',
    'BR-115-04',
    'BR-115-05',
    'BR-115-06',
    'BR-115-07',
    'BR-115-08',
    'BR-116-01',
  ] as const;
  /** Every `calc` the blocks of this file replay (byCalc above). */
  const REPLAYED = new Set([
    'nights',
    'rangesOverlap',
    'roundNearest',
    'nightlyListPrice',
    'otaWeekendRate',
    'calendarRate',
    'rateFloorCeiling',
    'losDiscount',
    'extraPersonFee',
    'shortDeposit',
    'holdDeadline',
    'holdExtension',
    'noticeDays',
    'directCancelRefund',
    'bookingWindow',
    'extraGuestKitDue',
  ]);
  const SRC = readFileSync(__filename, 'utf8');

  it('REPLAYED is exactly the set of byCalc blocks in this file', () => {
    const used = new Set([...SRC.matchAll(/byCalc\('([A-Za-z]+)'\)/g)].map((m) => m[1]));
    expect([...used].sort()).toEqual([...REPLAYED].sort());
  });

  it('every listed row exists, carries the 01/11 parameters, and has a replay (here by id, or its calc)', () => {
    for (const id of [...DESK_ROWS, ...WEB_ROWS]) {
      const e = ex(id);
      expect(e, id).toBeDefined();
      expect(e.params, `${id} params`).toBeDefined();
      if (e.calc !== null) expect(REPLAYED.has(e.calc), `${id}: calc ${e.calc}`).toBe(true);
    }
  });

  /** Short stay through PricingService.price() with the row's parameters; one list price for every night. */
  const stay = (
    e: Example,
    o: {
      roomNo: string;
      listVnd: number;
      arrival: string;
      departure: string;
      party?: ReturnType<typeof persons>;
    },
  ) =>
    new PricingService({} as never).price(pp(e), {
      room: {
        roomId: `r${o.roomNo}`,
        baseOccupancy: roomOf(e, o.roomNo).baseOccupancy,
        listPrices: [{ effectiveFrom: '2026-01-01', nightlyVnd: o.listVnd }],
      },
      channelGroup: 'direct',
      arrival: o.arrival,
      departure: o.departure,
      party: o.party ?? { adults: 2, children6to11: 0, childrenUnder6: 0 },
    });
  const addN = (d: string, n: number) =>
    new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
  /** A Tuesday after the switch date S – the engine is date-blind once the uplifts are 0. */
  const ANY_ARRIVAL = '2026-11-10';
  /** Replayed here only while the row has no `calc` (afterwards the byCalc block does it). */
  const pending = (id: string) => (ex(id).calc === null ? it : it.skip);

  pending('BR-101-12')('BR-101-12 one rate, no Friday/Saturday uplift: 3 × 800.000', () => {
    const e = ex('BR-101-12');
    const r = stay(e, {
      roomNo: e.input.roomNo as string,
      listVnd: e.input.nightlyListPriceVnd as number,
      arrival: e.input.arrivalDate as string,
      departure: e.input.departureDate as string,
      party: persons(e.input),
    });
    expect(r.nights.map((n) => n.amountVnd)).toEqual(e.expected.nightlyRatesVnd);
    expect(r.totalRoomVnd).toBe(e.expected.roomTotalVnd);
  });

  pending('BR-103-04')(
    'BR-103-04 OTA = direct on a Saturday (ota_base_rate = nightly price)',
    () => {
      const e = ex('BR-103-04');
      const base = (e.input.otaBaseRateVnd as Record<string, number>)[e.input.roomGroup as string];
      const d = e.input.nightDate as string;
      expect(base).toBeDefined();
      expect(calendarRate(base!, d, 'ota', pp(e).calendar, pp(e).otaRateUnit).rateVnd).toBe(
        e.expected.otaRateVnd,
      );
      expect(calendarRate(base!, d, 'direct', pp(e).calendar, pp(e).nightRateUnit).rateVnd).toBe(
        e.expected.directRateVnd,
      );
    },
  );

  for (const id of ['BR-104-10', 'BR-104-11'] as const) {
    pending(id)(`${id} no weekend / holiday uplift`, () => {
      const e = ex(id);
      const d = e.input.nightDate as string;
      const r = calendarRate(
        e.input.baseRateVnd as number,
        d,
        'direct',
        pp(e).calendar,
        pp(e).nightRateUnit,
      );
      expect(r.rateVnd).toBe(e.expected.rateVnd);
      if (e.expected.isSpecialDate !== undefined) {
        expect(pp(e).calendar.specialDates.some((s) => d >= s.from && d < s.to)).toBe(
          e.expected.isSpecialDate,
        );
      }
    });
  }

  pending('BR-107-07')('BR-107-07 no length-of-stay discount: 7 × 800.000', () => {
    const e = ex('BR-107-07');
    const arrival = e.input.arrivalDate as string;
    const r = stay(e, {
      roomNo: e.input.roomNo as string,
      listVnd: e.input.nightlyListPriceVnd as number,
      arrival,
      departure: addN(arrival, e.input.nights as number),
    });
    expect(r.losDiscountPct * 100).toBe(e.expected.discountBp);
    expect(r.totalRoomVnd).toBe(e.expected.roomTotalVnd);
  });

  pending('BR-108-02')('BR-108-02 20 nights: no monthly compare, 20 × 800.000', () => {
    const e = ex('BR-108-02');
    const nights = e.input.nights as number;
    expect(nights >= Pe<number>(e, 'long_stay_compare_from_nights')).toBe(
      e.expected.showLongStayOption,
    );
    const r = stay(e, {
      roomNo: '102',
      listVnd: e.input.nightlyListPriceVnd as number,
      arrival: ANY_ARRIVAL,
      departure: addN(ANY_ARRIVAL, nights),
    });
    expect(r.totalRoomVnd).toBe(e.expected.shortStayTotalVnd);
  });

  pending('BR-108-03')('BR-108-03 29 nights short, 30 nights a lease (30-night mark)', () => {
    const e = ex('BR-108-03');
    for (const n of e.input.nightsCases as number[]) {
      const want = e.expected[String(n)] as Record<string, unknown>;
      const kind = n >= pp(e).longStayRequiredFromNights ? 'long' : 'short';
      expect(kind, `${n} nights`).toBe(want.stayKind);
      if (kind === 'short') expect(n).toBeLessThanOrEqual(pp(e).shortStayMaxNights);
    }
  });

  // FB-R4-BE-DOM-P411-01: the row's `params` lack `los_discount: []` / `weekend_uplift_pct: 0`, so DS-E's 15 % tier
  // applies (29 × 800.000 × 0,85 = 20.536.000 ≠ 23.200.000). Runs as soon as DOM completes the row (P4-20).
  const has0111Table = (id: string) =>
    Array.isArray(ex(id).params?.los_discount) &&
    (ex(id).params?.los_discount as unknown[]).length === 0;
  (ex('BR-108-03').calc === null && has0111Table('BR-108-03') ? it : it.skip)(
    'BR-108-03 29 nights short total 23.200.000 (row params with the 01/11 table)',
    () => {
      const e = ex('BR-108-03');
      for (const n of e.input.nightsCases as number[]) {
        const want = e.expected[String(n)] as Record<string, unknown>;
        if (n >= pp(e).longStayRequiredFromNights) continue;
        const r = stay(e, {
          roomNo: '102',
          listVnd: e.input.nightlyListPriceVnd as number,
          arrival: ANY_ARRIVAL,
          departure: addN(ANY_ARRIVAL, n),
          party: persons(e.input),
        });
        expect(r.totalRoomVnd).toBe(want.shortStayTotalVnd);
      }
    },
  );

  for (const id of ['BR-110-18', 'BR-110-19'] as const) {
    pending(id)(`${id} extra person from 6 years at 150.000`, () => {
      const e = ex(id);
      const room = roomOf(e);
      const party = persons(e.input);
      expect(countedPersons(party) <= room.maxOccupancy).toBe(e.expected.accepted);
      const x = extraPersons(party, room.baseOccupancy, {
        adultVnd: pp(e).extraAdultFeeVnd,
        child611Vnd: pp(e).child611FeeVnd,
      });
      const nights = e.input.nights as number;
      expect(x.extraCount).toBe(e.expected.extraGuestKits);
      expect(x.perNightVnd * nights).toBe(e.expected.extraPersonFeeVnd);
      if (e.expected.roomTotalVnd !== undefined) {
        const r = stay(e, {
          roomNo: e.input.roomNo as string,
          listVnd: e.input.nightlyListPriceVnd as number,
          arrival: ANY_ARRIVAL,
          departure: addN(ANY_ARRIVAL, nights),
          party,
        });
        expect(r.totalRoomVnd).toBe(e.expected.roomTotalVnd);
        expect(r.extraPersonFeeVnd).toBe(e.expected.extraPersonFeeVnd);
        expect(r.totalRoomVnd + r.extraPersonFeeVnd).toBe(e.expected.totalVnd);
      }
    });
  }

  pending('BR-110-20')(
    'BR-110-20 one adult more from 22/10: the fee on the nights from then',
    () => {
      const e = ex('BR-110-20');
      const room = roomOf(e);
      const before = persons(e.input);
      const change = e.input.change as { addAdults: number; effectiveFrom: string };
      const after = { ...before, adults: before.adults + change.addAdults };
      const fees = { adultVnd: pp(e).extraAdultFeeVnd, child611Vnd: pp(e).child611FeeVnd };
      const perNight = nightDates(
        e.input.arrivalDate as string,
        e.input.departureDate as string,
      ).map((d) =>
        extraPersons(d < change.effectiveFrom ? before : after, room.baseOccupancy, fees),
      );
      expect(perNight.at(-1)!.perNightVnd).toBe(e.expected.extraPersonFeePerNightVnd);
      expect(perNight.reduce((a, x) => a + x.perNightVnd, 0)).toBe(e.expected.extraPersonFeeVnd);
    },
  );

  pending('BR-114-02')('BR-114-02 Saturday and 31/12 at the weekday price', () => {
    const e = ex('BR-114-02');
    const rates = (e.input.nights as string[]).map(
      (d) =>
        calendarRate(
          e.input.nightlyListPriceVnd as number,
          d,
          'direct',
          pp(e).calendar,
          pp(e).nightRateUnit,
        ).rateVnd,
    );
    expect(rates).toEqual(e.expected.ratesVnd);
    expect(Math.min(...rates)).toBe(e.expected.weekendFromPriceVnd);
    expect(pp(e).calendar.specialUpliftPct > 0).toBe(e.expected.showHigherOnHolidaysClause);
  });

  it.todo(
    'BR-114-01, BR-115-01…08, BR-116-01 web estimate rows – after main@L (public price module of LP-v2)',
  );
});
