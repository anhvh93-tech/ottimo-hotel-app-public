// v1.0.4 (FE-A) – BUG-R4-050 (P2, QA2 05/11): H16 after 24:00 of the departure day. The Desk built the instant of the
// typed time as "departure date + time", so 00:20 typed at 00:20 the day after the departure read as 00:20 OF the
// departure day – the valid after-midnight window, 24 h early: the check-out VietQR was capped at 0 đ (422
// AMOUNT_EXCEEDS_BALANCE) and a typed extra-night rate could not be priced (extraNightRateVnd NOT_ALLOWED), so
// "Hoàn tất" stayed blocked.
// ARC (ARC-on-v104-bug050-rule.md mục 1 / mục 6, FB-R4-ARC-FE-PR86-01): `checkoutInstant` puts the time on the
// business-day axis of the click, as the server reads `checkoutTime` (summary, B18) – before the rollover on the
// business day + 1 – and sends nothing outside `[stayDeparture 00:00, stayDeparture + 1 rollover)`. B18 still sends
// `checkoutTime` only (BR-416). The PR #68 case "left 04:30, checked out from 06:00" cannot hold while B18 sends
// `checkoutTime` only (ARC mục 2): 04:30 typed at 06:10 reads as the next 04:30, as B18 does (U5).
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { checkoutInstant, shiftDay, todayLocal } from '../app/dates';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';
import { renderApp, tv } from '../test/render';

/** D = departure day of the stay, D1 = D + 1, Dm1 = D − 1; the business day is the value passed (ARC mục 6). */
const D = '2029-11-25';
const D1 = shiftDay(D, 1);
const Dm1 = shiftDay(D, -1);
const iso = (day: string, hhmm: string) => `${day}T${hhmm}:00+07:00`;

describe('checkoutInstant – ARC U1–U12 (business day of the click, stay departure bounds)', () => {
  it('U1 – 00:20 at D1 00:20 (business day D) → D1 00:20 (BUG-R4-050 a, b)', () => {
    expect(checkoutInstant('00:20', D, D)).toBe(iso(D1, '00:20'));
  });

  it('U2 – 23:50 at D1 00:20 (business day D) → D 23:50', () => {
    expect(checkoutInstant('23:50', D, D)).toBe(iso(D, '23:50'));
  });

  it('U3 – 00:25 at D1 00:20 (typed a few minutes ahead) → D1 00:25, never 24 h early', () => {
    expect(checkoutInstant('00:25', D, D)).toBe(iso(D1, '00:25'));
  });

  it('U4 – 00:05 at D 23:55 (typed past midnight a few minutes ahead) → D1 00:05', () => {
    expect(checkoutInstant('00:05', D, D)).toBe(iso(D1, '00:05'));
  });

  it('U5 – 04:30 at D 06:10 (business day D) → D1 04:30, as B18 reads checkoutTime (ca #68: ARC mục 2)', () => {
    expect(checkoutInstant('04:30', D, D)).toBe(iso(D1, '04:30'));
  });

  it('U6 – 01:00 at D 01:00 (business day D−1, the after-midnight window) → D 01:00', () => {
    expect(checkoutInstant('01:00', Dm1, D)).toBe(iso(D, '01:00'));
  });

  it('U7 – 04:30 at D 03:00 (business day D−1, window) → D 04:30', () => {
    expect(checkoutInstant('04:30', Dm1, D)).toBe(iso(D, '04:30'));
  });

  it('U8 – 07:00 at D 04:30 (business day D−1, window) → nothing (outside what the server takes)', () => {
    expect(checkoutInstant('07:00', Dm1, D)).toBeUndefined();
  });

  it('U9 – daytime on the departure day → D at that time', () => {
    expect(checkoutInstant('06:00', D, D)).toBe(iso(D, '06:00'));
    expect(checkoutInstant('11:00', D, D)).toBe(iso(D, '11:00'));
    expect(checkoutInstant('19:30', D, D)).toBe(iso(D, '19:30'));
  });

  it('U10 – the rollover is the property parameter: 05:30 with 05:00 → D 05:30; with 06:00 → D1 05:30', () => {
    expect(checkoutInstant('05:30', D, D, '05:00')).toBe(iso(D, '05:30'));
    expect(checkoutInstant('05:30', D, D)).toBe(iso(D1, '05:30'));
  });

  it('U11 – a stay extended by a child booking (departureDate D, stayDepartureDate D1): 11:00 on D1 → D1 11:00', () => {
    expect(checkoutInstant('11:00', D1, D1)).toBe(iso(D1, '11:00'));
    // the booking's own departure as the bound (the old code) would put it outside: 422 checkoutAt DATE_INVALID
    expect(checkoutInstant('11:00', D1, D)).toBeUndefined();
  });

  it('U12 – no time, or not HH:mm → nothing', () => {
    expect(checkoutInstant('', D, D)).toBeUndefined();
    expect(checkoutInstant('4:30', D, D)).toBeUndefined();
  });
});

