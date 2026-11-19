# UXD review – FE PR #202 (`r5-bug-r5-017-fe` @ `0e4286be`): BUG-R5-017, sửa tham số trong ngày ở S24

- Người review: UXD | Round 5 – bước **Review** | 19/11/2026
- Cách kiểm:
  - đọc `gh pr diff 202`: `ParamDialog.tsx`, `gen_strings.py`, test `bug-r5-017-same-day.test.tsx`;
  - đọc `app/toast.tsx` tại `0e4286be`;
  - đối chiếu phụ lục 19/11 của `ARC-on-be-pr-200.md` (BE-2, FE-1..3).
- Không chạy app, không có ảnh chụp.

## Kết luận

**DUYỆT CÓ ĐIỀU KIỆN (UXD).** Cách xử lý đúng:
- câu lỗi nằm dưới ô "Hiệu lực từ";
- có nút điền sẵn ngày mai;
- bảng giá dọn lưu lại trong ngày thì báo bằng toast thường.

Cả 3 chuỗi nháp cần đổi chữ (thẻ 202-01). Chỉ đổi chuỗi trong `gen_strings.py`; riêng `params.saved_now` FE truyền thêm `{name}`.

**Toast không đỏ: đạt.**
- `useToast` (`app/toast.tsx`, C18) chỉ có một kiểu, không có tham số tone hay màu lỗi. Toast `params.saved_now` vì vậy cùng kiểu với mọi toast "Đã lưu".
- Code không thêm `Alert` hay class lỗi cho trường hợp này.
- Đúng ARC FE-2.

### FB-R5-UXD-FE-202-01
- Mức độ: Minor
- Vị trí: `gen_strings.py`, các khóa `field.ALREADY_IN_FORCE`, `params.effective_tomorrow`, `params.saved_now`; `ParamDialog.tsx` (lời gọi toast).
- Vấn đề:
  1. `field.ALREADY_IN_FORCE`: tham số nào lúc nào cũng có "một giá trị đang hiệu lực hôm nay". Câu nháp vì thế không nói được lý do bị chặn. Lý do thật (ARC BE-2) là: **hôm nay đã có một lần đổi** cho tham số này, và mỗi tham số chỉ đổi được một lần mỗi ngày (trừ bảng giá dọn theo căn).
  2. `params.effective_tomorrow`: nút này chỉ **điền ngày** vào ô; người dùng vẫn phải bấm Lưu. Nhãn "Effective tomorrow / Hiệu lực từ ngày mai" đọc như đã lưu xong, áp dụng từ mai.
  3. `params.saved_now`: thiếu tên tham số. Các toast lưu khác đều có tên (`params.saved` "Saved {name}, effective {date}."). Dấu gạch giữa câu cũng lệch kiểu câu với `params.saved`.
- Vì sao quan trọng: OWN và MGR sửa giá trong ngày ra mắt. Câu lỗi phải nói đúng lý do, nút phải nói đúng việc nó làm, và toast phải cho biết đã lưu cái gì.
- Đề xuất sửa:

| Khóa | EN | VI |
|---|---|---|
| `field.ALREADY_IN_FORCE` | This setting was already changed for today. Choose tomorrow or a later date. | Tham số này đã được đổi cho hôm nay. Chọn từ ngày mai trở đi. |
| `params.effective_tomorrow` | Use tomorrow's date | Chọn ngày mai |
| `params.saved_now` | Saved {name}, in force now. | Đã lưu {name}, áp dụng ngay. |

  - Code: `t('params.saved_now', { name })`, giống `params.saved`.
  - Test dùng `tv(...)` nên tự theo chuỗi mới.
  - Bỏ ghi chú "CHỜ UXD DUYỆT" ở 3 dòng.
- Trạng thái: Open

## Điểm làm tốt – nên giữ
- Client cũ hoặc server chưa có mã mới vẫn hiện câu chung. Không có đường nào để trống câu lỗi.
- Bấm nút ngày mai thì lỗi và nút cùng biến mất. Đổi ngày bằng tay cũng vậy. Không còn câu lỗi cũ treo lại.
