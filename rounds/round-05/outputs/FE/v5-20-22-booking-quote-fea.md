# FE – Gói 2 Desk: V5-20 (bỏ chữ bảng giá cũ) + V5-22 (hộp Đặt phòng mới)

- Round 5, bước Sản xuất · FE · 07/11/2026
- Nguồn: plan.md Gói 2 (bảng việc), mục 4a T20 và 4b. Chữ lấy từ `rounds/round-05/outputs/UXD/copy-v1.0.5.md` mục 1 (V5-20) và mục 3 (V5-22), dùng đúng khóa của UXD.
- Phạm vi: chỉ `apps/admin-web`. Các khóa bị bỏ không được dùng ở `guest-web` hay `booking-web` (đã grep). Không sửa `sale.quote_text` và `services/api/src/generated/quote-copy.ts`, vì việc đó thuộc PR #167 của FE-B.
- Nhánh `r5-fe-g2-booking` cắt từ `origin/main`. Không đụng các hunk của PR #162 (`r5-fe-closer-field`).

## 1. Đã làm gì

### V5-20 – bỏ chữ của bảng giá cũ
- **Ngưỡng thuê dài hạn lấy từ quy tắc, không viết cứng "28"** (copy 1.1):
  - `field.LONG_STAY_REQUIRES_CONTRACT` và `bk.long_body` nhận `{n}` = `rules.longStayFromNights` (tham số `long_stay_required_from_nights`). `stay.long_hint` không còn số.
  - `rsvErrorText` có thêm `ctx.longStayFromNights`. Mã `LONG_STAY_REQUIRES_CONTRACT` lấy `{n}` từ đó, còn `MIN_STAY_NOT_MET` vẫn lấy `minStayNights` của Problem. Báo giá (2 chỗ) và Đặt phòng mới (lỗi lệnh, lỗi bản xem) đều truyền giá trị này.
  - `RULE_DEFAULTS` (giá trị dùng khi chưa đọc được quy tắc): `longStayFromNights` 28 → 30, `longStayCompareFromNights` 15 → 30, theo mức đội đề xuất cho bảng giá 01/11.
- **"trước giảm theo số đêm"** (copy 1.2):
  - Tiêu đề cột và nhãn ô giá đổi thành `rate.pre_tier` "Giá đêm".
  - Có khóa mới `rate.calendar_short` "giá lịch", dùng ở 2 chỗ luôn hiện: đêm thêm ở Trả phòng (`CheckOutPage`) và danh sách đêm gia hạn (`StayDialogs`).
  - Sửa chữ cho `rate.prior_night_tier`, `checkout.extra_night_rate_help_tier`, `folio.adjust_night_price`, `folio.adjust_night_help`, `rate.night_now`, `rate.adjust_night_effect` và `sale.los_applied` (bỏ số 7 viết cứng).
  - `rate.pre_tier_short` giữ nguyên chữ, vì copy 1.2 ghi "(giữ)". Khóa này chỉ còn ở BookingDialog, khi `losShown > 0`.
- **Nhãn "+15 %" cuối tuần**: bỏ `bk.src_weekend`. Cột Nguồn giá đã theo nội dung ô từ PR70-02.
- **Báo giá không tách đêm thứ Sáu, thứ Bảy** (copy 1.4, plan gọi là `sale.nights_all`):
  - `QuoteDialog` gom đêm theo số tiền (`amountVnd`), xếp theo đêm đầu tiên của nhóm.
  - Mỗi dòng là `sale.nights_at_rate_{one|few|many|other}` "{n} đêm × {rate}", dạng số nhiều chọn bằng `pluralForm(locale, n)`. n × rate = cột tổng của dòng.
  - Bỏ `sale.nights_weekday` và `sale.nights_weekend`.
