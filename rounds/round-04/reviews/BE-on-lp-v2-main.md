# BE review: phần backend của nhánh `lp-v2-main`

- Người review: BE | Ngày: 04/11/2026 | Round 4, gói LP-v2, bước **Review chéo** (sửa luôn 1 Major theo lệnh ORC – bước Phản hồi & sửa)
- Đối tượng: `origin/lp-v2-main` @ `bfad4f2c` (ARC lắp ráp), đối chiếu lại trên đầu nhánh `5ce9b813`/`6ce5e444` (FE-B, ARC chỉ đổi landing và biên bản – không đổi `services/`, `infra/` phía api). Commit sửa của BE: **`2760744b`**.
- Đọc: `rounds/round-04/outputs/ARC/lp-v2-main-merge.md`, `reviews/SEC-on-lp-v2-main.md` (origin/main `699af78e`), `outputs/BE/lp-v2-be.md` 9.3, `rounds/round-03/outputs/BE/gchat-booking-notify.md` (cổng ★2).
- Máy kiểm: macOS, Node 22.23.3, pnpm 9.15.4, Postgres 17 tạm (container `ottimo-be-lpv2m-pg`, cổng `127.0.0.1:55494`, mật khẩu tạm chỉ cho lượt này, đã xóa sau khi chạy). Không chạm staging/production. Dữ liệu thử là dữ liệu giả ("Test Guest …").

## 1. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN.** Migration 0092, hợp đồng 0.3.11, client sinh lại và phần API giá/locale gộp đúng. Một Major (cổng Google Chat ★2 neo vào nhãn `2026-10-31` sẽ không bao giờ được đăng) – trùng thẻ SEC LPV2M-01 – **đã sửa** ở `2760744b`. Còn 1 Minor + 1 Suggestion, không chặn.

Điều kiện gộp `lp-v2-main` → `main` (phía BE): CI PR xanh trên đúng đầu nhánh (bộ test api đầy đủ, `pnpm audit`, `docker-build`/E2E stack – máy BE không chạy được hai job sau).

## 2. Đã kiểm và kết quả

