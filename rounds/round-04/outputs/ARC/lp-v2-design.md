# LP-v2 – Thiết kế kỹ thuật: giá ước tính trong form + ngôn ngữ ko/zh/ru cho landing

- Người viết: ARC | Round 4 – Bước Sản xuất (lượt A, gói LP-v2) | Ngày 01/11/2026 | Phiên bản 0.1
- Nguồn việc: `rounds/round-04/plan-lp-v2.md` (G1–G5), `04-investor-feedback/FB-INV-008.md`, `FB-INV-009.md`.
- Đã đọc: ADR-014 (mục 3, 4, 9), OpenAPI 0.3.8-draft (tag `public-site`, `website-requests`), erd 4.14, business-rules BR-101…114, `reviews/ARC-on-OPS-us155-enable.md` (FB-01), mã `apps/landing-web/` (i18n, booking-request, sync-fonts, dist-checks), `services/api/src/modules/public-site/`, `reservations/public/pricing*.ts`, `infra/caddy/Caddyfile.landing`, `infra/server/bin/{deploy-landing,publish-privacy-notice}.sh`, `publish-privacy-notice.sql`, migration 0086.
- Hợp đồng: `product/docs/api/openapi.yaml` lên **0.3.9-draft** (mục "Thay đổi phiên bản 0.3.9-draft"). Operation mới mang `x-round: R4`.
- Chưa có khi viết: luật giá của DOM (`rounds/round-04/outputs/DOM/web-price-estimate-rules.md`), chữ CPY, font UXD, bản dịch thông báo SEC. Thiết kế để các phần này cắm vào mà **không đổi hợp đồng**. Chỗ phải khớp ghi ở mục 8.

---

## 1. Tóm tắt quyết định

| # | Chủ đề | Quyết định ARC |
|---|---|---|
| D1 | Endpoint giá | Operation mới `getPublicPriceEstimate` – `GET /v1/public/properties/{propertySlug}/price-estimate`. **Không** cài `getPublicOffers`/`getPublicAvailability` (vẫn contract-ahead): hai operation đó trả còn/hết phòng, LP-v2 không làm phòng trống (FB-INV-009, ESC-020 L7-B). |
| D2 | Bộ tính | Dùng **chung** `PricingService` của `reservations/public` (kênh `direct`, nguồn `website`), qua một cổng mới `PublicRatePort`. Không dùng `quote-pricing` của `sales` (có hoa hồng, `ottimoRemainingVnd`). Không gõ giá vào web. |
| D3 | Không lộ dữ liệu | Phản hồi dựng theo **danh sách cho phép** (allowlist), có test hợp đồng. Không số căn, không `roomId`/`roomNo`/mã nhóm, không còn/hết, không giá OTA nền, hoa hồng, phí kênh, biên, sàn/trần. |
| D4 | Ước tính, không cam kết | Cờ `estimate: true` luôn có. Không giữ chỗ. Mặc định **không** "giữ giá chụp" (BR-916 (2) chỉ áp phương án B) – DOM chốt (mục 8). |
| D5 | Lưu con số khách đã thấy | Phản hồi có `estimateToken` (dữ liệu + HMAC). Form gửi lại `priceEstimateToken`. Server kiểm chữ ký, hạn, khớp yêu cầu → lưu `website_booking_request.price_estimate` (do server giải mã, không tin số client gửi). Sai/thiếu → **vẫn nhận yêu cầu**, cờ `offer_unverified`. |
| D6 | Công tắc | Tham số `public_show_prices` (bool, mặc định `false`, **chỉ OWN**, audit `config`) – tên đã có trong hợp đồng contract-ahead. `false` → 404, trang ẩn khối giá. |
| D7 | Bảo vệ Desk | Bộ đếm RAM, bulkhead và giới hạn tính **riêng** cho endpoint giá. Tra giá nhiều không ăn vào hạn mức 30/giờ của form, không chiếm 4 chỗ đồng thời của form. |
| D8 | Proxy | Thêm đúng **một** route GET vào `Caddyfile.landing`, cùng công tắc `LANDING_PUBLIC_API`. Cùng origin, không CORS, CSP giữ `connect-src 'self'`. |
| D9 | Mã ngôn ngữ | Schema mới `LandingLocale` = `en, vi, ko, zh, ru`, chỉ dùng cho form website và hàng chờ Desk. `Locale` chung (app khách/nhân viên) **giữ nguyên** `vi, en, ru` (G4). `zh` = tiếng Trung **giản thể**. |
| D10 | URL, hreflang | `/ko/`, `/zh/`, `/ru/`. `hreflang` chỉ mã ngôn ngữ (`ko`, `zh`, `ru` – theo ADR-014 3.3). `<html lang>`: `ko`, `zh-Hans`, `ru` (trình duyệt chọn đúng dạng chữ Hán giản thể). |
| D11 | Thông báo xử lý dữ liệu | **Một version mới cho cả 5 ngôn ngữ**, đăng trong **một** giao dịch. Bắt buộc, vì trang privacy `en`/`vi` cũng đổi byte (nút ngôn ngữ, hreflang) – ràng buộc FB-01. Trang có thêm dấu máy đọc `<meta name="ottimo-notice-version">` để script không phải dò chữ "Version"/"Phiên bản" theo từng ngôn ngữ. |
| D12 | Font | CSS font **theo ngôn ngữ**. Font chữ Hàn/Trung/Kirin chỉ tải ở trang ngôn ngữ đó. Tên ngôn ngữ trong nút chuyển ở trang khác dùng font hệ thống. Ngân sách ở mục 3.3. |

---

## 2. API công khai giá ước tính

### 2.1 Phạm vi
- Theo G1–G3: giá chỉ hiện **trong form**, sau khi khách chọn **hạng căn + ngày** (hoặc ngày đến + số tháng). Thân trang không có giá (quyết định 24/10). Con số "chỉ từ" BR-114 vẫn ở `site.json`, không đổi ở gói này.
- Ngắn ngày: **tổng ước tính cả chuyến** + chi tiết tối thiểu (số đêm, tổng tiền phòng trước giảm, % và số tiền giảm theo thời gian ở, phụ thu người).
- Dài hạn (`stayType = long`, hoặc ngắn ngày ≥ 28 đêm theo BR-108): **"từ X/tháng"**.
- **Không** trả còn/hết phòng, không giữ chỗ, không thanh toán. Giá của hạng tính trên các căn đang bán của hạng, **không** xét căn có trống hay không (không lộ mức lấp đầy). Giá cuối nằm trong báo giá lễ tân gửi.

