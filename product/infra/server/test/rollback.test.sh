#!/usr/bin/env bash
# Rehearsal of bin/rollback.sh → the REAL bin/deploy.sh --rollback on a fake PRODUCTION stack (QC v1.0.1 ĐK7:
# "app back to v1.0.0" on the INV command sheet). No server, no container: `dc`, `docker`, `curl` (and `flock`/`sleep`)
# are stubs that log every call; the production home is recognised by its .ottimo-home marker like on the VPS.
#   bash infra/server/test/rollback.test.sh          (workstation or CI)
# The app image tag is sha-<12 hex of the commit>, NOT the git tag: v1.0.0 = commit 8b3aec89486f… → sha-8b3aec89486f.
# Cases:
#   (a) `rollback.sh v1.0.0` (git tag name) → stopped by the production guard (no recorded digests for that name),
#       before any pull; nothing switched, state unchanged;
#   (b) `rollback.sh sha-8b3aec89486f` → digests taken from state/digests/<tag>, pulled, migrations run (no-op),
#       database == image journal accepted, api/worker/web switched to that tag, smoke passed;
#       state: current_tag = v1.0.0 image, previous_tag = the v1.0.1 image (so a later re-deploy of v1.0.1 is possible);
#   (c) `rollback.sh` without argument → state/previous_tag (same result as (b));
#   (d) database AHEAD of the image journal: accepted with --rollback, refused by a normal deploy;
#   (e) registry digest ≠ recorded digest → FAIL at pull, nothing switched;
#   (f) no previous tag recorded and no argument → exit 2, deploy.sh not started;
#   (g) smoke fails during a rollback → FAIL, and deploy.sh does NOT switch back to the v1.0.1 image by itself;
#   (h) extra options reach deploy.sh (`--no-pull` → nothing pulled);
#   (i) the INV sheet's R4 command (read from the sheet): success → 6 [deploy] lines + "MA THOAT: 0"; another deploy
#       running → that line + "MA THOAT: 3"; registry error (set -e stop, no FAIL line) → error + "MA THOAT: 1";
#       "v1.0.0" typed → guard FAIL + "MA THOAT: 1" (SEC FB-R4-SEC-OPS-PR26-01).
# CI=true: a SKIP (no jq, no INV sheet) is a failure (SEC PR26-04).
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
bin=$(cd "$here/../bin" && pwd)
if [ -e /opt/ottimo-prod ] || [ -e /opt/ottimo/.ottimo-home ]; then
  echo "refused: this is an OTTIMO server – run this test on a workstation or in CI" >&2; exit 2
fi
if ! command -v jq >/dev/null; then  # deploy.sh reads the compose secrets with jq (GitHub runners and the VPS have it)
  echo "SKIP  rollback.sh rehearsal: jq is not installed – nothing tested"
  # SEC FB-R4-SEC-OPS-PR26-04: in CI a skipped rehearsal is a failure (ĐK7 relies on this step), not a green tick.
  [ "${CI:-}" = true ] && { echo "FAIL  CI=true: this rehearsal must run in CI – install jq on the runner"; exit 1; }
  exit 0
fi

work=$(mktemp -d "${TMPDIR:-/tmp}/rollback-test.XXXXXX")
trap 'rm -rf "$work"' EXIT
pass=0 fail=0
ok() { echo "PASS  $*"; pass=$((pass + 1)); }
ko() { echo "FAIL  $*"; fail=$((fail + 1)); }

OLD=sha-8b3aec89486f   # v1.0.0 (= v1.0.0-rc.6, release run 40903554902)
NEW=sha-0f1e2d3c4b5a   # stands for the v1.0.1 image
A_OLD=sha256:1111111111111111111111111111111111111111111111111111111111111111
W_OLD=sha256:2222222222222222222222222222222222222222222222222222222222222222
A_NEW=sha256:3333333333333333333333333333333333333333333333333333333333333333
W_NEW=sha256:4444444444444444444444444444444444444444444444444444444444444444

