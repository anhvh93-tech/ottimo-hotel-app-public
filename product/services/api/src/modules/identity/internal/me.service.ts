/**
 * `Me` (OpenAPI schema Me): user, properties with roles + screens (menu – US-002 AC1), deviceTrusted per
 * property (SR-DEV-05), csrfToken bound to the session (SR-SES-04), temporary-password flag (SR-AUTH-05).
 * 0.3.8: 2FA state (US-143 – mfaEnrollmentRequired, soleOwner, recoveryCodesLow) and the business day of each
 * property (R3-Q38 – businessDate, businessDayRollover from PropertyContextService, BR-010).
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { PropertyContextService } from '../../platform/public/property-context';
import { IDENTITY_OPTIONS, type IdentityOptions } from '../public/identity-options';
import { MfaStore } from '../public/mfa-store';
import { sha256Hex } from '../../../shared/http/auth.guard';
import { SessionService } from '../public/session.service';
import { screensFor } from './screens';

export interface MeProperty {
  propertyId: string;
  name: string;
  timezone: string;
  roles: string[];
  screens: string[];
  deviceTrusted: boolean;
  /** 0.3.8 (R3-Q38): business date of the property now (BR-010) and the rollover in force. */
  businessDate?: string;
  businessDayRollover?: string;
}

export interface Me {
  id: string;
  displayName: string;
  csrfToken: string;
  activePropertyId?: string;
  properties: MeProperty[];
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  mfaRequiredButMissing: boolean;
  /** 0.3.8 (SEC 06.4): restricted session – only the 2FA enrolment operations. */
  mfaEnrollmentRequired: boolean;
  /** 0.3.8 (ESC-027 B): the caller is the only active owner of the organisation (absent otherwise). */
  soleOwner?: boolean;
  /** 0.3.8 (SEC 06.15): ≤ 3 recovery codes left. */
  recoveryCodesLow: boolean;
}

interface RoleRow {
  property_id: string;
  name: string;
  timezone: string;
  role: string;
}

interface DeviceRow {
  property_id: string;
  expires_at: Date;
  revoked_at: Date | null;
}

const ROLE_ORDER = [
  'owner',
  'manager',
  'front_desk_lead',
  'front_desk',
  'sales_staff',
  'collaborator',
  'housekeeping',
  'maintenance',
];

