#!/usr/bin/env bash
# Tests for infra/server/bin/deploy-from-ci.sh (SEC s4-SEC.md E.8, R5-01 – the Actions log of the public repo):
#   (a) a deploy that fails (image tag missing on GHCR: the real deploy.sh with a stub `dc` whose pull fails loudly)
#       → the CI sees exactly ONE line "deploy <tag>: failed (step=pull, ref=<ref>)", exit ≠ 0, and the full output
#       (with the noisy error text) is only in the 0600 log on the server;
#   (b) any other command → "refused", exit 2, deploy.sh never runs (also `-test` tags and shell tricks);
#   (c) a successful deploy → exactly one line "deploy <tag>: ok", exit 0; only the 30 newest logs are kept.
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
  "deploy  sha-0123456789ab" "rsync --server ." "scp -t /opt/ottimo" "deploy latest" "rollback"; do
  run ok "$c"
  if [ "$rc" -eq 2 ] && [ "$out" = "refused: only 'deploy sha-<hex>' is allowed for this key" ]; then
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

if [ "$fails" -gt 0 ]; then echo "FAILED: $fails check(s)"; exit 1; fi
echo "OK: deploy-from-ci.sh – one summary line to the CI, full log on the server, other commands refused"
