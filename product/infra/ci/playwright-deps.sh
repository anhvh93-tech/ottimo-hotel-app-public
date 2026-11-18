#!/usr/bin/env bash
# Install Playwright OS dependencies on a GitHub-hosted Ubuntu runner, bounded in time.
# Order (R5, 18/11: apt stalls of 17 and 26 min cancelled the E2E job; a cold install needs ~105 MB / 181 packages):
#   1. .deb cache (PW_APT_CACHE_DIR, restored by actions/cache – exact runner image or, via restore-keys, an older
#      image of the same OS + Playwright version). Each cached .deb is installed only if its SHA256 equals the one in
#      the runner's own apt index (/var/lib/apt/lists, GPG-verified by apt; FB-R5-SEC-OPS-192-01); others are dropped.
#      Then `playwright install-deps --dry-run` (offline `apt-get install -s`) must report nothing missing,
#      otherwise the network step installs what is left.
#   2. Network on the runner's default (Azure) mirror, capped at PW_DEPS_TIMEOUT_1 seconds.
#   3. On timeout/failure: stop the stuck apt, switch every mirror source (incl. the runner's mirror list) to
#      archive.ubuntu.com and retry, capped at PW_DEPS_TIMEOUT_2 seconds. .debs fully fetched by step 2 stay in
#      /var/cache/apt/archives, so the retry only fetches the rest. Still failing = the step fails (no skip).
# Only after a successful install are the .debs copied to PW_APT_CACHE_DIR and `saved=true` written to
# $GITHUB_OUTPUT (a failed install never produces a cache to save).
# Usage: playwright-deps.sh <browser>...
set -euo pipefail

T1="${PW_DEPS_TIMEOUT_1:-480}"
T2="${PW_DEPS_TIMEOUT_2:-480}"
CACHE_DIR="${PW_APT_CACHE_DIR:-}"

pw() {
  pnpm --filter @ottimo/tests exec playwright "$@"
}

deps_present() {
  pw install-deps --dry-run "$@" >/dev/null 2>&1
}

output() {
  [ -n "${GITHUB_OUTPUT:-}" ] && echo "$1" >>"$GITHUB_OUTPUT"
  return 0
}

# 1. Cached packages, verified against the local signed apt index
if [ -n "$CACHE_DIR" ] && compgen -G "$CACHE_DIR/*.deb" >/dev/null; then
  verified=()
  dropped=0
  for deb in "$CACHE_DIR"/*.deb; do
    pkg=$(dpkg-deb -f "$deb" Package 2>/dev/null) || { rm -f "$deb"; dropped=$((dropped + 1)); continue; }
    ver=$(dpkg-deb -f "$deb" Version)
    arch=$(dpkg-deb -f "$deb" Architecture)
    want=$(apt-cache show "$pkg:$arch=$ver" 2>/dev/null | awk '/^SHA256: /{print $2}' | sort -u)
    have=$(sha256sum "$deb" | awk '{print $1}')
    if [ -n "$want" ] && grep -qx "$have" <<<"$want"; then
      verified+=("$deb")
    else
      # Not re-saved with the next cache (main only): only verified packages travel between runs.
      rm -f "$deb"
      dropped=$((dropped + 1))
    fi
  done
  echo "Cache: ${#verified[@]} .deb verified against the apt index, $dropped dropped (unknown version or hash mismatch)"
  if [ "${#verified[@]}" -gt 0 ]; then
    sudo dpkg -i --skip-same-version --refuse-downgrade "${verified[@]}" >/dev/null || true
  fi
  if deps_present "$@"; then
    echo "All Playwright OS dependencies installed from the cache (no network)."
    exit 0
  fi
  echo "::warning::cached .deb packages incomplete – installing the rest from the network"
  sudo dpkg --configure -a || true
fi

# Keep the downloaded packages so they can be cached (apt-get keeps them by default; make it explicit).
echo 'APT::Keep-Downloaded-Packages "true"; Binary::apt-get::APT::Keep-Downloaded-Packages "true";' |
  sudo tee /etc/apt/apt.conf.d/99ottimo-keep-debs >/dev/null
# Fail a stalled connection fast instead of waiting on it (apt retries the next mirror / the next try).
echo 'Acquire::http::Timeout "30"; Acquire::https::Timeout "30"; Acquire::Retries "3";' |
  sudo tee /etc/apt/apt.conf.d/99ottimo-net >/dev/null

save_cache() {
  [ -n "$CACHE_DIR" ] || return 0
  mkdir -p "$CACHE_DIR"
  if compgen -G "/var/cache/apt/archives/*.deb" >/dev/null; then
    cp /var/cache/apt/archives/*.deb "$CACHE_DIR"/
    echo "Cache dir now holds $(find "$CACHE_DIR" -name '*.deb' | wc -l) .deb packages"
    output saved=true
  fi
}

# 2. Default mirror
if timeout "$T1" bash -c "$(declare -f pw); pw install-deps $*"; then
  save_cache
  exit 0
fi

# 3. archive.ubuntu.com
echo "::warning::playwright install-deps timed out (${T1}s) or failed – retrying on archive.ubuntu.com"
sudo pkill -x apt-get || true
sudo pkill -x dpkg || true
# Wait for apt/dpkg locks instead of failing on them in the retry.
echo 'DPkg::Lock::Timeout "120";' | sudo tee /etc/apt/apt.conf.d/99ottimo-lock-timeout >/dev/null
sudo dpkg --configure -a || true
for f in /etc/apt/apt-mirrors.txt /etc/apt/sources.list /etc/apt/sources.list.d/*.sources; do
  [ -f "$f" ] && sudo sed -i 's#azure\.archive\.ubuntu\.com#archive.ubuntu.com#g' "$f"
done
if timeout "$T2" bash -c "$(declare -f pw); pw install-deps $*"; then
  save_cache
  exit 0
fi
echo "::error::playwright install-deps failed on both mirrors (${T1}s + ${T2}s)"
exit 1
