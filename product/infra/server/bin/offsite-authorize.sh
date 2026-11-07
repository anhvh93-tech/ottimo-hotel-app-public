#!/usr/bin/env bash
# Authorise the server to ADD files to the company Google Drive (push-backups-drive.sh) – root, TYPED BY INV
# (huong-dan-inv-sao-luu-google-drive.md part D). No laptop needed: Google's device flow shows a short code here, INV
# opens google.com/device on any phone or computer, signs in with the company Workspace account and allows it.
#   sudo /opt/ottimo-prod/infra/server/bin/offsite-authorize.sh             production (default)
#   sudo /opt/ottimo-prod/infra/server/bin/offsite-authorize.sh --replace   new authorisation (old one: remove it in
#                                                                           myaccount.google.com → Security → apps)
# Asks (hidden prompts, never arguments – shell history, ps) for the Client ID and Client secret of the OAuth client
# "ottimo-server-upload" (type "TVs and Limited Input devices", consent screen INTERNAL, project of the company
# Workspace). Scope asked: drive.file (+ openid email, only to show which account allowed it):
#   drive.file = the server sees and can change ONLY the files and folders it created itself through this OAuth client.
#   It cannot see, change or delete anything else in the Drive – not "OTTIMO App/Sao lưu/Kho", whose files are COPIES
#   made by the Apps Script mover (another OAuth client), so nothing on a taken-over server can remove an old backup.
# The answer is refused unless the granted scopes are exactly these (a broader client or scope = refused, nothing
# written). Writes /etc/ottimo-offsite/<stack>/drive-oauth.json (client id, client secret, refresh token), owner
# ottimo, mode 0400, directory root:ottimo 0750 – outside /opt (project, bundle) and /var/backups, so no backup set
# holds it. Printed: only the masked account (2 letters…@domain, to check it is the company account, not a personal
# one) and OK. Network: oauth2.googleapis.com, openidconnect.googleapis.com only.
set -Eeuo pipefail

stack=ottimo-prod replace=0
while [ $# -gt 0 ]; do
  case "$1" in
    --stack) stack="$2"; shift 2 ;;
    --replace) replace=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
case "$stack" in ottimo | ottimo-prod) ;; *) echo "--stack must be ottimo or ottimo-prod" >&2; exit 2 ;; esac
[ "$(id -u)" -eq 0 ] || { echo "run with sudo" >&2; exit 2; }
id ottimo >/dev/null 2>&1 || { echo "deploy user ottimo missing (bootstrap-vps.sh first)" >&2; exit 2; }
command -v jq >/dev/null && command -v curl >/dev/null || { echo "jq and curl are required" >&2; exit 2; }
OAUTH="${OFFSITE_OAUTH_BASE:-https://oauth2.googleapis.com}"
USERINFO="${OFFSITE_USERINFO_URL:-https://openidconnect.googleapis.com/v1/userinfo}"
SCOPES="https://www.googleapis.com/auth/drive.file openid email"
dir=/etc/ottimo-offsite/$stack
dest=$dir/drive-oauth.json
if [ -e "$dest" ] && [ "$replace" -eq 0 ]; then echo "$dest exists – use --replace for a new authorisation" >&2; exit 2; fi

ask() { # prompt → hidden answer on stdout
  local v
  if [ -t 0 ]; then IFS= read -rs -p "$1: " v; echo >&2; else IFS= read -r v; fi
  printf '%s' "$v" | tr -d '[:space:]'
}
client_id=$(ask "Client ID")
client_secret=$(ask "Client secret")
[[ "$client_id" =~ ^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$ ]] || { echo "REFUSED: that is not a Google OAuth Client ID" >&2; exit 1; }
[[ "$client_secret" =~ ^[A-Za-z0-9_-]{20,64}$ ]] || { echo "REFUSED: the Client secret has an unexpected form" >&2; exit 1; }

