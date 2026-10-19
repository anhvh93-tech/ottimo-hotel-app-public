# Yêu cầu bảo mật – OTTIMO Desk

- Người lập: SEC | Round 1 – Bước 2 Sản xuất – Đợt 4 (Phần 2) | Ngày: 15/10/2026 | Phiên bản: **0.3** (16/10/2026 – Round 2 Sprint 1 vòng sửa: áp quyết định SEC ở `rounds/round-02/outputs/SEC/s1-decisions.md` và `w1-review.md`; v0.2: Bước 4 R1 – 10 thẻ ARC-on-SEC, phân xử ORC nhận phòng khuya/khách không email)
- Đầu vào: `threat-model.md` (TM-01…TM-60), `data-risk-assessment.md` (gọi tắt **DRA**: C0–C3, D01–D28, T01–T18, R-CON, R-DSR, R-REG, R-PAY), `architecture.md`, `adr/ADR-001…013`, `erd.md`, `api/openapi.yaml`, `rbac-matrix.md`, `integrations.md`, `product/integrations/README.md`, `infra/*`, `.github/workflows/ci.yml`, `.env.example`.
- Cách dùng: mỗi yêu cầu có mã **SR-<nhóm>-<số>**, cách **kiểm chứng** (ai cũng kiểm lại được), **round** phải đạt và **vai** chịu trách nhiệm. BE/FE/MOB/INT/OPS dẫn mã SR trong PR; QA dẫn mã SR trong test case; SEC dùng làm checklist review R2 và kiểm tra tổng R3.
- Mức: **B** = bắt buộc (không đạt = lỗi bảo mật, mức theo threat model; Critical → SEC chặn phát hành) · **N** = nên có (lệch phải ghi lý do trong PR).
- Round: **R2** = phải đạt khi tính năng liên quan hoàn thành ở R2 · **R3** = đạt trước bản RC · **GL** = đạt trước khi đưa dữ liệu khách thật vào (go-live).
- Mọi con số ở đây (thời gian, ngưỡng) là **tham số kỹ thuật** do SEC đặt; con số thuộc nghiệp vụ/pháp lý dẫn sang BR hoặc DRA mục 7. Tham số xác thực (`session_policy`, `login_lockout`) thuộc `x-security-parameters` – chỉ OWN sửa **trong biên cứng SEC đặt** (mục 1.1).
- "Test với `Clock` giả" = unit test dùng `FixedClock`; E2E/staging dùng `CLOCK_MODE=mutable` + endpoint kiểm thử `/__test__/clock` (chỉ nạp khi `INCLUDE_TEST_SUPPORT=1`, cần `X-Test-Token` + phiên owner, cấm ở production – SR-SECR-05). Không còn biến `CLOCK_OVERRIDE`.

> Tài liệu này không khẳng định "tuân thủ pháp luật". Nó liệt kê biện pháp kỹ thuật; phần pháp lý cần luật sư xác nhận (ESC-001).

---

## 1. Xác thực nhân viên (SR-AUTH)

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-AUTH-01 | B | Mỗi nhân viên một tài khoản riêng (`app_user`), đăng nhập bằng tên đăng nhập + mật khẩu. Không có tài khoản mặc định trong seed production; tài khoản OWN đầu tiên tạo bằng lệnh CLI một lần, in ra mật khẩu tạm buộc đổi ở lần đầu | Seed production không có user; test CLI; đăng nhập lần đầu bị bắt đổi mật khẩu | R2 | BE | TM-01 |
| SR-AUTH-02 | B | Mật khẩu **10–256 ký tự** (đếm sau `normalize('NFKC')`); không bắt buộc loại ký tự; không bắt đổi định kỳ, bắt đổi khi nghi lộ. **Từ chối** (`422 PASSWORD_TOO_COMMON`) khi: (a) nằm trong **danh sách mật khẩu phổ biến ≥ 10.000 dòng** – tệp offline trong repo `services/api/src/modules/identity/public/common-passwords.txt` (NFKC, chữ thường, bỏ trùng, sắp xếp, UTF-8 không BOM); (b) sau khi bỏ chữ số/ký tự đặc biệt ở **cuối** trùng một mục trong danh sách (`Dalat123456!` → `dalat`); (c) chứa tên đăng nhập hoặc `ottimo`. **Nguồn danh sách**: (A) SecLists `Passwords/Common-Credentials/` (bộ top 1.000.000 của "10-million-password-list" + `100k-most-used-passwords-NCSC.txt`), lọc độ dài 10–256, thiếu 10.000 thì lấy thêm theo thứ hạng; (B) danh sách tiếng Việt/ngữ cảnh do SEC + DOM soạn (`matkhau`, `anhyeuem`, `khachsan`, `dalat`, `ottimo`, tên cơ sở, `letan`, `quanly`… + hậu tố năm/`123`/`@123`/`!`). **Cấm** dùng rockyou/bản dump không rõ giấy phép và Pwned Passwords API trực tuyến. **Giấy phép**: SecLists công bố MIT, tệp NCSC có thể kèm ghi công (CC BY 4.0) – người tải **kiểm lại giấy phép tại thời điểm tải** và ghi vào `common-passwords.SOURCE.md` (URL + commit nguồn, giấy phép, ngày tải, lệnh lọc tái lập được, số dòng, SHA-256); giấy phép khác dự kiến → chỉ dùng phần MIT + nguồn B. Nạp một lần khi khởi động vào `Set`; staging/production thiếu tệp hoặc < 10.000 dòng → **dừng khởi động**. Áp cho **mọi** chỗ đặt mật khẩu: `changeMyPassword`, `createUser.initialPassword`, `updateUser.resetPassword`, CLI tạo OWN đầu tiên | Unit test: `12345678abc`, `ottimo2026`, `Dalat123456!` bị từ chối; chuỗi 10 ký tự ngẫu nhiên được nhận; 9 ký tự và 257 ký tự → 422; tệp ≥ 10.000 dòng, SHA-256 khớp `SOURCE.md`; một mẫu từ nguồn A và B bị từ chối; startup check staging thiếu tệp → dừng | R2 | BE, OPS (tải + SOURCE), SEC + DOM (nguồn B) | TM-01 |
| SR-AUTH-03 | B | Băm **argon2id** (m = 19 MiB, t = 2, p = 1 hoặc mạnh hơn), muối riêng; mật khẩu và PIN không bao giờ log, không trả về, không vào audit | Kiểm chuỗi băm bắt đầu `$argon2id$`; grep log test không có mật khẩu | R2 | BE | TM-01 |
| SR-AUTH-04 | B | Sai `login_lockout.maxFailures` (mặc định 5) lần liên tiếp/tài khoản → **khóa tạm** `lockMinutes` (mặc định 15 phút); lần khóa thứ `hardLockAfterLocks` (mặc định 3) trong `lockWindowHours` (mặc định 24 giờ) → **khóa cứng** tới khi OWN mở; biên tham số ở mục 1.1. Cộng giới hạn theo IP (SR-RL-01). Bộ đếm sai và số lần khóa cập nhật **nguyên tử** (tăng trong SQL hoặc `FOR UPDATE`, không ghi giá trị đọc + 1) để yêu cầu song song không làm mất lần đếm. **Khóa tạm và khóa cứng chỉ chặn đăng nhập mới; không hủy, không từ chối phiên đang sống** của người đó (khóa tạm dùng `locked_until`, không đổi `app_user.status`; khóa cứng không gọi thu hồi phiên) – tránh kẻ ngoài gõ sai 5 lần để đá lễ tân đang làm việc (DoS). OWN cần đá phiên → **vô hiệu hóa tài khoản** (`updateUser status=disabled`, thu hồi phiên theo SR-SES-06). Mỗi lần khóa ghi `audit_event security` và tính vào cảnh báo SR-LOG-06. Thông báo lỗi luôn chung "Tên đăng nhập hoặc mật khẩu không đúng"; thời gian phản hồi đồng đều khi tên không tồn tại | Test API: lần 6 trả `429 RATE_LIMITED`; tên không tồn tại và mật khẩu sai trả cùng body; N yêu cầu sai song song → bộ đếm tăng N; phiên A đang mở, client khác gửi 5 lần sai cùng tên → request kế tiếp của phiên A vẫn 200 (cả khi khóa cứng); hết khóa tạm, phiên cũ không "sống lại" ngoài hạn SR-SES-03 | R2 | BE | TM-01, TM-02 |
| SR-AUTH-05 | B | OWN đặt lại mật khẩu cho người khác (A100) → mật khẩu tạm, cờ `must_change_password`, thu hồi mọi phiên của người đó; người dùng tự đổi mật khẩu tại `POST /v1/me/password` (cần mật khẩu cũ) | Test: sau reset, phiên cũ 401; đăng nhập bằng mật khẩu tạm chỉ được gọi đổi mật khẩu | R2 | BE, ARC (thêm endpoint) | TM-03 |
| SR-AUTH-06 | B | **2FA TOTP (RFC 6238) bắt buộc với vai `owner` và `manager`**; khuyến nghị `front_desk_lead`. Bí mật TOTP lưu `_enc` (DEK). 10 mã khôi phục dùng một lần (băm). Mất thiết bị: OWN khác hoặc quy trình CLI có ghi nhật ký. Không dùng SMS OTP (chi phí, SIM swap) | Test E2E đăng nhập OWN không có mã TOTP → không vào được; đăng ký/thu hồi 2FA ghi `audit_event security` | R3 (bắt buộc trước GL) | BE, FE | TM-01 |
| SR-AUTH-07 | B | Đổi mật khẩu, bật/tắt 2FA, đặt PIN duyệt, khóa tài khoản, đổi vai → ghi `audit_event` loại `security`; gửi thông báo trong app cho chính người đó | Test kiểm bản ghi audit | R2 (R3 với 2FA) | BE | TM-03 |
| SR-AUTH-08 | B | Cấm tài khoản dùng chung ("letan", "quay1"). Quy định trong hướng dẫn vận hành; OWN rà danh sách tài khoản hằng tháng | Rà danh sách user; tài liệu vận hành R3 | R3 | PO, INV | TM-01, TM-02 |
| SR-AUTH-09 | B | **PIN duyệt** (BR-432): 6 chữ số, argon2id, khác mật khẩu; sai 5 lần → khóa duyệt 15 phút; yêu cầu duyệt chỉ chấp nhận PIN của **chính** tài khoản đang đăng nhập (không chọn tên người duyệt) – ngoại lệ có phạm vi duy nhất: SR-AUTH-11 | Test: dùng PIN người khác → `401 REAUTH_FAILED`; khóa sau 5 lần | R2 | BE | TM-06 |
| SR-AUTH-10 | N | Hiển thị cho người dùng "đăng nhập gần nhất lúc… từ thiết bị…" trên màn hình chính | Kiểm giao diện | R3 | FE | TM-01 |
| SR-AUTH-11 | B | **Người khác xác nhận tại quầy** – ngoại lệ có phạm vi của SR-AUTH-09/SR-AZ-07 (SEC 18/10, `reviews/s4-SEC-lateFee-reauth.md`). **Chỉ** cho `checkOut.lateFeeInsteadOfNight` (gồm `requestFoc` lồng – BR-416-06, D5). Mọi chỗ mới muốn kiểm mật khẩu/PIN của người **không phải** người gọi đều phải qua SEC review trước. Điều kiện: (1) **Một hàm riêng** (không dùng `PasswordReauth.verify`). Người xác nhận được tìm **dưới RLS** của người gọi, ghép `user_property_role` theo cơ sở trên đường dẫn, chưa thu hồi, vai owner/manager; không dùng hàm tìm người dùng toàn cục; tên chuẩn hóa như lúc đăng nhập. (2) **Đủ điều kiện** = `active`, không bị khóa đăng nhập (tạm hoặc cứng), không `must_change_password`, không `mfa_enabled` khi server chưa kiểm được yếu tố thứ hai (fail-closed). (3) Luôn chạy argon2 **đúng 1 lần** (băm giả khi không đủ điều kiện). **Không bao giờ** kiểm mật khẩu của tài khoản không đủ điều kiện. Mọi nhánh lỗi trả **cùng** `401 REAUTH_FAILED` ở ô `secret` của operation. (4) Mỗi lần sai đếm cho **người gọi và người xác nhận** (SR-RL-02). (5) Vai và hạn mức (BR-433) lấy theo người xác nhận, đọc từ DB. Không mở cửa sổ step-up C3, không ghi gì vào phiên nào. (6) Audit `money` ghi người gọi, người xác nhận, vai người xác nhận, `authMethod`, kênh `desk`/`self`. Audit `security` khi sai, không ghi chuỗi tên gõ vào. Thông báo trong app cho người xác nhận mỗi lần tài khoản của họ được dùng trên phiên người khác; `security_alert` cho người đó và OWN khi bị khóa. (7) `secret` được che ở **mọi độ sâu** trong log. (8) Kiểm điều kiện nghiệp vụ (chỉ đọc) **trước** khi kiểm mật khẩu. (9) **Trước GL**: trần theo ngày (≥ 2 lần khóa/24 giờ → khóa đường này 24 giờ + cảnh báo OWN) và bắt buộc phiên `device_trusted` của cơ sở. **R3**: đường này chỉ nhận PIN, hoặc mật khẩu + TOTP. Xác nhận từ xa trên thiết bị của chính quản lý: US-164. Vận hành: cấm đọc mật khẩu qua điện thoại/tin nhắn | Test 401 đồng nhất cho các trường hợp: tên không có / vai FD / MGR cơ sở khác / `disabled` / khóa đăng nhập / `must_change_password` / `mfa_enabled` / sai mật khẩu; mật khẩu **đúng** của tài khoản FD → 401; bộ đếm hai phía; log/audit/`idempotency_key`/Problem không chứa mật khẩu thử; thông báo cho người xác nhận | R2 (1–8), GL (9), R3 (PIN/TOTP) | BE, ARC, FE | TM-06 |

