/**
 * Short-stay quote calculation (US-080, US-082; BR-101, 104, 107, 108, 110, 111, 112, 113, 305, 903).
 * Server is the only source of prices (ADR-001); every number is a parameter read for the property at the
 * business date (coding-standards 1.2) and the pure rules come from reservations/public/pricing.ts (shared
 * with createReservation). The parameters and results are returned as `snapshot` so a saved quote never
 * changes afterwards (BR-006, US-083 AC1).
 *
 * V5-14 (OpenAPI 0.3.13 + bổ sung 1 (b); contract-0.3.13 1.3, 1.17; BUG-R4-041): `nightlyRates` = the agreed prices
 * the desk typed (FD+ only – the x-write-roles gate of AuthGuard refuses SAL/CTV before this code runs). Same
 * meaning as `createReservation` of a direct/agent booking: they cover every night, a typed price is the CALENDAR
 * price of its night (before the BR-107 tier and the BR-111 return code), always within the BR-105 floor–ceiling –
 * nightly price and bounds come from the reservations PricingService.price, not from a copy here. A night whose
 * `edited` is not `true` keeps the server's own calendar (the amount sent is ignored – SEC ARC-06). The snapshot
 * keeps `nights[].source` (`manual` = typed) so createHoldFromQuote holds at the typed price (`manual_agreed`).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { type FieldError, problem } from '../../../shared/problem';
import { type LocalDate, addDays } from '../../../shared/time';
import { commissionPctFor, payeeTypeOf, type PayeeType } from '../../folio/public/folio.service';
import { ChannelsService } from '../../platform/public/channels';
import { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import { PricingService } from '../../reservations/public/pricing.service';
import {
  type CalendarRules,
  type ChannelScope,
  type LosTier,
  type SpecialDate,
  type Weekday,
  applyNightDiscount,
  applyPct,
  calendarRate,
  countedPersons,
  extraPersons,
  lastBookableArrival,
  losDiscountPct,
  minStayNights,
  nightDates,
  shortDeposit,
} from '../../reservations/public/pricing';
import { readMinStay } from '../../reservations/public/min-stay-read';
import { rateOutOfRange } from '../../reservations/public/rate-out-of-range';
import {
  type AvailabilityAnswer,
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../reservations/public/sales-port';

export interface QuoteInput {
  type: 'short' | 'long';
  roomId?: string | undefined;
  roomGroupId?: string | undefined;
  arrivalDate: LocalDate;
  nights?: number | undefined;
  termMonths?: number | undefined;
  adults: number;
  children6to11?: number | undefined;
  childrenUnder6?: number | undefined;
  guestCategory?: 'vn' | 'foreigner' | undefined;
  cleaningPerWeek?: number | undefined;
  channelId: string;
  closerUserId?: string | undefined;
  returnGuestCode?: string | undefined;
  /** V5-14: agreed nightly prices typed at the desk (FD+ – x-write-roles). */
  nightlyRates?: QuoteNightRate[] | undefined;
}

/** OpenAPI NightRate as sent in QuoteInput.nightlyRates (`edited` = the desk changed the cell). */
export interface QuoteNightRate {
  date: LocalDate;
  amountVnd: number;
  edited?: boolean | undefined;
}

/** Source of a quoted night kept in the snapshot (`manual` = price typed at the desk, V5-14). */
export type QuoteNightSource = 'calendar' | 'manual';

export interface Caller {
  userId: string;
  roles: readonly string[];
}

/** OpenAPI QuoteCalculation (short). The role serializer removes commission / ottimoRemainingVnd. */
export interface QuoteCalculation {
  type: 'short';
  /** 0.3.5 (A-05, A-14). */
  roomId: string;
  roomNo: string;
  roomTotalVnd: number;
  extraPersonFeeVnd: number;
  extraGuestCount: number;
  nights: number;
  /** `calendarRateVnd` (NightRate, read only): the calendar price BEFORE the BR-107 / BR-111 % (S4-38, FE-A H09). */
  nightlyRates: Array<{ date: LocalDate; amountVnd: number; calendarRateVnd: number }>;
  losDiscountPct: number;
  totalVnd: number;
  depositVnd: number;
  commission?: { ratePct: number; baseVnd: number; amountVnd: number; ruleRef: string };
  ottimoRemainingVnd: number;
  longStayAlternative?: { termMonths: number; totalVnd: number; mandatory: boolean };
  availability?: { available: boolean; alternatives: string[] };
  warnings: string[];
}

