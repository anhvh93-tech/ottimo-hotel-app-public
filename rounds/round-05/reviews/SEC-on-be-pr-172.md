# SEC review – BE PR #172 (V5-17: cờ `is_complimentary` đi theo tiền, migration 0097, M4d)

- Người review: SEC | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #172 @ **`1a848c2a`** (`1a848c2a2f72aeeeefae8657fa7af5ff3df6ec37`), merge-base với `main` là `78024f17`.
- SEC xét theo yêu cầu của BE trong PR: M4d chỉ đọc và ghim SHA-256; hai cột đếm đơn thêm; tắt/bật RLS trong giao dịch của migration 0097; trigger và hàm không mở đường vượt RLS; chỉ in số. Định nghĩa "miễn phí" là việc của DATA/DOM, migration và khóa là việc của ARC.
- Đã đọc: `scripts/v5-17-complimentary-check.sql`, `src/db/migrations/0097_complimentary_follows_revenue.sql`, `src/db/migrate.ts`, phần diff mã ứng dụng (`reservation-store.ts`, `reservations.service.ts`, `lease-nights.ts`, `stay-night-allocation.ts`, `stay-night-pricing.ts`), test `test/integration/v5-17-complimentary-follows-revenue.test.ts`, `test/integration/architecture.test.ts` (luật RLS bật và FORCE), `infra/postgres/init/02-roles.sh`, runbook v1.0.5 mục 1.6 và `SEC-on-ops-prs-92-93-95.md` 1.4.
- Không chạy trên staging hay production. Không có dữ liệu khách.

## 0. Kết luận

**DUYỆT.** 0 Blocker, 0 Major, 0 Minor, 2 Suggestion. Không ESC.

**Ghim M4d** (`product/services/api/scripts/v5-17-complimentary-check.sql` tại `1a848c2a`, 5184 byte, UTF-8, LF):

```
6dd07cc4b7f35cb963e5631183cc93e0f476c365385a395e5bca0b000a2f98ba
```

Tám ký tự để ORC so trong lượt chạy: `6dd07cc4`. Cách tính: `shasum -a 256 services/api/scripts/v5-17-complimentary-check.sql` từ `product/` trên checkout của commit sẽ deploy. Tệp đổi một byte (kể cả khi rebase làm đổi chú thích) thì ghim mất hiệu lực: BE báo, SEC ghim lại. OPS chép đúng chuỗi này vào runbook v1.0.5 mục 0.1 (dòng M4d), P2 bước 3 và K12.

## 1. M4d chỉ đọc

| Điều kiện | Kết quả |
|---|---|
| Giao dịch | `BEGIN TRANSACTION READ ONLY` … `ROLLBACK`. Khối chạy còn ép `default_transaction_read_only=on`, `role=ottimo_readonly`, `statement_timeout`, `lock_timeout` qua `PGOPTIONS`. Không `DO`, không `SET`, không ghi |
| Vai | `ottimo_readonly` (BYPASSRLS, chỉ SELECT). Tệp **không gọi** `reservation_is_complimentary()`: luật đơn được viết lại bằng SQL thuần. Vậy `ottimo_readonly` không cần quyền EXECUTE, và tệp chạy được trên v1.0.4 (hàm chưa có) |
| Dòng gác | Dừng có lỗi khi không BYPASSRLS mà không có tenant, hoặc không thấy `property`. Không bao giờ in `0\|0` chỉ vì không thấy gì. Lỗi là chuỗi hằng, không có dữ liệu |
| Dòng đêm | **Đúng nguyên văn** câu SEC đã duyệt ở `SEC-on-ops-prs-92-93-95.md` 1.4 (so với runbook v1.0.5 mục 1.6) |
| Ký tự | Ký tự ngoài ASCII chỉ nằm trong chú thích. Mọi dòng lệnh là ASCII. Không CR |

**Hai cột đếm đơn thêm** (`don_mien_phi_ma_co_tien`, `don_khong_mien_phi_ma_0d`): duyệt về bảo mật.
- Đầu ra chỉ là hai `count(*) FILTER` trên toàn bộ đơn. Không id, mã đơn, ngày, căn, số tiền hay cột khách.
- Cột tiền (`room_revenue_vnd`) chỉ nằm trong `FILTER`/`sum` rồi so với 0. Không giá trị nào được in.
- Cột đọc: `reservation (id, is_complimentary)`, `stay_night (is_complimentary, room_revenue_vnd, night_state, void_reason, reservation_id)`. Không cột C2/C3 (`data-classification`).
- Số đếm đơn lệch cờ là số kỹ thuật, cùng hạng với hai cột đêm. Được ghi vào repo, decision-log.

