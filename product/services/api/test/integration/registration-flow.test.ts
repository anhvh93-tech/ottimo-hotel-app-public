/**
 * Registration end to end over HTTP on PostgreSQL (EP06 v0.2; SEC s3-checklist B1–B4, C1–C5, E1):
 * documents encrypted (no clear value in the DB), masked JSON, trusted device, step-up window, C3 log
 * before data (503 when it cannot be written), checks/K5, consent, portal data (1 log row per call),
 * K6/K7 with immediate purge of non-consenting people, early purge (A74), J16 with the Clock, C3 log list.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Database } from '../../src/db/database';
import { AuditService } from '../../src/modules/audit/public/audit.service';
import { BLOB_STORE, type BlobStore } from '../../src/modules/files/internal/blob-store';
import { RegistrationPortService } from '../../src/modules/registration/public/registration.port';
import { RetentionService } from '../../src/modules/registration/internal/retention.service';
import { serializeResponse } from '../../src/shared/serialization/serializer';
import {
  type FeatureApp,
  P,
  TEST_PASSWORD,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import { sampleJpeg, seedStay, setStayStatus, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking } from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const MIN = 60_000;

describe.skipIf(!HAS_DB)('registration – documents, checks, declaration, purge (EP06)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let device: string;
  const tok = (u: string) => t.users[u]!.sessionToken;

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, {
      users: {
        own: ['owner'],
        mgr: ['manager'],
        fdl: ['front_desk_lead'],
        fd: ['front_desk'],
        hk: ['housekeeping'],
        sal: ['sales_staff'],
      },
    });
    ids = await seedBooking(db, t);
    for (const u of ['own', 'mgr', 'fd', 'fdl']) await setPassword(db, t, u);
    device = await t.deviceToken(0);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  async function stepUp(user: string): Promise<void> {
    const r = await staff(fa, tok(user), device, 'POST', '/v1/me/step-up', {
      json: { password: TEST_PASSWORD },
    });
    expect(r.statusCode).toBe(200);
  }

  async function registrationOf(reservationId: string): Promise<{ id: string; version: number }> {
    const list = await staff(
      fa,
      tok('fd'),
      device,
      'GET',
      `${P(t)}/registrations?view=all&limit=100`,
    );
    expect(list.statusCode).toBe(200);
    const reg = list
      .json()
      .data.find((r: { reservationId: string }) => r.reservationId === reservationId);
    const full = await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${reg.id}`);
    return { id: reg.id, version: full.json().version };
  }

  async function addDoc(regId: string, data: Record<string, unknown>, images = 1, user = 'fd') {
    const parts = [{ name: 'data', value: JSON.stringify(data), contentType: 'application/json' }];
    for (let i = 0; i < images; i++) {
      parts.push({
        name: 'image',
        value: (await sampleJpeg(`#${i}0a0b0`)) as never,
        filename: 'scan.jpg',
        contentType: 'image/jpeg',
      } as never);
    }
    return staff(fa, tok(user), device, 'POST', `${P(t)}/registrations/${regId}/documents`, {
      multipart: parts,
    });
  }

  const emma = {
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
  };
  const an = {
    docType: 'cccd',
    fullNameOnDoc: 'Nguyễn Văn An',
    docNumber: '079123456789',
    dateOfBirth: '1988-02-03',
  };

  it('K1 record, trusted device, encryption at rest, masked JSON, c3 log `create`', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 2 });
    const reg = await registrationOf(reservationId);
    // PWA / no device → 403 DEVICE_NOT_TRUSTED (SR-DEV-03, SEC D1)
    const noDevice = await staff(
      fa,
      tok('fd'),
      null,
      'POST',
      `${P(t)}/registrations/${reg.id}/documents`,
      {
        multipart: [{ name: 'data', value: JSON.stringify(emma) }],
      },
    );
    expect(noDevice.statusCode).toBe(403);
    expect(noDevice.json().code).toBe('DEVICE_NOT_TRUSTED');

    // SEC C3: at most 4 images per person.
    const five = await addDoc(reg.id, emma, 5);
    expect(five.json()).toMatchObject({
      code: 'FILE_REJECTED',
      errors: [{ field: 'image', code: 'TOO_MANY_FILES' }],
    });
    const r = await addDoc(reg.id, emma, 2);
    expect(r.statusCode).toBe(201);
    const body = r.json();
    expect(body.status).toBe('partial');
    expect(body.kind).toBe('foreigner_temp_residence');
    const doc = body.documents[0];
    expect(doc.docNumberLast4).toBe('0T47');
    expect(doc.imageIds).toHaveLength(2);
    expect(doc.isMain).toBe(true);
    expect(JSON.stringify(body)).not.toContain('C01X00T47');
    for (const k of [
      'docNumber',
      'dateOfBirth',
      'passportExpiryDate',
      'visaValidUntil',
      'entryDate',
    ]) {
      expect(doc).not.toHaveProperty(k);
    }
    const dbRow = await db.withContext(t.ctx(), async (tx) => {
      const g = await tx.query(`SELECT * FROM guest_document WHERE id = $1`, [doc.id]);
      const log = await tx.query(
        `SELECT action, subject_type FROM c3_access_log WHERE subject_id = $1`,
        [doc.id],
      );
      return { g: g.rows[0]!, log: log.rows };
    });
    const raw = JSON.stringify(dbRow.g);
    expect(raw).not.toContain('C01X00T47');
    expect(raw).not.toContain('2031-01-01');
    expect(dbRow.g.doc_number_enc).toBeInstanceOf(Buffer);
    expect(dbRow.g.doc_number_hmac).toMatch(/^[0-9a-f]{64}$/);
    expect(dbRow.log).toEqual([{ action: 'create', subject_type: 'guest_document' }]);
    // Stored image blobs are ciphertext (no JPEG header, no EXIF text).
    const store = fa.app.get<BlobStore>(BLOB_STORE);
    const keys = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ blob_key: string }>(
            'SELECT blob_key FROM document_image WHERE guest_document_id = $1',
            [doc.id],
          )
        ).rows,
    );
    for (const k of keys) {
      const blob = (await store.get(k.blob_key)) as Buffer;
      expect(blob.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))).toBe(false);
      expect(blob.includes(Buffer.from('GPS-LOCATION-SECRET'))).toBe(false);
    }
  });

  it('roles: HK/SAL get 403 on every registration route; serializer never gives them document fields', async () => {
    const { reservationId } = await seedStay(db, t, ids);
    const reg = await registrationOf(reservationId);
    for (const u of ['hk', 'sal']) {
      expect(
        (await staff(fa, tok(u), device, 'GET', `${P(t)}/registrations/${reg.id}`)).statusCode,
      ).toBe(403);
      expect((await staff(fa, tok(u), device, 'GET', `${P(t)}/registrations`)).statusCode).toBe(
        403,
      );
    }
    const full = (
      await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${reg.id}`)
    ).json();
    const sample = {
      ...full,
      documents: [
        {
          id: reg.id,
          docType: 'passport',
          isMain: true,
          docNumberLast4: '1234',
          fullNameOnDoc: 'X Y',
          imageIds: [reg.id],
          imageConsent: 'granted',
          checks: [],
        },
      ],
    };
    for (const role of ['housekeeping', 'maintenance', 'sales_staff', 'collaborator']) {
      const out = JSON.stringify(
        serializeResponse('getRegistration', 200, sample, { roles: [role] }),
      );
      for (const k of ['docNumberLast4', 'imageIds', 'imageConsent']) expect(out).not.toContain(k);
    }
  });

  it('B3: step-up window, reason, c3 log BEFORE data, no-store, 503 when the log cannot be written', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 1 });
    const reg = await registrationOf(reservationId);
    const doc = (await addDoc(reg.id, emma, 1)).json().documents[0];
    const url = `${P(t)}/registrations/${reg.id}/documents/${doc.id}/sensitive`;
    const before = await staff(fa, tok('fdl'), device, 'GET', url);
    expect(before.statusCode).toBe(401);
    expect(before.json().code).toBe('REAUTH_REQUIRED');
    // wrong password → 401 REAUTH_FAILED; pin (R3) → 422
    const wrong = await staff(fa, tok('fdl'), device, 'POST', '/v1/me/step-up', {
      json: { password: 'nope-nope' },
    });
    expect(wrong.json().code).toBe('REAUTH_FAILED');
    expect(
      (await staff(fa, tok('fdl'), device, 'POST', '/v1/me/step-up', { json: { pin: '123456' } }))
        .statusCode,
    ).toBe(422);
    await stepUp('fdl');
    const ok = await staff(fa, tok('fdl'), device, 'GET', url);
    expect(ok.statusCode).toBe(200);
    expect(ok.headers['cache-control']).toBe('no-store');
    expect(ok.json()).toMatchObject({
      docNumber: 'C01X00T47',
      passportExpiryDate: '2031-01-01',
      visaKind: 'visa_exempt',
    });
    const views = async () =>
      db.withContext(
        t.ctx(),
        async (tx) =>
          (
            await tx.query(
              `SELECT count(*)::int AS n FROM c3_access_log WHERE subject_id = $1 AND action = 'view'`,
              [doc.id],
            )
          ).rows[0]!.n,
      );
    expect(await views()).toBe(1);
    // Log write fails → 503 and no data (SR-C3-07).
    const audit = fa.app.get(AuditService);
    const spy = vi.spyOn(audit, 'recordC3Access').mockRejectedValueOnce(new Error('disk full'));
    const failed = await staff(fa, tok('fdl'), device, 'GET', url);
    spy.mockRestore();
    expect(failed.statusCode).toBe(503);
    expect(failed.body).not.toContain('C01X00T47');
    expect(await views()).toBe(1);
    // SR-RL-06: 200 C3 reads in the last hour → 429 (counted from c3_access_log).
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO c3_access_log (organization_id, property_id, occurred_at, actor_type, user_id,
           subject_type, subject_id, action)
         SELECT $1, $2, $3, 'user', $4, 'guest_document', $5, 'view' FROM generate_series(1, 199)`,
        [t.organizationId, t.propertyIds[0], T0, t.users.fdl!.id, doc.id],
      ),
    );
    const limited = await staff(fa, tok('fdl'), device, 'GET', url);
    expect(limited.statusCode).toBe(429);
    expect(limited.headers['retry-after']).toBeDefined();
    // Window slides with each C3 read; 16 minutes of inactivity → 401 again.
    fa.clock.advance(16 * MIN);
    await db.withContext(t.ctx(), (tx) =>
      tx.query(`UPDATE user_session SET idle_expires_at = $1, expires_at = $1`, [
        new Date(fa.clock.now().getTime() + 3_600_000),
      ]),
    );
    expect((await staff(fa, tok('fdl'), device, 'GET', url)).json().code).toBe('REAUTH_REQUIRED');
    fa.clock.set(T0);
  });

  it('checks, K4/K5 with notes and consent, portal data (1 view row per call), K6/K7 purge of refused images', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 2, bookerName: 'Emma Schmidt' });
    let reg = await registrationOf(reservationId);
    const d1 = (await addDoc(reg.id, emma, 1)).json().documents[0];
    const second = await addDoc(reg.id, an, 1);
    expect(second.statusCode).toBe(201);
    let body = second.json();
    expect(body.status).toBe('review');
    expect(body.kind).toBe('mixed');
    const d2 = body.documents.find((d: { id: string }) => d.id !== d1.id);
    expect(d2.checks.find((c: { code: string }) => c.code === 'name_match').result).toBe(
      'unverified',
    );
    // duplicate document number in the same booking → 409
    expect((await addDoc(reg.id, an, 0)).statusCode).toBe(409);
    reg = { id: reg.id, version: body.version };
    const url = `${P(t)}/registrations/${reg.id}/actions/complete-review`;
    // unverified item without note/manual result → 422 CHECK_NOTE_REQUIRED
    const missingNote = await staff(fa, tok('fd'), device, 'POST', url, {
      json: {},
      ifMatch: reg.version,
    });
    expect(missingNote.statusCode).toBe(422);
    expect(JSON.stringify(missingNote.json().errors)).toContain('CHECK_NOTE_REQUIRED');
    // note repeating the document number is refused
    const leak = await staff(
      fa,
      tok('fd'),
      device,
      'PUT',
      `${P(t)}/registrations/${reg.id}/documents/${d2.id}/checks/name_match`,
      { json: { manualResult: 'pass', note: 'Đã xem CCCD 079123456789' }, ifMatch: reg.version },
    );
    expect(leak.json().errors).toEqual([{ field: 'note', code: 'SENSITIVE_DATA_DETECTED' }]);
    const check = await staff(
      fa,
      tok('fd'),
      device,
      'PUT',
      `${P(t)}/registrations/${reg.id}/documents/${d2.id}/checks/name_match`,
      {
        json: { manualResult: 'pass', note: 'Người đi cùng, đã đối chiếu bản gốc' },
        ifMatch: reg.version,
      },
    );
    expect(check.statusCode).toBe(200);
    reg.version = check.json().version;
    // consent missing → 409 REGISTRATION_INCOMPLETE
    const noConsent = await staff(fa, tok('fd'), device, 'POST', url, {
      json: {},
      ifMatch: reg.version,
    });
    expect(noConsent.statusCode).toBe(409);
    expect(noConsent.json().code).toBe('REGISTRATION_INCOMPLETE');
    for (const [doc, decision] of [
      [d1, 'granted'],
      [d2, 'refused'],
    ] as const) {
      const c = await staff(
        fa,
        tok('fd'),
        device,
        'POST',
        `${P(t)}/registrations/${reg.id}/consents`,
        {
          json: {
            partyMemberId: doc.id,
            purpose: 'P02B_ID_IMAGE_RETENTION',
            decision,
            channel: 'desk',
            noticeVersion: 'privacy-2026-10-v1',
            locale: 'en',
          },
        },
      );
      expect(c.statusCode).toBe(201);
      reg.version = c.json().version;
    }
    const done = await staff(fa, tok('fd'), device, 'POST', url, {
      json: {},
      ifMatch: reg.version,
    });
    expect(done.statusCode).toBe(200);
    expect(done.json().status).toBe('scanned');
    reg.version = done.json().version;

    // Portal data: mixed → kind required; each call = one `portal_data view` row before the data.
    await stepUp('fd');
    const pd = `${P(t)}/registrations/${reg.id}/portal-data`;
    expect((await staff(fa, tok('fd'), device, 'GET', pd)).json().errors).toEqual([
      { field: 'kind', code: 'REQUIRED' },
    ]);
    const fo = await staff(fa, tok('fd'), device, 'GET', `${pd}?kind=foreigner_temp_residence`);
    expect(fo.statusCode).toBe(200);
    expect(fo.headers['cache-control']).toBe('no-store');
    expect(fo.json().people).toHaveLength(1);
    expect(fo.json().clipboardText).toContain('C01X00T47');
    // ORC 17/10: Vietnamese enum text for the portal + reg.value.* key for the client; empty fields kept.
    const fields = fo.json().people[0].fields as Array<{
      label: string;
      value: string;
      valueKey?: string;
    }>;
    expect(fields).toHaveLength(15);
    expect(fields.find((x) => x.label === 'reg.field.gender')).toEqual({
      label: 'reg.field.gender',
      value: 'Nữ',
      valueKey: 'reg.value.gender.female',
    });
    expect(fields.find((x) => x.label === 'reg.field.visa_kind')).toEqual({
      label: 'reg.field.visa_kind',
      value: 'Miễn thị thực',
      valueKey: 'reg.value.visa_kind.visa_exempt',
    });
    expect(fields.find((x) => x.label === 'reg.field.entry_port')).toEqual({
      label: 'reg.field.entry_port',
      value: '',
      valueKey: 'reg.value.empty',
    });
    expect(fo.json().clipboardText).toContain('\tNữ\t');
    expect(fo.json().clipboardText).not.toMatch(/female|visa_exempt/);
    await staff(fa, tok('fd'), device, 'GET', `${pd}?kind=vn_citizen_stay`);
    const portalRows = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query(
            `SELECT action FROM c3_access_log WHERE subject_type = 'portal_data' AND subject_id = $1`,
            [reg.id],
          )
        ).rows,
    );
    expect(portalRows).toEqual([{ action: 'view' }, { action: 'view' }]);

    // K6 per block (mixed): sent only when both blocks have a code.
    const tr = (name: string, json: unknown) =>
      staff(fa, tok('fd'), device, 'POST', `${P(t)}/registrations/${reg.id}/actions/${name}`, {
        json,
        ifMatch: reg.version,
      });
    expect((await tr('mark-sent', { portalReference: 'x' })).json().errors).toEqual([
      { field: 'portalReference', code: 'PORTAL_REFERENCE_REQUIRED' },
    ]);
    let s = await tr('mark-sent', {
      portalReference: 'LT-2026-0041872',
      kind: 'foreigner_temp_residence',
    });
    expect(s.json().status).toBe('scanned');
    reg.version = s.json().version;
    s = await tr('mark-sent', { portalReference: 'VN-2026-001', kind: 'vn_citizen_stay' });
    expect(s.json().status).toBe('sent');
    expect(s.json().portalReference).toBe('LT-2026-0041872');
    reg.version = s.json().version;
    // K7: the refused person's images are destroyed in the same transaction.
    const confirmed = await tr('mark-confirmed', {});
    expect(confirmed.statusCode).toBe(200);
    body = confirmed.json();
    expect(body.status).toBe('confirmed');
    expect(body.imagesPurgeReason).toBe('no_consent');
    const docs = Object.fromEntries(
      body.documents.map((d: { id: string; imageIds: string[] }) => [d.id, d.imageIds]),
    );
    expect(docs[d2.id]).toEqual([]);
    expect(docs[d1.id]).toHaveLength(1);
    const purged = await db.withContext(t.ctx(), async (tx) => {
      const img = await tx.query(
        `SELECT i.id, i.blob_key, k.wrapped_key, k.destroyed_at FROM document_image i
         JOIN data_key k ON k.id = i.data_key_id WHERE i.guest_document_id = $1`,
        [d2.id],
      );
      const log = await tx.query(`SELECT action FROM c3_access_log WHERE subject_id = $1`, [
        img.rows[0]!.id,
      ]);
      const j = await tx.query(
        `SELECT action FROM purge_journal WHERE subject_id = $1 ORDER BY id`,
        [img.rows[0]!.id],
      );
      return { img: img.rows[0]!, log: log.rows, journal: j.rows.map((r) => r.action) };
    });
    expect(purged.img.wrapped_key).toBeNull();
    expect(purged.img.destroyed_at).not.toBeNull();
    expect(purged.journal).toEqual(['destroy_dek', 'delete_blob']);
    expect(purged.log).toEqual([{ action: 'purge' }]);
    expect(await fa.app.get<BlobStore>(BLOB_STORE).get(purged.img.blob_key)).toBeNull();
    // Viewing the purged image → 404 and no view row (E06-04).
    const img404 = await staff(
      fa,
      tok('fd'),
      device,
      'GET',
      `${P(t)}/registrations/${reg.id}/documents/${d2.id}/images/${purged.img.id}?reason=recheck`,
    );
    expect(img404.statusCode).toBe(404);
    // A consenting guest's image is still viewable (with a reason once confirmed) – headers SR-FILE-06.
    const keepId = docs[d1.id][0];
    const noReason = await staff(
      fa,
      tok('fd'),
      device,
      'GET',
      `${P(t)}/registrations/${reg.id}/documents/${d1.id}/images/${keepId}`,
    );
    expect(noReason.json().errors).toEqual([{ field: 'reason', code: 'REQUIRED' }]);
    const img = await staff(
      fa,
      tok('fd'),
      device,
      'GET',
      `${P(t)}/registrations/${reg.id}/documents/${d1.id}/images/${keepId}?reason=recheck`,
    );
    expect(img.statusCode).toBe(200);
    expect(img.headers['content-type']).toBe('image/jpeg');
    expect(img.headers['content-disposition']).toBe('inline; filename="document"');
    expect(img.headers['x-content-type-options']).toBe('nosniff');
    expect(img.headers['content-security-policy']).toBe("sandbox; default-src 'none'");
    expect(img.rawPayload.includes(Buffer.from('GPS-LOCATION-SECRET'))).toBe(false);
    // refused → granted after the declaration → 409 CONSENT_CHANGE_NOT_ALLOWED
    const back = await staff(
      fa,
      tok('fd'),
      device,
      'POST',
      `${P(t)}/registrations/${reg.id}/consents`,
      {
        json: {
          partyMemberId: d2.id,
          purpose: 'P02B_ID_IMAGE_RETENTION',
          decision: 'granted',
          channel: 'desk',
          noticeVersion: 'privacy-2026-10-v1',
          locale: 'vi',
        },
      },
    );
    expect(back.json().code).toBe('CONSENT_CHANGE_NOT_ALLOWED');

    // Checkout (port of BE-A) → T02 = checkout + 30 days; J16 (Clock) purges after that, not before.
    const port = fa.app.get(RegistrationPortService);
    const checkout = new Date('2026-10-20T04:00:00.000Z');
    await db.withContext(t.ctx(), (tx) => port.onCheckedOut(tx, reservationId, checkout));
    const after = (
      await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${reg.id}`)
    ).json();
    expect(after.status).toBe('needs_update'); // foreign guest: departure to update on the portal (BR-604)
    expect(new Date(after.imageRetentionUntil).toISOString()).toBe('2026-11-19T04:00:00.000Z');
    const retention = fa.app.get(RetentionService);
    fa.clock.set(new Date('2026-11-19T03:59:00.000Z'));
    const early = await db.withContext(t.ctx(), (tx) =>
      retention.run(tx, 'Asia/Ho_Chi_Minh', { force: true }),
    );
    expect(early.t02Images).toBe(0);
    fa.clock.set(new Date('2026-11-19T04:01:00.000Z'));
    const due = await db.withContext(t.ctx(), (tx) =>
      retention.run(tx, 'Asia/Ho_Chi_Minh', { force: true }),
    );
    expect(due.t02Images).toBe(1);
    const runs = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query(
            `SELECT policy_key, items_count FROM retention_run WHERE run_at = $1 ORDER BY policy_key`,
            [fa.clock.now()],
          )
        ).rows,
    );
    expect(runs).toEqual([
      { policy_key: 'J16', items_count: 1 },
      { policy_key: 'T02', items_count: 1 },
    ]);
    // Hourly throttle: a second tick right after does nothing.
    expect(
      (await db.withContext(t.ctx(), (tx) => retention.run(tx, 'Asia/Ho_Chi_Minh'))).skipped,
    ).toBe(true);
    fa.clock.set(T0);
  });

  it('A74 early purge: OWN/MGR only, If-Match, reason; second time → 409', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 1 });
    const reg = await registrationOf(reservationId);
    const r = await addDoc(reg.id, an, 2);
    const version = r.json().version;
    const url = `${P(t)}/registrations/${reg.id}/images?reason=guest_request`;
    expect(
      (await staff(fa, tok('fd'), device, 'DELETE', url, { ifMatch: version })).statusCode,
    ).toBe(403);
    expect(
      (await staff(fa, tok('mgr'), device, 'DELETE', url, { ifMatch: version - 1 })).statusCode,
    ).toBe(412);
    expect(
      (
        await staff(fa, tok('mgr'), device, 'DELETE', `${P(t)}/registrations/${reg.id}/images`, {
          ifMatch: version,
        })
      ).statusCode,
    ).toBe(422);
    const ok = await staff(fa, tok('mgr'), device, 'DELETE', url, { ifMatch: version });
    expect(ok.statusCode).toBe(204);
    const now = (
      await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${reg.id}`)
    ).json();
    expect(now.imagesPurgeReason).toBe('guest_request');
    expect(now.documents[0].imageIds).toEqual([]);
    expect(
      (await staff(fa, tok('mgr'), device, 'DELETE', url, { ifMatch: now.version })).json().code,
    ).toBe('INVALID_TRANSITION');
  });

  it('BR-613 (c): passport expired at arrival blocks (blocksDoorCode, check-in port); manual pass on unverified unblocks', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 1 });
    const reg = await registrationOf(reservationId);
    const r = await addDoc(
      reg.id,
      { ...emma, docNumber: 'P7777777', passportExpiryDate: '2026-10-10' },
      1,
    );
    expect(r.json().blocksDoorCode).toBe(true);
    const port = fa.app.get(RegistrationPortService);
    const status = await db.withContext(t.ctx(), (tx) =>
      port.checkinDocumentStatus(tx, reservationId),
    );
    expect(status).toMatchObject({ mainGuestDocument: true, documentCheckBlock: true });
    // Check-in time → deadline BR-603 (+12 h).
    const at = new Date('2026-10-15T14:40:00.000Z');
    const deadline = await db.withContext(t.ctx(), (tx) => port.onCheckedIn(tx, reservationId, at));
    expect(deadline?.toISOString()).toBe('2026-10-16T02:40:00.000Z');
  });

  it('cancellation voids the registration (K11) and destroys its images at once; listC3AccessLog (OWN) masks', async () => {
    const { reservationId, code } = await seedStay(db, t, ids, { adults: 1 });
    const reg = await registrationOf(reservationId);
    await addDoc(reg.id, an, 1);
    await setStayStatus(db, t, reservationId, 'cancelled');
    const port = fa.app.get(RegistrationPortService);
    await db.withContext(t.ctx(), (tx) => port.onReservationVoided(tx, reservationId));
    const v = (await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${reg.id}`)).json();
    expect(v.status).toBe('void');
    expect(v.imagesPurgeReason).toBe('void');
    const log = await staff(
      fa,
      tok('own'),
      device,
      'GET',
      `${P(t)}/c3-access-log?reservationId=${reservationId}`,
    );
    expect(log.statusCode).toBe(200);
    const entries = log.json().data;
    expect(entries.map((e: { action: string }) => e.action).sort()).toEqual(['create', 'purge']);
    expect(entries[0].reservationCode).toBe(code);
    expect(JSON.stringify(entries)).not.toContain('079123456789');
    expect((await staff(fa, tok('fd'), device, 'GET', `${P(t)}/c3-access-log`)).statusCode).toBe(
      403,
    );
  });
});
