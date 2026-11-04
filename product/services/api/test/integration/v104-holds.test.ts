/**
 * v1.0.4 P4-10 `v104/be-holds` (BE-B) on PostgreSQL – the cases of rounds/round-03/qa/bug-list.md:
 * - BUG-R3-042 (P1): an overdue hold that received money is topped up and confirmed by FD+ (200, `confirmed`, check-in
 *   offered on the arrival day); a sale gets HOLD_EXPIRED; an unpaid overdue hold: `receivedAt` before the deadline →
 *   200, after → HOLD_EXPIRED, and B4 is not offered; MGR accepts the shortfall after the deadline (BR-303 (2));
 * - BUG-R3-041 (DOM A.5): J1 writes inbox rows (`staff_notification`) to the right people, once;
 * - ĐX-R3-QA-01 AC1–AC3: "Cần chú ý" hold_overdue (FD+, any arrival date) and hold_overdue_cap (MGR/OWN from 12:00);
 * - FB-R3-ARC-BEB-WA-04: in a process that loads ONLY the worker, J1 cancels an overdue hold carrying a FOC request
 *   still waiting (request auto-cancelled, its pending line rejected, creator told) instead of failing every tick.
 * - FB-R4-SEC-BE-HOLDS-01: past the deadline (J1 not run yet) a sale/CTV puts no money on the hold – recordPayment
 *   and confirmPaymentReceived → 409 HOLD_EXPIRED, nothing written, J1 then cancels; FD+ still records;
 * - FB-R4-SEC-BE-HOLDS-02: the audit row of an after-deadline `reservation.deposit_confirmed` carries
 *   afterDeadline/holdExpiredAt/paidBeforeVnd/unverifiedPaidVnd/via; a confirmation before the deadline does not.
 * Fake clock (FixedClock moved by the test – the api; a fixed `now` per worker run) and FAKE data only.
 */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JobRunner } from '../../src/jobs/job-runner';
import { HOLD_EXPIRY_JOB_KEY } from '../../src/jobs/reservation-jobs';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
import { HAS_DB } from '../helpers/tenant';
import { inWorkerProcess } from '../helpers/worker-process';
import { type Fx, startFixture } from './s438-r8/fixture';

type Item = { kind: string; reservationIds?: string[]; severity: string; params?: unknown };

