/**
 * x-write-roles gate on the real app + PostgreSQL (OpenAPI 0.3.13 bổ sung 1 (a), contract-0.3.13 1.16; SEC
 * FB-R5-SEC-ARC-02; BA ghi chú 46b):
 * - QA's fieldCases (product/tests/fixtures/rbac-cases.json, `RBF-<operationId>-<field>-<subject>`) for every
 *   implemented operation: a role outside the list that sends the field → 403 FORBIDDEN_ACTION without any extension
 *   field + exactly one access.denied (reason WRITE_ROLES, `after.fields`); a listed role (or FD ∪ SAL) passes the gate;
 * - hand-written deny cases of contract 1.16: H-05 (CTV saveQuote + nightlyRates, nothing saved), H-06 (SAL/CTV
 *   calculateQuote + nightlyRates), H-07 (SAL nightlyRates under the floor → 403, no min/max), H-09 (one access.denied
 *   each);
 * - the gate comes before every body check (an otherwise invalid body still gets 403, `null` and `[]` count as sent),
 *   and after the Idempotency-Key lookup (ADR-009: a key completed while the user could send the field replays).
 * H-01…H-04 (B18 / QR check_out of an overdue stay) belong to PR-A1b (V5-15), H-08 to PR-B2 (V5-16).
 */
import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ModulesContainer } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { OPENAPI_META } from '../../src/generated/openapi-meta';
import { OPERATION_KEY } from '../../src/shared/http/operation';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { type SalesIds, seedGuest, seedSales } from '../helpers/sales-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

interface FieldCase {
  id: string;
  operationId: string;
  method: string;
  path: string;
  field: string;
  subject: string;
  roles: string[];
  expected: 'pass' | '403';
}

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/rbac-cases.json'), 'utf8'),
) as { fieldCases: FieldCase[] };

/** Problem members a field-gate 403 may carry – no extension field (contract 1.16). */
const PLAIN_PROBLEM = ['type', 'title', 'status', 'code', 'detail', 'instance', 'requestId'];

function implementedOperations(fa: FeatureApp): Set<string> {
  const ops = new Set<string>();
  for (const mod of fa.app.get(ModulesContainer).values()) {
    for (const wrapper of mod.controllers.values()) {
      const proto = (wrapper.metatype as { prototype?: object } | null)?.prototype;
      if (!proto) continue;
      for (const name of Object.getOwnPropertyNames(proto)) {
        const fn = (proto as Record<string, unknown>)[name];
        if (typeof fn !== 'function') continue;
        const op = Reflect.getMetadata(OPERATION_KEY, fn) as string | undefined;
        if (op) ops.add(op);
      }
    }
  }
  return ops;
}

/** `nightlyRates` → { nightlyRates: [] }, `rooms[].nightlyRates` → { rooms: [{ nightlyRates: [] }] }. */
function bodySending(path: string): Record<string, unknown> {
  const segs = path.split('.');
  const walk = (i: number): Record<string, unknown> => {
    const seg = segs[i] as string;
    const name = seg.endsWith('[]') ? seg.slice(0, -2) : seg;
    if (i === segs.length - 1) return { [name]: [] };
    const inner = walk(i + 1);
    return { [name]: seg.endsWith('[]') ? [inner] : inner };
  };
  return walk(0);
}

