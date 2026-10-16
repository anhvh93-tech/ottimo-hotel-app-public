/**
 * Integration-test fixtures on the real PostgreSQL, created through the application role and the same
 * RLS context as the api (no superuser shortcut). Every call makes a NEW organisation with random codes,
 * so tests never depend on each other or on order. Fake data only.
 */
import { randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { Database, type TenantContext } from '../../src/db/database';
import { createPool } from '../../src/db/pool';
import { sha256Hex } from '../../src/shared/http/auth.guard';

export const HAS_DB = !!process.env.DATABASE_URL && !!process.env.MIGRATION_DATABASE_URL;
export const T0 = new Date('2026-10-15T02:00:00.000Z'); // 09:00 Asia/Ho_Chi_Minh

export function appDatabase(max = 5): Database {
  return new Database(createPool(process.env.DATABASE_URL as string, { max }));
}

export interface TestUser {
  id: string;
  username: string;
  roles: string[];
  /** Session cookie value (only its SHA-256 is stored). */
  sessionToken: string;
}

export interface TestTenant {
  organizationId: string;
  propertyIds: string[];
  users: Record<string, TestUser>;
  ctx(propertyIndex?: number): TenantContext;
  deviceToken(propertyIndex?: number, kind?: 'desk' | 'facility_mobile'): Promise<string>;
}

const rand = () => randomBytes(6).toString('hex');

export async function createTenant(
  db: Database,
  opts: { properties?: number; users?: Record<string, string[]>; now?: Date } = {},
): Promise<TestTenant> {
  const now = opts.now ?? T0;
  const organizationId = uuidv7();
  const propertyIds = Array.from({ length: opts.properties ?? 1 }, () => uuidv7());
  const users: Record<string, TestUser> = {};
  const orgCtx: TenantContext = {
    organizationId,
    propertyId: null,
    userId: null,
    actorType: 'system',
  };

  await db.withContext(orgCtx, async (tx) => {
    await tx.query(
      `INSERT INTO organization (id, code, name, created_at, updated_at) VALUES ($1, $2, 'Test org', $3, $3)`,
      [organizationId, `T-${rand()}`, now],
    );
    for (const [i, pid] of propertyIds.entries()) {
      await tx.query(
        `INSERT INTO property (id, organization_id, code, name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5)`,
        [pid, organizationId, `P${i}`, `Test property ${i}`, now],
      );
    }
    for (const [name, roles] of Object.entries(opts.users ?? {})) {
      const id = uuidv7();
      const username = `t.${name}.${rand()}`;
      const sessionToken = randomBytes(32).toString('base64url');
      await tx.query(
        `INSERT INTO app_user (id, organization_id, username, display_name, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'x', $5, $5)`,
        [id, organizationId, username, name, now],
      );
      for (const role of roles) {
        await tx.query(
          `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, propertyIds[0], organizationId, role, now],
        );
      }
      await tx.query(
        `INSERT INTO user_session (id, organization_id, user_id, active_property_id, client_origin,
           created_at, last_active_at, idle_expires_at, expires_at)
         VALUES ($1, $2, $3, $4, 'admin', $5, $5, $6, $6)`,
        [
          sha256Hex(sessionToken),
          organizationId,
          id,
          propertyIds[0],
          now,
          new Date(now.getTime() + 12 * 3600_000),
        ],
      );
      users[name] = { id, username, roles, sessionToken };
    }
  });

  const ctx = (i = 0): TenantContext => ({
    organizationId,
    propertyId: propertyIds[i] ?? null,
    userId: null,
    actorType: 'system',
  });

  return {
    organizationId,
    propertyIds,
    users,
    ctx,
    async deviceToken(i = 0, kind = 'desk') {
      const token = randomBytes(32).toString('base64url');
      await db.withContext(ctx(i), (tx) =>
        tx.query(
          `INSERT INTO trusted_device (id, organization_id, property_id, name, device_kind, token_hash, created_at, expires_at)
           VALUES ($1, $2, $3, 'test device', $4, $5, $6, $7)`,
          [
            uuidv7(),
            organizationId,
            propertyIds[i],
            kind,
            sha256Hex(token),
            now,
            new Date(now.getTime() + 86_400_000),
          ],
        ),
      );
      return token;
    },
  };
}

/** Business parameter row for a property (seed-like, bypassing the setParameter use case). */
export async function setParam(
  db: Database,
  t: TestTenant,
  key: string,
  value: unknown,
  effectiveFrom = '2026-10-01',
  propertyIndex = 0,
): Promise<void> {
  await db.withContext(t.ctx(propertyIndex), (tx) =>
    tx.query(
      `INSERT INTO config_parameter (id, organization_id, property_id, key, value, effective_from, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
      [
        uuidv7(),
        t.organizationId,
        t.propertyIds[propertyIndex],
        key,
        JSON.stringify(value),
        effectiveFrom,
        T0,
      ],
    ),
  );
}