home="$work/ottimo-prod"
stubs="$work/stubs"
calls="$work/calls.log"
mkdir -p "$home/infra/server/bin" "$home/infra/caddy" "$stubs"
cp "$bin/rollback.sh" "$bin/deploy.sh" "$home/infra/server/bin/"
echo production > "$home/.ottimo-home"
printf 'ottimo_check_security_headers() { :; }\n' > "$home/infra/caddy/expected-headers.sh"
cat > "$home/.env" <<'ENV'
APP_ENV=production
MFA_ENFORCED=true
CLOCK_MODE=system
INCLUDE_TEST_SUPPORT=0
API_IMAGE=ghcr.io/example/ottimo-api
WEB_IMAGE=ghcr.io/example/ottimo-web
DESK_HOST=desk.example.invalid
STAFF_HOST=staff.example.invalid
GUEST_HOST=g.example.invalid
EDGE_MODE=edge
EDGE_NAME=production
EDGE_SUBNET=172.30.1.0/24
LANDING_IP=172.30.1.11
ENV

# ---- stubs ----
# bin/dc: every call is logged with the IMAGE_TAG it would use. STUB_APPLIED / STUB_JOURNAL = migration counts,
# STUB_WORKER_DOWN=1 = the worker is not running after the switch; STUB_PULL_FAIL=1 = the registry pull fails
# (deploy.sh stops through `set -e`, without a FAIL line).
cat > "$home/infra/server/bin/dc" <<'DC'
#!/usr/bin/env bash
echo "dc[IMAGE_TAG=${IMAGE_TAG:-}] $*" >> "$STUB_CALLS"
a=" $* "
if [ "${STUB_PULL_FAIL:-0}" = 1 ] && [[ "$a" == *" pull "* ]]; then
  echo "Error response from daemon: Head \"https://ghcr.io/v2/example/ottimo-api/manifests/x\": dial tcp: i/o timeout" >&2
  exit 1
fi
case "$a" in
  *" config --format json "*) echo '{"secrets":{"booking_request_chat_webhook":{"file":"/dev/null"}}}' ;;
  *" --entrypoint node migrate "*) printf '%s' "${STUB_JOURNAL:-39}" ;;
  *" exec -T postgres sh -c "*)
    sql=$(cat)
    case "$sql" in
      *drizzle*) echo "${STUB_APPLIED:-39}" ;;
      *rolconfig*) echo 'idle_in_transaction_session_timeout=30s,statement_timeout=15s' ;;
    esac ;;
  *" exec -T api wget "*) echo '{"status":"ok"}' ;;
  *" ps --status running --quiet worker "*) [ "${STUB_WORKER_DOWN:-0}" = 1 ] || echo cid-worker ;;
  *" ps -q "*) echo "cid-${*: -1}" ;;
  *" logs --no-color --since "*) echo '{"request":{"uri":"/g/[redacted]"}}' ;;
esac
exit 0
DC
# docker: the registry digests come from STUB_REGISTRY (file "api=…\nweb=…" per tag).
cat > "$stubs/docker" <<'DK'
#!/usr/bin/env bash
echo "docker $*" >> "$STUB_CALLS"
case "$1 $2" in
  "image inspect")
    ref="${*: -1}"; tag="${ref##*:}"; f="$STUB_REGISTRY/$tag"
    [ -r "$f" ] || exit 1
    case "$ref" in *ottimo-api:*) echo "${ref%%:*}@$(sed -n 's/^api=//p' "$f")" ;; *) echo "${ref%%:*}@$(sed -n 's/^web=//p' "$f")" ;; esac ;;
  "network inspect") echo '[]' ;;
  "image prune") ;;
  inspect*)
    case "${*: -1}" in cid-api|cid-worker) echo 'volume:ottimo-prod_blobdata:/var/lib/ottimo/blobs ' ;; *) echo 'bind:/srv:/srv ' ;; esac ;;
