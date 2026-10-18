// UXR S4 walkthrough of the PWA (rounds/round-02/outputs/UXR/s4-pwa-walkthrough.md) – MOB fixes, one case or
// more per item: P-04, P-05, P-07, P-08 (+ P-01 wording), P-09, P-10, P-11, P-12, P-13, P-16, P-27, P-28, P-31, P-33.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { guestName } from '../app/rooms';
import { refillText } from '../app/tasks';
import { MemoryStore } from '../data/store';
import { mockControl, MOCK_PASSWORD } from '../mocks/handlers';
import { server } from '../mocks/node';
import { bodies, calls, setOnline, start, tv, wait } from './helpers';

vi.mock('../app/image', async (orig) => ({
  ...(await orig<typeof import('../app/image')>()),
  compressPhoto: vi.fn(async () => new Blob([new Uint8Array(2000)], { type: 'image/jpeg' })),
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  setOnline(true);
});
afterEach(() => {
  vi.useRealTimers();
});

const P = '/v1/properties/:propertyId';

/** UXD sentence with a `{time}` placeholder, as a pattern (the tap time is not fixed in the test). */
function withTime(key: string): RegExp {
  const parts = tv(key, { time: '\u0000' }).split('\u0000');
  return new RegExp(
    parts.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\d\\d:\\d\\d'),
  );
}

/** Open the app on a given phone store (like opening it again after closing it). */
function open(store: MemoryStore, strict = true) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const ui = <App store={store} />;
  const utils = render(strict ? <StrictMode>{ui}</StrictMode> : ui);
  return { user, ...utils };
}

async function signIn(user: ReturnType<typeof userEvent.setup>, username = 'hk.lan') {
  await user.type(await screen.findByLabelText('Tên đăng nhập'), username);
  await user.type(screen.getByLabelText('Mật khẩu'), MOCK_PASSWORD);
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
}

async function reportOffline(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('link', { name: 'Báo sự cố' }));
  setOnline(false);
  await user.selectOptions(
    await screen.findByLabelText('Căn'),
    screen.getByRole('option', { name: '401 · The Pine' }),
  );
  await user.click(screen.getByRole('button', { name: 'Mất nước nóng' }));
  await user.type(screen.getByLabelText(/Mô tả/), 'Vòi sen chỉ ra nước lạnh');
  await user.upload(
    document.querySelector<HTMLInputElement>('input[type=file]')!,
    new File([new Uint8Array(9)], 'a.jpg', { type: 'image/jpeg' }),
  );
  await user.click(screen.getByRole('button', { name: 'Gửi báo sự cố' }));
  expect(await screen.findByText(tv('hk.wo.queued_title'))).toBeInTheDocument();
}

describe('P-05 (mức 3) – offline incident photo reaches the work order', () => {
  it('report + photo offline, app closed, opened again with the network back → the work order has the photo', async () => {
    const store = new MemoryStore();
    const first = open(store);
    await signIn(first.user);
    await screen.findByRole('heading', { name: /Việc của tôi/ });
    await reportOffline(first.user);
    first.unmount();

    setOnline(true);
    open(store); // start-up reads the queue while the timer flush may already be sending the photo
    await waitFor(() => expect(calls('createWorkOrder')).toBe(1));
    expect(calls('uploadAttachment')).toBe(1);
    const wo = bodies('createWorkOrder')[0] as { photoAttachmentIds?: string[] };
    expect(wo.photoAttachmentIds).toHaveLength(1);
    expect(wo.photoAttachmentIds![0]).toMatch(/^0192/);
  });
});

