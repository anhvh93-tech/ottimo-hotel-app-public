-- 0078 (hand-written data migration – BE-C, R2 Sprint 4 sau cổng QC (K1); SEC FB-R2-SEC-BE-65, ARC s4-ARC.md E.1 a5/b3).
-- No schema change: the head snapshot 0078 is 0077's tables with a new id (pattern 0064/0067/0075).
-- Photos bound to a record before the fix kept `retention_anchor_at` NULL, so J16 never purged them. Anchor them
-- as the code does from now on – only rows still without an anchor and not purged; never moves an existing one:
-- (i)   work_order photos (reported + repaired): `done` → `done_at`; `cancelled` → `updated_at` (no
--       `cancelled_at`; `cancelled` is final, so `updated_at` is the cancel time or later – kept longer, never
--       shorter). Open orders (new / in_progress / waiting_parts) stay NULL until they close;
-- (ii)  inspection photos → `inspected_at`;
-- (iii) penalty_evidence of an ended stay still without anchor (bound after the checkout – BR-427 c – or of a
--       cancellation / no-show, which never anchored it before this fix): the end of the stay –
--       `actual_checkout_at` / `cancelled_at` / `no_show_marked_at` – else the upload time.
-- No RAISE: nothing here can be inconsistent; what stays NULL is counted by J16 (`anchor_missing`, SEC BE-65 b2).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction; FORCE RLS binds
-- the owner too, so RLS is off for these tables only (pattern 0065–0067, 0075).
ALTER TABLE attachment NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE attachment DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE work_order NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE work_order DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE inspection NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE inspection DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- (i) work orders closed
UPDATE attachment a
   SET retention_anchor_at = CASE w.status WHEN 'done' THEN w.done_at ELSE w.updated_at END
  FROM work_order w
 WHERE a.bound_ref_type = 'work_order' AND a.bound_ref_id = w.id
   AND a.retention_anchor_at IS NULL AND a.purged_at IS NULL
   AND ((w.status = 'done' AND w.done_at IS NOT NULL) OR w.status = 'cancelled');
--> statement-breakpoint
-- (ii) inspections
UPDATE attachment a
   SET retention_anchor_at = i.inspected_at
  FROM inspection i
 WHERE a.bound_ref_type = 'inspection' AND a.bound_ref_id = i.id
   AND a.retention_anchor_at IS NULL AND a.purged_at IS NULL;
--> statement-breakpoint
-- (iii) penalty evidence of an ended stay
UPDATE attachment a
   SET retention_anchor_at = COALESCE(CASE r.status WHEN 'checked_out' THEN r.actual_checkout_at
                                                    WHEN 'cancelled' THEN r.cancelled_at
                                                    WHEN 'no_show' THEN r.no_show_marked_at END,
                                      a.uploaded_at)
  FROM reservation r
 WHERE a.purpose = 'penalty_evidence' AND a.reservation_id = r.id
   AND a.bound_ref_id IS NOT NULL
   AND a.retention_anchor_at IS NULL AND a.purged_at IS NULL
   AND r.status IN ('checked_out', 'cancelled', 'no_show');
--> statement-breakpoint
ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE inspection ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE inspection FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE work_order ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE work_order FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE attachment ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE attachment FORCE ROW LEVEL SECURITY;