@Injectable()
export class MeService {
  private readonly logger = new Logger('MeService');

  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(DATABASE) private readonly db: Database,
    @Inject(PropertyContextService) private readonly propertyContext: PropertyContextService,
    @Inject(IDENTITY_OPTIONS) private readonly options: IdentityOptions,
  ) {}

  /**
   * R3-Q38: business date + rollover of a property. The property in the transaction context is read in `tx`;
   * another property (multi-property user) in its own read-only transaction – config_parameter is
   * property-level RLS. A property without the parameter (should not happen – catalogue default) is left out.
   */
  private async businessDay(
    tx: Tx,
    propertyId: string,
  ): Promise<{ businessDate: string; businessDayRollover: string } | null> {
    const read = async (t: Tx) => {
      const pc = await this.propertyContext.now(t);
      return { businessDate: pc.today, businessDayRollover: pc.rollover };
    };
    try {
      if (tx.ctx.propertyId === propertyId) return await read(tx);
      return await this.db.withContext({ ...tx.ctx, propertyId }, read, { readOnly: true });
    } catch (err) {
      this.logger.warn(`business day unavailable for a property: ${(err as Error).name}`);
      return null;
    }
  }

  /** Properties where the user holds a live role, ordered by property code. */
  async properties(
    tx: Tx,
    userId: string,
  ): Promise<Map<string, Omit<MeProperty, 'screens' | 'deviceTrusted'>>> {
    const { rows } = await tx.query<RoleRow>(
      `SELECT r.property_id, p.name, p.timezone, r.role
         FROM user_property_role r JOIN property p ON p.id = r.property_id
        WHERE r.user_id = $1 AND r.revoked_at IS NULL AND p.status = 'active'
        ORDER BY p.code, r.role`,
      [userId],
    );
    const out = new Map<string, Omit<MeProperty, 'screens' | 'deviceTrusted'>>();
    for (const r of rows) {
      const entry = out.get(r.property_id) ?? {
        propertyId: r.property_id,
        name: r.name,
        timezone: r.timezone,
        roles: [],
      };
      entry.roles.push(r.role);
      out.set(r.property_id, entry);
    }
    for (const e of out.values()) {
      e.roles.sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));
    }
    return out;
  }

  async build(
    tx: Tx,
    input: {
      userId: string;
      sessionId: string;
      activePropertyId: string | null;
      deviceToken?: string | undefined;
    },
  ): Promise<Me> {
    const { rows } = await tx.query<{
      display_name: string;
      must_change_password: boolean;
      mfa_enabled: boolean;
      recovery_left: number;
      enrollment_only: boolean | null;
      other_owners: number;
    }>(
      `SELECT u.display_name, u.must_change_password, u.mfa_enabled,
              coalesce(cardinality(u.mfa_recovery_codes_hash), 0) AS recovery_left,
              (SELECT s.enrollment_only FROM user_session s WHERE s.id = $2) AS enrollment_only,
              (SELECT count(DISTINCT r.user_id)::int FROM user_property_role r JOIN app_user o ON o.id = r.user_id
                WHERE r.role = 'owner' AND r.revoked_at IS NULL AND o.status <> 'disabled'
                  AND r.user_id <> u.id) AS other_owners
         FROM app_user u WHERE u.id = $1`,
      [input.userId, input.sessionId],
    );
    const u = rows[0];
    if (!u) throw new Error('user not visible in this context');
    const props = await this.properties(tx, input.userId);

    let device: DeviceRow | undefined;
    if (input.deviceToken && input.deviceToken.length >= 32) {
      const d = await tx.query<DeviceRow>(
        'SELECT property_id, expires_at, revoked_at FROM auth_resolve_device($1)',
        [sha256Hex(input.deviceToken)],
      );
      device = d.rows[0];
    }
    const now = this.clock.now().getTime();
    const properties: MeProperty[] = [];
    for (const p of props.values()) {
      const day = await this.businessDay(tx, p.propertyId);
      properties.push({
        ...p,
        screens: screensFor(p.roles),
        deviceTrusted:
          !!device &&
          device.property_id === p.propertyId &&
          !device.revoked_at &&
          device.expires_at.getTime() > now,
        ...(day ?? {}),
      });
    }
    const allRoles = new Set(properties.flatMap((p) => p.roles));
    const active =
      input.activePropertyId && props.has(input.activePropertyId)
        ? input.activePropertyId
        : properties[0]?.propertyId;
    return {
      id: input.userId,
      displayName: u.display_name,
      csrfToken: this.sessions.csrfToken(input.sessionId),
      ...(active ? { activePropertyId: active } : {}),
      properties,
      mustChangePassword: u.must_change_password,
      mfaEnabled: u.mfa_enabled,
      // R3 (SR-AUTH-06): owner/manager must enable 2FA before real data – flag only in R2.
      mfaRequiredButMissing: !u.mfa_enabled && (allRoles.has('owner') || allRoles.has('manager')),
      // Same rule as the AuthGuard: flagged session, or MFA_ENFORCED + owner/manager without 2FA (SEC 06.4).
      mfaEnrollmentRequired:
        u.enrollment_only === true ||
        (this.options.mfaEnforced === true &&
          !u.mfa_enabled &&
          (allRoles.has('owner') || allRoles.has('manager'))),
      ...(allRoles.has('owner') ? { soleOwner: u.other_owners === 0 } : {}),
      recoveryCodesLow: MfaStore.recoveryCodesLow(u.recovery_left, u.mfa_enabled),
    };
  }
}
