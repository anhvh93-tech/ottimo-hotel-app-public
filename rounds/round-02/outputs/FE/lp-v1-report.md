# FE-LP – Báo cáo dựng LP-v1 (landing, luồng riêng – cổng LP-v1)

- Vai: FE (luồng FE-LP) | Round 2 – song song Sprint 4 | Ngày: 17/10/2026
- Giao việc: ORC 17/10 – dựng LP-v1 theo ADR-014 + concept/mock v1.1; CI build + test; Playwright 320/375/1280 × EN/VI. Cập nhật giữa chừng (ORC, FB-INV-002): **giữ nguyên nội dung và các section** (UXD làm mock v1.2), làm tiếp phần hạ tầng, **chừa chỗ** cho form "Yêu cầu đặt phòng".
- Trạng thái: **build xanh, test xanh** trên máy FE. Chưa commit (theo rào chắn). Không đụng mã Desk/API/contract, không đụng demo stack.

## 1. Đã làm gì

### 1.1 App `product/apps/landing-web` (workspace `@ottimo/landing-web`)
- **Astro 7.3.8**, `output: 'static'`, `build.format: 'directory'`, `trailingSlash: 'always'`, `inlineStylesheets: 'never'`, `assetsInlineLimit: 0`, không island, không dev toolbar, không prefetch, telemetry Astro tắt trong mọi script. Image service = `passthrough` (không chạy sharp lúc build hay lúc chạy).
- **Trang dựng sẵn**: `/` (EN, mặc định), `/vi/` (VI), `/404.html`, `/vi/404/index.html`, `robots.txt`, `sitemap-index.xml` + `sitemap-0.xml`.
- **Ngôn ngữ (ADR-014 mục 3)**: EN ở gốc không tiền tố, VI ở `/vi/`; không đọc `Accept-Language`, không chuyển hướng, không cookie. Nút EN/VI là link thường, luôn thấy ở đầu trang. Dải gợi ý ngôn ngữ ẩn sẵn (`hidden` + `data-nosnippet`, viết bằng ngôn ngữ được gợi ý), cố định đáy màn hình, nằm trên thanh liên hệ, đóng được; lựa chọn lưu `localStorage` `ottimo.lang`. `hreflang` en/vi + `x-default` = bản EN, hai chiều, cả trong `<head>` và sitemap.
- **Nội dung**: chép đúng mock v1.1 (EN dẫn dắt, VI hỗ trợ; 9 section + header, footer, thanh liên hệ đáy). Liên hệ: 08.4444.0909 (`tel:+84844440909`), Zalo `zalo.me/0844440909` (đổi sang OA chỉ sửa `site.json`), WhatsApp/Telegram/Viber +84 84 444 0909, `booking@ottimo.vn` (tiêu đề thư điền sẵn theo US-151 AC1), ghim `https://maps.app.goo.gl/oYos42G5YvUEcDCc6` (chỉ là link, mở tab mới). Dữ liệu nằm một chỗ: `src/content/site.json`, kiểm bằng zod lúc build (email phải là hộp thư trên tên miền OTTIMO – email cá nhân làm build dừng).
- **Thương hiệu**: màu chỉ qua `var(--brand-*)`; `src/styles/tokens.css` **sinh** từ nhóm màu thương hiệu của DS v0.4.1 (`pnpm sync:tokens`), đúng 7 màu Brand Guidelines + trắng. Không chế độ tối (concept G-7). `theme-color` = Ivory, favicon monogram chỉ dùng màu trong bảng.
- **Font tự host** từ `@fontsource` 5.2.8: Lora 400 + 400 nghiêng, Be Vietnam Pro 400/500/600; chỉ subset latin, latin-ext, vietnamese; chỉ woff2 (15 tệp, 6–24 KB/tệp). `src/styles/fonts.css` **sinh** bằng `pnpm sync:fonts`. Preload 1 tệp Lora 400 latin cho H1. Thứ tự khai báo đặt subset vietnamese sau latin-ext → trang VI không tải thêm latin-ext (bớt khoảng 68 KB). Không tải JetBrains Mono (trang không có mã).
- **Ảnh**: 18 ảnh × 480/960/1600 × AVIF/WebP chép từ `design/landing/mock/img` (+ `manifest.json` alt EN/VI, `CREDITS.md`) vào `src/assets/photos/` (4,8 MB); `<picture>` giữ đúng cấu trúc mock: điện thoại tối đa 960 px, hero `fetchpriority=high` + 2 preload theo `media` (tải đúng 1 lần – đã đo), ảnh khác `lazy`, mọi ảnh có `width/height/alt`. Ảnh lỗi giữ khung Cream, không hiện biểu tượng ảnh hỏng (US-153 AC5).
- **SEO**: title/description riêng mỗi ngôn ngữ, canonical, hreflang, Open Graph (`og:locale` + `alternate`, ảnh 1200×630 `public/og/ottimo-1200x630.jpg` cắt từ hero bằng `pnpm og`), `twitter:card`, JSON-LD `LodgingBusiness` + `WebSite` (tên, địa chỉ, điện thoại, email, giờ nhận/trả, ghim bản đồ, tiện nghi, `sameAs` fanpage Facebook), không sao đánh giá, không giá, **không số phòng** (FB-INV-002). Sitemap chỉ gồm trang đã phát hành (không 404).
- **Bản xem thử mặc định**: chưa đặt `LANDING_INDEXABLE=true` thì mọi trang `noindex, nofollow` và `robots.txt` chặn hết (US-146 AC4). Bản production (đặt biến) thì `index, follow`, `robots.txt` cho phép `/`, chặn `/v1/`, trỏ sitemap – đã build thử cả hai chế độ.
- **CSP**: HTML chỉ có 1 tệp CSS + 1 module JS ở `/_astro/` (~2 KB, ~1 KB gzip), ngoại lệ duy nhất là khối JSON-LD (đã thoát `<`). Header ADR-014 1.4 lưu ở `src/lib/security-headers.json`, dùng cho `astro preview` và server test.

