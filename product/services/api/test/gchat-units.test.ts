/**
 * Google Chat booking-request messages – units without a database (ARC gchat-booking-request-notify 8.11 unit 1, 3,
 * 3a, 3b; SEC ESC-041 ★2/★3/★5/★6; GCHAT-02 G3). The renderer runs on a recording fake transaction: the test sees
 * every SQL text it sends, so "levels A/B never read a C2 column" is checked on the queries themselves (spy).
 * Fake data only (example.invalid, fake phone numbers, made-up names).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Tx } from '../src/db/database';
import { ChatDispatcher } from '../src/jobs/chat-dispatch';
import type { StaffChatKind } from '../src/modules/events/public/staff-chat';
import type { ParameterService } from '../src/modules/platform/public/parameter.service';
import {
  CHAT_BASE_SQL,
  CHAT_CONTACT_SQL,
  CHAT_DETAILS_MIN_NOTICE_VERSION,
  CHAT_EMAIL_REPLACEMENT,
  CHAT_ID_REPLACEMENT,
  CHAT_RECHECK_SQL,
  type ChatDetailLevel,
  type ChatRender,
  chatSafeEmail,
  chatSafeText,
  parseChatDetailLevel,
  websiteRequestChatRenderer,
} from '../src/modules/public-site/public/chat-message';
import { parseChatLinkBase, resolveChatConfig } from '../src/worker-chat';

const C2 = /guest_name|phone_e164|email|note|preferred_channel/;
const TZ = 'Asia/Ho_Chi_Minh';
const ID = '0192f0aa-1111-7000-8000-000000000001';
const WEBHOOK =
  'https://chat.googleapis.com/v1/spaces/AAAAfake01/messages?key=fakeKeyCanary&token=fakeTokenCanary';

// Canary guest data: none of these may appear in a text below level C, nor ever in a log.
const NAME = 'Canary Nguyen Van Thu';
const PHONE = '84900000017';
const EMAIL = 'canary.guest@example.invalid';
const NOTE = 'Canary note: xin phòng yên tĩnh';

interface Row {
  id: string;
  ref_code: string;
  status: string;
  arrival_date: string;
  departure_date: string | null;
  stay_kind: string;
  stay_months: number | null;
  adults: number;
  children: number;
  infants: number;
  created_at: Date;
  reply_by: Date;
  assigned_user_id: string | null;
  pii_purged_at: Date | null;
  suspicious_flags: string[];
  consent_version: string;
  locale: string;
}

const baseRow = (over: Partial<Row> = {}): Row => ({
  id: ID,
  ref_code: '7K3P9QXA',
  status: 'new',
  arrival_date: '2026-11-06',
  departure_date: '2026-11-09',
  stay_kind: 'short',
  stay_months: null,
  adults: 2,
  children: 1,
  infants: 0,
  created_at: new Date('2026-11-02T14:05:00+07:00'),
  reply_by: new Date('2026-11-02T14:20:00+07:00'),
  assigned_user_id: null,
  pii_purged_at: null,
  suspicious_flags: [],
  consent_version: CHAT_DETAILS_MIN_NOTICE_VERSION,
  locale: 'vi',
  ...over,
});

interface Contact {
  guest_name: string | null;
  phone_e164: string | null;
  email: string | null;
  preferred_channel: string | null;
  note: string | null;
}
const phoneContact = (over: Partial<Contact> = {}): Contact => ({
  guest_name: NAME,
  phone_e164: PHONE,
  email: null,
  preferred_channel: 'zalo',
  note: NOTE,
  ...over,
});

/** Recording fake transaction; `gate` = published_at of the min version / of the request's version. */
function fakeTx(
  row: Row | null,
  contact: Contact,
  gate: { min: Date | null; req: Date | null } = {
    min: new Date('2026-10-31T00:00:00Z'),
    req: new Date('2026-10-31T00:00:00Z'),
  },
  outbox: { status: string; last_error: string | null } | null = null,
): { tx: Tx; sql: string[] } {
  const sql: string[] = [];
  const tx = {
    ctx: { organizationId: 'org', propertyId: 'prop', userId: null, actorType: 'system' },
    db: null,
    async query(text: string) {
      sql.push(text);
      if (text === CHAT_BASE_SQL) return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
      if (text === CHAT_CONTACT_SQL) return { rows: [contact], rowCount: 1 };
      if (text.includes('privacy_notice_version')) {
        return { rows: [{ min_at: gate.min, req_at: gate.req }], rowCount: 1 };
      }
      if (text.includes('outbox_message')) return { rows: outbox ? [outbox] : [], rowCount: 1 };
      throw new Error(`unexpected SQL ${text.slice(0, 40)}`);
    },
  } as unknown as Tx;
  return { tx, sql };
}

