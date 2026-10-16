#!/usr/bin/env bash
# Guard: the production contract and the production api bundle must not expose test-only
# endpoints (BUG-R1-SEC-08, SR-SECR-05, ADR-008, openapi.test.yaml "Quy tắc an toàn").
#
#   check-no-test-surface.sh spec   <openapi.yaml>   no path item under `paths:` starting with /__test__
#   check-no-test-surface.sh bundle <dir> [dir...]   no file contains "__test__" or "TestSupportModule"
#
# Contract for BE (R2, TestSupportModule): keep the module and its controllers under
# services/api/src/test-support/; app.module.ts loads it with a dynamic import of that folder's
# default export WITHOUT writing the words above. Dockerfile.api deletes dist/test-support unless
# built with --build-arg INCLUDE_TEST_SUPPORT=1 (dev/staging images only).
# Exit 0 = clean, 1 = test surface found, 2 = usage / missing input.
set -Eeuo pipefail

mode="${1:-}"
shift || true
[ "$#" -ge 1 ] || { echo "usage: $0 spec <openapi.yaml> | bundle <dir>..." >&2; exit 2; }

case "$mode" in
  spec)
    spec="$1"
    [ -f "$spec" ] || { echo "missing spec: $spec" >&2; exit 2; }
    # Path items are keys indented under `paths:`; descriptions mentioning `/__test__/*` are fine.
    if grep -nE "^[[:space:]]+['\"]?/__test__" "$spec"; then
      echo "::error file=$spec::production OpenAPI contains a /__test__ path (BUG-R1-SEC-08). Move it to openapi.test.yaml." >&2
      exit 1
    fi
    echo "OK: $spec has no /__test__ path"
    ;;
  bundle)
    found=0
    for dir in "$@"; do
      [ -d "$dir" ] || { echo "missing bundle dir: $dir" >&2; exit 2; }
      if grep -RlE '__test__|TestSupportModule' "$dir"; then found=1; fi
      if [ -e "$dir/test-support" ]; then echo "$dir/test-support"; found=1; fi
    done
    if [ "$found" -ne 0 ]; then
      echo "::error::production api bundle contains test-only code (__test__ / TestSupportModule) – BUG-R1-SEC-08" >&2
      exit 1
    fi
    echo "OK: no test-only code in: $*"
    ;;
  *)
    echo "usage: $0 spec <openapi.yaml> | bundle <dir>..." >&2
    exit 2
    ;;
esac
