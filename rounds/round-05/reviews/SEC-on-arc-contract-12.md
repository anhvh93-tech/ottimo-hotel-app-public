# SEC review – ARC contract §12 (FB-INV-012 gói sửa trước ra mắt v1.0.7)

- Người review: SEC | Round 5 – Bước: Review (thiết kế, trước code) | Ngày: 18/11/2026
- Đối tượng: `rounds/round-05/fb-inv-012/contract.md` §12 (commit a27bb465), trọng tâm §12.12
- Căn cứ đọc thêm: decision-log (INV 18/11 "sửa nhỏ trước ra mắt"), `SEC-on-be-d2-pr-148.md` (148-01), `SEC-on-be-pr-190.md` (190-07/08), `rbac-matrix.md` ghi chú 48 (A120), mã `reservations.service.ts` (`closerUserId` ở `createReservation`, `closerKind`), `openapi.yaml` (`PaymentCreate.method` → `$ref PaymentMethod`).
- Không ghi số tiền hoa hồng, tỷ lệ thưởng vào tài liệu này.

## Kết luận

**Đạt có điều kiện.** BE code tiếp được ngay. Có 3 thẻ Major, phải có trong PR BE `r5-fb012-golive-be` trước khi gộp. Mỗi thẻ là thay đổi nhỏ, chỉ thêm. 6 thẻ Minor làm sau, không chặn v1.0.7.

## Trả lời 7 điểm ở §12.12

| # | Điểm | Kết quả | Ghi chú |
|---|---|---|---|
| 1 | Nhận phòng bù, đơn lùi ngày (A127). OWN có phải duyệt khi MGR là người hưởng lợi? | **Không cần OWN duyệt trước**, nhưng phải chặn đường hưởng lợi (thẻ 01) | Cơ sở 10 căn, khoảng 6 đơn cần nhập bù, INV đã cho MGR/OWN làm. Duyệt trước chỉ làm chậm ra mắt. Đường hưởng lợi thật hôm nay là **hoa hồng**: `createReservation` nhận `closerUserId`, và `closerKind` cho cả OWN, MGR, SAL, CTV làm người chốt. Đơn nhập bù cho tiền thuê đã trả ngoài Desk sẽ sinh hoa hồng lần hai. Thưởng A120 chưa có mã (chỉ có trong `generated/`), nên chỉ cần ràng buộc khi PR-M lên (thẻ 05) |
| 2 | "Đã thu ngoài Desk" (A128). Cần trần hay OWN duyệt? | **Cần giới hạn phạm vi cho MGR** (thẻ 02). Không cần bước duyệt | Ghép A127 với A128, một MGR tạo được đêm phòng và doanh thu "đã thu" mà không có đồng nào vào quầy. Thông báo OWN chỉ phát hiện sau khi việc đã xảy ra. Cách nhỏ nhất mà vẫn giữ quyết định INV (MGR+ cho khách đang ở): MGR chỉ ghi được trên **phiếu tháng nhận phòng của đơn nhận phòng bù**, cho **phần tiền thuê**, với tiền nhận **trước ngày nhập bù**. Mọi trường hợp khác chỉ OWN làm (giống tinh thần 148-01: ngoại lệ phải hẹp). Thiếu `x-requires-trusted-device` ở operation này |
| 3 | `readOn` lùi ngày cho chỉ số nhận phòng bù | **Chấp nhận** | Ngoại lệ hẹp, đủ điều kiện: chỉ `checkin` của đơn có `checkin_backdated_on`, sớm nhất ngày đến − 1, luôn `late`, FDL+, có lý do, cảnh báo trên nháp, hạn + 11 ngày. Đọc bù 12.5 không lùi ngày và bắt buộc ảnh: đạt. Còn một chốt nhỏ về thứ tự đọc (thẻ 06) |
| 4 | Miễn trừ hotline khỏi `SENSITIVE_DATA_DETECTED`; địa chỉ chỉ là văn bản thuần | **Chấp nhận**, có thẻ Minor 04 | Chỉ OWN sửa, kiểm dạng số, có audit trước/sau. Hotline in trên phiếu và trang công khai, nên đổi hotline cũng là đường lừa khách gọi số giả. Nên thêm thiết bị tin cậy và thông báo. Miễn trừ phải so khớp nguyên số, không so chuỗi con |
| 5 | Chỉ settle nhận `outside_desk` | **Chưa đủ** (thẻ 03) | `PaymentCreate.method` đang `$ref: PaymentMethod`. Khi `PaymentMethod` thêm `outside_desk`, zod sinh từ OpenAPI sẽ nhận giá trị đó ở mọi thân dùng `PaymentCreate`. Hiện chỉ còn danh sách `METHODS` trong controller chặn. CHECK DB không biết operation nào đang ghi |
| 6 | Giá dọn theo căn (A101) | **Đạt** | Như các khóa giá khác: OWN/MGR, hook kiểm, audit tham số trước/sau. Không có ý kiến |
| 7 | SEC 190-07/08 | **Giữ Minor**, hạn 31/12 | 190-08 nhỏ (một lời gọi + một test), nên đi cùng PR. 190-07 tách ra được |

