#!/usr/bin/env sh
# SEC 06.33 admin command – reset 2FA of a user when no other owner can (ESC-027 B, BR-437).
# Run by OPS on the server host, only after the identity-verification procedure approved by SEC (kept outside
# this public repository). There is deliberately no HTTP endpoint for this. The api image only holds dist/, so
# this wrapper runs the compiled command inside the running api container:
#   COMPOSE="docker compose --env-file .env -f infra/docker-compose.prod.yml" \
#     sh services/api/scripts/mfa-operator-reset.sh \
#     --username <login> --operator <who runs it> --ticket <verification record ref> --reason "<text>"
set -eu
COMPOSE="${COMPOSE:-docker compose}"
# shellcheck disable=SC2086
exec $COMPOSE exec -T api node dist/admin/mfa-operator-reset-cli.js "$@"
