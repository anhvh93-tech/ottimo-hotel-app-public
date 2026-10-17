/**
 * BE-B Sprint 3 money flows end to end (Nest/Fastify + PostgreSQL 17, real reservations module of BE-A):
 * recordPayment (PaymentPort), VietQR (SEC F1–F3) + receiving account (setParameter, re-auth, masked audit,
 * push), confirmPaymentReceived, listPayments scopes, reconcilePayment (SEC F5, CHECK DB), cash handover of
 * a sale (A46a, oracle BR-527-05 – commission earned), reversePayment, refunds (oracle BR-522-01, A47a/A47,
 * C3 destination + step-up + c3_access_log, CHECK payer ≠ requester), confirmDeposit acceptShortfallReason
 * (B-29), addFolioLine / adjustFolioLine (BR-507-01, BR-511-02, damage approval), getBill (G-12, G-13,
 * BR-434-01, BR-004), setInvoiceRequest, FolioPort.settle + post-checkout window, minibar (BR-702-01).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database, Tx } from '../../src/db/database';
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import { MinibarCheckoutPort } from '../../src/modules/inventory/public/minibar-checkout.port';
import { JobRunner } from '../../src/jobs/job-runner';
import { HOLD_EXPIRY_JOB_KEY } from '../../src/jobs/reservation-jobs';
import { FolioService } from '../../src/modules/folio/public/folio.service';
import { PaymentService } from '../../src/modules/payments/public/payment.service';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
import { crc16Ccitt } from '../../src/modules/payments/internal/vietqr';
import { addDays } from '../../src/shared/time';
import {
  Client,
  type FeatureApp,
  P,
  TEST_PASSWORD,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import { type SalesIds, refreshSessions, seedGuest, seedSales } from '../helpers/sales-fixture';
import {
  HAS_DB,
  T0,
  type TestTenant,
  appDatabase,
  createTenant,
  setParam,
} from '../helpers/tenant';

interface Booking {
  id: string;
  code: string;
  folioId: string;
  version: number;
  arrivalDate: string;
}

const BR = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  examples: Array<{
    id: string;
    input: Record<string, unknown>;
    expected: Record<string, unknown>;
  }>;
};
const oracle = (id: string) => BR.examples.find((e) => e.id === id)!;
const DS_E = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/seed/ds-e.json'), 'utf8'),
) as {
  minibarItems: Array<{
    code: string;
    name: string;
    unit: string;
    unitCostVnd: number;
    salePriceVnd: number;
    standardQtyPerRoom: number;
  }>;
  feeCatalog: Array<{ code: string; name: string; priceVnd: number; br: string }>;
};

const ACCOUNT = { bankBin: '970407', accountNo: '1903123456789', accountName: 'OTTIMO TEST' };

describe.skipIf(!HAS_DB)(
  'BE-B Sprint 3 – payments, VietQR, reconciliation, refunds, folio, bill, minibar',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: SalesIds;
    let guestSal: string;
    const weeks: Record<string, number> = { '101': 0, '202': 0, '301': 0, '302': 0 };
    let turn = 0;
    const items: Record<string, string> = {};

    beforeAll(async () => {
      // Attachments of BE-C's files module stay in memory in this test (no blob written to disk).
      process.env.BLOBSTORE_PROVIDER = 'memory';
      db = appDatabase(10);
      t = await createTenant(db, {
        users: {
          owner: ['owner'],
          owner2: ['owner'],
          mgr: ['manager'],
          mgr2: ['manager'],
          fdl: ['front_desk_lead'],
          fd: ['front_desk'],
          fd2: ['front_desk'],
          sal: ['sales_staff'],
          ctv: ['collaborator'],
          hk: ['housekeeping'],
        },
      });
      ids = await seedSales(db, t);
      guestSal = await seedGuest(db, t, t.users.sal!.id);
      for (const u of ['owner', 'owner2', 'mgr', 'mgr2', 'fdl', 'fd', 'fd2'])
        await setPassword(db, t, u);
      // BR-512 damage table + DS-E minibar fridge (BL 4.13) – fake data.
      await setParam(
        db,
        t,
        'damage_catalog',
        DS_E.feeCatalog
          .filter((f) => f.br === 'BR-512')
          .map((f) => ({ code: f.code, name: f.name, priceVnd: f.priceVnd })),
      );
      await db.withContext(t.ctx(), async (tx) => {
        for (const m of DS_E.minibarItems) {
          const id = uuidv7();
          items[m.code] = id;
          await tx.query(
            `INSERT INTO item (id, organization_id, property_id, code, kind, name, unit, cost_price_vnd,
             sale_price_vnd, minibar_standard_qty, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'minibar', $5, $6, $7, $8, $9, $10, $10)`,
            [
              id,
              t.organizationId,
              t.propertyIds[0],
              m.code,
              m.name,
              m.unit,
              m.unitCostVnd,
              m.salePriceVnd || null,
              m.standardQtyPerRoom,
              T0,
            ],
          );
        }
      });
      fa = await startFeatureApp(db);
    });
    afterAll(async () => {
      await fa?.close();
      await db.close();
    });

    const c = (who: string) => Client.of(fa, t, who);
    /** An uploaded attachment (BE-C AttachmentService, memory blob store) – fake image bytes. */
    const attach = (
      who: string,
      purpose: 'refund_proof' | 'penalty_evidence' | 'deposit_receipt',
      reservationId: string | null,
    ) =>
      db.withContext(
        { ...t.ctx(), userId: t.users[who]!.id, actorType: 'user' },
        async (tx) =>
          (
            await fa.app
              .get(AttachmentService)
              .upload(
                tx,
                { userId: t.users[who]!.id, roles: t.users[who]!.roles },
                { purpose, reservationId },
                { data: Buffer.from('fake-jpeg-bytes'), mime: 'image/jpeg', width: 1, height: 1 },
              )
          ).id,
      );
    const q = (sql: string, args: unknown[] = []) =>
      db.withContext(t.ctx(), async (tx) => (await tx.query(sql, args)).rows);

    /** Confirmed 7-night booking (quote by the sale → hold → deposit). Deposit by `depositBy` (default FD). */
    async function booking(
      opts: {
        depositBy?: string;
        deposit?: Record<string, unknown> | null;
        room?: '101' | '202' | '301' | '302';
      } = {},
    ): Promise<Booking> {
      const room = opts.room ?? ((['101', '202', '301', '302'] as const)[turn++ % 4] as '101');
      const arrivalDate = addDays('2026-11-09', 7 * (weeks[room] as number));
      weeks[room] = (weeks[room] as number) + 1;
      const quote = await c('sal').send('POST', `${P(t)}/quotes`, {
        type: 'short',
        roomId: ids.rooms[room],
        arrivalDate,
        nights: 7,
        adults: 2,
        channelId: ids.channels.direct,
        guestId: guestSal,
      });
      expect(quote.statusCode, quote.body).toBe(201);
      const hold = await c('sal').send(
        'POST',
        `${P(t)}/quotes/${quote.json().id}/actions/create-hold`,
        {
          holdHours: 24,
        },
      );
      expect(hold.statusCode, hold.body).toBe(201);
      const h = hold.json();
      const b: Booking = {
        id: h.id,
        code: h.code,
        folioId: h.folioId,
        version: h.version,
        arrivalDate,
      };
      if (opts.deposit === null) return b;
      const res = await c(opts.depositBy ?? 'fd').send(
        'POST',
        `${P(t)}/reservations/${b.id}/actions/confirm-deposit`,
        {
          payment: opts.deposit ?? {
            type: 'deposit',
            method: 'cash',
            amountVnd: h.depositRequiredVnd,
          },
        },
        { 'if-match': `"${b.version}"` },
      );
      expect(res.statusCode, res.body).toBe(200);
      b.version = res.json().version;
      return b;
    }
    const folio = async (b: Booking, who = 'fd') =>
      (await c(who).get(`${P(t)}/folios/${b.folioId}`)).json();
    const pay = (who: string, b: Booking, body: Record<string, unknown>) =>
      c(who).send('POST', `${P(t)}/folios/${b.folioId}/payments`, body);
    const inHouse = (b: Booking) =>
      q(`UPDATE reservation SET status = 'in_house', actual_checkin_at = $2 WHERE id = $1`, [
        b.id,
        T0,
      ]);
    /**
     * B18 as BE-A runs it, money side only: the desk collects what is still due (cash), the booking becomes
     * `checked_out`, then the SM-11 hook (FolioModule on ReservationHooks B18) – returns commissions earned.
     */
    const checkoutPaid = async (b: Booking): Promise<number> => {
      const due = (await folio(b)).totals.balanceDueVnd as number;
      if (due > 0) {
        const r = await pay('fd', b, { type: 'charge', method: 'cash', amountVnd: due });
        expect(r.statusCode, r.body).toBe(201);
      }
      await q(
        `UPDATE reservation SET status = 'checked_out', actual_checkin_at = $2, actual_checkout_at = $2
          WHERE id = $1`,
        [b.id, T0],
      );
      return db.withContext(t.ctx(), (tx) =>
        fa.app.get(FolioService).tryEarnCommissions(tx, {
          reservationId: b.id,
          reservationCode: b.code,
          status: 'checked_out',
        }),
      );
    };
    const outbox = async (kind: string) =>
      (
        await q(`SELECT payload FROM outbox_message WHERE property_id = $1 ORDER BY created_at`, [
          t.propertyIds[0],
        ])
      ).filter((r) => (r.payload as { kind: string }).kind === kind);

    // ───────────────────────────── recordPayment ─────────────────────────────

    it('recordPayment (2.2): cash/transfer, PT- code, role snapshot, money audit, idempotent; refund/SAL charge/CTV refused', async () => {
      const b = await booking();
      const before = (await folio(b)).totals;
      const key = uuidv7();
      const r = await c('fd').send(
        'POST',
        `${P(t)}/folios/${b.folioId}/payments`,
        { type: 'charge', method: 'cash', amountVnd: 1_000_000 },
        { 'idempotency-key': key },
      );
      expect(r.statusCode, r.body).toBe(201);
      expect(r.json()).toMatchObject({
        type: 'charge',
        method: 'cash',
        amountVnd: 1_000_000,
        status: 'succeeded',
        reconciliation: 'not_required',
        recordedByRole: 'front_desk',
        reservationCode: b.code,
      });
      expect(r.json().code).toMatch(/^PT-\d{6}$/);
      const again = await c('fd').send(
        'POST',
        `${P(t)}/folios/${b.folioId}/payments`,
        { type: 'charge', method: 'cash', amountVnd: 1_000_000 },
        { 'idempotency-key': key },
      );
      expect(again.headers['idempotent-replayed']).toBe('true');
      expect(await q('SELECT 1 FROM payment WHERE id = $1', [r.json().id])).toHaveLength(1);
      const audit = await q(
        `SELECT category, request_id FROM audit_event WHERE entity_id = $1 AND action = 'payment.recorded'`,
        [r.json().id],
      );
      expect(audit).toEqual([{ category: 'money', request_id: expect.any(String) }]);
      expect((await folio(b)).totals.balanceDueVnd).toBe(before.balanceDueVnd - 1_000_000);

      const transfer = await pay('fd', b, {
        type: 'charge',
        method: 'bank_transfer',
        amountVnd: 100_000,
      });
      expect(transfer.json().reconciliation).toBe('pending');
      // A-33: a refund never goes through recordPayment.
      expect(
        (await pay('fd', b, { type: 'refund', method: 'cash', amountVnd: 1 })).json().errors,
      ).toEqual([{ field: 'type', code: 'NOT_IN_LIST' }]);
      // ota_collect only for OTA bookings; vnpay R3.
      expect(
        (await pay('fd', b, { type: 'charge', method: 'ota_collect', amountVnd: 1 })).json().errors,
      ).toEqual([{ field: 'method', code: 'NOT_IN_LIST' }]);
      // US-119 AC4: SAL only deposits of own bookings; CTV never (role gate).
      expect(
        (await pay('sal', b, { type: 'charge', method: 'cash', amountVnd: 1 })).statusCode,
      ).toBe(403);
      expect(
        (await pay('ctv', b, { type: 'deposit', method: 'cash', amountVnd: 1 })).statusCode,
      ).toBe(403);
      // Never before the booking existed; POS needs an auth code, never a card number.
      const old = new Date(T0.getTime() - 30 * 3_600_000).toISOString();
      expect(
        (
          await pay('fd', b, { type: 'charge', method: 'cash', amountVnd: 1, receivedAt: old })
        ).json().errors,
      ).toEqual([{ field: 'receivedAt', code: 'DATE_INVALID' }]);
      expect(
        (await pay('fd', b, { type: 'charge', method: 'card_pos', amountVnd: 1 })).json().errors,
      ).toEqual([{ field: 'posAuthCode', code: 'REQUIRED' }]);
      expect(
        (
          await pay('fd', b, {
            type: 'charge',
            method: 'cash',
            amountVnd: 1,
            note: 'the 4111 1111 1111 1111',
          })
        ).json().code,
      ).toBe('CARD_NUMBER_DETECTED');
    });

    it('BR-521-01 + DOM G-15: a bill paid by transfer + cash reaches 0; an overpayment needs a note and shows as credit', async () => {
      const b = await booking();
      const due = (await folio(b)).totals.balanceDueVnd as number;
      const o = oracle('BR-521-01').input as {
        payments: Array<{ method: string; amountVnd: number }>;
      };
      expect(
        (
          await pay('fd', b, {
            type: 'charge',
            method: 'bank_transfer',
            amountVnd: o.payments[0]!.amountVnd,
          })
        ).statusCode,
      ).toBe(201);
      const rest = due - o.payments[0]!.amountVnd;
      expect(
        (await pay('fd', b, { type: 'charge', method: 'cash', amountVnd: rest })).statusCode,
      ).toBe(201);
      const f = await folio(b);
      expect(f.totals.balanceDueVnd).toBe(0);
      expect(f.payments.filter((p: { type: string }) => p.type === 'charge')).toHaveLength(
        (oracle('BR-521-01').expected as { transactions: number }).transactions,
      );
      expect(
        (await pay('fd', b, { type: 'charge', method: 'cash', amountVnd: 50_000 })).json().errors,
      ).toEqual([{ field: 'note', code: 'REASON_REQUIRED' }]);
      const over = await pay('fd', b, {
        type: 'charge',
        method: 'cash',
        amountVnd: 50_000,
        note: 'Khách trả trước dịch vụ',
      });
      expect(over.statusCode, over.body).toBe(201);
      expect((await folio(b)).totals).toMatchObject({ balanceDueVnd: 0, creditVnd: 50_000 });
    });

    // ───────────────────────────── VietQR + receiving account ─────────────────────────────

    it('SEC F3: receiving account – owner only, re-auth, masked everywhere, money audit, push to OWN/MGR', async () => {
      const b = await booking();
      expect(
        (
          await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/vietqr`, { amountVnd: 100_000 })
        ).json().code,
      ).toBe('PAYMENT_NOT_CONFIGURED');
      const put = (who: string, body: Record<string, unknown>) =>
        c(who).send('PUT', `${P(t)}/parameters/payment_receiving_account`, {
          value: ACCOUNT,
          effectiveFrom: '2026-10-15',
          reason: 'Tài khoản nhận thử nghiệm',
          ...body,
        });
      expect(
        (await put('mgr', { reauth: { authMethod: 'password', secret: TEST_PASSWORD } }))
          .statusCode,
      ).toBe(403);
      expect((await put('owner', {})).json().errors).toEqual([
        { field: 'reauth', code: 'REQUIRED' },
      ]);
      const bad = await put('owner', {
        reauth: { authMethod: 'password', secret: 'wrong-password' },
      });
      expect(bad.statusCode).toBe(401);
      expect(bad.json().code).toBe('REAUTH_FAILED');
      const ok = await put('owner', { reauth: { authMethod: 'password', secret: TEST_PASSWORD } });
      expect(ok.statusCode, ok.body).toBe(200);
      expect(ok.json().value).toEqual({
        bankBin: '970407',
        accountNoMasked: '9704••••6789',
        accountName: 'OTTIMO TEST',
      });
      expect(ok.body).not.toContain(ACCOUNT.accountNo);
      const listed = await c('owner').get(`${P(t)}/parameters/payment_receiving_account`);
      expect(listed.body).not.toContain(ACCOUNT.accountNo);
      const audit = await q(
        `SELECT category, after::text AS after FROM audit_event
        WHERE entity_type = 'config_parameter' AND entity_id = 'payment_receiving_account'
          AND category <> 'access'`,
      );
      expect(audit).toHaveLength(1);
      expect(audit[0]!.category).toBe('money');
      expect(String(audit[0]!.after)).not.toContain(ACCOUNT.accountNo);
      const idem = await q(
        `SELECT request_hash, response_body::text AS body FROM idempotency_key WHERE path LIKE '%payment_receiving_account'`,
      );
      for (const r of idem) expect(String(r.body)).not.toContain(ACCOUNT.accountNo);
      const push = await outbox('receiving_account_changed');
      expect(push).toHaveLength(1);
      const to = (push[0]!.payload as { userIds: string[] }).userIds.sort();
      expect(to).toEqual(
        [t.users.owner!.id, t.users.owner2!.id, t.users.mgr!.id, t.users.mgr2!.id].sort(),
      );
      expect(JSON.stringify(push[0]!.payload)).not.toContain(ACCOUNT.accountNo);
    });

    it('createVietQr (US-120, SEC F1/F2): server amount cap, code-only content, payload with CRC, one pending QR per folio', async () => {
      const b = await booking();
      const due = (await folio(b)).totals.balanceDueVnd as number;
      const qr = (who: string, body: Record<string, unknown>) =>
        c(who).send('POST', `${P(t)}/folios/${b.folioId}/vietqr`, body);
      const over = await qr('fd', { amountVnd: due + 1 });
      expect(over.json().errors).toEqual([{ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }]);
      expect(over.json().max).toBe(due);
      expect(
        (await qr('sal', { amountVnd: due + 1, overBalanceReason: 'ký quỹ' })).statusCode,
      ).toBe(403);
      expect((await qr('fd', { amountVnd: 1, purpose: 'billing_period' })).json().errors).toEqual([
        { field: 'purpose', code: 'NOT_IN_LIST' },
      ]);
      const first = await qr('fd', { amountVnd: 500_000 });
      expect(first.statusCode, first.body).toBe(201);
      const body = first.json();
      expect(body.transferContent).toBe(b.code.replace(/-/g, ''));
      expect(body.payment).toMatchObject({
        status: 'pending',
        method: 'vietqr',
        reconciliation: 'pending',
      });
      expect(body.receivingAccountMasked).toBe('9704••••6789');
      expect(body.receivingAccountRecentlyChanged).toBe(true);
      const payload = body.qrPayload as string;
      expect(payload).toContain('A000000727');
      // 38 → 01 beneficiary = 00 BIN + 01 account (NAPAS 247 to account).
      expect(payload).toContain(`0006${ACCOUNT.bankBin}0113${ACCOUNT.accountNo}`);
      expect(payload).toContain('0208QRIBFTTA');
      expect(payload).toContain('5406500000');
      expect(payload).toContain(body.transferContent);
      expect(payload.slice(-4)).toBe(crc16Ccitt(payload.slice(0, -4)));
      expect(payload).not.toMatch(/Khách|Thử/);
      const second = await qr('fd', {
        amountVnd: due + 10_000,
        overBalanceReason: 'Thu trước dịch vụ',
      });
      expect(second.statusCode, second.body).toBe(201);
      expect(second.json().expiredPaymentIds).toEqual([body.payment.id]);

      // confirmPaymentReceived: pending → succeeded, waits for reconciliation; expired one → 409.
      const confirm = (id: string, who = 'fd') =>
        c(who).send('POST', `${P(t)}/payments/${id}/actions/confirm-received`, {
          note: 'FT2629 – NGUYEN VAN A',
        });
      const gone = await confirm(body.payment.id);
      expect(gone.statusCode).toBe(409);
      expect(gone.json().currentState).toBe('expired');
      const seen = await confirm(second.json().payment.id);
      expect(seen.statusCode, seen.body).toBe(200);
      expect(seen.json()).toMatchObject({
        status: 'succeeded',
        reconciliation: 'pending',
        confirmedByUserId: t.users.fd!.id,
      });
      expect((await confirm(second.json().payment.id)).statusCode).toBe(409);
      // Hold: the cap is the missing deposit (BR-305).
      const h = await booking({ deposit: null });
      const holdQr = await c('fd').send('POST', `${P(t)}/folios/${h.folioId}/vietqr`, {
        amountVnd: 10_000_000,
      });
      expect(holdQr.json().errors).toEqual([
        { field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' },
      ]);
    });

    // ───────────────────────────── reconciliation ─────────────────────────────

    it('reconcilePayment (SEC F5): recorder/confirmer → 403 SELF_RECONCILE_FORBIDDEN, owner self flagged, If-Match, disputed alert, CHECK DB', async () => {
      const b = await booking();
      const p1 = (
        await pay('mgr', b, { type: 'charge', method: 'bank_transfer', amountVnd: 200_000 })
      ).json();
      const rec = (
        who: string,
        id: string,
        body: Record<string, unknown>,
        ifMatch: string | null,
      ) =>
        c(who).send(
          'POST',
          `${P(t)}/payments/${id}/actions/reconcile`,
          body,
          ifMatch ? { 'if-match': ifMatch } : {},
        );
      expect((await rec('mgr2', p1.id, { result: 'reconciled' }, null)).statusCode).toBe(428);
      expect(
        (await rec('mgr', p1.id, { result: 'reconciled' }, `"${p1.version}"`)).json().code,
      ).toBe('SELF_RECONCILE_FORBIDDEN');
      expect((await rec('mgr2', p1.id, { result: 'reconciled' }, '"99"')).statusCode).toBe(412);
      expect((await rec('fd', p1.id, { result: 'reconciled' }, `"${p1.version}"`)).statusCode).toBe(
        403,
      );
      const done = await rec('mgr2', p1.id, { result: 'reconciled' }, `"${p1.version}"`);
      expect(done.statusCode, done.body).toBe(200);
      expect(done.json()).toMatchObject({
        reconciliation: 'reconciled',
        reconciledByName: expect.any(String),
      });
      expect(
        (await rec('mgr2', p1.id, { result: 'reconciled' }, `"${done.json().version}"`)).statusCode,
      ).toBe(409);

      const p2 = (
        await pay('owner', b, { type: 'charge', method: 'bank_transfer', amountVnd: 100_000 })
      ).json();
      const self = await rec('owner', p2.id, { result: 'reconciled' }, `"${p2.version}"`);
      expect(self.statusCode, self.body).toBe(200);
      expect((await q('SELECT self_reconciled FROM payment WHERE id = $1', [p2.id]))[0]).toEqual({
        self_reconciled: true,
      });
      const a = await q(
        `SELECT after FROM audit_event WHERE entity_id = $1 AND action = 'payment.reconciled'`,
        [p2.id],
      );
      expect(a[0]!.after).toMatchObject({ selfReconciled: true });

      const p3 = (
        await pay('fd', b, { type: 'charge', method: 'bank_transfer', amountVnd: 100_000 })
      ).json();
      expect(
        (await rec('mgr', p3.id, { result: 'disputed' }, `"${p3.version}"`)).json().errors,
      ).toEqual([{ field: 'note', code: 'REASON_REQUIRED' }]);
      const disputed = await rec(
        'mgr',
        p3.id,
        { result: 'disputed', note: 'Không thấy trên sao kê' },
        `"${p3.version}"`,
      );
      expect(disputed.json().reconciliation).toBe('disputed');
      expect(disputed.json().status).toBe('succeeded'); // never reversed automatically
      const alert = (await outbox('payment_disputed')).map(
        (r) => (r.payload as { userIds: string[] }).userIds,
      );
      expect(alert.at(-1)!.sort()).toEqual(
        [t.users.owner!.id, t.users.owner2!.id, t.users.mgr!.id, t.users.mgr2!.id].sort(),
      );
      // CHECK payment_reconcile_separation_check: the recorder cannot be written as reconciler.
      const p4 = (
        await pay('fd', b, { type: 'charge', method: 'bank_transfer', amountVnd: 1_000 })
      ).json();
      await expect(
        q(
          `UPDATE payment SET reconciliation = 'reconciled', reconciled_by = recorded_by, reconciled_at = now() WHERE id = $1`,
          [p4.id],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    });

    it('BR-527-05 / A46a: cash a sale recorded – the sale cannot confirm; checked out and paid in full → still projected; FD afternoon confirms → reconciled, sale commission earned; FD list scope', async () => {
      const o = oracle('BR-527-05');
      const amount = (o.input as { amountVnd: number }).amountVnd;
      // Room 202, 7 nights → the BR-305 deposit is the oracle's 1.600.000 (BR-305-02).
      const b = await booking({
        room: '202',
        depositBy: 'sal',
        deposit: { type: 'deposit', method: 'cash', amountVnd: amount },
      });
      const [p] = await q(
        `SELECT id, version, reconciliation, recorded_by_role FROM payment WHERE folio_id = $1`,
        [b.folioId],
      );
      expect(p).toMatchObject({ reconciliation: 'pending', recorded_by_role: 'sales_staff' });
      const commission = async () =>
        (
          await q(`SELECT status FROM commission WHERE reservation_id = $1 AND status <> 'void'`, [
            b.id,
          ])
        )[0]?.status;
      expect(await commission()).toBe('projected');
      // FD/FDL see every pending cash of SAL/CTV (own_or_cash_handover) – not other FD transfers.
      const fdList = await c('fd2').get(`${P(t)}/payments?method=cash&recordedByRole=sales_staff`);
      expect(fdList.statusCode, fdList.body).toBe(200);
      expect(fdList.json().data.map((x: { id: string }) => x.id)).toContain(p!.id);
      const other = (
        await pay('fd', b, { type: 'charge', method: 'bank_transfer', amountVnd: 10_000 })
      ).json();
      expect(
        (await c('fd2').get(`${P(t)}/payments`)).json().data.map((x: { id: string }) => x.id),
      ).not.toContain(other.id);
      expect(
        (await c('fd').get(`${P(t)}/payments`)).json().data.map((x: { id: string }) => x.id),
      ).toContain(other.id);

      // input.stay: the guest checked out, paid in full – the sale's cash is still not handed over
      // (DOM BE-15 / SM-11: earned needs the payee's own receipts reconciled).
      expect(await checkoutPaid(b)).toBe(0);
      expect(await commission()).toBe(
        (o.expected as { recorderCommissionAtCheckout: string }).recorderCommissionAtCheckout,
      );
      const handover = (who: string, body: Record<string, unknown>) =>
        c(who).send('POST', `${P(t)}/payments/${p!.id}/actions/confirm-cash-handover`, body, {
          'if-match': `"${p!.version}"`,
        });
      // Attempt 1: the sale confirms her own cash → refused (rejected_self_confirm).
      expect((await handover('sal', { result: 'received' })).statusCode).toBe(403);
      expect(
        (await handover('fd2', { result: 'short', receivedAmountVnd: 1_000_000 })).json().errors,
      ).toEqual([{ field: 'note', code: 'REASON_REQUIRED' }]);
      const ok = await handover('fd2', { result: 'received' });
      expect(ok.statusCode, ok.body).toBe(200);
      expect(ok.json()).toMatchObject({ reconciliation: 'reconciled' });
      expect(
        (await q('SELECT reconciled_by FROM payment WHERE id = $1', [p!.id]))[0]!.reconciled_by,
      ).toBe(t.users.fd2!.id);
      expect(await commission()).toBe(
        (o.expected as { recorderCommission: string }).recorderCommission,
      );
      expect(
        Number(
          (
            await q(
              `SELECT amount_vnd FROM commission WHERE reservation_id = $1 AND status = 'earned'`,
              [b.id],
            )
          )[0]?.amount_vnd,
        ),
      ).toBe((o.expected as { commissionVnd: number }).commissionVnd);
      // Not a SAL/CTV cash → 409.
      expect(
        (
          await c('fd2').send(
            'POST',
            `${P(t)}/payments/${other.id}/actions/confirm-cash-handover`,
            { result: 'received' },
            {
              'if-match': `"${other.version}"`,
            },
          )
        ).statusCode,
      ).toBe(409);
      // CHECK payment_cash_handover_not_self_check (owner exception never applies to cash handed over).
      await expect(
        q(`UPDATE payment SET self_reconciled = true WHERE id = $1`, [p!.id]),
      ).rejects.toMatchObject({ code: '23514' });
    });

    it('listPayments: default pending, 92-day range, overdue flag after bank_reconcile_alert_days (oracle BR-527-01)', async () => {
      const b = await booking();
      const p = (
        await pay('fd', b, { type: 'charge', method: 'bank_transfer', amountVnd: 30_000 })
      ).json();
      const list = await c('mgr').get(`${P(t)}/payments`);
      const item = list.json().data.find((x: { id: string }) => x.id === p.id);
      expect(item).toMatchObject({
        reconciliation: 'pending',
        pendingDays: 0,
        reconcileOverdue: false,
        hasAttachment: false,
      });
      expect(
        (
          await c('mgr').get(`${P(t)}/payments?receivedFrom=2026-01-01&receivedTo=2026-10-15`)
        ).json().errors,
      ).toEqual([{ field: 'receivedTo', code: 'DATE_RANGE_TOO_LONG' }]);
      const o = oracle('BR-527-01');
      const hours =
        (Date.parse(String((o.expected as { attentionAt: string }).attentionAt)) -
          Date.parse(String((o.input as { recordedAt: string }).recordedAt))) /
        3_600_000;
      fa.clock.set(new Date(T0.getTime() + hours * 3_600_000));
      await refreshSessions(db, t, fa.clock.now());
      const later = (await c('mgr').get(`${P(t)}/payments`))
        .json()
        .data.find((x: { id: string }) => x.id === p.id);
      expect(later).toMatchObject({ reconcileOverdue: true, pendingDays: 2 });
      fa.clock.set(T0);
      await refreshSessions(db, t, T0);
    });

    it('reversePayment (US-119 AC3): MGR+, reason, reversal row, original reversed, balance back; twice → 409', async () => {
      const b = await booking();
      const due = (await folio(b)).totals.balanceDueVnd;
      const p = (await pay('fd', b, { type: 'charge', method: 'cash', amountVnd: 300_000 })).json();
      const rev = (who: string, body: Record<string, unknown>) =>
        c(who).send('POST', `${P(t)}/payments/${p.id}/actions/reverse`, body);
      expect((await rev('fd', { reason: 'Ghi nhầm' })).statusCode).toBe(403);
      expect((await rev('mgr', { reason: 'x' })).json().errors).toEqual([
        { field: 'reason', code: 'REASON_REQUIRED' },
      ]);
      const ok = await rev('mgr', { reason: 'Ghi nhầm số tiền' });
      expect(ok.statusCode, ok.body).toBe(200);
      expect(ok.json().status).toBe('reversed');
      const rows = await q(`SELECT amount_vnd, status FROM payment WHERE reversal_of_id = $1`, [
        p.id,
      ]);
      expect(rows).toEqual([{ amount_vnd: -300_000, status: 'succeeded' }]);
      expect((await folio(b)).totals.balanceDueVnd).toBe(due);
      expect((await rev('mgr', { reason: 'Ghi nhầm số tiền' })).statusCode).toBe(409);
    });

    it('SEC I5: a receipt image starts its retention when the payment is reconciled (cash at the desk: at once)', async () => {
      const b = await booking();
      const anchorOf = async (id: string) =>
        (await q(`SELECT retention_anchor_at FROM attachment WHERE id = $1`, [id]))[0]!
          .retention_anchor_at as Date | null;
      const img = await attach('fd', 'deposit_receipt', b.id);
      const p = (
        await pay('fd', b, {
          type: 'charge',
          method: 'bank_transfer',
          amountVnd: 100_000,
          attachmentId: img,
        })
      ).json();
      expect(p).toMatchObject({ reconciliation: 'pending', attachmentId: img });
      expect(await anchorOf(img)).toBeNull();
      // The same image cannot justify a second payment.
      expect(
        (
          await pay('fd', b, { type: 'charge', method: 'cash', amountVnd: 1, attachmentId: img })
        ).json().errors,
      ).toEqual([{ field: 'attachmentId', code: 'NOT_IN_LIST' }]);
      const rec = await c('mgr').send(
        'POST',
        `${P(t)}/payments/${p.id}/actions/reconcile`,
        { result: 'reconciled' },
        { 'if-match': `"${p.version}"` },
      );
      expect(rec.statusCode, rec.body).toBe(200);
      expect((await anchorOf(img))?.getTime()).toBe(fa.clock.now().getTime());
      const cashImg = await attach('fd', 'deposit_receipt', b.id);
      await pay('fd', b, {
        type: 'charge',
        method: 'cash',
        amountVnd: 1_000,
        attachmentId: cashImg,
      });
      expect((await anchorOf(cashImg))?.getTime()).toBe(fa.clock.now().getTime());
      // Disputed: kept until it is dealt with – the reversal starts the period.
      const dImg = await attach('fd', 'deposit_receipt', b.id);
      const d = (
        await pay('fd', b, {
          type: 'charge',
          method: 'bank_transfer',
          amountVnd: 2_000,
          attachmentId: dImg,
        })
      ).json();
      const disputed = await c('mgr').send(
        'POST',
        `${P(t)}/payments/${d.id}/actions/reconcile`,
        { result: 'disputed', note: 'Không thấy trên sao kê' },
        { 'if-match': `"${d.version}"` },
      );
      expect(disputed.json().reconciliation).toBe('disputed');
      expect(await anchorOf(dImg)).toBeNull();
      await c('mgr').send('POST', `${P(t)}/payments/${d.id}/actions/reverse`, {
        reason: 'Không có tiền',
      });
      expect(await anchorOf(dImg)).not.toBeNull();
    });

    // ───────────────────────────── refunds ─────────────────────────────

    it('BR-522-01 / A47a: request → cash destination → approval → FD afternoon pays; requester/over/transfer refused; CHECK DB', async () => {
      const o = oracle('BR-522-01');
      const approved = (o.input as { refundApprovedVnd: number }).refundApprovedVnd;
      const b = await booking();
      const due = (await folio(b)).totals.balanceDueVnd as number;
      await pay('fd', b, {
        type: 'charge',
        method: 'cash',
        amountVnd: due + approved,
        note: 'Khách trả dư',
      });
      expect((await folio(b)).totals.creditVnd).toBe(approved);

      const create = (who: string, amountVnd: number) =>
        c(who).send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
          amountVnd,
          reason: 'Trả dư tiền phòng',
        });
      expect((await create('fd', approved + 1)).json().errors).toEqual([
        { field: 'amountVnd', code: 'REFUND_EXCEEDS_APPROVED' },
      ]);
      expect((await create('sal', 1)).statusCode).toBe(403);
      const reqRes = await create('fd', approved); // fd = "fd_morning"
      expect(reqRes.statusCode, reqRes.body).toBe(201);
      const r = reqRes.json();
      expect(r).toMatchObject({
        type: 'refund',
        status: 'pending',
        amountVnd: approved,
        refundedVnd: 0,
      });
      // A second request cannot exceed what is left.
      expect((await create('fd', 1)).json().errors).toEqual([
        { field: 'amountVnd', code: 'REFUND_EXCEEDS_APPROVED' },
      ]);

      // Destination: trusted device only (C3 flow).
      const dest = (who: string, body: Record<string, unknown>, device: string | null) =>
        new Client(fa, t.users[who]!.sessionToken, device).send(
          'PUT',
          `${P(t)}/approval-requests/${r.id}/refund-destination`,
          body,
        );
      expect((await dest('fd', { method: 'cash' }, null)).json().code).toBe('DEVICE_NOT_TRUSTED');
      const device = await t.deviceToken();
      const set = await dest('fd', { method: 'cash' }, device);
      expect(set.statusCode, set.body).toBe(200);
      expect(set.headers['cache-control']).toBe('no-store');
      expect(set.json().refundDestination).toMatchObject({ method: 'cash' });

      const exec = (
        who: string,
        path: string,
        amountVnd: number,
        extra: Record<string, unknown> = {},
      ) =>
        c(who).send('POST', `${P(t)}/approval-requests/${r.id}/actions/${path}`, {
          amountVnd,
          paidAt: T0.toISOString(),
          attachmentId: uuidv7(),
          ...extra,
        });
      // Not approved yet.
      expect((await exec('fd2', 'execute-cash-refund', approved)).statusCode).toBe(409);
      const approve = await c('owner').send(
        'POST',
        `${P(t)}/approval-requests/${r.id}/actions/approve`,
        {
          authMethod: 'password',
          secret: TEST_PASSWORD,
        },
      );
      expect(approve.statusCode, approve.body).toBe(200);
      expect(
        (await outbox('refund_ready')).some((x) =>
          (x.payload as { userIds: string[] }).userIds.includes(t.users.fd!.id),
        ),
      ).toBe(true);

      const results: string[] = [];
      // attempt 2: the requester pays herself.
      const selfPay = await exec('fd', 'execute-cash-refund', approved);
      results.push(
        selfPay.json().code === 'SELF_REFUND_FORBIDDEN'
          ? 'rejected_self_requested'
          : String(selfPay.statusCode),
      );
      // attempt 3: transfer is manager only.
      const transfer = await exec('fd2', 'execute-refund', approved, { bankReference: 'FT1' });
      results.push(
        transfer.statusCode === 403
          ? 'rejected_transfer_manager_only'
          : String(transfer.statusCode),
      );
      // attempt 4: more than approved.
      const over = await exec('fd2', 'execute-cash-refund', approved + 50_000);
      results.push(
        over.json().errors?.[0]?.code === 'REFUND_EXCEEDS_APPROVED'
          ? 'rejected_over_approved'
          : String(over.statusCode),
      );
      // Receipt image is mandatory for cash.
      expect(
        (await exec('fd2', 'execute-cash-refund', approved, { attachmentId: undefined })).json()
          .errors,
      ).toEqual([{ field: 'attachmentId', code: 'EVIDENCE_REQUIRED' }]);
      // attempt 1: FD afternoon pays with the signed receipt.
      const paid = await exec('fd2', 'execute-cash-refund', approved, {
        attachmentId: await attach('fd2', 'refund_proof', b.id),
      });
      results.unshift(paid.statusCode === 201 ? 'paid' : String(paid.statusCode));
      expect(results).toEqual((o.expected as { attemptResults: string[] }).attemptResults);
      expect(paid.json()).toMatchObject({
        type: 'refund',
        method: 'cash',
        amountVnd: -approved,
        reconciliation: 'not_required',
        approvalRequestId: r.id,
      });
      const f = await folio(b);
      expect(f.totals).toMatchObject({
        balanceDueVnd: (o.expected as { balanceAfterVnd: number }).balanceAfterVnd,
        creditVnd: 0,
      });
      expect((await exec('fd2', 'execute-cash-refund', 1)).statusCode).toBe(409);
      // CHECK payment_refund_not_requester_check: a refund row written by the requester is refused by the DB.
      await expect(
        q(
          `INSERT INTO payment (id, organization_id, property_id, code, folio_id, type, method, reconciliation, amount_vnd,
           status, recorded_by, recorded_by_role, approval_request_id, approval_requested_by, created_at, updated_at)
         VALUES ($1, $2, $3, 'PT-X', $4, 'refund', 'cash', 'not_required', -1, 'succeeded', $5, 'front_desk', $6, $5,
           now(), now())`,
          [uuidv7(), t.organizationId, t.propertyIds[0], b.folioId, t.users.fd!.id, r.id],
        ),
      ).rejects.toMatchObject({ code: '23514', constraint: 'payment_refund_not_requester_check' });
      // SEC F8: nobody approves the refund they asked for – owner included.
      const own = await create('owner', 1);
      expect(own.statusCode).toBe(422); // nothing left to refund on this folio
    });

    it('A47 transfer refund: Luhn refused, destination C3 masked, change after approval → pending, step-up view logged, pay-out shreds the key', async () => {
      const b = await booking();
      const due = (await folio(b)).totals.balanceDueVnd as number;
      const src = (
        await pay('fd', b, {
          type: 'charge',
          method: 'bank_transfer',
          amountVnd: due + 500_000,
          note: 'Chuyển dư',
        })
      ).json();
      const r = (
        await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
          amountVnd: 500_000,
          reason: 'Hoàn tiền chuyển dư',
        })
      ).json();
      const device = await t.deviceToken();
      const dest = (body: Record<string, unknown>) =>
        new Client(fa, t.users.fd!.sessionToken, device).send(
          'PUT',
          `${P(t)}/approval-requests/${r.id}/refund-destination`,
          body,
        );
      expect((await dest({ method: 'bank_transfer', bankBin: '970436' })).json().errors).toEqual([
        { field: 'accountNo', code: 'REQUIRED' },
        { field: 'accountHolder', code: 'REQUIRED' },
      ]);
      const card = await dest({
        method: 'bank_transfer',
        bankBin: '970436',
        accountNo: '4111111111111111',
        accountHolder: 'NGUYEN VAN A',
      });
      expect(card.json().code).toBe('CARD_NUMBER_DETECTED');
      const ok = await dest({
        method: 'bank_transfer',
        bankBin: '970436',
        accountNo: '0071000123457',
        accountHolder: 'NGUYEN VAN A',
      });
      expect(ok.statusCode, ok.body).toBe(200);
      expect(ok.json().refundDestination).toMatchObject({
        method: 'bank_transfer',
        bankBin: '970436',
        accountNoLast4: '3457',
      });
      expect(ok.body).not.toContain('0071000123457');
      const [row] = await q(
        `SELECT refund_account_enc, refund_account_last4 FROM approval_request WHERE id = $1`,
        [r.id],
      );
      expect(Buffer.isBuffer(row!.refund_account_enc)).toBe(true);
      expect(String(row!.refund_account_enc)).not.toContain('0071000123457');
      const idem = await q(
        `SELECT request_hash, response_body::text AS body FROM idempotency_key WHERE path LIKE $1`,
        [`%${r.id}%`],
      );
      for (const x of idem) expect(String(x.body)).not.toContain('0071000123457');

      const approve = () =>
        c('owner').send('POST', `${P(t)}/approval-requests/${r.id}/actions/approve`, {
          authMethod: 'password',
          secret: TEST_PASSWORD,
        });
      expect((await approve()).statusCode).toBe(200);
      // SEC F8: changing the destination after approval needs a new approval.
      const changed = await dest({
        method: 'bank_transfer',
        bankBin: '970436',
        accountNo: '0071000654321',
        accountHolder: 'NGUYEN VAN A',
      });
      expect(changed.json().status).toBe('pending');
      expect((await approve()).statusCode).toBe(200);

      // getRefundDestination: device + step-up window (401 REAUTH_REQUIRED) + c3 view logged first.
      const view = (who: string) =>
        new Client(fa, t.users[who]!.sessionToken, device).get(
          `${P(t)}/approval-requests/${r.id}/refund-destination`,
        );
      expect((await view('fd')).statusCode).toBe(403);
      const noStep = await view('mgr');
      expect(noStep.statusCode).toBe(401);
      expect(noStep.json().code).toBe('REAUTH_REQUIRED');
      const step = await c('mgr').send('POST', '/v1/me/step-up', { password: TEST_PASSWORD });
      expect(step.statusCode, step.body).toBe(200);
      expect(step.json().validUntil).toBeTruthy();
      const full = await view('mgr');
      expect(full.statusCode, full.body).toBe(200);
      expect(full.json()).toEqual({
        method: 'bank_transfer',
        bankBin: '970436',
        accountNo: '0071000654321',
        accountHolder: 'NGUYEN VAN A',
      });
      expect(full.headers['cache-control']).toBe('no-store');
      const logs = await q(
        `SELECT action FROM c3_access_log WHERE subject_type = 'refund_account' AND subject_id = $1 ORDER BY occurred_at, id`,
        [r.id],
      );
      expect(logs.map((l) => l.action)).toEqual(['create', 'update', 'view']);

      const exec = (who: string, extra: Record<string, unknown>) =>
        c(who).send('POST', `${P(t)}/approval-requests/${r.id}/actions/execute-refund`, {
          amountVnd: 500_000,
          paidAt: T0.toISOString(),
          ...extra,
        });
      // E15-05 / DOM BE-14 c: the overpayment comes from a transfer not reconciled yet → nothing paid out.
      const early = await exec('mgr', {
        bankReference: 'FT26290001',
        attachmentId: await attach('mgr', 'refund_proof', b.id),
      });
      expect(early.statusCode, early.body).toBe(409);
      expect(early.json()).toMatchObject({
        code: 'REFUND_SOURCE_NOT_RECONCILED',
        paymentIds: [src.id],
        unreconciledVnd: 500_000,
      });
      const recSrc = await c('owner').send(
        'POST',
        `${P(t)}/payments/${src.id}/actions/reconcile`,
        { result: 'reconciled' },
        { 'if-match': `"${src.version}"` },
      );
      expect(recSrc.statusCode, recSrc.body).toBe(200);
      expect((await exec('mgr', {})).json().errors).toEqual([
        { field: 'bankReference', code: 'REQUIRED' },
        { field: 'attachmentId', code: 'EVIDENCE_REQUIRED' },
      ]);
      expect(
        (
          await c('fd2').send(
            'POST',
            `${P(t)}/approval-requests/${r.id}/actions/execute-cash-refund`,
            {
              amountVnd: 1,
              paidAt: T0.toISOString(),
              attachmentId: uuidv7(),
            },
          )
        ).statusCode,
      ).toBe(409); // destination is a transfer → executeRefund
      const paid = await exec('mgr', {
        bankReference: 'FT26290001',
        attachmentId: await attach('mgr', 'refund_proof', b.id),
      });
      expect(paid.statusCode, paid.body).toBe(201);
      expect(paid.json()).toMatchObject({
        method: 'bank_transfer',
        reconciliation: 'pending',
        amountVnd: -500_000,
      });
      const [after] = await q(
        `SELECT refund_account_enc, refunded_vnd FROM approval_request WHERE id = $1`,
        [r.id],
      );
      expect(after).toEqual({ refund_account_enc: null, refunded_vnd: 500_000 });
      expect(
        (
          await q(`SELECT action FROM c3_access_log WHERE subject_id = $1 AND action = 'purge'`, [
            r.id,
          ])
        ).length,
      ).toBe(1);
      // The payer of a transfer refund cannot reconcile it (A46, G-14).
      const p = paid.json();
      expect(
        (
          await c('mgr').send(
            'POST',
            `${P(t)}/payments/${p.id}/actions/reconcile`,
            { result: 'reconciled' },
            { 'if-match': `"${p.version}"` },
          )
        ).json().code,
      ).toBe('SELF_RECONCILE_FORBIDDEN');
    });

    it('SEC F8: a manager cannot approve the refund they requested', async () => {
      const b = await booking();
      const due = (await folio(b)).totals.balanceDueVnd as number;
      await pay('fd', b, {
        type: 'charge',
        method: 'cash',
        amountVnd: due + 100_000,
        note: 'Trả dư',
      });
      const r = await c('owner').send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
        amountVnd: 100_000,
        reason: 'Hoàn dư',
      });
      expect(r.statusCode, r.body).toBe(201);
      expect(r.json().status).toBe('pending'); // never self-applied
      const self = await c('owner').send(
        'POST',
        `${P(t)}/approval-requests/${r.json().id}/actions/approve`,
        {
          authMethod: 'password',
          secret: TEST_PASSWORD,
        },
      );
      expect(self.statusCode).toBe(403);
      expect(self.json().code).toBe('SELF_APPROVAL_FORBIDDEN');
    });

    // ───────────────────────────── confirmDeposit B-29 ─────────────────────────────

    it('B-29 / DOM BE-11: acceptShortfallReason – MGR+ only, needs money received, confirms with shortfall + audit + OWN push', async () => {
      const b = await booking({ deposit: null });
      const confirm = (who: string, body: Record<string, unknown>) =>
        c(who).send('POST', `${P(t)}/reservations/${b.id}/actions/confirm-deposit`, body, {
          'if-match': `"${b.version}"`,
        });
      expect(
        (await confirm('fd', { existingPaymentId: uuidv7(), acceptShortfallReason: 'Khách quen' }))
          .statusCode,
      ).toBe(403);
      const part = await confirm('fd', {
        payment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
      });
      expect(part.json().status).toBe('hold');
      b.version = part.json().version;
      const [pid] = await q(`SELECT id FROM payment WHERE folio_id = $1`, [b.folioId]);
      const ok = await confirm('mgr', {
        existingPaymentId: pid!.id,
        acceptShortfallReason: 'Khách quen, cọc phần còn lại khi đến',
      });
      expect(ok.statusCode, ok.body).toBe(200);
      expect(ok.json().status).toBe('confirmed');
      const [r] = await q(
        `SELECT deposit_shortfall_vnd, deposit_required_vnd, deposit_shortfall_accepted_by FROM reservation WHERE id = $1`,
        [b.id],
      );
      expect(r).toMatchObject({
        deposit_shortfall_vnd: Number(r!.deposit_required_vnd) - 500_000,
        deposit_shortfall_accepted_by: t.users.mgr!.id,
      });
      const a = await q(
        `SELECT category, after FROM audit_event WHERE action = 'deposit.shortfall_accepted' AND entity_id = $1`,
        [b.id],
      );
      expect(a[0]).toMatchObject({
        category: 'money',
        after: { shortfallVnd: Number(r!.deposit_required_vnd) - 500_000 },
      });
      expect((await outbox('deposit_shortfall_accepted')).length).toBeGreaterThan(0);
    });

    it('B-29: any received amount > 0 can be accepted by a manager', async () => {
      const b = await booking({ deposit: null });
      const r = await c('mgr').send(
        'POST',
        `${P(t)}/reservations/${b.id}/actions/confirm-deposit`,
        {
          payment: { type: 'deposit', method: 'cash', amountVnd: 1 },
          acceptShortfallReason: 'Khách quen',
        },
        { 'if-match': `"${b.version}"` },
      );
      // 1 VND received → accepted (money > 0).
      expect(r.statusCode, r.body).toBe(200);
    });

    // ───────────────────────────── folio lines, bill, invoice ─────────────────────────────

    it('charge catalogue + addFolioLine: BR-511-02 (700.000 with evidence), BR-507-01 laundry 2.5 kg, PRICE_NOT_EDITABLE, damage outside table → approval', async () => {
      const cat = (await c('fd').get(`${P(t)}/charge-catalog`)).json().data as Array<
        Record<string, unknown>
      >;
      expect(cat.find((x) => x.code === 'smoking_fee')).toMatchObject({
        defaultUnitPriceVnd: 500_000,
        evidenceRequired: true,
        priceEditable: false,
        category: 'penalty',
      });
      expect(cat.find((x) => x.code === 'damage.bath_towel')).toMatchObject({
        defaultUnitPriceVnd: 150_000,
        category: 'damage',
      });
      expect(cat.find((x) => x.code === 'fnb')).toMatchObject({ priceEditable: true });
      expect((await c('hk').get(`${P(t)}/charge-catalog`)).statusCode).toBe(403);

      const b = await booking();
      await inHouse(b);
      const add = (body: Record<string, unknown>, who = 'fd') =>
        c(who).send('POST', `${P(t)}/folios/${b.folioId}/lines`, {
          serviceDate: b.arrivalDate,
          ...body,
        });
      // serviceDate outside the stay is refused.
      expect(
        (
          await add({
            chargeCode: 'smoking_fee',
            quantity: 1,
            note: 'Ảnh buồng phòng',
            serviceDate: '2026-10-15',
          })
        ).json().errors,
      ).toEqual(expect.arrayContaining([{ field: 'serviceDate', code: 'DATE_INVALID' }]));
      const due0 = (await folio(b)).totals.balanceDueVnd as number;
      expect((await add({ chargeCode: 'smoking_fee', quantity: 1 })).json().errors).toEqual([
        { field: 'evidenceAttachmentIds', code: 'EVIDENCE_REQUIRED' },
      ]);
      expect(
        (
          await add({ chargeCode: 'smoking_fee', quantity: 1, unitPriceVnd: 1, note: 'Mùi thuốc' })
        ).json().errors,
      ).toEqual([{ field: 'unitPriceVnd', code: 'PRICE_NOT_EDITABLE' }]);
      const o511 = oracle('BR-511-02');
      expect(
        (await add({ chargeCode: 'smoking_fee', quantity: 1, note: 'Mùi thuốc lá nặng' }))
          .statusCode,
      ).toBe(201);
      const key = await add({
        chargeCode: 'key_card_fee',
        quantity: 1,
        evidenceAttachmentIds: [await attach('fd', 'penalty_evidence', b.id)],
      });
      expect(key.statusCode, key.body).toBe(201);
      expect(key.json().totals.balanceDueVnd - due0).toBe(
        (o511.expected as { penaltyVnd: number }).penaltyVnd,
      );
      const o507 = oracle('BR-507-01');
      const kg = (o507.input as { weightGrams: number }).weightGrams / 1000;
      const laundry = await add({ chargeCode: 'laundry', quantity: kg });
      expect(laundry.statusCode, laundry.body).toBe(201);
      expect(
        laundry.json().lines.find((l: { category: string }) => l.category === 'laundry').amountVnd,
      ).toBe((o507.expected as { amountVnd: number }).amountVnd);
      expect(
        (await add({ chargeCode: 'adhoc_cleaning_fee', quantity: 1.5 })).json().errors,
      ).toEqual([{ field: 'quantity', code: 'VALUE_OUT_OF_RANGE' }]);
      expect(
        (await add({ category: 'fnb', description: 'Bữa sáng', quantity: 2 })).json().errors,
      ).toEqual([{ field: 'unitPriceVnd', code: 'REQUIRED' }]);
      expect(
        (await add({ category: 'room', description: 'x', quantity: 1, unitPriceVnd: 1 })).json()
          .errors,
      ).toEqual(expect.arrayContaining([{ field: 'category', code: 'NOT_IN_LIST' }]));
      // Damage outside the table: pending until a manager prices it (US-032 AC4).
      const dmg = await add({
        category: 'damage',
        description: 'Vỡ đèn ngủ',
        quantity: 1,
        proposedUnitPriceVnd: 400_000,
        note: 'Ảnh đính kèm',
      });
      expect(dmg.statusCode, dmg.body).toBe(201);
      const line = dmg.json().lines.find((l: { category: string }) => l.category === 'damage');
      expect(line).toMatchObject({
        lineState: 'pending_approval',
        approvalRequestId: expect.any(String),
      });
      expect(dmg.json().totals.balanceDueVnd).toBe(key.json().totals.balanceDueVnd + 75_000);
      const appr = await c('mgr').send(
        'POST',
        `${P(t)}/approval-requests/${line.approvalRequestId}/actions/approve`,
        {
          authMethod: 'password',
          secret: TEST_PASSWORD,
        },
      );
      expect(appr.statusCode, appr.body).toBe(200);
      const f = await folio(b);
      expect(f.lines.find((l: { id: string }) => l.id === line.id).lineState).toBe('posted');
      // Money audit of every posting.
      expect(
        (
          await q(
            `SELECT count(*)::int AS n FROM audit_event
              WHERE action = 'folio.line_posted' AND entity_type = 'folio_line' AND entity_code = $1`,
            [b.code],
          )
        )[0]!.n,
      ).toBe(4);
    });

    it('adjustFolioLine (BR-008) + getBill (G-12, BR-434-01): reversal + new line, reversed pair not printed, FOC right under its line', async () => {
      const b = await booking();
      await inHouse(b);
      let f = await folio(b);
      const added = await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/lines`, {
        category: 'service_fee',
        description: 'Đưa đón sân bay',
        quantity: 1,
        unitPriceVnd: 300_000,
        serviceDate: b.arrivalDate,
      });
      f = added.json();
      const svc = f.lines.find((l: { category: string }) => l.category === 'service_fee');
      const adjust = (body: Record<string, unknown>, ifMatch: string, who = 'fd') =>
        c(who).send('POST', `${P(t)}/folios/${b.folioId}/lines/${svc.id}/adjustments`, body, {
          'if-match': ifMatch,
        });
      expect(
        (await adjust({ newUnitPriceVnd: 250_000, reason: 'Giảm theo thỏa thuận' }, '"999"'))
          .statusCode,
      ).toBe(412);
      const adj = await adjust(
        { newUnitPriceVnd: 250_000, reason: 'Giảm theo thỏa thuận' },
        added.headers.etag as string,
      );
      expect(adj.statusCode, adj.body).toBe(201);
      f = adj.json();
      const rev = f.lines.find((l: { reversalOfId?: string }) => l.reversalOfId === svc.id);
      expect(rev).toMatchObject({ amountVnd: -300_000 });
      const svcLines = f.lines.filter(
        (l: { category: string; reversalOfId?: string }) => l.category === 'service_fee',
      );
      expect(svcLines).toHaveLength(3);
      expect(
        (await adjust({ newUnitPriceVnd: 1, reason: 'lần hai' }, adj.headers.etag as string))
          .statusCode,
      ).toBe(409);
      // BR-434-01: late checkout 210.000 + FOC (manager self-applies within limit) → net 0, FOC printed right below.
      const o = oracle('BR-434-01');
      const late = (
        await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/lines`, {
          category: 'service_fee',
          description: 'late_checkout',
          quantity: 1,
          unitPriceVnd: (o.input as { chargeVnd: number }).chargeVnd,
          serviceDate: addDays(b.arrivalDate, 1),
        })
      )
        .json()
        .lines.find(
          (l: { unitPriceVnd: number; category: string }) =>
            l.category === 'service_fee' && l.unitPriceVnd === 210_000,
        );
      // Owner self-applies (unlimited, BR-433) → posted at once.
      const foc = await c('owner').send(
        'POST',
        `${P(t)}/folios/${b.folioId}/lines/${late.id}/foc`,
        {
          kind: 'foc',
          amountVnd: 210_000,
          reasonCode: 'regular_vip',
          note: 'Khách quen',
        },
      );
      expect(foc.statusCode, foc.body).toBe(201);
      const bill = await c('fd').get(`${P(t)}/folios/${b.folioId}/bill`);
      expect(bill.statusCode, bill.body).toBe(200);
      const lines = bill.json().lines as Array<{
        id: string;
        category: string;
        amountVnd: number;
        relatedLineId?: string;
      }>;
      expect(lines.some((l) => l.id === svc.id || l.id === rev.id)).toBe(false); // G-12
      const iLate = lines.findIndex((l) => l.id === late.id);
      expect(lines[iLate + 1]).toMatchObject({
        category: 'foc',
        amountVnd: -210_000,
        relatedLineId: late.id,
      });
      expect(lines[iLate]!.amountVnd + lines[iLate + 1]!.amountVnd).toBe(
        (o.expected as { netVnd: number }).netVnd,
      );
      expect(bill.json()).toMatchObject({
        locale: 'vi',
        paymentModel: 'direct',
        billNo: null,
        vietqrTransferContent: b.code.replace(/-/g, ''),
      });
      expect(bill.json().usdReference).toBeUndefined();
      // Room nights printed per night for a direct booking.
      expect(lines.filter((l) => l.category === 'room')).toHaveLength(7);
      expect((await c('sal').get(`${P(t)}/folios/${b.folioId}/bill`)).statusCode).toBe(403);
    });

    it('getBill G-13 (ota_prepaid hides nights, one note) + locale vi_en with USD reference (BR-004-01 rate)', async () => {
      const b = await booking();
      const [g] = await q(`SELECT booker_guest_id FROM reservation WHERE id = $1`, [b.id]);
      await q(`UPDATE guest SET nationality_code = 'RU' WHERE id = $1`, [g!.booker_guest_id]);
      await q(`UPDATE reservation SET payment_model = 'ota_prepaid' WHERE id = $1`, [b.id]);
      // Verification 17/10: without the system receipt nothing is hidden and no "Đã thu qua OTA" is printed.
      const raw = (await c('fd').get(`${P(t)}/folios/${b.folioId}/bill`)).json();
      expect(raw.otaPrepaidNote ?? null).toBeNull();
      expect(raw.lines.some((l: { category: string }) => l.category === 'room')).toBe(true);
      await resync(b); // the night sync writes the `ota_collect` receipt (x-ota-prepaid-rule)
      const bill = (await c('fd').get(`${P(t)}/folios/${b.folioId}/bill`)).json();
      expect(bill.paymentModel).toBe('ota_prepaid');
      expect(bill.lines.filter((l: { category: string }) => l.category === 'room')).toHaveLength(0);
      expect(bill.otaPrepaidNote).toContain('Đã thu qua');
      expect(bill.otaPrepaidVnd).toBeGreaterThan(0);
      expect(bill.locale).toBe('vi_en');
      expect(bill.usdReference.rate).toBe(26_200); // DS-E fx_usd_vnd (BR-004-01 rate)
      expect(bill.usdReference.totalUsd).toBe(Math.round((bill.totalVnd / 26_200) * 10) / 10);
      await q(`UPDATE reservation SET payment_model = 'direct' WHERE id = $1`, [b.id]);
      await resync(b);
    });

    it('setInvoiceRequest (US-039): company fields checked (V-04), stored on the folio, MISA status not_requested', async () => {
      const b = await booking();
      const put = (body: Record<string, unknown>) =>
        c('fd').send('PUT', `${P(t)}/folios/${b.folioId}/invoice-request`, body);
      expect(
        (
          await put({
            buyerType: 'company',
            companyName: 'Công ty ABC',
            taxCode: '123',
            email: 'x',
          })
        ).json().errors,
      ).toEqual([
        { field: 'taxCode', code: 'TAX_CODE_INVALID' },
        { field: 'email', code: 'EMAIL_INVALID' },
      ]);
      expect((await put({ buyerType: 'retail' })).json().errors).toEqual([
        { field: 'buyerType', code: 'NOT_IN_LIST' },
      ]);
      const ok = await put({
        buyerType: 'company',
        companyName: 'Công ty TNHH ABC',
        taxCode: '0312345678-001',
        email: 'ketoan@abc.example',
      });
      expect(ok.statusCode, ok.body).toBe(200);
      expect(ok.json()).toEqual({
        buyerType: 'company',
        companyName: 'Công ty TNHH ABC',
        taxCode: '0312345678-001',
        email: 'ketoan@abc.example',
        einvoiceStatus: 'not_requested',
      });
      expect((await folio(b)).invoiceRequest).toMatchObject({ buyerType: 'company' });
      const ind = await put({ buyerType: 'individual' });
      expect(ind.json()).toEqual({ buyerType: 'individual', einvoiceStatus: 'not_requested' });
    });

    // ───────────────────────────── minibar + settle (clock moves) ─────────────────────────────

    it('FolioPort.settle (B18 for BE-A): bill number F{yy}-, post-checkout window (BR-427): FD posts a late charge flagged, FD cannot adjust a settled folio', async () => {
      const b = await booking();
      await inHouse(b);
      const folios = fa.app.get(FolioService);
      const out = await db.withContext(
        { ...t.ctx(), userId: t.users.fd!.id, actorType: 'user' },
        (tx) => folios.settle(tx, b.folioId, { userId: t.users.fd!.id }),
      );
      expect(out.billNo).toMatch(/^F\d{2}-\d+$/);
      expect(out.postCheckoutWindowUntil.getTime() - out.settledAt.getTime()).toBe(24 * 3_600_000);
      const f = await folio(b);
      expect(f).toMatchObject({ status: 'settled', billNo: out.billNo });
      const late = await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/lines`, {
        category: 'fnb',
        description: 'Nước uống mang đi',
        quantity: 1,
        unitPriceVnd: 20_000,
        serviceDate: (
          await q(`SELECT departure_date::text AS d FROM reservation WHERE id = $1`, [b.id])
        )[0]!.d,
      });
      expect(late.statusCode, late.body).toBe(201);
      expect(
        (
          await q(`SELECT post_checkout FROM folio_line WHERE folio_id = $1 AND category = 'fnb'`, [
            b.folioId,
          ])
        )[0],
      ).toEqual({ post_checkout: true });
      const line = late.json().lines.find((l: { category: string }) => l.category === 'fnb');
      const adj = (who: string) =>
        c(who).send(
          'POST',
          `${P(t)}/folios/${b.folioId}/lines/${line.id}/adjustments`,
          { voidLine: true, reason: 'Ghi nhầm' },
          { 'if-match': late.headers.etag as string },
        );
      expect((await adj('fd')).statusCode).toBe(403);
      expect((await adj('mgr')).statusCode).toBe(201);
      // QR content after checkout = bill number without dash (BR-521).
      const bill = (await c('fd').get(`${P(t)}/folios/${b.folioId}/bill`)).json();
      expect(bill.vietqrTransferContent).toBe(out.billNo.replace(/-/g, ''));
      // Window over → FOLIO_LOCKED.
      fa.clock.set(new Date(out.postCheckoutWindowUntil.getTime() + 60_000));
      await refreshSessions(db, t, fa.clock.now());
      const locked = await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/lines`, {
        category: 'fnb',
        description: 'Muộn',
        quantity: 1,
        unitPriceVnd: 1_000,
        serviceDate: (
          await q(`SELECT departure_date::text AS d FROM reservation WHERE id = $1`, [b.id])
        )[0]!.d,
      });
      expect(locked.json().code).toBe('FOLIO_LOCKED');
    });
    it('minibar (US-035, BR-702-01): HK counts on departure day without prices, incomplete/over refused, recount reverses old lines', async () => {
      const b = await booking();
      await inHouse(b);
      const [r] = await q(`SELECT departure_date::text AS d FROM reservation WHERE id = $1`, [
        b.id,
      ]);
      // HK scope "today": a checkout count only on the departure day.
      expect((await c('hk').get(`${P(t)}/reservations/${b.id}/minibar-standard`)).statusCode).toBe(
        200,
      );
      const all = (left: Record<string, number> = {}) =>
        DS_E.minibarItems.map((m) => ({
          itemId: items[m.code],
          remainingQty: left[m.code] ?? m.standardQtyPerRoom,
        }));
      const record = (who: string, body: Record<string, unknown>) =>
        c(who).send('POST', `${P(t)}/reservations/${b.id}/minibar-checks`, body);
      expect((await record('hk', { mode: 'checkout', lines: all() })).statusCode).toBe(404);
      fa.clock.set(new Date(`${r!.d}T02:00:00.000Z`));
      await refreshSessions(db, t, fa.clock.now());
      const std = (await c('hk').get(`${P(t)}/reservations/${b.id}/minibar-standard`)).json();
      expect(std.items).toHaveLength(DS_E.minibarItems.length);
      expect(std.items[0].unitPriceVnd).toBeUndefined(); // rbac note 26
      expect(std.latestCheck).toBeNull();
      expect(
        (await record('hk', { mode: 'checkout', lines: all().slice(1) })).json().errors,
      ).toEqual([{ field: 'lines', code: 'MINIBAR_ITEMS_INCOMPLETE' }]);
      const over = all();
      over[0] = { ...over[0]!, remainingQty: 9 };
      expect((await record('hk', { mode: 'checkout', lines: over })).json().errors).toEqual([
        { field: 'lines[0].remainingQty', code: 'MINIBAR_QTY_OVER_STANDARD' },
      ]);
      const o = oracle('BR-702-01');
      const used = (o.input as { used: Record<string, number> }).used;
      const left = Object.fromEntries(
        Object.entries(used).map(([k, n]) => [
          k,
          DS_E.minibarItems.find((m) => m.code === k)!.standardQtyPerRoom - n,
        ]),
      );
      // FD_MINIBAR_PORT (BE-A B18 blocker) is wired to the inventory module.
      const port = fa.app.get(FrontdeskPorts, { strict: false }).minibar;
      expect(port).toBeInstanceOf(MinibarCheckoutPort);
      const [stay] = await q(
        `SELECT room_id FROM reservation_segment WHERE reservation_id = $1 AND active`,
        [b.id],
      );
      const inTx = <T>(fn: (tx: Tx) => Promise<T>) =>
        db.withContext({ ...t.ctx(), userId: t.users.fd!.id, actorType: 'user' }, fn);
      expect(await inTx((tx) => port.checkoutStatus(tx, b.id, stay!.room_id as string))).toEqual({
        required: true,
        checked: false,
      });
      const hk = await record('hk', { mode: 'checkout', lines: all(left) });
      expect(hk.statusCode, hk.body).toBe(201);
      expect(hk.json().totalVnd).toBeUndefined();
      expect(
        hk.json().lines.find((l: { itemId: string }) => l.itemId === items.nuoc),
      ).toMatchObject({ usedQty: 2, isFree: true });
      let f = await folio(b);
      const minibar = (x: typeof f) =>
        (x.lines as Array<{ category: string; amountVnd: number; lineState: string }>)
          .filter((l) => l.category === 'minibar' && l.lineState === 'posted')
          .reduce((a, l) => a + l.amountVnd, 0);
      expect(minibar(f)).toBe((o.expected as { amountVnd: number }).amountVnd);
      // FD sees the HK count pre-filled, then recounts (1 beer only) → old lines reversed.
      const fdStd = (await c('fd').get(`${P(t)}/reservations/${b.id}/minibar-standard`)).json();
      expect(fdStd.latestCheck.id).toBe(hk.json().id);
      const recount = await record('fd', { mode: 'checkout', lines: all({ bia: 1 }) });
      expect(recount.statusCode, recount.body).toBe(201);
      expect(recount.json()).toMatchObject({ replacesCheckId: hk.json().id, totalVnd: 35_000 });
      f = await folio(b);
      expect(minibar(f)).toBe(35_000);
      // B18 through the port: checked; one refill task with what was used (retry → no second task).
      expect(await inTx((tx) => port.checkoutStatus(tx, b.id, stay!.room_id as string))).toEqual({
        required: true,
        checked: true,
      });
      const taskId = await inTx((tx) => port.onCheckedOut(tx, b.id, stay!.room_id as string));
      expect(taskId).toEqual(expect.any(String));
      const [task] = await q(
        `SELECT type, quantity, refill_items, status FROM hk_task WHERE id = $1`,
        [taskId],
      );
      expect(task).toMatchObject({
        type: 'minibar_refill',
        quantity: 1,
        status: 'open',
        refill_items: [{ itemId: items.bia, quantity: 1 }],
      });
      expect(await inTx((tx) => port.onCheckedOut(tx, b.id, stay!.room_id as string))).toBeNull();
    });
    // ───────────── Sprint 3 Response & fix (DOM BE-13/14/15/21, ARC 02/11/12/13/14/32, SEC 36/37/42–45) ─────────────

    /** Earlier cases move the clock (minibar on the departure day): each case below starts at T0. */
    const atT0 = async () => {
      fa.clock.set(T0);
      await refreshSessions(db, t, T0);
    };
    /** Re-run the folio night sync the way reservations does after a change (B7/B13/B16/PATCH). */
    const resync = (b: Booking) =>
      db.withContext(t.ctx(), async (tx) => {
        const { rows } = await tx.query('SELECT * FROM reservation WHERE id = $1', [b.id]);
        const stay = await fa.app.get(ReservationsService).confirmedStay(tx, rows[0] as never);
        await fa.app.get(FolioService).resyncStay(tx, stay, { userId: null });
        return stay;
      });
    const postMinibar = (b: Booking, amountVnd: number) =>
      db.withContext({ ...t.ctx(), userId: t.users.fd!.id, actorType: 'user' }, (tx) =>
        fa.app.get(FolioService).postLines(
          tx,
          b.folioId,
          [
            {
              reservationId: b.id,
              category: 'minibar',
              description: 'Bia',
              quantity: 2,
              unitPriceVnd: amountVnd / 2,
              amountVnd,
              serviceDate: b.arrivalDate,
              source: 'minibar_check',
              labelParams: { item: 'Bia', qty: 2 },
            },
          ],
          { userId: t.users.fd!.id, reservationCode: b.code },
        ),
      );
    /** Hold confirmed by the sale with a cash deposit = the required deposit of THAT booking (rates vary by week). */
    const salBooking = async (): Promise<{ b: Booking; amount: number }> => {
      const b = await booking({ room: '202', deposit: null });
      const [h] = await q('SELECT deposit_required_vnd, version FROM reservation WHERE id = $1', [
        b.id,
      ]);
      const amount = Number(h!.deposit_required_vnd);
      const res = await c('sal').send(
        'POST',
        `${P(t)}/reservations/${b.id}/actions/confirm-deposit`,
        { payment: { type: 'deposit', method: 'cash', amountVnd: amount } },
        { 'if-match': `"${h!.version}"` },
      );
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json().status).toBe('confirmed');
      return { b, amount };
    };
    const approveAs = (who: string, id: string) =>
      c(who).send('POST', `${P(t)}/approval-requests/${id}/actions/approve`, {
        authMethod: 'password',
        secret: TEST_PASSWORD,
      });

    it('SEC-BE-36 / ARC-BE-S3-02: a reversed deposit counts 0 (not −X): VietQR cap of the hold = required deposit; re-recorded deposit confirms', async () => {
      await atT0();
      const hold = await booking({ deposit: null });
      const [h] = await q('SELECT deposit_required_vnd FROM reservation WHERE id = $1', [hold.id]);
      const required = Number(h!.deposit_required_vnd);
      const short = await c('fd').send(
        'POST',
        `${P(t)}/reservations/${hold.id}/actions/confirm-deposit`,
        { payment: { type: 'deposit', method: 'cash', amountVnd: 100_000 } },
        { 'if-match': `"${hold.version}"` },
      );
      expect(short.statusCode, short.body).toBe(200);
      const [dep] = await q(`SELECT id FROM payment WHERE folio_id = $1 AND type = 'deposit'`, [
        hold.folioId,
      ]);
      const rev = await c('mgr').send('POST', `${P(t)}/payments/${dep!.id}/actions/reverse`, {
        reason: 'Ghi nhầm số tiền',
      });
      expect(rev.statusCode, rev.body).toBe(200);
      expect(
        await db.withContext(t.ctx(), (tx) =>
          fa.app.get(FolioService).depositPaid(tx, hold.folioId),
        ),
      ).toBe(0);
      const qr = await c('fd').send('POST', `${P(t)}/folios/${hold.folioId}/vietqr`, {
        amountVnd: required + 1,
      });
      expect(qr.json()).toMatchObject({ code: 'VALIDATION_FAILED', max: required });
      // A second reversal of the same payment: refused by code (409) and by the DB (UK payment_one_reversal_key).
      expect(
        (
          await c('mgr').send('POST', `${P(t)}/payments/${dep!.id}/actions/reverse`, {
            reason: 'Đảo lần hai',
          })
        ).statusCode,
      ).toBe(409);
      const v = (await q('SELECT version FROM reservation WHERE id = $1', [hold.id]))[0]!.version;
      const full = await c('fd').send(
        'POST',
        `${P(t)}/reservations/${hold.id}/actions/confirm-deposit`,
        { payment: { type: 'deposit', method: 'cash', amountVnd: required } },
        { 'if-match': `"${v}"` },
      );
      expect(full.statusCode, full.body).toBe(200);
      expect(full.json().status).toBe('confirmed');
    });

    it('DOM BE-13 / x-ota-prepaid-rule: one system ota_collect = OTA-covered charges; desk charges stay due; resync keeps one live row; model change reverses it; bill counts the desk only', async () => {
      await atT0();
      const b = await booking();
      // No own money on this OTA booking: the desk deposit of the fixture is reversed first.
      const [dep] = await q(`SELECT id FROM payment WHERE folio_id = $1 AND type = 'deposit'`, [
        b.folioId,
      ]);
      expect(
        (
          await c('mgr').send('POST', `${P(t)}/payments/${dep!.id}/actions/reverse`, {
            reason: 'Đơn OTA trả trước – không thu cọc',
          })
        ).statusCode,
      ).toBe(200);
      await q(`UPDATE reservation SET payment_model = 'ota_prepaid' WHERE id = $1`, [b.id]);
      await resync(b);
      await postMinibar(b, 70_000);
      let f = await folio(b);
      const room = f.totals.roomVnd as number;
      expect(f.totals).toMatchObject({
        paidViaOtaVnd: room,
        balanceDueVnd: 70_000,
        creditVnd: 0,
        unhandledCreditVnd: 0,
        otaExcessVnd: 0,
      });
      const live = () =>
        q(
          `SELECT id, amount_vnd, method, provider, reconciliation, recorded_by FROM payment
            WHERE folio_id = $1 AND method = 'ota_collect' AND status = 'succeeded' AND reversal_of_id IS NULL`,
          [b.folioId],
        );
      expect(await live()).toEqual([
        expect.objectContaining({
          amount_vnd: room,
          provider: 'ota_system',
          reconciliation: 'not_required',
          recorded_by: null,
        }),
      ]);
      await resync(b); // nothing changed → no new row
      expect(await live()).toHaveLength(1);
      const bill = (await c('fd').get(`${P(t)}/folios/${b.folioId}/bill`)).json();
      expect(bill).toMatchObject({ paymentModel: 'ota_prepaid', totalVnd: 70_000, paidVnd: 0 });
      expect(bill.balanceDueVnd).toBe(70_000);
      const audit = await q(
        `SELECT action FROM audit_event WHERE entity_code = $1 AND action LIKE 'payment.ota%'`,
        [b.code],
      );
      expect(audit.map((a) => a.action)).toContain('payment.ota_collected');
      // Model back to direct → the system receipt is reversed (audit ota_collect_adjusted), full balance due.
      await q(`UPDATE reservation SET payment_model = 'direct' WHERE id = $1`, [b.id]);
      await resync(b);
      expect(await live()).toHaveLength(0);
      f = await folio(b);
      expect(f.totals.balanceDueVnd).toBe(room + 70_000);
    });

    it('DOM BE-14 / E15-05: an open refund request leaves no unhandled credit (B16 then B18 → one request); cap = unhandledCreditVnd; pay-out ≤ current credit', async () => {
      await atT0();
      const b = await booking();
      const due = (await folio(b)).totals.balanceDueVnd as number;
      await pay('fd', b, {
        type: 'charge',
        method: 'cash',
        amountVnd: due + 700_000,
        note: 'Khách trả dư',
      });
      const created = await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
        amountVnd: 700_000,
        reason: 'Trả phòng sớm – hoàn đêm không ở',
      });
      expect(created.statusCode, created.body).toBe(201);
      const r = created.json();
      let f = await folio(b);
      expect(f.totals).toMatchObject({ creditVnd: 700_000, unhandledCreditVnd: 0 });
      // What B18 reads (FolioPort.balance): nothing left to route → no second request, no blocker.
      const bal = await db.withContext(t.ctx(), (tx) =>
        fa.app.get(FolioService).balance(tx, b.folioId),
      );
      expect(bal).toMatchObject({
        creditVnd: 0,
        unhandledCreditVnd: 0,
        rawCreditVnd: 700_000,
        openRefundVnd: 700_000,
      });
      const again = await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
        amountVnd: 1,
        reason: 'Hoàn trùng',
      });
      expect(again.json()).toMatchObject({
        errors: [{ field: 'amountVnd', code: 'REFUND_EXCEEDS_APPROVED' }],
        max: 0,
      });
      const device = await t.deviceToken();
      const set = await new Client(fa, t.users.fd!.sessionToken, device).send(
        'PUT',
        `${P(t)}/approval-requests/${r.id}/refund-destination`,
        { method: 'cash' },
      );
      expect(set.statusCode, set.body).toBe(200);
      expect((await approveAs('mgr', r.id)).statusCode).toBe(200);
      // A charge after approval lowers the overpayment: pay-out ≤ credit NOW (630.000).
      await postMinibar(b, 70_000);
      f = await folio(b);
      expect(f.totals.creditVnd).toBe(630_000);
      const exec = async (amountVnd: number) =>
        c('fd2').send('POST', `${P(t)}/approval-requests/${r.id}/actions/execute-cash-refund`, {
          amountVnd,
          paidAt: T0.toISOString(),
          attachmentId: await attach('fd2', 'refund_proof', b.id),
        });
      const over = await exec(700_000);
      expect(over.json()).toMatchObject({
        errors: [{ field: 'amountVnd', code: 'REFUND_EXCEEDS_APPROVED' }],
        max: 630_000,
      });
      const paid = await exec(630_000);
      expect(paid.statusCode, paid.body).toBe(201);
      f = await folio(b);
      expect(f.totals).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
    });

    it('ARC-BE-S3-13: short cash handover – the overpayment backed by money that never arrived is not paid out (REFUND_SOURCE_NOT_RECONCILED)', async () => {
      await atT0();
      const { b, amount } = await salBooking();
      const [p] = await q(`SELECT id, version FROM payment WHERE folio_id = $1`, [b.folioId]);
      const short = await c('fd2').send(
        'POST',
        `${P(t)}/payments/${p!.id}/actions/confirm-cash-handover`,
        { result: 'short', receivedAmountVnd: amount - 600_000, note: 'Sale nộp thiếu 600.000' },
        { 'if-match': `"${p!.version}"` },
      );
      expect(short.statusCode, short.body).toBe(200);
      expect(short.json()).toMatchObject({ reconciliation: 'disputed' });
      const due = (await folio(b)).totals.balanceDueVnd as number;
      await pay('fd', b, {
        type: 'charge',
        method: 'cash',
        amountVnd: due + 300_000,
        note: 'Khách trả dư',
      });
      expect((await folio(b)).totals.creditVnd).toBe(300_000);
      const r = (
        await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
          amountVnd: 300_000,
          reason: 'Hoàn tiền dư',
        })
      ).json();
      const device = await t.deviceToken();
      await new Client(fa, t.users.fd!.sessionToken, device).send(
        'PUT',
        `${P(t)}/approval-requests/${r.id}/refund-destination`,
        { method: 'cash' },
      );
      expect((await approveAs('mgr', r.id)).statusCode).toBe(200);
      const exec = await c('fd2').send(
        'POST',
        `${P(t)}/approval-requests/${r.id}/actions/execute-cash-refund`,
        {
          amountVnd: 300_000,
          paidAt: T0.toISOString(),
          attachmentId: await attach('fd2', 'refund_proof', b.id),
        },
      );
      expect(exec.statusCode, exec.body).toBe(409);
      expect(exec.json()).toMatchObject({
        code: 'REFUND_SOURCE_NOT_RECONCILED',
        paymentIds: [p!.id],
        unreconciledVnd: 300_000,
      });
    });

    it('DOM BE-15 / SM-11 (oracles BR-527-06, BR-903-04): commission earned only at checkout, paid in full, payee receipts reconciled', async () => {
      await atT0();
      // BR-527-06: SAL cash confirmed the same day → reconciled but still projected; checkout paid → earned.
      const o6 = oracle('BR-527-06');
      const { b } = await salBooking();
      const [p] = await q(`SELECT id, version FROM payment WHERE folio_id = $1`, [b.folioId]);
      const ok = await c('fd2').send(
        'POST',
        `${P(t)}/payments/${p!.id}/actions/confirm-cash-handover`,
        { result: 'received' },
        { 'if-match': `"${p!.version}"` },
      );
      expect(ok.json().reconciliation).toBe(
        (o6.expected as { reconciliation: string }).reconciliation,
      );
      const status = async (id: string) =>
        (
          await q(
            `SELECT status, amount_vnd FROM commission WHERE reservation_id = $1 AND status <> 'void'`,
            [id],
          )
        )[0];
      expect((await status(b.id))!.status).toBe(
        (o6.expected as { recorderCommissionAfterConfirm: string }).recorderCommissionAfterConfirm,
      );
      expect(await checkoutPaid(b)).toBe(1);
      // (amount: BR-527-05 checks the oracle's 156.150 on the week-0 booking; rates differ by week here)
      expect((await status(b.id))!.status).toBe(
        (o6.expected as { recorderCommissionAfterCheckout: string })
          .recorderCommissionAfterCheckout,
      );
      // BR-903-04 shape: the desk records every receipt → earned at checkout. Not checked out → projected.
      const d = await booking({ room: '202' });
      expect((await status(d.id))!.status).toBe('projected');
      expect(
        await db.withContext(t.ctx(), (tx) =>
          fa.app.get(FolioService).tryEarnCommissions(tx, {
            reservationId: d.id,
            reservationCode: d.code,
            status: 'in_house',
          }),
        ),
      ).toBe(0);
      expect(await checkoutPaid(d)).toBe(1);
      expect((await status(d.id))!.status).toBe('earned');
    });

    it('ARC-BE-S3-11: a receipt written through recordManual by SAL/CTV (B2 initialPayment) carries the role and waits for reconciliation', async () => {
      await atT0();
      const b = await booking({ deposit: null });
      const row = await db.withContext(
        { ...t.ctx(), userId: t.users.sal!.id, actorType: 'user' },
        (tx) =>
          fa.app.get(PaymentService).recordManual(tx, {
            folioId: b.folioId,
            reservationId: b.id,
            reservationCode: b.code,
            type: 'deposit',
            method: 'cash',
            amountVnd: 500_000,
            receivedAt: T0,
            recordedBy: t.users.sal!.id,
          } as never),
      );
      const [p] = await q('SELECT reconciliation, recorded_by_role FROM payment WHERE id = $1', [
        row.id,
      ]);
      expect(p).toEqual({ reconciliation: 'pending', recorded_by_role: 'sales_staff' });
      const list = await c('fd2').get(`${P(t)}/payments?method=cash&recordedByRole=sales_staff`);
      expect(list.json().data.map((x: { id: string }) => x.id)).toContain(row.id);
    });

    it('SEC-BE-37 (F8): whoever set the destination neither approves nor pays the transfer; the approver does not pay it; requester + OWN pushed on every change', async () => {
      await atT0();
      const b = await booking();
      const due = (await folio(b)).totals.balanceDueVnd as number;
      await pay('fd', b, {
        type: 'charge',
        method: 'cash',
        amountVnd: due + 200_000,
        note: 'Khách trả dư',
      });
      const r = (
        await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
          amountVnd: 200_000,
          reason: 'Hoàn tiền dư',
        })
      ).json();
      const device = await t.deviceToken();
      const set = await new Client(fa, t.users.mgr!.sessionToken, device).send(
        'PUT',
        `${P(t)}/approval-requests/${r.id}/refund-destination`,
        {
          method: 'bank_transfer',
          bankBin: '970436',
          accountNo: '0071000123457',
          accountHolder: 'NGUYEN VAN A',
        },
      );
      expect(set.statusCode, set.body).toBe(200);
      const pushed = await outbox('refund_destination_changed');
      expect(
        pushed.some((x) => (x.payload as { userIds: string[] }).userIds.includes(t.users.fd!.id)),
      ).toBe(true);
      expect(JSON.stringify(pushed.map((x) => x.payload))).not.toContain('0071000123457');
      const selfApprove = await approveAs('mgr', r.id);
      expect(selfApprove.statusCode).toBe(403);
      expect(selfApprove.json().code).toBe('SELF_APPROVAL_FORBIDDEN');
      // DB layer too (0031 approval_request_refund_destination_not_approver).
      await expect(
        q(
          `UPDATE approval_request SET status = 'approved', approver_id = $2, approver_role_snapshot = 'manager',
              decided_at = now() WHERE id = $1`,
          [r.id, t.users.mgr!.id],
        ),
      ).rejects.toMatchObject({ code: '23514' });
      expect((await approveAs('owner', r.id)).statusCode).toBe(200);
      const exec = (who: string) =>
        c(who).send('POST', `${P(t)}/approval-requests/${r.id}/actions/execute-refund`, {
          amountVnd: 200_000,
          paidAt: T0.toISOString(),
          bankReference: 'FT26290002',
          attachmentId: uuidv7(),
        });
      const bySetter = await exec('mgr');
      expect(bySetter.statusCode, bySetter.body).toBe(403);
      expect(bySetter.json().code).toBe('SELF_REFUND_FORBIDDEN');
      // (PO 17/10: the approving OWN could pay as well – next case.)
      const ok = await c('mgr2').send(
        'POST',
        `${P(t)}/approval-requests/${r.id}/actions/execute-refund`,
        {
          amountVnd: 200_000,
          paidAt: T0.toISOString(),
          bankReference: 'FT26290002',
          attachmentId: await attach('mgr2', 'refund_proof', b.id),
        },
      );
      expect(ok.statusCode, ok.body).toBe(201);
    });

    it('PO 17/10 (SEC-37): an OWN may set the destination, approve and pay the same transfer refund (step-up, money-log flag); a MGR never approves and pays', async () => {
      await atT0();
      const device = await t.deviceToken();
      const overpaid = async () => {
        const b = await booking();
        const due = (await folio(b)).totals.balanceDueVnd as number;
        await pay('fd', b, {
          type: 'charge',
          method: 'cash',
          amountVnd: due + 150_000,
          note: 'Khách trả dư',
        });
        const r = (
          await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
            amountVnd: 150_000,
            reason: 'Hoàn tiền dư',
          })
        ).json();
        return { b, r };
      };
      const dest = (who: string, id: string) =>
        new Client(fa, t.users[who]!.sessionToken, device).send(
          'PUT',
          `${P(t)}/approval-requests/${id}/refund-destination`,
          {
            method: 'bank_transfer',
            bankBin: '970436',
            accountNo: '0071000123457',
            accountHolder: 'NGUYEN VAN A',
          },
        );
      const exec = async (who: string, b: Booking, id: string) =>
        c(who).send('POST', `${P(t)}/approval-requests/${id}/actions/execute-refund`, {
          amountVnd: 150_000,
          paidAt: T0.toISOString(),
          bankReference: 'FT26290003',
          attachmentId: await attach(who, 'refund_proof', b.id),
        });

      // OWN: routes, approves and pays the same transfer refund.
      const own = await overpaid();
      expect((await dest('owner2', own.r.id)).statusCode).toBe(200);
      expect((await approveAs('owner2', own.r.id)).statusCode).toBe(200);
      const noStep = await exec('owner2', own.b, own.r.id);
      expect(noStep.statusCode, noStep.body).toBe(401);
      expect(noStep.json().code).toBe('REAUTH_REQUIRED');
      const step = await c('owner2').send('POST', '/v1/me/step-up', { password: TEST_PASSWORD });
      expect(step.statusCode, step.body).toBe(200);
      const paid = await exec('owner2', own.b, own.r.id);
      expect(paid.statusCode, paid.body).toBe(201);
      const [log] = await q(
        `SELECT after FROM audit_event WHERE action = 'refund.paid' AND entity_id = $1`,
        [paid.json().id],
      );
      expect(log!.after).toMatchObject({ recordedByRole: 'owner', ownSelfApprovedAndPaid: true });

      // MGR: approves, then tries to pay the same refund → 403 (code), whatever the step-up.
      const mgr = await overpaid();
      expect((await dest('fd', mgr.r.id)).statusCode).toBe(200);
      expect((await approveAs('mgr', mgr.r.id)).statusCode).toBe(200);
      expect(
        (await c('mgr').send('POST', '/v1/me/step-up', { password: TEST_PASSWORD })).statusCode,
      ).toBe(200);
      const self = await exec('mgr', mgr.b, mgr.r.id);
      expect(self.statusCode, self.body).toBe(403);
      expect(self.json().code).toBe('SELF_REFUND_FORBIDDEN');
      // DB (0042): approver = destination setter only for an OWN approval of a non-cash refund.
      await expect(
        q(`UPDATE approval_request SET refund_destination_set_by = approver_id WHERE id = $1`, [
          mgr.r.id,
        ]),
      ).rejects.toMatchObject({
        code: '23514',
        constraint: 'approval_request_refund_destination_not_approver',
      });
      const [ownRow] = await q(
        `SELECT approver_id = refund_destination_set_by AS same, approver_role_snapshot FROM approval_request
          WHERE id = $1`,
        [own.r.id],
      );
      expect(ownRow).toEqual({ same: true, approver_role_snapshot: 'owner' });
    });

    it('SEC-BE-45: original_method resolving to cash → 409 (cash goes through executeCashRefund); a rejected refund request shreds its account key', async () => {
      await atT0();
      const b = await booking();
      const due = (await folio(b)).totals.balanceDueVnd as number;
      await pay('fd', b, {
        type: 'charge',
        method: 'cash',
        amountVnd: due + 100_000,
        note: 'Khách trả dư',
      });
      const mk = async () =>
        (
          await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
            amountVnd: 50_000,
            reason: 'Hoàn tiền dư',
          })
        ).json();
      const device = await t.deviceToken();
      const dest = (id: string, body: Record<string, unknown>) =>
        new Client(fa, t.users.fd!.sessionToken, device).send(
          'PUT',
          `${P(t)}/approval-requests/${id}/refund-destination`,
          body,
        );
      const r1 = await mk();
      expect((await dest(r1.id, { method: 'original_method' })).statusCode).toBe(200);
      expect((await approveAs('mgr', r1.id)).statusCode).toBe(200);
      const viaOriginal = await c('mgr2').send(
        'POST',
        `${P(t)}/approval-requests/${r1.id}/actions/execute-refund`,
        {
          amountVnd: 50_000,
          paidAt: T0.toISOString(),
          attachmentId: await attach('mgr2', 'refund_proof', b.id),
        },
      );
      expect(viaOriginal.statusCode, viaOriginal.body).toBe(409);
      expect(viaOriginal.json()).toMatchObject({
        code: 'INVALID_TRANSITION',
        currentState: 'cash',
      });
      const r2 = await mk();
      expect(
        (
          await dest(r2.id, {
            method: 'bank_transfer',
            bankBin: '970436',
            accountNo: '0071000123457',
            accountHolder: 'NGUYEN VAN A',
          })
        ).statusCode,
      ).toBe(200);
      const rej = await c('mgr').send('POST', `${P(t)}/approval-requests/${r2.id}/actions/reject`, {
        authMethod: 'password',
        secret: TEST_PASSWORD,
        reason: 'Khách đổi ý',
      });
      expect(rej.statusCode, rej.body).toBe(200);
      const [row] = await q('SELECT refund_account_enc FROM approval_request WHERE id = $1', [
        r2.id,
      ]);
      expect(row!.refund_account_enc).toBeNull();
      expect(
        await q(`SELECT 1 FROM c3_access_log WHERE subject_id = $1 AND action = 'purge'`, [r2.id]),
      ).toHaveLength(1);
    });

    it('ARC-BE-S3-12 / SEC-BE-42: separation of duties held by the DB (23514 / column grants)', async () => {
      await atT0();
      const b = await booking();
      const p = (
        await pay('fd', b, { type: 'charge', method: 'bank_transfer', amountVnd: 10_000 })
      ).json();
      const rec = await c('mgr').send(
        'POST',
        `${P(t)}/payments/${p.id}/actions/reconcile`,
        { result: 'reconciled' },
        { 'if-match': `"${p.version}"` },
      );
      expect(rec.statusCode, rec.body).toBe(200);
      const [row] = await q(
        'SELECT reconciled_by_role, self_reconciled FROM payment WHERE id = $1',
        [p.id],
      );
      expect(row).toEqual({ reconciled_by_role: 'manager', self_reconciled: false });
      const fails = async (sql: string, args: unknown[], constraint: string) =>
        expect(q(sql, args)).rejects.toMatchObject({ code: '23514', constraint });
      // self_reconciled is a fact (reconciler = recorder/confirmer), not a flag – even with an owner role.
      await fails(
        `UPDATE payment SET self_reconciled = true, reconciled_by_role = 'owner' WHERE id = $1`,
        [p.id],
        'payment_self_reconciled_fact_check',
      );
      // Only an owner reconciles their own entry (the fact holds here, the role does not).
      await fails(
        `UPDATE payment SET reconciled_by = recorded_by, self_reconciled = true WHERE id = $1`,
        [p.id],
        'payment_self_reconcile_owner_check',
      );
      // reconciled / disputed name the reconciler.
      const p2 = (
        await pay('fd', b, { type: 'charge', method: 'bank_transfer', amountVnd: 10_000 })
      ).json();
      await fails(
        `UPDATE payment SET reconciliation = 'reconciled' WHERE id = $1`,
        [p2.id],
        'payment_reconciled_by_check',
      );
      // A person's receipt carries the role snapshot.
      await fails(
        `INSERT INTO payment (id, organization_id, property_id, code, folio_id, type, method, reconciliation,
           amount_vnd, status, recorded_by, created_at, updated_at)
         VALUES ($1, $2, $3, 'PT-ROLE', $4, 'charge', 'cash', 'not_required', 1, 'succeeded', $5, now(), now())`,
        [uuidv7(), t.organizationId, t.propertyIds[0], b.folioId, t.users.fd!.id],
        'payment_recorded_by_role_required_check',
      );
      // Refund account without bank_transfer method (NULL no longer passes).
      const r = (
        await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
          amountVnd: 1,
          reason: 'Thử ràng buộc',
        })
      ).json();
      if (r.id) {
        await fails(
          `UPDATE approval_request SET refund_account_last4 = '1234' WHERE id = $1`,
          [r.id],
          'approval_request_refund_account_check',
        );
      }
      // SM-10: what was asked never changes (column-level UPDATE grants).
      const [anyReq] = await q(`SELECT id FROM approval_request LIMIT 1`);
      for (const col of ['requested_by = requested_by', 'amount_vnd = amount_vnd', 'type = type']) {
        await expect(
          q(`UPDATE approval_request SET ${col} WHERE id = $1`, [anyReq!.id]),
        ).rejects.toMatchObject({ code: '42501' });
      }
    });

    it('ARC-BE-S3-14 (interim): a room / extra-person line of a booking still in stay is not adjusted at the folio (422 NOT_ALLOWED)', async () => {
      await atT0();
      const b = await booking();
      const f = await folio(b);
      const room = (f.lines as Array<{ id: string; category: string }>).find(
        (l) => l.category === 'room',
      )!;
      const res = await c('mgr').send(
        'POST',
        `${P(t)}/folios/${b.folioId}/lines/${room.id}/adjustments`,
        { newUnitPriceVnd: 1_000, reason: 'Giảm giá đêm' },
        { 'if-match': `"${f.version}"` },
      );
      expect(res.statusCode, res.body).toBe(422);
      expect(res.json().errors).toEqual([{ field: 'newUnitPriceVnd', code: 'NOT_ALLOWED' }]);
    });

    it('DOM BE-21: folio and bill lines carry labelKey/labelParams – never a technical code to print', async () => {
      await atT0();
      const b = await booking();
      await postMinibar(b, 70_000);
      const f = await folio(b);
      const lines = f.lines as Array<{
        category: string;
        labelKey: string;
        labelParams?: Record<string, unknown>;
      }>;
      for (const l of lines) expect(l.labelKey).toMatch(/^bill\.line\.[a-z_]+$/);
      const night = lines.find((l) => l.category === 'room')!;
      expect(night.labelKey).toBe('bill.line.room_night');
      expect(night.labelParams).toMatchObject({ date: b.arrivalDate, room: expect.any(String) });
      expect(lines.find((l) => l.category === 'minibar')).toMatchObject({
        labelKey: 'bill.line.minibar',
        labelParams: { item: 'Bia', qty: 2 },
      });
      const bill = (await c('fd').get(`${P(t)}/folios/${b.folioId}/bill`)).json();
      for (const l of bill.lines as Array<{ labelKey: string }>)
        expect(l.labelKey).toMatch(/^bill\.line\./);
      expect(bill.creditVnd).toBe(0);
    });

    it('SEC-BE-43: a VietQR replay is rebuilt from the account in effect; the idempotency row keeps ids only', async () => {
      await atT0();
      const b = await booking();
      const key = uuidv7();
      const qr = () =>
        c('fd').send(
          'POST',
          `${P(t)}/folios/${b.folioId}/vietqr`,
          { amountVnd: 100_000 },
          { 'idempotency-key': key },
        );
      const first = await qr();
      expect(first.statusCode, first.body).toBe(201);
      const [idem] = await q(
        `SELECT response_body::text AS body FROM idempotency_key WHERE key = $1`,
        [key],
      );
      expect(String(idem!.body)).not.toContain(ACCOUNT.accountNo);
      expect(JSON.parse(String(idem!.body))).toEqual({
        paymentId: first.json().payment.id,
        expiredPaymentIds: expect.any(Array),
      });
      // The owner changes the account from tomorrow; the replay tomorrow shows the account in effect then.
      const other = { ...ACCOUNT, accountNo: '1903999888777' };
      const put = await c('owner').send('PUT', `${P(t)}/parameters/payment_receiving_account`, {
        value: other,
        effectiveFrom: '2026-10-16',
        reason: 'Đổi tài khoản nhận',
        reauth: { authMethod: 'password', secret: TEST_PASSWORD },
      });
      expect(put.statusCode, put.body).toBe(200);
      fa.clock.set(new Date('2026-10-16T03:00:00.000Z'));
      await refreshSessions(db, t, fa.clock.now());
      const replay = await qr();
      expect(replay.statusCode, replay.body).toBe(201);
      expect(replay.headers['idempotent-replayed']).toBe('true');
      expect(replay.json().payment.id).toBe(first.json().payment.id);
      expect(replay.json().qrPayload).toContain(`0113${other.accountNo}`);
      expect(replay.json().qrPayload).not.toContain(`0113${ACCOUNT.accountNo}`);
      expect(replay.json().receivingAccountMasked).toBe('9704••••8777');
      await atT0(); // the original account is still the one in effect at T0 for the other cases
    });

    it('SEC-BE-44: card numbers refused in addFolioLine.description and the receiving account name; control characters stripped', async () => {
      await atT0();
      const b = await booking();
      await inHouse(b);
      const add = (description: string) =>
        c('fd').send('POST', `${P(t)}/folios/${b.folioId}/lines`, {
          category: 'fnb',
          description,
          quantity: 1,
          unitPriceVnd: 50_000,
          serviceDate: b.arrivalDate,
        });
      const card = await add('Cafe 4111 1111 1111 1111');
      expect(card.statusCode).toBe(422);
      expect(card.json().code).toBe('CARD_NUMBER_DETECTED');
      const ok = await add('Cafe\u0000 sữa‮');
      expect(ok.statusCode, ok.body).toBe(201);
      const [line] = await q(
        `SELECT description FROM folio_line WHERE folio_id = $1 AND category = 'fnb' ORDER BY posted_at DESC LIMIT 1`,
        [b.folioId],
      );
      expect(line!.description).toBe('Cafe sữa');
      const name = await c('owner').send('PUT', `${P(t)}/parameters/payment_receiving_account`, {
        value: { ...ACCOUNT, accountName: 'OTTIMO 4111111111111111' },
        effectiveFrom: '2026-10-20',
        reason: 'Thử tên tài khoản',
        reauth: { authMethod: 'password', secret: TEST_PASSWORD },
      });
      expect(name.json().code).toBe('CARD_NUMBER_DETECTED');
    });

    it('DOM BE-29 / ARC-BE-S3-32: stayover count closed (422); a recount reverses the adjusted replacement line too', async () => {
      await atT0();
      const b = await booking();
      await inHouse(b);
      const record = (who: string, body: Record<string, unknown>) =>
        c(who).send('POST', `${P(t)}/reservations/${b.id}/minibar-checks`, body);
      const all = (left: Record<string, number>) =>
        Object.entries(items).map(([code, itemId]) => ({
          itemId,
          remainingQty:
            left[code] ??
            (DS_E.minibarItems.find((m) => m.code === code)?.standardQtyPerRoom as number),
        }));
      const stay = await record('fd', { mode: 'stayover', lines: all({}) });
      expect(stay.json().errors).toEqual([{ field: 'mode', code: 'NOT_IN_LIST' }]);
      const first = await record('fd', { mode: 'checkout', lines: all({ bia: 0 }) });
      expect(first.statusCode, first.body).toBe(201);
      let f = await folio(b);
      const line = (f.lines as Array<{ id: string; category: string; amountVnd: number }>).find(
        (l) => l.category === 'minibar',
      )!;
      const adj = await c('mgr').send(
        'POST',
        `${P(t)}/folios/${b.folioId}/lines/${line.id}/adjustments`,
        { newQuantity: 1, reason: 'Khách chỉ dùng 1 lon' },
        { 'if-match': `"${f.version}"` },
      );
      expect(adj.statusCode, adj.body).toBe(201);
      const recount = await record('fd', { mode: 'checkout', lines: all({}) });
      expect(recount.statusCode, recount.body).toBe(201);
      f = await folio(b);
      const minibar = (f.lines as Array<{ category: string; amountVnd: number; lineState: string }>)
        .filter((l) => l.category === 'minibar' && l.lineState === 'posted')
        .reduce((a, l) => a + l.amountVnd, 0);
      expect(minibar).toBe(0);
    });
    // ───────────── Sprint 3 testing, fix round 2 (QA bug-list) ─────────────

    it('BUG-R2-043 (V-09): a card number in posAuthCode → CARD_NUMBER_DETECTED (not TOO_LONG); a long code → TOO_LONG', async () => {
      await atT0();
      const b = await booking();
      const card = await pay('fd', b, {
        type: 'charge',
        method: 'card_pos',
        amountVnd: 100_000,
        posAuthCode: '4111111111111111', // gitleaks:allow – public Visa test number
      });
      expect(card.statusCode).toBe(422);
      expect(card.json()).toMatchObject({
        code: 'CARD_NUMBER_DETECTED',
        errors: [{ field: 'posAuthCode', code: 'CARD_NUMBER_DETECTED' }],
      });
      const long = await pay('fd', b, {
        type: 'charge',
        method: 'card_pos',
        amountVnd: 100_000,
        posAuthCode: 'ABCDEF1234567',
      });
      expect(long.json().errors).toEqual([{ field: 'posAuthCode', code: 'TOO_LONG' }]);
      expect(
        await q(`SELECT 1 FROM payment WHERE folio_id = $1 AND auth_code LIKE '4111%'`, [
          b.folioId,
        ]),
      ).toHaveLength(0);
    });

    it('BUG-R2-041 (US-039 AC2, D16): a company invoice is kept on the booker profile', async () => {
      await atT0();
      const b = await booking();
      const set = await c('fd').send('PUT', `${P(t)}/folios/${b.folioId}/invoice-request`, {
        buyerType: 'company',
        companyName: 'CONG TY TNHH THU NGHIEM',
        taxCode: '0312345678',
        email: 'ketoan@example.test',
      });
      expect(set.statusCode, set.body).toBe(200);
      const [g] = await q(
        `SELECT g.company_name, g.tax_code FROM guest g JOIN reservation r ON r.booker_guest_id = g.id
          WHERE r.id = $1`,
        [b.id],
      );
      expect(g).toEqual({ company_name: 'CONG TY TNHH THU NGHIEM', tax_code: '0312345678' });
      const audit = await q(
        `SELECT after FROM audit_event WHERE action = 'guest.updated' AND after->>'by' = 'invoice_request'
          ORDER BY occurred_at DESC LIMIT 1`,
      );
      expect(audit[0]!.after).toMatchObject({ fields: ['companyName', 'taxCode'] });
      expect(JSON.stringify(audit[0]!.after)).not.toContain('0312345678'); // C2 never in the log
    });

    it('BUG-R2-046 (BR-433 "≤ 1 night"): a FOC on a surcharge / service line carries the night-rate basis – the manager decides it', async () => {
      await atT0();
      const b = await booking();
      await inHouse(b);
      const post = (category: string, amountVnd: number, serviceDate: string) =>
        db.withContext({ ...t.ctx(), userId: t.users.fd!.id, actorType: 'user' }, (tx) =>
          fa.app.get(FolioService).postLines(
            tx,
            b.folioId,
            [
              {
                reservationId: b.id,
                category: category as 'service_fee',
                description: category,
                quantity: 1,
                unitPriceVnd: amountVnd,
                amountVnd,
                serviceDate,
                source: 'manual',
              },
            ],
            { userId: t.users.fd!.id, reservationCode: b.code },
          ),
        );
      const f = await folio(b);
      const nights = (
        f.lines as Array<{ category: string; serviceDate: string; unitPriceVnd: number }>
      )
        .filter((l) => l.category === 'room')
        .sort((x, y) => x.serviceDate.localeCompare(y.serviceDate));
      const third = nights[2]!;
      const last = nights[nights.length - 1]!;
      const [svc] = (await post('service_fee', 500_000, third.serviceDate)) as [string];
      const [late] = (await post('late_checkout', 350_000, last.serviceDate)) as [string];
      const foc = (lineId: string, amountVnd: number) =>
        c('fd').send('POST', `${P(t)}/folios/${b.folioId}/lines/${lineId}/foc`, {
          kind: 'foc',
          amountVnd,
          reasonCode: 'service_recovery',
        });
      const basisOf = async (approvalId: string) =>
        Number(
          (await q('SELECT limit_basis_vnd FROM approval_request WHERE id = $1', [approvalId]))[0]!
            .limit_basis_vnd,
        );
      // Service line: basis = the night of its service date; above the FDL limit, within one night → manager.
      const amount = Math.min(third.unitPriceVnd, 450_000);
      const r1 = await foc(svc, amount);
      expect(r1.statusCode, r1.body).toBe(201);
      expect(await basisOf(r1.json().id)).toBe(third.unitPriceVnd);
      expect(r1.json().requiredRole).toBe(amount > 300_000 ? 'manager' : 'front_desk_lead');
      const ok = await approveAs('mgr', r1.json().id);
      expect(ok.statusCode, ok.body).toBe(200);
      // Late check-out surcharge: basis = the last night.
      const r2 = await foc(late, 301_000);
      expect(r2.statusCode, r2.body).toBe(201);
      expect(await basisOf(r2.json().id)).toBe(last.unitPriceVnd);
      expect(r2.json().requiredRole).toBe(last.unitPriceVnd >= 301_000 ? 'manager' : 'owner');
    });
    // ───────────── Blocker verification 17/10 (new Majors on deposits / refunds of holds) ─────────────

    it('Verification 17/10: J1 cancels a hold whose deposit was reversed, keeps one re-paid; a hold takes deposits only; no manual refund on a hold; confirmDeposit refuses a reversal id', async () => {
      await atT0();
      const depositOf = async (b: Booking, amountVnd: number) => {
        const v = (await q('SELECT version FROM reservation WHERE id = $1', [b.id]))[0]!.version;
        const r = await c('fd').send(
          'POST',
          `${P(t)}/reservations/${b.id}/actions/confirm-deposit`,
          { payment: { type: 'deposit', method: 'cash', amountVnd } },
          { 'if-match': `"${v}"` },
        );
        expect(r.statusCode, r.body).toBe(200);
        expect(r.json().status).toBe('hold');
        return (
          await q(`SELECT id FROM payment WHERE folio_id = $1 ORDER BY created_at DESC LIMIT 1`, [
            b.folioId,
          ])
        )[0]!.id as string;
      };
      const reverse = async (id: string) =>
        expect(
          (
            await c('mgr').send('POST', `${P(t)}/payments/${id}/actions/reverse`, {
              reason: 'Ghi nhầm khoản cọc',
            })
          ).statusCode,
        ).toBe(200);
      const gone = await booking({ deposit: null });
      await reverse(await depositOf(gone, 100_000));
      const kept = await booking({ deposit: null });
      await reverse(await depositOf(kept, 100_000));
      // (7) money on a hold is its deposit: a `charge` or a QR "balance" is refused.
      const charge = await pay('fd', kept, { type: 'charge', method: 'cash', amountVnd: 50_000 });
      expect(charge.json().errors).toEqual([{ field: 'type', code: 'NOT_IN_LIST' }]);
      // …but a sale is stopped by the scope first (A33 own_deposit_only → 403, role gate first – TC-L4-063).
      const salCharge = await pay('sal', kept, {
        type: 'charge',
        method: 'cash',
        amountVnd: 50_000,
      });
      expect(salCharge.statusCode, salCharge.body).toBe(403);
      expect(salCharge.json().code).toBe('FORBIDDEN_ACTION');
      const qr = await c('fd').send('POST', `${P(t)}/folios/${kept.folioId}/vietqr`, {
        amountVnd: 50_000,
        purpose: 'balance',
      });
      expect(qr.json().errors).toEqual([{ field: 'purpose', code: 'NOT_IN_LIST' }]);
      const again = await pay('fd', kept, { type: 'deposit', method: 'cash', amountVnd: 50_000 });
      expect(again.statusCode, again.body).toBe(201);
      // (6) no manual refund request on a hold (its money goes back through B5 / confirms it through B4).
      const refund = await c('fd').send('POST', `${P(t)}/folios/${kept.folioId}/refund-requests`, {
        amountVnd: 50_000,
        reason: 'Khách xin lại cọc',
      });
      expect(refund.statusCode, refund.body).toBe(409);
      expect(refund.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'hold' });
      // (9) the reversal row of a deposit is never an `existingPaymentId`.
      const [rev] = await q(
        `SELECT id FROM payment WHERE folio_id = $1 AND reversal_of_id IS NOT NULL`,
        [gone.folioId],
      );
      const v = (await q('SELECT version FROM reservation WHERE id = $1', [gone.id]))[0]!.version;
      const byReversal = await c('fd').send(
        'POST',
        `${P(t)}/reservations/${gone.id}/actions/confirm-deposit`,
        { existingPaymentId: rev!.id },
        { 'if-match': `"${v}"` },
      );
      expect(byReversal.json().errors).toEqual([
        { field: 'existingPaymentId', code: 'NOT_IN_LIST' },
      ]);
      // (8) J1 at the deadline: the hold with no money left is cancelled, the re-paid one is kept.
      const [h] = await q('SELECT hold_expires_at FROM reservation WHERE id = $1', [gone.id]);
      fa.clock.set(new Date((h!.hold_expires_at as Date).getTime() + 60_000));
      await refreshSessions(db, t, fa.clock.now());
      await fa.app.get(JobRunner).runOnce(HOLD_EXPIRY_JOB_KEY, {
        propertyId: t.propertyIds[0]!,
        organizationId: t.organizationId,
        timezone: 'Asia/Ho_Chi_Minh',
      });
      const st = async (b: Booking) =>
        (await q('SELECT status FROM reservation WHERE id = $1', [b.id]))[0]!.status;
      expect(await st(gone)).toBe('cancelled');
      expect(await st(kept)).toBe('hold');
      await atT0();
    });

    it('Verification 17/10 (DOM BE-14): a cancellation (B10) never requests again what an open refund request already asks back', async () => {
      await atT0();
      const b = await booking();
      const due = (await folio(b)).totals.balanceDueVnd as number;
      expect(
        (
          await pay('fd', b, {
            type: 'charge',
            method: 'cash',
            amountVnd: due + 500_000,
            note: 'Khách trả dư',
          })
        ).statusCode,
      ).toBe(201);
      const cancel = (body: Record<string, unknown>, headers: Record<string, string> = {}) =>
        c('fd').send('POST', `${P(t)}/reservations/${b.id}/actions/cancel`, body, headers);
      const before = (await cancel({ reasonCode: 'found_other', dryRun: true })).json()
        .cancellation as { depositPaidVnd: number; refundableVnd: number };
      const open = await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
        amountVnd: 500_000,
        reason: 'Hoàn tiền khách trả dư',
      });
      expect(open.statusCode, open.body).toBe(201);
      const after = (await cancel({ reasonCode: 'found_other', dryRun: true })).json()
        .cancellation as { depositPaidVnd: number; refundableVnd: number };
      expect(after.refundableVnd).toBe(
        Math.max(0, Math.min(before.refundableVnd, before.depositPaidVnd - 500_000)),
      );
      const v = (await q('SELECT version FROM reservation WHERE id = $1', [b.id]))[0]!.version;
      const done = await cancel({ reasonCode: 'found_other' }, { 'if-match': `"${v}"` });
      expect(done.statusCode, done.body).toBe(200);
      const asked = await q(
        `SELECT COALESCE(SUM(amount_vnd), 0)::bigint AS total FROM approval_request
          WHERE type = 'refund' AND target_id = $1 AND status IN ('pending', 'escalated', 'approved')`,
        [b.id],
      );
      expect(Number(asked[0]!.total)).toBeLessThanOrEqual(Math.max(before.depositPaidVnd, 500_000));
      expect(Number(asked[0]!.total)).toBe(500_000 + after.refundableVnd);
    });
    it('Re-verification 17/10 (VER-BE-S3-01): cancellation fee on the deposit nobody asked back, never above the booking value – 0 % and 50 % tiers with an excess deposit and an open refund', async () => {
      const excessBooking = async () => {
        await atT0();
        const b = await booking({ deposit: null });
        const [r] = await q(
          `SELECT version, total_room_vnd, arrival_date::text AS arrival,
                  (pricing_snapshot->>'hasPeakNight')::boolean AS peak
             FROM reservation WHERE id = $1`,
          [b.id],
        );
        const value = Number(r!.total_room_vnd);
        const dep = await c('fd').send(
          'POST',
          `${P(t)}/reservations/${b.id}/actions/confirm-deposit`,
          {
            payment: {
              type: 'deposit',
              method: 'cash',
              amountVnd: value + 500_000,
              note: 'Khách chuyển dư so với tiền phòng',
            },
          },
          { 'if-match': `"${r!.version}"` },
        );
        expect(dep.statusCode, dep.body).toBe(200);
        expect(dep.json().status).toBe('confirmed');
        const open = await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
          amountVnd: 500_000,
          reason: 'Hoàn phần chuyển dư',
        });
        expect(open.statusCode, open.body).toBe(201);
        return { b, value, deposit: value + 500_000, arrival: String(r!.arrival), peak: !!r!.peak };
      };
      const quoteAt = async (b: Booking, day: string) => {
        fa.clock.set(new Date(`${day}T03:00:00.000Z`));
        await refreshSessions(db, t, fa.clock.now());
        const res = await c('fd').send('POST', `${P(t)}/reservations/${b.id}/actions/cancel`, {
          reasonCode: 'found_other',
          dryRun: true,
        });
        expect(res.statusCode, res.body).toBe(200);
        return res.json().cancellation as {
          depositPaidVnd: number;
          refundableVnd: number;
          retainedVnd: number;
        };
      };

      // 0 % tier (the day before arrival): the fee is the booking value, never the excess deposit.
      const z = await excessBooking();
      const q0 = await quoteAt(z.b, addDays(z.arrival, -1));
      expect(q0.retainedVnd).toBe(z.value);
      expect(q0.refundableVnd).toBe(0);
      expect(500_000 + q0.refundableVnd + q0.retainedVnd).toBe(z.deposit);

      // 50 % tier (5 days before): fee on the booking value only; open + new requests = the excess left.
      const h = await excessBooking();
      const q5 = await quoteAt(h.b, addDays(h.arrival, -5));
      expect(q5.retainedVnd).toBeLessThanOrEqual(h.value);
      if (!h.peak) expect(q5.retainedVnd).toBeLessThan(h.value);
      expect(500_000 + q5.refundableVnd + q5.retainedVnd).toBe(h.deposit);
      const v = (await q('SELECT version FROM reservation WHERE id = $1', [h.b.id]))[0]!.version;
      const done = await c('fd').send(
        'POST',
        `${P(t)}/reservations/${h.b.id}/actions/cancel`,
        { reasonCode: 'found_other' },
        { 'if-match': `"${v}"` },
      );
      expect(done.statusCode, done.body).toBe(200);
      const asked = Number(
        (
          await q(
            `SELECT COALESCE(SUM(amount_vnd - refunded_vnd), 0)::bigint AS total FROM approval_request
              WHERE type = 'refund' AND target_id = $1 AND status IN ('pending', 'escalated', 'approved')`,
            [h.b.id],
          )
        )[0]!.total,
      );
      const after = (await folio(h.b)).totals as { creditVnd: number; unhandledCreditVnd: number };
      expect(asked).toBe(500_000 + q5.refundableVnd);
      expect(asked).toBeLessThanOrEqual(after.creditVnd); // never more requested than the excess left
      expect(after.unhandledCreditVnd).toBe(after.creditVnd - asked);
      await atT0();
    });
    it('Round 5 (REFUND #1): B11 no-show keeps min(deposit not asked back, booking value) – the open 500k refund stays payable', async () => {
      await atT0();
      const b = await booking({ deposit: null });
      const [r] = await q(
        `SELECT version, total_room_vnd, arrival_date::text AS arrival FROM reservation WHERE id = $1`,
        [b.id],
      );
      const value = Number(r!.total_room_vnd);
      const dep = await c('fd').send(
        'POST',
        `${P(t)}/reservations/${b.id}/actions/confirm-deposit`,
        {
          payment: {
            type: 'deposit',
            method: 'cash',
            amountVnd: value + 500_000,
            note: 'Khách chuyển dư so với tiền phòng',
          },
        },
        { 'if-match': `"${r!.version}"` },
      );
      expect(dep.json().status).toBe('confirmed');
      const open = (
        await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/refund-requests`, {
          amountVnd: 500_000,
          reason: 'Hoàn phần chuyển dư',
        })
      ).json();
      const device = await t.deviceToken();
      expect(
        (
          await new Client(fa, t.users.fd!.sessionToken, device).send(
            'PUT',
            `${P(t)}/approval-requests/${open.id}/refund-destination`,
            { method: 'cash' },
          )
        ).statusCode,
      ).toBe(200);
      expect((await approveAs('mgr', open.id)).statusCode).toBe(200);
      // 23:05 on the arrival day (BR-311: no-show only after 23:00).
      fa.clock.set(new Date(`${String(r!.arrival)}T16:05:00.000Z`));
      await refreshSessions(db, t, fa.clock.now());
      const v = (await q('SELECT version FROM reservation WHERE id = $1', [b.id]))[0]!.version;
      const ns = await c('fd').send(
        'POST',
        `${P(t)}/reservations/${b.id}/actions/mark-no-show`,
        { contactAttemptNote: 'Gọi 2 lần không nghe máy' },
        { 'if-match': `"${v}"` },
      );
      expect(ns.statusCode, ns.body).toBe(200);
      const fees = await q(
        `SELECT amount_vnd FROM folio_line WHERE folio_id = $1 AND category = 'no_show_fee'`,
        [b.folioId],
      );
      expect(fees.map((x) => Number(x.amount_vnd))).toEqual([value]);
      expect((await folio(b)).totals).toMatchObject({ creditVnd: 500_000, unhandledCreditVnd: 0 });
      // The open request (routed + approved before) is paid out (cash, signed receipt).
      const paid = await c('fd2').send(
        'POST',
        `${P(t)}/approval-requests/${open.id}/actions/execute-cash-refund`,
        {
          amountVnd: 500_000,
          paidAt: fa.clock.now().toISOString(),
          attachmentId: await attach('fd2', 'refund_proof', b.id),
        },
      );
      expect(paid.statusCode, paid.body).toBe(201);
      expect((await folio(b)).totals).toMatchObject({ creditVnd: 0, balanceDueVnd: 0 });
      await atT0();
    });
    it('Round 5 (REFUND #3, DOM 17/10): booking value = live room + extra-person lines after FOC – not the snapshot, not services', async () => {
      await atT0();
      const b = await booking();
      const [r] = await q('SELECT total_room_vnd FROM reservation WHERE id = $1', [b.id]);
      const value = () =>
        db.withContext(t.ctx(), (tx) =>
          fa.app.get(FolioService).bookingValueVnd(tx, b.folioId, b.id),
        );
      expect(await value()).toBe(Number(r!.total_room_vnd));
      const night = ((await folio(b)).lines as Array<{ id: string; category: string }>).find(
        (l) => l.category === 'room',
      )!;
      const foc = await c('fd').send('POST', `${P(t)}/folios/${b.folioId}/lines/${night.id}/foc`, {
        kind: 'foc',
        amountVnd: 100_000,
        reasonCode: 'service_recovery',
      });
      expect(foc.statusCode, foc.body).toBe(201);
      expect((await approveAs('mgr', foc.json().id)).statusCode).toBe(200);
      await postMinibar(b, 70_000); // a service – never part of the booking value
      expect(await value()).toBe(Number(r!.total_room_vnd) - 100_000);
    });
  },
);
