/**
 * R3-OPS-02 (v1.0 blocker – `rounds/round-03/outputs/OPS/v1-production.md` section 9): ONE-TIME initialisation of
 * an empty production database. No HTTP endpoint; run by OPS through `production-bootstrap-cli.ts`.
 * Creates, in ONE transaction (a failure leaves the database untouched):
 * - the organisation and the property OTTIMO Đà Lạt, the 3 room groups and the 10 units (production-defaults.ts);
 * - the sales channels (BR-901) and the BR section 13 parameters the catalogue has no default for (plus the
 *   document retention keys whose production value is set by BR v0.4.4);
 * - the first `owner` with a RANDOM temporary password (`must_change_password = true`; under MFA_ENFORCED the first
 *   sign-in is the restricted enrolment session – SEC 06.4), returned to the caller ONCE and never stored or logged.
 * Never creates guests, bookings, payments, room prices, the VietQR receiving account, the Wi-Fi password or devices.
 * Idempotency: refused when the database already holds ANY property (SECURITY DEFINER `worker_list_properties`,
 * read before anything is written) or the organisation code / owner username already exist (unique keys – a
 * concurrent second run fails on them and rolls back).
 * Runs as the application role (DATABASE_URL = ottimo_app) through the same RLS context as the api.
 */
import { randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import type { Clock } from '../clock';
import { type Database, type TenantContext, pgCode } from '../db/database';
import { AuditService } from '../modules/audit/public/audit.service';
import { hashPassword, passwordPolicyErrors } from '../modules/identity/public/passwords';
import { importChannels } from '../modules/platform/public/channels';
import {
  checkBusinessBounds,
  checkSecurityBounds,
  checkValueSchema,
} from '../modules/platform/public/parameter.service';
import { localDate } from '../shared/time';
import {
  INV_ENTERS_KEYS,
  PRODUCTION_CHANNELS,
  PRODUCTION_ORGANIZATION,
  PRODUCTION_PARAMETERS,
  PRODUCTION_PROPERTY,
  PRODUCTION_ROOMS,
  PRODUCTION_ROOM_GROUPS,
} from './production-defaults';

export class BootstrapRefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BootstrapRefusedError';
  }
}

export interface BootstrapInput {
  ownerUsername: string;
  ownerDisplayName: string;
  /** Who runs the command (OPS person) – recorded in the audit row, nothing else. */
  operator: string;
  clock: Clock;
}

export interface BootstrapResult {
  organizationId: string;
  propertyId: string;
  ownerUserId: string;
  /** Shown ONCE on the operator's terminal by the CLI; never persisted in clear. */
  temporaryPassword: string;
  roomGroups: number;
  rooms: number;
  channels: number;
  parameters: number;
}

const USERNAME = /^[a-z0-9][a-z0-9._-]{2,63}$/;

/** 24 base64url characters (144 bits); re-drawn until it passes the V-10 policy (never in practice more than once). */
export function temporaryPassword(username: string): string {
  for (;;) {
    const p = randomBytes(18).toString('base64url');
    if (passwordPolicyErrors('password', p, username).length === 0) return p;
  }
}