### 2.2 Hợp đồng (chi tiết trong OpenAPI `getPublicPriceEstimate`, schema `PublicPriceEstimate`)

**Request** – `GET /v1/public/properties/{propertySlug}/price-estimate?…` (query không chứa dữ liệu cá nhân; Caddy đã bỏ query khỏi log):

| Tham số | Bắt buộc | Quy tắc |
|---|---|---|
| `roomType` | có | slug `Room.publicRoomType`, `^[a-z0-9-]{2,60}$` |
| `stayType` | không (`short`) | `short` \| `long` – cùng nghĩa với form |
| `arrival` | có | ≥ hôm nay (giờ cơ sở), ≤ hôm nay + `booking_window_days` (BR-112) |
| `departure` | khi `short` | > `arrival`, ≤ 366 đêm; gửi khi `long` → 422 `NOT_ALLOWED` |
| `months` | không | chỉ `long`, 1–24; vắng = chưa biết |
| `adults` | có | 1–12 |
| `children`, `infants` | không (0) | trẻ 6–11, trẻ dưới 6 (BR-110), 0–8 |

- Tham số lạ, lặp tham số, query > 512 byte → 422. Không cần form token, không cookie, không `Idempotency-Key`.
- Không có `locale`: phản hồi chỉ có số và mã; trang tự định dạng theo ngôn ngữ. Nhờ vậy cache dùng chung cho mọi ngôn ngữ.

**Response 200** – `PublicPriceEstimate`:

| Trường | Ý nghĩa |
|---|---|
| `estimate` | luôn `true` – cờ "ước tính" |
| `currency` | `VND` (chưa đổi ngoại tệ – không có nguồn tỉ giá) |
| `taxIncluded` | `true` khi giá niêm yết đã gồm VAT (BR-101 (2)) |
| `roomType`, `stayKind`, `arrival`, `departure`, `computedAt` | nhắc lại đầu vào đã chuẩn hóa |
| `priceAvailable` | `false` → không có số, `unavailableReason` ∈ `on_request` (hạng không có căn đang bán, slug lạ, thiếu giá) \| `party_exceeds_room` (đoàn vượt sức chứa mọi căn của hạng – vẫn gửi yêu cầu được) |
| `shortStay` | `nights`, `roomSubtotalVnd` (tổng giá lịch trước giảm), `upliftNights` (số đêm cuối tuần/ngày đặc biệt), `losDiscountPct`, `losDiscountVnd`, `extraPersonFeeVnd`, `totalVnd`, `nightlyAvgVnd` |
| `longStay` | `months` (có thể null), `monthlyFromVnd` |
| `longStayAlternative` | ngắn ngày 15–27 đêm: `monthlyFromVnd` của thuê tháng (BR-108 – DOM quyết có hiện không) |
| `notes[]` | mã để trang hiện câu điều kiện: `min_stay` (+`minNights`, BR-113), `long_stay_required` (≥ 28 đêm), `monthly_excludes_utilities`; DOM thêm mã = thêm giá trị enum (chỉ thêm) |
| `estimateToken`, `expiresAt` | xem 2.7; hạn 24 giờ |

**Mã lỗi** (không thêm mã mới ở mức top-level):
- 403 `FORBIDDEN_ACTION` – có `Sec-Fetch-Site` mà khác `same-origin`.
- 404 – cơ sở không có/không active, `public_booking_requests_enabled = false` **hoặc** `public_show_prices = false` (cùng hình dạng).
- 422 `VALIDATION_FAILED` – mã trường như form: `REQUIRED`, `NOT_ALLOWED`, `DATE_IN_PAST`, `DATE_ORDER`, `OUTSIDE_BOOKING_WINDOW`, `VALUE_OUT_OF_RANGE`.
- 429 `RATE_LIMITED` (+ `Retry-After`), 503 `SERVICE_UNAVAILABLE` (+ `Retry-After`).
- Ở tối thiểu (BR-113) **không** phải lỗi: vẫn 200, có `notes: [{code: min_stay, minNights: 2}]`. Lễ tân xử lý ngoại lệ đêm lẻ.

### 2.3 Cách tính (BE) – ánh xạ luật
1. `public_resolve_property(slug)` (cache RAM 60 giây như form) → đặt ngữ cảnh RLS. Đọc `public_show_prices` theo ngày nghiệp vụ.
2. `PublicRatePort.estimate(tx, input)` – **cổng mới** ở `modules/reservations/public/public-rate.port.ts` (ADR-001: module khác chỉ gọi qua `public`):
   - lấy các căn có `public_room_type` khớp slug và `is_sellable` (cùng nguồn với `WebsiteRequestsService.roomTypes`);
   - bỏ căn có `max_occupancy` < số người tính (người lớn + trẻ 6–11, BR-110); không còn căn → `party_exceeds_room`;
   - `PricingService.load(asOf = ngày nghiệp vụ)` **một lần**; với từng căn: kênh `direct` → giá lịch từng đêm theo BR-104 (cuối tuần/ngày đặc biệt), giảm BR-107, làm tròn BR-005, phụ thu người BR-110;
   - **giá của hạng = căn có tổng thấp nhất** [GIẢ ĐỊNH A2 – DOM chốt];
   - dài hạn: `monthlyFromVnd` = giá tháng niêm yết thấp nhất (BR-101 (3)) trong các căn hợp lệ; không cộng phí dịch vụ, điện nước, phụ thu khách nước ngoài BR-109 (form không hỏi quốc tịch) – DOM chốt câu điều kiện qua `notes`;
   - không áp mã khách quay lại (BR-111), FOC, giá thỏa thuận.
3. Cổng trả **kiểu nội bộ đã thu gọn** (`PublicRateEstimate`) – không có `roomId`, `groupCode`, `floorVnd`, `ceilingVnd`, `otaBaseRates`. Controller chỉ ánh xạ kiểu này sang schema. Hai lớp chặn: cổng không trả, controller không có trường để lộ.
4. `priceVersion` = 16 ký tự hex đầu của sha256 trên JSON chuẩn hóa của (tham số giá đã đọc + giá niêm yết của các căn đã xét). Chỉ nằm trong token và bản Desk, không trả riêng cho trang.
5. **Rate parity** (FB-INV-009, BR-104 lưu ý): nếu DOM quyết "giá web không thấp hơn OTA" thì thêm bước so trong `PublicRatePort` (đọc `ota_base_rate` **chỉ để so**, không bao giờ trả). Kiến trúc không đổi.

