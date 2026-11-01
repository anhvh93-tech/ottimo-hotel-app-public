// Booking-request logic and transport (concept 5.2–5.4; OpenAPI 0.3.7 add-on 2; SEC ARC-14, ARC-23, UXD-05/07).
import { describe, expect, it } from 'vitest';
import {
  addDays,
  buildDraft,
  estimateQuery,
  estimateSearch,
  estimateView,
  formatVnd,
  monthlyOfferView,
  isEstimate,
  type PublicPriceEstimate,
  diffDays,
  fmtDate,
  looksLikeCard,
  overCapacity,
  promiseText,
  refHostOf,
  todayIn,
  utmOf,
  validEmail,
  validPhone,
  type FormValues,
} from './booking-logic';
import { BOOKING_STRINGS } from './booking-strings/all';
import { plural } from './booking-strings/ru';
import {
  apiTransport,
  estimateTransport,
  previewTransport,
  type TransportDeps,
} from './booking-transport';

const base: FormValues = {
  stayType: 'short',
  checkIn: '2026-11-02',
  checkOut: '2026-11-05',
  arrival: '',
  months: '3',
  adults: 2,
  children: 1,
  infants: 1,
  roomType: 'premium-one-bedroom-1',
  guestName: '  An Nguyen ',
  preferredChannel: 'zalo',
  phone: '0912 345 678',
  email: 'ignored@example.com',
  note: '',
  consent: true,
  website: '',
  locale: 'en',
  search: '?utm_source=Facebook&utm_medium=social&utm_campaign=page book button&x=1',
  pathname: '/',
  referrer: 'https://l.facebook.com/some/path?q=1',
  ownHost: 'ottimo.vn',
  consentVersion: '2026-10-20',
};

describe('booking draft = WebsiteBookingRequestInput keys', () => {
  it('short stay: departure, no months; phone only; children/infants by age group; trimmed name', () => {
    const d = buildDraft(base);
    expect(d).toEqual({
      stayType: 'short',
      arrival: '2026-11-02',
      departure: '2026-11-05',
      adults: 2,
      children: 1,
      infants: 1,
      roomType: 'premium-one-bedroom-1',
      guestName: 'An Nguyen',
      preferredChannel: 'zalo',
      phone: '0912 345 678',
      locale: 'en',
      consent: true,
      consentVersion: '2026-10-20',
      utm: { source: 'facebook', medium: 'social', campaign: 'page-book-button' },
      landingPath: '/',
      refHost: 'l.facebook.com',
    });
    expect(d).not.toHaveProperty('email');
    expect(d).not.toHaveProperty('months');
    expect(d).not.toHaveProperty('childrenUnder6');
  });

  it('long stay: months (null = "Not sure yet"), no departure; email channel sends email only', () => {
    const d = buildDraft({
      ...base,
      stayType: 'long',
      arrival: '2026-12-01',
      months: '',
      preferredChannel: 'email',
    });
    expect(d.months).toBeNull();
    expect(d.arrival).toBe('2026-12-01');
    expect(d).not.toHaveProperty('departure');
    expect(d.email).toBe('ignored@example.com');
    expect(d).not.toHaveProperty('phone');
    expect(
      buildDraft({ ...base, stayType: 'long', arrival: '2026-12-01', months: '6' }).months,
    ).toBe(6);
  });

  it('no room type = "Any room"; empty note and honeypot are left out; own-site referrer is dropped', () => {
    const d = buildDraft({ ...base, roomType: '', referrer: 'https://ottimo.vn/vi/', search: '' });
    expect(d).not.toHaveProperty('roomType');
    expect(d).not.toHaveProperty('note');
    expect(d).not.toHaveProperty('website');
    expect(d).not.toHaveProperty('refHost');
    expect(d.utm).toEqual({});
  });
});

