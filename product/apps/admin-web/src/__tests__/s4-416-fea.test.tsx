// Sprint 4 – FE-A theo ARC 0.3.7 bổ sung 4 mục 16.6 (DOM 18/10): (d) BR-416-06 phụ thu trả muộn bằng giá 1 đêm khi đêm
// ngày đi không bán được – quản lý xác nhận tại quầy (+ FOC tùy chọn, SEC FB-R2-SEC-FE-08); (e) minibar theo tủ (lượt × căn),
// số folio đã sửa thắng lần đếm cũ; (f) xác nhận VietQR vượt số còn phải thu cần ghi chú.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { api } from '../app/api';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { MOCK_PASSWORD, PROPERTY_ID } from '../mocks/seed';
import { MINIBAR } from '../mocks/stay';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const dots = (n: number) => n.toLocaleString('vi-VN');
const num = (s: string) => Number(s.replace(/\D/g, ''));
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};
afterEach(() => vi.useRealTimers());

function capture(method: string, re: RegExp) {
  const sent: Array<Record<string, unknown>> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== method || !re.test(new URL(request.url).pathname)) return;
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => sent.push(b));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

/** Phạm Huy (201) leaves at 19:30 while "Gia đình anh Hưng" arrives in 201 tonight – the extra night cannot be sold. */
function soldTonight() {
  at('19:40');
  const r = res('Phạm Huy');
  const next = res('Gia đình anh Hưng');
  next.roomId = r.roomId;
  next.arrivalDate = r.departureDate;
  mockControl.stay.minibarChecks.set(r.id, []);
  return r;
}

async function toBillAt1930(user: ReturnType<typeof renderApp>['user']) {
  await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
  fireEvent.change(await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))), {
    target: { value: '19:30' },
  });
}

/**
 * ESC-031: the bill step opens on "Ghi phụ thu – quản lý xem lại"; the desk confirmation (this file) is the second
 * choice, offered only while the server says 2FA is not enforced (mock default `mfaEnforced = false`).
 */
const lateFeeBox = async (fee: number) => {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: tv('co.late_fee_mode_desk') }));
  return (
    await screen.findByRole('heading', {
      name: tv('co.late_fee_confirm_title', { amount: money(fee) }),
    })
  ).closest('section')!;
};