### 2.4 Không lộ dữ liệu kinh doanh
- Allowlist ở schema (`additionalProperties: false`) và serializer. Test hợp đồng: (a) mọi khóa của phản hồi thuộc schema; (b) chuỗi JSON phản hồi **không** chứa `ota`, `commission`, `remaining`, `floor`, `ceiling`, `roomId`, `roomNo`, `groupCode`, `available`, số căn (mã căn 3 chữ số của seed).
- Không còn/hết, không số căn còn lại. Không phân biệt "hạng không có căn" với "slug lạ" (cùng `on_request`).
- Giá theo hạng đã là giá niêm yết công khai cho khách. Rủi ro còn lại: đối thủ quét cả lịch giá. Với 10 căn và giá đã hiện trên OTA, rủi ro thấp. Hạn mức ở 2.5 làm việc quét chậm lại. SEC đánh giá trong `outputs/SEC/lp-v2-privacy-and-api.md`.

### 2.5 Giới hạn tần suất, bulkhead, cache
| Lớp | Giá trị | Vượt |
|---|---|---|
| RAM theo IP (IPv6 /64), **bucket riêng** `pubest:` | 40 / 10 phút và 300 / ngày, tính cả 4xx | 429 + `Retry-After` |
| Bulkhead riêng của endpoint giá | 2 request đang chạy, không xếp hàng | 503 + `Retry-After: 5` |
| Trần tính mới (cache miss) toàn cơ sở | 600 / giờ (hằng số module, chưa là tham số) | 503 |
| `statement_timeout` | 2 giây (như form) | 503 |
| Bucket `pub:` của form (30/giờ) và bulkhead 4 của form | **không** bị endpoint giá tiêu | – |

- Không ghi DB cho bộ đếm của GET (không `rate_limit_counter`): giá công khai, không có dữ liệu cá nhân, không cần đếm bền.
- **Cache RAM** (LRU ≤ 1.000 mục): khóa = (cơ sở, ngày nghiệp vụ, `roomType`, `stayKind`, `arrival`, `departure`/`months`, `adults`, `children`, `infants`); sống 300 giây; **xóa toàn bộ** khi nhận `NOTIFY config_changed` của cơ sở (đã phát từ `setParameter` – đổi giá niêm yết, lịch giá, ngày đặc biệt đều qua đây). Đổi `room.is_sellable`/`public_room_type` chưa phát NOTIFY → chấp nhận trễ ≤ 5 phút (ghi vào giả định A6).
- HTTP: `Cache-Control: private, max-age=60`. Không `ETag` (mỗi lần tính có `computedAt`, `estimateToken` mới).
- Ngân sách: p95 < 150 ms khi chưa cache, < 20 ms khi có cache (ADR-014 mục 9).

### 2.6 Proxy landing (`LANDING_PUBLIC_API`)
- `Caddyfile.landing` thêm matcher `@public_price_estimate`: `method GET`, `path_regexp ^/v1/public/properties/[a-z0-9-]{2,40}/price-estimate$`, cùng biểu thức `"{$LANDING_PUBLIC_API:off}" == "on"` → `import public_api`. Mọi `/v1/*` khác vẫn 404.
- `check-caddy-landing.sh` thêm 3 ca: `on` → GET `price-estimate` tới api; `on` → `POST price-estimate` → 404; `off` → 404.
- Không đổi CSP (`connect-src 'self'`). `PUBLIC_FORM_API_BASE` (khác origin) vẫn chỉ dùng cho môi trường thử.
- Việc này thuộc file của **OPS** – giao qua ORC (mục 5.3).

### 2.7 Lưu con số ước tính vào yêu cầu gửi Desk
- **Token** `estimateToken` = `pe1.` + base64url(payload JSON) + `.` + base64url(HMAC-SHA256(khóa, `pe1|<propertyId>|<payload base64url>`)).
  - Khóa: `keyedHash('public_estimate', …)` – thêm giá trị vào `KeyedHashPurpose` (cùng cơ chế HKDF với `web_request_contact`; không thêm bí mật mới, không đổi `.env`).
  - Payload (không có dữ liệu cá nhân, không `propertyId`): `rt, sk, a, d, m, ad, c, i` (đầu vào), `tot` hoặc `mf` (tổng hoặc giá tháng từ), `n`, `los`, `xp`, `pv` (priceVersion), `iat`, `exp` (= `iat` + 24 giờ). Dài < 400 byte.
- **Form** gửi `priceEstimateToken` (tùy chọn) trong `WebsiteBookingRequestInput` **chỉ khi** con số đang hiện trên trang được tính cho đúng hạng, ngày, số khách đang chọn. Khác → không gửi.
- **Server** (`createWebsiteBookingRequest`, sau bước kiểm schema, trước khi lưu): kiểm chữ ký (so sánh thời gian hằng), hạn, `propertyId`, và khớp `roomType`, `stayType`, ngày, `months`, số khách của yêu cầu.
  - Đạt → lưu payload đã giải mã vào cột mới `website_booking_request.price_estimate` (jsonb, không phải C2 – giữ sau khi xóa C2 cho DATA).
  - Không đạt hoặc thiếu (khi có `priceEstimateToken`) → không lưu, cờ `offer_unverified` (cờ đã có – mở rộng nghĩa).
  - **Không bao giờ** 422 vì token giá. Yêu cầu vẫn 202 như cũ. Phản hồi 202 không đổi.
  - Token nằm trong body nên thuộc băm idempotency như mọi trường.
- **Desk**: `WebsiteBookingRequest.priceEstimate` (`PublicPriceEstimateRecord`, nullable): hạng, kiểu ở, ngày, số khách, `totalVnd` hoặc `monthlyFromVnd`, `nights`, `losDiscountPct`, `extraPersonFeeVnd`, `currency`, `computedAt`, `priceVersion`. Ngăn kéo S35 hiện "Giá ước tính khách đã thấy lúc gửi" + thời điểm. Lễ tân báo giá bằng `calculateQuote` như cũ. Lệch thì lễ tân quyết theo luật DOM.
- `offerSnapshot` (phương án B) giữ nguyên contract-ahead, luôn null.

