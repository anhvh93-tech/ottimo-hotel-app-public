# ARC review – PR BE #190 `r5-fb012-be-statements` (FB-INV-012 phiếu thanh toán tháng)

- Người review: ARC | Round 5 – bước **Review** | 17/11/2026
- Đối chiếu:
  - hợp đồng `rounds/round-05/fb-inv-012/contract.md`;
  - `rounds/round-05/fb-inv-012/DOM-rules.md` (BR-LS-01…16);
  - bổ sung INV 17/11 trong `04-investor-feedback/FB-INV-012.md`: chỉ số đầu kỳ nhập bắt buộc, chênh lệch là hao hụt không tính khách, đầu kỳ < cuối kỳ trước thì **cảnh báo**;
  - báo cáo BE `rounds/round-05/outputs/BE/fb-inv-012-be-statements.md` (trên nhánh PR).
- Cách đọc: `gh pr diff 190` và `git show origin/r5-fb012-be-statements:<file>`. Không checkout trong thư mục chung.
- Đã đọc kỹ:
  - migration 0099;
  - `meter-readings.service.ts`, `statements.service.ts` (compute, issue, void, refreshPaid, recordPayment, print, candidates);
  - `billing.module.ts`;
  - diff folio và payments;
  - schema OpenAPI của tag `billing`;
  - test tích hợp (các đoạn kỳ lẻ, kỳ cuối, `period_start`).
- CI: tất cả xanh.
- Review cùng lúc với PR FE #189. Quyết định đặt tên chung nằm ở `ARC-on-fe-pr-189.md` mục 1. Thẻ BE-190-02 và BE-190-04 dưới đây là phần BE phải làm theo quyết định đó.

## Kết luận: **APPROVE CÓ ĐIỀU KIỆN**

- **Trước khi merge**, BE sửa 4 thẻ Major: 01, 02, 03, 04.
- **Sau merge, trước production:**
  - thẻ 07 (chạy migration trên bản sao staging, tiêu chí test 11);
  - thẻ 04 phần `readByInitials` nếu chưa kịp.
- **Dời được sang việc sau:** các thẻ Minor 05, 06, 08, 09.
- Không có Blocker:
  - tính tiền đúng số DOM;
  - giao dịch phát hành đúng thứ tự khóa;
  - idempotency và If-Match (428/412) có test;
  - RLS FORCE trên cả 3 bảng;
  - migration chỉ thêm.

## Xét các lệch BE tự nêu

| Lệch | Kết luận ARC |
|---|---|
| **A123 thay A88** cho 3 API đồng hồ | **Chấp nhận.** A88 trong ma trận có MT, đợt này chưa mở cho MT (SEC D18). Tách mã mới thì `gen_rbac_cases --check` khớp mà không sửa ô cũ. Khi mở cho MT thì gộp lại. ORC ghi decision-log |
| **Không FK `payment.billing_period_id`** | **Chấp nhận cho PR này**, có việc kèm theo: thẻ 05 |
| **Bỏ `PRICE_CHANGED_SINCE_DRAFT`** | **Chấp nhận.** Nháp không lưu số (D4). Lúc phát hành, giá và VAT được đọc lại và ghi vào `ratesSnapshot`, nên không có "giá nháp cũ" để so. ARC rút mã này khỏi hợp đồng mục 5.1. FE bỏ mã khỏi union (FE-189-07) |
| **Trường thêm** (`reservationCode`, `missingReadings`, `not_needed`, kết quả ghi thu `{billingPeriod, payment}`, `kind` tùy chọn) | **Chấp nhận**, tất cả chỉ thêm. Hình dạng của BE là chuẩn, FE theo (FE-189-03) |
| **Migration chỉ kiểm tĩnh** | Chấp nhận để merge (chỉ CREATE và INSERT `ON CONFLICT DO NOTHING`). **Điều kiện trước production:** thẻ 07 |
| **Listener thanh toán trong worker** | Hiện tại rủi ro thấp: worker chỉ cho hết hạn payment `pending`, mà thu phiếu luôn ghi `succeeded`. Nhưng cách "ném lỗi lúc chạy" thì cần sửa: thẻ 06 |
| **`paid` không cập nhật khi đối soát từ chối** | **Đúng thiết kế.** Theo payments hiện có, `disputed` không tự đảo; MGR+ quyết bằng `reversePayment`, và listener đã lùi trạng thái lúc đảo. Thiếu một tín hiệu cho lễ tân: thẻ 08 |
| `RENT_ALREADY_POSTED` chỉ nhận `monthly_rent` | Chấp nhận. Tiền thuê ghi tay dạng `service_fee` của đơn cũ: DOM nhắc lễ tân không ghi tay tiền thuê từ khi có phiếu tháng (sổ vận hành). Không cần mã |
| A89 làm đơn giản (FDL+ lưu thẳng) | Đúng hợp đồng mục 4 (lệch có chủ đích, chờ DOM + BA) |
| Theo INV 17/11 (kỳ lẻ thu lúc nhận phòng qua phiếu của tháng nhận phòng, bỏ phí 200.000, VAT 8/5 %) | Đúng. Kỳ cuối 5.387.000 khớp DOM vì phiếu tháng 11 (3.113.000) cũng là dòng `rent` của phiếu và được `priorRentVnd` cộng vào |

