# ARC review mã gói LP-v2 – nhánh `lp-v2-be` và `lp-v2-fe`

- Người review: ARC | Round 4 – gói LP-v2 – Bước **Review chéo** | Ngày 01/11/2026
- Đối tượng:
  - `origin/lp-v2-be` head `63c5731e` (`477552ca` + `63c5731e`), so với `origin/lp-v2` `8363650c`: 32 tệp, +17 876/−63 (14 736 dòng là `0090_snapshot.json`). Báo cáo BE: `rounds/round-04/outputs/BE/lp-v2-be.md` (trên nhánh).
  - `origin/lp-v2-fe` head `5db7df80` (`a29f7395` + `5db7df80`), so với `origin/lp-v2`: 101 tệp, +5 485/−448 (gồm 20 ảnh chụp, 10 tệp font). Báo cáo FE: `rounds/round-04/outputs/FE/lp-v2-fe.md` (trên nhánh).
- Căn cứ: `rounds/round-04/outputs/ARC/lp-v2-design.md` (D1–D12, mục 2–5), OpenAPI 0.3.9-draft trên `lp-v2-be`, decision-log tới dòng INV 01/11 "bảng giá mới", `00-brief/context/pricing/OTTIMO_pricing_spec-2026-11-01.md`, `02-escalations/ESC-045.md`, DOM `web-price-estimate-rules.md`, `reviews/ARC-on-BE-gchat-notify.md` (luật số migration, PN-01).
- Cách kiểm: đọc diff và mã bằng `git show`/`git diff` (không checkout, không chạy bộ test – số test lấy từ báo cáo BE/FE); `git merge-tree --write-tree` cho từng cặp nhánh (mục 4). File `pricing-spec-2026-11-01-reconcile.md` của DOM **chưa có** khi review – mục 6 dựa trên bảng giá INV + ESC-045.

---

## 1. Kết luận

| Nhánh | Kết luận | Điều kiện |
|---|---|---|
| `lp-v2-be` | **Duyệt có điều kiện** | Gộp vào nhánh tích hợp `lp-v2` được ngay. Lên `main` chỉ sau khi xong BE-01…BE-04 (Major) và theo thứ tự mục 5 |
| `lp-v2-fe` | **Duyệt có điều kiện** | Gộp vào `lp-v2` được ngay. FE-01 (Major) xong trước QA LP-v2; FE-02 làm ngay sau khi gộp |
| OPS | **Chưa có** – thiếu toàn bộ phần hạ tầng | OPS-01 (Major) phải xong trước QA trên staging |

Hai nhánh dùng **đúng** hợp đồng `getPublicPriceEstimate`/`createWebsiteBookingRequest` 0.3.9 (mục 3) và gộp với nhau **không xung đột** (không có tệp chung). Không có Blocker. Bốn Major của BE đều là việc gộp và tác động của bảng giá 01/11, không phải lỗi logic của phần đã làm.

---

## 2. Quyết định về các điểm lệch thiết kế

### 2.1 BE (`lp-v2-be.md` mục 3, 4)