### 2.8 Khi Desk/api lỗi – form vẫn gửi được, ẩn giá (FE-B)
| Tình huống | Trang làm gì |
|---|---|
| `public_show_prices = false` → 404 | Không hiện khối giá, không câu báo lỗi. Form như LP-v1 |
| Form tắt (form token 404) | Khối Zalo/gọi như hiện nay – không gọi API giá |
| 422 (ngày/số khách chưa hợp lệ) | Ẩn giá; lỗi trường do kiểm tra của form hiện như cũ |
| 429, 503, 5xx, lỗi mạng, quá **3 giây** | Ẩn giá, hiện một câu trung tính (CPY: giá sẽ có trong báo giá). 429 → không gọi lại tới khi tải lại trang |
| 200 `priceAvailable: false` | Câu "Giá theo yêu cầu" (CPY) |
| Khách bấm Gửi khi giá đang tải | Gửi ngay, **không chờ**, không kèm token |
| `createWebsiteBookingRequest` trả `NOTICE_VERSION_INVALID` (cửa sổ vài phút giữa lúc đổi trang và lúc đăng version mới – 3.6) | Hiện khối Zalo/gọi (như 404), không hiện lỗi kỹ thuật |

- Gọi API khi đủ `roomType` + `arrival` + (`departure` hoặc `stayType = long`) + `adults`. Chờ 400 ms sau thay đổi cuối (debounce). Hủy request cũ bằng `AbortController`. Chỉ hiện kết quả của request mới nhất (số thứ tự).
- Vùng giá có `aria-live="polite"`. Không lưu gì vào localStorage/cookie.

### 2.9 Công tắc, thứ tự bật
1. `public_show_prices` (OWN, Desk H05 – danh mục tham số thường, audit `config`). Mặc định `false` → phát hành landing LP-v2 trước, bật giá sau khi QA so giá web = giá Desk (FB-INV-009 QA).
2. Tắt khẩn: OWN đặt `false` → lâu nhất 60 giây (cache `public_resolve_property`) + 60 giây (cache trình duyệt) là trang hết hiện giá. Nếu SEC muốn công tắc khẩn "có hiệu lực ngay trong ngày" như `public_booking_requests_enabled` thì thêm khóa này vào danh sách ngoại lệ – đổi hợp đồng nhỏ (SEC quyết).

---

## 3. Ngôn ngữ ko, zh, ru

### 3.1 Mã, URL, khai báo tìm kiếm
| Ngôn ngữ | Đường dẫn | `hreflang` | `<html lang>` | `og:locale` | Tên trên nút chuyển |
|---|---|---|---|---|---|
| Tiếng Hàn | `/ko/…` | `ko` | `ko` | `ko_KR` | 한국어 |
| Tiếng Trung giản thể | `/zh/…` | `zh` | `zh-Hans` | `zh_CN` | 简体中文 |
| Tiếng Nga | `/ru/…` | `ru` | `ru` | `ru_RU` | Русский |

- Giữ mọi quy tắc ADR-014 mục 3: tiếng Anh ở gốc, không tự chuyển hướng, chỉ gợi ý, hreflang 2 chiều + `x-default` = bản EN, sitemap cùng hàm `alternatesFor`.
- `hreflang` chỉ mã ngôn ngữ (ADR-014 3.3). `zh-Hans` chỉ ở `<html lang>` để trình duyệt hiện đúng chữ Hán giản thể. Test "html lang khớp đường dẫn" dùng bảng ánh xạ, không so chuỗi trực tiếp.
- Dải gợi ý ngôn ngữ: `zh`, `zh-CN`, `zh-SG`, `zh-Hans*` → gợi ý `/zh/`; **`zh-TW`, `zh-HK`, `zh-MO`, `zh-Hant*` → không gợi ý** (coi như `en`) – bản dịch là giản thể. `ko-*` → `ko`; `ru-*` → `ru`.

### 3.2 Landing (Astro)
- `src/lib/i18n.ts`: `LANGS = ['en','vi','ko','zh','ru']`; thêm `HTML_LANG` (`zh` → `zh-Hans`), `OG_LOCALE`, `LANG_NAME`. `alternatesFor` không đổi logic.
- Trang: bỏ thư mục chép tay `src/pages/vi/`. Thay bằng route động `src/pages/[lang]/index.astro`, `[lang]/[privacy].astro`, `[lang]/404.astro`, với `getStaticPaths` sinh từ `LANGS` trừ `en`. Thêm ngôn ngữ sau này chỉ cần sửa `LANGS` + nội dung. Bản dựng `vi` phải ra **đúng byte như trước**, trừ phần đầu trang (nút ngôn ngữ, hreflang). Test so trước/sau.
- Nội dung: `content/ko.ts`, `zh.ts`, `ru.ts` (chữ của CPY), kiểu `PageCopy` bắt đủ trường (ADR-014 3.4: thiếu một trường → build đỏ). `privacy.ts` thêm 3 bản (chữ của SEC/luật sư).
- Chuỗi của form lúc chạy (`scripts/booking-strings.ts`): tách mỗi ngôn ngữ một module, nạp bằng `import()` theo `document.documentElement.lang`. Trang `en` không tải chữ Hàn/Trung/Nga → giữ ngân sách JS.
- Nút đổi ngôn ngữ: 5 mục, vẫn là link thường, luôn thấy ở đầu trang (ADR-014 3.2 điểm 5). Không JS cũng dùng được (ví dụ `<details>`). Dạng hiển thị do UXD quyết.
- `localStorage` `ottimo.lang` nhận thêm `ko|zh|ru`. Không gửi về máy chủ.
- Caddy (OPS): `handle_errors 404` theo tiền tố `/(vi|ko|zh|ru)/` → `/<lang>/404/index.html`; **bỏ** `/ru /ru/*` khỏi `@closed`.

### 3.3 Font và ngân sách tải trang
**Vấn đề:** Lora và Be Vietnam Pro không có chữ Hàn, chữ Trung. Be Vietnam Pro không có chữ Kirin. Lora có bộ cyrillic trong @fontsource. Font Hàn/Trung nặng (cả bộ vài MB).

