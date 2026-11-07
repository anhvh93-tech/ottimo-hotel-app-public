/**
 * Audit allowlists of the events module (SR-AUD-03, AuditEvent.before/after). No Nest import here, so EVERY process
 * that writes audit loads them: the api through events.module.ts, the worker and the admin CLIs through
 * src/audit-entities.ts (test/worker-audit-registry.test.ts).
 */
import { defineAuditEntity } from '../audit/public/audit-fields';

// 0.3.13 bổ sung 1f (5B-1 S8, SEC ARC-20; BE C0313-22 ý 3): "Không thấy tiền" on a `deposit_after_cancel` item –
// money audit `attention_event.resolved`, read back by `listAuditEvents.afterClosureOnly`. No free text.
defineAuditEntity('attention_event', ['kind', 'afterClosure']);
