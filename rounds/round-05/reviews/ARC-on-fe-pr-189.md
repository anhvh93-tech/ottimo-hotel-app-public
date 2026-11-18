# ARC review – PR FE #189 `r5-fb012-fe-statements` (FB-INV-012, khớp với BE #190)

- Người review: ARC | Round 5 – bước **Review** | 17/11/2026
- Phạm vi: **độ khớp hợp đồng FE ↔ BE**. Không review giao diện, brand hay chữ (phần của UXD, CPY).
- Đối chiếu:
  - `rounds/round-05/fb-inv-012/contract.md`;
  - bổ sung INV 17/11 (`04-investor-feedback/FB-INV-012.md`);
  - OpenAPI 0.3.14-draft trên nhánh BE `r5-fb012-be-statements` (`product/docs/api/openapi.yaml`, tag `billing`) và code BE;
  - `product/apps/admin-web/src/app/statements.ts`, `MetersPage.tsx`, `StatementDrawer.tsx` trên nhánh FE.
- CI FE: tất cả xanh, nhưng đang chạy trên mock MSW theo kiểu gõ tay.
- Thẻ BE liên quan: `ARC-on-be-pr-190.md`, các thẻ BE-190-01, 02, 04.

## Kết luận: **CHANGES REQUESTED** (như dự kiến, vì FE merge sau BE)

FE dựng đủ màn hình. Mô hình dữ liệu chỉ số đồng hồ và 3 hình dạng phản hồi lệch BE, nên FE phải đổi trước khi merge:
- thẻ 01, 02, 03 (Major);
- thẻ 05: thay kiểu gõ tay bằng kiểu sinh, là **điều kiện merge**.

Các trường FE "thêm" (`excludedLines`, `replacesCode`, `readByInitials`, `onIssuedStatement`) được giữ, BE bổ sung (BE-190-04).

## 1. Quyết định đặt tên: một tên cho mỗi trường, ai đổi

**Nguyên tắc:**
- OpenAPI trên nhánh BE là chuẩn, vì nó đã sinh `api-client` và có test.
- Khi FE cần một dữ liệu BE chưa có, BE **thêm** đúng tên FE đã dùng, nếu tên đó hợp quy ước.

