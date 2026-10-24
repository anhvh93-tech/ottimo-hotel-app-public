# Landing page OTTIMO – Concept v1.2.1

- Người viết: UXD | Round 2 – Sprint 4, luồng **LP-v1** (ESC-020, ADR-014, EP19) | Ngày: 17/10/2026 | Bước: **Phản hồi & sửa** (theo phản biện thiết kế `rounds/round-02/reviews/landing-v12-critic.md` và SEC `landing-booking-SEC.md` thẻ UXD-04…08)
- Trạng thái: **Bản v1.2.1 – sửa xong theo phản biện, chờ ORC trình INV.** Trả lời từng mục: `rounds/round-02/responses/landing-v12-UXD.md`.
- Mock: `mock/index.html` v1.2.1 (bản xem trước đồng bộ ở thư mục `landing-preview` của phiên; một tệp + `mock/img/` như v1.1), ảnh chụp: `mock/shots/`, nguồn ảnh: `mock/img/CREDITS.md`.
- Căn cứ: `04-investor-feedback/FB-INV-002.md` (5 ý + **INV chọn A**, 17/10); **OTTIMO Brand Guidelines v1.0** (`00-brief/context/brand/brand-guidelines.md`); `rounds/round-02/outputs/DOM/landing-positioning.md`; `product/docs/business-rules.md` **v0.3.8** (BR-110, BR-112, BR-305, BR-811, BR-911…916, mục 13 tham số); `02-escalations/ESC-020.md` (L1–L7 đã quyết A); ADR-014 mục 4.3–4.9; hợp đồng `openapi.yaml` 0.3.7 bổ sung 2 (`WebsiteBookingRequestInput`, `WebsiteBookingRequestAccepted`); SEC `landing-zalo-SEC.md`, `landing-booking-SEC.md` (Phụ lục A); backlog EP19 (US-146…160, US-155).
- Quy ước: **[Chưa xác minh]** = đội chưa kiểm được · **[Chờ INV]** = chỉ INV có thông tin hoặc quyền quyết · **[GIẢ ĐỊNH]** = đội tạm dùng, ghi ở mục 15.

---

## 0. Tóm tắt

| Ý INV (FB-INV-002) | v1.2.1 làm gì | Kiểm bằng |
|---|---|---|
| 1. Không nhắc số phòng | Không câu nào nói số phòng/căn, không liệt kê đủ bộ tên phòng, không `numberOfRooms`. v1.2.1 bỏ thêm H2 tiếng Việt "Bốn hạng phòng" (dễ đọc lướt thành "bốn phòng") → "Chọn phòng hợp với bạn"; bỏ chữ "căn" còn sót ở lead và FAQ tiếng Việt. | Script quét chữ hiện + `<title>` + meta + JSON-LD, EN và VI: 0 lần khớp (mục 12.1) |
| 2. Boutique stay, không phải căn hộ dịch vụ | Câu định vị theo DOM: **"The care of a small hotel, with a kitchen, a washer-dryer and a desk in every room."** Mục 2 **"Stay a night, or a season."** – hai lời hứa ngang hàng. v1.2.1: "utilities by meter / điện nước theo công tơ" rời mục 2 sang FAQ ở dài ngày; "monthly agreement / hợp đồng theo tháng" → "clear monthly terms / điều khoản theo tháng rõ ràng"; bớt lặp bếp – máy giặt – bàn làm việc. | Danh sách từ cấm (mục 2.3); đếm lặp (mục 12.1) |
| 3. Đặt phòng trực tiếp, về Desk nguồn website | **INV đã chọn A** (17/10): yêu cầu đặt phòng vào Desk, xác nhận qua Zalo, không thanh toán online. Mục **"Request to book"**: 3 bước + form + trang cảm ơn. v1.2.1: câu đồng ý theo SEC Phụ lục A, form thu **một** cách liên hệ, trẻ em đếm theo nhóm tuổi, tên khóa theo hợp đồng nơi chỉ khác tên. | Luồng form bằng Playwright (mục 12.1) |
| 4. Zalo OA là chính | Zalo có ở hero, thanh đáy, header (từ 768 px), Liên hệ (nút chính), chân trang, trang cảm ơn. WhatsApp · Telegram · Viber chỉ trong ô gập **"Other channels"** ở mục Liên hệ. Facebook là liên kết thường. | Không request tới facebook.com/zalo.me khi tải trang |
| 5. Bố cục rối | 8 mục, mỗi mục một ý. v1.2.1: chân trang còn một dòng link (bỏ lặp địa chỉ, hotline, "Other channels"); một thứ bậc nút cho hero và thanh đáy; thanh đáy ẩn ở Liên hệ và chân trang; FAQ còn 4 câu. Trang 375 px: 9.314 → **8.870 px**. | Chiều cao mục, ảnh chụp (mục 12.3) |

- **Không có ESC mới.** Câu chữ có số và nội dung cần INV duyệt nằm trong ESC-020 L5 (PO gom ở `rounds/round-02/outputs/PO/landing-inv-questions.md`); danh sách ở mục 15.1.

### 0.1 Đã sửa theo phản biện (v1.2 → v1.2.1)

| Mục phản biện | Đã sửa | Ở đâu |
|---|---|---|
| **N1** Liên hệ + chân trang lặp | Chân trang chỉ còn lockup, tagline, một dòng link **Zalo · Facebook · Email**, dòng © và link "Privacy notice". Bỏ cột địa chỉ, hotline và ô gập "Other channels" ở chân trang. Mục Liên hệ bỏ dòng Address (mục Vị trí đã có). Ở 375 px: Liên hệ 761 → 680 px, chân trang 780 → 384 px (−477 px). Địa chỉ còn 1 lần, "Other channels" còn 1 lần. | 3.1, 6; mock `#contact`, `footer` |
| **N2** Thứ bậc nút đảo khi cuộn; hai nút Zalo đặc | Chốt **một** thứ bậc: nút đặc = **Request to book**, Zalo = nút viền, ở cả hero và thanh đáy (cùng thứ tự). Zalo chỉ là nút đặc ở mục Liên hệ và trang cảm ơn – nơi không có nút đặt phòng. Thanh đáy ẩn khi hero, mục Book, **mục Liên hệ hoặc chân trang** đang trên màn hình. | 3.3; mock `.stickybar`, IntersectionObserver |
| **N3** "utilities by meter" ở mục 2 | Thẻ "For a month, or longer" chỉ còn "Monthly rates and a housekeeping plan to suit you." "Utilities by meter" chuyển vào FAQ "How do long stays work?"; "a simple monthly agreement" → "clear monthly terms" (VI: "điều khoản theo tháng rõ ràng"). | 2.2, 2.3; mock `#why`, `#faq-long` |
| **N4** Không có lối Zalo giữa trang trên máy tính | Header từ 768 px có link chữ **"Chat on Zalo"** (biểu tượng bong bóng + chữ, không phải nút đặc) cạnh nút viền "Request to book". Header dính nên lối Zalo luôn ở đầu màn hình. | 3.1; mock `.h-zalo` |
| **T1** "Bốn hạng phòng", chữ "căn" | H2 VI → "Chọn phòng hợp với bạn". Lead VI → "…mỗi phòng đều có bếp, máy giặt sấy và bàn làm việc riêng."; FAQ VI → "phòng nào cũng có…"; meta description VI sửa theo. Script thêm từ cấm "căn" đứng riêng và "bốn hạng phòng". | 2.3; mock hero, `#rooms`, FAQ |
| **T2** Lặp bếp / máy giặt / bàn | Thẻ "For a few nights" nói giấc ngủ, yên tĩnh, dọn phòng, rộng hơn mong đợi, ban công. Thẻ ở dài nói nhịp sống (đi chợ, nấu bữa ở nhà, giờ làm việc bên cửa sổ), không kê thiết bị. Studio City: "City lights from your window". Lời dẫn Rooms bỏ "balcony". Chữ hiện (FAQ đóng), EN: kitchen 4 → 2, washer 3 → 2, desk 5 → 3, balcony 4 → 3; VI: bếp 5 → 3, giặt 5 → 3. | 2.2; mock `#why`, `#rooms` |
| **T3** FAQ lặp (không bắt buộc) | Bỏ câu "Is my request a confirmed booking?" (trùng bước 3 và dòng "No payment on this website"). Câu ở dài ngày giữ vì nay chứa chi tiết riêng (điện nước, điều khoản). FAQ giữ vị trí sau form: đường từ Vị trí tới form ngắn hơn. | 3.1; mock `#faq` |
| **T4** Nút Zalo hero bị cắt ở 375×812 | Ảnh hero điện thoại cao tối đa 36svh → **30svh**; khoảng ảnh – chữ và lead – nút 32 → 24 px (< 768 px). Thanh MOCK một dòng trên điện thoại (73 → 37 px). Đo ở 375×812: hai nút kết thúc ở 739/799 px **có** thanh MOCK, 702/762 px không có. | 10; mock `.hero` |
| **T5** Chữ nút không thống nhất | Mọi nút/link dẫn tới form: **"Request to book" / "Yêu cầu đặt phòng"** (header, menu, hero, thanh đáy, H2 mục Book). Nút gửi: "Send booking request" / "Gửi yêu cầu đặt phòng". Không còn "Book" hay "Đặt phòng" trơn (script kiểm). | 3.3, 5.1 |
| **T6** Khoảng cách lẻ (không bắt buộc) | Sửa CSS về thang: nút 22 → 24 px; ô nhập 11/14 → 12/16 px (viền lỗi 2 px làm bằng `box-shadow`, không đổi padding); `.btn-sm` 10 → 8 px; `gap` 6 → 8 px; `.brand` 10 → 12 px (lockup 187 px, vẫn ≥ 180); `.wm-sub` 6 → 8 px; mũi tên link .4em → 8 px; bước 2 → 4 px. Ngoại lệ có chủ ý: độ lệch vòng focus, độ lệch gạch chân, độ dày viền, `p` cách 1em, thanh MOCK và chip Notes. | 3.3 |
| **T7** Xuống dòng | "280 L", "280 lít", "1 Gbps", "55-inch", "55 inch", "07:00–22:00" không ngắt (`.nw`). Dòng thông số phòng: rút gọn ("Sleeps 2–3 · 29 m² · City view") và dấu "·" không bao giờ đứng cuối hay đầu dòng (CSS `clip-path`). Nút chọn kiểu ở: "By the night / By the month" – "Theo đêm / Theo tháng" (một dòng từ 320 px). Ô hạng phòng: tên ngắn, số khách sang dòng gợi ý dưới ô; "Hạng nào cũng được" (VI). Đo: không nút chọn nào hai dòng, không chữ nào bị cắt trong ô chọn ở 320–1280 px. Ô ngày hiện theo ngôn ngữ trình duyệt (mm/dd/yyyy ở Chrome tiếng Anh) – ghi cho FE-LP và QA ở mục 13. | 4, 5.2, 13 |
| **T8** WhatsApp ngang Zalo trong form | **Giữ.** Form là lối chính cho mọi khách, kể cả khách nước ngoài chưa có Zalo (DOM R1); Zalo đứng đầu và chọn sẵn; bốn ô cùng cỡ để dễ chạm. Ngoài form, WhatsApp vẫn chỉ ở ô gập. ORC nói rõ với INV đây là chủ ý. | 5.2, 15.1 |
| **T9** Link Zalo chưa phải OA | Ghi nhận: tạm `zalo.me/0844440909`, đổi sang link OA khi xác thực (ESC-021) – một chỗ cấu hình (`CFG.zaloUrl` / `site.json`). | 6 |
| Ánh xạ hạng phòng (ORC nhắc) | Đã đúng theo DOM ở mục 4 và G-14: **Premium = 302/402 (Căn N+), Signature = 301/401 (Căn N)**. Mục 7 của v1.2 là bảng màu, không chứa ánh xạ. Trang không ghi số căn. | 4, 15.3 |
| DOM qua ORC: tên khóa tham số | Bỏ `web_inquiry.*`, `public_site.*`. Câu hứa đọc `web_request_public_promise_minutes` (60) và `web_request_public_promise_next_morning_by` (09:00), giờ trực `front_desk_hours`. Hạn nội bộ `web_request_response_minutes` = **15** phút tính `replyBy` – trang **không** hiện `replyBy`. | 5.4, 13 |

