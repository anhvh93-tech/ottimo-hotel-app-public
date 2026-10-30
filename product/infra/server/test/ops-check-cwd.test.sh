#!/usr/bin/env bash
# Test of bin/dc + bin/ops-check.sh run by hand from a current directory the deploy user cannot enter (30/10 23:39:
# `sudo -u ottimo …/ops-check.sh` from ottimo-admin's home → docker compose "stat .: permission denied" → false
# "containers FAIL not running" alert). Temp OTTIMO_HOME, a one-service compose file, no container started.
#   bash infra/server/test/ops-check-cwd.test.sh        (workstation or CI; needs docker compose; not as root)
# Cases: bin/dc from an unreadable cwd works · ops-check from an unreadable cwd · a failing docker compose is reported
# as "docker compose failed" (containers + http5xx), never as "not running", without its raw message · a really
# missing container is still "not running".
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
bin=$(cd "$here/../bin" && pwd)
if [ -e /opt/ottimo-prod ] || [ -e /opt/ottimo/.ottimo-home ]; then
  echo "refused: this is an OTTIMO server – run this test on a workstation or in CI" >&2; exit 2
fi
if [ "$(id -u)" -eq 0 ]; then echo "skipped: root ignores directory permissions – run as a normal user" >&2; exit 0; fi

home=$(mktemp -d "${TMPDIR:-/tmp}/occ-test.XXXXXX")
mkdir -p "$home/stack/infra" "$home/stack/state" "$home/fake/infra/server/bin" "$home/locked"
printf 'services:\n  hello:\n    image: alpine:3.20\n' > "$home/stack/infra/docker-compose.prod.yml"
printf 'APP_ENV=staging\nOTTIMO_PROJECT=occ-test\n' > "$home/stack/.env"
cp "$bin/ops-check.sh" "$home/fake/infra/server/bin/"
cleanup() { chmod 755 "$home/locked" 2>/dev/null || true; rm -rf "$home"; }
trap cleanup EXIT

pass=0 fail=0
ok() { echo "PASS  $*"; pass=$((pass + 1)); }
ko() { echo "FAIL  $*"; fail=$((fail + 1)); }
# Run "$@" with an unreadable cwd, like ottimo-admin's home seen by the user ottimo (cd in, then remove all rights).
in_locked() { ( cd "$home/locked" && chmod 000 "$home/locked" && "$@" ) 2>&1 | grep -v 'getcwd' || true; chmod 755 "$home/locked"; }

# Fake bin/dc next to a copy of ops-check.sh: behaves like docker compose, which fails when the cwd is unreadable.
fake_dc() { # mode: perm-error | env-error | missing-worker | ok
  cat > "$home/fake/infra/server/bin/dc" <<DC
#!/usr/bin/env bash
[ -x . ] || { echo 'stat .: permission denied' >&2; exit 1; }
case "$1" in
  perm-error) echo 'validating docker-compose.prod.yml: stat .: permission denied' >&2; exit 1 ;;
  env-error) echo 'failed to read .env: line 3: unexpected character "/" in variable name "ALERT_WEBHOOK_URL=https://chat.example/secret-token"' >&2; exit 15 ;;
esac
case "\$1" in
  ps) svc="\${*: -1}"; { [ "$1" = missing-worker ] && [ "\$svc" = worker ]; } || echo "cid-\$svc" ;;
  exec) echo '{"status":"ok"}' ;;
  logs) echo '{"status":200}' ;;
esac
DC
  chmod +x "$home/fake/infra/server/bin/dc"
}
oc() { OTTIMO_HOME="$home/stack" "$home/fake/infra/server/bin/ops-check.sh" containers http5xx; echo "rc=$?"; }

echo "== cases"
out=$(in_locked env OTTIMO_HOME="$home/stack" "$bin/dc" config --services; echo "rc=$?")
if grep -qx hello <<<"$out" && grep -q '^rc=0$' <<<"$out"; then ok "1 bin/dc from an unreadable cwd → docker compose works"
else ko "1 dc"; echo "$out"; fi

fake_dc ok
out=$(in_locked oc)
if grep -q '^ok   containers: postgres api worker web running, api healthy' <<<"$out" && grep -q '^rc=0$' <<<"$out"; then
  ok "2 ops-check from an unreadable cwd → runs from /, all ok"; else ko "2 ops-check cwd"; echo "$out"; fi

fake_dc perm-error
out=$(oc)
if grep -q '^FAIL containers: docker compose failed, container state unknown: permission denied' <<<"$out" \
  && grep -q '^FAIL http5xx: docker compose failed' <<<"$out" && ! grep -q 'not running' <<<"$out" && grep -q '^rc=1$' <<<"$out"; then
  ok "3 docker compose error → 'docker compose failed', not 'not running'"; else ko "3 compose error"; echo "$out"; fi

fake_dc env-error
out=$(oc)
if grep -q 'docker compose failed, container state unknown: other error' <<<"$out" && ! grep -q 'secret-token' <<<"$out" \
  && ! grep -q 'secret-token' "$home/stack/state/ops-check/containers"; then
  ok "4 raw compose message (could quote .env) is not forwarded"; else ko "4 raw message"; echo "$out"; fi
perm=$(ls -l "$home/stack/state/ops-check/compose.stderr" | cut -c1-10)
[ "$perm" = "-rw-------" ] && ok "4b compose.stderr is 0600" || ko "4b compose.stderr mode $perm"

fake_dc missing-worker
out=$(oc)
if grep -q '^FAIL containers: not running: worker' <<<"$out"; then ok "5 a stopped container is still 'not running: worker'"
else ko "5 missing worker"; echo "$out"; fi

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
