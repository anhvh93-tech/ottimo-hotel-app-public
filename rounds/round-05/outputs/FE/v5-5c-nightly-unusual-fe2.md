# FE-2 – v1.0.5 V5-5C `r5-fe-v5-5c`: Desk đọc `NIGHTLY_PRICE_UNUSUAL` (hai biên giá đêm)

- Người viết: FE-2 | Round 5 – bước **Sản xuất** | 07/11/2026
- Nhánh: `r5-fe-v5-5c` cắt từ `origin/main` @ `64d49730`. **Gộp sau #121** (máy chủ `r5-c1`: `NIGHTLY_PRICE_UNUSUAL` trong `warnings[]`, `nightlyListPriceVnd` bắt buộc).
- Căn cứ: PO quyết định 27, plan 4a T10; DOM FB-R5-DOM-FE-121-01; UXD `copy-v1.0.5.md` 9.3; OpenAPI 0.3.13 bổ sung 1 (`updateRoom`, `RoomUpdateResult.warnings[]`); ARC FB-R5-ARC-BE-C1-01 (mock).
- **Không đổi `openapi.yaml`.** Mã cảnh báo đã có trong `api-client` sinh từ hợp đồng trên `main`.

## 1. Đã làm gì
- **Ngăn kéo căn (`RoomDrawer`) kiểm cả hai biên trước khi gửi**, so bằng số nguyên, đúng bằng biên thì không báo, không chặn lưu:
  - thấp: giá đêm × 30 < giá tháng → `rooms.night_low` (chữ mới của UXD 9.3, `{perDay}` như cũ);
  - cao (mới): giá đêm × 5 > giá tháng → `rooms.night_high`, `{month}` = giá tháng trong ô.
  - Cùng một khung `Alert tone="warn"` dưới hai ô giá, hiện ngay khi giá đổi; hai điều kiện không thể cùng đúng.
- **Nút Lưu** đổi chữ thành "Vẫn lưu giá này" (`rooms.save_unusual_price`) khi khung đang hiện **và** ô giá đã sửa. Một lần bấm là xác nhận, không mở thêm hộp. Chỉ sửa tên căn, giường mà giá cũ vốn khác thường thì nút vẫn là "Lưu", khung vẫn hiện. Khung cảnh báo là `aria-describedby` của nút xác nhận.
- **Sau khi lưu**: `warnings[]` có `NIGHTLY_PRICE_UNUSUAL` → toast lưu giữ chữ cũ (`rooms.saved` / `rooms.saved_scheduled`) và thêm dòng `rooms.warn.nightly_price_unusual`, tông cảnh báo, **không tự tắt** (người dùng bấm đóng).
- `app/toast.tsx`: `toast(text, opts?: { warn })`. Toast có `warn`: icon `alert`, nền `--warn-bg`, viền `--warn`, chữ `--ink` (token DS, tự đổi ở chế độ tối), không hẹn giờ tắt (kể cả sau khi rê chuột ra). Toast thường không đổi gì.
- **Mock** (`mocks/handlers.ts`, khối `updateRoom`):
  - ARC FB-R5-ARC-BE-C1-01: giá tháng hoặc giá đêm ≤ 0 → `VALUE_OUT_OF_RANGE` (như máy chủ, zod `money` min 1, T1A-3), thay `AMOUNT_NOT_POSITIVE`. Mã máy chủ không đổi.
  - Thêm `NIGHTLY_PRICE_UNUSUAL` vào `warnings[]` khi lưu giá: chép **nguyên văn** đoạn của #121 để khi #121 vào `main` thì đoạn này gộp không xung đột.

## 2. Chữ
Chép nguyên từ UXD `copy-v1.0.5.md` 9.3, không tự viết. Sửa 1, thêm 3 khóa, đặt ngay sau `rooms.night_low` trong `gen_strings.py`:

| Khóa | Kiểu | VI | EN |
|---|---|---|---|
| `rooms.night_low` | Sửa | Giá đêm khác thường so với giá tháng: thấp hơn giá tháng chia 30 ({perDay} đ). Kiểm lại trước khi lưu; nếu đúng, vẫn lưu được. | The nightly price looks unusual next to the monthly price: it is below the monthly price divided by 30 ({perDay} VND). Check it before saving. If it is right, you can still save. |
| `rooms.night_high` | Mới | Giá đêm khác thường so với giá tháng: 5 đêm đã đắt hơn cả tháng ({month} đ). Kiểm lại trước khi lưu, nhất là số 0 thừa; nếu đúng, vẫn lưu được. | The nightly price looks unusual next to the monthly price: 5 nights cost more than the whole month ({month} VND). Check it before saving, especially for an extra zero. If it is right, you can still save. |
| `rooms.save_unusual_price` | Mới | Vẫn lưu giá này | Save this price anyway |
| `rooms.warn.nightly_price_unusual` | Mới | Giá đêm khác thường so với giá tháng. Giá đã lưu: kiểm lại hai giá của căn, sai thì sửa ngay. | The nightly price looks unusual next to the monthly price. The price is saved: check both prices for this room and correct them now if needed. |