| Chủ đề | FE #189 hiện tại | BE #190 hiện tại | **Chốt** | PR đổi |
|---|---|---|---|---|
| Đầu kỳ | `electricity.opening` / `water.opening` gửi chung lần đọc cuối kỳ | Lần đọc riêng `kind=period_start` (`periodMonth` = tháng mở), `checkin`, `room_change_in` | **Lần đọc riêng** (mô hình BE), lý do ở thẻ 01 | FE |
| `ReadingKind` | thiếu `period_start` | `checkin, period_start, period_end, room_change_out, room_change_in, checkout` | Theo BE | FE |
| Số cuối kỳ trước (tham khảo) | `electricity.previousClosing: number` (theo từng đồng hồ) | `previousClosing: {readingId, readOn, electricity, water} \| null` ở cấp lần đọc, chỉ có trên lần đọc đầu kỳ | Theo BE | FE |
| Hao hụt | `electricity.gap` | `gap: {electricity, water} \| null` (lần đọc đầu kỳ) | Theo BE | FE |
| Tiêu thụ | `electricity.consumption` | `consumption: {fromReadingId, electricity, water} \| null` (lần đọc cuối kỳ) | Theo BE | FE |
| Giờ nhập | `readAt` | `createdAt` | `createdAt` | FE |
| Người nhập | `readByInitials` | chỉ `readByRole` | **`readByInitials`** (thêm, giữ `readByRole`) | BE (BE-190-04) |
| Lần đọc đã lên phiếu | `onIssuedStatement` | không có | **`onIssuedStatement`** (thêm) | BE (BE-190-04) |
| Hủy lần đọc | `voidedAt`, `voidReason` | `voided`, `voidedAt`, `voidReason` | Theo BE (có cả `voided`) | FE |
| Đầu kỳ < cuối kỳ trước | cảnh báo phía client, vẫn gửi | 422 `METER_LOWER_THAN_PREVIOUS` | **Hai bước**: 422 `OPENING_BELOW_PREVIOUS_CLOSING`, gửi lại với `acknowledgeLowerThanPrevious: true` thì lưu (FD+). Xem thẻ 02 | **Cả hai** (BE-190-01, FE-189-02) |
| Cuối kỳ < đầu kỳ | hộp 3 lựa chọn BR-LS-12 | 422 `METER_LOWER_THAN_PREVIOUS`, ngoại lệ FDL+ | **Giữ chặn** (BR-LS-12), như hiện tại | Không đổi |
| Căn của ứng viên | `candidate.roomId` (một căn) | chỉ `roomNos` | **`rooms: [{roomId, roomNo, opening, closing, nextOpening}]`** (thêm, giữ `roomNos`) | BE (BE-190-02), FE đọc `rooms[]` |
| Nháp của ứng viên | `draftBillingPeriodId` | `draftId` | `draftId` | FE |
| `readingStatus` | `missing \| recorded \| exception` | thêm `not_needed` | Theo BE | FE |
| Ứng viên: mã đơn, loại | không có | `reservationCode`, `kind` | Theo BE | FE (dùng nếu cần) |
| `availableActions` | `update, issue, void, record_payment, print, prior_adjustment` | đúng 6 giá trị đó trong enum | **Đã khớp**, FE không phải "thêm". ARC cập nhật hợp đồng 5.1 | Không đổi (ARC sửa hợp đồng) |
| Dòng dịch vụ đã dời | `excludedLines: StatementLine[]` | chỉ `excludedFolioLineIds` | **`excludedLines`** (thêm, nháp; đã phát hành `[]`) + giữ `excludedFolioLineIds` | BE (BE-190-04) |
| Mã phiếu bị thay | `replacesCode` | chỉ `replacesId` | **`replacesCode`** (thêm) | BE (BE-190-04) |
| `voidReason`, `version` | có | có | Đã khớp | Không đổi |
| Kết quả ghi thu | `BillingPeriod` | `{billingPeriod, payment}` | Theo BE | FE |
| Kết quả hủy phiếu | `{billingPeriod, canReplace}` | `BillingPeriod` phẳng + `canReplace` (`BillingPeriodVoided`) | Theo BE | FE |
| Mã cảnh báo | có `PRICE_CHANGED_SINCE_DRAFT` | không có | **Bỏ** `PRICE_CHANGED_SINCE_DRAFT`. Thêm `OPENING_BELOW_PREVIOUS_CLOSING`, `READING_LATE` (BE-190-01, 03) | FE + BE |
| `BillingPeriodSummary` | thiếu `reservationId`, `kind` | có | Theo BE | FE |
| Mục đích ảnh | ép kiểu `'meter' as AttachmentPurpose` | enum upload có `meter` | Bỏ ép kiểu sau khi sinh lại (thẻ 06) | FE |

## 2. Thẻ feedback

### FB-R5-ARC-FE-189-01
- Mức độ: Major
- Vị trí: `app/statements.ts` (`MeterValue.opening`, `MeterInput.opening`, `ReadingKind`); `pages/longstay/MetersPage.tsx` (bảng cuối tháng, dòng 168–240; tab lịch sử dòng 675).
- Vấn đề: FE gửi đầu kỳ và cuối kỳ **trong cùng một lần đọc** `period_end`. BE (theo INV 17/11) coi đầu kỳ là **một lần đọc riêng**:
  - `period_start` của tháng M, đọc trong cửa sổ cuối tháng M−1 → ngày 01 M;
  - hoặc `checkin` / `room_change_in`;
  - mỗi lần đọc có ngày, ảnh, người nhập riêng.

  Gửi `opening` ở cuối tháng M cũng làm mất ý của INV. Khoảng trống INV muốn bắt nằm **giữa** lần chốt kỳ trước và lần mở kỳ này. Gõ cả hai số cùng một lúc vào cuối kỳ thì không bắt được gì.
