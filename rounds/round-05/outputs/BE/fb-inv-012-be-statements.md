# BE – FB-INV-012: phiếu thanh toán tháng của khách dài hạn (máy chủ)

- Người làm: BE | Round 5 – Bước: **Sản xuất** | 17/11/2026
- Nhánh `r5-fb012-be-statements` cắt từ `origin/main` `f28bd8e8`.
- Căn cứ:
  - hợp đồng `rounds/round-05/fb-inv-012/contract.md` (phần BE);
  - `rounds/round-05/fb-inv-012/DOM-rules.md` (BR-LS-01..16);
  - quyết định INV 17/11 trong decision-log;
  - thay đổi INV về chỉ số đầu kỳ, nhận qua ORC trong lúc làm.

## 1. Đã làm

| Việc | Cách làm |
|---|---|
| Migration `0099_monthly_statement_fb_inv_012.sql` | **Chỉ thêm.** 3 bảng mới: `meter_reading`, `billing_period`, `billing_period_line`, đều có RLS FORCE và policy `tenant_isolation`. Thêm cột `payment.billing_period_id` (cho phép null, không FK). Thêm 3 khóa `config_parameter_def` với `ON CONFLICT DO NOTHING`. Không UPDATE, DELETE hay DROP. Snapshot `0099_snapshot.json`; `drizzle-kit generate` không sinh thay đổi |
| Tham số chỉ OWN sửa | Mặc định theo INV 17/11:<br>- `utility_unit_price` = 4.000 đ/kWh và 25.000 đ/m³ (giá trước VAT);<br>- `utility_vat_rate` = điện 8 %, nước 5 %;<br>- `monthly_statement_rules` = trả trước, hạn ngày 5, làm tròn xuống 1.000 đ, tháng lẻ đầu thu lúc nhận phòng, cửa sổ chốt số từ ngày cuối tháng đến ngày 1.<br>Hook kiểm biên: ngoài biên → 422 `PARAM_OUT_OF_RANGE` / `VALIDATION_FAILED`; MGR → 403. VAT 10 % từ 01/01/2027 **không seed sẵn**: OWN tự lên lịch bằng "Hiệu lực từ" (đã có test) |
| Chỉ số đồng hồ (3 API) | Các loại chỉ số: `checkin`, `period_start`, `room_change_in`, `period_end`, `room_change_out`, `checkout`.<br>- **Ảnh:** bắt buộc. FD gửi ngoại lệ đồng hồ (thay đồng hồ, quay vòng) hoặc miễn ảnh → 403; FDL+ lưu thẳng.<br>- **Số nước:** 1 số lẻ, phần dư bỏ (38,67 → 38,6).<br>- **Ngày ghi:** ngoài cửa sổ → 422 `READING_OUT_OF_WINDOW` (kèm `windowFrom`, `windowTo`).<br>- **Số nhỏ hơn số trước:** → 422 `METER_LOWER_THAN_PREVIOUS`.<br>- **Hủy:** chỉ số đã nằm trên phiếu đã phát hành → 409 `READING_ON_ISSUED_STATEMENT` |
| **Chỉ số đầu kỳ (INV 17/11, bổ sung)** | Đầu mỗi kỳ, lễ tân **phải nhập** chỉ số đầu kỳ (`period_start`). API trả `previousClosing` (số cuối kỳ trước của phòng, ở bất kỳ booking nào) **chỉ để tham khảo**.<br>- **Chênh lệch:** `gap = đầu kỳ − cuối kỳ trước`, lưu ở `electricity_gap` / `water_gap` cho OWN xem, **không tính tiền**.<br>- **Tiêu thụ tính tiền:** `cuối kỳ − đầu kỳ`.<br>- **Đầu kỳ < cuối kỳ trước:** → 422 `METER_LOWER_THAN_PREVIOUS` (lỗi kiểm tra, không lưu)<br>Kỳ của tháng nhận phòng dùng chỉ số nhận phòng; ghi `period_start` cho tháng đó → 422 `NOT_ALLOWED` |
| Phiếu tháng (9 API) | `candidates`, `create`, `list`, `get` (ETag), `update` (If-Match: dời dòng dịch vụ, điều chỉnh kỳ trước chỉ FDL+), `issue` (If-Match + Idempotency-Key), `void`, `payments`, `print`.<br>- **Nháp:** tính lại mỗi lần đọc.<br>- **Phát hành:** ghi dòng folio (`monthly_rent`, `electricity`, `water`, `statement_rounding`), chụp lại giá và VAT đang áp dụng, cấp mã `TT-<yymm>-<phòng>[-R<n>]`.<br>- **Quá hạn:** tính lúc đọc (`due_today`, `overdue`, `alert` từ 3 ngày, `escalate` từ 10 ngày).<br>- **Kỳ cuối:** tiền thuê theo hợp đồng trừ tiền thuê đã lập phiếu |
| Folio | Dịch vụ trong kỳ lấy giá trị ròng sau FOC và giảm giá. Mỗi dòng folio chỉ nằm trên một phiếu còn hiệu lực (khóa duy nhất `billing_period_line_live_folio_line_key`). Dòng do phiếu ghi không giảm tay được. Hủy phiếu thì đảo các dòng đã ghi |
| Thanh toán | Ghi thu qua `PaymentService.recordInTx`, gắn `billing_period_id`. Thu quá số còn nợ → 422 `AMOUNT_OVER_BALANCE`. Trạng thái `partially_paid` / `paid` cập nhật khi ghi thu và khi đảo phiếu thu (listener) |
| Trang in | Chỉ phiếu đã phát hành. Có VietQR theo tài khoản nhận đang hiệu lực (không có tài khoản thì `null`); số tài khoản chỉ hiện 4 số cuối, người lập chỉ hiện chữ tắt. Có ghi audit `billing_period.printed`. Danh sách chỉ hiện tên khách dạng ngắn ("N. Minh") |
| Quyền | **A121** (OWN/MGR/FDL/FD), **A122** (FDL+), **A58** (ghi thu).<br>**A123 mới** cho 3 API chỉ số; ô A88 giữ nguyên, xem mục 2.<br>HK, MT, SAL, CTV → 403 |
| OpenAPI | 0.3.14-draft, tag `billing`: 12 operation, 11 mã lỗi. Đã sinh lại meta, schemas và api-client. Redocly hợp lệ; `gen_traceability --strict` và `gen_rbac_cases --check` đều OK |

