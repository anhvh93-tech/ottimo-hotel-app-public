# UXD review – v1.0.4 PR #70: BUG-R4-037, giá bản xem Trực tiếp còn trong ô sau khi đổi kênh, căn, ngày ở H09 (FE-B)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** (nhanh, hotfix P0) | 04/11/2026
- Đối tượng: `gh pr diff 70`, nhánh `v104/fix-booking-rate-carryover`, head `822094b7`. Tệp mã: `pages/booking/BookingDialog.tsx`. Đọc kèm báo cáo FE `rounds/round-04/outputs/FE/bug-r4-037-booking-rate-carryover.md` và test `v104-booking-rate-carryover.test.tsx`.
- Phạm vi UXD: giao diện và chữ của hộp Đặt phòng mới. Logic khóa bản xem (`ratesFor`, `calcFor`) do ARC/QA xem.
- Đối chiếu:
  - `packages/ui/src/Button.tsx` (`busy`, `busyLabel`);
  - `design-system.md` C1 (Button), C3 (Field), mục 7 dòng 558 (Đang tải);
  - review của UXD cho PR #67 (`UXD-on-v104-pr67-minibar.md`), là tiền lệ dùng `common.loading`;
  - `strings-vi.json` / `strings-en.json`;
  - sổ tay `guides/02-le-tan.md` mục 5.1, 5.3;
  - `pricing.service.ts` 278 (Nội bộ nhận 0) và 321–337 (OTA không gửi giá);
  - `rounds/round-04/outputs/DOM/inv-price-switch-guide.md` B6.
- Không chạy app, không xem ảnh. Kiểm bằng đọc mã (số dòng theo tệp ở `822094b7`) và test của PR.

## Kết luận: ĐẠT CÓ ĐK

Bốn điểm ORC hỏi đều ổn cho bản hotfix (bảng dưới). Còn **1 thẻ Major** (FB-01), vì bản sửa làm "ô OTA để trống" thành trạng thái thường gặp:
- nếu cơ sở chưa có `ota_base_rate`, máy chủ trả 422 `nightlyRates REQUIRED`;
- Desk không hiện câu lỗi nào cho lỗi này.

**Điều kiện:** một trong hai việc sau, ORC chọn.
- (a) Ưu tiên: FE-B thêm 1 nhánh trong `handleError` ngay ở PR này. Không thêm khóa, cherry-pick vẫn sạch.
- (b) OPS/INV xác nhận production đã có `ota_base_rate` cho mọi nhóm căn trước khi phát hotfix, và FE làm (a) trước khi cắt v1.0.4.

Ba thẻ Minor và một thẻ Suggestion, dời v1.0.5 được. Không có ESC.

