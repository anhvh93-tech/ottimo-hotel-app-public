# FE-A – V5-10: một `checkoutAt` cho bill, VietQR và Trả phòng (Desk H16)

- Round 5, bước Sản xuất · FE-A · 07/11/2026
- Nguồn:
  - hợp đồng 0.3.13 mục 1.1 và 1.19; BE PR #106 đã gộp (`e74d8820`);
  - DOM review #106 mục 2.1, 2.2, 5 và `rules-v1.0.5.md` mục 15.1, 15.2 (ORC chuyển);
  - ARC (ORC chuyển): PR này phải lên cùng tag v1.0.5 với #106, vì Desk v1.0.4 tự dựng `checkoutAt` của QR.
- Nhánh `r5-fe-v5-10` cắt từ `origin/main` `e74d8820`.

## 1. Việc đã làm (`apps/admin-web/src/pages/stay/CheckOutPage.tsx`, `PaymentPanel.tsx`)
- **Một giờ trả cho cả ba việc (T10-6)**:
  - mỗi lần đọc tóm tắt nhớ giờ đã hỏi;
  - QR `check_out`, lệnh dò số phải thu khi gõ giá đêm thêm, và B18 gửi đúng `CheckoutSummary.checkoutAt` của lần tóm tắt cuối **có gửi giờ đang hiện trên ô**;
  - lần đọc đầu không gửi giờ (máy chủ trả giờ hẹn hoặc 12:00) **không bao giờ** được chuyển tiếp (DOM 15.2);
  - B18 gửi `checkoutAt` kèm `checkoutTime` cùng giờ;
  - Desk không còn tự ghép ngày với giờ. `checkoutInstant` chỉ còn dùng khi máy chủ chưa trả `checkoutAt` (≤ 0.3.12).
- **Giờ điền sẵn giữ nguyên là giờ máy quầy** (KB7, quyết định 17/10). Không đổi luật này.
- **`checkoutTimeNoteRequired`**: ô "Ghi chú giờ trả" hiện ngay ở bước 2, không chờ B18 trả `TIME_NOTE_REQUIRED`.
- **`checkoutAtAfterNow`**:
  - câu `field.TIME_AFTER_ACTION` (đã có, đã duyệt) hiện dưới ô giờ;
  - "Tiếp tục" mang lý do khóa, "Hoàn tất" cũng vậy;
  - nút tạo QR tắt (`checkout.qrOff`). Máy chủ cũng chặn (422).
