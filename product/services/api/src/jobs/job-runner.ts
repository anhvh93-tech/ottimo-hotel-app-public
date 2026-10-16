/**
 * Scheduled-job runner with the exactly-once handler pattern (architecture 9.1, BE-ARC-05, ADR-008 point 4).
 *
 * for property in worker_list_properties():                    -- SECURITY DEFINER (erd 2.4)
 *   now = clock.now(); slot = slotFor(job, now, property.timezone)
 *   BEGIN (app pool, tenant context of the property)
 *     INSERT INTO job_run … ON CONFLICT DO NOTHING RETURNING id  -- no row → slot already done
 *     handler(tx)                                               -- business effects + outbox, same tx
 *     UPDATE job_run SET stats
 *   COMMIT                                                      -- error → ROLLBACK incl. job_run → retry
 *
 * The scheduler (worker tick, later pg-boss) and the test-support endpoint both call runOnce(), so a QA
 * run "now" behaves exactly like the scheduled run (openapi.test.yaml).
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../clock';
import { DATABASE, Database, type Tx } from '../db/database';
import { ParameterService } from '../modules/platform/public/parameter.service';
import {
  type LocalDate,
  type LocalTime,
  addDays,
  assertLocalTime,
  atLocal,
  localDate,
} from '../shared/time';

export type JobSchedule =
  /** Runs every tick; correctness comes from row conditions (`… <= $now`), no job_run slot. */
  | { kind: 'tick' }
  /**
   * Once per local day at `at` (or the time in parameter `atParam`). `catchUp: 'always'` runs a late slot
   * whenever the worker comes back; 'window' skips it after job_catchup_minutes (reminders).
   */
  | { kind: 'daily'; at?: LocalTime; atParam?: string; catchUp: 'always' | 'window' };

export interface JobContext {
  now: Date;
  organizationId: string;
  propertyId: string;
  timezone: string;
  /** Local calendar date of the slot. */
  date: LocalDate;
  slot: string;
}

export interface JobDefinition {
  key: string;
  schedule: JobSchedule;
  handler(tx: Tx, ctx: JobContext): Promise<Record<string, unknown> | void>;
}

export interface PropertyRef {
  propertyId: string;
  organizationId: string;
  timezone: string;
}

export type JobRunStatus = 'done' | 'skipped_already_ran' | 'skipped_catchup_window';

export interface JobRunResult {
  propertyId: string;
  status: JobRunStatus;
  stats: Record<string, unknown>;
}

@Injectable()
export class JobRegistry {
  private readonly jobs = new Map<string, JobDefinition>();

  register(job: JobDefinition): void {
    if (this.jobs.has(job.key)) throw new Error(`job ${job.key} registered twice`);
    this.jobs.set(job.key, job);
  }

  get(key: string): JobDefinition | undefined {
    return this.jobs.get(key);
  }

  keys(): string[] {
    return [...this.jobs.keys()].sort();
  }
}

@Injectable()
export class JobRunner {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(JobRegistry) private readonly registry: JobRegistry,
    @Inject(ParameterService) private readonly parameters: ParameterService,
  ) {}

  async listProperties(): Promise<PropertyRef[]> {
    return this.db.entry(async (tx) => {
      const { rows } = await tx.query<{
        property_id: string;
        organization_id: string;
        timezone: string;
      }>('SELECT * FROM worker_list_properties()');
      return rows.map((r) => ({
        propertyId: r.property_id,
        organizationId: r.organization_id,
        timezone: r.timezone,
      }));
    });
  }

  /** Scheduler entry: every property, slot computed from Clock. */
  async runDue(key: string): Promise<JobRunResult[]> {
    const out: JobRunResult[] = [];
    for (const p of await this.listProperties()) out.push(await this.runOnce(key, p));
    return out;
  }

  /**
   * One job for one property. `forcedSlot` (test-support) = 'HH:mm' of a daily job; omitted = the
   * latest slot ≤ Clock.now() (yesterday's slot when today's time has not come yet).
   */
  async runOnce(key: string, property: PropertyRef, forcedSlot?: string): Promise<JobRunResult> {
    const job = this.registry.get(key);
    if (!job) throw new Error(`unknown job ${key}`);
    const now = this.clock.now();
    const ctx = {
      organizationId: property.organizationId,
      propertyId: property.propertyId,
      userId: null,
      actorType: 'system' as const,
    };

    return this.db.withContext(ctx, async (tx) => {
      const date = localDate(now, property.timezone);
      if (job.schedule.kind === 'tick') {
        const stats = (await job.handler(tx, { ...property, now, date, slot: 'tick' })) ?? {};
        return { propertyId: property.propertyId, status: 'done', stats };
      }

      const slot = forcedSlot ?? (await this.dailySlot(tx, job.schedule, date));
      assertLocalTime(slot);
      // Latest slot ≤ now: today's if its time has passed, otherwise yesterday's.
      let slotDate = date;
      let slotAt = atLocal(date, slot, property.timezone);
      if (slotAt.getTime() > now.getTime()) {
        slotDate = addDays(date, -1);
        slotAt = atLocal(slotDate, slot, property.timezone);
      }
      if (job.schedule.catchUp === 'window' && !forcedSlot) {
        const windowMin = await this.parameters.get<number>(tx, 'job_catchup_minutes', date);
        if (now.getTime() - slotAt.getTime() > windowMin * 60_000) {
          const claimed = await this.claim(
            tx,
            key,
            property,
            slotDate,
            slot,
            now,
            'skipped_catchup',
          );
          return {
            propertyId: property.propertyId,
            status: claimed ? 'skipped_catchup_window' : 'skipped_already_ran',
            stats: {},
          };
        }
      }
      const runId = await this.claim(tx, key, property, slotDate, slot, now, 'done');
      if (!runId)
        return { propertyId: property.propertyId, status: 'skipped_already_ran', stats: {} };
      const stats = (await job.handler(tx, { ...property, now, date: slotDate, slot })) ?? {};
      await tx.query('UPDATE job_run SET stats = $2 WHERE id = $1', [runId, JSON.stringify(stats)]);
      return { propertyId: property.propertyId, status: 'done', stats };
    });
  }

  private async dailySlot(
    tx: Tx,
    schedule: Extract<JobSchedule, { kind: 'daily' }>,
    date: LocalDate,
  ): Promise<string> {
    if (schedule.atParam) return this.parameters.get<string>(tx, schedule.atParam, date);
    if (schedule.at) return schedule.at;
    throw new Error('daily job needs `at` or `atParam`');
  }

  private async claim(
    tx: Tx,
    key: string,
    p: PropertyRef,
    date: LocalDate,
    slot: string,
    now: Date,
    status: 'done' | 'skipped_catchup',
  ): Promise<string | null> {
    const { rows } = await tx.query<{ id: string }>(
      `INSERT INTO job_run (id, organization_id, property_id, job_key, business_date, slot, run_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (job_key, property_id, business_date, slot) DO NOTHING RETURNING id`,
      [uuidv7(), p.organizationId, p.propertyId, key, date, slot, now, status],
    );
    return rows[0]?.id ?? null;
  }
}
