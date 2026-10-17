// @vitest-environment node
// ADR-005 mục 3 / EP07-08 8.2–8.4 / DS 6.18: undo = 10-second delayed send, FIFO, classification of
// server answers, persistence. Pure engine with a fake clock and a fake server.
import { ApiError } from '@ottimo/api-client';
import { beforeEach, describe, expect, it } from 'vitest';
import type { StaffRequest } from '../app/api';
import { MemoryStore } from '../data/store';
import { ATT_REF, BACKOFF_MS, OfflineQueue, type NewQueueItem } from '../queue/queue';

const T0 = Date.parse('2026-10-19T10:42:00+07:00');

function problem(
  status: number,
  code: string,
  extra: Record<string, unknown> = {},
  retryAfter?: number,
) {
  return new ApiError(status, { type: 'x', title: code, status, code, ...extra }, retryAfter);
}

function setup() {
  let now = T0;
  let online = true;
  const sent: StaffRequest[] = [];
  const answers: ((req: StaffRequest) => unknown)[] = [];
  const store = new MemoryStore();
  const make = () =>
    new OfflineQueue({
      store,
      now: () => now,
      isOnline: () => online,
      send: async (req) => {
        sent.push(req);
        const a = answers.shift();
        if (!a) return { ok: true };
        return a(req);
      },
    });
  const q = make();
  return {
    q,
    make,
    store,
    sent,
    answers,
    advance: (ms: number) => {
      now += ms;
    },
    setOnline: (v: boolean) => {
      online = v;
    },
    now: () => now,
  };
}

function item(id: string, over: Partial<NewQueueItem> = {}): NewQueueItem {
  return {
    id,
    tappedAt: T0,
    kind: 'room_status',
    request: {
      method: 'POST',
      template: '/v1/properties/{propertyId}/rooms/{roomId}/status-transitions',
      path: { propertyId: 'p', roomId: 'r202' },
      body: {
        event: 'finish_cleaning',
        expectedFrom: 'CL',
        performedAt: new Date(T0).toISOString(),
      },
    },
    roomId: 'r202',
    roomNo: '202',
    roomName: 'The Valley',
    actionKey: 'hk.action.finish_cleaning',
    targets: ['VC', 'OC'],
    optimistic: { roomStatus: 'VC' },
    ...over,
  };
}

let env: ReturnType<typeof setup>;
beforeEach(() => {
  env = setup();
});

describe('undo window (10 s delayed send)', () => {
  it('nothing goes to the server inside the window; undo removes it without any call', async () => {
    const { q, sent, advance } = env;
    await q.enqueue(item('k1'), 10_000);
    expect(q.waiting()).toHaveLength(1);
    advance(9_000);
    await q.flush();
    expect(sent).toHaveLength(0);
    expect(await q.undo('k1')).toBeDefined();
    advance(5_000);
    await q.flush();
    expect(sent).toHaveLength(0);
    expect(q.items()).toHaveLength(0);
  });

  it('after 10 s it is sent once, with the Idempotency-Key and performedAt fixed at the tap', async () => {
    const { q, sent, advance } = env;
    await q.enqueue(item('k1'), 10_000);
    advance(10_000);
    const res = await q.flush();
    expect(res.sent).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.idempotencyKey).toBe('k1');
    expect((sent[0]!.body as { performedAt: string }).performedAt).toBe(new Date(T0).toISOString());
    expect(await q.undo('k1')).toBeUndefined(); // too late – already sent
    expect(q.items()).toHaveLength(0);
  });

  it('focus on "Hoàn tác" stops the clock (WCAG 2.2.1); blur resumes with the time that was left', async () => {
    const { q, sent, advance } = env;
    await q.enqueue(item('k1'), 10_000);
    advance(4_000);
    const left = await q.freezeHold('k1');
    expect(left).toBe(6_000);
    advance(60_000);
    await q.flush();
    expect(sent).toHaveLength(0);
    await q.resumeHold('k1', left!);
    advance(6_000);
    await q.flush();
    expect(sent).toHaveLength(1);
  });

  it('nextWakeAt points at the end of the window', async () => {
    const { q } = env;
    await q.enqueue(item('k1'), 10_000);
    expect(q.nextWakeAt()).toBe(T0 + 10_000);
  });
});

