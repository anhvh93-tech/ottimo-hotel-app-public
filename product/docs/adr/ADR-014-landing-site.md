# ADR-014 – Website giới thiệu và đặt phòng trực tiếp (landing) ở tên miền gốc

- Trạng thái: **Đề xuất** (chờ review bắt buộc BE, SEC; khuyến nghị OPS, INT, FE, UXD, DATA) | Người quyết: ARC (kỹ thuật); PO (phạm vi, lịch); INV (chi phí, chính sách giá công khai – nếu phát sinh) | Ngày: 17/10/2026 | Round 2 – Sprint 3 đang đóng, chuẩn bị Sprint 4
- Sửa 17/10/2026 (tối, ARC theo giao việc ORC):
  - Quy tắc ngôn ngữ mới: tiếng Anh ở gốc, không tự chuyển hướng, chỉ gợi ý. Thay điểm 3 cũ (302 theo `Accept-Language`); khớp US-152 AC2 đã sửa. Xem mục 3.
  - Landing theo **Brand Guidelines v1.0** và token chung, không terracotta (mục 2.5).
  - v1 không tải script/tài nguyên bên thứ ba nào (mục 2.6).
  - Email công khai là hộp thư chung, không dùng email cá nhân in trong e-brochure (mục 4.2).
  - DNS gốc + `www` đã chuyển vào `hosting-plan.md` mục 10, kèm bảo vệ tài khoản tên miền theo SEC ARC-10 (mục 8).
- Sửa 17/10/2026 (khuya, ARC – FB-INV-002 ý 3, 4; OpenAPI 0.3.7 bổ sung 2):
  - Mục 4 viết lại: L1 = **phương án A** "Yêu cầu đặt phòng" (đội đề xuất, chờ INV), bản ghi đổi tên `website_booking_request`; chuyển thành giữ chỗ/đơn qua `saveQuote`/`createHoldFromQuote`/`createReservation` kèm liên kết (bỏ bước lead bắt buộc); nguồn `website` + nguồn phụ `directSubSource` (ví dụ `facebook`).
  - Phương án B (phòng trống + giá) chỉ là contract-ahead; bỏ bảng `public_listing` – dùng `room.public_room_type`.
  - Zalo OA là kênh chính ở cả EN và VI; WhatsApp/Telegram/Viber vào "Kênh khác"; fanpage Facebook chỉ là link (không SDK/plugin); nút "Book now" của fanpage trỏ `/book/?utm_source=facebook…` (mục 4.2).
  - Áp thẻ SEC `landing-zalo-SEC.md` ARC-02, 03, 04, 05, 06, 07, 08, 12 (mục 4.3–4.6). Hợp đồng đã vào `openapi.yaml` + `erd.md` 4.14 – mục 4.8, 4.9 chỉ còn bảng tóm tắt.
- Trả lời: ADR-004 điểm 3 (`booking-web` cần SEO, chọn công nghệ bằng ADR riêng). ADR này **gộp** landing và trang đặt phòng trực tiếp (EP18) vào **một** app `product/apps/landing-web`. Thư mục giữ chỗ `apps/booking-web` bỏ đi.
- Đầu vào: FB-INV-001 (17/10), tin nhắn INV 17/10 ("Làm landing page nha…", Zalo OA để chăm sóc khách), PRD M13, M15, A6; backlog EP18 (US-131, US-132), US-034, US-040, US-108, US-116, US-126, US-138; `integrations.md` I7 + mục 3.4 + ESC-INT-B; ESC-010; `hosting-plan.md` mục 5.1, 10.1; ADR-004, ADR-006, ADR-009, ADR-010, ADR-012; `security-requirements.md` SR-HDR, SR-RL; `data-risk-assessment.md`; `design-system.md` v0.3.5; `00-brief/context/landing/README.md`. Bổ sung khi sửa 17/10 tối: `00-brief/context/brand/brand-guidelines.md` (Brand Guidelines v1.0); `00-brief/context/landing/ebrochure-text.md`; ESC-020, ESC-021; `rounds/round-02/outputs/PO/landing-scope.md`; `rounds/round-02/reviews/landing-zalo-SEC.md` (C-1, ARC-06, ARC-10, ARC-11); backlog US-152, US-153.
- Liên quan: ADR-001 (contract-first), ADR-007 (đa cơ sở, RLS), ADR-008 (giờ cơ sở).

> **Quy ước nguồn** (giống ADR-010, INT): **[Nguồn]** = tài liệu chính thức, đọc ngày 17/10/2026 (link ở mục 14); **[Bên thứ ba]** = trang tổng hợp; **[Chưa xác minh]** = ước lượng của đội hoặc chưa đọc được tài liệu gốc. Tên miền `ottimo.vn` chỉ là ví dụ – INV chưa xác nhận đã sở hữu (ESC-010, giả định trong decision-log). Trong tài liệu ghi `<tên-miền>`.

---

## Bối cảnh

- INV **đã quyết** (17/10): có landing ở **tên miền gốc** để khách tìm hiểu OTTIMO và đặt phòng. Landing "gióng" sản phẩm đang làm: cùng nhận diện, đơn đặt về đúng OTTIMO Desk.
- Hiện trạng R2: tên miền con `desk.`, `staff.`, `g.` đã thiết kế (hosting-plan 5.1). Tên miền gốc đang **để dành** cho website giới thiệu (hosting-plan 10.1). Chưa có story cho phần giới thiệu (nội dung, ảnh, SEO). EP18 có US-131 (Should R3: xem phòng trống + giá + gửi yêu cầu giữ chỗ) và US-132 (Could R4+: đặt và trả tiền ngay).
- Tư liệu (cập nhật 17/10 tối):
  - **45 ảnh gốc** đã tải về `00-brief/context/landing/raw/{mat-tien-sanh,phong-1..phong-5}/` (PNG 4–60 MB, **ngoài git**).
  - **E-brochure 2026 đã đọc**: chữ ở `00-brief/context/landing/ebrochure-text.md`, ảnh trang ở `raw/brochure-pages/`. Brochure dùng nét nhấn **terracotta** và in **email cá nhân** của một người.
  - **OTTIMO Brand Guidelines v1.0** (INV 17/10): bắt buộc cho mọi đầu ra; mâu thuẫn với design system cũ hay e-brochure thì guideline thắng.
  - Vì vậy landing **không dùng terracotta** và **không dùng email cá nhân** đó (mục 2.5, 4.2).
- INV muốn dùng **Zalo OA** để chăm sóc khách. Điều này đổi ESC-010 (INV chọn B ngày 16/10: Zalo ZNS để sau MVP, R2/R3 gửi tay). Việc đổi ESC-010 thuộc INT/PO. ADR này chỉ đảm bảo landing **không phụ thuộc** quyết định đó: nút Zalo OA là một đường link; khi có Zalo OA API thì phía Desk gửi tự động, landing không đổi.
- Ràng buộc: ngân sách hạ tầng ≤ 1 tr/tháng (ADR-010); dữ liệu khách ở Việt Nam (ESC-002 A); không Cloudflare proxy trước API/app khách (ADR-010 điểm 4); CSP chặt không `unsafe-inline` (SR-HDR-01); 3 ngôn ngữ VI/EN/RU (PRD nguyên tắc 4) – v1 có EN + VI, RU theo ESC-020 L1 / US-156; giọng thương hiệu **tiếng Anh dẫn dắt, tiếng Việt hỗ trợ** (Brand Guidelines mục 2); khách nước ngoài nhiều, nhưng phần lớn tìm phòng qua OTA (PRD A6).

## Tóm tắt quyết định

| # | Chủ đề | Quyết định |
|---|---|---|
| 1 | Nơi chạy | App tĩnh riêng `product/apps/landing-web`, build trong CI, **Caddy trên chính VPS production** phục vụ ở tên miền gốc (`www.` chuyển hướng 301 về gốc). Không dùng CDN ở bản đầu. Có điều kiện đo được để thêm CDN **chỉ cho ảnh** (mục 1.3) |
| 2 | Công nghệ | **Astro 6** xuất tĩnh (`output: 'static'`), không đảo (island) ở trang nội dung; JS tối thiểu bằng `<script>` module ngoài. Dùng token + font chung với `packages/ui`. Không có tiến trình Node chạy thường trực |
| 3 | Ngôn ngữ *(sửa 17/10)* | **Tiếng Anh ở gốc, không tiền tố** (`/`, `/rooms/<slug>/`…); tiếng Việt ở `/vi/…`; tiếng Nga ở `/ru/…` khi phát hành. **Không tự chuyển hướng theo ngôn ngữ** (không đọc `Accept-Language`, không 302, không cookie ngôn ngữ). Trang chỉ **gợi ý** đổi ngôn ngữ bằng một dải nhỏ, khách bấm mới đổi. `hreflang` 2 chiều cho mọi ngôn ngữ đã phát hành + `x-default` = bản tiếng Anh của cùng trang (mục 3) |
| 4 | Đặt phòng *(sửa 17/10 khuya – FB-INV-002)* | **L0** chat: **Zalo OA là kênh chính**; WhatsApp/Telegram/Viber, gọi, email ở "Kênh khác"; fanpage Facebook chỉ là link. **L1 = phương án A** (đội đề xuất, chờ INV): form "Yêu cầu đặt phòng" → `createWebsiteBookingRequest` tạo **`website_booking_request`** (hàng chờ Desk), **không** giữ chỗ/lead/hồ sơ khách, không thanh toán; nhân viên chuyển thành giữ chỗ/đơn qua `saveQuote` → `createHoldFromQuote` hoặc `createReservation` kèm liên kết → đơn `direct`, nguồn `website` + nguồn phụ (ví dụ `facebook`). **L2 = phương án B** (US-131) phòng trống + giá: contract-ahead, không cài. **L3 (R4+, US-132)** đặt + trả tiền ngay – ADR riêng |
| 5 | SEO | HTML tĩnh theo ngôn ngữ, `sitemap-index.xml` có `xhtml:link`, `robots.txt`, JSON-LD `Hotel` + `HotelRoom` + `BreadcrumbList`; **không** tự gắn sao đánh giá |
| 6 | Đo lường | Bộ đếm **tổng hợp theo ngày** ghi trong DB của OTTIMO (không cookie, không lưu IP, không định danh). **Không cần banner đồng ý** khi giữ đúng điều kiện ở mục 6.3 [SEC xác nhận]. Google Search Console xác minh bằng DNS (không gắn script) |
| 7 | Ảnh | Ảnh gốc **không vào git**. Script nạp ảnh (chạy trên máy UXD/FE) tạo bản "master" đã giảm cỡ, bỏ EXIF → vào git (≤ 30 MB tổng). Build tạo AVIF + WebP nhiều cỡ có tên băm |
| 8 | Chi phí | **0 đ/tháng tăng thêm** so với ADR-010 (cùng VPS, cùng tên miền). CDN ảnh (nếu cần sau) 0–50.000 đ/tháng [Chưa xác minh] và cần SEC/INV đồng ý vì dữ liệu truy cập ra nước ngoài |
| 9 | Nhận diện *(mới 17/10)* | Theo **OTTIMO Brand Guidelines v1.0**: chỉ màu trong bảng 80/15/5, qua **token chung** của Design System (nhóm màu thương hiệu, UXD thêm ở DS v0.4); Lora / Be Vietnam Pro / JetBrains Mono tự host; **không terracotta**; chữ khách đọc theo giọng thương hiệu. Test chặn màu ngoài bảng (mục 2.5) |
| 10 | Bên thứ ba *(mới 17/10)* | **v1 không tải script nào của bên thứ ba**, cũng không tải font, ảnh, iframe, pixel hay widget từ tên miền ngoài. Zalo/WhatsApp/Telegram/Viber/bản đồ/fanpage Facebook chỉ là link, khách bấm mới mở. Đây là điều kiện cổng LP-v1 (SEC C-1). Kiểm bằng CSP + test CI (mục 2.6) |

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
- Landing là **site thứ 4** trên Caddy (origin riêng, như SR-HDR-04). Ở v1 (L0), origin này **không** proxy gì tới api. Từ L1, nó **chỉ** proxy 5 đường dẫn công khai của mục 1.4 (SEC ARC-06); mọi `/v1/*` khác trả 404 ở origin này. Không cookie, không phiên.
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
| `/` và mọi trang tiếng Anh (không tiền tố), `/vi/…`, `/ru/…` (khi đã phát hành) | `try_files {path} {path}/index.html`, `file_server`. **Không** đọc `Accept-Language`, không chuyển hướng theo ngôn ngữ, không `Vary: Accept-Language`, không `Set-Cookie` (mục 3) | `public, max-age=0, must-revalidate` (Caddy có `ETag`/`Last-Modified` → trả 304 nhanh) |
| `/en`, `/en/*` | 301 → cùng đường dẫn bỏ tiền tố `/en` (ví dụ `/en/rooms/x/` → `/rooms/x/`) – đỡ link gõ tay | – |
| `/ru/*` khi tiếng Nga **chưa** phát hành | 404 (không chuyển hướng) | – |
| `/_astro/*` (JS, CSS, font, ảnh có tên băm) | `file_server` | `public, max-age=31536000, immutable` |
| `/og/*` (ảnh chia sẻ mạng xã hội, JPEG cố định tên) | `file_server`; `Cross-Origin-Resource-Policy: cross-origin` (Zalo/Facebook hiển thị ảnh xem trước) | `public, max-age=86400` |
| `/robots.txt`, `/sitemap-*.xml`, `/favicon.ico`, `/site.webmanifest` | `file_server` | `public, max-age=3600` |
| `/v1/public/properties/{slug}/(form-token\|booking-requests)`; phương án B thêm `availability\|offers`; US-158 thêm `site-events` *(sửa 17/10 khuya)* | **v1 (L0): không có** – trả 404 như dòng dưới (v1 không gọi API). Từ L1: `reverse_proxy api:3000` **chỉ** các đường dẫn đã bật này (SEC ARC-06); giới hạn body **16 KB** | do api đặt (`no-store` cho form) |
| `/v1/*` khác, `/health`, `/__test__/*` | 404 | – |
| Không tìm thấy | `handle_errors 404` → `/vi/404/index.html` nếu đường dẫn bắt đầu bằng `/vi/`, `/ru/404/index.html` nếu bắt đầu bằng `/ru/` (khi đã phát hành), còn lại `/404/index.html` (tiếng Anh) | `no-store` |
| `www.<tên-miền>` | 301 → `https://<tên-miền>{uri}` | – |

