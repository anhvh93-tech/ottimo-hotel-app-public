# SEC review – PR #96 (V5-25, nhánh `r5-v5-25`) @ `e0bdb3b8`

- Round 5, bước Review. Người viết: SEC. Ngày 06/11.
- Phạm vi:
  1. câu SQL chỉ đọc `product/services/api/scripts/v5-25-parameter-shape-check.sql`, mà ORC sẽ chạy trên production trước khi deploy v1.0.5;
  2. ghim SHA-256 của câu SQL;
  3. xem nhanh mặt bảo mật của mã: log của đọc phòng thủ, SQL mới.
- Đã đọc: `git diff f4270ab4..e0bdb3b8`, 13 tệp, +1871/−56. CI: SUCCESS và SKIPPED, không có FAIL.
- Không đọc phần nghiệp vụ của luật lưu (DOM 12.1–12.4). Phần đó do DOM, ARC và QA xem.
- SEC không chạy gì trên staging hay production.

---

## 0. Kết luận

**DUYỆT để gộp PR #96 @ `e0bdb3b8`.**

- 0 Blocker, 0 Major, 1 Minor (`FB-R5-SEC-BE-V525-01`, dời được), 1 Suggestion (`FB-R5-SEC-OPS-V525-02`).
- **Câu SQL: DUYỆT để ORC chạy trên production** đúng như mục 4. Các điều kiện trong mục 4 là điều kiện để chạy, không phải điều kiện để gộp:
  - SHA-256 phải trùng;
  - chạy đúng khối đã ghim;
  - đọc kết quả theo bảng mục 4.4.
- Nếu tệp SQL đổi sau `e0bdb3b8`, kể cả chỉ đổi chú thích, SHA sẽ lệch. Khi đó ORC không chạy và báo SEC ghim lại.
- PR không chạm đường dẫn nào SEC giữ trong `.github/CODEOWNERS`. Vì vậy cổng (b) của CODEOWNERS không bắt buộc tệp này; tệp này viết theo yêu cầu riêng của ORC.
- Không có ESC.

---

## 1. Câu SQL chỉ đọc (yêu cầu 1)

Tệp `product/services/api/scripts/v5-25-parameter-shape-check.sql` @ `e0bdb3b8`, 286 dòng.

| Kiểm | Kết quả | Chỗ trong tệp |
|---|---|---|
| Chỉ in `key \| effective_from \| ok` | Đạt. Câu cuối là `SELECT key, s AS effective_from, ok FROM v ORDER BY key, effective_from;` | 282–284 |
| Không in giá trị | Đạt. Cột `value` chỉ được đọc trong các CTE để kiểm hình dạng. Không cột nào in ra lấy từ `value`; `ok` chỉ là true/false | 28–281 |
| `key` là chữ cố định | Đạt. Chỉ lấy dòng có `key` thuộc danh sách 14 khóa (cộng `business_day_rollover`, chỉ đọc để tính ngày kinh doanh, không in ra) | 21–26, 33 |
| Không cột dữ liệu khách | Đạt. Chỉ đọc 2 bảng: `config_parameter` (`property_id`, `key`, `effective_from`, `value`) và `property` (`id`, `timezone`). Không in `property_id` hay tên cơ sở | toàn tệp |
| Tự mở và đóng giao dịch chỉ đọc | Đạt. `BEGIN TRANSACTION READ ONLY;` ở dòng 18, `ROLLBACK;` ở dòng 286. Ngoài chú thích chỉ có đúng 3 câu lệnh: BEGIN, một SELECT, ROLLBACK | 18, 286 |
| Không có câu ghi hay câu đổi phiên | Đạt. Không có `INSERT`, `UPDATE`, `DELETE`, DDL, `COPY`, `DO`, `CALL`, `EXECUTE`. Không có `SET`, `RESET`, `SET ROLE`, `SESSION AUTHORIZATION`, `set_config`, `READ WRITE`, `COMMIT`. Không có `pg_sleep`, `dblink`, `lo_*`, `pg_read_*`. Không có lệnh psql (`\…`). Đúng luật `FB-R4-SEC-OPS-P404R1-S1` | grep trên các dòng không phải chú thích |
| Giá trị hỏng không làm câu lỗi | Đạt. Mọi phép ép kiểu từ jsonb sang số, ngày hay giờ đều nằm sau `CASE jsonb_typeof`, regex hoặc `pg_input_is_valid`. Giá trị hỏng cho `ok = false` | 36–281 |
| Phiên bản Postgres | Đạt. `pg_input_is_valid` cần Postgres 16 trở lên; production dùng `postgres:17-alpine@sha256:b0f9560a…` | `product/infra/docker-compose.prod.yml` 126 |
| Quyền của `ottimo_readonly` | Đạt. Vai này có SELECT trên mọi bảng `public` | `product/infra/postgres/init/02-roles.sh` 127 |