- Vì sao quan trọng: BE sẽ từ chối body (`electricity.opening` không có trong `MeterValueInput`). Tiêu thụ tính tiền và `gap` bị tính sai chỗ.
- Đề xuất sửa:
  - **Bảng cuối tháng M (S12):** mỗi `rooms[]` của ứng viên là một hàng, gồm hai nhóm ô:
    1. **Closing {M}** (`period_end`, `periodMonth=M`). Hiện chỉ đọc "Opening {M}" lấy từ lần đọc đầu kỳ đã có, và tiêu thụ xem trước.
    2. **Opening {M+1}** (`period_start`, `periodMonth=M+1`):
       - ô **bắt buộc**, **không điền sẵn**;
       - hiện `previousClosing` (= số cuối vừa nhập) làm tham chiếu;
       - hiện `gap` xem trước.

    Lưu = **2 POST** với 2 `Idempotency-Key`.
  - **Ảnh:** một tệp chỉ gắn được một bản ghi (`attachment.bindTo`, quy tắc cũ "một tệp, một bản ghi"). Khi hai lần đọc dùng cùng ảnh, FE tải lên hai lần, tạo 2 attachment. Không đổi BE.
  - **Tháng nhận phòng:** không có `period_start` (BE trả `NOT_ALLOWED`). Đầu kỳ là lần đọc `checkin`. Ô "Opening" ở tab Meters của đơn gửi `kind=checkin`.
  - **Lịch sử:** đọc `previousClosing`, `gap` trên lần đọc đầu kỳ và `consumption` trên lần đọc cuối kỳ (cấp lần đọc, không theo từng đồng hồ).
  - **Hàm `meterUsage` phía client:** giữ làm số xem trước. Số hiển thị sau khi lưu phải là `consumption` server trả về.
- Trạng thái: Open

### FB-R5-ARC-FE-189-02
- Mức độ: Major
- Vị trí: `MetersPage.tsx` dòng 334–375 (cảnh báo `opening_below_last` phía client), dòng 240 (bắt `METER_LOWER_THAN_PREVIOUS`), hộp `LowerDialog` dòng 482+.
- Vấn đề: FE cảnh báo đầu kỳ < cuối kỳ trước rồi vẫn gửi. BE hiện trả 422 và không lưu. ARC đã chốt một cách xử lý (BE-190-01). FE phải theo cùng cách đó.
- Vì sao quan trọng: nếu hai bên không cùng một luồng thì lễ tân bấm Lưu và nhận lỗi không ai giải thích.
- Đề xuất sửa:
  1. **Cuối kỳ < đầu kỳ:** giữ hộp BR-LS-12 hiện có:
     - Nhập sai → sửa số;
     - Thay đồng hồ hoặc Quay vòng → chỉ FDL+, FD thấy "Ask the front desk lead".

     Server vẫn 422 `METER_LOWER_THAN_PREVIOUS` nếu không có `exception`.
  2. **Đầu kỳ < cuối kỳ trước:** khi server trả 422 `OPENING_BELOW_PREVIOUS_CLOSING` (hoặc client thấy trước), mở hộp cảnh báo:
     - nêu số cuối trước (`previousValue`);
     - 3 lựa chọn: *Nhập sai* (sửa số), *Thay đồng hồ* (FDL+, gửi `exception`), *Vẫn lưu* (mọi vai, gửi lại cùng body với `acknowledgeLowerThanPrevious: true` và **Idempotency-Key mới**).
  3. **Ngăn phiếu nháp:** hiện cảnh báo `OPENING_BELOW_PREVIOUS_CLOSING` trong danh sách cảnh báo phải xác nhận trước khi phát hành, như `METER_ANOMALY`.
  4. Câu chữ hướng nhân viên (EN dẫn, VI hỗ trợ, không emoji) do UXD/CPY duyệt.
- Trạng thái: Open

### FB-R5-ARC-FE-189-03
- Mức độ: Major
- Vị trí: `app/statements.ts`: `BillingCandidate`, `recordBillingPeriodPayment`, `voidBillingPeriod` / `VoidResult`, `BillingPeriodSummary`; `StatementDrawer.tsx` dòng 397–601; `mocks/statements.ts`.
- Vấn đề: 3 hình dạng phản hồi khác BE:
  - ghi thu: BE trả `{billingPeriod, payment}`, FE đọc như `BillingPeriod`;
  - hủy phiếu: BE trả `BillingPeriod` phẳng cộng `canReplace`, FE đọc `out.billingPeriod`;
  - ứng viên: BE dùng `draftId`, `rooms[]` (sau BE-190-02), có `not_needed`; FE dùng `draftBillingPeriodId`, `roomId`.

  Mock MSW đang trả đúng hình dạng FE tự đặt, nên test FE xanh mà lên máy thật sẽ hỏng.