Header (khác 3 app ở chỗ **không** gắn `X-Robots-Tag` ở production):
- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'; manifest-src 'self'; worker-src 'none'; upgrade-insecure-requests`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (không bật `preload` – khó gỡ).
- `Referrer-Policy: strict-origin-when-cross-origin` (landing không có token trong URL; giữ nguồn giới thiệu khi khách bấm sang Zalo/OTA).
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()`; `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY`; `Cross-Origin-Opener-Policy: same-origin`; `Cross-Origin-Resource-Policy: same-origin` (trừ `/og/*`).
- Log: dùng snippet `access_log` có sẵn (bỏ toàn bộ query, che IP /24). Không cần giữ `utm_*` trong log – UTM đã đi vào bộ đếm (mục 6).
- Staging: host `staging.<tên-miền>`, thêm `X-Robots-Tag: noindex, nofollow` **và** chặn bằng basic auth hoặc danh sách IP – không chỉ `noindex`, vì bản staging trông giống hệt bản thật (SEC ARC-10 điểm 4).
- HSTS `includeSubDomains` ở tên miền gốc áp cho **mọi** tên miền con. Trước khi bật, OPS liệt kê mọi tên miền con có bản ghi DNS và xác nhận đều chạy HTTPS (SEC ARC-10 điểm 3; `hosting-plan.md` mục 10.1).

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
├── astro.config.mjs          # site = LANDING_SITE_URL; i18n defaultLocale 'en', locales en/vi (+ru khi phát hành), routing.prefixDefaultLocale: false; không dùng fallback; sitemap i18n
├── public/                   # robots.txt (sinh lúc build theo môi trường), favicon, og/*.jpg
├── scripts/
│   ├── ingest-photos.mjs     # nạp ảnh gốc → master (mục 7) – chạy tay, KHÔNG chạy trong CI
│   └── check-dist.mjs        # kiểm dist: không script/style inline, ngân sách dung lượng, hreflang đủ
├── src/
│   ├── assets/photos/        # ảnh master đã tối ưu (vào git)
│   ├── content/              # nội dung theo ngôn ngữ, schema zod: pages/, listings/, site.json, photos.json
│   ├── components/           # .astro thuần (không framework)
│   ├── layouts/              # Base: <head> SEO, hreflang, JSON-LD
│   ├── pages/                # EN ở gốc (pages/index.astro, pages/rooms/...), VI ở pages/vi/..., RU ở pages/ru/...; mỗi tệp route chỉ gọi component trang dùng chung với `lang`
│   ├── scripts/              # TS chạy trình duyệt: gợi ý ngôn ngữ (mục 3), menu, thư viện ảnh; từ L1: form, đếm sự kiện; (R3) widget đặt phòng
│   └── styles/               # CSS riêng landing – chỉ dùng biến token
└── src/**/*.test.ts          # Vitest: schema nội dung, đủ mọi ngôn ngữ đã phát hành, hreflang/x-default, màu ngoài bảng, tài nguyên ngoài, kiểm dist
```

Trang (mỗi trang × mọi ngôn ngữ đã phát hành – v1: EN + VI): trang chủ, danh sách loại căn, chi tiết từng loại căn, thuê dài hạn (theo tháng), vị trí & Đà Lạt (chỉ đường), liên hệ / yêu cầu đặt phòng, chính sách (nội quy, hủy – văn bản DOM duyệt), thông báo xử lý dữ liệu cá nhân (bắt buộc vì có form), 404. R3 thêm trang đặt phòng (`/book/`, `/vi/book/`…).

### 2.4 Quy tắc build để CSP chặt chạy được
- Cấm script inline có thực thi, thẻ `<style>`, thuộc tính `style=` và `on*=` trong `dist/**/*.html`. Ngoại lệ duy nhất: `<script type="application/ld+json">` (khối dữ liệu, không thực thi).
- Cấu hình: `build.inlineStylesheets: 'never'`, `vite.build.assetsInlineLimit: 0`.
- **Không dùng island của Astro** ở L0/L1 (island chèn script inline để hydrate). R3: widget đặt phòng React gắn bằng một module ngoài (`createRoot` trong tệp `.ts` riêng), không qua `client:*`. Không dùng `security.csp` của Astro (CSP ở dạng thẻ meta, không đặt được `frame-ancestors`) – CSP đặt ở header Caddy như 3 app kia [Nguồn: Astro CSP].
- `scripts/check-dist.mjs` chạy trong `test` sau `build`; vi phạm → CI đỏ. Playwright chạy trang `astro preview` với header CSP thật → không được có lỗi CSP trên console.

### 2.5 Nhận diện: Brand Guidelines v1.0 + token chung *(viết lại 17/10)*
Landing tuân theo **OTTIMO Brand Guidelines v1.0** (`00-brief/context/brand/brand-guidelines.md`). INV quyết ngày 17/10: guideline thắng khi lệch với design system cũ hoặc e-brochure. ARC không tự đặt màu hay font. Phần kỹ thuật bảo đảm landing không thể lệch guideline:

**Màu – chỉ bảng 80/15/5**
- Ivory #F4F0E8, Cream #EDE6D8, Stone Grey #6B6760, Ink #2B2B28.
- Light Oak #B08D57, Earth Brown #7A5C44.
- Sage #8A9079.
- Thêm White cho chữ trên nền Oak/Earth (cặp chữ–nền của guideline mục 5).
- **Không terracotta.** Brochure 2026 có nét nhấn đất nung nhưng không được dùng. Nhấn bằng Oak, Earth Brown, Sage.

**Token chung, không mã màu trong landing**
- UXD thêm **nhóm màu thương hiệu** vào token Design System (DS v0.4, sinh bằng `design/tools/gen_tokens.py`). Giá trị đúng HEX của guideline. Landing dùng chính các token đó qua `@ottimo/ui/tokens.css`, cùng nguồn với app. Không có bảng màu riêng cho landing.
- Các token màu riêng của app (`surface`, `side`, `line`, `deco`, màu trạng thái ok/warn/bad/info…) **không** được dùng ở landing: chúng lệch nhẹ khỏi bảng (brand-guidelines mục 7). Nếu cần màu chức năng (ví dụ viền lỗi khi có form ở L1), UXD ghi ngoại lệ trong DS và có kiểm tương phản.
- CSS của landing chỉ dùng `var(--…)` thuộc danh sách token thương hiệu. Test (Vitest) chặn:
  - mã màu cứng (`#…`, `rgb(`, `hsl(`) trong `src/styles` và `src/components`;
  - biến màu ngoài danh sách cho phép;
  - `color-mix()` tạo màu mới. Ngoại lệ duy nhất: lớp phủ Ink có độ trong suốt trên ảnh để chữ đọc được (UXD đo tương phản).
- Mọi chỗ khác cũng theo bảng màu: `theme-color` = Ivory; khung giữ chỗ ảnh; ảnh chia sẻ `/og/` (chữ trên ảnh); favicon.
- Nếu UXD giữ chế độ tối: nền Ink, chữ Ivory (guideline mục 5), không dùng màu tối ngoài bảng.
- Tương phản: Ink trên Ivory/Cream là cặp chuẩn. Không dùng Sage/Oak làm chữ trên nền sáng. Mọi cặp chữ–nền đạt WCAG 2.2 AA (`design/tools/contrast.md`).

**Font: Lora, Be Vietnam Pro, JetBrains Mono, tự host**
- `@ottimo/ui/fonts.css` gồm:
  - Lora 500/600 cho tiêu đề;
  - Be Vietnam Pro 400/500/600 cho nội dung và UI;
  - JetBrains Mono 400 cho mã và thông số (guideline mục 6) – chỉ tải khi trang có dùng.
- Tự host qua `@fontsource`, có tập ký tự Việt và Cyrillic (cho tiếng Nga sau này).
- **Không** dùng Google Fonts hay CDN font (SEC C-1).
- **Không** import `hifi.css` (thành phần của app nhân viên, nặng và không cần).
- Preload 1 tệp Lora 600 (tập Latin + Việt) cho tiêu đề đầu trang; còn lại `font-display: swap`. Fallback theo guideline: Georgia / Arial / Courier New.