export interface QuoteResult {
  calc: QuoteCalculation;
  roomId: string | null;
  roomGroupId: string | null;
  closerUserId: string | null;
  roomTotalVnd: number;
  extraPersonPerNightVnd: number;
  extraGuestCount: number;
  departureDate: LocalDate;
  payeeType: PayeeType | null;
  commissionRatePct: number | null;
  /** BR-006 snapshot: parameters used + room facts (stored on quote.pricing_snapshot). */
  snapshot: Record<string, unknown>;
}

interface ListPriceRow {
  effective_from: LocalDate;
  nightly_list_price_vnd: number;
}

interface RoomFacts {
  id: string;
  room_no: string;
  name: string | null;
  room_group_id: string;
  group_code: string;
  base_occupancy: number;
  max_occupancy: number;
  is_sellable: boolean;
  service_fee_monthly_vnd: number | null;
}

const FULL_SCOPE = ['owner', 'manager', 'front_desk_lead', 'front_desk'];

export function isOwnScope(c: Caller): boolean {
  return !c.roles.some((r) => FULL_SCOPE.includes(r));
}

function fail(code: string, errors: FieldError[]): never {
  throw problem(code, { errors });
}

/**
 * V5-14 body rules of QuoteInput.nightlyRates (contract 1.17), checked before the channel and the price: every
 * element on a night of [arrival, arrival + nights) and no night twice (422 DATE_INVALID at `nightlyRates[i].date`),
 * no amount ≤ 0 (422 AMOUNT_NOT_POSITIVE, as B1), every night covered (422 REQUIRED at `nightlyRates`).
 * Returns the typed (`edited = true`) price of each night; the other nights keep the server calendar.
 */
export function typedNightRates(
  arrival: LocalDate,
  nights: number,
  rates: readonly QuoteNightRate[],
): Map<LocalDate, number> {
  const dates = new Set(nightDates(arrival, addDays(arrival, nights)));
  const seen = new Set<LocalDate>();
  const errors: FieldError[] = [];
  let notPositive = false;
  const typed = new Map<LocalDate, number>();
  rates.forEach((r, i) => {
    if (!dates.has(r.date) || seen.has(r.date)) {
      errors.push({ field: `nightlyRates[${i}].date`, code: 'DATE_INVALID' });
      return;
    }
    seen.add(r.date);
    if (!Number.isSafeInteger(r.amountVnd) || r.amountVnd <= 0) notPositive = true;
    else if (r.edited === true) typed.set(r.date, r.amountVnd);
  });
  if (errors.length > 0) fail('VALIDATION_FAILED', errors);
  if (notPositive) {
    fail('VALIDATION_FAILED', [{ field: 'nightlyRates', code: 'AMOUNT_NOT_POSITIVE' }]);
  }
  if (seen.size < dates.size) {
    fail('VALIDATION_FAILED', [{ field: 'nightlyRates', code: 'REQUIRED' }]);
  }
  return typed;
}

@Injectable()
export class QuotePricingService {
  constructor(
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(ChannelsService) private readonly channels: ChannelsService,
    @Optional()
    @Inject(RESERVATION_SALES_PORT)
    private readonly reservations?: ReservationSalesPort,
    // V5-14: the booking price engine (reservations module, global export) – typed nights and BR-105 bounds.
    @Optional()
    @Inject(PricingService)
    private readonly engine?: PricingService,
  ) {}

