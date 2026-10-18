-- 0076 (BE-A, R2 Sprint 4 tuần Ổn định, vòng sửa 8 – number from ORC 18/10). Not an edit of 0074: 0074 is merged
-- (#17 cc02fba) and a database that ran it would never get these columns. DOM 18/10 (BR-525 – a write-off never
-- exceeds the OPEN debt): the open debt is counted from the debt records themselves – `debt_opened_at` (start of the
-- open cycle: B18 debt, G-4 reversal, J15), `debt_recorded_vnd` (Σ debt recorded in that cycle: B18 = what was
-- owed, G-4 = the increase only, J15 = everything owed) and `debt_base_vnd` (Σ collected + written off on the folio
-- when the cycle opened – what came after reduces the debt; no clock comparison). ReservationHooks.openDebt →
-- `openDebtVnd`. Rows before 0076 keep NULL / 0 – their open debt is what the folio owes (the code falls back to it
-- when `debt_opened_at` is NULL) – so no backfill.
ALTER TABLE reservation ADD COLUMN debt_opened_at timestamp with time zone;
--> statement-breakpoint
ALTER TABLE reservation ADD COLUMN debt_recorded_vnd bigint DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE reservation ADD COLUMN debt_base_vnd bigint DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_debt_recorded_check
  CHECK (debt_recorded_vnd >= 0 AND (debt_opened_at IS NULL OR checkout_mode = 'debt'));