**Logo và chữ khách đọc**
- Logo theo guideline mục 4: wordmark Lora, cỡ tối thiểu, vùng an toàn, không đổi màu ngoài bảng. Favicon dùng monogram núi khi INV gửi SVG; trước đó dùng chữ "OTTIMO" (ESC-012 L-A).
- Chữ khách đọc theo giọng thương hiệu: ngắn, điềm tĩnh, **tiếng Anh dẫn dắt – tiếng Việt hỗ trợ**, không emoji, không IN HOA để "hét". Nội dung do UXD/PO viết, INV duyệt (ESC-020 L5). Khách thấy tên phòng (The Pine … The Ember), không thấy số căn.
- UXD ký duyệt bản dựng theo US-153 AC1.

### 2.6 Không tải gì của bên thứ ba ở v1 *(mới 17/10 – SEC C-1)*
- **v1 không tải script nào của bên thứ ba.** Cũng không tải từ tên miền ngoài: font, CSS, ảnh, iframe (bản đồ, YouTube), pixel quảng cáo, công cụ phân tích (GA4, Meta Pixel), widget chat (Zalo, Messenger), captcha (Turnstile), thư viện JS qua CDN.
- Mọi tài nguyên phục vụ từ chính origin landing:
  - JS: chỉ module của chính site trong `/_astro/` – gợi ý ngôn ngữ, menu, thư viện ảnh, soạn sẵn tin nhắn "Hỏi phòng trống" trên máy khách;
  - ảnh QR Zalo và ảnh bản đồ tĩnh: tự lưu, ghi công bản đồ theo giấy phép (SEC UXD-02).
- Bộ đếm truy cập (mục 6) chỉ có từ L1 (US-158) và cũng là của chính OTTIMO, cùng origin.
- Zalo OA, WhatsApp, Telegram, Viber, gọi điện, email, Google Maps/Apple Maps, **fanpage Facebook** (thêm 17/10 khuya – FB-INV-002 ý 4; không SDK/plugin) chỉ là **link điều hướng**: khách bấm mới mở (SEC mục 6, danh sách được phép).
- CSP mục 1.4 (`script-src 'self'`, `connect-src 'self'`, `frame-src 'none'`…) chặn mọi thứ trên ở trình duyệt.
- CI kiểm thêm (SEC ARC-11 điểm 3):
  - `check-dist.mjs` không cho `src=`/`href=` của `<script>`, `<link rel=stylesheet|preload|modulepreload>`, `<img>`, `<source>`, `<iframe>` trỏ ra tên miền ngoài; không có thẻ `<iframe>`; không có `document.cookie` trong JS đã build;
  - Playwright mở từng trang mẫu và đếm yêu cầu mạng: **0** yêu cầu tới tên miền khác origin landing.
- Thêm bất kỳ bên thứ ba nào sau v1 → SEC review + banner đồng ý nếu có theo dõi + có thể ESC (mục 6.3).

---

## 3. Đa ngôn ngữ, đường dẫn, hreflang *(viết lại 17/10 tối)*

### 3.1 Vì sao đổi
Ba tài liệu đang nói ba quy tắc khác nhau:

| Tài liệu | Nói gì |
|---|---|
| ADR-014 bản đầu | `/` chuyển hướng 302 theo `Accept-Language` |
| US-152 AC2 cũ | Chỉ **gợi ý** đổi ngôn ngữ, không tự đổi |
| Concept UXD v0.1 (mục 3.1, 9.1) | `/` là tiếng Việt, `x-default` → `/en/` |

Quy tắc chung phải đạt 3 điều kiện:
1. **SEO đúng:**
   - Google khuyên **không** tự chuyển hướng theo ngôn ngữ đoán được, vì người dùng và máy tìm kiếm có thể không thấy đủ các bản [Nguồn: Google multi-regional].
   - Googlebot gửi yêu cầu **không có** `Accept-Language` [Nguồn: Google locale-adaptive].
   - Vì vậy URL nào cũng phải trả cùng một nội dung cho mọi người và mọi bot. Mỗi trang cần `hreflang` + `x-default`.
2. **Thương hiệu:** "tiếng Anh dẫn dắt, tiếng Việt hỗ trợ" (Brand Guidelines mục 2). Bản mặc định là tiếng Anh.
3. **US-152:** khách đã chọn tay thì giữ lựa chọn đó, trang không tự đổi.

### 3.2 Quy tắc (một quy tắc duy nhất – thay điểm 3 cũ và concept UXD 3.1/9.1/9.3)
1. **Đường dẫn:**
   - Tiếng Anh là ngôn ngữ mặc định, nằm ở gốc **không tiền tố**: `/`, `/rooms/<slug>/`, `/privacy/`.
   - Tiếng Việt ở `/vi/…`. Tiếng Nga ở `/ru/…` khi phát hành (ESC-020 L1, US-156).
   - Astro: `defaultLocale: 'en'`, `routing.prefixDefaultLocale: false` (giá trị mặc định của Astro – trang mặc định ở gốc `src/pages/`, ngôn ngữ khác trong thư mục riêng [Nguồn: Astro i18n]).
   - Slug **giống nhau** giữa các ngôn ngữ (chữ Latin không dấu): dễ ghép hreflang, không gãy link khi đổi bản dịch.
2. **Không tự chuyển hướng theo ngôn ngữ**, ở cả máy chủ lẫn trình duyệt:
   - Caddy không đọc `Accept-Language`, không 302, không `Vary: Accept-Language`, không cookie ngôn ngữ (mục 1.4).
   - Script không tự `location.replace` sang ngôn ngữ khác.
   - Chuyển hướng duy nhất: `/en/*` → 301 về đường dẫn không tiền tố (mục 1.4).
3. **Gợi ý, không ép:**
   - Mỗi trang có sẵn trong HTML một dải gợi ý cho từng ngôn ngữ khác đã phát hành:
     - viết bằng chính ngôn ngữ đó, có `lang` riêng (ví dụ "Xem trang này bằng tiếng Việt");
     - dẫn tới **cùng trang** ở ngôn ngữ đó;
     - ẩn sẵn bằng thuộc tính `hidden`;
     - gắn `data-nosnippet` để chữ gợi ý không lọt vào đoạn trích tìm kiếm.
   - Một module nhỏ (< 1 KB, file ngoài – CSP `script-src 'self'`) chọn **ngôn ngữ ưu tiên**:
     - nếu khách đã chọn trước đó: lấy lựa chọn đó;
     - nếu chưa: lấy ngôn ngữ chính của `navigator.languages[0]`; ngôn ngữ chưa có bản thì coi là `en` (khớp `x-default`).
   - Chỉ hiện dải khi ngôn ngữ ưu tiên **khác** ngôn ngữ trang **và** trang có bản ở ngôn ngữ đó.
   - Dạng dải:
     - cố định trên màn hình (`position: fixed`), nên không xô lệch bố cục (CLS);
     - không phải hộp thoại;
     - không che nút "Đặt phòng" hay thanh dính đáy;
     - có nút đóng; đi được bằng bàn phím.
4. **Giữ lựa chọn của khách:**
   - Khách bấm nút đổi ngôn ngữ, bấm dải gợi ý, hoặc đóng dải gợi ý (= "giữ ngôn ngữ này"): module lưu mã ngôn ngữ (`en|vi|ru`) vào `localStorage` khóa `ottimo.lang`.
   - Từ đó ngôn ngữ ưu tiên là lựa chọn này. Trang không bao giờ tự đổi. Dải chỉ hiện lại khi khách mở một trang khác ngôn ngữ đã chọn, như một lời nhắc.
   - Giá trị chỉ là tùy chọn giao diện: không gửi về máy chủ, không vào bộ đếm, không định danh. SEC đã chấp nhận `localStorage` cho tùy chọn giao diện (ARC-11 điểm 2). Thông báo quyền riêng tư ghi một câu về việc này.
   - `localStorage` bị chặn hoặc lỗi: bỏ qua, dùng ngôn ngữ trình duyệt mỗi lần. Trang vẫn đúng, chỉ là dải có thể hiện lại.
5. **Nút đổi ngôn ngữ:**
   - Là link thường tới cùng trang ở ngôn ngữ khác, **luôn thấy ở đầu trang** trên điện thoại và máy tính (không giấu trong menu). Lý do: khách Việt có trình duyệt tiếng Anh sẽ vào bản tiếng Anh mà không có gợi ý.
   - Tên ngôn ngữ viết bằng chính ngôn ngữ đó, có `lang` riêng.
   - **Không** hiện ngôn ngữ chưa phát hành (không nút "sắp có").
6. **Gửi link đúng ngôn ngữ:**
   - Tin Zalo, QR, tài liệu tiếng Việt dẫn tới `/vi/…`.
   - Tài liệu tiếng Anh, hồ sơ OTA, Google Business Profile dẫn tới gốc.

### 3.3 Khai báo cho máy tìm kiếm
- Mỗi trang có trong `<head>`:
  - `<html lang>`;
  - `<link rel="canonical">` trỏ chính nó;
  - `<link rel="alternate" hreflang="en|vi">` (+ `ru` khi phát hành) trỏ **mọi** bản đã phát hành, gồm chính nó (hreflang phải 2 chiều [Nguồn: Google localized versions]);
  - `hreflang="x-default"` → **bản tiếng Anh của cùng trang**. Ví dụ `/vi/rooms/<slug>/` có `x-default` = `https://<tên-miền>/rooms/<slug>/`.
- Mã ngôn ngữ chỉ gồm ngôn ngữ (`en`, `vi`, `ru`), không gắn vùng.
- Sitemap có `xhtml:link` sinh từ **cùng** hàm tạo danh sách bản ngôn ngữ như `<head>`. `@astrojs/sitemap` (tùy chọn `i18n`) không ghi là có sinh `x-default` [Nguồn: Astro sitemap]:
  - thêm `x-default` qua `serialize()` (mảng `links` của từng mục);
  - nếu không làm được thì sitemap chỉ liệt kê URL, hreflang khai trong `<head>`.
  - [ARC kiểm khi dựng].
- Test CI (Vitest trên `dist`), mỗi trang có:
  - đủ `hreflang` của mọi ngôn ngữ đã phát hành + `x-default`;
  - tham chiếu 2 chiều;
  - `x-default` trỏ bản EN;
  - `<html lang>` khớp đường dẫn;
  - dải gợi ý có `hidden` + `data-nosnippet`.
- Test E2E (Playwright, mục 9):
  - Gửi `GET /` kèm `Accept-Language: vi` → 200, nội dung tiếng Anh, không `Vary: Accept-Language`, không `Set-Cookie`.
  - Giả `navigator.languages = ['vi-VN']` trên `/rooms/<slug>/` → dải gợi ý hiện, link tới `/vi/rooms/<slug>/`. Bấm đóng rồi tải lại → không hiện. Khách bấm "English" trên trang VI → về bản EN, không có dải gợi ý.

