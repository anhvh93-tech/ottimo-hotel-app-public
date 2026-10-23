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
#                                                web_push_vapid_private_key + web_push_vapid_public_key (one
#                                                EC P-256 pair, base64url – R3 Web Push), public_form_signing_key
#   uid 70   (postgres)                          postgres_password, ottimo_app_db_password,
#                                                ottimo_migrator_db_password
#   uid 10001 (caddy, landing container)         landing_access – a Caddyfile snippet, not a key: staging = basic
#                                                auth (bcrypt hash) + X-Robots-Tag noindex; production = empty
#   uid 0    (root only)                         landing_preview_password (staging: the preview password INV uses –
#                                                read it with sudo, give it to INV over a private channel)
#   uid 1000 (worker only)                       email_smtp_password – the ONE value not generated here: the Google
#                                                Workspace app password of EMAIL_SMTP_USER (info@ottimo.vn), typed by
#                                                INV at a hidden prompt (not echoed, not in shell history, not an
#                                                argument). Staging may leave it empty (EMAIL_PROVIDER=mock).
# Replace the app password (Google revokes it when the mailbox password changes):
#   sudo /opt/ottimo-prod/infra/server/bin/init-secrets.sh --reset-email-password   then   bin/dc restart worker
# New files are added on re-run (R3: run it on staging before the first deploy that needs them – deploy.sh says so).
# Docker (non-swarm) bind-mounts each file read-only at /run/secrets/<name>; the app reads it through X_FILE.
# Host users other than root cannot reach the files (the directory is not traversable for them) – keep it that
# way: no backup job and no snapshot may include this directory (SR-KEY-10, SR-BAK-03).
set -Eeuo pipefail
set +x # never trace: the e-mail app password passes through a variable below

reset_email=0
case "${1:-}" in
  '') ;;
  --reset-email-password) reset_email=1 ;;
  *) echo "usage: init-secrets.sh [--reset-email-password]" >&2; exit 2 ;;
esac

here=$(cd "$(dirname "$0")" && pwd)
if [ -z "${OTTIMO_HOME:-}" ] && [ -f "$here/../../../.ottimo-home" ]; then OTTIMO_HOME=$(cd "$here/../../.." && pwd); fi
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
CADDY_UID="${CADDY_UID:-10001}"
# Same Caddy as the web/landing images (infra/docker/Dockerfile.web) – only to compute a bcrypt hash.
CADDY_IMAGE="${CADDY_IMAGE:-caddy:2-alpine@sha256:d8542f48d34a9cf4e4c11a478865229840e87e4c96ea3f439101f31a5d35f75f}"
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
# ADR-014 4: HMAC key of the website form token (used from v1.1; present now so compose has one file layout).
put public_form_signing_key "$APP_UID" "$(key)"

# Web Push VAPID pair (EC P-256): private = 32-byte scalar, public = 65-byte uncompressed point, both base64url without
# padding (the form web-push libraries take). Created together; never one without the other.
b64url_hex() { sed 's/../\\x&/g' | { read -r e; printf '%b' "$e"; } | openssl base64 -A | tr '+/' '-_' | tr -d '='; }
if [ ! -e "$dir/web_push_vapid_private_key" ] || [ ! -e "$dir/web_push_vapid_public_key" ]; then
  [ ! -e "$dir/web_push_vapid_private_key" ] && [ ! -e "$dir/web_push_vapid_public_key" ] \
    || { echo "only one of web_push_vapid_private_key / _public_key exists – remove it (subscriptions are re-made)" >&2; exit 1; }
  ec_text=$(openssl ecparam -name prime256v1 -genkey -noout | openssl ec -text -noout 2>/dev/null)
  priv_hex=$(sed -n '/^priv:/,/^pub:/p' <<<"$ec_text" | grep -v '^priv:\|^pub:' | tr -d ' :\n')
  pub_hex=$(sed -n '/^pub:/,/^ASN1/p' <<<"$ec_text" | grep -v '^pub:\|^ASN1' | tr -d ' :\n')
  unset ec_text
  priv_hex=$(printf '%064s' "${priv_hex: -64}" | tr ' ' '0')
  [ "${#pub_hex}" -eq 130 ] && [ "${pub_hex:0:2}" = "04" ] || { echo "VAPID key generation failed" >&2; exit 1; }
  put web_push_vapid_private_key "$APP_UID" "$(b64url_hex <<<"$priv_hex")"
  put web_push_vapid_public_key "$APP_UID" "$(b64url_hex <<<"$pub_hex")"
  unset priv_hex pub_hex
