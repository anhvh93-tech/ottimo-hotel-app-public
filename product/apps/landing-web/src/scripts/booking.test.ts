// Booking-request logic and transport (concept 5.2–5.4; OpenAPI 0.3.7 add-on 2; SEC ARC-14, ARC-23, UXD-05/07).
import { describe, expect, it } from 'vitest';
import {
  addDays,
  buildDraft,
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
import { BOOKING_STRINGS } from './booking-strings';
import { apiTransport, previewTransport, type TransportDeps } from './booking-transport';

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
      when: 'Lễ tân làm việc lại từ 07:00. OTTIMO sẽ trả lời bạn trước 09:00.',
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
