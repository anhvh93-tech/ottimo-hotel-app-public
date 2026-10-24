# FE-LP – Landing đợt 2: câu chữ concept B + ảnh đầu trang (Round 3 – Sản xuất)

- Người làm: FE-LP | Ngày: 24/10/2026 | Nhánh: `worktree-agent-acd94dae90abbce64`
- Căn cứ: `rounds/round-03/outputs/CPY/landing-copy-review.md` (bản chốt concept B), `concept.md` mục 7.2, decision-log 24/10 "INV – câu chữ landing (CPY review)", FB-INV-003 ý 2, tin ORC 24/10: **INV chốt ảnh 4, 32, 9, 37, 16, 33** (ảnh 33 thay ảnh 2 – sảnh).
- Không push, không tag, không deploy. Form đặt phòng vẫn sau cờ `LANDING_BOOKING_FORM` (mặc định tắt). `site.json` không đổi.

## 1. Ảnh đầu trang – bảng số ảnh → tệp

Số ảnh = số trong `rounds/round-03/outputs/UXD/landing-photo-picker.html`. FE-LP giải mã 45 ảnh base64 trong bảng, so từng ảnh với cả 45 tệp gốc trên ảnh thu nhỏ 24 × 24 xám: mỗi ảnh khớp đúng một tệp (sai lệch 1,5–6,4 so với ≥ 37 ở tệp gần thứ hai).

| Thứ tự | Số ảnh | Tệp gốc (`00-brief/context/landing/raw/`) | id trên site (`src/assets/photos/`) | Mới? | AVIF 960 px |
|---|---|---|---|---|---|
| 1 (LCP) | **4** | `mat-tien-sanh/03.png` | `hero-facade-dusk` (giữ id, thay tệp; trước là ảnh 5 `04.1.png`) | Thay tệp | 38,4 KB (q42) |
| 2 | **32** | `phong-4/3.png` | `signature-dining` | Có sẵn | 20,0 KB |
| 3 | **9** | `phong-1/3.png` | `detail-kitchen` | Có sẵn | 18,9 KB |
| 4 | **37** | `phong-4/8.png` | `signature-bedroom-desk` | Mới | 20,1 KB |
| 5 | **16** | `phong-2/03.png` | `garden-navy-kitchen` | Mới | 21,4 KB |
| 6 | **33** | `phong-4/4.png` | `signature-living-oak` | Mới | 20,3 KB |

- Không dùng 13, 42, 6, 19, 38 (test `HERO_EXCLUDED` chặn). Ảnh 2 (sảnh, `lobby`) và 42 (`premium-living` – vẫn ở thư viện Premium), 13 (`garden-balcony` – vẫn ở thư viện Garden) rời đầu trang.
- Bảng đủ 45 số → tệp nằm ở `PICKER_SOURCES` trong `product/apps/landing-web/src/content/hero.ts`.

**INV gửi bộ số khác:** sửa đúng một dòng `HERO_PICKS = [4, 32, 9, 37, 16, 33]` trong `src/content/hero.ts`.
- Số đã có trên site (2, 4, 6, 7, 9, 13, 15, 16, 18, 19, 22, 25, 27, 32, 33, 34, 35, 37, 40, 42, 43): xong.
- Số chưa có: build dừng và in lệnh cần chạy (thêm vào `PHOTOS` của `optimize-images.mjs`, chạy `--only <id> --out …/src/assets/photos`, thêm alt EN + VI). Khoảng 10 phút/ảnh.
- Đổi ảnh số 1: đổi `src` của `hero-facade-dusk` trong tool, chạy `--only hero-facade-dusk`, `pnpm og`. Quy trình ghi ở README landing mục "Đổi ảnh đầu trang".

### Alt mới (`photoAlt` + `manifest.json`, R3-Q52)

