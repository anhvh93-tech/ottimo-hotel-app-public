-- 0013 (drizzle-kit draft, hand-edited – erd 16; BE-A Sprint 2): reservations tables (erd 4.5, 4.8 hk_task,
-- 4.9 room_block, 4.3 state_transition partitioned by month – BE-ARC-18). Constraints drizzle-kit does not
-- know (EXCLUDE, RLS, grants, partitions, deferrable FKs) are in 0014.
CREATE TABLE "state_transition" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "state_transition_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"machine" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"from_state" text,
	"to_state" text NOT NULL,
	"event_code" text NOT NULL,
	"actor_type" text NOT NULL,
	"actor_user_id" uuid,
	"reason_code" text,
	"reason_note" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"performed_at" timestamp with time zone,
	"rejected" boolean DEFAULT false NOT NULL,
	"request_id" text,
	CONSTRAINT "state_transition_pkey" PRIMARY KEY("id","occurred_at"),
	CONSTRAINT "state_transition_actor_type_check" CHECK ("state_transition"."actor_type" IN ('user', 'guest', 'system')),
	CONSTRAINT "state_transition_machine_check" CHECK ("state_transition"."machine" ~ '^SM-[0-9]{2}$')
) PARTITION BY RANGE ("occurred_at");
--> statement-breakpoint
CREATE TABLE "hk_task" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"reservation_id" uuid,
	"type" text NOT NULL,
	"quantity" smallint DEFAULT 1 NOT NULL,
	"status" text NOT NULL,
	"due_at" timestamp with time zone,
	"due_date" date NOT NULL,
	"window_start" time,
	"window_end" time,
	"not_before_time" time,
	"priority_rank" smallint DEFAULT 0 NOT NULL,
	"assigned_user_id" uuid,
	"source" text NOT NULL,
	"guest_request_id" uuid,
	"note" text,
	"refill_items" jsonb,
	"started_at" timestamp with time zone,
	"done_at" timestamp with time zone,
	"done_by" uuid,
	"cancel_reason" text,
	"client_mutation_id" text,
	"performed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "hk_task_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "hk_task_type_check" CHECK ("hk_task"."type" IN ('checkout_clean', 'stayover_clean', 'long_stay_clean', 'minibar_refill', 'guest_request', 'after_repair_clean', 'adhoc_clean', 'priority_clean', 'extra_guest_kit_prepare', 'extra_guest_kit_collect', 'extra_guest_kit_transfer')),
	CONSTRAINT "hk_task_status_check" CHECK ("hk_task"."status" IN ('open', 'in_progress', 'done', 'cancelled')),
	CONSTRAINT "hk_task_source_check" CHECK ("hk_task"."source" IN ('system', 'manual', 'guest_app')),
	CONSTRAINT "hk_task_quantity_check" CHECK ("hk_task"."quantity" >= 1),
	CONSTRAINT "hk_task_kit_reservation_check" CHECK ("hk_task"."type" NOT LIKE 'extra_guest_kit_%' OR ("hk_task"."reservation_id" IS NOT NULL AND "hk_task"."source" = 'system'))
);
--> statement-breakpoint
CREATE TABLE "overbooking_incident" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"requested_room_id" uuid,
	"stay_from" date NOT NULL,
	"stay_to" date NOT NULL,
	"conflicting_reservation_ids" uuid[] NOT NULL,
	"source" text NOT NULL,
	"cause" text NOT NULL,
	"detected_at" timestamp with time zone NOT NULL,
	"handle_by" timestamp with time zone,
	"status" text NOT NULL,
	"resolution" text,
	"cost_vnd" bigint,
	"decided_by" uuid,
	"decision_note" text,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "overbooking_incident_source_check" CHECK ("overbooking_incident"."source" IN ('desk', 'channel_sync')),
	CONSTRAINT "overbooking_incident_cause_check" CHECK ("overbooking_incident"."cause" IN ('sync_delay', 'manual_entry', 'channel_overbooked', 'other')),
	CONSTRAINT "overbooking_incident_status_check" CHECK ("overbooking_incident"."status" IN ('open', 'resolved')),
	CONSTRAINT "overbooking_incident_resolution_check" CHECK ("overbooking_incident"."resolution" IS NULL OR "overbooking_incident"."resolution" IN ('reassigned_same_group', 'upgraded', 'relocated_external', 'cancelled_by_channel')),
	CONSTRAINT "overbooking_incident_resolved_check" CHECK ("overbooking_incident"."status" <> 'resolved' OR ("overbooking_incident"."resolution" IS NOT NULL AND "overbooking_incident"."resolved_at" IS NOT NULL)),
	CONSTRAINT "overbooking_incident_cost_check" CHECK ("overbooking_incident"."cost_vnd" IS NULL OR "overbooking_incident"."cost_vnd" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"code" text NOT NULL,
	"status" text NOT NULL,
	"stay_type" text NOT NULL,
	"channel_id" uuid NOT NULL,
	"payment_model" text NOT NULL,
	"ota_ref" text,
	"ota_booked_at" timestamp with time zone,
	"direct_source" text,
	"booker_guest_id" uuid NOT NULL,
	"closer_user_id" uuid,
	"parent_reservation_id" uuid,
	"stay_group_id" uuid,
	"quote_id" uuid,
	"group_id" uuid,
	"folio_id" uuid,
	"arrival_date" date NOT NULL,
	"departure_date" date NOT NULL,
	"booked_arrival_date" date,
	"booked_departure_date" date,
	"adults" smallint NOT NULL,
	"children_6_11" smallint DEFAULT 0 NOT NULL,
	"children_under_6" smallint DEFAULT 0 NOT NULL,
	"eta_time" time,
	"is_complimentary" boolean DEFAULT false NOT NULL,
	"conflict_state" text DEFAULT 'none' NOT NULL,
	"hold_created_at" timestamp with time zone,
	"hold_hours" smallint,
	"hold_expires_at" timestamp with time zone,
	"hold_extended_count" smallint DEFAULT 0 NOT NULL,
	"deposit_required_vnd" bigint DEFAULT 0 NOT NULL,
	"total_room_vnd" bigint DEFAULT 0 NOT NULL,
	"pricing_snapshot" jsonb NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancelled_by_type" text,
	"cancelled_by" uuid,
	"cancel_reason_code" text,
	"cancel_note" text,
	"status_before_cancel" text,
	"confirmed_at" timestamp with time zone,
	"no_show_marked_at" timestamp with time zone,
	"no_show_marked_by" uuid,
	"no_show_contact_note" text,
	"reschedule_count" smallint DEFAULT 0 NOT NULL,
	"actual_checkin_at" timestamp with time zone,
	"actual_checkout_at" timestamp with time zone,
	"agreed_checkout_time" time,
	"internal_note" text,
	"external_contract" boolean DEFAULT false NOT NULL,
	"manual_long_stay" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "reservation_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "reservation_property_code_key" UNIQUE("property_id","code"),
	CONSTRAINT "reservation_status_check" CHECK ("reservation"."status" IN ('hold', 'confirmed', 'in_house', 'checked_out', 'cancelled', 'no_show')),
	CONSTRAINT "reservation_stay_type_check" CHECK ("reservation"."stay_type" IN ('short', 'long')),
	CONSTRAINT "reservation_payment_model_check" CHECK ("reservation"."payment_model" IN ('direct', 'ota_prepaid', 'ota_pay_at_property')),
	CONSTRAINT "reservation_direct_source_check" CHECK ("reservation"."direct_source" IS NULL OR "reservation"."direct_source" IN ('website', 'zalo_phone', 'walk_in', 'returning', 'sales_staff')),
	CONSTRAINT "reservation_dates_check" CHECK ("reservation"."departure_date" > "reservation"."arrival_date"),
	CONSTRAINT "reservation_people_check" CHECK ("reservation"."adults" >= 1 AND "reservation"."children_6_11" >= 0 AND "reservation"."children_under_6" >= 0),
	CONSTRAINT "reservation_conflict_state_check" CHECK ("reservation"."conflict_state" IN ('none', 'open', 'resolved')),
	CONSTRAINT "reservation_hold_check" CHECK ("reservation"."status" <> 'hold' OR "reservation"."hold_expires_at" IS NOT NULL),
	CONSTRAINT "reservation_cancel_reason_check" CHECK ("reservation"."cancel_reason_code" IS NULL OR "reservation"."cancel_reason_code" IN ('guest_cancelled', 'guest_changed_mind', 'found_other', 'price', 'date_change', 'unreachable', 'hold_expired', 'ota_cancelled', 'overbooking_relocated', 'group_partial', 'other')),
	CONSTRAINT "reservation_cancelled_check" CHECK ("reservation"."status" <> 'cancelled' OR ("reservation"."cancel_reason_code" IS NOT NULL AND "reservation"."cancelled_at" IS NOT NULL)),
	CONSTRAINT "reservation_status_before_cancel_check" CHECK ("reservation"."status" NOT IN ('cancelled', 'no_show') OR "reservation"."status_before_cancel" IN ('hold', 'confirmed')),
	CONSTRAINT "reservation_external_contract_check" CHECK (NOT "reservation"."external_contract" OR "reservation"."stay_type" = 'long'),
	CONSTRAINT "reservation_money_check" CHECK ("reservation"."deposit_required_vnd" >= 0 AND "reservation"."total_room_vnd" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reservation_change" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"changed_by" uuid,
	"field" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "reservation_segment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"room_id" uuid,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"change_reason_code" text,
	"change_note" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "reservation_segment_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "reservation_segment_dates_check" CHECK ("reservation_segment"."to_date" > "reservation_segment"."from_date")
);
--> statement-breakpoint
CREATE TABLE "room_block" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"status" text NOT NULL,
	"reason" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date_planned" date NOT NULL,
	"end_date_actual" date,
	"work_order_id" uuid,
	"affected_reservation_ack_by" uuid,
	"released_at" timestamp with time zone,
	"released_by" uuid,
	"release_reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "room_block_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "room_block_status_check" CHECK ("room_block"."status" IN ('planned', 'active', 'released', 'cancelled')),
	CONSTRAINT "room_block_dates_check" CHECK ("room_block"."end_date_planned" > "room_block"."start_date"),
	CONSTRAINT "room_block_actual_check" CHECK ("room_block"."end_date_actual" IS NULL OR "room_block"."end_date_actual" >= "room_block"."start_date")
);
--> statement-breakpoint
CREATE TABLE "room_occupancy" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"stay_range" daterange NOT NULL,
	"kind" text NOT NULL,
	"reservation_segment_id" uuid,
	"room_block_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "room_occupancy_kind_check" CHECK ("room_occupancy"."kind" IN ('reservation', 'hold', 'ooo')),
	CONSTRAINT "room_occupancy_source_check" CHECK (num_nonnulls("room_occupancy"."reservation_segment_id", "room_occupancy"."room_block_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "stay_night" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"reservation_segment_id" uuid,
	"room_id" uuid,
	"stay_date" date NOT NULL,
	"night_state" text NOT NULL,
	"room_revenue_gross_vnd" bigint NOT NULL,
	"discount_vnd" bigint DEFAULT 0 NOT NULL,
	"room_revenue_vnd" bigint NOT NULL,
	"channel_fee_vnd" bigint DEFAULT 0 NOT NULL,
	"channel_fee_is_estimate" boolean DEFAULT true NOT NULL,
	"agent_commission_vnd" bigint DEFAULT 0 NOT NULL,
	"staff_commission_vnd" bigint DEFAULT 0 NOT NULL,
	"service_fee_alloc_vnd" bigint DEFAULT 0 NOT NULL,
	"sold_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"prev_state" text,
	"vat_rate_pct" numeric,
	"is_complimentary" boolean DEFAULT false NOT NULL,
	"rate_source" text NOT NULL,
	"channel_id" uuid NOT NULL,
	"stay_type" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "stay_night_state_check" CHECK ("stay_night"."night_state" IN ('hold', 'sold', 'void')),
	CONSTRAINT "stay_night_void_check" CHECK ("stay_night"."night_state" <> 'void' OR ("stay_night"."voided_at" IS NOT NULL AND "stay_night"."void_reason" IN ('hold_expired', 'cancelled', 'no_show', 'early_departure', 'lease_terminated', 'date_change', 'relocated_external', 'channel_cancelled') AND "stay_night"."prev_state" IN ('hold', 'sold'))),
	CONSTRAINT "stay_night_money_check" CHECK ("stay_night"."room_revenue_gross_vnd" >= 0 AND "stay_night"."discount_vnd" >= 0 AND "stay_night"."room_revenue_vnd" = "stay_night"."room_revenue_gross_vnd" - "stay_night"."discount_vnd"),
	CONSTRAINT "stay_night_rate_source_check" CHECK ("stay_night"."rate_source" IN ('short_stay_rate', 'lease_allocation', 'extra_night_early_late', 'extension', 'odd_days'))
);
--> statement-breakpoint
ALTER TABLE "hk_task" ADD CONSTRAINT "hk_task_room_fk" FOREIGN KEY ("property_id","room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hk_task" ADD CONSTRAINT "hk_task_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overbooking_incident" ADD CONSTRAINT "overbooking_incident_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overbooking_incident" ADD CONSTRAINT "overbooking_incident_room_fk" FOREIGN KEY ("property_id","requested_room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_channel_fk" FOREIGN KEY ("property_id","channel_id") REFERENCES "public"."channel"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_booker_fk" FOREIGN KEY ("organization_id","booker_guest_id") REFERENCES "public"."guest"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_closer_fk" FOREIGN KEY ("organization_id","closer_user_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_parent_fk" FOREIGN KEY ("property_id","parent_reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_change" ADD CONSTRAINT "reservation_change_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_segment" ADD CONSTRAINT "reservation_segment_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_segment" ADD CONSTRAINT "reservation_segment_room_fk" FOREIGN KEY ("property_id","room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_block" ADD CONSTRAINT "room_block_room_fk" FOREIGN KEY ("property_id","room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_block" ADD CONSTRAINT "room_block_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_occupancy" ADD CONSTRAINT "room_occupancy_room_fk" FOREIGN KEY ("property_id","room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_occupancy" ADD CONSTRAINT "room_occupancy_segment_fk" FOREIGN KEY ("property_id","reservation_segment_id") REFERENCES "public"."reservation_segment"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_occupancy" ADD CONSTRAINT "room_occupancy_block_fk" FOREIGN KEY ("property_id","room_block_id") REFERENCES "public"."room_block"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stay_night" ADD CONSTRAINT "stay_night_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stay_night" ADD CONSTRAINT "stay_night_segment_fk" FOREIGN KEY ("property_id","reservation_segment_id") REFERENCES "public"."reservation_segment"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stay_night" ADD CONSTRAINT "stay_night_room_fk" FOREIGN KEY ("property_id","room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "state_transition_entity_idx" ON "state_transition" USING btree ("entity_id","occurred_at");--> statement-breakpoint
CREATE INDEX "state_transition_property_idx" ON "state_transition" USING btree ("property_id","machine","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "hk_task_clean_uk" ON "hk_task" USING btree ("room_id","type","due_date") WHERE "hk_task"."status" IN ('open', 'in_progress') AND "hk_task"."type" IN ('stayover_clean', 'long_stay_clean', 'checkout_clean');--> statement-breakpoint
CREATE UNIQUE INDEX "hk_task_kit_uk" ON "hk_task" USING btree ("reservation_id","room_id","type") WHERE "hk_task"."status" IN ('open', 'in_progress') AND "hk_task"."type" LIKE 'extra_guest_kit_%';--> statement-breakpoint
CREATE INDEX "hk_task_due_idx" ON "hk_task" USING btree ("property_id","due_date","status");--> statement-breakpoint
CREATE INDEX "overbooking_incident_status_idx" ON "overbooking_incident" USING btree ("property_id","status","detected_at");--> statement-breakpoint
CREATE INDEX "overbooking_incident_reservation_idx" ON "overbooking_incident" USING btree ("reservation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reservation_ota_ref_uk" ON "reservation" USING btree ("property_id","channel_id","ota_ref") WHERE "reservation"."ota_ref" IS NOT NULL AND "reservation"."status" <> 'cancelled';--> statement-breakpoint
CREATE INDEX "reservation_status_arrival_idx" ON "reservation" USING btree ("property_id","status","arrival_date");--> statement-breakpoint
CREATE INDEX "reservation_departure_idx" ON "reservation" USING btree ("property_id","departure_date");--> statement-breakpoint
CREATE INDEX "reservation_closer_idx" ON "reservation" USING btree ("property_id","closer_user_id");--> statement-breakpoint
CREATE INDEX "reservation_created_by_idx" ON "reservation" USING btree ("property_id","created_by");--> statement-breakpoint
CREATE INDEX "reservation_hold_expiry_idx" ON "reservation" USING btree ("property_id","hold_expires_at") WHERE "reservation"."status" = 'hold';--> statement-breakpoint
CREATE INDEX "reservation_external_contract_idx" ON "reservation" USING btree ("property_id") WHERE "reservation"."external_contract";--> statement-breakpoint
CREATE INDEX "reservation_conflict_open_idx" ON "reservation" USING btree ("property_id") WHERE "reservation"."conflict_state" = 'open';--> statement-breakpoint
CREATE INDEX "reservation_change_reservation_idx" ON "reservation_change" USING btree ("reservation_id","changed_at");--> statement-breakpoint
CREATE INDEX "reservation_segment_reservation_idx" ON "reservation_segment" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "reservation_segment_room_idx" ON "reservation_segment" USING btree ("property_id","room_id","from_date") WHERE "reservation_segment"."active";--> statement-breakpoint
CREATE INDEX "room_block_room_idx" ON "room_block" USING btree ("property_id","room_id","start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "room_occupancy_block_uk" ON "room_occupancy" USING btree ("room_block_id");--> statement-breakpoint
CREATE UNIQUE INDEX "room_occupancy_segment_uk" ON "room_occupancy" USING btree ("reservation_segment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stay_night_reservation_date_uk" ON "stay_night" USING btree ("reservation_id","stay_date") WHERE "stay_night"."night_state" <> 'void';--> statement-breakpoint
CREATE INDEX "stay_night_sold_idx" ON "stay_night" USING btree ("property_id","stay_date") WHERE "stay_night"."night_state" = 'sold';--> statement-breakpoint
CREATE INDEX "stay_night_void_idx" ON "stay_night" USING btree ("property_id","stay_date") WHERE "stay_night"."night_state" = 'void';