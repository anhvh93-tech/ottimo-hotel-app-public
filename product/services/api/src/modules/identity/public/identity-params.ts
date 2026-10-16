/**
 * Identity security parameters applied to one person: session_policy (SR-SES-03) and login_lockout
 * (SR-AUTH-04). Both are stored per property like every parameter, but sign-in and the session have no
 * property yet → the STRICTEST value across the properties where the user holds a live role
 * (OpenAPI 0.3.4 x-security-parameters, FB-R2-SEC-BE-20): smallest idle/max per client; smallest
 * maxFailures and hardLockAfterLocks; largest lockMinutes and lockWindowHours.
 * Each property's value is read as of that property's business "today" (coding-standards 5.4,
 * FB-R2-ARC-BE-11) – one read-only transaction per property (config_parameter is property-scoped by RLS).
 * A user without any live role gets the catalogue defaults.
 * Never call inside a UnitOfWork handler (own transactions) – compute before UnitOfWork.run.
 */
import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, Database, type TenantContext, type Tx } from '../../../db/database';
import { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import type { SessionPolicy } from './session.service';

export interface LockoutPolicy {
  maxFailures: number;
  lockMinutes: number;
  hardLockAfterLocks: number;
  lockWindowHours: number;
}

export interface IdentityParams {
  session: SessionPolicy;
  lockout: LockoutPolicy;
}

export interface UserIdentityParams extends IdentityParams {
  /** Properties with a live role, ordered by property code (the first is the default active one). */
  propertyIds: string[];
}

/** Pure: strictest combination (exported for unit tests). */
export function strictest(values: IdentityParams[]): IdentityParams {
  const [first, ...rest] = values;
  if (!first) throw new Error('strictest() needs at least one value');
  return rest.reduce<IdentityParams>(
    (a, b) => ({
      session: {
        admin: {
          idleMinutes: Math.min(a.session.admin.idleMinutes, b.session.admin.idleMinutes),
          maxHours: Math.min(a.session.admin.maxHours, b.session.admin.maxHours),
        },
        staff_pwa: {
          idleMinutes: Math.min(a.session.staff_pwa.idleMinutes, b.session.staff_pwa.idleMinutes),
          maxHours: Math.min(a.session.staff_pwa.maxHours, b.session.staff_pwa.maxHours),
        },
      },
      lockout: {
        maxFailures: Math.min(a.lockout.maxFailures, b.lockout.maxFailures),
        lockMinutes: Math.max(a.lockout.lockMinutes, b.lockout.lockMinutes),
        hardLockAfterLocks: Math.min(a.lockout.hardLockAfterLocks, b.lockout.hardLockAfterLocks),
        lockWindowHours: Math.max(a.lockout.lockWindowHours, b.lockout.lockWindowHours),
      },
    }),
    first,
  );
}

@Injectable()
export class IdentityParamsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
  ) {}

  /** `ctx`: organisation + user (propertyId ignored). */
  async forUser(ctx: TenantContext): Promise<UserIdentityParams> {
    const base: TenantContext = { ...ctx, propertyId: null };
    const propertyIds = await this.db.withContext(
      base,
      async (tx) => {
        const { rows } = await tx.query<{ property_id: string }>(
          `SELECT r.property_id FROM user_property_role r JOIN property p ON p.id = r.property_id
            WHERE r.user_id = $1 AND r.revoked_at IS NULL AND p.status = 'active'
            GROUP BY r.property_id, p.code ORDER BY p.code`,
          [ctx.userId],
        );
        return rows.map((r) => r.property_id);
      },
      { readOnly: true },
    );
    if (propertyIds.length === 0) {
      // No property: catalogue defaults (ParameterService.get without a property in context).
      const defaults = await this.db.withContext(base, (tx) => this.read(tx, '0001-01-01'), {
        readOnly: true,
      });
      return { ...defaults, propertyIds };
    }
    const values: IdentityParams[] = [];
    for (const propertyId of propertyIds) {
      values.push(
        await this.db.withContext(
          { ...base, propertyId },
          async (tx) => this.read(tx, (await this.property.now(tx)).today),
          { readOnly: true },
        ),
      );
    }
    return { ...strictest(values), propertyIds };
  }

  private async read(tx: Tx, asOf: string): Promise<IdentityParams> {
    return {
      session: await this.params.get<SessionPolicy>(tx, 'session_policy', asOf),
      lockout: await this.params.get<LockoutPolicy>(tx, 'login_lockout', asOf),
    };
  }
}