| id | EN | VI |
|---|---|---|
| `signature-bedroom-desk` (37) | Bedroom with a white bed on an oak platform, a wardrobe and a desk by the window | Phòng ngủ với giường trắng trên bệ gỗ, tủ áo và bàn làm việc cạnh cửa sổ |
| `garden-navy-kitchen` (16) | Long navy kitchen open to a sofa corner by tall glass doors | Bếp navy dài liền góc sofa bên cửa kính lớn |
| `signature-living-oak` (33) | Living room with an oak shelf wall, a TV and a cream sofa by the window | Phòng khách với vách kệ gỗ sồi, TV và sofa màu kem cạnh cửa sổ |
| `hero-facade-dusk` (4) | Giữ: OTTIMO at dusk, with warm lights on every balcony | Giữ: OTTIMO lúc chạng vạng, ban công sáng đèn ấm |

- Alt chỉ tả phần còn thấy trong khung 4/5 trên máy tính (máy giặt sấy ở ảnh 37 và tủ lạnh ở ảnh 33 bị cắt nên không nhắc). Không có "căn", "apartment", số phòng.
- Kiểm ảnh theo checklist SEC (FE-LP xem trên ảnh): không người, không cận khóa/bàn phím, không số phòng; TV ảnh 33 chỉ hiện logo OTTIMO; ảnh 4 có biển OTTIMO ở cổng. **SEC/UXD xác nhận lại.**

### Ảnh chia sẻ (OG)
- `public/og/ottimo-1200x630.jpg` sinh lại từ ảnh 4 (`pnpm og`). `meta.ogImageAlt` vẫn đúng.

## 2. Câu chữ concept B

- Áp toàn bộ bản chốt CPY vào `en.ts`, `vi.ts`, `booking-strings.ts` theo từng khóa ở mục 1–10 và 8.2 của bản chốt. Khóa "Giữ" ở mục 13 không đụng.
- Tên hạng: City Studio · Garden Studio · Premium One-Bedroom · Signature Two-Bedroom (VI: Studio hướng phố · Studio hướng vườn · Premium một phòng ngủ · Signature hai phòng ngủ). Slug không đổi, Desk không đổi.
- Hai khóa **mới**: `why.more` "See the rooms / Xem các phòng" (link chữ → `#rooms`, cuối mục The Stay) và `location.ask` "Ask us about your dates / Hỏi chúng tôi về ngày ở" (link chữ → `#book`, sau bảng thời gian đi xe). Dùng kiểu `.link` + mũi tên có sẵn; trên nền Ink chữ Ivory. Vẫn một nút đặc mỗi màn hình.
- Comment mã còn ghi "Request to book" / "Why OTTIMO" đã sửa (CPY 12.3). Tên khóa `requestToBook` giữ để ít đổi mã.

## 3. Sửa lỗi phát hiện khi làm

- **Thẻ Premium in nguyên "[[1.4 m]]" ra trang** (EN và VI, có từ 22/10, đang chạy trên ottimo.vn). `Rooms.astro` in `room.desc` thô, không qua `<Rich>`. Sửa: mô tả phòng và thân thẻ The Stay render qua `<Rich>`. Thêm luật dist-check: chữ hiển thị có `[[` hoặc `]]` là lỗi.

## 4. Test – đã sửa cho khớp câu mới (không nới kiểm tra)

