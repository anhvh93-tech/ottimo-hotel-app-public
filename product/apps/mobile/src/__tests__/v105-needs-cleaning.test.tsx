// v1.0.5 V5-15 – "Cần dọn" on the staff PWA (contract 0.3.13 mục 1.4, T15-8): `transitionRoomStatus`
// `event = needs_cleaning` (R8, OC → OD) when the server lists it in `allowedEvents`. Same path as the other
// room steps: 10-second undo = delayed send, offline queue (R8 of ADR-005 mục 3), one command per tap, 409
// `currentState` = OD → "Đã áp dụng", any other state → "Cần xem lại". Against the MSW mock (same as `pnpm dev`).
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventsFor } from '../app/overlay';
import { MemoryStore } from '../data/store';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { OfflineQueue, waitingRoomEvent, type NewQueueItem } from '../queue/queue';
import { hhmm } from '../app/time';
import { bodies, calls, setOnline, start, tv, wait } from './helpers';

const roomId = (no: string) => `0192a1b0-0000-7000-8000-0000000c0${no}`;
const NEEDS = () => tv('hk.action.needs_cleaning');

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  setOnline(true);
});
afterEach(() => {
  vi.useRealTimers();
});

/** Sign in, open the room screen (H20) of `no`. */
async function openRoom(no: string, name: string, username = 'fdl.hanh') {
  const utils = await start(username);
  await screen.findByRole('heading', { name: /Việc của tôi/ });
  window.location.hash = `#/room/${roomId(no)}`;
  await screen.findByRole('heading', { name: tv('hk.room_title', { room: `${no} · ${name}` }) });
  return utils;
}

/** Idempotency-Key of every transitionRoomStatus request that reached the mock (also the dropped ones). */
function recordKeys() {
  const keys: (string | null)[] = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method === 'POST' && request.url.includes('/status-transitions')) {
      keys.push(request.headers.get('idempotency-key'));
    }
  };
  server.events.on('request:start', on);
  return { keys, stop: () => server.events.removeListener('request:start', on) };
}

