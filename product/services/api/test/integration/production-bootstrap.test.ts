/**
 * R3-OPS-02 – one-time production bootstrap (`src/admin/production-bootstrap.ts`).
 * (A) Shared test DB (always with properties): the command refuses and writes nothing.
 * (B) A FRESH empty database (`BOOTSTRAP_DATABASE_URL` + `BOOTSTRAP_MIGRATION_DATABASE_URL`, created by CI next to
 *     ottimo_test): migrate → run → 1 property, 3 groups, 10 units with the BR-110 occupancy, channels, every
 *     catalogue key without a default except the INV ones, no price / guest / booking; the owner signs in with
 *     the temporary password into a session that must change the password and enrol 2FA; a second run is refused.
 */
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FixedClock } from '../../src/clock';
import { Database, type TenantContext } from '../../src/db/database';
import { runMigrations } from '../../src/db/migrate';
import { createPool } from '../../src/db/pool';
import {
  BootstrapRefusedError,
  bootstrapProduction,
  temporaryPassword,
} from '../../src/admin/production-bootstrap';
import {
  INV_ENTERS_KEYS,
  PRODUCTION_PARAMETERS,
  PRODUCTION_ROOMS,
} from '../../src/admin/production-defaults';
import { verifyPassword } from '../../src/modules/identity/public/passwords';
import { passwordPolicyErrors } from '../../src/modules/identity/public/passwords';
import { type FeatureApp, startFeatureApp } from '../helpers/feature-app';
import { HAS_DB, T0, appDatabase, createTenant } from '../helpers/tenant';

const clock = new FixedClock(T0);

describe('production bootstrap – unit', () => {
  it('temporary password: 24 chars, passes the V-10 policy, never the same twice', () => {
    const a = temporaryPassword('owner.ottimo');
    const b = temporaryPassword('owner.ottimo');
    expect(a).toHaveLength(24);
    expect(passwordPolicyErrors('p', a, 'owner.ottimo')).toEqual([]);
    expect(a).not.toBe(b);
  });

  it('defaults never carry what INV enters (prices, receiving account, Wi-Fi) and have 10 units', () => {
    const keys = PRODUCTION_PARAMETERS.map((p) => p.key);
    for (const k of INV_ENTERS_KEYS) expect(keys).not.toContain(k);
    expect(keys.filter((k) => /wifi|receiving/.test(k))).toEqual([]);
    expect(new Set(keys).size).toBe(keys.length);
    expect(PRODUCTION_ROOMS.map((r) => r.roomNo)).toEqual([
      '101',
      '102',
      '103',
      '201',
      '202',
      '203',
      '301',
      '302',
      '401',
      '402',
    ]);
  });
});

describe.skipIf(!HAS_DB)('production bootstrap – shared test DB (not empty)', () => {
  let db: Database;
  beforeAll(async () => {
    db = appDatabase(2);
    await createTenant(db); // at least one property
  });
  afterAll(async () => db.close());

  it('refuses a database that already holds a property and writes nothing', async () => {
    const username = `boot-${Date.now().toString(36)}`;
    await expect(
      bootstrapProduction(db, {
        ownerUsername: username,
        ownerDisplayName: 'Owner',
        operator: 'ops-test',
        clock,
      }),
    ).rejects.toBeInstanceOf(BootstrapRefusedError);
    const found = await db.entry((tx) =>
      tx.query('SELECT user_id FROM auth_find_user($1)', [username]),
    );
    expect(found.rows).toHaveLength(0);
  });
});

const BOOT_URL = process.env.BOOTSTRAP_DATABASE_URL;
const BOOT_MIGRATION_URL = process.env.BOOTSTRAP_MIGRATION_DATABASE_URL;

