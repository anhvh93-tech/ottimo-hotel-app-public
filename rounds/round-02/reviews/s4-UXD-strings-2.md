# UXD review chữ – lượt 2, Round 2 Sprint 4

- Người review: UXD | Ngày: 17/10/2026 | Bước: Review (chữ)
- Phạm vi review (ORC giao):
  1. FE-A: 16 chuỗi của 2 nhóm "FE-A sửa theo review UXD: số tiền thu thật ở H13" (6) và "FE-A S4-25: xin miễn phí ngoài bước nhận phòng" (10); `party.surcharge_waiver_note` → CŨ.
  2. FE-LP: bản dựng landing đợt 2 (`rounds/round-02/outputs/FE/lp-v1-report.md` mục 0.3) – điểm lệch so với mock, chuỗi `promise = call_now`, meta description, nhãn trợ năng VI, trang 404, câu bản xem trước.
  3. RU: 5 khóa `guest.req.decline.*` còn thiếu (BE-D `outputs/BE/s4-be-d.md` 2.6b).
- Căn cứ:
  - Brand Guidelines v1.0: EN dẫn dắt, VI hỗ trợ; ngắn, điềm tĩnh; không emoji, không cảm thán;
  - `product/design/content-guide.md`;
  - BR-436, BR-912 v0.3.8;
  - hợp đồng 0.3.7 bổ sung 2 (`WebsiteBookingRequestAccepted.promise`);
  - landing concept v1.2.1.
- Kết quả: **duyệt cả 16 chuỗi FE-A, trong đó sửa 7**. Landing: **chấp nhận 8/9 điểm lệch, sửa 1** (meta), sửa thêm câu `call_now` và trang 404. **RU: 5 bản nháp**.
- Không còn Blocker/Major mở. Chưa commit.

## A. FE-A – chuỗi (nguồn `product/design/tools/gen_strings.py`)

### A.1 H13 – số tiền thu thật (FE-S4-01)
Hành vi: FE-A khóa nút Nhận phòng khi ô "Tiền khách đưa" / "Số tiền đã nhận" còn trống. Đề xuất FE-S4-01 của UXD là "để trống = khách đưa đủ".
- **UXD chấp nhận** cách của FE-A: chặt hơn với tiền, không bao giờ ghi khoản thu khi chưa ai nhập số.
- Cái giá: lễ tân phải gõ số kể cả khi khách đưa vừa đủ. Chấp nhận được – thêm một ô, đổi lại không lệch két.

| Khóa | Kết quả | VI / EN sau duyệt |
|---|---|---|
| `ci.pay_received` | Duyệt | Số tiền đã nhận / Amount received |
| `ci.submit_pay_amount_needed` | Duyệt | Nhập số tiền đã nhận để nhận phòng. / Enter the amount received to check in. |
| `ci.submit_pay_short` | **Sửa** | Số tiền đã nhận còn thiếu {amount}. Thu đủ hoặc chọn cách thu khác để nhận phòng. / The amount received is {amount} short. Collect the rest or choose another method to check in. (Viết "Số tiền đã nhận" cho khớp nhãn ô; bỏ vế thừa "so với số cần thu") |
| `ci.submit_pay_over` | **Sửa** (VI) | Số tiền đã nhận lớn hơn số cần thu {amount}. Ghi đúng {amount}; phần khách trả dư ghi riêng ở folio sau khi nhận phòng. / EN giữ |
| `ci.submit_pos_code` | Duyệt | Nhập mã chuẩn chi trên phiếu POS để nhận phòng. / Enter the approval code from the POS slip to check in. |
| `ci.room_approved` | Duyệt | {name} đã duyệt nhận phòng khi buồng chưa sẵn sàng. Thu tiền và nhận phòng như thường. / EN giữ |

### A.2 S4-25 – xin miễn phí ngoài bước nhận phòng

