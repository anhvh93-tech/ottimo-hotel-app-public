#!/usr/bin/env bash
# Put the staff e-mails `email_changed` that a v1.0.2 worker killed with BAD_TEMPLATE back into the queue
# (INT FB-R4-INT-BE-31-02 (b), ARC FB-R4-ARC-BE-31-02; runbook v1.0.3 R9). After a rollback v1.0.3 → v1.0.2, the old
# worker does not know this template and marks a waiting row dead at once; going up again does not resend it, so the
# notice to the previous address (the only warning its owner gets – SEC 04) would be lost. This script is the ONLY way
# to requeue such rows on staging/production – no UPDATE typed by hand. Run as the deploy user, after v1.0.3 (or later)
# is live AGAIN, with INV's consent for --apply:
#   requeue-email-changed.sh --tag <image tag now live>                         dry run: checks + counts, writes nothing
#   requeue-email-changed.sh --tag <image tag now live> --apply --expect <n>    the same, then one UPDATE transaction
# Checks, in a dry run too (any one failing → REFUSED, nothing written):
#   1. no deploy / rollback is running (state/deploy.lock, the lock of deploy.sh);
#   2. --tag = state/current_tag, and the one running worker container uses that image tag;
#   3. that worker's image knows the template `email_changed` (isStaffEmailTemplate of @ottimo/integrations, asked
#      inside the container) – a v1.0.2 worker would kill the rows again;
#   4. table user_email_change exists (migration 0091).
# Rows touched: topic staff.email, status dead, last_error BAD_TEMPLATE, payload template = email_changed, created_at
# within the last 7 days (ARC condition: after 7 days the daily job email_change.purge has cleared the old address, a
# resend would only reach the new address and the owners). Older rows are counted and left alone.
# --apply needs --expect = the count the dry run printed; the UPDATE runs in one transaction that is rolled back when
# the number of rows it changes is not exactly --expect. Columns written: status, attempts, next_attempt_at,
# last_error (INT 02 (b)); the payload is only compared, never selected or printed.
# Output and journal (logger -t ottimo-deploy): counts only – no address, id, payload or raw database error.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
if [ -z "${OTTIMO_HOME:-}" ] && [ -f "$here/../../../.ottimo-home" ]; then OTTIMO_HOME=$(cd "$here/../../.." && pwd); fi
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
export OTTIMO_HOME
state="$OTTIMO_HOME/state"
envval() { sed -n "s/^$1=//p" "$OTTIMO_HOME/.env" 2>/dev/null | tail -n 1 | tr -d '\r' | sed -e 's/^"//' -e 's/"$//'; }
is_prod=0
if [ "$(envval APP_ENV)" = "production" ] || [ "$(cat "$OTTIMO_HOME/.ottimo-home" 2>/dev/null)" = "production" ] \
  || [ "$(basename "$OTTIMO_HOME")" = "ottimo-prod" ]; then is_prod=1; fi
# Test harness only (infra/server/test/requeue-email-changed.test.sh): another compose wrapper.
if [ -n "${RQ_TEST_DC:-}" ] && [ "$is_prod" -eq 1 ]; then
  echo "refused: RQ_TEST_DC is not allowed on production" >&2; exit 2
fi
dc() { "${RQ_TEST_DC:-$here/dc}" "$@"; }
log() { echo "[requeue-email $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; logger -t ottimo-deploy -- "requeue-email: $*" 2>/dev/null || true; }
die() { log "REFUSED: $*"; exit 1; }

tag="" apply=0 expect=""
while [ $# -gt 0 ]; do
  case "$1" in
    --tag) tag="${2:-}"; shift 2 || shift ;;
    --apply) apply=1; shift ;;
    --expect) expect="${2:-}"; shift 2 || shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