### 1.1 Biên cứng của tham số xác thực (`x-security-parameters`)

`session_policy` và `login_lockout` là **tham số bảo mật**: nằm trong `setParameter.x-security-parameters`, `is_security = true`, chỉ OWN sửa, mỗi lần sửa ghi `audit_event` `category=security`. Giá trị ngoài biên → `422 PARAM_OUT_OF_RANGE` kèm `min`/`max` của khóa con – **kể cả với OWN**. Nguyên tắc: chỉ cho **chặt hơn hoặc bằng** SR; thời gian khóa có trần để khóa không thành công cụ từ chối dịch vụ. Đổi biên = SEC duyệt.

| Khóa con | Biên (min–max) | Mặc định | SR |
|---|---|---|---|
| `session_policy.admin.idleMinutes` | 5–30 | 30 | SR-SES-03 |
| `session_policy.admin.maxHours` | 1–12 | 12 | SR-SES-03 |
| `session_policy.staff_pwa.idleMinutes` | 60–4320 (72 giờ) | 4320 | SR-SES-03 |
| `session_policy.staff_pwa.maxHours` | 24–720 (30 ngày) | 720 | SR-SES-03 |
| `login_lockout.maxFailures` | 3–5 | 5 | SR-AUTH-04 |
| `login_lockout.lockMinutes` | 15–60 | 15 | SR-AUTH-04 |
| `login_lockout.hardLockAfterLocks` | 2–3 | 3 | SR-AUTH-04 |
| `login_lockout.lockWindowHours` | 24–72 | 24 | SR-AUTH-04 |

Ràng buộc chéo: `idleMinutes ≤ maxHours × 60` cho từng kênh. Phạm vi: SEC khuyến nghị **cấp tổ chức** (đăng nhập chưa có cơ sở); nếu ARC giữ cấp cơ sở thì khi đăng nhập/kiểm phiên dùng giá trị **chặt nhất** trong các cơ sở của người dùng – không lấy theo thứ tự mã cơ sở. Kiểm chứng: test biên (ngoài biên với owner → 422; trong biên → 200 + audit `security`); test người có vai ở 2 cơ sở nhận giá trị chặt nhất. Vai: ARC (hợp đồng), BE (migration `bounds`, `parameter-rules.ts`).

## 2. Phiên (SR-SES)

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-SES-01 | B | Phiên phía server (`user_session`), token phiên ngẫu nhiên ≥ 256 bit, DB chỉ lưu SHA-256. Cookie `__Host-ottimo_sid`: `HttpOnly; Secure; SameSite=Lax; Path=/`, không `Domain`. Không lưu token trong localStorage/IndexedDB | Kiểm header `Set-Cookie`; DB không có token rõ | R2 | BE, FE | TM-01 |
| SR-SES-02 | B | Cấp token phiên **mới** sau đăng nhập, sau 2FA, sau đổi mật khẩu (chống session fixation); đăng xuất xóa dòng phiên server-side | Test: cookie trước đăng nhập không dùng được sau đăng nhập; sau logout cookie cũ 401 | R2 | BE | TM-01 |
| SR-SES-03 | B | Thời hạn phiên (tham số bảo mật `session_policy` theo kênh, biên ở mục 1.1): **admin-web**: hết sau 30 phút không hoạt động, tối đa 12 giờ; **PWA `mobile`**: 72 giờ không hoạt động, tối đa 30 ngày. Hết hạn → 401 `UNAUTHENTICATED`, client về màn đăng nhập, xóa dữ liệu màn hình | Test với `Clock` giả: request sau 31 phút → 401 | R2 | BE, FE, MOB | TM-02, TM-42 |
| SR-SES-04 | B | Chống CSRF: mọi method ghi của nhân viên cần `X-CSRF-Token` khớp phiên (token đồng bộ, không phải cookie đọc được bởi JS khác origin) **và** header `Origin` thuộc danh sách origin hợp lệ; webhook là ngoại lệ duy nhất | Test: POST thiếu token/Origin lạ → 403 | R2 | BE | TM-04 |
| SR-SES-05 | B | Mỗi phiên ghi `active_property_id`; mọi request `/v1/properties/{propertyId}/…` phải có `propertyId` ∈ cơ sở được gán của người dùng, nếu không → 404 | Test 2 cơ sở | R2 | BE | TM-07, TM-09 |
| SR-SES-06 | B | **Thu hồi ngay mọi phiên** của người dùng khi: đổi vai (`PUT /users/{id}/roles`), khóa/vô hiệu tài khoản, đặt lại/đổi mật khẩu, tắt 2FA. (Sửa mô tả OpenAPI "có hiệu lực lần đăng nhập kế tiếp") | Test: đổi vai → request kế tiếp của phiên cũ trả 401 | R2 | BE, ARC | TM-03 |
| SR-SES-07 | N | OWN xem danh sách phiên đang hoạt động (thiết bị, giờ, IP che) và thu hồi từng phiên; người dùng thu hồi phiên của mình | Test API | R3 | BE, FE | TM-42 |
| SR-SES-08 | B | admin-web có nút "Đổi ca/Khóa" (đăng xuất nhanh); hướng dẫn vận hành: hết ca phải đăng xuất | Kiểm giao diện + tài liệu | R2 | FE, UXD | TM-02 |
| SR-SES-09 | B | Phiên khách (`ottimo_gsid`) tách hoàn toàn phiên nhân viên: khác tên cookie, khác origin (SR-HDR-04), không endpoint nào chấp nhận cả hai | Test: cookie khách gọi API nhân viên → 401 | R2 | BE | TM-27 |

## 3. Thiết bị được cấp – "máy quầy" (SR-DEV) – chốt M8

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-DEV-01 | B | Bảng `trusted_device(id, organization_id, property_id, name, token_hash, created_by, created_at, expires_at, last_seen_at, revoked_at, revoked_by)`. Chỉ OWN (và MGR nếu OWN bật) cấp/thu hồi; hết hạn mặc định 180 ngày (tham số `trusted_device_days`) cho máy tính quầy; **≤ 30 ngày** cho thiết bị di động của cơ sở (SR-DEV-08, cột `device_kind` = `desk|facility_mobile`) | Test quyền A100-tương đương; audit `security` | R2 | ARC (ERD), BE | TM-46 |
| SR-DEV-02 | B | Cấp thiết bị: người cấp đang đăng nhập **trên chính thiết bị đó** ở origin admin-web, xác nhận lại mật khẩu (và TOTP khi có) → server đặt cookie `__Host-ottimo_did` (256 bit, `HttpOnly; Secure; SameSite=Strict`, hết hạn = `expires_at`), DB lưu SHA-256 | Test luồng; cookie không đọc được từ JS | R2 | BE, FE | TM-46 |
| SR-DEV-03 | B | Mọi endpoint có `x-classification: C3` **đọc hoặc ghi** của nhân viên (`.../documents` POST/PATCH, `.../sensitive`, `.../images/{id}`, `.../portal-data`, `door-credential` GET/PUT, xóa ảnh) yêu cầu cookie thiết bị hợp lệ, chưa thu hồi, cùng `property_id` → nếu không: `403 DEVICE_NOT_TRUSTED` + ghi `audit_event access.denied`. OpenAPI đánh dấu bằng `x-requires-trusted-device: true` | Test: cùng tài khoản FD, không cookie thiết bị → 403 trên từng endpoint C3 | R2 | ARC, BE | TM-46, TM-18 |
| SR-DEV-04 | B | PWA `mobile` (origin nhân viên di động) **không có** chức năng cấp thiết bị; phiên PWA không bao giờ `device_trusted` (rbac 8.7) – kể cả khi người dùng có vai FD | Test: gọi endpoint cấp thiết bị từ origin PWA → 403 | R2 | BE, MOB | TM-42, TM-46 |
| SR-DEV-05 | B | `Me.properties[].deviceTrusted` phản ánh trạng thái để FE ẩn nút C3; nhưng **server** là nơi kiểm (SR-DEV-03) | Test UI + API | R2 | FE, BE | TM-46 |
| SR-DEV-06 | B | Danh sách thiết bị được cấp + lần dùng gần nhất trên màn S26; thu hồi có hiệu lực ngay | Test | R2 | BE, FE | TM-46 |
| SR-DEV-07 | B | **Cứng hóa máy quầy** (checklist OPS/INV, kiểm khi cấp thiết bị và mỗi quý): ổ đĩa mã hóa (BitLocker/FileVault); tài khoản OS chuẩn (không quản trị); khóa màn hình sau 5 phút; cập nhật tự động; trình duyệt riêng cho OTTIMO, **không cài tiện ích**, không lưu mật khẩu trong trình duyệt; **tắt lịch sử clipboard và đồng bộ clipboard đám mây**; không cài Zalo/ứng dụng chat, không đồng bộ thư mục Downloads/Ảnh lên đám mây; phần mềm diệt mã độc mặc định bật | Checklist ký tên khi cấp thiết bị (lưu trong `trusted_device.name`/ghi chú); SEC kiểm ngẫu nhiên R3 | R3 (GL) | OPS, INV | TM-17, TM-18, TM-46 |
| SR-DEV-08 | B | **Thiết bị di động của cơ sở** (máy tính bảng/điện thoại do OTTIMO mua, đăng ký bằng tài khoản Apple/Google **của cơ sở**, không phải máy cá nhân của nhân viên) được cấp như máy quầy khi mở **admin-web** trong trình duyệt (không phải PWA – SR-DEV-04 giữ nguyên). Checklist di động: khóa màn hình tự động ≤ 1 phút + mã PIN ≥ 6 số hoặc sinh trắc; mã hóa thiết bị bật (mặc định iOS/Android hiện hành); hệ điều hành còn được hãng cập nhật, tự cập nhật bật; **không** cài Zalo/Messenger/ứng dụng chat, không đăng nhập tài khoản cá nhân; tắt đồng bộ ảnh/iCloud Drive/Google Photos và clipboard chung (Handoff/Universal Clipboard); "Tìm thiết bị" bật để khóa/xóa từ xa; trình duyệt không lưu mật khẩu. Hạn cấp ≤ 30 ngày (gia hạn = OWN kiểm lại checklist); thiết bị **ở lại cơ sở** (không mang về nhà), mất máy → OWN thu hồi trên S26 + xóa từ xa trong ngày | Checklist ký khi cấp; test: `device_kind=facility_mobile` hết hạn sau 30 ngày; test origin PWA vẫn bị từ chối | R2 (cơ chế), GL (checklist) | BE, FE, OPS, INV | TM-46, TM-17, TM-62 |
| SR-DEV-09 | B | **Không bao giờ cấp** cho: điện thoại/máy tính cá nhân của nhân viên (kể cả người trực đêm), PWA `mobile`, máy dùng chung ngoài cơ sở. Ngoại lệ duy nhất đã có: laptop của OWN/MGR (SR-DEV-01, có nhật ký) | Rà danh sách S26 hằng tháng (OWN) | R2 | INV, OWN | TM-46 |

