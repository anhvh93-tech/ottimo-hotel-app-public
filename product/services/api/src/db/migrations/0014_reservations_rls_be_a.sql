-- 0014 (custom, hand-written – erd 16; BE-A Sprint 2): inventory constraint, RLS, grants, partitions and the
-- cross-module FKs of the reservations tables (0013). Runs as ottimo_owner (SET ROLE by src/db/migrate.ts).

-- ───────────── ADR-009: no double booking, enforced by PostgreSQL ─────────────
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE room_occupancy ADD CONSTRAINT room_occupancy_no_overlap
  EXCLUDE USING gist (room_id WITH =, stay_range WITH &&) WHERE (active)
  DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE room_occupancy ADD CONSTRAINT room_occupancy_range_check
  CHECK (NOT isempty(stay_range) AND lower_inc(stay_range) AND NOT upper_inc(stay_range));
--> statement-breakpoint
-- Rack / availability: active rows of a room over a date window.
CREATE INDEX room_occupancy_active_range_idx ON room_occupancy USING gist (property_id, stay_range) WHERE active;
--> statement-breakpoint

-- ───────────── erd 7: an unassigned segment only for an open OTA conflict ─────────────
CREATE FUNCTION reservation_segment_room_check() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.room_id IS NULL AND NEW.active AND NOT EXISTS (
       SELECT 1 FROM reservation r WHERE r.id = NEW.reservation_id AND r.conflict_state = 'open') THEN
    RAISE EXCEPTION 'reservation_segment.room_id may be NULL only for an open OTA conflict (erd 7)'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
-- DEFERRABLE: the booking row turns `open` in the same transaction right after the segment is written.
CREATE CONSTRAINT TRIGGER reservation_segment_room_check
  AFTER INSERT OR UPDATE OF room_id, active ON reservation_segment
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION reservation_segment_room_check();
--> statement-breakpoint

-- ───────────── RLS (erd 2.3) – every new table is property-level ─────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['reservation', 'reservation_segment', 'room_occupancy', 'stay_night',
                           'reservation_change', 'overbooking_incident', 'room_block', 'hk_task',
                           'state_transition'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (property_id = app_current_property()) '
      'WITH CHECK (property_id = app_current_property())', t);
  END LOOP;
END $$;
--> statement-breakpoint

-- ───────────── Grants: business rows never DELETEd (erd 1); logs append-only (K8) ─────────────
GRANT SELECT, INSERT, UPDATE ON reservation, reservation_segment, room_occupancy, stay_night,
  overbooking_incident, room_block, hk_task TO ottimo_app;
--> statement-breakpoint
GRANT SELECT, INSERT ON reservation_change, state_transition TO ottimo_app;
--> statement-breakpoint
GRANT USAGE ON SEQUENCE state_transition_id_seq TO ottimo_app;
--> statement-breakpoint

-- ───────────── state_transition: monthly partitions like the other logs (BE-ARC-18) ─────────────
-- pg_temp last (FB-R2-SEC-BE-10, 0009) is kept when the function is replaced.
CREATE OR REPLACE FUNCTION log_ensure_month_partition(p_table text, p_month date) RETURNS text
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_from date := date_trunc('month', p_month)::date;
  v_to date := (date_trunc('month', p_month) + interval '1 month')::date;
  v_name text := format('%s_p%s', p_table, to_char(v_from, 'YYYYMM'));
BEGIN
  IF p_table NOT IN ('audit_event', 'c3_access_log', 'state_transition') THEN
    RAISE EXCEPTION 'log_ensure_month_partition: table % is not a partitioned log', p_table;
  END IF;
  IF to_regclass(format('public.%I', v_name)) IS NULL THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.%I FOR VALUES FROM (%L) TO (%L)',
                   v_name, p_table, v_from, v_to);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', v_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM ottimo_app', v_name);
  END IF;
  RETURN v_name;
END $$;
--> statement-breakpoint
DO $$
DECLARE m date;
BEGIN
  FOR m IN SELECT generate_series(date '2026-10-01', date '2027-12-01', interval '1 month')::date LOOP
    PERFORM log_ensure_month_partition('state_transition', m);
  END LOOP;
  CREATE TABLE public.state_transition_pdefault PARTITION OF public.state_transition DEFAULT;
  ALTER TABLE public.state_transition_pdefault ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.state_transition_pdefault FORCE ROW LEVEL SECURITY;
END $$;
--> statement-breakpoint

-- ───────────── Cross-module FKs (folio, sales – BE-B 0011 left them to this migration) ─────────────
-- reservation.folio_id → folio: DEFERRABLE INITIALLY DEFERRED (erd 4.6, BE-ARC-09) – folio and booking
-- point at each other and are created in the same transaction. NOT NULL waits for the folio wiring of every
-- creation path (R2 Sprint 2 – documented in the BE-A report).
ALTER TABLE reservation ADD CONSTRAINT reservation_folio_fk FOREIGN KEY (property_id, folio_id)
  REFERENCES folio (property_id, id) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_quote_fk FOREIGN KEY (property_id, quote_id)
  REFERENCES quote (property_id, id);
--> statement-breakpoint
ALTER TABLE folio ADD CONSTRAINT folio_primary_reservation_fk FOREIGN KEY (property_id, primary_reservation_id)
  REFERENCES reservation (property_id, id) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE folio_line ADD CONSTRAINT folio_line_reservation_fk FOREIGN KEY (property_id, reservation_id)
  REFERENCES reservation (property_id, id);
--> statement-breakpoint
ALTER TABLE folio_line ADD CONSTRAINT folio_line_stay_night_fk FOREIGN KEY (stay_night_id)
  REFERENCES stay_night (id);
--> statement-breakpoint
ALTER TABLE payment ADD CONSTRAINT payment_reservation_fk FOREIGN KEY (property_id, reservation_id)
  REFERENCES reservation (property_id, id);
--> statement-breakpoint
ALTER TABLE channel_fee ADD CONSTRAINT channel_fee_reservation_fk FOREIGN KEY (property_id, reservation_id)
  REFERENCES reservation (property_id, id);
--> statement-breakpoint
ALTER TABLE commission ADD CONSTRAINT commission_reservation_fk FOREIGN KEY (property_id, reservation_id)
  REFERENCES reservation (property_id, id);
--> statement-breakpoint
ALTER TABLE deposit_notice ADD CONSTRAINT deposit_notice_reservation_fk FOREIGN KEY (property_id, reservation_id)
  REFERENCES reservation (property_id, id);
--> statement-breakpoint
ALTER TABLE quote ADD CONSTRAINT quote_converted_reservation_fk FOREIGN KEY (property_id, converted_reservation_id)
  REFERENCES reservation (property_id, id);
