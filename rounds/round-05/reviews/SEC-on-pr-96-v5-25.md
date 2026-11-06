# SEC review – PR #96 (V5-25, nhánh `r5-v5-25`) và PR #109 (damage_catalog, nhánh `r5-v5-25-damage`)

- Round 5, bước Review. Người viết: SEC.
- Các lượt:
  - **Lượt 1** (06/11) @ `e0bdb3b8`: `git diff f4270ab4..e0bdb3b8`, 13 tệp, +1871/−56. CI xanh.
  - **Lượt 2** (07/11) @ `897ff46e`: `git diff e0bdb3b8..897ff46e`, 10 tệp, +724/−61. Lúc SEC đọc, CI của `897ff46e` đang chạy.
  - **PR #109** @ `f2e6733d` (base `r5-v5-25`): `git diff r5-v5-25..r5-v5-25-damage`, 9 tệp, +916/−51. Lúc SEC đọc, CI đang chạy. PR này **không** đổi câu SQL.
- Phạm vi:
  1. câu SQL chỉ đọc `product/services/api/scripts/v5-25-parameter-shape-check.sql`, mà ORC chạy trên production ngay trước khi deploy v1.0.5 (OPS đưa vào runbook bước P2c);
  2. ghim SHA-256 của câu SQL và của khối chạy;
  3. xem nhanh mặt bảo mật của mã: log của các bộ đọc phòng thủ, SQL mới.
- Không đọc phần nghiệp vụ của luật lưu (DOM 12.1–12.4, 13.1–13.4). Phần đó do DOM, ARC và QA xem.
- SEC không chạy gì trên staging hay production.

---

## 0. Kết luận

**Lượt 2: DUYỆT để gộp PR #96 @ `897ff46e` khi CI xanh.**
**PR #109 @ `f2e6733d`: DUYỆT để gộp vào `r5-v5-25` khi CI xanh.**

> 07/11, sau khi viết: CI của `897ff46e` và của `f2e6733d` đều **xanh** (SEC xem `gh run list`). Điều kiện CI của hai kết luận trên đã đủ.

- 0 Blocker, 0 Major.
- `FB-R5-SEC-BE-V525-01` (Minor): **Closed**. Đã sửa ở `897ff46e`, và #109 dùng cùng hàm `logSafeField`.
- `FB-R5-SEC-OPS-V525-02` (Suggestion): vẫn Open. Ý 3 đã làm một phần: mẫu lệnh đầu tệp nay chạy qua stdin, có timeout.
- **Câu SQL @ `897ff46e`: DUYỆT để ORC chạy trên production** đúng như mục 4.
  - SHA mới là `f5db74ac17e7306a1fc718dce5874ab0322cf94daddda48c7d6c47ba53a2243f`. SEC tự tính, trùng số BE ghi.
  - **SHA cũ `22fd7b83…a039` (lượt 1) hết hiệu lực.** Không chạy bản cũ.
  - Các điều kiện ở mục 4 là điều kiện để chạy, không phải điều kiện để gộp: SHA trùng, đúng khối đã ghim, đọc kết quả theo bảng 4.4.
- Nếu tệp SQL đổi sau `897ff46e`, kể cả chỉ đổi chú thích, SHA sẽ lệch. Khi đó ORC không chạy và báo SEC ghim lại.
- Không PR nào chạm đường dẫn SEC giữ trong `.github/CODEOWNERS`. Tệp này viết theo yêu cầu của ORC.
- Không có ESC.
- Lượt 1 đã kết luận DUYỆT @ `e0bdb3b8`. Kết luận đó nay được thay bằng lượt 2.

---

## 1. Câu SQL chỉ đọc @ `897ff46e` (yêu cầu 1)

Tệp dài 426 dòng. So với lượt 1, tệp thêm 3 thứ:
- một **guard** đứng trước;
- 2 **dòng đếm** đứng sau (DOM 13.2, thẻ `FB-R5-DOM-BE-PR96-02` (a), (b));
- luật "tối đa 2 chữ số thập phân" cho các khóa phần trăm.