const params = {
  async get(_tx: unknown, key: string) {
    if (key === 'front_desk_hours') return ['07:00', '22:00'];
    if (key === 'business_day_rollover') return '06:00';
    throw new Error(`param ${key}`);
  },
} as unknown as ParameterService;

const render = websiteRequestChatRenderer({ params });
async function run(
  level: ChatDetailLevel,
  row: Row | null,
  contact: Contact = phoneContact(),
  kind: StaffChatKind = 'web_request_new',
  opts: {
    gate?: Parameters<typeof fakeTx>[2];
    outbox?: Parameters<typeof fakeTx>[3];
    appEnv?: string;
  } = {},
): Promise<{ r: ChatRender; text: string; sql: string[] }> {
  const { tx, sql } = fakeTx(row, contact, opts.gate, opts.outbox ?? null);
  const r = await render(tx, kind, ID, {
    level,
    timezone: TZ,
    linkBase: 'https://desk.ottimo.vn',
    appEnv: opts.appEnv ?? 'production',
    now: new Date('2026-11-02T14:06:00+07:00'),
  });
  return { r, text: r.send ? r.text : '', sql };
}

const DESK = `Mở Desk: https://desk.ottimo.vn/website-requests/${ID}`;
const TRIP_WORDS = ['06/11', 'người lớn', 'trẻ em', 'đêm', 'tháng', 'Theo tháng', 'Ngắn ngày'];
const GUEST_WORDS = [NAME, PHONE, EMAIL, 'Canary note', 'Zalo'];

describe('renderer – level A (SEC 4.1 template; default and capped)', () => {
  it('in hours: code, received, deadline, Desk link last – no trip, no guest data, no C2 query', async () => {
    const { r, text, sql } = await run('A', baseRow());
    expect(r).toMatchObject({ send: true, level: 'A', levelCapped: false, threadKey: ID });
    expect(text).toBe(
      ['Yêu cầu đặt phòng mới · 7K3P9QXA', 'Nhận lúc 14:05 · hạn phản hồi 14:20', DESK].join('\n'),
    );
    for (const w of [...TRIP_WORDS, ...GUEST_WORDS]) expect(text).not.toContain(w);
    expect(sql.filter((q) => C2.test(q))).toEqual([]);
  });

  it('out of hours + arriving on the business date → "cần gọi ngay" + "(ngoài giờ trực)"; flags → "cần xem kỹ"', async () => {
    const row = baseRow({
      arrival_date: '2026-11-02',
      departure_date: '2026-11-03',
      created_at: new Date('2026-11-02T23:40:00+07:00'),
      reply_by: new Date('2026-11-03T00:10:00+07:00'),
      suspicious_flags: ['possible_duplicate', 'contains_url'],
    });
    const { text } = await run('A', row);
    expect(text.split('\n')).toEqual([
      'Yêu cầu đặt phòng mới – cần gọi ngay · 7K3P9QXA',
      'Nhận lúc 23:40 (ngoài giờ trực) · hạn phản hồi 00:10 · cần xem kỹ',
      DESK,
    ]);
    expect(text).not.toMatch(/possible_duplicate|contains_url/);
  });

  it('after midnight before the rollover the business date is still yesterday (call now)', async () => {
    const row = baseRow({
      arrival_date: '2026-11-02',
      departure_date: '2026-11-03',
      created_at: new Date('2026-11-03T01:30:00+07:00'),
      reply_by: new Date('2026-11-03T02:00:00+07:00'),
    });
    expect((await run('A', row)).text).toMatch(/^Yêu cầu đặt phòng mới – cần gọi ngay/);
    const next = baseRow({
      arrival_date: '2026-11-04',
      created_at: new Date('2026-11-03T01:30:00+07:00'),
      reply_by: new Date('2026-11-03T07:15:00+07:00'),
    });
    expect((await run('A', next)).text.split('\n')[1]).toBe(
      'Nhận lúc 01:30 (ngoài giờ trực) · hạn phản hồi 07:15',
    );
  });

  it('non-production → environment prefix on line 1', async () => {
    const { text } = await run('A', baseRow(), phoneContact(), 'web_request_new', {
      appEnv: 'staging',
    });
    expect(text.split('\n')[0]).toBe('[staging] Yêu cầu đặt phòng mới · 7K3P9QXA');
  });

  it.each([
    [
      'notice 2026-10-24 (older)',
      { min: new Date('2026-10-31T00:00:00Z'), req: new Date('2026-10-24T00:00:00Z') },
    ],
    ['new notice not published yet', { min: null, req: new Date('2026-10-24T00:00:00Z') }],
    ['request notice unknown', { min: new Date('2026-10-31T00:00:00Z'), req: null }],
  ])('configured C but %s → template A, levelCapped, no C2 query (★2)', async (_n, gate) => {
    const row = baseRow({ consent_version: '2026-10-24' });
    const { r, text, sql } = await run('C', row, phoneContact(), 'web_request_new', { gate });
    expect(r).toMatchObject({ send: true, level: 'A', levelCapped: true });
    for (const w of [...TRIP_WORDS, ...GUEST_WORDS]) expect(text).not.toContain(w);
    expect(sql.filter((q) => C2.test(q))).toEqual([]);
  });

  it.each(['web_request_overdue', 'web_request_morning'] as const)(
    '%s at level C stays template A (★6), `<users/all>` only on overdue (PO Q5 default)',
    async (kind) => {
      const row = baseRow({
        created_at: new Date('2026-11-01T23:40:00+07:00'),
        reply_by: new Date('2026-11-02T07:15:00+07:00'),
      });
      const { r, text, sql } = await run('C', row, phoneContact(), kind);
      expect(r).toMatchObject({ send: true, level: 'A', levelCapped: false });
      const lines = text.split('\n');
      expect(lines[0]).toBe(
        `${kind === 'web_request_overdue' ? '<users/all> ' : ''}Chưa có người nhận · 7K3P9QXA`,
      );
      expect(lines[1]).toBe(
        `Nhận lúc 23:40 (ngoài giờ trực) · ${kind === 'web_request_overdue' ? 'đã quá hạn phản hồi' : 'hạn phản hồi'} 07:15`,
      );
      expect(lines[2]).toBe(DESK);
      expect(sql.filter((q) => C2.test(q) || q.includes('privacy_notice_version'))).toEqual([]);
    },
  );
});

