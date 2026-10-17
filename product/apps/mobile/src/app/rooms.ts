// Room display uses the ONE shared helper `roomLabel()` of @ottimo/i18n (FE-B, BR-012, DS 11.3 – ORC 17/10:
// no app-specific label function). API shapes carry `roomName`; the helper reads `name` – this only maps
// the shape, it builds no text.
import type { RoomLike } from '@ottimo/i18n';

export function asRoom(r: { roomNo?: string | null; roomName?: string | null }): RoomLike {
  return { roomNo: r.roomNo, name: r.roomName };
}
