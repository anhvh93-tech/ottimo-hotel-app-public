# DOM review – FE PR #171 (Gói 2 Desk: V5-20 bỏ chữ bảng giá cũ + V5-22 hộp Đặt phòng mới)

- Round 5 (v1.0.5) · Bước: Review · DOM · 07/11/2026
- PR #171, nhánh `r5-fe-g2-booking` @ `e825de5b`. Báo cáo: `rounds/round-05/outputs/FE/v5-20-22-booking-quote-fea.md`.
- DOM đọc diff `origin/main...origin/r5-fe-g2-booking`: `BookingDialog.tsx`, `QuoteDialog.tsx`, `reservations.ts` (`rsvErrorText`), `rules.ts`, và chữ mới trong `strings-vi.json`. DOM không chạy test.
- Căn cứ: BR-105 (Nội bộ "đủ hoặc không" v0.5.8), BR-107, BR-108, BR-110; copy-v1.0.5 mục 1, 3; decision-log 01/11 (INV: thuê tháng từ 30 đêm), 06/11 (INV bật giá web với bảng tham số đang chạy); từ điển tham số mục "Tham số trên production lệch sổ tay".
- Không có dữ liệu khách thật, không có số hoa hồng.

## 0. Kết luận

**DUYỆT về nghiệp vụ.** Hai thẻ Minor, một thẻ Suggestion, không chặn gộp. Không ESC.