## 4. Phân quyền 3 lớp theo `rbac-matrix.md` (SR-AZ)

Ba lớp ở server (giao diện ẩn nút chỉ là phụ): **Lớp 1 – hành động**: guard theo `x-roles` của operation (rbac mục 3–4). **Lớp 2 – phạm vi dữ liệu**: cơ sở (RLS PostgreSQL, ADR-007) + phạm vi vai `x-scope` (M của mình, T hôm nay, Đ đơn của khách). **Lớp 3 – trường**: serializer theo `x-visible-to` (rbac mục 6) + endpoint riêng cho C3.

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-AZ-01 | B | Mọi operation trong OpenAPI có `x-roles`; **mặc định từ chối** khi thiếu (lint OpenAPI trong CI). Vai không có trong `x-roles` → `403 FORBIDDEN_ACTION` + `audit_event access.denied` (người, hành động, đối tượng) | Lint CI: 0 operation thiếu `x-roles`; test 403 + bản ghi audit | R2 | ARC, BE | TM-07 |
| SR-AZ-02 | B | Phạm vi `x-scope` áp **trong câu truy vấn** (điều kiện `created_by`/`closer_user_id`/`assigned_user_id`/việc hôm nay), không lọc sau khi đã nạp; bản ghi ngoài phạm vi → `404 NOT_FOUND` (không lộ tồn tại) | Test IDOR: SAL A gọi đơn của SAL B → 404 | R2 | BE | TM-07 |
| SR-AZ-03 | B | `allowedActions[]` tính ở server theo **trạng thái và vai**; server kiểm lại khi thực hiện, không tin client | Test chuyển trạng thái trái phép → 409/403 | R2 | BE | TM-07 |
| SR-AZ-04 | B | Serializer **mặc định từ chối trường**: chỉ đưa vào JSON trường mà vai được thấy theo `x-visible-to`; thuộc tính `x-classification: C3` chỉ có ở endpoint C3. Trường không được thấy **vắng mặt** (không `null`) | Test snapshot JSON cho từng vai × schema chính (Reservation, Folio, Guest, Quote, Party, Item, LeaseContract) so với rbac mục 6 | R2 | BE, QA | TM-08 |
| SR-AZ-05 | B | Mọi id trong đường dẫn/body được kiểm thuộc cùng `propertyId` của đường dẫn và trong phạm vi người gọi (ví dụ `documentId` thuộc `registrationId`, `imageId` thuộc `documentId`) | Test ghép id chéo → 404 | R2 | BE | TM-07 |
| SR-AZ-06 | B | RLS: `ENABLE` + `FORCE` trên mọi bảng có `property_id`/`organization_id`; vai `ottimo_app` không `BYPASSRLS`; biến phiên đặt bằng `SET LOCAL` trong giao dịch; job dùng vai riêng, mỗi lần dùng `ottimo_readonly` (BYPASSRLS) phải qua runbook và ghi lại | Test: truy vấn không ngữ cảnh → 0 dòng; bộ test 2 cơ sở (ADR-007) | R2 | BE, OPS | TM-09 |
| SR-AZ-07 | B | Phê duyệt (SM-10): kiểm hạn mức theo `foc_limits` tại thời điểm duyệt, chặn tự duyệt (CHECK + guard), xác thực lại bằng PIN (SR-AUTH-09) | Test US-007 | R2 | BE | TM-06 |
| SR-AZ-08 | B | Quyền đọc từ DB theo `user_property_role` còn hiệu lực ở **mỗi request** (hoặc bộ nhớ đệm ≤ 60 giây có `roles_version` xóa khi đổi vai); không nhúng vai vào token | Test: đổi vai → request kế tiếp theo vai mới (kèm SR-SES-06) | R2 | BE | TM-03 |
| SR-AZ-09 | B | **Bộ test phân quyền 2 lớp**: (1) **Lớp hành động – tự sinh hoàn toàn từ OpenAPI**: mỗi operation × 8 vai nhân viên + khách mức 1/2 + không đăng nhập, kỳ vọng 403/không 403 theo `x-roles`, dùng **một bộ seed chung 2 cơ sở**, chạy mọi operation; (2) **Lớp phạm vi – viết tay** cho IDOR, `x-scope` M/T/Đ, 404 chéo cơ sở trên 10 tài nguyên chính: Reservation, Folio, Guest, Quote, Lead, Commission, Registration, Document, DoorCredential, LeaseContract. Cả hai chạy trong CI | CI xanh; báo cáo ma trận lớp 1; danh sách ca lớp 2 | R2 | QA, BE (ARC thêm `x-roles` + lint) | TM-07 |
| SR-AZ-10 | B | Không endpoint nào xuất danh sách C3 hàng loạt (A75 cấm mọi vai); xuất C2 (A105) chỉ OWN/MGR + nhật ký | Lint/grep OpenAPI; test | R2 | ARC, BE | TM-11 |

## 5. Dữ liệu C3: đọc, ghi, nhật ký truy cập (SR-C3)

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-C3-01 | B | Danh sách cột C3 = cột hậu tố `_enc`/`_hmac`/`_hash` trong ERD (erd mục 11) + `trusted_device.token_hash`, `app_user.mfa_secret_enc`. Mọi cột C3 khai báo trong một danh mục code (`c3Columns`) dùng chung cho serializer, audit, log | Test: danh mục khớp migration (so tên cột) | R2 | BE | TM-08, TM-53 |
| SR-C3-02 | B | Cột `_enc` không bao giờ có trong DTO danh sách, `audit_event.before/after`, `outbox_message.payload`, SSE, `idempotency_key.response_body`, log, nội dung tin nhắn | Test tự động quét JSON các đường đó tìm khóa trong `c3Columns` | R2 | BE | TM-08, TM-53 |
| SR-C3-03 | B | Phản hồi C3 (JSON hoặc ảnh) có `Cache-Control: no-store`, `Pragma: no-cache`; ảnh thêm `X-Content-Type-Options: nosniff` và `Content-Security-Policy: sandbox; default-src 'none'` | Test header | R2 | BE | TM-16, TM-44 |
| SR-C3-04 | B | Không URL công khai hoặc URL ký sẵn cho ảnh giấy tờ; chỉ stream qua API sau kiểm quyền | Review code; test truy cập trực tiếp volume qua Caddy → 404 | R2 | BE, OPS | TM-12 |
| SR-C3-05 | B | Không đưa C2/C3 vào URL/query (trừ mã lý do enum) | Lint OpenAPI: tham số `in: query` không chứa tên trường C2/C3 | R2 | ARC | TM-23, TM-53 |
| SR-C3-06 | B | Ảnh khách tải qua app **chỉ ghi**, không có endpoint khách đọc lại ảnh/số giấy tờ (rbac ghi chú 7) | Lint OpenAPI + test | R2 | BE | TM-21 |
| SR-C3-07 | B | **Nhật ký truy cập C3**: mỗi lần `view/create/update/copy/delete/purge` ghi `c3_access_log` **trong cùng giao dịch và trước khi trả dữ liệu**; ghi thất bại → không trả dữ liệu (503). Bảng append-only (REVOKE UPDATE/DELETE với `ottimo_app`) | Test: giả lập lỗi ghi log → không có dữ liệu trả về; DELETE bằng `ottimo_app` → lỗi quyền | R2 | BE | TM-11, TM-19 |
| SR-C3-08 | B | Trường nhật ký tối thiểu: `occurred_at`, `actor_type` (`user|guest|system`), `user_id`, `session_id`, `trusted_device_id`, `ip_hmac`, `subject_type`, `subject_id`, `reservation_id`, `action`, `reason_code`, `request_id`. Khách xem mã cửa cũng ghi (`actor_type=guest`) | Kiểm migration + test | R2 | ARC, BE | TM-19 |
| SR-C3-09 | B | **Xác nhận lại** (PIN duyệt hoặc mật khẩu) trước mọi thao tác C3 của nhân viên: xem ảnh giấy tờ (`.../images/{id}`), `.../sensitive`, `portal-data`, **xem mã cửa (`door-credential` GET – `getDoorCredential`), đặt/sửa mã cửa (`door-credential` PUT – `setDoorCredential`, trả bản che `DoorCredentialMasked`), render tin có mã cửa (`render-door-code` – `renderDoorCodeMessage`, dùng chung bộ đếm SR-RL-06 với `getDoorCredential`)**. OpenAPI đánh dấu `x-step-up: true` và có response 401 cho mọi operation trên (kèm `x-requires-trusted-device` – SR-DEV-03). Step-up là **cửa sổ trượt**: còn hiệu lực nếu phiên có thao tác C3 (hoặc lần xác nhận lại) trong 15 phút gần nhất (tham số `c3_stepup_minutes`); mỗi thao tác C3 gia hạn cửa sổ; không vượt hạn tối đa của phiên (SR-SES-03); đổi ca/đăng xuất xóa cửa sổ. Tổ hợp SR-SES-03 + SR-C3-09/10/11 đưa vào kịch bản test khả dụng UXR R2 (đo số lần nhập PIN/ca); SEC chỉnh tham số sau khi có số liệu | Test với `Clock` giả: thao tác C3 lúc 0, 10, 20 phút không hỏi lại; im 16 phút → hỏi lại; lint OpenAPI: 6 operation nêu trên có `x-step-up: true` + 401; test `door-credential` GET/PUT và `render-door-code` khi hết cửa sổ → 401 `REAUTH_REQUIRED` | R2 | BE, FE, UXR, ARC | TM-02, TM-11, TM-39 |
| SR-C3-10 | B | Xem ảnh: hiển thị inline trong khung xem của app, **watermark** chồng lên ảnh (tên người xem + thời điểm + "Chỉ dùng khai báo lưu trú"), không có nút tải về; ảnh không đưa vào thẻ `<a download>` (MVP không nhận PDF giấy tờ – SR-FILE-01) | Kiểm UI; test API trả ảnh đã chèn watermark hoặc watermark ở client + ảnh không có URL tải | R2 | FE, BE | TM-17 |
| SR-C3-11 | B | `portal-data`: (1) **Nhật ký**: mỗi lần lấy `getPortalData` = **một dòng** `c3_access_log action=view` ghi **trước khi** trả (SR-C3-07); mỗi `kind` của khai báo `mixed` là một lần lấy riêng; **không** ghi từng lần bấm sao chép (tín hiệu client không tin cậy – dữ liệu đã lộ ở lần lấy). Bù lại: `Cache-Control: no-store` (SR-C3-03), step-up (SR-C3-09), giới hạn SR-RL-06. (2) **Client**: FE **không** gọi lại `getPortalData` ngầm (không polling, không refetch khi focus/kết nối lại) – mỗi lần lấy do người dùng mở bước; dữ liệu chỉ giữ trong bộ nhớ màn hình, xóa khi rời màn. (3) **Sao chép**: nút "Sao chép" **từng trường**; "Sao chép tất cả" chỉ **theo từng người** (không cả đoàn) và không là nút mặc định/được focus sẵn. (4) **Tự ẩn/xóa**: số đầy đủ tự ẩn sau 60 giây; clipboard tự ghi đè bằng chuỗi rỗng sau 60 giây; ẩn/xóa **ngay** khi rời màn, đóng hộp, đăng xuất, hết phiên hoặc tab bị ẩn (`visibilitychange`). Ghi đè clipboard là best-effort → luôn có nút "Xóa bộ nhớ tạm" + checklist máy quầy tắt lịch sử clipboard (SR-DEV-07) | Test API: N lần lấy → N dòng `view`, 0 dòng `copy`; lỗi ghi log → không trả dữ liệu; test E2E: không có request `portal-data` khi đổi focus tab; số bị ẩn sau 60 giây và ngay khi `visibilitychange`; "Sao chép tất cả" không có cho cả đoàn | R2 | FE, BE | TM-18, TM-11 |
| SR-C3-12 | B | OWN/MGR có màn S28 lọc theo người/đơn/ngày; báo cáo tháng "lượt xem C3 theo người" gửi OWN; cảnh báo bất thường theo SR-LOG-06 | Test màn hình + job | R2 (màn), R3 (cảnh báo) | BE, FE | TM-11 |