## Thẻ feedback

### FB-R5-ARC-BE-190-01
- Mức độ: Major
- Vị trí: `services/api/src/modules/billing/internal/meter-readings.service.ts`, `record()`, đoạn kiểm tra "lower than previous" (`if (!v.exception && v.scaled < prev) throw problem('METER_LOWER_THAN_PREVIOUS'…)`). Cùng một nhánh chạy cho cả lần đọc đầu kỳ lẫn cuối kỳ.
- Vấn đề: hiện tại cả hai trường hợp đều trả 422 và không lưu:
  - **đầu kỳ < cuối kỳ trước** (`checkin` / `period_start` / `room_change_in` so với `previousClosing`);
  - **cuối kỳ < đầu kỳ**.

  INV 17/11 viết rõ: đầu kỳ < cuối kỳ trước thì **cảnh báo** (nghi nhập sai hoặc thay đồng hồ). FE #189 cũng làm cảnh báo, nên hai bên đang lệch nhau.

  Lại có một ngõ cụt. Đồng hồ thay trong khoảng trống giữa hai khách (thường gặp) thì chỉ số mới nhỏ hơn số cuối của khách trước. Lễ tân bị chặn và phải gọi FDL+ khai `exception` cho một lần đọc **không tính tiền**.
- Vì sao quan trọng:
  - đầu kỳ thấp **không** làm mất tiền của khách;
  - nhưng đầu kỳ gõ nhầm thấp thì tiêu thụ tính tiền (`cuối − đầu`) bị **tăng** và khách bị thu thừa;
  - vì vậy không chặn lúc nhập, nhưng phải chặn lại trước khi phát hành.
- Đề xuất sửa (ARC chốt, áp cho cả hai PR):
  1. **Cuối kỳ < đầu kỳ** (`period_end`, `room_change_out`, `checkout`): **giữ 422 `METER_LOWER_THAN_PREVIOUS`** và đường ngoại lệ FDL+ (thay đồng hồ, quay vòng) như BR-LS-12. Con số này là tiền.
  2. **Đầu kỳ < cuối kỳ trước**, không khai `exception`:
     - Body thêm `acknowledgeLowerThanPrevious: boolean` (mặc định false).
     - Lần gửi đầu không có cờ → 422 mã mới `OPENING_BELOW_PREVIOUS_CLOSING`, kèm `meter`, `previousValue`, `previousReadingId`, `previousKind`.
     - Gửi lại với cờ `true` → **lưu được với mọi vai FD+**:
       - `gap` âm lưu nguyên;
       - thêm cột `opening_below_previous boolean` (hoặc suy ra từ `gap < 0`, BE chọn);
       - audit `meter_reading.recorded` ghi `acknowledgedLower: true`.
     - Có khai `exception` (thay đồng hồ trong khoảng trống) thì giữ như hiện tại: FDL+, không cảnh báo.
  3. Nháp phiếu dùng lần đọc này làm đầu kỳ → thêm cảnh báo `OPENING_BELOW_PREVIOUS_CLOSING` (`roomNo`, `meter`, `opening`, `previousClosing`). Phát hành phải `acknowledgeWarnings` như mọi cảnh báo, để lần nhầm được chặn thêm một lần trước khi thành tiền.
  4. Cập nhật OpenAPI:
     - `MeterReadingCreate.acknowledgeLowerThanPrevious`;
     - mã lỗi mới;
     - `BillingWarning` mô tả mã mới;
     - mô tả op `recordMeterReading`.
  5. Thêm test:
     - đầu kỳ 1.390 < 1.392: lần đầu 422 `OPENING_BELOW_PREVIOUS_CLOSING`, gửi lại với cờ → 201, `gap.electricity = -2`, nháp có cảnh báo, phát hành thiếu `acknowledgeWarnings` → 422;
     - FD gửi được với cờ.
