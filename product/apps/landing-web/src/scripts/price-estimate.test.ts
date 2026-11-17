// @vitest-environment jsdom
// The monthly price box in the DOM (price-estimate.ts) – FB-INV-010 Dot 1: room type + move-in date + months →
// getPublicPriceEstimate stayType=long&months=n; "From X / month" + the total for the months chosen; before a
// move-in date, the monthly-rates figure of the room type (no token). Kept from LP-v2: FE-07 the waiting line is not
// faded; FE-09 the status line never keeps a price that is gone (CPY 13.3); 404 = prices off for the visit.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormValues, PublicPriceEstimate } from './booking-logic';
import { BOOKING_STRINGS } from './booking-strings/all';
import type { EstimateOutcome } from './booking-transport';
import type { FxQuote } from './fx';
import { initEstimate } from './price-estimate';

const S = BOOKING_STRINGS.en;
const ROOM = 'standard-studio-garden-view';
const LABELS: Record<string, string> = {
  '1': '1 month',
  '3': '3 months',
  '6': '6 months',
  '12': '1 year',
};

const form = (over: Partial<FormValues> = {}): FormValues => ({
  arrival: '2026-12-01',
  months: '3',
  adults: 2,
  children: 0,
  infants: 0,
  roomType: ROOM,
  guestName: '',
  preferredChannel: 'zalo',
  phone: '',
  email: '',
  note: '',
  consent: false,
  website: '',
  locale: 'en',
  search: '',
  pathname: '/',
  referrer: '',
  ownHost: 'ottimo.vn',
  consentVersion: '2026-11-16',
  ...over,
});

const priced = (search: string): PublicPriceEstimate => {
  const q = new URLSearchParams(search);
  const months = Number(q.get('months'));
  return {
    estimate: true,
    currency: 'VND',
    taxIncluded: true,
    roomType: q.get('roomType')!,
    stayKind: 'long',
    arrival: q.get('arrival')!,
    priceAvailable: true,
    longStay: { months, monthlyFromVnd: 9_000_000, totalVnd: 9_000_000 * months },
    notes: [],
    computedAt: '2026-11-16T10:00:00+07:00',
    estimateToken: `pe1.${months}.sig`,
    expiresAt: '2099-01-01T00:00:00+07:00',
  };
};

