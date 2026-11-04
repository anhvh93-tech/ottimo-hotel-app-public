# FE-A trả lời review PR #67 (minibar prefill race, BUG-R4-035)

- Người viết: FE-A | Round 4 – Phản hồi & sửa | 04/11/2026
- Review:
  - `rounds/round-04/reviews/UXD-on-v104-pr67-minibar.md`: ĐẠT;
  - `rounds/round-04/reviews/ARC-on-v104-pr67-minibar.md`: ĐẠT CÓ ĐK.
- Nhánh `v104/fix-s4-144-flake`. Chưa merge `main`: chờ #64 gộp, theo điều kiện của ARC.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-UXD-FE-PR67-01 | Done | Lúc đọc lại bản chuẩn của tủ, danh sách đang hiện vẫn là của lần đọc trước. Trong thời gian đó: (1) khối danh sách có `aria-busy="true"`; (2) các ô tăng giảm bị khóa (DS `Stepper` có prop mới `disabled`, tùy chọn, không đổi hành vi cũ); (3) nút "Tất cả còn đủ" bị khóa. Lần đọc đầu vẫn hiện `LoadingBlock`. Không thêm khóa chữ, không thêm màu. Test: `v104-minibar-prefill-fea` (đổi tủ sau B14: khóa trong lúc đọc, mở lại khi có số điền sẵn của tủ mới) và `ui.test.tsx` (`Stepper` `disabled`) |
| FB-R4-ARC-FE-PR67-01 | Done | `stdForCabinet = ready && (data.roomId ?? countingRoomId) === countingRoomId` thay cho `stdLoading`. Kiểm ở dòng đầu `saveMinibar`, trước nhánh `!chargeable`. Danh sách bị khóa và có `aria-busy` khi `!stdForCabinet`. Nút "Tiếp tục" busy trong lúc chờ; khi đọc lỗi thì nút bị khóa. Đọc lỗi thì luôn hiện `ErrorBlock` kèm "Thử lại", kể cả khi còn dữ liệu cũ. Test (a): 500 thì không bỏ qua bước, không POST, "Thử lại" đọc lại được. Test (b): bấm đúng khung hình đã đổi tên sang tủ B nhưng dữ liệu vẫn của A thì chỉ có 1 POST (của 402). Cả hai ca đỏ trên mã trước thẻ, xanh trên mã mới |
| FB-R4-ARC-FE-PR67-02 | Done | `minibarPrefill` được chuyển lên trên JSDoc của `CheckOutPage` |

## Kiểm
- `v104-minibar-prefill-fea`: 7 ca. Nhóm ca 4 ca ARC nêu: (1) race lúc commit; (2) nút chờ khi đang đọc; (3) BUG-R4-035; (4) quy tắc `minibarPrefill`. Thêm 3 ca: UXD PR67-01, ARC (a), ARC (b).
- `s4-144-fea` + `v104-minibar-prefill-fea`, chạy 6 tiến trình song song: 0/36 đỏ.
- Vitest admin-web: 78 tệp / 885 ca, đạt. `packages/ui`: 14 ca, đạt.
- `tsc --noEmit` (admin-web, ui) đạt. `eslint` 0 lỗi. `prettier --check` đạt.