describe('renderer – levels B and C', () => {
  it('B: trip lines, no guest data, no C2 query', async () => {
    const { r, text, sql } = await run('B', baseRow());
    expect(r).toMatchObject({ level: 'B', levelCapped: false });
    expect(text.split('\n')).toEqual([
      'Yêu cầu đặt phòng mới · 7K3P9QXA',
      'Nhận lúc 14:05 · hạn phản hồi 14:20',
      'Đến 06/11 – đi 09/11 · 3 đêm · Ngắn ngày',
      '2 người lớn, 1 trẻ em',
      DESK,
    ]);
    for (const w of GUEST_WORDS) expect(text).not.toContain(w);
    expect(sql.filter((q) => C2.test(q))).toEqual([]);
  });

  it.each([
    [
      { stay_kind: 'long', stay_months: 3, departure_date: '2027-02-06' },
      'Đến 06/11 · 3 tháng · Theo tháng',
    ],
    [
      { stay_kind: 'long', stay_months: null, departure_date: null },
      'Đến 06/11 · chưa rõ thời gian ở',
    ],
    [
      { stay_kind: 'long', stay_months: null, departure_date: '2026-12-06' },
      'Đến 06/11 – đi 06/12 · 30 đêm · Theo tháng',
    ],
  ])('B stay line %#', async (over, line) => {
    const { text } = await run('B', baseRow(over as Partial<Row>));
    expect(text.split('\n')[2]).toBe(line);
  });

  it('B guests: infants only when > 0', async () => {
    const t = (await run('B', baseRow({ adults: 1, children: 0, infants: 2 }))).text;
    expect(t.split('\n')[3]).toBe('1 người lớn, 2 trẻ dưới 2 tuổi');
  });

  it('C phone channel: name, ONE contact (+E.164), channel label, message in a code block, Desk last', async () => {
    const { r, text, sql } = await run('C', baseRow());
    expect(r).toMatchObject({ level: 'C', levelCapped: false });
    expect(text.split('\n')).toEqual([
      'Yêu cầu đặt phòng mới · 7K3P9QXA',
      'Nhận lúc 14:05 · hạn phản hồi 14:20',
      'Đến 06/11 – đi 09/11 · 3 đêm · Ngắn ngày',
      '2 người lớn, 1 trẻ em',
      `Khách: ${NAME}`,
      `Liên hệ: +${PHONE} · kênh: Zalo`,
      'Lời nhắn:',
      '```',
      NOTE,
      '```',
      DESK,
    ]);
    // Exactly one C2 query, and it is readChatContact's.
    expect(sql.filter((q) => C2.test(q))).toEqual([CHAT_CONTACT_SQL]);
  });

  it('C e-mail channel: the e-mail (domain kept), no phone; contains_url → warning on "Lời nhắn"', async () => {
    const { text } = await run(
      'C',
      baseRow({ suspicious_flags: ['contains_url'] }),
      phoneContact({
        phone_e164: null,
        email: EMAIL,
        preferred_channel: 'email',
        note: 'see evil.example/login',
      }),
    );
    expect(text).toContain(`Liên hệ: ${EMAIL} · kênh: Email`);
    expect(text).not.toContain(PHONE);
    expect(text).toContain('Lời nhắn (có link – không bấm, xem trên Desk):');
    expect(text).toContain('see evil[.]example/login');
    expect(text.split('\n').at(-1)).toBe(DESK);
  });

  it('C e-mail that is not a plain address → replaced, never a link (SEC FB-R3-SEC-BE-GCHAT-01)', async () => {
    const { text } = await run(
      'C',
      baseRow(),
      phoneContact({
        phone_e164: null,
        email: 'https://evil.example/login@ottimo.vn',
        preferred_channel: 'email',
      }),
    );
    expect(text).toContain(`Liên hệ: ${CHAT_EMAIL_REPLACEMENT} · kênh: Email`);
    expect(text).not.toContain('evil');
    // The only link left in the whole message is the Desk line.
    expect(text.split('\n').filter((l) => l.includes('://'))).toEqual([DESK]);
  });

  it('C: the text carries a pre-POST re-check (SEC GCHAT-04); A/B do not', async () => {
    const c = await run('C', baseRow());
    expect(c.r.send && typeof c.r.recheck).toBe('function');
    for (const level of ['A', 'B'] as const) {
      const x = await run(level, baseRow());
      expect(x.r.send && x.r.recheck).toBeUndefined();
    }
    expect(CHAT_RECHECK_SQL).not.toMatch(C2);
  });

  it('C without a message: no message block; phone channel label', async () => {
    const { text } = await run(
      'C',
      baseRow(),
      phoneContact({ note: null, preferred_channel: 'phone' }),
    );
    expect(text).not.toContain('Lời nhắn');
    expect(text).toContain('· kênh: Điện thoại');
  });
});

