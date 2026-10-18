/**
 * ONE calculation of the money of a room move (OpenAPI 0.3.7 bổ sung D1 – ARC 10.4, critic #10; S4-04, S4-05,
 * S4-07, S4-21). B7/B8/B7a (`previewMoveReservation`, `moveReservation`, `assignRoom`) and B14 (`changeRoom`
 * dryRun and write) call `planBooking()` – the preview inside a read-only transaction, the write after the locks –
 * and the write applies EXACTLY the nights the plan returns (the folio only posts what the plan says; no second
 * pricing branch anywhere). Per booking and per night:
 *
 * - Price (BR-429 (a)–(c), (g), (h); BR-424; BR-106/107; `room_move_pricing`):
 *   guest request + another room → every moved night takes the CURRENT calendar of the new room (BR-104, the
 *   booking's channel), BR-107 re-tiered on the final number of nights, both ways; a typed/agreed price does not
 *   travel (g) – flagged `MANUAL_RATE_REPRICED` with a same-% suggestion (NÊN). OTTIMO causes and `other`: booked
 *   prices kept (dates-only changes: kept nights keep their calendar, new nights take today's calendar, re-tier);
 *   v0.3.8: a night added in an OTTIMO room move takes the OLD room's calendar (b1). A booking made from a quote
 *   carries its BR-111 return-guest % – re-pricing takes the better of it and the BR-107 tier (a1).
 *   OTA: OTA price kept; guest request → `room_change_difference` per night = max(0, direct(new) − direct(ORIGIN
 *   room)), the live differences from the first moved night are reversed and re-posted (never cumulative);
 *   an OTTIMO move keeps every line. A manual long stay (`externalContract`) is never re-priced (h).
 * - BR-110 fee per night (BR-429 v0.3.4, BR-424): guest request → the new room's standard occupancy; OTTIMO
 *   (property_fault, overbooking, upgrade, inventory_optimize, other, B7a) → min(old fee, new fee) = the fee at
 *   max(old base, new base), kept on the night (`stay_night.extra_person_base`) so a later change of the people
 *   keeps the protection; v0.3.8 (b2): never above the fee the night carries now (a typed fee included).
 *   OTA: above max(base, OTA guest count) (`nightExtra`).
 *
 * Pure reads only: nothing here writes (the preview runs it in a READ ONLY transaction – SEC A3).
 */
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import type { LocalDate } from '../../../shared/time';
import { divideRoundVnd } from '../../platform/public/money';
import { ParameterMissingError } from '../../platform/public/parameter.service';
import {
  type ChannelGroup,
  type ReturnGuestDiscount,
  calendarRate,
  discountedNight,
  effectiveDiscountPct,
  isSpecialDate,
  losDiscountPct,
  nightDates,
  rateBounds,
  returnGuestOf,
} from '../public/pricing';
import { PricingService } from '../public/pricing.service';
import type { BookingContext } from './booking-context';
import {
  addedNightPrice,
  referenceNightRate,
  type SourcedNight,
} from '../public/added-night-price';
import {
  boughtRoomOf,
  firstRoomOf,
  protectedBaseOf,
  roomChangeHistory,
  stayRoomHistory,
} from './room-history';
import type { ReservationRow } from './reservation-store';

/** Who made the room move (BR-429 (a)/(b)): only `guest_request` is the guest's. */
export type MoveCause = 'guest' | 'ottimo';

export function moveCauseOf(reasonCode: string): MoveCause {
  return reasonCode === 'guest_request' ? 'guest' : 'ottimo';
}

export type PricingBasis = 'new_room_rate' | 'keep_booked_rate' | 'external_contract';

/** The rooms the planner needs (a subset of ReservationsService.RoomInfo). */
export interface PlanRoom {
  id: string;
  room_no: string;
  base_occupancy: number;
}

