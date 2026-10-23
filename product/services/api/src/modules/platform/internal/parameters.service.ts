/**
 * US-005 – rule parameters (S24): list (value effective at a date), history of one key, add a new
 * effective-dated value (ParameterService.set: edit_roles, SEC bounds, erd 9.1a bounds, audit).
 * Visibility (BA spec 5.1): FDL reads operational keys only – security/identity keys (SR-…) are listed to
 * owner/manager only; for FDL such a key is "not found".
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import type { LocalDate } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { ParameterService } from '../public/parameter.service';
import { PropertyContextService } from '../public/property-context';
import {
  RECEIVING_ACCOUNT_KEY,
  maskReceivingAccount,
  parseReceivingAccount,
} from '../public/receiving-account';
import { checkStructuredParameter } from './parameter-rules';

export interface ParameterDto {
  key: string;
  value: unknown;
  effectiveFrom: LocalDate;
  statusLabel?: string;
  brRef?: string;
  editableBy: string[];
  changedBy?: string;
  changedAt?: string;
  reason?: string;
}

interface Row {
  key: string;
  edit_roles: string[];
  br_ref: string | null;
  is_security: boolean;
  default_value: unknown;
  value: unknown;
  effective_from: string | null;
  status_label: string | null;
  reason: string | null;
  changed_at: Date | null;
  changed_by: string | null;
}

const VALUE_COLUMNS = `c.value, c.effective_from::text AS effective_from, c.status_label, c.reason,
  c.updated_at AS changed_at, u.display_name AS changed_by`;

export function canSeeRestricted(roles: readonly string[]): boolean {
  return roles.includes('owner') || roles.includes('manager');
}

function restricted(row: { is_security: boolean; br_ref: string | null }): boolean {
  return row.is_security || (row.br_ref ?? '').startsWith('SR-');
}

/** 0.3.8 (R3-Q51, SEC Q51-1): `payment_receiving_account` is the owner's only – read (even masked) and write. */
function ownerOnlyKey(key: string): boolean {
  return key === RECEIVING_ACCOUNT_KEY;
}