## 3. Tệp
- Sửa: `product/apps/admin-web/src/pages/RoomDrawer.tsx`, `src/app/toast.tsx`, `src/mocks/handlers.ts`, `src/__tests__/rooms.test.tsx` (ca biên dưới cũ: chữ đọc từ khóa, nút "Vẫn lưu giá này"); `product/packages/ui/src/styles/app.css` (`.toast-warn`, đặt cạnh khối toast); `product/design/tools/gen_strings.py` và các tệp sinh ra.
- Mới: `product/apps/admin-web/src/__tests__/v5-5c-nightly-unusual-fe2.test.tsx`, ảnh `screenshots/v5-5c-*.png` (mock), báo cáo này.

## 4. Kiểm
- Vitest 7 ca (`v5-5c-nightly-unusual-fe2.test.tsx`), theo ví dụ DOM giá tháng 8.500.000:
  - đêm 2.800.000 → câu biên trên, nút "Vẫn lưu giá này" có mô tả là câu cảnh báo, lưu → thân PATCH đúng, toast có dòng cảnh báo (`.toast-warn`);
  - đêm 1.700.000 (× 5 = đúng giá tháng) → không báo, nút "Lưu", toast thường;
  - đêm 280.000 → câu biên dưới (`{perDay}` 283.000); 8.400.000 / 280.000 (đúng biên dưới) → không báo;
  - giá cũ vốn khác thường, chỉ sửa tên → khung hiện, nút "Lưu";
  - máy chủ trả cảnh báo dù Desk không thấy → toast có dòng cảnh báo;
  - mock trả `VALUE_OUT_OF_RANGE` cho giá ≤ 0 (thẻ ARC);
  - toast thường tự tắt, toast có cảnh báo ở lại tới khi bấm đóng.
- `rooms.test.tsx` 15 ca xanh sau khi sửa ca biên dưới. Toàn bộ vitest admin-web xanh (89 tệp, 1002 ca); `tsc`, `eslint`, `prettier` sạch; `gen_strings.py` chạy lại không đổi gì.
- Ảnh 1366 trên mock: ngăn kéo với câu biên trên, câu biên dưới, toast cảnh báo (sáng và tối).

## 5. Giả định
- G1. Dòng cảnh báo trong toast hiện **mỗi khi máy chủ trả mã**, kể cả khi người dùng vừa bấm "Vẫn lưu giá này". Lý do: UXD 9.3 ý 2 lấy điều kiện là `warnings[]`; Desk gửi đúng hai giá nó vừa kiểm nên thực tế máy chủ chỉ cảnh báo khi Desk cũng đã thấy. Bỏ dòng sau khi xác nhận thì dòng này gần như không bao giờ hiện, mất lưới thứ hai. UXD muốn ẩn sau xác nhận thì sửa một điều kiện.
- G2. Khung cảnh báo của giá cũ (chưa sửa ô giá) vẫn hiện như UXD 9.3 ý 1; nút giữ "Lưu".
- G3. Không thêm cảnh báo cho dòng giá đã lên lịch trong danh sách (chỉ ô đang sửa). Danh sách lên lịch vẫn hiện số như cũ.

## 6. Rủi ro và việc còn mở
- **Xung đột khi gộp**: #121 cũng sửa khối `updateRoom` của mock (giá đêm bắt buộc `REQUIRED`, bỏ nhánh ÷ 12). Đoạn `warnings[]` chép nguyên văn nên gộp sạch; khối kiểm giá ≤ 0 (2 dòng mã lỗi) sẽ xung đột nhẹ. #121 vào `main` trước thì FE-2 gộp `main` vào nhánh này (merge, không rebase) và giữ: `REQUIRED` của #121 + `VALUE_OUT_OF_RANGE` của thẻ ARC.
- Máy chủ trả `VALUE_OUT_OF_RANGE` cho ô giá **không** kèm `min`/`max`, nên câu chung `field_error.value_out_of_range` ("từ {min} đến {max}") sẽ hiện dấu ngoặc nếu gặp. Desk đã chặn giá ≤ 0 và giá đêm không tròn nghìn trước khi gửi, nên chỉ còn trường hợp gõ số lớn hơn 9 triệu tỉ. Không sửa ở PR này; ARC ghi câu "giá ≤ 0 → VALUE_OUT_OF_RANGE (min 1)" vào 0.3.14, khi đó FE đọc `min` nếu máy chủ gửi.
- Lần chạy đầu toàn bộ vitest khi máy đang tải nặng (nhiều agent cùng chạy, 148 giây thay vì 45 giây) có 1 tệp đỏ vì quá giờ; chạy lại xanh hết. Không thấy liên quan tới thay đổi này.

## 7. Cần xem
- UXD: toast cảnh báo (ảnh sáng và tối), giả định G1.
- DOM: hai biên và ví dụ 8.500.000.
- QA: T10 (plan 4a). Khi #121 lên staging, thử đổi giá thật một căn rồi đổi lại.
- Sổ tay (BA): bỏ câu tạm "Đổi giá xong, mở báo giá thử 1 đêm…" khi PR này lên cùng tag với #121.
