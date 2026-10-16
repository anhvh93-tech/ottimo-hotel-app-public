-- 0041 (custom, hand-written – ARC s3-contract 4.2; BE-B Sprint 3): inventory module, minibar part
-- (erd `item`, `minibar_check`, `minibar_check_line`; US-035, BR-701/702/703, OpenAPI 0.3.3 E05-04).
-- item: minibar / consumable goods of a property (cost price is C2 – OWN/MGR, never in HK/FD payloads).
-- minibar_check: one count of a room's minibar for a booking; a second `checkout` count replaces the first
-- (replaced_by_check_id; its folio lines are reversed – BR-008). Lines: used_qty generated, prices snapshotted.
-- Runs as ottimo_owner.

CREATE TABLE item (
  id uuid PRIMARY KEY NOT NULL,
  organization_id uuid NOT NULL,
  property_id uuid NOT NULL,
  code text NOT NULL,
  kind text NOT NULL DEFAULT 'minibar',
  name text NOT NULL,
  unit text NOT NULL,
  cost_price_vnd bigint,
  sale_price_vnd bigint,
  minibar_standard_qty integer NOT NULL DEFAULT 0,
  min_stock_qty integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL,
  created_by uuid,
  updated_at timestamp with time zone NOT NULL,
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT item_property_id_key UNIQUE (property_id, id),
  CONSTRAINT item_property_code_key UNIQUE (property_id, code),
  CONSTRAINT item_property_fk FOREIGN KEY (organization_id, property_id) REFERENCES property (organization_id, id),
  CONSTRAINT item_kind_check CHECK (kind IN ('minibar', 'consumable', 'fnb')),
  CONSTRAINT item_price_check CHECK ((cost_price_vnd IS NULL OR cost_price_vnd >= 0)
    AND (sale_price_vnd IS NULL OR sale_price_vnd >= 0)),
  CONSTRAINT item_qty_check CHECK (minibar_standard_qty >= 0 AND min_stock_qty >= 0)
);
--> statement-breakpoint
CREATE TABLE minibar_check (
  id uuid PRIMARY KEY NOT NULL,
  organization_id uuid NOT NULL,
  property_id uuid NOT NULL,
  reservation_id uuid NOT NULL,
  room_id uuid NOT NULL,
  mode text NOT NULL,
  business_date date NOT NULL,
  checked_by uuid NOT NULL,
  checked_at timestamp with time zone NOT NULL,
  replaces_check_id uuid,
  replaced_by_check_id uuid,
  total_vnd bigint NOT NULL DEFAULT 0,
  refill_task_id uuid,
  created_at timestamp with time zone NOT NULL,
  CONSTRAINT minibar_check_property_id_key UNIQUE (property_id, id),
  CONSTRAINT minibar_check_property_fk FOREIGN KEY (organization_id, property_id)
    REFERENCES property (organization_id, id),
  CONSTRAINT minibar_check_reservation_fk FOREIGN KEY (property_id, reservation_id)
    REFERENCES reservation (property_id, id),
  CONSTRAINT minibar_check_room_fk FOREIGN KEY (property_id, room_id) REFERENCES room (property_id, id),
  CONSTRAINT minibar_check_checked_by_fk FOREIGN KEY (organization_id, checked_by)
    REFERENCES app_user (organization_id, id),
  CONSTRAINT minibar_check_replaces_fk FOREIGN KEY (property_id, replaces_check_id)
    REFERENCES minibar_check (property_id, id),
  -- DEFERRABLE: the old count points at its replacement in the same transaction, before the new row exists
  -- (the partial unique index allows one live checkout count at a time).
  CONSTRAINT minibar_check_replaced_by_fk FOREIGN KEY (property_id, replaced_by_check_id)
    REFERENCES minibar_check (property_id, id) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT minibar_check_mode_check CHECK (mode IN ('checkout', 'stayover')),
  CONSTRAINT minibar_check_total_check CHECK (total_vnd >= 0)
);
--> statement-breakpoint
-- erd 0.3.3: one live `checkout` count per booking (a second count replaces the first).
CREATE UNIQUE INDEX minibar_check_live_checkout_key ON minibar_check (reservation_id)
  WHERE mode = 'checkout' AND replaced_by_check_id IS NULL;
--> statement-breakpoint
CREATE INDEX minibar_check_reservation_idx ON minibar_check (property_id, reservation_id, checked_at);
--> statement-breakpoint
CREATE TABLE minibar_check_line (
  id uuid PRIMARY KEY NOT NULL,
  organization_id uuid NOT NULL,
  property_id uuid NOT NULL,
  check_id uuid NOT NULL,
  item_id uuid NOT NULL,
  standard_qty integer NOT NULL,
  remaining_qty integer NOT NULL,
  used_qty integer GENERATED ALWAYS AS (standard_qty - remaining_qty) STORED,
  unit_price_vnd_snapshot bigint,
  unit_cost_vnd_snapshot bigint,
  amount_vnd bigint NOT NULL DEFAULT 0,
  folio_line_id uuid,
  CONSTRAINT minibar_check_line_property_fk FOREIGN KEY (organization_id, property_id)
    REFERENCES property (organization_id, id),
  CONSTRAINT minibar_check_line_check_fk FOREIGN KEY (property_id, check_id) REFERENCES minibar_check (property_id, id),
  CONSTRAINT minibar_check_line_item_fk FOREIGN KEY (property_id, item_id) REFERENCES item (property_id, id),
  CONSTRAINT minibar_check_line_folio_line_fk FOREIGN KEY (property_id, folio_line_id)
    REFERENCES folio_line (property_id, id),
  CONSTRAINT minibar_check_line_item_key UNIQUE (check_id, item_id),
  CONSTRAINT minibar_check_line_qty_check CHECK (standard_qty >= 0 AND remaining_qty >= 0
    AND remaining_qty <= standard_qty),
  CONSTRAINT minibar_check_line_amount_check CHECK (amount_vnd >= 0
    AND (unit_price_vnd_snapshot IS NULL OR unit_price_vnd_snapshot >= 0))
);
--> statement-breakpoint
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['item', 'minibar_check', 'minibar_check_line'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (property_id = app_current_property()) '
      'WITH CHECK (property_id = app_current_property())', t);
  END LOOP;
END $$;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON item TO ottimo_app;
--> statement-breakpoint
-- A count is a record: lines are never changed; only the replacement link of the check moves.
GRANT SELECT, INSERT ON minibar_check, minibar_check_line TO ottimo_app;
--> statement-breakpoint
GRANT UPDATE (replaced_by_check_id, refill_task_id) ON minibar_check TO ottimo_app;
