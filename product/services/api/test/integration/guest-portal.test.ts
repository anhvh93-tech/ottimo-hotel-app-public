/**
 * Guest link + online check-in level 1 over HTTP (US-106/107/112; SEC s3-checklist G1–G9, ĐK-1…6, C1, C3):
 * token hashed + shown once, cookie session level 1, no OTP/folio routes, JSON allow-lists, notice gate,
 * write-only uploads with replacement (DEK destroyed), consent of guest 1 only, completion conditions,
 * rate limits, revoke / re-issue / expiry / after checkout, staff cookie never authenticates a guest call.
 */
import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { OPENAPI_META } from '../../src/generated/openapi-meta';
import { GuestAccessPort } from '../../src/modules/guest-portal/public/guest-access.port';
import { RATE_LIMITER, type RateLimiter } from '../../src/modules/identity/public/rate-limiter';
import { type FeatureApp, P, cookieValue, startFeatureApp } from '../helpers/feature-app';
import {
  GUEST_TEST_ORIGIN,
  guest,
  sampleJpeg,
  seedStay,
  setStayStatus,
  staff,
} from '../helpers/registration-fixture';
import { type BookingIds, seedBooking } from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const NOTICE = 'privacy-2026-10-v1';
const ALLOWED_OCI_KEYS = [
  'currentStep',
  'requiredPeople',
  'uploadedPeople',
  'etaTime',
  'consentRecorded',
  'completedAt',
  'noticeAccepted',
  'lateArrival',
  'deferredPeople',
  // 0.3.6 (SEC ĐK-2 17/10): property parameters the consent sentence shows.
  'currentNoticeVersion',
  'imageRetentionDays',
];
/** id_image_retention_days_after_checkout of DS-E (BR-610). */
const RETENTION_DAYS = 30;

/** ĐK-2: EVERY OnlineCheckin response has only the 11 allowed keys and carries the two parameters. */
function oci(r: { statusCode: number; json(): Record<string, unknown> }): Record<string, unknown> {
  const body = r.json();
  expect(r.statusCode, JSON.stringify(body)).toBeLessThan(300);
  expect(Object.keys(body).filter((k) => !ALLOWED_OCI_KEYS.includes(k))).toEqual([]);
  expect(body).toMatchObject({ currentNoticeVersion: NOTICE, imageRetentionDays: RETENTION_DAYS });
  return body;
}

