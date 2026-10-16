-- 0004 (drizzle-kit generate, BE-B Sprint 1): room catalogue (erd 4.1 room_group, room, room_list_price –
-- US-004, BR-101/110) and guest profiles (erd 4.4 guest – US-071…073). RLS/grants/trigram index: 0005.
CREATE TABLE "guest" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"full_name" text NOT NULL,
	"name_search" text NOT NULL,
	"phone_e164" text,
	"email_norm" text,
	"messaging_handles" jsonb,
	"date_of_birth" date,
	"gender" text,
	"nationality_code" text,
	"is_foreigner" boolean DEFAULT false NOT NULL,
	"preferred_locale" text,
	"preferred_contact" text,
	"company_name" text,
	"tax_code" text,
	"tags" text[],
	"service_notes" text[],
	"free_note" text,
	"id_doc_last4" text,
	"id_doc_hmac" text,
	"crm_consent" text DEFAULT 'not_asked' NOT NULL,
	"merged_into_id" uuid,
	"anonymized_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "guest_org_id_key" UNIQUE("organization_id","id"),
	CONSTRAINT "guest_org_code_key" UNIQUE("organization_id","code"),
	CONSTRAINT "guest_gender_check" CHECK ("guest"."gender" IS NULL OR "guest"."gender" IN ('male', 'female', 'other')),
	CONSTRAINT "guest_locale_check" CHECK ("guest"."preferred_locale" IS NULL OR "guest"."preferred_locale" IN ('vi', 'en', 'ru')),
	CONSTRAINT "guest_contact_check" CHECK ("guest"."preferred_contact" IS NULL OR "guest"."preferred_contact" IN ('phone', 'zalo', 'whatsapp', 'kakaotalk', 'email')),
	CONSTRAINT "guest_crm_consent_check" CHECK ("guest"."crm_consent" IN ('not_asked', 'granted', 'refused')),
	CONSTRAINT "guest_nationality_check" CHECK ("guest"."nationality_code" IS NULL OR "guest"."nationality_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "guest_phone_check" CHECK ("guest"."phone_e164" IS NULL OR "guest"."phone_e164" ~ '^[1-9][0-9]{7,14}$')
);
--> statement-breakpoint
CREATE TABLE "room" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"room_group_id" uuid NOT NULL,
	"room_no" text NOT NULL,
	"name" text,
	"floor" integer,
	"area_m2" integer,
	"bed_setup" text,
	"bed_count" smallint,
	"base_occupancy" smallint NOT NULL,
	"max_occupancy" smallint NOT NULL,
	"public_slug" text NOT NULL,
	"is_sellable" boolean DEFAULT true NOT NULL,
	"active_from" date NOT NULL,
	"active_to" date,
	"lock_ref" text,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "room_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "room_property_room_no_key" UNIQUE("property_id","room_no"),
	CONSTRAINT "room_property_public_slug_key" UNIQUE("property_id","public_slug"),
	CONSTRAINT "room_base_occupancy_check" CHECK ("room"."base_occupancy" BETWEEN 1 AND 10),
	CONSTRAINT "room_max_occupancy_check" CHECK ("room"."max_occupancy" >= "room"."base_occupancy" AND "room"."max_occupancy" <= 11),
	CONSTRAINT "room_room_no_check" CHECK ("room"."room_no" ~ '^[0-9A-Z]{1,6}$'),
	CONSTRAINT "room_public_slug_check" CHECK (length("room"."public_slug") >= 8),
	CONSTRAINT "room_active_range_check" CHECK ("room"."active_to" IS NULL OR "room"."active_to" >= "room"."active_from")
);
--> statement-breakpoint
CREATE TABLE "room_group" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"base_occupancy" smallint NOT NULL,
	"max_occupancy" smallint NOT NULL,
	"ota_room_ref" text,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "room_group_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "room_group_property_code_key" UNIQUE("property_id","code"),
	CONSTRAINT "room_group_base_occupancy_check" CHECK ("room_group"."base_occupancy" BETWEEN 1 AND 10),
	CONSTRAINT "room_group_max_occupancy_check" CHECK ("room_group"."max_occupancy" >= "room_group"."base_occupancy")
);
--> statement-breakpoint
CREATE TABLE "room_list_price" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"monthly_list_price_vnd" bigint NOT NULL,
	"nightly_list_price_vnd" bigint NOT NULL,
	"changed_by" uuid,
	"reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "room_list_price_room_from_key" UNIQUE("room_id","effective_from"),
	CONSTRAINT "room_list_price_monthly_check" CHECK ("room_list_price"."monthly_list_price_vnd" > 0),
	CONSTRAINT "room_list_price_nightly_check" CHECK ("room_list_price"."nightly_list_price_vnd" > 0)
);
--> statement-breakpoint
ALTER TABLE "guest" ADD CONSTRAINT "guest_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_room_group_fk" FOREIGN KEY ("property_id","room_group_id") REFERENCES "public"."room_group"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_group" ADD CONSTRAINT "room_group_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_list_price" ADD CONSTRAINT "room_list_price_room_fk" FOREIGN KEY ("property_id","room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "guest_phone_live_uk" ON "guest" USING btree ("organization_id","phone_e164") WHERE "guest"."merged_into_id" IS NULL AND "guest"."anonymized_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "guest_email_live_uk" ON "guest" USING btree ("organization_id","email_norm") WHERE "guest"."merged_into_id" IS NULL AND "guest"."anonymized_at" IS NULL;--> statement-breakpoint
CREATE INDEX "guest_created_by_idx" ON "guest" USING btree ("organization_id","created_by");--> statement-breakpoint
CREATE INDEX "guest_dob_idx" ON "guest" USING btree ("organization_id","date_of_birth");--> statement-breakpoint
CREATE INDEX "room_group_idx" ON "room" USING btree ("property_id","room_group_id");