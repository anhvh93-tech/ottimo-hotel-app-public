/**
 * Staff authentication + action authorisation driven by the OpenAPI contract (rbac-matrix 8, coding-standards 7).
 *
 * Order (OpenAPI "Thứ tự kiểm"): authenticate → CSRF/Origin (write methods, csrf.ts) → trusted device →
 * Idempotency-Key present → If-Match present → roles. All of it runs in the guard, i.e. BEFORE the
 * controller parses the body or asks for a password (BUG-R2-005: a forbidden role gets 403 + access.denied,
 * never 422/401/429). One exception keeps the replay rule of ADR-009: a forbidden role whose
 * Idempotency-Key is already COMPLETED for this user (role removed after an offline success) is left to
 * UnitOfWork, which answers the stored response. The lookup only runs for forbidden roles (no cost on the
 * normal path).
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
import { ModuleRef, Reflector } from '@nestjs/core';
import { CLOCK, type Clock } from '../../clock';
import { DATABASE, Database, type TenantContext } from '../../db/database';
import { AuditService } from '../../modules/audit/public/audit.service';
import { RateLimiter } from '../../modules/identity/public/rate-limiter';
import type { OperationMeta } from '../openapi-types';
import { problem } from '../problem';
import { cookieNames, readCookie } from './cookies';
import {
  type AllowedOrigins,
  CSRF_HEADER,
  CSRF_VERIFIER,
  type CsrfVerifier,
  isWriteMethod,
  originAllowed,
} from './csrf';
import {
  GUEST_SESSION_RESOLVER,
  type GuestPrincipal,
  type GuestSessionResolver,
} from './guest-session';
import { OPERATION_KEY, PUBLIC_ROUTE_KEY, operationMeta } from './operation';
import { parseEntityTag } from './precondition';

export const AUTH_OPTIONS = Symbol('AUTH_OPTIONS');

export interface AuthOptions {
  cookieSecurePrefix: boolean;
  /** Role cache lifetime (≤ 60 s – SR-AZ-08). */
  roleCacheMs?: number;
  /** Browser origins accepted on write methods (SR-SES-04). Empty/missing = not checked (dev/test only). */
  allowedOrigins?: AllowedOrigins;
  /**
   * SR-RL-09 (SEC-BE-35, s3-checklist H1): requests per staff user and minute (SSE opens included) before
   * 429 RATE_LIMITED + Retry-After. Default 600 (security constant); tests may raise it.
   */
  staffRequestsPerMinute?: number;
}

/** SR-RL-09 default (security-requirements section 5). */
export const STAFF_REQUESTS_PER_MINUTE = 600;

export interface StaffPrincipal {
  kind: 'staff';
  sessionId: string;
  userId: string;
  organizationId: string;
  propertyId: string | null;
  roles: string[];
  trustedDeviceId: string | null;
  /**
   * Session state read by the same auth_resolve_session call (0.3.4, FB-R2-ARC-BE-05) – used by the
   * identity SessionPolicyInterceptor (idle sliding, temporary password) without another query.
   */
  session?: SessionState;
}

export interface SessionState {
  clientOrigin: 'admin' | 'staff_pwa';
  expiresAt: Date;
  idleExpiresAt: Date | null;
  lastActiveAt: Date | null;
  mustChangePassword: boolean;
}

