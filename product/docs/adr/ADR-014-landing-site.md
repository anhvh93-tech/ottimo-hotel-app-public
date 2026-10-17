# ADR-014 – Website giới thiệu và đặt phòng trực tiếp (landing) ở tên miền gốc

- Trạng thái: **Đề xuất** (chờ review bắt buộc BE, SEC; khuyến nghị OPS, INT, FE, UXD, DATA) | Người quyết: ARC (kỹ thuật); PO (phạm vi, lịch); INV (chi phí, chính sách giá công khai – nếu phát sinh) | Ngày: 17/10/2026 | Round 2 – Sprint 3 đang đóng, chuẩn bị Sprint 4
- Trả lời: ADR-004 điểm 3 (`booking-web` cần SEO, chọn công nghệ bằng ADR riêng). ADR này **gộp** landing và trang đặt phòng trực tiếp (EP18) vào **một** app `product/apps/landing-web`. Thư mục giữ chỗ `apps/booking-web` bỏ đi.
- Đầu vào: FB-INV-001 (17/10), tin nhắn INV 17/10 ("Làm landing page nha…", Zalo OA để chăm sóc khách), PRD M13, M15, A6; backlog EP18 (US-131, US-132), US-034, US-040, US-108, US-116, US-126, US-138; `integrations.md` I7 + mục 3.4 + ESC-INT-B; ESC-010; `hosting-plan.md` mục 5.1, 10.1; ADR-004, ADR-006, ADR-009, ADR-010, ADR-012; `security-requirements.md` SR-HDR, SR-RL; `data-risk-assessment.md`; `design-system.md` v0.3.5; `00-brief/context/landing/README.md`.
- Liên quan: ADR-001 (contract-first), ADR-007 (đa cơ sở, RLS), ADR-008 (giờ cơ sở).

> **Quy ước nguồn** (giống ADR-010, INT): **[Nguồn]** = tài liệu chính thức, đọc ngày 17/10/2026 (link ở mục 14); **[Bên thứ ba]** = trang tổng hợp; **[Chưa xác minh]** = ước lượng của đội hoặc chưa đọc được tài liệu gốc. Tên miền `ottimo.vn` chỉ là ví dụ – INV chưa xác nhận đã sở hữu (ESC-010, giả định trong decision-log). Trong tài liệu ghi `<tên-miền>`.

---

## Bối cảnh

- INV **đã quyết** (17/10): có landing ở **tên miền gốc** để khách tìm hiểu OTTIMO và đặt phòng. Landing "gióng" sản phẩm đang làm: cùng nhận diện, đơn đặt về đúng OTTIMO Desk.
- Hiện trạng R2: tên miền con `desk.`, `staff.`, `g.` đã thiết kế (hosting-plan 5.1). Tên miền gốc đang **để dành** cho website giới thiệu (hosting-plan 10.1). Chưa có story cho phần giới thiệu (nội dung, ảnh, SEO). EP18 có US-131 (Should R3: xem phòng trống + giá + gửi yêu cầu giữ chỗ) và US-132 (Could R4+: đặt và trả tiền ngay).
- Tư liệu: ảnh gốc trong Google Drive của INV ("Mặt tiền + Sảnh" 6 ảnh PNG, "Phòng 1"…"Phòng 5" khoảng 7 ảnh mỗi thư mục; 4–60 MB/ảnh; tổng khoảng 0,9–1 GB). **Chưa tải** – ORC xin phép INV. E-brochure `OTTIMO_Ebrochure_16x9_Terracotta_C1_SlowLiving.pdf` **chưa đọc được**; tên tệp gợi ý tông "Terracotta – Slow Living" [Chưa xác minh].
- INV muốn dùng **Zalo OA** để chăm sóc khách. Điều này đổi ESC-010 (INV chọn B ngày 16/10: Zalo ZNS để sau MVP, R2/R3 gửi tay). Việc đổi ESC-010 thuộc INT/PO. ADR này chỉ đảm bảo landing **không phụ thuộc** quyết định đó: nút Zalo OA là một đường link; khi có Zalo OA API thì phía Desk gửi tự động, landing không đổi.
- Ràng buộc: ngân sách hạ tầng ≤ 1 tr/tháng (ADR-010); dữ liệu khách ở Việt Nam (ESC-002 A); không Cloudflare proxy trước API/app khách (ADR-010 điểm 4); CSP chặt không `unsafe-inline` (SR-HDR-01); 3 ngôn ngữ VI/EN/RU (PRD nguyên tắc 4); khách nước ngoài nhiều, nhưng phần lớn tìm phòng qua OTA (PRD A6).

## Tóm tắt quyết định

| # | Chủ đề | Quyết định |
|---|---|---|
| 1 | Nơi chạy | App tĩnh riêng `product/apps/landing-web`, build trong CI, **Caddy trên chính VPS production** phục vụ ở tên miền gốc (`www.` chuyển hướng 301 về gốc). Không dùng CDN ở bản đầu. Có điều kiện đo được để thêm CDN **chỉ cho ảnh** (mục 1.3) |
| 2 | Công nghệ | **Astro 6** xuất tĩnh (`output: 'static'`), không đảo (island) ở trang nội dung; JS tối thiểu bằng `<script>` module ngoài. Dùng token + font chung với `packages/ui`. Không có tiến trình Node chạy thường trực |
| 3 | Ngôn ngữ | Đường dẫn `/vi/`, `/en/`, `/ru/` cho mọi trang; `/` chuyển hướng 302 theo `Accept-Language`; `hreflang` 2 chiều + `x-default` = `/` |
| 4 | Đặt phòng | **L0** nút Zalo OA / gọi điện / email (không cần API). **L1** form "Yêu cầu đặt phòng" → endpoint công khai mới tạo **`booking_inquiry`** (hộp thư chờ xử lý), **không** tạo lead/giữ chỗ tự động; sale chuyển thành lead → báo giá → giữ chỗ bằng luồng có sẵn. **L2 (R3, US-131)** API công khai phòng trống + giá trực tiếp, chỉ đọc, có cache. **L3 (R4+, US-132)** đặt + trả tiền ngay – ADR riêng |
| 5 | SEO | HTML tĩnh theo ngôn ngữ, `sitemap-index.xml` có `xhtml:link`, `robots.txt`, JSON-LD `Hotel` + `HotelRoom` + `BreadcrumbList`; **không** tự gắn sao đánh giá |
| 6 | Đo lường | Bộ đếm **tổng hợp theo ngày** ghi trong DB của OTTIMO (không cookie, không lưu IP, không định danh). **Không cần banner đồng ý** khi giữ đúng điều kiện ở mục 6.3 [SEC xác nhận]. Google Search Console xác minh bằng DNS (không gắn script) |
| 7 | Ảnh | Ảnh gốc **không vào git**. Script nạp ảnh (chạy trên máy UXD/FE) tạo bản "master" đã giảm cỡ, bỏ EXIF → vào git (≤ 30 MB tổng). Build tạo AVIF + WebP nhiều cỡ có tên băm |
| 8 | Chi phí | **0 đ/tháng tăng thêm** so với ADR-010 (cùng VPS, cùng tên miền). CDN ảnh (nếu cần sau) 0–50.000 đ/tháng [Chưa xác minh] và cần SEC/INV đồng ý vì dữ liệu truy cập ra nước ngoài |

---

## 1. Landing đặt ở đâu

### 1.1 So sánh

| Tiêu chí | **A. Cùng VPS, Caddy phục vụ tệp tĩnh** (đề xuất) | **B. CDN toàn phần** (Cloudflare Pages, Bunny…) | **C. Lai: HTML + form ở VPS, ảnh qua CDN** |
|---|---|---|---|
| Chi phí thêm/tháng | **0 đ** (dùng tên miền đã tính trong ADR-010) | 0 đ (gói miễn phí Cloudflare Pages) – ~26.000–50.000 đ (CDN trả theo lượng) [Chưa xác minh] | 0–50.000 đ [Chưa xác minh] |
| Tốc độ với khách ở VN | Tốt (VPS ở VN) | Tốt | Tốt |
| Tốc độ với khách ở châu Âu/Nga | Trung bình: độ trễ mạng ~200–300 ms (ước của ADR-010), băng thông quốc tế của VPS VN có thể bị giới hạn [Chưa xác minh] | Tốt nhất | Gần bằng B (phần nặng nhất là ảnh) |
| Dữ liệu cá nhân (ESC-002 A) | Ở VN toàn bộ | Form gửi tên/SĐT đi qua máy chủ nước ngoài, **hoặc** phải gửi chéo origin sang VPS (cần CORS – trái SR-HDR-04). IP người xem xử lý ở nước ngoài | HTML và form ở VN; chỉ yêu cầu tải ảnh (IP người xem) qua CDN |
| Header bảo mật, CSP | Một chỗ (Caddyfile), giống 3 app hiện có | Thêm cấu hình riêng của nhà cung cấp (`_headers`) | Caddy + thêm host ảnh vào `img-src` |
| Vận hành | Chung pipeline build/deploy/rollback có sẵn | Thêm tài khoản nhà cung cấp (INV đứng tên), pipeline thứ 2, DNS lẫn "mây cam"/"mây xám" → dễ bật nhầm proxy cho `desk.`/`g.` | Thêm 1 host ảnh + tài khoản CDN |
| Khi VPS hỏng | Landing cũng ngừng (cùng điểm lỗi đơn – ADR-010 đã chấp nhận) | Landing vẫn xem được (form vẫn hỏng) | Như A |

### 1.2 Quyết định
- Chọn **A**. Lý do: không tốn thêm tiền; dữ liệu khách (form) không ra nước ngoài; một chỗ cấu hình header; một pipeline. Khách nước ngoài chủ yếu đến từ OTA (PRD A6), nên tốc độ từ châu Âu là quan trọng nhưng chưa phải chặn.
- Landing là **site thứ 4** trên Caddy (origin riêng, như SR-HDR-04). Nó **chỉ** proxy `/v1/public/*` tới api; mọi `/v1/*` khác trả 404 ở origin này. Không cookie, không phiên.
- Tệp build nằm trong image `ottimo-web` cùng 3 app (thêm `/srv/landing-web`), deploy và rollback bằng `deploy.sh` hiện có. Xem lại khi landing cần deploy > 1 lần/ngày (khi đó tách image `ottimo-landing` + volume chỉ đọc cho Caddy).
- Build **một lần**, dùng cho cả staging và production: URL tuyệt đối (canonical, hreflang, sitemap, `og:url`) luôn là tên miền production (`LANDING_SITE_URL`). Staging trả `X-Robots-Tag: noindex, nofollow` và `robots.txt` chặn toàn bộ, nên trỏ canonical về production là chấp nhận được.

