# UXD review – v1.0.4 P4-33: vai chỉ Bảo trì chọn được căn trên Desk (FE-A)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 04/11/2026
- Đối tượng: `git diff origin/main...origin/v104/fe-maint-rooms` (`origin/main` @ `7b5b6117`, nhánh @ `16aefe60`). Gồm `pages/ops/WorkOrderForms.tsx` (hook mới `useOpsRooms`, hộp **Phiếu sửa mới** và **Khóa phòng có kế hoạch**) và `pages/ops/MaintenancePage.tsx` (nhãn căn ở danh sách khóa phòng). Đọc kèm báo cáo `rounds/round-04/outputs/FE/v1.0.4-fe-maint-rooms.md` và test `v104-maint-rooms-fea.test.tsx`.
- Đối chiếu: brand guideline (`00-brief/context/brand/brand-guidelines.md`), quyết định ARC plan v1.0.4 mục 6.5, BUG-R3-053, mẫu ô Căn ở app nhân viên (đọc `room-statuses`).
- Ảnh: không chụp. Gói không đổi giao diện, chỉ đổi nguồn dữ liệu của ô Căn. Đọc mã và test (tài khoản thử `qa.mt`, `qa.fd`).

## Kết luận: ĐẠT

Gói sửa đúng lỗi BUG-R3-053 mà không đổi giao diện. Ô Căn vẫn là `select` trong `Field` của DS, nhãn vẫn "101 · tên căn" (`roomLabel(…, 'staff')`), sắp theo số căn như trước. Không thêm khóa chữ, không màu hay CSS mới.

Thẻ 01 nên làm cùng gói nếu FE-A còn mở tệp. Không làm thì dời sang v1.0.5, không chặn gộp. Không có việc cần báo chủ đầu tư.

| Thẻ | Mức | Tóm tắt |
|---|---|---|
| 01 | Minor | Khi đang tải hoặc đọc danh sách căn lỗi, ô Căn chỉ trống, không nói vì sao. Vai chỉ Bảo trì chính là nhóm từng gặp lỗi "ô trống" này |

## Kiểm theo yêu cầu

| Mục | Kết quả |
|---|---|
| Brand | Đạt. Không có thay đổi hiển thị |
| Khóa chữ | Không có khóa mới. Thẻ 01 dùng lại khóa có sẵn |
| Trạng thái | Tải: ô trống (như trước). Lỗi: ô trống, không báo (thẻ 01). Rỗng: không xảy ra với cơ sở 10 căn |
| A11y | Không đổi. `Field` vẫn gắn nhãn với `select` |
| 1440 / 390 | Không đổi bố cục. Hộp `Modal` có sẵn, `select` rộng 100% |

---

### FB-R4-UXD-FE-P433-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/pages/ops/WorkOrderForms.tsx` dòng 193–207 (`useOpsRooms` chỉ trả `state.data ?? []`); ô Căn của `CreateWorkOrderDialog` (khoảng dòng 336–348) và `BlockDialog` (khoảng dòng 528–540)
- Vấn đề: `useOpsRooms` bỏ `state.status`. Khi `room-statuses` (hoặc `listRooms`) đang tải hay trả lỗi, ô Căn chỉ có một dòng trống. Người dùng không biết nên chờ, thử lại hay báo người khác. Trước đây `useCatalog` cũng vậy, nên đây không phải lỗi mới. Nhưng gói này đổi nguồn cho đúng nhóm vai từng gặp "ô Căn trống" (BUG-R3-053). Nếu lại thấy ô trống, họ sẽ nghĩ lỗi cũ quay lại.
- Vì sao quan trọng: checklist UXD yêu cầu mọi màn có trạng thái tải và lỗi. Nhân viên bảo trì thường dùng điện thoại, mạng yếu, nên đọc lỗi là ca dễ gặp.
- Đề xuất sửa: `useOpsRooms` trả thêm `status` và `reload`, ví dụ `{ rooms, status, reload }`. Ở hai ô Căn:
  - đang tải: `select` có `disabled`; `help` của `Field` = `common.loading` (khóa có sẵn);
  - lỗi: `error` của `Field` = `common.error_network_body` ("Chưa kết nối được tới máy chủ. Kiểm tra mạng rồi bấm Thử lại. Dữ liệu của bạn không bị mất."). Đặt nút `Button sm ghost` `common.retry` ngay dưới ô, gọi `reload`.
  - Giữ những gì người dùng đã gõ ở các ô khác.
  - Không cần khóa mới. Nếu FE-A muốn câu riêng cho ô này, báo UXD để thêm ở P4-01 lượt 2.
- Trạng thái: Open

## Điểm nên giữ
- Chọn nguồn theo vai phía máy khách chỉ để khỏi gửi một yêu cầu chắc chắn bị 403. Quyền vẫn do máy chủ kiểm, hợp đồng và `rbac-cases.json` giữ nguyên, đúng ARC 6.5.
- Danh sách khóa phòng khớp nhãn theo `roomId`, không có thì theo `roomNo`, nên không bao giờ mất số căn.
- Test có ca "lễ tân vẫn đọc `/rooms`", và FE đã chạy test trên mã cũ để thấy test đỏ. Test bắt đúng lỗi.