export async function bootstrapProduction(
  database: Database,
  input: BootstrapInput,
): Promise<BootstrapResult> {
  const username = input.ownerUsername.trim().toLowerCase();
  if (!USERNAME.test(username)) {
    throw new BootstrapRefusedError(
      'owner username: 3–64 of a-z 0-9 . _ - (starting with a letter or digit)',
    );
  }
  const displayName = input.ownerDisplayName.trim();
  if (displayName.length < 1 || displayName.length > 100) {
    throw new BootstrapRefusedError('owner display name is required (≤ 100 characters)');
  }
  const operator = input.operator.trim();
  if (operator.length < 1 || operator.length > 100) {
    throw new BootstrapRefusedError('operator is required (≤ 100 characters)');
  }
  for (const p of PRODUCTION_PARAMETERS) {
    if (INV_ENTERS_KEYS.includes(p.key)) {
      throw new Error(`production-defaults: ${p.key} is entered by INV, never by the bootstrap`);
    }
  }

  // Refuse a database that already has a property – before any write (and before argon2).
  const existing = await database.entry(async (tx) => {
    const r = await tx.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM worker_list_properties()',
    );
    const u = await tx.query<{ user_id: string }>('SELECT user_id FROM auth_find_user($1)', [
      username,
    ]);
    return { properties: r.rows[0]?.n ?? 0, userTaken: u.rows.length > 0 };
  });
  if (existing.properties > 0) {
    throw new BootstrapRefusedError(
      'the database already holds a property – the production bootstrap runs once, on an empty database',
    );
  }
  if (existing.userTaken) throw new BootstrapRefusedError('owner username already exists');

  const clock = input.clock;
  const password = temporaryPassword(username);
  const passwordHash = await hashPassword(password);
  const organizationId = uuidv7();
  const propertyId = uuidv7();
  const ownerUserId = uuidv7();
  const now = clock.now();
  const today = localDate(now, PRODUCTION_PROPERTY.timezone);
  const ctx: TenantContext = { organizationId, propertyId, userId: null, actorType: 'system' };
  const audit = new AuditService(clock, database);

  try {
    await database.withContext(ctx, async (tx) => {
      await tx.query(
        `INSERT INTO organization (id, code, name, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'active', $4, $4)`,
        [organizationId, PRODUCTION_ORGANIZATION.code, PRODUCTION_ORGANIZATION.name, now],
      );
      await tx.query(
        `INSERT INTO property (id, organization_id, code, name, timezone, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $6)`,
        [
          propertyId,
          organizationId,
          PRODUCTION_PROPERTY.code,
          PRODUCTION_PROPERTY.name,
          PRODUCTION_PROPERTY.timezone,
          now,
        ],
      );

      // BR section 13 parameters, checked like ParameterService.validate: security keys against the SEC hard
      // bounds (OpenAPI x-security-parameters), the others against the catalogue type and the erd 9.1a bounds.
      for (const p of PRODUCTION_PARAMETERS) {
        const def = await tx.query<{
          value_schema: string;
          is_security: boolean;
          bounds: { min?: number; max?: number; allowed?: unknown[] } | null;
        }>('SELECT value_schema, is_security, bounds FROM config_parameter_def WHERE key = $1', [
          p.key,
        ]);
        const row = def.rows[0];
        if (!row) throw new Error(`parameter ${p.key} is not in the catalogue`);
        if (row.is_security) {
          checkSecurityBounds(p.key, p.value);
        } else {
          if (checkValueSchema(row.value_schema, p.value)) {
            throw new Error(
              `parameter ${p.key}: value does not match catalogue type ${row.value_schema}`,
            );
          }
          checkBusinessBounds(row.bounds, p.value);
        }
        await tx.query(
          `INSERT INTO config_parameter (id, organization_id, property_id, key, value, effective_from,
             status_label, reason, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'production bootstrap (BR section 13)', $8, $8)`,
          [
            uuidv7(),
            organizationId,
            propertyId,
            p.key,
            JSON.stringify(p.value),
            today,
            p.status,
            now,
          ],
        );
      }

      // Room groups and units – no list price (INV enters prices in the app, BR-101).
      const groupIds = new Map<string, string>();
      for (const g of PRODUCTION_ROOM_GROUPS) {
        const id = uuidv7();
        await tx.query(
          `INSERT INTO room_group (id, organization_id, property_id, code, name, sort_order, base_occupancy,
             max_occupancy, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
          [
            id,
            organizationId,
            propertyId,
            g.code,
            g.name,
            g.sortOrder,
            g.baseOccupancy,
            g.maxOccupancy,
            now,
          ],
        );
        groupIds.set(g.code, id);
      }
      for (const r of PRODUCTION_ROOMS) {
        const groupId = groupIds.get(r.group);
        if (!groupId) throw new Error(`room ${r.roomNo}: unknown group ${r.group}`);
        await tx.query(
          `INSERT INTO room (id, organization_id, property_id, room_group_id, room_no, name, floor, base_occupancy,
             max_occupancy, public_slug, is_sellable, active_from, public_room_type, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, $13, $13)`,
          [
            uuidv7(),
            organizationId,
            propertyId,
            groupId,
            r.roomNo,
            r.name,
            Number(r.roomNo.slice(0, 1)),
            r.baseOccupancy,
            r.maxOccupancy,
            randomBytes(9).toString('base64url'),
            today,
            r.publicRoomType,
            now,
          ],
        );
      }

      const channels = await importChannels(tx, {
        channels: PRODUCTION_CHANNELS.map((c) => ({ ...c, isActive: true })),
        from: today,
        now,
      });

      // First owner: temporary password, must change it; 2FA enrolment is forced by MFA_ENFORCED (SEC 06.4).
      await tx.query(
        `INSERT INTO app_user (id, organization_id, username, display_name, password_hash, status,
           must_change_password, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', true, $6, $6)`,
        [ownerUserId, organizationId, username, displayName, passwordHash, now],
      );
      await tx.query(
        `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_at)
         VALUES ($1, $2, $3, 'owner', $4)`,
        [ownerUserId, propertyId, organizationId, now],
      );

      await audit.record(tx, {
        category: 'data',
        action: 'production.bootstrapped',
        entityType: 'dataset',
        entityId: 'production-bootstrap',
        after: {
          users: 1,
          parameters: PRODUCTION_PARAMETERS.length,
          rooms: PRODUCTION_ROOMS.length,
          channels,
          devices: 0,
        },
        reason: `operator: ${operator}`,
      });
      await audit.record(tx, {
        category: 'security',
        action: 'user.created_by_operator',
        entityType: 'app_user',
        entityId: ownerUserId,
        reason: `production bootstrap – temporary password, must change; operator: ${operator}`,
      });
    });
  } catch (err) {
    if (pgCode(err) === '23505') {
      throw new BootstrapRefusedError('already initialised (organisation or username exists)');
    }
    throw err;
  }

  return {
    organizationId,
    propertyId,
    ownerUserId,
    temporaryPassword: password,
    roomGroups: PRODUCTION_ROOM_GROUPS.length,
    rooms: PRODUCTION_ROOMS.length,
    channels: PRODUCTION_CHANNELS.length,
    parameters: PRODUCTION_PARAMETERS.length,
  };
}