describe.skipIf(!HAS_DB)(
  'v1.0.4 P4-10 – holds past their deadline (BUG-R3-042/041, ĐX-R3-QA-01, WA-04)',
  () => {
    let x: Fx;
    beforeAll(async () => {
      x = await startFixture();
    });
    afterAll(async () => {
      await x?.close();
    });

    const hold = async (
      room: string,
      who: 'fd' | 'sal' | 'ctv',
      arrival: string,
      departure: string,
    ) => {
      const svc = x.fa.app.get(ReservationsService);
      const role = { fd: 'front_desk', sal: 'sales_staff', ctv: 'collaborator' }[who];
      const user = x.t.users[who]!.id;
      return x.db.withContext({ ...x.t.ctx(), userId: user, actorType: 'user' }, async (tx) => {
        const ctx = await svc.context(tx, { userId: user, roles: [role] });
        return svc.createHold(tx, ctx, {
          roomId: x.ids.rooms[room]!,
          channelId: x.ids.channels.direct!,
          arrivalDate: arrival,
          departureDate: departure,
          adults: 2,
          children6to11: 0,
          childrenUnder6: 0,
          bookerGuestId: x.guest,
          holdHours: 24,
        });
      });
    };
    const deposit = (id: string, body: Record<string, unknown>, who = 'fd') =>
      x.act(id, 'confirm-deposit', body, who);
    const cash = (amountVnd: number, receivedAt?: string) => ({
      payment: {
        type: 'deposit',
        method: 'cash',
        amountVnd,
        ...(receivedAt ? { receivedAt } : {}),
      },
    });
    const actionsOf = async (id: string, who = 'fd') =>
      (
        (await x.c[who]!.get(x.url(`/reservations/${id}`))).json().allowedActions as Array<{
          action: string;
        }>
      ).map((a) => a.action);
    const j1 = () =>
      x.fa.app.get(JobRunner).runOnce(HOLD_EXPIRY_JOB_KEY, {
        propertyId: x.t.propertyIds[0]!,
        organizationId: x.t.organizationId,
        timezone: 'Asia/Ho_Chi_Minh',
      });
    const inbox = async (refId: string, kind: string) =>
      (
        await x.q(
          `SELECT user_id FROM staff_notification WHERE ref_id = $1 AND kind = $2 ORDER BY user_id`,
          [refId, kind],
        )
      ).map((r) => r.user_id as string);
    const users = (...who: string[]) => who.map((w) => x.t.users[w]!.id).sort();
    const attention = async (who: string) => {
      const res = await x.c[who]!.get(x.url('/attention'));
      expect(res.statusCode, res.body).toBe(200);
      return res.json().data as Item[];
    };

    // Shared timeline: holds made 01/11 10:00 (deadline 02/11 10:00), arrival 04/11.
    let paidSal: { id: string; code: string };
    let paidFd: { id: string };
    let unpaidEarly: { id: string };
    let unpaidLate: { id: string };
    let unpaidCtv: { id: string };

    it('setup: three holds with money received, three without; J1 keeps the paid ones', async () => {
      await x.at('2026-11-01T10:00:00+07:00');
      paidSal = await hold('101', 'sal', '2026-11-04', '2026-11-07');
      paidFd = await hold('102', 'fd', '2026-11-04', '2026-11-07');
      unpaidEarly = await hold('103', 'fd', '2026-11-04', '2026-11-06');
      unpaidLate = await hold('201', 'fd', '2026-11-04', '2026-11-06');
      unpaidCtv = await hold('202', 'ctv', '2026-11-04', '2026-11-06');
      for (const h of [paidSal, paidFd]) {
        const part = await deposit(h.id, cash(200_000));
        expect(part.statusCode, part.body).toBe(200);
        expect(part.json()).toMatchObject({ status: 'hold', depositPaidVnd: 200_000 });
      }
    }, 120_000);

    it('BUG-R3-042: unpaid overdue hold – money dated before the deadline confirms (200), after → HOLD_EXPIRED; B4 not offered', async () => {
      // Past the deadline, before J1 ran (it would cancel them).
      await x.at('2026-11-02T10:00:30+07:00');
      expect(await actionsOf(unpaidEarly.id)).not.toContain('confirm-deposit');
      const need = (await x.get(unpaidEarly.id)).depositRequiredVnd as number;
      const early = await deposit(unpaidEarly.id, cash(need, '2026-11-02T09:50:00+07:00'));
      expect(early.statusCode, early.body).toBe(200);
      expect(early.json().status).toBe('confirmed');
      const late = await deposit(unpaidLate.id, cash(need, '2026-11-02T10:00:10+07:00'));
      expect(late.statusCode, late.body).toBe(409);
      expect(late.json()).toMatchObject({ code: 'HOLD_EXPIRED' });
      // Nothing written by the refusal.
      expect((await x.get(unpaidLate.id)).depositPaidVnd).toBe(0);
    }, 120_000);

    it('BUG-R3-041 + DOM A.5: J1 – inbox rows to the right people, once; unpaid hold cancelled, creator told', async () => {
      await x.at('2026-11-02T10:01:00+07:00');
      const r1 = await j1();
      expect(r1.stats).toMatchObject({ keptPaid: 2, expired: 2, failed: 0 });
      await j1(); // a second tick tells nobody again
      // Creator (sale) + FD/FDL/MGR; never OWN, never the CTV.
      expect(await inbox(paidSal.id, 'hold_overdue_with_deposit')).toEqual(
        users('sal', 'fd', 'lead', 'mgr', 'mgr2'),
      );
      expect(await inbox(paidFd.id, 'hold_overdue_with_deposit')).toEqual(
        users('fd', 'lead', 'mgr', 'mgr2'),
      );
      expect(await inbox(paidSal.id, 'hold_overdue_cap')).toEqual([]);
      expect(await inbox(unpaidCtv.id, 'hold_expired')).toEqual(users('ctv'));
      expect(await inbox(unpaidLate.id, 'hold_expired')).toEqual(users('fd'));
      const [st] = await x.q(`SELECT status FROM reservation WHERE id = $1`, [unpaidCtv.id]);
      expect(st).toEqual({ status: 'cancelled' });
      // The push row is still there (same kind/payload/dedupe key as v1.0.3) – one per notice.
      const pushes = await x.q(
        `SELECT payload->>'kind' AS kind, count(*)::int AS n FROM outbox_message
        WHERE topic = 'staff.push' AND payload->>'refId' = $1 GROUP BY 1`,
        [paidSal.id],
      );
      expect(pushes).toEqual([{ kind: 'hold_overdue_with_deposit', n: 1 }]);
    }, 120_000);

    it('ĐX-R3-QA-01 AC1: "Cần chú ý" hold_overdue for FD+ (critical), none for SAL; no cap before 12:00', async () => {
      const fd = await attention('fd');
      const item = fd.find((i) => i.kind === 'hold_overdue');
      expect(item).toMatchObject({ severity: 'critical', params: { count: 2 } });
      expect([...(item!.reservationIds ?? [])].sort()).toEqual([paidSal.id, paidFd.id].sort());
      expect(fd.find((i) => i.kind === 'hold_overdue_cap')).toBeUndefined();
      expect((await attention('mgr')).find((i) => i.kind === 'hold_overdue_cap')).toBeUndefined();
    }, 120_000);

    it('BUG-R3-042: a sale gets HOLD_EXPIRED on its own paid overdue hold and is not offered B4; FD is', async () => {
      await x.at('2026-11-03T15:00:00+07:00');
      expect(await actionsOf(paidSal.id, 'sal')).not.toContain('confirm-deposit');
      const sal = await deposit(paidSal.id, cash(100_000), 'sal');
      expect(sal.statusCode, sal.body).toBe(409);
      expect(sal.json()).toMatchObject({ code: 'HOLD_EXPIRED' });
      expect(await actionsOf(paidSal.id)).toContain('confirm-deposit');
    }, 120_000);

    it('12:00 of the arrival day: hold_overdue_cap to MGR/OWN (inbox once + "Cần chú ý"), FD/FDL do not see it', async () => {
      await x.at('2026-11-04T12:00:00+07:00');
      await j1();
      await j1();
      expect(await inbox(paidSal.id, 'hold_overdue_cap')).toEqual(users('mgr', 'mgr2', 'owner'));
      const own = (await attention('owner')).find((i) => i.kind === 'hold_overdue_cap');
      expect(own).toMatchObject({ severity: 'critical', params: { count: 2 } });
      expect((await attention('mgr')).some((i) => i.kind === 'hold_overdue_cap')).toBe(true);
      for (const who of ['fd', 'lead']) {
        expect(
          (await attention(who)).some((i) => i.kind === 'hold_overdue_cap'),
          who,
        ).toBe(false);
      }
    }, 120_000);

    it('BUG-R3-042 (bug-list case): FD tops up after the deadline → 200 `confirmed`, Nhận phòng offered on the arrival day; AC3: the item drops', async () => {
      const before = await x.get(paidFd.id);
      const rest = (before.depositRequiredVnd as number) - (before.depositPaidVnd as number);
      expect(rest).toBeGreaterThan(0);
      const res = await deposit(paidFd.id, cash(rest));
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json()).toMatchObject({ status: 'confirmed' });
      expect(await actionsOf(paidFd.id)).toContain('check-in');
      const item = (await attention('fd')).find((i) => i.kind === 'hold_overdue');
      expect(item?.reservationIds).toEqual([paidSal.id]);
    }, 120_000);

    it('BR-303 (2) after the deadline: MGR accepts the shortfall on the money already received (B-29)', async () => {
      const [p] = await x.q(
        `SELECT p.id FROM payment p JOIN reservation r ON r.folio_id = p.folio_id
        WHERE r.id = $1 AND p.type = 'deposit' AND p.status = 'succeeded'`,
        [paidSal.id],
      );
      const res = await deposit(
        paidSal.id,
        { existingPaymentId: p!.id, acceptShortfallReason: 'Khách trả phần còn lại khi đến' },
        'mgr',
      );
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json()).toMatchObject({ status: 'confirmed' });
      // AC3: no overdue hold left → no item.
      const left = await attention('owner');
      expect(left.some((i) => i.kind === 'hold_overdue' || i.kind === 'hold_overdue_cap')).toBe(
        false,
      );
    }, 120_000);

    it('WA-04 (worker-only process): an overdue hold with a FOC request waiting is cancelled with its request', async () => {
      await x.at('2026-11-10T10:00:00+07:00');
      const h = await hold('301', 'fd', '2026-12-01', '2026-12-03');
      const { folioId } = await x.get(h.id);
      const add = await x.c.fd!.send('POST', x.url(`/folios/${folioId}/lines`), {
        category: 'fnb',
        description: 'Nước uống',
        quantity: 1,
        unitPriceVnd: 300_000,
        serviceDate: '2026-12-01',
      });
      expect(add.statusCode, add.body).toBe(201);
      const line = (add.json().lines as Array<{ id: string; category: string }>).find(
        (l) => l.category === 'fnb',
      )!;
      const foc = await x.c.fd!.send('POST', x.url(`/folios/${folioId}/lines/${line.id}/foc`), {
        kind: 'foc',
        amountVnd: 300_000,
        reasonCode: 'service_recovery',
      });
      expect(foc.statusCode, foc.body).toBe(201);
      expect(foc.json().status).toBe('pending');

      const run = await inWorkerProcess<{
        ok: boolean;
        stats?: Record<string, number>;
        error?: string;
        errors: string[];
        moduleFiles: string[];
      }>({
        cmd: 'run-job',
        key: 'hold.expire',
        propertyId: x.t.propertyIds[0],
        now: new Date('2026-11-11T10:01:00+07:00').toISOString(),
      });
      expect(run.moduleFiles).toEqual([]);
      expect(run.error, run.error).toBeUndefined();
      expect(run.errors, run.errors.join('\n')).toEqual([]);
      expect(run.stats).toMatchObject({ expired: 1, failed: 0 });
      const [res] = await x.q(`SELECT status, cancel_reason_code FROM reservation WHERE id = $1`, [
        h.id,
      ]);
      expect(res).toEqual({ status: 'cancelled', cancel_reason_code: 'hold_expired' });
      const [req] = await x.q(
        `SELECT status, auto_cancel_reason FROM approval_request WHERE id = $1`,
        [foc.json().id],
      );
      expect(req).toEqual({ status: 'cancelled', auto_cancel_reason: 'reservation_cancelled' });
      const pending = await x.q(
        `SELECT count(*)::int AS n FROM folio_line WHERE folio_id = $1 AND line_state = 'pending_approval'`,
        [folioId],
      );
      expect(pending).toEqual([{ n: 0 }]);
      // The worker writes the inbox row too (BUG-R3-041 in the worker composition).
      expect(await inbox(h.id, 'hold_expired')).toEqual(users('fd'));
    }, 240_000);

    // HOLDS-01/02 timeline: holds made 11/11 12:00 (deadline 12/11 12:00), arrival 20/12.
    let hSal: { id: string };
    let hCtv: { id: string };
    let hFd: { id: string };
    let hPre: { id: string };
    const record = (folioId: string, amountVnd: number, who: string) =>
      x.c[who]!.send('POST', x.url(`/folios/${folioId}/payments`), {
        type: 'deposit',
        method: 'cash',
        amountVnd,
      });
    const moneyRows = async (folioId: string) =>
      (
        await x.q(
          `SELECT count(*)::int AS n FROM payment WHERE folio_id = $1 AND status = 'succeeded'`,
          [folioId],
        )
      )[0]!.n as number;
    const confirmedAudit = async (reservationId: string) => {
      const { folioId } = await x.get(reservationId);
      const rows = await x.q(
        `SELECT after FROM audit_event WHERE action = 'reservation.deposit_confirmed' AND entity_id = $1`,
        [folioId],
      );
      expect(rows).toHaveLength(1);
      return rows[0]!.after as Record<string, unknown>;
    };

    it('FB-R4-SEC-BE-HOLDS-01 + G6: past the deadline, before J1 – SAL recordPayment / confirmPaymentReceived → 409 HOLD_EXPIRED (QR stays pending), CTV refused, nothing written; FD records and confirms the same QR (200); J1 then cancels', async () => {
      await x.at('2026-11-11T12:00:00+07:00');
      hSal = await hold('203', 'sal', '2026-12-20', '2026-12-22');
      hCtv = await hold('103', 'ctv', '2026-12-20', '2026-12-22');
      hFd = await hold('201', 'fd', '2026-12-20', '2026-12-22');
      hPre = await hold('202', 'sal', '2026-12-20', '2026-12-22');
      const hQr = await hold('301', 'sal', '2026-12-20', '2026-12-22');
      // Before the deadline a sale records as before: 201, waiting for the desk/bank check (SEC-BE-22 (1)).
      const pre = await record((await x.get(hPre.id)).folioId as string, 100_000, 'sal');
      expect(pre.statusCode, pre.body).toBe(201);
      expect(pre.json()).toMatchObject({ status: 'succeeded', reconciliation: 'pending' });
      // A deposit QR the sale showed before the deadline (FAKE row – its money "arrives" later).
      const salFolio = (await x.get(hSal.id)).folioId as string;
      const qrFolio = (await x.get(hQr.id)).folioId as string;
      const qrId = uuidv7();
      await x.q(
        `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
         reconciliation, amount_vnd, status, expires_at, recorded_by, recorded_by_role, created_at, created_by,
         updated_at, qr_purpose)
       VALUES ($1, $2, $3, $4, $5, $6, 'deposit', 'vietqr', 'pending', 100000, 'pending', $7, $8, 'sales_staff', $9,
               $8, $9, 'deposit')`,
        [
          qrId,
          x.t.organizationId,
          x.t.propertyIds[0],
          `QR-H01-${qrId.slice(-6)}`,
          qrFolio,
          hQr.id,
          new Date('2026-11-20T12:00:00+07:00'),
          x.t.users.sal!.id,
          new Date('2026-11-11T12:00:00+07:00'),
        ],
      );

      // One minute past the deadline; J1 has not run.
      await x.at('2026-11-12T12:01:00+07:00');
      const sal = await record(salFolio, 100_000, 'sal');
      expect(sal.statusCode, sal.body).toBe(409);
      expect(sal.json()).toMatchObject({ code: 'HOLD_EXPIRED' });
      expect(sal.json().expiredAt).toMatch(/^2026-11-12T12:00:00/);
      const ctvFolio = (await x.get(hCtv.id)).folioId as string;
      // A CTV never puts money on a hold: recordPayment and confirmDeposit have no collaborator role → 403 before
      // anything is read (contract roles, unchanged).
      const ctv = await record(ctvFolio, 100_000, 'ctv');
      expect(ctv.statusCode, ctv.body).toBe(403);
      const ctvB4 = await deposit(hCtv.id, cash(100_000, '2026-11-12T11:55:00+07:00'), 'ctv');
      expect(ctvB4.statusCode, ctvB4.body).toBe(403);
      // G6 (SEC accepted 04/11): the sale confirming its own deposit QR of the overdue hold → 409, QR untouched.
      const confirmQr = (who: string) =>
        x.c[who]!.send('POST', x.url(`/payments/${qrId}/actions/confirm-received`), {
          receivedAt: '2026-11-12T11:50:00+07:00',
        });
      const qr = await confirmQr('sal');
      expect(qr.statusCode, qr.body).toBe(409);
      expect(qr.json()).toMatchObject({ code: 'HOLD_EXPIRED' });
      expect(qr.json().expiredAt).toMatch(/^2026-11-12T12:00:00/);
      // Nothing written by the refusals.
      expect(await moneyRows(salFolio)).toBe(0);
      expect(await moneyRows(ctvFolio)).toBe(0);
      expect(await moneyRows(qrFolio)).toBe(0);
      const [q] = await x.q(`SELECT status FROM payment WHERE id = $1`, [qrId]);
      expect(q).toEqual({ status: 'pending' });
      // FD confirms the same QR: 200, the money is on the hold (J1 keeps it).
      const qrFd = await confirmQr('fd');
      expect(qrFd.statusCode, qrFd.body).toBe(200);
      const [q2] = await x.q(`SELECT status FROM payment WHERE id = $1`, [qrId]);
      expect(q2).toEqual({ status: 'succeeded' });
      expect(await moneyRows(qrFolio)).toBe(1);
      // FD+ unchanged.
      const fd = await record((await x.get(hFd.id)).folioId as string, 100_000, 'fd');
      expect(fd.statusCode, fd.body).toBe(201);
      // J1: the refused holds are cancelled; the ones with money are kept.
      expect((await j1()).stats).toMatchObject({ expired: 2, keptPaid: 3, failed: 0 });
      const st = await x.q(`SELECT id, status FROM reservation WHERE id = ANY($1) ORDER BY id`, [
        [hSal.id, hCtv.id, hFd.id, hPre.id, hQr.id],
      ]);
      expect(Object.fromEntries(st.map((r) => [r.id, r.status]))).toEqual({
        [hSal.id]: 'cancelled',
        [hCtv.id]: 'cancelled',
        [hFd.id]: 'hold',
        [hPre.id]: 'hold',
        [hQr.id]: 'hold',
      });
    }, 120_000);

    it('FB-R4-SEC-BE-HOLDS-02: after-deadline deposit_confirmed audit carries the 5 fields (new and existing payment); before the deadline none', async () => {
      // Bug-list case (FD topped up after the deadline on 200.000 received, desk cash = verified).
      expect(await confirmedAudit(paidFd.id)).toMatchObject({
        status: 'confirmed',
        afterDeadline: true,
        holdExpiredAt: new Date('2026-11-02T10:00:00+07:00').toISOString(),
        paidBeforeVnd: 200_000,
        unverifiedPaidVnd: 0,
        via: 'new_payment',
      });
      // MGR accepted the shortfall on the receipt already there.
      expect(await confirmedAudit(paidSal.id)).toMatchObject({
        afterDeadline: true,
        paidBeforeVnd: 200_000,
        unverifiedPaidVnd: 0,
        via: 'existing_payment',
      });
      // FD tops up a hold whose only money is a sale's receipt still waiting for the check.
      const pre = await x.get(hPre.id);
      const res = await deposit(
        hPre.id,
        cash((pre.depositRequiredVnd as number) - (pre.depositPaidVnd as number)),
      );
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json().status).toBe('confirmed');
      const after = await confirmedAudit(hPre.id);
      expect(after).toMatchObject({
        afterDeadline: true,
        holdExpiredAt: new Date('2026-11-12T12:00:00+07:00').toISOString(),
        paidBeforeVnd: 100_000,
        unverifiedPaidVnd: 100_000,
        via: 'new_payment',
      });
      expect(Object.keys(after).sort()).toEqual(
        [
          'afterDeadline',
          'depositPaidVnd',
          'depositRequiredVnd',
          'holdExpiredAt',
          'paidBeforeVnd',
          'status',
          'unverifiedPaidVnd',
          'via',
        ].sort(),
      );
      // Before the deadline (a hold made now, confirmed at once): the audit row stays as in v1.0.3.
      const fresh = await hold('101', 'fd', '2026-12-20', '2026-12-22');
      const ok = await deposit(
        fresh.id,
        cash((await x.get(fresh.id)).depositRequiredVnd as number),
      );
      expect(ok.statusCode, ok.body).toBe(200);
      expect(Object.keys(await confirmedAudit(fresh.id)).sort()).toEqual(
        ['depositPaidVnd', 'depositRequiredVnd', 'status'].sort(),
      );
    }, 120_000);

    it('DOM P4-20 §0: hold_expired whose creator is no longer active in the property → FD and FDL instead, once', async () => {
      await x.at('2026-11-12T10:00:00+07:00');
      const h = await hold('302', 'ctv', '2026-12-10', '2026-12-12');
      // The CTV leaves before the hold expires (role revoked) – nobody of creator/closer is active here any more.
      await x.q(
        `UPDATE user_property_role SET revoked_at = $2 WHERE user_id = $1 AND revoked_at IS NULL`,
        [x.t.users.ctv!.id, new Date('2026-11-12T12:00:00+07:00')],
      );
      await x.at('2026-11-13T10:01:00+07:00');
      expect((await j1()).stats).toMatchObject({ expired: 1, failed: 0 });
      await j1();
      expect(await inbox(h.id, 'hold_expired')).toEqual(users('fd', 'lead'));
    }, 120_000);
  },
);
