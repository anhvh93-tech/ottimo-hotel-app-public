/**
 * Audit allowlist per entity (SR-AUD-03, OpenAPI AuditEvent.before/after): `before`/`after` keep only the
 * fields registered for the entity type – never `_enc` columns, never C3 values, no arbitrary payload.
 * A module registers its entities once at import time:
 *
 *   defineAuditEntity('folio_line', ['type', 'amountVnd', 'description', 'status']);
 *
 * Writing before/after for an entity type that is not registered is a programming error (AuditService
 * throws), so a new entity cannot leak fields by accident.
 */

const registry = new Map<string, ReadonlySet<string>>();

/** Field names that are never written to the log, even if registered by mistake. */
const FORBIDDEN =
  /(_enc|Enc|password|Password|secret|Secret|token|Token|pin|Pin|docNumber|cardNumber|pan)$/;

export function defineAuditEntity(entityType: string, fields: readonly string[]): void {
  const bad = fields.filter((f) => FORBIDDEN.test(f));
  if (bad.length > 0) {
    throw new Error(`audit entity ${entityType}: fields ${bad.join(', ')} may never be logged`);
  }
  const prev = registry.get(entityType);
  registry.set(entityType, new Set([...(prev ?? []), ...fields]));
}

export function auditFieldsOf(entityType: string): ReadonlySet<string> | undefined {
  return registry.get(entityType);
}

export class AuditEntityNotRegisteredError extends Error {
  constructor(entityType: string | undefined) {
    super(
      `audit before/after for entity type ${entityType ?? '(none)'} without an allowlist – call defineAuditEntity()`,
    );
    this.name = 'AuditEntityNotRegisteredError';
  }
}

/** Reduce a before/after object to the registered fields (top level). */
export function pickAuditFields(
  entityType: string | undefined,
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  const allowed = entityType ? registry.get(entityType) : undefined;
  if (!allowed) throw new AuditEntityNotRegisteredError(entityType);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (allowed.has(k) && v !== undefined) out[k] = v;
  }
  return out;
}

// Entities written by the foundation (Đợt 0) and BE-A Sprint 1.
defineAuditEntity('operation', ['operationId', 'roles']);
defineAuditEntity('config_parameter', [
  'value',
  'effectiveFrom',
  'cancelledEffectiveFrom',
  // BUG-R3-008: a kill switch turned off within the day (the row of today overwritten).
  'sameDayOverride',
]);
defineAuditEntity('dev_clock', ['now', 'op', 'mode']);
defineAuditEntity('job', ['status', 'slot']);
defineAuditEntity('dataset', ['users', 'parameters', 'devices']);
defineAuditEntity('approval_request', [
  'type',
  'status',
  'amountVnd',
  'reasonCode',
  'reasonNote',
  'requiredRole',
  'approverRole',
  'selfApplied',
  'targetType',
  'targetCode',
  'decisionNote',
  'monthlyUsedVnd',
  'limitVnd',
  // BR-433 (a)(b) v0.4.0 (R3 – FB-R2-SEC-BE-83): the cumulative Σ the per-time limit was compared with.
  'cumulativeVnd',
]);
// identity (BE-B) – fields its use cases write today; the identity module may take this over.
defineAuditEntity('app_user', [
  'clientOrigin',
  'lockCount',
  'until',
  'username',
  'roles',
  'displayName',
  'status',
  'passwordReset',
]);
// Re-authentication of approvers (BE-A, SR-RL-02).
defineAuditEntity('app_user', ['authMethod', 'failedCount', 'lockedUntil']);
