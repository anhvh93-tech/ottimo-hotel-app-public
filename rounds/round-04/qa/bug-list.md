# Danh sách lỗi – Round 4

- Tác giả: QA | Mở: 01/11/2026 – gói LP-v2, bước Kiểm thử trên `origin/lp-v2` @ `83c13990` (`lp-v2-be` 6ae46d4a + `lp-v2-fe` a72bcbfc + `lp-v2-ops` 74e23925).
- Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8. Lỗi tồn R3: `rounds/round-03/qa/bug-list.md` (không chép lại).
- Mã: `BUG-R4-xxx`. Nếu luồng QA khác của Round 4 (v1.0.1, hotfix bảng giá H1–H9) mở tệp này cùng lúc, ORC gộp và cấp lại số liên tiếp khi merge.
- Môi trường chung: stack thử `ottimo-qalp2` (compose dev + `Caddyfile.landing` thật, `LANDING_PUBLIC_API=on`, `LANDING_LOCALES=en,vi,ko,zh,ru`), DS-E, bảng giá 01/11 nhập như "ngày chuyển S" của DOM. Chi tiết: `rounds/round-04/qa/lp-v2-test-report.md` mục 1. Chỉ dữ liệu giả.

## 1. Tổng hợp

| Mức | Số lỗi | Open | Fixed | Closed |
|---|---|---|---|---|
| P0 | 0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 | 0 |
| P2 | 4 | 4 (BUG-R4-001, 002, 003, 004) | 0 | 0 |
| P3 | 1 | 1 (BUG-R4-005) | 0 | 0 |
| **Tổng** | **5** | **5** | **0** | **0** |

## 2. Chi tiết

### BUG-R4-001 – Desk không hiện "Giá ước tính khách đã thấy" và không báo chênh khi chuyển thành báo giá

- **Mức:** P2.
  - Không sai tiền: báo giá Desk vẫn tính đúng bằng cùng bộ tính với web (13/13 ca lệch 0 đ). Có cách vòng khi giá chưa đổi: lễ tân báo giá cùng đầu vào sẽ ra cùng số.
  - Nhưng đây là **US-131 AC10 (Must)** và là lớp chống tranh chấp T7 của SEC. Khi giá đã đổi giữa lúc khách xem và lúc báo giá, lễ tân không có cách nào biết khách đã thấy số nào. QC quyết việc chặn phát hành phần (a).
- **Môi trường:** stack thử, Desk `http://127.0.0.1:58401` (`qa.fd`), màn S35 "Yêu cầu từ website", 01/11 15:09–15:30 (giờ stack 02/11 08:xx cho bước đổi giá).
- **Các bước:**
  1. Trang `/ko/`, chọn Studio vườn, 2 người lớn, 10→11/11 → ô giá 800,000 VND → gửi (yêu cầu `WAWZK780`).
  2. Desk → Yêu cầu từ website → mở `WAWZK780`.
  3. OWN đổi giá đêm 4 căn Garden thành 870.000 từ 10/11 (Danh mục căn / `updateRoom`).
  4. Ở ngăn yêu cầu bấm **Báo giá**, chọn căn 102.
- **Thực tế:**
  - API `GET /website-booking-requests` trả đủ `priceEstimate` (`totalVnd 800000`, `computedAt`, `priceVersion`).
  - Ngăn chi tiết **không** có dòng "Giá ước tính khách đã thấy: … – tính lúc …"; yêu cầu gửi khi không có giá cũng không có "Khách chưa thấy giá".
  - Hộp báo giá hiện "1 đêm thường × 870.000 · Tổng 870.000 đ", **không** có "Đã đổi: 800.000 → 870.000".
  - `admin-web/src` không có chỗ nào đọc `priceEstimate`.
- **Mong đợi:** US-131 AC10: chi tiết yêu cầu hiện "Giá ước tính khách đã thấy: {số} – tính lúc {giờ}" (hoặc "Khách chưa thấy giá"); khi chuyển thành báo giá mà giá Desk khác thì hiện "Đã đổi: {cũ} → {mới}". Nên làm cùng SEC FB-R4-SEC-BE-03 (đưa `atSubmit` ra API chỉ đọc).
- **Bằng chứng:** `rounds/round-04/qa/lp-v2/18-desk-ko-khoa-chu-tho-khong-gia.png`, `21-desk-bao-gia-870-khach-da-thay-800.png`; báo cáo mục 3.3.
- **Vai:** FE-A (S35, việc ARC đã giao ở FB-R4-ARC-BE-LPV2-06) + ARC (trường chỉ đọc, nếu dùng `atSubmit`) + UXD/CPY (chữ Desk).
- **Trạng thái:** Open.

