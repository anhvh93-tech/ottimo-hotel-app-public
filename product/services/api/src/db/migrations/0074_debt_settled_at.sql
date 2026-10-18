-- 0074 (BE-A, R2 Sprint 4 tuần Ổn định – number PROPOSED by BE-A 18/10, ORC to confirm or renumber). ARC 16.26
-- (BR-525 G-4 – collecting a debt after check-out): `reservation.debt_settled_at` = when the open debt of the stay
-- was paid in full (ReservationHooks.debtSettled, called by payments `recordPayment` in its debt-collection
-- branch). NULL = open (or no debt); a new debt (a receipt reversed again – debtAfterReversal) re-opens it. Only a
-- debt booking carries it. "Cần chú ý" `checkout_debt` lists open debts only.
ALTER TABLE reservation ADD COLUMN debt_settled_at timestamp with time zone;
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_debt_settled_check
  CHECK (debt_settled_at IS NULL OR checkout_mode = 'debt');
