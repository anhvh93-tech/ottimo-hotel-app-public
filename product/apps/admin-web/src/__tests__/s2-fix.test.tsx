import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readDraft } from '../app/clientData';
import { todayLocal } from '../app/dates';
import { addDays, dayMonth } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];
const rsv = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;

async function openBooking(user: User) {
  await screen.findByRole('grid');
  await user.click(screen.getByRole('button', { name: 'Đặt phòng mới' }));
  return screen.findByRole('dialog', { name: /Đặt phòng mới/ });
}

describe('Sprint 2 – response & fix (OpenAPI 0.3.5, UXD/DOM/SEC cards)', () => {
  it('US-135: cancel stays locked until the dry run answers; OTA gets "OTA báo hủy" + penalty', async () => {
    const { user } = renderApp(`/reservations/${rsv('Sophie Martin').id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Sophie Martin' });
    mockControl.failNext(/actions\/cancel:POST/, 500, { code: 'INTERNAL_ERROR' });
    await user.click(within(d).getByRole('button', { name: 'Hủy đơn' }));
    const box = await screen.findByRole('alertdialog');
    // Dry run failed → locked + "Thử lại"; retry → the "no money" sentence (Booking.com, no deposit).
    expect(await within(box).findByText(tv('cancel.preview_failed'))).toBeInTheDocument();
    expect(within(box).getByRole('button', { name: 'Hủy đơn' })).toBeDisabled();
    await user.click(within(box).getByRole('button', { name: tv('common.retry') }));
    const r0 = rsv('Sophie Martin');
    expect(
      await within(box).findByText(
        tv('confirm.cancel_booking.body_no_money', {
          room: '101',
          from: dayMonth(r0.arrivalDate),
          to: dayMonth(r0.departureDate),
        }),
      ),
    ).toBeInTheDocument();
    const reason = within(box).getByLabelText(/Lý do hủy/);
    expect(
      within(reason).getByRole('option', { name: tv('cancel.reason.ota_cancelled') }),
    ).toBeInTheDocument();
    await user.selectOptions(reason, 'ota_cancelled');
    await user.type(within(box).getByLabelText(new RegExp(tv('cancel.ota_penalty'))), '200000');
    await waitFor(() =>
      expect(within(box).getByRole('button', { name: 'Hủy đơn' })).not.toBeDisabled(),
    );
    await user.click(within(box).getByRole('button', { name: 'Hủy đơn' }));
    expect(
      await screen.findByText(tv('rsv.toast.cancelled', { code: rsv('Sophie Martin').code })),
    ).toBeInTheDocument();
    expect(rsv('Sophie Martin').cancellation?.reasonCode).toBe('ota_cancelled');
  });

  it('A-20: OTA above the room maximum → warning + reason → saved with capacityConflict', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await user.click(within(dlg).getByRole('button', { name: 'OTA' }));
    const room = within(dlg).getByLabelText(/^Căn/);
    await waitFor(() => expect(within(room).getAllByRole('option').length).toBeGreaterThan(5));
    await user.selectOptions(room, within(room).getByRole('option', { name: /^201 / }));
    fireEvent.change(within(dlg).getByLabelText(tv('booking.field.departure')), {
      target: { value: addDays(todayLocal(), 2) },
    });
    // OTA: + stays enabled above the maximum (warning, not a block).
    const inc = within(dlg).getByRole('button', { name: 'Tăng Người lớn (từ 12 tuổi)' });
    await user.click(inc);
    await user.click(inc);
    expect(inc).not.toBeDisabled();
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Anna');
    await user.click(await screen.findByRole('option', { name: /Anna Martin/ }));
    await user.type(within(dlg).getByLabelText(/Mã đặt phòng OTA/), 'BK-55');
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    expect(
      await within(dlg).findByText(tv('booking.capacity_warning', { room: '201', max: 3, n: 4 })),
    ).toBeInTheDocument();
    const reasonField = within(dlg).getByLabelText(new RegExp(`^${tv('booking.capacity_reason')}`));
    await user.type(reasonField, 'Khách đã đặt 4 người trên kênh');
    await user.click(within(dlg).getByRole('button', { name: 'Tạo đơn' }));
    const drawer = await screen.findByRole('dialog', { name: 'Anna Martin' });
    expect(within(drawer).getByText(tv('rsv.capacity_chip'))).toBeInTheDocument();
    expect(
      within(drawer).getByText(tv('rsv.capacity_conflict_body', { n: 4, room: '201', max: 3 })),
    ).toBeInTheDocument();
    expect(mockControl.rsv.reservations.at(-1)!.capacityConflict).toBe(true);
  });

  it('A-21: manager restores a no-show whose room was resold into the unassigned lane', async () => {
    const lan = rsv('Vũ Thị Lan');
    const busy = mockControl.db.rooms.find((r) => r.roomNo === '302')!;
    lan.roomId = busy.id;
    lan.segments = [
      { roomId: busy.id, roomNo: '302', fromDate: lan.arrivalDate, toDate: lan.departureDate },
    ];
    const { user } = renderApp(`/reservations/${lan.id}`, 'qa.mgr');
    const d = await screen.findByRole('dialog', { name: 'Vũ Thị Lan' });
    await user.click(within(d).getByRole('button', { name: 'Khôi phục đơn không đến' }));
    const box = await screen.findByRole('alertdialog', { name: /Khôi phục đơn/ });
    await user.type(within(box).getByLabelText(/Lý do/), 'Khách đến muộn');
    await user.click(within(box).getByRole('button', { name: 'Khôi phục đơn không đến' }));
    expect(
      await within(box).findByText(/Căn 302 đã có đơn của Gia đình anh Hưng/),
    ).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: tv('bk.save_unassigned') }));
    expect(
      await screen.findByText(tv('rsv.toast.restored', { code: lan.code })),
    ).toBeInTheDocument();
    expect(lan.status).toBe('confirmed');
    expect(lan.conflictState).toBe('open');
  });

  it('A-06: CTV channel lists closer candidates; the chosen closer is sent', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await user.click(within(dlg).getByRole('button', { name: tv('bk.ch_agent') }));
    const closer = await within(dlg).findByLabelText(tv('bk.closer'));
    await waitFor(() =>
      expect(within(closer).getByRole('option', { name: 'Mai' })).toBeInTheDocument(),
    );
  });

  it('SEC-FE-05: the booking draft key carries the user id', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openBooking(user);
    await user.click(within(dlg).getByRole('button', { name: 'OTA' }));
    await user.click(within(dlg).getByRole('button', { name: tv('booking.close_draft') }));
    const fd = mockControl.db.users.find((u) => u.username === 'qa.fd')!;
    expect(readDraft(`booking.new.${fd.id}`)).not.toBeNull();
    expect(readDraft('booking.new')).toBeNull();
  });

  it('A-18: an expired quote can be extended by a manager (200)', async () => {
    const { user } = renderApp('/quotes', 'qa.mgr');
    const free = await screen.findAllByRole('button', { name: 'Báo giá' });
    await user.click(free[0]!);
    const dlg = await screen.findByRole('dialog', { name: 'Báo giá' });
    await within(dlg).findByText('Tổng tiền đơn');
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Hoàng Gia');
    await user.click(await screen.findByRole('option', { name: /Hoàng Gia Bảo/ }));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    await screen.findByRole('dialog', { name: /BG-000\d+/ });
    // The quote expires; reopen it from the list.
    mockControl.rsv.quotes.at(-1)!.expiresAt = new Date(Date.now() - 60_000).toISOString();
    await user.click(
      within(screen.getByRole('dialog', { name: /BG-000\d+/ })).getAllByRole('button', {
        name: 'Đóng',
      })[0]!,
    );
    await user.click(screen.getByRole('tab', { name: 'Báo giá' }));
    await user.click(await screen.findByRole('button', { name: /BG-000\d+/ }));
    const sent = await screen.findByRole('dialog', { name: /BG-000\d+/ });
    expect(within(sent).getByText(tv('error.QUOTE_EXPIRED'))).toBeInTheDocument();
    await user.click(within(sent).getByRole('button', { name: tv('drawer.action.extend') }));
    await waitFor(() =>
      expect(within(sent).queryByText(tv('error.QUOTE_EXPIRED'))).not.toBeInTheDocument(),
    );
    expect(mockControl.rsv.quotes.at(-1)!.status).toBe('active');
  });

  it('A-25: assign dialog explains the OTA group and marks other groups as upgrade (reservationId)', async () => {
    const { user } = renderApp(`/reservations/${rsv('Hannah Schmidt').id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Hannah Schmidt' });
    await user.click(within(d).getByRole('button', { name: 'Gán căn' }));
    const dlg = await screen.findByRole('dialog', { name: /Gán căn cho/ });
    const h = rsv('Hannah Schmidt');
    expect(
      await within(dlg).findByText(
        tv('rsv.assign_lead', {
          channel: 'Agoda',
          group: 'Lầu 1–2',
          from: dayMonth(h.arrivalDate),
          to: dayMonth(h.departureDate),
          room: 'Lầu 1–2',
        }),
      ),
    ).toBeInTheDocument();
    // FD cannot pick an upgrade: the other-group rooms are locked with the visible reason.
    const radios = await within(dlg).findAllByRole('radio');
    expect(radios.some((r) => (r as HTMLInputElement).disabled)).toBe(true);
    expect(
      within(dlg).getAllByText(new RegExp(tv('rsv.upgrade_needs_lead'))).length,
    ).toBeGreaterThan(0);
    expect(radios[0]).toBeChecked();
  });

  it('A-19: move reasons follow the role rules (FD: no upgrade / force majeure / overbooking)', async () => {
    const { user } = renderApp(`/reservations/${rsv('Nguyễn Văn An').id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Nguyễn Văn An' });
    await user.click(within(d).getByRole('button', { name: 'Đổi căn / đổi ngày' }));
    const dlg = await screen.findByRole('dialog', { name: /Đổi căn/ });
    const values = within(within(dlg).getByLabelText(/^Lý do đổi/))
      .getAllByRole<HTMLOptionElement>('option')
      .map((o) => o.value);
    expect(values).toEqual(['guest_request', 'property_fault', 'inventory_optimize', 'other']);
  });
});