export interface PlanNight {
  reservationId: string;
  date: LocalDate;
  /** New night of the booking (B7 date change). */
  added: boolean;
  /** Room of the night after the move (null = still unassigned). */
  roomId: string | null;
  roomChanged: boolean;
  /** Gross before (null = added night) and after (stay_night.room_revenue_gross_vnd). */
  oldGrossVnd: number | null;
  newGrossVnd: number;
  /** Calendar price to keep on the night (DOM D-8), null for OTA/internal nights. */
  calendarVnd: number | null;
  /** Typed price kept (never re-tiered) – snapshot `source: manual`. */
  manual: boolean;
  /** BR-429 (g): a typed/agreed price replaced by the new room's calendar (`MANUAL_RATE_REPRICED`). */
  manualRepriced: boolean;
  /**
   * ARC 16.18 – the snapshot source the write records: `kept` = as before (a typed night keeps `manual` and its
   * anchor), `calendar` = re-priced to a calendar (guest request), `default` = an added night priced by the
   * BR-417 appendix 5A function (OTTIMO operation – AN-46).
   */
  priceSource: 'kept' | 'calendar' | 'default';
  suggestedRateVnd?: number;
  /** BR-110 fee + count before and after; `feeBase` = stay_night.extra_person_base to store (null = room's). */
  oldFeeVnd: number;
  feeVnd: number;
  feeCount: number;
  feeBase: number | null;
  /** OTA `room_change_difference` of the night before (live lines) and after. */
  oldDiffVnd: number;
  diffVnd: number;
  /** BR-434 (BE-B allocation): approved FOC/discount the night carries after the move (room + fee). */
  focVnd: number;
  /** BR-434 / S4-18: pending FOC that follows the night ("khi duyệt sẽ áp") – not in the folio delta. */
  pendingFocVnd: number;
}

export interface BookingMovePlan {
  reservationId: string;
  basis: PricingBasis;
  /**
   * % in force on the final stay (direct/agent, 0 otherwise): the BR-107 tier, or the BR-111 return-guest % when
   * better (BR-429 (a1) v0.3.8 – never both unless the quote stacked them). Stored as `losDiscountPct`.
   */
  losPct: number;
  /** BR-107 tier of the final number of nights (0 for OTA/internal/manual long stays). */
  tierPct: number;
  /** BR-111 % applied on the re-priced nights (0 = none or the tier is better) – `MovePreview.returningGuestDiscountPct`. */
  returningGuestPct: number;
  /** Nights from the first moved night, in date order (B7: every night of the final stay). */
  nights: PlanNight[];
  /** Nights the change drops (B7/B8 dates), with what they carried. */
  removed: Array<{ date: LocalDate; grossVnd: number; feeVnd: number; diffVnd: number }>;
  /** Live OTA difference lines reversed by this move (guest request) – ids for the write. */
  diffLinesToReverse: string[];
  /** Origin room to store on the first move (BR-424) – null = keep what the booking has. */
  originRoomId: string | null;
  roomOldVnd: number;
  roomNewVnd: number;
  feeOldVnd: number;
  feeNewVnd: number;
  diffOldVnd: number;
  diffNewVnd: number;
  /** Σ change of the booking's folio lines before FOC (room + fee + OTA difference; OTA room nights excluded). */
  linesDeltaVnd: number;
  /** FOC/discount applied on the booking's room + fee lines now (folio) and after the move (BE-B allocation). */
  focOldVnd: number;
  focNewVnd: number;
  /** What the guest's folio changes by: lines − (FOC after − FOC now). Preview = write (ARC 10.4, S4-04). */
  folioDeltaVnd: number;
}

export interface PlanInput {
  row: ReservationRow;
  flow: 'B7' | 'B14';
  cause: MoveCause;
  /** First night that moves (B7: min(old, new arrival) – every night; B14: the effective date). */
  fromDate: LocalDate;
  /** Final stay of the booking after the move (B14: unchanged). */
  arrival: LocalDate;
  departure: LocalDate;
  /** Room of the moved nights; null = the room does not change. */
  newRoom: PlanRoom | null;
  /**
   * Conflict booking without a room (B7a, B7 with `overbookingResolution`): the room the OTA guest booked –
   * base of the "old" BR-110 fee, and the origin room when OTTIMO upgrades (BR-424 "căn trước nâng hạng").
   */
  requested?: { room: PlanRoom | null; upgraded: boolean } | undefined;
}

