// H19–H22 against the MSW mock of OpenAPI 0.3.7 (same handlers as `pnpm dev`): sign-in by role, today's
// tasks, 10-second undo (= delayed send, no API call), offline queue, refusals, inspection, incident report,
// maintenance. Fake timers drive the 10-second window.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { MemoryStore } from '../data/store';
import { mockControl } from '../mocks/handlers';
import { bodies, calls, setOnline, start, wait } from './helpers';

// Canvas is not available in jsdom: compression is a pass-through here.
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

describe('sign-in by role (ADR-005)', () => {
  it('housekeeping lands on "Việc của tôi" with the 4-tab bar', async () => {
    await start('hk.lan');
    expect(await screen.findByRole('heading', { name: /Việc của tôi/ })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Menu chính' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Việc', 'Các căn', 'Báo sự cố', 'Tôi']); // UXR P-27: short label, one line at 360 px
  });

  it('maintenance lands on "Phiếu sửa"', async () => {
    await start('mt.tung');
    expect(await screen.findByRole('heading', { name: /Phiếu sửa/ })).toBeInTheDocument();
  });

  it('sales account → no screens here, only sign out', async () => {
    await start('sale.minh');
    expect(
      await screen.findByRole('heading', { name: 'Bạn không có quyền mở trang này' }),
    ).toBeInTheDocument();
  });

  it('wrong password → one generic sentence (no hint which part is wrong)', async () => {
    const store = new MemoryStore();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App store={store} />);
    await user.type(await screen.findByLabelText('Tên đăng nhập'), 'hk.lan');
    await user.type(screen.getByLabelText('Mật khẩu'), 'not-the-password');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByText(/Tên đăng nhập hoặc mật khẩu không đúng/)).toBeInTheDocument();
  });
});