### 0.2 Áp thẻ SEC (phần giao diện)

| Thẻ | Đã làm |
|---|---|
| FB-R2-SEC-UXD-04 | Ô đồng ý dùng đúng câu **A.1**; ngay dưới là dòng thông báo **A.2** (luôn hiện) và link "Privacy notice / Thông báo xử lý dữ liệu" tới `/privacy/#booking-requests` (`/vi/privacy/#yeu-cau-dat-phong`), mở cùng thẻ. `consentVersion` lấy từ tệp thông báo phát hành cùng bản dựng (mock ghi `{privacy_notice_version}`). Câu pháp lý không dịch máy. |
| FB-R2-SEC-UXD-05 | Ô bẫy: nhãn "Leave this field empty", ra ngoài màn hình bằng class, thêm `data-1p-ignore`, `data-lpignore="true"` (FE-LP tra đủ danh sách). Trang cảm ơn thêm dòng lối thoát: "If you have not heard from us by {giờ}, call 08.4444.0909 or message us on Zalo with this number." – **{giờ} là mốc của câu hứa công khai, không phải `replyBy`** (BR-912 v0.3.8, xem 5.4). |
| FB-R2-SEC-UXD-06 | FAQ chống giả danh theo câu SEC chốt, có `{receivingAccountHolder}` (lấy từ `payment_receiving_account` lúc dựng trang; chờ tên pháp nhân). Thêm câu "Our Facebook page is for news…" – **chờ INV xác nhận** nhân viên không xác nhận đặt phòng/nhận cọc qua Messenger. |
| FB-R2-SEC-UXD-07 | Tên khóa theo `WebsiteBookingRequestInput` nơi chỉ khác tên: `guestName`, `preferredChannel`, `note`, `roomType` (slug theo quy tắc của hợp đồng). Mã yêu cầu theo bảng Crockford của server (`^[0-9A-HJKMNP-TV-Z]{8}$`), hiển thị 4 + 4 bằng khoảng cách CSS (không có ký tự gạch nối/khoảng trắng – chép ra là đúng 8 ký tự Desk tìm). Phần lệch còn lại ghi ở 5.2 để ARC sửa hợp đồng. |
| FB-R2-SEC-UXD-08 | Thẻ `<form>` render với `hidden`, **không** có `action`; script form bỏ `hidden`. Không JS → không bao giờ gửi được. Mã, tên, ngày không vào URL/hash/tiêu đề. Nút "Open Zalo" chỉ là link OA, không chèn dữ liệu khách. |

### 0.3 Theo PO (qua ORC, 17/10)

| Điểm PO | Đã làm | Ở đâu |
|---|---|---|
| (1) Gỡ G-9 | INV đã chọn A – bỏ dòng G-9 khỏi bảng giả định; bỏ mọi nhãn chờ INV về A | 15.3 |
| (2) Premium "extra bed" sai so với ESC-014 | Mock: EN "A bedroom, a living room **and a sofa for one more guest**." · VI "Phòng ngủ riêng, phòng khách riêng **và sofa ngủ thêm một người**." Câu VI đúng như PO. Câu EN bỏ chữ "bed" ("sofa bed" → "sofa"): BR-110 ghi người vượt định mức ngủ **sofa lớn có sẵn, không nệm phụ**, và DOM dặn không viết "sofa bed" – để khách không chờ một chiếc sofa giường. PO đưa câu vào Q4 cho INV duyệt. **Lưu ý cho PO/DOM:** BR-110 cũng ghi Premium (302, 402) có 1 giường lớn + **1 giường 1m4** trong định mức 3 – câu mới không nhắc giường này; INV xác nhận ở Q4 | 4; mock thẻ Premium |
| (3) Không tự nhận "hotel"/"khách sạn", hạng sao | Rà toàn trang: bỏ một chỗ không cần ("hotel check-in times" ở FAQ). Còn 3 chỗ, đều là **so sánh**, không tự nhận loại hình – lý do từng chỗ ở mục 2.4. Script chặn "is a hotel / là khách sạn", hạng sao, "luxury/sang trọng", JSON-LD `@type: Hotel` | 2.4; 12.1 |
| (4) Link fanpage về `#book` (PO chốt) | Link "Book now" = trang chủ + `#book`; form nằm trong trang chủ như mock | 5.7 |
| (5) Câu hứa "trong 1 giờ (07:00–22:00); ngoài giờ trước 09:00" | Bước 2 mục Book, khối "form tắt" và trang cảm ơn dùng đúng cấu trúc này | 5.1, 5.4 |

### 0.4 Duyệt bản dựng FE-LP đợt 2 (17/10 – `rounds/round-02/reviews/s4-UXD-strings-2.md`)
- 9 điểm lệch ở `outputs/FE/lp-v1-report.md` 0.3: chấp nhận 8, sửa 1 (meta description). Khối "form tắt" có thêm nút viền "Call 08.4444.0909" cạnh "Chat on Zalo" (đặc) – chấp nhận, ghi vào 5.5.
- Meta description ≤ 160 ký tự (ADR-014 mục 5) – mock và `landing-web` cùng chữ: EN "A boutique stay in Da Lat: the care of a small hotel, with a kitchen, a washer-dryer and a desk in every room. Stay a night, or a season. Chat with us on Zalo." (159); VI "Boutique stay ở Đà Lạt: sự chăm chút của một khách sạn nhỏ; mỗi phòng đều có bếp, máy giặt sấy và bàn làm việc riêng. Ở một đêm, hay cả một mùa. Nhắn qua Zalo." (159).
- Câu `promise.kind = call_now` và trang 404: mục 5.4 và 13.

## 1. Mục tiêu và phạm vi

| Mục tiêu | Cách trang đáp ứng |
|---|---|
| Kéo khách về kênh trực tiếp (PRD G3 ≥ 35%) | Form yêu cầu là lối chính cho mọi khách; Zalo là kênh chat chính; không link OTA |
| Đo được khách từ website/Facebook (ý 3) | Yêu cầu vào Desk `directSource = website` + nguồn phụ theo hợp đồng (`facebook`, `instagram`, `google`, `zalo`, `qr`, `other`, rỗng – BR-911 v0.3.8); UTM đọc ngay trên trang, không cookie |
| Hai nhóm khách cùng hài lòng (ý 2) | Mục 2 "Stay a night, or a season." + câu từng hạng phòng (DOM mục 4) |
| Calm, đúng thương hiệu (ý 5) | Bộ lọc quyết định của guideline áp cho từng mục (mục 3.2) |
| Nhanh trên 4G | Trần ảnh 960 px trên điện thoại, ngân sách DPR (mục 12.2) |

Ngoài phạm vi: thanh toán online (L7-C), phòng trống/giá thật (L7-B – chỉ thiết kế chỗ chờ, mục 5.6), tiếng Nga (US-156), trang thông báo xử lý dữ liệu (SEC soạn, luật sư duyệt), tên phòng gắn theo hạng (chờ bảng ghép của INV).

## 2. Định vị và giọng văn

### 2.1 Câu định vị (theo DOM 1.1)
- EN: *OTTIMO is a boutique stay in Da Lat: the care of a small hotel, in rooms with a full kitchen, a washer-dryer, a desk and a private balcony. For a few nights, more than you expected. For a few months, exactly what you need.*
- Trên trang: nhãn **"Boutique stay · Da Lat"** + H1 tagline + lead **"The care of a small hotel, with a kitchen, a washer-dryer and a desk in every room."** / **"Sự chăm chút của một khách sạn nhỏ; mỗi phòng đều có bếp, máy giặt sấy và bàn làm việc riêng."**
- Thứ tự kể (DOM): *dẫn bằng kỳ nghỉ → chứng minh bằng căn phòng → chốt bằng độ dài ở*. Không chê khách sạn.
- Thiết bị kể **một lần** ở lead hero và **chi tiết** ở Tiện nghi; các mục khác kể bằng trải nghiệm (giấc ngủ, nhịp sống), không kê lại thiết bị (T2).

