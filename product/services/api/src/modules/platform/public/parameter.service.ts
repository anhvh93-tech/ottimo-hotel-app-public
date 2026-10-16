/**
 * Effective-dated configuration parameters (erd 4.1, 9; coding-standards 1.2 "không viết cứng con số").
 * - get(): value of `key` for the property in context, effective on `asOf` (latest effective_from ≤ asOf),
 *   falling back to the catalogue default (system/security keys only). Missing → error (configuration bug).
 * - validate(): type per catalogue value_schema; security parameters use the SEC hard bounds from
 *   OpenAPI setParameter.x-security-parameters (→ 422 PARAM_OUT_OF_RANGE, even for the owner).
 * - set(): edit_roles check (security keys: owner only), new effective-dated row (past values are never
 *   changed), audit_event category 'security' for security keys, 'config' otherwise.
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { OPENAPI_META } from '../../../generated/openapi-meta';
import type { SecurityParameterBounds } from '../../../shared/openapi-types';
import { problem } from '../../../shared/problem';
import { type LocalDate, assertLocalDate, isValidTimeZone } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';

interface DefRow {
  key: string;
  value_schema: string;
  edit_roles: string[];
  is_security: boolean;
  default_value: unknown;
  /** Technical bounds of business keys (erd 9.1a): {min,max} or {allowed}. */
  bounds: { min?: number; max?: number; allowed?: unknown[] } | null;
}

export class ParameterMissingError extends Error {
  constructor(key: string) {
    super(`configuration parameter ${key} has no value and no catalogue default`);
    this.name = 'ParameterMissingError';
  }
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Type check by catalogue value_schema. Returns an error code or null. */
export function checkValueSchema(schema: string, value: unknown): string | null {
  switch (schema) {
    case 'int':
      return Number.isSafeInteger(value) && (value as number) >= 0 ? null : 'VALIDATION_FAILED';
    case 'pct':
      return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1000
        ? null
        : 'VALIDATION_FAILED';
    case 'bool':
      return typeof value === 'boolean' ? null : 'VALIDATION_FAILED';
    case 'time':
      return typeof value === 'string' && TIME.test(value) ? null : 'VALIDATION_FAILED';
    case 'text':
      return typeof value === 'string' && value.length <= 500 ? null : 'VALIDATION_FAILED';
    case 'timezone':
      return typeof value === 'string' && isValidTimeZone(value) ? null : 'VALIDATION_FAILED';
    case 'doc_code_format': {
      const v = value as {
        prefix?: unknown;
        padWidth?: unknown;
        period?: unknown;
        scope?: unknown;
      };
      const ok =
        !!v &&
        typeof v.prefix === 'string' &&
        /^[A-Z]{1,4}(\{yy\})?-$/.test(v.prefix) &&
        Number.isInteger(v.padWidth) &&
        (v.padWidth as number) >= 1 &&
        (v.padWidth as number) <= 12 &&
        (v.period === 'none' || v.period === 'year') &&
        (v.scope === 'property' || v.scope === 'organization');
      return ok ? null : 'VALIDATION_FAILED';
    }
    case 'json':
      return value !== undefined ? null : 'VALIDATION_FAILED';
    default:
      return 'VALIDATION_FAILED';
  }
}

/** SEC hard bounds (OpenAPI x-security-parameters). Throws PARAM_OUT_OF_RANGE / VALIDATION_FAILED. */
export function checkSecurityBounds(key: string, value: unknown): void {
  const b: SecurityParameterBounds | undefined = OPENAPI_META.securityParameters[key];
  if (!b) throw new Error(`${key} is not a security parameter in openapi.yaml`);
  const fieldError = [{ field: 'value', code: 'PARAM_OUT_OF_RANGE' }];
  if (b.type === 'integer') {
    if (!Number.isSafeInteger(value)) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'value', code: 'VALIDATION_FAILED' }],
      });
    }
    const n = value as number;
    if ((b.minimum !== undefined && n < b.minimum) || (b.maximum !== undefined && n > b.maximum)) {
      throw problem('PARAM_OUT_OF_RANGE', {
        errors: fieldError,
        extras: { min: b.minimum, max: b.maximum },
      });
    }
    return;
  }
  if (b.type === 'array') {
    if (!Array.isArray(value)) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'value', code: 'VALIDATION_FAILED' }],
      });
    }
    const allowed = b.items?.enum ?? [];
    const bad = value.some((x) => typeof x !== 'string' || !allowed.includes(x));
    const dup = b.uniqueItems && new Set(value).size !== value.length;
    if (bad || dup)
      throw problem('PARAM_OUT_OF_RANGE', { errors: fieldError, extras: { allowed } });
    return;
  }
  throw new Error(`unsupported security parameter type for ${key}`);
}

/**
 * erd 9.1a min–max / allowed set for scalar business keys → 422 PARAM_OUT_OF_RANGE (also for the owner).
 * Structured keys (tiers, lists) and cross-key rules: validated by the setParameter use case (platform).
 */
