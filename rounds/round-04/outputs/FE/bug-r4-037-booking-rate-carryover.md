# FE-B – BUG-R4-037 (P0, sai tiền): giá bản xem Trực tiếp còn trong ô sau khi đổi sang OTA / Nội bộ

- Người viết: FE-B | Round 4 – bước **Phản hồi & sửa** (hotfix P0) | 04/11/2026
- Nhánh: `v104/fix-booking-rate-carryover`, cắt từ `origin/main` @ `4bf353da`.
- Căn cứ:
  - `rounds/round-04/qa/bug-list-v1.0.4.md` mục BUG-R4-037;
  - `rounds/round-04/outputs/BE/bug-r4-037-data-impact.md` mục 1.8 (biến thể Trực tiếp/CTV);
  - `services/api/src/modules/reservations/public/pricing.service.ts`, đọc để đối chiếu, không sửa.
- Không đổi máy chủ, không đổi hợp đồng, không thêm khóa chữ.

## 1. Tái hiện (việc 1)

Test mới `product/apps/admin-web/src/__tests__/v104-booking-rate-carryover.test.tsx`. Mỗi ca chờ bản xem giá điền ô rồi mới thao tác, đúng nhịp người. Trên `origin/main` @ `4bf353da`, cả 3 ca của QA đều đỏ:

| Ca | Desk gửi trên mã cũ |
|---|---|
| OTA, 1 đêm hôm nay, căn 203 | `nightlyRates=[{date: hôm nay, amountVnd: 667000, edited:false}]`. Đây là giá Trực tiếp của căn 101 |
| OTA, 2 đêm, căn 201, 4 người | Chặn bằng "Nhập giá mỗi đêm (lớn hơn 0)". Không hiện cảnh báo sức chứa |
| Nội bộ, 1 đêm | `nightlyRates` 667.000 với `edited:false`, thay vì để máy chủ ghi 0 đ |

## 2. Cách làm tạm cho lễ tân trên v1.0.3 (việc 2)

Cách làm "Sau khi bấm OTA hoặc Nội bộ, xóa trống mọi ô giá mỗi đêm rồi mới Tạo đơn; OTA muốn ghi giá thì gõ tay đủ mọi đêm" là **đúng**. Đã kiểm bằng 3 ca test (xanh trên mã cũ) và đọc mã:
- Xóa trống mọi ô thì Desk không gửi `nightlyRates`, vì `body` của OTA và Nội bộ chỉ gửi khi mọi ô đều có số.
  - OTA: máy chủ lấy lịch OTA của kênh (`pricing.service.ts` 321–337, BUG-R2-017).
  - Nội bộ: máy chủ ghi 0 đ, nguồn `complimentary` (355–356).
- Mọi ô trống thì không có câu chặn nào. Câu `booking.error.rate_empty` chỉ hiện khi có ô có số và có ô trống.
- OTA gõ tay đủ mọi đêm: Desk gửi đúng số đã gõ, kèm `edited:true`.

Bốn lưu ý cần ghi vào hướng dẫn:
1. Xóa ô **ngay trước** khi bấm Tạo đơn, **sau** lần đổi ngày hoặc đổi căn cuối cùng, rồi nhìn lại xem mọi ô đã trống chưa. Có ba lý do:
   - giá cũ được lưu theo ngày, nên kéo dài ngày lại có thể làm hiện lại giá Trực tiếp ở các đêm đã có bản xem trước đó;
   - quay lại kênh Trực tiếp hoặc CTV thì bản xem điền lại ô;
   - nháp tự lưu cũng giữ các số này.
2. Nội bộ: phải **xóa trống**, đừng gõ 0. Desk báo "Nhập giá mỗi đêm (lớn hơn 0)" khi ô là 0.
3. OTA mà nhóm căn chưa cài `ota_base_rate`: máy chủ trả 422 `nightlyRates REQUIRED`. Khi đó gõ tay giá OTA cho đủ mọi đêm.
4. OTA mà chỉ gõ một vài đêm thì Desk chặn bằng `rate_empty`. Hoặc gõ đủ mọi đêm, hoặc để trống hết.

## 3. Cách sửa (`BookingDialog.tsx`)

