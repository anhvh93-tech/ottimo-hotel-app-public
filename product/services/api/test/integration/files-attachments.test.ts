/**
 * Operational attachments (OpenAPI 0.3.6 B-01; SEC s3-checklist I1–I7, C1, C2): role per purpose, scope on
 * read (404 outside), safe headers, encrypted blob (file 0600 in a 0700 directory, no clear bytes, no
 * EXIF), BE-B's AttachmentUsage port (assertUsable / bindTo), retention (SEC I5) through purgeDue.
 */
import { statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  BLOB_STORE,
  type BlobStore,
  LocalBlobStore,
} from '../../src/modules/files/internal/blob-store';
import { randomBytes, randomUUID } from 'node:crypto';
import { PassThrough } from 'node:stream';
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import { EncryptedBlobService } from '../../src/modules/files/public/encrypted-blob.service';
import {
  MAX_UPLOADS_IN_FLIGHT,
  MAX_UPLOADS_PER_SESSION,
  uploadsInFlight,
} from '../../src/modules/files/public/upload-gate';
import {
  ATTACHMENT_USAGE,
  type AttachmentUsage,
} from '../../src/modules/payments/public/attachment-usage';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { requestHash } from '../../src/shared/http/unit-of-work';
import { ProblemError } from '../../src/shared/problem';
import { type FeatureApp, P, cookieValue, startFeatureApp } from '../helpers/feature-app';
import { multipart, sampleJpeg, seedStay, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking } from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

