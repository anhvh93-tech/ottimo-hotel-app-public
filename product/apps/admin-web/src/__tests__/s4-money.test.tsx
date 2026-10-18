// Sprint 4 – FE-A (Desk, money): S4-28 deposit VietQR (H12/H11), S4-21 move price check (ESC-019 A),
// S4-10 collect at check-in (BUG-R2-038), S4-08 service lines kept on cancel / no-show.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isApiError, newIdempotencyKey } from '@ottimo/api-client';
import { api } from '../app/api';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { MOCK_PASSWORD, PROPERTY_ID } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];

const rsvOf = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const openRsv = (guest: string, as: string) => renderApp(`/reservations/${rsvOf(guest).id}`, as);
const qrPayments = (folioId: string) =>
  mockControl.stay.payments.filter((p) => p.folioId === folioId && p.method === 'vietqr');

/** H12: quote room 203 for a guest, save, then open the hold step and create the hold. */
async function holdFromQuote(user: User, guestQuery: string, guestName: RegExp) {
  const item = await waitFor(() => {
    const li = screen
      .getAllByRole('listitem')
      .find((x) => x.querySelector('.roomno')?.textContent === '203');
    if (!li) throw new Error('room 203 not listed');
    return li;
  });
  await user.click(within(item).getByRole('button', { name: 'Báo giá' }));
  const dlg = await screen.findByRole('dialog', { name: 'Báo giá' });
  await within(dlg).findByText('Tổng tiền đơn');
  await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), guestQuery);
  await user.click(await screen.findByRole('option', { name: guestName }));
  await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
  const send = await screen.findByRole('dialog', { name: /BG-000\d+/ });
  await user.click(within(send).getByRole('button', { name: 'Khách đồng ý – Giữ chỗ' }));
  const hold = await screen.findByRole('dialog', { name: 'Giữ chỗ' });
  await user.click(within(hold).getByRole('button', { name: 'Tạo giữ chỗ' }));
  await within(hold).findByText(/Đã giữ căn 203 – đơn OTM-0\d+/);
  return { hold, created: mockControl.rsv.reservations.at(-1)! };
}

