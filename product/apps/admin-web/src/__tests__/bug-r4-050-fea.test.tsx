// v1.0.4 (FE-A) – BUG-R4-050 (P2, QA2 05/11; DOM-on-v104-pr72 mục 4 ý 3): H16 after 24:00 of the departure day. The
// Desk built the instant of the typed time as "departure date + time", so 00:20 typed at 00:20 the day after the
// departure read as 00:20 OF the departure day – the valid after-midnight window, 24 h early: the check-out VietQR
// was capped at 0 đ (422 AMOUNT_EXCEEDS_BALANCE) and a typed extra-night rate could not be priced
// (extraNightRateVnd NOT_ALLOWED), so "Hoàn tất" stayed blocked. Now `checkoutInstant`: before the rollover, the
// latest instant at that time not later than the click, from 00:00 of the departure day to 06:00 the day after.
// B18 still sends `checkoutTime` only (BR-416 – the extra night is the server's).
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { checkoutInstant, shiftDay, todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

const D = '2029-11-24';
const D1 = shiftDay(D, 1);
const at = (day: string, hhmm: string) => new Date(`${day}T${hhmm}:00+07:00`);

describe('checkoutInstant – the day of a typed check-out time (QA2 cases, DOM rule)', () => {
  it('00:20 typed at 00:20 the day after the departure → that day (the guest stayed past midnight)', () => {
    expect(checkoutInstant(D, '00:20', at(D1, '00:20'))).toBe(`${D1}T00:20:00+07:00`);
    // seconds later in the same minute: still that day
    expect(checkoutInstant(D, '00:20', new Date(at(D1, '00:20').getTime() + 37_000))).toBe(
      `${D1}T00:20:00+07:00`,
    );
  });

  it('23:50 typed at 00:20 the day after → 23:50 of the departure day', () => {
    expect(checkoutInstant(D, '23:50', at(D1, '00:20'))).toBe(`${D}T23:50:00+07:00`);
  });

  it('04:30 typed at 06:10 on the departure day (the guest left at 04:30, PR #68) → the departure day', () => {
    expect(checkoutInstant(D, '04:30', at(D, '06:10'))).toBe(`${D}T04:30:00+07:00`);
  });

  it('01:00 typed at 01:00 on the departure day (the valid after-midnight window) → stays on the departure day', () => {
    expect(checkoutInstant(D, '01:00', at(D, '01:00'))).toBe(`${D}T01:00:00+07:00`);
  });

  it('a daytime time → the departure day, whatever the click', () => {
    expect(checkoutInstant(D, '11:00', at(D, '11:05'))).toBe(`${D}T11:00:00+07:00`);
    expect(checkoutInstant(D, '19:30', at(D, '19:40'))).toBe(`${D}T19:30:00+07:00`);
    expect(checkoutInstant(D, '06:00', at(D1, '00:20'))).toBe(`${D}T06:00:00+07:00`);
  });

  it('the rollover of the property; nothing at that time yet → the departure day; no time → nothing', () => {
    expect(checkoutInstant(D, '05:30', at(D1, '05:40'), '05:00')).toBe(`${D}T05:30:00+07:00`);
    expect(checkoutInstant(D, '05:30', at(D1, '05:40'))).toBe(`${D1}T05:30:00+07:00`);
    expect(checkoutInstant(D, '04:30', at(D, '03:00'))).toBe(`${D}T04:30:00+07:00`);
    expect(checkoutInstant(D, '', at(D1, '00:20'))).toBeUndefined();
    expect(checkoutInstant(D, '4:30', at(D1, '00:20'))).toBeUndefined();
  });
});

describe('BUG-R4-050 – H16 at 00:20 the day after the departure: the VietQR reads the real instant', () => {
  it('check-out VietQR sends checkoutAt 00:20 of today, never of the departure day; B18 not touched', async () => {
    const today = todayLocal();
    const r = mockControl.rsv.reservations.find((x) => x.guestName === 'Phạm Huy')!;
    // Departure yesterday: at 00:20 the business day is still yesterday (BR-010), so the stay is due out.
    r.departureDate = shiftDay(today, -1);
    for (const s of r.segments ?? []) s.toDate = r.departureDate;
    vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
    vi.setSystemTime(at(today, '00:20'));
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const sent: Array<{ path: string; body: Record<string, unknown> }> = [];
    const on = ({ request }: { request: Request }) => {
      const path = new URL(request.url).pathname;
      if (request.method === 'POST' && /\/(vietqr|actions\/check-out)$/.test(path))
        void request
          .clone()
          .json()
          .then((body: Record<string, unknown>) => sent.push({ path, body }));
    };
    server.events.on('request:start', on);
    onTestFinished(() => {
      server.events.removeListener('request:start', on);
    });

    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
    await user.click(
      await screen.findByRole('button', {
        name: new RegExp(`^${tv('pay.vietqr_create', { amount: '' }).trim()}`),
      }),
    );
    await waitFor(() => expect(sent.filter((x) => /\/vietqr$/.test(x.path))).toHaveLength(1));
    const qr = sent.find((x) => /\/vietqr$/.test(x.path))!.body;
    expect(qr.purpose).toBe('check_out');
    expect(qr.checkoutAt).toBe(`${today}T00:20:00+07:00`);
    expect(sent.some((x) => /check-out$/.test(x.path))).toBe(false);
  });
});