/** What the planner reads through the reservations service (no import cycle). */
export interface PlannerDeps {
  room(tx: Tx, roomId: string): Promise<PlanRoom | null>;
  roomListPrices(
    tx: Tx,
    roomId: string,
  ): Promise<Array<{ effectiveFrom: LocalDate; nightlyVnd: number }>>;
  nightExtra(
    ctx: BookingContext,
    row: ReservationRow,
    party: { adults: number; children6to11: number; childrenUnder6: number },
    baseOccupancy: number,
  ): { feeVnd: number; count: number };
  parameter<T>(tx: Tx, key: string, asOf: LocalDate): Promise<T>;
  /** Live `room_change_difference` lines of the booking (folio, BE-B – read only). */
  differenceLines(
    tx: Tx,
    row: Pick<ReservationRow, 'id' | 'folio_id'>,
  ): Promise<Array<{ id: string; serviceDate: LocalDate | null; amountVnd: number }>>;
  /**
   * BE-B (S4-02/18/23): FOC/discounts every night of the booking carries after the change – the SAME allocation
   * as the folio sync (never computed here).
   */
  reductions(
    tx: Tx,
    row: Pick<ReservationRow, 'id' | 'folio_id'>,
    nights: ReadonlyArray<{
      date: LocalDate;
      roomVnd: number;
      extraPersonVnd: number;
      differenceVnd?: number;
    }>,
  ): Promise<{
    byDate: Map<LocalDate, { focVnd: number; pendingVnd: number }>;
    oldAppliedVnd: number;
    newAppliedVnd: number;
  }>;
}

interface NightRow {
  id: string;
  date: LocalDate;
  gross: number;
  calendar: number | null;
  room_id: string | null;
  fee: number | null;
  cnt: number | null;
  fee_base: number | null;
  room_base: number | null;
}

const NO_RETURN: ReturnGuestDiscount = { pct: 0, stacked: false };

export class MovePlanner {
  constructor(private readonly deps: PlannerDeps) {}

  /** `room_move_pricing.guestRequest` (0059 catalogue, INV ESC-019 A): `new_room_rate` unless OWN changed it. */
  async guestRequestPolicy(
    tx: Tx,
    ctx: BookingContext,
  ): Promise<'new_room_rate' | 'keep_booked_rate'> {
    try {
      const v = await this.deps.parameter<{ guestRequest?: string }>(
        tx,
        'room_move_pricing',
        ctx.today,
      );
      return v?.guestRequest === 'keep_booked_rate' ? 'keep_booked_rate' : 'new_room_rate';
    } catch (err) {
      if (err instanceof ParameterMissingError) return 'new_room_rate';
      throw err;
    }
  }

