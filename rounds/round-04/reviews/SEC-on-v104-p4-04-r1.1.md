# SEC review P4-04 `v104/ops-check` r1.1 – phần chênh `ce08b63a..16ee56e4`

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/ops-check` @ **`16ee56e4`**. Bài trước: `SEC-on-v104-p4-04-r1.md` @ `ce08b63a`, ĐẠT CÓ ĐK.
- Phạm vi: phần chênh `ce08b63a..16ee56e4`, xét theo nội dung cuối.
  - `de2355dd` gộp PR #45 @ `051e1750`. SEC đã review commit đó, và nó **đã có trên `origin/main`** (`merge-base --is-ancestor`). SEC không review lại.
  - Phần riêng của r1.1 là `git diff de2355dd 16ee56e4`. Riêng `deploy.sh`: `git diff 051e1750 16ee56e4` chỉ có bước `roles` (40 dòng đổi).
  - `56439561` và `045e74b9` (hướng "lọc stderr") đã bị commit cuối thay toàn bộ. SEC chỉ xét nội dung tại `16ee56e4`.
- Đường dẫn SEC đổi:
  - `product/infra/server/bin/deploy.sh` (bước `roles`);
  - `product/infra/postgres/init/02-roles.sh`;
  - `product/infra/server/bin/requeue-email-changed.sh` (chỉ chú thích);
  - `.github/CODEOWNERS`;
  - `.github/pull_request_template.md`.

  `.github/workflows`, `docker-compose.prod.yml` và `check-confidential-paths.sh` không đổi (đã kiểm `--stat`).
- Không chạy lệnh nào trên staging/production. Không sửa tệp nào ngoài tệp này.

### Đã tự kiểm (worktree tạm `wt-sec-p404r11` ở scratchpad, đã xóa)

| Kiểm | Kết quả |
|---|---|
| `rollback.test.sh` | 37 passed, 0 failed. Có (p) stdin + sha256, (q) SENTINEL / thiếu tệp / tệp rỗng, (r) vị trí `SET log_*`, (s) dấu hiệu |
| `test-ops-check.sh` | 183 passed |
| `requeue-email-changed.test.sh` | 69 passed (có kiểm tĩnh S1) |
| `ops-check-cwd.test.sh` | 14 passed |
| `test-confidential-paths.sh` | 6 passed |
| `test-deploy-from-ci.sh` trên `ubuntu:24.04`, `--network none`, mã chỉ đọc | **(h) ok**: dòng trả về CI và log máy chủ đều không có SENTINEL; dừng ở `step=roles`; tệp đi qua stdin. Ảnh không có `jq` nên SEC dùng `jq` giả (không in gì). Vì vậy (f) "thiếu tệp secret" đỏ: đó là do `jq` giả, không do r1.1. OPS đã chạy đủ trên ubuntu có `jq`: 44 ok |
| `02-roles.sh` thật trên Postgres 17-alpine tạm, mật khẩu thử | rc 0. Log container: 0 dòng có mật khẩu thử |
| Bản chép `02-roles.sh` thêm một câu `ALTER ROLE <không có> PASSWORD :'app_pw'` ngay sau câu PASSWORD thật | Script dừng (rc 3). Log container chỉ có `ERROR: role … does not exist`, **không có dòng `STATEMENT`**, 0 dòng có mật khẩu thử. Đầu ra psql phía khách: 0 dòng có mật khẩu thử. Bài r1 cho thấy: không có `SET` thì có 1 dòng |
| Câu dấu hiệu của `deploy.sh` trên DB mới (chưa migrate) | `1,absent` |
| Quét phần chênh | IPv4: 0. Hex ≥ 32: 0. Email chỉ có `…@example.test`. Không có khóa, mật khẩu hay token. Giá trị thử chỉ là `SENTINEL-R11-*` |

---

## 0. Kết luận

**ĐẠT.**
- Không có Blocker, Major hay Minor. Có 1 Suggestion, không chặn.
- Cả 8 điều kiện r1.1, thẻ P404R1-01, P404R1-02 và S1 đều Verified.
- Thẻ P404R1-S2 là việc của ORC/INV, giữ Open để ORC theo dõi.
- 5 đường dẫn SEC đổi trong r1.1 đạt. Được gộp ở **`16ee56e4`**.
- Sau khi rebase (commit gộp `de2355dd` và `e16b3821` rơi ra), nếu nội dung các đường dẫn SEC không đổi thì không cần SEC review lại. ORC so `git diff 16ee56e4 <đầu mới> -- <đường dẫn SEC>`: rỗng là được.

### 0.1 Điều kiện r1.1 (`SEC-on-v104-p4-04-r1.md` mục 2)

| ĐK | Trạng thái | Bằng chứng |
|---|---|---|
| 1. Bước `roles` đọc tệp của gói qua stdin; thiếu tệp thì dừng; mật khẩu chỉ từ `*_FILE` | **Verified** | `dc exec -T postgres bash -s <"$OTTIMO_HOME/infra/postgres/init/02-roles.sh"`. Tệp phải có, đọc được, không rỗng, không thì `FAIL` trước mọi lệnh `exec`. Không còn lời gọi `/docker-entrypoint-initdb.d`. Không có `-e` hay đối số mang mật khẩu. Test (p), (q) ×3 |
| 2. Không dòng stderr nào vào log; câu cố định + rc; dừng ở `roles`; giữ `t,f,f,f,t,f` và H3 | **Verified** | stdout → `/dev/null`. stderr → tệp `mktemp` 0600, xóa ngay, không bao giờ đọc. Log chỉ có `FAIL: 02-roles.sh failed (rc=N) – output withheld; …`. Script vẫn `exit 1` khi quyền lệch hoặc thiếu H3. Đã bỏ hướng lọc. Về tệp tạm: xem mục 0.2 |
| 3. `SET log_min_error_statement = panic` trước các câu PASSWORD, có test | **Verified** | Có thêm `log_statement = 'none'` và `log_min_duration_statement = -1`, đặt ở đầu heredoc có PASSWORD. Test (r) kiểm tĩnh: cả 3 dòng đứng trước mọi `PASSWORD :'`, và mọi câu PASSWORD nằm trong heredoc này. SEC thử thật trên Postgres tạm (bảng trên): log container sạch |
| 4. Test SENTINEL (i)(ii)(iii) | **Verified** | `rollback.test.sh` (q) và `test-deploy-from-ci.sh` (h): SENTINEL, `password`, `does not exist` không có trong đầu ra deploy, dòng CI hay `state/deploy-logs/ci-*.log`; dừng ở `step=roles`, `migrate` không chạy, không đổi container; stdin trùng tệp của gói (`cmp`/sha256), không có `initdb`. SEC chạy lại (h) trên ubuntu: ok |
| 5. Thẻ 01 | **Verified** | Lệnh ở CODEOWNERS (c) và mẫu PR đúng nguyên văn lệnh SEC. Câu mẫu PR kê đủ 5 dạng mới và ghi "chỉ để nhắc" |
| 6. Runbook | **Verified** | P2b bước 5 giữ làm bước dự phòng, có đoạn "Khi nào hết cần bước 5" (sau lượt deploy đầu bằng `deploy.sh` v1.0.4). S0 staging làm y như vậy. Quay lui dùng `deploy.sh` của gói. Câu rủi ro mục 8 và G6 đã sửa: log trên máy chủ, không phải Actions |
| 7. Không đổi đường dẫn SEC khác | **Verified** | Chỉ 5 đường dẫn kể trên. Dòng trả về của `deploy-from-ci.sh` vẫn một dòng: tệp không đổi, test (h) kiểm |
| 8. Nêu đầu nhánh | **Verified** | `16ee56e4` (ORC báo) |