| # | Lệch | Quyết định ARC | Ghi chú / việc kèm |
|---|---|---|---|
| L1 | Hạn mức IP 30/10 phút, 200/ngày, /48 400/ngày, 10/giây toàn api | **Chấp nhận** | SEC SR-PE-07 chặt hơn ARC 2.5, đủ cho người thật (debounce 400 ms) |
| L2 | Cache 60 s, HTTP `no-store` | **Chấp nhận** | Đổi giá căn (`room_list_price`, kể cả lịch giá hẹn của v1.0.1) không qua `setParameter` → TTL 60 s là lưới. Giả định A6 của ARC rút từ 5 phút xuống 60 giây |
| L3 | `statement_timeout` 1 s | **Chấp nhận** | |
| L4 | Query ≤ 256 byte | **Chấp nhận** | Query thật dài < 130 byte |
| L5 | Tham số lạ → 422 (SEC nói 400) | **Chấp nhận** | Giữ hợp đồng |
| L6 | Server tính lại khi nhận yêu cầu, lưu `{v, seen, atSubmit}` | **Chấp nhận** | Chỉ chạy khi có token; trong SAVEPOINT, lỗi không làm hỏng yêu cầu. `toTotalVnd`, `lines` không ra phản hồi công khai (đã kiểm `publicEstimateDto`) |
| L7 | `public_show_prices` audit `security` + công tắc khẩn trong ngày | **Chấp nhận** | ARC 2.9 để SEC quyết. ARC sửa mô tả hợp đồng (bỏ "audit `config`") |
| L8 | Ngôn ngữ chưa có thông báo → 422 `PUBLIC_FORM_NOT_READY` | **Chấp nhận** | ARC thêm mã này vào 422 của `createWebsiteBookingRequest` (`errors[].field = locale`) – hiện chỉ ghi cho `setParameter` |
| L9 | Thiếu giá → chỉ log `public_price_missing` 1 lần/căn/ngày | **Chấp nhận cho LP-v2** | Không thêm kind `StaffNotification` ở gói này. Bù bằng cảnh báo log của OPS (OPS-01 ý 7) – quan trọng khi OWN nhập lại toàn bộ giá theo bảng 01/11 |
| L10 | `not_open` trả `on_request`; `nightlyAvgVnd` vẫn trả; không `fromTotal`/dòng chi tiết | **Chấp nhận** | Giữ `nightlyAvgVnd` bắt buộc để không đổi hợp đồng; trang không hiện (FE D3). Phần thuê tháng của L10 hết hiệu lực (ESC-043 câu 2) |
| L11 | Listener trong tiến trình thay LISTEN `config_changed` | **Chấp nhận** | Một tiến trình api (ADR-010); khóa cache có ngày nghiệp vụ nên tham số hẹn ngày tự có hiệu lực |
| L12 | Ở tối thiểu → `priceAvailable: false` + `on_request` + `notes.min_stay` | **Chấp nhận** | ARC sửa mô tả 2.2 / OpenAPI ("không phải lỗi, không có số") |
| G1 | Số migration 0090, "ai gộp sau sửa `prevId`" | **Không đủ** – xem BE-01 | |
| G2 | Slug lạ / không căn / quá `open_until` cùng `on_request` | **Chấp nhận** | Đúng D3 |
| G3, G5 | Giá tháng | Hết hiệu lực (ESC-043 câu 2) | |
| G4 | `ota_floor` + thiếu `ota_base_rate` → bỏ căn | **Đổi** – xem BE-04 | Với bảng giá một mức, quy tắc này có thể làm web ẩn giá mọi hạng |
| OpenAPI | BE sửa 0.3.9-draft theo lệnh ORC (`monthly_offer`, bỏ `longStay`, `longStayAlternative`, `monthly_excludes_utilities`, `PublicPriceEstimateRecord.monthlyFromVnd`) | **Chấp nhận** | Đã đọc diff: chỉ bỏ phần chưa phát hành và thêm một giá trị enum. Lần sau sửa `openapi.yaml` thì báo ARC trước (file của ARC) |

### 2.2 FE (`lp-v2-fe.md` mục 4, 5) – phần thuộc ARC

| # | Lệch | Quyết định ARC |
|---|---|---|
| D1 | Tên ngôn ngữ ở trang khác dùng font hệ thống | **Chấp nhận** – đúng quy tắc 3 của ARC 3.3; trang `en`/`vi` tải 0 tệp font ko/zh/ru kể cả khi mở danh sách |
| D3 | Không hiện `nightlyAvgVnd`, không bảng từng đêm | **Chấp nhận** |
| D5 | Lỗi: không nút thử lại, ẩn sau 3 s | **Chấp nhận** – đúng ARC 2.8 |
| D6 | Ô giá ẩn tới lần 200 đầu tiên | **Chấp nhận** – mặc định `public_show_prices = false` trả 404 |
| D10 | Chưa có Lighthouse CI | **Chấp nhận có điều kiện** – xem FE-04 |
| D12 | Cả `<meta name="ottimo-notice-version">` và `data-notice-version` | **Chấp nhận giữ cả hai.** Nguồn chuẩn cho script OPS là **thẻ meta** (D11). `dist-checks` đã bắt hai giá trị bằng nhau – giữ test đó |
| G1 | Nhãn version tạm `2026-11-01` | **Chấp nhận** – SEC đặt nhãn thật, phải > `2026-10-31` |
| G3 | Mốc tháng do API quyết | **Chấp nhận phần form giá**; còn `shortMaxNights` – xem FE-01 |
| D2, D4, D7, D8, D9, D11 | Chữ, định dạng tiền, câu hiển thị | Không thuộc ARC (UXD/CPY) – không phản đối về kỹ thuật |
| Bỏ `Outcome 'reload'` | `NOTICE_VERSION_INVALID` → khối Zalo/gọi | **Chấp nhận** – đúng ARC 2.8 |

---

## 3. FE có dùng đúng hợp đồng BE không