  /** Current calendar price of a room on a date for a channel group (BR-104; direct for OTA differences). */
  private async calendar(
    tx: Tx,
    ctx: BookingContext,
    cache: Map<string, Array<{ effectiveFrom: LocalDate; nightlyVnd: number }>>,
    roomId: string,
    date: LocalDate,
    group: ChannelGroup,
  ): Promise<number> {
    let list = cache.get(roomId);
    if (!list) {
      list = await this.deps.roomListPrices(tx, roomId);
      cache.set(roomId, list);
    }
    const base = PricingService.listPriceOn({ roomId, baseOccupancy: 0, listPrices: list }, date);
    if (base === null) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }],
        detail: 'room has no list price for the night',
      });
    }
    const p = ctx.params;
    return calendarRate(base, date, group, p.calendar, p.nightRateUnit).rateVnd;
  }

  /** BR-105 floor–ceiling of a room on a date (the desk's bounds – StaySupport.directRate, PricingService). */
  private async bounds(
    tx: Tx,
    ctx: BookingContext,
    cache: Map<string, Array<{ effectiveFrom: LocalDate; nightlyVnd: number }>>,
    roomId: string,
    date: LocalDate,
  ): Promise<{ floorVnd: number; ceilingVnd: number }> {
    const p = ctx.params;
    const { rows } = await tx.query<{ code: string }>(
      'SELECT rg.code FROM room rm JOIN room_group rg ON rg.id = rm.room_group_id WHERE rm.id = $1',
      [roomId],
    );
    const groupBase = rows[0] ? p.otaBaseRates[rows[0].code] : undefined;
    if (groupBase !== undefined) {
      return rateBounds(groupBase, p.rateFloorPct, p.rateCeilingPct, p.otaRateUnit);
    }
    let list = cache.get(roomId);
    if (!list) {
      list = await this.deps.roomListPrices(tx, roomId);
      cache.set(roomId, list);
    }
    const base =
      PricingService.listPriceOn({ roomId, baseOccupancy: 0, listPrices: list }, date) ?? 0;
    return rateBounds(base, p.rateFloorPct, p.rateCeilingPct, p.nightRateUnit);
  }

  /** Σ current direct calendar of a room over dates – `other` to a pricier room needs FDL+ (BR-429 (b)). */
  async directTotal(
    tx: Tx,
    ctx: BookingContext,
    roomId: string,
    dates: readonly LocalDate[],
  ): Promise<number> {
    const cache = new Map<string, Array<{ effectiveFrom: LocalDate; nightlyVnd: number }>>();
    let sum = 0;
    for (const d of dates) sum += await this.calendar(tx, ctx, cache, roomId, d, 'direct');
    return sum;
  }

  /** The origin room of the OTA difference (BR-424 v0.3.5). */
  async originRoom(
    tx: Tx,
    row: ReservationRow,
    input: Pick<PlanInput, 'requested' | 'newRoom'>,
  ): Promise<{ id: string | null; storeOnMove: string | null }> {
    if (row.origin_room_id) return { id: row.origin_room_id, storeOnMove: null };
    // S438-REGR-02: moved before 0059 (or by a path that did not store it) – the room history knows the first room.
    const historic = firstRoomOf(await roomChangeHistory(tx, row.id));
    if (historic) return { id: historic, storeOnMove: historic };
    const { rows } = await tx.query<{ room_id: string | null }>(
      `SELECT room_id FROM reservation_segment WHERE reservation_id = $1 AND active
        ORDER BY from_date LIMIT 1`,
      [row.id],
    );
    const first = rows[0]?.room_id ?? null;
    if (first) return { id: first, storeOnMove: first };
    // A conflict booking without a room: its assigned room (same group) or, upgraded by OTTIMO, the room booked.
    const r = input.requested;
    const origin = r?.upgraded && r.room ? r.room.id : (input.newRoom?.id ?? r?.room?.id ?? null);
    return { id: origin, storeOnMove: origin };
  }

  async planBooking(tx: Tx, ctx: BookingContext, input: PlanInput): Promise<BookingMovePlan> {
    const { row } = input;
    const group = row.channel_group;
    const ota = group === 'ota';
    const external = row.external_contract;
    const tiered = (group === 'direct' || group === 'agent') && !external;
    const unit =
      (row.pricing_snapshot as { nightRateUnit?: number }).nightRateUnit ??
      ctx.params.nightRateUnit;
    const snapEntries = (
      (
        row.pricing_snapshot as {
          nights?: Array<{ date: string; source?: string; anchorRoomId?: string | null }>;
        }
      ).nights ?? []
    ).map((n) => [n.date, n] as const);
    const snapNights = new Map(snapEntries.map(([d, n]) => [d, n.source]));
    const snapAnchor = new Map(snapEntries.map(([d, n]) => [d, n.anchorRoomId ?? null]));
    const snap = row.pricing_snapshot as {
      extraPersonFeePerNightVnd?: number;
      extraCount?: number;
    };
    const { rows: live } = await tx.query<NightRow>(
      `SELECT n.id, n.stay_date::text AS date, n.room_revenue_gross_vnd AS gross, n.calendar_rate_vnd AS calendar,
              n.room_id, n.extra_person_fee_vnd AS fee, n.extra_person_count AS cnt,
              n.extra_person_base AS fee_base, rm.base_occupancy AS room_base
         FROM stay_night n LEFT JOIN room rm ON rm.id = n.room_id
        WHERE n.reservation_id = $1 AND n.night_state <> 'void' ORDER BY n.stay_date`,
      [row.id],
    );
    const byDate = new Map(live.map((n) => [n.date, n]));
    const roomChanges = input.newRoom !== null;
    const policy = input.cause === 'guest' ? await this.guestRequestPolicy(tx, ctx) : null;
    const basis: PricingBasis = external
      ? 'external_contract'
      : input.cause === 'guest' && roomChanges && policy === 'new_room_rate'
        ? 'new_room_rate'
        : 'keep_booked_rate';
    const repriceToNewRoom = basis === 'new_room_rate' && tiered;
    const cache = new Map<string, Array<{ effectiveFrom: LocalDate; nightlyVnd: number }>>();

    // Nights of the final stay that the plan covers, and the dropped ones (B7/B8 only).
    // A manual long stay (BR-429 (h)) has no priced nights to add or drop – only the ones it has move rooms.
    const finalDates = external
      ? live.map((n) => n.date)
      : nightDates(input.arrival, input.departure);
    const inScope = finalDates.filter((d) => d >= input.fromDate);
    const removedRows = live.filter((n) => !finalDates.includes(n.date));
    // BR-107 tier of the final stay (direct/agent). Kept nights are re-tiered only when the % changes (B7/B8
    // number of nights) or the night is re-priced; otherwise their gross stays exactly as booked.
    // BR-429 (a1) v0.3.8 (DOM-S4-03): the return-guest % of a booking made from a quote is applied again on every
    // re-pricing – the better of it and the tier, not stacked.
    const ret: ReturnGuestDiscount = tiered ? returnGuestOf(row.pricing_snapshot) : NO_RETURN;
    const tierPct = tiered ? losDiscountPct(finalDates.length, ctx.params.losTiers) : 0;
    const losPct = tiered ? effectiveDiscountPct(tierPct, ret) : 0;
    const currentPct =
      (row.pricing_snapshot as { losDiscountPct?: number }).losDiscountPct ??
      (tiered ? effectiveDiscountPct(losDiscountPct(live.length, ctx.params.losTiers), ret) : 0);
    const retier = tiered && losPct !== currentPct;
    const price = (calendarVnd: number) => discountedNight(calendarVnd, tierPct, ret, unit);
    // S438-REGR-03: a night without a stored base (before 0059, or added later by B13/B9a/B18) keeps the base the
    // booking's OTTIMO moves protected (room history), never less than its room's.
    const histBase = live.some((n) => n.fee_base === null)
      ? protectedBaseOf(await roomChangeHistory(tx, row.id))
      : null;
    const curEff = (n: NightRow): number | null =>
      n.fee_base ??
      (histBase !== null && n.room_base !== null ? Math.max(histBase, n.room_base) : n.room_base);
    const keptRows = live.filter((n) => finalDates.includes(n.date));
    const keptEff = keptRows.map(curEff).filter((x): x is number => x !== null);
    // Base of an added night / of a night without a room: what the booking had (B7 – one room), else the room
    // the OTA guest booked (conflict booking).
    const bookingEff =
      keptEff.length > 0
        ? Math.max(...keptEff)
        : (removedRows.map(curEff).find((x): x is number => x !== null) ??
          input.requested?.room?.base_occupancy ??
          null);
    const currentRoomBase =
      [...keptRows, ...removedRows].map((n) => n.room_base).find((x) => x !== null) ?? null;
    // Room of an added night when the room does not change: the booking's (B7 – one segment).
    const currentRoomId = live.map((n) => n.room_id).find((x) => x !== null) ?? null;
    const party = {
      adults: row.adults,
      children6to11: row.children_6_11,
      childrenUnder6: row.children_under_6,
    };
    const ownFee = (n: NightRow) => n.fee ?? snap.extraPersonFeePerNightVnd ?? 0;
    const shortStay = row.stay_type === 'short' && !external;

    // OTA difference against the origin room (BR-424 v0.3.5, BR-429 (c)).
    const diffLines = ota && row.folio_id ? await this.deps.differenceLines(tx, row) : [];
    const liveDiff = new Map<string, number>();
    for (const l of diffLines) {
      if (!l.serviceDate || l.serviceDate < input.fromDate) continue;
      liveDiff.set(l.serviceDate, (liveDiff.get(l.serviceDate) ?? 0) + l.amountVnd);
    }
    const repostDiff = ota && basis === 'new_room_rate';
    const origin = await this.originRoom(tx, row, input);
    // BR-417 appendix 5A step 1 (AN-46, BR-429 (b1') – DOM 18/10 vòng sửa 5): the room the guest bought before this
    // change, over the whole stay; an OTTIMO operation never changes it (null = never moved: the room now).
    const stayView = tiered ? await stayRoomHistory(tx, row.id) : null;
    const boughtBefore = stayView ? boughtRoomOf(stayView.history, stayView.originRoomId) : null;
    // Step 3: an agreed stay (typed at booking) prices from its reference night – the typed nights with their source.
    const agreed =
      (row.pricing_snapshot as { bookingRateSource?: string }).bookingRateSource ===
        'manual_agreed' && row.stay_type === 'short';
    const sourced: SourcedNight[] = live.map((n) => ({
      date: n.date,
      calendarVnd: n.calendar ?? n.gross,
      source: (snapNights.get(n.date) ?? 'calendar') as SourcedNight['source'],
      anchorRoomId: snapAnchor.get(n.date) ?? null,
    }));
    const special = (d: LocalDate) => isSpecialDate(d, ctx.params.calendar.specialDates);

    const nights: PlanNight[] = [];
    for (const date of inScope) {
      const n = byDate.get(date);
      const added = !n;
      const oldRoom = n ? n.room_id : currentRoomId;
      const roomId = input.newRoom ? input.newRoom.id : oldRoom;
      const roomChanged = input.newRoom !== null && input.newRoom.id !== oldRoom;

      // ── price (direct/agent only: OTA, internal and manual long stays keep the booked price) ──
      let calendarVnd: number | null = n?.calendar ?? null;
      let manual = n ? snapNights.get(date) === 'manual' : false;
      let manualRepriced = false;
      let priceSource: PlanNight['priceSource'] = 'kept';
      let suggestedRateVnd: number | undefined;
      let newGross = n?.gross ?? 0;
      if (tiered) {
        if (repriceToNewRoom || added) {
          // BR-429 (b1) v0.3.8 bổ sung 18/10 (BUG-R2-134 – replaces DOM-S4-01 "the OLD room's calendar"): a night
          // added while the guest is (or is being put) in a room OTTIMO chose (OTTIMO causes, `other`,
          // `force_majeure`, or an earlier OTTIMO move) costs min(the calendar of the room the guest bought, the
          // calendar of the room of the night) – never more because OTTIMO picked a pricier room, the cheaper
          // room's when OTTIMO picked a cheaper one. Guest request to another room: the new room's.
          const target = roomId ?? oldRoom;
          if (!target) throw new Error(`night ${date} of ${row.code} has no room to price`);
          let fresh = await this.calendar(tx, ctx, cache, target, date, group);
          priceSource = 'calendar';
          if (!repriceToNewRoom && input.cause === 'ottimo') {
            // BR-417 appendix 5A (AN-46, BR-429 (b1')): a night an OTTIMO operation adds is priced like B13 – what the
            // guest bought (reference night of an agreed stay, else the bought room's calendar), min with the
            // night's room when OTTIMO chose another one. A guest request takes the current calendar (AN-47).
            const bought = boughtBefore ?? oldRoom ?? target;
            const nightRate = {
              rateVnd: fresh,
              ...(await this.bounds(tx, ctx, cache, target, date)),
            };
            const boughtRate =
              bought === target
                ? nightRate
                : {
                    rateVnd: await this.calendar(tx, ctx, cache, bought, date, group),
                    ...(await this.bounds(tx, ctx, cache, bought, date)),
                  };
            fresh = addedNightPrice({
              bought: boughtRate,
              night: nightRate,
              sameRoom: bought === target,
              special: special(date),
              referenceVnd: agreed
                ? referenceNightRate(
                    sourced,
                    date,
                    'before',
                    bought,
                    stayView?.originRoomId ?? null,
                    special,
                  )
                : null,
            }).rateVnd;
            priceSource = 'default';
          }
          if (repriceToNewRoom && n && oldRoom) {
            // BR-429 (g): a night whose price is not the old room's current calendar (typed/agreed price, or an
            // older calendar) now takes the new room's – flagged, with the same-% suggestion (NÊN).
            const oldNow = await this.calendar(tx, ctx, cache, oldRoom, date, group);
            const before = n.calendar ?? n.gross;
            if (manual || before !== oldNow) {
              manualRepriced = true;
              suggestedRateVnd = divideRoundVnd(fresh * before, oldNow, unit);
            }
          }
          calendarVnd = fresh;
          manual = false;
          newGross = price(fresh);
        } else if (retier && n) {
          // BR-107 v0.3.8 (S4-38, S438-MOVE-05): a typed price is the night's calendar price – the new tier applies
          // on it too (the typed calendar is kept, `manual` stays for BR-429 (g)).
          calendarVnd = n.calendar ?? n.gross;
          newGross = price(calendarVnd);
        }
      }

      // ── BR-110 fee (short stays; kept nights that do not change room keep theirs) ──
      let oldFee = 0;
      let feeVnd = 0;
      let feeCount = 0;
      let feeBase: number | null = null;
      if (n) {
        oldFee = shortStay ? ownFee(n) : 0;
        feeVnd = oldFee;
        feeCount = n.cnt ?? (n.fee === null || n.fee > 0 ? (snap.extraCount ?? 0) : 0);
        feeBase = n.fee_base;
      }
      if (shortStay && (roomChanged || added)) {
        const was = (n ? curEff(n) : null) ?? bookingEff;
        const roomBase = input.newRoom ? input.newRoom.base_occupancy : currentRoomBase;
        let eff: number | null;
        if (roomChanged) {
          const nb = input.newRoom?.base_occupancy ?? null;
          // guest request → the new room's standard; OTTIMO → never more than before (max of the bases).
          eff = input.cause === 'guest' || was === null || nb === null ? nb : Math.max(was, nb);
        } else {
          eff = was ?? roomBase;
        }
        if (eff !== null) {
          const x = this.deps.nightExtra(ctx, row, party, eff);
          // BR-429 (b2) v0.3.8 (DOM-S4-02): an OTTIMO move never charges a night more than it carries now – the
          // fee typed by the desk (S4-35) included: min(fee recorded, fee at the protected base).
          // A night without a room yet (conflict booking, B7a) carries no fee to keep.
          const keepRecorded =
            input.cause === 'ottimo' && n !== undefined && n.room_id !== null && oldFee < x.feeVnd;
          if (!keepRecorded) {
            feeVnd = x.feeVnd;
            feeCount = x.count;
          }
          // Stored explicitly on every re-based night (S4-38): NULL now only means "never moved since 0059".
          feeBase = eff;
        }
      }

      // ── OTA difference ──
      const oldDiffVnd = liveDiff.get(date) ?? 0;
      let diffVnd = oldDiffVnd;
      if (repostDiff && roomId && origin.id) {
        const fresh = await this.calendar(tx, ctx, cache, roomId, date, 'direct');
        const base = await this.calendar(tx, ctx, cache, origin.id, date, 'direct');
        diffVnd = Math.max(0, fresh - base);
      }

      nights.push({
        reservationId: row.id,
        date,
        added,
        roomId,
        roomChanged,
        oldGrossVnd: n ? n.gross : null,
        newGrossVnd: newGross,
        calendarVnd,
        manual,
        manualRepriced,
        priceSource,
        ...(suggestedRateVnd !== undefined ? { suggestedRateVnd } : {}),
        oldFeeVnd: oldFee,
        feeVnd,
        feeCount,
        feeBase,
        oldDiffVnd,
        diffVnd,
        focVnd: 0,
        pendingFocVnd: 0,
      });
    }
    const removed = removedRows.map((n) => ({
      date: n.date,
      grossVnd: n.gross,
      feeVnd: shortStay ? ownFee(n) : 0,
      diffVnd: liveDiff.get(n.date) ?? 0,
    }));
    const sum = (xs: number[]) => xs.reduce((a, x) => a + x, 0);
    const roomOldVnd =
      sum(nights.map((x) => x.oldGrossVnd ?? 0)) + sum(removed.map((x) => x.grossVnd));
    const roomNewVnd = sum(nights.map((x) => x.newGrossVnd));
    const feeOldVnd = sum(nights.map((x) => x.oldFeeVnd)) + sum(removed.map((x) => x.feeVnd));
    const feeNewVnd = sum(nights.map((x) => x.feeVnd));
    const diffOldVnd = sum([...liveDiff.values()]);
    const diffNewVnd = sum(nights.map((x) => x.diffVnd));
    const linesDeltaVnd =
      (ota ? 0 : roomNewVnd - roomOldVnd) + (feeNewVnd - feeOldVnd) + (diffNewVnd - diffOldVnd);
    // FOC / special discounts that follow the re-priced lines – BE-B's allocation on EVERY night of the booking
    // after the move (the nights before the move night keep their values), BR-434 min(approved, new line).
    const planned = new Map(nights.map((x) => [x.date, x]));
    // S438-FOC-04: the difference of each night after the move (planned, else the live lines of the night).
    const diffNow = new Map<string, number>();
    for (const l of diffLines) {
      if (l.serviceDate)
        diffNow.set(l.serviceDate, (diffNow.get(l.serviceDate) ?? 0) + l.amountVnd);
    }
    const after = finalDates.map((date) => {
      const p = planned.get(date);
      const n = byDate.get(date);
      return {
        date,
        roomVnd: p ? p.newGrossVnd : (n?.gross ?? 0),
        extraPersonVnd: p ? p.feeVnd : n && shortStay ? ownFee(n) : 0,
        differenceVnd: p ? p.diffVnd : (diffNow.get(date) ?? 0),
      };
    });
    const foc = await this.deps.reductions(tx, row, after);
    for (const x of nights) {
      const f = foc.byDate.get(x.date);
      x.focVnd = f?.focVnd ?? 0;
      x.pendingFocVnd = f?.pendingVnd ?? 0;
    }
    return {
      reservationId: row.id,
      basis,
      losPct,
      tierPct,
      returningGuestPct: ret.stacked || ret.pct > tierPct ? ret.pct : 0,
      nights,
      removed,
      diffLinesToReverse: repostDiff
        ? diffLines.filter((l) => l.serviceDate && l.serviceDate >= input.fromDate).map((l) => l.id)
        : [],
      originRoomId: roomChanges ? origin.storeOnMove : null,
      roomOldVnd,
      roomNewVnd,
      feeOldVnd,
      feeNewVnd,
      diffOldVnd,
      diffNewVnd,
      linesDeltaVnd,
      focOldVnd: foc.oldAppliedVnd,
      focNewVnd: foc.newAppliedVnd,
      folioDeltaVnd: linesDeltaVnd - (foc.newAppliedVnd - foc.oldAppliedVnd),
    };
  }
}