## 6. Mã hóa và quản lý khóa (SR-KEY) – siết ADR-013

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-KEY-01 | B | AES-256-GCM qua thư viện chuẩn (Node `crypto`), nonce 96 bit ngẫu nhiên mỗi lần mã hóa, **AAD** = `table|column|record_id|kek_version` (chống tráo bản mã giữa các bản ghi); một DEK cho mỗi bản ghi `guest_document`, mỗi ảnh, mỗi `door_credential`, mỗi `reservation_guest` có dữ liệu trẻ em (thêm cột `data_key_id`), mỗi `approval_request` có tài khoản hoàn | Unit test: đổi AAD → giải mã thất bại; không dùng lại nonce (test 10⁵ lần) | R2 | BE | TM-12 |
| SR-KEY-02 | B | Chỉ module `CryptoService` đọc bảng `data_key` và biến KEK; lint chặn import ở module khác | Lint rule + review | R2 | BE | TM-12 |
| SR-KEY-03 | B | KEK 256 bit ngẫu nhiên, mỗi môi trường một KEK khác nhau (dev/staging/production); nạp từ `DATA_KEK_CURRENT` (+ `DATA_KEK_<n>` cho phiên bản cũ khi xoay); **không** nằm trong DB, image, repo, log, backup tệp, thông báo lỗi; ứng dụng từ chối khởi động ở production nếu KEK trống/ngắn | Test khởi động; grep image (`docker history`, `docker run … env` không có KEK ngoài runtime) | R2 | BE, OPS | TM-13, TM-47 |
| SR-KEY-04 | B | INV giữ **2 bản sao KEK ngoại tuyến** (ví dụ giấy in trong két + USB mã hóa), tách khỏi khóa giải mã backup; OPS ghi runbook "khôi phục KEK" | Biên bản bàn giao (không ghi giá trị) trước GL | GL | OPS, INV | TM-14 |
| SR-KEY-05 | B | Xoay KEK: khi nghi lộ (bắt buộc) và mỗi 12 tháng (nên); bọc lại mọi DEK còn hiệu lực bằng KEK mới, ghi `kek_version`; runbook OPS | Diễn tập ở staging R3 | R3 | OPS, BE | TM-13 |
| SR-KEY-06 | N | (Tăng cường crypto-shredding với backup) Xoay KEK theo tháng, hủy KEK cũ khi mọi backup chứa DEK bọc bởi nó đã hết hạn (≤ 35 ngày sau xoay) | Thiết kế R3 nếu INV/luật sư yêu cầu "xóa khỏi backup" nhanh hơn 35 ngày | R3 | ARC, OPS | TM-15 |
| SR-KEY-07 | B | `ID_HASH_KEY` (HMAC số giấy tờ) khác KEK, 256 bit; chỉ dùng HMAC-SHA256; giá trị HMAC là C3 (không trả API) | Test | R2 | BE | TM-12 |
| SR-KEY-08 | B | Băm IP trong log/nhật ký dùng **HMAC với khóa riêng** (`LOG_IP_HMAC_KEY`), không SHA-256 trần (IPv4 dò ngược được) | Test | R2 | BE | TM-53 |
| SR-KEY-10 | N | KEK (`DATA_KEK_*`) và `ID_HASH_KEY` **không** nằm trong `.env` chung: mỗi khóa một tệp riêng ngoài thư mục dự án (ví dụ `/etc/ottimo/secrets/`), quyền `0400`, chủ là **UID chạy container** (container chạy user không root nên tệp `root:0400` sẽ không đọc được), nạp vào `api`/`worker` qua `secrets:` của Docker Compose (Compose không-swarm gắn tệp **chỉ đọc** tại `/run/secrets/…`, ứng dụng đọc `*_FILE`); thư mục này **loại khỏi mọi bản sao lưu tệp**; kết hợp SR-BAK-03 (tắt snapshot tự động). Giảm rủi ro kẻ có **bản sao ổ đĩa/sao lưu** (TA-10) nhưng **không** chống kẻ có root trên máy đang chạy – TM-13 vẫn High. Không làm "mở khóa tay sau khởi động" vì xung đột với tự vá + khởi động lại tự động (SR-OPS-03) | Kiểm `docker inspect` không có KEK trong `Env`; danh sách loại trừ backup có thư mục secrets; container đọc được tệp, user SSH thường không đọc được | R3 | OPS, BE | TM-12, TM-13 |
| SR-KEY-09 | B | Sửa ADR-013 mục 3: "Hủy DEK làm dữ liệu không đọc được trong DB ngay; bản sao lưu cũ vẫn chứa DEK bọc bởi KEK hiện hành nên dữ liệu chỉ hết hẳn khi backup cũ hết hạn (≤ 35 ngày, T18)" | ARC cập nhật ADR (thẻ review bước 3) | R1 bước 4 | ARC | TM-15 |

## 7. Tệp tải lên (SR-FILE)

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-FILE-01 | B | Server chỉ nhận **JPEG, PNG, WebP**, xác định bằng **magic bytes** (không tin `Content-Type`/đuôi) cho mọi kênh (quầy, app khách, đính kèm vận hành). **MVP không nhận PDF** cho giấy tờ: máy scan/điện thoại ở quầy xuất JPEG. HEIC/HEIF gửi thẳng → `422 FILE_REJECTED` kèm hướng dẫn "chụp lại bằng nút Chụp trong app". **Chuẩn hóa ở client** (guest-web, admin-web): vẽ ảnh vào `canvas`, xuất JPEG chất lượng ~0,85, cạnh dài ≤ 2.500 px trước khi tải (tự bỏ EXIF/GPS, giảm dung lượng trên 4G); trình duyệt không giải mã được ảnh đã chọn → hướng khách chụp bằng camera trong app | Test tệp đổi đuôi `.jpg` chứa HTML → 422; HEIC gửi thẳng → 422 có thông điệp hướng dẫn; MOB/QA thử trên iPhone (Safari) và Android thật ở R2 | R2 | BE, FE, MOB | TM-16 |
| SR-FILE-02 | B | Giới hạn: ≤ 10 MB/tệp, ≤ 40 megapixel, ≤ 4 ảnh/người/giấy tờ, ≤ 30 tệp/đơn từ app khách; giới hạn body ở Caddy 25 MB | Test vượt ngưỡng → 413/422 | R2 | BE, OPS | TM-16, TM-25 |
| SR-FILE-03 | B | **Server vẫn mã hóa lại** mọi ảnh (decode → encode JPEG/WebP bằng `sharp` bản dựng sẵn – đủ cho JPEG/PNG/WebP, không cần HEVC) trước khi lưu, bỏ toàn bộ metadata (EXIF, GPS); chuẩn hóa ở client (SR-FILE-01) **không** thay thế bước này (client không đáng tin); `sharp` chạy với `limitInputPixels` 40 MP, giới hạn thời gian và đồng thời 1–2 ảnh để vừa RAM VPS; lỗi decode → từ chối | Test: ảnh có GPS gửi thẳng API (bỏ qua client) → bản lưu không có EXIF; ảnh 50 MP → 422 | R2 | BE | TM-16 |
| SR-FILE-04 | B | Không ghi tệp tạm dạng rõ ra đĩa (xử lý trong bộ nhớ hoặc tmpfs); tên lưu ngẫu nhiên; quyền tệp 600, thư mục 700; volume không được Caddy phục vụ | Review + kiểm quyền thư mục | R2 | BE, OPS | TM-12 |
| SR-FILE-05 | – | **Bỏ khỏi MVP** (thẻ FB-R1-ARC-SEC-02): không nhận PDF nên không cần ClamAV (~1–1,5 GB RAM) hay kết xuất PDF ở server. Xem lại nếu sau này bắt buộc nhận PDF: khi đó phải có quét mã độc + kết xuất ảnh ở server, đánh giá lại RAM/gói VPS | – | Sau MVP | SEC, OPS | TM-16 |
| SR-FILE-06 | B | Phục vụ tệp với `Content-Disposition: inline; filename="document"` (không lộ tên gốc), `nosniff`, CSP `sandbox` (SR-C3-03) | Test header | R2 | BE | TM-16 |

## 8. Thời hạn lưu, xóa, legal hold (SR-RET)

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-RET-01 | B | Thời hạn đọc từ `config_parameter` (erd 9.2), không viết cứng; chỉ OWN sửa; mỗi lần sửa audit `config` | Test quyền + audit | R2 | BE | TM-20 |
| SR-RET-02 | B | **Ảnh của người không đồng ý lưu (M3)**: xóa ngay khi khai báo `confirmed` (outbox, mục tiêu ≤ 15 phút); J16 là lưới an toàn với hạn trên T01 = 24 giờ; chưa `confirmed` → tối đa 7 ngày sau trả phòng | Test với `Clock` giả: `confirmed` → ảnh mất trong 1 lần chạy outbox; job bắt ca sót | R2 | BE | TM-20 |
| SR-RET-03 | B | J16 ghi `retention_run` (không dữ liệu cá nhân) + `purge_journal(subject_type, subject_id, purged_at, policy_key)`; cảnh báo OPS khi job lỗi hoặc không chạy trong 26 giờ | Test + cấu hình giám sát R2 | R2 | BE, OPS | TM-20, TM-56 |
| SR-RET-04 | B | `legal_hold`: chỉ OWN/MGR, bắt buộc lý do + `review_by` ≤ 90 ngày; danh sách hold quá hạn xem lại hiện "Cần chú ý" cho OWN | Test | R3 | BE | TM-20 |
| SR-RET-05 | B | Xóa sớm theo yêu cầu khách (A74) và rút đồng ý P02b → hủy DEK + xóa tệp trong cùng request; trả lời khách phần nào luật buộc giữ (R-DSR-03) | Test | R2 | BE | TM-20 |
| SR-RET-06 | B | `visa_alert_on` (M9): C2, đặt NULL khi đơn `checked_out`/`cancelled`/`no_show`/khai báo `void`; không có trong DTO/audit/SSE; mục "Cần chú ý" `visa_expiring` chỉ chứa mã đơn | Test | R2 | BE | TM-08 |

