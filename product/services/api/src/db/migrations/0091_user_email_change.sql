-- 0091 (BE-A, R4 v1.0.3 – BUG-R3-032, SEC-on-B2-readiness 1.5, OpenAPI 0.3.10, erd 4.16; ARC v1.0.3-contract-email 5).
-- Journal idx 67, `when` = 0090 + 2000. Staff security e-mail: app_user.email exists since 0000 (citext, NULL) –
-- only a length/shape guard here – and `user_email_change`, which keeps the OLD address only until the
-- `email_changed` notice to it is sent (the outbox never holds an address – jobs/email-dispatch.ts).
-- Rollback: additive only; v1.0.2 neither reads nor writes the new table → rolling the image back needs no DB rollback.
-- Pre-deploy count (OPS, READ ONLY, prints a number; must be 0 – any other value fails the CHECK below):
--   SELECT count(*) FROM app_user WHERE email IS NOT NULL AND btrim(email::text) <> ''
--     AND (char_length(email::text) NOT BETWEEN 3 AND 254 OR position('@' in email::text) <= 1);
CREATE TABLE "user_email_change" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"old_email" "citext",
	"changed_by" uuid NOT NULL,
	"via" text NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"old_notified_at" timestamp with time zone,
	CONSTRAINT "user_email_change_via_check" CHECK ("user_email_change"."via" IN ('self', 'owner'))
);
--> statement-breakpoint
ALTER TABLE "user_email_change" ADD CONSTRAINT "user_email_change_user_fk" FOREIGN KEY ("organization_id","user_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_change" ADD CONSTRAINT "user_email_change_changed_by_fk" FOREIGN KEY ("organization_id","changed_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_email_change_pending_idx" ON "user_email_change" USING btree ("changed_at") WHERE "user_email_change"."old_email" IS NOT NULL;--> statement-breakpoint
-- OPS PR-2 Q3: an empty / blank address means "none" – NULL it before the CHECK so it cannot fail the deploy.
-- FORCE RLS binds the table owner too and no tenant is set while migrating (pattern 0042/0043): RLS off for this
-- one UPDATE, back on (ENABLE + FORCE) right after, in the migrator's single transaction.
ALTER TABLE app_user NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE app_user DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
UPDATE app_user SET email = NULL WHERE email IS NOT NULL AND btrim(email::text) = '';
--> statement-breakpoint
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE app_user FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_email_check" CHECK ("app_user"."email" IS NULL OR (char_length("app_user"."email"::text) BETWEEN 3 AND 254 AND position('@' in "app_user"."email"::text) > 1));
--> statement-breakpoint
-- ───────────── RLS: user_email_change is organisation-level like app_user (pattern mfa_login_challenge, 0079) ─────────────
ALTER TABLE user_email_change ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE user_email_change FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON user_email_change
  USING (organization_id = app_current_org()) WITH CHECK (organization_id = app_current_org());
--> statement-breakpoint
-- No DELETE: the purge is `SET old_email = NULL` (dispatcher finish, daily email_change.purge after 7 days).
GRANT SELECT, INSERT, UPDATE ON user_email_change TO ottimo_app;
