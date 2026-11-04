# ARC review mã – P4-11 `v104/be-lease-prices` (BE-C, PR-G)

- Round 4 (v1.0.4), bước **Review chéo** (ma trận BE → ARC), 04/11/2026
- Đối tượng: `origin/v104/be-lease-prices` @ `7420885c` (7 commit; nền `55be09d5` của `lp-v2-main`, đã nằm trong `main`), so với `origin/main` @ `7b5b6117`.
- Căn cứ: `plan-v1.0.4.md` dòng P4-11, mục 2.2, quyết định ARC 6.1 (`leaseEndDate`) và 6.2 (ETag); `v1.0.4-contract-0.3.12.md` (b), (c), (d) và mục 3 dòng BE-C; `SEC-on-plan-v1.0.4.md` 3.2 (ED-02 "cần"); báo cáo `rounds/round-04/outputs/BE/v104-be-lease-prices.md`.
- Phạm vi: mã máy chủ, migration, test. Các tệp DOM/QA trên nhánh (`business-rules.md`, `br-examples.json`, `validate-fixtures.mjs`, `r1-main-flows.md`) do DOM/QA review, ARC chỉ kiểm chúng không làm đỏ CI.
- Không sửa mã.

## Phán quyết: **ĐẠT CÓ ĐIỀU KIỆN**

Điều kiện gộp: thẻ **P411-01** (đánh số lại 0094 sau 0093, **snapshot chép từ 0093**, không chỉ đổi `prevId`). Không có Blocker.

## 1. Cách kiểm
- Đọc diff mã máy chủ, migration 0094 và tên ca của 4 tệp test mới/sửa.
- Cây gộp thử (scratch) `main` + P4-10 + P4-11 + P4-12 + P4-14:
  - `tsc` đạt, `eslint` 0 lỗi;
  - `v104-lease-end`, `v104-lease-units`, `room-list-price-append-only`, `rooms-scheduled-prices-v101`, `reservations-pricing`, `a7-lease-nights` xanh (trong bộ 468/468; toàn bộ `@ottimo/api` trên cây gộp 4012 đạt, 0 lỗi – `ARC-on-v104-p4-10.md` mục 1);
  - `integration/schema-parity` **đỏ** khi 0094 chỉ đổi idx + `prevId` theo báo cáo BE-C mục 7 (CHECK `staff_notification_kind_check` lệch head snapshot). Thử lại với snapshot 0094 chép từ 0093 đã sinh lại: `schema-parity` + `migrations-journal` 13/13, `drizzle-kit generate` báo "No schema changes".
- `git merge-tree` với `main`: sạch. Với P4-10 chỉ xung đột journal, đúng dự kiến.

## 2. Đúng quyết định ARC và hợp đồng

| Mục | Mã | Kết quả |
|---|---|---|
| 6.1 khóa lúc check-in, cùng giao dịch | `checkin.service.ts`: chính câu `UPDATE … status = 'in_house'` (dùng chung cho B9 và B9a, là đường check-in duy nhất) ghi `manual_long_stay \|\| {lease_end_date: departure_date}` khi `stay_type = 'long' AND external_contract AND manual_long_stay IS NOT NULL` | Đúng |
| 6.1 B17 bỏ khóa | `UPDATE` hoàn tác check-in: `manual_long_stay - 'lease_end_date'` | Đúng |
| 6.1 thứ tự đọc: khóa → chưa check-in thì `departure_date` → `booked_departure_date` | `lease-end.ts` `leaseEndDateOf`, hàm thuần, một định nghĩa cho DTO và B16. Khóa sai định dạng thì bỏ qua | Đúng |
| 6.1 không cột, không migration; B13/B16 không đổi khóa | Đúng. Tên khóa jsonb `lease_end_date` (snake_case như các khóa khác của khối). Hợp đồng vẫn `leaseEndDate`. Có test khóa nội bộ không lộ ra DTO | Đúng (lệch tên đã ghi, ARC chấp nhận) |
| (b) `Reservation.manualLongStay.leaseEndDate` chỉ đọc | `reservation-dto.ts` thêm trong khối `manualLongStay` → giữ `x-visible-to` FD+ của khối | Đúng |
| B16 chọn BR-313/BR-428 | `earlyDepartureRuleOf`: ngày mới < `leaseEndDate` → BR-313, còn lại BR-428. Audit `after` thêm `earlyDepartureRule`, `leaseEndDate` (allowlist `frontdesk/audit-entities.ts`). `reason` đổi chữ, **số tiền không đổi** | Đúng (hợp đồng (b) câu audit) |
| (c) `first_price` | `cancelScheduledListPrice`: sau `effective`, `only_price` → nếu ngày = `min(effective_from)` thì 409 `INVALID_TRANSITION` `first_price`. Dòng `room` khóa `FOR UPDATE` nên `min` không đổi trước `DELETE` | Đúng |
| (d) / 6.2 `If-Match` hậu tố nén | `parseEntityTag` nhận `-gzip`/`-zstd`/`-br` (cả `W/`); hậu tố khác, danh sách, `*` → null → 422 | Đúng (thẻ P411-03 Suggestion) |
| FB-R4-BE-LPV2M-02 | `platform.controller`: hủy thành công (200) thì `hooks.changed(property, 'room')` sau commit, giống `updateRoom` | Đúng |
| ED-02 (0094) | xem mục 3 | Đúng nội dung, thiếu số → P411-01 |

