# UXD trả lời – Landing v1.2 → v1.2.1 (Round 2, Sprint 4, luồng LP-v1, bước Phản hồi & sửa)

- Người trả lời: UXD | Ngày: 17/10/2026
- Trả lời cho:
  - phản biện thiết kế `rounds/round-02/reviews/landing-v12-critic.md` (kết luận "CẦN SỬA, mức nhẹ");
  - thẻ SEC FB-R2-SEC-UXD-04…08 (`rounds/round-02/reviews/landing-booking-SEC.md`);
  - ghi chú DOM và PO qua ORC (17/10).
- Sản phẩm đã sửa:
  - `product/design/landing/concept.md` v1.2.1 – bảng "đã sửa theo phản biện" ở mục 0.1, thẻ SEC ở 0.2, điểm PO ở 0.3;
  - `product/design/landing/mock/index.html` v1.2.1;
  - `mock/shots/` (chụp lại 9 tệp);
  - `README.md`.
- Bản xem trước đã đồng bộ (`landing-preview/`). Chưa commit; không đụng `product/apps/landing-web`.

## 1. Phản biện thiết kế

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| N1 – Liên hệ + chân trang lặp | Done | Chân trang chỉ còn lockup, tagline, một dòng link Zalo · Facebook · Email, dòng © và link "Privacy notice". Đã bỏ địa chỉ, hotline và ô gập "Other channels" ở chân trang. Mục Liên hệ bỏ dòng Address. Đo ở 375 px: Liên hệ 761 → 680 px, chân trang 780 → 384 px. Địa chỉ còn 1 lần (Vị trí), "Other channels" còn 1 lần (Liên hệ) – script kiểm cả 8 tổ hợp khổ × ngôn ngữ. Concept 3.1, 6 |
| N2 – Thứ bậc nút đảo; hai nút Zalo đặc | Done | Chốt một thứ bậc ở concept 3.3: **Request to book = nút đặc, đứng trước; Chat on Zalo = nút viền**, giống nhau ở hero và thanh đáy. Zalo chỉ là nút đặc ở Liên hệ, trang cảm ơn và khối "form tắt" – các chỗ này không có nút đặt phòng. Lý do: đặt phòng là việc chính và là đường duy nhất Desk ghi được nguồn `website` (ý 3); Zalo là kênh chat chính (ý 4), luôn một chạm. Thanh đáy ẩn khi hero, Book, **Liên hệ hoặc chân trang** trên màn hình. Kiểm ở 320/375 × EN/VI: ẩn ở Liên hệ và cuối trang |
| N3 – "utilities by meter" ở mục 2 | Done | Thẻ ở dài ngày: "…Monthly rates and a housekeeping plan to suit you." Đã chuyển "Utilities by meter" vào FAQ "How do long stays work?". Đổi "a simple monthly agreement" thành "clear monthly terms" (VI: "điều khoản theo tháng rõ ràng"). Script chặn "monthly agreement", "hợp đồng theo tháng", và chặn "meter/công tơ" trong `#why` |
| N4 – Không có lối Zalo giữa trang trên máy tính | Done | Header từ 768 px có link chữ "Chat on Zalo" (biểu tượng + chữ, cao 44 px), đứng cạnh nút viền "Request to book". Không thêm nút đặc. Header ở 768/1024/1280 × EN/VI không chồng, không xuống dòng |
| T1 – "Bốn hạng phòng", chữ "căn" | Done | H2 VI đổi thành "Chọn phòng hợp với bạn". Lead VI: "…mỗi phòng đều có bếp, máy giặt sấy và bàn làm việc riêng". FAQ VI và meta VI cũng sửa. Script thêm hai từ cấm: "căn" đứng riêng và "bốn hạng phòng" |
| T2 – Lặp bếp/máy giặt/bàn | Done | Thẻ vài đêm nói giấc ngủ, sự yên tĩnh, dọn phòng, rộng hơn mong đợi. Thẻ ở dài nói nhịp sống, không kê thiết bị. Studio City: "City lights from your window". Chữ hiện (EN, FAQ đóng): kitchen 4 → 2, washer 3 → 2, desk 5 → 3, balcony 4 → 3. VI: bếp 5 → 3, giặt 5 → 3 |
| T3 – FAQ lặp | Done (một phần, không bắt buộc) | Bỏ câu "Is my request a confirmed booking?". Câu ở dài ngày giữ lại vì nay chứa chi tiết riêng (điện nước, điều khoản). FAQ không chuyển lên trước form: giữ đường ngắn từ Vị trí tới form |
| T4 – Nút Zalo hero bị cắt ở 375×812 | Done | Ảnh hero trên điện thoại cao tối đa 36svh → 30svh. Khoảng ảnh–chữ và lead–nút 32 → 24 px (< 768). Thanh MOCK một dòng trên điện thoại (73 → 37 px). Ở 375×812, hai nút kết thúc tại 739/799 px khi có thanh MOCK, 702/762 px khi không có (critic đo 779–827) |
| T5 – Chữ nút không thống nhất | Done | Mọi nút/link tới form: "Request to book" / "Yêu cầu đặt phòng" (header, menu, hero, thanh đáy, H2 Book). Nút gửi: "Send booking request" / "Gửi yêu cầu đặt phòng". Script kiểm: không nút/link nào có chữ đúng bằng "Book" hay "Đặt phòng" |
| T6 – Khoảng cách lẻ | Done (không bắt buộc) | Đã sửa CSS về thang:<br>– nút 22 → 24;<br>– ô nhập 11/14 → 12/16 (viền lỗi 2 px làm bằng `box-shadow`);<br>– `.btn-sm` 10 → 8;<br>– `gap` 6 → 8;<br>– `.brand` 10 → 12 (lockup 187 px ≥ 180);<br>– `.wm-sub` 6 → 8;<br>– mũi tên .4em → 8;<br>– khoảng trong bước 2 → 4.<br>Concept 3.3 ghi rõ phạm vi của thang và các ngoại lệ có chủ ý (focus ring, gạch chân, viền, đoạn văn 1em, chrome của mock) |
| T7 – Xuống dòng | Done | – `.nw` cho "280 L/lít", "1 Gbps", "55-inch/inch", "07:00–22:00".<br>– Dòng thông số phòng rút gọn ("Sleeps 2–3 · 29 m² · City view"); dấu "·" không bao giờ đứng đầu/cuối dòng.<br>– Nút chọn kiểu ở: "By the night / By the month" – "Theo đêm / Theo tháng", một dòng từ 320 px.<br>– Ô hạng phòng dùng tên ngắn; số khách chuyển sang dòng gợi ý dưới ô; VI "Hạng nào cũng được".<br>Đo ở 320–1280 × EN/VI: không chữ bị cắt, không nút hai dòng. Ô ngày theo ngôn ngữ trình duyệt đã ghi cho FE-LP/QA (concept 13) |
| T8 – WhatsApp ngang Zalo trong form | Rejected (giữ có chủ ý) | Lý do: form là lối chính cho mọi khách, kể cả khách nước ngoài chưa có Zalo (DOM R1). Zalo đứng đầu và được chọn sẵn; bốn ô cùng cỡ để dễ chạm. Ngoài form, WhatsApp vẫn chỉ nằm trong ô gập. ORC nói rõ với INV đây là chủ ý (concept 15.1 mục 5) |
| T9 – Link Zalo chưa phải OA | Noted | Tạm dùng `zalo.me/0844440909`. Đổi sang link OA ở một chỗ cấu hình khi ESC-021 xác thực xong. Nên nhắc trong lượt trình INV |

