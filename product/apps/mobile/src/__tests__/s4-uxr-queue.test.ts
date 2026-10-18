// @vitest-environment node
// UXR S4 walkthrough (rounds/round-02/outputs/UXR/s4-pwa-walkthrough.md) – queue engine:
// - P-05: an incident report with a photo made offline must reach the server WITH the photo id, also when
//   the queue is re-read from the phone (reload, sign-in) while a send is running.
// - P-08 / P-01: a refusal keeps the field code of a 422 (`PERFORMED_AT_OUT_OF_RANGE`), and the item can be
//   sent again with the time of the new tap.
import { ApiError } from '@ottimo/api-client';
import { describe, expect, it } from 'vitest';
import type { StaffRequest } from '../app/api';
import { MemoryStore } from '../data/store';
import { ATT_REF, OfflineQueue, type NewQueueItem } from '../queue/queue';

const T0 = Date.parse('2026-10-18T09:11:00+07:00');

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const photo = (id: string): NewQueueItem => ({
  id,
  tappedAt: T0,
  kind: 'attachment',
  request: {
    method: 'POST',
    template: '/v1/properties/{propertyId}/attachments',
    path: { propertyId: 'p' },
    upload: { blobKey: id, purpose: 'work_order' },
  },
  roomNo: '401',
  actionKey: 'hk.photo_n',
});

const workOrder = (photos: string[]): NewQueueItem => ({
  id: 'wo',
  tappedAt: T0,
  kind: 'work_order',
  request: {
    method: 'POST',
    template: '/v1/properties/{propertyId}/work-orders',
    path: { propertyId: 'p' },
    body: {
      roomId: 'r401',
      title: 'Mất nước nóng',
      description: 'Vòi sen chỉ ra nước lạnh',
      severity: 'high',
      category: 'hot_water',
      blockRequested: false,
      photoAttachmentIds: photos.map((p) => `${ATT_REF}${p}`),
    },
  },
  roomNo: '401',
  actionKey: 'hk.queue.wo_with_photo',
  actionArgs: { n: photos.length },
  dependsOn: photos,
});

describe('P-05 – offline incident photo stays with its work order', () => {
  it('queue re-read (sign-in after a reload) while the photo is uploading: the report carries the photo id', async () => {
    const store = new MemoryStore();
    const sent: StaffRequest[] = [];
    const upload = deferred<unknown>();
    const q = new OfflineQueue({
      store,
      now: () => T0 + 60_000,
      isOnline: () => true,
      send: async (req) => {
        sent.push(req);
        if (req.form) return upload.promise;
        return { id: 'wo-1', code: 'WO-00001' };
      },
    });
    await q.putBlob('p1', new Blob([new Uint8Array(10)], { type: 'image/jpeg' }));
    await q.enqueue(photo('p1'), 0);
    await q.enqueue(workOrder(['p1']), 0);

    const run = q.flush(); // timer / `online` flush starts uploading the photo…
    await Promise.resolve();
    const reload = q.load(); // …and the sign-in re-reads the queue from IndexedDB at the same time
    upload.resolve({ id: 'att-1', purpose: 'work_order' });
    await run;
    await reload;
    await q.flush();

    const wo = sent.find((r) => r.template.endsWith('/work-orders'));
    expect((wo!.body as { photoAttachmentIds: string[] }).photoAttachmentIds).toEqual(['att-1']);
    expect(sent.filter((r) => r.template.endsWith('/work-orders'))).toHaveLength(1);
    expect(q.items()).toHaveLength(0);
    expect(await store.keys('blobs')).toEqual([]);
  });

  it('closed offline, opened again (new queue on the same phone store): photo first, then the report with its id', async () => {
    const store = new MemoryStore();
    let online = false;
    const sent: StaffRequest[] = [];
    const make = () =>
      new OfflineQueue({
        store,
        now: () => T0 + 60_000,
        isOnline: () => online,
        send: async (req) => {
          sent.push(req);
          return req.form ? { id: 'att-9', purpose: 'work_order' } : { id: 'wo-9' };
        },
      });
    const first = make();
    await first.putBlob('p1', new Blob([new Uint8Array(10)], { type: 'image/jpeg' }));
    await first.enqueue(photo('p1'), 0);
    await first.enqueue(workOrder(['p1']), 0);
    expect((await first.flush()).stopped).toBe('offline');

    online = true;
    const again = make();
    await again.load();
    await again.flush();
    expect(sent.map((r) => (r.form ? 'photo' : 'wo'))).toEqual(['photo', 'wo']);
    expect((sent[1]!.body as { photoAttachmentIds: string[] }).photoAttachmentIds).toEqual([
      'att-9',
    ]);
  });
});

