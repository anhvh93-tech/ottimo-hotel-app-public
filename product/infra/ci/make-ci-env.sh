#!/usr/bin/env bash
# Build a throwaway product/.env for the CI compose stack (E2E smoke, docker-build job).
#
#   make-ci-env.sh <.env.example> <out .env>
#
# Every dev placeholder (change_me_*_dev_only: DB passwords, TEST_SUPPORT_TOKEN) and QA_SEED_PASSWORD gets
# a fresh random value for this run only: nothing is stored as a repo secret and nothing is reused between runs.
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

umask 077
# Hex values contain no sed metacharacters, so plain substitution is safe.
sed -e "s/change_me_admin_dev_only/${admin_pw}/g" \
    -e "s/change_me_migrator_dev_only/${migrator_pw}/g" \
    -e "s/change_me_app_dev_only/${app_pw}/g" \
    -e "s/change_me_test_support_token_dev_only/${test_token}/g" \
    -e "s/^QA_SEED_PASSWORD=.*/QA_SEED_PASSWORD=${seed_pw}/" \
    -e "s/^STAFF_REQUESTS_PER_MINUTE=.*/STAFF_REQUESTS_PER_MINUTE=${CI_STAFF_RPM}/" \
    "$src" > "$out"
# Template without the key (older .env.example): add it, the compose stack reads it either way.
grep -q '^STAFF_REQUESTS_PER_MINUTE=' "$out" || echo "STAFF_REQUESTS_PER_MINUTE=${CI_STAFF_RPM}" >> "$out"

# Fail loudly if the template gained a placeholder this script does not know about.
if grep -nE 'change_me_' "$out" | sed -E 's/=.*/=<redacted>/' >&2; then
  echo "::error::$out still contains a change_me_ placeholder – update infra/ci/make-ci-env.sh" >&2
  exit 1
fi
grep -q "^QA_SEED_PASSWORD=${seed_pw}$" "$out" || { echo "::error::QA_SEED_PASSWORD line missing in $src" >&2; exit 1; }
grep -q "^TEST_SUPPORT_TOKEN=${test_token}$" "$out" || { echo "::error::TEST_SUPPORT_TOKEN line missing in $src" >&2; exit 1; }

if [ -n "${GITHUB_ENV:-}" ]; then
  echo "QA_SEED_PASSWORD=${seed_pw}" >> "$GITHUB_ENV"
  echo "TEST_SUPPORT_TOKEN=${test_token}" >> "$GITHUB_ENV"
fi
echo "OK: wrote $out (5 random values, masked on CI; STAFF_REQUESTS_PER_MINUTE=${CI_STAFF_RPM})"