## 3. Migration 0094 (`room_list_price_append_only`)
- **Nội dung:** `BEFORE DELETE … FOR EACH ROW`. Hàm `SECURITY INVOKER`, `search_path` cố định, `REVOKE ALL … FROM PUBLIC`. Từ chối khi `effective_from <=` ngày lịch theo múi giờ của **property**. Không có property hoặc múi giờ sai → từ chối (đóng an toàn). Thông báo cố định, không id/giá/ngày.
- **Tương thích:** app cũ chỉ xóa dòng tương lai → quay lui app không cần lùi DB. `TRUNCATE` không bắn trigger. FK `room_list_price → room` là `NO ACTION`, không có `DELETE FROM room` trong mã, nên không có đường xóa dây chuyền bị chặn. Seed/`tests/tools`/`infra` không `DELETE` bảng này.
- **Đảo ngược được:** gỡ bằng migration sau (`DROP TRIGGER` + `DROP FUNCTION`), không đụng dữ liệu. Sửa dữ liệu thật thì `DISABLE TRIGGER` bằng chủ bảng, có SEC review (ghi trong chú thích).
- **Test:** (a) dòng quá khứ, (b) dòng ngày mai, (c) Kiritimati / Pago Pago cùng một giờ thật, múi giờ sai, (d) `tgenabled = 'O'`, `prosecdef = false`, `proconfig`. Ca dịch vụ dời sang 2037 để đúng theo cả hai đồng hồ.
- **Đồng hồ:** trigger dùng `now()` của DB, còn dịch vụ dùng đồng hồ tiêm (ADR-008) → thẻ P411-02.

## 4. Test theo tiêu chí nghiệm thu

| AC (plan P4-11) | Ca |
|---|---|
| HĐ đã gia hạn: Trả sớm chọn đúng nhánh | tích hợp: B13 chỉ dời ngày trả; B16 trong phần gia hạn → BR-428; B16 trước ngày kết thúc HĐ → BR-313, không dòng phí, không yêu cầu hoàn. Đơn vị: 4 ca biên (trước, trong gia hạn, đúng ngày, ngắn ngày) |
| `leaseEndDate` trong DTO | đơn vị: in-house sau B13, chưa check-in, khóa không lộ, ngắn ngày không có khối |
| B17 | tích hợp "undo check-in removes the key" |
| BUG-R4-015 bước 1–4, bước 4 → 409 | `rooms-scheduled-prices-v101` ca 502 (OWN và MGR, không xóa, version giữ, dòng sau vẫn hủy được) |
| `If-Match: "6-gzip"` → 200 | tích hợp `it.each(gzip, zstd, br)` + `"6-deflate"` → 422; đơn vị `parseEntityTag` 5 ca nhận và các ca từ chối (hai hậu tố, thiếu số, thiếu ngoặc một bên) |
| Oracle bảng giá 01/11 qua động cơ giá | `reservations-pricing.test.ts` khối `byCalc` + test canh danh sách QA-DOM-PR25-01; 3 `calc` giá web để `it.todo` (đã ghi ở báo cáo mục 4) |
| Idempotency | hủy giá hẹn: `If-Match` + khóa dòng `room`; lặp lại sau khi xóa → 404 như cũ, `hooks.changed` chạy lại vô hại |
| RBAC | không đổi vai của op; `leaseEndDate` theo khối FD+ |

