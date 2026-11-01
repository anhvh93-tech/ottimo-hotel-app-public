# Danh sách lỗi – Round 4

- Tác giả: QA | Mở: 01/11/2026 – gói LP-v2, bước Kiểm thử trên `origin/lp-v2` @ `83c13990` (`lp-v2-be` 6ae46d4a + `lp-v2-fe` a72bcbfc + `lp-v2-ops` 74e23925).
- Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8. Lỗi tồn R3: `rounds/round-03/qa/bug-list.md` (không chép lại).
- Mã: `BUG-R4-xxx`. Nếu luồng QA khác của Round 4 (v1.0.1, hotfix bảng giá H1–H9) mở tệp này cùng lúc, ORC gộp và cấp lại số liên tiếp khi merge.
- Môi trường chung: stack thử `ottimo-qalp2` (compose dev + `Caddyfile.landing` thật, `LANDING_PUBLIC_API=on`, `LANDING_LOCALES=en,vi,ko,zh,ru`), DS-E, bảng giá 01/11 nhập như "ngày chuyển S" của DOM. Chi tiết: `rounds/round-04/qa/lp-v2-test-report.md` mục 1. Chỉ dữ liệu giả.
- **Cập nhật lượt 2** (01/11 15:50–16:25, `origin/lp-v2` @ `20afedff` = `83c13990` + `lp-v2-be2` 7d9e306f + `lp-v2-fe2` c9372e52 + `lp-v2-ops2` 0185a935; stack thử `ottimo-qalp3`, hạng công khai gán qua API/Desk OWN): BUG-R4-002, 003, 004, 005 **đã sửa – đã xác nhận**; BUG-R4-001 **mở lại**; mới BUG-R4-006…010. Chi tiết: báo cáo mục 11.

## 1. Tổng hợp (sau lượt 2)

| Mức | Số lỗi | Open | Fixed (chờ QA) | Closed (đã xác nhận) |
|---|---|---|---|---|
| P0 | 0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 | 0 |
| P2 | 4 | 1 (BUG-R4-001 – mở lại) | 0 | 3 (BUG-R4-002, 003, 004) |
| P3 | 6 | 5 (BUG-R4-006, 007, 008, 009, 010) | 0 | 1 (BUG-R4-005) |
| **Tổng** | **10** | **6** | **0** | **4** |

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
- **Trạng thái:** **Mở lại** (lượt 2, `20afedff`, 01/11 16:15). Mức giữ **P2**.
  - Đã đạt (`lp-v2-fe2` c9372e52): ngăn chi tiết hiện "Giá ước tính khách đã thấy: 800.000 đ – tính lúc 01/11/2026 16:07" (ko/zh/ru) và "Khách chưa thấy giá" (yêu cầu theo tháng) – ảnh `lp-v2/33`, `34`.
  - **Chưa đạt – "Đã đổi" không hiện trên dữ liệu thật.** Các bước: (1) OWN gán hạng công khai bằng ô mới trên Desk (giá trị lưu là **nhãn** "Standard Studio · Garden View", như production `production-defaults.ts`); (2) khách gửi từ `/ko/` Garden, 2 người lớn, 10→11/11, thấy 800.000 (`AKKNTH8R`); (3) OWN đổi giá đêm 4 căn Garden thành 870.000 từ 10/11; (4) lễ tân mở yêu cầu → **Báo giá** → căn 102.
  - Thực tế: tổng 870.000, dòng dưới ghi "Khách đã thấy 800.000 đ cho ngày, số khách **hoặc hạng phòng khác** – không so sánh"; không có "Đã đổi: 800.000 → 870.000" (ảnh `lp-v2/35`). Trước khi đổi giá cũng ra "không so sánh" thay vì "Khớp…". Cùng kết quả với `C9GXC214` (zh, căn 202), `DDYRBQA3` (ru, căn 203).
  - Đối chứng: đặt tạm căn 103 = slug `standard-studio-garden-view` → báo giá căn 103 hiện đúng "Đã đổi: 800.000 đ → 870.000 đ" (ảnh `lp-v2/36`).
  - Nguyên nhân: `apps/admin-web/src/pages/webreq/labels.ts` `compareWithSeen` so `q.publicRoomType === seen.roomType` – nhãn của căn với **slug** web (`priceEstimate.roomType`). Hợp đồng 0.3.10 bổ sung 3: `Room.publicRoomType` là nhãn, web dùng slug của nhãn. Test `r4-lp-v2-fea.test.tsx` và ảnh FE dùng mock hạng dạng slug nên không bắt được.
  - Mong đợi / đề xuất sửa: so **slug của nhãn** (cùng hàm slug landing/BE dùng – ví dụ "Premium · One Bedroom + 1" → `premium-one-bedroom-1`) với `seen.roomType`; hoặc server trả sẵn slug của căn. Thêm test chống tái phát: căn có `publicRoomType` = "Standard Studio · Garden View", `seen.roomType` = `standard-studio-garden-view`, cùng ngày/số khách, tổng khác → `changed`; tổng bằng → `same`; nhãn hạng khác → `other`.
  - Vai: FE-A.

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
- **Trạng thái:** Open.

### BUG-R4-007 – S35 danh sách không có cột/lọc ngôn ngữ; không có báo cáo/xuất → INV không đếm khách theo ngôn ngữ (US-175 AC3 "danh sách", AC5)

