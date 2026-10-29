/**
 * OPS j15-folio-close-check 10 (rc.5 on staging 29/10): J15 `folio.close`, J24 `payment.expire` and J1 `hold.expire`
 * run in a process that loads ONLY the worker (test/helpers/worker-only-child.ts: src/worker-jobs.ts + JobRunner on
 * DATABASE_URL, fixed clock) – never in this Vitest process, which holds the Nest app (every `*.module.ts` and its
 * audit allowlists) and so hid the staging failure from BUG-R3-037 test (b).
 * Data is prepared through the real api (fixture.ts, fake data only); each job runs `runOnce` on the test's own
 * property (other test files share the database).
 */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ReservationsService } from '../../../src/modules/reservations/internal/reservations.service';
import { sha256Hex } from '../../../src/shared/http/auth.guard';
import { HAS_DB } from '../../helpers/tenant';
import { inWorkerProcess } from '../../helpers/worker-process';
import { type Fx, addDays, startFixture } from './fixture';

type JobRun = {
  ok: boolean;
  stats?: Record<string, number>;
  error?: string;
  errors: string[];
  moduleFiles: string[];
};

describe.skipIf(!HAS_DB)(
  'worker-only process: J15, J24, J1 write their audit (OPS 10.2/10.3)',
  () => {
    let x: Fx;
    beforeAll(async () => {
      x = await startFixture();
    });
    afterAll(async () => {
      await x?.close();
    });

    /** One job, one property, in a fresh process that loads only the worker. */
    const runInWorker = async (key: string, now: Date): Promise<JobRun> => {
      const r = await inWorkerProcess<JobRun>({
        cmd: 'run-job',
        key,
        propertyId: x.t.propertyIds[0],
        now: now.toISOString(),
      });
      // The process really is the worker: no Nest module file loaded.
      expect(r.moduleFiles).toEqual([]);
      expect(r.error, r.error).toBeUndefined();
      expect(r.errors, r.errors.join('\n')).toEqual([]);
      expect(r.ok).toBe(true);
      return r;
    };

    it('(b) J15 closes a settled folio past its window and writes `folio.closed` (with and without a debt)', async () => {
      const s = await x.checkedOutStay();
      const paid = await x.checkedOutStay();
      await x.at(`${s.departure}T15:00:00+07:00`);
      await x.lateCharge(s, 70_000, s.departure);
      expect((await x.folio(paid.folioId)).status).toBe('settled');

      const r = await runInWorker(
        'folio.close',
        new Date(`${addDays(s.departure, 1)}T11:01:00+07:00`),
      );
      expect(r.stats).toMatchObject({ failed: 0 });
      // `closed` = without a debt (paid), `closedWithDebt` = the 70.000 found after check-out.
      expect(r.stats!.closed).toBeGreaterThanOrEqual(1);
      expect(r.stats!.closedWithDebt).toBeGreaterThanOrEqual(1);
      expect((await x.folio(s.folioId)).status).toBe('closed');
      expect((await x.folio(paid.folioId)).status).toBe('closed');
      const audits = await x.q(
        `SELECT action, entity_id, after FROM audit_event
        WHERE (action = 'folio.closed' AND entity_id = ANY($1::text[]))
           OR (action = 'reservation.debt_on_checkout' AND entity_id = $2)
        ORDER BY action, entity_id`,
        [[s.folioId, paid.folioId], s.id],
      );
      expect(audits.filter((a) => a.action === 'folio.closed')).toHaveLength(2);
      expect(audits.find((a) => a.entity_id === s.folioId)).toMatchObject({
        after: { status: 'closed', balanceDueVnd: 70_000 },
      });
      expect(audits.find((a) => a.action === 'reservation.debt_on_checkout')).toMatchObject({
        after: { debtVnd: 70_000, openDebtVnd: 70_000 },
      });
    }, 240_000);

    it('(c) J24 payment.expire: a pending VietQR past expires_at becomes expired, with its money audit', async () => {
      const s = await x.checkedOutStay();
      const now = new Date(`${addDays(s.departure, 1)}T09:00:00+07:00`);
      const id = uuidv7();
      await x.q(
        `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
         reconciliation, amount_vnd, status, expires_at, recorded_by, recorded_by_role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'charge', 'vietqr', 'pending', 200000, 'pending', $7, $8, 'front_desk', $9, $9)`,
        [
          id,
          x.t.organizationId,
          x.t.propertyIds[0],
          `PT-WK-${id.slice(-6)}`,
          s.folioId,
          s.id,
          new Date(now.getTime() - 3_600_000),
          x.t.users.fd!.id,
          new Date(now.getTime() - 7_200_000),
        ],
      );
      const r = await runInWorker('payment.expire', now);
      expect(r.stats!.expired).toBeGreaterThanOrEqual(1);
      const [p] = await x.q(`SELECT status FROM payment WHERE id = $1`, [id]);
      expect(p).toEqual({ status: 'expired' });
      const audit = await x.q(
        `SELECT before, after FROM audit_event WHERE entity_id = $1 AND action = 'payment.expired'`,
        [id],
      );
      expect(audit).toEqual([
        {
          before: { status: 'pending' },
          after: { status: 'expired', method: 'vietqr', amountVnd: 200_000 },
        },
      ]);
      // Idempotent: a second tick finds nothing.
      expect((await runInWorker('payment.expire', now)).stats).toMatchObject({ expired: 0 });
    }, 240_000);

    it('(d) J1 hold.expire cancels the hold, audits it, voids its registration (K11) and revokes its guest links (B-13)', async () => {
      await x.at('2026-10-20T10:00:00+07:00');
      const svc = x.fa.app.get(ReservationsService);
      const hold = await x.db.withContext(
        { ...x.t.ctx(), userId: x.t.users.sal!.id, actorType: 'user' },
        async (tx) => {
          const ctx = await svc.context(tx, { userId: x.t.users.sal!.id, roles: ['sales_staff'] });
          return svc.createHold(tx, ctx, {
            roomId: x.ids.rooms['101']!,
            channelId: x.ids.channels.direct!,
            arrivalDate: '2027-03-10',
            departureDate: '2027-03-12',
            adults: 2,
            children6to11: 0,
            childrenUnder6: 0,
            bookerGuestId: x.guest,
            holdHours: 24,
          });
        },
      );
      expect(hold.status).toBe('hold');
      const [reg] = await x.q(`SELECT status FROM registration WHERE reservation_id = $1`, [
        hold.id,
      ]);
      expect(reg).toEqual({ status: 'none' });
      // A live guest link on the booking (written straight: the desk never issues one for a hold) – the cancel
      // listener must revoke it in the worker as the api does.
      const tokenId = uuidv7();
      await x.q(
        `INSERT INTO guest_access_token (id, organization_id, property_id, reservation_id, token_hash, created_at,
         created_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          tokenId,
          x.t.organizationId,
          x.t.propertyIds[0],
          hold.id,
          sha256Hex(`worker-only-${tokenId}`),
          new Date('2026-10-20T10:00:00+07:00'),
          x.t.users.fd!.id,
          new Date('2027-03-12T12:00:00+07:00'),
        ],
      );

      const r = await runInWorker('hold.expire', new Date('2026-10-21T10:01:00+07:00'));
      expect(r.stats).toMatchObject({ expired: 1, failed: 0 });
      const [res] = await x.q(`SELECT status, cancel_reason_code FROM reservation WHERE id = $1`, [
        hold.id,
      ]);
      expect(res).toEqual({ status: 'cancelled', cancel_reason_code: 'hold_expired' });
      const audit = await x.q(
        `SELECT after FROM audit_event WHERE entity_id = $1 AND action = 'reservation.hold_expired'`,
        [hold.id],
      );
      expect(audit).toEqual([{ after: { status: 'cancelled', reasonCode: 'hold_expired' } }]);
      const [reg2] = await x.q(`SELECT status FROM registration WHERE reservation_id = $1`, [
        hold.id,
      ]);
      expect(reg2).toEqual({ status: 'void' });
      const [tok] = await x.q(
        `SELECT revoked_at IS NOT NULL AS revoked, revoked_reason FROM guest_access_token WHERE id = $1`,
        [tokenId],
      );
      expect(tok).toEqual({ revoked: true, revoked_reason: 'cancelled' });
    }, 240_000);
  },
);
