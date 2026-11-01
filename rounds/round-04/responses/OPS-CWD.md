# OPS phản hồi – CWD-01…04 (ARC 31/10) và ARC duyệt PR #23 (01/11)

- Tác giả: OPS · Round 4, bước **Phản hồi & sửa** · 01/11/2026
- Review được trả lời:
  - `rounds/round-03/reviews/ARC-on-OPS-cwd-fb01.md` (FB-R3-ARC-OPS-CWD-01…04);
  - `rounds/round-04/reviews/ARC-on-PR23-ops-v1.0.1.md` (FB-R4-ARC-OPS-PR23-01…04, S1…S3).
- Bản sửa: PR #26, nhánh `ops/v1.0.1-rollback`, gộp cùng ĐK7 (quay lui app) theo yêu cầu ORC.
- Các test đã chạy lại trên Mac (Docker Desktop):
  - `deploy-landing-privacy.test.sh` 13/13;
  - `ops-check-cwd.test.sh` 7/7;
  - `test-ops-check.sh` 31/31;
  - `rollback.test.sh` 11/11;
  - `restore-drill-privacy.test.sh` (mới) 8/8.
- Chạy trong `ubuntu:24.04`:
  - `backup-privacy-log.test.sh` 5/5;
  - `restore-drill-privacy.test.sh` 8/8;
  - `ops-check-cwd.test.sh` chạy bằng root in `SKIP`.
- shellcheck 0.10.0 (`-x -S warning`) chạy đúng lệnh của CI, kể cả các tệp mới: sạch.

## Thẻ CWD (ARC 31/10)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R3-ARC-OPS-CWD-01 | Done | PR #23 (`755cad16`). Khi `LANDING_PUBLIC_API=on`, `deploy-landing.sh` từ chối image thiếu 2 trang privacy, và từ chối trang không in đúng một version. Test 6, 6c (proxy bật thì từ chối), 6b, 6d (proxy tắt thì cho qua). ARC đã xác nhận ở review 01/11 mục 1 |
| FB-R3-ARC-OPS-CWD-02 | Done | Bước 1 + 2: PR #23. Bước 3 (tùy chọn, đọc DB) không làm, ARC đã chấp nhận. Phần còn lại của `restore-drill` (nuốt lỗi DB) sửa theo thẻ PR23-01 bên dưới |
| FB-R3-ARC-OPS-CWD-03 | Done | PR #23: một hàm `cmd_failed` có 7 loại lỗi cố định, dùng cho `j16`, `email_dead`, `containers`, `http5xx`. Có ca 4c (`.env` hỏng) |
| FB-R3-ARC-OPS-CWD-04 | Done | Mục 1: PR #23 (`mktemp` 0600 mỗi lượt, `trap` EXIT/TERM/INT). Mục 2 + 3: PR #26 (thẻ PR23-04) |

## Thẻ ARC duyệt PR #23 (01/11)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-ARC-OPS-PR23-01 | Done | Thêm `infra/server/privacy-log-check.sh`, hàm `privacy_log_report`; `restore-drill.sh` bước 7 gọi hàm này. Truy vấn chạy với `-v ON_ERROR_STOP=1`, không còn `2>/dev/null \|\| true`. Truy vấn lỗi thì biên bản in "KHÔNG ĐỌC ĐƯỢC privacy_notice_version … – không đối chiếu được" (mã 2), drill in thêm một dòng WARNING, và không bao giờ in "khớp DB" hay "DB chưa có version". Biên bản không chép nguyên văn lỗi psql. Test mới `test/restore-drill-privacy.test.sh` (8 ca, stub `docker exec`), có trong CI: khớp; DB có version lạ; truy vấn lỗi khi có log; truy vấn lỗi khi không có log; không có log nhưng DB có version; không có log và DB rỗng; có `ON_ERROR_STOP`; drill dùng hàm này. Dòng biên bản chỉ để xem, không chặn drill: giữ đúng thiết kế README 13.6 |
| FB-R4-ARC-OPS-PR23-02 | Done | Đầu `ops-check.sh` và README mục 7 ghi lại mốc bật cho thống nhất với 13.8: chỉ bật `EMAIL_NO_RECIPIENT_ALERT=1` khi BUG-R3-032 đã lên production (**đợt 3, `v1.0.3`, không phải v1.0.1**) **và** OWN/MGR đã nhập email. README mục 7 ghi thêm hậu quả nếu bật sớm (FAIL kéo dài, nhắc lại mỗi 6 giờ). Thông báo report-only trong script vẫn như cũ |
| FB-R4-ARC-OPS-PR23-03 | Deferred | Thẻ này thuộc PR #24 (BE-D). README 13.2/13.4 sửa trong PR #24, như ARC yêu cầu. Phần của OPS đã xong ở PR #26: tệp lệnh INV A11/B11 có ghi chú dòng mới `{"level":"info","msg":"chat detail level","detailLevel":"A"}`, chấp nhận cả hai dạng. OPS đã đối chiếu dạng này với `shared/log-line.ts` của PR #24 @ `80a73367` |
| FB-R4-ARC-OPS-PR23-04 | Done | (a) `deploy-landing.sh` `privacy_check`: `docker run … --cap-drop ALL --security-opt no-new-privileges --read-only --user 65534`. `Dockerfile.landing` đặt `go=rX` cho `dist`, nên uid nobody đọc được. Test 13/13 với image thật (alpine) chạy qua các cờ này. (b) `ops-check-cwd.test.sh` chạy bằng root thì in `SKIP  ops-check-cwd: running as root – … nothing tested` ra stdout, nên log CI nhìn thấy. Tệp phản hồi: chính tệp này |
| FB-R4-ARC-OPS-PR23-S1 | Deferred | Hiện không gặp được, vì `psql_admin` chạy bằng superuser. Làm cùng lần đầu có kiểm chạy bằng vai thấp hơn, kèm ca test `ERROR: … permission denied` → `query error (permission)` |
| FB-R4-ARC-OPS-PR23-S2 | Deferred | Sửa README 13.8 (2 lệnh xem lỗi thật, dặn không chụp dòng `.env`) trong lượt làm mới gói đợt 2. Không đổi hành vi |
| FB-R4-ARC-OPS-PR23-S3 | Deferred | Loại `stack .env invalid` và `trap … ERR` cho `backup.sh` sẽ làm ở đợt 2, kèm test. Hiện lỗi vẫn lộ ra: `other error – run it by hand`, và `ops-check backup` FAIL sau 26 giờ |

