// Write queue of the staff PWA (ADR-005 mục 3, EP07-08 8.2–8.4, DS 6.18, SR-PWA-05).
//
// Every write the PWA may queue goes through here – also when online – because "Hoàn tác" (undo) IS the
// 10-second delay before sending: undo = remove the item, no API is ever called. `performedAt` and the
// `Idempotency-Key` are fixed at the tap, so a resend after a network failure is the same request.
//
// Sending: FIFO, one at a time; a retryable failure (network, 5xx, 429, busy) stops the run and keeps
// the order; a refusal (409/422/403/404) moves the item to "Cần xem lại" with the reason – never dropped
// silently; 409 INVALID_TRANSITION whose `currentState` is what the action wanted = already applied by
// someone else (dropped without error); 401 pauses everything until the same user signs in again.
import { isApiError } from '@ottimo/api-client';
import type { StaffRequest } from '../app/api';
import type { KvStore } from '../data/store';

export type QueueKind = 'room_status' | 'hk_task' | 'inspection' | 'work_order' | 'attachment';
export type QueueState = 'held' | 'pending' | 'rejected';

export interface QueuedRequest {
  method: 'POST';
  template: string;
  path?: Record<string, string>;
  body?: unknown;
  /** Photo upload: bytes live in the `blobs` store under `blobKey` until the server confirms. */
  upload?: { blobKey: string; purpose: 'work_order' | 'inspection' };
  /** App language at the tap (server-translated labels in the answer). */
  acceptLanguage?: 'vi' | 'en';
}

export interface QueueItem {
  /** = Idempotency-Key (UUID made on the phone at the tap). */
  id: string;
  seq: number;
  kind: QueueKind;
  request: QueuedRequest;
  /** Tap time (= `performedAt`), ms. */
  tappedAt: number;
  /** Not sent before this (undo window). */
  sendAfter: number;
  state: QueueState;
  attempts: number;
  nextAttemptAt?: number;
  /** Code of the last retryable failure – `CONCURRENT_UPDATE`/`SERVICE_UNAVAILABLE` show "hệ thống bận". */
  lastError?: string;
  roomId?: string;
  roomNo?: string;
  roomName?: string | null;
  /** i18n key of the action ("Dọn xong", "Báo sự cố + n ảnh"…). */
  actionKey: string;
  actionArgs?: Record<string, string | number>;
  /** States meaning "already done by someone else" for 409 INVALID_TRANSITION. */
  targets?: string[];
  /** What the screens show while the item waits (optimistic UI, EP07-08 8.3). */
  optimistic?: { roomStatus?: string; taskId?: string; taskStatus?: string };
  rejection?: { code: string; currentState?: string; at: number; status: number };
  /** Attachment items this one waits for; their ids replace `@att:<itemId>` in `photoAttachmentIds`. */
  dependsOn?: string[];
}

export type NewQueueItem = Omit<
  QueueItem,
  'seq' | 'sendAfter' | 'state' | 'attempts' | 'tappedAt' | 'id'
> & { id: string; tappedAt: number };

export type SendFn = (req: StaffRequest) => Promise<unknown>;

export interface QueueDeps {
  store: KvStore;
  send: SendFn;
  now?: () => number;
  isOnline?: () => boolean;
}

export interface FlushResult {
  sent: number;
  applied: number;
  rejected: number;
  /** A retryable failure stopped the run. */
  stopped?: 'retry' | 'auth' | 'offline';
}

/** EP07-08 8.3: 5 s → 15 s → 1 min → 5 min (then every 5 min). */
export const BACKOFF_MS = [5_000, 15_000, 60_000, 300_000] as const;
/** EP07-08 8.2 [GIẢ ĐỊNH BA]: ≤ 200 items, ≤ 20 photos waiting. */
export const MAX_ITEMS = 200;
export const MAX_PHOTOS = 20;

const RETRY_CODES = new Set([
  'NETWORK_ERROR',
  'IDEMPOTENCY_IN_PROGRESS',
  'CONCURRENT_UPDATE',
  'SERVICE_UNAVAILABLE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
]);