### 1.2 Theo FB-INV-002 (giữa chừng) – chỉ phần hạ tầng
- Bỏ `numberOfRooms` khỏi `site.json` và JSON-LD; kiểm dist chặn số phòng trong JSON-LD.
- Thêm `facebookUrl` (fanpage INV gửi) vào `site.json` + JSON-LD `sameAs`; link Facebook nằm trong danh sách link được phép (chỉ là link, không plugin/SDK). Hiển thị trên trang chờ mock v1.2.
- **Chỗ chừa cho "Yêu cầu đặt phòng"** (ESC-020 L7 = A): cờ `features.bookingRequest` (đang `false`), `src/components/BookingRequestSlot.astro` đặt trước mục Liên hệ (hiện không vẽ gì; bật cờ khi chưa có form thì build dừng), quy tắc trong `src/lib/booking-request.ts`. Kiểm dist theo cờ: tắt → không có form/input nào; bật → chỉ chấp nhận `<form method="post">` tới đường dẫn cùng origin `/v1/public/…`, `fetch` chỉ cùng origin, vẫn cấm cookie, `sendBeacon`, URL tuyệt đối, script ngoài. CSP hiện có (`form-action 'self'`, `connect-src 'self'`) đã đủ cho form cùng origin.
- Test E2E bỏ phụ thuộc thứ tự kênh/bố cục (sẽ đổi ở v1.2): kiểm "chỉ link tới kênh được phép, trang nào cũng có Zalo và số điện thoại". Ca unit gắn `[content v1.1]` và 1 ca `todo [content v1.2]` (không nhắc số phòng, Zalo đứng đầu cả hai ngôn ngữ).
- **Nội dung chữ và các section giữ nguyên v1.1** theo lệnh ORC: trang vẫn ghi "Ten fully equipped apartments", thứ tự EN WhatsApp trước… cho tới khi có mock v1.2.

