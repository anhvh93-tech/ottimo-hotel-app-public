import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp } from '../test/render';

const idOf = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!.id;
const open = (guest: string, as: string) => renderApp(`/reservations/${idOf(guest)}`, as);

describe('H11 Chi tiết đơn (US-020, 021, 024, 085, 086, 087, 136)', () => {
  it('hold: countdown + only the allowed buttons; partial deposit keeps the hold, full confirms', async () => {
    const { user } = open('Lê Minh', 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Lê Minh' });
    expect(within(d).getByText(/Hết hạn giữ chỗ sau 2[12] giờ \d\d phút/)).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'Hủy giữ chỗ' })).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'Gia hạn giữ chỗ (1 lần)' })).toBeInTheDocument();
    expect(within(d).queryByRole('button', { name: 'Đổi căn / đổi ngày' })).not.toBeInTheDocument();

    await user.click(within(d).getByRole('button', { name: 'Xác nhận đã nhận cọc' }));
    let dlg = await screen.findByRole('dialog', { name: /Xác nhận cọc · OTM-0146/ });
    const amount = within(dlg).getByLabelText(/Số tiền đã nhận/);
    await user.clear(amount);
    await user.type(amount, '100000');
    await user.click(within(dlg).getByRole('button', { name: 'Ghi nhận 100.000' }));
    expect(
      await within(dlg).findByText(/Chưa đủ cọc: cần [\d.]+, đã ghi nhận 100.000/),
    ).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Hủy' }));

    await user.click(within(d).getByRole('button', { name: 'Xác nhận đã nhận cọc' }));
    dlg = await screen.findByRole('dialog', { name: /Xác nhận cọc/ });
    await user.click(within(dlg).getByRole('button', { name: 'Xác nhận đã nhận cọc' }));
    expect(await screen.findByText('OTM-0146 · Đã xác nhận')).toBeInTheDocument();
    await waitFor(() =>
      expect(within(d).queryByRole('button', { name: 'Hủy giữ chỗ' })).not.toBeInTheDocument(),
    );
  });

  it('cancel = irreversible box with the dry-run consequence, reason required, safe button focused (US-135)', async () => {
    const { user } = open('Trần Quốc Bảo', 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Trần Quốc Bảo' });
    await user.click(within(d).getByRole('button', { name: 'Hủy đơn' }));
    const box = await screen.findByRole('alertdialog', {
      name: /Hủy đơn OTM-0159 của Trần Quốc Bảo\?/,
    });
    expect(within(box).getByRole('button', { name: 'Giữ lại đơn' })).toHaveFocus();
    expect(
      await within(box).findByText(/Giữ lại 450.000 \(phí hủy\); hoàn 450.000/),
    ).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: 'Hủy đơn' }));
    expect(within(box).getByText('Bắt buộc')).toBeInTheDocument();
    await user.selectOptions(within(box).getByLabelText(/Lý do hủy/), 'found_other');
    await user.click(within(box).getByRole('button', { name: 'Hủy đơn' }));
    expect(await screen.findByText('OTM-0159 · Đã hủy')).toBeInTheDocument();
    expect(mockControl.rsv.reservations.find((r) => r.code === 'OTM-0159')!.status).toBe(
      'cancelled',
    );
  });

  it('412 VERSION_CONFLICT on move keeps the input and reloads the version', async () => {
    const { user } = open('Nguyễn Văn An', 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Nguyễn Văn An' });
    await user.click(within(d).getByRole('button', { name: 'Đổi căn / đổi ngày' }));
    const dlg = await screen.findByRole('dialog', { name: /Đổi căn \/ đổi ngày · OTM-0149/ });
    mockControl.rsv.reservations.find((r) => r.code === 'OTM-0149')!.version = 5; // someone else saved
    fireEvent.change(within(dlg).getByLabelText('Ngày đi'), {
      target: { value: addDays(todayLocal(), 7) },
    });
    await user.type(within(dlg).getByLabelText(/Lý do đổi/), 'Khách xin căn tầng thấp');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu thay đổi' }));
    expect(
      await within(dlg).findByText(/Dữ liệu vừa được người khác thay đổi/),
    ).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Thử lại' }));
    expect(within(dlg).getByLabelText(/Lý do đổi/)).toHaveValue('Khách xin căn tầng thấp');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await screen.findByText('Đã lưu')).toBeInTheDocument();
    expect(mockControl.rsv.reservations.find((r) => r.code === 'OTM-0149')!.departureDate).toBe(
      addDays(todayLocal(), 7),
    );
  });

  it('move into an occupied room → 409 with the occupying booking and a free room to use', async () => {
    const { user } = open('Tanaka Yui', 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Tanaka Yui' });
    await user.click(within(d).getByRole('button', { name: 'Đổi căn / đổi ngày' }));
    const dlg = await screen.findByRole('dialog', { name: /Đổi căn/ });
    expect(
      within(dlg).getByText('Đơn OTA: chỉ đổi căn nội bộ, ngày theo kênh.'),
    ).toBeInTheDocument();
    await user.selectOptions(
      within(dlg).getByLabelText(/^Căn/),
      within(dlg).getByRole('option', { name: /^302 / }),
    );
    await user.type(within(dlg).getByLabelText(/Lý do đổi/), 'Khách yêu cầu');
    await user.click(within(dlg).getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await within(dlg).findByText(/Căn 302 đã có đơn của Olga Ivanova/)).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Dùng căn 402' }));
    expect(await screen.findByText('Đã lưu')).toBeInTheDocument();
    expect(
      mockControl.rsv.reservations.find((r) => r.guestName === 'Tanaka Yui')!.segments![0]!.roomNo,
    ).toBe('402');
  });

  it('no-show: locked until the mark time + contact result; restore same day (US-136)', async () => {
    mockControl.db.params.push({
      key: 'no_show_mark_time',
      value: '00:00',
      effectiveFrom: '2026-10-01',
      brRef: 'BR-311',
      editableBy: ['owner', 'manager'],
    });
    const { user } = open('Gia đình anh Hưng', 'qa.fdl');
    const d = await screen.findByRole('dialog', { name: 'Gia đình anh Hưng' });
    expect(within(d).getByText('Vượt định mức 1 · chuẩn bị bộ đồ dùng thêm')).toBeInTheDocument();
    await user.click(within(d).getByRole('button', { name: 'Đánh dấu không đến' }));
    const box = await screen.findByRole('alertdialog', {
      name: /Đánh dấu Gia đình anh Hưng không đến\?/,
    });
    expect(
      within(box).getByText(/Mở được từ 00:00 và sau khi ghi kết quả liên lạc/),
    ).toBeInTheDocument();
    await user.selectOptions(
      within(box).getByLabelText(/Kết quả liên lạc/),
      'rsv.contact_noanswer',
    );
    await user.click(within(box).getByRole('button', { name: 'Đánh dấu không đến' }));
    expect(await screen.findByText('OTM-0155 · Không đến')).toBeInTheDocument();
    await user.click(await within(d).findByRole('button', { name: 'Khôi phục đơn không đến' }));
    const r = await screen.findByRole('alertdialog', { name: /Khôi phục đơn OTM-0155\?/ });
    await user.type(within(r).getByLabelText(/Lý do/), 'Khách đến lúc 23:40');
    await user.click(within(r).getByRole('button', { name: 'Khôi phục đơn không đến' }));
    expect(await screen.findByText('OTM-0155 · Đã xác nhận')).toBeInTheDocument();
  });

  it('INVALID_TRANSITION: the booking changed meanwhile → message names the new status', async () => {
    const { user } = open('Lê Minh', 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Lê Minh' });
    await user.click(within(d).getByRole('button', { name: 'Gia hạn giữ chỗ (1 lần)' }));
    const dlg = await screen.findByRole('dialog', { name: 'Gia hạn giữ chỗ (1 lần)' });
    const res = mockControl.rsv.reservations.find((x) => x.code === 'OTM-0146')!;
    res.status = 'confirmed'; // deposit confirmed by a colleague; version unchanged
    await user.click(within(dlg).getByRole('button', { name: /^Gia hạn đến/ }));
    expect(
      await within(dlg).findByText(
        'Đơn vừa chuyển sang "Đã xác nhận" nên thao tác này không còn dùng được. Tải lại để xem các nút hiện có.',
      ),
    ).toBeInTheDocument();
  });

  it('CTV: own hold shows totals + "Báo đã chuyển cọc", another booking is 404 (US-087)', async () => {
    const { user } = open('Lê Minh', 'qa.ctv1');
    const d = await screen.findByRole('dialog', { name: 'Lê Minh' });
    expect(
      within(d).queryByRole('button', { name: 'Xác nhận đã nhận cọc' }),
    ).not.toBeInTheDocument();
    expect(within(d).queryByText('Còn phải thu')).not.toBeInTheDocument();
    expect(within(d).getByText('Cọc cần thu')).toBeInTheDocument();
    await user.click(within(d).getByRole('button', { name: 'Báo đã chuyển cọc' }));
    const dlg = await screen.findByRole('dialog', { name: 'Báo đã chuyển cọc' });
    await user.click(within(dlg).getByRole('button', { name: 'Báo đã chuyển cọc' }));
    expect(
      await screen.findByText(/Đã báo chuyển cọc lúc \d\d:\d\d – chờ xác nhận/),
    ).toBeInTheDocument();
    expect(mockControl.rsv.notices).toHaveLength(1);
  });

  it('CTV opening someone else\'s booking by URL gets "không tìm thấy" (no existence leak)', async () => {
    open('Sophie Martin', 'qa.ctv1');
    expect(
      await screen.findByText(
        'Không tìm thấy mục này hoặc bạn không có quyền xem. Tải lại danh sách.',
      ),
    ).toBeInTheDocument();
  });

  it('list: filter "HĐ ngoài hệ thống" shows only manual long stays (H10 10.2)', async () => {
    const { user } = renderApp('/reservations', 'qa.fd');
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Lọc: HĐ ngoài hệ thống' }));
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3));
    expect(screen.getByText('Emma Laurent')).toBeInTheDocument();
    expect(screen.getByText('Daniel Weber')).toBeInTheDocument();
  });
});