- Trạng thái: Open

### FB-R5-ARC-BE-190-02
- Mức độ: Major
- Vị trí: `statements.service.ts` `candidates()`; OpenAPI `BillingCandidateList`.
- Vấn đề:
  1. `readingStatus` chỉ xét `period_end` của kỳ điện nước. Từ INV 17/11, đầu kỳ (`period_start`) cũng bắt buộc. Danh sách có thể báo `recorded` trong khi phát hành vẫn trả 422 `METER_READING_MISSING` (`kind: opening`).
  2. Phần tử không có `roomId`. Bảng chốt số cuối tháng của FE (S12) cần `roomId` cho `recordMeterReading`, nên FE đã tự thêm `roomId` không có trong hợp đồng.
  3. Danh sách chỉ lấy đơn `in_house`. Đơn đã trả phòng còn trong cửa sổ, cần phiếu `final` (mà `billable()` cho phép), không hiện ra. Ý này nhỏ, gộp vào thẻ này.
- Vì sao quan trọng: lễ tân tin bảng "Ready to bill", bấm phát hành rồi mới biết thiếu số. Đổi căn giữa kỳ thì một `roomId` không đủ.
- Đề xuất sửa (chỉ thêm, giữ `roomNos` và `readingStatus` cũ cho tương thích):
  ```yaml
  rooms:
    - roomId, roomNo,
      opening:     missing | recorded | exception | not_needed   # đầu kỳ của kỳ điện nước trên phiếu này
      closing:     missing | recorded | exception | not_needed   # period_end / room_change_out của kỳ đó
      nextOpening: missing | recorded | not_needed               # period_start của tháng kế (bảng cuối tháng nhập luôn)
  ```
  - `readingStatus` tổng hợp: `missing` nếu `opening` hoặc `closing` của bất kỳ căn nào thiếu.
  - Thêm đơn `checked_out` trong cửa sổ `readingWindow.daysAfter` có `expectedKind = final`.
- Trạng thái: Open

### FB-R5-ARC-BE-190-03
- Mức độ: Major
- Vị trí: `meter-readings.service.ts` `record()`, `READING_OUT_OF_WINDOW`; hợp đồng mục 5.
- Vấn đề: cửa sổ chốt số (ngày cuối tháng → hết ngày 01) áp cứng cho mọi vai, và không có đường đi khác. Lễ tân quên nhập (khách vắng, nghỉ lễ) thì:
  - `period_end` M không bao giờ ghi được, nên phiếu M+1 bị 422 `METER_READING_MISSING` mãi;
  - từ INV 17/11, `period_start` cũng bắt buộc nên rủi ro này nhân đôi.

  Hợp đồng của ARC có lỗ này từ đầu. BE làm đúng hợp đồng, ARC nhận phần lỗi thiết kế.
- Vì sao quan trọng: một lần quên là không thu được tiền tháng đó qua phiếu, và không có cách sửa trên Desk.
- Đề xuất sửa:
  - FDL+ được ghi ngoài cửa sổ khi gửi `lateReason` (3–300 ký tự, qua bộ lọc mẫu như `note`). FD vẫn nhận 422 kèm câu "Ask the front desk lead".
  - Lưu `late_reason`, `late_approved_by`; audit `meter_reading.late`.
  - Nháp có cảnh báo `READING_LATE` (phát hành phải xác nhận).
  - Giới hạn trễ tối đa: tham số `monthly_statement_rules.readingWindow.lateMaxDays`, mặc định 10. Hook kiểm 0–31.
  - Ghi lại cho DOM: đầu kỳ đọc trễ thì phần dùng từ ngày 01 tới ngày đọc rơi vào `gap`, không tính khách. Đây là cách INV chọn (có lợi cho khách).
- Trạng thái: Open

### FB-R5-ARC-BE-190-04
- Mức độ: Major
- Vị trí: OpenAPI `BillingPeriod`, `MeterReading`; `statements.service.ts` `view()`; `meter-readings.service.ts` `view()`.
- Vấn đề: FE cần 4 dữ liệu mà BE chưa trả (chi tiết ở `ARC-on-fe-pr-189.md` mục 1). FE đang tự bịa tên:
  1. **dòng dịch vụ đã dời** (BR-LS-14): FE cần nhãn và số tiền để hiện và cho "đưa lại", BE chỉ có `excludedFolioLineIds`;
  2. **mã phiếu bị thay**: BE chỉ có `replacesId`;
  3. **ai nhập chỉ số** (BR-LS-10: ghi người nhập và giờ nhập): BE chỉ trả `readByRole`;
  4. **lần đọc đã nằm trên phiếu phát hành**: FE cần biết để ẩn nút Hủy thay vì chờ 409.
