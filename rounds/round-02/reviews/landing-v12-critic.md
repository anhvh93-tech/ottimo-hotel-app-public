<!-- Ghi lại nguyên văn kết quả người phản biện thiết kế của workflow landing-v12-feedback (wf_da29e936-2c8), ORC 17/10/2026. -->

# Phản biện thiết kế: Landing page OTTIMO mock v1.2 (theo FB-INV-002)

**Kết luận: CẦN SỬA, mức nhẹ.** Không có lỗi chặn và không cần làm lại bố cục. Cả 5 ý của INV đều đã được xử lý về cơ bản. Tuy vậy, ý 5 (bố cục rối) và ý 2 (định vị) còn 4 điểm cụ thể dễ bị INV nhận ra ngay. Sửa xong mục "Nên sửa" thì trình được.

## Cách kiểm
- Mở `product/design/landing/mock/index.html` v1.2 bằng Chromium không giao diện, chạy Playwright 1.63 và axe-core của `product/tests`.
- Khổ màn hình 375×812 và 1280×800, cả EN và VI. Đo thêm vị trí nút hero ở 375×667 và 390×844 sau khi bỏ thanh mock.
- Luồng form chạy với `?utm_source=facebook&utm_medium=social`.

## Đối chiếu FB-INV-002

| # | Ý của INV | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Không nhắc số phòng | **Đạt** | Không có "10", "ten", "mười" đứng cạnh room/apartment/căn/phòng. Các số còn lại chỉ là số phòng ngủ ("1 phòng ngủ + 1", "Two Bedrooms"), sức chứa và ô chọn số khách. Riêng H2 tiếng Việt "**Bốn** hạng phòng" có thể bị đọc lướt thành số phòng (xem T1). |
| 2 | Boutique stay, không phải căn hộ dịch vụ; cả hai nhóm khách đều hài lòng | **Đạt, còn 1 điểm** | 0 lần "serviced apartment", "căn hộ dịch vụ", "apartment", "căn hộ". Lời hứa kép rõ: "Beyond what a hotel room gives you" và "Made for living here" (VI: "Sinh ra cho những kỳ ở dài", gần đúng lời INV). Riêng cụm "utilities by meter / điện nước theo công tơ" ở mục 2 vẫn mang mùi thuê căn hộ (xem N3). |
| 3 | Đặt phòng trực tiếp, đổ về Desk với nguồn website | **Đạt** | Form có đủ trường đã chốt (concept 5.2 và ADR-014 4.5); chi tiết ở dưới bảng. |
| 4 | Zalo là kênh chính; kênh khác để chỗ phụ; có Facebook | **Đạt, còn 2 điểm** | 7 link Zalo. WhatsApp, Telegram và Viber chỉ nằm trong 2 ô gập "Other channels", mặc định đóng. Facebook là link thường ở mục Liên hệ và chân trang, kèm `sameAs`. Không có SDK, iframe hay plugin của Facebook. Còn N2 và N4. |
| 5 | Bố cục rối, chưa mượt | **Cải thiện rõ, chưa xong** | 8 mục, 9 ảnh (v1.1 có 18). Trang ở 375 px cao 9.314 px (EN) và 9.422 px (VI). Phần cuối trang còn lặp nhiều (N1) và thứ bậc nút bị đảo khi cuộn (N2). |

Chi tiết ý 3:
- Các trường trong form: `stayType`, `arrival`, `departure` hoặc `months`, `adults`, `children`, `infants`, `listingSlug`, `name`, `preferredContact`, `phone` hoặc `email`, `message`, `consent`, `website` (honeypot), cùng `utm` và `landingPath`.
- Bấm "Request this room" thì form tự chọn sẵn `premium-1br`.
- Gửi form trống thì khối tóm tắt báo đủ 5 lỗi.
- Chọn 4 người lớn cho Studio thì báo lỗi vượt sức chứa đúng.
- Gửi thành công hiện mã yêu cầu và nút "Open Zalo".
- Payload ghi `source = website · facebook`.
- Câu "No payment on this website" có ở bước 3 và trong FAQ.

