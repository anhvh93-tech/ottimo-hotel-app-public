// V5-10 (contract 0.3.13 1.1, 1.19; BE PR #106; DOM review #106 2.1–2.2 and rules-v1.0.5 15.1–15.2) – H16 Trả phòng
// keeps ONE instant for the bill, the check-out VietQR and B18: the server's `CheckoutSummary.checkoutAt` of the last
// summary read WITH the time on screen (T10-6). The first read (no time: the agreed or standard time) is never
// forwarded, and the time the page fills in stays the desk's clock (KB7). The flags of that read are used before B18:
// `checkoutTimeNoteRequired` opens the note box, `checkoutAtAfterNow` says why "Tiếp tục" waits. While the time is the
// one filled in and it costs the guest something, the box stands out for the desk to check (DOM 15.2).
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;
const iso = (hhmm: string, day = todayLocal()) => `${day}T${hhmm}:00+07:00`;
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const noteLabel = () => new RegExp(`^${esc(tv('checkout.time_note'))}`);
const at = (hhmm: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(iso(hhmm)));
};
afterEach(() => vi.useRealTimers());

/** Phạm Huy (201) leaves today: minibar checked, room nights paid – only a late surcharge is left to collect. */
function prepaid() {
  const r = res('Phạm Huy');
  mockControl.stay.minibarChecks.set(r.id, []);
  mockControl.stay.payments.push({
    id: 'p-v510',
    code: 'PT-V510',
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

/** Summary answers (time asked, `checkoutAt` returned) and the bodies of the QR / B18 / B15 writes. */
function traffic() {
  const reads: Array<{ asked: string | null; checkoutAt: string }> = [];
  const writes: Array<{ path: string; body: Record<string, unknown> }> = [];
  const onResponse = ({ request, response }: { request: Request; response: Response }) => {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname.endsWith('/checkout-summary'))
      void response
        .clone()
        .json()
        .then((b: { checkoutAt: string }) =>
          reads.push({ asked: url.searchParams.get('checkoutTime'), checkoutAt: b.checkoutAt }),
        );
  };
  const onRequest = ({ request }: { request: Request }) => {
    const path = new URL(request.url).pathname;
    if (
      request.method === 'POST' &&
      /\/(vietqr|actions\/check-out|actions\/late-checkout)$/.test(path)
    )
      void request
        .clone()
        .json()
        .then((body: Record<string, unknown>) => writes.push({ path, body }));
  };
  server.events.on('response:mocked', onResponse);
  server.events.on('request:start', onRequest);
  onTestFinished(() => {
    server.events.removeListener('response:mocked', onResponse);
    server.events.removeListener('request:start', onRequest);
  });
  return { reads, writes };
}

const timeBox = () => screen.findByLabelText(new RegExp(tv('checkout.departure_time')));
async function typeTime(reads: ReturnType<typeof traffic>['reads'], hhmm: string) {
  fireEvent.change(await timeBox(), { target: { value: hhmm } });
  await waitFor(() => expect(reads.some((x) => x.asked === hhmm)).toBe(true), { timeout: 3000 });
}

describe('V5-10 – one checkoutAt for the bill, the check-out VietQR and B18', () => {
  it('T10-6: two reads with a time → the QR and B18 carry the checkoutAt of the LAST one; the read without a time is never forwarded', async () => {
    at('13:00');
    const r = prepaid();
    const { reads, writes } = traffic();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    // KB7 kept: the desk's clock, not the time of the first read (agreed or 12:00)
    expect(await timeBox()).toHaveValue('13:00');
    const untimed = reads.find((x) => x.asked === null)!;
    expect(untimed.checkoutAt).toBe(iso(r.agreedCheckoutTime ?? '12:00'));

    await typeTime(reads, '12:45');
    await typeTime(reads, '12:50');
    const last = reads.filter((x) => x.asked === '12:50').at(-1)!;
    expect(last.checkoutAt).toBe(iso('12:50'));

    await user.click(screen.getByRole('checkbox', { name: `${tv('ci.told_guest')} *` }));
    await user.click(screen.getByRole('button', { name: tv('co.go_bill') }));
    const qrButton = await screen.findByRole('button', {
      name: new RegExp(`^${tv('pay.vietqr_create', { amount: '' }).trim()}`),
    });
    await user.click(qrButton);
    await waitFor(() => expect(writes.some((w) => w.path.endsWith('/vietqr'))).toBe(true));
    const qr = writes.find((w) => w.path.endsWith('/vietqr'))!.body;
    expect(qr.purpose).toBe('check_out');
    expect(qr.checkoutAt).toBe(last.checkoutAt);

    // collect it in cash, then B18 with the same instant
    await user.click(screen.getByRole('button', { name: tv('pay.cash') }));
    await user.click(screen.getByRole('button', { name: /^Ghi nhận / }));
    await waitFor(() => expect(screen.getByText(tv('drawer.folio.settled'))).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /^Đã thu .* – hoàn tất$/ }));
    const box = await screen.findByRole('alertdialog');
    await user.click(within(box).getByRole('button', { name: /^Đã thu .* – hoàn tất$/ }));
    await waitFor(() => expect(res('Phạm Huy').status).toBe('checked_out'));
    const b18 = writes.find((w) => w.path.endsWith('/actions/check-out'))!.body;
    expect(b18.checkoutAt).toBe(last.checkoutAt);
    expect(b18.checkoutTime).toBe('12:50');
    for (const w of writes)
      expect(w.body.checkoutAt ?? last.checkoutAt, w.path).not.toBe(untimed.checkoutAt);
  });

  it('checkoutTimeNoteRequired: 12:10 typed at 13:00 → the note box is there before any B18', async () => {
    at('13:00');
    const r = prepaid();
    const { reads, writes } = traffic();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    expect(screen.queryByLabelText(noteLabel())).toBeNull();
    await typeTime(reads, '12:10');
    expect(await screen.findByLabelText(noteLabel())).toBeInTheDocument();
    expect(writes.some((w) => w.path.endsWith('/actions/check-out'))).toBe(false);
    // FB-R5-UXD-FE-PR125-02: "Tiếp tục" waits for the note (not after the money, at "Hoàn tất")
    const go = screen.getByRole('button', { name: tv('co.go_bill') });
    expect(go).toHaveAttribute('aria-disabled', 'true');
    expect(go).toHaveAccessibleDescription(tv('field.TIME_NOTE_REQUIRED'));
    await user.type(screen.getByLabelText(noteLabel()), 'Khach tra chia luc 12:10');
    await waitFor(() => expect(go).not.toHaveAttribute('aria-disabled'));
  });

  it('checkoutAtAfterNow: 13:40 typed at 13:00 → the sentence under the time, "Tiếp tục" says why and stays; nothing written', async () => {
    at('13:00');
    const r = prepaid();
    const { reads, writes } = traffic();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    await typeTime(reads, '13:40');
    const sentence = tv('field.TIME_AFTER_ACTION');
    expect(await screen.findAllByText(sentence)).not.toHaveLength(0);
    expect(await timeBox()).toHaveAttribute('aria-invalid', 'true');
    const go = screen.getByRole('button', { name: tv('co.go_bill') });
    expect(go).toHaveAttribute('aria-disabled', 'true');
    expect(go).toHaveAccessibleDescription(sentence);
    await user.click(go);
    expect(screen.queryByRole('button', { name: /^Đã thu .* – hoàn tất$|Hoàn tất/ })).toBeNull();
    expect(writes).toEqual([]);
  });

  it('DOM 15.2: the time the page filled in stands out while it costs the guest something; typed by the desk → plain', async () => {
    at('13:00');
    const r = prepaid();
    const { reads } = traffic();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    const box = await timeBox();
    await waitFor(() => expect(box).toHaveClass('is-prefilled'));
    expect(box).toHaveAttribute('data-prefilled', 'true');
    // FB-R5-UXD-FE-PR125-01: not by colour only – the help sentence, tied to the box
    const help = tv('checkout.time_prefilled_help');
    expect(screen.getByText(help)).toBeInTheDocument();
    expect(box).toHaveAccessibleDescription(help);
    await typeTime(reads, '12:55');
    expect(box).not.toHaveClass('is-prefilled');
    expect(box).not.toHaveAttribute('data-prefilled');
    expect(screen.queryByText(help)).toBeNull();
  });

  it('FB-R5-UXD-FE-PR125-03: a filled-in time with an error (desk clock ahead of the server) → only the error, no brown ring, no help', async () => {
    at('13:00');
    const r = prepaid();
    traffic();
    // the server's clock is 20 minutes behind the desk's: the filled-in 13:00 is after "now" for the server
    mockControl.stay.checkoutClockSkewMinutes = -20;
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    const box = await timeBox();
    await waitFor(() => expect(box).toHaveAttribute('aria-invalid', 'true'));
    expect(box).toHaveAttribute('data-prefilled', 'true');
    expect(box).not.toHaveClass('is-prefilled');
    expect(screen.queryByText(tv('checkout.time_prefilled_help'))).toBeNull();
  });

  it('DOM 15.2: filled in at 12:05 (grace, nothing to pay for the time) → not marked', async () => {
    at('12:05');
    const r = prepaid();
    traffic();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    const box = await timeBox();
    expect(box).toHaveValue('12:05');
    expect(box).toHaveAttribute('data-prefilled', 'true');
    expect(box).not.toHaveClass('is-prefilled');
    expect(screen.queryByText(tv('checkout.time_prefilled_help'))).toBeNull();
  });
});
