import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];

async function quoteFor(user: User, room: string) {
  const item = await waitFor(() => {
    const li = screen
      .getAllByRole('listitem')
      .find((x) => x.querySelector('.roomno')?.textContent === room);
    if (!li) throw new Error(`room ${room} not listed`);
    return li;
  });
  await user.click(within(item).getByRole('button', { name: 'Báo giá' }));
  return screen.findByRole('dialog', { name: 'Báo giá' });
}

async function pickGuest(user: User, dlg: HTMLElement, q: string, name: RegExp) {
  await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), q);
  await user.click(await screen.findByRole('option', { name }));
}

describe('H12 Báo giá & giữ chỗ (US-080, 082–087)', () => {
  it('sale: free rooms → quote with own commission → text to send → hold (VietQR content = code)', async () => {
    const { user } = renderApp('/quotes', 'qa.sal');
    expect(await screen.findByText(/căn trống/)).toBeInTheDocument();
    const dlg = await quoteFor(user, '203');
    // US-080 AC1/AC2: total, deposit, commission of the closer, "OTTIMO còn lại" for internal sale.
    expect(await within(dlg).findByText('Tổng tiền đơn')).toBeInTheDocument();
    expect(within(dlg).getByText(/Sale nhận \(3% tiền phòng – BR-903\)/)).toBeInTheDocument();
    expect(within(dlg).getByText('OTTIMO còn lại')).toBeInTheDocument();
    // Extra guest → fee line + kit reminder (BR-110, BR-812).
    await user.click(within(dlg).getByRole('button', { name: 'Tăng Người lớn' }));
    expect(
      await within(dlg).findByText(/Phụ thu 1 người vượt định mức × 2 đêm/),
    ).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    expect(await within(dlg).findByText('Bắt buộc')).toBeInTheDocument();
    await pickGuest(user, dlg, 'Hoàng Gia', /Hoàng Gia Bảo/);
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    const send = await screen.findByRole('dialog', { name: /BG-000\d+/ });
    const text = await within(send).findByText(/OTTIMO Boutique Stay – Báo giá BG-000/);
    // US-083 AC2: the guest text never carries commission or "OTTIMO còn lại".
    expect(text.textContent).not.toMatch(/hoa hồng|Sale nhận|OTTIMO còn lại/i);
    await user.click(within(send).getByRole('button', { name: 'English' }));
    expect(
      await within(send).findByText(/OTTIMO Boutique Stay – Quote BG-000/),
    ).toBeInTheDocument();
    await user.click(within(send).getByRole('button', { name: 'Sao chép gửi Zalo' }));
    expect(await screen.findByText('Đã chép')).toBeInTheDocument();
    await user.click(within(send).getByRole('button', { name: 'Khách đồng ý – Giữ chỗ' }));
    const hold = await screen.findByRole('dialog', { name: 'Giữ chỗ' });
    await user.click(within(hold).getByRole('button', { name: 'Tạo giữ chỗ' }));
    expect(await within(hold).findByText(/Đã giữ căn 203 – đơn OTM-0\d+/)).toBeInTheDocument();
    const created = mockControl.rsv.reservations.at(-1)!;
    expect(created.status).toBe('hold');
    expect(
      within(hold).getByText(`Nội dung chuyển khoản: ${created.code.replace('-', '')}`),
    ).toBeInTheDocument();
    // Own projected commission on the booking (US-087 AC2).
    await user.click(within(hold).getByRole('button', { name: 'Mở đơn' }));
    const d = await screen.findByRole('dialog', { name: 'Hoàng Gia Bảo' });
    expect(await within(d).findByText(/Dự kiến/)).toBeInTheDocument();
  });

  it('collaborator: "Bạn nhận (8%)" and never "OTTIMO còn lại" (US-080 AC2)', async () => {
    const { user } = renderApp('/quotes', 'qa.ctv1');
    const dlg = await quoteFor(user, '203');
    expect(await within(dlg).findByText(/Bạn nhận \(8% tiền phòng – BR-903\)/)).toBeInTheDocument();
    expect(within(dlg).queryByText('OTTIMO còn lại')).not.toBeInTheDocument();
    expect(within(dlg).queryByLabelText(/Mã khách quay lại/)).not.toBeInTheDocument();
  });

  it('arrival today: hold not allowed – hand over to the front desk (US-084 AC2)', async () => {
    const { user } = renderApp('/quotes', 'qa.sal');
    await screen.findByText(/căn trống/);
    fireEvent.change(screen.getByLabelText('Ngày đến'), { target: { value: todayLocal() } });
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
    await waitFor(() =>
      expect(screen.getByText(/căn trống/).textContent).toMatch(
        new RegExp(todayLocal().slice(8, 10)),
      ),
    );
    const dlg = await quoteFor(user, '201');
    await within(dlg).findByText('Tổng tiền đơn');
    await pickGuest(user, dlg, 'Hoàng Gia', /Hoàng Gia Bảo/);
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    const send = await screen.findByRole('dialog', { name: /BG-000\d+/ });
    await user.click(within(send).getByRole('button', { name: 'Khách đồng ý – Giữ chỗ' }));
    const hold = await screen.findByRole('dialog', { name: 'Giữ chỗ' });
    expect(
      within(hold).getByText('Khách đến hôm nay thì không giữ chỗ được. Thu tiền và tạo đơn ngay.'),
    ).toBeInTheDocument();
    expect(within(hold).getByRole('button', { name: 'Tạo giữ chỗ' })).toBeDisabled();
  });

  it('availability grid for sale: other bookings are "Đã kín", no guest names (US-016 AC4)', async () => {
    renderApp('/quotes', 'qa.sal');
    const g = await screen.findByRole('grid', { name: 'Căn trống' });
    const labels = within(g)
      .getAllByRole('gridcell')
      .map((c) => c.getAttribute('aria-label') ?? '');
    expect(labels.some((l) => l.includes('Đã kín'))).toBe(true);
    expect(labels.some((l) => /Trần Thu Nga|Sophie Martin/.test(l))).toBe(false);
    expect(within(g).queryByRole('rowheader', { name: /Chưa gán căn/ })).not.toBeInTheDocument();
  });

  it("quote list shows only the caller's own quotes", async () => {
    mockControl.rsv.quotes.push({
      id: 'q-other',
      code: 'BG-00001',
      status: 'active',
      type: 'short',
      roomId: mockControl.db.rooms[0]!.id,
      arrivalDate: addDays(todayLocal(), 3),
      nights: 2,
      totalVnd: 1_000_000,
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      version: 1,
      createdBy: 'someone-else',
      input: { type: 'short', arrivalDate: addDays(todayLocal(), 3), adults: 2, channelId: 'x' },
    });
    const { user } = renderApp('/quotes', 'qa.ctv1');
    await user.click(await screen.findByRole('tab', { name: 'Báo giá' }));
    // Only someone else's quote exists → the CTV sees the empty state (FB-R2-UXD-FE-S2-07).
    expect(await screen.findByText(tv('sale.quotes_empty_title'))).toBeInTheDocument();
    expect(screen.queryByText('BG-00001')).not.toBeInTheDocument();
  });
});