| Kiểm | Kết quả | Dòng |
|---|---|---|
| Thứ tự in | (1) guard: đúng thì **không in gì**; (2) `key \| effective_from \| ok`; (3) `open_bookings_cancel_policy_broken \| n`; (4) `damage_catalog_rows_broken \| n`. Ngoài ra không in gì khác | 50–61, 337–339, 345, 400 |
| Không in giá trị | Đạt. `value` và `pricing_snapshot` chỉ được đọc trong CTE và điều kiện. Hai dòng đếm chỉ in **một hằng chữ và `count(*)`**. Không in `property_id`, mã đơn hay tên | toàn tệp |
| Bảng đọc | `config_parameter`, `property` (`id`, `timezone`) và thêm **`reservation`**, chỉ 2 cột: `status` và `pricing_snapshot -> 'cancelPolicy'`. Thêm `pg_roles` (vai hiện tại) và `current_setting('app.property_id', true)`, chỉ **đọc** cài đặt. `reservation` có cột gắn với khách, nhưng câu không đọc cột đó và chỉ in số đếm | 50–61, 345–368 |
| Tự mở và đóng giao dịch chỉ đọc | Đạt. `BEGIN TRANSACTION READ ONLY;` ở dòng 44, `ROLLBACK;` ở dòng 426. Ngoài chú thích có đúng 6 câu: BEGIN, guard, SELECT chính, 2 câu đếm, ROLLBACK | 44, 426 |
| Không có câu ghi hay câu đổi phiên | Đạt. Grep nguyên từ trên các dòng không phải chú thích: không có `INSERT`, `UPDATE`, `DELETE`, DDL, `COPY`, `GRANT`, `DO`, `CALL`, `EXECUTE`, `SET`, `RESET`, `set_config`, `SESSION`, `AUTHORIZATION`, `COMMIT`, `LOCK`, `NOTIFY`, `nextval`, `pg_sleep`, `dblink`, `lo_*`, `pg_read_*`, `READ WRITE`. Không có lệnh psql `\…` | grep |
| Guard viết bằng SQL thuần | Đạt. Không có khối `DO`. Nhánh lỗi trả về một **chuỗi thông báo hằng**; cả biểu thức `CASE` được ép sang `boolean`. Ép hỏng thì psql dừng (`ON_ERROR_STOP`, mã thoát 3) với `invalid input syntax for type boolean: "v5-25 check stopped: …"`. Thông báo là hằng, không chứa giá trị. Nhánh đúng trả `'false'`, nên `WHERE false` không in dòng nào. Phép ép nằm ngoài `CASE` nên chỉ chạy lúc thực thi; SEC đã thử đủ 3 nhánh lỗi và nhánh đúng trên Postgres 17 (mục 4.5) | 50–61 |
| 3 điều kiện của guard | Vai không có BYPASSRLS (và không superuser) mà chưa đặt tenant; không thấy `property` nào; không thấy dòng nào của `min_stay`, `weekend_nights`, `short_stay_max_nights`. Mỗi điều kiện chặn kiểu "kết quả rỗng bị đọc thành mọi thứ đều ổn" | 52–60 |
| Hai dòng đếm | Đạt. Mỗi câu luôn in **đúng 1 dòng** `nhãn\|số`, kể cả khi số là 0. `cancelPolicy` vắng hoặc `null` thì không đếm; đơn đã đóng thì không đếm | 345–368, 373–424 |
| Giá trị hỏng không làm câu lỗi | Đạt. Các phép ép mới đều nằm sau `CASE jsonb_typeof` | 63–424 |
| Postgres, quyền | Như lượt 1: production chạy `postgres:17-alpine@sha256:b0f9560a…`, đủ cho `pg_input_is_valid`. `ottimo_readonly` có SELECT trên mọi bảng `public`, kể cả `reservation` | – |
| Mẫu lệnh ở chú thích đầu tệp | Nay chạy qua stdin (`-f -`), có `statement_timeout`, `lock_timeout`, và trỏ về khối SEC ghim. ORC vẫn **chỉ** dùng khối ở mục 4.3 | 24–31 |

