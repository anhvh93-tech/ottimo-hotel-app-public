#!/usr/bin/env bash
# Test of check-confidential-paths.sh (SEC G2) on throw-away git repositories – the guard must go RED for a tracked
# file that matches, also when forced past .gitignore (`git add -f`) or renamed into another folder, and stay green
# for a clean tree and for an untracked (ignored) table. Placeholder file contents only – no number of any table.
#   bash product/infra/ci/test-confidential-paths.sh
set -Eeuo pipefail
here=$(cd "$(dirname "$0")" && pwd)
check="$here/check-confidential-paths.sh"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0 fail=0
expect() { # name rc regex repo
  local out rc=0
  out=$(bash "$check" "$4" 2>&1) || rc=$?
  if [ "$rc" = "$2" ] && grep -Eq "$3" <<<"$out"; then pass=$((pass + 1)); echo "ok   $1"
  else fail=$((fail + 1)); echo "FAIL $1 (rc=$rc): $out"; fi
}
mkrepo() { # dir
  mkdir -p "$1/00-brief/context" "$1/product"
  git -C "$1" init -q
  git -C "$1" config user.email ci@example.test; git -C "$1" config user.name ci
  printf '# INV internal pricing/commission tables – never commit\n00-brief/context/pricing/\n' > "$1/.gitignore"
  echo placeholder > "$1/product/readme.md"
  git -C "$1" add .gitignore product/readme.md
}

mkrepo "$T/clean"
expect "clean tree -> ok"                             0 '^confidential-paths: ok' "$T/clean"
mkdir -p "$T/clean/00-brief/context/pricing"; echo placeholder > "$T/clean/00-brief/context/pricing/OTTIMO_pricing_spec-2026-11-01.md"
expect "table on disk but ignored, untracked -> ok"   0 '^confidential-paths: ok' "$T/clean"

mkrepo "$T/forced"
mkdir -p "$T/forced/00-brief/context/pricing"; echo placeholder > "$T/forced/00-brief/context/pricing/table.md"
git -C "$T/forced" add -f 00-brief/context/pricing/table.md
expect "git add -f into pricing/ -> RED"              1 '^  00-brief/context/pricing/table\.md$' "$T/forced"

mkrepo "$T/renamed"
mkdir -p "$T/renamed/rounds"; echo placeholder > "$T/renamed/rounds/Ottimo_Pricing_Spec copy.md"
git -C "$T/renamed" add "rounds/Ottimo_Pricing_Spec copy.md"
expect "spec copied elsewhere, other case -> RED"     1 'FAIL – 1 tracked file' "$T/renamed"
out=$(bash "$check" "$T/renamed" 2>&1 || true)
if grep -q placeholder <<<"$out"; then fail=$((fail + 1)); echo "FAIL file content printed"; else pass=$((pass + 1)); echo "ok   paths only, no content printed"; fi

expect "not a git checkout -> 2"                      2 'not a git checkout' "$T"

echo "test-confidential-paths: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
