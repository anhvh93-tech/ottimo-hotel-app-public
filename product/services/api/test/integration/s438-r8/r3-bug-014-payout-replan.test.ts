/**
 * BUG-R3-014 (critic rerun M-2; contract 0.3.8 bổ sung 6, 13.3 points 1 + 3) – a refund pay-out lowers the credit like
 * any other change: in its transaction the folio's refunds are re-planned; with no credit left every approved request
 * with money left (the one just paid in part included) is closed `superseded` (audited, payments hook), so money that
 * arrives later gets its own request and routing (ADD3-01) instead of being paid out under an old approval.
 * Fake clock, FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AttachmentService } from '../../../src/modules/files/public/attachment.service';
import { TEST_PASSWORD } from '../../helpers/feature-app';
import { HAS_DB } from '../../helpers/tenant';
import { type Fx, type Stay, outcome, startFixture } from './fixture';

describe.skipIf(!HAS_DB)('BUG-R3-014 – a refund pay-out re-plans the open refunds', () => {
  let x: Fx;
  beforeAll(async () => {
    process.env.BLOBSTORE_PROVIDER = 'memory'; // refund proof attachments
    x = await startFixture();
  });
  afterAll(async () => {
    await x?.close();
  });

  const refunds = (s: { id: string }) =>
    x.q(
      `SELECT id, amount_vnd::int AS amount, refunded_vnd::int AS refunded, status, requested_by, required_role,
              refund_source, auto_cancel_reason, refund_account_enc IS NULL AS no_account
         FROM approval_request WHERE type = 'refund' AND target_id = $1 ORDER BY requested_at, id`,
      [s.id],
    );
  const decideRefund = async (id: string, verb: 'approve' | 'reject', who: string) => {
    const [{ version }] = await x.q('SELECT version FROM approval_request WHERE id = $1', [id]);
    return x.c[who]!.send('POST', x.url(`/approval-requests/${id}/actions/${verb}`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
      expectedVersion: Number(version),
    });
  };
  const proof = (who: string, reservationId: string) =>
    x.db.withContext(
      { ...x.t.ctx(), userId: x.t.users[who]!.id, actorType: 'user' } as any,
      async (tx) =>
        (
          await x.fa.app
            .get(AttachmentService)
            .upload(
              tx,
              { userId: x.t.users[who]!.id, roles: x.t.users[who]!.roles },
              { purpose: 'refund_proof', reservationId },
              { data: Buffer.from('fake-jpeg-bytes'), mime: 'image/jpeg', width: 1, height: 1 },
            )
        ).id,
    );
  /** Every receipt of the stay arrived in the bank (the credit is backed by settled money – DOM BE-14 b/c). */
  const reconcileAll = (s: Stay) =>
    x.q(
      `UPDATE payment SET reconciliation = 'reconciled', reconciled_at = now(), reconciled_by = $2,
              reconciled_by_role = 'manager', version = version + 1
        WHERE folio_id = $1 AND reconciliation = 'pending' AND amount_vnd > 0`,
      [s.folioId, x.t.users.mgr!.id],
    );
  const payCash = async (s: Stay, id: string, amountVnd: number, who = 'lead') =>
    x.c[who]!.send('POST', x.url(`/approval-requests/${id}/actions/execute-cash-refund`), {
      amountVnd,
      paidAt: new Date(x.fa.clock.now()).toISOString(),
      attachmentId: await proof(who, s.id),
    });

  /** A32 refund 300.000 approved (cash destination), then a late charge 100.000 → credit 200.000. */
  const approvedThenCharge = async () => {
    const s = await x.checkedOutStay({ big: 300_000 });
    expect(outcome(await x.adjust(s, s.bigLineId!, { voidLine: true })())).toMatch(/^201/);
    const [r] = await refunds(s);
    const dest = await x.c.fd!.send('PUT', x.url(`/approval-requests/${r.id}/refund-destination`), {
      method: 'cash',
    });
    expect(dest.statusCode, dest.body).toBe(200);
    expect((await decideRefund(r.id, 'approve', 'owner')).statusCode).toBe(200);
    await x.lateCharge(s, 100_000, s.departure);
    expect((await x.folio(s.folioId)).totals.creditVnd).toBe(200_000);
    expect((await refunds(s))[0]).toMatchObject({ id: r.id, status: 'approved' });
    await reconcileAll(s);
    return { s, r };
  };

  it('QA repro: approved 300.000, credit 200.000; paying 200.000 empties the credit → the 100.000 left is closed `superseded` (account purged)', async () => {
    const { s, r } = await approvedThenCharge();
    const p = await payCash(s, r.id, 200_000);
    expect(p.statusCode, p.body).toBe(201);
    expect((await x.folio(s.folioId)).totals.creditVnd).toBe(0);
    expect(await refunds(s)).toMatchObject([
      {
        id: r.id,
        refunded: 200_000,
        status: 'cancelled',
        auto_cancel_reason: 'superseded',
        no_account: true,
      },
    ]);
  }, 180_000);

  it('money arriving after the credit was emptied gets its OWN request (owner – the folio has an A32), never the old approval', async () => {
    const { s, r } = await approvedThenCharge();
    expect((await payCash(s, r.id, 200_000)).statusCode).toBe(201);
    const p = await x.pay(s.folioId, {
      type: 'charge',
      method: 'cash',
      amountVnd: 500_000,
      note: 'Khách chuyển thêm',
    });
    expect(p.statusCode, p.body).toBe(201);
    const all = await refunds(s);
    expect(all[0]).toMatchObject({ id: r.id, status: 'cancelled' });
    expect(all[1]).toMatchObject({
      amount: 500_000,
      status: 'pending',
      refund_source: 'other',
      required_role: 'owner',
    });
    // The old approval cannot pay any of it.
    const old = await payCash(s, r.id, 100_000);
    expect(old.statusCode, old.body).toBe(409);
  }, 180_000);

  it('a pay-out that leaves credit keeps the approved request open (pay-out still capped)', async () => {
    const { s, r } = await approvedThenCharge();
    const p = await payCash(s, r.id, 150_000);
    expect(p.statusCode, p.body).toBe(201);
    expect((await x.folio(s.folioId)).totals.creditVnd).toBe(50_000);
    expect(await refunds(s)).toMatchObject([{ id: r.id, status: 'approved', refunded: 150_000 }]);
    const over = await payCash(s, r.id, 100_000);
    expect(over.statusCode, over.body).toBe(422);
    expect(over.json().max).toBe(50_000);
  }, 180_000);
});