Test tích hợp (`v5-25-parameter-save.test.ts` 407–422, 515–552) chạy đúng tệp này, kiểm thứ tự in và 3 câu báo dừng của guard.

---

## 2. Ghim SHA-256 (yêu cầu 2)

| Tệp | Commit | Kích thước | Git blob | SHA-256 | Hiệu lực |
|---|---|---|---|---|---|
| `product/services/api/scripts/v5-25-parameter-shape-check.sql` | `897ff46e0677120f7e1cb8c6e8631324f9fee1bc` | 28081 byte | `ae69f8ff3be5a253f3b0f4ad683dac8b08566b76` | `f5db74ac17e7306a1fc718dce5874ab0322cf94daddda48c7d6c47ba53a2243f` | **Dùng bản này** |
| Khối chạy `v525_run.sh` (mục 4.3, trích bằng lệnh mục 4.2) | commit chứa tệp review này | 6 dòng | – | `608724131055a136f81689748b323f34844c62e31973dbe4d506378ee41141eb` | **Dùng bản này** |
| SQL lượt 1 | `e0bdb3b8` | 18501 byte | `34f455c8…` | `22fd7b83…a039` | Hết hiệu lực |
| Khối chạy lượt 1 | `df8313da` | 6 dòng | – | `8356b0e6…67ed` | Hết hiệu lực |

---

## 3. Mặt bảo mật của mã (yêu cầu 3)

### 3.1 Lượt 1 @ `e0bdb3b8` (giữ để tra)

- Không có `sql.raw` hay SQL ghép chuỗi mới. Câu SQL mới duy nhất ở `parameters.service.ts` dùng tham số (`$1..$3`), `key` là hằng.
- `log.warn` của `min-stay-read.ts` không ghi giá trị và không có dữ liệu khách. Riêng tên khóa lạ thì có lọt vào log; đó là nội dung thẻ V525-01.
- Log không ngập được từ đường công khai: mỗi dấu (`fingerprint`) chỉ ghi một lần, tập dấu chặn ở 500, và giá trị nằm trong DB chứ không đến từ request.
- Không đổi `openapi.yaml`, `x-roles`, `rbac-cases`.

### 3.2 Lượt 2 @ `897ff46e`

