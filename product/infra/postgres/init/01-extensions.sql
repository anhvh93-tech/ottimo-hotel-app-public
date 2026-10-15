-- Runs once when the dev volume is created (docker-entrypoint-initdb.d).
-- Extensions required by ADR-003/ADR-009. Real schema comes from Drizzle migrations (R2).
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Separate database for integration tests run from the host (DATABASE_URL in tests).
CREATE DATABASE ottimo_test;
\connect ottimo_test
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
