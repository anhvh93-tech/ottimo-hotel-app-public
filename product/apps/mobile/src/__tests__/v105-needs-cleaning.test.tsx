// v1.0.5 V5-15 – "Báo cần dọn" (plan: "nút Cần dọn") on the staff PWA (contract 0.3.13 mục 1.4, T15-8): `transitionRoomStatus`
// `event = needs_cleaning` (R8, OC → OD) when the server lists it in `allowedEvents`. Same path as the other
// room steps: 10-second undo = delayed send, offline queue (R8 of ADR-005 mục 3), one command per tap, 409
// `currentState` = OD → "Đã áp dụng", any other state → "Cần xem lại". Against the MSW mock (same as `pnpm dev`).
// Round 5 review (UXD PR97-01, ARC MOB-97-01): a secondary button in the body, never the footer slot of the next
// cleaning step. ARC MOB-97-02: the mock answers scope T like housekeeping.service.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventsFor } from '../app/overlay';
import { MemoryStore } from '../data/store';
import { MOCK_USERS, PROPERTY_ID, mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { rejectionText } from '../queue/messages';
import { OfflineQueue, waitingRoomEvent, type NewQueueItem, type QueueItem } from '../queue/queue';
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

/** `transitionRoomStatus` straight to the mock "server" (no screen) as the signed-in user: status + problem code. */
async function transition(no: string, body: Record<string, unknown>) {
  const res = await fetch(
    new URL(
      `/v1/properties/${PROPERTY_ID}/rooms/${roomId(no)}/status-transitions`,
      window.location.origin,
    ),
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': 'csrf-mock',
        'idempotency-key': crypto.randomUUID(),
      },
      body: JSON.stringify({ performedAt: new Date().toISOString(), ...body }),
    },
  );
  const json = (await res.json()) as { code?: string };
  return { status: res.status, code: json.code };
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

