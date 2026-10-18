#!/usr/bin/env bash
# Self-test of infra/docker/check-web-build-config.sh (UXR P-15): the desk phone is required for the demo and
# production web builds, optional for dev, and must follow the apps' own rule (^\+?[0-9 ]{6,20}$, >= 6 digits).
# Runs in the CI job infra-scripts (no Docker, no app build). Numbers below are dummies, never a real line.
# Exit 0 = every case behaved as expected, 1 = at least one did not.
set -Eeuo pipefail

script="$(cd "$(dirname "$0")/.." && pwd)/docker/check-web-build-config.sh"
fails=0

t() { # expected-exit profile phone
  local want="$1" profile="$2" phone="$3" got=0
  WEB_BUILD_PROFILE="$profile" VITE_DESK_PHONE="$phone" sh "$script" >/dev/null 2>&1 || got=$?
  if [ "$got" = "$want" ]; then
    echo "ok   $profile '$phone' → $got"
  else
    echo "FAIL $profile '$phone' → $got (expected $want)"
    fails=$((fails + 1))
  fi
}

# dev: anything goes (warning only)
t 0 dev ''
t 0 dev '0000 000 000'
t 0 dev '08.0000.0001'
# demo / production: a usable number
t 0 demo '0280 000 0001'
t 0 production '+84 28 0000 0001'
t 0 production '0280000001'
# demo / production: missing, placeholder or a format the apps reject
t 1 demo ''
t 1 production ''
t 1 production '0000 000 000'
t 1 demo '08.0000.0001'
t 1 production '028-000-0001'
t 1 production '(028) 0000 0001'
t 1 production '12345'
t 1 production '      '
t 1 production '+84 28 0000 0001 0000 0001'
t 1 demo "0280000001
0280000002"
# unknown profile (typo) fails even with a good number
t 2 prod '0280000001'
t 2 staging '0280000001'
# no profile = dev
WEB_BUILD_PROFILE='' VITE_DESK_PHONE='' sh "$script" >/dev/null 2>&1 && echo "ok   (no profile) → 0" \
  || { echo "FAIL (no profile) should default to dev"; fails=$((fails + 1)); }

if [ "$fails" -ne 0 ]; then
  echo "::error::check-web-build-config.sh: $fails case(s) failed"
  exit 1
fi
echo "OK: check-web-build-config.sh"