describe.skipIf(!HAS_DB)('guest-portal – link, session level 1, online check-in (SEC G)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let device: string;
  const tok = (u: string) => t.users[u]!.sessionToken;

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, {
      users: { fd: ['front_desk'], sal: ['sales_staff'], hk: ['housekeeping'] },
    });
    ids = await seedBooking(db, t);
    device = await t.deviceToken(0);
    fa = await startFeatureApp(db, { guestOrigins: [GUEST_TEST_ORIGIN] });
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });
  // RAM counters (SR-RL-03, guest uploads) are per test: every test starts with fresh windows.
  beforeEach(() => fa.app.get<RateLimiter>(RATE_LIMITER).resetAll());

  async function link(reservationId: string): Promise<string> {
    const r = await staff(
      fa,
      tok('fd'),
      null,
      'POST',
      `${P(t)}/reservations/${reservationId}/guest-link`,
    );
    expect(r.statusCode).toBe(201);
    const url = new URL(r.json().url);
    expect(url.pathname.startsWith('/g/')).toBe(true);
    return url.pathname.slice(3);
  }

  async function open(token: string) {
    return guest(fa, null, 'POST', '/v1/guest/sessions', {
      json: { token },
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
  }

  async function session(reservationId: string): Promise<string> {
    const r = await open(await link(reservationId));
    expect(r.statusCode).toBe(200);
    return cookieValue(r, 'ottimo_gsid') as string;
  }

  it('G4: 256-bit token stored as SHA-256 only, shown once (no idempotent copy), FD+ only', async () => {
    const { reservationId } = await seedStay(db, t, ids);
    const idem = randomUUID();
    const r = await staff(
      fa,
      tok('fd'),
      null,
      'POST',
      `${P(t)}/reservations/${reservationId}/guest-link`,
      { idem },
    );
    expect(r.statusCode).toBe(201);
    expect(r.headers['cache-control']).toBe('no-store');
    const token = new URL(r.json().url).pathname.slice(3);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    const stored = await db.withContext(t.ctx(), async (tx) => {
      const tk = await tx.query(
        'SELECT token_hash FROM guest_access_token WHERE reservation_id = $1',
        [reservationId],
      );
      const k = await tx.query(`SELECT response_body FROM idempotency_key WHERE key = $1`, [idem]);
      return { hash: tk.rows[0]!.token_hash, body: JSON.stringify(k.rows[0]!.response_body) };
    });
    expect(stored.hash).toBe(createHash('sha256').update(token).digest('hex'));
    expect(stored.body).not.toContain(token);
    for (const u of ['sal', 'hk']) {
      expect(
        (await staff(fa, tok(u), null, 'POST', `${P(t)}/reservations/${reservationId}/guest-link`))
          .statusCode,
      ).toBe(403);
    }
    // hold / cancelled → no link
    const hold = await seedStay(db, t, ids, { status: 'hold' });
    expect(
      (
        await staff(
          fa,
          tok('fd'),
          null,
          'POST',
          `${P(t)}/reservations/${hold.reservationId}/guest-link`,
        )
      ).json().code,
    ).toBe('INVALID_TRANSITION');
  });

  it('ĐK-1: session level 1, no OTP; the five level-2 routes are not registered (404)', async () => {
    const { reservationId, code } = await seedStay(db, t, ids, { bookerName: 'Daniel Weber' });
    const r = await open(await link(reservationId));
    expect(r.statusCode).toBe(200);
    expect(r.headers['referrer-policy']).toBe('no-referrer');
    expect(String(r.headers['set-cookie'])).toMatch(
      /^ottimo_gsid=[^;]+; HttpOnly; SameSite=Strict; Path=\//,
    );
    const body = r.json();
    expect(body).toMatchObject({
      level: 1,
      reservationCode: code,
      verification: { emailOtpAvailable: false },
      level2ExpiresAt: null,
    });
    expect(body.guestFirstName).toBe('Daniel');
    expect(JSON.stringify(body)).not.toContain('Weber');
    const sid = cookieValue(r, 'ottimo_gsid') as string;
    for (const op of [
      'sendGuestOtp',
      'verifyGuestSession',
      'getGuestFolio',
      'withdrawGuestConsent',
      'issueGuestVerificationCode',
    ]) {
      const m = OPENAPI_META.operations[op];
      expect(m).toBeDefined();
      const res = await fa.app.inject({
        method: m!.method as 'GET',
        url: m!.path.replace(/\{[^}]+\}/g, randomUUID()),
        headers: {
          cookie: `ottimo_gsid=${sid}`,
          'idempotency-key': randomUUID(),
          'content-type': 'application/json',
        },
        payload: '{}',
      });
      expect({ op, status: res.statusCode }).toEqual({ op, status: 404 });
    }
  });

  it('ĐK-2: getGuestStay has no guestFullName/doorCode, no-store; staff cookie on a guest route → 401', async () => {
    const { reservationId } = await seedStay(db, t, ids);
    const sid = await session(reservationId);
    const r = await guest(fa, sid, 'GET', '/v1/guest/stay');
    expect(r.statusCode).toBe(200);
    expect(r.headers['cache-control']).toBe('no-store');
    const body = r.json();
    expect(body).not.toHaveProperty('guestFullName');
    expect(body).not.toHaveProperty('doorCode');
    expect(body).toMatchObject({
      checkinTime: '14:00',
      checkoutTime: '12:00',
      onlineCheckinAvailable: true,
    });
    const asStaff = await fa.app.inject({
      method: 'GET',
      url: '/v1/guest/stay',
      headers: { cookie: `ottimo_sid=${tok('fd')}` },
    });
    expect(asStaff.statusCode).toBe(401);
    expect((await guest(fa, null, 'GET', '/v1/guest/stay')).statusCode).toBe(401);
  });

  it('online check-in: notice gate, uploads (HEIC refused, replace = DEK destroyed), consent of guest 1, completion', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 2 });
    const sid = await session(reservationId);
    const first = await guest(fa, sid, 'GET', '/v1/guest/online-checkin');
    expect(oci(first)).toMatchObject({
      currentStep: 'notice',
      requiredPeople: 2,
      uploadedPeople: [],
      noticeAccepted: false,
    });
    // Before the notice: any other step → 409 INVALID_TRANSITION (currentState notice); wrong version → 422.
    const early = await guest(fa, sid, 'PUT', '/v1/guest/online-checkin', {
      json: { etaTime: '21:30' },
    });
    expect(early.statusCode).toBe(409);
    expect(early.json().currentState).toBe('notice');
    expect(
      (
        await guest(fa, sid, 'PUT', '/v1/guest/online-checkin', {
          json: { noticeVersion: 'old-v0' },
        })
      ).statusCode,
    ).toBe(422);
    const read = await guest(fa, sid, 'PUT', '/v1/guest/online-checkin', {
      json: { noticeVersion: NOTICE },
    });
    expect(oci(read)).toMatchObject({ noticeAccepted: true, currentStep: 'documents' });

    const upload = (personIndex: number, file: Buffer, filename = 'p.jpg') =>
      guest(fa, sid, 'POST', '/v1/guest/online-checkin/documents', {
        multipart: [
          { name: 'personIndex', value: String(personIndex) },
          { name: 'docType', value: 'passport' },
          { name: 'image', value: file, filename, contentType: 'image/jpeg' },
        ],
      });
    const heic = Buffer.concat([
      Buffer.from([0, 0, 0, 0x18]),
      Buffer.from('ftypheic'),
      Buffer.alloc(64),
    ]);
    const bad = await upload(1, heic, 'IMG_0001.HEIC');
    expect(bad.statusCode).toBe(422);
    expect(bad.json()).toMatchObject({
      code: 'FILE_REJECTED',
      errors: [{ field: 'image', code: 'FILE_TYPE' }],
    });
    expect((await upload(3, await sampleJpeg())).json().errors).toEqual([
      { field: 'personIndex', code: 'NOT_IN_LIST' },
    ]);
    const up = await upload(1, await sampleJpeg('#123456'));
    expect(up.statusCode).toBe(201);
    expect(oci(up).uploadedPeople).toEqual([1]);
    expect(JSON.stringify(up.json())).not.toMatch(/imageIds|"image"|docType|passport/i);
    const before = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query(
            `SELECT i.data_key_id FROM document_image i JOIN guest_document d ON d.id = i.guest_document_id
        WHERE d.reservation_id = $1`,
            [reservationId],
          )
        ).rows,
    );
    // K2: none → pre; the desk sees "from app".
    const reg = await staff(
      fa,
      tok('fd'),
      device,
      'GET',
      `${P(t)}/registrations?view=all&limit=100`,
    );
    const mine = reg
      .json()
      .data.find((x: { reservationId: string }) => x.reservationId === reservationId);
    expect(mine.status).toBe('pre');
    // Re-upload for the same person replaces: the old DEK is destroyed in the same transaction.
    expect((await upload(1, await sampleJpeg('#654321'))).statusCode).toBe(201);
    const keys = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query(`SELECT k.id, k.destroyed_at FROM data_key k WHERE k.id = $1`, [
            before[0]!.data_key_id,
          ])
        ).rows,
    );
    expect(keys[0]!.destroyed_at).not.toBeNull();

    // ĐK-5: consent only for guest 1, channel guest_app, current notice version.
    const consent = (body: Record<string, unknown>) =>
      guest(fa, sid, 'POST', '/v1/guest/consents', { json: body });
    const base = {
      purpose: 'P02B_ID_IMAGE_RETENTION',
      decision: 'refused',
      noticeVersion: NOTICE,
      retentionDays: RETENTION_DAYS,
      locale: 'en',
      channel: 'guest_app',
    };
    expect((await consent({ ...base, personIndex: 2 })).json().errors).toEqual([
      { field: 'personIndex', code: 'NOT_IN_LIST' },
    ]);
    expect((await consent({ ...base, personIndex: 1, channel: 'desk' })).statusCode).toBe(422);
    // SEC ĐK-2 17/10: the days the guest read must be the parameter in force.
    expect((await consent({ ...base, personIndex: 1, retentionDays: 90 })).json().errors).toEqual([
      { field: 'retentionDays', code: 'NOT_IN_LIST' },
    ]);
    const noDays: Record<string, unknown> = { ...base };
    delete noDays.retentionDays;
    expect((await consent({ ...noDays, personIndex: 1 })).json().errors).toEqual([
      { field: 'retentionDays', code: 'REQUIRED' },
    ]);
    const c = await consent({ ...base, personIndex: 1 });
    expect(c.statusCode).toBe(201);
    expect(oci(c).consentRecorded).toBe(true);
    // SEC BE-49: the same answer again is not a new record (no version bump for the desk).
    expect((await consent({ ...base, personIndex: 1 })).statusCode).toBe(201);
    const records = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ decision: string; retention_days: number }>(
            `SELECT c.decision, c.retention_days FROM consent_record c
               JOIN registration x ON x.id = c.registration_id WHERE x.reservation_id = $1`,
            [reservationId],
          )
        ).rows,
    );
    expect(records).toEqual([{ decision: 'refused', retention_days: RETENTION_DAYS }]);

    // Completion: missing ETA → 409 currentState eta; person 2 missing → documents unless deferred.
    const complete = (deferredPeople?: number[]) =>
      guest(fa, sid, 'POST', '/v1/guest/online-checkin/complete', {
        json: deferredPeople ? { deferredPeople } : {},
      });
    expect((await complete()).json().currentState).toBe('documents');
    expect((await complete([2])).json().currentState).toBe('eta');
    const card = await guest(fa, sid, 'PUT', '/v1/guest/online-checkin', {
      json: { lateArrival: true, arrivalNote: 'Thẻ 4111 1111 1111 1111' },
    });
    expect(card.json().code).toBe('CARD_NUMBER_DETECTED');
    const eta = await guest(fa, sid, 'PUT', '/v1/guest/online-checkin', {
      json: {
        lateArrival: true,
        arrivalNote: 'Arriving by night bus\u0007',
        currentStep: 'consent',
      },
    });
    expect(oci(eta)).toMatchObject({ etaTime: '22:00', lateArrival: true });
    expect(JSON.stringify(eta.json())).not.toContain('night bus');
    expect((await complete([2, 2])).statusCode).toBe(422);
    const done = await complete([2]);
    expect(done.statusCode).toBe(200);
    expect(oci(done)).toMatchObject({ currentStep: 'done', deferredPeople: [2] });
    // Desk sees the note (D23, FD+) – the guest never does.
    const desk = await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${mine.id}`);
    expect(desk.json().onlineCheckin).toMatchObject({
      etaTime: '22:00',
      lateArrival: true,
      arrivalNote: 'Arriving by night bus',
      deferredPeople: [2],
    });
    const audit = await db.withContext(
      t.ctx(),
      async (tx) =>
        (await tx.query(`SELECT after FROM audit_event WHERE action = 'online_checkin.updated'`))
          .rows,
    );
    expect(JSON.stringify(audit)).not.toContain('night bus');
  });

  it('H18 two guests (TC-L7-010, CI 39028814256): CCCD then passport, one after another and overlapping – each slot answers on its own', async () => {
    // What guest-web needs after guest 1's upload: requiredPeople still 2, uploadedPeople [1] (slot 1 → "Đã
    // gửi", slot 2 still open). Guest 2 then uploads while guest 1 may still be in flight: both are serialised
    // by the registration lock and both succeed (no 409/500), on a schema with 0055's guest CHECKs.
    const { reservationId } = await seedStay(db, t, ids, { adults: 2 });
    const sid = await session(reservationId);
    expect(
      oci(
        await guest(fa, sid, 'PUT', '/v1/guest/online-checkin', {
          json: { noticeVersion: NOTICE },
        }),
      ),
    ).toMatchObject({ currentStep: 'documents', requiredPeople: 2, uploadedPeople: [] });
    const upload = async (personIndex: number, docType: 'cccd' | 'passport', color: string) =>
      guest(fa, sid, 'POST', '/v1/guest/online-checkin/documents', {
        multipart: [
          { name: 'personIndex', value: String(personIndex) },
          { name: 'docType', value: docType },
          {
            name: 'image',
            value: await sampleJpeg(color),
            filename: `p${personIndex}.jpg`,
            contentType: 'image/jpeg',
          },
        ],
      });
    const one = await upload(1, 'cccd', '#102030');
    expect(one.statusCode, one.body).toBe(201);
    expect(oci(one)).toMatchObject({ requiredPeople: 2, uploadedPeople: [1] });
    expect(oci(await guest(fa, sid, 'GET', '/v1/guest/online-checkin'))).toMatchObject({
      currentStep: 'documents',
      requiredPeople: 2,
      uploadedPeople: [1],
    });
    const two = await upload(2, 'passport', '#203040');
    expect(two.statusCode, two.body).toBe(201);
    expect(oci(two)).toMatchObject({ requiredPeople: 2, uploadedPeople: [1, 2] });

    // Overlapping sends (guest-web keeps guest n uploading while guest n+1 picks a photo): both 201.
    const other = await seedStay(db, t, ids, { adults: 2 });
    const sid2 = await session(other.reservationId);
    await guest(fa, sid2, 'PUT', '/v1/guest/online-checkin', { json: { noticeVersion: NOTICE } });
    const send = async (personIndex: number, docType: 'cccd' | 'passport') =>
      guest(fa, sid2, 'POST', '/v1/guest/online-checkin/documents', {
        multipart: [
          { name: 'personIndex', value: String(personIndex) },
          { name: 'docType', value: docType },
          {
            name: 'image',
            value: await sampleJpeg(`#3${personIndex}5060`),
            filename: `q${personIndex}.jpg`,
            contentType: 'image/jpeg',
          },
        ],
      });
    const both = await Promise.all([send(1, 'cccd'), send(2, 'passport')]);
    expect(both.map((r) => r.statusCode)).toEqual([201, 201]);
    expect(oci(await guest(fa, sid2, 'GET', '/v1/guest/online-checkin'))).toMatchObject({
      requiredPeople: 2,
      uploadedPeople: [1, 2],
    });
    // One live document per slot, person_index 1 and 2, nothing unclaimed.
    const docs = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ person_index: number; doc_type: string }>(
            `SELECT person_index, doc_type FROM guest_document
              WHERE reservation_id = $1 AND removed_at IS NULL ORDER BY person_index`,
            [other.reservationId],
          )
        ).rows,
    );
    expect(docs).toEqual([
      { person_index: 1, doc_type: 'cccd' },
      { person_index: 2, doc_type: 'passport' },
    ]);
  });

  it('SR-RL-05: more than 20 writes a day → 429; the desk closes the flow → 409 ONLINE_CHECKIN_CLOSED', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 1 });
    const sid = await session(reservationId);
    for (let i = 0; i < 20; i++) {
      const r = await guest(fa, sid, 'PUT', '/v1/guest/online-checkin', {
        json: { noticeVersion: NOTICE },
      });
      expect(r.statusCode).toBe(200);
    }
    const over = await guest(fa, sid, 'PUT', '/v1/guest/online-checkin', {
      json: { noticeVersion: NOTICE },
    });
    expect(over.statusCode).toBe(429);
    await setStayStatus(db, t, reservationId, 'in_house');
    expect(
      (await guest(fa, sid, 'POST', '/v1/guest/online-checkin/complete', { json: {} })).json().code,
    ).toBe('ONLINE_CHECKIN_CLOSED');
  });

  it('revoke / re-issue / cancel invalidate old tokens and sessions; expiry; after checkout → GUEST_STAY_ENDED', async () => {
    const { reservationId } = await seedStay(db, t, ids);
    const token1 = await link(reservationId);
    const sid1 = cookieValue(await open(token1), 'ottimo_gsid') as string;
    const token2 = await link(reservationId); // re-issue (SR-GST-04)
    expect((await open(token1)).json().code).toBe('GUEST_LINK_INVALID');
    expect((await guest(fa, sid1, 'GET', '/v1/guest/stay')).json().code).toBe('GUEST_LINK_INVALID');
    const sid2 = cookieValue(await open(token2), 'ottimo_gsid') as string;
    expect(
      (
        await staff(
          fa,
          tok('fd'),
          null,
          'DELETE',
          `${P(t)}/reservations/${reservationId}/guest-link`,
        )
      ).statusCode,
    ).toBe(204);
    expect((await guest(fa, sid2, 'GET', '/v1/guest/stay')).statusCode).toBe(401);

    // B-13: cancellation through BE-A's port revokes everything in the same transaction.
    const other = await seedStay(db, t, ids);
    const sid3 = await session(other.reservationId);
    await db.withContext(t.ctx(), (tx) =>
      fa.app.get(GuestAccessPort).revokeAllForReservation(tx, other.reservationId, 'cancelled'),
    );
    expect((await guest(fa, sid3, 'GET', '/v1/guest/stay')).json().code).toBe('GUEST_LINK_INVALID');

    // After checkout: session can open (stayEnded), every blocked operation → 403 GUEST_STAY_ENDED.
    const out = await seedStay(db, t, ids);
    const token4 = await link(out.reservationId);
    await setStayStatus(db, t, out.reservationId, 'checked_out');
    const opened = await open(token4);
    expect(opened.json().stayEnded).toBe(true);
    // SEC BE-51 (6): after checkout the page only says thank you – no name, no room number.
    expect(opened.json()).not.toHaveProperty('guestFirstName');
    expect(opened.json()).not.toHaveProperty('roomNo');
    const sid4 = cookieValue(opened, 'ottimo_gsid') as string;
    expect((await guest(fa, sid4, 'GET', '/v1/guest/stay')).json().code).toBe('GUEST_STAY_ENDED');
    expect(
      (await guest(fa, sid4, 'PUT', '/v1/guest/locale', { json: { locale: 'en' } })).statusCode,
    ).toBe(204);
    // Link expiry: departure 20/10 12:00 + 24 h grace.
    fa.clock.set(new Date('2026-10-21T05:01:00.000Z'));
    expect((await open(token4)).json().code).toBe('GUEST_LINK_INVALID');
    fa.clock.set(T0);
  });

  it('SEC BE-47: upload checks run BEFORE decoding; uploads count per session (429)', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 1 });
    const sid = await session(reservationId);
    const heic = Buffer.concat([
      Buffer.from([0, 0, 0, 0x18]),
      Buffer.from('ftypheic'),
      Buffer.alloc(64),
    ]);
    const upload = () =>
      guest(fa, sid, 'POST', '/v1/guest/online-checkin/documents', {
        multipart: [
          { name: 'personIndex', value: '1' },
          { name: 'docType', value: 'passport' },
          { name: 'image', value: heic, filename: 'x.heic', contentType: 'image/heic' },
        ],
      });
    // Notice not read: 409 – the HEIC never reached the image pipeline (it would be 422 FILE_REJECTED).
    const early = await upload();
    expect(early.statusCode).toBe(409);
    expect(early.json().currentState).toBe('notice');
    expect(
      (await guest(fa, sid, 'PUT', '/v1/guest/online-checkin', { json: { noticeVersion: NOTICE } }))
        .statusCode,
    ).toBe(200);
    for (let i = 1; i < 20; i++) expect((await upload()).json().code).toBe('FILE_REJECTED');
    const over = await upload();
    expect(over.statusCode).toBe(429);
    expect(over.headers['retry-after']).toBeDefined();
  });

  it('SEC decision (a): the notice evidence names the language really shown (ru → en)', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 1 });
    const sid = await session(reservationId);
    expect(
      (await guest(fa, sid, 'PUT', '/v1/guest/locale', { json: { locale: 'ru' } })).statusCode,
    ).toBe(204);
    expect(
      (await guest(fa, sid, 'PUT', '/v1/guest/online-checkin', { json: { noticeVersion: NOTICE } }))
        .statusCode,
    ).toBe(200);
    const locale = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ notice_locale: string }>(
            'SELECT notice_locale FROM online_checkin WHERE reservation_id = $1',
            [reservationId],
          )
        ).rows[0]!.notice_locale,
    );
    expect(locale).toBe('en');
  });

  it('SEC BE-50 (a): guest writes need the guest-web Origin; a GET never writes (K1, online_checkin)', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 1 });
    const sid = await session(reservationId);
    const put = (origin: string | null) =>
      guest(fa, sid, 'PUT', '/v1/guest/online-checkin', {
        json: { noticeVersion: NOTICE },
        headers: origin ? { origin } : { origin: '' },
      });
    expect((await put(null)).statusCode).toBe(403);
    expect((await put('https://evil.test')).statusCode).toBe(403);
    expect((await put('https://g.test')).statusCode).toBe(200);
    // Open a session without the guest-web Origin → 403 (public guest operation).
    const token = await link(reservationId);
    const foreign = await guest(fa, null, 'POST', '/v1/guest/sessions', {
      json: { token },
      headers: { origin: 'https://desk.test', 'x-forwarded-for': '1.2.3.9' },
    });
    expect(foreign.statusCode).toBe(403);
    // GET of a fresh booking writes nothing (ARC S3-27 (6)): no online_checkin row, no K1 change. (The K1
    // record itself comes from the link issue – a write.)
    const fresh = await seedStay(db, t, ids, { adults: 1 });
    const sid2 = await session(fresh.reservationId);
    const counts = () =>
      db.withContext(
        t.ctx(),
        async (tx) =>
          (
            await tx.query<{ r: number; v: number; o: number }>(
              `SELECT (SELECT count(*)::int FROM registration WHERE reservation_id = $1) AS r,
                      (SELECT COALESCE(max(version), 0)::int FROM registration WHERE reservation_id = $1) AS v,
                      (SELECT count(*)::int FROM online_checkin WHERE reservation_id = $1) AS o`,
              [fresh.reservationId],
            )
          ).rows[0],
      );
    const before = await counts();
    expect(oci(await guest(fa, sid2, 'GET', '/v1/guest/online-checkin'))).toMatchObject({
      currentStep: 'notice',
      requiredPeople: 1,
    });
    expect(await counts()).toEqual(before);
    expect(before?.o).toBe(0);
  });

  it('SR-RL-03: openGuestSession is limited per IP (10/min)', async () => {
    let last = 0;
    for (let i = 0; i < 11; i++) {
      last = (
        await guest(fa, null, 'POST', '/v1/guest/sessions', { json: { token: 'x'.repeat(43) } })
      ).statusCode;
    }
    expect(last).toBe(429);
  });
});
