// V5-14 (contract 0.3.13 1.3, 1.17; BUG-R4-041, FB-R4-ARC-FE-PR75-01) – H09 Đặt phòng mới: "Giữ chỗ đến …" keeps the
// rates the desk typed. The rates go with the quote (`QuoteInput.nightlyRates`: every night, `edited` from its box –
// a night not edited is priced by the server's calendar), for the preview (`calculateQuote`) and the hold
// (`saveQuote` → `createHoldFromQuote`, which takes no price field). Replaces the v1.0.4 lock (DOM ARC-03 / UXD-05:
// `booking.hold.typed_rate_locked`) and the PR75-02 clearing of the rate errors in `hold()`.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it, onTestFinished } from 'vitest';
import { todayLocal } from '../app/dates';
import { addDays, dayMonth } from '../app/reservations';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { pinDaytime } from '../test/clock';
import { renderApp, tv } from '../test/render';

type User = ReturnType<typeof renderApp>['user'];
type Sent = { path: string; body: Record<string, unknown> };

/** Bodies of the POSTs the Desk sent in this case (quote previews, quotes, holds, reservations). */
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
const rateBox = (dlg: HTMLElement, date: string) =>
  within(dlg).getByLabelText(`${tv('rate.pre_tier')} ${dayMonth(date)}`) as HTMLInputElement;
const holdButton = (dlg: HTMLElement) => within(dlg).getByRole('button', { name: /^Giữ chỗ đến / });
const digits = (s: string | null | undefined) => Number((s ?? '').replace(/\D/g, ''));
/** BR-305 on the mock (30 % of the room total, to 100.000) – the oracle of QA-on-be-pr-103 2.2 (b). */
const depositOf = (roomTotal: number) => Math.round((roomTotal * 0.3) / 100_000) * 100_000;
/** "Cọc cần thu" of the price table (server `depositVnd` of the last preview). */
function depositShown(dlg: HTMLElement): number {
  const label = tv('bk.deposit_line', { pct: 30 }).split(' (')[0]!;
  const row = within(within(dlg).getByRole('table', { name: tv('booking.summary.total') }))
    .getByText((t) => t.startsWith(label))
    .closest('tr')!;
  return digits(row.lastElementChild!.textContent);
}

/**
 * Đặt phòng mới, arriving tomorrow (a hold is offered from tomorrow on) for 2 nights (BR-113: a Fri/Sat arrival needs
 * 2), room 203, the preview has filled both boxes.
 */
