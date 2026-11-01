#!/usr/bin/env bash
# Test of the privacy byte check in infra/server/bin/deploy-landing.sh (ARC FB-R3-ARC-OPS-US155-01): one
# (version, locale) = one byte string – for every language of the build (R4 LP-v2: ARC lp-v2-design 3.6 (4), SEC
# SR-LC-05, ARC FB-R4-ARC-OPS-LPV2-01). Self-contained: small fake landing images built FROM alpine (only the privacy
# pages), a temp OTTIMO_HOME with a fake state/privacy-notice.log – no stack, no registry, no network for the check
# itself. Every case stops before the `switch` step, so no container is started.
#   bash infra/server/test/deploy-landing-privacy.test.sh        (workstation or CI; needs docker)
# Cases: same version + same bytes → passes · same version + other bytes (en) → real deploy refused before switch ·
# same version + other bytes (vi) → refused · --rollback to other bytes → refused · new version → passes + reminder ·
# image without the pages → passes · other bytes while LANDING_PUBLIC_API=off → warning, passes · dry-run / failed
# apply lines are not "published" · LP-v2 (5 languages, version from <meta name="ottimo-notice-version">): new version
# → every language listed · log line with sha_<xx> for 5 languages, same bytes → passes · other bytes (zh) → refused ·
# older version than the published one → refused, --rollback → warning · LANDING_LOCALES language missing in the image
# → refused, --rollback → warning · two meta tags → warning (publish refuses it).
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
infra=$(cd "$here/../.." && pwd)
script="$infra/server/bin/deploy-landing.sh"
if [ -e /opt/ottimo-prod ] || [ -e /opt/ottimo/.ottimo-home ]; then
  echo "refused: this is an OTTIMO server – run this test on a workstation or in CI" >&2; exit 2
fi
base="${BASE_IMAGE:-alpine:3.20}"
repo=ottimo-landing-dlp-test

home=$(mktemp -d "${TMPDIR:-/tmp}/dlp-test.XXXXXX")
mkdir -p "$home/secrets" "$home/state" "$home/bin" "$home/img"
printf '# test\n' > "$home/secrets/landing_access"
write_env() { # LANDING_PUBLIC_API value [LANDING_LOCALES]
  cat > "$home/.env" <<ENV
APP_ENV=staging
EDGE_MODE=edge
LANDING_HOST=landing.dlp-test.invalid
LANDING_WWW_HOST=www.landing.dlp-test.invalid
LANDING_IMAGE=$repo
LANDING_BASE_URL=https://landing.dlp-test.invalid
LANDING_PUBLIC_API=$1
LANDING_LOCALES=${2:-en,vi}
ENV
}
# macOS has no flock: a stand-in that always gets the lock (the lock itself is not under test).
if ! command -v flock >/dev/null; then printf '#!/bin/sh\nexit 0\n' > "$home/bin/flock"; chmod +x "$home/bin/flock"; fi
built=()
cleanup() { [ "${#built[@]}" -eq 0 ] || docker image rm "${built[@]}" >/dev/null 2>&1 || true; rm -rf "$home"; }
trap cleanup EXIT

img() { # tag en-version vi-version en-extra vi-extra ("-" for en-version = no pages at all)
  local d="$home/img/$1"
  mkdir -p "$d/srv/landing"
  if [ "$2" != "-" ]; then
    mkdir -p "$d/srv/landing/privacy" "$d/srv/landing/vi/privacy"
    printf '<html><body><h1>Privacy notice</h1><p>Version %s</p>%s</body></html>\n' "$2" "$4" > "$d/srv/landing/privacy/index.html"
    printf '<html><body><h1>Thông báo quyền riêng tư</h1><p>Phiên bản %s</p>%s</body></html>\n' "$3" "$5" > "$d/srv/landing/vi/privacy/index.html"
  else
    printf '<html><body>home</body></html>\n' > "$d/srv/landing/index.html"
  fi
  printf 'FROM %s\nCOPY srv /srv\n' "$base" > "$d/Dockerfile"
  docker build -q -t "$repo:$1" "$d" >/dev/null
  built+=("$repo:$1")
}
img5() { # tag version zh-extra ko-meta-count – LP-v2 build: 5 languages, version only in the meta tag (+ data-notice-version)
  local d="$home/img/$1" l p m i
  for l in en vi ko zh ru; do
    if [ "$l" = en ]; then p="$d/srv/landing/privacy"; else p="$d/srv/landing/$l/privacy"; fi
    mkdir -p "$p"; m='<meta name="ottimo-notice-version" content="'"$2"'">'
    if [ "$l" = ko ]; then for ((i = 1; i < ${4:-1}; i++)); do m+='<meta name="ottimo-notice-version" content="'"$2"'">'; done; fi
    printf '<html lang="%s"><head>%s</head><body><h1>Notice %s</h1><div data-notice-version="%s">text %s</div>%s</body></html>\n' \
      "$l" "$m" "$l" "$2" "$l" "$([ "$l" = zh ] && echo "$3")" > "$p/index.html"
  done
  printf 'FROM %s\nCOPY srv /srv\n' "$base" > "$d/Dockerfile"
  docker build -q -t "$repo:$1" "$d" >/dev/null
  built+=("$repo:$1")
}
page_sha() { # tag path → sha256 of the file as built
  if command -v sha256sum >/dev/null; then sha256sum "$home/img/$1/srv/landing/$2" | cut -d' ' -f1
  else shasum -a 256 "$home/img/$1/srv/landing/$2" | cut -d' ' -f1; fi
}

