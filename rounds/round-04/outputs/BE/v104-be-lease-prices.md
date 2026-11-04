# BE-C – P4-11 `v104/be-lease-prices` (Round 4 – v1.0.4 – Sản xuất)

- Người làm: BE (làn BE-C) · Ngày: 04/11/2026
- Nhánh: `v104/be-lease-prices`, cắt từ `origin/main`, rebase lên `origin/v104/dom-br-fixtures` (DOM P4-20, `ceb05937`), rồi **gộp `origin/lp-v2-main`** (= `main@L`) để làm giai đoạn B. Chưa PR, chưa gộp `main`.
- Căn cứ: `plan-v1.0.4.md` mục 2.2, 4, 6.1, dòng P4-11, brief mục 8; SEC ED-02 (`reviews/SEC-on-plan-v1.0.4.md` mục 3); DOM P4-20 (`outputs/DOM/v1.0.4-p4-20-br-fixtures.md`); thẻ FB-R4-BE-LPV2M-02 (`reviews/BE-on-lp-v2-main.md` trên `lp-v2-main`).

## 1. Đã làm (theo AC)

| AC | Trạng thái | Commit |
|---|---|---|
| `leaseEndDate` (ARC 6.1): check-in ghi khóa vào `manual_long_stay`, DTO đọc, B16 chọn BR-313/BR-428 | Xong | `44ff4673` |
| ETag: `If-Match` nhận `"n-gzip"`, `"n-zstd"`, `"n-br"` (kể cả `W/`) | Xong | `44ff4673` |
| `byCalc` gộp `row.params` lên DS-E; đổi tên test `a7-lease-nights` theo BR-210-01 | Xong | `44ff4673` |
| Dòng bảng giá 01/11 (FB-R4-QA-DOM-PR25-01): 9 dòng `calcPending` → `calc`, chạy qua động cơ giá | Xong (trừ dòng giá web, xem 4) | `866f14c6` |
| Số hoa hồng cũ ở 5 nơi: gắn nhãn "ví dụ theo tỷ lệ cũ trước 01/11 – hết hiệu lực" | Xong, không đổi giá trị, không ghi số mới | `866f14c6` |
| BUG-R4-015: hủy dòng giá sớm nhất của căn → 409 `first_price` | Xong | `14a48e38` |
| FB-R4-BE-LPV2M-02: hủy giá hẹn xóa bộ đệm giá ước tính LP-v2 | Xong | `14a48e38` |
| ED-02: migration **0094** trigger `BEFORE DELETE ON room_list_price` | Xong | commit 0094 (xem mục 7) |

### 1.1 `leaseEndDate`
- `reservations/public/lease-end.ts` (mới): `leaseEndDateOf(row)`. Chỉ có giá trị với HĐ tháng nhập tay (`stay_type = 'long'`, `external_contract`, có `manual_long_stay`). Thứ tự đọc:
  1. khóa đã đóng băng lúc check-in;
  2. nếu chưa check-in thì `departure_date`;
  3. nếu đã check-in mà không có khóa (đơn check-in trước v1.0.4) thì `booked_departure_date`, không có thì `departure_date`.
- Tên khóa trong jsonb là `lease_end_date` (snake_case như các khóa khác của `manual_long_stay`). Đây là lệch chữ so với ARC 6.1 (`leaseEndDate`). Hợp đồng API vẫn dùng `leaseEndDate`. Test khẳng định tên khóa jsonb không lộ ra DTO.
- `checkin.service.ts`:
  - check-in ghi khóa = `departure_date` lúc nhận phòng;
  - hoàn tác check-in (B17) xóa khóa.
- `stay-rules.ts` `earlyDepartureRuleOf`: ngày trả mới < `leaseEndDate` → **BR-313** (cọc theo HĐ, không hoàn, không phí); ngược lại → **BR-428**. Đơn ngắn ngày luôn BR-428.
- `stay.service.ts` (B16):
  - lý do ghi `BR-313 lease early end – deposit per lease` hoặc `BR-428 notice Nd`;
  - audit `after` thêm `earlyDepartureRule`, `leaseEndDate` (đã thêm vào allowlist `frontdesk/audit-entities.ts`).
- `reservation-store.ts` (không thuộc danh sách tệp nóng, chỉ thêm): đọc thêm cột `booked_departure_date`.
- Giới hạn đã biết (đơn đã đổi ngày trước khi check-in): thực tế rỗng. B7 `move` từ chối đổi ngày của HĐ nhập tay (422), PATCH không có trường ngày. Test tích hợp khẳng định điều này.

