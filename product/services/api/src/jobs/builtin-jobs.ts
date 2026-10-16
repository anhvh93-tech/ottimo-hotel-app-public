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

export const BUILTIN_JOBS: readonly JobDefinition[] = [LOG_PARTITIONS_JOB];
