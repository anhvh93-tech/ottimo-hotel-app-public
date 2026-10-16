#!/usr/bin/env bash
# Forced command for the CI deploy key (infra/server/README.md "Deploy tự động từ CI"). In
# ~ottimo/.ssh/authorized_keys the CI key is restricted to this script:
#   command="/opt/ottimo/infra/server/bin/deploy-from-ci.sh",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding,restrict ssh-ed25519 AAAA… ottimo-ci-deploy
# Whatever the client asks, only `deploy <tag>` with a CI tag (sha-<7..40 hex>[-test]) is executed – the key cannot open
# a shell, copy files, change compose/Caddy files or secrets (those changes need a person with SSH – README).
set -Eeuo pipefail
here=$(cd "$(dirname "$0")" && pwd)
cmd="${SSH_ORIGINAL_COMMAND:-}"
if [[ "$cmd" =~ ^deploy\ (sha-[0-9a-f]{7,40})$ ]]; then
  exec "$here/deploy.sh" "${BASH_REMATCH[1]}"
fi
echo "refused: only 'deploy sha-<hex>' is allowed for this key" >&2
logger -t ottimo-deploy -- "refused CI command (not shown)" 2>/dev/null || true
exit 2
