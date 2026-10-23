# SEC review – INT: email thật qua Google Workspace SMTP (v1.0)

- Người review: SEC | Ngày: 23/10/2026 | Round 3 Sprint 1 – Bước Review (bắt buộc).
- Đối tượng: nhánh `int-r3-smtp`, commit `463592b`. Báo cáo `rounds/round-03/outputs/INT/s1-email.md` (trên nhánh). ARC đã cho gộp (`reviews/s1-ARC-on-INT-email.md`).
- Đối chiếu:
  - SEC `s1-security-requirements.md` 06.15, 06.33, C (Q51-6);
  - SR-KEY-10 (bí mật chỉ qua tệp), SR-LOG-02 (log);
  - quyết định INV 23/10: gửi từ `info@ottimo.vn` qua Google Workspace.
- Tệp này không ghi mật khẩu, địa chỉ email thật hay bí mật nào. Dữ liệu dùng để kiểm là dữ liệu giả.

## 1. Kết luận

**`463592b` gộp được.** Blocker: 0. **Major: 1** (FB-R3-SEC-INT-EMAIL-01). Minor: 2. Suggestion: 1.

Thẻ Major **không chặn gộp mã**: mã an toàn, và staging chạy `mock`. Nhưng thẻ này là **điều kiện trước khi đặt mật khẩu thật và bật `EMAIL_PROVIDER=smtp` trên production**.

| Hạng mục ORC hỏi | Kết luận |
|---|---|
| Mật khẩu ứng dụng chỉ từ tệp secret, chỉ worker mount | **Đạt.** Secret `email_smtp_password` chỉ có trong `secrets` của worker (uid 1000, 0400); api không có. `safe-config` từ chối `EMAIL_SMTP_PASSWORD` thô ở staging/production. `EMAIL_SMTP_URL` (dạng URL chứa mật khẩu) bị bỏ. `check-compose` thêm hai tên này vào danh sách cấm. |
| TLS bắt buộc 465/587 | **Đạt.** Chỉ nhận cổng 465 (`secure`) hoặc 587 (`requireTLS`). `rejectUnauthorized: true`, TLS ≥ 1.2, có `servername`. Không có đường gửi `AUTH` khi chưa mã hóa. |
| Log không có địa chỉ / nội dung | **Đạt.** `logger:false`, `debug:false`. Lỗi map thành mã + số trạng thái SMTP, không dùng chữ máy chủ trả về. Outbox chỉ có id + tên mẫu. `last_error` chỉ là mã. Test kiểm log và payload không có `@`. Một điểm nhỏ ở S-1. |
| Mẫu thư không link / mã / số tài khoản | **Đạt.** 4 mẫu cố định. Không link, không mã, không tên đăng nhập, không số tài khoản (mẫu `receiving_account_changed` chỉ báo "đã đổi, hiệu lực từ ngày …"). Có câu "OTTIMO không bao giờ hỏi mật khẩu hay mã qua email". Tham số được escape HTML và lọc ký tự điều khiển. Tiêu đề thư chỉ là chữ cố định, nên không chèn header được. `disableFileAccess` / `disableUrlAccess`. Mẫu lạ bị từ chối. |
| `init-secrets.sh` prompt ẩn | **Đạt.** `read -rs`, nhập hai lần để xác nhận, `set +x`, `umask 077`. Giá trị ghi bằng `printf` builtin, không hiện trong `ps`. Không nhận qua tham số hay ống dẫn: production không có TTY thì dừng. `--reset-email-password` để thay mật khẩu. |
| Production chặn mock | **Đạt, hai lớp.** `safe-config` (api và worker không khởi động) và `createEmailAdapter` (worker). Thiếu hay rỗng tệp mật khẩu → worker không khởi động. |
| Giả định "thư gửi owner có tên hiển thị nhân viên" | **SEC xác nhận** (mục 3). |

## 2. Kiểm đã chạy

Worktree tạm ở `463592b`, Postgres 17 riêng (cổng 56635), role `ottimo_app`. Worktree và container đã xóa.

