/**
 * v1.0.4 P4-16 (SEC-BA-104-09 a, ARC "v1.0.4 notice-version allowlist" mục 3, I1–I6) over HTTP on the real
 * PostgreSQL: `PUT …/parameters/privacy_notice_version` only takes a version of NOTICE_TEXT_VERSIONS
 * (exact match); anything else – `privacy-2026-10-v1` included – is 422 PARAM_OUT_OF_RANGE + `allowed`, with no
 * row, no audit and no pg_notify. The same-day rule is unchanged (no override for this key – 09 (b) deferred).
 * SEC P416-02/03 (design review 04/11): I7 (v1 scheduled for tomorrow) and the desk consent with the old v1
 * after the switch (422 NOT_IN_LIST). Fake clock T0 = Thu 15/10/2026 09:00 VN. FAKE data only.
 */
import { Client as PgClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { RegistrationService } from '../../src/modules/registration/internal/registration.service';
import {
  type FeatureApp,
  P,
  cookieValue,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import {
  GUEST_TEST_ORIGIN,
  guest,
  sampleJpeg,
  seedStay,
  staff,
} from '../helpers/registration-fixture';
import { type BookingIds, seedBooking } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const KEY = 'privacy_notice_version';
const V1 = 'privacy-2026-10-v1';
const V2 = 'privacy-2026-10-v2';
const TODAY = '2026-10-15';

describe.skipIf(!HAS_DB)('v1.0.4 P4-16 – privacy_notice_version allowlist (I1–I6)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let device: string;
  let listener: PgClient;
  const notified: string[] = [];
  const tok = (u: string) => t.users[u]!.sessionToken;
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;

  const putNotice = (who: string, value: unknown, effectiveFrom = TODAY) =>
    staff(fa, tok(who), null, 'PUT', `${P(t)}/parameters/${KEY}`, {
      json: { value, effectiveFrom, reason: 'P4-16 test' },
    });
  const rows = () =>
    q<{ value: unknown; effective_from: string }>(
      `SELECT value, effective_from::text FROM config_parameter WHERE key = $1 AND property_id = $2`,
      [KEY, t.propertyIds[0]],
    );
  const audits = () =>
    q<{ category: string; before: { value: unknown }; after: { value: unknown } }>(
      `SELECT category, before, after FROM audit_event
        WHERE action = 'config.changed' AND entity_id = $1 AND property_id = $2 ORDER BY id`,
      [KEY, t.propertyIds[0]],
    );
  /** pg_notify is delivered after commit: give the listener a moment, then read what arrived for this property. */
  const notifiesNow = async () => {
    await new Promise((r) => setTimeout(r, 300));
    return notified.filter((p) => p === t.propertyIds[0]).length;
  };

  /** Registration.consentNotice as the desk reads it (GET registration). */
  const registrationId = async (reservationId: string): Promise<string> => {
    await db.withContext(t.ctx(), (tx) => fa.app.get(RegistrationService).backfill(tx));
    const list = await staff(
      fa,
      tok('fd'),
      device,
      'GET',
      `${P(t)}/registrations?view=all&limit=100`,
    );
    expect(list.statusCode, list.body).toBe(200);
    return list
      .json()
      .data.find((r: { reservationId: string }) => r.reservationId === reservationId).id as string;
  };
  const deskNotice = async (reservationId: string): Promise<string> => {
    const regId = await registrationId(reservationId);
    const full = await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${regId}`);
    expect(full.statusCode, full.body).toBe(200);
    return full.json().consentNotice.currentNoticeVersion as string;
  };
  /** OnlineCheckin.currentNoticeVersion as guest-web reads it. */
  let guestSid: string;
  const guestNotice = async (): Promise<string> => {
    const r = await guest(fa, guestSid, 'GET', '/v1/guest/online-checkin');
    expect(r.statusCode, r.body).toBe(200);
    return r.json().currentNoticeVersion as string;
  };

  let reservationId: string;

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, {
      users: { own: ['owner'], mgr: ['manager'], fd: ['front_desk'] },
    });
    ids = await seedBooking(db, t);
    for (const u of ['own', 'mgr', 'fd']) await setPassword(db, t, u);
    device = await t.deviceToken(0);
    fa = await startFeatureApp(db, { guestOrigins: [GUEST_TEST_ORIGIN] });
    ({ reservationId } = await seedStay(db, t, ids));
    const link = await staff(
      fa,
      tok('fd'),
      null,
      'POST',
      `${P(t)}/reservations/${reservationId}/guest-link`,
    );
    expect(link.statusCode, link.body).toBe(201);
    const opened = await guest(fa, null, 'POST', '/v1/guest/sessions', {
      json: { token: new URL(link.json().url).pathname.slice(3) },
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    expect(opened.statusCode, opened.body).toBe(200);
    guestSid = cookieValue(opened, 'ottimo_gsid') as string;
    listener = new PgClient({ connectionString: process.env.DATABASE_URL });
    await listener.connect();
    listener.on('notification', (n) => {
      if (n.channel === 'config_changed' && n.payload) notified.push(n.payload);
    });
    await listener.query('LISTEN config_changed');
  });
  afterAll(async () => {
    await listener?.end();
    await fa?.close();
    await db?.close();
  });

  it('baseline: the value in force is the catalogue default v1 (desk + guest), no row yet', async () => {
    expect(await rows()).toEqual([]);
    expect(await deskNotice(reservationId)).toBe(V1);
    expect(await guestNotice()).toBe(V1);
  });

  it('I1 + I6: OWN sets an unknown version today → 422 PARAM_OUT_OF_RANGE + allowed; nothing written, audited or notified; body does not echo the value', async () => {
    const before = await notifiesNow();
    const r = await putNotice('own', 'privacy-2026-10-v3');
    expect(r.statusCode, r.body).toBe(422);
    const body = r.json();
    expect(body).toMatchObject({
      code: 'PARAM_OUT_OF_RANGE',
      allowed: [V2],
      errors: [{ field: 'value', code: 'PARAM_OUT_OF_RANGE' }],
    });
    // I6: only allowed + errors carry data – the submitted string is never reflected.
    expect(r.body).not.toContain('privacy-2026-10-v3');
    expect(
      Object.keys(body).filter(
        (k) => !['type', 'title', 'status', 'code', 'requestId', 'allowed', 'errors'].includes(k),
      ),
    ).toEqual([]);
    expect(await rows()).toEqual([]);
    expect(await audits()).toEqual([]);
    expect(await notifiesNow()).toBe(before);
    expect(await deskNotice(reservationId)).toBe(V1);
    expect(await guestNotice()).toBe(V1);
  });

  it('I1 (variants): trailing space / other case / tomorrow → same 422, still no row', async () => {
    for (const [value, day] of [
      [`${V2} `, TODAY],
      ['Privacy-2026-10-V2', TODAY],
      ['privacy-2026-10-v3', '2026-10-16'],
    ] as const) {
      const r = await putNotice('own', value, day);
      expect(r.statusCode, `${value} ${day}: ${r.body}`).toBe(422);
      expect(r.json()).toMatchObject({ code: 'PARAM_OUT_OF_RANGE', allowed: [V2] });
    }
    expect(await rows()).toEqual([]);
  });

  it('type check first: a non-string over HTTP is 422 VALIDATION_FAILED (ParameterService.validate)', async () => {
    const r = await putNotice('own', 2);
    expect(r.statusCode, r.body).toBe(422);
    expect(r.json().code).toBe('VALIDATION_FAILED');
    expect(await rows()).toEqual([]);
  });

  it('I2: OWN sets privacy-2026-10-v1 → 422 as I1 (no way back to v1)', async () => {
    const r = await putNotice('own', V1);
    expect(r.statusCode, r.body).toBe(422);
    expect(r.json()).toMatchObject({ code: 'PARAM_OUT_OF_RANGE', allowed: [V2] });
    expect(await rows()).toEqual([]);
    expect(await audits()).toEqual([]);
  });

  it('I7 (SEC P416-02): OWN schedules privacy-2026-10-v1 for tomorrow → same 422 + allowed, no row, no audit', async () => {
    const r = await putNotice('own', V1, '2026-10-16');
    expect(r.statusCode, r.body).toBe(422);
    expect(r.json()).toMatchObject({
      code: 'PARAM_OUT_OF_RANGE',
      allowed: [V2],
      errors: [{ field: 'value', code: 'PARAM_OUT_OF_RANGE' }],
    });
    expect(await rows()).toEqual([]);
    expect(await audits()).toEqual([]);
  });

  it('I5: MGR sends an unknown version → 403 before 422 (order kept)', async () => {
    const r = await putNotice('mgr', 'privacy-2026-10-v3');
    expect(r.statusCode, r.body).toBe(403);
    expect(await rows()).toEqual([]);
  });

  it('I3: OWN sets privacy-2026-10-v2 today → 200; audit config v1 → v2; desk and guest read v2; one notify', async () => {
    const before = notified.filter((p) => p === t.propertyIds[0]).length;
    const r = await putNotice('own', V2);
    expect(r.statusCode, r.body).toBe(200);
    expect(await rows()).toEqual([{ value: V2, effective_from: TODAY }]);
    const a = await audits();
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({
      category: 'config',
      before: { value: V1 },
      after: { value: V2, effectiveFrom: TODAY },
    });
    expect(a[0]!.after).not.toHaveProperty('sameDayOverride');
    expect(await notifiesNow()).toBe(before + 1);
    expect(await deskNotice(reservationId)).toBe(V2);
    expect(await guestNotice()).toBe(V2);
  });

  it('I3 (SEC P416-03): after the switch, a desk consent sent with the old v1 → 422 NOT_IN_LIST; v2 → 201', async () => {
    const regId = await registrationId(reservationId);
    const add = await staff(
      fa,
      tok('fd'),
      device,
      'POST',
      `${P(t)}/registrations/${regId}/documents`,
      {
        multipart: [
          {
            name: 'data',
            value: JSON.stringify({
              docType: 'passport',
              fullNameOnDoc: 'SCHMIDT EMMA',
              docNumber: 'C01X00T47',
              gender: 'female',
              dateOfBirth: '1990-04-12',
              nationalityCode: 'DEU',
              passportExpiryDate: '2031-01-01',
              visaKind: 'visa_exempt',
              visaValidUntil: '2026-12-01',
              entryDate: '2026-10-10',
            }),
            contentType: 'application/json',
          },
          {
            name: 'image',
            value: (await sampleJpeg('#10a0b0')) as never,
            filename: 'scan.jpg',
            contentType: 'image/jpeg',
          } as never,
        ],
      },
    );
    expect(add.statusCode, add.body).toBeLessThan(300);
    const docId = add.json().documents[0].id as string;
    const full = await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${regId}`);
    const days = full.json().consentNotice.imageRetentionDays as number;
    const consent = (noticeVersion: string) =>
      staff(fa, tok('fd'), device, 'POST', `${P(t)}/registrations/${regId}/consents`, {
        json: {
          partyMemberId: docId,
          purpose: 'P02B_ID_IMAGE_RETENTION',
          decision: 'granted',
          channel: 'desk',
          noticeVersion,
          retentionDays: days,
          locale: 'en',
        },
      });
    const stale = await consent(V1);
    expect(stale.statusCode, stale.body).toBe(422);
    expect(stale.json().errors).toEqual([{ field: 'noticeVersion', code: 'NOT_IN_LIST' }]);
    const ok = await consent(V2);
    expect(ok.statusCode, ok.body).toBe(201);
  });

  it('I4: after I3, OWN sets v2 again today → 422 VALIDATION_FAILED on effectiveFrom (no same-day override for this key)', async () => {
    const r = await putNotice('own', V2);
    expect(r.statusCode, r.body).toBe(422);
    expect(r.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'effectiveFrom' }],
    });
    expect(await rows()).toEqual([{ value: V2, effective_from: TODAY }]);
    expect(await audits()).toHaveLength(1);
  });
});