## 2. Thẻ SEC (phần giao diện)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-SEC-UXD-04 | Done (phần UXD) | – Ô đồng ý dùng đúng câu A.1 (EN/VI); dòng A.2 luôn hiện ngay dưới.<br>– Link riêng "Privacy notice / Thông báo xử lý dữ liệu" tới `/privacy/#booking-requests` và `/vi/privacy/#yeu-cau-dat-phong`, mở cùng thẻ. Trong mock, link chỉ báo "MOCK: …".<br>– `consentVersion` lấy theo bản dựng.<br>– Script so khớp nguyên văn A.1/A.2 ở 8 tổ hợp.<br>Còn mở ở C-3: trang thông báo do SEC soạn, luật sư duyệt |
| FB-R2-SEC-UXD-05 | Done (phần UXD) – có 1 lệch | – Ô bẫy: nhãn "Leave this field empty", thêm `data-1p-ignore` và `data-lpignore="true"`. FE-LP tra đủ danh sách; QA làm ca tự điền.<br>– Trang cảm ơn thêm dòng lối thoát, hotline là link trong câu.<br>– **Lệch:** giờ trong câu là mốc của câu hứa công khai (gửi lúc + 60 phút trong giờ trực; ngoài giờ là 09:00), **không phải `{replyBy}`**. BR-912 v0.3.8 tách hạn nội bộ 15 phút (`replyBy`) khỏi câu hứa công khai, và trang không được hiện `replyBy`. Cùng ý với SEC, khác nguồn giờ. **Đề nghị SEC xác nhận** |
| FB-R2-SEC-UXD-06 | Done – chờ INV một câu | – FAQ chống giả danh dùng câu SEC chốt, có `{receivingAccountHolder}` (lấy từ cấu hình lúc dựng; chờ tên pháp nhân).<br>– Thêm câu "Our Facebook page is for news. We do not confirm bookings or take deposits through Facebook messages." – **INV xác nhận** nhân viên không dùng Messenger cho việc này (G-15).<br>– Việc INV tự làm (tên fanpage, 2FA, bài ghim) đã ghi ở concept 6 để ORC đưa vào danh sách |
| FB-R2-SEC-UXD-07 | Done (phần UXD) – chuyển ARC phần hợp đồng | – Mock dùng tên khóa của hợp đồng: `guestName`, `preferredChannel`, `note`, `roomType`. Slug theo quy tắc hợp đồng, ví dụ `standard-studio-city-view`.<br>– Mã yêu cầu theo bảng Crockford, hiển thị 4 + 4 bằng khoảng cách CSS, không có ký tự phân cách.<br>– Link fanpage: PO chốt `#book` trên trang chủ.<br>– Lệch còn lại cần **ARC sửa hợp đồng** (concept 5.2, bảng A1–A3), xem mục 4 |
| FB-R2-SEC-UXD-08 | Done | – `<form hidden>` không có `action`; script bỏ `hidden`. Kiểm khi tắt JavaScript: form ẩn, không có `action`, hiện câu + link Zalo.<br>– Mã, tên, ngày không vào URL/hash/tiêu đề.<br>– Nút "Open Zalo" chỉ là link cấu hình |

