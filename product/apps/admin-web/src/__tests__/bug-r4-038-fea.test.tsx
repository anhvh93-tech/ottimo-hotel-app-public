// v1.0.4 (FE-A) – BUG-R4-038 on the desk (BE #71, BR-421 R4). An Internal stay leaving after the last late tier while
// the night of departure is sold: its night is 0 ₫, so the server's one-night late fee is 0 (`lateFeeAsNightVnd = 0`)
// – nothing to charge, no line, no manager confirmation, and `lateFeeInsteadOfNight` is refused (422 NOT_ALLOWED).
// H16 used to lock "Hoàn tất" there (`extraUnavailable && !lateFeeMode`, the fee mode needing a fee above 0): the
// Internal stay could not check out. Other channels keep the fee and its confirmation.
import { newIdempotencyKey } from '@ottimo/api-client';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, setCsrfToken } from '../app/api';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { PROPERTY_ID } from '../mocks/seed';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const num = (s: string) => Number(s.replace(/\D/g, ''));
afterEach(() => vi.useRealTimers());

/** Every B18 call: the body as the browser sent it. */
function captureCheckouts() {
  const sent: Array<Record<string, unknown>> = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== 'POST' || !/\/actions\/check-out$/.test(new URL(request.url).pathname))
      return;
    void request
      .clone()
      .json()
      .then((b: Record<string, unknown>) => sent.push(b));
  };
  server.events.on('request:start', on);
  return { sent, stop: () => server.events.removeListener('request:start', on) };
}

/**
 * Phạm Huy (201) leaves at 19:30 while "Gia đình anh Hưng" arrives in 201 tonight – the extra night cannot be sold.
 * `internal`: his booking is on the Internal channel (BR-421).
 */