## Thẻ feedback

### FB-R5-SEC-ARC-12-01
- Mức độ: Major
- Vị trí: contract §12.1.1 `createReservation.backdatedArrival`; §12.1.2; `reservations.service.ts` (`closerUserId`, cập nhật người chốt).
- Vấn đề: đơn nhập bù được gửi kèm `closerUserId`. Người chốt có thể là chính MGR đang nhập, hoặc SAL/CTV. Kết quả là đơn sinh hoa hồng trên tiền thuê đã quyết toán ngoài Desk, và người nhập bù tự chọn người hưởng. Đổi người chốt sau khi tạo đơn cũng mở lại đường này.
- Vì sao quan trọng: chi tiền hai lần cho cùng một lượt ở. Người làm thao tác lại là người hưởng lợi. Thông báo OWN không chặn được việc này.
- Đề xuất sửa (control chính xác):
  1. Có `backdatedArrival` mà `closerUserId` khác null → `422 VALIDATION_FAILED` (`closerUserId: NOT_ALLOWED`). Đơn nhập bù không có dòng `commission` nào, kể cả `projected`.
  2. Đơn có `checkin_backdated_on IS NOT NULL` hoặc tạo bằng `backdatedArrival` (lưu cờ trong audit/cột đã có): đổi người chốt chỉ OWN làm được, MGR → `403 FORBIDDEN_ACTION`.
  3. Test: MGR gửi `backdatedArrival` + `closerUserId` = chính mình → 422; MGR đổi người chốt trên đơn nhập bù → 403; OWN → 200.
- Trạng thái: Open

### FB-R5-SEC-ARC-12-02
- Mức độ: Major
- Vị trí: contract §12.2 `settleBillingPeriodOutsideDesk`, §12.9 A128.
- Vấn đề: MGR ghi được "đã thu ngoài Desk" trên **mọi** phiếu còn nợ, cho mọi dòng (cả điện, nước, dịch vụ phát sinh sau khi có Desk), với mọi ngày nhận ≤ hôm nay. Ghép với A127, một người tạo được đêm phòng và doanh thu đã thu mà không có tiền vào quầy. Operation cũng thiếu `x-requires-trusted-device`, trong khi `checkInBackdated` có.
- Vì sao quan trọng: đây là đường "xóa nợ" không cần tiền. Nó làm lệch doanh thu, công nợ, và sau này cả thưởng A120. Theo 148-01, ngoại lệ về tiền phải hẹp và có dấu vết.
- Đề xuất sửa (control chính xác):
  1. Thêm `x-requires-trusted-device: true` vào `settleBillingPeriodOutsideDesk`.
  2. **MGR** chỉ được ghi khi đủ cả 3 điều kiện:
     - (a) phiếu thuộc đơn có `checkin_backdated_on IS NOT NULL` và là phiếu tháng nhận phòng (kỳ chứa `arrival_date` trên Desk);
     - (b) `amountVnd` ≤ tổng dòng `rent` của phiếu trừ phần đã thu;
     - (c) `receivedOn` ≤ `checkin_backdated_on`.
     
     Sai điều kiện nào → `403 FORBIDDEN_ACTION`, `detail` cố định "owner only", audit `access.denied`.
  3. **OWN** giữ nguyên luật §12.2 (mọi phiếu còn nợ, có lý do).
  4. Không cần trần số tiền riêng. Điều kiện (b) đã là trần.
  5. Test: MGR trên phiếu 12/2026; MGR với số tiền > phần thuê; MGR với `receivedOn` sau ngày nhập bù → đều 403. MGR đúng ca go-live (phiếu 11, tiền thuê, nhận 03/11) → 200. OWN trên phiếu 12 → 200.
