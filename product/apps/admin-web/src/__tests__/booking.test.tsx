import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];

async function openForm(user: User) {
  await screen.findByRole('grid');
  await user.click(screen.getByRole('button', { name: 'Đặt phòng mới' }));
  return screen.findByRole('dialog', { name: /Đặt phòng mới/ });
}

async function fill(
  user: User,
  dlg: HTMLElement,
  opts: { room: RegExp; from: number; to: number; guest: string; pick: RegExp },
) {
  const room = within(dlg).getByLabelText(/^Căn/);
  await waitFor(() => expect(within(room).getAllByRole('option').length).toBeGreaterThan(5));
  const option = within(room)
    .getAllByRole<HTMLOptionElement>('option')
    .find((o) => opts.room.test(o.textContent ?? ''))!;
  await user.selectOptions(room, option);
  fireEvent.change(within(dlg).getByLabelText('Ngày đến'), {
    target: { value: addDays(todayLocal(), opts.from) },
  });
  fireEvent.change(within(dlg).getByLabelText('Ngày đi'), {
    target: { value: addDays(todayLocal(), opts.to) },
  });
  await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), opts.guest);
  await user.click(await screen.findByRole('option', { name: opts.pick }));
}

describe('H09 Đặt phòng mới (US-017, US-018, US-019, US-139)', () => {
  it('direct booking: server price + deposit shown before saving, created → drawer + rack', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForm(user);
    await fill(user, dlg, {
      room: /^201 /,
      from: 0,
      to: 2,
      guest: 'Trần Minh',
      pick: /Trần Minh Khoa/,
    });
    // AC3/AC7: nightly prices from calculateQuote, deposit 30 % (BR-305) prefilled.
    expect(await within(dlg).findAllByLabelText(/^Giá \d\d\/\d\d/)).not.toHaveLength(0);
    await waitFor(() => expect(within(dlg).getByText('Tổng tiền đơn')).toBeInTheDocument());
    expect(within(dlg).getByLabelText(/Số tiền đã nhận/)).not.toHaveValue('');
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    const drawer = await screen.findByRole('dialog', { name: 'Trần Minh Khoa' });
    expect(within(drawer).getByText('Đã xác nhận')).toBeInTheDocument();
    const created = mockControl.rsv.reservations.at(-1)!;
    expect(created.directSource).toBe('zalo_phone');
    expect(created.depositPaidVnd).toBeGreaterThan(0);
  });

  it('capacity: blocked at the guest field; above standard → extra-guest kit reminder (ESC-014)', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForm(user);
    const room = within(dlg).getByLabelText(/^Căn/);
    await waitFor(() => expect(within(room).getAllByRole('option').length).toBeGreaterThan(5));
    await user.selectOptions(room, within(room).getByRole('option', { name: /^202 / }));
    const inc = within(dlg).getByRole('button', { name: 'Tăng Người lớn (từ 12 tuổi)' });
    await user.click(inc);
    expect(within(dlg).getByText(/Vượt định mức 1 người – khách ngủ sofa/)).toBeInTheDocument();
    expect(inc).toBeDisabled(); // 202: base 2, max 3
    // Children under 6 are not counted.
    await user.click(within(dlg).getByRole('button', { name: 'Tăng Trẻ dưới 6 tuổi' }));
    expect(within(dlg).queryByText(/ở tối đa 3 khách/)).not.toBeInTheDocument();
  });

  it('409 ROOM_UNAVAILABLE keeps the input and offers free rooms (US-018 AC1)', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForm(user);
    await fill(user, dlg, {
      room: /^101 /,
      from: 0,
      to: 2,
      guest: 'Trần Minh',
      pick: /Trần Minh Khoa/,
    });
    await waitFor(() => expect(within(dlg).getByText('Tổng tiền đơn')).toBeInTheDocument());
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    const alert = await within(dlg).findByText(/Căn 101 đã có đơn của Trần Thu Nga/);
    expect(alert).toBeInTheDocument();
    const use = within(dlg).getByRole('button', { name: /^Dùng căn 201/ });
    expect(within(dlg).getByLabelText(/^Căn/)).toHaveDisplayValue(/^101 /);
    await user.click(use);
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    expect(mockControl.rsv.reservations.at(-1)!.segments![0]!.roomNo).toBe('201');
  });

  it('OTA booking into a full room → "Lưu chưa gán căn" → conflict lane (US-139)', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForm(user);
    await user.click(within(dlg).getByRole('button', { name: 'OTA' }));
    await fill(user, dlg, { room: /^101 /, from: 0, to: 2, guest: 'Anna', pick: /Anna Martin/ });
    await user.type(within(dlg).getByLabelText(/Mã đặt phòng OTA/), 'AG-778899');
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await within(dlg).findByText(/Căn 101 đã kín/)).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Lưu chưa gán căn' }));
    const confirm = await screen.findByRole('alertdialog');
    expect(within(confirm).getByRole('button', { name: 'Quay lại' })).toHaveFocus();
    await user.click(within(confirm).getByRole('button', { name: 'Lưu chưa gán căn' }));
    const drawer = await screen.findByRole('dialog', { name: 'Anna Martin' });
    expect(within(drawer).getByText('Xung đột OTA')).toBeInTheDocument();
    expect(mockControl.rsv.reservations.at(-1)!.conflictState).toBe('open');
  });

  it('≥ 28 nights → long-stay manual booking (US-017 AC5a) with rent, no prices', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForm(user);
    fireEvent.change(within(dlg).getByLabelText('Ngày đến'), {
      target: { value: addDays(todayLocal(), 30) },
    });
    fireEvent.change(within(dlg).getByLabelText('Ngày đi'), {
      target: { value: addDays(todayLocal(), 70) },
    });
    expect(await within(dlg).findByText('40 đêm là thuê dài hạn')).toBeInTheDocument();
    expect(within(dlg).getByRole('button', { name: 'Tạo đơn' })).toBeDisabled();
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn dài hạn nhập tay' }));
    const ls = await screen.findByRole('dialog', { name: /Đơn dài hạn nhập tay/ });
    expect(within(ls).getByText('HĐ ngoài hệ thống – chuyển vào app ở R3')).toBeInTheDocument();
    await user.type(within(ls).getByRole('combobox', { name: 'Khách đứng tên' }), 'Hoàng Gia');
    await user.click(await screen.findByRole('option', { name: /Hoàng Gia Bảo/ }));
    await user.click(within(ls).getByRole('button', { name: 'Tạo đơn dài hạn' }));
    expect(await within(ls).findByText('Nhập số tiền lớn hơn 0.')).toBeInTheDocument();
    await user.type(within(ls).getByLabelText(/Tiền thuê mỗi tháng/), '9800000');
    await user.click(within(ls).getByRole('button', { name: 'Tạo đơn dài hạn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    const r = mockControl.rsv.reservations.at(-1)!;
    expect(r.externalContract).toBe(true);
    expect(r.manualLongStay?.monthlyRentVnd).toBe(9_800_000);
    expect(r.nightlyRates).toBeUndefined();
  });

  it('direct channel needs the guest phone (AC2): field appears when the profile has none', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForm(user);
    await fill(user, dlg, {
      room: /^201 /,
      from: 0,
      to: 2,
      guest: 'Phan Thị',
      pick: /Phan Thị Mơ/,
    });
    await waitFor(() => expect(within(dlg).getByText('Tổng tiền đơn')).toBeInTheDocument());
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(
      await within(dlg).findByText('Kênh Trực tiếp và CTV cần số điện thoại của khách.'),
    ).toBeInTheDocument();
    await user.type(within(dlg).getByLabelText(/^Số điện thoại \/ Zalo/), '0912 345 678');
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    expect(mockControl.db.guests.find((g) => g.fullName === 'Phan Thị Mơ')!.phone).toBe(
      '+84912345678',
    );
  });

  it('sale / CTV cannot open the booking form (US-017 AC6) – no rack, no button', async () => {
    renderApp('/rack', 'qa.sal');
    expect(await screen.findByText('Bạn không có quyền mở trang này')).toBeInTheDocument();
  });
});