### 2.2 Lời hứa kép – ai đọc thấy gì
| Nhóm khách | Lời hứa | Chỗ trên trang |
|---|---|---|
| Đặt kiểu khách sạn (vài đêm) | **Beyond what a hotel room gives you** – "Check in at 14:00 to a quiet room, a bed made for deep sleep and daily housekeeping. And more space than you expected, with a balcony of your own." | Mục 2 thẻ trái; mô tả từng hạng; Tiện nghi "Small luxuries for one night" |
| Ở dài (một tháng trở lên) | **Made for living here** – "Unpack once and settle into your own rhythm: market mornings, dinners cooked at home, quiet hours of work by the window. Monthly rates and a housekeeping plan to suit you." | Mục 2 thẻ phải; mô tả từng hạng ("a quiet desk for the weeks after"); Tiện nghi "The essentials for a month"; FAQ "How do long stays work?"; form "By the month" |

- Hai thẻ ngang hàng, cùng cỡ, không thẻ nào "chính".
- "Dọn phòng mỗi ngày" chỉ nói cho **khách ngắn ngày** (BR-807); khách tháng là "gói dọn phòng tùy chọn" (BR-204).
- "Điện nước theo công tơ" (BR-501) và "điều khoản theo tháng rõ ràng" **chỉ ở FAQ ở dài ngày** – nơi chỉ khách ở dài mở ra đọc (N3).

### 2.3 Từ dùng – từ tránh (gộp DOM 2.1, 2.2; script kiểm ở mục 12.1)
| Dùng | Tránh |
|---|---|
| boutique stay · room, studio, one-/two-bedroom · phòng, hạng phòng | apartment, serviced apartment, aparthotel, unit · căn hộ, căn hộ dịch vụ, **căn**, chung cư |
| reception, housekeeping, check-in/out · lễ tân, dọn phòng, nhận/trả phòng | self check-in, no reception · tự nhận phòng |
| by the night / by the month, a few nights / a month or longer · theo đêm / theo tháng, ở dài ngày | lease, rental, move in, **monthly agreement** · thuê nhà, thuê tháng, dọn vào, **hợp đồng theo tháng** |
| clear monthly terms · điều khoản theo tháng rõ ràng (chỉ ở FAQ ở dài) | – |
| booking request, deposit · yêu cầu đặt phòng, cọc | instant confirmation · xác nhận ngay |
| Request to book · Yêu cầu đặt phòng | **"Book", "Đặt phòng" trơn trên nút** (gợi đặt chắc – trái phương án A) |
| "the care of a small hotel", "hotel-grade bedding" | hotel (tự nhận), 5-star, luxury · khách sạn (tự nhận), 5 sao, sang trọng |
| EN "Four ways to stay"; VI "Chọn phòng hợp với bạn" | ten rooms, mười căn, **"Bốn hạng phòng"**, only 2 left, liệt kê đủ bộ tên phòng |

- Script kiểm: `/apartment/i, /serviced/i, /căn hộ/i, /(?<!\p{L})căn(?!\p{L})/iu, /\bten (rooms|apartments|names)\b/i, /\bmười\b/i, /\b10 (căn|phòng|rooms|apartments)\b/i, /numberOfRooms/, /The Pine|The Ember|The Mist/, /monthly agreement/i, /hợp đồng theo tháng/i, /\blease\b/i, /thuê tháng/i, /bốn hạng phòng/i`; thêm: không nút/link nào có chữ đúng bằng "Book" hoặc "Đặt phòng"; mục `#why` không chứa "meter"/"công tơ".
- Giọng: ngắn, lịch sự, không cảm thán, không emoji, không IN HOA để nhấn. EN dẫn dắt, VI là bản biên tập. H1 luôn là tagline tiếng Anh (`lang="en"`).

### 2.4 Chữ "hotel / khách sạn" trên trang (US-146 AC5, ESC-001 LZ-9)
Quy tắc: trang **không tự nhận** là khách sạn/hotel, không nêu hạng sao, không "luxury/sang trọng"; loại hình là **boutique stay**; JSON-LD `LodgingBusiness`. So sánh với khách sạn được dùng khi nó là cách nói ngắn nhất cho định vị "giữa khách sạn và boutique stay" (Brand Guidelines mục 1) và cho lời hứa với nhóm khách đặt kiểu khách sạn (FB-INV-002 ý 2).

| Chỗ | Câu | Vì sao giữ | Nếu luật sư (LZ-9) không cho |
|---|---|---|---|
| Lead hero (+ meta description) | "The care of a small hotel, with a kitchen, a washer-dryer and a desk in every room." / "Sự chăm chút của một khách sạn nhỏ; mỗi phòng đều có…" | Là **so sánh mức chăm sóc** ("sự chăm chút **của** một khách sạn nhỏ"), không phải câu "OTTIMO là khách sạn". Ngay trên là nhãn "Boutique stay · Da Lat" gọi đúng loại hình. Đây là câu định vị DOM chốt (DOM 1.1) – cũng là vai đã nêu LZ-9 | "Thoughtful service every day, with a kitchen, a washer-dryer and a desk in every room." / "Chăm chút như một nơi lưu trú chuyên nghiệp; mỗi phòng đều có…" |
| H3 thẻ "For a few nights" | "Beyond what a hotel room gives you" / "Vượt những gì một phòng khách sạn mang lại" | So sánh **để nói OTTIMO khác** khách sạn ("beyond"). Là lời INV muốn nói với khách đặt kiểu khách sạn (ý 2: "vượt mong đợi") | "More than a room for the night" / "Hơn một phòng nghỉ qua đêm" |
| Tiện nghi – Giấc ngủ | "Hotel-grade Dunlopillo mattress and bedding" / "Nệm và chăn ga Dunlopillo chuẩn khách sạn" | So sánh **tiêu chuẩn đồ dùng**, DOM 2.4 dùng thay "5 sao". LZ-9 hỏi đích danh cụm này | "Dunlopillo mattress and bedding" / "Nệm và chăn ga Dunlopillo" |

- Đã bỏ: "hotel check-in times / giờ nhận – trả phòng như khách sạn" ở FAQ (nói thẳng giờ là đủ).
- Script kiểm (mục 12.1): đếm 3 chỗ trên; chặn "is a hotel", "là khách sạn", "N star/sao", "luxury/sang trọng", `"@type": "Hotel"`.

## 3. Kiến trúc thông tin

### 3.1 Sơ đồ trang
| # | Mục | Neo | Nền | Một ý | Nội dung | Nút / liên kết |
|---|---|---|---|---|---|---|
| 0 | Header dính | – | Ivory | Định hướng | Lockup, menu (Rooms · Amenities · Location · FAQ, ≥ 1024 px), EN/VI | ≥ 768 px: link chữ **"Chat on Zalo"** + nút viền "Request to book"; ☰ (< 1024 px) |
| 1 | Hero | `#top` | Ivory | OTTIMO là gì | Ảnh mặt tiền, nhãn, H1 tagline, lead định vị | **Request to book** (đặc) · Chat on Zalo (viền) |
| 2 | Why OTTIMO | `#why` | Ivory | Lời hứa kép | "Stay a night, or a season." + 2 thẻ có ảnh | – |
| 3 | Rooms | `#rooms` | Cream | Chọn hạng | "Four ways to stay" / "Chọn phòng hợp với bạn" – 4 thẻ, mỗi thẻ 1 ảnh, một dòng thông số, 1–2 câu | "Request this room" (link, chọn sẵn hạng trong form) |
| 4 | Amenities | `#amenities` | Ivory | Chi tiết cảm nhận mỗi ngày | 4 nhóm: Sleep · Kitchen & laundry · Work & rest · Reception & arrival | – |
| 5 | Location | `#location` | **Ink** | Ở đâu, đi lại dễ không | Địa chỉ (**chỗ duy nhất**), bảng 6 điểm, ảnh flycam | Open in Google Maps · Copy address (viền) |
| 6 | Book | `#book` | Ivory, thẻ Cream | Cách đặt + gửi yêu cầu | "Request to book": 3 bước, "No payment on this website", form | **Send booking request** (đặc) |
| 7 | FAQ | `#faq` | Ivory (nét kẻ Oak) | Gỡ băn khoăn còn lại | **4 câu**: loại hình · dọn phòng · ở dài ngày (điện nước, điều khoản) · tin nhắn thật hay giả | – |
| 8 | Contact | `#contact` | Cream | Nói chuyện với người thật | "Talk to us." | **Chat on Zalo** (đặc); Hotline, Email, Facebook (dòng chữ); "Other channels" (gập – **chỗ duy nhất**) |
| – | Footer | – | Ink | – | Lockup, tagline, một dòng **Zalo · Facebook · Email**, © + "Privacy notice" | – |
| – | Thanh dính đáy (< 768 px) | – | Ivory | Hành động nhanh | Chỉ khi hero, Book, Contact, chân trang **không** trên màn hình | **Request to book** (đặc, 3/5) · Chat on Zalo (viền, 2/5; dưới 360 px chỉ "Zalo" + biểu tượng) |

### 3.2 Đối chiếu bộ lọc quyết định của guideline (p.10)
Bốn câu: (1) Có yên tĩnh không? (2) Có lý do tồn tại không? (3) Khách có cảm nhận mỗi ngày không? (4) Có khiến khách muốn quay lại không?

| Mục | (1) Yên tĩnh | (2) Lý do tồn tại | (3) Cảm nhận mỗi ngày | (4) Muốn quay lại |
|---|---|---|---|---|
| Hero | Một ảnh, một câu, hai nút | Trả lời "đây là gì" trong 5 giây (US-146) | Lead nói đúng thứ có trong phòng | Ấn tượng đầu đúng thương hiệu |
| Why OTTIMO | Hai thẻ cân nhau, không kê thiết bị | Sửa hiểu nhầm "căn hộ dịch vụ" (ý 2) | Mỗi thẻ là một ngày ở thật | Khách ngắn ngày thấy "dư"; khách dài thấy "vừa" |
| Rooms | 1 ảnh mỗi thẻ; điện thoại vuốt ngang | Chọn hạng (US-147) | Câu theo cách dùng | "for the weeks after" |
| Amenities | 4 nhóm | Một chỗ duy nhất kê thiết bị (DOM 3.3) | Đúng câu (3) | Trụ cột "Utilities that just work" |
| Location | Một dải tối duy nhất | Đi lại có tiện không (US-148) | Thời gian đi xe | "Calm evenings at home" |
| Book | Thẻ form tách nền | Ý 3 của INV (US-155) | – | Biết trước quy trình |
| FAQ | 4 câu, đóng sẵn | Băn khoăn còn lại; chống giả danh | Dọn phòng, điện nước tháng | Tin tưởng khi chuyển cọc |
| Contact | Một nút; kênh khác gập | Ý 4 của INV (US-151) | – | Có người thật trả lời |
| Footer | Một dòng link | Lối cuối trang + quyền riêng tư | – | – |