Lưu ý:
- Test tích hợp (`test/integration/v5-25-parameter-save.test.ts` 340–410) đọc đúng tệp này bằng `readFileSync` và kiểm câu cuối là `ROLLBACK`. Nhưng test chạy dưới vai chủ có RLS, không phải `ottimo_readonly`. SEC đã chạy thử dưới `ottimo_readonly` trên DB dùng một lần (mục 4.5).
- Câu chạy ở mức cơ sở (không lọc theo `property_id`) và không in mã cơ sở. Hiện OTTIMO có 1 cơ sở nên không sao. Khi có cơ sở thứ hai, xem `FB-R5-SEC-OPS-V525-02` mục 3.
- Mẫu lệnh chạy ở chú thích đầu tệp (dòng 12–14) dùng `-f` và thiếu `statement_timeout`, `lock_timeout`. ORC **không** dùng mẫu đó, mà dùng khối ở mục 4.3.

---

## 2. Ghim SHA-256 (yêu cầu 2)

| Tệp | Commit | Kích thước | Git blob | SHA-256 |
|---|---|---|---|---|
| `product/services/api/scripts/v5-25-parameter-shape-check.sql` | `e0bdb3b8cfe70e482b61f98a2a4690c8db577c1d` | 18501 byte | `34f455c898acaa8fd4b79a660f07d8f0dbc45d1a` | `22fd7b835996442f46165f8cc021c450b2cd0d450a8349ca9ccd45f7615ba039` |
| Khối chạy `v525_run.sh` (mục 4.3, trích từ tệp này bằng lệnh mục 4.2) | commit chứa tệp này | 6 dòng | – | `8356b0e69a887bd5694004e5c09f2bad791210f82dd3f29ed53a94bcccaa67ed` |

---

## 3. Mặt bảo mật của mã (yêu cầu 3)

| Kiểm | Kết quả |
|---|---|
| `sql.raw` hay SQL ghép chuỗi mới | Không có. Grep `sql.raw`, `.raw(`, `` sql` `` trên các dòng thêm trong `src`: 0 kết quả |
| Câu SQL mới trong mã | Có 1 câu, ở `parameters.service.ts` (+10 dòng): `SELECT effective_from::text, value FROM config_parameter WHERE property_id = $1 AND key = $2 AND effective_from > $3`. Câu dùng tham số; `key` là hằng trong mã (`min_stay` hoặc `short_stay_max_nights`). Câu chạy trong `tx` có ngữ cảnh RLS của người lưu. Đạt |
| Log của đọc phòng thủ (`reservations/public/min-stay-read.ts`) | `log.warn` chỉ ghi: số luật bị bỏ, tổng số luật, `field` và `code` của lỗi đầu tiên, `property=<uuid>`, và `fingerprint` (16 ký tự hex đầu của SHA-256 của mã cơ sở cộng JSON giá trị). Không ghi chính giá trị; không có dữ liệu khách; mã cơ sở không phải dữ liệu cá nhân. Một chỗ hở nhỏ: khi luật có khóa lạ, `field` là `value[<i>].<tên khóa lạ>`. Tên khóa lạ là một phần của giá trị đã lưu, và đi thẳng vào log dạng chữ của Nest (`ConsoleLogger`, không qua `redact` của pino). Xem `FB-R5-SEC-BE-V525-01`. Mức Minor vì tên khóa chỉ do OWN/MGR gõ qua API cũ, hoặc do người có quyền ghi DB |
| Ngập log từ đường công khai | Không. Ước giá trên web đi qua `PricingService.load`, khách vô danh gọi được. Nhưng log chỉ ghi một lần cho mỗi dấu (`fingerprint`), tập dấu bị chặn ở 500. Giá trị nằm trong DB, không đến từ request, nên khách vô danh không tạo được dấu mới |
| Phản hồi 422 khi lưu | `field` có thể nhắc lại tên khóa lạ, nhưng đó là dữ liệu của chính người gửi (OWN/MGR). Không lộ gì thêm |
| Hợp đồng và phân quyền | PR không đổi `openapi.yaml`, `x-roles`, `rbac-cases.json`; không thêm endpoint |
| Bí mật, dữ liệu khách trong test và fixture | Không có. `br-examples.json` và `parameter-shape-cases.ts` chỉ chứa giá trị cấu hình giả |

---

## 4. Chạy trên production (ORC chạy trong ngày INV cho phép SSH; SEC không chạy)

### 4.1 Luật chạy

Giữ luật 1–5 và 7 của `rounds/round-04/qa/v1.0.4-prod-readonly-pack.md` mục 1:
- chạy bằng một lần gọi SSH, từ tệp trích ra từ commit, sau khi so SHA-256 (mục 4.2);
- không dán tay, không sửa câu, không `tee`, không `>`;
- 5 dòng đầu phải đúng `on`, `ottimo_readonly`, `30s`, `3s`, `t|f`. Khác thì dừng;
- có lỗi, hoặc dòng cuối không phải `#END`: dừng, chỉ báo SEC loại lỗi (ví dụ `invalid input syntax`, `permission denied`). **Không chép câu báo lỗi**, vì báo lỗi ép kiểu của Postgres có thể nhắc lại giá trị;
- gặp `permission denied`: dừng, báo OPS, không chạy lại bằng vai quản trị;
- có trên 200 dòng kết quả: dừng, báo SEC (dự kiến dưới 50 dòng).

