#!/usr/bin/env bash
# Rebuilds the review pack from git (read-only: git show, no checkout). Node >= 22.18 (TypeScript type stripping).
# Usage: build.sh [lp-v2 ref] [PR #21 ref]   e.g. build.sh origin/lp-v2 origin/fe-b/notice-2026-10-31
set -euo pipefail
REF=${1:-origin/lp-v2}
REF21=${2:-origin/fe-b/notice-2026-10-31}
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(git -C "$HERE" rev-parse --show-toplevel)
OUT=$(dirname "$HERE")
W=$(mktemp -d)
trap 'rm -rf "$W"' EXIT
mkdir -p "$W/content" "$W/bs" "$W/pr21"
echo '{"type":"module"}' > "$W/package.json"
C=product/apps/landing-web/src/content
S=product/apps/landing-web/src/scripts/booking-strings
for f in en vi ko zh ru types; do
  git -C "$ROOT" show "$REF:$C/$f.ts" > "$W/content/$f.ts"
  git -C "$ROOT" show "$REF:$S/$f.ts" > "$W/bs/$f.ts"
done
git -C "$ROOT" show "$REF:$C/site.json" > "$W/content/site.json"
git -C "$ROOT" show "$REF:$C/privacy.ts" | sed "s#import { site } from './site';#import site from './site.json' with { type: 'json' };#" > "$W/content/privacy.ts"
git -C "$ROOT" show "$REF21:$C/privacy.ts" | sed "s#import { site } from './site';#import site from '../content/site.json' with { type: 'json' };#" > "$W/pr21/privacy.ts"
for f in en vi; do git -C "$ROOT" show "$REF21:$C/$f.ts" > "$W/pr21/$f.ts"; done
cp "$HERE"/*.mjs "$W/"
SHA=$(git -C "$ROOT" rev-parse --short=8 "$REF")
SHA21=$(git -C "$ROOT" rev-parse --short=8 "$REF21")
DAY=$(git -C "$ROOT" log -1 --format=%cs "$REF")
(cd "$W" && node native.mjs "$OUT" "branch lp-v2 @ $SHA, $DAY" && node privacy.mjs "$OUT" "nhánh lp-v2 @ $SHA ($DAY); đối chiếu PR #21 @ $SHA21 (fe-b/notice-2026-10-31)")
