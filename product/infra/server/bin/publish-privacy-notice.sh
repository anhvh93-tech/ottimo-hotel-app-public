#!/usr/bin/env bash
# Record the website privacy notice – every language of the landing build (en, vi; since LP-v2 also ko, zh, ru) – of
# the landing release that is LIVE on this stack into the table `privacy_notice_version` (US-155, SEC C-3 (a),
# FB-R3-SEC-OPS-US155-01; R4 LP-v2: ARC lp-v2-design 3.6, SEC SR-LC-04, ARC FB-R4-ARC-OPS-LPV2-01; README 12.3). The
# ONLY way that table is written on staging/production – no hand-typed SQL, no interactive psql for it. Run as the
# deploy user:
#   publish-privacy-notice.sh --landing-tag "$(cat <home>/state/landing_tag)" --version 2026-11-05 --property DLT \
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
#   2. the languages = the privacy pages IN THAT IMAGE: /srv/landing/privacy/index.html = en,
#      /srv/landing/<xx>/privacy/index.html = xx (xx ∈ vi, ko, zh, ru – anything else refused). The hreflang list
#      of /privacy/ (the build's own language list, ADR-014 3.3) must name exactly these, and every language of
#      LANDING_LOCALES (.env – the languages the api keeps on sale) must be among them. Otherwise nothing is written;
#   3. sha256 of each whole page read INSIDE that container ("body_sha256" = sha256 of the complete HTML file as built
#      – erd 4.14); the hashes must differ pairwise;
#   4. the version of each page = its ONE <meta name="ottimo-notice-version" content="…"> (ARC lp-v2 D11/D12; and
#      data-notice-version, when present, says the same). A build from before LP-v2 has no such tag: its en/vi pages
#      are read from the printed "Version …" / "Phiên bản …". Plus the form's data-consent-version on the home page
#      of each language. All must equal --version;
#   5. the live pages https://<LANDING_HOST>/privacy/ and /<xx>/privacy/ (through the edge of this host, real
#      certificate, Accept-Encoding: identity) must answer 200 with exactly the same bytes (same sha256);
#   6. the SQL (infra/server/publish-privacy-notice.sql) runs in the postgres container as ottimo_migrator over the
#      local socket (NOT the superuser) → SET LOCAL ROLE ottimo_owner + tenant context (FORCE RLS applies), ONE
#      transaction for every language, insert-only, previous version superseded once per language, audit `security`
#      `privacy_notice.published` with operator, version, languages, hashes, tag, digest; then the readiness check.
# Output: no secret, no personal data. A copy of each run's result lines goes to state/privacy-notice.log – one line
# per run "… version=<v> sha_en=<h> sha_vi=<h> [sha_ko=<h> …] rc=<n>" (deploy-landing.sh reads it).
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
# hashing (steps 2–5) and the database write (step 6).
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

# ── 2. languages: the build's own list ──
# LandingLocale (OpenAPI 0.3.9) = CHECK of privacy_notice_version (migration 0090); the order of every list below.
known="en vi ko zh ru"
is_known() { case " $known " in *" $1 "*) return 0 ;; *) return 1 ;; esac; }
page_of() { if [ "$1" = en ]; then echo privacy/index.html; else echo "$1/privacy/index.html"; fi; }
home_of() { if [ "$1" = en ]; then echo index.html; else echo "$1/index.html"; fi; }
path_of() { if [ "$1" = en ]; then echo /privacy/; else echo "/$1/privacy/"; fi; }
fname() { tr '/' '_' <<<"$1"; }
# shellcheck disable=SC2016  # $f expands inside the container
found=$(dc --profile landing exec -T landing sh -c \
  'cd /srv/landing && for f in privacy/index.html */privacy/index.html; do [ -f "$f" ] && echo "$f"; done; true' 2>/dev/null) \
  || die "cannot list the privacy pages of the running landing"
