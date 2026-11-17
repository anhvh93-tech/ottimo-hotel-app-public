// @vitest-environment jsdom
// "From X / month" on the room cards (FB-INV-010 Dot 1, CPY Dot 1 section 2): only room types with a positive figure
// in the getPublicMonthlyRates answer change; the others keep "Monthly rate on request" – never "From" without a
// number, never a 0.
import { describe, expect, it } from 'vitest';
import { en } from '../content/en';
import { BOOKING_STRINGS } from './booking-strings/all';
import { fxQuote } from './fx';
import { fillRoomPrices } from './room-prices';

const card = (slug: string) => `
  <div class="room-price" data-room-price="${slug}">
    <p data-rp-fallback>${en.rooms.priceFallback}</p>
    <p data-rp-from hidden>From <data class="rp-amt"></data> / month</p>
    <p data-rp-note="in" hidden>${en.rooms.taxIn} ${en.rooms.priceNote}</p>
    <p data-rp-note="out" hidden>${en.rooms.taxOut} ${en.rooms.priceNote}</p>
  </div>`;

const visible = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>('p')]
    .filter((p) => !p.hidden)
    .map((p) => p.textContent)
    .join(' | ');

describe('room cards', () => {
  it('fills the types the API priced; a missing type or a 0 keeps the fallback text', () => {
    document.body.innerHTML = ['a', 'b', 'c'].map(card).join('');
    const done = fillRoomPrices(
      document,
      {
        estimate: true,
        currency: 'VND',
        taxIncluded: true,
        roomTypes: [
          { roomType: 'a', label: 'A', monthlyFromVnd: 8_500_000 },
          { roomType: 'b', label: 'B', monthlyFromVnd: 0 },
        ],
        computedAt: '2026-11-16T10:00:00+07:00',
      },
      'en',
    );
    expect(done).toEqual(['a']);
    const [a, b, c] = [...document.querySelectorAll('[data-room-price]')];
    expect(visible(a!)).toBe(
      'From 8,500,000 VND / month | Taxes included. Final rate confirmed when we contact you. Electricity and water billed on actual use.',
    );
    expect(a!.querySelector('data')!.getAttribute('value')).toBe('8500000');
    expect(visible(b!)).toBe('Monthly rate on request');
    expect(visible(c!)).toBe('Monthly rate on request');
    expect(document.body.textContent).not.toMatch(/\b0\u00a0VND/);
  });

  it('taxIncluded false → "Before taxes."', () => {
    document.body.innerHTML = card('a');
    fillRoomPrices(
      document,
      {
        estimate: true,
        currency: 'VND',
        taxIncluded: false,
        roomTypes: [{ roomType: 'a', label: 'A', monthlyFromVnd: 8_500_000 }],
        computedAt: '2026-11-16T10:00:00+07:00',
      },
      'en',
    );
    expect(visible(document.body)).toMatch(/\| Before taxes\. /);
  });

  it('FB-INV-011: with fx, "≈ US$334 / month" + the rate date follow the VND line; without fx, VND only', () => {
    const base = {
      estimate: true as const,
      currency: 'VND' as const,
      taxIncluded: true,
      roomTypes: [{ roomType: 'a', label: 'A', monthlyFromVnd: 8_500_000 }],
      computedAt: '2026-11-17T10:00:00+07:00',
    };
    const fx = { base: 'VND', source: 'vietcombank', asOf: '2026-11-17', rates: { USD: 25450 } };
    document.body.innerHTML = card('a');
    const q = fxQuote({ ...base, fx }, 'en', '2026-11-17');
    fillRoomPrices(document, base, 'en', { fx: q, strings: BOOKING_STRINGS.en.estimate.fx });
    expect(visible(document.body).replace(/\u00a0/g, ' ')).toBe(
      'From 8,500,000 VND / month | ≈ US$334 / month | Estimate at the 17 Nov 2026 rate. Payment in VND. | Taxes included. Final rate confirmed when we contact you. Electricity and water billed on actual use.',
    );
    expect(document.querySelector('.rp-fx-amt')!.getAttribute('value')).toBe('334');
    // a second fill (never two copies), then one without a rate: back to the VND card
    fillRoomPrices(document, base, 'en', { fx: q, strings: BOOKING_STRINGS.en.estimate.fx });
    expect(document.querySelectorAll('.rp-fx')).toHaveLength(1);
    fillRoomPrices(document, base, 'en', { fx: null, strings: BOOKING_STRINGS.en.estimate.fx });
    expect(document.querySelector('.rp-fx, .rp-fx-note')).toBeNull();
    expect(visible(document.body).replace(/\u00a0/g, ' ')).toMatch(
      /^From 8,500,000 VND \/ month \| Taxes included\./,
    );
  });

  it('FB-INV-011: text from the API never becomes markup (textContent only)', () => {
    document.body.innerHTML = card('a');
    fillRoomPrices(
      document,
      {
        estimate: true,
        currency: 'VND',
        taxIncluded: true,
        roomTypes: [{ roomType: 'a', label: 'A', monthlyFromVnd: 8_500_000 }],
        computedAt: '2026-11-17T10:00:00+07:00',
      },
      'en',
      {
        fx: { currency: 'USD', rate: 25450, asOf: '2026-11-17' },
        strings: { month: () => '<img src=x onerror=alert(1)>', note: () => '<b>x</b>' },
      },
    );
    expect(document.querySelector('img, b')).toBeNull();
    expect(document.querySelector('.rp-fx')!.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});
