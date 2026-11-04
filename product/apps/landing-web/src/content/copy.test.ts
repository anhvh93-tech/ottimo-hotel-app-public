// Copy of every published language (ADR-014 3.4, US-152 AC1; concept v1.2.1): same shape, nothing empty, brand voice
// rules a machine can check, wording rules of FB-INV-002 (no room count, boutique stay), numbers equal to site.json.
import { describe, expect, it } from 'vitest';
import { BANNED } from '../../scripts/dist-checks.mjs';
import { plain } from '../lib/rich';
import { homeJsonLd } from '../lib/seo';
import { BOOKING_STRINGS } from '../scripts/booking-strings/all';
import { COPY } from '.';
import { en } from './en';
import {
  AMENITIES_PHOTO,
  BOOK_PHOTO,
  GALLERY_TARGET,
  HERO_INTERVAL_MS,
  ROOM_GALLERIES,
} from './gallery';
import {
  HERO_EXCLUDED,
  HERO_MIN_RATIO,
  HERO_PICKS,
  HERO_SLIDES,
  PICKER_SOURCES,
  heroPhotoForPick,
  photoIdForPick,
  photoRatio,
} from './hero';
import manifest from '../assets/photos/manifest.json';
import { isOttimoMailbox, site, siteSchema } from './site';
import raw from './site.json';
import type { Copy } from './types';
import { vi } from './vi';

/** Every published language (LP-v2: en, vi, ko, zh, ru). */
const ALL = Object.values(COPY);
/** Optional keys some languages leave out (CPY lp-v2 5.1, 5.2). */
const OPTIONAL = ['actions.chatOnSuffix', 'book.form.noteLang'];
/** "1 hour" in each language (site.json promiseMinutes = 60). */
const ONE_HOUR = /1 (hour|giờ)|1시간|1 小时|1 часа/;

