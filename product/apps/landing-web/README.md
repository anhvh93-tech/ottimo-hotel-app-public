# landing-web – trang giới thiệu OTTIMO ở tên miền gốc (LP-v1)

App tĩnh theo **ADR-014**: Astro xuất HTML sẵn cho từng ngôn ngữ, Caddy phục vụ tệp tĩnh (OPS viết site thứ 4 trong `infra/caddy/Caddyfile.prod`). Không island, không script/style nội tuyến, không tải gì từ tên miền khác. Thiết kế: UXD `product/design/landing/` (mock v1.1 – bản hi-fi đang dựng; v1.2 theo FB-INV-002 sẽ thay nội dung và bố cục).

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
pnpm --filter @ottimo/landing-web build        # dist/
pnpm --filter @ottimo/landing-web preview      # dist/ với header CSP thật (src/lib/security-headers.json)
pnpm --filter @ottimo/landing-web test         # Vitest: nguồn + kiểm dist (chạy build trước; turbo tự làm)
pnpm --filter @ottimo/landing-web check:dist   # báo cáo kiểm dist dạng chữ
pnpm --filter @ottimo/landing-web typecheck    # astro check
pnpm --filter @ottimo/tests test:e2e:landing   # Playwright 320/375/1280 × EN/VI (cần build trước)
```

Astro 7: khi không chạy trong terminal (script, agent), `astro dev` tự chạy nền và in pid; dừng bằng `pnpm --filter @ottimo/landing-web exec astro dev stop`.

## Biến môi trường khi build

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `LANDING_SITE_URL` | `https://ottimo.vn` [GIẢ ĐỊNH – tên miền INV đang mua] | Tên miền production. Canonical, hreflang, sitemap, `og:url` luôn trỏ về đây (một bản build cho staging và production – ADR-014 1.2). Email công khai trong `site.json` phải cùng tên miền này, nếu không build dừng |
| `LANDING_INDEXABLE` | không đặt = bản xem thử | `true` chỉ khi qua cổng LP-v1 và INV đồng ý (US-146 AC4). Bản xem thử: mọi trang `noindex, nofollow`, `robots.txt` chặn hết |

## Nguồn dữ liệu

- `src/content/site.json` – điện thoại, Zalo, WhatsApp/Telegram/Viber, email chung, địa chỉ, ghim Google Maps, fanpage Facebook, cờ tính năng. Kiểm bằng zod lúc build (`src/content/site.ts`). Đổi Zalo số hotline sang Zalo OA: chỉ sửa `contact.zaloUrl`.
- `src/content/en.ts`, `vi.ts` – chữ trên trang (kiểu `Copy` trong `types.ts`: thiếu chuỗi là lỗi typecheck).
- `src/assets/photos/` – 18 ảnh × 480/960/1600 × AVIF/WebP do UXD tối ưu (`design/landing/tools/optimize-images.mjs`), `manifest.json` (alt EN/VI), `CREDITS.md`. Không mã hóa lại khi build (`passthroughImageService`). Điện thoại không bao giờ nhận ảnh rộng hơn 960 px.
- `src/styles/tokens.css` – **sinh** từ nhóm màu thương hiệu của Design System (`pnpm sync:tokens`). Chỉ 7 màu Brand Guidelines + trắng; CSS của landing chỉ dùng `var(--brand-*)`.
- `src/styles/fonts.css` – **sinh** từ `@fontsource` (`pnpm sync:fonts`): Lora 400 + 400 nghiêng, Be Vietnam Pro 400/500/600; chỉ latin, latin-ext, vietnamese; woff2.
- `public/og/ottimo-1200x630.jpg` – sinh từ ảnh hero (`pnpm og`), chạy tay khi đổi ảnh hero.

## Kiểm tự động

- `src/styles/brand.test.ts` – bảng màu, không mã màu cứng/`rgb()`/màu theo tên, tokens và fonts không cũ.
- `src/content/copy.test.ts` – EN/VI đủ trường, độ dài title/description, giọng văn (không emoji, không "!"), dữ liệu `site.json`. Ca gắn `[content v1.1]` cập nhật cùng mock v1.2.
- `src/checks/dist.test.ts` (+ `scripts/dist-checks.mjs`) – trên `dist/`: không script/style nội tuyến, không tài nguyên khác origin, mỗi trang đúng một H1, không form/OTA, hreflang 2 chiều + x-default, OG, JSON-LD `LodgingBusiness`, sitemap/robots, chỉ màu trong bảng, ngân sách byte, ảnh, ký tự nằm trong subset font.
- `product/tests/e2e/landing/` – Playwright trên `serve.mjs` (header như ADR-014 1.4): axe 0 lỗi, không cuộn ngang, CSP sạch, 0 yêu cầu ra ngoài, glyph chỉ từ Lora/Be Vietnam Pro, quy tắc ngôn ngữ, ngân sách byte theo DPR (concept 11.2).

## Chỗ chừa cho "Yêu cầu đặt phòng" (FB-INV-002, ESC-020 L7)

Chưa làm: endpoint do ARC/BE thiết kế, giao diện theo UXD mock v1.2. Đã chừa: cờ `features.bookingRequest` (đang `false`), `src/components/BookingRequestSlot.astro` (vị trí trong trang; bật cờ khi chưa có form thì build dừng), quy tắc trong `src/lib/booking-request.ts`. Khi bật, kiểm dist tự đổi sang: chỉ cho `<form method="post">` tới đường dẫn cùng origin `/v1/public/…`, `fetch` chỉ cùng origin, vẫn không cookie, không script ngoài.
