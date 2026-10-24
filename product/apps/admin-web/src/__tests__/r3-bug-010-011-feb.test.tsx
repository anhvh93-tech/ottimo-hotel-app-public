import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

/**
 * QA US-155 E2E (rounds/round-03/qa/bug-list.md):
 * - BUG-R3-011 (P2): H09 "Tạo đơn" from a website request let staff change Kênh/Nguồn; the server then answered
 *   422 NOT_ALLOWED and the Desk only said "does not apply". Now channel Direct + source Website are read-only, and a
 *   refusal says why (US-155 AC2).
 * - BUG-R3-010 (P2, FE side): FDL sees "the website form is off" whenever the server lets FDL read the switch.
 */
const req = (code: string) => mockControl.webRequests.requests.find((r) => r.refCode === code)!;

type User = ReturnType<typeof renderApp>['user'];

async function openBooking(user: User) {
  // Dates far enough ahead that room 201 is free in the seed.
  Object.assign(req('W7K3QX9P'), {
    arrival: addDays(todayLocal(), 40),
    departure: addDays(todayLocal(), 42),
  });
  await user.click(await screen.findByRole('button', { name: 'W7K3QX9P' }));
  const drawer = await screen.findByRole('dialog');
  await user.click(
    await within(drawer).findByRole('button', { name: tv('webreq.create_booking') }),
  );
  return screen.findByRole('dialog', { name: /Đặt phòng cho yêu cầu W7K3QX9P/ });
}

async function fillRoomAndGuest(user: User, dlg: HTMLElement) {
  const room = within(dlg).getByLabelText(/^Căn/);
  await waitFor(() => expect(within(room).getAllByRole('option').length).toBeGreaterThan(5));
  const option = within(room)
    .getAllByRole<HTMLOptionElement>('option')
    .find((o) => /^201 /.test(o.textContent ?? ''))!;
  await user.selectOptions(room, option);
  await user.click(await within(dlg).findByRole('button', { name: tv('webreq.pick') }));
  await waitFor(() => expect(within(dlg).getByLabelText(/Số tiền đã nhận/)).not.toHaveValue(''));
}

describe('BUG-R3-011 – H09 from a website request: channel and source are fixed', () => {
  it('channel Direct · Website is read-only with the reason; no channel buttons, no source list', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    const dlg = await openBooking(user);
    const field = within(dlg).getByLabelText(new RegExp(`^${tv('booking.field.channel')}`));
    expect(field).toHaveAttribute('readonly');
    expect(field).toHaveValue(`${tv('bk.ch_direct')} · ${tv('bk.src_web')}`);
    expect(within(dlg).getByText(tv('webreq.source_locked'))).toBeInTheDocument();
    expect(within(dlg).queryByRole('button', { name: tv('bk.ch_ota') })).not.toBeInTheDocument();
    expect(within(dlg).queryByLabelText(new RegExp(`^${tv('bk.source')}`))).not.toBeInTheDocument();
  });

  it('a 422 NOT_ALLOWED on the source says it must stay Website (not "does not apply"); nothing created', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    const dlg = await openBooking(user);
    await fillRoomAndGuest(user, dlg);
    mockControl.failNext(/\/reservations:POST$/, 422, {
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'directSource', code: 'NOT_ALLOWED' }],
    });
    const before = mockControl.rsv.reservations.length;
    await user.click(within(dlg).getByRole('button', { name: tv('booking.create') }));
    expect(await within(dlg).findByText(tv('webreq.source_must_be_website'))).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('field.NOT_ALLOWED'))).not.toBeInTheDocument();
    expect(mockControl.rsv.reservations).toHaveLength(before);
    expect(req('W7K3QX9P').status).toBe('new');
  });

  it('the request closed meanwhile (409 INVALID_TRANSITION) → its own sentence', async () => {
    const { user } = renderApp('/website-requests', 'qa.fd');
    const dlg = await openBooking(user);
    await fillRoomAndGuest(user, dlg);
    req('W7K3QX9P').status = 'declined';
    await user.click(within(dlg).getByRole('button', { name: tv('booking.create') }));
    expect(await within(dlg).findByText(tv('webreq.booking_closed'))).toBeInTheDocument();
  });

  it('H09 opened from the rack is unchanged: channel buttons and source list are there', async () => {
    const { user } = renderApp('/rack', 'qa.fd');
    await screen.findByRole('grid');
    await user.click(screen.getByRole('button', { name: 'Đặt phòng mới' }));
    const dlg = await screen.findByRole('dialog', { name: /Đặt phòng mới/ });
    expect(within(dlg).getByRole('button', { name: tv('bk.ch_ota') })).toBeInTheDocument();
    expect(within(dlg).getByLabelText(new RegExp(`^${tv('bk.source')}`))).toBeInTheDocument();
    expect(within(dlg).queryByText(tv('webreq.source_locked'))).not.toBeInTheDocument();
  });
});

describe('BUG-R3-010 – FDL sees that the website form is off', () => {
  it('FDL (allowed to read the switch – getParameterHistory x-roles) sees the line', async () => {
    renderApp('/website-requests', 'qa.fdl');
    expect(await screen.findByText(tv('webreq.form_off_title'))).toBeInTheDocument();
    expect(screen.queryByText(tv('webreq.form_off_owner'))).not.toBeInTheDocument();
  });

  it('FD and sale do not read the switch, so nothing is claimed', async () => {
    renderApp('/website-requests', 'qa.fd');
    await screen.findByRole('button', { name: 'W7K3QX9P' });
    expect(screen.queryByText(tv('webreq.form_off_title'))).not.toBeInTheDocument();
  });
});
