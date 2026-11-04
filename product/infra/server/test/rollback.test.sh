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
# Switch order (FB-R4-OPS-ARC-31-01, ARC FB-R4-ARC-BE-31-02 – a newer api's outbox jobs must never meet an older worker):
#   (j) rollback: `up … api web` on the old tag, THEN `up … worker` – one group per `dc up`, never api + worker together;
#   (k) normal deploy: `up … worker` on the new tag, THEN `up … api web`; `--remove-orphans` on the first `up` only;
#   (l) normal deploy, the new worker dies right after start → FAIL before api/web change; the previous tag comes
#       back in the rollback order (api + web, then worker), step file = switch-worker;
#   (l2) FB-R4-ARC-OPS-P402-01: the new worker dies after 1.5 s and Docker restarts it (`restart: unless-stopped`):
#       "running" at the check but RestartCount 1 → FAIL at switch-worker, api/web never on the new tag, previous back;
#   (l3) the worker passes the switch check but restarts before the smoke check → FAIL at smoke, previous back;
#   (l4) compose leaves the worker container as is (same id) with an older RestartCount 4 → no false FAIL (the count
#       is compared with the value read before the `up`);
#   (m) normal deploy, the new api/web never become healthy → previous api + web back first, then previous worker;
#   (n) normal deploy fails and the previous api/web do not come back either → the previous (older) worker is NOT
#       started while the newer api may still answer;
#   (o) every `dc up` of the switch names one group only (no `api worker web` line left in deploy.sh).
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
# STUB_WORKER_DOWN=1 = the worker is not running after the switch; STUB_WORKER_KEEP=1 = `up … worker` keeps the
# running container (same id), else each `up … worker` creates a new one (cid-worker-<n>, id kept in $STUB_STATE);
# STUB_PULL_FAIL=1 = the registry pull fails
# (deploy.sh stops through `set -e`, without a FAIL line); STUB_UP_FAIL="<tag>/api <tag>/worker …" = that `dc up`
# group (api = "api web", worker = "worker") does not become healthy on that tag.
cat > "$home/infra/server/bin/dc" <<'DC'
#!/usr/bin/env bash
echo "dc[IMAGE_TAG=${IMAGE_TAG:-}] $*" >> "$STUB_CALLS"
a=" $* "
if [ "${STUB_PULL_FAIL:-0}" = 1 ] && [[ "$a" == *" pull "* ]]; then
  echo "Error response from daemon: Head \"https://ghcr.io/v2/example/ottimo-api/manifests/x\": dial tcp: i/o timeout" >&2
  exit 1
fi
if [[ "$a" == *" up --detach "* ]] && [ -n "${STUB_UP_FAIL:-}" ]; then
  grp=""
  case "$a" in *" api web ") grp=api ;; *" worker ") grp=worker ;; esac
  case " $STUB_UP_FAIL " in *" ${IMAGE_TAG:-}/$grp "*) echo "container ottimo-$grp is unhealthy" >&2; exit 1 ;; esac
fi
if [[ "$a" == *" up --detach "*" worker " ]] && [ "${STUB_WORKER_KEEP:-0}" != 1 ]; then
  n=$(cat "$STUB_STATE/worker_n" 2>/dev/null || echo 0); echo $((n + 1)) > "$STUB_STATE/worker_n"
fi
case "$a" in
  *" ps --all --quiet worker "*) echo "cid-worker-$(cat "$STUB_STATE/worker_n" 2>/dev/null || echo 0)" ;;
  *" config --format json "*) echo '{"secrets":{"booking_request_chat_webhook":{"file":"/dev/null"}}}' ;;
  *" --entrypoint node migrate "*) printf '%s' "${STUB_JOURNAL:-39}" ;;
  *" exec -T postgres sh -c "*)
    sql=$(cat)
    case "$sql" in
      *drizzle*) echo "${STUB_APPLIED:-39}" ;;
      *rolconfig*) echo 'idle_in_transaction_session_timeout=30s,statement_timeout=15s' ;;
    esac ;;
  *" exec -T api wget "*) echo '{"status":"ok"}' ;;
  *" ps -q "*) echo "cid-${*: -1}" ;;
  *" logs --no-color --since "*) echo '{"request":{"uri":"/g/[redacted]"}}' ;;