- **Gắn giá điền sẵn với bản xem.**
  - Form có thêm trường `ratesFor` = `previewKey` của bản xem đã điền, gồm kênh, căn, ngày đến và số đêm. Số khách không làm đổi giá một đêm, nên không vào khóa.
  - `liveKey` là khóa của lượt ở đang hiện trên màn hình. Nó dùng đúng điều kiện bật của bản xem (Trực tiếp/CTV, ngày hợp lệ, không dài hạn, không quá sức chứa). Vì vậy OTA, Nội bộ, dài hạn và quá sức chứa không bao giờ có khóa.
- **Ô lễ tân chưa gõ** chỉ hiện và chỉ gửi số của bản xem khi `ratesFor === liveKey`. Ngược lại ô trống, và máy chủ tự tính: OTA theo lịch OTA, Nội bộ 0 đ, Trực tiếp/CTV theo giá niêm yết.
  - Ô được làm trống **ngay** khi đổi kênh, căn hay ngày, không đợi 300 ms.
- **Ô lễ tân đã gõ** (`ratesEdited` và có số) được giữ qua mọi lần đổi kênh, căn, ngày, và qua bản xem mới.
  - Bản xem mới chỉ điền các ô chưa gõ.
  - Ô đã gõ rồi xóa trống được coi là chưa gõ, nên bản xem điền lại được.
- **OTA và Nội bộ** chỉ gửi `nightlyRates` khi mọi đêm đều do lễ tân gõ.
- **Trực tiếp/CTV, khoảng hở BE 1.8:**
  - Đổi căn, ngày hay kênh mà bản xem của lượt ở mới chưa về thì nút **Tạo đơn** chờ, kiểu DS `busy` với nhãn `common.loading`, như H16 ở PR #67. `submit` cũng chặn trong lúc này, kể cả khi bấm Enter.
  - Bản xem đọc lỗi cũng tính là đã trả lời (`calcFor`), nên nút không chờ mãi.
  - Có ô đã gõ, hoặc có ô khác giá của máy chủ, mà vẫn còn đêm trống: Desk báo `rate_empty` (khóa có sẵn) và không bao giờ gửi đêm trống thành 0 đ. Trước đây máy chủ trả 422 cho ca này.
- `ratesTouched` chỉ xét các ô đã gõ.

Còn để ngỏ, chuyển UXD ở v1.0.5 (không đổi trong bản sửa này): ở hộp gợi ý căn khác khi trùng lịch (BUG-R2-076), đơn OTA chưa gõ giá hiện 0 đ mỗi đêm. Đây là hiển thị cũ, không gửi số nào. Muốn ghi "giá theo lịch OTA" thì cần câu mới.

## 4. Test

`v104-booking-rate-carryover.test.tsx` có 10 ca:
- 3 ca QA đề xuất, chạy đúng nhịp người.
- 3 ca về giữ và điền lại:
  - ô đã gõ được giữ khi đổi sang OTA và được gửi với `edited:true`;
  - Trực tiếp đổi căn thì số của căn cũ biến mất ngay, rồi bản xem mới điền lại;
  - sang OTA rồi quay về Trực tiếp thì ô được điền lại.
- 1 ca BE 1.8: giữ bản xem của căn 301 lại, gõ đêm 1. Nút chờ (`aria-busy`), bấm vào không gửi gì. Thả bản xem ra thì gửi đêm 1 theo số đã gõ và đêm 2 theo giá căn 301, không phải giá căn 203.
- 3 ca ghi lại cách làm tạm trên v1.0.3. Ba ca này xanh cả trên mã cũ, đúng như mong đợi.

Kết quả:
- Trên mã cũ: 6/10 đỏ, gồm 3 ca QA và 3 ca mới về giữ/điền lại và BE 1.8. 4 ca xanh: 1 ca giữ ô đã gõ, 3 ca cách làm tạm.
- Trên mã mới: 10/10 xanh.
- Toàn bộ admin-web: 78 tệp, 890/890. `tsc --noEmit`, eslint, prettier đều ok.

### Chạy dưới tải

Mỗi tệp chạy riêng, `vitest run <tệp>`, 24 tiến trình song song.

