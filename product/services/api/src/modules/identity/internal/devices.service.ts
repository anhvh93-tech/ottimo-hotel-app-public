/**
 * US-142 – trusted devices for C3 data (SR-DEV-01…09, rbac A110: owner only).
 * - Grant only the device that is calling, only from admin-web (session client_origin = admin and, when
 *   Origin checking is configured, an admin Origin) → PWA gets 403 FORBIDDEN_ACTION (SR-DEV-04).
 * - Re-authentication with the password (401 REAUTH_FAILED; 5 failures / 15 min → 429), checklist
 *   confirmed (422 CHECKLIST_REQUIRED), name unique among live devices (422 DUPLICATE).
 * - Lifetime from trusted_device_days (desk) / trusted_device_mobile_days (facility_mobile, ≤ 30 days –
 *   also a DB CHECK). Cookie 256-bit random, DB keeps SHA-256 only.
 * - Revoke: effective at the next request (the guard reads revoked_at every time).
 */
import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import { sha256Hex } from '../../../shared/http/auth.guard';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import { SessionService } from '../public/session.service';

export interface TrustedDeviceDto {
  id: string;
  name: string;
  deviceKind: 'desk' | 'facility_mobile';
  createdByName?: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt?: string;
  revokedAt?: string;
  isCurrentDevice: boolean;
}

interface DeviceRow {
  id: string;
  name: string;
  device_kind: 'desk' | 'facility_mobile';
  token_hash: string;
  created_by_name: string | null;
  created_at: Date;
  expires_at: Date;
  last_seen_at: Date | null;
  revoked_at: Date | null;
}

const SELECT_DEVICE = `SELECT d.id, d.name, d.device_kind, d.token_hash, u.display_name AS created_by_name,
    d.created_at, d.expires_at, d.last_seen_at, d.revoked_at
  FROM trusted_device d LEFT JOIN app_user u ON u.id = d.created_by`;

const DAY_MS = 86_400_000;

@Injectable()
export class DevicesService {
  constructor(
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(SessionService) private readonly sessions: SessionService,
  ) {}

  private dto(
    row: DeviceRow,
    iso: (d: Date) => string,
    currentHash: string | null,
  ): TrustedDeviceDto {
    return {
      id: row.id,
      name: row.name,
      deviceKind: row.device_kind,
      ...(row.created_by_name ? { createdByName: row.created_by_name } : {}),
      createdAt: iso(row.created_at),
      expiresAt: iso(row.expires_at),
      ...(row.last_seen_at ? { lastSeenAt: iso(row.last_seen_at) } : {}),
      ...(row.revoked_at ? { revokedAt: iso(row.revoked_at) } : {}),
      isCurrentDevice: currentHash !== null && row.token_hash === currentHash,
    };
  }

  async list(tx: Tx, deviceToken: string | undefined): Promise<{ data: TrustedDeviceDto[] }> {
    const pc = await this.property.now(tx);
    const { rows } = await tx.query<DeviceRow>(`${SELECT_DEVICE} ORDER BY d.created_at DESC`);
    const now = pc.now.getTime();
    const live = (r: DeviceRow) => !r.revoked_at && r.expires_at.getTime() > now;
    // Live first, nearest expiry first (BA spec 10.1).
    rows.sort((a, b) =>
      live(a) !== live(b) ? (live(a) ? -1 : 1) : a.expires_at.getTime() - b.expires_at.getTime(),
    );
    const current = deviceToken ? sha256Hex(deviceToken) : null;
    return { data: rows.map((r) => this.dto(r, pc.iso, current)) };
  }