| Điểm ORC hỏi | Kết quả |
|---|---|
| 1. Nút **Tạo đơn** chờ (DS `busy` + `common.loading`) tới khi bản xem đúng lượt ở về | **Đúng DS.** Dùng `busy`/`busyLabel` của `Button` (dòng 838–841): nút tự khóa, có `aria-busy`, spinner `.spin` thay chữ. Không thêm lớp, màu hay `style=`. Nhãn đổi theo DS 558 ("nút đang xử lý đổi chữ"). Nút khóa có chữ nói vì sao, đúng C1. Khi đang lưu (`busy === 'create'`) vẫn dùng nhãn lưu cũ, nên hai trạng thái không lẫn. `submit` cũng chặn khi bấm Enter (dòng 642). Giống hệt mẫu UXD đã duyệt ở #67. Giữ `common.loading`, không cần khóa mới. Ghi chú: nút chớp "Đang tải…" ít nhất 300 ms mỗi lần đổi căn, ngày hay kênh. Việc này đúng sự thật (chưa có giá để gửi) và nằm trong ngưỡng "> 300 ms" của DS 558, nên chấp nhận |
| 2. Có ô đã gõ mà còn đêm trống → `booking.error.rate_empty` | **Hợp ngữ cảnh, dùng được cho hotfix.** Câu "Nhập giá mỗi đêm (lớn hơn 0)." / "Enter a rate per night (above 0)." chỉ hiện sau khi lễ tân tự gõ hoặc tự xóa một ô. Đó là thao tác có chủ ý, nên câu không còn "đổ oan" như ca QA ghi ở BUG-R4-037. Với OTA, câu khớp sổ tay 5.3 bước 4 ("Nhập giá từng đêm theo extranet"). Câu ngắn, ra lệnh rõ, không đổ lỗi. Còn ba chỗ chưa trọn (thẻ FB-03, v1.0.5): "(lớn hơn 0)" thừa khi ô trống; câu không chỉ đêm nào trống; với OTA không nói "hoặc để trống hết" |
| 3. Ô giá chuyển từ "có số" sang "trống" ngay khi đổi kênh, căn, ngày | **Lễ tân hiểu được, không cần gợi ý trong hotfix.** Ba trường hợp: (i) Trực tiếp/CTV đổi căn hay ngày: ô trống ngắn, nút nói "Đang tải…", rồi bản xem điền lại. Trống vẫn tốt hơn hiện số của căn cũ. (ii) Sang OTA: ô trống mời lễ tân gõ giá theo extranet, đúng sổ tay 5.3. Bản cũ điền sẵn giá Trực tiếp nên làm lễ tân bỏ qua bước này, đó chính là lỗi. (iii) Sang Nội bộ: đã có câu `bk.internal_help` "không tính doanh thu" (dòng 1163), nên ô trống khớp nghĩa. Hai chỗ cần làm thêm: trong lúc chờ, cột Nguồn giá và bảng tổng vẫn là của lượt ở trước (FB-02); ô OTA trống chưa có câu nói "để trống thì tính theo lịch OTA" (FB-03) |
| 4. Hộp gợi ý căn khác cho đơn OTA chưa gõ giá hiện 0 đ mỗi đêm; FE đề xuất câu "giá theo lịch OTA" ở v1.0.5 | **Đồng ý, v1.0.5.** Không gửi số nào sai, nên không chặn hotfix. Cần lưu ý: sau bản sửa, ca này **thành ca thường gặp**. Trước đây ô OTA hay mang số Trực tiếp, nay hầu như luôn trống. Hộp tiêu đề "xem giá trước khi tạo đơn" mà ghi "Tổng tiền đơn 0 đ" thì dễ làm lễ tân dừng lại hỏi. Đưa lên đầu danh sách v1.0.5. Câu đề xuất ở FB-04 |
| Brand | **Đạt.** Không màu, không lớp CSS, không khóa chữ mới. Chỉ dùng component DS và khóa có sẵn, VI/EN không emoji |

---

### FB-R4-UXD-FE-PR70-01
- Mức độ: **Major** (điều kiện của ĐẠT CÓ ĐK)
- Vị trí: `BookingDialog.tsx`, `handleError`, nhánh `VALIDATION_FAILED` (dòng 607–635). Liên quan: `body` (dòng 514–523), nút "Tạo đơn ở căn …" (`submit(undefined, { roomId })`, dòng 643 bỏ `validate`).
- Vấn đề:
  - Sau bản sửa, đơn OTA mà lễ tân không gõ giá sẽ không gửi `nightlyRates`. Đây là trạng thái mặc định khi chuyển từ Trực tiếp sang OTA.
  - Nếu nhóm căn chưa có `ota_base_rate`, máy chủ trả 422 `{ field: 'nightlyRates', code: 'REQUIRED' }` (`pricing.service.ts` 321–327).
  - `handleError` ghi lỗi vào `out['nightlyRates']`. Nhưng hộp chỉ hiện `errors.rates` (dòng 1263, 1324) và `errors['nightlyRates[i].amountVnd']`, không hiện `errors.nightlyRates`. Vì `out` có khóa nên `requestError` cũng không được đặt.
  - Kết quả: nút quay về "Tạo đơn" mà **không có câu nào**. Lễ tân bấm lại vẫn vậy. Đường "Tạo đơn ở căn …" của hộp gợi ý căn cũng thế.
  - Không chắc production đã có `ota_base_rate`: DOM ghi "hoặc chưa nhập" ở `pricing-spec-2026-11-01-reconcile.md` B6, và hướng dẫn `inv-price-switch-guide.md` B6 bảo chủ đầu tư "Không thấy dòng này thì bỏ qua".
  - Báo cáo FE mục 2 lưu ý 3 có nói tới 422 này, nhưng lễ tân không thấy 422 trên màn hình.