- `integrations` vitest: **175/175**, gồm test SMTP với máy chủ SMTP giả trên máy (TLS 465, STARTTLS 587, từ chối khi không có TLS).
- api `tsc`: đạt.
- `email-adapter`, `integration/email-dispatch`, `config`, `integration/mfa-us143`: **66/66**.
- Đọc diff: `smtp.ts`, `email-templates.ts`, `safe-config.ts`, `email-adapter.ts`, `email-dispatch.ts`, `worker.ts`, `init-secrets.sh`, `docker-compose.prod.yml`, `check-compose.sh`, các tệp `env*.example`.

## 3. Giả định tên hiển thị trong thư gửi owner: **xác nhận**

Bản sao gửi `owner` (06.15 mã khôi phục, `mfa_reset`, `mfa_reset_by_operator`) ghi **tên hiển thị** của nhân viên liên quan. SEC chấp nhận, vì:
- đây là thông tin nội bộ owner đã thấy ở `/settings/users`;
- không có tên đăng nhập, SĐT, email, mã hay link;
- không có dữ liệu khách;
- thiếu tên thì owner không biết phải kiểm với ai, và cảnh báo mất tác dụng.

Kèm điều kiện:
- (a) chỉ dùng tên hiển thị, không bao giờ dùng `username`;
- (b) chỉ trong 4 mẫu nhân viên này, tin cho khách không theo tiền lệ này;
- (c) nội dung đi qua Google (đối tác xử lý email sẵn có của OTTIMO) gồm địa chỉ email nhân viên/owner và tên hiển thị. PO ghi vào danh mục xử lý dữ liệu (DRA, mục đối tác) khi cập nhật.

## 4. Thẻ

### FB-R3-SEC-INT-EMAIL-01
- Mức độ: **Major** (điều kiện bật production, không chặn gộp mã)
- Vị trí: thiết kế xác thực SMTP: `EMAIL_SMTP_USER` = `info@ottimo.vn` + **mật khẩu ứng dụng** của chính hộp thư đó (`smtp.ts`, `init-secrets.sh`, `inv-production-steps.md` phần 8).
- Vấn đề: mật khẩu ứng dụng Google không chỉ dùng để gửi thư. Nó mở được **toàn bộ hộp thư** `info@ottimo.vn`: đọc thư qua IMAP, gửi thư dưới tên OTTIMO. Mật khẩu này cũng **bỏ qua** xác minh 2 bước của hộp thư. `info@` là hộp thư liên hệ chung, nên có thể chứa thư của khách, OTA, ngân hàng: những dữ liệu vốn **không** nằm trên VPS. Nếu VPS hay tệp secret bị lộ, phạm vi thiệt hại lan từ "gửi được thư báo nhân viên" thành "đọc được hộp thư công ty và giả danh OTTIMO gửi cho khách".
- Vì sao quan trọng: tên miền thật kèm hộp thư thật là công cụ lừa đảo chuyển cọc rất hiệu quả. Ngoài ra còn lộ thư của khách (NĐ 13).
- Đề xuất sửa (chọn một; SEC ưu tiên A):
  - **(A) Dịch vụ SMTP relay của Google Workspace** (`smtp-relay.gmail.com`), xác thực bằng **địa chỉ IP cố định của VPS**, đặt "chỉ địa chỉ thuộc tên miền của tôi" và "bắt buộc TLS". Không có mật khẩu nào lưu trên máy chủ. From vẫn có thể là `info@ottimo.vn` (hoặc `no-reply@`), không tốn thêm phí, không mở quyền đọc hộp thư.
    - Mã cần đổi ít: cho phép bỏ `auth` khi `EMAIL_SMTP_HOST = smtp-relay.gmail.com`, vẫn giữ TLS và kiểm chứng chỉ; `init-secrets.sh` bỏ câu hỏi mật khẩu khi dùng relay.
    - INV cấu hình trong Admin console theo hướng dẫn INT bổ sung vào `inv-production-steps.md`.
  - **(B)** Một tài khoản gửi riêng (ví dụ `no-reply@`) không dùng cho việc gì khác, có mật khẩu ứng dụng riêng. Cách này có phí giấy phép Workspace, nên phải qua ESC cho INV quyết.
  - **(C)** Giữ nguyên và chấp nhận rủi ro. Đây là quyết định của INV (ESC), SEC không khuyến nghị.
