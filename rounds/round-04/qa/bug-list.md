# Danh sách lỗi – Round 4

- Tác giả: QA | Mở: 01/11/2026 – gói LP-v2, bước Kiểm thử trên `origin/lp-v2` @ `83c13990` (`lp-v2-be` 6ae46d4a + `lp-v2-fe` a72bcbfc + `lp-v2-ops` 74e23925).
- Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8. Lỗi tồn R3: `rounds/round-03/qa/bug-list.md` (không chép lại).
- Mã: `BUG-R4-xxx`. Nếu luồng QA khác của Round 4 (v1.0.1, hotfix bảng giá H1–H9) mở tệp này cùng lúc, ORC gộp và cấp lại số liên tiếp khi merge.
- Môi trường chung: stack thử `ottimo-qalp2` (compose dev + `Caddyfile.landing` thật, `LANDING_PUBLIC_API=on`, `LANDING_LOCALES=en,vi,ko,zh,ru`), DS-E, bảng giá 01/11 nhập như "ngày chuyển S" của DOM. Chi tiết: `rounds/round-04/qa/lp-v2-test-report.md` mục 1. Chỉ dữ liệu giả.
- **Cập nhật lượt 2** (01/11 15:50–16:25, `origin/lp-v2` @ `20afedff` = `83c13990` + `lp-v2-be2` 7d9e306f + `lp-v2-fe2` c9372e52 + `lp-v2-ops2` 0185a935; stack thử `ottimo-qalp3`, hạng công khai gán qua API/Desk OWN): BUG-R4-002, 003, 004, 005 **đã sửa – đã xác nhận**; BUG-R4-001 **mở lại**; mới BUG-R4-006…010. Chi tiết: báo cáo mục 11.
- **Cập nhật lượt 3** (01/11 17:00–18:10, `origin/lp-v2` @ `0a25716a` = `20afedff` + `lp-v2-fe3` 73a80804 + `lp-v2-be3` 2f7b55f7, ee375e6d + `lp-v2-fe4` 0a25716a; stack thử `ottimo-qalp4`, hạng công khai dạng nhãn): BUG-R4-001, 006, 007, 008, 009 **đã sửa – đã xác nhận**; BUG-R4-010 **mở lại**; mới BUG-R4-011 (P2), BUG-R4-012 (P3). Chi tiết: báo cáo mục 12.
- **v1.0.1 đợt 1b – PR #21** (01/11 ~21:00, `fe-b/notice-2026-10-31` @ `5474b6e1`): PR đạt, không lỗi trong phạm vi PR; mới BUG-R4-013 (P2, CI – có sẵn trên `main`). Chi tiết: `rounds/round-04/qa/pr21-notice-2026-10-31.md`.
- **v1.0.1 đợt 2 – PR #22** (01/11 ~20:55–21:25, `v1.0.2-ed` @ `99734cda`, stack thử `ottimo-qapr22`): oracle BR-428-01…09 đạt (tính thử = ghi thật, 76/76 bảng không đổi khi tính thử); giá hẹn đạt. Mới BUG-R4-014 (P2) và BUG-R4-015 (P3). ORC giao số "BUG-R4-013…" nhưng 013 đã dùng ở PR #21. Chi tiết: `rounds/round-04/qa/pr22-v1.0.2-ed.md`.

## 1. Tổng hợp (sau lượt 3 + PR #21 + PR #22)

| Mức | Số lỗi | Open | Fixed (chờ QA) | Closed (đã xác nhận) |
|---|---|---|---|---|
| P0 | 0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 | 0 |
| P2 | 7 | 3 (BUG-R4-011, BUG-R4-013, BUG-R4-014 – mới) | 0 | 4 (BUG-R4-001, 002, 003, 004) |
| P3 | 8 | 3 (BUG-R4-010 – mở lại, BUG-R4-012, BUG-R4-015 – mới) | 0 | 5 (BUG-R4-005, 006, 007, 008, 009) |
| **Tổng** | **15** | **6** | **0** | **9** |

Lỗi R3 liên quan: **BUG-R3-050** (`rounds/round-03/qa/bug-list.md`, đích v1.0.1) – lượt 3 xác nhận đã sửa phần ngôn ngữ gửi tin, SĐT/WhatsApp vào hồ sơ, mở lại báo giá không về tiếng Việt (ca EN hồi quy đạt); phần còn lại tách thành BUG-R4-011 (kênh Zalo) và BUG-R4-012 (quốc tịch). ORC cập nhật trạng thái ở tệp R3.

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
- **Trạng thái:** **Closed – đã sửa, đã xác nhận** (lượt 3, `0a25716a` – dòng cuối mục này). Lịch sử: **Mở lại** (lượt 2, `20afedff`, 01/11 16:15), mức giữ **P2**.
  - Đã đạt (`lp-v2-fe2` c9372e52): ngăn chi tiết hiện "Giá ước tính khách đã thấy: 800.000 đ – tính lúc 01/11/2026 16:07" (ko/zh/ru) và "Khách chưa thấy giá" (yêu cầu theo tháng) – ảnh `lp-v2/33`, `34`.
  - **Chưa đạt – "Đã đổi" không hiện trên dữ liệu thật.** Các bước: (1) OWN gán hạng công khai bằng ô mới trên Desk (giá trị lưu là **nhãn** "Standard Studio · Garden View", như production `production-defaults.ts`); (2) khách gửi từ `/ko/` Garden, 2 người lớn, 10→11/11, thấy 800.000 (`AKKNTH8R`); (3) OWN đổi giá đêm 4 căn Garden thành 870.000 từ 10/11; (4) lễ tân mở yêu cầu → **Báo giá** → căn 102.
  - Thực tế: tổng 870.000, dòng dưới ghi "Khách đã thấy 800.000 đ cho ngày, số khách **hoặc hạng phòng khác** – không so sánh"; không có "Đã đổi: 800.000 → 870.000" (ảnh `lp-v2/35`). Trước khi đổi giá cũng ra "không so sánh" thay vì "Khớp…". Cùng kết quả với `C9GXC214` (zh, căn 202), `DDYRBQA3` (ru, căn 203).
  - Đối chứng: đặt tạm căn 103 = slug `standard-studio-garden-view` → báo giá căn 103 hiện đúng "Đã đổi: 800.000 đ → 870.000 đ" (ảnh `lp-v2/36`).
  - Nguyên nhân: `apps/admin-web/src/pages/webreq/labels.ts` `compareWithSeen` so `q.publicRoomType === seen.roomType` – nhãn của căn với **slug** web (`priceEstimate.roomType`). Hợp đồng 0.3.10 bổ sung 3: `Room.publicRoomType` là nhãn, web dùng slug của nhãn. Test `r4-lp-v2-fea.test.tsx` và ảnh FE dùng mock hạng dạng slug nên không bắt được.
  - Mong đợi / đề xuất sửa: so **slug của nhãn** (cùng hàm slug landing/BE dùng – ví dụ "Premium · One Bedroom + 1" → `premium-one-bedroom-1`) với `seen.roomType`; hoặc server trả sẵn slug của căn. Thêm test chống tái phát: căn có `publicRoomType` = "Standard Studio · Garden View", `seen.roomType` = `standard-studio-garden-view`, cùng ngày/số khách, tổng khác → `changed`; tổng bằng → `same`; nhãn hạng khác → `other`.
  - Vai: FE-A.
