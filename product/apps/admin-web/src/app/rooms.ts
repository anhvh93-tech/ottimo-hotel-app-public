import type { Room } from '@ottimo/api-client';
import { roomLabel } from '@ottimo/i18n';
import { useCallback } from 'react';
import { useCatalog } from './catalog';

/**
 * Staff room label "401 · The Pine" (BR-012, DS 11.3 – S4-49/S4-52 B3) with names from the room catalogue
 * (`listRooms` → `Room.name`, read once per property). Until the catalogue answers – or for a room without a
 * name – the number alone. Temporary names = seed DS-E (BL 4.1) until INV sends the real table (19/10);
 * changing them is a room-catalogue edit (H04), never code.
 */
export function useStaffRoomLabel(propertyId: string) {
  const { rooms } = useCatalog(propertyId);
  return useCallback(
    (roomNo?: string | null, roomId?: string | null) =>
      roomLabel(findRoom(rooms, roomNo, roomId) ?? { roomNo }, 'staff'),
    [rooms],
  );
}

export function findRoom(rooms: Room[], roomNo?: string | null, roomId?: string | null) {
  return rooms.find((r) => (roomId ? r.id === roomId : !!roomNo && r.roomNo === roomNo));
}
