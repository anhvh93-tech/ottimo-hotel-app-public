#!/usr/bin/env sh
# R3-OPS-02 admin command – ONE-TIME initialisation of an empty production database: organisation, property
# OTTIMO Đà Lạt, 10 units, channels, BR section 13 parameters and the first owner (temporary password shown ONCE
# on this terminal, must be changed; 2FA enrolment forced by MFA_ENFORCED=true). No HTTP endpoint. Refused when the
# database already holds a property. Run by OPS on the server host after `migrate`, from an interactive terminal
# (no -T: the command needs a TTY and refuses to print the password into a pipe or a file):
#   COMPOSE="docker compose --env-file .env -f infra/docker-compose.prod.yml" \
#     sh services/api/scripts/production-bootstrap.sh \
#     --owner-username <login> --owner-name "<display name>" --operator <who runs it>
set -eu
COMPOSE="${COMPOSE:-docker compose}"
# shellcheck disable=SC2086
exec $COMPOSE exec api node dist/admin/production-bootstrap-cli.js "$@"