describe('P-04 (mức 3) – minibar refill names the items', () => {
  it('with names from the API (BE-B 18/10): "Bia Đà Lạt × 2, Coca-Cola lon × 1"', async () => {
    await start();
    expect(
      await screen.findByText(tv('hk.refill', { items: 'Bia Đà Lạt × 2, Coca-Cola lon × 1' })),
    ).toBeInTheDocument();
  });

  it('without names (0.3.7 server today): never "1, 1" – how many, and where to look', async () => {
    const t = mockControl.state.tasks.find((x) => x.refillItems?.length)!;
    t.refillItems = [
      { itemId: '0192a1b0-0000-7000-8000-00000000b001', quantity: 1 },
      { itemId: '0192a1b0-0000-7000-8000-00000000b002', quantity: 1 },
    ];
    await start();
    expect(await screen.findByText(tv('hk.refill_unnamed', { n: 2 }))).toBeInTheDocument();
    expect(screen.queryByText(/Bổ sung minibar: 1, 1/)).toBeNull();
  });

  it('refillText(): "name × quantity"; one name missing (task written before BE-B) → the count sentence', () => {
    expect(refillText([{ itemName: 'Bia Đà Lạt', quantity: 2 }], tv)).toBe(
      tv('hk.refill', { items: 'Bia Đà Lạt × 2' }),
    );
    expect(refillText([{ itemName: ' Nước suối ' }], tv)).toBe(
      tv('hk.refill', { items: 'Nước suối × 1' }),
    );
    expect(
      refillText(
        [
          { itemName: 'Bia Đà Lạt', quantity: 2 },
          { itemId: '0192a1b0-0000-7000-8000-00000000b002', quantity: 1 },
        ],
        tv,
      ),
    ).toBe(tv('hk.refill_unnamed', { n: 3 }));
  });
});

describe('P-07 – one count, one state per row', () => {
  it('pill and "Thao tác trên máy" say the same number; each row: tap time once + its state', async () => {
    const { user } = await start();
    const r202 = await screen.findByRole('article', { name: 'Căn 202, The Valley' });
    setOnline(false);
    await user.click(within(r202).getByRole('button', { name: 'Bắt đầu dọn' }));
    await wait(11_000);
    await user.click(await screen.findByRole('button', { name: 'Dọn xong' })); // in its 10-second window
    expect(
      await screen.findByRole('link', { name: tv('hk.queue_pill', { n: 1 }) }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: tv('hk.queue_pill', { n: 1 }) }));
    expect(
      await screen.findByRole('heading', { name: tv('hk.queue.pending', { n: 1 }) }),
    ).toBeInTheDocument();
    await wait(11_000);
    expect(
      await screen.findByRole('heading', { name: tv('hk.queue.pending', { n: 2 }) }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: tv('hk.queue_pill', { n: 2 }) })).toBeInTheDocument();
    const rows = within(
      screen.getByRole('region', { name: tv('hk.queue.pending', { n: 2 }) }),
    ).getAllByRole('listitem');
    for (const row of rows) {
      expect(within(row).getAllByText(/^Bấm lúc/)).toHaveLength(1);
      expect(within(row).getByText(tv('hk.queue.waiting'))).toBeInTheDocument();
    }
  });
});

describe('P-08 / P-01 – "Cần xem lại" in plain words, with "Gửi lại"', () => {
  it('422 performedAt (P-01): plain sentence, no code in it; "Gửi lại" sends again with the new time', async () => {
    const { user } = await start();
    mockControl.scenario.failNext = {
      op: 'transitionRoomStatus',
      status: 422,
      code: 'VALIDATION_FAILED',
      extra: { errors: [{ field: 'performedAt', code: 'PERFORMED_AT_OUT_OF_RANGE' }] },
    };
    const r202 = await screen.findByRole('article', { name: 'Căn 202, The Valley' });
    const tapped = Date.now();
    await user.click(within(r202).getByRole('button', { name: 'Bắt đầu dọn' }));
    await wait(11_000);
    expect(await screen.findByText(withTime('hk.queue.r.time'))).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/VALIDATION_FAILED|PERFORMED_AT_OUT_OF_RANGE/);
    expect(calls('transitionRoomStatus')).toBe(1); // refused (the mock keeps no body for it)
    await wait(60_000);
    await user.click(
      screen.getByRole('button', {
        name: tv('hk.queue.resend', { action: tv('hk.action.start_cleaning') }),
      }),
    );
    expect(
      await screen.findByText(
        tv('hk.queue.resent_toast', {
          room: '202 · The Valley',
          action: tv('hk.action.start_cleaning'),
        }),
      ),
    ).toBeInTheDocument();
    await wait(11_000);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(2));
    const again = bodies('transitionRoomStatus')[0] as { performedAt: string; event: string };
    expect(again.event).toBe('start_cleaning');
    expect(Date.parse(again.performedAt) - tapped).toBeGreaterThan(50_000);
    await waitFor(() => expect(screen.queryByRole('link', { name: /Cần xem lại/ })).toBeNull());
  });

  it('other refusals: a sentence per reason, the code only as a small reference', async () => {
    const { user } = await start();
    mockControl.scenario.failNext = { op: 'transitionRoomStatus', status: 403, code: 'FORBIDDEN' };
    const r202 = await screen.findByRole('article', { name: 'Căn 202, The Valley' });
    await user.click(within(r202).getByRole('button', { name: 'Bắt đầu dọn' }));
    await wait(11_000);
    await user.click(await screen.findByRole('link', { name: 'Cần xem lại (1)' }));
    expect(
      await screen.findByText(tv('hk.queue.r.forbidden'), { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText(tv('hk.queue.ref_code', { code: 'FORBIDDEN' }))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Gửi lại/ })).toBeNull();
  });
});

