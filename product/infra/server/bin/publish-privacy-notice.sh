#!/usr/bin/env bash
# Record the website privacy notice (vi + en) of the landing release that is LIVE on this stack into the table
# `privacy_notice_version` (US-155, SEC C-3 (a), FB-R3-SEC-OPS-US155-01; README 12.3). The ONLY way that table is
# written on staging/production – no hand-typed SQL, no interactive psql for it. Run as the deploy user:
#   publish-privacy-notice.sh --landing-tag "$(cat <home>/state/landing_tag)" --version 2026-10-24 --property DLT \
#                             --operator <staff id>
#                             [--digest sha256:<64 hex>] [--apply]
# The landing tag is the IMAGE tag deployed by deploy-landing.sh (CI: sha-<12>), not the git tag landing-v….
# Default = DRY RUN: every check below + the database transaction, then ROLLBACK; prints what would be written.
# --apply = the same, then COMMIT. Re-running is safe: same version + same hash → "already present", nothing written;
# same version + other hash → refused (a changed text needs a new version – SEC 2.4).
#
# What the person types: tag (+ digest), version, property code, own staff id. Everything else is derived here:
#   1. the tag must be the landing tag deployed by deploy-landing.sh (state/landing_tag), and the RUNNING landing
#      container's image must carry the released digest (state/digests/landing-<tag>, = --digest when given);
#   2. sha256 of the whole files /srv/landing/privacy/index.html and /srv/landing/vi/privacy/index.html read INSIDE
#      that container ("body_sha256" = sha256 of the complete HTML file as built – erd 4.14);
#   3. the version printed on both pages ("Version …" / "Phiên bản …") and the form's data-consent-version on the
#      home pages must all equal --version;
#   4. the live pages https://<LANDING_HOST>/privacy/ and /vi/privacy/ (through the edge of this host, real
#      certificate, Accept-Encoding: identity) must answer 200 with exactly the same bytes (same sha256);
#   5. the SQL (infra/server/publish-privacy-notice.sql) runs in the postgres container as ottimo_migrator over the
#      local socket (NOT the superuser) → SET LOCAL ROLE ottimo_owner + tenant context (FORCE RLS applies), one
#      transaction for vi + en, insert-only, previous version superseded once, audit `security`
#      `privacy_notice.published` with operator, version, hashes, tag, digest; then the readiness check.
# Output: no secret, no personal data. A copy of each run's result lines goes to state/privacy-notice.log.
# NOT the Desk parameter `privacy_notice_version` (staying-guest notice, OWN on H05) – unrelated, never touched.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
if [ -z "${OTTIMO_HOME:-}" ] && [ -f "$here/../../../.ottimo-home" ]; then OTTIMO_HOME=$(cd "$here/../../.." && pwd); fi
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
export OTTIMO_HOME
state="$OTTIMO_HOME/state"
sql_file="$here/../publish-privacy-notice.sql"
envval() { sed -n "s/^$1=//p" "$OTTIMO_HOME/.env" | tail -n 1 | tr -d '\r' | sed -e 's/^"//' -e 's/"$//'; }
app_env=$(envval APP_ENV)
is_prod=0
if [ "$app_env" = "production" ] || [ "$(cat "$OTTIMO_HOME/.ottimo-home" 2>/dev/null)" = "production" ] \
  || [ "$(basename "$OTTIMO_HOME")" = "ottimo-prod" ]; then is_prod=1; fi
# Test harness only (infra/server/test/publish-privacy-notice.test.sh): another compose wrapper / no registry digest.
if [ -n "${PN_TEST_DC:-}${PN_TEST_NO_DIGEST:-}" ] && [ "$is_prod" -eq 1 ]; then
  echo "refused: PN_TEST_* variables are not allowed on production" >&2; exit 2
fi
# SEC FB-R3-SEC-OPS-US155-03: on production the live pages are fetched from this host's edge with the real
# certificate – the smoke overrides of deploy-landing.sh (other address, --insecure) are refused there.
if [ "$is_prod" -eq 1 ] && { [ -n "${SMOKE_INSECURE:-}" ] && [ "${SMOKE_INSECURE}" != "0" ] \
  || { [ -n "${SMOKE_ADDR:-}" ] && [ "${SMOKE_ADDR}" != "127.0.0.1" ]; }; }; then
  echo "refused: SMOKE_INSECURE / SMOKE_ADDR overrides are not allowed on production" >&2; exit 2
fi
dc() { "${PN_TEST_DC:-$here/dc}" "$@"; }
log() { echo "[privacy-notice $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; logger -t ottimo-deploy -- "privacy-notice: $*" 2>/dev/null || true; }
die() { log "REFUSED: $*"; exit 1; }

tag="" digest="" version="" property="" operator="" apply=0
while [ $# -gt 0 ]; do
  case "$1" in
    --landing-tag) tag="${2:-}"; shift 2 || true ;;
    --digest) digest="${2:-}"; shift 2 || true ;;
    --version) version="${2:-}"; shift 2 || true ;;
    --property) property="${2:-}"; shift 2 || true ;;
    --operator) operator="${2:-}"; shift 2 || true ;;
    --apply) apply=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
