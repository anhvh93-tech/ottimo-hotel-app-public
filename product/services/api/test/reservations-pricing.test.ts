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
  type PriceRoom,
  type PricingParams,
  PricingService,
} from '../src/modules/reservations/public/pricing.service';
import { mergeRanges } from '../src/modules/reservations/internal/rack.service';
import { allowedActions } from '../src/modules/reservations/internal/allowed-actions';
import { addMonths } from '../src/modules/reservations/internal/reservations.service';
import { ProblemError } from '../src/shared/problem';
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
 * v1.0.4 P4-11 – FB-R4-QA-DOM-PR25-01 (Major, QA review PR #25): the rows of the 01/11 price table (BR v0.5.1/v0.5.2)
 * run through the Desk pricing engine with THEIR parameters (`pp(e)` = DS-E + `row.params`). DOM (P4-20) gave them a
 * `calc`; the rows the generic blocks above replay (calendarRate, losDiscount, otaWeekendRate, extraPersonFee) and the
 * three calcs below (stayKindByNights, extraPersonFeeChange, nightRates) leave no row of the QA list unreplayed –
 * except the web estimate (fromPrice, webEstimate, parityFloor), which needs the public price module of LP-v2 and is
 * replayed after `main@L` (P4-11 phase B). The guard fails when a row of the list gets a `calc` with no block here
 * (no silent "xanh giả", BUG-R4-013).
 */
describe('br-examples.json – 01/11 price table through the pricing engine (FB-R4-QA-DOM-PR25-01)', () => {
  const QA_LIST = [
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
    'BR-110-21',
    'BR-110-22',
    'BR-114-01',
    'BR-114-02',
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
  /** Public web estimate (LP-v2 `public-rate*`, not on this base yet) – P4-11 phase B after main@L. */
  const WEB_CALCS = new Set(['fromPrice', 'webEstimate', 'parityFloor']);
  const SRC = readFileSync(__filename, 'utf8');
  const REPLAYED = new Set([...SRC.matchAll(/byCalc\('([A-Za-z]+)'\)/g)].map((m) => m[1]));

  it('every row of the QA list has a calc, its 01/11 parameters, and a replay in this file (web: phase B)', () => {
    for (const id of QA_LIST) {
      const e = ex(id);
      expect(e, id).toBeDefined();
      expect(e.params, `${id} params`).toBeDefined();
      expect(e.calc, `${id} calc`).not.toBeNull();
      expect(e.pendingFix, `${id} pendingFix`).toBeUndefined();
      expect(
        REPLAYED.has(e.calc as string) || WEB_CALCS.has(e.calc as string),
        `${id}: calc ${e.calc}`,
      ).toBe(true);
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
  /** City Studio (DS-E room 102) for rows given by public room type. */
  const ROOM_OF_TYPE: Record<string, string> = { city_studio: '102', garden_studio: '202' };

  it.each(byCalc('stayKindByNights').map((e) => [e.id, e] as const))(
    '%s short stay or lease by the number of nights (BR-108), short total through the engine',
    (_id, e) => {
      const cases = (e.input.nightsCases as number[] | undefined) ?? [e.input.nights as number];
      for (const n of cases) {
        const want = (e.input.nightsCases ? e.expected[String(n)] : e.expected) as Record<
          string,
          unknown
        >;
        const kind = n >= pp(e).longStayRequiredFromNights ? 'long' : 'short';
        if (want.stayKind !== undefined) expect(kind, `${n} nights`).toBe(want.stayKind);
        if (kind === 'long') continue; // lease numbers: leaseRent / leaseDeposit blocks of the lease engine
        expect(n).toBeLessThanOrEqual(pp(e).shortStayMaxNights);
        if (want.showLongStayOption !== undefined) {
          expect(n >= Pe<number>(e, 'long_stay_compare_from_nights')).toBe(want.showLongStayOption);
        }
        const r = stay(e, {
          roomNo: ROOM_OF_TYPE[e.input.publicRoomType as string] ?? '102',
          listVnd: e.input.nightlyListPriceVnd as number,
          arrival: ANY_ARRIVAL,
          departure: addN(ANY_ARRIVAL, n),
          party: e.input.adults === undefined ? undefined : persons(e.input),
        });
        expect(r.totalRoomVnd, `${n} nights`).toBe(want.shortStayTotalVnd);
      }
    },
  );

  it.each(byCalc('extraPersonFeeChange').map((e) => [e.id, e] as const))(
    '%s a person added mid-stay: the BR-110 fee on the nights from then (BR-110, per night)',
    (_id, e) => {
      const room = roomOf(e);
      const before = persons(e.input);
      const change = e.input.change as { addAdults?: number; effectiveFrom: string };
      const after = { ...before, adults: before.adults + (change.addAdults ?? 0) };
      const fees = { adultVnd: pp(e).extraAdultFeeVnd, child611Vnd: pp(e).child611FeeVnd };
      const perNight = nightDates(
        e.input.arrivalDate as string,
        e.input.departureDate as string,
      ).map(
        (d) =>
          extraPersons(d < change.effectiveFrom ? before : after, room.baseOccupancy, fees)
            .perNightVnd,
      );
      expect(perNight.at(-1)).toBe(e.expected.extraPersonFeePerNightVnd);
      // only the nights from the change carry the new fee (the booking had no extra person before)
      expect(perNight.reduce((a, x) => a + x, 0)).toBe(e.expected.extraPersonFeeVnd);
    },
  );

  it.each(byCalc('nightRates').map((e) => [e.id, e] as const))(
    '%s rate of each night by the calendar (BR-104/BR-114)',
    (_id, e) => {
      const group = e.input.channel === 'ota' ? 'ota' : 'direct';
      const unit = group === 'ota' ? pp(e).otaRateUnit : pp(e).nightRateUnit;
      const rates = (e.input.nights as string[]).map(
        (d) =>
          calendarRate(e.input.nightlyListPriceVnd as number, d, group, pp(e).calendar, unit)
            .rateVnd,
      );
      expect(rates).toEqual(e.expected.ratesVnd);
      if (e.expected.weekendFromPriceVnd !== undefined)
        expect(Math.min(...rates)).toBe(e.expected.weekendFromPriceVnd);
      if (e.expected.showHigherOnHolidaysClause !== undefined)
        expect(pp(e).calendar.specialUpliftPct > 0).toBe(e.expected.showHigherOnHolidaysClause);
    },
  );

  it.todo(
    'fromPrice / webEstimate / parityFloor rows (BR-114-01, BR-115-01…08, BR-116-01) – after main@L (LP-v2 public price module)',
  );
});

/**
 * v1.0.4 #70 release condition (BUG-R4-037, ARC (A), DOM-on-v104-pr68-docs 7.1): production has no `ota_base_rate`
 * row (INV_ENTERS_KEYS) and the desk cannot add one, so an OTA booking sent without a price and without an OTA
 * amount takes the room's nightly list price of each night through the OTA calendar (BR-103: one price for every
 * channel) – exactly what it gets with `ota_base_rate` = that list price. A night without a list price stays 422.
 */
describe('OTA booking without a price when `ota_base_rate` is missing (#70, BR-103)', () => {
  const engine = new PricingService({} as never);
  const noKey: PricingParams = { ...params, otaBaseRates: {} };
  const withKey = (base: number): PricingParams => ({ ...params, otaBaseRates: { L12: base } });
  /** Room 203 (Lầu 1–2): 760.000 until 31/10, 800.000 from 01/11 – the list price changes mid-stay. */
  const ROOM_203 = {
    roomId: 'r203',
    groupCode: 'L12',
    baseOccupancy: 2,
    listPrices: [
      { effectiveFrom: '2026-10-01', nightlyVnd: 760_000 },
      { effectiveFrom: '2026-11-01', nightlyVnd: 800_000 },
    ],
  };
  const FLAT_800 = {
    ...ROOM_203,
    listPrices: [{ effectiveFrom: '2026-10-01', nightlyVnd: 800_000 }],
  };
  const plusDays = (d: string, n: number) =>
    new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
  /** Fri 30/10 → Mon 02/11 (3 nights: Fri, Sat on 760.000, Sun on 800.000), no nightlyRates, no OTA amount. */
  const otaNoPrice = (
    p: PricingParams,
    room: PriceRoom = ROOM_203,
    arrival = '2026-10-30',
    departure = '2026-11-02',
  ) =>
    engine.price(p, {
      room,
      channelGroup: 'ota',
      arrival,
      departure,
      party: { adults: 2, children6to11: 0, childrenUnder6: 0 },
    });
  const problemOf = (fn: () => unknown) => {
    try {
      fn();
    } catch (err) {
      if (err instanceof ProblemError)
        return { status: err.status, code: err.code, errors: err.options.errors };
      throw err;
    }
    throw new Error('no problem thrown');
  };

  it('no key → the list price of each night through the OTA calendar (Fri/Sat 760.000 +15 % → 870.000, Sun 800.000)', () => {
    const r = otaNoPrice(noKey);
    expect(r.nights).toEqual([
      {
        date: '2026-10-30',
        amountVnd: 870_000,
        calendarVnd: 870_000,
        source: 'calendar',
        uplift: 'weekend',
      },
      {
        date: '2026-10-31',
        amountVnd: 870_000,
        calendarVnd: 870_000,
        source: 'calendar',
        uplift: 'weekend',
      },
      {
        date: '2026-11-01',
        amountVnd: 800_000,
        calendarVnd: 800_000,
        source: 'calendar',
        uplift: 'none',
      },
    ]);
    expect(r.totalRoomVnd).toBe(2_540_000);
    expect(r.losDiscountPct).toBe(0);
    expect(r.depositRequiredVnd).toBe(0);
    expect(r.outOfRange).toEqual([]);
    // Same as the group key = the list price of the night, night by night (ARC condition 1).
    for (const n of r.nights) {
      const list = PricingService.listPriceOn(ROOM_203, n.date) as number;
      const one = otaNoPrice(withKey(list), ROOM_203, n.date, plusDays(n.date, 1));
      expect(one.nights).toEqual([n]);
    }
    // BUG-R2-017 shape (ARC condition 2): every night keeps `calendarVnd` in the snapshot → stay_night
    // calendar_rate_vnd is not NULL, so the BUG-R4-037 data check (`calendarVnd IS NULL`) does not flag it.
    for (const n of PricingService.snapshot(noKey, r).nights) {
      expect(n.source).toBe('calendar');
      expect(n.calendarVnd).toBe(n.amountVnd);
    }
  });

  it('no key → the whole result is identical to `ota_base_rate` = the list price (flat 800.000, room without group too)', () => {
    expect(otaNoPrice(noKey, FLAT_800)).toEqual(otaNoPrice(withKey(800_000), FLAT_800));
    const noGroup: PriceRoom = {
      roomId: 'r203',
      baseOccupancy: 2,
      listPrices: FLAT_800.listPrices,
    };
    expect(otaNoPrice(params, noGroup)).toEqual(otaNoPrice(withKey(800_000), FLAT_800));
  });

  it('key configured → as before: the group base wins over the list price (870.000, 870.000, 760.000)', () => {
    const r = otaNoPrice(params);
    expect(r.nights.map((n) => [n.amountVnd, n.calendarVnd, n.source])).toEqual([
      [870_000, 870_000, 'calendar'],
      [870_000, 870_000, 'calendar'],
      [760_000, 760_000, 'calendar'],
    ]);
    // the key alone prices the stay – no list price needed (unchanged)
    expect(otaNoPrice(params, { ...ROOM_203, listPrices: [] }).totalRoomVnd).toBe(2_500_000);
  });

  it('no key and a night without a list price → 422 nightlyRates REQUIRED (ARC condition 3)', () => {
    const want = {
      status: 422,
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'nightlyRates', code: 'REQUIRED' }],
    };
    expect(problemOf(() => otaNoPrice(noKey, { ...ROOM_203, listPrices: [] }))).toEqual(want);
    // list price only from 31/10: the night of 30/10 has none
    expect(
      problemOf(() =>
        otaNoPrice(noKey, {
          ...ROOM_203,
          listPrices: [{ effectiveFrom: '2026-10-31', nightlyVnd: 800_000 }],
        }),
      ),
    ).toEqual(want);
  });

  it('BR-103-05 through the engine: no key, 01/11 price table → 800.000 every night (= direct)', () => {
    const e = ex('BR-103-05');
    const i = e.input as { nightlyListPriceVnd: number; nights: string[]; channel: string };
    expect(i.channel).toBe('ota');
    const first = i.nights[0] as string;
    const r = engine.price(
      { ...pp(e), otaBaseRates: {} },
      {
        room: {
          roomId: 'r203',
          groupCode: e.input.roomGroup as string,
          baseOccupancy: roomOf(e, '203').baseOccupancy,
          listPrices: [{ effectiveFrom: '2026-11-01', nightlyVnd: i.nightlyListPriceVnd }],
        },
        channelGroup: 'ota',
        arrival: first,
        departure: plusDays(first, i.nights.length),
        party: { adults: 2, children6to11: 0, childrenUnder6: 0 },
      },
    );
    expect(r.nights.map((n) => n.date)).toEqual(i.nights);
    expect(r.nights.map((n) => n.amountVnd)).toEqual(e.expected.ratesVnd);
    expect(r.nights.every((n) => n.source === e.expected.nightSource)).toBe(true);
    expect(r.nights.every((n) => n.calendarVnd === n.amountVnd)).toBe(
      e.expected.calendarRateStored,
    );
  });
});
