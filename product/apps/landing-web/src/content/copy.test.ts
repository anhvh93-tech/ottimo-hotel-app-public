// Copy of every published language (ADR-014 3.4, US-152 AC1; concept v1.2.1): same shape, nothing empty, brand voice
// rules a machine can check, wording rules of FB-INV-002 (no room count, boutique stay), numbers equal to site.json.
import { describe, expect, it } from 'vitest';
import { BANNED } from '../../scripts/dist-checks.mjs';
import { plain } from '../lib/rich';
import { BOOKING_STRINGS } from '../scripts/booking-strings';
import { en } from './en';
import { AMENITIES_PHOTO, GALLERY_TARGET, HERO_INTERVAL_MS, ROOM_GALLERIES } from './gallery';
import { HERO_EXCLUDED, HERO_PICKS, HERO_SLIDES, PICKER_SOURCES, photoIdForPick } from './hero';
import manifest from '../assets/photos/manifest.json';
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

  it.each([en, vi])('$lang: title ≤ 60; description ≤ 160 (ADR-014 5)', (c) => {
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
      AMENITIES_PHOTO,
      'aerial-hillside',
    ];
    for (const id of used) {
      expect(en.photoAlt[id], id).toBeTruthy();
      expect(vi.photoAlt[id], id).toBeTruthy();
    }
  });

  it('R3-Q52: hero slides and every room gallery photo exist and have alt text in both languages', () => {
    const known = new Set(manifest.photos.map((p) => p.id));
    const used = [...HERO_SLIDES, ...Object.values(ROOM_GALLERIES).flat()];
    for (const id of used) {
      expect(known.has(id), `${id} in manifest`).toBe(true);
      expect(en.photoAlt[id], `EN alt ${id}`).toBeTruthy();
      expect(vi.photoAlt[id], `VI alt ${id}`).toBeTruthy();
    }
    expect(HERO_SLIDES[0]).toBe('hero-facade-dusk'); // LCP image stays first (preload in Base.astro, OG image)
    expect(new Set(HERO_SLIDES).size).toBe(HERO_SLIDES.length);
    expect(HERO_SLIDES.length).toBeGreaterThanOrEqual(3);
    expect(HERO_INTERVAL_MS).toBe(3000); // INV 22/10
    for (const r of en.rooms.items) {
      const g = ROOM_GALLERIES[r.slug];
      expect(g[0], `${r.slug}: cover = first gallery photo`).toBe(r.photo);
      expect(new Set(g).size, `${r.slug}: no duplicate`).toBe(g.length);
      expect(
        g.length,
        `${r.slug}: at least ${GALLERY_TARGET} photos (INV 25/10)`,
      ).toBeGreaterThanOrEqual(GALLERY_TARGET);
    }
    expect(GALLERY_TARGET).toBe(6);
  });

  it('hero = INV picker numbers (FB-INV-003, INV 24/10): 45 distinct originals, none of the ruled-out photos', () => {
    const nums = Object.keys(PICKER_SOURCES).map(Number);
    expect(nums).toEqual(Array.from({ length: 45 }, (_, i) => i + 1));
    expect(new Set(Object.values(PICKER_SOURCES)).size).toBe(45);
    expect(HERO_SLIDES).toEqual(HERO_PICKS.map(photoIdForPick));
    for (const n of HERO_EXCLUDED) expect(HERO_PICKS, `photo ${n} ruled out`).not.toContain(n);
    // every manifest photo comes from a picker original, so any number INV sends can be traced to a file
    const sources = new Set(Object.values(PICKER_SOURCES));
    for (const p of manifest.photos) expect(sources.has(p.src), `${p.id} ← ${p.src}`).toBe(true);
    expect(() => photoIdForPick(46)).toThrow(/not a picker number/);
    expect(() => photoIdForPick(1)).toThrow(/optimize-images\.mjs/); // 01a.png is not on the site
    // UXD rule 24/10: editorial photos (The Stay, Amenities, Location) never repeat a hero slide
    for (const id of [en.why.short.photo, en.why.long.photo, AMENITIES_PHOTO, 'aerial-hillside'])
      expect(HERO_SLIDES, `${id} is editorial`).not.toContain(id);
  });

  it('R3-Q52: viewer strings fill their numbers; the counter template keeps "{i}" for the script', () => {
    for (const c of [en, vi]) {
      expect(c.gallery.open(6)).toContain('6');
      expect(c.gallery.counter(2, 6)).toMatch(/2.*6/);
      expect(c.gallery.counter('{i}', 6)).toContain('{i}');
      expect(c.carousel.goTo(2, 5)).toMatch(/2.*5/);
      expect(c.gallery.dialogLabel('X')).toContain('X');
    }
  });

  it('VI photo alt texts never say "căn" (FB-INV-002) – the manifest alt of detail-laundry-desk does', () => {
    for (const v of Object.values(vi.photoAlt)) expect(v).not.toMatch(/(?<!\p{L})căn(?!\p{L})/iu);
  });

  it('Premium has the 1.4 m extra bed (INV 22/10); no other room promises an extra bed; the form hint says so', () => {
    const premium = (c: Copy) => c.rooms.items.find((r) => r.slug === 'premium-one-bedroom-1')!;
    expect(plain(premium(en).desc)).toContain('1.4 m extra bed');
    expect(plain(premium(vi).desc)).toContain('giường phụ 1,4 m');
    for (const c of [en, vi]) {
      for (const r of c.rooms.items.filter((x) => x.slug !== 'premium-one-bedroom-1'))
        expect(r.desc).not.toMatch(/extra bed|giường phụ/i);
    }
    // CPY 24/10: the extra guest moved from the room-grid note to the form hint (no fee wording on the page body)
    expect(BOOKING_STRINGS.en.roomHint('2', '3')).toContain('1.4 m extra bed');
    expect(BOOKING_STRINGS.vi.roomHint('2', '3')).toContain('giường phụ 1,4 m');
  });

  it('the action labels are "Plan your stay" / "Chọn ngày ở" (INV 24/10, CPY concept B)', () => {
    expect(en.actions.requestToBook).toBe('Plan your stay');
    expect(vi.actions.requestToBook).toBe('Chọn ngày ở');
  });

  it('room type names of INV 24/10 (Desk keeps its own names; slugs unchanged)', () => {
    expect(en.rooms.items.map((r) => r.name)).toEqual([
      'City Studio',
      'Garden Studio',
      'Premium One-Bedroom',
      'Signature Two-Bedroom',
    ]);
    expect(vi.rooms.items.map((r) => r.name)).toEqual([
      'Studio hướng phố',
      'Studio hướng vườn',
      'Premium một phòng ngủ',
      'Signature hai phòng ngủ',
    ]);
    expect(en.rooms.items.map((r) => r.altName.text)).toEqual(vi.rooms.items.map((r) => r.name));
    expect(vi.rooms.items.map((r) => r.altName.text)).toEqual(en.rooms.items.map((r) => r.name));
  });

  it('VI speaks as "chúng tôi"; only the deposit step and the anti-impersonation answer keep "OTTIMO" (INV 24/10)', () => {
    for (const s of [
      vi.book.intro,
      vi.book.chat.text,
      vi.contact.title,
      vi.contact.intro,
      ...BOOKING_STRINGS.vi.notReady,
    ])
      expect(plain(s)).not.toMatch(/OTTIMO/);
    expect(plain(vi.book.steps[2].text)).toMatch(/OTTIMO/);
    expect(vi.faq.items.find((i) => i.deposit)!.a.join(' ')).toMatch(/OTTIMO/);
  });

  it.each(['en', 'vi'] as const)('%s: run-time form strings follow the banned list too', (lang) => {
    const s = BOOKING_STRINGS[lang];
    const all = [
      ...Object.values(s.next),
      ...s.fallback,
      ...s.notReady,
      ...Object.values(s.net),
      s.roomHint('2', '3'),
      s.roomHint(null, null),
      s.longHint(30),
      s.notSent,
      s.e.cap('3'),
    ].join(' \n ');
    for (const re of BANNED) expect(all.match(re)?.[0] ?? null, String(re)).toBeNull();
    expect(all).not.toMatch(/hotel|khách sạn/iu);
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
      expect(s.when.callNow(60)).toContain('60');
    }
  });
});