| Điểm | Hợp đồng / BE | FE | Kết quả |
|---|---|---|---|
| URL, phương thức | `GET {base}/price-estimate?…`, cùng origin | `estimateTransport`: GET, `credentials: 'omit'`, `Accept: application/json`, base = `{api}/v1/public/properties/{slug}` (giống form) | Đúng |
| Tham số | `roomType, stayType, arrival, departure (short), months (long), adults, children, infants`; lạ/lặp → 422 | `estimateSearch` chỉ gửi đúng 8 tên, thứ tự cố định, không gửi `months`, `departure` chỉ khi short; theo tháng không gọi API | Đúng |
| Mã trả về | 200 / 403 / 404 / 422 / 429 / 503 | 404 → tắt ô suốt lượt xem; 422 → nhắc chọn; 429 → dừng gọi tới khi tải lại; 403/5xx/timeout 3 s → lỗi trung tính | Đúng ARC 2.8 |
| Thân 200 | `PublicPriceEstimate` (allowlist) | Kiểu viết tay trong `booking-logic.ts` khớp **đủ và đúng** 15 trường của schema trên `lp-v2-be` (gồm `unavailableReason` 3 giá trị); `isEstimate` kiểm tối thiểu | Đúng – nhưng nên dùng kiểu sinh (FE-02) |
| `monthly_offer` | short ≥ mốc → `priceAvailable:false` + `monthly_offer`, không token | `estimateView` ưu tiên `monthly_offer`; `stayKind: long` không bao giờ hiện số | Đúng |
| `notes.min_stay`, `party_exceeds_room` | 200 không số | câu ở tối thiểu (tạm câu S6), câu sức chứa | Đúng |
| Token | gửi `priceEstimateToken` chỉ khi số đang hiện đúng hạng/ngày/khách; server so mọi đầu vào | `tokenFor`: so chuỗi query của số đang hiện với lựa chọn hiện tại + chưa hết `expiresAt`; gửi khi đang tải → không token | Đúng D5 |
| `createWebsiteBookingRequest` | `locale` ∈ `LandingLocale`; 422 `PUBLIC_FORM_NOT_READY` (L8) | `locale` = ngôn ngữ trang; `PUBLIC_FORM_NOT_READY` và `NOTICE_VERSION_INVALID` → `not-ready` (khối Zalo/gọi) | Đúng |
| Cache | API `no-store` | Không lưu gì (không localStorage/cookie cho giá) | Đúng |

---

## 4. Kiểm gộp (`git merge-tree --write-tree`, 01/11)

| Cặp | Kết quả | Tệp xung đột |
|---|---|---|
| `lp-v2-be` + `lp-v2-fe` | **Sạch** (không tệp chung) | – |
| `lp-v2-be` + `origin/main` `22793c54` | Sạch | – (main chỉ khác `lp-v2` ở 7 tệp tài liệu ngoài `product/`) |
| `lp-v2-fe` + `origin/main` | Sạch | – |
| `lp-v2-be` + PR #16 `be/gchat-booking-notify` `98ff43bb` | Sạch | – (PR #16 có sửa `public-booking.service.ts`, `website-requests.service.ts` nhưng khác đoạn) |
| `lp-v2-fe` + PR #16 | Sạch | – |
| `lp-v2-be` + `be-a-v1.0.1` `1552e495` | **Xung đột** | `openapi.yaml` (mục changelog – **cả hai cùng tự gọi 0.3.9-draft**), `meta/_journal.json` (**cả hai idx 65**), cộng 5 tệp `be-a-v1.0.1` vốn đã xung đột với `main` (`decision-log.md`, `business-rules.md`, `frontdesk.module.ts`, `platform.module.ts`, `br-examples.json`) |
| `lp-v2-fe` + `be-a-v1.0.1` | Xung đột | `openapi.yaml` + 5 tệp vốn đã xung đột với `main` |
| `lp-v2-fe` / `lp-v2-be` + `fe-a-v1.0.1` `43a3a5a7` | Xung đột | `openapi.yaml` + 2 tệp vốn đã xung đột với `main` (`decision-log.md`, `strings.js`) |

**Xung đột ngầm (git không báo):**
- `openapi-meta.ts`, `openapi-schemas.ts`, `packages/api-client/.../openapi.ts` gộp sạch về chữ nhưng **sai về nghĩa** sau khi gộp v1.0.1 → phải sinh lại (`contract.test.ts` sẽ đỏ nếu quên).
- `0090_snapshot.json` = 0088 + LP-v2, **thiếu bảng `simulation_guard` của 0089**. Chỉ sửa `prevId` như BE G1 thì lần `drizzle-kit generate` sau sẽ sinh lại `simulation_guard` (BE-01).
- `privacy.ts` en/vi của `lp-v2-fe` dựng từ chữ `2026-10-31` theo bảng Δ của SEC, trong khi bản `2026-10-31` thật sẽ lên `main` qua lượt landing v1.0.1 → xung đột khi gộp sau (FE-03).
- Số migration `0090` cũng là số ARC đã dành cho PN-01 (decision-log 30/10: "PN-01 (0090) … sau BE-A 0089").

---

## 5. Thứ tự gộp với v1.0.1

Nguyên tắc (decision-log 30/10): migration lên `main` sau lấy số kế tiếp, `when` = max trên main + 2000, không chèn trước mục đã có. INV 01/11: v1.0.1 đi riêng, không chờ LP-v2.