- Vì sao quan trọng: thiếu các trường này thì FE không chuyển được sang kiểu sinh từ OpenAPI và phải giữ mock riêng.
- Đề xuất sửa (chỉ thêm):
  - `BillingPeriod.excludedLines: BillingPeriodLine[]`: chỉ ở nháp, tính như dòng dịch vụ nhưng không cộng vào tổng; đã phát hành thì `[]`.
  - `BillingPeriod.replacesCode: string | null`.
  - `MeterReading.readByInitials: string | null`: chữ cái đầu như `printedByInitials`, không trả họ tên.
  - `MeterReading.onIssuedStatement: boolean`: cùng truy vấn với `voidMeterReading`.
- Trạng thái: Open

### FB-R5-ARC-BE-190-05
- Mức độ: Minor
- Vị trí: migration 0099 (đầu file), `payment.billing_period_id`.
- Vấn đề: cột đã có từ 0012 nhưng không có FK. Hợp đồng D2 giả định cột sẽ trỏ vào `billing_period`. Hiện chỉ module billing ghi cột này: `checkPaymentShape` chặn client, còn `createVietQr purpose=billing_period` bị chặn 422.
- Vì sao quan trọng: không có FK thì một lỗi lập trình sau này có thể gắn payment vào phiếu của cơ sở khác hoặc phiếu không tồn tại.
- Đề xuất sửa: migration kế tiếp (hoặc ngay trong 0099 nếu kịp) thêm `ALTER TABLE payment ADD CONSTRAINT payment_billing_period_fk FOREIGN KEY (property_id, billing_period_id) REFERENCES billing_period(property_id, id) NOT VALID;` rồi `VALIDATE CONSTRAINT`. Mọi dòng cũ là null nên an toàn. Đây là thêm ràng buộc, không đổi dữ liệu, nên ARC cho phép trong quy tắc "chỉ thêm".
- Trạng thái: Open

### FB-R5-ARC-BE-190-06
- Mức độ: Minor
- Vị trí: `payments/public/payment.service.ts` `billingPeriodPaymentChanged()` (ném `Error('billing module not wired…')` lúc chạy); `billing.module.ts` `onModuleInit`.
- Vấn đề: một tiến trình Nest có PaymentsModule mà không có BillingModule (worker, script) chỉ lỗi khi có người đảo một phiếu thu của phiếu tháng. Lỗi khi đó là 500 giữa giao dịch tiền, không phải lỗi lúc khởi động.
- Vì sao quan trọng: lỗi chỉ lộ ra ở production, đúng lúc MGR xử lý tiền.
- Đề xuất sửa: kiểm lúc khởi động (`onApplicationBootstrap` của PaymentsModule). Có chỗ gọi `reversePayment` mà chưa có listener thì dừng khởi động với thông báo rõ. Hoặc: worker import `BillingModule`, thêm test kiến trúc "mọi app có PaymentsModule cũng có BillingModule". Ghi vào `architecture.md` mục cổng module.
- Trạng thái: Open

### FB-R5-ARC-BE-190-07
- Mức độ: Minor (điều kiện trước production, không chặn merge)
- Vị trí: hợp đồng mục 8, tiêu chí BE 11; báo cáo BE mục 3 "Chưa chạy".
- Vấn đề: migration 0099 mới được kiểm tĩnh, chưa chạy trên bản sao dữ liệu staging.
- Vì sao quan trọng: 0099 thêm khóa `config_parameter_def` và grant. Cần chắc các test kiến trúc (parameters-delete, RLS quét `pg_class`) và việc tính folio cũ không đổi khi chạy trên dữ liệu thật.
- Đề xuất sửa: OPS (hoặc QA ở bước Kiểm thử) chạy 0099 trên bản sao staging:
  - đếm số dòng các bảng cũ trước và sau;
  - so tổng folio của 3 đơn mẫu;
  - ghi kết quả vào báo cáo QA.

  QC giữ điều kiện này ở cổng phát hành.
- Trạng thái: Open

