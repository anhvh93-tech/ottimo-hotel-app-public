// MOB Sprint 4 đợt 2: in-app inbox + SSE (role-filtered by the server), work order photos, H22.5 work order
// with a room block (US-061), app language sent to the inspection operations (0.3.7 bổ sung 1 #13).
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { businessDate } from '../app/time';
import { mockControl } from '../mocks/handlers';
import { bodies, calls, FakeEventSource, fakeConnect, setOnline, start, wait } from './helpers';

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

const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};

describe('in-app inbox (ADR-005 mục 4) – kind + reference only (SR-PWA-06)', () => {
  it('bell shows the unread count; the list words each kind; opening one marks it read and goes there', async () => {
    const { user } = await start('mt.tung');
    const bell = await screen.findByRole('link', { name: 'Thông báo, 2 chưa đọc' });
    await user.click(bell);
    expect(await screen.findByText('Phiếu sửa Gấp – nhận việc trong 15 phút')).toBeInTheDocument();
    expect(screen.getByText('Việc gấp đã lên đầu danh sách')).toBeInTheDocument();
    expect(screen.getByText('Căn 302')).toBeInTheDocument(); // room number only, no guest
    await user.click(screen.getByRole('button', { name: /Phiếu sửa Gấp/ }));
    expect(await screen.findByRole('heading', { name: /WO-00005/ })).toBeInTheDocument();
    await waitFor(() => expect(calls('markNotificationRead')).toBe(1));
    expect(await screen.findByRole('link', { name: 'Thông báo, 1 chưa đọc' })).toBeInTheDocument();
  });

  it('SSE notification.created → the inbox reloads and a polite announcement is made (no focus move)', async () => {
    await start('hk.lan', fakeConnect);
    await screen.findByRole('link', { name: 'Thông báo, 2 chưa đọc' });
    expect(FakeEventSource.last!.url).toMatch(/\/v1\/properties\/.+\/events$/);
    mockControl.notify({ kind: 'hk_task_cancelled', refType: 'hk_task', refCode: '102' });
    FakeEventSource.last!.emit('notification.created');
    await wait(400);
    expect(await screen.findByRole('link', { name: 'Thông báo, 3 chưa đọc' })).toBeInTheDocument();
    expect(screen.getByText(/^Có thông báo mới/)).toBeInTheDocument();
  });

  it('SSE room.status_changed / hk_task.changed re-read the lists; while the stream is open nothing polls', async () => {
    await start('hk.lan', fakeConnect);
    await screen.findByText('Làm trước');
    await wait(500);
    const before = calls('listRoomStatuses');
    mockControl.setRoom('202', 'CL');
    FakeEventSource.last!.emit('room.status_changed');
    FakeEventSource.last!.emit('hk_task.changed');
    await wait(400);
    await waitFor(() => expect(calls('listRoomStatuses')).toBe(before + 1)); // one burst → one re-read
    const r202 = await screen.findByRole('article', { name: 'Căn 202, The Valley' });
    expect(within(r202).getByText('Đang dọn')).toBeInTheDocument();
    const settled = calls('listRoomStatuses');
    await wait(130_000); // two poll periods
    expect(calls('listRoomStatuses')).toBe(settled);
  });

  it('a Desk-only topic (front desk lead) says "see OTTIMO Desk" instead of a broken sentence', async () => {
    mockControl.notify({
      kind: 'approval_requested',
      refType: 'approval_request',
      refCode: 'OTM-0150',
    });
    const { user } = await start('fdl.hanh');
    await user.click(await screen.findByRole('link', { name: /Thông báo/ }));
    expect(
      await screen.findByText('Thông báo mới – xem chi tiết trên OTTIMO Desk'),
    ).toBeInTheDocument();
  });
});

describe('H22 22.2 – photos when reported', () => {
  it('loads each photo through getAttachment; a photo deleted by retention shows a plain tile', async () => {
    const { user } = await start('mt.tung');
    await user.click(await screen.findByRole('link', { name: /^WO-00005/ }));
    expect(await screen.findByRole('heading', { name: 'Ảnh lúc báo' })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Ảnh 1' })).toHaveAttribute(
      'src',
      expect.stringMatching(/^blob:/),
    );
    expect(await screen.findByText('Chưa mở được ảnh')).toBeInTheDocument();
    expect(calls('getAttachment')).toBeGreaterThanOrEqual(2);
  });
});

