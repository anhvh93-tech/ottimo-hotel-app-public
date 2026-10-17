// Copy of every published language (ADR-014 3.4, US-152 AC1): same shape, nothing empty, brand voice rules that a
// machine can check, characters inside the self-hosted font subsets (concept 3.3).
// Tests marked [content v1.1] pin decisions of mock v1.1 that FB-INV-002 changes (channel order: Zalo first in both
// languages; no room count; 4 room types may move) – update them together with the copy of mock v1.2.
import { describe, expect, it } from 'vitest';
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
const texts = (c: Copy) => leaves(c).filter((l): l is [string, string] => typeof l[1] === 'string');

describe('page copy EN + VI', () => {
  it('both languages fill exactly the same fields', () => {
    expect(shape(vi)).toEqual(shape(en));
  });

  it.each([en, vi])('$lang: no empty string', (c) => {
    for (const [p, v] of texts(c)) if (p !== 'footer.backToTop') expect(v.trim(), p).not.toBe('');
  });

  it.each([en, vi])('$lang: title ≤ 60 and description ≤ 160 characters (ADR-014 5)', (c) => {
    expect(c.meta.title.length).toBeLessThanOrEqual(60);
    expect(c.meta.description.length).toBeLessThanOrEqual(160);
  });

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

  it('VI distances use a decimal comma, EN a decimal point (concept 9)', () => {
    for (const r of vi.location.rows) expect(r.distance).not.toMatch(/\d\.\d/);
    for (const r of en.location.rows) expect(r.distance).not.toMatch(/\d,\d/);
  });

  it('[content v1.1] card order and sticky bar follow ESC-020 L2-A: EN WhatsApp first, VI Zalo first', () => {
    expect(en.contact.order[0]).toBe('intl');
    expect(vi.contact.order[0]).toBe('zalo');
    expect(en.sticky.first).toBe('whatsapp');
    expect(vi.sticky.first).toBe('zalo');
  });

  it('the anti-impersonation answer is in the FAQ of both languages (SEC DOM-06, US-150 AC3)', () => {
    expect(en.faq.items.some((i) => /never ask for card numbers/.test(i.a))).toBe(true);
    expect(vi.faq.items.some((i) => /không bao giờ hỏi số thẻ/.test(i.a))).toBe(true);
  });

  it.todo(
    '[content v1.2] no room count in the copy, Zalo first in both languages (FB-INV-002 points 1, 4)',
  );

  it('[content v1.1] room types are the 4 of the e-brochure, with the same photos in both languages', () => {
    expect(en.rooms.items.map((r) => r.id)).toEqual(['city', 'garden', 'premium', 'signature']);
    expect(vi.rooms.items.map((r) => r.photos)).toEqual(en.rooms.items.map((r) => r.photos));
  });
});

describe('site facts (site.json)', () => {
  it('validates and keeps the INV contact data of ESC-020', () => {
    expect(site.phone.e164).toBe('+84844440909');
    expect(site.mapUrl).toBe('https://maps.app.goo.gl/oYos42G5YvUEcDCc6');
    expect(site.contact.email).toBe('booking@ottimo.vn');
  });

  it('accepts only a shared mailbox on the OTTIMO domain, or nothing (ADR-014 4.2)', () => {
    expect(isOttimoMailbox('booking@ottimo.vn', 'ottimo.vn')).toBe(true);
    expect(isOttimoMailbox('someone@gmail.com', 'ottimo.vn')).toBe(false);
    const withEmail = (email: string) => ({ ...raw, contact: { ...raw.contact, email } });
    expect(siteSchema.safeParse(withEmail('nguyen.van.a@gmail.com')).success).toBe(false);
    expect(siteSchema.safeParse(withEmail('')).success).toBe(true);
  });

  it('rejects a non-https chat link or a map that is not the Google Maps pin', () => {
    expect(siteSchema.safeParse({ ...raw, mapUrl: 'https://example.com/map' }).success).toBe(false);
    expect(
      siteSchema.safeParse({ ...raw, contact: { ...raw.contact, zaloUrl: 'http://zalo.me/1' } })
        .success,
    ).toBe(false);
  });
});
