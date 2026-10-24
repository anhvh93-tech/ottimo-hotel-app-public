/**
 * BUG-R3-014 (critic rerun M-2; contract 0.3.8 bổ sung 7, s1-contracts 13.4):
 * - BUG014-01, the K11-06 INVARIANT after every money change (pay-out, late charge, A32…): Σ (pending + what approved
 *   requests still have to pay) ≤ rawCreditVnd – above it, pending AND approved requests (newest first) are closed
 *   `superseded` and exactly what is left is asked again (source, requester, level kept); an A32 reduction then always
 *   lands as its own `a32` request – no old approval absorbs it;
 * - BUG014-02: whoever made an A32 reduction (below the owner) on the folio never pays out or sets the destination of
 *   its refunds – 403 SELF_REFUND_FORBIDDEN; the owner is never blocked.
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

  const setCash = (id: string, who = 'fd') =>
    x.c[who]!.send('PUT', x.url(`/approval-requests/${id}/refund-destination`), { method: 'cash' });
  /** A32 void of the paid F&B line 300.000 by the MGR → its refund, cash destination, approved by the OWNER. */
  const approvedA32 = async () => {
    const s = await x.checkedOutStay({ big: 300_000 });
    expect(outcome(await x.adjust(s, s.bigLineId!, { voidLine: true })())).toMatch(/^201/);
    const [r] = await refunds(s);
    expect((await setCash(r.id)).statusCode).toBe(200);
    expect((await decideRefund(r.id, 'approve', 'owner')).statusCode).toBe(200);
    await reconcileAll(s);
    return { s, r };
  };

  it('ARC 13.4 test 1: approved 300.000 (credit 300.000), late charge 200.000 → the approval superseded + 100.000 asked again; MGR A32 −150.000 → its own a32 request 150.000; the old approval pays nothing', async () => {
    const { s, r } = await approvedA32();
    await x.lateCharge(s, 200_000, s.departure);
    let all = await refunds(s);
    expect(all).toMatchObject([
      { id: r.id, status: 'cancelled', auto_cancel_reason: 'superseded', no_account: true },
      {
        amount: 100_000,
        status: 'pending',
        refund_source: 'a32',
        requested_by: x.t.users.mgr!.id,
        required_role: r.required_role,
      },
    ]);
    // MGR lowers a night by 150.000: all open requests fit in the credit, so the 150.000 is credit not requested yet.
    const night = (await x.liveLineIds(s, 'room'))[0] as any;
    const low = await x.adjust(s, night.id, { newUnitPriceVnd: night.amountVnd - 150_000 })();
    expect(outcome(low)).toMatch(/^201/);
    all = await refunds(s);
    expect(all[2]).toMatchObject({
      amount: 150_000,
      status: 'pending',
      refund_source: 'a32',
      requested_by: x.t.users.mgr!.id,
    });
    expect((await x.folio(s.folioId)).totals.creditVnd).toBe(250_000);
    // No old approval can pay any of it.
    const old = await payCash(s, r.id, 100_000);
    expect(old.statusCode, old.body).toBe(409);
  }, 180_000);

  it('a pay-out keeps the invariant: approved 300.000, paid 100.000 → 200.000 left = credit, kept; paying 250.000 → 422 max 200.000; paying the rest → nothing open', async () => {
    const { s, r } = await approvedA32();
    expect((await payCash(s, r.id, 100_000)).statusCode).toBe(201);
    expect(await refunds(s)).toMatchObject([{ id: r.id, status: 'approved', refunded: 100_000 }]);
    const over = await payCash(s, r.id, 250_000);
    expect(over.statusCode, over.body).toBe(422);
    expect(over.json().max).toBe(200_000);
    expect((await payCash(s, r.id, 200_000)).statusCode).toBe(201);
    expect((await x.folio(s.folioId)).totals.creditVnd).toBe(0);
    expect(await refunds(s)).toMatchObject([{ id: r.id, status: 'approved', refunded: 300_000 }]);
  }, 180_000);

  it('money arriving after the credit was emptied gets its OWN request (owner – the folio has an A32), never an old approval', async () => {
    const { s, r } = await approvedA32();
    expect((await payCash(s, r.id, 300_000)).statusCode).toBe(201);
    const p = await x.pay(s.folioId, {
      type: 'charge',
      method: 'cash',
      amountVnd: 500_000,
      note: 'Khách chuyển thêm',
    });
    expect(p.statusCode, p.body).toBe(201);
    const all = await refunds(s);
    expect(all[1]).toMatchObject({
      amount: 500_000,
      status: 'pending',
      refund_source: 'other',
      required_role: 'owner',
    });
  }, 180_000);

  it('BUG014-02: the A32 maker cannot set the destination nor pay out a refund of the folio (403); the desk sets it, the OWNER pays (201)', async () => {
    const s = await x.checkedOutStay({ big: 300_000 });
    expect(outcome(await x.adjust(s, s.bigLineId!, { voidLine: true })())).toMatch(/^201/);
    // A receipt above what is due → a desk-made request (not the MGR's own).
    const p = await x.pay(s.folioId, {
      type: 'charge',
      method: 'cash',
      amountVnd: 50_000,
      note: 'Khách đưa thừa',
    });
    expect(p.statusCode, p.body).toBe(201);
    const [, desk] = await refunds(s);
    expect(desk).toMatchObject({ amount: 50_000, requested_by: x.t.users.fd!.id });
    // On the trusted desk device (setRefundDestination needs one – the device check answers first otherwise).
    const mgrDevice = x.c.mgr!.deviceToken;
    x.c.mgr!.deviceToken = x.c.fd!.deviceToken;
    const dest = await setCash(desk.id, 'mgr');
    x.c.mgr!.deviceToken = mgrDevice;
    expect(dest.statusCode, dest.body).toBe(403);
    expect(dest.json().code).toBe('SELF_REFUND_FORBIDDEN');
    expect((await setCash(desk.id)).statusCode).toBe(200);
    expect((await decideRefund(desk.id, 'approve', 'owner')).statusCode).toBe(200);
    await reconcileAll(s);
    const mgrPays = await payCash(s, desk.id, 50_000, 'mgr');
    expect(mgrPays.statusCode, mgrPays.body).toBe(403);
    expect(mgrPays.json().code).toBe('SELF_REFUND_FORBIDDEN');
    const ownPays = await payCash(s, desk.id, 50_000, 'owner');
    expect(ownPays.statusCode, ownPays.body).toBe(201);
  }, 180_000);
});