Thêm cho lần này:
- Chạy trước deploy v1.0.5. Không chạy khi `deploy.sh` hoặc migrate đang chạy. Có thể gộp vào lần SSH khác trong cùng ngày INV cho phép.
- Câu này không phụ thuộc mã đã deploy, nên chạy trước hay sau khi gộp PR #96 đều được. Chỉ cần SHA trùng.

### 4.2 Trích từ commit, so SHA

```bash
cd /Users/anhvh/Desktop/hotel-app && git fetch origin
Q=$(git log -1 --format=%H origin/main -- product/services/api/scripts/v5-25-parameter-shape-check.sql)
[ -n "$Q" ] || Q=e0bdb3b8cfe70e482b61f98a2a4690c8db577c1d
S=$(git log -1 --format=%H origin/main -- rounds/round-05/reviews/SEC-on-pr-96-v5-25.md)
W=$(mktemp -d)
git show "${Q}:product/services/api/scripts/v5-25-parameter-shape-check.sql" > "$W/v525.sql"
git show "${S}:rounds/round-05/reviews/SEC-on-pr-96-v5-25.md" \
  | awk '/^# >>> v525-run$/ {f=1} f {print} /^# <<< v525-run$/ {f=0}' > "$W/v525_run.sh"
cd "$W" && shasum -a 256 v525.sql v525_run.sh
```

- Dòng `[ -n "$Q" ] || Q=e0bdb3b8…` dùng khi PR #96 chưa gộp: khi đó `main` chưa có tệp, nên lấy thẳng từ commit đã duyệt.
- Không thêm chú thích `#` vào cuối dòng khi dán vào zsh: zsh tương tác mặc định không coi `#` là chú thích.
- Mọi biến đều để trong `"${…}"` trước dấu `:`, tránh lỗi `:r` của zsh (xem `SEC-on-bug-r5-002.md`).

Chỉ chạy khi **cả 2 dòng** trùng bảng dưới. Lệch thì không chạy, báo SEC.

| Tệp | SHA-256 |
|---|---|
| `v525.sql` | `22fd7b835996442f46165f8cc021c450b2cd0d450a8349ca9ccd45f7615ba039` |
| `v525_run.sh` | `8356b0e69a887bd5694004e5c09f2bad791210f82dd3f29ed53a94bcccaa67ed` |

### 4.3 Khối chạy

- Phần `ssh` trùng từng ký tự với dòng 61 của `rounds/round-04/qa/v1.0.4-prod-readonly-pack.md`, bản SEC đã duyệt. Chỉ bỏ ` <<'SQL'` ở cuối, vì SQL đến qua ống `|` vào stdin.
- Stdin gồm 3 phần theo thứ tự:
  1. 5 câu chốt phiên;
  2. nguyên tệp `v525.sql`;
  3. `SELECT '#END';`.