describe('H19 – today’s tasks (US-052, US-054)', () => {
  it('groups by the hi-fi rules, shows "302 / The Ivory" and the x/y counter; never a status code', async () => {
    await start();
    expect(await screen.findByText('Làm trước')).toBeInTheDocument(); // UXR P-12
    expect(screen.getByText('Khách đang ở')).toBeInTheDocument();
    expect(screen.getByText('Sau khi khách trả phòng')).toBeInTheDocument();
    expect(screen.getByText('1/6 xong')).toBeInTheDocument();
    const kit = screen.getByRole('article', { name: 'Căn 302, The Ivory' });
    expect(within(kit).getByText('The Ivory')).toBeInTheDocument();
    expect(
      within(kit).getByText(/Chuẩn bị 1 bộ đồ dùng thêm – căn 302 · The Ivory, trước 14:00/),
    ).toBeInTheDocument();
    // Guest app request: chip + the guest's own words (online only)
    const r101 = screen.getByRole('article', { name: 'Căn 101, The Amber' });
    expect(within(r101).getByText('App khách')).toBeInTheDocument();
    expect(within(r101).getByText('Khách nhắn: "Thêm 2 khăn tắm"')).toBeInTheDocument();
    // 201: guest still in → waiting for check-out, locked
    const r201 = screen.getByRole('article', { name: 'Căn 201, The Mist' });
    expect(within(r201).getByRole('button', { name: 'Chờ khách trả phòng' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(document.body.textContent).not.toMatch(/\b(VD|OD|VC|OOO)\b/);
  });

  it('"Các căn" filter "Cần dọn" keeps VD / OD / CL only (US-052 AC2)', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Các căn' }));
    await user.click(await screen.findByRole('button', { name: /^Cần dọn/ }));
    const links = screen.getAllByRole('link', { name: /^Căn \d{3}/ });
    expect(links.map((l) => l.getAttribute('aria-label')!.slice(0, 8))).toEqual([
      'Căn 101,',
      'Căn 102,',
      'Căn 201,',
      'Căn 202,',
      'Căn 402,',
    ]);
  });
});

describe('H20 – 10-second undo = delayed send (DS 6.18, ADR-005)', () => {
  it('"Hoàn tác" within 10 s: the server never hears about it', async () => {
    const { user } = await start();
    const r202 = await screen.findByRole('article', { name: 'Căn 202, The Valley' });
    await user.click(within(r202).getByRole('button', { name: 'Bắt đầu dọn' }));
    expect(await screen.findByText('Căn 202 · The Valley: Đang dọn')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Hoàn tác \(\d+\)/ }));
    expect(
      await screen.findByText('Đã hoàn tác – căn 202 · The Valley vẫn là "Cần dọn (khách đã đi)"'),
    ).toBeInTheDocument();
    await wait(15_000);
    expect(calls('transitionRoomStatus')).toBe(0);
  });

  it('after 10 s it is sent once with performedAt = the tap time, then "Dọn xong" is next', async () => {
    const { user } = await start();
    const r202 = await screen.findByRole('article', { name: 'Căn 202, The Valley' });
    const tapped = Date.now();
    await user.click(within(r202).getByRole('button', { name: 'Bắt đầu dọn' }));
    // moved to the room screen, optimistic state + "Chờ gửi"
    expect(
      await screen.findByRole('heading', { name: /Căn 202 · The Valley/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Chờ gửi')).toBeInTheDocument();
    await wait(9_000);
    expect(calls('transitionRoomStatus')).toBe(0);
    await wait(2_000);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
    const body = bodies('transitionRoomStatus')[0] as {
      event: string;
      expectedFrom: string;
      performedAt: string;
    };
    expect(body).toMatchObject({ event: 'start_cleaning', expectedFrom: 'VD' });
    expect(Math.abs(Date.parse(body.performedAt) - tapped)).toBeLessThan(1_500);
    expect(await screen.findByRole('button', { name: 'Dọn xong' })).toBeInTheDocument();
  });

  it('offline: still tappable, kept on the phone ("n thao tác đang chờ gửi"), sent when back online', async () => {
    const { user } = await start();
    const r202 = await screen.findByRole('article', { name: 'Căn 202, The Valley' });
    setOnline(false);
    expect(await screen.findByText(/Mất mạng. Bấm vẫn được/)).toBeInTheDocument();
    await user.click(within(r202).getByRole('button', { name: 'Bắt đầu dọn' }));
    await wait(11_000);
    expect(await screen.findByText('Đã lưu trên máy – sẽ tự gửi khi có mạng')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1 thao tác đang chờ gửi' })).toBeInTheDocument();
    expect(calls('transitionRoomStatus')).toBe(0);
    setOnline(true);
    await waitFor(() => expect(calls('transitionRoomStatus')).toBe(1));
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: /thao tác đang chờ gửi/ })).toBeNull(),
    );
  });

  it('refused by the server (room locked meanwhile) → "Cần xem lại" with the reason, never dropped silently', async () => {
    const { user } = await start();
    const r202 = await screen.findByRole('article', { name: 'Căn 202, The Valley' });
    mockControl.setRoom('202', 'OOO');
    await user.click(within(r202).getByRole('button', { name: 'Bắt đầu dọn' }));
    await wait(11_000);
    expect(
      await screen.findByText(/Căn 202 · The Valley – "Bắt đầu dọn" không áp dụng được/),
    ).toBeInTheDocument();
    expect(screen.getByText(/căn đã là "Đang sửa – không bán"/)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Cần xem lại (1)' }));
    await user.click(await screen.findByRole('button', { name: 'Đã hiểu' }));
    expect(await screen.findByText('Đã gửi hết')).toBeInTheDocument();
  });

  it('"Khách không muốn dọn" needs a reason and sends cancel with the reason code', async () => {
    const { user } = await start();
    const r102 = await screen.findByRole('article', { name: 'Căn 102, The Fern' });
    await user.click(within(r102).getByRole('link', { name: 'Khách không muốn dọn' }));
    await user.click(await screen.findByRole('button', { name: 'Bỏ việc dọn hôm nay' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Bắt buộc');
    await user.click(screen.getByRole('radio', { name: 'Treo biển "Không làm phiền"' }));
    await user.click(screen.getByRole('button', { name: 'Bỏ việc dọn hôm nay' }));
    await wait(11_000);
    await waitFor(() => expect(calls('transitionHkTask')).toBe(1));
    expect(bodies('transitionHkTask')[0]).toMatchObject({
      action: 'cancel',
      cancelReasonCode: 'dnd',
    });
  });
});

describe('H20 20.3 – inspection with checklist (US-055, BR-808)', () => {
  it('"Kiểm đạt" stays locked until every item and the room photo; then records a pass', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Các căn' }));
    await user.click(await screen.findByRole('link', { name: /^Căn 203, The Sage/ }));
    await user.click(await screen.findByRole('link', { name: 'Kiểm phòng 203 · The Sage' }));
    const pass = await screen.findByRole('button', { name: 'Kiểm đạt – sẵn sàng' });
    expect(pass).toHaveAttribute('aria-disabled', 'true');
    for (const box of screen.getAllByRole('checkbox')) await user.click(box);
    expect(pass).toHaveAttribute('aria-disabled', 'true'); // photo still missing (HK self-inspection)
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
    await user.upload(input, new File([new Uint8Array(5000)], 'room.jpg', { type: 'image/jpeg' }));
    await waitFor(() => expect(pass).not.toHaveAttribute('aria-disabled'));
    await user.click(pass);
    expect(await screen.findByText('Căn 203 · The Sage: Sẵn sàng đón khách')).toBeInTheDocument();
    await wait(11_000);
    await waitFor(() => expect(calls('recordInspection')).toBe(1));
    const body = bodies('recordInspection')[0] as {
      items: { passed: boolean }[];
      photoAttachmentIds: string[];
    };
    expect(body.items.every((i) => i.passed)).toBe(true);
    expect(body.photoAttachmentIds).toHaveLength(1);
  });

  it('"Chưa đạt" needs a note; failed items carry it', async () => {
    const { user } = await start('fdl.hanh'); // front desk lead inspects without photo
    await user.click(await screen.findByRole('link', { name: 'Các căn' }));
    await user.click(await screen.findByRole('link', { name: /^Căn 203, The Sage/ }));
    await user.click(await screen.findByRole('link', { name: 'Kiểm phòng 203 · The Sage' }));
    await user.click(await screen.findByRole('button', { name: 'Chưa đạt' }));
    await user.click(screen.getByRole('button', { name: 'Ghi chưa đạt' }));
    expect(screen.getByLabelText('Chưa đạt ở đâu? Ghi để người dọn sửa')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await user.type(
      screen.getByLabelText('Chưa đạt ở đâu? Ghi để người dọn sửa'),
      'Thiếu thẻ chào',
    );
    await user.click(screen.getByRole('button', { name: 'Ghi chưa đạt' }));
    await wait(11_000);
    await waitFor(() => expect(calls('recordInspection')).toBe(1));
    const body = bodies('recordInspection')[0] as { items: { passed: boolean; note?: string }[] };
    expect(body.items.filter((i) => !i.passed).every((i) => i.note === 'Thiếu thẻ chào')).toBe(
      true,
    );
  });
});

describe('H21 – incident report (US-057)', () => {
  it('online: photo then work order, server code shown; HK only suggests a block', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Báo sự cố' }));
    await user.selectOptions(
      await screen.findByLabelText('Căn'),
      screen.getByRole('option', { name: '101 · The Amber' }),
    );
    await user.click(screen.getByRole('button', { name: 'Mất nước nóng' }));
    expect(screen.getByRole('radio', { name: /^Gấp/ })).toBeChecked();
    await user.type(screen.getByLabelText(/Mô tả/), 'Vòi sen chỉ ra nước lạnh');
    await user.upload(
      document.querySelector<HTMLInputElement>('input[type=file]')!,
      new File([new Uint8Array(9)], 'a.jpg', { type: 'image/jpeg' }),
    );
    await user.click(screen.getByRole('checkbox', { name: /Đề nghị khóa căn/ }));
    await user.click(screen.getByRole('button', { name: 'Gửi báo sự cố' }));
    expect(await screen.findByText(/Đã tạo phiếu WO-\d{5}/)).toBeInTheDocument();
    const wo = bodies('createWorkOrder')[0] as Record<string, unknown>;
    expect(wo).toMatchObject({ severity: 'high', category: 'hot_water', blockRequested: true });
    expect(wo).not.toHaveProperty('block');
    expect((wo.photoAttachmentIds as string[])[0]).toMatch(/^0192/);
  });

  it('offline: kept on the phone (photo + report), honest "chưa gửi", sent in order when online', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Báo sự cố' }));
    setOnline(false);
    await user.selectOptions(
      await screen.findByLabelText('Căn'),
      screen.getByRole('option', { name: '202 · The Valley' }),
    );
    await user.type(screen.getByLabelText(/Mô tả/), 'Khóa cửa kẹt');
    await user.upload(
      document.querySelector<HTMLInputElement>('input[type=file]')!,
      new File([new Uint8Array(9)], 'a.jpg', { type: 'image/jpeg' }),
    );
    await user.click(screen.getByRole('button', { name: 'Gửi báo sự cố' }));
    expect(await screen.findByText('Đã lưu trên máy – chưa gửi')).toBeInTheDocument();
    expect(calls('createWorkOrder')).toBe(0);
    setOnline(true);
    await waitFor(() => expect(calls('createWorkOrder')).toBe(1));
    expect(mockControl.state.calls.indexOf('uploadAttachment')).toBeLessThan(
      mockControl.state.calls.indexOf('createWorkOrder'),
    );
    const wo = bodies('createWorkOrder')[0] as { photoAttachmentIds: string[] };
    expect(wo.photoAttachmentIds[0]).toMatch(/^0192/);
  });

  it('description is required (US-061 AC4)', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Báo sự cố' }));
    await user.selectOptions(
      await screen.findByLabelText('Căn'),
      screen.getByRole('option', { name: '101 · The Amber' }),
    );
    await user.click(screen.getByRole('button', { name: 'Gửi báo sự cố' }));
    expect(screen.getByLabelText(/Mô tả/)).toHaveAttribute('aria-invalid', 'true');
    expect(calls('createWorkOrder')).toBe(0);
  });
});

describe('H22 – maintenance (US-062)', () => {
  it('list: urgent first with the next deadline as a sentence; pick up sends If-Match', async () => {
    const { user } = await start('mt.tung');
    const links = await screen.findAllByRole('link', { name: /^WO-/ });
    expect(links[0]).toHaveAccessibleName(/^WO-00005, Căn 101, The Amber/);
    expect(screen.getByText(/^Nhận việc trước \d{2}:\d{2} – còn \d+ phút$/)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Đang khóa – mở bán lại ' + screen.getByText(/Đang khóa/).textContent!.slice(-5),
      ),
    ).toBeInTheDocument();
    await user.click(links[0]!);
    await user.click(await screen.findByRole('button', { name: 'Nhận việc' }));
    await waitFor(() => expect(calls('transitionWorkOrder')).toBe(1));
    expect(await screen.findByText('Đang sửa')).toBeInTheDocument();
  });

  it('fixed: result + photo required for urgent; a blocked room shows the consequences and reopens', async () => {
    const { user } = await start('mt.tung');
    await user.click(await screen.findByRole('link', { name: /^WO-00001/ }));
    await user.click(await screen.findByRole('button', { name: 'Sửa xong' }));
    expect(screen.getByText(/Căn 401 · The Pine mở khóa và mở bán lại/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xác nhận sửa xong' }));
    expect(calls('transitionWorkOrder')).toBe(0);
    await user.type(screen.getByLabelText(/Đã làm gì/), 'Thay bình nóng lạnh mới');
    await user.upload(
      document.querySelector<HTMLInputElement>('input[type=file]')!,
      new File([new Uint8Array(9)], 'a.jpg', { type: 'image/jpeg' }),
    );
    await user.click(screen.getByRole('button', { name: 'Xác nhận sửa xong' }));
    expect(await screen.findByText(/Đã mở bán lại căn 401 · The Pine/)).toBeInTheDocument();
    expect(bodies('transitionWorkOrder')[0]).toMatchObject({
      action: 'complete',
      resultNote: 'Thay bình nóng lạnh mới',
    });
  });
});

describe('sign out (SR-PWA-04)', () => {
  it('warns when changes are still on the phone, then wipes IndexedDB copy and queue', async () => {
    const { user, store } = await start();
    const r202 = await screen.findByRole('article', { name: 'Căn 202, The Valley' });
    setOnline(false);
    await user.click(within(r202).getByRole('button', { name: 'Bắt đầu dọn' }));
    await user.click(screen.getByRole('link', { name: 'Tôi' }));
    await user.click(await screen.findByRole('button', { name: 'Đăng xuất' }));
    expect(
      await screen.findByText(
        'Còn 1 thao tác chưa gửi. Đăng xuất bây giờ sẽ mất các thao tác này.',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Vẫn đăng xuất' }));
    expect(await screen.findByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(await store.keys('queue')).toEqual([]);
    expect(await store.keys('snapshot')).toEqual([]);
  });

  it('English UI (US-016 / DoD VI + EN)', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Tôi' }));
    await user.click(await screen.findByRole('button', { name: 'English' }));
    expect(await screen.findByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Tasks' }));
    expect(await screen.findByText('Do first')).toBeInTheDocument();
  });
});
