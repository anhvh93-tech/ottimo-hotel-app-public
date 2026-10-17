-- 0043 (custom, hand-written – ARC s3-contract 4.2 / 4.2a; BE-B Sprint 3 fix round 4, re-verification 17/10).
-- x-ota-prepaid-rule backfill (DOM BE-13 Minor): an `ota_prepaid` booking confirmed before the rule existed has
-- no system receipt `ota_collect`, so its folio shows the whole OTA room money as due. One receipt per such
-- booking = the OTA-covered lines of that booking on its folio (room, OTA-kept fees: cancellation, no-show,
-- early departure – BR-307/310, never extra_person), exactly what FolioService.syncOtaCollect writes.
-- Code `PT-OTA-<full booking id>` (unique – one system receipt per booking; a uuidv7 prefix is a timestamp and
-- could repeat). Data only (no schema change – head snapshot unchanged). Idempotent: bookings that already have a system
-- receipt (live or reversed) are left to the folio sync. Runs as ottimo_owner with RLS off (pattern 0016/0042).

ALTER TABLE payment NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_line NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE payment DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_line DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
  reconciliation, amount_vnd, status, received_at, provider, note, created_at, updated_at)
SELECT gen_random_uuid(), r.organization_id, r.property_id,
       'PT-OTA-' || upper(replace(r.id::text, '-', '')),
       r.folio_id, r.id, 'charge', 'ota_collect', 'not_required', c.total, 'succeeded', now(), 'ota_system',
       'ota_prepaid_backfill', now(), now()
  FROM reservation r
  JOIN LATERAL (
    SELECT COALESCE(SUM(l.amount_vnd), 0) AS total FROM folio_line l
     WHERE l.folio_id = r.folio_id AND l.reservation_id = r.id AND l.line_state = 'posted'
       AND l.category IN ('room', 'cancellation_fee', 'no_show_fee', 'early_departure_fee')
  ) c ON true
 WHERE r.payment_model = 'ota_prepaid' AND r.folio_id IS NOT NULL AND c.total > 0
   AND NOT EXISTS (
     SELECT 1 FROM payment p WHERE p.folio_id = r.folio_id AND p.reservation_id = r.id
        AND p.provider = 'ota_system');
--> statement-breakpoint
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_line ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE payment FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_line FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation FORCE ROW LEVEL SECURITY;