describe('S4-28 VietQR cọc H12/H11 (US-084 AC4, US-120; BUG-R2-062)', () => {
  it('H12 sale: the QR for the BR-305 deposit is created right after the hold, content = booking code', async () => {
    const { user } = renderApp('/quotes', 'qa.sal');
    await screen.findByText(/căn trống/);
    const { hold, created } = await holdFromQuote(user, 'Hoàng Gia', /Hoàng Gia Bảo/);
    const ref = created.code.replace('-', '');
    const img = await within(hold).findByRole('img', { name: new RegExp(`nội dung ${ref}$`) });
    expect(img).toBeInTheDocument();
    // Exactly one pending deposit QR, amount = deposit required (no client-typed amount – SEC F1).
    const qr = qrPayments(created.folioId);
    expect(qr).toHaveLength(1);
    expect(qr[0]).toMatchObject({
      type: 'deposit',
      status: 'pending',
      amountVnd: created.depositRequiredVnd,
    });
    expect(within(hold).getByRole('button', { name: tv('pay.copy_ref') })).toBeInTheDocument();
    expect(within(hold).getByText(tv('sale.hold_next', { hours: 2 }))).toBeInTheDocument();
  });

  it('H12 collaborator: no createVietQr (not in x-roles) – the copy says to ask the desk', async () => {
    const { user } = renderApp('/quotes', 'qa.ctv1');
    await screen.findByText(/căn trống/);
    const dlg = await (async () => {
      const item = await waitFor(() => {
        const li = screen
          .getAllByRole('listitem')
          .find((x) => x.querySelector('.roomno')?.textContent === '203');
        if (!li) throw new Error('room 203 not listed');
        return li;
      });
      await user.click(within(item).getByRole('button', { name: 'Báo giá' }));
      return screen.findByRole('dialog', { name: 'Báo giá' });
    })();
    await within(dlg).findByText('Tổng tiền đơn');
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Lý Minh');
    await user.click(await screen.findByRole('option', { name: /Lý Minh Châu/ }));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    const send = await screen.findByRole('dialog', { name: /BG-000\d+/ });
    await user.click(within(send).getByRole('button', { name: 'Khách đồng ý – Giữ chỗ' }));
    const hold = await screen.findByRole('dialog', { name: 'Giữ chỗ' });
    // BUG-R2-062: before the hold the CTV is not promised a QR they cannot create.
    expect(within(hold).getByText(tv('sale.qr_after_ctv'))).toBeInTheDocument();
    expect(within(hold).queryByText(tv('sale.qr_after'))).not.toBeInTheDocument();
    await user.click(within(hold).getByRole('button', { name: 'Tạo giữ chỗ' }));
    await within(hold).findByText(/Đã giữ căn 203 – đơn OTM-0\d+/);
    const created = mockControl.rsv.reservations.at(-1)!;
    expect(within(hold).getByText(tv('sale.qr_after_ctv'))).toBeInTheDocument();
    expect(within(hold).queryByRole('img', { name: /Mã VietQR/ })).not.toBeInTheDocument();
    expect(qrPayments(created.folioId)).toHaveLength(0);
  });

  it('H12: no receiving account → the hold stands, the QR says why (US-120 AC2, no fake QR)', async () => {
    mockControl.stay.paymentNotConfigured = true;
    const { user } = renderApp('/quotes', 'qa.sal');
    await screen.findByText(/căn trống/);
    const { hold, created } = await holdFromQuote(user, 'Hoàng Gia', /Hoàng Gia Bảo/);
    expect(await within(hold).findByText(tv('error.PAYMENT_NOT_CONFIGURED'))).toBeInTheDocument();
    expect(within(hold).queryByRole('img', { name: /Mã VietQR/ })).not.toBeInTheDocument();
    expect(created.status).toBe('hold');
  });

  it('H11: the QR sent at H12 is confirmed received, then B4 with existingPaymentId – no second payment', async () => {
    const sale = renderApp('/quotes', 'qa.sal');
    await screen.findByText(/căn trống/);
    const { created } = await holdFromQuote(sale.user, 'Hoàng Gia', /Hoàng Gia Bảo/);
    await waitFor(() => expect(qrPayments(created.folioId)).toHaveLength(1));
    sale.unmount();

    const { user } = renderApp(`/reservations/${created.id}`, 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Hoàng Gia Bảo' });
    await user.click(within(d).getByRole('button', { name: 'Xác nhận đã nhận cọc' }));
    const dlg = await screen.findByRole('dialog', {
      name: tv('rsv.deposit_title', { code: created.code }),
    });
    expect(await within(dlg).findByText(/chờ khách chuyển/)).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Xác nhận đã nhận cọc' }));
    expect(
      await screen.findByText(tv('rsv.toast.confirmed', { code: created.code })),
    ).toBeInTheDocument();
    const r = mockControl.rsv.reservations.find((x) => x.id === created.id)!;
    expect(r.status).toBe('confirmed');
    expect(r.depositPaidVnd).toBe(created.depositRequiredVnd);
    const pays = mockControl.stay.payments.filter((p) => p.folioId === created.folioId);
    expect(pays).toHaveLength(1);
    expect(pays[0]).toMatchObject({ method: 'vietqr', status: 'succeeded', type: 'deposit' });
  });

  it('H11 without a pending QR: "Tạo VietQR" draws it for the missing deposit; another amount = manual', async () => {
    const { user } = openRsv('Lê Minh', 'qa.fd');
    const r = rsvOf('Lê Minh');
    const d = await screen.findByRole('dialog', { name: 'Lê Minh' });
    await user.click(within(d).getByRole('button', { name: 'Xác nhận đã nhận cọc' }));
    const dlg = await screen.findByRole('dialog', { name: /Xác nhận cọc · OTM-0146/ });
    await user.click(await within(dlg).findByRole('button', { name: /^Tạo VietQR/ }));
    expect(await within(dlg).findByRole('img', { name: /nội dung OTM0146$/ })).toBeInTheDocument();
    expect(qrPayments(r.folioId)[0]).toMatchObject({
      status: 'pending',
      amountVnd: r.depositRequiredVnd,
    });
    // The guest sent less → recorded as a manual transfer, the QR is not confirmed.
    const amount = within(dlg).getByLabelText(/Số tiền đã nhận/);
    await user.clear(amount);
    await user.type(amount, '100000');
    expect(within(dlg).getByText(/khác số trên mã VietQR/)).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Ghi nhận 100.000' }));
    await waitFor(() => expect(rsvOf('Lê Minh').depositPaidVnd).toBe(100_000));
    expect(qrPayments(r.folioId)[0]!.status).toBe('pending');
  });
});

describe('S4-21 Đổi căn có tính thử – ESC-019 A (US-024 AC5–AC7, BR-429)', () => {
  async function openMove(user: User, guest: string) {
    const d = await screen.findByRole('dialog', { name: guest });
    await user.click(within(d).getByRole('button', { name: 'Đổi căn / đổi ngày' }));
    return screen.findByRole('dialog', { name: /Đổi căn \/ đổi ngày · OTM-0\d+/ });
  }
  const pickRoom = (user: User, dlg: HTMLElement, no: string) =>
    user.selectOptions(
      within(dlg).getByLabelText(/^Căn/),
      within(dlg).getByRole('option', { name: new RegExp(`^${no} `) }),
    );

  it('guest asks for another room: new room rates night by night, told box required, exact delta sent', async () => {
    const before = { ...rsvOf('Trần Quốc Bảo') };
    const { user } = openRsv('Trần Quốc Bảo', 'qa.fd');
    const dlg = await openMove(user, 'Trần Quốc Bảo');
    // Reasons grouped by who asked (ESC-019): the guest's request is priced, OTTIMO's is not.
    expect(within(dlg).getByRole('group', { name: tv('move.group_guest') })).toBeInTheDocument();
    expect(within(dlg).getByRole('group', { name: tv('move.group_ottimo') })).toBeInTheDocument();
    expect(within(dlg).getByLabelText(/^Lý do đổi/)).toHaveValue('guest_request');
    await pickRoom(user, dlg, '202');
    const box = await within(dlg).findByRole('region', { name: tv('move.preview_title') });
    expect(within(box).getByText(tv('move.basis.new_room_rate'))).toBeInTheDocument();
    // 402 (1.000.000/night) → 202 (cheaper): two-way – the guest pays less, deposit is kept.
    const nightsTable = within(box).getAllByRole('table')[0]!;
    expect(within(nightsTable).getAllByRole('row')).toHaveLength(1 + before.nights!);
    expect(within(box).getByText(tv('move.delta_down'))).toBeInTheDocument();
    expect(within(box).getByText(tv('move.deposit_paid'))).toBeInTheDocument();
    const save = within(dlg).getByRole('button', { name: 'Lưu thay đổi' });
    expect(save).toHaveAttribute('aria-disabled', 'true');
    expect(within(dlg).getByText(tv('move.save_needs_told'))).toBeInTheDocument();
    await user.click(within(dlg).getByRole('checkbox', { name: /Đã báo khách số tiền mới/ }));
    expect(save).not.toHaveAttribute('aria-disabled');
    await user.click(save);
    expect(await screen.findByText(/^Đã đổi OTM-0159/)).toBeInTheDocument();
    const after = rsvOf('Trần Quốc Bảo');
    expect(after.segments![0]!.roomNo).toBe('202');
    expect(after.totalRoomVnd).toBe(after.nightlyRates!.reduce((a, n) => a + n.amountVnd, 0));
    expect(after.totalRoomVnd).toBeLessThan(before.totalRoomVnd!);
    expect(after.depositPaidVnd).toBe(before.depositPaidVnd);
    expect(after.roomDisclosedToGuest).toBe(true);
  });

  it('OTTIMO moves the guest: rates kept, no told box, saved straight away (AC6)', async () => {
    const before = { ...rsvOf('Trần Quốc Bảo') };
    const { user } = openRsv('Trần Quốc Bảo', 'qa.fd');
    const dlg = await openMove(user, 'Trần Quốc Bảo');
    await user.selectOptions(within(dlg).getByLabelText(/^Lý do đổi/), 'property_fault');
    await pickRoom(user, dlg, '202');
    const box = await within(dlg).findByRole('region', { name: tv('move.preview_title') });
    expect(within(box).getByText(tv('move.basis.keep_booked_rate'))).toBeInTheDocument();
    expect(within(box).getByText(tv('move.delta_zero'))).toBeInTheDocument();
    expect(within(dlg).queryByRole('checkbox', { name: /Đã báo khách/ })).not.toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await screen.findByText(/^Đã đổi OTM-0159/)).toBeInTheDocument();
    expect(rsvOf('Trần Quốc Bảo').totalRoomVnd).toBe(before.totalRoomVnd);
  });

  it('DOM-S4-06 (BR-429 (d1) v0.3.8): guest moves the dates, same room – money changes → told box, exact delta sent', async () => {
    const before = { ...rsvOf('Trần Quốc Bảo') };
    const bodies: Array<Record<string, unknown>> = [];
    const on = ({ request }: { request: Request }) => {
      if (/\/actions\/move$/.test(request.url))
        void request
          .clone()
          .json()
          .then((b: Record<string, unknown>) => bodies.push(b));
    };
    server.events.on('request:start', on);
    const { user } = openRsv('Trần Quốc Bảo', 'qa.fd');
    const dlg = await openMove(user, 'Trần Quốc Bảo');
    expect(within(dlg).getByLabelText(/^Lý do đổi/)).toHaveValue('guest_request');
    // One more night at the end (current rate) – no room change.
    const plusOne = new Date(`${before.departureDate}T00:00:00Z`);
    plusOne.setUTCDate(plusOne.getUTCDate() + 1);
    fireEvent.change(within(dlg).getByLabelText('Ngày đi'), {
      target: { value: plusOne.toISOString().slice(0, 10) },
    });
    const box = await within(dlg).findByRole('region', { name: tv('move.preview_title') });
    await within(box).findByText(tv('move.delta_up'));
    const save = within(dlg).getByRole('button', { name: 'Lưu thay đổi' });
    expect(save).toHaveAttribute('aria-disabled', 'true');
    expect(within(dlg).getByText(tv('move.save_needs_told'))).toBeInTheDocument();
    await user.click(save);
    expect(bodies).toHaveLength(0);
    await user.click(within(dlg).getByRole('checkbox', { name: /Đã báo khách số tiền mới/ }));
    expect(save).not.toHaveAttribute('aria-disabled');
    await user.click(save);
    expect(await screen.findByText(/^Đã đổi OTM-0159/)).toBeInTheDocument();
    server.events.removeListener('request:start', on);
    await waitFor(() => expect(bodies).toHaveLength(1));
    const after = rsvOf('Trần Quốc Bảo');
    const delta = after.totalRoomVnd! - before.totalRoomVnd!;
    expect(delta).toBeGreaterThan(0);
    expect(bodies[0]).toMatchObject({
      reasonCode: 'guest_request',
      applyDifference: true,
      expectedDeltaVnd: delta,
    });
    expect(bodies[0]).not.toHaveProperty('roomId');
  });

  it('DOM-S4-06: without the told flag the server refuses a change of money (422 applyDifference REQUIRED)', async () => {
    const r = rsvOf('Trần Quốc Bảo');
    mockControl.signInAs('qa.fd');
    const plusOne = new Date(`${r.departureDate}T00:00:00Z`);
    plusOne.setUTCDate(plusOne.getUTCDate() + 1);
    const res = await api
      .moveReservation(
        { propertyId: PROPERTY_ID, reservationId: r.id },
        {
          departureDate: plusOne.toISOString().slice(0, 10),
          mode: 'change',
          reasonCode: 'guest_request',
        },
        r.version,
        newIdempotencyKey(),
      )
      .catch((e: unknown) => e);
    expect(isApiError(res) && res.status).toBe(422);
    expect(isApiError(res) && res.fieldErrors).toEqual([
      expect.objectContaining({ field: 'applyDifference', code: 'REQUIRED' }),
    ]);
  });

  it('409 SURCHARGE_CHANGED: price moved after the guest was told → new figures, tell again', async () => {
    const { user } = openRsv('Trần Quốc Bảo', 'qa.fd');
    const dlg = await openMove(user, 'Trần Quốc Bảo');
    await pickRoom(user, dlg, '202');
    await within(dlg).findByRole('region', { name: tv('move.preview_title') });
    await user.click(within(dlg).getByRole('checkbox', { name: /Đã báo khách số tiền mới/ }));
    // Someone changes the 202 list price before the save.
    const room = mockControl.db.rooms.find((r) => r.roomNo === '202')!;
    room.currentListPrice = { ...room.currentListPrice!, nightlyListPriceVnd: 950_000 };
    await user.click(within(dlg).getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await within(dlg).findByText(/Số tiền vừa đổi thành/)).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(dlg).getByRole('checkbox', { name: /Đã báo khách số tiền mới/ }),
      ).not.toBeChecked(),
    );
    await user.click(within(dlg).getByRole('checkbox', { name: /Đã báo khách số tiền mới/ }));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await screen.findByText(/^Đã đổi OTM-0159/)).toBeInTheDocument();
    expect(rsvOf('Trần Quốc Bảo').nightlyRates!.every((n) => n.amountVnd >= 950_000)).toBe(true);
  });

  it('room already disclosed to the guest → "sắp căn tối ưu" is not offered (BR-012 (4))', async () => {
    rsvOf('Trần Quốc Bảo').roomDisclosedToGuest = true;
    const { user } = openRsv('Trần Quốc Bảo', 'qa.fd');
    const dlg = await openMove(user, 'Trần Quốc Bảo');
    const values = within(dlg)
      .getAllByRole('option')
      .map((o) => (o as HTMLOptionElement).value);
    expect(values).not.toContain('inventory_optimize');
    expect(values).toContain('property_fault');
  });
});

