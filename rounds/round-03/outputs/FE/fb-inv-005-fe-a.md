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
