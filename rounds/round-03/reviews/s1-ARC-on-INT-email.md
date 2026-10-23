# ARC review INT – Email thật qua Google Workspace SMTP (v1.0)

- Người review: ARC | Round 3 – Sprint 1, bước Review (bắt buộc) | Ngày: 23/10/2026
- Đối tượng: commit `463592b` trên nhánh `int-r3-smtp` (worktree `agent-a0f5fedafd26a858e`); báo cáo `rounds/round-03/outputs/INT/s1-email.md` trên nhánh đó.
- Đối chiếu:
  - `rounds/round-03/outputs/ARC/s1-contracts.md` R2 (email qua outbox `staff.email`, chế độ mock trước);
  - `product/docs/architecture.md` (module `messaging` M13, bảng adapter `NotificationAdapter`);
  - ranh giới module (`test/module-boundaries.test.ts`, ADR-011 `integrations/contracts`);
  - quyết định INV 23/10 (gửi từ `info@ottimo.vn` qua Google Workspace).

## Kết luận
**`463592b` gộp được.** 0 Blocker, 0 Major. Có 3 thẻ Minor và 2 Suggestion, sửa ở Sprint 2 hoặc trước bản v1.0 tùy thẻ. Thẻ 02 là việc của ARC.

**Đã chạy** (worktree tách riêng ở `463592b`, PostgreSQL 17 riêng, vai `ottimo_app`):
- `integrations` vitest: **175/175**;
- api `tsc`: đạt;
- `email-adapter`, `integration/email-dispatch`, `config`, `module-boundaries`, `architecture`: **51/51**.

**Đúng kiến trúc và hợp đồng R2:**
- Nơi ghi chỉ đặt id + tên mẫu vào outbox trong giao dịch nghiệp vụ. Địa chỉ tra lúc gửi, không lưu trong outbox.
- Gửi **ngoài** giao dịch, không giữ khóa DB trong lúc chờ SMTP.
- Thử lại có giãn cách, sau 6 lần thì `dead`. Không gửi trùng người đã nhận (`sentUserIds`).
- `Message-ID` cố định theo khóa idempotency, nên lần gửi lại vẫn được nhận ra là một thư.
- Adapter nằm sau `NotificationAdapter` (ADR-011): lõi không import nodemailer; export tách riêng `@ottimo/integrations/notification`.
- Cấu hình fail-closed:
  - production chỉ nhận `smtp`, kiểm hai lớp (safe-config và `createEmailAdapter`);
  - bỏ `EMAIL_SMTP_URL` (dạng URL làm lộ mật khẩu);
  - mật khẩu chỉ đọc từ tệp secret, chỉ mount vào worker, api không cầm.
- TLS bắt buộc (465 hoặc 587 có `requireTLS`), có kiểm chứng chỉ. Log và `last_error` chỉ chứa mã lỗi.
- RLS: outbox mức tổ chức (`property_id` NULL, ví dụ lệnh 06.33 của OPS) vẫn được nhận nhờ policy "`property_id IS NULL OR` = cơ sở". `SKIP LOCKED` + `in_flight` chặn hai lần nhận.
- Phụ thuộc mới `nodemailer` 10.0.16 ghim chính xác, không có phụ thuộc con, đủ cũ (≥ 2 tuần). Đồng ý.

## Thẻ feedback

### FB-R3-ARC-INT-EMAIL-01
- Mức độ: Minor
- Vị trí: `services/api/src/jobs/email-dispatch.ts` `claim()` – SQL đọc thẳng `app_user`, `user_property_role`
- Vấn đề: worker ở `src/jobs` (tầng nền) đọc trực tiếp bảng của module `identity` để tra địa chỉ, vai owner và tên hiển thị. Test ranh giới module chỉ quét `src/modules`, nên không bắt được. Theo `architecture.md`, gửi tin thuộc `messaging` (M13), còn dữ liệu nhân viên thuộc `identity`.
- Vì sao quan trọng: khi `identity` đổi cách lưu vai hoặc trạng thái (ví dụ vai theo tổ chức, trạng thái mới sau US-143), worker email sẽ lệch âm thầm, mà đây là kênh của cảnh báo bảo mật.
- Đề xuất sửa (Sprint 2):
  - thêm cổng công khai `identity`, ví dụ `StaffDirectory.emailRecipients(tx, { userIds, owners, propertyId })`, trả `{ userId, email, audience, displayName }`;
  - worker gọi cổng đó;
  - mở rộng `module-boundaries` sang `src/jobs`: không SQL vào bảng của module khác.
- Trạng thái: Open