### 1.3 Điều kiện chuyển sang C (thêm CDN cho ảnh)
Một trong các điều kiện sau, đo trong 2 tuần sau khi chạy thật:
1. LCP p75 của trang chủ đo từ châu Âu (Lighthouse/WebPageTest đặt máy đo ở EU) > 3 giây.
2. Lưu lượng ra của VPS > 50% hạn mức gói VPS (OPS đọc số liệu nhà cung cấp).
3. Khách/INV phản ánh trang chậm khi ở nước ngoài.

Khi chuyển: host ảnh riêng (ví dụ `static.<tên-miền>`) kéo từ VPS; chỉ host này đi qua CDN; HTML, form, API giữ ở VPS. Cần SEC cập nhật danh sách bên xử lý dữ liệu (IP người xem) và INV đồng ý nếu phát sinh phí → ESC lúc đó.

### 1.4 Phác thảo Caddy cho OPS (OPS viết bản thật trong `infra/caddy/Caddyfile.prod`)

| Đường dẫn | Xử lý | `Cache-Control` |
|---|---|---|
| `/` | 302 theo `Accept-Language` (ngôn ngữ ưu tiên đầu tiên): `vi*` → `/vi/`, `ru*` → `/ru/`, còn lại → `/en/`; kèm `Vary: Accept-Language` | `no-store` |
| `/vi/…`, `/en/…`, `/ru/…` | `try_files {path} {path}/index.html`, `file_server` | `public, max-age=0, must-revalidate` (Caddy có `ETag`/`Last-Modified` → trả 304 nhanh) |
| `/_astro/*` (JS, CSS, font, ảnh có tên băm) | `file_server` | `public, max-age=31536000, immutable` |
| `/og/*` (ảnh chia sẻ mạng xã hội, JPEG cố định tên) | `file_server`; `Cross-Origin-Resource-Policy: cross-origin` (Zalo/Facebook hiển thị ảnh xem trước) | `public, max-age=86400` |
| `/robots.txt`, `/sitemap-*.xml`, `/favicon.ico`, `/site.webmanifest` | `file_server` | `public, max-age=3600` |
| `/v1/public/*` | `reverse_proxy api:3000`; giới hạn body **16 KB** | do api đặt |
| `/v1/*` khác, `/health`, `/__test__/*` | 404 | – |
| Không tìm thấy | `handle_errors 404` → `/<ngôn ngữ trong đường dẫn>/404/index.html` (mặc định `/en/404/`) | `no-store` |
| `www.<tên-miền>` | 301 → `https://<tên-miền>{uri}` | – |

Header (khác 3 app ở chỗ **không** gắn `X-Robots-Tag` ở production):
- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'; manifest-src 'self'; worker-src 'none'; upgrade-insecure-requests`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (không bật `preload` – khó gỡ).
- `Referrer-Policy: strict-origin-when-cross-origin` (landing không có token trong URL; giữ nguồn giới thiệu khi khách bấm sang Zalo/OTA).
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()`; `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY`; `Cross-Origin-Opener-Policy: same-origin`; `Cross-Origin-Resource-Policy: same-origin` (trừ `/og/*`).
- Log: dùng snippet `access_log` có sẵn (bỏ toàn bộ query, che IP /24). Không cần giữ `utm_*` trong log – UTM đã đi vào bộ đếm (mục 6).
- Staging: host `staging.<tên-miền>`, thêm `X-Robots-Tag: noindex, nofollow`.

---

## 2. Công nghệ

### 2.1 So sánh

| Tiêu chí | **Astro 6 (xuất tĩnh)** – chọn | Vite + bước prerender (React `renderToString` tự viết, hoặc Vike) | HTML + CSS thuần |
|---|---|---|---|
| JS gửi cho khách | 0 KB mặc định; chỉ JS nào mình viết | Thường kéo cả React (~45 KB gzip) để hydrate | 0 KB |
| Định tuyến đa ngôn ngữ | Có sẵn (`i18n.locales`, `prefixDefaultLocale`) [Nguồn: Astro i18n] | Tự viết | Nhân bản tay 3 bộ trang – dễ lệch |
| Sitemap + hreflang | `@astrojs/sitemap` có tùy chọn `i18n` sinh `xhtml:link` [Nguồn] | Tự viết | Tự viết tay |
| Tối ưu ảnh lúc build | `astro:assets` + sharp: `<Picture>` sinh AVIF/WebP nhiều cỡ, có cache giữa các lần build (`node_modules/.astro`) [Nguồn: Astro images] | Thêm plugin (`vite-imagetools`), tự nối | Script riêng |
| Nội dung 3 ngôn ngữ có kiểm | Content collections + schema zod (cùng thư viện với api – ADR-002) | Tự viết | Không |
| Hợp toolchain (ADR-012) | Astro 6 chạy trên **Vite 7**, cần **Node ≥ 22.12** – khớp đúng phiên bản monorepo [Nguồn: Astro v6 upgrade guide] | Khớp | Không cần build |
| CSP chặt | Được, với quy tắc build ở 2.4 | Được | Được |
| Dùng lại React của `packages/ui` | Được khi cần (R3: widget đặt phòng) | Được | Không |

### 2.2 Quyết định
- **Astro 6.x** (bản ổn định mới nhất khi OPS khóa lockfile; khớp Vite 7 của monorepo), `output: 'static'`, `build.format: 'directory'`, `trailingSlash: 'always'`.
- Đây là lựa chọn ứng viên đã nêu ở ADR-004 điểm 3. Không cần tiến trình Node ở production (giữ nguyên tắc ADR-004: Caddy phục vụ tệp tĩnh).
- Không chọn Vite + prerender: phải tự làm i18n, sitemap, ảnh – nhiều mã hơn mà kết quả như nhau. Không chọn HTML thuần: 3 ngôn ngữ × ~8 trang = ~24 tệp chép tay, rất dễ lệch nội dung và hreflang.
- Quy tắc ADR-012 áp dụng như mọi app: lockfile, `pnpm audit --prod` mức high, ESLint, Prettier, Vitest; Astro là **khung chạy production mới** → cần ADR (chính là ADR này); lên major mới của Astro cần ADR tiếp theo.

### 2.3 Cấu trúc app

```
product/apps/landing-web/
├── package.json              # @ottimo/landing-web; scripts: dev (port 5176), build, preview, typecheck (astro check), test (vitest)
├── astro.config.mjs          # site = LANDING_SITE_URL; i18n vi/en/ru, prefixDefaultLocale: true; sitemap i18n
├── public/                   # robots.txt (sinh lúc build theo môi trường), favicon, og/*.jpg
├── scripts/
│   ├── ingest-photos.mjs     # nạp ảnh gốc → master (mục 7) – chạy tay, KHÔNG chạy trong CI
│   └── check-dist.mjs        # kiểm dist: không script/style inline, ngân sách dung lượng, hreflang đủ
├── src/
│   ├── assets/photos/        # ảnh master đã tối ưu (vào git)
│   ├── content/              # nội dung theo ngôn ngữ, schema zod: pages/, listings/, site.json, photos.json
│   ├── components/           # .astro thuần (không framework)
│   ├── layouts/              # Base: <head> SEO, hreflang, JSON-LD
│   ├── pages/[lang]/...      # trang theo ngôn ngữ
│   ├── scripts/              # TS chạy trình duyệt: form, đếm sự kiện, (R3) widget đặt phòng
│   └── styles/               # CSS riêng landing – chỉ dùng biến token
└── src/**/*.test.ts          # Vitest: schema nội dung, đủ 3 ngôn ngữ, kiểm dist
```

Trang (mỗi trang × 3 ngôn ngữ): trang chủ, danh sách loại căn, chi tiết từng loại căn, thuê dài hạn (theo tháng), vị trí & Đà Lạt (chỉ đường), liên hệ / yêu cầu đặt phòng, chính sách (nội quy, hủy – văn bản DOM duyệt), thông báo xử lý dữ liệu cá nhân (bắt buộc vì có form), 404. R3 thêm trang đặt phòng (`/<lang>/book/`).

### 2.4 Quy tắc build để CSP chặt chạy được
- Cấm script inline có thực thi, thẻ `<style>`, thuộc tính `style=` và `on*=` trong `dist/**/*.html`. Ngoại lệ duy nhất: `<script type="application/ld+json">` (khối dữ liệu, không thực thi).
- Cấu hình: `build.inlineStylesheets: 'never'`, `vite.build.assetsInlineLimit: 0`.
- **Không dùng island của Astro** ở L0/L1 (island chèn script inline để hydrate). R3: widget đặt phòng React gắn bằng một module ngoài (`createRoot` trong tệp `.ts` riêng), không qua `client:*`. Không dùng `security.csp` của Astro (CSP ở dạng thẻ meta, không đặt được `frame-ancestors`) – CSP đặt ở header Caddy như 3 app kia [Nguồn: Astro CSP].
- `scripts/check-dist.mjs` chạy trong `test` sau `build`; vi phạm → CI đỏ. Playwright chạy trang `astro preview` với header CSP thật → không được có lỗi CSP trên console.

### 2.5 Token, font, nhận diện
- Dùng **chung token** với `packages/ui`: thêm export `@ottimo/ui/tokens.css` (trỏ tới `design/wireframes/assets/tokens.css` do UXD sinh) và `@ottimo/ui/fonts.css` (Lora 500/600, Be Vietnam Pro 400/500/600 tự host qua `@fontsource`, có tập ký tự Việt và Cyrillic cho tiếng Nga). **Không** import `hifi.css` (thành phần của app nhân viên, nặng và không cần).
- CSS của landing chỉ dùng biến token. Test chặn mã màu cứng (`#…`, `rgb(`) trong `src/styles` và `src/components`.
- Tông "Terracotta – Slow Living" của e-brochure **[Chưa xác minh]**. Nếu UXD đọc được brochure và INV xác nhận: UXD thêm token riêng cho landing (ví dụ màu nhấn đất nung, cỡ chữ lớn cho tiêu đề trang) trong `design/tools/gen_tokens.py`, có kiểm tương phản; **không** đổi `--oak` (nguyên tắc D1). Landing không tự đặt màu.
- Font: preload 1 tệp Lora 600 (tập Latin + Việt) cho tiêu đề đầu trang; còn lại `font-display: swap`.

---

## 3. Đa ngôn ngữ, đường dẫn, hreflang

