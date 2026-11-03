/**
 * Jobs that exist from the foundation on. Business jobs (J1…J18) register themselves from their modules.
 *
 * log.partitions – the partition part of J16 (BE-ARC-18): make sure next month's partitions of
 * audit_event and c3_access_log exist. Global DDL through log_ensure_month_partition() (SECURITY DEFINER,
 * idempotent); running it once per property costs nothing. Merged into retention.purge when J16 lands.
 */
import { addDays } from '../shared/time';
import type { JobDefinition } from './job-runner';

export const LOG_PARTITIONS_JOB: JobDefinition = {
  key: 'log.partitions',
  // Technical maintenance hour (architecture 9.1 J16 runs at 03:00), not a business parameter.
  schedule: { kind: 'daily', at: '03:00', catchUp: 'always' },
  async handler(tx, ctx) {
    const nextMonth = `${addDays(`${ctx.date.slice(0, 7)}-01`, 32).slice(0, 7)}-01`;
    const created: string[] = [];
    for (const table of ['audit_event', 'c3_access_log']) {
      const { rows } = await tx.query<{ name: string }>(
        'SELECT log_ensure_month_partition($1, $2) AS name',
        [table, nextMonth],
      );
      if (rows[0]) created.push(rows[0].name);
    }
    return { partitions: created };
  },
};

/** Keys deleted per run (technical batch – the next tick takes the rest). */
const IDEMPOTENCY_PURGE_BATCH = 5_000;

/**
 * idempotency.purge (erd 4.12, ADR-009, FB-R2-SEC-BE-39): a stored response (it may hold C2 – never C3,
 * `storeBody:false`) lives `idempotency_ttl_hours`; after that the key is deleted and a replay is a new
 * request. Row condition `created_at < now − ttl`, so overlapping or late runs are harmless.
 */
export const IDEMPOTENCY_PURGE_JOB: JobDefinition = {
  key: 'idempotency.purge',
  schedule: { kind: 'tick' },
  async handler(tx, ctx) {
    const { rows: ttl } = await tx.query<{ v: unknown }>(
      `SELECT COALESCE(
         (SELECT value FROM config_parameter
           WHERE property_id = $1 AND key = 'idempotency_ttl_hours' AND effective_from <= $2
           ORDER BY effective_from DESC LIMIT 1),
         (SELECT default_value FROM config_parameter_def WHERE key = 'idempotency_ttl_hours')) AS v`,
      [ctx.propertyId, ctx.date],
    );
    const hours = Number(ttl[0]?.v);
    if (!Number.isFinite(hours) || hours <= 0) return { deleted: 0 };
    const r = await tx.query(
      `DELETE FROM idempotency_key WHERE ctid IN (
         SELECT ctid FROM idempotency_key
          WHERE created_at < $1::timestamptz - make_interval(hours => $2::int)
          LIMIT $3)`,
      [ctx.now, Math.trunc(hours), IDEMPOTENCY_PURGE_BATCH],
    );
    return { deleted: r.rowCount ?? 0 };
  },
};

/** 0.3.10 (erd 4.16, 12): an old security address is kept 7 days at most, even if its notice never ended. */
export const EMAIL_CHANGE_RETENTION_DAYS = 7;
const EMAIL_CHANGE_PURGE_BATCH = 1_000;

/**
 * email_change.purge (R4 v1.0.3, BUG-R3-032, ARC v1.0.3-contract-email 4.2): safety net of the dispatcher's
 * `old_email = NULL` – rows older than 7 days lose the old address. user_email_change is organisation-level, so the
 * first property run of the day does the work and the others find nothing; each cleared row → purge_journal (ids
 * only, under the property of the run). No DELETE: the row (ids, who, when) stays for the audit trail.
 */
export const EMAIL_CHANGE_PURGE_JOB: JobDefinition = {
  key: 'email_change.purge',
  schedule: { kind: 'daily', at: '03:00', catchUp: 'always' },
  async handler(tx, ctx) {
    const { rows } = await tx.query<{ id: string }>(
      `UPDATE user_email_change SET old_email = NULL
        WHERE id IN (SELECT id FROM user_email_change
                      WHERE old_email IS NOT NULL
                        AND changed_at < $1::timestamptz - make_interval(days => $2::int)
                      ORDER BY changed_at LIMIT $3 FOR UPDATE SKIP LOCKED)
        RETURNING id`,
      [ctx.now, EMAIL_CHANGE_RETENTION_DAYS, EMAIL_CHANGE_PURGE_BATCH],
    );
    for (const r of rows) {
      await tx.query(
        `INSERT INTO purge_journal (organization_id, property_id, subject_type, subject_id, policy_key, action,
           purged_at)
         VALUES ($1, $2, 'user_email_change', $3, 'email_change_7d', 'null_columns', $4)`,
        [ctx.organizationId, ctx.propertyId, r.id, ctx.now],
      );
    }
    return { purged: rows.length };
  },
};

export const BUILTIN_JOBS: readonly JobDefinition[] = [
  LOG_PARTITIONS_JOB,
  IDEMPOTENCY_PURGE_JOB,
  EMAIL_CHANGE_PURGE_JOB,
];