export interface RequestAuth {
  operationId: string;
  operation: OperationMeta;
  principal: StaffPrincipal | null;
  /** Guest-session principal of a guest operation (ADR-006) – set by the guest-portal resolver. */
  guest?: GuestPrincipal;
  /** Role decision; enforced by the guard, or by UnitOfWork after the idempotent replay lookup. */
  allowed: boolean;
  /** Set once the role decision has been enforced (403 thrown or passed). */
  enforced: boolean;
  /** Version from `If-Match: "<n>"` (operations that declare If-Match; absent for dryRun). */
  ifMatchVersion?: number;
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

/** trusted_device.last_seen_at resolution (SR-DEV-06 needs "recently used", not every request). */
export const DEVICE_TOUCH_MS = 5 * 60_000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SessionRow {
  session_id: string;
  user_id: string;
  organization_id: string;
  active_property_id: string | null;
  expires_at: Date;
  /** erd 2.4 v0.3.2 (migration 0005): idle timeout and account status. */
  idle_expires_at?: Date | null;
  user_status?: string | null;
  revoked_at: Date | null;
  roles_version: number;
  trusted_device_id: string | null;
  /** 0.3.4 (migration 0009_identity_hardening_be_b). */
  client_origin?: 'admin' | 'staff_pwa' | null;
  last_active_at?: Date | null;
  must_change_password?: boolean | null;
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
  private readonly deviceTouched = new Map<string, number>();
  private names!: { session: string; device: string };

  constructor(
    private readonly reflector: Reflector,
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AUTH_OPTIONS) private readonly options: AuthOptions,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ModuleRef) private readonly moduleRef: ModuleRef,
  ) {}

  private csrfVerifier: CsrfVerifier | null | undefined;
  private guestResolverRef: GuestSessionResolver | null | undefined;
  private limiterRef: RateLimiter | undefined;

  /** SR-RL-09: one fixed-window counter per staff user (per api process – see rate-limiter.ts). */
  private async rateLimit(req: GuardedRequest, p: StaffPrincipal): Promise<void> {
    this.limiterRef ??= new RateLimiter(this.clock);
    const rule = {
      limit: this.options.staffRequestsPerMinute ?? STAFF_REQUESTS_PER_MINUTE,
      windowMs: 60_000,
    };
    const key = `staff:${p.userId}`;
    const wait = this.limiterRef.retryAfter(key, rule);
    if (wait > 0) {
      if (this.limiterRef.firstRefusal(key)) {
        // One security event per user and window (not one per refused request).
        await this.db.withContext(tenantOf(p), (tx) =>
          this.audit.record(tx, {
            category: 'security',
            action: 'security.rate_limited',
            entityType: 'app_user',
            entityId: p.userId,
            requestId: req.id,
            sessionId: p.sessionId,
          }),
        );
      }
      throw problem('RATE_LIMITED', { headers: { 'Retry-After': String(wait) } });
    }
    this.limiterRef.hit(key, rule);
  }

  /** The guest-portal module's resolver (GUEST_SESSION_RESOLVER), looked up once; null when absent. */
  private guestResolver(): GuestSessionResolver | null {
    if (this.guestResolverRef === undefined) {
      try {
        this.guestResolverRef = this.moduleRef.get<GuestSessionResolver>(GUEST_SESSION_RESOLVER, {
          strict: false,
        });
      } catch {
        this.guestResolverRef = null;
      }
    }
    return this.guestResolverRef;
  }

  /** The identity module's verifier (CSRF_VERIFIER), looked up once; null when not registered. */
  private verifier(): CsrfVerifier | null {
    if (this.csrfVerifier === undefined) {
      try {
        this.csrfVerifier = this.moduleRef.get<CsrfVerifier>(CSRF_VERIFIER, { strict: false });
      } catch {
        this.csrfVerifier = null;
      }
    }
    return this.csrfVerifier;
  }

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
      // No session yet (login, guest link exchange): Origin still has to be one of ours (login CSRF), and
      // the RIGHT one: staff login only from admin-web/staff PWA, guest operations only from guest-web
      // (SR-SES-09, FB-R2-SEC-BE-12 – no staff session created on the guest origin).
      if (
        isWriteMethod(req.method) &&
        !originAllowed(header(req, 'origin'), this.publicOrigins(operation))
      ) {
        throw problem('FORBIDDEN_ACTION', { detail: 'Origin not allowed' });
      }
      req.ottimoAuth = { operationId, operation, principal: null, allowed: true, enforced: true };
      return true;
    }
    if (operation.roles.includes('guest')) {
      // Guest session (ADR-006): guest-portal resolver (cookie __Host-ottimo_gsid → level, booking).
      // Write methods must come from guest-web (SEC G5); a staff cookie never authenticates here.
      const resolver = this.guestResolver();
      if (!resolver) throw problem('UNAUTHENTICATED');
      if (
        isWriteMethod(req.method) &&
        !originAllowed(header(req, 'origin'), this.options.allowedOrigins?.guest ?? [])
      ) {
        throw problem('FORBIDDEN_ACTION', { detail: 'Origin not allowed' });
      }
      const guest = await resolver.resolve(req, operation);
      this.checkPreconditionHeaders(req, operation);
      req.ottimoAuth = {
        operationId,
        operation,
        principal: null,
        guest,
        allowed: true,
        enforced: true,
      };
      return true;
    }
    if (operation.roles.includes('system')) {
      // System/webhook principals are handled by their own guard (integrations-hub). Until it exists,
      // refuse instead of falling through.
      throw problem('UNAUTHENTICATED');
    }

    const principal = await this.authenticate(req);
    await this.rateLimit(req, principal);
    await this.checkCsrf(req, operationId, principal);
    await this.checkTrustedDevice(req, operation, principal);
    const ifMatchVersion = this.checkPreconditionHeaders(req, operation);

    // any_staff = any authenticated staff member (e.g. getMe), even before a property is chosen.
    const allowed =
      operation.roles.includes('any_staff') ||
      principal.roles.some((r) => operation.roles.includes(r));
    req.ottimoAuth = {
      operationId,
      operation,
      principal,
      allowed,
      enforced: false,
      ...(ifMatchVersion !== undefined ? { ifMatchVersion } : {}),
    };
    // SEC-BE-33 / ARC-BE-S3-04: a dry run never goes through the unit of work (nothing stored, nothing to
    // replay) – the role decision applies here, before any handler reads data.
    const body = req.body as { dryRun?: unknown } | null | undefined;
    const dryRun =
      operation.dryRun === true && !!body && typeof body === 'object' && body.dryRun === true;
    if (dryRun || !operation.idempotencyKey) {
      await this.enforce(req);
    } else if (!allowed && !(await this.hasCompletedKey(req, operation, principal))) {
      await this.enforce(req);
    }
    return true;
  }

  /** Forbidden role: is this request an idempotent replay of a key this user already completed? */
  private async hasCompletedKey(
    req: GuardedRequest,
    operation: OperationMeta,
    p: StaffPrincipal,
  ): Promise<boolean> {
    if (!operation.idempotencyKey) return false;
    const key = header(req, 'idempotency-key');
    if (!key || !UUID.test(key)) return false;
    // SEC-BE-33: only a replay of THIS request (same method + path) may defer the decision to the unit of work.
    const url = req.url;
    const q = url.indexOf('?');
    const path = q < 0 ? url : url.slice(0, q);
    return this.db.withContext(
      tenantOf(p),
      async (tx) => {
        const r = await tx.query(
          `SELECT 1 FROM idempotency_key
            WHERE principal_type = 'user' AND principal_id = $1 AND key = $2 AND state = 'completed'
              AND method = $3 AND path = $4`,
          [p.userId, key, req.method.toUpperCase(), path],
        );
        return (r.rowCount ?? 0) > 0;
      },
      { readOnly: true },
    );
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
    if (
      !s ||
      s.revoked_at ||
      s.expires_at.getTime() <= now.getTime() ||
      (s.idle_expires_at && s.idle_expires_at.getTime() <= now.getTime()) ||
      // Only a DISABLED account ends live sessions. A login lock (temporary, or hard status=locked) blocks
      // new sign-ins only (SR-AUTH-04 v0.3, FB-R2-SEC-BE-05).
      s.user_status === 'disabled'
    ) {
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
      session: {
        clientOrigin: s.client_origin === 'staff_pwa' ? 'staff_pwa' : 'admin',
        expiresAt: s.expires_at,
        idleExpiresAt: s.idle_expires_at ?? null,
        lastActiveAt: s.last_active_at ?? null,
        mustChangePassword: s.must_change_password === true,
      },
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

  /** Origins of a public operation: guest-web for guest/public-page operations, staff apps otherwise. */
  private publicOrigins(operation: OperationMeta): string[] {
    const o = this.options.allowedOrigins;
    if (!o) return [];
    const guestSide =
      operation.roles.includes('guest') ||
      operation.path.startsWith('/v1/guest/') ||
      operation.path.startsWith('/v1/public/');
    return guestSide ? o.guest : o.staff;
  }

  /**
   * SR-SES-04: staff write methods need an allowed Origin (admin-web / staff PWA) and X-CSRF-Token bound to
   * the session (csrf.ts). Reads are exempt (SameSite=Lax + no state change). 403 + access.denied.
   */
  private async checkCsrf(
    req: GuardedRequest,
    operationId: string,
    p: StaffPrincipal,
  ): Promise<void> {
    if (!isWriteMethod(req.method)) return;
    const origins = this.options.allowedOrigins?.staff ?? [];
    const verifier = this.verifier();
    let reason: string | null = null;
    if (!originAllowed(header(req, 'origin'), origins)) reason = 'ORIGIN';
    else if (verifier && !verifier.verifyCsrf(p.sessionId, header(req, CSRF_HEADER)))
      reason = 'CSRF';
    if (!reason) return;
    await this.audit.recordDenied(tenantOf(p), {
      action: 'access.denied',
      entityType: 'operation',
      entityId: operationId,
      reason,
      requestId: req.id,
      sessionId: p.sessionId,
    });
    throw problem('FORBIDDEN_ACTION', { detail: reason === 'CSRF' ? 'CSRF token' : 'Origin' });
  }

  private async checkTrustedDevice(
    req: GuardedRequest,
    operation: OperationMeta,
    p: StaffPrincipal,
  ): Promise<void> {
    if (!operation.trustedDevice) return;
    const token = readCookie(header(req, 'cookie'), this.names.device);
    // SEC-BE-34 / SR-DEV-04 (D1): a staff PWA session is never on a trusted device, whatever cookie it carries
    // (dev hosts share cookies across ports); a request Origin, when sent, must be admin-web's.
    const adminOrigins = this.options.allowedOrigins?.admin ?? [];
    const origin = header(req, 'origin');
    const fromAdmin =
      p.session?.clientOrigin !== 'staff_pwa' &&
      (origin === undefined || adminOrigins.length === 0 || adminOrigins.includes(origin));
    let ok = false;
    let deviceId: string | null = null;
    if (fromAdmin && token && token.length >= 32 && p.propertyId) {
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
    if (deviceId) await this.touchDevice(p, deviceId);
  }

  /**
   * SR-DEV-06 / FB-R2-ARC-BE-13: trusted_device.last_seen_at for S26 ("lần dùng gần nhất") and the owner's
   * monthly review. At most once per DEVICE_TOUCH_MS per device and process (memory throttle + SQL
   * condition), in the tenant context the guard has just verified (device property = request property).
   */
  private async touchDevice(p: StaffPrincipal, deviceId: string): Promise<void> {
    const now = this.clock.now();
    const last = this.deviceTouched.get(deviceId);
    if (last !== undefined && now.getTime() - last < DEVICE_TOUCH_MS) return;
    this.deviceTouched.set(deviceId, now.getTime());
    if (this.deviceTouched.size > 10_000) this.deviceTouched.clear();
    await this.db.withContext(tenantOf(p), (tx) =>
      tx.query(
        `UPDATE trusted_device SET last_seen_at = $2
          WHERE id = $1 AND (last_seen_at IS NULL OR last_seen_at < $3)`,
        [deviceId, now, new Date(now.getTime() - DEVICE_TOUCH_MS)],
      ),
    );
  }

  /** Returns the If-Match version when the operation declares If-Match. */
  private checkPreconditionHeaders(
    req: GuardedRequest,
    operation: OperationMeta,
  ): number | undefined {
    // dryRun (tính thử) needs neither header – ONLY for operations whose body declares `dryRun`
    // (FB-R2-SEC-BE-21: fail-closed, a stray flag must never switch off Idempotency-Key).
    const body = req.body as { dryRun?: unknown } | undefined;
    if (body && typeof body === 'object' && body.dryRun !== undefined) {
      if (!operation.dryRun) {
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'dryRun', code: 'NOT_ALLOWED' }] });
      }
      if (body.dryRun === true) return undefined;
    }
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
    if (!operation.ifMatch) return undefined;
    const raw = header(req, 'if-match');
    if (!raw) throw problem('PRECONDITION_REQUIRED', { detail: 'If-Match header is required' });
    const version = parseEntityTag(raw);
    if (version === null) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'If-Match', code: 'VALIDATION_FAILED' }],
      });
    }
    return version;
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