## 5. Thẻ

### FB-R4-ARC-BE-C-P411-01
- Mức độ: Major (**điều kiện gộp PR-G**)
- Vị trí: `meta/_journal.json`, `meta/0094_snapshot.json`, chú thích đầu `0094_room_list_price_append_only.sql`
- Vấn đề: báo cáo BE-C mục 7 ghi "khi 0093 vào: đổi idx 0094 → 70 và `prevId` của snapshot → id snapshot 0093". **Chưa đủ.** Snapshot 0094 hiện là bản chép của 0092, nên thiếu CHECK `staff_notification.kind` mới của 0093. Khi 0094 là head, `schema-parity` đỏ (ARC đã tái hiện trên cây gộp). Lần `generate` sau sẽ sinh một migration nới lại CHECK.
- Vì sao quan trọng: CI đỏ ngay sau PR-G. Nếu ai "sửa" bằng cách sinh migration mới thì chuỗi số v1.0.4 lệch tiếp.
- Đề xuất sửa (sau khi PR-F gộp, rebase lên `main`):
  - journal: `idx` **70**, `when` giữ **`1792782177681`** (= 0093 mới + 2000, tăng nghiêm ngặt);
  - `meta/0094_snapshot.json` = **bản chép của `meta/0093_snapshot.json`** (đã sinh lại ở `origin/v104/be-holds` @ `a91acb84`, theo FB-R4-ARC-BE-B-P410-01), giữ `id` hiện tại `6691350d-e953-46bf-bed3-9e94a364cfca`, `prevId` = **`96671c28-784b-486a-a34e-ed25cc3be90a`** (id snapshot 0093). 0094 không đổi schema, nên đây là mẫu 0064/0084/0090;
  - sửa chú thích đầu SQL: "the snapshot is 0093's", bỏ câu "`when` = 0092 + 4000 … if the merge order differs";
  - kiểm: `drizzle-kit generate` → "No schema changes"; `migrations-journal`, `integration/schema-parity`, `room-list-price-append-only` xanh.
  - Nếu PR-G gộp **trước** PR-F (lệch plan) thì 0094 lấy idx 69, `when` `1792782175681`, snapshot chép từ 0092, và PR-F đổi số theo luật 2.2.
- Trạng thái: Open

### FB-R4-ARC-BE-C-P411-02
- Mức độ: Minor
- Vị trí: `0094_room_list_price_append_only.sql` (`now()`), `platform/internal/rooms.service.ts` (đồng hồ tiêm)
- Vấn đề: dịch vụ cho hủy dòng có `effective_from` > ngày kinh doanh theo **đồng hồ app**. Trigger chặn theo `now()` **thật** của DB. Ở dev/staging `CLOCK_MODE=mutable`, nếu đồng hồ bị lùi (offset âm hoặc đóng băng ở quá khứ), một dòng nằm giữa "hôm nay giả" và "hôm nay thật" qua được dịch vụ nhưng bị trigger chặn → 500 chung. Production dùng `SystemClock`, không bị. Tua đồng hồ tới tương lai cũng không bị.
- Vì sao quan trọng: QA có thể báo nhầm lỗi 500 khi diễn tập trên staging với đồng hồ lùi.
- Đề xuất sửa: không đổi trigger (lớp phòng thủ phải theo giờ thật). Ghi một dòng vào ghi chú QA v1.0.4 và README `MutableClock`: "0094: không hủy giá hẹn khi đồng hồ staging đang lùi về quá khứ". Tùy chọn: dịch vụ ánh xạ `check_violation` của trigger này thành 409 `effective` thay vì 500. Có thể dời v1.0.5.
- Trạng thái: Open