describe('P-09 / P-28 – opening the app while the server is down, sign-in screen', () => {
  it('502 at start-up = no server: the app opens with the profile on the phone, not the sign-in screen', async () => {
    const store = new MemoryStore();
    const first = open(store);
    await signIn(first.user);
    await screen.findByRole('heading', { name: /Việc của tôi/ });
    first.unmount();
    server.use(
      http.get('/v1/me', () =>
        HttpResponse.json(
          { type: 'x', title: 'Bad gateway', status: 502, code: 'INTERNAL_ERROR' },
          { status: 502 },
        ),
      ),
    );
    open(store, false);
    expect(await screen.findByRole('heading', { name: /Việc của tôi/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Đăng nhập' })).toBeNull();
  });

  it('sign-in screen says how many actions are still on the phone (not only when the session ended)', async () => {
    const store = new MemoryStore();
    const first = open(store);
    await signIn(first.user);
    const r202 = await screen.findByRole('article', { name: 'Căn 202, The Valley' });
    setOnline(false);
    await first.user.click(within(r202).getByRole('button', { name: 'Bắt đầu dọn' }));
    await wait(11_000);
    first.unmount();
    setOnline(true);
    server.use(
      http.get('/v1/me', () =>
        HttpResponse.json(
          { type: 'x', title: 'Forbidden', status: 403, code: 'FORBIDDEN' },
          { status: 403 },
        ),
      ),
    );
    open(store, false);
    expect(await screen.findByText(tv('hk.queue.relogin_body', { n: 1 }))).toBeInTheDocument();
  });

  it('P-28: network error at sign-in names the button that is there ("Đăng nhập")', async () => {
    server.use(http.post('/v1/auth/login', () => HttpResponse.error()));
    const { user } = open(new MemoryStore());
    await signIn(user);
    expect(await screen.findByText(tv('login.error_network'))).toBeInTheDocument();
  });
});

describe('P-10 – inspection: only required items lock "Kiểm đạt"', () => {
  it('front desk lead: optional item and the optional room photo do not block; nothing unticked is sent as failed', async () => {
    server.use(
      http.get(`${P}/inspection-checklist`, () =>
        HttpResponse.json({
          version: mockControl.state.checklistVersion,
          items: [
            { code: 'i01', label: 'Ga gối phẳng, sạch', required: true },
            { code: 'i02', label: 'Phòng tắm khô, không tóc', required: true },
            { code: 'i13', label: 'Hoa trang trí', required: false },
            { code: 'i12', label: 'Ảnh phòng', required: false, photoRequired: false },
          ],
        }),
      ),
    );
    const { user } = await start('fdl.hanh');
    await user.click(await screen.findByRole('link', { name: 'Các căn' }));
    await user.click(await screen.findByRole('link', { name: /^Căn 203, The Sage/ }));
    await user.click(await screen.findByRole('link', { name: 'Kiểm phòng 203 · The Sage' }));
    const pass = await screen.findByRole('button', { name: 'Kiểm đạt – sẵn sàng' });
    expect(screen.queryByRole('checkbox', { name: /Ảnh phòng/ })).toBeNull(); // a photo step, not a tick
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    await user.click(screen.getByRole('checkbox', { name: /Ga gối phẳng/ }));
    expect(pass).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('checkbox', { name: /Phòng tắm khô/ }));
    expect(pass).not.toHaveAttribute('aria-disabled');
    await user.click(pass);
    await wait(11_000);
    await waitFor(() => expect(calls('recordInspection')).toBe(1));
    expect(bodies('recordInspection')[0]).toMatchObject({
      items: [
        { code: 'i01', passed: true },
        { code: 'i02', passed: true },
      ],
    });
    expect(bodies('recordInspection')[0]).not.toHaveProperty('photoAttachmentIds');
  });
});

describe('P-11 – repaired work order: what was done, photos titled honestly', () => {
  it('shows "Kết quả: …" and does not call the after-repair photos "Ảnh lúc báo"', async () => {
    const wo = mockControl.state.workOrders.find((w) => w.code === 'WO-00005')!;
    Object.assign(wo, {
      status: 'done',
      doneAt: new Date().toISOString(),
      resultNote: 'Đã thay rơ-le bình nóng lạnh',
    });
    await start('mt.tung');
    window.location.hash = `#/wo/${wo.id}`;
    expect(
      await screen.findByText(tv('wo.result_info', { note: 'Đã thay rơ-le bình nóng lạnh' })),
    ).toBeInTheDocument();
    expect(screen.getByText(tv('wo.photos_report_and_after'))).toBeInTheDocument();
    expect(screen.queryByText(tv('wo.photos_reported'))).toBeNull();
  });
});

describe('P-12 / P-13 / P-33 – "Việc của tôi"', () => {
  it('P-12: the first group is "Làm trước" – it does not claim "guests arriving today"', async () => {
    await start();
    expect(await screen.findByRole('heading', { name: tv('hk.grp.do_first') })).toBeInTheDocument();
    expect(screen.queryByText(/có khách đến hôm nay$/)).toBeNull();
  });

  it('P-13: "Khách không muốn dọn" → toast names the room, the task stays under "Đã bỏ (1)" with its reason', async () => {
    const { user } = await start();
    const r102 = await screen.findByRole('article', { name: 'Căn 102, The Fern' });
    await user.click(within(r102).getByRole('link', { name: 'Khách không muốn dọn' }));
    await user.click(await screen.findByRole('radio', { name: tv('hk.refuse.dnd') }));
    await user.click(screen.getByRole('button', { name: 'Bỏ việc dọn hôm nay' }));
    expect(
      await screen.findByText(tv('hk.toast.refused', { room: '102 · The Fern' })),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: tv('hk.grp.cancelled', { n: 1 }) }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${tv('hk.type.long_stay_clean')} – ${tv('hk.refuse.dnd')}`),
    ).toBeInTheDocument();
    await wait(11_000);
    await waitFor(() => expect(calls('transitionHkTask')).toBe(1));
    expect(
      await screen.findByRole('heading', { name: tv('hk.grp.cancelled', { n: 1 }) }),
    ).toBeInTheDocument();
  });

  it('P-13: a "Đã xong" card names the task and its time, not the room status', async () => {
    await start();
    const done = await screen.findByRole('article', { name: /^203/ });
    expect(
      within(done).getByText(
        tv('hk.task_done_at', { task: tv('hk.type.checkout_clean'), time: '09:40' }),
      ),
    ).toBeInTheDocument();
    expect(done.querySelector('.chip')).toBeNull();
  });

  it('P-33: "Khách: Khoa" – the room number is not repeated after the name', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Các căn' }));
    const r101 = await screen.findByRole('link', { name: /^Căn 101, The Amber/ });
    expect(within(r101).getByText(tv('hk.guest_first_name', { name: 'Khoa' }))).toBeInTheDocument();
    expect(r101.textContent).not.toContain('Khoa · 101');
  });

  it('BR-614: task card = "101 · Khách: Khoa" – given name next to the room, the number shown once', async () => {
    await start();
    const card = await screen.findByRole('article', { name: 'Căn 101, The Amber' });
    expect(within(card).getByText(tv('hk.guest_first_name', { name: 'Khoa' }))).toBeInTheDocument();
    expect(card.textContent!.match(/101/g)).toHaveLength(1);
  });

  it('BR-614: a server still sending "Huy · 101" never makes the card read "Khách: Huy · 101"', async () => {
    mockControl.state.rooms.find((r) => r.no === '101')!.guest = 'Huy · 101';
    await start();
    const card = await screen.findByRole('article', { name: 'Căn 101, The Amber' });
    expect(within(card).getByText(tv('hk.guest_first_name', { name: 'Huy' }))).toBeInTheDocument();
    expect(card.textContent!.match(/101/g)).toHaveLength(1);
  });

  it('BR-614: booking without a name yet → only "101", no "Khách:" line', async () => {
    mockControl.state.rooms.find((r) => r.no === '101')!.guest = undefined;
    await start();
    const card = await screen.findByRole('article', { name: 'Căn 101, The Amber' });
    expect(
      within(card).queryByText(tv('hk.guest_first_name', { name: '' }).trim(), { exact: false }),
    ).toBeNull();
    expect(card.textContent!.match(/101/g)).toHaveLength(1);
  });

  it('BR-614 guestName(): server value shown as is, room part dropped, never split on the phone', () => {
    expect(guestName({ roomNo: '101', currentGuest: 'Huy · 101' })).toBe('Huy'); // server not updated yet
    expect(guestName({ roomNo: '101', currentGuest: 'Huy' })).toBe('Huy'); // BE-C: given name only
    expect(guestName({ roomNo: '101', currentGuest: 'Kim' })).toBe('Kim');
    expect(guestName({ roomNo: '101', currentGuest: '101' })).toBe(''); // no name yet → card shows "101"
    expect(guestName({ roomNo: '101', currentGuest: ' · 101' })).toBe('');
    expect(guestName({ roomNo: '101' })).toBe('');
    // The phone never guesses a given name from a full name (VN last word vs foreign surname – server rule).
    expect(guestName({ roomNo: '101', currentGuest: 'Phạm Gia Huy' })).toBe('Phạm Gia Huy');
  });
});

describe('P-16 / P-31 – incident report', () => {
  it('P-16: sent → "Đã gửi tới bảo trì", not "Bảo trì đã thấy phiếu"', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Báo sự cố' }));
    await user.selectOptions(
      await screen.findByLabelText('Căn'),
      screen.getByRole('option', { name: '202 · The Valley' }),
    );
    await user.click(screen.getByRole('button', { name: 'Khác' }));
    await user.type(screen.getByLabelText(/Mô tả/), 'Rèm bị kẹt');
    await user.click(screen.getByRole('button', { name: 'Gửi báo sự cố' }));
    expect(await screen.findByText(tv('hk.wo.sent_to_mt'))).toBeInTheDocument();
    expect(screen.queryByText(tv('hk.wo.sent_body'))).toBeNull();
  });

  it('P-31: offline report form shows its own note only – no second banner above it', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Báo sự cố' }));
    setOnline(false);
    expect(await screen.findByText(tv('hk.wo.offline'))).toBeInTheDocument();
    expect(screen.queryByText(tv('hk.offline_bar'))).toBeNull();
    // Other screens keep the general banner.
    await user.click(screen.getByRole('link', { name: 'Các căn' }));
    expect(await screen.findByText(tv('hk.offline_bar'))).toBeInTheDocument();
  });
});

describe('P-27 – bottom bar', () => {
  it('"Việc" fits one line; a room opened from "Việc" keeps "Việc" lit, from "Các căn" keeps "Các căn"', async () => {
    const { user } = await start();
    const nav = await screen.findByRole('navigation', { name: 'Menu chính' });
    const r202 = await screen.findByRole('article', { name: 'Căn 202, The Valley' });
    await user.click(within(r202).getByRole('button', { name: 'Bắt đầu dọn' }));
    await screen.findByRole('button', { name: 'Dọn xong' });
    expect(within(nav).getByRole('link', { name: 'Việc' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Các căn' })).not.toHaveAttribute('aria-current');
    await user.click(within(nav).getByRole('link', { name: 'Các căn' }));
    await user.click(await screen.findByRole('link', { name: /^Căn 101, The Amber/ }));
    await screen.findByRole('heading', { name: /Căn 101/ });
    expect(within(nav).getByRole('link', { name: 'Các căn' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