echo "== images ($base)"
img v1 2026-10-24 2026-10-24 "" ""
img v1-en-other 2026-10-24 2026-10-24 "<footer>new footer</footer>" ""
img v1-vi-other 2026-10-24 2026-10-24 "" "<footer>chân trang mới</footer>"
img v2 2026-11-05 2026-11-05 "<p>new text</p>" "<p>chữ mới</p>"
img nopages - - "" ""
img5 v5 2026-11-05 "" 1
img5 v5-zh-other 2026-11-05 "<footer>新页脚</footer>" 1
img5 v5-2meta 2026-11-05 "" 2
sha_en=$(page_sha v1 privacy/index.html); sha_vi=$(page_sha v1 vi/privacy/index.html)
other_en=$(page_sha v1-en-other privacy/index.html)

# The log as publish-privacy-notice.sh writes it: one result line + indented psql lines.
publ() {
  {
    echo "2026-10-30T10:30:00Z dry-run operator=ops.test landing=sha-old version=2026-10-24 sha_en=$other_en sha_vi=$sha_vi rc=0"
    echo "  NOTICE:  RESULT: dry-run-ok"
    echo "2026-10-30T10:31:00Z apply operator=ops.test landing=sha-old version=2026-10-24 sha_en=$other_en sha_vi=$sha_vi rc=3"
    echo "  ERROR:  refused"
    echo "2026-10-30T10:39:53Z apply operator=owner landing=v1 digest=sha256:$(printf 'a%.0s' $(seq 64)) version=2026-10-24 sha_en=$sha_en sha_vi=$sha_vi rc=0"
    echo "  NOTICE:  RESULT: published (inserted: vi,en, already present: -)"
  } > "$home/state/privacy-notice.log"
}

pass=0 fail=0
ok() { echo "PASS  $*"; pass=$((pass + 1)); }
ko() { echo "FAIL  $*"; fail=$((fail + 1)); }
dl() { PATH="$home/bin:$PATH" OTTIMO_HOME="$home" OTTIMO_STEP_FILE="$home/step" bash "$script" "$@" 2>&1; }
show() { [ -z "${VERBOSE:-}" ] || sed 's/^/      /' <<<"$1"; }

echo "== cases"
write_env on; publ
echo v1 > "$home/state/landing_tag"; : > "$home/state/deploy-history.log"

out=$(dl v1 --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 0 ] && grep -q 'en 2026-10-24 (same bytes as published)' <<<"$out" && grep -q 'vi 2026-10-24 (same bytes' <<<"$out" \
  && grep -q 'CHECK ONLY' <<<"$out"; then ok "1 same version, same bytes → passes"; else ko "1 same bytes (rc=$rc)"; echo "$out"; fi

out=$(dl v1-en-other --no-pull) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 1 ] && grep -q 'FAIL: privacy page bytes changed for a published notice version (en 2026-10-24' <<<"$out" \
  && [ "$(cat "$home/step")" = "privacy" ] && [ "$(cat "$home/state/landing_tag")" = "v1" ] && [ ! -s "$home/state/deploy-history.log" ]; then
  ok "2 same version, other bytes (en) → deploy refused at step privacy, nothing switched or recorded"
else ko "2 other bytes en (rc=$rc, step=$(cat "$home/step" 2>/dev/null))"; echo "$out"; fi

out=$(dl v1-vi-other --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 1 ] && grep -q '(vi 2026-10-24: published sha256' <<<"$out"; then ok "3 same version, other bytes (vi) → refused"
else ko "3 other bytes vi (rc=$rc)"; echo "$out"; fi

echo v1-en-other > "$home/state/landing_previous_tag"
out=$(dl --rollback --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 1 ] && grep -q 'bump the notice version' <<<"$out"; then ok "4 --rollback to other bytes of a published version (form proxy on) → refused"
else ko "4 rollback (rc=$rc)"; echo "$out"; fi

out=$(dl v2 --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 0 ] && grep -q 'en 2026-11-05 (not published yet)' <<<"$out" && grep -q 'run publish-privacy-notice.sh' <<<"$out"; then
  ok "5 new version → passes, reminder to publish it"; else ko "5 new version (rc=$rc)"; echo "$out"; fi

out=$(dl nopages --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 0 ] && grep -q 'has no /privacy/' <<<"$out"; then ok "6 image without privacy pages → passes with a note"
else ko "6 no pages (rc=$rc)"; echo "$out"; fi

