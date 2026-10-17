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
| `LANDING_OUT_DIR` | `dist` | Thư mục ra (bản duyệt form: `dist-booking-preview`) |

## Nguồn dữ liệu

- `src/content/site.json` – điện thoại, Zalo, WhatsApp/Telegram/Viber, email chung, địa chỉ, ghim Google Maps, fanpage Facebook, cờ tính năng, tham số câu hứa/giờ lễ tân/cọc (`booking` – test so với chữ trên trang), tên chủ tài khoản nhận cọc (trống = câu FAQ không nêu tên). Kiểm bằng zod lúc build (`src/content/site.ts`). Đổi Zalo số hotline sang Zalo OA: chỉ sửa `contact.zaloUrl`.
- `src/content/en.ts`, `vi.ts` – chữ trên trang (kiểu `Copy` trong `types.ts`: thiếu chuỗi là lỗi typecheck).
- `src/assets/photos/` – 9 ảnh mock v1.2.1 dùng (concept 10) × 480/960/1600 × AVIF/WebP do UXD tối ưu (`design/landing/tools/optimize-images.mjs`), `manifest.json` (alt EN/VI), `CREDITS.md`. Không mã hóa lại khi build (`passthroughImageService`). Điện thoại không bao giờ nhận ảnh rộng hơn 960 px.
- `src/styles/tokens.css` – **sinh** từ nhóm màu thương hiệu của Design System (`pnpm sync:tokens`). Chỉ 7 màu Brand Guidelines + trắng; CSS của landing chỉ dùng `var(--brand-*)`.
- `src/styles/fonts.css` – **sinh** từ `@fontsource` (`pnpm sync:fonts`): Lora 400 + 400 nghiêng, Be Vietnam Pro 400/500/600; chỉ latin, latin-ext, vietnamese; woff2.
- `public/og/ottimo-1200x630.jpg` – sinh từ ảnh hero (`pnpm og`), chạy tay khi đổi ảnh hero.

## Kiểm tự động

- `src/styles/brand.test.ts` – bảng màu, không mã màu cứng/`rgb()`/màu theo tên, tokens và fonts không cũ.
- `src/content/copy.test.ts` – EN/VI đủ trường, độ dài title/description, giọng văn (không emoji, không "!"), danh sách từ cấm (FB-INV-002: không số phòng, không "apartment/căn"), số trên trang = `site.json`, dữ liệu `site.json`.
- `src/scripts/booking.test.ts` – khóa gửi theo hợp đồng, một cách liên hệ, `months` null, `children`/`infants`, UTM/refHost, câu hứa theo `promise`, transport (`minDelaySeconds`, gửi lại một lần, 503/429/404).
- `src/checks/dist.test.ts` (+ `scripts/dist-checks.mjs`) – trên `dist/` **và** `dist-booking-preview/`: không script/style nội tuyến, không tài nguyên khác origin, mỗi trang đúng một H1, form (tắt: không có; bật: SEC UXD-08), không link OTA, từ ngữ (FB-INV-002), hreflang 2 chiều + x-default, OG, JSON-LD `LodgingBusiness`, sitemap/robots, chỉ màu trong bảng, ngân sách byte, ảnh, ký tự nằm trong subset font.
- `product/tests/e2e/landing/` – Playwright trên `serve.mjs` (header như ADR-014 1.4): axe 0 lỗi, không cuộn ngang, CSP sạch, 0 yêu cầu ra ngoài, glyph chỉ từ Lora/Be Vietnam Pro, quy tắc ngôn ngữ, ngân sách byte theo DPR (concept 12.2), cấu trúc v1.2.1 (8 mục, thanh đáy ẩn/hiện, header Zalo ≥ 768 px, kênh khác thu gọn, không JS), luồng form trên bản duyệt.

## "Request to book" (FB-INV-002, ESC-020 L7 = A, concept 5)

- `site.json` → `features.bookingRequest` **đang `false`**: mục `#book` hiện khối "Send your dates on Zalo" (Zalo + Gọi) – mọi nút "Request to book" (hero, header, menu, thanh đáy, "Request this room") dẫn tới đây. Bản production không có form, không có mã form (`@booking-form` trỏ `NoBookingForm.astro` – `astro.config.ts`).
- Giao diện form theo mock v1.2.1 đã dựng: `src/components/BookingForm.astro` + `src/scripts/booking-form.ts` (kiểm lỗi, tóm tắt lỗi, theo đêm/theo tháng, một cách liên hệ, sức chứa không tính trẻ dưới 6 tuổi, "Request this room" chọn sẵn hạng, trang cảm ơn đọc `promise`). Tên khóa theo `WebsiteBookingRequestInput` (OpenAPI 0.3.7 bổ sung 2): `stayType`, `arrival`, `departure` | `months` (null = "Not sure yet"), `adults`, `children` (6–11), `infants` (< 6), `roomType`, `guestName`, `preferredChannel`, `phone` | `email`, `note`, `website` (bẫy) – kiểu lấy từ `packages/api-client/src/generated/openapi.ts`.
- Gửi đi: `src/scripts/booking-transport.ts` – bản duyệt dùng `previewTransport` (không gửi gì); `apiTransport` theo hợp đồng (lấy form token khi khách chạm form, chờ `minDelaySeconds` theo đồng hồ trình duyệt, POST JSON + `Idempotency-Key`, `FORM_TOKEN_INVALID` → lấy token mới, chờ lại, gửi lại một lần) đã có test nhưng **chưa nối**: chờ endpoint của BE-D, `PUBLIC_PROPERTY_SLUG`, `PRIVACY_NOTICE_VERSION` và trang `/privacy/` (`src/lib/booking-request.ts`). Bật cờ trước khi có transport thì build dừng (`BookingRequestSlot.astro`).
- Kiểm dist khi form được vẽ: `<form hidden>` không `action` (SEC UXD-08), có ô bẫy `website` (`tabindex=-1`, `autocomplete=off`), ô đồng ý không tích sẵn, không ô tệp; `fetch` chỉ cùng origin.