## 9. App khách theo link (SR-GST) – chốt cơ chế xác minh mức 2

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-GST-01 | B | Token link 256 bit từ CSPRNG (base64url 43 ký tự; tối thiểu 128 bit), DB lưu SHA-256 (`guest_access_token.token_hash`), token rõ chỉ trả **một lần** khi cấp | Test | R2 | BE | TM-22 |
| SR-GST-02 | B | guest-web đọc token từ `/g/{token}`, gọi `POST /v1/guest/sessions` (token trong body), nhận cookie `__Host-ottimo_gsid`, rồi `history.replaceState` về `/` – token không còn trên thanh địa chỉ; `Referrer-Policy: no-referrer` | Test E2E: sau mở link, `location.href` không chứa token | R2 | MOB/FE, BE | TM-23 |
| SR-GST-03 | B | guest-web **không** nhúng script/analytics/font của bên thứ ba; Caddy và API che đường dẫn `/g/*` trong log | Kiểm CSP + log | R2 | MOB, OPS | TM-23 |
| SR-GST-04 | B | Cấp lại link = thu hồi mọi token cũ của đơn + mọi `guest_session` của chúng; thu hồi thủ công (DELETE) tương tự | Test | R2 | BE | TM-21 |
| SR-GST-05 | B | Hiệu lực: từ khi cấp tới `checked_out` + `guest_link_grace_hours` (mặc định 24); dài hạn: HĐ `closed` + ân hạn; quá hạn → `401 GUEST_LINK_INVALID` | Test với `Clock` giả | R2 | BE | TM-26 |
| SR-GST-06 | B | **Mức 1** (chỉ có link): thông tin lưu trú, nội quy, Wi-Fi (từ ngày nhận phòng), gửi yêu cầu, check-in online (chỉ ghi), giờ đến. Không: bill, hợp đồng, mã cửa, họ tên đầy đủ, liên hệ, người đi cùng | Test JSON mức 1 không có trường cấm | R2 | BE | TM-21 |
| SR-GST-07 | B | **Mức 2** đạt được bằng **một trong hai**: (a) **OTP email**: 6 chữ số, CSPRNG, hiệu lực 10 phút, gửi tới email trên đơn (qua `NotificationAdapter` email, R2), hiển thị email che `d***@g***.com`; (b) **Mã xác minh lễ tân**: FD+ bấm "Cấp mã xác minh" ở chi tiết đơn → 6 chữ số, 10 phút, dùng một lần, đọc trực tiếp cho khách tại quầy hoặc gọi điện tới SĐT trên đơn; mỗi lần cấp ghi audit. (c) R3 tùy chọn: OTP qua Zalo ZNS nếu INV duyệt chi phí (ESC-010); (d) **Mã xác minh lễ tân gửi qua kênh nhắn tin** – xem SR-GST-13 (mặc định **tắt**, OWN bật theo từng kênh). **Không chấp nhận** 4 số cuối SĐT hay mã đặt phòng làm yếu tố xác minh (mã đặt phòng tăng dần và có sẵn trong tin nhắn chứa link). OTP lưu băm | Test: `bookingCode`/`phoneLast4` không còn trong schema `verify`; OTP sai/hết hạn bị từ chối | R2 | ARC (sửa OpenAPI), BE, MOB, UXD | TM-21 |
| SR-GST-08 | B | Đếm lần xác minh sai **theo token** (không theo phiên), **chung cho mọi loại mã** (OTP email, mã lễ tân tại quầy/điện thoại, mã lễ tân qua kênh nhắn tin): 5 lần sai trong 24 giờ → khóa xác minh của token, khách phải nhờ lễ tân (chỉ mã lễ tân **đọc tại quầy/gọi điện** còn dùng được khi token bị khóa); gửi OTP tối đa 3 lần/giờ/token; mã lễ tân qua kênh nhắn tin tối đa 3 lần/24 giờ/token | Test: mở phiên mới không reset bộ đếm | R2 | ARC (ERD), BE | TM-21 |
| SR-GST-09 | B | Phiên mức 2 hết sau 30 phút không hoạt động (`guest_level2_idle_minutes`) và tối đa 24 giờ → về mức 1 | Test | R2 | BE | TM-21 |
| SR-GST-10 | B | Mã cửa trong `GuestStay.doorCode` chỉ trả khi: phiên mức 2 **và** thời điểm trong `[validFrom, validTo]` **và** đơn `confirmed`/`in_house`; mỗi lần trả ghi `c3_access_log` (`actor_type=guest`); phản hồi `no-store` | Test | R2 | BE | TM-21, TM-39 |
| SR-GST-11 | B | **Sau `checked_out` (M4)**: chỉ còn xem bill + thanh toán phát sinh (BR-427), bắt buộc mức 2; Wi-Fi, mã cửa, yêu cầu, upload, đồng ý mới → 403 | Test | R2 | BE | TM-26 |
| SR-GST-12 | B | QR đặt trong phòng chỉ trỏ tới trang công khai của căn (không token); trang đó không truy vấn dữ liệu đơn | Kiểm nội dung QR | R2 | MOB, UXD | TM-24 |
| SR-GST-13 | B | **Mã xác minh lễ tân gửi qua kênh nhắn tin** (phân xử ORC 15/10 – khách Airbnb/Booking/Zalo không có email dùng được). Tham số `guest_verify_code_channels` theo cơ sở: tập con của {`airbnb_inbox`, `booking_inbox`, `agoda_inbox`, `zalo`}; **mặc định rỗng (tắt)**; chỉ OWN sửa, ghi audit `config`. Khi kênh được bật: FD+ trên **admin-web** (không PWA) bấm "Cấp mã xác minh" → chọn "Gửi qua <kênh>" → mã 6 chữ số CSPRNG, **dùng một lần**, gắn với **token link đang hiệu lực** của đơn (cấp lại link = mã cũ vô hiệu), hết hạn **15 phút** (`guest_verify_code_channel_minutes`, tối đa 30), lưu băm; đếm sai chung theo token (SR-GST-08). Gửi **chỉ** tới đúng hội thoại của đơn trên extranet OTA hoặc Zalo của **SĐT trên đơn** bằng tài khoản Zalo **của cơ sở** – không gửi tới tài khoản/hội thoại khác dù người nhắn tự xưng là khách. Mẫu tin `verify_code` **không chứa link** và chỉ có mã + hạn; link và mã luôn ở **hai tin khác nhau**. MVP chưa có API nhắn OTA/ZNS → lễ tân sao chép mẫu và dán tay; mã hiển thị một lần, không lưu trong `message_log`. Audit mỗi lần cấp: người cấp, kênh, đơn (không ghi mã) | Test: tham số rỗng → không có lựa chọn kênh; mã dùng lần 2 bị từ chối; mã sau 15 phút bị từ chối; cấp lại link → mã cũ bị từ chối; render mẫu `verify_code` có biến link → 422 | R2 | BE, FE, UXD, ARC (tham số + endpoint) | TM-21, TM-61 |
| SR-GST-14 | B | **Ô email không bắt buộc** ở form Đặt phòng mới và sửa khách (admin-web); kiểm định dạng; hiển thị nhãn "Đơn chưa có email – khách cần mã xác minh từ lễ tân" khi trống. Email đổi **sau khi đã cấp link** → chỉ FD+, ghi audit (giá trị cũ/mới che giữa), và OTP **không** gửi tới email vừa đổi trong 24 giờ trừ khi lễ tân xác nhận lại tại quầy/điện thoại (chống lừa đổi email qua chat để nhận OTP). Email ủy quyền của OTA được ghi nhận như email trên đơn | Test: đổi email rồi gọi gửi OTP trong 24 giờ → từ chối với hướng dẫn "nhờ lễ tân"; audit có bản ghi | R2 | BE, FE, UXD | TM-21, TM-61 |
| SR-GST-15 | B | **Luồng khách đến khuya** (ngoài `front_desk_hours`, BR-611/P03 E2): (1) trước ngày đến, mẫu tin mời check-in online (mức 1, chỉ ghi giấy tờ) và xác minh mức 2 bằng OTP email hoặc mã lễ tân qua kênh (nếu bật) **trong giờ trực**; (2) mã cửa hiện trong app mức 2 từ `validFrom` (SR-GST-10) hoặc gửi bằng mẫu `door_code` đúng ngày đến (SR-LOCK-03); (3) nếu khách tới mà chưa có mức 2 hoặc chưa đối chiếu giấy tờ: **người trực đêm** dùng **thiết bị của cơ sở đã được cấp** (máy quầy hoặc máy tính bảng – SR-DEV-08) mở admin-web để đối chiếu giấy tờ, xem/ghi C3 và đọc mã xác minh trực tiếp; **không** dùng điện thoại cá nhân hay PWA cho bước này (SR-DEV-09); (4) không có người trực và khách chưa mức 2 → gọi số trực đêm của quản lý (ESC-010 câu 4). Không có đường tắt kiểu "gửi mã cửa qua chat cá nhân" | Kịch bản E2E khách đến 01:00 cho cả 3 nhánh; test PWA gọi endpoint C3 → 403 | R2 | BA, DOM (quy trình), BE, FE | TM-21, TM-46, TM-62 |

## 10. Thanh toán, callback và PCI DSS (SR-PAY) – chi tiết R-PAY-08

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-PAY-01 | B | IPN/webhook xác thực chữ ký **trên dữ liệu thô** đúng đặc tả cổng (VNPay HMAC-SHA512 trên tham số đã sắp xếp; MoMo HMAC-SHA256; SePay/payOS theo tài liệu) bằng so sánh hằng thời gian; sai → phản hồi mã lỗi theo cổng, ghi `inbox_message.signature_valid=false`, **không** thay đổi dữ liệu | Test Mock B10: chữ ký sai, thiếu, trường bị sửa → không tạo `succeeded` | R3 (R2 với Mock) | INT, BE | TM-28 |
| SR-PAY-02 | B | Chỉ chuyển `succeeded` khi: chữ ký hợp lệ **và** `paymentId` tồn tại ở trạng thái `pending` **và** số tiền + tiền tệ khớp chính xác **và** mã kết quả cổng là thành công; ngược lại ghi "Cần chú ý" `payment_mismatch` | Test bảng các ca lệch | R3 (R2 Mock) | INT, BE | TM-28, TM-29 |
| SR-PAY-03 | B | Idempotent: UK `(provider, provider_txn_id)` + `inbox_message(provider, external_event_id)`; IPN lặp trả "đã xác nhận" theo đặc tả cổng (ví dụ VNPay `02`) | Test gửi 2 lần → 1 giao dịch (K5) | R2 | BE | TM-28 |
| SR-PAY-04 | B | Trước khi ghi `succeeded`, gọi `queryStatus` của cổng (B5) khi cổng hỗ trợ; ReturnUrl **không bao giờ** đổi trạng thái | Test | R3 | INT | TM-28 |
| SR-PAY-05 | B | Endpoint webhook: không cần phiên, ngoại lệ CSRF duy nhất; giới hạn body 64 KB; có định danh cơ sở trong đường dẫn (ADR-011: `/v1/webhooks/{provider}/{propertySlug}`) để chọn đúng bí mật; hỗ trợ đúng method của cổng (VNPay IPN dùng GET – INT xác minh); phản hồi không chứa chi tiết lỗi nội bộ; route `mock` **không đăng ký** khi `APP_ENV=production` | Test; kiểm bảng route production | R3 | ARC, INT, BE | TM-28, TM-33 |
| SR-PAY-06 | B | Số tiền thanh toán do server tính (số dư/cọc/kỳ thu); VietQR/link thanh toán khác số server tính → bắt buộc lý do + audit; nội dung chuyển khoản chỉ mã đơn/bill (không tên, không SĐT) | Test | R2 | BE | TM-29 |
| SR-PAY-07 | B | Bank feed (R3): xác thực khóa/chữ ký nhà cung cấp; **kéo lại giao dịch qua API nhà cung cấp** trước khi ghi; khớp nội dung chuẩn hóa (`OTM00171`) + số tiền chính xác; không khớp hoặc khớp nhiều đơn → "Cần chú ý", lễ tân xác nhận tay (A04) | Test Mock | R3 | INT, BE | TM-31 |
| SR-PAY-08 | B | Không có cột, trường API, log nào chứa PAN/CVV/ngày hết hạn thẻ (R-PAY-01); chỉ `card_brand`, `card_last4` nếu cổng trả | Grep schema + test | R2 | ARC, BE | TM-30 |
| SR-PAY-09 | B | Payload từ channel manager **và** cổng thanh toán/bank feed (IPN, webhook, phản hồi API): **lọc theo danh sách trường cho phép** trước khi lưu/ghi log (`scrubCardData` – một chỗ dùng chung trong `integrations/common`); `ChannelBookingEvent.raw` không được lưu nguyên; `inbox_message.payload_ref` (nếu có) chỉ chứa bản đã lọc, xóa sau 90 ngày (T16); INT tắt chuyển thẻ trên Beds24 (R-PAY-06). **Luật tên**: khóa theo token (card, cc, cvv, cvc, pan, vcc, expiry thẻ…) bị loại; `allowKeys` chỉ miễn luật tên, **không** miễn luật giá trị. **Luật giá trị – 2 tầng** (quyết định SEC R2 W1): **Tầng A** – văn bản tự do và **mọi trường chưa khai kiểu** (ghi chú, yêu cầu, tin nhắn, chuỗi có ký tự khác chữ số): Luhn **chặt, không dùng IIN**, kiểm **mọi cửa sổ liên tiếp 13–19 chữ số** sau khi bỏ khoảng trắng/gạch (bắt cả "thẻ + CVV/hạn" dính liền); **Tầng B** – trường mã/số **adapter khai kiểu** trong allowlist ánh xạ (`fieldKinds`: `timestamp14`, `epochMs`, `numericId`…), giá trị chỉ gồm chữ số: chỉ xóa khi **Luhn + IIN + độ dài khớp thương hiệu** (bảng IIN cố định trong code: Visa, Mastercard, Amex, JCB, UnionPay, Discover, Diners, Maestro, NAPAS `9704`; INT chỉ được **mở rộng** bảng, thu hẹp/đổi = SEC duyệt); kiểu `timestamp14`/`epochMs` là ngày giờ hợp lệ trong ±2 năm → giữ. Không có miễn trừ tuyệt đối: số thẻ thật đặt vào trường `numericId` vẫn bị xóa. Số nguyên JSON > `MAX_SAFE_INTEGER` → coi là đáng ngờ và xóa (hoặc parse lossless trước khi lọc). Trường **bắt buộc** của ánh xạ bị xóa → không "thành công" im lặng: tạo "Cần chú ý" `card_suspect` (không kèm giá trị); metric tách nhãn `rule=name|value_text|value_id`; hàm trả **số lượng**, không trả tên/giá trị bị xóa | Test Mock CM có trường thẻ → bản lưu không có; 86.400 giá trị `vnp_PayDate` một ngày (`timestamp14`) → 0 bị xóa; 10.000 mẫu `epochMs` → 0; mã 13–19 số không tiền tố thương hiệu ở `numericId` → giữ; `4111111111111111`, `5555555555554444`, `378282246310005`, số NAPAS thử ở `numericId` → xóa; cùng giá trị trong ghi chú → xóa; `"4111111111111111 123"`, `"4111 1111 1111 1111 12-28"`, `"4111111111111111-0901234567"` → phát hiện | R2 (luật lọc, trước adapter thật đầu tiên); R3 (CM thật) | INT, BE | TM-30 |
| SR-PAY-10 | B | Validator Luhn (13–19 chữ số, cho phép dấu cách/gạch) trên **mọi** ô văn bản tự do (ghi chú đơn, khách, folio, yêu cầu khách, lý do, mẫu tin) → `422 CARD_NUMBER_DETECTED`; hướng dẫn nhân viên "không nhận số thẻ qua điện thoại/Zalo" trong tài liệu vận hành | Test | R2 | BE, PO | TM-30 |

