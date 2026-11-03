# shellcheck shell=bash
# Sourced by bin/restore-drill.sh (step 7) and test/restore-drill-privacy.test.sh – not a command.
# ARC FB-R3-ARC-OPS-CWD-02 / FB-R4-ARC-OPS-PR23-01: compare the published versions of privacy-notice.log (lines
# "… apply … version=<v> … rc=0") with privacy_notice_version in the RESTORED database.
#   privacy_log_report <postgres container> <decrypted privacy-notice.log, or "" when the set has none>
# Prints one report line (Vietnamese, for the drill report) and returns:
#   0 = log and database agree, or nothing to compare (no log, no version in the database)
#   1 = warning: the database has a version the log does not have (or the log is missing while the database has one)
#   2 = NOT compared: the database query failed – the line says so and never claims "khớp DB"
# The error text of psql is not printed (a restored database of another environment: names only, no values).
privacy_log_report() {
  local pg="$1" log="$2" db_pn log_pn only_db head=""
  if [ -n "$log" ]; then
    log_pn=$(awk '$2 == "apply" && $NF == "rc=0" { for (i = 3; i <= NF; i++) if (index($i, "version=") == 1) print substr($i, 9) }' \
      "$log" | sort -u)
    head="có trong bộ ($(wc -l < "$log" | tr -d ' ') dòng); version đã ghi: $(tr '\n' ' ' <<<"$log_pn")"
  fi
  if ! db_pn=$(docker exec -i "$pg" psql -X -v ON_ERROR_STOP=1 -U ottimo_admin -d ottimo -tA \
    -c "SELECT DISTINCT version FROM privacy_notice_version ORDER BY 1" 2>/dev/null); then
    if [ -n "$log" ]; then
      echo "${head}– KHÔNG ĐỌC ĐƯỢC privacy_notice_version trong DB khôi phục – không đối chiếu được"
    else
      echo "KHÔNG có trong bộ; KHÔNG ĐỌC ĐƯỢC privacy_notice_version trong DB khôi phục – không đối chiếu được"
    fi
    return 2
  fi
  if [ -n "$log" ]; then
    only_db=$(comm -13 <(printf '%s\n' "$log_pn" | sed '/^$/d') <(printf '%s\n' "$db_pn" | sed '/^$/d') | tr '\n' ' ')
    if [ -n "$only_db" ]; then echo "${head}– CẢNH BÁO: DB có version không có trong log: $only_db"; return 1; fi
    echo "${head}– khớp DB"
    return 0
  fi
  if [ -n "$db_pn" ]; then
    echo "KHÔNG có trong bộ – CẢNH BÁO: DB có version $(tr '\n' ' ' <<<"$db_pn")(bản sao lưu trước v1.0.1, hoặc log đã mất trên máy chủ)"
    return 1
  fi
  echo "không có (DB chưa có version thông báo nào)"
}
