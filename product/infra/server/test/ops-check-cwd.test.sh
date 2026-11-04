#!/usr/bin/env bash
# Test of bin/dc + bin/ops-check.sh run by hand from a current directory the deploy user cannot enter (30/10 23:39:
# `sudo -u ottimo …/ops-check.sh` from ottimo-admin's home → docker compose "stat .: permission denied" → false
# "containers FAIL not running" alert). Temp OTTIMO_HOME, a one-service compose file, no container started.
#   bash infra/server/test/ops-check-cwd.test.sh        (workstation or CI; needs docker compose; not as root)
# Cases: bin/dc from an unreadable cwd works · ops-check from an unreadable cwd · a failing docker compose is reported
# as "docker compose failed" (containers + http5xx), never as "not running", without its raw message · the same for
# the database checks j16 / email_dead / email_missing / email_changes / email_ascii ("query failed: <category>",
# ARC CWD-03) · no stderr file left on disk
# (ARC CWD-04 1) · a really missing container is still "not running" · v1.0.4 (ARC P402-01 / P404-04): a container
# that restarts in a loop is seen "running" – the RestartCount of the same container id rising since the last run, or
# above 0 on a container first seen, is a FAIL; a new container id (deploy) re-bases; unreadable inspect = FAIL;
#   6g: listed by `ps` but Running=false at `inspect` (died in between) = FAIL (ARC P404-12 a).
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
bin=$(cd "$here/../bin" && pwd)
if [ -e /opt/ottimo-prod ] || [ -e /opt/ottimo/.ottimo-home ]; then
  echo "refused: this is an OTTIMO server – run this test on a workstation or in CI" >&2; exit 2
fi
if [ "$(id -u)" -eq 0 ]; then  # ARC CWD-04 3: a visible SKIP line on stdout (CI log), not a silent pass
  echo "SKIP  ops-check-cwd: running as root – root ignores directory permissions, nothing tested; run as a normal user"
  # SEC FB-R4-SEC-OPS-PR26-04: in CI a skipped test is a failure, not a green tick.
  [ "${CI:-}" = true ] && { echo "FAIL  CI=true: run this test as a normal user"; exit 1; }
  exit 0
fi

home=$(mktemp -d "${TMPDIR:-/tmp}/occ-test.XXXXXX")
mkdir -p "$home/stack/infra" "$home/stack/state" "$home/fake/infra/server/bin" "$home/locked" "$home/path"
# Fake docker for `docker inspect` only: "<running> <RestartCount>" from $home/restarts.<cid> (default "true 0").
# Anything else (docker compose of case 1) goes to the real docker.
real_docker=$(command -v docker || echo /usr/bin/docker)
cat > "$home/path/docker" <<DK
#!/usr/bin/env bash
[ "\$1" = inspect ] || exec "$real_docker" "\$@"
f="$home/restarts.\${*: -1}"
[ -e "$home/inspect.fail" ] && { echo 'permission denied while trying to connect to the Docker daemon socket' >&2; exit 1; }
if [ -r "\$f" ]; then cat "\$f"; else echo "true 0"; fi
DK
chmod +x "$home/path/docker"
export PATH="$home/path:$PATH"
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
  ps) svc="\${*: -1}"; { [ "$1" = missing-worker ] && [ "\$svc" = worker ]; } || echo "cid-\$svc\$(cat "$home/gen.\$svc" 2>/dev/null)" ;;
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
if grep -q '^ok   containers: postgres api worker web running (no restart since the last check), api healthy' <<<"$out" && grep -q '^rc=0$' <<<"$out"; then
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
left=$(find "$home/stack/state/ops-check" -name '*stderr*' | wc -l | tr -d ' ')
[ "$left" = "0" ] && ok "4b no stderr file left in state/ops-check (raw message not kept on disk)" || ko "4b $left stderr file(s) left"
out=$(OTTIMO_HOME="$home/stack" "$home/fake/infra/server/bin/ops-check.sh" j16 email_dead email_missing email_changes email_ascii db_triggers; echo "rc=$?")
if grep -q '^FAIL j16: query failed: other error' <<<"$out" && grep -q '^FAIL email_dead: query failed: other error' <<<"$out" \
  && grep -q '^FAIL email_missing: query failed: other error' <<<"$out" \
  && grep -q '^FAIL email_changes: query failed: other error' <<<"$out" \
  && grep -q '^FAIL email_ascii: query failed: other error' <<<"$out" \
  && grep -q '^FAIL db_triggers: query failed: other error' <<<"$out" \
  && ! grep -q 'secret-token' <<<"$out" && ! grep -q 'secret-token' "$home/stack/state/ops-check/j16" \
  && ! grep -q 'secret-token' "$home/stack/state/ops-check/email_dead" \
  && ! grep -q 'secret-token' "$home/stack/state/ops-check/email_missing" \
  && ! grep -q 'secret-token' "$home/stack/state/ops-check/email_changes" \
  && ! grep -q 'secret-token' "$home/stack/state/ops-check/email_ascii" && grep -q '^rc=1$' <<<"$out"; then
  ok "4c broken .env → j16 / email_dead / email_missing / email_changes / email_ascii 'query failed: other error', raw message not forwarded (ARC CWD-03)"
