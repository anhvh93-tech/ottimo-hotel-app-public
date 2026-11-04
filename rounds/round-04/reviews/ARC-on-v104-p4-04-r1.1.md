# ARC review lại – P4-04 `v104/ops-check` r1.1 (OPS, PR-M)

- Round 4 (v1.0.4), bước **Review**, 04/11/2026.
- Đầu nhánh `16ee56e4`. ARC đọc phần chênh `ce08b63a..16ee56e4`, bỏ commit gộp PR #45 `de2355dd` (= `051e1750`, đã review ở P4-02, đã vào `main`). Phần riêng của r1.1 là `git diff de2355dd 16ee56e4`, gồm 14 tệp:
  - `deploy.sh`, `02-roles.sh`, `ops-check.sh`;
  - `requeue-email-changed.sh` (chỉ chú thích);
  - CODEOWNERS và mẫu PR (thẻ SEC 01);
  - các test, runbook, README 13.8, `responses/OPS-P4-04.md` mục r1.1.
- Hai commit `56439561` và `045e74b9` theo hướng "lọc stderr" đã được commit cuối `16ee56e4` thay hết. ARC chỉ chấm trạng thái ở `16ee56e4`.
- Căn cứ: `ARC-on-v104-p4-04-r1.md` (thẻ 08–14 và 4 điều kiện gộp).

## Phán quyết: **ĐẠT** – PR-M gộp được về phía ARC

- Thẻ 08, 09, 10, 11, 12a, 12b, 14 đã đóng. ARC đã kiểm trên DB thật (mục 2).
- Thẻ 13: ARC **chấp nhận dời sang v1.0.5**. Thẻ là Suggestion. Runbook K10/K11 (b) đã ghi rõ giới hạn "một property, sau 07:00 giờ Đà Lạt", và N3 làm trong khung 09:00–11:00.
- Bốn điều kiện gộp của r1:

| # | Điều kiện | Kết quả |
|---|---|---|
| (1) | r1.1 sửa `deploy.sh` bước `roles` | **Đạt** (thẻ 11, mục 1) |
| (2) | Sửa thẻ 08, 09, 10 | **Đạt** |
| (3) | BE-D xác nhận P4-13 | **Đạt, ARC đã kiểm lại.** `v104/be-pn01` @ `3c2b17bb`: 0095 `0095_privacy_notice_append_only_whole_row` ở idx 71, `when` 1792782179681 (= idx 70 + 2000, tăng nghiêm ngặt). Tệp chỉ có `CREATE OR REPLACE FUNCTION privacy_notice_version_append_only()`, không có `CREATE/DROP TRIGGER`, `GRANT` hay `REVOKE`. Trên DB 72 migration, `db_triggers` ra `ok … PN-01 triggers enabled, ottimo_app SELECT only` |
| (4) | CI xanh | **Vẫn là điều kiện của ORC lúc gộp**. Tại máy, `test-deploy-from-ci.sh` đỏ ở `step=lock` vì Mac không có `flock`. Nền `de2355dd` cũng đỏ y như vậy (11 ca), nên lỗi là do môi trường. Container `ubuntu:24.04` không mạng thì thiếu `jq` và `git`. Ca (h) mới phải xanh trên runner CI |

- Thẻ mới duy nhất là P404-15 (Suggestion), không chặn gộp.
- Cổng SEC cho các đường dẫn SEC (`deploy.sh`, `02-roles.sh`, CODEOWNERS) là việc của SEC (`SEC-on-v104-p4-04-r1.1.md`). Bài này không thay cổng đó.

## 1. Trạng thái thẻ ARC

