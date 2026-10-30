#!/usr/bin/env bash
# Deploy one landing image tag (ADR-014; image ottimo-landing built by CI – infra/docker/Dockerfile.landing) to this
# stack – run as the deploy user. Independent of the app (deploy.sh): staging = preview for INV (basic auth, noindex),
# production = ottimo.vn / www.ottimo.vn.
#   deploy-landing.sh <tag> [--digest sha256:<64 hex>] [--no-pull] [--check-only]
#   deploy-landing.sh --rollback          previous landing tag (state/landing_previous_tag)
#   --check-only  config + pull + digest + privacy checks, then stop: nothing switched or recorded (OPS runs it on the
#                 server before INV approves a landing release).
# Production (APP_ENV=production) needs --digest (CI release job) unless the tag was deployed before with one.
# Requires EDGE_MODE=edge (the landing publishes no port; the shared edge routes LANDING_HOST/LANDING_WWW_HOST).
# Smoke: HTTPS through the edge on this host with the real certificate: home page 200 + exact landing headers
# (staging: 401 without the preview password, X-Robots-Tag present; production: 200, no X-Robots-Tag), /en/ → 301,
# /health and /v1/x → 404, www → 301 to the main host. A failed smoke puts the previous landing tag back.
# Privacy notice (ARC FB-R3-ARC-OPS-US155-01, erd 4.14: one (version, locale) = one byte string), before switching:
# sha256 of /srv/landing/privacy/index.html (en) and /srv/landing/vi/privacy/index.html (vi) in the NEW image, and the
# version printed on each page, are compared with every successful `apply` line of state/privacy-notice.log
# (publish-privacy-notice.sh). Same version + other bytes → refused (also for --rollback): body_sha256 stored for that
# version would no longer be the page guests consent on – bump the notice version (pages + form) instead. While the
# form proxy is closed (LANDING_PUBLIC_API not `on` – no consent can be given, README 12.3 rollback (c)) the same
# finding is a WARNING only. A version not recorded yet passes with a reminder to run publish-privacy-notice.sh; an
# image without the two pages passes with a note.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
if [ -z "${OTTIMO_HOME:-}" ] && [ -f "$here/../../../.ottimo-home" ]; then OTTIMO_HOME=$(cd "$here/../../.." && pwd); fi
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
export OTTIMO_HOME
state="$OTTIMO_HOME/state"

step() { if [ -n "${OTTIMO_STEP_FILE:-}" ]; then printf '%s\n' "$1" > "$OTTIMO_STEP_FILE"; fi; }
log() { echo "[landing $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; logger -t ottimo-deploy -- "landing: $*" 2>/dev/null || true; }
dc() { "$here/dc" "$@"; }
envval() { sed -n "s/^$1=//p" "$OTTIMO_HOME/.env" | tail -n 1 | tr -d '\r' | sed -e 's/^"//' -e 's/"$//'; }

tag="" digest="" pull=1 check_only=0
while [ $# -gt 0 ]; do
  case "$1" in
    --rollback) [ -r "$state/landing_previous_tag" ] || { echo "no previous landing tag" >&2; exit 2; }
                tag=$(cat "$state/landing_previous_tag"); shift ;;
    --digest) digest="${2:-}"; shift 2 || true ;;
    --no-pull) pull=0; shift ;;
    --check-only) check_only=1; shift ;;
    -*) echo "unknown option: $1" >&2; exit 2 ;;
    *) tag="$1"; shift ;;
  esac
done
[[ "$tag" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]] || { echo "usage: $0 <tag> [--digest sha256:…] [--no-pull] [--check-only] | --rollback" >&2; exit 2; }
[ -z "$digest" ] || [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo "digest must be sha256:<64 hex>" >&2; exit 2; }

step lock
mkdir -p "$state"
exec 9>"$state/landing.lock"
flock -n 9 || { echo "another landing deploy is running" >&2; exit 3; }

step config
[ "$(envval EDGE_MODE)" = "edge" ] || { log "FAIL: EDGE_MODE=edge required (the landing is only reachable through the edge)"; exit 1; }
host=$(envval LANDING_HOST); www=$(envval LANDING_WWW_HOST); app_env=$(envval APP_ENV)
if [ "$(cat "$OTTIMO_HOME/.ottimo-home" 2>/dev/null)" = "production" ] || [ "$(envval EDGE_NAME)" = "production" ] \
  || [ "$(basename "$OTTIMO_HOME")" = "ottimo-prod" ]; then
  [ "$app_env" = "production" ] || { log "FAIL: this is the production stack but APP_ENV=${app_env:-<empty>}"; exit 1; }