### 3.4 Nội dung và chuỗi
- Một trang chỉ được phát hành khi đủ bản dịch của **mọi ngôn ngữ đã phát hành** (v1: EN + VI). Test schema nội dung đỏ nếu thiếu.
- Bản tiếng Anh là bản dẫn dắt, viết theo giọng thương hiệu. Bản tiếng Việt và (sau này) tiếng Nga do người duyệt theo `content-guide.md`. Không dịch máy cho văn bản pháp lý (như US-112 AC3).
- Chuỗi giao diện chung (menu, chân trang, dải gợi ý ngôn ngữ, nhãn và lỗi của form) thêm nhóm khóa `landing.*` vào `design/copy/strings-{vi,en,ru}.json` qua `gen_strings.py` (một quy trình dịch cho cả dự án). Build landing chỉ lấy khóa `landing.*` (như cách guest-web lọc khóa).
- Nội dung dài (giới thiệu, mô tả hạng phòng) nằm trong content collections của landing.

---

## 4. Đặt phòng *(viết lại 17/10 khuya – FB-INV-002 ý 3, 4; hợp đồng OpenAPI 0.3.7 bổ sung 2)*

> Nguồn sự thật của hợp đồng: `product/docs/api/openapi.yaml` 0.3.7 bổ sung 2 (tag `public-site`, `website-requests`) và `erd.md` mục 4.14. Mục này giữ **lý do** và quy tắc, không chép lại schema. Bảng việc cài (BE-D, FE-LP, FE-B): `rounds/round-02/outputs/ARC/openapi-0.3.7.md` mục 12.

### 4.1 Các nấc (theo FB-INV-002 – thay bảng L0–L3 cũ)
| Nấc | Nội dung | Phương án FB-INV-002 | Trạng thái |
|---|---|---|---|
| **L0** | Trang tĩnh + chat. Nút chính **Zalo OA**; WhatsApp · Telegram · Viber, gọi, email ở "Kênh khác"; link fanpage Facebook (4.2) | – (sửa theo ý 4) | LP-v1 |
| **L1** | **"Yêu cầu đặt phòng"**: khách chọn ngày, số người, hạng phòng, để tên + SĐT (Zalo) → hàng chờ Desk, nguồn `website` + nguồn phụ (ví dụ `facebook`). Không giữ chỗ, không thanh toán. Sale/lễ tân xác nhận qua Zalo, giữ chỗ, gửi QR cọc | **A – đội đề xuất, chờ INV** | Hợp đồng chốt (0.3.7 bổ sung 2). Cài theo lịch ORC. Bật trên mạng sau SEC C-2, C-3, SEC-G1/G2 và ESC-001 (LZ-2, LZ-8) |
| **L2** | Như L1, thêm bước xem còn/hết phòng và giá trực tiếp trước khi gửi (US-131) | B | **Contract-ahead**: `getPublicAvailability`, `getPublicOffers`, `offerSnapshot` – chỉ cài khi INV chọn B (~1 sprint sau A) |
| **L3** | Đặt + trả tiền ngay (US-132) | C | R4+, **ADR riêng** (cổng thanh toán – ESC-010) |

Đổi A → B **không** đổi `createWebsiteBookingRequest` hay hàng chờ Desk: trang chỉ thêm bước xem phòng trống và gửi kèm `offerSnapshot`; Desk hiện thêm "Giá trên web lúc gửi".

### 4.2 Nút liên hệ và fanpage (L0 – theo FB-INV-002 ý 4)
- **Zalo OA là kênh chính.** Trên điện thoại, thanh dính đáy chỉ có 2 nút: "Đặt phòng" và "Zalo". Ở mọi chỗ khác, Zalo đứng đầu ở **cả** bản EN và VI. Điều này thay quy tắc cũ "bản EN xếp WhatsApp trước" (ESC-020 L2-A, US-151 AC1) – UXD/PO cập nhật concept và AC.
  - Link OA do INV lấy từ trang quản lý OA, lưu trong `site.json` (`contact.zaloOaUrl`). Dạng link chính xác **[Chưa xác minh]** – không tự ghép từ OA ID.
  - **Không** nhúng widget/SDK chat của Zalo (script bên thứ ba, cookie, phải nới CSP, dữ liệu người xem gửi sang Zalo trước khi khách bấm).
- **WhatsApp · Telegram · Viber**: vẫn có, nhưng ở chỗ phụ – một nút "Kênh khác" mở danh sách trong phần Liên hệ và trang cảm ơn. Không ở thanh đáy, không ở màn đầu.
- **Fanpage Facebook** (`https://www.facebook.com/profile.php?id=100091335431646`, INV gửi 17/10): **chỉ là link** `<a href … rel="noopener">` ở chân trang và phần Liên hệ.
  - **Không** nhúng Facebook Page Plugin, SDK, nút Like/Share hay chat Messenger: đó là script bên thứ ba và cookie → phá SEC C-1 và kéo theo banner đồng ý (mục 6.3).
  - Không dùng logo Facebook (nhãn hiệu bên khác): chữ "Facebook" + biểu tượng chung, như các kênh chat (concept mục 10).
  - CSP mục 1.4 không đổi – link điều hướng không cần nới CSP.
- **Nút "Book now" trên fanpage** (INV tự đặt trong phần cài đặt trang Facebook): trỏ `https://<tên-miền>/book/?utm_source=facebook&utm_medium=page_button&utm_campaign=book_now` (khách Việt: `/vi/book/…`).
  - Trang `/book/` chứa form L1. Khi form **chưa bật**, `/book/` vẫn sống và hiện nút Zalo + "Kênh khác" – link trên fanpage không bao giờ 404.
  - Link nội bộ của landing giữ nguyên query UTM (không cookie, không localStorage), nên khách đi từ trang chủ sang `/book/` vẫn mang nguồn.
- **Điện thoại**: `tel:` số hotline công khai (C0).
- **Email**: `mailto:booking@<tên-miền>` – hộp thư chung, **không** dùng email cá nhân in trong e-brochure (sửa 17/10). `site.json` chỉ nhận email có đuôi là tên miền OTTIMO; tên miền chưa có thì ẩn nút.
- **Bản đồ**: ảnh tĩnh tự host + link "Mở Google Maps / Apple Maps"; không iframe.
- Bấm nút được đếm bằng bộ đếm tổng hợp (mục 6, US-158) – không pixel.

### 4.3 Form "Yêu cầu đặt phòng" (L1) – vì sao tạo `website_booking_request`, không tạo giữ chỗ, lead hay hồ sơ khách
- **Tên** đổi từ `booking_inquiry` (phác thảo trước) sang **`website_booking_request`** / `createWebsiteBookingRequest`, khớp chữ INV dùng ("yêu cầu đặt phòng") và nguồn `website`. Lý do thiết kế giữ nguyên:
  - **Không tạo giữ chỗ** (`room_occupancy` loại `hold`): bot gửi hàng loạt sẽ khóa hết phòng và đẩy đóng phòng lên OTA. Giữ chỗ chỉ do nhân viên tạo bằng luồng có sẵn, vẫn qua ràng buộc chống trùng ADR-009.
  - **Không tạo lead hay hồ sơ khách**: `lead.guest_id` bắt buộc; tạo hồ sơ từ dữ liệu chưa kiểm sẽ (1) làm bẩn CRM bằng spam, (2) gộp nhầm – người lạ nhập SĐT của khách quen → dữ liệu lạ gắn vào hồ sơ thật (BR-951). Yêu cầu không có FK tới `guest`/`lead`.
- **Chuyển thành giữ chỗ/đơn qua luồng có sẵn** (thay "chuyển thành lead" của phác thảo – US-155 AC2):
  1. Nhân viên mở yêu cầu → `GuestPicker` điền sẵn tên/SĐT/email → chọn hoặc tạo hồ sơ (chống trùng BR-951 như mọi nơi).
  2. **Giữ chỗ**: `saveQuote` kèm `websiteBookingRequestId` → `createHoldFromQuote`. Hoặc **đơn đảm bảo** (FD+, khách đã chốt và đã cọc): `createReservation` kèm `websiteBookingRequestId`.
  3. Server ghi `directSource = website`, `directSubSource`, chuyển yêu cầu `converted` và xóa C2 trong **cùng giao dịch** (cổng `WebsiteRequestPort` của module `public-site`).
  - Không có operation "convert" riêng → không có đường thứ hai vượt các ràng buộc: chống trùng căn – đêm (ADR-009), giá BR, hạn giữ chỗ (BR-302), hạn mức giữ chỗ (`HOLD_LIMIT_REACHED`).
  - Không bắt buộc qua "lead": sale vẫn tạo lead nếu muốn theo dõi trên kanban (US-087). Với 10 căn, bớt một bước giúp trả lời nhanh hơn.
- **Định danh khách đến từ website** (FB-INV-002 ý 3): kênh `direct`, `directSource = website` (BR-112).
  - **Nguồn phụ** `directSubSource` (`facebook`, `instagram`, `google`, `zalo`, `qr`, `other`, hoặc null) do server suy ra: từ UTM của link (nút "Book now" gắn `utm_source=facebook`), hoặc từ tên miền giới thiệu khi không có UTM. Không ai nhập tay.
  - Desk hiện "Website · Facebook"; DATA đếm theo nguồn phụ (US-158).
  - Khách xem website rồi tự nhắn Zalo (không qua form): lễ tân chọn nguồn theo BR-112 như hiện nay (DOM làm rõ ở US-151 AC4) – không đổi.
- **Luồng**:
  1. Khách gửi → `202` + mã tham chiếu 8 ký tự + `replyBy`.
  2. Desk báo: thông báo `website_request_new` (FDL, FD, SAL – chỉ ngày, số đêm, số khách), mục "Cần chú ý" `website_request_new` (FD+), SSE.
  3. Nhân viên **nhận xử lý** → liên hệ qua kênh khách chọn (Zalo trước) → báo giá → giữ chỗ → QR cọc → đơn.
  4. Hoặc **Từ chối** (lý do: hết phòng, giá, không liên lạc được, khách không đặt nữa, trùng, không hợp quy định, khác) hay **Spam**.
- **Trạng thái**: `new → in_progress → converted | declined | spam`; `in_progress → new` (trả lại hàng chờ); `declined | spam → in_progress` (mở lại khi C2 chưa xóa). Tự `declined` lý do `stale` khi không hoạt động (SEC ARC-03). BA thêm SM-18 (mã đề xuất WR1–WR7).
- **Hạn trả lời** `replyBy`: trong giờ trực (BR-811) = lúc nhận + `web_request_response_minutes` (mặc định 30 [GIẢ ĐỊNH – DOM chốt]); ngoài giờ = giờ mở trực kế tiếp + số phút đó. Trang cảm ơn hiện giờ này và nút "Nhắn Zalo" soạn sẵn mã yêu cầu (US-155 AC1).
- **Không tự gửi email/Zalo xác nhận** tới liên hệ khách nhập: địa chỉ chưa xác minh, kẻ xấu có thể dùng form để gửi tin rác tới người khác. Trang hiện xác nhận ngay. Khi Zalo OA/ZNS chạy thật (ESC-021), lời chào tự động chỉ gửi **sau** khi nhân viên liên hệ hoặc khi chính khách nhắn OA trước.
- **Không lộ gì** (SEC ARC-04 và yêu cầu ORC):
  - Endpoint không đọc `guest`, `lead`, `reservation`, `room_occupancy` trước khi trả lời.
  - Mọi kết quả "đã nhận" (kể cả ô bẫy, liên hệ vượt giới hạn) cùng hình dạng `{refCode, replyBy}`.
  - Không trả lại dữ liệu khách nhập, kể cả trong `errors[]`.
  - Phương án A không có phòng trống hay giá.
  - `refCode` chỉ để tra nội bộ – không phải yếu tố xác minh, không có endpoint công khai tra theo mã.

