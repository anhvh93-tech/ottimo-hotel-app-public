# Báo cáo MOB – Round 5, v1.0.5

> ORC chép từ báo cáo bàn giao của MOB ngày 07/11/2026 (subagent không ghi được tệp báo cáo).

## V5-15: nút Báo cần dọn (PR #97, `d3081f93`, CI xanh)
- Nút nằm trên màn căn H20, thay vị trí nút chính khi căn OC và máy chủ trả `needs_cleaning` trong `allowedEvents`. Điều kiện hiện nút: FD+ luôn có; HK chỉ khi căn trong phạm vi T; bảo trì không có.
- Gửi theo hàng đợi offline như R8. Cửa sổ hoàn tác 10 giây. `Idempotency-Key` và `performedAt` cố định từ lúc chạm. Mất mạng thì xếp hàng, có mạng lại thì gửi một lần.
- Chặn lệnh trùng ở 3 lớp:
  - chạm 2 lần cùng lúc thì chỉ ra 1 lệnh (`waitingRoomEvent`);
  - gửi lại giữ nguyên key;
  - 409 có `currentState` = OD thì coi là đã áp dụng. 409 khác vào "Cần xem lại".
- 15 ca test, gồm mất câu trả lời (`dropAnswerOf`) và 409 OD / VD.
- Nhãn theo UXD: "Báo cần dọn" / "Mark for cleaning".

## V5-1B: tin giữ chỗ trong hộp thư (PR #117, `be37b682`, đã gộp `04fda0bb`)
- `hold_expired`, `hold_overdue_with_deposit`, `hold_overdue_cap` có câu UXD riêng (`staff.notif.k.*`), không còn câu chung "xem chi tiết trên OTTIMO Desk".
- Tham chiếu là mã đặt phòng. Chạm vào không mở màn nào, vì giữ chỗ là việc trên Desk (SR-PWA-06).

## V5-46
Thuộc guest-web, làn FE-B. MOB không làm.

## Đã chạy ở máy
Mobile 14 tệp / 166 ca qua; ESLint, prettier, typecheck sạch; `gen_strings.py` không lệch. Không thêm chữ mới, không đổi hợp đồng.

## Chỗ UXD/QA nên xem
- UXD: vị trí và độ nổi của nút Báo cần dọn trên H20 (`btn pri xl block`); chữ trong hàng đợi ("Thao tác trên máy", "Cần xem lại") với tên thao tác mới; bảng ở `content-guide.md` chưa có khóa mới; câu tin giữ chỗ trong hộp thư.
- QA: T15-8 trên PWA staging khi OPS dựng v1.0.5; chạm nhanh 2 lần, rồi tắt mạng, chạm, bật mạng lại; tài khoản HK ngoài phạm vi T không thấy nút; thêm ca V5-1B vào hồi quy hộp thư app nhân viên.
- Chưa kiểm bằng mắt trên trình duyệt.

## Còn lại
Sau khi #102 gộp, merge main vào #97 và giữ đúng một dòng `hk.action.needs_cleaning` (FB-R5-ARC-FE-MRG-01): giữ dòng của #102, nối thêm vế ghi chú về app nhân viên, chạy lại `gen_strings.py`. Merge, không rebase. Thứ tự gộp #102 → #98 → #97.