- Vì sao quan trọng: lên staging thì sau khi ghi thu hoặc hủy, ngăn phiếu sẽ trắng hoặc lỗi `undefined`.
- Đề xuất sửa:
  - Đổi theo bảng mục 1.
  - Sửa `mocks/statements.ts` cho đúng hình dạng OpenAPI. Thêm một test vitest kiểm mock theo schema sinh (`openapi-schemas`), để mock không lệch nữa.
- Trạng thái: Open

### FB-R5-ARC-FE-189-04
- Mức độ: Minor
- Vị trí: `app/statements.ts` (`excludedLines`, `replacesCode`, `voidReason`, `version`, `availableActions`); `StatementDrawer.tsx` dòng 213–365.
- Vấn đề: không phải lỗi, ghi lại để khỏi hiểu nhầm:
  - `availableActions` (6 giá trị), `voidReason`, `version` đã có trong BE;
  - `excludedLines`, `replacesCode` BE sẽ thêm (BE-190-04) đúng tên FE đã dùng.

  Riêng `excludedLines` đang khai báo là tùy chọn (`?`).
- Đề xuất sửa:
  - Sau khi BE thêm trường, bỏ `?`, dùng `[]` mặc định.
  - Nút "đưa lại" gửi `excludedFolioLineIds` mới (bỏ id đó), như đang làm.
- Trạng thái: Open

### FB-R5-ARC-FE-189-05
- Mức độ: Minor (**điều kiện merge**)
- Vị trí: `app/statements.ts` (toàn bộ interface gõ tay, `apiClient.request` gọi theo chuỗi đường dẫn).
- Vấn đề: kiểu gõ tay là cách tạm hợp lý khi làm song song. Nhưng nếu merge như vậy thì hợp đồng có hai nguồn, và lệch kiểu thẻ 03 sẽ lặp lại.
- Đề xuất sửa: sau khi BE #190 merge, FE merge `origin/main` vào nhánh rồi làm trong **cùng PR này**:
  - thay interface bằng `ResponseOf<'getBillingPeriod'>`, `BodyOf<'recordMeterReading'>`… từ `@ottimo/api-client`;
  - chuyển hàm gọi vào `endpoints.ts`;
  - xóa `statements.ts` phần kiểu, giữ phần tiện ích (`monthOf`, `shiftMonth`, `statusTone`, `meterUsage`).

  `npm run typecheck` sẽ chỉ ra mọi chỗ lệch còn lại. PR FE không merge khi còn kiểu gõ tay cho các operation đã có trong OpenAPI.
- Trạng thái: Open

### FB-R5-ARC-FE-189-06
- Mức độ: Minor
- Vị trí: `app/statements.ts` `uploadMeterPhoto` (`'meter' as AttachmentPurpose`).
- Vấn đề: enum `purpose` của operation upload trong OpenAPI nhánh BE đã có `meter`. Ép kiểu sẽ che lỗi nếu sau này enum đổi.
- Đề xuất sửa:
  - Sau khi sinh lại client, bỏ `as`.
  - Nếu kiểu `AttachmentPurpose` xuất ra từ `api-client` vẫn thiếu `meter` (union khai riêng), báo BE sửa schema dùng chung thay vì ép kiểu ở FE.
- Trạng thái: Open

### FB-R5-ARC-FE-189-07
- Mức độ: Minor
- Vị trí: `app/statements.ts` `StatementWarning.code`; nơi hiện cảnh báo trong `StatementDrawer.tsx`.
- Vấn đề:
  - union có `PRICE_CHANGED_SINCE_DRAFT` (ARC rút khỏi hợp đồng);
  - thiếu `OPENING_BELOW_PREVIOUS_CLOSING`, `READING_LATE` (BE-190-01, 03);
  - `BillingWarning` trong OpenAPI là `code: string` + `additionalProperties`.
- Đề xuất sửa:
  - Cập nhật union.
  - Thêm nhánh mặc định: mã lạ thì hiện câu chung "Check this statement before issuing" và vẫn bắt xác nhận. Server thêm mã mới thì FE không vỡ.
- Trạng thái: Open

