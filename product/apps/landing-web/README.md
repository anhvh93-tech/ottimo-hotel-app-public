# landing-web – trang giới thiệu OTTIMO ở tên miền gốc (LP-v1)

App tĩnh theo **ADR-014**: Astro 7 xuất HTML sẵn cho từng ngôn ngữ, Caddy phục vụ tệp tĩnh (OPS viết site thứ 4 trong `infra/caddy/Caddyfile.prod`). Không island, không script/style nội tuyến, không tải gì từ tên miền khác. Thiết kế: UXD `product/design/landing/` **concept + mock v1.2.1** (FB-INV-002): 8 mục Hero → Why → Rooms → Amenities → Location → Book (`#book`) → FAQ → Contact; boutique stay, không nhắc số phòng; Zalo là kênh chat chính, WhatsApp/Telegram/Viber trong "Other channels".

| Đường dẫn | Nội dung |
|---|---|
| `/` | Trang chủ tiếng Anh (bản mặc định, `x-default`) |
| `/vi/` | Trang chủ tiếng Việt |
| `/404.html`, `/vi/404/index.html` | Trang 404 theo ngôn ngữ (Caddy chọn theo tiền tố `/vi/`) |
| `/robots.txt`, `/sitemap-index.xml`, `/sitemap-0.xml` | SEO (sitemap có `xhtml:link` en/vi/x-default) |
| `/og/ottimo-1200x630.jpg` | Ảnh chia sẻ link (tên cố định) |
| `/_astro/*` | CSS, JS, font, ảnh có mã băm – cache 1 năm |

Không tự chuyển trang theo ngôn ngữ trình duyệt. Trang chỉ hiện **dải gợi ý** (ẩn sẵn, `data-nosnippet`) khi ngôn ngữ ưu tiên khác ngôn ngữ trang; lựa chọn của khách lưu ở `localStorage` khóa `ottimo.lang` (ADR-014 mục 3).

## Lệnh

```
pnpm --filter @ottimo/landing-web dev          # http://localhost:5176 (không có CSP – Vite cần script nội tuyến)
pnpm --filter @ottimo/landing-web build        # dist/ – bản production (form đặt phòng tắt)
pnpm --filter @ottimo/landing-web build:booking-preview  # dist-booking-preview/ – bản duyệt có form (không deploy)
pnpm --filter @ottimo/landing-web build:booking-live-test  # dist-booking-live/ – form thật, slug dl01, chỉ cho test (không deploy)
pnpm --filter @ottimo/landing-web preview      # dist/ với header CSP thật (src/lib/security-headers.json)
pnpm --filter @ottimo/landing-web test         # dựng bản duyệt form rồi Vitest: nguồn + kiểm cả hai dist (turbo dựng dist trước)
pnpm --filter @ottimo/landing-web check:dist   # báo cáo kiểm dist dạng chữ
pnpm --filter @ottimo/landing-web typecheck    # astro check
pnpm --filter @ottimo/tests test:e2e:landing   # Playwright 320/375/768/1280 × EN/VI + form (cần cả hai bản dựng)
```

Astro 7: khi không chạy trong terminal (script, agent), `astro dev` tự chạy nền và in pid; dừng bằng `pnpm --filter @ottimo/landing-web exec astro dev stop`.

## Biến môi trường khi build

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `LANDING_SITE_URL` | `https://ottimo.vn` [GIẢ ĐỊNH – tên miền INV đang mua] | Tên miền production. Canonical, hreflang, sitemap, `og:url` luôn trỏ về đây (một bản build cho staging và production – ADR-014 1.2). Email công khai trong `site.json` phải cùng tên miền này, nếu không build dừng |
| `LANDING_INDEXABLE` | không đặt = bản xem thử | `true` chỉ khi qua cổng LP-v1 và INV đồng ý (US-146 AC4). Bản xem thử: mọi trang `noindex, nofollow`, `robots.txt` chặn hết |
| `LANDING_BOOKING_PREVIEW` | không đặt | `true` (qua `build:booking-preview`) = vẽ form đặt phòng để UXD/QA duyệt; nút gửi chỉ kiểm lỗi rồi báo **chưa gửi**. Không dùng cùng `LANDING_INDEXABLE=true` (build dừng) |
| `LANDING_BOOKING_FORM` | không đặt = **tắt** | `true` = form "Request to book" gửi thật tới endpoint công khai `public-site` của Desk (US-155, INV 24/10: bật **cùng ngày Desk production chạy**). Tắt = trang như đang chạy trên ottimo.vn (khối Zalo/gọi, không form, không trang `/privacy/`) – bản dựng giống từng byte |
| `LANDING_PROPERTY_SLUG` | – | **Bắt buộc khi** `LANDING_BOOKING_FORM=true`: `propertySlug` của API công khai (`^[a-z0-9-]{2,40}$`, BE-D/OPS cho giá trị production). Thiếu → build dừng |
| `PUBLIC_FORM_API_BASE` | trống = **cùng origin** | Theo hợp đồng (OpenAPI mục "Origin landing", SEC ARC-06): Caddy của landing proxy `/v1/public/properties/{slug}/(form-token\|booking-requests)` tới API → CSP giữ `connect-src 'self'`, không CORS. Chỉ đặt (vd. `https://desk.ottimo.vn`) khi API trả lời ở origin khác: phải là origin https, không đường dẫn; CSP `connect-src` thêm **đúng** origin đó (`scripts/headers.mjs`) và API phải cho phép origin landing (khác hợp đồng hiện tại – cần ARC/SEC duyệt) |
| `LANDING_OUT_DIR` | `dist` | Thư mục ra (bản duyệt form: `dist-booking-preview`; form thật cho test: `dist-booking-live`) |