| Thẻ | OPS trả lời | ARC xác nhận | Bằng chứng |
|---|---|---|---|
| P404-08 (Minor) | Done | **Verified** | SQL đọc thêm `to_regprocedure('public.room_list_price_append_only()')`. `absent` chỉ được `ok` khi hàm cũng chưa có. Trigger phải `tgtype & 11 = 11` (ROW + BEFORE + DELETE). Thiếu dòng `rlpfn` → `unexpected answer`. Kiểm trên DB thật ở mục 2 |
| P404-09 (Minor) | Done | **Verified** | `mode = trim(EMAIL_SMTP_MODE)`, trống thì là `relay`. Mode khác `relay\|app_password` → `FAIL` (kể cả `Relay`, vì `smtpModeOf` so đúng chữ). `USER` và `FROM` được cắt khoảng trắng; `from = FROM \|\| USER`; ở `relay` không kiểm `USER`. Dòng `ok` ghi chế độ. Đúng cả 4 ca ARC đã nêu, và thêm 2 ca `FAIL` đúng: `FROM` + `USER` cùng trống, và `app_password` thiếu `USER` |
| P404-10 (Minor) | Done | **Verified** | P2 có câu `hold_expires_at < now()` sau `HOLD_BASE`; "Đúng là" thêm `HOLD_OVERDUE_AT_UPGRADE`. R4: "Các trường hợp khác: mục 4.1" |
| P404-11 (Minor) | Done | **Verified**, có 1 Suggestion (thẻ 15) | Đối chiếu 7 điều kiện, bảng dưới |
| P404-12a (Sugg.) | Done | **Verified** | `Running` khác `true` → `FAIL … <s> not running at inspect`. Số `RestartCount` vẫn được ghi làm mốc. `ops-check-cwd.test.sh` 14/14 |
| P404-12b (Sugg.) | Done | **Verified** | P2b bước 6: `FAIL … since it was created` ở lượt đầu thì ghi số N, chỉ đếm dòng lỗi của `dc logs --since 24h`, chạy lại. Lượt sau `ok` và không có dòng lỗi mới thì ORC + OPS ghi decision-log rồi đi tiếp |
| P404-13 (Sugg.) | Dời v1.0.5 | **Chấp nhận** | Runbook K10, K11 (b) ghi rõ giới hạn |
| P404-14 (Sugg.) | Done | **Verified** | `02-roles.sh` đặt `SET log_min_error_statement = panic`, `log_statement = 'none'`, `log_min_duration_statement = -1` ở đầu đúng heredoc có `PASSWORD`. `rollback.test.sh` (r) khóa thứ tự này. Kiểm trên DB thật ở mục 2 |

### Thẻ 11: đối chiếu 7 điều kiện

| ĐK | Yêu cầu | Kết quả |
|---|---|---|
| 1 | Tệp của stack qua stdin; thiếu hoặc rỗng → dừng trước `migrate` | Đạt. `roles_file="$OTTIMO_HOME/infra/postgres/init/02-roles.sh"`, kiểm `-f -r -s`, rồi `dc exec -T postgres bash -s <"$roles_file"`. `bin/dc` chuyển stdin sang `docker compose`. Không còn lời gọi `/docker-entrypoint-initdb.d`. Test (p), (q) thiếu tệp, (q) tệp rỗng |
| 2 | Đọc lại dấu hiệu bản mới | Đạt. `psql_admin` được chuyển lên trước, đọc `count(ottimo_requeue)` và quyền `SELECT` của `ottimo_readonly` trên `drizzle.__drizzle_migrations`. Chỉ nhận `1,true` hoặc `1,absent`. Test (s) có 5 ca. Kiểm trên DB thật: sau migrate `1,false`, sau khi áp lại `1,true` |
| 3 | stderr không vào log, chỉ câu cố định + rc | Đạt, theo hướng SEC chọn (bỏ hết, không lọc): stdout vào `/dev/null`, stderr vào `mktemp` 0600 rồi xóa, log in `FAIL: 02-roles.sh failed (rc=N) – output withheld; re-run … P2b step 5`. Tệp tạm không có ích gì: thẻ 15 |
| 4 | Test sha256 stdin / SENTINEL / dấu hiệu | Đạt. `rollback.test.sh` (p)(q)(r)(s): 37/37 tại máy. `test-deploy-from-ci.sh` (h): stdin `cmp` trùng tệp, SENTINEL không có trong dòng CI hay `state/deploy-logs`; ca này chờ CI (điều kiện 4) |
| 5 | Thứ tự không đổi, vẫn 6 dòng `[deploy` | Đạt. Dòng `log` cũ được thay bằng một dòng mới, nên số dòng không đổi. Test (s) `1,absent` kiểm 6 dòng. `--rollback` đi cùng bước này |
| 6 | Runbook giữ P2b bước 5, có câu "khi nào hết cần" | Đạt. Bước 5 giữ cho v1.0.4 với 3 công dụng (a)(b)(c). G6, rủi ro mục 8 và "Việc còn lại" #20 đã cập nhật. Câu "log Actions công khai" đã sửa thành "log trên máy chủ" (`deploy-from-ci.sh` chỉ trả về một dòng) |
| 7 | SEC review vì `deploy.sh` có dòng SEC | Thuộc SEC (`SEC-on-v104-p4-04-r1.1.md`). Sửa trên `v104/ops-check` thay vì PR-A là quyết định của ORC; PR #45 đã vào `main`, nên không còn vấn đề thứ tự gộp |

