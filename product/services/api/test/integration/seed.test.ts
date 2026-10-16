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
    const f = fixture(); // the real fixture (QA fixed FB-R2-BE-QA-01: NH-, erd 10 names)
    const r = await seedDsE({ database: db, clock, fixture: f, password });
    expect(r.users).toBe(f.users.length);
    expect(r.roles).toBe(f.users.reduce((n, u) => n + u.roles.length, 0));
    expect(r.devices).toBe(f.devices.filter((d) => d.trusted).length);
    expect(r.parameters).toBe(f.parameters.length + 2); // + lease_terms, utility_estimate
    expect(r.docSequences.every((d) => d.ok)).toBe(true);
    expect(r.docSequences.map((d) => d.server)).toContain('F26-000001');
    expect(r.skippedBlocks.map((b) => b.block)).not.toContain('rooms'); // rooms loaded since Sprint 1 (BE-B)
    // BE-B: room catalogue through importRoomCatalog (BR-101 nightly price checked against the fixture).
    expect(r.roomGroups).toBe((f.roomGroups as unknown[]).length);
    expect(r.rooms).toBe((f.rooms as unknown[]).length);

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

  /** Drift injected in the test copy: the fixture expects GRP- while the server issues NH- (BR-007). */
  const drifted = () =>
    fixture((x) => {
      for (const s of x.docSequences) if (s.docType === 'reservation_group') s.prefix = 'GRP-';
    });

  it('stops on a code mismatch (fixture GRP- vs server NH-) and leaves nothing behind', async () => {
    const f = drifted();
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
      fixture: drifted(),
      password,
      allowCodeDrift: true,
    });
    expect(r.warnings.join()).toMatch(/reservation_group: server NH-00001 ≠ fixture GRP-00001/);
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
    const legacy = fixture((x) => {
      const s = x.docSequences.find((d) => d.docType === 'payment');
      if (s) s.docType = 'receipt'; // pre-erd name: no alias any more
    });
    await expect(seedDsE({ database: db, clock, fixture: legacy, password })).rejects.toThrow(
      /unknown docType receipt/,
    );
  });
});