img_locs=" "
while IFS= read -r f; do
  [ -n "$f" ] || continue
  if [ "$f" = privacy/index.html ]; then l=en; else l=${f%%/*}; fi
  is_known "$l" || die "the image has a privacy page for '$l', not a landing language (en,vi,ko,zh,ru)"
  img_locs+="$l "
done <<<"$found"
locs=()
for l in $known; do case "$img_locs" in *" $l "*) locs+=("$l") ;; esac; done
[ "${#locs[@]}" -gt 0 ] || die "no privacy page in the image (built without the form?)"

# Languages the api keeps on sale: LANDING_LOCALES (default en,vi – same rule as the api). Each needs a page here.
ll=$(envval LANDING_LOCALES); ll=${ll:-en,vi}
required=()
for l in $(tr ',' ' ' <<<"$ll"); do
  is_known "$l" || die "LANDING_LOCALES has '$l' (only en,vi,ko,zh,ru) – the api would refuse to start too"
  case "$img_locs" in *" $l "*) ;; *) die "LANDING_LOCALES has '$l' but the running landing has no $(path_of "$l") page – deploy the landing with that language first, or take '$l' out of LANDING_LOCALES (README 12.3)" ;; esac
  required+=("$l")
done
[ "${#required[@]}" -gt 0 ] || required=(en vi)

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
for l in "${locs[@]}"; do
  for f in "$(page_of "$l")" "$(home_of "$l")"; do
    dc --profile landing exec -T landing cat "/srv/landing/$f" > "$tmp/$(fname "$f")" 2>/dev/null \
      || die "/srv/landing/$f missing in the image (built without the form?)"
  done
done
# Manifest = hreflang of /privacy/ (alternatesFor: one list for every page, x-default aside). A build without hreflang
# on that page: the pages found are the list. A language listed without its page, or a page not listed → refused.
manifest=$(grep -oE 'hreflang="[a-z]{2}"' "$tmp/privacy_index.html" | sed 's/.*="//; s/"$//' | sort -u | tr '\n' ' ' || true)
have=$(printf '%s\n' "${locs[@]}" | sort -u | tr '\n' ' ')
if [ -n "$manifest" ] && [ "$manifest" != "$have" ]; then
  die "the build lists the languages '${manifest% }' (hreflang of /privacy/) but has privacy pages for '${have% }'"
fi

# ── 3.–4. hashes + version inside the image ──
pages=(); for l in "${locs[@]}"; do pages+=("/srv/landing/$(page_of "$l")"); done
in_sum=$(dc --profile landing exec -T landing sha256sum "${pages[@]}") || die "sha256sum inside the landing container failed"
sha() { if command -v sha256sum >/dev/null; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi; }
ver_re='[0-9]{4}-[0-9]{2}-[0-9]{2}(\.[0-9]{1,2})?'
one() { sort -u | awk 'NR == 1 { v = $0 } END { if (NR == 1) print v }'; }  # exactly one distinct value, else empty
shas=()   # same index as locs
for l in "${locs[@]}"; do
  f=$(page_of "$l"); file="$tmp/$(fname "$f")"; p=$(path_of "$l")
  h=$(awk -v p="/srv/landing/$f" '$2 == p {print $1}' <<<"$in_sum")
  { [[ "$h" =~ ^[0-9a-f]{64}$ ]] && [ "$(sha "$file")" = "$h" ]; } || die "hash of the copied $p differs from sha256sum inside the container"
  shas+=("$h")
  # Exactly one <meta name="ottimo-notice-version">; none = a build before LP-v2 → printed version (en/vi only).
  metas=$(grep -oE '<meta [^>]*name="ottimo-notice-version"[^>]*>' "$file" || true)
  n_meta=$(grep -c . <<<"$metas" || true)
  if [ "$n_meta" -gt 1 ]; then die "$p has $n_meta ottimo-notice-version meta tags (exactly one expected)"
  elif [ "$n_meta" -eq 1 ]; then v=$(sed -nE 's/.*[[:space:]]content="([^"]*)".*/\1/p' <<<"$metas")
  elif [ "$l" = en ]; then v=$(grep -oE "Version $ver_re" "$file" | sed 's/^Version //' | one)
  elif [ "$l" = vi ]; then v=$(grep -oE "Phiên bản $ver_re" "$file" | sed 's/^Phiên bản //' | one)
  else die "$p has no <meta name=\"ottimo-notice-version\"> (required for every language other than en/vi)"; fi
  [ "$v" = "$version" ] || die "$p shows version '${v:-none or several}', expected $version"
  dnv=$(grep -oE 'data-notice-version="[^"]*"' "$file" | sed 's/.*="//; s/"$//' | sort -u | tr '\n' ' ' || true)
  [ -z "$dnv" ] || [ "$dnv" = "$version " ] || die "$p: data-notice-version '${dnv% }' differs from $version"
  c=$(grep -oE "data-consent-version=\"[^\"]*\"" "$tmp/$(fname "$(home_of "$l")")" | sed 's/.*="//; s/"$//' | one)
  [ "$c" = "$version" ] || die "home page form consentVersion of $l '${c:-none}' differs from $version (or the build has no form)"
done
dup=$(printf '%s\n' "${shas[@]}" | sort | uniq -d)
[ -z "$dup" ] || die "two languages have byte-identical privacy pages (sha256 ${dup:0:12}…) – one (version, locale) = one text"
summary=""; i=0; for l in "${locs[@]}"; do summary+=" $l ${shas[$i]:0:12}…"; i=$((i + 1)); done
log "image: version $version (pages + form) in ${#locs[@]} language(s):$summary; on sale (LANDING_LOCALES): ${required[*]}"

# ── 5. the live pages through the edge = the same bytes ──
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
i=0
for l in "${locs[@]}"; do
  p=$(path_of "$l")
  code=$(fetch "https://$host:$port$p" "$tmp/live_$l") || die "https://$host$p unreachable"
  [ "$code" = "200" ] || die "https://$host$p answered $code (expected 200)"
  [ "$(sha "$tmp/live_$l")" = "${shas[$i]}" ] || die "https://$host$p is not the page in the image (sha256 differs)"
  i=$((i + 1))
done
log "live: https://$host – ${#locs[@]} privacy page(s) = 200, same sha256 as the image"

# ── 6. database (one transaction for every language; dry run unless --apply) ──
join() { local IFS=,; echo "$*"; }
db=$(dc exec -T postgres sh -c 'printf %s "$POSTGRES_DB"')
set +e
out=$(dc exec -T postgres psql -X -q -U ottimo_migrator -d "${db:-ottimo}" \
  -v slug="$slug" -v version="$version" -v locales="$(join "${locs[@]}")" -v shas="$(join "${shas[@]}")" \
  -v required="$(join "${required[@]}")" -v operator="$operator" \
  -v landing_tag="$tag" -v landing_digest="$digest" -v apply="$([ "$apply" -eq 1 ] && echo true || echo false)" \
  -f - < "$sql_file" 2>&1)
rc=$?
set -e
res=$(sed -nE 's/^(psql:[^ ]* )?(NOTICE|ERROR): +/\2: /p' <<<"$out")
printf '%s\n' "${res:-$out}"
# One line per run, sha_<xx>= per language (en, vi first – as the lines written before LP-v2). deploy-landing.sh reads it.
kv=""; i=0; for l in "${locs[@]}"; do kv+="sha_$l=${shas[$i]} "; i=$((i + 1)); done
{ echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $mode operator=$operator landing=$tag ${digest:+digest=$digest }version=$version ${kv}rc=$rc"
  printf '  %s\n' "${res:-$out}"; } >> "$state/privacy-notice.log"
[ "$rc" -eq 0 ] || die "database step failed (nothing written – one transaction)"
result=$(grep -o 'RESULT: [a-z-]*' <<<"$res" | tail -n 1)
case "$mode:$result" in
  "dry-run:RESULT: dry-run-ok") log "DRY RUN OK – nothing written. Re-run with --apply to publish." ;;
  "apply:RESULT: published") log "OK: version $version published (${locs[*]}); OWN may now switch the form on (Desk H05)" ;;
  *":RESULT: already-present") log "OK: version $version already present with the same hashes – nothing written" ;;
  *) die "unexpected result '${result:-none}'" ;;
esac