### FB-R5-ARC-BE-190-08
- Mức độ: Minor
- Vị trí: `statements.service.ts` `paidVnd()`, `refreshPaid()`; `view()`.
- Vấn đề: phiếu thu VietQR luôn `reconciliation=pending` (D7). Phiếu chuyển `paid` ngay khi lễ tân ghi thu. Đối soát ra `disputed` thì phiếu vẫn `paid`, vì payment vẫn `succeeded` cho tới khi MGR đảo. Đúng thiết kế payments, nhưng S16 không cho thấy tiền chưa được ngân hàng xác nhận.
- Vì sao quan trọng: quản lý nhìn "Paid" sẽ tưởng đã có tiền.
- Đề xuất sửa: `BillingPeriod.totals` thêm `unreconciledVnd` (Σ payment `succeeded` gắn phiếu, `reconciliation IN ('pending', 'disputed')`) và `disputed: boolean`. Không đổi máy trạng thái phiếu. FE hiện chip phụ "Awaiting bank check" hoặc "Disputed" (màu trong bảng 80/15/5). Có thể dời sang việc sau.
- Trạng thái: Open

### FB-R5-ARC-BE-190-09
- Mức độ: Suggestion
- Vị trí: `statements.service.ts` `compute()` (vòng qua từng lần đọc cuối kỳ, gọi `openingFor` từng lần), `view()` khi `list` có nhiều nháp.
- Vấn đề: nháp tính lại mỗi lần đọc. Với 10 căn thì ổn trong ngân sách p95 < 300 ms. Khi mở cho chuỗi, mỗi phiếu chạy khoảng 15–25 truy vấn.
- Đề xuất sửa: chưa cần làm. Khi có cơ sở thứ hai, gom `openingFor` và `readings` thành một truy vấn mỗi phiếu. `list` cho nháp chỉ trả tổng (bỏ dòng).
- Trạng thái: Open

## Điểm làm tốt (giữ)
1. Giao dịch phát hành đúng thứ tự khóa của hợp đồng (đơn → folio → phiếu). Khóa duy nhất `billing_period_line_live_folio_line_key` biến xung đột hai phiếu cùng dòng thành `VERSION_CONFLICT` thay vì 500. Có test hai phát hành đồng thời.
2. Dòng folio của phiếu được khóa đúng chỗ: FOC không giảm (`isStatementLine`), A31/A32 không sửa, `limitBasisVnd` và `liveOn` loại `monthly_rent`. Đúng phần "BE kiểm trước" ở hợp đồng 2.4(a) mà không đổi nhóm doanh thu.
3. Chỉ số đầu kỳ theo INV làm gọn:
   - `previousClosing` lấy theo **căn**, không theo đơn, nên `gap` bắt được hao hụt giữa hai khách;
   - tiêu thụ tính tiền chỉ là `cuối − đầu` cùng kỳ;
   - đổi số kỳ, VAT, hạn chỉ là đổi tham số (test `arrears`, hạn ngày 10, VAT 10 % từ 2027).

---

## Lượt 2 – 18/11/2026 (head `f522aa60`)

- Đầu vào:
  - `rounds/round-05/responses/BE-responses.md` (trên nhánh PR);
  - `git diff 6f3f653f f522aa60`: migration 0099, `meter-readings.service.ts`, `statements.service.ts`, `payments.module.ts`, `payment.service.ts`, `attachment.service.ts`, `schema/folio.ts`, OpenAPI.
- Đọc qua `git show` / `git diff` trên ref, không checkout trong thư mục chung.

### Kết luận lượt 2: **APPROVE CÓ ĐIỀU KIỆN**

- **Về code:** ARC duyệt. Cả 6 thẻ cần sửa trong PR (01–06, 08) đã đóng.
- **Điều kiện merge:** CI job `format · lint · audit · test · build` phải xanh trên head cuối.
  - Ở `f522aa60` job này **đỏ ở bước `pnpm audit --audit-level=high`**, do advisory mới `GHSA-fc5q-39xc-vjpf` (picomatch ReDoS, `<=4.0.7`, chưa có bản vá).
  - Lỗi không do PR này gây ra (PR không đổi phụ thuộc), nhưng các bước sau bị bỏ qua: **chưa có test nào chạy trên `f522aa60`** (format, lint, drizzle, migrate, Vitest, build).
  - Thẻ mới BE-190-10.
- **Điều kiện trước production:** thẻ 07 (giữ nguyên).

### Kiểm từng thẻ

