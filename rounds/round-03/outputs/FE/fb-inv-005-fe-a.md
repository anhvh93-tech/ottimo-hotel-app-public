# FE-A – FB-INV-005 gói D-min: giá đêm nhập độc lập trên ngăn kéo căn

- Vai: FE-A (Desk) | Round 3 – Phản hồi & sửa | Ngày: 26/10/2026
- Đầu vào: `04-investor-feedback/FB-INV-005.md`, `rounds/round-03/outputs/DOM/fb-inv-005.md` (§4.1–4.2), BR v0.4.7 BR-101 (main `0e800d2`), ESC-036 A.
- Hạn: trước B2 sáng 28/10 (OWN nhập giá thật 10 căn).

## Đã làm gì
1. `RoomDrawer` (H04 4.2): ô **Giá đêm niêm yết** nhập được như ô giá tháng (định dạng VND khi rời ô, `parseVnd`), điền sẵn giá đêm hiện hành; căn chưa có giá thì để trống. **Bỏ mọi tự tính ÷ 12** ở client (xóa `nightlyFromMonthly`); gõ giá tháng không đổi giá đêm và ngược lại.
2. Đổi một trong hai ô → hiện ngày hiệu lực + lý do; PATCH `/rooms/{id}` gửi `listPrice` **đủ** `monthlyListPriceVnd` + `nightlyListPriceVnd` + `effectiveFrom` + `reason` (Desk không bao giờ chạm nhánh ÷ `night_from_month_divisor` của server).
3. Kiểm tại ô giá đêm (khóa lỗi `listPrice.nightlyListPriceVnd`, lỗi 422 từ server cũng hiện đúng ô): rỗng / 0 / không phải số → "Nhập số tiền lớn hơn 0."; không chia hết 1.000 → "Nhập số tròn nghìn, ví dụ 650.000." (BR-005).
4. **Cảnh báo mềm, không chặn** (BR-101 (4)): giá đêm × 30 < giá tháng → khung cảnh báo trong mục Giá niêm yết, nêu giá tháng ÷ 30 (làm tròn 1.000 để đọc). Ví dụ BR: 260.000 với 8.000.000 → cảnh báo, vẫn lưu.
5. Chữ (qua `design/tools/gen_strings.py`, sinh lại `copy/strings-*.json`, `strings-tables.md`, `wireframes/assets/strings.js`; đồng bộ 2 dòng bảng trong `content-guide.md`):
   - `rooms.night_auto` (chữ phụ dưới ô giá đêm): "Giá đêm ngày thường, kênh Trực tiếp, đã gồm VAT. Cuối tuần +15 %, ngày lễ +30 % tự cộng theo lịch giá." / "Weekday night, Direct channel, VAT included. Weekends +15% and holidays +30% are added by the rate calendar."
   - `rooms.footnote`: "Giá tháng và giá đêm nhập riêng (BR-101). Đổi giá có ngày hiệu lực; …" / "Monthly and nightly prices are entered separately (BR-101). …"
   - Mới: `field_error.multiple_of_1000`, `rooms.night_low`.
6. Mock MSW: seed 10 căn có giá đêm riêng (giữ số khởi tạo BR-101: 667.000, 750.000 …); PATCH lưu đúng giá đêm gửi lên, kiểm `nightlyListPriceVnd` > 0; nhánh ÷ 12 chỉ còn khi thiếu trường (giống đường tạm BR-101 (5) của server).
7. CSS: `.g-2.top` (app.css) để hai ô giá thẳng hàng trên cùng khi chỉ một ô có chữ phụ.

## Kiểm thử
- Vitest `rooms.test.tsx`: 1 test sửa + 5 test mới – đổi giá tháng không ghi đè giá đêm + PATCH gửi đúng 2 trường; nhập giá đêm riêng lưu đúng số; lỗi rỗng / 0 / 650.500; cảnh báo 260.000 vẫn lưu; không cảnh báo ở 267.000, có ở 266.000; 422 server hiện tại ô giá đêm.
- admin-web: 60 file, 630 test đạt; @ottimo/ui, @ottimo/i18n đạt. `tsc --noEmit` sạch; eslint 0 lỗi (1 cảnh báo cũ ở `public/mockServiceWorker.js`); prettier sạch.
- Ảnh (dev server + MSW, 1366 px): `rounds/round-03/outputs/FE/fb-inv-005-shots/` – 01 ngăn kéo hai ô giá, 02 nhập giá đêm 650.000, 03 cảnh báo mềm 260.000, 04 lỗi 650.500, 05 bảng sau khi lưu (101: 8.000.000 · 650.000), 06 bản EN.

## File tạo/sửa
- `product/apps/admin-web/src/pages/RoomDrawer.tsx`, `src/app/money.ts`, `src/mocks/seed.ts`, `src/mocks/handlers.ts`, `src/__tests__/rooms.test.tsx`
- `product/packages/ui/src/styles/app.css`
- `product/design/tools/gen_strings.py`, `product/design/copy/strings-vi.json`, `strings-en.json`, `product/design/tools/strings-tables.md`, `product/design/wireframes/assets/strings.js`, `product/design/content-guide.md`
- `rounds/round-03/outputs/FE/fb-inv-005-shots/*.png`, báo cáo này