- Khối tự so SHA của `v525.sql` một lần nữa trước khi gọi `ssh`.

```bash
# >>> v525-run
cd "$(dirname "$0")" || exit 1
test "$(shasum -a 256 v525.sql | cut -d ' ' -f 1)" = 22fd7b835996442f46165f8cc021c450b2cd0d450a8349ca9ccd45f7615ba039 || { echo 'v525.sql: SHA-256 mismatch - stop, report to SEC'; exit 1; }
{ printf '%s\n' 'SHOW default_transaction_read_only;' 'SELECT current_user;' 'SHOW statement_timeout;' 'SHOW lock_timeout;' 'SELECT r.rolbypassrls, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user;'; cat v525.sql; printf '%s\n' "SELECT '#END';"; } | \
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'\'''
# <<< v525-run
```

- Chạy bằng `bash "$W/v525_run.sh"`: một lần gọi, không `| tee`, không `>`.
- Xong thì xóa `$W`. Thư mục này chỉ chứa câu SQL và khối chạy.

### 4.4 Đọc kết quả

| Dòng | Đúng là | Khác thì |
|---|---|---|
| 1–5, chốt phiên | `on`, `ottimo_readonly`, `30s`, `3s`, `t\|f` | Dừng (luật 3 của gói v1.0.4) |
| 6 | `BEGIN` (thẻ lệnh của psql) | Dừng, báo SEC |
| Các dòng giữa | `<key>\|<YYYY-MM-DD>\|t` hoặc `…\|f`. `key` thuộc danh sách 14 khóa ở mục 1. Mỗi dòng là một bản ghi cấu hình đang hiệu lực hoặc đã hẹn. Có thể không có dòng nào | Có cột thứ tư, hoặc có chữ ngoài khuôn này: dừng, báo SEC, không chép |
| Áp chót | `ROLLBACK` | Dừng, báo SEC |
| Cuối | `#END` | Dừng, báo SEC |

Xử lý:
- **Mọi dòng `t`:** không phải làm gì.
- **Có dòng `f`:**
  - ORC báo PO và DOM, chỉ ghi `key` và ngày áp dụng.
  - OWN/MGR sửa trên Desk: lưu lại giá trị đúng bằng `setParameter`, hoặc hủy dòng đã hẹn. **Không bao giờ sửa bằng `UPDATE`**, kể cả khi đang có SSH.
  - Có giữ deploy hay không là việc của PO và DOM theo V5-25. Về bảo mật, SEC không chặn.
- **Được chép** nguyên các dòng kết quả (khóa, ngày, `t`/`f`) và giờ chạy vào decision-log. Các dòng này không có giá trị cấu hình và không có dữ liệu khách.

### 4.5 Đã chạy thử (DB dùng một lần, dữ liệu giả)

SEC đã chạy khối 4.3 trên một container `postgres:17-alpine@sha256:b0f9560a…` (cùng ảnh với production) dùng một lần, trong máy, `--network none`.
- Khối được trích bằng đúng lệnh `awk` của mục 4.2. Dòng 1–4 giữ nguyên; chỉ thay dòng `ssh … dc exec -T` bằng `docker exec -i -e PGOPTIONS=<cùng chuỗi> … sh -c '<cùng lệnh psql>'`. Stdin giữ nguyên.
- Đã so dòng `ssh` của khối với dòng 61 của gói v1.0.4 (bỏ ` <<'SQL'`): trùng từng ký tự.
- Dựng tối thiểu 2 bảng `property` và `config_parameter`, bật RLS có FORCE, không policy. Tạo vai `ottimo_readonly` (NOLOGIN, BYPASSRLS, chỉ SELECT).
- Dữ liệu giả: 7 dòng cấu hình, trong đó có `min_stay` không phải danh sách, `min_stay` đã hẹn có khóa lạ, `weekend_nights` và `max_open_holds_per_user` là chuỗi. Các giá trị hỏng mang chuỗi đánh dấu `ZZMARK`.
- Kết quả, đúng khuôn mục 4.4:

```text
on
ottimo_readonly
30s
3s
t|f
BEGIN
max_open_holds_per_user|2026-01-01|f
min_stay|2026-01-01|f
min_stay|2026-12-01|f
short_stay_max_nights|2026-01-01|t
weekend_nights|2026-01-01|t
weekend_nights|2026-12-20|f
ROLLBACK
#END
```

