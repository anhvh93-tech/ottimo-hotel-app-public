/**
 * BR-417 appendix 5A (DOM 18/10, vòng sửa 5 – BUG-R2-160/161/162; ARC `openapi-0.3.7.md` 16.6 (a), 16.18): THE price
 * of a night added to a stay – B9a, B13, B18's extra night, `lateFeeAsNightVnd`, `currentBookingRateVnd`,
 * `extraNightDefaultRateVnd` and the nights an OTTIMO move adds (MovePlanner). Pure: the callers read the rooms'
 * calendars and the stay's nights; steps 3–4 of the appendix are here, step 1 (the room bought) is `boughtRoomOf`.
 */
import type { LocalDate } from '../../../shared/time';

/** Where the price of a night came from, recorded BY THE OPERATION (ARC 16.18) – never by comparing numbers. */
export type NightSource = 'calendar' | 'manual' | 'default' | 'ota_amount' | 'complimentary';

/** A room's calendar for the night (special date included) with its BR-105 bounds. */
export interface RoomRateOn {
  rateVnd: number;
  floorVnd: number;
  ceilingVnd: number;
}

/** A night of the stay as the reference search needs it (snapshot source + the room bought when typed). */
export interface SourcedNight {
  date: LocalDate;
  /** The typed price before the BR-107 tier (`calendarVnd` of the night). */
  calendarVnd: number;
  source: NightSource;
  /** Room bought when the price was typed (`manual` only); null/absent = the stay's origin room. */
  anchorRoomId?: string | null;
}

/**
 * Step 1 – ONE fallback for every command (BUG-R2-195: MovePlanner passed `null` while B13 passed the room now): a
 * stay that has never moved and stored no origin has the room it is in now (`roomNow`) as origin room – the
 * anchor of the nights typed at booking – and as the room bought. `view` = `stayRoomHistory` read as
 * `{ boughtRoomOf(history, originRoomId), originRoomId }`.
 */
export function stayRooms(
  view: { boughtRoomId: string | null; originRoomId: string | null },
  roomNow: string,
): { boughtRoomId: string; originRoomId: string };
export function stayRooms(
  view: { boughtRoomId: string | null; originRoomId: string | null },
  roomNow: string | null,
): { boughtRoomId: string | null; originRoomId: string | null };
export function stayRooms(
  view: { boughtRoomId: string | null; originRoomId: string | null },
  roomNow: string | null,
): { boughtRoomId: string | null; originRoomId: string | null } {
  const originRoomId = view.originRoomId ?? roomNow;
  return { originRoomId, boughtRoomId: view.boughtRoomId ?? originRoomId };
}

/**
 * Step 3 (DOM 18/10 – G-2, AN-48): which side the reference night is searched on is set by WHERE the added night
 * sits in the stay, not by the command – before the first night of the stay (B9a, MovePlanner moving the arrival
 * earlier) → `after` (the earliest typed night after it); otherwise (B13, B18, MovePlanner extending or moving
 * later) → `before` (the latest typed night before it). `nights` = the stay's nights before the operation.
 */
export function referenceSide(
  nights: ReadonlyArray<{ date: LocalDate }>,
  addedDate: LocalDate,
): 'before' | 'after' {
  const first = nights.reduce<LocalDate | null>(
    (min, n) => (min === null || n.date < min ? n.date : min),
    null,
  );
  return first !== null && addedDate < first ? 'after' : 'before';
}

/**
 * Step 3 – the reference night: the TYPED night (`manual`: at booking, S4-35, typed at B9a/B13/B18 – also the
 * suggested or calendar number) closest to the added night (`before`: the latest before it – B13/B18/MovePlanner
 * extending; `after`: the earliest after it – B9a, MovePlanner moving the arrival earlier – `referenceSide`), not on
 * a special date, typed while the room bought was `boughtRoomId`
 * (AN-34: the night need not be in the current room; AN-07: a guest move unbinds it). Default, calendar and
 * special-date nights are skipped (AN-22, AN-33, AN-35). Returns its typed price, null = none.
 */
export function referenceNightRate(
  nights: readonly SourcedNight[],
  addedDate: LocalDate,
  side: 'before' | 'after',
  boughtRoomId: string | null,
  originRoomId: string | null,
  isSpecial: (date: LocalDate) => boolean,
): number | null {
  const candidates = nights
    .filter((n) => (side === 'before' ? n.date < addedDate : n.date > addedDate))
    .filter((n) => n.source === 'manual' && !isSpecial(n.date))
    .filter((n) => (n.anchorRoomId ?? originRoomId) === boughtRoomId)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const n = side === 'before' ? candidates[candidates.length - 1] : candidates[0];
  return n ? n.calendarVnd : null;
}

/**
 * Steps 3–4: what the guest bought for the night (`special` → the bought room's special-date calendar; an agreed
 * stay with a reference night → that price; else the bought room's calendar) then:
 * - the night's room IS the room bought → clamp to that room's BR-105 bounds; the desk's range = those bounds;
 * - another room (OTTIMO chose it) → min(clamp(bought price, the bought room's bounds), the night room's calendar),
 *   never lifted to a floor; the desk's range spans both rooms (lower floor – higher ceiling).
 * `keep` (`currentBookingRateVnd`, AN-45): the price comes from an agreed reference or the min – by SOURCE; false =
 * the calendar of the night's room (no move or a guest move, special date in the room bought).
 */
export function addedNightPrice(i: {
  /** Calendar of the room bought on the night (special date included). */
  bought: RoomRateOn;
  /** Calendar of the room the night goes to. */
  night: RoomRateOn;
  sameRoom: boolean;
  special: boolean;
  /** The reference night's price of an agreed stay (null = none, or not an agreed stay). */
  referenceVnd: number | null;
}): { rateVnd: number; floorVnd: number; ceilingVnd: number; keep: boolean } {
  const fromReference = !i.special && i.referenceVnd !== null;
  const boughtVnd = fromReference ? (i.referenceVnd as number) : i.bought.rateVnd;
  const clamp = (v: number, b: RoomRateOn) => Math.min(b.ceilingVnd, Math.max(b.floorVnd, v));
  if (i.sameRoom) {
    return {
      rateVnd: clamp(boughtVnd, i.night),
      floorVnd: i.night.floorVnd,
      ceilingVnd: i.night.ceilingVnd,
      keep: fromReference,
    };
  }
  return {
    rateVnd: Math.min(clamp(boughtVnd, i.bought), i.night.rateVnd),
    floorVnd: Math.min(i.bought.floorVnd, i.night.floorVnd),
    ceilingVnd: Math.max(i.bought.ceilingVnd, i.night.ceilingVnd),
    keep: true,
  };
}