- **Lượt 3 (`0a25716a`, 01/11 17:2x): Closed – đã sửa, đã xác nhận.** Mọi căn mang nhãn như production. Yêu cầu `N4AVY1MY` (zh, Garden, thấy 800.000): căn 102 cùng giá → "Khớp giá ước tính khách đã thấy (800.000 đ)." (ảnh `lp-v2/44`); căn 101 (City) → "…hạng phòng khác – không so sánh."; căn 103 tạm "Chưa gán" → "…không so sánh." (ảnh `46`); OWN đổi Garden 870.000 từ 10/11 → căn 103: khung cảnh báo "Khác giá web khách đã thấy: 800.000 đ → 870.000 đ" + "Giá theo lịch giá hôm nay khác số khách thấy trên web…" (ảnh `45`). Ba ca báo giá ko/zh/ru ở căn 102/202/203 đều "Khớp". Hàm slug chung `@ottimo/contracts` có trong image api (`dist`, chạy thử ra đúng 4 slug). Báo cáo 12.2.

### BUG-R4-002 – Desk hiện khóa chữ thô `webreq.locale.ko` / `webreq.locale.zh` thay vì "Tiếng Hàn" / "Tiếng Trung (giản thể)"

- **Mức:** P2. Đây là US-175 AC3 (Must). Lễ tân vẫn đoán được ngôn ngữ từ khóa, nhưng màn hình lộ chuỗi kỹ thuật. Báo cáo/xuất dữ liệu dùng chung nhãn này cũng sẽ sai (AC5).
- **Môi trường:** như BUG-R4-001; yêu cầu `WAWZK780` (ko), `5S06RVS6` (zh), `YHBQWBHK` (ru).
- **Các bước:** gửi form từ `/ko/` và `/zh/` → Desk → Yêu cầu từ website → mở từng yêu cầu → xem dòng "Ngôn ngữ khách dùng".
- **Thực tế:** ko → `webreq.locale.ko`; zh → `webreq.locale.zh`; ru → "Tiếng Nga" (đúng). `product/design/copy/strings-vi.json` (và `strings-en.json`) chỉ có `webreq.locale.vi/en/ru`.
- **Mong đợi:** "Tiếng Hàn", "Tiếng Trung (giản thể)" (US-175 AC3), có cả bản EN của Desk. Thêm test drawer cho `ko`/`zh` (đúng việc ARC đã giao ở FB-R4-ARC-BE-LPV2-06).
- **Bằng chứng:** `lp-v2/18-desk-ko-khoa-chu-tho-khong-gia.png`, `19-desk-zh-khoa-chu-tho-khong-gia.png`, `20-desk-ru-tieng-nga.png`.
- **Vai:** FE-A + UXD (chuỗi Desk).
- **Trạng thái:** **Closed – đã sửa, đã xác nhận** (lượt 2, `20afedff`). Ngăn chi tiết: ko "Tiếng Hàn", zh "Tiếng Trung (giản thể)", ru "Tiếng Nga" (ảnh `lp-v2/33`, `34`); `strings-en.json` có "Korean", "Chinese (Simplified)". Phần "danh sách" của US-175 AC3 tách thành BUG-R4-007.

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
- **Trạng thái:** **Closed – đã sửa, đã xác nhận** (lượt 2, `20afedff`). Trang thật qua Caddy, 5/5 ngôn ngữ: câu đi liền con số có "cho n khách" (đổi đúng theo số người lớn + trẻ, kể cả trẻ dưới 6), "chưa giữ phòng" và "giá chính thức + phòng trống xác nhận trong báo giá"; câu điều kiện 15 px = nhãn ô form; 360 px tràn 0, không phần tử bị cắt (ảnh `lp-v2/28`–`32`; báo cáo 11.4). Nhãn "Estimated rate" 13 px tách thành BUG-R4-006. Câu mới chờ người bản xứ (cổng US-174 AC10).

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
- **Trạng thái:** **Closed – đã sửa, đã xác nhận** (lượt 2, `20afedff`; báo cáo 11.2). Lỗi có từ trước LP-v2 (US-155/BR-012), nhưng LP-v2 là tính năng đầu tiên phụ thuộc trường này.
  - API: `listRooms` luôn có `publicRoomType` (owner/manager/lễ tân); owner `PATCH` lưu + trả + audit `room.updated`, kể cả bước gốc (kèm `listPrice`, 10 căn 200); bỏ khoảng trắng; `null` xóa; không gửi khóa thì giữ; `""`/khoảng trắng/61 ký tự/số/mảng → 422; manager (cả `null`, cả kèm trường khác) và lễ tân → 403, DB không đổi.
  - Web: đổi hạng → giá web theo **ngay** lượt gọi kế tiếp (cache xóa khi `updateRoom`); lượt 403 không xóa cache.
  - Desk: owner có ô chọn 4 nhãn + "Chưa gán" (ảnh `lp-v2/39`); manager chỉ đọc + "Chỉ chủ đầu tư đổi được hạng này.", lưu trường khác không mang `publicRoomType` (ảnh `lp-v2/40`). Giá web với hạng dạng nhãn: 13/13 lệch 0 đ.
  - Việc còn lại ngoài lỗi: trước khi QA staging, OWN staging gán 10 hạng bằng ô mới (BE 10.2); OPS chạy câu SELECT chỉ đọc trên production như BE đề xuất.

### BUG-R4-005 – OpenAPI 0.3.10 mô tả `getPublicPriceEstimate` lệch hành vi thật