**Quy tắc kỹ thuật** (UXD chọn họ font, ARC đặt khuôn):
1. Mỗi ngôn ngữ một tệp CSS font: `styles/fonts-ko.css`, `fonts-zh.css`, `fonts-ru.css`, sinh bằng `sync-fonts.mjs` (mở rộng). Chỉ trang của ngôn ngữ đó import tệp này (layout chọn theo `lang`). `fonts.css` hiện có (latin, latin-ext, vietnamese) giữ cho mọi trang.
2. Font CJK lấy từ @fontsource bản **cắt theo `unicode-range`** (bộ Noto đã chia nhiều lát nhỏ). Trình duyệt chỉ tải lát có chữ trên trang. Chỉ **một độ đậm** cho tiêu đề và tối đa **hai** cho nội dung. `font-display: swap`. **Không** preload font CJK.
3. Họ font CJK/Kirin chỉ gán qua `:root:lang(ko)`, `:root:lang(zh-Hans)`, `:root:lang(ru)`. Tên ngôn ngữ trong nút chuyển (có `lang` riêng) ở trang khác dùng **font hệ thống** – nếu không, trang `en` sẽ tải lát font Hàn/Trung chỉ vì chữ "한국어", "简体中文".
4. Đề xuất của ARC (để UXD cân nhắc): **nội dung** tiếng Hàn/Trung dùng **font hệ thống** (Apple SD Gothic Neo / Malgun Gothic / Noto Sans CJK KR trên Android; PingFang SC / Microsoft YaHei / Noto Sans CJK SC). Như vậy nội dung tốn 0 KB. Chỉ **tiêu đề** dùng font serif tự host (gần Lora). Tiếng Nga: Lora cyrillic cho tiêu đề, font nội dung có Kirin do UXD chọn.

**Ngân sách** (bổ sung ADR-014 mục 9; FE-B cài vào `dist-checks.mjs` + Lighthouse CI):
| Chỉ số | Đích |
|---|---|
| Trang chủ `en`, `vi` | **0** tệp font ko/zh/ru được tải (Playwright đếm request); các chỉ số cũ giữ nguyên |
| Font tải lần đầu, trang chủ `/ko/`, `/zh/` | ≤ 300 KB (woff2) |
| Font tải lần đầu, trang chủ `/ru/` | ≤ 150 KB |
| Một tệp font | latin/cyrillic ≤ 30 KB (như cũ); một lát CJK ≤ 80 KB |
| Tổng tải lần đầu trang chủ mỗi ngôn ngữ | ≤ 700 KB (như cũ) |
| LCP, CLS | ≤ 2,5 giây, ≤ 0,1 – Lighthouse chạy cho **cả 5** trang chủ |
| JS gzip thêm cho khối giá | ≤ 3 KB; chuỗi form mỗi ngôn ngữ là một module riêng |

`dist-checks.mjs`: danh sách tên font cho phép mở rộng theo họ font UXD chọn. Thêm kiểm "tệp CSS font của ngôn ngữ X chỉ được trang X tham chiếu".

### 3.4 Form và API nhận ngôn ngữ mới
- Hợp đồng: `WebsiteBookingRequestInput.locale` và `WebsiteBookingRequest.locale` → `LandingLocale` (`en, vi, ko, zh, ru`). Phía response chỉ **thêm** giá trị enum. Admin-web đã hiện theo khóa `webreq.locale.<mã>`, chỉ cần thêm chuỗi.
- Migration (BE, số kế tiếp sau migration cuối cùng có trên nhánh khi làm): đổi CHECK `privacy_notice_version_locale_check` và `website_booking_request_locale_check` thành `IN ('vi','en','ru','ko','zh')`. Chỉ nới, không đổi dữ liệu.
- Kiểm `locale`: `LOCALES` trong `public-booking.service.ts` lấy từ hằng sinh từ hợp đồng. Locale chưa có dòng `privacy_notice_version` → `NOTICE_VERSION_INVALID` như hiện nay (đóng an toàn).
- `readiness()` (bật `public_booking_requests_enabled`): thay danh sách cứng `['vi','en']` bằng biến môi trường **`LANDING_LOCALES`** (mặc định `en,vi`; mỗi phần tử ∈ `LandingLocale`, sai → api không khởi động). Production đặt `en,vi,ko,zh,ru` khi landing LP-v2 chạy. `.env` của server là nguồn chung cho api và script OPS.
- Cờ `unexpected_script`: `hasUnexpectedScript(text, locale)` – luôn cho phép Latin + dấu, số, dấu câu; thêm Hangul cho `ko`, Han (+ dấu câu CJK toàn khổ) cho `zh`, Cyrillic cho `ru`. Hiện tại chữ Hàn/Trung sẽ bị gắn cờ sai.
- Nhận diện số thẻ/số giấy tờ (`CARD_NUMBER_DETECTED`, `ID_NUMBER_DETECTED`) chạy trên bản **NFKC** để bắt chữ số toàn khổ (`０-９`) mà bộ gõ Trung/Hàn hay sinh ra. Giá trị lưu vẫn là bản NFC như cũ.
- Độ dài `guestName` (80), `note` (500) tính theo ký tự, không đổi.
- Kênh liên hệ: enum giữ nguyên. Ghi chú cho PO: khách Trung Quốc ít dùng WhatsApp/Telegram, khách Hàn dùng KakaoTalk. Thêm `wechat`/`kakaotalk` = OTTIMO phải có tài khoản ở đó (BR-913 (4)). Đây là quyết định sản phẩm, không làm ở gói này.

### 3.5 Desk hiện ngôn ngữ khách
- `WebsiteBookingRequest.locale` đã có. Admin-web (`WebRequestDrawer.tsx`) hiện `t('webreq.locale.' + r.locale)` → chỉ cần thêm `webreq.locale.ko`, `webreq.locale.zh` (chữ "Tiếng Hàn", "Tiếng Trung (giản thể)" – UXD, `design/copy/strings-*.json`). `ru` đã có.
- Mẫu trả lời gợi ý của Desk: khách không dùng `vi` → mẫu tiếng Anh (giữ như hiện nay). Không dịch tự động trong Desk (gửi lời nhắn – dữ liệu C2 – sang dịch vụ dịch nước ngoài là chuyển dữ liệu ra nước ngoài; SEC đánh giá việc lễ tân tự dùng công cụ dịch – rủi ro R4).
- Danh sách hàng chờ: thêm cột/nhãn ngôn ngữ là việc UXD/FE, không đổi API.

### 3.6 Thông báo xử lý dữ liệu theo locale – giữ ràng buộc FB-01
**Ràng buộc** (erd 4.14): một (`version`, `locale`) = đúng một chuỗi byte. Bản LP-v2 thêm 3 ngôn ngữ vào nút chuyển và hreflang của **mọi** trang, kể cả `/privacy/` và `/vi/privacy/` → byte của trang `en`, `vi` đổi.