@Injectable()
export class ParametersService {
  constructor(
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private async propertySince(tx: Tx): Promise<LocalDate> {
    const pc = await this.property.now(tx);
    const { rows } = await tx.query<{ d: string }>(
      `SELECT (created_at AT TIME ZONE $2)::date::text AS d FROM property WHERE id = $1`,
      [pc.propertyId, pc.timezone],
    );
    return rows[0]?.d ?? pc.today;
  }

  private dto(r: Row, iso: (d: Date) => string, defaultFrom: LocalDate): ParameterDto {
    const fromRow = r.effective_from !== null;
    const raw = fromRow ? r.value : r.default_value;
    return {
      key: r.key,
      // SEC F3: the receiving account number never leaves the server in clear.
      value: r.key === RECEIVING_ACCOUNT_KEY ? maskReceivingAccount(raw) : raw,
      effectiveFrom: r.effective_from ?? defaultFrom,
      ...(r.status_label ? { statusLabel: r.status_label } : {}),
      ...(r.br_ref ? { brRef: r.br_ref } : {}),
      editableBy: r.edit_roles,
      ...(r.changed_by ? { changedBy: r.changed_by } : {}),
      ...(r.changed_at ? { changedAt: iso(r.changed_at) } : {}),
      ...(r.reason ? { reason: r.reason } : {}),
    };
  }

  async list(
    tx: Tx,
    roles: readonly string[],
    asOf?: LocalDate,
  ): Promise<{ data: ParameterDto[] }> {
    const pc = await this.property.now(tx);
    const date = asOf ?? pc.today;
    const since = await this.propertySince(tx);
    const { rows } = await tx.query<Row>(
      `SELECT d.key, d.edit_roles, d.br_ref, d.is_security, d.default_value, ${VALUE_COLUMNS}
         FROM config_parameter_def d
         LEFT JOIN LATERAL (
           SELECT * FROM config_parameter c0
            WHERE c0.key = d.key AND c0.property_id = $1 AND c0.effective_from <= $2
            ORDER BY c0.effective_from DESC LIMIT 1) c ON true
         LEFT JOIN app_user u ON u.id = c.created_by
        WHERE c.key IS NOT NULL OR d.default_value IS NOT NULL
        ORDER BY d.key`,
      [pc.propertyId, date],
    );
    const all = canSeeRestricted(roles);
    return {
      data: rows
        .filter((r) => all || !restricted(r))
        // 0.3.8 (SEC Q51-1): the receiving account is not even listed to a role other than owner.
        .filter((r) => !ownerOnlyKey(r.key) || roles.includes('owner'))
        .map((r) => this.dto(r, pc.iso, since)),
    };
  }

  async history(
    tx: Tx,
    roles: readonly string[],
    key: string,
  ): Promise<{ current?: ParameterDto; history: ParameterDto[] }> {
    const pc = await this.property.now(tx);
    const since = await this.propertySince(tx);
    const { rows: defs } = await tx.query<Row>(
      `SELECT d.key, d.edit_roles, d.br_ref, d.is_security, d.default_value,
              NULL::jsonb AS value, NULL::text AS effective_from, NULL::text AS status_label,
              NULL::text AS reason, NULL::timestamptz AS changed_at, NULL::text AS changed_by
         FROM config_parameter_def d WHERE d.key = $1`,
      [key],
    );
    const def = defs[0];
    if (!def || (!canSeeRestricted(roles) && restricted(def))) throw problem('NOT_FOUND');
    // 0.3.8 (SEC Q51-1): MGR / FDL → 403 on the receiving account (its history included scheduled rows).
    if (ownerOnlyKey(key) && !roles.includes('owner')) throw problem('FORBIDDEN_ACTION');
    const { rows } = await tx.query<Row>(
      `SELECT d.key, d.edit_roles, d.br_ref, d.is_security, d.default_value, ${VALUE_COLUMNS}
         FROM config_parameter c JOIN config_parameter_def d ON d.key = c.key
         LEFT JOIN app_user u ON u.id = c.created_by
        WHERE c.key = $1 AND c.property_id = $2
        ORDER BY c.effective_from DESC`,
      [key, pc.propertyId],
    );
    const history = rows.map((r) => this.dto(r, pc.iso, since));
    const currentRow = rows.find((r) => (r.effective_from as string) <= pc.today);
    // 0.3.8 bổ sung 2 (ARC FB-R3-ARC-Q51-01): 404 only when the key has no row at all and no default; rows that are all
    // scheduled → 200 without `current` (the owner sees – and can cancel – what was typed the first time).
    if (rows.length === 0 && def.default_value === null) throw problem('NOT_FOUND');
    const current = currentRow ?? (def.default_value !== null ? def : null);
    return { ...(current ? { current: this.dto(current, pc.iso, since) } : {}), history };
  }

  async set(
    tx: Tx,
    input: {
      key: string;
      value: unknown;
      effectiveFrom: LocalDate;
      reason: string;
      roles: readonly string[];
      requestId: string;
    },
  ): Promise<ParameterDto> {
    const pc = await this.property.now(tx);
    if (input.effectiveFrom < pc.today) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'effectiveFrom', code: 'DATE_IN_PAST' }],
      });
    }
    const { rows: defs } = await tx.query<{ edit_roles: string[] }>(
      'SELECT edit_roles FROM config_parameter_def WHERE key = $1',
      [input.key],
    );
    if (!defs[0]) throw problem('NOT_FOUND');
    // Role first (403 even for a value out of range), then type/bounds, then structured rules.
    if (!input.roles.some((r) => defs[0]?.edit_roles.includes(r)))
      throw problem('FORBIDDEN_ACTION');
    const receiving = input.key === RECEIVING_ACCOUNT_KEY;
    if (receiving) {
      // 0.3.8 (SEC Q51-5): from the NEXT business day, the first time too – no "in force now" path.
      if (input.effectiveFrom <= pc.today) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'effectiveFrom', code: 'EFFECTIVE_FROM_TOMORROW' }],
        });
      }
      input = { ...input, value: parseReceivingAccount(input.value) };
    }
    await this.params.validate(tx, input.key, input.value);
    await checkStructuredParameter(
      input.key,
      input.value,
      (other) => this.params.get(tx, other, input.effectiveFrom),
      async () =>
        (await tx.query<{ code: string }>('SELECT code FROM room_group ORDER BY code')).rows.map(
          (r) => r.code,
        ),
    );
    await this.params.set(tx, {
      key: input.key,
      value: input.value,
      effectiveFrom: input.effectiveFrom,
      reason: input.reason,
      actorRoles: input.roles,
      today: pc.today,
      requestId: input.requestId,
      ...(receiving ? { auditAs: { category: 'money' as const, mask: maskReceivingAccount } } : {}),
    });
    const since = await this.propertySince(tx);
    const { rows } = await tx.query<Row>(
      `SELECT d.key, d.edit_roles, d.br_ref, d.is_security, d.default_value, ${VALUE_COLUMNS}
         FROM config_parameter c JOIN config_parameter_def d ON d.key = c.key
         LEFT JOIN app_user u ON u.id = c.created_by
        WHERE c.key = $1 AND c.property_id = $2 AND c.effective_from = $3`,
      [input.key, pc.propertyId, input.effectiveFrom],
    );
    return this.dto(rows[0] as Row, pc.iso, since);
  }

  /**
   * 0.3.8 `cancelScheduledParameter` (R3-Q51, SEC Q51-5): remove a row not yet in force (`effectiveFrom` > business
   * date). Rights as `setParameter` per key (the receiving account: owner only). No row → 404; a row in force → 409.
   * Audit `config.changed` (receiving account: category money, masked value, `cancelledEffectiveFrom`).
   */
  async cancelScheduled(
    tx: Tx,
    input: {
      key: string;
      effectiveFrom: LocalDate;
      reason: string;
      roles: readonly string[];
      requestId: string;
    },
  ): Promise<void> {
    const pc = await this.property.now(tx);
    const { rows: defs } = await tx.query<{ edit_roles: string[]; is_security: boolean }>(
      'SELECT edit_roles, is_security FROM config_parameter_def WHERE key = $1',
      [input.key],
    );
    const def = defs[0];
    if (!def) throw problem('NOT_FOUND');
    if (!input.roles.some((r) => def.edit_roles.includes(r))) throw problem('FORBIDDEN_ACTION');
    if (ownerOnlyKey(input.key) && !input.roles.includes('owner')) {
      throw problem('FORBIDDEN_ACTION');
    }
    const { rows } = await tx.query<{ id: string; value: unknown; effective_from: string }>(
      `SELECT id, value, effective_from::text AS effective_from FROM config_parameter
        WHERE property_id = $1 AND key = $2 AND effective_from = $3 FOR UPDATE`,
      [pc.propertyId, input.key, input.effectiveFrom],
    );
    const row = rows[0];
    if (!row) throw problem('NOT_FOUND');
    if (row.effective_from <= pc.today) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: 'in_force' } });
    }
    await tx.query('DELETE FROM config_parameter WHERE id = $1', [row.id]);
    const receiving = input.key === RECEIVING_ACCOUNT_KEY;
    await this.audit.record(tx, {
      category: receiving ? 'money' : def.is_security ? 'security' : 'config',
      action: 'config.changed',
      entityType: 'config_parameter',
      entityId: input.key,
      before: {
        value: receiving ? maskReceivingAccount(row.value) : row.value,
        effectiveFrom: row.effective_from,
      },
      after: { cancelledEffectiveFrom: row.effective_from },
      reason: input.reason,
      requestId: input.requestId,
    });
    await tx.query(`SELECT pg_notify('config_changed', $1)`, [pc.propertyId]);
  }
}