## 2. Kiểm ARC đã chạy

Môi trường: worktree tạm `scratchpad/wt-arc-p404b` (@ `16ee56e4`) và `wt-arc-p404b-base` (@ `de2355dd`); container `postgres:17-alpine` tạm `arc-p404b-pg`, không cổng, dùng mật khẩu giả. Đã xóa cả ba.

| Kiểm | Kết quả |
|---|---|
| `test-ops-check.sh` / `ops-check-cwd.test.sh` / `ops-check-price.test.sh` / `test-confidential-paths.sh` / `requeue-email-changed.test.sh` / `rollback.test.sh` / `mail-test-send.test.sh` (Mac, `CI=true`) | 183 / 14 / 17 / 6 / 69 / 37 / 37 passed, 0 failed |
| `test-deploy-from-ci.sh` (Mac) | 12 ca đỏ ở `step=lock` (không có `flock`). Nền `de2355dd`: 11 ca đỏ cùng lý do. Không kết luận được tại máy; chờ CI |
| 72 migration (`v104/be-pn01`: tới 0095) chạy bằng `SET ROLE ottimo_owner`, rồi câu dấu hiệu của `deploy.sh` | Trước khi áp lại vai: `1,false`, nên `deploy.sh` sẽ dừng. Sau `bash -s < 02-roles.sh`: `1,true` |
| `ops-check db_triggers` (bản `16ee56e4`) trên DB 72 migration | `ok … enabled`. Xóa trigger (hàm còn) → `FAIL … missing (function present – migration 0094 ran)`. `AFTER DELETE` → `FAIL … O\|f\|f`. `FOR EACH STATEMENT` → `FAIL … O\|f\|f`. `BEFORE DELETE OR UPDATE … ROW` → `ok` (chặt hơn, chấp nhận được). Xóa cả hàm lẫn trigger (dạng trước 0094) → `ok … not present yet` |
| `ops-check email_config` | mode trống + `USER` trống → `ok … EMAIL_SMTP_MODE=relay`. `relay` + `USER` không phải địa chỉ + `FROM` có khoảng trắng hai đầu → `ok … (EMAIL_SMTP_USER ignored in relay)`. `app_password` thiếu `USER` → `FAIL`. `Relay` → `FAIL … invalid`. `FROM` dạng `Tên <…>` → `FAIL`. `FROM` và `USER` cùng trống → `FAIL … EMAIL_FROM empty`. Mọi ca khớp `smtp.ts` |
| Log máy chủ khi `ALTER ROLE <không có> PASSWORD :'pw'` lỗi | Có 3 dòng `SET log_*` của r1.1: chuỗi thử **0** lần trong `docker logs`. Đối chứng không có `SET`: **1** lần |

## 3. Thẻ mới

### FB-R4-ARC-OPS-P404-15
- Mức độ: Suggestion
- Vị trí: `deploy.sh` bước `roles` (`roles_err=$(umask 077 && mktemp "${TMPDIR:-/tmp}/ottimo-roles.XXXXXX")` … `rm -f "$roles_err"`).
- Vấn đề: stderr của `02-roles.sh` được ghi vào một tệp tạm nhưng **không bao giờ được đọc**, rồi bị xóa ngay. Tệp này không đem lại gì. Nếu `deploy.sh` bị giết giữa `exec` và `rm` (timeout SSH của CI, SIGTERM, máy khởi động lại), tệp ở lại trong `/tmp`. Nội dung có thể chứa dòng psql chép lại câu `ALTER ROLE … PASSWORD`; quyền 0600 của deploy user nên rủi ro thấp. `deploy.sh` không có trap `EXIT` cho tệp này.
- Đề xuất: đổi thành `2>/dev/null`, kết quả giống hệt mà không có tệp. Nếu muốn giữ tệp cho lần sau, thêm `trap 'rm -f "$roles_err"' EXIT` ngay sau `mktemp`. Có thể làm ở v1.0.5. Không chặn gộp.
- Trạng thái: Open

