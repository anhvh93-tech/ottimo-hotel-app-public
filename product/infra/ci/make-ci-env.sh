#!/usr/bin/env bash
# Build a throwaway product/.env for the CI compose stack (E2E smoke, docker-build job).
#
#   make-ci-env.sh <.env.example> <out .env>
#
# Every dev placeholder (change_me_*_dev_only: DB passwords, TEST_SUPPORT_TOKEN) and QA_SEED_PASSWORD gets
# a fresh random value for this run only: nothing is stored as a repo secret and nothing is reused between runs.
# The key material left empty in the template (DATA_KEK_CURRENT, ID_HASH_KEY, SESSION_SECRET, LOG_IP_HMAC_KEY,
# GUEST_CODE_SIGNING_KEY) gets a random value too, so api and worker share one keyring and documents survive a
# restart of the stack (UXR 17/10 #1) – the api's empty-key fallback is a different random key per process.
# On GitHub Actions each value is masked (::add-mask::) before anything else can print it, and
# QA_SEED_PASSWORD / TEST_SUPPORT_TOKEN are exported to $GITHUB_ENV for the seed loader and the E2E steps
# that drive /__test__/* (X-Test-Token). STAFF_REQUESTS_PER_MINUTE is raised to 5000 (CI_STAFF_RPM) for the shared
# qa.* accounts of parallel E2E workers.
# Exit 0 = written, 2 = usage / missing input, 1 = a placeholder survived (template changed).
set -Eeuo pipefail

src="${1:-}"
out="${2:-}"
if [ -z "$src" ] || [ -z "$out" ]; then echo "usage: $0 <.env.example> <out .env>" >&2; exit 2; fi
[ -f "$src" ] || { echo "missing template: $src" >&2; exit 2; }

rand() { openssl rand -hex 24; }
# SR-RL-09 limit for the throw-away E2E stack: parallel Playwright workers share the qa.* accounts, so 600/min/user
# (production value) turns into 429s (BUG-R2-051). dev/test only – the api refuses > 600 in staging/production.
CI_STAFF_RPM="${CI_STAFF_RPM:-5000}"
[[ "$CI_STAFF_RPM" =~ ^[0-9]+$ ]] || { echo "CI_STAFF_RPM must be a number" >&2; exit 2; }
mask() { if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::add-mask::$1"; fi; }

admin_pw=$(rand) && mask "$admin_pw"
migrator_pw=$(rand) && mask "$migrator_pw"
app_pw=$(rand) && mask "$app_pw"
seed_pw=$(rand) && mask "$seed_pw"
test_token=$(rand) && mask "$test_token" # 48 hex chars (config.ts needs >= 32)
# Keys: exactly 32 bytes base64 for the KEK (keyring.ts), 64 hex chars for the HMAC keys (config.ts: >= 32, distinct).
kek=$(openssl rand -base64 32) && mask "$kek"
id_hash_key=$(openssl rand -hex 32) && mask "$id_hash_key"
session_secret=$(openssl rand -hex 32) && mask "$session_secret"
log_ip_key=$(openssl rand -hex 32) && mask "$log_ip_key"
guest_code_key=$(openssl rand -hex 32) && mask "$guest_code_key"

umask 077
# Hex values contain no sed metacharacters, so plain substitution is safe. The base64 KEK may contain / and +:
# those lines use | as the delimiter (never in base64). Only EMPTY key lines are filled – a value already set wins.
sed -e "s/change_me_admin_dev_only/${admin_pw}/g" \
    -e "s/change_me_migrator_dev_only/${migrator_pw}/g" \
    -e "s/change_me_app_dev_only/${app_pw}/g" \
    -e "s/change_me_test_support_token_dev_only/${test_token}/g" \
    -e "s/^QA_SEED_PASSWORD=.*/QA_SEED_PASSWORD=${seed_pw}/" \
    -e "s/^STAFF_REQUESTS_PER_MINUTE=.*/STAFF_REQUESTS_PER_MINUTE=${CI_STAFF_RPM}/" \
    -e "s|^DATA_KEK_CURRENT=$|DATA_KEK_CURRENT=${kek}|" \
    -e "s|^ID_HASH_KEY=$|ID_HASH_KEY=${id_hash_key}|" \
    -e "s|^SESSION_SECRET=$|SESSION_SECRET=${session_secret}|" \
    -e "s|^LOG_IP_HMAC_KEY=$|LOG_IP_HMAC_KEY=${log_ip_key}|" \
    -e "s|^GUEST_CODE_SIGNING_KEY=$|GUEST_CODE_SIGNING_KEY=${guest_code_key}|" \
    "$src" > "$out"
# Template without the key (older .env.example): add it, the compose stack reads it either way.
grep -q '^STAFF_REQUESTS_PER_MINUTE=' "$out" || echo "STAFF_REQUESTS_PER_MINUTE=${CI_STAFF_RPM}" >> "$out"
grep -q '^DATA_KEK_CURRENT=' "$out" || echo "DATA_KEK_CURRENT=${kek}" >> "$out"
grep -q '^ID_HASH_KEY=' "$out" || echo "ID_HASH_KEY=${id_hash_key}" >> "$out"
grep -q '^SESSION_SECRET=' "$out" || echo "SESSION_SECRET=${session_secret}" >> "$out"
grep -q '^LOG_IP_HMAC_KEY=' "$out" || echo "LOG_IP_HMAC_KEY=${log_ip_key}" >> "$out"
grep -q '^GUEST_CODE_SIGNING_KEY=' "$out" || echo "GUEST_CODE_SIGNING_KEY=${guest_code_key}" >> "$out"

# Fail loudly if the template gained a placeholder this script does not know about.
if grep -nE 'change_me_' "$out" | sed -E 's/=.*/=<redacted>/' >&2; then
  echo "::error::$out still contains a change_me_ placeholder – update infra/ci/make-ci-env.sh" >&2
  exit 1
fi
grep -q "^QA_SEED_PASSWORD=${seed_pw}$" "$out" || { echo "::error::QA_SEED_PASSWORD line missing in $src" >&2; exit 1; }
grep -q "^TEST_SUPPORT_TOKEN=${test_token}$" "$out" || { echo "::error::TEST_SUPPORT_TOKEN line missing in $src" >&2; exit 1; }
for k in DATA_KEK_CURRENT ID_HASH_KEY SESSION_SECRET LOG_IP_HMAC_KEY GUEST_CODE_SIGNING_KEY; do
  grep -qE "^${k}=.+" "$out" || { echo "::error::$k is empty in $out" >&2; exit 1; }
done

if [ -n "${GITHUB_ENV:-}" ]; then
  echo "QA_SEED_PASSWORD=${seed_pw}" >> "$GITHUB_ENV"
  echo "TEST_SUPPORT_TOKEN=${test_token}" >> "$GITHUB_ENV"
fi
echo "OK: wrote $out (5 random values + key material, masked on CI; STAFF_REQUESTS_PER_MINUTE=${CI_STAFF_RPM})"
