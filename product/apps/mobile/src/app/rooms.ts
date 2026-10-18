// Room display uses the ONE shared helper `roomLabel()` of @ottimo/i18n (FE-B, BR-012, DS 11.3 – ORC 17/10:
// no app-specific label function). API shapes carry `roomName`; the helper reads `name` – this only maps
// the shape, it builds no text.
import type { RoomLike } from '@ottimo/i18n';

export function asRoom(r: { roomNo?: string | null; roomName?: string | null }): RoomLike {
  return { roomNo: r.roomNo, name: r.roomName };
}

/**
 * Guest on a housekeeping card – BR-614 (DOM 18/10, UXR P-33): "101 · Khách: Huy" = the card's room number +
 * `hk.guest_first_name` with the name; the number is never repeated; no name → nothing (the card shows "101").
 * ARC 18/10 (0.3.7 bổ sung 4): `currentGuest` is the NAME ONLY (call name for HK – the server's rule). A server
 * not yet updated still sends "Huy · 101": the room part is dropped so the card never reads "Huy · 101".
 * Never split a full name on the phone (VN = last word, foreign guests = surname – only the server knows which).
 */
export function guestName(r: { roomNo?: string | null; currentGuest?: string | null }): string {
  let g = (r.currentGuest ?? '').trim();
  const no = (r.roomNo ?? '').trim();
  if (no) {
    if (g.endsWith(`· ${no}`)) g = g.slice(0, -`· ${no}`.length).trim();
    if (g === no) g = '';
  }
  return g;
}