fi

# APP_ENV from the non-secret .env decides the landing snippet and whether the e-mail password may stay empty.
app_env=$(sed -n 's/^APP_ENV=//p' "$OTTIMO_HOME/.env" 2>/dev/null | tail -n 1 | tr -d '\r"')

# E-mail app password (INT R3 – Google Workspace SMTP, INV decision 23/10/2026). Asked, never generated or printed.
if [ "$reset_email" -eq 1 ] && [ -e "$dir/email_smtp_password" ]; then
  rm -f "$dir/email_smtp_password"
fi
if [ ! -e "$dir/email_smtp_password" ]; then
  smtp_pw=''
  if [ -t 0 ]; then
    cat <<'ASK'

E-mail of the system (info@ottimo.vn through Google Workspace).
Paste the 16-letter APP PASSWORD Google showed you (spaces are fine), then press Enter.
Nothing appears while you type. This is NOT the normal mailbox password.
ASK
    [ "$app_env" = "production" ] || echo "Staging: press Enter on an empty line to skip (e-mail stays mock)."
    while :; do
      IFS= read -rs -p 'App password: ' smtp_pw; echo
      smtp_pw=${smtp_pw//[[:space:]]/}
      if [ -z "$smtp_pw" ]; then
        [ "$app_env" = "production" ] && { echo "Production needs the app password – try again (Ctrl+C to stop)."; continue; }
        break
      fi
      if ! [[ "$smtp_pw" =~ ^[A-Za-z]{16}$ ]]; then
        echo "That is not 16 letters – copy the app password again (Ctrl+C to stop)."; smtp_pw=''; continue
      fi
      IFS= read -rs -p 'Paste it once more to confirm: ' smtp_pw2; echo
      smtp_pw2=${smtp_pw2//[[:space:]]/}
      if [ "$smtp_pw" = "$smtp_pw2" ]; then unset smtp_pw2; break; fi
      echo "The two entries differ – try again."; smtp_pw=''; unset smtp_pw2
    done
  elif [ "$app_env" = "production" ]; then
    echo "email_smtp_password missing: run this script in an interactive terminal (sudo, no pipe) to type the app password" >&2
    exit 1
  fi
  put email_smtp_password "$APP_UID" "$smtp_pw"
  unset smtp_pw
fi

# Landing access snippet (Caddyfile.landing imports it).
if [ ! -e "$dir/landing_access" ]; then
  if [ "$app_env" = "production" ]; then
    put landing_access "$CADDY_UID" "# production: public site – no access restriction, no X-Robots-Tag (ADR-014 1.4)"
  else
    command -v docker >/dev/null || { echo "docker is required to hash the landing preview password" >&2; exit 1; }
    put landing_preview_password 0 "$(openssl rand -hex 12)"
    hash=$(docker run --rm -i --network none --entrypoint caddy "$CADDY_IMAGE" hash-password < <(cat "$dir/landing_preview_password"; echo) | tail -n 1)
    [[ "$hash" =~ ^\$2[aby]\$[0-9]{2}\$ ]] || { echo "bcrypt hash failed" >&2; exit 1; }
    put landing_access "$CADDY_UID" "$(printf '# %s preview: basic auth (user ottimo) + noindex – SEC ARC-10 point 4\nbasic_auth {\n\tottimo %s\n}\nheader X-Robots-Tag "noindex, nofollow"\n' "${app_env:-staging}" "$hash")"
    unset hash
  fi
fi

if [ "${#created[@]}" -eq 0 ]; then
  echo "init-secrets: nothing to do – all files exist in $dir"
else
  echo "init-secrets: created ${created[*]} in $dir"
fi
cat <<NOTE
Next:
  - Staging: the landing preview password for INV: sudo cat $dir/landing_preview_password (user: ottimo).
  - E-mail: set EMAIL_PROVIDER=smtp and EMAIL_SMTP_USER / EMAIL_FROM in the .env (production requires smtp). A new app
    password later: sudo $here/init-secrets.sh --reset-email-password, then bin/dc restart worker.
  - Production only: copy data_kek_current OFFLINE now (sealed paper / encrypted USB kept by INV – losing it means
    losing every encrypted document; hosting-plan 8.1). Read it once with: sudo cat $dir/data_kek_current
  - The postgres_password / *_db_password files are applied when the database volume is created; changing them
    later needs ALTER ROLE (runbook) – do not delete them on a running server.
NOTE