  async calculate(tx: Tx, caller: Caller, input: QuoteInput): Promise<QuoteResult> {
    // V5-14: typed prices only on a short stay (contract 1.3 – 422 NOT_ALLOWED on `nightlyRates`).
    if (input.type !== 'short' && input.nightlyRates !== undefined) {
      fail('VALIDATION_FAILED', [{ field: 'nightlyRates', code: 'NOT_ALLOWED' }]);
    }
    if (input.type !== 'short') {
      // US-081 long-stay quotes are R3 (R-C, ESC-012).
      fail('VALIDATION_FAILED', [{ field: 'type', code: 'NOT_IN_LIST' }]);
    }
    const nights = input.nights;
    if (nights === undefined) fail('VALIDATION_FAILED', [{ field: 'nights', code: 'REQUIRED' }]);
    // Body rules of the typed prices come before the channel and the price (contract 1.17 "thân lệnh → kênh").
    const typed =
      input.nightlyRates !== undefined
        ? typedNightRates(input.arrivalDate, nights, input.nightlyRates)
        : null;
    const { today } = await this.property.now(tx);
    const p = async <T>(key: string): Promise<T> => this.params.get<T>(tx, key, today);

    // ── channel (Trực tiếp / CTV only – BR-112) ──
    const channel = await this.channels.byId(tx, input.channelId, today);
    if (
      !channel ||
      !channel.isActive ||
      (channel.channelGroup !== 'direct' && channel.channelGroup !== 'agent')
    ) {
      fail('VALIDATION_FAILED', [{ field: 'channelId', code: 'NOT_IN_LIST' }]);
    }
    const group = channel.channelGroup;

    // ── closer (scope M: a SAL/CTV quotes for themselves) ──
    let closerUserId: string | null = input.closerUserId ?? null;
    if (isOwnScope(caller)) {
      if (closerUserId && closerUserId !== caller.userId) {
        fail('VALIDATION_FAILED', [{ field: 'closerUserId', code: 'NOT_IN_LIST' }]);
      }
      closerUserId = caller.userId;
    }
    let payeeType: PayeeType | null = null;
    if (closerUserId) {
      const { rows } = await tx.query<{ role: string }>(
        `SELECT upr.role FROM user_property_role upr JOIN app_user u ON u.id = upr.user_id
          WHERE upr.user_id = $1 AND upr.property_id = $2 AND upr.revoked_at IS NULL AND u.status = 'active'`,
        [closerUserId, tx.ctx.propertyId],
      );
      if (rows.length === 0) {
        fail('VALIDATION_FAILED', [{ field: 'closerUserId', code: 'NOT_IN_LIST' }]);
      }
      payeeType = payeeTypeOf(rows.map((r) => r.role));
    }

    // ── dates (BR-112, BR-108) ──
    const errors: FieldError[] = [];
    if (input.arrivalDate < today) errors.push({ field: 'arrivalDate', code: 'DATE_IN_PAST' });
    if (errors.length) fail('VALIDATION_FAILED', errors);
    const windowDays = await p<number>('booking_window_days');
    if (input.arrivalDate > lastBookableArrival(today, windowDays)) {
      fail('OUTSIDE_BOOKING_WINDOW', [{ field: 'arrivalDate', code: 'OUTSIDE_BOOKING_WINDOW' }]);
    }
    const longRequired = await p<number>('long_stay_required_from_nights');
    const longCompare = await p<number>('long_stay_compare_from_nights');
    const shortMax = await p<number>('short_stay_max_nights');
    if (nights >= longRequired) {
      fail('VALIDATION_FAILED', [{ field: 'nights', code: 'LONG_STAY_REQUIRES_CONTRACT' }]);
    }
    if (nights > shortMax) {
      fail('OUTSIDE_BOOKING_WINDOW', [{ field: 'nights', code: 'OUTSIDE_BOOKING_WINDOW' }]);
    }
    const departureDate = addDays(input.arrivalDate, nights);
    const party = {
      adults: input.adults,
      children6to11: input.children6to11 ?? 0,
      childrenUnder6: input.childrenUnder6 ?? 0,
    };
    const counted = countedPersons(party);

    // ── minimum stay of the arrival (BR-113) – needed to pick the room of a group quote (A-05) ──
    const specials = await p<SpecialDate[]>('special_dates');
    // V5-25 (DOM 12.3, BUG-R5-003): a broken stored value never makes the quote fail – not a list → no rule, a
    // broken rule is left out (logged once per value).
    const minStayRules = readMinStay(await p<unknown>('min_stay'), shortMax, {
      propertyId: tx.ctx.propertyId,
    });
    const needNights = minStayNights(input.arrivalDate, group, minStayRules, specials ?? []);
    const orphanAllowed = await p<boolean>('min_stay_orphan_night_exception');
    const short = nights < needNights;

    // ── room (requested room, or a free room of the group – US-082, 0.3.5 A-05) ──
    if (!input.roomId && !input.roomGroupId) {
      fail('VALIDATION_FAILED', [{ field: 'roomId', code: 'REQUIRED' }]);
    }
    const capacity = (r: RoomFacts): void => {
      if (counted > r.max_occupancy) {
        throw problem('CAPACITY_EXCEEDED', {
          errors: [{ field: 'adults', code: 'CAPACITY_EXCEEDED' }],
          extras: { roomNo: r.room_no, max: r.max_occupancy },
        });
      }
    };
    const warnings: string[] = [];
    let availability: AvailabilityAnswer | null = null;
    let room: RoomFacts | null = null;
    if (input.roomId) {
      room = await this.room(tx, input.roomId);
      if (!room) fail('VALIDATION_FAILED', [{ field: 'roomId', code: 'NOT_IN_LIST' }]);
      if (input.roomGroupId && input.roomGroupId !== room.room_group_id) {
        fail('VALIDATION_FAILED', [{ field: 'roomGroupId', code: 'NOT_IN_LIST' }]);
      }
      capacity(room);
    }
    const ask = (roomId?: string) =>
      (this.reservations as ReservationSalesPort).availability(tx, {
        ...(roomId ? { roomId } : {}),
        ...(!roomId && input.roomGroupId ? { roomGroupId: input.roomGroupId } : {}),
        fromDate: input.arrivalDate,
        toDate: departureDate,
        countedPersons: counted,
      });
    if (this.reservations) {
      availability = await ask(room?.id);
    } else {
      warnings.push('availability_unknown');
    }
    if (!room) {
      const sameGroup = (availability?.alternatives ?? []).filter((a) => !a.upgrade);
      let chosen = sameGroup[0];
      let chosenAnswer: AvailabilityAnswer | null = null;
      if (short && orphanAllowed) {
        // BR-113 (a): below the minimum stay, the room whose free gap the stay exactly fills goes first.
        for (const cand of sameGroup) {
          const a = await ask(cand.roomId);
          if (a.available && a.orphanGap) {
            chosen = cand;
            chosenAnswer = a;
            break;
          }
        }
      }
      if (chosen) room = await this.room(tx, chosen.roomId);
      if (!room) {
        // No free room of the group (or availability unknown): price on the group's first room so the
        // sale still sees a figure; the answer says "not available" (US-080 AC4).
        room = await this.firstRoomOfGroup(tx, input.roomGroupId as string);
        if (!room) fail('VALIDATION_FAILED', [{ field: 'roomGroupId', code: 'NOT_IN_LIST' }]);
        if (availability) availability = { ...availability, available: false, orphanGap: false };
      } else if (availability) {
        availability = {
          ...availability,
          available: true,
          orphanGap: chosenAnswer?.orphanGap ?? false,
          alternatives: availability.alternatives.filter((a) => a.roomId !== room?.id),
        };
      }
      capacity(room);
    }
    if (!room.is_sellable && availability) {
      availability = { ...availability, available: false, reason: 'not_sellable' };
    }

    // ── minimum stay (BR-113, orphan-night exception) ──
    if (short) {
      if (!(orphanAllowed && availability?.orphanGap === true)) {
        const suggestions: Array<{
          roomId: string;
          roomNo: string;
          roomGroupCode: string;
          upgrade: boolean;
          orphanNight: boolean;
        }> = [];
        if (orphanAllowed && this.reservations) {
          for (const cand of availability?.alternatives ?? []) {
            const a = await ask(cand.roomId);
            if (a.available && a.orphanGap) suggestions.push({ ...cand, orphanNight: true });
          }
        }
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'nights', code: 'MIN_STAY_NOT_MET' }],
          extras: { minStayNights: needNights, suggestions },
        });
      }
      warnings.push('min_stay_orphan_night_exception');
    }

    // ── nightly rates: list price → calendar (BR-104) → LOS / return code (BR-107, BR-111) ──
    const nightUnit = await p<number>('rounding.night_rate');
    const rules: CalendarRules = {
      weekendNights: (await p<Weekday[]>('weekend_nights')) ?? [],
      weekendUpliftPct: await p<number>('weekend_uplift_pct'),
      weekendChannels: await p<ChannelScope>('weekend_uplift_channels'),
      specialDates: specials ?? [],
      specialUpliftPct: await p<number>('special_uplift_pct'),
      specialChannels: await p<ChannelScope>('special_uplift_channels'),
    };
    const dates = nightDates(input.arrivalDate, departureDate);
    const listRows = await this.listPriceRows(tx, room.id);
    const listPrices = this.listPrices(listRows, dates);
    const serverCalendar = dates.map(
      (d, i) => calendarRate(listPrices[i] as number, d, group, rules, nightUnit).rateVnd,
    );
    // V5-14: a typed night replaces the calendar price of that night (BR-107 v0.3.8), within BR-105.
    let calendar = serverCalendar;
    let sources: QuoteNightSource[] = dates.map(() => 'calendar');
    if (typed) {
      const agreed = await this.typedCalendar(tx, today, {
        room,
        listRows,
        group,
        arrival: input.arrivalDate,
        departure: departureDate,
        party,
        dates,
        serverCalendar,
        typed,
      });
      calendar = agreed.calendar;
      sources = agreed.sources;
    }
    const losTiers = (await p<LosTier[]>('los_discount')) ?? [];
    const losPct = losDiscountPct(nights, losTiers);
    let returnPct = 0;
    if (input.returnGuestCode !== undefined && input.returnGuestCode !== '') {
      const code = await p<string>('return_guest_code');
      if (group !== 'direct' || input.returnGuestCode.trim().toUpperCase() !== code.toUpperCase()) {
        fail('VALIDATION_FAILED', [{ field: 'returnGuestCode', code: 'RETURN_CODE_INVALID' }]);
      }
      returnPct = await p<number>('return_guest_pct');
    }
    const stackable = await p<boolean>('stackable');
    let rates: number[];
    let appliedPct: number;
    if (stackable && returnPct > 0 && losPct > 0) {
      rates = applyNightDiscount(
        applyNightDiscount(calendar, losPct, nightUnit),
        returnPct,
        nightUnit,
      );
      appliedPct = losPct;
      warnings.push('return_code_stacked');
    } else {
      appliedPct = Math.max(losPct, returnPct);
      rates = applyNightDiscount(calendar, appliedPct, nightUnit);
      if (returnPct > 0 && returnPct <= losPct) warnings.push('return_code_not_applied');
    }
    const roomTotalVnd = rates.reduce((a, b) => a + b, 0);

    // ── extra persons (BR-110: adults fill the base first; under-6 not counted) ──
    const extra = extraPersons(party, room.base_occupancy, {
      adultVnd: await p<number>('extra_adult_fee'),
      child611Vnd: await p<number>('child_fee_6_11'),
    });
    const extraPersonVnd = extra.perNightVnd * nights;
    const totalVnd = roomTotalVnd + extraPersonVnd;

    // ── deposit (BR-305: room total only, rounding.deposit) ──
    const depositPct = await p<number>('short_stay_deposit_pct');
    const depositUnit = await p<number>('rounding.deposit');
    const depositVnd = shortDeposit(roomTotalVnd, depositPct, depositUnit);

    // ── commission of the closer (BR-903: % × room total) ──
    let commission: QuoteCalculation['commission'];
    let commissionRatePct: number | null = null;
    if (payeeType) {
      commissionRatePct = commissionPctFor(await p('short_stay_commission_pct'), payeeType);
      if (commissionRatePct !== null && commissionRatePct > 0) {
        commission = {
          ratePct: commissionRatePct,
          baseVnd: roomTotalVnd,
          amountVnd: applyPct(roomTotalVnd, commissionRatePct, 1),
          ruleRef: 'BR-903',
        };
      }
    }

    // ── one-month alternative (BR-108) ──
    let longStayAlternative: QuoteCalculation['longStayAlternative'];
    if (nights >= longCompare) {
      const monthly = await this.monthlyListPrice(tx, room.id, input.arrivalDate);
      const terms = (await p<Array<{ months: number; discountPct?: number }>>('lease_terms')) ?? [];
      const oneMonth = terms.find((t) => t.months === 1);
      const surcharge =
        input.guestCategory === 'foreigner' ? await p<number>('foreigner_surcharge_pct') : 0;
      const rentUnit = await p<number>('rounding.monthly_rent');
      const withSurcharge = applyPct(monthly, 100 + surcharge, 1);
      const rent = applyPct(withSurcharge, 100 - Number(oneMonth?.discountPct ?? 0), rentUnit);
      longStayAlternative = {
        termMonths: 1,
        totalVnd: rent + (room.service_fee_monthly_vnd ?? 0),
        mandatory: nights >= longRequired,
      };
      if (room.service_fee_monthly_vnd === null) warnings.push('service_fee_unknown');
    }

    const calc: QuoteCalculation = {
      type: 'short',
      roomId: room.id,
      roomNo: room.room_no,
      roomTotalVnd,
      extraPersonFeeVnd: extraPersonVnd,
      extraGuestCount: extra.extraCount,
      nights,
      // BR-107 v0.3.8 (S4-38): a price typed at the desk is a calendar price – the client needs the calendar of
      // each night to offer it (never the discounted amount, else the tier would apply twice).
      nightlyRates: dates.map((d, i) => ({
        date: d,
        amountVnd: rates[i] as number,
        calendarRateVnd: calendar[i] as number,
      })),
      losDiscountPct: appliedPct,
      totalVnd,
      depositVnd,
      ...(commission ? { commission } : {}),
      ottimoRemainingVnd: totalVnd - (commission?.amountVnd ?? 0),
      ...(longStayAlternative ? { longStayAlternative } : {}),
      ...(availability
        ? {
            availability: {
              available: availability.available,
              alternatives: availability.alternatives.map((a) => a.roomNo),
            },
          }
        : {}),
      warnings,
    };
    return {
      calc,
      roomId: room.id,
      roomGroupId: room.room_group_id,
      closerUserId,
      roomTotalVnd,
      extraPersonPerNightVnd: extra.perNightVnd,
      extraGuestCount: extra.extraCount,
      departureDate,
      payeeType,
      commissionRatePct: commission ? commissionRatePct : null,
      snapshot: {
        calculatedOn: today,
        roomNo: room.room_no,
        roomName: room.name,
        roomGroupCode: room.group_code,
        baseOccupancy: room.base_occupancy,
        maxOccupancy: room.max_occupancy,
        channelCode: channel.code,
        channelGroup: group,
        listPricesVnd: listPrices,
        // V5-14: the agreed price of a typed night (DOM D-8: it is that night's calendar price).
        calendarRatesVnd: calendar,
        // V5-14 (contract 1.17): source of every night – createHoldFromQuote holds `manual` nights at the typed price.
        nights: dates.map((d, i) => ({
          date: d,
          source: sources[i] as QuoteNightSource,
          ...(sources[i] === 'manual' ? { agreedRateVnd: calendar[i] as number } : {}),
        })),
        bookingRateSource: sources.includes('manual') ? 'manual_agreed' : 'calendar',
        losDiscountPct: losPct,
        returnGuestPct: returnPct,
        roomTotalVnd,
        extraPersonPerNightVnd: extra.perNightVnd,
        extraGuestCount: extra.extraCount,
        extraAdults: extra.extraAdults,
        extraChildren: extra.extraChildren,
        depositPct,
        depositRounding: depositUnit,
        nightRounding: nightUnit,
        commission: commission ? { payeeType, ...commission } : null,
        calc,
      },
    };
  }

  private async room(tx: Tx, id: string): Promise<RoomFacts | null> {
    const { rows } = await tx.query<RoomFacts>(
      `SELECT r.id, r.room_no, r.name, r.room_group_id, g.code AS group_code, r.base_occupancy,
              r.max_occupancy, r.is_sellable, g.service_fee_monthly_vnd
         FROM room r JOIN room_group g ON g.id = r.room_group_id
        WHERE r.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  private async firstRoomOfGroup(tx: Tx, groupId: string): Promise<RoomFacts | null> {
    const { rows } = await tx.query<{ id: string }>(
      `SELECT id FROM room WHERE room_group_id = $1 AND is_sellable ORDER BY room_no LIMIT 1`,
      [groupId],
    );
    return rows[0] ? this.room(tx, rows[0].id) : null;
  }

  /**
   * V5-14: the calendar prices of a quote with typed nights, from the booking engine (PricingService.price – the
   * same call as createReservation of a direct/agent booking): a typed night = its typed price (`manual`), the others
   * = the server calendar sent back untouched (`edited = false`). A typed night outside the BR-105 floor–ceiling →
   * 422 RATE_OUT_OF_RANGE with `dates[]` and the bounds of the first of them (V5-22).
   */
  private async typedCalendar(
    tx: Tx,
    today: LocalDate,
    a: {
      room: RoomFacts;
      listRows: ListPriceRow[];
      group: 'direct' | 'agent';
      arrival: LocalDate;
      departure: LocalDate;
      party: { adults: number; children6to11: number; childrenUnder6: number };
      dates: LocalDate[];
      serverCalendar: number[];
      typed: Map<LocalDate, number>;
    },
  ): Promise<{ calendar: number[]; sources: QuoteNightSource[] }> {
    if (!this.engine) throw problem('INTERNAL_ERROR', { detail: 'reservations pricing not wired' });
    const params = await this.engine.load(tx, today);
    const priced = this.engine.price(params, {
      room: {
        roomId: a.room.id,
        groupCode: a.room.group_code,
        baseOccupancy: a.room.base_occupancy,
        listPrices: a.listRows.map((r) => ({
          effectiveFrom: r.effective_from,
          nightlyVnd: r.nightly_list_price_vnd,
        })),
      },
      channelGroup: a.group,
      arrival: a.arrival,
      departure: a.departure,
      party: a.party,
      nightlyRates: a.dates.map((date, i) => {
        const typed = a.typed.get(date);
        return typed !== undefined
          ? { date, amountVnd: typed, edited: true }
          : { date, amountVnd: a.serverCalendar[i] as number, edited: false };
      }),
    });
    if (priced.outOfRange.length > 0) {
      throw rateOutOfRange(priced.outOfRange, priced.nights);
    }
    return {
      calendar: priced.nights.map((n) => n.calendarVnd ?? n.amountVnd),
      sources: priced.nights.map((n) => (n.source === 'manual' ? 'manual' : 'calendar')),
    };
  }

  private async listPriceRows(tx: Tx, roomId: string): Promise<ListPriceRow[]> {
    const { rows } = await tx.query<ListPriceRow>(
      `SELECT effective_from::text AS effective_from, nightly_list_price_vnd FROM room_list_price
        WHERE room_id = $1 ORDER BY effective_from`,
      [roomId],
    );
    return rows;
  }

  /** List price effective on each night (latest effective_from ≤ night; BR-101, US-004 AC1). */
  private listPrices(rows: readonly ListPriceRow[], dates: LocalDate[]): number[] {
    return dates.map((d) => {
      let price: number | undefined;
      for (const r of rows) if (r.effective_from <= d) price = r.nightly_list_price_vnd;
      if (price === undefined) {
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }] });
      }
      return price;
    });
  }

  private async monthlyListPrice(tx: Tx, roomId: string, on: LocalDate): Promise<number> {
    const { rows } = await tx.query<{ monthly_list_price_vnd: number }>(
      `SELECT monthly_list_price_vnd FROM room_list_price
        WHERE room_id = $1 AND effective_from <= $2::date ORDER BY effective_from DESC LIMIT 1`,
      [roomId, on],
    );
    return rows[0]?.monthly_list_price_vnd ?? 0;
  }
}