- **Mức:** P3 (tài liệu hợp đồng).
- **Môi trường:** `product/docs/api/openapi.yaml` trên `83c13990`; hành vi đo qua Caddy trên stack thử.
- **Thực tế – mô tả ghi:** "40/10 phút/IP"; "cache sống 300 giây"; `Cache-Control: private, max-age=60` (cả header khai báo của 200); "query > 512 byte → 422"; `statement_timeout = '2s'`.
- **Thực tế – đo được:** 429 từ lượt **31** (30/10 phút – ARC L1 đã chấp nhận); `Cache-Control: no-store` (L2); giá mới lên web sau 60 s; query 257 byte → 404 ở Caddy, api từ chối > 256 byte; `statement_timeout` 1 s (L3).
- **Mong đợi:** ARC cập nhật mô tả theo các lệch đã chấp nhận L1–L3 (ARC review mục 8 đã tự nhận việc này).
- **Bằng chứng:** báo cáo mục 4.1, 4.2.
- **Vai:** ARC.
- **Trạng thái:** **Closed – đã sửa, đã xác nhận** (lượt 2, `20afedff`; BE sửa mô tả "0.3.10 bổ sung 3"). Mô tả mới khớp đo thật: 429 từ lượt 31, 503 cửa sổ chung 10/giây, query > 256 byte → Caddy 404 / api 422, `no-store` + `noindex`, cache 60 s xóa khi `updateRoom`, `publicRoomType` chỉ owner (báo cáo 11.6). ARC vẫn phải xác nhận mục 0.3.10 bổ sung 3 (ngoài phạm vi đóng lỗi của QA).

### BUG-R4-006 – Nhãn "Estimated rate / Giá ước tính" (ý (1) của US-131 AC4) 13 px, nhỏ hơn chữ form 15 px

- **Mức:** P3. Đủ ý, đọc được, màu đạt tương phản; lệch theo nghĩa chữ của AC4 ("cùng cỡ chữ không nhỏ hơn chữ nội dung của form" cho **cả 4 ý**).
- **Môi trường:** lượt 2, stack `ottimo-qalp3`, landing `20afedff`, 5 ngôn ngữ, 360 và 1280 px.
- **Các bước:** chọn hạng + ngày → khối giá hiện số → đo `getComputedStyle(...).fontSize`.
- **Thực tế:** `.est-note` (ý 2–4 + số khách) 15 px = `.f-label` 15 px; `.est-lbl` ("ESTIMATED RATE", "GIÁ ƯỚC TÍNH", "예상 요금", "预估价格", "ОРИЕНТИРОВОЧНАЯ ЦЕНА") **13 px** chữ hoa giãn (đúng UXD `lp-v2-design.md` dòng 220). Dòng "Includes one more guest." 14 px (không phải ý điều kiện).
- **Mong đợi:** một trong hai: (a) UXD nâng `.est-lbl` lên 15 px (giữ chữ hoa/giãn nếu muốn); hoặc (b) PO ghi rõ trong AC4 nhãn tiêu đề khối được miễn (vì đứng sát con số Lora cỡ lớn).
- **Bằng chứng:** báo cáo 11.4; ảnh `lp-v2/28`–`32`.
- **Vai:** UXD (+ FE-B một dòng CSS) hoặc PO (sửa AC).
- **Trạng thái:** **Closed – đã sửa, đã xác nhận** (lượt 3, `0a25716a`). `.est-lbl` 15 px = câu điều kiện 15 px = nhãn ô form 15 px ở en/vi/ko/zh/ru × 360 và 1280 px; nhãn một dòng, không bị cắt (kể cả ru "ОРИЕНТИРОВОЧНАЯ ЦЕНА", ảnh `lp-v2/54`); tiêu đề lời mời 30 đêm cũng 15 px; tràn trang 360 px 0. Báo cáo 12.3.

### BUG-R4-007 – S35 danh sách không có cột/lọc ngôn ngữ; không có báo cáo/xuất → INV không đếm khách theo ngôn ngữ (US-175 AC3 "danh sách", AC5)

- **Mức:** P3. Lễ tân vẫn thấy ngôn ngữ khi mở từng yêu cầu; dữ liệu có ở API. Nhưng AC3 đòi nhãn ở **danh sách và chi tiết**, AC5 đòi đếm được theo 5 ngôn ngữ.
- **Môi trường:** lượt 2, Desk `20afedff` (`qa.fd`), 4 yêu cầu ko/zh/ru/zh.
- **Các bước:** Desk → Yêu cầu từ website → xem bảng; tìm chỗ xuất/báo cáo yêu cầu website.
- **Thực tế:** bảng có Mã, Gửi lúc, Ngày ở, Số khách, Hạng phòng, Trả lời qua, Nguồn, Hạn trả lời, Cần xem, Người xử lý, Trạng thái – **không có** "Ngôn ngữ", không có bộ lọc theo ngôn ngữ (ảnh `lp-v2/41`). Không có xuất CSV/báo cáo nào cho yêu cầu website (`admin-web` không có chức năng xuất; module `reporting` không đọc bảng này). API `listWebsiteBookingRequests` có `locale` (đã thấy `ko`, `zh`, `ru`).
- **Mong đợi:** cột "Ngôn ngữ" (nhãn tiếng Việt như ngăn chi tiết) ở danh sách S35, có lọc hoặc đếm theo ngôn ngữ; hoặc PO sửa AC5 (ví dụ "đếm bằng lọc S35" hay dời sang báo cáo R5).
- **Bằng chứng:** báo cáo 11.5, 11.7 (AC5); ảnh `lp-v2/41`.
- **Vai:** FE-A (+ UXD bố cục cột) · PO quyết phạm vi AC5.
- **Trạng thái:** **Closed – đã sửa, đã xác nhận** (lượt 3, `0a25716a`; theo AC3, AC5 PO sửa 01/11). Cột "Ngôn ngữ" nhãn VI đúng 5 giá trị; lọc từng ngôn ngữ kết hợp nút trạng thái; "{n} yêu cầu khớp bộ lọc" = `total` API ở 18/18 tổ hợp (mặc định, mọi trạng thái gồm Đã thành đơn/Đã đóng, chỉ Đã thành đơn + Đã đóng × mọi/5 ngôn ngữ), kể cả ru 58 và mọi ngôn ngữ 66 khi Desk mới tải 50 dòng (ảnh `lp-v2/42`, `43`). Ghi chú cho UXD (không phải lỗi): ở 1366 px bảng vẫn cuộn ngang trong khung (1215/1084 px); cột Ngôn ngữ rộng 93 px – AC3 "không cuộn thêm vì cột mới" đạt nếu so với bản trước lượt (FE đo 1440), không đạt nếu so với cùng bản bỏ cột (1122). Báo cáo 12.5.

