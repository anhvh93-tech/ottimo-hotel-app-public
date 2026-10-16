/**
 * Role gate of the BE-B Sprint 3 operations (folio lines, bill, invoice, payments, VietQR, reconciliation, cash
 * handover, refunds, minibar, step-up), generated from product/tests/fixtures/rbac-cases.json (OpenAPI 0.3.6
 * x-roles) – same harness as rbac-sprint2-beb: expected 2xx → the gate lets it through (status is neither
 * 401/403/500 with minimal payloads, so 404/409/412/422 are fine); 403 → FORBIDDEN_ACTION; 401 → guest cookie.
 * C3 operations get a trusted-device cookie and an open step-up window for the allowed roles (the device /
 * step-up checks themselves are covered in payments-s3.test.ts).
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hash } from '@node-rs/argon2';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { TEST_PASSWORD, type FeatureApp, startFeatureApp } from '../helpers/feature-app';
import { seedSales } from '../helpers/sales-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

interface RbacCase {
  id: string;
  operationId: string;
  method: string;
  path: string;
  subject: string;
  roles: string[];
  expected: '2xx' | '401' | '403';
}

const OPS = [
  'addFolioLine',
  'adjustFolioLine',
  'getChargeCatalog',
  'getBill',
  'setInvoiceRequest',
  'recordPayment',
  'listPayments',
  'confirmPaymentReceived',
  'reconcilePayment',
  'confirmCashHandover',
  'reversePayment',
  'createVietQr',
  'createRefundRequest',
  'setRefundDestination',
  'getRefundDestination',
  'executeRefund',
  'executeCashRefund',
  'recordMinibarCheck',
  'getMinibarStandard',
  'stepUp',
];

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/rbac-cases.json'), 'utf8'),
) as { cases: RbacCase[] };
const CASES = fixture.cases.filter((c) => OPS.includes(c.operationId));

describe.skipIf(!HAS_DB)(
  'rbac-cases.json – Sprint 3 operations (BE-B: folio, payments, inventory)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let device: string;
    const userByRoles = new Map<string, string>();

    beforeAll(async () => {
      db = appDatabase(10);
      const roleSets = [
        ...new Set(CASES.filter((c) => c.expected !== '401').map((c) => c.roles.join('+'))),
      ];
      const users: Record<string, string[]> = { target: ['front_desk'] };
      roleSets.forEach((rs, i) => {
        users[`u${i}`] = rs.split('+');
      });
      t = await createTenant(db, { users });
      roleSets.forEach((rs, i) => userByRoles.set(rs, t.users[`u${i}`]!.id));
      const h = await hash(TEST_PASSWORD);
      await db.withContext(t.ctx(), (tx) =>
        tx.query('UPDATE app_user SET password_hash = $1', [h]),
      );
      await seedSales(db, t);
      device = await t.deviceToken();
      fa = await startFeatureApp(db);
    });
    afterAll(async () => {
      await fa?.close();
      await db.close();
    });

    async function freshSession(userId: string): Promise<string> {
      const token = randomBytes(32).toString('base64url');
      await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `INSERT INTO user_session (id, organization_id, user_id, active_property_id, client_origin, created_at,
           last_active_at, idle_expires_at, expires_at, stepup_until)
         VALUES ($1, $2, $3, $4, 'admin', $5, $5, $6, $6, $6)`,
          [
            sha256Hex(token),
            t.organizationId,
            userId,
            t.propertyIds[0],
            T0,
            new Date(T0.getTime() + 3_600_000),
          ],
        ),
      );
      return token;
    }

    function request(c: RbacCase): {
      url: string;
      body?: unknown;
      headers: Record<string, string>;
    } {
      const url = c.path
        .replace('{propertyId}', t.propertyIds[0]!)
        .replace('{folioId}', uuidv7())
        .replace('{lineId}', uuidv7())
        .replace('{paymentId}', uuidv7())
        .replace('{approvalId}', uuidv7())
        .replace('{reservationId}', uuidv7());
      const headers: Record<string, string> = { 'if-match': '"999"' };
      const bodies: Record<string, unknown> = {
        addFolioLine: { chargeCode: 'fnb', quantity: 1, unitPriceVnd: 1000 },
        adjustFolioLine: { voidLine: true, reason: 'Kiểm tra quyền' },
        setInvoiceRequest: { buyerType: 'individual' },
        recordPayment: { type: 'deposit', method: 'cash', amountVnd: 1000 },
        confirmPaymentReceived: {},
        reconcilePayment: { result: 'reconciled' },
        confirmCashHandover: { result: 'received' },
        reversePayment: { reason: 'Kiểm tra quyền' },
        createVietQr: { amountVnd: 1000 },
        createRefundRequest: { amountVnd: 1000, reason: 'Kiểm tra quyền' },
        setRefundDestination: { method: 'cash' },
        executeRefund: { amountVnd: 1000, paidAt: T0.toISOString(), bankReference: 'FT1' },
        executeCashRefund: { amountVnd: 1000, paidAt: T0.toISOString(), attachmentId: uuidv7() },
        recordMinibarCheck: { mode: 'stayover', lines: [] },
        stepUp: { password: TEST_PASSWORD },
      };
      return {
        url,
        ...(c.method === 'GET' ? {} : { body: bodies[c.operationId] ?? {} }),
        headers,
      };
    }

    it('covers every BE-B Sprint 3 operation of the fixture', () => {
      expect(new Set(CASES.map((c) => c.operationId))).toEqual(new Set(OPS));
    });

    it.each(
      CASES.map((c) => [`${c.id} ${c.operationId} ${c.subject} → ${c.expected}`, c] as const),
    )('%s', async (_name, c) => {
      const r = request(c);
      const headers: Record<string, string> = { ...r.headers };
      if (c.expected === '401') {
        headers.cookie = `ottimo_gsid=${randomBytes(32).toString('base64url')}`;
      } else {
        const token = await freshSession(userByRoles.get(c.roles.join('+'))!);
        headers.cookie = `ottimo_sid=${token}; ottimo_did=${device}`;
        if (c.method !== 'GET') {
          headers['x-csrf-token'] = fa.sessions.csrfToken(sha256Hex(token));
          headers['idempotency-key'] = randomUUID();
        }
      }
      const res = await fa.app.inject({
        method: c.method as 'GET',
        url: r.url,
        headers,
        ...(r.body === undefined ? {} : { payload: r.body as object }),
      });
      if (c.expected === '2xx') {
        expect([401, 403, 500], `${res.statusCode} ${res.body}`).not.toContain(res.statusCode);
      } else if (c.expected === '403') {
        expect(res.statusCode).toBe(403);
        expect(res.json().code).toBe('FORBIDDEN_ACTION');
      } else {
        expect(res.statusCode).toBe(401);
      }
    });
  },
);
