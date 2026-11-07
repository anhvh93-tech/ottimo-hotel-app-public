# DOM review – FE-2 PR #138 (V5-5C: Desk đọc cảnh báo giá đêm khác thường, hai biên)

- Round 5 (v1.0.5) · Bước: Review · DOM · 07/11/2026
- PR #138, nhánh `r5-fe-v5-5c` @ `4f348879` (nội dung ở `bbfaa02a`). Plan V5-5C: FE-A → UXD, DOM, QA. ARC và UXD đã duyệt có điều kiện; điều kiện (4) của ARC là "DOM duyệt" – đây là tệp đó.
- DOM đọc: `ARC-on-fe2-prs-136-138.md`, `UXD-on-fe2-prs-136-138.md`; diff `RoomDrawer.tsx`, `toast.tsx`, chữ 4 khóa trong `gen_strings.py`; `app/money.ts` `perDayOfMonthly`. Đối chiếu BR-101 (4) v0.5.13 và DOM `rules-v1.0.5.md` 1.2 ý 6. DOM không chạy test.
- Không có dữ liệu khách thật, không có số hoa hồng.

## 0. Kết luận

**DUYỆT về nghiệp vụ.** Một thẻ Minor (số trong câu biên dưới), không chặn gộp. Các điều kiện gộp của ARC và UXD (gộp `main`, UXD 138-01 toast 390 px, CI xanh) giữ nguyên. Không ESC.

## 1. Đối chiếu luật

| Luật BR-101 (4) v0.5.13 | PR | Kết quả |
|---|---|---|
| Biên dưới: giá đêm × 30 < giá tháng | `nightly * 30 < monthly` | Đúng |
| Biên trên (mới): giá đêm × 5 > giá tháng | `nightly * 5 > monthly` | Đúng |
| So số nguyên, đúng biên không báo | so số nguyên, `<` và `>` chặt | Đúng |
| Cảnh báo, không chặn; vẫn lưu | nút "Vẫn lưu giá này", một lần bấm | Đúng |
| Giá tháng cùng căn, cùng ngày hiệu lực | hai ô trong cùng hộp đổi giá, gửi cùng một lệnh | Đúng |
| Máy chủ cũng báo (`NIGHTLY_PRICE_UNUSUAL`) | toast lưu thêm dòng cảnh báo, không tự tắt | Đúng |

Ví dụ BR-101 chạy qua luật của PR (căn giá tháng 8.500.000): 283.000 → báo thấp; 284.000 → không; 1.700.000 → không (đúng biên ÷ 5); 1.701.000 → báo cao; gõ thừa số 0 thành 8.000.000 → báo cao, vẫn lưu được. Bốn số này có trong test của FE-2 (ARC mục cuối).

## 2. Góc vận hành

- Người đổi giá căn là chủ đầu tư (Danh mục căn, OWN nhập). Hai lỗi biên trên bắt được (thừa số 0, gõ giá tháng vào ô giá đêm) là đúng hai lỗi hay gặp khi nhập 10 căn một lượt. Mỗi lỗi lọt qua thì báo giá, web và đơn OTA để trống giá đều ra số sai cùng lúc.
- Toast cảnh báo không tự tắt: đúng. Người nhập phải đọc, không trôi mất trong 4 giây.
- Chỉ sửa tên/giường của căn có giá cũ khác thường thì nút vẫn "Lưu": đúng. Không bắt xác nhận lại một giá không ai vừa đổi.
- Giả định G1 của FE-2 (dòng cảnh báo hiện cả sau khi đã bấm "Vẫn lưu giá này"): DOM đồng ý với UXD. Máy chủ nói giá khác thường thì Desk nói lại; người nhập thấy hai lần là chấp nhận được, ít hơn nhiều cái giá của một giá sai trên mọi kênh.

## 3. Thẻ

### FB-R5-DOM-FE-138-01
- Mức độ: Minor – FE-2, v1.0.5 nếu kịp (một dòng), không chặn gộp.
- Vị trí: `app/money.ts` `perDayOfMonthly` (`Math.round(monthly / 30 / step) * step`), dùng ở `RoomDrawer.tsx` cho `{perDay}` của `rooms.night_low`.
- Vấn đề: câu nói "thấp hơn giá tháng chia 30 ({perDay} đ)", nhưng `{perDay}` làm tròn **gần nhất**. Căn giá tháng 8.500.000: 8.500.000 ÷ 30 = 283.333 → hiện **283.000**. Gõ giá đêm 283.000 thì có cảnh báo (283.000 × 30 = 8.490.000 < 8.500.000), và câu ghi "thấp hơn … (283.000 đ)" cho đúng con số 283.000. Câu tự mâu thuẫn. Cùng lỗi ở giá tháng 11.500.000 (383.333 → 383.000). Hai giá tháng này có trong bảng giá 01/11 (BR-101: 101, 201; 302, 402).
- Vì sao quan trọng: chủ đầu tư thấy câu sai thì nghi cả cảnh báo, và dễ bấm "Vẫn lưu" theo thói quen cho cả lúc giá sai thật. Không sai tiền.
- Đề xuất sửa: số trong câu làm tròn **lên** bội 1.000 (`Math.ceil`), tức giá đêm thấp nhất không bị báo: 8.500.000 → **284.000**, 11.500.000 → **384.000**, 9.000.000 → 300.000 (chia hết, không đổi). Khi đó "thấp hơn 284.000 đ" đúng với mọi giá bị báo (giá đêm là bội 1.000). Kiểm `perDayOfMonthly` còn dùng chỗ nào khác trước khi đổi; nếu có thì thêm hàm riêng cho câu này. Thêm một ca test: 8.500.000 / 283.000 → câu có "284.000".
- Trạng thái: Open

## 4. Điểm làm tốt

- Hai biên giống hệt bộ kiểm của máy chủ, cùng cách so số nguyên, nên Desk và máy chủ không bao giờ nói ngược nhau.
- Một lần bấm là xác nhận, không thêm hộp: đúng tinh thần "cảnh báo, không chặn" của BR-101.
- Test dùng đúng các số ví dụ của DOM, kể cả hai ca đúng bằng biên.

## 5. Giả định

- PR head sau khi FE-2 gộp `main` và làm UXD 138-01 chỉ đổi phần ARC G1 cho phép (gộp, CSS `.toasts`, test). Có đổi mã khác thì gửi lại DOM.
- Thẻ 138-01 làm hay không không đổi kết luận DUYỆT.

`| 2026-11-07 | 5 | **DOM – review FE-2 PR #138 (V5-5C, cảnh báo giá đêm khác thường hai biên) @ 4f348879: DUYỆT nghiệp vụ** (điều kiện DOM của ARC đã đủ). Đúng BR-101 (4) v0.5.13: đêm × 30 < tháng, đêm × 5 > tháng, so số nguyên, đúng biên không báo, cảnh báo không chặn, "Vẫn lưu giá này" một lần bấm, toast cảnh báo không tự tắt khi máy chủ trả NIGHTLY_PRICE_UNUSUAL; ví dụ 8.500.000: 283.000 báo, 284.000 không, 1.700.000 không, 1.701.000 báo. Đồng ý G1 (dòng cảnh báo cả sau khi xác nhận). Thẻ 138-01 Minor FE-2: {perDay} làm tròn gần nhất nên câu ghi "thấp hơn 283.000 đ" cho chính giá 283.000 (giá tháng 8.500.000, 11.500.000) – làm tròn lên bội 1.000 (284.000, 384.000). Điều kiện gộp ARC/UXD giữ nguyên. Không ESC | DOM | rounds/round-05/reviews/DOM-on-fe2-pr-138.md |`