| File | Đổi |
|---|---|
| `src/content/copy.test.ts` | Nhãn nút = "Plan your stay" / "Chọn ngày ở"; Premium: bỏ kiểm `rooms.note` có "Premium", **thêm** `roomHint` EN có "1.4 m extra bed", VI có "giường phụ 1,4 m"; **thêm** tên hạng EN/VI đúng quyết định INV; **thêm** VI không có "OTTIMO" ở `book.intro`, `book.chat.text`, `contact.title/intro` và có "OTTIMO" ở bước cọc + câu chống giả danh; **thêm** chuỗi form chạy trên danh sách cấm + không "hotel/khách sạn"; **thêm** ảnh đầu trang theo số (45 số, 45 tệp khác nhau, không dùng số bị loại, mọi ảnh manifest truy được về một số) |
| `scripts/dist-checks.mjs` | `BANNED` thêm 10 mẫu theo CPY 12.2; đếm "hotel/khách sạn" ở thân trang hạ từ ≤ 3 về **0**; chặn `[[…]]` lọt ra chữ |
| `src/checks/dist-checks.test.ts` | Ca vi phạm mới cho các luật trên (1 lần "khách sạn" là lỗi) |
| `src/checks/dist.test.ts` | Đổi tên ca "hotel only as comparison" → "no hotel wording, no fees on the page" |
| `src/scripts/booking.test.ts` | Câu VI "Chúng tôi sẽ trả lời bạn trước 09:00" |
| `tests/e2e/landing/form.landing.spec.ts` | Câu gợi ý sức chứa mới |
| `tests/e2e/landing/sections.landing.spec.ts` | **Thêm**: có đúng 1 link `#location → #book` và 1 link `#why → #rooms`; số link tới `#book` ≥ 9 |
| `tests/e2e/landing/gallery.landing.spec.ts` | Số ảnh đầu trang 5 → 6 (hằng `SLIDES`, kiểm cả tổng số slide) |

## 5. Kết quả kiểm

| Kiểm | Kết quả |
|---|---|
| `astro check` (typecheck) | 0 lỗi, 0 cảnh báo (64 tệp) |
| ESLint `apps/landing-web` + `tests/e2e/landing`; `tsc` gói tests | Sạch |
| Prettier | Sạch |
| `build` (dist mặc định), `build:booking-preview`, `build:booking-live-test` | Đạt |
| Vitest landing (nguồn + 3 bản dist: CSP/không script nội tuyến, từ ngữ, SEO, màu thương hiệu, ngân sách byte, ảnh) | 203/203 |
| Playwright landing (axe 0 lỗi, CSP sạch, không yêu cầu ra ngoài, không cuộn ngang 320–1280, ngân sách, form duyệt + form thật) | 54/54 |

Ngân sách byte (Playwright, KB = 1024 B):

| Trường hợp | Hero (giới hạn) | Mở trang (giới hạn) | Cuộn hết (giới hạn) |
|---|---|---|---|
| Điện thoại EN DPR1 | 12,9 (20) | 198,4 (250) | 230,3 (350) |
| Điện thoại EN DPR2/3 | 38,4 (50) | 303,4 (320/400) | 409,5 (600/700) |
| Điện thoại VI DPR2/3 | 38,4 (50) | 332,9 (390/470) | 439 (670/770) |
| Máy tính EN DPR1 | 38,4 (50) | 291,5 (400) | 323,4 (600) |
| Máy tính EN DPR2 | 99 (120) | 492,1 (700) | 598,2 (1100) |

- Ảnh 4 ở AVIF q50 nặng 58 KB (960 px) – vượt ngân sách hero 50 KB. FE-LP **không nới ngân sách**: mã hóa riêng ảnh này ở q42 (tool có `avifQuality` từng ảnh), không thấy khác biệt ở cỡ hiển thị.

## 6. Ảnh chụp bản build

`rounds/round-03/outputs/FE/landing-b-shots/` – 42 ảnh, bản production (form tắt), header CSP thật, `prefers-reduced-motion` để ảnh đứng yên:
- `hero-1440-en-slide1…6.jpg`, `hero-390-en-slide1…6.jpg`: đủ 6 ảnh đầu trang theo thứ tự, máy tính 1440 và điện thoại 390;
- `hero-1440-vi-slide1.jpg`, `hero-390-vi-slide1.jpg`: đầu trang VI;
- `<mục>-<1440|390>-<en|vi>.jpg` cho why, rooms, amenities, location, book, faq, contact. Header dính và thanh đáy được tắt khi chụp từng mục để không đè lên mục (chỉ trong lúc chụp).

## 7. Cần UXD/CPY xem (câu vượt khung, bố cục)