## 11. Tích hợp, khóa cửa, tin nhắn (SR-INT, SR-LOCK, SR-MSG)

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-INT-01 | B | Webhook kênh = tín hiệu; worker kéo lại đơn bằng thông tin đăng nhập của OTTIMO (ADR-011 B4); webhook không có chữ ký vẫn an toàn vì không dùng dữ liệu trong webhook | Test Mock: webhook giả với id không tồn tại ở CM → không tạo đơn | R3 | INT | TM-34 |
| SR-INT-02 | B | Adapter chỉ gọi host cố định trong cấu hình (không lấy URL từ dữ liệu vào – chống SSRF); timeout ≤ 15 giây; TLS kiểm chứng chỉ | Review + test | R2 | INT | TM-35 |
| SR-INT-03 | B | Mỗi adapter có bảng "trường gửi đi" tối thiểu; không gửi giấy tờ, mã cửa ra bên thứ ba (trừ hãng khóa khi tích hợp thật); danh sách bên xử lý + quốc gia máy chủ cập nhật cho thông báo xử lý dữ liệu (DRA P11) | Review README INT | R3 | INT, SEC | TM-36, TM-55 |
| SR-LOCK-01 | B | Mã cửa mặc định: 6 chữ số từ CSPRNG; không trùng mã đang hiệu lực trên cùng khóa; không tái dùng mã cho căn trong 90 ngày; OpenAPI `DoorCredentialInput.code` sửa thành `^[0-9]{6,10}$` | Unit test sinh mã; lint schema | R2 | BE, ARC | TM-38 |
| SR-LOCK-02 | B | **[Đã bỏ – INV 19/10: không dùng mã theo ngày sinh, mã ngẫu nhiên 8 số mỗi lượt ở, BR-403 v0.3.9; SEC cập nhật SR-LOCK-01]** Nội dung cũ: biến thể "mã sinh nhật" (decision-log DOM + SEC 15/10, chờ ESC-011): chỉ khi khách **tự chọn**; **`ddmm` + ≥ 3 chữ số ngẫu nhiên** (≥ 7 số, ví dụ 1503**472**) – không có ngoại lệ 2 số kể cả khi khóa có khóa bàn phím; không bao giờ chỉ ngày sinh; vẫn có hạn hiệu lực và không tái dùng như SR-LOCK-01. (ESC-011 phương án A đang ghi "+ 2 số" – PO cập nhật theo dòng decision-log) | Unit test: mã sinh nhật dài ≥ 7, phần đuôi từ CSPRNG | R2 (sau ESC) | INT, BE, PO | TM-38 |
| SR-LOCK-03 | B | Mã cửa chỉ hiển thị cho khách ở app mức 2 trong khoảng hiệu lực (SR-GST-10); mẫu tin nhắn **cấm** biến mã cửa trừ mẫu `door_code` gửi đúng ngày đến tới liên hệ đã có trên đơn, không trong tiêu đề email/xem trước thông báo; nhân viên xem mã ghi `c3_access_log` | Test render mẫu | R2 | BE, UXD | TM-39 |
| SR-LOCK-04 | B | Chế độ thủ công: hướng dẫn lễ tân **luôn đặt hạn trên chính khóa**; khi trả phòng/hủy/no-show tạo việc "Xóa mã căn X trên app khóa", chưa tick sau 1 giờ → "Cần chú ý" đỏ; `door_credential.revoked_at` đặt ngay | Test job + UI | R2 | BE, FE | TM-40 |
| SR-MSG-01 | B | `message_template.body` chỉ dùng biến trong danh sách cho phép theo từng mã mẫu; **cấm** mọi biến C3; `message_log` không lưu nội dung đã điền | Test lưu mẫu có biến cấm → 422 | R2 | BE | TM-39, TM-60 |
| SR-MSG-02 | B | Nội dung tin gửi bên thứ ba (email/Zalo) tối thiểu: tên gọi, mã đơn, ngày; không SĐT/giấy tờ/số tiền chi tiết trừ mẫu bill gửi chính khách | Review mẫu UXD | R2 | UXD, BE | TM-55 |
| SR-MSG-03 | B | Mẫu chứa link app khách (`checkin_link`…) khi render (`/messages/render`) phải đi qua luồng cấp link với **quyền A22** (CTV không được); render mỗi lần không cấp token mới ngầm định – dùng link đang hiệu lực nếu người gọi có quyền xem, hoặc yêu cầu cấp lại rõ ràng; escape HTML cho email | Test: CTV render `checkin_link` → 403 | R2 | ARC, BE | TM-60, TM-21 |

## 12. Lưu trữ trên thiết bị – PWA và trình duyệt (SR-PWA)

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-PWA-01 | B | IndexedDB của PWA `mobile` chỉ chứa: trạng thái 10 căn, việc hôm nay, checklist, danh mục minibar (không giá vốn), hàng đợi thao tác, ảnh sự cố chờ gửi; **không** C3, không SĐT/email, không số tiền folio, không ghi chú khách tự do; HK chỉ tên gọi + số căn của việc hôm nay | Test: dump IndexedDB sau 1 ca mô phỏng, so danh sách khóa cho phép | R2 | MOB | TM-42 |
| SR-PWA-02 | B | Service worker chỉ cache: tệp tĩnh của app + danh sách endpoint GET cho phép (rõ trong code); phản hồi có `Cache-Control: no-store` không bao giờ vào cache | Test | R2 | MOB | TM-44 |
| SR-PWA-03 | B | admin-web và guest-web **không** cache phản hồi API bằng service worker; guest-web chỉ cache thông tin lưu trú mức 1 (ADR-006) | Review | R2 | FE, MOB | TM-44 |
| SR-PWA-04 | B | Đăng xuất, hết phiên, đổi người dùng → xóa IndexedDB, Cache Storage, bộ nhớ TanStack Query; hàng đợi chưa gửi được cảnh báo trước khi xóa; xóa ảnh sự cố sau khi server xác nhận | Test E2E | R2 | MOB, FE | TM-42 |
| SR-PWA-05 | B | Hàng đợi offline: mỗi mục có `Idempotency-Key` (UUID v4/v7) + `performedAt`; server chấp nhận `performedAt` trong [now − 24 giờ, now + 5 phút], lưu cả giờ nhận; kiểm chuyển trạng thái hợp lệ | Test | R2 | MOB, BE | TM-43 |
| SR-PWA-06 | B | Web Push: nội dung chỉ loại sự kiện + số căn ("Căn 203 cần dọn"), không tên/liên hệ/mã | Review mẫu push | R2 | MOB, BE | TM-45 |
| SR-PWA-07 | B | Không dùng `localStorage`/`sessionStorage` cho token hoặc dữ liệu C2/C3; chỉ cờ giao diện (ngôn ngữ, chế độ tối) | Lint/grep | R2 | FE, MOB | TM-42 |

## 13. Giới hạn tần suất (SR-RL)

Vượt → `429 RATE_LIMITED` kèm `Retry-After`; ghi `audit_event security` khi chạm ngưỡng xác thực – **kể cả ngưỡng theo IP** (SR-RL-01, -03).

Nơi lưu bộ đếm (ADR-003 – không Redis):
- **Theo tài khoản / người dùng / token** cho xác thực (khóa đăng nhập SR-AUTH-04, PIN/step-up/2FA SR-RL-02, xác minh khách SR-RL-04): **bắt buộc PostgreSQL**, cập nhật nguyên tử, từ R2.
- **Theo IP và theo người cho tra cứu** (SR-RL-01 phần IP, SR-RL-03, SR-RL-07): **R2 chấp nhận bộ đếm RAM** với giả định **1 replica api** (ghi ở decision-log); bộ đếm RAM reset khi deploy/khởi động lại – rủi ro đã chấp nhận cho R2. **R3 (trước GL)**: chuyển sang bảng `rate_limit_counter` (UPSERT nguyên tử). Tăng lên > 1 replica trước R3 → phải chuyển ngay.
- Giới hạn theo IP chỉ đúng khi IP client là thật: phụ thuộc **`TRUST_PROXY` bắt buộc** ở staging/production (SR-SECR-07).
- Giới hạn chung (SR-RL-09): RAM được phép.

| Mã | Mức | Endpoint / hành vi | Ngưỡng mặc định (tham số) | Khóa đếm | R |
|---|:-:|---|---|---|:-:|
| SR-RL-01 | B | `POST /v1/auth/login` | 5 sai/tài khoản/15 phút (SR-AUTH-04); 20 lần/IP/15 phút | tài khoản, IP | R2 |
| SR-RL-02 | B | Xác nhận PIN duyệt, step-up C3, 2FA; **người khác xác nhận tại quầy** (SR-AUTH-11) – mỗi lần sai đếm cho **cả người xác nhận và người gọi**, một trong hai đang khóa → 429; đúng chỉ xóa bộ đếm của người xác nhận | 5 sai/người/15 phút | người dùng (người xác nhận **và** người gọi với SR-AUTH-11) | R2 |
| SR-RL-03 | B | `POST /v1/guest/sessions` | 10/phút/IP, 100/ngày/IP | IP | R2 |
| SR-RL-04 | B | `POST /v1/guest/sessions/verify`, gửi OTP | 5 sai/token/24 giờ; 3 OTP/giờ/token | token | R2 |
| SR-RL-05 | B | Yêu cầu khách, upload app khách, **ghi check-in online** (`updateOnlineCheckin` + `completeOnlineCheckin`, gồm `arrivalNote`) | 20 yêu cầu/ngày/đơn; 30 tệp/đơn; 20 lần ghi check-in online/ngày/đơn | đơn | R2 |
| SR-RL-06 | B | Endpoint C3 (`sensitive`, ảnh, `portal-data`, mã cửa) | 60 lượt/giờ/người – **vượt thì cảnh báo** OWN (không chặn công việc), 200/giờ thì chặn | người dùng | R2 |
| SR-RL-07 | B | `guests/lookup`, `guests` tìm kiếm **và `createGuest`/`updateGuest` có SĐT/email** bởi người có phạm vi riêng (SAL/CTV) – đếm **trước** kiểm trùng; một bộ đếm chung cho cả 4 đường | 30/giờ/người; ghi audit `guest.lookup` mỗi lần tra theo SĐT/email, kể cả khi `createGuest`/`updateGuest` trùng hồ sơ ngoài phạm vi (không ghi giá trị) | người dùng | R2 |
| SR-RL-08 | B | Webhook | 300/phút/provider; body ≤ 64 KB | provider | R3 |
| SR-RL-09 | N | API chung đã đăng nhập | 600/phút/người | người dùng | R2 |