### FB-R4-ARC-BE-C-P411-03
- Mức độ: Suggestion
- Vị trí: `shared/http/precondition.ts` `parseEntityTag`
- Vấn đề: regex nhận cả `6-gzip` **không có ngoặc kép**, vì ngoặc là tùy chọn và hậu tố đứng trong. Hợp đồng chỉ nói `"n-gzip"` (cả `W/`). Không có hại: vẫn chỉ ra số `version`, và proxy luôn trả kèm ngoặc.
- Đề xuất: hoặc chỉ nhận hậu tố khi có ngoặc kép, hoặc thêm một ca đơn vị ghi rõ đây là cố ý. Không chặn.
- Trạng thái: Open

## 6. Điểm làm tốt
- `leaseEndDateOf` là một hàm thuần, dùng cho cả DTO lẫn B16. Không phải sửa `reservations.service.ts` của BE-B, đúng mục đích của quyết định 6.1.
- 0094 đóng an toàn ở mọi nhánh (không property, múi giờ sai), theo múi giờ của từng property. Test có ca hai múi giờ cực đông và cực tây cùng một giờ thật.
- Tự thấy ca test sẽ đỏ từ 20/11 vì đồng hồ thật của DB và sửa trước (dời sang 2037).

## Xác nhận (04/11)

- Đối tượng: `origin/v104/be-lease-prices` @ `99f9b4a2`. Nền: `v104/be-holds` @ `a91acb84` + merge `v104/dom-br-fixtures` @ `6bddbc29` (PR #41) – commit `231a2ee1`. Commit sửa: `99f9b4a2`. Bảng trả lời: `rounds/round-04/responses/BE-C-P4-11.md` (trên nhánh).
- **Thứ tự gộp bắt buộc:** PR-G chỉ gộp **sau** PR-F (`be-holds`) và PR #41, vì nhánh mang sẵn hai nền này.

| Thẻ | Kiểm | Kết luận |
|---|---|---|
| FB-R4-ARC-BE-C-P411-01 (Major) | Journal: 0092 idx 68, 0093 idx 69 `1792782175681`, **0094 idx 70 `1792782177681`**. `meta/0093_snapshot.json` trùng từng khóa với `a91acb84`. `meta/0094_snapshot.json`: id `6691350d-e953-46bf-bed3-9e94a364cfca`, prevId `96671c28-784b-486a-a34e-ed25cc3be90a`, nội dung (trừ id/prevId) **trùng** 0093. Chú thích SQL đã sửa ("the snapshot is 0093's") | **Closed** |
| FB-R4-ARC-BE-C-P411-02 (Minor) | Ghi chú cho QA (lựa chọn của ARC). Thêm: dịch vụ nay so `effectiveFrom` với **ngày muộn hơn** giữa ngày lịch và ngày kinh doanh của property (SEC P411-01), nên khoảng 00:00 → giờ chốt ngày trả 409 `effective`, không còn 500 của trigger. Có ca 01:00 giờ property. Đồng hồ staging lùi vẫn có thể ra 500, đã ghi chú | **Closed** |
| FB-R4-ARC-BE-C-P411-03 (Suggestion) | `parseEntityTag`: hậu tố `-gzip`/`-zstd`/`-br` chỉ nhận **trong ngoặc kép**; số trần `6` vẫn nhận; `6-gzip` không ngoặc → null. Có 2 ca đơn vị | **Closed** |

- ARC chạy lại trên `99f9b4a2`: `tsc` (api) đạt, `eslint services/api` 0 lỗi, `drizzle-kit generate` báo "No schema changes"; toàn bộ `@ottimo/api` trên PostgreSQL 17 riêng: **159 tệp đạt, 2 bỏ qua; 3976 ca đạt, 24 bỏ qua, 1 todo, 0 lỗi**.

**Phán quyết P4-11 trên `99f9b4a2`: ĐẠT.** Không còn thẻ ARC mở. Điều kiện: gộp sau PR-F và PR #41.