type Leaf = [path: string, value: unknown];
function leaves(value: unknown, prefix = ''): Leaf[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${prefix}[${i}]`));
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
  return [[prefix, value]];
}
const shape = (c: Copy) =>
  leaves(c)
    .filter(([p]) => !OPTIONAL.includes(p))
    .map(([p, v]) => `${p}:${typeof v}`)
    .sort();
const texts = (c: Copy) =>
  leaves(c)
    .filter((l): l is [string, string] => typeof l[1] === 'string')
    .map(([p, v]) => [p, plain(v)] as const);

describe('page copy (every published language)', () => {
  it('every language fills exactly the same fields (ADR-014 3.4)', () => {
    for (const c of ALL) expect(shape(c), c.lang).toEqual(shape(en));
    expect(Object.keys(COPY)).toEqual(['en', 'vi', 'ko', 'zh', 'ru']);
    for (const [lang, c] of Object.entries(COPY)) expect(c.lang).toBe(lang);
  });

  it.each(ALL)('$lang: no empty string', (c) => {
    // months[].value '' = "Not sure yet" (null in the request); ko puts the whole Zalo label after the name (suffix)
    for (const [p, v] of texts(c))
      if (
        p !== 'footer.backToTop' &&
        !/months\[\d+\]\.value$/.test(p) &&
        !(p === 'actions.chatOnPrefix' && c.actions.chatOnSuffix)
      )
        expect(v.trim(), p).not.toBe('');
  });

  it('the Zalo label of the phone bar = prefix + Zalo + suffix = the full "Chat on Zalo" (CPY lp-v2 5.1)', () => {
    for (const c of ALL)
      expect(`${c.actions.chatOnPrefix}Zalo${c.actions.chatOnSuffix ?? ''}`, c.lang).toBe(
        c.actions.chatOnZalo,
      );
  });

  it('"write in your language" note only on ko/zh/ru, never a promise to reply in it (CPY lp-v2 3.10, 10.3)', () => {
    expect(en.book.form.noteLang).toBeUndefined();
    expect(vi.book.form.noteLang).toBeUndefined();
    for (const l of ['ko', 'zh', 'ru'] as const) expect(COPY[l].book.form.noteLang).toBeTruthy();
  });

  it('the line under the consent box says "from our server" (SEC-LP2-01, Major – ESC-042 B)', () => {
    expect(en.book.form.consentMore).toContain('from our server within 180 days');
    expect(vi.book.form.consentMore).toContain('khỏi máy chủ của OTTIMO trong tối đa 180 ngày');
    expect(COPY.ko.book.form.consentMore).toContain('OTTIMO 서버에서');
    expect(COPY.zh.book.form.consentMore).toContain('从我们的服务器删除');
    expect(COPY.ru.book.form.consentMore).toContain('с нашего сервера');
    for (const c of ALL) expect(c.book.form.consentMore).toMatch(/180/);
  });

  it('quoted labels match the label they point to, in every language (CPY lp-v2 7)', () => {
    for (const c of ALL) {
      const S = BOOKING_STRINGS[c.lang];
      const long = c.faq.items.find((i) => i.id === 'faq-long')!.a.join(' ');
      expect(long, `${c.lang} faq-long`).toContain(c.book.form.byMonth);
      expect(S.e.cap('3'), `${c.lang} e.cap`).toContain(c.book.form.anyRoom.split(' – ')[0]!);
    }
  });

  it('ESC-043 monthly offer: a label and a sentence in every language, no figure, no %, no {amount} (CPY lp-v2 12)', () => {
    for (const lang of ['en', 'vi', 'ko', 'zh', 'ru'] as const) {
      const o = BOOKING_STRINGS[lang].priceMonthlyOffer;
      for (const x of [o.label, o.text]) {
        expect(x.trim(), lang).not.toBe('');
        expect(x, lang).not.toMatch(/\d|%|\{amount\}|[!！]/);
        for (const re of BANNED) expect(x.match(re)?.[0] ?? null, `${lang} ${re}`).toBeNull();
      }
      // the old monthly price keys are gone (CPY 12.2)
      expect(Object.keys(BOOKING_STRINGS[lang].estimate)).not.toEqual(
        expect.arrayContaining(['monthly']),
      );
      for (const k of ['monthly', 'monthlyNote', 'overShortMax'])
        expect(k in BOOKING_STRINGS[lang].estimate, `${lang} ${k}`).toBe(false);
    }
  });

  it.each(ALL)('$lang: title ≤ 60; description ≤ 160 (ADR-014 5)', (c) => {
    expect(c.meta.title.length).toBeLessThanOrEqual(60);
    expect(c.meta.description.length).toBeLessThanOrEqual(160);
  });

  it.each(ALL)(
    '$lang: no emoji, no exclamation mark, no arrow or ≈ (brand voice, font subsets)',
    (c) => {
      for (const [p, v] of texts(c)) {
        expect(v, p).not.toMatch(/\p{Extended_Pictographic}/u);
        expect(v, p).not.toMatch(/[!！]/);
        expect(v, p).not.toMatch(/[←-⇿≈]/);
      }
    },
  );

  it.each(ALL)('$lang: wording rules of FB-INV-002 / concept 2.3 (banned list)', (c) => {
    const all = texts(c)
      .map(([, v]) => v)
      .join(' \n ');
    for (const re of BANNED) expect(all.match(re)?.[0] ?? null, String(re)).toBeNull();
  });

  it('VI and RU distances use a decimal comma, EN/KO/ZH a decimal point (concept 11, CPY lp-v2 1.3)', () => {
    for (const c of [vi, COPY.ru])
      for (const r of c.location.rows) expect(r.distance, c.lang).not.toMatch(/\d\.\d/);
    for (const c of [en, COPY.ko, COPY.zh])
      for (const r of c.location.rows) expect(r.distance, c.lang).not.toMatch(/\d,\d/);
  });

  it('the banned list of ko/zh/ru catches what CPY lp-v2 6 lists, and not the words the copy needs', () => {
    const hit = (x: string) => BANNED.some((re) => re.test(x));
    for (const bad of [
      '아파트',
      '부티크 호텔',
      '5성급',
      '즉시 확정',
      '10개 객실',
      '公寓',
      '精品酒店',
      '5星级',
      '立即确认',
      '10间',
      'апартаменты',
      'Бутик-отель',
      '5 звезд',
      'мгновенное подтверждение',
      '10 номеров',
    ])
      expect(hit(bad), bad).toBe(true);
    for (const ok of [
      '星期二',
      '两间卧室',
      'Premium 一卧套房',
      'Номера',
      'Отдельные спальня',
      '객실 타입',
    ])
      expect(hit(ok), ok).toBe(false);
  });

  it('the anti-impersonation answer is in the FAQ of every language (SEC UXD-06)', () => {
    for (const [l, phrase] of [
      ['ko', '카드 번호는 절대 묻지 않습니다'],
      ['zh', '绝不会索要银行卡号'],
      ['ru', 'никогда не запрашиваем номера карт'],
    ] as const) {
      expect(
        COPY[l].faq.items.some((i) => i.deposit && i.a.join(' ').includes(phrase)),
        l,
      ).toBe(true);
      expect(COPY[l].faq.depositAccount('X Co.')).toContain('X Co.');
      expect(COPY[l].faq.depositAccount('')).not.toMatch(/\{|undefined/);
    }
    expect(
      en.faq.items.some((i) => i.deposit && /never ask for card numbers/.test(i.a.join(' '))),
    ).toBe(true);
    expect(
      vi.faq.items.some((i) => i.deposit && /không bao giờ hỏi số thẻ/.test(i.a.join(' '))),
    ).toBe(true);
    expect(en.faq.depositAccount('X Co.')).toContain('X Co.');
    expect(vi.faq.depositAccount('')).not.toMatch(/\{|undefined/);
  });

  it('4 room types with contract slugs, capacities of BR-110 and the same photos in every language', () => {
    for (const c of ALL)
      expect(
        c.rooms.items.map((r) => [r.slug, r.sleeps, r.photo]),
        c.lang,
      ).toEqual(en.rooms.items.map((r) => [r.slug, r.sleeps, r.photo]));
    for (const r of en.rooms.items) expect(r.slug).toMatch(/^[a-z0-9-]{2,60}$/);
    expect(en.rooms.items.map((r) => r.sleeps)).toEqual([
      [2, 3],
      [2, 3],
      [3, 4],
      [4, 5],
    ]);
  });

  it('every photo used by the copy has an alt text in every language', () => {
    const used = [
      BOOK_PHOTO,
      en.why.short.photo,
      en.why.long.photo,
      ...en.rooms.items.map((r) => r.photo),
      AMENITIES_PHOTO,
      'aerial-hillside',
    ];
    for (const id of used)
      for (const c of ALL) expect(c.photoAlt[id], `${c.lang} ${id}`).toBeTruthy();
  });

  it('R3-Q52: hero slides and every room gallery photo exist and have alt text in both languages', () => {
    const known = new Set(manifest.photos.map((p) => p.id));
    const used = [...HERO_SLIDES, ...Object.values(ROOM_GALLERIES).flat()];
    for (const id of used) {
      expect(known.has(id), `${id} in manifest`).toBe(true);
      for (const c of ALL) expect(c.photoAlt[id], `${c.lang} alt ${id}`).toBeTruthy();
    }
    // LCP image = the first landscape pick (preload in Base.astro); INV 25/10: landscape photos only
    expect(HERO_SLIDES[0]).toBe(photoIdForPick(HERO_PICKS[0]!));
    for (const id of HERO_SLIDES)
      expect(photoRatio(id), `${id} landscape ≥ 4/3`).toBeGreaterThanOrEqual(HERO_MIN_RATIO - 0.01);
    expect(HERO_SLIDES).not.toContain('hero-facade-dusk'); // the portrait facade lives in #book
    expect(() => heroPhotoForPick(4)).toThrow(/not landscape/); // a portrait pick stops the build
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
    for (const id of [
      en.why.short.photo,
      en.why.long.photo,
      AMENITIES_PHOTO,
      'aerial-hillside',
      BOOK_PHOTO,
    ])
      expect(HERO_SLIDES, `${id} is editorial`).not.toContain(id);
  });

  it('R3-Q52: viewer strings fill their numbers; the counter template keeps "{i}" for the script', () => {
    for (const c of ALL) {
      expect(c.gallery.open(6)).toContain('6');
      expect(c.gallery.counter(2, 6)).toMatch(/2.*6|6.*2/); // ko: "6장 중 2번째";
      expect(c.gallery.counter('{i}', 6)).toContain('{i}');
      expect(c.carousel.goTo(2, 5)).toMatch(/2.*5|5.*2/);
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
    // LP-v2: the same 1.4 m bed in ko / zh / ru, in the Premium card and the form hint only
    for (const [l, bed] of [
      ['ko', '1.4m'],
      ['zh', '1.4 米'],
      ['ru', '1,4 м'],
    ] as const) {
      expect(plain(premium(COPY[l]).desc), l).toContain(bed);
      expect(BOOKING_STRINGS[l].roomHint('2', '3'), l).toContain(bed);
      for (const r of COPY[l].rooms.items.filter((x) => x.slug !== 'premium-one-bedroom-1'))
        expect(r.desc, l).not.toContain(bed);
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

  it.each(['en', 'vi', 'ko', 'zh', 'ru'] as const)(
    '%s: run-time form strings follow the banned list too',
    (lang) => {
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
        s.priceMonthlyOffer.label,
        s.priceMonthlyOffer.text,
        ...Object.values(s.estimate).map((x) =>
          typeof x === 'function' ? x('1,000 VND', s.nights(3)) : x,
        ),
      ].join(' \n ');
      for (const re of BANNED) expect(all.match(re)?.[0] ?? null, String(re)).toBeNull();
      expect(all).not.toMatch(/hotel|khách sạn|호텔|酒店|отел/iu);
      // calm voice: no "!", no emoji, no "≈" (CPY lp-v2 2.3)
      expect(all).not.toMatch(/[!！≈]|\p{Extended_Pictographic}/u);
    },
  );
});

describe('numbers stated on the page = site.json booking parameters (concept 13)', () => {
  const b = site.booking;
  const hours = `${b.frontDeskOpen}–${b.frontDeskClose}`;
  it.each(ALL)('$lang: promise, front desk hours, deposit', (c) => {
    const step2 = plain(c.book.steps[1].text);
    expect(step2).toContain(hours);
    expect(step2).toContain(b.promiseNextMorningBy);
    expect(step2).toMatch(b.promiseMinutes === 60 ? ONE_HOUR : new RegExp(`${b.promiseMinutes}`));
    expect(plain(c.book.chat.text)).toContain(hours);
    expect(plain(c.book.steps[2].text)).toContain(`${b.depositPercent}%`);
    expect(plain(c.amenities.groups[3]!.body)).toContain(hours);
  });
  // FB-INV-004 / BR-401 v0.4.6 (CPY landing-fb-inv-004 1.1): check-in from checkinTime when the room is ready, always
  // ready by roomReadyBy, check-out by checkoutTime – in the Amenities body and the first FAQ answer, both languages.
  it.each(ALL)('$lang: check-in / room-ready / check-out times = site.json (F5)', (c) => {
    expect(site.checkinTime).toBe('12:00');
    expect(site.roomReadyBy).toBe('14:00');
    for (const s of [plain(c.amenities.groups[3]!.body), plain(c.faq.items[0]!.a[0]!)]) {
      expect(s).toContain(site.checkinTime);
      expect(s).toContain(site.roomReadyBy);
      expect(s).toContain(site.checkoutTime);
      // the guaranteed time is never the check-in time
      expect(s).not.toMatch(/(Check-in from|Nhận phòng từ) 14:00/iu);
      if (c.lang !== 'en' && c.lang !== 'vi') continue; // ko/zh/ru: the same three times, CPY wording
      expect(s).toMatch(
        c.lang === 'en'
          ? new RegExp(
              `Check-in from ${site.checkinTime} when your room is ready; it always is by ${site.roomReadyBy}\\. Check-out by ${site.checkoutTime}\\.`,
            )
          : new RegExp(
              `Nhận phòng từ ${site.checkinTime} khi phòng đã sẵn sàng – và phòng luôn sẵn sàng lúc ${site.roomReadyBy}\\. Trả phòng trước ${site.checkoutTime}\\.`,
            ),
      );
    }
  });
  it('the banned list stops a "ready from <time>" promise (BR-401 (e))', () => {
    const hit = (s: string) => BANNED.some((re) => re.test(s));
    expect(hit('Rooms ready from 12:00')).toBe(true);
    expect(hit('Phòng sẵn sàng từ 12:00')).toBe(true);
    expect(hit('it always is by 14:00')).toBe(false);
    expect(hit('phòng luôn sẵn sàng lúc 14:00')).toBe(false);
  });
  it('JSON-LD publishes checkinTime/checkoutTime from site.json, never roomReadyBy', () => {
    for (const c of ALL) {
      const graph = homeJsonLd(c, 'https://ottimo.vn/')['@graph'] as Record<string, unknown>[];
      const lodging = graph.find((n) => n['@type'] === 'LodgingBusiness')!;
      expect(lodging.checkinTime).toBe(site.checkinTime);
      expect(lodging.checkoutTime).toBe(site.checkoutTime);
      expect(JSON.stringify(lodging)).not.toMatch(/roomReady|14:00/);
    }
  });
  it('thank-you strings follow the 202 promise (minutes / next morning / call now), not replyBy', () => {
    for (const s of Object.values(BOOKING_STRINGS)) {
      expect(s.when.withinMinutes(60, '07:00', '22:00')).toMatch(ONE_HOUR);
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
