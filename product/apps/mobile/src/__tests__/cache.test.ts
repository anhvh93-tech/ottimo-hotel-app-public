// SR-PWA-01 / SR-PWA-04: what the phone keeps in IndexedDB (fake-indexeddb, real IdbStore code path).
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import type { HkTask, Me, RoomStatusEntry, WorkOrder } from '../app/api';
import { cacheableRoom, cacheableTask, cacheableWorkOrder, OfflineCache } from '../data/cache';
import { IdbStore } from '../data/store';

const task: HkTask = {
  id: 't1',
  roomId: 'r101',
  roomNo: '101',
  roomName: 'The Amber',
  type: 'guest_request',
  status: 'open',
  dueDate: '2026-10-19',
  quantity: 1,
  source: 'guest_app',
  note: 'Thêm 2 khăn tắm – SĐT 0909 123 456',
  priorityRank: 3,
  version: 1,
};
const room: RoomStatusEntry = {
  roomId: 'r101',
  roomNo: '101',
  roomName: 'The Amber',
  status: 'OD',
  since: '2026-10-19T07:00:00+07:00',
  currentGuest: 'Khoa',
  nextArrival: { date: '2026-10-21', etaTime: '14:00', guestDisplayName: 'Anna M.' },
  serviceNotes: ['Dị ứng lông vũ'],
  allowedEvents: ['start_cleaning'],
  version: 4,
};

describe('allow-listed snapshots (SR-PWA-01)', () => {
  it('a guest request task is cached without the guest note; a staff note on a manual task stays', () => {
    expect(cacheableTask(task)).not.toHaveProperty('note');
    expect(
      cacheableTask({ ...task, type: 'adhoc_clean', source: 'manual', note: 'Lau kính ban công' })
        .note,
    ).toBe('Lau kính ban công');
  });

  it('room: first name only when the room has a task today; no next-arrival name, no service notes', () => {
    const withTask = cacheableRoom(room, new Set(['r101']));
    expect(withTask.currentGuest).toBe('Khoa');
    expect(withTask.nextArrival).toEqual({ date: '2026-10-21', etaTime: '14:00' });
    expect(withTask).not.toHaveProperty('serviceNotes');
    expect(cacheableRoom(room, new Set())).not.toHaveProperty('currentGuest');
  });

  it('work order row: no description (may quote the guest), photos or history', () => {
    const wo: WorkOrder = {
      id: 'w',
      code: 'WO-00005',
      roomId: 'r101',
      roomNo: '101',
      title: 'Không có nước nóng',
      description: 'Khách Anna nói từ 21:00',
      severity: 'high',
      status: 'new',
      source: 'guest_app',
      photoAttachmentIds: ['a'],
      history: [{ at: 'x', change: 'created', actorName: 'Hạnh' }],
      version: 1,
    };
    const c = cacheableWorkOrder(wo);
    expect(c).not.toHaveProperty('description');
    expect(c).not.toHaveProperty('photoAttachmentIds');
    expect(c).not.toHaveProperty('history');
  });

  it('IndexedDB after a simulated shift holds only allowed stores/keys and no guest note, phone or CSRF', async () => {
    const store = new IdbStore(new IDBFactory());
    const cache = new OfflineCache(store);
    await cache.bindUser('u-lan');
    const me = {
      id: 'u-lan',
      displayName: 'Lan',
      csrfToken: 'csrf-secret-value',
      properties: [],
    } as unknown as Me;
    await cache.saveMe(me);
    await cache.saveTasks({ summary: { done: 0, total: 1 }, data: [task] }, 1);
    await cache.saveRooms({ asOf: 'x', data: [room] }, [task], 1);
    await cache.saveChecklist(
      'r101',
      { version: 3, items: [{ code: 'i01', label: 'Ga gối', required: true }] },
      1,
    );
    expect((await store.keys('snapshot')).sort()).toEqual([
      'checklist:r101',
      'me',
      'owner',
      'rooms',
      'tasks',
    ]);
    const dump = JSON.stringify(await store.all('snapshot'));
    expect(dump).not.toContain('khăn tắm');
    expect(dump).not.toContain('0909');
    expect(dump).not.toContain('csrf-secret-value');
    expect(dump).not.toContain('Anna');
    expect(dump).not.toContain('Dị ứng');
  });

  it('another user on the same phone wipes the previous copy and queue (SR-PWA-04)', async () => {
    const store = new IdbStore(new IDBFactory());
    const cache = new OfflineCache(store);
    await cache.bindUser('u-lan');
    await cache.saveTasks({ summary: {}, data: [task] }, 1);
    await store.put('queue', 'k1', { id: 'k1' });
    expect(await cache.bindUser('u-lan')).toBe('same');
    expect(await cache.bindUser('u-tung')).toBe('switched');
    expect(await cache.loadTasks()).toBeUndefined();
    expect(await store.keys('queue')).toEqual([]);
  });
});
