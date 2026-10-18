#!/bin/sh
# Build-time settings of the web SPAs (infra/docker/Dockerfile.web, stage `web-config`) – UXR P-15, R2 Sprint 4.
# The staff PWA ("Sự cố gấp? Gọi lễ tân ngay" button) and the guest web (expired-link page) read the front desk
# phone VITE_DESK_PHONE at BUILD time (apps/mobile/src/app/config.ts deskPhone(), apps/guest-web/src/app/config.ts
# fallbackDeskPhone()). An image built without it silently hides the call button, so the profiles that reach real
# users refuse to build without a usable number.
#
#   WEB_BUILD_PROFILE  dev (default – number optional, a bad one only warns)
#                      demo (infra/demo/demo-up.sh) | production (CI publish-images) – number required
#   VITE_DESK_PHONE    public desk number: digits and spaces, one optional leading +, 6–20 characters, at least 6
#                      digits – the SAME rule as the apps. "0xx.xxxx.xxxx" or "0xx-xxx-xxxx" would build but hide
#                      the button, so they are refused here. The all-zero placeholder of .env.example is refused
#                      for demo/production.
#
# The number is public, still this script never prints it: messages only name the problem.
# Usable in the image (busybox sh) and on any host (POSIX sh). Self-test: infra/ci/test-web-build-config.sh.
# Exit 0 = ok, 1 = refused, 2 = unknown profile.
set -eu

profile="${WEB_BUILD_PROFILE:-dev}"
phone="${VITE_DESK_PHONE:-}"
hint="demo: add VITE_DESK_PHONE=<desk number> to product/.env (never committed); production: repository variable VITE_DESK_PHONE (GitHub → Settings → Variables)"

case "$profile" in
  dev) required=0 ;;
  demo | production) required=1 ;;
  *)
    echo "web build config: WEB_BUILD_PROFILE '$profile' unknown (dev | demo | production)" >&2
    exit 2
    ;;
esac

refuse() { # message
  if [ "$required" -eq 1 ]; then
    echo "web build config ($profile): $1 – the \"Gọi lễ tân\" button would be missing (UXR P-15). $hint" >&2
    exit 1
  fi
  echo "web build config (dev): warning – $1; the \"Gọi lễ tân\" button stays hidden in this build" >&2
  exit 0
}

[ -n "$phone" ] || refuse "VITE_DESK_PHONE is not set"

nl='
'
case "$phone" in
  *"$nl"*) refuse "VITE_DESK_PHONE spans several lines" ;;
esac
# Same pattern as the apps: ^\+?[0-9 ]{6,20}$
printf '%s\n' "$phone" | grep -Eq '^\+?[0-9 ]{6,20}$' \
  || refuse "VITE_DESK_PHONE has characters the apps reject (digits, spaces and one leading + only, 6-20 characters; no dots, dashes or brackets)"
digits=$(printf '%s' "$phone" | tr -cd '0-9')
[ "${#digits}" -ge 6 ] || refuse "VITE_DESK_PHONE has fewer than 6 digits"
case "$digits" in
  *[1-9]*) ;;
  *)
    if [ "$required" -eq 1 ]; then
      echo "web build config ($profile): VITE_DESK_PHONE is still the all-zero placeholder of .env.example (UXR P-15). $hint" >&2
      exit 1
    fi
    echo "web build config (dev): VITE_DESK_PHONE is the placeholder of .env.example (the button calls a dummy number)"
    exit 0
    ;;
esac

echo "web build config ($profile): VITE_DESK_PHONE set (${#digits} digits)"
