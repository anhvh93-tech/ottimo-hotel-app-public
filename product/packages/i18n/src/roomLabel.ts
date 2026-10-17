/**
 * Room display (BR-012, DS v0.4.1 §11.3) – ONE helper for Desk and PWA/guest-web (no screen builds its own).
 *
 * - `staff` → "401 · The Pine" (number first – lists are sorted by number); no name yet → "401".
 * - `guest` → the room name only ("The Pine"), never the number. Booking not told its room yet
 *   (`disclosed: false` – OTA group / rooms still being optimised, BR-316/BR-429) → public room type
 *   ("Studio"). No name entered yet (OWN fills H04) → `fallback(roomNo)` (UXD `gw.room_fallback`
 *   "room {no}" / "phòng {no}" – passed in so this helper carries no UI text), else the number.
 *
 * Names are read from the room catalogue at display time (`Room.name`, `RoomStatusEntry.roomName`…); a
 * settled folio / signed contract keeps the name it had then (`Bill.roomName`) – callers pass that one.
 */
export interface RoomLike {
  roomNo?: string | null;
  /** `Room.name` / `roomName` – "The Pine". */
  name?: string | null;
  /** `Room.publicRoomType` / `GuestStay.publicRoomType` – "Studio". */
  publicRoomType?: string | null;
}

export type RoomAudience = 'guest' | 'staff';

export interface RoomLabelOptions {
  /** Guest side: the booking has been told its room (`Reservation.roomDisclosedToGuest`). Default true. */
  disclosed?: boolean;
  /** Guest side: text when the room has no name yet (UXD `gw.room_fallback`). */
  fallback?: (roomNo: string) => string;
  /** Staff side separator (DS: " · "). */
  separator?: string;
}

const clean = (s: string | null | undefined) => (s ?? '').trim();

export function roomLabel(
  room: RoomLike | null | undefined,
  audience: RoomAudience,
  opts: RoomLabelOptions = {},
): string {
  const no = clean(room?.roomNo);
  const name = clean(room?.name);
  if (audience === 'staff') {
    if (no && name) return `${no}${opts.separator ?? ' · '}${name}`;
    return no || name;
  }
  const type = clean(room?.publicRoomType);
  if (opts.disclosed === false) return type || '';
  if (name) return name;
  if (no) return opts.fallback ? opts.fallback(no) : no;
  return type;
}

/** Lower-case, accents removed, spaces collapsed – "The Pine", "the  pine", "THE PINE" compare equal. */
function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
const core = (s: string) => s.replace(/^the /, '');

/**
 * Room picker / search (DS §11.3): "401", "pine", "The Pine" or "the pi" all find 401 · The Pine
 * (case-insensitive, the leading "The" optional). The number matches from its start ("40" → 401, 402).
 */
export function roomMatches(room: RoomLike, query: string): boolean {
  const q = fold(query);
  if (!q) return true;
  const no = clean(room.roomNo).toLowerCase();
  if (no && no.startsWith(q)) return true;
  const name = fold(clean(room.name));
  if (!name) return false;
  return name.startsWith(q) || core(name).includes(core(q));
}

/** Staff list order: by room number (numeric where possible), unassigned last. */
export function compareRoomNo(a?: string | null, b?: string | null): number {
  if (!a) return b ? 1 : 0;
  if (!b) return -1;
  return a.localeCompare(b, undefined, { numeric: true });
}