## 14. Bí mật và `.env` (SR-SECR)

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-SECR-01 | B | Bí mật chỉ ở `product/.env` trên từng máy (quyền 600, chủ sở hữu là user chạy docker), không commit; `.env.example` chỉ placeholder (đã đạt); gitleaks quét toàn lịch sử trong CI (đã có) + khuyến nghị pre-commit | CI xanh; kiểm quyền tệp trên VPS | R2 | OPS | TM-47 |
| SR-SECR-02 | B | `.dockerignore` loại `.env*`, `.data/`, `*.pem`, `*.key`, `*.age`, dump DB; image không chứa bí mật (kiểm `docker history`, quét image bằng gitleaks/trivy) | CI bước quét image | R2 | OPS | TM-47 |
| SR-SECR-03 | B | Mỗi môi trường bộ bí mật riêng; staging chỉ dùng khóa sandbox của cổng; khóa production không bao giờ ở máy dev | Rà `.env` staging | R2 | OPS | TM-35, TM-47 |
| SR-SECR-04 | B | Sổ bí mật (tên, chủ sở hữu, nơi giữ, chu kỳ xoay – **không ghi giá trị**) trong `hosting-plan.md`/runbook; xoay ngay khi người có quyền nghỉ việc hoặc nghi lộ: `SESSION_SECRET`, khóa cổng TT, token Beds24, MISA, Zalo, SMTP, tài khoản cổng BCA (ngoài app) | Runbook R3; diễn tập xoay 1 khóa ở staging | R3 | OPS, INV | TM-35, TM-57 |
| SR-SECR-05 | B | **Kiểm khi khởi động** (`api` và `worker`; môi trường quyết bằng `APP_ENV`, không dùng `NODE_ENV`): `APP_ENV` là `staging`/`production` mà (a) thiếu/yếu `SESSION_SECRET` (< 32 byte), `DATA_KEK_CURRENT` (≠ 32 byte), `ID_HASH_KEY`, `LOG_IP_HMAC_KEY`, `GUEST_CODE_SIGNING_KEY`; (b) **đồng hồ và mặt kiểm thử**: `CLOCK_MODE` ≠ `system` ở production; `INCLUDE_TEST_SUPPORT=1` ở production (dev/test: `INCLUDE_TEST_SUPPORT=1` đòi `TEST_SUPPORT_TOKEN` ≥ 32 ký tự); `COOKIE_SECURE_PREFIX=false` ngoài dev/test; biến cũ `CLOCK_OVERRIDE` đặt khác rỗng → dừng ở **mọi** môi trường; bundle production không chứa mã `test-support`/`__test__` (CI quét, fail-closed); (c) adapter tiền **đang bật** (có trong `PAYMENT_METHODS_ENABLED` hoặc `BANKFEED_PROVIDER` ≠ `none`) mà ở chế độ `mock` – cổng **không dùng** đặt `off` và route của nó không đăng ký; (d) `DATABASE_URL` dùng vai có `BYPASSRLS` → **dừng khởi động** với thông báo không lộ giá trị | Test khởi động từng ca, gồm ca hợp lệ: VNPay `production` + MoMo `off` → khởi động được; production + `CLOCK_MODE=mutable` → dừng; production + `INCLUDE_TEST_SUPPORT=1` → dừng; `CLOCK_OVERRIDE=x` ở dev → dừng; CI quét bundle không thấy `__test__` | R2 | BE, INT, OPS | TM-33, TM-47 |
| SR-SECR-06 | B | Bí mật không bao giờ in ra log, thông báo lỗi, `/health`, trang lỗi; `integration_log` không ghi khóa/chữ ký | Test log | R2 | BE, INT | TM-53 |
| SR-SECR-07 | B | **`TRUST_PROXY` bắt buộc** ở `APP_ENV=staging|production`: trống hoặc `false` → **dừng khởi động** (`ConfigError` không lộ giá trị, hướng dẫn đặt IP/CIDR reverse proxy). Giá trị là danh sách IP/CIDR: cấm `true` và số bước; ở **mọi** môi trường cấm tiền tố < /8 (IPv4) và < /16 (IPv6) (đặc biệt `0.0.0.0/0`, `::/0`); ở staging/production chỉ nhận loopback, RFC 1918, `fc00::/7` (Caddy trong mạng Docker nội bộ). Đặt CDN/proxy công cộng phía trước → SEC duyệt nới. OPS đặt giá trị trong compose staging/production; `.env.example` ghi "bắt buộc ở staging/production" | Test khởi động: staging thiếu `TRUST_PROXY` → dừng; `0.0.0.0/0`, `::/0`, `0.0.0.0/1`, `8.8.8.8` (staging) → `ConfigError`; `172.18.0.2`, `172.18.0.0/16`, `127.0.0.1` → nhận | R2 | BE, OPS | TM-01, TM-19, TM-21 |

## 15. Sao lưu và khôi phục (SR-BAK) – theo T18

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-BAK-01 | B | `pg_dump` hằng ngày + WAL archive (mục tiêu mất ≤ 15 phút) + thư mục tệp mã hóa; đích off-site **tại Việt Nam** (ESC-002 A) | Kiểm lịch chạy + đích | R2 (staging), GL | OPS | TM-52 |
| SR-BAK-02 | B | Mã hóa bản sao lưu bằng `age` với **khóa công khai** trên VPS; khóa riêng chỉ ở ngoài VPS (2 bản: INV + trình quản lý mật khẩu OPS), tách khỏi KEK | Thử giải mã trên máy khác; VPS không có khóa riêng | R2 | OPS | TM-12, TM-51 |
| SR-BAK-03 | B | **Vòng đời cứng ≤ 35 ngày** (7 bản ngày + 4 bản tuần) cho DB, WAL, tệp; snapshot tự động của nhà cung cấp VPS **tắt** hoặc ≤ 7 ngày (vì snapshot chứa cả `.env`/KEK). Sửa ADR-010 ("3 tháng") theo T18 | Kiểm chính sách đích + bảng điều khiển nhà cung cấp | R2 | OPS, ARC | TM-15 |
| SR-BAK-04 | B | Thông tin đăng nhập đích backup từ VPS chỉ cho **ghi thêm** (không xóa/ghi đè), hoặc đích tự kéo về; xóa theo vòng đời do đích tự làm. Hai cách miễn phí, OPS chọn khi lấy báo giá (ESC-002): **(a) PA2 – VPS thứ hai khác hãng**: máy phụ **tự kéo** bản sao lưu đã mã hóa từ VPS chính qua SSH bằng khóa chỉ đọc (giới hạn `command=`/thư mục backup), hoặc chạy `restic rest-server --append-only` trên máy phụ; vòng đời 35 ngày do máy phụ tự xóa. **(b) PA1 – object storage**: chỉ chọn nếu xác nhận được Object Lock hoặc versioning + khóa truy cập **không có quyền xóa**; BizFly Simple Storage chưa xác minh – nếu không có thì không dùng PA1 cho backup | Thử xóa/ghi đè từ VPS chính → bị từ chối | R3 | OPS | TM-52 |
| SR-BAK-05 | B | Thử khôi phục mỗi round vào môi trường cách ly: DB + tệp + giải mã 1 ảnh mẫu bằng KEK; đo RTO; **không** khôi phục backup production vào dev/staging dùng chung (dữ liệu thật) | Biên bản thử khôi phục | R2 (staging), mỗi round | OPS | TM-14, TM-52 |
| SR-BAK-06 | B | Sau khôi phục: áp lại `purge_journal` (SR-RET-03) – lưu ngoài vòng đời backup thông thường (bảng riêng sao lưu mỗi ngày, giữ ≥ 36 ngày, chỉ chứa ID) – rồi chạy J16 trước khi mở hệ thống cho người dùng | Diễn tập ở staging | R3 | OPS, BE | TM-56 |
| SR-BAK-07 | B | Thông báo xử lý dữ liệu nói rõ: dữ liệu đã xóa có thể còn trong bản sao lưu mã hóa tối đa 35 ngày (luật sư duyệt câu chữ) | Văn bản thông báo | GL | PO, luật sư | TM-15 |

## 16. Log, che dữ liệu, nhật ký thao tác (SR-LOG, SR-AUD)

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-LOG-01 | B | Log ứng dụng JSON có cấu trúc (`request_id`, route **mẫu** như `/v1/properties/:id/reservations/:id`, status, thời gian, `user_id`, vai); **không log body** request/response, không log header `Cookie`, `Authorization`, `X-CSRF-Token`, chữ ký nhà cung cấp | Test: gọi endpoint có body → log không có body | R2 | BE | TM-53 |
| SR-LOG-02 | B | Bỏ query string khỏi log truy cập (Caddy + API) trừ danh sách cho phép (`cursor`, `limit`, `view`, `from`, `days`, `date`, `reason`); IPN dạng GET chỉ log `provider` + `paymentId` + kết quả | Test + cấu hình Caddy production | R2 | OPS, BE | TM-53 |
| SR-LOG-03 | B | Che đường dẫn `/g/*` thành `/g/[redacted]` ở Caddy và API | Test log | R2 | OPS, BE | TM-23 |
| SR-LOG-04 | B | Bộ lọc che (redactor) chạy trên mọi bản ghi log và `Problem.detail`: khóa trong `c3Columns`, `password`, `pin`, `otp`, `token`, `code` (mã cửa), `docNumber`, `phone`, `email` (che giữa), chuỗi đạt Luhn, mẫu số CCCD 12 số/hộ chiếu; lỗi trả client không có stack trace | Test: ném lỗi chứa số thẻ/CCCD giả → log và response đã che | R2 | BE | TM-53 |
| SR-LOG-05 | B | Log kỹ thuật giữ 90 ngày (T16), không chứa C3; không dùng SaaS theo dõi lỗi ở MVP; nếu dùng (R3) phải bật lọc PII và ESC-002 | Cấu hình logrotate/docker | R2 | OPS | TM-53 |
| SR-LOG-06 | B | Cảnh báo bảo mật gửi OWN (trong app + email): ≥ 3 khóa tài khoản/giờ; vượt SR-RL-06; xem C3 của đơn đã trả phòng > 7 ngày; xem C3 ngoài khung `front_desk_hours` của cơ sở (BR-811; dùng thay "giờ ca" vì MVP không có phân hệ ca); job J16 lỗi; webhook chữ ký sai ≥ 5/giờ | Test sinh cảnh báo | R3 | BE, OPS | TM-11, TM-20 |
| SR-AUD-01 | B | `audit_event` ghi mọi thao tác tiền, chuyển trạng thái, cấu hình, phân quyền, từ chối quyền, đăng nhập/2FA; append-only | Test | R2 | BE | TM-06, TM-32 |
| SR-AUD-02 | B | REVOKE UPDATE/DELETE trên `audit_event`, `c3_access_log`, `state_transition`, `consent_record`, `folio_line`, `payment` với `ottimo_app`; xóa theo hạn T15 chỉ bằng vai job riêng xóa theo **phân vùng tháng** | Test lỗi quyền | R2 | BE, OPS | TM-54 |
| SR-AUD-03 | B | `before/after` qua serializer audit **danh sách cho phép** theo thực thể (không `additionalProperties` tùy ý), không C3, C2 che theo danh sách | Test snapshot audit | R2 | BE | TM-08, TM-53 |

## 17. Header, origin, kiểm đầu vào (SR-HDR, SR-INP)

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-HDR-01 | B | CSP cho cả 3 SPA: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'` (guest-web thêm `form-action` cổng thanh toán khi R3) – không `unsafe-inline`/`unsafe-eval` | Kiểm header; trình duyệt không báo vi phạm khi chạy E2E | R2 | OPS, FE | TM-05 |
| SR-HDR-02 | B | `Strict-Transport-Security: max-age=31536000; includeSubDomains`; `X-Content-Type-Options: nosniff`; `Referrer-Policy: no-referrer` (guest-web) / `same-origin` (admin, staff); `Permissions-Policy` chỉ bật `camera` cho origin cần chụp giấy tờ/sự cố | Kiểm header (securityheaders hoặc test) | R2 | OPS | TM-23 |
| SR-HDR-03 | B | TLS 1.2+ (Caddy mặc định); HTTP → HTTPS; không Cloudflare proxy giải mã TLS ngoài VN (ADR-010) | Kiểm cấu hình | R2 | OPS | TM-36 |
| SR-HDR-04 | B | **Tách origin**: admin-web, PWA nhân viên, guest-web ở 3 tên miền con khác nhau, mỗi origin proxy `/v1` tới api (cùng origin, không CORS); cookie host-only (`__Host-`); CORS tắt | Kiểm Caddyfile production | R2 | OPS, ARC | TM-05, TM-27 |
| SR-HDR-05 | N | `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin` | Kiểm header | R3 | OPS | TM-05 |
| SR-INP-01 | B | Mọi body/tham số kiểm bằng zod `.strict()` sinh từ OpenAPI; trường lạ → 422; độ dài tối đa cho mọi chuỗi | Test gửi trường thừa | R2 | BE | TM-10 |
| SR-INP-02 | B | Chỉ truy vấn tham số hóa (Drizzle/SQL có tham số); cấm nối chuỗi SQL (lint) | Lint + review | R2 | BE | – |
| SR-INP-03 | B | Thuộc tính đầu vào C3 trong OpenAPI có `writeOnly: true` (GuestDocumentInput, PartyMemberCreate, DoorCredentialInput) | Lint OpenAPI | R1 bước 4 | ARC | TM-08 |
| SR-INP-04 | B | Không `dangerouslySetInnerHTML`/`innerHTML` với dữ liệu người dùng (lint React); dữ liệu từ OTA/khách hiển thị dạng văn bản | Lint CI | R2 | FE, MOB | TM-05 |
| SR-INP-05 | B | Ô văn bản tự do có giới hạn độ dài + Luhn (SR-PAY-10); ghi chú khách gợi ý "không ghi sức khỏe/tôn giáo" (DRA F04) | Test + UI | R2 | BE, UXD | TM-30 |
| SR-INP-06 | B | Xuất CSV/XLSX (A105): escape ô bắt đầu bằng `= + - @ \t \r`; ghi người xuất + thời điểm ở cuối file; nhật ký xuất | Test | R3 | BE | TM-59 |