### FB-R5-ARC-FE-189-08
- Mức độ: Suggestion
- Vị trí: `MetersPage.tsx` (tính `gap` và tiêu thụ phía client), `meterUsage`.
- Vấn đề: công thức thay đồng hồ và quay vòng đang lặp lại ở client và `statement-math.ts`. Server bỏ phần lẻ **ở số nhập** (38,67 → 38,6, BR-LS-11) trước khi trừ. Nếu `parseMeter` của FE chưa bỏ phần lẻ ở số nhập thì số xem trước có thể khác server 0,1 m³.
- Đề xuất sửa:
  - `parseMeter` cắt số nước về 1 số lẻ ở số nhập (cắt chuỗi hoặc theo đơn vị phần mười, tránh lỗi số thực).
  - Giữ `Math.round(raw * 10) / 10` cho hiệu số.
  - Ghi nhãn "preview". Sau khi lưu chỉ hiện số server trả về.
- Trạng thái: Open

## Điểm làm tốt (giữ)
1. Nút hiện theo `availableActions` của server, không tự suy quyền. FD không thấy lựa chọn thay đồng hồ, quay vòng, và thấy câu chuyển cho lễ tân trưởng. Đúng hợp đồng mục 4 và 6.
2. Ghi lại rõ ở đầu `statements.ts` rằng đây là kiểu tạm chờ client sinh, kèm lý do theo INV 17/11. Dễ thay khi BE merge.
3. Màu quá hạn chỉ dùng bảng 80/15/5 (Earth Brown, không thêm đỏ), đúng hợp đồng 6.1 và brand.

---

## Lượt 2 – 18/11/2026 (FE head `a34e03be`, đối chiếu BE `f522aa60`)

- Đầu vào:
  - `rounds/round-05/responses/FE-responses.md` (nhánh PR);
  - `git show a34e03be:` các file `app/statements.ts`, `pages/longstay/MetersPage.tsx`, `MeterCheckinDialog.tsx`, `__tests__/fb012-mock-schema.test.ts`;
  - OpenAPI nhánh BE `f522aa60` và hợp đồng mục 11.
- Không checkout trong thư mục chung.

### Kết luận lượt 2: **APPROVE CÓ ĐIỀU KIỆN**

- Phần khớp hợp đồng đã đạt: thẻ 01, 02, 03, 04, 07, 08 đóng.
- **Điều kiện merge:**
  1. BE #190 merge trước;
  2. FE làm xong **05** (kiểu sinh từ `@ottimo/api-client`) và **06** (bỏ ép kiểu `meter`);
  3. sau khi merge `origin/main`, test `fb012-mock-schema` phải **chạy thật**, không bị bỏ qua (`skipIf(!ready)`), và xanh;
  4. CI đủ bước xanh.
- Job `format · lint · audit · test · build` trên `a34e03be` đỏ ở bước "Dependency audit", **cùng nguyên nhân với BE** (advisory picomatch `GHSA-fc5q-39xc-vjpf`, xem BE-190-10). Không do PR này gây ra, nhưng test FE chưa chạy trên CI ở head này.
- Thẻ mới FE-189-09 (Minor) phụ thuộc thẻ BE mới BE-190-12. Không chặn merge FE nếu BE-190-12 chưa xong, xem dưới.

### Kiểm từng thẻ

