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
import type { Args } from '@ottimo/i18n';
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

/**
 * BUG-R4-021: `refType = user` (kinds `account_security_change` / `security_alert`) carries the internal event
 * in `refCode` (user email changed, 2-step reset by an owner…). The PWA words the event itself and never shows
 * that code; any other event gets one plain account-security sentence. `_self` when the notice is about the
 * person signed in, `_other` when an owner is told about someone else.
 */
type SelfOther = readonly [self: string, other: string];
// Whole keys, not templates: the PWA ships only the keys its source names (scripts/used-keys.ts).
const SEC_EMAIL: SelfOther = [
  'staff.notif.sec.email_changed_self',
  'staff.notif.sec.email_changed_other',
];
const SEC_MFA_RESET: SelfOther = [
  'staff.notif.sec.mfa_reset_self',
  'staff.notif.sec.mfa_reset_other',
];
const SEC_OTHER: SelfOther = ['staff.notif.sec.other_self', 'staff.notif.sec.other_other'];
/**
 * Event codes as `[domain, event]` (joined with a dot): written whole, the `mfa` ones would read as string
 * keys to scripts/used-keys.ts (the `mfa` family ships since v1.0.4).
 */
const event = (domain: string, name: string) => `${domain}.${name}`;
const USER_EVENT_KEYS: Record<string, SelfOther> = {
  [event('user', 'email_changed')]: SEC_EMAIL,
  [event('mfa', 'reset_by_owner')]: SEC_MFA_RESET,
  [event('mfa', 'reset_by_operator')]: SEC_MFA_RESET,
};

export function notifText(n: StaffNotification, t: (k: string) => string, selfId?: string): string {
  if (n.refType === 'user') {
    const [self, other] = (n.refCode && USER_EVENT_KEYS[n.refCode]) || SEC_OTHER;
    return t(n.refId && n.refId === selfId ? self : other);
  }
  return t(NOTIF_KEYS[n.kind] ?? 'staff.notif.k.other');
}

/** Internal event codes look like `user.email_changed`; display codes are `OTM-00171`, `WO-00034`, `302`. */
const INTERNAL_CODE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/;

/**
 * The reference shown under the sentence (SR-PWA-06: room number / work order or booking code only), or
 * nothing. Never for `refType = user`, and never anything shaped like an internal code (unknown refTypes).
 */
export function notifRef(
  n: StaffNotification,
  t: (k: string, args?: Args) => string,
): string | undefined {
  if (!n.refCode || n.refType === 'user' || INTERNAL_CODE.test(n.refCode)) return undefined;
  return n.refType === 'hk_task' || n.refType === 'guest_request'
    ? t('hk.room_title', { room: n.refCode })
    : n.refCode;
}