- Mọi trang có tiền tố ngôn ngữ: `/vi/`, `/en/`, `/ru/`. Slug **giống nhau** giữa 3 ngôn ngữ (chữ Latin không dấu, ví dụ `/en/rooms/<slug>/`) – dễ ghép hreflang, không gãy link khi đổi bản dịch.
- `/` không có nội dung: Caddy chuyển hướng 302 theo `Accept-Language` (mục 1.4). Google khuyên dùng `x-default` cho trang chủ tự chuyển hướng [Nguồn: Google localized versions].
- Mỗi trang có trong `<head>`: `<html lang>`, `<link rel="canonical">` trỏ chính nó, `<link rel="alternate" hreflang="vi|en|ru">` trỏ **cả 3** bản (gồm chính nó – hreflang phải 2 chiều [Nguồn]) và `hreflang="x-default"` → `https://<tên-miền>/`. Sitemap cũng có `xhtml:link` (cùng nguồn dữ liệu, không lệch).
- Mã ngôn ngữ chỉ gồm ngôn ngữ (`vi`, `en`, `ru`), không gắn vùng.
- Một trang chỉ được phát hành khi đủ **3 bản dịch**. Test schema nội dung đỏ nếu thiếu. Bản tiếng Nga và tiếng Anh do người duyệt theo `content-guide.md` (không dịch máy cho văn bản pháp lý – như US-112 AC3).
- Chuỗi giao diện chung (menu, chân trang, nhãn và lỗi của form) thêm nhóm khóa `landing.*` vào `design/copy/strings-{vi,en,ru}.json` qua `gen_strings.py` (một quy trình dịch cho cả dự án). Build landing chỉ lấy khóa `landing.*` (như cách guest-web lọc khóa). Nội dung dài (giới thiệu, mô tả căn) nằm trong content collections của landing.
- Nút đổi ngôn ngữ là link thường tới cùng trang ở ngôn ngữ khác. Không tự đổi ngôn ngữ khi khách đã ở trong một trang.

---

## 4. Đặt phòng

### 4.1 Các nấc

| Nấc | Nội dung | Cần gì | Khi nào (PO xếp) |
|---|---|---|---|
| **L0** | Trang tĩnh 3 ngôn ngữ + nút **Zalo OA**, **gọi điện**, **email**; (tùy PO) link tới trang OTA | Tên miền, VPS production, ảnh, nội dung, link Zalo OA | Làm được ngay khi có tên miền + ảnh – không đụng lõi |
| **L1** | Form "Yêu cầu đặt phòng" → `booking_inquiry`; hộp thư trong Desk; bộ đếm truy cập | Endpoint công khai mới, màn Desk mới | Sau L0; đề xuất R3 sớm (cùng nhóm US-131) |
| **L2** | Lịch phòng trống + giá trực tiếp trên web (US-131) | API công khai chỉ đọc (4.7) | R3 |
| **L3** | Đặt + trả tiền ngay (US-132) | Giữ chỗ tạm từ web + cổng thanh toán + chính sách hủy | R4+, **ADR riêng** |

### 4.2 Nút liên hệ (L0)
- **Zalo OA**: link do INV lấy từ trang quản lý OA, lưu trong `src/content/site.json` (`contact.zaloOaUrl`). Dạng link chính xác **[Chưa xác minh]** – không tự ghép từ OA ID. **Không** nhúng widget/SDK chat của Zalo (script bên thứ ba, cookie, phải nới CSP, dữ liệu người xem gửi sang Zalo trước khi khách bấm).
- **Điện thoại**: `tel:` số hotline công khai (C0). **Email**: `mailto:` hộp thư đặt phòng. WhatsApp/Telegram cho khách nước ngoài: PO quyết (thêm link, không đổi kiến trúc).
- Bản đồ: ảnh bản đồ tĩnh (tạo một lần, ghi nguồn bản đồ theo giấy phép) + link "Mở Google Maps / Apple Maps". **Không** nhúng iframe Google Maps (cookie + dữ liệu sang Google → kéo theo banner đồng ý).
- Theo dõi bấm nút bằng bộ đếm (mục 6), không dùng pixel quảng cáo.

### 4.3 Form yêu cầu đặt phòng (L1) – vì sao tạo `booking_inquiry`, không tạo lead/giữ chỗ
- **Không tạo giữ chỗ** (`room_occupancy` loại `hold`): bot gửi hàng loạt sẽ khóa hết phòng và đẩy đóng phòng lên OTA. Giữ chỗ chỉ do nhân viên tạo bằng luồng có sẵn (`createHoldFromQuote`), vẫn qua ràng buộc chống trùng ADR-009.
- **Không tạo `lead` trực tiếp**: `lead.guest_id` bắt buộc (erd, SM-09). Tạo hồ sơ khách từ dữ liệu chưa kiểm sẽ (1) làm bẩn CRM bằng spam, (2) gộp nhầm: người lạ nhập SĐT của khách quen → dữ liệu lạ gắn vào hồ sơ thật (BR-951 chống trùng theo SĐT/email). Vì vậy tạo bản ghi **`booking_inquiry`** riêng; nhân viên mới là người **chuyển** thành lead (chọn/tạo hồ sơ khách bằng `GuestPicker` – có kiểm trùng như mọi nơi).
- Luồng: khách gửi → `202` + mã tham chiếu ngẫu nhiên 8 ký tự (khách dùng để nhắn Zalo) → thông báo trong app cho lễ tân/sale (không có tên, SĐT trong thông báo) + SSE `booking_inquiry.changed` → nhân viên nhận xử lý → liên hệ khách qua kênh khách chọn → **Chuyển thành lead** (`source='website'`) → báo giá → giữ chỗ → cọc → đơn `direct` + `directSource='website'` (enum đã có). Hoặc **Đóng** (lý do) / **Spam**.
- Trạng thái `booking_inquiry`: `new → in_progress → converted | closed | spam`; `closed/spam → in_progress` (mở lại, trong hạn lưu). BA thêm máy trạng thái mới (SM-xx).
- Chưa xử lý quá ngưỡng (DOM đặt, tính trong giờ trực `front_desk_hours` – BR-811) → mục "Cần chú ý".
- **Không tự gửi email/Zalo xác nhận** cho địa chỉ khách nhập ở L1: địa chỉ chưa được xác minh, kẻ xấu có thể dùng form để gửi thư rác tới người khác và làm hỏng uy tín tên miền gửi email. Trang hiện xác nhận ngay sau khi gửi. Khi Zalo OA/ZNS chạy thật (theo ESC mới của INT), lời chào tự động chỉ gửi **sau** khi nhân viên bấm "Đã liên hệ" hoặc khi chính khách nhắn OA trước.

### 4.4 Chống spam (theo tầng)
**Tầng 1 – mặc định, không bên thứ ba:**
1. **Ô bẫy (honeypot)**: một ô ẩn tên trông như thật (ví dụ `website`), ẩn bằng class CSS (không `style=`), `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`. Có giá trị → server trả **`202` giống hệt** nhưng không lưu; chỉ tăng bộ đếm `spam_honeypot`.
2. **Mã form có chữ ký (form token)**: trình duyệt lấy `GET …/form-token` khi khách bắt đầu điền. Token = HMAC(`PUBLIC_FORM_SIGNING_KEY`, cơ sở | thời điểm cấp | nonce). Server từ chối nếu gửi **< 3 giây** sau khi cấp, quá **2 giờ**, sai chữ ký, hoặc **dùng lại** (nonce ghi lại 2 giờ). Sai → `422 FORM_TOKEN_INVALID`; script tự lấy token mới và gửi lại **một** lần.
3. **Kiểm `Origin`** = `LANDING_BASE_URL` → sai: `403 ORIGIN_NOT_ALLOWED`. Chỉ nhận `application/json`, body ≤ 8 KB (Caddy chặn ở 16 KB), trường lạ → 422.
4. **Giới hạn tần suất** (bảng `rate_limit_counter` – SEC đã định chuyển bộ đếm IP sang DB ở R3): 5/giờ/IP và 20/ngày/IP; 3/ngày/liên hệ (khóa = HMAC của SĐT E.164 hoặc email đã chuẩn hóa); trần 500/ngày/cơ sở – vượt trần thì trả `202` nhưng bỏ, gửi **một** cảnh báo cho owner. Vượt giới hạn IP/liên hệ → `429 RATE_LIMITED` + `Retry-After`. IP lấy từ `X-Forwarded-For` do Caddy ghi (`TRUST_PROXY`), chỉ lưu dạng HMAC (`LOG_IP_HMAC_KEY`).
5. **Gắn cờ nghi ngờ** (không chặn): lời nhắn có URL, chữ khác bảng chữ cái của 3 ngôn ngữ, ngày đến quá xa → cờ `suspicious_flags[]` để nhân viên lọc.

**Tầng 2 – bật khi tầng 1 không đủ** (ARC quyết, không tốn tiền): spam lọt qua > 10 yêu cầu/tuần (đếm theo số bản ghi nhân viên đánh dấu Spam) trong 2 tuần liên tiếp → bật thử thách **proof-of-work tự host** (ví dụ ALTCHA – mã nguồn MIT, máy chủ xác minh chạy trong api, không gửi dữ liệu ra ngoài) [Nguồn: altcha.org; giấy phép phần máy chủ cần đọc lại kho mã trước khi dùng – Chưa xác minh]. Bật bằng tham số cơ sở, không cần sửa trang.

**Tầng 3 – chỉ khi có ESC**: Cloudflare Turnstile **[Chưa xác minh hiệu quả với site này]**. Gói Free miễn phí, không bắt buộc dùng Cloudflare proxy [Nguồn: Turnstile plans], cần thêm `https://challenges.cloudflare.com` vào `script-src` và `frame-src` [Nguồn: Turnstile CSP]. Gửi dữ liệu trình duyệt của khách sang Cloudflare (nước ngoài) → phải cập nhật thông báo xử lý dữ liệu và danh sách chuyển dữ liệu ra nước ngoài (ESC-002) → SEC đánh giá, INV quyết.

