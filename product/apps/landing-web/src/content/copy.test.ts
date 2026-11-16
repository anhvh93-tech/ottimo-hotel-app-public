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
    // ko puts the whole Zalo label after the name (suffix). FB-INV-010: no "Not sure yet" month (value '') any more
    for (const [p, v] of texts(c))
      if (p !== 'footer.backToTop' && !(p === 'actions.chatOnPrefix' && c.actions.chatOnSuffix))
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
      expect(long, `${c.lang} faq-long`).toContain(c.book.form.lengthOfStay);
      expect(S.e.cap('3'), `${c.lang} e.cap`).toContain(c.book.form.anyRoom.split(' – ')[0]!);
    }
  });

  it('FB-INV-010 monthly price (replaces ESC-043): same words on the card and in the form, only the amount is a number', () => {
    for (const c of ALL) {
      const E = BOOKING_STRINGS[c.lang].estimate;
      // CPY Dot 1 section 7: estimate.fromMonth / estimate.note are the card's rooms.fromPrice / rooms.priceNote
      expect(E.fromMonth('X'), c.lang).toBe(c.rooms.fromPrice('X'));
      expect(E.note, c.lang).toBe(c.rooms.priceNote);
      expect(E.taxIn, c.lang).toBe(c.rooms.taxIn);
      expect(E.taxOut, c.lang).toBe(c.rooms.taxOut);
      for (const f of [c.rooms.fromPrice, E.fromMonth]) {
        expect(f('X'), c.lang).toContain('X');
        expect(f('X'), c.lang).not.toMatch(/\d|%/);
      }
      for (const x of [c.rooms.priceNote, c.rooms.priceFallback, E.note, E.final]) {
        expect(x.trim(), c.lang).not.toBe('');
        expect(x, c.lang).not.toMatch(/\d|%|[!！]/);
        for (const re of BANNED) expect(x.match(re)?.[0] ?? null, `${c.lang} ${re}`).toBeNull();
      }
      // the months hint names the minimum stay only (site.json longStay.minMonths = 1)
      const hint = c.book.form.monthsHint;
      expect(hint.trim(), c.lang).not.toBe('');
      expect(hint.replace(/\b1\b|1(?=개월)/g, ''), c.lang).not.toMatch(/\d|%|[!！]/);
      // the ESC-043 invitation and the by-the-night estimate keys are gone (FB-INV-010)
      const S = BOOKING_STRINGS[c.lang] as unknown as Record<string, unknown>;
      for (const k of ['priceMonthlyOffer', 'nights', 'longHint'])
        expect(k in S, `${c.lang} ${k}`).toBe(false);
      for (const k of ['guests', 'perNight', 'longStay', 'extraGuest', 'minStay', 'monthly'])
        expect(k in E, `${c.lang} estimate.${k}`).toBe(false);
    }
  });

  it('FB-INV-010: the form sells long stays only – months 1, 2, 3, 6, 12, 24 (INV 16/11), no by-the-night labels', () => {
    for (const c of ALL) {
      expect(
        c.book.form.months.map((m) => m.value),
        c.lang,
      ).toEqual(['1', '2', '3', '6', '12', '24']);
      for (const k of ['byNight', 'byMonth', 'checkIn', 'checkOut'])
        expect(k in c.book.form, `${c.lang} ${k}`).toBe(false);
    }
  });

  it.each(ALL)(
    '$lang: no by-the-night / short-stay wording on the page (CPY Dot 1 test 6)',
    (c) => {
      // photo alt texts describe pictures ("dusk", "sunset") – not offers
      const all = texts(c)
        .filter(([p]) => !p.startsWith('photoAlt.'))
        .map(([, v]) => v)
        .join(' \n ');
      const re =
        c.lang === 'zh'
          ? /\d\s*晚|按晚|一晚|短住/
          : c.lang === 'ko'
            ? /\d박|1박|하룻밤|짧은 숙박/
            : c.lang === 'ru'
              ? /\d\s*ноч|на ночь|за ночь|по ночам|коротк/i
              : c.lang === 'vi'
                ? /\d\s*đêm|theo đêm|một đêm|mỗi đêm|ở ngắn|chuyến đi ngắn/iu
                : /\b\d+\s*nights?\b|by the night|per night|a night\b|short stay|a weekend/i;
      expect(all.match(re)?.[0] ?? null).toBeNull();
    },
  );

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
        s.notSent,
        s.e.cap('3'),
        ...Object.values(s.e).map((x) => (typeof x === 'function' ? x('3') : x)),
        ...Object.values(s.estimate).map((x) =>
          typeof x === 'function' ? x('1,000 VND', '6 months') : x,
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
  /** The one-month deposit phrase of each language (CPY Dot 1 test 4; site.json longStay.depositMonths = 1). */
  const ONE_MONTH_DEPOSIT = {
    en: 'one-month deposit',
    vi: 'cọc một tháng',
    ko: '1개월분 보증금',
    zh: '一个月押金',
    ru: 'депозит за один месяц',
  } as const;
  it.each(ALL)('$lang: promise, front desk hours, one-month deposit', (c) => {
    const step2 = plain(c.book.steps[1].text);
    expect(step2).toContain(hours);
    expect(step2).toContain(b.promiseNextMorningBy);
    expect(step2).toMatch(b.promiseMinutes === 60 ? ONE_HOUR : new RegExp(`${b.promiseMinutes}`));
    expect(plain(c.book.chat.text)).toContain(hours);
    // FB-INV-010: the 30 % deposit of short stays is no longer on the landing
    expect(site.longStay.depositMonths).toBe(1);
    expect(plain(c.book.steps[2].text)).toContain(ONE_MONTH_DEPOSIT[c.lang]);
    expect(plain(c.book.steps[2].text)).not.toMatch(/\d+\s*%/);
    expect(plain(c.amenities.groups[3]!.body)).toContain(hours);
  });
  // FB-INV-004 / BR-401 v0.4.6 (CPY landing-fb-inv-004 1.1) as rewritten for long stays (CPY Dot 1 test 3): check-in
  // from checkinTime on move-in day when the room is ready, always ready by roomReadyBy, check-out by checkoutTime on
  // the last day – in the Amenities body only (the first FAQ answer no longer repeats the times).
  it.each(ALL)('$lang: check-in / room-ready / check-out times = site.json (F5)', (c) => {
    expect(site.checkinTime).toBe('12:00');
    expect(site.roomReadyBy).toBe('14:00');
    const s = plain(c.amenities.groups[3]!.body);
    expect(s).toContain(site.checkinTime);
    expect(s).toContain(site.roomReadyBy);
    expect(s).toContain(site.checkoutTime);
    // the guaranteed time is never the check-in time
    expect(s).not.toMatch(/(Check-in from|Nhận phòng từ) 14:00/iu);
    expect(plain(c.faq.items[0]!.a[0]!)).not.toMatch(/\d{2}:\d{2}/);
    if (c.lang !== 'en' && c.lang !== 'vi') return; // ko/zh/ru: the same three times, CPY wording
    expect(s).toMatch(
      c.lang === 'en'
        ? new RegExp(
            `On move-in day, check-in from ${site.checkinTime} when your room is ready; it always is by ${site.roomReadyBy}\\. On your last day, check-out by ${site.checkoutTime}\\.`,
          )
        : new RegExp(
            `Ngày dọn vào, nhận phòng từ ${site.checkinTime} khi phòng đã sẵn sàng – và phòng luôn sẵn sàng lúc ${site.roomReadyBy}\\. Ngày cuối, trả phòng trước ${site.checkoutTime}\\.`,
          ),
    );
  });
  it.each(ALL)('$lang: one-month deposit in the long-stay answers (faq-long)', (c) => {
    const long = c.faq.items.find((i) => i.id === 'faq-long')!.a.join(' ');
    expect(long).toMatch(
      {
        en: /one-month deposit/,
        vi: /cọc một tháng/,
        ko: /1개월분 보증금/,
        zh: /一个月押金/,
        ru: /депозита за один месяц/,
      }[c.lang],
    );
    // INV 16/11: one monthly rate – never "kinder the longer you stay"
    expect(long).not.toMatch(/kinder|càng lâu càng|ưu đãi|할인|优惠|скидк/iu);
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

// FB-INV-010 Dot 1 (INV 16/11, CPY Dot 1 section 6 + annex): the long-stay policy in the FAQ of every language states
// exactly the numbers of site.json longStay (Desk parameters – OWN).
describe('FAQ long-stay policy = site.json longStay', () => {
  const L = site.longStay;
  /** Digits as the page language groups them: 4,000 · 4.000 · 4 000 (any space, U+00A0 or U+202F in ru). */
  const amount = (n: number, lang: Copy['lang']) => {
    const g = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '_');
    const sep = lang === 'vi' ? '\\.' : lang === 'ru' ? '[\\s\\u00a0\\u202f]' : ',';
    return new RegExp(`(?<![\\d.,])${g.replace(/_/g, sep)}(?![\\d.,]\\d)\\s*VND`);
  };
  const policy = (c: Copy) => c.faq.items.find((i) => i.id === 'faq-policy');
  const ONE_MONTH = {
    en: /one month/,
    vi: /một tháng/,
    ko: /1개월/,
    zh: /一个月/,
    ru: /один месяц|одного месяца/,
  };
  const DUE = {
    en: (d: number) => new RegExp(`by the ${d}th`),
    vi: (d: number) => new RegExp(`chậm nhất ngày ${d}(?!\\d)`),
    ko: (d: number) => new RegExp(`${d}일까지`),
    zh: (d: number) => new RegExp(`最迟于次月 ${d} 日`),
    ru: (d: number) => new RegExp(`не позднее ${d}-го числа`),
  };
  const LAST_DAY = {
    en: /last day of each month/,
    vi: /ngày cuối tháng/,
    ko: /매월 말일/,
    zh: /每月最后一天/,
    ru: /последний день месяца/,
  };

  it('site.json carries the numbers INV gave (16/11)', () => {
    expect(L).toEqual({
      minMonths: 1,
      depositMonths: 1,
      electricityVndPerKwh: 4000,
      waterVndPerM3: 25000,
      meterReading: 'last-day-of-month',
      billingDueDay: 5,
      housekeepingVndPerVisit: {
        'standard-studio-city-view': 150000,
        'standard-studio-garden-view': 150000,
        'premium-one-bedroom-1': 200000,
        'signature-two-bedrooms': 200000,
      },
    });
    expect(
      siteSchema.safeParse({ ...raw, longStay: { ...raw.longStay, billingDueDay: 0 } }).success,
    ).toBe(false);
  });

  it.each(ALL)(
    '$lang: faq-policy sits before the anti-impersonation answer, with every number of site.json',
    (c) => {
      const ids = c.faq.items.map((i) => i.id ?? '');
      expect(ids.indexOf('faq-policy')).toBe(ids.indexOf('faq-real') - 1);
      expect(ids.indexOf('faq-policy')).toBe(ids.indexOf('faq-long') + 1);
      const p = policy(c)!;
      expect(p.q.trim()).not.toBe('');
      const all = p.a.map(plain).join(' ');
      // minimum stay and deposit are written in words ("one month") while site.json says 1
      expect(L.minMonths).toBe(1);
      expect(L.depositMonths).toBe(1);
      expect(
        all.match(new RegExp(ONE_MONTH[c.lang].source, 'g'))?.length ?? 0,
      ).toBeGreaterThanOrEqual(2);
      expect(all).toMatch(amount(L.electricityVndPerKwh, c.lang));
      expect(all).toMatch(/kWh|кВт·ч|千瓦时/);
      expect(all).toMatch(amount(L.waterVndPerM3, c.lang));
      expect(all).toMatch(/m³|м³|立方米/);
      expect(all).toMatch(LAST_DAY[c.lang]);
      expect(all).toMatch(DUE[c.lang](L.billingDueDay));
      for (const vnd of new Set(Object.values(L.housekeepingVndPerVisit)))
        expect(all, `housekeeping ${vnd}`).toMatch(amount(vnd, c.lang));
      // no other figure than the ones above (and no meter / surcharge wording – banned list)
      const allowed = new Set([
        L.electricityVndPerKwh,
        L.waterVndPerM3,
        L.billingDueDay,
        ...Object.values(L.housekeepingVndPerVisit),
      ]);
      const figures = (all.match(/\d[\d.,\s\u00a0\u202f]*\d|\d/g) ?? []).map((x) =>
        Number(x.replace(/[.,\s\u00a0\u202f]/g, '')),
      );
      for (const f of figures)
        expect(allowed.has(f) || f === 1, `${c.lang} figure ${f}`).toBe(true);
      for (const re of BANNED) expect(all.match(re)?.[0] ?? null, String(re)).toBeNull();
      expect(all).not.toMatch(/công tơ|by meter|phụ thu/i);
    },
  );

  it.each(ALL)(
    '$lang: housekeeping is an extra service – no free cleaning rhythm left in the FAQ (INV 16/11)',
    (c) => {
      const made = plain(c.faq.items[1]!.a.join(' '));
      expect(made).toMatch(
        {
          en: /extra service/,
          vi: /dịch vụ cộng thêm/,
          ko: /추가 서비스/,
          zh: /额外服务/,
          ru: /дополнительная услуга/,
        }[c.lang],
      );
      expect(plain(policy(c)!.a.join(' '))).toMatch(
        {
          en: /extra service/,
          vi: /dịch vụ cộng thêm/,
          ko: /추가 서비스/,
          zh: /额外服务/,
          ru: /дополнительная услуга/,
        }[c.lang],
      );
    },
  );
});