esac
exit 0
DC
# docker: the registry digests come from STUB_REGISTRY (file "api=…\nweb=…" per tag). Worker state (`{{.State.Running}}
# {{.RestartCount}}`): cid-worker-0 = the container running before the deploy, RestartCount STUB_WORKER_OLD_RESTARTS
# (default 0); a container created by the deploy is not running when STUB_WORKER_DOWN=1, and its RestartCount is read
# from STUB_WORKER_RESTARTS – "0 1" = 0 at the first read, 1 from the second on (the last value stays).
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
    if [[ "$*" == *RestartCount* ]]; then
      if [ "${*: -1}" = cid-worker-0 ]; then echo "true ${STUB_WORKER_OLD_RESTARTS:-0}"; exit 0; fi
      read -r -a seq <<<"${STUB_WORKER_RESTARTS:-0}"
      i=$(cat "$STUB_STATE/rc_reads" 2>/dev/null || echo 0); echo $((i + 1)) > "$STUB_STATE/rc_reads"
      [ "$i" -lt "${#seq[@]}" ] || i=$((${#seq[@]} - 1))
      if [ "${STUB_WORKER_DOWN:-0}" = 1 ]; then echo "false ${seq[$i]}"; else echo "true ${seq[$i]}"; fi
      exit 0
    fi
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
  rm -rf "$work/stubstate"; mkdir -p "$work/stubstate"
}
run() { # command…  → out, rc (as on the VPS: no OTTIMO_HOME, the marker decides)
  rc=0
  out=$(env -u OTTIMO_HOME PATH="$stubs:$PATH" STUB_CALLS="$calls" STUB_STATE="$work/stubstate" STUB_REGISTRY="$registry" "$@" 2>&1) || rc=$?
}
rb="$home/infra/server/bin/rollback.sh"
switched() { grep -qE -- " up --detach --wait --wait-timeout 240 (--remove-orphans )?(api web|worker)\$" "$calls"; }
# The switch `dc up` calls (timeout 240) in order, as "<tag> <services>;" – restore_previous (timeout 180) left out.
ups() {
  sed -nE 's/^dc\[IMAGE_TAG=([^]]*)\] up --detach --wait --wait-timeout 240 (--remove-orphans )?(api web|worker)$/\1 \3/p' "$calls" \
    | tr '\n' ';'
}
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
  && [ "$(ups)" = "$OLD api web;$OLD worker;" ] \
  && ! grep -q 'putting previous tag' <<<"$out"; then
  ok "(b) rollback.sh $OLD → recorded digests checked, migrate no-op, api + web then worker on $OLD, smoke ok"
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

# ---------- (j) rollback order: api + web first, then the worker ----------
reset_state
run "$rb" "$OLD"
if [ "$rc" -eq 0 ] && [ "$(ups)" = "$OLD api web;$OLD worker;" ] \
  && grep -q "dc\[IMAGE_TAG=$OLD\] up --detach --wait --wait-timeout 240 --remove-orphans api web\$" "$calls" \
  && grep -q "dc\[IMAGE_TAG=$OLD\] up --detach --wait --wait-timeout 240 worker\$" "$calls"; then
  ok "(j) rollback switch order: 'api web' then 'worker' (both $OLD, --remove-orphans on the first)"
else ko "(j) rc=$rc ups=$(ups)"; fi

# Normal deploy of NEW on a production stack running OLD (digests given as the CI release job does).
reset_deploy_state() { reset_state; echo "$OLD" > "$home/state/current_tag"; rm -f "$home/state/previous_tag"; }
deploy_new() { run env OTTIMO_STEP_FILE="$work/step" "$home/infra/server/bin/deploy.sh" "$NEW" --api-digest "$A_NEW" --web-digest "$W_NEW"; }

# ---------- (k) normal deploy order: worker first, then api + web ----------
reset_deploy_state
deploy_new
if [ "$rc" -eq 0 ] && grep -q "OK: $NEW is live" <<<"$out" && [ "$(ups)" = "$NEW worker;$NEW api web;" ] \
  && grep -q "dc\[IMAGE_TAG=$NEW\] up --detach --wait --wait-timeout 240 --remove-orphans worker\$" "$calls" \
  && [ "$(cat "$home/state/current_tag")" = "$NEW" ] && [ "$(cat "$home/state/previous_tag")" = "$OLD" ] \
  && [ "$(grep -c '^\[deploy ' <<<"$out")" = 6 ]; then
  ok "(k) deploy switch order: 'worker' then 'api web' ($NEW), still 6 [deploy] lines for the INV sheets"
else ko "(k) rc=$rc ups=$(ups): $out"; fi
# the worker must be up (and checked) before api/web are touched: the running check sits between the two `up` calls
wk=$(grep -n " up --detach --wait --wait-timeout 240 --remove-orphans worker\$" "$calls" | head -n 1 | cut -d: -f1 || true)
ck=$(grep -n "^docker inspect .*RestartCount}} cid-worker-[1-9]" "$calls" | head -n 1 | cut -d: -f1 || true)
ap=$(grep -n " up --detach --wait --wait-timeout 240 api web\$" "$calls" | head -n 1 | cut -d: -f1 || true)
if [ -n "$wk" ] && [ -n "$ck" ] && [ -n "$ap" ] && [ "$wk" -lt "$ck" ] && [ "$ck" -lt "$ap" ]; then
  ok "(k) worker RestartCount check of the new container (line $ck) between 'up worker' (line $wk) and 'up api web' (line $ap)"
else ko "(k) call lines: up worker=$wk, inspect worker=$ck, up api web=$ap"; fi
# the smoke step reads the same (new) container again: two reads of cid-worker-1, none of another new container
if [ "$(grep -c "^docker inspect .*RestartCount}} cid-worker-1\$" "$calls")" = 2 ] \
  && ! grep -q "^docker inspect .*RestartCount}} cid-worker-[2-9]" "$calls"; then
  ok "(k) smoke re-checks the same worker container (2 RestartCount reads of cid-worker-1)"
