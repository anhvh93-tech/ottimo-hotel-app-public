/**
 * Audit allowlists of the identity module (SR-AUD-03, AuditEvent.before/after). No Nest import here, so EVERY process
 * that writes audit loads them: the api through identity.module.ts, the worker and the admin CLIs through
 * src/audit-entities.ts. Until v1.0.0-rc.5 they ran only when the module file was imported, which the worker never
 * does (BUG-R3-037/038, OPS j15-folio-close-check 10.2–10.3: J15 / J24 threw AuditEntityNotRegisteredError).
 * `app_user.operator` stays in public/operator-reset.ts: only the operator CLI writes it, and the api never held it.
 */
import { defineAuditEntity } from '../audit/public/audit-fields';

// Moved from identity.module.ts.
// Audit allowlists (SR-AUD-03) of the entities this module writes.
defineAuditEntity('app_user', [
  'clientOrigin',
  'lockCount',
  'until',
  'lockedUntil',
  'username',
  'roles',
  'displayName',
  'status',
  'passwordReset',
]);
defineAuditEntity('trusted_device', ['name', 'deviceKind', 'expiresAt', 'revokedAt']);
// v1.0.4 V3-04 / SEC V104-06: production-bootstrap records whether the first owner got an e-mail (boolean only).
defineAuditEntity('dataset', ['ownerEmailSet']);

// Moved from public/mfa-store.ts.
defineAuditEntity('app_user', [
  'amr',
  'method',
  'operationId',
  'recoveryCodesRemaining',
  'targetUserId',
  'ticketRef',
  'channel',
]);

// Moved from public/password-reauth.ts.
// verifyApprover (BR-416-06): a confirmation names the desk user it was typed for; a success records the failures
// it cleared (BUG-R2-167, SEC 12.3).
defineAuditEntity('app_user', ['confirmingFor', 'failedCountCleared']);

// 0.3.10 (R4 v1.0.3, BUG-R3-032): user.email_changed – the masked form only (`o***@e***.test`), never the address.
defineAuditEntity('app_user', ['emailMasked', 'via']);