- Vì sao quan trọng:
  - Hotfix có thể đổi một lỗi sai tiền thành một lỗi im lặng: không tạo được đơn OTA mà không biết vì sao, đúng lúc lễ tân cần nhập đơn OTA "ngay" (sổ tay 5.3).
  - Trái DS mục 7: lỗi nghiệp vụ phải hiện tại chỗ, kèm cách sửa.
  - Cách làm tạm cho v1.0.3 ("xóa trống mọi ô") cũng rơi vào đường này.
- Đề xuất sửa:
  - FE-B, ngay ở PR này: trong nhánh `VALIDATION_FAILED`, khi `fe.field` (bỏ tiền tố `body.`) là `nightlyRates` và `code` là `REQUIRED` hoặc `AMOUNT_NOT_POSITIVE`, ghi `out.rates = t('booking.error.rate_empty')`.
    - Câu "Nhập giá mỗi đêm (lớn hơn 0)." nói đúng cách sửa: gõ giá OTA từng đêm theo extranet.
    - Không thêm khóa. Thêm 1 ca test: OTA để trống, máy chủ mock trả 422 `nightlyRates REQUIRED`, câu hiện dưới bảng giá.
  - OPS/DOM (ORC giao): kiểm production đã có `ota_base_rate` cho mọi nhóm căn đang bán. Sửa câu B6 trong `inv-price-switch-guide.md`: chưa có dòng này thì phải nhập, không bỏ qua.
  - v1.0.5: dùng câu riêng cho OTA (FB-03).
- Trạng thái: Open

### FB-R4-UXD-FE-PR70-02
- Mức độ: Minor (v1.0.5)
- Vị trí: `BookingDialog.tsx`. Cột Nguồn giá (dòng 1298, `calc ? … : '–'`) và bảng tổng (dòng 1364, `directLike && calc && !longStay`). Trong lúc `priceWaiting`.
- Vấn đề:
  - Khi Trực tiếp/CTV đổi căn, ngày hay kênh, ô giá trống ngay. Nhưng `calc` vẫn là bản xem của lượt ở trước, cho tới khi bản xem mới về (ít nhất 300 ms cộng thời gian gọi).
  - Trong khoảng đó, cạnh ô trống, cột Nguồn giá vẫn ghi "Giá niêm yết (BR-101)". Bảng tổng vẫn hiện "Tổng tiền đơn" và cọc của căn cũ. Ví dụ: tổng của căn 101 trong khi ô của căn 203 đang trống.
  - Bản cũ sai đồng bộ (ô và tổng cùng của căn cũ). Bản mới đúng ở ô nhưng tổng lệch ô.
- Vì sao quan trọng: không sai tiền, vì nút đang chờ và không gửi gì. Nhưng nếu lễ tân đọc tổng cho khách đúng lúc đó (khách hỏi qua điện thoại khi lễ tân vừa đổi căn), lễ tân sẽ báo số của căn khác.
- Đề xuất sửa (FE, không cần khóa mới):
  - Khi `priceWaiting`: cột Nguồn giá hiện "–"; bảng tổng hiện "–" ở các ô tiền, hoặc ẩn tới khi `calcFor === liveKey`.
  - Gắn `aria-busy="true"` cho `.rate-table` và bảng tổng, theo DS 558.
  - Không thêm spinner giữa trang, vì nút chính đã nói "Đang tải…".
- Trạng thái: Open

### FB-R4-UXD-FE-PR70-03
- Mức độ: Minor (v1.0.5, UXD cấp khóa trước)
- Vị trí: bảng Giá mỗi đêm khi kênh OTA/Nội bộ. Câu `booking.error.rate_empty` (dòng 482–493).
- Vấn đề:
  - Ô OTA trống không có câu nào nói hệ quả. Lễ tân mới không biết để trống thì Desk tính theo lịch giá OTA, còn gõ một phần thì bị chặn.
  - `rate_empty` dùng chung cho 3 ca: ô bằng 0, OTA gõ thiếu đêm, Trực tiếp có ô bị xóa. Ở hai ca sau, "(lớn hơn 0)" thừa. Câu cũng không chỉ đêm nào trống, vì chỉ khung `.field` có lớp `invalid`, từng ô trống không có `aria-invalid`.
  - Nội bộ: gõ 0 thì bị báo "(lớn hơn 0)", trái với `bk.internal_help` "không tính doanh thu". Lỗi này có từ trước bản sửa, báo cáo FE mục 2 lưu ý 2 đã ghi. Máy chủ nhận 0 cho Nội bộ (`zeroOk`).