### 3.3 Nhịp, khoảng trắng, thứ bậc nút
- **Thang khoảng cách:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 px (`--s1`…`--s10`) cho mọi `padding`, `margin`, `gap` của bố cục và thành phần. Ngoại lệ có chủ ý (không phải khoảng bố cục): độ lệch vòng focus (2–3 px), độ lệch gạch chân (3 px), độ dày viền, khoảng đoạn văn `p` = 1em, thanh MOCK và chip Notes (chỉ ở mock). Kích thước (ô cao 48, cột nhãn 88, nút chạm 44) không thuộc thang.
- Lề trang 16 / 24 / 32 px (điện thoại / ≥ 768 / ≥ 1024). Khoảng mục 64 / 96 / 128 px. Khoảng tiêu đề → nội dung 32 / 48 px.
- Hai mục cùng nền liền nhau dùng **một** khoảng (Hero → Why) hoặc khoảng + nét kẻ Oak (Book → FAQ).
- Nhịp nền: Ivory · Ivory · **Cream** · Ivory · **Ink** · Ivory (thẻ Cream) · Ivory · **Cream** · **Ink**.
- **Thứ bậc nút (chốt v1.2.1 – N2):**
  - Ở mọi chỗ có cả hai hành động (hero, thanh đáy): **Request to book = nút đặc, đứng trước; Chat on Zalo = nút viền, đứng sau.** Cùng thứ tự, cùng thứ bậc khi khách cuộn.
  - Lý do: đặt phòng là việc chính của trang và là đường duy nhất Desk ghi được nguồn `website` (ý 3); Zalo là kênh **chat** chính (ý 4) – luôn có mặt, một chạm, nhưng là lựa chọn thứ hai khi đứng cạnh nút đặt phòng.
  - Zalo là nút đặc **chỉ** ở mục Liên hệ, trang cảm ơn ("Open Zalo") và khối "form tắt" – những chỗ không có nút đặt phòng.
  - Header: link chữ "Chat on Zalo" + nút viền "Request to book" (không tranh với hero).
  - **Một nút đặc mỗi màn hình**: hero, form, Liên hệ, trang cảm ơn. Mọi hành động khác là nút viền hoặc link chữ.
- **Thanh dính đáy:** ẩn khi bất kỳ phần nào của nút hero, mục Book, mục Liên hệ hoặc chân trang đang trên màn hình (IntersectionObserver) → không bao giờ có hai nút đặc cùng lúc, không che bàn phím khi điền form, không lặp nút Zalo của Liên hệ, không che chân trang. Ẩn bằng `transform` + `visibility`; tôn trọng `prefers-reduced-motion`. Không có IntersectionObserver/JS → thanh luôn hiện và chân trang có thêm khoảng đệm bằng chiều cao thanh.
- Chuyển động: đổi màu nút 200 ms, trượt thanh đáy 250 ms. Chữ không đặt trên ảnh.

## 4. Thẻ hạng phòng (4 hạng theo e-brochure; sức chứa theo BR-110, câu theo DOM mục 4)
| # | Hạng (EN · VI) | Dòng thông số (EN · VI) | Câu trên thẻ (EN) | Ảnh |
|---|---|---|---|---|
| 01 | Standard Studio · City View — Studio — Hướng thành phố | Sleeps 2–3 · 29 m² · City view · 2–3 khách · 29 m² · Nhìn ra phố | City lights from your window. Easy for a weekend, easy for a month. | `city-living` |
| 02 | Standard Studio · Garden View — Studio — Hướng vườn | Sleeps 2–3 · 28–34 m² · Garden view | Glass to the garden and a private balcony. Morning light for a short stay; a quiet desk for the weeks after. | `garden-oak` |
| 03 | Premium · One Bedroom + 1 — Premium — 1 phòng ngủ + 1 | Sleeps 3–4 · 37 m² · Garden view | A bedroom, a living room and a sofa for one more guest. The space of a suite for a short stay; room for family on a long one. (VI: "Phòng ngủ riêng, phòng khách riêng và sofa ngủ thêm một người.") | `premium-kitchen` |
| 04 | Signature · Two Bedrooms — Signature — 2 phòng ngủ | Sleeps 4–5 · 47 m² · Garden view | Two bedrooms, a table for four and a sunset balcony. One booking for the whole family, or for two remote workers over a season. | `signature-dining` |

- Dòng chung dưới lưới: "The higher number includes one guest on the sofa, with an extra-guest fee. Rates by the night or by the month, on request." / "Số lớn hơn là khi thêm một khách ngủ sofa (có phụ thu). Giá theo đêm hoặc theo tháng, báo khi bạn gửi yêu cầu." Giá "from …" chờ L3 + bảng ghép hạng – nhóm giá.
- Dòng thông số: mỗi mục không ngắt; dấu "·" nằm giữa hai mục, bị cắt nếu rơi vào đầu dòng (không bao giờ đứng cuối/đầu dòng – T7).
- Premium: câu sofa theo PO (ESC-014) – PO Q4, INV duyệt. EN dùng "sofa", không "sofa bed" (BR-110: sofa lớn có sẵn, không nệm phụ). Giường 1m4 trong định mức 3 (BR-110) không còn nhắc trên thẻ – INV xác nhận ở Q4 (mục 0.3).
- **Ánh xạ nội bộ (theo DOM 4, đã kiểm lại):** Premium = Căn N+ (**302, 402**); Signature = Căn N (**301, 401**); hai hạng Studio = Lầu 1–2 [GIẢ ĐỊNH – chờ bảng ghép chính thức của INV, hẹn 19/10]. Trang không ghi số căn mỗi hạng.
- Điện thoại (< 768 px): 4 thẻ là hàng **vuốt ngang** (scroll-snap, thẻ rộng 80%). ≥ 768 px: lưới 2 × 2.
- Tên phòng thiên nhiên (The Pine …) không hiện; khi có bảng ghép, tên hiện trong thư viện ảnh **từng hạng** (DOM 2.3).

## 5. Đặt phòng trực tiếp – "Request to book" (phương án A – INV chọn 17/10)

### 5.1 Luồng của khách
1. Bấm **Request to book** (hero, header, menu, thanh đáy, link "Request this room" – chọn sẵn hạng) hoặc nút **"Book now" của fanpage Facebook**.
2. Đọc 3 bước: *Send a request* → *We confirm on Zalo* ("Within 1 hour (07:00–22:00, Da Lat time); outside these hours, before 09:00 the next morning." / "Trong 1 giờ (07:00–22:00, giờ Đà Lạt); ngoài giờ, trước 09:00 sáng hôm sau." – BR-912 (4)) → *Secure your room* (giữ phòng khi xác nhận và chuyển cọc 30% qua QR – BR-305). Dòng cam kết: "No payment on this website. A request does not commit you to anything."
3. Điền form (≤ 1 phút) → **Send booking request**.
4. Trang cảm ơn trong cùng thẻ (mục 5.4).

Tổng: 1 màn, 1 lần bấm gửi – đạt checklist "đặt phòng ≤ 4 bước".

### 5.2 Trường của form
Tên khóa theo `WebsiteBookingRequestInput` (hợp đồng 0.3.7 bổ sung 2) ở những chỗ chỉ khác tên (SEC UXD-07). Chỗ còn lệch ghi ở bảng "Việc cho ARC" ngay dưới.

| Nhóm | Trường (nhãn EN / VI) | Kiểu | Khóa gửi đi | Quy tắc |
|---|---|---|---|---|
| Your stay | Length of stay: **By the night / By the month** · Theo đêm / Theo tháng | 2 nút chọn (radio, legend ẩn "Length of stay") | `stayType` `short`\|`long` | Mặc định `short`. Một dòng từ 320 px |
| | Check-in, Check-out / Nhận phòng, Trả phòng | `date` ×2 | `arrival`, `departure` | `arrival` từ hôm nay (giờ Đà Lạt) đến +365 ngày (BR-112); chọn ngày đến thì ngày đi tự +2 đêm nếu trống/sai; hiện "n nights"; ≥ 28 đêm hiện "We will quote our long-stay rate" (server ghi `stayKind = long`, BR-108) |
| | Arrival + Length of stay / Ngày đến + Thời gian ở | `date` + select | `arrival`, `months` | 1 · 2 · 3 · 6 tháng · 1 năm · 2 năm · "Not sure yet" (`null`) |
| | Adults / Người lớn · Ages 6–11 / Trẻ 6–11 tuổi · Under 6 / Dưới 6 tuổi | 3 select | `adults` (1–6), `children6to11` (0–3), `childrenUnder6` (0–3) | **Đếm theo nhóm tuổi BR-110, không thu tuổi chính xác (SEC ARC-14).** Tên khóa theo ví dụ của SEC; ARC chốt |
| | Room type / Hạng phòng | select + dòng gợi ý | `roomType` | Tùy chọn: "Any room – suggest one" / "Hạng nào cũng được" (rỗng) · `standard-studio-city-view` · `standard-studio-garden-view` · `premium-one-bedroom-1` · `signature-two-bedrooms` (slug theo quy tắc hợp đồng: slug của `publicRoomType`). Chữ trong ô là tên ngắn của hạng; dòng gợi ý dưới ô đổi theo lựa chọn: "Sleeps 2–3. The higher number uses the sofa." / "We suggest a room that suits your group." `adults + children6to11` > sức chứa tối đa (3/3/4/5) → lỗi |
| How we reach you | Your name / Tên của bạn | text | `guestName` | Bắt buộc, ≤ 80 ký tự, `autocomplete="name"` |
| | Reply on / Trả lời qua: Zalo · WhatsApp · Phone call · Email | 4 nút chọn | `preferredChannel` | Mặc định **Zalo**. Bốn ô cùng cỡ (T8 – giữ có chủ ý). Telegram/Viber có trong enum hợp đồng nhưng không hiện ở form (khách dùng các kênh này nhắn qua "Other channels") |
| | Zalo number / WhatsApp number / Phone number **hoặc** Email | `tel` hoặc `email` | `phone` **hoặc** `email` | **Đúng một cách liên hệ (SEC ARC-14 chốt).** Chọn Email → ô SĐT tắt, không gửi `phone`; chọn kênh khác → không có ô email. SĐT 8–15 chữ số, có thể có `+` |
| Note | Anything we should know? (optional) | textarea | `note` | ≤ 500 ký tự, bộ đếm; gợi ý "Please no card or ID numbers"; chuỗi 13–19 chữ số → lỗi |
| Consent | **A.1** "I agree that OTTIMO may use the details in this form only to reply to this request." / "Tôi đồng ý để OTTIMO chỉ dùng thông tin trong biểu mẫu này để trả lời yêu cầu này." | checkbox **không tích sẵn** | `consent`, `consentVersion` | Dưới ô, luôn hiện, chữ nhỏ: **A.2** "If you do not book, we delete these details within 180 days. We reply only from the channels listed on this page." / "Nếu bạn không đặt phòng, OTTIMO xóa thông tin này trong tối đa 180 ngày. OTTIMO chỉ trả lời từ các kênh ghi trên trang này." + link riêng một dòng **"Privacy notice" / "Thông báo xử lý dữ liệu"** → `/privacy/#booking-requests` · `/vi/privacy/#yeu-cau-dat-phong` (cùng thẻ). `consentVersion` = phiên bản tệp thông báo phát hành cùng bản dựng (`YYYY-MM-DD`). Câu pháp lý: luật sư duyệt, không dịch máy |
| Ẩn | Honeypot `website` | text | `website` | Ra ngoài màn hình bằng class `.hp`, nhãn "Leave this field empty", `tabindex="-1"`, `autocomplete="off"`, `data-1p-ignore`, `data-lpignore="true"`, khối `aria-hidden` |
| Ẩn | – | – | `locale`, `utm{source,medium,campaign}`, `landingPath`, `refHost`, `formToken` | UTM đọc từ URL lúc gửi; `refHost` = chỉ tên miền của `document.referrer` khi khác origin (theo hợp đồng – FE-LP thêm, mock chưa gửi); không cookie, không localStorage |

