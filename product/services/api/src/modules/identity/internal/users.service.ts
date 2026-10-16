/**
 * US-002 – accounts and roles (rbac A100, owner only; x-roles enforced by the guard).
 * Scope: an owner manages roles at the properties where they hold `owner` ("owned properties"); users are
 * visible when they hold (or held) a role at one of those properties. Another user → 404.
 * - Role change / disable / password reset: same transaction bumps roles_version and revokes every
 *   session of the user (SR-SES-06, SR-AZ-08); audit_event category security (SR-AUTH-07).
 * - LAST_OWNER (rbac 5.3): the owner rows of the affected properties are locked FOR UPDATE so two owners
 *   cannot remove each other concurrently; a property must keep ≥ 1 active owner.
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import { type Tx, pgCode } from '../../../db/database';
import { STAFF_ROLES } from '../../../db/schema';
import { type FieldError, problem } from '../../../shared/problem';
import { toZonedIso } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { hashPassword, passwordPolicyErrors } from '../public/passwords';
import { SessionService } from '../public/session.service';

export interface PropertyRole {
  propertyId: string;
  role: string;
}

export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  status: 'active' | 'locked' | 'disabled';
  roles: PropertyRole[];
  lastLoginAt?: string;
  version: number;
}

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  status: 'active' | 'locked' | 'disabled';
  last_login_at: Date | null;
  version: number;
}

const ROLE_SET = new Set<string>(STAFF_ROLES);

@Injectable()
export class UsersService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(SessionService) private readonly sessions: SessionService,
  ) {}

  async ownedProperties(tx: Tx, ownerId: string): Promise<string[]> {
    const { rows } = await tx.query<{ property_id: string }>(
      `SELECT property_id FROM user_property_role
        WHERE user_id = $1 AND role = 'owner' AND revoked_at IS NULL ORDER BY property_id`,
      [ownerId],
    );
    return rows.map((r) => r.property_id);
  }

  private async timezone(tx: Tx): Promise<string> {
    if (!tx.ctx.propertyId) return 'UTC';
    const { rows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    return rows[0]?.timezone ?? 'UTC';
  }

  private async toDtos(tx: Tx, users: UserRow[], owned: string[]): Promise<UserDto[]> {
    if (users.length === 0) return [];
    const { rows } = await tx.query<{ user_id: string; property_id: string; role: string }>(
      `SELECT user_id, property_id, role FROM user_property_role
        WHERE user_id = ANY($1::uuid[]) AND property_id = ANY($2::uuid[]) AND revoked_at IS NULL
        ORDER BY property_id, role`,
      [users.map((u) => u.id), owned],
    );
    const tz = await this.timezone(tx);
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      status: u.status,
      roles: rows
        .filter((r) => r.user_id === u.id)
        .map((r) => ({ propertyId: r.property_id, role: r.role })),
      ...(u.last_login_at ? { lastLoginAt: toZonedIso(u.last_login_at, tz) } : {}),
      version: u.version,
    }));
  }

  async list(
    tx: Tx,
    ownerId: string,
    page: { cursor?: string | undefined; limit: number },
  ): Promise<{ data: UserDto[]; page: { nextCursor: string | null; limit: number } }> {
    const owned = await this.ownedProperties(tx, ownerId);
    const { rows } = await tx.query<UserRow>(
      `SELECT u.id, u.username, u.display_name, u.status, u.last_login_at, u.version
         FROM app_user u
        WHERE EXISTS (SELECT 1 FROM user_property_role r
                       WHERE r.user_id = u.id AND r.property_id = ANY($1::uuid[]))
          AND ($2::uuid IS NULL OR u.id > $2)
        ORDER BY u.id LIMIT $3`,
      [owned, page.cursor ?? null, page.limit + 1],
    );
    const more = rows.length > page.limit;
    const users = rows.slice(0, page.limit);
    return {
      data: await this.toDtos(tx, users, owned),
      page: { nextCursor: more ? (users[users.length - 1]?.id ?? null) : null, limit: page.limit },
    };
  }

  private async load(tx: Tx, owned: string[], userId: string, lock = false): Promise<UserRow> {
    const { rows } = await tx.query<UserRow>(
      `SELECT u.id, u.username, u.display_name, u.status, u.last_login_at, u.version
         FROM app_user u
        WHERE u.id = $1 AND EXISTS (SELECT 1 FROM user_property_role r
                                     WHERE r.user_id = u.id AND r.property_id = ANY($2::uuid[]))
        ${lock ? 'FOR UPDATE OF u' : ''}`,
      [userId, owned],
    );
    const u = rows[0];
    if (!u) throw problem('NOT_FOUND');
    return u;
  }

  private checkRoles(roles: PropertyRole[], owned: string[]): PropertyRole[] {
    const errors: FieldError[] = [];
    const seen = new Set<string>();
    const out: PropertyRole[] = [];
    roles.forEach((r, i) => {
      if (!owned.includes(r.propertyId)) {
        errors.push({ field: `roles[${i}].propertyId`, code: 'NOT_IN_LIST' });
      }
      if (!ROLE_SET.has(r.role)) errors.push({ field: `roles[${i}].role`, code: 'NOT_IN_LIST' });
      const k = `${r.propertyId}:${r.role}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push(r);
      }
    });
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    return out;
  }

  async create(
    tx: Tx,
    ownerId: string,
    input: {
      username: string;
      displayName: string;
      phone?: string | undefined;
      initialPassword: string;
      roles: PropertyRole[];
      requestId: string;
    },
  ): Promise<UserDto> {
    const owned = await this.ownedProperties(tx, ownerId);
    const roles = this.checkRoles(input.roles, owned);
    const pwErrors = passwordPolicyErrors('initialPassword', input.initialPassword, input.username);
    if (pwErrors.length) throw problem('VALIDATION_FAILED', { errors: pwErrors });
    const now = this.clock.now();
    const id = uuidv7();
    const passwordHash = await hashPassword(input.initialPassword);
    try {
      await tx.query('SAVEPOINT create_user');
      await tx.query(
        `INSERT INTO app_user (id, organization_id, username, display_name, phone, password_hash,
           must_change_password, created_at, created_by, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $7)`,
        [
          id,
          tx.ctx.organizationId,
          input.username,
          input.displayName,
          input.phone ?? null,
          passwordHash,
          now,
          ownerId,
        ],
      );
      await tx.query('RELEASE SAVEPOINT create_user');
    } catch (err) {
      if (pgCode(err) === '23505') {
        await tx.query('ROLLBACK TO SAVEPOINT create_user');
        throw problem('USERNAME_TAKEN', {
          errors: [{ field: 'username', code: 'USERNAME_TAKEN' }],
        });
      }
      throw err;
    }
    for (const r of roles) {
      await tx.query(
        `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_by, granted_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, r.propertyId, tx.ctx.organizationId, r.role, ownerId, now],
      );
    }
    await this.audit.record(tx, {
      category: 'security',
      action: 'user.created',
      entityType: 'app_user',
      entityId: id,
      after: { username: input.username, roles },
      requestId: input.requestId,
    });
    return (await this.toDtos(tx, [await this.load(tx, owned, id)], owned))[0] as UserDto;
  }

  /** Lock owner rows of the properties, then count active owners if `exceptUserId` lost `owner`. */
  private async assertOwnersRemain(
    tx: Tx,
    properties: string[],
    removal: (propertyId: string, ownerUserId: string) => boolean,
    field: string,
  ): Promise<void> {
    if (properties.length === 0) return;
    const { rows } = await tx.query<{ property_id: string; user_id: string; status: string }>(
      `SELECT r.property_id, r.user_id, u.status
         FROM user_property_role r JOIN app_user u ON u.id = r.user_id
        WHERE r.property_id = ANY($1::uuid[]) AND r.role = 'owner' AND r.revoked_at IS NULL
        ORDER BY r.property_id, r.user_id
        FOR UPDATE OF r`,
      [properties],
    );
    for (const pid of properties) {
      const remaining = rows.filter(
        (r) => r.property_id === pid && r.status === 'active' && !removal(pid, r.user_id),
      );
      const hadOwner = rows.some((r) => r.property_id === pid);
      if (hadOwner && remaining.length === 0) {
        throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'LAST_OWNER' }] });
      }
    }
  }

  async setRoles(
    tx: Tx,
    ownerId: string,
    userId: string,
    expectedVersion: number,
    roles: PropertyRole[],
    requestId: string,
  ): Promise<UserDto> {
    const owned = await this.ownedProperties(tx, ownerId);
    const desired = this.checkRoles(roles, owned);
    const user = await this.load(tx, owned, userId, true);
    if (user.version !== expectedVersion) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: user.version } });
    }
    const { rows: current } = await tx.query<{ property_id: string; role: string }>(
      `SELECT property_id, role FROM user_property_role
        WHERE user_id = $1 AND property_id = ANY($2::uuid[]) AND revoked_at IS NULL`,
      [userId, owned],
    );
    const key = (p: string, r: string) => `${p}:${r}`;
    const want = new Set(desired.map((r) => key(r.propertyId, r.role)));
    const have = new Set(current.map((r) => key(r.property_id, r.role)));
    const removed = current.filter((r) => !want.has(key(r.property_id, r.role)));
    const added = desired.filter((r) => !have.has(key(r.propertyId, r.role)));

    const losesOwnerAt = removed.filter((r) => r.role === 'owner').map((r) => r.property_id);
    await this.assertOwnersRemain(
      tx,
      losesOwnerAt,
      (pid, uid) => uid === userId && losesOwnerAt.includes(pid),
      'roles',
    );

    const now = this.clock.now();
    for (const r of removed) {
      await tx.query(
        `UPDATE user_property_role SET revoked_at = $4
          WHERE user_id = $1 AND property_id = $2 AND role = $3 AND revoked_at IS NULL`,
        [userId, r.property_id, r.role, now],
      );
    }
    for (const r of added) {
      await tx.query(
        `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_by, granted_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, property_id, role)
         DO UPDATE SET revoked_at = NULL, granted_by = EXCLUDED.granted_by, granted_at = EXCLUDED.granted_at`,
        [userId, r.propertyId, tx.ctx.organizationId, r.role, ownerId, now],
      );
    }
    const changed = removed.length + added.length > 0;
    await tx.query(
      `UPDATE app_user SET version = version + 1, updated_at = $2,
           roles_version = roles_version + CASE WHEN $3 THEN 1 ELSE 0 END
        WHERE id = $1`,
      [userId, now, changed],
    );
    if (changed) {
      await this.sessions.revokeAll(tx, userId, 'role_changed');
      await this.audit.record(tx, {
        category: 'security',
        action: 'user.roles_changed',
        entityType: 'app_user',
        entityId: userId,
        before: { roles: current.map((r) => ({ propertyId: r.property_id, role: r.role })) },
        after: { roles: desired },
        requestId,
      });
    }
    return (await this.toDtos(tx, [await this.load(tx, owned, userId)], owned))[0] as UserDto;
  }

  async update(
    tx: Tx,
    ownerId: string,
    userId: string,
    expectedVersion: number,
    patch: {
      displayName?: string | undefined;
      status?: 'active' | 'disabled' | undefined;
      resetPassword?: string | undefined;
    },
    requestId: string,
  ): Promise<UserDto> {
    const owned = await this.ownedProperties(tx, ownerId);
    const user = await this.load(tx, owned, userId, true);
    if (user.version !== expectedVersion) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: user.version } });
    }
    const now = this.clock.now();
    const sets: string[] = ['version = version + 1', 'updated_at = $2'];
    const params: unknown[] = [userId, now];
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    let revokeReason: 'disabled' | 'password_reset' | null = null;

    if (patch.displayName !== undefined && patch.displayName !== user.display_name) {
      params.push(patch.displayName);
      sets.push(`display_name = $${params.length}`);
      before.displayName = user.display_name;
      after.displayName = patch.displayName;
    }
    if (patch.status !== undefined && patch.status !== user.status) {
      if (patch.status === 'disabled') {
        const { rows } = await tx.query<{ property_id: string }>(
          `SELECT property_id FROM user_property_role
            WHERE user_id = $1 AND role = 'owner' AND revoked_at IS NULL AND property_id = ANY($2::uuid[])`,
          [userId, owned],
        );
        await this.assertOwnersRemain(
          tx,
          rows.map((r) => r.property_id),
          (_pid, uid) => uid === userId,
          'status',
        );
        revokeReason = 'disabled';
      } else {
        // Re-enable / unlock (also clears a hard login lock – SR-AUTH-04).
        sets.push('failed_login_count = 0', 'locked_until = NULL', 'lock_count_24h = 0');
      }
      params.push(patch.status);
      sets.push(`status = $${params.length}`);
      before.status = user.status;
      after.status = patch.status;
    }
    if (patch.resetPassword !== undefined) {
      const errors = passwordPolicyErrors('resetPassword', patch.resetPassword, user.username);
      if (errors.length) throw problem('VALIDATION_FAILED', { errors });
      params.push(await hashPassword(patch.resetPassword));
      sets.push(
        `password_hash = $${params.length}`,
        'must_change_password = true',
        'password_changed_at = $2',
        'failed_login_count = 0',
      );
      after.passwordReset = true;
      revokeReason = revokeReason ?? 'password_reset';
    }
    if (revokeReason) sets.push('roles_version = roles_version + 1');
    await tx.query(`UPDATE app_user SET ${sets.join(', ')} WHERE id = $1`, params);
    if (revokeReason) await this.sessions.revokeAll(tx, userId, revokeReason);
    if (Object.keys(after).length) {
      await this.audit.record(tx, {
        category: 'security',
        action: 'user.updated',
        entityType: 'app_user',
        entityId: userId,
        before,
        after,
        requestId,
      });
    }
    return (await this.toDtos(tx, [await this.load(tx, owned, userId)], owned))[0] as UserDto;
  }
}