### 4.5 Kiểm dữ liệu đầu vào (zod dùng chung từ `packages/contracts`)
| Trường | Quy tắc |
|---|---|
| `stayType` | `short` \| `long` |
| `arrival` | ≥ hôm nay theo giờ cơ sở (ADR-008), ≤ hôm nay + 365 ngày (BR-112) |
| `departure` (short) | > `arrival`; 1–27 đêm (BR-112). Từ 28 đêm: server tự ghi `stayType=long` và giữ ngày đi (BR-108), không báo lỗi |
| `months` (long) | số nguyên; khoảng theo bảng kỳ hạn của DOM (BR mục báo giá dài hạn) [DOM chốt] |
| `adults`, `children` | `adults` ≥ 1; tổng ≤ sức chứa lớn nhất của loại căn chọn, hoặc của cơ sở nếu chưa chọn (BR-110). Tuổi trẻ em: chưa hỏi ở L1 (sale hỏi khi báo giá); L2 thêm `childrenAges[]` nếu DOM cần để tính giá |
| `listingSlug` | không bắt buộc; phải là loại căn đang công bố |
| `name` | 1–80 ký tự, bỏ ký tự điều khiển |
| `phone`, `email` | ít nhất một (`CONTACT_REQUIRED`); SĐT chuẩn hóa E.164 theo V-02; email theo định dạng |
| `preferredContact` | dùng lại enum có sẵn `phone, zalo, whatsapp, kakaotalk, email`; kênh trỏ tới phải có giá trị (`CONTACT_CHANNEL_EMPTY`) |
| `message` | ≤ 500 ký tự; có chuỗi giống số thẻ → `422 CARD_NUMBER_DETECTED` (SR-PAY-09), không lưu |
| `consent` | phải `true` + `consentVersion` khớp phiên bản thông báo xử lý dữ liệu hiện hành; sai → lỗi trường `CONSENT_REQUIRED`. Ô đồng ý **không** đánh sẵn |
| `locale` | `vi` \| `en` \| `ru` |
| `utm` | `source`, `medium`, `campaign` mỗi trường ≤ 64 ký tự `[a-z0-9._-]`; `landingPath` chỉ đường dẫn, ≤ 200 ký tự |
| `formToken`, `website` (bẫy) | như 4.4 |

### 4.6 Tối thiểu hóa dữ liệu cá nhân
- Chỉ hỏi: tên gọi, **một** cách liên hệ, ngày, số người, lời nhắn. **Không** hỏi quốc tịch, giấy tờ, ngày sinh, địa chỉ, số thẻ.
- Phân loại: tên, SĐT, email, lời nhắn = **C2** (`data-risk-assessment.md`). Không vào log, URL, thông báo đẩy, tiêu đề email. Logger hiện chỉ ghi method/route/mã/thời gian – giữ nguyên.
- Không lưu IP rõ, không lưu User-Agent. `ip_hmac` giữ 30 ngày để điều tra lạm dụng rồi xóa [SEC chốt hạn].
- Thời hạn lưu (SEC đặt biên, DOM/PO đặt mặc định, job xóa mới của worker):
  - `spam`: xóa cả bản ghi sau 7 ngày.
  - `closed` (không thành lead): xóa trường C2 sau 90 ngày, giữ số liệu không định danh (ngày, số người, loại căn, ngôn ngữ, UTM) cho DATA.
  - `converted`: xóa trường C2 ngay khi tạo lead (dữ liệu đã nằm ở hồ sơ khách/lead với hạn lưu riêng – T10).
- Yêu cầu của chủ thể dữ liệu (UC-30, SEC R-DSR): tìm theo SĐT/email phải quét cả `booking_inquiry`.
- Quyền xem: `owner`, `manager`, `front_desk_lead`, `front_desk`, `sales_staff`. **Không** cho `collaborator` (CTV bên ngoài). BA thêm màn S-xx và hành động A-xx vào `rbac-matrix.md`.
- Thông báo xử lý dữ liệu (trang `/<lang>/privacy/`) có phiên bản; nội dung pháp lý do SEC soạn, luật sư xác nhận (cùng ESC-001). Toàn bộ dữ liệu form nằm trên VPS ở VN.

### 4.7 L2 (R3, US-131): API phòng trống + giá công khai
**Đơn vị công bố**: bảng mới `public_listing` (owner cấu hình): mỗi "loại căn công khai" ánh xạ tới 1 nhóm căn hoặc danh sách căn (giống `channel_mapping` cho OTA). Nội dung (tên, mô tả, ảnh) nằm trong landing theo `slug`; API chỉ biết `slug`. Bản đầu dự kiến 3 nhóm (Lầu 1–2, Căn N, Căn N+) hoặc 5 loại theo 5 bộ ảnh – UXD/PO chọn với INV.

**Endpoint** (chỉ đọc, `security: []`):
- `getPublicAvailability(from, to)`: lịch theo ngày, mỗi loại căn: `available` (true/false) và giá một đêm trực tiếp khi còn phòng. Cửa sổ ≤ 62 đêm mỗi lần gọi, trong 365 ngày (BR-112).
- `getPublicOffers(arrival, departure, adults, children, listing?)`: mỗi loại căn: còn hay hết, tổng tiền, giá trung bình/đêm, giảm giá đã áp (mã BR), phụ thu người, % cọc (BR-305), khóa chính sách hủy để trang hiện văn bản. Chỉ ngắn ngày (1–27 đêm). Từ 28 đêm: trả gợi ý "thuê dài hạn, giá từ …/tháng" và mời gửi yêu cầu (báo giá dài hạn cần nhóm khách, gói dọn – sale làm).

**Ánh xạ module** (ADR-001: chỉ gọi qua `modules/<x>/public`):
- Module mới `public-site` trong api (controller công khai + projection). Không có bảng nghiệp vụ riêng ngoài `public_listing`, `booking_inquiry`, `web_metric_daily`.
- Phòng trống: `reservations/public` – cùng nguồn `room_occupancy` như rack và kênh (ADR-009 điểm 4), cùng quy tắc với `searchAvailability` (căn ngừng bán, OOO, giữ chỗ, đơn đều tính là bận).
- Giá: `reservations/public` – cùng bộ tính của `calculateQuote` (US-080), kênh `direct` + `directSource='website'`: giá niêm yết từng căn (BR-101), lịch giá cuối tuần/ngày đặc biệt (BR-104), giảm theo số đêm (BR-107), làm tròn (BR-005), phụ thu người (BR-110). Giá của loại căn = **giá thấp nhất** trong các căn còn trống của loại đó cho cả khoảng ngày.
- Đường vào trước ngữ cảnh RLS: hàm `SECURITY DEFINER` hẹp `public_resolve_property(slug)` (như webhook theo `propertySlug` – erd 2.4) trả `property_id` khi cơ sở `active` và bật website.

**Không lộ dữ liệu nội bộ** (projection theo danh sách cho phép, test hợp đồng kiểm):
- Không số căn, không `roomId`, không mã nhóm nội bộ – chỉ `listingSlug`.
- Không số phòng còn lại – chỉ `available`. Cờ "sắp hết phòng" chỉ khi owner bật tham số `public_site.show_scarcity` (mặc định tắt).
- Không lý do bận (đơn hay OOO), không hoa hồng, không `ottimoRemainingVnd`, không phí kênh, không giá OTA.
- Lỗi chung, cùng hình dạng phản hồi; ngoài cửa sổ → 422 `VALIDATION_FAILED`.

**Cache**:
- Trong api: cache RAM (LRU ≤ 1.000 mục) theo khóa tham số, sống 60 giây; **xóa ngay** khi có NOTIFY `occupancy.changed` hoặc `rates.changed` (api đã LISTEN cho SSE – thêm 2 kênh). Một replica api (giả định SEC đã ghi) → cache RAM đúng; lên > 1 replica vẫn chấp nhận vì sống ngắn.
- HTTP: `Cache-Control: public, max-age=30, stale-while-revalidate=30` + `ETag`. Caddy không cache (không có module cache) – chỉ trình duyệt cache.
- Ngân sách: p95 < 150 ms khi chưa có cache, < 20 ms khi có cache (10 căn).

**Giới hạn tần suất**: 60/phút/IP và 1.000/ngày/IP cho mỗi endpoint đọc; vượt → 429.

**Không giữ chỗ, giá chỉ để tham khảo**: form ở L2 gửi kèm `offerSnapshot` (tổng tiền, thời điểm tính, phiên bản tham số giá). Màn Desk hiện "Giá trên web lúc gửi" cạnh giá tính lại; lệch thì sale quyết. Trang ghi rõ "Giá tham khảo, nhân viên xác nhận".

**Chính sách giá công khai** (thuộc PO/DOM, có thể cần ESC của PO): có hiện giá trên web không; giá trực tiếp thấp hơn OTA có vướng điều khoản ngang giá (rate parity) của OTA không [Chưa xác minh]; hiện giá dài hạn "từ …" thế nào khi khách nước ngoài +10%. Kiến trúc không đổi theo lựa chọn – tham số `public_site.show_prices`.

### 4.8 Phác thảo bổ sung OpenAPI (ARC đưa vào `openapi.yaml` ở bước hợp đồng R3 – **không sửa file ở đây**)