## 18. Hạ tầng và chuỗi cung ứng (SR-OPS, SR-SUP)

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-OPS-01 | B | VPS: chỉ mở 80/443 + SSH; SSH chỉ khóa, tắt mật khẩu và đăng nhập root, fail2ban; giới hạn IP SSH nếu được | Quét cổng từ ngoài; kiểm `sshd_config` | R2 (staging) | OPS | TM-49 |
| SR-OPS-02 | B | Postgres không publish cổng ở production (compose prod không có `ports` cho postgres); các container chạy user không root (đã có ở Dockerfile.api) | Kiểm compose prod | R2 | OPS | TM-49 |
| SR-OPS-03 | B | Vá bảo mật OS tự động (`unattended-upgrades`); cập nhật image base mỗi tháng | Kiểm cấu hình | R2 | OPS | TM-49 |
| SR-OPS-04 | B | Truy cập máy chủ production: chỉ OPS (và INV nếu muốn), mỗi người khóa SSH riêng; mỗi lần dùng `ottimo_readonly`/`psql` trên production ghi vào sổ vận hành | Runbook | R3 | OPS | TM-13, TM-49 |
| SR-OPS-05 | B | Giám sát uptime + cảnh báo đĩa đầy, job lỗi, backup lỗi | Cấu hình R2 | R2 | OPS | TM-20, TM-50 |
| SR-SUP-01 | B | `pnpm install --frozen-lockfile` bắt buộc trong CI và Dockerfile (bỏ nhánh fallback hiện tại ngay khi lockfile được commit – đầu R2) | CI | R2 | OPS | TM-48 |
| SR-SUP-02 | B | Quét lỗ hổng phụ thuộc trong CI (`pnpm audit --audit-level=high` hoặc OSV-Scanner): High/Critical có bản sửa → CI đỏ; ngoại lệ ghi lý do + hạn | CI | R2 | OPS | TM-48 |
| SR-SUP-03 | B | Renovate/Dependabot mở PR cập nhật hằng tuần; gói mới phải qua review (tên, số tải, người bảo trì) | Cấu hình repo | R2 | OPS, ARC | TM-48 |
| SR-SUP-04 | N | Ghim GitHub Actions theo SHA commit; base image theo digest | Kiểm workflow | R2 | OPS | TM-48 |
| SR-SUP-05 | N | Quét image (trivy) và SBOM khi build RC | CI | R3 | OPS | TM-48 |

## 19. Quyền chủ thể dữ liệu và sự cố (SR-DSR, SR-INC)

| Mã | Mức | Yêu cầu | Kiểm chứng | R | Vai | TM |
|---|:-:|---|---|:-:|---|---|
| SR-DSR-01 | B | Yêu cầu xem/sửa/xóa/rút đồng ý chỉ nhận qua app khách **mức 2** hoặc tại quầy có đối chiếu giấy tờ; không xử lý yêu cầu chỉ dựa trên email/SĐT | Test + quy trình | R3 | BE, PO | TM-58 |
| SR-DSR-02 | B | Rút đồng ý từ app khách (thiếu endpoint trong OpenAPI – thêm `POST /v1/guest/consents/{purpose}/withdraw`) → dừng xử lý mục đích, kích hoạt xóa (P02b → SR-RET-05) | Test | R2 | ARC, BE | TM-58 |
| SR-DSR-03 | B | Bản sao dữ liệu cho khách không chứa ảnh giấy tờ; giao trong app (mức 2) hoặc tại quầy, không gửi tệp C3 qua email | Review | R3 | BE | TM-58 |
| SR-INC-01 | B | Runbook sự cố dữ liệu: phát hiện → khoanh vùng (thu hồi phiên, thiết bị, xoay khóa) → đánh giá → báo cơ quan chức năng trong 72 giờ (DRA 6.4, luật sư xác nhận) → báo chủ thể; danh bạ liên hệ | Diễn tập bàn giấy R3 | R3 | OPS, SEC, INV | – |
| SR-INC-02 | B | Khả năng "thu hồi tất cả" một lệnh: mọi phiên nhân viên, mọi link khách, mọi thiết bị được cấp | Test lệnh ở staging | R3 | BE, OPS | TM-13 |

---

## 20. Bảng kiểm bảo mật cho Definition of Done (R2)

Một story chạm các nhóm dưới chỉ được coi là XONG khi có thêm:

| Story chạm | Phải có |
|---|---|
| Endpoint mới | `x-roles`, `x-scope`, `x-visible-to` cho trường nhạy cảm; test SR-AZ-09 cho endpoint đó |
| Dữ liệu C3 | SR-C3-02, -03, -07, -09; SR-DEV-03; test log không có giá trị C3 |
| Tải ảnh | SR-FILE-01, -03 (chuẩn hóa client + mã hóa lại ở server) |
| Tiền | SR-PAY-03, -06, -10; audit (SR-AUD-01) |
| App khách | SR-GST-06, -07, -08, -10, -11, -13 (nếu chạm xác minh), -14 |
| PWA | SR-PWA-01, -02, -04, -05 |
| Tích hợp | SR-INT-02, SR-PAY-09 (mọi adapter nhận payload ngoài – luật lọc 2 tầng), SR-SECR-06 |
| Cấu hình/OPS | SR-SECR-02, -05, -07; SR-OPS-02 |

## 21. Truy vết yêu cầu ↔ nguồn

| Nhóm SR | Nguồn chính |
|---|---|
| SR-AUTH, SR-SES | architecture mục 10; rbac 4.2, 5.2; BR-432; TM-01…06; R2: `outputs/SEC/s1-decisions.md` mục 1–2, FB-R2-SEC-BE-04/05/08/20 |
| SR-DEV | rbac 8.7; ARC M8; erd E4; R-REG-07; TM-46 |
| SR-AZ | rbac mục 3–8; ADR-007; erd mục 2; OpenAPI "Phân quyền"; TM-07…10 |
| SR-C3, SR-KEY, SR-FILE | DRA mục 3, R-REG-08, R-REG-09; ADR-013; erd mục 11; TM-11…20 |
| SR-RET | DRA mục 7 (T01–T18); erd 9.2, 12; ARC M3, M9; TM-20, TM-56 |
| SR-GST | ADR-006; DRA F09, F12; ARC M4; erd 9.3; TM-21…27 |
| SR-PAY | DRA mục 9 (R-PAY-01…10); ADR-011; INT 3.2; TM-28…33 |
| SR-INT, SR-LOCK, SR-MSG | INT README, smart-lock.md; DRA F05, F06, F12; ESC-011; TM-34…41, 60 |
| SR-PWA | ADR-005; architecture mục 11, 12; TM-42…45 |
| SR-SECR, SR-BAK, SR-OPS, SR-SUP | ADR-010, ADR-012; `.env.example`; ci.yml; Dockerfile; DRA T15–T18; TM-47…56 |
| SR-LOG, SR-AUD | DRA mục 3, T15, T16; erd 4.3; TM-19, TM-53, TM-54 |
| SR-DSR, SR-INC | DRA R-DSR, mục 6.4; TM-58 |

## 22. Lịch sử thay đổi

| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 18/10/2026 | 2 – Sprint 4 tuần Ổn định (Phản hồi & sửa) | Thêm **SR-AUTH-11** "người khác xác nhận tại quầy" (ngoại lệ có phạm vi của SR-AUTH-09, chỉ `checkOut.lateFeeInsteadOfNight` + `requestFoc` lồng – D5, `reviews/s4-SEC-lateFee-reauth.md`). **Đánh lại số**: review đặt nháp là SR-AUTH-10, nhưng số này đã dùng cho "đăng nhập gần nhất". SR-RL-02 đếm theo người xác nhận **và** người gọi | SEC |
| 16/10/2026 | 2 – Sprint 1 vòng sửa | **v0.3** theo `outputs/SEC/s1-decisions.md` + `w1-review.md`: SR-AUTH-02 (danh sách ≥ 10.000 từ SecLists lọc + danh sách tiếng Việt, ghi nguồn/giấy phép trong `SOURCE.md`, độ dài 10–256, startup check); SR-AUTH-04 (khóa chỉ chặn đăng nhập mới, không hủy phiên đang sống; đếm nguyên tử; OWN dùng vô hiệu hóa để đá phiên); mục 1.1 mới – biên cứng `session_policy`/`login_lockout` trong `x-security-parameters`; SR-SES-03 trỏ biên; SR-C3-09 thêm `door-credential` GET/PUT và `render-door-code` (việc treo từ W1); SR-C3-11 (1 dòng `view` mỗi lần lấy, bỏ ghi `copy`, không refetch ngầm, ẩn/xóa 60 giây + khi rời màn); SR-PAY-09 luật lọc thẻ 2 tầng (Luhn chặt cho văn bản tự do, Luhn + IIN cho trường khai kiểu, cửa sổ 13–19 số); SR-RL mục 13 (nơi lưu bộ đếm: xác thực ở DB, IP ở RAM chấp nhận R2 với 1 replica, R3 chuyển `rate_limit_counter`; audit khi chạm ngưỡng IP; SR-RL-05 thêm ghi check-in online; SR-RL-07 thêm `createGuest`/`updateGuest`); SR-SECR-05 bỏ `CLOCK_OVERRIDE`, thay bằng `CLOCK_MODE` + `INCLUDE_TEST_SUPPORT`/`TEST_SUPPORT_TOKEN`, dùng `APP_ENV`; SR-SECR-07 mới – `TRUST_PROXY` bắt buộc + giới hạn dải; SR-PAY-05 `APP_ENV` | SEC |
| 15/10/2026 | 1 – Bước 4 | Xử lý 10 thẻ FB-R1-ARC-SEC-01…10 + phân xử ORC: SR-FILE-01/03 (chuẩn hóa ảnh ở client, server chỉ JPEG/PNG/WebP, không PDF), SR-FILE-05 bỏ khỏi MVP, SR-DEV-01/08/09 (thiết bị di động của cơ sở, không bao giờ máy cá nhân), SR-GST-07/08 + mới SR-GST-13 (mã xác minh qua kênh OTA/Zalo, mặc định tắt), SR-GST-14 (ô email không bắt buộc), SR-GST-15 (luồng khách đến khuya), SR-LOCK-02 (`ddmm` + ≥ 3 số, bỏ ngoại lệ 2 số), SR-SECR-05(c) (`off`), SR-LOG-06 (`front_desk_hours`), SR-KEY-10 mới, SR-BAK-04 (cơ chế cụ thể), SR-AZ-09 (2 lớp), SR-C3-09 (cửa sổ trượt), SR-C3-10 | SEC |
| 15/10/2026 | 1 – Đợt 4 | Bản đầu: ~165 yêu cầu SR trong 19 mục; chốt 2FA OWN/MGR, thiết bị được cấp (M8), xác minh mức 2 app khách, vòng đời backup ≤ 35 ngày + `purge_journal`, M3/M4/M9 | SEC |
