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
#                    R4 v1.0.4 (SEC FB-R4-SEC-OPS-PR32-S1, ARC FB-R4-ARC-OPS-PR30-09): every database check of
#                    infra/server/bin/ops-check.sh and the runbook block SQLRO run AS this role – the admin session
#                    takes it at connect (PGOPTIONS "-c role=ottimo_readonly", still NOLOGIN) inside a READ ONLY
#                    transaction. + SELECT on drizzle.__drizzle_migrations (migration count of the runbook).
#   ottimo_requeue   R4 v1.0.4 (SEC PR32-S1): the one write of infra/server/bin/requeue-email-changed.sh. NOLOGIN,
#                    BYPASSRLS (the requeue spans the organisation, no tenant is set), SELECT + UPDATE of exactly
#                    (status, attempts, next_attempt_at, last_error) ON outbox_message – nothing else. Taken the same way
#                    (PGOPTIONS "-c role=ottimo_requeue").
#                    Both GRANTs on existing objects are applied here, not in a migration: this script runs again
#                    before `migrate` on EVERY deploy (staging/production deploy.sh step `roles`, dev `db-roles`), so a
#                    running database gets them on the next deploy (ARC plan-v1.0.4 2.2: migration 0097 only if a
#                    GRANT cannot be placed here – it can; 0096 is never reused). On a brand-new volume the tables do
#                    not exist yet at init: the GRANT follows at the next start, and both tools refuse cleanly before.
# The POSTGRES_USER superuser is for administration only and is never used by the application.
#
# Runs automatically from docker-entrypoint-initdb.d on a NEW dev volume (after 01-extensions.sql).
# CI runs it directly against the service container (PGHOST/PGPASSWORD set, OTTIMO_DATABASES=ottimo_test).
# Idempotent: re-running it on an existing volume converts the old 3-role setup (ottimo_owner LOGIN)
# to this model – see docs/dev-setup.md "Lỗi thường gặp".
# Re-applied on EVERY start, not only on a new volume (SEC s3-checklist H3): dev compose runs it in the
# one-shot `db-roles` service before `migrate`; staging/production run it in infra/staging/bin/deploy.sh
# (`docker compose exec postgres …`) before `migrate`. So a role change (e.g. the ottimo_app limits below)
# reaches a database that already exists.
# Passwords may come from files (Docker secrets, staging/production): OTTIMO_MIGRATOR_DB_PASSWORD_FILE,
# OTTIMO_APP_DB_PASSWORD_FILE – same convention as the postgres image's POSTGRES_PASSWORD_FILE.
set -Eeuo pipefail

# Named ottimo_* so it never shadows file_env of the postgres entrypoint.
ottimo_file_env() {
  local var="$1" file_var="${1}_FILE"
  if [ -n "${!var:-}" ] && [ -n "${!file_var:-}" ]; then
    echo "02-roles.sh: both $var and $file_var are set – use only one" >&2
    exit 1
  fi
  if [ -n "${!file_var:-}" ]; then
    export "$var"="$(<"${!file_var}")"
  fi
}
ottimo_file_env OTTIMO_MIGRATOR_DB_PASSWORD
ottimo_file_env OTTIMO_APP_DB_PASSWORD

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
  FROM unnest(ARRAY['ottimo_owner', 'ottimo_migrator', 'ottimo_app', 'ottimo_readonly', 'ottimo_requeue']) AS r
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
ALTER ROLE ottimo_requeue NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION BYPASSRLS
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
REVOKE ottimo_owner FROM ottimo_requeue;
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
GRANT USAGE ON SCHEMA public TO ottimo_app, ottimo_readonly, ottimo_requeue;
-- Read access for backup/incident role on everything the owner creates later.
ALTER DEFAULT PRIVILEGES FOR ROLE ottimo_owner IN SCHEMA public
  GRANT SELECT ON TABLES TO ottimo_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE ottimo_owner IN SCHEMA public
  GRANT SELECT ON SEQUENCES TO ottimo_readonly;
-- No default DML grant for ottimo_app on purpose: each migration GRANTs per table (SR-AUD-02).
-- R4 v1.0.4 (SEC PR32-S1): objects that exist already (they do on every running database; on a new volume not yet –
-- next start). to_regclass needs no privilege; \gexec runs only the GRANTs whose object is there.
SELECT 'GRANT USAGE ON SCHEMA drizzle TO ottimo_readonly'
 WHERE to_regnamespace('drizzle') IS NOT NULL
UNION ALL
SELECT 'GRANT SELECT ON drizzle.__drizzle_migrations TO ottimo_readonly'
 WHERE to_regclass('drizzle.__drizzle_migrations') IS NOT NULL
UNION ALL
SELECT 'GRANT SELECT, UPDATE (status, attempts, next_attempt_at, last_error) ON public.outbox_message TO ottimo_requeue'
 WHERE to_regclass('public.outbox_message') IS NOT NULL
\gexec
SQL
done

# SEC PR32-S1 smoke: ottimo_requeue holds exactly table-level SELECT and column-level UPDATE on outbox_message – no
# table-level UPDATE/INSERT/DELETE (read back, not assumed; only when the table exists).
requeue_priv=$(psql_admin --dbname "$first_db" -tAc \
  "SELECT CASE WHEN to_regclass('public.outbox_message') IS NULL THEN 'absent' ELSE
     concat_ws(',', has_table_privilege('ottimo_requeue', 'public.outbox_message', 'SELECT'),
       has_table_privilege('ottimo_requeue', 'public.outbox_message', 'UPDATE'),
       has_table_privilege('ottimo_requeue', 'public.outbox_message', 'INSERT'),
       has_table_privilege('ottimo_requeue', 'public.outbox_message', 'DELETE'),
       has_column_privilege('ottimo_requeue', 'public.outbox_message', 'status', 'UPDATE'),
       has_column_privilege('ottimo_requeue', 'public.outbox_message', 'payload', 'UPDATE')) END")
case "$requeue_priv" in
  absent | t,f,f,f,t,f) ;;
  *) echo "02-roles.sh: ottimo_requeue privileges on outbox_message are not SELECT + UPDATE(4 columns) ($requeue_priv)" >&2; exit 1 ;;
esac

# H3 smoke: the runtime limits must be in force (read back, not assumed).
rolconfig=$(psql_admin --dbname "$first_db" -tAc \
  "SELECT array_to_string(rolconfig, ',') FROM pg_roles WHERE rolname = 'ottimo_app'")
case ",$rolconfig," in
  *,idle_in_transaction_session_timeout=30s,*) ;;
  *) echo "02-roles.sh: ottimo_app idle_in_transaction_session_timeout missing (rolconfig=$rolconfig)" >&2; exit 1 ;;
esac
case ",$rolconfig," in
  *,statement_timeout=15s,*) ;;
  *) echo "02-roles.sh: ottimo_app statement_timeout missing (rolconfig=$rolconfig)" >&2; exit 1 ;;
esac

echo "02-roles.sh: roles ottimo_owner (NOLOGIN), ottimo_migrator, ottimo_app, ottimo_readonly, ottimo_requeue ready on: $databases (ottimo_app: $rolconfig); ottimo_requeue on outbox_message: ${requeue_priv}"
