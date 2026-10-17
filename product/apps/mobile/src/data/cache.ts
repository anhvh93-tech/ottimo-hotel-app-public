// Offline read copy (ADR-005 "đọc offline", EP07-08 8.1) with the SR-PWA-01 allow-list: today's tasks,
// the 10 rooms, checklists, the maintenance list – never C3, phone/email, money, the guest's free-text
// notes, or guest names outside today's tasks. Every snapshot is rebuilt field by field (allow-list, not
// deny-list), so a field the server adds later is not cached until someone decides it may be.
import type { Checklist, HkTask, Me, RoomStatusEntry, WorkOrder } from '../app/api';
import type { KvStore } from './store';

export interface Snapshot<T> {
  savedAt: number;
  data: T;
}

const OWNER_KEY = 'owner';

/** HK task without the guest's free-text note (D23 – `guest_request` notes are shown online only). */
export function cacheableTask(t: HkTask): HkTask {
  const out: HkTask = {
    id: t.id,
    roomId: t.roomId,
    roomNo: t.roomNo,
    roomName: t.roomName ?? null,
    type: t.type,
    status: t.status,
    dueDate: t.dueDate,
    quantity: t.quantity,
    source: t.source,
    version: t.version,
  };
  const optional = [
    'dueAt',
    'reservationId',
    'windowStart',
    'windowEnd',
    'notBeforeTime',
    'priorityRank',
    'assignedUserId',
    'doneAt',
    'linenChange',
    'carriedOver',
    'cancelReasonCode',
  ] as const;
  for (const k of optional) {
    if (t[k] !== undefined) (out as Record<string, unknown>)[k] = t[k];
  }
  if (t.refillItems) {
    out.refillItems = t.refillItems.map((r) => ({ itemName: r.itemName, quantity: r.quantity }));
  }
  // `note` of a guest request is the guest's own words → not cached; a staff note on a manual task is kept.
  if (t.note && t.type !== 'guest_request' && t.source !== 'guest_app') out.note = t.note;
  return out;
}

/** Room status: guest first name only for rooms with a task today; no next-arrival name, no service notes. */
export function cacheableRoom(
  r: RoomStatusEntry,
  roomsWithTaskToday: ReadonlySet<string>,
): RoomStatusEntry {
  const out: RoomStatusEntry = {
    roomId: r.roomId,
    roomNo: r.roomNo,
    roomName: r.roomName ?? null,
    status: r.status,
    since: r.since,
    allowedEvents: [...r.allowedEvents],
    version: r.version,
  };
  if (r.floor !== undefined) out.floor = r.floor;
  if (r.roomGroupCode !== undefined) out.roomGroupCode = r.roomGroupCode;
  if (r.statusLabel !== undefined) out.statusLabel = r.statusLabel;
  if (r.openTaskIds) out.openTaskIds = [...r.openTaskIds];
  if (r.inspectionFailed !== undefined) out.inspectionFailed = r.inspectionFailed;
  if (r.nextArrival) {
    out.nextArrival = { date: r.nextArrival.date, etaTime: r.nextArrival.etaTime };
  }
  if (r.currentGuest && roomsWithTaskToday.has(r.roomId)) out.currentGuest = r.currentGuest;
  return out;
}

/** Work order list row: no description (may quote the guest), photos, notes or history. */
export function cacheableWorkOrder(w: WorkOrder): WorkOrder {
  const out: WorkOrder = {
    id: w.id,
    code: w.code,
    roomId: w.roomId,
    title: w.title,
    severity: w.severity,
    status: w.status,
    source: w.source,
    version: w.version,
  };
  const optional = [
    'roomNo',
    'roomName',
    'assigneeName',
    'ackDueAt',
    'resolveDueAt',
    'isOverdue',
    'category',
    'blockRequested',
    'partsExpectedDate',
    'acceptedAt',
    'doneAt',
    'allowedActions',
  ] as const;
  for (const k of optional) {
    if (w[k] !== undefined) (out as Record<string, unknown>)[k] = w[k];
  }
  if (w.roomBlock) {
    const b = w.roomBlock;
    out.roomBlock = {
      id: b.id,
      roomId: b.roomId,
      status: b.status,
      startDate: b.startDate,
      endDatePlanned: b.endDatePlanned,
      reason: b.reason,
      version: b.version,
      ...(b.endDateActual !== undefined ? { endDateActual: b.endDateActual } : {}),
      ...(b.expectedDoneDate !== undefined ? { expectedDoneDate: b.expectedDoneDate } : {}),
    };
  }
  return out;
}

export class OfflineCache {
  constructor(private readonly store: KvStore) {}

  /** SR-PWA-04: a different user on this phone → wipe everything the previous one left. */
  async bindUser(userId: string): Promise<'same' | 'switched'> {
    const owner = await this.store.get<{ userId: string }>('snapshot', OWNER_KEY);
    if (owner && owner.userId === userId) return 'same';
    if (owner) await this.store.clear();
    await this.store.put('snapshot', OWNER_KEY, { userId });
    return owner ? 'switched' : 'same';
  }

  /** Profile for an offline start (name, roles, property) – never the CSRF token (SR-PWA-07). */
  async saveMe(me: Me) {
    const { csrfToken: _drop, ...rest } = me;
    void _drop;
    await this.store.put('snapshot', 'me', { ...rest, csrfToken: '' });
  }
  loadMe() {
    return this.store.get<Me>('snapshot', 'me');
  }

  async saveTasks(
    tasks: { summary: { done?: number; total?: number }; data: HkTask[] },
    now: number,
  ) {
    await this.store.put('snapshot', 'tasks', {
      savedAt: now,
      data: { summary: tasks.summary, data: tasks.data.map(cacheableTask) },
    });
  }
  loadTasks() {
    return this.store.get<Snapshot<{ summary: { done?: number; total?: number }; data: HkTask[] }>>(
      'snapshot',
      'tasks',
    );
  }

  async saveRooms(list: { asOf: string; data: RoomStatusEntry[] }, tasks: HkTask[], now: number) {
    const withTask = new Set(tasks.filter((t) => t.status !== 'cancelled').map((t) => t.roomId));
    await this.store.put('snapshot', 'rooms', {
      savedAt: now,
      data: { asOf: list.asOf, data: list.data.map((r) => cacheableRoom(r, withTask)) },
    });
  }
  loadRooms() {
    return this.store.get<Snapshot<{ asOf: string; data: RoomStatusEntry[] }>>('snapshot', 'rooms');
  }

  async saveChecklist(roomId: string, checklist: Checklist, now: number) {
    await this.store.put('snapshot', `checklist:${roomId}`, {
      savedAt: now,
      data: {
        version: checklist.version,
        items: checklist.items.map((i) => ({
          code: i.code,
          label: i.label,
          required: i.required,
          ...(i.photoRequired !== undefined ? { photoRequired: i.photoRequired } : {}),
          ...(i.dynamic !== undefined ? { dynamic: i.dynamic } : {}),
        })),
      },
    });
  }
  loadChecklist(roomId: string) {
    return this.store.get<Snapshot<Checklist>>('snapshot', `checklist:${roomId}`);
  }

  async saveWorkOrders(list: WorkOrder[], now: number) {
    await this.store.put('snapshot', 'workOrders', {
      savedAt: now,
      data: list.map(cacheableWorkOrder),
    });
  }
  loadWorkOrders() {
    return this.store.get<Snapshot<WorkOrder[]>>('snapshot', 'workOrders');
  }

  clearAll() {
    return this.store.clear();
  }
}