| Khóa | Kết quả | VI / EN sau duyệt |
|---|---|---|
| `foc.max` | Duyệt | Tối đa {amount} – phần còn lại của dòng sau các khoản miễn/giảm đã có. / EN giữ |
| `foc.over_max` | **Sửa** | Nhập tối đa {amount} – số còn được miễn trên dòng này. / Enter {amount} or less – the amount still available to waive on this line. (Câu lỗi phải nói cách sửa, không chỉ nói "vượt") |
| `foc.needs_reason` | Duyệt | Chọn lý do miễn phí. / Choose a reason for the waiver. |
| `foc.state_applied` | Duyệt | Đã áp / Applied |
| `foc.state_cancelled` | Duyệt | Không còn áp / No longer applied |
| `foc.self_apply_short` | **Sửa** | Minibar {amount} nằm trong mức tự miễn {limit} mỗi lần của bạn. Nhập lại mật khẩu để áp ngay. Nếu hạn mức tháng đã hết, yêu cầu tự chuyển lễ tân trưởng duyệt. / Minibar {amount} is within your self-waiver limit of {limit} per waiver. Re-enter your password to apply it now. If this month's limit is used up, the request goes to a senior receptionist. (BR-436: hạn mức là **mỗi lần miễn**, không phải "per item"; tách hai câu cho dễ đọc) |
| `foc.sent` | Duyệt | Đã gửi duyệt miễn {amount}. / Waiver of {amount} sent for approval. |
| `foc.applied` | Duyệt | Đã áp miễn {amount}. / Waiver of {amount} applied. |
| `party.foc_sent` | **Sửa** | Đã gửi duyệt miễn phụ thu người – mỗi đêm một yêu cầu, tổng {n}. / Extra-guest fee waiver sent for approval – one request per night, {n} in total. (EN cũ sai số nhiều khi n = 1; VI dùng một từ "yêu cầu", không trộn "đề nghị") |
| `party.foc_failed` | **Sửa** (VI) | Đã thêm người và ghi phụ thu, nhưng {n} đêm chưa gửi được yêu cầu miễn. Mở folio để gửi lại. / EN giữ ("folio" viết thường như mọi chuỗi khác) |
| `party.surcharge_waiver_note` | **CŨ** | Không dùng – nay đã có nút xin miễn phụ thu người. Xóa ở v0.5 |

- Kiểm: `pnpm --filter @ottimo/i18n test` 19/19. admin-web `s4-25-foc`, `s4-money`, `reservation`, `booking` 51/51 (test đọc chữ qua `tv(key)` nên tự theo chữ mới).
- FE không phải sửa mã: app đọc thẳng `product/design/copy/strings-*.json`.

## B. Landing – bản dựng FE-LP đợt 2

### B.1 Chín điểm lệch so với mock v1.2.1 (`lp-v1-report.md` 0.3)

| # | Điểm | Kết quả | Ghi chú |
|---|---|---|---|
| 1 | Khối "form tắt" thêm nút viền "Call 08.4444.0909" cạnh "Chat on Zalo" | Chấp nhận | Một nút đặc (Zalo) + một nút viền – đúng thứ bậc concept 3.3. Khách chưa có Zalo vẫn có lối tại `#book`. Đã ghi vào concept 5.5 |
| 2 | Meta description EN 180 / VI 193 ký tự | **Sửa** | Đã rút về EN 159 / VI 159 (mục B.2), cùng chữ ở mock. Xem FB-R2-UXD-FE-S4-20 |
| 3 | Link "Privacy notice" chân trang ẩn tới khi có `/privacy/` | Chấp nhận | Không để link ra 404. Phải bật cùng lúc trang thông báo đăng (SEC C-3) – trước khi bật form |
| 4 | FAQ chống giả danh dùng câu "We never change bank details by message." khi chưa có tên chủ tài khoản | Chấp nhận | Đúng nghĩa, không hứa điều chưa có. Có tên trong `site.json` thì tự đổi sang câu SEC chốt |
| 5 | Chữ FE tự thêm | Duyệt, sửa 1 | Nhãn trợ năng VI duyệt nguyên: "Điều hướng chính", "Điều hướng chính (di động)", "Thao tác nhanh", "Liên kết OTTIMO", "Ngôn ngữ", "Xem trang này bằng tiếng Việt", "Đóng". Câu `call_now` **sửa** (B.3). Câu bản xem trước **duyệt** (B.4) |
| 6 | Tiêu đề thư điền sẵn "Booking – OTTIMO" / "Đặt phòng – OTTIMO" | Chấp nhận | Đúng US-151 AC1. Đây không phải nhãn nút nên quy tắc T5 (không dùng "Book" trơn) không áp |
| 7 | Các số (07:00–22:00, 1 giờ, 09:00, 30%) viết trong chuỗi, test so với `site.json` | Chấp nhận cho LP-v1 | Khi có API tham số công khai thì đọc tham số (concept 13) |
| 8 | Ô bẫy thêm `data-bwignore`, `data-form-type="other"` | Chấp nhận | Đúng SEC UXD-05 ("FE-LP tra đủ danh sách") |
| 9 | Chưa tải JetBrains Mono | Chấp nhận tạm | Phải có trước khi bật form – xem FB-R2-UXD-FE-S4-21 |