```yaml
tags:
  - name: public-site
    description: Website ở tên miền gốc (ADR-014). Không phiên, không cookie. Chỉ proxy từ origin landing.

paths:
  /v1/public/properties/{propertySlug}/form-token:
    parameters: [{ $ref: '#/components/parameters/PropertySlug' }]
    get:
      tags: [public-site]
      operationId: getPublicFormToken
      summary: Mã form có chữ ký, dùng một lần (ADR-014 4.4)
      security: []
      x-roles: [public]
      x-rate-limit: 30/giờ/IP
      x-stories: [US-131]
      responses:
        '200':
          description: OK – kèm Cache-Control no-store
          content:
            application/json:
              schema: { $ref: '#/components/schemas/PublicFormToken' }
              example: { token: 'v1.Zm9y…', notBefore: '2026-11-02T10:00:03+07:00', expiresAt: '2026-11-02T12:00:00+07:00' }
        '404': { $ref: '#/components/responses/NotFound' }
        '429': { $ref: '#/components/responses/RateLimited' }

  /v1/public/properties/{propertySlug}/booking-inquiries:
    parameters: [{ $ref: '#/components/parameters/PropertySlug' }]
    post:
      tags: [public-site]
      operationId: createBookingInquiry
      summary: Khách gửi yêu cầu đặt phòng từ website – tạo booking_inquiry, KHÔNG tạo lead/giữ chỗ
      description: |
        Kiểm Origin = LANDING_BASE_URL; form token; ô bẫy (có giá trị → 202 giống hệt, không lưu).
        Không trả lại dữ liệu khách đã nhập. Không gửi email/Zalo tự động (ADR-014 4.3).
      security: []
      x-roles: [public]
      x-classification: C2
      x-rate-limit: 5/giờ/IP; 20/ngày/IP; 3/ngày/liên hệ; 500/ngày/cơ sở
      x-stories: [US-131]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/BookingInquiryInput' }
            example:
              formToken: 'v1.Zm9y…'
              website: ''
              stayType: short
              arrival: '2026-11-20'
              departure: '2026-11-23'
              adults: 2
              children: 0
              listingSlug: can-n
              name: Anna
              phone: '+79123456789'
              preferredContact: whatsapp
              message: 'Late arrival around 22:00'
              locale: en
              consent: true
              consentVersion: '2026-11-01'
              utm: { source: instagram, medium: social, campaign: autumn }
              landingPath: /en/rooms/can-n/
      responses:
        '202':
          description: Đã nhận
          content:
            application/json:
              schema: { $ref: '#/components/schemas/BookingInquiryAccepted' }
              example: { refCode: 'W7K3QX9P', replyWindowKey: within_front_desk_hours }
        '403': { description: 'ORIGIN_NOT_ALLOWED', content: { application/problem+json: { schema: { $ref: '#/components/schemas/Problem' } } } }
        '422': { $ref: '#/components/responses/ValidationFailed' }   # VALIDATION_FAILED (CONTACT_REQUIRED, CONTACT_CHANNEL_EMPTY, CONSENT_REQUIRED…), FORM_TOKEN_INVALID, CARD_NUMBER_DETECTED
        '429': { $ref: '#/components/responses/RateLimited' }

  /v1/public/properties/{propertySlug}/site-events:
    parameters: [{ $ref: '#/components/parameters/PropertySlug' }]
    post:
      tags: [public-site]
      operationId: recordSiteEvent
      summary: Đếm sự kiện tổng hợp (ADR-014 mục 6) – không định danh
      security: []
      x-roles: [public]
      x-rate-limit: 120/giờ/IP
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/SiteEvent' }
      responses:
        '204': { description: Đã ghi (hoặc bỏ qua nếu là bot/GPC) }
        '429': { $ref: '#/components/responses/RateLimited' }

  /v1/public/properties/{propertySlug}/availability:     # R3 – L2
    parameters: [{ $ref: '#/components/parameters/PropertySlug' }]
    get:
      tags: [public-site]
      operationId: getPublicAvailability
      security: []
      x-roles: [public]
      x-rate-limit: 60/phút/IP; 1000/ngày/IP
      x-stories: [US-131]
      parameters:
        - { name: from, in: query, required: true, schema: { $ref: '#/components/schemas/LocalDate' } }
        - { name: to, in: query, required: true, schema: { $ref: '#/components/schemas/LocalDate' }, description: '≤ from + 62 đêm; ≤ hôm nay + 365 (BR-112)' }
      responses:
        '200':
          description: OK – Cache-Control public, max-age=30, stale-while-revalidate=30; ETag
          content:
            application/json:
              schema: { $ref: '#/components/schemas/PublicAvailability' }
              example:
                from: '2026-11-20'
                to: '2026-11-23'
                currency: VND
                listings:
                  - slug: lau-1-2
                    nights:
                      - { date: '2026-11-20', available: true, nightlyRateVnd: 667000 }
                      - { date: '2026-11-21', available: true, nightlyRateVnd: 767000 }
                      - { date: '2026-11-22', available: false }
        '422': { $ref: '#/components/responses/ValidationFailed' }
        '429': { $ref: '#/components/responses/RateLimited' }

  /v1/public/properties/{propertySlug}/offers:            # R3 – L2
    parameters: [{ $ref: '#/components/parameters/PropertySlug' }]
    get:
      tags: [public-site]
      operationId: getPublicOffers
      security: []
      x-roles: [public]
      x-rate-limit: 60/phút/IP; 1000/ngày/IP
      x-stories: [US-131]
      parameters:
        - { name: arrival, in: query, required: true, schema: { $ref: '#/components/schemas/LocalDate' } }
        - { name: departure, in: query, required: true, schema: { $ref: '#/components/schemas/LocalDate' } }
        - { name: adults, in: query, required: true, schema: { type: integer, minimum: 1 } }
        - { name: children, in: query, schema: { type: integer, minimum: 0, default: 0 } }
        - { name: listing, in: query, schema: { type: string, pattern: '^[a-z0-9-]{2,40}$' } }
      responses:
        '200':
          description: OK – cùng header cache như getPublicAvailability
          content:
            application/json:
              schema: { $ref: '#/components/schemas/PublicOffers' }
        '422': { $ref: '#/components/responses/ValidationFailed' }
        '429': { $ref: '#/components/responses/RateLimited' }

  /v1/properties/{propertyId}/booking-inquiries:
    parameters: [{ $ref: '#/components/parameters/PropertyId' }]
    get:
      tags: [quotes]
      operationId: listBookingInquiries
      summary: Hộp thư "Yêu cầu từ website" của Desk
      x-roles: [owner, manager, front_desk_lead, front_desk, sales_staff]
      x-stories: [US-131]
      parameters:
        - { name: status, in: query, schema: { type: array, items: { $ref: '#/components/schemas/BookingInquiryStatus' } } }
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                required: [data, page]
                properties:
                  data: { type: array, items: { $ref: '#/components/schemas/BookingInquiry' } }
                  page: { $ref: '#/components/schemas/PageInfo' }

  /v1/properties/{propertyId}/booking-inquiries/{inquiryId}:
    get: { operationId: getBookingInquiry, x-roles: [owner, manager, front_desk_lead, front_desk, sales_staff] }   # ETag

  /v1/properties/{propertyId}/booking-inquiries/{inquiryId}/actions/{action}:
    post:
      operationId: transitionBookingInquiry
      summary: claim | close | mark-spam | reopen (SM-xx của BA)
      x-roles: [owner, manager, front_desk_lead, front_desk, sales_staff]
      parameters: [IdempotencyKey, IfMatch]   # theo quy ước chung
      requestBody: { content: { application/json: { schema: { type: object, properties: { reasonCode: { type: string }, note: { type: string, maxLength: 300 } } } } } }
      responses: { '200': BookingInquiry, '409': INVALID_TRANSITION, '412': VERSION_CONFLICT }

  /v1/properties/{propertyId}/booking-inquiries/{inquiryId}/actions/convert:
    post:
      operationId: convertBookingInquiry
      summary: Chuyển thành lead (source=website) với hồ sơ khách nhân viên đã chọn/tạo; xóa trường C2 của inquiry
      x-roles: [owner, manager, front_desk_lead, front_desk, sales_staff]
      parameters: [IdempotencyKey, IfMatch]
      requestBody: { required: true, content: { application/json: { schema: { type: object, required: [guestId], properties: { guestId: { $ref: '#/components/schemas/Uuid' } } } } } }
      responses: { '201': Lead, '409': INVALID_TRANSITION }

components:
  parameters:
    PropertySlug: { name: propertySlug, in: path, required: true, schema: { type: string, pattern: '^[a-z0-9-]{3,40}$' } }
  schemas:
    PublicFormToken:
      type: object
      required: [token, notBefore, expiresAt]
      properties: { token: { type: string, maxLength: 200 }, notBefore: { type: string, format: date-time }, expiresAt: { type: string, format: date-time } }
    BookingInquiryInput:
      type: object
      additionalProperties: false
      required: [formToken, stayType, arrival, adults, name, preferredContact, locale, consent, consentVersion]
      properties:
        formToken: { type: string, maxLength: 200, writeOnly: true }
        website: { type: string, maxLength: 200, description: 'Ô bẫy – người thật để trống' }
        stayType: { type: string, enum: [short, long] }
        arrival: { $ref: '#/components/schemas/LocalDate' }
        departure: { $ref: '#/components/schemas/LocalDate' }
        months: { type: integer, minimum: 1 }
        adults: { type: integer, minimum: 1, maximum: 12 }
        children: { type: integer, minimum: 0, maximum: 8, default: 0 }
        listingSlug: { type: string, pattern: '^[a-z0-9-]{2,40}$' }
        name: { type: string, minLength: 1, maxLength: 80, x-classification: C2 }
        phone: { type: string, maxLength: 32, x-classification: C2 }
        email: { type: string, format: email, maxLength: 254, x-classification: C2 }
        preferredContact: { type: string, enum: [phone, zalo, whatsapp, kakaotalk, email] }
        message: { type: string, maxLength: 500, x-classification: C2 }
        locale: { $ref: '#/components/schemas/Locale' }
        consent: { type: boolean, const: true }
        consentVersion: { type: string, maxLength: 20 }
        offerSnapshot:          # R3 – L2
          type: object
          properties: { totalVnd: { $ref: '#/components/schemas/MoneyVnd' }, computedAt: { type: string, format: date-time }, priceVersion: { type: string } }
        utm: { $ref: '#/components/schemas/Utm' }
        landingPath: { type: string, pattern: '^/[a-z0-9/_-]{0,199}$' }
    Utm:
      type: object
      additionalProperties: false
      properties:
        source: { type: string, pattern: '^[a-z0-9._-]{1,64}$' }
        medium: { type: string, pattern: '^[a-z0-9._-]{1,64}$' }
        campaign: { type: string, pattern: '^[a-z0-9._-]{1,64}$' }
    BookingInquiryAccepted:
      type: object
      required: [refCode]
      properties:
        refCode: { type: string, pattern: '^[0-9A-HJKMNP-TV-Z]{8}$', description: 'Ngẫu nhiên (Crockford base32), không tăng dần' }
        replyWindowKey: { type: string, description: 'Khóa chuỗi UXD: thời gian phản hồi dự kiến' }
    BookingInquiryStatus: { type: string, enum: [new, in_progress, converted, closed, spam] }
    BookingInquiry:
      type: object
      description: Bản nhìn của nhân viên. Trường C2 vắng sau khi đã xóa theo hạn (piiPurgedAt có giá trị).
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        refCode: { type: string }
        status: { $ref: '#/components/schemas/BookingInquiryStatus' }
        stayType: { type: string, enum: [short, long] }
        arrival: { $ref: '#/components/schemas/LocalDate' }
        departure: { $ref: '#/components/schemas/LocalDate' }
        months: { type: integer }
        adults: { type: integer }
        children: { type: integer }
        listingSlug: { type: string }
        name: { type: string, x-classification: C2 }
        phone: { type: string, description: 'E.164 có dấu +', x-classification: C2 }
        email: { type: string, x-classification: C2 }
        preferredContact: { type: string }
        message: { type: string, x-classification: C2 }
        locale: { $ref: '#/components/schemas/Locale' }
        suspiciousFlags: { type: array, items: { type: string, enum: [contains_url, unexpected_script, far_future] } }
        offerSnapshot: { type: object }
        utmSource: { type: string }
        assignedUserId: { $ref: '#/components/schemas/Uuid' }
        leadId: { $ref: '#/components/schemas/Uuid' }
        createdAt: { type: string, format: date-time }
        piiPurgedAt: { type: string, format: date-time }
        version: { type: integer }
        allowedActions: { type: array, items: { type: object } }
    SiteEvent:
      type: object
      additionalProperties: false
      required: [type, path, locale]
      properties:
        type: { type: string, enum: [pageview, cta_zalo, cta_phone, cta_email, cta_ota, form_start, form_submit, booking_search] }
        path: { type: string, pattern: '^/[a-z0-9/_-]{0,199}$' }
        locale: { $ref: '#/components/schemas/Locale' }
        refHost: { type: string, maxLength: 100, description: 'Chỉ tên miền của trang giới thiệu, không đường dẫn' }
        utm: { $ref: '#/components/schemas/Utm' }
    PublicAvailability:
      type: object
      required: [from, to, currency, listings]
      properties:
        from: { $ref: '#/components/schemas/LocalDate' }
        to: { $ref: '#/components/schemas/LocalDate' }
        currency: { type: string, const: VND }
        listings:
          type: array
          items:
            type: object
            required: [slug, nights]
            properties:
              slug: { type: string }
              nights:
                type: array
                items:
                  type: object
                  required: [date, available]
                  properties:
                    date: { $ref: '#/components/schemas/LocalDate' }
                    available: { type: boolean }
                    nightlyRateVnd: { $ref: '#/components/schemas/MoneyVnd' }
                    fewLeft: { type: boolean, description: 'Chỉ có khi owner bật public_site.show_scarcity' }
    PublicOffers:
      type: object
      required: [arrival, departure, nights, offers]
      properties:
        arrival: { $ref: '#/components/schemas/LocalDate' }
        departure: { $ref: '#/components/schemas/LocalDate' }
        nights: { type: integer }
        priceVersion: { type: string }
        offers:
          type: array
          items:
            type: object
            required: [listingSlug, available]
            properties:
              listingSlug: { type: string }
              available: { type: boolean }
              totalVnd: { $ref: '#/components/schemas/MoneyVnd' }
              nightlyAvgVnd: { $ref: '#/components/schemas/MoneyVnd' }
              extraGuestFeeVnd: { $ref: '#/components/schemas/MoneyVnd' }
              discounts: { type: array, items: { type: object, properties: { ruleRef: { type: string, example: BR-107 }, pct: { type: number } } } }
              depositPct: { type: number, description: 'BR-305' }
              cancellationPolicyKey: { type: string }
              maxOccupancy: { type: integer }
        longStayHint:
          type: object
          description: 'Có khi ≥ 28 đêm (BR-108) – mời gửi yêu cầu thuê dài hạn'
          properties: { fromMonthlyVnd: { $ref: '#/components/schemas/MoneyVnd' } }
```

