/**
 * Booking prices from the parameters in force (BR-101…113, 305; BR-006 snapshot). Shared by the reservations
 * use cases and – through the module export – by quotes (sales, BE-B: `quotes/calculate`), so one engine
 * prices both (coding-standards 1.1: the client never computes prices).
 *
 * Parameters are read ONCE per call, as of the business date of the request (asOf) – the values used are
 * copied into `reservation.pricing_snapshot`; later recalculations of the same booking read the snapshot.
 */
import { Inject, Injectable } from '@nestjs/common';
import { inSequence } from '../../../shared/sequence';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import type { LocalDate, LocalTime } from '../../../shared/time';
import { ParameterService } from '../../platform/public/parameter.service';
import {
  type CalendarRules,
  type CancelTier,
  type ChannelGroup,
  type ChannelScope,
  type LosTier,
  type MinStayRule,
  type SpecialDate,
  type Weekday,
  applyNightDiscount,
  calendarRate,
  extraPersons,
  losDiscountPct,
  nightDates,
  rateBounds,
  shortDeposit,
  splitEvenly,
} from './pricing';

/** Parameter values a booking calculation needs (all from config_parameter – none hard-coded). */
export interface PricingParams {
  asOf: LocalDate;
  nightRateUnit: number;
  otaRateUnit: number;
  depositUnit: number;
  feeUnit: number;
  calendar: CalendarRules;
  losTiers: LosTier[];
  extraAdultFeeVnd: number;
  child611FeeVnd: number;
  depositPct: number;
  rateFloorPct: number;
  rateCeilingPct: number;
  minStay: MinStayRule[];
  minStayOrphanException: boolean;
  bookingWindowDays: number;
  shortStayMaxNights: number;
  longStayRequiredFromNights: number;
  cancelPolicy: CancelTier[];
  cancelPeakNoRefund: boolean;
  rescheduleWindowMonths: number;
  rescheduleMaxTimes: number;
  checkinTime: LocalTime;
}

export interface PriceRoom {
  roomId: string;
  baseOccupancy: number;
  /** Nightly list price (BR-101, stored rounded) effective per night: list ordered by effectiveFrom. */
  listPrices: ReadonlyArray<{ effectiveFrom: LocalDate; nightlyVnd: number }>;
}

export interface PriceInput {
  room: PriceRoom;
  channelGroup: ChannelGroup;
  arrival: LocalDate;
  departure: LocalDate;
  party: { adults: number; children6to11: number; childrenUnder6: number };
  /** Explicit nightly rates (form override / OTA). */
  nightlyRates?: ReadonlyArray<{ date: LocalDate; amountVnd: number }> | undefined;
  otaRoomAmountVnd?: number | undefined;
}

export interface PricedNight {
  date: LocalDate;
  /** Final price of the night (after calendar and length-of-stay discount) – stay_night gross. */
  amountVnd: number;
  source: 'calendar' | 'manual' | 'ota_amount' | 'complimentary';
  uplift?: 'special' | 'weekend' | 'none';
  /** BR-105 bounds of the night (direct/agent/ota with a list price). */
  floorVnd?: number;
  ceilingVnd?: number;
}

export interface PriceResult {
  nights: PricedNight[];
  totalRoomVnd: number;
  losDiscountPct: number;
  extraCount: number;
  extraPersonFeePerNightVnd: number;
  extraPersonFeeVnd: number;
  depositRequiredVnd: number;
  /** At least one special (peak) night – BR-309 "ngày cao điểm không hoàn". */
  hasPeakNight: boolean;
  /** Nights whose explicit price is outside the BR-105 bounds. */
  outOfRange: LocalDate[];
}

@Injectable()
export class PricingService {
  constructor(@Inject(ParameterService) private readonly params: ParameterService) {}

