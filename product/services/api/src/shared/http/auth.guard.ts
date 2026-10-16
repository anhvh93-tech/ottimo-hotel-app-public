/**
 * Staff authentication + action authorisation driven by the OpenAPI contract (rbac-matrix 8, coding-standards 7).
 *
 * Order (OpenAPI "Thứ tự kiểm"): authenticate → [CSRF/Origin – identity module, BE-B] → trusted device →
 * Idempotency-Key present → If-Match present → roles. For operations with Idempotency-Key the role
 * decision is applied by UnitOfWork AFTER the replay lookup, so an offline retry of a request that already
 * succeeded gets its stored response (not 403/412).
 *
 * - Session: cookie → SHA-256 → auth_resolve_session() (SECURITY DEFINER, erd 2.4); expiry checked with Clock.
 * - Property: `{propertyId}` path parameter, else the session's active property.
 * - Roles: user_property_role of that property (non-revoked), cached ≤ 60 s per roles_version (SR-AZ-08).
 * - No role at the property → 404 NOT_FOUND (no existence leak, architecture 6). Role not in x-roles →
 *   403 FORBIDDEN_ACTION + audit_event access.denied (US-002 AC2).
 */
import { createHash } from 'node:crypto';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  type OnModuleInit,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CLOCK, type Clock } from '../../clock';
import { DATABASE, Database, type TenantContext } from '../../db/database';
import { AuditService } from '../../modules/audit/public/audit.service';
import type { OperationMeta } from '../openapi-types';
import { problem } from '../problem';
import { cookieNames, readCookie } from './cookies';
import { OPERATION_KEY, PUBLIC_ROUTE_KEY, operationMeta } from './operation';

export const AUTH_OPTIONS = Symbol('AUTH_OPTIONS');

export interface AuthOptions {
  cookieSecurePrefix: boolean;
  /** Role cache lifetime (≤ 60 s – SR-AZ-08). */
  roleCacheMs?: number;
}

export interface StaffPrincipal {
  kind: 'staff';
  sessionId: string;
  userId: string;
  organizationId: string;
  propertyId: string | null;
  roles: string[];
  trustedDeviceId: string | null;
}

export interface RequestAuth {
  operationId: string;
  operation: OperationMeta;
  principal: StaffPrincipal | null;
  /** Role decision; enforced by the guard, or by UnitOfWork after the idempotent replay lookup. */
  allowed: boolean;
  /** Set once the role decision has been enforced (403 thrown or passed). */
  enforced: boolean;
}

export interface GuardedRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, string | undefined>;
  body?: unknown;
  ottimoAuth?: RequestAuth;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SessionRow {
  session_id: string;
  user_id: string;
  organization_id: string;
  active_property_id: string | null;
  expires_at: Date;
  revoked_at: Date | null;
  roles_version: number;
  trusted_device_id: string | null;
}

interface DeviceRow {
  device_id: string;
  property_id: string;
  organization_id: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function header(req: GuardedRequest, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}

@Injectable()
export class AuthGuard implements CanActivate, OnModuleInit {
  private readonly roleCache = new Map<string, { roles: string[]; until: number }>();
  private names!: { session: string; device: string };

  constructor(
    private readonly reflector: Reflector,
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AUTH_OPTIONS) private readonly options: AuthOptions,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  onModuleInit(): void {
    this.names = cookieNames(this.options.cookieSecurePrefix);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const cls = context.getClass();
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [handler, cls])) return true;
    const operationId = this.reflector.getAllAndOverride<string>(OPERATION_KEY, [handler, cls]);
    // Default deny: a route without @Operation is a programming error, never an open endpoint.
    if (!operationId) throw new Error(`route ${cls.name}.${handler.name} has no @Operation`);
    const operation = operationMeta(operationId);
    const req = context.switchToHttp().getRequest<GuardedRequest>();

    if (operation.public) {
      req.ottimoAuth = { operationId, operation, principal: null, allowed: true, enforced: true };
      return true;
    }
    if (operation.roles.includes('guest') || operation.roles.includes('system')) {
      // Guest-session (ADR-006) and system/webhook principals are handled by their own guards
      // (guest-portal, integrations-hub). Until those exist, refuse instead of falling through.
      throw problem('UNAUTHENTICATED');
    }

    const principal = await this.authenticate(req);
    await this.checkTrustedDevice(req, operation, principal);
    this.checkPreconditionHeaders(req, operation);