### FB-R3-ARC-INT-EMAIL-02
- Mức độ: Minor (việc của ARC)
- Vị trí: `integrations/notification/email-templates.ts` so với `architecture.md` bảng adapter (dòng `NotificationAdapter`: "nội dung render ở lõi theo `templateId` + `locale`"); thiếu ADR cho thư viện và nhà cung cấp mới
- Vấn đề: mẫu thư nằm trong lớp adapter, không ở lõi. Lựa chọn Google Workspace SMTP + nodemailer thay ESC-010 B (SES) chưa có ADR.
- Quyết định ARC: **chấp nhận lệch cho nhóm thư bảo mật nhân viên**. Đây là 4 mẫu cố định, không chứa dữ liệu nghiệp vụ, link hay mã, chỉ theo brand; để cùng adapter thì kiểm escape/chèn header ở một chỗ. Tin cho **khách** (đặt phòng, nhắc cọc, Zalo/ZNS sau này) vẫn render ở lõi `messaging` theo `templateId` + `locale` như kiến trúc.
- Đề xuất sửa: ARC viết ADR-015 "Email nhân viên qua Google Workspace SMTP (nodemailer)", ghi:
  - phạm vi;
  - giới hạn khoảng 2.000 thư/ngày;
  - mật khẩu ứng dụng bị thu hồi khi đổi mật khẩu hộp thư;
  - đường chuyển sang dịch vụ gửi thư khi có thư cho khách;
  - lệch ở trên.

  Cập nhật dòng `NotificationAdapter` trong `architecture.md`. INT không phải sửa mã.
- Trạng thái: Open

### FB-R3-ARC-INT-EMAIL-03
- Mức độ: Minor
- Vị trí: `email-dispatch.ts` – `EMAIL_LEASE_MS` 10 phút, `batch` 10, timeout SMTP 15 + 10 + 30 giây cho mỗi người nhận
- Vấn đề:
  - Trường hợp xấu (máy chủ treo, 10 hàng × vài người nhận × tới khoảng 55 giây) có thể vượt 10 phút thuê.
  - Hiện chỉ có một worker và tick không chồng nhau nên chưa xảy ra. Nhưng nếu OPS chạy 2 bản worker, hàng có thể bị nhận lại khi đang gửi, dẫn tới gửi trùng.
  - Lúc đó `finish()` của lượt đầu không cập nhật được gì (điều kiện `attempts = $2`) mà không log, nên mất `sentUserIds` của lượt đó.
- Đề xuất sửa:
  - dừng gửi tiếp trong lô khi đã dùng quá nửa thời gian thuê (các hàng còn lại trả về `failed` với độ trễ 0);
  - `finish()` cập nhật 0 hàng thì log `warn` `email lease lost` kèm id outbox;
  - ghi rõ trong `docker-compose.prod.yml`: worker chỉ 1 bản (đã đúng hiện nay).
- Trạng thái: Open

### FB-R3-ARC-INT-EMAIL-04
- Mức độ: Suggestion
- Vị trí: `worker.ts` (vòng email riêng), kế hoạch J18 `outbox.dispatch` (pg-boss, ghi chú đầu `worker.ts`)
- Vấn đề: khi J18 chung cho outbox ra đời, nó không được nhận hàng `staff.email`, nếu không sẽ có hai bộ gửi tranh nhau.
- Đề xuất: J18 lọc theo danh sách topic nó sở hữu, hoặc nhập `StaffEmailDispatcher` làm handler của topic `staff.email`. Ghi vào checklist khi làm J18.
- Trạng thái: Open

### FB-R3-ARC-INT-EMAIL-05
- Mức độ: Suggestion
- Vị trí: `worker.ts` – `createEmailAdapter` ném lỗi `CONFIG` thì **cả worker** không khởi động
- Vấn đề: khi thiếu hoặc rỗng tệp mật khẩu thì mọi job (J15 đóng folio, nhắc giữ chỗ…) cũng dừng, không chỉ email.
- Ý kiến ARC: **giữ** như vậy. Đây là cổng lúc triển khai: `init-secrets.sh` bắt buộc nhập ở production, nên dừng sớm tốt hơn chạy mà âm thầm không gửi cảnh báo bảo mật. Lỗi lúc chạy (mật khẩu bị Google thu hồi) chỉ log và thử lại, không làm dừng worker – đúng.
- Đề xuất: OPS làm đúng việc INT đã nêu, `ops-check` báo khi có hàng `staff.email` `dead` hoặc `failed` quá 1 giờ, để INV biết phải tạo lại mật khẩu ứng dụng.
- Trạng thái: Open

## Ghi chú cho vai khác
- **BE-B (Q51-6)**: ghi outbox `staff.email` mẫu `receiving_account_changed` (`owners: true`, `effectiveDate`) cùng giao dịch lưu/hủy tài khoản nhận cọc. Worker và mẫu đã sẵn.
- **SEC**: xác nhận giả định "bản gửi owner có tên hiển thị của nhân viên" (06.15).
- **s1-contracts R2**: hộp thư gửi là `info@ottimo.vn` theo INV 23/10, thay `booking@ottimo.vn`. ARC sẽ sửa câu R2 cùng ADR-015.

## Điểm làm tốt
- Gửi ngoài giao dịch, kèm thuê hàng và `sentUserIds`: chịu được sự cố mà không giữ khóa DB và không gửi trùng.
- Bí mật xử lý kỹ: mật khẩu chỉ ở tệp, chỉ worker cầm, nhập ẩn, `EMAIL_SMTP_URL` bị cấm. Thông báo lỗi và log không lộ địa chỉ.
- Test bằng máy chủ SMTP giả cục bộ chứng minh được ca STARTTLS bắt buộc: máy chủ không làm được TLS thì không bao giờ thấy AUTH hay thư.