| Mức | Mã | `s2-fix` (A-20) | `booking` (US-139) | `v104-booking-rate-carryover` |
|---|---|---|---|---|
| 24 tiến trình, 40 lượt mỗi tệp (như QA), tải ~21–44 | cũ | **4/40 đỏ** (A-20) | 0/40 | – |
| như trên | **mới** | **0/40** | **0/40** | **0/40** |
| 48 tiến trình (s2-fix 40 + booking 60 cùng lúc), tải ~53 | cũ | **31/40 đỏ**, đều là A-20, thiếu cảnh báo sức chứa, DOM có "Nhập giá mỗi đêm" | **23/60 đỏ**, đều là US-139: 16 thiếu "Căn 101 đã kín", 7 hết giờ | – |
| như trên, tải ~67 | **mới** | 5/40, đều **hết giờ 15 s** (4 A-20, 1 US-135); 0 lỗi kiểu 037 | 25/60, đều **hết giờ 15 s**, rải ở 4 ca (20 ở ca 409 US-018); 0 lỗi kiểu 037 | – |

Đọc kết quả:
- Ở mức QA quy định (24 tiến trình), cả hai test flaky đều xanh. Không thêm retry, không tăng thời gian chờ.
- Ở mức 48 tiến trình, máy quá tải: các agent khác cũng đang chạy trên máy, tải lên tới 67. Ở mức này các ca chạy lâu không kịp hạn 15 s. Không còn lượt đỏ nào có dấu hiệu của 037 ("Nhập giá mỗi đêm" trong DOM: 0 log).
- Ca 409 (US-018) chạy riêng trên mã cũ và mã mới đều mất khoảng 850 ms. Lượt hết giờ của ca này là do tải, không phải do nút chờ.

## 5. Cherry-pick lên tag `v1.0.3`

- Cherry-pick commit sửa của PR này (commit duy nhất của nhánh) lên `v1.0.3` (`da6d6f3d`) trong một worktree tạm: **sạch**.
  - `BookingDialog.tsx` tự gộp được, không xung đột. Từ `v1.0.3` tới `main`, tệp này chỉ khác 2 dòng `guestPrefillOf` (P4 web request).
- Trên `v1.0.3` cộng bản sửa:
  - `tsc` ok;
  - 3 tệp `v104-booking-rate-carryover`, `booking`, `s2-fix`: 27/27;
  - toàn bộ admin-web: 68 tệp, 766/766.
- Báo cáo này nằm cùng commit trên nhánh. Đường hotfix chỉ cần lấy 2 tệp mã và test, hoặc cherry-pick cả commit, vì tệp báo cáo là tệp mới nên không xung đột.

## 6. Tệp
- `product/apps/admin-web/src/pages/booking/BookingDialog.tsx`
- `product/apps/admin-web/src/__tests__/v104-booking-rate-carryover.test.tsx` (mới)
- `rounds/round-04/outputs/FE/bug-r4-037-booking-rate-carryover.md` (báo cáo này)
- Lượt DOM (mục 10): `product/design/tools/gen_strings.py` (khóa `booking.rates_cleared_channel`) và các tệp sinh ra: `product/design/copy/strings-{vi,en}.json`, `product/design/tools/strings-tables.md`, `product/design/wireframes/assets/strings.js`

## 7. Việc còn lại / cho vai khác
- QA:
  - chạy lại A-20 và US-139 ở 24 tiến trình, cộng các ca chống tái phát, sau khi PR vào `main`;
  - kiểm thao tác tay trên stack thật: OTA, Nội bộ, Trực tiếp đổi căn rồi bấm ngay.