describe('S4-10 Thu khi nhận phòng – amountDueAtCheckinVnd (BUG-R2-038, US-025 AC3, BR-402)', () => {
  afterEach(() => vi.useRealTimers());
  const at = (hhmm: string) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
  };
  /** Main document already captured → the wizard can go straight to the hand-over step. */
  function withMainDoc(guest: string) {
    const r = rsvOf(guest);
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    reg.documents.push({
      id: `doc-${r.id}`,
      docType: 'cccd',
      isMain: true,
      fullNameOnDoc: guest,
      nationalityCode: 'VNM',
      docNumber: '079123456789',
      dateOfBirth: '1985-04-02',
      gender: 'male',
      imageIds: [],
      imageConsent: 'refused',
      captureMethod: 'manual',
      checks: [],
    });
    return r;
  }
  async function toHandover(user: User) {
    await screen.findByRole('heading', { name: /Nhận phòng/ });
    await user.click(await screen.findByRole('button', { name: tv('ci.go_verify') }));
    await user.click(await screen.findByRole('button', { name: tv('ci.go_register') }));
    await user.click(await screen.findByRole('button', { name: tv('reg.later') }));
    return screen.findByRole('button', { name: tv('ci.submit', { room: '302' }) });
  }
  const dueRow = () => screen.getByText(tv('ci.due_title')).closest('tr')!;
  const vndText = (n: number) => `${n.toLocaleString('vi-VN')} đ`;

  it('early check-in: due includes the charge B9 will post; VietQR check_in for it, confirmed, then B9', async () => {
    at('11:00');
    const r = withMainDoc('Gia đình anh Hưng');
    const balance = r.balanceDueVnd!;
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    const submit = await toHandover(user);
    expect(within(dueRow()).getByText(vndText(balance))).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: tv('ci.early_toggle') }));
    fireEvent.change(screen.getByLabelText(new RegExp(`^${tv('checkin.time')}`)), {
      target: { value: '11:00' },
    });
    // BR-411: 11:00 → 30 % of the first night (mock 917.000 → 275.000).
    const charge = 275_000;
    await waitFor(() =>
      expect(within(dueRow()).getByText(vndText(balance + charge))).toBeInTheDocument(),
    );
    expect(screen.getByText(tv('ci.due_early'))).toBeInTheDocument();
    // VietQR for exactly that amount (`purpose=check_in`), confirmed received before B9.
    await user.click(screen.getByRole('button', { name: /^Tạo VietQR/ }));
    expect(await screen.findByRole('img', { name: /Mã VietQR/ })).toBeInTheDocument();
    const qr = qrPayments(r.folioId).at(-1)!;
    expect(qr).toMatchObject({ amountVnd: balance + charge, status: 'pending', type: 'charge' });
    await user.click(screen.getByRole('button', { name: /^Ghi nhận đã thu/ }));
    await waitFor(() => expect(within(dueRow()).getByText(vndText(0))).toBeInTheDocument());
    await user.click(screen.getByRole('checkbox', { name: tv('ci.told_guest') }));
    await user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    expect(submit).not.toHaveAttribute('aria-disabled');
    await user.click(submit);
    const box = await screen.findByRole('alertdialog', { name: /Nhận phòng căn 302/ });
    await user.click(within(box).getByRole('button', { name: tv('ci.submit', { room: '302' }) }));
    await waitFor(() => expect(rsvOf('Gia đình anh Hưng').status).toBe('in_house'));
    const folio = mockControl.stay.folios.get(r.folioId)!;
    expect(folio.lines.filter((l) => l.category === 'early_checkin')).toHaveLength(1);
    // Only the QR money – no second payment written by B9.
    expect(
      mockControl.stay.payments.filter(
        (p) => p.folioId === r.folioId && p.method !== 'bank_transfer',
      ),
    ).toHaveLength(1);
  });

  it('a FOC asked on the early charge is not collected now – POS pays the rest WITH B9', async () => {
    at('11:00');
    const r = withMainDoc('Gia đình anh Hưng');
    const balance = r.balanceDueVnd!;
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    const submit = await toHandover(user);
    await user.click(screen.getByRole('switch', { name: tv('ci.early_toggle') }));
    fireEvent.change(screen.getByLabelText(new RegExp(`^${tv('checkin.time')}`)), {
      target: { value: '11:00' },
    });
    await waitFor(() =>
      expect(within(dueRow()).getByText(vndText(balance + 275_000))).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('checkbox', { name: tv('ci.told_guest') }));
    await user.click(screen.getByRole('switch', { name: tv('ci.ask_foc') }));
    await user.click(screen.getAllByRole('radio')[0]!);
    // BR-402 v0.3.6: the FOC requested on the extra charge is taken off what must be paid now.
    await waitFor(() => expect(within(dueRow()).getByText(vndText(balance))).toBeInTheDocument());
    expect(screen.getByText(tv('ci.due_foc'))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('pay.card') }));
    await user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(tv('ci.submit_pay_amount_needed'))).toBeInTheDocument();
    // FE-S4-01: the amount on the POS slip is typed and recorded as is.
    await user.type(
      screen.getByLabelText(new RegExp(`^${tv('ci.pay_received')}`)),
      String(balance),
    );
    expect(screen.getByText(tv('ci.submit_pos_code'))).toBeInTheDocument();
    await user.type(screen.getByLabelText(new RegExp(`^${tv('co.pos_code')}`)), 'AB1234');
    expect(submit).not.toHaveAttribute('aria-disabled');
    await user.click(submit);
    const box = await screen.findByRole('alertdialog', { name: /Nhận phòng căn 302/ });
    await user.click(within(box).getByRole('button', { name: tv('ci.submit', { room: '302' }) }));
    await waitFor(() => expect(rsvOf('Gia đình anh Hưng').status).toBe('in_house'));
    const pos = mockControl.stay.payments.filter(
      (p) => p.folioId === r.folioId && p.method === 'card_pos',
    );
    expect(pos).toHaveLength(1);
    expect(pos[0]!.amountVnd).toBe(balance);
  });

  /** Records every B9 call (URL + body) made while the screen is used. */
  function watchCheckIn() {
    const bodies: Array<Record<string, unknown>> = [];
    const on = ({ request }: { request: Request }) => {
      if (/\/actions\/check-in$/.test(request.url))
        void request
          .clone()
          .json()
          .then((b: Record<string, unknown>) => bodies.push(b));
    };
    server.events.on('request:start', on);
    return { bodies, stop: () => server.events.removeListener('request:start', on) };
  }
  const label = (key: string) =>
    screen.getByLabelText(new RegExp(`^${tv(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));

  it('FB-R2-UXD-FE-S4-01: khách đưa 500.000 cho 2.468.000 → nút khóa, nói thiếu bao nhiêu, không gọi B9', async () => {
    const r = withMainDoc('Gia đình anh Hưng');
    const due = r.balanceDueVnd!;
    expect(due).toBe(2_468_000);
    const { bodies, stop } = watchCheckIn();
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    const submit = await toHandover(user);
    await user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    await user.click(screen.getByRole('button', { name: tv('pay.cash') }));
    // Nothing typed yet → the real amount is asked for, never assumed.
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(tv('ci.submit_pay_amount_needed'))).toBeInTheDocument();
    await user.type(label('co.cash_received'), '500000');
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    const why = screen.getByText(tv('ci.submit_cash_short', { amount: vndText(1_968_000) }));
    expect(submit).toHaveAttribute('aria-describedby', why.id);
    expect(screen.queryByText(/^Thối lại/)).not.toBeInTheDocument();
    await user.click(submit);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    stop();
    expect(bodies).toHaveLength(0);
    expect(rsvOf('Gia đình anh Hưng').status).toBe('confirmed');
    expect(
      mockControl.stay.payments.filter((p) => p.folioId === r.folioId && p.method === 'cash'),
    ).toHaveLength(0);
  });

  it('FB-R2-UXD-FE-S4-01: khách đưa 3.000.000 → thối 532.000, ghi đúng 2.468.000 tiền mặt cùng B9', async () => {
    const r = withMainDoc('Gia đình anh Hưng');
    const due = r.balanceDueVnd!;
    const { bodies, stop } = watchCheckIn();
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    const submit = await toHandover(user);
    await user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    await user.click(screen.getByRole('button', { name: tv('pay.cash') }));
    await user.type(label('co.cash_received'), '3000000');
    expect(screen.getByText(tv('co.change_due', { amount: vndText(532_000) }))).toBeInTheDocument();
    expect(submit).not.toHaveAttribute('aria-disabled');
    await user.click(submit);
    const box = await screen.findByRole('alertdialog', { name: /Nhận phòng căn 302/ });
    expect(within(box).getByText(`Ghi khoản thu ${vndText(due)} – Tiền mặt`)).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: tv('ci.submit', { room: '302' }) }));
    await waitFor(() => expect(rsvOf('Gia đình anh Hưng').status).toBe('in_house'));
    stop();
    expect(bodies).toHaveLength(1);
    expect(bodies[0]!.payment).toEqual({ type: 'charge', method: 'cash', amountVnd: due });
    const cash = mockControl.stay.payments.filter(
      (p) => p.folioId === r.folioId && p.method === 'cash',
    );
    expect(cash.map((p) => p.amountVnd)).toEqual([due]);
  });

  it('FB-R2-UXD-FE-S4-01: chuyển khoản – số đã nhận bắt buộc, thiếu / dư đều khóa, đúng số thì ghi đúng số đó', async () => {
    const r = withMainDoc('Gia đình anh Hưng');
    const due = r.balanceDueVnd!;
    const { bodies, stop } = watchCheckIn();
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    const submit = await toHandover(user);
    await user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    await user.click(screen.getByRole('button', { name: tv('pay.bank_transfer') }));
    // FE-S4-09: the reconciliation sentence only with a hand-recorded transfer.
    expect(screen.getByText(tv('ci.recon_ok'))).toBeInTheDocument();
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(tv('ci.submit_pay_amount_needed'))).toBeInTheDocument();
    const field = label('ci.pay_received');
    await user.type(field, '2000000');
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByText(tv('ci.submit_pay_short', { amount: vndText(due - 2_000_000) })),
    ).toBeInTheDocument();
    await user.clear(field);
    await user.type(field, '2500000');
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByText(tv('ci.submit_pay_over', { amount: vndText(due) })),
    ).toBeInTheDocument();
    await user.clear(field);
    await user.type(field, String(due));
    await user.type(label('co.txn_ref'), 'FT2610170001');
    expect(submit).not.toHaveAttribute('aria-disabled');
    await user.click(submit);
    const box = await screen.findByRole('alertdialog', { name: /Nhận phòng căn 302/ });
    await user.click(within(box).getByRole('button', { name: tv('ci.submit', { room: '302' }) }));
    await waitFor(() => expect(rsvOf('Gia đình anh Hưng').status).toBe('in_house'));
    stop();
    expect(bodies[0]!.payment).toEqual({
      type: 'charge',
      method: 'bank_transfer',
      amountVnd: due,
      note: 'FT2610170001',
    });
  });
});

describe('S4-10 – yêu cầu lễ tân trưởng (202) không kèm khoản thu (ARC 0.3.7, FB-R2-UXD-FE-S4-02)', () => {
  it('FD + buồng chưa sạch + lý do + còn phải thu: gửi được yêu cầu, chỉ có VietQR, thân B9 không có payment', async () => {
    const r = rsvOf('Gia đình anh Hưng');
    const balance = r.balanceDueVnd!;
    expect(balance).toBeGreaterThan(0);
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    reg.documents.push({
      id: 'doc-main-202',
      docType: 'cccd',
      isMain: true,
      fullNameOnDoc: 'Gia đình anh Hưng',
      nationalityCode: 'VNM',
      docNumber: '079123456789',
      imageIds: [],
      imageConsent: 'refused',
      captureMethod: 'manual',
      checks: [],
    });
    mockControl.stay.roomStatus['302'] = 'VD';
    const bodies: Array<Record<string, unknown>> = [];
    const on = ({ request }: { request: Request }) => {
      if (/\/actions\/check-in$/.test(request.url))
        void request
          .clone()
          .json()
          .then((b: Record<string, unknown>) => bodies.push(b));
    };
    server.events.on('request:start', on);
    const paymentsBefore = mockControl.stay.payments.length;
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await screen.findByRole('heading', { name: /Nhận phòng/ });
    await user.click(await screen.findByRole('button', { name: tv('ci.go_verify') }));
    await user.click(await screen.findByRole('button', { name: tv('ci.go_register') }));
    await user.click(await screen.findByRole('button', { name: tv('reg.later') }));
    // Before the reason: an ordinary check-in – the four ways to collect are offered.
    expect(screen.getByRole('button', { name: tv('pay.cash') })).toBeInTheDocument();
    await user.type(
      screen.getByLabelText(new RegExp(`^${tv('ci.reason')}`)),
      'Khách chờ không được',
    );
    // A request to the lead records no money: no cash / transfer / POS, no "ghi cùng lúc" promise.
    expect(screen.queryByRole('button', { name: tv('pay.cash') })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tv('pay.card') })).not.toBeInTheDocument();
    expect(screen.queryByText(/được ghi cùng lúc với nhận phòng/)).not.toBeInTheDocument();
    const vndText = (n: number) => `${n.toLocaleString('vi-VN')} đ`;
    expect(
      screen.getByText(tv('ci.pay_after_lead', { amount: vndText(balance) })),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Tạo VietQR/ })).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    const send = screen.getByRole('button', { name: tv('ci.send_lead') });
    // The unpaid balance does not block the request (collected at the B9 call after approval).
    expect(send).not.toHaveAttribute('aria-disabled');
    await user.click(send);
    const box = await screen.findByRole('alertdialog', { name: /Gửi lễ tân trưởng xác nhận/ });
    expect(within(box).queryByText(/^Ghi khoản thu/)).not.toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: tv('ci.send_lead') }));
    expect((await screen.findAllByText(tv('ci.waiting_lead'))).length).toBeGreaterThan(0);
    server.events.removeListener('request:start', on);
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({ roomNotReadyOverride: { reason: 'Khách chờ không được' } });
    expect(bodies[0]).not.toHaveProperty('payment');
    expect(rsvOf('Gia đình anh Hưng').status).toBe('confirmed');
    expect(mockControl.stay.payments.length).toBe(paymentsBefore);
  });

  it('sau khi lễ tân trưởng duyệt: Tải lại → nhận phòng gửi approvalRequestId + khoản thu tiền mặt thật (0.3.7 (a))', async () => {
    const r = rsvOf('Gia đình anh Hưng');
    const due = r.balanceDueVnd!;
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    reg.documents.push({
      id: 'doc-main-202b',
      docType: 'cccd',
      isMain: true,
      fullNameOnDoc: 'Gia đình anh Hưng',
      nationalityCode: 'VNM',
      docNumber: '079123456789',
      imageIds: [],
      imageConsent: 'refused',
      captureMethod: 'manual',
      checks: [],
    });
    mockControl.stay.roomStatus['302'] = 'VD';
    const bodies: Array<Record<string, unknown>> = [];
    const on = ({ request }: { request: Request }) => {
      if (/\/actions\/check-in$/.test(request.url))
        void request
          .clone()
          .json()
          .then((b: Record<string, unknown>) => bodies.push(b));
    };
    server.events.on('request:start', on);
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await screen.findByRole('heading', { name: /Nhận phòng/ });
    await user.click(await screen.findByRole('button', { name: tv('ci.go_verify') }));
    await user.click(await screen.findByRole('button', { name: tv('ci.go_register') }));
    await user.click(await screen.findByRole('button', { name: tv('reg.later') }));
    await user.type(
      screen.getByLabelText(new RegExp(`^${tv('ci.reason')}`)),
      'Khách chờ không được',
    );
    await user.click(screen.getByRole('checkbox', { name: /Đã gửi\/giao nội quy/ }));
    await user.click(screen.getByRole('button', { name: tv('ci.send_lead') }));
    const box = await screen.findByRole('alertdialog', { name: /Gửi lễ tân trưởng xác nhận/ });
    await user.click(within(box).getByRole('button', { name: tv('ci.send_lead') }));
    const waiting = (await screen.findAllByText(tv('ci.waiting_lead'))).find((x) =>
      x.closest('.alert'),
    )!;
    // The lead approves (Cần duyệt – another screen).
    const a = mockControl.stay.approvals.find(
      (x) => x.type === 'checkin_room_not_ready' && x.reservationCode === r.code,
    )!;
    Object.assign(a, {
      status: 'approved',
      approverName: 'Quân',
      decidedAt: new Date().toISOString(),
    });
    await user.click(
      within(waiting.closest('.alert') as HTMLElement).getByRole('button', {
        name: tv('common.reload'),
      }),
    );
    expect(await screen.findByText(tv('ci.room_approved', { name: 'Quân' }))).toBeInTheDocument();
    // The desk now checks in and collects: the four ways are back, no second request.
    await user.click(screen.getByRole('button', { name: tv('pay.cash') }));
    await user.type(screen.getByLabelText(new RegExp(`^${tv('co.cash_received')}`)), String(due));
    const submit = screen.getByRole('button', { name: tv('ci.submit', { room: '302' }) });
    expect(submit).not.toHaveAttribute('aria-disabled');
    await user.click(submit);
    const ok = await screen.findByRole('alertdialog', { name: /Nhận phòng căn 302/ });
    await user.click(within(ok).getByRole('button', { name: tv('ci.submit', { room: '302' }) }));
    await waitFor(() => expect(rsvOf('Gia đình anh Hưng').status).toBe('in_house'));
    server.events.removeListener('request:start', on);
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toMatchObject({
      roomNotReadyOverride: { approvalRequestId: a.id },
      payment: { type: 'charge', method: 'cash', amountVnd: due },
    });
    expect(
      mockControl.stay.approvals.filter((x) => x.type === 'checkin_room_not_ready'),
    ).toHaveLength(1);
  });
});

describe('S4-08 Hủy / no-show: dòng dịch vụ tự đảo, trừ dòng lễ tân giữ kèm lý do (BR-309)', () => {
  function addServiceLines(guest: string) {
    const r = rsvOf(guest);
    const folio = mockControl.stay.folios.get(r.folioId)!;
    const line = (id: string, category: string, text: string, amount: number, date: string) => ({
      id,
      category,
      description: category,
      labelKey: `bill.line.${category}`,
      labelParams: { text, qty: 1 },
      serviceDate: date,
      quantity: 1,
      unitPriceVnd: amount,
      amountVnd: amount,
      lineState: 'posted' as const,
      postedAt: new Date().toISOString(),
    });
    // Airport pick-up already done yesterday (cost to a third party) + a breakfast not served yet.
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    folio.lines.push(line('svc-pickup', 'service_fee', 'Đưa đón sân bay', 300_000, yesterday));
    folio.lines.push(line('svc-breakfast', 'fnb', 'Bữa sáng', 200_000, r.arrivalDate));
    return folio;
  }
  const reversalsOf = (folio: { lines: Array<{ reversalOfId?: string }> }) =>
    folio.lines.map((l) => l.reversalOfId).filter(Boolean);

  it('cancel: lines listed from the dry run, a kept line needs a reason, the same retainLines are saved', async () => {
    const folio = addServiceLines('Trần Quốc Bảo');
    const { user } = openRsv('Trần Quốc Bảo', 'qa.fd');
    const d = await screen.findByRole('dialog', { name: 'Trần Quốc Bảo' });
    await user.click(within(d).getByRole('button', { name: 'Hủy đơn' }));
    const box = await screen.findByRole('alertdialog', { name: /Hủy đơn OTM-0159/ });
    const group = await within(box).findByRole('group', { name: tv('svc.title') });
    expect(within(group).getByText(/Đảo 500\.000 đ · giữ 0 đ/)).toBeInTheDocument();
    expect(within(group).getByText(tv('svc.performed'))).toBeInTheDocument();
    await user.click(within(group).getByRole('checkbox', { name: /300\.000 đ$/ }));
    // FE-S4-14: ticked without a reason → the summary (still "giữ 0 đ") gives way to what is missing,
    // and the reason field says it as help from the tick on.
    expect(within(group).getByRole('status')).toHaveTextContent(tv('svc.reason_needed'));
    expect(within(group).queryByText(/Đảo 500\.000 đ · giữ 0 đ/)).not.toBeInTheDocument();
    expect(
      within(group).getByLabelText(new RegExp(`^${tv('svc.reason')}`)),
    ).toHaveAccessibleDescription(tv('svc.reason_needed'));
    await user.selectOptions(within(box).getByLabelText(/Lý do hủy/), 'found_other');
    // Kept without a reason → not sent.
    await waitFor(() => expect(within(box).getByRole('button', { name: 'Hủy đơn' })).toBeEnabled());
    await user.click(within(box).getByRole('button', { name: 'Hủy đơn' }));
    expect(within(group).getByRole('status')).toHaveTextContent(tv('svc.reason_needed'));
    expect(rsvOf('Trần Quốc Bảo').status).toBe('confirmed');
    await user.type(within(group).getByLabelText(new RegExp(`^${tv('svc.reason')}`)), 'Xe đã đón');
    expect(await within(group).findByText(/Đảo 200\.000 đ · giữ 300\.000 đ/)).toBeInTheDocument();
    await waitFor(() => expect(within(box).getByRole('button', { name: 'Hủy đơn' })).toBeEnabled());
    await user.click(within(box).getByRole('button', { name: 'Hủy đơn' }));
    expect(
      await screen.findByText(tv('rsv.toast.cancelled', { code: 'OTM-0159' })),
    ).toBeInTheDocument();
    expect(reversalsOf(folio)).toEqual(['svc-breakfast']);
  });

  it('no-show: lines read from the folio (no dry run); kept line + reason sent with markNoShow', async () => {
    mockControl.db.params.push({
      key: 'no_show_mark_time',
      value: '00:00',
      effectiveFrom: '2026-10-01',
      brRef: 'BR-311',
      editableBy: ['owner', 'manager'],
    });
    const folio = addServiceLines('Gia đình anh Hưng');
    const { user } = openRsv('Gia đình anh Hưng', 'qa.fdl');
    const d = await screen.findByRole('dialog', { name: 'Gia đình anh Hưng' });
    await user.click(within(d).getByRole('button', { name: 'Đánh dấu không đến' }));
    const box = await screen.findByRole('alertdialog', { name: /không đến\?/ });
    const group = await within(box).findByRole('group', { name: tv('svc.title') });
    await user.click(within(group).getByRole('checkbox', { name: /300\.000 đ$/ }));
    await user.type(
      within(group).getByLabelText(new RegExp(`^${tv('svc.reason')}`)),
      'Xe đã ra sân bay',
    );
    await user.selectOptions(
      within(box).getByLabelText(/Kết quả liên lạc/),
      'rsv.contact_noanswer',
    );
    await user.click(within(box).getByRole('button', { name: 'Đánh dấu không đến' }));
    expect(
      await screen.findByText(tv('rsv.toast.no_show', { code: 'OTM-0155' })),
    ).toBeInTheDocument();
    expect(reversalsOf(folio)).toEqual(['svc-breakfast']);
  });
});

describe('#6 expectedVersion khi duyệt / từ chối hoàn tiền (0.3.7 B-6 – cùng PR BE-B)', () => {
  /** Bodies of approve / reject requests the screen really sent. */
  function captureDecisions() {
    const sent: Array<{ path: string; body: Record<string, unknown> }> = [];
    const on = ({ request }: { request: Request }) => {
      if (!/\/approval-requests\/[^/]+\/actions\/(approve|reject)$/.test(request.url)) return;
      void request
        .clone()
        .json()
        .then((body: Record<string, unknown>) =>
          sent.push({ path: new URL(request.url).pathname, body }),
        );
    };
    server.events.on('request:start', on);
    return { sent, stop: () => server.events.removeListener('request:start', on) };
  }
  function pendingRefund() {
    const kim = rsvOf('Kim Seo-yeon');
    const a = {
      id: '0192a1b0-0000-7000-8000-000000085099',
      type: 'refund',
      status: 'pending' as const,
      reservationCode: kim.code,
      folioId: kim.folioId,
      amountVnd: 300_000,
      reasonCode: 'overpayment',
      requestedBy: 'Hạnh',
      requestedByUserId: 'someone-else',
      requestedAt: new Date().toISOString(),
      refundDestination: { method: 'cash', setAt: new Date().toISOString() },
      refundedVnd: 0,
      version: 3,
    };
    mockControl.stay.approvals.push(a);
    return a;
  }
  const refundCard = async (code: string) =>
    (
      await screen.findByText(
        (_, el) =>
          el?.tagName === 'B' && el.textContent === `${code} · ${tv('refund.title')} · 300.000`,
      )
    ).closest('li')!;

  it('BUG-R2-107: the queue is read whole – status filtered by the server, every page (120 pending after 10 decided)', async () => {
    const kim = rsvOf('Kim Seo-yeon');
    const at = (i: number) => new Date(Date.UTC(2026, 9, 1, 0, 0, 0) - i * 60_000).toISOString();
    const req = (i: number, status: 'pending' | 'approved', amountVnd: number) => ({
      id: `0192a1b0-0000-7000-8000-${String(300_000 + i).padStart(12, '0')}`,
      type: 'foc',
      status,
      reservationCode: kim.code,
      amountVnd,
      reasonCode: 'regular_vip',
      requestedBy: 'Hạnh',
      requestedByUserId: 'someone-else',
      requestedAt: at(i),
    });
    // Newest first: 10 decided requests, then 120 pending – the last (oldest) pending one is #130 overall,
    // #120 among the pending ones (past the first page of 100).
    for (let i = 0; i < 10; i++) mockControl.stay.approvals.push(req(i, 'approved', 10_000));
    for (let i = 10; i < 129; i++) mockControl.stay.approvals.push(req(i, 'pending', 20_000));
    mockControl.stay.approvals.push(req(129, 'pending', 777_000));
    const urls: string[] = [];
    const on = ({ request }: { request: Request }) => {
      if (request.method === 'GET' && /\/approval-requests(\?|$)/.test(request.url))
        urls.push(request.url);
    };
    server.events.on('request:start', on);
    renderApp('/approvals', 'qa.mgr');
    expect(
      await screen.findByText(
        (_, el) => el?.tagName === 'B' && !!el.textContent?.endsWith(' · 777.000'),
        undefined,
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    server.events.removeListener('request:start', on);
    const qs = urls.map((u) => new URL(u).searchParams);
    // Filtered on the server – never "all statuses, filter here". The queue reads pending/escalated; the decided
    // statuses are only the first page for "Yêu cầu bạn đã gửi" under it (FE-A đợt 26, QA 11.33).
    expect(qs.every((q) => !!q.get('status'))).toBe(true);
    expect(
      qs
        .filter((q) => !['pending', 'escalated'].includes(q.get('status') ?? ''))
        .every(
          (q) =>
            ['approved', 'rejected', 'cancelled'].includes(q.get('status')!) && !q.get('cursor'),
        ),
    ).toBe(true);
    expect(qs.some((q) => q.get('status') === 'pending' && q.get('cursor') === '100')).toBe(true);
    // Decided requests are not in the queue.
    expect(
      screen.queryAllByText(
        (_, el) => el?.tagName === 'B' && !!el.textContent?.endsWith(' · 10.000'),
      ),
    ).toHaveLength(0);
  });

  it('approve sends the version on screen; a payout changed meanwhile → 412, reload, decide again', async () => {
    const a = pendingRefund();
    const cap = captureDecisions();
    const { user } = renderApp('/approvals', 'qa.mgr');
    let card = await refundCard(a.reservationCode);
    await user.click(within(card).getByRole('button', { name: tv('approval.approve') }));
    let dlg = await screen.findByRole('dialog', { name: /Duyệt hoàn/ });
    // Someone changes the payout after the manager opened the request.
    a.version = 4;
    await user.type(within(dlg).getByLabelText(/^Mật khẩu đăng nhập/), MOCK_PASSWORD);
    await user.click(within(dlg).getByRole('button', { name: tv('approval.approve') }));
    expect(await within(dlg).findByText(tv('approval.changed_since_open'))).toBeInTheDocument();
    expect(a.status).toBe('pending');
    // BUG-R2-106: while the queue is read again the old card (old version) cannot be decided on.
    let release: () => void = () => undefined;
    const held = new Promise<void>((ok) => (release = ok));
    server.use(
      http.get(
        '*/approval-requests',
        async () => {
          await held; // then falls through to the mock queue
        },
        { once: true },
      ),
    );
    await user.click(within(dlg).getByRole('button', { name: tv('common.reload') }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    card = await refundCard(a.reservationCode);
    expect(within(card).getByRole('button', { name: tv('approval.approve') })).toBeDisabled();
    release();
    card = await refundCard(a.reservationCode);
    await waitFor(() =>
      expect(within(card).getByRole('button', { name: tv('approval.approve') })).toBeEnabled(),
    );
    await user.click(within(card).getByRole('button', { name: tv('approval.approve') }));
    dlg = await screen.findByRole('dialog', { name: /Duyệt hoàn/ });
    await user.type(within(dlg).getByLabelText(/^Mật khẩu đăng nhập/), MOCK_PASSWORD);
    await user.click(within(dlg).getByRole('button', { name: tv('approval.approve') }));
    await waitFor(() => expect(a.status).toBe('approved'));
    cap.stop();
    await waitFor(() => expect(cap.sent).toHaveLength(2));
    expect(cap.sent.map((x) => x.body.expectedVersion)).toEqual([3, 4]);
  });

  it('reject a refund carries expectedVersion; a FOC decision does not need it', async () => {
    const a = pendingRefund();
    const cap = captureDecisions();
    const { user } = renderApp('/approvals', 'qa.mgr');
    const card = await refundCard(a.reservationCode);
    await user.click(within(card).getByRole('button', { name: tv('approval.reject') }));
    const dlg = await screen.findByRole('dialog', { name: /Từ chối/ });
    await user.type(
      within(dlg).getByLabelText(/^Lý do từ chối/),
      'Khách đổi ý, giữ tiền cho lần sau',
    );
    await user.type(within(dlg).getByLabelText(/^Mật khẩu đăng nhập/), MOCK_PASSWORD);
    await user.click(within(dlg).getByRole('button', { name: tv('approval.reject') }));
    await waitFor(() => expect(a.status).toBe('rejected'));
    // FOC (seed): approve without the field – the FOC flow is unchanged (B-6 required for refund only).
    const kim = rsvOf('Kim Seo-yeon');
    const foc = (
      await screen.findByText(
        (_, el) =>
          el?.tagName === 'B' && el.textContent === `${kim.code} · ${tv('foc.kind_foc')} · 75.000`,
      )
    ).closest('li')!;
    await user.click(within(foc).getByRole('button', { name: tv('approval.approve') }));
    const d2 = await screen.findByRole('dialog', { name: /Duyệt miễn/ });
    await user.type(within(d2).getByLabelText(/^Mật khẩu đăng nhập/), MOCK_PASSWORD);
    await user.click(within(d2).getByRole('button', { name: tv('approval.approve') }));
    await waitFor(() => expect(mockControl.stay.approvals[3]!.status).toBe('approved'));
    cap.stop();
    await waitFor(() => expect(cap.sent).toHaveLength(2));
    expect(cap.sent[0]!.body.expectedVersion).toBe(3);
    expect(cap.sent[1]!.body).not.toHaveProperty('expectedVersion');
  });
});

describe('S4-39 Bỏ người khỏi đoàn – chọn ô "Khách n" (0.3.7 removePartyMember.guestUploadPersonIndex)', () => {
  /** Hưng: booker + An (no ID) + Bình; guest-link IDs in "Khách 2" and "Khách 3", nobody linked. */
  function setup() {
    const r = rsvOf('Gia đình anh Hưng');
    const reg = mockControl.stay.registrations.get(r.registrationId!)!;
    mockControl.stay.party.set(r.id, [
      { id: 'm-booker', role: 'booker', displayName: 'Gia đình anh Hưng', priceAgeBand: 'adult' },
      { id: 'm-an', role: 'companion', displayName: 'Nguyễn Văn An', priceAgeBand: 'adult' },
      { id: 'm-binh', role: 'companion', displayName: 'Trần Văn Bình', priceAgeBand: 'adult' },
    ]);
    const base = {
      docType: 'cccd',
      isMain: false,
      nationalityCode: 'VNM',
      imageConsent: 'not_recorded' as const,
      checks: [],
      captureMethod: 'guest_upload',
    };
    reg.documents.push(
      { ...base, id: 'k2', fullNameOnDoc: '', docNumber: '', imageIds: ['i2'], personIndex: 2 },
      { ...base, id: 'k3', fullNameOnDoc: '', docNumber: '', imageIds: ['i3'], personIndex: 3 },
    );
    return { r, reg };
  }
  async function openRemove(user: User, name: string) {
    const d = await screen.findByRole('dialog', { name: 'Gia đình anh Hưng' });
    await user.click(within(d).getByRole('button', { name: tv('rsv.add_person') }));
    const party = await screen.findByRole('dialog', { name: tv('rsv.party') });
    const li = (await within(party).findByText(name)).closest('li')!;
    await user.click(within(li).getByRole('button', { name: tv('party.remove') }));
    return screen.findByRole('alertdialog', { name: tv('party.remove_confirm', { name }) });
  }

  it("asks which slot was the person's (nothing pre-selected), sends it; that ID goes, the later slot moves up", async () => {
    const { reg } = setup();
    const { user } = openRsv('Gia đình anh Hưng', 'qa.fd');
    const box = await openRemove(user, 'Nguyễn Văn An');
    const group = await within(box).findByRole('group', {
      name: tv('party.slot_question', { name: 'Nguyễn Văn An' }),
    });
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((x) => (x as HTMLInputElement).checked)).toEqual([false, false, false]);
    expect(within(group).getByRole('radio', { name: 'Khách 2' })).toBeInTheDocument();
    expect(within(group).getByRole('radio', { name: tv('party.slot_none') })).toBeInTheDocument();
    expect(within(box).getByRole('button', { name: tv('party.remove') })).toBeDisabled();
    await user.click(within(group).getByRole('radio', { name: 'Khách 2' }));
    await user.click(within(box).getByRole('button', { name: tv('party.remove') }));
    await waitFor(() =>
      expect(mockControl.stay.party.get(rsvOf('Gia đình anh Hưng').id)!.map((m) => m.id)).toEqual([
        'm-booker',
        'm-binh',
      ]),
    );
    // "Khách 2" destroyed now; "Khách 3" moved up to 2 and does NOT wait 24 h.
    expect(reg.documents.map((d) => [d.id, d.personIndex])).toEqual([['k3', 2]]);
    expect(reg.documents[0]!.fieldsPurgeAfter ?? null).toBeNull();
  });

  it('"Không có": nothing is deleted; the server asking (422 + personIndexes) also opens the choice', async () => {
    const { reg } = setup();
    // Registration cannot be read → the server asks.
    server.use(
      http.get('*/v1/properties/:p/registrations/:id', () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    );
    const { user } = openRsv('Gia đình anh Hưng', 'qa.fd');
    const box = await openRemove(user, 'Nguyễn Văn An');
    await user.click(within(box).getByRole('button', { name: tv('party.remove') }));
    const group = await within(box).findByRole('group', {
      name: tv('party.slot_question', { name: 'Nguyễn Văn An' }),
    });
    expect(within(group).getAllByRole('radio')).toHaveLength(3);
    await user.click(within(group).getByRole('radio', { name: tv('party.slot_none') }));
    await user.click(within(box).getByRole('button', { name: tv('party.remove') }));
    await waitFor(() =>
      expect(
        screen.queryByRole('alertdialog', { name: /Bỏ Nguyễn Văn An/ }),
      ).not.toBeInTheDocument(),
    );
    expect(reg.documents.map((d) => d.id)).toEqual(['k2', 'k3']);
  });
});

describe('BUG-R2-080 – báo giá gửi khách bằng tiếng Nga (US-083 AC2, P-S4-3)', () => {
  it('the send step offers Tiếng Việt / English / Русский and shows the server text of the chosen one', async () => {
    const asked: string[] = [];
    const on = ({ request }: { request: Request }) => {
      if (/\/quotes\/[^/]+\/text/.test(request.url))
        asked.push(new URL(request.url).searchParams.get('locale') ?? '');
    };
    server.events.on('request:start', on);
    const { user } = renderApp('/quotes', 'qa.sal');
    await screen.findByText(/căn trống/);
    const item = await waitFor(() => {
      const li = screen
        .getAllByRole('listitem')
        .find((x) => x.querySelector('.roomno')?.textContent === '203');
      if (!li) throw new Error('room 203 not listed');
      return li;
    });
    await user.click(within(item).getByRole('button', { name: 'Báo giá' }));
    const dlg = await screen.findByRole('dialog', { name: 'Báo giá' });
    await within(dlg).findByText('Tổng tiền đơn');
    await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Hoàng Gia');
    await user.click(await screen.findByRole('option', { name: /Hoàng Gia Bảo/ }));
    await user.click(within(dlg).getByRole('button', { name: 'Lưu báo giá' }));
    const send = await screen.findByRole('dialog', { name: /BG-000\d+/ });
    await within(send).findByText(/Báo giá BG-000/);
    await user.click(within(send).getByRole('button', { name: 'Русский' }));
    expect(await within(send).findByText(/Предложение BG-000/)).toBeInTheDocument();
    server.events.removeListener('request:start', on);
    expect(asked).toEqual(['vi', 'ru']);
  });
});

describe('S4-27 Điều chỉnh dòng folio & đảo giao dịch thu (US-006 AC1, US-032 AC1, US-038 AC2, US-119 AC3)', () => {
  function captureAdjust() {
    const sent: Array<{ url: string; ifMatch: string | null; body: Record<string, unknown> }> = [];
    const on = ({ request }: { request: Request }) => {
      if (!/\/lines\/[^/]+\/adjustments$/.test(request.url)) return;
      void request
        .clone()
        .json()
        .then((body: Record<string, unknown>) =>
          sent.push({ url: request.url, ifMatch: request.headers.get('if-match'), body }),
        );
    };
    server.events.on('request:start', on);
    return { sent, stop: () => server.events.removeListener('request:start', on) };
  }
  function addLaundry(guest: string) {
    const r = rsvOf(guest);
    const folio = mockControl.stay.folios.get(r.folioId)!;
    folio.lines.push({
      id: 'laundry-1',
      category: 'laundry',
      description: 'laundry x3',
      labelKey: 'bill.line.laundry',
      labelParams: { qty: 3 },
      serviceDate: r.arrivalDate,
      quantity: 3,
      unitPriceVnd: 25_000,
      amountVnd: 75_000,
      lineState: 'posted',
      postedAt: new Date().toISOString(),
    });
    return { r, folio };
  }
  async function openFolio(user: User, guest: string) {
    const d = await screen.findByRole('dialog', { name: guest });
    await user.click(await within(d).findByRole('button', { name: tv('folio.open') }));
    return screen.findByRole('dialog', { name: /^Folio · OTM-0\d+/ });
  }

  it('FD: quantity 3 → 2 with a reason = reversal + new line (If-Match = folio version), nothing deleted', async () => {
    const { folio } = addLaundry('Nguyễn Văn An');
    const cap = captureAdjust();
    const { user } = openRsv('Nguyễn Văn An', 'qa.fd');
    const dlg = await openFolio(user, 'Nguyễn Văn An');
    const row = (await within(dlg).findByText(/Giặt|laundry/i)).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: tv('folio.adjust') }));
    const box = await screen.findByRole('dialog', { name: /^Điều chỉnh:/ });
    const qty = within(box).getByLabelText(new RegExp(`^${tv('folio.adjust_qty')}`));
    await user.clear(qty);
    await user.type(qty, '2');
    expect(
      within(box).getByText(/Ghi bút toán đảo 75\.000 đ và dòng mới 50\.000 đ/),
    ).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    expect(within(box).getByText(tv('field_error.reason_required'))).toBeInTheDocument();
    await user.type(
      within(box).getByLabelText(new RegExp(`^${tv('folio.adjust_reason')}`)),
      'Cân lại còn 2 kg',
    );
    const version = folio.version;
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    expect(await screen.findByText(tv('folio.adjusted_toast'))).toBeInTheDocument();
    cap.stop();
    expect(cap.sent[0]!.body).toEqual({ newQuantity: 2, reason: 'Cân lại còn 2 kg' });
    expect(cap.sent[0]!.ifMatch).toBe(`"${version}"`);
    // The original line stays, a reversal and a new line are added (BR-008).
    expect(folio.lines.find((l) => l.id === 'laundry-1')).toBeDefined();
    expect(folio.lines.filter((l) => l.reversalOfId === 'laundry-1')).toHaveLength(1);
    expect(folio.lines.at(-1)).toMatchObject({
      category: 'laundry',
      quantity: 2,
      amountVnd: 50_000,
    });
    expect(await within(dlg).findByText(tv('folio.reversal_chip'))).toBeInTheDocument();
  });

  it('night line: price only (S4-35); out of the floor–ceiling → said at the field', async () => {
    const cap = captureAdjust();
    const { user } = openRsv('Nguyễn Văn An', 'qa.fd');
    const dlg = await openFolio(user, 'Nguyễn Văn An');
    const rows = await within(dlg).findAllByRole('row');
    const night = rows.find((x) => within(x).queryByRole('button', { name: tv('folio.adjust') }))!;
    await user.click(within(night).getByRole('button', { name: tv('folio.adjust') }));
    const box = await screen.findByRole('dialog', { name: /^Điều chỉnh:/ });
    expect(within(box).queryByLabelText(new RegExp(`^${tv('folio.adjust_qty')}`))).toBeNull();
    expect(within(box).queryByRole('checkbox', { name: tv('folio.adjust_void') })).toBeNull();
    const price = within(box).getByLabelText(
      new RegExp(`^${tv('folio.adjust_night_price').replace(/[()]/g, '\\$&')}`),
    );
    await user.clear(price);
    await user.type(price, '100000');
    await user.type(
      within(box).getByLabelText(new RegExp(`^${tv('folio.adjust_reason')}`)),
      'Giá thỏa thuận',
    );
    await user.click(within(box).getByRole('button', { name: tv('folio.adjust_submit') }));
    expect((await within(box).findAllByText(/Giá phải từ/)).length).toBeGreaterThan(0);
    cap.stop();
    expect(cap.sent[0]!.body).toEqual({ newUnitPriceVnd: 100_000, reason: 'Giá thỏa thuận' });
  });

  it('reverse a payment: manager only, reason required, the original stays; front desk has no button', async () => {
    const r = rsvOf('Nguyễn Văn An');
    const first = openRsv('Nguyễn Văn An', 'qa.fd');
    let dlg = await openFolio(first.user, 'Nguyễn Văn An');
    await within(dlg).findByText(tv('folio.payments'));
    expect(within(dlg).queryByRole('button', { name: tv('pay.reverse') })).not.toBeInTheDocument();
    first.unmount();

    const { user } = openRsv('Nguyễn Văn An', 'qa.mgr');
    dlg = await openFolio(user, 'Nguyễn Văn An');
    await within(dlg).findByText(tv('folio.payments'));
    const payRow = within(dlg)
      .getAllByRole('listitem')
      .find((li) => li.textContent?.includes(tv('pay.vietqr')))!;
    await user.click(within(payRow).getByRole('button', { name: tv('pay.reverse') }));
    const box = await screen.findByRole('alertdialog', { name: /^Đảo giao dịch 1\.000\.000 đ/ });
    expect(within(box).getByRole('button', { name: tv('pay.reverse') })).toBeDisabled();
    await user.type(within(box).getByLabelText(/^Lý do đảo/), 'Ghi nhầm đơn');
    await user.click(within(box).getByRole('button', { name: tv('pay.reverse') }));
    expect(await screen.findByText(/Đã đảo giao dịch 1\.000\.000 đ/)).toBeInTheDocument();
    const pay = mockControl.stay.payments.find(
      (p) => p.folioId === r.folioId && p.method === 'vietqr',
    )!;
    expect(pay.status).toBe('reversed');
    expect(await within(payRow).findByText(tv('pay.reversed_chip'))).toBeInTheDocument();
  });

  it('settled folio (checked out): front desk reads only; manager can adjust after settlement (A32)', async () => {
    const r = mockControl.rsv.reservations.find(
      (x) => x.status === 'checked_out' && x.channelCode === 'direct',
    )!;
    const fd = renderApp(`/reservations/${r.id}`, 'qa.fd');
    let dlg = await openFolio(fd.user, r.guestName);
    expect(await within(dlg).findByText(tv('folio.settled_fd'))).toBeInTheDocument();
    expect(within(dlg).queryByRole('button', { name: tv('folio.adjust') })).not.toBeInTheDocument();
    fd.unmount();
    const mgr = renderApp(`/reservations/${r.id}`, 'qa.mgr');
    dlg = await openFolio(mgr.user, r.guestName);
    expect(await within(dlg).findByText(tv('folio.settled_mgr'))).toBeInTheDocument();
    expect(within(dlg).getAllByRole('button', { name: tv('folio.adjust') }).length).toBeGreaterThan(
      0,
    );
  });
});