- Nếu (A) không làm được vì gói Workspace không có SMTP relay: INT báo ORC, ORC lập ESC giữa (B) và (C).
- Hạn: **trước khi nhập mật khẩu hay bật `smtp` trên production** (bước 8 của INV). Staging tiếp tục chạy `mock`.
- Trạng thái: Open

### FB-R3-SEC-INT-EMAIL-02
- Mức độ: Minor
- Vị trí: `services/api/src/jobs/email-dispatch.ts` (`EMAIL_LEASE_MS` 10 phút; lô 10 hàng; mỗi người nhận có thể mất tới khoảng 55 giây theo các timeout của `smtp.ts`).
- Vấn đề: một lượt có nhiều hàng và nhiều người nhận, khi SMTP chậm, có thể chạy lâu hơn thời hạn giữ hàng (lease). Worker khác (hoặc lượt sau) sẽ nhận lại hàng đó và gửi trùng. Bước `finish` của lượt đầu khi đó không ghi được, vì `attempts` đã đổi.
- Vì sao quan trọng: thư bảo mật trùng lặp làm người nhận quen bỏ qua cảnh báo. Mức thấp.
- Đề xuất sửa: lease ≥ (lô × số người nhận tối đa × timeout tổng), hoặc gia hạn lease trước mỗi lần gửi. Hoặc đơn giản: mỗi lượt chỉ xử lý một hàng khi gặp lỗi `TIMEOUT`.
- Hạn: Sprint 2.
- Trạng thái: Open

### FB-R3-SEC-INT-EMAIL-03
- Mức độ: Minor
- Vị trí: `email-dispatch.ts` `claim()`: bản sao cho owner khi `outbox_message.property_id` NULL (ví dụ lệnh 06.33 của OPS) đi tới **mọi owner của mọi cơ sở trong tổ chức**.
- Vấn đề: với OTTIMO một cơ sở thì đúng. Khi có nhiều cơ sở, owner của cơ sở khác cũng nhận thông báo về nhân viên không thuộc cơ sở mình.
- Vì sao quan trọng: lộ tên nhân viên và sự kiện bảo mật ra ngoài phạm vi cơ sở. Mức thấp, và chỉ xảy ra trong cùng tổ chức.
- Đề xuất sửa: khi `property_id` NULL, chỉ gửi owner của những cơ sở mà người liên quan có vai. Gộp vào cổng `identity` mà ARC đề xuất ở FB-R3-ARC-INT-EMAIL-01.
- Hạn: khi mở cơ sở thứ hai (R4+).
- Trạng thái: Open

### Suggestion S-1 (INT)
`worker.ts`, nhánh `email dispatch failed`: log `err.message` của lỗi không lường trước. Lỗi DB hay thư viện có thể kèm giá trị. Nên chỉ log `err.name` / `code`, giống cách `asIntegrationError` đã làm.

## 5. Điểm làm tốt
1. Mật khẩu ứng dụng chỉ nằm ở một nơi: tệp secret của worker, nhập bằng prompt ẩn có xác nhận. Cấu hình kiểu URL chứa mật khẩu bị bỏ hẳn, có kiểm ở cả `safe-config` và `check-compose`.
2. Lỗi SMTP được thu về mã + số trạng thái, không dùng chữ máy chủ trả về. Outbox không lưu địa chỉ. Test kiểm `@` không xuất hiện trong log và payload.
3. Mẫu thư theo đúng nguyên tắc "thư bảo mật không có link", có câu nhắc chống lừa đảo, song ngữ theo brand.
