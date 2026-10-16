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

export const BUILTIN_JOBS: readonly JobDefinition[] = [LOG_PARTITIONS_JOB, IDEMPOTENCY_PURGE_JOB];