describe('V5-15 – "Cần dọn" button on the room screen (H20)', () => {
  it('OC room: the button shows; a tap waits 10 s, then sends needs_cleaning from OC once; then "Bắt đầu dọn"', async () => {
    const { user } = await openRoom('301', 'The Velvet');
    expect(screen.getByText(tv('hk.status.OC'))).toBeInTheDocument();
    const tapped = Date.now();
    await user.click(screen.getByRole('button', { name: NEEDS() }));
    // Optimistic state + "Chờ gửi" + toast naming the room and the new state (EP07-08 8.3, UXR P-13).
    expect(
      await screen.findByText(
        tv('hk.toast.room_status', { room: '301 · The Velvet', status: tv('hk.status.OD') }),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(tv('hk.chip.queued'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: NEEDS() })).toBeNull();
    // Next SM-03 step while it waits: R1 from OD.
    expect(
      screen.getByRole('button', { name: tv('hk.action.start_cleaning') }),
    ).toBeInTheDocument();
    await wait(9_000);
    expect(calls('transitionRoomStatus')).toBe(0);
    await wait(2_000);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
    const body = bodies('transitionRoomStatus')[0] as Record<string, unknown>;
    expect(body).toMatchObject({ event: 'needs_cleaning', expectedFrom: 'OC' });
    expect(body).not.toHaveProperty('taskId');
    expect(Math.abs(Date.parse(body.performedAt as string) - tapped)).toBeLessThan(1_500);
    // Server side (R8a): OD + one stay-over cleaning task.
    const room = mockControl.state.rooms.find((r) => r.no === '301')!;
    expect(room.status).toBe('OD');
    expect(
      mockControl.state.tasks.filter((t) => t.roomNo === '301' && t.type === 'stayover_clean'),
    ).toHaveLength(1);
    await waitFor(() => expect(screen.queryByText(tv('hk.chip.queued'))).toBeNull());
    expect(
      await screen.findByRole('button', { name: tv('hk.action.start_cleaning') }),
    ).toBeInTheDocument();
    expect(calls('transitionRoomStatus')).toBe(1);
  });

  it('"Hoàn tác" within 10 s: nothing is sent and the button is back', async () => {
    const { user } = await openRoom('301', 'The Velvet');
    await user.click(screen.getByRole('button', { name: NEEDS() }));
    await user.click(await screen.findByRole('button', { name: /Hoàn tác \(\d+\)/ }));
    expect(
      await screen.findByText(
        tv('hk.undone_room', { room: '301 · The Velvet', status: tv('hk.status.OC') }),
      ),
    ).toBeInTheDocument();
    await wait(15_000);
    expect(calls('transitionRoomStatus')).toBe(0);
    expect(screen.getByRole('button', { name: NEEDS() })).toBeInTheDocument();
  });

  it('only when the server lists needs_cleaning: no button on other states, none for maintenance', async () => {
    await openRoom('302', 'The Ivory'); // VC
    expect(screen.queryByRole('button', { name: NEEDS() })).toBeNull();
    window.location.hash = `#/room/${roomId('101')}`; // OD
    await screen.findByRole('heading', {
      name: tv('hk.room_title', { room: '101 · The Amber' }),
    });
    expect(screen.queryByRole('button', { name: NEEDS() })).toBeNull();
  });

  it('maintenance (read only) never gets the button', async () => {
    await start('mt.tung');
    await screen.findByRole('heading', { name: /Phiếu sửa/ });
    window.location.hash = `#/room/${roomId('301')}`;
    await screen.findByRole('heading', {
      name: tv('hk.room_title', { room: '301 · The Velvet' }),
    });
    expect(screen.queryByRole('button', { name: NEEDS() })).toBeNull();
  });

  it('housekeeping: only inside scope T (a room with a task today), like the server', async () => {
    // 301 has no task today → outside scope T → no event for HK.
    mockControl.setRoom('102', 'OC'); // 102 has its long-stay cleaning task → inside scope T
    const { user } = await openRoom('301', 'The Velvet', 'hk.lan');
    expect(screen.queryByRole('button', { name: NEEDS() })).toBeNull();
    window.location.hash = `#/room/${roomId('102')}`;
    await screen.findByRole('heading', { name: tv('hk.room_title', { room: '102 · The Fern' }) });
    await user.click(screen.getByRole('button', { name: NEEDS() }));
    await wait(11_000);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
    expect(mockControl.state.rooms.find((r) => r.no === '102')!.status).toBe('OD');
    // R8a like housekeeping.service: a stay-over cleaning task unless one is open (the long-stay task is another type).
    expect(
      mockControl.state.tasks.filter((t) => t.roomNo === '102' && t.type === 'stayover_clean'),
    ).toHaveLength(1);
  });
});

describe('V5-15 – offline queue (R8, ADR-005 mục 3): no lost tap, no duplicate command', () => {
  it('offline: still tappable, kept on the phone, sent once when back online', async () => {
    const { user } = await openRoom('301', 'The Velvet');
    setOnline(false);
    await user.click(screen.getByRole('button', { name: NEEDS() }));
    await wait(11_000);
    expect(await screen.findByText(tv('hk.queued_toast'))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: tv('hk.queue_pill', { n: 1 }) })).toBeInTheDocument();
    expect(calls('transitionRoomStatus')).toBe(0);
    setOnline(true);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: /thao tác đang chờ gửi/ })).toBeNull(),
    );
    expect(mockControl.state.rooms.find((r) => r.no === '301')!.status).toBe('OD');
  });

  it('"Thao tác trên máy" names the action while it waits offline', async () => {
    const { user } = await openRoom('301', 'The Velvet');
    setOnline(false);
    await user.click(screen.getByRole('button', { name: NEEDS() }));
    await wait(11_000);
    await user.click(await screen.findByRole('link', { name: tv('hk.queue_pill', { n: 1 }) }));
    const region = await screen.findByRole('region', {
      name: tv('hk.queue.pending', { n: 1 }),
    });
    expect(within(region).getByText(NEEDS(), { exact: false })).toBeInTheDocument();
  });

  it('two taps before the screen re-draws = one item, one request', async () => {
    await openRoom('301', 'The Velvet');
    const btn = screen.getByRole('button', { name: NEEDS() });
    // Same tick: the first tap has not re-drawn the screen yet (queue write still in flight).
    fireEvent.click(btn);
    fireEvent.click(btn);
    await wait(500);
    expect(mockControl.state.calls.filter((c) => c === 'transitionRoomStatus')).toHaveLength(0);
    await wait(11_000);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
    await wait(30_000);
    expect(calls('transitionRoomStatus')).toBe(1);
    expect(screen.queryByRole('link', { name: /Cần xem lại/ })).toBeNull();
  });

  it('answer lost on a weak network: the resend carries the same Idempotency-Key, the server applies it once', async () => {
    const rec = recordKeys();
    try {
      const { user } = await openRoom('301', 'The Velvet');
      mockControl.scenario.dropAnswerOf = 'transitionRoomStatus';
      await user.click(screen.getByRole('button', { name: NEEDS() }));
      await wait(11_000);
      await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
      // Backoff 5 s (EP07-08 8.3), then the same request again.
      await wait(6_000);
      await waitFor(() => expect(calls('transitionRoomStatus')).toBe(2));
      expect(rec.keys).toHaveLength(2);
      expect(rec.keys[0]).toBeTruthy();
      expect(rec.keys[1]).toBe(rec.keys[0]);
      // Applied once: one write, one stay-over task, no "Cần xem lại".
      expect(bodies('transitionRoomStatus')).toHaveLength(1);
      expect(
        mockControl.state.tasks.filter((t) => t.roomNo === '301' && t.type === 'stayover_clean'),
      ).toHaveLength(1);
      await waitFor(() =>
        expect(screen.queryByRole('link', { name: /thao tác đang chờ gửi/ })).toBeNull(),
      );
      expect(screen.queryByRole('link', { name: /Cần xem lại/ })).toBeNull();
    } finally {
      rec.stop();
    }
  });

  it('desk pressed it first (409, currentState OD) → "Đã áp dụng": no "Cần xem lại"', async () => {
    const { user } = await openRoom('301', 'The Velvet');
    mockControl.setRoom('301', 'OD'); // Desk / another phone, after this screen was drawn
    await user.click(screen.getByRole('button', { name: NEEDS() }));
    await wait(11_000);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
    await wait(1_000);
    expect(screen.queryByRole('link', { name: /Cần xem lại/ })).toBeNull();
    expect(
      screen.queryByText(
        tv('hk.queue.rejected_title', { room: '301 · The Velvet', action: NEEDS() }),
      ),
    ).toBeNull();
  });

  it('state changed otherwise (409, guest checked out → VD) → "Cần xem lại" with the state, never dropped', async () => {
    const { user } = await openRoom('301', 'The Velvet');
    mockControl.setRoom('301', 'VD');
    const tapped = Date.now();
    await user.click(screen.getByRole('button', { name: NEEDS() }));
    await wait(11_000);
    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByText(
        tv('hk.queue.rejected_title', { room: '301 · The Velvet', action: NEEDS() }),
      ),
    ).toBeInTheDocument();
    expect(
      within(alert).getByText(
        tv('hk.queue.rejected_body', { time: hhmm(tapped), status: tv('hk.status.VD') }),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cần xem lại (1)' })).toBeInTheDocument();
  });
});

