// SSE `streamEvents` (architecture 12, OpenAPI 0.3.7): light events (type + id only) – the screens re-read
// the API. Recipients are decided by the server per role (HK: room/task/request events; MT: room/work
// order/request events; everyone: own `notification.created`) – the client does not filter further.
// No stream (mock mode, old browser, endpoint not deployed, stream closed) → the screens poll instead.
import { eventStreamPath } from '@ottimo/api-client';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { apiMode } from './config';

export const LIVE_EVENTS = [
  'room.status_changed',
  'hk_task.changed',
  'work_order.changed',
  'guest_request.changed',
  'notification.created',
] as const;
export type LiveEvent = (typeof LIVE_EVENTS)[number];
/** Pseudo event after a reconnect: events may have been missed – re-read everything. */
export const ALL = '*';

/** The part of EventSource the app uses (tests pass a fake). */
export interface EventSourceLike {
  readyState: number;
  onopen: ((ev: Event) => unknown) | null;
  onerror: ((ev: Event) => unknown) | null;
  addEventListener(type: string, listener: (ev: MessageEvent) => void): void;
  close(): void;
}
export type Connect = (url: string) => EventSourceLike | undefined;

const CLOSED = 2;

/** Real stream only against the real API (MSW has no SSE): mock mode polls. */
export const defaultConnect: Connect = (url) =>
  typeof EventSource !== 'undefined' && apiMode() === 'server'
    ? (new EventSource(url, { withCredentials: true }) as unknown as EventSourceLike)
    : undefined;

type Listener = (kinds: ReadonlySet<string>) => void;

interface LiveApi {
  /** Stream open: screens do not need to poll. */
  connected: boolean;
  subscribe: (fn: Listener) => () => void;
}

const Ctx = createContext<LiveApi>({ connected: false, subscribe: () => () => undefined });

export function LiveProvider({
  propertyId,
  connect = defaultConnect,
  debounceMs = 300,
  children,
}: {
  propertyId: string;
  connect?: Connect;
  debounceMs?: number;
  children: ReactNode;
}) {
  const listeners = useRef(new Set<Listener>());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = connect(eventStreamPath(propertyId));
    if (!source) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = new Set<string>();
    let dropped = false;
    // A burst (finish cleaning = room + task) → one re-read per screen.
    const soon = (kind: string) => {
      pending.add(kind);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const kinds = pending;
        pending = new Set();
        listeners.current.forEach((l) => l(kinds));
      }, debounceMs);
    };
    source.onopen = () => {
      if (dropped) soon(ALL);
      dropped = false;
      setConnected(true);
    };
    source.onerror = () => {
      if (source.readyState === CLOSED) {
        // 404 / not deployed / closed for good: quietly back to polling.
        source.close();
      } else {
        dropped = true; // EventSource reconnects by itself
      }
      setConnected(false);
    };
    for (const ev of LIVE_EVENTS) source.addEventListener(ev, () => soon(ev));
    return () => {
      clearTimeout(timer);
      source.close();
      setConnected(false);
    };
  }, [propertyId, connect, debounceMs]);

  const value = useMemo<LiveApi>(
    () => ({
      connected,
      subscribe: (fn) => {
        listeners.current.add(fn);
        return () => listeners.current.delete(fn);
      },
    }),
    [connected],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLive(): LiveApi {
  return useContext(Ctx);
}

/** Call `onEvent` when one of `kinds` (or a reconnect) arrives. */
export function useLiveEvents(kinds: readonly string[], onEvent: () => void) {
  const { subscribe } = useLive();
  const cb = useRef(onEvent);
  cb.current = onEvent;
  const key = kinds.join(' ');
  useEffect(
    () =>
      subscribe((got) => {
        if (got.has(ALL) || key.split(' ').some((k) => got.has(k))) cb.current();
      }),
    [subscribe, key],
  );
}