Mã lỗi mới cho bảng `Problem.code`: `ORIGIN_NOT_ALLOWED` (403 – Origin không phải landing), `FORM_TOKEN_INVALID` (422 – mã form sai/hết hạn/quá nhanh/dùng lại; client lấy mã mới và gửi lại một lần). Mã trường mới: `CONSENT_REQUIRED`. Dùng lại: `VALIDATION_FAILED`, `CONTACT_REQUIRED`, `CONTACT_CHANNEL_EMPTY`, `CARD_NUMBER_DETECTED`, `RATE_LIMITED`, `INVALID_TRANSITION`, `VERSION_CONFLICT`.
SSE thêm `booking_inquiry.changed` (id; FD+, SAL). Thông báo mới `booking_inquiry.new` – nội dung chỉ có ngày, số người, ngôn ngữ; **không** tên/SĐT.

### 4.9 Phác thảo dữ liệu (ARC đưa vào `erd.md` cùng bước hợp đồng R3)
| Bảng | Cột chính | Ghi chú |
|---|---|---|
| `public_listing` | `id`, `organization_id`, `property_id`, `slug` (UK theo cơ sở), `room_group_id` null, `published`, `sort_order` + bảng nối `public_listing_room(listing_id, room_id)` | RLS theo cơ sở; chỉ owner/manager sửa |
| `booking_inquiry` | `id` (uuid v7), `organization_id`, `property_id`, `ref_code` (UK, ngẫu nhiên), `status`, `stay_type`, `arrival_date`, `departure_date` null, `months` null, `adults`, `children`, `listing_id` null, `locale`, `preferred_contact`, `contact_name` (C2), `phone_e164` (C2), `email` (C2), `message` (C2), `consent_version`, `consent_at`, `offer_snapshot` jsonb null, `utm_source/medium/campaign`, `landing_path`, `suspicious_flags` text[], `ip_hmac` null, `assigned_user_id`, `lead_id` null, `closed_reason_code`, `pii_purged_at`, `created_at`, `updated_at`, `version` | RLS; CHECK có SĐT hoặc email khi `pii_purged_at` null; chỉ mục `(property_id, status, created_at)` |
| `web_metric_daily` | PK (`property_id`, `day`, `path`, `locale`, `event`, `ref_host`, `utm_source`, `utm_medium`, `utm_campaign`, `device_class`), `count` | Không định danh; UPSERT `count = count + 1` |
| `public_form_nonce` hoặc khóa trong `rate_limit_counter` | `nonce_hash`, `expires_at` | Chống dùng lại form token; xóa khi hết hạn |
| Tham số cơ sở mới | `public_site.enabled`, `public_site.inquiries_enabled`, `public_site.show_prices` (R3), `public_site.show_scarcity` (mặc định tắt), `public_site.spam_pow_enabled` (tầng 2), `web_inquiry.response_minutes`, `web_inquiry.retention_days_closed`, `web_inquiry.retention_days_spam`, `privacy_notice_version` | DOM/PO đặt mặc định; SEC đặt biên cho tham số hạn lưu và chống spam (`x-security-parameters`) |
| Job mới (worker) | `booking_inquiry.purge` (hằng ngày), `booking_inquiry.attention` (tick theo Clock, trong giờ trực), dọn `public_form_nonce` | Theo mẫu job đúng-một-lần (architecture 9.1) |

---

## 5. SEO

- **HTML tĩnh đầy đủ nội dung** cho từng ngôn ngữ (không dựng bằng JS) → máy tìm kiếm đọc được ngay.
- Mỗi trang: `<title>` riêng (≤ 60 ký tự), `meta description` (≤ 160 ký tự), canonical, hreflang (mục 3), Open Graph (`og:title`, `og:description`, `og:image` JPEG 1200×630 ở `/og/`, `og:locale` + `og:locale:alternate`), `twitter:card=summary_large_image`, `theme-color` theo token `--bg`, favicon từ logo (L-A).
- `sitemap-index.xml` sinh bởi `@astrojs/sitemap` (tùy chọn `i18n`), chỉ gồm trang đã phát hành; không gồm 404, trang cảm ơn.
- `robots.txt` (production): `User-agent: *`, `Allow: /`, `Disallow: /v1/`, `Sitemap: https://<tên-miền>/sitemap-index.xml`. Staging: `Disallow: /` + header `noindex`.
- **JSON-LD** (dữ liệu từ `site.json`, một nguồn cho cả trang và schema):
  - Trang chủ: `Hotel` (kiểu con của `LodgingBusiness`) với `@id` `https://<tên-miền>/#hotel`, `name`, `url`, `image`, `address` (`PostalAddress` – địa chỉ đầy đủ do INV cung cấp), `geo`, `telephone`, `email`, `checkinTime`/`checkoutTime` (theo BR-401 – hiện là giả định chờ INV xác nhận), `amenityFeature`, `availableLanguage`, `numberOfRooms` (10), `sameAs` (link trang OTA, Zalo OA, mạng xã hội) [Nguồn: schema.org Hotel, LodgingBusiness]; kèm `WebSite` có `inLanguage`.
  - Trang loại căn: `HotelRoom` có `containedInPlace` → `#hotel`, `occupancy`, `bed`, `floorSize`, `amenityFeature`; `BreadcrumbList`.
  - **Không** gắn `aggregateRating`/`review` tự đăng: Google không hiện sao cho trang mà chính cơ sở kiểm soát đánh giá [Nguồn: Google review snippet]. Không dùng `VacationRental` (chỉ dành cho đối tác có Hotel Center) [Nguồn: Google vacation rental]. Không đưa giá tĩnh vào schema (dễ lỗi thời); R3 cân nhắc khi có API giá.
- Kiểm tra trong CI: Lighthouse CI điểm SEO ≥ 95; test kiểm mỗi trang có đủ title, description, canonical, 4 thẻ hreflang, JSON-LD hợp lệ (parse được, có `@type`).
- Việc ngoài code (PO nhắc INV): tạo/nhận quyền **Google Business Profile** và **Google Search Console** (xác minh bằng bản ghi DNS TXT – không gắn script).

## 6. Đo lường truy cập (bảo vệ quyền riêng tư)

### 6.1 Quyết định
- Tự đếm **tổng hợp theo ngày** trong DB của OTTIMO: script nhỏ gửi `navigator.sendBeacon` tới `/v1/public/.../site-events` (cùng origin, CSP `connect-src 'self'` đã cho phép).
- Sự kiện: xem trang, bấm Zalo/điện thoại/email/OTA, bắt đầu điền form, gửi form, (R3) tìm phòng.
- Lưu: ngày, đường dẫn, ngôn ngữ, loại sự kiện, tên miền nguồn giới thiệu, `utm_*`, loại thiết bị (di động/máy tính – suy ra từ User-Agent rồi bỏ User-Agent). **Không** cookie, không localStorage, không IP, không mã phiên, không vân tay trình duyệt.
- Bỏ qua (không đếm): bot tự khai trong User-Agent; trình duyệt gửi `Sec-GPC: 1`.
- Phễu chuyển đổi thật (website → yêu cầu → lead → đơn `directSource='website'` → doanh thu) nằm sẵn trong DB → DATA tính G3 (kênh trực tiếp ≥ 35%) không cần công cụ ngoài. DATA định nghĩa chỉ số trong `metrics-definitions.md`.

### 6.2 Phương án đã cân nhắc
| Phương án | Vì sao chưa chọn |
|---|---|
| Google Analytics 4, Meta Pixel | Cookie + dữ liệu ra nước ngoài → bắt buộc banner đồng ý, nới CSP, thêm bên xử lý dữ liệu (ESC-002) |
| Umami tự host (MIT, dùng PostgreSQL) | Tốt, không cookie; nhưng thêm 1 container (~200–300 MB RAM [Chưa xác minh]), thêm giao diện quản trị phải vá và bảo vệ. Dùng khi marketing cần phân tích sâu hơn bộ đếm – ARC quyết lúc đó, không tốn tiền |
| Plausible tự host | Cần ClickHouse – nặng cho VPS 4 GB |
| Đọc log Caddy (GoAccess) | Log đã bỏ query và che IP theo yêu cầu bảo mật → mất UTM; không đếm được bấm nút |