### 1.3 Kiểm tự động
- **Vitest trong app** (99 ca xanh + 1 todo): bảng màu (không mã màu cứng, `rgb()`, `color-mix`, màu theo tên; chỉ `--brand-*`; tokens/fonts không cũ so với nguồn), font (chỉ @fontsource, đúng subset), copy EN/VI (đủ trường, title ≤ 60, description ≤ 160, không emoji/"!"/mũi tên/≈, VI dùng dấu phẩy thập phân, câu chống giả danh), `site.json` (chặn email cá nhân, link Zalo/bản đồ sai), quy tắc ngôn ngữ, URL/hreflang, robots, JSON-LD, và **kiểm `dist/`** (`scripts/dist-checks.mjs`): không script/style nội tuyến, không `style=`/`on*=`; **0 tài nguyên khác origin** (script, CSS, font, ảnh, iframe, preconnect, `url()` trong CSS; JS không cookie, không gọi mạng); **mỗi trang đúng 1 H1**; không form/OTA; hreflang 2 chiều + x-default, canonical, OG, JSON-LD; sitemap/robots theo chế độ build; **mọi màu trong CSS/SVG/HTML thuộc bảng thương hiệu**; **ngân sách byte** (hero AVIF 480 ≤ 20 KB, 960 ≤ 50 KB, 1600 ≤ 120 KB; mọi ảnh ≤ 450 KB; JS ≤ 15 KB gzip; CSS ≤ 15 KB gzip; HTML ≤ 25 KB gzip; font ≤ 30 KB/tệp; dist ≤ 80 MB); ảnh (`width/height/alt`, chỉ hero eager, nguồn điện thoại ≤ 960 w); mọi ký tự hiển thị nằm trong subset font. Có 7 ca "site hỏng" để chứng minh từng luật bắt được lỗi.
- **Playwright** `product/tests/e2e/landing/` (27 ca xanh, ~15 giây, lần chạy cuối với `CI=1`; QA đã gắn mã TC-LP-001…010, thêm bề rộng 768 px và ca TC-LP-010 "lỗi đã biết" US-151 AC7 – thanh cố định chỉ Đặt phòng + Zalo – chờ dựng v1.2), chạy trên `serve.mjs` – server tĩnh mô phỏng ADR-014 1.4 (CSP và header thật, `try_files`, `/en/*` → 301, 404 theo tiền tố, gzip):
  - 320/375/(768)/1280 × EN/VI: **axe 0 vi phạm** (WCAG 2.0/2.1 A+AA, 2.2 AA; mở hết hỏi đáp; thêm lượt quét khi mở menu điện thoại), **không cuộn ngang** (đầu trang, sau khi cuộn hết, khi mở menu), đúng 1 H1, không trùng `id`, 0 lỗi console/CSP, **0 yêu cầu ra ngoài origin**.
  - Glyph: mọi chữ hiển thị vẽ bằng Lora/Be Vietnam Pro (CDP `getPlatformFontsForNode`), EN và VI.
  - Ngôn ngữ: `GET /` kèm `Accept-Language: vi` → 200 bản EN, không `Vary: Accept-Language`, không `Set-Cookie`; trình duyệt `vi-VN` trên `/` → dải gợi ý `/vi/` (axe 0 khi dải hiện, không che thanh liên hệ), đóng → tải lại không hiện; trình duyệt EN trên `/vi/` → gợi ý EN, bấm EN về `/` không còn dải; ngôn ngữ chưa phát hành (fr) → coi là EN; khách đã chọn VI thì trang EN chỉ nhắc, không tự đổi.
  - 404 EN/VI: mã 404, 1 H1, `noindex`, axe 0. Link liên hệ chỉ thuộc danh sách cho phép; bàn phím: link "bỏ qua" tới `main`; "Chép địa chỉ" báo đúng ngôn ngữ.
  - **Ngân sách theo DPR (concept 11.2)** – Chromium, xóa cache, byte thân phản hồi đã nén (KB = 1024 B):

| Trường hợp | Hero (ngân sách) | Lúc mở (ngân sách) | Cuộn hết (ngân sách) |
|---|---|---|---|
| Điện thoại 375 EN DPR 1 | 16,2 (20) | 219,9 (250) | 274,0 (350) |
| Điện thoại 375 EN DPR 2 | 48,2 (50) | 289,5 (320) | 394,2 (600) |
| Điện thoại 375 EN DPR 3 | 48,2 (50) | 369,7 (400) | 518,7 (700) |
| Điện thoại 375 VI DPR 2 | 48,2 (50) | 312,2 (390) | 416,9 (670) |
| Điện thoại 375 VI DPR 3 | 48,2 (50) | 392,4 (470) | 541,4 (770) |
| Máy tính 1280 EN DPR 1 | 48,2 (50) | 354,1 (400) | 510,8 (600) |
| Máy tính 1280 EN DPR 2 | 115,8 (120) | 667,3 (700) | 1.036,3 (1.100) |

  Không tính header phản hồi: server test HTTP/1.1 lặp ~0,8 KB header (chủ yếu CSP) cho mỗi ~25 phản hồi, còn production chạy HTTP/2 (HPACK gửi một lần). Nếu tính cả header theo HTTP/1.1, các ô "lúc mở" tăng ~15–20 KB (máy tính DPR 2 khi đó sát/vượt 700).

