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
import { UNDO_MS } from '../app/config';
import { useOnline } from '../app/useOnline';
import { OfflineQueue, type FlushResult, type NewQueueItem, type QueueItem } from './queue';

export type Toast =
  | {
      kind: 'undo';
      itemId: string;
      text: string;
      undoneText: string;
      until: number;
      frozen?: number;
    }
  | { kind: 'info'; text: string; until: number };

export interface QueueApi {
  queue: OfflineQueue;
  items: readonly QueueItem[];
  waiting: QueueItem[];
  rejected: QueueItem[];
  paused: boolean;
  online: boolean;
  toast: Toast | null;
  /** Increments after the server accepted something – screens reload their lists. */
  syncTick: number;
  /** Undoable write (10 s): shows the toast with "Hoàn tác (n)". */
  enqueueUndoable: (item: NewQueueItem, text: string, undoneText: string) => Promise<QueueItem>;
  /** Writes with their own confirmation (incident report + photos) – due at once, in this order. */
  enqueueNow: (items: NewQueueItem[]) => Promise<void>;
  undo: (id: string) => Promise<void>;
  freeze: (id: string) => void;
  release: (id: string) => void;
  closeToast: () => void;
  showInfo: (text: string) => void;
  flush: () => Promise<FlushResult>;
  sendNow: () => Promise<FlushResult>;
  dismiss: (id: string) => Promise<void>;
  resume: () => void;
}

const Ctx = createContext<QueueApi | null>(null);
const INFO_MS = 6_000; // DS C18 / A11: a toast stays ≥ 6 s

function registerBackgroundSync() {
  const sw = globalThis.navigator?.serviceWorker;
  if (!sw?.ready) return;
  void sw.ready
    .then((reg) =>
      (
        reg as ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }
      ).sync?.register('ottimo-queue'),
    )
    .catch(() => undefined);
}

export function QueueProvider({
  queue,
  queuedText,
  children,
}: {
  queue: OfflineQueue;
  /** "Đã lưu trên máy – sẽ tự gửi khi có mạng" in the current language. */
  queuedText: string;
  children: ReactNode;
}) {
  const online = useOnline();
  const [version, setVersion] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [syncTick, setSyncTick] = useState(0);
  const onlineRef = useRef(online);
  onlineRef.current = online;
  const queuedTextRef = useRef(queuedText);
  queuedTextRef.current = queuedText;

  useEffect(() => queue.subscribe(() => setVersion((v) => v + 1)), [queue]);

  const flush = useCallback(async () => {
    const res = await queue.flush();
    if (res.sent || res.applied || res.rejected) setSyncTick((n) => n + 1);
    if (res.stopped === 'offline' || res.stopped === 'retry') registerBackgroundSync();
    return res;
  }, [queue]);

  // Wake up when the next item is due (undo window over, backoff over). Re-read on every queue change.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` = the queue changed in place
  const wake = useMemo(() => queue.nextWakeAt(), [queue, version]);
  useEffect(() => {
    if (wake === undefined) return;
    const ms = Math.max(0, Math.min(wake - queue.now(), 2_147_000_000));
    const id = setTimeout(() => void flush(), ms + 20);
    return () => clearTimeout(id);
  }, [wake, queue, flush]);

  // Send on `online`, when the app comes back to the foreground, and when the worker's Background Sync fires.
  useEffect(() => {
    if (online) void flush();
  }, [online, flush]);
  useEffect(() => {
    const vis = () => document.visibilityState === 'visible' && void flush();
    document.addEventListener('visibilitychange', vis);
    const sw = globalThis.navigator?.serviceWorker;
    const msg = (e: MessageEvent) => {
      if ((e.data as { type?: string } | null)?.type === 'ottimo-queue-flush') void flush();
    };
    sw?.addEventListener?.('message', msg);
    return () => {
      document.removeEventListener('visibilitychange', vis);
      sw?.removeEventListener?.('message', msg);
    };
  }, [flush]);

  // Toast clock: the undo toast becomes "saved on this phone" when it ends offline (H20.2).
  useEffect(() => {
    if (!toast) return;
    if (toast.kind === 'undo' && toast.frozen !== undefined) return;
    const ms = Math.max(0, toast.until - Date.now());
    const id = setTimeout(() => {
      setToast((cur) => {
        if (cur !== toast) return cur;
        if (cur.kind === 'undo' && !onlineRef.current) {
          return { kind: 'info', text: queuedTextRef.current, until: Date.now() + INFO_MS };
        }
        return null;
      });
    }, ms);
    return () => clearTimeout(id);
  }, [toast]);

  const enqueueUndoable = useCallback(
    async (item: NewQueueItem, text: string, undoneText: string) => {
      const saved = await queue.enqueue(item, UNDO_MS);
      // A second action within 10 s replaces the toast; the first still sends at its time (DS 6.18).
      setToast({ kind: 'undo', itemId: saved.id, text, undoneText, until: saved.sendAfter });
      return saved;
    },
    [queue],
  );

  const enqueueNow = useCallback(
    async (items: NewQueueItem[]) => {
      for (const i of items) await queue.enqueue(i, 0);
      void flush();
    },
    [queue, flush],
  );

  const undo = useCallback(
    async (id: string) => {
      const removed = await queue.undo(id);
      setToast((cur) =>
        cur?.kind === 'undo' && cur.itemId === id
          ? removed
            ? { kind: 'info', text: cur.undoneText, until: Date.now() + INFO_MS }
            : null
          : cur,
      );
    },
    [queue],
  );

  const freeze = useCallback(
    (id: string) => {
      void queue.freezeHold(id).then((remaining) => {
        if (remaining === undefined) return;
        setToast((cur) =>
          cur?.kind === 'undo' && cur.itemId === id ? { ...cur, frozen: remaining } : cur,
        );
      });
    },
    [queue],
  );

  const release = useCallback(
    (id: string) => {
      setToast((cur) => {
        if (cur?.kind !== 'undo' || cur.itemId !== id || cur.frozen === undefined) return cur;
        const remaining = Math.max(1_000, cur.frozen);
        void queue.resumeHold(id, remaining);
        return { ...cur, frozen: undefined, until: Date.now() + remaining };
      });
    },
    [queue],
  );

  const value = useMemo<QueueApi>(
    () => ({
      queue,
      items: queue.items(),
      waiting: queue.waiting(),
      rejected: queue.rejected(),
      paused: queue.paused !== null,
      online,
      toast,
      syncTick,
      enqueueUndoable,
      enqueueNow,
      undo,
      freeze,
      release,
      closeToast: () => setToast(null),
      showInfo: (text: string) => setToast({ kind: 'info', text, until: Date.now() + INFO_MS }),
      flush,
      sendNow: async () => {
        const res = await queue.sendNow();
        if (res.sent || res.applied || res.rejected) setSyncTick((n) => n + 1);
        return res;
      },
      dismiss: (id: string) => queue.dismiss(id),
      resume: () => {
        queue.resume();
        void flush();
      },
    }),
    // `version` bumps on every queue change (items are updated in place by the queue).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      queue,
      version,
      online,
      toast,
      syncTick,
      enqueueUndoable,
      enqueueNow,
      undo,
      freeze,
      release,
      flush,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useQueue(): QueueApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useQueue outside QueueProvider');
  return ctx;
}