  async load(tx: Tx, asOf: LocalDate): Promise<PricingParams> {
    const g = <T>(key: string) => this.params.get<T>(tx, key, asOf);
    const [
      nightRateUnit,
      otaRateUnit,
      depositUnit,
      feeUnit,
      weekendUpliftPct,
      weekendNights,
      weekendChannels,
      specialDates,
      specialUpliftPct,
      specialChannels,
      losTiers,
      extraAdultFeeVnd,
      child611FeeVnd,
      depositPct,
      rateFloorPct,
      rateCeilingPct,
      minStay,
      minStayOrphanException,
      bookingWindowDays,
      shortStayMaxNights,
      longStayRequiredFromNights,
      cancelPolicy,
      cancelPeakNoRefund,
      rescheduleWindowMonths,
      rescheduleMaxTimes,
      checkinTime,
    ] = await inSequence([
      () => g<number>('rounding.night_rate'),
      () =>
        // BR-005: "tiền thuê tháng, giá OTA → 10.000" – one parameter for both (no rounding.ota_rate key).
        g<number>('rounding.monthly_rent'),
      () => g<number>('rounding.deposit'),
      () => g<number>('rounding.fee'),
      () => g<number>('weekend_uplift_pct'),
      () => g<Weekday[]>('weekend_nights'),
      () => g<ChannelScope>('weekend_uplift_channels'),
      () => g<SpecialDate[]>('special_dates'),
      () => g<number>('special_uplift_pct'),
      () => g<ChannelScope>('special_uplift_channels'),
      () => g<LosTier[]>('los_discount'),
      () => g<number>('extra_adult_fee'),
      () => g<number>('child_fee_6_11'),
      () => g<number>('short_stay_deposit_pct'),
      () => g<number>('rate_floor_pct'),
      () => g<number>('rate_ceiling_pct'),
      () => g<MinStayRule[]>('min_stay'),
      () => g<boolean>('min_stay_orphan_night_exception'),
      () => g<number>('booking_window_days'),
      () => g<number>('short_stay_max_nights'),
      () => g<number>('long_stay_required_from_nights'),
      () => g<CancelTier[]>('cancel_policy_direct'),
      () => g<boolean>('cancel_peak_no_refund'),
      () => g<number>('reschedule_window_months'),
      () => g<number>('reschedule_max_times'),
      () => g<LocalTime>('checkin_time'),
    ]);
    return {
      asOf,
      nightRateUnit,
      otaRateUnit,
      depositUnit,
      feeUnit,
      calendar: {
        weekendNights,
        weekendUpliftPct,
        weekendChannels,
        specialDates,
        specialUpliftPct,
        specialChannels,
      },
      losTiers,
      extraAdultFeeVnd,
      child611FeeVnd,
      depositPct,
      rateFloorPct,
      rateCeilingPct,
      minStay,
      minStayOrphanException,
      bookingWindowDays,
      shortStayMaxNights,
      longStayRequiredFromNights,
      cancelPolicy,
      cancelPeakNoRefund,
      rescheduleWindowMonths,
      rescheduleMaxTimes,
      checkinTime,
    };
  }

  /** List price of the room effective on `date` (latest effectiveFrom ≤ date). */
  static listPriceOn(room: PriceRoom, date: LocalDate): number | null {
    let found: number | null = null;
    for (const p of room.listPrices) if (p.effectiveFrom <= date) found = p.nightlyVnd;
    return found;
  }

