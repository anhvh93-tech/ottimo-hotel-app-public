#!/usr/bin/env bash
# Database roles – 4-role model of erd.md 2.1 (BUG-R1-SEC-06, SR-AZ-06, FB-R1-SEC-OPS-01, FB-R1-BE-ARC-03).
#   ottimo_owner     NOLOGIN, no password. Owns the database, schema public, SECURITY DEFINER functions
#                    (erd 2.4) and schema pgboss. Nobody logs in as it.
#   ottimo_migrator  LOGIN, member of ottimo_owner with NOINHERIT: migrations must `SET ROLE ottimo_owner`
#                    first (leaves a trace in the PG log). Used only by MIGRATION_DATABASE_URL.
#   ottimo_app       api + worker + tests (DATABASE_URL). NOSUPERUSER NOBYPASSRLS, owns nothing;
#                    table privileges are GRANTed per table by migrations (append-only tables: no UPDATE/DELETE).
#   ottimo_readonly  backup / incident lookup only, BYPASSRLS, SELECT. Created NOLOGIN here; login is enabled
#                    temporarily through the runbook (SR-OPS-04), never in application config.
# The POSTGRES_USER superuser is for administration only and is never used by the application.
#
# Runs automatically from docker-entrypoint-initdb.d on a NEW dev volume (after 01-extensions.sql).
# CI runs it directly against the service container (PGHOST/PGPASSWORD set, OTTIMO_DATABASES=ottimo_test).
# Idempotent: re-running it on an existing volume converts the old 3-role setup (ottimo_owner LOGIN)
# to this model – see docs/dev-setup.md "Lỗi thường gặp".
set -Eeuo pipefail

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${OTTIMO_MIGRATOR_DB_PASSWORD:?set OTTIMO_MIGRATOR_DB_PASSWORD in product/.env}"
: "${OTTIMO_APP_DB_PASSWORD:?set OTTIMO_APP_DB_PASSWORD in product/.env}"
databases="${OTTIMO_DATABASES:-${POSTGRES_DB:-ottimo} ottimo_test}"
first_db="${databases%% *}"

psql_admin() {
  psql -v ON_ERROR_STOP=1 --no-psqlrc --username "$POSTGRES_USER" "$@"
}

# Cluster-wide roles. Create if missing, then ALTER to the exact attributes (so re-runs converge).
# Passwords are passed as psql variables, never echoed.
psql_admin --dbname "$first_db" \
  -v migrator_pw="$OTTIMO_MIGRATOR_DB_PASSWORD" -v app_pw="$OTTIMO_APP_DB_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE %I NOLOGIN', r)
  FROM unnest(ARRAY['ottimo_owner', 'ottimo_migrator', 'ottimo_app', 'ottimo_readonly']) AS r
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r)
\gexec

ALTER ROLE ottimo_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
  PASSWORD NULL;
ALTER ROLE ottimo_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT
  PASSWORD :'migrator_pw';
ALTER ROLE ottimo_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT
  PASSWORD :'app_pw';
ALTER ROLE ottimo_readonly NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION BYPASSRLS
  PASSWORD NULL;

-- FB-R2-SEC-BE-23 (OPS part): the runtime role never keeps a connection stuck in an open transaction
-- (row locks held forever block every booking on that unit) and no single statement runs unbounded.
-- Role-level defaults, applied at login (new connections only – restart api/worker after a change).
-- The api's transactions still SET LOCAL their own lock_timeout 5 s / statement_timeout 15 s (job 10 s);
-- a long report must SET LOCAL a larger statement_timeout itself. ottimo_migrator is NOT limited
-- (migrations may legitimately run long; role settings follow the login role, not SET ROLE).
ALTER ROLE ottimo_app SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE ottimo_app SET statement_timeout = '15s';

-- migrator may only act as owner through SET ROLE (PG 16+: INHERIT FALSE, SET TRUE).
GRANT ottimo_owner TO ottimo_migrator WITH INHERIT FALSE, SET TRUE;
-- ottimo_app / ottimo_readonly must never be members of ottimo_owner.
REVOKE ottimo_owner FROM ottimo_app;
REVOKE ottimo_owner FROM ottimo_readonly;
SQL

for db in $databases; do
  psql_admin --dbname "$db" -v db="$db" <<'SQL'
-- ottimo_owner becomes database owner, so it owns schema public (pg_database_owner, PG 15+)
-- and can create the trusted extensions (btree_gist, pgcrypto, citext) in migrations.
ALTER DATABASE :"db" OWNER TO ottimo_owner;
REVOKE ALL ON DATABASE :"db" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"db" TO ottimo_migrator;
GRANT CONNECT, TEMPORARY ON DATABASE :"db" TO ottimo_app;
GRANT CONNECT ON DATABASE :"db" TO ottimo_readonly;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO ottimo_app, ottimo_readonly;
-- Read access for backup/incident role on everything the owner creates later.
ALTER DEFAULT PRIVILEGES FOR ROLE ottimo_owner IN SCHEMA public
  GRANT SELECT ON TABLES TO ottimo_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE ottimo_owner IN SCHEMA public
  GRANT SELECT ON SEQUENCES TO ottimo_readonly;
-- No default DML grant for ottimo_app on purpose: each migration GRANTs per table (SR-AUD-02).
SQL
done

echo "02-roles.sh: roles ottimo_owner (NOLOGIN), ottimo_migrator, ottimo_app, ottimo_readonly ready on: $databases"