describe('BR-416-06 – phụ thu trả muộn bằng giá 1 đêm khi đêm ngày đi không bán được (ARC 16.6 (d))', () => {
  it('FD: số của máy chủ gồm phụ thu, hộp quản lý xác nhận (3 số, ô mật khẩu không tự điền), FOC 50 %, sai mật khẩu → một câu chung, đúng → B18', async () => {
    const r = soldTonight();
    const checkouts = capture('POST', /\/actions\/check-out$/);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBillAt1930(user);
    const sum = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '19:30')
    ).data;
    const fee = sum.lateFeeAsNightVnd!;
    expect(fee).toBeGreaterThan(0);
    expect(sum.extraNightAvailable).toBe(false);
    // The server's due includes the fee, never the unsold night.
    expect(sum.amountDueAtCheckoutVnd).toBe(sum.balanceDueVnd + fee);
    expect(
      await screen.findByText(tv('co.late_fee_as_night_body', { amount: money(fee) })),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tv('co.late_fee_as_night_line', { amount: money(fee) })),
    ).toBeInTheDocument();
    const balanceRow = screen.getByRole('row', {
      name: new RegExp(`^${tv('checkout.summary.balance')}\\s*\\d`),
    });
    await waitFor(() => expect(num(balanceRow.textContent ?? '')).toBe(sum.amountDueAtCheckoutVnd));
    expect(
      screen.queryByLabelText(new RegExp(`^${tv('checkout.extra_night_rate_label')}`)),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    const box = await lateFeeBox(fee);
    // SEC FE-08: no username/password pair a browser would save or fill.
    const secret = within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_secret'))}`));
    expect(secret).toHaveAttribute('type', 'password');
    expect(secret).toHaveAttribute('autocomplete', 'new-password');
    expect(secret.closest('form')).toBeNull();
    const who = within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_approver'))}`));
    expect(who).not.toHaveAttribute('name', 'username');
    expect(who).toHaveAttribute('autocomplete', 'off');
    expect(who).toHaveAttribute('maxlength', '100');
    const locked = screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ });
    expect(locked).toHaveAttribute('aria-disabled', 'true');
    expect(locked).toHaveAccessibleDescription(tv('co.late_fee_needs_confirm'));

    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_reason'))}`)),
      'Khách rời 19:30, căn đã bán đêm nay',
    );
    // Optional waiver applied by the confirming manager (no separate approval): 50 %.
    await user.click(within(box).getByRole('switch', { name: tv('co.late_fee_foc') }));
    await user.click(within(box).getByRole('radio', { name: tv('foc.r_recovery') }));
    const half = fee / 2;
    fireEvent.change(within(box).getByLabelText(new RegExp(`^${esc(tv('foc.amount'))}`)), {
      target: { value: dots(half) },
    });
    // What the manager allows, right above the password: fee, waiver, what the guest pays for it.
    const allows = within(box).getByLabelText(tv('co.late_fee_sum_title'));
    expect(allows).toHaveTextContent(money(fee));
    expect(allows).toHaveTextContent(`− ${money(half)}`);
    expect(allows.textContent).toContain(`${tv('co.late_fee_sum_guest')}${money(fee - half)}`);
    await waitFor(() =>
      expect(num(balanceRow.textContent ?? '')).toBe(sum.amountDueAtCheckoutVnd! - half),
    );

    // The guest pays what is left (cash) – the fee is posted by B18, so this is no credit to refund.
    await user.click(await screen.findByRole('button', { name: tv('pay.cash') }));
    await user.click(screen.getByRole('button', { name: /^Ghi nhận đã thu/ }));
    await waitFor(() => expect(num(balanceRow.textContent ?? '')).toBe(0));
    expect(screen.queryByText(tv('checkout.overpay.needs_reason'))).not.toBeInTheDocument();

    await user.type(who, 'qa.mgr');
    await user.type(secret, 'not-the-password');
    await user.click(screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
    // 401: one sentence – never "wrong name" vs "wrong password"; the password is cleared.
    expect((await screen.findAllByText(tv('co.late_fee_auth_failed'))).length).toBeGreaterThan(0);
    expect(screen.queryByText(tv('error.REAUTH_FAILED'))).not.toBeInTheDocument();
    expect(secret).toHaveValue('');
    expect(res('Phạm Huy').status).toBe('in_house');

    await user.type(secret, MOCK_PASSWORD);
    await user.click(screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    checkouts.stop();
    const body = checkouts.sent.at(-1)!;
    expect(body.extraNight).toBeUndefined();
    expect(body.lateFeeInsteadOfNight).toMatchObject({
      amountVnd: fee,
      reason: 'Khách rời 19:30, căn đã bán đêm nay',
      approverUsername: 'qa.mgr',
      authMethod: 'password',
      requestFoc: { kind: 'foc', amountVnd: half, reasonCode: 'service_recovery' },
    });
    expect(body.lateFeeInsteadOfNight).not.toHaveProperty('requestFoc.secret');
    const f = mockControl.stay.folios.get(r.folioId)!;
    const feeLine = f.lines.find((l) => l.chargeCode === 'late_fee_as_night')!;
    expect(feeLine).toMatchObject({ category: 'late_checkout', amountVnd: fee });
    expect(f.lines.some((l) => l.relatedLineId === feeLine.id && l.amountVnd === -half)).toBe(true);
    expect(f.lines.some((l) => l.description === 'extra_night')).toBe(false);
  });

  it('MGR tự xác nhận (bỏ trống tên): QR check_out gửi lateFeeAsNight, không gửi giá đêm thêm; B18 không có approverUsername', async () => {
    const r = soldTonight();
    const qrs = capture('POST', /\/vietqr$/);
    const checkouts = capture('POST', /\/actions\/check-out$/);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.mgr');
    await toBillAt1930(user);
    const sum = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '19:30')
    ).data;
    const fee = sum.lateFeeAsNightVnd!;
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
    const box = await lateFeeBox(fee);
    const who = within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_approver'))}`));
    expect(who).not.toBeRequired();
    expect(who).toHaveAccessibleDescription(tv('co.late_fee_approver_self'));
    await user.click(
      await screen.findByRole('button', {
        name: tv('pay.vietqr_create', { amount: money(sum.amountDueAtCheckoutVnd!) }),
      }),
    );
    await waitFor(() => expect(qrs.sent.length).toBe(1));
    expect(qrs.sent[0]).toMatchObject({
      purpose: 'check_out',
      lateFeeAsNight: true,
      amountVnd: sum.amountDueAtCheckoutVnd,
    });
    expect(qrs.sent[0]!.extraNightRateVnd).toBeUndefined();
    expect(String(qrs.sent[0]!.checkoutAt)).toMatch(/T19:30:00\+07:00$/);
    await user.click(
      screen.getByRole('button', {
        name: tv('pay.record', { amount: money(sum.amountDueAtCheckoutVnd!) }),
      }),
    );
    const balanceRow = screen.getByRole('row', {
      name: new RegExp(`^${tv('checkout.summary.balance')}\\s*\\d`),
    });
    await waitFor(() => expect(num(balanceRow.textContent ?? '')).toBe(0));
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_reason'))}`)),
      'Khách về muộn',
    );
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_secret'))}`)),
      MOCK_PASSWORD,
    );
    await user.click(screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    qrs.stop();
    checkouts.stop();
    const lf = checkouts.sent.at(-1)!.lateFeeInsteadOfNight as Record<string, unknown>;
    expect(lf).toMatchObject({ amountVnd: fee, reason: 'Khách về muộn', authMethod: 'password' });
    expect(lf.approverUsername).toBeUndefined();
    expect(lf.requestFoc).toBeUndefined();
  });

  it('429 (khóa tạm sau nhiều lần sai) → nói rõ là khóa tạm, không lộ gì về tên', async () => {
    const r = soldTonight();
    const fd = mockControl.db.users.find((u) => u.username === 'qa.fd')!;
    mockControl.stay.lateFeeFails.set(fd.id, 5);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBillAt1930(user);
    const fee = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '19:30')
    ).data.lateFeeAsNightVnd!;
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
    const box = await lateFeeBox(fee);
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_reason'))}`)),
      'Khách về muộn',
    );
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_approver'))}`)),
      'qa.mgr',
    );
    const secret = within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_secret'))}`));
    await user.type(secret, MOCK_PASSWORD);
    await user.click(screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
    expect(
      (await screen.findAllByText(tv('co.late_fee_locked', { minutes: 15 }))).length,
    ).toBeGreaterThan(0);
    expect(secret).toHaveValue('');
    expect(res('Phạm Huy').status).toBe('in_house');
  });

  it('đóng hộp (về bước trước) xóa mật khẩu đã gõ', async () => {
    const r = soldTonight();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBillAt1930(user);
    const fee = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '19:30')
    ).data.lateFeeAsNightVnd!;
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
    let box = await lateFeeBox(fee);
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_secret'))}`)),
      'typed-secret',
    );
    await user.click(screen.getByRole('button', { name: tv('common.back') }));
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
    box = await lateFeeBox(fee);
    expect(within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_secret'))}`))).toHaveValue(
      '',
    );
  });
});

