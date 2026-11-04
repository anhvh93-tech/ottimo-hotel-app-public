# UXD review – v1.0.4 F1: Người dùng & vai, đặt lại 2 bước trả 409 (FE-A, PR #65)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** (nhanh) | 04/11/2026
- Đối tượng: `git diff origin/main...6b346d85 -- product/apps/admin-web`, nhánh `v104/users-2fa-stale`. Tệp sửa: `pages/UsersPage.tsx` và `__tests__/v104-users-fea.test.tsx` (sửa 1 ca cũ, thêm 2 ca).
- Đối chiếu: khóa `users.reset_2fa_stale` do UXD cấp ở `46ff21a2`, và ghi chú của khóa đó trong `gen_strings.py`. Đọc thêm `Alert` trong `packages/ui/src/Feedback.tsx`.
- Không có ảnh, theo yêu cầu của ORC. Kiểm bằng mã và test.

## Kết luận: ĐẠT

FE-A làm đúng thiết kế UXD đã cấp. Còn một thẻ Suggestion cho v1.0.5, không chặn gộp. Không có việc cần báo chủ đầu tư.

| Điểm cần kiểm | Thiết kế UXD (ghi chú khóa) | Bản build | Kết quả |
|---|---|---|---|
| Thứ tự | Đóng hộp → tải lại danh sách → **rồi mới** hiện câu (câu nói "đã được tải lại") | `stale2fa` gọi `setPending(null)` rồi `reload()`. Câu chỉ được đặt khi `state.loadedAt ≥ since`. Test giữ cổng `GET /v1/users` và kiểm câu **chưa** hiện trước khi danh sách về | Đúng |
| Tông | `Alert info` hoặc toast, không dùng lỗi đỏ | `<Alert tone="info">`. DS tự gán `role="status"`, nên trình đọc màn hình đọc câu mà không ngắt ngang. Test kiểm không có `role="alert"` | Đúng |
| Nút | Không kèm `common.reload` | Không có nút. Test kiểm không có nút Tải lại | Đúng |
| Vị trí | (không quy định) | Đầu trang, ngay dưới chỗ của `Alert bad` (lỗi chung của trang), trên bảng. Hai Alert không cùng hiện | Đồng ý. Cùng chỗ người dùng đã quen thấy kết quả thao tác trên trang này. Danh sách 10 người không dài, nên câu không bị cuộn khuất |
| Tự tắt | (không quy định) | Không tự tắt. Câu mất khi người dùng mở hoặc chạy thao tác khác (`open`, `run`, `runS2` gọi `setNotice(null)`) | Đồng ý. Câu có tên người và lý do, người dùng cần đủ thời gian đọc. Toast tự tắt dễ bị lỡ khi hộp vừa đóng |
| `{name}` | Tên hiển thị, như `users.reset_2fa_title` | `u.displayName` của người trong hộp vừa đóng (`p.user`). Cùng nguồn với tiêu đề hộp, nên tên trong câu khớp tên người dùng vừa thấy | Đúng |
| Phạm vi | Chỉ `resetUser2fa`. Các 409 khác giữ câu riêng | Nhánh `p.kind === 'reset2fa' && code === 'INVALID_TRANSITION'`. Các thao tác khác vẫn đi `fail`. Test "F1 scope" với thao tác khóa tài khoản kiểm điều này | Đúng |
| Tải lại lỗi | (không quy định) | Lỗi khi tải lại thì không hiện câu "đã được tải lại", mà hiện lỗi của lần tải (`problemView`, `Alert bad`) | Đúng. Câu không nói điều chưa xảy ra |
| Brand | Màu và chữ theo guideline | Chỉ dùng `Alert` của DS. Không `style=`, không mã màu. Chữ đúng bảng strings, VI/EN không emoji, giọng nội bộ ngắn | Đạt |

---

### FB-R4-UXD-FE-F1-01
- Mức độ: Suggestion (v1.0.5, UXD làm trước)
- Vị trí: đường `fail` của `UsersPage.tsx`, khi một thao tác khác (khóa, mở khóa, đổi vai…) nhận 409 `INVALID_TRANSITION`. Câu đang dùng là `problemView` → `error.INVALID_TRANSITION`.
- Vấn đề: câu chung `error.INVALID_TRANSITION` nói về **đơn đặt phòng** ("Đơn vừa chuyển sang \"{status}\"…"). Ở các màn không phải đơn, máy chủ không gửi `currentState` theo nghĩa trạng thái đơn, nên `{status}` có thể không được thay. F1 chỉ sửa ca đặt lại 2 bước, đúng phạm vi. Các 409 khác ở Người dùng & vai và ở các màn khác vẫn có thể gặp câu này.
- Vì sao quan trọng: ít gặp, vì chỉ xảy ra khi hai người cùng sửa một tài khoản. Nhưng câu nói sai đối tượng và hiện `{status}` thô thì trông như lỗi phần mềm.
- Đề xuất sửa:
  - UXD thêm khóa chung không gắn với đơn, ví dụ `error.INVALID_TRANSITION_generic`: "Dữ liệu vừa thay đổi nên thao tác này không còn dùng được. Đã tải lại để xem các nút hiện có." / "This just changed, so the action no longer applies. It has been reloaded so you can see what you can do now."
  - FE (ARC duyệt cách chọn khóa) dùng câu này trong `problemView` khi Problem không phải của đơn hoặc không có `currentState`.
  - Đưa vào lượt dọn chuỗi v1.0.5.
- Trạng thái: Open

## Điểm nên giữ
- Câu chỉ hiện sau khi danh sách mới về. Test giữ cổng mạng để kiểm đúng thứ tự này, không dựa vào thời gian chờ.
- Sửa lại ca test cũ: trước đây ca này coi 409 là lỗi đỏ, nay kiểm đúng câu info. Có thêm ca phạm vi để bảo đảm các thao tác khác không bị đổi theo.