describe('site facts (site.json)', () => {
  it('validates and keeps the INV contact data of ESC-020 / FB-INV-002', () => {
    expect(site.phone.e164).toBe('+84844440909');
    expect(site.mapUrl).toBe('https://maps.app.goo.gl/oYos42G5YvUEcDCc6');
    expect(site.contact.email).toBe('info@ottimo.vn');
    expect(site.facebookUrl).toBe('https://www.facebook.com/profile.php?id=100091335431646');
  });

  it('publishes the operator of INV 22/10 and no deposit account holder yet (INV 23/10, 4d)', () => {
    expect(site.legal).toEqual({
      name: 'CÔNG TY CỔ PHẦN UTMG LIVING',
      taxCode: '5801551657',
      address: '28 Triệu Việt Vương, P. Xuân Hương – Đà Lạt, Lâm Đồng',
    });
    expect(site.paymentReceivingAccountHolder).toBe('');
    expect(
      siteSchema.safeParse({ ...raw, legal: { ...raw.legal, taxCode: '58015' } }).success,
    ).toBe(false);
  });

  it('keeps the booking form off (no endpoint, SEC/legal conditions open – US-155 AC4)', () => {
    expect(site.features.bookingRequest).toBe(false);
  });

  it('accepts only a shared mailbox on the OTTIMO domain, or nothing (ADR-014 4.2)', () => {
    expect(isOttimoMailbox('info@ottimo.vn', 'ottimo.vn')).toBe(true);
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
