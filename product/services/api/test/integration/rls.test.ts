/**
 * Row Level Security on the real PostgreSQL as ottimo_app (erd 2.7, coding-standards 10.1a, ADR-007):
 * isolation of 2 properties and 2 organisations, reused pooled connections, anti-bypass attempts.
 */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Database, NO_TENANT, pgCode } from '../../src/db/database';
import {
  HAS_DB,
  T0,
  type TestTenant,
  appDatabase,
  createTenant,
  setParam,
} from '../helpers/tenant';

describe.skipIf(!HAS_DB)('RLS – tenant isolation (erd 2.7)', () => {
  let db: Database;
  let a: TestTenant; // organisation A with 2 properties
  let b: TestTenant; // organisation B

  beforeAll(async () => {
    db = appDatabase(1); // ONE connection: every test reuses the same pooled connection
    a = await createTenant(db, { properties: 2, users: { owner: ['owner'] } });
    b = await createTenant(db, { properties: 1, users: { owner: ['owner'] } });
    await setParam(db, a, 'checkin_time', '14:00', '2026-10-01', 0);
    await setParam(db, a, 'checkin_time', '15:00', '2026-10-01', 1);
    await setParam(db, b, 'checkin_time', '13:00', '2026-10-01', 0);
  });
  afterAll(async () => db.close());

  const values = (ctx: Parameters<Database['withContext']>[0]) =>
    db.withContext(ctx, async (tx) => {
      const r = await tx.query<{ value: string }>(
        `SELECT value FROM config_parameter WHERE key = 'checkin_time' ORDER BY value`,
      );
      return r.rows.map((x) => x.value);
    });

  it('property A sees only its own property-level rows (2 properties, same organisation)', async () => {
    expect(await values(a.ctx(0))).toEqual(['14:00']);
    expect(await values(a.ctx(1))).toEqual(['15:00']);
    expect(await values(b.ctx(0))).toEqual(['13:00']);
  });

  it('organisation-level rows are isolated between organisations', async () => {
    const users = (t: TestTenant) =>
      db.withContext(t.ctx(), async (tx) => {
        const r = await tx.query<{ organization_id: string }>(
          'SELECT organization_id FROM app_user',
        );
        return new Set(r.rows.map((x) => x.organization_id));
      });
    expect([...(await users(a))]).toEqual([a.organizationId]);
    expect([...(await users(b))]).toEqual([b.organizationId]);
  });

  it('a reused connection without context sees 0 rows and raises no error (empty setting → NULLIF)', async () => {
    expect(await values(a.ctx(0))).toEqual(['14:00']);
    // same single pooled connection, previous transaction had a context
    expect(await values(NO_TENANT)).toEqual([]);
    const plain = await db.pool.query('SELECT count(*)::int AS n FROM app_user');
    expect(plain.rows[0].n).toBe(0);
    const setting = await db.pool.query(
      `SELECT current_setting('app.property_id', true) AS p, current_setting('app.organization_id', true) AS o`,
    );
    expect(setting.rows[0]).toEqual({ p: '', o: '' });
  });

  it('WITH CHECK refuses writing a row for another property than the context', async () => {
    await expect(
      db.withContext(a.ctx(0), (tx) =>
        tx.query(
          `INSERT INTO config_parameter (id, organization_id, property_id, key, value, effective_from, created_at, updated_at)
           VALUES ($1, $2, $3, 'checkout_time', '"12:00"', '2026-10-01', $4, $4)`,
          [uuidv7(), a.organizationId, a.propertyIds[1], T0],
        ),
      ),
    ).rejects.toMatchObject({ code: '42501' });
  });

  it('the (organization_id, property_id) pair FK refuses pointing at another organisation’s property', async () => {
    // Even with a context that would pass RLS, a row of org B cannot reference a property of org A (K11).
    const ctx = { ...b.ctx(0), propertyId: a.propertyIds[0] as string };
    await expect(
      db.withContext(ctx, (tx) =>
        tx.query(
          `INSERT INTO job_run (id, organization_id, property_id, job_key, business_date, slot, run_at, status)
           VALUES ($1, $2, $3, 'x', '2026-10-15', '03:00', $4, 'done')`,
          [uuidv7(), b.organizationId, a.propertyIds[0], T0],
        ),
      ),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it('updates and deletes of another tenant’s rows affect 0 rows', async () => {
    const n = await db.withContext(b.ctx(0), async (tx) => {
      const r = await tx.query(
        `UPDATE config_parameter SET reason = 'hijack' WHERE property_id = $1`,
        [a.propertyIds[0]],
      );
      return r.rowCount;
    });
    expect(n).toBe(0);
  });
});

describe.skipIf(!HAS_DB)('RLS – the application role cannot bypass it', () => {
  let db: Database;
  let a: TestTenant;
  beforeAll(async () => {
    db = appDatabase(2);
    a = await createTenant(db, { users: { owner: ['owner'] } });
    await setParam(db, a, 'checkin_time', '14:00');
  });
  afterAll(async () => db.close());

  const fails = async (sql: string): Promise<string | undefined> => {
    try {
      await db.withContext(a.ctx(0), (tx) => tx.query(sql));
      return undefined;
    } catch (e) {
      return pgCode(e);
    }
  };

  it('cannot SET ROLE to the schema owner or the BYPASSRLS readonly role', async () => {
    expect(await fails('SET ROLE ottimo_owner')).toBe('42501');
    expect(await fails('SET ROLE ottimo_readonly')).toBe('42501');
  });

  it('cannot disable RLS, drop a policy or alter a table', async () => {
    expect(await fails('ALTER TABLE config_parameter DISABLE ROW LEVEL SECURITY')).toBe('42501');
    expect(await fails('ALTER TABLE config_parameter NO FORCE ROW LEVEL SECURITY')).toBe('42501');
    expect(await fails('DROP POLICY tenant_isolation ON config_parameter')).toBe('42501');
  });

  it('row_security = off does not reveal rows – the query is refused instead', async () => {
    expect(await fails('SET LOCAL row_security = off; SELECT * FROM config_parameter')).toBe(
      '42501',
    );
  });

  it('cannot read a log partition directly (partition has RLS forced and no grant)', async () => {
    expect(await fails('SELECT * FROM audit_event_p202610')).toBe('42501');
  });

  it('cannot create objects in schema public', async () => {
    expect(await fails('CREATE TABLE sneaky (id int)')).toBe('42501');
    expect(
      await fails(
        `CREATE FUNCTION sneaky() RETURNS int LANGUAGE sql SECURITY DEFINER AS 'SELECT 1'`,
      ),
    ).toBe('42501');
  });

  it('append-only logs: no UPDATE / DELETE for ottimo_app (K8)', async () => {
    for (const t of ['audit_event', 'c3_access_log']) {
      expect(await fails(`UPDATE ${t} SET request_id = 'x'`)).toBe('42501');
      expect(await fails(`DELETE FROM ${t}`)).toBe('42501');
    }
    expect(await fails('TRUNCATE audit_event')).toBe('42501');
  });

  it('the parameter catalogue is read-only for the app', async () => {
    expect(await fails(`UPDATE config_parameter_def SET bounds = NULL`)).toBe('42501');
  });
});