**Quyết định:**
1. **Một version mới `V2` cho cả 5 ngôn ngữ** (ví dụ `2026-11-DD`). Không giữ version cũ cho `en`/`vi`. Form gửi một `consentVersion` duy nhất cho mọi ngôn ngữ (lấy từ `privacy.ts`, như hiện nay).
2. Mỗi trang privacy có thêm dấu máy đọc `<meta name="ottimo-notice-version" content="V2">`. Chữ "Version …" bản địa vẫn hiện cho khách. Script OPS đọc thẻ meta (đúng **một** thẻ mỗi trang) cho mọi ngôn ngữ, không dò chữ theo ngôn ngữ.
3. `publish-privacy-notice.sh` + `.sql` (OPS): bỏ cặp cứng `vi`/`en`.
   - Danh sách ngôn ngữ = `LANDING_LOCALES` trong `.env`. Đường dẫn: `/privacy/` cho `en`, `/<loc>/privacy/` cho ngôn ngữ khác.
   - Băm từng trang trong container + so trang thật qua edge.
   - SQL nhận mảng (`locale`, `sha`, `url_path`). Kiểm mọi locale trước khi ghi. **Một giao dịch** cho cả 5. Mọi `sha` khác nhau từng đôi.
   - Mỗi locale trong `LANDING_LOCALES` phải có trang. Thiếu → từ chối.
   - Dòng log `state/privacy-notice.log` đổi từ `sha_en= sha_vi=` thành `sha_<loc>=` cho từng ngôn ngữ (vẫn đọc được dòng cũ).
4. `deploy-landing.sh` bước `privacy`: lặp theo `LANDING_LOCALES` thay cho `en vi`; đọc version từ thẻ meta, và vẫn đọc mẫu chữ cũ cho image cũ khi `--rollback`. Quy tắc giữ nguyên: cùng version mà khác byte → FAIL khi `LANDING_PUBLIC_API=on`.
5. **Thứ tự phát hành** (OPS, README 12.3):
   - (a) api có migration mới, `LANDING_LOCALES` còn `en,vi`;
   - (b) `deploy-landing.sh --check-only` rồi deploy landing LP-v2;
   - (c) **ngay sau đó** `publish-privacy-notice.sh --version V2 --apply` (5 ngôn ngữ);
   - (d) đặt `LANDING_LOCALES=en,vi,ko,zh,ru`, khởi động lại api;
   - (e) QA kiểm form 5 ngôn ngữ;
   - (f) OWN bật `public_show_prices` khi QA giá đạt.
   - Giữa (b) và (c) (vài phút), trang mới gửi `V2` chưa có trong DB → `NOTICE_VERSION_INVALID` → trang hiện khối Zalo (2.8). Làm ngoài giờ đông khách.
   - Bản `V1` cũ còn được nhận 7 ngày sau khi bị thay (khách mở trang cũ từ trước).
6. Rollback landing về bản 2 ngôn ngữ sau khi đã đăng `V2`:
   - Trang `en`/`vi` cũ in `V1`, và `V1` đã bị thay. SQL không cho đăng lại version cũ.
   - Hướng xử lý: rollback trong 7 ngày thì form vẫn nhận `V1`. Quá 7 ngày thì phải dựng lại bản cũ với version mới. OPS ghi vào README.

---

## 4. Chia việc

### 4.1 BE (nhánh `lp-v2-api`; một PR; không đụng production trước ngày D)
| # | Việc | File | Test (Vitest + Postgres thật như các test public-site hiện có) |
|---|---|---|---|
| BE-1 | Sinh lại hợp đồng 0.3.9 | `services/api/src/generated/openapi-meta.ts` + `openapi-schemas.ts` (`pnpm --filter @ottimo/api gen:openapi`), `packages/api-client/src/generated/openapi.ts`, `packages/contracts` (zod) | `services/api/test/contract.test.ts` ca "is up to date with docs/api/openapi.yaml" xanh (đang đỏ từ khi spec đổi – xem 5.2); rbac-cases/traceability `--strict` xanh |
| BE-2 | Cổng tính giá công khai | **mới** `modules/reservations/public/public-rate.port.ts` (dùng `PricingService`, `pricing.ts`); export qua `reservations.module.ts` | `public-rate.port.test.ts`: ngày thường; thứ Sáu/thứ Bảy +15 %; ngày đặc biệt +30 % (31/12); 7 đêm −10 %, 14 đêm −15 %; phụ thu người lớn/trẻ 6–11 theo định mức; trẻ dưới 6 không tính; đoàn vượt sức chứa → `party_exceeds_room`; hạng không có căn bán → `on_request`; dài hạn `monthlyFromVnd` = giá tháng nhỏ nhất; ≥ 28 đêm → dài hạn; 15–27 đêm có `longStayAlternative`; ở tối thiểu → `notes.min_stay`. **Số mong đợi lấy từ ví dụ trong file luật DOM** (không tự đặt) |
| BE-3 | Endpoint `getPublicPriceEstimate` | `modules/public-site/internal/public-site.controller.ts` (route mới, bucket `pubest:`, bulkhead riêng), **mới** `internal/price-estimate.service.ts` (cache LRU, nghe `config_changed`, trần tính mới, allowlist), **mới** `internal/estimate-token.ts` (ký/kiểm `pe1`), `modules/crypto/public/crypto.service.ts` + `crypto.fake.ts` (thêm `public_estimate` vào `KeyedHashPurpose`) | `price-estimate.e2e.test.ts`: 200 đủ trường; khóa phản hồi ⊆ schema + **không** chứa chuỗi cấm (2.4); 404 khi `public_show_prices=false` / form tắt / slug cơ sở lạ; 422 từng mã trường; query lạ/lặp → 422; `Sec-Fetch-Site: cross-site` → 403; 41 lần/10 phút → 429 **trong khi** POST form vẫn 202 (bucket riêng); 3 request treo → 503 trong khi POST form vẫn chạy (bulkhead riêng); cache trúng không chạm DB; `setParameter` giá → cache xóa, số mới; `Cache-Control: private, max-age=60`; p95 đo ở QA |
| BE-4 | Nhận và lưu số ước tính | `internal/public-booking.service.ts` (trường `priceEstimateToken`, kiểm, cờ `offer_unverified`), `internal/website-requests.service.ts` (`priceEstimate` trong DTO Desk), migration mới (cột `price_estimate jsonb NULL`, CHECK `jsonb_typeof = 'object'`) | token đúng → lưu, Desk thấy `priceEstimate`; token sửa 1 byte / hết hạn / khác cơ sở / khác ngày / khác số khách → 202, không lưu, cờ `offer_unverified`; không token → `priceEstimate = null`, không cờ; phát lại idempotency cùng body → cùng kết quả; `price_estimate` còn sau job xóa C2 |
| BE-5 | Ngôn ngữ mới | cùng migration (CHECK locale 2 bảng), `public-booking.service.ts` (`LOCALES` từ hợp đồng; `readiness()` theo `LANDING_LOCALES`), `internal/public-site.options.ts` (đọc + kiểm `LANDING_LOCALES`), `internal/website-request-rules.ts` (`hasUnexpectedScript(text, locale)`, NFKC cho nhận diện số), `infra/server/env.production.example` + `.env.example` (thêm `LANDING_LOCALES=en,vi` – BE ghi dòng mẫu, OPS đặt giá trị thật) | `ko`/`zh`/`ru` + notice có dòng → 202; locale có trong enum mà chưa có notice → `NOTICE_VERSION_INVALID`; `ja` → `NOT_IN_LIST`; readiness thiếu `privacy_notice_version.ko` khi `LANDING_LOCALES` có `ko`; `LANDING_LOCALES=en,xx` → khởi động lỗi; lời nhắn tiếng Hàn ở `ko` không cờ, tiếng Hàn ở `en` có cờ; `１２３４ ５６７８ ９０１２ ３４５６` → `CARD_NUMBER_DETECTED`; test migration |
| BE-6 | Tham số `public_show_prices` | danh mục tham số (migration seed dòng `config_parameter_def`: bool, mặc định `false`, chỉ OWN, không `is_security`), `architecture.test.ts` nếu so danh mục | MGR `setParameter` → 403; OWN đổi → audit `config`; đổi → 404/200 trong ≤ 60 giây |