### 1.2 Bảng giá 01/11 và nhãn số cũ
- `br-examples.json` (tệp DOM, sửa theo bàn giao của DOM/ORC):
  - BR-101-12, 103-04, 104-10, 104-11, 107-07, 110-18, 110-19, 110-21, 110-22: `calcPending` → `calc`, bỏ `pendingFix`;
  - **BR-108-03** thêm `params` lịch 01/11 (không phụ thu, `los_discount: []`). Nếu không thêm, bậc giảm 15% của DS-E cho 20.536.000 thay vì 23.200.000. → **Thẻ cho DOM xác nhận** (mục 6).
- `reservations-pricing.test.ts`:
  - `pp(e)`, `Pe`, `roomOf` dựng tham số DS-E + `row.params`;
  - khối mới chạy các `calc` `stayKindByNights`, `extraPersonFeeChange`, `nightRates` qua `PricingService`/`calendarRate`;
  - có test canh: mỗi dòng trong danh sách QA phải có `calc`, có `params`, có khối chạy lại. Ba `calc` giá web (`fromPrice`, `webEstimate`, `parityFloor`) để `it.todo` (mục 4).
- Nhãn "ví dụ theo tỷ lệ cũ ESC-005 (trước 01/11 – hết hiệu lực); tỷ lệ từ 01/11 theo bảng nội bộ INV, không ghi ở kho mã (FB-R4-SEC-BE-01)" đặt ở:
  - `smoke-manifest.json` TC-L5-001 (tiêu đề chỉ để hiển thị trong `pending.spec.ts`);
  - `ds-e.json` (`note` của `short_stay_commission_pct`, `leaseTermsNote`);
  - `ds-0.json` (`leasesNote`);
  - `production-defaults.ts` (chú thích);
  - `validate-fixtures.mjs` `LEASE_TIERS` (chú thích).

  **Không đổi giá trị nào.** Đổi giá trị sẽ làm đỏ test vàng và bootstrap. Bỏ hẳn số cũ khỏi mã là việc của P4-15/H2.

### 1.3 BUG-R4-015 + FB-R4-BE-LPV2M-02
- `rooms.service.cancelScheduledListPrice`: sau `effective` và `only_price`, nếu ngày hủy = `min(effective_from)` của căn → 409 `INVALID_TRANSITION` `currentState: first_price`. Khóa dòng `room` FOR UPDATE nên không đua.
- `platform.controller.cancelScheduledRoomListPrice`: `hooks.changed(propertyId, 'room')` sau khi commit, giống `updateRoom`.
- Test trong `rooms-scheduled-prices-v101.test.ts`:
  - ca 502: bước 1–4 của bug-list → 409 `first_price` cho OWN và MGR, không xóa, version giữ nguyên; dòng sau vẫn hủy được;
  - ca LPV2M-02: hủy thành công thì gọi `PriceEstimateService.invalidate`, hủy bị từ chối thì không gọi.
- Cùng tệp: các dòng bị hủy dời sang **2037**, cùng thứ trong tuần. Lý do: sau khi có 0094, dòng bị xóa phải là tương lai theo **đồng hồ thật của DB**. Nếu không dời, test sẽ đỏ từ 20/11/2026. Đây là điều kiện (e) của SEC. Tenant của test được nới `booking_window_days` để báo giá được đêm năm 2037.

## 2. Tệp tạo/sửa
- Mới:
  - `services/api/src/modules/reservations/public/lease-end.ts`
  - `services/api/test/v104-lease-units.test.ts`
  - `services/api/test/integration/v104-lease-end.test.ts`
  - `services/api/src/db/migrations/0094_room_list_price_append_only.sql`
  - `services/api/src/db/migrations/meta/0094_snapshot.json`
  - `services/api/test/integration/room-list-price-append-only.test.ts`
- Sửa:
  - `services/api/src/modules/frontdesk/{public/stay-rules.ts, internal/stay.service.ts, internal/checkin.service.ts, audit-entities.ts}`
  - `services/api/src/modules/reservations/internal/{reservation-dto.ts, reservation-store.ts}`
  - `services/api/src/shared/http/precondition.ts`
  - `services/api/src/modules/platform/internal/{rooms.service.ts, platform.controller.ts}`
  - `services/api/src/admin/production-defaults.ts`
  - `services/api/src/db/migrations/meta/_journal.json`
  - `services/api/test/{reservations-pricing.test.ts, integration/a7-lease-nights.test.ts, integration/rooms-scheduled-prices-v101.test.ts}`
  - `tests/fixtures/br-examples.json`, `tests/fixtures/seed/{ds-e,ds-0}.json`, `tests/e2e/smoke-manifest.json`, `tests/tools/validate-fixtures.mjs`
