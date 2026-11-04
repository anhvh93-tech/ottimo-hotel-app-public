// DOM (ARC-03 / UXD-05) – H09 Đặt phòng mới: "Giữ chỗ đến …" saves a quote and a hold from it (saveQuote →
// createHoldFromQuote), priced from the list – a rate the desk typed would be lost without a word. With a typed rate
// on a night of the stay the button is locked (DS C1: aria-disabled – still focusable, never busy) and a line at the
// start of the footer (`booking.hold.typed_rate_locked`, aria-describedby) says: deposit received → "Tạo đơn" keeps
// the typed rates; not → clear them and hold, then "Điều chỉnh" in the Folio once the deposit is confirmed.
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
/** FB-R4-UXD-FE-PR75-02: locked = `aria-disabled` (DS C1), not the native `disabled` – Tab still reaches it. */
function expectLocked(b: HTMLElement) {
  expect(b).toHaveAttribute('aria-disabled', 'true');
  expect(b).toBeEnabled();
}
const expectOpen = (b: HTMLElement) => {
  expect(b).not.toHaveAttribute('aria-disabled');
  expect(b).toBeEnabled();
};

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
    '%s: a typed rate locks the button (aria-disabled, not busy), the line at the start of the footer says why; "Tạo đơn" stays open',
    async (channel) => {
      pinDaytime();
      const { user } = renderApp('/rack', 'qa.fd');
      const dlg = await openForTomorrow(user, channel === 'bk.ch_direct' ? undefined : channel);
      expectOpen(holdButton(dlg));
      expect(within(dlg).queryByText(lockLine())).toBeNull();

      await typeRate(user, dlg, tomorrow(), '880000');
      const hold = holdButton(dlg);
      expectLocked(hold);
      expect(hold).not.toHaveAttribute('aria-busy', 'true');
      expect(hold).toHaveAccessibleDescription(lockLine());
      const line = within(dlg).getByText(lockLine());
      expect(line).toHaveClass('li-s');
      expect(hold.getAttribute('aria-describedby')).toBe(line.id);
      // FB-R4-UXD-FE-PR75-03: the line opens the footer – "Đóng (giữ nháp)" and the actions come after it
      expect(line.parentElement!.firstElementChild).toBe(line);
      const close = within(dlg).getByRole('button', { name: tv('booking.close_draft') });
      expect(line.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      // the way out the line names: "Tạo đơn" keeps the typed rates
      expect(within(dlg).getByRole('button', { name: tv('booking.create') })).toBeEnabled();
    },
  );

  it('locked: Tab reaches it and reads the reason; click, Enter and Space do nothing – no quote, no hold, no form submit', async () => {
    pinDaytime();
    const sent = posts();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForTomorrow(user);
    await typeRate(user, dlg, tomorrow(), '880000');
    await typeRate(user, dlg, addDays(tomorrow(), 1), '880000');
    const hold = holdButton(dlg);
    const create = within(dlg).getByRole('button', { name: tv('booking.create') });
    expectLocked(hold);
    // focusable (DS C1) – the reason comes with it
    within(dlg)
      .getByRole('button', { name: tv('booking.close_draft') })
      .focus();
    await user.tab();
    expect(hold).toHaveFocus();
    expect(hold).toHaveAccessibleDescription(lockLine());
    // hold() is a no-op: nothing turns busy, the form is not submitted ("Tạo đơn" stays idle)
    await user.click(hold);
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(hold).not.toHaveAttribute('aria-busy');
    expect(create).not.toHaveAttribute('aria-busy');
    expect(within(dlg).queryByText(tv('booking.error.rate_empty'))).toBeNull();
    // the way the line names still works – and is the only write of this case
    const deposit = within(dlg).getByLabelText(/Số tiền đã nhận/);
    await user.clear(deposit);
    await user.type(deposit, '500000');
    await user.click(create);
    expect(await screen.findByText(/^Đã tạo đơn OTM-0\d+$/)).toBeInTheDocument();
    expect(sent.some((x) => /\/quotes$/.test(x.path))).toBe(false);
    expect(sent.some((x) => x.path.endsWith('/actions/create-hold'))).toBe(false);
    expect(sent.filter((x) => /\/reservations$/.test(x.path))).toHaveLength(1);
  });

  it('typed rate cleared again → the button opens, the hold goes through at the list price', async () => {
    pinDaytime();
    const sent = posts();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForTomorrow(user);
    await typeRate(user, dlg, tomorrow(), '880000');
    expectLocked(holdButton(dlg));

    await typeRate(user, dlg, tomorrow(), '');
    const hold = holdButton(dlg);
    expectOpen(hold);
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
    expectLocked(holdButton(dlg));
    fireEvent.change(departure, { target: { value: addDays(tomorrow(), 1) } });
    expectOpen(holdButton(dlg));
    expect(within(dlg).queryByText(lockLine())).toBeNull();
  });
});