describe('H22 22.5 – new work order with a room block (US-061, A86)', () => {
  it('maintenance blocks a free room: online only, server dates shown ("đã khóa" only after the answer)', async () => {
    const { user } = await start('mt.tung');
    await user.click(await screen.findByRole('link', { name: 'Phiếu sửa mới' }));
    expect(await screen.findByRole('heading', { name: /Phiếu sửa mới/ })).toBeInTheDocument();
    await user.selectOptions(
      screen.getByLabelText('Căn'),
      screen.getByRole('option', { name: '203 · The Sage' }),
    );
    await user.click(screen.getByRole('button', { name: 'Điện / đèn' }));
    await user.type(screen.getByLabelText(/Mô tả/), 'Đèn ban công chập chờn, thay dây');
    await user.click(
      screen.getByRole('checkbox', { name: 'Khóa căn – không bán đến khi sửa xong' }),
    );
    const today = businessDate();
    await user.type(screen.getByLabelText('Dự kiến xong'), addDays(today, 1));
    expect(screen.getByText(/Ngày mở bán lại do hệ thống tính/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tạo phiếu và khóa căn' }));
    expect(await screen.findByText('Đã khóa – ngừng bán trên mọi kênh')).toBeInTheDocument();
    const [d, m] = [addDays(today, 2).slice(8, 10), addDays(today, 2).slice(5, 7)];
    expect(screen.getByText(new RegExp(`mở bán lại từ ${d}/${m}`))).toBeInTheDocument();
    expect(bodies('createWorkOrder')[0]).toMatchObject({
      block: { startDate: today, expectedDoneDate: addDays(today, 1), reason: 'Điện / đèn' },
      blockRequested: false,
    });
  });

  it('bookings in the block → list them (no guest name), offer to create without the block', async () => {
    const { user } = await start('mt.tung');
    await user.click(await screen.findByRole('link', { name: 'Phiếu sửa mới' }));
    await user.selectOptions(
      await screen.findByLabelText('Căn'),
      screen.getByRole('option', { name: '302 · The Ivory' }),
    );
    await user.type(screen.getByLabelText(/Mô tả/), 'Bồn cầu rò nước');
    await user.click(
      screen.getByRole('checkbox', { name: 'Khóa căn – không bán đến khi sửa xong' }),
    );
    await user.type(screen.getByLabelText('Dự kiến xong'), addDays(businessDate(), 1));
    await user.type(screen.getByLabelText('Lý do khóa'), 'Sửa bồn cầu');
    await user.click(screen.getByRole('button', { name: 'Tạo phiếu và khóa căn' }));
    expect(await screen.findByText('Khoảng khóa trùng 1 đơn đã đặt')).toBeInTheDocument();
    expect(screen.getByText('OTM-0154')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('Must not be shown');
    await user.click(screen.getByRole('button', { name: 'Tạo phiếu không khóa' }));
    expect(await screen.findByText(/Đã tạo phiếu WO-\d{5}/)).toBeInTheDocument();
    const second = bodies('createWorkOrder')[1] as Record<string, unknown>;
    expect(second).not.toHaveProperty('block');
  });

  it('room with a guest staying → "move the guest first"; offline → the block button needs a connection', async () => {
    const { user } = await start('mt.tung');
    await user.click(await screen.findByRole('link', { name: 'Phiếu sửa mới' }));
    await user.selectOptions(
      await screen.findByLabelText('Căn'),
      screen.getByRole('option', { name: '101 · The Amber' }),
    );
    await user.type(screen.getByLabelText(/Mô tả/), 'Rò nước trần');
    await user.click(
      screen.getByRole('checkbox', { name: 'Khóa căn – không bán đến khi sửa xong' }),
    );
    await user.type(screen.getByLabelText('Dự kiến xong'), addDays(businessDate(), 1));
    await user.type(screen.getByLabelText('Lý do khóa'), 'Sửa trần');
    await user.click(screen.getByRole('button', { name: 'Tạo phiếu và khóa căn' }));
    expect(await screen.findByText('Căn đang có khách – chưa khóa được')).toBeInTheDocument();
    setOnline(false);
    expect(await screen.findByRole('button', { name: 'Cần có mạng' })).toBeDisabled();
  });

  it('housekeeping never sees the block form – only the suggestion (A86)', async () => {
    const { user } = await start('hk.lan');
    await user.click(await screen.findByRole('link', { name: 'Báo sự cố' }));
    expect(await screen.findByRole('checkbox', { name: /Đề nghị khóa căn/ })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /^Khóa căn/ })).toBeNull();
  });
});

describe('app language to the server (0.3.7 bổ sung 1 #13)', () => {
  it('English UI → checklist labels and the inspection record ask for en, whatever the browser says', async () => {
    const { user } = await start('fdl.hanh');
    await user.click(await screen.findByRole('link', { name: 'Tôi' }));
    await user.click(await screen.findByRole('button', { name: 'English' }));
    await user.click(await screen.findByRole('link', { name: 'Rooms' }));
    await user.click(await screen.findByRole('link', { name: /^Room 203, The Sage/ }));
    await user.click(await screen.findByRole('link', { name: 'Inspect room 203 · The Sage' }));
    for (const box of await screen.findAllByRole('checkbox')) await user.click(box);
    await user.click(screen.getByRole('button', { name: 'Passed – ready' }));
    await wait(11_000);
    await waitFor(() => expect(calls('recordInspection')).toBe(1));
    expect(mockControl.state.languages).toEqual(
      expect.arrayContaining([
        { op: 'getInspectionChecklist', lang: 'en' },
        { op: 'recordInspection', lang: 'en' },
      ]),
    );
  });
});
