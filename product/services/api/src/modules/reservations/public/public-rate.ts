/**
 * Public price ESTIMATE of a room type (BR-115, BR-116 v0.4.9 – FB-INV-009, gói LP-v2; ARC lp-v2-design 2.3;
 * DOM rounds/round-04/outputs/DOM/web-price-estimate-rules.md) – pure, no I/O, no clock.
 *
 * Same engine as the desk (coding-standards 1.1): the calendar of the DIRECT channel (`calendarRate`, BR-104), the
 * BR-107 tier (`losDiscountPct`, `applyNightDiscount`), the BR-110 extra persons (`extraPersons`), the BR-005
 * rounding units of `PricingService.load`. Nothing about bookings, holds or room statuses is an input (SEC SR-PE-04:
 * the estimate never depends on availability); only the OOO blocks of a room take it out of the type (DOM 2).
 *
 * The result is INTERNAL: it carries the "to" total and the room ids with a missing price (for the Desk snapshot
 * and the OWN warning). The public DTO is built from it by an explicit allowlist (public-site), never spread.
 */
import { divideRoundVnd } from '../../platform/public/money';
import { type LocalDate, addDays } from '../../../shared/time';
import {
  type Party,
  applyNightDiscount,
  applyPct,
  calendarRate,
  countedPersons,
  extraPersons,
  losDiscountPct,
  minStayNights,
  nightDates,
  nightsOf,
} from './pricing';
import type { PricingParams } from './pricing.service';

/** `web_estimate.parity_mode` (BR-116 (2)). */
export type ParityMode = 'ota_floor' | 'direct';

export interface PublicRateRoom {
  roomId: string;
  /** room_group.code – key of `ota_base_rate` (BR-103) for the BR-116 floor. */
  groupCode: string;
  baseOccupancy: number;
  maxOccupancy: number;
  /** room_list_price rows ordered by effectiveFrom (BR-101: nightly and monthly entered separately). */
  listPrices: ReadonlyArray<{ effectiveFrom: LocalDate; nightlyVnd: number; monthlyVnd: number }>;
  /** An OOO block (planned/active) overlaps a night of the stay → the room does not take part (DOM 2). */
  blocked: boolean;
}

export interface PublicRateParams {
  pricing: PricingParams;
  parityMode: ParityMode;
  /** `web_estimate.open_until` – last night with a confirmed calendar (BR-115 (6)); null = no limit. */
  openUntil: LocalDate | null;
  /** `lease_terms` (BR-201/202): the tier of the nearest LOWER term applies. */
  leaseTerms: ReadonlyArray<{ months: number; discountPct: number }>;
  /** `rounding.monthly_rent` (BR-005). */
  monthlyUnit: number;
}

export interface PublicRateRequest {
  /** `stayType` of the form. */
  stayType: 'short' | 'long';
  arrival: LocalDate;
  /** Short stay: required; long stay: null. */
  departure: LocalDate | null;
  months: number | null;
  party: Party;
}

export type PublicRateStatus = 'ok' | 'min_stay' | 'over_capacity' | 'not_open' | 'unavailable';

export interface ShortStayEstimate {
  nights: number;
  /** Public price of the nights BEFORE the BR-107 tier (calendar, floored by BR-116 when ota_floor). */
  roomSubtotalVnd: number;
  upliftNights: number;
  losDiscountPct: number;
  losDiscountVnd: number;
  extraPersonFeeVnd: number;
  /** "Từ" = the lowest room total of the type (BR-115 (2)). */
  totalVnd: number;
  nightlyAvgVnd: number;
  /** The highest room total – INTERNAL (SEC SR-PE-05: never in the public answer, Desk snapshot only). */
  toTotalVnd: number;
  /** Grouped detail of the "from" room: n nights × price (no dates – SEC SR-PE-17). INTERNAL. */
  lines: Array<{ nights: number; nightlyVnd: number }>;
}

export interface LongStayEstimate {
  months: number | null;
  /** Term discount of BR-201 applied (0 when the term is unknown). */
  termDiscountPct: number;
  monthlyFromVnd: number;
  /** INTERNAL (Desk snapshot only). */
  monthlyToVnd: number;
}