- **Làm nổi giờ điền sẵn** (DOM 15.2, review #106 mục 2.1):
  - khi giờ trên ô còn là giờ trang tự điền và giờ đó làm khách mất tiền (phụ thu trả muộn > 0 hoặc đêm thêm), ô có viền Earth Brown (`.input.is-prefilled`, `@ottimo/ui` `app.css`);
  - lễ tân sửa giờ thì viền mất. Ô có `data-prefilled` khi giờ còn là giờ tự điền;
  - màu: Earth Brown #7A5C44, tương phản 5,4:1 trên Ivory (yêu cầu 3:1 cho viền thành phần). Light Oak chỉ đạt khoảng 2,7:1 nên không dùng.
- P432-04 (không chỉ sang Trả sớm khi tóm tắt lỗi vào ngày trước ngày đi): đã có từ v1.0.4, không đổi.

## 2. Mock (`apps/admin-web/src/mocks/stay.ts`) theo `resolveCheckoutAt` của #106
- Tóm tắt trả `checkoutAt`, `checkoutTimeNoteRequired`, `checkoutAtAfterNow`:
  - ứng viên (ngày đi, t);
  - (ngày đi + 1, t) khi t < 06:00;
  - (ngày đi − 1, t) trong cửa sổ sau nửa đêm khi t ≥ 06:00;
  - chọn ứng viên muộn nhất không sau giờ hiện tại + 15 phút (dung sai của mock).
- B18 nhận `checkoutAt` và dùng nguyên giá trị đó.
- QR `check_out` có `checkoutAt` sau giờ hiện tại quá dung sai → 422 `TIME_AFTER_ACTION`, không tạo gì.

## 3. Test
- Vitest `v5-10-checkout-at-fea.test.tsx` (5 ca):
  - T10-6: hai lần đọc có giờ (12:45, 12:50) → QR và B18 mang `checkoutAt` của lần 12:50; không lệnh nào mang `checkoutAt` của lần đọc không giờ;
  - gõ 12:10 lúc 13:00 → ô ghi chú hiện trước B18;
  - gõ 13:40 lúc 13:00 → câu dưới ô giờ, "Tiếp tục" khóa có lý do, không ghi gì;
  - giờ tự điền 13:00 (có phụ thu) → ô nổi; lễ tân sửa → hết nổi;
  - giờ tự điền 12:05 (trong ân hạn) → không nổi.
- Các ca cũ (`bug-r4-050`, `s4-416`, `checkout`, …) vẫn xanh với mock mới. Admin-web 999/999; `tsc`, `eslint`, `prettier`.
- E2E: chưa thêm ca Desk riêng cho T10-6. QA chạy ca 15.6 (T-10-11 … T-10-14) trên stack có #106.

## 4. Việc cần vai khác (không ESC)
- **UXD**:
  - dòng nhắc cạnh ô giờ trả khi giờ còn là giờ tự điền và có phụ thu (DOM 15.2, ví dụ "Giờ trả là lúc khách trả chìa. Khách đã đi trước thì sửa giờ."). FE đã có điều kiện hiện (`timePrefilledCharged`), chờ tên khóa để gắn chữ và `aria-describedby`;
  - xác nhận dùng lại `field.TIME_AFTER_ACTION` cho `checkoutAtAfterNow` (hợp đồng ghi ý "Giờ trả đang ở sau giờ hiện tại");
  - xem viền Earth Brown của ô giờ tự điền.
- **FE-A, việc kế tiếp (V5-15, sau BE #99 và chữ UXD)**: hộp "Trả phòng quá ngày đi":
  - chỉ dẫn cho FD/FDL theo `nightsNotBilled`;
  - lời nhắc D12c cạnh ô lý do (không ghi họ tên, số giấy tờ, thông tin sức khỏe). Đây là điều kiện SEC; ORC sẽ báo tên khóa.
- **QA**: chạy T10-6 và rules 15.6 trên staging sau khi tag có cả #106 và PR này.

## 5. Giả định, ESC
- Không có ESC mới.
- Giả định:
  - "giờ khiến khách mất tiền" = phụ thu trả muộn ở giờ đó > 0, hoặc phải tính đêm thêm (DOM: "có phụ thu > 0");
  - lễ tân xóa trống ô giờ: B18 gửi giờ của tóm tắt (như cũ), QR không kèm `checkoutAt`, và máy chủ quy đổi cả hai theo cùng một luật.

## 6. Sửa theo review UXD (07/11, sau merge main)
Review: `rounds/round-05/reviews/UXD-on-fe-prs-125-128.md` (#125 @ `797ff439`). Chữ lấy nguyên văn mục 1.3 của review.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-UXD-FE-PR125-01 (Major) | Done | Khóa mới `checkout.time_prefilled_help` (VI/EN nguyên văn mục 1.3) ở `help` của ô giờ trả khi `timePrefilledCharged`. Có `co.time_from_late` thì ghép sau, cách một dấu cách. Chữ Stone của `Field help`, nối qua `aria-describedby`. Viền Earth Brown giữ làm dấu phụ. Test: giờ tự điền 13:00 có phụ thu → có câu và là mô tả của ô; sửa giờ → câu mất; 12:05 → không có câu |
| FB-R5-UXD-FE-PR125-02 (Minor) | Done | `lateWhy`: ngay sau `timeAfterNow`, khi `checkoutTimeNoteRequired` của lần tóm tắt có giờ và ô ghi chú trống → `field.TIME_NOTE_REQUIRED`. "Tiếp tục" có `aria-disabled` và mô tả bằng câu đó; gõ ghi chú thì mở. Test trong ca 12:10 lúc 13:00 |
| FB-R5-UXD-FE-PR125-03 (Suggestion) | Done | Ô có lỗi thì không gắn `is-prefilled` và không hiện câu nhắc: chỉ còn lỗi. Mock có thêm núm chỉ dùng trong test `checkoutClockSkewMinutes` (đồng hồ máy chủ lệch máy quầy) để dựng ca giờ tự điền nằm sau "hiện tại" của máy chủ |
| Xác nhận dùng lại `field.TIME_AFTER_ACTION` | – | UXD đồng ý (mục 1.1) |

Mục 4 ở trên: phần "UXD – dòng nhắc" và "xác nhận `field.TIME_AFTER_ACTION`" đã xong qua lượt này.

Test cũ `checkout.test.tsx` đổi theo PR125-02: ca KB7 (3)(4) nay dừng ở bước 2 ("Tiếp tục" chờ ghi chú), không còn đi tới "Hoàn tất" rồi bị đưa về. Ca "ghi bù lâu sau khi khách đi" giữ đường dự phòng B18 `TIME_NOTE_REQUIRED` bằng tóm tắt không có cờ (máy chủ ≤ 0.3.12). Kiểm: vitest admin-web 1001/1001; `tsc`; `eslint`; `prettier`.