Gộp còn chờ CI: job `gitleaks` đang đỏ ở `e825de5b` (cùng đỏ ở #172). Đây không phải việc của DOM; ORC xem trước khi gộp.

## 1. Câu dài hạn theo `longStayFromNights`: đúng

- `field.LONG_STAY_REQUIRES_CONTRACT` "Từ {n} đêm là thuê dài hạn" và `bk.long_body` lấy `{n}` từ quy tắc đang chạy, không còn "28" viết cứng. Đúng ý INV 01/11: ngưỡng là tham số, INV đổi ở B4.
- `MIN_STAY_NOT_MET` vẫn lấy `minStayNights` của Problem. Đúng: hai luật khác nhau (BR-113 ở tối thiểu, BR-108 dài hạn), không được dùng chung một số.
- Hôm nay production vẫn chạy ngưỡng **thấp hơn 30** (từ điển tham số, mục lệch sổ tay, B4 chưa làm). Desk đọc `getBookingRules`, nên câu sẽ ghi đúng số đang chạy, không ghi 30. Đúng: lễ tân phải thấy luật máy chủ đang áp, không phải luật sắp áp.
- `RULE_DEFAULTS` 28 → 30 chỉ dùng khi chưa đọc được quy tắc. Xem thẻ 171-02.

## 2. Báo giá gom đêm theo số tiền: đúng, và sửa một lỗi cũ

- Mã cũ gom theo thứ Sáu/thứ Bảy và lấy giá của đêm đầu nhóm làm `{rate}`, trong khi tổng của dòng cộng mọi đêm trong nhóm. Khi các đêm trong nhóm khác giá (ngày đặc biệt rơi vào ngày thường), "n đêm × giá" không bằng số ở cột tổng. Báo giá gửi khách mà phép nhân sai là lỗi uy tín, dù tổng vẫn đúng.
- Mã mới gom theo `amountVnd`: n × giá luôn bằng dòng. Thứ tự theo đêm đầu tiên của mỗi nhóm là cách khách đọc dễ nhất.
- Ví dụ trên production hôm nay (không tăng cuối tuần, ngày đặc biệt còn tăng, B2 chưa làm): Studio 800.000, 3 đêm 01/01–04/01/2027 (đêm 01/01 thuộc danh sách ngày đặc biệt 24/12–1/1, BR-104) → "1 đêm × 1.040.000" rồi "2 đêm × 800.000", tổng 2.640.000. Khi INV làm xong B2: "3 đêm × 800.000" = 2.400.000, một dòng.
- Đêm không liền nhau mà cùng giá thì vào chung một dòng. Chấp nhận: báo giá cho khách đọc số tiền, không đọc lịch. Ngày ở đã ghi ở đầu báo giá.
- Dòng giảm theo số đêm (`sale.los_applied`) và dòng phụ thu người (BR-110) vẫn tách riêng như trước. Đúng.

## 3. Đơn OTA chưa gõ giá: đúng

- "Lịch giá OTA" ở cột Nguồn giá và câu `bk.rate_help_ota` nói đúng điều máy chủ làm: OTA để trống mọi đêm thì máy chủ tính theo lịch giá OTA của kênh (BUG-R2-017). Trước đây ô ghi "–", lễ tân dễ tưởng đơn sẽ là 0 đ.
- Hộp "Đổi sang căn …" không bao giờ hiện "0 đ" cho đơn OTA chưa gõ. Đúng: số 0 ở đây là số sai, không phải số chưa biết.
- OTA gõ một phần → `booking.error.rate_partial_ota` "Gõ giá cho mọi đêm, hoặc để trống hết…". Đúng luật "đủ hoặc không" của đơn OTA, cùng luật với Nội bộ (BR-105 v0.5.8).
- Nhắc cho sổ tay (không thẻ, đã có ở `02`): đơn OTA nên gõ đúng giá extranet từng đêm. Để trống chỉ khi chưa xem được extranet.

## 4. Hành vi mới của "Tạo đơn ở căn …": DOM xác nhận đây là hành vi muốn có

- Trước PR: nút này bỏ qua toàn bộ kiểm form. Đơn OTA hay Nội bộ gõ một phần thì `body()` không gửi giá, máy chủ tính lịch OTA hoặc ghi 0 đ, **số đã gõ mất mà không báo**. Với Nội bộ, đó đúng là lỗi BUG-R4-037 / FB-R4-ARC-FE-PR82-01 (mất 600.000 trong ví dụ BR-105) đi qua cửa sau.
- Sau PR: nút kiểm `partialRates()` trước, cùng câu như nút "Tạo đơn". Đúng BR-105 (3): "gõ một phần số đêm → Desk chặn, không tạo đơn. Số đã gõ không được bỏ lặng lẽ". Luật này áp cho mọi lối tạo đơn, không riêng nút chính.
- Không chặn thêm gì khác: Nội bộ để trống hết (miễn phí cả đơn) và OTA để trống hết (lịch OTA) vẫn tạo được ở căn khác. Trực tiếp/CTV không đổi (giá theo bản xem của căn mới).
- Hai chỗ chưa gọn, xem thẻ 171-01: hộp "Đổi sang căn" của đơn Nội bộ gõ một phần vẫn hiện dòng Tổng; câu lỗi nằm dưới bảng giá, xa nút vừa bấm. Thiếu ca test cho nhánh này.

## 5. Phần còn lại

- Đổi số khách thì bảng tổng hiện "–" tới khi bản xem đúng số khách về; "Tạo đơn" không chờ vì máy chủ tính lại khi lưu. Đúng: lễ tân không đọc cho khách một tổng chưa có phụ thu người (BR-110).
- `stay.after_noon_hint` lấy `{time}` từ `checkout_time`. Đúng: giờ trả phòng là tham số.
- Ô Trực tiếp/CTV trống → `booking.error.rate_missing` thay câu "(lớn hơn 0)". Đúng: ô trống và ô gõ 0 là hai lỗi khác nhau.

## 6. Thẻ

### FB-R5-DOM-FE-171-01
- Mức độ: Minor – FE (UXD xem chữ nếu cần), v1.0.5 nếu kịp, không chặn gộp.
- Vị trí: `BookingDialog.tsx`, `useRoomView` (hộp "Đổi sang căn …") và `submit(…, { roomId })`; `v5-20-22-booking-quote-fea.test.tsx`.
- Vấn đề:
  1. Đơn **Nội bộ** gõ một phần: `otaCalendar` chỉ xét OTA, nên hộp vẫn hiện dòng **Tổng** = tổng các ô đã gõ (ví dụ BR-105: 300.000 + 300.000 + trống → "600.000 đ"). Bấm "Tạo đơn ở căn …" thì bị chặn. Hộp hiện một tổng mà đơn không bao giờ có.
  2. Bị chặn thì câu lỗi hiện ở `bk-rates-err` dưới bảng giá, trong khi lễ tân vừa bấm nút trong hộp ở đầu form. Có `role="alert"`, nhưng người nhìn có thể không thấy nếu bảng giá nằm ngoài màn.
  3. Không có ca test nào cho nút "Tạo đơn ở căn …" với OTA hay Nội bộ gõ một phần. Đây là hành vi mới duy nhất của PR không có test.
- Vì sao quan trọng: ca hay gặp lúc đông: căn đầy, Desk mời đổi căn, lễ tân bấm nhanh. Thấy tổng 600.000 rồi bị chặn mà không thấy câu, lễ tân dễ chuyển sang kênh khác cho xong, đúng lối thất thoát BR-105 (8) muốn chặn.
- Đề xuất sửa: (1) gõ một phần (OTA hay Nội bộ) thì hộp không hiện dòng Tổng, hiện câu của `partialRates()` ngay trong hộp, thay cho dòng Tổng; (2) giữ câu dưới bảng như hiện nay; (3) thêm 2 ca: OTA gõ 2/3 đêm và Nội bộ gõ 2/3 đêm, bấm "Tạo đơn ở căn …" → không gọi `createReservation`, câu hiện, số đã gõ còn nguyên.
- Trạng thái: Open

### FB-R5-DOM-FE-171-02
- Mức độ: Minor – FE, ARC (hợp đồng 0.3.14), v1.0.6.
- Vị trí: `rules.ts` `RULE_DEFAULTS.longStayFromNights` = 30; `rsvErrorText` nhánh `LONG_STAY_REQUIRES_CONTRACT`.
- Vấn đề: hôm nay production chạy ngưỡng thuê tháng thấp hơn 30 (B4 chưa làm). Nếu `getBookingRules` lỗi (mạng chập chờn lúc mở Desk), Desk dùng 30: không hiện hộp dài hạn cho đơn 28–29 đêm, máy chủ từ chối `LONG_STAY_REQUIRES_CONTRACT`, và câu ghi "Từ 30 đêm là thuê dài hạn" cho một đơn 28 đêm. Câu tự mâu thuẫn.
- Vì sao quan trọng: ca hiếm, nhưng xảy ra đúng lúc lễ tân đang báo giá dài ngày cho khách. Không sai tiền.
- Đề xuất sửa: v1.0.6, Problem `LONG_STAY_REQUIRES_CONTRACT` kèm ngưỡng máy chủ đã áp (như `minStayNights` của `MIN_STAY_NOT_MET`), Desk ưu tiên số của Problem, rồi mới tới quy tắc đã đọc. Tới đó giữ như PR: mặc định 30 là mức INV đã chốt.
- Trạng thái: Open

### FB-R5-DOM-UXD-171-03
- Mức độ: Suggestion – UXD (hifi `12-sales-quote.html`), không chặn.
- Vị trí: hifi báo giá, số minh họa.
- Vấn đề: FE chỉ đổi khóa. Số minh họa nên là ca có hai mức giá thật để người đọc hifi thấy cách gom.
- Đề xuất sửa: dùng ví dụ mục 2: Studio 800.000, 01/01–04/01/2027: "1 đêm × 1.040.000", "2 đêm × 800.000", tổng 2.640.000 (ghi chú: theo mức tăng ngày đặc biệt còn chạy; về 0 khi INV làm B2).
- Trạng thái: Open

## 7. Điểm làm tốt

- Tìm ra và chặn đúng cửa sau của lỗi mất giá đã gõ, cùng một câu với nút chính, không thêm luật mới.
- Gom đêm theo số tiền sửa luôn lỗi "n × giá ≠ dòng" của mã cũ mà không cần hỏi lại luật giá.
- Mọi ngưỡng và giờ trong câu lấy từ tham số, đúng hướng "INV chỉnh một lần theo từ điển".

## 8. Giả định

- `getBookingRules` trả đúng `long_stay_required_from_nights` đang hiệu lực hôm nay.
- PR head vẫn là `e825de5b` lúc gộp. Nếu FE chỉ thêm phần sửa thẻ 171-01 (ẩn Tổng, câu trong hộp, 2 ca test), DOM không cần xem lại.

`| 2026-11-07 | 5 | **DOM – review FE PR #171 (Gói 2 Desk V5-20 + V5-22) @ e825de5b: DUYỆT nghiệp vụ.** Câu dài hạn lấy {n} = longStayFromNights đang chạy (production còn dưới 30 tới B4), MIN_STAY giữ minStayNights. Báo giá gom đêm theo số tiền: n × giá luôn = dòng, sửa lỗi cũ lấy giá đêm đầu nhóm; đêm không liền nhau cùng giá chung dòng là chấp nhận. OTA chưa gõ = "Lịch giá OTA", không bao giờ "0 đ"; gõ một phần → câu đủ hoặc không. **Xác nhận hành vi mới:** "Tạo đơn ở căn …" chặn OTA/Nội bộ gõ một phần như nút chính – đúng BR-105 (3), trước đây mất giá đã gõ không báo (cửa sau của BUG-R4-037). Thẻ 171-01 Minor FE (hộp đổi căn của Nội bộ gõ một phần vẫn hiện Tổng; câu lỗi xa nút; thiếu 2 ca test), 171-02 Minor v1.0.6 FE/ARC (Problem LONG_STAY kèm ngưỡng; RULE_DEFAULTS 30 lệch production khi đọc quy tắc lỗi), 171-03 Suggestion UXD (số minh họa hifi). Gộp chờ CI: gitleaks đỏ. Không ESC | DOM | rounds/round-05/reviews/DOM-on-fe-pr-171.md |`
