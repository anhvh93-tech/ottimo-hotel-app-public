/**
 * Booking rules replayed against QA's oracle product/tests/fixtures/br-examples.json (coding-standards 10.2:
 * every BR number example is a golden test). Pure functions of reservations/public/pricing.ts and
 * PricingService.price() with the DS-E parameters.
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
/** DS-E parameter value (typed by the caller). */
const P = <T = never>(key: string): T => PARAMS.get(key) as T;
const ROOMS = Object.fromEntries(ds.rooms.map((r) => [r.roomNo, r]));
const TZ = 'Asia/Ho_Chi_Minh';

const params: PricingParams = {
  asOf: '2026-10-15',
  nightRateUnit: P('rounding.night_rate'),
  otaRateUnit: P('rounding.monthly_rent'),
  depositUnit: P('rounding.deposit'),
  feeUnit: P('rounding.fee'),
  calendar: {
    weekendNights: P('weekend_nights'),
    weekendUpliftPct: P('weekend_uplift_pct'),
    weekendChannels: P('weekend_uplift_channels'),
    specialDates: P('special_dates'),
    specialUpliftPct: P('special_uplift_pct'),
    specialChannels: P('special_uplift_channels'),
  },
  losTiers: P('los_discount'),
  extraAdultFeeVnd: P('extra_adult_fee'),
  child611FeeVnd: P('child_fee_6_11'),
  depositPct: P('short_stay_deposit_pct'),
  rateFloorPct: P('rate_floor_pct'),
  rateCeilingPct: P('rate_ceiling_pct'),
  minStay: P('min_stay'),
  minStayOrphanException: P('min_stay_orphan_night_exception'),
  bookingWindowDays: P('booking_window_days'),
  shortStayMaxNights: P('short_stay_max_nights'),
  longStayRequiredFromNights: P('long_stay_required_from_nights'),
  cancelPolicy: P('cancel_policy_direct'),
  cancelPeakNoRefund: P('cancel_peak_no_refund'),
  rescheduleWindowMonths: P('reschedule_window_months'),
  rescheduleMaxTimes: P('reschedule_max_times'),
  checkinTime: P('checkin_time'),
};

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
          P('night_from_month_divisor'),
          params.nightRateUnit,
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
        params.calendar,
        params.otaRateUnit,
      );
      expect(r.rateVnd).toBe(e.expected.otaRateVnd);
    },
  );

  it.each(byCalc('calendarRate').map((e) => [e.id, e] as const))(
    '%s calendar (BR-104)',
    (_id, e) => {
      const group = e.input.channel === 'ota' ? 'ota' : 'direct';
      const unit = group === 'ota' ? params.otaRateUnit : params.nightRateUnit;
      expect(
        calendarRate(
          e.input.baseRateVnd as number,
          e.input.nightDate as string,
          group,
          params.calendar,
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
          params.rateFloorPct,
          params.rateCeilingPct,
          params.otaRateUnit,
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
          calendarRate(i.nightlyListPriceVnd, d, 'direct', params.calendar, params.nightRateUnit)
            .rateVnd,
      );
      expect(calendar).toEqual(i.nightlyRatesVnd);
      const pct = losDiscountPct(i.nights, params.losTiers);
      expect(pct * 100).toBe(e.expected.discountBp);
      const discounted = applyNightDiscount(calendar, pct, params.nightRateUnit);
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
      const room = ROOMS[e.input.roomNo as string]!;
      const party = persons(e.input);
      const counted = countedPersons(party);
      if (e.expected.countedPersons !== undefined) expect(counted).toBe(e.expected.countedPersons);
      expect(counted <= room.maxOccupancy).toBe(e.expected.accepted);
      if (!e.expected.accepted) return;
      const x = extraPersons(party, room.baseOccupancy, {
        adultVnd: params.extraAdultFeeVnd,
        child611Vnd: params.child611FeeVnd,
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
        params.depositPct,
        params.depositUnit,
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
      const today = businessDate(created, TZ, P('business_day_rollover'));
      const r = holdDeadline(
        created,
        e.input.holdHours as number,
        e.input.arrivalDate as string,
        today,
        P('hold_latest_time_on_arrival'),
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
        P('hold_latest_time_on_arrival'),
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
        P('business_day_rollover'),
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
        P('business_day_rollover'),
      );
      const n = noticeDays(e.input.arrivalDate as string, bd);
      expect(n).toBe(e.expected.noticeDays);
      const r = directCancelRefund(
        e.input.depositVnd as number,
        n,
        params.cancelPolicy,
        (e.input.peakNight as boolean) && params.cancelPeakNoRefund,
        params.feeUnit,
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
      expect(lastBookableArrival(e.input.today as string, params.bookingWindowDays)).toBe(
        e.expected.lastBookableArrivalDate,
      );
    },
  );

  it.each(
    byCalc('extraGuestKitDue')
      .filter((e) => e.input.arrivalDate && !e.input.confirmedEarlyCheckinTime)
      .map((e) => [e.id, e] as const),
  )('%s kit task due at check-in time (BR-812 (2))', (_id, e) => {
    expect(extraGuestKitDue(e.input.arrivalDate as string, params.checkinTime, TZ).getTime()).toBe(
      new Date(e.expected.dueAt as string).getTime(),
    );
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