describe('helpers', () => {
  it('dates in the property time zone', () => {
    expect(todayIn('Asia/Ho_Chi_Minh', new Date('2026-10-17T18:30:00Z'))).toBe('2026-10-18');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(diffDays('2026-11-02', '2026-11-05')).toBe(3);
    expect(fmtDate('2026-11-02', 'vi')).toBe('2/11/2026');
    expect(fmtDate('2026-11-02', 'en')).toBe('2 Nov 2026');
    // LP-v2 (CPY lp-v2 1.3): the page language writes the date
    expect(fmtDate('2026-11-03', 'ko')).toMatch(/^2026년 11월 3일 \(?화\)?$/);
    expect(fmtDate('2026-11-03', 'zh')).toMatch(/^2026年11月3日\s?周二$/);
    expect(fmtDate('2026-11-03', 'ru')).toMatch(/3 ноября 2026/);
  });
  it('phone, email, card numbers, capacity (under-6s not counted – BR-110)', () => {
    expect(validPhone('+44 7700 900123')).toBe(true);
    expect(validPhone('12345')).toBe(false);
    expect(validEmail('name@example.com')).toBe(true);
    expect(validEmail('name@')).toBe(false);
    expect(looksLikeCard('card 4111 1111 1111 1111')).toBe(true);
    expect(looksLikeCard('arriving 22:30 with 2 bags')).toBe(false);
    expect(overCapacity(3, 3, 0)).toBe(false);
    expect(overCapacity(3, 3, 1)).toBe(true);
    expect(overCapacity(null, 6, 3)).toBe(false);
  });
  it('utm: lower case, odd characters → "-", 64 max, empty dropped', () => {
    expect(utmOf(`?utm_source=${'A'.repeat(80)}&utm_medium=%20&utm_campaign=x%2Fy`)).toEqual({
      source: 'a'.repeat(64),
      campaign: 'x-y',
    });
    expect(refHostOf('not a url', 'ottimo.vn')).toBeUndefined();
  });
});

describe('thank-you promise (202 `promise`, BR-912 (4)) – never replyBy', () => {
  const hours = {
    tz: 'Asia/Ho_Chi_Minh',
    open: '07:00',
    close: '22:00',
    withinMinutes: 60,
    callNowMinutes: 60, // web_request_public_promise_call_now_minutes (DOM, BR-912 v0.3.8)
  };
  it('within_minutes', () => {
    const p = promiseText(
      { kind: 'within_minutes', minutes: 60, by: '2026-10-17T08:15:00Z' },
      BOOKING_STRINGS.en.when,
      hours,
    );
    expect(p).toEqual({
      when: 'We reply within 1 hour (07:00–22:00, Da Lat time).',
      by: '15:15',
      callNow: false,
    });
  });
  it('next_morning and call_now', () => {
    expect(
      promiseText(
        { kind: 'next_morning', by: '2026-10-18T02:00:00Z' },
        BOOKING_STRINGS.vi.when,
        hours,
      ),
    ).toEqual({
      when: 'Lễ tân làm việc lại từ 07:00. Chúng tôi sẽ trả lời bạn trước 09:00.',
      by: '09:00',
      callNow: false,
    });
    const c = promiseText(
      { kind: 'call_now', minutes: 60, by: '2026-10-17T16:30:00Z' },
      BOOKING_STRINGS.en.when,
      hours,
    );
    expect(c.callNow).toBe(true);
    // minutes missing in the response → the page parameter (60)
    expect(
      promiseText({ kind: 'call_now', by: '2026-10-17T16:30:00Z' }, BOOKING_STRINGS.en.when, hours)
        .when,
    ).toContain('60');
    expect(c.by).toBe('23:30');
  });
});