| Kiểm | Kết quả |
|---|---|
| Thẻ V525-01 | Đã sửa. `parameter-shapes.ts` thêm `logSafeField`. Lỗi `NOT_ALLOWED` thì ghi `value[<i>].<unknown key>`. Đường khác chỉ được ghi khi khớp `^value(\[\d+\])?(\.[A-Za-z]+(\[\d+\])?)?$`, tức chỉ gồm tên cố định của luật; không khớp thì ghi `value[<i>]`. Có test (`v5-25-parameter-shapes.test.ts` 423–440): khóa lạ chứa xuống dòng và chuỗi đánh dấu → dòng log không có chuỗi đánh dấu, không xuống dòng, không có JSON. **Closed** |
| `stay.service.ts` (trả phòng sớm) | `early_departure_refund` đã lưu mà sai dạng → 409 `PAYMENT_NOT_CONFIGURED`. `detail` chỉ nêu tên khóa, không nêu giá trị. Không 500, không đoán số tiền hoàn. Đúng hướng toàn vẹn tiền |
| SQL mới trong `src` | Không có. Grep `sql.raw`, `.raw(`, `` sql` ``, `query<` trên các dòng thêm: 0 kết quả |
| Hợp đồng và phân quyền | Không đổi |

### 3.3 PR #109 @ `f2e6733d` – bộ đọc phòng thủ `damage_catalog`

- **Một hàm đọc, hai chỗ gọi.** `folio/internal/damage-catalog-read.ts` có hàm `readDamageCatalog`, được gọi ở:
  1. `BillService.catalogNames` – nhãn dòng hư hỏng trên folio và phiếu;
  2. `getChargeCatalog` – cũng là bảng mà `addFolioLine` dùng để tra mã (`folio-lines.service.ts`).
- **Dòng log** cùng khuôn với `min_stay`:
  - gồm số mục bị bỏ, tổng số mục, đường dẫn trường qua `logSafeField`, `code`, `property=<uuid>` và `fingerprint` (16 ký tự hex, có tiền tố `damage_catalog`);
  - **không** có giá trị, **không** có tên hay giá của mục, không có dữ liệu khách;
  - mỗi giá trị chỉ ghi một lần, tập dấu chặn ở 500;
  - `null`/không có dòng thì không cảnh báo.
  - **Đạt.**
- **Có lợi cho bảo mật:**
  - Mục hỏng bị bỏ, kể cả mục `null`, giá âm, giá lẻ. Vì vậy không còn dòng hư hỏng giá âm lấy từ bảng.
  - Không còn 500 trên mọi folio và phiếu của cơ sở.
  - Thiệt hại ngoài bảng vẫn đi đường MGR+ có ảnh (BR-512).
- **Không có SQL mới, không `sql.raw`.**
- Tên mục in lên phiếu do nhân viên đặt; luật lưu chặn tối đa 100 ký tự. Đường in lên phiếu không đổi trong PR này.

---

## 4. Chạy trên production (ORC chạy trong ngày INV cho phép SSH; SEC không chạy)

### 4.1 Luật chạy

Giữ luật 1–5 và 7 của `rounds/round-04/qa/v1.0.4-prod-readonly-pack.md` mục 1:
- chạy bằng một lần gọi SSH, từ tệp trích ra từ commit, sau khi so SHA-256 (mục 4.2);
- không dán tay, không sửa câu, không `tee`, không `>`;
- 5 dòng đầu phải đúng `on`, `ottimo_readonly`, `30s`, `3s`, `t|f`. Khác thì dừng;
- dòng cuối không phải `#END`: dừng;
- gặp `permission denied`: dừng, báo OPS, không chạy lại bằng vai quản trị;
- trên 200 dòng kết quả: dừng, báo SEC.

Cách báo lỗi:
- **Lỗi của guard** (dòng `ERROR:` có `"v5-25 check stopped: …"`): được chép nguyên văn, vì đó là câu hằng. Dừng; sửa cách chạy (vai, DB); **không bao giờ đọc thành "mọi thứ đều ổn"**.
- **Lỗi khác:** chỉ báo SEC loại lỗi, **không chép câu báo lỗi**, vì báo lỗi ép kiểu có thể nhắc lại giá trị.

Thời điểm:
- Chạy ngay trước deploy v1.0.5, theo bước P2c của runbook OPS. Không chạy khi `deploy.sh` hoặc migrate đang chạy.
- Câu không phụ thuộc mã đã deploy. Chỉ cần SHA trùng.

Runbook (OPS):
- Chép khối mục 4.3 **nguyên văn, kể cả hai dòng đánh dấu** `# >>> v525-run` / `# <<< v525-run`.
- Ghi kèm commit của tệp này và SHA của khối.
- Nếu ORC trích khối từ runbook thay vì từ tệp này: dùng cùng lệnh `awk`; SHA của khối vẫn phải là `60872413…41eb`.

### 4.2 Trích từ commit, so SHA