describe('V5-15 – "Báo cần dọn" button on the room screen (H20)', () => {
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
    expect(screen.queryByText(tv('hk.needs_cleaning_help'))).toBeNull();
    window.location.hash = `#/room/${roomId('101')}`; // OD
    await screen.findByRole('heading', {
      name: tv('hk.room_title', { room: '101 · The Amber' }),
    });
    expect(screen.queryByRole('button', { name: NEEDS() })).toBeNull();
    expect(screen.queryByText(tv('hk.needs_cleaning_help'))).toBeNull();
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

describe('V5-15 – place on the screen (FB-R5-UXD-MOB-PR97-01, FB-R5-ARC-MOB-97-01)', () => {
  it('OC room: secondary button in the body, just above "Báo sự cố căn này", with its help line; no footer', async () => {
    const { container } = await openRoom('301', 'The Velvet');
    expect(container.querySelector('.hk-foot')).toBeNull();
    const btn = screen.getByRole('button', { name: NEEDS() });
    expect(btn.closest('.hk-stack')).not.toBeNull();
    expect(btn).toHaveClass('btn', 'xl', 'block');
    expect(btn).not.toHaveClass('pri');
    expect(btn.querySelector('svg.ico')).not.toBeNull();
    expect(btn.nextElementSibling).toHaveAccessibleName(tv('hk.report_this_room'));
    // PR97-03: what the button does, in the info card above it.
    expect(screen.getByText(tv('hk.needs_cleaning_help')).closest('.hk-info')).not.toBeNull();
  });

  it('second tap 150 ms later on the same spot: one needs_cleaning, never start_cleaning (guest room stays OD)', async () => {
    const { container } = await openRoom('301', 'The Velvet');
    const btn = screen.getByRole('button', { name: NEEDS() });
    // What moves up into the spot once the button goes: "Báo sự cố căn này" (opens a form, writes nothing).
    const below = btn.nextElementSibling as HTMLElement;
    fireEvent.click(btn);
    await wait(150);
    const startBtn = screen.getByRole('button', { name: tv('hk.action.start_cleaning') });
    // The next step is in the footer, not where "Báo cần dọn" was (ARC 4.3: before, same slot → CL).
    expect(startBtn.closest('.hk-foot')).not.toBeNull();
    expect(btn.isConnected).toBe(false);
    const stack = container.querySelector<HTMLElement>('.hk-stack')!;
    expect(
      within(stack).queryByRole('button', { name: tv('hk.action.start_cleaning') }),
    ).toBeNull();
    fireEvent.click(below);
    await wait(11_000);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
    await wait(20_000);
    expect(bodies('transitionRoomStatus').map((b) => (b as { event: string }).event)).toEqual([
      'needs_cleaning',
    ]);
    expect(mockControl.state.rooms.find((r) => r.no === '301')!.status).toBe('OD');
  });

  it('"Dọn xong" on a guest room, 11 s later: "Báo cần dọn" is back in the body, the footer stays empty', async () => {
    mockControl.setRoom('301', 'CL');
    const { user, container } = await openRoom('301', 'The Velvet');
    const finish = screen.getByRole('button', { name: tv('hk.action.finish_cleaning') });
    expect(finish.closest('.hk-foot')).not.toBeNull();
    await user.click(finish);
    // Guest staying (currentGuest in the mock now, like the server): "Khách đang ở – đã dọn", not a vacant room.
    expect(
      await screen.findByText(
        tv('hk.toast.room_status', { room: '301 · The Velvet', status: tv('hk.status.OC') }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: tv('hk.insp.title', { room: '301 · The Velvet' }) }),
    ).toBeNull();
    await wait(11_000);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
    await waitFor(() => expect(screen.queryByText(tv('hk.chip.queued'))).toBeNull());
    const needs = await screen.findByRole('button', { name: NEEDS() });
    expect(needs.closest('.hk-foot')).toBeNull();
    expect(container.querySelector('.hk-foot')).toBeNull();
    expect(mockControl.state.rooms.find((r) => r.no === '301')!.status).toBe('OC');
  });

  it('read-only session: no button even if the server lists needs_cleaning (the PWA checks writable too)', async () => {
    mockControl.scenario.allowedEventsOf = { '301': ['needs_cleaning'] };
    await start('mt.tung');
    await screen.findByRole('heading', { name: /Phiếu sửa/ });
    window.location.hash = `#/room/${roomId('301')}`;
    await screen.findByRole('heading', {
      name: tv('hk.room_title', { room: '301 · The Velvet' }),
    });
    expect(screen.queryByRole('button', { name: NEEDS() })).toBeNull();
    expect(screen.queryByText(tv('hk.needs_cleaning_help'))).toBeNull();
  });
});

describe('V5-15 – the mock answers like housekeeping.service (FB-R5-ARC-MOB-97-02)', () => {
  const old = () => new Date(Date.now() - 3 * 86_400_000).toISOString();

  it('HK outside scope T: 404 for every event, checked before performedAt; a desk role passes the scope', async () => {
    mockControl.signIn('hk.lan');
    expect(await transition('301', { event: 'needs_cleaning', expectedFrom: 'OC' })).toEqual({
      status: 404,
      code: 'NOT_FOUND',
    });
    // 402 (OD, no task today): scope T is not only for the new event.
    expect(await transition('402', { event: 'start_cleaning', expectedFrom: 'OD' })).toEqual({
      status: 404,
      code: 'NOT_FOUND',
    });
    expect(
      await transition('301', { event: 'needs_cleaning', expectedFrom: 'OC', performedAt: old() }),
    ).toEqual({ status: 404, code: 'NOT_FOUND' });
    mockControl.signIn('fdl.hanh');
    expect(
      await transition('301', { event: 'needs_cleaning', expectedFrom: 'OC', performedAt: old() }),
    ).toEqual({ status: 422, code: 'PERFORMED_AT_OUT_OF_RANGE' });
    expect((await transition('301', { event: 'needs_cleaning', expectedFrom: 'OC' })).status).toBe(
      200,
    );
  });

  it('a task assigned to another housekeeper does not put the room in scope T; assigned to me does', async () => {
    mockControl.setRoom('102', 'OC');
    const task = mockControl.state.tasks.find((x) => x.roomNo === '102')!;
    task.assignedUserId = MOCK_USERS['hk.mfa'].id;
    await openRoom('102', 'The Fern', 'hk.lan');
    expect(screen.queryByRole('button', { name: NEEDS() })).toBeNull();
    expect(await transition('102', { event: 'needs_cleaning', expectedFrom: 'OC' })).toEqual({
      status: 404,
      code: 'NOT_FOUND',
    });
    task.assignedUserId = MOCK_USERS['hk.lan'].id;
    expect((await transition('102', { event: 'needs_cleaning', expectedFrom: 'OC' })).status).toBe(
      200,
    );
  });

  it('a task of an earlier day keeps the room in scope T only while it is still open (OF_DAY, QA 97-02)', async () => {
    mockControl.setRoom('102', 'OC');
    const task = mockControl.state.tasks.find((x) => x.roomNo === '102')!;
    task.dueDate = new Date(Date.parse(`${task.dueDate}T00:00:00Z`) - 86_400_000)
      .toISOString()
      .slice(0, 10);
    task.status = 'done';
    mockControl.signIn('hk.lan');
    expect(await transition('102', { event: 'needs_cleaning', expectedFrom: 'OC' })).toEqual({
      status: 404,
      code: 'NOT_FOUND',
    });
    task.status = 'open'; // carried over from yesterday
    expect((await transition('102', { event: 'needs_cleaning', expectedFrom: 'OC' })).status).toBe(
      200,
    );
  });

  it('R8a: a stay-over cleaning task already open → OD without a second task', async () => {
    mockControl.setRoom('101', 'OC'); // 101 has an open stay-over task (guest asked for towels)
    const { user } = await openRoom('101', 'The Amber');
    await user.click(screen.getByRole('button', { name: NEEDS() }));
    await wait(11_000);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
    expect(mockControl.state.rooms.find((r) => r.no === '101')!.status).toBe('OD');
    expect(
      mockControl.state.tasks.filter((t) => t.roomNo === '101' && t.type === 'stayover_clean'),
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

  it('"Báo cần dọn" then "Bắt đầu dọn" while it waits: two commands in order, OC → OD then OD → CL (QA P1)', async () => {
    const { user } = await openRoom('301', 'The Velvet');
    await user.click(screen.getByRole('button', { name: NEEDS() }));
    await user.click(await screen.findByRole('button', { name: tv('hk.action.start_cleaning') }));
    await wait(11_000);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(2));
    expect(
      bodies('transitionRoomStatus').map((b) => {
        const x = b as { event: string; expectedFrom: string };
        return [x.event, x.expectedFrom];
      }),
    ).toEqual([
      ['needs_cleaning', 'OC'],
      ['start_cleaning', 'OD'],
    ]);
    expect(mockControl.state.rooms.find((r) => r.no === '301')!.status).toBe('CL');
    await wait(1_000);
    expect(screen.queryByRole('link', { name: /Cần xem lại/ })).toBeNull();
  });

  it('offline, two taps in one tick, back online 20 min later: one command, performedAt = tap time (QA P2)', async () => {
    await openRoom('301', 'The Velvet');
    setOnline(false);
    const tapped = Date.now();
    const btn = screen.getByRole('button', { name: NEEDS() });
    fireEvent.click(btn);
    fireEvent.click(btn);
    await wait(20 * 60_000);
    expect(calls('transitionRoomStatus')).toBe(0);
    setOnline(true);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
    await wait(30_000);
    expect(calls('transitionRoomStatus')).toBe(1);
    const body = bodies('transitionRoomStatus')[0] as { performedAt: string };
    expect(Math.abs(Date.parse(body.performedAt) - tapped)).toBeLessThan(1_500);
    expect(mockControl.state.rooms.find((r) => r.no === '301')!.status).toBe('OD');
  });

  it('HK leaves scope T while it waits (task cancelled): 404 → "Cần xem lại", room stays OC (QA P3)', async () => {
    mockControl.setRoom('102', 'OC');
    const { user } = await openRoom('102', 'The Fern', 'hk.lan');
    setOnline(false);
    await user.click(screen.getByRole('button', { name: NEEDS() }));
    await wait(11_000);
    // The desk cancels the room's task meanwhile: 102 is no longer in this housekeeper's scope T.
    for (const t of mockControl.state.tasks.filter((x) => x.roomNo === '102'))
      t.status = 'cancelled';
    setOnline(true);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
    expect(await screen.findByRole('link', { name: 'Cần xem lại (1)' })).toBeInTheDocument();
    expect(screen.getByText(tv('hk.queue.r.not_found'))).toBeInTheDocument();
    expect(mockControl.state.rooms.find((r) => r.no === '102')!.status).toBe('OC');
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

  it('422 PERFORMED_AT_OUT_OF_RANGE: "Báo cần dọn" asks whether the room still needs cleaning (PR97-02)', () => {
    const refused = (actionKey: string): QueueItem => ({
      ...needs('a', { actionKey }),
      seq: 1,
      sendAfter: T0,
      state: 'rejected',
      attempts: 1,
      rejection: { code: 'PERFORMED_AT_OUT_OF_RANGE', at: T0 + 86_400_000, status: 422 },
    });
    const time = hhmm(T0);
    expect(rejectionText(refused('hk.action.needs_cleaning'), tv).body).toBe(
      tv('hk.queue.r.time_report', { time }),
    );
    // The other room steps keep "Nếu việc đã xong…".
    expect(rejectionText(refused('hk.action.finish_cleaning'), tv).body).toBe(
      tv('hk.queue.r.time', { time }),
    );
  });

  it('button label is not the filter / status words (UXD 1.7 mục 9.7, FB-R5-UXD-FE-PR102-01)', () => {
    const label = NEEDS();
    expect(label.startsWith(tv('hk.filter.dirty', { n: 0 }).replace(/ \(0\)$/, ''))).toBe(false);
    expect(label).not.toBe(tv('hk.status.VD'));
    expect(label).not.toBe(tv('hk.status.OD'));
  });

  it('while "Báo cần dọn" waits (OD on the phone), the next step is "Bắt đầu dọn" only', () => {
    expect(eventsFor('OD', ['needs_cleaning'], true)).toEqual(['start_cleaning']);
    expect(eventsFor('OC', ['needs_cleaning'], false)).toEqual(['needs_cleaning']);
  });
});