### 4.4 Chống spam (theo tầng)
**Tầng 1 – mặc định, không bên thứ ba:**
1. **Ô bẫy** `website`: ẩn bằng class CSS (không `style=`), `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`. Có giá trị → `202` **giống hệt** nhưng không lưu; chỉ tăng bộ đếm `spam_honeypot`.
2. **Form token có chữ ký** (`getPublicFormToken`): HMAC(`PUBLIC_FORM_SIGNING_KEY_FILE`, cơ sở | thời điểm cấp | nonce). Từ chối nếu gửi < 3 giây sau khi cấp, quá 2 giờ, sai chữ ký, khác cơ sở hoặc dùng lại → `422 FORM_TOKEN_INVALID`; trang lấy mã mới và gửi lại **một** lần.
3. **Origin = `LANDING_BASE_URL`**, khai theo operation `x-allowed-origins: [landing]` (SEC ARC-06):
   - sai → `403 FORBIDDEN_ACTION` – mã chung của guard hiện có; bỏ mã riêng `ORIGIN_NOT_ALLOWED` của phác thảo;
   - operation nhân viên/khách không bao giờ nhận origin landing; endpoint công khai bỏ qua mọi cookie;
   - chỉ `application/json`, body ≤ 8 KB (Caddy chặn ở 16 KB), trường lạ → 422.
4. **`Idempotency-Key` bắt buộc** (principal `public_site` + cơ sở): mạng chập chờn gửi lại không tạo bản thứ hai. Phản hồi cũ được trả **trước** khi kiểm form token, nên không tiêu token mới.
5. **Giới hạn tần suất** – đếm trong DB `rate_limit_counter` ngay từ ngày bật (SEC ARC-05 điểm 4, SR-RL-11):
   - theo IP: 5/giờ và 20/ngày, IPv6 theo /64 → `429 RATE_LIMITED` + `Retry-After`;
   - theo SĐT: 3/ngày, khóa = HMAC bằng khóa dẫn xuất riêng `web_request_contact` (SEC ARC-07) → **`202` giống hệt**, không lưu; tăng `duplicateCount` + cờ `repeat_contact` trên yêu cầu mới nhất của SĐT đó (SEC ARC-04);
   - trần cơ sở `public_booking_request_daily_cap` (100/ngày, biên 50–500 – tham số bảo mật) → **`503 SITE_BUSY`** + `Retry-After`, không lưu, **không** giả thành công; một cảnh báo OWN mỗi ngày (SEC ARC-02).
   - IP lấy từ `X-Forwarded-For` do Caddy ghi (`TRUST_PROXY`), chỉ lưu dạng HMAC (`LOG_IP_HMAC_KEY`).
6. **Gắn cờ nghi ngờ** (không chặn): `contains_url`, `unexpected_script`, `far_future`, `repeat_contact`, `room_type_unmatched` – nhân viên lọc.

**Tầng 2 – bật khi tầng 1 không đủ** (ARC quyết, không tốn tiền): spam lọt > 10 yêu cầu/tuần (đếm theo số lần nhân viên `mark-spam`) trong 2 tuần liên tiếp → bật thử thách **proof-of-work tự host** (ví dụ ALTCHA – mã nguồn MIT, máy chủ xác minh chạy trong api, không gửi dữ liệu ra ngoài) [Nguồn: altcha.org; giấy phép phần máy chủ cần đọc lại trước khi dùng – Chưa xác minh]. Bật bằng tham số cơ sở, không sửa trang.

**Tầng 3 – chỉ khi có ESC**: Cloudflare Turnstile **[Chưa xác minh hiệu quả với site này]**. Gói Free miễn phí, không bắt buộc dùng Cloudflare proxy [Nguồn: Turnstile plans], cần thêm `https://challenges.cloudflare.com` vào `script-src` và `frame-src` [Nguồn: Turnstile CSP]. Gửi dữ liệu trình duyệt của khách sang Cloudflare (nước ngoài) → phải cập nhật thông báo xử lý dữ liệu và danh sách chuyển dữ liệu ra nước ngoài (ESC-002) → SEC đánh giá, INV quyết.

### 4.5 Kiểm dữ liệu đầu vào (zod dùng chung từ `packages/contracts`, sinh từ `WebsiteBookingRequestInput`)
| Trường | Quy tắc |
|---|---|
| `arrival` | ≥ hôm nay theo giờ cơ sở (ADR-008), ≤ hôm nay + `booking_window_days` (BR-112) |
| `departure` | > `arrival`, tối đa 366 đêm. **Một ô ngày cho mọi khách** – boutique stay, không tách form "căn hộ dịch vụ"/thuê tháng (FB-INV-002 ý 2). Từ 28 đêm server ghi `stayKind = long` (BR-108), sale báo giá dài hạn; không báo lỗi. Bỏ `stayType`/`months` của phác thảo |
| `adults`, `children`, `childrenAges` | 1–12; 0–8; tuổi 0–17, đủ `children` phần tử nếu gửi. Không chặn theo sức chứa (nhóm nhiều căn vẫn gửi được – sale xử lý) |
| `roomType` | Slug của `Room.publicRoomType`; vắng = "tư vấn giúp"; không khớp hạng đang bán → vẫn nhận + cờ `room_type_unmatched` |
| `guestName` | 1–80 ký tự, bỏ ký tự điều khiển |
| `phone` | **Bắt buộc** (Zalo là kênh chính); V-02; số nước ngoài cần `+mã nước` |
| `email` | Tùy chọn (V-03); bắt buộc khi `preferredChannel = email` |
| `preferredChannel` | `zalo` (mặc định, đứng đầu) · `whatsapp` · `telegram` · `viber` · `phone` · `email` |
| `note` | ≤ 500 ký tự; số thẻ → `CARD_NUMBER_DETECTED` (SR-PAY-09); số CCCD/hộ chiếu/MRZ → `ID_NUMBER_DETECTED` (SEC ARC-08). Cả hai không lưu |
| `consent`, `consentVersion` | `true` (ô không tích sẵn, một mục đích – SEC C-3) + phiên bản thông báo đã đăng của `locale` → lỗi `CONSENT_REQUIRED`, `NOTICE_VERSION_INVALID` |
| `locale` | `vi` \| `en` \| `ru` |
| `utm`, `refHost`, `landingPath` | UTM `[a-z0-9._-]{1,64}` (trang tự làm sạch); `refHost` chỉ tên miền; đường dẫn không query |
| `formToken`, `website` (bẫy) | như 4.4 |
| `offerSnapshot` | Contract-ahead phương án B – phương án A bỏ qua |

### 4.6 Tối thiểu hóa dữ liệu cá nhân, hạn lưu, quyền xem
- Chỉ hỏi: tên gọi, SĐT (email tùy chọn), ngày, số người, hạng phòng, lời nhắn. **Không** hỏi quốc tịch, giấy tờ, ngày sinh, địa chỉ, số thẻ.
- C2 (rbac D28): `guestName`, `phone`, `email`, `note`, `declineNote`. Không vào log, URL, thông báo đẩy, tiêu đề email. Không lưu IP rõ, không User-Agent; `ip_hmac` giữ 30 ngày.
- **Hạn lưu cho mọi trạng thái** (SEC C-2, ARC-03 – bảng đầy đủ ở erd 4.14):
  - `new`/`in_progress` không hoạt động 30 ngày → `declined` (`stale`);
  - `declined`: xóa C2 sau 90 ngày; `spam`: xóa cả bản ghi sau 7 ngày;
  - trần tuyệt đối 180 ngày từ lúc tạo, áp cả `new`/`in_progress`; `reopen` không kéo dài;
  - `converted`: xóa C2 ngay khi chuyển (dữ liệu đã ở hồ sơ khách với hạn lưu riêng – T05/T06).
  - Biên do SEC đặt là **tham số bảo mật** (`x-security-parameters`, bật cùng PR US-155); job xóa không phụ thuộc chuyển trạng thái.
- **Thông báo xử lý dữ liệu có phiên bản** (SEC C-3, ARC-05): bảng `privacy_notice_version` (băm văn bản, ngày đăng); văn bản đầy đủ trong repo landing; trang `/privacy/`, `/vi/privacy/` có trước khi bật form. Căn cứ ghi "Luật 91/2025 + NĐ 356/2025" thay "NĐ 13/2023" [Chưa xác minh – luật sư, ESC-001].
- Yêu cầu của chủ thể dữ liệu (UC-30): tìm theo SĐT quét cả `website_booking_request` qua `contact_hmac`.
- **Quyền xem** (SEC ARC-12):
  - OWN, MGR, FDL, FD thấy mọi yêu cầu của cơ sở;
  - **SAL** chỉ thấy yêu cầu `new` chưa ai nhận và yêu cầu giao cho mình (`x-scope: unassigned_or_own`; ngoài phạm vi → 404);
  - **không** cho CTV, HK, MT. BA thêm màn + hành động vào `rbac-matrix.md`.

### 4.7 L2 – phương án B (contract-ahead, US-131): phòng trống + giá công khai
**Đơn vị công bố** *(sửa 17/10 khuya)*: **hạng phòng công khai** = slug của `room.public_room_type` (BR-012, có từ 0.3.7 D1). **Bỏ** bảng `public_listing` của phác thảo: không cần cấu hình thứ hai. Nội dung (tên, mô tả, ảnh) nằm trong landing theo slug; API chỉ biết slug.

**Endpoint** (chỉ đọc, `security: []`, đã có trong hợp đồng, `x-round: R3`, **không cài**):
- `getPublicAvailability(from, to)`: lịch theo ngày, mỗi hạng: `available` (true/false) và giá một đêm trực tiếp khi còn phòng. Cửa sổ ≤ 62 đêm mỗi lần gọi, trong `booking_window_days` (BR-112).
- `getPublicOffers(arrival, departure, adults, children, roomType?)`: mỗi hạng: còn hay hết, tổng tiền, giá trung bình/đêm, giảm giá đã áp, phụ thu người, % cọc (BR-305), khóa chính sách hủy để trang hiện văn bản. Chỉ ngắn ngày (1–27 đêm); từ 28 đêm trả `longStayHint` và mời gửi yêu cầu.

**Ánh xạ module** (ADR-001: chỉ gọi qua `modules/<x>/public`):
- Module `public-site` (controller công khai + projection). Không có bảng nghiệp vụ riêng ngoài `website_booking_request` và bảng phụ ở erd 4.14.
- Phòng trống: `reservations/public` – cùng nguồn `room_occupancy` như rack và kênh (ADR-009 điểm 4), cùng quy tắc với `searchAvailability` (căn ngừng bán, OOO, giữ chỗ, đơn đều tính là bận).
- Giá: `reservations/public` – cùng bộ tính của `calculateQuote` (US-080), kênh `direct` + nguồn `website`: giá niêm yết từng căn (BR-101), lịch giá (BR-104), giảm theo số đêm (BR-107), làm tròn (BR-005), phụ thu người (BR-110). Giá của hạng = **giá thấp nhất** trong các căn còn trống của hạng cho cả khoảng ngày.
- Đường vào trước ngữ cảnh RLS: hàm `SECURITY DEFINER` hẹp `public_resolve_property(slug)` (erd 4.14).

