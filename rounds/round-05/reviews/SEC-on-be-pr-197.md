# SEC review – BE PR #197 (FB-INV-012 gói sửa trước ra mắt v1.0.7)

- Người review: SEC | Round 5 – Bước: Review (code) | Ngày: 18/11/2026
- Đối tượng: PR #197, nhánh `r5-fb012-golive-be`, head `a1bd464f` (gốc `13d6b019`)
- Đọc: `gh pr diff 197`, trọng tâm `payment.service.ts` (`recordInTxWithDue`, `recordOutsideDesk`, `recordManual`), `statements.service.ts` (`settleOutsideDesk`, `assertManagerGoLiveScope`), `checkin.service.ts` (`checkInBackdated`, `moveArrival`), `reservations.service.ts` (`parseBackdatedArrival`, đổi người chốt), `property-contact.controller.ts`, `meter-readings.service.ts`, `registration.service.ts`, migration 0100, `openapi.yaml` / `openapi-meta.ts`, `test/fb-inv-012-golive-units.test.ts`, `test/integration/fb-inv-012-golive.test.ts`, mục "Go-live fix" trong `BE-responses.md`.
- Không ghi số tiền hoa hồng, tỷ lệ thưởng vào tài liệu này. PR cũng không có số nào như vậy (đã rà dòng thêm).

## Kết luận

**Đạt có điều kiện.** Ba thẻ Major 12-01/02/03 và hai thẻ Minor 12-06/08 đã làm đúng và có test. Có **1 Major mới (197-01)**, phải sửa trước khi gộp: tham chiếu nối vào `payment.note` mà không qua luật thẻ của ô ghi chú. Sửa một dòng và thêm một test. 4 thẻ Minor không chặn v1.0.7.

## Kiểm lại các thẻ SEC trên contract §12

| Thẻ | Kết quả | Căn cứ trong mã và test |
|---|---|---|
| 12-01 (Major) | **Đạt ở đường tạo đơn**. Còn một đường phụ, hiện chưa gây hại (thẻ 197-03) | `parseBackdatedArrival`: có `closerUserId` thì 422 `closerUserId: NOT_ALLOWED`. Đổi người chốt khi `checkin_backdated_on` có giá trị hoặc `pricing_snapshot.backdatedArrival` thì chỉ OWN làm được, MGR nhận 403 + `access.denied`. `syncCommission` hôm nay chỉ chạy cho đơn ngắn ngày, nên đơn dài hạn không sinh dòng `commission`. Test ở dòng 209, 239, 269 |
| 12-02 (Major) | **Đạt** | `settleBillingPeriodOutsideDesk`: `x-requires-trusted-device: true` (meta `trustedDevice: true`), x-roles OWN/MGR. `assertManagerGoLiveScope` kiểm đủ (a) có `checkin_backdated_on` và kỳ thuê chứa ngày đến, (b) `amount ≤ Σ rent − paid`, (c) `receivedOn ≤ checkin_backdated_on`. Sai thì 403 "owner only" + một `access.denied`. Đủ 7 ca test (dòng 400–555), có ca thiếu thiết bị. Điều kiện (b) dùng `paid` của cả phiếu, nên chặt hơn đề xuất. Vẫn đạt |
| 12-03 (Major) | **Đạt**, chấp nhận lệch #6 | Spec có `PaymentMethodInput` cho `PaymentCreate`. Khi chạy, có 4 chốt chặn: `checkPaymentShape` (`R2_METHODS`), `DEPOSIT_METHODS`, enum riêng của `initialPayment`, và cổng `source` trong `recordOutsideDesk`. Cổng này ném lỗi lập trình nếu method, source, `billingPeriodId` hoặc `type` sai. Sau cùng còn CHECK DB. Test đi qua mọi `requestBody` và tham số; test tích hợp `recordPayment` và thu phiếu đều trả 422 |
| 12-06 (Minor) | **Đạt** | `readOn ≥ max(read_on)` của căn (mọi đơn, `voided_at IS NULL`), sai thì 422 `readOn: DATE_INVALID`. Test ở dòng 359 |
| 12-08 (Minor) | **Đạt** | `onReservationVoided` gọi `setMeterRetentionAnchor`. Test ở dòng 614. 190-07 vẫn mở, hạn 31/12 |
| 12-04 (Minor) | (b) đạt; (a), (c), (d) **còn mở** | (b): `FORBIDDEN_CHARS` chặn C0/C1, bidi, zero-width, BOM. (a): vẫn so 9 số cuối. (d): `setPropertyContact` chưa có thiết bị tin cậy, chưa báo OWN khác. Chấp nhận dời (xem dưới) |
| 12-07 (Minor) | **Còn mở**, BE chưa trả lời | `createReservation.backdatedArrival` chưa kiểm thiết bị tin cậy ở tầng trường. Giữ Minor, hạn 31/12 |