## 4. Điểm làm tốt
- Bước `roles` vừa sửa được inode cũ, vừa **tự chứng minh** đã chạy đúng bản: đọc lại dấu hiệu chỉ bản v1.0.4 có, sai thì dừng trước `migrate`. Lần đầu, bản cũ làm hỏng lặng lẽ; nay hỏng thì báo ngay.
- `db_triggers` phân biệt "trước 0094" với "mất trigger sau 0094" bằng hàm của chính 0094. Cách này không cần quyền mới, không phụ thuộc journal, và kiểm luôn dạng `BEFORE DELETE … ROW`.
- `email_config` nay đọc cấu hình đúng như `smtp.ts`, có chú thích "CHANGE TOGETHER", và dòng `ok` ghi rõ chế độ. Người chạy runbook biết ngay `relay` đang được dùng.

---

## r1.2 @ 52069ce1

Ngày: 04/11/2026. Phạm vi: phần chênh `16ee56e4..52069ce1` (nhánh đã rebase lên `origin/main`), đọc cùng `rounds/round-04/responses/OPS-P4-04.md` mục r1.2.

### Phán quyết r1.2: **ĐẠT**
Thẻ 15, OPS-P413-01 và OPS-P413-S1 đã đóng. Cách chọn md5 theo số dòng `__drizzle_migrations` đúng với cả hai thứ tự gộp P4-13/P4-04 và với staging. Có một khe hở mới (thẻ 16): ngưỡng `72` bị cũ nếu P4-13 lỡ bản cắt v1.0.4. Không chặn gộp, vì P4-13 nằm trong v1.0.4 theo kế hoạch. Thẻ 16 phải xong trước khi cắt `SHA_V104`. CI của nhánh vẫn phải xanh.

### R2.1. Trạng thái thẻ
| Thẻ | Kết quả |
|---|---|
| FB-R4-ARC-OPS-P404-15 | **Verified.** Bước `roles` chạy `dc exec -T postgres bash -s <"$roles_file" >/dev/null 2>&1 \|\| roles_rc=$?`, không còn `mktemp`, nên không còn tệp tạm nào sót lại. Đọc lại dấu hiệu `1,true` / `1,absent` vẫn giữ nguyên. |
| OPS-P413-01 (README 13.7) | **Verified.** README ghi "0095" đúng chỗ. |
| OPS-P413-S1 (`db_triggers` kiểm thân hàm) | **Verified.** Xem R2.2. |

### R2.2. `db_triggers`: kiểm `prosecdef` và `md5(prosrc)`
- **Câu truy vấn:**
  - Lấy `tgenabled`, `prosecdef`, `md5(prosrc)` của hàm mà trigger thực sự gọi (`t.tgfoid`).
  - So `oid` của hàm đó với `to_regprocedure('public.privacy_notice_version_append_only()')`.
  - Nhờ vậy bắt được ca trigger trỏ sang hàm khác cùng tên ở schema khác.
- **Đọc số dòng migration:**
  - `can_mig` kiểm lần lượt schema, `USAGE`, bảng và `SELECT` trước khi đọc. Thiếu bất kỳ quyền nào thì ra `unknown` và FAIL "not checked", không có lỗi psql nào lọt ra ngoài.
  - Trả lời rỗng thì FAIL "unexpected answer".
  - Cả hai ca đều là đóng an toàn: không đọc được thì không bao giờ báo `ok`.
- **Hằng md5:** ARC tự tính lại `md5` của thân hàm `$$…$$`:
  - từ `0090` trên `origin/main`: ra `3274031e…1e7d9b`;
  - từ `0095` trên `v104/be-pn01`: ra `7a601d0e…89473f5`.
  - Cả hai khớp `PN_FN_MD5_0090` và `PN_FN_MD5_0095`.
- **Kiểm thử ARC chạy lại** trong worktree tạm `scratchpad/wt-arc-p404c` (@ `52069ce1`, đã xóa), `test-ops-check.sh` với `CI=true` trên Mac:
  - không có tệp 0095: **197 passed, 0 failed**;
  - thêm `0095_privacy_notice_append_only_whole_row.sql` lấy từ `v104/be-pn01`: **198 passed, 0 failed**. Ca so hằng với tệp chạy thật, không bị bỏ qua.

### R2.3. Chọn md5 theo số dòng migration: kiểm theo thứ tự gộp
Journal khi soát:
- `main` có 0092, idx68, tức 69 dòng.
- Đã duyệt: 0093 (idx69) và 0094 (idx70).
- `v104/be-pn01 @ 3c2b17bb` thêm 0095 (idx71), tức 72 dòng.
- Ngưỡng `PN_0095_APPLIED_AT=72`.