describe('V5-15 – engine', () => {
  const T0 = Date.parse('2026-11-10T10:00:00+07:00');
  const needs = (id: string, over: Partial<NewQueueItem> = {}): NewQueueItem => ({
    id,
    tappedAt: T0,
    kind: 'room_status',
    request: {
      method: 'POST',
      template: '/v1/properties/{propertyId}/rooms/{roomId}/status-transitions',
      path: { propertyId: 'p', roomId: 'r301' },
      body: {
        event: 'needs_cleaning',
        expectedFrom: 'OC',
        performedAt: new Date(T0).toISOString(),
      },
    },
    roomId: 'r301',
    roomNo: '301',
    actionKey: 'hk.action.needs_cleaning',
    targets: ['OD'],
    optimistic: { roomStatus: 'OD' },
    ...over,
  });

  it('waitingRoomEvent: same room + event + from while held or pending; not after a refusal', async () => {
    let now = T0;
    const q = new OfflineQueue({
      store: new MemoryStore(),
      now: () => now,
      isOnline: () => true,
      send: async () => {
        throw new (await import('@ottimo/api-client')).ApiError(409, {
          type: 'x',
          title: 'INVALID_TRANSITION',
          status: 409,
          code: 'INVALID_TRANSITION',
          currentState: 'VD',
        });
      },
    });
    await q.enqueue(needs('a'), 10_000);
    expect(waitingRoomEvent(q.items(), 'r301', 'needs_cleaning', 'OC')?.id).toBe('a');
    expect(waitingRoomEvent(q.items(), 'r302', 'needs_cleaning', 'OC')).toBeUndefined();
    expect(waitingRoomEvent(q.items(), 'r301', 'start_cleaning', 'OC')).toBeUndefined();
    expect(waitingRoomEvent(q.items(), 'r301', 'needs_cleaning', 'OD')).toBeUndefined();
    now += 11_000;
    await q.flush();
    expect(q.rejected()).toHaveLength(1);
    expect(waitingRoomEvent(q.items(), 'r301', 'needs_cleaning', 'OC')).toBeUndefined();
  });

  it('409 currentState OD = applied (dropped without error)', async () => {
    let now = T0;
    const { ApiError } = await import('@ottimo/api-client');
    const q = new OfflineQueue({
      store: new MemoryStore(),
      now: () => now,
      isOnline: () => true,
      send: async () => {
        throw new ApiError(409, {
          type: 'x',
          title: 'INVALID_TRANSITION',
          status: 409,
          code: 'INVALID_TRANSITION',
          currentState: 'OD',
        });
      },
    });
    await q.enqueue(needs('a'), 10_000);
    now += 11_000;
    const res = await q.flush();
    expect(res).toMatchObject({ applied: 1, rejected: 0 });
    expect(q.items()).toHaveLength(0);
  });

  it('while "Cần dọn" waits (OD on the phone), the next step is "Bắt đầu dọn" only', () => {
    expect(eventsFor('OD', ['needs_cleaning'], true)).toEqual(['start_cleaning']);
    expect(eventsFor('OC', ['needs_cleaning'], false)).toEqual(['needs_cleaning']);
  });
});
