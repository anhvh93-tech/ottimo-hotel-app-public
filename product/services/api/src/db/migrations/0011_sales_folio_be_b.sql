-- 0011 (drizzle-kit draft, BE-B Sprint 2): channel + channel_commission_rate (platform), folio, folio_line,
-- payment, channel_fee, commission, deposit_notice (folio/payments), lead, quote (sales), room_group
-- service fee (BR-204/108). RLS, grants and FKs to BE-A's reservation tables: 0012 + BE-A's migration.
CREATE TABLE "channel" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"channel_group" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"requires_ota_ref" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "channel_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "channel_property_code_key" UNIQUE("property_id","code"),
	CONSTRAINT "channel_group_check" CHECK ("channel"."channel_group" IN ('direct', 'agent', 'ota', 'internal')),
	CONSTRAINT "channel_code_check" CHECK ("channel"."code" ~ '^[a-z][a-z0-9_]{1,31}$')
);
--> statement-breakpoint
CREATE TABLE "channel_commission_rate" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"rate_pct" numeric(5, 2) NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "channel_commission_rate_from_key" UNIQUE("channel_id","effective_from"),
	CONSTRAINT "channel_commission_rate_pct_check" CHECK ("channel_commission_rate"."rate_pct" >= 0 AND "channel_commission_rate"."rate_pct" <= 100)
);
--> statement-breakpoint
CREATE TABLE "channel_fee" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"base_amount_vnd" bigint NOT NULL,
	"rate_pct_snapshot" numeric(5, 2) NOT NULL,
	"amount_estimated_vnd" bigint NOT NULL,
	"amount_actual_vnd" bigint,
	"source" text NOT NULL,
	"reconciled_at" timestamp with time zone,
	"recognized_on" date,
	"amount_on_cancellation_vnd" bigint,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "channel_fee_reservation_key" UNIQUE("reservation_id"),
	CONSTRAINT "channel_fee_source_check" CHECK ("channel_fee"."source" IN ('channel_manager', 'manual_reconcile', 'estimate')),
	CONSTRAINT "channel_fee_amount_check" CHECK ("channel_fee"."base_amount_vnd" >= 0 AND "channel_fee"."amount_estimated_vnd" >= 0 AND ("channel_fee"."amount_actual_vnd" IS NULL OR "channel_fee"."amount_actual_vnd" >= 0))
);
--> statement-breakpoint
CREATE TABLE "commission" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid,
	"lease_contract_id" uuid,
	"payee_type" text NOT NULL,
	"payee_user_id" uuid NOT NULL,
	"rate_pct_snapshot" numeric(5, 2) NOT NULL,
	"base_amount_vnd" bigint NOT NULL,
	"amount_vnd" bigint NOT NULL,
	"status" text NOT NULL,
	"recognized_at" timestamp with time zone,
	"void_reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "commission_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "commission_target_check" CHECK (num_nonnulls("commission"."reservation_id", "commission"."lease_contract_id") = 1),
	CONSTRAINT "commission_payee_type_check" CHECK ("commission"."payee_type" IN ('agent', 'staff')),
	CONSTRAINT "commission_status_check" CHECK ("commission"."status" IN ('projected', 'earned', 'payable', 'paid', 'void')),
	CONSTRAINT "commission_void_check" CHECK ("commission"."status" <> 'void' OR "commission"."void_reason" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "deposit_notice" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"amount_vnd" bigint NOT NULL,
	"attachment_id" uuid,
	"note" text,
	"status" text DEFAULT 'open' NOT NULL,
	"handled_payment_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "deposit_notice_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "deposit_notice_amount_check" CHECK ("deposit_notice"."amount_vnd" > 0),
	CONSTRAINT "deposit_notice_status_check" CHECK ("deposit_notice"."status" IN ('open', 'handled'))
);
--> statement-breakpoint
CREATE TABLE "folio" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"primary_reservation_id" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"bill_no" text,
	"settled_at" timestamp with time zone,
	"settled_by" uuid,
	"closed_at" timestamp with time zone,
	"post_checkout_window_until" timestamp with time zone,
	"debt_due_date" date,
	"debt_approved_by" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "folio_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "folio_primary_reservation_key" UNIQUE("primary_reservation_id"),
	CONSTRAINT "folio_bill_no_key" UNIQUE("property_id","bill_no"),
	CONSTRAINT "folio_status_check" CHECK ("folio"."status" IN ('open', 'settled', 'closed')),
	CONSTRAINT "folio_bill_no_check" CHECK ("folio"."status" = 'open' OR "folio"."bill_no" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "folio_line" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"folio_id" uuid NOT NULL,
	"reservation_id" uuid,
	"category" text NOT NULL,
	"adjusts_group" text,
	"revenue_group" text NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price_vnd" bigint NOT NULL,
	"amount_vnd" bigint NOT NULL,
	"vat_rate_pct" numeric(5, 2),
	"service_date" date,
	"period_from" date,
	"period_to" date,
	"stay_night_id" uuid,
	"line_state" text DEFAULT 'posted' NOT NULL,
	"related_line_id" uuid,
	"reversal_of_id" uuid,
	"approval_request_id" uuid,
	"source" text NOT NULL,
	"posted_at" timestamp with time zone NOT NULL,
	"posted_by" uuid,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "folio_line_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "folio_line_category_check" CHECK ("folio_line"."category" IN ('room', 'early_checkin', 'late_checkout', 'extra_person', 'minibar', 'fnb', 'laundry', 'cleaning', 'service_fee', 'utilities', 'penalty', 'damage', 'cancellation_fee', 'no_show_fee', 'early_departure_fee', 'deposit_forfeit', 'discount', 'foc', 'adjustment')),
	CONSTRAINT "folio_line_revenue_group_check" CHECK ("folio_line"."revenue_group" IN ('room', 'other', 'non_revenue')),
	CONSTRAINT "folio_line_adjusts_group_check" CHECK (("folio_line"."category" = 'adjustment') = ("folio_line"."adjusts_group" IS NOT NULL) AND ("folio_line"."adjusts_group" IS NULL OR "folio_line"."adjusts_group" IN ('room', 'other', 'non_revenue'))),
	CONSTRAINT "folio_line_state_check" CHECK ("folio_line"."line_state" IN ('posted', 'pending_approval', 'rejected')),
	CONSTRAINT "folio_line_source_check" CHECK ("folio_line"."source" IN ('manual', 'system', 'minibar_check', 'extension', 'checkin', 'checkout', 'guest_app')),
	CONSTRAINT "folio_line_sign_check" CHECK ("folio_line"."reversal_of_id" IS NOT NULL OR ("folio_line"."category" IN ('discount', 'foc') AND "folio_line"."amount_vnd" <= 0) OR ("folio_line"."category" NOT IN ('discount', 'foc') AND "folio_line"."amount_vnd" >= 0) OR "folio_line"."category" = 'adjustment'),
	CONSTRAINT "folio_line_quantity_check" CHECK ("folio_line"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"code" text NOT NULL,
	"folio_id" uuid NOT NULL,
	"reservation_id" uuid,
	"billing_period_id" uuid,
	"type" text NOT NULL,
	"method" text NOT NULL,
	"method_detail" text,
	"reconciliation" text NOT NULL,
	"reconciled_at" timestamp with time zone,
	"reconciled_by" uuid,
	"reconciliation_note" text,
	"shift_id" uuid,
	"reservation_group_id" uuid,
	"amount_vnd" bigint NOT NULL,
	"status" text NOT NULL,
	"provider" text,
	"provider_txn_id" text,
	"payer_name" text,
	"card_brand" text,
	"card_last4" text,
	"auth_code" text,
	"expires_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"recorded_by" uuid,
	"reversal_of_id" uuid,
	"reversal_reason" text,
	"approval_request_id" uuid,
	"note" text,
	"attachment_id" uuid,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "payment_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "payment_property_code_key" UNIQUE("property_id","code"),
	CONSTRAINT "payment_type_check" CHECK ("payment"."type" IN ('charge', 'deposit', 'security_deposit', 'refund', 'deposit_deduction')),
	CONSTRAINT "payment_method_check" CHECK ("payment"."method" IN ('vietqr', 'bank_transfer', 'cash', 'card_pos', 'vnpay', 'momo', 'ota_collect')),
	CONSTRAINT "payment_method_detail_check" CHECK ("payment"."method_detail" IS NULL OR "payment"."method_detail" IN ('qr', 'atm', 'intl_card', 'wallet')),
	CONSTRAINT "payment_reconciliation_check" CHECK ("payment"."reconciliation" IN ('not_required', 'pending', 'reconciled', 'disputed')),
	CONSTRAINT "payment_status_check" CHECK ("payment"."status" IN ('pending', 'succeeded', 'failed', 'expired', 'reversed')),
	CONSTRAINT "payment_amount_sign_check" CHECK (("payment"."type" = 'refund' AND "payment"."amount_vnd" < 0) OR ("payment"."type" <> 'refund' AND "payment"."amount_vnd" > 0) OR "payment"."reversal_of_id" IS NOT NULL),
	CONSTRAINT "payment_card_last4_check" CHECK ("payment"."card_last4" IS NULL OR "payment"."card_last4" ~ '^[0-9]{4}$'),
	CONSTRAINT "payment_auth_code_check" CHECK ("payment"."auth_code" IS NULL OR "payment"."auth_code" ~ '^[A-Za-z0-9]{1,12}$')
);
--> statement-breakpoint
CREATE TABLE "lead" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"need" text,
	"estimated_value_vnd" bigint,
	"source" text,
	"status" text NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"lost_reason_code" text,
	"lost_note" text,
	"last_interaction_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "lead_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "lead_status_check" CHECK ("lead"."status" IN ('new', 'quoted', 'holding', 'won', 'lost')),
	CONSTRAINT "lead_lost_check" CHECK ("lead"."status" <> 'lost' OR "lead"."lost_reason_code" IS NOT NULL),
	CONSTRAINT "lead_estimated_value_check" CHECK ("lead"."estimated_value_vnd" IS NULL OR "lead"."estimated_value_vnd" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quote" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"lead_id" uuid,
	"guest_id" uuid NOT NULL,
	"room_id" uuid,
	"room_group_id" uuid,
	"channel_id" uuid NOT NULL,
	"closer_user_id" uuid,
	"arrival_date" date NOT NULL,
	"nights" smallint,
	"term_months" smallint,
	"adults" smallint NOT NULL,
	"children_bands" jsonb NOT NULL,
	"guest_category" text,
	"cleaning_per_week" smallint,
	"pricing_snapshot" jsonb NOT NULL,
	"total_vnd" bigint NOT NULL,
	"deposit_vnd" bigint NOT NULL,
	"commission_vnd" bigint,
	"ottimo_remaining_vnd" bigint,
	"started_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"converted_reservation_id" uuid,
	"withdrawn_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "quote_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "quote_property_code_key" UNIQUE("property_id","code"),
	CONSTRAINT "quote_type_check" CHECK ("quote"."type" IN ('short', 'long')),
	CONSTRAINT "quote_status_check" CHECK ("quote"."status" IN ('active', 'expired', 'converted', 'withdrawn')),
	CONSTRAINT "quote_short_check" CHECK ("quote"."type" <> 'short' OR ("quote"."nights" IS NOT NULL AND "quote"."nights" >= 1)),
	CONSTRAINT "quote_converted_check" CHECK ("quote"."status" <> 'converted' OR "quote"."converted_reservation_id" IS NOT NULL),
	CONSTRAINT "quote_amount_check" CHECK ("quote"."total_vnd" >= 0 AND "quote"."deposit_vnd" >= 0 AND ("quote"."commission_vnd" IS NULL OR "quote"."commission_vnd" >= 0)),
	CONSTRAINT "quote_guest_category_check" CHECK ("quote"."guest_category" IS NULL OR "quote"."guest_category" IN ('vn', 'foreigner'))
);
--> statement-breakpoint
ALTER TABLE "room_group" ADD COLUMN "service_fee_monthly_vnd" bigint;--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_commission_rate" ADD CONSTRAINT "channel_commission_rate_channel_fk" FOREIGN KEY ("property_id","channel_id") REFERENCES "public"."channel"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_fee" ADD CONSTRAINT "channel_fee_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_fee" ADD CONSTRAINT "channel_fee_channel_fk" FOREIGN KEY ("property_id","channel_id") REFERENCES "public"."channel"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission" ADD CONSTRAINT "commission_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission" ADD CONSTRAINT "commission_payee_fk" FOREIGN KEY ("organization_id","payee_user_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_notice" ADD CONSTRAINT "deposit_notice_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio" ADD CONSTRAINT "folio_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_line" ADD CONSTRAINT "folio_line_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_line" ADD CONSTRAINT "folio_line_folio_fk" FOREIGN KEY ("property_id","folio_id") REFERENCES "public"."folio"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_line" ADD CONSTRAINT "folio_line_related_fk" FOREIGN KEY ("property_id","related_line_id") REFERENCES "public"."folio_line"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_line" ADD CONSTRAINT "folio_line_reversal_fk" FOREIGN KEY ("property_id","reversal_of_id") REFERENCES "public"."folio_line"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_folio_fk" FOREIGN KEY ("property_id","folio_id") REFERENCES "public"."folio"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_reversal_fk" FOREIGN KEY ("property_id","reversal_of_id") REFERENCES "public"."payment"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_recorded_by_fk" FOREIGN KEY ("organization_id","recorded_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_guest_fk" FOREIGN KEY ("organization_id","guest_id") REFERENCES "public"."guest"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_owner_fk" FOREIGN KEY ("organization_id","owner_user_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_guest_fk" FOREIGN KEY ("organization_id","guest_id") REFERENCES "public"."guest"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_lead_fk" FOREIGN KEY ("property_id","lead_id") REFERENCES "public"."lead"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_room_fk" FOREIGN KEY ("property_id","room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_room_group_fk" FOREIGN KEY ("property_id","room_group_id") REFERENCES "public"."room_group"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_channel_fk" FOREIGN KEY ("property_id","channel_id") REFERENCES "public"."channel"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_closer_fk" FOREIGN KEY ("organization_id","closer_user_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "commission_live_key" ON "commission" USING btree ("reservation_id","payee_user_id") WHERE "commission"."status" <> 'void' AND "commission"."reservation_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "commission_payee_idx" ON "commission" USING btree ("property_id","payee_user_id","created_at");--> statement-breakpoint
CREATE INDEX "deposit_notice_reservation_idx" ON "deposit_notice" USING btree ("property_id","reservation_id","created_at");--> statement-breakpoint
CREATE INDEX "folio_line_folio_idx" ON "folio_line" USING btree ("property_id","folio_id","posted_at");--> statement-breakpoint
CREATE INDEX "folio_line_night_idx" ON "folio_line" USING btree ("stay_night_id") WHERE "folio_line"."stay_night_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_provider_txn_key" ON "payment" USING btree ("provider","provider_txn_id") WHERE "payment"."provider_txn_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_one_pending_qr_per_folio" ON "payment" USING btree ("folio_id") WHERE "payment"."method" = 'vietqr' AND "payment"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "payment_folio_idx" ON "payment" USING btree ("property_id","folio_id","received_at");--> statement-breakpoint
CREATE INDEX "payment_reconcile_idx" ON "payment" USING btree ("property_id","reconciliation","received_at") WHERE "payment"."reconciliation" = 'pending';--> statement-breakpoint
CREATE INDEX "lead_owner_idx" ON "lead" USING btree ("property_id","owner_user_id","id");--> statement-breakpoint
CREATE INDEX "quote_list_idx" ON "quote" USING btree ("property_id","status","id");--> statement-breakpoint
CREATE INDEX "quote_owner_idx" ON "quote" USING btree ("property_id","created_by","id");--> statement-breakpoint
CREATE INDEX "quote_closer_idx" ON "quote" USING btree ("property_id","closer_user_id","id");--> statement-breakpoint
ALTER TABLE "room_group" ADD CONSTRAINT "room_group_service_fee_check" CHECK ("room_group"."service_fee_monthly_vnd" IS NULL OR "room_group"."service_fee_monthly_vnd" >= 0);