describe('renderer – skips at send time', () => {
  it('row gone / spam / purged → SKIPPED_GONE; reminder of a claimed request → SKIPPED_HANDLED', async () => {
    expect((await run('C', null)).r).toEqual({ send: false, code: 'SKIPPED_GONE' });
    expect((await run('C', baseRow({ status: 'spam' }))).r).toEqual({
      send: false,
      code: 'SKIPPED_GONE',
    });
    expect((await run('C', baseRow({ pii_purged_at: new Date() }))).r).toEqual({
      send: false,
      code: 'SKIPPED_GONE',
    });
    expect(
      (
        await run(
          'A',
          baseRow({ status: 'in_progress', assigned_user_id: ID }),
          phoneContact(),
          'web_request_overdue',
        )
      ).r,
    ).toEqual({ send: false, code: 'SKIPPED_HANDLED' });
    expect(
      (await run('A', baseRow({ assigned_user_id: ID }), phoneContact(), 'web_request_morning')).r,
    ).toEqual({
      send: false,
      code: 'SKIPPED_HANDLED',
    });
  });

  it('erase notice: only when the first message was posted; code + instruction + Desk link, nothing else', async () => {
    const purged = baseRow({ status: 'declined', pii_purged_at: new Date() });
    const posted = await run('C', purged, phoneContact(), 'web_request_erased', {
      outbox: { status: 'done', last_error: null },
    });
    expect(posted.text.split('\n')).toEqual([
      'Đã xóa dữ liệu của 7K3P9QXA theo yêu cầu của khách. Quản lý phòng xóa tin đầu của luồng này nếu còn.',
      DESK,
    ]);
    expect(posted.sql.filter((q) => C2.test(q))).toEqual([]);
    for (const outbox of [
      { status: 'done', last_error: 'SKIPPED_DISABLED' },
      { status: 'pending', last_error: null },
      null,
    ]) {
      expect((await run('C', purged, phoneContact(), 'web_request_erased', { outbox })).r).toEqual({
        send: false,
        code: 'SKIPPED_NOT_POSTED',
      });
    }
  });
});

