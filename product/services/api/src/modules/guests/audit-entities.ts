/**
 * Audit allowlists of the guests module (SR-AUD-03, AuditEvent.before/after). No Nest import here, so EVERY process
 * that writes audit loads them: the api through guests.module.ts, the worker and the admin CLIs through
 * src/audit-entities.ts. Until v1.0.0-rc.5 they ran only when the module file was imported, which the worker never
 * does (BUG-R3-037/038, OPS j15-folio-close-check 10.2–10.3: J15 / J24 threw AuditEntityNotRegisteredError).
 */
import { defineAuditEntity } from '../audit/public/audit-fields';

// Audit allowlists (SR-AUD-03): profile code, changed field NAMES and lookup counts only – no C2 values.
// 0.3.7: `source` of a profile created from a document (never the name or the document).
defineAuditEntity('guest', ['code', 'fields', 'by', 'matches', 'source']);