## Nguồn dữ liệu

- `src/content/site.json` – điện thoại, Zalo, WhatsApp/Telegram/Viber, email chung, địa chỉ, ghim Google Maps, fanpage Facebook, cờ tính năng, tham số câu hứa/giờ lễ tân/cọc (`booking` – test so với chữ trên trang), tên chủ tài khoản nhận cọc (trống = câu FAQ không nêu tên). Kiểm bằng zod lúc build (`src/content/site.ts`). Đổi Zalo số hotline sang Zalo OA: chỉ sửa `contact.zaloUrl`.
- `src/content/en.ts`, `vi.ts` – chữ trên trang (kiểu `Copy` trong `types.ts`: thiếu chuỗi là lỗi typecheck).
- `src/assets/photos/` – đủ 18 ảnh UXD đã tối ưu (R3-Q52; trước đó 9 ảnh mock v1.2.1 dùng – concept 10) × 480/960/1600 × AVIF/WebP do UXD tối ưu (`design/landing/tools/optimize-images.mjs`), `manifest.json` (alt EN/VI), `CREDITS.md`. Không mã hóa lại khi build (`passthroughImageService`). Điện thoại không bao giờ nhận ảnh rộng hơn 960 px.
- `src/styles/tokens.css` – **sinh** từ nhóm màu thương hiệu của Design System (`pnpm sync:tokens`). Chỉ 7 màu Brand Guidelines + trắng; CSS của landing chỉ dùng `var(--brand-*)`.
- `src/styles/fonts.css` – **sinh** từ `@fontsource` (`pnpm sync:fonts`): Lora 400 + 400 nghiêng, Be Vietnam Pro 400/500/600; chỉ latin, latin-ext, vietnamese; woff2.
- `public/og/ottimo-1200x630.jpg` – sinh từ ảnh hero (`pnpm og`), chạy tay khi đổi ảnh hero.

## Kiểm tự động

- `src/styles/brand.test.ts` – bảng màu, không mã màu cứng/`rgb()`/màu theo tên, tokens và fonts không cũ.
- `src/content/copy.test.ts` – EN/VI đủ trường, độ dài title/description, giọng văn (không emoji, không "!"), danh sách từ cấm (FB-INV-002: không số phòng, không "apartment/căn"), số trên trang = `site.json`, dữ liệu `site.json`.
- `src/scripts/booking.test.ts` – khóa gửi theo hợp đồng, một cách liên hệ, `months` null, `children`/`infants`, UTM/refHost, câu hứa theo `promise`, transport (`minDelaySeconds`, gửi lại một lần, 503/429/404, form tắt phía server 404/422 `PUBLIC_FORM_NOT_READY` → Zalo/gọi, lỗi trường 422 chỉ `field`+`code`, `NOTICE_VERSION_INVALID` → tải lại, API khác origin).
- `src/lib/booking-request.test.ts` – mặc định tắt, cùng origin, `consentVersion` lấy từ tệp thông báo, `PUBLIC_FORM_API_BASE` chỉ nhận origin https; `scripts/headers.test.ts` – CSP chỉ thêm đúng origin API.
- `src/checks/dist.test.ts` (+ `scripts/dist-checks.mjs`) – trên `dist/`, `dist-booking-preview/` **và** `dist-booking-live/` (+ `checkFormEndpoint`: bản duyệt không gửi; form thật = `api`, có slug, có phiên bản thông báo, API cùng origin; trang thông báo xử lý dữ liệu EN/VI + link chân trang chỉ khi có form): không script/style nội tuyến, không tài nguyên khác origin, mỗi trang đúng một H1, form (tắt: không có; bật: SEC UXD-08), không link OTA, từ ngữ (FB-INV-002), hreflang 2 chiều + x-default, OG, JSON-LD `LodgingBusiness`, sitemap/robots, chỉ màu trong bảng, ngân sách byte, ảnh, ký tự nằm trong subset font.
- `product/tests/e2e/landing/` – Playwright trên `serve.mjs` (header như ADR-014 1.4): axe 0 lỗi, không cuộn ngang, CSP sạch, 0 yêu cầu ra ngoài, glyph chỉ từ Lora/Be Vietnam Pro, quy tắc ngôn ngữ, ngân sách byte theo DPR (concept 12.2), cấu trúc v1.2.1 (8 mục, thanh đáy ẩn/hiện, header Zalo ≥ 768 px, kênh khác thu gọn, không JS), luồng form trên bản duyệt.

