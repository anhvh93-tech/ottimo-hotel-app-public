// BUG-R3-017 (QA 26/10, P1 – before day D): H16 step 3, a one-night late fee (BR-416-06 / ESC-031) or an extra night is
// posted by B18 itself, so the folio owes less now than the bill shows; cash / POS card for it was refused by
// `recordPayment` (422 `note` REASON_REQUIRED – no note box for cash/card) and B18 then answered 409 BALANCE_DUE. Fix
// (FE only, contract 0.3.7 S4-47): cash / card above what the folio owes now goes with "Hoàn tất" as
// `checkOut.finalPayment` (server cap = due at check-out); up to the folio balance it is recorded at once as before.
import { isApiError, newIdempotencyKey } from '@ottimo/api-client';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../app/api';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { PROPERTY_ID } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const dots = (n: number) => n.toLocaleString('vi-VN');
const num = (s: string) => Number(s.replace(/\D/g, ''));
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const REASON = 'Rời 20:30, căn có khách đến tối nay';
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

/**
 * Phạm Huy (201) leaves at 20:30, the room is sold tonight (one-night late fee – ESC-031). `roomPaid`: the nights are
 * already paid (QA's case: the folio owes 0, the bill shows only the fee).
 */
function soldTonight(roomPaid: boolean) {
  at('20:35');
  mockControl.db.mfaEnforced = true;
  const r = res('Phạm Huy');
  const next = res('Gia đình anh Hưng');
  next.roomId = r.roomId;
  next.arrivalDate = r.departureDate;
  mockControl.stay.minibarChecks.set(r.id, []);
  if (roomPaid)
    mockControl.stay.payments.push({
      id: 'p-room-017',
      code: 'PT-017',
      folioId: r.folioId,
      type: 'charge',
      method: 'cash',
      amountVnd: 2_460_000,
      status: 'succeeded',
      reconciliation: 'not_required',
      version: 1,
    });
  return r;
}

async function toBill(user: ReturnType<typeof renderApp>['user']) {
  await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
  fireEvent.change(await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))), {
    target: { value: '20:30' },
  });
  await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
}

const balanceRow = () =>
  screen.getByRole('row', { name: new RegExp(`^${tv('checkout.summary.balance')}\\s*\\d`) });

async function giveReason(user: ReturnType<typeof renderApp>['user'], fee: number) {
  const box = (
    await screen.findByRole('heading', { name: tv('co.late_fee_pr_title', { amount: money(fee) }) })
  ).closest('section')!;
  await user.type(
    within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_reason'))}`)),
    REASON,
  );
}

const stagedText = (method: string, amount: number) =>
  tv('co.pay_at_complete', { method: tv(method), amount: money(amount) });