curl_form() { curl -sS --max-time 20 --proto '=https' "$@"; }
dev=$(curl_form -d "client_id=$client_id" --data-urlencode "scope=$SCOPES" "$OAUTH/device/code") \
  || { echo "could not reach Google (network)" >&2; exit 2; }
device_code=$(jq -r '.device_code // empty' <<<"$dev")
user_code=$(jq -r '.user_code // empty' <<<"$dev")
url=$(jq -r '.verification_url // .verification_uri // empty' <<<"$dev")
interval=$(jq -r '.interval // 5' <<<"$dev"); expires=$(jq -r '.expires_in // 900' <<<"$dev")
if [ -z "$device_code" ] || [ -z "$user_code" ]; then
  echo "REFUSED by Google: $(jq -r '.error // "unknown"' <<<"$dev") – check that the client type is 'TVs and Limited Input devices'" >&2
  exit 1
fi
cat >&2 <<EOF

  1. On a phone or computer open:  $url
  2. Check the account at the top right: the COMPANY Workspace account INV chose (not a personal Gmail).
  3. Type this code:               $user_code
  4. Allow "See, edit, create and delete only the specific Google Drive files you use with this app".
  Waiting (up to $((expires / 60)) minutes)…
EOF

tok="" deadline=$(( $(date +%s) + expires ))
while [ "$(date +%s)" -lt "$deadline" ]; do
  sleep "$interval"
  # Secret and codes on stdin, never in argv (ps shows argv to every user of the machine).
  r=$(curl_form --data-binary @- "$OAUTH/token" \
    <<<"client_id=$client_id&client_secret=$client_secret&device_code=$device_code&grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code") \
    || continue
  e=$(jq -r '.error // empty' <<<"$r")
  case "$e" in
    "") tok=$r; break ;;
    authorization_pending) ;;
    slow_down) interval=$((interval + 5)) ;;
    *) echo "REFUSED by Google: $e – nothing written" >&2; exit 1 ;;
  esac
done
[ -n "$tok" ] || { echo "timed out – run the script again" >&2; exit 1; }

refresh=$(jq -r '.refresh_token // empty' <<<"$tok")
access=$(jq -r '.access_token // empty' <<<"$tok")
granted=$(jq -r '.scope // empty' <<<"$tok" | tr ' ' '\n' | sed '/^$/d' | sort -u | tr '\n' ' ')
want="email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email openid "
# Google may answer "email" as userinfo.email or both; anything else (drive, drive.readonly…) is refused.
for s in $granted; do
  case " $want " in *" $s "*) ;; *) echo "REFUSED: Google granted more than drive.file ($s) – nothing written" >&2; exit 1 ;; esac
done
case " $granted " in *" https://www.googleapis.com/auth/drive.file "*) ;; *) echo "REFUSED: drive.file was not granted" >&2; exit 1 ;; esac
[ -n "$refresh" ] || { echo "REFUSED: no refresh token in the answer" >&2; exit 1; }
who=$(curl_form -H @<(printf 'Authorization: Bearer %s\n' "$access") "$USERINFO" | jq -r '.email // empty') || who=""
masked="?"
if [[ "$who" == *@* ]]; then masked="${who:0:2}…@${who#*@}"; fi

install -d -o root -g root -m 0755 /etc/ottimo-offsite
install -d -o root -g ottimo -m 0750 "$dir"
umask 077
tmp=$(mktemp "$dir/.incoming.XXXXXX")
trap 'rm -f "$tmp"' EXIT
jq -n --arg id "$client_id" --arg sec "$client_secret" --arg rt "$refresh" \
  '{type: "ottimo_drive_oauth", client_id: $id, client_secret: $sec, refresh_token: $rt, scope: "drive.file"}' > "$tmp"
chown ottimo:ottimo "$tmp"
chmod 0400 "$tmp"
mv -f "$tmp" "$dest"
trap - EXIT
echo "OK: authorised by $masked – written $dest (ottimo 0400)."
echo "If that is NOT the company account: run again with --replace, and remove the app in that account's settings."
