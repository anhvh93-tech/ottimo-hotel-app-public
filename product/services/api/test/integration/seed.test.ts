/**
 * DS-E loader (pnpm seed:ds-e) on the real PostgreSQL: loads the foundation tables, verifies every
 * document counter against the fixture and stops (rolling everything back) on a code mismatch.
 */
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { verify } from '@node-rs/argon2';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FixedClock } from '../../src/clock';
import type { Database } from '../../src/db/database';
import {
  SeedCodeMismatchError,
  assertExpectedCode,
  readFixture,
  seedDsE,
} from '../../src/db/seed/ds-e';
import { HAS_DB, T0, appDatabase } from '../helpers/tenant';

const FIXTURE = join(__dirname, '..', '..', '..', '..', 'tests', 'fixtures', 'seed', 'ds-e.json');
const password = randomBytes(12).toString('hex');

/** Fresh copy with a unique organisation code (the test DB is shared by many runs). */
function fixture(patch: (f: ReturnType<typeof readFixture>) => void = () => undefined) {
  const f = readFixture(FIXTURE);
  f.organization = { ...f.organization, code: `DSE-${randomBytes(4).toString('hex')}` };
  f.users = f.users.map((u) => ({
    ...u,
    username: `${u.username}.${randomBytes(3).toString('hex')}`,
  }));
  patch(f);
  return f;
}

describe.skipIf(!HAS_DB)('seed:ds-e loader', () => {
  let db: Database;
  const clock = new FixedClock(T0);
  beforeAll(() => {
    db = appDatabase(3);
  });
  afterAll(async () => db.close());

  it('loads organisation, property, 13 users with roles, devices and every parameter; codes match', async () => {
    // GRP- in the fixture vs NH- in BR-007/erd 10 is reported to QA; this run uses the BR value.
    const f = fixture((x) => {
      for (const s of x.docSequences) if (s.docType === 'group') s.prefix = 'NH-';
    });
    const r = await seedDsE({ database: db, clock, fixture: f, password });
    expect(r.users).toBe(f.users.length);
    expect(r.roles).toBe(f.users.reduce((n, u) => n + u.roles.length, 0));
    expect(r.devices).toBe(f.devices.filter((d) => d.trusted).length);
    expect(r.parameters).toBe(f.parameters.length + 2); // + lease_terms, utility_estimate
    expect(r.docSequences.every((d) => d.ok)).toBe(true);
    expect(r.docSequences.map((d) => d.server)).toContain('F26-000001');
    expect(r.aliases).toEqual(['group → reservation_group', 'receipt → payment']);
    expect(r.skippedBlocks.map((b) => b.block)).toContain('rooms');

    const ctx = {
      organizationId: r.organizationId,
      propertyId: r.propertyId,
      userId: null,
      actorType: 'system' as const,
    };
    const rows = await db.withContext(ctx, async (tx) => {
      const users = await tx.query<{ username: string; status: string; password_hash: string }>(
        'SELECT username, status, password_hash FROM app_user ORDER BY username',
      );
      const seq = await tx.query('SELECT 1 FROM doc_sequence');
      const devices = await tx.query<{ device_kind: string }>(
        'SELECT device_kind FROM trusted_device ORDER BY 1',
      );
      return {
        users: users.rows,
        seq: seq.rowCount,
        devices: devices.rows.map((d) => d.device_kind),
      };
    });
    expect(rows.users.find((u) => u.username.startsWith('qa.locked'))?.status).toBe('locked');
    expect(rows.users[0]?.password_hash.startsWith('$argon2id$')).toBe(true);
    expect(await verify(rows.users[0]!.password_hash, password)).toBe(true);
    expect(rows.seq).toBe(0); // probes were rolled back: the first real code is still …-00001
    expect(rows.devices).toEqual(['desk', 'facility_mobile']);
  });

  it('stops on a code mismatch (fixture GRP- vs server NH-) and leaves nothing behind', async () => {
    const f = fixture();
    await expect(seedDsE({ database: db, clock, fixture: f, password })).rejects.toThrow(
      SeedCodeMismatchError,
    );
    const left = await db.entry((tx) =>
      tx.query('SELECT * FROM auth_find_user($1)', [f.users[0]!.username]),
    );
    expect(left.rowCount).toBe(0);
  });

  it('--allow-code-drift loads anyway and reports the drift as a warning', async () => {
    const r = await seedDsE({
      database: db,
      clock,
      fixture: fixture(),
      password,
      allowCodeDrift: true,
    });
    expect(r.warnings.join()).toMatch(/group: server NH-00001 ≠ fixture GRP-00001/);
  });

  it('refuses a weak password and non-fake fixtures; expectedCode comparison is strict', async () => {
    await expect(
      seedDsE({ database: db, clock, fixture: fixture(), password: 'short' }),
    ).rejects.toThrow(/12/);
    await expect(
      seedDsE({ database: db, clock, fixture: fixture((x) => (x.fakeDataOnly = false)), password }),
    ).rejects.toThrow(/fakeDataOnly/);
    expect(() => assertExpectedCode('g1', 'KH-0002', 'KH-0001')).toThrow(SeedCodeMismatchError);
    expect(() => assertExpectedCode('g1', 'KH-0001', 'KH-0001')).not.toThrow();
  });
});