  /**
   * Prices a short stay. Throws 422 for malformed explicit rates (one row per night, > 0, sum = OTA total).
   * Range checks (BR-105) are reported in `outOfRange` – the caller decides block (direct/agent) or warning
   * (ota).
   */
  price(p: PricingParams, input: PriceInput): PriceResult {
    const dates = nightDates(input.arrival, input.departure);
    const group = input.channelGroup;
    const unitFor = group === 'ota' ? p.otaRateUnit : p.nightRateUnit;
    const peak = dates.some((d) => p.calendar.specialDates.some((s) => d >= s.from && d < s.to));

    const bounds = (date: LocalDate): { floorVnd: number; ceilingVnd: number } | null => {
      const list = PricingService.listPriceOn(input.room, date);
      return list === null ? null : rateBounds(list, p.rateFloorPct, p.rateCeilingPct, unitFor);
    };

    let nights: PricedNight[];
    let losPct = 0;
    const explicit = input.nightlyRates;
    if (explicit && explicit.length > 0) {
      const byDate = new Map<string, number>();
      for (const r of explicit) {
        if (byDate.has(r.date) || !dates.includes(r.date)) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'nightlyRates', code: 'VALIDATION_FAILED' }],
          });
        }
        byDate.set(r.date, r.amountVnd);
      }
      if (byDate.size !== dates.length) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'nightlyRates', code: 'REQUIRED' }],
        });
      }
      nights = dates.map((date) => {
        const amount = byDate.get(date) as number;
        const zeroOk = group === 'internal';
        if (!Number.isSafeInteger(amount) || amount < 0 || (amount === 0 && !zeroOk)) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'nightlyRates', code: 'AMOUNT_NOT_POSITIVE' }],
          });
        }
        const b = group === 'internal' ? null : bounds(date);
        return {
          date,
          amountVnd: amount,
          source: amount === 0 ? 'complimentary' : 'manual',
          ...(b ?? {}),
        };
      });
      if (
        input.otaRoomAmountVnd !== undefined &&
        nights.reduce((s, n) => s + n.amountVnd, 0) !== input.otaRoomAmountVnd
      ) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'otaRoomAmountVnd', code: 'OTA_AMOUNT_MISMATCH' }],
        });
      }
    } else if (group === 'ota') {
      if (input.otaRoomAmountVnd === undefined) {
        // R2 manual OTA entry: the price comes from the extranet (BR-112) – one of the two is required.
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'nightlyRates', code: 'REQUIRED' }],
        });
      }
      if (!Number.isSafeInteger(input.otaRoomAmountVnd) || input.otaRoomAmountVnd <= 0) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'otaRoomAmountVnd', code: 'AMOUNT_NOT_POSITIVE' }],
        });
      }
      const parts = splitEvenly(input.otaRoomAmountVnd, dates.length);
      nights = dates.map((date, i) => ({
        date,
        amountVnd: parts[i] as number,
        source: 'ota_amount',
      }));
    } else if (group === 'internal') {
      nights = dates.map((date) => ({ date, amountVnd: 0, source: 'complimentary' }));
    } else {
      const calendar = dates.map((date) => {
        const list = PricingService.listPriceOn(input.room, date);
        if (list === null) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }],
            detail: 'room has no list price for the stay',
          });
        }
        return { date, ...calendarRate(list, date, group, p.calendar, p.nightRateUnit) };
      });
      losPct = losDiscountPct(dates.length, p.losTiers);
      const discounted = applyNightDiscount(
        calendar.map((c) => c.rateVnd),
        losPct,
        p.nightRateUnit,
      );
      nights = calendar.map((c, i) => ({
        date: c.date,
        amountVnd: discounted[i] as number,
        source: 'calendar',
        uplift: c.uplift,
      }));
    }

    const outOfRange = nights
      .filter(
        (n) =>
          n.source === 'manual' &&
          n.floorVnd !== undefined &&
          n.ceilingVnd !== undefined &&
          (n.amountVnd < n.floorVnd || n.amountVnd > n.ceilingVnd),
      )
      .map((n) => n.date);

    const totalRoomVnd = nights.reduce((s, n) => s + n.amountVnd, 0);
    // BR-110: extra-person fee only for direct/agent (OTA price already covers its guest count).
    const extra = extraPersons(input.party, input.room.baseOccupancy, {
      adultVnd: p.extraAdultFeeVnd,
      child611Vnd: p.child611FeeVnd,
    });
    const charged = group === 'direct' || group === 'agent';
    const perNight = charged ? extra.perNightVnd : 0;
    const depositRequiredVnd = charged
      ? shortDeposit(totalRoomVnd, p.depositPct, p.depositUnit)
      : 0;

    return {
      nights,
      totalRoomVnd,
      losDiscountPct: losPct,
      extraCount: extra.extraCount,
      extraPersonFeePerNightVnd: perNight,
      extraPersonFeeVnd: perNight * dates.length,
      depositRequiredVnd,
      hasPeakNight: peak,
      outOfRange,
    };
  }

  /** BR-006 snapshot of the parameters + result stored on the booking. */
  static snapshot(p: PricingParams, r: PriceResult, extra: Record<string, unknown> = {}) {
    return {
      asOf: p.asOf,
      nightRateUnit: p.nightRateUnit,
      otaRateUnit: p.otaRateUnit,
      depositPct: p.depositPct,
      depositUnit: p.depositUnit,
      feeUnit: p.feeUnit,
      losTiers: p.losTiers,
      losDiscountPct: r.losDiscountPct,
      extraAdultFeeVnd: p.extraAdultFeeVnd,
      child611FeeVnd: p.child611FeeVnd,
      extraCount: r.extraCount,
      extraPersonFeePerNightVnd: r.extraPersonFeePerNightVnd,
      extraPersonFeeVnd: r.extraPersonFeeVnd,
      cancelPolicy: p.cancelPolicy,
      cancelPeakNoRefund: p.cancelPeakNoRefund,
      hasPeakNight: r.hasPeakNight,
      nights: r.nights.map((n) => ({
        date: n.date,
        amountVnd: n.amountVnd,
        source: n.source,
        ...(n.uplift ? { uplift: n.uplift } : {}),
      })),
      ...extra,
    };
  }
}