export interface PublicRateEstimate {
  status: PublicRateStatus;
  stayKind: 'short' | 'long';
  /** BR-113 minimum when `status = min_stay`. */
  minNights?: number;
  shortStay?: ShortStayEstimate;
  longStay?: LongStayEstimate;
  /** Short stay ≥ 28 nights answered as a long stay (BR-108). */
  longStayRequired?: boolean;
  /** Rooms skipped because a night has no list price (BR-115 (6)) – for the OWN warning, never public. */
  priceGapRoomIds: string[];
}

/** `date` + `months` calendar months (end of month clamps). */
export function addMonthsLocal(date: LocalDate, months: number): LocalDate {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(target.getUTCFullYear(), 4)}-${pad(target.getUTCMonth() + 1)}-${pad(Math.min(d, last))}`;
}

/** The stay range used for the OOO overlap of a request (long stay of unknown length: one month). */
export function stayRangeOf(r: PublicRateRequest): { from: LocalDate; to: LocalDate } {
  if (r.stayType === 'short' && r.departure) return { from: r.arrival, to: r.departure };
  return { from: r.arrival, to: addMonthsLocal(r.arrival, r.months ?? 1) };
}

function listOn(
  room: PublicRateRoom,
  date: LocalDate,
): { nightlyVnd: number; monthlyVnd: number } | null {
  let found: { nightlyVnd: number; monthlyVnd: number } | null = null;
  for (const p of room.listPrices) if (p.effectiveFrom <= date) found = p;
  return found;
}

/** BR-201/202: the discount of the nearest lower term (unknown term → none). */
export function termDiscountPct(
  months: number | null,
  terms: ReadonlyArray<{ months: number; discountPct: number }>,
): number {
  if (months === null) return 0;
  let best: { months: number; discountPct: number } | null = null;
  for (const t of terms) if (t.months <= months && (!best || t.months > best.months)) best = t;
  return best ? Number(best.discountPct) : 0;
}

interface RoomShort {
  roomId: string;
  subtotal: number;
  nightsPublic: number[];
  extra: number;
  total: number;
  uplift: number;
}

function priceShortRoom(
  p: PublicRateParams,
  room: PublicRateRoom,
  dates: LocalDate[],
  losPct: number,
  party: Party,
): RoomShort | 'gap' {
  const pr = p.pricing;
  const otaBase = pr.otaBaseRates[room.groupCode];
  if (p.parityMode === 'ota_floor' && (otaBase === undefined || otaBase <= 0)) return 'gap';
  const pre: number[] = [];
  const pub: number[] = [];
  let uplift = 0;
  for (const date of dates) {
    const list = listOn(room, date);
    if (!list || !(list.nightlyVnd > 0)) return 'gap';
    // 1–2. BR-101 list price of THAT night → BR-104 direct calendar, rounded (BR-005).
    const cal = calendarRate(list.nightlyVnd, date, 'direct', pr.calendar, pr.nightRateUnit);
    if (cal.uplift !== 'none') uplift += 1;
    // 3. BR-107 on the calendar price of the night.
    const disc = applyNightDiscount([cal.rateVnd], losPct, pr.nightRateUnit)[0] as number;
    // 4. BR-116 floor (ota_floor): the OTA price of the group that night, with the same uplift.
    const floor =
      p.parityMode === 'ota_floor'
        ? calendarRate(otaBase as number, date, 'ota', pr.calendar, pr.otaRateUnit).rateVnd
        : 0;
    pre.push(Math.max(cal.rateVnd, floor));
    pub.push(Math.max(disc, floor));
  }
  // 5. BR-110 per night, never discounted, never floored.
  const extra =
    extraPersons(party, room.baseOccupancy, {
      adultVnd: pr.extraAdultFeeVnd,
      child611Vnd: pr.child611FeeVnd,
    }).perNightVnd * dates.length;
  const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
  return {
    roomId: room.roomId,
    subtotal: sum(pre),
    nightsPublic: pub,
    extra,
    total: sum(pub) + extra,
    uplift,
  };
}

function linesOf(nights: number[]): Array<{ nights: number; nightlyVnd: number }> {
  const byPrice = new Map<number, number>();
  for (const n of nights) byPrice.set(n, (byPrice.get(n) ?? 0) + 1);
  return [...byPrice.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([nightlyVnd, count]) => ({ nights: count, nightlyVnd }));
}

/**
 * BR-115 estimate of one public room type for one request. `rooms` = the sellable rooms of the type (blocked ones
 * included – the capacity of the type does not depend on OOO, so an OOO block never reads as "too many guests").
 */
export function estimatePublicRate(
  p: PublicRateParams,
  rooms: readonly PublicRateRoom[],
  r: PublicRateRequest,
): PublicRateEstimate {
  const pr = p.pricing;
  const nights = r.departure ? nightsOf(r.arrival, r.departure) : null;
  const long =
    r.stayType === 'long' || (nights !== null && nights >= pr.longStayRequiredFromNights);
  const stayKind: 'short' | 'long' = long ? 'long' : 'short';
  const base = {
    stayKind,
    priceGapRoomIds: [] as string[],
    ...(long && r.stayType === 'short' ? { longStayRequired: true } : {}),
  };
  if (rooms.length === 0) return { ...base, status: 'unavailable' };
  // BR-110: counted persons (adults + children 6–11) above the largest room of the type.
  const persons = countedPersons(r.party);
  const fitting = rooms.filter((x) => x.maxOccupancy >= persons);
  if (fitting.length === 0) return { ...base, status: 'over_capacity' };

  if (long) {
    const months = r.stayType === 'long' ? r.months : null;
    const pct = termDiscountPct(months, p.leaseTerms);
    const gaps: string[] = [];
    const rents: number[] = [];
    for (const room of fitting) {
      if (room.blocked) continue;
      const list = listOn(room, r.arrival);
      if (!list || !(list.monthlyVnd > 0)) {
        gaps.push(room.roomId);
        continue;
      }
      rents.push(applyPct(list.monthlyVnd, 100 - pct, p.monthlyUnit));
    }
    if (rents.length === 0) return { ...base, priceGapRoomIds: gaps, status: 'unavailable' };
    return {
      ...base,
      priceGapRoomIds: gaps,
      status: 'ok',
      longStay: {
        months,
        termDiscountPct: pct,
        monthlyFromVnd: Math.min(...rents),
        monthlyToVnd: Math.max(...rents),
      },
    };
  }

  const departure = r.departure as LocalDate;
  const n = nights as number;
  // BR-113 without the orphan-night exception (it needs availability – DOM 3).
  const need = minStayNights(r.arrival, 'direct', pr.minStay, pr.calendar.specialDates);
  if (n < need) return { ...base, status: 'min_stay', minNights: need };
  // BR-115 (6): a night after the last confirmed calendar night → no number.
  if (p.openUntil !== null && addDays(departure, -1) > p.openUntil) {
    return { ...base, status: 'not_open' };
  }
  const dates = nightDates(r.arrival, departure);
  const losPct = losDiscountPct(n, pr.losTiers);
  const gaps: string[] = [];
  const priced: RoomShort[] = [];
  for (const room of fitting) {
    if (room.blocked) continue;
    const x = priceShortRoom(p, room, dates, losPct, r.party);
    if (x === 'gap') gaps.push(room.roomId);
    else priced.push(x);
  }
  if (priced.length === 0) return { ...base, priceGapRoomIds: gaps, status: 'unavailable' };
  const from = priced.reduce((a, b) => (b.total < a.total ? b : a));
  const to = priced.reduce((a, b) => (b.total > a.total ? b : a));
  const publicNights = from.nightsPublic.reduce((s, x) => s + x, 0);
  const losVnd = from.subtotal - publicNights;
  return {
    ...base,
    priceGapRoomIds: gaps,
    status: 'ok',
    shortStay: {
      nights: n,
      roomSubtotalVnd: from.subtotal,
      upliftNights: from.uplift,
      losDiscountPct: losVnd > 0 ? losPct : 0,
      losDiscountVnd: losVnd,
      extraPersonFeeVnd: from.extra,
      totalVnd: from.total,
      nightlyAvgVnd: divideRoundVnd(from.total, n, 1),
      toTotalVnd: to.total,
      lines: linesOf(from.nightsPublic),
    },
  };
}
