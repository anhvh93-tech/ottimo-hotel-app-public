/**
 * Manager-only audit (SEC FB-R5-SEC-BE-131-01, ARC FB-R5-ARC-BE-131-01; closes SEC V530-02 and ARC H1-01 with #131):
 * some audit rows and keys hold data a front desk must not read – today the commission of a sale / CTV (the rate
 * table is the owner's internal table, A60, SR-AZ-04, DOM 4.4). They are written as before (OWN/MGR read them in
 * full) and hidden AT READ TIME from everyone else, so rows already written on production are covered too.
 *
 * - The module that OWNS the data declares what is manager-only (`defineManagerOnlyAudit`), next to its
 *   `defineAuditEntity` allowlists – audit knows no commission key (folio/audit-entities.ts declares
 *   `commission` + `commissionVnd`; PR-M adds the bonus keys the same way). That file is loaded by every process.
 * - Every reader of `audit_event` for a caller without OWN/MGR applies BOTH helpers:
 *   - `auditVisibleWhere` – a SQL clause leaving out the manager-only entity types;
 *   - `redactAuditFields` – drops the manager-only keys from `before` / `after` (and the whole of a manager-only
 *     row, if one ever got past the clause).
 *   Today: `listAuditEvents` (audit-log.controller.ts) and `getReservationHistory` (reservations rack.service.ts).
 *   test/audit-visibility-gate.test.ts fails when another SQL read of the audit table appears in `src` without the
 *   gate (or a listed exception with its reason).
 */

/** Roles that read the audit log in full (x-scope of listAuditEvents; getReservationHistory MGR+). */
export const FULL_AUDIT_ROLES: readonly string[] = ['owner', 'manager'];

const hiddenEntityTypes = new Set<string>();
const hiddenFields = new Set<string>();

/** Declared once at import time by the module that owns the data (no Nest import – worker and CLIs load it too). */
export function defineManagerOnlyAudit(spec: {
  entityTypes?: readonly string[];
  fields?: readonly string[];
}): void {
  for (const t of spec.entityTypes ?? []) hiddenEntityTypes.add(t);
  for (const f of spec.fields ?? []) hiddenFields.add(f);
}

/** What THIS process declared, sorted (tests). */
export function managerOnlyAuditSnapshot(): { entityTypes: string[]; fields: string[] } {
  return { entityTypes: [...hiddenEntityTypes].sort(), fields: [...hiddenFields].sort() };
}

export function seesFullAudit(roles: readonly string[]): boolean {
  return roles.some((r) => FULL_AUDIT_ROLES.includes(r));
}

/**
 * The WHERE clauses for `audit_event <alias>` read by a caller with `roles` (`ph` adds a bind parameter): none for
 * OWN/MGR; else the manager-only entity types are left out (a row without an entity type stays).
 */
export function auditVisibleWhere(
  alias: string,
  ph: (v: unknown) => string,
  roles: readonly string[],
): string[] {
  if (seesFullAudit(roles) || hiddenEntityTypes.size === 0) return [];
  return [`COALESCE(${alias}.entity_type, '') <> ALL(${ph([...hiddenEntityTypes])}::text[])`];
}

/**
 * `before` / `after` of a row of `entityType` as a caller with `roles` may read it: as stored for OWN/MGR; else
 * without the manager-only keys, and nothing at all for a manager-only entity type.
 */
export function redactAuditFields(
  entityType: string | null | undefined,
  value: Record<string, unknown> | null | undefined,
  roles: readonly string[],
): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (seesFullAudit(roles)) return value;
  if (entityType && hiddenEntityTypes.has(entityType)) return null;
  if (!Object.keys(value).some((k) => hiddenFields.has(k))) return value;
  return Object.fromEntries(Object.entries(value).filter(([k]) => !hiddenFields.has(k)));
}