describe('chatSafeText (SEC ★5, ARC 8.5 – test 3a)', () => {
  const note = (s: string) => chatSafeText(s, { maxChars: 500, singleLine: false });
  const name = (s: string) => chatSafeText(s, { maxChars: 80, singleLine: true });

  it.each([
    ['CCCD 12 digits', 'CCCD 079 203 012 345 nhé'],
    ['CMND 9 digits', 'cmnd 123456789'],
    ['passport', 'passport B1234567'],
    ['card (Luhn)', 'the 4111 1111 1111 1111'],
  ])('%s → the WHOLE field replaced', (_n, s) => {
    expect(note(s)).toBe(CHAT_ID_REPLACEMENT);
    expect(name(s)).toBe(CHAT_ID_REPLACEMENT);
  });

  it('no `<` or `>` left: mentions and labelled links are inert', () => {
    expect(name('<users/all>')).toBe('‹users/all›');
    const out = note('<https://evil.example|Mở Desk>');
    expect(out).not.toMatch(/[<>]/);
    expect(out).toBe('‹https[:]//evil[.]example|Mở Desk›');
  });

  it('links and domains disabled; e-mail mode keeps the domain', () => {
    expect(note('evil.example/login')).toBe('evil[.]example/login');
    expect(note('https://x.y')).toBe('https[:]//x[.]y');
    expect(note('www.evil.example')).toBe('www[.]evil[.]example');
    expect(note('giá 1.5 triệu lúc 22.30')).toBe('giá 1.5 triệu lúc 22.30');
    expect(
      chatSafeText('a.b@example.invalid', { maxChars: 254, singleLine: true, domains: false }),
    ).toBe('a.b@example.invalid');
  });

  it('backticks dropped (cannot close the code block); *x* kept as is', () => {
    expect(note('```\nfake\n```')).toBe('fake');
    expect(note('a `b` *x*')).toBe('a b *x*');
  });

  it('bidi and control characters dropped; a name becomes one line; a message keeps ≤ 8 lines', () => {
    expect(name('Ann‮A⁦ B‏\u0007')).toBe('AnnA B');
    expect(name('Line one\nLine two\r\nthree')).toBe('Line one Line two three');
    const nine = Array.from({ length: 9 }, (_, i) => `l${i + 1}`).join('\n\n');
    expect(note(nine).split('\n')).toEqual(['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8 l9']);
  });

  it('cut by grapheme at the limit with "… (xem đủ trên Desk)"; emoji never cut in half', () => {
    const long = 'a'.repeat(501);
    expect(note(long)).toBe(`${'a'.repeat(500)}… (xem đủ trên Desk)`);
    expect(note('a'.repeat(500))).toBe('a'.repeat(500));
    const family = '👨‍👩‍👧';
    const out = chatSafeText(`${'x'.repeat(79)}${family}${family}`, {
      maxChars: 80,
      singleLine: true,
    });
    expect(out).toBe(`${'x'.repeat(79)}${family}… (xem đủ trên Desk)`);
  });
});

describe('review fixes – chatSafeEmail (SEC GCHAT-01), Cf / separators / marks / IPv4 / name marks (ARC GC-02, SEC 02)', () => {
  const note = (s: string) => chatSafeText(s, { maxChars: 500, singleLine: false });
  const name = (s: string) => chatSafeText(s, { maxChars: 80, singleLine: true, plain: true });

  it.each([
    'https://evil.example/login@ottimo.vn',
    'x|y@example.invalid',
    '*a*@example.invalid',
    '‹users/all›@example.invalid',
    '<users/all>@example.invalid',
    'a@evil.example/login',
    'a@b',
    'a b@example.invalid',
  ])('e-mail %j → the whole field replaced, no `://`', (e) => {
    const out = chatSafeEmail(e);
    expect(out).toBe(CHAT_EMAIL_REPLACEMENT);
    expect(out).not.toContain('://');
  });

  it('plain addresses are printed (lower case, domain dots kept – SEC Q3)', () => {
    expect(chatSafeEmail('Canary.Guest+1@Example.Invalid')).toBe('canary.guest+1@example.invalid');
    expect(chatSafeEmail('a_b%c-d@mail.example.co')).toBe('a_b%c-d@mail.example.co');
  });

  it('zero-width and other format characters cannot protect a domain dot', () => {
    expect(note('evil\u200b.example/login')).toBe('evil[.]example/login');
    expect(note('evil.\u200bexample')).toBe('evil[.]example');
    expect(note('evil\u2060.\ufeffexample')).toBe('evil[.]example');
    expect(name('Ann\u061cA\u00ad')).toBe('AnnA');
  });

  it('a combining mark before the dot is still a domain dot', () => {
    expect(note('x\u0303.com')).toBe('x\u0303[.]com');
  });

  it('U+2028 / U+2029 / U+0085 are line breaks: a name stays one line, a message gets real lines', () => {
    expect(name('Ann\u2028Mở Desk: https://evil.example')).toBe(
      'Ann Mở Desk: https[:]//evil[.]example',
    );
    expect(name('A\u2029B\u0085C')).toBe('A B C');
    expect(note('one\u2028two')).toBe('one\ntwo');
  });

  it('IPv4 dots disabled (name outside the code block); prices and times unchanged', () => {
    expect(name('1.2.3.4/login')).toBe('1[.]2[.]3[.]4/login');
    expect(note('http://10.0.0.1:8080/x')).toBe('http[:]//10[.]0[.]0[.]1:8080/x');
    expect(note('giá 1.5 triệu lúc 22.30, ngày 1.2.2026')).toBe(
      'giá 1.5 triệu lúc 22.30, ngày 1.2.2026',
    );
  });

  it('name: Chat formatting marks removed; the message keeps them (inside the code block)', () => {
    expect(name('*TEST*')).toBe('TEST');
    expect(name('_Ann_ ~Le~ *B*')).toBe('Ann Le B');
    expect(note('*x* _y_ ~z~')).toBe('*x* _y_ ~z~');
  });

  it('emoji ZWJ sequences survive the Cf removal', () => {
    const family = '👨‍👩‍👧';
    expect(name(`Ann ${family}`)).toBe(`Ann ${family}`);
  });
});

