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
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import {
  ATTACHMENT_USAGE,
  type AttachmentUsage,
} from '../../src/modules/payments/public/attachment-usage';
import { ProblemError } from '../../src/shared/problem';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { sampleJpeg, seedStay, staff } from '../helpers/registration-fixture';
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
    expect((await upload('mt', 'meter')).statusCode).toBe(201);
  });

  it('C1/C2: a .jpg containing HTML → 422; stored blob is ciphertext, file 0600 in a 0700 directory', async () => {
    const html = await upload(
      'fd',
      'work_order',
      undefined,
      Buffer.from('<html><script>x</script></html>'),
    );
    expect(html.json()).toMatchObject({
      code: 'FILE_REJECTED',
      errors: [{ field: 'file', code: 'FILE_TYPE' }],
    });
    const id = (await upload('fd', 'work_order')).json().id;
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
    // deposit_receipt_retention_days = 90 (catalogue default) → purge after 2027-01-14 03:00 UTC.
    const before = await db.withContext(t.ctx(), (tx) =>
      svc.purgeDue(tx, new Date('2027-01-14T02:59:00.000Z'), 'Asia/Ho_Chi_Minh'),
    );
    expect(before).toBe(0);
    const after = await db.withContext(t.ctx(), (tx) =>
      svc.purgeDue(tx, new Date('2027-01-14T03:01:00.000Z'), 'Asia/Ho_Chi_Minh'),
    );
    expect(after).toBe(1);
    expect((await staff(fa, tok('fd'), null, 'GET', `${P(t)}/attachments/${id}`)).statusCode).toBe(
      404,
    );
    expect(T0).toBeInstanceOf(Date);
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
    expect((await upload('fd', 'work_order')).statusCode).toBe(429);
  });
});
