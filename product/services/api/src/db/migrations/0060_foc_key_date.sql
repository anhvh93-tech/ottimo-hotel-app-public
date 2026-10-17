-- 0060 (custom, hand-written – erd 16, ARC s3-contract 4.2a; BE-B, R2 Sprint 4, number handed out by ORC 17/10).
-- FOC key of a foc / special_discount request (BR-434 v0.3.5/v0.3.6 – S4-02, S4-18, S4-23):
-- a FOC belongs to a KEY = stay (the folio: primary booking + its children) × line category × service date
-- (room night, extra-person fee); early check-in / late check-out are ONE key per stay; any other charge is
-- its own line (followed through adjustFolioLine replacements). The category never changes (it is the
-- category of the line the request was made on); the DATE moves with the nights (BR-434 (1)–(3): a kept date
-- keeps its FOC, dropped[i] → added[i]) – also while the FOC is DORMANT (no FOC line left to read the date
-- from: extra-person fee back to 0, then the stay moves) or PENDING. The folio sync is the only writer.
-- NULL = the request is not on a room / extra-person line (or legacy row – the sync falls back to the date
-- of the line the request was made on, which is exactly what the backfill below writes).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.

ALTER TABLE approval_request ADD COLUMN foc_service_date date;
--> statement-breakpoint
ALTER TABLE approval_request ADD CONSTRAINT approval_request_foc_service_date_check
  CHECK (foc_service_date IS NULL OR type IN ('foc', 'special_discount'));
--> statement-breakpoint
-- Backfill (pattern 0016/0055): FORCE RLS binds the owner too, so RLS is off for the backfill only.
ALTER TABLE approval_request NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE approval_request DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- The date of the room / extra-person line the request was made on (its FOC line → related_line_id).
UPDATE approval_request a
   SET foc_service_date = c.service_date
  FROM folio_line f, folio_line c
 WHERE f.id = a.folio_line_id AND c.id = f.related_line_id
   AND a.type IN ('foc', 'special_discount')
   AND c.category IN ('room', 'extra_person');
--> statement-breakpoint
ALTER TABLE approval_request ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE approval_request FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
-- 0042/0055 keep UPDATE column-level (SM-10): the key date moves with the nights, what was asked does not.
GRANT UPDATE (foc_service_date) ON approval_request TO ottimo_app;