1. **PR #16** `be/gchat-booking-notify` → `main` (đã đủ duyệt ARC + SEC; gộp sạch với `main`).
2. **`be-a-v1.0.1`** (0089, OpenAPI 0.3.9-draft của v1.0.1) rồi **`fe-a-v1.0.1`** → `main`. Tác giả của hai nhánh này tự giải 5/2 tệp đang xung đột với `main` (không do LP-v2).
3. **PN-01** (`privacy_notice_version` chỉ thêm dòng) nếu đi cùng v1.0.1 (SEC ★2-bis) → lấy **0090**.
4. **Lượt landing v1.0.1** (thông báo `2026-10-31`, sửa `consentMore` SEC-LP2-01) → `main`.
5. Gộp `lp-v2-be` + `lp-v2-fe` vào `lp-v2` (làm được **ngay** – sạch), rồi gộp `main` (sau bước 1–4) vào `lp-v2`:
   - OpenAPI LP-v2 đổi thành **0.3.10-draft** (ARC làm, mục 8); BE sinh lại meta/schemas/api-client;
   - migration LP-v2 lấy số kế tiếp (**0091** nếu PN-01 đã lên; nếu PN-01 chưa lên thì LP-v2 lấy 0090 và PN-01 đổi số khi lên sau), snapshot sinh lại (BE-01);
   - `privacy.ts` en/vi lấy chữ `2026-10-31` trên `main` làm gốc + Δ5 (FE-03);
   - CI xanh đủ (api, admin-web, landing, e2e landing).
6. **OPS-01** (Caddy, compose, script thông báo) gộp vào `lp-v2` hoặc PR riêng lên `main` trước khi deploy LP-v2.
7. `lp-v2` → `main` sau QA + QC; phát hành theo ARC 3.6 (5): api (giữ `LANDING_LOCALES=en,vi`) → landing → `publish-privacy-notice` 5 ngôn ngữ → `LANDING_LOCALES=en,vi,ko,zh,ru` → QA form 5 ngôn ngữ → OWN bật `public_show_prices` khi QA giá đạt **trên bảng giá mới đã nhập**.

Phụ thuộc chéo (không thuộc hai nhánh này): SEC mục 10 về `chatSafeText` (dấu `。`, tên miền Kirin) nằm ở nhánh Chat – phải xong trước khi production nhận yêu cầu ko/zh/ru **ở mức C**. Mức A không bị ảnh hưởng.

---

## 6. Tác động bảng giá 01/11 lên LP-v2

| Thay đổi (INV 01/11, bảng `OTTIMO_pricing_spec`) | Tác động | Việc |
|---|---|---|
| Một mức giá cho mọi kênh, không còn "giá OTA nền" riêng | `web_estimate.parity_mode = ota_floor` (mặc định) **thừa và có hại**: (a) `pub = max(giá sau giảm, sàn OTA)` (`public-rate.ts` dòng 154–155) xóa giảm BR-107 trên web trong khi Desk vẫn giảm; (b) `ota_base_rate` cũ không sửa → web cao hơn báo giá Desk; (c) `ota_base_rate` bị bỏ/0 → mọi căn thành `gap` (G4, dòng 137) → web "giá theo yêu cầu" ở mọi hạng | BE-04 |
| Từ **30 đêm** chuyển giá tháng (thay 28) | Mã BE dùng tham số `long_stay_required_from_nights` ở `public-rate.ts` nhưng **chép cứng 28** ở 3 chỗ; landing `shortMaxNights: 27` | BE-03, FE-01 |
| Không giảm theo số đêm | OWN đặt bậc BR-107 = 0 → `losDiscountPct`/`losDiscountVnd` = 0. Không đổi mã, không đổi hợp đồng; FE đã ẩn dòng giảm khi 0 | Chỉ QA kiểm |
| Cuối tuần / lễ (ESC-045 câu 1, chưa quyết) | Tham số lịch giá; `upliftNights` = 0 nếu chọn A. Không đổi mã | Chỉ QA kiểm theo câu trả lời |
| Khách thêm 150.000; trẻ 6–11 (ESC-045 câu 3) | Tham số BR-110. Không đổi mã | – |
| Khách tối đa = định mức + 1 | Dữ liệu `room.max_occupancy` trên Desk → quyết `party_exceeds_room` | OWN/DOM kiểm khi nhập bảng mới |
| Web không hiện giá tháng | Đã đúng (`monthly_offer`) | – |
| Bỏ "chỉ từ 667.000" | Không có trên hai nhánh này. Nhánh `landing-f9-from-price` **không** được gộp | ORC lưu ý |
| Số mẫu DOM mục 11 dùng giá cũ | Test BE (`lp-v2-be-units.test.ts`) dùng bảng DS-E cũ – vẫn đúng như kiểm động cơ, nhưng chưa có ca theo bảng mới | BE-05 |

