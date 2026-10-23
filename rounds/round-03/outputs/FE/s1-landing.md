# FE-LP – Landing lên mạng sớm: R3-Q52 + câu chữ phương án A (Round 3, Sản xuất)

- Người làm: FE-LP | Ngày: 23/10/2026 | Căn cứ: decision-log 23/10 "INV – landing lên mạng sớm", INV 22/10 (Premium giường phụ 1m4, pháp nhân), `round-02/outputs/PO/landing-inv-questions.md` Q1–Q4, backlog R3-Q52.
- App: `product/apps/landing-web` (Astro, ADR-014). Bản production: `pnpm --filter @ottimo/landing-web build` → `product/apps/landing-web/dist/` (không đặt `LANDING_INDEXABLE` = mọi trang `noindex, nofollow`, `robots.txt` chặn hết), không form, CTA Zalo/gọi điện.
- Thương hiệu: chỉ 7 màu Brand Guidelines (`var(--brand-*)`, kiểm `brandColors` xanh), Lora tiêu đề, Be Vietnam Pro nội dung, không emoji, tiếng Anh dẫn – tiếng Việt hỗ trợ.

## 1. R3-Q52 – ảnh đầu trang tự chạy

| Yêu cầu | Cách làm |
|---|---|
| Tự chuyển mỗi 3 giây | `HERO_INTERVAL_MS = 3000` (`src/content/gallery.ts`), bắt đầu sau sự kiện `load`. 5 ảnh: mặt tiền (LCP, giữ preload), sảnh, Signature bàn ăn, ban công hướng vườn, Premium phòng khách |
| Vuốt trên điện thoại | Dải `scroll-snap` (cử chỉ gốc của trình duyệt, không thư viện) |
| Điều khiển tinh tế | Viên nhỏ nền Ink trên ảnh: chấm chỉ báo (chấm hiện tại kéo dài) + nút tạm dừng 12 px. Nút dừng giữ vì WCAG 2.2.2 (nội dung tự chuyển > 5 giây phải dừng được) |
| Dừng khi `prefers-reduced-motion` | Không tự chạy, ẩn nút dừng; vẫn vuốt/chấm được, chuyển tức thì |
| Dừng khi tab ẩn | `visibilitychange`; thêm: đầu trang ra khỏi màn hình, chuột đặt trên ảnh, focus bên trong |
| Không script nội tuyến | Mã trong `src/scripts/carousel.ts`, gộp vào module duy nhất của trang; CSP sạch (E2E) |
| Ngân sách byte | Ảnh 2+ là `display:none` tới ~0,8 s trước lượt chuyển → lượt mở trang không tải thêm ảnh. Không JS: chỉ ảnh mặt tiền |
| Vòng lại | Ảnh cuối → ảnh đầu bằng mờ dần ngắn, không tua ngược qua mọi ảnh |

## 2. R3-Q52 – bộ ảnh theo hạng phòng (kiểu OTA)

- Ảnh bìa mỗi hạng có nút phủ cả ảnh, chip góc phải "6 photos / 6 ảnh". Mở `<dialog>` modal toàn màn hình nền Ink (`src/components/RoomGallery.astro`, `src/scripts/lightbox.ts`).
- Vuốt (scroll-snap), phím ← → Home End, nút trước/sau (vòng lại), bộ đếm "2 / 6" + câu đọc "Photo 2 of 6 / Ảnh 2 trên 6" (`aria-live`), chú thích dưới ảnh = alt, Esc đóng, Tab/Shift+Tab không rời hộp (modal gốc + bẫy focus), đóng xong focus về nút, khóa cuộn trang nền.
- Ảnh trong hộp chưa mở không tải; khi mở, ảnh hiện tại và hai ảnh kề được tải trước.
- Chép đủ 18 ảnh UXD đã tối ưu vào `src/assets/photos/` (trước chỉ dùng 9); alt EN/VI cho cả 18 trong `photoAlt` (alt VI tự viết lại cho `detail-laundry-desk` vì manifest có chữ "căn").

### Ảnh còn thiếu – cần INV gửi (mục tiêu ≥ 6 ảnh/hạng như OTA)

| Hạng | Đang có | Cần thêm |
|---|---|---|
| Standard Studio · City View | 3 (phòng khách-bếp, giường, sofa nhìn phố) | Phòng tắm, bếp cận, ban công/cửa sổ nhìn phố ban đêm |
| Standard Studio · Garden View | 6 (đủ) | Phòng tắm (nên có) |
| Premium · One Bedroom + 1 | 3 (bếp, phòng ngủ, phòng khách) | **Giường phụ 1m4**, phòng tắm, ban công/hướng vườn |
| Signature · Two Bedrooms | 3 (bàn ăn, một phòng ngủ, phòng tắm) | Phòng ngủ thứ hai, ban công hoàng hôn, bếp |

Ảnh mới: UXD chạy `product/design/landing/tools/optimize-images.mjs` + kiểm SEC (không người, không số căn, không cận khóa), FE thêm id vào `ROOM_GALLERIES` + alt – không đổi giao diện. Quyền dùng ảnh vẫn chờ INV (ESC-020 L6, CREDITS.md).

## 3. Câu chữ phương án A (Q1–Q4) và thông tin INV 22/10