### BUG-R4-008 – Báo giá/giữ chỗ từ yêu cầu ko/zh: Desk không ghi "Khách dùng tiếng Hàn – tin gửi bằng tiếng Anh"; hồ sơ khách không lưu ngôn ngữ (US-175 AC4)

- **Mức:** P3. Thao tác thành công và tin mặc định đúng tiếng Anh (ko/zh) / tiếng Nga (ru), nên khách nhận đúng ngôn ngữ ở lần gửi đầu. Thiếu phần giải thích cho nhân viên và phần lưu ngôn ngữ.
- **Môi trường:** lượt 2, Desk `20afedff` (`qa.fd`); yêu cầu `AKKNTH8R` (ko), `C9GXC214` (zh), `DDYRBQA3` (ru); hồ sơ khách giả tạo bằng API.
- **Các bước:** mở yêu cầu ko → Báo giá → chọn căn, chọn khách → Lưu báo giá → Khách đồng ý – Giữ chỗ → Tạo giữ chỗ. Lặp với zh, ru. Đọc `guest.preferred_locale` trên DB stack thử.
- **Thực tế:**
  - Báo giá 201 (`BG-00001`…`00003`), giữ chỗ 201 (`OTM-00001`, `OTM-00002`); ô "Ngôn ngữ gửi khách" chọn sẵn English (ko, zh), Русский (ru) – ảnh `lp-v2/37`, `38`.
  - **Không** có dòng "Khách dùng tiếng Hàn – tin gửi bằng tiếng Anh" (hay tương đương) ở hộp báo giá/giữ chỗ; `strings-vi.json` không có chuỗi này.
  - `guest.preferred_locale` vẫn `vi` sau báo giá từ yêu cầu ko/zh/ru; CHECK của cột chỉ nhận `vi`/`en`/`ru`. Mở lại báo giá sau đó theo hồ sơ → tiếng Việt (cùng gốc với **BUG-R3-050**, P3, đích v1.0.1; US-175 AC4 dẫn nhầm "BUG-R3-055").
- **Mong đợi:** (1) câu Desk như AC4 cạnh ô ngôn ngữ khi `locale` là ko/zh; (2) ngôn ngữ khách đã dùng được ghi vào hồ sơ/đơn theo cách ARC chọn (ko/zh → `en` cho mẫu tin, kèm nơi ghi ngôn ngữ gốc), sửa cùng BUG-R3-050.
- **Bằng chứng:** báo cáo 11.7; ảnh `lp-v2/37`, `38`.
- **Vai:** FE-A/FE-B (Desk) + UXD/CPY (chữ) + ARC (cách lưu) · PO sửa mã lỗi dẫn trong AC4.
- **Trạng thái:** **Closed – đã sửa, đã xác nhận** (lượt 3, `0a25716a`; theo AC4 PO sửa 01/11).
  - Câu "Khách viết bằng tiếng Hàn / tiếng Trung – gửi tin bằng tiếng Anh." và "Khách viết bằng tiếng Nga – gửi tin bằng tiếng Nga." hiện dưới ô "Ngôn ngữ gửi khách" và dưới thẻ cọc ở hộp giữ chỗ (trước và sau khi tạo); không có với en/vi (ảnh `lp-v2/49`, `50`, `52`).
  - Hồ sơ tạo nhanh từ yêu cầu điền sẵn ngôn ngữ gửi tin `en` (ko/zh/en), `ru` (ru), `vi` (vi), SĐT, liên hệ theo kênh; sau khi lưu DB đúng `preferred_locale` (ảnh `47`).
  - Mở lại 6 báo giá từ **Báo giá & giữ chỗ**: ko/zh/en → English, ru → Русский, vi → Tiếng Việt, câu ghi chú hiện lại (ảnh `51`); hồ sơ có sẵn (`vi`, KR) chọn qua "Hồ sơ có cùng liên hệ" không bị sửa, báo giá vẫn English theo yêu cầu liên kết (ảnh `53`).
  - Phần chặn mới tách riêng: lưu hồ sơ tạo nhanh với kênh Zalo bị 422 → **BUG-R4-011**; quốc tịch lưu `VN` → **BUG-R4-012**. Báo cáo 12.4.

### BUG-R4-009 – Câu báo giá tiếng Anh gửi khách sai số ít/nhiều: "(1 nights), 2 Adults"

- **Mức:** P3 (chữ hướng khách, giọng văn Brand). Có từ trước LP-v2, nhưng nay mọi khách ko/zh nhận bản tiếng Anh này (US-175 AC4).
- **Môi trường:** lượt 2, Desk `20afedff`, báo giá `BG-00001` (1 đêm, 2 người lớn), ngôn ngữ English.
- **Thực tế:** "Room 102 The Fern, 10/11/2026 → 11/11/2026 (**1 nights**), 2 **Adults**." (`sale.quote_text` trong `strings-en.json` cố định `{nights} nights`).
- **Mong đợi:** "1 night" / "2 nights", "2 adults" (chữ thường) – CPY chốt câu, số ít/nhiều theo `n`.
- **Bằng chứng:** ảnh `lp-v2/37`; báo cáo 11.7.
- **Vai:** CPY (chữ) + BE/FE (nơi dựng câu `getQuoteText`).
- **Trạng thái:** **Closed – đã sửa, đã xác nhận** (lượt 3, `0a25716a`).
  - `getQuoteText`: en "(1 night), 1 adult" / "(2 nights), 2 adults" / "(5 nights), 5 adults" / "(21 nights)"; ru "(1 ночь), 1 взрослый" / "(2 ночи), 2 взрослых" / "(5 ночей), 5 взрослых" / "(21 ночь)"; vi "(1 đêm), 1 người lớn"… Báo giá thật từ yêu cầu ko: "(1 night), 2 adults." (ảnh `lp-v2/49`, `52`).
  - Trang khách: ru "1 ночь", "2 ночи" (ảnh `55`); en "1 night" (ảnh `56`), "2 nights"; vi "2 đêm".
  - **Chưa kiểm trên stack:** dòng bill OTA trả trước ("Room charge, 1 night – paid via …") – nhận phòng cần giấy tờ khách chính; chỉ đọc mã `CheckOutPage.tsx` (`Lcount` chọn dạng theo từng ngôn ngữ của bill). Báo cáo 12.6.

### BUG-R4-010 – Sổ tay Desk chưa có hướng dẫn trả lời khách ko/zh/ru (US-175 AC6)

