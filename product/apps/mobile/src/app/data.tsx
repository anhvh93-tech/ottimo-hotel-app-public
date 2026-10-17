import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { OfflineCache } from '../data/cache';
import { useQueue } from '../queue/QueueProvider';
import { isApiError, staffApi, type HkTaskList, type RoomStatusList } from './api';
import { REFRESH_MS } from './config';
import { useLive, useLiveEvents } from './live';
import type { StaffSession } from './session';
import { localDate } from './time';

export interface HkData {
  tasks?: HkTaskList;
  rooms?: RoomStatusList;
  /** When the shown copy was fetched (offline → "Dữ liệu lúc …"). */
  savedAt?: number;
  fromCache: boolean;
  status: 'loading' | 'ready' | 'error';
  error?: unknown;
  refresh: () => Promise<void>;
}

const Ctx = createContext<HkData | null>(null);

/**
 * Today's tasks + the 10 rooms, shared by H19/H20 (one fetch for both tabs). Online: server, then the
 * allow-listed copy goes to IndexedDB. Offline or failed: the last copy with its time (ADR-005 đọc offline).
 */
export function HkDataProvider({
  session,
  cache,
  children,
}: {
  session: StaffSession;
  cache: OfflineCache;
  children: ReactNode;
}) {
  const { syncTick, online } = useQueue();
  const [state, setState] = useState<Omit<HkData, 'refresh'>>({
    status: 'loading',
    fromCache: false,
  });
  const alive = useRef(true);
  useEffect(() => {
    // StrictMode mounts twice: set it again on every mount.
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const pid = session.propertyId;
  const withTasks = session.mode === 'hk';

  const fromCache = useCallback(
    async (error?: unknown) => {
      const [t, r] = await Promise.all([cache.loadTasks(), cache.loadRooms()]);
      if (!alive.current) return;
      if (r || t) {
        setState({
          status: 'ready',
          fromCache: true,
          tasks: t?.data,
          rooms: r?.data,
          savedAt: Math.min(t?.savedAt ?? Infinity, r?.savedAt ?? Infinity),
        });
      } else {
        setState({ status: 'error', fromCache: false, error });
      }
    },
    [cache],
  );

  const refresh = useCallback(async () => {
    if (!globalThis.navigator?.onLine) {
      await fromCache();
      return;
    }
    try {
      const today = localDate();
      const [tasks, rooms] = await Promise.all([
        withTasks ? staffApi.listHkTasks(pid, today) : Promise.resolve(undefined),
        staffApi.listRoomStatuses(pid),
      ]);
      const now = Date.now();
      if (tasks) await cache.saveTasks(tasks, now);
      await cache.saveRooms(rooms, tasks?.data ?? [], now);
      if (!alive.current) return;
      setState({ status: 'ready', fromCache: false, tasks, rooms, savedAt: now });
    } catch (e) {
      if (isApiError(e) && e.status === 401) return; // login screen takes over, queue kept
      await fromCache(e);
    }
  }, [cache, pid, withTasks, fromCache]);

  useEffect(() => {
    void refresh();
  }, [refresh, syncTick, online]);

  // SSE (server decides by role): rooms, tasks and guest requests changed → re-read the lists.
  useLiveEvents(
    ['room.status_changed', 'hk_task.changed', 'guest_request.changed'],
    () => void refresh(),
  );
  const { connected } = useLive();

  useEffect(() => {
    if (!online || connected) return; // the stream replaces polling while it is open
    const id = setInterval(
      () => document.visibilityState === 'visible' && void refresh(),
      REFRESH_MS,
    );
    return () => clearInterval(id);
  }, [online, connected, refresh]);

  const value = useMemo<HkData>(() => ({ ...state, refresh }), [state, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHkData(): HkData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useHkData outside HkDataProvider');
  return ctx;
}