## 3. Ghi chú qua ORC (DOM, PO)

| Nguồn | Trạng thái mới | Ghi chú |
|---|---|---|
| DOM – tên khóa tham số `web_inquiry.*` cũ | Done | Concept và mock dùng `web_request_public_promise_minutes` (60), `web_request_public_promise_next_morning_by` (09:00), `front_desk_hours`. Đã bỏ `public_site.show_scarcity`; phương án B chỉ trả còn/hết (BR-916 (4)). Hạn nội bộ `web_request_response_minutes` = 15 phút chỉ dùng cho `replyBy` và không hiện trên trang (concept 5.4, 13) |
| PO (1) – gỡ G-9 | Done | Đã bỏ dòng G-9 và mọi nhãn chờ INV về phương án A |
| PO (2) – Premium "extra bed" | Done – lệch 1 chữ, cần PO/DOM xem | – VI đúng câu PO: "sofa ngủ thêm một người".<br>– EN: "a **sofa** for one more guest", không dùng "sofa bed". Lý do: BR-110 ghi người thêm ngủ sofa lớn có sẵn, không nệm phụ; DOM dặn không viết "sofa bed".<br>– BR-110 cũng ghi Premium có **giường 1m4** trong định mức 3 nhưng câu mới không nhắc. Đề nghị Q4 hỏi INV cả hai ý.<br>– Muốn dùng nguyên "sofa bed" thì đổi một chuỗi |
| PO (3) – Không tự nhận "hotel"/hạng sao | Done | – Bỏ "hotel check-in times" ở FAQ.<br>– Còn 3 chỗ, đều là so sánh: lead "The care of a small hotel…", H3 "Beyond what a hotel room gives you", "Hotel-grade… bedding". Lý do và câu thay sẵn nếu luật sư (LZ-9) không cho: concept 2.4.<br>– Script chặn "is a hotel/là khách sạn", hạng sao, "luxury/sang trọng", "extra bed", JSON-LD `Hotel` |
| PO (4) – Link fanpage `#book` | Done | Concept 5.7: trang chủ + `#book`, không có trang `/book/`. Khi form tắt, `#book` vẫn là khối Zalo. ARC sửa ví dụ `landingPath` |
| PO (5) – Câu hứa | Done | Bước 2, khối form tắt và trang cảm ơn: "Within 1 hour (07:00–22:00, Da Lat time); outside these hours, before 09:00 the next morning." / "Trong 1 giờ (07:00–22:00, giờ Đà Lạt); ngoài giờ, trước 09:00 sáng hôm sau." |
| ORC – ánh xạ hạng phòng | Verified | Concept mục 4 và G-14 đã đúng theo DOM: Premium = 302/402, Signature = 301/401. "Mục 7" của v1.2 là bảng màu, không chứa ánh xạ. Mock không có số căn |

