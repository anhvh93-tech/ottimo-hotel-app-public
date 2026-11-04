/**
 * FB-R3-ARC-BEB-WA-04 (v1.0.4 P4-10, BE-B): the FOC / special_discount decision hooks of FolioModule.onModuleInit
 * for a WORKER composition (no Nest container there).
 *
 * J1 `hold.expire` cancels an overdue hold with nothing received (B6). If the hold's folio carries a FOC / special
 * discount request still waiting (e.g. a FOC asked on an extra line of the hold), FolioService.voidStay auto-cancels
 * it (`reservation_cancelled`). The worker built FolioService WITHOUT ApprovalService, so that hold failed on every
 * tick (`FolioService needs ApprovalService to move a FOC`) and kept its room. With an ApprovalService but without
 * these hooks the request would be cancelled while its "chờ duyệt" folio line stayed pending (the api's hook rejects
 * it). Here: the same hooks as the api, on the composition's own instances:
 * - onDecided('foc' | 'special_discount') → FolioFocService.onDecided (rejects the pending lines of a cancelled
 *   request; applies an approved one – never reached by J1);
 * - onBeforeDecide(...) → the folio's bookings then the folio (S4-13 lock order, same SQL as FolioModule);
 * - provideFocView (approval views of FOC requests).
 * `damage_pricing` is not wired: J1 never decides one. test/worker-jobs.test.ts compares with the api.
 * Kept identical to folio.module.ts on purpose (proposed to ARC/BE-D: FolioModule calls this function too).
 */
import type { Clock } from '../../../clock';
import type { ApprovalService } from '../../approvals/public/approval.service';
import type { AuditService } from '../../audit/public/audit.service';
import type { EventsService } from '../../events/public/events.service';
import type { ParameterService } from '../../platform/public/parameter.service';
import type { ReservationHooks } from '../../reservations/public/reservation-hooks';
import { FolioFocService } from '../internal/foc.service';
import { StayWaiverAlertService } from '../internal/stay-waiver-alert';
import type { FolioService } from './folio.service';

export function provideFocDecisionHooksForWorker(deps: {
  clock: Clock;
  audit: AuditService;
  parameters: ParameterService;
  approvals: ApprovalService;
  folios: FolioService;
  hooks: ReservationHooks;
  events?: EventsService;
}): void {
  const foc = new FolioFocService(
    deps.clock,
    deps.audit,
    deps.approvals,
    deps.folios,
    deps.hooks,
    new StayWaiverAlertService(deps.clock, deps.audit, deps.folios, deps.parameters, deps.events),
  );
  for (const type of ['foc', 'special_discount'] as const) {
    deps.approvals.onDecided(type, (tx, row) => foc.onDecided(tx, row));
  }
  deps.approvals.onBeforeDecide(['foc', 'special_discount'], async (tx, approvalId) => {
    const { rows } = await tx.query<{ folio_id: string }>(
      `SELECT l.folio_id FROM approval_request a JOIN folio_line l ON l.id = a.folio_line_id
        WHERE a.id = $1 AND a.type IN ('foc', 'special_discount')`,
      [approvalId],
    );
    if (rows[0]) await deps.folios.lockStay(tx, rows[0].folio_id);
  });
  deps.approvals.provideFocView((tx, rows) => deps.folios.focViews(tx, rows));
}
