#!/usr/bin/env bash
# Server wrapper of the ONE-TIME production initialisation (R3-OPS-02, BE-A `production-bootstrap-cli.js`; README 12.1).
# Run on the VPS as the deploy user, from an INTERACTIVE terminal (the first owner's temporary password is printed
# once on this screen):
#   /opt/ottimo-prod/infra/server/bin/production-bootstrap.sh --owner-username <login> --owner-name "<name>" \
#     --operator <who runs it>
# FB-R3-SEC-BOOT-01: the CLI checks for a TTY inside the container, but `docker compose exec` gives the container a
# TTY even when this side is piped into `tee` or recorded by `script` – so this wrapper refuses unless its OWN stdin
# and stdout are terminals, and refuses inside tmux/screen (scrollback / logging may keep the password).
set -Eeuo pipefail
here=$(cd "$(dirname "$0")" && pwd)
if [ -z "${OTTIMO_HOME:-}" ] && [ -f "$here/../../../.ottimo-home" ]; then OTTIMO_HOME=$(cd "$here/../../.." && pwd); fi
export OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"

[ -t 0 ] && [ -t 1 ] || { echo "run from an interactive terminal – no pipe, no redirection, no tee/script" >&2; exit 2; }
[ -z "${TMUX:-}${STY:-}" ] || { echo "run outside tmux/screen (their scrollback or logs could keep the password)" >&2; exit 2; }
[ -n "$(OTTIMO_HOME="$OTTIMO_HOME" "$here/dc" ps --status running --quiet api 2>/dev/null)" ] \
  || { echo "api is not running in $OTTIMO_HOME – deploy first (deploy.sh runs the migrations)" >&2; exit 2; }
echo "After the password appears: hand it over in person, then run 'clear' and close this SSH session."
# No -T: the CLI itself also requires a TTY and prints nothing but ok/refused and the password.
exec "$here/dc" exec api node dist/admin/production-bootstrap-cli.js "$@"
