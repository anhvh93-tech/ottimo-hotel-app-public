/**
 * Audit allowlists of the public-site module (SR-AUD-03, AuditEvent.before/after). No Nest import here, so EVERY process
 * that writes audit loads them: the api through public-site.module.ts, the worker and the admin CLIs through
 * src/audit-entities.ts. Until v1.0.0-rc.5 they ran only when the module file was imported, which the worker never
 * does (BUG-R3-037/038, OPS j15-folio-close-check 10.2–10.3: J15 / J24 threw AuditEntityNotRegisteredError).
 */
import { defineAuditEntity } from '../audit/public/audit-fields';

// Audit allowlist: state and codes only – never C2 (SEC ARC-21 (3)).
defineAuditEntity('website_booking_request', [
  'status',
  'reasonCode',
  'verificationMethod',
  'resultCount',
]);