describe.skipIf(!HAS_DB)('attachments (B-01, SEC I1–I7)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  const tok = (u: string) => t.users[u]!.sessionToken;

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, {
      users: {
        own: ['owner'],
        mgr: ['manager'],
        fd: ['front_desk'],
        fd2: ['front_desk'],
        hk: ['housekeeping'],
        mt: ['maintenance'],
        sal: ['sales_staff'],
        sal2: ['sales_staff'],
      },
    });
    ids = await seedBooking(db, t);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  async function upload(user: string, purpose: string, reservationId?: string, file?: Buffer) {
    return staff(fa, tok(user), null, 'POST', `${P(t)}/attachments`, {
      multipart: [
        { name: 'purpose', value: purpose },
        ...(reservationId ? [{ name: 'reservationId', value: reservationId }] : []),
        {
          name: 'file',
          value: file ?? (await sampleJpeg()),
          filename: 'receipt.jpg',
          contentType: 'image/jpeg',
        },
      ],
    });
  }

  async function ownBooking(user: string): Promise<string> {
    const { reservationId } = await seedStay(db, t, ids);
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE reservation SET created_by = $2 WHERE id = $1', [
        reservationId,
        t.users[user]!.id,
      ]),
    );
    return reservationId;
  }

  it('upload: role per purpose (403), reservation required, scope of SAL; read headers; 404 outside scope', async () => {
    const resv = await ownBooking('sal');
    expect((await upload('hk', 'deposit_receipt', resv)).statusCode).toBe(403);
    expect((await upload('sal', 'penalty_evidence', resv)).statusCode).toBe(403);
    expect((await upload('fd', 'deposit_receipt')).json().errors).toEqual([
      { field: 'reservationId', code: 'REQUIRED' },
    ]);
    expect((await upload('sal', 'id_document', resv)).json().errors).toEqual([
      { field: 'purpose', code: 'NOT_IN_LIST' },
    ]);
    // SAL on someone else's booking → 404
    const foreign = await ownBooking('sal2');
    expect((await upload('sal', 'deposit_receipt', foreign)).statusCode).toBe(404);
    const up = await upload('sal', 'deposit_receipt', resv);
    expect(up.statusCode).toBe(201);
    const id = up.json().id;
    expect(up.json()).toMatchObject({ purpose: 'deposit_receipt' });
    const get = (u: string) => staff(fa, tok(u), null, 'GET', `${P(t)}/attachments/${id}`);
    const mine = await get('sal');
    expect(mine.statusCode).toBe(200);
    expect(mine.headers).toMatchObject({
      'content-type': 'image/jpeg',
      'cache-control': 'private, no-store',
      'content-disposition': 'inline; filename="attachment"',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "sandbox; default-src 'none'",
      'cross-origin-resource-policy': 'same-origin',
    });
    expect((await sharp(mine.rawPayload).metadata()).exif).toBeUndefined();
    expect((await get('fd')).statusCode).toBe(200);
    expect((await get('sal2')).statusCode).toBe(404);
    expect((await get('hk')).statusCode).toBe(404);
    // The booking is no longer theirs → 404 (SEC I1).
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE reservation SET created_by = $2 WHERE id = $1', [resv, t.users.sal2!.id]),
    );
    expect((await get('sal')).statusCode).toBe(404);
  });

  it('refund_proof: FD may upload (cash refunds) and read only their own; OWN/MGR read all', async () => {
    const id = (await upload('fd', 'refund_proof')).json().id;
    const get = (u: string) => staff(fa, tok(u), null, 'GET', `${P(t)}/attachments/${id}`);
    expect((await get('fd')).statusCode).toBe(200);
    expect((await get('fd2')).statusCode).toBe(404);
    expect((await get('mgr')).statusCode).toBe(200);
    expect((await upload('hk', 'refund_proof')).statusCode).toBe(403);
    // SEC BE-38 (2): Sprint 4 purposes (no module binds them yet) are refused until it exists.
    for (const [u, purpose] of [
      ['mt', 'meter'],
      ['mt', 'work_order'],
      ['hk', 'inspection'],
    ] as const) {
      expect((await upload(u, purpose)).json()).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'purpose', code: 'NOT_IN_LIST' }],
      });
    }
  });

  it('C1/C2: a .jpg containing HTML → 422; stored blob is ciphertext, file 0600 in a 0700 directory', async () => {
    const html = await upload(
      'fd',
      'refund_proof',
      undefined,
      Buffer.from('<html><script>x</script></html>'),
    );
    expect(html.json()).toMatchObject({
      code: 'FILE_REJECTED',
      errors: [{ field: 'file', code: 'FILE_TYPE' }],
    });
    const id = (await upload('fd', 'refund_proof')).json().id;
    const store = fa.app.get<BlobStore>(BLOB_STORE);
    const key = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ blob_key: string }>('SELECT blob_key FROM attachment WHERE id = $1', [
            id,
          ])
        ).rows[0]!.blob_key,
    );
    const blob = (await store.get(key)) as Buffer;
    expect(blob.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))).toBe(false);
    if (store instanceof LocalBlobStore) {
      const file = join(store.root, key.slice(0, 2), key);
      expect(statSync(file).mode & 0o777).toBe(0o600);
      expect(statSync(join(store.root, key.slice(0, 2))).mode & 0o777).toBe(0o700);
    }
  });

  it("BE-B's AttachmentUsage: purpose/booking/one-use checks; bindTo + retention purge (SEC I5)", async () => {
    const resv = await ownBooking('sal');
    const id = (await upload('fd', 'deposit_receipt', resv)).json().id;
    const usage = fa.app.get<AttachmentUsage>(ATTACHMENT_USAGE);
    const fd = { userId: t.users.fd!.id, roles: ['front_desk'] };
    const check = (purpose: 'deposit_receipt' | 'refund_proof', reservationId: string | null) =>
      db.withContext(t.ctx(), (tx) =>
        usage.assertUsable(tx, fd, id, purpose, { reservationId, field: 'payment.attachmentId' }),
      );
    await expect(check('deposit_receipt', resv)).resolves.toBeUndefined();
    await expect(check('refund_proof', resv)).rejects.toThrow(ProblemError);
    const other = await ownBooking('sal');
    await expect(check('deposit_receipt', other)).rejects.toThrow(ProblemError);
    const paymentId = '0192a1b0-0000-7000-8000-000000000001';
    const reconciledAt = new Date('2026-10-16T03:00:00.000Z');
    const svc = fa.app.get(AttachmentService);
    await db.withContext(t.ctx(), (tx) =>
      svc.bindTo(tx, id, { type: 'payment', id: paymentId }, { retentionAnchorAt: reconciledAt }),
    );
    await expect(check('deposit_receipt', resv)).rejects.toThrow(ProblemError); // one image, one payment
    // A second binding of the same file is refused at the row level (ARC S3-27 (7)).
    await expect(
      db.withContext(t.ctx(), (tx) =>
        svc.bindTo(tx, id, { type: 'payment', id: paymentId }, { retentionAnchorAt: reconciledAt }),
      ),
    ).rejects.toThrow(ProblemError);
    const purgedAt = () =>
      db.withContext(
        t.ctx(),
        async (tx) =>
          (
            await tx.query<{ purged_at: Date | null }>(
              'SELECT purged_at FROM attachment WHERE id = $1',
              [id],
            )
          ).rows[0]!.purged_at,
      );
    // deposit_receipt_retention_days = 90 (catalogue default) → purge after 2027-01-14 03:00 UTC.
    const before = await db.withContext(t.ctx(), (tx) =>
      svc.purgeDue(tx, new Date('2027-01-14T02:59:00.000Z'), 'Asia/Ho_Chi_Minh'),
    );
    expect(before.failed).toBe(0);
    expect(await purgedAt()).toBeNull();
    const after = await db.withContext(t.ctx(), (tx) =>
      svc.purgeDue(tx, new Date('2027-01-14T03:01:00.000Z'), 'Asia/Ho_Chi_Minh'),
    );
    expect(after.purged).toBeGreaterThanOrEqual(1);
    expect(await purgedAt()).not.toBeNull();
    expect((await staff(fa, tok('fd'), null, 'GET', `${P(t)}/attachments/${id}`)).statusCode).toBe(
      404,
    );
    expect(T0).toBeInstanceOf(Date);
  });

  async function attachmentRow(id: string) {
    return db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{
            blob_key: string;
            data_key_id: string;
            purged_at: Date | null;
            purge_reason: string | null;
            destroyed_at: Date | null;
          }>(
            `SELECT a.blob_key, a.data_key_id, a.purged_at, a.purge_reason, k.destroyed_at
               FROM attachment a JOIN data_key k ON k.id = a.data_key_id WHERE a.id = $1`,
            [id],
          )
        ).rows[0]!,
    );
  }

  it('SEC BE-38: a file never bound to a record is purged on day 8 (DEK destroyed, file deleted after COMMIT)', async () => {
    const id = (await upload('fd', 'refund_proof')).json().id;
    const svc = fa.app.get(AttachmentService);
    const blobs = fa.app.get(EncryptedBlobService);
    const store = fa.app.get<BlobStore>(BLOB_STORE);
    const day = 86_400_000;
    // attachment_unbound_days = 7 (0053 default): T0 + 7 days − 1 min → kept.
    await db.withContext(t.ctx(), (tx) =>
      svc.purgeDue(tx, new Date(T0.getTime() + 7 * day - 60_000), 'Asia/Ho_Chi_Minh'),
    );
    expect((await attachmentRow(id)).purged_at).toBeNull();
    const out = await db.withContext(t.ctx(), (tx) =>
      svc.purgeDue(tx, new Date(T0.getTime() + 7 * day + 60_000), 'Asia/Ho_Chi_Minh'),
    );
    expect(out.failed).toBe(0);
    const row = await attachmentRow(id);
    expect(row).toMatchObject({ purge_reason: 'unbound' });
    expect(row.destroyed_at).not.toBeNull();
    // The file is still on disk until the queue is swept after COMMIT (ARC S3-17).
    expect(await store.get(row.blob_key)).not.toBeNull();
    await blobs.sweepAfterCommit(t.ctx());
    expect(await store.get(row.blob_key)).toBeNull();
    const journal = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ action: string; policy_key: string }>(
            `SELECT action, policy_key FROM purge_journal WHERE subject_id = $1 ORDER BY action`,
            [id],
          )
        ).rows,
    );
    expect(journal).toEqual([
      { action: 'delete_blob', policy_key: 'SEC-BE-38' },
      { action: 'destroy_dek', policy_key: 'SEC-BE-38' },
    ]);
  });

  it('SEC BE-46 / ARC S3-17: a purge rolled back keeps the file and the DEK', async () => {
    const id = (await upload('fd', 'refund_proof')).json().id;
    const row = await attachmentRow(id);
    const blobs = fa.app.get(EncryptedBlobService);
    const store = fa.app.get<BlobStore>(BLOB_STORE);
    await expect(
      db.withContext(t.ctx(), async (tx) => {
        await blobs.purge(
          tx,
          {
            blobKey: row.blob_key,
            dataKeyId: row.data_key_id,
            subjectType: 'attachment',
            subjectId: id,
          },
          'SEC-I5',
        );
        throw new Error('later step failed');
      }),
    ).rejects.toThrow('later step failed');
    await blobs.sweepAfterCommit(t.ctx());
    expect(await store.get(row.blob_key)).not.toBeNull();
    expect((await attachmentRow(id)).destroyed_at).toBeNull();
    expect((await staff(fa, tok('fd'), null, 'GET', `${P(t)}/attachments/${id}`)).statusCode).toBe(
      200,
    );
  });

  it('ARC S3-03 / SEC BE-47: multipart only on the 3 upload routes, only with a session cookie', async () => {
    const body = multipart([{ name: 'purpose', value: 'refund_proof' }]);
    const send = (url: string, cookie: string | null, method: 'POST' | 'PUT' = 'POST') =>
      fa.app.inject({
        method,
        url,
        headers: {
          'content-type': body.contentType,
          ...(cookie ? { cookie } : {}),
          'x-csrf-token': fa.sessions.csrfToken(sha256Hex(tok('fd'))),
          'idempotency-key': randomUUID(),
        },
        payload: body.body,
      });
    // Upload route without any session cookie → 401 before the body is read.
    const anon = await send(`${P(t)}/attachments`, null);
    expect(anon.statusCode).toBe(401);
    expect(anon.json()).toMatchObject({ code: 'UNAUTHENTICATED' });
    // Any other route: the body is refused unread (415 mapped to 422 VALIDATION_FAILED – no 415 in the table).
    const someId = '0192a1b0-0000-7000-8000-0000000000aa';
    for (const url of [
      `${P(t)}/reservations/${someId}/actions/check-in`,
      `${P(t)}/registrations/${someId}/consents`,
      '/v1/guest/online-checkin/complete',
    ]) {
      const r = await send(url, `ottimo_sid=${tok('fd')}`);
      expect(r.statusCode).toBe(422);
      expect(r.json()).toMatchObject({ code: 'VALIDATION_FAILED' });
    }
  });

  it('s3-blocker-verification: a well-formed FAKE session cookie → 401 before the body is read (staff and guest)', async () => {
    const fake = randomBytes(32).toString('base64url');
    for (const [url, cookie] of [
      [`${P(t)}/attachments`, `ottimo_sid=${fake}`],
      ['/v1/guest/online-checkin/documents', `ottimo_gsid=${fake}`],
    ] as const) {
      // A body that never ends: if the server waited for it, this request would hang.
      const stream = new PassThrough();
      stream.write(Buffer.alloc(64 * 1024, 1));
      const r = await fa.app.inject({
        method: 'POST',
        url,
        headers: {
          'content-type': 'multipart/form-data; boundary=xyz',
          'content-length': String(1024 * 1024),
          cookie,
        },
        payload: stream,
      });
      expect(r.statusCode).toBe(401);
      expect(r.json()).toMatchObject({ code: 'UNAUTHENTICATED' });
      stream.destroy();
    }
    expect(uploadsInFlight()).toBe(0);
  });

  it('s3-blocker-(re)verification: slots taken BEFORE the body – per session (429), per process (503); guest cookie never on a staff route', async () => {
    const body = multipart([
      { name: 'purpose', value: 'refund_proof' },
      { name: 'file', value: await sampleJpeg(), filename: 'r.jpg', contentType: 'image/jpeg' },
    ]);
    const half = Math.floor(body.body.length / 2);
    const upload = (user: string, ip: string, payload: PassThrough | Buffer) =>
      fa.app.inject({
        method: 'POST',
        url: `${P(t)}/attachments`,
        remoteAddress: ip,
        headers: {
          'content-type': body.contentType,
          'content-length': String(body.body.length),
          cookie: `ottimo_sid=${tok(user)}`,
          'x-csrf-token': fa.sessions.csrfToken(sha256Hex(tok(user))),
          'idempotency-key': randomUUID(),
        },
        payload,
      });
    const slow = (user: string, ip: string) => {
      const st = new PassThrough();
      st.write(body.body.subarray(0, half));
      return { st, res: upload(user, ip, st) };
    };
    const waitFor = async (n: number) => {
      for (let i = 0; i < 200 && uploadsInFlight() < n; i++) {
        await new Promise((r) => setTimeout(r, 10));
      }
      expect(uploadsInFlight()).toBe(n);
    };
    // One session holds at most MAX_UPLOADS_PER_SESSION slots: its third concurrent upload → 429.
    const held = [slow('fd', '10.0.0.1'), slow('fd', '10.0.0.1')];
    await waitFor(MAX_UPLOADS_PER_SESSION);
    const third = await upload('fd', '10.0.0.1', body.body);
    expect(third.statusCode).toBe(429);
    expect(third.headers['retry-after']).toBe('5');
    // Other sessions fill the process: the next upload anywhere → 503 at once, body unread.
    held.push(slow('fd2', '10.0.0.2'), slow('mgr', '10.0.0.3'));
    await waitFor(MAX_UPLOADS_IN_FLIGHT);
    const fifth = await upload('own', '10.0.0.4', body.body);
    expect(fifth.statusCode).toBe(503);
    expect(fifth.json()).toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    expect(fifth.headers['retry-after']).toBe('5');
    // The slow ones finish normally and give their slots back.
    for (const h of held) h.st.end(body.body.subarray(half));
    const done = await Promise.all(held.map((h) => h.res));
    expect(done.map((r) => r.statusCode)).toEqual([201, 201, 201, 201]);
    expect(uploadsInFlight()).toBe(0);
    expect((await upload('fd', '10.0.0.1', body.body)).statusCode).toBe(201);
    // A REAL guest session on a staff upload route → 401 before the body (route-bound session check).
    const { reservationId } = await seedStay(db, t, ids);
    const link = await staff(
      fa,
      tok('fd'),
      null,
      'POST',
      `${P(t)}/reservations/${reservationId}/guest-link`,
    );
    const token = new URL(link.json().url).pathname.slice(3);
    const opened = await fa.app.inject({
      method: 'POST',
      url: '/v1/guest/sessions',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ token }),
    });
    const gsid = cookieValue(opened, 'ottimo_gsid') as string;
    const asGuest = await fa.app.inject({
      method: 'POST',
      url: `${P(t)}/attachments`,
      headers: {
        'content-type': body.contentType,
        'content-length': String(body.body.length),
        cookie: `ottimo_gsid=${gsid}`,
      },
      payload: body.body,
    });
    expect(asGuest.statusCode).toBe(401);
    expect(uploadsInFlight()).toBe(0);
  });

  it('ARC S3-03: a binary body is never hashed for idempotency', () => {
    expect(() => requestHash('POST', '/x', Buffer.from('abc'))).toThrow(ProblemError);
    expect(() => requestHash('POST', '/x', new Uint8Array([1, 2]))).toThrow(ProblemError);
    expect(requestHash('POST', '/x', { a: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });

  it('SEC I7: 50 files per person per day → 429', async () => {
    await db.withContext(t.ctx(), async (tx) => {
      const { rows } = await tx.query<{ data_key_id: string; blob_key: string }>(
        `SELECT data_key_id, blob_key FROM attachment WHERE uploaded_by = $1 LIMIT 1`,
        [t.users.fd!.id],
      );
      const k = rows[0]!;
      for (let i = 0; i < 50; i++) {
        await tx.query(
          `INSERT INTO attachment (id, organization_id, property_id, purpose, blob_key, mime, size_bytes,
             ciphertext_sha256, data_key_id, uploaded_by, uploaded_by_role, uploaded_at)
           VALUES (gen_random_uuid(), $1, $2, 'work_order', $3, 'image/jpeg', 1, 'x', $4, $5, 'front_desk', $6)`,
          [t.organizationId, t.propertyIds[0], k.blob_key, k.data_key_id, t.users.fd!.id, T0],
        );
      }
    });
    expect((await upload('fd', 'refund_proof')).statusCode).toBe(429);
  });
});
