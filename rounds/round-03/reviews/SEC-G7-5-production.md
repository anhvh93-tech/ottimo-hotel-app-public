# SEC-G1/G2 trên production – G7-5 (SEC, 29/10/2026)

- Người ghi: SEC | Round 3 – bước **Kiểm thử** | Sau B2 (`outputs/OPS/b2-runbook.md` mục 5) và QA smoke production (`qa/qa3-rc1.md` mục 18).
- Căn cứ: `rounds/round-02/reviews/s3-SEC.md` 9.4–9.5 (định nghĩa SEC-G1/G2); `reviews/SEC-sprint1.md` 4.2–4.4 (phần ngoài vào đã đạt 26/10, 6 ý còn lại cho B2); `qc/v1-gate-checklist.md` G7-5.
- Cách làm (chỉ đọc), 29/10 17:05–17:25 giờ VN:
  - SSH `ottimo-admin`, khóa `~/.ssh/ottimo_ops`, `StrictHostKeyChecking=yes`, `BatchMode`. Host lấy từ phân giải `desk.ottimo.vn`, không ghi lại.
  - Trên máy chủ chỉ có `dc ps`, `docker inspect`, `sha256sum`, đọc log, `ss`, `ufw status`, `sshd -T`. Kết quả log chỉ in **số đếm**, không in dòng log.
  - DB: chỉ `SELECT` trong `BEGIN READ ONLY … ROLLBACK`. Chỉ in số đếm, giờ, tên hành động, loại phiên. Không in tên, hash, `ip_hmac`, số tài khoản hay bí mật.
- **Không** đăng nhập, không tạo tài khoản, không gửi form, không quét cổng từ ngoài, không thử tải. Không restart, deploy hay `printenv`. Không đụng `~/.ottimo/backup`.
- Dùng lại kết quả QA mục 18, không kiểm lại: header 3 SPA, TLS 1.3, chặn TLS 1.0/1.1, chứng chỉ, chuyển `http`→`https`, 401 khi chưa đăng nhập, `/health` và `/__test__` trả 404, `/v1/*` lạ trả `problem+json` không stack, GET ẩn danh không đặt cookie.

## 1. Kết luận

| Cổng | Kết quả | Còn lại |
|---|---|---|
| **SEC-G1** | **Đạt** | – |
| **SEC-G2** | **Đạt có điều kiện**: 5/6 ý B2 đạt hoặc đã có quyết định | (L-1) Đăng xuất chưa từng chạy trên production → **chờ INV**, 5 phút, trước D. Ý 5: thư bảo mật đi theo BUG-R3-032, SEC đã chấp nhận rủi ro. Ý 6: làm ở ngày D |
| Lỗi mới | 1 Minor (**P3**), 1 Suggestion. Không có P0, P1 hay P2 | Mục 4 |

SEC **không chặn** ngày mở vì G7-5. Điều kiện duy nhất trước D là L-1.

## 2. SEC-G1 – Đạt

SEC-G1 gồm BE-53, FE-07 và S4-39. Ba thẻ này Verified trên mã từ R2 (`s3-SEC.md` 9.5, 9.6, 10.1). Mục 4.3 của SEC-sprint1 ghi "image production = `2963675`". Ghi chú đó nay **đã cũ**: production đang chạy `sha-70fe734e9077` (`v1.0.0-rc.3`). SEC kiểm lại phần chênh như sau:

| Kiểm | Kết quả |
|---|---|
| Image đang chạy (`dc ps`) | api, worker, web, landing = `sha-70fe734e9077`, healthy. api, worker, web khởi động 27/10 08:36 giờ VN, `restarts=0` |
| `git diff 2963675 70fe734` trên các phần G1 và phần xác thực: `modules/registration`, `identity`, `crypto`, `files`, `audit`, `admin-web/src/pages/registration` | **Không đổi dòng nào.** 77 commit chênh chỉ chạm folio/trả phòng (ESC-031), giá đêm, bootstrap và landing. Bootstrap còn chặt hơn: tham số bảo mật kiểm theo biên SEC |
| Tham số lưu giữ trên production (đọc `config_parameter`) | Ảnh giấy tờ sau trả phòng **30** ngày; khai báo chưa xong **7** ngày; hồ sơ điền sẵn **3** tháng. Đúng đề xuất SEC-sprint1 5.1, giữ ràng buộc "hồ sơ ≤ 3 tháng" |
| Dữ liệu khách | `guest` 0, `guest_document` 0, `reservation` 0. Chưa có dữ liệu khách thật nên không có giấy tờ nào chịu rủi ro |

