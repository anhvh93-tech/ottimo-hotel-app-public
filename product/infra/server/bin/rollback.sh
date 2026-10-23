#!/usr/bin/env bash
# Put the previous image tag back (hosting-plan 6.3) – run as the deploy user.
#   rollback.sh            → previous tag recorded by deploy.sh
#   rollback.sh <tag>      → any older tag still in the registry
#   rollback.sh [<tag>] --no-pull   → images already on this host
# Images only: the database is NOT rolled back (forward-only migrations, "expand first, contract later"), so the older
# image must run on the newer schema – deploy.sh --rollback accepts a database ahead of the image's journal.
# Production: the digests recorded when <tag> was deployed (state/digests/<tag>) are checked again after the pull.
# Landing: deploy-landing.sh --rollback.
set -Eeuo pipefail
here=$(cd "$(dirname "$0")" && pwd)
if [ -z "${OTTIMO_HOME:-}" ] && [ -f "$here/../../../.ottimo-home" ]; then OTTIMO_HOME=$(cd "$here/../../.." && pwd); fi
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
export OTTIMO_HOME
target=""
if [ $# -gt 0 ] && [ "${1#--}" = "$1" ]; then target="$1"; shift; fi
if [ -z "$target" ]; then
  [ -r "$OTTIMO_HOME/state/previous_tag" ] || { echo "no previous tag recorded – pass one: $0 <tag>" >&2; exit 2; }
  target=$(cat "$OTTIMO_HOME/state/previous_tag")
fi
# remaining options (e.g. --no-pull) go to deploy.sh
exec "$here/deploy.sh" "$target" --rollback "$@"