### 1.4 CI (`.github/workflows/ci.yml`)
- Job `format · lint · audit · test · build`: thêm bước **"Landing LP-v1 (build + source/dist checks)"** = `turbo run build test --filter=@ottimo/landing-web` (trước bước Test chung; Test/Build chung dùng lại cache turbo). Test của landing phụ thuộc build của chính nó (`apps/landing-web/turbo.json`) và đọc lại `design/wireframes/assets/tokens.css` (input `$TURBO_ROOT$`) để kiểm tokens không cũ.
- Job mới **`landing-e2e`** ("landing LP-v1 · Playwright (axe, CSP, budgets)"): cài, build landing, cài Chromium (cache theo phiên bản Playwright), chạy `pnpm --filter @ottimo/tests test:e2e:landing`, tải báo cáo khi đỏ. Không cần stack API, chạy song song các job khác.
- `pnpm audit --audit-level=high` vẫn xanh (còn 3 cảnh báo mức trung bình có từ trước ở api/admin-web).
- ESLint bỏ qua `**/.astro/**`, Prettier bỏ qua `.astro` (kiểu sinh tự động của Astro).

## 2. File tạo / sửa

**Tạo – `product/apps/landing-web/`**: `package.json`, `astro.config.ts`, `tsconfig.json`, `turbo.json`, `vitest.config.ts`, `.gitignore`, `README.md`; `public/favicon.svg`, `public/og/ottimo-1200x630.jpg`; `scripts/sync-tokens.mjs`, `sync-fonts.mjs`, `make-og.mjs`, `dist-checks.mjs`, `check-dist.mjs`; `src/assets/photos/` (108 ảnh + `manifest.json` + `CREDITS.md`); `src/content/site.json`, `site.ts`, `types.ts`, `en.ts`, `vi.ts`, `photos.ts`, `copy.test.ts`; `src/lib/i18n.ts`, `seo.ts`, `robots.ts`, `booking-request.ts`, `security-headers.json`, `i18n.test.ts`; `src/layouts/Base.astro`; `src/components/Header.astro`, `Footer.astro`, `StickyBar.astro`, `LangSuggest.astro`, `Picture.astro`, `Monogram.astro`, `Arrow.astro`, `HomePage.astro`, `NotFound.astro`, `BookingRequestSlot.astro`, `home/{Hero,Stay,About,Rooms,Why,Amenities,Location,Faq,Contact}.astro`; `src/pages/index.astro`, `vi/index.astro`, `404.astro`, `vi/404.astro`, `robots.txt.ts`; `src/scripts/main.ts`, `lang.ts`, `lang.test.ts`; `src/styles/landing.css`, `tokens.css` (sinh), `fonts.css` (sinh), `brand.test.ts`; `src/checks/dist.test.ts`, `dist-checks.test.ts`.

**Tạo – `product/tests/e2e/landing/`**: `serve.mjs`, `playwright.config.ts`, `helpers.ts`, `layout.landing.spec.ts`, `lang.landing.spec.ts`, `budget.landing.spec.ts`.

**Sửa (tệp dùng chung – đọc lại ngay trước khi sửa, sửa nhỏ)**: `.github/workflows/ci.yml` (1 bước + 1 job), `product/tests/package.json` (script `test:e2e:landing`), `product/eslint.config.js` (ignore `.astro`), `product/.prettierignore` (`.astro`), `product/pnpm-lock.yaml` (qua `pnpm add/install`).

**Dependency mới (chỉ trong workspace landing-web, cài bằng pnpm)**: `astro` 7.3.8, `@astrojs/sitemap` 3.7.4, `@astrojs/check` 0.9.10, `typescript` ~5.8.3, `vitest` ^4.1.12, `@types/node` ^22.10.2, `prettier` ^3.4.2 (dev); `@fontsource/lora` 5.2.8, `@fontsource/be-vietnam-pro` 5.2.8 (cùng bản `packages/ui` đang dùng). `sharp` 0.35.5 đi kèm Astro (tùy chọn) – chỉ dùng cho script tay `make-og.mjs`.

