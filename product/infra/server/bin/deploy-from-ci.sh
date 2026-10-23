#!/usr/bin/env bash
# Forced command for the CI deploy key (infra/server/README.md "Deploy tự động từ CI"). In
# ~ottimo/.ssh/authorized_keys the CI key is restricted to this script:
#   command="/opt/ottimo/infra/server/bin/deploy-from-ci.sh",restrict ssh-ed25519 AAAA… ottimo-ci-deploy
# Whatever the client asks, only these are executed (R3 v1.0 adds the digests and the landing):
#   deploy sha-<7..40 hex>                                              app (staging)
#   deploy sha-<7..40 hex> api=sha256:<64 hex> web=sha256:<64 hex>      app pinned to the released digests (production)
#   landing sha-<7..40 hex> [landing=sha256:<64 hex>]                   landing site (deploy-landing.sh)
# The CI can never pick a `-test` image (that switch is a manual .env change – R5-04), open a shell, copy files, or
# change compose/Caddy files or secrets. Production: this file is /opt/ottimo-prod/infra/server/bin/deploy-from-ci.sh
# (its own CI key, environment `production`); the stack is the one this copy belongs to (.ottimo-home marker).
#
# The repository is public, so the Actions log is public (SEC s4-SEC.md E.8, R5-01): the full deploy.sh output goes
# to a log file on this server only (state/deploy-logs/, owner = deploy user, 0600, last 30 kept); the CI receives
# exactly one line:  <deploy|landing> <tag>: ok   |   <deploy|landing> <tag>: failed (step=<step>, ref=<ref>)
# <step> is a fixed step name written by deploy.sh, <ref> names the log file – never an IP, a path or error text.
set -Eeuo pipefail
here=$(cd "$(dirname "$0")" && pwd)
if [ -z "${OTTIMO_HOME:-}" ] && [ -f "$here/../../../.ottimo-home" ]; then OTTIMO_HOME=$(cd "$here/../../.." && pwd); fi
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
export OTTIMO_HOME
cmd="${SSH_ORIGINAL_COMMAND:-}"

hex='sha-[0-9a-f]{7,40}'
dg='sha256:[0-9a-f]{64}'
args=()
if [[ "$cmd" =~ ^deploy\ ($hex)$ ]]; then
  kind=deploy; tag="${BASH_REMATCH[1]}"
elif [[ "$cmd" =~ ^deploy\ ($hex)\ api=($dg)\ web=($dg)$ ]]; then
  kind=deploy; tag="${BASH_REMATCH[1]}"; args=(--api-digest "${BASH_REMATCH[2]}" --web-digest "${BASH_REMATCH[3]}")
elif [[ "$cmd" =~ ^landing\ ($hex)$ ]]; then
  kind=landing; tag="${BASH_REMATCH[1]}"
elif [[ "$cmd" =~ ^landing\ ($hex)\ landing=($dg)$ ]]; then
  kind=landing; tag="${BASH_REMATCH[1]}"; args=(--digest "${BASH_REMATCH[2]}")
else
  echo "refused: only 'deploy sha-<hex> [api=… web=…]' or 'landing sha-<hex> [landing=…]' is allowed for this key"
  logger -t ottimo-deploy -- "refused CI command (not shown)" 2>/dev/null || true
  exit 2
fi
script="$here/deploy.sh"
[ "$kind" = "landing" ] && script="$here/deploy-landing.sh"

umask 077
logs="$OTTIMO_HOME/state/deploy-logs"
mkdir -p "$logs"
ref="$(date -u +%Y%m%dT%H%M%SZ)-$(od -An -N3 -tx1 /dev/urandom | tr -d ' \n')"
logfile="$logs/ci-$ref.log"
stepfile="$logs/.step-$ref"
: > "$logfile"
chmod 0600 "$logfile"

rc=0
OTTIMO_STEP_FILE="$stepfile" "$script" "$tag" ${args[@]+"${args[@]}"} >>"$logfile" 2>&1 </dev/null || rc=$?

step="unknown"
if [ -r "$stepfile" ]; then
  s=$(head -c 32 "$stepfile" | tr -cd 'a-z-')
  [ -n "$s" ] && step="$s"
fi
rm -f "$stepfile"
# Keep the 30 newest CI deploy logs.
# shellcheck disable=SC2012  # names are ci-<UTC time>-<hex>.log, written by this script only
ls -1t "$logs"/ci-*.log 2>/dev/null | tail -n +31 | while IFS= read -r old; do rm -f -- "$old"; done

if [ "$rc" -eq 0 ]; then
  logger -t ottimo-deploy -- "CI $kind $tag ok (ref=$ref)" 2>/dev/null || true
  echo "$kind $tag: ok"
  exit 0
fi
logger -t ottimo-deploy -- "CI $kind $tag failed (step=$step, ref=$ref)" 2>/dev/null || true
echo "$kind $tag: failed (step=$step, ref=$ref)"
exit 1