else ko "(k) RestartCount reads: $(grep 'RestartCount' "$calls" | tr '\n' ';')"; fi

# ---------- (l) new worker dies at start → FAIL before api/web change, previous back in rollback order ----------
reset_deploy_state
STUB_WORKER_DOWN=1 deploy_new
if [ "$rc" -ne 0 ] && grep -q 'FAIL: worker is not running after the switch' <<<"$out" \
  && ! grep -q "dc\[IMAGE_TAG=$NEW\] up .* api web\$" "$calls" \
  && [ "$(ups)" = "$NEW worker;" ] \
  && grep -q "dc\[IMAGE_TAG=$OLD\] up --detach --wait --wait-timeout 180 api web\$" "$calls" \
  && [ "$(grep -n "IMAGE_TAG=$OLD\] up --detach --wait --wait-timeout 180 api web\$" "$calls" | cut -d: -f1)" \
     -lt "$(grep -n "IMAGE_TAG=$OLD\] up --detach --wait --wait-timeout 180 worker\$" "$calls" | cut -d: -f1)" ] \
  && [ "$(cat "$work/step")" = switch-worker ] && [ "$(cat "$home/state/current_tag")" = "$OLD" ]; then
  ok "(l) new worker down → FAIL at step switch-worker, api/web never on $NEW, $OLD api + web then worker put back"
else ko "(l) rc=$rc step=$(cat "$work/step" 2>/dev/null) ups=$(ups): $out"; fi

# restore order of the previous tag (timeout 180) as "api web;worker;"
restored() { sed -nE "s/^dc\[IMAGE_TAG=$OLD\] up --detach --wait --wait-timeout 180 (api web|worker)\$/\1/p" "$calls" | tr '\n' ';'; }

# ---------- (l2) new worker dies after 1.5 s, Docker restarts it: "running" but RestartCount 1 ----------
reset_deploy_state
STUB_WORKER_RESTARTS=1 deploy_new
if [ "$rc" -ne 0 ] && grep -q 'FAIL: worker restarted 1 time(s) (crash loop?) – see dc logs worker after the switch' <<<"$out" \
  && ! grep -q "dc\[IMAGE_TAG=$NEW\] up .* api web\$" "$calls" && [ "$(ups)" = "$NEW worker;" ] \
  && [ "$(restored)" = "api web;worker;" ] \
  && [ "$(cat "$work/step")" = switch-worker ] && [ "$(cat "$home/state/current_tag")" = "$OLD" ]; then
  ok "(l2) worker restarted once by Docker (running at the check) → FAIL at switch-worker, api/web never on $NEW, $OLD back"
else ko "(l2) rc=$rc step=$(cat "$work/step" 2>/dev/null) ups=$(ups) restore=$(restored): $out"; fi

