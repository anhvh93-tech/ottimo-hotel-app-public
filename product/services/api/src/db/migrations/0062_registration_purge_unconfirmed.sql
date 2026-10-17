-- 0062 (drizzle draft from schema/registration.ts, BE-C – R2 Sprint 4; number from ORC 17/10): OpenAPI 0.3.7
-- bổ sung 3 #8 – `Registration.imagesPurgeReason` gains `unconfirmed` (SR-RET-02: the images of a declaration
-- that never reached `confirmed` were removed at their deadline; J16 writes it instead of `retention`).
-- `document_image.delete_reason` already allows `unconfirmed` (0053). Runs as ottimo_owner (SET ROLE by
-- src/db/migrate.ts) inside the migrator's single transaction.
ALTER TABLE "registration" DROP CONSTRAINT "registration_purge_reason_check";--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_purge_reason_check" CHECK ("registration"."images_purge_reason" IS NULL OR "registration"."images_purge_reason" IN ('retention', 'no_consent', 'consent_withdrawn', 'guest_request', 'void', 'unconfirmed'));
