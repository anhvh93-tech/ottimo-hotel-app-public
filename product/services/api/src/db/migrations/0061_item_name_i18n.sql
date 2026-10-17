-- 0061 (hand-written – BE-D, R2 Sprint 4; number from ORC 17/10, US-066 moved from BE-B): the minibar catalogue
-- keeps the names in every language the owner types (OpenAPI ItemInput.name {vi, en, ru}; erd 4.10
-- `name_i18n`). `name` stays the Vietnamese name used by the folio line / bill label (BR-009) – no backfill
-- needed: rows without `name_i18n` fall back to `name`. Runs as ottimo_owner inside the migrator's transaction.
ALTER TABLE item ADD COLUMN name_i18n jsonb;
--> statement-breakpoint
ALTER TABLE item ADD CONSTRAINT item_name_i18n_check
  CHECK (name_i18n IS NULL OR jsonb_typeof(name_i18n) = 'object');
--> statement-breakpoint
-- FB-R2-ARC-BE-S3-32 (0042) keeps UPDATE on item column-scoped: add the new column only (code/kind/property
-- still never move – updateItem refuses a code change with 422 NOT_EDITABLE).
GRANT UPDATE (name_i18n) ON item TO ottimo_app;
