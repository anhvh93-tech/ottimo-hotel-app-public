/**
 * Audit allowlists of the events module (SR-AUD-03, AuditEvent.before/after). No Nest import here, so every process
 * that writes audit loads them (events.module.ts for the api, src/audit-entities.ts for the worker and the CLIs).
 */
import { defineAuditEntity } from '../audit/public/audit-fields';

// 0.3.13 bổ sung 1e (BE C0313-22 ý 3, SEC 1.2 – S8): "Không thấy tiền" on a `deposit_after_cancel` item –
// money audit `attention_event.resolved`, in `listAuditEvents.afterClosureOnly`. Codes and flags only: the note stays
// on the row (`resolution_note`) and in the audit `reason`, never in before/after.
defineAuditEntity('attention_event', ['kind', 'afterClosure']);
