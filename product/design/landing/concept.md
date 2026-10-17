# Landing page OTTIMO – Concept v1.1

- Người viết: UXD | Round 2 (song song Sprint 4, lịch P1) | Ngày: 17/10/2026
- Trạng thái: **Bản v1.1 chờ review** – bắt buộc: UXR, PO; khuyến nghị: FE, DOM, SEC. v1.1 = sửa theo kiểm độc lập brand + a11y (M1, M2, L1, L2, L3, L5 – mục 13.2).
- Mock: `mock/index.html` (một tệp + thư mục `mock/img/`), ảnh chụp: `mock/shots/`, nguồn ảnh: `mock/img/CREDITS.md`, công cụ ảnh: `tools/optimize-images.mjs`.
- Căn cứ: **OTTIMO Brand Guidelines v1.0** (`00-brief/context/brand/brand-guidelines.md`, trang logo p12–p16), e-brochure 2026 (`00-brief/context/landing/ebrochure-text.md` + ảnh trang), 45 ảnh gốc, `rounds/round-02/outputs/PO/landing-scope.md` (EP19), ESC-020, ESC-021, ADR-014, `rounds/round-02/reviews/landing-zalo-SEC.md`.
- Quy ước: **[Chưa xác minh]** = đội chưa kiểm được · **[Chờ INV]** = chỉ INV có thông tin hoặc quyền quyết.

---

## 0. Tóm tắt
- Một trang dài, ưu tiên điện thoại, **tiếng Anh mặc định, nút chuyển sang tiếng Việt** (cả hai bản nằm sẵn trong trang). Không form, không ô nhập, không đo lường.
- Màu, chữ, giọng văn **đúng Brand Guidelines**: nền Ivory/Cream, chữ Ink, nhấn Oak/Earth Brown, Sage ≤ 5% chỉ để trang trí. **Bỏ hẳn terracotta và biến thể B** của v0.1.
- Ảnh thật: 18 ảnh chọn từ 45 ảnh gốc, WebP + AVIF ở 480/960/1600 px, tổng 4,54 MB (thư mục). **Điện thoại (< 768 px) chỉ tải tối đa bản 960 px, bất kể DPR**; ảnh hero 16 KB (DPR 1) / 48 KB (DPR 2–3). Ngân sách dung lượng theo DPR ở mục 11.2.
- Bốn hạng phòng theo e-brochure; tên phòng thiên nhiên (The Pine … The Ember) hiện như một "vũ trụ tên", **không gán cho căn nào** (chờ bảng ghép của INV).
- Thanh liên hệ dính đáy trên điện thoại: WhatsApp · Zalo · Call (bản EN), Zalo · WhatsApp · Gọi (bản VI).
- Kiểm bằng Chromium không giao diện: 320/375/1280 px × EN/VI – không cuộn ngang (quét thêm 98 bề rộng 320–1920 px), đúng một H1, mọi cặp chữ–nền đạt AA (thấp nhất 4,53), axe-core 0 lỗi, 0 ký tự rơi sang font dự phòng, logo đạt cỡ tối thiểu, LCP đo được 0,61 giây (lab) – mục 11.

## 1. Mục tiêu và phạm vi v1
| Mục tiêu | Cách trang đáp ứng |
|---|---|
| Kéo khách về kênh trực tiếp (PRD G3) | Mọi nút dẫn về WhatsApp/Telegram/Viber/Zalo/điện thoại của cơ sở, không dẫn sang OTA |
| Lấp căn dài hạn (G2) | Hero, khối "A month, or longer", hỏi đáp thuê tháng |
| Ấn tượng boutique, đúng thương hiệu | Brand Guidelines v1.0, ảnh thật, câu ngắn – điềm tĩnh |
| Nhanh trên 4G | LCP mục tiêu ≤ 2,5 giây (phân vị 75) |

Phạm vi và không-phạm-vi theo PO (`landing-scope.md` mục 3): không form, không giá đêm, không phòng trống/thanh toán, không widget chat, không pixel, không link OTA.

Khác v0.1: mock v1 **bỏ ô "Hỏi phòng trống"** (ngày, số khách). Lý do: trang hoàn toàn tĩnh, không ô nhập nào (SEC UXD-03 dễ chứng minh). Thay bằng nút "Ask about this room" ở từng hạng phòng, mở WhatsApp với câu soạn sẵn tên hạng phòng. PO quyết có đưa lại ô này ở v1.1 không.

## 2. Màu – đúng bảng 80/15/5

### 2.1 Token (chỉ 7 màu của guideline + trắng)
| Token | HEX | Nhóm | Vai trò trên landing |
|---|---|---|---|
| `--ivory` | #F4F0E8 | Neutrals | Nền chính của trang, header, thanh đáy |
| `--cream` | #EDE6D8 | Neutrals | Dải xen kẽ (About, Why, Contact), thẻ, nền chờ ảnh |
| `--stone` | #6B6760 | Neutrals | Chữ phụ (mô tả, chú thích) trên Ivory/Cream; nét núi sau của monogram |
| `--ink` | #2B2B28 | Neutrals | Chữ chính; dải tối "Lobby & location"; chân trang; viền nút phụ; vòng focus |
| `--oak` | #B08D57 | Warm Woods | Nét kẻ mảnh (hairline), vạch trước nhãn, gạch dưới wordmark; **chữ nhãn chỉ trên nền Ink** |
| `--earth` | #7A5C44 | Warm Woods | **Nền nút chính** (chữ trắng), nhãn mục, link, số thứ tự, dấu "·" giữa tên phòng |
| `--sage` | #8A9079 | Botanical | Chỉ trang trí: chấm tròn ở danh sách sự thật hero và bảng khoảng cách (< 1% diện tích) |
| `--white` | #FFFFFF | – | Chỉ cho chữ trên nút Earth Brown |

- Tỷ lệ thực tế (không tính ảnh): Ivory/Cream/Ink chiếm gần hết diện tích; Earth/Oak chỉ ở nút, nhãn, nét kẻ; Sage dưới 1%.
- **Đã xóa** `--clay`, `--clay-ink`, `--clay-soft`, `--clay-deep`, `--band*` và biến thể B. Không còn màu ngoài bảng.
- **Không có chế độ tối** cho landing (UXD quyết): thương hiệu dựa trên nền Ivory; dải Ink đã tạo nhịp sáng–tối. Trang khai báo `color-scheme: light` để trình duyệt không tự đảo màu.