/**
 * H16 at 00:20 of today for Phạm Huy, departing yesterday: the business day is still yesterday (BR-010), so the stay
 * is due out. Captures the VietQR (and any B18) bodies.
 */
function afterMidnight() {
  const today = todayLocal();
  const r = mockControl.rsv.reservations.find((x) => x.guestName === 'Phạm Huy')!;
  r.departureDate = shiftDay(today, -1);
  for (const s of r.segments ?? []) s.toDate = r.departureDate;
  vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
  vi.setSystemTime(new Date(iso(today, '00:20')));
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
  return { today, r, sent };
}

async function vietQrAt(
  user: ReturnType<typeof renderApp>['user'],
  sent: ReturnType<typeof afterMidnight>['sent'],
  typed?: string,
) {
  await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
  if (typed)
    fireEvent.change(await screen.findByLabelText(new RegExp(tv('checkout.departure_time'))), {
      target: { value: typed },
    });
  await user.click(await screen.findByRole('button', { name: tv('co.go_bill') }));
  await user.click(
    await screen.findByRole('button', {
      name: new RegExp(`^${tv('pay.vietqr_create', { amount: '' }).trim()}`),
    }),
  );
  await waitFor(() => expect(sent.filter((x) => /\/vietqr$/.test(x.path))).toHaveLength(1));
  return sent.find((x) => /\/vietqr$/.test(x.path))!.body;
}

describe('BUG-R4-050 – H16 at 00:20 the day after the departure: the VietQR reads the real instant', () => {
  it('prefilled 00:20 → checkoutAt 00:20 of today, never of the departure day; B18 not touched', async () => {
    const { today, r, sent } = afterMidnight();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    const qr = await vietQrAt(user, sent);
    expect(qr.purpose).toBe('check_out');
    expect(qr.checkoutAt).toBe(iso(today, '00:20'));
    expect(sent.some((x) => /check-out$/.test(x.path))).toBe(false);
  });

  // FB-R4-ARC-FE-PR86-02: half (b) of BUG-R4-050 – the typed extra-night rate is priced by the probe (VietQR
  // check_out at DUE_PROBE_VND, 422 max); at 00:20 of the departure day it was NOT_ALLOWED (no extra night there).
  it('typed extra-night rate at 00:20 → the probe sends checkoutAt 00:20 of today with extraNightRateVnd', async () => {
    const { today, r, sent } = afterMidnight();
    mockControl.stay.minibarChecks.set(r.id, []);
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    await user.click(await screen.findByRole('button', { name: tv('co.go_extras') }));
    const rate = await screen.findByLabelText(
      new RegExp(`^${tv('checkout.extra_night_rate_label')}`),
    );
    fireEvent.change(rate, { target: { value: '600.000' } });
    await waitFor(() =>
      expect(sent.filter((x) => /\/vietqr$/.test(x.path) && x.body.extraNightRateVnd)).toHaveLength(
        1,
      ),
    );
    const probe = sent.find((x) => /\/vietqr$/.test(x.path))!.body;
    expect(probe).toMatchObject({ purpose: 'check_out', extraNightRateVnd: 600_000 });
    expect(Number(probe.amountVnd)).toBeGreaterThan(1_000_000_000);
    expect(probe.checkoutAt).toBe(iso(today, '00:20'));
    expect(sent.some((x) => /check-out$/.test(x.path))).toBe(false);
  });

  it('U3 on the page – 00:25 typed at 00:20 → checkoutAt 00:25 of today', async () => {
    const { today, r, sent } = afterMidnight();
    const { user } = renderApp(`/reservations/${r.id}/check-out`, 'qa.fd');
    const qr = await vietQrAt(user, sent, '00:25');
    expect(qr.checkoutAt).toBe(iso(today, '00:25'));
    expect(sent.some((x) => /check-out$/.test(x.path))).toBe(false);
  });
});
