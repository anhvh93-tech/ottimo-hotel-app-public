/**
 * US-155 phần Desk (R3-Q06) + public form server on the real PostgreSQL – BE-D R3 Sprint 1.
 * Contract: OpenAPI 0.3.8 (frozen 0.3.7 bổ sung 2 for US-155): getPublicFormToken, createWebsiteBookingRequest,
 * listWebsiteBookingRequests, getWebsiteBookingRequest, transitionWebsiteBookingRequest,
 * lookupWebsiteBookingRequests; erd 4.14; SM-18; SEC ARC-02…23 / C-2 / C-3; BR-911…914.
 * Fake clock (T0 = Thu 15/10/2026 09:00 VN, inside the desk hours). FAKE data only (example.invalid, fake phones).
 */
import { randomUUID } from 'node:crypto';
import { Client as PgClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { JobRunner } from '../../src/jobs/job-runner';
import {
  WEBSITE_REQUEST_PORT,
  type WebsiteRequestPortContract,
} from '../../src/modules/public-site/public/website-request.port';
import {
  WEB_REQUEST_PURGE_JOB_KEY,
  WEB_REQUEST_SLA_JOB_KEY,
  WEB_REQUEST_STALE_JOB_KEY,
} from '../../src/modules/public-site/public/worker-jobs';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { seedStay, staff } from '../helpers/registration-fixture';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const LANDING = 'https://ottimo.example.invalid';
const SIGNING_KEY = 'test-public-form-signing-key-0123456789abcdef';
const NOTICE = '2026-10-01';
const PHONE = '0905 111 222';

describe.skipIf(!HAS_DB)('US-155 website booking requests (BE-D R3 Sprint 1)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let slug: string;
  const tok = (u: string) => t.users[u]!.sessionToken;
  const env = { ...process.env };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  /** Move the clock and keep the staff sessions alive (idle timeout – like the other suites). */
  const at = async (iso: string | Date) => {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const property = () => ({
    propertyId: t.propertyIds[0]!,
    organizationId: t.organizationId,
    timezone: 'Asia/Ho_Chi_Minh',
  });
  // A fresh /16 per run: the DB counters (rate_limit_counter) outlive a run on a reused test database.
  const net = `10.${Math.floor(Math.random() * 250)}`;
  let ipSeq = 10;
  const nextIp = () => `${net}.${Math.floor(ipSeq / 250)}.${(ipSeq += 1) % 250}`;

  const formToken = (headers: Record<string, string> = {}, ip = '203.0.113.1') =>
    fa.app.inject({
      method: 'GET',
      url: `/v1/public/properties/${slug}/form-token`,
      headers,
      remoteAddress: ip,
    });
  const submit = (
    body: Record<string, unknown>,
    opts: { origin?: string | null; key?: string; ip?: string; contentType?: string } = {},
  ) => {
    const headers: Record<string, string> = {
      'content-type': opts.contentType ?? 'application/json',
      'idempotency-key': opts.key ?? randomUUID(),
    };
    if (opts.origin !== null) headers.origin = opts.origin ?? LANDING;
    return fa.app.inject({
      method: 'POST',
      url: `/v1/public/properties/${slug}/booking-requests`,
      headers,
      payload: JSON.stringify(body),
      remoteAddress: opts.ip ?? nextIp(),
    });
  };
  /** A fresh token, usable 3 s later (the clock moves 5 s). */
  const freshToken = async (): Promise<string> => {
    const r = await formToken();
    expect(r.statusCode, r.body).toBe(200);
    fa.clock.set(new Date(fa.clock.now().getTime() + 5_000));
    return r.json().token as string;
  };
  const form = (token: string, extra: Record<string, unknown> = {}) => ({
    formToken: token,
    stayType: 'short',
    arrival: '2026-10-23',
    departure: '2026-10-26',
    adults: 2,
    children: 0,
    infants: 1,
    guestName: 'Anna Test',
    phone: PHONE,
    preferredChannel: 'zalo',
    note: 'Late arrival around 22:00',
    locale: 'en',
    consent: true,
    consentVersion: NOTICE,
    utm: { source: 'facebook', medium: 'social', campaign: 'page_book_button' },
    landingPath: '/',
    ...extra,
  });
  const desk = (who: string, method: 'GET' | 'POST', url: string, opts = {}) =>
    staff(fa, tok(who), null, method, `${P(t)}/website-booking-requests${url}`, opts);
  const notified = (kind: string, refId: string) =>
    q<{ username: string }>(
      `SELECT u.username FROM staff_notification n JOIN app_user u ON u.id = n.user_id
        WHERE n.kind = $1 AND n.ref_id = $2 ORDER BY u.username`,
      [kind, refId],
    ).then((rows) => rows.map((r) => r.username.split('.')[1]));

  beforeAll(async () => {
    process.env.LANDING_BASE_URL = `${LANDING}/`;
    process.env.PUBLIC_FORM_SIGNING_KEY = SIGNING_KEY;
    db = appDatabase(10);
    t = await createTenant(db, {
      users: {
        own: ['owner'],
        mgr: ['manager'],
        fdl: ['front_desk_lead'],
        fd: ['front_desk'],
        sal: ['sales_staff'],
        sal2: ['sales_staff'],
        ctv: ['collaborator'],
      },
    });
    ids = await seedBooking(db, t);
    // A slug of its own (other suites' tenants also have a property `P0`).
    slug = `ws-${randomUUID().slice(0, 8)}`;
    await q(`UPDATE property SET code = $2 WHERE id = $1`, [t.propertyIds[0], slug.toUpperCase()]);
    await q(`UPDATE room SET public_room_type = 'Standard Studio' WHERE room_no IN ('202', '203')`);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    process.env.LANDING_BASE_URL = env.LANDING_BASE_URL;
    process.env.PUBLIC_FORM_SIGNING_KEY = env.PUBLIC_FORM_SIGNING_KEY;
    if (env.LANDING_BASE_URL === undefined) delete process.env.LANDING_BASE_URL;
    if (env.PUBLIC_FORM_SIGNING_KEY === undefined) delete process.env.PUBLIC_FORM_SIGNING_KEY;
    await fa?.close();
    await db?.close();
  });

  it('OFF by default (US-155 AC4): form token and submit answer 404 like an unknown property', async () => {
    await at('2026-10-15T09:00:00+07:00');
    expect((await formToken()).statusCode).toBe(404);
    const r = await submit(form('v1.xxxxxxxxxxxxxxxxxxxxxxxx'));
    expect(r.statusCode, r.body).toBe(404);
    const unknown = await fa.app.inject({
      method: 'GET',
      url: '/v1/public/properties/nope-99/form-token',
    });
    expect(unknown.statusCode).toBe(404);
  });

  it('switch ON needs the published notices (SEC ARC-17 → 422 PUBLIC_FORM_NOT_READY), then tells OWN + MGR', async () => {
    const put = () =>
      staff(fa, tok('own'), null, 'PUT', `${P(t)}/parameters/public_booking_requests_enabled`, {
        json: { value: true, effectiveFrom: '2026-10-15', reason: 'Mở form thử trên staging' },
      });
    const refused = await put();
    expect(refused.statusCode, refused.body).toBe(422);
    expect(refused.json()).toMatchObject({
      code: 'PUBLIC_FORM_NOT_READY',
      missing: ['privacy_notice_version.vi', 'privacy_notice_version.en'],
    });
    const mgr = await staff(
      fa,
      tok('mgr'),
      null,
      'PUT',
      `${P(t)}/parameters/public_booking_requests_enabled`,
      { json: { value: true, effectiveFrom: '2026-10-15', reason: 'Quản lý thử bật' } },
    );
    expect(mgr.statusCode).toBe(403);
    // The landing release writes the notices (OPS data migration – owner role, organisation context).
    const pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    try {
      await pg.query('BEGIN');
      await pg.query('SET LOCAL ROLE ottimo_owner');
      await pg.query(`SELECT set_config('app.organization_id', $1, true)`, [t.organizationId]);
      for (const locale of ['vi', 'en']) {
        await pg.query(
          `INSERT INTO privacy_notice_version (organization_id, version, locale, body_sha256, url_path, published_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            t.organizationId,
            NOTICE,
            locale,
            'a'.repeat(64),
            locale === 'vi' ? '/vi/privacy/' : '/privacy/',
            '2026-10-01T00:00:00Z',
          ],
        );
      }
      await pg.query('COMMIT');
    } finally {
      await pg.end();
    }
    const ok = await put();
    expect(ok.statusCode, ok.body).toBe(200);
    const n = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM staff_notification WHERE kind = 'public_booking_toggled'`,
    );
    expect(n[0]?.n).toBe(2);
  });

  it('form token: cross-site fetch refused (ARC-13 p.6); token usable from +3 s, once', async () => {
    const cross = await formToken({ 'sec-fetch-site': 'cross-site' });
    expect(cross.statusCode).toBe(403);
    const r = await formToken({ 'sec-fetch-site': 'same-origin' });
    expect(r.statusCode, r.body).toBe(200);
    expect(r.headers['cache-control']).toBe('no-store');
    expect(r.json()).toMatchObject({ minDelaySeconds: 3 });
    const early = await submit(form(r.json().token));
    expect(early.statusCode).toBe(422);
    expect(early.json().code).toBe('FORM_TOKEN_INVALID');
  });

  let first: { id: string; refCode: string };
  it('a valid request: 202 refCode + public promise, stored `new`, source facebook, FDL/FD/SAL told without name', async () => {
    await at('2026-10-15T09:00:00+07:00');
    const token = await freshToken();
    const key = randomUUID();
    const r = await submit(form(token), { key });
    expect(r.statusCode, r.body).toBe(202);
    expect(r.headers['cache-control']).toBe('no-store');
    const body = r.json();
    expect(Object.keys(body).sort()).toEqual(['promise', 'refCode']);
    expect(body.refCode).toMatch(/^[0-9A-HJKMNP-TV-Z]{8}$/);
    expect(body.promise).toEqual({
      kind: 'within_minutes',
      by: '2026-10-15T10:00:05.000+07:00',
      minutes: 60,
    });
    const [row] = await q<Record<string, unknown>>(
      `SELECT id, status, sub_source, phone_e164, email, stay_kind, reply_by, ip_hmac IS NOT NULL AS has_ip,
              contact_hmac IS NOT NULL AS has_contact, utm_source FROM website_booking_request WHERE ref_code = $1`,
      [body.refCode],
    );
    expect(row).toMatchObject({
      status: 'new',
      sub_source: 'facebook',
      phone_e164: '84905111222',
      email: null,
      stay_kind: 'short',
      has_ip: true,
      has_contact: true,
      utm_source: 'facebook',
    });
    // BR-912: inside the desk hours → received + 15 min.
    expect(row?.reply_by).toEqual(new Date('2026-10-15T09:15:05+07:00'));
    first = { id: row?.id as string, refCode: body.refCode };
    expect(await notified('website_request_new', first.id)).toEqual(['fd', 'fdl', 'sal', 'sal2']);
    const n = await q<{ ref_code: string | null }>(
      `SELECT DISTINCT ref_code FROM staff_notification WHERE kind = 'website_request_new' AND ref_id = $1`,
      [first.id],
    );
    expect(n).toEqual([{ ref_code: first.refCode }]);
    // Same key, same body → the stored answer; the token cannot be used again with a new key.
    const replay = await submit(form(token), { key });
    expect(replay.statusCode).toBe(202);
    expect(replay.headers['idempotent-replayed']).toBe('true');
    expect(replay.json()).toEqual(body);
    const again = await submit(form(token));
    expect(again.json().code).toBe('FORM_TOKEN_INVALID');
  });

  it('Origin landing only; JSON only; Idempotency-Key required', async () => {
    const token = await freshToken();
    expect((await submit(form(token), { origin: null })).statusCode).toBe(403);
    expect((await submit(form(token), { origin: 'null' })).statusCode).toBe(403);
    expect((await submit(form(token), { origin: 'https://evil.example.invalid' })).statusCode).toBe(
      403,
    );
    const noKey = await fa.app.inject({
      method: 'POST',
      url: `/v1/public/properties/${slug}/booking-requests`,
      headers: { origin: LANDING, 'content-type': 'application/json' },
      payload: JSON.stringify(form(token)),
      remoteAddress: nextIp(),
    });
    expect(noKey.statusCode).toBe(428);
  });

  it('validation answers field + code only (never the value): one contact by channel, ID number, notice version', async () => {
    const token = await freshToken();
    const r = await submit(
      form(token, {
        preferredChannel: 'email',
        email: 'anna@example.invalid',
        note: 'CCCD 079123456789',
        consentVersion: '2020-01-01',
      }),
    );
    expect(r.statusCode).toBe(422);
    expect(r.body).not.toContain('079123456789');
    expect(r.json().errors).toEqual(
      expect.arrayContaining([
        { field: 'phone', code: 'NOT_ALLOWED' },
        { field: 'note', code: 'ID_NUMBER_DETECTED' },
      ]),
    );
    const t2 = await freshToken();
    const v = await submit(form(t2, { consentVersion: '2020-01-01', arrival: '2026-10-10' }));
    expect(v.json().errors).toEqual(
      expect.arrayContaining([
        { field: 'arrival', code: 'DATE_IN_PAST' },
        { field: 'consentVersion', code: 'NOTICE_VERSION_INVALID' },
      ]),
    );
    // A failed request did not consume its token (rolled back with the rest).
    const ok = await submit(form(t2, { phone: '0905 333 444' }));
    expect(ok.statusCode, ok.body).toBe(202);
  });

  it('honeypot → identical 202, nothing stored (ARC-15)', async () => {
    const before = await q<{ n: number }>('SELECT count(*)::int AS n FROM website_booking_request');
    const token = await freshToken();
    const r = await submit(form(token, { website: 'http://spam.example.invalid' }));
    expect(r.statusCode).toBe(202);
    expect(Object.keys(r.json()).sort()).toEqual(['promise', 'refCode']);
    const after = await q<{ n: number }>('SELECT count(*)::int AS n FROM website_booking_request');
    expect(after[0]?.n).toBe(before[0]?.n);
  });

  it('3 per contact and day; the 4th is silent: no row, duplicateCount + 1, repeat_contact, alias code (ARC-04/15); possible duplicate flagged', async () => {
    const phone = '+7 912 345 6789';
    const codes: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const token = await freshToken();
      const r = await submit(
        form(token, {
          phone,
          preferredChannel: 'whatsapp',
          arrival: '2026-11-0' + (i + 1),
          departure: '2026-11-1' + i,
        }),
      );
      expect(r.statusCode, r.body).toBe(202);
      codes.push(r.json().refCode);
    }
    const rows = await q<Record<string, unknown>>(
      `SELECT ref_code, duplicate_count, suspicious_flags, alias_ref_codes, cardinality(related_request_ids) AS rel
         FROM website_booking_request WHERE phone_e164 = '79123456789' ORDER BY created_at`,
    );
    expect(rows.map((r) => r.ref_code)).toEqual(codes.slice(0, 3));
    const last = rows[2] as Record<string, unknown>;
    expect(last.duplicate_count).toBe(1);
    expect(last.suspicious_flags).toEqual(
      expect.arrayContaining(['repeat_contact', 'possible_duplicate']),
    );
    expect(last.alias_ref_codes).toEqual([codes[3]]);
    expect(Number(rows[0]?.rel)).toBe(2);
  });

  it('daily cap → 503 SITE_BUSY (no false success), OWN told once a day', async () => {
    await q(
      `INSERT INTO rate_limit_counter (bucket_key, window_start, count, expires_at) VALUES ($1, $2, 100, $3)
       ON CONFLICT (bucket_key, window_start) DO UPDATE SET count = 100`,
      [
        `webreq:property:${t.propertyIds[0]}:day`,
        new Date('2026-10-15T00:00:00Z'),
        new Date('2026-10-17T00:00:00Z'),
      ],
    );
    for (let i = 0; i < 2; i += 1) {
      const token = await freshToken();
      const r = await submit(form(token, { phone: `0905 777 00${i}` }));
      expect(r.statusCode, r.body).toBe(503);
      expect(r.json().code).toBe('SITE_BUSY');
      expect(Number(r.headers['retry-after'])).toBeGreaterThan(0);
    }
    expect(await notified('website_request_cap_reached', t.propertyIds[0]!)).toEqual(['own']);
    await q(`DELETE FROM rate_limit_counter WHERE bucket_key = $1`, [
      `webreq:property:${t.propertyIds[0]}:day`,
    ]);
  });

  it('Desk list: FD+ all with contact; SAL new unassigned WITHOUT name/phone/note (ARC-19); CTV 403; ref code search', async () => {
    const fd = await desk('fd', 'GET', '');
    expect(fd.statusCode, fd.body).toBe(200);
    const mine = (fd.json().data as Array<Record<string, unknown>>).find((r) => r.id === first.id);
    expect(mine).toMatchObject({
      refCode: first.refCode,
      status: 'new',
      guestName: 'Anna Test',
      phone: '+84905111222',
      subSource: 'facebook',
      nights: 3,
      stayKind: 'short',
      roomTypeLabel: null,
      arrivesToday: false,
    });
    expect((mine?.allowedActions as Array<{ action: string }>).map((a) => a.action)).toEqual([
      'claim',
      'decline',
      'mark-spam',
    ]);
    const sal = await desk('sal', 'GET', '');
    const salRow = (sal.json().data as Array<Record<string, unknown>>).find(
      (r) => r.id === first.id,
    );
    expect(salRow).toBeDefined();
    for (const k of ['guestName', 'phone', 'email', 'note']) expect(salRow).not.toHaveProperty(k);
    expect((await desk('ctv', 'GET', '')).statusCode).toBe(403);
    const typed = `${first.refCode.slice(0, 4).toLowerCase()}-${first.refCode.slice(4)}`;
    const found = await desk('fd', 'GET', `?refCode=${encodeURIComponent(typed)}`);
    expect((found.json().data as Array<{ id: string }>).map((r) => r.id)).toEqual([first.id]);
  });

  it('claim (WR1) with If-Match: the second claim is refused; SAL then sees the contact; stale version → 412', async () => {
    const g = await desk('sal', 'GET', `/${first.id}`);
    expect(g.statusCode).toBe(200);
    const v = Number(String(g.headers.etag).replace(/"/g, ''));
    const claim = await desk('sal', 'POST', `/${first.id}/actions/claim`, { ifMatch: v });
    expect(claim.statusCode, claim.body).toBe(200);
    expect(claim.json()).toMatchObject({ status: 'in_progress', guestName: 'Anna Test' });
    expect(claim.json().assignedUserId).toBe(t.users.sal!.id);
    const twice = await desk('fd', 'POST', `/${first.id}/actions/claim`, { ifMatch: v + 1 });
    expect(twice.statusCode).toBe(409);
    expect(twice.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'in_progress' });
    const stale = await desk('sal', 'POST', `/${first.id}/actions/release`, { ifMatch: v });
    expect(stale.statusCode).toBe(412);
    // Another SAL no longer sees it.
    expect((await desk('sal2', 'GET', `/${first.id}`)).statusCode).toBe(404);
  });

  it('decline (WR3): reason required, `other` needs a note, system codes refused; reopen (WR5) by the decliner', async () => {
    const v = async () =>
      Number(String((await desk('sal', 'GET', `/${first.id}`)).headers.etag).replace(/"/g, ''));
    const noCode = await desk('sal', 'POST', `/${first.id}/actions/decline`, {
      ifMatch: await v(),
      json: {},
    });
    expect(noCode.json().errors).toEqual([{ field: 'reasonCode', code: 'REQUIRED' }]);
    const sys = await desk('sal', 'POST', `/${first.id}/actions/decline`, {
      ifMatch: await v(),
      json: { reasonCode: 'stale' },
    });
    expect(sys.json().errors).toEqual([{ field: 'reasonCode', code: 'NOT_IN_LIST' }]);
    const other = await desk('sal', 'POST', `/${first.id}/actions/decline`, {
      ifMatch: await v(),
      json: { reasonCode: 'other' },
    });
    expect(other.json().errors).toEqual([{ field: 'note', code: 'REASON_REQUIRED' }]);
    const ok = await desk('sal', 'POST', `/${first.id}/actions/decline`, {
      ifMatch: await v(),
      json: { reasonCode: 'no_availability' },
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json()).toMatchObject({ status: 'declined', declineReasonCode: 'no_availability' });
    const reopen = await desk('sal', 'POST', `/${first.id}/actions/reopen`, { ifMatch: await v() });
    expect(reopen.statusCode, reopen.body).toBe(200);
    expect(reopen.json()).toMatchObject({ status: 'in_progress', declineReasonCode: null });
    const hist = await q<{ to_state: string; event_code: string }>(
      `SELECT to_state, event_code FROM state_transition WHERE entity_id = $1 ORDER BY occurred_at, id`,
      [first.id],
    );
    expect(hist.map((h) => h.event_code)).toEqual([
      'submit_website_request',
      'claim_website_request',
      'decline_website_request',
      'reopen_website_request',
    ]);
  });

  it('lookup by contact (ARC-16): OWN/MGR/FDL only; ids + codes, no C2; audit with the count only', async () => {
    expect((await desk('fd', 'POST', '/lookup', { json: { phone: PHONE } })).statusCode).toBe(403);
    const both = await desk('fdl', 'POST', '/lookup', {
      json: { phone: PHONE, email: 'a@example.invalid' },
    });
    expect(both.statusCode).toBe(422);
    const r = await desk('fdl', 'POST', '/lookup', { json: { phone: '+84905111222' } });
    expect(r.statusCode, r.body).toBe(200);
    expect(r.json().data).toEqual([
      expect.objectContaining({ id: first.id, refCode: first.refCode, status: 'in_progress' }),
    ]);
    expect(Object.keys(r.json().data[0]).sort()).toEqual(['createdAt', 'id', 'refCode', 'status']);
    const audit = await q<{ after: unknown }>(
      `SELECT after FROM audit_event WHERE action = 'website_request.lookup'`,
    );
    expect(audit).toEqual([{ after: { resultCount: 1 } }]);
  });

  it('erase (WR8, ARC-16): FD/SAL 403; wrong contact → CONTACT_MISMATCH; then C2 gone, journal dsr_erase, no reopen', async () => {
    const v = async () =>
      Number(String((await desk('fdl', 'GET', `/${first.id}`)).headers.etag).replace(/"/g, ''));
    const fd = await desk('fd', 'POST', `/${first.id}/actions/erase`, {
      ifMatch: await v(),
      json: { verificationMethod: 'called_back' },
    });
    expect(fd.statusCode).toBe(403);
    const wrong = await desk('fdl', 'POST', `/${first.id}/actions/erase`, {
      ifMatch: await v(),
      json: { verificationMethod: 'same_contact', verifiedContact: '0905 000 000' },
    });
    expect(wrong.json().errors).toEqual([{ field: 'verifiedContact', code: 'CONTACT_MISMATCH' }]);
    const ok = await desk('fdl', 'POST', `/${first.id}/actions/erase`, {
      ifMatch: await v(),
      json: { verificationMethod: 'same_contact', verifiedContact: '+84 905 111 222' },
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json()).toMatchObject({ status: 'declined', declineReasonCode: 'erased_on_request' });
    for (const k of ['guestName', 'phone', 'note']) expect(ok.json()).not.toHaveProperty(k);
    expect(ok.json().piiPurgedAt).not.toBeNull();
    const [row] = await q<Record<string, unknown>>(
      `SELECT guest_name, phone_e164, note, contact_hmac, ip_hmac FROM website_booking_request WHERE id = $1`,
      [first.id],
    );
    expect(row).toEqual({
      guest_name: null,
      phone_e164: null,
      note: null,
      contact_hmac: null,
      ip_hmac: null,
    });
    const j = await q(`SELECT policy_key, action FROM purge_journal WHERE subject_id = $1`, [
      first.id,
    ]);
    expect(j).toEqual([{ policy_key: 'dsr_erase', action: 'null_columns' }]);
    const reopen = await desk('fdl', 'POST', `/${first.id}/actions/reopen`, { ifMatch: await v() });
    expect(reopen.statusCode).toBe(409);
  });

  it('"Cần chú ý" website_request_new: FD+ only, count of new; critical when one arrives today', async () => {
    const token = await freshToken();
    const r = await submit(
      form(token, { phone: '0905 444 555', arrival: '2026-10-15', departure: '2026-10-16' }),
    );
    expect(r.statusCode, r.body).toBe(202);
    const items = async (who: string) => {
      const res = await staff(fa, tok(who), null, 'GET', `${P(t)}/attention`);
      return ((res.json().data ?? res.json().items ?? []) as Array<Record<string, unknown>>).filter(
        (i) => i.kind === 'website_request_new',
      );
    };
    const fd = await items('fd');
    expect(fd).toHaveLength(1);
    expect(fd[0]).toMatchObject({ source: 'computed', severity: 'critical' });
    expect(Object.keys(fd[0]?.params as object)).toEqual(['count']);
    expect(JSON.stringify(fd[0])).not.toContain('Anna');
  });

  it('jobs: overdue reminder once (FDL + MGR) at replyBy + 15; WR7 stale after 30 days; T19 purge after 90; spam row deleted after 7', async () => {
    const runner = fa.app.get(JobRunner);
    const [row] = await q<{ id: string; reply_by: Date }>(
      `SELECT id, reply_by FROM website_booking_request WHERE phone_e164 = '84905444555'`,
    );
    await at(new Date(row!.reply_by.getTime() + 14 * 60_000));
    expect((await runner.runOnce(WEB_REQUEST_SLA_JOB_KEY, property())).stats).toEqual({
      escalated: 0,
    });
    await at(new Date(row!.reply_by.getTime() + 15 * 60_000));
    const first = (await runner.runOnce(WEB_REQUEST_SLA_JOB_KEY, property())).stats as {
      escalated: number;
    };
    expect(first.escalated).toBeGreaterThanOrEqual(1);
    expect((await runner.runOnce(WEB_REQUEST_SLA_JOB_KEY, property())).stats).toEqual({
      escalated: 0,
    });
    expect(await notified('website_request_overdue', row!.id)).toEqual(['fdl', 'mgr']);
    // A spam request (FD marks it).
    const v = Number(
      String((await desk('fd', 'GET', `/${row!.id}`)).headers.etag).replace(/"/g, ''),
    );
    expect(
      (await desk('fd', 'POST', `/${row!.id}/actions/mark-spam`, { ifMatch: v })).statusCode,
    ).toBe(200);
    // 30 days without activity → stale for the others still open.
    await at('2026-11-15T06:10:00+07:00');
    const stale = (await runner.runOnce(WEB_REQUEST_STALE_JOB_KEY, property())).stats as {
      closed: number;
    };
    expect(stale.closed).toBeGreaterThanOrEqual(3);
    const open = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM website_booking_request WHERE status IN ('new', 'in_progress')`,
    );
    expect(open[0]?.n).toBe(0);
    // Spam deleted (7 days), declined purged at 90 days after the decline.
    const purge1 = (await runner.runOnce(WEB_REQUEST_PURGE_JOB_KEY, property())).stats;
    expect(purge1).toMatchObject({ spamDeleted: 1, purged: 0 });
    expect(await q(`SELECT 1 FROM website_booking_request WHERE id = $1`, [row!.id])).toEqual([]);
    await at('2027-02-14T03:15:00+07:00');
    const purge2 = (await runner.runOnce(WEB_REQUEST_PURGE_JOB_KEY, property())).stats as {
      purged: number;
    };
    expect(purge2.purged).toBeGreaterThanOrEqual(3);
    const left = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM website_booking_request WHERE pii_purged_at IS NULL AND status <> 'converted'`,
    );
    expect(left[0]?.n).toBe(0);
    const kept = await q<Record<string, unknown>>(
      `SELECT sub_source, adults, arrival_date::text AS arrival FROM website_booking_request
        WHERE phone_e164 IS NULL AND sub_source = 'facebook' LIMIT 1`,
    );
    expect(kept[0]).toMatchObject({ sub_source: 'facebook', adults: 2 });
  });

  it('WebsiteRequestPort: markConverted (WR6) by FD+ → converted, C2 gone in the same transaction; SAL not holding → unchanged + holder told', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const token = await freshToken();
    const r = await submit(
      form(token, { phone: '0905 666 777', arrival: '2026-11-20', departure: '2026-11-22' }),
    );
    expect(r.statusCode, r.body).toBe(202);
    const [req] = await q<{ id: string }>(
      `SELECT id FROM website_booking_request WHERE phone_e164 = '84905666777'`,
    );
    const stay = await seedStay(db, t, ids, {
      roomNo: '203',
      arrival: '2026-11-20',
      departure: '2026-11-22',
    });
    const port = fa.app.get<WebsiteRequestPortContract>(WEBSITE_REQUEST_PORT);
    const now = fa.clock.now();
    // SAL claims; then another SAL's booking links it → not converted, the holder is told.
    const v = Number(
      String((await desk('sal', 'GET', `/${req!.id}`)).headers.etag).replace(/"/g, ''),
    );
    expect(
      (await desk('sal', 'POST', `/${req!.id}/actions/claim`, { ifMatch: v })).statusCode,
    ).toBe(200);
    const other = await db.withContext(t.ctx(), (tx) =>
      port.markConverted(tx, {
        requestId: req!.id,
        reservationId: stay.reservationId,
        actor: { userId: t.users.sal2!.id, roles: ['sales_staff'] },
        now,
      }),
    );
    expect(other).toMatchObject({ converted: false, subSource: 'facebook', status: 'in_progress' });
    expect(await notified('website_request_linked_hold', req!.id)).toEqual(['sal']);
    const done = await db.withContext(t.ctx(), (tx) =>
      port.markConverted(tx, {
        requestId: req!.id,
        reservationId: stay.reservationId,
        actor: { userId: t.users.fd!.id, roles: ['front_desk'] },
        now,
      }),
    );
    expect(done).toMatchObject({ converted: true, subSource: 'facebook', status: 'converted' });
    const [row] = await q<Record<string, unknown>>(
      `SELECT status, reservation_id, guest_name, phone_e164, pii_purged_at IS NOT NULL AS purged
         FROM website_booking_request WHERE id = $1`,
      [req!.id],
    );
    expect(row).toEqual({
      status: 'converted',
      reservation_id: stay.reservationId,
      guest_name: null,
      phone_e164: null,
      purged: true,
    });
    const g = await desk('fd', 'GET', `/${req!.id}`);
    expect(g.json()).toMatchObject({ status: 'converted', allowedActions: [] });
    expect(g.json().reservationCode).toBe(stay.code);
  });
  it('saveQuote with websiteBookingRequestId (WR1 by the system) → createHoldFromQuote: hold `website` · sub-source, request converted, C2 gone', async () => {
    await at('2026-10-20T10:30:00+07:00');
    const token = await freshToken();
    const r = await submit(
      form(token, { phone: '0905 888 999', arrival: '2026-11-05', departure: '2026-11-08' }),
    );
    expect(r.statusCode, r.body).toBe(202);
    const [req] = await q<{ id: string }>(
      `SELECT id FROM website_booking_request WHERE phone_e164 = '84905888999'`,
    );
    const guestId = await seedGuestRow(db, t, {
      name: 'Anna Test',
      phone: '84905888999',
      createdBy: t.users.sal!.id,
    });
    const quote = (who: string, extra: Record<string, unknown> = {}) =>
      staff(fa, tok(who), null, 'POST', `${P(t)}/quotes`, {
        json: {
          type: 'short',
          roomId: ids.rooms['202'],
          arrivalDate: '2026-11-05',
          nights: 3,
          adults: 2,
          channelId: ids.channels.direct,
          guestId,
          websiteBookingRequestId: req!.id,
          ...extra,
        },
      });
    const saved = await quote('sal');
    expect(saved.statusCode, saved.body).toBe(201);
    const [w] = await q<Record<string, unknown>>(
      `SELECT status, assigned_user_id, quote_id FROM website_booking_request WHERE id = $1`,
      [req!.id],
    );
    expect(w).toEqual({
      status: 'in_progress',
      assigned_user_id: t.users.sal!.id,
      quote_id: saved.json().id,
    });
    // Another SAL cannot attach a quote to a request held by someone else (out of scope → 404).
    const g2 = await seedGuestRow(db, t, { createdBy: t.users.sal2!.id });
    const other = await quote('sal2', { guestId: g2 });
    expect(other.statusCode).toBe(404);
    const hold = await staff(
      fa,
      tok('sal'),
      null,
      'POST',
      `${P(t)}/quotes/${saved.json().id}/actions/create-hold`,
      { json: { holdHours: 24 } },
    );
    expect(hold.statusCode, hold.body).toBe(201);
    const [res] = await q<Record<string, unknown>>(
      `SELECT direct_source, direct_sub_source FROM reservation WHERE id = $1`,
      [hold.json().id],
    );
    expect(res).toEqual({ direct_source: 'website', direct_sub_source: 'facebook' });
    const [after] = await q<Record<string, unknown>>(
      `SELECT status, reservation_id, guest_name, phone_e164, pii_purged_at IS NOT NULL AS purged
         FROM website_booking_request WHERE id = $1`,
      [req!.id],
    );
    expect(after).toEqual({
      status: 'converted',
      reservation_id: hold.json().id,
      guest_name: null,
      phone_e164: null,
      purged: true,
    });
  });

  it('createReservation with websiteBookingRequestId (B2, FD+): `website` · sub-source, request converted + C2 gone in the same transaction; other source / non-direct → 422; unknown → 404; closed → 409', async () => {
    await at('2026-10-20T11:00:00+07:00');
    const token = await freshToken();
    const r = await submit(
      form(token, { phone: '0905 444 555', arrival: '2026-11-12', departure: '2026-11-14' }),
    );
    expect(r.statusCode, r.body).toBe(202);
    const [req] = await q<{ id: string; sub_source: string | null }>(
      `SELECT id, sub_source FROM website_booking_request WHERE phone_e164 = '84905444555'`,
    );
    expect(req!.sub_source).toBe('facebook');
    const guestId = await seedGuestRow(db, t, {
      name: 'Anna Test',
      phone: '84905444555',
      createdBy: t.users.fd!.id,
    });
    const book = (extra: Record<string, unknown> = {}) =>
      staff(fa, tok('fd'), null, 'POST', `${P(t)}/reservations`, {
        json: {
          roomId: ids.rooms['203'],
          channelId: ids.channels.direct,
          arrivalDate: '2026-11-12',
          departureDate: '2026-11-14',
          adults: 2,
          bookerGuestId: guestId,
          paymentModel: 'direct',
          websiteBookingRequestId: req!.id,
          ...extra,
        },
      });
    const fieldErrors = (res: {
      json: () => { errors?: Array<{ field: string; code: string }> };
    }) => res.json().errors ?? [];
    // directSource other than `website` → 422 NOT_ALLOWED on directSource.
    const other = await book({ directSource: 'zalo_phone' });
    expect(other.statusCode, other.body).toBe(422);
    expect(fieldErrors(other)).toContainEqual({ field: 'directSource', code: 'NOT_ALLOWED' });
    // A channel outside the `direct` group → 422 NOT_ALLOWED on websiteBookingRequestId.
    const agent = await book({ channelId: ids.channels.collaborator });
    expect(agent.statusCode, agent.body).toBe(422);
    expect(fieldErrors(agent)).toContainEqual({
      field: 'websiteBookingRequestId',
      code: 'NOT_ALLOWED',
    });
    expect((await book({ websiteBookingRequestId: randomUUID() })).statusCode).toBe(404);
    // directSource absent → website; the deposit rule of B2 still applies.
    let created = await book();
    if (created.statusCode === 422 && created.json().code === 'DEPOSIT_INSUFFICIENT') {
      const amountVnd = created.json().depositRequiredVnd as number;
      created = await book({ initialPayment: { type: 'deposit', method: 'cash', amountVnd } });
    }
    expect(created.statusCode, created.body).toBe(201);
    const [res] = await q<Record<string, unknown>>(
      `SELECT direct_source, direct_sub_source FROM reservation WHERE id = $1`,
      [created.json().id],
    );
    expect(res).toEqual({ direct_source: 'website', direct_sub_source: 'facebook' });
    expect(created.json().directSubSource).toBe('facebook');
    const [after] = await q<Record<string, unknown>>(
      `SELECT status, reservation_id, converted_by, guest_name, phone_e164, contact_hmac,
              pii_purged_at IS NOT NULL AS purged
         FROM website_booking_request WHERE id = $1`,
      [req!.id],
    );
    expect(after).toEqual({
      status: 'converted',
      reservation_id: created.json().id,
      converted_by: t.users.fd!.id,
      guest_name: null,
      phone_e164: null,
      contact_hmac: null,
      purged: true,
    });
    // The request is closed now: a second booking for it → 409 INVALID_TRANSITION, nothing written.
    const again = await book({ roomId: ids.rooms['202'], directSource: 'website' });
    expect(again.statusCode, again.body).toBe(409);
    expect(again.json().code).toBe('INVALID_TRANSITION');
  });
});