| # | Hạng mục | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Số migration, journal | **Đạt** | `git diff origin/main` trên `migrations/`: chỉ **thêm** `0092_lp_v2_price_estimate_locales.sql`, `meta/0092_snapshot.json` và 1 dòng journal (idx 68, tag `0092_…`, `when` 1792782173681 = 0091 + 2000). 68 tệp SQL của `main` không đổi. |
| 2 | 0091 / snapshot 0091 của `main` không đổi byte | **Đạt** | sha256 `0091_user_email_change.sql` = `e8bb6cb92a43a85b…33a3`, `meta/0091_snapshot.json` = `761d1639…7db2` (trùng biên bản ARC). Snapshot 0092: `prevId` `094eec8a…` = `id` snapshot 0091 của `main`. |
| 3 | Snapshot 0092 sinh bằng drizzle-kit | **Đạt** | `drizzle-kit generate` (đúng bước CI "Schema matches migrations"): "No schema changes", `git status` thư mục migration sạch. Thân SQL 0092 (bỏ dòng chú thích) **trùng từng byte** thân `0091_lp_v2_…sql` trên `origin/lp-v2` – chỉ đổi số và chú thích đầu. |
| 4 | Migrate từ đầu (DB rỗng) | **Đạt** | `runMigrations` (ottimo_migrator → SET ROLE ottimo_owner) với thư mục nhánh: 69 dòng `drizzle.__drizzle_migrations`, `max(created_at)` = 1792782173681. |
| 5 | Migrate từ trạng thái 68 (như production) | **Đạt** | DB riêng: migrate bằng thư mục migration của `origin/main` (`git archive`, 68 tệp) → 68 dòng; thêm dữ liệu giả (5 dòng `privacy_notice_version`, 30 `website_booking_request` vi/en/ru, 6 dòng đã xóa C2) → migrate bằng thư mục nhánh: chỉ 0092 chạy, **0,66 giây** kể cả khởi động node. Sau đó: 30/30 yêu cầu giữ, `price_estimate` NULL; 5/5 dòng thông báo giữ (2 `superseded_at`); CHECK locale 2 bảng = `vi,en,ru,ko,zh`; `website_booking_request_price_estimate_check` có; trigger `privacy_notice_version_append_only` + `_no_truncate` còn; bảng vẫn thuộc `ottimo_owner`; `ottimo_app` có SELECT/INSERT/UPDATE trên cột `price_estimate` (quyền bảng có sẵn); khóa `public_show_prices` = `false` `{owner}`, `web_estimate.open_until` = `"2027-01-01"` `{owner,manager}`. |
| 6 | Hai đường cho cùng một lược đồ | **Đạt** | `pg_dump -s` DB "từ đầu" và DB "từ 68": **giống hệt** (chỉ khác token `\restrict` ngẫu nhiên của pg_dump 17). |
| 7 | 0092 an toàn khi chạy thật | **Đạt** | Chỉ DROP/ADD CHECK (nới), ADD COLUMN NULL không mặc định (không viết lại bảng), INSERT danh mục `ON CONFLICT DO NOTHING`. Khóa ngắn trên 2 bảng nhỏ; không đụng `app_user`/`user_email_change` của 0091. App v1.0.3 chạy được trên DB có 0092 (không đọc cột/khóa mới) → quay lui app không cần lùi DB. |
| 8 | Các CHECK locale khác | **Đạt (ghi nhận)** | `guest.preferred_locale`, `consent_record.locale`, `guest_session.locale` vẫn `vi,en,ru` – đúng thiết kế: `LandingLocale` chỉ dùng cho landing + hàng chờ; Desk tạo hồ sơ khách qua `guests.controller` (enum `vi,en,ru`), không chép `locale` yêu cầu sang hồ sơ, nên yêu cầu ko/zh không gây lỗi ràng buộc. |
| 9 | API giá ước tính + locale gộp với `PUT /v1/me/email` | **Đạt** | `openapi.yaml` `info.version` 0.3.11-draft; changelog 0.3.11 (LP-v2) đặt trên 0.3.10 (v1.0.3) và 0.3.9; `setMyEmail` và `getPublicPriceEstimate` cùng có trong `openapi-meta.ts`; `LandingLocale` có trong client sinh. Mã gộp `public-booking.service.ts`, `website-requests.service.ts`, `website-request-rules.ts`: giữ đủ hai phía – bộ dò số nhạy cảm chung `sensitive-number.ts` (v1.0.x) + `hasUnexpectedScript(text, locale)` theo ngôn ngữ trang + slug từ `@ottimo/contracts` (LP-v2) + tin Chat `web_request_new`/`web_request_erased` (v1.0.1). |
| 10 | Client sinh lại | **Đạt** | `node scripts/gen-openapi-meta.mjs` và api-client `node scripts/gen.mjs` chạy lại: không đổi byte ("openapi.ts up to date"). |
| 11 | RBAC | **Đạt** | `gen_traceability.py --strict` exit 0, ops lệch 0; `gen_rbac_cases.py --check`: "up to date" (207 operation, 2277 ca, mismatch []). "fields mismatched 1" (`email` D27 – manager) **có sẵn trên `main`** (đã chạy cùng công cụ trên cây `origin/main`), không do LP-v2 – thẻ 03. |
| 12 | Không lộ giá OTA / hoa hồng / biên | **Đạt** | `PublicPriceEstimate` `additionalProperties: false`, DTO dựng theo allowlist; test `lp-v2-price-estimate` ca 1 cấm `otaBase`, `commission`, `floor`, `ceiling`, `roomId`, `toTotal`, `parity`, số căn, id căn; `channel=ota` → 422 không kèm số. Bản Desk (`PublicPriceEstimateRecord`) chỉ có số khách đã thấy. |
| 13 | Test api đầy đủ | **Đạt** (sau sửa, `2760744b`) | `vitest run --maxWorkers=4` trên Postgres 17 thật: 154 tệp đạt + 2 bỏ qua, **3862 test đạt, 24 bỏ qua**; 2 tệp đỏ do môi trường và chạy lại riêng thì xanh (29/29): `production-bootstrap` (DB bootstrap đã dùng ở lượt trước – cần DB rỗng mới) và `reservations` ca p95 < 200 ms (231 ms khi máy tải 30+ trên 10 lõi; chạy lại 1 worker: đạt). Lượt đầu với số worker mặc định trên máy đang tải ~36 lỗi hàng loạt "Timeout waiting for worker to respond" – không phải lỗi mã. |
| 14 | lint / typecheck / format | **Đạt** | `eslint` các tệp đã đổi, `tsc --noEmit` gói api, `prettier --check`: sạch. |

