/**
 * BE-D R3 Sprint 1 – pure rules of the website booking requests (no database): BR-911 sub-source examples,
 * BR-912 deadline + public promise examples (v0.4.0), reference codes (UXD-07), ID/card detection (SR-LOG-04,
 * V-09), form token (ADR-014 4.4), month arithmetic, IP buckets (SR-RL-10).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';
import { issueFormToken, verifyFormToken } from '../src/modules/public-site/internal/form-token';
import { publicSiteOptionsFrom } from '../src/modules/public-site/internal/public-site.options';
import {
  addMonths,
  ipBuckets,
  looksLikeCard,
  looksLikeIdNumber,
  newRefCode,
  normalizeFreeText,
  normalizeRefCode,
  replyPlan,
  slugOf,
  subSourceOf,
} from '../src/modules/public-site/internal/website-request-rules';

const TZ = 'Asia/Ho_Chi_Minh';
const P = {
  hours: { from: '07:00', to: '22:00' },
  responseMinutes: 15,
  sameDayAfterHoursMinutes: 30,
  promiseMinutes: 60,
  promiseNextMorningBy: '09:00',
  promiseCallNowMinutes: 60,
} as const;
const vn = (iso: string) => new Date(`${iso}+07:00`);
const plan = (at: string, arrival: string, today: string, channel = 'zalo') =>
  replyPlan(vn(at), TZ, arrival, today, channel, P);

describe('BR-911 sub-source (OpenAPI DirectSubSource)', () => {
  const own = 'ottimo.example.invalid';
  it.each([
    [{ source: 'facebook', medium: 'social' }, undefined, 'facebook'],
    [{ source: 'Facebook'.toLowerCase() }, 'l.facebook.com', 'facebook'],
    [undefined, 'www.google.com', 'google'],
    [{ source: 'google', medium: 'gbp' }, undefined, 'google'],
    [{ source: 'instagram' }, undefined, 'instagram'],
    [undefined, 'l.facebook.com', 'facebook'],
    [{ source: 'zalo' }, 'l.facebook.com', 'zalo'],
    [undefined, 'www.tripadvisor.com', 'other'],
    [undefined, undefined, null],
    [undefined, 'www.ottimo.example.invalid', null],
    [{ source: 'print', medium: 'qr' }, undefined, 'qr'],
  ])('utm %j ref %s → %s', (utm, ref, want) => {
    expect(subSourceOf(utm, ref, own)).toBe(want);
  });
});

describe('BR-912 reply deadline + public promise (examples v0.4.0)', () => {
  it('09:05 in hours → 09:20, promise within 60 min', () => {
    const p = plan('2026-10-20T09:05:00', '2026-10-23', '2026-10-20');
    expect(p.replyBy).toEqual(vn('2026-10-20T09:20:00'));
    expect(p.promise).toEqual({
      kind: 'within_minutes',
      by: '2026-10-20T10:05:00.000+07:00',
      minutes: 60,
    });
  });
  it('21:50 → 22:05 (after closing is fine)', () => {
    expect(plan('2026-10-20T21:50:00', '2026-11-06', '2026-10-20').replyBy).toEqual(
      vn('2026-10-20T22:05:00'),
    );
  });
  it('22:30, arrival 6/11, Zalo → 07:15 next day; promise before 09:00 next morning', () => {
    const p = plan('2026-10-20T22:30:00', '2026-11-06', '2026-10-20');
    expect(p.replyBy).toEqual(vn('2026-10-21T07:15:00'));
    expect(p.promise).toEqual({ kind: 'next_morning', by: '2026-10-21T09:00:00.000+07:00' });
  });
  it('22:30, phone only → 08:15 (call window BR-973)', () => {
    expect(plan('2026-10-20T22:30:00', '2026-11-06', '2026-10-20', 'phone').replyBy).toEqual(
      vn('2026-10-21T08:15:00'),
    );
  });
  it('23:10, arriving tonight → +30 min internal, promise call_now 60', () => {
    const p = plan('2026-10-20T23:10:00', '2026-10-20', '2026-10-20');
    expect(p.replyBy).toEqual(vn('2026-10-20T23:40:00'));
    expect(p.promise).toMatchObject({ kind: 'call_now', minutes: 60 });
  });
  it('02:00 on 21/10 arriving 21/10: business day is still 20/10 → not tonight → 07:15', () => {
    expect(plan('2026-10-21T02:00:00', '2026-10-21', '2026-10-20').replyBy).toEqual(
      vn('2026-10-21T07:15:00'),
    );
  });
});

describe('reference codes (UXD-07, ARC-04)', () => {
  it('8 Crockford characters, random', () => {
    const codes = new Set(Array.from({ length: 200 }, () => newRefCode()));
    for (const c of codes) expect(c).toMatch(/^[0-9A-HJKMNP-TV-Z]{8}$/);
    expect(codes.size).toBeGreaterThan(195);
  });
  it('what the guest types is normalised', () => {
    expect(normalizeRefCode('w7k3-qx9p')).toBe('W7K3QX9P');
    expect(normalizeRefCode('W7K3 QX9P')).toBe('W7K3QX9P');
    expect(normalizeRefCode('O1LI-ABCD')).toBe('0111ABCD');
    expect(normalizeRefCode('W7K3QX9')).toBeNull();
  });
});

describe('free text (ARC-21, V-09, SR-LOG-04)', () => {
  it('NFC, control and direction characters removed, newlines kept', () => {
    expect(normalizeFreeText('  Anna‮\u0007 Test\nline 2  ')).toBe('Anna Test\nline 2');
    expect(normalizeFreeText('Tiến')).toBe('Tiến');
  });
  it('ID numbers (CCCD 12, CMND 9, passport) detected; phone numbers not', () => {
    expect(looksLikeIdNumber('CCCD 079123456789')).toBe(true);
    expect(looksLikeIdNumber('CMND 123456789')).toBe(true);
    expect(looksLikeIdNumber('passport C1234567')).toBe(true);
    expect(looksLikeIdNumber('call 0905111222 please')).toBe(false);
    expect(looksLikeIdNumber('+84905111222')).toBe(false);
  });
  it('card numbers (Luhn) detected', () => {
    expect(looksLikeCard('card 4111 1111 1111 1111')).toBe(true);
    expect(looksLikeCard('room for 2 adults, 1 child')).toBe(false);
  });
});

describe('form token (ADR-014 4.4)', () => {
  const key = 'k'.repeat(40);
  const t0 = new Date('2026-10-15T02:00:00Z');
  it('valid from +3 s to +2 h, bound to the property and the key', () => {
    const t = issueFormToken(key, 'p1', t0);
    expect(verifyFormToken(key, 'p1', t.token, new Date(t0.getTime() + 2_000))).toEqual({
      ok: false,
      reason: 'too_early',
    });
    expect(verifyFormToken(key, 'p1', t.token, new Date(t0.getTime() + 3_000)).ok).toBe(true);
    expect(verifyFormToken(key, 'p2', t.token, new Date(t0.getTime() + 5_000))).toEqual({
      ok: false,
      reason: 'signature',
    });
    expect(verifyFormToken('x'.repeat(40), 'p1', t.token, new Date(t0.getTime() + 5_000)).ok).toBe(
      false,
    );
    expect(verifyFormToken(key, 'p1', t.token, new Date(t0.getTime() + 2 * 3600_000))).toEqual({
      ok: false,
      reason: 'expired',
    });
    expect(verifyFormToken(key, 'p1', 'v1.garbage', t0)).toEqual({ ok: false, reason: 'format' });
  });
});

describe('dates, slugs, IP buckets', () => {
  it('addMonths clamps to the end of month', () => {
    expect(addMonths('2026-12-01', 3)).toBe('2027-03-01');
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28');
  });
  it('room type slug', () => {
    expect(slugOf('Standard Studio · Garden View')).toBe('standard-studio-garden-view');
    expect(slugOf('Phòng Đôi')).toBe('phong-doi');
  });
  it('IPv6 → /64 and /48; IPv4 as is', () => {
    expect(ipBuckets('2001:db8:1:2:aaaa::1')).toEqual({
      host: '2001:db8:1:2::/64',
      range48: '2001:db8:1::/48',
    });
    expect(ipBuckets('::ffff:203.0.113.9')).toEqual({ host: '203.0.113.9', range48: null });
  });
});

/**
 * Migration 0086 (US-155, v1.0) rewrites four CHECK lists that other streams also extend (ARC S1-09: the later
 * migration carries the union). Each list of 0086 = the list of the newest earlier migration that wrote it + only
 * the US-155 values – nothing dropped, nothing else added.
 */
