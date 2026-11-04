// @vitest-environment jsdom
// The estimate box in the DOM (price-estimate.ts) after the LP-v2 review (round 4, Phản hồi & sửa):
// FB-R4-UXD-FE-01 by the month first → one call with stayType=long, then the invitation (or nothing on 404);
// FE-04 the amount alone on its line; FE-07 the waiting line is not faded; FE-09 the status line never keeps a price
// that is gone ("Estimated rate cleared." – CPY 13.3); FE-10 the nights hint follows the API answer (longFor).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormValues, PublicPriceEstimate } from './booking-logic';
import { BOOKING_STRINGS } from './booking-strings/all';
import type { EstimateOutcome } from './booking-transport';
import { initEstimate } from './price-estimate';

const S = BOOKING_STRINGS.en;
const ROOM = 'standard-studio-garden-view';

const form = (over: Partial<FormValues> = {}): FormValues => ({
  stayType: 'short',
  checkIn: '2026-11-12',
  checkOut: '2026-11-15',
  arrival: '',
  months: '',
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
  consentVersion: '2026-11-01',
  ...over,
});

const priced = (search: string): PublicPriceEstimate => {
  const q = new URLSearchParams(search);
  if (q.get('stayType') === 'long' || !q.get('departure'))
    return {
      estimate: true,
      currency: 'VND',
      taxIncluded: true,
      roomType: q.get('roomType')!,
      stayKind: 'long',
      arrival: q.get('arrival')!,
      priceAvailable: false,
      unavailableReason: 'monthly_offer',
      notes: [],
      computedAt: '2026-11-03T10:00:00+07:00',
    };
  const nights = Math.round(
    (Date.parse(q.get('departure')!) - Date.parse(q.get('arrival')!)) / 864e5,
  );
  if (nights >= 30)
    return {
      ...priced(`roomType=${ROOM}&stayType=long&arrival=${q.get('arrival')}`),
      departure: q.get('departure')!,
    };
  return {
    estimate: true,
    currency: 'VND',
    taxIncluded: true,
    roomType: q.get('roomType')!,
    stayKind: 'short',
    arrival: q.get('arrival')!,
    departure: q.get('departure')!,
    priceAvailable: true,
    shortStay: {
      nights,
      roomSubtotalVnd: 733667 * nights,
      upliftNights: 0,
      losDiscountPct: 0,
      losDiscountVnd: 0,
      extraPersonFeeVnd: 0,
      totalVnd: 733667 * nights,
      nightlyAvgVnd: 733667,
    },
    notes: [],
    computedAt: '2026-11-03T10:00:00+07:00',
    estimateToken: 'pe1.e2e.sig',
    expiresAt: '2099-01-01T00:00:00+07:00',
  };
};