## Ý kiến về các lệch BE tự quyết

| # | Lệch | SEC | Ghi chú |
|---|---|---|---|
| 1 | CHECK `payment_outside_desk_check` miễn cho dòng đảo (`reversal_of_id`) | **Chấp nhận**, siết thêm (thẻ 197-04) | Cách này hợp lý hơn chép `billing_period_id` sang dòng đảo, vì chép thì tổng đã thu của phiếu dễ bị trừ hai lần. Dòng đảo do `reverse()` tạo vẫn là `charge`, `not_required`, không có ca, nên các phần còn lại của CHECK vẫn giữ. Lỗ hổng: CHECK nhận mọi dòng `outside_desk` có `reversal_of_id`, kể cả số tiền dương. Lệch này cũng chưa có test |
| 2 | `reference` nối vào `note`, chặn số thẻ và chuỗi toàn số ≥ 9 chữ số | **Chấp nhận cách lưu, nhưng phần chặn thẻ chưa đủ** (thẻ 197-01) | `isCardNumberReference` là luật lỏng dành cho ô mã ngân hàng. Chuỗi "chữ + số thẻ" lọt qua và vào `payment.note`, trong khi `note` thường phải qua `assertNoCardNumber` |
| 3 | Dời ngày đến chỉ cho đơn một đoạn | Chấp nhận | `moveArrival` cũng đòi đoạn đó đúng căn đang nhận và ngày đến < `to_date` |
| 4 | `USE_CHECK_IN` chỉ ở `checkInBackdated` | Chấp nhận | Không có hệ quả bảo mật |
| 5 | Thông báo `statement_settled_outside_desk` chỉ có mã phiếu, mã đơn | **Chấp nhận** | Đúng SEC A5: thông báo không mang số tiền. Audit `money` có đủ số tiền, `receivedOn`, số dư trước/sau, lý do. Người ghi lấy từ audit |
| 6 | Test tách enum đọc `openapi.yaml` thay cho `generated/openapi-schemas.ts` | **Chấp nhận** | File sinh không có enum và không có thân yêu cầu, nên đọc nó chẳng kiểm được gì. Test trên yaml giữ hợp đồng. Chốt chặn khi chạy đã nêu ở 12-03 |
| 7 / 12-04(a) | Chưa so nguyên số hotline | **Chấp nhận dời**, hạn 31/12 | Hiện chỉ OWN đổi hotline. Muốn khai thác phải có một số dài kết thúc đúng 9 số cuối của hotline, ví dụ số dạng CCCD 12 chữ số, rồi số đó mới lọt bộ lọc của yêu cầu khách. Khả năng thấp |

## Có đường nào tạo `outside_desk` ngoài settle không?

**Không có.** Đã rà mọi chỗ `INSERT INTO payment` và `recordManual(`:
- `recordPayment` (folio, phiếu tháng), `checkIn.payment`, `checkOut.finalPayment`, `confirmDeposit`: đều qua `checkPaymentShape`, nên `outside_desk` nhận 422 `NOT_IN_LIST`.
- `createDeposit` (`DEPOSIT_METHODS`), `createReservation.initialPayment` (enum riêng gồm 4 giá trị), `createVietQr` (gán cứng `vietqr`), `syncOtaCollect` (chỉ `ota_collect`), hoàn tiền (`original_method = outside_desk` thì 422): đều không ghi được giá trị này.
- `reversePayment` chép `method` từ khoản gốc, nên chỉ đảo được khoản `outside_desk` đã có (xem thẻ 197-04).
- Lớp sau cùng là CHECK DB: `type = charge`, `not_required`, không có ca, có `billing_period_id` + `note`.

## Có bỏ qua được phân quyền không?