describe('transport', () => {
  const draft = buildDraft(base);

  it('preview never sends', async () => {
    expect(await previewTransport.send(draft)).toEqual({ kind: 'not-sent' });
  });

  function fake(responses: Array<{ status: number; body?: unknown }>) {
    const calls: { url: string; init?: RequestInit }[] = [];
    const sleeps: number[] = [];
    let clock = 1_000;
    const deps: TransportDeps = {
      fetch: async (url, init) => {
        calls.push({ url, init });
        const r = responses.shift();
        if (!r) throw new Error('unexpected request');
        return new Response(r.body === undefined ? null : JSON.stringify(r.body), {
          status: r.status,
        });
      },
      now: () => clock,
      sleep: async (ms) => {
        sleeps.push(ms);
        clock += ms;
      },
      uuid: () => `key-${calls.length}`,
    };
    return { deps, calls, sleeps, advance: (ms: number) => (clock += ms) };
  }
  const token = (t: string) => ({
    token: `v1.${t.padEnd(30, 'x')}`,
    notBefore: '2026-10-17T00:00:03Z',
    expiresAt: '2026-10-17T02:00:00Z',
    minDelaySeconds: 3,
  });
  const accepted = {
    refCode: 'K7Q2M9XD',
    promise: { kind: 'within_minutes', minutes: 60, by: '2026-10-17T08:15:00Z' },
  };

  it('waits minDelaySeconds by the browser clock, posts JSON with an Idempotency-Key, same origin', async () => {
    const f = fake([
      { status: 200, body: token('a') },
      { status: 202, body: accepted },
    ]);
    const t = apiTransport('/v1/public/properties/ottimo', f.deps);
    expect(await t.send(draft)).toEqual({ kind: 'accepted', ...accepted });
    expect(f.calls.map((c) => c.url)).toEqual([
      '/v1/public/properties/ottimo/form-token',
      '/v1/public/properties/ottimo/booking-requests',
    ]);
    expect(f.sleeps).toEqual([3000]);
    const post = f.calls[1]!.init!;
    expect(post.method).toBe('POST');
    expect(post.credentials).toBe('omit');
    expect((post.headers as Record<string, string>)['Idempotency-Key']).toBeTruthy();
    const body = JSON.parse(String(post.body));
    expect(body.formToken).toMatch(/^v1\.a/);
    expect(body.children).toBe(1);
    expect(body.infants).toBe(1);
  });

  it('FORM_TOKEN_INVALID: new token, wait again, resend once; a second refusal stops', async () => {
    const f = fake([
      { status: 200, body: token('a') },
      { status: 422, body: { code: 'FORM_TOKEN_INVALID' } },
      { status: 200, body: token('b') },
      { status: 202, body: accepted },
    ]);
    expect((await apiTransport('/b', f.deps).send(draft)).kind).toBe('accepted');
    expect(f.sleeps).toEqual([3000, 3000]);
    const g = fake([
      { status: 200, body: token('a') },
      { status: 422, body: { code: 'FORM_TOKEN_INVALID' } },
      { status: 200, body: token('b') },
      { status: 422, body: { code: 'FORM_TOKEN_INVALID' } },
    ]);
    expect(await apiTransport('/b', g.deps).send(draft)).toEqual({ kind: 'network' });
    expect(g.calls).toHaveLength(4);
  });

  it('a token fetched early (first focus) only waits what is left of minDelaySeconds', async () => {
    const f = fake([
      { status: 200, body: token('a') },
      { status: 202, body: accepted },
    ]);
    const t = apiTransport('/b', f.deps);
    t.prepare();
    await new Promise((r) => setTimeout(r, 0)); // token arrives
    f.advance(2000); // the guest types for 2 s
    await t.send(draft);
    expect(f.sleeps).toEqual([1000]);
  });

  it('maps 503 → busy, 429 → rate, token 404 → not-ready, a failed request → network', async () => {
    expect(
      await apiTransport(
        '/b',
        fake([{ status: 200, body: token('a') }, { status: 503 }]).deps,
      ).send(draft),
    ).toEqual({
      kind: 'busy',
    });
    expect(
      await apiTransport(
        '/b',
        fake([{ status: 200, body: token('a') }, { status: 429 }]).deps,
      ).send(draft),
    ).toEqual({
      kind: 'rate',
    });
    expect(await apiTransport('/b', fake([{ status: 404 }]).deps).send(draft)).toEqual({
      kind: 'not-ready',
    });
    expect(
      await apiTransport('/b', fake([{ status: 200, body: token('a') }]).deps).send(draft),
    ).toEqual({
      kind: 'network',
    });
  });
});