| Thẻ | Kết quả ARC | Bằng chứng |
|---|---|---|
| 01 | **Closed** | `record()`: chỉ lần đọc đầu kỳ (`isOpening(k)`) mới vào nhánh cảnh báo `OPENING_BELOW_PREVIOUS_CLOSING`; cờ `acknowledgeLowerThanPrevious` → lưu, `gap` âm, audit `acknowledgedLower`. Cuối kỳ < đầu kỳ vẫn 422 `METER_LOWER_THAN_PREVIOUS`. `compute()` thêm cảnh báo cùng mã khi `gap < 0` và không có `exception`. Phát hành phải `acknowledgeWarnings`. OpenAPI có cờ, mã lỗi, mô tả. Test 1.390 < 1.392 có đủ hai bước và FD lưu được |
| 02 | **Closed** | `candidates()`:<br>- `rooms[{roomId, roomNo, opening, closing, nextOpening}]`;<br>- `closing` lấy theo `compute().missing`, nên danh sách và lúc phát hành dùng cùng một kiểm tra;<br>- `readingStatus` tổng hợp gồm cả đầu kỳ;<br>- có đơn `checked_out` với `departure_date >= today − daysAfter`, khớp `billable()`.<br>Thiếu test riêng cho đơn đã trả phòng: Minor BE-190-11 |
| 03 | **Closed** | Đọc trễ:<br>- `lateMaxDays` (mặc định 10, hook kiểm 0–31);<br>- FDL+ kèm `lateReason` qua `freeText`; FD hoặc thiếu lý do → 422 kèm `lateUntil`, `lateNeedsRole`;<br>- cột `late_reason`, `late_approved_by` có CHECK đi cặp; audit `meter_reading.late`; cảnh báo nháp `READING_LATE`.<br>Có test (FD / FDL không lý do / FDL có lý do / `lateMaxDays: 40` → 422) |
| 04 | **Closed** | `excludedLines` (nháp, không cộng tổng; dòng dời không còn sinh cảnh báo `SERVICE_LINE_ON_OTHER_STATEMENT`), `replacesCode`, `readByInitials` (chữ cái đầu, không trả họ tên), `onIssuedStatement` (cùng điều kiện với `voidMeterReading`). Đúng tên FE đã dùng |
| 05 | **Closed** | `payment_billing_period_fk (property_id, billing_period_id) → billing_period (property_id, id)` trong 0099 và `schema/folio.ts`. Thêm thẳng, không qua `NOT VALID`: chấp nhận được, vì mọi dòng cũ null và bảng `payment` nhỏ. MATCH SIMPLE nên dòng null bỏ qua |
| 06 | **Closed** | `PaymentsModule.onApplicationBootstrap` dừng app nếu chưa nối listener. Phần ghi `architecture.md` mục cổng module là **việc của ARC**; ARC tự làm cùng lần cập nhật hợp đồng, không phải thẻ BE |
| 07 | **Open** (trước production) | Không đổi: OPS/QA chạy 0099 trên bản sao staging. Lưu ý: 0099 đã thêm `ALTER TABLE payment ADD CONSTRAINT`, nên lần chạy thử này càng cần |
| 08 | **Closed** | `totals.unreconciledVnd` (khoản thu `pending`/`disputed` chưa đảo), `totals.disputed`. Máy trạng thái phiếu giữ nguyên |
| 09 | Dời (đồng ý) | Nay `candidates()` cũng gọi `compute()` cho mỗi đơn, nên số truy vấn của trang S16 tăng thêm khoảng gấp đôi. Với 10 căn vẫn trong ngân sách p95. Gộp vào việc tối ưu khi có cơ sở thứ hai |

**Sửa migration 0099 tại chỗ:** chấp nhận. 0099 chưa có trên `main` (`origin/main` có 73 dòng journal, tới 0098), chưa chạy ở staging hay production. Journal `idx 73` và snapshot đã cập nhật cùng commit. Sau khi merge thì 0099 khóa lại, sửa nữa phải là 0100.

**Phát hiện thêm của BE:** `PURPOSES_ACCEPTED_NOW` thiếu `meter`, nên trước bản sửa không ai tải được ảnh đồng hồ.
- Đồng ý cách sửa và cách đặt mốc lưu giữ (`setMeterRetentionAnchor` lúc trả phòng, chỉ dời về sau).
- MT tải được ảnh `meter` mà không ghi được lần đọc. Ảnh như vậy không bao giờ được gắn vào lần đọc nào, nên J16 xóa sau `attachment_unbound_days`. Chấp nhận, SEC đã có thẻ riêng.

