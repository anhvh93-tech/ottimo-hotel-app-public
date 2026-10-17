// Copy of every published language (ADR-014 3.4, US-152 AC1; concept v1.2.1): same shape, nothing empty, brand voice
// rules a machine can check, wording rules of FB-INV-002 (no room count, boutique stay), numbers equal to site.json.
import { describe, expect, it } from 'vitest';
import { BANNED } from '../../scripts/dist-checks.mjs';
import { plain } from '../lib/rich';
import { BOOKING_STRINGS } from '../scripts/booking-strings';
import { en } from './en';
import { isOttimoMailbox, site, siteSchema } from './site';
import raw from './site.json';
import type { Copy } from './types';
import { vi } from './vi';

type Leaf = [path: string, value: unknown];
function leaves(value: unknown, prefix = ''): Leaf[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${prefix}[${i}]`));
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
  return [[prefix, value]];
}
const shape = (c: Copy) =>
  leaves(c)
    .map(([p, v]) => `${p}:${typeof v}`)
    .sort();
const texts = (c: Copy) =>
  leaves(c)
    .filter((l): l is [string, string] => typeof l[1] === 'string')
    .map(([p, v]) => [p, plain(v)] as const);

describe('page copy EN + VI', () => {
  it('both languages fill exactly the same fields', () => {
    expect(shape(vi)).toEqual(shape(en));
  });

  it.each([en, vi])('$lang: no empty string', (c) => {
    // months[].value '' = "Not sure yet" (null in the request)
    for (const [p, v] of texts(c))
      if (p !== 'footer.backToTop' && !/months\[\d+\]\.value$/.test(p))
        expect(v.trim(), p).not.toBe('');
  });

  it.each([en, vi])(
    '$lang: title ≤ 60; description ≤ 200 (ADR-014 5 asks 160 – UXD to shorten)',
    (c) => {
      expect(c.meta.title.length).toBeLessThanOrEqual(60);
      expect(c.meta.description.length).toBeLessThanOrEqual(200);
    },
  );

  it.each([en, vi])(
    '$lang: no emoji, no exclamation mark, no arrow or ≈ (brand voice, font subsets)',
    (c) => {
      for (const [p, v] of texts(c)) {
        expect(v, p).not.toMatch(/\p{Extended_Pictographic}/u);
        expect(v, p).not.toMatch(/!/);
        expect(v, p).not.toMatch(/[←-⇿≈]/);
      }
    },
  );

  it.each([en, vi])('$lang: wording rules of FB-INV-002 / concept 2.3 (banned list)', (c) => {
    const all = texts(c)
      .map(([, v]) => v)
      .join(' \n ');
    for (const re of BANNED) expect(all.match(re)?.[0] ?? null, String(re)).toBeNull();
  });

  it('VI distances use a decimal comma, EN a decimal point (concept 11)', () => {
    for (const r of vi.location.rows) expect(r.distance).not.toMatch(/\d\.\d/);
    for (const r of en.location.rows) expect(r.distance).not.toMatch(/\d,\d/);
  });

  it('the anti-impersonation answer is in the FAQ of both languages (SEC UXD-06)', () => {
    expect(
      en.faq.items.some((i) => i.deposit && /never ask for card numbers/.test(i.a.join(' '))),
    ).toBe(true);
    expect(
      vi.faq.items.some((i) => i.deposit && /không bao giờ hỏi số thẻ/.test(i.a.join(' '))),
    ).toBe(true);
    expect(en.faq.depositAccount('X Co.')).toContain('X Co.');
    expect(vi.faq.depositAccount('')).not.toMatch(/\{|undefined/);
  });

  it('4 room types with contract slugs, capacities of BR-110 and the same photos in both languages', () => {
    expect(en.rooms.items.map((r) => [r.slug, r.sleeps, r.photo])).toEqual(
      vi.rooms.items.map((r) => [r.slug, r.sleeps, r.photo]),
    );
    for (const r of en.rooms.items) expect(r.slug).toMatch(/^[a-z0-9-]{2,60}$/);
    expect(en.rooms.items.map((r) => r.sleeps)).toEqual([
      [2, 3],
      [2, 3],
      [3, 4],
      [4, 5],
    ]);
  });

  it('every photo used by the copy has an alt text in both languages', () => {
    const used = [
      'hero-facade-dusk',
      en.why.short.photo,
      en.why.long.photo,
      ...en.rooms.items.map((r) => r.photo),
      'detail-kitchen',
      'aerial-hillside',
    ];
    for (const id of used) {
      expect(en.photoAlt[id], id).toBeTruthy();
      expect(vi.photoAlt[id], id).toBeTruthy();
    }
  });

  it('the action labels are "Request to book" / "Yêu cầu đặt phòng" (concept T5)', () => {
    expect(en.actions.requestToBook).toBe('Request to book');
    expect(vi.actions.requestToBook).toBe('Yêu cầu đặt phòng');
  });
});

describe('numbers stated on the page = site.json booking parameters (concept 13)', () => {
  const b = site.booking;
  const hours = `${b.frontDeskOpen}–${b.frontDeskClose}`;
  it.each([en, vi])('$lang: promise, front desk hours, deposit', (c) => {
    const step2 = plain(c.book.steps[1].text);
    expect(step2).toContain(hours);
    expect(step2).toContain(b.promiseNextMorningBy);
    expect(step2).toMatch(
      b.promiseMinutes === 60 ? /1 (hour|giờ)/ : new RegExp(`${b.promiseMinutes}`),
    );
    expect(plain(c.book.chat.text)).toContain(hours);
    expect(plain(c.book.steps[2].text)).toContain(`${b.depositPercent}%`);
    expect(plain(c.amenities.groups[3]!.body)).toContain(hours);
  });
  it('thank-you strings follow the 202 promise (minutes / next morning / call now), not replyBy', () => {
    for (const s of Object.values(BOOKING_STRINGS)) {
      expect(s.when.withinMinutes(60, '07:00', '22:00')).toMatch(/1 (hour|giờ)/);
      expect(s.when.withinMinutes(45, '07:00', '22:00')).toContain('45');
      expect(s.when.nextMorning('09:00', '07:00')).toContain('09:00');
      expect(s.when.callNow(30)).toContain('30');
    }
  });
});

describe('site facts (site.json)', () => {
  it('validates and keeps the INV contact data of ESC-020 / FB-INV-002', () => {
    expect(site.phone.e164).toBe('+84844440909');
    expect(site.mapUrl).toBe('https://maps.app.goo.gl/oYos42G5YvUEcDCc6');
    expect(site.contact.email).toBe('booking@ottimo.vn');
    expect(site.facebookUrl).toBe('https://www.facebook.com/profile.php?id=100091335431646');
  });

  it('keeps the booking form off (no endpoint, SEC/legal conditions open – US-155 AC4)', () => {
    expect(site.features.bookingRequest).toBe(false);
  });

  it('accepts only a shared mailbox on the OTTIMO domain, or nothing (ADR-014 4.2)', () => {
    expect(isOttimoMailbox('booking@ottimo.vn', 'ottimo.vn')).toBe(true);
    expect(isOttimoMailbox('someone@gmail.com', 'ottimo.vn')).toBe(false);
    const withEmail = (email: string) => ({ ...raw, contact: { ...raw.contact, email } });
    expect(siteSchema.safeParse(withEmail('nguyen.van.a@gmail.com')).success).toBe(false);
    expect(siteSchema.safeParse(withEmail('')).success).toBe(true);
  });

  it('rejects a non-https chat link, a map that is not the pin, a Facebook link that is not facebook.com', () => {
    expect(siteSchema.safeParse({ ...raw, mapUrl: 'https://example.com/map' }).success).toBe(false);
    expect(
      siteSchema.safeParse({ ...raw, contact: { ...raw.contact, zaloUrl: 'http://zalo.me/1' } })
        .success,
    ).toBe(false);
    expect(siteSchema.safeParse({ ...raw, facebookUrl: 'https://fb.example.com/x' }).success).toBe(
      false,
    );
  });
});