## 3. Thẻ

### FB-R4-BE-LPV2M-01
- Mức độ: Major
- Vị trí: `product/services/api/src/modules/public-site/public/chat-message.ts` (`CHAT_DETAILS_MIN_NOTICE_VERSION`, `CHAT_NOTICE_GATE_SQL`); biên bản ARC mục 7 (P4)
- Vấn đề: cổng ★2 lấy `min(published_at)` của **chính** các dòng `version = '2026-10-31'`. Theo P4, `2026-10-31` không bao giờ được đăng riêng trên production (đang ở `2026-10-24`, LP-v2 đăng thẳng nhãn mới), nên `min_at` luôn NULL và mọi tin Chat bị giữ ở mức A (`levelCapped`), dù `.env` đặt C. Test cũ `gchat-notify` ghi đúng hành vi này ("2026-10-31 not published yet → template A for everyone"). Trùng thẻ **FB-R4-SEC-LPV2M-01**.
- Vì sao quan trọng: quyết định mức C của INV (ESC-041) âm thầm không có hiệu lực; lễ tân không có chi tiết trong Chat; không có lỗi nào báo.
- Đề xuất sửa: theo SEC – hằng = nhãn chốt `2026-11-04`, giữ SQL so theo `published_at` (không so chữ version).
- Trạng thái: **Done** – `2760744b`: hằng `2026-11-04` + chú thích lý do (P4); `gchat-units` đổi kỳ vọng; `gchat-notify` thêm 2 ca: (a) chỉ có `2026-10-24` + `2026-11-04` (5 ngôn ngữ): yêu cầu `2026-11-04` tiếng en **và** ko nhận C, `2026-10-24` nhận A; (b) `2026-10-31` đã đăng trên một stack nhưng chưa có `2026-11-04` → A, và khi `2026-11-04` đăng sau thì yêu cầu `2026-10-31` vẫn A; ca (c) "chưa đăng `2026-11-04` → A cho mọi yêu cầu" giữ từ ca cũ. `env.production.example` dòng 117 và `infra/server/README.md` dòng 408: "older than 2026-11-04 (the first published notice naming Google Chat)". 25/25 test `gchat-notify`, 200/200 test của 6 tệp liên quan.

### FB-R4-BE-LPV2M-02
- Mức độ: Minor
- Vị trí: `product/services/api/src/modules/platform/internal/platform.controller.ts` `cancelScheduledRoomListPrice` (v1.0.1, OpenAPI 0.3.9)
- Vấn đề: khe gộp giữa hai nhánh – LP-v2 xóa bộ đệm giá ước tính khi `updateRoom` hoặc đổi tham số (`hooks.changed`), nhưng route hủy giá hẹn của v1.0.1 (gộp từ `main`) không gọi `hooks.changed`. Hủy một giá niêm yết đã hẹn → trang có thể hiện giá cũ tối đa 60 giây (TTL bộ đệm).
- Vì sao quan trọng: thấp – số chỉ là "ước tính", server tính lại lúc nhận yêu cầu, TTL 60 giây là chốt chặn. Nhưng nên nhất quán với `updateRoom`.
- Đề xuất sửa: thêm `if (result.status === 200) this.hooks.changed(tenantOf(principal(req)).propertyId as string, 'room');` sau `uow.run` của `cancelScheduledRoomListPrice` + 1 ca test (hủy giá hẹn → lần gọi giá kế tiếp không trúng bộ đệm). BE làm ở v1.0.4.
- Trạng thái: Open