  async trustCurrent(
    tx: Tx,
    input: {
      userId: string;
      sessionId: string;
      origin: string | undefined;
      currentDeviceToken: string | undefined;
      name: string;
      deviceKind: 'desk' | 'facility_mobile';
      hardeningChecklistConfirmed: boolean;
      requestId: string;
    },
  ): Promise<{ device: TrustedDeviceDto; token: string; expiresAt: Date }> {
    // SR-DEV-04: admin-web only (session made at an admin origin, request from an admin origin).
    const { rows: s } = await tx.query<{ client_origin: string }>(
      `SELECT s.client_origin FROM user_session s JOIN app_user u ON u.id = s.user_id
        WHERE s.id = $1 AND s.user_id = $2`,
      [input.sessionId, input.userId],
    );
    const session = s[0];
    const originKind = this.sessions.originKind(input.origin);
    if (!session || session.client_origin !== 'admin' || originKind === 'staff_pwa') {
      throw problem('FORBIDDEN_ACTION', {
        detail: 'trusted devices are granted from admin-web only',
      });
    }
    // currentPassword was verified by PasswordReauth (shared counter) before this transaction.
    if (!input.hardeningChecklistConfirmed) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'hardeningChecklistConfirmed', code: 'CHECKLIST_REQUIRED' }],
      });
    }
    const pc = await this.property.now(tx);
    const { rows: dup } = await tx.query(
      `SELECT 1 FROM trusted_device WHERE lower(name) = lower($1) AND revoked_at IS NULL AND expires_at > $2`,
      [input.name, pc.now],
    );
    if (dup.length) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'name', code: 'DUPLICATE' }] });
    }
    const days = await this.params.get<number>(
      tx,
      input.deviceKind === 'desk' ? 'trusted_device_days' : 'trusted_device_mobile_days',
      pc.today,
    );
    const expiresAt = new Date(pc.now.getTime() + days * DAY_MS);

    // The same browser re-granted: the previous grant of this cookie is replaced.
    if (input.currentDeviceToken) {
      await tx.query(
        `UPDATE trusted_device SET revoked_at = $2, revoked_by = $3, revoke_reason = 'replaced'
          WHERE token_hash = $1 AND revoked_at IS NULL`,
        [sha256Hex(input.currentDeviceToken), pc.now, input.userId],
      );
    }
    const token = randomBytes(32).toString('base64url');
    const id = uuidv7();
    await tx.query(
      `INSERT INTO trusted_device (id, organization_id, property_id, name, device_kind, token_hash,
         hardening_checklist_version, checklist_confirmed_by, created_by, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10)`,
      [
        id,
        tx.ctx.organizationId,
        pc.propertyId,
        input.name,
        input.deviceKind,
        sha256Hex(token),
        input.deviceKind === 'desk' ? 'SR-DEV-07' : 'SR-DEV-08',
        input.userId,
        pc.now,
        expiresAt,
      ],
    );
    await this.audit.record(tx, {
      category: 'security',
      action: 'trusted_device.granted',
      entityType: 'trusted_device',
      entityId: id,
      after: { name: input.name, deviceKind: input.deviceKind, expiresAt: pc.iso(expiresAt) },
      requestId: input.requestId,
      sessionId: input.sessionId,
    });
    const { rows } = await tx.query<DeviceRow>(`${SELECT_DEVICE} WHERE d.id = $1`, [id]);
    return {
      device: this.dto(rows[0] as DeviceRow, pc.iso, sha256Hex(token)),
      token,
      expiresAt,
    };
  }

  async revoke(
    tx: Tx,
    input: {
      userId: string;
      deviceId: string;
      reason: string | undefined;
      currentDeviceToken: string | undefined;
      requestId: string;
    },
  ): Promise<TrustedDeviceDto> {
    const pc = await this.property.now(tx);
    const { rows } = await tx.query<DeviceRow>(`${SELECT_DEVICE} WHERE d.id = $1 FOR UPDATE OF d`, [
      input.deviceId,
    ]);
    const row = rows[0];
    if (!row) throw problem('NOT_FOUND');
    if (!row.revoked_at) {
      await tx.query(
        `UPDATE trusted_device SET revoked_at = $2, revoked_by = $3, revoke_reason = $4 WHERE id = $1`,
        [row.id, pc.now, input.userId, input.reason ?? null],
      );
      await this.audit.record(tx, {
        category: 'security',
        action: 'trusted_device.revoked',
        entityType: 'trusted_device',
        entityId: row.id,
        before: { revokedAt: null },
        after: { revokedAt: pc.iso(pc.now) },
        ...(input.reason ? { reason: input.reason } : {}),
        requestId: input.requestId,
      });
      row.revoked_at = pc.now;
    }
    const current = input.currentDeviceToken ? sha256Hex(input.currentDeviceToken) : null;
    return this.dto(row, pc.iso, current);
  }
}