## 3. Giả định và chỗ lệch tài liệu (cần ARC/UXD/PO/OPS xác nhận – không cần INV)
1. **Astro 7.3.8 thay vì 6.x (lệch ADR-014 mục 2.2)**: mọi bản Astro < 7.2.8 dính khuyến cáo **critical** GHSA-26w7-cxv4-gfx2 (RCE qua tối ưu ảnh AVIF) và 3 khuyến cáo **high** của sharp < 0.35.5; không có bản vá cho nhánh 6.x → bước `pnpm audit --audit-level=high` của CI sẽ đỏ **cho cả repo**. Astro 7 dùng **Vite 8** (chỉ trong landing-web; 3 app còn lại giữ Vite 7). Cách dùng không đổi (cùng API, static, không island). ADR-014 ghi "lên major mới cần ADR" → **ARC sửa ADR-014 mục 2.2** (hoặc chọn Astro 6 + ngoại lệ audit có SEC ký – đội không đề xuất).
2. Thư mục `product/apps/landing-web` theo ADR-014 (sprint-4-plan ghi ví dụ `apps/landing`).
3. Token màu: **bản sao sinh tự động** của nhóm `--brand-*` trong `src/styles/tokens.css` (cùng nguồn DS, test chặn lệch) thay vì thêm export `@ottimo/ui/tokens.css`/`fonts.css` (ADR-014 mục 10) – để FE-LP chỉ sửa trong thư mục landing (R-S4-7) khi FE-B đang sửa `packages/ui`; và landing không nhận token app/chế độ tối. Font theo mock (Lora 400/400 nghiêng, preload Lora 400) thay vì "Lora 500/600, preload 600" ở ADR-014 2.5.
4. JSON-LD kiểu `LodgingBusiness` (theo giao việc ORC, concept, US-154) thay vì `Hotel` (ADR-014 mục 5); không có `geo` (chưa có tọa độ, chỉ có link rút gọn).
5. Trang 404 tiếng Anh nằm ở `/404.html` (cách Astro xuất), tiếng Việt ở `/vi/404/index.html` → **OPS** dùng đường dẫn này trong `handle_errors` (ADR-014 1.4 ghi `/404/index.html`).
6. Mặc định là **bản xem thử `noindex`**; OPS đặt `LANDING_INDEXABLE=true` (biến build, đã khai trong `turbo.json`) cho bản production sau cổng LP-v1. `LANDING_SITE_URL` mặc định `https://ottimo.vn` [GIẢ ĐỊNH – INV đang mua tên miền]; nếu tên miền thật khác thì email công khai phải đổi theo (build kiểm).
7. Chuỗi giao diện chưa đưa vào `design/copy/strings-*.json` nhóm `landing.*` (ADR-014 3.4) – nội dung đang giữ để UXD làm lại ở v1.2; chuyển khi chốt v1.2.
8. Phần FE tự thêm, **UXD cần duyệt**: dải gợi ý ngôn ngữ (nền Ink, chữ Ivory, nút "Đóng/Close"), chữ trang 404, nhãn trợ năng tiếng Việt cho điều hướng ("Điều hướng chính"), tiêu đề thư điền sẵn ("Booking – OTTIMO" / "Đặt phòng – OTTIMO"), ảnh OG chỉ có ảnh (chưa có chữ – cần Lora vẽ vào ảnh).
9. Chưa xóa `apps/booking-web/README.md` (ADR-014 mục 10) – để ORC quyết khi commit.

## 4. Rủi ro / vướng mắc
- **Docker**: `Dockerfile.web` chạy `turbo run build --filter=./apps/*` nên từ nay build cả landing (chưa chép `dist` vào image – việc của OPS). Lockfile đã có binding musl (rolldown, lightningcss, sharp). Thử build trên đúng image `node:22-alpine` **chưa xong** (mục 6) → job `docker-build` của CI là nơi xác nhận đầu tiên; nếu đỏ ở bước build landing, cách lui nhanh là OPS đổi filter thành `--filter=./apps/* --filter=!@ottimo/landing-web` tới khi sửa.
- `pnpm-lock.yaml` được sinh lại khi các luồng khác cũng đang sửa `package.json` (mobile, ui…) chưa commit → khi commit tách luồng (ĐK-S3-13), ORC chạy `pnpm install` một lần ở bước tích hợp rồi commit lockfile chung.
- Ngân sách máy tính DPR 2 "lúc mở" còn ~33 KB; thêm section/ảnh ở v1.2 dễ vượt → UXD giữ quy tắc concept 11.2.
- Form "Yêu cầu đặt phòng" phụ thuộc: ARC (OpenAPI `public-site`: form-token, booking-inquiries), BE-D (module), SEC (C-2, C-3, giới hạn tần suất, thông báo xử lý dữ liệu có phiên bản), OPS (Caddy proxy đúng 5 đường dẫn `/v1/public/…`), pháp lý ESC-001 (Bộ Công Thương) trước khi bật trên mạng. `serve.mjs` hiện trả 404 cho `/v1/*` → E2E của form cần stub hoặc API thật.
- Chưa có Lighthouse CI (ADR-014 mục 9 – job của OPS); LCP mới đo gián tiếp qua ngân sách byte.