- **Đổi số khách thì tính lại tổng** (copy 1.6, FB-R4-ARC-FE-PR82-02):
  - Thêm `totalsKey` = lượt ở + số khách và state `calcTotalsFor`.
  - Khi bản xem cho đúng số khách đang hiện chưa về, bảng tổng có `aria-busy`. Các ô tiền (tiền phòng, tổng, cọc) hiện "–" và dòng phụ thu bị ẩn.
  - Ô giá vẫn giữ số (khóa `previewKey` không có số khách). Nút "Tạo đơn" không chờ, vì máy chủ tính theo số khách khi lưu.
- **Giờ trả phòng**: `stay.after_noon_hint` nhận `{time}` = `rules.checkoutTime`, không viết cứng 12:00 (copy 1.5).
- **Khóa bỏ**: `extend.keep_rate_help` và `co.late_switch_hint` (copy 1.5, không mã nào dùng). `late.std_zero` có ghi chú "Chỉ prototype, không dùng ở app".

### V5-22 – hộp Đặt phòng mới
- **Câu sàn–trần có số thật**:
  - Phần hiện câu đã có từ PR #122 (`rateRangeErrors` / `rangeSentence`).
  - Mock `createReservation` nay trả như máy chủ (`rate-out-of-range.ts`, #103): với Trực tiếp và CTV, đêm ngoài sàn–trần cho 422 `RATE_OUT_OF_RANGE` ở cấp trên, kèm `dates[]`, `min`, `max`, sau các kiểm trường. Trước đây mock trả `VALIDATION_FAILED` theo từng ô, không có min/max.
  - Nhánh cảnh báo của OTA giữ nguyên.
- **Ô OTA để trống nói rõ nghĩa** (FB-R4-UXD-FE-PR70-03/04):
  - Dòng `.help` `bk.rate_help_ota` dưới bảng giá, chỉ hiện với kênh OTA.
  - Cột Nguồn giá của đêm OTA chưa gõ ghi `bk.src_ota_calendar` "Lịch giá OTA", không còn "–".
  - Hộp "Đổi sang căn …" khi đơn OTA chưa gõ giá: mỗi đêm ghi "Lịch giá OTA", dòng Tổng thay bằng `bk.use_room_ota_calendar`, không bao giờ hiện "0 đ". Nếu gõ một phần thì không có dòng tổng.
- **Câu lỗi ô giá**:
  - OTA gõ thiếu đêm → `booking.error.rate_partial_ota`.
  - Trực tiếp/CTV còn đêm trống → `booking.error.rate_missing`, thay câu "(lớn hơn 0)". Câu đó vẫn dùng cho ô gõ 0.
  - Mỗi ô trống bị đánh dấu `aria-invalid` và đọc kèm câu (`aria-describedby="bk-rates-err"`).
- **Phần còn lại của UXD-FE-PR70-02**: `09-booking.html` đổi ô `bk.src_weekend` sang `bk.src_list`. `12-sales-quote.html` đổi 2 dòng sang `sale.nights_at_rate_other`. Đây là thay khóa tối thiểu để file hifi không trỏ vào khóa đã xóa. Số minh họa do UXD chỉnh.
- **Chặn thêm**: "Tạo đơn ở căn …" (`submit` với `roomId`) trước đây bỏ qua phần kiểm form. Vì vậy đơn OTA hoặc Nội bộ gõ một phần mất giá đã gõ mà không báo. Nay bước này kiểm `partialRates()` trước.

## 2. File tạo/sửa
- `product/design/tools/gen_strings.py` (sinh lại `design/copy/strings-vi.json`, `strings-en.json`, `design/tools/strings-tables.md`, `design/wireframes/assets/strings.js`: 3525 chuỗi + 8 mẫu)
- `product/apps/admin-web/src/app/rules.ts`, `src/app/reservations.ts`
- `product/apps/admin-web/src/pages/booking/BookingDialog.tsx`, `src/pages/quotes/QuoteDialog.tsx`, `src/pages/stay/StayDialogs.tsx`, `src/pages/stay/CheckOutPage.tsx`
- `product/apps/admin-web/src/mocks/reservations.ts`
- `product/design/hifi/09-booking.html`, `product/design/hifi/12-sales-quote.html`
- Test sửa: `checkout.test.tsx`, `v104-booking-rate-carryover.test.tsx`, `v104-rate-source-typed.test.tsx`, `v5-14-hold-typed-rates-fea.test.tsx`
- Test mới: `product/apps/admin-web/src/__tests__/v5-20-22-booking-quote-fea.test.tsx` (12 ca)

## 3. Test
- Ca mới:
  - chữ: khóa cũ không còn, có đủ 4 dạng số nhiều, không còn "28" hay `{n}` sót;
  - `rsvErrorText` LONG_STAY và MIN_STAY;
  - hộp dài hạn ở H09 lấy ngưỡng 21 từ tham số;
  - báo giá trả LONG_STAY lấy ngưỡng của quy tắc;
  - báo giá thứ Hai + 7 đêm ra 2 dòng "5 đêm ×" và "2 đêm ×", n × rate = dòng, không có chữ thứ;
  - căn 201 thêm 1 người lớn: lúc chờ thì bảng tổng "–" và `aria-busy`, ô giá giữ số, "Tạo đơn" không bận; sau đó có dòng phụ thu, tổng tăng 2 × 150.000;
  - dòng help và Nguồn giá của OTA;
  - hộp "Dùng căn …" của OTA hiện "Lịch giá OTA", không có "0 đ";
  - OTA gõ thiếu: có câu, ô trống `aria-invalid`;
  - API Trực tiếp ngoài sàn–trần: `dates`/`min`/`max` ra câu BR-105 ở đúng đêm, không tạo đơn;
  - "Xác nhận giờ trả" khi `checkout_time` = 11:00.
- Kiểm: vitest admin-web (số ca ở thân PR); `tsc` admin-web; `eslint` trên các file sửa; `prettier --check`; chạy lại `gen_strings.py` không ra diff.

## 4. Giả định
- `sale.nights_all` trong plan là việc ở copy 1.4, không phải tên khóa. Copy 1.4 ghi rõ như vậy, nên khóa thật là `sale.nights_at_rate_*`.
- `RULE_DEFAULTS` dùng 30/30, theo mức đề xuất ở copy 1.1, chỉ cho lúc chưa đọc quy tắc. Mock vẫn trả 28 (`LONG_STAY_FROM_NIGHTS`) cho đến khi tham số thật đổi. Các test cũ "≥ 28 đêm" vẫn đúng.
- Mock `createReservation` lấy sàn–trần 300.000–3.000.000 cố định, giống mock báo giá.

## 5. Rủi ro / vướng mắc (không ESC)
- **UXD**:
  - copy mục 8 (dòng grep) yêu cầu không còn "trước giảm theo số đêm" / "before length-of-stay", nhưng mục 1.2 giữ chữ `rate.pre_tier_short`. FE giữ theo 1.2, và grep hiện chỉ còn khóa này. UXD chọn một trong hai: sửa chữ khóa, hoặc sửa dòng grep.
  - Hai file hifi chỉ được đổi khóa. Số minh họa và bố cục là việc của UXD (copy mục 6).
- **UXD/DOM**: "Tạo đơn ở căn …" nay chặn đơn OTA/Nội bộ gõ một phần, như "Tạo đơn". Cần xác nhận đây là hành vi muốn có.
- **ARC (V5-22)**: mock trả `RATE_OUT_OF_RANGE` sau toàn bộ kiểm `VALIDATION_FAILED`, cùng thứ tự với `rate-out-of-range.ts`. Nếu máy chủ đổi thứ tự thì mock phải theo.

## 6. Việc chưa xong
- Không có. Chờ review UXD, DOM, ARC (V5-22) và QA trên PR.