describe('live form answers (US-155 v1.0 – OpenAPI 0.3.7 add-on 2)', () => {
  const draft = buildDraft(base);
  const tok = {
    token: `v1.${'t'.padEnd(30, 'x')}`,
    notBefore: '2026-10-24T00:00:03Z',
    expiresAt: '2026-10-24T02:00:00Z',
    minDelaySeconds: 0,
  };
  const ok = (kind: string, by: string) => ({
    status: 202,
    body: { refCode: 'K7Q2M9XD', promise: { kind, by, minutes: 60 } },
  });
  function deps(responses: Array<{ status: number; body?: unknown }>) {
    const urls: string[] = [];
    const d: TransportDeps = {
      fetch: async (url) => {
        urls.push(url);
        const r = responses.shift();
        if (!r) throw new Error('unexpected request');
        return new Response(r.body === undefined ? null : JSON.stringify(r.body), {
          status: r.status,
        });
      },
      now: () => 0,
      sleep: async () => {},
      uuid: () => 'k',
    };
    return { d, urls };
  }

  it('switch off on the server: 404 on the post or 422 PUBLIC_FORM_NOT_READY → not-ready (Zalo / call)', async () => {
    expect(
      await apiTransport('/b', deps([{ status: 200, body: tok }, { status: 404 }]).d).send(draft),
    ).toEqual({ kind: 'not-ready' });
    const notReady = { code: 'PUBLIC_FORM_NOT_READY', missing: ['privacy_notice_en'] };
    expect(
      await apiTransport(
        '/b',
        deps([
          { status: 200, body: tok },
          { status: 422, body: notReady },
        ]).d,
      ).send(draft),
    ).toEqual({ kind: 'not-ready' });
  });

  it('first touch tells the page early when the form is off; the next send asks again', async () => {
    const f = deps([
      { status: 404 },
      { status: 200, body: tok },
      ok('next_morning', '2026-10-25T02:00:00Z'),
    ]);
    const t = apiTransport('/b', f.d);
    expect(await t.prepare()).toEqual({ kind: 'not-ready' });
    expect((await t.send(draft)).kind).toBe('accepted');
    expect(f.urls).toEqual(['/b/form-token', '/b/form-token', '/b/booking-requests']);
    expect(await previewTransport.prepare()).toBeNull();
  });

  it('422 field errors come back as field + code only (no value); NOTICE_VERSION_INVALID → not-ready (ARC lp-v2 2.8: Zalo / call)', async () => {
    const invalid = {
      code: 'VALIDATION_FAILED',
      errors: [
        { field: 'body.note', code: 'ID_NUMBER_DETECTED' },
        { field: 'phone', code: 'PHONE_COUNTRY_CODE_REQUIRED' },
      ],
    };
    expect(
      await apiTransport(
        '/b',
        deps([
          { status: 200, body: tok },
          { status: 422, body: invalid },
        ]).d,
      ).send(draft),
    ).toEqual({
      kind: 'invalid',
      errors: [
        { field: 'note', code: 'ID_NUMBER_DETECTED' },
        { field: 'phone', code: 'PHONE_COUNTRY_CODE_REQUIRED' },
      ],
    });
    const stale = {
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'consentVersion', code: 'NOTICE_VERSION_INVALID' }],
    };
    expect(
      await apiTransport(
        '/b',
        deps([
          { status: 200, body: tok },
          { status: 422, body: stale },
        ]).d,
      ).send(draft),
    ).toEqual({ kind: 'not-ready' });
  });

  it('an API on another origin is called with its absolute base (PUBLIC_FORM_API_BASE)', async () => {
    const f = deps([{ status: 200, body: tok }, ok('within_minutes', '2026-10-24T03:00:00Z')]);
    await apiTransport('https://desk.example.vn/v1/public/properties/dl01', f.d).send(draft);
    expect(f.urls).toEqual([
      'https://desk.example.vn/v1/public/properties/dl01/form-token',
      'https://desk.example.vn/v1/public/properties/dl01/booking-requests',
    ]);
  });

  it('every new sentence exists in every language, calm voice, no emoji or "!"', () => {
    for (const lang of ['en', 'vi', 'ko', 'zh', 'ru'] as const) {
      const S = BOOKING_STRINGS[lang];
      for (const x of [S.reload, S.e.idNumber, S.e.phoneCountry, S.e.server, ...S.notReady])
        expect(x).not.toMatch(/!|\p{Extended_Pictographic}/u);
    }
  });
});

// ---------- LP-v2: price estimate in the form (FB-INV-009; ARC lp-v2 2.7–2.8, UXD 3, CPY 2) ----------