### BUG-R4-002 – Desk hiện khóa chữ thô `webreq.locale.ko` / `webreq.locale.zh` thay vì "Tiếng Hàn" / "Tiếng Trung (giản thể)"

- **Mức:** P2. Đây là US-175 AC3 (Must). Lễ tân vẫn đoán được ngôn ngữ từ khóa, nhưng màn hình lộ chuỗi kỹ thuật. Báo cáo/xuất dữ liệu dùng chung nhãn này cũng sẽ sai (AC5).
- **Môi trường:** như BUG-R4-001; yêu cầu `WAWZK780` (ko), `5S06RVS6` (zh), `YHBQWBHK` (ru).
- **Các bước:** gửi form từ `/ko/` và `/zh/` → Desk → Yêu cầu từ website → mở từng yêu cầu → xem dòng "Ngôn ngữ khách dùng".
- **Thực tế:** ko → `webreq.locale.ko`; zh → `webreq.locale.zh`; ru → "Tiếng Nga" (đúng). `product/design/copy/strings-vi.json` (và `strings-en.json`) chỉ có `webreq.locale.vi/en/ru`.
- **Mong đợi:** "Tiếng Hàn", "Tiếng Trung (giản thể)" (US-175 AC3), có cả bản EN của Desk. Thêm test drawer cho `ko`/`zh` (đúng việc ARC đã giao ở FB-R4-ARC-BE-LPV2-06).
- **Bằng chứng:** `lp-v2/18-desk-ko-khoa-chu-tho-khong-gia.png`, `19-desk-zh-khoa-chu-tho-khong-gia.png`, `20-desk-ru-tieng-nga.png`.
- **Vai:** FE-A + UXD (chuỗi Desk).
- **Trạng thái:** Open.

### BUG-R4-003 – Khối giá trong form thiếu 2 ý điều kiện bắt buộc: "chưa giữ phòng / phòng trống xác nhận trong báo giá" và "cho số khách đã chọn"

- **Mức:** P2. Đúng rủi ro R6 của PO: khách hiểu con số là giá đã giữ phòng. Không sai tiền.
- **Môi trường:** stack thử, landing `https://landing.localhost:58400`, 5 ngôn ngữ, 1280 và 390 px.
- **Các bước:** chọn hạng phòng + ngày (ví dụ Studio vườn, 2 người lớn, 10→11/11) → đọc khối giá.
- **Thực tế (5/5 ngôn ngữ):** khối giá gồm nhãn "Estimated rate", con số, số đêm, (dòng khách thêm nếu có), rồi `Rates in Vietnamese dong (VND). Taxes included. Your final rate is in the quote we send.`
  - Có 3/4 ý của US-131 AC4: ước tính, giá cuối trong báo giá, đã gồm thuế.
  - **Không có** ý (4) "chưa giữ phòng" (PO AC4).
  - Không có "cho số khách đã chọn" và "phòng trống trong báo giá" của BR-115 (5) v0.5.0.
  - CPY `lp-v2-copy.md` mục chữ `estimate.*` cũng chưa có chuỗi cho các ý này, nên đây không phải lỗi dịch.
- **Mong đợi:** câu điều kiện đi liền con số đủ ý theo AC4 + BR-115 (5), ví dụ EN "For 2 guests. This does not hold a room – we confirm availability in your quote." (CPY chốt chữ, EN dẫn), có đủ ko/zh/ru. Người bản xứ đọc câu mới cùng lượt D4.
- **Bằng chứng:** `lp-v2/01`–`05-<lang>-390-gia-2-dem-3-khach.png`; báo cáo mục 3.2.
- **Vai:** CPY (chữ) → FE-B (hiện) → UXD (bố cục); PO xác nhận cách gộp AC4 với BR-115 (5).
- **Trạng thái:** Open.

### BUG-R4-004 – `updateRoom` trả 200 nhưng bỏ qua `publicRoomType`; `listRooms` không trả trường này → không gán được hạng công khai, web ra "giá theo yêu cầu" ở mọi hạng

