import { ApiError } from '@ottimo/api-client';
import { hasKey } from '@ottimo/i18n';
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  AFTER_CLOSURE_RECORDING_ON_DESK,
  closedBookingPaymentText,
  closedBookingSentence,
  closedReservationStatus,
  rsvErrorText,
} from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

/**
 * V5-48 Desk (OpenAPI 0.3.13 add. 1, SEC B002-01, UXD copy-v1.0.5 9.1a): `confirmPaymentReceived` / `createVietQr`
 * on a booking already cancelled / no-show answer 409 INVALID_TRANSITION with `reservationStatus` (the BOOKING's;
 * `currentState` is the payment's). The deposit box says what to do with the money – never "reload", never "the QR
 * expired, record it by hand" – and confirms nothing more.
 */
const rsvOf = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const qrOf = (folioId: string) =>
  mockControl.stay.payments.find((p) => p.folioId === folioId && p.method === 'vietqr')!;
const closedFd = (status: 'cancelled' | 'no_show') =>
  tv('error.closed_booking_payment_no_5b1', { status: tv(`status.booking.${status}`) });

const writes: string[] = [];
const onStart = ({ request }: { request: Request }) => {
  if (request.method === 'POST') writes.push(new URL(request.url).pathname);
};
afterEach(() => {
  server.events.removeListener('request:start', onStart);
});

async function openDeposit(user: ReturnType<typeof renderApp>['user']) {
  const d = await screen.findByRole('dialog', { name: 'Lê Minh' });
  await user.click(within(d).getByRole('button', { name: tv('rsv.deposit_submit') }));
  return screen.findByRole('dialog', {
    name: tv('rsv.deposit_title', { code: rsvOf('Lê Minh').code }),
  });
}

const t = (key: string, args?: Record<string, unknown>) => tv(key, args as never);
const conflict = (body: Record<string, unknown>) =>
  new ApiError(409, { code: 'INVALID_TRANSITION', ...body } as never);

describe('V5-48 – which sentence (UXD 9.1a)', () => {
  it('reservationStatus is read before currentState; only cancelled / no_show count', () => {
    expect(
      closedReservationStatus(
        conflict({ currentState: 'expired', reservationStatus: 'cancelled' }),
      ),
    ).toBe('cancelled');
    expect(closedReservationStatus(conflict({ reservationStatus: 'no_show' }))).toBe('no_show');
    // an older server (no field), an unknown value, another code → not this case
    expect(closedReservationStatus(conflict({ currentState: 'expired' }))).toBeUndefined();
    expect(closedReservationStatus(conflict({ reservationStatus: 'checked_out' }))).toBeUndefined();
    expect(
      closedReservationStatus(
        new ApiError(409, {
          code: 'PAYMENT_NOT_CONFIGURED',
          reservationStatus: 'cancelled',
        } as never),
      ),
    ).toBeUndefined();
  });

  it('FD+ before 5B-1 → sheet 2a; with the 5B-1 button → the button; SAL/CTV → tell the front desk', () => {
    expect(closedBookingSentence(t, 'cancelled', false)).toBe(closedFd('cancelled'));
    expect(closedBookingSentence(t, 'no_show', false, true)).toBe(
      tv('error.closed_booking_payment', { status: tv('status.booking.no_show') }),
    );
    expect(closedBookingSentence(t, 'cancelled', true)).toBe(
      tv('error.closed_booking_payment_sales', { status: tv('status.booking.cancelled') }),
    );
    // the sales sentence never points to a button or sheet the sale does not have
    expect(closedBookingSentence(t, 'cancelled', true, true)).toBe(
      tv('error.closed_booking_payment_sales', { status: tv('status.booking.cancelled') }),
    );
  });

  it('rsvErrorText: the closed-booking sentence instead of "reload"; without reservationStatus nothing changes', () => {
    const e = conflict({ currentState: 'pending', reservationStatus: 'no_show' });
    expect(rsvErrorText(t, e)).toBe(closedFd('no_show'));
    expect(rsvErrorText(t, e, { salesOnly: true })).toBe(
      tv('error.closed_booking_payment_sales', { status: tv('status.booking.no_show') }),
    );
    expect(closedBookingPaymentText(t, conflict({ currentState: 'cancelled' }), false)).toBeNull();
    expect(rsvErrorText(t, conflict({ currentState: 'cancelled' }))).toBe(
      tv('rsv.transition_changed', { status: tv('status.booking.cancelled') }),
    );
  });
});