- **Mức:** P3 (tài liệu vận hành). AC Must của gói nhưng không chặn chức năng.
- **Môi trường:** `product/docs/manual/` trên `20afedff` và `main` `3326e343`.
- **Thực tế:** `user-manual-v1.0.md`, `guides/02-le-tan.md`, `guides/05-sale-ctv.md` không có dòng nào về khách tiếng Hàn/Trung/Nga, công cụ dịch, hay bỏ tên/SĐT/email trước khi dán lời nhắn; mục 2.18 "Yêu cầu từ website" vẫn ghi form "đang tắt".
- **Mong đợi:** 3–5 dòng theo AC6 (trả lời bằng tiếng Anh hoặc công cụ dịch; bỏ tên, SĐT, email khi dán; câu hứa thời gian BR-912), SEC duyệt câu về dữ liệu; cập nhật mục 2.18 khi form bật.
- **Bằng chứng:** báo cáo 11.7 (AC6).
- **Vai:** BA (viết) + SEC (duyệt).
- **Trạng thái:** **Mở lại** (lượt 3, đối chiếu `main` `38ced860` với Desk `0a25716a`). Mức giữ **P3**.
  - Đã đạt: `02-le-tan.md` 13.1c, 13.1d, `05-sale-ctv.md` 6.3a, `user-manual-v1.0.md` 2.18 có đủ 6 ý AC6 (sửa 01/11); tên cột "Ngôn ngữ", 5 nhãn, lọc + tổng số, "Ngôn ngữ khách dùng", "Giá ước tính khách đã thấy … – tính lúc …", "Khách chưa thấy giá", "Khớp giá ước tính…", "…không so sánh.", câu "Khách viết bằng tiếng Hàn – gửi tin bằng tiếng Anh." đều đúng chữ Desk; 3 câu mẫu trùng từng chữ CPY `lp-v2-copy.md` (dòng 1106–1135); câu hứa 60 phút / trước 09:00 đúng BR-912 (4); 2.18 đã bỏ "form đang tắt".
  - **Chưa đạt 1 – tên cảnh báo chênh giá.** Sổ tay ghi **"Đã đổi: {cũ} → {mới}"** kèm "Giá Desk tính bây giờ khác số khách đã thấy trên web…" ở `02-le-tan.md` dòng 1015 (bảng 13.1c), 1221 (bảng tra cứu), 1490 (bài tập 11); `05-sale-ctv.md` dòng 273–274; `user-manual-v1.0.md` dòng 1142–1143 (và lịch sử bản 1.6, dòng 1725). Desk `0a25716a` hiện **"Khác giá web khách đã thấy: {cũ} → {mới}"** với câu "Giá theo lịch giá hôm nay khác số khách thấy trên web. Nói rõ lý do với khách khi gửi báo giá." (`webreq.estimate_changed*`, FE3 sửa theo UXD FE-13; ảnh `lp-v2/45`). Lễ tân tìm chữ "Đã đổi" sẽ không thấy.
  - **Chưa đạt 2 – khách tiếng Nga.** Bảng 13.1d dòng "Tiếng Nga" (dòng 1036) và câu dưới bảng chỉ nói ko/zh có câu ghi chú; Desk cũng hiện "Khách viết bằng tiếng Nga – gửi tin bằng tiếng Nga." cho ru (`sale.text_lang_note.ru`; ảnh `52`). Thêm câu này vào bảng (và `05-sale-ctv.md`, `user-manual-v1.0.md` mục tương ứng).
  - Gợi ý (không bắt buộc): 13.1d "Mở lại báo giá cũ mà ô đang là Tiếng Việt: chọn lại…" có thể rút gọn – Desk nay tự mở lại đúng ngôn ngữ; giữ câu "nhìn lại ô trước khi bấm Sao chép" là đủ.
  - Vai: BA (sửa 3 tệp; nếu có bản HTML sổ tay đang phát thì dựng lại). Báo cáo 12.7.

### BUG-R4-011 – Tạo nhanh hồ sơ từ yêu cầu khách chọn Zalo bị 422 `CONTACT_CHANNEL_EMPTY`; chữ lỗi hiện "{channel}"

- **Mức:** P2.
  - Zalo là kênh mặc định của form website. Lượt này 4/5 yêu cầu dùng Zalo, và cả 4 không lưu được hồ sơ tạo nhanh ở lần bấm đầu. Đây là đường chính của US-175 AC4 ý 3 (PO 9.1 B5 – bắt buộc trước phát hành).
  - Có cách vòng: đổi "Liên hệ ưu tiên" về "–" (hoặc "Gọi điện") rồi lưu lại. Nhưng câu lỗi không chỉ ra cách đó, và hồ sơ khi ấy mất kênh khách đã chọn.
  - Không sai tiền, không mất dữ liệu.
- **Môi trường:** lượt 3, stack `ottimo-qalp4`, Desk `0a25716a` (`qa.fd`), 1366 px; yêu cầu `8F1TBJR8` (ko), `JXEV8FYX` (zh), `05E19A2G` (ru), `MP9FMEMT` (vi), cùng kênh Zalo, SĐT giả `+84 900 000 12x`.
- **Các bước:**
  1. Yêu cầu từ website → mở `8F1TBJR8` → **Báo giá** → chọn căn 102.
  2. Ô "Khách đứng tên" gõ "QA Kim Ko" → **Tạo nhanh khách "QA Kim Ko"**.
  3. Hộp **Hồ sơ khách mới** điền sẵn SĐT `+84900000121`, Liên hệ ưu tiên **Zalo**, Ngôn ngữ English → bấm **Lưu hồ sơ**.
- **Thực tế:**
  - `POST /guests` gửi `{"fullName":"QA Kim Ko","preferredLocale":"en","phone":"+84900000121","preferredContact":"zalo",…}` (không có `messagingHandles`) → **422** `{"errors":[{"field":"preferredContact","code":"CONTACT_CHANNEL_EMPTY"}]}`.
  - Hộp hiện "Còn 1 ô cần sửa…" và dưới ô Liên hệ ưu tiên: "Nhập **{channel}** trước khi chọn làm liên hệ ưu tiên." – biến `{channel}` không được thay (ảnh `lp-v2/48`).
  - Gọi thẳng API: `{phone, preferredContact: "zalo"}` → 422; `{phone, preferredContact: "phone"}` → 201; `{phone, messagingHandles: {zalo: phone}, preferredContact: "zalo"}` → 201. Server (`guests.service.ts`: Zalo phải có `messaging_handles.zalo`) và Desk (`GuestFormDialog` coi Zalo dùng ô "Số điện thoại / Zalo", không có ô Zalo riêng) dùng hai luật khác nhau.
  - Yêu cầu WhatsApp (`DT518MDK`) lưu được: Desk điền cả ô WhatsApp nên server thấy `messagingHandles.whatsapp`.
  - Lỗi có từ trước với hồ sơ tạo tay chọn Zalo; `lp-v2-fe4` điền sẵn kênh từ yêu cầu nên nay là **mặc định** cho mọi yêu cầu Zalo. Đường "Tạo đơn" / "Ở dài ngày" từ yêu cầu dùng cùng `GuestPicker` + điền sẵn – nhiều khả năng cùng lỗi (QA chưa chạy).