### 6.3 Banner đồng ý
**Không cần banner** khi giữ đủ 4 điều kiện: (1) không cookie/lưu trữ trên máy khách cho đo lường; (2) không gửi dữ liệu cho bên thứ ba; (3) không lưu IP hay định danh; (4) thông báo xử lý dữ liệu mô tả việc đếm. Theo `data-risk-assessment.md`, khung pháp lý VN không có "lợi ích hợp pháp" – nên thiết kế **không xử lý dữ liệu cá nhân** cho đo lường thay vì dựa vào ngoại lệ. **[Chưa xác minh – SEC xác nhận, luật sư ánh xạ theo Luật 91/2025]**.
Thêm bất kỳ thứ nào sau đây → **bắt buộc** banner đồng ý (tùy chọn từ chối ngang hàng nút đồng ý) + SEC review + có thể ESC: pixel quảng cáo, GA4, nhúng Google Maps/YouTube, widget chat Zalo, Turnstile (tầng 3).

## 7. Đường ống ảnh

1. **Ảnh gốc** (Drive của INV, PNG 4–60 MB): chỉ chép vào `00-brief/context/landing/raw/` trên máy người làm (đã `.gitignore`). Không đưa lên CI, không lên VPS. Việc tải về chờ INV cho phép (ORC hỏi).
2. **Chọn ảnh và đặt vào ô có tên** (UXD với INV): tệp `src/content/photos.json` khai mỗi ô ảnh: `slot` (ví dụ `hero`, `facade`, `lobby`, `listing-<slug>-1`…), tệp gốc, SHA-256 của tệp gốc (truy vết), điểm lấy nét, tỉ lệ khung, chữ thay thế (`alt`) **3 ngôn ngữ**, ghi công. Trang chỉ tham chiếu `slot`. Ô chưa có ảnh hiện **ảnh giữ chỗ** theo token (khối màu + tên ô), build vẫn chạy; trang có ô trống không được phát hành production (test kiểm).
3. **Kiểm ảnh trước khi dùng** (UXD tick trong `photos.json`): không có mặt người nếu chưa có đồng ý; không thấy mật khẩu Wi-Fi, mã bàn phím khóa cửa, giấy tờ, đồ cá nhân của khách, biển số xe.
4. **Script nạp** `scripts/ingest-photos.mjs` (chạy tay trên máy UXD/FE, nhận đường dẫn thư mục gốc bằng tham số; chạy `node` từ thư mục app, không từ thư mục ảnh): đọc tệp gốc bằng sharp → chuyển sRGB, **bỏ toàn bộ metadata** (EXIF, GPS), cạnh dài 2.560 px (ảnh hero) hoặc 2.000 px, lưu **master** WebP chất lượng ~90 (hoặc JPEG ~88 – UXD chọn) vào `src/assets/photos/<slot>.webp`; từ chối ảnh gốc nhỏ hơn 1.600 px cạnh dài. Ngân sách: mỗi master ≤ 800 KB, **tổng ≤ 30 MB trong git**. Không dùng Git LFS (thêm hạn mức, thêm công cụ).
5. **Build trong CI**: `<Picture>` của Astro sinh **AVIF + WebP**, các bề rộng 480/800/1200/1600/2000 (hero thêm 2400), tên băm trong `/_astro/` (cache 1 năm). Luôn có `width`/`height` (không xô lệch bố cục – CLS); ảnh đầu trang `loading="eager"` + `fetchpriority="high"`, còn lại `loading="lazy"` + `decoding="async"`. Ảnh chia sẻ mạng xã hội: JPEG 1200×630 ở `/og/`.
6. **Cache build**: Astro lưu ảnh đã xử lý ở `node_modules/.astro` [Nguồn: Astro images] → CI cache thư mục này (khóa = hash `src/assets/photos/**` + phiên bản Astro); `Dockerfile.web` dùng BuildKit `--mount=type=cache` cho cùng thư mục. Mục tiêu giữ CI < 5 phút khi không đổi ảnh (ADR-012); lần đầu mã hóa AVIF có thể lâu hơn [Chưa xác minh thời gian].
7. **Kiểm dung lượng** (`check-dist.mjs`): ảnh hero AVIF 1200w ≤ 200 KB; mọi biến thể ≤ 450 KB; tổng `dist` ≤ 80 MB. Vượt → CI đỏ.
8. **E-brochure**: chưa đọc được → **[Chưa xác minh]**. Chỉ phát hành bản PDF nếu INV muốn; khi đó nén ≤ 5 MB, kiểm nội dung (giá cũ, thông tin cá nhân) trước, phục vụ ở `/brochure/` với `Content-Disposition: attachment`.

## 8. Hosting và chi phí so với ADR-010

| Hạng mục | ADR-010 / hosting-plan (PA2) | Thay đổi do landing (phương án A) |
|---|---|---|
| VPS production 2 vCPU/4 GB | ~264.000 đ | **0 đ thêm**. RAM 0 (Caddy phục vụ tĩnh), CPU không đáng kể |
| Đĩa | 40 GB | +~100–200 MB cho 2 bản build (bản đang chạy + bản quay lui) [ước của đội] |
| Băng thông ra | rất thấp | Ước 5–20 GB/tháng với 100–400 lượt xem/ngày × ~1,5 MB [Chưa xác minh – chưa có số lượt truy cập]. OPS kiểm hạn mức băng thông (đặc biệt **băng thông quốc tế**) của gói VPS khi xin báo giá |
| Staging | VPS phụ / chung (PA1) | Thêm host `staging.<tên-miền>` trên VPS staging – 0 đ |
| Tên miền | ~30.000–70.000 đ/tháng (đã tính) | 0 đ thêm – dùng tên miền gốc + `www` |
| TLS | Let's Encrypt | Thêm chứng chỉ cho gốc + `www` – 0 đ |
| CI (GitHub Actions) | gói miễn phí | +1–5 phút mỗi lần đổi landing [Chưa xác minh hạn mức repo riêng tư] |
| Container mới | – | **Không có** (đo lường tự đếm, không Umami) |
| Tùy chọn sau này | – | CDN cho ảnh (mục 1.3): 0–50.000 đ/tháng [Chưa xác minh]; Turnstile: 0 đ nhưng cần ESC vì dữ liệu ra nước ngoài |
| **Tổng tăng thêm** | | **0 đ/tháng** → vẫn trong mức ADR-010 (~0,43–0,54 tr/tháng PA2) và ngân sách ≤ 1 tr/tháng |

Phụ thuộc khi chạy production: tên miền đã mua + quyền DNS (ESC-010 – vẫn là giả định chờ INV), VPS production (hosting-plan: R3), ESC-002 đã quyết A. Trước khi có production, INV xem bản landing ở `staging.<tên-miền>` (khi VPS staging có IP + tên miền) hoặc bản `astro preview` trên máy đội.

**DNS cần thêm** (OPS cập nhật hosting-plan 10.1 – thay câu "Không trỏ tên miền gốc vào VPS này nếu đang dùng cho website giới thiệu"):
| Loại | Tên | Giá trị | Khi nào |
|---|---|---|---|
| A | `staging` | `<IP-staging>` | Khi dựng landing staging |
| A | `@` | `<IP-production>` | Khi có production |
| A (hoặc CNAME về `@`) | `www` | `<IP-production>` | Cùng lúc |
| TXT | `@` | mã xác minh Google Search Console | Khi INV tạo Search Console |

Nếu tên miền gốc **đang có** website khác (INV chưa cho biết) → OPS lập bảng chuyển hướng 301 từ URL cũ trước khi đổi bản ghi A [Chưa xác minh].

## 9. Ngân sách hiệu năng và kiểm tra CI cho landing

| Chỉ số | Đích | Cách đo |
|---|---|---|
| LCP (4G, Android tầm trung, đo từ VN) | ≤ 2,5 giây | Lighthouse CI (mobile) |
| CLS | ≤ 0,1 | Lighthouse CI |
| INP | ≤ 200 ms | Lighthouse CI (TBT thay thế) |
| JS lần tải đầu (gzip) | trang nội dung ≤ 15 KB; trang liên hệ ≤ 30 KB; (R3) trang đặt phòng ≤ 90 KB (có React) | `check-dist.mjs` |
| Tổng tải lần đầu trang chủ | ≤ 700 KB | Lighthouse CI |
| Điểm Lighthouse | Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 95 | Lighthouse CI, chạy trên `astro preview` với header CSP thật |
| API công khai (R3) | p95 < 150 ms chưa cache | k6 (R3) |

Job CI: `turbo run build test --filter=@ottimo/landing-web...` chỉ chạy khi landing hoặc phụ thuộc đổi; Playwright mở 3 trang chủ (vi/en/ru) + 1 trang loại căn + trang liên hệ, kiểm không lỗi CSP, form gửi được tới api thật (Postgres service) trong E2E.

---

## Hệ quả

- **Tốt**: không tăng chi phí; dữ liệu khách ở VN; trang nhanh (gần như không JS); cùng nhận diện và token với app; đơn từ web đi thẳng vào Desk qua luồng có sẵn (lead → báo giá → giữ chỗ), không có đường tắt vượt ràng buộc chống trùng (ADR-009); không cần banner cookie.
- **Phải chấp nhận**:
  - Khách ở châu Âu/Nga tải chậm hơn so với CDN – có điều kiện đo để thêm CDN ảnh.
  - Landing ngừng khi VPS ngừng (cùng điểm lỗi đơn đã chấp nhận ở ADR-010).
  - Bộ đếm tự làm ít tính năng hơn công cụ phân tích chuyên dụng (không có khách duy nhất, không bản đồ nhiệt).
  - Form L1 không giữ phòng – khách phải chờ nhân viên phản hồi. Đặt ngay là US-132 (R4+).
  - Thêm một framework (Astro) vào monorepo – thêm việc theo dõi bản vá (`pnpm audit`, Renovate/Dependabot).
  - Ảnh master (≤ 30 MB) nằm trong lịch sử git vĩnh viễn – đổi ảnh nhiều lần làm repo nặng dần; giữ kỷ luật chỉ thay ảnh khi cần.

## Điều kiện xem lại

- Đo được một trong ba điều kiện ở mục 1.3 → thêm CDN cho ảnh (ESC nếu tốn tiền hoặc dữ liệu ra nước ngoài).
- Spam vượt tầng 1 → bật tầng 2; vượt tầng 2 → ESC tầng 3 (mục 4.4).
- Landing cần deploy > 1 lần/ngày hoặc do người ngoài đội (agency) sửa nội dung → tách image/volume riêng hoặc thêm CMS (ADR mới).
- Làm US-132 (đặt + trả tiền ngay) → ADR mới: giữ chỗ tạm từ web có hạn, cổng thanh toán, chống giữ chỗ hàng loạt.
- Lên Astro major mới → ADR mới (quy tắc 3 ADR-012).

---

## 10. Thay đổi cần làm (ARC không sửa file của vai khác – mỗi dòng là việc giao qua ORC)