export const ATT_REF = '@att:';

type Outcome =
  | { kind: 'done'; data: unknown }
  | { kind: 'applied' }
  | { kind: 'drop' }
  | { kind: 'rejected'; code: string; currentState?: string; status: number }
  | { kind: 'retry'; code: string; afterMs?: number }
  | { kind: 'auth' };

export function classify(e: unknown, item: Pick<QueueItem, 'targets'>): Outcome {
  if (!isApiError(e)) return { kind: 'retry', code: 'NETWORK_ERROR' };
  if (e.isNetwork) return { kind: 'retry', code: 'NETWORK_ERROR' };
  if (e.status === 401) return { kind: 'auth' };
  if (e.code === 'IDEMPOTENCY_KEY_REUSED') return { kind: 'drop' }; // phone bug – hifi 21.3
  if (RETRY_CODES.has(e.code) || e.status >= 500 || e.status === 429) {
    const after = e.retryAfterSeconds !== undefined ? e.retryAfterSeconds * 1000 : undefined;
    return { kind: 'retry', code: e.code, afterMs: after };
  }
  const current = e.problem.currentState;
  if (e.code === 'INVALID_TRANSITION' && current && item.targets?.includes(current)) {
    return { kind: 'applied' };
  }
  return { kind: 'rejected', code: e.code, currentState: current, status: e.status };
}

/** Blob → bytes (older WebKit has no `Blob.arrayBuffer`). */
function toBytes(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(blob);
  });
}

function isDue(item: QueueItem, now: number) {
  return item.sendAfter <= now && (item.nextAttemptAt === undefined || item.nextAttemptAt <= now);
}

export class OfflineQueue {
  private list: QueueItem[] = [];
  private listeners = new Set<() => void>();
  private running: Promise<FlushResult> | null = null;
  private seq = 0;
  /** 401 while sending – nothing goes out until `resume()` (same user signed in again). */
  paused: 'auth' | null = null;
  readonly now: () => number;
  private readonly isOnline: () => boolean;

  constructor(private readonly deps: QueueDeps) {
    this.now = deps.now ?? (() => Date.now());
    this.isOnline = deps.isOnline ?? (() => globalThis.navigator?.onLine ?? true);
  }

