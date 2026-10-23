# INT – Phản hồi review email (Round 3, Phản hồi & sửa)

- Tác giả: INT · Ngày: 23/10/2026 · Nhánh `int-r3-smtp`, đã rebase lên `origin/main` 3e9be89.
- Review được trả lời:
  - `reviews/s1-ARC-on-INT-email.md`: gộp được; Minor 01–03, Suggestion 04–05;
  - `reviews/s1-SEC-on-INT-email.md`: Major EMAIL-01; Minor 02–03; Suggestion S-1.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R3-SEC-INT-EMAIL-01 (Major) | Done (mã) – chờ INV làm bước 8a | Làm theo **phương án A**: thêm `EMAIL_SMTP_MODE=relay` và đặt làm **mặc định**. Xem chi tiết dưới bảng. |
| FB-R3-ARC-INT-EMAIL-03 (Minor) | Done | Xem chi tiết dưới bảng (giới hạn thời gian gửi + log khi mất lease). |
| FB-R3-SEC-INT-EMAIL-02 (Minor) | Done | Cùng cách sửa với ARC-03. Lượt chạy không bao giờ vượt nửa thời hạn thuê, nên không còn bị nhận lại khi đang gửi. |
| SEC S-1 (Suggestion) | Done | `worker.ts`: lỗi bất ngờ của vòng email chỉ log `err.name` + `code` (code phải khớp `^[A-Za-z0-9_.:-]{1,40}$`), không log `message`. |
| FB-R3-ARC-INT-EMAIL-01 (Minor) | Deferred – Sprint 2 | Cổng `identity` `StaffDirectory.emailRecipients(...)` và mở rộng `module-boundaries` sang `src/jobs`. Cổng mới trong `identity` cần BE (chủ module) làm hoặc đồng ý. Ghi vào backlog kỹ thuật Sprint 2, gộp cùng SEC-03. |
| FB-R3-SEC-INT-EMAIL-03 (Minor) | Deferred – khi có cơ sở thứ 2 (R4+) | Làm cùng cổng ở ARC-01: khi `property_id` NULL, chỉ gửi owner của các cơ sở mà người liên quan có vai. OTTIMO hiện có 1 cơ sở nên chưa có ảnh hưởng. |
| FB-R3-ARC-INT-EMAIL-02 (Minor, ARC) | – (việc của ARC) | Ghi chú cho ADR-015: chế độ mặc định nay là relay theo IP. Giới hạn: relay 10.000 người nhận/người gửi/ngày, mật khẩu ứng dụng 2.000 thư/ngày. Mật khẩu ứng dụng chỉ còn là dự phòng. |
| FB-R3-ARC-INT-EMAIL-04 (Suggestion) | Accepted | Ghi trong `s1-email.md` mục 5. Khi làm J18, J18 không được nhận topic `staff.email`, hoặc phải dùng `StaffEmailDispatcher` làm handler cho topic đó. |
| FB-R3-ARC-INT-EMAIL-05 (Suggestion) | Accepted | Giữ hành vi: lỗi cấu hình thì worker dừng khi khởi động; lỗi lúc chạy thì log rồi thử lại. Việc báo `dead`/`failed` trong `ops-check` là của OPS. |

## Chi tiết các thẻ Done

### FB-R3-SEC-INT-EMAIL-01 – chế độ relay
Cách gửi khi `EMAIL_SMTP_MODE=relay` (mặc định):
- máy chủ: `smtp-relay.gmail.com:587`;
- bắt buộc STARTTLS, có kiểm chứng chỉ;
- **không AUTH**: Google xác thực theo IP VPS khai báo trong Admin console;
- EHLO dùng tên miền của `EMAIL_FROM`.

Các chốt chặn đi kèm:
- Relay mà tệp `email_smtp_password` có nội dung → worker không khởi động. Không để sót mật khẩu hộp thư trên máy chủ.
- `init-secrets.sh` ở chế độ relay không hỏi gì, chỉ tạo tệp rỗng.
- Relay từ chối (550 5.7.x, ví dụ IP chưa được khai) → lỗi `AUTH`: hàng thư thử lại, không bị coi là người nhận hỏng.

Chế độ `app_password` vẫn giữ làm dự phòng:
- mỗi lần khởi động, worker log `warn` có mã thẻ `FB-R3-SEC-INT-EMAIL-01`;
- chỉ dùng khi ORC/INV đồng ý.

Cấu hình đã đổi:
- `env.production.example`: `EMAIL_SMTP_MODE=relay`;
- compose: mặc định `relay`, ghi chú tệp mật khẩu phải rỗng.

Hướng dẫn INV bật relay trong Admin console: `outputs/OPS/inv-production-steps.md` Phần 8a.

Về gói Workspace có relay hay không: xem `outputs/INT/s1-email.md` mục 1.7.

### FB-R3-ARC-INT-EMAIL-03 – lease
- Mỗi lượt chạy chỉ gửi trong `EMAIL_SEND_BUDGET_MS` = nửa thời hạn thuê (5 phút).
- Kiểm trước mỗi hàng và trước mỗi người nhận. Quá giới hạn thì:
  - hàng đang gửi dở và các hàng chưa tới được **trả lại**: không tính lần thử, đến hạn ngay;
  - người đã nhận vẫn được lưu trong `sentUserIds`;
  - thống kê ghi `deferred`.
- `finish()` không cập nhật được hàng nào → log `warn` `email lease lost` kèm id outbox.
- `docker-compose.prod.yml` ghi rõ mỗi stack chỉ một worker.
- Thêm 2 ca test tích hợp.
