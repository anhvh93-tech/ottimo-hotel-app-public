/**
 * Every audit allowlist of the api modules (SR-AUD-03), for the processes WITHOUT a Nest container: the worker
 * (worker-jobs.ts) and the admin CLIs. AuditService throws AuditEntityNotRegisteredError on a before/after of an
 * entity type with no allowlist, and drops the fields an allowlist does not name – so a process that writes audit
 * must hold the same registry as the api.
 *
 * Until v1.0.0-rc.5 the allowlists ran only when a `*.module.ts` was imported; the worker imports none, so every J15
 * `folio.close` rolled back and every J24 `payment.expire` tick failed (BUG-R3-037/038, OPS j15-folio-close-check 10.2–10.3).
 * test/worker-audit-registry.test.ts checks, in a process that loads only the worker, that its registry equals the
 * api's and that this file imports every `modules/<m>/audit-entities.ts`. Test-only entities
 * (test-support/audit-entities.ts) are not listed here.
 */
import './modules/files/audit-entities';
import './modules/folio/audit-entities';
import './modules/frontdesk/audit-entities';
import './modules/guest-portal/audit-entities';
import './modules/guests/audit-entities';
import './modules/housekeeping/audit-entities';
import './modules/identity/audit-entities';
import './modules/inventory/audit-entities';
import './modules/payments/audit-entities';
import './modules/platform/audit-entities';
import './modules/public-site/audit-entities';
import './modules/registration/audit-entities';
import './modules/reservations/audit-entities';
import './modules/sales/audit-entities';
