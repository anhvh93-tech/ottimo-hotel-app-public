/**
 * v1.0.4 P4-12 (FB-R4-DOM-BA-025-02; ARC plan v1.0.4 6.3; SEC-on-plan-v1.0.4 1.2 point 7): a `superseded` replacement
 * refund request keeps the destination of the requests it replaces.
 * Scenario: settled stay, the desk records extra cash after check-out → refund requests (one per receipt); a late
 * charge lowers the overpayment → refundPlan closes them `superseded` and asks ONE request of what is left.
 * (a) one request with a destination → the replacement has it (decrypts to the same), the old one has no envelope and
 *     its DEK is destroyed; c3_access_log: `create` on the new, `purge` on the old, no `view`;
 * (b) two different destinations → nothing carried; same account entered by two people → nothing carried;
 * (c) one with, one without → carried; the same account with the holder typed differently (case, spaces) → carried;
 * (d) whoever entered the destination does not approve the replacement (403 + CHECK 0031/0042);
 * (e) a destination that cannot be decrypted → the whole request fails, both requests as before;
 * (f) audit, c3_access_log, outbox, staff_notification and the error answer never hold the test account / holder
 *     (replaces `privacy-log-check.sh` – SEC-on-v104-be-d 1.4);
 * + another booking → nothing carried.
 * Fake clock, FAKE data only (bank BIN 970436, account 8899001122 / 7766554433 – not real accounts).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RefundsService } from '../../src/modules/payments/internal/refunds.service';
import {
  REFUND_ACCOUNT_CIPHER,
  type RefundAccountCipher,
  refundAccountAad,
} from '../../src/modules/payments/public/refund-account-cipher';
import { TEST_PASSWORD } from '../helpers/feature-app';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, type Stay, startFixture } from './s438-r8/fixture';

const BIN = '970436';
const ACCOUNT_X = '8899001122';
const ACCOUNT_Y = '7766554433';
const HOLDER = 'Nguyen Van Thu';
const bank = (accountNo: string, accountHolder = HOLDER) => ({
  method: 'bank_transfer',
  bankBin: BIN,
  accountNo,
  accountHolder,
});

describe.skipIf(!HAS_DB)('P4-12 – a replacement refund request keeps the destination', () => {
  let x: Fx;
  beforeAll(async () => {
    x = await startFixture();
    // The MGR and the FDL enter destinations from the same trusted desk device as the FD.
    x.c.mgr!.deviceToken = x.c.fd!.deviceToken;
    x.c.lead!.deviceToken = x.c.fd!.deviceToken;
  });
  afterAll(async () => {
    await x?.close();
  });

  const refunds = (s: { id: string }) =>
    x.q(
      `SELECT id, amount_vnd::int AS amount, status, auto_cancel_reason, version, refund_method, refund_bank_bin,
              refund_account_last4, refund_account_enc, refund_account_key_id, refund_destination_set_by,
              refund_destination_set_at
         FROM approval_request WHERE type = 'refund' AND target_id = $1 ORDER BY requested_at, id`,
      [s.id],
    );
  const setDest = (id: string, body: Record<string, unknown>, who = 'fd') =>
    x.c[who]!.send('PUT', x.url(`/approval-requests/${id}/refund-destination`), body);
  const approve = async (id: string, who: string) => {
    const [{ version }] = await x.q('SELECT version FROM approval_request WHERE id = $1', [id]);
    return x.c[who]!.send('POST', x.url(`/approval-requests/${id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
      expectedVersion: Number(version),
    });
  };
  const cipher = () => x.fa.app.get<RefundAccountCipher>(REFUND_ACCOUNT_CIPHER, { strict: false });
  const decrypt = (row: any) =>
    x.db.withContext(x.t.ctx(), async (tx) =>
      JSON.parse(
        await cipher().decrypt(tx, {
          dekId: row.refund_account_key_id,
          ciphertext: row.refund_account_enc,
          aad: refundAccountAad(row.id),
        }),
      ),
    );
  const lateChargeRaw = (s: Stay, amountVnd: number) =>
    x.c.fd!.send('POST', x.url(`/folios/${s.folioId}/lines`), {
      category: 'fnb',
      description: 'Phát sinh sau trả phòng',
      quantity: 1,
      unitPriceVnd: amountVnd,
      serviceDate: s.departure,
    });

  /** A settled stay with one refund request per extra cash receipt (each by the FD who records it). */
  const stayWithRequests = async (...amounts: number[]) => {
    const s = await x.checkedOutStay();
    for (const amountVnd of amounts) {
      const r = await x.pay(s.folioId, {
        type: 'charge',
        method: 'cash',
        amountVnd,
        note: 'Khách trả thêm sau trả phòng',
      });
      expect(r.statusCode, r.body).toBe(201);
    }
    const rows = await refunds(s);
    expect(rows.map((r: any) => [r.amount, r.status])).toEqual(amounts.map((a) => [a, 'pending']));
    return { s, rows };
  };

  it('(a) one request with a destination → the replacement has it; the old envelope and DEK are gone; c3 log create + purge, no view', async () => {
    const { s, rows } = await stayWithRequests(500_000);
    const [a] = rows;
    expect((await setDest(a.id, bank(ACCOUNT_X))).statusCode).toBe(200);
    const [before] = await refunds(s);
    await x.lateCharge(s, 200_000, s.departure);
    const after = await refunds(s);
    expect(after).toHaveLength(2);
    const [old, neu] = after;
    expect(old).toMatchObject({
      id: a.id,
      status: 'cancelled',
      auto_cancel_reason: 'superseded',
      refund_account_enc: null,
    });
    expect(neu).toMatchObject({
      amount: 300_000,
      status: 'pending',
      version: 1,
      refund_method: 'bank_transfer',
      refund_bank_bin: BIN,
      refund_account_last4: ACCOUNT_X.slice(-4),
      refund_destination_set_by: before.refund_destination_set_by,
    });
    expect(new Date(neu.refund_destination_set_at).getTime()).toBe(
      new Date(before.refund_destination_set_at).getTime(),
    );
    expect(neu.refund_account_key_id).not.toBe(before.refund_account_key_id);
    expect(await decrypt(neu)).toEqual({ accountNo: ACCOUNT_X, accountHolder: HOLDER });
    // The old DEK is destroyed: the old envelope (kept by the test) no longer opens.
    await expect(decrypt({ ...before })).rejects.toThrow();
    const c3 = await x.q(
      `SELECT subject_id, action FROM c3_access_log WHERE subject_type = 'refund_account'
          AND subject_id IN ($1, $2) ORDER BY id`,
      [a.id, neu.id],
    );
    expect(c3).toEqual(
      expect.arrayContaining([
        { subject_id: a.id, action: 'create' },
        { subject_id: a.id, action: 'purge' },
        { subject_id: neu.id, action: 'create' },
      ]),
    );
    expect(c3.filter((r: any) => r.action === 'view')).toEqual([]);
    const audit = await x.q(
      `SELECT after FROM audit_event WHERE action = 'refund.destination_carried' AND entity_id = $1`,
      [neu.id],
    );
    expect(audit).toEqual([{ after: { fromApprovalIds: [a.id], toApprovalId: neu.id } }]);
  }, 240_000);

  it('(b) two different destinations → the replacement has none; the same account entered by two people → none', async () => {
    const one = await stayWithRequests(500_000, 300_000);
    expect((await setDest(one.rows[0].id, bank(ACCOUNT_X))).statusCode).toBe(200);
    expect((await setDest(one.rows[1].id, bank(ACCOUNT_Y))).statusCode).toBe(200);
    await x.lateCharge(one.s, 200_000, one.s.departure);
    const r1 = await refunds(one.s);
    expect(r1.map((r: any) => r.status)).toEqual(['cancelled', 'cancelled', 'pending']);
    expect(r1[2]).toMatchObject({
      amount: 600_000,
      refund_method: null,
      refund_account_enc: null,
      refund_destination_set_by: null,
    });

    const two = await stayWithRequests(500_000, 300_000);
    expect((await setDest(two.rows[0].id, bank(ACCOUNT_X))).statusCode).toBe(200);
    expect((await setDest(two.rows[1].id, bank(ACCOUNT_X), 'lead')).statusCode).toBe(200);
    await x.lateCharge(two.s, 200_000, two.s.departure);
    const r2 = await refunds(two.s);
    expect(r2[2]).toMatchObject({ status: 'pending', refund_method: null });
  }, 240_000);

  it('(c) one with, one without → carried; the same account with the holder typed differently → carried', async () => {
    const one = await stayWithRequests(500_000, 300_000);
    expect((await setDest(one.rows[1].id, bank(ACCOUNT_X))).statusCode).toBe(200);
    await x.lateCharge(one.s, 200_000, one.s.departure);
    const r1 = await refunds(one.s);
    expect(r1[2]).toMatchObject({
      status: 'pending',
      amount: 600_000,
      refund_method: 'bank_transfer',
    });
    expect(await decrypt(r1[2])).toEqual({ accountNo: ACCOUNT_X, accountHolder: HOLDER });

    const two = await stayWithRequests(500_000, 300_000);
    expect((await setDest(two.rows[0].id, bank(ACCOUNT_X))).statusCode).toBe(200);
    expect(
      (
        await setDest(
          two.rows[1].id,
          bank(ACCOUNT_X, `  ${HOLDER.toUpperCase().replace(' ', '  ')} `),
        )
      ).statusCode,
    ).toBe(200);
    await x.lateCharge(two.s, 200_000, two.s.departure);
    const r2 = await refunds(two.s);
    expect(r2[2]).toMatchObject({ status: 'pending', refund_method: 'bank_transfer' });

    // A cash destination is carried too (nothing to seal).
    const three = await stayWithRequests(500_000);
    expect((await setDest(three.rows[0].id, { method: 'cash' })).statusCode).toBe(200);
    await x.lateCharge(three.s, 200_000, three.s.departure);
    const r3 = await refunds(three.s);
    expect(r3[1]).toMatchObject({
      status: 'pending',
      refund_method: 'cash',
      refund_account_enc: null,
      refund_account_key_id: null,
    });
  }, 300_000);

  it('(d) the MGR who entered the destination does not approve the replacement (403 + CHECK); another MGR does', async () => {
    const { s, rows } = await stayWithRequests(500_000);
    expect((await setDest(rows[0].id, bank(ACCOUNT_X), 'mgr')).statusCode).toBe(200);
    await x.lateCharge(s, 200_000, s.departure);
    const neu = (await refunds(s))[1];
    expect(neu.refund_destination_set_by).toBe(x.t.users.mgr!.id);
    const self = await approve(neu.id, 'mgr');
    expect(self.statusCode, self.body).toBe(403);
    expect(self.json().code).toBe('SELF_APPROVAL_FORBIDDEN');
    // The database refuses it as well (CHECK approver_id <> refund_destination_set_by – 0031/0042).
    await expect(
      x.q(
        `UPDATE approval_request SET approver_id = $2, approver_role_snapshot = 'manager' WHERE id = $1`,
        [neu.id, x.t.users.mgr!.id],
      ),
    ).rejects.toThrow(/check constraint/i);
    const other = await approve(neu.id, 'mgr2');
    expect(other.statusCode, other.body).toBe(200);
  }, 240_000);

  it('(e) a destination that cannot be decrypted → the late charge fails as a whole; both requests as before', async () => {
    const { s, rows } = await stayWithRequests(500_000, 300_000);
    expect((await setDest(rows[0].id, bank(ACCOUNT_X))).statusCode).toBe(200);
    // Simulated: the envelope is damaged (AEAD tag no longer matches).
    await x.q(
      `UPDATE approval_request SET refund_account_enc = decode('00112233445566778899aabbccddeeff00', 'hex')
        WHERE id = $1`,
      [rows[0].id],
    );
    const before = await refunds(s);
    const linesBefore = ((await x.folio(s.folioId)).lines as any[]).length;
    // Everything the process prints while it fails (Nest logger, console) – checked for the account below (f).
    const printed: string[] = [];
    const out = process.stdout.write.bind(process.stdout);
    const err = process.stderr.write.bind(process.stderr);
    process.stdout.write = ((chunk: any, ...rest: any[]) => {
      printed.push(String(chunk));
      return out(chunk, ...rest);
    }) as any;
    process.stderr.write = ((chunk: any, ...rest: any[]) => {
      printed.push(String(chunk));
      return err(chunk, ...rest);
    }) as any;
    let res;
    try {
      res = await lateChargeRaw(s, 200_000);
    } finally {
      process.stdout.write = out as any;
      process.stderr.write = err as any;
    }
    expect(res.statusCode).toBe(500);
    for (const secret of [ACCOUNT_X, HOLDER]) expect(printed.join('')).not.toContain(secret);
    expect(res.body).not.toContain(ACCOUNT_X);
    expect(res.body).not.toContain(HOLDER);
    expect(await refunds(s)).toEqual(before);
    expect(((await x.folio(s.folioId)).lines as any[]).length).toBe(linesBefore);
  }, 240_000);

  it('another booking → nothing carried (peek answers null for a target that is not the request’s booking)', async () => {
    const { s, rows } = await stayWithRequests(500_000);
    expect((await setDest(rows[0].id, bank(ACCOUNT_X))).statusCode).toBe(200);
    const refundsSvc = x.fa.app.get(RefundsService, { strict: false });
    const { other, same } = await x.db.withContext(x.t.ctx(), async (tx) => ({
      other: await refundsSvc.peekCarryableDestination(tx, [rows[0].id], uuidv7()),
      same: await refundsSvc.peekCarryableDestination(tx, [rows[0].id], s.id),
    }));
    expect(other).toBeNull();
    expect(same).not.toBeNull();
    // The handle holds no readable field (the account stays in the payments closure).
    expect(Object.keys(same as object)).toEqual(['apply']);
    expect(JSON.stringify(same)).not.toContain(ACCOUNT_X);
  }, 240_000);

  // Replaces `privacy-log-check.sh` of SEC-on-plan-v1.0.4 1.2 point 5 (SEC-on-v104-be-d 1.4, FB-R4-SEC-BE-BED-02): every
  // place the money paths write – audit, C3 access log, outbox, staff inbox (with its params) – plus case (e) for
  // the printed lines and the error answer.
  it('(f) audit, c3_access_log, outbox and staff_notification never hold the test accounts or the holder', async () => {
    const dump = await x.q(
      `SELECT (SELECT coalesce(string_agg(coalesce(before::text, '') || coalesce(after::text, '') ||
                coalesce(reason, ''), ' '), '') FROM audit_event) AS audit,
              (SELECT coalesce(string_agg(row_to_json(c)::text, ' '), '') FROM c3_access_log c) AS c3,
              (SELECT coalesce(string_agg(payload::text, ' '), '') FROM outbox_message) AS outbox,
              (SELECT coalesce(string_agg(row_to_json(n)::text, ' '), '') FROM staff_notification n) AS inbox,
              (SELECT count(*)::int FROM staff_notification) AS inbox_rows`,
    );
    // The scan is not empty: the closed requests told their requester / approvers (approval_cancelled …).
    expect(dump[0].inbox_rows).toBeGreaterThan(0);
    const text = JSON.stringify(dump);
    for (const secret of [ACCOUNT_X, ACCOUNT_Y, HOLDER, HOLDER.toUpperCase()]) {
      expect(text).not.toContain(secret);
    }
  });
});