## Thương hiệu, AA, cuộn ngang
- **Màu:** mọi màu chữ và màu nền đều nằm trong bảng màu, thêm màu trắng cho nền ô nhập và chữ trên nút. Màu xám lạ duy nhất (#767676) là viền mặc định của ô honeypot, vốn nằm ngoài màn hình. Sage không dùng; concept mục 7 đã ghi lý do.
- **Font:** chỉ Lora, Be Vietnam Pro và JetBrains Mono, tải đủ các độ đậm 400/500/600 và Lora nghiêng.
- **Tương phản:** thấp nhất 4,53 (Stone trên Cream, chữ 14 px); Oak trên Ink 4,59 (nhãn 13 px). Đạt AA. Oak không bị dùng làm chữ trên nền sáng.
- **axe** (wcag2a/aa, 21aa, 22aa): 0 lỗi ở cả 4 tổ hợp. Không có lỗi console. Đúng một H1.
- **Cuộn ngang:** không có. `scrollWidth` bằng `clientWidth` ở 375 và 1280. Hàng thẻ phòng vuốt ngang bên trong khung (1.178/375) là chủ ý.
- **Giọng văn:** EN dẫn dắt, VI là bản biên tập. Không emoji, không chữ in hoa để nhấn.

## Phát hiện theo mức độ

### Nghiêm trọng (chặn trình INV)
Không có.

### Nên sửa trước khi trình INV

**N1. Mục Liên hệ và chân trang lặp gần như nguyên nhau, làm cuối trang dài và rối (ý 5).**
- Ở 375 px, mục Liên hệ cao 761 px và chân trang cao 780 px. Hai phần cộng lại khoảng 1.540 px, tức 16% trang, gần như cùng một nội dung.
- Địa chỉ xuất hiện 3 lần (Location, Contact, Footer).
- Hotline, email, Facebook và link Zalo mỗi thứ xuất hiện 2 lần.
- "Other channels / Kênh khác" xuất hiện 2 lần, cách nhau khoảng 300 px (ảnh `v4.png`).
- Đề xuất:
  - Chân trang chỉ giữ lockup, tagline, một dòng link (Zalo · Facebook · email), dòng © và link quyền riêng tư.
  - Bỏ ô gập "Other channels" và địa chỉ ở chân trang.
  - Bỏ dòng Address trong mục Contact vì mục Location đã có.

**N2. Thứ bậc nút bị đảo khi cuộn, và có lúc 2 nút đặc "Chat on Zalo" cùng hiện (ý 4 và 5).**
- Ở hero, "Request to book" là nút đặc và Zalo là nút viền. Cuộn xuống, thanh dính đáy lại để Zalo đặc và "Book" viền.
- Ở mục Contact trên điện thoại, thanh đáy vẫn hiện (`contact: hidden=false`). Màn hình lúc đó có 2 nút đặc "Chat on Zalo" giống hệt nhau, trái với quy tắc "một nút đặc mỗi màn hình" của chính concept 3.3. Thanh đáy còn che dòng "Other channels" (ảnh `m-contact-center.png`).
- Đề xuất:
  - Ẩn thanh đáy khi `#contact` đang trên màn hình, thêm `#contact` vào IntersectionObserver.
  - Chốt một thứ bậc nhất quán và ghi vào concept. Ví dụ: hero và thanh đáy đều để Zalo đặc, Book viền. Hoặc ngược lại cho cả hai.

**N3. "Utilities by meter / điện nước theo công tơ" là tín hiệu thuê căn hộ rõ nhất trên trang (ý 2).**
- Cụm này nằm ở thẻ "For a month, or longer" của mục 2, chỉ ngay sau hero. Đây là chỗ khách đặt kiểu khách sạn cũng đọc.
- Trong FAQ "How do long stays work?" còn có "a simple monthly agreement / hợp đồng theo tháng", gần với "lease", một từ nằm trong danh sách từ cần tránh ở concept 2.3.
- Đề xuất:
  - Ở thẻ mục 2, đổi thành "Monthly rates and a housekeeping plan to suit you."
  - Chuyển "utilities by meter" vào câu trả lời FAQ, nơi chỉ khách ở dài mở ra đọc.
  - Đổi "monthly agreement" thành "clear monthly terms / điều khoản theo tháng rõ ràng".

**N4. Trên máy tính và máy tính bảng, gần như không có lối vào Zalo giữa hero và mục Contact (ý 4).**
- Thanh đáy chỉ có dưới 768 px. Header ở 1280 chỉ có nút "Request to book".
- Ở 1280, nút Zalo kế tiếp sau hero nằm ở y≈7.381 px, cách hero khoảng 6.700 px.
- Ở 768–1023 px, header không có nav cũng không có nút Zalo.
- Đề xuất: thêm link chữ "Chat on Zalo" (hoặc "Contact") vào header từ 768 px trở lên. Không thêm nút đặc thứ hai.

### Thấp (sửa được thì tốt, không chặn)

**T1. Còn chữ dễ bị đọc thành số phòng hoặc căn hộ (ý 1 và 2).**
- H2 tiếng Việt "Bốn hạng phòng". Đề xuất "Chọn cách ở" hoặc "Các hạng phòng".
- Lead hero tiếng Việt "trong những **căn** phòng". Concept 2.3 tự cấm chữ "căn", và script kiểm bắt được 1 lần. Đề xuất "mỗi phòng đều có bếp, máy giặt sấy và bàn làm việc riêng".

**T2. Lặp ý "bếp, máy giặt, bàn làm việc".**
- Phần chữ đang hiện (chưa tính FAQ đóng) có desk ×5, kitchen ×4, washer ×3, balcony ×4. Ở bản VI, "bếp" và "giặt" mỗi chữ ×5.
- Chúng nằm ở hero lead, cả 2 thẻ mục 2, Amenities và mô tả phòng.
- Đề xuất: thẻ "For a few nights" nhấn giấc ngủ, sự yên tĩnh và dọn phòng; để thiết bị cho Amenities kể.

**T3. FAQ đặt sau form, nhắc lại nội dung đã có.**
- "Is my request a confirmed booking?" lặp bước 3 và dòng "No payment on this website".
- "How do long stays work?" lặp thẻ mục 2.
- Đề xuất: bỏ câu FAQ 3, hoặc chuyển FAQ lên trước mục Book để người đọc hết băn khoăn rồi mới tới form.

**T4. Nút Zalo ở hero bị cắt ở 375×812.**
- Đã bỏ thanh mock. Nút nằm ở y 779–827 trong khi màn hình cao 812 px.
- Thanh đáy đang ẩn (vì nút hero còn trên màn hình), nên màn hình đầu chỉ thấy khoảng 2/3 nút Zalo.
- Ở 375×667 thì không bị, vì cả hai nút hero rơi xuống dưới và thanh đáy hiện.
- Đề xuất: giảm `max-height` ảnh hero ở điện thoại từ 36svh xuống khoảng 32svh.

**T5. Chữ trên nút đặt phòng không thống nhất.**
- Thanh đáy ghi "Book"; header VI ghi "Đặt phòng"; các chỗ khác ghi "Request to book / Gửi yêu cầu đặt phòng".
- "Book" dễ hiểu thành đặt ngay, đặt chắc, trái với phương án A.

**T6. Khoảng cách chưa đúng hoàn toàn thang 4…128.**
- Còn các giá trị lẻ:
  - nút `22px`;
  - ô nhập `11px 14px`;
  - `.btn-sm 10px`;
  - `gap 6px` (`.err`, `.sb`);
  - `.brand gap 10px`;
  - `.wm-sub margin-top 6px`.
- Nếu concept tuyên bố "chỉ dùng thang" thì nên sửa câu đó hoặc sửa CSS.

**T7. Một số chỗ xuống dòng chưa đẹp.**
- Ở 1280: "Samsung 280 / L fridge" bị tách dòng (cần khoảng trắng không ngắt).
- Bản VI 375:
  - "Một tháng trở lên" xuống 2 dòng trong nút chọn;
  - ô hạng phòng bị cắt chữ "…gợi ý giúp tôi".
- Ở 375: dòng thông số phòng bị gãy dòng ngay sau dấu "·".
- Ô ngày hiện mm/dd/yyyy ở bản VI vì theo ngôn ngữ trình duyệt. Cần ghi rõ cho FE-LP và QA.

**T8. Zalo WhatsApp ngang hàng trong form.**
- Trong ô "Reply on", WhatsApp có cùng cỡ với Zalo.
- Lý do khách quốc tế (DOM R1) hợp lý. Tuy nhiên khi trình INV nên nói rõ đây là chủ ý, vì INV muốn các kênh khác "khó tìm một xíu".

**T9. (Thông tin) Link Zalo vẫn là zalo.me theo số hotline, chưa phải Zalo OA.** Còn chờ ESC-021, chỉ cần đổi một chỗ cấu hình. Nên ghi điều này trong lượt trình INV.

## Bố cục: số liệu đo được

| | Hero | Why | Rooms | Amenities | Location | Book | FAQ | Contact | Chân trang |
|---|---|---|---|---|---|---|---|---|---|
| 375 EN (px) | 826 | 1.009 | 883 | 1.173 | 1.130 | 2.104 | 546 | 761 | 780 |
| 1280 EN (px) | 816 | 831 | 1.756 | 814 | 919 | 1.473 | 543 | 658 | 366 |

Những gì đã làm tốt:
- Nhịp nền Ivory · Ivory · Cream · Ivory · Ink · Ivory · Ivory · Cream · Ink đúng như concept.
- Hai mục liền nhau cùng nền chỉ dùng một khoảng cách.
- Khoảng cách giữa các mục đều nhau: 64 px ở điện thoại, 128 px ở 1280.
- Mỗi mục một ý.

Chỗ còn nặng:
- Rooms ở 1280 cao 1.756 px, vì lưới 2×2 ảnh lớn.
- Book ở 375 cao 2.104 px, do 16 ô nhập. Chấp nhận được vì đây là chức năng chính.
- Cuối trang như đã nói ở N1.

## Ảnh chụp để tham chiếu
Thư mục: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/out/`
- Đầu trang và cả trang theo từng tổ hợp: `375-en-*`, `375-vi-*`, `1280-en-*`, `1280-vi-*`.
- Từng đoạn: `d0–d5` (1280 EN), `v0–v4` (375 VI).
- `m-contact-center.png`: hai nút Zalo đặc cùng hiện.
- `flow-done.png`: trang cảm ơn.
- Số liệu thô: `results.json`.

Không sửa file nào trong repo và không commit.
