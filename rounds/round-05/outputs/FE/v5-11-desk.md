# FE-4 – V5-11 phía Desk: trả sớm và phí giữ lại trong 00:00–05:59

- Round 5 (v1.0.5), bước Sản xuất · FE-4 · 07/11/2026
- PR #142, nhánh `r5-fe-v5-11` (cắt từ `origin/main`, đã merge `main` @ `7a141dbf` để lấy chữ UXD; không rebase, không force-push).
- **Gộp sau #114** (BE-A1, `r5-a2`, ARC duyệt @ `f730b691`, chưa gộp lúc viết). Desk đọc `minNewDepartureDate`, `useCheckout` trong 409 mà máy chủ cũ chưa gửi.
- Căn cứ:
  - hợp đồng 0.3.13 bổ sung 1 (`earlyDeparture`, `Problem.minNewDepartureDate`, `Problem.useCheckout`);
  - DOM rules-v1.0.5 mục 2 và DOM review #114 mục 4;
  - UXD copy-v1.0.5 mục 9.13.

Gọi W là khoảng từ 00:00 tới trước mốc đổi ngày (06:00, BR-010). Trong W, gọi ngày lịch là D thì ngày nghiệp vụ là D−1 (cùng cách gọi trong test).

## 1. Đã làm
Toàn bộ thay đổi nằm trong `EarlyDepartureDialog.tsx`.

**Ngày rời mới đặt sẵn ngày lịch trong W** (DOM 2.1 (2), ca T-11-6)
- Hàm mới `minCalendarDay` (`app/dates.ts`) cùng luật với `minCalendarDate` của #114.
- Ngày lấy từ `useBusinessDay` (neo máy chủ). Chỉ giờ trong ngày lấy từ máy quầy, mốc đổi ngày lấy từ `property.businessDayRollover`.
- Ngày của máy chủ luôn thắng: `serverMin ?? ước tính`.
- Ngoài W giữ như cũ.

**409 `INVALID_TRANSITION` ở cả tính thử lẫn lần ghi**, theo thứ tự UXD 9.13 (`nightHint`):
- **`useCheckout`:**
  - `Alert info` `early_departure.use_checkout` thay nội dung bước và nhận focus;
  - ẩn "Xem trước số tiền" và "Xác nhận";
  - nút chính `checkout_now` chỉ hiện khi đơn đọc lại có `check_out` trong `allowedActions`; không có thì chỉ có Đóng.
- **`minNewDepartureDate`:**
  - `early_departure.err.min_date` hiện dưới ô Ngày rời mới;
  - nút phụ `early_departure.use_min_date` chỉ điền ô, focus ở lại ô;
  - câu giúp và kiểm ở client chuyển sang ngày của máy chủ;
  - gặp ở lần ghi thì về bước ① như 412, focus vào ô.
- **Còn lại:** câu chung như cũ.

**Mở hộp trong W khi không còn ngày nào chọn được** (ngày đi ≤ ngày lịch)
- Hiện `use_checkout` mà không gọi B16.
- Đơn được đọc lại một lần (GET), để nút Trả phòng ngay theo `allowedActions` mới.

**Phí giữ lại chỉ hiện số của máy chủ** (`earlyDepartureFeeVnd`), không tính ở client.
- Dòng phụ `early_departure.fee_business_date` hiện dưới `row_fee` ở bước ② và sau câu phí ở bước ③.
- Chỉ hiện trong W và khi phí > 0.
- `{date}` = `useBusinessDay` lúc vẽ, nên đọc lại khi có kết quả.

**Sửa lỗi bắt buộc UXD tìm ra:** ở bước ③, `canCheckOut` so `leaving === today`, mà `today` là ngày nghiệp vụ.
- Lúc 03:00, trả sớm về ngày lịch hiện `later_hint` và mất nút Trả phòng ngay.
- Nay chỉ dựa vào `allowedActions` có `check_out`.

**Mock bám #114** (`mocks/stay.ts`)
- Kiểm W chạy trước mọi kiểm ngày, cả `dryRun`: 409 `useCheckout`, rồi 409 `minNewDepartureDate` (= ngày lịch).
- Ngoài W giữ 422 như cũ.
- Dòng `early_departure_fee` và `deposit_forfeit` mang `serviceDate` = ngày nghiệp vụ.
- `allowedActions` của mock vốn dùng ngày lịch, nên chỉ thêm ghi chú.

**Bố cục:** thêm `mb-16` (tiện ích có sẵn) dưới nút "Dùng {date}" để nút không dính vào nhãn "Khách báo lúc". Không thêm CSS hay màu mới.

## 2. Kiểm
**Test mới** `src/__tests__/v5-11-early-departure-night-fea.test.tsx`, 10 ca, đồng hồ giả cố định:
1. `minCalendarDay` lúc 03:00, 05:59, 06:00, 23:59, và với mốc đổi ngày khác.
2. Thứ tự `nightHint`: `useCheckout` trước `minNewDepartureDate`; 409 khác không phải gợi ý.
3. T-11-6, 02:00: đặt sẵn D, tính thử gửi D. Gõ D−1 thì client chặn, không có request.
4. T-11-1/T-11-3, 03:00, kèm lỗi UXD:
   - dòng phụ ngày nghiệp vụ hiện ở bước ② và ③;
   - hiện "Trả phòng ngay" và `checkout_now_hint`, không hiện `later_hint`;
   - dòng phí trong mock mang ngày D−1;
   - mở được trang Trả phòng.