```bash
cd /Users/anhvh/Desktop/hotel-app && git fetch origin
Q=$(git log -1 --format=%H origin/main -- product/services/api/scripts/v5-25-parameter-shape-check.sql)
[ -n "$Q" ] || Q=897ff46e0677120f7e1cb8c6e8631324f9fee1bc
S=$(git log -1 --format=%H origin/main -- rounds/round-05/reviews/SEC-on-pr-96-v5-25.md)
W=$(mktemp -d)
git show "${Q}:product/services/api/scripts/v5-25-parameter-shape-check.sql" > "$W/v525.sql"
git show "${S}:rounds/round-05/reviews/SEC-on-pr-96-v5-25.md" \
  | awk '/^# >>> v525-run$/ {f=1} f {print} /^# <<< v525-run$/ {f=0}' > "$W/v525_run.sh"
cd "$W" && shasum -a 256 v525.sql v525_run.sh
```

- Dòng `[ -n "$Q" ] || Q=897ff46e…` dùng khi PR #96 chưa gộp: khi đó `main` chưa có tệp, nên lấy thẳng từ commit đã duyệt.
- Không thêm chú thích `#` vào cuối dòng khi dán vào zsh: zsh tương tác mặc định không coi `#` là chú thích.
- Mọi biến đều để trong `"${…}"` trước dấu `:`, tránh lỗi `:r` của zsh.

Chỉ chạy khi **cả 2 dòng** trùng bảng dưới. Lệch thì không chạy, báo SEC.

| Tệp | SHA-256 |
|---|---|
| `v525.sql` | `f5db74ac17e7306a1fc718dce5874ab0322cf94daddda48c7d6c47ba53a2243f` |
| `v525_run.sh` | `608724131055a136f81689748b323f34844c62e31973dbe4d506378ee41141eb` |

### 4.3 Khối chạy (đã ghim)

- Phần `ssh` trùng từng ký tự với dòng 61 của `rounds/round-04/qa/v1.0.4-prod-readonly-pack.md`, bản SEC đã duyệt. Chỉ bỏ ` <<'SQL'` ở cuối, vì SQL đến qua ống `|` vào stdin.
- Stdin gồm 3 phần theo thứ tự:
  1. 5 câu chốt phiên;
  2. nguyên tệp `v525.sql`;
  3. `SELECT '#END';`.
- Khối tự so SHA của `v525.sql` một lần nữa trước khi gọi `ssh`.
- So với lượt 1, chỉ đổi SHA ở dòng 3.

```bash
# >>> v525-run
cd "$(dirname "$0")" || exit 1
test "$(shasum -a 256 v525.sql | cut -d ' ' -f 1)" = f5db74ac17e7306a1fc718dce5874ab0322cf94daddda48c7d6c47ba53a2243f || { echo 'v525.sql: SHA-256 mismatch - stop, report to SEC'; exit 1; }
{ printf '%s\n' 'SHOW default_transaction_read_only;' 'SELECT current_user;' 'SHOW statement_timeout;' 'SHOW lock_timeout;' 'SELECT r.rolbypassrls, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user;'; cat v525.sql; printf '%s\n' "SELECT '#END';"; } | \
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'\'''
# <<< v525-run
```

- Chạy bằng `bash "$W/v525_run.sh"`: một lần gọi, không `| tee`, không `>`.
- Xong thì xóa `$W`. Thư mục này chỉ chứa câu SQL và khối chạy.

### 4.4 Đọc kết quả

Kết quả đúng có dạng: 5 dòng chốt, `BEGIN`, các dòng khóa, 2 dòng đếm, `ROLLBACK`, `#END`. Guard không in dòng nào.