1. **"Nghệ thuật lưu trú an yên."** (VI `why.title`) xuống dòng còn một chữ "yên." ở 390 px (`why-390-vi.jpg`). Đề xuất: CPY/UXD cho phép bọc `[[an yên]]` không ngắt (FE thêm render `<Rich>` cho tiêu đề), hoặc chấp nhận.
2. **Ảnh ngang trong khung 4/5 trên máy tính** cắt mất hai bên: ảnh 37 mất máy giặt sấy ngoài cửa, ảnh 33 mất tủ lạnh, ảnh 16 mất góc sofa trái (`hero-1440-en-slide4…6.jpg`). Ý "công năng" của INV yếu đi ở bản máy tính. UXD cân nhắc: khung 3/2 cho slide 2+, hoặc `object-position` riêng từng ảnh. FE chưa đổi (thiết kế thuộc UXD).
3. **Ảnh 9 (`detail-kitchen`) xuất hiện hai lần trên trang**: slide 3 đầu trang và ảnh mục Tiện nghi. UXD chọn ảnh khác cho Tiện nghi nếu muốn tránh lặp.
4. Độ dài tăng (CPY 14 đã báo): hero lead, thẻ phòng Garden/Premium/Signature, `why.long.body`. Đã kiểm 320/375/390/768/1280/1440: không tràn, không cuộn ngang; thẻ phòng 1440 EN chênh chiều cao nhẹ (Garden 3 dòng, City 2 dòng) – không vỡ khung. Chưa cần bản ngắn của CPY.
5. Alt `lobby` vẫn nói "a coffee counter" (giữ theo CPY 13). Ảnh này không còn ở đầu trang và hiện không dùng ở đâu trên trang; nếu dùng lại, CPY xem vì DOM không hứa quầy cà phê.

## 8. Giả định

- Thứ tự và bộ ảnh theo tin ORC 24/10 (INV chốt 4, 32, 9, 37, 16, 33) thay cho đề xuất CPY 7.2 (ảnh 2 ở slide 6).
- Alt cho 3 ảnh mới do FE-LP viết theo giọng brand; UXD giữ quyền a11y, CPY đọc lại.
- `product/design/landing/mock/img/` (mock UXD v1.2.1) không cập nhật – chỉ landing app dùng ảnh mới.
- `manifest.json` trường `type`/`use` (nội bộ, không hiển thị) giữ tên hạng cũ cho ảnh cũ.
- Thư viện ảnh hạng phòng chưa đổi (Signature 3 ảnh, Premium 3, City 3 < mục tiêu 6). Có thể thêm ảnh 37, 33 vào thư viện Signature và ảnh 16 vào Garden nếu INV/UXD đồng ý.

## 9. File tạo/sửa

- Mã: `product/apps/landing-web/src/content/{en,vi,types,gallery,hero(mới),copy.test}.ts`, `src/scripts/{booking-strings,booking.test,booking-form}.ts`, `src/components/home/{Why,Location,Rooms,Hero,Book}.astro`, `src/components/{Header,StickyBar}.astro`, `src/styles/landing.css`, `scripts/dist-checks.mjs`, `src/checks/{dist,dist-checks}.test.ts`, `README.md`.
- Ảnh: `src/assets/photos/hero-facade-dusk-*.{avif,webp}` (thay), `signature-bedroom-desk-*`, `garden-navy-kitchen-*`, `signature-living-oak-*` (mới, 3 cỡ × 2 định dạng), `manifest.json`, `CREDITS.md`, `public/og/ottimo-1200x630.jpg`.
- Công cụ: `product/design/landing/tools/optimize-images.mjs` (`--only`, `--out`, `avifQuality`, 3 ảnh mới, hero → `03.png`).
- Test E2E: `product/tests/e2e/landing/{form,sections,gallery}.landing.spec.ts`.
- Tài liệu: `01-decisions/decision-log.md` (1 dòng FE-LP), báo cáo này, `landing-b-shots/`.