**Không lộ dữ liệu nội bộ** (projection theo danh sách cho phép, test hợp đồng kiểm):
- Không số căn, không `roomId`, không mã nhóm nội bộ – chỉ slug hạng.
- Không số phòng còn lại – chỉ `available` (khớp FB-INV-002 ý 1: không nêu số phòng). Không có cờ "sắp hết phòng".
- Không lý do bận (đơn hay OOO), không hoa hồng, không `ottimoRemainingVnd`, không phí kênh, không giá OTA.
- Lỗi chung, cùng hình dạng phản hồi; ngoài cửa sổ → 422 `VALIDATION_FAILED`.

**Cache**: trong api – cache RAM (LRU ≤ 1.000 mục) theo khóa tham số, sống 60 giây; **xóa ngay** khi có NOTIFY `occupancy.changed` hoặc `rates.changed`. HTTP: `Cache-Control: public, max-age=30, stale-while-revalidate=30` + `ETag`. Ngân sách: p95 < 150 ms khi chưa có cache, < 20 ms khi có cache.

**Giới hạn tần suất**: 60/phút/IP và 1.000/ngày/IP mỗi endpoint đọc (SR-RL-13); vượt → 429.

**Không giữ chỗ, giá chỉ để tham khảo**: form gửi kèm `offerSnapshot` (hạng, tổng tiền, thời điểm tính, phiên bản giá). Desk hiện "Giá trên web lúc gửi" cạnh giá tính lại; lệch thì sale quyết. Trang ghi rõ "Giá tham khảo, nhân viên xác nhận".

**Chính sách giá công khai** (PO/DOM/INV – ESC-020 L3 đã chọn "chỉ thuê tháng từ …"): hiện giá đêm trên web là đổi chính sách → cần INV quyết lại khi chọn B; điều khoản ngang giá OTA [Chưa xác minh]. Kiến trúc không đổi theo lựa chọn – tham số `public_show_prices` (mặc định tắt).

### 4.8 Hợp đồng OpenAPI (0.3.7 bổ sung 2 – thay phác thảo YAML trước đây ở mục này)
| Operation / trường | Kiểu | Phương án | Ghi chú |
|---|---|---|---|
| `getPublicFormToken` | GET công khai | A | 200 / 404 / 429; `Cache-Control: no-store` |
| `createWebsiteBookingRequest` | POST công khai | A | 202 / 403 / 404 / 409 / 422 / 428 / 429 / 503 |
| `listWebsiteBookingRequests`, `getWebsiteBookingRequest`, `transitionWebsiteBookingRequest` | Desk | A | FD+; SAL `unassigned_or_own`; hành động `claim`, `release`, `decline`, `mark-spam`, `reopen` |
| `saveQuote.websiteBookingRequestId`, `Quote.websiteBookingRequestId`, `createHoldFromQuote` (mô tả), `ReservationCreate.websiteBookingRequestId`, `Reservation.directSubSource` | Thêm trường | A | Chuyển thành giữ chỗ/đơn qua luồng có sẵn |
| `AttentionItem.kind` `website_request_new`; `StaffNotification.kind` `website_request_new`, `website_request_cap_reached`; SSE `website_request.changed` | Thêm giá trị | A | Không tên/SĐT trong thông báo |
| `getPublicAvailability`, `getPublicOffers`, `WebsiteBookingRequestInput.offerSnapshot`, `PublicOfferSnapshot` | Contract-ahead | B | Không cài |
| `recordSiteEvent` (bộ đếm mục 6) | – | US-158 | **Chưa** vào hợp đồng – làm cùng US-158; áp SEC ARC-09 lúc đó |

- Mã mới: `FORM_TOKEN_INVALID` (422), `SITE_BUSY` (503). Mã trường mới: `CONSENT_REQUIRED`, `NOTICE_VERSION_INVALID`, `ID_NUMBER_DETECTED`.
- Bỏ `ORIGIN_NOT_ALLOWED` của phác thảo (dùng `403 FORBIDDEN_ACTION` như guard hiện có).
- Mọi operation mới có `x-round: R3` cho tới khi ORC xếp lịch US-155. Kéo vào luồng LP → ARC bỏ `x-round` của 5 operation phương án A, sinh lại `rbac-cases`.

### 4.9 Dữ liệu (0.3.7 bổ sung 2 – thay bảng phác thảo trước đây)
`erd.md` mục 4.14:
- Bảng mới: `website_booking_request`, `privacy_notice_version`, `public_form_nonce`, `rate_limit_counter`; hàm `public_resolve_property`.
- Cột mới: `reservation.direct_sub_source`, `quote.website_booking_request_id`.
- Tham số: `public_booking_requests_enabled`, `public_booking_request_daily_cap`, `web_request_response_minutes`, `retention.web_request_*`.
- Job: `web_request.stale`, `web_request.purge`.
- `web_metric_daily` (mục 6) làm cùng US-158. `public_listing` bỏ (4.7).

---

## 5. SEO

- **HTML tĩnh đầy đủ nội dung** cho từng ngôn ngữ (không dựng bằng JS) → máy tìm kiếm đọc được ngay.
- Mỗi trang: `<title>` riêng (≤ 60 ký tự), `meta description` (≤ 160 ký tự), canonical, hreflang (mục 3), Open Graph (`og:title`, `og:description`, `og:image` JPEG 1200×630 ở `/og/`, `og:locale` + `og:locale:alternate`), `twitter:card=summary_large_image`, `theme-color` = token Ivory (mục 2.5), favicon theo logo guideline (mục 2.5). Chữ trong `<title>`, `description`, `og:*` viết theo giọng thương hiệu; bản EN là bản dẫn dắt.
- `sitemap-index.xml` sinh bởi `@astrojs/sitemap` (tùy chọn `i18n`), chỉ gồm trang đã phát hành; không gồm 404, trang cảm ơn.
- `robots.txt` (production): `User-agent: *`, `Allow: /`, `Disallow: /v1/`, `Sitemap: https://<tên-miền>/sitemap-index.xml`. Staging: `Disallow: /` + header `noindex`.
- **JSON-LD** (dữ liệu từ `site.json`, một nguồn cho cả trang và schema):
  - Trang chủ: `Hotel` (kiểu con của `LodgingBusiness`) với `@id` `https://<tên-miền>/#hotel`, `name`, `url`, `image`, `address` (`PostalAddress` – địa chỉ đầy đủ do INV cung cấp), `geo`, `telephone`, `email`, `checkinTime`/`checkoutTime` (theo BR-401 – hiện là giả định chờ INV xác nhận), `amenityFeature`, `availableLanguage`, `numberOfRooms` (10), `sameAs` (link trang OTA, Zalo OA, mạng xã hội) [Nguồn: schema.org Hotel, LodgingBusiness]; kèm `WebSite` có `inLanguage`.
  - Trang loại căn: `HotelRoom` có `containedInPlace` → `#hotel`, `occupancy`, `bed`, `floorSize`, `amenityFeature`; `BreadcrumbList`.
  - **Không** gắn `aggregateRating`/`review` tự đăng: Google không hiện sao cho trang mà chính cơ sở kiểm soát đánh giá [Nguồn: Google review snippet]. Không dùng `VacationRental` (chỉ dành cho đối tác có Hotel Center) [Nguồn: Google vacation rental]. Không đưa giá tĩnh vào schema (dễ lỗi thời); R3 cân nhắc khi có API giá.
- Kiểm tra trong CI: Lighthouse CI điểm SEO ≥ 95; test kiểm mỗi trang có đủ title, description, canonical, thẻ hreflang của mọi ngôn ngữ đã phát hành + `x-default` (mục 3.3), JSON-LD hợp lệ (parse được, có `@type`).
- Việc ngoài code (PO nhắc INV): tạo/nhận quyền **Google Business Profile** và **Google Search Console** (xác minh bằng bản ghi DNS TXT – không gắn script).

## 6. Đo lường truy cập (bảo vệ quyền riêng tư)

### 6.1 Quyết định
- Tự đếm **tổng hợp theo ngày** trong DB của OTTIMO: script nhỏ gửi `navigator.sendBeacon` tới `/v1/public/.../site-events` (cùng origin, CSP `connect-src 'self'` đã cho phép).
- Sự kiện: xem trang, bấm Zalo/điện thoại/email/OTA, bắt đầu điền form, gửi form, (R3) tìm phòng.
- Lưu: ngày, đường dẫn, ngôn ngữ, loại sự kiện, tên miền nguồn giới thiệu, `utm_*`, loại thiết bị (di động/máy tính – suy ra từ User-Agent rồi bỏ User-Agent). **Không** cookie, không localStorage, không IP, không mã phiên, không vân tay trình duyệt.
- Bỏ qua (không đếm): bot tự khai trong User-Agent; trình duyệt gửi `Sec-GPC: 1`.
- Phễu chuyển đổi thật (website → yêu cầu `website_booking_request` → báo giá/giữ chỗ → đơn `directSource='website'` + `directSubSource` → doanh thu – sửa 17/10 khuya) nằm sẵn trong DB → DATA tính G3 (kênh trực tiếp ≥ 35%) không cần công cụ ngoài. DATA định nghĩa chỉ số trong `metrics-definitions.md`.

### 6.2 Phương án đã cân nhắc
| Phương án | Vì sao chưa chọn |
|---|---|
| Google Analytics 4, Meta Pixel | Cookie + dữ liệu ra nước ngoài → bắt buộc banner đồng ý, nới CSP, thêm bên xử lý dữ liệu (ESC-002) |
| Umami tự host (MIT, dùng PostgreSQL) | Tốt, không cookie; nhưng thêm 1 container (~200–300 MB RAM [Chưa xác minh]), thêm giao diện quản trị phải vá và bảo vệ. Dùng khi marketing cần phân tích sâu hơn bộ đếm – ARC quyết lúc đó, không tốn tiền |
| Plausible tự host | Cần ClickHouse – nặng cho VPS 4 GB |
| Đọc log Caddy (GoAccess) | Log đã bỏ query và che IP theo yêu cầu bảo mật → mất UTM; không đếm được bấm nút |

### 6.3 Banner đồng ý
**Không cần banner** khi giữ đủ 4 điều kiện: (1) không cookie/lưu trữ trên máy khách cho đo lường; (2) không gửi dữ liệu cho bên thứ ba; (3) không lưu IP hay định danh; (4) thông báo xử lý dữ liệu mô tả việc đếm. Theo `data-risk-assessment.md`, khung pháp lý VN không có "lợi ích hợp pháp" – nên thiết kế **không xử lý dữ liệu cá nhân** cho đo lường thay vì dựa vào ngoại lệ. **[Chưa xác minh – SEC xác nhận, luật sư ánh xạ theo Luật 91/2025]**.
*(17/10 khuya – SEC ARC-11)* Điều kiện thứ 5: **không** có định danh từng người xem ở bất kỳ đâu – kể cả trong RAM quá thời gian của bộ đếm giới hạn tần suất; không gửi ngày, số khách, nội dung ô nhập vào sự kiện đếm (form "Yêu cầu đặt phòng" gửi dữ liệu **chỉ** qua `createWebsiteBookingRequest`, có đồng ý riêng). Câu cho thông báo quyền riêng tư: "Trang không dùng cookie theo dõi; chỉ đếm tổng số lượt theo ngày." Lưu chế độ sáng/tối trong `localStorage` là tùy chọn giao diện, không tính là đo lường.
Thêm bất kỳ thứ nào sau đây → **bắt buộc** banner đồng ý (tùy chọn từ chối ngang hàng nút đồng ý) + SEC review + có thể ESC: pixel quảng cáo, GA4, nhúng Google Maps/YouTube, widget chat Zalo, Turnstile (tầng 3).