export function checkBusinessBounds(bounds: DefRow['bounds'], value: unknown): void {
  if (!bounds) return;
  const fieldError = [{ field: 'value', code: 'PARAM_OUT_OF_RANGE' }];
  if (bounds.allowed && !bounds.allowed.includes(value)) {
    throw problem('PARAM_OUT_OF_RANGE', {
      errors: fieldError,
      extras: { allowed: bounds.allowed },
    });
  }
  if (typeof value === 'number') {
    if (
      (bounds.min !== undefined && value < bounds.min) ||
      (bounds.max !== undefined && value > bounds.max)
    ) {
      throw problem('PARAM_OUT_OF_RANGE', {
        errors: fieldError,
        extras: { min: bounds.min, max: bounds.max },
      });
    }
  }
}

@Injectable()
export class ParameterService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async get<T = unknown>(tx: Tx, key: string, asOf: LocalDate): Promise<T> {
    assertLocalDate(asOf);
    if (tx.ctx.propertyId) {
      const { rows } = await tx.query<{ value: T }>(
        `SELECT value FROM config_parameter
          WHERE property_id = $1 AND key = $2 AND effective_from <= $3
          ORDER BY effective_from DESC LIMIT 1`,
        [tx.ctx.propertyId, key, asOf],
      );
      if (rows[0]) return rows[0].value;
    }
    const def = await this.def(tx, key);
    if (!def || def.default_value === null || def.default_value === undefined) {
      throw new ParameterMissingError(key);
    }
    return def.default_value as T;
  }

  async validate(tx: Tx, key: string, value: unknown): Promise<DefRow> {
    const def = await this.def(tx, key);
    if (!def) throw problem('NOT_FOUND');
    if (def.is_security) {
      checkSecurityBounds(key, value);
    } else {
      if (checkValueSchema(def.value_schema, value)) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'value', code: 'VALIDATION_FAILED' }],
        });
      }
      checkBusinessBounds(def.bounds, value);
    }
    return def;
  }

  /**
   * New value from `effectiveFrom` (≥ `today`, the property's current business date). A row already
   * effective in the past is never modified (erd 4.1); a future row with the same date is replaced.
   */
  async set(
    tx: Tx,
    input: {
      key: string;
      value: unknown;
      effectiveFrom: LocalDate;
      reason: string;
      actorRoles: readonly string[];
      today: LocalDate;
      statusLabel?: string | null;
      requestId?: string;
    },
  ): Promise<{ id: string; previous: unknown }> {
    const { ctx } = tx;
    if (!ctx.propertyId || !ctx.organizationId) throw new Error('set() needs a property context');
    assertLocalDate(input.effectiveFrom);
    const def = await this.def(tx, input.key);
    if (!def) throw problem('NOT_FOUND');
    if (!input.actorRoles.some((r) => def.edit_roles.includes(r)))
      throw problem('FORBIDDEN_ACTION');
    await this.validate(tx, input.key, input.value);
    if (input.effectiveFrom < input.today) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'effectiveFrom', code: 'VALIDATION_FAILED' }],
      });
    }
    const previous = await this.get(tx, input.key, input.effectiveFrom).catch((e: unknown) => {
      if (e instanceof ParameterMissingError) return null;
      throw e;
    });
    const now = this.clock.now();
    const id = uuidv7();
    const { rows } = await tx.query<{ id: string }>(
      `INSERT INTO config_parameter (id, organization_id, property_id, key, value, effective_from,
         status_label, reason, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $9)
       ON CONFLICT (property_id, key, effective_from) DO UPDATE
         SET value = EXCLUDED.value, reason = EXCLUDED.reason, updated_at = EXCLUDED.updated_at,
             version = config_parameter.version + 1
       WHERE config_parameter.effective_from > $11
       RETURNING id`,
      [
        id,
        ctx.organizationId,
        ctx.propertyId,
        input.key,
        JSON.stringify(input.value),
        input.effectiveFrom,
        input.statusLabel ?? null,
        input.reason,
        now,
        ctx.userId,
        input.today,
      ],
    );
    if (!rows[0]) {
      throw problem('VALIDATION_FAILED', {
        detail: 'value already effective – add a row with a later effectiveFrom',
        errors: [{ field: 'effectiveFrom', code: 'VALIDATION_FAILED' }],
      });
    }
    await this.audit.record(tx, {
      category: def.is_security ? 'security' : 'config',
      action: 'config.changed',
      entityType: 'config_parameter',
      entityId: input.key,
      before: { value: previous },
      after: { value: input.value, effectiveFrom: input.effectiveFrom },
      reason: input.reason,
      ...(input.requestId ? { requestId: input.requestId } : {}),
    });
    await tx.query(`SELECT pg_notify('config_changed', $1)`, [ctx.propertyId]);
    return { id: rows[0].id, previous };
  }

  private async def(tx: Tx, key: string): Promise<DefRow | undefined> {
    const { rows } = await tx.query<DefRow>(
      `SELECT key, value_schema, edit_roles, is_security, default_value, bounds
         FROM config_parameter_def WHERE key = $1`,
      [key],
    );
    return rows[0];
  }
}