const est = (over: Partial<PublicPriceEstimate> = {}): PublicPriceEstimate => ({
  estimate: true,
  currency: 'VND',
  taxIncluded: true,
  roomType: 'standard-studio-garden-view',
  stayKind: 'short',
  arrival: '2026-11-12',
  departure: '2026-11-15',
  priceAvailable: true,
  shortStay: {
    nights: 3,
    roomSubtotalVnd: 2201000,
    upliftNights: 2,
    losDiscountPct: 0,
    losDiscountVnd: 0,
    extraPersonFeeVnd: 0,
    totalVnd: 2201000,
    nightlyAvgVnd: 733667,
  },
  notes: [],
  computedAt: '2026-11-03T10:00:00+07:00',
  estimateToken: 'pe1.eyJydCI6InN0YW5kYXJk.c2ln',
  expiresAt: '2026-11-04T10:00:00+07:00',
  ...over,
});

describe('price estimate – when the form asks (UXD 3.2, ARC 2.8)', () => {
  const ctx = { today: '2026-11-01', max: '2027-11-01', capacity: 3 };
  const v = { ...base, roomType: 'standard-studio-garden-view', children: 0, infants: 0 };

  it('needs a room type, valid dates and a party the room sleeps; "Any room" = S1, missing dates = S0', () => {
    expect(estimateQuery(v, ctx)).toEqual({
      roomType: 'standard-studio-garden-view',
      stayType: 'short',
      arrival: '2026-11-02',
      departure: '2026-11-05',
      adults: 2,
      children: 0,
      infants: 0,
    });
    expect(estimateQuery({ ...v, roomType: '' }, ctx)).toBe('any-room');
    expect(estimateQuery({ ...v, checkOut: '' }, ctx)).toBe('idle');
    expect(estimateQuery({ ...v, checkOut: '2026-11-02' }, ctx)).toBe('idle'); // not after check-in
    expect(estimateQuery({ ...v, checkIn: '2026-10-30' }, ctx)).toBe('idle'); // in the past
    expect(estimateQuery({ ...v, checkIn: '2027-12-01', checkOut: '2027-12-03' }, ctx)).toBe(
      'idle',
    );
    expect(estimateQuery({ ...v, adults: 3, children: 1 }, ctx)).toBe('idle'); // over capacity – the form says so
    expect(estimateQuery({ ...v, adults: 3, infants: 2 }, ctx)).not.toBe('idle'); // under-6s not counted
  });

  it('ESC-043: by the month, or more than 27 nights by the night = no query, the monthly offer instead', () => {
    const long = { ...v, stayType: 'long' as const, arrival: '2026-12-01', months: '3' };
    expect(estimateQuery(long, ctx)).toBe('monthly');
    expect(estimateQuery({ ...long, roomType: '' }, ctx)).toBe('monthly');
    expect(estimateQuery({ ...v, checkIn: '2026-11-02', checkOut: '2026-11-30' }, ctx)).toBe(
      'monthly',
    ); // 28
    expect(
      estimateQuery({ ...v, checkIn: '2026-11-02', checkOut: '2026-11-29' }, ctx),
    ).toMatchObject({ departure: '2026-11-29' }); // 27 nights: a price
    expect(estimateQuery({ ...long, arrival: '' }, ctx)).toBe('idle');
  });

  it('query string: contract names only, fixed order, no personal data', () => {
    const q = estimateQuery(v, ctx);
    if (typeof q === 'string') throw new Error('no query');
    expect(estimateSearch(q)).toBe(
      'roomType=standard-studio-garden-view&stayType=short&arrival=2026-11-02&departure=2026-11-05&adults=2&children=0&infants=0',
    );
    expect(estimateSearch(q)).not.toMatch(/name|phone|email|note|locale/);
  });
});