## 2. Lệch so với hợp đồng (có chủ đích)

1. **Theo INV 17/11 (INV thắng hợp đồng):**
   - tháng lẻ đầu thu lúc nhận phòng;
   - bỏ phí dịch vụ 200.000 đ/tháng;
   - VAT 8 % điện (10 % từ 2027), 5 % nước;
   - giá trước VAT 4.000 đ/kWh và 25.000 đ/m³;
   - chỉ số đầu kỳ nhập tay, phần chênh lệch không tính tiền (mục 1).
2. **A123 thay A88 trên 3 API chỉ số.** Hợp đồng ghi A88 nhưng không mở cho MT. Vì vậy `gen_rbac_cases --check` báo lệch và CI đỏ. Tách mã mới, không sửa ô cũ của A88.
3. **A89 làm đơn giản:** không có hộp duyệt. FDL+ lưu thẳng ngoại lệ, ghi `exception_approved_by`.
4. Không làm `PRICE_CHANGED_SINCE_DRAFT`. Giá và VAT lấy theo ngày phát hành, và phát hành thì tính lại.
5. `RENT_ALREADY_POSTED` chỉ nhận dòng `monthly_rent`. Tiền thuê đang ghi tay dạng `service_fee` thì không phát hiện được.
6. **Cách ghi dòng phiếu:**
   - điện hoặc nước tiêu thụ bằng 0 thì không có dòng;
   - dòng tiền thuê đủ tháng ghi 1 × "tháng";
   - điều chỉnh kỳ trước luôn ghi nhóm `other`.
7. **Trường thêm (chỉ thêm, FE không bắt buộc dùng):**
   - phiếu có thêm `reservationCode`, `missingReadings`;
   - trạng thái chỉ số có thêm giá trị `not_needed`;
   - API ghi thu trả `{billingPeriod, payment}`;
   - `kind` khi tạo phiếu là tùy chọn (máy chủ tự suy).
