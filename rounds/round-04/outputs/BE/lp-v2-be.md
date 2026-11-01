# BE – LP-v2: API giá ước tính công khai + ngôn ngữ landing ko/zh/ru

- Vai: BE | Round 4 – gói LP-v2 – Bước Sản xuất (code) | Ngày 01/11/2026
- Nhánh: `lp-v2-be` (từ `origin/lp-v2`, có OpenAPI 0.3.9-draft của ARC). Chưa merge, chưa deploy.
- Căn cứ: ARC `outputs/ARC/lp-v2-design.md` (BE-1…BE-6), DOM `outputs/DOM/web-price-estimate-rules.md` + BR-115/116 v0.4.9, SEC `outputs/SEC/lp-v2-privacy-and-api.md` (SR-PE-01…14, SR-LC-01/02, mục 10). Chỗ SEC khác ARC/DOM: theo SEC (lệnh ORC).

## 1. Đã làm

| # | Việc | Kết quả |
|---|---|---|
| BE-1 | Sinh lại hợp đồng 0.3.9 | `openapi-meta.ts`, `openapi-schemas.ts`, `packages/api-client` (openapi.ts), `tests/fixtures/rbac-cases.json`. `contract.test.ts` xanh; `gen_rbac_cases.py --check` OK; `gen_traceability.py --strict` không lỗi |
| BE-2 | Cổng `PublicRatePort` | `reservations/public/public-rate.ts` (hàm thuần) + `public-rate.port.ts`. Dùng chung `PricingService.load` + `calendarRate`/`losDiscountPct`/`applyNightDiscount`/`extraPersons` của Desk, kênh `direct`. Không đọc đơn đặt, giữ chỗ, công suất, trạng thái buồng (SR-PE-04 – có test tĩnh). Căn bị OOO chồng đêm → bỏ khỏi hạng. Sàn ngang giá BR-116 theo `web_estimate.parity_mode` (mặc định `ota_floor`). Thuê tháng theo BR-201/202 (mốc thấp hơn gần nhất), làm tròn `rounding.monthly_rent` |
| BE-3 | Endpoint `getPublicPriceEstimate` | Route trong `public-site.controller.ts`; `price-estimate.service.ts` (kiểm query, cache, trần tính mới, allowlist); `estimate-token.ts` (`pe1`, HMAC qua `keyedHash('public_estimate')` – không thêm bí mật) |
| BE-4 | Lưu số ước tính vào yêu cầu web | `priceEstimateToken` → kiểm chữ ký/hạn/cơ sở/khớp mọi đầu vào → server **tính lại** trong giao dịch nhận yêu cầu → cột `price_estimate` = `{v, seen, atSubmit}`. Sai/hết hạn/không khớp → 202, không lưu, cờ `offer_unverified`. Desk thấy `priceEstimate` (= phần `seen`, đúng schema `PublicPriceEstimateRecord`). Còn sau khi xóa C2 |
| BE-5 | Ngôn ngữ mới | `LANDING_LOCALE_VALUES` (= enum `LandingLocale`, có test so với openapi.yaml); `LANDING_LOCALES` (mặc định `en,vi`, sai → api không khởi động); `readiness()` theo `LANDING_LOCALES`; ngôn ngữ chưa có thông báo đang hiệu lực → **422 `PUBLIC_FORM_NOT_READY`** (SEC SR-LC-02); `unexpected_script` theo ngôn ngữ trang; nhận diện số thẻ/giấy tờ trên bản NFKC + số CMND Hàn, CCCD Trung, hộ chiếu Nga (SEC mục 10) |
| BE-6 | Tham số | Migration **0090**: `public_show_prices` (bool, chỉ OWN, mặc định `false`), `web_estimate.parity_mode` (`ota_floor`), `.open_until` (`2027-01-01`, kiểm ngày thật), `.honor_hours` (48), `.show_foreigner_monthly` (true). `public_show_prices` = công tắc khẩn (tắt có hiệu lực ngay trong ngày) và audit nhóm `security` (SR-PE-08) |