| Mục | Trạng thái trên trang |
|---|---|
| Q1 fanpage → website | Không cần mã. Link để INV gắn vào nút "Book now" fanpage: `https://ottimo.vn/?utm_source=facebook&utm_medium=social&utm_campaign=fanpage#book` (mở mục Đặt phòng – khối Zalo/Gọi khi chưa có form) |
| Q2 câu hứa | "Within 1 hour (07:00–22:00, Da Lat time); outside these hours, before 09:00 the next morning" / VI tương ứng – số đọc từ `site.json` `booking`, test so khớp |
| Q3 cọc 30% | "pay a 30% deposit by QR transfer" / "chuyển cọc 30% qua mã QR" – từ `depositPercent` |
| 4a định vị | Giữ như mock v1.2.1 |
| 4b không "hotel/luxury/sao" | Danh sách cấm trong kiểm dist + copy.test |
| 4c → thay bằng INV 22/10 | Premium: "a 1.4 m extra bed for one more guest" / "giường phụ 1,4 m cho thêm một người"; ghi chú sức chứa nêu sofa hoặc giường phụ ở Premium. Bỏ "extra bed" khỏi danh sách cấm, test giữ cụm này chỉ ở Premium + ghi chú. Không nêu số phòng 302/402 |
| 4d tên chủ tài khoản | `paymentReceivingAccountHolder = ""` → câu FAQ chỉ còn "We never change bank details by message"; điền tên trong `site.json` là câu tự đầy đủ, không sửa mã |
| 4e Messenger | Giữ câu "Our Facebook page is for news…" |
| 4f e-brochure | Không có link tải |
| Pháp nhân | Chân trang: "Operated by / Đơn vị vận hành CÔNG TY CỔ PHẦN UTMG LIVING · Tax code / MST 5801551657 · 28 Triệu Việt Vương, P. Xuân Hương – Đà Lạt, Lâm Đồng" (`site.json` → `legal`, schema kiểm MST 10 số) |
| Email | Chỉ hộp thư chung `info@ottimo.vn` (schema chặn email ngoài tên miền OTTIMO); không email cá nhân |
| Form | Tắt (`features.bookingRequest = false`), bản production không có `form/input` (TC-LP-004) |

## 4. Kiểm thử

| Lệnh | Kết quả |
|---|---|
| `pnpm --filter @ottimo/landing-web test` | 162/162 xanh (+20: copy R3-Q52, giường phụ, pháp nhân, `carousel.test.ts`) |
| `pnpm --filter @ottimo/landing-web typecheck` | 0 lỗi, 0 cảnh báo |
| `pnpm --filter @ottimo/landing-web check:dist` | 11/11 ok (inline, bên thứ ba, H1, form, từ ngữ, SEO, robots, màu, ngân sách, ảnh, glyph) |
| `pnpm --filter @ottimo/tests test:e2e:landing` | 47 ca, chạy `--repeat-each=2` = 94/94 xanh; ca mới TC-LP-019 (6 ca slideshow) + TC-LP-020 (EN/VI × 375/1280: mở, phím, nút, bẫy focus, Esc, axe 0 khi hộp mở, CSP, 0 yêu cầu ngoài) |
| eslint + prettier (landing + e2e) | Sạch |

Ngân sách TC-LP-009 (KB, mở trang / cuộn hết – giới hạn trong ngoặc): điện thoại EN DPR1 201,4/233,3 (250/350); DPR2 312,9/418,9 (320/600); VI DPR2 342,3/448,4 (390/670); máy tính DPR1 300,9/332,8 (400/600); DPR2 508,6/614,7 (700/1100). Tăng ~6 KB (HTML/JS/CSS). **Lưu ý**: điện thoại EN DPR2 còn 7 KB dư so với 320 KB – thêm nội dung đầu trang cần đo lại.

Không JS: trình duyệt bỏ qua `loading="lazy"` nên tải mọi ảnh (như trước R3-Q52); chỉ kiểm hiển thị (ảnh mặt tiền, không nút).

## 5. Ảnh chụp màn hình (`rounds/round-03/outputs/FE/s1-landing-shots/`, DPR 2)

- Đầu trang 375: `hero-375-en-slide1.jpg`, `hero-375-en-slide2.jpg`; 1280: `hero-1280-en-slide1.jpg`, `hero-1280-en-slide2.jpg`
- Bộ ảnh 375: `gallery-375-en-2.jpg`, `gallery-375-vi-1.jpg`; 1280: `gallery-1280-en-1.jpg`, `gallery-1280-vi-1.jpg`
- Thẻ hạng phòng có chip "n ảnh": `rooms-375-vi.jpg`, `rooms-1280-en.jpg`; chân trang pháp nhân: `footer-375-en.jpg`

## 6. Giả định và việc cho vai khác

- [GIẢ ĐỊNH] Khách thứ thêm ở Premium ngủ giường phụ 1m4 (thay sofa); sức chứa Premium giữ 3–4 (BR-110). DOM/PO xác nhận nếu giường 1m4 cho phép 2 người.
- [GIẢ ĐỊNH] Hộp thư `info@ottimo.vn` tồn tại trên Google Workspace khi trang lên mạng. Nếu chưa: đặt `contact.email = ""` trong `site.json` (mọi link email tự ẩn) – INV kiểm khi duyệt bản xem trước.
- [GIẢ ĐỊNH] Thứ tự 5 ảnh đầu trang do FE chọn (chưa có hi-fi UXD cho R3-Q52); UXD review chéo.
- Không thiết kế UXD hi-fi R3-Q52 trong repo – FE dựng theo mock v1.2.1 và brand; mời UXD review (chấm/viên điều khiển, hộp ảnh).
- OPS: đưa `product/apps/landing-web/dist/` lên địa chỉ xem trước (Caddy site thứ 4, header ADR-014 1.4); không đặt `LANDING_INDEXABLE`.
- SEC: review `lightbox.ts`/`carousel.ts` (không `innerHTML`, chỉ `textContent`; không tài nguyên ngoài).
- Không ESC mới.