- **Không** sửa `openapi.yaml` hay strings (mục 5).

## 3. Kiểm thử
- Đơn vị:
  - `v104-lease-units` 32/32;
  - `reservations-pricing` 82 đạt + 1 todo;
  - `module-boundaries`, `migrations-journal` đạt.
- Tích hợp (PG 17 riêng, `ottimo_app`):
  - `v104-lease-end` 7/7;
  - `a7-lease-nights` đạt;
  - `rooms-scheduled-prices-v101` 5/5;
  - `room-list-price-append-only` 5/5;
  - `bug-r4-004-public-room-type`, `seed` đạt.
- Toàn bộ `@ottimo/api` trước khi gộp `lp-v2-main`: 152 tệp, 3830 đạt, 24 bỏ qua, 0 lỗi. Sau khi gộp `lp-v2-main` và thêm 0094: 157 tệp, 3928 đạt, 24 bỏ qua, 1 todo, 0 lỗi.
- `validate-fixtures.mjs`: OK, 0 lỗi, 1 cảnh báo có sẵn (ds-0 OTM-0108).
- eslint, prettier, `tsc --noEmit` sạch.

## 4. Chưa làm / chuyển
- Dòng giá web (BR-114-01, BR-115-01…08, BR-116-01, các `calc` `fromPrice`/`webEstimate`/`parityFloor`): mã giá công khai LP-v2 đã có trên nhánh sau khi gộp `main@L`, nhưng chưa nối vào `reservations-pricing.test.ts`. Hiện để `it.todo`. Đề xuất làm ở lượt Phản hồi & sửa của P4-11, hoặc QA chạy oracle qua API `public-rate`.
- Chữ Desk cho `first_price` (FE-A, P4-31) và mock `admin-web`: không thuộc BE.

## 5. Đề xuất hợp đồng cho ARC (P4-00, OpenAPI 0.3.12)
1. `Reservation.manualLongStay.leaseEndDate`:
   - kiểu: `LocalDate`, chỉ đọc;
   - `x-visible-to`: như `manualLongStay`;
   - mô tả: "Ngày hết HĐ, đóng băng lúc nhận phòng. Trước nhận phòng = `departureDate`. Gia hạn B13 không đổi ngày này. B16 chọn BR-313 khi ngày trả mới < `leaseEndDate`, ngược lại BR-428."

   Serializer bỏ trường chưa khai báo, nên trước 0.3.12 client chưa thấy trường này.
2. "Khóa lạc quan": máy chủ nhận `If-Match` có hậu tố `-gzip`, `-zstd`, `-br` (V3-09). Client nên dùng `version` trong thân.
3. `cancelScheduledRoomListPrice` 409: thêm `currentState: first_price` (dòng sớm nhất của căn còn đang hẹn).
4. `AuditEvent` của `reservation.early_departure`: `after` có thêm `earlyDepartureRule` (`BR-313` | `BR-428`) và `leaseEndDate` (chỉ với HĐ tháng nhập tay).

## 6. Giả định và thẻ gửi vai khác
- **Gửi DOM (Minor):** BR-108-03 cần `params` lịch 01/11 (`weekend_uplift_pct 0`, `weekend_nights [FRI,SAT]`, `special_uplift_pct 0`, `los_discount []`) để ra đúng 23.200.000. DOM xác nhận đây là ý của dòng này, hoặc sửa `expected`.
- Khóa jsonb `lease_end_date` (snake_case). Lý do ở 1.1.
- Đã sửa thêm `reservation-store.ts` và `frontdesk/audit-entities.ts`. Hai tệp này không có trong danh sách tệp của BE-C nhưng cũng không thuộc làn khác. Chỉ thêm, không đổi hành vi.
- Câu cho runbook (ARC 6.1): đếm đơn HĐ tháng đã nhận phòng trước v1.0.4, chưa có khóa:
  ```sql
  SELECT count(*) FROM reservation
   WHERE external_contract AND stay_type = 'long' AND status = 'in_house'
     AND actual_checkin_at IS NOT NULL AND manual_long_stay IS NOT NULL
     AND NOT (manual_long_stay ? 'lease_end_date');
  ```
  Các đơn này đọc ngày theo `booked_departure_date`. Dự kiến `departure_date ≠ booked_departure_date` trước check-in = 0, vì B7 và PATCH không đổi được ngày.

