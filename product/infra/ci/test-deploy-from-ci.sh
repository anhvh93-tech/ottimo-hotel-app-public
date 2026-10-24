#!/usr/bin/env bash
# Tests for infra/server/bin/deploy-from-ci.sh (SEC s4-SEC.md E.8, R5-01 – the Actions log of the public repo):
#   (a) a deploy that fails (image tag missing on GHCR: the real deploy.sh with a stub `dc` whose pull fails loudly)
#       → the CI sees exactly ONE line "deploy <tag>: failed (step=pull, ref=<ref>)", exit ≠ 0, and the full output
#       (with the noisy error text) is only in the 0600 log on the server;
#   (b) any other command → "refused", exit 2, deploy.sh never runs (also `-test` tags and shell tricks);
#   (c) a successful deploy → exactly one line "deploy <tag>: ok", exit 0; only the 30 newest logs are kept.
#   R3 v1.0 (production on the same VPS, v1-production.md 5):
#   (d) `deploy sha-… api=sha256:… web=sha256:…` reaches deploy.sh as --api-digest/--web-digest; the stack is the one the
#       script copy belongs to (.ottimo-home marker, no OTTIMO_HOME given) – the production copy acts on production;
#   (e) `landing sha-… [landing=sha256:…]` runs deploy-landing.sh (with --digest), one line "landing <tag>: ok";
#   (f) the production guard of the REAL deploy.sh stops at step=config: MFA_ENFORCED≠true, a -test suffix, missing
#       digests, the production home or EDGE_NAME=production with APP_ENV≠production (SEC OPS-03) – before any pull;
#       a missing secret file also stops at step=config.
# Runs on Linux (CI: job infra-scripts). Needs flock (util-linux) like deploy.sh itself.
set -Eeuo pipefail

