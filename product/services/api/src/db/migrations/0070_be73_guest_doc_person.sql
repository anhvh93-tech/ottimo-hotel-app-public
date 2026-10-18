-- 0070 (drizzle draft from schema/registration.ts + schema/guests.ts, completed by hand – BE-C, R2 Sprint 4 tuần Ổn
-- định; number from ORC 18/10). SEC FB-R2-SEC-BE-73 / ARC 16.22 and SEC FB-R2-SEC-BE-78 (a):
-- (1) `guest_document.guest_id` (0051, unused until now) = the BOOKER's profile when the document is the booker's.
--     The booker is a party person (`party[]` id = the booking id) without a `reservation_guest` row, so a document
--     of the booker cannot use `party_member_id`. It is never inferred from `is_main` any more (the bug: a booking
--     made for someone else put that person's document key, last 4 and P05 on the booker's profile). Exclusive with
--     `party_member_id`; one per declaration. The app may set it (GRANT UPDATE – linking the booker, S4-39 link).
-- (2) the last 4 digits of the ID exist only with the P05 consent of the profile (like `id_doc_hmac` – 0055 CHECK 2).
-- Existing data is checked first and never corrected silently.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM guest_document WHERE guest_id IS NOT NULL;
  IF n > 0 THEN RAISE EXCEPTION '0070: % guest_document rows already have guest_id', n; END IF;
  SELECT count(*) INTO n FROM guest WHERE id_doc_last4 IS NOT NULL AND crm_consent IS DISTINCT FROM 'granted';
  IF n > 0 THEN RAISE EXCEPTION '0070: % guest rows keep id_doc_last4 without P05 (SEC BE-78 a)', n; END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "guest_document" ADD CONSTRAINT "guest_document_person_check"
  CHECK ("guest_document"."guest_id" IS NULL OR "guest_document"."party_member_id" IS NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX "guest_document_booker_uk" ON "guest_document" USING btree ("registration_id")
  WHERE "guest_document"."guest_id" IS NOT NULL AND "guest_document"."removed_at" IS NULL;
--> statement-breakpoint
GRANT UPDATE (guest_id) ON guest_document TO ottimo_app;
--> statement-breakpoint
ALTER TABLE "guest" ADD CONSTRAINT "guest_id_doc_last4_consent_check"
  CHECK ("guest"."id_doc_last4" IS NULL OR "guest"."crm_consent" = 'granted') NOT VALID;
--> statement-breakpoint
ALTER TABLE "guest" VALIDATE CONSTRAINT "guest_id_doc_last4_consent_check";