## 7. Migration 0094 (SEC ED-02)
- `BEFORE DELETE ... FOR EACH ROW`. Hàm `SECURITY INVOKER`, `SET search_path = pg_catalog, pg_temp`. Đọc tz bằng `public.property` theo `OLD.property_id`.
- Từ chối khi:
  - `OLD.effective_from <= (now() AT TIME ZONE tz)::date`;
  - không có property (đóng an toàn);
  - tz không đọc được (đóng an toàn).
- Lỗi: thông báo cố định `room_list_price: applied price row is append-only`, `check_violation`. App không ánh xạ mã này nên trả 500 chung.
- Không chặn dòng đầu/dòng cuối ở DB: lớp dịch vụ đã làm (409 `only_price`/`first_price`).
- Journal:
  - (Phản hồi & sửa, FB-R4-ARC-BE-C-P411-01) idx **70** sau 0093 (idx 69, PR-F), `when` `1792782177681`; snapshot 0094 = **bản chép snapshot 0093** (giữ id `6691350d…`, `prevId` `96671c28…`). `drizzle-kit generate`: "No schema changes". Chi tiết: `rounds/round-04/responses/BE-C-P4-11.md`.
- Test:
  - (a) xóa dòng quá khứ → lỗi;
  - (b) xóa dòng ngày mai → được;
  - (c) cùng một ngày: property Kiritimati (đã qua 00:00) bị chặn, property Pago Pago được. Trigger dùng tz của từng property;
  - tz sai → từ chối;
  - (d) `tgenabled = 'O'`, `prosecdef = false`, `proconfig` cố định;
  - (e) test dịch vụ BUG-R4-015 dùng ngày tương lai theo cả hai đồng hồ.
- Câu cho runbook (sửa theo FB-R4-SEC-BE-P411-01): app cũ `sha-da6d6f3dc22b` chỉ xóa dòng có ngày sau **ngày kinh doanh**, nên quay lui app mà không lùi DB vẫn chạy, trừ khung 00:00 → giờ đổi ngày kinh doanh: hủy giá của ngày lịch hôm nay bị trigger chặn (500 chung, không mất dữ liệu). v1.0.4 kiểm ngày lịch ở dịch vụ trước → 409 `effective`. `TRUNCATE` không bắn trigger dòng. Muốn xóa dòng đã áp dụng thì làm bằng migration `ALTER TABLE room_list_price DISABLE TRIGGER room_list_price_append_only` (chủ bảng), có SEC review.
- OPS (tùy chọn, P4-04): câu READ ONLY kiểm `tgenabled = 'O'` cho `room_list_price_append_only`.

## 8. Trả lời OPS Q3 (0096 và quay lui v1.0.3)
- Hiện trạng:
  - Trong `config_parameter_def`, các khóa `short_stay_commission_pct`, `lease_terms`, `commission_payable_day`, `commission_pay_by_day` **đã có `default_value` NULL từ 0002**. Không migration nào đặt giá trị cho chúng.
  - Giá trị production đến từ dòng `config_parameter` do bootstrap chèn (`production-defaults.ts`).
  - Vì vậy 0096 "bỏ `default_value`" là **no-op** ở DB: quay lui v1.0.3 an toàn nhưng 0096 vô ích. **Đề xuất bỏ 0096**, dồn số.
- Rủi ro thật nằm ở chỗ khác: nếu v1.0.4/H2 **xóa hoặc kết thúc dòng `config_parameter`** của khóa hoa hồng, v1.0.3 sẽ gặp lỗi:
  - `ParameterService.get` ném `ParameterMissingError`;
  - lỗi không được bắt ở `folio.service.ts` (tính lại hoa hồng: đơn không có `commissionRatePctSnapshot`, người chốt là SAL/CTV) và ở `quote-pricing.ts` (`p('short_stay_commission_pct')`);
  - kết quả: **500** (vỡ, đóng an toàn), **không ra số sai**. Nhưng báo giá và thanh toán liên quan dừng, nên quay lui **không an toàn**.
- Cách tương thích ngược: **giữ khóa, đặt giá trị `{}`**, hoặc `{"collaborator":null,"staff":null}`, bằng dữ liệu hoặc qua Desk. Không xóa dòng.
  - v1.0.3: `commissionPctFor` trả null nên không tính hoa hồng và không vỡ. Khi tính lại, v1.0.3 bỏ các hoa hồng dự kiến không có snapshot (audit `commission.voided`).
  - v1.0.4: đọc `{}` là "chưa có tỷ lệ".

## 9. ESC
Không có ESC mới.