- `checkInBackdated`: meta có x-roles OWN/MGR, `trustedDevice`, `ifMatch`, `idempotencyKey`. Service khóa đơn, kiểm phiên bản, `confirmed`, đúng loại dài hạn nhập tay, biên ngày, xung đột, điều kiện BR-402. `allowedActions` chỉ hiện nút cho MGR+. **Không thấy đường bỏ qua.**
- `createReservation.backdatedArrival`: kiểm vai ở tầng trường (`MGR_PLUS`) sau `f.done()`, nên FD/FDL nhận 403 + `access.denied`. Giá trị sai kiểu hoặc thiếu `manualLongStay` thì 422 trước, không lộ gì thêm. Còn thiếu thiết bị tin cậy (12-07).
- `setPropertyContact`: x-roles chỉ OWN. Ghi theo `tx.ctx.propertyId`, không theo tham số đường dẫn, nên không có lỗi IDOR giữa các cơ sở. Không có If-Match (người ghi sau thắng), có audit trước/sau. Chấp nhận, vì đây là thông tin công khai.

## Thẻ feedback

### FB-R5-SEC-BE-197-01
- Mức độ: Major
- Vị trí: `statements.service.ts` `settleOutsideDesk`, khối `reference`, và `note: reference ? \`${reason} | ref ${reference}\` : reason`.
- Vấn đề: `reference` chỉ qua `isCardNumberReference`, luật lỏng của ô mã ngân hàng. Luật này cộng dồn các nhóm từ đầu chuỗi, và `luhnValid` trả false khi gặp chữ. Vì vậy chuỗi `FT 4111 1111 1111 1111` (chữ + một số thẻ hợp lệ) qua được, rồi được nối thẳng vào `payment.note`. `recordOutsideDesk` chỉ `trim` lại, không kiểm lại ghi chú. Trong khi đó mọi `note` của đường thu thường đều qua `optionalText` → `assertNoCardNumber` (luật V-09 cho văn bản tự do). PR này làm gãy bất biến "`payment.note` không bao giờ chứa số thẻ".
- Vì sao quan trọng: số thẻ (PAN) lưu thô trong một cột hiện trên danh sách khoản thu và audit là vi phạm PCI DSS (R-PAY-01). Không thể xóa sạch sau khi đã sao lưu.
- Đề xuất sửa (control chính xác):
  1. Sau khi ghép, gọi `assertNoCardNumber('reference', reference)` (luật văn bản tự do), hoặc gọi trên cả chuỗi `note` trước `recordInTx`. Trả 422 `CARD_NUMBER_DETECTED` và không nhắc lại giá trị.
  2. Trong `recordOutsideDesk`, gọi `assertNoCardNumber('note', note)` một lần nữa, như `recordManual` đang kiểm lại `bankReference`.
  3. Test: `reference: 'FT 4111 1111 1111 1111'` → 422 `CARD_NUMBER_DETECTED`; không có dòng `payment` nào được ghi.
- Ghi chú: với ô này, thỉnh thoảng chặn nhầm một mã ngân hàng là chấp nhận được, vì cả đợt ra mắt chỉ khoảng 6 khoản. Người nhập bỏ bớt ký tự là xong.
- Trạng thái: Open

### FB-R5-SEC-BE-197-02
- Mức độ: Minor
- Vị trí: `statements.service.ts` `assertManagerGoLiveScope` (điều kiện b), kết hợp `reversePayment` (A34, OWN/MGR).
- Vấn đề: điều kiện (b) dùng `paid` hiện tại của phiếu. MGR có thể đảo một khoản thu thật trên phiếu tháng nhận phòng. Ví dụ tiền mặt thu tại quầy sau ngày nhập bù: đảo khoản đó thì `paid` giảm. Sau đó MGR ghi lại cùng số tiền là "ngoài Desk" với `receivedOn` = ngày nhập bù. Phiếu vẫn hiện "đã thu", còn tiền mặt thì không còn trong quầy. Đảo khoản thu không báo OWN. Chỉ thông báo settle là có.
- Vì sao quan trọng: đây vẫn là kiểu "xóa nợ không cần tiền" mà thẻ 12-02 muốn chặn. Ở đây nó đi vòng qua thao tác đảo.
- Đề xuất sửa: trong `assertManagerGoLiveScope`, MGR nhận 403 "owner only" khi phiếu đã có bất kỳ khoản thu nào có `status = 'reversed'`, hoặc có khoản thu khác `outside_desk` mà `received_at` sau `checkin_backdated_on`. Thêm 1 test: MGR đảo khoản tiền mặt rồi settle → 403. Nên làm luôn trong PR này nếu kịp. Nếu không, hạn 29/11, cùng BE-8.
- Trạng thái: Open