**Việc cho ARC – hợp đồng 0.3.7 bổ sung 2 còn lệch với form (làm theo SEC):**
| # | Hợp đồng hiện tại | Form v1.2.1 (theo SEC) | ARC sửa |
|---|---|---|---|
| A1 | `phone` bắt buộc; `email` tùy chọn, bắt buộc khi `preferredChannel = email` | Gửi **đúng một**: `phone` (Zalo/WhatsApp/gọi) **hoặc** `email` (Email) | Theo SEC ARC-14 (1): kênh SĐT → `phone` bắt buộc, `email` không được gửi; `email` → `email` bắt buộc, `phone` không được gửi |
| A2 | `children` + `childrenAges` (tuổi chính xác 0–17) | `children6to11`, `childrenUnder6` (số đếm) | Theo SEC ARC-14 (3): bỏ `childrenAges`/cột `children_ages`, thêm hai số đếm theo nhóm BR-110; tên khóa ARC chốt |
| A3 | Một cặp `arrival` + `departure` bắt buộc cho mọi khách | "By the month": `arrival` + `months` (1–24 hoặc `null` = "Not sure yet"), không có `departure` | ARC + UXD thống nhất qua ORC (SEC mục 8). Đề xuất UXD: thêm `months` tùy chọn; khi có `months` thì `departure` không bắt buộc và server ghi `stayKind = long`. Phương án khác: trang tự tính `departure = arrival + months` (khi "Not sure yet" thì không gửi được – kém hơn) |
| A4 | `roomType` slug của `publicRoomType` | Đã theo | – |
| A5 | `guestName`, `preferredChannel`, `note` | Đã theo | – |

### 5.3 Kiểm lỗi và thông báo
- Kiểm khi bấm gửi; sau lần đầu thì kiểm lại theo từng thao tác. Lỗi hiện dưới ô (biểu tượng + chữ Earth Brown, viền 2 px, `aria-invalid`, `aria-describedby`) **và** khối tóm tắt đầu form ("Please check 3 fields") nhận focus, mỗi dòng là link nhảy tới ô lỗi.

| Trường hợp | EN | VI |
|---|---|---|
| Thiếu ngày | Choose your check-in date. | Chọn ngày nhận phòng. |
| Ngày ngoài cửa sổ bán | Choose a date from today to {date}. | Chọn ngày từ hôm nay đến {ngày}. |
| Ngày đi ≤ ngày đến | Check-out must be after check-in. | Ngày trả phòng phải sau ngày nhận phòng. |
| Quá sức chứa | This room sleeps up to {n} (children under 6 not counted). Choose a larger room, or "Any room". | Hạng phòng này ở tối đa {n} người (không tính trẻ dưới 6 tuổi). Chọn hạng lớn hơn, hoặc "Hạng nào cũng được". |
| Thiếu tên | Tell us your name. | Cho OTTIMO biết tên của bạn. |
| SĐT sai | Enter a {Zalo/WhatsApp/phone} number we can reach. | Nhập số {Zalo/WhatsApp/điện thoại} để OTTIMO liên hệ. |
| Email sai | Enter an email like name@example.com. | Nhập email dạng ten@vidu.com. |
| Số thẻ trong ghi chú | Please remove card numbers from the note. | Vui lòng xóa số thẻ khỏi ghi chú. |
| Chưa đồng ý (SEC A.3 giữ) | Please tick the box so we can reply. | Vui lòng đánh dấu ô đồng ý để OTTIMO trả lời. |

| Server | EN | VI |
|---|---|---|
| Mất mạng / lỗi khác | We could not send your request. Check your connection and try again, or chat with us on Zalo. | Chưa gửi được yêu cầu. Kiểm tra kết nối rồi thử lại, hoặc nhắn OTTIMO qua Zalo. |
| `503` trần ngày (SEC ARC-02) | We are receiving many requests right now. Please message us on Zalo or call 08.4444.0909. | OTTIMO đang nhận nhiều yêu cầu. Vui lòng nhắn Zalo hoặc gọi 08.4444.0909. |
| `429` | Too many requests from this connection. Please try again later, or chat with us on Zalo. | Kết nối này đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau, hoặc nhắn OTTIMO qua Zalo. |

- Vượt giới hạn **theo liên hệ** trả `202` giống hệt (SEC ARC-04) → khách thấy trang cảm ơn bình thường.
- Đang gửi: nút "Sending… / Đang gửi…", `aria-busy`, khóa bấm lại.

### 5.4 Trang cảm ơn
- Tiêu đề **"Request sent" / "Đã gửi yêu cầu"** nhận focus.
- "Thank you, {name}. This is a request, not yet a booking." (tên chèn bằng `textContent`).
- **Request number**: `refCode` của server (Crockford base32, 8 ký tự), JetBrains Mono, hiển thị thành hai nhóm 4 + 4 **bằng khoảng cách CSS** – không chèn gạch nối hay khoảng trắng, nên khách chép ra đúng 8 ký tự; Desk vẫn bỏ gạch/khoảng trắng và chuyển chữ hoa trước khi tìm (SEC UXD-07 (2)).
- Câu theo kênh: Zalo → "For the fastest reply, open Zalo and send us this number." + nút đặc **Open Zalo**; WhatsApp → "We will message you on WhatsApp."; gọi → "We will call you."; email → "We will reply by email."
- **Câu hứa công khai (BR-912 (4))** theo giờ Đà Lạt lúc gửi: trong `front_desk_hours` [07:00, 22:00) → "We reply within 1 hour (07:00–22:00, Da Lat time)." (`web_request_public_promise_minutes` = 60); ngoài giờ → "Our reception opens at 07:00. We will reply before 09:00." (`web_request_public_promise_next_morning_by` = 09:00).
- **Dòng lối thoát (SEC UXD-05):** "If you have not heard from us by {promiseBy}, call 08.4444.0909 or message us on Zalo with this number." / "Nếu đến {giờ} OTTIMO chưa liên hệ, vui lòng gọi 08.4444.0909 hoặc nhắn Zalo kèm mã này." – số hotline là link `tel:` trong câu.
  - `{promiseBy}` = lúc gửi + 60 phút (trong giờ trực) hoặc 09:00 (ngoài giờ) – **mốc của câu hứa công khai**.
  - **Không dùng `replyBy`** của phản hồi 202: đó là hạn nội bộ `web_request_response_minutes` = **15** phút (BR-912 v0.3.8), trang không hiện. Lệch chữ so với đề xuất của SEC (`{replyBy}`) – cùng ý, khác nguồn giờ; SEC xác nhận.
  - ARC chọn một trong hai: thêm trường hứa công khai vào 202, hoặc FE-LP tự tính từ hai tham số công khai (BR-912 ghi cả hai cách).
- Ngày đến là hôm nay → thêm "Arriving tonight? Calling is fastest: 08.4444.0909".
- **`promise.kind = call_now`** (hợp đồng 0.3.7 bổ sung 2: ngày đến là hôm nay, gửi ngoài giờ trực; `minutes` = `web_request_same_day_after_hours_minutes`, 30): dòng câu hứa là "As you arrive tonight, we will contact you within {minutes} minutes." / "Bạn đến trong tối nay, OTTIMO sẽ liên hệ bạn trong {minutes} phút." – không nhắc lại "Calling is fastest" vì dòng "Arriving tonight?…" + số gọi đã hiện cùng lúc. **30 phút trở thành lời hứa công khai** (trước là mục tiêu nội bộ BR-912 (3)) – DOM xác nhận, INV duyệt cùng L5.
- Nút viền "Send another request" (xóa form, quay lại ô ngày).
- Không tự gửi email/Zalo xác nhận tới liên hệ khách nhập (ADR-014 4.3). Đổi ngôn ngữ sau khi gửi: trang cảm ơn đổi theo.

### 5.5 Công tắc form và trường hợp không có JavaScript
- `booking.mode` (`site.json`): **`chat`** – trước khi đủ điều kiện bật form trên production (luật sư LZ-8/LZ-2, Desk chạy thật, SEC C-1…C-3, C-11…C-13): thẻ form thay bằng khối "Send your dates on Zalo" + nút đặc "Chat on Zalo" + nút viền "Call 08.4444.0909" (FE-LP thêm, UXD duyệt 17/10 – khách chưa có Zalo vẫn có lối ngay tại `#book`); mọi nút "Request to book" vẫn trỏ `#book`. **`request`** – phương án A (mock mặc định). **`live`** – phương án B (5.6). Mock có nút "Form: on/off".
- **SEC UXD-08:** thẻ `<form>` render với `hidden`, không có `action`; module script bỏ `hidden`. Không JavaScript → form không hiện, không bao giờ gửi được; hiện câu "The request form needs JavaScript…" + link Zalo.