### Thẻ mới

### FB-R5-ARC-BE-190-10
- Mức độ: Major (điều kiện merge, **không phải lỗi code của PR**)
- Vị trí: CI `format · lint · audit · test · build`, run 44214734614 / job 134501607257, bước 8 "Dependency audit".
- Vấn đề: `pnpm audit --audit-level=high` báo 2 lỗi high. Một là `picomatch` `GHSA-fc5q-39xc-vjpf`, chưa có bản vá ("Patched versions <0.0.0"). Job dừng ở bước 8, nên bước 10–17 (format, lint, typecheck, drizzle, migrate, Vitest, build) **không chạy**. Báo cáo BE ghi các test xanh, nhưng CI chưa xác nhận điều đó trên `f522aa60`. Nhiều khả năng `main` cũng đỏ cùng lý do khi CI chạy lại.
- Vì sao quan trọng: không có tín hiệu test thật cho phần sửa tiền (cảnh báo hai bước, đọc trễ, FK mới trên `payment`).
- Đề xuất sửa:
  1. OPS mở PR riêng vào `main`:
     - nếu picomatch đã có bản vá: nâng phụ thuộc hoặc thêm `pnpm.overrides`;
     - nếu chưa: thêm `GHSA-fc5q-39xc-vjpf` vào `pnpm.auditConfig.ignoreGhsas`, ghi chú ngày hết hạn (gợi ý 30 ngày), lý do (ReDoS ở công cụ build/test, không chạy trên đường xử lý yêu cầu; OPS xác nhận bằng `pnpm why picomatch`), kèm decision-log;
     - xử lý luôn advisory high còn lại cùng cách.
  2. BE merge `origin/main` vào nhánh, CI chạy đủ và xanh trên head mới. Không cần ARC review lại nếu diff chỉ là phần merge.
- Trạng thái: Open

### FB-R5-ARC-BE-190-11
- Mức độ: Minor
- Vị trí: `test/integration/fb-inv-012-statements.test.ts`; `candidates()` nhánh `checked_out`.
- Vấn đề: BE tự nêu: chưa có test cho đơn đã trả phòng còn trong cửa sổ, cần phiếu `final`, xuất hiện trong danh sách ứng viên (và biến mất sau `daysAfter`).
- Đề xuất sửa: thêm một ca vào luồng 20/11 → 20/02 có sẵn:
  - ngày 20/02 sau khi trả phòng: ứng viên tháng 02 có đơn với `kind: final`;
  - ngày 22/02 (quá `daysAfter = 1`): không còn đơn đó.

  Làm được trong lần push gỡ CI (thẻ 10).
- Trạng thái: Open

### Việc của ARC sau lượt này
- Đã cập nhật `rounds/round-05/fb-inv-012/contract.md` (mục "Sửa đổi 18/11"): đầu kỳ nhập mỗi kỳ, cảnh báo hai bước, đọc trễ, bỏ `PRICE_CHANGED_SINCE_DRAFT`, `availableActions` 6 giá trị, các trường thêm, `rooms[]`, hình dạng ghi thu và hủy phiếu, FK.
- Còn lại: ghi cổng listener billing ↔ payments vào `product/docs/architecture.md` (mục cổng module) ở lần ARC sửa kiến trúc kế tiếp.

### Lượt 2 – bổ sung (18/11, phát hiện khi review FE #189 `a34e03be`)

### FB-R5-ARC-BE-190-12
- Mức độ: Major, nhưng **không** đổi kết luận "approve có điều kiện" của PR. ORC chọn: sửa ngay trong #190 trước khi merge (nên làm, nhỏ), hoặc PR kế tiếp trước khi phát hành bản có phiếu tháng.
- Vị trí: `meter-readings.service.ts` `record()`. Lần đọc `checkin` và `room_change_in` chỉ bị kiểm `arrival ≤ readOn ≤ min(today, departure)`. Khóa duy nhất `meter_reading_live_key` theo (đơn, căn, loại, `read_on`).
- Vấn đề:
  - Có thể ghi `checkin` **vào ngày bất kỳ** trong kỳ ở, và **nhiều lần** (mỗi ngày một lần). `openingFor` lấy đầu kỳ mới nhất trong tháng, nên một `checkin` ghi ngày 15 của đơn đã ở từ tháng trước sẽ thành đầu kỳ của tháng đó.
  - Tương tự `room_change_in` không gắn với ngày đổi căn thật (`segment.from`).
  - Đường này đi vòng qua luật đọc trễ (FDL+, có lý do, giới hạn `lateMaxDays`): FD làm được mà không ai duyệt.
  - Hộp "Enter check-in reading" mới của FE làm đường này dễ đi vô tình (FE-189-09).