describe('0086 CHECK lists = previous list + US-155 values only (ARC S1-09)', () => {
  const dir = join(__dirname, '..', 'src', 'db', 'migrations');
  const migrations = readdirSync(dir)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .sort()
    .map((f) => ({ f, sql: readFileSync(join(dir, f), 'utf8') }));
  /** Values of the last `CONSTRAINT "<name>" CHECK (…)` of a file (balanced parentheses), or null. */
  const valuesOf = (sql: string, name: string): string[] | null => {
    const re = new RegExp(`CONSTRAINT "?${name}"? CHECK`, 'g');
    let at = -1;
    for (let m = re.exec(sql); m; m = re.exec(sql)) at = m.index + m[0].length;
    if (at < 0) return null;
    const open = sql.indexOf('(', at);
    let depth = 0;
    let end = open;
    for (; end < sql.length; end += 1) {
      if (sql[end] === '(') depth += 1;
      else if (sql[end] === ')' && --depth === 0) break;
    }
    return [...sql.slice(open, end).matchAll(/'([a-z_]+)'/g)].map((m) => m[1]!).sort();
  };
  const cases: Array<[string, string[]]> = [
    [
      'staff_notification_kind_check',
      [
        'public_booking_toggled',
        'website_request_cap_reached',
        'website_request_linked_hold',
        'website_request_new',
        'website_request_overdue',
      ],
    ],
    ['staff_notification_ref_type_check', ['website_booking_request']],
    ['purge_journal_action_check', ['delete_row']],
    ['idempotency_key_principal_type_check', ['public_site']],
  ];
  it.each(cases)('%s', (name, added) => {
    const i = migrations.findIndex((m) => m.f.startsWith('0086_'));
    expect(i).toBeGreaterThan(0);
    const now = valuesOf(migrations[i]!.sql, name);
    const before = migrations
      .slice(0, i)
      .map((m) => valuesOf(m.sql, name))
      .filter((v): v is string[] => v !== null)
      .pop();
    expect(before, `no earlier migration writes ${name}`).toBeDefined();
    expect(now).toEqual([...new Set([...before!, ...added])].sort());
    expect(before!.filter((v) => added.includes(v))).toEqual([]);
  });
});