### 5.6 Chuyển sang phương án B (phòng trống + giá thật – US-131) – chỉ thay một ô
- Sau khi khách chọn ngày + số khách, trang gọi `getPublicOffers` (ADR-014 4.7). Ô **Room type** đổi từ select sang danh sách 4 dòng (radio): tên hạng · "Available – from {giá}/night" hoặc "Not available for these dates". Hợp đồng B chỉ trả còn/hết – không bao giờ hiện số phòng còn lại (BR-916 (4), FB-INV-002 ý 1).
- Thêm dòng "Rates shown are a guide; we confirm yours." Payload thêm `offerSnapshot`; Desk áp BR-916.
- Không đổi: khóa dữ liệu, 3 bước, trang cảm ơn, lỗi, công tắc.

### 5.7 Nguồn "website" và nút "Book now" của fanpage (BR-112, BR-911)
- Yêu cầu từ form luôn `directSource = website`; nguồn phụ server suy từ UTM rồi `refHost`.
- Link cho nút "Book now" – **PO chốt 17/10**: trang chủ + `#book`, form nằm trong trang chủ: `https://<tên-miền>/vi/?utm_source=facebook&utm_medium=social&utm_campaign=page_book_button#book` (bản EN bỏ `/vi`). Không có trang `/book/` riêng; `landingPath` là `/` hoặc `/vi/`. Khi form tắt (`booking.mode = chat`), `#book` vẫn là khối "Send your dates on Zalo" – link không bao giờ chết (SEC UXD-07 (3), ADR-014 4.2). ARC sửa ví dụ `/book/` trong mô tả `landingPath`.
- Mock (bật Notes) hiện "Desk receives: booking_inquiry · source = website · facebook" + payload đã che dữ liệu C2. Thử: `index.html?utm_source=facebook#book`.

## 6. Kênh chat và liên hệ (ý 4)
| Kênh | Chỗ xuất hiện | Link | Ghi chú |
|---|---|---|---|
| **Zalo** (chính, mọi ngôn ngữ) | Header ≥ 768 px (link chữ), hero (nút viền), thanh đáy (nút viền), Liên hệ (nút đặc), chân trang, trang cảm ơn, khối "form tắt" | `https://zalo.me/0844440909` | Tạm Zalo số hotline; đổi sang link **Zalo OA** khi xác thực (ESC-021) – một chỗ cấu hình (T9) |
| Hotline | Liên hệ (dòng), trang cảm ơn (dòng lối thoát), lỗi 503 | `tel:+84844440909` | Không còn ở chân trang (N1) |
| Email | Liên hệ (dòng), chân trang | `mailto:info@ottimo.vn` | [GIẢ ĐỊNH – tên miền INV đang mua] |
| **Facebook** | Liên hệ ("OTTIMO on Facebook"), chân trang | `https://www.facebook.com/profile.php?id=100091335431646`, `target="_blank" rel="noopener noreferrer"` | Liên kết thường – không SDK, plugin, pixel (SEC C-1). JSON-LD `sameAs` |
| WhatsApp · Telegram · Viber | **Chỉ** ô gập "Other channels / Kênh khác" ở mục Liên hệ | `wa.me/84844440909` · `t.me/+84844440909` · `viber://chat?number=%2B84844440909` | "Khó tìm một chút" nhưng một chạm (ý 4). Bỏ khỏi chân trang (N1) |

- Không dùng logo của Zalo/WhatsApp/Facebook – chỉ chữ + biểu tượng bong bóng chung.
- Dòng cuối mục Liên hệ: "Chat apps and Facebook open only when you tap them. This site uses no tracking cookies."
- FAQ "How do I know a message is really from OTTIMO?" (SEC UXD-06):
  - EN: "We only contact you from the channels listed on this page, or your booking platform's inbox. We never ask for card numbers. Deposits go only to an account in the name of {receivingAccountHolder}, and we never change bank details by message." + "Our Facebook page is for news. We do not confirm bookings or take deposits through Facebook messages."
  - VI: "OTTIMO chỉ liên hệ bạn qua các kênh ghi trên trang này, hoặc hộp thư của nền tảng bạn đặt phòng. OTTIMO không bao giờ hỏi số thẻ. Tiền cọc chỉ chuyển vào tài khoản đứng tên {receivingAccountHolder}; OTTIMO không bao giờ đổi số tài khoản qua tin nhắn." + "Fanpage Facebook dùng để đăng tin. OTTIMO không xác nhận đặt phòng hay nhận cọc qua tin nhắn Facebook."
  - `{receivingAccountHolder}` lấy từ `payment_receiving_account` lúc dựng trang (mock hiện tên khóa dạng chữ Mono gạch chân đứt). Câu Facebook: **chờ INV xác nhận** nhân viên không dùng Messenger để xác nhận/nhận cọc; nếu có dùng thì bỏ câu này và thêm Messenger vào "các kênh ghi trên trang".
- Việc INV tự làm (SEC UXD-06, ORC đưa vào danh sách "INV cần làm" – không phải câu hỏi): đặt tên người dùng cho fanpage, bật xác thực 2 lớp cho quản trị viên fanpage, ghim bài "Kênh chính thức của OTTIMO" có link về website.

## 7. Màu – đúng bảng 80/15/5 (không đổi bảng; thêm vai)
| Token | HEX | Vai trên landing |
|---|---|---|
| `--ivory` | #F4F0E8 | Nền chính, header, thanh đáy, khối tóm tắt lỗi, mã yêu cầu |
| `--cream` | #EDE6D8 | Dải Rooms, Contact; thẻ form; nền chờ ảnh |
| `--stone` | #6B6760 | Chữ phụ; viền ô nhập |
| `--ink` | #2B2B28 | Chữ chính; dải Location, chân trang; nút chọn đang chọn; vòng focus; link "Chat on Zalo" ở header |
| `--oak` | #B08D57 | Nét kẻ; nhãn mục trên nền Ink |
| `--earth` | #7A5C44 | Nút đặc (chữ trắng), nhãn, link (`.link`, `.link-in`), số bước; chữ lỗi + viền 2 px ô lỗi; chỗ giữ giá trị cấu hình `{…}` |
| `--sage` | #8A9079 | Không dùng |
| `--white` | #FFFFFF | Chữ trên nút Earth; nền ô nhập |

- Không có đỏ/xanh lá cho lỗi/thành công.
- Cặp chữ–nền đo trên DOM thật (mục 12.1, kể cả FAQ mở): 11 cặp, thấp nhất **4,53** (Stone trên Cream).
- Không chế độ tối (G-7).

## 8. Chữ
- H1 Lora 36 → 60 px; H2 Lora 28 → 40 px; tên hạng phòng Lora 22 → 26 px; H3 Be Vietnam Pro 600 18 → 20 px; thân 16 → 17 px; nhãn 13 px chữ hoa giãn 0,1em.
- **JetBrains Mono chỉ cho mã yêu cầu** ở trang cảm ơn (và chỗ giữ `{receivingAccountHolder}` trong mock). v1.2.1 chuyển thanh MOCK và chip Notes sang Be Vietnam Pro: Mono không còn tải khi mở trang, giống production; chip Notes tiếng Việt hết rơi sang font dự phòng.
- Kiểm CDP: 0 glyph font dự phòng (mục 12.1).

## 9. Logo – bản giữ chỗ
- Lockup ngang ở header (≥ 375 px) và chân trang; < 375 px header chỉ wordmark. Đo v1.2.1: wordmark **125 px** (tối thiểu 120), lockup **187 px** (tối thiểu 180).
- Thay bằng SVG gốc khi INV gửi.

## 10. Ảnh – 9 trong 18 ảnh của v1.1
| Ảnh | Mục | Tỉ lệ điện thoại → máy tính |
|---|---|---|
| `hero-facade-dusk` | Hero (LCP, preload theo `media`) | 4:5, cao tối đa **30svh** (v1.2: 36svh – T4) → 3:2 (768) → 4:5 (1024) |
| `signature-bed` | Why – vài đêm | 16:9 → 3:2 |
| `detail-laundry-desk` | Why – ở dài | 16:9 → 3:2 |
| `city-living`, `garden-oak`, `premium-kitchen`, `signature-dining` | Rooms | 3:2 |
| `detail-kitchen` | Amenities | 3:2 → 4:5 (1024) |
| `aerial-hillside` | Location | 16:9 → 4:3 (768) → 4:5 (1024) |

- Giữ quy tắc v1.1: điện thoại không tải ảnh > 960 px; mọi ảnh có `width/height`; ảnh không phải hero `loading="lazy"`; alt EN/VI.

## 11. Vị trí (không đổi)
Dinh Bảo Đại III 1,7 km · 4 phút; Nhà thờ Con Gà 2,5 km · 6 phút; Chợ Đà Lạt · Hồ Xuân Hương 3,3 km · 7 phút; Bến xe liên tỉnh 3,7 km · 8 phút; Hồ Tuyền Lâm 4,1 km · 9 phút; Sân bay Liên Khương khoảng 28 km · 30 phút.

## 12. Kiểm tra (Chromium không giao diện, Playwright 1.63 + axe-core 4.14 của repo – 17/10/2026, bản v1.2.1)

### 12.1 Bố cục, a11y, thương hiệu, luồng form
| Hạng mục | 320 EN/VI | 375 EN/VI | 768 EN/VI | 1280 EN/VI |
|---|---|---|---|---|
| Cuộn ngang (đầu trang và sau khi cuộn hết) | Không | Không | Không | Không |
| Số H1 / trùng `id` | 1 / 0 | 1 / 0 | 1 / 0 | 1 / 0 |
| Vùng chạm < 44 px (trừ thanh MOCK; link trong câu theo ngoại lệ inline của WCAG 2.5.8) | 0 | 0 | 0 | 0 |
| axe-core WCAG 2.0/2.1/2.2 A + AA – mặc định; ô gập + Notes mở; form đang lỗi; trang cảm ơn | 0 lỗi | 0 lỗi | 0 lỗi | 0 lỗi |
| Tương phản (mọi chữ đang hiện, kể cả FAQ mở) | 11 cặp, thấp nhất 4,53 | như trái | như trái | như trái |
| Glyph font dự phòng (CDP, Notes bật, trang cảm ơn, tóm tắt lỗi) | 0 | 0 | – | 0 |
| Từ cấm (gồm "is a hotel / là khách sạn", hạng sao, "luxury", "extra bed"), "Book" trơn, "meter" ở mục 2 | 0 | 0 | 0 | 0 |
| Chỗ có "hotel / khách sạn" (đều là so sánh – 2.4) | 3 | 3 | 3 | 3 |
| Địa chỉ / "Other channels" trên trang | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| Câu đồng ý = SEC A.1, A.2; link Privacy đúng theo ngôn ngữ | Đạt | Đạt | Đạt | Đạt |
| Lỗi console | 0 | 0 | 0 | 0 |
| Request tới tên miền ngoài khi tải | chỉ Google Fonts (mock) | như trái | như trái | như trái |