### 2.2 Cặp chữ–nền và tương phản (đo bằng công thức WCAG, kiểm lại trên DOM thật – mục 11)
| Chữ | Nền | Tỷ lệ | Dùng ở | AA (≥ 4,5) |
|---|---|---|---|---|
| Ink | Ivory | 12,49 | Thân bài, tiêu đề | Đạt |
| Ink | Cream | 11,43 | Chữ trên dải/thẻ Cream | Đạt |
| Ivory | Ink | 12,49 | Dải Vị trí, chân trang, nút EN/VI đang chọn | Đạt |
| Cream | Ink | 11,43 | Chữ phụ trên nền tối | Đạt |
| Stone | Ivory | 4,95 | Chữ phụ | Đạt |
| Stone | Cream | 4,53 | Chữ phụ trong thẻ Cream | Đạt (sát ngưỡng – không dùng Stone dưới 14 px trên Cream) |
| Earth | Ivory | 5,37 | Nhãn, link | Đạt |
| Earth | Cream | 4,91 | Nhãn, link trên Cream; dấu "·" giữa tên phòng (v1 dùng Oak 2,49 – đã sửa) | Đạt |
| White | Earth | 6,10 | Nút chính | Đạt |
| Oak | Ink | 4,59 | Nhãn mục trên nền tối | Đạt |

Thành phần không phải chữ: viền nút phụ Ink trên Ivory 12,49; vòng focus Ink (nền sáng) / Ivory (nền tối) ≥ 11:1.

### 2.3 Chỗ guideline cần chỉnh (UXD ghi lệch, đề xuất guideline v1.1)
| Guideline nói | Đo được | Landing làm | Đề xuất |
|---|---|---|---|
| "White trên Oak/Earth cho nút, nhãn" | White/Oak **3,09:1** – không đạt AA cho chữ thường (chỉ đạt chữ ≥ 24 px) | Nút dùng **Earth Brown** (6,10:1). Oak không làm nền chữ | Guideline v1.1: "White trên Earth Brown cho nút; Oak chỉ cho nét kẻ, chữ ≥ 24 px, hoặc chữ Ink trên Oak (4,59)" |
| "Tránh Sage/Oak làm chữ trên nền sáng" | Oak/Ivory 2,72; Sage/Ivory 2,91 | Đúng – không dùng | Giữ |
| Tracking "+4", "+10" không ghi đơn vị | – | Hiểu là % cỡ chữ (như Figma): H1 0,04em, H2 0,02em, nhãn 0,1em | Hỏi người làm guideline đơn vị (1/1000 em hay %) |

## 3. Chữ – theo thang chữ của guideline, chuyển sang px web
| Cấp guideline | Font | Guideline (in) | Web: điện thoại → máy tính | Dòng | Giãn chữ | Dùng ở |
|---|---|---|---|---|---|---|
| H1 Display | Lora 400 | 40–64 pt | 36 → 60 px (`clamp`) | 1,1 | 0,04em | Tagline – **một H1 duy nhất** |
| H2 Heading | Lora 400 | 26–32 pt | 28 → 40 px | 1,2 | 0,02em | Tiêu đề mục; tên hạng phòng dùng H2 thu nhỏ 22 → 26 px (như brochure) |
| H3 Subhead | Be Vietnam Pro 600 | 16–20 pt | 18 → 20 px | 1,3 | 0 | Tiêu đề ý, thẻ, câu hỏi |
| Body | Be Vietnam Pro 400 | 11–13 pt | 16 → 17 px (đoạn dẫn 18 → 20) | 1,5 | 0 | Thân bài |
| Label | Be Vietnam Pro 500, CHỮ HOA | 9–11 pt | 13 px | 1,4 | 0,1em | Nhãn mục (có vạch Oak 28 px phía trước), chỉ số phòng |
| Mono | JetBrains Mono 400 | 10–13 pt | 11–12 px | 1,4 | 0 | **Chỉ cho mã.** Landing thật không có mã (không wifi, không mã đặt phòng) → bản production **không tải** font Mono. Mock chỉ dùng cho thanh "MOCK" và chip mã ảnh |

- Quy đổi tham chiếu: **1 pt = 1,333 px** (định nghĩa của CSS). Theo cách đọc này thân bài 16–17 px (12–12,75 pt) và nhãn 13 px (9,75 pt) nằm trong khoảng guideline; H1/H2 ở máy tính cũng nằm trong khoảng. Chỗ lệch nằm ở **H1/H2 trên điện thoại** và **H3** – bảng 3.1.
- Thân bài tối thiểu 16 px để dễ đọc và iOS không tự phóng khi chạm.
- Dự phòng: Georgia / Arial / Courier New (theo guideline). Cả ba font Google đều có bộ ký tự tiếng Việt.
- Đơn vị `rem`, phóng chữ 200% không mất nội dung.

### 3.1 Điều chỉnh cỡ tiêu đề cho web (so với bảng chữ guideline p22)
Đo trên mock (Chromium, font Lora/Be Vietnam Pro đã tải). "Trong khoảng" tính theo 1 pt = 1,333 px.

| Cấp | Guideline (in) | = px CSS | Web 320–375 px | Web 1280 px | So với guideline | Lý do |
|---|---|---|---|---|---|---|
| H1 Display (tagline) | Lora 40–64 pt | 53,3–85,3 px | **36 px** (27 pt), 4 dòng | 58,9 px (44 pt), tối đa 60 px từ 1323 px | Điện thoại **thấp hơn**; máy tính trong khoảng | Tagline 52 ký tự. Ở 53,3 px (40 pt) tagline thành **6 dòng, cao 352 px** ở cả 320 và 375 px – gần nửa màn hình chỉ cho một câu. Ở 40 px: 5 dòng ở 320 px. 36 px giữ 4 dòng ở 320–375 px. |
| H2 Heading | Lora 26–32 pt | 34,7–42,7 px | **28 px** (21 pt) | 39,8 px (29,9 pt), tối đa 40 px | Điện thoại **thấp hơn**; máy tính trong khoảng | Giữ thứ bậc với H1 điện thoại 36 px (tỉ lệ 1,29). Nếu H2 = 34,7 px thì gần bằng H1 36 px, mất bậc. |
| H3 Subhead | Be Vietnam Pro SemiBold 16–20 pt | 21,3–26,7 px | 18 px (13,5 pt) | 20 px (15 pt) | **Thấp hơn** ở mọi khổ | H3 trên landing là tiêu đề thẻ ngắn đứng ngay trên thân bài 16–17 px. 18–20 px SemiBold vẫn khác rõ thân bài (đậm + lớn hơn) mà không chen vào H2 28 px ở điện thoại. |
| Tên hạng phòng (thẻ `h3`) | Guideline p21: "Lora: wordmark, **tên phòng**, tiêu đề, signage" | – | Lora 400, 22 px | Lora 400, 26 px | Dùng **Lora** thay vì Be Vietnam Pro SemiBold của H3 | Xem 3.2 |