## 7. Đường ống ảnh

1. **Ảnh gốc** (Drive của INV, PNG 4–60 MB): chỉ chép vào `00-brief/context/landing/raw/` trên máy người làm (đã `.gitignore`). Không đưa lên CI, không lên VPS. Việc tải về chờ INV cho phép (ORC hỏi).
2. **Chọn ảnh và đặt vào ô có tên** (UXD với INV): tệp `src/content/photos.json` khai mỗi ô ảnh: `slot` (ví dụ `hero`, `facade`, `lobby`, `listing-<slug>-1`…), tệp gốc, SHA-256 của tệp gốc (truy vết), điểm lấy nét, tỉ lệ khung, chữ thay thế (`alt`) cho **mọi ngôn ngữ đã phát hành** (v1: EN + VI), ghi công. Trang chỉ tham chiếu `slot`. Ô chưa có ảnh hiện **ảnh giữ chỗ** theo token (khối màu + tên ô), build vẫn chạy; trang có ô trống không được phát hành production (test kiểm).
3. **Kiểm ảnh trước khi dùng** (UXD tick trong `photos.json`): không có mặt người nếu chưa có đồng ý; không thấy mật khẩu Wi-Fi, mã bàn phím khóa cửa, giấy tờ, đồ cá nhân của khách, biển số xe.
4. **Script nạp** `scripts/ingest-photos.mjs` (chạy tay trên máy UXD/FE, nhận đường dẫn thư mục gốc bằng tham số; chạy `node` từ thư mục app, không từ thư mục ảnh): đọc tệp gốc bằng sharp → chuyển sRGB, **bỏ toàn bộ metadata** (EXIF, GPS), cạnh dài 2.560 px (ảnh hero) hoặc 2.000 px, lưu **master** WebP chất lượng ~90 (hoặc JPEG ~88 – UXD chọn) vào `src/assets/photos/<slot>.webp`; từ chối ảnh gốc nhỏ hơn 1.600 px cạnh dài. Ngân sách: mỗi master ≤ 800 KB, **tổng ≤ 30 MB trong git**. Không dùng Git LFS (thêm hạn mức, thêm công cụ).
5. **Build trong CI**: `<Picture>` của Astro sinh **AVIF + WebP**, các bề rộng 480/800/1200/1600/2000 (hero thêm 2400), tên băm trong `/_astro/` (cache 1 năm). Luôn có `width`/`height` (không xô lệch bố cục – CLS); ảnh đầu trang `loading="eager"` + `fetchpriority="high"`, còn lại `loading="lazy"` + `decoding="async"`. Ảnh chia sẻ mạng xã hội: JPEG 1200×630 ở `/og/`.
6. **Cache build**: Astro lưu ảnh đã xử lý ở `node_modules/.astro` [Nguồn: Astro images] → CI cache thư mục này (khóa = hash `src/assets/photos/**` + phiên bản Astro); `Dockerfile.web` dùng BuildKit `--mount=type=cache` cho cùng thư mục. Mục tiêu giữ CI < 5 phút khi không đổi ảnh (ADR-012); lần đầu mã hóa AVIF có thể lâu hơn [Chưa xác minh thời gian].
7. **Kiểm dung lượng** (`check-dist.mjs`): ảnh hero AVIF 1200w ≤ 200 KB; mọi biến thể ≤ 450 KB; tổng `dist` ≤ 80 MB. Vượt → CI đỏ.
8. **E-brochure** *(sửa 17/10)*: đã đọc (`00-brief/context/landing/ebrochure-text.md`). Chữ của brochure là **nguồn nội dung** để biên tập lại theo giọng thương hiệu (ESC-020 L5-A).
   - **Không** đăng bản PDF gốc. Lý do: in email cá nhân của một người; dùng màu terracotta ngoài bảng màu; có thể còn metadata.
   - Nếu INV muốn khách tải brochure (ESC-020 mục "Còn thiếu" 6): UXD làm bản theo Brand Guidelines, email chung `booking@<tên-miền>`, xóa metadata (SEC UXD-02), nén ≤ 5 MB. Phục vụ ở `/brochure/` với `Content-Disposition: attachment`.

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

Phụ thuộc khi chạy production: tên miền đã mua + quyền DNS (ESC-020 L4), VPS production (hosting-plan: R3), ESC-002 đã quyết A. Trước khi có production, INV xem bản landing ở `staging.<tên-miền>` (có basic auth/IP – mục 1.4) hoặc bản `astro preview` trên máy đội.

**Lên mạng LP-v1 trước khi có VPS production** *(mới 17/10, ARC quyết kỹ thuật; ORC chốt lịch)*:
- Theo PA2 (`hosting-plan.md` mục 4), R2 chỉ thuê **một** VPS – chính là máy sẽ thành production; khi chạy thật, staging chuyển sang máy phụ.
- Landing v1 là trang tĩnh, không gọi API, không thu dữ liệu. Vì vậy được phép phục vụ tên miền gốc từ VPS này trước R3, nếu đủ 3 điều kiện:
  1. origin landing chỉ phục vụ tệp tĩnh, trả 404 cho mọi `/v1/*` (không nối tới api staging);
  2. dùng bản build production của landing (không `X-Robots-Tag`), header như mục 1.4;
  3. qua cổng LP-v1 (SEC C-1).
- Form/bộ đếm (L1) chỉ bật trên production thật (US-155 AC4).
- Nếu VPS production sau này có IP khác: đổi bản ghi `@`, `www` cùng lượt với `desk`, `staff`, `g`.

**DNS và tài khoản tên miền**: đã đưa vào `hosting-plan.md` mục 10 (ARC sửa 17/10 theo giao việc ORC). Câu "Không trỏ tên miền gốc vào VPS này nếu đang dùng cho website giới thiệu" đã bỏ.

Bản ghi:

| Loại | Tên | Giá trị | Ghi chú |
|---|---|---|---|
| A | `@` | `<IP-production>` | Landing |
| CNAME (hoặc A cùng IP) | `www` | `<tên-miền>.` | Caddy chuyển 301 `www` → gốc, giữ nguyên đường dẫn |
| A | `staging` | `<IP-staging>` | Landing staging |
| TXT | `@` | mã xác minh Google Search Console | Không gắn script |
| CAA | `@` | `0 issue "letsencrypt.org"` | Giữ – áp cho gốc, `www` và mọi tên miền con |

Bảo vệ tài khoản tên miền (SEC ARC-10 – INV làm, 0 đ):
- tên miền và tài khoản nhà đăng ký/DNS đứng tên **công ty**;
- bật xác thực 2 lớp;
- bật khóa chuyển nhượng.

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

| Yêu cầu tới tên miền ngoài khi tải trang | **0** (v1 – SEC C-1, mục 2.6) | Playwright đếm request |
| Chuyển hướng khi mở trang chủ | **0** (không 302 theo ngôn ngữ – mục 3) | Playwright / `curl -I` |

Job CI: `turbo run build test --filter=@ottimo/landing-web...` chỉ chạy khi landing hoặc phụ thuộc đổi.

Playwright mở:
- trang chủ của mọi ngôn ngữ đã phát hành (`/`, `/vi/`; `/ru/` khi có);
- 1 trang hạng phòng và trang liên hệ.

Playwright kiểm:
- không lỗi CSP;
- 0 yêu cầu ra ngoài origin;
- quy tắc ngôn ngữ ở mục 3.3 (không chuyển hướng, dải gợi ý, giữ lựa chọn);
- từ L1: form gửi được tới api thật (Postgres service) trong E2E.

---

## Hệ quả

