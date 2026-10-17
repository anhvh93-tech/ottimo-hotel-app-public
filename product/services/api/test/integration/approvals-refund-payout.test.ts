/**
 * BE-A fix round 9 (UXR #4, QC-S3-08; ĐK-S3-9): the refund pay-out queue in listApprovalRequests.
 * KB8 on the real feature app + PostgreSQL: FD cancels a confirmed booking whose deposit is 100 % refundable
 * (B10 creates the `refund` request, requested by FD) → MGR approves → the front-desk lead LISTS it and pays it
 * out in cash (BR-522 a, rbac A47a – FD+, payer ≠ requester). Transfer refund (BR-522 b, A47, SEC-37 / rbac
 * note 39): FDL sees it (masked destination) but only MGR/OWN pay it, and never the MGR who approved it.
 * Fake clock T0 = Thu 15/10/2026 09:00 (VN); fake data only.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import {
  Client,
  type FeatureApp,
  P,
  T0,
  TEST_PASSWORD,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import { type BookingIds, seedBooking, seedGuestRow } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  mgr2: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
  fd2: ['front_desk'],
  hk: ['housekeeping'],
  sal: ['sales_staff'],
};

interface ListedApproval {
  id: string;
  type: string;
  status: string;
  amountVnd: number;
  refundedVnd?: number;
  refundDestination?: { method: string; bankBin?: string; accountNoLast4?: string };
}

describe.skipIf(!HAS_DB)('approvals – refund pay-out queue for the desk (UXR #4)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    // Receipt images of BE-C's files module stay in memory (no blob written to disk).
    process.env.BLOBSTORE_PROVIDER = 'memory';
    db = appDatabase(10);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Hoàn Tiền' });
    for (const u of ['own', 'mgr', 'mgr2', 'fdl', 'fd', 'fd2']) await setPassword(db, t, u);
    fa = await startFeatureApp(db);
    for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const url = (path = '') => `${P(t)}${path}`;
  const DEPOSIT = 1_600_000;

  /**
   * KB8: FD books a direct 7-night stay with a cash deposit, then cancels it far ahead (BR-309 → 100 %
   * refundable); B10 creates the refund request in the same transaction, requested by FD.
   */
  async function cancelledWithRefund(arrivalDate: string, departureDate: string) {
    const created = await c.fd!.send('POST', url('/reservations'), {
      roomId: ids.rooms['202'],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      arrivalDate,
      departureDate,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: DEPOSIT },
    });
    expect(created.statusCode, created.body).toBe(201);
    const r = created.json();
    expect(r.status).toBe('confirmed');
    const cancel = await c.fd!.send(
      'POST',
      url(`/reservations/${r.id}/actions/cancel`),
      { reasonCode: 'found_other', note: 'Khách báo qua Zalo' },
      { 'if-match': `"${r.version}"` },
    );
    expect(cancel.statusCode, cancel.body).toBe(200);
    expect(cancel.json().cancellation).toMatchObject({
      refundableVnd: DEPOSIT,
      retainedVnd: 0,
    });
    const approvalId = cancel.json().cancellation.refundApprovalRequestId as string;
    expect(approvalId).toEqual(expect.any(String));
    return { reservationId: r.id as string, approvalId };
  }

  const destination = async (who: string, approvalId: string, body: Record<string, unknown>) =>
    new Client(fa, t.users[who]!.sessionToken, await t.deviceToken()).send(
      'PUT',
      url(`/approval-requests/${approvalId}/refund-destination`),
      body,
    );
  const approve = (who: string, approvalId: string) =>
    c[who]!.send('POST', url(`/approval-requests/${approvalId}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
  const listed = async (who: string, query = ''): Promise<ListedApproval[]> => {
    const res = await c[who]!.get(url(`/approval-requests${query}`));
    expect(res.statusCode, res.body).toBe(200);
    return res.json().data as ListedApproval[];
  };
  const sees = async (who: string, approvalId: string, query = '') =>
    (await listed(who, query)).find((a) => a.id === approvalId);
  /** Signed receipt / transfer proof uploaded by the payer (AttachmentService, memory blob store). */
  const proof = (who: string, reservationId: string) =>
    db.withContext({ ...t.ctx(), userId: t.users[who]!.id, actorType: 'user' }, async (tx) => {
      const out = await fa.app
        .get(AttachmentService)
        .upload(
          tx,
          { userId: t.users[who]!.id, roles: t.users[who]!.roles },
          { purpose: 'refund_proof', reservationId },
          { data: Buffer.from('fake-jpeg-bytes'), mime: 'image/jpeg', width: 1, height: 1 },
        );
      return out.id;
    });
  const payOut = async (
    who: string,
    action: 'execute-cash-refund' | 'execute-refund',
    approvalId: string,
    reservationId: string,
    amountVnd: number,
    extra: Record<string, unknown> = {},
  ) =>
    c[who]!.send('POST', url(`/approval-requests/${approvalId}/actions/${action}`), {
      amountVnd,
      paidAt: T0.toISOString(),
      attachmentId: await proof(who, reservationId),
      ...extra,
    });

  it('KB8 cash: FD cancels → MGR approves → FDL lists the approved refund and pays it out (partly, then the rest)', async () => {
    const { reservationId, approvalId } = await cancelledWithRefund('2026-11-09', '2026-11-16');
    const dest = await destination('fd', approvalId, { method: 'cash' });
    expect(dest.statusCode, dest.body).toBe(200);

    // Pending: decided by MGR/OWN – not in the FD/FDL queue of somebody else (S23 inbox unchanged).
    expect(await sees('fdl', approvalId)).toBeUndefined();
    expect(await sees('fd2', approvalId)).toBeUndefined();
    expect(await sees('fd', approvalId)).toMatchObject({ status: 'pending' }); // own request

    const ok = await approve('mgr', approvalId);
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json().status).toBe('approved');

    // The fix: every desk role that may pay it (A47a) sees it, with or without the status filter.
    for (const who of ['fdl', 'fd2', 'fd', 'mgr', 'own']) {
      expect(await sees(who, approvalId), who).toMatchObject({
        type: 'refund',
        status: 'approved',
        amountVnd: DEPOSIT,
        refundedVnd: 0,
        refundDestination: { method: 'cash' },
      });
    }
    expect(await sees('fdl', approvalId, '?status=approved')).toBeDefined();
    // Roles without A47a keep their own scope.
    expect(await sees('hk', approvalId)).toBeUndefined();
    expect(await sees('sal', approvalId)).toBeUndefined();

    // The requester never pays her own refund (BR-522 a) – the lead does.
    const self = await payOut('fd', 'execute-cash-refund', approvalId, reservationId, DEPOSIT);
    expect(self.statusCode, self.body).toBe(403);
    expect(self.json().code).toBe('SELF_REFUND_FORBIDDEN');

    const part = await payOut('fdl', 'execute-cash-refund', approvalId, reservationId, 600_000);
    expect(part.statusCode, part.body).toBe(201);
    expect(part.json()).toMatchObject({
      type: 'refund',
      method: 'cash',
      amountVnd: -600_000,
      approvalRequestId: approvalId,
    });
    // Still waiting for the rest → still in the lead's queue.
    expect(await sees('fdl', approvalId)).toMatchObject({ refundedVnd: 600_000 });

    const rest = await payOut(
      'fdl',
      'execute-cash-refund',
      approvalId,
      reservationId,
      DEPOSIT - 600_000,
    );
    expect(rest.statusCode, rest.body).toBe(201);
    // Fully paid → out of the desk queue; MGR/OWN still see it (all) with the paid amount.
    expect(await sees('fdl', approvalId)).toBeUndefined();
    expect(await sees('fd2', approvalId)).toBeUndefined();
    expect(await sees('mgr', approvalId)).toMatchObject({ refundedVnd: DEPOSIT });
    expect(await sees('fd', approvalId)).toMatchObject({ refundedVnd: DEPOSIT }); // own request
  });

  it('transfer (BR-522 b, A47, SEC-37): FDL sees the approved refund masked but cannot pay it; the approving MGR cannot either; another MGR pays', async () => {
    const { reservationId, approvalId } = await cancelledWithRefund('2026-11-23', '2026-11-30');
    const dest = await destination('fd', approvalId, {
      method: 'bank_transfer',
      bankBin: '970436',
      accountNo: '0071000123457',
      accountHolder: 'KHACH HOAN TIEN',
    });
    expect(dest.statusCode, dest.body).toBe(200);
    expect((await approve('mgr', approvalId)).statusCode).toBe(200);

    const res = await c.fdl!.get(url('/approval-requests'));
    expect(res.body).not.toContain('0071000123457');
    const row = (res.json().data as ListedApproval[]).find((a) => a.id === approvalId);
    expect(row).toMatchObject({
      status: 'approved',
      refundedVnd: 0,
      refundDestination: { method: 'bank_transfer', bankBin: '970436', accountNoLast4: '3457' },
    });

    // FDL: a transfer is MGR/OWN only (A47 role gate); the cash operation does not take a transfer.
    const fdlTransfer = await payOut('fdl', 'execute-refund', approvalId, reservationId, DEPOSIT, {
      bankReference: 'FT26290001',
    });
    expect(fdlTransfer.statusCode, fdlTransfer.body).toBe(403);
    const fdlCash = await payOut('fdl', 'execute-cash-refund', approvalId, reservationId, DEPOSIT);
    expect(fdlCash.statusCode, fdlCash.body).toBe(409);
    expect(fdlCash.json().code).toBe('INVALID_TRANSITION');

    // Three-person rule: requester / destination FD, approver MGR → the payer is a third person.
    const approverPays = await payOut('mgr', 'execute-refund', approvalId, reservationId, DEPOSIT, {
      bankReference: 'FT26290001',
    });
    expect(approverPays.statusCode, approverPays.body).toBe(403);
    expect(approverPays.json().code).toBe('SELF_REFUND_FORBIDDEN');
    const paid = await payOut('mgr2', 'execute-refund', approvalId, reservationId, DEPOSIT, {
      bankReference: 'FT26290001',
    });
    expect(paid.statusCode, paid.body).toBe(201);
    expect(paid.json()).toMatchObject({
      type: 'refund',
      method: 'bank_transfer',
      amountVnd: -DEPOSIT,
    });
    expect(await sees('fdl', approvalId)).toBeUndefined();
  });
});