| Dòng | Đúng là | Khác thì |
|---|---|---|
| 1–5, chốt phiên | `on`, `ottimo_readonly`, `30s`, `3s`, `t\|f` | Dừng (luật 3 của gói v1.0.4) |
| 6 | `BEGIN` | Dừng, báo SEC |
| Ngay sau `BEGIN` | Không có dòng của guard | `ERROR: … "v5-25 check stopped: …"`: dừng; chép nguyên câu; sửa cách chạy |
| Các dòng khóa | `<key>\|<YYYY-MM-DD>\|t` hoặc `…\|f`, với `key` thuộc 14 khóa đã kiểm. **Phải có ít nhất** `min_stay`, `weekend_nights`, `short_stay_max_nights` (OTTIMO có 1 cơ sở) | Thiếu một trong 3 khóa đó: cách chạy sai, dừng. Có cột thứ tư hoặc chữ ngoài khuôn: dừng, báo SEC, không chép |
| Áp chót thứ 3 | `open_bookings_cancel_policy_broken\|<số nguyên>` | Không có, hoặc không phải số: dừng, báo SEC |
| Áp chót thứ 2 | `damage_catalog_rows_broken\|<số nguyên>` | Như trên |
| Áp chót | `ROLLBACK` | Dừng, báo SEC |
| Cuối | `#END` | Dừng, báo SEC |