describe('sending (EP07-08 8.3)', () => {
  it('offline: held items become pending and wait; online: sent in tap order', async () => {
    const { q, sent, advance, setOnline } = env;
    setOnline(false);
    await q.enqueue(item('a', { actionKey: 'hk.action.start_cleaning' }), 10_000);
    advance(1_000);
    await q.enqueue(item('b', { tappedAt: T0 + 1_000 }), 10_000);
    advance(20_000);
    const res = await q.flush();
    expect(res.stopped).toBe('offline');
    expect(q.waiting().map((i) => i.state)).toEqual(['pending', 'pending']);
    setOnline(true);
    await q.flush();
    expect(sent.map((r) => r.idempotencyKey)).toEqual(['a', 'b']);
  });

  it('network failure keeps the order and backs off (5 s, 15 s, 1 min, 5 min)', async () => {
    const { q, sent, answers, advance } = env;
    await q.enqueue(item('a'), 0);
    await q.enqueue(item('b'), 0);
    answers.push(() => {
      throw problem(0, 'NETWORK_ERROR');
    });
    const r1 = await q.flush();
    expect(r1.stopped).toBe('retry');
    expect(sent).toHaveLength(1); // b did not overtake a
    expect(q.waiting()[0]!.nextAttemptAt).toBe(env.now() + BACKOFF_MS[0]);
    advance(BACKOFF_MS[0]);
    await q.flush();
    expect(sent.map((r) => r.idempotencyKey)).toEqual(['a', 'a', 'b']);
    expect(q.items()).toHaveLength(0);
  });

  it('409 INVALID_TRANSITION whose currentState is the wanted state = already applied, no error', async () => {
    const { q, answers } = env;
    await q.enqueue(item('a'), 0);
    answers.push(() => {
      throw problem(409, 'INVALID_TRANSITION', { currentState: 'VC' });
    });
    const res = await q.flush();
    expect(res.applied).toBe(1);
    expect(q.rejected()).toHaveLength(0);
    expect(q.items()).toHaveLength(0);
  });

  it('409 INVALID_TRANSITION to another state → "Cần xem lại" with the reason; later items still go', async () => {
    const { q, answers, sent } = env;
    await q.enqueue(item('a'), 0);
    await q.enqueue(item('b', { roomId: 'r301', roomNo: '301' }), 0);
    answers.push(() => {
      throw problem(409, 'INVALID_TRANSITION', { currentState: 'OOO' });
    });
    const res = await q.flush();
    expect(res.rejected).toBe(1);
    expect(sent).toHaveLength(2);
    const r = q.rejected()[0]!;
    expect(r.id).toBe('a');
    expect(r.rejection).toMatchObject({
      code: 'INVALID_TRANSITION',
      currentState: 'OOO',
      status: 409,
    });
    await q.dismiss('a');
    expect(q.items()).toHaveLength(0);
  });

  it('422 PERFORMED_AT_OUT_OF_RANGE is refused, never retried', async () => {
    const { q, answers } = env;
    await q.enqueue(item('a'), 0);
    answers.push(() => {
      throw problem(422, 'PERFORMED_AT_OUT_OF_RANGE');
    });
    await q.flush();
    expect(q.rejected()[0]!.rejection!.code).toBe('PERFORMED_AT_OUT_OF_RANGE');
  });

  it('503 / CONCURRENT_UPDATE stay waiting ("hệ thống bận") and follow Retry-After', async () => {
    const { q, answers, advance, sent } = env;
    await q.enqueue(item('a'), 0);
    answers.push(() => {
      throw problem(503, 'SERVICE_UNAVAILABLE', {}, 2);
    });
    await q.flush();
    const w = q.waiting()[0]!;
    expect(w.lastError).toBe('SERVICE_UNAVAILABLE');
    expect(w.nextAttemptAt).toBe(env.now() + 2_000);
    advance(2_000);
    await q.flush();
    expect(sent).toHaveLength(2);
    expect(q.items()).toHaveLength(0);
  });

  it('401 pauses the whole queue until the same user signs in again', async () => {
    const { q, answers, sent } = env;
    await q.enqueue(item('a'), 0);
    await q.enqueue(item('b'), 0);
    answers.push(() => {
      throw problem(401, 'UNAUTHENTICATED');
    });
    const r = await q.flush();
    expect(r.stopped).toBe('auth');
    expect(q.paused).toBe('auth');
    await q.flush();
    expect(sent).toHaveLength(1);
    q.resume();
    await q.flush();
    expect(sent.map((x) => x.idempotencyKey)).toEqual(['a', 'a', 'b']);
  });

  it('IDEMPOTENCY_KEY_REUSED (phone bug) drops the item', async () => {
    const { q, answers } = env;
    await q.enqueue(item('a'), 0);
    answers.push(() => {
      throw problem(422, 'IDEMPOTENCY_KEY_REUSED');
    });
    await q.flush();
    expect(q.items()).toHaveLength(0);
  });
});

