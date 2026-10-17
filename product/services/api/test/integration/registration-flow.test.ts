/**
 * Registration end to end over HTTP on PostgreSQL (EP06 v0.2; SEC s3-checklist B1–B4, C1–C5, E1):
 * documents encrypted (no clear value in the DB), masked JSON, trusted device, step-up window, C3 log
 * before data (503 when it cannot be written), checks/K5, consent, portal data (1 log row per call),
 * K6/K7 with immediate purge of non-consenting people, early purge (A74), J16 with the Clock, C3 log list.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Database } from '../../src/db/database';
import { AuditService } from '../../src/modules/audit/public/audit.service';
import { BLOB_STORE, type BlobStore } from '../../src/modules/files/internal/blob-store';
import { RegistrationPortService } from '../../src/modules/registration/public/registration.port';
import { JobRegistry } from '../../src/jobs/job-runner';
import { RegistrationService } from '../../src/modules/registration/internal/registration.service';
import { RetentionService } from '../../src/modules/registration/internal/retention.service';
import { EncryptedBlobService } from '../../src/modules/files/public/encrypted-blob.service';
import { normalizeImage } from '../../src/modules/files/public/image-pipeline';
import { RegistrationPartyLink } from '../../src/modules/registration/public/party-port';
import { serializeResponse } from '../../src/shared/serialization/serializer';
import {
  type FeatureApp,
  P,
  TEST_PASSWORD,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import { sampleJpeg, seedStay, setStayStatus, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, seedGuestRow } from '../helpers/reservations-fixture';
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
  // A failed Clock test must not leave the app in the future for the next one.
  afterEach(() => fa?.clock.set(T0));

  async function stepUp(user: string): Promise<void> {
    const r = await staff(fa, tok(user), device, 'POST', '/v1/me/step-up', {
      json: { password: TEST_PASSWORD },
    });
    expect(r.statusCode).toBe(200);
  }

  async function registrationOf(reservationId: string): Promise<{ id: string; version: number }> {
    // K1 records of fixture bookings come from the J16 tick backfill (the GET is read-only – ARC S3-27 (6)).
    await db.withContext(t.ctx(), (tx) => fa.app.get(RegistrationService).backfill(tx));
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

  async function addDoc(
    regId: string,
    data: Record<string, unknown>,
    images = 1,
    user = 'fd',
    idem?: string,
  ) {
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
      ...(idem ? { idem } : {}),
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
    // docType / fullNameOnDoc: the role gate is the control (403 above); the contract-wide check of every
    // DTO these roles can call is in test/be-c-s3-units.test.ts (SEC BE-50 (d)).
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
    // SEC BE-48: separators, a glued prefix and ANOTHER person's number are caught too.
    for (const note of [
      'Đã xem CCCD 079 123 456 789',
      'Số 079.123.456.789 khớp',
      'CCCD079123456789 bản gốc',
      'Đối chiếu với hộ chiếu C01X-00T47 của người đi cùng',
    ]) {
      const r = await staff(
        fa,
        tok('fd'),
        device,
        'PUT',
        `${P(t)}/registrations/${reg.id}/documents/${d2.id}/checks/name_match`,
        { json: { manualResult: 'pass', note }, ifMatch: reg.version },
      );
      expect({ note, errors: r.json().errors }).toEqual({
        note,
        errors: [{ field: 'note', code: 'SENSITIVE_DATA_DETECTED' }],
      });
    }
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
    // 0.3.6 bổ sung 3: the desk reads the consent sentence parameters from Registration.consentNotice …
    const shown = (
      await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations/${reg.id}`)
    ).json();
    expect(shown.consentNotice).toEqual({
      currentNoticeVersion: 'privacy-2026-10-v1',
      imageRetentionDays: 30,
    });
    // … and must send back exactly those values (an old version / other days → 422 NOT_IN_LIST, nothing stored).
    const stale = await staff(
      fa,
      tok('fd'),
      device,
      'POST',
      `${P(t)}/registrations/${reg.id}/consents`,
      {
        json: {
          partyMemberId: d1.id,
          purpose: 'P02B_ID_IMAGE_RETENTION',
          decision: 'granted',
          channel: 'desk',
          noticeVersion: 'privacy-2026-01-v0',
          retentionDays: 90,
          locale: 'vi',
        },
      },
    );
    expect(stale.json().errors).toEqual([
      { field: 'noticeVersion', code: 'NOT_IN_LIST' },
      { field: 'retentionDays', code: 'NOT_IN_LIST' },
    ]);
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
            retentionDays: 30,
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
    // DOM S3-5 / ESC-018 (INV): dates dd/MM/yyyy, nationality = the bare alpha-3 code.
    expect(fields.find((x) => x.label === 'reg.field.date_of_birth')?.value).toBe('12/04/1990');
    expect(fields.find((x) => x.label === 'reg.field.nationality')?.value).toBe('DEU');
    expect(fo.json().clipboardText).not.toContain('Đức');
    expect(fields.find((x) => x.label === 'reg.field.arrival_date')?.value).toBe('15/10/2026');
    expect(fo.json().clipboardText).not.toContain('1990-04-12');
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
    // SEC BE-48 (2): once the declaration is closed, "registration" is no longer a reason.
    const closedReason = await staff(
      fa,
      tok('fd'),
      device,
      'GET',
      `${P(t)}/registrations/${reg.id}/documents/${d1.id}/images/${keepId}?reason=registration`,
    );
    expect(closedReason.json().errors).toEqual([{ field: 'reason', code: 'NOT_IN_LIST' }]);
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
          retentionDays: 30,
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
    // Hourly throttle: a second tick right after skips the hourly part (no second heartbeat row).
    expect(
      (await db.withContext(t.ctx(), (tx) => retention.run(tx, 'Asia/Ho_Chi_Minh'))).skipped,
    ).toBe(true);
    fa.clock.set(T0);
  });

  it('BUG-R2-036 / BR-609-01: a refused image left by a failed immediate purge goes at confirmed + 24 h on ANY tick', async () => {
    const r = await scannedRegistration('Đỗ Văn Em', '079200000020');
    const sent = await r.act('mark-sent', { portalReference: 'VN-36', kind: 'vn_citizen_stay' });
    expect(sent.json().status).toBe('sent');
    const confirmedAt = T0; // 09:00 local
    expect((await r.act('mark-confirmed', {})).statusCode).toBe(200);
    // Simulate the failed immediate deletion: the person is now "refused" with the image still alive.
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO consent_record (id, organization_id, property_id, registration_id, guest_document_id,
           purpose, decision, channel, notice_version, locale, recorded_at, recorded_by_type, recorded_by,
           retention_days)
         SELECT gen_random_uuid(), organization_id, property_id, registration_id, id,
                'P02B_ID_IMAGE_RETENTION', 'refused', 'desk', 'privacy-2026-10-v1', 'vi', $2, 'user', $3, 30
           FROM guest_document WHERE id = $1`,
        [r.documentId, confirmedAt, t.users.fd!.id],
      ),
    );
    const retention = fa.app.get(RetentionService);
    const tick = async (at: string) => {
      fa.clock.set(new Date(at));
      return db.withContext(t.ctx(), (tx) => retention.run(tx, 'Asia/Ho_Chi_Minh'));
    };
    // 08:59 next day: hourly run (heartbeat) – not yet due.
    await tick('2026-10-16T01:59:00.000Z');
    expect((await imageState(r.documentId)).deleted_at).toBeNull();
    // 09:00 – one minute later, the hourly part is throttled but the image step still runs.
    const at = await tick('2026-10-16T02:00:00.000Z');
    expect(at.skipped).toBe(true);
    expect(at.t01Images).toBeGreaterThanOrEqual(1);
    expect(await imageState(r.documentId)).toMatchObject({ delete_reason: 'no_consent' });
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
    // BUG-R2-048: the contract's date filter is `from` / `to` (local dates of the property).
    const logOf = (q: string) =>
      staff(
        fa,
        tok('own'),
        device,
        'GET',
        `${P(t)}/c3-access-log?reservationId=${reservationId}&${q}`,
      );
    expect((await logOf('from=2000-01-01&to=2000-01-02')).json().data).toEqual([]);
    expect((await logOf('from=2026-10-15&to=2026-10-15')).json().data).toHaveLength(2);
    expect((await logOf('from=2026-10-16')).json().data).toEqual([]);
    expect((await logOf('from=2026-02-31')).json().errors).toEqual([
      { field: 'from', code: 'DATE_INVALID' },
    ]);
    expect((await logOf('from=2026-10-16&to=2026-10-15')).json().errors).toEqual([
      { field: 'to', code: 'DATE_INVALID' },
    ]);
  });

  /** Single VN guest reviewed up to `scanned` (consent given). */
  async function scannedRegistration(
    name: string,
    docNumber: string,
    stay: { arrival?: string; departure?: string } = {},
  ) {
    const { reservationId } = await seedStay(db, t, ids, { adults: 1, bookerName: name, ...stay });
    const reg = await registrationOf(reservationId);
    const add = await addDoc(reg.id, { ...an, fullNameOnDoc: name, docNumber }, 1);
    expect(add.statusCode).toBe(201);
    const doc = add.json().documents[0];
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
          decision: 'granted',
          channel: 'desk',
          noticeVersion: 'privacy-2026-10-v1',
          retentionDays: 30,
          locale: 'vi',
        },
      },
    );
    expect(c.statusCode).toBe(201);
    const state = { version: c.json().version as number };
    const act = async (action: string, json: unknown) => {
      const r = await staff(
        fa,
        tok('fd'),
        device,
        'POST',
        `${P(t)}/registrations/${reg.id}/actions/${action}`,
        { json, ifMatch: state.version },
      );
      if (r.statusCode === 200) state.version = r.json().version;
      return r;
    };
    const review = await act('complete-review', {});
    expect(review.statusCode, JSON.stringify(review.json())).toBe(200);
    expect(review.json().status).toBe('scanned');
    return { reservationId, registrationId: reg.id, documentId: doc.id as string, act };
  }

  /** … then declared on the portal (`sent`), never confirmed – the BE-32 cases. */
  async function sentRegistration(name: string, docNumber: string) {
    const r = await scannedRegistration(name, docNumber);
    const sent = await r.act('mark-sent', {
      portalReference: `VN-${docNumber}`,
      kind: 'vn_citizen_stay',
    });
    expect(sent.json().status).toBe('sent');
    // SEC BE-48: the rejection reason is checked like a note (6+ digits / a document number).
    const rej = await r.act('mark-rejected', { rejectedReason: `Cổng báo sai số ${docNumber}` });
    expect(rej.json().errors).toEqual([
      { field: 'rejectedReason', code: 'SENSITIVE_DATA_DETECTED' },
    ]);
    return r;
  }

  async function imageState(documentId: string) {
    return db.withContext(t.ctx(), async (tx) => {
      const img = await tx.query<{
        id: string;
        blob_key: string;
        deleted_at: Date | null;
        delete_reason: string | null;
        delete_after: Date | null;
      }>(
        `SELECT id, blob_key, deleted_at, delete_reason, delete_after FROM document_image
          WHERE guest_document_id = $1`,
        [documentId],
      );
      const row = img.rows[0]!;
      const journal = await tx.query<{ action: string }>(
        'SELECT action FROM purge_journal WHERE subject_id = $1 ORDER BY id',
        [row.id],
      );
      const log = await tx.query<{ action: string }>(
        `SELECT action FROM c3_access_log WHERE subject_id = $1 AND action = 'purge'`,
        [row.id],
      );
      return { ...row, journal: journal.rows.map((r) => r.action), purgeLog: log.rows.length };
    });
  }

  it('SEC BE-32: a declaration never confirmed – images go 7 days after the stay ended (checkout / cancel), legal hold keeps them', async () => {
    const out = await sentRegistration('Trần Thị Bình', '079200000001');
    const cancelled = await sentRegistration('Lê Văn Cường', '079200000002');
    const held = await sentRegistration('Phạm Thị Dung', '079200000003');
    const port = fa.app.get(RegistrationPortService);
    const checkout = new Date('2026-10-20T04:00:00.000Z');
    await setStayStatus(db, t, out.reservationId, 'checked_out', { actualCheckoutAt: checkout });
    await db.withContext(t.ctx(), (tx) => port.onCheckedOut(tx, out.reservationId, checkout));
    await setStayStatus(db, t, held.reservationId, 'checked_out', { actualCheckoutAt: checkout });
    await db.withContext(t.ctx(), async (tx) => {
      await port.onCheckedOut(tx, held.reservationId, checkout);
      await tx.query('UPDATE registration SET legal_hold = true WHERE id = $1', [
        held.registrationId,
      ]);
    });
    // Cancelled while `sent` (not voidable): the stay ended at the cancellation (Clock = T0).
    await setStayStatus(db, t, cancelled.reservationId, 'cancelled');
    await db.withContext(t.ctx(), (tx) => port.onReservationVoided(tx, cancelled.reservationId));
    expect((await imageState(out.documentId)).delete_after?.toISOString()).toBe(
      '2026-10-27T04:00:00.000Z',
    );
    expect((await imageState(cancelled.documentId)).delete_after?.toISOString()).toBe(
      new Date(T0.getTime() + 7 * 86_400_000).toISOString(),
    );

    const retention = fa.app.get(RetentionService);
    const run = async (at: string) => {
      fa.clock.set(new Date(at));
      return db.withContext(t.ctx(), (tx) =>
        retention.run(tx, 'Asia/Ho_Chi_Minh', { force: true }),
      );
    };
    // Day 7 − 1 min after the cancellation: nothing yet; then the cancelled one goes.
    await run('2026-10-22T01:59:00.000Z');
    expect((await imageState(cancelled.documentId)).deleted_at).toBeNull();
    const first = await run('2026-10-22T02:01:00.000Z');
    expect(first.unconfirmedImages).toBeGreaterThanOrEqual(1);
    expect(await imageState(cancelled.documentId)).toMatchObject({ delete_reason: 'unconfirmed' });
    // Checkout + 7 days − 1 min → kept; + 1 min → deleted with journal, c3 log and the file gone.
    await run('2026-10-27T03:59:00.000Z');
    expect((await imageState(out.documentId)).deleted_at).toBeNull();
    await run('2026-10-27T04:01:00.000Z');
    const gone = await imageState(out.documentId);
    expect(gone).toMatchObject({ delete_reason: 'unconfirmed', purgeLog: 1 });
    expect(gone.journal).toEqual(['destroy_dek', 'delete_blob']);
    expect(await fa.app.get<BlobStore>(BLOB_STORE).get(gone.blob_key)).toBeNull();
    // Legal hold: still there.
    expect((await imageState(held.documentId)).deleted_at).toBeNull();
    // FD/MGR see a "Cần chú ý" item for each declaration that never reached `confirmed`.
    const attention = await db.withContext(t.ctx(), async (tx) =>
      (
        await tx.query<{ ref_id: string }>(
          `SELECT ref_id FROM attention_event WHERE kind = 'registration_overdue'
               AND dedupe_key LIKE 'registration_unconfirmed:%' ORDER BY ref_id`,
        )
      ).rows.map((r) => r.ref_id),
    );
    // (Other stays of this file never closed are swept by the same runs – only these two are asserted.)
    expect(attention).toEqual(
      expect.arrayContaining([out.registrationId, cancelled.registrationId]),
    );
    expect(attention).not.toContain(held.registrationId);
    fa.clock.set(T0);
  });

  it('SEC BE-46 / ARC S3-27 (2): a poison row does not stop J16 – it is skipped and the run is `failed`', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 1 });
    const reg = await registrationOf(reservationId);
    const doc = (await addDoc(reg.id, { ...an, docNumber: '079200000009' }, 1)).json().documents[0];
    const retention = fa.app.get(RetentionService);
    // An image whose DEK row vanished from under it: destroying it throws inside its SAVEPOINT.
    await db.withContext(t.ctx(), (tx) =>
      tx.query(`UPDATE document_image SET delete_after = $2 WHERE guest_document_id = $1`, [
        doc.id,
        new Date('2026-10-15T00:00:00.000Z'),
      ]),
    );
    const spy = vi
      .spyOn(fa.app.get(RegistrationService), 'purgeImages')
      .mockRejectedValueOnce(Object.assign(new Error('boom'), { name: 'PoisonError' }));
    fa.clock.set(new Date('2026-10-15T03:00:00.000Z'));
    const stats = await db.withContext(t.ctx(), (tx) =>
      retention.run(tx, 'Asia/Ho_Chi_Minh', { force: true }),
    );
    spy.mockRestore();
    expect(stats.failures).toBeGreaterThanOrEqual(1);
    const runs = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ status: string; error: string | null }>(
            `SELECT status, error FROM retention_run WHERE policy_key = 'J16' AND run_at = $1`,
            [fa.clock.now()],
          )
        ).rows,
    );
    expect(runs).toHaveLength(1);
    expect(runs[0]!.status).toBe('failed');
    expect(runs[0]!.error).toContain('PoisonError');
    expect(runs[0]!.error).not.toContain('079200000009');
    // The next run (no poison) deletes it.
    fa.clock.set(new Date('2026-10-15T04:00:00.000Z'));
    await db.withContext(t.ctx(), (tx) => retention.run(tx, 'Asia/Ho_Chi_Minh', { force: true }));
    expect((await imageState(doc.id)).deleted_at).not.toBeNull();
    fa.clock.set(T0);
  });

  it('SEC BE-39: J16 deletes idempotency keys older than idempotency_ttl_hours (C2 in response bodies)', async () => {
    const at = new Date('2026-10-18T03:00:00.000Z');
    const old = randomUUID();
    const young = randomUUID();
    await db.withContext(t.ctx(), async (tx) => {
      for (const [key, hours] of [
        [old, 49],
        [young, 47],
      ] as const) {
        await tx.query(
          `INSERT INTO idempotency_key (principal_type, principal_id, key, organization_id, method, path,
             request_hash, state, response_status, response_body, created_at)
           VALUES ('user', $1, $2, $3, 'POST', '/x', 'h', 'completed', 201, '{"guestDisplayName":"X"}', $4)`,
          [t.users.fd!.id, key, t.organizationId, new Date(at.getTime() - hours * 3_600_000)],
        );
      }
    });
    fa.clock.set(at);
    const stats = await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RetentionService).run(tx, 'Asia/Ho_Chi_Minh', { force: true }),
    );
    expect(stats.idempotencyKeys).toBeGreaterThanOrEqual(1);
    const left = await db.withContext(t.ctx(), async (tx) =>
      (
        await tx.query<{ key: string }>(
          'SELECT key FROM idempotency_key WHERE key = ANY($1::text[])',
          [[old, young]],
        )
      ).rows.map((r) => r.key),
    );
    expect(left).toEqual([young]);
  });

  it('ARC S3-19: addGuestDocument retried with the same Idempotency-Key (new multipart boundary) → replay', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 1 });
    const reg = await registrationOf(reservationId);
    const key = randomUUID();
    const data = { ...an, docNumber: '079200000011' };
    const first = await addDoc(reg.id, data, 1, 'fd', key);
    expect(first.statusCode).toBe(201);
    const again = await addDoc(reg.id, data, 1, 'fd', key);
    expect(again.statusCode).toBe(201);
    expect(again.json().id).toBe(first.json().id);
    // Same key, different content → 422 IDEMPOTENCY_KEY_REUSED (the C3 fields only enter as a keyed hash).
    const other = await addDoc(reg.id, { ...data, docNumber: '079200000012' }, 1, 'fd', key);
    expect(other.json().code).toBe('IDEMPOTENCY_KEY_REUSED');
    const stored = await db.withContext(t.ctx(), async (tx) => {
      const docs = await tx.query('SELECT id FROM guest_document WHERE registration_id = $1', [
        reg.id,
      ]);
      const k = await tx.query<{ request_hash: string; response_body: unknown }>(
        'SELECT request_hash, response_body FROM idempotency_key WHERE key = $1',
        [key],
      );
      return { docs: docs.rowCount, key: k.rows[0]! };
    });
    expect(stored.docs).toBe(1);
    expect(JSON.stringify(stored.key)).not.toContain('079200000011');
  });

  it('DOM BE-22: "Ngày đến" of the portal data = calendar date of the actual check-in (B9a 04:40)', async () => {
    // Direct booking for 19/10 (night added before), guest arrives 04:40 on 20/10 (Asia/Ho_Chi_Minh).
    const { reservationId, registrationId } = await scannedRegistration(
      'Nguyễn Văn An',
      '079200000010',
      { arrival: '2026-10-19', departure: '2026-10-22' },
    );
    const reg = { id: registrationId };
    const at = new Date('2026-10-19T21:40:00.000Z');
    await setStayStatus(db, t, reservationId, 'in_house', { actualCheckinAt: at });
    await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RegistrationPortService).onCheckedIn(tx, reservationId, at),
    );
    await stepUp('fd');
    const pd = await staff(
      fa,
      tok('fd'),
      device,
      'GET',
      `${P(t)}/registrations/${reg.id}/portal-data?kind=vn_citizen_stay`,
    );
    expect(pd.statusCode).toBe(200);
    const fields = pd.json().people[0].fields as Array<{ label: string; value: string }>;
    expect(fields.find((x) => x.label === 'reg.field.arrival_date')?.value).toBe('20/10/2026');
    expect(fields.find((x) => x.label === 'reg.field.departure_date')?.value).toBe('22/10/2026');
    // ARC S3-27 (4): DEK destroyed → 404, not 500.
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `UPDATE data_key SET wrapped_key = NULL, destroyed_at = $2
          WHERE id = (SELECT data_key_id FROM guest_document WHERE registration_id = $1 LIMIT 1)`,
        [reg.id, T0],
      ),
    );
    const gone = await staff(
      fa,
      tok('fd'),
      device,
      'GET',
      `${P(t)}/registrations/${reg.id}/portal-data?kind=vn_citizen_stay`,
    );
    expect(gone.statusCode).toBe(404);
  });

  it('BUG-R2-035 / BUG-R2-034: J5 reminds once before the deadline, digest once at 22:00, late mark skipped; "Cần chú ý" due → overdue', async () => {
    const { reservationId, code } = await seedStay(db, t, ids, {
      adults: 1,
      bookerName: 'Hoàng Văn Giáp',
    });
    const reg = await registrationOf(reservationId);
    const at = new Date('2026-10-15T08:00:00.000Z'); // 15:00 local → VN deadline 23:00 (16:00Z)
    await setStayStatus(db, t, reservationId, 'in_house', { actualCheckinAt: at });
    await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RegistrationPortService).onCheckedIn(tx, reservationId, at),
    );
    const job = fa.app.get(JobRegistry).get('registration.deadline');
    expect(job).toBeDefined();
    const run = async (iso: string) => {
      fa.clock.set(new Date(iso));
      return db.withContext(t.ctx(), (tx) =>
        job!.handler(tx, {
          now: fa.clock.now(),
          organizationId: t.organizationId,
          propertyId: t.propertyIds[0]!,
          timezone: 'Asia/Ho_Chi_Minh',
          date: '2026-10-15',
          slot: 'tick',
        }),
      ) as Promise<Record<string, number>>;
    };
    const notes = (refType: string, refId: string) =>
      db.withContext(
        t.ctx(),
        async (tx) =>
          (
            await tx.query<{ user_id: string; ref_code: string | null }>(
              `SELECT user_id, ref_code FROM staff_notification
                WHERE kind = 'registration_due' AND ref_type = $1 AND ref_id = $2 ORDER BY user_id`,
              [refType, refId],
            )
          ).rows,
      );
    const attention = async () => {
      // The Clock moved hours ahead: keep the test sessions alive (idle timeout).
      await db.withContext(t.ctx(), (tx) =>
        tx.query(`UPDATE user_session SET idle_expires_at = $1, expires_at = $1`, [
          new Date(fa.clock.now().getTime() + 3_600_000),
        ]),
      );
      return (await staff(fa, tok('fd'), device, 'GET', `${P(t)}/attention`)).json().data as Array<{
        kind: string;
        severity: string;
        reservationIds?: string[];
        refCode?: string;
        params?: Record<string, unknown>;
      }>;
    };

    // 20:00 local: "registration_due" with the earliest deadline, no reminder yet (> 120 min left).
    fa.clock.set(new Date('2026-10-15T13:00:00.000Z'));
    const dueItem = (await attention()).find((i) => i.kind === 'registration_due');
    expect(dueItem?.reservationIds).toContain(reservationId);
    expect(dueItem?.severity).toBe('warning');
    expect(String(dueItem?.params?.deadline)).toMatch(/^2026-10-15T/);
    await run('2026-10-15T13:59:00.000Z');
    expect(await notes('registration', reg.id)).toEqual([]);
    // 21:01 local: 119 min left → one reminder to FD + FDL + MGR (not OWN, not HK/SAL), booking code only.
    await run('2026-10-15T14:01:00.000Z');
    const first = await notes('registration', reg.id);
    expect(first.map((n) => n.user_id).sort()).toEqual(
      [t.users.fd!.id, t.users.fdl!.id, t.users.mgr!.id].sort(),
    );
    expect(first.every((n) => n.ref_code === code)).toBe(true);
    await run('2026-10-15T14:30:00.000Z');
    expect(await notes('registration', reg.id)).toHaveLength(3);
    // 22:05 local: the BR-611 digest once (refType property), not again at 22:20.
    const digest = await run('2026-10-15T15:05:00.000Z');
    expect(digest.digests).toBe(1);
    const property = t.propertyIds[0]!;
    expect(await notes('property', property)).toHaveLength(3);
    expect((await run('2026-10-15T15:20:00.000Z')).digests).toBe(0);
    expect(await notes('property', property)).toHaveLength(3);
    // 23:01 local: overdue → critical computed item; no longer "due".
    fa.clock.set(new Date('2026-10-15T16:01:00.000Z'));
    const items = await attention();
    const over = items.find((i) => i.kind === 'registration_overdue' && !('eventId' in i));
    expect(over?.reservationIds).toContain(reservationId);
    expect(over?.severity).toBe('critical');
    expect(items.find((i) => i.kind === 'registration_due')?.reservationIds ?? []).not.toContain(
      reservationId,
    );
    // Worker down until 09:30 local: the 07:00 mark is 150 min late (> job_catchup_minutes 60) → skipped.
    const late = await run('2026-10-16T02:30:00.000Z');
    expect(late.digests).toBe(0);
    expect(late.digestsSkipped).toBe(1);
    // Sending the declaration ends it: not due, not overdue.
    await db.withContext(t.ctx(), (tx) =>
      tx.query(`UPDATE registration SET status = 'sent' WHERE id = $1`, [reg.id]),
    );
    const after = await attention();
    for (const kind of ['registration_due', 'registration_overdue']) {
      expect(
        after.filter((i) => i.kind === kind).flatMap((i) => i.reservationIds ?? []),
      ).not.toContain(reservationId);
    }
  });

  it('BUG-R2-034: "visa_expiring" – booking code + room only (SR-RET-06), never the expiry date', async () => {
    const { reservationId, code } = await seedStay(db, t, ids, { adults: 1 });
    const reg = await registrationOf(reservationId);
    const add = await addDoc(
      reg.id,
      {
        ...emma,
        docNumber: 'C77X00V01',
        visaKind: 'visa',
        visaNumber: 'V1234567',
        visaValidUntil: '2026-10-18',
      },
      1,
    );
    expect(add.statusCode).toBe(201);
    const data = (await staff(fa, tok('fd'), device, 'GET', `${P(t)}/attention`)).json()
      .data as Array<Record<string, unknown>>;
    const item = data.find(
      (i) =>
        i.kind === 'visa_expiring' &&
        (i.reservationIds as string[] | undefined)?.includes(reservationId),
    );
    expect(item).toMatchObject({
      kind: 'visa_expiring',
      severity: 'warning',
      refCode: code,
      roomNos: ['202'],
    });
    expect(item).not.toHaveProperty('params');
    expect(JSON.stringify(item)).not.toMatch(/2026-10-18|18\/10|C77X00V01|SCHMIDT/);
    // Checked out → the reminder date is cleared, the item disappears.
    await db.withContext(t.ctx(), (tx) =>
      fa.app
        .get(RegistrationPortService)
        .onCheckedOut(tx, reservationId, new Date('2026-10-15T05:00:00.000Z')),
    );
    const later = (await staff(fa, tok('fd'), device, 'GET', `${P(t)}/attention`)).json()
      .data as Array<{ kind: string; reservationIds?: string[] }>;
    expect(
      later.filter((i) => i.kind === 'visa_expiring').flatMap((i) => i.reservationIds ?? []),
    ).not.toContain(reservationId);
  });

  it('BUG-R2-033: person 2 without partyMemberId → the party port (BE-A, BR-951) gives the member; main guest never asks', async () => {
    const { reservationId } = await seedStay(db, t, ids, {
      adults: 2,
      bookerName: 'Nguyễn Văn An',
    });
    const reg = await registrationOf(reservationId);
    const memberId = await db.withContext(t.ctx(), async (tx) => {
      const guestId = await seedGuestRow(db, t, { name: 'Lý Thị Hoa' });
      const id = randomUUID();
      await tx.query(
        `INSERT INTO reservation_guest (id, organization_id, property_id, reservation_id, guest_id, role,
           relationship, price_age_band, created_at)
         VALUES ($1, $2, $3, $4, $5, 'companion', 'unknown', 'adult', $6)`,
        [id, t.organizationId, t.propertyIds[0], reservationId, guestId, T0],
      );
      return id;
    });
    const calls: Array<Record<string, unknown>> = [];
    const fake = {
      memberForDocument: async (_tx: unknown, input: Record<string, unknown>) => {
        calls.push(input);
        return input.fullNameOnDoc === 'Lý Thị Hoa'
          ? {
              memberId,
              guestId: null,
              via: 'member_name_dob' as const,
              overCount: false,
              possibleReturningGuest: false,
            }
          : null;
      },
    };
    // BE-A's DocumentPartyPort is handed to RegistrationPartyLink at module init; the test stands in for it.
    const spy = vi
      .spyOn(fa.app.get(RegistrationPartyLink), 'memberForDocument')
      .mockImplementation((tx, input) =>
        fake.memberForDocument(tx, input as unknown as Record<string, unknown>),
      );
    try {
      // Main guest: no lookup.
      const main = await addDoc(reg.id, { ...an, isMain: true }, 1);
      expect(main.statusCode).toBe(201);
      expect(calls).toHaveLength(0);
      // Person 2: matched → linked to the member returned by the port.
      const second = await addDoc(
        reg.id,
        {
          ...an,
          fullNameOnDoc: 'Lý Thị Hoa',
          docNumber: '079200000033',
          dateOfBirth: '1992-05-06',
        },
        1,
      );
      expect(second.statusCode).toBe(201);
      expect(calls).toHaveLength(1);
      expect(calls[0]).toMatchObject({
        reservationId,
        fullNameOnDoc: 'Lý Thị Hoa',
        dateOfBirth: '1992-05-06',
        isMinor: false,
        nationalityCode: 'VNM',
      });
      // 0.3.7 (erd 4.4): the v1 document key of a guest profile – another domain than doc_number_hmac.
      expect(calls[0]!.guestDocKey).toMatch(/^v1:[0-9a-f]{64}$/);
      const docs = second.json().documents as Array<{
        docNumberLast4: string;
        partyMemberId?: string;
      }>;
      expect(docs.find((d) => d.docNumberLast4 === '0033')?.partyMemberId).toBe(memberId);
      // Undecided (null) → stays unlinked, no error.
      const third = await addDoc(
        reg.id,
        { ...an, fullNameOnDoc: 'Người Lạ', docNumber: '079200000034', dateOfBirth: '1990-01-01' },
        1,
      );
      expect(third.statusCode).toBe(201);
      const d3 = (
        third.json().documents as Array<{ docNumberLast4: string; partyMemberId?: string }>
      ).find((d) => d.docNumberLast4 === '0034');
      expect(d3?.partyMemberId).toBeUndefined();
    } finally {
      spy.mockRestore();
    }
  });

  async function imagesOfRegistration(registrationId: string) {
    return db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{
            delete_after: Date | null;
            deleted_at: Date | null;
            delete_reason: string | null;
          }>(
            `SELECT delete_after, deleted_at, delete_reason FROM document_image
              WHERE registration_id = $1 ORDER BY id`,
            [registrationId],
          )
        ).rows,
    );
  }

  async function stayEndedAt(registrationId: string): Promise<Date | null> {
    return db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ stay_ended_at: Date | null }>(
            'SELECT stay_ended_at FROM registration WHERE id = $1',
            [registrationId],
          )
        ).rows[0]!.stay_ended_at,
    );
  }

  async function reservationVersion(reservationId: string): Promise<number> {
    return db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ version: number }>('SELECT version FROM reservation WHERE id = $1', [
            reservationId,
          ])
        ).rows[0]!.version,
    );
  }

  it('SEC BE-32 reopened: J16 reads the BOOKING state – no hook ran, stay_ended_at NULL; pre/partial/review/scanned/sent; checkout, cancel, no-show', async () => {
    // Five declarations in every status before `confirmed`, one image each; the bookings then end WITHOUT
    // any hook (as for data before 0053, or a hook that failed).
    const open = async (status: string, adults: number, docNumber: string) => {
      const { reservationId } = await seedStay(db, t, ids, { adults });
      const reg = await registrationOf(reservationId);
      expect((await addDoc(reg.id, { ...an, docNumber }, 1)).statusCode).toBe(201);
      return { reservationId, registrationId: reg.id, status };
    };
    const pre = await open('pre', 1, '079300000001');
    await db.withContext(t.ctx(), (tx) =>
      tx.query(`UPDATE registration SET status = 'pre' WHERE id = $1`, [pre.registrationId]),
    );
    const partial = await open('partial', 2, '079300000002');
    const review = await open('review', 1, '079300000003');
    const sc = await scannedRegistration('Vũ Thị Kim', '079300000004');
    const scanned = { ...sc, status: 'scanned' };
    const se = await sentRegistration('Đinh Văn Long', '079300000005');
    const sent = { ...se, status: 'sent' };
    const checkout = new Date('2026-10-20T04:00:00.000Z');
    await setStayStatus(db, t, pre.reservationId, 'checked_out', { actualCheckoutAt: checkout });
    await setStayStatus(db, t, partial.reservationId, 'cancelled');
    await setStayStatus(db, t, review.reservationId, 'checked_out', { actualCheckoutAt: checkout });
    await setStayStatus(db, t, scanned.reservationId, 'checked_out', {
      actualCheckoutAt: checkout,
    });
    await setStayStatus(db, t, sent.reservationId, 'no_show');
    const all = [pre, partial, review, scanned, sent];
    for (const c of all) {
      const statusNow = await db.withContext(
        t.ctx(),
        async (tx) =>
          (
            await tx.query<{ status: string }>('SELECT status FROM registration WHERE id = $1', [
              c.registrationId,
            ])
          ).rows[0]!.status,
      );
      expect({ case: c.status, statusNow }).toEqual({ case: c.status, statusNow: c.status });
      expect(await stayEndedAt(c.registrationId)).toBeNull();
      expect((await imagesOfRegistration(c.registrationId))[0]?.delete_after).toBeNull();
    }
    const retention = fa.app.get(RetentionService);
    const run = async (iso: string) => {
      fa.clock.set(new Date(iso));
      return db.withContext(t.ctx(), (tx) =>
        retention.run(tx, 'Asia/Ho_Chi_Minh', { force: true }),
      );
    };
    // Day 1 after the stays ended: J16 gives every image its deadline – nothing deleted yet.
    const first = await run('2026-10-21T05:00:00.000Z');
    expect(first.scheduled).toBeGreaterThanOrEqual(5);
    for (const c of all) {
      const imgs = await imagesOfRegistration(c.registrationId);
      expect({ case: c.status, deleted: imgs[0]?.deleted_at }).toEqual({
        case: c.status,
        deleted: null,
      });
      expect(imgs[0]?.delete_after).not.toBeNull();
      expect(await stayEndedAt(c.registrationId)).not.toBeNull();
    }
    // Cancelled at T0 (15/10 09:00, `cancelledAt` – the real cancellation time, re-verification) → gone at
    // 22/10 09:00 like the hook would have done; the others are still there.
    expect(
      (await imagesOfRegistration(partial.registrationId))[0]?.delete_after?.toISOString(),
    ).toBe(new Date(T0.getTime() + 7 * 86_400_000).toISOString());
    await run('2026-10-22T02:01:00.000Z');
    expect((await imagesOfRegistration(partial.registrationId))[0]?.deleted_at).not.toBeNull();
    expect((await imagesOfRegistration(review.registrationId))[0]?.deleted_at).toBeNull();
    // Checked out 20/10 11:00 → due 27/10 11:00; no-show without a mark time → planned departure 20/10 12:00.
    await run('2026-10-27T05:01:00.000Z');
    for (const c of all) {
      const imgs = await imagesOfRegistration(c.registrationId);
      expect({
        case: c.status,
        reason: imgs[0]?.delete_reason,
        gone: !!imgs[0]?.deleted_at,
      }).toEqual({
        case: c.status,
        reason: 'unconfirmed',
        gone: true,
      });
    }
  });

  it('SEC BE-32 reopened: real cancel endpoint → deadline; real checkout endpoint → T02; an image added after checkout (needs_update) still gets deleted', async () => {
    // Cancel through POST …/actions/cancel (reservations → hook `transitioned` → onReservationVoided).
    const cancelled = await sentRegistration('Phan Văn Minh', '079300000011');
    const cancel = await staff(
      fa,
      tok('fd'),
      device,
      'POST',
      `${P(t)}/reservations/${cancelled.reservationId}/actions/cancel`,
      {
        json: { reasonCode: 'guest_changed_mind' },
        ifMatch: await reservationVersion(cancelled.reservationId),
      },
    );
    expect(cancel.statusCode, JSON.stringify(cancel.json())).toBe(200);
    expect(
      (await imagesOfRegistration(cancelled.registrationId))[0]?.delete_after?.toISOString(),
    ).toBe(new Date(T0.getTime() + 7 * 86_400_000).toISOString());
    expect(await stayEndedAt(cancelled.registrationId)).not.toBeNull();

    // Check-out through POST …/actions/check-out (frontdesk B18 → FD_REGISTRATION_PORT.onCheckedOut).
    const r = await scannedRegistration('Lâm Thị Ngọc', '079300000012', {
      arrival: '2026-10-14',
      departure: '2026-10-15',
    });
    expect(
      (await r.act('mark-sent', { portalReference: 'VN-3012', kind: 'vn_citizen_stay' })).json()
        .status,
    ).toBe('sent');
    expect((await r.act('mark-confirmed', {})).json().status).toBe('confirmed');
    await setStayStatus(db, t, r.reservationId, 'in_house', {
      actualCheckinAt: new Date('2026-10-14T08:00:00.000Z'),
    });
    const out = await staff(
      fa,
      tok('fd'),
      device,
      'POST',
      `${P(t)}/reservations/${r.reservationId}/actions/check-out`,
      { json: { checkoutTime: '09:00' }, ifMatch: await reservationVersion(r.reservationId) },
    );
    expect(out.statusCode, JSON.stringify(out.json())).toBe(200);
    const kept = await imagesOfRegistration(r.registrationId);
    // Consenting guest: T02 = checkout + 30 days (BR-610), set by the real checkout.
    expect(kept[0]?.deleted_at).toBeNull();
    expect(kept[0]?.delete_after).not.toBeNull();
    expect(kept[0]!.delete_after!.getTime() - T0.getTime()).toBe(30 * 86_400_000);

    // After the stay the desk adds a second person's document: K9 → needs_update, the new image has NO deadline…
    const late = await addDoc(
      r.registrationId,
      {
        ...an,
        fullNameOnDoc: 'Lâm Văn Phúc',
        docNumber: '079300000013',
        dateOfBirth: '1990-03-03',
      },
      1,
    );
    expect(late.statusCode).toBe(201);
    expect(late.json().status).toBe('needs_update');
    const before = await imagesOfRegistration(r.registrationId);
    expect(before.filter((i) => !i.deleted_at && !i.delete_after)).toHaveLength(1);
    // … until the next hourly J16: no consent → it goes at once (end of stay passed); the consenting one stays.
    await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RetentionService).run(tx, 'Asia/Ho_Chi_Minh', { force: true }),
    );
    const after = await imagesOfRegistration(r.registrationId);
    expect(after.filter((i) => !i.deleted_at)).toHaveLength(1);
    expect(after.filter((i) => !i.deleted_at && !i.delete_after)).toHaveLength(0);
    // Re-verification: a person without consent is deleted as `no_consent` (T01), not `retention` (T02).
    expect(after.filter((i) => i.deleted_at).map((i) => i.delete_reason)).toEqual(['no_consent']);
  });

  it('Re-verification Major a: a booking never closed after its departure – "Cần chú ý", then J16 deletes the images 7 days after the planned departure', async () => {
    const stuck: Array<{ reservationId: string; registrationId: string }> = [];
    for (const [status, docNumber] of [
      ['confirmed', '079400000001'],
      ['in_house', '079400000002'],
    ] as const) {
      const { reservationId } = await seedStay(db, t, ids, {
        adults: 1,
        arrival: '2026-10-15',
        departure: '2026-10-16',
      });
      const reg = await registrationOf(reservationId);
      expect((await addDoc(reg.id, { ...an, docNumber }, 1)).statusCode).toBe(201);
      if (status === 'in_house') {
        await setStayStatus(db, t, reservationId, 'in_house', {
          actualCheckinAt: new Date('2026-10-15T08:00:00.000Z'),
        });
      }
      stuck.push({ reservationId, registrationId: reg.id });
    }
    // 16/10 13:00 local – past the 12:00 departure: the desk is told (data_quality / registration_stay_not_closed).
    fa.clock.set(new Date('2026-10-16T06:00:00.000Z'));
    await db.withContext(t.ctx(), (tx) =>
      tx.query(`UPDATE user_session SET idle_expires_at = $1, expires_at = $1`, [
        new Date(fa.clock.now().getTime() + 3_600_000),
      ]),
    );
    const items = (await staff(fa, tok('fd'), device, 'GET', `${P(t)}/attention`)).json()
      .data as Array<{ kind: string; params?: { check?: string }; reservationIds?: string[] }>;
    const dq = items.find(
      (i) => i.kind === 'data_quality' && i.params?.check === 'registration_stay_not_closed',
    );
    for (const sItem of stuck) expect(dq?.reservationIds).toContain(sItem.reservationId);
    const retention = fa.app.get(RetentionService);
    const run = (iso: string) => {
      fa.clock.set(new Date(iso));
      return db.withContext(t.ctx(), (tx) =>
        retention.run(tx, 'Asia/Ho_Chi_Minh', { force: true }),
      );
    };
    // Departure + 6 days: still no deadline (the desk may still close the stay).
    await run('2026-10-22T05:01:00.000Z');
    for (const sItem of stuck) {
      expect((await imagesOfRegistration(sItem.registrationId))[0]?.delete_after).toBeNull();
    }
    // Departure + 7 days: treated as ended at the planned departure → deleted in the same run.
    await run('2026-10-23T05:01:00.000Z');
    for (const sItem of stuck) {
      const img = (await imagesOfRegistration(sItem.registrationId))[0];
      expect(img).toMatchObject({ delete_reason: 'unconfirmed' });
      expect(img?.deleted_at).not.toBeNull();
    }
  });

  it('Fix round 4: an OTA parent 01–03 extended by a child 03–20 is still in house – images NOT deleted on day 10; deleted 7 days after the effective departure', async () => {
    const parent = await seedStay(db, t, ids, {
      adults: 1,
      arrival: '2026-11-01',
      departure: '2026-11-03',
    });
    const reg = await registrationOf(parent.reservationId);
    expect((await addDoc(reg.id, { ...an, docNumber: '079400000009' }, 1)).statusCode).toBe(201);
    await setStayStatus(db, t, parent.reservationId, 'in_house', {
      actualCheckinAt: new Date('2026-11-01T08:00:00.000Z'),
    });
    // The extension (B13, BR-422): a child booking 03–20 in the same stay, in house.
    const child = await seedStay(db, t, ids, {
      adults: 1,
      arrival: '2026-11-03',
      departure: '2026-11-20',
      status: 'in_house',
    });
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE reservation SET parent_reservation_id = $2 WHERE id = $1', [
        child.reservationId,
        parent.reservationId,
      ]),
    );
    const retention = fa.app.get(RetentionService);
    const run = (iso: string) => {
      fa.clock.set(new Date(iso));
      return db.withContext(t.ctx(), (tx) =>
        retention.run(tx, 'Asia/Ho_Chi_Minh', { force: true }),
      );
    };
    // BR-605 is checked against the stay as lived: with the child, the departure is 20/11, so a visa valid
    // until 10/11 fails "visa valid through departure" (the parent alone ends 03/11).
    const visa = await addDoc(
      reg.id,
      {
        ...emma,
        docNumber: 'C88X00V02',
        visaKind: 'visa',
        visaNumber: 'V7654321',
        visaValidUntil: '2026-11-10',
        entryDate: '2026-10-10',
      },
      1,
    );
    expect(visa.statusCode, visa.body).toBe(201);
    const visaDoc = (
      visa.json().documents as Array<{
        docNumberLast4: string;
        checks: Array<{ code: string; result: string }>;
      }>
    ).find((d) => d.docNumberLast4 === '0V02');
    expect(visaDoc?.checks.find((c) => c.code === 'visa_valid_through_departure')?.result).toBe(
      'fail',
    );
    // Day 10 (parent's own departure + 7 days has passed): still in house through the child → nothing.
    await run('2026-11-10T06:00:00.000Z');
    for (const img of await imagesOfRegistration(reg.id)) {
      expect(img).toMatchObject({ delete_after: null, deleted_at: null });
    }
    const notClosed = await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RegistrationService).staysNotClosed(tx),
    );
    expect(notClosed.map((x) => x.reservationId)).not.toContain(parent.reservationId);
    // Never closed after the EFFECTIVE departure (20/11 12:00) + 7 days → deleted.
    await run('2026-11-27T05:01:00.000Z');
    const gone = await imagesOfRegistration(reg.id);
    expect(gone).toHaveLength(2);
    for (const img of gone) {
      expect(img).toMatchObject({ delete_reason: 'unconfirmed' });
      expect(img.deleted_at).not.toBeNull();
    }
  });

  it('Re-verification minor (K12): restoring a no-show withdraws the end-of-stay mark and the image deadlines', async () => {
    const r = await sentRegistration('Châu Văn Nam', '079400000003');
    await setStayStatus(db, t, r.reservationId, 'no_show');
    await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RegistrationPortService).onReservationVoided(tx, r.reservationId),
    );
    expect(await stayEndedAt(r.registrationId)).not.toBeNull();
    expect((await imagesOfRegistration(r.registrationId))[0]?.delete_after).not.toBeNull();
    await setStayStatus(db, t, r.reservationId, 'confirmed');
    await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RegistrationService).onReservationRestored(tx, r.reservationId),
    );
    expect(await stayEndedAt(r.registrationId)).toBeNull();
    const imgs = await imagesOfRegistration(r.registrationId);
    expect(imgs[0]).toMatchObject({ delete_after: null, deleted_at: null });
  });

  it('Re-verification Major b (A-38) → BUG-R2-083 / S4-39: removing a person never destroys a guest upload by position – the desk says which slot was theirs (422 REQUIRED without it), that slot goes at once', async () => {
    const { reservationId } = await seedStay(db, t, ids, { adults: 2 });
    const memberId = await db.withContext(t.ctx(), async (tx) => {
      const guestId = await seedGuestRow(db, t, { name: 'Trịnh Thị Oanh' });
      const id = randomUUID();
      await tx.query(
        `INSERT INTO reservation_guest (id, organization_id, property_id, reservation_id, guest_id, role,
           relationship, price_age_band, created_at)
         VALUES ($1, $2, $3, $4, $5, 'companion', 'friend', 'adult', $6)`,
        [id, t.organizationId, t.propertyIds[0], reservationId, guestId, T0],
      );
      return id;
    });
    await setStayStatus(db, t, reservationId, 'in_house', {
      actualCheckinAt: new Date('2026-10-15T01:30:00.000Z'),
    });
    // The guest uploaded documents for "person 1" and "person 2" through the link.
    const image = await normalizeImage(await sampleJpeg('#336699'), 'image');
    const regs = fa.app.get(RegistrationService);
    for (const person of [1, 2]) {
      await db.withContext(t.ctx(), (tx) =>
        regs.guestUpload(tx, reservationId, person, 'passport', [image], randomUUID()),
      );
    }
    const registrationId = (await registrationOf(reservationId)).id;
    const before = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ person_index: number; data_key_id: string; blob_key: string }>(
            `SELECT d.person_index, i.data_key_id, i.blob_key FROM guest_document d
               JOIN document_image i ON i.guest_document_id = d.id WHERE d.registration_id = $1
              ORDER BY d.person_index`,
            [registrationId],
          )
        ).rows,
    );
    expect(before.map((b) => b.person_index)).toEqual([1, 2]);
    const partyVersion = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ party_version: number }>(
            'SELECT party_version FROM reservation WHERE id = $1',
            [reservationId],
          )
        ).rows[0]!.party_version,
    );
    const remove = (choice?: string) =>
      staff(
        fa,
        tok('fd'),
        device,
        'DELETE',
        `${P(t)}/reservations/${reservationId}/party/${memberId}${choice ? `?guestUploadPersonIndex=${choice}` : ''}`,
        { ifMatch: partyVersion },
      );
    // 0.3.7 (S4-39): an open guest-link slot exists and the person has no linked document → the slot answer
    // is required (numbers only in the Problem).
    const missing = await remove();
    expect(missing.statusCode).toBe(422);
    expect(missing.json()).toMatchObject({
      errors: [{ field: 'guestUploadPersonIndex', code: 'REQUIRED' }],
      personIndexes: [2],
    });
    const removed = await remove('2');
    expect(removed.statusCode, removed.body).toBe(204);
    await fa.app.get(EncryptedBlobService).sweepAfterCommit(t.ctx());
    const state = () =>
      db.withContext(
        t.ctx(),
        async (tx) =>
          (
            await tx.query<{
              person_index: number;
              removed: boolean;
              deleted: boolean;
              destroyed: boolean;
              delete_after: Date | null;
            }>(
              `SELECT d.person_index, d.removed_at IS NOT NULL AS removed, i.deleted_at IS NOT NULL AS deleted,
                    k.destroyed_at IS NOT NULL AS destroyed, i.delete_after
               FROM guest_document d JOIN document_image i ON i.guest_document_id = d.id
               JOIN data_key k ON k.id = i.data_key_id
              WHERE d.registration_id = $1 ORDER BY d.person_index`,
              [registrationId],
            )
          ).rows,
      );
    // The desk said "Khách 2" was the removed person's: destroyed at once (DEK, file); "Khách 1" untouched.
    expect(await state()).toEqual([
      { person_index: 1, removed: false, deleted: false, destroyed: false, delete_after: null },
      expect.objectContaining({ person_index: 2, removed: true, deleted: true, destroyed: true }),
    ]);
    const store = fa.app.get<BlobStore>(BLOB_STORE);
    // The head count of the declaration follows the booking (the in-house person left: 2 → 1).
    const reg = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ required_count: number }>(
            'SELECT required_count FROM registration WHERE id = $1',
            [registrationId],
          )
        ).rows[0]!.required_count,
    );
    expect(reg).toBe(1);
    expect(await store.get(before[1]!.blob_key)).toBeNull();
    expect(await store.get(before[0]!.blob_key)).not.toBeNull();
  });
});