- Ghi chú: cách này vẫn giữ quyết định INV 18/11 (MGR+ thu ngoài Desk cho khách đang ở). Nếu sau ra mắt cần MGR ghi ngoài Desk thường xuyên (ví dụ khách chuyển thẳng cho chủ), đó là chính sách tiền, ORC báo INV. Không mở rộng trong v1.0.7.
- Trạng thái: Open

### FB-R5-SEC-ARC-12-03
- Mức độ: Major
- Vị trí: §12.8 `PaymentMethod`; `openapi.yaml` `PaymentCreate.method` (`$ref: '#/components/schemas/PaymentMethod'`); `PaymentsService.recordInTx`.
- Vấn đề: thêm `outside_desk` vào enum dùng chung `PaymentMethod` thì mọi thân yêu cầu `$ref` tới enum đó cũng nhận `outside_desk` ở tầng kiểm schema. Hiện chỉ danh sách `METHODS`/`R2_METHODS` trong controller chặn. Đường mới trong `recordInTx` thì mọi module có quyền gọi đều dùng được với `method = outside_desk`. CHECK DB chỉ kiểm hình dạng dòng, không biết operation nào ghi.
- Vì sao quan trọng: nếu sau này ai sửa danh sách controller hoặc thêm một đường thu mới, nhân viên quầy sẽ ghi được "đã thu" không có tiền mà không có lỗi nào báo.
- Đề xuất sửa (control chính xác):
  1. Tách enum. `PaymentMethod` (đọc, có `outside_desk`) dùng cho `Payment`, `Bill`, `ShiftReport`, `listPayments`. Thêm `PaymentMethodInput` (không có `outside_desk`) dùng cho `PaymentCreate` và mọi thân yêu cầu có trường `method`. Kết quả: zod sinh ra trả 422 trước khi tới controller.
  2. `recordInTx` chỉ nhận `outside_desk` khi người gọi truyền một tham số nội bộ (ví dụ `source: 'settle_outside_desk'`) mà chỉ service settle đặt. Thiếu tham số → ném lỗi lập trình (500, có log).
  3. Thêm test hợp đồng: duyệt mọi schema thân yêu cầu trong `generated/openapi-schemas.ts`, khẳng định không schema nào parse được `method: 'outside_desk'`. Giữ Q13.
- Trạng thái: Open

### FB-R5-SEC-ARC-12-04
- Mức độ: Minor
- Vị trí: §12.3 `setPropertyContact`; bộ lọc `SENSITIVE_DATA_DETECTED`; chân phiếu `print()`, trang công khai căn, mẫu email/Zalo nếu có dùng.
- Vấn đề và đề xuất:
  - (a) Miễn trừ hotline phải so khớp **nguyên số** sau khi chuẩn hóa (chỉ giữ chữ số và `+`). Không so chuỗi con hay tiền tố. Thêm test: số dài hơn có chứa hotline vẫn bị chặn.
  - (b) `addressLine` lọc thêm ký tự định hướng và ký tự độ rộng 0 (U+200B–U+200F, U+202A–U+202E, U+2060–U+2069), như `stripControlChars` của `accountHolder`.
  - (c) Mọi nơi hiện địa chỉ và hotline đều escape: React không dùng `dangerouslySetInnerHTML`, mẫu in và Astro dùng biểu thức đã escape. FE ghi rõ điều này trong PR.
  - (d) Thêm `x-requires-trusted-device: true` và `staff_notification` cho các OWN khác khi hotline đổi. Hotline in trên phiếu là đường lừa khách gọi số giả.