describe.skipIf(!HAS_DB)('x-write-roles gate (contract 0.3.13 1.16)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: SalesIds;
  let guestSal: string;
  let guestCtv: string;
  let guestFdsal: string;
  const userBySubject: Record<string, string> = {
    'qa.owner': 'owner',
    'qa.mgr': 'mgr',
    'qa.fdl': 'fdl',
    'qa.fd': 'fd',
    'qa.sal': 'sal',
    'qa.ctv1': 'ctv',
    'qa.fdsal': 'fdsal',
  };

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, {
      users: {
        owner: ['owner'],
        mgr: ['manager'],
        fdl: ['front_desk_lead'],
        fd: ['front_desk'],
        sal: ['sales_staff'],
        ctv: ['collaborator'],
        fdsal: ['front_desk', 'sales_staff'],
        fdsal2: ['front_desk', 'sales_staff'],
      },
    });
    ids = await seedSales(db, t);
    guestSal = await seedGuest(db, t, t.users.sal!.id);
    guestCtv = await seedGuest(db, t, t.users.ctv!.id);
    guestFdsal = await seedGuest(db, t, t.users.fdsal2!.id);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  /** Short direct quote 9–12/11 (Mon–Thu, 3 nights, room 202). */
  const quote = (extra: Record<string, unknown> = {}) => ({
    type: 'short',
    roomId: ids.rooms['202'],
    arrivalDate: '2026-11-09',
    nights: 3,
    adults: 2,
    channelId: ids.channels.direct,
    ...extra,
  });
  /** Every night sent back untouched (`edited = false`) – valid with and without V5-14. */
  const untouched = [
    { date: '2026-11-09', amountVnd: 792_000, edited: false },
    { date: '2026-11-10', amountVnd: 792_000, edited: false },
    { date: '2026-11-11', amountVnd: 792_000, edited: false },
  ];

  interface Denied {
    reason: string | null;
    after: { operationId?: string; roles?: string[]; fields?: string[] } | null;
  }
  const denied = async (operationId: string, user: string): Promise<Denied[]> =>
    (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<Denied>(
          `SELECT reason, after FROM audit_event
            WHERE organization_id = $1 AND action = 'access.denied' AND entity_type = 'operation'
              AND entity_id = $2 AND actor_user_id = $3
            ORDER BY occurred_at, id`,
          [t.organizationId, operationId, t.users[user]!.id],
        ),
      )
    ).rows;
  const quoteCount = async (user: string): Promise<number> =>
    Number(
      (
        await db.withContext(t.ctx(), (tx) =>
          tx.query<{ n: string }>('SELECT count(*) AS n FROM quote WHERE created_by = $1', [
            t.users[user]!.id,
          ]),
        )
      ).rows[0]!.n,
    );

  /** 403 of the field gate: plain Problem (no min/max/dates/errors) + one more access.denied WRITE_ROLES. */
  async function expectFieldDenied(
    res: { statusCode: number; body: string; json(): Record<string, unknown> },
    operationId: string,
    user: string,
    before: number,
    field = 'nightlyRates',
  ): Promise<void> {
    expect(res.statusCode, res.body).toBe(403);
    const body = res.json();
    expect(body.code).toBe('FORBIDDEN_ACTION');
    for (const k of Object.keys(body)) expect(PLAIN_PROBLEM, `extension "${k}"`).toContain(k);
    const rows = await denied(operationId, user);
    expect(rows.length, 'exactly one access.denied (H-09)').toBe(before + 1);
    const last = rows[rows.length - 1]!;
    expect(last.reason).toBe('WRITE_ROLES');
    expect(last.after).toMatchObject({ operationId, fields: [field] });
  }

  describe('rbac-cases.json fieldCases (implemented operations)', () => {
    const cases = () => {
      const implemented = implementedOperations(fa);
      return fixture.fieldCases.filter((c) => implemented.has(c.operationId));
    };

    it('covers calculateQuote and saveQuote (createReservationGroup has no route yet – R3)', () => {
      const ops = new Set(cases().map((c) => c.operationId));
      expect(ops).toEqual(
        new Set(
          Object.entries(OPENAPI_META.operations)
            .filter(([id, m]) => m.writeRoles && implementedOperations(fa).has(id))
            .map(([id]) => id),
        ),
      );
      expect(ops.has('calculateQuote') && ops.has('saveQuote')).toBe(true);
    });

    it('each case: 403 without extension + one access.denied, or the gate lets it through', async () => {
      for (const c of cases()) {
        const user = userBySubject[c.subject];
        expect(user, c.subject).toBeDefined();
        const before = (await denied(c.operationId, user!)).length;
        const res = await Client.of(fa, t, user!).send(
          c.method as 'POST',
          c.path.replace('{propertyId}', t.propertyIds[0]!),
          bodySending(c.field),
        );
        if (c.expected === '403') {
          await expectFieldDenied(res, c.operationId, user!, before, c.field);
        } else {
          // Passed the gate: the (empty) body is then refused by validation – never 401/403/500.
          expect([401, 403, 500], `${c.id}: ${res.statusCode} ${res.body}`).not.toContain(
            res.statusCode,
          );
          expect((await denied(c.operationId, user!)).length, c.id).toBe(before);
        }
      }
    });
  });

  describe('hand-written deny cases (contract 1.16)', () => {
    it('H-05: CTV saveQuote with nightlyRates → 403, no quote saved, one access.denied', async () => {
      const before = (await denied('saveQuote', 'ctv')).length;
      const quotes = await quoteCount('ctv');
      const res = await Client.of(fa, t, 'ctv').send('POST', `${P(t)}/quotes`, {
        ...quote({ channelId: ids.channels.collaborator, nightlyRates: untouched }),
        guestId: guestCtv,
      });
      await expectFieldDenied(res, 'saveQuote', 'ctv', before);
      expect(await quoteCount('ctv')).toBe(quotes);
      // control: the same quote without the field is saved
      const ok = await Client.of(fa, t, 'ctv').send('POST', `${P(t)}/quotes`, {
        ...quote({ channelId: ids.channels.collaborator }),
        guestId: guestCtv,
      });
      expect(ok.statusCode, ok.body).toBe(201);
      expect(await quoteCount('ctv')).toBe(quotes + 1);
    });

    it('H-05 (SAL): saveQuote with nightlyRates → 403, nothing saved', async () => {
      const before = (await denied('saveQuote', 'sal')).length;
      const quotes = await quoteCount('sal');
      const res = await Client.of(fa, t, 'sal').send('POST', `${P(t)}/quotes`, {
        ...quote({ nightlyRates: untouched }),
        guestId: guestSal,
      });
      await expectFieldDenied(res, 'saveQuote', 'sal', before);
      expect(await quoteCount('sal')).toBe(quotes);
    });

    it('H-06: SAL and CTV calculateQuote with nightlyRates → 403; without it → 200', async () => {
      for (const [user, channel] of [
        ['sal', ids.channels.direct],
        ['ctv', ids.channels.collaborator],
      ] as const) {
        const before = (await denied('calculateQuote', user)).length;
        const res = await Client.of(fa, t, user).send('POST', `${P(t)}/quotes/calculate`, {
          ...quote({ channelId: channel, nightlyRates: untouched }),
        });
        await expectFieldDenied(res, 'calculateQuote', user, before);
        const ok = await Client.of(fa, t, user).send(
          'POST',
          `${P(t)}/quotes/calculate`,
          quote({ channelId: channel }),
        );
        expect(ok.statusCode, ok.body).toBe(200);
      }
    });

    it('H-07: SAL nightlyRates under the floor → 403 (not 422 RATE_OUT_OF_RANGE), no min/max/dates', async () => {
      const before = (await denied('calculateQuote', 'sal')).length;
      const res = await Client.of(fa, t, 'sal').send('POST', `${P(t)}/quotes/calculate`, {
        ...quote({
          nightlyRates: untouched.map((n) => ({ ...n, amountVnd: 1_000, edited: true })),
        }),
      });
      await expectFieldDenied(res, 'calculateQuote', 'sal', before);
      expect(res.json()).not.toHaveProperty('min');
      expect(res.json()).not.toHaveProperty('max');
      expect(res.json()).not.toHaveProperty('dates');
    });

    it('`null` and `[]` count as sent', async () => {
      for (const value of [null, []]) {
        const before = (await denied('calculateQuote', 'sal')).length;
        const res = await Client.of(fa, t, 'sal').send('POST', `${P(t)}/quotes/calculate`, {
          ...quote({ nightlyRates: value }),
        });
        await expectFieldDenied(res, 'calculateQuote', 'sal', before);
      }
    });

    it('before every body check: an invalid body with the field still gets 403, not 422', async () => {
      for (const body of [
        { nightlyRates: untouched },
        { type: 'weekly', arrivalDate: '2026-02-30', nightlyRates: 'x' },
        { ...quote({ channelId: ids.channels.internal }), nightlyRates: untouched },
      ]) {
        const before = (await denied('calculateQuote', 'ctv')).length;
        const res = await Client.of(fa, t, 'ctv').send('POST', `${P(t)}/quotes/calculate`, body);
        await expectFieldDenied(res, 'calculateQuote', 'ctv', before);
      }
      // saveQuote: the 403 also comes before the Idempotency-Key claim (no key row is written)
      const key = randomUUID();
      const res = await Client.of(fa, t, 'sal').send(
        'POST',
        `${P(t)}/quotes`,
        { nightlyRates: [] },
        { 'idempotency-key': key },
      );
      expect(res.statusCode).toBe(403);
      const { rowCount } = await db.withContext(t.ctx(), (tx) =>
        tx.query('SELECT 1 FROM idempotency_key WHERE principal_id = $1 AND key = $2', [
          t.users.sal!.id,
          key,
        ]),
      );
      expect(rowCount).toBe(0);
    });

    it('T14-12: FD ∪ SAL may send nightlyRates (union, BA 46b) – no access.denied', async () => {
      const before = (await denied('calculateQuote', 'fdsal')).length;
      const res = await Client.of(fa, t, 'fdsal').send('POST', `${P(t)}/quotes/calculate`, {
        ...quote({ nightlyRates: untouched }),
      });
      expect(res.statusCode, res.body).toBe(200);
      expect((await denied('calculateQuote', 'fdsal')).length).toBe(before);
    });

    it('ADR-009: a key completed while the user could send the field still replays; a fresh key → 403', async () => {
      const key = randomUUID();
      const body = { ...quote({ nightlyRates: untouched }), guestId: guestFdsal };
      const c = Client.of(fa, t, 'fdsal2');
      const first = await c.send('POST', `${P(t)}/quotes`, body, { 'idempotency-key': key });
      expect(first.statusCode, first.body).toBe(201);
      // fdsal2 loses the desk role and keeps sales_staff (+ an unrelated one)
      await db.withContext(t.ctx(), async (tx) => {
        await tx.query(
          `UPDATE user_property_role SET role = 'housekeeping' WHERE user_id = $1 AND role = 'front_desk'`,
          [t.users.fdsal2!.id],
        );
        await tx.query('UPDATE app_user SET roles_version = roles_version + 1 WHERE id = $1', [
          t.users.fdsal2!.id,
        ]);
      });
      const before = (await denied('saveQuote', 'fdsal2')).length;
      const replay = await c.send('POST', `${P(t)}/quotes`, body, { 'idempotency-key': key });
      expect(replay.statusCode, replay.body).toBe(201);
      expect(replay.headers['idempotent-replayed']).toBe('true');
      expect(replay.json().id).toBe(first.json().id);
      expect((await denied('saveQuote', 'fdsal2')).length).toBe(before);
      const fresh = await c.send('POST', `${P(t)}/quotes`, body);
      await expectFieldDenied(fresh, 'saveQuote', 'fdsal2', before);
    });
  });
});