describe('V5-48 – Xác nhận cọc on a booking that closed under the box', () => {
  it('QR confirm after J1 cancelled the hold (its QR expired with it): 9.1a sentence, not "QR expired"; nothing more is sent', async () => {
    const r = rsvOf('Lê Minh');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const dlg = await openDeposit(user);
    await user.click(await within(dlg).findByRole('button', { name: /^Tạo VietQR/ }));
    await within(dlg).findByRole('img', { name: /nội dung OTM0146$/ });
    // J1 at the deadline (server): the hold is cancelled and its pending QR expires in the same transaction.
    r.status = 'cancelled';
    qrOf(r.folioId).status = 'expired';
    writes.length = 0;
    server.events.on('request:start', onStart);
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    expect(await within(dlg).findByText(closedFd('cancelled'))).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('dep.qr_expired'))).toBeNull();
    expect(
      within(dlg).queryByText(
        tv('rsv.transition_changed', { status: tv('status.booking.cancelled') }),
      ),
    ).toBeNull();
    // the QR is gone, the main button is locked: a second press cannot record it as a manual transfer
    expect(within(dlg).queryByRole('img', { name: /nội dung OTM0146$/ })).toBeNull();
    expect(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') })).toBeDisabled();
    // one write: the QR confirm the server refused – no B4, no manual payment
    expect(writes).toEqual([expect.stringMatching(/\/actions\/confirm-received$/)]);
    expect(qrOf(r.folioId).status).toBe('expired');
    // the drawer behind reads the closed booking
    await waitFor(() =>
      expect(screen.getAllByText(tv('status.booking.cancelled')).length).toBeGreaterThan(0),
    );
  });

  it('new VietQR on a booking marked no-show meanwhile: 9.1a sentence with "Không đến", no Try again, nothing to confirm', async () => {
    const r = rsvOf('Lê Minh');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const dlg = await openDeposit(user);
    const create = await within(dlg).findByRole('button', { name: /^Tạo VietQR/ });
    r.status = 'no_show';
    const before = mockControl.stay.payments.length;
    await user.click(create);
    expect(await within(dlg).findByText(closedFd('no_show'))).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('dep.qr_failed'))).toBeNull();
    expect(within(dlg).queryByRole('button', { name: tv('common.retry') })).toBeNull();
    expect(within(dlg).queryByRole('button', { name: /^Tạo VietQR/ })).toBeNull();
    expect(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') })).toBeDisabled();
    // one sentence, not the same one twice (box + QR block)
    expect(within(dlg).getAllByText(closedFd('no_show'))).toHaveLength(1);
    expect(mockControl.stay.payments.length).toBe(before);
  });

  it('an older server (409 expired without reservationStatus) keeps the v1.0.4 path: QR expired, record by hand', async () => {
    const r = rsvOf('Lê Minh');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const dlg = await openDeposit(user);
    await user.click(await within(dlg).findByRole('button', { name: /^Tạo VietQR/ }));
    await within(dlg).findByRole('img', { name: /nội dung OTM0146$/ });
    mockControl.failNext(/confirm-received/, 409, {
      code: 'INVALID_TRANSITION',
      currentState: 'expired',
    });
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    expect(await within(dlg).findByText(tv('dep.qr_expired'))).toBeInTheDocument();
    expect(within(dlg).queryByText(closedFd('cancelled'))).toBeNull();
    await waitFor(() =>
      expect(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') })).toBeEnabled(),
    );
  });
});