## Thẻ SEC duyệt PR #26 (`rounds/round-04/reviews/SEC-on-PR26-rollback.md`, 02/11)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-OPS-PR26-01 | Done | R4 đổi thành `{ … rollback.sh sha-8b3aec89486f 2>&1; echo "MA THOAT: $?"; } \| grep -E "…"`. Bộ lọc giữ các dòng `[deploy`, `another deploy`, `usage:`, `unknown option`, `no previous tag`, `digest must`, `Error`/`ERROR` và `MA THOAT:`. Dùng nhóm lệnh `{ …; }` của POSIX, nên không phụ thuộc `PIPESTATUS`/`pipefail` của shell đăng nhập. Lệnh luôn kết thúc bằng `MA THOAT: <n>`. Cách đọc kết quả, trong mục "Khi không đúng như trên": mã 1 kèm dòng guard thì chạy lại; mã 3 kèm `another deploy` thì đợi rồi chạy lại; mọi trường hợp khác thì không chạy lại, chụp gửi đội, chạy R6. "Mọi trường hợp khác" gồm mã khác 0, dòng ngay trên `MA THOAT` không phải `OK: …`, hoặc có dòng lạ, kể cả khi không có dòng `FAIL`. `rollback.test.sh` ca (i) đọc đúng lệnh R4 từ tệp lệnh rồi chạy 4 trường hợp: thành công (6 dòng + `MA THOAT: 0`); có deploy khác (dòng `another deploy` + `MA THOAT: 3`); kéo image lỗi, script dừng do `set -e` (dòng `Error response …` + `MA THOAT: 1`); gõ nhầm `v1.0.0` (dòng guard + `MA THOAT: 1`) |
| FB-R4-SEC-OPS-PR26-02 | Done | R5 thêm câu: "không bao giờ chạy `rollback.sh` mà không ghi tên bản". README, dòng "Quay lui về bản trước", thêm: sau một lần quay lui, `previous_tag` là bản vừa bị gỡ |
| FB-R4-SEC-OPS-PR26-03 | Done | README 13.4 thêm gạch "Quay lui app khi đang ở mức B/C": OWN rà các yêu cầu đã bị xóa trong thời gian chạy bản cũ, rồi tự xóa tin Chat tương ứng. Tệp lệnh INV, ở gạch "không đụng webhook Chat", ghi rõ mức A không cần làm gì thêm, kèm lưu ý cho mức B/C |
| FB-R4-SEC-OPS-PR26-04 | Done | Hai test có thể bị `SKIP`: `rollback.test.sh` (khi thiếu `jq` hoặc thiếu tệp lệnh INV) và `ops-check-cwd.test.sh` (khi chạy bằng root). Khi `CI=true`, cả hai in `SKIP`, rồi `FAIL`, và thoát với mã 1. Trên máy trạm vẫn thoát 0. Đã kiểm trong `ubuntu:24.04` với `CI=true` |