describe('BUG-R3-057 – ID / card numbers checked AFTER normalisation (QA FB-01, TC-GC-01, TC-GC-02, TC-GC-06)', () => {
  const note = (s: string) => chatSafeText(s, { maxChars: 500, singleLine: false });
  const name = (s: string) => chatSafeText(s, { maxChars: 80, singleLine: true, plain: true });
  const ZWSP = '\u200b';
  const WJ = '\u2060';
  /** ≥ 9 digits in a row, or digit groups joined by one space / dot / dash / `_` / `/` / `,`. */
  const LONG_DIGITS = /\d(?:[ .\-_/,]?\d){8,}/;

  it.each([
    ['ZWSP inside a CCCD', `0790${ZWSP}12345678`],
    ['word joiners between groups', `079${WJ}203${WJ}012${WJ}345`],
    ['soft hyphen', '079203\u00ad012345'],
    ['ZWSP between card groups (Luhn test card)', `4111${ZWSP}1111${ZWSP}1111${ZWSP}1111`],
    ['underscores (a name loses them – plain)', '079_203_012_345'],
    ['underscores in a card', '4111_1111_1111_1111'],
    ['full-width digits', '０７９２０３０１２３４５'],
    [
      'full-width card digits with full-width spaces',
      '４１１１\u3000１１１１\u3000１１１１\u3000１１１１',
    ],
    ['Arabic-Indic digits', '٠٧٩٢٠٣٠١٢٣٤٥'],
    ['slashes', '079/203/012/345'],
    ['commas in a card', '4111,1111,1111,1111'],
    ['NBSP groups', '079\u00a0203\u00a0012\u00a0345'],
    ['16-digit card in 4 groups, dashes', '4111-1111-1111-1111'],
    ['tab (a control character, dropped)', '079\t203\t012\t345'],
    ['backticks (dropped)', '079`203`012`345'],
    ['ZWSP in an IPv4-shaped CCCD (would print 079[.]203[.]012[.]345)', `07${ZWSP}9.203.012.345`],
    ['CMND split by ZWSP', `123${ZWSP}456${ZWSP}789`],
    ['passport split by ZWSP', `B${ZWSP}1234567`],
  ])('%s → the WHOLE field replaced (name and message)', (_n, s) => {
    expect(note(`CCCD ${s} nhé`)).toBe(CHAT_ID_REPLACEMENT);
    expect(name(s)).toBe(CHAT_ID_REPLACEMENT);
    expect(chatSafeText(s, { maxChars: 80, singleLine: true })).toBe(CHAT_ID_REPLACEMENT);
  });

  it('a name whose double space only collapses after `plain` is still caught', () => {
    expect(name('079_ 203_ 012_ 345')).toBe(CHAT_ID_REPLACEMENT);
    expect(name('*079*203*012*345*')).toBe(CHAT_ID_REPLACEMENT);
  });

  it('a message whose 9th line is joined to the 8th cannot join a number', () => {
    const lines = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', '079 203', '012 345'];
    expect(note(lines.join('\n'))).toBe(CHAT_ID_REPLACEMENT);
  });

  it.each([
    ['a phone number', 'Gọi em số 0905 111 222 nhé', 'Gọi em số 0905 111 222 nhé'],
    ['an international phone', 'WhatsApp +84 905 111 222', 'WhatsApp +84 905 111 222'],
    ['two phones (comma + space)', '0905.111.222, 0905 333 444', '0905.111.222, 0905 333 444'],
    ['a full-width phone (shown as typed)', '０９０５１１１２２２', '０９０５１１１２２２'],
    ['dates with slashes', 'Đến 12/11/2026, đi 15/11/2026', 'Đến 12/11/2026, đi 15/11/2026'],
    ['an amount with its currency', 'Ngân sách 1,500,000 đ/đêm', 'Ngân sách 1,500,000 đ/đêm'],
    ['room numbers and guests', 'Phòng 2, 3 người, 1_2 tuổi', 'Phòng 2, 3 người, 1_2 tuổi'],
  ])('not an ID: %s stays readable', (_n, s, out) => {
    expect(note(s)).toBe(out);
  });

  it('render C (TC-GC-02): split ID in the name, split card in the message → no long digit run; phone kept', async () => {
    const { text } = await run(
      'C',
      baseRow(),
      phoneContact({
        guest_name: '079_203_012_345',
        note: `Số thẻ 4111${ZWSP}1111${ZWSP}1111${ZWSP}1111`,
      }),
    );
    const lines = text.split('\n');
    expect(lines).toContain(`Khách: ${CHAT_ID_REPLACEMENT}`);
    expect(lines).toContain(CHAT_ID_REPLACEMENT);
    expect(lines.filter((l) => l !== DESK && LONG_DIGITS.test(l))).toEqual([
      `Liên hệ: +${PHONE} · kênh: Zalo`,
    ]);
    expect(lines.at(-1)).toBe(DESK);
  });

  it('render C: a valid guest phone is printed, also when the message repeats it', async () => {
    const { text } = await run(
      'C',
      baseRow(),
      phoneContact({ phone_e164: '84905111222', note: 'Gọi 0905 111 222 sau 18:00' }),
    );
    const lines = text.split('\n');
    expect(lines).toContain('Liên hệ: +84905111222 · kênh: Zalo');
    expect(lines).toContain('Gọi 0905 111 222 sau 18:00');
    expect(text).not.toContain(CHAT_ID_REPLACEMENT);
  });

  it.each([
    ['`<` everywhere', '<'.repeat(80), '<'.repeat(500)],
    ['domain dots', 'a.b'.repeat(26), 'a.b '.repeat(125)],
    ['links', 'x://y.z '.repeat(10), 'h://a.b '.repeat(62)],
    ['4-byte emoji and combining marks', '😀ạ̃'.repeat(20), `${'😀'.repeat(125)}${'ạ̃'.repeat(83)}`],
  ])('largest level-C text (TC-GC-06, %s) fits the 4 KB body', async (_n, guestName, msg) => {
    const { text } = await run(
      'C',
      baseRow({ suspicious_flags: ['contains_url', 'possible_duplicate'] }),
      phoneContact({ guest_name: guestName.slice(0, 80), note: msg.slice(0, 500) }),
    );
    expect(text.split('\n').at(-1)).toBe(DESK);
    expect(Buffer.byteLength(JSON.stringify({ text }), 'utf8')).toBeLessThanOrEqual(4096);
  });
});