- **Mức:** P3. Lễ tân vẫn thấy ngôn ngữ khi mở từng yêu cầu; dữ liệu có ở API. Nhưng AC3 đòi nhãn ở **danh sách và chi tiết**, AC5 đòi đếm được theo 5 ngôn ngữ.
- **Môi trường:** lượt 2, Desk `20afedff` (`qa.fd`), 4 yêu cầu ko/zh/ru/zh.
- **Các bước:** Desk → Yêu cầu từ website → xem bảng; tìm chỗ xuất/báo cáo yêu cầu website.
- **Thực tế:** bảng có Mã, Gửi lúc, Ngày ở, Số khách, Hạng phòng, Trả lời qua, Nguồn, Hạn trả lời, Cần xem, Người xử lý, Trạng thái – **không có** "Ngôn ngữ", không có bộ lọc theo ngôn ngữ (ảnh `lp-v2/41`). Không có xuất CSV/báo cáo nào cho yêu cầu website (`admin-web` không có chức năng xuất; module `reporting` không đọc bảng này). API `listWebsiteBookingRequests` có `locale` (đã thấy `ko`, `zh`, `ru`).
- **Mong đợi:** cột "Ngôn ngữ" (nhãn tiếng Việt như ngăn chi tiết) ở danh sách S35, có lọc hoặc đếm theo ngôn ngữ; hoặc PO sửa AC5 (ví dụ "đếm bằng lọc S35" hay dời sang báo cáo R5).
- **Bằng chứng:** báo cáo 11.5, 11.7 (AC5); ảnh `lp-v2/41`.
- **Vai:** FE-A (+ UXD bố cục cột) · PO quyết phạm vi AC5.
- **Trạng thái:** Open.

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
- **Trạng thái:** Open.

### BUG-R4-009 – Câu báo giá tiếng Anh gửi khách sai số ít/nhiều: "(1 nights), 2 Adults"

- **Mức:** P3 (chữ hướng khách, giọng văn Brand). Có từ trước LP-v2, nhưng nay mọi khách ko/zh nhận bản tiếng Anh này (US-175 AC4).
- **Môi trường:** lượt 2, Desk `20afedff`, báo giá `BG-00001` (1 đêm, 2 người lớn), ngôn ngữ English.
- **Thực tế:** "Room 102 The Fern, 10/11/2026 → 11/11/2026 (**1 nights**), 2 **Adults**." (`sale.quote_text` trong `strings-en.json` cố định `{nights} nights`).
- **Mong đợi:** "1 night" / "2 nights", "2 adults" (chữ thường) – CPY chốt câu, số ít/nhiều theo `n`.
- **Bằng chứng:** ảnh `lp-v2/37`; báo cáo 11.7.
- **Vai:** CPY (chữ) + BE/FE (nơi dựng câu `getQuoteText`).
- **Trạng thái:** Open.

### BUG-R4-010 – Sổ tay Desk chưa có hướng dẫn trả lời khách ko/zh/ru (US-175 AC6)

- **Mức:** P3 (tài liệu vận hành). AC Must của gói nhưng không chặn chức năng.
- **Môi trường:** `product/docs/manual/` trên `20afedff` và `main` `3326e343`.
- **Thực tế:** `user-manual-v1.0.md`, `guides/02-le-tan.md`, `guides/05-sale-ctv.md` không có dòng nào về khách tiếng Hàn/Trung/Nga, công cụ dịch, hay bỏ tên/SĐT/email trước khi dán lời nhắn; mục 2.18 "Yêu cầu từ website" vẫn ghi form "đang tắt".
- **Mong đợi:** 3–5 dòng theo AC6 (trả lời bằng tiếng Anh hoặc công cụ dịch; bỏ tên, SĐT, email khi dán; câu hứa thời gian BR-912), SEC duyệt câu về dữ liệu; cập nhật mục 2.18 khi form bật.
- **Bằng chứng:** báo cáo 11.7 (AC6).
- **Vai:** BA (viết) + SEC (duyệt).
- **Trạng thái:** Open.

## 3. Ghi nhận (không phải lỗi)

- Trong ~1 giây đầu khi một IP dồn lượt, 30 lượt hợp lệ đầu tiên của IP đó có thể làm khách khác nhận 503 (bộ đếm chung 10/giây). Sau lượt 30 thì không còn. Đây là rủi ro PE-RR4 SEC đã chấp nhận (báo cáo 4.1).
- Desk S35 cột "Hạng phòng" hiện slug (`standard-studio-garden-view`) vì nhãn = `publicRoomType`. Đây là hành vi US-155 có từ trước, không thuộc LP-v2; UXD xem có cần nhãn đẹp hơn. *Lượt 2:* khi căn mang nhãn (gán bằng ô Desk mới) cột hiện "Standard Studio · Garden View" – hết vấn đề.
- *Lượt 2:* API `updateRoom` nhận `publicRoomType` tự do (QA đặt được `qa-test-type`, web tính giá cho hạng đó ngay). Đúng hợp đồng, chỉ OWN gọi được, Desk khóa bằng danh sách – ARC cân nhắc kiểm danh sách phía server (Suggestion).
- *Lượt 2:* ảnh FE `lp-v2-fe2-*` dùng SĐT mock `+84 905 123 456` – đúng định dạng số thật. Không vi phạm (dữ liệu mock ghi "test-only"), nhưng nên đổi mock sang dải `+84 900 000 xxx` như DS-E (Suggestion cho FE).
- `state/privacy-notice.log`: dòng NOTICE thứ 2 trở đi không thụt lề. Thẩm mỹ, `deploy-landing` vẫn đọc đúng.