describe('price estimate – what the box shows (UXD 3.3, CPY 2)', () => {
  it('amounts: whole dong, grouped the page way, "VND" after the number, never ₫', () => {
    expect(formatVnd(2363000, 'en')).toBe('2,363,000 VND');
    expect(formatVnd(2363000, 'vi')).toBe('2.363.000 VND');
    expect(formatVnd(2363000, 'ko')).toBe('2,363,000 VND');
    expect(formatVnd(2363000, 'zh')).toBe('2,363,000 VND');
    expect(formatVnd(2363000, 'ru').replace(/\s/g, ' ')).toBe('2 363 000 VND');
    for (const l of ['en', 'vi', 'ko', 'zh', 'ru'] as const)
      expect(formatVnd(1, l)).not.toMatch(/₫/);
  });

  it('S3 by the night: total for N nights, VAT line and the final-rate sentence – no average a night (BE lp-v2 6, DOM)', () => {
    const view = estimateView(est(), BOOKING_STRINGS.en, 'en');
    expect(view.kind).toBe('price');
    expect(view.main).toEqual(['', '2,201,000 VND', ' for 3 nights']);
    expect(view.lines).toEqual([]);
    expect(view.note.join(' ')).toBe(
      'Rates in Vietnamese dong (VND). Taxes included. Your final rate is in the quote we send.',
    );
    expect(view.live).toBe('Estimated rate updated: 2,201,000 VND for 3 nights');
    expect(view.done).toBe('Estimated rate: 2,201,000 VND for 3 nights');
    // no discount badge, no "save", no strike-through – a sentence only
    const long = estimateView(
      est({
        shortStay: {
          ...est().shortStay!,
          nights: 7,
          losDiscountPct: 10,
          losDiscountVnd: 500000,
          extraPersonFeeVnd: 300000,
        },
      }),
      BOOKING_STRINGS.en,
      'en',
    );
    expect(long.lines).toEqual(['Includes our longer-stay rate.', 'Includes one more guest.']);
  });

  it('word order of each language: ko/zh put the nights first, ru declines "ночь"', () => {
    expect(estimateView(est(), BOOKING_STRINGS.ko, 'ko').main).toEqual([
      '3박 기준 ',
      '2,201,000 VND',
      '',
    ]);
    expect(estimateView(est(), BOOKING_STRINGS.zh, 'zh').main).toEqual([
      '3 晚，共 ',
      '2,201,000 VND',
      '',
    ]);
    expect(estimateView(est(), BOOKING_STRINGS.ru, 'ru').main?.[2]).toBe(' за 3 ночи');
    expect(estimateView(est(), BOOKING_STRINGS.vi, 'vi').note).not.toContain('Giá tính bằng VND.');
    expect(estimateView(est({ taxIncluded: false }), BOOKING_STRINGS.en, 'en').note).toContain(
      'Before taxes.',
    );
  });

  it('ESC-043 offer (no figure, no "Estimated rate"), S6 on request / minimum stay / party too large', () => {
    const month = est({
      stayKind: 'long',
      shortStay: undefined,
      longStay: { months: 3, monthlyFromVnd: 8000000 },
    });
    const m = estimateView(month, BOOKING_STRINGS.en, 'en');
    expect(m).toEqual(monthlyOfferView(BOOKING_STRINGS.en));
    expect(m.kind).toBe('offer');
    expect(m.main).toBeUndefined();
    expect(m.live).toBe(
      'A special offer for longer stays. For a month or longer, we prepare a rate around your dates. You will find it in the quote we send.',
    );
    expect(JSON.stringify(m)).not.toMatch(/8,000,000|Estimated rate/);
    const off = { priceAvailable: false, shortStay: undefined, estimateToken: undefined };
    const none = estimateView(
      est({ ...off, unavailableReason: 'on_request' }),
      BOOKING_STRINGS.en,
      'en',
    );
    expect(none).toMatchObject({
      kind: 'unavailable',
      live: BOOKING_STRINGS.en.estimate.unavailable,
    });
    // 200 + notes.min_stay (BE L12): no figure; CPY has no sentence yet → the S6 sentence
    const min = estimateView(
      est({ ...off, unavailableReason: 'on_request', notes: [{ code: 'min_stay', minNights: 2 }] }),
      BOOKING_STRINGS.en,
      'en',
    );
    expect(min.live).toBe(BOOKING_STRINGS.en.estimate.unavailable);
    const party = estimateView(
      est({ ...off, unavailableReason: 'party_exceeds_room' }),
      BOOKING_STRINGS.ko,
      'ko',
      { capacity: 3 },
    );
    expect(party.live).toBe(BOOKING_STRINGS.ko.e.cap('3'));
  });

  it('a body outside the contract shows no number', () => {
    expect(isEstimate(est())).toBe(true);
    expect(isEstimate({ ...est(), estimate: false })).toBe(false);
    expect(isEstimate({ ...est(), shortStay: { ...est().shortStay!, totalVnd: 0 } })).toBe(false);
    expect(isEstimate({ ...est(), shortStay: undefined })).toBe(false);
    expect(isEstimate({ ...est(), stayKind: 'long', shortStay: undefined })).toBe(true);
    expect(isEstimate(null)).toBe(false);
  });
});