- Vì sao quan trọng: điện nước nửa đầu tháng không được tính, vì rơi vào `gap`. Sai tiền theo hướng có lợi cho khách và khó thấy khi xem phiếu.
- Đề xuất sửa:
  1. `checkin`: `readOn` ∈ [`arrival`, `arrival + readingWindow.daysAfter`]. Sau đó tới `lateMaxDays` thì FDL+ kèm `lateReason` (cùng cơ chế BE-190-03, cảnh báo `READING_LATE`). Ngoài khoảng → 422 `READING_OUT_OF_WINDOW`.
  2. `room_change_in` / `room_change_out`: `readOn` ∈ [`segment.from`, `segment.from + daysAfter`], trễ hơn thì như mục 1.
  3. Một lần đọc sống cho mỗi (đơn, căn) với `checkin`, và cho mỗi (đơn, căn, đoạn ở) với `room_change_*`. Kiểm trong service, kèm chỉ mục duy nhất từng phần nếu làm được bằng migration mới (0099 đã đóng sau merge; nếu sửa trước merge thì sửa thẳng 0099).
  4. `candidates().rooms[]` thêm `openingKind` (`checkin` / `room_change_in` / `period_start`) và `arrivalDate` / `segmentFrom` để FE biết ô nào cần nhập (FE-189-09).
  5. Test:
     - `checkin` ngày 15 của đơn vào từ tháng trước → 422;
     - `checkin` thứ hai → 409 `READING_EXISTS`;
     - FDL ghi `checkin` trễ có lý do → 201 và nháp có `READING_LATE`.
  6. OpenAPI: mô tả `recordMeterReading` và `rooms[]`. Hợp đồng mục 11.2 thêm dòng này (ARC cập nhật khi BE làm).
- Trạng thái: Open

### Lượt 2 – kiểm BE-190-12 và BE-190-11 (18/11, head `da40f1c7`)

- **BE-190-12: Closed.**
  - `eventDateOf()` gắn mỗi lần đọc với ngày thật: `checkin` = ngày đến, chỉ cho căn nhận lúc đến; `room_change_in` / `room_change_out` = ngày đổi căn, nhiều lần đổi thì lấy lần gần nhất ≤ `readOn`. Căn không có sự kiện đó → 422 `kind: NOT_ALLOWED`.
  - Dùng chung cửa sổ với `period_*` qua hàm `gate()`: cửa sổ [ngày sự kiện, + `daysAfter`]; trễ hơn tới `lateMaxDays` thì FDL+ kèm `lateReason` và cảnh báo `READING_LATE`; ngoài nữa → 422.
  - Mỗi (đơn, căn) chỉ một `checkin` còn hiệu lực: kiểm trong service, có thêm chỉ mục từng phần `meter_reading_checkin_live_key` trong 0099 (chấp nhận vì 0099 chưa merge). `room_change_*`: một lần cho mỗi lần đổi căn, trùng → 409.
  - `rooms[]` có `openingKind` và `segmentFrom`. Test đủ các ca ARC nêu, thêm cả ca INSERT thẳng vướng chỉ mục.
  - ARC đã cập nhật hợp đồng mục 11.2, 11.3, 11.4.
- **BE-190-11: Closed.** Đơn trả phòng 20/02 có trong danh sách ứng viên tháng 02 (`kind: final`) ngày 20 và 21/02, ngày 22/02 thì không còn.
- `roomNames` trên trang in (phần BE của UXD-189-11): chấp nhận. Tên phòng không phải dữ liệu cá nhân. Đọc tên hiện tại nên in lại sau khi đổi tên sẽ ra tên mới; số căn và số tiền không đổi.
- Ghi chú, không thành thẻ: `checkout` chưa gắn cửa sổ. Lần đọc này thuộc bill quyết toán, ngoài phạm vi phiếu tháng. Xem lại khi làm luồng trả phòng của khách dài hạn.
- **Kết luận: APPROVE.** Chỉ còn điều kiện CI xanh đủ bước (BE-190-10, chờ OPS gỡ `pnpm audit`, rồi BE merge `origin/main`). BE-190-07 vẫn là điều kiện trước production.