fi
[ -n "$host" ] && [ -n "$www" ] && [ -n "$(envval LANDING_IMAGE)" ] || { log "FAIL: LANDING_HOST, LANDING_WWW_HOST, LANDING_IMAGE must be set"; exit 1; }
# US-155 (SEC s1-SEC-on-us155 condition 2): LANDING_BASE_URL is empty or an https origin; the landing form proxy
# (LANDING_PUBLIC_API=on) needs it to be exactly https://<LANDING_HOST>.
lb=$(envval LANDING_BASE_URL)
if [ -n "$lb" ] && ! [[ "$lb" =~ ^https://[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]]; then
  log "FAIL: LANDING_BASE_URL must be https://<host> without path (found '$lb')"; exit 1
fi
if [ "$(envval LANDING_PUBLIC_API)" = "on" ] && [ "$lb" != "https://$(envval LANDING_HOST)" ]; then
  log "FAIL: LANDING_PUBLIC_API=on needs LANDING_BASE_URL=https://$(envval LANDING_HOST)"; exit 1
fi
# The landing container joins the stack's `edge` network at LANDING_IP (trusted by the api): it must lie in EDGE_SUBNET
# (production 172.30.1.0/24 – an .env written before 24/10 lacks LANDING_IP and would fall back to staging's address).
es=$(envval EDGE_SUBNET); li=$(envval LANDING_IP); li=${li:-172.30.0.11}  # compose default
if [ -n "$es" ] && [ "${es##*/}" = "24" ] && [ "${li%.*}" != "${es%.*/*}" ]; then
  log "FAIL: LANDING_IP='${li:-<unset>}' (default when unset) is not in EDGE_SUBNET=$es – add LANDING_IP=${es%.*/*}.11 to $OTTIMO_HOME/.env"; exit 1
fi
[ -e "$OTTIMO_HOME/secrets/landing_access" ] || { log "FAIL: secrets/landing_access missing – sudo $here/init-secrets.sh"; exit 1; }
[ -n "$digest" ] || [ ! -r "$state/digests/landing-$tag" ] || digest=$(cat "$state/digests/landing-$tag")
if [ "$app_env" = "production" ] && [ -z "$digest" ]; then log "FAIL: production needs --digest (CI release job)"; exit 1; fi

prev=""
[ -r "$state/landing_tag" ] && prev=$(cat "$state/landing_tag")
export LANDING_TAG="$tag"
log "deploy landing $tag (previous: ${prev:-none})"

step pull
[ "$pull" -eq 0 ] || dc --profile landing pull --quiet landing
ref="$(envval LANDING_IMAGE):$tag"
if [ -n "$digest" ]; then
  docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$ref" | grep -q "@$digest\$" \
    || { log "FAIL: $ref does not have the released digest"; exit 1; }
fi

step privacy
ptmp=$(mktemp -d); trap 'rm -rf "$ptmp"' EXIT
sha() { if command -v sha256sum >/dev/null; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi; }
one() { sort -u | awk 'NR == 1 { v = $0 } END { if (NR == 1) print v }'; }  # exactly one distinct value, else empty
privacy_check() { # 0 = pass, 1 = refuse. Reads the new image offline: no network, no pull.
  local rc=0 loc file v h rec want bad="" seen="" new=0
  local ver_re='[0-9]{4}-[0-9]{2}-[0-9]{2}(\.[0-9]{1,2})?'
  # shellcheck disable=SC2016  # $f expands inside the container
  docker run --rm --pull never --network none --entrypoint sh "$ref" -c \
    'cd /srv/landing && for f in privacy/index.html vi/privacy/index.html; do [ -f "$f" ] || exit 4; done
     tar -cf - privacy/index.html vi/privacy/index.html' > "$ptmp/pages.tar" 2>/dev/null || rc=$?
  if [ "$rc" -eq 4 ]; then log "privacy: $tag has no /privacy/ + /vi/privacy/ pages – nothing to compare"; return 0; fi
  if [ "$rc" -ne 0 ] || ! tar -C "$ptmp" -xf "$ptmp/pages.tar"; then log "FAIL: cannot read the privacy pages of $ref"; return 1; fi
  for loc in en vi; do
    # Same version patterns as publish-privacy-notice.sh ("Version …" / "Phiên bản …").
    if [ "$loc" = en ]; then file="$ptmp/privacy/index.html"; v=$(grep -oE "Version $ver_re" "$file" | sed 's/^Version //' | one)
    else file="$ptmp/vi/privacy/index.html"; v=$(grep -oE "Phiên bản $ver_re" "$file" | sed 's/^Phiên bản //' | one); fi
    h=$(sha "$file")
    if [ -z "$v" ]; then log "WARNING: privacy $loc: not exactly one version printed on the page (publish-privacy-notice.sh will refuse it)"; continue; fi
    # Successful writes only (a dry run writes nothing): "<time> apply … version=<v> sha_en=<h> sha_vi=<h> rc=0".
    rec=$(awk -v v="$v" -v k="sha_$loc" '$2 == "apply" && $NF == "rc=0" {
            ver = ""; s = ""
            for (i = 3; i <= NF; i++) { p = index($i, "="); if (substr($i, 1, p - 1) == "version") ver = substr($i, p + 1)
                                         if (substr($i, 1, p - 1) == k) s = substr($i, p + 1) }
            if (ver == v && s != "") print s }' "$state/privacy-notice.log" 2>/dev/null | sort -u)
    if [ -z "$rec" ]; then seen+=" $loc $v (not published yet)"; new=1; continue; fi
    while IFS= read -r want; do
      [ "$want" = "$h" ] || bad+=" $loc $v: published sha256 ${want:0:12}…, image ${h:0:12}…;"
    done <<<"$rec"
    seen+=" $loc $v (same bytes as published)"
  done
  if [ -n "$bad" ]; then
    bad="${bad# }"; bad="${bad%;}"
    if [ "$(envval LANDING_PUBLIC_API)" = "on" ]; then
      log "FAIL: privacy page bytes changed for a published notice version ($bad) – bump the notice version (pages + form), nothing switched"
      return 1
    fi
    log "WARNING: privacy page bytes changed for a published notice version ($bad) – allowed only because LANDING_PUBLIC_API is not on; bump the version before the form proxy is opened again"
    return 0
  fi
  log "privacy:${seen:- no version found}"
  [ "$new" -eq 0 ] || log "privacy: after this deploy run publish-privacy-notice.sh for the new version (README 12.3 step 6) before the form is used"
  return 0
}
privacy_check || exit 1
if [ "$check_only" -eq 1 ]; then log "CHECK ONLY: $tag passes the config, digest and privacy checks – nothing switched or recorded"; exit 0; fi

restore() {
  if [ -n "$prev" ] && [ "$prev" != "$tag" ]; then
    log "putting landing $prev back"
    LANDING_TAG="$prev" dc --profile landing up --detach --wait --wait-timeout 120 landing || log "WARNING: previous landing did not come back"
  fi
}
fail() { log "FAIL: $*"; dc logs --no-color --tail 40 landing || true; restore; exit 1; }

step switch
dc --profile landing up --detach --wait --wait-timeout 180 landing || fail "landing container not healthy"

step smoke
port="${SMOKE_HTTPS_PORT:-443}"; addr="${SMOKE_ADDR:-127.0.0.1}"
copts=(--silent --show-error --max-time 20 --retry 6 --retry-delay 5 --retry-all-errors --resolve "$host:$port:$addr" --resolve "$www:$port:$addr")
[ "${SMOKE_INSECURE:-0}" = "1" ] && copts+=(--insecure)
hdr() { tr -d '\r' <<<"$1" | grep -i "^$2:" | head -n 1 | cut -d' ' -f2- ; }
code=$(curl "${copts[@]}" -o /dev/null -w '%{http_code}' "https://$host:$port/") || fail "https://$host/ unreachable"
if [ "$app_env" = "production" ]; then
  [ "$code" = "200" ] || fail "https://$host/ answered $code"
  h=$(curl "${copts[@]}" -o /dev/null -D - "https://$host:$port/")
  [ -z "$(hdr "$h" X-Robots-Tag)" ] || fail "production landing sends X-Robots-Tag"
else
  [ "$code" = "401" ] || fail "staging preview answered $code without the password (expected 401)"
  pw="$OTTIMO_HOME/secrets/landing_preview_password"
  h=$(curl "${copts[@]}" -o /dev/null -D - "https://$host:$port/")
  case "$(hdr "$h" X-Robots-Tag)" in *noindex*) ;; *) fail "preview 401 without X-Robots-Tag noindex" ;; esac
  # The page itself only with the password (root-readable): run as root to check the headers of the real page.
  if [ -r "$pw" ]; then h=$(curl "${copts[@]}" --config <(printf 'user = "ottimo:%s"\n' "$(cat "$pw")") -o /dev/null -D - "https://$host:$port/"); else h=""; fi