describe('price estimate – transport (GET, 3 s, no retry; ARC 2.8)', () => {
  const run = async (
    status: number,
    body?: unknown,
    opts: { hang?: boolean; abort?: boolean } = {},
  ) => {
    const urls: string[] = [];
    const timers: (() => void)[] = [];
    const t = estimateTransport('/v1/public/properties/dl01', {
      fetch: (url, init) => {
        urls.push(url);
        if (opts.hang)
          return new Promise((_, reject) =>
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            ),
          );
        return Promise.resolve(
          new Response(body === undefined ? null : JSON.stringify(body), { status }),
        );
      },
      setTimeout: (fn) => {
        timers.push(fn);
        return timers.length;
      },
      clearTimeout: () => undefined,
    });
    const ac = new AbortController();
    const p = t('roomType=x', ac.signal);
    if (opts.abort) ac.abort();
    else if (opts.hang) timers[0]!(); // 3 s passed
    return { out: await p, urls };
  };

  it('200 → the number; same-origin URL of the contract', async () => {
    const r = await run(200, est());
    expect(r.out).toEqual({ kind: 'ok', body: est() });
    expect(r.urls).toEqual(['/v1/public/properties/dl01/price-estimate?roomType=x']);
  });
  it('404 = prices off (hide the box); 422 = no number; 429 = stop; 503/5xx and an odd body = error', async () => {
    expect((await run(404)).out).toEqual({ kind: 'off' });
    expect((await run(422, { code: 'VALIDATION_FAILED' })).out).toEqual({ kind: 'invalid' });
    expect((await run(429)).out).toEqual({ kind: 'rate' });
    expect((await run(503)).out).toEqual({ kind: 'error' });
    expect((await run(500)).out).toEqual({ kind: 'error' });
    expect((await run(200, { estimate: true })).out).toEqual({ kind: 'error' });
  });
  it('more than 3 s = error; a newer request aborts the old one (its answer is dropped)', async () => {
    expect((await run(200, est(), { hang: true })).out).toEqual({ kind: 'error' });
    expect((await run(200, est(), { hang: true, abort: true })).out).toEqual({ kind: 'aborted' });
  });
});

describe('the estimate token travels with the request (ARC 2.7)', () => {
  it('buildDraft sends priceEstimateToken only when the page passes one', () => {
    expect(buildDraft(base)).not.toHaveProperty('priceEstimateToken');
    expect(buildDraft({ ...base, priceEstimateToken: 'pe1.a.b' }).priceEstimateToken).toBe(
      'pe1.a.b',
    );
  });
  it('locale = the page language (LandingLocale)', () => {
    expect(buildDraft({ ...base, locale: 'zh' }).locale).toBe('zh');
  });
});

describe('Russian plurals (CPY 4.2, UXD 1.5)', () => {
  it('1 ночь · 3 ночи · 5 ночей · 21 ночь · 12 ночей; fields; hours', () => {
    const n = BOOKING_STRINGS.ru.nights;
    expect([1, 3, 5, 21, 12, 22, 25].map(n)).toEqual([
      '1 ночь',
      '3 ночи',
      '5 ночей',
      '21 ночь',
      '12 ночей',
      '22 ночи',
      '25 ночей',
    ]);
    expect(BOOKING_STRINGS.ru.summary(2)).toBe('Проверьте 2 поля');
    expect(BOOKING_STRINGS.ru.summary(5)).toBe('Проверьте 5 полей');
    expect(plural(1, 'a', 'b', 'c')).toBe('a');
    expect(BOOKING_STRINGS.ru.when.withinMinutes(60, '07:00', '22:00')).toContain('1 часа');
    expect(BOOKING_STRINGS.ru.when.withinMinutes(120, '07:00', '22:00')).toContain('2 часов');
  });
});
