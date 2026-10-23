#!/usr/bin/env bash
# Restore drill in a THROW-AWAY environment (hosting-plan 7.1, SR-BAK-05) – never into staging/production/dev.
# Runs on the OPS laptop or the second VPS (docker + age), never on the server that made the backup:
#   restore-drill.sh --identity <age identity file> --from <dir with db-*/blobs-*/purge-journal-*.age> \
#                    --api-image <image:tag> [--stamp <UTC stamp>] [--keep]
# Steps: verify checksums → decrypt into a temp dir → compose-less stack `ottimo-restore-<stamp>` on an internal
# network (no published port): postgres + roles (02-roles.sh) → pg_restore → blobs into a fresh volume → api from
# the same image on the restored database → /health, table counts, blob count, migration count → report → remove
# everything (containers, volumes, network, decrypted files) unless --keep.
# Counts (R3 v1.0): backup.sh stores counts-<stamp>.txt.age = row counts + money totals (reservations, folios,
# folio lines, payments …) read in the dump's own snapshot; the drill runs the same SQL (infra/server/backup-counts.sql)
# on the restored database and passes only when every number is equal (backups older than that file: counts shown only).
# KEK: not needed for this drill (counts + health). Decrypting one sample document needs the environment's KEK in a
# tmpfs secret only for the drill (hosting-plan 7.1 step 3) – R3 together with BE (verification command in the image).
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
roles_sh="$here/../../postgres/init/02-roles.sh"
counts_sql="$here/../backup-counts.sql"
PG_IMAGE="${PG_IMAGE:-postgres:17-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24}"
identity="" from="" api_image="" stamp="" keep=0
while [ $# -gt 0 ]; do
  case "$1" in
    --identity) identity="$2"; shift 2 ;;
    --from) from="$2"; shift 2 ;;
    --api-image) api_image="$2"; shift 2 ;;
    --stamp) stamp="$2"; shift 2 ;;
    --keep) keep=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -r "$identity" ] && [ -d "$from" ] && [ -n "$api_image" ] || {
  echo "usage: $0 --identity <age identity> --from <backup dir> --api-image <image:tag> [--stamp <stamp>] [--keep]" >&2; exit 2; }
command -v age >/dev/null || { echo "age is required" >&2; exit 2; }
[ -r "$roles_sh" ] || { echo "missing $roles_sh" >&2; exit 2; }
[ -r "$counts_sql" ] || { echo "missing $counts_sql" >&2; exit 2; }

if [ -z "$stamp" ]; then
  stamp=$(ls "$from"/db-*.dump.age 2>/dev/null | sed -E 's/^.*db-([0-9]{8}T[0-9]{6}Z)\.dump\.age$/\1/' | sort | tail -n 1)
fi
[ -n "$stamp" ] || { echo "no db-*.dump.age in $from" >&2; exit 2; }
t0=$(date +%s)
name="ottimo-restore-$(echo "$stamp" | tr '[:upper:]' '[:lower:]')"
work=$(mktemp -d "${TMPDIR:-/tmp}/ottimo-restore.XXXXXX")
chmod 700 "$work"
log() { echo "[restore-drill $(date -u +%H:%M:%S)] $*"; }

cleanup() {
  if [ "$keep" -eq 0 ]; then
    docker rm -f "$name-api" "$name-pg" >/dev/null 2>&1 || true
    docker volume rm "$name-pg" "$name-blobs" >/dev/null 2>&1 || true
    docker network rm "$name" >/dev/null 2>&1 || true
    rm -rf "$work"
    log "throw-away environment removed"
  else
    log "--keep: containers $name-*, volumes $name-pg/$name-blobs, files $work are still there – remove them"
  fi
}
trap cleanup EXIT

# 1. checksums + decrypt (files stay in a 0700 temp dir, removed at exit)
for kind in "db-$stamp.dump" "blobs-$stamp.tar" "purge-journal-$stamp.csv"; do
  f="$from/$kind.age"
  [ -r "$f" ] || { log "missing $f"; exit 1; }
  if [ -r "$f.sha256" ]; then
    (cd "$from" && sha256sum -c "$(basename "$f").sha256" >/dev/null 2>&1 || shasum -a 256 -c "$(basename "$f").sha256" >/dev/null) \
      || { log "checksum mismatch: $f"; exit 1; }
  fi
  age --decrypt --identity "$identity" -o "$work/$kind" "$f"
done
expected=""
if [ -r "$from/counts-$stamp.txt.age" ]; then
  (cd "$from" && { sha256sum -c "counts-$stamp.txt.age.sha256" >/dev/null 2>&1 || shasum -a 256 -c "counts-$stamp.txt.age.sha256" >/dev/null; }) \
    || { log "checksum mismatch: counts-$stamp.txt.age"; exit 1; }
  expected=$(age --decrypt --identity "$identity" "$from/counts-$stamp.txt.age")
fi
log "decrypted backup $stamp"