- **Quét bề rộng:** 320–480 px mỗi 2 px + 17 mốc 540–1920 px × EN/VI × 2 biến thể form (theo đêm + Zalo; theo tháng + Email) = **392 lần, 0 cuộn ngang**.
- **Vừa chữ** (320, 360, 375, 390, 768, 1024, 1280 × EN/VI): nút chọn kiểu ở và kênh trả lời đều một dòng (cao 48 px); chữ trong ô chọn không bị cắt; header không chồng (1024 VI: mép phải 992/1024); thanh đáy không tràn chữ.
- **Luồng form** (320 EN; 375, 768, 1280 × EN/VI): gửi trống → tóm tắt 5 lỗi nhận focus; sức chứa (Studio 3 người lớn + 2 trẻ dưới 6 → hợp lệ; 4 người lớn → lỗi "up to 3"); "By the month" bật ô ngày đến + số tháng; "Email" hiện ô email, tắt ô SĐT; "Request this room" chọn sẵn hạng + dòng gợi ý "4–5"; giả lập `503` → thông báo có "Zalo", dữ liệu còn; gửi hợp lệ → trang cảm ơn nhận focus, mã đúng `^[0-9A-HJKMNP-TV-Z]{8}$`, dòng lối thoát có giờ HH:MM + hotline, nút Open Zalo khi chọn Zalo; payload có `guestName`, `preferredChannel`, `roomType`, `note`, `children6to11`, `childrenUnder6`, `phone`, **không** có `email`, `childrenAges`; link "Privacy notice" trong mock không rời trang (báo "MOCK: …"); công tắc form off → khối Zalo; tắt JavaScript → câu thông báo, `<form>` ẩn và không có `action`.
- **Thanh dính đáy** (320, 375 × EN/VI): ẩn ở đầu trang khi nút hero trên màn hình, hiện ở Rooms, ẩn ở Book, hiện ở FAQ, **ẩn ở Liên hệ và cuối trang**. 320 × 640 VI: nút hero nằm dưới màn hình đầu → thanh hiện ngay (luôn có một lối hành động).
- **Nút hero ở 375 × 812 (có thanh MOCK):** kết thúc 739 / 799 px – cả hai nút trong màn hình đầu (T4).
- **Header ≥ 768 px:** link "Chat on Zalo" hiện, cao 44 px.
- **Logo:** wordmark 125 px, lockup 187 px ở 320/375/768/1280 (header 320 chỉ wordmark).

### 12.2 Dung lượng (CDP `encodedDataLength`, xóa cache, HTML gzip, Google Fonts của mock)
| | Ảnh hero | Lúc mở trang | Cuộn hết trang | Ngân sách (mở / cuộn hết) |
|---|---|---|---|---|
| 375 px DPR 1, EN | 480 px · 16 KB | 190 KB / 17 yêu cầu (ảnh 65 · font 94 · HTML 29) | 222 KB | ≤ 250 / ≤ 350 – Đạt |
| 375 px DPR 2, EN | 960 px · 48 KB | **302 KB** (ảnh 176) | 408 KB | ≤ 320 / ≤ 600 – Đạt |
| 375 px DPR 3, EN | 960 px · 48 KB | 302 KB | 408 KB | ≤ 400 / ≤ 700 – Đạt |
| 375 px DPR 3, VI | 960 px · 48 KB | 343 KB | 449 KB | ≤ 470 / ≤ 770 – Đạt |
| 1280 px DPR 1, EN | 960 px · 48 KB | 290 KB | 322 KB | ≤ 400 / ≤ 600 – Đạt |
| 1280 px DPR 2, EN | 1600 px · 116 KB | 498 KB | 604 KB | ≤ 700 / ≤ 1.100 – Đạt |

- HTML mock 29 KB gzip (v1.2: 27 KB) do câu đồng ý, dòng gợi ý hạng phòng, dòng lối thoát và script đi kèm. Lúc mở trang giảm 21 KB so với v1.2 vì JetBrains Mono không còn tải khi mở trang (thanh MOCK dùng Be Vietnam Pro) – đúng cách production chỉ tải Mono ở trang cảm ơn. DPR 2 nay cách trần 18 KB.

### 12.3 Chiều cao trang và ảnh chụp
| | v1.1 | v1.2 | v1.2.1 | Ghi chú |
|---|---|---|---|---|
| Điện thoại 375 px (EN) | ~14.300 px | 9.314 px | **8.870 px** | Liên hệ 761 → 680, chân trang 780 → 384, FAQ 546 → 489; Book 2.104 → 2.214 (+ thông báo A.2, link Privacy, dòng gợi ý hạng phòng) |
| Máy tính 1280 px (EN) | ~9.280 px | 8.277 px | **8.161 px** | Chân trang 366 → 268 |

`mock/shots/` (Notes off, PNG bảng màu, chụp lại 17/10 bản v1.2.1):
| Tệp | Khung |
|---|---|
| `mobile-375-en-top.png`, `mobile-375-vi-top.png` | 375 × 812 (có thanh MOCK; thấy đủ hai nút hero) |
| `mobile-320-en-top.png` | 320 × 640 |
| `desktop-1280-en-top.png` | 1280 × 800 (header có "Chat on Zalo") |
| `mobile-375-en-full-1.png`, `mobile-375-en-full-2.png` | cả trang 375 px, **tách 2 phần** (mỗi phần 4.435 px) |
| `desktop-1280-en-full.png` | cả trang 1280 px, thu về 640 px |
| `mobile-375-en-book.png` | mục Book (3 bước + form + câu đồng ý A.1/A.2) 375 px |
| `mobile-375-en-sent.png` | trang cảm ơn (kênh Zalo, trong giờ, dòng lối thoát) |

## 13. Bàn giao FE-LP – production khác mock ở đâu
`product/apps/landing-web` dựng theo v1.1 → FE-LP cập nhật theo mục 3.1, 3.3, 5, 6 và bảng dưới.

| Mock | Production |
|---|---|
| Google Fonts | Tự host woff2 subset; JetBrains Mono chỉ subset latin cho mã yêu cầu (chỉ tải khi trang cảm ơn hiện) |
| `<style>`, `<script>` nội tuyến | Tệp CSS/JS có mã băm, CSP `style-src 'self'`; script form là module riêng, `defer`; `<form hidden>` không `action`, module bỏ `hidden` (SEC UXD-08) |
| Submit giả lập (`setTimeout`), nút "Submit" trên thanh MOCK | `POST` JSON tới endpoint công khai ARC chốt (ADR-014 4.3, 4.8) cùng origin; `formToken` lần đầu khách focus vào form; `422 FORM_TOKEN_INVALID` → lấy token mới, gửi lại **một** lần. Schema zod sinh từ `WebsiteBookingRequestInput` (`packages/contracts`) – không tự đặt tên khóa (SEC UXD-07); các khóa A1–A3 ở 5.2 chờ ARC sửa hợp đồng |
| Nút "Form: on/off" | `booking.mode` = `chat` \| `request` \| `live` (5.5) |
| Câu "1 giờ / 09:00 / 07:00–22:00 / 30%" và giờ ở dòng lối thoát viết trong chuỗi/`CFG` | Đọc tham số công khai: `web_request_public_promise_minutes` (60), `web_request_public_promise_next_morning_by` (09:00), `front_desk_hours` [07:00, 22:00), cọc BR-305. **Không** hiện `replyBy` của 202 (hạn nội bộ `web_request_response_minutes` = 15 phút – BR-912 v0.3.8) |
| `refCode()` sinh ở trình duyệt | `refCode` từ 202; hiển thị hai `<span>` 4 + 4, không ký tự phân cách |
| Link "Privacy notice" bị chặn, hiện "MOCK: …" | Link thật `/privacy/#booking-requests` · `/vi/privacy/#yeu-cau-dat-phong`, cùng thẻ; form giữ dữ liệu trong bộ nhớ trang khi khách quay lại (không lưu trình duyệt) |
| `{receivingAccountHolder}` hiện tên khóa | Chèn tên chủ tài khoản từ `payment_receiving_account` lúc dựng trang |
| Ô ngày `type="date"` | Giữ ô ngày gốc. **Định dạng hiện theo ngôn ngữ trình duyệt/hệ điều hành, không theo `lang` của trang** (Chrome tiếng Anh: mm/dd/yyyy, kể cả bản VI). FE-LP không tự vẽ lịch ở v1; QA kiểm trên Chrome Android, Safari iOS, Samsung Internet với cả hai ngôn ngữ máy; nhãn ô và câu lỗi vẫn đúng ngôn ngữ trang (T7) |
| `localStorage` cho ngôn ngữ, Notes, công tắc form | Bỏ (ngôn ngữ = URL `/` và `/vi/`) |
| Chuỗi EN/VI nằm cạnh nhau, `option` đổi chữ bằng `data-en/data-vi`; link đổi theo `data-href-vi` | File chuỗi theo `locale`; mỗi URL một ngôn ngữ |
| Thanh đáy ẩn bằng IntersectionObserver (hero, Book, Contact, footer) | Giữ; không JS thì luôn hiện + đệm chân trang |
| Thanh MOCK, Notes, chip ghi chú, khối payload, `.mock-toast` | Bỏ |
| Trang 404 (mock không có) | EN "We could not find this page." / "The link may be out of date or mistyped. You will find everything about OTTIMO on the home page." / "Back to the home page"; VI "Không tìm thấy trang này." / "Đường dẫn có thể đã cũ hoặc bị gõ nhầm. Mọi thông tin về OTTIMO có ở trang chủ." / "Về trang chủ" (UXD duyệt 17/10) |
- Mọi nút là `<a href>` thật trừ Copy address, nút gửi, nút chọn của form. Link trong câu dùng `.link-in` (không ép cao 44 px). Không thêm màu ngoài token mục 7.