async function openForTomorrow(user: User, channel?: string, waitRates = true) {
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
  if (!waitRates) return dlg;
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

/** The preview of the typed rates has come back (a calculateQuote with `nightlyRates` was sent, then answered). */
async function typedPreview(sent: Sent[], dlg: HTMLElement, depositBefore: number) {
  await waitFor(
    () => {
      expect(
        sent.some((s) => s.path.endsWith('/quotes/calculate') && 'nightlyRates' in s.body),
      ).toBe(true);
      expect(depositShown(dlg)).not.toBe(depositBefore);
    },
    { timeout: 3000 },
  );
}

describe('V5-14 – "Giữ chỗ" keeps the rates the desk typed', () => {
  it.each(['bk.ch_direct', 'bk.ch_agent'])(
    '%s: one night typed → no lock; the preview and the quote carry every night with `edited`; the hold takes no price and its deposit = the deposit on the dialog (T14-6)',
    async (channel) => {
      pinDaytime();
      const sent = posts();
      const { user } = renderApp('/rack', 'qa.fd');
      const dlg = await openForTomorrow(user, channel === 'bk.ch_direct' ? undefined : channel);
      const second = rateBox(dlg, addDays(tomorrow(), 1)).value;
      const before = depositShown(dlg);

      await typeRate(user, dlg, tomorrow(), '2500000');
      const hold = holdButton(dlg);
      expect(hold).not.toHaveAttribute('aria-disabled');
      expect(hold).toBeEnabled();
      // the v1.0.4 lock sentence is gone (its key too – FB-R5-UXD-FE-PR122-04)
      expect(within(dlg).queryByText(/^Giữ chỗ chỉ theo giá niêm yết/)).toBeNull();
      await typedPreview(sent, dlg, before);
      const nights = [
        { date: tomorrow(), amountVnd: 2_500_000, edited: true },
        { date: addDays(tomorrow(), 1), amountVnd: digits(second), edited: false },
      ];
      const preview = sent.filter((s) => s.path.endsWith('/quotes/calculate')).at(-1)!;
      expect(preview.body.nightlyRates).toEqual(nights);
      const shown = depositShown(dlg);
      // QA 2.2 (b): the deposit on the dialog is the one of the typed rates, not of the calendar
      expect(shown).toBe(depositOf(2_500_000 + digits(second)));
      expect(shown).not.toBe(before);

      await user.click(hold);
      expect(await screen.findByText(/^Đã giữ căn 203 – đơn OTM-0\d+$/)).toBeInTheDocument();
      const quote = sent.find((s) => /\/quotes$/.test(s.path))!;
      expect(quote.body.nightlyRates).toEqual(nights);
      const holdBody = sent.find((s) => s.path.endsWith('/actions/create-hold'))!.body;
      for (const k of ['nightlyRates', 'rates', 'rateVnd', 'amountVnd', 'totalVnd', 'depositVnd'])
        expect(holdBody).not.toHaveProperty(k);
      const created = mockControl.rsv.reservations.find((r) => r.status === 'hold' && r.quoteId)!;
      expect(created.depositRequiredVnd).toBe(shown);
      expect(created.nightlyRates?.map((n) => [n.date, n.amountVnd])).toEqual([
        [tomorrow(), 2_500_000],
        [addDays(tomorrow(), 1), digits(second)],
      ]);
      expect(sent.some((s) => /\/reservations$/.test(s.path))).toBe(false);
    },
  );

  it('no typed rate → the quote has no nightlyRates (the server prices every night)', async () => {
    pinDaytime();
    const sent = posts();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForTomorrow(user);
    await user.click(holdButton(dlg));
    expect(await screen.findByText(/^Đã giữ căn 203 – đơn OTM-0\d+$/)).toBeInTheDocument();
    expect(sent.find((s) => /\/quotes$/.test(s.path))!.body).not.toHaveProperty('nightlyRates');
    expect(
      sent
        .filter((s) => s.path.endsWith('/quotes/calculate'))
        .every((s) => !('nightlyRates' in s.body)),
    ).toBe(true);
  });

  it('PR75-02 loop gone: a typed box emptied again blocks the hold with "Nhập giá mỗi đêm" – no quote sent', async () => {
    pinDaytime();
    const sent = posts();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForTomorrow(user);
    await typeRate(user, dlg, tomorrow(), '880000');
    await typeRate(user, dlg, tomorrow(), '');
    await user.click(holdButton(dlg));
    expect(await within(dlg).findByText(tv('booking.error.rate_empty'))).toBeInTheDocument();
    expect(sent.some((s) => /\/quotes$/.test(s.path))).toBe(false);
    expect(sent.some((s) => s.path.endsWith('/actions/create-hold'))).toBe(false);
  });

  it('no 0 for a night whose calendar rate is not back yet: one night typed, the other box empty → neither the preview nor the hold sends the nights, "Nhập giá mỗi đêm"', async () => {
    pinDaytime();
    const sent = posts();
    server.use(http.post(/\/quotes\/calculate$/, () => new Promise<Response>(() => undefined)));
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForTomorrow(user, undefined, false);
    expect(rateBox(dlg, addDays(tomorrow(), 1)).value).toBe('');
    await typeRate(user, dlg, tomorrow(), '880000');
    await user.click(holdButton(dlg));
    expect(await within(dlg).findByText(tv('booking.error.rate_empty'))).toBeInTheDocument();
    expect(sent.some((s) => /\/quotes$/.test(s.path))).toBe(false);
    expect(sent.some((s) => s.path.endsWith('/actions/create-hold'))).toBe(false);
    expect(sent.some((s) => 'nightlyRates' in s.body)).toBe(false);
  });

  it('a typed rate outside the floor–ceiling: the preview puts the sentence on that night; the hold is refused the same way, nothing held', async () => {
    pinDaytime();
    const sent = posts();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForTomorrow(user);
    await typeRate(user, dlg, addDays(tomorrow(), 1), '100000');
    // FB-R5-UXD-FE-PR122-01: "Giá phải từ 300.000 đ đến 3.000.000 đ (sàn–trần của nhóm căn)." – money, no "{"
    const sentence = tv('booking.error.rate_range', {
      min: tv('common.currency_vnd', { amount: '300.000' }),
      max: tv('common.currency_vnd', { amount: '3.000.000' }),
    });
    expect(sentence).toContain('300.000 đ');
    expect(sentence).toContain('(sàn–trần của nhóm căn)');
    expect(sentence).not.toMatch(/[{}]|nhóm \)/);
    const box = rateBox(dlg, addDays(tomorrow(), 1));
    const err = await within(box.closest('td')!).findByText(sentence);
    expect(box).toHaveAttribute('aria-invalid', 'true');
    // FB-R5-UXD-FE-PR122-02: shown by the preview before any click – announced and tied to its box
    expect(err).toHaveAttribute('role', 'alert');
    expect(box).toHaveAccessibleDescription(sentence);
    expect(within(rateBox(dlg, tomorrow()).closest('td')!).queryByText(sentence)).toBeNull();

    await user.click(holdButton(dlg));
    await waitFor(() => expect(sent.some((s) => /\/quotes$/.test(s.path))).toBe(true));
    expect(await within(box.closest('td')!).findByText(sentence)).toBeInTheDocument();
    expect(sent.some((s) => s.path.endsWith('/actions/create-hold'))).toBe(false);
    expect(mockControl.rsv.reservations.some((r) => r.status === 'hold' && r.quoteId)).toBe(false);

    // fixed → the sentence goes with the next preview
    await typeRate(user, dlg, addDays(tomorrow(), 1), '900000');
    await waitFor(() => expect(within(box.closest('td')!).queryByText(sentence)).toBeNull(), {
      timeout: 3000,
    });
  });

  it('the rate boxes are read-only while the hold runs', async () => {
    pinDaytime();
    const { user } = renderApp('/rack', 'qa.fd');
    const dlg = await openForTomorrow(user);
    await typeRate(user, dlg, tomorrow(), '880000');
    server.use(http.post(/\/quotes$/, () => new Promise<Response>(() => undefined)));
    await user.click(holdButton(dlg));
    await waitFor(() => expect(holdButton(dlg)).toHaveAttribute('aria-busy', 'true'));
    expect(rateBox(dlg, tomorrow())).toHaveAttribute('readonly');
    expect(rateBox(dlg, addDays(tomorrow(), 1))).toHaveAttribute('readonly');
  });
});
