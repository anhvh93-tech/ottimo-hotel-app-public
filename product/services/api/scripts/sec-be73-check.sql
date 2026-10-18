-- SEC FB-R2-SEC-BE-73 / ARC 16.22 – READ-ONLY data check for demo / test databases (there is no real data yet).
-- Before 0070 a main document without `party_member_id` was taken as the BOOKER's: the booker's profile may hold
-- the document key / last 4 or the P05 decision of somebody else (a booking made for someone else).
-- Run as the migrator / owner (sees every property), e.g.:
--   psql "$MIGRATION_DATABASE_URL" -X -f scripts/sec-be73-check.sql
-- Prints ids and counts only (no names, no document numbers). Nothing is changed: a row listed here is fixed by
-- the desk (link the document to its person – GuestDocumentLink – and record P05 again) or by resetting the
-- profile's document key (`crm_consent` unchanged) in a reviewed one-off script.

-- 1. Booker profiles holding a document key whose last 4 is the one of a main document of their bookings that is
--    linked to nobody (pre-0070 rule) and whose printed name is not the booker's (approximate: upper case, accents
--    kept – review every row by hand).
SELECT g.id AS guest_id, r.id AS reservation_id, d.id AS guest_document_id,
       upper(d.full_name_on_doc) <> g.name_search AS name_differs
  FROM guest g
  JOIN reservation r ON r.booker_guest_id = g.id
  JOIN guest_document d ON d.reservation_id = r.id
 WHERE g.id_doc_last4 IS NOT NULL
   AND d.is_main AND d.party_member_id IS NULL AND d.guest_id IS NULL AND d.removed_at IS NULL
   AND d.doc_number_last4 = g.id_doc_last4
 ORDER BY g.id, r.id;

-- 2. P05 decisions recorded on such a document (they were applied to the booker's profile).
SELECT c.registration_id, c.guest_document_id, c.decision, c.recorded_at
  FROM consent_record c
  JOIN guest_document d ON d.id = c.guest_document_id
 WHERE c.purpose = 'P05_CRM'
   AND d.is_main AND d.party_member_id IS NULL AND d.guest_id IS NULL
 ORDER BY c.recorded_at;

-- 3. Totals.
SELECT
  (SELECT count(*) FROM guest_document d
    WHERE d.is_main AND d.party_member_id IS NULL AND d.guest_id IS NULL AND d.removed_at IS NULL)
    AS main_documents_linked_to_nobody,
  (SELECT count(*) FROM guest WHERE id_doc_last4 IS NOT NULL AND crm_consent IS DISTINCT FROM 'granted')
    AS last4_without_p05;