- **Tốt**: không tăng chi phí; dữ liệu khách ở VN; trang nhanh (gần như không JS); cùng nhận diện và token với app, đúng Brand Guidelines v1.0 (test chặn màu ngoài bảng); không bên thứ ba khi tải trang; mọi URL trả cùng nội dung cho người và bot (SEO không phụ thuộc chuyển hướng); đơn từ web đi thẳng vào Desk qua luồng có sẵn (yêu cầu → báo giá → giữ chỗ/đơn, nguồn `website` + nguồn phụ), không có đường tắt vượt ràng buộc chống trùng (ADR-009); không cần banner cookie.
- **Phải chấp nhận**:
  - Khách ở châu Âu/Nga tải chậm hơn so với CDN – có điều kiện đo để thêm CDN ảnh.
  - Landing ngừng khi VPS ngừng (cùng điểm lỗi đơn đã chấp nhận ở ADR-010).
  - Khách có trình duyệt tiếng Việt mở tên miền gốc sẽ thấy bản tiếng Anh trước, kèm dải gợi ý "Xem bằng tiếng Việt" (một chạm).
  - Khách Việt dùng trình duyệt tiếng Anh không được gợi ý, phải bấm nút ngôn ngữ ở đầu trang.
  - Bù lại: tìm kiếm tiếng Việt trên Google dẫn thẳng tới `/vi/…` nhờ hreflang; link gửi khách Việt trỏ `/vi/…` (mục 3.2 điểm 6).
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
| **ARC** | ~~Đưa mục 4.8 vào `openapi.yaml`, mục 4.9 vào `erd.md`~~ **xong 17/10 khuya** (0.3.7 bổ sung 2: 4 operation công khai – 2 của phương án A, 2 contract-ahead B – + 3 operation nhân viên, 2 mã lỗi mới; erd 4.14; bảng việc cài ở `openapi-0.3.7.md` mục 12). Còn: cập nhật `architecture.md` (container `landing-web` thay `booking-web`, bảng 5.3, cây thư mục mục 17, mục 16 thêm ngân sách landing). Dòng ADR-014 trong ADR README đã thêm (17/10) | Bước hợp đồng của sprint làm L1 |
| **PO** | Viết story cho **phần giới thiệu** (L0: trang, nội dung 3 ngôn ngữ, ảnh, SEO, nút Zalo/điện thoại) và **form yêu cầu + hộp thư Desk** (L1); gắn US-131 cho L2; xếp lịch (đề xuất L0 làm song song Sprint 4–5 vì không đụng lõi; L1 cùng US-131 đầu R3). Quyết hiện giá công khai hay không (4.7) – nếu là chính sách giá thì mở ESC | Lập kế hoạch Sprint 4/R3 |
| **BA** | Máy trạng thái `website_booking_request` (SM-18, mã đề xuất WR1–WR7 – erd 4.14), màn + hành động trong `rbac-matrix.md` (FD+, SAL `unassigned_or_own`; không cho `collaborator`), use case "Xử lý yêu cầu từ website" | Trước khi cài US-155 |
| **DOM** | Ngưỡng phản hồi yêu cầu web (BR mới, theo giờ trực BR-811); khoảng kỳ hạn dài hạn cho form; văn bản trang chính sách (nội quy, hủy, giờ nhận/trả – khớp BR); xác nhận giá trực tiếp trên web theo BR-101/104/107; câu hỏi rate parity với OTA | Trước L1 / L2 |
| **SEC** | Thêm SR-RL cho endpoint công khai (SR-RL-10…13 – số ở 4.4, 4.7); xác nhận 4 điều kiện "không cần banner" (6.3); hạn lưu `website_booking_request`, `ip_hmac` (4.6 – đã dùng biên ARC-03, SEC đặt mã T19); soạn thông báo xử lý dữ liệu có phiên bản; review CSP landing; thêm `PUBLIC_FORM_SIGNING_KEY` vào sổ bí mật | Review ADR này + trước L1 |
| **OPS** | Site thứ 4 trong `Caddyfile.prod` (mục 1.4, bản sửa 17/10: không chuyển hướng theo ngôn ngữ; `/en/*` → 301; 404 theo tiền tố; v1 không proxy `/v1/*`; staging có basic auth/IP) + bản dev; `Dockerfile.web` thêm `/srv/landing-web` + cache BuildKit cho ảnh; biến `LANDING_HOST`, `LANDING_SITE_URL` (biến build CI), `LANDING_BASE_URL` (api, bắt buộc https ở staging/production khi bật website), `PUBLIC_FORM_SIGNING_KEY` (`_FILE`, ≥ 32 ký tự); khai biến build trong `turbo.json` `env` (quy tắc 4 ADR-012); `expected-headers.sh` kiểm header landing (không `X-Robots-Tag` ở production, có ở staging); job Lighthouse CI; hosting-plan mục 5, 5.1, 10 **ARC đã cập nhật 17/10** (DNS gốc, `www`, `staging`, bảo vệ tài khoản tên miền) – OPS rà lại và kiểm theo checklist mục 10.1 (HSTS, CAA, `dig`); hỏi hạn mức băng thông quốc tế khi xin báo giá VPS | Khi dựng L0 |
| **UXD** | Thiết kế landing theo **Brand Guidelines v1.0** (mục 2.5):<br>• thêm nhóm màu thương hiệu vào token DS v0.4 qua `gen_tokens.py` (đúng HEX guideline, có kiểm tương phản), **không** token đất nung;<br>• giọng tiếng Anh dẫn dắt;<br>• danh sách ô ảnh + `alt` EN/VI;<br>• nội dung EN + VI theo `content-guide.md` (RU theo ESC-020 L1);<br>• khóa chuỗi `landing.*`, gồm dải gợi ý ngôn ngữ;<br>• sửa concept 3.1, 4.1, 9.1, 9.3 theo quy tắc ngôn ngữ mục 3: EN ở gốc, `x-default` = EN, không nút "sắp có", nút ngôn ngữ luôn thấy ở đầu trang | L0 |
| **FE** | *(17/10 khuya: tách FE-LP – form `/book/`, FE-B – hàng chờ Desk; bảng việc `openapi-0.3.7.md` mục 12)* Dựng `apps/landing-web` theo mục 2–3, 5–7, 9; xóa `apps/booking-web/README.md` (thay bằng landing-web); thêm export `@ottimo/ui/tokens.css`, `@ottimo/ui/fonts.css` (Lora, Be Vietnam Pro, JetBrains Mono) trong `packages/ui`; module gợi ý ngôn ngữ (mục 3.2); test chặn màu ngoài bảng và tài nguyên ngoài (mục 2.5, 2.6); L1: script form + màn Desk "Yêu cầu từ website"; R3: widget đặt phòng | L0, L1, L2 |
| **BE** (BE-D) | Module `public-site`: `getPublicFormToken`, `createWebsiteBookingRequest`, hàng chờ Desk (`list/get/transitionWebsiteBookingRequest`), cổng `WebsiteRequestPort` cho `saveQuote`/`createHoldFromQuote`/`createReservation`, job `web_request.stale`/`web_request.purge`; meta `allowedOrigins` + guard Origin theo operation; `recordSiteEvent` cùng US-158; phương án B (availability/offers + cache + NOTIFY) chỉ khi INV chọn B – bảng việc `openapi-0.3.7.md` mục 12 | L1 (theo lịch ORC), L2 |
| **INT** | Lấy link Zalo OA chính thức (INV cấp); khi ESC-010 đổi sang dùng Zalo OA: thiết kế lời chào tự động **sau** khi nhân viên liên hệ (4.3), không gửi tới liên hệ chưa xác minh | Theo ESC mới về Zalo |
| **DATA** | Định nghĩa chỉ số landing (lượt xem theo ngôn ngữ, tỉ lệ bấm liên hệ, yêu cầu → đơn web theo nguồn phụ `directSubSource`, lý do từ chối – nhu cầu mất) từ `web_metric_daily` + `website_booking_request` | R3 |
| **QA** | Test chống spam (bẫy, token quá nhanh/dùng lại, Origin sai, giới hạn), test projection không lộ số căn/hoa hồng, test hreflang/CSP/Lighthouse | Theo sprint |

Dòng đề xuất cho `decision-log.md` (ORC ghi khi commit):
- `| 2026-10-17 | 2 | ADR-014 sửa: landing tiếng Anh ở gốc (không tiền tố), VI ở /vi/, RU ở /ru/ khi phát hành; không tự chuyển hướng theo ngôn ngữ (không Accept-Language/302/cookie); chỉ dải gợi ý + giữ lựa chọn của khách; hreflang 2 chiều + x-default = bản EN; thay quy tắc 302 cũ và concept UXD (/ = VI) | ARC (+ PO xác nhận US-152 AC2) | Brand Guidelines "tiếng Anh dẫn dắt"; Google khuyên không tự chuyển hướng theo ngôn ngữ, Googlebot không gửi Accept-Language |`
- `| 2026-10-17 | 2 | Landing theo Brand Guidelines v1.0 qua token chung (chỉ bảng 80/15/5, không terracotta, test chặn màu ngoài bảng); v1 không tải script/tài nguyên bên thứ ba; email công khai là hộp thư chung booking@<tên-miền>, không dùng email cá nhân in trong e-brochure | ARC | INV 17/10 (Brand Guidelines); SEC C-1 |`
- `| 2026-10-17 | 2 | Tên miền gốc phục vụ landing từ VPS chính (hosting-plan mục 10); LP-v1 được lên trên VPS R2 trước khi có production nếu origin landing chỉ phục vụ tệp tĩnh, không proxy /v1/* | ARC | ADR-014 mục 8; ORC chốt lịch |`
- `| 2026-10-17 | 2 | ADR-014: landing = app tĩnh apps/landing-web (Astro 6, Vite 7), Caddy trên VPS production phục vụ tên miền gốc, chỉ proxy /v1/public/*; thay thư mục booking-web | ARC | 0 đ thêm, dữ liệu ở VN, cùng pipeline |`
- `| 2026-10-17 | 2 | Form web tạo booking_inquiry (không lead, không giữ chỗ); chống spam tầng 1 tự làm (bẫy + form token + Origin + giới hạn); tầng 2 PoW tự host; tầng 3 Turnstile chỉ qua ESC | ARC | Tránh khóa phòng hàng loạt, tránh gộp nhầm hồ sơ khách |`
- `| 2026-10-17 | 2 | Đo lường landing = bộ đếm tổng hợp trong DB, không cookie/IP → không banner đồng ý [SEC xác nhận] | ARC | Không bên thứ ba, không container mới |`
- `| 2026-10-17 | 2 | (khuya, FB-INV-002) Hợp đồng "Yêu cầu đặt phòng" phương án A (OpenAPI 0.3.7 bổ sung 2): website_booking_request (thay tên booking_inquiry), không giữ chỗ/lead/hồ sơ; chuyển thành giữ chỗ/đơn qua saveQuote/createHoldFromQuote/createReservation kèm websiteBookingRequestId; nguồn website + directSubSource suy từ UTM/nguồn giới thiệu; phương án B chỉ contract-ahead; mọi operation mới x-round R3 tới khi ORC xếp lịch | ARC | Một đường duy nhất qua ràng buộc chống trùng/giá; INV chưa xác nhận A/B |`
- `| 2026-10-17 | 2 | (khuya) Endpoint công khai landing: Origin khai theo operation (x-allowed-origins: [landing]) → 403 FORBIDDEN_ACTION khi sai; Idempotency-Key bắt buộc (principal public_site); giới hạn IP 429, theo SĐT 202 giống hệt, trần cơ sở 503 SITE_BUSY; đếm trong DB rate_limit_counter | ARC | SEC ARC-02, 04, 05, 06, 07 |`
- `| 2026-10-17 | 2 | (khuya) Fanpage Facebook chỉ là link (không SDK/plugin); Zalo OA đứng đầu ở cả bản EN và VI; nút "Book now" của fanpage trỏ /book/?utm_source=facebook… | ARC (+ UXD/PO cập nhật concept, US-151 AC1) | FB-INV-002 ý 4; SEC C-1 |`

## 11. Giả định

- [GIẢ ĐỊNH] INV có (hoặc sẽ mua) một tên miền gốc, chưa dùng cho website khác; `ottimo.vn` chỉ là ví dụ.
- [GIẢ ĐỊNH] Quy tắc ngôn ngữ mục 3 là quyết định kỹ thuật của ARC, đặt trên nền quyết định thương hiệu INV đã có (tiếng Anh dẫn dắt). Không cần ESC mới. Câu mô tả L1-A trong ESC-020 ("trình duyệt tiếng Việt mở bản Việt") cần PO sửa cho khớp trước khi INV trả lời.
- [GIẢ ĐỊNH] Hộp thư chung đặt phòng là `booking@<tên-miền>` (tên hộp thư INV chọn; chỉ cần là hộp thư chung trên tên miền OTTIMO).
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
- Google – Managing multi-regional and multilingual sites (không tự chuyển hướng theo ngôn ngữ đoán được; Googlebot không gửi `Accept-Language`): https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites [Nguồn]
- Google – Locale-adaptive pages (Googlebot gửi yêu cầu không có `Accept-Language`): https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages [Nguồn]
- OTTIMO Brand Guidelines v1.0 (INV 17/10): `00-brief/context/brand/brand-guidelines.md`, bản gốc `OTTIMO_Brand_Guidelines.pdf` [Nguồn nội bộ]
- Google – Review snippet (đánh giá tự kiểm soát không được hiện sao): https://developers.google.com/search/docs/appearance/structured-data/review-snippet [Nguồn]
- Google – Vacation rental structured data (cần Hotel Center): https://developers.google.com/search/docs/appearance/structured-data/vacation-rental [Nguồn]
- schema.org `Hotel`, `LodgingBusiness`, `HotelRoom`: https://schema.org/Hotel, https://schema.org/LodgingBusiness, https://schema.org/HotelRoom [Nguồn]
- Cloudflare Turnstile – CSP: https://developers.cloudflare.com/turnstile/reference/content-security-policy/ [Nguồn]; Plans (Free): https://developers.cloudflare.com/turnstile/plans/ [Nguồn]
- ALTCHA (MIT, tự host): https://altcha.org/open-source-captcha/ [Nguồn – phần máy chủ cần đọc lại kho mã]