Giới hạn tần suất (SR-PE-07, RAM, không ghi `rate_limit_counter`): HMAC IP nhãn `ip:pe:` 30/10 phút + 200/ngày, /48 IPv6 400/ngày, toàn api 10/giây → 503; bulkhead riêng 2 (≤ 4 của SEC); trần 600 lần tính mới/giờ/cơ sở → 503. Giao dịch READ ONLY, `statement_timeout` 1 giây. Cache kết quả LRU ≤ 1.000, **60 giây**, xóa khi có thay đổi tham số của cơ sở (setParameter/cancel). Cache trúng không chạm DB (có test). Header `Cache-Control: no-store`, `X-Robots-Tag: noindex`. Căn thiếu giá → bỏ căn, ghi log cảnh báo **1 lần/căn/ngày nghiệp vụ** (SR-PE-12).

## 2. File tạo/sửa
- Mới: `product/services/api/src/modules/reservations/public/public-rate.ts`, `public-rate.port.ts`; `product/services/api/src/modules/public-site/internal/price-estimate.service.ts`, `estimate-token.ts`; `product/services/api/src/db/migrations/0090_lp_v2_price_estimate_locales.sql` + `meta/0090_snapshot.json`; test `product/services/api/test/lp-v2-be-units.test.ts`, `test/integration/lp-v2-price-estimate.test.ts`.
- Sửa: `public-site.controller.ts`, `public-booking.service.ts`, `public-site.options.ts`, `website-request-rules.ts`, `website-requests.service.ts`, `public-site.module.ts`; `reservations.module.ts`; `crypto.service.ts` (`public_estimate`); `platform/public/parameter-hooks.ts` (listener thay đổi tham số), `parameter.service.ts`, `platform/internal/parameters.service.ts` (kill switch + audit security), `parameter-rules.ts` (`open_until`), `platform.controller.ts`; `db/schema/public-site.ts`; `migrations/meta/_journal.json`; `generated/*`; `packages/api-client/src/generated/openapi.ts`; `tests/fixtures/rbac-cases.json`; `.env.example`, `infra/server/env.production.example` (dòng mẫu `LANDING_LOCALES=en,vi`); `apps/admin-web/src/pages/webreq/WebRequestDrawer.tsx` (một dòng: api-client mới có `ko`/`zh` → mẫu báo giá dùng `en`, để typecheck admin-web xanh – FE xem lại).

## 2b. Kết quả kiểm
- Toàn bộ test api trên PostgreSQL 17 tạm (cổng 55439, đã dừng): **140 file đạt, 2 bỏ qua; 3321 test đạt, 24 bỏ qua, 0 lỗi**. Trong đó mới: `lp-v2-be-units.test.ts` 38 test (12 ca DOM mục 11 cả `direct` lẫn `ota_floor`, allowlist, query, token, locale, NFKC), `lp-v2-price-estimate.test.ts` 17 test e2e.
- `pnpm lint` (eslint + typecheck mọi workspace) xanh; prettier xanh; admin-web 644 test, api-client 32 test đạt.

## 3. Điểm lệch so với thiết kế (cần ARC sửa mô tả OpenAPI ở bước Phản hồi & sửa)
| # | Chỗ | ARC/hợp đồng | Đã làm | Lý do |
|---|---|---|---|---|
| L1 | Hạn mức IP | 40/10 phút, 300/ngày | 30/10 phút, 200/ngày, /48 400/ngày, 10/giây toàn api | SEC SR-PE-07 (Must) |
| L2 | Cache | 300 giây, HTTP `private, max-age=60` | 60 giây, HTTP `no-store` | SEC SR-PE-09; đổi giá căn (`room_list_price`) không phát `config_changed` nên TTL 60 s là lưới |
| L3 | `statement_timeout` | 2 giây | 1 giây | SR-PE-08 |
| L4 | Query tối đa | 512 byte | 256 byte | SR-PE-03 |
| L5 | Tham số lạ | 422 | 422 `VALIDATION_FAILED` (SEC nói 400) | giữ hợp đồng; vẫn mã chung, không lộ quy tắc |
| L6 | Server tính lại khi nhận yêu cầu | chỉ giải mã token | token + tính lại; `atSubmit` lưu `fromTotalVnd`, `toTotalVnd`, dòng chi tiết, chế độ ngang giá | SR-PE-05/06. `toTotal` không bao giờ ra phản hồi công khai |
| L7 | Audit `public_show_prices` | `config` | `security` + công tắc khẩn trong ngày | SR-PE-08; ARC 2.9 để SEC quyết |
| L8 | Ngôn ngữ chưa có thông báo | `NOTICE_VERSION_INVALID` | 422 `PUBLIC_FORM_NOT_READY` (sai version của ngôn ngữ đã có thông báo vẫn `NOTICE_VERSION_INVALID`) | SR-LC-02 + lệnh ORC |
| L9 | Thiếu giá | cảnh báo OWN | log `public_price_missing` 1 lần/căn/ngày | gửi thông báo cho OWN cần kind mới trong enum `StaffNotification.kind` = đổi hợp đồng → chờ ARC |
| L10 | Trường DOM chưa có trong hợp đồng | – | chưa trả: `fromTotal`/dòng chi tiết theo nhóm, phí dịch vụ tháng, giá tháng hộ chiếu nước ngoài, trạng thái `not_open` riêng | hợp đồng 0.3.9 chưa có; `not_open` đang trả `on_request`; `nightlyAvgVnd` vẫn trả (bắt buộc trong schema) dù DOM không muốn hiện |
| L11 | `cache xóa khi NOTIFY config_changed` | LISTEN | listener trong tiến trình (ParameterHooks.changed sau khi commit) | một tiến trình api (ADR-010); không mở thêm kết nối LISTEN |
| L12 | Ở tối thiểu | 200 + `notes.min_stay` | 200, `priceAvailable: false`, `on_request` + `notes.min_stay` | DOM mục 8: không hiện số |