describe('DOM (f) – xác nhận VietQR vượt số còn phải thu: ghi chú bắt buộc', () => {
  it('H16: tiền đã thu thêm trong lúc chờ QR → 422 REASON_REQUIRED (max) → cảnh báo vượt, ghi chú rồi mới xác nhận', async () => {
    at('11:00');
    const r = res('Phạm Huy');
    mockControl.stay.minibarChecks.set(r.id, []);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
    const due = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '11:00')
    ).data.amountDueAtCheckoutVnd!;
    expect(due).toBeGreaterThan(100_000);
    await user.click(
      await screen.findByRole('button', { name: tv('pay.vietqr_create', { amount: money(due) }) }),
    );
    const record = await screen.findByRole('button', {
      name: tv('pay.record', { amount: money(due) }),
    });
    // Meanwhile 100.000 đ was taken in cash elsewhere.
    mockControl.stay.payments.push({
      id: 'p-f',
      code: 'PT-F',
      folioId: r.folioId,
      type: 'charge',
      method: 'cash',
      amountVnd: 100_000,
      status: 'succeeded',
      reconciliation: 'not_required',
      version: 1,
    });
    await user.click(record);
    const over = tv('pay.qr_over_note', { amount: money(due), max: money(due - 100_000) });
    expect(await screen.findByText(over)).toBeInTheDocument();
    const note = screen.getByLabelText(new RegExp(`^${esc(tv('co.txn_ref'))}`));
    expect(note).toBeRequired();
    const waiting = mockControl.stay.payments.find(
      (p) => p.method === 'vietqr' && p.folioId === r.folioId,
    )!;
    expect(waiting.status).toBe('pending');
    await user.type(note, 'Khách chuyển đủ sau khi đã trả 100.000 tiền mặt');
    await user.click(
      screen.getByRole('button', { name: tv('pay.record', { amount: money(due) }) }),
    );
    await waitFor(() => expect(waiting.status).toBe('succeeded'));
    expect(waiting.note).toBe('Khách chuyển đủ sau khi đã trả 100.000 tiền mặt');
  });

  it('H13: QR nhận phòng tạo trước còn chờ, số tiền > amountDueNowVnd → hiện mã đang chờ, cảnh báo vượt, ghi chú bắt buộc', async () => {
    at('15:00');
    const r = res('Gia đình anh Hưng');
    const due = r.balanceDueVnd!;
    mockControl.stay.payments.push({
      id: 'p-qr-early',
      code: 'PT-QR1',
      folioId: r.folioId,
      reservationCode: r.code,
      type: 'charge',
      method: 'vietqr',
      amountVnd: due + 300_000,
      status: 'pending',
      reconciliation: 'pending',
      expiresAt: `${todayLocal()}T23:00:00+07:00`,
      qrPurpose: 'check_in',
      qrContext: { checkinTime: '14:00' },
      version: 1,
    });
    const { user } = renderApp(`/reservations/${r.id}/check-in`, 'qa.fd');
    await screen.findByRole('heading', { name: /Nhận phòng/ });
    await user.click(await screen.findByRole('button', { name: tv('ci.go_verify') }));
    await user.click(await screen.findByRole('button', { name: tv('ci.go_register') }));
    await user.click(await screen.findByRole('button', { name: tv('reg.later') }));
    expect(
      await screen.findByText(
        new RegExp(
          `^${esc(tv('pay.qr_pending_earlier', { amount: money(due + 300_000), time: '§' })).replace('§', '.+')}$`,
        ),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tv('pay.qr_over_note', { amount: money(due + 300_000), max: money(due) })),
    ).toBeInTheDocument();
    const note = screen.getByLabelText(new RegExp(`^${esc(tv('co.txn_ref'))}`));
    expect(note).toBeRequired();
    const record = screen.getByRole('button', {
      name: tv('pay.record', { amount: money(due + 300_000) }),
    });
    await user.click(record);
    const p = mockControl.stay.payments.find((x) => x.id === 'p-qr-early')!;
    expect(p.status).toBe('pending');
    await user.type(note, 'Khách chuyển dư 300.000');
    await user.click(record);
    await waitFor(() => expect(p.status).toBe('succeeded'));
    expect(p.note).toBe('Khách chuyển dư 300.000');
  });
});

