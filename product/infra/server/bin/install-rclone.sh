#!/usr/bin/env bash
# Install the pinned rclone (push-backups-drive.sh, fetch-backups-drive.sh) – root, idempotent, Linux amd64/arm64.
#   install-rclone.sh            download the release zip of RCLONE_PIN, check its SHA-256 against the value written
#                                below, install /usr/local/bin/rclone (root:root 0755)
# The checksums were read on 07/11/2026 from two places that agree: downloads.rclone.org/<version>/SHA256SUMS and the
# GitHub release asset digests of rclone/rclone. Changing the version = change RCLONE_PIN here AND in
# push-backups-drive.sh + fetch-backups-drive.sh, with both new checksums (test: offsite-drive.test.sh). Never pipe an
# install script from the internet into a shell; no apt/snap rclone (versions differ per Ubuntu release).
set -Eeuo pipefail

RCLONE_PIN=v1.75.2
SHA256_amd64=349ac8fba6ff65d6247043f1750cdcb518ec5d500ef91463a10d37c0ccdf3702
SHA256_arm64=7e1e8d69654941b7b7df84ee74c5f7fb09cce7d5496947fb7bf16b55ff427d10
DEST="${RCLONE_DEST:-/usr/local/bin/rclone}"

[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 2; }
case "$(uname -m)" in
  x86_64 | amd64) arch=amd64; want=$SHA256_amd64 ;;
  aarch64 | arm64) arch=arm64; want=$SHA256_arm64 ;;
  *) echo "unsupported machine $(uname -m)" >&2; exit 2 ;;
esac
if [ -x "$DEST" ] && [ "$("$DEST" version 2>/dev/null | sed -n '1s/^rclone //p')" = "$RCLONE_PIN" ]; then
  echo "rclone $RCLONE_PIN already installed at $DEST"; exit 0
fi
command -v unzip >/dev/null || { DEBIAN_FRONTEND=noninteractive apt-get -y -q install unzip >/dev/null; }
command -v curl >/dev/null && command -v sha256sum >/dev/null || { echo "curl and sha256sum are required" >&2; exit 2; }

name="rclone-$RCLONE_PIN-linux-$arch"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
curl -fsSL --proto '=https' --tlsv1.2 --max-time 300 -o "$tmp/$name.zip" "https://downloads.rclone.org/$RCLONE_PIN/$name.zip"
got=$(sha256sum "$tmp/$name.zip" | awk '{print $1}')
[ "$got" = "$want" ] || { echo "checksum mismatch for $name.zip – not installed" >&2; exit 1; }
unzip -q -j "$tmp/$name.zip" "$name/rclone" -d "$tmp/bin"
install -o root -g root -m 0755 "$tmp/bin/rclone" "$DEST"
[ "$("$DEST" version | sed -n '1s/^rclone //p')" = "$RCLONE_PIN" ] || { echo "installed binary reports another version" >&2; exit 1; }
echo "rclone $RCLONE_PIN installed at $DEST (sha256 of the zip checked)"