### B.2 Meta description (≤ 160 ký tự – ADR-014 mục 5)
- EN (159): "A boutique stay in Da Lat: the care of a small hotel, with a kitchen, a washer-dryer and a desk in every room. Stay a night, or a season. Chat with us on Zalo."
- VI (159): "Boutique stay ở Đà Lạt: sự chăm chút của một khách sạn nhỏ; mỗi phòng đều có bếp, máy giặt sấy và bàn làm việc riêng. Ở một đêm, hay cả một mùa. Nhắn qua Zalo."
- Câu dùng lại lead hero và tiêu đề mục 2. Lời mời là Zalo – đúng ở cả hai chế độ (form tắt/bật). Không "Book", không tự nhận khách sạn (so sánh như hero – concept 2.4).

### B.3 Câu `promise.kind = call_now`
- Bối cảnh: hợp đồng bổ sung 2 có 3 kiểu `promise`; mock chỉ có 2. `call_now` = ngày đến là hôm nay **và** gửi ngoài giờ trực; `minutes` = `web_request_same_day_after_hours_minutes` (30).
- Câu FE cũ: "Arriving tonight? Calling is fastest. We also reply within {n} minutes."
- Vấn đề: với `call_now`, `booking-form.ts` đã hiện dòng "Arriving tonight? Calling is fastest: 08.4444.0909" ngay bên dưới, nên trang cảm ơn **lặp nguyên vế "Arriving tonight? Calling is fastest"**. "We also reply" đứng trước dòng gọi nên chữ "also" không có chỗ dựa.
- **Câu mới** (chỉ mang lời hứa thời gian; giữ `{minutes}`, test `callNow(30)` vẫn đạt):
  - EN: "As you arrive tonight, we will contact you within {minutes} minutes."
  - VI: "Bạn đến trong tối nay, OTTIMO sẽ liên hệ bạn trong {minutes} phút."
- Dùng "contact" thay "reply": khách có thể chỉ để lại email; người trực có thể gọi hoặc nhắn.
- **Lưu ý cho DOM/PO (không phải thẻ FE):** 30 phút vốn là mục tiêu nội bộ (BR-912 (3)), nay thành lời hứa công khai trên trang – trái nguyên tắc "hứa công khai lỏng hơn mục tiêu nội bộ" (60 so với 15 phút). Đề nghị DOM xác nhận 30 phút đêm là giữ được, hoặc đặt tham số hứa công khai riêng (ví dụ 45 phút). INV duyệt cùng danh sách L5.

### B.4 Câu bản xem trước, trang 404, nhãn trợ năng
- Bản xem trước (`notSent`, chỉ có trong `dist-booking-preview`, không deploy): **duyệt nguyên**.
  - EN: "Preview: this request was not sent. Online requests open soon – please chat with us on Zalo."
  - VI: "Bản xem trước: yêu cầu chưa được gửi. Yêu cầu trực tuyến sắp mở – vui lòng nhắn OTTIMO qua Zalo."
- Trang 404 – **sửa**. Tiêu đề cũ "This page is not here." đọc như lỗi dịch; giọng thương hiệu cần câu trọn, điềm tĩnh, không đổ lỗi cho khách.
  - EN: "We could not find this page." / "The link may be out of date or mistyped. You will find everything about OTTIMO on the home page." / nút giữ "Back to the home page"; `<title>` giữ "Page not found · OTTIMO Boutique Stay".
  - VI: "Không tìm thấy trang này." / "Đường dẫn có thể đã cũ hoặc bị gõ nhầm. Mọi thông tin về OTTIMO có ở trang chủ." / "Về trang chủ".
- Nhãn trợ năng VI: duyệt (B.1 điểm 5). "Menu" giữ nguyên ở VI – từ quen thuộc trên điện thoại.

### B.5 Tệp UXD đã sửa trong `landing-web` (chỉ chuỗi, không đổi logic hay chữ ký hàm)
- `src/content/en.ts`, `src/content/vi.ts`: `meta.description`, `notFound.heading`, `notFound.body`.
- `src/scripts/booking-strings.ts`: `when.callNow` (EN, VI). Tệp này là bảng chuỗi lúc chạy, nên UXD sửa luôn thay vì chuyển FE.
- Kiểm:
  - `pnpm --filter @ottimo/landing-web test` → **140/140**, chạy hai lần: sau khi sửa, và sau khi dựng lại `dist/` để các bộ kiểm `dist` đọc chữ mới;
  - `dist/index.html` và `dist/vi/index.html` có description 159 ký tự; trang 404 EN/VI có tiêu đề mới.