    // any_staff = any authenticated staff member (e.g. getMe), even before a property is chosen.
    const allowed =
      operation.roles.includes('any_staff') ||
      principal.roles.some((r) => operation.roles.includes(r));
    req.ottimoAuth = { operationId, operation, principal, allowed, enforced: false };
    if (!operation.idempotencyKey) await this.enforce(req);
    return true;
  }

  /** Apply the role decision (403 + audit). Called by the guard, or by UnitOfWork after replay lookup. */
  async enforce(req: GuardedRequest): Promise<void> {
    const auth = req.ottimoAuth;
    if (!auth) throw new Error('enforce() before AuthGuard');
    if (auth.enforced) return;
    auth.enforced = true;
    if (auth.allowed || !auth.principal) return;
    const p = auth.principal;
    await this.audit.recordDenied(tenantOf(p), {
      action: 'access.denied',
      entityType: 'operation',
      entityId: auth.operationId,
      requestId: req.id,
      sessionId: p.sessionId,
      ...(p.trustedDeviceId ? { trustedDeviceId: p.trustedDeviceId } : {}),
      after: { operationId: auth.operationId, roles: p.roles },
    });
    throw problem('FORBIDDEN_ACTION');
  }

  /** Session → principal (also used by the test-support guard). */
  async authenticate(req: GuardedRequest): Promise<StaffPrincipal> {
    const token = readCookie(header(req, 'cookie'), this.names.session);
    if (!token || token.length < 32) throw problem('UNAUTHENTICATED');
    const rows = await this.db.entry(async (tx) => {
      const r = await tx.query<SessionRow>('SELECT * FROM auth_resolve_session($1)', [
        sha256Hex(token),
      ]);
      return r.rows;
    });
    const s = rows[0];
    const now = this.clock.now();
    if (!s || s.revoked_at || s.expires_at.getTime() <= now.getTime()) {
      throw problem('UNAUTHENTICATED');
    }

    const pathProperty = req.params?.propertyId;
    if (pathProperty !== undefined && !UUID.test(pathProperty)) throw problem('NOT_FOUND');
    const propertyId = pathProperty ?? s.active_property_id;
    const roles = propertyId ? await this.rolesAt(s, propertyId, now) : [];
    // A property the user has no role at is "not found" – same answer as another organisation's id.
    if (pathProperty !== undefined && roles.length === 0) throw problem('NOT_FOUND');
    return {
      kind: 'staff',
      sessionId: s.session_id,
      userId: s.user_id,
      organizationId: s.organization_id,
      propertyId,
      roles,
      trustedDeviceId: s.trusted_device_id,
    };
  }

  private async rolesAt(s: SessionRow, propertyId: string, now: Date): Promise<string[]> {
    const cacheKey = `${s.user_id}:${propertyId}:${s.roles_version}`;
    const hit = this.roleCache.get(cacheKey);
    if (hit && hit.until > now.getTime()) return hit.roles;
    const ctx: TenantContext = {
      organizationId: s.organization_id,
      propertyId,
      userId: s.user_id,
      actorType: 'user',
    };
    const roles = await this.db.withContext(
      ctx,
      async (tx) => {
        const r = await tx.query<{ role: string }>(
          `SELECT role FROM user_property_role
            WHERE user_id = $1 AND property_id = $2 AND revoked_at IS NULL ORDER BY role`,
          [s.user_id, propertyId],
        );
        return r.rows.map((x) => x.role);
      },
      { readOnly: true },
    );
    this.roleCache.set(cacheKey, {
      roles,
      until: now.getTime() + (this.options.roleCacheMs ?? 60_000),
    });
    return roles;
  }

  private async checkTrustedDevice(
    req: GuardedRequest,
    operation: OperationMeta,
    p: StaffPrincipal,
  ): Promise<void> {
    if (!operation.trustedDevice) return;
    const token = readCookie(header(req, 'cookie'), this.names.device);
    let ok = false;
    let deviceId: string | null = null;
    if (token && token.length >= 32 && p.propertyId) {
      const rows = await this.db.entry(async (tx) => {
        const r = await tx.query<DeviceRow>('SELECT * FROM auth_resolve_device($1)', [
          sha256Hex(token),
        ]);
        return r.rows;
      });
      const d = rows[0];
      ok =
        !!d &&
        !d.revoked_at &&
        d.expires_at.getTime() > this.clock.now().getTime() &&
        d.property_id === p.propertyId &&
        d.organization_id === p.organizationId;
      deviceId = d?.device_id ?? null;
    }
    if (!ok) {
      await this.audit.recordDenied(tenantOf(p), {
        action: 'access.denied',
        entityType: 'trusted_device',
        ...(deviceId ? { entityId: deviceId } : {}),
        reason: 'DEVICE_NOT_TRUSTED',
        requestId: req.id,
        sessionId: p.sessionId,
      });
      throw problem('DEVICE_NOT_TRUSTED');
    }
    p.trustedDeviceId = deviceId;
  }

  private checkPreconditionHeaders(req: GuardedRequest, operation: OperationMeta): void {
    // dryRun (tính thử) needs neither header (OpenAPI "dryRun").
    const body = req.body as { dryRun?: unknown } | undefined;
    if (body && typeof body === 'object' && body.dryRun === true) return;
    if (operation.idempotencyKey) {
      const key = header(req, 'idempotency-key');
      if (!key) {
        throw problem('PRECONDITION_REQUIRED', { detail: 'Idempotency-Key header is required' });
      }
      if (!UUID.test(key)) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'Idempotency-Key', code: 'VALIDATION_FAILED' }],
        });
      }
    }
    if (operation.ifMatch && !header(req, 'if-match')) {
      throw problem('PRECONDITION_REQUIRED', { detail: 'If-Match header is required' });
    }
  }
}

export function tenantOf(p: StaffPrincipal): TenantContext {
  return {
    organizationId: p.organizationId,
    propertyId: p.propertyId,
    userId: p.userId,
    actorType: 'user',
  };
}