## 2. Migration 0097: tắt/bật RLS

| Điều kiện | Kết quả |
|---|---|
| Cùng một giao dịch | `migrate.ts` gọi `migrate()` của drizzle (node-postgres), chạy mọi migration còn thiếu trong **một** giao dịch, sau `SET ROLE ottimo_owner` và khóa advisory |
| Không ai thấy lúc RLS tắt | `ALTER TABLE … DISABLE/NO FORCE ROW LEVEL SECURITY` giữ khóa ACCESS EXCLUSIVE trên `stay_night` và `reservation` tới khi giao dịch kết thúc. Phiên khác (ottimo_app, ottimo_readonly) chờ, không đọc hay ghi được hai bảng trong lúc đó |
| Lỗi giữa chừng | `RAISE EXCEPTION` (còn lệch) hoặc lỗi bất kỳ: rollback cả giao dịch, kể cả bước tắt RLS. Không có trạng thái "RLS tắt" nào được commit |
| Bật lại đủ | Bật lại `ENABLE` + `FORCE` cho cả hai bảng, trước khi tạo trigger. Đúng mẫu 0016, 0018, 0043, 0055, 0064, 0068 |
| Có test giữ | `architecture.test.ts`: mọi bảng `public` phải RLS bật **và** FORCE, trừ danh sách ngoại lệ. Bật lại thiếu một dòng là CI đỏ |
| Chỉ in số | NOTICE và EXCEPTION chỉ có số đếm (đêm, đơn, sang true, sang false, còn lệch). Không id, mã, số tiền |
| Không đụng cột khác | Lượt tính lại chỉ ghi `is_complimentary`, không `updated_at`. Không bảng nào có trigger sẵn trên `reservation` hay `stay_night`, nên lượt ghi không kích chuỗi trigger khác |

## 3. Trigger và hàm: không mở đường vượt RLS

| Điều kiện | Kết quả |
|---|---|
| SECURITY INVOKER | Cả ba hàm (`reservation_is_complimentary`, `stay_night_complimentary_follows_revenue`, `stay_night_reservation_complimentary`). Không SECURITY DEFINER. Trigger chạy với quyền và RLS của **người ghi** (ottimo_app có tenant) |
| `search_path` | Cố định `pg_catalog, pg_temp` (pg_temp đứng cuối). Mọi bảng và hàm trong thân đều ghi `public.` Không SQL động (`EXECUTE format`), không tham số chuỗi |
| Quyền | `REVOKE ALL … FROM PUBLIC` cả ba hàm. Chỉ `ottimo_app` được EXECUTE `reservation_is_complimentary` (thân trigger cần). `ottimo_readonly`, `ottimo_requeue` không có. Hai vai này không ghi `stay_night`, nên không lượt ghi nào của chúng bị trigger chặn |
| Không thành "cổng" sang tenant khác | Nếu một dòng đêm (vì lỗi mã) trỏ tới đơn của cơ sở khác: `UPDATE public.reservation` trong trigger chạy dưới RLS của người ghi, nên không thấy và không sửa được đơn đó (0 dòng). `reservation_is_complimentary(id)` của đơn không thấy được luôn trả `false` (không đêm nào thấy được → nhánh `ELSE false`), nên không dùng làm phép dò được |
| Không cho quyền mới | Trigger chỉ ghi `reservation.is_complimentary`, cột mà `ottimo_app` vốn đã UPDATE được (`0014`, GRANT UPDATE trên `reservation`). BEFORE trigger chỉ đặt `NEW.is_complimentary` từ `NEW.room_revenue_vnd`. Không đổi tiền, trạng thái hay chủ sở hữu |
| Cờ có dùng để gác gì không | Không. `is_complimentary` chỉ được đọc để hiện và báo cáo (ADR, Occupancy). Không gác thanh toán, cọc, hóa đơn hay quyền. Đổi luật cờ không mở hay khóa việc nào |
| Mã ứng dụng | Câu SQL vẫn dùng tham số bind; chỉ thêm biểu thức `($n::bigint - discount_vnd = 0)`. Không chuỗi ghép |

