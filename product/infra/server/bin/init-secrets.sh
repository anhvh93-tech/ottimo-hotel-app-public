#!/usr/bin/env bash
# Create the secret files of one server (staging or production) – run ONCE as root, before the first deploy.
#   sudo /opt/ottimo/infra/server/bin/init-secrets.sh
# Idempotent: an existing file is never overwritten (re-running only fills what is missing). Every value is random
# and generated here; nothing is typed, printed or sent anywhere (hosting-plan 8.1, SR-KEY-03/10, FB-R1-SEC-OPS-10).
#
# Layout (SR-KEY-10): $OTTIMO_HOME/secrets  root:<deploy group> 0710 – the deploy user may stat (docker compose
# needs the paths) but not list or read; files 0400 owned by the uid of the container that reads them:
#   uid 1000 (node: api, worker, migrate, seed)  database_url, migration_database_url, session_secret,
#                                                data_kek_current, id_hash_key, log_ip_hmac_key,
#                                                guest_code_signing_key, qa_seed_password
#   uid 70   (postgres)                          postgres_password, ottimo_app_db_password,
#                                                ottimo_migrator_db_password
# Docker (non-swarm) bind-mounts each file read-only at /run/secrets/<name>; the app reads it through X_FILE.
# Host users other than root cannot reach the files (the directory is not traversable for them) – keep it that
# way: no backup job and no snapshot may include this directory (SR-KEY-10, SR-BAK-03).
set -Eeuo pipefail

OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
DEPLOY_GROUP="${DEPLOY_GROUP:-ottimo}"
APP_UID="${APP_UID:-1000}"   # `node` in the api image (Dockerfile.api)
PG_UID="${PG_UID:-70}"       # `postgres` in postgres:17-alpine
dir="$OTTIMO_HOME/secrets"

[ "$(id -u)" -eq 0 ] || { echo "run as root (sudo)" >&2; exit 2; }
command -v openssl >/dev/null || { echo "openssl is required" >&2; exit 2; }
getent group "$DEPLOY_GROUP" >/dev/null || { echo "group $DEPLOY_GROUP missing – run bootstrap-vps.sh first" >&2; exit 2; }

umask 077
install -d -o root -g "$DEPLOY_GROUP" -m 0710 "$dir"

created=()
# put <name> <owner uid> <value>  – writes only when the file does not exist yet
put() {
  local name="$1" owner="$2" value="$3" file="$dir/$1"
  if [ -e "$file" ]; then return 0; fi
  printf '%s' "$value" > "$file.tmp"
  chown "$owner:$owner" "$file.tmp"
  chmod 0400 "$file.tmp"
  mv "$file.tmp" "$file"
  created+=("$name")
}
hex() { openssl rand -hex 24; }        # 48 chars, URL-safe (used inside the database URLs)
key() { openssl rand -base64 32; }     # 32 random bytes, base64 (44 chars ≥ 32 required by config.ts)

# Database passwords and the URLs that contain them must be created together, or they would not match.
for pair in "ottimo_app_db_password:database_url" "ottimo_migrator_db_password:migration_database_url"; do
  pw_file="$dir/${pair%%:*}"; url_file="$dir/${pair##*:}"
  if { [ -e "$pw_file" ] && [ ! -e "$url_file" ]; } || { [ ! -e "$pw_file" ] && [ -e "$url_file" ]; }; then
    echo "only one of ${pair%%:*} / ${pair##*:} exists – remove the other one too (fresh database) or restore it" >&2
    exit 1
  fi
done
if [ ! -e "$dir/ottimo_app_db_password" ]; then
  app_pw=$(hex)
  put ottimo_app_db_password "$PG_UID" "$app_pw"
  put database_url "$APP_UID" "postgres://ottimo_app:${app_pw}@postgres:5432/ottimo"
  unset app_pw
fi
if [ ! -e "$dir/ottimo_migrator_db_password" ]; then
  mig_pw=$(hex)
  put ottimo_migrator_db_password "$PG_UID" "$mig_pw"
  put migration_database_url "$APP_UID" "postgres://ottimo_migrator:${mig_pw}@postgres:5432/ottimo"
  unset mig_pw
fi
put postgres_password "$PG_UID" "$(hex)"

# One key per purpose (ADR-013 point 5): five independent values; config.ts refuses two equal keys.
put session_secret "$APP_UID" "$(key)"
put data_kek_current "$APP_UID" "$(key)"
put id_hash_key "$APP_UID" "$(key)"
put log_ip_hmac_key "$APP_UID" "$(key)"
put guest_code_signing_key "$APP_UID" "$(key)"
# Staging seed password (the loader refuses production; the file exists everywhere so compose can load the project).
put qa_seed_password "$APP_UID" "$(hex)"

if [ "${#created[@]}" -eq 0 ]; then
  echo "init-secrets: nothing to do – all files exist in $dir"
else
  echo "init-secrets: created ${created[*]} in $dir"
fi
cat <<NOTE
Next:
  - Production only: copy data_kek_current OFFLINE now (sealed paper / encrypted USB kept by INV – losing it means
    losing every encrypted document; hosting-plan 8.1). Read it once with: sudo cat $dir/data_kek_current
  - The postgres_password / *_db_password files are applied when the database volume is created; changing them
    later needs ALTER ROLE (runbook) – do not delete them on a running server.
NOTE