describe('incident photos before the work order (EP07-08 8.2 dependsOn)', () => {
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
    actionKey: 'hk.photo_n',
  });
  const wo = (photos: string[]): NewQueueItem => ({
    id: 'wo',
    tappedAt: T0,
    kind: 'work_order',
    request: {
      method: 'POST',
      template: '/v1/properties/{propertyId}/work-orders',
      path: { propertyId: 'p' },
      body: {
        roomId: 'r',
        title: 'x',
        description: 'Mất nước nóng',
        category: 'hot_water',
        blockRequested: false,
        photoAttachmentIds: photos.map((p) => `${ATT_REF}${p}`),
      },
    },
    actionKey: 'hk.queue.wo_with_photo',
    dependsOn: photos,
  });

  it('uploads the photo, then sends the report with the server id; the photo bytes are deleted', async () => {
    const { q, answers, sent, store } = env;
    await q.putBlob('p1', new Blob([new Uint8Array(10)], { type: 'image/jpeg' }));
    await q.enqueue(photo('p1'), 0);
    await q.enqueue(wo(['p1']), 0);
    answers.push(() => ({ id: 'att-1', purpose: 'work_order' }));
    await q.flush();
    expect(sent).toHaveLength(2);
    expect(sent[0]!.form).toBeInstanceOf(FormData);
    expect(sent[0]!.idempotencyKey).toBe('p1');
    expect((sent[1]!.body as { photoAttachmentIds: string[] }).photoAttachmentIds).toEqual([
      'att-1',
    ]);
    expect(await store.keys('blobs')).toEqual([]);
  });

  it('a refused photo does not stop the report – it goes without that photo', async () => {
    const { q, answers, sent } = env;
    await q.putBlob('p1', new Blob([new Uint8Array(10)]));
    await q.enqueue(photo('p1'), 0);
    await q.enqueue(wo(['p1']), 0);
    answers.push(() => {
      throw problem(422, 'FILE_REJECTED');
    });
    await q.flush();
    expect((sent[1]!.body as { photoAttachmentIds: string[] }).photoAttachmentIds).toEqual([]);
    expect(q.rejected().map((i) => i.id)).toEqual(['p1']);
  });

  it('limits: 200 items / 20 photos waiting (EP07-08 8.2)', async () => {
    const { q } = env;
    expect(q.isFull(20)).toBe(false);
    expect(q.isFull(21)).toBe(true);
  });
});

describe('persistence (survives closing the app)', () => {
  it('a new queue on the same store finds the waiting items in order', async () => {
    const { q, make, setOnline } = env;
    setOnline(false);
    await q.enqueue(item('a'), 10_000);
    await q.enqueue(item('b'), 10_000);
    const again = make();
    await again.load();
    expect(again.items().map((i) => i.id)).toEqual(['a', 'b']);
    const c = await again.enqueue(item('c'), 0);
    expect(c.seq).toBe(3);
  });
});