- **Mong đợi:** hồ sơ tạo nhanh từ yêu cầu Zalo lưu được ở lần bấm đầu, giữ kênh Zalo. Một trong hai (ARC chọn): (a) Desk gửi `messagingHandles.zalo` = SĐT khi chọn Zalo mà chưa có tài khoản Zalo riêng; hoặc (b) server chấp nhận Zalo khi có `phone` (đúng nhãn "Số điện thoại / Zalo"). Câu lỗi từ server phải thay `{channel}` (hoặc dùng câu không có biến). Test chống tái phát: tạo nhanh từ yêu cầu Zalo (ko, en) → 201, `preferredContact = zalo`, `preferredLocale` đúng; tạo tay chọn Zalo chỉ có SĐT → lưu được.
- **Bằng chứng:** ảnh `lp-v2/47`, `48`; báo cáo 12.4.
- **Vai:** FE-B (hộp hồ sơ, điền sẵn, câu lỗi) + BE (luật `CONTACT_CHANNEL_EMPTY`) · ARC chọn (a) hay (b).
- **Trạng thái:** Open.

### BUG-R4-012 – Hồ sơ tạo nhanh từ yêu cầu hiện Quốc tịch "–" nhưng server lưu `VN`

- **Mức:** P3.
  - Hồ sơ khách nước ngoài bị ghi là người Việt (`isForeigner = false`). Sửa hồ sơ sau đó, Desk hiện "Việt Nam" như thể nhân viên đã chọn.
  - Không ảnh hưởng ngôn ngữ tin/bill (bill song ngữ còn theo `preferredLocale ≠ vi` và giấy tờ khai báo), không ảnh hưởng khai báo lưu trú (theo giấy tờ).
  - Đây là phần "quốc tịch để trống thay vì Việt Nam" trong "Mong đợi" của BUG-R3-050.
- **Môi trường:** như BUG-R4-011; hồ sơ `KH-0003`…`KH-0007` (tạo nhanh từ yêu cầu ko/zh/ru/en/vi).
- **Các bước:** tạo nhanh hồ sơ từ một yêu cầu (hộp hiện Quốc tịch "–") → lưu → `GET /guests/{id}`.
- **Thực tế:** Desk không gửi `nationalityCode` khi ô trống (đúng ý FE). Server khởi tạo `nationality_code = 'VN'` khi không có trường này (`guests.service.ts`, giá trị gốc của hồ sơ mới) → API trả `nationalityCode: "VN"`, `isForeigner: false` cho cả 5 hồ sơ, kể cả khách viết tiếng Hàn/Trung/Nga. Gọi thẳng API không gửi quốc tịch cũng ra `VN`.
- **Mong đợi:** hồ sơ tạo nhanh từ yêu cầu website lưu quốc tịch **trống** (`null`), Desk hiện "–" cả khi mở lại; hoặc ARC/DOM chốt quy tắc khác và FE bỏ ô "–" cho khớp. Kiểm ảnh hưởng tới chỗ đang dựa vào `VN` mặc định (BR-009, báo cáo khách nước ngoài).
- **Bằng chứng:** báo cáo 12.4 (cột "Hồ sơ trong DB"); ảnh `lp-v2/47` (hộp hiện "–").
- **Vai:** BE (giá trị mặc định khi tạo) + ARC/DOM (quy tắc quốc tịch trống) · FE-B nếu đổi cách hiện.
- **Trạng thái:** Open. Có thể đi v1.0.1 cùng BUG-R3-050 nếu PO chấp nhận.

### BUG-R4-013 – `validate-fixtures` đỏ: oracle `br-examples.json` lệch BR v0.5.x; `main` vẫn xanh vì cache turbo không theo dõi BR/ESC

