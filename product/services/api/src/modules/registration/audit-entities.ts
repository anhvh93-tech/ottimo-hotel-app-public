/**
 * Audit allowlists of the registration module (SR-AUD-03, AuditEvent.before/after). No Nest import here, so EVERY process
 * that writes audit loads them: the api through registration.module.ts, the worker and the admin CLIs through
 * src/audit-entities.ts. Until v1.0.0-rc.5 they ran only when the module file was imported, which the worker never
 * does (BUG-R3-037/038, OPS j15-folio-close-check 10.2–10.3: J15 / J24 threw AuditEntityNotRegisteredError).
 */
import { defineAuditEntity } from '../audit/public/audit-fields';

// Audit allowlists (SR-AUD-03): state facts only – never a document field, name or note text.
// BUG-R2-083: `unclaimedDocuments` = how many unlinked guest-link documents a party removal / claim touched.
// S4-39: `guestUploadPersonIndex` = the desk's slot answer of removePartyMember (a number 2…20 or `none`).
defineAuditEntity('registration', [
  'checkCode',
  'manualResult',
  'imagesPurgeReason',
  'unclaimedDocuments',
  'guestUploadPersonIndex',
]);
defineAuditEntity('consent_record', ['purpose', 'decision', 'channel']);