function setup(
  answer: (search: string, n: number) => EstimateOutcome | Promise<EstimateOutcome>,
  start: Partial<FormValues> = {},
  monthly?: Record<string, number>,
  fx: FxQuote | null = null,
) {
  document.body.innerHTML =
    '<div id="box" hidden></div><p id="live" role="status"></p><p id="sent" hidden></p>';
  const calls: string[] = [];
  let values = form(start);
  const box = initEstimate({
    box: document.getElementById('box')!,
    live: document.getElementById('live')!,
    sentWith: document.getElementById('sent'),
    strings: S,
    lang: 'en',
    values: () => values,
    ctx: () => ({ today: '2026-11-01', max: '2027-11-01', capacity: 3 }),
    monthsLabel: () => LABELS[values.months] ?? '',
    monthlyFrom: (slug) =>
      monthly?.[slug] ? { vnd: monthly[slug]!, taxIncluded: true } : undefined,
    fx: () => fx,
    fetchEstimate: (search) => {
      calls.push(search);
      return Promise.resolve(answer(search, calls.length));
    },
    now: () => Date.parse('2026-11-16T10:00:00+07:00'),
  });
  const el = () => document.getElementById('box')!;
  const live = () => document.getElementById('live')!.textContent;
  const sent = () => document.getElementById('sent')!;
  const set = async (over: Partial<FormValues>) => {
    values = { ...values, ...over };
    box.update();
    await vi.advanceTimersByTimeAsync(1200); // debounce 400 ms + status line 700 ms
  };
  return { box, calls, el, live, sent, set, values: () => values };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('the form asks by the month (stayType=long&months=n)', () => {
  it('room + move-in date + months → one call; "From X / month" + total; token only for these values', async () => {
    const t = setup((s) => ({ kind: 'ok', body: priced(s) }));
    await t.set({ months: '6' });
    expect(t.calls).toEqual([
      `roomType=${ROOM}&stayType=long&arrival=2026-12-01&months=6&adults=2&children=0&infants=0`,
    ]);
    expect(t.el().hidden).toBe(false);
    expect(t.el().dataset.state).toBe('price');
    expect(t.el().querySelector('.est-lbl')!.textContent).toBe('Monthly rate');
    const main = t.el().querySelector('.est-main')!;
    expect(main.textContent).toBe('From 9,000,000 VND / month');
    expect(main.querySelector('data')!.getAttribute('value')).toBe('9000000');
    expect(t.el().querySelector('.est-line')!.textContent).toBe(
      'For 6 months: from 54,000,000 VND',
    );
    expect(t.el().querySelector('.est-note')!.textContent).toMatch(/^Taxes included\. /);
    expect(t.live()).toBe('Monthly rate updated: from 9,000,000 VND a month');
    expect(t.sent().hidden).toBe(false);
    expect(t.box.tokenFor(t.values())).toBe('pe1.6.sig');
    expect(t.box.tokenFor({ ...t.values(), months: '12' })).toBeUndefined();
    expect(t.box.doneLine()).toBe('Monthly rate: From 9,000,000 VND / month');
    // the total follows the months chosen
    await t.set({ months: '12' });
    expect(t.el().querySelector('.est-line')!.textContent).toBe('For 1 year: from 108,000,000 VND');
    await t.set({ months: '1' });
    expect(t.el().querySelector('.est-line')).toBeNull();
  });

  it('never a 0 or a guess: a figure the contract does not allow shows the neutral error', async () => {
    const t = setup((s, n) => (n === 1 ? { kind: 'ok', body: priced(s) } : { kind: 'error' }));
    await t.set({});
    await t.set({ months: '6' });
    expect(t.el().dataset.state).toBe('error');
    expect(t.el().textContent).not.toMatch(/\d/);
    expect(t.sent().hidden).toBe(true);
  });

  it('404 = prices off: the box stays hidden and nothing more is asked', async () => {
    const t = setup(() => ({ kind: 'off' }));
    await t.set({});
    expect(t.calls).toHaveLength(1);
    expect(t.el().hidden).toBe(true);
    await t.set({ arrival: '2026-12-09' });
    expect(t.calls).toHaveLength(1);
  });

  it('a passing error (503) shows nothing before any price and asks again on the next change; 429 stops', async () => {
    const t = setup((s, n) =>
      n === 1 ? { kind: 'error' } : n === 2 ? { kind: 'rate' } : { kind: 'ok', body: priced(s) },
    );
    await t.set({});
    expect(t.el().hidden).toBe(true);
    await t.set({ arrival: '2026-12-02' });
    expect(t.calls).toHaveLength(2);
    await t.set({ arrival: '2026-12-03' });
    expect(t.calls).toHaveLength(2);
    expect(t.el().hidden).toBe(true);
  });
});

describe('before a move-in date: the monthly-rates figure of the room type (page load)', () => {
  it('no call; "From X / month" without total and without token; prompt for a type without a figure', async () => {
    const t = setup(
      (s) => ({ kind: 'ok', body: priced(s) }),
      { arrival: '' },
      { [ROOM]: 8_500_000 },
    );
    t.box.pricesKnown();
    await vi.advanceTimersByTimeAsync(1200);
    expect(t.calls).toHaveLength(0);
    expect(t.el().hidden).toBe(false);
    expect(t.el().querySelector('.est-main')!.textContent).toBe('From 8,500,000 VND / month');
    expect(t.el().querySelector('.est-line')).toBeNull();
    expect(t.box.tokenFor(t.values())).toBeUndefined();
    expect(t.box.doneLine()).toBe('');
    expect(t.sent().hidden).toBe(true);
    await t.set({ roomType: 'signature-two-bedrooms' });
    expect(t.el().dataset.state).toBe('idle');
    expect(t.el().textContent).toBe(S.estimate.prompt);
    expect(t.live()).toBe(S.estimate.liveCleared);
    await t.set({ roomType: '' });
    expect(t.el().textContent).toBe(S.estimate.anyRoom);
    // with a date: the estimate at the move-in date replaces it
    await t.set({ roomType: ROOM, arrival: '2026-12-01' });
    expect(t.calls).toHaveLength(1);
    expect(t.el().querySelector('.est-main')!.textContent).toBe('From 9,000,000 VND / month');
  });

  it('no monthly-rates figure and no answer yet: nothing shown, nothing asked', async () => {
    const t = setup((s) => ({ kind: 'ok', body: priced(s) }), { arrival: '' });
    await t.set({});
    expect(t.calls).toHaveLength(0);
    expect(t.el().hidden).toBe(true);
  });
});

describe('the status line and the waiting state', () => {
  it('FB-09: back to S1 after a price → the old price leaves the status line, then the cleared sentence', async () => {
    const t = setup((s) => ({ kind: 'ok', body: priced(s) }));
    await t.set({});
    expect(t.live()).toContain('9,000,000');
    await t.set({ roomType: '' }); // "Any room" = S1
    expect(t.el().dataset.state).toBe('any-room');
    expect(t.live()).toBe(S.estimate.liveCleared);
    expect(t.live()).not.toMatch(/\d/);
  });

  it('FB-07: "Checking rates…" without an old number is .est-wait (never faded), not .est-line', async () => {
    let release: (o: EstimateOutcome) => void = () => undefined;
    const t = setup((s, n) =>
      n === 1
        ? { kind: 'ok', body: priced(s) }
        : new Promise<EstimateOutcome>((r) => {
            release = r;
          }),
    );
    await t.set({});
    await t.set({ roomType: '' }); // S1: the number is gone
    await t.set({ roomType: ROOM }); // asked again, the answer hangs > 300 ms
    expect(t.el().dataset.state).toBe('busy');
    expect(t.el().querySelector('.est-wait')!.textContent).toBe(S.estimate.loading);
    expect(t.el().querySelector('.est-line')).toBeNull();
    release({ kind: 'ok', body: priced(t.calls.at(-1)!) });
    await vi.advanceTimersByTimeAsync(800);
    expect(t.el().dataset.state).toBe('price');
  });

  it('FB-INV-011: with a rate, "≈ US$354 / month" + the rate date under the VND amount; the VND figure stays', async () => {
    const t = setup((s) => ({ kind: 'ok', body: priced(s) }), {}, undefined, {
      currency: 'USD',
      rate: 25450,
      asOf: '2026-11-17',
    });
    await t.set({ months: '6' });
    expect(t.el().querySelector('.est-amt')!.textContent).toBe('9,000,000\u00a0VND');
    expect(t.el().querySelector('.est-fx')!.textContent).toBe('≈ US$354 / month');
    expect(t.el().querySelector('.est-fx-amt')!.getAttribute('value')).toBe('354');
    expect(t.el().querySelector('.est-fx-note')!.textContent).toBe(
      'Estimate at the 17 Nov 2026 rate. Payment in VND.',
    );
  });

  it('FB-INV-011: no rate → no "≈" line (VND only, as before)', async () => {
    const t = setup((s) => ({ kind: 'ok', body: priced(s) }));
    await t.set({ months: '6' });
    expect(t.el().dataset.state).toBe('price');
    expect(t.el().querySelector('.est-fx, .est-fx-note')).toBeNull();
    expect(t.el().textContent).not.toContain('≈');
  });
});