describe('DOM (e) / M-1 – minibar theo tủ (lượt × căn)', () => {
  it('sau B14 còn tủ căn cũ chưa đếm: đếm tủ căn cũ trước (roomId), rồi tủ căn đang ở, rồi sang bước 2', async () => {
    at('11:00');
    const r = res('Phạm Huy');
    mockControl.stay.minibarOldRooms.set(r.id, [{ roomId: 'room-old-202', roomNo: '202' }]);
    const counts = capture('POST', /\/minibar-checks$/);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    const group = await screen.findByRole('group', { name: tv('co.minibar_cabinet') });
    const old = within(group).getByRole('button', {
      name: tv('co.minibar_cabinet_old', { room: '202' }),
    });
    const here = within(group).getByRole('button', {
      name: tv('co.minibar_cabinet_room', { room: '201' }),
    });
    await waitFor(() => expect(old).toHaveAttribute('aria-pressed', 'true'));
    await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
    await waitFor(() => expect(counts.sent.length).toBe(1));
    expect(counts.sent[0]).toMatchObject({ mode: 'checkout', roomId: 'room-old-202' });
    await waitFor(() => expect(here).toHaveAttribute('aria-pressed', 'true'));
    await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
    await waitFor(() => expect(counts.sent.length).toBe(2));
    counts.stop();
    // K11-03: the cabinet of today is named too (never "absent = the room assigned now").
    expect(counts.sent[1]!.roomId).toBe(r.segments![0]!.roomId);
    expect(
      await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))),
    ).toBeInTheDocument();
    expect(mockControl.stay.minibarOldRooms.get(r.id)![0]!.lines).toBeDefined();
    expect(mockControl.stay.minibarChecks.has(r.id)).toBe(true);
  });

  it('folio đã sửa sau lần đếm (adjustedAfterLastCheck): cảnh báo, mặc định điền theo folio → máy chủ giữ dòng đã sửa', async () => {
    at('11:00');
    const r = res('Phạm Huy');
    const coke = MINIBAR[0]!;
    // Last count: 2 used (0 left); the desk then corrected the folio line to 1 (with a reason).
    mockControl.stay.minibarChecks.set(
      r.id,
      MINIBAR.map((m) => ({
        itemId: m.itemId,
        remainingQty: m.itemId === coke.itemId ? 0 : m.standardQty,
      })),
    );
    mockControl.stay.folios.get(r.folioId)!.lines.push({
      id: 'line-coke-1',
      category: 'minibar',
      description: `minibar ${coke.itemName} x1`,
      quantity: 1,
      unitPriceVnd: coke.unitPriceVnd,
      amountVnd: coke.unitPriceVnd,
      lineState: 'posted',
      chargeCode: coke.itemId,
      postedAt: new Date().toISOString(),
    });
    const counts = capture('POST', /\/minibar-checks$/);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    expect(await screen.findByText(tv('co.minibar_folio_adjusted'))).toBeInTheDocument();
    expect(
      screen.getByText(
        tv('co.minibar_folio_vs_count', { item: coke.itemName, folio: 1, count: 2 }),
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: tv('co.go_extras') }));
    await waitFor(() => expect(counts.sent.length).toBe(1));
    counts.stop();
    const lines = counts.sent[0]!.lines as Array<{ itemId: string; remainingQty: number }>;
    expect(lines.find((l) => l.itemId === coke.itemId)!.remainingQty).toBe(coke.standardQty - 1);
    // R6: the corrected line stays (same id, same amount) – no new count.
    const f = mockControl.stay.folios.get(r.folioId)!;
    const live = f.lines.filter((l) => l.category === 'minibar' && l.chargeCode === coke.itemId);
    expect(live).toHaveLength(1);
    expect(live[0]).toMatchObject({ id: 'line-coke-1', amountVnd: coke.unitPriceVnd });
  });
});