## Ảnh đầu trang tự chạy + bộ ảnh theo hạng phòng (R3-Q52, INV 22–23/10)

- Danh sách ảnh: ảnh đầu trang ở `src/content/hero.ts` (`HERO_PICKS` = số ảnh INV chọn trong bảng 45 ảnh `rounds/round-03/outputs/UXD/landing-photo-picker.html`, `PICKER_SOURCES` = số → tệp gốc); hạng phòng ở `src/content/gallery.ts` (`ROOM_GALLERIES`, `HERO_INTERVAL_MS = 3000`). Alt EN/VI cho mọi ảnh trong `photoAlt` của `en.ts`/`vi.ts` (test chặn thiếu).
- **Đổi ảnh đầu trang** (INV gửi bộ số mới):
  1. Sửa **một dòng** `HERO_PICKS` trong `src/content/hero.ts` (thứ tự = thứ tự chạy). Ảnh đã có trên site thì xong ở đây.
  2. Số nào chưa có trên site → build dừng và in đúng lệnh cần chạy: thêm ảnh vào `PHOTOS` của `product/design/landing/tools/optimize-images.mjs` rồi `node product/design/landing/tools/optimize-images.mjs --raw <thư mục ảnh gốc> --only <id> --out product/apps/landing-web/src/assets/photos` (chỉ mã hóa ảnh đó, gộp vào `manifest.json`), thêm alt vào `photoAlt` của `en.ts` + `vi.ts`.
  3. **Chỉ ảnh ngang** (INV 25/10): ảnh có tỉ lệ < 4/3 làm build dừng (`heroPhotoForPick`). Ảnh đầu tiên của `HERO_PICKS` là ảnh LCP: `Base.astro` tự preload, dist-check và Playwright đọc id từ thẻ preload. Ảnh LCP phải ≤ 20 / 50 / 120 KB ở 480 / 960 / 1600 px AVIF (ngân sách concept 11.2); ảnh nhiều chi tiết dùng `avifQuality` riêng trong tool. Ảnh chia sẻ link (`pnpm og`) vẫn cắt từ ảnh mặt tiền `hero-facade-dusk` – không phụ thuộc ảnh đầu trang.
  - Ảnh mặt tiền đứng (số 4, id `hero-facade-dusk`, giữ tên cũ) nằm ở mục `#book` (`BOOK_PHOTO` trong `gallery.ts`), lazy.
  4. Khung ảnh đầu trang: điện thoại và máy tính bảng 3/2 (thấy trọn ảnh 3:2), máy tính (≥ 1024 px) 4/3 (UXD 24/10). Điểm lấy nét từng ảnh trên máy tính = class `hero-img--<id>` trong `landing.css` (Hero.astro tự gắn; không dùng style nội tuyến vì CSP). Ảnh mới không có rule thì nằm giữa khung, mất 5,5 % mỗi bên; ảnh **đứng** thì báo UXD đặt `object-position`. Xem bản chụp 1024/1440 trước khi phát hành.
- Đầu trang (`home/Hero.astro` + `scripts/carousel.ts`): dải scroll-snap (vuốt bằng cử chỉ gốc), 3 giây chuyển một ảnh sau sự kiện `load`, chấm chỉ báo + nút tạm dừng nhỏ trong viên Ink (WCAG 2.2.2). Dừng khi `prefers-reduced-motion` (không tự chạy, ẩn nút dừng), tab ẩn, đầu trang ra khỏi màn hình, chuột đặt trên ảnh hoặc focus bên trong. Ảnh 2+ là `display:none` tới ~0,8 s trước khi hiện (giữ ngân sách byte concept 11.2); không JS = chỉ ảnh mặt tiền. Phím ← → Home End trên dải ảnh.
- Hạng phòng (`components/RoomGallery.astro` + `scripts/lightbox.ts`): nút "n photos" phủ ảnh bìa mở `<dialog>` modal toàn màn hình nền Ink; vuốt, ← → Home End, nút trước/sau vòng lại, bộ đếm "2 / 6" (+ câu đọc cho trình đọc màn hình), chú thích = alt, Esc đóng, Tab không rời hộp, đóng xong focus về nút. Ảnh trong hộp đóng không tải.
- Chân trang: dòng pháp nhân từ `site.json` → `legal` (INV 22/10).