describe('V5-48 – B4 typed by hand on a booking that closed under the box (UXD 9.14 (c), FB-R5-UXD-FE-137-01..03)', () => {
  /** Another tab cancels the hold (B5): new version, booking closed. */
  const cancelElsewhere = (r: ReturnType<typeof rsvOf>, status: 'cancelled' | 'no_show') => {
    r.status = status;
    r.version += 1;
  };

  async function transfer(
    user: ReturnType<typeof renderApp>['user'],
    dlg: HTMLElement,
    amount = '500000',
  ) {
    await user.selectOptions(within(dlg).getByLabelText(tv('pay.method')), 'bank_transfer');
    const field = within(dlg).getByLabelText(/Số tiền đã nhận/);
    await user.clear(field);
    await user.type(field, amount);
  }

  /** The box locked on 9.1a: one sentence, focus on it, fields gone, "Đóng" not "Hủy", main button locked. */
  function expectLocked(dlg: HTMLElement, sentence: string) {
    expect(within(dlg).getAllByText(sentence)).toHaveLength(1);
    expect(document.activeElement).toHaveTextContent(sentence);
    expect(within(dlg).queryByText(tv('error.VERSION_CONFLICT'))).toBeNull();
    expect(
      within(dlg).queryByText(
        new RegExp(tv('rsv.transition_changed', { status: '' }).slice(0, 12)),
      ),
    ).toBeNull();
    expect(within(dlg).queryByRole('button', { name: tv('common.reload') })).toBeNull();
    expect(within(dlg).queryByLabelText(/Số tiền đã nhận/)).toBeNull();
    expect(within(dlg).queryByLabelText(tv('pay.method'))).toBeNull();
    expect(within(dlg).queryByRole('button', { name: tv('common.cancel') })).toBeNull();
    // footer "Đóng" beside the header close button
    expect(within(dlg).getAllByRole('button', { name: tv('common.close') })).toHaveLength(2);
    expect(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') })).toBeDisabled();
  }

  it('FD, transfer typed, the hold is cancelled in another tab → 412 then the reload shows it closed: 9.1a at once, no "Tải lại", box open', async () => {
    const r = rsvOf('Lê Minh');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const dlg = await openDeposit(user);
    await transfer(user, dlg);
    cancelElsewhere(r, 'cancelled');
    const paid = r.depositPaidVnd;
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    expect(await within(dlg).findByText(closedFd('cancelled'))).toBeInTheDocument();
    expectLocked(dlg, closedFd('cancelled'));
    // still open (never `onTransitionChanged`), nothing recorded
    expect(screen.getByRole('dialog', { name: tv('rsv.deposit_title', { code: r.code }) })).toBe(
      dlg,
    );
    expect(r.depositPaidVnd).toBe(paid);
  });

  it('FD, the 409 itself (version already fresh): `currentState` cancelled of B4 → 9.1a, not "Đơn vừa chuyển sang Đã hủy"', async () => {
    const r = rsvOf('Lê Minh');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const dlg = await openDeposit(user);
    await transfer(user, dlg);
    r.status = 'no_show'; // same version: the mock answers 409 INVALID_TRANSITION currentState no_show
    writes.length = 0;
    server.events.on('request:start', onStart);
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    expect(await within(dlg).findByText(closedFd('no_show'))).toBeInTheDocument();
    expectLocked(dlg, closedFd('no_show'));
    expect(writes.filter((w) => w.endsWith('/actions/confirm-deposit'))).toHaveLength(1);
  });

  it('sale (own hold): "Xác nhận đã nhận cọc" by hand on a cancelled hold → the new sales sentence ("xác nhận cọc")', async () => {
    const r = rsvOf('Lê Minh');
    r.createdBy = mockControl.db.users.find((u) => u.username === 'qa.sal')!.id;
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.sal');
    const dlg = await openDeposit(user);
    await transfer(user, dlg);
    cancelElsewhere(r, 'cancelled');
    await user.click(within(dlg).getByRole('button', { name: tv('rsv.deposit_submit') }));
    const sales = tv('error.closed_booking_payment_sales', {
      status: tv('status.booking.cancelled'),
    });
    expect(await within(dlg).findByText(sales)).toBeInTheDocument();
    expect(sales).toMatch(/xác nhận cọc/);
    expectLocked(dlg, sales);
  });

  it('a 412 on a booking still on hold keeps the v1.0.4 path ("Tải lại", input kept)', async () => {
    const r = rsvOf('Lê Minh');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const dlg = await openDeposit(user);
    await transfer(user, dlg, '200000');
    r.version += 1; // someone else saved the hold – still a hold
    await user.click(
      within(dlg).getByRole('button', { name: tv('rsv.record_partial', { amount: '200.000' }) }),
    );
    expect(
      await within(dlg).findByRole('button', { name: tv('common.reload') }),
    ).toBeInTheDocument();
    expect(within(dlg).queryByText(closedFd('cancelled'))).toBeNull();
    expect(within(dlg).getByLabelText(/Số tiền đã nhận/)).toHaveValue('200000');
  });

  it('ARC-137-01: `_no_5b1` exists exactly while the 5B-1 button is off – the PR that adds it flips both', () => {
    expect(hasKey('error.closed_booking_payment_no_5b1')).toBe(!AFTER_CLOSURE_RECORDING_ON_DESK);
    expect(hasKey('error.closed_booking_payment_no_5b1', 'en')).toBe(
      !AFTER_CLOSURE_RECORDING_ON_DESK,
    );
  });
});