# 2. throw-away PostgreSQL with the same roles (random passwords, this drill only)
docker network create --internal "$name" >/dev/null
openssl rand -hex 24 > "$work/pg_pw"; openssl rand -hex 24 > "$work/app_pw"; openssl rand -hex 24 > "$work/mig_pw"
docker run -d --name "$name-pg" --network "$name" \
  -e POSTGRES_USER=ottimo_admin -e POSTGRES_DB=ottimo -e OTTIMO_DATABASES=ottimo \
  -e POSTGRES_PASSWORD="$(cat "$work/pg_pw")" \
  -e OTTIMO_APP_DB_PASSWORD="$(cat "$work/app_pw")" -e OTTIMO_MIGRATOR_DB_PASSWORD="$(cat "$work/mig_pw")" \
  -v "$name-pg:/var/lib/postgresql/data" \
  -v "$(cd "$(dirname "$roles_sh")" && pwd)/02-roles.sh:/docker-entrypoint-initdb.d/02-roles.sh:ro" \
  "$PG_IMAGE" >/dev/null
for _ in $(seq 1 60); do
  docker exec "$name-pg" pg_isready -h 127.0.0.1 -U ottimo_admin -d ottimo >/dev/null 2>&1 && break
  sleep 2
done
docker exec "$name-pg" pg_isready -h 127.0.0.1 -U ottimo_admin -d ottimo >/dev/null || { log "postgres did not start"; exit 1; }

# 3. restore (objects owned by ottimo_owner, grants to ottimo_app/readonly come back with the dump)
docker exec -i "$name-pg" pg_restore -U ottimo_admin -d ottimo --exit-on-error --single-transaction < "$work/db-$stamp.dump"
log "database restored"

# 4. blobs into a fresh volume, owned by `node` (uid 1000) like on the server
docker volume create "$name-blobs" >/dev/null
docker run --rm -i --network none -u 0 --entrypoint sh -v "$name-blobs:/var/lib/ottimo/blobs" "$api_image" \
  -c 'tar -C /var/lib/ottimo/blobs -xf - && chown -R 1000:1000 /var/lib/ottimo/blobs && chmod 0700 /var/lib/ottimo/blobs' \
  < "$work/blobs-$stamp.tar"
blob_files=$(docker run --rm --network none -u 1000 --entrypoint sh -v "$name-blobs:/var/lib/ottimo/blobs:ro" "$api_image" \
  -c 'find /var/lib/ottimo/blobs -type f ! -name "*.part" | wc -l' | tr -d ' ')
log "blobs restored: $blob_files files"

# 5. api from the same image against the restored database (APP_ENV=test: no TLS/origin requirements here)
docker run -d --name "$name-api" --network "$name" --read-only --tmpfs /tmp --cap-drop ALL \
  --security-opt no-new-privileges:true \
  -e APP_ENV=test -e NODE_ENV=production -e CLOCK_MODE=system \
  -e DATABASE_URL="postgres://ottimo_app:$(cat "$work/app_pw")@$name-pg:5432/ottimo" \
  -e BLOBSTORE_PROVIDER=local -e BLOBSTORE_LOCAL_PATH=/var/lib/ottimo/blobs \
  -v "$name-blobs:/var/lib/ottimo/blobs" "$api_image" >/dev/null
health=""
for _ in $(seq 1 45); do
  health=$(docker exec "$name-api" wget -qO- http://127.0.0.1:3000/health 2>/dev/null || true)
  case "$health" in *'"status":"ok"'*) break ;; esac
  sleep 2
done
case "$health" in *'"status":"ok"'*) log "api /health ok on the restored database" ;; *) docker logs --tail 40 "$name-api"; log "FAIL: api /health"; exit 1 ;; esac

# 6. counts on the restored database, compared with the numbers recorded in the dump snapshot (counts-<stamp>)
counts=$(grep -v '^--' "$counts_sql" | docker exec -i "$name-pg" psql -X -v ON_ERROR_STOP=1 -U ottimo_admin -d ottimo -tA -F ' ')
verdict="ĐẠT – /health ok"
diffs=""
if [ -n "$expected" ]; then
  diffs=$(diff <(sort <<<"$expected") <(sort <<<"$counts") || true)
  if [ -n "$diffs" ]; then verdict="KHÔNG ĐẠT – số liệu sau khôi phục khác số ghi lúc sao lưu"; fi
else
  verdict="ĐẠT – /health ok (bản sao lưu cũ: không có tệp counts để so)"
fi
pj_lines=$(( $(wc -l < "$work/purge-journal-$stamp.csv") - 1 ))
t1=$(date +%s)
echo "================ BIÊN BẢN DIỄN TẬP KHÔI PHỤC (dán vào report OPS) ================"
echo "Ngày chạy (UTC):        $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Bản sao lưu:            $stamp (từ $from)"
echo "Image api:              $api_image"
echo "Kết quả:                $verdict"
echo "Thời gian khôi phục:    $((t1 - t0)) giây (giải mã + DB + tệp + khởi động api)"
echo "Số tệp blob:            $blob_files"
echo "purge_journal (tệp riêng): $pj_lines dòng – áp lại sau khôi phục theo SR-BAK-06 (lệnh áp lại: R3, BE + OPS)"
echo "Đếm bảng (sau khôi phục; so với lúc sao lưu: $([ -n "$expected" ] && { [ -z "$diffs" ] && echo 'khớp 100 %' || echo 'LỆCH'; } || echo 'không có'))":
sed 's/^/  /' <<<"$counts"
if [ -n "$diffs" ]; then echo "Khác biệt (< lúc sao lưu, > sau khôi phục):"; sed 's/^/  /' <<<"$diffs"; fi
echo "=============================================================================="
[ -z "$diffs" ] || exit 1