## 14. Đã xử lý
### 14.1 FB-INV-002 – xem bảng mục 0.
### 14.2 Phản biện thiết kế v1.2 – xem bảng mục 0.1; trả lời từng mục: `rounds/round-02/responses/landing-v12-UXD.md`.
### 14.3 Thẻ SEC
- FB-R2-SEC-UXD-04…08: mục 0.2.
- FB-R2-SEC-UXD-01: mock vẫn ghi "MOCK v1.2.1 · not production code"; production tự host font, không CSS/JS nội tuyến (mục 13).
- FB-R2-SEC-UXD-03: không hứa ưu đãi; không ô nhận ưu đãi trên form.
### 14.4 Ghi chú định vị của DOM (`landing-positioning.md`) – như v1.2
| DOM | Áp dụng | Ghi chú |
|---|---|---|
| 1.1 câu định vị; 3.1 lead hero | Dùng nguyên ý | VI lead bỏ chữ "căn" |
| 1.3 sáu câu gây hiểu nhầm | Bỏ cả sáu | |
| 2.1–2.4 từ dùng/tránh, không số phòng, chỉ hứa điều đang làm | Áp toàn bộ | "monthly agreement" thêm vào danh sách tránh |
| 3.2 hai thẻ | Biên tập lại theo T2: không kê thiết bị ở thẻ | Giữ ý "dọn phòng mỗi ngày" (ngắn ngày) và "gói dọn phòng tùy chọn" (tháng) |
| 3.5 theo tháng | FAQ "How do long stays work?" chứa điện nước theo công tơ + điều khoản rõ ràng | Giá "from …" chờ L3 |
| 3.6 đặt trực tiếp + trang cảm ơn | 3 bước, "Send booking request", trang cảm ơn mục 5.4 | Không hiện dòng "Not on Zalo? …" – khách đã chọn kênh trong form |
| 3.8 liên hệ | Zalo nút chính ở Liên hệ; Facebook "OTTIMO on Facebook" | Kênh khác: ô gập ở Liên hệ |
| 3.1 nút phụ hero "See the rooms" | **Không áp** – nút phụ hero là "Chat on Zalo" (ý 4) | |

## 15. Việc chờ và giả định
### 15.1 Chờ INV (trong ESC-020 L5 và các ESC đã có – không mở ESC mới)
1. Câu có số: trả lời trong 1 giờ (07:00–22:00), ngoài giờ trước 09:00; lễ tân 07:00–22:00; cọc 30% qua QR; nhận 14:00 / trả 12:00; "180 ngày" ở câu thông báo (SEC A.2 – kèm luật sư); câu sofa của Premium (PO Q4); "Sleeps 2–3 / 3–4 / 4–5, số lớn hơn là khi có khách ngủ sofa, có phụ thu".
2. Câu Facebook trong FAQ: nhân viên có xác nhận đặt phòng/nhận cọc qua Messenger không (SEC UXD-06).
3. Tên chủ tài khoản nhận cọc `{receivingAccountHolder}` (tên pháp nhân – ESC-008); tên công ty + MST ở chân trang.
4. Bảng ghép tên phòng ↔ căn ↔ hạng (hẹn 19/10); logo SVG; giá "from …/month" (L3); link Zalo OA (ESC-021).
5. Để INV biết (trong quyền UXD, không cần chọn): Request to book là nút chính ở hero và thanh đáy, Zalo nút phụ (N2); WhatsApp ngang Zalo trong ô "Trả lời qua" của form (T8). Tùy chọn từ v1.2: mở sẵn "Other channels" ở bản EN.
6. Không đăng e-brochure bản hiện tại ("mười căn hộ", "5 sao") – DOM 2.3.

### 15.2 Việc cho vai khác (qua ORC)
| Vai | Việc |
|---|---|
| ARC | Sửa hợp đồng theo 5.2 A1 (một cách liên hệ), A2 (trẻ em theo nhóm tuổi), A3 (`months`); chọn cách trang biết giờ câu hứa công khai (trường mới trong 202 hoặc FE tự tính – 5.4); ví dụ `landingPath` bỏ `/book/` (5.7); endpoint + form token (ADR-014 4.8) |
| SEC | Xác nhận dòng lối thoát dùng giờ câu hứa công khai thay `{replyBy}` (5.4); trang thông báo xử lý dữ liệu + `privacy_notice_version` |
| PO/DOM | AC US-155 theo 5.2–5.4 (một cách liên hệ, ba ô đếm người, dòng lối thoát, không hiện `replyBy`); gom danh sách 15.1 vào `landing-inv-questions.md`; Q4 Premium: xác nhận cả giường 1m4 lẫn câu sofa (mục 0.3) |
| FE-LP | Cập nhật `landing-web` theo mục 3.1, 3.3, 5, 6, 13 |
| QA | Ca kiểm từ mục 12.1 (luồng form, thanh đáy gồm Liên hệ + chân trang, quét bề rộng, vừa chữ, ô ngày theo ngôn ngữ máy) |

### 15.3 Giả định
| # | Giả định | Nếu sai |
|---|---|---|
| G-1…G-8 | Như v1.1 (ánh xạ ảnh – INV xác nhận 17/10; hotline; giờ 14:00/12:00; điện nước theo công tơ; mọi phòng có bếp, máy giặt sấy, ban công; tracking %em; không chế độ tối; khoảng cách brochure) | Như v1.1 |
| G-10 | Câu hứa BR-912 (4) (60 phút / trước 09:00) và giờ lễ tân BR-811 (07:00–22:00) | Sửa tham số, không sửa bố cục |
| G-11 | Cọc 30% (BR-305) được nói công khai | Bỏ "30%" ở bước 3 |
| G-12 | Sức chứa có sofa 3/3/4/5 (BR-110) | Sửa `data-cap`, `data-min` và dòng thông số |
| G-13 | Slug `roomType` theo quy tắc hợp đồng (`standard-studio-city-view`…) | Đổi giá trị `option` |
| G-14 | Ánh xạ nội bộ Premium = 302/402 (Căn N+), Signature = 301/401 (Căn N) (DOM) | Không ảnh hưởng trang (không ghi số căn) |
| G-15 | Nhân viên không xác nhận đặt phòng/nhận cọc qua Messenger | Bỏ câu Facebook ở FAQ, thêm Messenger vào "các kênh ghi trên trang" |

### 15.4 Đề xuất dòng decision-log (ORC ghi khi commit)
- `| 2026-10-17 | 2 | Landing v1.2 (UXD, trong quyền giao diện): 8 mục một ý (Hero → Why "Stay a night, or a season." → Rooms → Amenities → Location → Book → FAQ → Contact); thang khoảng cách 4…128; Zalo là kênh chat chính, WhatsApp/Telegram/Viber trong ô gập; Facebook là liên kết thường; form yêu cầu đặt phòng (L7-A) một cách liên hệ, ba ô đếm người, trang cảm ơn theo kênh; thẻ phòng vuốt ngang trên điện thoại | UXD | FB-INV-002; DOM landing-positioning; concept.md v1.2 |`
- `| 2026-10-17 | 2 | Landing v1.2.1 (UXD, theo phản biện thiết kế + SEC UXD-04…08): một thứ bậc nút – "Request to book" nút đặc, Zalo nút viền ở hero và thanh đáy; thanh đáy ẩn khi hero/Book/Liên hệ/chân trang trên màn hình; header ≥ 768 px có link "Chat on Zalo"; chân trang một dòng link (Zalo · Facebook · Email); câu đồng ý theo SEC Phụ lục A; dòng lối thoát trang cảm ơn dùng giờ câu hứa công khai, không hiện replyBy (BR-912 v0.3.8) | UXD | landing-v12-critic.md; landing-booking-SEC.md; concept.md v1.2.1 |`

## 16. Lịch sử
| Phiên bản | Ngày | Nội dung |
|---|---|---|
| 0.1 | 17/10/2026 | Bản đầu: tiếng Việt trước, hướng "kem – sồi, chạm đất nung" + biến thể B, ô Hỏi phòng trống |
| 1.0 | 17/10/2026 | Theo Brand Guidelines v1.0; 4 hạng phòng và nội dung e-brochure; 18 ảnh thật; logo giữ chỗ; thanh liên hệ đáy |
| 1.1 | 17/10/2026 | Sửa theo kiểm độc lập brand + a11y: logo đạt cỡ tối thiểu, trần ảnh 960 px điện thoại + ngân sách DPR, bảng cỡ chữ web, bỏ ký tự ngoài font |
| 1.2 | 17/10/2026 | Theo FB-INV-002 + ghi chú DOM: bỏ mọi chỗ nhắc số phòng; định vị boutique stay với lời hứa kép; form "Request to book" (L7-A); Zalo là kênh chính, kênh khác trong ô gập, link Facebook; kiến trúc 8 mục; ảnh 18 → 9; trang điện thoại ngắn hơn 35% |
| 1.2.1 | 17/10/2026 | Theo phản biện thiết kế (N1–N4, T1–T9), SEC UXD-04…08 và DOM (tên khóa tham số): chân trang một dòng, Liên hệ bỏ địa chỉ; một thứ bậc nút hero = thanh đáy, thanh đáy ẩn ở Liên hệ + chân trang; link Zalo ở header ≥ 768 px; điện nước sang FAQ, "clear monthly terms"; bỏ "Bốn hạng phòng", chữ "căn"; bớt lặp thiết bị; nút hero vừa màn hình 375 × 812; chữ nút thống nhất "Request to book"; khoảng cách về thang; không ngắt số + đơn vị, nhãn form một dòng; câu đồng ý A.1/A.2, form một cách liên hệ, trẻ em theo nhóm tuổi, tên khóa theo hợp đồng; mã Crockford 4 + 4; dòng lối thoát dùng giờ câu hứa công khai; form `hidden` không `action`; INV đã chọn A. Theo PO: gỡ G-9; câu sofa của Premium; rà chữ "hotel" (mục 2.4); link fanpage `#book`; câu hứa "trong 1 giờ (07:00–22:00); ngoài giờ trước 09:00". Kiểm thêm khổ 768; trang 375 px 8.870 px |