## "Request to book" (FB-INV-002, ESC-020 L7 = A, concept 5)

- Mặc định (`LANDING_BOOKING_FORM` không đặt, `site.json` → `features.bookingRequest` = `false`): mục `#book` hiện khối "Send your dates on Zalo" (Zalo + Gọi) – mọi nút "Request to book" (hero, header, menu, thanh đáy, "Request this room") dẫn tới đây. Bản production không có form, không có mã form, không có trang `/privacy/` (`@booking-form`, `@privacy-page` trỏ `NoBookingForm.astro` – `astro.config.ts`).
- **Bật form trên ottimo.vn (US-155 v1.0)** – khi Desk production chạy: build với `LANDING_BOOKING_FORM=true LANDING_PROPERTY_SLUG=<slug>` (+ `LANDING_INDEXABLE=true` như hiện tại), Caddy landing proxy hai đường công khai tới API (OPS), server có `privacy_notice_version` = phiên bản trong `src/content/privacy.ts` cho `vi` và `en`, rồi OWN bật `public_booking_requests_enabled` trên Desk. Thứ tự nào cũng an toàn: công tắc server còn tắt → API trả 404/422 `PUBLIC_FORM_NOT_READY` → trang báo "Online requests are paused" kèm link Zalo và số gọi (không giả thành công).
- Thông báo xử lý dữ liệu (SEC C-3 (a), Phụ lục A.4; BR-911…916): `src/content/privacy.ts` (EN dẫn, VI hỗ trợ; thời hạn lưu = biên trên của tham số SEC nên luôn đúng) → `/privacy/#booking-requests`, `/vi/privacy/#yeu-cau-dat-phong`, link ở chân trang. Phiên bản (`version`) chính là `consentVersion` form gửi – đổi chữ thì tăng phiên bản và đăng lại trên server.
- Giao diện form theo mock v1.2.1 đã dựng: `src/components/BookingForm.astro` + `src/scripts/booking-form.ts` (kiểm lỗi, tóm tắt lỗi, theo đêm/theo tháng, một cách liên hệ, sức chứa không tính trẻ dưới 6 tuổi, "Request this room" chọn sẵn hạng, trang cảm ơn đọc `promise`). Tên khóa theo `WebsiteBookingRequestInput` (OpenAPI 0.3.7 bổ sung 2): `stayType`, `arrival`, `departure` | `months` (null = "Not sure yet"), `adults`, `children` (6–11), `infants` (< 6), `roomType`, `guestName`, `preferredChannel`, `phone` | `email`, `note`, `website` (bẫy) – kiểu lấy từ `packages/api-client/src/generated/openapi.ts`.
- Gửi đi: `src/scripts/booking-transport.ts` – bản duyệt dùng `previewTransport` (không gửi gì); form thật dùng `apiTransport` theo hợp đồng (lấy form token khi khách chạm form – token 404 thì báo ngay "đang tạm dừng"; chờ `minDelaySeconds` theo đồng hồ trình duyệt, POST JSON + `Idempotency-Key`, `FORM_TOKEN_INVALID` → lấy token mới, chờ lại, gửi lại một lần; 404/`PUBLIC_FORM_NOT_READY` → Zalo/gọi; 503 → bận; 429 → thử lại sau; 422 lỗi trường → hiện tại ô như kiểm ở trang). Bật form mà thiếu slug/phiên bản thông báo thì build dừng (`src/lib/booking-request.ts`, `BookingRequestSlot.astro`).
- Kiểm dist khi form được vẽ: `<form hidden>` không `action` (SEC UXD-08), có ô bẫy `website` (`tabindex=-1`, `autocomplete=off`), ô đồng ý không tích sẵn, không ô tệp; `fetch` chỉ cùng origin (hoặc đúng origin `PUBLIC_FORM_API_BASE`).
- E2E form thật: `product/tests/e2e/landing/form-live.landing.spec.ts` (server thứ ba, cổng 5188, `dist-booking-live/`) – API công khai trả lời bằng `page.route` trên chính origin landing (đúng như proxy production), CSP thật.