describe('SEC Phụ lục B.1.10: the form signing key stops the start when too short or shared', () => {
  const base = { APP_ENV: 'dev', DATABASE_URL: 'postgres://ottimo_app:x@localhost:5432/ottimo' };
  it('< 32 characters → the module refuses to start; 32 → ready', () => {
    expect(() => publicSiteOptionsFrom({ PUBLIC_FORM_SIGNING_KEY: 'k'.repeat(31) })).toThrow(
      /PUBLIC_FORM_SIGNING_KEY must be at least 32 characters/,
    );
    expect(publicSiteOptionsFrom({ PUBLIC_FORM_SIGNING_KEY: 'k'.repeat(32) }).signingKey).toBe(
      'k'.repeat(32),
    );
    expect(publicSiteOptionsFrom({}).signingKey).toBeNull();
  });
  it('the same value as another key (one key per purpose, ADR-013 5) → configuration error', () => {
    const shared = 's'.repeat(32);
    expect(() =>
      loadConfig({ ...base, SESSION_SECRET: shared, PUBLIC_FORM_SIGNING_KEY: shared }),
    ).toThrow(/PUBLIC_FORM_SIGNING_KEY must differ from SESSION_SECRET/);
  });
});

describe('ARC FB-R3-ARC-US155-02: only the T19 job deletes website_booking_request rows (spam)', () => {
  const SRC = join(__dirname, '..', 'src');
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) return f === 'migrations' ? [] : files(p);
      return p.endsWith('.ts') ? [p] : [];
    });
  it('the single DELETE is in public-site/public/worker-jobs.ts and keeps `status = spam`', () => {
    const hits = files(SRC)
      .map((p) => ({ path: relative(SRC, p), text: readFileSync(p, 'utf8') }))
      .filter((f) => /DELETE\s+FROM\s+website_booking_request/i.test(f.text));
    expect(hits.map((h) => h.path)).toEqual(['modules/public-site/public/worker-jobs.ts']);
    const stmt = /DELETE\s+FROM\s+website_booking_request[\s\S]*?RETURNING/i.exec(
      hits[0]!.text,
    )![0];
    expect(stmt).toMatch(/status = 'spam'/);
    // 0087: the database refuses any other row (trigger) – also checked on PostgreSQL in public-site-r3-bed.
    const sql = readFileSync(
      join(SRC, 'db', 'migrations', '0087_public_site_slug_unique.sql'),
      'utf8',
    );
    expect(sql).toMatch(/BEFORE DELETE ON website_booking_request/);
  });
});