| Vai | Việc | Khi nào |
|---|---|---|
| **ARC** | Đưa mục 4.8 vào `openapi.yaml` (tag `public-site`, 5 operation công khai + 4 operation nhân viên, 2 mã lỗi mới), mục 4.9 vào `erd.md`; cập nhật `architecture.md` (container `landing-web` thay `booking-web`, bảng 5.3, cây thư mục mục 17, mục 16 thêm ngân sách landing). Dòng ADR-014 trong ADR README đã thêm (17/10) | Bước hợp đồng của sprint làm L1 |
| **PO** | Viết story cho **phần giới thiệu** (L0: trang, nội dung 3 ngôn ngữ, ảnh, SEO, nút Zalo/điện thoại) và **form yêu cầu + hộp thư Desk** (L1); gắn US-131 cho L2; xếp lịch (đề xuất L0 làm song song Sprint 4–5 vì không đụng lõi; L1 cùng US-131 đầu R3). Quyết hiện giá công khai hay không (4.7) – nếu là chính sách giá thì mở ESC | Lập kế hoạch Sprint 4/R3 |
| **BA** | Máy trạng thái `booking_inquiry` (SM-xx), màn + hành động trong `rbac-matrix.md` (không cho `collaborator`), use case "Xử lý yêu cầu từ website" | Cùng PO |
| **DOM** | Ngưỡng phản hồi yêu cầu web (BR mới, theo giờ trực BR-811); khoảng kỳ hạn dài hạn cho form; văn bản trang chính sách (nội quy, hủy, giờ nhận/trả – khớp BR); xác nhận giá trực tiếp trên web theo BR-101/104/107; câu hỏi rate parity với OTA | Trước L1 / L2 |
| **SEC** | Thêm SR-RL cho 5 endpoint công khai (số ở 4.4, 4.7, 4.8); xác nhận 4 điều kiện "không cần banner" (6.3); hạn lưu `booking_inquiry`, `ip_hmac` (4.6); soạn thông báo xử lý dữ liệu có phiên bản; review CSP landing; thêm `PUBLIC_FORM_SIGNING_KEY` vào sổ bí mật | Review ADR này + trước L1 |
| **OPS** | Site thứ 4 trong `Caddyfile.prod` (mục 1.4) + bản dev; `Dockerfile.web` thêm `/srv/landing-web` + cache BuildKit cho ảnh; biến `LANDING_HOST`, `LANDING_SITE_URL` (biến build CI), `LANDING_BASE_URL` (api, bắt buộc https ở staging/production khi bật website), `PUBLIC_FORM_SIGNING_KEY` (`_FILE`, ≥ 32 ký tự); khai biến build trong `turbo.json` `env` (quy tắc 4 ADR-012); `expected-headers.sh` kiểm header landing (không `X-Robots-Tag` ở production, có ở staging); job Lighthouse CI; cập nhật hosting-plan 5, 5.1, 10.1 (DNS gốc, `www`, `staging`); hỏi hạn mức băng thông quốc tế khi xin báo giá VPS | Khi dựng L0 |
| **UXD** | Thiết kế landing theo DS (giọng "khách" – ấm, thoáng); danh sách ô ảnh + `alt` 3 ngôn ngữ; đọc e-brochure khi INV cho phép và đề xuất token landing (nếu có màu đất nung) qua `gen_tokens.py`; nội dung 3 ngôn ngữ theo `content-guide.md`; khóa chuỗi `landing.*` | L0 |
| **FE** | Dựng `apps/landing-web` theo mục 2–3, 5–7, 9; xóa `apps/booking-web/README.md` (thay bằng landing-web); thêm export `@ottimo/ui/tokens.css`, `@ottimo/ui/fonts.css` trong `packages/ui`; L1: script form + màn Desk "Yêu cầu từ website"; R3: widget đặt phòng | L0, L1, L2 |
| **BE** | Module `public-site`: form token, `createBookingInquiry`, `recordSiteEvent`, hộp thư Desk + chuyển thành lead, job xóa/nhắc; R3: availability/offers + cache + NOTIFY | L1, L2 |
| **INT** | Lấy link Zalo OA chính thức (INV cấp); khi ESC-010 đổi sang dùng Zalo OA: thiết kế lời chào tự động **sau** khi nhân viên liên hệ (4.3), không gửi tới liên hệ chưa xác minh | Theo ESC mới về Zalo |
| **DATA** | Định nghĩa chỉ số landing (lượt xem theo ngôn ngữ, tỉ lệ bấm liên hệ, yêu cầu → lead → đơn web) từ `web_metric_daily` + `booking_inquiry` | R3 |
| **QA** | Test chống spam (bẫy, token quá nhanh/dùng lại, Origin sai, giới hạn), test projection không lộ số căn/hoa hồng, test hreflang/CSP/Lighthouse | Theo sprint |

Dòng đề xuất cho `decision-log.md` (ORC ghi khi commit):
- `| 2026-10-17 | 2 | ADR-014: landing = app tĩnh apps/landing-web (Astro 6, Vite 7), Caddy trên VPS production phục vụ tên miền gốc, chỉ proxy /v1/public/*; thay thư mục booking-web | ARC | 0 đ thêm, dữ liệu ở VN, cùng pipeline |`
- `| 2026-10-17 | 2 | Form web tạo booking_inquiry (không lead, không giữ chỗ); chống spam tầng 1 tự làm (bẫy + form token + Origin + giới hạn); tầng 2 PoW tự host; tầng 3 Turnstile chỉ qua ESC | ARC | Tránh khóa phòng hàng loạt, tránh gộp nhầm hồ sơ khách |`
- `| 2026-10-17 | 2 | Đo lường landing = bộ đếm tổng hợp trong DB, không cookie/IP → không banner đồng ý [SEC xác nhận] | ARC | Không bên thứ ba, không container mới |`

## 11. Giả định

- [GIẢ ĐỊNH] INV có (hoặc sẽ mua) một tên miền gốc, chưa dùng cho website khác; `ottimo.vn` chỉ là ví dụ.
- [GIẢ ĐỊNH] Lượng truy cập landing ≤ 400 lượt xem/ngày trong năm đầu (chưa có số liệu).
- [GIẢ ĐỊNH] Một replica api (như SEC đã ghi) – cache RAM của API công khai đúng.
- [GIẢ ĐỊNH] Ảnh trong Drive là của OTTIMO, được phép dùng công khai; ảnh có người đã có đồng ý (UXD kiểm, INV xác nhận).
- [GIẢ ĐỊNH] Bản đầu công bố 3 loại căn theo nhóm (Lầu 1–2, Căn N, Căn N+); 5 bộ ảnh "Phòng 1…5" ánh xạ vào loại căn do UXD/INV quyết.
- Không có ESC mới từ ARC: phương án đề xuất không tốn thêm tiền và không đưa dữ liệu ra nước ngoài. Việc cần INV (cho tải ảnh, tên miền, link Zalo OA, đổi ESC-010) đã do ORC/INT/PO theo dõi.

## 12. Chưa xác minh (cần kiểm trước khi làm)

- Dạng link Zalo OA chính thức; phí xác thực OA (INT).
- Băng thông quốc tế và hạn mức lưu lượng của gói VPS VN (OPS).
- Thời gian mã hóa AVIF trong CI cho ~40 ảnh master.
- Giấy phép phần máy chủ của ALTCHA (đọc lại kho mã trước khi bật tầng 2).
- Kết luận "không cần banner đồng ý" theo Luật 91/2025 (SEC + luật sư).
- Nội dung e-brochure và tông "Terracotta – Slow Living".
- Điều khoản ngang giá (rate parity) với các OTA khi hiện giá trực tiếp thấp hơn.

## 13. Phương án đã cân nhắc (tóm tắt)

| Phương án | Vì sao không chọn |
|---|---|
| Next.js (SSR) cho landing | Cần tiến trình Node thường trực; lợi ích SSR không cần cho nội dung tĩnh (ADR-004) |
| Thêm trang giới thiệu vào guest-web (`g.`) | guest-web là app theo link đơn, `no-referrer`, `noindex`, không cache; trộn trang công khai cần SEO vào sẽ phá các quy tắc đó (ADR-006, SR-HDR-04) |
| Trình tạo website (WordPress, Wix…) | Thêm hệ thống phải vá/trả phí, không chung token, form không đi vào Desk; WordPress tự host thêm PHP + MySQL trên VPS |
| CMS headless | Thừa với ~8 trang × 3 ngôn ngữ do đội tự sửa; xem lại khi người ngoài đội cần sửa nội dung |
| Form tạo `lead` + giữ chỗ ngay | Bot khóa phòng hàng loạt; gộp nhầm hồ sơ khách (4.3) |
| Banner cookie + GA4 | Dữ liệu ra nước ngoài, nới CSP, giảm tốc độ; chưa cần cho quy mô 10 căn |

## 14. Nguồn (đọc ngày 17/10/2026)

- Astro – Internationalization (i18n) routing: https://docs.astro.build/en/guides/internationalization/ [Nguồn]
- Astro – Images (`<Picture />`, sharp, cache `node_modules/.astro`): https://docs.astro.build/en/guides/images/ [Nguồn]
- Astro – Upgrade to v6 (Vite 7, Node ≥ 22.12): https://docs.astro.build/en/guides/upgrade-to/v6/ [Nguồn]
- Astro – `@astrojs/sitemap` (tùy chọn `i18n`, `xhtml:link`): https://docs.astro.build/en/guides/integrations-guide/sitemap/ [Nguồn]
- Astro – CSP (cờ thử nghiệm 5.9; `security.csp` từ 6.0, dạng thẻ meta): https://v5.docs.astro.build/en/reference/experimental-flags/csp/ [Nguồn]; mô tả bản 6.0 qua https://docs.report-uri.com/frameworks/astro/ [Bên thứ ba]
- Google – Localized versions / hreflang, `x-default`: https://developers.google.com/search/docs/specialty/international/localized-versions [Nguồn]
- Google – Review snippet (đánh giá tự kiểm soát không được hiện sao): https://developers.google.com/search/docs/appearance/structured-data/review-snippet [Nguồn]
- Google – Vacation rental structured data (cần Hotel Center): https://developers.google.com/search/docs/appearance/structured-data/vacation-rental [Nguồn]
- schema.org `Hotel`, `LodgingBusiness`, `HotelRoom`: https://schema.org/Hotel, https://schema.org/LodgingBusiness, https://schema.org/HotelRoom [Nguồn]
- Cloudflare Turnstile – CSP: https://developers.cloudflare.com/turnstile/reference/content-security-policy/ [Nguồn]; Plans (Free): https://developers.cloudflare.com/turnstile/plans/ [Nguồn]
- ALTCHA (MIT, tự host): https://altcha.org/open-source-captcha/ [Nguồn – phần máy chủ cần đọc lại kho mã]
