import { useEffect, useState } from 'react';
import { api } from './api';

/**
 * Room-group code → display name (listRoomGroups; the caller falls back to the code). Used by the rack's
 * "Nhóm căn" filter and the B14 change-room list (BUG-R3-023 – never show L12 / N / NPLUS to the desk).
 */
export function useRoomGroupNames(propertyId: string): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let stale = false;
    api.listRoomGroups({ propertyId }).then(
      (r) => !stale && setNames(Object.fromEntries(r.data.data.map((g) => [g.code, g.name]))),
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [propertyId]);
  return names;
}
