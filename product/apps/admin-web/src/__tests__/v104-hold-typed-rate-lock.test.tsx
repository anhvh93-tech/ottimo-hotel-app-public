// DOM (ARC-03 / UXD-05) – H09 Đặt phòng mới: "Giữ chỗ đến …" saves a quote and a hold from it (saveQuote →
// createHoldFromQuote), priced from the list – a rate the desk typed would be lost without a word. With a typed rate
// on a night of the stay the button is locked (disabled, not busy – DS C1) and a line beside it
// (`booking.hold.typed_rate_locked`, aria-describedby) says: deposit in → "Tạo đơn" keeps the typed rates; not in →
// clear them, then hold.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, onTestFinished } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays, dayMonth } from '../app/reservations';
import { server } from '../mocks/node';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];
type Sent = { path: string; body: Record<string, unknown> };

/** Bodies of the POSTs the Desk sent in this case (quotes, holds, reservations). */
function posts() {
  const sent: Sent[] = [];
  const on = ({ request }: { request: Request }) => {
    if (request.method !== 'POST') return;
    const path = new URL(request.url).pathname;
    void request
      .clone()
      .json()
      .then((body: Record<string, unknown>) => sent.push({ path, body }));
  };
  server.events.on('request:start', on);
  onTestFinished(() => {
    server.events.removeListener('request:start', on);
  });
  return sent;
}

const tomorrow = () => addDays(todayLocal(), 1);
const lockLine = () => tv('booking.hold.typed_rate_locked');
const rateBox = (dlg: HTMLElement, date: string) =>
  within(dlg).getByLabelText(`${tv('rate.pre_tier')} ${dayMonth(date)}`) as HTMLInputElement;
const holdButton = (dlg: HTMLElement) => within(dlg).getByRole('button', { name: /^Giữ chỗ đến / });

/**
 * Đặt phòng mới, arriving tomorrow (a hold is offered from tomorrow on) for 2 nights (BR-113: a Fri/Sat arrival needs
 * 2 – the case must not depend on the weekday), room 203, the preview has filled both boxes.
 */
async function openForTomorrow(user: User, channel?: string) {
  await screen.findByRole('grid');
  await user.click(screen.getByRole('button', { name: 'Đặt phòng mới' }));
  const dlg = await screen.findByRole('dialog', { name: /Đặt phòng mới/ });
  if (channel) await user.click(within(dlg).getByRole('button', { name: tv(channel) }));
  fireEvent.change(within(dlg).getByLabelText(tv('booking.field.arrival')), {
    target: { value: tomorrow() },
  });
  fireEvent.change(within(dlg).getByLabelText(tv('booking.field.departure')), {
    target: { value: addDays(tomorrow(), 2) },
  });
  const room = within(dlg).getByLabelText(/^Căn/);
  await waitFor(() => expect(within(room).getAllByRole('option').length).toBeGreaterThan(5));
  await user.selectOptions(room, within(room).getByRole('option', { name: /^203 / }));
  await user.type(within(dlg).getByRole('combobox', { name: 'Khách đứng tên' }), 'Trần Minh');
  await user.click(await screen.findByRole('option', { name: /Trần Minh Khoa/ }));
  await waitFor(
    () => {
      expect(rateBox(dlg, tomorrow()).value).not.toBe('');
      expect(rateBox(dlg, addDays(tomorrow(), 1)).value).not.toBe('');
    },
    { timeout: 3000 },
  );
  return dlg;
}

async function typeRate(user: User, dlg: HTMLElement, date: string, value: string) {
  const box = rateBox(dlg, date);
  await user.clear(box);
  if (value) await user.type(box, value);
}

describe('DOM ARC-03 – "Giữ chỗ" is locked while a rate the desk typed is on the stay', () => {
  it.each(['bk.ch_direct', 'bk.ch_agent'])(
    '%s: a typed rate locks the button (disabled, not busy), the line beside it says why; "Tạo đơn" stays open',
    async (channel) => {
      pinDaytime();
      const { user } = renderApp('/rack', 'qa.fd');
      const dlg = await openForTomorrow(user, channel === 'bk.ch_direct' ? undefined : channel);
      expect(holdButton(dlg)).toBeEnabled();
      expect(within(dlg).queryByText(lockLine())).toBeNull();

      await typeRate(user, dlg, tomorrow(), '880000');
      const hold = holdButton(dlg);
      expect(hold).toBeDisabled();
      expect(hold).not.toHaveAttribute('aria-busy', 'true');
      expect(hold).toHaveAccessibleDescription(lockLine());
      const line = within(dlg).getByText(lockLine());
      expect(line).toHaveClass('li-s');
      expect(hold.getAttribute('aria-describedby')).toBe(line.id);
      // the way out the line names: "Tạo đơn" keeps the typed rates
      expect(within(dlg).getByRole('button', { name: tv('booking.create') })).toBeEnabled();
    },
  );

  it('typed rate cleared again → the button opens, the hold goes through at the list price', async () => {
    pinDaytime();
    const sent = posts();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForTomorrow(user);
    await typeRate(user, dlg, tomorrow(), '880000');
    expect(holdButton(dlg)).toBeDisabled();

    await typeRate(user, dlg, tomorrow(), '');
    const hold = holdButton(dlg);
    expect(hold).toBeEnabled();
    expect(hold).not.toHaveAttribute('aria-describedby');
    expect(within(dlg).queryByText(lockLine())).toBeNull();
    await user.click(hold);
    // a box emptied does not stop a hold (no "Nhập giá mỗi đêm"): the rates do not go with it
    await waitFor(() =>
      expect(sent.some((s) => s.path.endsWith('/actions/create-hold'))).toBe(true),
    );
    expect(within(document.body).queryByText(tv('booking.error.rate_empty'))).toBeNull();
    const quote = sent.find((s) => /\/quotes$/.test(s.path))!;
    expect(quote.body).not.toHaveProperty('nightlyRates');
    expect(sent.some((s) => /\/reservations$/.test(s.path))).toBe(false);
  });

  it('deposit in: "Tạo đơn" saves the booking with the typed rate (edited:true)', async () => {
    pinDaytime();
    const sent = posts();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForTomorrow(user);
    await typeRate(user, dlg, tomorrow(), '880000');
    await typeRate(user, dlg, addDays(tomorrow(), 1), '880000');
    // the deposit of the typed price (BR-305: 30 % of 1.760.000, to 100.000 – the server checks it on save)
    const deposit = within(dlg).getByLabelText(/Số tiền đã nhận/);
    await user.clear(deposit);
    await user.type(deposit, '500000');
    await user.click(within(dlg).getByRole('button', { name: tv('booking.create') }));
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    const created = sent.find((s) => /\/reservations$/.test(s.path))!;
    expect(created.body.nightlyRates).toEqual([
      { date: tomorrow(), amountVnd: 880000, edited: true },
      { date: addDays(tomorrow(), 1), amountVnd: 880000, edited: true },
    ]);
    expect(sent.some((s) => s.path.endsWith('/actions/create-hold'))).toBe(false);
  });

  it('only the nights of the stay count: a typed night the new dates leave out does not lock', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForTomorrow(user);
    const departure = within(dlg).getByLabelText(tv('booking.field.departure'));
    await typeRate(user, dlg, addDays(tomorrow(), 1), '880000');
    expect(holdButton(dlg)).toBeDisabled();
    fireEvent.change(departure, { target: { value: addDays(tomorrow(), 1) } });
    expect(holdButton(dlg)).toBeEnabled();
    expect(within(dlg).queryByText(lockLine())).toBeNull();
  });
});