describe('configuration (★3, G1, G3 – tests 1, 3b)', () => {
  it.each([
    [undefined, 'A', false],
    ['', 'A', false],
    ['c', 'C', false],
    [' C ', 'C', false],
    ['b', 'B', false],
    ['D', 'A', true],
    ['full', 'A', true],
  ])('BOOKING_REQUEST_CHAT_DETAIL_LEVEL=%j → %s (invalid %s)', (raw, level, invalid) => {
    expect(parseChatDetailLevel(raw)).toEqual({ level, invalid });
  });

  it('Desk link base: production = https://desk.ottimo.vn only; staging https without port/path', () => {
    expect(parseChatLinkBase('https://desk.ottimo.vn', 'production')).toBe(
      'https://desk.ottimo.vn',
    );
    expect(parseChatLinkBase('https://desk.ottimo.vn/', 'production')).toBe(
      'https://desk.ottimo.vn',
    );
    for (const bad of [
      'http://desk.ottimo.vn',
      'https://desk.ottimo.vn.evil.test',
      'https://evil.test',
      'https://user@desk.ottimo.vn',
      'https://desk.ottimo.vn:8443',
      'https://desk.ottimo.vn/x',
      'https://desk.ottimo.vn/?a=1',
      '',
      'not a url',
    ]) {
      expect(parseChatLinkBase(bad, 'production'), bad).toBeNull();
    }
    expect(parseChatLinkBase('https://desk.staging.example.test', 'staging')).toBe(
      'https://desk.staging.example.test',
    );
    expect(parseChatLinkBase('https://10.0.0.1', 'staging')).toBeNull();
    expect(parseChatLinkBase('http://localhost:5173', 'dev')).toBe('http://localhost:5173');
  });

  it('resolveChatConfig: off without webhook; invalid webhook / link base → off with a code (never the value)', () => {
    expect(resolveChatConfig({}, 'production')).toMatchObject({
      target: { mode: 'off' },
      level: 'A',
      problems: [],
      offReason: 'NOT_CONFIGURED',
    });
    const bad = resolveChatConfig(
      {
        BOOKING_REQUEST_CHAT_WEBHOOK_URL: `${WEBHOOK}&threadKey=x`,
        BOOKING_REQUEST_CHAT_DETAIL_LEVEL: 'X',
      },
      'production',
    );
    expect(bad).toMatchObject({
      target: { mode: 'off' },
      problems: ['CHAT_DETAIL_LEVEL_INVALID', 'CHAT_WEBHOOK_URL_INVALID'],
    });
    expect(JSON.stringify(bad)).not.toContain('Canary');
    // ARC GC-06: staging/production read ADMIN_BASE_URL only (no APP_BASE_URL fallback).
    expect(
      resolveChatConfig(
        { BOOKING_REQUEST_CHAT_WEBHOOK_URL: WEBHOOK, APP_BASE_URL: 'https://desk.ottimo.vn' },
        'production',
      ),
    ).toMatchObject({ target: { mode: 'off' }, problems: ['CHAT_LINK_BASE_INVALID'] });
    expect(
      resolveChatConfig(
        { BOOKING_REQUEST_CHAT_WEBHOOK_URL: WEBHOOK, APP_BASE_URL: 'http://localhost:5173' },
        'dev',
      ),
    ).toMatchObject({ target: { mode: 'on', linkBase: 'http://localhost:5173' } });
    const link = resolveChatConfig(
      { BOOKING_REQUEST_CHAT_WEBHOOK_URL: WEBHOOK, ADMIN_BASE_URL: 'https://evil.test' },
      'production',
    );
    expect(link).toMatchObject({ target: { mode: 'off' }, problems: ['CHAT_LINK_BASE_INVALID'] });
    const on = resolveChatConfig(
      {
        BOOKING_REQUEST_CHAT_WEBHOOK_URL: WEBHOOK,
        ADMIN_BASE_URL: 'https://desk.ottimo.vn',
        BOOKING_REQUEST_CHAT_DETAIL_LEVEL: 'c',
      },
      'production',
    );
    expect(on).toMatchObject({
      target: { mode: 'on', url: WEBHOOK, level: 'C', linkBase: 'https://desk.ottimo.vn' },
      problems: [],
    });
  });
});