# ---------- (l3) worker restarts after the switch check, before the smoke check ----------
reset_deploy_state
STUB_WORKER_RESTARTS="0 1" deploy_new
if [ "$rc" -ne 0 ] && grep -q 'FAIL: worker restarted 1 time(s)' <<<"$out" && ! grep -q 'after the switch' <<<"$out" \
  && [ "$(ups)" = "$NEW worker;$NEW api web;" ] && [ "$(restored)" = "api web;worker;" ] \
  && [ "$(cat "$work/step")" = smoke ] && [ "$(cat "$home/state/current_tag")" = "$OLD" ]; then
  ok "(l3) worker restarted between the switch and smoke → FAIL at smoke, $OLD put back as 'api web' then 'worker'"
else ko "(l3) rc=$rc step=$(cat "$work/step" 2>/dev/null) ups=$(ups) restore=$(restored): $out"; fi

# ---------- (l4) worker container left as is, older RestartCount 4 → no false FAIL ----------
reset_deploy_state
STUB_WORKER_KEEP=1 STUB_WORKER_OLD_RESTARTS=4 deploy_new
if [ "$rc" -eq 0 ] && grep -q "OK: $NEW is live" <<<"$out" && [ "$(grep -c '^\[deploy ' <<<"$out")" = 6 ]; then
  ok "(l4) same worker container with RestartCount 4 before the up and after → accepted (no false FAIL)"
else ko "(l4) rc=$rc: $out"; fi

# ---------- (m) new api/web unhealthy → previous api + web, then previous worker ----------
reset_deploy_state
STUB_UP_FAIL="$NEW/api" deploy_new
restore=$(sed -nE "s/^dc\[IMAGE_TAG=$OLD\] up --detach --wait --wait-timeout 180 (api web|worker)\$/\1/p" "$calls" | tr '\n' ';')
if [ "$rc" -ne 0 ] && grep -q 'FAIL: api/web did not become healthy' <<<"$out" && grep -q "putting previous tag $OLD back" <<<"$out" \
  && [ "$(ups)" = "$NEW worker;$NEW api web;" ] && [ "$restore" = "api web;worker;" ] \
  && [ "$(cat "$work/step")" = switch-api ] && [ "$(cat "$home/state/current_tag")" = "$OLD" ]; then
  ok "(m) new api/web unhealthy → FAIL at step switch-api, $OLD put back as 'api web' then 'worker'"
else ko "(m) rc=$rc step=$(cat "$work/step" 2>/dev/null) ups=$(ups) restore=$restore: $out"; fi

# ---------- (n) previous api/web do not come back → previous worker NOT started ----------
reset_deploy_state
STUB_UP_FAIL="$NEW/api $OLD/api" deploy_new
if [ "$rc" -ne 0 ] && grep -q 'WARNING: previous api/web did not come back healthy – worker left as is' <<<"$out" \
  && ! grep -q "dc\[IMAGE_TAG=$OLD\] up .* worker\$" "$calls"; then
  ok "(n) previous api/web unhealthy → older worker not started next to the newer api"
else ko "(n) rc=$rc: $out"; fi

# ---------- (o) no combined switch left in deploy.sh ----------
if ! grep -qE 'dc up[^#]*api worker|dc up[^#]*worker web' "$home/infra/server/bin/deploy.sh"; then
  ok "(o) deploy.sh has no 'dc up … api worker …' (one group per up)"
else ko "(o) deploy.sh still switches api and worker in one 'dc up'"; fi

# ---------- (i) the INV sheet's R4 command itself (SEC FB-R4-SEC-OPS-PR26-01) ----------
# The remote part of R4 is read from the sheet (so the test follows the document), the server path replaced by this
# fake stack's rollback.sh and `sudo -u ottimo` dropped. Every outcome must end with "MA THOAT: <n>", and the lines
# INV needs (another deploy, registry error) must survive the filter.
sheet="$here/../../../../rounds/round-04/outputs/OPS/v1.0.1-inv-commands.md"
if [ -r "$sheet" ]; then
  r4=$(grep -F 'rollback.sh sha-8b3aec89486f 2>&1' "$sheet" | grep -F 'ssh -t' | head -n 1)
  r4=${r4#*\'}; r4=${r4%\'}
  r4=${r4//sudo -u ottimo \/opt\/ottimo-prod\/infra\/server\/bin\/rollback.sh/$rb}
  r4run() { rc=0; out=$(env -u OTTIMO_HOME PATH="$stubs:$PATH" STUB_CALLS="$calls" STUB_STATE="$work/stubstate" STUB_REGISTRY="$registry" bash -c "$r4" 2>&1) || rc=$?; }
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
