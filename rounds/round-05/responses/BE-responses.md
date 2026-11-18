# Round 5 – Phản hồi thẻ của BE

ORC ghi theo báo cáo của từng lượt BE (BE không tự push lên `main`). Trạng thái "Done" nghĩa là đã có trên nhánh PR; thẻ đóng hẳn khi PR gộp với CI xanh.

## BE-A1 (07/11)

| ID | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-ARC-BE-A1-01 | Done | ARC đã kiểm (#127) |
| FB-R5-ARC-BE-V546-01 | Done | ARC đã kiểm (#113, đã gộp) |
| FB-R5-DOM-BE-PR106-01, FB-R5-SEC-BE-A1A-01, FB-R5-SEC-BE-A1B-01 | Done | #127 |
| FB-R5-SEC-BE-127-01 | Done | `6a670f3a` (#127) |
| FB-R5-ARC-BE-127-01 | Done | `ad507f94` (#127) |
| FB-R5-DOM-BE-PR114-01, FB-R5-ARC-BE-114-01, FB-R5-ARC-BE-114-02 | Done (lên ở lần push #114, sau khi #127 gộp) | `6a086d41`, `8a5f8145`, `9aafc549` |
| FB-R5-SEC-BE-113-01, FB-R5-ARC-BE-113-01 | Done ở PR test bổ sung (chưa mở) | `d574b518` |

## PR #180 – FB-INV-010 Đợt 1 (giá tháng công khai) – head b2d60596, CI xanh (gồm E2E smoke)
| Thẻ | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-ARC-BE-180-01 | Done | Câu trong mô tả `getPublicMonthlyRates` + changelog (d) + PR, `b2d60596` |
| FB-R5-ARC-BE-180-02 | Done | Release note trong changelog (e) + PR, không đổi code |
| FB-R5-ARC-BE-180-03 | Done | Gom theo slug, `slice(0,20)`, thêm 1 ca unit, `b2d60596` |
| FB-R5-ARC-BE-180-04 | Done | Changelog ghi ARC duyệt, `b2d60596` |
| FB-R5-ARC-BE-180-05 | Done | E2E smoke xanh ở `b2d60596` |

Câu hỏi DOM trong PR – ORC đóng theo quyết định INV 16/11: (1) không giảm kỳ hạn trên web (một giá tháng); (2) web không ghi +10 % khách NN – báo giá xử lý; (3) `rounding.monthly_rent` 10.000 vs BR-005 1.000 – kết quả như nhau với bảng giá hiện tại, để DOM rà ở Đợt 2.

## PR #190 – FB-INV-012 phiếu thanh toán tháng (Phản hồi & sửa 18/11)

Review: `rounds/round-05/reviews/ARC-on-be-pr-190.md`, `SEC-on-be-pr-190.md`; thẻ UXD FE-189-01/02 (phần dữ liệu BE). Mọi thay đổi chỉ thêm, OpenAPI vẫn 0.3.14-draft (mục "Sửa sau review 18/11").

| Thẻ | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-ARC-BE-190-01 | Done | **Đầu kỳ < cuối kỳ trước, không có `exception`** (cảnh báo hai bước):<br>- lần gửi đầu → 422 `OPENING_BELOW_PREVIOUS_CLOSING` (`meter`, `previousValue`, `previousReadingId`, `previousKind`);<br>- gửi lại với `acknowledgeLowerThanPrevious: true` → lưu, mọi vai FD+;<br>- `gap` âm lưu nguyên. Không thêm cột: suy ra từ `gap < 0`;<br>- audit có `acknowledgedLower: true`;<br>- nháp phiếu có cảnh báo cùng mã (`roomNo`, `meter`, `opening`, `previousClosing`, `readingId`). Phát hành phải `acknowledgeWarnings`.<br>**Cuối kỳ < đầu kỳ:** vẫn 422 `METER_LOWER_THAN_PREVIOUS`.<br>**Test:** 1.390 < 1.392 → 422, gửi lại với cờ (FD, có ảnh thật) → 201, `gap.electricity = -2`; nháp tháng 1 có cảnh báo; phát hành không xác nhận → 422 |
| FB-R5-ARC-BE-190-02 | Done | **Ứng viên thêm `rooms[]`:** `roomId`, `roomNo`, `opening`, `closing`, `nextOpening`.<br>- `closing` lấy theo cùng kiểm tra lúc phát hành (`compute().missing`), nên danh sách không báo "đủ" mà phát hành lại 422.<br>- `readingStatus` tổng hợp gồm cả đầu kỳ; giữ `roomNos`.<br>- Có thêm đơn `checked_out` trong `readingWindow.daysAfter` cần phiếu `final`.<br>**Test:** ngày 02/02, phiếu `final` thiếu cuối kỳ tháng 1 → `rooms` = opening `exception`, closing `missing`, nextOpening `missing`.<br>**Chưa có test** riêng cho đơn đã trả phòng (chỉ có code) |
| FB-R5-ARC-BE-190-03 | Done | **Đọc trễ:** FDL+ gửi `lateReason` (3–300 ký tự, qua `freeText`), tối đa `readingWindow.lateMaxDays` ngày sau cửa sổ (tùy chọn, 0–31, mặc định 10; hook kiểm biên).<br>- FD, hoặc FDL thiếu lý do → 422 `READING_OUT_OF_WINDOW`, kèm `lateUntil` và `lateNeedsRole: front_desk_lead`.<br>- Lưu vào cột mới `late_reason` và `late_approved_by` (trong 0099), có CHECK.<br>- Audit `meter_reading.late`; cảnh báo nháp `READING_LATE`.<br>**Test:** cuối kỳ tháng 1 đọc ngày 02/02: FD → 422 (`lateUntil` 2027-02-11), FDL không lý do → 422, FDL có lý do → 201; phiếu `final` có `READING_LATE`; `lateMaxDays: 40` → 422 |
| FB-R5-ARC-BE-190-04 | Done | Thêm 4 trường:<br>- `BillingPeriod.excludedLines` (chỉ nháp, không cộng vào tổng);<br>- `replacesCode`;<br>- `MeterReading.readByInitials` (chữ cái đầu, không trả họ tên);<br>- `onIssuedStatement` (cùng điều kiện với `voidMeterReading`).<br>Mỗi trường có test |
| FB-R5-ARC-BE-190-05 | Done | Thêm `payment_billing_period_fk` (`property_id`, `billing_period_id`) → `billing_period` ngay trong 0099. Mọi dòng cũ đều null. Test tĩnh khẳng định ALTER duy nhất trên `payment` là FK này |
| FB-R5-ARC-BE-190-06 | Done | Chọn kiểm lúc khởi động: `PaymentsModule.onApplicationBootstrap` dừng app nếu chưa có listener của BillingModule.<br>Worker không nạp Nest `PaymentsModule` và không đi đường đảo phiếu thu, nên không bị ảnh hưởng.<br>**Còn lại cho ARC:** chưa ghi vào `architecture.md` mục cổng module |
| FB-R5-ARC-BE-190-07 | Open (trước production) | OPS hoặc QA chạy 0099 trên bản sao staging. BE không đụng staging |
| FB-R5-ARC-BE-190-08 | Done | `totals.unreconciledVnd` (khoản thu `pending`/`disputed` chưa bị đảo) và `totals.disputed`. Không đổi máy trạng thái phiếu |
| FB-R5-ARC-BE-190-09 | Dời | Gom truy vấn khi có cơ sở thứ hai, theo đề xuất ARC |
| FB-R5-SEC-BE-190-01 | Done | **Mốc lưu giữ ảnh:** `AttachmentService.setMeterRetentionAnchor`, gọi từ `RegistrationService.onCheckedOut`, chạy cả khi đơn không có hồ sơ khai báo.<br>- Đặt mốc cho mọi ảnh `meter` gắn vào lần đọc của đơn (kể cả lần đọc đã hủy) và mọi ảnh `meter` upload theo đơn.<br>- Chỉ dời mốc về sau. J16 đã xóa `meter` theo `attachment_ops_retention_months`.<br>- `anchorMissing` đếm cả `meter`.<br>**Test:** trả phòng → mọi ảnh `meter` của đơn có mốc.<br>**Chưa làm:** đơn hủy/no-show có ảnh (đơn `in_house` không hủy được); test J16 xóa ở mốc + 12 tháng |
| FB-R5-SEC-BE-190-02 | Done | Thêm audit `billing_period.updated` khi điều chỉnh kỳ trước hoặc danh sách dòng dời thay đổi:<br>- `before`/`after` = `{priorAdjustmentVnd, excludedFolioLineCount}`;<br>- lý do điều chỉnh đi vào `reason`.<br>`issued` thêm 2 trường này vào `after`; allowlist cập nhật.<br>**Test:** 4 dòng nhật ký (dời, đưa lại, đặt −10.000, bỏ) |
| FB-R5-SEC-BE-190-03 | Done | `getBillingPeriodPrint` trả **allowlist** (schema `BillingPeriodPrint` riêng): không có ghi chú, lý do, folio, giá chụp, thao tác.<br>**Test:** `not.toMatch(/"note"\|[rR]eason\|folioId\|…/)` |
| FB-R5-SEC-BE-190-04 | Done | Test với tài khoản nhận giả (`0000000000`, BIN công khai):<br>- nội dung chuyển khoản chỉ có mã phiếu, không có tên khách;<br>- 4 số cuối; số đầy đủ chỉ nằm trong payload;<br>- số tiền QR = số dư (9.502.000; phiếu tháng 11 2.113.000);<br>- số dư 0 → `vietqr: null` |
| FB-R5-SEC-BE-190-05 | Dời | Chờ `attachment` có khóa duy nhất `(property_id, id)` |
| FB-R5-SEC-BE-190-06 | Done | Hủy phiếu đã phát hành: kiểm quyền FDL+ trước, nên FD nhận 403 trước 409. Có test |
| FB-R5-UXD-FE-189-01 (phần BE) | Done | Dòng điện, nước có sẵn `netVnd` (chưa VAT) và `vatVnd` riêng; `totals.netVnd` là Subtotal, `totals.vatVnd` là dòng VAT duy nhất. Trang in giữ đủ các trường này. **Test:** điện 568.000 + VAT 45.440; tổng 9.453.000 / 49.690 / −690 / 9.502.000 |
| FB-R5-UXD-FE-189-02 (phần BE) | Done | Mỗi dòng có `periodMonth` (`YYYY-MM`):<br>- thuê: kỳ thuê;<br>- điện, nước: kỳ điện nước (M−1);<br>- dịch vụ: ngày dịch vụ;<br>- làm tròn, điều chỉnh: null.<br>Phiếu và trang in đã có sẵn `rentPeriod`, `utilityPeriod`, `servicePeriod`. **Test:** phiếu tháng 12 → thuê 2026-12, điện/nước/dịch vụ 2026-11 |

**Phát hiện thêm khi viết test SEC BE-190-01** (BE tự sửa, báo ARC/SEC):
- `uploadAttachment` vẫn trả 422 `NOT_IN_LIST` cho `purpose=meter`. Danh sách `PURPOSES_ACCEPTED_NOW` còn ghi chú "chờ bản ghi R3", nên trước bản sửa này **không ai tải được ảnh đồng hồ**.
- Đã thêm `meter` vào danh sách và sửa test cũ trong `files-attachments`.
- MT vẫn tải được ảnh `meter` (quyền upload cũ), nhưng không ghi được lần đọc. Ảnh không gắn vào lần đọc nào thì J16 xóa sau `attachment_unbound_days`.

Ghi chú cho DOM (ARC BE-190-03): đầu kỳ đọc trễ thì phần dùng từ ngày 01 tới ngày đọc nằm trong `gap`, không tính cho khách. Đây là cách INV chọn.