else ko "4c db checks raw message"; echo "$out"; fi

fake_dc missing-worker
out=$(oc)
if grep -q '^FAIL containers: not running: worker' <<<"$out"; then ok "5 a stopped container is still 'not running: worker'"
else ko "5 missing worker"; echo "$out"; fi

# v1.0.4 RestartCount (ARC P402-01 / P404-04): same container, count rising = crash loop even when "running".
fake_dc ok
rm -f "$home/stack/state/ops-check/containers.restarts" "$home/restarts."*
out=$(oc)
grep -q '^ok   containers: ' <<<"$out" && ok "6a first run, all at 0 → ok, baseline written" || { ko "6a"; echo "$out"; }
echo "true 2" > "$home/restarts.cid-worker"
out=$(oc)
if grep -q '^FAIL containers: worker restarted 2 time(s) since the last check – crash loop' <<<"$out"; then
  ok "6b worker still 'running' but RestartCount 0 → 2 → FAIL"; else ko "6b"; echo "$out"; fi
out=$(oc)
grep -q '^ok   containers: ' <<<"$out" && ok "6c no new restart since → ok (recovery once)" || { ko "6c"; echo "$out"; }
echo 2 > "$home/gen.worker"; echo "true 0" > "$home/restarts.cid-worker2"
out=$(oc)
grep -q '^ok   containers: ' <<<"$out" && ok "6d new worker container (deploy) at 0 → re-based, ok" || { ko "6d"; echo "$out"; }
echo 3 > "$home/gen.worker"; echo "true 1" > "$home/restarts.cid-worker3"
out=$(oc)
if grep -q '^FAIL containers: worker restarted 1 time(s) since it was created' <<<"$out"; then
  ok "6e new container already restarted → FAIL"; else ko "6e"; echo "$out"; fi
touch "$home/inspect.fail"
out=$(oc)
if grep -q '^FAIL containers: restart count of postgres unreadable (docker inspect failed)$' <<<"$out" && ! grep -q 'socket' <<<"$out"; then
  ok "6f docker inspect fails → FAIL unreadable, raw text not forwarded"; else ko "6f"; echo "$out"; fi
rm -f "$home/inspect.fail" "$home/gen.worker"
echo 4 > "$home/gen.worker"; echo "false 0" > "$home/restarts.cid-worker4"
out=$(oc)
if grep -q '^FAIL containers: worker not running at inspect' <<<"$out"; then
  ok "6g worker listed by ps but not running at inspect → FAIL (ARC P404-12 a)"; else ko "6g"; echo "$out"; fi
rm -f "$home/gen.worker"

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
