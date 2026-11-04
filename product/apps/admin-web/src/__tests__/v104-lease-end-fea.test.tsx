// v1.0.4 P4-31 (FE-A): the "Trả sớm" box picks BR-313 (lease) or BR-428 by `manualLongStay.leaseEndDate`
// (OpenAPI 0.3.12 P4-00 (b), ARC plan-v1.0.4 6.1) – a B13 extension moves `departureDate` on a manual lease but never
// the lease end. Until api-client carries 0.3.12 the field rides on the mock reservation (shape of the contract).
import type { Reservation } from '@ottimo/api-client';
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { leaseEndOf } from '../pages/stay/EarlyDepartureDialog';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
type User = ReturnType<typeof renderApp>['user'];

const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${todayLocal()}T${hhmm}:00+07:00`));
};

/**
 * Emma Laurent's lease (T−40 → T+50) extended by 3 nights the way the server's B13 does it on a manual lease: the
 * same booking's `departureDate` moves to T+53, `leaseEndDate` stays T+50.
 */
function extendedLease() {
  const r = res('Emma Laurent');
  const end = r.departureDate;
  const nights = r.nightlyRates ?? [];
  Object.assign(r, {
    departureDate: addDays(end, 3),
    nights: (r.nights ?? 0) + 3,
    nightlyRates: [...nights, ...[0, 1, 2].map((i) => ({ date: addDays(end, i), amountVnd: 0 }))],
    segments: (r.segments ?? []).map((sg) => ({ ...sg, toDate: addDays(end, 3) })),
    manualLongStay: { ...r.manualLongStay!, leaseEndDate: end },
  });
  return { r, end };
}

async function openDialog(guest: string) {
  const r = res(guest);
  const view = renderApp(`/reservations/${r.id}`, 'qa.fd');
  const drawer = await screen.findByRole('dialog', { name: guest });
  await view.user.click(
    await within(drawer).findByRole('button', { name: tv('drawer.action.early_departure') }),
  );
  const dlg = await screen.findByRole('dialog', {
    name: new RegExp(
      esc(tv('early_departure.title', { room: 'ROOM', guest })).replace('ROOM', '\\d+'),
    ),
  });
  return { ...view, dlg };
}
async function setDate(user: User, dlg: HTMLElement, d: string) {
  const box = within(dlg).getByLabelText(new RegExp(tv('early_departure.new_date')));
  await user.clear(box);
  await user.type(box, d);
}
async function goPreview(user: User, dlg: HTMLElement) {
  const btn = within(dlg).getByRole('button', { name: tv('early_departure.to_preview') });
  await waitFor(() => expect(btn).not.toHaveAttribute('aria-disabled'));
  await user.click(btn);
}

describe('leaseEndOf', () => {
  const base = { stayType: 'long', departureDate: '2026-12-31' } as unknown as Reservation;
  it('reads manualLongStay.leaseEndDate', () => {
    expect(
      leaseEndOf({
        ...base,
        manualLongStay: { leaseEndDate: '2026-12-20' },
      } as unknown as Reservation),
    ).toBe('2026-12-20');
  });
  it('falls back to departureDate (server before 0.3.12, or no manualLongStay)', () => {
    expect(leaseEndOf({ ...base, manualLongStay: { monthlyRentVnd: 1 } } as Reservation)).toBe(
      '2026-12-31',
    );
    expect(leaseEndOf(base)).toBe('2026-12-31');
    expect(
      leaseEndOf({ ...base, manualLongStay: { leaseEndDate: null } } as unknown as Reservation),
    ).toBe('2026-12-31');
  });
});

describe('P4-31 – Trả sớm on an extended lease (HĐ đã gia hạn) follows leaseEndDate', () => {
  beforeEach(() => at('14:00'));
  afterEach(() => vi.useRealTimers());

  it('leaving inside the extension (after the lease end): no BR-313, the BR-428 box', async () => {
    const { end } = extendedLease();
    const { user, dlg } = await openDialog('Emma Laurent');
    await setDate(user, dlg, addDays(end, 1));
    await goPreview(user, dlg);
    expect(
      (await within(dlg).findAllByText(tv('early_departure.calc_title'))).length,
    ).toBeGreaterThan(0);
    expect(within(dlg).queryByText(tv('early_departure.lease_title'))).toBeNull();
    expect(within(dlg).queryByText(tv('early_departure.lease_rule_paid'))).toBeNull();
    expect(
      within(dlg).queryByRole('checkbox', { name: tv('early_departure.told_guest_lease') }),
    ).toBeNull();
  });

  it('leaving on the lease end day itself: not a breach either', async () => {
    const { end } = extendedLease();
    const { user, dlg } = await openDialog('Emma Laurent');
    await setDate(user, dlg, end);
    await goPreview(user, dlg);
    expect(
      (await within(dlg).findAllByText(tv('early_departure.calc_title'))).length,
    ).toBeGreaterThan(0);
    expect(within(dlg).queryByText(tv('early_departure.lease_title'))).toBeNull();
  });

  it('leaving before the lease end: BR-313 lines (check + "paid" branch), no BR-428 rows', async () => {
    const { end } = extendedLease();
    const { user, dlg } = await openDialog('Emma Laurent');
    await setDate(user, dlg, addDays(end, -3));
    await goPreview(user, dlg);
    const note = await within(dlg).findByRole('note');
    expect(within(note).getByText(tv('early_departure.lease_title'))).toBeInTheDocument();
    expect(within(note).getByText(tv('early_departure.lease_rule_paid'))).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('early_departure.calc_title'))).toBeNull();
    expect(
      within(dlg).getByRole('checkbox', { name: tv('early_departure.told_guest_lease') }),
    ).toBeInTheDocument();
  });

  it('server before 0.3.12 (no leaseEndDate): the extended departureDate is the lease end, as in v1.0.3', async () => {
    const { r, end } = extendedLease();
    r.manualLongStay = { ...r.manualLongStay!, leaseEndDate: undefined } as never;
    const { user, dlg } = await openDialog('Emma Laurent');
    await setDate(user, dlg, addDays(end, 1));
    await goPreview(user, dlg);
    expect(await within(dlg).findByText(tv('early_departure.lease_title'))).toBeInTheDocument();
  });
});
