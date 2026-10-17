// In-app inbox (ADR-005 mục 4: R2 = `GET /v1/me/notifications` + SSE `notification.created`; Web Push R3).
// Content is only kind + reference (room number / work order code) – SR-PWA-06; the sentence is built
// here from `kind`. Not stored on the phone (not in the SR-PWA-01 allow-list) – memory only.
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
import { useQueue } from '../queue/QueueProvider';
import { isApiError, staffApi, type StaffNotification } from './api';
import { REFRESH_MS } from './config';
import { useLive, useLiveEvents } from './live';

export interface Inbox {
  status: 'loading' | 'ready' | 'error';
  items: StaffNotification[];
  unread: number;
  /** Increments when a new one arrives through SSE/poll (screen reader announcement). */
  arrived: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

const Ctx = createContext<Inbox | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { online } = useQueue();
  const { connected } = useLive();
  const [state, setState] = useState<Omit<Inbox, 'refresh' | 'markRead'>>({
    status: 'loading',
    items: [],
    unread: 0,
    arrived: 0,
  });
  const known = useRef<Set<string> | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!globalThis.navigator?.onLine) return;
    try {
      const res = await staffApi.listMyNotifications();
      if (!alive.current) return;
      const prev = known.current;
      const fresh = prev ? res.data.filter((n) => !prev.has(n.id) && !n.readAt).length : 0;
      known.current = new Set(res.data.map((n) => n.id));
      setState((s) => ({
        status: 'ready',
        items: res.data,
        unread: res.unreadCount,
        arrived: s.arrived + (fresh > 0 ? 1 : 0),
      }));
    } catch (e) {
      if (isApiError(e) && e.status === 401) return;
      if (alive.current) setState((s) => (s.status === 'ready' ? s : { ...s, status: 'error' }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, online]);
  useLiveEvents(['notification.created'], () => void refresh());
  // No stream → poll while the app is in front.
  useEffect(() => {
    if (connected || !online) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [connected, online, refresh]);

  const markRead = useCallback(async (id: string) => {
    let changed = false;
    setState((s) => {
      const items = s.items.map((n) => {
        if (n.id !== id || n.readAt) return n;
        changed = true;
        return { ...n, readAt: new Date().toISOString() };
      });
      return changed ? { ...s, items, unread: Math.max(0, s.unread - 1) } : s;
    });
    try {
      await staffApi.markNotificationRead(id); // idempotent (204 again)
    } catch {
      /* offline: shown as read here, the server catches up on the next open */
    }
  }, []);

  const value = useMemo<Inbox>(() => ({ ...state, refresh, markRead }), [state, refresh, markRead]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInbox(): Inbox | null {
  return useContext(Ctx);
}

/** Kinds the PWA words itself; anything else (Desk topics of FD+) → "see OTTIMO Desk". */
export const NOTIF_KEYS: Partial<Record<StaffNotification['kind'], string>> = {
  work_order_new: 'staff.notif.k.work_order_new',
  work_order_high_new: 'staff.notif.k.work_order_high_new',
  work_order_block_requested: 'staff.notif.k.work_order_block_requested',
  work_order_overdue: 'staff.notif.k.work_order_overdue',
  hk_task_urgent: 'staff.notif.k.hk_task_urgent',
  room_awaiting_inspection: 'staff.notif.k.room_awaiting_inspection',
  hk_task_cancelled: 'staff.notif.k.hk_task_cancelled',
  guest_request_new: 'staff.notif.k.guest_request_new',
  guest_request_overdue: 'staff.notif.k.guest_request_overdue',
};

export function notifText(n: StaffNotification, t: (k: string) => string): string {
  return t(NOTIF_KEYS[n.kind] ?? 'staff.notif.k.other');
}