| Tình huống | DB thấy | Thân hàm mong đợi | Đúng? |
|---|---|---|---|
| P4-13 vào `main` **trước** P4-04 | Sau migrate bản có PR-H: 72 dòng | 0095 | Đúng. Khi PR-M chạy CI, tệp 0095 đã có trên nhánh (sau rebase), nên ca so hằng chạy thật. |
| P4-04 vào `main` **trước** P4-13 | Trước PR-H: ≤ 71 dòng | 0090 | Đúng. Khi PR-H mở hay gộp, `infra-scripts` vẫn chạy, vì `ci.yml` không lọc theo đường dẫn: chạy với mọi `pull_request` và mọi `push main`. Ca so hằng 0095 vì thế chạy trên chính PR-H. Nếu BE sửa thân 0095 sau `3c2b17bb`, CI của PR-H đỏ, buộc cập nhật hằng trong `ops-check.sh`. |
| 0095 bị đổi số hoặc đổi tên | Không còn tệp đúng tên, trong khi có migration khác định nghĩa hàm | Không xác định | CI đỏ ở ca "later migration redefines `privacy_notice_version_append_only`", buộc cập nhật hằng và ngưỡng. Được che. |
| Staging dựng từ TAG12 (có PR-H) | 72 dòng | 0095 | Đúng. Runbook K3 và K5 mong "0095". |
| Staging sau rollback về image trước | Vẫn 72: rollback không lùi migration, và `ops-check` là bản trong bundle | 0095 | Đúng. Khớp S4 của runbook ("sau rollback vẫn 0095"). |
| Staging hoặc production chạy image không có PR-H | ≤ 71 dòng | 0090 | Đúng. Khớp P2b bước 6 ("function of migration 0090"). |
| Timer `ops-check` chạy giữa P2b bước 3 và bước 5 (vai `ottimo_readonly` chưa có quyền đọc `drizzle`) | `unknown` | Không có | FAIL "not checked". Runbook đã ghi đây là ca dự kiến, và bước 6 phải ra `ok`. Chấp nhận được: báo động giả trong cửa sổ bảo trì có ghi trước, an toàn hơn im lặng. |

### R2.4. Thẻ mới

#### FB-R4-ARC-OPS-P404-16
- Mức độ: Minor
- Vị trí:
  - `product/infra/server/bin/ops-check.sh`: `PN_0095_APPLIED_AT=72`;
  - `product/infra/ci/test-ops-check.sh`: các ca so hằng md5.
- Vấn đề:
  - Ngưỡng `72` là một số viết cứng, chỉ đúng khi 0095 nằm ở idx71.
  - Giả sử P4-13 lỡ bản cắt v1.0.4 (hoặc bị lùi), và một migration khác, không liên quan PN-01, gộp trước và lấy idx71. Khi đó DB có 72 dòng mà thân hàm vẫn của 0090. `ops-check` báo FAIL "differs from migration 0095", dù DB hoàn toàn đúng. Theo runbook, FAIL ở K3/K5 là điểm dừng trên staging và production.
  - CI không bắt được ca này. Ca "later" chỉ đỏ khi có migration khác định nghĩa lại hàm. Ca so hằng thì bỏ qua khi thiếu tệp 0095.
  - Ngược lại, khi 0095 bị đẩy xuống idx72 hay sau nữa, mọi lần chạy giữa hai mốc đó báo FAIL giả theo cùng cơ chế.
- Đề xuất, làm cả hai:
  - (a) Trong `test-ops-check.sh`:
    - khi có tệp 0095, assert journal có `tag` `0095_privacy_notice_append_only_whole_row` với `idx == PN_0095_APPLIED_AT - 1`;
    - khi không có tệp 0095 mà `_journal.json` đã có ≥ `PN_0095_APPLIED_AT` mục, FAIL "stale PN_0095_APPLIED_AT".
    - Cả hai ca chỉ đọc tệp trong repo, không cần DB.
  - (b) Thêm một mục vào danh sách việc trước khi cắt bản trong runbook: xác nhận PR-H (P4-13) nằm trong `SHA_V104`. Nếu không, sửa ngưỡng trước khi deploy staging.
  - Cách bền hơn, để ở v1.0.5: chọn thân hàm theo `hash` của dòng 0095 trong `__drizzle_migrations` thay vì đếm số dòng. Không gấp.