## 4. Thẻ

### FB-R5-SEC-BE-172-01
- Mức độ: Suggestion
- Vị trí: `test/integration/v5-17-complimentary-follows-revenue.test.ts`
- Vấn đề: lý do trigger không vượt RLS (mục 3, dòng "Không thành cổng") hiện chỉ đúng nhờ SECURITY INVOKER. Chưa có ca nào giữ điều đó. Ai đó đổi một hàm sang SECURITY DEFINER "cho nhanh" thì test vẫn xanh.
- Vì sao quan trọng: một hàm DEFINER do `ottimo_owner` sở hữu chạy dưới FORCE RLS của owner, nhưng nếu sau này owner được BYPASSRLS hay bảng bỏ FORCE thì trigger sẽ ghi được đơn của cơ sở khác.
- Đề xuất sửa: thêm một ca nhỏ: hai tenant; dưới `ottimo_app` của tenant A, `SELECT reservation_is_complimentary(<id đơn của B>)` trả `false`, và cờ đơn của B không đổi sau một lượt ghi đêm của A. Hoặc một khẳng định trên catalog: `prosecdef = false` cho ba hàm của 0097 (rẻ hơn, có thể đặt ở `architecture.test.ts` cho mọi hàm do migration tạo, trừ danh sách DEFINER đã duyệt).
- Trạng thái: Open

### FB-R5-SEC-BE-172-02
- Mức độ: Suggestion
- Vị trí: runbook v1.0.5 (OPS), mục 0.1 dòng M4d, K3.
- Vấn đề: sau 0097, M4d "sau" khác `0|0` có nghĩa là trigger bị thiếu hoặc bị tắt. Tắt trigger cần quyền owner, nên đó cũng là dấu hiệu ai đó có quyền owner đã đụng DB ngoài migration.
- Đề xuất sửa: OPS thêm hai trigger của 0097 vào `ops-check db_triggers` (BE đã gợi ý trong PR). Khi M4d "sau" khác `0|0`: ngoài việc báo BE + DATA, ORC báo SEC kèm kết quả `db_triggers`.
- Trạng thái: Open

## 5. Dòng decision-log (ORC chép)

`| 2026-11-07 | 5 | **SEC – review BE PR #172 (V5-17, migration 0097, M4d) @ 1a848c2a: DUYỆT.** Ghim SHA-256 scripts/v5-17-complimentary-check.sql = 6dd07cc4b7f35cb963e5631183cc93e0f476c365385a395e5bca0b000a2f98ba (8 ký tự 6dd07cc4); BEGIN READ ONLY … ROLLBACK, ottimo_readonly, dòng gác như K14, dòng đêm đúng nguyên văn câu M4d đã duyệt; hai cột đếm đơn thêm duyệt (chỉ count, cột tiền chỉ so với 0, không cột C2/C3). 0097: tắt/bật RLS trong giao dịch duy nhất của migrator (khóa ACCESS EXCLUSIVE, lỗi thì rollback cả bước tắt; architecture.test giữ RLS bật + FORCE); ba hàm SECURITY INVOKER, search_path cố định, bảng ghi public., REVOKE PUBLIC, EXECUTE chỉ ottimo_app; trigger không vượt RLS và không cho quyền mới; cờ không gác việc nào. Suggestion 172-01 (test prosecdef/hai tenant), 172-02 (db_triggers, báo SEC khi M4d sau ≠ 0). Không ESC | SEC | rounds/round-05/reviews/SEC-on-be-pr-172.md |`

## 6. Điểm làm tốt

- M4d viết lại luật đơn bằng SQL thuần thay vì gọi hàm: không phải cấp EXECUTE cho `ottimo_readonly`, và một tệp chạy được cả trước lẫn sau migration.
- Lượt tính lại có điểm dừng rõ: còn lệch là `RAISE EXCEPTION` và rollback, không để migration "xong" với dữ liệu nửa đúng.
- Chọn SECURITY INVOKER cho cả trigger, nên trigger không thể làm điều mà người ghi không làm được.
