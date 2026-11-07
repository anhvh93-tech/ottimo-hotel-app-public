// V5-12 / BUG-R4-052 (QA2 05/11) – H16 Trả phòng, bước Bill: "Tổng cộng" printed the folio total so far (`totalVnd`),
// without what B18 is about to post – while the folio table right under it shows those rows and "Còn phải thu" counts
// them. "Tổng cộng" is now the rows of that table, summed: the extra night at the rate in the box, the late surcharge
// at the time typed, the one-night late fee (ESC-031). Mock data only (Phạm Huy, 3 nights × 820.000, nothing paid).
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const money = (n: number) => tv('common.currency_vnd', { amount: n.toLocaleString('vi-VN') });
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};
afterEach(() => vi.useRealTimers());

const NIGHTS = 3 * 820_000; // the posted room lines

/**
 * Phạm Huy, minibar already counted; to the bill step with the time the guest left typed. `rate`: the extra night's
 * rate typed (the page waits for the server's due at that rate); `told`: a higher late surcharge is told to the guest
 * (ticked, written on the way to the bill – BR-414).
 */
async function toBill(time: string, { rate, told }: { rate?: string; told?: boolean } = {}) {
  const r = res('Phạm Huy');
  mockControl.stay.minibarChecks.set(r.id, []);
  const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
  await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
  fireEvent.change(await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))), {
    target: { value: time },
  });
  if (rate !== undefined)
    fireEvent.change(
      await screen.findByLabelText(new RegExp(`^${tv('checkout.extra_night_rate_label')}`)),
      { target: { value: rate } },
    );
  if (told)
    await user.click(
      await screen.findByRole('checkbox', { name: new RegExp(`^${esc(tv('ci.told_guest'))}`) }),
    );
  const go = await screen.findByRole('button', { name: tv('co.go_bill') });
  await waitFor(() => expect(go).not.toHaveAttribute('aria-disabled', 'true'));
  await user.click(go);
  return { r, user };
}

/** "Tổng cộng: …" of the bill card. */
const billTotal = () =>
  screen.getByText(new RegExp(`^${esc(tv('bill.total'))}:`)).textContent ?? '';

/** The charge rows of the folio table (not "Đã thu", a payment at "Hoàn tất", nor "Còn phải thu"), summed. */
function rowsSum() {
  const rows = Array.from(document.querySelectorAll('table.sum tbody tr')).filter(
    (tr) => !tr.classList.contains('sub') && !tr.classList.contains('total'),
  );
  return rows.reduce((a, tr) => {
    const cell = tr.querySelectorAll('td')[1]?.textContent ?? '';
    const n = Number(cell.replace(/\D/g, ''));
    return a + (/^[−-]/.test(cell.trim()) ? -n : n);
  }, 0);
}

describe('V5-12 – "Tổng cộng" of the bill step counts what B18 is about to post (BUG-R4-052)', () => {
  it('QA case: after the last tier (19:30) → the extra night at its default rate is in the total; = the rows, = "Còn phải thu" (nothing paid)', async () => {
    at('19:40');
    await toBill('19:30');
    await waitFor(() =>
      expect(billTotal()).toBe(`${tv('bill.total')}: ${money(NIGHTS + 708_000)}`),
    );
    expect(rowsSum()).toBe(NIGHTS + 708_000);
    expect(
      screen.getByRole('row', { name: new RegExp(`^${tv('checkout.summary.balance')}`) }),
    ).toHaveTextContent(money(NIGHTS + 708_000));
  });

  it('the desk types another rate for the extra night → the total follows the box (was 792.000 → 692.000 kept the old total)', async () => {
    at('19:40');
    await toBill('19:30', { rate: '600.000' });
    await waitFor(() =>
      expect(billTotal()).toBe(`${tv('bill.total')}: ${money(NIGHTS + 600_000)}`),
    );
    expect(rowsSum()).toBe(NIGHTS + 600_000);
  });

  it('a late surcharge at the time typed (14:00 · 30%) is in the total', async () => {
    at('14:10');
    await toBill('14:00', { told: true });
    await waitFor(() =>
      expect(billTotal()).toBe(`${tv('bill.total')}: ${money(NIGHTS + 212_000)}`),
    );
    expect(rowsSum()).toBe(NIGHTS + 212_000);
  });

  it('ESC-031, the room is sold tonight (20:30): the one-night late fee is in the total, no extra night', async () => {
    at('20:35');
    const r = res('Phạm Huy');
    const next = res('Gia đình anh Hưng');
    next.roomId = r.roomId;
    next.arrivalDate = r.departureDate;
    await toBill('20:30');
    await screen.findByText(tv('co.late_fee_row'));
    await waitFor(() =>
      expect(billTotal()).toBe(`${tv('bill.total')}: ${money(NIGHTS + 708_000)}`),
    );
    expect(rowsSum()).toBe(NIGHTS + 708_000);
    expect(
      screen.queryByText(new RegExp(`^${tv('bill.line.extra_night', { date: '.*' })}`)),
    ).toBeNull();
  });

  it('a late surcharge agreed earlier (B15, on the folio) that B18 reverses – the guest left at the standard time → the total drops it', async () => {
    at('11:40');
    const r = res('Phạm Huy');
    r.agreedCheckoutTime = '15:00';
    const f = mockControl.stay.folios.get(r.folioId)!;
    f.lines.push({
      ...f.lines[0]!,
      id: 'late-v5-12',
      category: 'late_checkout',
      description: 'late_checkout 15:00 30%',
      labelKey: undefined,
      labelParams: undefined,
      amountVnd: 212_000,
      unitPriceVnd: 212_000,
    } as (typeof f.lines)[number]);
    await toBill('11:30');
    await screen.findByText(tv('co.late_row_reversed'));
    // posted 2.672.000, the reversal −212.000 in the table → 2.460.000 (was 2.672.000)
    await waitFor(() => expect(billTotal()).toBe(`${tv('bill.total')}: ${money(NIGHTS)}`));
    expect(rowsSum()).toBe(NIGHTS);
  });

  it('at the standard time nothing is added – the total stays the posted lines', async () => {
    at('11:40');
    await toBill('11:30');
    await waitFor(() => expect(billTotal()).toBe(`${tv('bill.total')}: ${money(NIGHTS)}`));
    expect(rowsSum()).toBe(NIGHTS);
  });
});