### 0.2 Hai giả định OPS

| Giả định | Quyết định SEC |
|---|---|
| Tệp tạm stderr xóa ngay sau lệnh, không dùng `trap EXIT` | **Chấp nhận.** Tệp 0600, chủ là user deploy, chỉ sống trong thời gian lệnh chạy, không ai đọc. Nhờ các dòng `SET log_*`, log máy chủ không còn câu có mật khẩu. psql phía khách chỉ in câu khi lỗi cú pháp, mà biến `:'…'` được trích dẫn an toàn. Chỉ còn một trường hợp: deploy bị giết giữa lệnh (SIGTERM/SIGHUP) **và** đúng lúc đó có lỗi in câu. Khi đó còn sót một tệp 0600 trong `/tmp`. Mức rất thấp. Không thêm `trap` vào `deploy.sh` cũng đúng: tệp chưa có `trap` nào, thêm `trap EXIT` dễ đè lên cách khóa và dọn dẹp về sau. Cách đơn giản hơn ở thẻ S3 |
| Dấu hiệu `1,absent` (volume mới) được coi là đúng | **Chấp nhận.** SEC thử: DB mới chưa migrate cho đúng `1,absent`. `absent` chỉ có khi chưa có `drizzle.__drizzle_migrations`, tức DB chưa migrate lần nào, và `migrate` chạy ngay sau đó. Production và staging đều đã có bảng này, nên ở đó chỉ `1,true` đi tiếp. `ottimo_requeue` vẫn bắt buộc (`1,…`). Giới hạn cần biết: vai và quyền **tồn tại lâu dài**. Sau P2b bước 5, dấu hiệu cho thấy "DB đã có quyền v1.0.4", **không** chứng minh "lượt này chạy bản mới". Điều đó do stdin + test (p) bảo đảm. Hai lớp này bổ sung nhau, đủ |