describe.skipIf(!BOOT_URL || !BOOT_MIGRATION_URL)(
  'production bootstrap – fresh empty database',
  () => {
    let db: Database;
    let fa: FeatureApp | undefined;
    let first: Awaited<ReturnType<typeof bootstrapProduction>>;
    const username = 'owner.ottimo';

    beforeAll(async () => {
      await runMigrations(
        BOOT_MIGRATION_URL as string,
        join(__dirname, '..', '..', 'src', 'db', 'migrations'),
      );
      db = new Database(createPool(BOOT_URL as string, { max: 4 }));
      const n = await db.entry((tx) =>
        tx.query<{ n: number }>('SELECT count(*)::int AS n FROM worker_list_properties()'),
      );
      if ((n.rows[0]?.n ?? 0) > 0) {
        throw new Error('BOOTSTRAP_DATABASE_URL must be a freshly created database (recreate it)');
      }
      first = await bootstrapProduction(db, {
        ownerUsername: username,
        ownerDisplayName: 'Chủ đầu tư',
        operator: 'ops-test',
        clock,
      });
    });
    afterAll(async () => {
      await fa?.close();
      await db?.close();
    });

    const ctx = (): TenantContext => ({
      organizationId: first.organizationId,
      propertyId: first.propertyId,
      userId: null,
      actorType: 'system',
    });

    it('creates the property, 3 groups and the 10 units with the BR-110 occupancy – no price', async () => {
      await db.withContext(
        ctx(),
        async (tx) => {
          const p = await tx.query<{ code: string; timezone: string }>(
            'SELECT code, timezone FROM property',
          );
          expect(p.rows).toEqual([{ code: 'DLT', timezone: 'Asia/Ho_Chi_Minh' }]);
          const rooms = await tx.query<{
            room_no: string;
            name: string;
            grp: string;
            base_occupancy: number;
            max_occupancy: number;
            public_room_type: string | null;
            is_sellable: boolean;
          }>(
            `SELECT r.room_no, r.name, g.code AS grp, r.base_occupancy, r.max_occupancy, r.public_room_type,
                  r.is_sellable
             FROM room r JOIN room_group g ON g.id = r.room_group_id ORDER BY r.room_no`,
          );
          expect(rooms.rows).toHaveLength(10);
          const by = Object.fromEntries(rooms.rows.map((r) => [r.room_no, r]));
          for (const no of ['101', '102', '103', '201', '202', '203']) {
            expect(by[no]).toMatchObject({ grp: 'L12', base_occupancy: 2, max_occupancy: 3 });
          }
          for (const no of ['301', '401']) {
            expect(by[no]).toMatchObject({ grp: 'N', base_occupancy: 4, max_occupancy: 5 });
          }
          for (const no of ['302', '402']) {
            expect(by[no]).toMatchObject({ grp: 'NPLUS', base_occupancy: 3, max_occupancy: 4 });
          }
          expect(by['401']).toMatchObject({ name: 'The Pine', public_room_type: 'Signature' });
          expect(rooms.rows.every((r) => r.is_sellable)).toBe(true);
          const groups = await tx.query('SELECT 1 FROM room_group');
          expect(groups.rows).toHaveLength(3);
          const counts = await tx.query<Record<string, number>>(
            `SELECT (SELECT count(*)::int FROM room_list_price) AS prices,
                  (SELECT count(*)::int FROM reservation) AS reservations,
                  (SELECT count(*)::int FROM guest) AS guests,
                  (SELECT count(*)::int FROM payment) AS payments,
                  (SELECT count(*)::int FROM trusted_device) AS devices,
                  (SELECT count(*)::int FROM item) AS items,
                  (SELECT count(*)::int FROM channel) AS channels`,
          );
          expect(counts.rows[0]).toEqual({
            prices: 0,
            reservations: 0,
            guests: 0,
            payments: 0,
            devices: 0,
            items: 0,
            channels: 8,
          });
        },
        { readOnly: true },
      );
    });

    it('writes every catalogue key without a default, except the ones INV enters', async () => {
      await db.withContext(
        ctx(),
        async (tx) => {
          const missing = await tx.query<{ key: string }>(
            `SELECT d.key FROM config_parameter_def d
            WHERE d.default_value IS NULL
              AND NOT EXISTS (SELECT 1 FROM config_parameter c WHERE c.key = d.key)
            ORDER BY d.key`,
          );
          expect(missing.rows.map((r) => r.key)).toEqual([...INV_ENTERS_KEYS].sort());
          const n = await tx.query<{ n: number }>(
            'SELECT count(*)::int AS n FROM config_parameter',
          );
          expect(n.rows[0]?.n).toBe(PRODUCTION_PARAMETERS.length);
          const tz = await tx.query<{ value: unknown }>(
            `SELECT value FROM config_parameter WHERE key = 'business_day_rollover'`,
          );
          expect(tz.rows[0]?.value).toBe('06:00');
        },
        { readOnly: true },
      );
    });

    it('first owner: hashed temporary password, must change it, owner role; audit without the password', async () => {
      await db.withContext(
        ctx(),
        async (tx) => {
          const u = await tx.query<{
            password_hash: string;
            must_change_password: boolean;
            mfa_enabled: boolean;
            status: string;
          }>(
            'SELECT password_hash, must_change_password, mfa_enabled, status FROM app_user WHERE id = $1',
            [first.ownerUserId],
          );
          const row = u.rows[0]!;
          expect(row).toMatchObject({
            must_change_password: true,
            mfa_enabled: false,
            status: 'active',
          });
          expect(row.password_hash).not.toContain(first.temporaryPassword);
          expect(await verifyPassword(row.password_hash, first.temporaryPassword)).toBe(true);
          const roles = await tx.query<{ role: string }>(
            'SELECT role FROM user_property_role WHERE user_id = $1',
            [first.ownerUserId],
          );
          expect(roles.rows).toEqual([{ role: 'owner' }]);
          const audit = await tx.query<{ text: string }>(
            `SELECT coalesce(reason, '') || coalesce(after::text, '') AS text FROM audit_event
            WHERE action IN ('production.bootstrapped', 'user.created_by_operator')`,
          );
          expect(audit.rows).toHaveLength(2);
          for (const a of audit.rows) expect(a.text).not.toContain(first.temporaryPassword);
        },
        { readOnly: true },
      );
    });

    it('the owner signs in with the temporary password: must change it and enrol 2FA (MFA_ENFORCED)', async () => {
      fa = await startFeatureApp(db, { mfaEnforced: true });
      const res = await fa.app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { username, password: first.temporaryPassword },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ mustChangePassword: true, mfaEnrollmentRequired: true });
    });

    it('a second run is refused and changes nothing', async () => {
      await expect(
        bootstrapProduction(db, {
          ownerUsername: 'owner.second',
          ownerDisplayName: 'X',
          operator: 'ops-test',
          clock,
        }),
      ).rejects.toBeInstanceOf(BootstrapRefusedError);
      const n = await db.entry((tx) =>
        tx.query<{ n: number }>('SELECT count(*)::int AS n FROM worker_list_properties()'),
      );
      expect(n.rows[0]?.n).toBe(1);
      const u = await db.entry((tx) =>
        tx.query('SELECT 1 FROM auth_find_user($1)', ['owner.second']),
      );
      expect(u.rows).toHaveLength(0);
    });
  },
);