### FB-R2-UXD-FE-S4-20
- Mức độ: Minor
- Vị trí: `product/apps/landing-web/src/content/copy.test.ts:42–45` (`description ≤ 200`), `scripts/dist-checks.mjs:421–423` (`> 200`)
- Vấn đề: Hai bộ kiểm nới trần mô tả lên 200 ký tự vì chữ mock cũ dài. Nay chữ đã ≤ 160 (EN 159, VI 159), nhưng trần 200 vẫn để lọt mô tả dài lần sau.
- Vì sao quan trọng: Mô tả dài bị Google cắt giữa câu (ADR-014 mục 5); kiểm tự động là chốt chặn duy nhất.
- Đề xuất sửa: Đưa cả hai trần về **160**, bỏ ghi chú "UXD to shorten".
- Trạng thái: Open

### FB-R2-UXD-FE-S4-21
- Mức độ: Minor (điều kiện trước khi bật form)
- Vị trí: điểm 9 của `lp-v1-report.md` 0.3; trang cảm ơn (mã yêu cầu)
- Vấn đề: Mã yêu cầu chưa có font JetBrains Mono. Brand Guidelines dùng Mono cho mã đặt phòng/mã yêu cầu; concept 8 và 13 ghi Mono chỉ tải khi trang cảm ơn hiện.
- Vì sao quan trọng: Không có Mono, các ký tự dễ nhầm trong mã Crockford (0/O, 1/I – bảng Crockford đã bỏ O, I nhưng khách vẫn đọc to qua điện thoại) khó đọc hơn khi khách đọc mã cho lễ tân.
- Đề xuất sửa: Khi nối transport, thêm JetBrains Mono subset latin, tải theo `unicode-range`/lớp CSS chỉ dùng ở `.ref`. Kiểm ngân sách lúc mở trang không đổi.
- Trạng thái: Open

## C. RU – 5 lý do từ chối yêu cầu khách (nháp, **cần người bản ngữ duyệt**)
Khóa = mã enum `declinedReasonCode` 0.3.7. Thuật ngữ theo các chuỗi RU đã có: "администратор" = lễ tân, "запрос" = yêu cầu.

| Khóa | EN | RU nháp |
|---|---|---|
| `guest.req.decline.not_available_now` | Not available right now | Сейчас это недоступно |
| `guest.req.decline.outside_service_hours` | Outside service hours | Вне часов обслуживания |
| `guest.req.decline.needs_front_desk` | The front desk will contact you about this | Администратор свяжется с вами по этому вопросу |
| `guest.req.decline.duplicate` | Same as a request you've already sent | Вы уже отправляли такой запрос |
| `guest.req.decline.other` | Other reason – see the front desk's message | Другая причина – см. сообщение администратора |

- Ghi chú từng khóa trong bảng chuỗi có "RU nháp (UXD s4-strings-2) – cần người bản ngữ duyệt". `strings-ru.json` vẫn mang `_meta.note` "nháp, cần người bản ngữ duyệt".
- Ba khóa CŨ (`gw.req.decline.*`, `guest.req.decline.out_of_hours`, `guest.req.decline.fully_booked`) không dịch – xóa ở v0.5.

## D. Tệp tạo/sửa
- `product/design/tools/gen_strings.py`: 2 nhóm FE-A → "UXD duyệt 17/10 – s4-UXD-strings-2"; 7 chuỗi sửa; 1 CŨ; RU cho 5 khóa.
- Sinh lại:
  - `product/design/copy/strings-{vi,en,ru}.json`;
  - `product/design/wireframes/assets/strings.js`;
  - `product/design/tools/strings-tables.md` (2740 chuỗi + 8 mẫu).
- `product/design/content-guide.md`: mục 8 dán lại bảng (dòng nguồn ghi v0.4.1); mục 9 thêm dòng 0.4.1.
- `product/apps/landing-web/src/content/en.ts`, `vi.ts`, `src/scripts/booking-strings.ts` (mục B.5).
- `product/design/landing/mock/index.html` (meta description EN/VI giống landing-web); `product/design/landing/concept.md` (0.4, 5.4 `call_now`, 5.5 nút Gọi, 13 trang 404). Bản xem trước landing đã đồng bộ.

## E. Điểm làm tốt (nên giữ)
- FE-A: mọi câu khóa nút đều nói **cách gỡ** ("Nhập…", "Thu đủ hoặc…"), đúng mẫu "lý do cạnh nút" của content guide. FE-A không ghi im lặng khoản thu thừa.
- FE-LP: tự phát hiện `call_now` thiếu chữ và meta quá dài, ghi rõ để UXD xử lý thay vì tự đặt chữ. Giữ link Privacy ẩn để không ra 404.
- Cả hai: test đọc chữ qua khóa (`tv(key)`, `BOOKING_STRINGS`), nên đổi chữ không làm vỡ test.