### 4.2 FE-B (landing, nhánh `lp-v2-landing`)
| # | Việc | File | Test |
|---|---|---|---|
| FE-B-1 | 5 ngôn ngữ, route động | `src/lib/i18n.ts`, `src/pages/[lang]/index.astro`, `[lang]/[privacy].astro`, `[lang]/404.astro` (xóa `src/pages/vi/*`), `src/content/{ko,zh,ru}.ts`, `content/types.ts`, `content/privacy.ts` (3 bản + `VERSION` mới + thẻ meta ở `PrivacyPage.astro`), `astro.config.ts` (sitemap `i18n.locales`) | `i18n.test.ts`: hreflang đủ 5 + `x-default`, 2 chiều, `zh` ↔ `lang="zh-Hans"`; `copy.test.ts` thiếu trường → đỏ; `dist.test.ts`: mỗi trang privacy có đúng một `ottimo-notice-version` = `privacy.ts` và = `data-consent-version` trang chủ cùng ngôn ngữ; bản `/vi/` chỉ khác bản cũ ở `<head>` + nút ngôn ngữ |
| FE-B-2 | Nút ngôn ngữ + dải gợi ý | `components/Header.astro`, `LangSuggest.astro`, `scripts/lang.ts` | `lang.test.ts`: `zh-CN`/`zh-Hans-SG` → zh; `zh-TW`/`zh-Hant-HK` → không gợi ý; `ko-KR` → ko; lựa chọn đã lưu thắng |
| FE-B-3 | Font theo ngôn ngữ | `scripts/sync-fonts.mjs` (bộ theo ngôn ngữ, Lora `cyrillic`), `src/styles/fonts-{ko,zh,ru}.css` (sinh), `layouts/Base.astro`, `package.json` (gói @fontsource UXD chọn, ghim phiên bản) | `brand.test.ts` (CSS font không cũ); `dist-checks.mjs`: tên font cho phép theo ngôn ngữ, tệp CSS font chỉ trang đúng ngôn ngữ tham chiếu, ngân sách 3.3 |
| FE-B-4 | Form gửi `locale` mới + khối giá | `scripts/booking-form.ts`, `booking-transport.ts` (`fetchEstimate`: GET, timeout 3 giây, `AbortController`, không retry), `booking-logic.ts` (điều kiện gọi, khớp token), **mới** `scripts/price-estimate.ts` (hiển thị, `aria-live`), `booking-strings.ts` → `booking-strings/{en,vi,ko,zh,ru}.ts` nạp động, `components/BookingForm.astro` (vùng giá theo UXD) | `booking.test.ts`: 200 hiện số; `priceAvailable:false` → câu "theo yêu cầu"; 404 → không có khối; 422/429/503/timeout → ẩn số, form vẫn gửi; phản hồi cũ đến sau không đè số mới; đổi ngày sau khi có số → token **không** gửi; gửi khi đang tải → không chờ; `NOTICE_VERSION_INVALID` → khối Zalo; định dạng số theo `Intl.NumberFormat` của ngôn ngữ trang (cách hiện "₫"/"VND" theo UXD) |
| FE-B-5 | E2E + hiệu năng | Playwright (thư mục E2E hiện có của landing), `lighthouserc` | 5 trang chủ: không lỗi CSP, 0 request ra ngoài origin, trang `en`/`vi` 0 tệp font ko/zh/ru; form gửi tới api thật ở `ko`; Lighthouse 5 trang chủ đạt ngân sách |

### 4.3 Việc của vai khác (ORC giao – ARC không sửa file của họ)
| Vai | Việc |
|---|---|
| OPS | `Caddyfile.landing` (route `price-estimate`, 404 theo ngôn ngữ, bỏ `/ru` khỏi `@closed`), `ci/check-caddy-landing.sh` (3 ca 2.6 + 404 `/ko/x`), `publish-privacy-notice.sh` + `.sql` + test (N ngôn ngữ, thẻ meta – 3.6), `deploy-landing.sh` bước `privacy` (N ngôn ngữ), `env.production.example` `LANDING_LOCALES`, README 12.3 (thứ tự 3.6 (5), rollback 3.6 (6)) |
| FE (admin-web, S35) | Ngăn kéo hiện `priceEstimate` ("Giá ước tính khách đã thấy lúc gửi" + thời điểm); mock `src/mocks/webreq.ts` thêm ca `ko`/`zh` và `priceEstimate` |
| UXD | Font + ghi lệch brand; nút 5 ngôn ngữ; khối giá (vị trí, cách viết tiền); chuỗi `webreq.locale.ko/zh`, nhãn Desk "Giá ước tính…" (`strings-*.json`) |
| CPY | Chữ 3 ngôn ngữ; câu "ước tính – giá cuối trong báo giá", câu theo từng `notes.code` và `unavailableReason`, câu khi ẩn giá |
| SEC | Review token `pe1`, hạn mức 2.5, rủi ro quét giá; quyết công tắc khẩn trong ngày cho `public_show_prices`; bản dịch thông báo `V2` |
| DATA | Đếm yêu cầu theo `locale`; tỉ lệ yêu cầu có `priceEstimate` (sau US-158) |
| QA | So giá web = `calculateQuote` của Desk cho các ca ngày thường / cuối tuần / lễ / 7, 14 đêm / tháng (FB-INV-009); ngân sách 3.3; form 5 ngôn ngữ |