5. Máy chủ trả số lạ 1.234.000 / 456.000: bước ② hiện đúng số đó và lần ghi gửi đúng số đó. Đây là ca chứng minh Desk dùng số của máy chủ.
6. 409 `minNewDepartureDate` ở tính thử, ngày máy chủ (D+1) khác ước tính của Desk (D):
   - câu lỗi và nút "Dùng" hiện ra;
   - câu giúp nâng theo;
   - focus ở lại ô;
   - tính thử chạy lại.
7. 409 `minNewDepartureDate` ở lần ghi (tính thử lúc 23:58, bấm lúc 03:00): về bước ①, focus vào ô, bấm "Dùng D", thêm giờ báo, ghi xong.
8. 409 `useCheckout` ở tính thử: alert nhận focus, không có tính thử/xác nhận, chỉ có Đóng khi đơn không có `check_out`.
9. Mở trong W khi khoảng chọn rỗng: không gọi B16; sau khi đọc lại, "Trả phòng ngay" mở trang Trả phòng.
10. 409 `useCheckout` ở lần ghi: không ghi gì; sau khi đọc lại có "Trả phòng ngay".

**Đột biến** (chạy tay, mỗi lần một chỗ, rồi trả lại). Mỗi đột biến làm ít nhất một ca đỏ:
- (A) client tự tính phí;
- (B) bỏ `minNewDepartureDate` của máy chủ;
- (C) `canCheckOut` so ngày nghiệp vụ;
- (D) đặt sẵn ngày nghiệp vụ.

**Toàn bộ admin-web:** 89 tệp, 1005/1005 đạt. `tsc`, `eslint`, `prettier` sạch.

**Giao diện:** kiểm bằng trình duyệt thật (Chromium, mock MSW, dữ liệu mẫu), ở 390 px và 1440 px, 5 trạng thái:
- bước ①, ②, ③;
- 409 ngày tối thiểu;
- 409 dùng Trả phòng.

Kết quả:
- Không có cuộn ngang. Hộp rộng 720 px ở 1440 và 358 px ở 390.
- Chữ Lora/Be Vietnam Pro; màu chỉ từ token DS.
- `Alert info` dùng `--info`, là ngoại lệ chức năng đã có ở DS v0.4 (decision-log 17/10).

Ảnh không commit vì brief chỉ cho commit tệp này; có thể chụp lại bằng mock.

## 3. Tệp tạo/sửa (PR #142)
- `product/apps/admin-web/src/pages/stay/EarlyDepartureDialog.tsx`
- `product/apps/admin-web/src/app/dates.ts`
- `product/apps/admin-web/src/mocks/stay.ts`
- `product/apps/admin-web/src/mocks/reservations.ts` (chỉ ghi chú)
- `product/apps/admin-web/src/__tests__/v5-11-early-departure-night-fea.test.tsx` (mới)
- Chữ: không sửa `gen_strings.py`. Chỉ dùng khóa UXD đã chốt trên `main` @ `7a141dbf`; khóa tạm đã bỏ hết.

## 4. Giả định
- **Ngày đặt sẵn trong W là ngày lịch.** Brief ORC ghi "theo ngày nghiệp vụ, không theo ngày lịch", nhưng hợp đồng 0.3.13, DOM 2.1 và UXD 9.13 đều ghi ngày lịch (`minNewDepartureDate` = ngày lịch D). PR làm theo hợp đồng và ghi chỗ lệch trong thân PR.
- **Ước tính W ở Desk:** ngày nghiệp vụ neo máy chủ cộng giờ máy quầy. Nếu đồng hồ quầy lệch, 409 của máy chủ sửa lại (`serverMin` thắng), nên không ghi sai.
- **"Dùng {date}" không gửi request:** nút chỉ điền ô. Tính thử `dryRun` vẫn tự chạy sau 400 ms như với mọi lần đổi ngày (thiết kế có sẵn của hộp). Đây là đọc, không ghi. Nếu UXD muốn nút này không kích tính thử thì báo FE.
- **Nút Trả phòng ngay ở bước ③** chỉ dựa vào `allowedActions` của máy chủ. B18 chỉ mở vào ngày đi, nên ngày rời muộn hơn vẫn ra `later_hint`.

## 5. Rủi ro / vướng mắc
- **Thứ tự gộp:** #142 phải gộp sau #114. Gộp trước thì máy chủ cũ không gửi `minNewDepartureDate`/`useCheckout`; Desk rơi về câu chung, không sai tiền.
- **Cho QA chạy tay trên bản dev:** React StrictMode chạy hiệu ứng tính thử hai lần và hủy request đầu, nên `mockControl.failNext` đặt trước bị request bị hủy "ăn" mất. Cách làm: đổi ngày một lần cho tính thử đầu chạy xong, rồi mới đặt `failNext` và đổi ngày lại. Bản build không bị.
- Ô ngày hiển thị theo locale trình duyệt (Chromium tiếng Anh hiện mm/dd/yyyy). Đây là hành vi có sẵn, không do PR này.

## 6. Việc chưa xong / chờ
- Chờ #114 gộp, rồi gộp #142.
- ESC mới: không. Khóa chữ chờ UXD: không.