- Vì sao quan trọng: sau bản sửa, ô trống trên OTA là trạng thái thường gặp. Câu gợi ý giúp lễ tân chọn đúng một trong hai cách (gõ đủ, hoặc để trống hết) ngay lần đầu.
- Đề xuất sửa (UXD cấp khóa trong `gen_strings.py`, FE gắn):

  | Khóa mới | VI | EN | Chỗ dùng |
  |---|---|---|---|
  | `bk.rate_help_ota` | Gõ giá từng đêm theo extranet. Để trống mọi đêm thì Desk tính theo lịch giá OTA của kênh. | Enter each night's rate from the extranet. Leave every night empty to use the channel's OTA calendar rate. | `.help` dưới bảng giá, chỉ khi kênh OTA |
  | `bk.src_ota_calendar` | Lịch giá OTA | OTA calendar | Cột Nguồn giá, đêm OTA chưa gõ |
  | `bk.src_typed` | Lễ tân nhập | Entered at the desk | Cột Nguồn giá, đêm đã gõ (mọi kênh) |
  | `booking.error.rate_partial_ota` | Gõ giá cho mọi đêm, hoặc để trống hết để lấy giá theo lịch OTA. | Enter a rate for every night, or leave them all empty to use the OTA calendar rate. | `errors.rates`, OTA gõ thiếu đêm |
  | `booking.error.rate_missing` | Gõ giá cho các đêm còn trống. | Enter a rate for the empty nights. | `errors.rates`, Trực tiếp/CTV còn đêm trống |

  - Giữ `rate_empty` cho ô bằng 0 hoặc âm, và cho 422 ở FB-01.
  - Khi có `errors.rates`, gắn `aria-invalid` cho từng ô trống, để có viền lỗi C3 và trình đọc màn hình báo đúng ô. Không thêm màu.
  - Nội bộ: DOM chốt một trong hai cách. Cách 1: ô Nội bộ chỉ đọc, hiện 0. Cách 2: cho gõ 0 và bỏ "(lớn hơn 0)" ở kênh này. UXD nghiêng về cách 1, vì đơn Nội bộ không tính doanh thu.
- Trạng thái: Open

### FB-R4-UXD-FE-PR70-04
- Mức độ: Minor (v1.0.5, đầu danh sách)
- Vị trí: `useRoomView`, hộp "Đổi sang căn {room} – xem giá trước khi tạo đơn" (dòng 737–788). Đơn OTA chưa gõ giá: `parseVnd('') ?? 0`.
- Vấn đề: mỗi đêm hiện "0", dòng "Tổng tiền đơn" hiện "0 đ", ngay trên nút "Tạo đơn ở căn …". Máy chủ sẽ tính theo lịch OTA, không ghi 0 đ. Như vậy màn hình nói khác điều sẽ được lưu. Sau bản sửa, đây là ca thường gặp của luồng OTA bán trùng (sổ tay 5.3 bước 6).
- Vì sao quan trọng: đây là chỗ lễ tân kiểm giá lần cuối. Thấy "0 đ", lễ tân sẽ dừng lại gọi quản lý, hoặc nghĩ đơn OTA được lưu miễn phí.
- Đề xuất sửa: UXD đồng ý hướng của FE-B. Câu đề xuất:
  - Mỗi đêm OTA chưa gõ: thay số bằng `bk.src_ota_calendar` "Lịch giá OTA" / "OTA calendar" (khóa của FB-03).
  - Thay dòng tổng bằng câu `bk.use_room_ota_calendar`: VI "Chưa gõ giá: Desk tính theo lịch giá OTA của kênh khi tạo đơn." / EN "No rates entered: the booking uses the channel's OTA calendar rate."
  - Nếu đã gõ đủ mọi đêm: giữ bảng số như hiện tại.
  - Hotfix không bắt buộc sửa. Nếu FE muốn sửa tạm mà không thêm khóa: hiện "–" thay "0" và ẩn dòng tổng khi đơn OTA chưa gõ giá.