## 1. Trạng thái thẻ trước

| Thẻ | Trạng thái |
|---|---|
| FB-R4-SEC-OPS-P404R1-01 (luật migration) | **Verified** |
| FB-R4-SEC-OPS-P404R1-02 (mật khẩu trong log) | **Verified**: (a) `SET log_*`, (b) ĐK 2, (c) runbook và response sửa câu "log CI công khai" |
| FB-R4-SEC-OPS-P404R1-S1 (`-c role=` không phải ranh giới) | **Verified**. Chú thích ở `requeue-email-changed.sh`, `02-roles.sh`, `ops-check.sh` và README ghi đúng ý. `role_escape_re` ở hai test bỏ qua dòng chú thích, OPS thử đột biến thì đỏ. `ottimo_requeue` không cần `READ WRITE` vì giao dịch mặc định đã ghi được, nên cấm `READ WRITE` trong `requeue` không làm hỏng câu UPDATE (69 passed) |
| FB-R4-SEC-OPS-P404R1-S2 (required check) | Open. Việc của ORC (kiểm trước gộp) và INV (cài đặt nhánh). OPS không có việc |

## 2. Thẻ mới

### FB-R4-SEC-OPS-P404R11-S3
- Mức độ: Suggestion
- Vị trí: `deploy.sh` bước `roles`, các dòng `roles_err=$(umask 077 && mktemp …)` → `rm -f "$roles_err"`.
- Vấn đề: stderr được ghi vào tệp tạm nhưng không ai đọc tệp này. Kết quả giống hệt `2>/dev/null`. Khác biệt duy nhất là có thể sót tệp khi deploy bị giết giữa lệnh (mục 0.2).
- Đề xuất: khi nào có dịp sửa `deploy.sh` (v1.0.5, hoặc nếu ARC không cần tệp này cho P404-11), đổi thành `dc exec -T postgres bash -s <"$roles_file" >/dev/null 2>&1 || roles_rc=$?` và bỏ `mktemp`/`rm`. Giữ test (q). Không làm trong đợt này: không đáng tạo đầu nhánh mới chỉ để SEC review lại.
- Trạng thái: Open

## 3. Điểm làm tốt
- Bỏ hẳn hướng "lọc stderr", chỉ ghi câu cố định + rc. Không có bộ lọc nào để bị lách.
- Phòng hai lớp: stdin từ tệp của gói (test sha256), cộng dấu hiệu đọc lại trên DB trước `migrate`. Lỗi tệp gắn đơn, vốn chỉ OPS tự phát hiện, nay không còn đường quay lại.
- Thử đúng câu SEC lo: có mật khẩu thử, thử lỗi thật trên Postgres tạm, thử đột biến cho từng kiểm tĩnh. Không chỉ kiểm bằng giả lập.

## 4. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – review P4-04 r1.1 (v104/ops-check @ 16ee56e4, phần chênh ce08b63a..16ee56e4, trừ PR #45 đã trên main): ĐẠT, được gộp** (rounds/round-04/reviews/SEC-on-v104-p4-04-r1.1.md): 8 điều kiện r1.1 + P404R1-01/02/S1 Verified – deploy.sh roles đọc 02-roles.sh của gói qua stdin (thiếu/rỗng → dừng), không dòng nào của script vào log (câu cố định + rc), dấu hiệu v1.0.4 trước migrate; 02-roles.sh SET log_min_error_statement=panic + log_statement none + log_min_duration_statement -1 trước PASSWORD (SEC thử Postgres tạm: lỗi PASSWORD không còn vào log container); test SENTINEL ok. SEC chấp nhận hai giả định OPS: tệp tạm stderr xóa ngay, không trap EXIT; dấu hiệu 1,absent chỉ cho DB chưa migrate. Suggestion S3 (2>/dev/null thay tệp tạm, v1.0.5). Rebase không đổi đường dẫn SEC thì không cần review lại | SEC | Quyền SEC |`

---

## r1.2 @ 52069ce1