`PublicPriceEstimate` **không cần đổi** vì bảng giá mới: các trường giảm/tăng giá vẫn có nghĩa (bằng 0).

---

## 7. Thẻ feedback

### FB-R4-ARC-BE-LPV2-01
- Mức độ: Major
- Vị trí: `product/services/api/src/db/migrations/0090_lp_v2_price_estimate_locales.sql`, `meta/0090_snapshot.json` (`prevId` = 0088 `03fbd7b0…`), `meta/_journal.json` (idx 65, `when` 1792782169681); giả định G1 trong `lp-v2-be.md`
- Vấn đề: (1) idx 65 trùng `0089_simulation_guard_room_price_cancel` của `be-a-v1.0.1` (merge-tree báo xung đột `_journal.json`). (2) Số 0090 đã được ARC dành cho PN-01 (decision-log 30/10). (3) Snapshot dựng từ 0088 nên thiếu `simulation_guard`; G1 chỉ nói sửa `prevId` – không đủ.
- Vì sao quan trọng: journal sai thứ tự hoặc snapshot thiếu bảng → migrator lỗi trên production hoặc lần sinh migration sau tạo lại bảng đã có.
- Đề xuất sửa: khi gộp `main` (sau mục 5 bước 2–3) vào `lp-v2`: đổi tên tệp sang số kế tiếp trên `main` (0091 nếu PN-01 đã lên), idx = max + 1, `when` = max + 2000; **sinh lại** snapshot bằng drizzle-kit từ snapshot mới nhất trên `main` (có `simulation_guard`) cộng thay đổi LP-v2; sửa chú thích trong SQL, `db/schema/public-site.ts` và `lp-v2-price-estimate.test.ts`; chạy test migration trên DB đã có 0089 (và PN-01 nếu có).
- Trạng thái: Open

### FB-R4-ARC-BE-LPV2-02
- Mức độ: Major
- Vị trí: `product/docs/api/openapi.yaml` (`info.version`, mục "Thay đổi phiên bản 0.3.9-draft"); `services/api/src/generated/openapi-meta.ts`, `openapi-schemas.ts`; `packages/api-client/src/generated/openapi.ts`
- Vấn đề: `be-a-v1.0.1` và `lp-v2` cùng gọi bản hợp đồng là **0.3.9-draft** với nội dung khác nhau (lỗi đặt số của ARC ở lượt A). Gộp xung đột ở changelog; ba tệp sinh gộp sạch về chữ nhưng không khớp spec sau gộp.
- Vì sao quan trọng: hai bản hợp đồng khác nhau cùng một số làm sai mọi tham chiếu "0.3.9" trong tài liệu, test và báo cáo; `contract.test.ts` đỏ.
- Đề xuất sửa: ARC đổi phần LP-v2 thành **0.3.10-draft** (tiêu đề changelog, `info.version`, chú thích "0.3.9 (R4)" trong mô tả `getPublicPriceEstimate`, `PublicPriceEstimate`, `LandingLocale`, `PUBLIC_FORM_NOT_READY`) ngay khi gộp `main` có v1.0.1 vào `lp-v2`. BE chạy lại `pnpm --filter @ottimo/api gen:openapi` + generator api-client và đổi chú thích "0.3.9" trong mã LP-v2 sang "0.3.10". Đến lúc đó không đổi gì trên `lp-v2-be`.
- Trạng thái: Open

### FB-R4-ARC-BE-LPV2-03
- Mức độ: Major
- Vị trí: `public-site/internal/price-estimate.service.ts` dòng 387 và 495 (`>= 28`); `public-site/internal/public-booking.service.ts` dòng 69 (`LONG_STAY_NIGHTS = 28`), dòng 654; trong khi `reservations/public/public-rate.ts` dùng `pr.longStayRequiredFromNights` (tham số `long_stay_required_from_nights`)
- Vấn đề: hai nguồn cho mốc BR-108. INV 01/11 chốt 30 đêm. Khi OWN đặt tham số = 30, khách chọn 28–29 đêm: API trả số + token (`ok`, ngắn ngày), nhưng yêu cầu lưu `stay_kind = long` và bản Desk `priceEstimate.stayKind = long` cho một con số giá đêm.
- Vì sao quan trọng: Desk hiện sai loại lưu trú cho yêu cầu có giá, lễ tân báo giá theo tháng cho khách đã thấy giá đêm; DATA đếm sai.
- Đề xuất sửa: bỏ hằng 28; ba chỗ trên đọc `long_stay_required_from_nights` theo ngày nghiệp vụ (qua `PricingService.load` hoặc `ParameterService` – đã đọc trong cùng giao dịch). Ở `compute()` nhánh slug lạ có thể giữ `stayKind` theo tham số đã đọc. Test: tham số = 30 → 29 đêm có số + token, `stay_kind = short`, `seen.stayKind = short`; 30 đêm → `monthly_offer`, `stay_kind = long`. ARC sửa các câu "≥ 28 đêm" trong OpenAPI thành "≥ `long_stay_required_from_nights` (BR-108)".
- Trạng thái: Open