function setup(answer: (search: string, n: number) => EstimateOutcome | Promise<EstimateOutcome>) {
  document.body.innerHTML =
    '<div id="box" hidden></div><p id="live" role="status"></p><p id="sent" hidden></p>';
  const calls: string[] = [];
  let values = form();
  const box = initEstimate({
    box: document.getElementById('box')!,
    live: document.getElementById('live')!,
    sentWith: document.getElementById('sent'),
    strings: S,
    lang: 'en',
    values: () => values,
    ctx: () => ({ today: '2026-11-01', max: '2027-11-01', capacity: 3 }),
    firstRoom: () => ROOM,
    fetchEstimate: (search) => {
      calls.push(search);
      return Promise.resolve(answer(search, calls.length));
    },
    now: () => Date.parse('2026-11-03T10:00:00+07:00'),
  });
  const el = () => document.getElementById('box')!;
  const live = () => document.getElementById('live')!.textContent;
  const set = async (over: Partial<FormValues>) => {
    values = { ...values, ...over };
    box.update();
    await vi.advanceTimersByTimeAsync(1200); // debounce 400 ms + status line 700 ms
  };
  return { box, calls, el, live, set, values: () => values };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('FB-R4-UXD-FE-01 – "By the month" first', () => {
  const month = {
    stayType: 'long' as const,
    arrival: '2026-12-01',
    months: '3',
    checkIn: '',
    checkOut: '',
  };

  it('no answer yet → one call with stayType=long (no departure, no months), then the invitation', async () => {
    const t = setup((s) => ({ kind: 'ok', body: priced(s) }));
    await t.set(month);
    expect(t.calls).toEqual([
      `roomType=${ROOM}&stayType=long&arrival=2026-12-01&adults=2&children=0&infants=0`,
    ]);
    expect(t.el().hidden).toBe(false);
    expect(t.el().dataset.state).toBe('offer');
    expect(t.el().querySelector('.est-lbl')!.textContent).toBe(S.priceMonthlyOffer.label);
    expect(t.el().textContent).not.toMatch(/\d|Estimated rate/);
    expect(t.live()).toBe(S.priceMonthlyOffer.live);
    // prices are known to be on: another month change shows the invitation without asking again
    await t.set({ arrival: '2026-12-05', months: '6' });
    expect(t.calls).toHaveLength(1);
    expect(t.el().dataset.state).toBe('offer');
  });

  it('"Any room" by the month asks with the first room type of the list', async () => {
    const t = setup((s) => ({ kind: 'ok', body: priced(s) }));
    await t.set({ ...month, roomType: '' });
    expect(new URLSearchParams(t.calls[0]).get('roomType')).toBe(ROOM);
    expect(t.el().dataset.state).toBe('offer');
  });

  it('404 = prices off: the box stays hidden and nothing more is asked, by the month or by the night', async () => {
    const t = setup(() => ({ kind: 'off' }));
    await t.set(month);
    expect(t.calls).toHaveLength(1);
    expect(t.el().hidden).toBe(true);
    await t.set({ stayType: 'short', checkIn: '2026-11-12', checkOut: '2026-11-15' });
    await t.set({ ...month, arrival: '2026-12-09' });
    expect(t.calls).toHaveLength(1);
    expect(t.el().hidden).toBe(true);
  });

  it('a passing error (503) shows nothing and asks again on the next change; 429 stops', async () => {
    const t = setup((s, n) =>
      n === 1 ? { kind: 'error' } : n === 2 ? { kind: 'rate' } : { kind: 'ok', body: priced(s) },
    );
    await t.set(month);
    expect(t.el().hidden).toBe(true);
    await t.set({ arrival: '2026-12-02' });
    expect(t.calls).toHaveLength(2);
    await t.set({ arrival: '2026-12-03' });
    expect(t.calls).toHaveLength(2);
    expect(t.el().hidden).toBe(true);
  });

  it('no arrival date yet: no call', async () => {
    const t = setup((s) => ({ kind: 'ok', body: priced(s) }));
    await t.set({ ...month, arrival: '' });
    expect(t.calls).toHaveLength(0);
  });
});

describe('S3 layout and the status line', () => {
  it('FB-04: the amount alone in .est-main, "for 3 nights" a line of its own (U+00A0 inside)', async () => {
    const t = setup((s) => ({ kind: 'ok', body: priced(s) }));
    await t.set({});
    const main = t.el().querySelector('.est-main')!;
    expect(main.textContent).toBe('2,201,001\u00a0VND');
    expect(main.querySelector('data')!.getAttribute('value')).toBe('2201001');
    const nights = [...t.el().querySelectorAll('.est-nights')].map((n) => n.textContent);
    expect(nights).toEqual(['for 3\u00a0nights']);
    expect(main.nextElementSibling!.className).toBe('est-nights'); // below the amount (en word order)
    expect(t.live()).toBe('Estimated rate updated: 2,201,001\u00a0VND for 3\u00a0nights');
  });

  it('FB-09: back to S0/S1 after a price → the old price leaves the status line, then "Estimated rate cleared."', async () => {
    const t = setup((s) => ({ kind: 'ok', body: priced(s) }));
    await t.set({});
    expect(t.live()).toContain('2,201,001');
    t.box.update();
    await t.set({ roomType: '' }); // "Any room" = S1
    expect(t.el().dataset.state).toBe('any-room');
    expect(t.live()).toBe(S.estimate.liveCleared);
    // the price must already be gone before the cleared sentence is read
    await t.set({ roomType: ROOM });
    await t.set({ checkOut: '' });
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
});

describe('FB-R4-UXD-FE-10 – the nights hint follows the API (longFor)', () => {
  it('29 nights priced → false; 30 nights answered monthly_offer → true; other values → undefined', async () => {
    const t = setup((s) => ({ kind: 'ok', body: priced(s) }));
    await t.set({ checkIn: '2026-11-12', checkOut: '2026-12-11' }); // 29 nights
    expect(t.box.longFor(t.values())).toBe(false);
    await t.set({ checkOut: '2026-12-12' }); // 30 nights
    expect(t.el().dataset.state).toBe('offer');
    expect(t.box.longFor(t.values())).toBe(true);
    expect(t.box.longFor({ ...t.values(), checkOut: '2026-12-13' })).toBeUndefined();
  });
});
