/**
 * J5 `registration.deadline` (architecture 9.1, BR-603/611, US-042 AC2, EP06 1 "Nhắc"; BUG-R2-035) – tick job,
 * run by the worker every minute and by the test-support runner:
 * 1. Reminder: a declaration not yet sent of a guest in house whose deadline in force (actual arrival +
 *    today's parameters – AC3) is at most `registration_reminder_before_minutes` away → staff notification
 *    `registration_due` (refType `registration`, code of the booking) to the front desk + managers. Exactly
 *    once per declaration and deadline: `job_run` row `registration.reminder` / slot `<id>@<deadline>` (a
 *    deadline moved by a parameter change is reminded again).
 * 2. Digest at each `registration_digest_times` mark (BR-611: 22:00 and 07:00): one `registration_due`
 *    notification (refType `property` – the app opens the list) when declarations are still to send. Exactly
 *    once per mark: `job_run` `registration.digest` / slot `HH:mm` of the local date; a mark missed by more
 *    than `job_catchup_minutes` (worker down) is recorded `skipped_catchup` and not sent late.
 * Overdue declarations are a computed "Cần chú ý" item (attention-sources.ts), not a notification.
 * A transaction-level advisory lock per property keeps the worker tick and a manual run from racing.
 * Notifications carry kind, ids and the booking code only (SEC A5).
 */
import { v7 as uuidv7 } from 'uuid';
import type { Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import type { JobDefinition } from '../../../jobs/job-runner';
import { type LocalDate, addDays, atLocal, localDate } from '../../../shared/time';
import type { EventsService } from '../../events/public/events.service';
import type { ParameterService } from '../../platform/public/parameter.service';
import type { RegistrationService } from './registration.service';

export const J5_KEY = 'registration.deadline';
const REMINDER_KEY = 'registration.reminder';
const DIGEST_KEY = 'registration.digest';
/** "Người trực FD + MGR" (EP06 1, BR-611): front desk, front desk lead, manager. */
export const REGISTRATION_REMINDER_ROLES = ['front_desk', 'front_desk_lead', 'manager'] as const;

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface DeadlineJobStats {
  reminders: number;
  digests: number;
  digestsSkipped: number;
  open: number;
}

export class RegistrationDeadlineJob {
  constructor(
    private readonly regs: RegistrationService,
    private readonly params: ParameterService,
    private readonly clock: Clock,
    private readonly events: EventsService,
  ) {}

  definition(): JobDefinition {
    return {
      key: J5_KEY,
      schedule: { kind: 'tick' },
      handler: async (tx, ctx) => ({ ...(await this.run(tx, ctx.timezone)) }),
    };
  }

  async run(tx: Tx, timezone: string): Promise<DeadlineJobStats> {
    const now = this.clock.now();
    const today = localDate(now, timezone);
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      `${J5_KEY}:${tx.ctx.propertyId}`,
    ]);
    const stats: DeadlineJobStats = { reminders: 0, digests: 0, digestsSkipped: 0, open: 0 };
    const open = await this.regs.openDeclarations(tx);
    const inHouse = open.filter((o) => o.stay.status === 'in_house');

    // 1. Reminders before the deadline.
    const minutes = await this.param<number>(tx, 'registration_reminder_before_minutes', today);
    if (minutes && minutes > 0) {
      for (const o of inHouse) {
        if (!o.deadlineAt) continue;
        const left = o.deadlineAt.getTime() - now.getTime();
        if (left <= 0 || left > minutes * 60_000) continue;
        const claimed = await this.claim(
          tx,
          REMINDER_KEY,
          localDate(o.deadlineAt, timezone),
          `${o.reg.id}@${o.deadlineAt.toISOString()}`,
          now,
          'done',
        );
        if (!claimed) continue;
        await this.events.notify(
          tx,
          {
            kind: 'registration_due',
            roles: REGISTRATION_REMINDER_ROLES,
            refType: 'registration',
            refId: o.reg.id,
            refCode: o.stay.code,
          },
          now,
        );
        stats.reminders++;
      }
    }

    // 2. Digest marks (BR-611).
    const business = await this.businessToday(tx, now, timezone, today);
    const pending = open.filter(
      (o) =>
        o.stay.status === 'in_house' ||
        (o.stay.status === 'confirmed' && o.stay.arrivalDate === business),
    );
    stats.open = pending.length;
    const times = (await this.param<unknown>(tx, 'registration_digest_times', today)) ?? [];
    const window = (await this.param<number>(tx, 'job_catchup_minutes', today)) ?? 60;
    for (const t of Array.isArray(times) ? times : []) {
      if (typeof t !== 'string' || !HHMM.test(t)) continue;
      let slotDate: LocalDate = today;
      let slotAt = atLocal(today, t, timezone);
      if (slotAt.getTime() > now.getTime()) {
        slotDate = addDays(today, -1);
        slotAt = atLocal(slotDate, t, timezone);
      }
      if (now.getTime() - slotAt.getTime() > window * 60_000) {
        if (await this.claim(tx, DIGEST_KEY, slotDate, t, now, 'skipped_catchup')) {
          stats.digestsSkipped++;
        }
        continue;
      }
      if (!(await this.claim(tx, DIGEST_KEY, slotDate, t, now, 'done'))) continue;
      if (pending.length === 0) continue;
      await this.events.notify(
        tx,
        {
          kind: 'registration_due',
          roles: REGISTRATION_REMINDER_ROLES,
          refType: 'property',
          refId: tx.ctx.propertyId as string,
        },
        now,
      );
      stats.digests++;
    }
    return stats;
  }

  private async businessToday(
    tx: Tx,
    now: Date,
    timezone: string,
    today: LocalDate,
  ): Promise<LocalDate> {
    const rollover = await this.param<string>(tx, 'business_day_rollover', today);
    if (!rollover || !HHMM.test(rollover)) return today;
    return now.getTime() < atLocal(today, rollover, timezone).getTime()
      ? addDays(today, -1)
      : today;
  }

  private async param<T>(tx: Tx, key: string, on: LocalDate): Promise<T | null> {
    try {
      return await this.params.get<T>(tx, key, on);
    } catch {
      return null;
    }
  }

  /** Exactly-once marker in `job_run` (unique job_key + property + date + slot). */
  private async claim(
    tx: Tx,
    key: string,
    date: LocalDate,
    slot: string,
    now: Date,
    status: 'done' | 'skipped_catchup',
  ): Promise<boolean> {
    const { rows } = await tx.query<{ id: string }>(
      `INSERT INTO job_run (id, organization_id, property_id, job_key, business_date, slot, run_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (job_key, property_id, business_date, slot) DO NOTHING RETURNING id`,
      [uuidv7(), tx.ctx.organizationId, tx.ctx.propertyId, key, date, slot, now, status],
    );
    return rows.length > 0;
  }
}