function soldTonight(internal: boolean) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T19:40:00+07:00`));
  const r = res('Phạm Huy');
  if (internal) {
    const ch = mockControl.rsv.channels.find((c) => c.code === 'internal')!;
    r.channelId = ch.id;
    r.channelCode = ch.code;
  }
  const next = res('Gia đình anh Hưng');
  next.roomId = r.roomId;
  next.arrivalDate = r.departureDate;
  mockControl.stay.minibarChecks.set(r.id, []);
  mockControl.signInAs('qa.fd');
  setCsrfToken(mockControl.db.csrf);
  return r;
}

const summaryAt = async (reservationId: string, time: string) =>
  (await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId }, time)).data;

async function toBill(user: ReturnType<typeof renderApp>['user']) {
  await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
  fireEvent.change(await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))), {
    target: { value: '19:30' },
  });
  await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
}

const balanceRow = () =>
  screen.getByRole('row', { name: new RegExp(`^${tv('checkout.summary.balance')}\\s*\\d`) });

async function payCash(user: ReturnType<typeof renderApp>['user']) {
  await user.click(await screen.findByRole('button', { name: tv('pay.cash') }));
  await user.click(screen.getByRole('button', { name: /^Ghi nhận đã thu/ }));
  await waitFor(() => expect(num(balanceRow().textContent ?? '')).toBe(0));
}

const completeButton = () => screen.getByRole('button', { name: /hoàn tất|Hoàn tất/ });

describe('BUG-R4-038 – H16: an Internal stay leaving after the last tier on a sold night', () => {
  it('fee 0: "Hoàn tất" not locked, no confirmation box, B18 without `lateFeeInsteadOfNight` / `extraNight`, no line', async () => {
    mockControl.db.mfaEnforced = true;
    const r = soldTonight(true);
    const s = await summaryAt(r.id, '19:30');
    expect(s).toMatchObject({
      extraNightRequired: true,
      extraNightAvailable: false,
      lateFeeAsNightVnd: 0,
    });
    const checkouts = captureCheckouts();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    fireEvent.change(await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))), {
      target: { value: '19:30' },
    });
    // Step 2: said once (the summary), never the "cannot check out" alert.
    await waitFor(() =>
      expect(screen.getAllByText(tv('checkout.due_without_extra_night'))).toHaveLength(1),
    );
    expect(screen.queryByText(tv('checkout.extra_night_unavailable'))).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));

    // Step 3: no one-night late fee box (no reason, no manager), the server's due.
    await screen.findByRole('button', { name: tv('pay.cash') });
    expect(
      screen.queryByRole('heading', { name: tv('co.late_fee_pr_title', { amount: money(0) }) }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: tv('co.late_fee_mode') })).not.toBeInTheDocument();
    expect(num(balanceRow().textContent ?? '')).toBe(s.amountDueAtCheckoutVnd);
    expect(completeButton()).not.toHaveAccessibleDescription(
      tv('checkout.extra_night_unavailable'),
    );
    if ((s.amountDueAtCheckoutVnd ?? 0) > 0) await payCash(user);
    expect(completeButton()).not.toHaveAttribute('aria-disabled', 'true');

    await user.click(completeButton());
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getAllByRole('button')[1]!);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    checkouts.stop();
    const body = checkouts.sent.at(-1)!;
    expect(body).not.toHaveProperty('lateFeeInsteadOfNight');
    expect(body).not.toHaveProperty('extraNight');
    const f = mockControl.stay.folios.get(r.folioId)!;
    expect(f.lines.some((l) => l.chargeCode === 'late_fee_as_night')).toBe(false);
    expect(f.lines.some((l) => l.description === 'extra_night')).toBe(false);
  });

  it("a late charge from earlier (B15 15:00) that B18 takes back: the desk collects the server's due, not the folio balance", async () => {
    const r = soldTonight(true);
    const R = { propertyId: PROPERTY_ID, reservationId: r.id };
    mockControl.signInAs('qa.mgr');
    setCsrfToken(mockControl.db.csrf);
    const pre = (await api.setLateCheckout(R, { checkoutTime: '15:00', dryRun: true })).data;
    const late = (pre as { surchargeVnd: number }).surchargeVnd;
    expect(late).toBeGreaterThan(0);
    await api.setLateCheckout(
      R,
      { checkoutTime: '15:00', applySurcharge: true, expectedSurchargeVnd: late },
      res('Phạm Huy').version,
      newIdempotencyKey(),
    );
    const s = await summaryAt(r.id, '19:30');
    expect(s.lateFeeAsNightVnd).toBe(0);
    // The server's due no longer counts the 15:00 charge; the folio balance still does.
    expect(s.amountDueAtCheckoutVnd).toBe(Math.max(0, (s.balanceDueVnd ?? 0) - late));

    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    await screen.findByRole('button', { name: tv('pay.cash') });
    await waitFor(() => expect(num(balanceRow().textContent ?? '')).toBe(s.amountDueAtCheckoutVnd));
    if ((s.amountDueAtCheckoutVnd ?? 0) > 0) await payCash(user);
    await user.click(completeButton());
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getAllByRole('button')[1]!);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    // Nothing collected above what was owed: the late charge is taken back, no credit left with the guest.
    const f = mockControl.stay.folios.get(r.folioId)!;
    expect(f.lines.some((l) => l.category === 'late_checkout' && l.lineState === 'posted')).toBe(
      false,
    );
    const after = (await api.getFolio({ propertyId: PROPERTY_ID, folioId: r.folioId })).data.totals;
    expect(after.balanceDueVnd).toBe(0);
    expect(after.creditVnd).toBe(0);
  });

  it('control – Direct: the one-night fee above 0 still needs its record ("Hoàn tất" locked until the reason)', async () => {
    mockControl.db.mfaEnforced = true;
    const r = soldTonight(false);
    const fee = (await summaryAt(r.id, '19:30')).lateFeeAsNightVnd!;
    expect(fee).toBeGreaterThan(0);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await toBill(user);
    expect(
      await screen.findByRole('heading', {
        name: tv('co.late_fee_pr_title', { amount: money(fee) }),
      }),
    ).toBeInTheDocument();
    expect(completeButton()).toHaveAttribute('aria-disabled', 'true');
    expect(completeButton()).toHaveAccessibleDescription(tv('co.late_fee_pr_needs'));
  });
});