## 5. Việc chưa xong / chờ
- **Chờ UXD mock v1.2 (FB-INV-002)**: nội dung, bố cục, Zalo đứng đầu, "Kênh khác", hiển thị link Facebook, bỏ số phòng trên trang. Khi có: sửa `en.ts`/`vi.ts`, các section, ca `[content v1.1]`, đổi `todo [content v1.2]` thành test thật.
- Khoảng trống so với AC (mock v1.1 chưa có – UXD/PO quyết khi làm v1.2): thư viện ảnh của hạng phòng (US-147 AC2), "Thuê tháng từ …" (US-147 AC3, chờ số + bảng ghép), biểu tượng tiện nghi (US-148 AC1), mục chính sách (US-149), trang quyền riêng tư (US-149 AC5 – **bắt buộc trước khi bật form**), ảnh OG theo ngôn ngữ có chữ (US-154 AC1).
- OPS: site thứ 4 trong Caddyfile (header, 404 theo mục 3.5 ở trên, `/en/*` → 301, không proxy `/v1/*` ở v1), chép `apps/landing-web/dist` vào image `ottimo-web` (`/srv/landing-web`), `LANDING_INDEXABLE`, Lighthouse CI.
- Lên mạng chờ: tên miền + VPS, bảng ghép tên phòng, logo SVG, quyền dùng ảnh, INV duyệt nội dung và bản xem thử (sprint-4-plan 9.1).

## 6. Kiểm Docker (node:22-alpine)
- Đã chạy thử `pnpm install --frozen-lockfile --filter @ottimo/landing-web...` + build landing trong `node:22-alpine` (cùng digest với `Dockerfile.web`, máy arm64). Bước cài **không xong sau ~55 phút** vì mạng trong container liên tục `ECONNRESET` khi tải binary (sharp-libvips, turbo, rolldown) – không phải lỗi mã. Đã dừng và dọn (không tạo image, không đụng demo stack). Lockfile "up to date", không lỗi phân giải.
- Chưa xác minh: build landing trên Linux x64 musl → chờ job `docker-build` của CI.

## 7. Dòng đề xuất cho decision-log (ORC ghi khi commit)
- `| 2026-10-17 | 2 | Landing dùng Astro 7.3.8 (Vite 8, chỉ trong apps/landing-web) thay Astro 6.x của ADR-014 2.2: Astro < 7.2.8 có khuyến cáo critical GHSA-26w7-cxv4-gfx2 không vá cho nhánh 6, làm pnpm audit (high) của CI đỏ; image service passthrough (không sharp) | FE-LP [GIẢ ĐỊNH – ARC xác nhận, sửa ADR-014] | Giữ CI xanh, không ngoại lệ audit |`
- `| 2026-10-17 | 2 | Landing lấy màu qua bản sao sinh tự động của nhóm --brand-* (src/styles/tokens.css, test chặn lệch với DS) và @font-face tự sinh từ @fontsource (Lora 400/400i, Be Vietnam Pro 400/500/600; latin, latin-ext, vietnamese; woff2), không thêm export vào packages/ui | FE-LP | FE-LP chỉ sửa trong thư mục landing (R-S4-7); landing không nhận token app |`
- `| 2026-10-17 | 2 | Landing build mặc định là bản xem thử noindex + robots chặn hết; production đặt LANDING_INDEXABLE=true sau cổng LP-v1 | FE-LP | US-146 AC4 |`
- `| 2026-10-17 | 2 | FB-INV-002 phần hạ tầng: bỏ numberOfRooms khỏi JSON-LD, thêm fanpage Facebook (sameAs, chỉ link), cờ features.bookingRequest=false + chỗ chừa form; kiểm dist theo cờ (bật: chỉ POST cùng origin /v1/public/) | FE-LP | ORC 17/10; ESC-020 L7 = A |`