- Trạng thái: Open

### FB-R5-SEC-ARC-12-05
- Mức độ: Minor
- Vị trí: A120 `getManagerPerformanceBonus` (PR-M, chưa có mã); báo cáo công suất/doanh thu.
- Vấn đề: thưởng tính lúc đọc sẽ đếm cả đêm phòng và doanh thu của đơn nhập bù, cũng như khoản `outside_desk`, trong khi chính MGR nhập các số đó.
- Đề xuất sửa: điều kiện ràng buộc khi PR-M lên:
  - doanh thu tính thưởng loại khoản `method = outside_desk`;
  - hoặc tách riêng phần đó, kèm cờ "nhập bù" do MGR đang được tính thưởng tạo.
  
  ARC ghi điều kiện này vào hợp đồng PR-M. Không cần làm trong v1.0.7.
- Trạng thái: Open

### FB-R5-SEC-ARC-12-06
- Mức độ: Minor
- Vị trí: §12.1.3 `gate` của `meter-readings.service.ts`.
- Vấn đề: `readOn` lùi về ngày đến − 1 có thể đứng trước lần đọc gần nhất của cùng căn (ví dụ `period_end` hay `room_change_out` của lượt trước). Khi đó hai lượt dùng chồng ngày.
- Đề xuất sửa: thêm điều kiện `readOn` ≥ ngày đọc gần nhất còn hiệu lực của căn đó. Sai → `422` (`readOn: DATE_INVALID`). Thêm 1 test.
- Trạng thái: Open

### FB-R5-SEC-ARC-12-07
- Mức độ: Minor
- Vị trí: §12.1.1 `createReservation` có `backdatedArrival`.
- Vấn đề: `checkInBackdated` bắt buộc thiết bị tin cậy, nhưng tạo đơn lùi ngày thì không. Đơn `confirmed` đã chạy `syncLeaseNights` cho các đêm đã qua, tức là đã đổi số liệu quá khứ.
- Đề xuất sửa: kiểm thiết bị tin cậy ở tầng trường. Có `backdatedArrival` mà thiết bị không tin cậy → 403, như kiểm vai theo trường. Mục audit có bộ lọc nhanh "nhập bù / ngoài Desk" để OWN rà hằng tháng.
- Trạng thái: Open

### FB-R5-SEC-ARC-12-08
- Mức độ: Minor
- Vị trí: §12.5 cuối, §12.10 BE-11.
- Vấn đề: SEC 190-07 (test J16 xóa ảnh `meter`) và 190-08 (đặt mốc lưu ảnh khi đơn bị hủy sau hoàn tác nhận phòng) vẫn mở.
- Đề xuất sửa: 190-08 nên đi cùng PR này (một lời gọi `setMeterRetentionAnchor` trong `onReservationVoided` + 1 test). 190-07 được tách. Hạn cả hai: 31/12.
- Trạng thái: Open

### FB-R5-SEC-ARC-12-09
- Mức độ: Minor
- Vị trí: §12.1, A127 (công cụ go-live).
- Vấn đề: A127 là đường dùng chủ yếu khi ra mắt, nhưng không có ngày hết hạn. Biên 45 ngày vẫn cho phép dùng mãi về sau.
- Đề xuất sửa: round sau, cân nhắc tham số OWN `backdated_stay_enabled` (mặc định bật, OWN tắt sau khi nhập xong khách đang ở). Không làm trong v1.0.7.
- Trạng thái: Open

## Giả định
- Đơn nhập bù hôm nay không cần hoa hồng. Tiền thuê đã trả, và hoa hồng nếu có thì đã quyết toán ngoài Desk. Nếu INV muốn tính hoa hồng cho các đơn này, OWN gán người chốt sau (thẻ 01 ý 2).
- Thẻ 02 không đổi quyết định INV. Nó chỉ thu hẹp quyền MGR về đúng ca INV nêu: tiền thuê tháng 11 đã thu ngoài Desk. Không tạo ESC.
