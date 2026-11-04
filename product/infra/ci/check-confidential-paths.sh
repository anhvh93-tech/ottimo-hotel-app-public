#!/usr/bin/env bash
# Guard (SEC FB-R4-SEC-OPS-01 / SEC-on-commission-numbers G2): INV's internal pricing / commission tables never enter
# this public repository. Red when a TRACKED file (git index of the checkout) matches
#   00-brief/context/pricing/**       the folder of the internal tables (.gitignore G1 is only the first fence:
#                                     `git add -f`, a copy into another worktree or a tool that ignores .gitignore)
#   *OTTIMO_pricing_spec*             the internal spec under any name or folder (letter case ignored)
# By PATH only: no list of numbers is kept here or in CI – such a list would itself publish the numbers (G2). Only
# the matching paths are printed, never a line of a file.
#   check-confidential-paths.sh [repo dir]     (default: the repository that holds this script)
# Exit 0 = clean, 1 = confidential path tracked, 2 = not a git checkout.
set -Eeuo pipefail

repo="${1:-$(cd "$(dirname "$0")/../../.." && pwd)}"
git -C "$repo" rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "confidential-paths: $repo is not a git checkout" >&2; exit 2; }

# git pathspec magic does the matching (case-insensitive, ** = any folder, also the root); -z: NUL-terminated paths,
# no quoting of unusual names. --full-name + --top: the whole index, whatever the current directory.
hits=()
while IFS= read -r -d '' f; do hits+=("$f"); done < <(
  git -C "$repo" ls-files -z --full-name -- ':(top,icase,glob)00-brief/context/pricing/**' \
    ':(top,icase,glob)**/*ottimo_pricing_spec*')

if [ "${#hits[@]}" -gt 0 ]; then
  echo "confidential-paths: FAIL – ${#hits[@]} tracked file(s) on a confidential path (SEC G2). Remove them from git"
  echo "(git rm --cached <path>), keep the table outside the repository, and tell SEC: a pushed commit cannot be recalled."
  printf '  %s\n' "${hits[@]}"
  exit 1
fi
echo "confidential-paths: ok – no tracked file under 00-brief/context/pricing/ or named *OTTIMO_pricing_spec*"