- **Mức:** P2.
  - Production có `public_room_type` do `production-bootstrap` (B2) ghi, nên không chặn phát hành nếu dữ liệu production đúng.
  - Nhưng: (1) hợp đồng `RoomPatch` (0.3.7 bổ sung D1) có `publicRoomType` mà server im lặng bỏ – trả 200 như đã lưu; (2) OWN không có cách đổi/gán hạng căn lúc chạy; (3) mọi stack dựng từ DS-E (staging, demo, stack QA) không có hạng nào → ô giá luôn "giá theo yêu cầu". QA trên staging (SEC C8) sẽ không thấy số nếu không sửa dữ liệu trước.
- **Môi trường:** stack thử, api `PATCH /v1/properties/{id}/rooms/{roomId}` (`qa.owner`, `If-Match` đúng).
- **Các bước:** `PATCH` với `{ "publicRoomType": "standard-studio-city-view" }` (có hoặc không kèm `listPrice`) → đọc `room.public_room_type` trong DB và gọi giá web.
- **Thực tế:**
  - 200, thân trả không có `publicRoomType`; DB vẫn `NULL`. `listPrice` gửi cùng lần thì được lưu.
  - Giá web (`parity-run1`) trả `on_request` cho 10/10 ca.
  - `platform.controller.ts` (`RoomPatch` zod): không có khóa `publicRoomType`, nên zod bỏ trường lạ.
- **Mong đợi:** lưu `publicRoomType` theo hợp đồng (độ dài 1–60, `null` = xóa), trả lại trong `Room`/`listRooms`. Hoặc, nếu ARC quyết chỉ bootstrap được ghi, trả 422 cho trường không hỗ trợ và sửa hợp đồng. Trước QA staging: OPS/OWN kiểm 10 căn staging có `public_room_type` đúng `production-defaults.ts`.
- **Bằng chứng:** báo cáo mục 1.1; `parity-run1` (10/10 `on_request`) và `parity-run2` (sau khi QA đặt bằng SQL trên stack thử: 13/13 có số).
- **Vai:** BE (+ ARC quyết hợp đồng; FE-A nếu cần ô trên Danh mục căn).
- **Trạng thái:** Open. Lỗi có từ trước LP-v2 (US-155/BR-012), nhưng LP-v2 là tính năng đầu tiên phụ thuộc trường này.

### BUG-R4-005 – OpenAPI 0.3.10 mô tả `getPublicPriceEstimate` lệch hành vi thật

- **Mức:** P3 (tài liệu hợp đồng).
- **Môi trường:** `product/docs/api/openapi.yaml` trên `83c13990`; hành vi đo qua Caddy trên stack thử.
- **Thực tế – mô tả ghi:** "40/10 phút/IP"; "cache sống 300 giây"; `Cache-Control: private, max-age=60` (cả header khai báo của 200); "query > 512 byte → 422"; `statement_timeout = '2s'`.
- **Thực tế – đo được:** 429 từ lượt **31** (30/10 phút – ARC L1 đã chấp nhận); `Cache-Control: no-store` (L2); giá mới lên web sau 60 s; query 257 byte → 404 ở Caddy, api từ chối > 256 byte; `statement_timeout` 1 s (L3).
- **Mong đợi:** ARC cập nhật mô tả theo các lệch đã chấp nhận L1–L3 (ARC review mục 8 đã tự nhận việc này).
- **Bằng chứng:** báo cáo mục 4.1, 4.2.
- **Vai:** ARC.
- **Trạng thái:** Open.

## 3. Ghi nhận (không phải lỗi)

- Trong ~1 giây đầu khi một IP dồn lượt, 30 lượt hợp lệ đầu tiên của IP đó có thể làm khách khác nhận 503 (bộ đếm chung 10/giây). Sau lượt 30 thì không còn. Đây là rủi ro PE-RR4 SEC đã chấp nhận (báo cáo 4.1).
- Desk S35 cột "Hạng phòng" hiện slug (`standard-studio-garden-view`) vì nhãn = `publicRoomType`. Đây là hành vi US-155 có từ trước, không thuộc LP-v2; UXD xem có cần nhãn đẹp hơn.
- `state/privacy-notice.log`: dòng NOTICE thứ 2 trở đi không thụt lề. Thẩm mỹ, `deploy-landing` vẫn đọc đúng.