- Không chặn gộp. Làm trước khi cắt `SHA_V104`, hoặc ít nhất là (b).
- Trạng thái: Open

### R2.5. Điểm làm tốt
- Đóng an toàn ở mọi nhánh của câu kiểm: thiếu quyền, trả lời rỗng, hàm khác `oid`, `SECURITY DEFINER`, thân hàm lệch. Không nhánh nào rơi vào `ok` mặc định.
- Hằng md5 được CI đối chiếu với chính tệp migration, nên ai sửa thân hàm mà quên cập nhật `ops-check` thì CI đỏ ngay.
- Runbook nói trước ca FAIL "not checked" trong cửa sổ P2b bước 3–5. Người trực không phải đoán đó là lỗi thật hay không.

---

## r1.3 @ 970c0722

Ngày: 04/11/2026. Phạm vi: phần chênh `52069ce1..970c0722`, một commit, 4 tệp:
- `test-ops-check.sh`
- runbook: bảng 0.1, S0, việc #25
- README 13.8
- `OPS-P4-04.md` mục r1.3

### Phán quyết r1.3: **ĐẠT**. Thẻ FB-R4-ARC-OPS-P404-16 **Verified**, đóng.

### R3.1. Đối chiếu với đề xuất của thẻ 16
| Đề xuất | Bản r1.3 | Kết quả |
|---|---|---|
| (a) Có tệp 0095: `idx + 1 == PN_0095_APPLIED_AT` | `pn_threshold_check` đọc `_journal.json` bằng awk (cặp `idx`/`tag`). Ngưỡng lấy thẳng từ `ops-check.sh` bằng `sed`, không chép lại | Đạt |
| (a) Không có tệp 0095 mà journal đã ≥ ngưỡng: FAIL "stale" | Có. Thêm hai ca đóng an toàn: có tệp mà journal không có mục, và journal có mục mà thiếu tệp | Đạt, chặt hơn đề xuất |
| (b) Việc lúc cắt: PR-H nằm trong `SHA_V104` | Bảng 0.1 có dòng riêng, kèm lệnh `grep` và lệnh nhanh (chạy test, phải ra `ok`, không được ra `skip`). S0 yêu cầu dòng đó đã `ok`. Việc #25 ghi thêm mục này | Đạt |
| Bộ tự test | 7 ca trên cây giả: ngưỡng 72 / 73 / 71, 0095 bị đẩy xuống idx72, có tệp mà thiếu mục journal, idx71 bị migration khác lấy, mới 69 mục (skip) | Đạt |

### R3.2. Kiểm ARC đã chạy
Môi trường: worktree tạm `scratchpad/wt-arc-p404d` @ `970c0722`, đã xóa. Chạy `test-ops-check.sh` với `CI=true` trên Mac.

| Cây | Kết quả |
|---|---|
| Như nhánh (journal 69 mục, không có 0095) | `skip PN_0095_APPLIED_AT=72 … (69 journal entries)`, 7 ca tự test `ok`, **204 passed, 0 failed** |
| Thay thư mục migrations bằng bản của `v104/be-pn01` (72 mục, có 0095) | `ok PN_0095_APPLIED_AT=72 = journal idx 71 … + 1`, **206 passed, 0 failed** |
| Như trên, sửa ngưỡng thành `73` | `FAIL stale PN_0095_APPLIED_AT=73 … (want 72)`, đỏ |
| Bỏ tệp 0095, đặt tag idx71 = `0096_other` (mô phỏng P4-13 lỡ bản cắt) | `FAIL stale PN_0095_APPLIED_AT=72: journal already has 72 entries without 0095`, đỏ |

Số ca khớp README 13.8 (204, và 206 khi có 0095).

### R3.3. Ghi chú, không thành thẻ
- Trên cây hiện tại của nhánh, kiểm ngưỡng ra `skip`, nên không đỏ. Vì vậy dòng bảng 0.1 lúc cắt (phải ra `ok`, không được `skip`) là chốt chặn thật cho bản v1.0.4. Runbook đã ghi đúng như thế.
- Cách bền hơn, chọn theo `hash` của dòng 0095 trong `__drizzle_migrations`, vẫn để ở v1.0.5 như đã ghi ở thẻ 16. Không cần thêm thẻ.
