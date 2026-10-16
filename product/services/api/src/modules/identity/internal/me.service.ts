/**
 * `Me` (OpenAPI schema Me): user, properties with roles + screens (menu – US-002 AC1), deviceTrusted per
 * property (SR-DEV-05), csrfToken bound to the session (SR-SES-04), temporary-password flag (SR-AUTH-05).
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
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
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(SessionService) private readonly sessions: SessionService,
  ) {}

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
    }>(`SELECT display_name, must_change_password, mfa_enabled FROM app_user WHERE id = $1`, [
      input.userId,
    ]);
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
    const properties: MeProperty[] = [...props.values()].map((p) => ({
      ...p,
      screens: screensFor(p.roles),
      deviceTrusted:
        !!device &&
        device.property_id === p.propertyId &&
        !device.revoked_at &&
        device.expires_at.getTime() > now,
    }));
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
    };
  }
}