| Thẻ | Kết quả | Bằng chứng (a34e03be) |
|---|---|---|
| 01 | **Closed** | `ReadingKind` có `period_start`. `MeterInput` chỉ còn `value`, `exception` (đúng `MeterValueInput`). `MeterReading` có `previousClosing`, `gap`, `consumption` ở cấp lần đọc. S12 theo `candidate.rooms[]`:<br>- **Closing M** = `period_end`, `periodMonth=M`;<br>- **Opening M+1** = `period_start`, `periodMonth=M+1`, ô bắt buộc không điền sẵn, tham chiếu = số cuối đã lưu hoặc đang gõ;<br>- hiện khi `nextOpening ≠ not_needed`;<br>- 2 lần tải ảnh, 2 POST, 2 key.<br>Đầu kỳ M nhận `period_start` M hoặc `checkin`/`room_change_in` trong M (khớp `openingFor`) |
| 02 | **Closed** | Cuối < đầu → hộp BR-LS-12 (FD chỉ "Nhập sai"). Đầu < cuối trước → hộp 3 lựa chọn, kể cả khi server trả 422 `OPENING_BELOW_PREVIOUS_CLOSING` (đọc `previousValue`). "Vẫn lưu" gửi `acknowledgeLowerThanPrevious: true`; `renewKey()` sau mọi 4xx. Đọc trễ: FD bị khóa nút Lưu và được nhắc lễ tân trưởng, FDL+ gửi `lateReason` ≥ 3 ký tự. Cảnh báo `OPENING_BELOW_PREVIOUS_CLOSING`, `READING_LATE` có trong danh sách phải xác nhận |
| 03 | **Closed** | Ghi thu `{billingPeriod, payment}`; hủy phiếu `BillingPeriod` phẳng + `canReplace`; ứng viên `draftId`, `rooms[]`, `reservationCode`, `kind`, `not_needed`; `BillingPeriodSummary` có `reservationId`, `kind`. `fb012-mock-schema.test.ts` duyệt `$ref` của spec và bắt trường thiếu / sai kiểu / không khai báo. Có ca tự kiểm bộ kiểm (checker). FE báo 2/2 xanh với spec `f522aa60`; ARC đọc code test, chưa tự chạy |
| 04 | **Closed** | `excludedLines` bắt buộc, `replacesCode` đọc từ BE. "Đưa lại" vẫn gửi `excludedFolioLineIds` |
| 05 | Open (điều kiện merge, chờ BE merge) | Kế hoạch đúng: merge `origin/main`, không rebase, rồi dùng `ResponseOf`/`BodyOf` |
| 06 | Open (chờ BE merge) | Cùng đợt với 05 |
| 07 | **Closed** | `code: string` + trường mở, `KNOWN_WARNINGS` có 6 mã, mã lạ → `stmt.warning.unknown` và vẫn phải xác nhận |
| 08 | **Closed** | `parseMeter` cắt theo chuỗi (điện số nguyên, nước 1 số lẻ). Hiệu số vẫn `Math.round(x * 10) / 10`. Số trước khi lưu ghi "(xem trước)", sau khi lưu hiện `consumption` của server |

**Hộp "Enter check-in reading" (mới, ghi chú 1 của FE):**
- Luồng đúng hợp đồng 11.1–11.2:
  - một POST `kind=checkin`;
  - thấp hơn số cuối của căn → cảnh báo hai bước;
  - ảnh tải lên cho lần gửi bị 422 được dùng lại. Đúng: ảnh chỉ gắn sau khi INSERT thành công, giao dịch bị 422 thì chưa gắn.
- Có một lỗ ở **điều kiện hiện nút**: nút hiện khi hàng tháng M chưa có cả đầu kỳ lẫn cuối kỳ (`!openM && !closeM`). Đơn ở từ trước tháng M mà quên `period_start` M cũng rơi vào trường hợp này. Lễ tân có thể bấm "Enter check-in reading" và ghi một lần `checkin` giữa tháng, BE hiện nhận (xem BE-190-12). Kết quả: phần dùng từ ngày 01 tới ngày đó thành `gap`, không tính khách, và đi vòng qua luật đọc trễ.

### Thẻ mới

### FB-R5-ARC-FE-189-09
- Mức độ: Minor (làm sau khi BE-190-12 có `openingKind`)
- Vị trí: `MetersPage.tsx`, điều kiện hiện nút `meters.checkin_enter` (`!openM && !closeM`); `MeterCheckinDialog.tsx` (khoảng ngày `min = 01/M`).
- Vấn đề: nút nhập chỉ số nhận phòng hiện cả với đơn **không** nhận phòng trong tháng M. Mock chặn "một `checkin` mỗi đơn", còn BE chưa chặn, nên mock và server đang khác nhau.
- Vì sao quan trọng: lễ tân có thể vô tình dời đầu kỳ vào giữa tháng, và khách không trả phần điện nước nửa đầu tháng.
- Đề xuất sửa:
  - Chỉ hiện nút khi `room.openingKind === 'checkin'` (trường BE thêm ở BE-190-12).
  - Với `openingKind === 'period_start'` mà còn thiếu: hiện ô "Opening M" theo luật đọc trễ (FDL+ kèm lý do), hoặc câu "Ask the front desk lead" như ô cuối kỳ.
  - Ngày mặc định của hộp = `arrivalDate` (BE trả trong `rooms[]` hoặc ứng viên).
  - Mock theo đúng luật BE sau khi BE sửa.
- Trạng thái: Open

Thẻ chéo cho BE: **FB-R5-ARC-BE-190-12** ghi trong `ARC-on-be-pr-190.md` (phần "Lượt 2 – bổ sung").