src=$(cd "$(dirname "$0")/../server/bin" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
fails=0
ok() { echo "ok   $*"; }
bad() { echo "FAIL $*"; fails=$((fails + 1)); }

# Server layout: <home>/infra/server/bin/{deploy-from-ci.sh,deploy.sh,dc}, <home>/infra/caddy, <home>/.env, <home>/state
home="$work/opt"
mkdir -p "$home/infra/server/bin" "$home/infra/caddy" "$home/state"
cp "$src/deploy-from-ci.sh" "$src/deploy.sh" "$home/infra/server/bin/"
: > "$home/infra/caddy/expected-headers.sh"
printf 'DESK_HOST=desk.staging.example.invalid\n' > "$home/.env"
secret_marker="LEAKMARK-203.0.113.77-/opt/ottimo/secrets/data_kek_current"
# Stub `dc`: `pull` fails like a missing GHCR tag (noisy, with an IP and a path) when STUB_MODE=fail-pull.
cat > "$home/infra/server/bin/dc" <<EOF
#!/usr/bin/env bash
if [[ " \$* " == *" config --format json "* ]]; then echo "{\"secrets\":{\"x\":{\"file\":\"\${STUB_SECRET:-/dev/null}\"}}}"; exit 0; fi
echo "dc \$*"
if [ "\${STUB_MODE:-}" = "fail-pull" ] && [[ " \$* " == *" pull "* ]]; then
  echo "Error response from daemon: manifest unknown: ghcr.io/x/ottimo-api:\$IMAGE_TAG $secret_marker" >&2
  exit 1
fi
exit 0
EOF
chmod +x "$home/infra/server/bin/"*
# For case (c): replace deploy.sh by a stub that succeeds (the real smoke needs Docker + Caddy).
run() { # mode  ssh-original-command  → sets out, rc
  local mode="$1"
  rc=0
  out=$(OTTIMO_HOME="$home" STUB_MODE="$mode" SSH_ORIGINAL_COMMAND="$2" "$home/infra/server/bin/deploy-from-ci.sh" 2>&1) || rc=$?
}
lines() { if [ -z "$1" ]; then echo 0; else printf '%s\n' "$1" | wc -l | tr -d ' '; fi; }
perm_of() { stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1"; }

# ---------- (a) failing deploy ----------
run fail-pull "deploy sha-0123456789ab"
if [ "$rc" -ne 0 ] && [ "$(lines "$out")" = 1 ] &&
  [[ "$out" =~ ^deploy\ sha-0123456789ab:\ failed\ \(step=pull,\ ref=[0-9]{8}T[0-9]{6}Z-[0-9a-f]{6}\)$ ]]; then
  ok "(a) failed deploy → one summary line, exit $rc: $out"
else
  bad "(a) failed deploy → rc=$rc, output: $out"
fi
grep -qF "$secret_marker" <<<"$out" && bad "(a) error text reached the CI output"
ref=${out##*ref=}; ref=${ref%)}
log="$home/state/deploy-logs/ci-$ref.log"
if [ -f "$log" ] && grep -qF "$secret_marker" "$log" && grep -qF 'deploy sha-0123456789ab' "$log"; then
  ok "(a) full output is in the server log ci-$ref.log"
else
  bad "(a) server log $log missing or without the deploy output"
fi
[ "$(perm_of "$log")" = "600" ] && ok "(a) server log mode 0600" || bad "(a) server log mode $(perm_of "$log")"
if compgen -G "$home/state/deploy-logs/.step-*" >/dev/null; then bad "(a) step file left behind"; else ok "(a) no step file left"; fi

# ---------- (b) anything else is refused (exit 2) and deploy.sh does not run ----------
before=$(ls "$home/state/deploy-logs" | wc -l | tr -d ' ')
for c in "" "bash" "deploy" "deploy sha-0123456789ab-test" "deploy sha-XYZ1234" "deploy sha-01234" \
  "deploy sha-0123456789ab; id" "deploy sha-0123456789ab && id" $'deploy sha-0123456789ab\nid' \
  "deploy  sha-0123456789ab" "rsync --server ." "scp -t /opt/ottimo" "deploy latest" "rollback" \
  "deploy sha-0123456789ab api=sha256:abc web=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" "deploy sha-0123456789ab web=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb api=sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "deploy sha-0123456789ab api=sha256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA web=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" "deploy sha-0123456789ab api=sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "deploy sha-0123456789ab api=sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa web=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb; id" "landing" "landing latest" \
  "landing sha-0123456789ab-test" "landing sha-0123456789ab landing=sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc x" "landing sha-0123456789ab --rollback"; do
  run ok "$c"
  if [ "$rc" -eq 2 ] && [ "$out" = "refused: only 'deploy sha-<hex> [api=… web=…]' or 'landing sha-<hex> [landing=…]' is allowed for this key" ]; then
    ok "(b) refused, exit 2: $(printf '%q' "$c")"
  else
    bad "(b) $(printf '%q' "$c") → rc=$rc, output: $out"
  fi
done
after=$(ls "$home/state/deploy-logs" | wc -l | tr -d ' ')
[ "$before" = "$after" ] && ok "(b) no deploy ran for refused commands" || bad "(b) a refused command started a deploy"

# ---------- (c) success → one line; pruning keeps 30 logs ----------
cat > "$home/infra/server/bin/deploy.sh" <<'EOF'
#!/usr/bin/env bash
[ -n "${OTTIMO_STEP_FILE:-}" ] && echo record > "$OTTIMO_STEP_FILE"
echo "lots of compose output 10.0.0.5 /opt/ottimo/.env"
exit 0
EOF
chmod +x "$home/infra/server/bin/deploy.sh"
for i in $(seq 1 35); do touch -t "202601010000.$(printf '%02d' "$i")" "$home/state/deploy-logs/ci-20260101T0000$(printf '%02d' "$i")Z-aaaaaa.log"; done
run ok "deploy sha-abcdef1"
if [ "$rc" -eq 0 ] && [ "$out" = "deploy sha-abcdef1: ok" ]; then ok "(c) success → one line: $out"; else bad "(c) rc=$rc, output: $out"; fi
n=$(ls "$home/state/deploy-logs"/ci-*.log | wc -l | tr -d ' ')
[ "$n" = 30 ] && ok "(c) 30 newest CI logs kept" || bad "(c) $n CI logs kept (expected 30)"

# ---------- (d)+(e) digests, landing, stack from the marker ----------
prod="$work/opt-prod"
mkdir -p "$prod/infra/server/bin" "$prod/state"
echo production > "$prod/.ottimo-home"
cp "$src/deploy-from-ci.sh" "$prod/infra/server/bin/"
for s in deploy.sh deploy-landing.sh; do
  cat > "$prod/infra/server/bin/$s" <<'EOF'
#!/usr/bin/env bash
echo "$(basename "$0") home=$OTTIMO_HOME args=$*" > "$OTTIMO_HOME/state/called"
exit 0
EOF
done
chmod +x "$prod/infra/server/bin/"*
A=sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa; B=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb; C=sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
runp() { rc=0; out=$(env -u OTTIMO_HOME SSH_ORIGINAL_COMMAND="$1" "$prod/infra/server/bin/deploy-from-ci.sh" 2>&1) || rc=$?; }
runp "deploy sha-0123456789ab api=$A web=$B"
called=$(cat "$prod/state/called" 2>/dev/null || true)
if [ "$rc" -eq 0 ] && [ "$out" = "deploy sha-0123456789ab: ok" ] && \
  [ "$called" = "deploy.sh home=$prod args=sha-0123456789ab --api-digest $A --web-digest $B" ]; then
  ok "(d) digests passed to deploy.sh; stack = the copy's own home (marker)"
else bad "(d) rc=$rc out=$out called=$called"; fi
runp "landing sha-0123456789ab landing=$C"
called=$(cat "$prod/state/called" 2>/dev/null || true)
if [ "$rc" -eq 0 ] && [ "$out" = "landing sha-0123456789ab: ok" ] && \
  [ "$called" = "deploy-landing.sh home=$prod args=sha-0123456789ab --digest $C" ]; then
  ok "(e) landing → deploy-landing.sh --digest, one line"
else bad "(e) rc=$rc out=$out called=$called"; fi
runp "landing sha-abcdef1"
called=$(cat "$prod/state/called" 2>/dev/null || true)
[ "$rc" -eq 0 ] && [ "$called" = "deploy-landing.sh home=$prod args=sha-abcdef1" ] && ok "(e) landing without digest" || bad "(e) $called"

# ---------- (f) production guard of the real deploy.sh (stub dc: any pull would be logged) ----------
cp "$src/deploy.sh" "$home/infra/server/bin/deploy.sh"
guard() { # description  expected-step  extra-deploy-args  .env lines…
  local what="$1" want="$2" args="$3"; shift 3
  printf '%s\n' "$@" > "$home/.env"
  rc=0
  out=$(OTTIMO_HOME="$home" STUB_MODE=ok SSH_ORIGINAL_COMMAND="deploy sha-0123456789ab$args" \
    "$home/infra/server/bin/deploy-from-ci.sh" 2>&1) || rc=$?
  local ref=${out##*ref=}; ref=${ref%)}
  if [ "$rc" -ne 0 ] && [[ "$out" == *"failed (step=$want,"* ]] && ! grep -q ' pull ' "$home/state/deploy-logs/ci-$ref.log"; then
    ok "(f) $what → step=$want, nothing pulled"
  else bad "(f) $what → rc=$rc $out"; fi
}
P=(APP_ENV=production CLOCK_MODE=system INCLUDE_TEST_SUPPORT=0 API_IMAGE=ghcr.io/x/ottimo-api WEB_IMAGE=ghcr.io/x/ottimo-web)
guard "production with MFA_ENFORCED=false" config " api=$A web=$B" "${P[@]}" MFA_ENFORCED=false
guard "production with a -test image suffix" config " api=$A web=$B" "${P[@]}" MFA_ENFORCED=true API_TAG_SUFFIX=-test
guard "production without digests" config "" "${P[@]}" MFA_ENFORCED=true
STUB_SECRET=/nonexistent/web_push_vapid_private_key guard "missing secret file" config " api=$A web=$B" "${P[@]}" MFA_ENFORCED=true
export STUB_SECRET=/dev/null
# FB-R3-SEC-OPS-03: the production stack (marker / EDGE_NAME) with a mistyped APP_ENV is refused.
echo production > "$home/.ottimo-home"
guard "production home (marker) with APP_ENV=staging" config " api=$A web=$B" APP_ENV=staging MFA_ENFORCED=true
guard "production with LANDING_BASE_URL over http" config " api=$A web=$B" "${P[@]}" MFA_ENFORCED=true EDGE_NAME=production \
  LANDING_BASE_URL=http://ottimo.vn
guard "LANDING_PUBLIC_API=on without the matching https LANDING_BASE_URL" config " api=$A web=$B" "${P[@]}" MFA_ENFORCED=true \
  EDGE_NAME=production LANDING_HOST=ottimo.vn LANDING_PUBLIC_API=on LANDING_BASE_URL=https://www.ottimo.vn
rm -f "$home/.ottimo-home"
guard "EDGE_NAME=production with APP_ENV=staging" config "" APP_ENV=staging EDGE_NAME=production MFA_ENFORCED=true

if [ "$fails" -gt 0 ]; then echo "FAILED: $fails check(s)"; exit 1; fi
echo "OK: deploy-from-ci.sh – one summary line to the CI, full log on the server, other commands refused, digests/landing/production guard"