esac
exit 0
DK
# curl: Caddy answers 200 on pages and /health, 404 on probes, 308 on port 80.
cat > "$stubs/curl" <<'CU'
#!/usr/bin/env bash
url="${*: -1}" headers=0 code=0
for a in "$@"; do case "$a" in -D) headers=1 ;; -w) code=1 ;; esac; done
if [ "$headers" = 1 ]; then printf 'HTTP/2 200\r\ncontent-type: text/html\r\n\r\n'; exit 0; fi
if [ "$code" = 1 ]; then
  case "$url" in
    http://*) printf 308 ;;
    */health) printf 200 ;;
    */var/lib/ottimo/blobs/*|*/blobs/x|*/.env|*.map) printf 404 ;;
    *) printf 200 ;;
  esac
fi
exit 0
CU
printf '#!/usr/bin/env bash\nexit 0\n' > "$stubs/sleep"
printf '#!/usr/bin/env bash\nexit 0\n' > "$stubs/logger"
# flock stub on every OS: STUB_LOCKED=1 = another deploy holds state/deploy.lock.
printf '#!/usr/bin/env bash\n[ "${STUB_LOCKED:-0}" = 1 ] && exit 1\nexit 0\n' > "$stubs/flock"
chmod +x "$home/infra/server/bin/"* "$stubs/"*

registry="$work/registry"
mkdir -p "$registry"
printf 'api=%s\nweb=%s\n' "$A_OLD" "$W_OLD" > "$registry/$OLD"
printf 'api=%s\nweb=%s\n' "$A_NEW" "$W_NEW" > "$registry/$NEW"

# Production state after the v1.0.1 release: current = v1.0.1 image, previous = v1.0.0 image, both digests recorded.
reset_state() {
  rm -rf "$home/state"; mkdir -p "$home/state/digests"
  echo "$NEW" > "$home/state/current_tag"
  echo "$OLD" > "$home/state/previous_tag"
  printf 'api=%s\nweb=%s\n' "$A_OLD" "$W_OLD" > "$home/state/digests/$OLD"
  printf 'api=%s\nweb=%s\n' "$A_NEW" "$W_NEW" > "$home/state/digests/$NEW"
  : > "$calls"
}
run() { # command…  → out, rc (as on the VPS: no OTTIMO_HOME, the marker decides)
  rc=0
  out=$(env -u OTTIMO_HOME PATH="$stubs:$PATH" STUB_CALLS="$calls" STUB_REGISTRY="$registry" "$@" 2>&1) || rc=$?
}
rb="$home/infra/server/bin/rollback.sh"
switched() { grep -q -- "up --detach --wait --wait-timeout 240 --remove-orphans api worker web" "$calls"; }
pulled() { grep -q -- " pull --quiet migrate api worker web" "$calls"; }

# ---------- (a) git tag name instead of the image tag ----------
reset_state
run "$rb" v1.0.0
if [ "$rc" -ne 0 ] && grep -q 'FAIL: production guard:.*production needs --api-digest and --web-digest' <<<"$out" \
  && ! pulled && ! switched && [ "$(cat "$home/state/current_tag")" = "$NEW" ]; then
  ok "(a) rollback.sh v1.0.0 → production guard (no digests recorded for 'v1.0.0'), nothing pulled or switched"
else ko "(a) rc=$rc: $out"; fi

# ---------- (b) explicit image tag of v1.0.0 ----------
reset_state
run "$rb" "$OLD"
if [ "$rc" -eq 0 ] && grep -q "OK: $OLD is live" <<<"$out" && grep -q "deploy $OLD (previous: $NEW, pull=1, rollback=1)" <<<"$out" \
  && grep -q 'image digests match the release' <<<"$out" && grep -q 'migrations: 39 applied / 39 in the image journal' <<<"$out" \
  && grep -q "dc\[IMAGE_TAG=$OLD\] --profile deploy pull --quiet migrate api worker web" "$calls" \
  && grep -q "dc\[IMAGE_TAG=$OLD\] up --detach --wait --wait-timeout 240 --remove-orphans api worker web" "$calls" \
  && ! grep -q 'putting previous tag' <<<"$out"; then
  ok "(b) rollback.sh $OLD → recorded digests checked, migrate no-op, api/worker/web on $OLD, smoke ok"