usage="usage: $0 --landing-tag <tag> --version <YYYY-MM-DD[.N]> --property <CODE> --operator <staff id> [--digest sha256:…] [--apply]"
[[ "$tag" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]] || { echo "$usage" >&2; exit 2; }
[[ "$version" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}(\.[0-9]{1,2})?$ ]] || { echo "version must be YYYY-MM-DD or YYYY-MM-DD.N" >&2; exit 2; }
[[ "$property" =~ ^[A-Za-z0-9-]{2,40}$ ]] || { echo "property must be the property code (e.g. DLT)" >&2; exit 2; }
[[ "$operator" =~ ^[a-z0-9][a-z0-9._-]{1,39}$ ]] || { echo "operator must be a staff id (a-z 0-9 . _ -), not an e-mail" >&2; exit 2; }
[ -z "$digest" ] || [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo "digest must be sha256:<64 hex>" >&2; exit 2; }
slug=$(tr '[:upper:]' '[:lower:]' <<<"$property")
[ -r "$sql_file" ] || die "$sql_file missing (copy the whole infra bundle)"
mode=$([ "$apply" -eq 1 ] && echo apply || echo dry-run)
log "start ($mode) version=$version property=$property landing=$tag operator=$operator"

mkdir -p "$state"
exec 9>"$state/privacy-notice.lock"
if command -v flock >/dev/null; then
  flock -n 9 || die "another publish-privacy-notice run is in progress"
elif [ "$is_prod" -eq 1 ]; then
  die "flock missing"
fi  # (test harness on macOS: no flock; the SQL also takes a table lock)
# ARC FB-R3-ARC-OPS-US155-05: hold the landing deploy lock too, so no landing release can replace the container between
# hashing (steps 2–4) and the database write (step 5).
exec 8>"$state/landing.lock"
if command -v flock >/dev/null; then flock -n 8 || die "a landing deploy is in progress – run again after it"; fi

# ── 1. the live landing release ──
live_tag=$(cat "$state/landing_tag" 2>/dev/null || true)
[ "$live_tag" = "$tag" ] || die "landing tag '$tag' is not the deployed one ('${live_tag:-none}') – deploy-landing.sh first"
rec_digest=$(cat "$state/digests/landing-$tag" 2>/dev/null || true)
if [ -n "$digest" ] && [ -n "$rec_digest" ] && [ "$digest" != "$rec_digest" ]; then
  die "--digest differs from the digest deploy-landing.sh recorded for $tag"
fi
digest=${digest:-$rec_digest}
cid=$(dc --profile landing ps --status running --quiet landing 2>/dev/null | head -n 1)
[ -n "$cid" ] || die "landing container is not running"
img_id=$(docker inspect --format '{{.Image}}' "$cid")
if [ -n "${PN_TEST_NO_DIGEST:-}" ]; then
  log "TEST: digest check skipped (PN_TEST_NO_DIGEST)"; digest=""
else
  [ -n "$digest" ] || die "no digest for $tag (state/digests/landing-$tag missing and no --digest)"
  docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$img_id" | grep -q "@$digest\$" \
    || die "the running landing container's image does not carry digest $digest"
fi
log "landing container image ${img_id:7:12} ok ${digest:+(digest ${digest:7:12}…)}"

# ── 2.–3. hashes + version inside the image ──
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
for f in privacy/index.html vi/privacy/index.html index.html vi/index.html; do
  out="$tmp/$(tr '/' '_' <<<"$f")"
  dc --profile landing exec -T landing cat "/srv/landing/$f" > "$out" 2>/dev/null || die "/srv/landing/$f missing in the image (built without the form?)"
done
in_sum=$(dc --profile landing exec -T landing sha256sum /srv/landing/privacy/index.html /srv/landing/vi/privacy/index.html)
sha_en=$(awk '$2 == "/srv/landing/privacy/index.html" {print $1}' <<<"$in_sum")
sha_vi=$(awk '$2 == "/srv/landing/vi/privacy/index.html" {print $1}' <<<"$in_sum")
sha() { if command -v sha256sum >/dev/null; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi; }
[ "$(sha "$tmp/privacy_index.html")" = "$sha_en" ] && [ "$(sha "$tmp/vi_privacy_index.html")" = "$sha_vi" ] \
  || die "hash of the copied files differs from sha256sum inside the container"
