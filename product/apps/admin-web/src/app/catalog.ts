import type { Channel, Room } from '@ottimo/api-client';
import { useEffect, useState } from 'react';
import { api } from './api';
import { onClientDataClear } from './clientData';

/**
 * Rooms + channels for the booking / sale forms. Both lists change rarely, so they are read once per
 * property and kept in memory (wiped on sign-out). Failures leave the lists empty; the forms then show
 * their own error state and the server still validates everything.
 */
export interface Catalog {
  rooms: Room[];
  channels: Channel[];
  status: 'loading' | 'ready' | 'error';
  reload: () => void;
}

let cache: { propertyId: string; rooms: Room[]; channels: Channel[] } | null = null;
onClientDataClear(() => {
  cache = null;
});

export function useCatalog(propertyId: string): Catalog {
  const hit = cache?.propertyId === propertyId ? cache : null;
  const [state, setState] = useState<Omit<Catalog, 'reload'>>(
    hit
      ? { rooms: hit.rooms, channels: hit.channels, status: 'ready' }
      : { rooms: [], channels: [], status: 'loading' },
  );
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (cache?.propertyId === propertyId && tick === 0) return;
    let stale = false;
    Promise.all([api.listRooms({ propertyId }), api.listChannels({ propertyId })]).then(
      ([r, c]) => {
        const rooms = [...r.data.data].sort((a, b) => a.roomNo.localeCompare(b.roomNo));
        cache = { propertyId, rooms, channels: c.data.data };
        if (!stale) setState({ rooms, channels: c.data.data, status: 'ready' });
      },
      () => !stale && setState((s) => ({ ...s, status: 'error' })),
    );
    return () => {
      stale = true;
    };
  }, [propertyId, tick]);
  return { ...state, reload: () => setTick((n) => n + 1) };
}