## 4. Giả định
- G1: số migration **0090** – 0089 đã dùng ở nhánh `be-a-v1.0.1` (chưa vào main). Ai merge sau sửa `prevId` của `0090_snapshot.json` trỏ về 0089. Merge v1.0.1 trước LP-v2 để `when` tăng dần.
- G2: hạng không có căn khớp / slug lạ / không còn căn tham gia / quá `open_until` cùng trả `on_request` (không lộ cấu hình).
- G3: ≥ 28 đêm ngắn ngày → trả theo tháng, `months = null` (không giảm kỳ hạn) + `long_stay_required`.
- G4: chế độ `ota_floor` mà nhóm căn thiếu `ota_base_rate` → bỏ căn đó (coi như thiếu giá) để không bao giờ hiện dưới giá OTA.
- G5: thuê tháng không xét `open_until`, không sàn, không phụ thu người (DOM mục 4).

## 5. Rủi ro / vướng mắc
- Hợp đồng chưa có kind thông báo "thiếu giá" và các trường DOM (L9, L10) → ARC quyết thêm (chỉ thêm).
- Bộ đếm RAM mất khi khởi động lại api (SEC PE-RR3 – chấp nhận).
- `unexpected_script` giờ gắn cờ chữ Kirin trên trang `en`/`vi` (trước đây không) – chỉ là cờ lọc, không chặn.

## 6. Việc cho vai khác
- **FE-B (landing)**: xử lý 422 `PUBLIC_FORM_NOT_READY` như `NOTICE_VERSION_INVALID` (khối Zalo). Phản hồi giá: 200 `priceAvailable:false` + `notes.min_stay` = câu ở tối thiểu; `party_exceeds_room` = câu sức chứa; `on_request` = "giá theo yêu cầu" (gồm ngày chưa mở giá). Không hiện `nightlyAvgVnd` (DOM). Header `no-store` – không tự cache. Token chỉ gửi khi số hiện đúng lựa chọn đang chọn.
- **FE (admin-web S35)**: đọc `priceEstimate` (có `computedAt`, `priceVersion`); `locale` có thêm `ko`, `zh`.
- **OPS**: thêm `LANDING_LOCALES: ${LANDING_LOCALES:-en,vi}` vào biến môi trường api trong `infra/docker-compose.prod.yml` (danh sách env tường minh – thiếu thì api luôn `en,vi`); route Caddy `price-estimate`; `publish-privacy-notice` đọc manifest/`LANDING_LOCALES` (SR-LC-04/05 – không có phần nào trong file BE); cảnh báo log `public_price_missing` và 429/503 của route (SR-PE-16).
- **QA**: chạy lại 12 ca DOM mục 11 trên staging với giá Desk thật; SEC 9.5.
- **ORC**: ghi decision-log các lệch L1–L12 nếu đồng ý.

## 7. Việc chưa xong
- Mục 10 SEC về `chatSafeText` (dấu chấm `。`, tên miền Kirin) thuộc nhánh Google Chat (`be/gchat-*`) – không có trên nhánh này.
