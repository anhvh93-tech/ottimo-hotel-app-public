# SEC review P4-04 `v104/ops-check` r1 – runbook r1 + phần mã

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/ops-check` @ **`ce08b63a`**, so với `origin/main` (merge-base `ec92ce22`).
- Phạm vi: chỉ phần riêng của P4-04:
  - `3e8d0921`: mã;
  - `a9f2c75d`: runbook r1 + `product/tests/README.md`;
  - `ce08b63a`: CODEOWNERS, mẫu PR, `responses/OPS-P4-04.md`.
- Commit gộp `e16b3821` kéo PR #46 @ `c893c3ea` (SEC đã ĐẠT ở `SEC-on-v104-ops-scripts.md`). Commit này **không** review lại. Đã kiểm: gộp sạch (`git show --cc` không có hunk tự giải xung đột).
- Căn cứ:
  - `SEC-on-v104-ops-check.md`: 5 điều kiện r1, P404-01, S1, S2;
  - `SEC-on-v104-ops-scripts.md` mục 5.2 (a)(b), P403-02;
  - `ARC-on-v104-p4-04.md`;
  - `responses/OPS-P4-04.md`;
  - runbook r1 trên nhánh.
- Không chạy lệnh nào trên staging/production. Không sửa tệp nào ngoài tệp này.

### Đã tự kiểm (worktree tạm ở scratchpad, đã xóa)

| Kiểm | Kết quả |
|---|---|
| `test-ops-check.sh` | 172 passed, 0 failed |
| `test-confidential-paths.sh` | 6 passed |
| `ops-check-cwd.test.sh` | 13 passed |
| `ops-check-price.test.sh` | 17 passed |
| `requeue-email-changed.test.sh` | 68 passed |
| `check-confidential-paths.sh` trên cây thật | `ok` |
| `02-roles.sh` trên Postgres 17-alpine tạm, 2 lượt (mật khẩu thử), có `outbox_message` FORCE RLS | Dòng cuối có `t,f,f,f,t,f`. Vai `ottimo_requeue`: UPDATE 4 cột chạy được qua FORCE RLS (BYPASSRLS). Bị từ chối: `UPDATE payload`, `DELETE`, `INSERT`, `TRUNCATE`, `SELECT` bảng khác, schema `drizzle` |
| Phiên `-c default_transaction_read_only=on -c role=ottimo_readonly` | `current_user` = `ottimo_readonly`. `UPDATE` bị chặn (read-only). `RESET ROLE` vẫn ở `ottimo_readonly`. **`SET ROLE NONE` về superuser** (thẻ S1) |
| `ALTER ROLE <không có> PASSWORD :'pw'` lỗi | Dòng `STATEMENT: ALTER ROLE … PASSWORD '<giá trị>'` có trong **log của container postgres**. psql phía khách không in dòng `LINE` cho lỗi này (thẻ 02) |
| Luật migration 5.2 (a) trên 69 migration | 46/69 tệp, khớp số OPS đếm. Bản mở rộng ở thẻ 01: vẫn 46/69, không thêm nhiễu |
| Quét diff P4-04 | IPv4: 0. Chuỗi hex ≥ 20 ký tự: 0. Không có khóa, mật khẩu hay token |
| Email trong phần mã | Chỉ `…@example.test` |
| Email trong runbook | `ottimo-admin@desk.<tên miền>` (tên đăng nhập SSH, đã có trên `main`) và `info@` của tên miền thương hiệu (địa chỉ liên hệ công khai). Cả hai đã được chấp nhận ở r0 |

---

## 0. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN.**
- Không có Blocker hay Major. 2 thẻ Minor, 2 thẻ Suggestion.
- Cả 7 đường dẫn SEC trên nhánh đạt về bảo mật. Được gộp ở `ce08b63a`. Thẻ 01 và 02 làm trong r1.1 (mục 3).
- Đầu nhánh mới (r1.1) đụng `deploy.sh`, cũng là đường dẫn SEC. ORC chỉ gộp khi có tệp SEC nêu đúng đầu r1.1 (review phần chênh lệch).

### 0.1 Điều kiện r0 và các thẻ trước

| Mục | Trạng thái | Bằng chứng |
|---|---|---|
| ĐK 1: `SQLRO` và kiểm DB của `ops-check` chạy bằng `ottimo_readonly` trong giao dịch READ ONLY | **Verified** | `psql_ro` của `ops-check` gửi dòng gác trước câu của kiểm. Dòng gác đòi: `current_user = ottimo_readonly`, `transaction_read_only = on`, BYPASSRLS, không superuser. Khác thì trả `ro-guard` → `FAIL unexpected answer`. `psql_admin` đã bỏ khỏi `ops-check`: `j16`, `email_dead`, `priceswitch` trước dùng superuser, nay chạy READ ONLY. `j16` kiểm dạng từng dòng. Runbook `SQLRO` đòi hai dòng đầu là `on` / `ottimo_readonly`; gặp `permission denied` thì dừng, không chạy lại bằng vai quản trị |
| ĐK 2: CI `confidential-paths` | **Verified trên nhánh**, đóng hẳn khi gộp | Job mới có tự test đỏ mỗi lượt chạy (`git add -f`, bản chép đổi tên và đổi hoa thường). `publish-images.needs` có job này. Chỉ kiểm theo đường dẫn, chỉ in đường dẫn (test chứng minh không in nội dung). Thử đỏ tại máy có ghi ở response. Sau khi gộp, ORC xem job xanh trên `main` (Suggestion S2) |
| ĐK 3: R3b/S5 chỉ `count(*)` | **Verified** | Câu ARC P404-01 chỉ đọc khóa `template`, không chọn `payload`. `HOLD_OVERDUE_AT_UPGRADE` cũng chỉ đếm |
| ĐK 4: luật địa chỉ chung | **Verified** | Một hằng `EMAIL_RULE_RE` dùng cho cả SQL `email_ascii` và `email_rule` của `email_config`. Hằng không lấy từ môi trường, nên không có đầu vào ngoài nào vào câu SQL. `email_config` chỉ in chữ và số đếm, không in địa chỉ. P2c/P2d gọi `ops-check email_config`, không còn regex shell riêng |
| ĐK 5 / P404-01: câu 0094 | **Verified** | 1.3, mục 5, R7, 775: dịch vụ so ngày kinh doanh, trigger so ngày lịch. Ca bị chặn duy nhất là khung 00:00 → giờ đổi ngày kinh doanh. v1.0.3 ra 500, v1.0.4 ra 409. Dòng giá đầu ở tương lai không bị chặn |
| P404-S1: bản sao `.env` | **Verified** | K5b xóa các bản sao `env.before-shared-mailboxes.<hôm nay>-*` của lượt, chỉ in `BACKUPS` |
| P404-S2: ảnh S16 | **Verified** | S16 ghi "Ảnh chỉ commit sau khi QA kiểm che" |
| P403-02 (5.2 a, b) | **Verified** | Lệnh ở CODEOWNERS (c) và mẫu PR đúng nguyên văn 5.2 (a). Câu mẫu PR ghi `CREATE/ALTER/DROP/SET ROLE`, có thêm "dòng `--` không tính". 3 dòng SEC đủ, chú thích đúng vai của từng tệp. **SEC giữ** dòng `check-confidential-paths.sh`: sửa danh sách đường dẫn là tắt cổng G2 |

### 0.2 Đường dẫn SEC bị sửa

| Tệp | Kết luận |
|---|---|
| `.github/workflows/ci.yml` | Đạt. `setup-node` ghim SHA. Job `confidential-paths` có `persist-credentials: false`, không bí mật, không quyền thêm. `publish-images` cần job này |
| `.github/CODEOWNERS` | Đạt (P403-02). Thẻ 01 mở rộng luật (c) |
| `.github/pull_request_template.md` | Đạt. Thẻ 01 sửa cùng câu |
| `postgres/init/02-roles.sh` | Đạt. `ottimo_requeue` có NOLOGIN, `PASSWORD NULL`, `REVOKE ottimo_owner`, không là thành viên vai nào. Chỉ có `USAGE public`, `SELECT` + `UPDATE(4 cột)` trên `outbox_message`. Quyền được đọc lại sau khi cấp, lệch thì `exit 1`. GRANT có điều kiện bằng `to_regclass` (an toàn khi volume mới). `ottimo_readonly` thêm đúng một quyền đọc `drizzle.__drizzle_migrations`. Thẻ 02 về log |
| `server/bin/requeue-email-changed.sh` | Đạt. Câu đếm bằng `ottimo_readonly` READ ONLY. Câu ghi duy nhất bằng `ottimo_requeue`: nếu câu sai mà ghi cột khác thì máy chủ từ chối (đóng an toàn) |
| `docker-compose.prod.yml` | Đạt. Chỉ thêm `EMAIL_SHARED_MAILBOXES: ${…:-}` cho api. Không thêm secret, cổng hay volume |
| `infra/ci/check-confidential-paths.sh` (mới) | Đạt. Pathspec `top,icase,glob` quét cả index. `-z` nên tên tệp lạ không bị hiểu sai. Mã thoát rõ 0/1/2 |

Phần không phải đường dẫn SEC (`ops-check.sh`, test, README, env mẫu, runbook): không có dữ liệu cá nhân hay số hoa hồng.
- Câu SQL mới (`db_triggers`, `email_config`, `via owner`) chỉ đọc tên, cờ và số đếm.
- `containers` ghi `state/ops-check/containers.restarts`, chỉ gồm id container và số lần khởi động lại.

## 1. Thẻ

### FB-R4-SEC-OPS-P404R1-01
- Mức độ: Minor
- Người làm: OPS, trong r1.1 (cùng nhánh)
- Vị trí: `.github/CODEOWNERS` luật (c), `.github/pull_request_template.md` ô migration. Đây là lệnh do SEC đặt ở 5.2 (a); SEC tự sửa lại.
- Vấn đề: SEC đã thử 4 dòng thêm vào, cả 4 **không** khớp lệnh hiện tại:
  - `SET LOCAL ROLE x`: mẫu chỉ có `SET[[:space:]]+ROLE`;
  - `SET SESSION AUTHORIZATION x`;
  - `SET session_replication_role = replica`: tắt mọi trigger không phải ALWAYS, kể cả trigger append-only PN-01 và 0094;
  - `ALTER TABLE … OWNER TO …`: chủ bảng bỏ qua RLS nếu bảng không FORCE.

  Ngoài ra, dòng tiêu đề `+++ b/…` cũng khớp `^\+`. Việc này vô hại: tên tệp có chữ `grant` chỉ làm báo thừa.
- Vì sao quan trọng: đây là các cách đổi vai hoặc tắt trigger mà luật (c) muốn bắt. Migration chạy bằng `ottimo_owner` (không superuser), nên `session_replication_role` và `SESSION AUTHORIZATION` sẽ lỗi khi chạy. Dù vậy, người review nên thấy ý định đó trước khi gộp. Hiện chưa migration nào có các lệnh này, nên rủi ro thấp.
- Đề xuất sửa: thay mẫu cuối của lệnh ở cả hai chỗ bằng lệnh dưới. SEC đã thử: kết quả vẫn 46/69, không thêm nhiễu.
  ```
  git diff <base>...<head> -- '**/migrations/*.sql' | grep -E '^\+' | grep -vE '^\+\+\+ |^\+[[:space:]]*--' \
    | grep -iE 'DISABLE TRIGGER|GRANT|REVOKE|ROW LEVEL SECURITY|POLICY|SECURITY DEFINER|OWNER[[:space:]]+TO|SESSION[[:space:]]+AUTHORIZATION|session_replication_role|(CREATE|ALTER|DROP|SET|RESET)[[:space:]]+((LOCAL|SESSION)[[:space:]]+)?ROLE'
  ```
  Câu mẫu PR thêm: "`SET LOCAL ROLE`, `OWNER TO`, `session_replication_role`". Lệnh chia một câu qua nhiều dòng (`ALTER` ở dòng này, `ROLE` ở dòng sau) hay ghép chuỗi trong `EXECUTE` vẫn lọt. Luật này chỉ để nhắc người review, không thay việc đọc migration.
- Cho tới khi gộp r1.1: ORC dùng lệnh trên cho bước kiểm (c).
- Trạng thái: Open

### FB-R4-SEC-OPS-P404R1-02
- Mức độ: Minor
- Người làm: OPS, trong r1.1 (cùng việc "Việc còn lại" #20)
- Vị trí: `postgres/init/02-roles.sh`, khối `ALTER ROLE … PASSWORD :'migrator_pw' / :'app_pw'`; `deploy.sh` bước `roles`; runbook P2b bước 5 và rủi ro mục 8 (dòng 836).
- Vấn đề:
  1. **Log máy chủ Postgres (SEC đã thử).** Khi câu `ALTER ROLE … PASSWORD` lỗi, Postgres ghi `STATEMENT: ALTER ROLE … PASSWORD '<giá trị>'` vào log của container. Đây là mặc định `log_min_error_statement = error`. Biến psql được thay **ở phía khách**, nên máy chủ nhận mật khẩu dạng chữ thường. `2>/dev/null` của P2b bước 5 và việc che stderr trong `deploy.sh` **không** chặn được đường này. Log nằm trong `docker logs` của container postgres trên VPS.
  2. **Log deploy.** Ghi chú của OPS "log deploy của CI là công khai" chưa đúng. `deploy-from-ci.sh` chỉ trả **một dòng** về Actions (SEC E.8). Toàn bộ stdout/stderr vào `state/deploy-logs/ci-*.log` (quyền 0600, giữ 30 tệp) trên máy chủ. Vậy rủi ro là mật khẩu DB nằm trong tệp log trên máy chủ và có thể vào bộ sao lưu, **không** phải lộ công khai. Lỗi này có thể xảy ra: SEC thử với vai không tồn tại thì psql không in dòng `LINE`, nhưng các lỗi khác có thể in.
- Vì sao quan trọng: mật khẩu `ottimo_app` / `ottimo_migrator` nằm trong log thì ra ngoài quy trình xoay vòng bí mật. Khả năng xảy ra thấp vì cần một câu lỗi, và không lộ ra ngoài máy chủ. Vì vậy là Minor, không chặn.
- Đề xuất sửa (r1.1):
  - (a) `02-roles.sh`: ngay đầu heredoc có hai câu `PASSWORD`, thêm `SET log_min_error_statement = panic;`. Phiên superuser được phép đặt giá trị này, và nó chỉ có hiệu lực trong phiên đó. Giữ `\set ON_ERROR_STOP` như cũ;
  - (b) `deploy.sh` bước `roles`: xem điều kiện r1.1 mục 3, ý 2;
  - (c) sửa câu rủi ro ở runbook dòng 836 và response: "log máy chủ (deploy-logs, log container postgres), không phải log Actions".
- Trạng thái: Open

### FB-R4-SEC-OPS-P404R1-S1
- Mức độ: Suggestion
- Vị trí: chú thích `02-roles.sh` (`ottimo_requeue`), `requeue-email-changed.sh` ("a wrong SQL text cannot write anything else"), README 13.8.
- Vấn đề: `-c role=…` chạy trên phiên superuser. Nó chặn được **lỗi vô ý** (sai cột, quên WHERE, thiếu quyền) nhưng không phải ranh giới bảo mật. SEC đã thử: một câu `SET ROLE NONE` trong SQL đưa phiên về superuser. Hiện chấp nhận được, vì SQL là hằng trong tệp có CODEOWNERS SEC.
- Đề xuất:
  - sửa câu chú thích thành "a mistaken SQL text …; not a boundary against SQL that resets the role";
  - thêm một kiểm tĩnh vào `test-ops-check.sh` và `requeue-email-changed.test.sh`: hai script không chứa `SET ROLE`, `RESET ROLE`, `SESSION AUTHORIZATION`, `set_config('role'` hay `transaction_read_only = off` / `READ WRITE`.
- Trạng thái: Open

### FB-R4-SEC-OPS-P404R1-S2
- Mức độ: Suggestion
- Vị trí: CI `confidential-paths`; quy trình gộp của ORC.
- Vấn đề: `publish-images` đã cần job này. Nhưng việc gộp PR chỉ bị chặn nếu job là required check của nhánh `main`. Repo chưa có tài liệu nào ghi danh sách required check.
- Đề xuất: ORC thêm "`confidential-paths` xanh" vào bước kiểm trước gộp. Khi INV làm lại cài đặt nhánh (đã ghi ở đầu CODEOWNERS: "Revisit … once the repo has a second account"), thêm job này vào required checks. INV tự làm việc này, không cần ESC. Có thể thêm `test-confidential-paths.sh` vào dòng SEC của CODEOWNERS (không bắt buộc: sửa test không tắt được bước kiểm thật).
- Trạng thái: Open

## 2. Điều kiện SEC cho r1.1 (review phần chênh lệch)

1. **Bước `roles` của `deploy.sh` đọc tệp của máy chủ qua stdin**, như P2b bước 5: `dc exec -T postgres bash -s < "$OTTIMO_HOME/infra/postgres/init/02-roles.sh"`.
   - Kiểm tệp có và đọc được trước khi chạy; thiếu thì dừng ở `step roles`.
   - Không quay lại tệp gắn trong container.
   - Mật khẩu vẫn chỉ lấy từ `*_FILE` **trong** container, không truyền qua `-e` hay dòng lệnh.
2. **Không câu nào của stderr `02-roles.sh` vào log deploy.**
   - stdout giữ `>/dev/null`.
   - stderr vào `/dev/null`, hoặc vào tệp tạm `umask 077` và xóa ngay.
   - Log chỉ ghi câu cố định cùng mã thoát, ví dụ `02-roles.sh failed (rc=N) – run runbook P2b step 5 by hand to see the error`. Không ghi dòng nào của stderr, kể cả khi đã lọc.
   - Lỗi vẫn làm deploy dừng ở `step roles`.
   - Kiểm `t,f,f,f,t,f` và kiểm H3 của script vẫn bắt buộc.
3. **Thẻ 02 (a):** đặt `SET log_min_error_statement = panic` trước hai câu `PASSWORD`. Có test chứng minh: dòng này đứng trước `PASSWORD :'` trong cùng heredoc (kiểm tĩnh), hoặc test Postgres tạm với một câu lỗi cho thấy log container không chứa mật khẩu thử.
4. **Test `deploy`:** dùng `02-roles.sh` giả, in ra stderr `ALTER ROLE x PASSWORD 'SENTINEL'` rồi thoát 1. Phải chứng minh ba điều:
   - (i) `SENTINEL` không có trong log deploy, cũng không trong dòng trả về của `deploy-from-ci.sh`;
   - (ii) deploy dừng ở `step roles`;
   - (iii) lệnh `exec` nhận tệp qua stdin, không chạy đường dẫn trong container.
5. **Thẻ 01**, nếu OPS nhận trong r1.1.
6. **Runbook:**
   - P2b bước 5 giữ làm bước dự phòng cho lần làm mới gói đầu tiên (`deploy.sh` cũ trên máy chủ). Ghi rõ từ khi nào thì không cần nữa;
   - sửa câu rủi ro dòng 836 theo thẻ 02 (c);
   - S0 staging làm y như vậy.
7. **Không đổi đường dẫn SEC nào khác** ngoài `deploy.sh`, `02-roles.sh`, CODEOWNERS / mẫu PR (thẻ 01) và test.
   - Dòng trả về của `deploy-from-ci.sh` giữ đúng một dòng.
   - `deploy.sh` cũng là tệp của P4-02 (PR #45): ORC chốt nhánh nào mang thay đổi, để SEC chỉ review một bản.
8. Response r1.1 nêu đầu nhánh. SEC review chênh lệch `ce08b63a..<r1.1>`.

## 3. Điểm làm tốt
- Dòng gác `ro-ok` đặt trước mọi kiểm DB. Vai thiếu hoặc vai không có BYPASSRLS sẽ ra `FAIL`, không ra số 0 giả. Đây đúng là lỗi im lặng mà PR32-S1 lo.
- Vai `ottimo_requeue` có quyền đến từng cột, và `02-roles.sh` tự đọc lại quyền rồi dừng nếu lệch. SEC chạy lại trên Postgres tạm cho cùng kết quả.
- OPS tự phát hiện hai điểm mà review trước không thấy: tệp gắn đơn làm container giữ inode cũ, và rủi ro stderr của câu PASSWORD. OPS báo lên thay vì vá lén trong tệp của gói khác.

## 4. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – review P4-04 r1 (v104/ops-check @ ce08b63a, phần riêng 3e8d0921/a9f2c75d/ce08b63a): ĐẠT CÓ ĐK** (rounds/round-04/reviews/SEC-on-v104-p4-04-r1.md): 5 điều kiện r0 + P404-01/S1/S2 + P403-02 Verified (ops-check mọi kiểm DB bằng ottimo_readonly READ ONLY sau dòng gác ro-ok; ottimo_requeue chỉ SELECT + UPDATE 4 cột, SEC thử lại trên Postgres tạm; CI confidential-paths có tự test đỏ, publish-images cần; không bí mật/IP/email thật). 7 đường dẫn SEC đạt. Minor 01: luật migration (c) mở rộng (SET LOCAL/RESET ROLE, SESSION AUTHORIZATION, session_replication_role, OWNER TO; vẫn 46/69) – ORC áp ngay bằng tay. Minor 02: ALTER ROLE … PASSWORD lỗi thì Postgres ghi câu có mật khẩu vào log container (SEC thử) → r1.1 đặt log_min_error_statement=panic; log deploy là log máy chủ 0600, không phải Actions. Điều kiện r1.1: roles đọc 02-roles.sh qua stdin, không dòng stderr nào vào log, test SENTINEL; SEC review chênh lệch r1.1 trước gộp | SEC | Quyền SEC |`
