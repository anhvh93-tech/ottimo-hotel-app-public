# ARC review – PR BE #194 `r5-fb012-be-qa-fixes` (FB-INV-012, sửa lỗi QA staging)

- Người review: ARC | Round 5 – bước **Review** (sau Kiểm thử) | 18/11/2026
- Head `3751a272`, base `main`. CI: tất cả xanh, gồm `format · lint · audit · test · build` và E2E smoke.
- Đối chiếu:
  - hợp đồng `rounds/round-05/fb-inv-012/contract.md` mục 11.2;
  - bảng lỗi `rounds/round-05/qa/bug-list.md` (BUG-R5-008, 010, 013), theo ghi chú trong `BE-responses.md` trên nhánh.
- Đọc qua `gh pr diff 194` và `git show 3751a272:<file>`, không checkout trong thư mục chung.

## Kết luận: **APPROVE**

Hai thẻ Minor dưới đây không chặn merge; BE sửa trong PR này nếu tiện, hoặc để lần sau.

## 1. BUG-R5-010 – sửa bộ sinh có làm đổi ngầm schema khác không?

**Kết luận: không.** Căn cứ:

1. **Phạm vi của nhánh mới trong `shapeOf()`.** Nhánh chỉ chạy khi `allOf` **không có phần nào là object**: `parts.every(x => x === null)`, và schema không có `properties` riêng.
   - Trước bản sửa, đúng trường hợp này luôn ra `mergeObjects([])`, tức `{k:'object', props:{}, open:false}`: một object rỗng đóng. Serializer gặp shape này thì bỏ giá trị đi.
   - Trường hợp có ít nhất một phần là object đi đường cũ, không đổi.
   - Vậy bản sửa chỉ chạm tới những trường trước đây đã bị sinh **sai** thành object rỗng đóng, không chạm schema đúng nào.
2. **Không còn trường nào sinh sai theo kiểu cũ.** Trong `openapi-schemas.ts` ở `3751a272`, mẫu `k: 'object', props: {}, open: false` còn **0** chỗ. Diff file sinh chỉ có 2 dòng đổi, đều từ object rỗng đóng sang `ref`:
   - `BillingPeriodTotals.unreconciledVnd` → `ref MoneyVnd`;
   - `MeterReadingCreate.periodMonth` → `ref YearMonthText`.
3. **File sinh khớp bộ sinh.** `test/contract.test.ts` chạy `gen-openapi-meta.mjs --check` trong Vitest, và CI xanh. Không thể có schema nào đổi mà không hiện trong diff.
4. **Đổi kiểu `MeterReadingCreate.periodMonth`: không có tác dụng thật.** Đây là schema thân lệnh. `OPENAPI_SCHEMAS` chỉ được serializer phản hồi dùng (`shared/serialization/serializer.ts`). Bằng chứng: test ghi `period_*` có `periodMonth` vẫn xanh trước và sau bản sửa.

`BillingPeriodLine.periodMonth` **không** nằm trong phần sửa. Trường này khai `type: [string, 'null']` nên vẫn sinh là `scalar` và đã có trong phản hồi từ trước. Changelog ghi nhầm tên trường: thẻ 01.

## 2. BUG-R5-008 – luật "đọc trễ theo ngày nhập" có khớp hợp đồng 11.2 không?

**Khớp, và làm rõ đúng ý của 11.2.**
- Hợp đồng viết "đọc sau cửa sổ". Mục đích của luật (BE-190-03, BE-190-12) là chặn lễ tân **nhập sau hạn**, trừ khi FDL+ có lý do.
- Nếu chỉ xét `readOn`, FD lùi ngày `readOn` vào trong cửa sổ là đi vòng được. Đây đúng là lỗi QA bắt được.
- Luật mới trong `gate()`:
  - `readOn` ∈ [from, to] **và** ngày nhập (`pc.today`, ngày nghiệp vụ của cơ sở) ≤ to → mọi vai FD+;
  - ngày nhập ∈ (to, lateUntil] và `readOn` ∈ [from, lateUntil] → chỉ FDL+ kèm `lateReason`, `late = true`, cảnh báo `READING_LATE`;
  - còn lại → 422 `READING_OUT_OF_WINDOW`;
  - `readOn` sau hôm nay → 422 `DATE_INVALID`.