8. `property.email` trả `null`, vì chưa có cột này.

## 3. Test

- **`test/fb-inv-012-statement-math.test.ts`** (20 test, không cần DB) gồm:
  - số ví dụ của DOM: 613.440 đ / 89.250 đ / 3.113.000 đ / 5.387.000 đ / 9.502.690 → 9.502.000 đ;
  - thay đồng hồ, quay vòng;
  - kỳ, cửa sổ chốt số, mã phiếu;
  - mức quá hạn 05 / 06 / 08 / 15;
  - hook tham số;
  - kiểm tĩnh migration chỉ thêm.
- **`test/integration/fb-inv-012-statements.test.ts`** (16 test, PostgreSQL thật, qua HTTP) gồm:
  - luồng đủ từ 20/11/2026 đến 20/02/2027;
  - idempotency, If-Match 412, hai yêu cầu phát hành cùng lúc;
  - thu tiền, đảo phiếu thu;
  - hủy phiếu và lập phiếu thay `-R1`;
  - **2 trường hợp chênh lệch của INV:** đầu kỳ 1.390 < 1.392 → 422; đầu kỳ 1.395 → gap 3, tháng 1 tính 105 kWh;
  - hủy chỉ số → thiếu chỉ số khi phát hành;
  - kỳ cuối;
  - quyền 8 vai, RLS, khóa duy nhất;
  - luật trả sau + hạn ngày 10 + VAT 10 % từ 2027.
- **Toàn bộ api:** 225 file, 5.282 test xanh. format, eslint, typecheck, drizzle, gen_strings không lệch.
- **Chưa chạy:** migration trên bản sao dữ liệu staging (không đụng staging). Chỉ có kiểm tĩnh.

## 4. Việc sau

- **SEC:** mốc lưu giữ ảnh đồng hồ.
- **ARC:** FK cho `payment.billing_period_id`.
- **Tính lại trạng thái thu tiền:** hiện chỉ chạy khi ghi thu và khi đảo phiếu thu, chưa chạy khi đối soát từ chối.
- **Worker:** listener phải được nối dây nếu worker ghi thu.
- **Mở cho MT:** khi mở, gộp A123 vào A88.

## 5. Phản hồi review 18/11 (ARC, SEC, UXD)

Chi tiết từng thẻ ở `rounds/round-05/responses/BE-responses.md` (mục PR #190).

- **Chỉ số đồng hồ:**
  - đầu kỳ < cuối kỳ trước là cảnh báo hai bước (`OPENING_BELOW_PREVIOUS_CLOSING` + `acknowledgeLowerThanPrevious`), nháp có cảnh báo cùng mã;
  - đọc trễ: FDL+ gửi `lateReason`, tối đa `lateMaxDays` (mặc định 10), cảnh báo `READING_LATE`;
  - lần đọc thêm `readByInitials` và `onIssuedStatement`.
- **Danh sách ứng viên:** thêm `rooms[]` (đầu kỳ, cuối kỳ, đầu kỳ tháng kế) và đơn đã trả phòng cần phiếu `final`.
- **Phiếu tháng:**
  - thêm `excludedLines`, `replacesCode`, `unreconciledVnd`, `disputed`;
  - mỗi dòng có `periodMonth`;
  - trang in trả theo allowlist, có tiền chưa VAT và tiền VAT riêng.
- **Nhật ký:** `billing_period.updated` ghi trước/sau; `issued` ghi khoản điều chỉnh và số dòng dời.
- **Ảnh đồng hồ:**
  - đặt mốc lưu giữ lúc trả phòng; `anchorMissing` đếm cả `meter`;
  - mở upload `purpose=meter` (trước đây bị chặn).
- **Migration 0099** (chưa merge nên sửa tại chỗ):
  - thêm cột `late_reason`, `late_approved_by` cho `meter_reading`;
  - thêm FK `payment_billing_period_fk`;
  - mặc định quy tắc có thêm `lateMaxDays: 10`.
- **Khởi động:** `PaymentsModule` dừng khi thiếu listener của BillingModule.
- **Test:** 17 test tích hợp FB-INV-012 và toàn bộ api 5.283 test đều xanh.