### FB-R5-SEC-BE-197-03
- Mức độ: Minor
- Vị trí: `checkin.service.ts` `checkInBackdated`.
- Vấn đề: chặn người chốt của 12-01 (1) chỉ nằm ở `createReservation.backdatedArrival`. Đơn dài hạn nhập tay tạo theo cách thường, có ngày đến là hôm nay và có `closerUserId` (có thể chính là MGR), vẫn nhận phòng bù được ở ngày sau. Khi đó `moveArrival` kéo ngày đến lùi tối đa 45 ngày, và người chốt vẫn giữ nguyên. Hôm nay chưa sinh tiền, vì `syncCommission` chỉ chạy cho đơn ngắn ngày. Đến khi PR-M thêm `long_stay_commission`, đơn này sẽ có hoa hồng trên tiền thuê đã quyết toán ngoài Desk.
- Đề xuất sửa: thêm vào `checkInBackdated`: `closer_user_id IS NOT NULL` mà người gọi không phải OWN → 422 `closerUserId: NOT_ALLOWED`. OWN thì vẫn qua được, vì OWN quyết định hoa hồng. Hoặc ARC ghi vào hợp đồng PR-M: `long_stay_commission` bỏ qua phần tiền thuê trước `checkin_backdated_on`. Hạn: trước khi PR-M gộp. Gộp chung điều kiện với 12-05.
- Trạng thái: Open

### FB-R5-SEC-BE-197-04
- Mức độ: Minor
- Vị trí: migration 0100 `payment_outside_desk_check` và `schema/folio.ts`; lệch #1; `refunds.service.ts`.
- Vấn đề: phần miễn trừ `reversal_of_id IS NOT NULL` nhận cả dòng `outside_desk` có số tiền dương. Lệch #1 (đảo khoản `outside_desk`) và việc chặn hoàn tiền `refundMethod: NOT_ALLOWED` cũng chưa có test tích hợp. Chưa có gì chứng minh CHECK mới không chặn A34.
- Đề xuất sửa:
  1. Siết miễn trừ thành `("reversal_of_id" IS NOT NULL AND "amount_vnd" < 0)`. Sửa trong 0100 khi PR chưa gộp. Nếu đã gộp thì sửa ở migration sau.
  2. Thêm test: OWN/MGR đảo khoản `outside_desk` → thành công, phiếu lùi trạng thái (`paid` → `partially_paid`/`issued`). Hoàn tiền khi khoản thu gần nhất là `outside_desk` → 422 `refundMethod: NOT_ALLOWED`.
- Hạn: 29/11.
- Trạng thái: Open

### FB-R5-SEC-BE-197-05
- Mức độ: Minor
- Vị trí: `statements.service.ts` khối `reference`.
- Vấn đề: luật "chỉ toàn số ≥ 9 chữ số" chỉ áp khi cả chuỗi là số. Số tài khoản có chữ đứng trước, ví dụ `TK 0123456789`, vẫn lọt vào `note`. Rủi ro thấp, vì chỉ OWN/MGR nhập. Nhưng số tài khoản của khách là dữ liệu cá nhân, và ô này không dùng cho mục đích đó.
- Đề xuất sửa: UXD/FE ghi rõ gợi ý dưới ô: "Mã giao dịch nền tảng cũ, không nhập số tài khoản/số thẻ". BE có thể chặn thêm khi có tiền tố `TK`/`STK`/`ACC` + ≥ 9 chữ số. Hạn 31/12.
- Trạng thái: Open

## Thẻ cũ còn mở (giữ nguyên, không chặn)
- 12-04 (a), (c), (d): hạn 31/12. Riêng (c) là việc của FE.
- 12-05: điều kiện cho PR-M.
- 12-07: hạn 31/12. BE/ARC cần trả lời thẻ này trong responses.
- 12-09: round sau.
- 190-07: hạn 31/12.

## Giả định
- Guard xác thực kiểm `propertyId` trên đường dẫn khớp với phiên, như mọi operation khác. PR không đổi guard.
- Hôm nay không có mã hoa hồng cho đơn dài hạn. Vì vậy 197-03 là Minor, không phải Major.
- `reversePayment` không báo OWN (không thấy `notify` trong `PaymentsService.reverse`). Nếu có kênh báo khác, 197-02 vẫn nên làm, vì thông báo chỉ giúp phát hiện sau khi việc đã xảy ra.