---

## 5. Thứ tự, phụ thuộc, lưu ý commit

### 5.1 Thứ tự
1. **Lượt A** (bây giờ): ARC hợp đồng (file này + OpenAPI 0.3.9). DOM luật giá. CPY/UXD/SEC chữ, font, notice.
2. ARC đối chiếu file DOM khi có. Lệch thì sửa **mô tả** trong OpenAPI. Thêm mã `notes` = chỉ thêm enum.
3. **Bước 2 – code**: BE-1…BE-6 song song với FE-B-1…FE-B-3. FE-B-4 cần BE-3 chạy được ở dev (hoặc mock theo schema).
4. OPS làm sau khi BE + FE-B có bản dựng, trước QA.

### 5.2 Lưu ý commit (quan trọng)
- `services/api/test/contract.test.ts` chạy `gen-openapi-meta.mjs --check`. ARC đã chạy thử với spec 0.3.9: spec đọc được, nhưng báo `openapi-meta.ts` và `openapi-schemas.ts` **cũ** → **test này đỏ cho tới khi BE chạy `pnpm --filter @ottimo/api gen:openapi`**. Generator api-client cũng phải chạy lại.
- Đề nghị ORC: commit OpenAPI của ARC lên **nhánh** `lp-v2` (BE sinh lại ở commit kế tiếp cùng nhánh). Không đưa thẳng lên `main` trước ngày D 02/11.

---

## 6. Giả định (ghi `[GIẢ ĐỊNH]` – ORC ghi decision-log nếu đồng ý)
- **A1** Số ước tính **không ràng buộc** giá. Không áp BR-916 (2) "giữ giá chụp" (chỉ phương án B). DOM có thể đổi bằng tham số `web_request_offer_honor_hours` – không đổi hợp đồng.
- **A2** Giá của hạng = căn đang bán của hạng có **tổng thấp nhất** cho đúng đoàn và ngày, **không** xét căn đó có trống hay không.
- **A3** Chỉ VND. Không quy đổi ngoại tệ cho khách Hàn/Trung/Nga.
- **A4** `zh` = giản thể; không làm phồn thể.
- **A5** Một `consentVersion` chung cho mọi ngôn ngữ; LP-v2 đăng version mới cho cả 5.
- **A6** Đổi `room.is_sellable`/`public_room_type` có thể trễ ≤ 5 phút trên web (TTL cache). Đổi giá thì xóa cache ngay.
- **A7** `public_show_prices` là tham số thường, chỉ OWN (không phải tham số bảo mật). SEC có thể nâng.

## 7. Rủi ro
| # | Rủi ro | Giảm thiểu |
|---|---|---|
| R1 | Giá web lệch giá lễ tân báo → khách mất lòng tin | Cùng một bộ tính (D2); `priceVersion` + `computedAt` ở Desk; QA so 5 nhóm ca; câu "ước tính" bắt buộc |
| R2 | Rate parity: giá web thấp hơn OTA vi phạm hợp đồng OTA | DOM chốt luật; nếu cần, so `ota_base_rate` trong cổng (2.3 (5)); INV kiểm hợp đồng OTA (BR-104) |
| R3 | Font CJK làm chậm trang | Quy tắc 3.3, ngân sách có test CI, đề xuất font hệ thống cho nội dung |
| R4 | Lễ tân dán lời nhắn khách vào công cụ dịch nước ngoài (chuyển dữ liệu cá nhân ra nước ngoài) | SEC đánh giá, hướng dẫn chỉ dán phần không có tên/liên hệ; không tích hợp dịch tự động |
| R5 | Cửa sổ vài phút `NOTICE_VERSION_INVALID` khi đổi version | Thứ tự 3.6 (5), trang chuyển khối Zalo, làm ngoài giờ |
| R6 | `contract.test.ts` đỏ nếu spec lên `main` trước khi BE sinh lại mã | 5.2 |
| R7 | Đối thủ quét lịch giá | Hạn mức 2.5; giá đã công khai trên OTA – rủi ro thấp |

## 8. Điểm cần khớp với DOM (`web-price-estimate-rules.md`) và PO
| # | Điểm | Hợp đồng hiện để | DOM/PO chốt |
|---|---|---|---|
| K1 | Căn nào đại diện cho hạng | tổng thấp nhất trong các căn đang bán vừa đoàn (A2) | đồng ý hay lấy căn mặc định của hạng |
| K2 | Cuối tuần / ngày đặc biệt | BR-104 qua bộ tính, đếm `upliftNights` | có cần hiện số đêm tăng giá không |
| K3 | Giảm theo thời gian ở | BR-107, trả `losDiscountPct`, `losDiscountVnd` | giữ |
| K4 | Phụ thu người, trẻ | BR-110, `extraPersonFeeVnd` | giữ; câu điều kiện |
| K5 | Thuế/phí | `taxIncluded` = true theo BR-101 | phí khác (dọn phòng, dịch vụ) có cộng không |
| K6 | Dài hạn | `monthlyFromVnd` = giá tháng niêm yết nhỏ nhất, chưa phí dịch vụ/điện nước/BR-109 | con số và câu điều kiện (`notes`) |
| K7 | 15–27 đêm | `longStayAlternative` tùy chọn | có hiện không |
| K8 | Ở tối thiểu | 200 + `notes.min_stay` | câu chữ; có chặn hiện giá không |
| K9 | Rate parity | chưa so | quy tắc (≥ OTA? bằng?) |
| K10 | Giữ giá theo số ước tính | không giữ (A1) | giữ hay không, bao lâu |
| K11 | Làm tròn | theo bộ tính (BR-005) | `nightlyAvgVnd` làm tròn thế nào khi hiện |
| K12 (PO) | Mã story | `x-stories: [US-131]` | PO đặt mã US mới cho ko/zh/ru và cập nhật `x-stories` (ARC sửa khi có) |

## 9. Quyết định kỹ thuật ARC tự chốt (đề nghị ORC ghi `decision-log.md`)
D1–D12 ở mục 1; khóa HKDF `public_estimate`; bucket/bulkhead riêng (2.5); `LANDING_LOCALES` là nguồn danh sách ngôn ngữ phía server; thẻ meta `ottimo-notice-version`; route động `[lang]` cho landing.