- `ZZMARK` không xuất hiện trong kết quả (0 lần). Dòng `business_day_rollover` không được in. Giá trị hỏng không làm câu lỗi.
- Thử thêm 2 đường dừng:
  - thêm 1 byte vào `v525.sql`: khối in `v525.sql: SHA-256 mismatch - stop, report to SEC`, thoát mã 1, không gọi DB;
  - thu hồi SELECT của `ottimo_readonly` trên `property`: psql in `ERROR:  permission denied for table property` rồi thoát, không có `ROLLBACK` và `#END`. Đúng luật dừng mục 4.1.
- Đã xóa container sau khi chạy.

---

## 5. Thẻ feedback

### FB-R5-SEC-BE-V525-01
- Mức độ: Minor
- Người nhận: BE (tác giả PR #96)
- Vị trí: `product/services/api/src/modules/reservations/public/min-stay-read.ts`, câu `log.warn`; `platform/public/parameter-shapes.ts` 79 (`issue(\`${at}.${extra}\`, 'NOT_ALLOWED')`).
- Vấn đề:
  - Khi một luật `min_stay` đã lưu có khóa lạ, log ghi `first ${first?.field}`, tức `value[<i>].<tên khóa lạ>`. Tên khóa là một phần của giá trị đã lưu, có thể dài, có thể chứa xuống dòng, và đi thẳng vào log chữ của Nest mà không qua `redact`.
  - Hậu quả: giả một dòng log, hoặc lộ chữ người dùng đã gõ. Khả năng thấp, vì chỉ OWN/MGR (qua API cũ) hoặc người có quyền ghi DB tạo được giá trị như vậy.
  - Chưa có test nào kiểm nội dung dòng log này. `resetMinStayReadLog` chưa được test nào gọi.
- Đề xuất:
  - Trong log, khi `code = NOT_ALLOWED`, ghi `value[<i>].<unknown key>` thay cho tên khóa thật. Các trường hợp khác chỉ ghi `field` khi nó khớp `^value(\[\d+\])?(\.[A-Za-z]+)?$`, không khớp thì ghi `value[<i>]`.
  - Thêm 1 test đơn vị: lưu giá trị có khóa lạ chứa `\n` và một chuỗi đánh dấu; kiểm dòng `warn` không chứa chuỗi đó, không chứa `\n`, và không chứa JSON của giá trị.
  - Phản hồi 422 khi lưu giữ nguyên `field` theo ARC 1.24, vì người gửi là chủ dữ liệu.
- Hạn: commit nhỏ trên #96 nếu kịp, không thì v1.0.6. Không chặn gộp.
- Trạng thái: Open

### FB-R5-SEC-OPS-V525-02
- Mức độ: Suggestion
- Người nhận: OPS (CODEOWNERS), BE (tác giả các script)
- Vấn đề: `product/services/api/scripts/*.sql` là những câu ORC chạy trên production (ví dụ `sec-be73-check.sql`, nay thêm `v5-25-parameter-shape-check.sql`), nhưng chưa có dòng nào trong CODEOWNERS. Hiện chỉ có việc ghim SHA trong từng tệp review giữ chúng.
- Đề xuất:
  1. Thêm dòng `/product/services/api/scripts/*.sql @anhvh93-tech` (SEC) vào CODEOWNERS, kèm chú thích "SQL chạy trên production – cổng (b)".
  2. Thêm một test lint cho `scripts/*.sql`, cùng luật với `ops-check.sh`:
     - từ chối `SET ROLE`, `RESET`, `SESSION AUTHORIZATION`, `set_config('role'`, `READ WRITE`, `COMMIT`, lệnh psql `\`;
     - bắt buộc câu đầu là `BEGIN TRANSACTION READ ONLY` và câu cuối là `ROLLBACK`.
  3. Sửa mẫu lệnh ở chú thích đầu `v5-25-parameter-shape-check.sql` cho khớp mục 4.3: stdin, có `statement_timeout`, `lock_timeout`. Khi có cơ sở thứ hai, in số thứ tự cơ sở (không in uuid) để phân biệt dòng. **Chỉ sửa sau khi đã chạy câu này cho v1.0.5**, vì sửa tệp làm lệch SHA đã ghim.
- Hạn: v1.0.6.
- Trạng thái: Open