## 3. SEC-G2 – 6 ý còn lại từ SEC-sprint1 4.3

| # | Ý | Bằng chứng | Kết quả |
|---|---|---|---|
| 1a | Cookie phiên `__Host-`, `Secure`, `HttpOnly`, `SameSite` | `docker-compose.prod.yml` trên máy chủ có sha256 bằng `main` (`e155d7cc…`), trong đó cố định `COOKIE_SECURE_PREFIX: 'true'`. `config.ts` từ chối `false` ở production (dừng khởi động; `config.test.ts`), mà api đang healthy. Cookie do `session.service.ts:174` dựng: `__Host-ottimo_sid=…; HttpOnly; Secure; SameSite=Lax; Path=/`. Trình duyệt **loại** cookie `__Host-` nếu thiếu `Secure` hoặc `Path=/`, hoặc có `Domain`. INV đăng nhập được và Desk hiện 10 căn, nên cookie đã được nhận với đúng các thuộc tính đó | **Đạt** |
| 1b | Đăng xuất thì phiên mất | Log Caddy 72 giờ **không có** `POST /v1/auth/logout` nào. `audit_event` không có `auth.logout`. `user_session` không có dòng `revoked_reason = logout`. Lần "đăng xuất → đăng nhập lại" của B2 phần 6 thật ra là đăng nhập lại sau khi **hết phiên do không thao tác**: phiên 10:17 hết hạn idle lúc 12:34, phiên mới tạo lúc 16:59. Điều này **không** làm sai kết quả 2 bước (xem ý 2) | **Chưa kiểm được → L-1, chờ INV** |
| 2 | `MFA_ENFORCED=true` | OPS đọc `printenv` 28/10 11:06 (b2-runbook 5 #2). Container không khởi động lại từ 27/10 08:36, nên giá trị đó vẫn là giá trị đang chạy. Hành vi thật: lần đăng nhập 10:17 và 16:59 đều theo đúng chuỗi `POST /v1/auth/login` 401 (đòi mã) → `POST /v1/auth/login/mfa` 200. Phiên đầy đủ đang sống mà không qua 2 bước: **0** | **Đạt** |
| 3 | OWN mới: buộc đổi mật khẩu, rồi buộc đăng ký 2 bước | Chuỗi 28/10: 16:27 `auth.login_succeeded` (mật khẩu tạm, phiên `enrollment_only`) → 16:28 `user.password_changed` (phiên bị thu hồi lý do `password_changed`) → `mfa.setup_started` → 16:29 `mfa.enrolled` (phiên thu hồi lý do `mfa_enrolled`) → phiên `totp`. `c3_access_log` có 2 dòng `mfa_secret create`, có `session_id` | **Đạt** |
| 4 | Log Caddy: IP che /24, bỏ query | `Caddyfile.prod` trên máy chủ và bản mount trong container web có sha256 bằng `main` (`b62eaea9…`). Log web 72 giờ: 6.440 dòng, 6.366 bản ghi request. `remote_ip`/`client_ip` đã che /24: **6.366/6.366**. URI còn query thô: **0** (202 dòng đã thành `?[q]`). `/g/` chưa che: **0**. Khóa `headers`: **0**. Cookie, Authorization, CSRF: **0**. Dòng có IPv4 công khai chưa che, tính mọi logger (gồm lỗi TLS): **0**. Log api và worker 72 giờ: **0** IPv4 công khai. Edge nginx: `access_log off`, `error_log crit` | **Đạt** |
| 5 | Thư `receiving_account_changed` tới hộp thư | Outbox: `staff.email receiving_account_changed` **dead NO_RECIPIENT** (1 dòng). Thư không đi vì tài khoản chưa có email. Đây đúng là **BUG-R3-032** đã biết. SEC đã chấp nhận chạy 02/11 với biện pháp bù B1–B6 (`SEC-on-B2-readiness.md` 1.3), email người dùng là điều kiện bắt buộc ở v1.0.1, hạn 09/11. Hai dòng `staff.push` ở trạng thái `pending` là bình thường: v1.0 không có bộ gửi push, chuông trong app vẫn có | **Chưa đạt, đã có quyết định** (không phải lỗi mới) |
| 6 | Lễ tân không thấy C3 khi chưa step-up; xem ảnh thì ghi `c3_access_log` | Chưa có khách. Cơ chế ghi log đang chạy (ý 3). Kiểm ở **ngày D**, với giấy tờ thật đầu tiên | Ngày D, như kế hoạch |

**Phần hạ tầng của G2 (gồm bundle edge, FB-R3-SEC-OPS-01):**

| Kiểm | Kết quả |
|---|---|
| `edge.sh`, `edge/docker-compose.edge.yml` trên máy chủ | sha256 bằng `main` (`73a4db68…`, `ca7ebe45…`), không đổi từ lần kiểm 26/10 (OPS 19.5) |
| Container edge | Chạy từ 24/10 08:15, `nginx.conf` không sửa từ 24/10 08:15. Đây là bản đã so khớp ngày 26/10. `read_only`, `cap_drop ALL`, image ghim digest |
| Cổng đang nghe (đọc `ss` trên máy chủ, không quét từ ngoài) | Công khai: chỉ **22, 80, 443**. Cổng 53 chỉ trên loopback. Postgres không mở cổng |
| `ufw` | Bật. Mặc định chặn vào. Chỉ cho 22, 80, 443 (cả IPv6) |
| `sshd -T` | `passwordauthentication no`, `kbdinteractiveauthentication no`, `permitrootlogin no`, `pubkeyauthentication yes`, `maxauthtries 4`. `unattended-upgrades` đang chạy. **`fail2ban` không chạy** → FB-R3-SEC-OPS-06 |
| Vai DB | `ottimo_app`, `ottimo_migrator`, `ottimo_owner`: không phải superuser, không `BYPASSRLS`. `ottimo_readonly` có `BYPASSRLS`, đúng thiết kế (`NOLOGIN`, chỉ dùng cho sao lưu và tra sự cố – `02-roles.sh`) |
| `/metrics`, `/v1`, `/api` trả 200 HTML (ghi nhận QA 18.2) | Đây là `index.html` của SPA, đã chấp nhận ở SEC-sprint1 4.3. Không đổi |

## 4. Thẻ mới

### FB-R3-SEC-OPS-06
- Mức độ: Minor (bug **P3**, rủi ro SEC Low)
- Vị trí: VPS production và staging. `infra/server/bootstrap-vps.sh:77` không cài `fail2ban`
- Vấn đề: SR-OPS-01 và TM-49 có yêu cầu `fail2ban`, nhưng trên máy chủ `systemctl is-active fail2ban` trả `inactive` và script bootstrap không cài gói này. Cổng 22 mở cho mọi IP.
- Vì sao quan trọng: SSH chỉ nhận khóa, đã tắt mật khẩu và root. Vì vậy rủi ro chiếm máy là thấp. Phần còn lại là nhật ký bị dò mật khẩu làm đầy, và không có lớp chặn thứ hai nếu sau này lỡ bật lại mật khẩu.
- Đề xuất sửa: thêm `fail2ban` (jail `sshd`) vào `bootstrap-vps.sh`, cài trên production và staging ngoài giờ khách. Hoặc giới hạn IP SSH bằng `ssh_allow` nếu INV có IP cố định. Nếu không làm, ARC/SEC sửa SR-OPS-01 cho khớp thực tế. Hạn: v1.0.x. **Không chặn D.**
- Trạng thái: Open

### FB-R3-SEC-FE-A-17
- Mức độ: Suggestion
- Vị trí: `apps/admin-web/src/session/SessionProvider.tsx:148-160` (`logout`)
- Vấn đề: `api.logout()` lỗi vì **bất kỳ** lý do nào (mất mạng, 403 CSRF, 5xx) thì đều bị bỏ qua, rồi màn hình về trang đăng nhập. Khi đó server chưa thu hồi phiên, nên cookie `HttpOnly` vẫn còn. Trên máy quầy dùng chung, người sau tải lại trang có thể vào lại phiên cũ, tối đa 30 phút kể từ lần thao tác cuối.
- Vì sao quan trọng: máy quầy dùng chung (SR-PWA-04). Nhân viên tin là mình đã đăng xuất.
- Đề xuất sửa: chỉ bỏ qua 401 (phiên đã hết). Với lỗi khác thì báo "Chưa đăng xuất được – thử lại" và giữ nút. v1.1.
- Trạng thái: Open

## 5. Việc chờ INV

**L-1 – kiểm đăng xuất (5 phút, trước D 02/11). SEC không đăng nhập.**
1. INV đăng nhập Desk `desk.ottimo.vn`, thao tác một việc bất kỳ, để phiên **đang sống** (chưa quá 30 phút không thao tác).
2. Bấm menu tài khoản → **Đăng xuất**. Desk về màn đăng nhập.
3. Bấm **Back** của trình duyệt, rồi tải lại `desk.ottimo.vn`. Đạt khi vẫn ở màn đăng nhập, không vào lại được Desk.
4. Báo ORC giờ đăng xuất. OPS hoặc SEC chạy truy vấn chỉ đọc: `user_session` có ít nhất 1 dòng `revoked_reason = 'logout'`, và `audit_event` có `auth.logout` đúng giờ đó.
5. Không bắt buộc: trước bước 2, mở DevTools → Application → Cookies → `desk.ottimo.vn`. Thấy `__Host-ottimo_sid` có HttpOnly, Secure, SameSite Lax. Sau bước 2, cookie này mất. Không chụp giá trị cookie.

Bước 3 không đạt, hoặc bước 4 không có dòng `logout`, thì gõ `/feedback P1 đăng xuất không thu hồi phiên`. SEC xem lại trước D.

## 6. Ghi chú cho ORC, OPS, QC (không thuộc G7-5)

- **Sửa biên bản B2 phần 6:** câu "INV đăng xuất Desk, đăng nhập lại…" chưa đúng, vì server không nhận lệnh đăng xuất (mục 3, ý 1b). Kết quả G2-7 phần chủ, tức đăng nhập lại có đòi mã 6 số, **vẫn đúng**.
- **Decision-log 29/10 (1 tài khoản giữ 6 vai)** ghi "quản lý đã đăng nhập và đăng ký 2 bước (INV báo)". DB 17:05 cho thấy: tổng 2 người dùng, 1 người bật 2 bước, 1 người còn mật khẩu tạm; mọi phiên và mọi `auth.login_succeeded` đều của chủ. Tài khoản 6 vai **chưa đăng nhập lần nào**, khớp OPS phần 6. Rủi ro hiện tại thấp: với `MFA_ENFORCED`, mật khẩu tạm chỉ mở được màn đổi mật khẩu và đăng ký 2 bước. Nhưng mật khẩu tạm không hết hạn. Vì vậy cần đăng nhập lần đầu sớm (G2-7 MGR, trước D). Nếu mật khẩu tạm đã đưa qua kênh không an toàn, OWN đặt lại trước khi giao.
- **OPS:** điều kiện "xóa 2 bản `state/env.before-*` khi SEC-G1/G2 xong" (`b2-runbook.md` mục 4, `v1-production.md` 19.1) đã đủ ở phần cấu hình: ý 2 và ý 4 đạt. OPS xóa khi làm mới bundle ngoài giờ khách.
- **Việc SEC còn treo trước D, không thuộc G1/G2, chưa thấy dòng theo dõi trong `v1-gate-checklist.md`:** thêm câu về hạn lưu vào thông báo chung `gw.notice_body` và nâng `privacy-2026-10-v2` (`SEC-sprint1.md` 5.2). Repo `main` chưa có `privacy-2026-10-v2`. Production đã đặt hồ sơ điền sẵn 3 tháng, nên câu này cần có **trước khách thật đầu tiên dùng check-in online**. Đề xuất QC thêm một dòng. Người làm: UXD duyệt chữ, FE-B làm, OWN đặt `privacy_notice_version`.
