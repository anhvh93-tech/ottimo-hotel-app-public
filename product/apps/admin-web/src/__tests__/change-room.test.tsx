import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { businessDayLocal } from '../app/dates';
import { addDays, currentSegment } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

// BE-A B14 (17/10): change room goes to the primary booking and moves the whole stay.
const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;

/** Kim (402, in house) + an in-house child booking for the two nights after her departure. */
function stayWithChild() {
  const kim = res('Kim Seo-yeon');
  const child = res('Trần Quốc Bảo');
  child.status = 'in_house';
  child.parentReservationId = kim.id;
  child.roomId = kim.roomId;
  child.arrivalDate = kim.departureDate;
  child.departureDate = addDays(kim.departureDate, 2);
  // The child's own nights, in Kim's room.
  child.segments = kim.segments?.map((s) => ({
    ...s,
    fromDate: child.arrivalDate,
    toDate: child.departureDate,
  }));
  child.nightlyRates = [0, 1].map((i) => ({
    date: addDays(kim.departureDate, i),
    amountVnd: 700_000,
  }));
  return { kim, child };
}

async function openChange(user: ReturnType<typeof renderApp>['user'], name: string) {
  const drawer = await screen.findByRole('dialog', { name });
  await user.click(within(drawer).getByRole('button', { name: tv('drawer.action.change_room') }));
  return screen.findByRole('dialog', { name: /^Đổi phòng · Căn 402/ });
}

describe('H15 Đổi phòng – whole stay from the primary booking', () => {
  it('opened on the child booking: calls the primary, lists every night (child included), moves both', async () => {
    const { kim, child } = stayWithChild();
    res('Nguyễn Văn An').status = 'cancelled'; // frees 202 (VC) for the whole stay
    const { user } = renderApp(`/reservations/${child.id}`, 'qa.fd');
    const dlg = await openChange(user, 'Trần Quốc Bảo');
    await user.click(await within(dlg).findByRole('radio', { name: /^202/ }));
    const table = await within(dlg).findByRole('table', { name: tv('booking.field.rate') });
    const rows = within(table).getAllByRole('row').slice(1);
    const nightsFromToday = [...(kim.nightlyRates ?? []), ...(child.nightlyRates ?? [])].filter(
      (n) => n.date >= businessDayLocal(),
    );
    expect(nightsFromToday.length).toBeGreaterThan(2);
    expect(rows).toHaveLength(nightsFromToday.length);
    await user.type(within(dlg).getByLabelText(/^Lý do/), 'Máy lạnh hỏng');
    await user.click(
      within(dlg).getByRole('button', { name: tv('stay.change_submit', { room: '202' }) }),
    );
    // K11-03: the nights before today stay in 402 – the room of today is 202 (one segment more).
    const roomToday = (g: string) => currentSegment(res(g).segments, businessDayLocal())?.roomNo;
    await waitFor(() => expect(roomToday('Kim Seo-yeon')).toBe('202'));
    // The child's nights (all after today) are in 202.
    expect(currentSegment(res('Trần Quốc Bảo').segments, child.arrivalDate)?.roomNo).toBe('202');
  });

  it('new room busy before the effective departure → conflicting nights + the suggested room', async () => {
    const { kim } = stayWithChild();
    const an = res('Nguyễn Văn An'); // 202: free while Kim stays, taken on the child's last night
    an.arrivalDate = addDays(kim.departureDate, 1);
    an.departureDate = addDays(kim.departureDate, 3);
    res('Anna Martin').status = 'cancelled';
    res('Lê Minh').status = 'cancelled'; // 103 (VI) free for the whole stay
    const { user } = renderApp(`/reservations/${kim.id}`, 'qa.fd');
    const dlg = await openChange(user, 'Kim Seo-yeon');
    await user.click(await within(dlg).findByRole('radio', { name: /^202/ }));
    expect(await within(dlg).findByText(/Căn 202/)).toBeInTheDocument();
    const use = await within(dlg).findByRole('button', {
      name: tv('bk.use_room', { room: '103' }),
    });
    await user.click(use);
    expect(
      await within(dlg).findByRole('table', { name: tv('booking.field.rate') }),
    ).toBeInTheDocument();
    expect(
      within(dlg).getByRole('button', { name: tv('stay.change_submit', { room: '103' }) }),
    ).toBeInTheDocument();
  });
});