- ARC: xem cách sửa (khóa bản xem, nút chờ).
- UXD:
  - xác nhận nhãn chờ `common.loading` trên nút Tạo đơn (giống H16 PR #67);
  - xem câu "giá theo lịch OTA" ở hộp gợi ý căn, cho v1.0.5.
- BE/DATA: rà dữ liệu production theo `bug-r4-037-data-impact.md`. Bản sửa không đụng dữ liệu đã lưu.
- ORC: quyết đường hotfix v1.0.3 (mục 5). Hướng dẫn tạm cho lễ tân nằm ở mục 2.

## 8. Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi khi gộp)

`| 2026-11-04 | 4 | FE-B – BUG-R4-037 (P0): giá do bản xem điền chỉ có hiệu lực cho đúng kênh/căn/ngày của bản xem (ratesFor = previewKey); ô chưa gõ ngoài bản xem thì trống và máy chủ tự tính (OTA lịch OTA, Nội bộ 0 đ); ô đã gõ giữ qua mọi thay đổi; OTA/Nội bộ chỉ gửi nightlyRates khi lễ tân gõ đủ; Trực tiếp/CTV nút Tạo đơn chờ bản xem của lượt ở đang hiện (BE 1.8). Không đổi máy chủ/hợp đồng | FE-B | Quyền FE; rounds/round-04/outputs/FE/bug-r4-037-booking-rate-carryover.md |`

## 9. Lượt sửa theo review UXD (`UXD-on-v104-pr70-rate-carryover.md`), ORC chọn cách (a)

Nền: `822094b7`, là head ARC đang review. Push thường, không force.

| Thẻ | Xử lý |
|---|---|
| **FB-R4-UXD-FE-PR70-01** (Major) | **Đã sửa** trong `handleError`, nhánh `VALIDATION_FAILED`. Mọi lỗi trên trường `nightlyRates` của máy chủ nay ghi vào một khóa mà hộp có hiển thị. Trường có thể có tiền tố `body.`. Khóa lỗi là `nightlyRates[i].amountVnd` khi lỗi chỉ đúng một đêm trong danh sách (hiện dưới ô của đêm đó); các trường hợp khác dùng `rates` (hiện dưới bảng giá). `REQUIRED` và `AMOUNT_NOT_POSITIVE` hiện câu `booking.error.rate_empty` (khóa có sẵn). Không thêm khóa chữ |
| FB-R4-UXD-FE-PR70-02, 03, 04 (Minor) | **Dời v1.0.5**, theo ORC. 02: cột Nguồn giá và bảng tổng khi `priceWaiting`. 03: câu riêng cho OTA, Trực tiếp còn đêm trống, Nội bộ gõ 0 (UXD cấp khóa trước). 04: hộp gợi ý căn, đơn OTA chưa gõ giá hiện 0 đ (đầu danh sách v1.0.5) |
| FB-R4-UXD-FE-PR70-05 (Suggestion) | **Chờ DOM** chốt: có xóa ô đã gõ khi đổi sang OTA hoặc Nội bộ không |

Rà các lỗi 422 khác của `nightlyRates` ở B1 (`pricing.service.ts`, `reservations.service.ts`):

| Lỗi máy chủ | Trước (`822094b7`) | Sau |
|---|---|---|
| `nightlyRates REQUIRED`: OTA không có `ota_base_rate`, hoặc thiếu đêm | Ghi vào `out.nightlyRates`, không hiện câu nào | Câu `rate_empty` dưới bảng giá |
| `nightlyRates AMOUNT_NOT_POSITIVE` | Không hiện câu nào | Câu `rate_empty` dưới bảng giá |
| `nightlyRates RATE_OUT_OF_RANGE` (vượt sàn/trần cứng) | Không hiện câu nào, dù đã dựng câu `rate_range` | Câu `rate_range` dưới bảng giá |
| `nightlyRates VALIDATION_FAILED` (ngày trùng hoặc ngoài lượt ở) | Không hiện câu nào | Câu chung `fieldErrorText` dưới bảng giá |
| `body.nightlyRates[i]…` (lớp schema) | Không hiện câu nào | Dưới ô của đêm i |
| `nightlyRates RATE_OUT_OF_RANGE_WARNING` | Đã đúng (hiện cảnh báo, ô lý do) | Không đổi |

Test, thêm 2 ca vào `v104-booking-rate-carryover.test.tsx`, nay tổng 12 ca:
- OTA để trống, máy chủ trả 422 `nightlyRates REQUIRED`: câu hiện dưới bảng giá, khung có lớp `invalid`, không tạo đơn.
- `body.nightlyRates[0].amountVnd AMOUNT_NOT_POSITIVE` hiện dưới ô đêm 1. `RATE_OUT_OF_RANGE` hiện câu `rate_range` kèm giá sàn và giá trần.

Kết quả:
- Trên `822094b7`: cả 2 ca mới đều đỏ. Trên head mới: 12/12 xanh.
- tsc, eslint, prettier ok.
- Toàn bộ admin-web: 891/892. Ca đỏ là `s4-38-fea` "7 đêm…", **hết giờ 15 s** vì máy đang ở tải 100–135 (các agent khác chạy cùng). Chạy riêng ca này trên `main` và trên bản sửa trong cùng mức tải thì thời gian như nhau: 11,6 s / 7,1 s trên `main`, 10,8 s / 6,6 s trên bản sửa. Không phải do bản sửa. Ở lượt trước, lúc tải bình thường, toàn bộ 890/890 xanh.
- Cherry-pick lên `v1.0.3` vẫn chỉ đụng 2 tệp mã và test, cùng vùng `handleError` không đổi kể từ `v1.0.3`.

## 10. Lượt sửa theo DOM (ARC-03 / UXD-05, thẻ PR70-05): khi nào xóa giá lễ tân đã gõ

Nền: `94a28258`. Push thường, không force. Quy tắc này thay câu "ô đã gõ giữ qua mọi thay đổi" ở mục 3 và mục 8.

| Thay đổi trên hộp Đặt phòng mới | Giá đã gõ | Căn cứ DOM |
|---|---|---|
| Số khách | Giữ | Giá đêm không theo số khách |
| Ngày đến, ngày đi | Giữ những đêm còn trong lượt ở. Đêm mới lấy giá bản xem | |
| Trực tiếp ↔ CTV | Giữ | BR-421 (b) |
| Đổi kênh sang OTA hoặc Nội bộ, hay từ OTA hoặc Nội bộ sang kênh khác (kể cả OTA ↔ Nội bộ) | **Xóa** mọi ô đã gõ, hiện câu `booking.rates_cleared_channel` | BR-112: giá thỏa thuận Trực tiếp không phải giá OTA, cũng không phải "Nội bộ có thu" |
| Đổi căn ở Trực tiếp hoặc CTV sang căn **khác nhóm** | **Xóa** (căn mới tính theo giá niêm yết của nhóm đó). Không hiện câu, vì câu nói "đổi kênh" | BR-429 (g) |
| Đổi căn cùng nhóm ở Trực tiếp hoặc CTV (ví dụ 101 → 203) | Giữ | DOM cho phép tách theo nhóm khi làm được. App có `roomGroupId` nên tách |
| Đổi căn ở OTA (bất kỳ nhóm nào) | Giữ, gửi `edited:true` | Giá OTA đi theo đơn, không theo căn |

Cách làm trong `BookingDialog.tsx`:
- Hàm `dropsTypedRates(trước, sau, groupOf)` gói đúng bảng trên. Căn không rõ nhóm thì coi là khác nhóm (xóa).
- `set()`: khi hàm trả `true`, xóa `rates` và `ratesEdited`. Ô chưa gõ vốn đã bị khóa theo `ratesFor`, nên xóa cả hai không mất gì.
- Câu `booking.rates_cleared_channel`:
  - nằm dưới bảng giá, dạng `span.help role="status"`, không màu lỗi;
  - chỉ hiện khi lần đổi kênh đó xóa ít nhất một ô đã gõ có số;
  - ẩn khi lễ tân gõ lại một ô, hoặc đổi kênh lần nữa.
- **Lỗi tự bắt khi viết test:** lễ tân bấm Trực tiếp → OTA → Trực tiếp trong vòng 300 ms (thời gian chờ của bản xem). Khi đó đầu vào bản xem sau khi chờ không đổi, nên không có lần gọi `calculateQuote` mới. Kết quả: ô trống mãi, nút Tạo đơn vẫn bấm được. Không sai tiền (máy chủ tự tính giá niêm yết), nhưng màn hình không còn giá.
  - Sửa: mỗi lần xóa thì tăng biến đếm `requote` (nằm trong đầu vào bản xem) và đặt `calcFor = null`.
  - Nhờ vậy bản xem luôn được gọi lại. Nút Tạo đơn chờ (busy, BE 1.8) cho tới khi bản xem điền lại ô.
- Chữ:
  - Thêm khóa `booking.rates_cleared_channel` vào `gen_strings.py`, nhóm "v1.0.4 booking – FE-B: khóa Giữ chỗ khi có giá đã gõ (DOM); xóa giá đã gõ khi đổi sang OTA/Nội bộ. UXD 04/11/2026". Chỉ khóa của PR này; khóa `booking.hold.typed_rate_locked` ở PR riêng.
  - Đã sinh lại bằng `python3 -I product/design/tools/gen_strings.py` (3470 chuỗi), chạy lại lần hai không đổi gì.

Test trong `v104-booking-rate-carryover.test.tsx`:
- Bỏ ca cũ "giá đã gõ giữ qua đổi kênh", vì trái quy tắc mới.
- Thêm 14 ca, nay tổng 25 ca:
  - **Xóa khi đổi kênh**, 6 ca `it.each`: direct→ota, direct→internal, agent→ota, ota→direct, internal→agent, ota→internal.
    - Mỗi ca kiểm: ô không còn số đã gõ (OTA/Nội bộ: trống; Trực tiếp/CTV: bản xem điền lại);
    - câu `role="status"` hiện, không có lớp `err`;
    - gõ lại thì câu ẩn.
  - **Đi rồi về trong 300 ms**: Trực tiếp → OTA → Trực tiếp. Ô được bản xem điền lại đúng giá niêm yết, không trống, không còn số đã gõ. Câu ẩn sau lần đổi kênh thứ hai.
  - Đổi kênh khi chưa gõ gì: không hiện câu.
  - **Giữ**: Trực tiếp ↔ CTV; số khách (bản xem mới không ghi đè); ngày đi kéo dài (đêm 1 giữ, đêm 2 lấy giá bản xem); căn cùng nhóm 101 → 203; đổi căn ở OTA 203 → 301.
  - **Xóa khi đổi căn khác nhóm** ở Trực tiếp, 203 → 301: không còn số đã gõ, bản xem của 301 điền lại, không hiện câu.
- Kết quả: xem phần chạy ở mục 10.1.

### 10.1. Kết quả chạy

| Lần chạy | Kết quả |
|---|---|
| 14 ca mới trên `94a28258` (bản chưa sửa) | 8 đỏ: 6 ca xóa khi đổi kênh, ca đi rồi về trong 300 ms, ca đổi căn khác nhóm. 6 ca "giữ" xanh, đúng như mong đợi (trước đây vốn giữ) |
| Bản xóa ô nhưng chưa có `requote` | 2 đỏ, lặp lại được lúc máy rảnh: "OTA rồi về Trực tiếp" (ca cũ) và "đi rồi về trong 300 ms" |
| Bản sửa | Tệp này 25/25 xanh. Toàn bộ admin-web **905/905** (78 tệp). tsc, eslint, prettier ok |
| Tải: 24 tiến trình × 40 lượt, tệp này, lượt 1 | 6/40 đỏ. Cả 6 đều ở ca đầu tệp (OTA 1 đêm), hết giờ 15 s, trong đợt đầu 24 tiến trình cùng khởi động. Đợt đó chạy 95 s mỗi tệp, trong khi các agent khác đẩy tải máy lên 30–90 |
| Đối chứng ngay sau đó, `94a28258`, cùng 24 × 40 | 0/40 |
| Chạy lại bản sửa ngay sau đối chứng, cùng 24 × 40 | **0/40** (mỗi tệp 36–76 s) |

Nhận định:
- Ca đầu tệp không đi qua đoạn mã mới nào nặng hơn. Lần bấm OTA trước đây cũng đổi đầu vào bản xem, nên số lần chạy hiệu ứng không đổi.
- 6 lần đỏ ở lượt 1 là do tải máy lúc đó. Bằng chứng: lần chạy lại trong cùng điều kiện được 0/40.
- QA vẫn nên chạy lại 24 × 40 khi máy rảnh, như mục 7.

### 10.2. Giả định
- Nội bộ: đổi căn thì giữ giá đã gõ, giống OTA. DOM chỉ nêu OTA; Nội bộ cũng có giá đi theo đơn.
- Đổi căn khác nhóm ở Trực tiếp hoặc CTV: xóa nhưng không hiện câu. Câu UXD cấp nói "vì đổi kênh". Nếu UXD muốn có câu cho trường hợp đổi căn, cần một khóa mới.
- Căn không có nhóm trong danh mục: coi là khác nhóm, nên xóa.

### 10.3. Dòng đề xuất cho `01-decisions/decision-log.md` (thay dòng ở mục 8)

`| 2026-11-04 | 4 | FE-B – BUG-R4-037 + DOM ARC-03/UXD-05: giá do bản xem điền chỉ có hiệu lực cho đúng kênh/căn/ngày của bản xem; giá lễ tân gõ GIỮ khi đổi số khách, ngày (đêm còn trong lượt), Trực tiếp↔CTV, căn cùng nhóm, căn ở OTA/Nội bộ; XÓA khi đổi kênh sang/từ OTA/Nội bộ (câu booking.rates_cleared_channel, role=status) và khi đổi căn khác nhóm ở Trực tiếp/CTV (BR-429 g); sau khi xóa luôn gọi lại bản xem, nút Tạo đơn chờ. Không đổi máy chủ/hợp đồng | FE-B | DOM; rounds/round-04/outputs/FE/bug-r4-037-booking-rate-carryover.md |`