else ko "(b) rc=$rc: $out"; fi
if [ "$(cat "$home/state/current_tag")" = "$OLD" ] && [ "$(cat "$home/state/previous_tag")" = "$NEW" ] \
  && [ "$(tail -n 1 "$home/state/deploy-history.log" | awk '{print $2}')" = "$OLD" ]; then
  ok "(b) state: current_tag=$OLD, previous_tag=$NEW (v1.0.1 can be re-deployed), history appended"
else ko "(b) state: current=$(cat "$home/state/current_tag") previous=$(cat "$home/state/previous_tag")"; fi
last_line=$(printf '%s\n' "$out" | tail -n 1)
[[ "$last_line" =~ ^\[deploy\ [0-9T:-]+Z\]\ OK:\ $OLD\ is\ live$ ]] && ok "(b) last line: $last_line" || ko "(b) last line: $last_line"

# ---------- (c) no argument → state/previous_tag ----------
reset_state
run "$rb"
if [ "$rc" -eq 0 ] && grep -q "OK: $OLD is live" <<<"$out" && [ "$(cat "$home/state/current_tag")" = "$OLD" ]; then
  ok "(c) rollback.sh (no argument) → previous_tag $OLD"
else ko "(c) rc=$rc: $out"; fi

# ---------- (d) database ahead of the image ----------
reset_state
STUB_APPLIED=40 run "$rb" "$OLD"
if [ "$rc" -eq 0 ] && grep -q 'migrations: 40 applied / 39 in the image journal' <<<"$out"; then
  ok "(d) database ahead (40 > 39) accepted with --rollback"
else ko "(d) rollback rc=$rc: $out"; fi
reset_state
STUB_APPLIED=40 run "$home/infra/server/bin/deploy.sh" "$OLD" --api-digest "$A_OLD" --web-digest "$W_OLD"
if [ "$rc" -ne 0 ] && grep -q 'FAIL: __drizzle_migrations=40 but the image journal has 39' <<<"$out" && ! switched; then
  ok "(d) the same database refused by a normal deploy (only --rollback accepts it)"
else ko "(d) normal deploy rc=$rc: $out"; fi

# ---------- (e) registry serves another image under the tag ----------
reset_state
printf 'api=%s\nweb=%s\n' "$A_NEW" "$W_OLD" > "$registry/$OLD"
run "$rb" "$OLD"
printf 'api=%s\nweb=%s\n' "$A_OLD" "$W_OLD" > "$registry/$OLD"
if [ "$rc" -ne 0 ] && grep -q "FAIL: ghcr.io/example/ottimo-api:$OLD does not have the released digest" <<<"$out" && ! switched \
  && [ "$(cat "$home/state/current_tag")" = "$NEW" ]; then
  ok "(e) digest mismatch → FAIL before migrate/switch, state unchanged"
else ko "(e) rc=$rc: $out"; fi

# ---------- (f) nothing recorded ----------
reset_state
rm -f "$home/state/previous_tag"
run "$rb"
if [ "$rc" -eq 2 ] && grep -q 'no previous tag recorded' <<<"$out" && [ ! -s "$calls" ]; then
  ok "(f) no previous_tag and no argument → exit 2, deploy.sh not started"
else ko "(f) rc=$rc: $out"; fi

# ---------- (g) smoke fails during a rollback: no automatic switch back ----------
reset_state
STUB_WORKER_DOWN=1 run "$rb" "$OLD"
if [ "$rc" -ne 0 ] && grep -q 'FAIL: worker is not running' <<<"$out" && ! grep -q 'putting previous tag' <<<"$out" \
  && [ "$(cat "$home/state/current_tag")" = "$NEW" ]; then
  ok "(g) smoke FAIL during rollback → exit $rc, no automatic switch back, current_tag not rewritten (team decides)"