- **Mức:** P2.
  - Không ảnh hưởng sản phẩm đang chạy. Nhưng oracle giá (bộ ví dụ số dùng để kiểm bộ tính giá) đang lệch với BR đúng lúc bảng giá vừa đổi (INV 01/11, ESC-045), và BR-115/116 mới chưa có dòng oracle.
  - CI của mọi PR đụng `product/tests/` sẽ đỏ (PR #21 là PR đầu tiên gặp), còn `main` báo xanh giả. QC không nên nhận "CI xanh" của `main` làm bằng chứng cho phần fixture khi lỗi này còn mở.
- **Môi trường:** GitHub Actions run `41313291275` (PR #21, merge với `main` @ `cfbbe3d4`), job "format · lint · audit · test · build", bước "Test (Vitest, real PostgreSQL)". Tái hiện tại máy: `node product/tests/tools/validate-fixtures.mjs` trên `5474b6e1` → 31 lỗi; trên `main` @ `cfbbe3d4` → 32 lỗi.
- **Các bước:** sửa bất kỳ tệp nào trong `product/tests/` (để turbo mất cache `@ottimo/tests:test`) → chạy CI; hoặc chạy thẳng validator.
- **Thực tế:**
  - 30 lỗi "nhãn INV-004/INV-005/INV-036 nhưng BR ghi 'Bảng giá: INV 01/11…'" (BR-101-01…14, BR-103-01…03, BR-201-01, BR-202-01/02, BR-203-01/02, BR-204-01/02, BR-206-01, BR-207-01, BR-208-01…03) và "nhãn GIẢ ĐỊNH nhưng BR ghi 'Tính lẻ theo ngày: INV quyết ESC-045…'" (BR-210-01).
  - 2 lỗi "BR-115 / BR-116 có ví dụ số trong BR nhưng chưa có dòng oracle hay lý do notCovered".
  - CI `main` @ `0e4ca928` (đã có BR v0.5.0) và @ `cfbbe3d4` (BR v0.5.1) báo job test **success**: `turbo.json` task `test` không khai `inputs`, nên `@ottimo/tests:test` được "cache hit" khi chỉ `docs/business-rules.md` hay `02-escalations/` đổi – validator không chạy lại.
- **Mong đợi:** validator 0 lỗi trên `main`; đổi BR/ESC thì task test của `@ottimo/tests` chạy lại.
- **Bằng chứng:** log run `41313291275` (dòng "cache miss, executing 1b3ff81f3887e791" chỉ ở `@ottimo/tests:test`, "32 lỗi"); `rounds/round-04/qa/pr21-notice-2026-10-31.md` mục 5.
- **Vai:** QA (cập nhật nhãn oracle theo BR v0.5.1, thêm dòng hoặc `notCovered` cho BR-115/116) + DOM (xác nhận nhãn và ví dụ số BR-1xx/2xx sau ESC-045) + OPS (thêm `inputs` cho task `test` của `@ottimo/tests`, ví dụ `$TURBO_DEFAULT$`, `../docs/business-rules.md`, `../../02-escalations/ESC-*.md`).
- **Trạng thái:** Open. Chặn "CI xanh" của PR #21 (nội dung PR #21 không gây ra lỗi này).
  - *PR #22 (01/11):* `test:fixtures` trên `v1.0.2-ed` @ `99734cda` cũng ra đúng 32 lỗi này, **0 lỗi ở BR-428**. `business-rules.md` của nhánh trùng `main`; `br-examples.json` chỉ khác ở chỗ bỏ `pendingFix` BR-428-08/09. Đây là nguyên nhân của ARC FB-R4-ARC-BE-A-ED-01 (CI PR #22 đỏ).

### BUG-R4-014 – Desk mở "Trả sớm" (B16) cho đơn dài hạn và hiện chính sách BR-428 ("không hoàn, phí 0 đ"), không nhắc BR-313 v0.5.1 mất ký quỹ

- **Mức:** P2.
  - Desk đưa cho lễ tân thông tin chính sách sai khi khách thuê tháng trả phòng trước hạn: hộp bắt tích "Đã báo khách số hoàn và phí trả phòng sớm" sau khi hiện "Không có khoản hoàn · Phí 0 đ". Theo BR-313 v0.5.1 (INV quyết ESC-045 câu 4, 01/11), khách **mất toàn bộ ký quỹ** và tiền thuê tháng lịch chưa bắt đầu được hoàn.
  - Tiền trong app không sai: đêm thuê của đơn nhập tay không mang tiền, nên B16 ra 0/0; ký quỹ giữ ngoài app. Có cách vòng: lễ tân nắm BR-313 và tự báo khách.
  - Lỗi mới về đường đi: trước PR #22, Desk không có nút B16 (API có từ v1.0.0). PR này đưa nút tới mọi đơn đang ở.
- **Môi trường:** stack thử `ottimo-qapr22`, `v1.0.2-ed` @ `99734cda`, DS-E. Desk `http://127.0.0.1:58521` (`qa.fdl`), giờ thật 01/11/2026. Đơn OTM-00019 (căn 302, 01/11/2026 → 01/02/2027, `manualLongStay` 12.500.000/tháng, ký quỹ ngoài app 12.500.000, HĐ giấy `QA-HD-003`). Đơn OTM-00008 (căn 402, dùng đồng hồ giả).
- **Các bước:**
  1. Tạo đơn dài hạn nhập tay (`POST /reservations` có `manualLongStay`), thu tiền thuê tháng 1, nhận phòng.
  2. Desk → Đơn đặt phòng → mở OTM-00019. Ngăn kéo có nhãn "Hợp đồng dài hạn · HĐ ngoài hệ thống – sẽ chuyển vào app" → bấm **Trả sớm**.
  3. Ngày rời mới 01/12/2026 → **Xem trước số tiền**.
- **Thực tế:**
  - Hộp hiện 62 dòng đêm "Chính sách OTTIMO · 0", "Cơ sở … 0", "Báo trước 30 ngày", "Phần hoàn theo chính sách trả sớm 0", "Sẽ xin hoàn cho khách – Không có khoản hoàn. 0 đ", "Phí trả phòng sớm (ghi vào folio) 0 đ", rồi ô tích "Đã báo khách số hoàn và phí trả phòng sớm" và nút "Xác nhận trả sớm". Không có câu nào về ký quỹ hay HĐ.
  - API: `allowedActions` của đơn dài hạn có `early_departure`. Tính thử OTM-00008 (rời 20/11, đơn tới 20/12): 200, `noticeDays` 30, 30 đêm `netVnd` 0, hoàn 0, phí 0. Ghi thật: 200, ngày đi đổi thành 20/11, nhật ký ghi "BR-428 notice 30d".
  - Mã: `allowed-actions.ts` `earlyDepartureOpen` và `StayService.earlyDeparture` không xét `stayType = long` / `externalContract`.
- **Mong đợi:** PO/DOM chọn một trong hai, rồi FE-A (và BE-A nếu chọn chặn) làm:
  - (a) Không mở B16 cho đơn dài hạn (`allowedActions` bỏ `early_departure` khi `stayType = long`, server 409). Kết thúc sớm HĐ tháng đi đường khác, ví dụ đổi ngày đi có ghi chú BR-313, cho tới khi có hợp đồng trong app (H9 / v1.1 – ARC FB-03).
  - (b) Giữ B16 để mở bán lại đêm, nhưng với đơn dài hạn thì hộp thay khối "Cách tính BR-428" bằng câu BR-313: "Khách thuê tháng trả trước hạn HĐ: mất toàn bộ ký quỹ ({depositHeldVnd} – giữ ngoài app), tiền thuê tháng lịch chưa bắt đầu được hoàn, không truy thu giảm giá kỳ hạn"; bỏ chữ "Phí trả phòng sớm" và "báo trước N ngày" theo BR-428.
  - Test chống tái phát: đơn `manualLongStay` đang ở → (a) `allowedActions` không có `early_departure`, gọi B16 → 409; hoặc (b) hộp có câu BR-313 và không có dòng "Phần hoàn theo chính sách trả sớm".
- **Bằng chứng:** báo cáo `rounds/round-04/qa/pr22-v1.0.2-ed.md` mục 4 (chữ hộp đọc từ DOM, kết quả API).
- **Vai:** PO + DOM (chọn (a)/(b), câu chữ BR-313) · FE-A (hộp/nút) · BE-A (nếu (a): `allowedActions` + chặn server) · UXD (chữ).
- **Trạng thái:** Open. Không chặn tiền; QC quyết có gộp PR #22 với điều kiện sửa ở bản kế tiếp hay không. INV chưa vận hành và Desk v1.0 không có HĐ tháng trong app.

### BUG-R4-015 – Hủy giá hẹn đầu tiên của căn có `activeFrom` tương lai làm căn không có giá cho tới dòng sau (báo giá 422 `roomId NOT_IN_LIST`)

- **Mức:** P3.
  - Ca biên: căn mới tạo với `activeFrom` tương lai, OWN/MGR thêm một dòng giá hẹn sau đó, rồi hủy dòng đầu. Không sai tiền.
  - Hậu quả: căn không bán, không báo giá được trong khoảng trống, và chữ lỗi không nói lý do. Desk không cảnh báo trước khi hủy.
  - Có cách vòng: lên lịch lại giá ở `activeFrom`.
- **Môi trường:** stack thử `ottimo-qapr22`, `v1.0.2-ed` @ `99734cda`, đồng hồ giả 24/12/2026, `qa.owner`.
- **Các bước:**
  1. `POST /rooms` căn 501, `activeFrom` 2026-12-30, giá tháng 10.000.000. Căn có đúng 1 dòng giá, là dòng hẹn 30/12.
  2. `cancel-scheduled` 30/12 → 409 `only_price` (đúng).
  3. `PATCH /rooms/{501}` `listPrice` từ 2027-01-10 (917.000 · 11.000.000).
  4. `cancel-scheduled` 30/12 → **200**.
  5. `calculateQuote` căn 501 từ 02/01/2027 2 đêm, hoặc 08/01 4 đêm.
- **Thực tế:**
  - Bước 4 cho hủy. Căn còn một dòng 10/01/2027; `currentListPrice` null từ 30/12 tới 09/01.
  - Bước 5 → 422 `errors[{field: roomId, code: NOT_IN_LIST}]`. Báo giá từ 11/01 → 200 (1.834.000).
  - Lên lịch lại dòng 30/12 → báo giá 02/01 → 200 (1.791.000).
- **Mong đợi:** không hủy được dòng giá đang phủ ngày `activeFrom` của căn, tức dòng có `effective_from` nhỏ nhất khi `effective_from` ≤ ngày đầu căn bán. Trả 409 `INVALID_TRANSITION` với `currentState` riêng (ví dụ `first_price`) hoặc mở rộng `only_price`. Desk hiện câu như ca `only_price`. ARC chốt mã.
  - Nên gộp với ARC FB-R4-ARC-BE-A-ED-02: trigger DB trên `room_list_price` cũng chặn khi đó là dòng đầu của căn.
  - Test chống tái phát: các bước 1–4 ở trên, bước 4 phải trả 409.
- **Bằng chứng:** báo cáo `rounds/round-04/qa/pr22-v1.0.2-ed.md` mục 3 (dòng "Căn tạo với `activeFrom` 30/12").
- **Vai:** BE-A (luật hủy) + ARC (mã lỗi, hợp đồng 0.3.10) · FE-A (chữ lỗi nếu có mã mới).
- **Trạng thái:** Open. Đề xuất đích v1.0.3 cùng FB-R4-ARC-BE-A-ED-02, không chặn PR #22.

## 3. Ghi nhận (không phải lỗi)

- Trong ~1 giây đầu khi một IP dồn lượt, 30 lượt hợp lệ đầu tiên của IP đó có thể làm khách khác nhận 503 (bộ đếm chung 10/giây). Sau lượt 30 thì không còn. Đây là rủi ro PE-RR4 SEC đã chấp nhận (báo cáo 4.1).
- Desk S35 cột "Hạng phòng" hiện slug (`standard-studio-garden-view`) vì nhãn = `publicRoomType`. Đây là hành vi US-155 có từ trước, không thuộc LP-v2; UXD xem có cần nhãn đẹp hơn. *Lượt 2:* khi căn mang nhãn (gán bằng ô Desk mới) cột hiện "Standard Studio · Garden View" – hết vấn đề.
- *Lượt 2:* API `updateRoom` nhận `publicRoomType` tự do (QA đặt được `qa-test-type`, web tính giá cho hạng đó ngay). Đúng hợp đồng, chỉ OWN gọi được, Desk khóa bằng danh sách – ARC cân nhắc kiểm danh sách phía server (Suggestion).
- *Lượt 2:* ảnh FE `lp-v2-fe2-*` dùng SĐT mock `+84 905 123 456` – đúng định dạng số thật. Không vi phạm (dữ liệu mock ghi "test-only"), nhưng nên đổi mock sang dải `+84 900 000 xxx` như DS-E (Suggestion cho FE).
- `state/privacy-notice.log`: dòng NOTICE thứ 2 trở đi không thụt lề. Thẩm mỹ, `deploy-landing` vẫn đọc đúng.
- *Lượt 3:* mở lại báo giá từ **Báo giá & giữ chỗ**, Desk lấy chữ tiếng Việt trước (`text?locale=vi`) rồi đổi sang English/Русский trong dưới 1 giây. Khung chữ chớp một lần; nhân viên bấm "Sao chép" ngay lập tức có thể chép bản tiếng Việt. Gợi ý FE: chờ biết ngôn ngữ rồi mới gọi chữ.
- *Lượt 3:* giới hạn gửi form theo IP nằm trong bảng `rate_limit_counter` (không mất khi khởi động lại api). Khi bộ đếm đầy, form vẫn gửi được nhưng không mang giá ước tính → Desk "Khách chưa thấy giá" – đúng US-131 AC9.
- *Lượt 3:* bảng S35 ở 1366 px vẫn cuộn ngang trong khung (1215/1084 px; cột Ngôn ngữ 93 px) – UXD xác nhận bố cục (FE đã nêu). Xem BUG-R4-007.
- *PR #22:* hộp "Trả sớm" lấy giờ máy trình duyệt cho ô "Khách báo lúc" (giá trị mặc định và `max`). Trên stack dùng đồng hồ giả (server 24/12, trình duyệt 01/11), hộp ra "báo trước 54 ngày", đòi bằng chứng giờ báo và không chọn được ngày nghiệp vụ của server. Production không gặp. Nếu E2E Desk chạy với đồng hồ giả, FE-A nên lấy "bây giờ" từ server (ví dụ header `Date` hoặc `Me`). Gợi ý, không phải lỗi.
- *PR #22:* đơn Trực tiếp báo cùng ngày (0 ngày) ghi dòng phí `noticeDays: 0`, nên bill hiện "Phí trả phòng sớm (báo trước 0 ngày)". Đúng BR-428-09 theo chữ. UXD xem có muốn câu "báo cùng ngày" không.
- *PR #22:* bộ Vitest api trên máy QA: 3334 đạt, 24 bỏ qua. BE báo 19 bỏ qua; 5 ca chênh là ca bootstrap cần `BOOTSTRAP_DATABASE_URL`, QA không đặt biến này.
