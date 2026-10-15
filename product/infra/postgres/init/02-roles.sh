#!/usr/bin/env bash
# Database roles (erd.md 2.1, SR-AZ-06, FB-R1-SEC-OPS-01, FB-R1-BE-ARC-03).
#   ottimo_owner     owns the database/schema, runs migrations (MIGRATION_DATABASE_URL). Not superuser.
#   ottimo_app       api + worker + tests (DATABASE_URL). NOSUPERUSER NOBYPASSRLS, owns nothing;
#                    table privileges are GRANTed per table by migrations (append-only tables: no UPDATE/DELETE).
#   ottimo_readonly  backup / incident lookup only, BYPASSRLS, created NOLOGIN. Login is enabled
#                    temporarily through the runbook (SR-OPS-04), never in application config.
# The POSTGRES_USER superuser is for administration only and is never used by the application.
#
# Runs automatically from docker-entrypoint-initdb.d on a NEW dev volume (after 01-extensions.sql).
# CI runs it directly against the service container (PGHOST/PGPASSWORD set, OTTIMO_DATABASES=ottimo_test).
set -Eeuo pipefail

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${OTTIMO_OWNER_DB_PASSWORD:?set OTTIMO_OWNER_DB_PASSWORD in product/.env}"
: "${OTTIMO_APP_DB_PASSWORD:?set OTTIMO_APP_DB_PASSWORD in product/.env}"
databases="${OTTIMO_DATABASES:-${POSTGRES_DB:-ottimo} ottimo_test}"
first_db="${databases%% *}"

psql_admin() {
  psql -v ON_ERROR_STOP=1 --no-psqlrc --username "$POSTGRES_USER" "$@"
}

# Cluster-wide roles (created once). Passwords are passed as psql variables, never echoed.
psql_admin --dbname "$first_db" \
  -v owner_pw="$OTTIMO_OWNER_DB_PASSWORD" -v app_pw="$OTTIMO_APP_DB_PASSWORD" <<'SQL'
CREATE ROLE ottimo_owner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
  PASSWORD :'owner_pw';
CREATE ROLE ottimo_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT
  PASSWORD :'app_pw';
CREATE ROLE ottimo_readonly NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION BYPASSRLS;
SQL

for db in $databases; do
  psql_admin --dbname "$db" -v db="$db" <<'SQL'
-- ottimo_owner becomes database owner, so it owns schema public (pg_database_owner, PG 15+)
-- and can create the trusted extensions (btree_gist, pgcrypto, citext) in migrations.
ALTER DATABASE :"db" OWNER TO ottimo_owner;
REVOKE ALL ON DATABASE :"db" FROM PUBLIC;
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

echo "02-roles.sh: roles ottimo_owner, ottimo_app, ottimo_readonly ready on: $databases"
