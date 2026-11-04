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