- Trạng thái: Open

### FB-R4-UXD-FE-PR70-05
- Mức độ: Suggestion (DOM/ARC chốt quy tắc, v1.0.5)
- Vị trí: giữ ô đã gõ qua lần đổi **nhóm kênh** (test "a rate the desk typed stays through a channel change…"). Kèm `body` dòng 514–523.
- Vấn đề:
  - Lễ tân gõ giá thỏa thuận ở Trực tiếp rồi đổi sang OTA hoặc Nội bộ: số đã gõ được giữ. Nếu đã gõ đủ mọi đêm, số đó được gửi với `edited:true`.
  - Số vẫn hiện trong ô, nên lễ tân thấy được. Nhưng cơ chế giống 037: số của kênh này đi sang kênh khác.
  - Với Nội bộ, máy chủ nhận giá gõ (`source: manual`), nên đơn "không tính doanh thu" lại có doanh thu.
  - Khả năng gặp thấp, vì sổ tay chọn Kênh (bước 4) trước Giá (bước 8).
- Vì sao quan trọng: cùng họ lỗi tiền với 037 và 038, dù hiếm.
- Đề xuất sửa: DOM chốt. UXD đề xuất:
  - giữ ô đã gõ khi đổi căn hoặc ngày, và khi đổi giữa Trực tiếp và CTV;
  - khi sang OTA hoặc Nội bộ thì xóa cả ô đã gõ, kèm câu `role="status"` dưới bảng "Đã xóa giá đã gõ vì đổi kênh." / "Typed rates cleared because the channel changed." (khóa mới, UXD cấp nếu DOM đồng ý).
- Trạng thái: Open

---

## Ngoài phạm vi PR, chuyển ORC
- Nút **Giữ chỗ đến …** (`hold()`, dòng 668–) tạo giữ chỗ qua `saveQuote`, không mang giá lễ tân đã gõ. Đây là hành vi có từ trước, không do PR này. Nếu lễ tân gõ giá thỏa thuận rồi bấm Giữ chỗ, cọc và giá giữ chỗ theo giá niêm yết. Nhờ DOM xác nhận đây là quy tắc đúng (giữ chỗ chỉ theo giá niêm yết). Nếu không đúng, QA ghi lỗi.

## Điểm nên giữ
- Gắn số điền sẵn với đúng lượt ở mà bản xem đã tính (`ratesFor` theo kênh, căn, ngày, số đêm), và làm trống ngay khi đổi, không chờ 300 ms. Ô trống là cách nói thật nhất khi chưa có giá đúng.
- Nút Tạo đơn chờ theo đúng mẫu busy của DS đã dùng ở #67, kể cả chặn Enter, và không bao giờ gửi đêm trống thành 0 đ.
- Hotfix không thêm khóa chữ, không đổi CSS, nên cherry-pick lên v1.0.3 không kéo theo việc của UXD.

---

## Review lại @ 94a28258 (04/11/2026)

- Đối tượng: `git diff 822094b7..94a28258`. Phần mã chỉ đổi `handleError` trong `BookingDialog.tsx`; thêm 2 ca test; báo cáo FE thêm mục 9.
- Đối chiếu thêm:
  - `reservations.service.ts` 731–745 (lỗi sàn–trần khi tạo đơn);
  - `app/reservations.ts` `rsvErrorText`;
  - `packages/i18n/src/translate.ts` `interpolate`.

### Kết luận: ĐẠT. Đóng thẻ FB-R4-UXD-FE-PR70-01