  async load(): Promise<void> {
    const all = await this.deps.store.all<QueueItem>('queue');
    this.list = all.sort((a, b) => a.seq - b.seq);
    this.seq = this.list.reduce((m, i) => Math.max(m, i.seq), 0);
    this.emit();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  items(): readonly QueueItem[] {
    return this.list;
  }

  /** Waiting to be sent (in the undo window or not sent yet). */
  waiting(): QueueItem[] {
    return this.list.filter((i) => i.state !== 'rejected');
  }

  rejected(): QueueItem[] {
    return this.list.filter((i) => i.state === 'rejected');
  }

  photosWaiting(): number {
    return this.list.filter((i) => i.kind === 'attachment' && i.state !== 'rejected').length;
  }

  isFull(extraPhotos = 0): boolean {
    return this.list.length >= MAX_ITEMS || this.photosWaiting() + extraPhotos > MAX_PHOTOS;
  }

  private async persist(item: QueueItem) {
    await this.deps.store.put('queue', item.id, item);
  }

  private async remove(item: QueueItem) {
    this.list = this.list.filter((i) => i.id !== item.id);
    await this.deps.store.delete('queue', item.id);
    if (item.request.upload) await this.deps.store.delete('blobs', item.request.upload.blobKey);
  }

  /** Keep a compressed photo on the phone until it is sent (stored as bytes – works on every engine). */
  async putBlob(key: string, blob: Blob): Promise<void> {
    const bytes = await toBytes(blob);
    await this.deps.store.put('blobs', key, { type: blob.type || 'image/jpeg', bytes });
  }

  private async readBlob(key: string): Promise<Blob | undefined> {
    const v = await this.deps.store.get<{ type: string; bytes: ArrayBuffer }>('blobs', key);
    return v ? new Blob([v.bytes], { type: v.type }) : undefined;
  }

  /**
   * Add an action. `undoMs` > 0 → held for that long (the toast's "Hoàn tác"); 0 → due at once
   * (incident reports, which have their own confirmation screen – DS 6.18).
   */
  async enqueue(input: NewQueueItem, undoMs: number): Promise<QueueItem> {
    const item: QueueItem = {
      ...input,
      seq: ++this.seq,
      state: undoMs > 0 ? 'held' : 'pending',
      sendAfter: input.tappedAt + Math.max(0, undoMs),
      attempts: 0,
    };
    this.list = [...this.list, item];
    await this.persist(item);
    this.emit();
    return item;
  }

  /** "Hoàn tác": only while the item is still held – the server has never seen it. */
  async undo(id: string): Promise<QueueItem | undefined> {
    const item = this.list.find((i) => i.id === id);
    if (!item || item.state !== 'held') return undefined;
    await this.remove(item);
    // Photos that only this item was waiting for go too.
    for (const dep of item.dependsOn ?? []) {
      const d = this.list.find((i) => i.id === dep);
      if (d) await this.remove(d);
    }
    this.emit();
    return item;
  }

  /** Toast focused → the countdown stops (WCAG 2.2.1); blur → `resumeHold(id, remaining)`. */
  async freezeHold(id: string): Promise<number | undefined> {
    const item = this.list.find((i) => i.id === id);
    if (!item || item.state !== 'held') return undefined;
    const remaining = Math.max(0, item.sendAfter - this.now());
    item.sendAfter = Number.MAX_SAFE_INTEGER;
    await this.persist(item);
    return remaining;
  }

  async resumeHold(id: string, remainingMs: number): Promise<void> {
    const item = this.list.find((i) => i.id === id);
    if (!item || item.state !== 'held') return;
    item.sendAfter = this.now() + Math.max(1_000, remainingMs);
    await this.persist(item);
    this.emit();
  }

  /** "Đã hiểu" on a refused item. */
  async dismiss(id: string): Promise<void> {
    const item = this.list.find((i) => i.id === id);
    if (!item || item.state !== 'rejected') return;
    await this.remove(item);
    this.emit();
  }

  /** "Gửi ngay": forget the backoff of waiting items, then send. */
  async sendNow(): Promise<FlushResult> {
    for (const i of this.list) {
      if (i.state === 'pending') i.nextAttemptAt = undefined;
    }
    return this.flush();
  }

  resume() {
    this.paused = null;
  }

  /** Earliest time something becomes due (for the timer). */
  nextWakeAt(): number | undefined {
    let at: number | undefined;
    for (const i of this.list) {
      if (i.state === 'rejected' || i.sendAfter === Number.MAX_SAFE_INTEGER) continue;
      const t = Math.max(i.sendAfter, i.nextAttemptAt ?? 0);
      at = at === undefined ? t : Math.min(at, t);
    }
    return at;
  }

  async clear(): Promise<void> {
    for (const i of [...this.list]) await this.remove(i);
    this.emit();
  }

  flush(): Promise<FlushResult> {
    if (!this.running) {
      this.running = this.run().finally(() => {
        this.running = null;
      });
    }
    return this.running;
  }

  private async run(): Promise<FlushResult> {
    const res: FlushResult = { sent: 0, applied: 0, rejected: 0 };
    const now = this.now();
    let changed = false;
    for (const i of this.list) {
      if (i.state === 'held' && i.sendAfter <= now) {
        i.state = 'pending';
        await this.persist(i);
        changed = true;
      }
    }
    if (changed) this.emit();
    if (this.paused) return { ...res, stopped: 'auth' };
    if (!this.isOnline()) return { ...res, stopped: 'offline' };

    for (const item of [...this.list].sort((a, b) => a.seq - b.seq)) {
      if (item.state === 'rejected') continue;
      // FIFO: something not due yet (undo window, backoff) holds the items after it.
      if (item.state === 'held' || !isDue(item, this.now())) break;
      const outcome = await this.sendOne(item);
      if (outcome.kind === 'done' || outcome.kind === 'applied' || outcome.kind === 'drop') {
        if (item.kind === 'attachment') {
          const attId =
            outcome.kind === 'done' ? (outcome.data as { id?: string } | undefined)?.id : undefined;
          await this.resolveAttachment(item.id, attId);
        }
        await this.remove(item);
        if (outcome.kind === 'done') res.sent++;
        if (outcome.kind === 'applied') res.applied++;
        this.emit();
        continue;
      }
      if (outcome.kind === 'rejected') {
        item.state = 'rejected';
        item.rejection = {
          code: outcome.code,
          currentState: outcome.currentState,
          status: outcome.status,
          at: this.now(),
        };
        // EP07-08 8.3: a refused photo does not stop its report – the report goes without it.
        if (item.kind === 'attachment') {
          await this.resolveAttachment(item.id, undefined);
          await this.deps.store.delete('blobs', item.request.upload!.blobKey);
        }
        await this.persist(item);
        res.rejected++;
        this.emit();
        continue;
      }
      if (outcome.kind === 'auth') {
        this.paused = 'auth';
        this.emit();
        return { ...res, stopped: 'auth' };
      }
      // retry – keep the order: nothing after this item goes before it.
      item.attempts++;
      item.lastError = outcome.code;
      const backoff = BACKOFF_MS[Math.min(item.attempts - 1, BACKOFF_MS.length - 1)]!;
      item.nextAttemptAt = this.now() + (outcome.afterMs ?? backoff);
      await this.persist(item);
      this.emit();
      return { ...res, stopped: 'retry' };
    }
    return res;
  }

  /** Put the server id of a sent photo into the items waiting for it (or drop the reference). */
  private async resolveAttachment(itemId: string, attachmentId: string | undefined) {
    const ref = `${ATT_REF}${itemId}`;
    for (const other of this.list) {
      if (!other.dependsOn?.includes(itemId)) continue;
      other.dependsOn = other.dependsOn.filter((d) => d !== itemId);
      const body = other.request.body as { photoAttachmentIds?: string[] } | undefined;
      if (body?.photoAttachmentIds) {
        body.photoAttachmentIds = body.photoAttachmentIds.flatMap((v) =>
          v === ref ? (attachmentId ? [attachmentId] : []) : [v],
        );
      }
      await this.persist(other);
    }
  }

  private async sendOne(item: QueueItem): Promise<Outcome> {
    let req: StaffRequest;
    try {
      req = await this.toRequest(item);
    } catch {
      return { kind: 'rejected', code: 'FILE_REJECTED', status: 0 };
    }
    try {
      const data = await this.deps.send(req);
      return { kind: 'done', data };
    } catch (e) {
      return classify(e, item);
    }
  }

  private async toRequest(item: QueueItem): Promise<StaffRequest> {
    const r = item.request;
    if (r.upload) {
      const blob = await this.readBlob(r.upload.blobKey);
      if (!blob) throw new Error('photo missing');
      const form = new FormData();
      form.append('file', blob, 'photo.jpg');
      form.append('purpose', r.upload.purpose);
      return {
        method: r.method,
        template: r.template,
        path: r.path,
        form,
        idempotencyKey: item.id,
      };
    }
    let body = r.body;
    const ids = (body as { photoAttachmentIds?: string[] } | undefined)?.photoAttachmentIds;
    if (ids?.some((v) => v.startsWith(ATT_REF))) {
      // Not resolved (should not happen with FIFO) – never send a placeholder to the server.
      body = { ...(body as object), photoAttachmentIds: ids.filter((v) => !v.startsWith(ATT_REF)) };
    }
    return {
      method: r.method,
      template: r.template,
      path: r.path,
      body,
      idempotencyKey: item.id,
      ...(r.acceptLanguage ? { acceptLanguage: r.acceptLanguage } : {}),
    };
  }
}