fi
if [ -n "$h" ] && [ "$app_env" = "production" ] || [ -r "${pw:-/nonexistent}" ]; then
  case "$(hdr "$h" Content-Security-Policy)" in "default-src 'self'; script-src 'self'"*) ;; *) fail "landing CSP missing" ;; esac
  case "$(hdr "$h" Strict-Transport-Security)" in "max-age=31536000; includeSubDomains") ;; *) fail "landing HSTS missing" ;; esac
fi
if [ "$app_env" = "production" ]; then
  for probe in /health /v1/x /.env; do
    c=$(curl "${copts[@]}" -o /dev/null -w '%{http_code}' "https://$host:$port$probe")
    [ "$c" = "404" ] || fail "$probe answered $c (expected 404)"
  done
  c=$(curl "${copts[@]}" -o /dev/null -w '%{http_code} %{redirect_url}' "https://$host:$port/en/")
  [ "${c%% *}" = "301" ] || fail "/en/ answered $c (expected 301)"
fi
c=$(curl "${copts[@]}" -o /dev/null -w '%{http_code} %{redirect_url}' "https://$www:$port/x/")
case "$c" in "301 https://$host"*/x/) ;; *) fail "www answered $c (expected 301 to https://$host/x/)" ;; esac

step record
if [ -n "$prev" ] && [ "$prev" != "$tag" ]; then echo "$prev" > "$state/landing_previous_tag"; fi
echo "$tag" > "$state/landing_tag"
if [ -n "$digest" ]; then mkdir -p "$state/digests"; echo "$digest" > "$state/digests/landing-$tag"; fi
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) landing $tag" >> "$state/deploy-history.log"
log "OK: landing $tag is live on $host"