write_env off
out=$(dl v1-en-other --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 0 ] && grep -q 'WARNING: privacy page bytes changed' <<<"$out" && grep -q 'LANDING_PUBLIC_API is not on' <<<"$out"; then
  ok "7 other bytes while the form proxy is off (README 12.3 rollback c) → warning, passes"
else ko "7 proxy off (rc=$rc)"; echo "$out"; fi
write_env on

# Only the dry-run and the failed apply carry the other en hash: without the successful apply line, nothing is published.
grep -v 'landing=v1 ' "$home/state/privacy-notice.log" > "$home/state/pn.tmp"; mv "$home/state/pn.tmp" "$home/state/privacy-notice.log"
out=$(dl v1 --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 0 ] && grep -q 'en 2026-10-24 (not published yet)' <<<"$out"; then ok "8 dry-run and failed apply lines do not count as published"
else ko "8 dry-run lines (rc=$rc)"; echo "$out"; fi

rm -f "$home/state/privacy-notice.log"
out=$(dl v1-en-other --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 0 ] && grep -q 'not published yet' <<<"$out"; then ok "9 no privacy-notice.log yet (first publish) → passes"
else ko "9 no log (rc=$rc)"; echo "$out"; fi

echo "== LP-v2: 5 languages, version from the meta tag"
write_env on; publ
out=$(dl v5 --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 0 ] && grep -q 'privacy: en 2026-11-05 (not published yet) vi 2026-11-05 (not published yet) ko 2026-11-05 (not published yet) zh 2026-11-05 (not published yet) ru 2026-11-05 (not published yet)' <<<"$out" \
  && grep -q 'run publish-privacy-notice.sh' <<<"$out"; then ok "10 5-language build, new version (meta tag) → passes, every language listed"
else ko "10 five languages (rc=$rc)"; echo "$out"; fi

# The line publish-privacy-notice.sh writes since LP-v2: sha_<xx> for every language of the build.
kv=""; for p in en:privacy vi:vi/privacy ko:ko/privacy zh:zh/privacy ru:ru/privacy; do kv+="sha_${p%%:*}=$(page_sha v5 "${p#*:}/index.html") "; done
{ echo "2026-11-05T21:00:00Z apply operator=ops.test landing=v5 version=2026-11-05 ${kv}rc=0"
  echo "  NOTICE:  RESULT: published (inserted: en,vi,ko,zh,ru, already present: -)"; } >> "$home/state/privacy-notice.log"
out=$(dl v5 --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 0 ] && grep -q 'zh 2026-11-05 (same bytes as published) ru 2026-11-05 (same bytes as published)' <<<"$out"; then
  ok "11 5-language log line (sha_ko/zh/ru), same bytes → passes"; else ko "11 same bytes 5 languages (rc=$rc)"; echo "$out"; fi

out=$(dl v5-zh-other --no-pull) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 1 ] && grep -q 'FAIL: privacy page bytes changed for a published notice version (zh 2026-11-05: published sha256' <<<"$out" \
  && [ "$(cat "$home/step")" = "privacy" ]; then ok "12 same version, other bytes (zh) → refused at step privacy"
else ko "12 other bytes zh (rc=$rc)"; echo "$out"; fi

out=$(dl v1 --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 1 ] && grep -q 'FAIL: older privacy notice version than the published one (en 2026-10-24 < published 2026-11-05' <<<"$out"; then
  ok "13 a release with an older version than the published one → refused (SEC FB-R4-SEC-FE-02)"; else ko "13 older version (rc=$rc)"; echo "$out"; fi
echo v1 > "$home/state/landing_previous_tag"
out=$(dl --rollback --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 0 ] && grep -q 'WARNING: older privacy notice version' <<<"$out" && grep -q '7 days' <<<"$out"; then
  ok "13b --rollback to the 2-language build (legacy printed version) → warning (7 days), passes"; else ko "13b rollback older (rc=$rc)"; echo "$out"; fi

publ; write_env on en,vi,ko,zh,ru
out=$(dl v1 --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 1 ] && grep -q 'FAIL: LANDING_LOCALES has ko zh ru but v1 has no privacy page' <<<"$out"; then
  ok "14 LANDING_LOCALES has ko,zh,ru, image has en+vi only → refused"; else ko "14 missing languages (rc=$rc)"; echo "$out"; fi
out=$(dl --rollback --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 0 ] && grep -q 'WARNING: LANDING_LOCALES has ko zh ru' <<<"$out"; then
  ok "14b same with --rollback → warning to set LANDING_LOCALES back, passes"; else ko "14b rollback missing (rc=$rc)"; echo "$out"; fi

out=$(dl v5-2meta --no-pull --check-only) && rc=0 || rc=$?; show "$out"
if [ "$rc" -eq 0 ] && grep -q 'WARNING: privacy ko: no single notice version' <<<"$out"; then
  ok "15 two ottimo-notice-version meta tags (ko) → warning (publish-privacy-notice.sh refuses it)"; else ko "15 two meta (rc=$rc)"; echo "$out"; fi

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