else ko "(g) rc=$rc: $out"; fi

# ---------- (h) options pass through ----------
reset_state
run "$rb" "$OLD" --no-pull
if [ "$rc" -eq 0 ] && grep -q "pull=0, rollback=1" <<<"$out" && ! pulled; then
  ok "(h) rollback.sh $OLD --no-pull → nothing pulled (digests still checked)"
else ko "(h) rc=$rc: $out"; fi

# ---------- (i) the INV sheet's R4 command itself (SEC FB-R4-SEC-OPS-PR26-01) ----------
# The remote part of R4 is read from the sheet (so the test follows the document), the server path replaced by this
# fake stack's rollback.sh and `sudo -u ottimo` dropped. Every outcome must end with "MA THOAT: <n>", and the lines
# INV needs (another deploy, registry error) must survive the filter.
sheet="$here/../../../../rounds/round-04/outputs/OPS/v1.0.1-inv-commands.md"
if [ -r "$sheet" ]; then
  r4=$(grep -F 'rollback.sh sha-8b3aec89486f 2>&1' "$sheet" | grep -F 'ssh -t' | head -n 1)
  r4=${r4#*\'}; r4=${r4%\'}
  r4=${r4//sudo -u ottimo \/opt\/ottimo-prod\/infra\/server\/bin\/rollback.sh/$rb}
  r4run() { rc=0; out=$(env -u OTTIMO_HOME PATH="$stubs:$PATH" STUB_CALLS="$calls" STUB_REGISTRY="$registry" bash -c "$r4" 2>&1) || rc=$?; }
  if [[ "$r4" == *"$rb sha-8b3aec89486f"* ]] && [[ "$r4" == *'MA THOAT: $?'* ]]; then ok "(i) R4 read from the INV sheet"
  else ko "(i) R4 not found / not rewritten: $r4"; fi
  reset_state
  r4run
  if [ "$(printf '%s\n' "$out" | tail -n 2 | head -n 1 | sed 's/^\[deploy [^]]*\] //')" = "OK: $OLD is live" ] \
    && [ "$(printf '%s\n' "$out" | tail -n 1)" = "MA THOAT: 0" ] && [ "$(printf '%s\n' "$out" | wc -l | tr -d ' ')" = 7 ]; then
    ok "(i) R4 success → the 6 [deploy] lines, then 'MA THOAT: 0'"
  else ko "(i) R4 success: $out"; fi
  reset_state
  STUB_LOCKED=1 r4run
  if grep -qx 'another deploy is running' <<<"$out" && [ "$(printf '%s\n' "$out" | tail -n 1)" = "MA THOAT: 3" ] && ! switched; then
    ok "(i) R4 while another deploy runs → 'another deploy is running' + 'MA THOAT: 3' (shown, not filtered)"
  else ko "(i) R4 locked: $out"; fi
  reset_state
  STUB_PULL_FAIL=1 r4run
  if grep -q '^Error response from daemon' <<<"$out" && ! grep -q 'FAIL\|OK:' <<<"$out" \
    && [ "$(printf '%s\n' "$out" | tail -n 1)" = "MA THOAT: 1" ] && ! switched; then
    ok "(i) R4 pull error (set -e stop, no FAIL line) → registry error + 'MA THOAT: 1'"
  else ko "(i) R4 pull error: $out"; fi
  reset_state
  r4=${r4//sha-8b3aec89486f/v1.0.0}
  r4run
  if grep -q 'FAIL: production guard' <<<"$out" && [ "$(printf '%s\n' "$out" | tail -n 1)" = "MA THOAT: 1" ]; then
    ok "(i) R4 with v1.0.0 typed → production guard FAIL + 'MA THOAT: 1'"
  else ko "(i) R4 v1.0.0: $out"; fi
elif [ "${CI:-}" = true ]; then ko "(i) INV sheet not found at $sheet"
else echo "SKIP  (i) INV sheet not found (only product/infra mounted?) – R4 command not tested"; fi

echo "rollback.sh rehearsal: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