## Giả định
- Chỉ ô giá đêm kiểm bội 1.000 ở client (theo giao việc); ô giá tháng giữ kiểm cũ (> 0). Server chưa kiểm bội 1.000 cho cả hai (v1.0.1).
- Câu "+15 % / +30 %" ghi cứng theo tham số hiện hành (BR-104, ESC-036 A); đổi tham số lịch giá thì phải sửa chữ.
- RU chưa dịch 4 chuỗi (Desk R3 vẫn rơi về EN như các chuỗi `rooms.*` khác).

## Rủi ro / việc chưa xong
- **UXD duyệt chữ** 4 chuỗi (đánh dấu "chờ UXD duyệt" trong `gen_strings.py`); hi-fi `design/hifi/04-rooms.html` vẫn vẽ ô giá đêm `readonly` + chữ cũ – UXD sửa.
- QA: e2e API `tests/e2e/serial/platform-mutations.serial.spec.ts` (~169–210) vẫn kiểm đường ÷ 12 không gửi giá đêm – còn đúng với server hiện tại (đường tạm), nhưng nên thêm ca có giá đêm riêng (DOM §4.4).
- Cần 1 lượt build rc + deploy production trong 27/10 để kịp B2.

## Bổ sung 27/10 – BUG-R3-018 (P2): giá đã lên lịch trên ngăn kéo căn

**Đã làm (phần FE làm được với hợp đồng 0.3.8):**
- Gõ lại đúng giá đang dùng không còn làm ẩn ô "Hiệu lực từ" và "Lý do đổi giá". Hai ô hiện ngay khi chủ đầu tư gõ vào ô giá.
- Giá trùng giá đang dùng + ngày hiệu lực **sau hôm nay** (ngày nghiệp vụ) = một thay đổi thật: nút Lưu mở, gửi `listPrice` cho ngày đó. `rooms.service.writePrice` ghi `ON CONFLICT (room_id, effective_from) DO UPDATE`, nên dòng giá nhầm đã lên lịch đúng ngày đó bị thay. Đây đúng là đường vòng QA đã làm bằng API, nay làm được trên Desk.
- Giá trùng + ngày = hôm nay: không có gì để lưu, nút Lưu vẫn khóa. Chữ phụ dưới ô ngày hướng dẫn chọn đúng ngày hiệu lực của giá cần thay.
- Chỉ ghi lý do mà giá không đổi thì không mở nút Lưu nữa. Trước đây bấm được nhưng PATCH không có `listPrice`, trông như đã lưu giá.
- Lưu giá có ngày hiệu lực sau hôm nay thì toast ghi rõ ngày áp dụng ("Đã lưu căn 102. Giá áp dụng từ 27/10/2026."), vì bảng vẫn hiện giá hôm nay đến ngày đó.
- Thêm 3 chuỗi mới (`rooms.price_same_today`, `rooms.price_same_future`, `rooms.saved_scheduled`) qua `gen_strings.py`. Chuỗi đã đánh dấu chờ UXD duyệt.
- Mock MSW: `db.scheduledListPrices` ghi dòng tương lai theo đúng luật upsert của server. Dòng này không trả ra GET, giống hợp đồng.

**Chưa làm – cần BE/ARC (đã báo ORC):** hiện danh sách giá đã lên lịch (ngày, giá tháng, giá đêm, người, lý do) trong ngăn kéo. `Room` 0.3.8 chỉ có `currentListPrice` (dòng `effective_from <= hôm nay`), và không có endpoint đọc hay hủy dòng `room_list_price` tương lai. Không suy ra từ `audit-events`, vì nhật ký không lọc theo căn, có phân trang theo ngày ghi, và không phản ánh dòng do `createRoom`/import tạo. Đề xuất hợp đồng (0.3.9, cộng thêm, không phá vỡ):
- `Room.scheduledListPrices[]` (x-visible-to owner, manager): `{effectiveFrom, monthlyListPriceVnd, nightlyListPriceVnd, changedBy, changedAt, reason}`, các dòng `effective_from > ctx.today`, sắp tăng dần. BE-A chỉ thêm 1 truy vấn trong `rooms.service` (`list`/`loadRoom`).
- Tùy chọn: `POST /rooms/{roomId}/list-prices/{effectiveFrom}/actions/cancel-scheduled` (If-Match, lý do, audit `room.list_price_cancelled`), giống `parameters/{key}/actions/cancel-scheduled`. Desk khi đó thêm nút "Hủy lịch giá này" cho từng dòng.

**Kiểm thử:** `rooms.test.tsx` thêm 2 ca, mô phỏng kịch bản QA rc.2 mục 13 trên căn 101:
- Ca 1: lên lịch 700.000 cho ngày mai, toast báo ngày, bảng vẫn hiện 667.000. Gõ lại 667.000 hôm nay thì Lưu khóa và có chữ hướng dẫn; ghi lý do vẫn khóa. Đổi sang ngày mai thì Lưu mở, PATCH đúng `listPrice`, dòng lên lịch của mock bị thay (chỉ còn 1 dòng, 667.000).
- Ca 2: không chạm giá thì ô ngày ẩn; sửa tên căn vẫn lưu được, không gửi `listPrice`.

Kết quả: admin-web 60 file / **632/632** đạt; `tsc --noEmit`, eslint, prettier sạch; `@ottimo/i18n` 19/19.

**File sửa:** `product/apps/admin-web/src/pages/RoomDrawer.tsx`, `src/mocks/handlers.ts`, `src/__tests__/rooms.test.tsx`; `product/design/tools/gen_strings.py` và các file sinh ra (`design/copy/strings-vi.json`, `strings-en.json`, `design/tools/strings-tables.md`, `design/wireframes/assets/strings.js`).