describe('static locks (SEC ★6, ARC 8.2)', () => {
  it('the base SELECT has no C2 column; the contact SELECT has exactly the 5 notice columns, no decline/hmac', () => {
    expect(CHAT_BASE_SQL).not.toMatch(C2);
    expect(CHAT_CONTACT_SQL).not.toMatch(/decline_note|contact_hmac|ip_hmac/);
    const cols = /SELECT ([\s\S]*?)\s+FROM/
      .exec(CHAT_CONTACT_SQL)?.[1]
      ?.split(',')
      .map((c) => c.trim());
    expect(cols).toEqual(['guest_name', 'phone_e164', 'email', 'preferred_channel', 'note']);
  });

  it('the notice threshold is a code constant (SEC chose 2026-10-31), never read from the environment', () => {
    expect(CHAT_DETAILS_MIN_NOTICE_VERSION).toBe('2026-10-31');
    const src = readFileSync(
      join(__dirname, '..', 'src', 'modules', 'public-site', 'public', 'chat-message.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/process\.env/);
  });

  it('chat-message.ts is wired by src/worker-chat.ts (worker), never by a Nest module (lesson of PR #14)', () => {
    const SRC = join(__dirname, '..', 'src');
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
      });
    const importers = files(SRC)
      .filter((f) => /from '[^']*public-site\/public\/chat-message'/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f).split(sep).join('/'))
      .sort();
    expect(importers).toEqual(['jobs/chat-dispatch.ts', 'worker-chat.ts']);
    expect(readFileSync(join(SRC, 'worker.ts'), 'utf8')).toMatch(/buildWorkerChat\(/);
  });

  it('the dispatcher never logs a URL, a text or a response (no such field passed to log)', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'jobs', 'chat-dispatch.ts'), 'utf8');
    for (const m of src.matchAll(/this\.log\(([^;]*?)\);/gs)) {
      expect(m[1]).not.toMatch(/\burl\b|\.text\b|target|payload|body/);
    }
    expect(ChatDispatcher).toBeTypeOf('function');
  });
});