- Đối tượng: `origin/v104/ops-check` @ **`52069ce1`**. Nhánh đã rebase lên `origin/main`, hai commit gộp #45 và #46 đã rơi ra. SEC review theo **nội dung**: `git diff 16ee56e4 52069ce1`. Phần chênh ngoài `product/infra` là các PR khác đã có trên `main`.
- Đường dẫn SEC: trong `product/infra` và `.github`, phần chênh chỉ có 5 tệp. Đúng **một** tệp là đường dẫn SEC: `product/infra/server/bin/deploy.sh` (+3/−5). Bốn tệp còn lại không phải đường dẫn SEC: `ops-check.sh`, `test-ops-check.sh`, `rollback.test.sh`, README.
- Không đổi: `.github/`, `02-roles.sh`, compose, `requeue-email-changed.sh`, `rollback.sh`, `check-confidential-paths.sh`.
- Đã tự kiểm (worktree tạm `wt-sec-p404r12`, đã xóa):
  - `test-ops-check.sh`: 197 passed. Ca 0095 in `skip` vì tệp chưa có trên cây này;
  - `rollback.test.sh`: 38 passed;
  - `requeue-email-changed.test.sh`: 69 passed;
  - quét phần chênh `product/infra`: không có IP, email chỉ có `@example.test`.

### Kết luận r1.2: **ĐẠT**
Được gộp ở `52069ce1`. Không có thẻ mới chặn gộp.

| Việc | Kết quả |
|---|---|
| `deploy.sh` bước `roles` (thẻ S3) | **Verified, đóng S3.** Lệnh là `dc exec -T postgres bash -s <"$roles_file" >/dev/null 2>&1 \|\| roles_rc=$?`, không còn `mktemp`/`rm`. Câu cố định + rc, kiểm tệp và dấu hiệu v1.0.4 giữ nguyên. Test (q) có kiểm tĩnh: hai luồng vào `/dev/null`, không `mktemp`/`tee`/`2>"$…"` |
| `db_triggers`: hàm PN-01 (thẻ P413-S2 của SEC) | **Verified.** Mỗi trigger phải trỏ `public.privacy_notice_version_append_only()`, `prosecdef = f`, và `md5(prosrc)` khớp trạng thái migration: dưới 72 dòng là thân 0090, từ 72 dòng là thân 0095. Lệch, không đọc được số migration, hay thiếu dòng đều ra `FAIL`. SEC tự tính md5 của đoạn `$$ … $$`: `0090` (`main`) = `3274031e…`, `0095` (`v104/be-pn01` @ `3c2b17bb`) = `7a601d0e…`. Cả hai khớp hằng. Trên cây chỉ có migration 0090 định nghĩa hàm này. Câu SQL chạy bằng `psql_ro`, dùng `\gset` + `has_*_privilege`, nên không lỗi khi thiếu quyền. Không in thân hàm; khi lệch chỉ in 8 ký tự md5. Hằng md5 đầy đủ trong mã là băm của mã nguồn công khai, không phải bí mật hay digest image, nên luật "8 + 4" không áp |

Ghi nhận, không chặn:
- **Ngưỡng `PN_0095_APPLIED_AT=72`** dựa trên 0095 có journal idx 71. Nếu P4-13 gộp với idx khác, hoặc có migration sau 0095 mà 0095 chưa gộp, thì `db_triggers` ra `FAIL` ầm ĩ, không bao giờ `ok` sai. Lỗi này đóng an toàn. Khi BE-D gộp P4-13, ORC xem lượt chạy `db_triggers` đầu tiên trên staging ra `ok … function of migration 0095`.
- **Suggestion (v1.0.5, OPS tự cân nhắc):** md5 của `prosrc` không gồm `proconfig`. Dòng `SET search_path = pg_catalog, pg_temp` của 0095 nằm ở `proconfig`, nên chưa được kiểm. Có thể thêm `p.proconfig` vào dòng `pn` và so với `{search_path=pg_catalog, pg_temp}` khi đã qua 0095. Không mở thẻ.

Dòng decision-log đề xuất (ORC ghi khi commit):

`| 2026-11-04 | 4 | **SEC – P4-04 r1.2 (v104/ops-check @ 52069ce1, rebase lên main, phần chênh nội dung 16ee56e4..52069ce1): ĐẠT, được gộp** (SEC-on-v104-p4-04-r1.1.md mục r1.2): đường dẫn SEC chỉ đổi deploy.sh bước roles (>/dev/null 2>&1, bỏ mktemp – đóng S3); db_triggers kiểm hàm PN-01 (prosecdef=f, đúng hàm, md5 prosrc theo trạng thái migration; SEC tự tính md5 0090/0095 khớp hằng; lệch/không đọc được = FAIL, chỉ in 8 ký tự). Ngưỡng 72 lệch thì FAIL, không ok sai | SEC | Quyền SEC |`