ver_re='[0-9]{4}-[0-9]{2}-[0-9]{2}(\.[0-9]{1,2})?'
one() { sort -u | awk 'NR == 1 { v = $0 } END { if (NR == 1) print v }'; }
v_en=$(grep -oE "Version $ver_re" "$tmp/privacy_index.html" | sed 's/^Version //' | one)
v_vi=$(grep -oE "Phiên bản $ver_re" "$tmp/vi_privacy_index.html" | sed 's/^Phiên bản //' | one)
c_en=$(grep -oE "data-consent-version=\"[^\"]*\"" "$tmp/index.html" | sed 's/.*="//; s/"$//' | one)
c_vi=$(grep -oE "data-consent-version=\"[^\"]*\"" "$tmp/vi_index.html" | sed 's/.*="//; s/"$//' | one)
[ "$v_en" = "$version" ] || die "/privacy/ shows version '${v_en:-none or several}', expected $version"
[ "$v_vi" = "$version" ] || die "/vi/privacy/ shows version '${v_vi:-none or several}', expected $version"
[ "$c_en" = "$version" ] && [ "$c_vi" = "$version" ] \
  || die "home page form consentVersion '${c_en:-none}'/'${c_vi:-none}' differs from $version (or the build has no form)"
[ "$sha_en" != "$sha_vi" ] || die "vi and en pages are identical"
log "image: /privacy/ sha256 $sha_en, /vi/privacy/ sha256 $sha_vi, version $version (pages + form)"

# ── 4. the live pages through the edge = the same bytes ──
host=$(envval LANDING_HOST)
[ -n "$host" ] || die "LANDING_HOST not set in $OTTIMO_HOME/.env"
port="${SMOKE_HTTPS_PORT:-443}"; addr="${SMOKE_ADDR:-127.0.0.1}"
copts=(--silent --show-error --max-time 20 --retry 3 --retry-delay 3 --resolve "$host:$port:$addr" -H 'Accept-Encoding: identity')
[ "${SMOKE_INSECURE:-0}" = "1" ] && copts+=(--insecure)
pw="$OTTIMO_HOME/secrets/landing_preview_password"
fetch() { # <url> <out file> → HTTP code; staging preview: basic auth from the root-only file (never on the command line)
  if [ "$is_prod" -eq 0 ] && [ -r "$pw" ]; then
    curl "${copts[@]}" --config <(printf 'user = "ottimo:%s"\n' "$(cat "$pw")") -o "$2" -w '%{http_code}' "$1"
  else
    curl "${copts[@]}" -o "$2" -w '%{http_code}' "$1"
  fi
}
for p in en:/privacy/ vi:/vi/privacy/; do
  loc=${p%%:*} path=${p#*:}
  code=$(fetch "https://$host:$port$path" "$tmp/live_$loc") || die "https://$host$path unreachable"
  [ "$code" = "200" ] || die "https://$host$path answered $code (expected 200)"
  want=$([ "$loc" = en ] && echo "$sha_en" || echo "$sha_vi")
  [ "$(sha "$tmp/live_$loc")" = "$want" ] || die "https://$host$path is not the page in the image (sha256 differs)"
done
log "live: https://$host/privacy/ and /vi/privacy/ = 200, same sha256 as the image"

# ── 5. database (one transaction; dry run unless --apply) ──
db=$(dc exec -T postgres sh -c 'printf %s "$POSTGRES_DB"')
set +e
out=$(dc exec -T postgres psql -X -q -U ottimo_migrator -d "${db:-ottimo}" \
  -v slug="$slug" -v version="$version" -v sha_vi="$sha_vi" -v sha_en="$sha_en" -v operator="$operator" \
  -v landing_tag="$tag" -v landing_digest="$digest" -v apply="$([ "$apply" -eq 1 ] && echo true || echo false)" \
  -f - < "$sql_file" 2>&1)
rc=$?
set -e
res=$(sed -nE 's/^(psql:[^ ]* )?(NOTICE|ERROR): +/\2: /p' <<<"$out")
printf '%s\n' "${res:-$out}"
{ echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $mode operator=$operator landing=$tag ${digest:+digest=$digest} version=$version sha_en=$sha_en sha_vi=$sha_vi rc=$rc"
  printf '  %s\n' "${res:-$out}"; } >> "$state/privacy-notice.log"
[ "$rc" -eq 0 ] || die "database step failed (nothing written – one transaction)"
result=$(grep -o 'RESULT: [a-z-]*' <<<"$res" | tail -n 1)
case "$mode:$result" in
  "dry-run:RESULT: dry-run-ok") log "DRY RUN OK – nothing written. Re-run with --apply to publish." ;;
  "apply:RESULT: published") log "OK: version $version published (vi + en); OWN may now switch the form on (Desk H05)" ;;
  *":RESULT: already-present") log "OK: version $version already present with the same hashes – nothing written" ;;
  *) die "unexpected result '${result:-none}'" ;;
esac
