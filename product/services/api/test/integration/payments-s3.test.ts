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
import { FolioService } from '../../src/modules/folio/public/folio.service';
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

    it('BR-527-05 / A46a: cash a sale recorded – the sale cannot confirm, FD afternoon confirms → reconciled, sale commission earned; FD list scope', async () => {
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
           status, recorded_by, approval_request_id, approval_requested_by, created_at, updated_at)
         VALUES ($1, $2, $3, 'PT-X', $4, 'refund', 'cash', 'not_required', -1, 'succeeded', $5, $6, $5, now(), now())`,
          [uuidv7(), t.organizationId, t.propertyIds[0], b.folioId, t.users.fd!.id, r.id],
        ),
      ).rejects.toMatchObject({ code: '23514' });
      // SEC F8: nobody approves the refund they asked for – owner included.
      const own = await create('owner', 1);
      expect(own.statusCode).toBe(422); // nothing left to refund on this folio
    });

    it('A47 transfer refund: Luhn refused, destination C3 masked, change after approval → pending, step-up view logged, pay-out shreds the key', async () => {
      const b = await booking();
      const due = (await folio(b)).totals.balanceDueVnd as number;
      await pay('fd', b, {
        type: 'charge',
        method: 'bank_transfer',
        amountVnd: due + 500_000,
        note: 'Chuyển dư',
      });
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
            `SELECT count(*)::int AS n FROM audit_event WHERE action = 'folio.line_posted' AND entity_code = $1`,
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
      const bill = (await c('fd').get(`${P(t)}/folios/${b.folioId}/bill`)).json();
      expect(bill.paymentModel).toBe('ota_prepaid');
      expect(bill.lines.filter((l: { category: string }) => l.category === 'room')).toHaveLength(0);
      expect(bill.otaPrepaidNote).toContain('Đã thu qua');
      expect(bill.otaPrepaidVnd).toBeGreaterThan(0);
      expect(bill.locale).toBe('vi_en');
      expect(bill.usdReference.rate).toBe(26_200); // DS-E fx_usd_vnd (BR-004-01 rate)
      expect(bill.usdReference.totalUsd).toBe(Math.round((bill.totalVnd / 26_200) * 10) / 10);
      await q(`UPDATE reservation SET payment_model = 'direct' WHERE id = $1`, [b.id]);
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
  },
);
