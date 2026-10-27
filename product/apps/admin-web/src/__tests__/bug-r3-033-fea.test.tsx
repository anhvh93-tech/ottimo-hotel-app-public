// BUG-R3-033 (QA 28/10, staging rc.3, P2): after "Hoàn tất" (B18 200) the Folio card of H16 still showed the estimate
// from before check-out – "Phụ thu trả muộn bằng giá 1 đêm (dự tính) 792.000 · Đã thu −792.000 · Còn phải thu
// 792.000 đ" – while the server's folio was `settled`, paid 1.584.000, due 0: the desk could collect twice.
// Fix: once B18 answers, the card reads the settled folio from the server (`getFolio`) – lines B18 posted, "Đã thu" and
// "Còn phải thu" as the server says; nothing kept from the summary or the cash staged on step 3.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../app/api';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
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

type User = ReturnType<typeof renderApp>['user'];

/** The H16 Folio card (`section` under the "Folio" heading). */
const folioCard = () =>
  screen.getByRole('heading', { name: tv('drawer.folio.title') }).closest('section')!;
const rowValue = (card: HTMLElement, key: string) =>
  num(
    within(card).getByRole('row', { name: new RegExp(`^${esc(tv(key))}\\s*[−+]?\\d`) })
      .textContent ?? '',
  );

/** Phạm Huy (201) leaves today; the nights are already paid in cash (the folio owes 0 before B18). */
function nightsPaid() {
  mockControl.db.mfaEnforced = true;
  const r = res('Phạm Huy');
  mockControl.stay.minibarChecks.set(r.id, []);
  mockControl.stay.payments.push({
    id: 'p-room-033',
    code: 'PT-033',
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

async function complete(user: User) {
  await user.click(await screen.findByRole('button', { name: /hoàn tất/i }));
  await user.click(within(await screen.findByRole('alertdialog')).getAllByRole('button')[1]!);
  expect(await screen.findByText(tv('checkout.done'), { selector: 'b' })).toBeInTheDocument();
}

/** What the server's folio says after B18 – the figures the card must show. */
async function serverFolio(folioId: string) {
  const f = (await api.getFolio({ propertyId: PROPERTY_ID, folioId })).data;
  expect(f.status).toBe('settled');
  return f;
}

describe('BUG-R3-033 – after B18 the Folio card shows the settled folio from the server', () => {
  it('ESC-031 postReview + cash on step 3 (QA OTM-00357): no "(dự tính)" row, paid = server, due 0', async () => {
    at('20:35');
    const r = nightsPaid();
    const next = res('Gia đình anh Hưng');
    next.roomId = r.roomId;
    next.arrivalDate = r.departureDate;
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    fireEvent.change(await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))), {
      target: { value: '20:30' },
    });
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
    const fee = (
      await api.getCheckoutSummary({ propertyId: PROPERTY_ID, reservationId: r.id }, '20:30')
    ).data.lateFeeAsNightVnd!;
    const box = (
      await screen.findByRole('heading', {
        name: tv('co.late_fee_pr_title', { amount: money(fee) }),
      })
    ).closest('section')!;
    await user.type(
      within(box).getByLabelText(new RegExp(`^${esc(tv('co.late_fee_reason'))}`)),
      REASON,
    );
    await user.click(await screen.findByRole('button', { name: tv('pay.cash') }));
    fireEvent.change(screen.getByLabelText(new RegExp(`^${esc(tv('co.cash_received'))}`)), {
      target: { value: dots(800_000) },
    });
    await user.click(
      screen.getByRole('button', { name: tv('pay.record', { amount: money(fee) }) }),
    );
    // Before B18: the estimate (fee row "dự tính", the cash staged for "Hoàn tất").
    expect(within(folioCard()).getByText(tv('co.late_fee_row'))).toBeInTheDocument();
    await complete(user);
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));

    const f = await serverFolio(r.folioId!);
    expect(f.totals.balanceDueVnd).toBe(0);
    expect(f.totals.paidVnd).toBe(2_460_000 + fee);
    const card = folioCard();
    await waitFor(() => expect(within(card).queryByText(tv('co.late_fee_row'))).toBeNull());
    expect(rowValue(card, 'drawer.folio.paid')).toBe(f.totals.paidVnd);
    expect(rowValue(card, 'checkout.summary.balance')).toBe(0);
    expect(
      within(card).queryByText(
        new RegExp(`^${esc(tv('co.pay_at_complete_row', { method: tv('pay.cash') }))}`),
      ),
    ).toBeNull();
    // Every line of the settled folio is listed – the fee B18 posted included.
    expect(within(card).getAllByRole('row').length).toBeGreaterThanOrEqual(f.lines.length + 2);
    expect(within(card).getByText(new RegExp(`${esc(dots(fee))}$`))).toBeInTheDocument();
  });

  it('plain check-out (no fee, nothing staged): the card is the server folio too', async () => {
    at('11:30');
    const r = nightsPaid();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
    await complete(user);
    const f = await serverFolio(r.folioId!);
    const card = folioCard();
    await waitFor(() => expect(rowValue(card, 'drawer.folio.paid')).toBe(f.totals.paidVnd));
    expect(rowValue(card, 'checkout.summary.balance')).toBe(f.totals.balanceDueVnd ?? 0);
  });

  it('the settled folio cannot be read → retry block, no stale "Còn phải thu"', async () => {
    at('11:30');
    const r = nightsPaid();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
    const getFolio = vi.spyOn(api, 'getFolio').mockRejectedValueOnce(new Error('offline'));
    await complete(user);
    const card = folioCard();
    expect(
      await within(card).findByRole('button', { name: tv('common.retry') }),
    ).toBeInTheDocument();
    expect(within(card).queryByRole('row')).toBeNull();
    getFolio.mockRestore();
    await user.click(within(card).getByRole('button', { name: tv('common.retry') }));
    await waitFor(() => expect(rowValue(card, 'checkout.summary.balance')).toBe(0));
  });
});