### FB-R4-ARC-BE-LPV2-04
- Mức độ: Major
- Vị trí: `reservations/public/public-rate.ts` dòng 137, 149–155; `public-rate.port.ts` dòng 72, 77 (mặc định và giá trị dự phòng `ota_floor`); migration 0090 khóa `web_estimate.parity_mode` mặc định `"ota_floor"`; test `lp-v2-price-estimate.test.ts` dòng 228 ("ca 1 (ota_floor default)")
- Vấn đề: INV 01/11 bỏ "giá OTA nền" riêng – một mức giá ở mọi kênh. Chế độ `ota_floor` (a) xóa giảm BR-107 trên web vì lấy `max(giá sau giảm, sàn)`, Desk thì vẫn giảm; (b) dùng `ota_base_rate` có thể không còn được OWN cập nhật → web cao hơn báo giá; (c) nếu `ota_base_rate` bị bỏ thì G4 loại mọi căn → web không bao giờ có số. Ngoài ra `loadParams` coi mọi giá trị khác `direct` là `ota_floor`.
- Vì sao quan trọng: mục tiêu R1 của thiết kế (giá web = giá Desk, cùng một bộ tính) không còn đúng; khách thấy số khác báo giá hoặc không thấy số.
- Đề xuất sửa: theo DOM `pricing-spec-2026-11-01-reconcile.md` về BR-116. ARC đề xuất **bỏ hẳn** (migration chưa phát hành nên sửa thẳng 0090): xóa khóa `web_estimate.parity_mode`, nhánh sàn và luật G4, trường `parityMode` trong `atSubmit`, `ParityMode`; ca test "ota_floor" đổi thành giá trực tiếp. Nếu DOM vẫn giữ BR-116 làm lưới: mặc định và giá trị dự phòng đổi thành `direct`, và G4 chỉ áp khi chế độ `ota_floor` được OWN bật rõ ràng. Không đổi hợp đồng công khai trong cả hai cách.
- Trạng thái: Open

### FB-R4-ARC-BE-LPV2-05
- Mức độ: Minor
- Vị trí: `product/services/api/test/lp-v2-be-units.test.ts` (bảng DS-E cũ, `longStayRequiredFromNights: 28`), `test/integration/lp-v2-price-estimate.test.ts`
- Vấn đề: chưa có ca kiểm theo bảng giá 01/11 (giá đêm phẳng 800.000/1.100.000/1.300.000, không giảm theo số đêm, mốc 30 đêm, khách thêm 150.000).
- Vì sao quan trọng: QA so giá web với Desk theo bảng mới; test đơn vị nên có cùng các ca để bắt sai trước staging.
- Đề xuất sửa: khi DOM phát hành lại ví dụ mục 11 theo bảng mới, thêm 3–4 ca (Studio 3 đêm thường, 3 khách; 7 đêm không giảm; 29 đêm có số; 30 đêm `monthly_offer`), giữ các ca cũ như kiểm động cơ.
- Trạng thái: Open