| Điểm | Kết quả |
|---|---|
| Lỗi 422 `nightlyRates REQUIRED` và `AMOUNT_NOT_POSITIVE` có câu hiển thị | **Đúng.** `rateKey` bỏ tiền tố `body.`, gom mọi trường `nightlyRates…` vào một khóa mà hộp có hiện: `rates` (dưới bảng giá, khung `.field.invalid`) hoặc `nightlyRates[i].amountVnd` (dưới ô của đêm i). Chỉ số ngoài danh sách đêm thì về `rates`, nên không có câu nào rơi vào khóa không hiện. Câu là `booking.error.rate_empty`, khóa có sẵn, đúng đề xuất của thẻ. Ca OTA để trống mà nhóm căn chưa có `ota_base_rate` giờ hiện "Nhập giá mỗi đêm (lớn hơn 0)." dưới bảng giá. Lễ tân biết phải gõ giá theo extranet |
| Đường "Tạo đơn ở căn …" của hộp gợi ý căn | Cùng `handleError`, nên cũng có câu |
| Lỗi khác của `nightlyRates` | `VALIDATION_FAILED` (ngày trùng, ngoài lượt ở) hiện câu chung `field_error.generic` dưới bảng giá. Chấp nhận, vì lễ tân không tự tạo được ca này. `RATE_OUT_OF_RANGE_WARNING` giữ nguyên |
| Brand, DS | Đạt. Không khóa mới, không màu, không CSS. Câu lỗi nằm ở chỗ lỗi của trường, đúng C3 |
| Test | 2 ca mới đỏ trên `822094b7`, xanh trên head mới. Ca OTA 422 kiểm cả câu và lớp `invalid` |

Thêm một ghi chú và một thẻ Minor cho v1.0.5. Cả hai không chặn gộp, không chặn hotfix, và thẻ 01 vẫn đóng.

- **Ghi chú (gộp vào FB-03 ở v1.0.5):** câu `errors.rates` là `<div className="err">` không có `role="alert"`. Ở đường hộp gợi ý căn, nút bấm nằm đầu hộp, còn câu lỗi nằm dưới bảng giá xa phía dưới, nên có thể bị khuất. Đây là cách cả form đang làm với lỗi của các trường khác, nên không đổi riêng ở hotfix. v1.0.5: gắn `role="alert"` cho câu dưới bảng giá, hoặc cuộn và focus tới trường lỗi đầu tiên.

### FB-R4-UXD-FE-PR70-06
- Mức độ: Minor (v1.0.5; có từ trước, không do PR này)
- Vị trí:
  - máy chủ `reservations.service.ts` 739–743: kênh Trực tiếp/CTV nhập giá ngoài sàn–trần thì trả mã **`RATE_OUT_OF_RANGE` ở cấp Problem**, `extras: { dates }`, không có `min`/`max`;
  - Desk `handleError`: mã này không vào nhánh `VALIDATION_FAILED`, mà đi `requestError` → `error.RATE_OUT_OF_RANGE`.
- Vấn đề:
  - Câu `error.RATE_OUT_OF_RANGE` là "Giá phải từ {min} đến {max} (giá sàn – trần nhóm {group})." Máy chủ không gửi `min`, `max`, `group`, và `interpolate` giữ nguyên chỗ trống không có giá trị. Đọc mã thì thấy lễ tân sẽ thấy nguyên chữ `{min}`, `{max}`, `{group}`. Chưa kiểm trên stack.
  - Nhánh `RATE_OUT_OF_RANGE` mới trong `VALIDATION_FAILED` của PR này đúng với mock của test (có `min`/`max`). Nhưng máy chủ thật không gửi dạng đó khi tạo đơn, nên nhánh này hiện chưa chạy, và không gây hại.
- Vì sao quan trọng: câu có chữ `{min}` trông như lỗi phần mềm. Lễ tân cũng không biết khoảng giá được phép để sửa.
- Đề xuất sửa:
  - QA xác nhận trên stack: Trực tiếp, gõ giá dưới sàn.
  - BE thêm `min`, `max` (sàn, trần của đêm đầu ngoài khoảng) vào Problem. FE định dạng số tiền theo `vnd`, giống `REFUND_EXCEEDS_APPROVED`.
  - Nếu BE chưa thêm được: FE dùng câu không có chỗ trống. UXD sẽ cấp khóa `booking.error.rate_out_of_range_dates`: VI "Giá đêm {dates} nằm ngoài khoảng sàn–trần của nhóm căn. Sửa lại giá đêm đó." / EN "The rate for {dates} is outside the room group's floor–ceiling range. Change that night's rate."
  - Bỏ `group: ''` ở nhánh `RATE_OUT_OF_RANGE` của `handleError`. Nếu không, câu bị cụt thành "giá sàn – trần nhóm )."
- Trạng thái: Open

Thẻ còn mở của UXD trên PR #70: 02, 03, 04, 06 (Minor, v1.0.5) và 05 (Suggestion, chờ DOM). Không có ESC.
