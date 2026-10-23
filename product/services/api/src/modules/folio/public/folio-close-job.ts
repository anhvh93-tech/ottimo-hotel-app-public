/**
 * J15 `folio.close` (architecture 9.1; ARC `openapi-0.3.7.md` 16.27 (1) – BR-427 (d), BR-525, DOM 18/10): a `settled`
 * folio whose post-checkout window is over is closed; what it still owes becomes ONE debt of the stay first (front
 * desk `ReservationHooks.debtOnCheckout`, reason `post_checkout_unpaid`, due date by `debt_default_due_days`; an open
 * debt > 0 takes the difference and keeps its due date – ARC 16.31.2, BUG-R2-209). Every
 * worker tick (idempotent – a closed folio is skipped), each folio in a transaction of its own (16.19: bookings →
 * folio, read under the locks – FolioService.closeAfterWindow); one folio failing never stops the others.
 */
import { Logger } from '@nestjs/common';
import { JOB_LOCK_TIMEOUT_MS, type JobDefinition } from '../../../jobs/job-runner';
import type { Database, Tx } from '../../../db/database';
import type { ReservationHooks } from '../../reservations/public/reservation-hooks';
import { SYSTEM_ACTOR } from '../../reservations/public/stay-view';
import type { FolioService } from './folio.service';

export const FOLIO_CLOSE_JOB_KEY = 'folio.close';

/**
 * ARC 16.31.2 (BUG-R2-209, FB-R3-ARC-BEB-S1-02): J15's "an open debt already holds what is owed" – by the number
 * (`openDebtVnd` > 0), one definition shared with the tests that run J15's unit.
 */
export async function hasOpenDebtByNumber(
  hooks: Pick<ReservationHooks, 'openDebt'>,
  tx: Tx,
  folioId: string,
): Promise<boolean> {
  return ((await hooks.openDebt(tx, folioId))?.openDebtVnd ?? 0) > 0;
}
/** Folios handled per tick and property (the rest on the next tick). */
const BATCH = 200;
const logger = new Logger('J15');

export function folioCloseJob(
  db: Database,
  folios: FolioService,
  hooks: ReservationHooks,
): JobDefinition {
  return {
    key: FOLIO_CLOSE_JOB_KEY,
    schedule: { kind: 'tick' },
    async handler(tx, ctx) {
      const { rows } = await tx.query<{ id: string }>(
        `SELECT id FROM folio WHERE status = 'settled' AND post_checkout_window_until <= $1
          ORDER BY post_checkout_window_until, id LIMIT $2`,
        [ctx.now, BATCH],
      );
      const stats = { closed: 0, closedWithDebt: 0, waitingRefund: 0, failed: 0 };
      for (const f of rows) {
        try {
          const out = await db.withContext(
            {
              organizationId: ctx.organizationId,
              propertyId: ctx.propertyId,
              userId: null,
              actorType: 'system',
            },
            (one) =>
              folios.closeAfterWindow(one, f.id, ctx.now, {
                recordDebt: (folioId) =>
                  hooks.debtOnCheckout(one, {
                    folioId,
                    reason: 'post_checkout_unpaid',
                    actor: SYSTEM_ACTOR,
                  }),
                // ARC 16.31.2 (BUG-R2-209): by the number – X = B means the open debt already holds what is owed.
                hasOpenDebt: (folioId) => hasOpenDebtByNumber(hooks, one, folioId),
              }),
            { lockTimeoutMs: JOB_LOCK_TIMEOUT_MS },
          );
          if (out === 'closed') stats.closed += 1;
          else if (out === 'closed_with_debt') stats.closedWithDebt += 1;
          else if (out === 'waiting_refund') stats.waitingRefund += 1;
        } catch (err) {
          stats.failed += 1;
          logger.error(`folio ${f.id}: ${err instanceof Error ? err.name : 'error'}`);
        }
      }
      return stats;
    },
  };
}