### FB-R4-ARC-BE-LPV2-06
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/pages/webreq/WebRequestDrawer.tsx` dòng 484 (thay đổi một dòng trên nhánh BE)
- Vấn đề: BE sửa tệp của FE-A (khách `ko`/`zh` dùng mẫu báo giá tiếng Anh) để typecheck xanh, chưa có test.
- Vì sao quan trọng: hành vi hiện cho lễ tân thay đổi mà không có test và không có người chịu trách nhiệm màn hình.
- Đề xuất sửa: giữ thay đổi (đúng ARC 3.5); FE-A nhận lại trong việc S35 `priceEstimate` + thêm test drawer cho `ko`/`zh` (mock `webreq.ts`).
- Trạng thái: Open

### FB-R4-ARC-BE-LPV2-07
- Mức độ: Suggestion
- Vị trí: migration 0090 – khóa `web_estimate.honor_hours`
- Vấn đề: khóa được tạo nhưng chưa có mã nào đọc (BR-115 (7) dành cho Desk sau).
- Vì sao quan trọng: khóa không có tác dụng dễ làm OWN tưởng đã có hiệu lực.
- Đề xuất sửa: giữ (chưa phát hành, rẻ); ghi rõ "chưa dùng – Desk báo giá đọc ở bản sau" trong `br_ref`/mô tả tham số trên Desk, hoặc bỏ khỏi 0090 nếu DOM bỏ luật giữ giá khi rà bảng mới.
- Trạng thái: Open

### FB-R4-ARC-FE-LPV2-01
- Mức độ: Major
- Vị trí: `product/apps/landing-web/src/content/site.json` dòng 40 (`"shortMaxNights": 27`), dùng ở `BookingForm.astro` dòng 51 (`data-short-max`) cho câu `longHint`; chú thích "28+ nights" trong `booking-strings/{en,vi,ko,zh,ru}.ts`, `types.ts`
- Vấn đề: INV chốt chuyển giá tháng từ 30 đêm. Với 27, khách chọn 28–29 đêm thấy câu "We will quote our long-stay rate" ngay dưới ô ngày, trong khi ô giá (API theo tham số 30) hiện tổng giá đêm.
- Vì sao quan trọng: hai thông điệp trái nhau trên cùng một form, ngay chỗ khách quyết gửi.
- Đề xuất sửa: đổi thành **29** trong cùng lượt phát hành LP-v2 (và chỉ khi OWN đặt `long_stay_required_from_nights = 30` – ORC ghi vào checklist phát hành); sửa chú thích "28+" thành "từ mốc BR-108"; ghi trong `apps/landing-web/README.md`: đổi mốc trên Desk thì đổi `shortMaxNights` cùng ngày. Test: `longHint` hiện từ đêm thứ 30.
- Trạng thái: Open

### FB-R4-ARC-FE-LPV2-02
- Mức độ: Minor
- Vị trí: `product/apps/landing-web/src/scripts/booking-logic.ts` (`BookingInput` nới tay, `interface PublicPriceEstimate` viết tay)
- Vấn đề: kiểu hợp đồng viết tay trong khi api-client sinh từ 0.3.9 đã có trên `lp-v2-be`. Hiện khớp đủ 15 trường (mục 3), nhưng hợp đồng đổi thì trang không báo lỗi biên dịch.
- Vì sao quan trọng: một nguồn sự thật cho hợp đồng (ADR-001).
- Đề xuất sửa: ngay sau khi gộp `lp-v2-be` vào `lp-v2`: `type PublicPriceEstimate = components['schemas']['PublicPriceEstimate']`, bỏ `Omit`/nới của `BookingInput`; giữ `isEstimate` để kiểm lúc chạy.
- Trạng thái: Open

### FB-R4-ARC-FE-LPV2-03
- Mức độ: Minor
- Vị trí: `product/apps/landing-web/src/content/privacy.ts` (en/vi dựng theo bảng Δ của SEC, giả định G2)
- Vấn đề: chữ `2026-10-31` thật sẽ lên `main` qua lượt landing v1.0.1 → xung đột khi gộp `main` vào `lp-v2`; dễ lệch một chữ giữa hai bản.
- Vì sao quan trọng: ràng buộc FB-01 – một (version, locale) đúng một chuỗi byte; thông báo đã ghi phiên bản không được lệch chữ.
- Đề xuất sửa: khi gộp, lấy bản `2026-10-31` trên `main` làm gốc rồi áp Δ5 (ESC-044) + phần ko/zh/ru; SEC so lại chữ en/vi trước khi chốt nhãn version thật; `dist-checks` `checkNoticeVersion` giữ nguyên.
- Trạng thái: Open

### FB-R4-ARC-FE-LPV2-04
- Mức độ: Minor
- Vị trí: FE D10 – ngân sách Lighthouse ARC 3.3 (LCP ≤ 2,5 s, CLS ≤ 0,1 cho 5 trang chủ)
- Vấn đề: repo không có Lighthouse CI; ngân sách byte đã đo bằng Playwright (đạt), LCP/CLS chưa đo.
- Vì sao quan trọng: trang zh nặng nhất (515 KB máy tính DPR2) và có font cắt – CLS khi đổi font là rủi ro chính.
- Đề xuất sửa: QA đo LCP/CLS thủ công (Lighthouse Chrome, mô phỏng di động) cho 5 trang chủ trên staging trước QC; Lighthouse CI là việc OPS ở bản sau, không chặn LP-v2.
- Trạng thái: Open

### FB-R4-ARC-OPS-LPV2-01
- Mức độ: Major
- Vị trí: `product/infra/caddy/Caddyfile.landing`, `infra/ci/check-caddy-landing.sh`, `infra/docker-compose.prod.yml`, `infra/server/bin/publish-privacy-notice.sh` + `.sql` + test, `infra/server/bin/deploy-landing.sh`, `infra/README.md` 12.3
- Vấn đề: không nhánh nào có phần hạ tầng của ARC 2.6, 3.2, 3.6, 4.3. Hiện trên `main`: Caddy chỉ proxy 2 operation (dòng 153–175), `@closed` vẫn chặn `/ru /ru/*` (dòng 178), `handle_errors 404` chỉ biết `/vi/`; compose không chuyển `LANDING_LOCALES` vào api (api luôn `en,vi`); `publish-privacy-notice.sh` cứng `sha_en`/`sha_vi` và dò chữ "Version"/"Phiên bản" (dòng 117–153); `deploy-landing.sh` lặp `en vi` (dòng 104–108).
- Vì sao quan trọng: không có các phần này thì trên staging/production ô giá luôn 404, trang `/ru/` bị chặn, 404 của ko/zh/ru sai trang, và không ghi được phiên bản thông báo 5 ngôn ngữ – form ko/zh/ru trả `PUBLIC_FORM_NOT_READY`.
- Đề xuất sửa: (1) matcher `@public_price_estimate` GET đúng `^/v1/public/properties/[a-z0-9-]{2,40}/price-estimate$` cùng công tắc `LANDING_PUBLIC_API`; (2) `handle_errors 404` theo `/(vi|ko|zh|ru)/`; (3) bỏ `/ru /ru/*` khỏi `@closed`; (4) `check-caddy-landing.sh` thêm: `on` GET price-estimate tới api, `on` POST price-estimate → 404, `off` → 404, `/ko/x` → `/ko/404/`; (5) compose api: `LANDING_LOCALES: ${LANDING_LOCALES:-en,vi}`; (6) `publish-privacy-notice` + `deploy-landing` bước `privacy`: danh sách từ `LANDING_LOCALES`, version đọc từ **thẻ meta** `ottimo-notice-version` (đúng một thẻ mỗi trang; `--rollback` vẫn đọc mẫu chữ cũ), một giao dịch cho mọi locale, mọi `sha` khác nhau từng đôi, log `sha_<loc>=` (vẫn đọc dòng cũ); (7) cảnh báo log `public_price_missing` và tỉ lệ 429/503 của route giá (SR-PE-16); (8) README 12.3 thứ tự phát hành và rollback theo ARC 3.6 (5)(6), thêm bước "đổi `shortMaxNights` khi đổi mốc BR-108".
- Trạng thái: Open

---

## 8. Việc ARC tự làm ở bước Phản hồi & sửa (không cần thẻ)
- OpenAPI: đổi LP-v2 thành 0.3.10-draft khi gộp `main` có v1.0.1 (BE-02); thêm 422 `PUBLIC_FORM_NOT_READY` cho `createWebsiteBookingRequest` (L8); mô tả `public_show_prices` audit `security` + công tắc khẩn (L7); ở tối thiểu không có số (L12); "≥ 28 đêm" → tham số BR-108 (BE-03); bỏ nhắc `parity_mode`/sàn nếu DOM bỏ BR-116 (BE-04).
- `erd.md` 4.14: cột `price_estimate` (`{v, seen, atSubmit}`), CHECK locale 5 giá trị, khóa `public_show_prices`, `web_estimate.*` theo kết quả BE-04.
- `lp-v2-design.md` lên 0.2: A6 (60 giây), 2.5 theo SEC, 2.7 server tính lại, 2.9 audit `security`, mục 6 bảng giá 01/11.

## 9. Đề nghị ORC ghi decision-log
`| 2026-11-01 | 4 | ARC – review mã LP-v2 (lp-v2-be 63c5731e, lp-v2-fe 5db7df80): Duyệt có điều kiện cả hai; gộp vào lp-v2 ngay (sạch). Chấp nhận lệch BE L1–L12 (theo SEC), FE D1/D3/D5/D6/D12 (OPS đọc thẻ meta). Lên main sau v1.0.1: PR #16 → be-a 0089 → fe-a → PN-01 (0090) → landing 2026-10-31 → lp-v2 (migration số kế tiếp, snapshot sinh lại; OpenAPI LP-v2 = 0.3.10-draft). Bảng giá 01/11: mốc BR-108 đọc từ tham số ở mọi chỗ (30), landing shortMaxNights 29; parity_mode ota_floor bỏ hoặc mặc định direct theo DOM. Major: BE-01…04, FE-01, OPS-01 | ARC | Quyền ARC (kỹ thuật) |`

## 10. Điểm làm tốt
- BE: cổng `PublicRatePort` dùng đúng hàm của động cơ Desk (`calendarRate`, `applyNightDiscount`, `extraPersons`), có test tĩnh "không đọc đơn đặt"; phản hồi dựng từng trường (`publicEstimateDto`), `toTotal`/mã căn không bao giờ ra ngoài; tính lại trong SAVEPOINT nên giá không bao giờ làm hỏng yêu cầu.
- BE: bucket, bulkhead và trần tính mới riêng cho route giá, có test chứng minh form vẫn 202 khi route giá bị 429/503.
- FE: mốc tháng của form giá để API quyết (không chép số), token chỉ gửi khi số trên màn hình đúng lựa chọn; trang `en`/`vi` tải 0 tệp font ko/zh/ru và `/vi/` giữ đúng byte thân trang.