usage="usage: $0 --tag <image tag now live> [--apply --expect <n>]"
[[ "$tag" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]] || { echo "$usage" >&2; exit 2; }
if [ "$apply" -eq 1 ]; then
  [[ "$expect" =~ ^[0-9]{1,4}$ ]] || { echo "--apply needs --expect <n> (the count printed by the dry run)" >&2; exit 2; }
  expect=$((10#$expect))
elif [ -n "$expect" ]; then
  echo "--expect is only used with --apply" >&2; exit 2
fi
mode=$([ "$apply" -eq 1 ] && echo apply || echo dry-run)

err=$(mktemp "${TMPDIR:-/tmp}/requeue-email.XXXXXX")
trap 'rm -f "$err"' EXIT
psql_ro() {
  dc exec -T postgres sh -c 'PGOPTIONS="-c default_transaction_read_only=on" psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA -F "|"'
}
psql_rw() {
  dc exec -T postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA -F "|"'
}
# The rows of this script, as one WHERE clause (same text for the count and the UPDATE).
rows="topic = 'staff.email' AND status = 'dead' AND last_error = 'BAD_TEMPLATE' AND payload->>'template' = 'email_changed'"
count_rows() { # → "<within 7 days> <older>", or -1 -1 without user_email_change; exit 1 on a query error
  local out
  out=$(psql_ro 2>"$err" <<SQL
SELECT to_regclass('public.user_email_change') IS NOT NULL AS has_uec \gset
\if :has_uec
SELECT 'rows', count(*) FILTER (WHERE created_at > now() - interval '7 days'),
       count(*) FILTER (WHERE created_at <= now() - interval '7 days')
  FROM outbox_message WHERE $rows;
\else
SELECT 'rows', -1, -1;
\endif
SQL
  ) || return 1
  out=$(tr -d '[:space:]' <<<"$out")
  [[ "$out" =~ ^rows\|(-1|[0-9]+)\|(-1|[0-9]+)$ ]] || return 1
  echo "${BASH_REMATCH[1]} ${BASH_REMATCH[2]}"
}

log "start ($mode) tag=$tag"
mkdir -p "$state"
exec 9>"$state/deploy.lock"
if command -v flock >/dev/null; then flock -n 9 || die "a deploy or rollback is running (state/deploy.lock) – wait, then run again"; fi

# 2. the live tag and the running worker
current=$(cat "$state/current_tag" 2>/dev/null || true)
[ "$current" = "$tag" ] || die "state/current_tag is not $tag – run this only on the tag that is live now"
images=$(dc ps --status running --format '{{.Image}}' worker 2>"$err") || die "docker compose failed – worker state unknown"
[ "$(grep -c . <<<"$images" || true)" = "1" ] || die "expected exactly one running worker container"
case "$images" in
  *":$tag" | *":$tag"-*) ;;
  *) die "the running worker is not on image tag $tag" ;;
esac
# 3. the worker image knows email_changed (v1.0.3 or later). Exit 0 = yes, 1 = no, anything else = cannot tell.
probe='try { const m = await import("@ottimo/integrations/notification"); process.exit(m.isStaffEmailTemplate("email_changed") ? 0 : 1); } catch { process.exit(3); }'
rc=0
dc exec -T worker node --input-type=module -e "$probe" >/dev/null 2>"$err" || rc=$?
case "$rc" in
  0) log "worker $tag knows the template email_changed" ;;
  1) die "the worker image $tag does not know the template email_changed (v1.0.2?) – go up to v1.0.3 first (runbook R8)" ;;
  *) die "could not ask the worker image which templates it knows (exit $rc)" ;;
esac
# 4. + counts (READ ONLY)
counts=$(count_rows) || die "count query failed – nothing written"
read -r recent older <<<"$counts"
[ "$recent" != "-1" ] || die "table user_email_change is missing (migration 0091 not applied)"
log "dead BAD_TEMPLATE email_changed: $recent within 7 days (to requeue), $older older (left as they are)"

if [ "$apply" -eq 0 ]; then
  log "dry run – nothing written. Requeue (INV consent): $0 --tag $tag --apply --expect $recent"
  exit 0
fi
[ "$expect" -eq "$recent" ] || die "--expect $expect but $recent row(s) match now – nothing written; run the dry run again"
if [ "$recent" -eq 0 ]; then log "nothing to requeue"; exit 0; fi

# One transaction: the UPDATE changes exactly --expect rows or nothing at all.
if ! psql_rw >/dev/null 2>"$err" <<SQL
BEGIN;
DO \$requeue\$
DECLARE k integer;
BEGIN
  UPDATE outbox_message SET status = 'pending', attempts = 0, next_attempt_at = NULL, last_error = NULL
   WHERE $rows AND created_at > now() - interval '7 days';
  GET DIAGNOSTICS k = ROW_COUNT;
  IF k <> $expect THEN RAISE EXCEPTION 'requeue: % rows, expected $expect', k; END IF;
END
\$requeue\$;
COMMIT;
SQL
then
  die "the database refused the UPDATE (row count changed or query error) – nothing written; run the dry run again"
fi
after=$(count_rows) || { log "requeued $expect row(s); the count after it failed – run the dry run to check"; exit 0; }
read -r recent_after _ <<<"$after"
log "requeued $expect row(s); dead BAD_TEMPLATE email_changed within 7 days now: $recent_after. The worker sends them on its next ticks (10 / min / property)."