describe('P-08 / P-01 – refusal reason and "Gửi lại"', () => {
  const finish = (): NewQueueItem => ({
    id: 'done-1',
    tappedAt: T0,
    kind: 'room_status',
    request: {
      method: 'POST',
      template: '/v1/properties/{propertyId}/rooms/{roomId}/status-transitions',
      path: { propertyId: 'p', roomId: 'r401' },
      body: {
        event: 'finish_cleaning',
        expectedFrom: 'CL',
        performedAt: new Date(T0).toISOString(),
        taskId: 't1',
      },
    },
    roomId: 'r401',
    roomNo: '401',
    roomName: 'The Pine',
    actionKey: 'hk.action.finish_cleaning',
    targets: ['VC', 'OC', 'VI'],
    optimistic: { roomStatus: 'OC', taskId: 't1', taskStatus: 'done' },
  });

  it('422 VALIDATION_FAILED with errors[performedAt] = PERFORMED_AT_OUT_OF_RANGE is kept as that code', async () => {
    let now = T0 + 120_000;
    const sent: StaffRequest[] = [];
    let refuse = true;
    const q = new OfflineQueue({
      store: new MemoryStore(),
      now: () => now,
      isOnline: () => true,
      send: async (req) => {
        sent.push(req);
        if (refuse) {
          throw new ApiError(422, {
            type: 'x',
            title: 'VALIDATION_FAILED',
            status: 422,
            code: 'VALIDATION_FAILED',
            errors: [{ field: 'performedAt', code: 'PERFORMED_AT_OUT_OF_RANGE' }],
          });
        }
        return {};
      },
    });
    await q.enqueue(finish(), 0);
    await q.flush();
    const [rej] = q.rejected();
    expect(rej!.rejection).toMatchObject({ code: 'PERFORMED_AT_OUT_OF_RANGE', status: 422 });
    expect(q.canResend(rej!)).toBe(true);

    // "Gửi lại": same action, new Idempotency-Key, performedAt = the new tap; the refused entry goes.
    now = T0 + 300_000;
    refuse = false;
    const again = await q.resend(rej!.id, 0);
    expect(again!.id).not.toBe('done-1');
    expect(q.rejected()).toHaveLength(0);
    await q.flush();
    const last = sent.at(-1)!;
    expect(last.idempotencyKey).toBe(again!.id);
    expect(last.body).toMatchObject({
      event: 'finish_cleaning',
      expectedFrom: 'CL',
      taskId: 't1',
      performedAt: new Date(T0 + 300_000).toISOString(),
    });
    expect(q.items()).toHaveLength(0);
  });

  it('no "Gửi lại" when the room is already in another state (409) or for a refused photo', async () => {
    const q = new OfflineQueue({
      store: new MemoryStore(),
      now: () => T0,
      isOnline: () => true,
      send: async () => {
        throw new ApiError(409, {
          type: 'x',
          title: 'INVALID_TRANSITION',
          status: 409,
          code: 'INVALID_TRANSITION',
          currentState: 'OOO',
        });
      },
    });
    await q.enqueue(finish(), 0);
    await q.flush();
    expect(q.canResend(q.rejected()[0]!)).toBe(false);
    expect(await q.resend(q.rejected()[0]!.id, 0)).toBeUndefined();
  });
});