## 4. Việc chuyển vai khác (qua ORC)

- **ARC** – sửa `WebsiteBookingRequestInput` theo SEC ARC-14 (concept 5.2):
  - **A1:** chỉ một trong `phone` / `email`, theo `preferredChannel`;
  - **A2:** bỏ `childrenAges`, thêm hai số đếm theo nhóm tuổi; mock dùng `children6to11`, `childrenUnder6` – tên do ARC chốt;
  - **A3:** "By the month" gửi `arrival` + `months` (1–24 hoặc `null`), không có `departure`. Đề xuất: thêm `months` tùy chọn; khi có `months` thì `departure` không bắt buộc;
  - chọn cách trang biết giờ của câu hứa: trường mới trong 202, hoặc FE tự tính từ tham số công khai;
  - sửa ví dụ `/book/` trong mô tả `landingPath`.
- **SEC:** xác nhận dòng lối thoát dùng giờ của câu hứa công khai, không dùng `replyBy`.
- **PO/DOM:** Q4 Premium – hỏi cả giường 1m4 lẫn câu sofa.
- **FE-LP:** cập nhật `landing-web` theo concept 3.1, 3.3, 5, 6, 13.
- **QA:** thêm các ca ở concept 12.1:
  - thanh đáy ẩn ở Liên hệ và chân trang;
  - vừa chữ ở 320 px;
  - ô ngày theo ngôn ngữ máy.

## 5. Kết quả kiểm (v1.2.1, Chromium + Playwright 1.63 + axe-core 4.14)

Kiểm ở 320 / 375 / 768 / 1280 × EN / VI:
- không cuộn ngang; quét thêm 392 bề rộng, 0 lần cuộn ngang;
- 1 H1, 0 `id` trùng;
- axe 0 lỗi ở 4 trạng thái: mặc định, ô gập + Notes mở, form lỗi, trang cảm ơn;
- tương phản: 11 cặp, thấp nhất 4,53;
- 0 vùng chạm < 44 px;
- 0 glyph font dự phòng;
- 0 từ cấm;
- 0 lỗi console.

Ngân sách byte:
- 375 DPR 2, lúc mở trang: 302/320 KB. Giảm 21 KB vì JetBrains Mono không còn tải khi mở trang – thanh MOCK và chip Notes chuyển sang Be Vietnam Pro;
- các mốc khác đều đạt (concept 12.2).

Chiều cao trang:
- 375 px EN: 9.314 → 8.870 px;
- 1280 px EN: 8.277 → 8.161 px.

Ảnh chụp lại trong `mock/shots/`:
- mobile-375-en-top, mobile-375-vi-top;
- mobile-320-en-top, desktop-1280-en-top;
- mobile-375-en-full-1, mobile-375-en-full-2;
- desktop-1280-en-full;
- mobile-375-en-book, mobile-375-en-sent.
