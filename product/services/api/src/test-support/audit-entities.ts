/**
 * Audit allowlists of the test-support module (SR-AUD-03, AuditEvent.before/after). No Nest import here, so EVERY process
 * that writes audit loads them: the api through test-support.module.ts, the worker and the admin CLIs through
 * src/audit-entities.ts. Until v1.0.0-rc.5 they ran only when the module file was imported, which the worker never
 * does (BUG-R3-037/038, OPS j15-folio-close-check 10.2–10.3: J15 / J24 threw AuditEntityNotRegisteredError).
 */
import { defineAuditEntity } from '../modules/audit/public/audit-fields';

defineAuditEntity('rate_limit', ['usernamePrefix', 'users']);