- Luật áp cho cả `period_*`, `checkin`, `room_change_*` qua cùng một `gate()`.
- Test đủ các ca: FD, FDL không lý do, `readOn` tương lai, FDL có lý do, quá `lateUntil`.
- Test cũ ghi đầu kỳ tháng 12 với ngày lùi đã được chuyển vào đúng cửa sổ. Đúng: test đó chính là mẫu lỗi.
- ARC đã sửa câu trong hợp đồng 11.2 cho rõ: trễ hay không **xét theo ngày nhập**, `readOn` chỉ cần nằm trong [from, lateUntil].

Ghi chú, không thành thẻ: `readOn` sau `windowTo` (đồng hồ thật sự đọc trễ) thì lượng dùng từ ngày 01 tới ngày đọc rơi vào cuối kỳ trước. Cảnh báo `READING_LATE` đã nhắc lễ tân xem lại. Đây là cách đã chốt ở BE-190-03.

## 3. BUG-R5-013 – kỳ điện nước và dịch vụ null ở phiếu tháng nhận phòng

**Đúng.**
- `shownPeriod()` trả null khi kỳ kết thúc trước ngày đến. Áp cho cả nháp lẫn cột lưu lúc phát hành.
- Các CHECK của `billing_period` không bắt buộc cột kỳ.
- `view()` với phiếu đã phát hành đã xử lý null (`p(from, to)`).
- Phần tính tiền vẫn dùng kỳ gốc (không có dòng nào), nên số tiền các tháng sau không đổi.
- OpenAPI có mô tả. Hình dạng không đổi (vốn đã `oneOf [DateRange, null]`).

## Thẻ feedback

### FB-R5-ARC-BE-194-01
- Mức độ: Minor
- Vị trí: `product/docs/api/openapi.yaml` (changelog "Sửa sau QA staging 18/11"); `rounds/round-05/responses/BE-responses.md` dòng BUG-R5-010.
- Vấn đề: cả hai chỗ ghi trường thứ hai được sửa là `BillingPeriodLine.periodMonth`. Diff file sinh cho thấy trường thật là `MeterReadingCreate.periodMonth`, một schema thân lệnh, không ảnh hưởng phản hồi. `BillingPeriodLine.periodMonth` đã đúng từ trước.
- Vì sao quan trọng: FE và QA có thể hiểu rằng `periodMonth` trên dòng phiếu trước đây bị mất. Thực tế trường đó luôn có, nên dễ đi tìm một lỗi không tồn tại.
- Đề xuất sửa: sửa tên trường ở hai chỗ, ghi rõ "chỉ `unreconciledVnd` thay đổi phản hồi". Không cần sinh lại file.
- Trạng thái: Open

### FB-R5-ARC-BE-194-02
- Mức độ: Minor
- Vị trí: `product/services/api/scripts/gen-openapi-meta.mjs` `shapeOf()`, nhánh mới (`schema.allOf.length === 1 ? … : { k: 'any' }`).
- Vấn đề:
  - `allOf` có từ 2 phần trở lên, không phần nào là object (ví dụ hai ràng buộc chuỗi), hiện ra `{k:'any'}`: serializer cho mọi giá trị đi qua mà không ai biết. Hiện spec không có trường hợp này (diff chỉ 2 dòng), nhưng sau này có người thêm sẽ không ai thấy.
  - Bộ sinh chưa có unit test cho trường hợp `allOf` bọc kiểu vô hướng. Test hiện tại chỉ chứng minh file sinh khớp bộ sinh, không chứng minh bộ sinh đúng.
- Vì sao quan trọng: serializer là lớp allowlist của phản hồi (SEC). Một shape `any` vô tình làm mất lớp lọc đó.
- Đề xuất sửa:
  - Đổi nhánh nhiều phần thành `throw new Error(\`allOf without object parts needs exactly one part: ${…}\`)`, để người thêm schema phải chọn cách khai rõ.
  - Thêm một ca vào `serializer.test.ts` (hoặc test bộ sinh): schema `{ allOf: [{ $ref: MoneyVnd }], description }` sinh ra `ref MoneyVnd` và giá trị đi qua serializer.
- Trạng thái: Open

## Điểm làm tốt (giữ)
1. Tìm đúng gốc của BUG-R5-010 ở bộ sinh thay vì vá riêng từng trường, và phạm vi sửa hẹp đúng vào trường hợp đã sai.
2. Luật trễ dùng chung một `gate()` cho mọi loại lần đọc, nên không còn chỗ nào xét trễ theo cách khác.
