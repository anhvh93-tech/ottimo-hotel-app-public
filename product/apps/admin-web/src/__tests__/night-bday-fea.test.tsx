import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { serviceLinesOfFolio } from '../pages/reservations/ServiceLines';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

/**
 * QA 24/10 (night window, BUG-R2-211 follow-up): "today" of the Desk is the BUSINESS day (BR-010) – from 00:00 to
 * 05:59 it is still the day before. Clock pinned (only `Date`) at 02:40, 05:59, 06:00 of the calendar day D.
 * (1) a stay whose second segment starts exactly on D: every place that names "the room now" says last night's
 * room until 06:00; (2) the no-show box hints "đã thực hiện" by the server's rule (service day ≤ business day).
 */
const D = todayLocal();
const Y = addDays(D, -1);
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(`${D}T${hhmm}:00+07:00`));
};
afterEach(() => vi.useRealTimers());
const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const room = (no: string) => mockControl.db.rooms.find((r) => r.roomNo === no)!;
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Kim (in house, arrived D-1): 402 for the night of D-1, then 202 from D (a move booked ahead). */
function splitStay() {
  const kim = res('Kim Seo-yeon');
  const r402 = room('402');
  const r202 = room('202');
  kim.segments = [
    { roomId: r402.id, roomNo: '402', fromDate: kim.arrivalDate, toDate: D },
    { roomId: r202.id, roomNo: '202', fromDate: D, toDate: kim.departureDate },
  ];
  return kim;
}

describe('Segment boundary on D – the room of the business day', () => {
  it.each([
    ['02:40', '402'],
    ['05:59', '402'],
    ['06:00', '202'],
  ])('%s → "Đổi phòng" names room %s', async (hhmm, roomNo) => {
    at(hhmm);
    const kim = splitStay();
    const { user } = renderApp(`/reservations/${kim.id}`, 'qa.fd');
    const drawer = await screen.findByRole('dialog', { name: 'Kim Seo-yeon' });
    await user.click(
      await within(drawer).findByRole('button', { name: tv('drawer.action.change_room') }),
    );
    expect(
      await screen.findByRole('dialog', {
        name: new RegExp(
          `^${esc(tv('stay.change_title', { room: roomNo, guest: '§' }).split('§')[0]!)}`,
        ),
      }),
    ).toBeInTheDocument();
  });
});

describe('No-show box – "đã thực hiện" = service day ≤ business day (0.3.7 bổ sung 3, BR-309-09)', () => {
  const line = (id: string, serviceDate: string) => ({
    id,
    category: 'service_fee' as const,
    description: 'service_fee',
    quantity: 1,
    unitPriceVnd: 300_000,
    amountVnd: 300_000,
    lineState: 'posted' as const,
    postedAt: new Date().toISOString(),
    serviceDate,
  });
  const folioWith = (dates: string[]) =>
    ({
      lines: dates.map((d, i) => line(`l${i}`, d)),
    }) as unknown as Parameters<typeof serviceLinesOfFolio>[0];

  // Oracle DOM #12 (s1-money-oracle 6): pickup on the arrival day, tour the day after.
  it.each([
    ['02:40', Y],
    ['05:59', Y],
    ['06:00', D],
    ['23:10', D],
  ])(
    '%s (business day %s): pickup of the business day is "performed", the tour of the next day is not',
    (hhmm, day) => {
      at(hhmm);
      const lines = serviceLinesOfFolio(folioWith([day, addDays(day, 1)]), day);
      expect(lines.map((l) => l.performed)).toEqual([true, false]);
    },
  );

  it.each([
    ['06:00', D],
    ['23:10', D],
  ])('%s: the dialog shows the chip on the pickup of %s', async (hhmm, day) => {
    at(hhmm);
    mockControl.db.params.push({
      key: 'no_show_mark_time',
      value: '00:00',
      effectiveFrom: '2026-01-01',
      brRef: 'BR-311',
      editableBy: ['owner', 'manager'],
    });
    const r = res('Gia đình anh Hưng');
    r.arrivalDate = day;
    r.departureDate = addDays(day, 2);
    const f = mockControl.stay.folios.get(r.folioId);
    expect(f, 'the seed booking has a folio').toBeTruthy();
    if (!f) return;
    f.lines.push(line('pickup', day), line('tour', addDays(day, 1)));
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fdl');
    const d = await screen.findByRole('dialog', { name: 'Gia đình anh Hưng' });
    await user.click(await within(d).findByRole('button', { name: 'Đánh dấu không đến' }));
    const dlg = await screen.findByRole('alertdialog', { name: /không đến\?/ });
    const chips = await within(dlg).findAllByText(tv('svc.performed'));
    expect(chips).toHaveLength(1);
    // The pickup (first line, dated the business day) carries it; the tour of the next day does not.
    const rows = dlg.querySelectorAll('.svc-line');
    expect(rows).toHaveLength(2);
    expect(rows[0]!.textContent).toContain(tv('svc.performed'));
    expect(rows[1]!.textContent).not.toContain(tv('svc.performed'));
  });
});