describe('BUG-R3-017 – thu tiền mặt/thẻ ở bước 3 cho khoản B18 mới ghi → gửi cùng Hoàn tất (finalPayment)', () => {
  it('máy chủ (mock như BE): ghi tiền vượt số folio đang nợ mà không ghi chú → 422 note REASON_REQUIRED', async () => {
    const r = soldTonight(true);
    // a signed-in Desk session (CSRF) first
    renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await screen.findByRole('button', { name: tv('co.go_extras') });
    const err = await api
      .recordPayment(
        { propertyId: PROPERTY_ID, folioId: r.folioId },
        { type: 'charge', method: 'cash', amountVnd: 708_000 },
        newIdempotencyKey(),
      )
      .catch((e: unknown) => e);
    expect(isApiError(err) ? [err.code, err.fieldErrors] : err).toEqual([
      'VALIDATION_FAILED',
      [{ field: 'note', code: 'REASON_REQUIRED' }],
    ]);
  });

  it('ESC-031, phòng đã trả: tiền mặt đúng số phụ thu → không gọi recordPayment; hiện "đã nhận", còn phải thu 0; Hoàn tất gửi finalPayment cash; trả phòng xong, folio có khoản thu', async () => {
    const r = soldTonight(true);
    const pays = capture('POST', /\/payments$/);
    const checkouts = capture('POST', /\/actions\/check-out$/);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const sum = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '20:30')
    ).data;
    const fee = sum.lateFeeAsNightVnd!;
    expect(sum.balanceDueVnd).toBe(0);
    await waitFor(() => expect(num(balanceRow().textContent ?? '')).toBe(fee));
    await giveReason(user, fee);

    await user.click(await screen.findByRole('button', { name: tv('pay.cash') }));
    fireEvent.change(screen.getByLabelText(new RegExp(`^${esc(tv('co.cash_received'))}`)), {
      target: { value: dots(1_000_000) },
    });
    await user.click(
      screen.getByRole('button', { name: tv('pay.record', { amount: money(fee) }) }),
    );
    expect(await screen.findByText(stagedText('pay.cash', fee))).toBeInTheDocument();
    expect(pays.sent).toHaveLength(0);
    await waitFor(() => expect(num(balanceRow().textContent ?? '')).toBe(0));
    expect(
      screen.getByRole('row', {
        name: new RegExp(`^${esc(tv('co.pay_at_complete_row', { method: tv('pay.cash') }))}`),
      }),
    ).toBeInTheDocument();

    const done = screen.getByRole('button', {
      name: tv('co.complete_paid', { amount: money(2_460_000 + fee) }),
    });
    expect(done).not.toHaveAttribute('aria-disabled');
    await user.click(done);
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText(
        tv('co.pay_at_complete_effect', { method: tv('pay.cash'), amount: money(fee) }),
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getAllByRole('button')[1]!);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    pays.stop();
    checkouts.stop();
    const body = checkouts.sent.at(-1)!;
    expect(body.finalPayment).toStrictEqual({ type: 'charge', method: 'cash', amountVnd: fee });
    // ESC-031 / SEC 8.6 unchanged: the late fee still carries exactly three fields.
    expect(body.lateFeeInsteadOfNight).toStrictEqual({
      amountVnd: fee,
      reason: REASON,
      postReview: true,
    });
    expect(pays.sent).toHaveLength(0);
    expect(
      mockControl.stay.payments.some(
        (p) => p.folioId === r.folioId && p.method === 'cash' && p.amountVnd === fee,
      ),
    ).toBe(true);
  });

  it('thẻ POS: cùng cách, finalPayment mang mã chuẩn chi (không số thẻ)', async () => {
    const r = soldTonight(true);
    const checkouts = capture('POST', /\/actions\/check-out$/);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const fee = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '20:30')
    ).data.lateFeeAsNightVnd!;
    await giveReason(user, fee);
    await user.click(await screen.findByRole('button', { name: tv('pay.card') }));
    await user.type(screen.getByLabelText(new RegExp(`^${esc(tv('co.pos_code'))}`)), 'A1B2C3');
    await user.click(
      screen.getByRole('button', { name: tv('pay.record', { amount: money(fee) }) }),
    );
    expect(await screen.findByText(stagedText('pay.card', fee))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    checkouts.stop();
    expect(checkouts.sent.at(-1)!.finalPayment).toStrictEqual({
      type: 'charge',
      method: 'card_pos',
      amountVnd: fee,
      posAuthCode: 'A1B2C3',
    });
  });

  it('phòng chưa trả: số ≤ folio đang nợ ghi ngay như cũ (recordPayment); phần phụ thu còn lại đi cùng Hoàn tất', async () => {
    const r = soldTonight(false);
    const pays = capture('POST', /\/payments$/);
    const checkouts = capture('POST', /\/actions\/check-out$/);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const fee = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '20:30')
    ).data.lateFeeAsNightVnd!;
    await giveReason(user, fee);
    // 1. the nights (what the folio owes now) – recorded at once
    await user.click(await screen.findByRole('button', { name: tv('pay.cash') }));
    const amount = screen.getByLabelText(new RegExp(`^${esc(tv('co.amount'))}\\s*\\*?$`));
    fireEvent.change(amount, { target: { value: dots(2_460_000) } });
    await user.click(
      screen.getByRole('button', { name: tv('pay.record', { amount: money(2_460_000) }) }),
    );
    await waitFor(() => expect(pays.sent).toHaveLength(1));
    await waitFor(() => expect(num(balanceRow().textContent ?? '')).toBe(fee));
    // 2. the fee – with "Hoàn tất"
    await user.click(screen.getByRole('button', { name: tv('pay.cash') }));
    await user.click(
      await screen.findByRole('button', { name: tv('pay.record', { amount: money(fee) }) }),
    );
    expect(await screen.findByText(stagedText('pay.cash', fee))).toBeInTheDocument();
    expect(pays.sent).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    pays.stop();
    checkouts.stop();
    expect(checkouts.sent.at(-1)!.finalPayment).toMatchObject({ method: 'cash', amountVnd: fee });
  });

  it('nhập quá số còn phải thu → báo ở ô, không nhận; số cần thu đổi sau khi đã nhận → báo, khóa Hoàn tất, "Bỏ" rồi nhập lại (khóa mới)', async () => {
    const r = soldTonight(true);
    const checkouts = capture('POST', /\/actions\/check-out$/);
    const keys: { keys: Array<string | null>; stop: () => void } = (() => {
      const list: Array<string | null> = [];
      const on = ({ request }: { request: Request }) => {
        if (
          request.method === 'POST' &&
          /\/actions\/check-out$/.test(new URL(request.url).pathname)
        )
          list.push(request.headers.get('idempotency-key'));
      };
      server.events.on('request:start', on);
      return { keys: list, stop: () => server.events.removeListener('request:start', on) };
    })();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const fee = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '20:30')
    ).data.lateFeeAsNightVnd!;
    await giveReason(user, fee);
    await user.click(await screen.findByRole('button', { name: tv('pay.cash') }));
    const amount = screen.getByLabelText(new RegExp(`^${esc(tv('co.amount'))}\\s*\\*?$`));
    fireEvent.change(amount, { target: { value: dots(fee + 50_000) } });
    await user.click(
      screen.getByRole('button', { name: tv('pay.record', { amount: money(fee + 50_000) }) }),
    );
    expect(amount).toHaveAccessibleDescription(
      new RegExp(esc(tv('co.pay_at_complete_over', { max: money(fee) }))),
    );
    expect(screen.queryByText(stagedText('pay.cash', fee + 50_000))).not.toBeInTheDocument();

    fireEvent.change(amount, { target: { value: dots(fee) } });
    await user.click(
      screen.getByRole('button', { name: tv('pay.record', { amount: money(fee) }) }),
    );
    await screen.findByText(stagedText('pay.cash', fee));
    // Meanwhile 300.000 was taken elsewhere (VietQR confirmed on another screen); B18 is refused and the figures are
    // read again – the cash waiting is now above what is due.
    mockControl.stay.payments.push({
      id: 'p-else-017',
      code: 'PT-E17',
      folioId: r.folioId,
      type: 'charge',
      method: 'vietqr',
      amountVnd: 300_000,
      status: 'succeeded',
      reconciliation: 'pending',
      version: 1,
    });
    await user.click(screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
    expect(
      await screen.findByText(tv('co.pay_at_complete_changed', { amount: money(fee) })),
    ).toBeInTheDocument();
    expect(res('Phạm Huy').status).toBe('in_house');
    const locked = screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ });
    expect(locked).toHaveAttribute('aria-disabled', 'true');
    expect(locked).toHaveAccessibleDescription(tv('co.pay_at_complete_needs'));
    await user.click(screen.getByRole('button', { name: tv('co.pay_at_complete_undo') }));
    expect(
      await screen.findByRole('button', {
        name: tv('pay.vietqr_create', { amount: money(fee - 300_000) }),
      }),
    ).toBeInTheDocument();
    // SEC FB-R3-SEC-FE-A-15: entered again at the new amount → a NEW command (other Idempotency-Key), new figure.
    await user.click(screen.getByRole('button', { name: tv('pay.cash') }));
    await user.click(
      await screen.findByRole('button', {
        name: tv('pay.record', { amount: money(fee - 300_000) }),
      }),
    );
    await screen.findByText(stagedText('pay.cash', fee - 300_000));
    await user.click(screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ }));
    await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    keys.stop();
    checkouts.stop();
    expect(keys.keys).toHaveLength(2);
    expect(keys.keys[0]).toBeTruthy();
    expect(keys.keys[1]).not.toBe(keys.keys[0]);
    expect(checkouts.sent[0]!.finalPayment).toMatchObject({ amountVnd: fee });
    expect(checkouts.sent[1]!.finalPayment).toMatchObject({
      method: 'cash',
      amountVnd: fee - 300_000,
    });
  });

  it('SEC FB-16: đang giữ khoản đã nhận → rời trang hỏi trước (không đồng ý thì ở lại); không lưu khoản vào trình duyệt', async () => {
    const r = soldTonight(true);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    const fee = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '20:30')
    ).data.lateFeeAsNightVnd!;
    await user.click(await screen.findByRole('button', { name: tv('pay.card') }));
    await user.type(screen.getByLabelText(new RegExp(`^${esc(tv('co.pos_code'))}`)), 'Z9Y8X7');
    await user.click(
      screen.getByRole('button', { name: tv('pay.record', { amount: money(fee) }) }),
    );
    await screen.findByText(stagedText('pay.card', fee));
    // An app link (sidebar) – asked, refused → still on the check-out.
    await user.click(screen.getAllByRole('link', { name: /Hôm nay/ })[0]!);
    expect(confirm).toHaveBeenCalledWith(tv('co.pay_at_complete_leave'));
    expect(screen.getByText(stagedText('pay.card', fee))).toBeInTheDocument();
    // Reload / close: the browser asks (beforeunload prevented).
    const ev = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    // Nothing of it in browser storage (the POS code above all).
    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(stored).not.toContain('Z9Y8X7');
    // Accepted → leaves.
    confirm.mockReturnValue(true);
    await user.click(screen.getAllByRole('link', { name: /Hôm nay/ })[0]!);
    await waitFor(() =>
      expect(screen.queryByText(stagedText('pay.card', fee))).not.toBeInTheDocument(),
    );
    confirm.mockRestore();
  });
});