Xử lý, theo luật đọc trong chú thích của tệp (ARC review #96 ĐK-2, DOM 13.2):
- **Mọi dòng `t`, hai số đếm bằng 0:** deploy tiếp.
- **`f` trên `min_stay` hoặc `weekend_nights`:** dừng deploy; OWN/MGR sửa trên Desk trước.
- **`f` trên khóa khác:** ghi khóa và ngày; sửa trên Desk sau deploy.
- **Số đếm khác 0:** dừng deploy, chờ DOM.
  - Không tra từng đơn bằng SQL. Nếu DOM cần biết là đơn nào, SEC viết câu riêng (chỉ in mã đơn), và INV phải đồng ý trước khi chạy.
- **Không bao giờ sửa bằng `UPDATE`**, kể cả khi đang có SSH. Sửa trên Desk: lưu lại giá trị đúng bằng `setParameter`, hoặc hủy dòng đã hẹn.
- **Được chép** nguyên các dòng kết quả và giờ chạy vào decision-log. Các dòng này không có giá trị cấu hình và không có dữ liệu khách.

### 4.5 Đã chạy thử (DB dùng một lần, dữ liệu giả)

**Lượt 2 (07/11), khối và SQL @ `897ff46e`.**

Môi trường:
- Container `postgres:17-alpine@sha256:b0f9560a…`, cùng ảnh với production, `--network none`, xóa sau khi chạy.
- Khối được trích bằng đúng lệnh `awk` mục 4.2. Dòng 1–4 giữ nguyên; chỉ thay dòng `ssh … dc exec -T` bằng `docker exec -i -e PGOPTIONS=<cùng chuỗi> … sh -c '<cùng lệnh psql>'`. Stdin giữ nguyên.
- Bảng tối thiểu: `property`, `config_parameter`, `reservation`. Cả 3 bảng bật RLS có FORCE, không policy.
- Vai `ottimo_readonly`: NOLOGIN, BYPASSRLS, chỉ SELECT.

Dữ liệu giả:
- 7 dòng cấu hình. Trong đó `min_stay` có khóa lạ; `damage_catalog` có một dòng đúng đang hiệu lực và một dòng hỏng đã hẹn (phần tử `null`, giá âm).
- 5 đơn: 1 đơn mở có `cancelPolicy` hỏng (`refundPct` 3 chữ số thập phân); 1 đơn mở có `cancelPolicy` đúng; 1 đơn đã hủy có `cancelPolicy` hỏng; 1 đơn không có `cancelPolicy`; 1 đơn có `cancelPolicy` là `null`.
- Mã đơn và giá trị hỏng mang chuỗi đánh dấu `ZZGUEST`, `ZZMARK`.

Lần 1, chạy đúng:

```text
on
ottimo_readonly
30s
3s
t|f
BEGIN
cancel_policy_direct|2026-01-01|t
min_stay|2026-01-01|f
short_stay_max_nights|2026-01-01|t
weekend_nights|2026-01-01|t
open_bookings_cancel_policy_broken|1
damage_catalog_rows_broken|1
ROLLBACK
#END
```

- Guard không in dòng nào.
- Hai số đếm đúng: chỉ đếm đơn mở hỏng, và chỉ đếm dòng `damage_catalog` hỏng đã hẹn.
- `ZZGUEST`/`ZZMARK` xuất hiện **0 lần**. Mã thoát 0.

Lần 2–4, 3 nhánh dừng của guard. Lần nào psql cũng thoát mã 3 ngay sau `BEGIN`, không có `ROLLBACK` và `#END`:

| Lần | Tình huống | Dòng chốt thứ 5 | Câu báo |
|---|---|---|---|
| 2 | DB không có `property` | `t\|f` | `ERROR:  invalid input syntax for type boolean: "v5-25 check stopped: no property is visible"` |
| 3 | Có `property`, không có dòng của 3 khóa | `t\|f` | `… "v5-25 check stopped: no row of min_stay, weekend_nights, short_stay_max_nights is visible"` |
| 4 | `ottimo_readonly` bị bỏ BYPASSRLS | `f\|f` (luật 3 đã dừng ở đây) | `… "v5-25 check stopped: run as ottimo_readonly (BYPASSRLS) - under RLS without a tenant nothing shows"` |

Lượt 1 (06/11), khối @ `df8313da`:
- Thêm 1 byte vào `v525.sql`: khối in `v525.sql: SHA-256 mismatch - stop, report to SEC` và thoát mã 1, không gọi DB.
- Thu hồi SELECT: psql in `permission denied` rồi thoát, không có `#END`.
- Phần so SHA của khối không đổi ở lượt 2, nên không chạy lại hai ca này.

---

## 5. Thẻ feedback

### FB-R5-SEC-BE-V525-01
- Mức độ: Minor
- Người nhận: BE (tác giả PR #96)
- Vị trí: `reservations/public/min-stay-read.ts`, `log.warn`; `platform/public/parameter-shapes.ts` (`issue(\`${at}.${extra}\`, 'NOT_ALLOWED')`).
- Vấn đề: tên khóa lạ, vốn là một phần của giá trị đã lưu, đi thẳng vào log chữ của Nest. Có thể giả dòng log hoặc lộ chữ người dùng gõ. Không có test nội dung log.
- Đề xuất: ghi `value[<i>].<unknown key>`; các đường khác chỉ ghi khi gồm tên cố định; thêm test có xuống dòng và chuỗi đánh dấu.
- Trạng thái: **Closed** (SEC lượt 2 @ `897ff46e`: `logSafeField` cùng test 423–440. #109 dùng chung hàm này cho `damage_catalog`).

### FB-R5-SEC-OPS-V525-02
- Mức độ: Suggestion
- Người nhận: OPS (CODEOWNERS), BE (tác giả các script)
- Vấn đề: `product/services/api/scripts/*.sql` là các câu ORC chạy trên production, nhưng chưa có dòng nào trong CODEOWNERS. Hiện chỉ có việc ghim SHA trong từng tệp review giữ chúng.
- Đề xuất:
  1. Thêm `/product/services/api/scripts/*.sql @anhvh93-tech` (SEC) vào CODEOWNERS, kèm chú thích "SQL chạy trên production – cổng (b)".
  2. Thêm test lint cho `scripts/*.sql`, cùng luật với `ops-check.sh`:
     - từ chối `SET ROLE`, `RESET`, `SESSION AUTHORIZATION`, `set_config('role'`, `READ WRITE`, `COMMIT`, `DO`, lệnh psql `\`;
     - bắt buộc câu đầu là `BEGIN TRANSACTION READ ONLY` và câu cuối là `ROLLBACK`.
  3. Mẫu lệnh đầu tệp chạy qua stdin, có timeout. **Đã làm ở `897ff46e`.** Còn lại: khi có cơ sở thứ hai, in số thứ tự cơ sở (không in uuid) để phân biệt dòng. Sửa tệp sau lần chạy v1.0.5, vì sửa làm lệch SHA.
- Hạn: v1.0.6.
- Trạng thái: Open (ý 3 xong một phần)