### FB-R4-BE-LPV2M-03
- Mức độ: Suggestion
- Vị trí: `product/tests/tools/gen_traceability.py --strict` mục 8 – thuộc tính `email` (D27): rbac-matrix cho manager "Đầy", `x-visible-to` chỉ `owner`
- Vấn đề: có sẵn trên `main` từ v1.0.3 (`Me.email`/`User.email`), không do LP-v2; không làm `--strict` đỏ; chiều "OpenAPI thiếu vai" (không rò quyền).
- Đề xuất sửa: ARC/QA xem lại D27 hoặc `x-visible-to` khi chạm hợp đồng v1.0.4; ghi chú chân trang nếu cố ý.
- Trạng thái: Open

## 4. Thẻ của vai khác BE đã xử lý trong lượt này

| Thẻ | Trạng thái | Ghi chú |
|---|---|---|
| FB-R4-SEC-LPV2M-01 (Major) | Done – `2760744b` | Như BE-LPV2M-01. |
| FB-R4-SEC-LPV2M-05 (Suggestion) | Done một phần – `2760744b` | `shared/time.ts` thêm `isCalendarDate` (dựng lại ngày rồi so chuỗi). Route giá (`parseEstimateQuery`) và form website (`arrival`, `departure` – trước đây `departure` chỉ kiểm regex) từ chối `2026-02-31`, `2027-02-29`, `2026-11-31`… bằng `VALIDATION_FAILED` trên đúng trường. Test: `time.test.ts`, `lp-v2-be-units.test.ts` (5 ngày × 2 trường). **Chưa** đổi `assertLocalDate` (dùng ở `ParameterService` và hàm giờ – đổi sẽ làm ngày sai thành RangeError/500 ở API nội bộ); để v1.0.x như SEC đề xuất. |
| FB-R4-ARC-LPV2M-01 (Minor, chú thích "0.3.10") | Chưa làm | Phía BE còn: `price-estimate.service.ts` dòng đầu "OpenAPI 0.3.10-draft", `public-booking.service.ts` "R4 LP-v2 (OpenAPI 0.3.10)", `website-request-rules.ts`, `packages/api-client/src/endpoints.ts`, `types.ts`. Đổi khi chạm tệp ở v1.0.4. |

## 5. Ghi chú
- Dữ liệu giả cho DB "từ 68" của BE cũng có dòng `2026-10-31` (theo biên bản ARC); như SEC LPV2M-04, production thật chỉ có `2026-10-24` en/vi. Kết luận về 0092 không đổi vì 0092 không đụng dòng thông báo nào.
- Dọn dẹp: container + volume Postgres tạm đã xóa; tệp tạm chỉ trong scratchpad.

## 6. Điểm làm tốt
- ARC sinh snapshot 0092 bằng drizzle-kit từ snapshot 0091 của `main` và trả `meta/0068_snapshot.json` về nguyên byte – chuỗi `prevId` đúng, CI "Schema matches migrations" xanh, không ai phải sửa tay JSON 14 nghìn dòng.
- Gộp `website-request-rules.ts` lấy bộ dò số nhạy cảm chung của `main` nhưng vẫn giữ quy tắc chữ theo ngôn ngữ trang của LP-v2 – không mất tính năng phía nào.
- Biên bản ARC ghi đủ băm, thứ tự lệnh và cách chạy trên DB 68 migration, nên kiểm lại độc lập rất nhanh.