- Không đổi: Body 16–17 px, Label 13 px, Mono 11–12 px (Mono chỉ ở chip mock, production không tải).
- Tracking giữ như bảng trên (0,04em / 0,02em / 0,1em) – giả định G-6.

### 3.2 Vì sao tên hạng phòng dùng Lora dù nằm ở cấp H3
- Guideline p21 xếp **tên phòng** vào vai của Lora (cùng wordmark, tiêu đề, signage). Bảng cấp chữ p22 chỉ định font cho cấp H3 nói chung. Hai trang mâu thuẫn ở đúng chỗ này; landing theo p21 vì tên hạng phòng là **tên riêng**, không phải tiêu đề phụ.
- E-brochure (trang 6–29) đặt tên hạng phòng bằng chữ serif. Khối "Inspired by nature" (The Pine … The Ember) cũng là Lora. Cùng một font cho mọi tên phòng giúp khách nhận ra đây là "tên", không phải nhãn chức năng.
- Về ngữ nghĩa HTML vẫn là `h3` (dưới H2 "Four ways to stay longer in Da Lat") để trình đọc màn hình đi đúng cây tiêu đề. Chỉ hình thức chữ khác.
- Mọi H3 khác (thẻ "A few nights", 5 ý Why OTTIMO, thẻ liên hệ, tiện nghi) dùng Be Vietnam Pro SemiBold đúng p22.
- Đề xuất guideline v1.1: ghi rõ "Tên phòng / hạng phòng: Lora 400, cỡ giữa H2 và H3" (gộp vào mục 14 #11).

### 3.3 Ký tự ngoài bộ font
- Bộ con Latin của Google Fonts (và bản tự host theo cùng subset) **không có** "→" (U+2192) và "≈" (U+2248). v1 để trình duyệt vẽ hai ký tự này bằng Arial.
- v1.1: mũi tên trong link "Ask for our direct rate" / "Monthly stays" là **SVG nội tuyến** 1em, `currentColor`, `aria-hidden`; "≈ 28 km" thành "about 28 km" / "khoảng 28 km". Chip ghi chú của mock cũng bỏ "←", "↔".
- Kiểm bằng CDP `CSS.getPlatformFontsForNode` trên mọi phần tử và giả phần tử: chỉ còn Lora, Be Vietnam Pro, JetBrains Mono (0 glyph Arial/Courier New) ở 320/375/1280 × EN/VI, kể cả khi bật Notes.
- Quy tắc cho FE và người viết nội dung: chỉ dùng ký tự có trong subset latin + latin-ext + vietnamese; mũi tên, biểu tượng là SVG.

## 4. Logo – bản giữ chỗ
- Header và chân trang dùng **lockup ngang**: monogram núi | vạch Oak | wordmark "OTTIMO" (Lora 400, giãn 0,12em) + "BOUTIQUE STAY" (Be Vietnam Pro 500, giãn 0,2em, Stone).
- Monogram vẽ lại bằng SVG nội tuyến theo trang p12: hai dãy núi lồng nhau, núi trước Ink có khấc tuyết, núi sau + đường chân Stone. Trên nền Ink: núi trước Ivory, núi sau Stone (theo p15).
- Kích thước (v1.1, đo trên DOM): wordmark "OTTIMO" Lora 26 px = **122 px** (tối thiểu 120); lockup = monogram 40 + khoảng 10 + vạch 1 + khoảng 10 + wordmark 122 = **183 px** (tối thiểu 180); monogram 40 px (tối thiểu 32). Khi Lora chưa tải (Georgia): 121 px / 182 px – vẫn đạt.
- Header: **≥ 375 px dùng lockup ngang**; 320–374 px chỉ hiện wordmark (lockup + nút EN/VI + menu không đủ chỗ). Chân trang **luôn dùng lockup** ở mọi khổ. Ở 375 px header còn dư 10 px.
- v1 sai: wordmark 23 px = 108 px ở 320 px, lockup 177 px ở header/chân trang – dưới cỡ tối thiểu (kiểm độc lập M1).
- Tên truy cập: bỏ `aria-label`, chữ "OTTIMO Boutique Stay" đọc thẳng từ nội dung (chữ hoa bằng CSS); chân trang thêm "– back to top / – về đầu trang" ẩn trực quan. Sửa lỗi axe `label-content-name-mismatch` mà v1 có.
- Favicon là monogram (32 px) dạng data URI.
- **Đây là bản giữ chỗ** – mock ghi rõ ở thanh trên cùng. Thay bằng tệp SVG gốc khi INV gửi (ESC-020 "Còn thiếu" #6). Không kéo giãn, không đổi màu ngoài bảng.

## 5. Giọng văn và nội dung
- **Tiếng Anh dẫn dắt, tiếng Việt hỗ trợ.** Bản EN có một dòng tiếng Việt nhỏ dưới hero ("Một căn hộ ở Đà Lạt — để ở lại một tháng, hay lâu hơn."); bản VI có dòng tiếng Anh tương ứng. H1 luôn là tagline tiếng Anh (gắn `lang="en"`).
- **Tagline:** *A refined stay inspired by the calm spirit of Dalat.* – giữ nguyên văn ("Dalat"); thân bài viết "Da Lat" như brochure [Chờ INV xác nhận cách viết].
- Câu ngắn, lịch sự, không emoji, không cảm thán, không IN HOA để nhấn (chữ hoa chỉ ở nhãn theo guideline).
- Nguồn chữ: e-brochure 2026 (L5-A), UXD biên tập cho web:

| Chỗ | Brochure | Landing v1 | Lý do |
|---|---|---|---|
| Tên thương hiệu trong câu | "Ottimo" | "OTTIMO" | Theo guideline ("Welcome to OTTIMO.") |
| Tiện nghi giấc ngủ | "Five-star sleep · chuẩn 5 sao"; "Chuẩn thiết bị resort 5 sao" | "Hotel-grade sleep · Dunlopillo" | Tránh lời quảng cáo hạng sao chưa có căn cứ; guideline "không luxury dát vàng" [Chờ INV duyệt ở L5] |
| Studio City View | "for one long-stay guest" | bỏ cụm này | Hạng phòng ghi 2 khách – tránh mâu thuẫn |
| Câu mở trang | "A hotel is for visiting. Ottimo is for living." | Giữ, đặt làm trích dẫn ở About | Câu đắt nhất của brochure |
| Email | email cá nhân in ở trang cuối | `booking@ottimo.vn` (INV xác nhận 17/10) | Không đăng dữ liệu cá nhân; chờ hộp thư chung trên tên miền (ESC-020 #3) |

- Câu chống giả danh (SEC/DOM-06) ở Hỏi đáp: "OTTIMO only messages you from the numbers on this page, our official Zalo account and your booking platform's inbox. We never ask for card numbers and never change bank details by message."
- Không hứa "ưu đãi cho lần sau" (SEC UXD-03). Không có câu "không lưu thông tin bạn nhập" vì trang không có ô nhập; thay bằng "This site has no forms and no tracking cookies."

## 6. Sơ đồ trang (mock v1)
| # | Mục | Neo | Nền | Nội dung chính (EN) | Nút |
|---|---|---|---|---|---|
| 0 | Header dính | – | Ivory | Lockup, menu (Rooms · Amenities · Location · FAQ), EN/VI | Book direct (≥ 768 px); ☰ (< 1024 px) |
| 1 | Hero | `#top` | Ivory | Ảnh mặt tiền chạng vạng (LCP), nhãn "Boutique stay · Da Lat", H1 tagline, đoạn dẫn, 4 sự thật: Check-in 14:00 · Check-out 12:00 · 1 Gbps fibre · In-room washer-dryer | Book direct · View the rooms |
| 2 | Hai cách ở (US-146) | – | Ivory, thẻ Cream | "A few nights" / "A month, or longer" | Ask for our direct rate · Monthly stays (link + mũi tên SVG) |
| 3 | About | `#about` | Cream | "Move in, not check in." + ảnh sảnh + trích dẫn | – |
| 4 | Hạng phòng | `#rooms` | Ivory | "Four ways to stay longer in Da Lat" – 4 thẻ (mục 7) + khối tên phòng | Ask about this room (WhatsApp/Zalo theo ngôn ngữ) |
| 5 | Why OTTIMO | `#why` | Cream | "Runs like your own home, in every detail." – 5 ý của brochure | – |
| 6 | Tiện nghi | `#amenities` | Ivory | "Everything a home has — ready to move in." – 12 tiện nghi đúng hãng/model | – |
| 7 | Sảnh & vị trí | `#location` | **Ink** | "Groceries, cafés, the office — all minutes away." / "Home, in silence." – địa chỉ, bảng 8 khoảng cách, ảnh flycam + ban công | Open in Google Maps · Copy address |
| 8 | Hỏi đáp | `#faq` | Ivory | 5 câu: giờ nhận/trả, thuê tháng, cách đặt, hỗ trợ, chống giả danh | – |
| 9 | Đặt trực tiếp | `#contact` | Cream | "Talk to us directly." – 3 thẻ kênh (mục 10) | WhatsApp · Telegram · Viber · Chat on Zalo · Call |
| 10 | Chân trang | – | Ink | Lockup trên nền tối, tagline, địa chỉ, liên hệ, © 2026 | – |
| – | Thanh dính đáy (< 768 px) | – | Ivory | 3 nút cao 48 px | WhatsApp · Zalo · Call |

Bố cục: khung tối đa 1200 px; lề 16/24/32 px; khoảng mục 64/80/104 px; bo góc 4 px (gần vuông như brochure); nét kẻ Oak 1 px. Chuyển động: chỉ chuyển màu nút 200 ms; tôn trọng `prefers-reduced-motion`. Chữ không đặt trên ảnh.

## 7. Bốn hạng phòng (theo e-brochure trang 6–29)
| # | Hạng (EN · VI) | Sức chứa | Diện tích | Hướng | Ảnh trên landing |
|---|---|---|---|---|---|
| 01 | Standard Studio · City View — Studio — Hướng thành phố | 2 khách · 1 giường đôi | 29 m² | Thành phố | `city-living`, `city-bed`, `city-view` |
| 02 | Standard Studio · Garden View — Studio — Hướng vườn | 2 khách · 1 giường đôi | 28–34 m² | Vườn | `garden-oak`, `garden-navy`, `garden-balcony` |
| 03 | Premium · One Bedroom + 1 — Premium — 1 phòng ngủ + 1 | 3 khách · 1 giường đôi + 1 đơn | 37 m² | Vườn | `premium-kitchen`, `premium-bed`, `premium-living` |
| 04 | Signature · Two Bedrooms — Signature — 2 phòng ngủ | 4 khách · 2 giường đôi | 47 m² | Vườn | `signature-dining`, `signature-bed`, `signature-bath` |

- Mỗi thẻ: ảnh chính 3:2 + 2 ảnh nhỏ, chỉ số + hướng, tên EN (tên VI làm dòng phụ – bản VI đảo lại), bảng Sleeps/Size/View, mô tả brochure đã biên tập, dòng giá, nút hỏi.
- Giá: "Nightly and monthly rates on request." – chưa hiện "Monthly from …" vì L3 chưa quyết và chưa có bảng ghép hạng ↔ giá (decision-log 17/10, PO).
- Số căn mỗi hạng **không ghi** [Chờ INV]. Suy đoán từ brief (6 căn lầu 1–2 = Studio; Căn N 301/401 = Premium; Căn N+ 302/402 = Signature) [Chưa xác minh].
- **Vũ trụ tên phòng:** khối "Inspired by nature – Ten apartments, ten names — none of them numbers." liệt kê The Pine · The Mist · The Fern · The Bloom · The Valley · The Amber · The Sage · The Velvet · The Ivory · The Ember. **Không gán tên cho căn hay hạng** tới khi INV gửi bảng ghép.

## 8. Ảnh

### 8.1 Ánh xạ thư mục Drive → hạng phòng (UXD đối chiếu ảnh với trang brochure)
| Thư mục | Hạng phòng / khu | Bằng chứng (trang brochure dùng chính ảnh đó) | Độ tin cậy |
|---|---|---|---|
| Mặt tiền + Sảnh (6) | Mặt tiền chiều (01a, 02), chạng vạng (03, 04.1), flycam ban ngày (05.2), sảnh lễ tân (01b) | p31 = 01b; p33 = cùng loạt mặt tiền | Cao |
| Phòng 1 (7) | Standard Studio · Garden View – bản **gỗ sáng** ("rộng nhất tầng") | p13 = 7, p14 = 1, p15 = 3, p16 = 4 | Cao |
| Phòng 2 (6) | Standard Studio · Garden View – bản **navy** ("gọn") | p16 (ảnh nhỏ) = 01, p17 = 02 + 03, p18 = 04, p19 = 05, p30 = 06 | Cao |
| Phòng 3 (10) | Standard Studio · City View (kem – xám) | p7 = 04, p8 = 03, p9 = 02, p10 = 05/06/07, p11 = 09 + 01.1, p12 = 10 + 08 | Cao |
| Phòng 4 (9) | Signature · Two Bedrooms | p25 = 3, p26 = 4, p27 = 5, p28 = 6/7/8, p29 = 9 | Cao |
| Phòng 5 (7) | Premium · One Bedroom + 1 | p20 = 1, p21 = 2, p22 = 3, p23 = 4/5/6, p24 = 7 | Cao |

- Lưu ý: brochure p24 (Premium) còn dùng **Phòng 1/6.png** (phòng khách gỗ sáng, đúng phong cách Phòng 1) – có thể brochure dàn trang nhầm [Chờ INV]. Landing không dùng ảnh này.
- Bản gỗ sáng 34 m², bản navy 28 m² là suy luận từ câu "largest on the floor / compact" [Chưa xác minh].
- Thư mục "Phòng n" là **một căn đại diện** cho hạng, không phải căn cụ thể nào được công bố.

### 8.2 Bộ 18 ảnh
| ID | Nguồn | Dùng ở |
|---|---|---|
| `hero-facade-dusk` | mat-tien-sanh/04.1.png | Hero – ảnh LCP, có preload |
| `lobby` | mat-tien-sanh/01b.png | About |
| `aerial-hillside` | mat-tien-sanh/05.2.png | Vị trí |
| `city-living`, `city-bed`, `city-view` | phong-3/03, 06, 08 | Hạng 01 |
| `garden-oak`, `garden-navy`, `garden-balcony` | phong-1/1, phong-2/05, phong-1/7 | Hạng 02 |
| `premium-kitchen`, `premium-bed`, `premium-living` | phong-5/5, 2, 4 | Hạng 03 |
| `signature-dining`, `signature-bed`, `signature-bath` | phong-4/3, 6, 5 | Hạng 04 |
| `detail-laundry-desk` | phong-2/02.png | Why OTTIMO |
| `detail-kitchen` | phong-1/3.png | Tiện nghi |
| `detail-balcony-sunset` | phong-2/06.png | Vị trí |

Chi tiết (kích thước gốc, trang brochure, alt EN/VI): `mock/img/CREDITS.md`, `mock/img/manifest.json`.

Lọc theo SEC (FB-R2-SEC-UXD-02): không người; không cận khóa cửa/bàn phím; không số căn; không màn hình có dữ liệu. Loại `phong-3/01.1` (cửa có khóa điện tử và bảng nội quy chiếm nhiều khung hình). `detail-laundry-desk` và `city-living` có tay nắm khóa ở xa, không đọc được hãng – chấp nhận. TV chỉ hiện logo OTTIMO.

### 8.3 Đường ống
- `node product/design/landing/tools/optimize-images.mjs` – dùng `sharp` có sẵn trong repo (services/api hoặc kho pnpm), không thêm phụ thuộc.
- WebP q72 + AVIF q50; rộng 480 / 960 / 1600 px; xoay theo EXIF, trải nền Ivory cho ảnh có kênh alpha, xuất sRGB, **xóa toàn bộ metadata**.
- Kết quả: 18 ảnh × 3 cỡ × 2 định dạng = 108 tệp, **4,54 MB** (< 6 MB). Ảnh hero 960w: AVIF 48 KB / WebP 68 KB.
- Trang: `<picture>` AVIF → WebP, `srcset` + `sizes` khớp bố cục; ảnh khác hero `loading="lazy" decoding="async"`; mọi ảnh có `width`/`height`; nền chờ Cream.
- **Trần ảnh điện thoại (v1.1):** 10 ảnh có bản 1600 px được thêm cặp `<source media="(max-width: 767px)">` (AVIF + WebP) chỉ gồm 480/960 px. Điện thoại DPR 3 tải 960 thay vì 1600 (mật độ thực 2,56× ở 375 px – mắt thường không phân biệt với ảnh chụp). Ảnh nhỏ trong thẻ phòng vốn chỉ có 480/960.
- **Hero:** `fetchpriority="high"` + hai `<link rel="preload" as="image">` tách theo `media` (`max-width: 767px` → 480/960, `sizes="100vw"`; `min-width: 768px` → 480/960/1600) – trùng hệt `media`/`srcset`/`sizes` của `<source>` nên ảnh chỉ tải **một lần** (đã đo ở DPR 1/2/3 và máy tính).
- Vì sao không thêm bản 720/1200: Chromium chọn bản nhỏ nhất ≥ số px cần. Ở 375 px DPR 2 cần 750 px → bản 720 không được chọn, vẫn tải 960; ở DPR 3 cần 1125 px → bản 1200 được chọn, nặng hơn 960. Trần 960 rẻ hơn và không phải chạy lại đường ống ảnh.
- Ảnh gốc PNG không vào git. Khi FE dựng `product/apps/landing-web` (ADR-014), chuyển `img/` và script sang app đó (thêm tham số thư mục ra).
- Ảnh chia sẻ link (OG 1200×630, JPEG) chưa xuất – làm cùng FE khi có tên miền.

## 9. Vị trí (e-brochure trang 31–32)
- Địa chỉ: **30/3 Triệu Việt Vương, Phường Xuân Hương, Đà Lạt, Lâm Đồng**. Nút "Open in Google Maps" dùng link chỉ đường theo địa chỉ (chỉ mở khi bấm, không nhúng bản đồ). Đổi sang ghim chính xác khi INV gửi (ESC-020 #2).
- Bảng thời gian đi ô tô (Google Maps, ước tính – theo brochure). Trên trang: bản EN viết số thập phân bằng dấu chấm (1.7 km), **bản VI bằng dấu phẩy (1,7 km; 3,3 km)**; không dùng ký tự "≈".

| Điểm đến (EN · VI) | Khoảng cách | Thời gian |
|---|---|---|
| Bao Dai Summer Palace · Dinh Bảo Đại III | 1,7 km | 4 phút |
| Da Lat Cathedral · Nhà thờ Con Gà | 2,5 km | 6 phút |
| Truc Lam Zen Monastery · Thiền viện Trúc Lâm | 3,3 km | 7 phút |
| Da Lat Market · Xuan Huong Lake · Chợ Đà Lạt · Hồ Xuân Hương | 3,3 km | 7 phút |
| Intercity bus station · Bến xe liên tỉnh | 3,7 km | 8 phút |
| Lam Vien Square · Quảng trường Lâm Viên | 3,8 km | 8 phút |
| Tuyen Lam Lake · Hồ Tuyền Lâm | 4,1 km | 9 phút |
| Lien Khuong Airport · Sân bay Liên Khương | khoảng 28 km (EN: about 28 km) | 30 phút |

## 10. Liên hệ và nút
| Kênh | Số / địa chỉ (công khai trong brochure) | Link | Ghi chú |
|---|---|---|---|
| WhatsApp | +84 84 444 0909 | `https://wa.me/84844440909` (+ `?text=` theo hạng phòng) | [Chưa xác minh trên máy thật – QA thử] |
| Telegram | +84 84 444 0909 | `https://t.me/+84844440909` | [Chưa xác minh] |
| Viber | +84 84 444 0909 | `viber://chat?number=%2B84844440909` | Máy không cài Viber sẽ không mở [Chưa xác minh] |
| Zalo | 08.4444.0909 (hotline) | `https://zalo.me/0844440909` | Tạm Zalo số hotline cơ sở; đổi sang link OA khi xác thực (ESC-021) – chỉ sửa cấu hình |
| Gọi | 08.4444.0909 | `tel:+84844440909` | |
| Email | `booking@ottimo.vn` (INV xác nhận 17/10) | chưa có link | Chờ tên miền + hộp thư chung (ESC-020 #3) |

- Thứ tự theo ngôn ngữ (ESC-020 L2-A): bản EN đưa WhatsApp/Telegram/Viber lên trước và tô nút WhatsApp; bản VI đưa Zalo lên trước và tô nút Zalo – áp cho thanh đáy và thẻ liên hệ.
- Thanh dính đáy (< 768 px): 3 nút cao 48 px, nút đầu Earth Brown; trang chừa `padding-bottom` để không che chân trang; `scroll-padding` để header/thanh đáy không che phần tử đang focus.
- Không dùng logo của WhatsApp, Zalo… (nhãn hiệu bên khác) – chỉ chữ + biểu tượng chung (bong bóng chat, điện thoại).

## 11. Kiểm tra (Chromium không giao diện, Playwright 1.63 + axe-core 4.14 của repo – v1.1, 17/10/2026)

### 11.1 Bố cục, a11y, thương hiệu
| Hạng mục | 320 EN/VI | 375 EN/VI | 1280 EN/VI |
|---|---|---|---|
| Cuộn ngang (trước và sau khi cuộn hết trang) | Không | Không | Không |
| Số H1 | 1 | 1 | 1 |
| Trùng `id` | 0 | 0 | 0 |
| Vùng chạm < 44 px (trừ thanh MOCK) | 0 | 0 | 0 |
| axe-core (WCAG 2.0/2.1/2.2 A + AA), hỏi đáp mở hết, Notes bật | 0 lỗi | 0 lỗi | 0 lỗi |
| Tương phản chữ–nền (mọi nút chữ + giả phần tử `::before/::after`) | 10 cặp, thấp nhất 4,53 | như trái | như trái |
| Glyph vẽ bằng font dự phòng (Arial, Courier New…) | 0 | 0 | 0 |
| Logo header | wordmark 122 px | lockup 183 px | lockup 183 px |
| Logo chân trang | lockup 183 px | lockup 183 px | lockup 183 px |
| Lỗi console | 0 | 0 | 0 |
| Menu điện thoại mở, không tràn | Đạt | Đạt | – |

- **Quét bề rộng thêm**: 320–480 px mỗi 2 px và 17 mốc 540–1920 px × EN/VI = 196 lần – **0 cuộn ngang**. Lần quét này bắt được một lỗi có từ v1: bản VI tràn 3 px ở 360–362 px (4 "sự thật" ở hero đặt cột `max-content`) → đổi sang cột `auto`.
- **Font chặn** (giả lập Google Fonts không tải được, Georgia thay Lora): 320–1024 px không cuộn ngang; wordmark 121 px, lockup 182 px – vẫn trên cỡ tối thiểu.
- **Tương phản**: script đi qua mọi nút chữ đang hiện và giả phần tử có nội dung, lấy màu chữ và nền thật → 10 cặp, đúng bảng mục 2.2; **0 cặp dưới 4,5**. v1 có 11 cặp, cặp thứ 11 là Oak trên Cream 2,49 (dấu "·" giữa tên phòng) – đã sửa.
- **Font dự phòng**: CDP `CSS.getPlatformFontsForNode` trên mọi phần tử → chỉ Lora, Be Vietnam Pro, JetBrains Mono. v1 có "→" ×2 và "≈" vẽ bằng Arial, "←"/"↔" ở chip mock vẽ bằng Courier New.
- **axe v1 đo lại bằng cùng script**: 1 lỗi `label-content-name-mismatch` (2 nút: link logo header/chân trang có `aria-label` không chứa chữ đang hiện). v1.1 hết lỗi (mục 4).

### 11.2 Dung lượng theo DPR và ngân sách
Cách đo: Chromium, xóa bộ nhớ đệm, cộng `encodedDataLength` của CDP (byte truyền thật, gồm header); máy chủ cục bộ nén gzip HTML; trình duyệt chọn AVIF; font từ Google Fonts (chỉ ở mock). "Lúc mở trang" = sau `load` + mạng rảnh, chưa cuộn (đã gồm ảnh lười mà Chromium tải trước vì nằm gần màn hình). "Cuộn hết" = cuộn từng đoạn tới cuối trang.

**Đo được – điện thoại 375 px, bản EN** (v1 → v1.1):
| | DPR 1 | DPR 2 | DPR 3 |
|---|---|---|---|
| Ảnh hero | 480 px · 16 KB | 960 px · 48 KB | v1: 1600 px · 116 KB → **960 px · 48 KB** |
| Lúc mở trang | 214 KB / 18 yêu cầu (ảnh 77 · font 117 · HTML 19) | 283 KB / 18 (ảnh 147) | v1: 502 KB → **364 KB** / 18 (ảnh 227) |
| Cuộn hết | 313 KB / 28 (ảnh 176) | 532 KB / 28 (ảnh 395) | v1: 1.081 KB → **656 KB** / 28 (ảnh 520) |

- Bản VI (thêm bộ chữ tiếng Việt của Google, +60 KB): DPR 2 = 343 KB lúc mở / 591 KB cuộn hết; DPR 3 = 423 KB / 716 KB (v1: 561 KB / 1.140 KB).
- Ảnh hero chỉ tải **một lần** ở mọi lần đo (preload và `<source>` khớp nhau).
- DPR 1 và 2 không đổi so với v1 (trần 960 chỉ tác động khi điện thoại cần hơn 960 px).
- Máy tính 1280 px, EN (không đổi so với v1): DPR 1 – hero 960 px · 48 KB, mở 349 KB, cuộn hết 506 KB; DPR 2 – hero 1600 px · 116 KB, mở 662 KB, cuộn hết 1.032 KB.

**Ngân sách** (FE giữ khi dựng `landing-web`; QA đo lại bằng cùng cách):
| Điện thoại 375 px, EN | DPR 1 | DPR 2 | DPR 3 | Kết quả v1.1 |
|---|---|---|---|---|
| Ảnh hero | ≤ 20 KB | ≤ 50 KB | ≤ 50 KB | Đạt (16 / 48 / 48) |
| Lúc mở trang | ≤ 250 KB | ≤ 320 KB | ≤ 400 KB | Đạt (214 / 283 / 364) |
| Cuộn hết trang | ≤ 350 KB | ≤ 600 KB | ≤ 700 KB | Đạt (313 / 532 / 656) |

- Bản VI được cộng thêm ≤ 70 KB cho bộ chữ tiếng Việt → VI DPR 3: 423 ≤ 470, 716 ≤ 770 – Đạt.
- Máy tính 1280 px: DPR 1 – hero ≤ 50 KB, mở ≤ 400 KB, cuộn hết ≤ 600 KB; DPR 2 – hero ≤ 120 KB, mở ≤ 700 KB, cuộn hết ≤ 1.100 KB. Đạt.
- Quy tắc giữ ngân sách: điện thoại không bao giờ tải ảnh > 960 px; ảnh mới phải qua `tools/optimize-images.mjs`; font production tự host chỉ gồm subset cần dùng (không lớn hơn số đo của Google Fonts ở trên).

### 11.3 LCP
- Phần tử LCP là ảnh hero. Máy đo lab 412×823 @1,75 cần 721 px → bản 960 (48 KB) ở cả v1 và v1.1, nên số đo không đổi.
- Đo lab (Slow 4G giả lập qua CDP: 150 ms, 1,6 Mbps, CPU chậm 4×; máy chủ cục bộ; 3 lần): **trung vị 0,61 giây**. Chưa tính DNS/TCP/TLS tới máy chủ thật.
- Ước tính cho VPS thật trên Slow 4G: kết nối ~0,45 s + HTML ~0,25 s + ảnh hero ~0,4 s (song song CSS/font) + giải mã/vẽ ~0,2 s ≈ **1,3–1,6 giây** (font tự host); thêm ~0,3–0,5 s nếu vẫn gọi Google Fonts. Đều dưới mục tiêu 2,5 giây. Điện thoại DPR 3 nay tải hero 48 KB thay vì 116 KB – bớt khoảng 0,3 s ở 1,6 Mbps.
- Bên thứ ba khi tải trang: chỉ `fonts.googleapis.com` / `fonts.gstatic.com` (mock). Bản production tự host font → **0 bên thứ ba** (SEC C-1).

### 11.4 Ảnh chụp
`mock/shots/`, chế độ "Notes: off", PNG bảng màu, tổng **1,35 MB** (< 1,5 MB):
| Tệp | Khung | Dung lượng |
|---|---|---|
| `mobile-375-en-top.png` | 375×812, lockup ngang ở header | 81 KB |
| `mobile-375-vi-top.png` | 375×812 | 82 KB |
| `mobile-320-en-top.png` | 320×640, header chỉ wordmark (mới ở v1.1) | 59 KB |
| `desktop-1280-en-top.png` | 1280×800 | 203 KB |
| `mobile-375-en-full.png` | cả trang 375 px, thu về 320 px | 588 KB |
| `desktop-1280-en-full.png` | cả trang 1280 px, thu về 640 px | 364 KB |

## 12. Bàn giao FE – production khác mock ở đâu
| Mock | Production (`product/apps/landing-web`, ADR-014) |
|---|---|
| Google Fonts | Tự host woff2 (OFL), subset latin + latin-ext + vietnamese; preload Lora 400; không tải JetBrains Mono |
| `<style>`, `<script>` nội tuyến | Tệp CSS/JS có mã băm, CSP `style-src 'self'` (SEC C-1, UXD-01). Mock đã bỏ hết thuộc tính `style=""` để FE chép dễ |
| Chuyển ngôn ngữ bằng nút + `localStorage` | Hai URL `/` và `/en/` (hoặc `/vi/`) có `hreflang`; vào lần đầu theo ngôn ngữ trình duyệt (L1-A). Nút EN/VI là link |
| Thanh "MOCK" + nút Notes + chip ghi chú | Bỏ |
| Email `booking@ottimo.vn` (INV xác nhận 17/10) | Email chung thật hoặc ẩn dòng email |
| Monogram vẽ tay | SVG gốc của INV |
| Không có OG/JSON-LD đầy đủ | OG 1200×630 + JSON-LD `LodgingBusiness` (mock đã có khung JSON-LD) |
| `<picture>` có cặp `<source media="(max-width: 767px)">` 480/960 + 2 preload hero theo `media` | Giữ nguyên cấu trúc (trần 960 px trên điện thoại, mục 8.3); giữ ngân sách mục 11.2 |
| Logo: wordmark 26 px, lockup 183 px, header < 375 px chỉ wordmark | Giữ cỡ tối thiểu khi thay bằng SVG gốc: wordmark ≥ 120 px, lockup ≥ 180 px, monogram ≥ 32 px ở mọi khổ |
| Mũi tên link là SVG nội tuyến; không dùng "→", "≈", "←" trong chữ | Chỉ dùng ký tự có trong subset font tự host; biểu tượng là SVG (mục 3.3) |
- Dùng token ở mục 2.1, không thêm màu. Mọi nút là `<a href>` thật – trang dùng được khi JavaScript lỗi (chỉ nút "Copy address" cần JS).

## 13. Đã xử lý review

### 13.1 Review SEC (17/10)
| Thẻ | Xử lý trong v1 |
|---|---|
| FB-R2-SEC-UXD-01 | Ghi "MOCK v1 · not production code" trên đầu trang; bỏ thuộc tính `style`; ghi rõ tự host font, không CSS nội tuyến ở production (mục 12); không còn `localStorage` cho sáng/tối (bỏ chế độ tối) |
| FB-R2-SEC-UXD-02 | Danh sách kiểm ảnh áp cho 18 ảnh (mục 8.2, CREDITS.md); không có bản đồ tĩnh hay QR Zalo trong trang (chỉ link khi bấm); metadata ảnh đã xóa |
| FB-R2-SEC-UXD-03 | Không hứa ưu đãi; có câu chống giả danh; trang không có ô nhập nào |

### 13.2 Kiểm độc lập brand + a11y (17/10) – sửa trong v1.1
| Mục | Vấn đề | Xử lý | Bằng chứng |
|---|---|---|---|
| M1 | Wordmark 108 px ở 320 px (tối thiểu 120); lockup header/chân trang 177 px (tối thiểu 180) | `.wm-name` 23 → 26 px; monogram 44 → 40 px, khoảng cách 12 → 10 px; header < 375 px chỉ wordmark; chân trang luôn lockup | Wordmark 122 px, lockup 183 px ở 320/375/1280 (Georgia dự phòng: 121/182) – mục 4, 11.1 |
| M2 | DPR 3 tải hero 1600 px (116 KB) vì `sizes=100vw` | Trần 960 px cho mọi ảnh trên điện thoại bằng `<source media>`; preload hero tách theo `media`; ghi ngân sách DPR 1/2/3 | 375 px DPR 3: hero 48 KB, mở 364 KB (v1: 502), cuộn hết 656 KB (v1: 1.081) – mục 8.3, 11.2 |
| L1 | Dấu "·" giữa tên phòng: Oak trên Cream 2,49 | Đổi sang Earth Brown (4,91) | Tương phản thấp nhất toàn trang 4,53 – mục 2.2 |
| L2 | Cỡ H1/H2 điện thoại lệch bảng chữ; tên phòng dùng Lora ở cấp H3 | Ghi bảng điều chỉnh web và lý do giữ Lora (guideline p21) | Mục 3.1, 3.2 |
| L3 | "→" và "≈" vẽ bằng Arial | Mũi tên SVG; "about / khoảng 28 km"; chip mock bỏ "←", "↔" | 0 glyph dự phòng – mục 3.3, 11.1 |
| L5 | Bản VI viết 1.7 km, 3.3 km | Ô khoảng cách tách EN/VI: VI dùng dấu phẩy (1,7 km; 3,3 km…) | Mục 9 |
| Thêm | axe `label-content-name-mismatch` ở 2 link logo (có từ v1) | Bỏ `aria-label`, tên lấy từ chữ hiện; "back to top" ẩn trực quan | axe 0 lỗi – mục 4 |
| Thêm | Bản VI tràn 3 px ở 360–362 px (có từ v1) | Cột "sự thật" hero `max-content` → `auto` | Quét 196 bề rộng × ngôn ngữ: 0 tràn – mục 11.1 |

## 14. Việc chờ INV và câu hỏi mở (gom vào ESC-020 "Còn thiếu" và lượt duyệt nội dung L5 – không mở ESC mới)
1. Bảng ghép tên phòng ↔ số căn ↔ hạng; số căn mỗi hạng; xác nhận bảng ánh xạ ảnh ở mục 8.1.
2. Logo SVG gốc.
3. Email công khai trên tên miền mới.
4. Quyền dùng 45 ảnh cho website/quảng cáo (L6).
5. Giá "Monthly from …" theo hạng (L3).
6. Giờ lễ tân có mặt (brochure không ghi) – FAQ hiện chưa nêu giờ.
7. Đậu xe, thang máy, thú cưng.
8. Đồng ý đổi "chuẩn 5 sao / resort 5 sao" thành "hotel-grade" (và sửa brochure cho khớp).
9. Brochure p24 dùng ảnh Phòng 1/6.png cho hạng Premium – nhầm hay đúng?
10. Cách viết "Dalat" (tagline) và "Da Lat" (thân bài) – giữ cả hai như hiện tại?
11. Guideline v1.1: nút Earth Brown thay vì "White on Oak"; đơn vị tracking "+4/+10"; ghi rõ tên phòng/hạng phòng dùng Lora (p21 và p22 đang lệch nhau ở cấp H3) và bảng cỡ chữ riêng cho màn hình điện thoại (mục 3.1). Không cần INV quyết ngay – gửi người làm guideline khi có dịp.
12. Link trang Facebook (brochure có QR) – có đưa vào chân trang không.

## 15. Giả định
| # | Giả định | Nếu sai |
|---|---|---|
| G-1 | Ánh xạ "Phòng 1–5" ↔ hạng như mục 8.1 | Đổi ảnh giữa các thẻ hạng phòng (chạy lại script, sửa HTML) |
| G-2 | Hotline 08.4444.0909 = +84 84 444 0909 là số công khai của cơ sở, dùng cho Zalo/WhatsApp/Telegram/Viber | Sửa một chỗ cấu hình |
| G-3 | Giờ nhận/trả 14:00/12:00 theo BR-401 (brochure không ghi) | Sửa hero + FAQ |
| G-4 | "Điện nước theo công tơ, ở lâu giá tốt hơn" theo đề xuất ESC-020 L3-A | Sửa khối "A month, or longer" + FAQ |
| G-5 | Mọi căn có ban công riêng, bếp, máy giặt sấy (brochure trang 5) | Sửa câu ở mục Hạng phòng |
| G-6 | Tracking guideline tính theo % cỡ chữ | Đổi 3 giá trị `letter-spacing` |
| G-7 | Landing không cần chế độ tối | Thêm token tối (Ink nền, Ivory chữ) |
| G-8 | Khoảng cách/thời gian trong brochure còn đúng | Đo lại khi có ghim Maps |

## 16. Lịch sử
| Phiên bản | Ngày | Nội dung |
|---|---|---|
| 0.1 | 17/10/2026 | Bản đầu: tiếng Việt trước, hướng A "kem – sồi, chạm đất nung" + biến thể B, ô ảnh trống, ô Hỏi phòng trống |
| 1.0 | 17/10/2026 | Theo Brand Guidelines v1.0: bỏ terracotta và biến thể B; tiếng Anh dẫn dắt; 4 hạng phòng và nội dung e-brochure; 18 ảnh thật (WebP/AVIF); logo giữ chỗ; thanh liên hệ đáy; kiểm Playwright 320/375/1280 |
| 1.1 | 17/10/2026 | Sửa theo kiểm độc lập brand + a11y (mục 13.2): logo đạt cỡ tối thiểu, trần ảnh 960 px trên điện thoại + ngân sách DPR, dấu "·" Earth, bảng điều chỉnh cỡ chữ web, bỏ ký tự ngoài font, số thập phân VI; thêm sửa axe link logo và tràn 3 px VI 360 px; ảnh chụp mới (thêm 320 px) |

> **Cập nhật 17/10 tối (ORC):** INV xác nhận email chung `booking@ottimo.vn` và **bảng ghép thư mục ảnh → hạng phòng là chính xác** (Phòng 1, 2 → Studio Garden View; Phòng 3 → Studio City View; Phòng 4 → Signature; Phòng 5 → Premium; Mặt tiền + Sảnh). Tên miền giả định `ottimo.vn` [GIẢ ĐỊNH – INV đang mua ở Mắt Bão].
