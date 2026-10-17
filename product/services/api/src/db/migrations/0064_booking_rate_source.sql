-- 0064 (custom, hand-written – data only; BE-A, R2 Sprint 4 Phản hồi & sửa vòng 2 sau S4-38; number from ORC 18/10).
-- BUG-R2-126 (R2PAY-01/R2REGR-01/R2PAY-04): `reservation.pricing_snapshot.bookingRateSource` says where the price of
-- a booking came from AT BOOKING – 'manual_agreed' (direct/agent nights typed by the desk at creation: an agreed
-- price, BR-417 (2) v0.3.8) or 'calendar'. The application writes it for every booking from now on; nights typed
-- later (S4-35 setNightRate, B9a, B13, B18) never change it. This back-fills the bookings made before, from their
-- creation: the `reservation.priced` audit event of B2 (`after.rateSource = 'manual'` = nights typed at booking);
-- anything else (holds from quotes, child stays, OTA, manual long stays, no event) is 'calendar'. The application
-- only reads 'manual_agreed' for direct/agent short stays, so the channel is not needed here.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction. FORCE RLS binds
-- the owner too (pattern 0016/0055/0060): RLS is off for the back-fill only – on `audit_event` the parent's
-- policy is the one applied to a query through the partitioned parent.
ALTER TABLE reservation NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE audit_event NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE audit_event DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
UPDATE reservation r
   SET pricing_snapshot = r.pricing_snapshot || jsonb_build_object(
         'bookingRateSource',
         CASE WHEN EXISTS (
                SELECT 1 FROM audit_event e
                 WHERE e.entity_type = 'reservation' AND e.entity_id = r.id::text
                   AND e.action = 'reservation.priced' AND e.after ->> 'rateSource' = 'manual')
              THEN 'manual_agreed' ELSE 'calendar' END)
 WHERE NOT (r.pricing_snapshot ? 'bookingRateSource');
--> statement-breakpoint
ALTER TABLE audit_event ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE audit_event FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation FORCE ROW LEVEL SECURITY;
