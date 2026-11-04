#!/usr/bin/env bash
# One SMTP check of a stack through the worker's real path (infra/server/mail-test.mjs) – runs on the OPS/INV Mac, NOT
# on the VPS. v1.0.3 (plan-v1.0.3 V3-05, ARC v1.0.3 tech plan 2.9): the recipient is never an argument.
#   mail-test.sh --ssh ottimo-admin@desk.ottimo.vn --stack production --verify-only
#       connect + EHLO + STARTTLS only, nothing is sent, no address asked (the default check)
#   mail-test.sh --ssh ottimo-admin@desk.ottimo.vn --stack production --send
#       asks for the recipient at a hidden prompt (read -rs: not echoed, not in shell history, not in any argv – Mac
#       or VPS), then sends one test message. Only the person who owns the mailbox types it (INV for a private one).
# v1.0.4 (ARC FB-R4-ARC-OPS-PR30-10): the address is the ONLY line of the ssh stdin; it goes straight through sudo
# and `dc run -T` to the one-off worker container, where mail-test.mjs reads it from its stdin. mail-test.mjs itself
# travels base64-encoded inside the ssh command (`node -e`, no address, no secret in it). So the address is in no
# argument, no shell variable on the VPS and no container environment (`docker inspect` Config.Env,
# /proc/<pid>/environ). These scripts write nothing to disk. Two things outside them can, and must be checked (SEC
# PR30-04/05, runbook P2b + K8): sudo I/O logging (`log_input`/`log_stdin`… in sudoers would record the stdin with
# the address – must stay off, README 12.1); and a one-off `worker-run` container left behind when the client dies
# (ssh lost, Ctrl-C) – removed with `docker rm -f`, never `inspect`.
# Output: the one line of mail-test.mjs ("mail-test: verified" | "sent" | "failed (<code>)") – never the address.
# --key (default ~/.ssh/ottimo_ops): the personal admin key on THIS Mac (as in the v1.0.1 commands), never the CI
# key; never copy a key to another machine to run this.
# MAIL_TEST_READ_STDIN=1 + MTS_DIR + the `ssh` found first in PATH being exactly $MTS_DIR/bin/ssh (tests only, the
# fake ssh of test/mail-test-send.test.sh – SEC FB-R4-SEC-OPS-PR30-10): read the address from a non-terminal stdin.
# With the real ssh this door stays shut. Not for manual use – a piped address lands in the shell history.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
mjs="$here/../mail-test.mjs"
ssh_to="" stack="" mode="" key="${HOME}/.ssh/ottimo_ops"
usage() { echo "usage: $0 --ssh <user@host> --stack production|staging --verify-only|--send [--key <file>]" >&2; exit 2; }
while [ $# -gt 0 ]; do
  case "$1" in
    --ssh) [ $# -ge 2 ] || usage; ssh_to="$2"; shift 2 ;;
    --stack) [ $# -ge 2 ] || usage; stack="$2"; shift 2 ;;
    --key) [ $# -ge 2 ] || usage; key="$2"; shift 2 ;;
    --verify-only) mode=verify; shift ;;
    --send) mode=send; shift ;;
    *) usage ;;
  esac
done
[ -n "$ssh_to" ] && [ -n "$mode" ] || usage
case "$stack" in
  production) home=/opt/ottimo-prod ;;
  staging) home=/opt/ottimo ;;
  *) usage ;;
esac
[[ "$ssh_to" =~ ^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$ ]] || { echo "--ssh must be user@host" >&2; exit 2; }
if [ -e /opt/ottimo-prod/.ottimo-home ] || [ -e /opt/ottimo/.ottimo-home ]; then
  echo "refused: run this on the OPS/INV Mac, not on the server" >&2; exit 2
fi
[ -r "$mjs" ] || { echo "mail-test.mjs not found next to bin/" >&2; exit 2; }
[ -r "$key" ] || { echo "ssh key not readable: $key" >&2; exit 2; }

to="" verify_flag=""
if [ "$mode" = send ]; then
  if [ ! -t 0 ]; then
    # Test door (SEC PR30-06 + PR30-10): all three conditions, or no pipe.
    if [ "${MAIL_TEST_READ_STDIN:-}" != 1 ] || [ -z "${MTS_DIR:-}" ] || [ "$(command -v ssh || true)" != "$MTS_DIR/bin/ssh" ]; then
      echo "--send needs an interactive terminal (the address is typed at a hidden prompt)" >&2; exit 2
    fi
  fi
  IFS= read -rs -p 'Recipient address (not shown): ' to || true
  echo >&2
  # Shape only (the worker checks again with isEmailAddress). No newline, no space, one @, ≤ 254 characters.
  if ! [[ "$to" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]] || [ "${#to}" -gt 254 ]; then
    unset to; echo "mail-test: failed (address is missing or invalid) – nothing sent" >&2; exit 2
  fi
else
  verify_flag=" -e MAIL_TEST_VERIFY_ONLY=1"
fi

# The program: mail-test.mjs, base64 (only [A-Za-z0-9+/=], so no quoting can break the remote command).
prog=$(base64 < "$mjs" | tr -d '\n')
[[ "$prog" =~ ^[A-Za-z0-9+/=]+$ ]] || { echo "mail-test.mjs could not be encoded" >&2; exit 2; }
# Remote: the deploy user execs the one-off worker with the decoded program as `node -e`; stdin (the address line, or
# an empty line for --verify-only) is passed on untouched – no `read`, no variable, no `-e MAIL_TEST_TO`.
remote="cd / && sudo -n -u ottimo sh -c 'exec $home/infra/server/bin/dc run --rm --no-deps -T$verify_flag --entrypoint node worker --input-type=module -e \"\$(printf %s $prog | base64 -d)\"'"
# stderr (docker compose progress, an ssh/sudo error) is dropped: only the fixed line of mail-test.mjs is shown.
out=$(printf '%s\n' "$to" | ssh -i "$key" -o BatchMode=yes "$ssh_to" "$remote" 2>/dev/null \
  | grep -E '^mail-test: (verified|sent|failed \([A-Za-z0-9_ .-]*\))$' | tail -n 1 || true)
unset to
case "$out" in
  "mail-test: verified" | "mail-test: sent") echo "$out" ;;
  "mail-test: failed ("*) echo "$out"; exit 1 ;;
  *) echo "mail-test: no answer from the worker (ssh, sudo or docker failed – run it again with OPS)" >&2; exit 1 ;;
esac
