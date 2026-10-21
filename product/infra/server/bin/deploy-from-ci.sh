#!/usr/bin/env bash
# Forced command for the CI deploy key (infra/server/README.md "Deploy tự động từ CI"). In
# ~ottimo/.ssh/authorized_keys the CI key is restricted to this script:
#   command="/opt/ottimo/infra/server/bin/deploy-from-ci.sh",restrict ssh-ed25519 AAAA… ottimo-ci-deploy
# Whatever the client asks, only `deploy sha-<7..40 hex>` is executed. The CI can never pick a `-test` image (that
# switch is a manual .env change – R5-04), open a shell, copy files, or change compose/Caddy files or secrets.
#
# The repository is public, so the Actions log is public (SEC s4-SEC.md E.8, R5-01): the full deploy.sh output goes
# to a log file on this server only (state/deploy-logs/, owner = deploy user, 0600, last 30 kept); the CI receives
# exactly one line:  deploy <tag>: ok   |   deploy <tag>: failed (step=<step>, ref=<ref>)
# <step> is a fixed step name written by deploy.sh, <ref> names the log file – never an IP, a path or error text.
set -Eeuo pipefail
here=$(cd "$(dirname "$0")" && pwd)
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
cmd="${SSH_ORIGINAL_COMMAND:-}"

if ! [[ "$cmd" =~ ^deploy\ (sha-[0-9a-f]{7,40})$ ]]; then
  echo "refused: only 'deploy sha-<hex>' is allowed for this key"
  logger -t ottimo-deploy -- "refused CI command (not shown)" 2>/dev/null || true
  exit 2
fi
tag="${BASH_REMATCH[1]}"

umask 077
logs="$OTTIMO_HOME/state/deploy-logs"
mkdir -p "$logs"
ref="$(date -u +%Y%m%dT%H%M%SZ)-$(od -An -N3 -tx1 /dev/urandom | tr -d ' \n')"
logfile="$logs/ci-$ref.log"
stepfile="$logs/.step-$ref"
: > "$logfile"
chmod 0600 "$logfile"

rc=0
OTTIMO_STEP_FILE="$stepfile" "$here/deploy.sh" "$tag" >>"$logfile" 2>&1 </dev/null || rc=$?

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
  logger -t ottimo-deploy -- "CI deploy $tag ok (ref=$ref)" 2>/dev/null || true
  echo "deploy $tag: ok"
  exit 0
fi
logger -t ottimo-deploy -- "CI deploy $tag failed (step=$step, ref=$ref)" 2>/dev/null || true
echo "deploy $tag: failed (step=$step, ref=$ref)"
exit 1
