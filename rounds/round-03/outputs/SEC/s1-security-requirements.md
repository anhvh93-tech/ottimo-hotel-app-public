# SEC – Yêu cầu bảo mật Sprint 1 Round 3 (chuẩn bị trước khi code)

- Người lập: SEC | Ngày: 22/10/2026 | Round 3 – Bước 2 Sản xuất (chuẩn bị Sprint 1)
- Mã tham chiếu: HEAD `ca369cd` (repo công khai `anhvh93-tech/ottimo-hotel-app-public`).
- Đầu vào: `rounds/round-03/plan.md` mục 1.2, 4.2; `rounds/round-02/reviews/s4-SEC.md` (C.8, C.10, C.13, C.15, E.1–E.7, E.13, F); ESC-027 (INV 22/10: **B**), ESC-024 (INV 22/10: **B**), ESC-026 (INV 22/10: **A**); decision-log 22/10; backlog 5.5 (R3-Q15, Q17, Q22, Q31, Q33, Q51); `product/docs/security/security-requirements.md` (SR-AUTH-04, 06, 07, 09, 11; SR-SES-02, 06; SR-C3-02, 09; SR-RL-02); OpenAPI (`loginMfa`, `getMy2fa`, `startMy2faSetup`, `disableMy2fa`, `MfaConfirmInput`); mã `platform/public/receiving-account.ts`, `platform.controller.ts`.
- Phạm vi: (A) SR-AUTH-06 chi tiết cho US-143 / US-164; (B) điều kiện Verified cho 6 thẻ SEC trước dữ liệu thật; (C) R3-Q51 màn tài khoản nhận VietQR; (D) điều kiện review trước khi gộp BUG-R2-208; (E) R3-Q31 phân loại Dependabot.
- Quy ước: **B** = bắt buộc; **N** = nên có. Mọi yêu cầu ở đây là yêu cầu kỹ thuật thuộc quyền SEC. Tài liệu không khẳng định "tuân thủ pháp luật".
- Repo công khai: tài liệu này **không** ghi thủ tục khôi phục kỹ thuật chi tiết, không ghi số tài khoản, không ghi bí mật. Phát hiện Critical/High chưa vá về sau đi Security Advisory nháp (E.1 (a)); hiện **không có** phát hiện nào thuộc nhóm này.

---

## A. SR-AUTH-06 – Đăng nhập hai bước cho `owner` / `manager` (US-143, theo ESC-027 B)

### A.1 Phạm vi và thời điểm bắt buộc

| Mã | Mức | Yêu cầu |
|---|---|---|
| 06.1 | B | Yếu tố thứ hai duy nhất là **TOTP** (RFC 6238, SHA-1, 6 chữ số, bước 30 giây) từ ứng dụng xác thực. **Không** có SMS, email OTP hay "ghi nhớ thiết bị này" để bỏ qua TOTP. |
| 06.2 | B | Bắt buộc với mọi người dùng có vai `owner` hoặc `manager` ở **bất kỳ** cơ sở nào (đọc từ `user_property_role` còn hiệu lực). `front_desk_lead` và vai khác: được bật tự nguyện; đã bật thì áp đủ A.2–A.6. |
| 06.3 | B | Cờ hệ thống `mfa_enforced` (tham số bảo mật, chỉ SEC/OPS đổi qua migration hoặc cấu hình triển khai, không phải màn Tham số). Khi `false`: người thuộc vai bắt buộc chưa bật 2FA vẫn đăng nhập được, nhưng mọi màn hiện nhắc (`mfaRequiredButMissing`). Khi `true`: xem 06.4. **`mfa_enforced = true` trên staging là điều kiện của cổng dữ liệu thật** (plan 6, nhóm cứng 2). |
| 06.4 | B | Khi `mfa_enforced = true`, người thuộc vai bắt buộc chưa bật 2FA đăng nhập bằng mật khẩu đúng thì nhận **phiên hạn chế** `mfa_enrollment_only`: chỉ gọi được `GET /v1/me`, `GET /v1/me/2fa`, `POST /v1/me/2fa/setup`, xác nhận đăng ký, đăng xuất. Mọi API khác → `403 MFA_ENROLLMENT_REQUIRED`. Kiểm ở server (guard chung), không chỉ ẩn ở FE. Đăng ký xong → cấp phiên **mới** (SR-SES-02). |
| 06.5 | B | Cấp vai `owner`/`manager` cho người chưa bật 2FA (`PUT /users/{id}/roles`) vẫn được, nhưng người đó rơi vào 06.4 ở lần đăng nhập kế tiếp (SR-SES-06 đã thu hồi phiên khi đổi vai). |
| 06.6 | B | Một chủ đầu tư duy nhất (ESC-027 B): app **không** chặn bật 2FA khi chỉ có một `owner`. Hiện câu `auth.enroll.single_owner` ở bước đăng ký và trên màn "Bảo mật của tôi" tới khi có `owner` thứ hai. Chuyển sang ESC-027 A sau này không cần sửa mã. |

### A.2 Đăng ký (enrollment)

| Mã | Mức | Yêu cầu |
|---|---|---|
| 06.7 | B | `startMy2faSetup` đòi `currentPassword` (argon2, đếm sai theo SR-RL-02). Sinh bí mật **≥ 160 bit** từ CSPRNG, lưu `mfa_secret_enc` (DEK, SR-C3-01) ở trạng thái **chờ xác nhận**; `mfa_enabled` vẫn `false`. Gọi lại setup thì thay bí mật chờ cũ. |
| 06.8 | B | URI `otpauth://` (và QR) chỉ trả **một lần**, `Cache-Control: no-store`. Nhãn: `OTTIMO:<tên đăng nhập>`, `issuer=OTTIMO`. Không chứa email, SĐT hay tên cơ sở. |
| 06.9 | B | **Không** lưu thân phản hồi chứa bí mật/URI hay mã khôi phục vào `idempotency_key.response_body` (SR-C3-02). Cách làm: endpoint setup/xác nhận/tạo lại mã khôi phục lưu bản ghi idempotency **không có thân** (lặp lại → `409` hoặc tạo bí mật mới), hoặc bỏ idempotency cho 3 endpoint này. ARC chọn, ghi OpenAPI. OpenAPI hiện có `IdempotencyKey` trên `startMy2faSetup` → **ARC sửa**. |
| 06.10 | B | Xác nhận đăng ký bằng một mã TOTP đúng của bí mật chờ. Đúng → `mfa_enabled = true`, sinh **10 mã khôi phục**, thu hồi mọi phiên khác của người đó, cấp phiên mới cho phiên hiện tại. |
| 06.11 | B | `c3_access_log` `subject_type = mfa_secret` `action = create` cho setup (đã có `x-c3-log`); `audit_event security` `mfa.enrolled` khi xác nhận. |

### A.3 Mã khôi phục

| Mã | Mức | Yêu cầu |
|---|---|---|
| 06.12 | B | 10 mã, mỗi mã **≥ 80 bit** ngẫu nhiên (ví dụ 16 ký tự base32, hiển thị nhóm 4-4-4-4). Lưu **băm** (`mfa_recovery_codes_hash`): SHA-256 chấp nhận được vì entropy cao; không lưu bản rõ, không mã hóa hai chiều. So khớp thời gian hằng. |
| 06.13 | B | Hiện **một lần** khi sinh, `no-store`; có nút tải `.txt` / in (thực hiện ở client, không gọi lại server). Màn nhắc cất **tách khỏi điện thoại**. Sau khi rời màn không xem lại được; chỉ có "tạo bộ mới". |
| 06.14 | B | Mỗi mã dùng **một lần**: xóa băm trong **cùng** câu `UPDATE … WHERE` có điều kiện băm còn trong mảng (nguyên tử). Hai yêu cầu song song cùng mã → đúng một cái thành công. |
| 06.15 | B | Dùng mã khôi phục → `audit_event security` `mfa.recovery_code_used`, thông báo trong app + **email** cho chính người đó và mọi `owner` (khác người đó nếu có). Còn ≤ 3 mã → nhắc tạo bộ mới mỗi lần đăng nhập. |
| 06.16 | B | "Tạo bộ mã mới" đòi step-up S2 (A.5); bộ cũ mất hiệu lực ngay; audit `mfa.recovery_codes_regenerated`. |

### A.4 Đăng nhập bước 2, giới hạn thử, chống phát lại

| Mã | Mức | Yêu cầu |
|---|---|---|
| 06.17 | B | Mật khẩu đúng + `mfa_enabled` → `401 MFA_REQUIRED` + `mfaToken`. `mfaToken`: ngẫu nhiên ≥ 256 bit, DB chỉ lưu SHA-256, **dùng một lần**, hết hạn **5 phút**, gắn với `user_id` và kênh (admin/PWA). Không phải phiên: không gọi được API nào ngoài `loginMfa`. Không đặt trong cookie phiên, không vào URL, không vào log. |
| 06.18 | B | `loginMfa` nhận TOTP **hoặc** mã khôi phục. TOTP chấp nhận bước hiện tại ± **1** (độ lệch đồng hồ). **Chống phát lại:** lưu `mfa_last_used_step`; mã của bước ≤ bước đã dùng → từ chối (cùng lỗi như mã sai). Cập nhật nguyên tử. |
| 06.19 | B | Giới hạn thử: mỗi `mfaToken` tối đa **5** lần sai rồi vô hiệu. Đếm theo **người dùng** (SR-RL-02): 5 sai/15 phút → `429`. Lần sai TOTP **cũng tính vào** bộ đếm khóa đăng nhập SR-AUTH-04 (5 sai → khóa tạm; 3 lần khóa/24 giờ → khóa cứng), vì kẻ có mật khẩu đúng đang dò TOTP là tình huống nguy hiểm nhất. Mỗi lần khóa → `audit_event security` + `security_alert` (SR-LOG-06) cho chính người đó và `owner`. |
| 06.20 | B | Mọi nhánh lỗi của `loginMfa` (token hết hạn, token đã dùng, mã sai, mã đã dùng, mã khôi phục sai) trả **cùng** `401 MFA_INVALID` (body giống nhau, không nói nhánh nào). |
| 06.21 | B | Đúng → cấp phiên mới (SR-SES-02), ghi `user_session.mfa_at` và phương thức (`totp` / `recovery_code`). `audit_event security` `auth.login` có `amr`. |
| 06.22 | B | Không bao giờ log, audit, trả lỗi hay đưa vào Problem: mã TOTP, mã khôi phục, `mfaToken`, bí mật, URI. Bộ che log (`secret-fields.ts`) thêm `code`, `mfaToken`, `recoveryCode`, `otpauthUri` ở mọi độ sâu. |

### A.5 Step-up khi đã có 2FA

Hai mức xác nhận lại:

- **S1** – giữ như hiện nay: PIN duyệt (SR-AUTH-09) hoặc mật khẩu, cửa sổ trượt `c3_stepup_minutes` (SR-C3-09). Dùng cho thao tác C3 thường ngày và phê duyệt FOC/xóa nợ.
- **S2** – mới: **mật khẩu + TOTP mới** (hoặc mã khôi phục), **không** có cửa sổ, gắn với **một** thao tác (token xác nhận dùng một lần, hết hạn 5 phút, gắn `operationId` + tham số chính). Người chưa bật 2FA (khi `mfa_enforced = false`): S2 = mật khẩu, và phản hồi kèm cờ để FE nhắc bật 2FA.

| Mã | Mức | Thao tác đòi **S2** |
|---|---|---|
| 06.23 | B | Đổi tài khoản nhận VietQR (`payment_receiving_account`, R3-Q51), hủy dòng đã lên lịch. |
| 06.24 | B | Xuất dữ liệu US-104 (mỗi lần xuất). |
| 06.25 | B | Tắt 2FA (chỉ vai không bắt buộc – vai bắt buộc → `403`), tạo lại mã khôi phục, đổi mật khẩu của chính mình khi đã bật 2FA. |
| 06.26 | B | Tạo người dùng, đổi vai lên `owner`/`manager`, đặt lại mật khẩu người khác, mở khóa cứng, vô hiệu tài khoản (`/settings/users`). |
| 06.27 | B | Đăng ký/thu hồi thiết bị tin cậy (`/settings/devices`). |
| 06.28 | N | Sửa tham số bảo mật (`x-security-parameters`) – S2 thay S1. |

| Mã | Mức | Liên quan US-164 và SR-AUTH-11 |
|---|---|---|
| 06.29 | B | **US-164 (xác nhận từ xa):** quản lý duyệt trên **phiên của chính mình** đã qua 2FA (`mfa_at` không null khi người đó có `mfa_enabled`) + **PIN duyệt** (S1, không dùng cửa sổ – mỗi yêu cầu nhập PIN). Yêu cầu xác nhận gắn một `approval_request` cụ thể, dùng một lần, hết hạn theo tham số (mặc định 15 phút – ESC-024 B). Người duyệt thấy đủ: căn, khách (che theo vai), số tiền **do server tính**, lễ tân gửi. |
| 06.30 | B | **ESC-024 B – hết hạn:** sau hạn không ai trả lời, lễ tân hoàn tất bằng **đúng** số server tính (BR-416), không có trường số tiền hay giảm/miễn trong request (server bỏ qua/422 nếu gửi), bắt buộc lý do; ghi `audit_event money` (`authMethod = expired_self_record`, người gọi, yêu cầu gốc), thông báo mọi `manager`/`owner` của cơ sở, mục "Cần chú ý" hậu kiểm 24 giờ. Nhánh này **không** dùng mật khẩu hay PIN của người khác. Server chỉ cho nhánh này khi điều kiện "căn không bán thêm đêm" còn đúng lúc ghi (đọc dưới khóa). |
| 06.31 | B | **SR-AUTH-11 (R3):** người xác nhận tại quầy có `mfa_enabled` → chỉ nhận **PIN** hoặc **mật khẩu + TOTP**; mật khẩu một mình → `401 REAUTH_FAILED` (fail-closed như hiện tại). Khi US-164 chạy trên staging, SEC xem lại có nên tắt hẳn đường tại quầy hay không. |

### A.6 Khôi phục khi mất thiết bị (ESC-027 B) và audit

| Mã | Mức | Yêu cầu |
|---|---|---|
| 06.32 | B | Đường 1 – mã khôi phục (A.3). Đường 2 – `owner` khác (khi có): `owner` đặt lại 2FA của người khác bằng S2 → người kia mất 2FA và mã khôi phục, mọi phiên bị thu hồi, lần đăng nhập kế phải đăng ký lại (06.4). **Không** ai đặt lại 2FA cho chính mình qua API. |
| 06.33 | B | Đường 3 – **thủ tục kỹ thuật** khi chỉ có một `owner` mất cả điện thoại lẫn mã: chỉ chạy được bằng lệnh quản trị trên máy chủ (không có endpoint HTTP); kết quả giống 06.32 (xóa 2FA, thu hồi phiên, hủy mã khôi phục, buộc đăng ký lại); ghi `audit_event security` `mfa.reset_by_operator` (người chạy, lý do, mã phiếu xác minh – không ghi giấy tờ hay dữ liệu xác minh); gửi **email** cho chính `owner` đó ngay khi chạy. Thủ tục từng bước (cách xác minh danh tính, ai chạy) do OPS viết, SEC duyệt, **lưu ngoài repo công khai**; repo chỉ ghi "có thủ tục, SEC duyệt ngày …". Diễn tập một lần trên staging trước dữ liệu thật, biên bản chỉ ghi kết quả. |
| 06.34 | B | `audit_event security` cho: `mfa.setup_started`, `mfa.enrolled`, `mfa.verify_failed` (gộp theo phút, không ghi mã), `mfa.locked`, `mfa.recovery_code_used`, `mfa.recovery_codes_regenerated`, `mfa.disabled`, `mfa.reset_by_owner`, `mfa.reset_by_operator`, `stepup.s2_granted`, `stepup.s2_failed`. Thông báo trong app cho chính người đó với mọi sự kiện trừ `setup_started` (SR-AUTH-07). |
| 06.35 | B | Màn "Bảo mật của tôi": trạng thái 2FA, số mã khôi phục còn, lần đăng nhập gần nhất (SR-AUTH-10). `owner` xem được trạng thái 2FA (bật/tắt, số mã còn) của mọi người dùng ở `/settings/users`, không xem được bí mật. |

### A.7 Ca test bắt buộc (BE + FE + QA; SEC chạy lại khi Verified)

1. OWN `mfa_enabled`: mật khẩu đúng không TOTP → không có phiên; gọi `/v1/me` bằng `mfaToken` → 401.
2. TOTP đúng → phiên mới (cookie trước đó không dùng được); `amr = totp`.
3. TOTP bước −1, 0, +1 nhận; −2, +2 từ chối (`Clock` giả).
4. Cùng mã dùng 2 lần (kể cả 2 yêu cầu song song) → lần 2 `401 MFA_INVALID`.
5. `mfaToken` dùng lại sau khi thành công → 401; sau 5 phút → 401; sai 5 lần trên một token → token chết.
6. 5 lần TOTP sai → khóa tạm SR-AUTH-04; 3 lần khóa/24 giờ → khóa cứng; `security_alert` cho OWN; phiên đang sống của người đó **không** bị đá (SR-AUTH-04).
7. Body lỗi giống nhau cho: token hết hạn / đã dùng / mã sai / mã đã dùng / mã khôi phục sai.
8. Mã khôi phục: dùng được 1 lần; hai yêu cầu song song cùng mã → đúng 1 thành công; sau khi dùng có email + thông báo + audit; còn 3 mã → nhắc.
9. `mfa_enforced = true`: MGR chưa bật 2FA → chỉ các endpoint 06.4 trả 200, `GET /reservations` → `403 MFA_ENROLLMENT_REQUIRED`; đăng ký xong → phiên mới, truy cập đủ.
10. Vai bắt buộc gọi `disableMy2fa` → 403; vai FD đã bật tự nguyện → tắt được với S2, mọi phiên bị thu hồi.
11. S2: đổi tài khoản nhận / xuất US-104 / đổi vai lên MGR với mật khẩu đúng nhưng không TOTP → 401; token S2 dùng cho thao tác khác (khác `operationId`) → 401; dùng lại → 401.
12. Quét log test, `audit_event`, `idempotency_key`, `outbox_message`, Problem: không có mã TOTP, mã khôi phục, `mfaToken`, bí mật, URI `otpauth`.
13. `POST /v1/me/2fa/setup` gửi lại cùng `Idempotency-Key` / F5 không trả lại bí mật cũ (06.9).
14. US-164: duyệt từ phiên chưa qua 2FA (người có `mfa_enabled`) → 401; PIN sai 5 lần → khóa duyệt; yêu cầu hết hạn → nhánh 06.30, request có trường số tiền bị bỏ qua/422, số ghi = số server tính; audit + thông báo MGR/OWN.
15. SR-AUTH-11: người xác nhận `mfa_enabled` chỉ đưa mật khẩu → 401 đồng nhất.
16. E2E Playwright admin-web: đăng ký (quét URI bằng thư viện TOTP trong test), đăng nhập 2 bước, nhập mã khôi phục, màn hạn chế 06.4. Có ca đồng hồ giả.

**Điều kiện SEC ghi Verified US-143/SR-AUTH-06:** 16 ca trên xanh trong CI push trên commit đã gộp; SEC đọc mã guard 06.4, so khớp 06.14/06.18 (nguyên tử), bộ che log; trên staging: `mfa_enforced = true`, OWN và MGR thật đăng nhập 2 bước được (SEC chứng kiến lúc PO/INV nghiệm thu, không giữ mã); thủ tục 06.33 có và đã diễn tập.

---

## B. Sáu thẻ SEC trước dữ liệu thật – điều kiện ghi Verified

### B.0 Điều kiện chung (mọi thẻ)

1. Sửa nằm trên commit **đã gộp `main`** (qua PR, CI bắt buộc xanh – cài đặt GitHub 22/10). Không Verified trên cây làm việc.
2. CI push trên commit đó xanh, 0 `retry #`.
3. SEC chạy lại các ca bắt buộc trên `git worktree` sạch tại commit đó, DB Postgres mới, migrate từ đầu tới migration mới nhất. Dữ liệu giả.
4. SEC đọc diff của PR (không chỉ test). Migration bù dữ liệu chạy lại được (idempotent) và giữ RLS/FORCE như migration 0078.
5. Không có dữ liệu cá nhân, id, tên trong `retention_run`, audit hay log mới.
6. SEC ghi Verified vào `rounds/round-03/reviews/SEC-sprint1.md` (commit, lệnh chạy, số ca) và cập nhật trạng thái thẻ ở `s4-SEC.md`. Thẻ Verified mới gỡ khỏi R3-Q17/Q22/Q33.
7. **Kiểm lại trên commit RC** (cổng QC RC, plan 6 nhóm cứng 2): chạy lại đúng các tệp test của 6 thẻ trên commit gắn tag RC. Đổi mã ở các tệp liên quan sau Verified thì SEC đọc lại diff.

### B.1 FB-R2-SEC-BE-65 (kiểm lại) – ảnh phiếu sự cố / kiểm phòng / `penalty_evidence` có mốc hạn lưu

- Trạng thái: Verified 19/10 trên cây làm việc. Việc R3: **Verified trên commit đã gộp**, rồi kiểm lại trên RC.
- Ca bắt buộc: `sec-be65-retention` (9 ca) + `registration-party-removal` (18 ca) xanh; migration 0078 có trong lịch sử và chạy trên DB mới; hồi quy gần `files-attachments`, `housekeeping-s4`, `housekeeping-s4-arc`, `registration-flow`, `registration-open-cap`, `guest-document-profiles` xanh.
- Ca 1 (ca P1 gốc) phải còn: phiếu `done`, J16 trước hạn còn ảnh; sau `attachment_ops_retention_months` + 1 ngày → `purged_at`, DEK hủy, GET 404.
- Đọc mã: `setRetentionAnchorForRef` theo một bản ghi; `onReservationVoided` đặt mốc trước `if (!reg) return`; hàm "chỉ tăng".

### B.2 FB-R2-SEC-BE-74 – J25 ẩn danh hồ sơ "từ giấy tờ" phải xóa cả liên hệ

- BE-C chọn (a) hoặc (b) theo thẻ và ghi trong PR. SEC chấp nhận cả hai; (b) đơn giản hơn nếu không đụng giao diện.
- Ca bắt buộc:
  1. Hồ sơ `document` + FD thêm SĐT, email, công ty → (a) `source` thành `desk` và áp T05/T06; **hoặc** (b) sau J25 các trường ngoài DRA 7.1 (SĐT, email, công ty, `name_search`, ghi chú) là NULL.
  2. Sau J25: hồ sơ ẩn danh không còn trường nào định danh được người (kiểm từng cột của bảng `guest`, không chỉ tên).
  3. Khách quay lại cùng SĐT/email sau khi ẩn danh → tạo hồ sơ mới hoặc gắn đúng, **không** có hai hồ sơ còn sống trùng SĐT/email; chỉ mục duy nhất vẫn đúng.
  4. Migration bù: hồ sơ đã ẩn danh trước bản sửa (nếu có) được xóa liên hệ; chạy 2 lần không đổi thêm.
  5. Audit J25 chỉ có số đếm.

### B.3 FB-R2-SEC-BE-75 – hồ sơ của đơn hủy / no-show / thành viên bị bỏ có mốc hạn lưu

- Ca bắt buộc:
  1. Hồ sơ trên đơn `cancelled` tạo cách đây 14 tháng (đồng hồ giả) → J25 ẩn danh.
  2. Tương tự với `no_show` và với thành viên bị bỏ khỏi đoàn.
  3. Hồ sơ không gắn đơn nào → mốc = `created_at`.
  4. **Nhiều cơ sở cùng tổ chức:** khách có đơn **mở** ở cơ sở B, hồ sơ cũ ở cơ sở A quá hạn → **không** ẩn danh. Hết đơn mở → ẩn danh ở lượt J25 sau.
  5. Hồ sơ có lưu trú `checked_out` gần (< hạn) → không ẩn danh (hồi quy).
- Đọc mã nếu dùng `SECURITY DEFINER`: hàm chỉ trả `boolean` (hoặc số đếm), tham số là id, `SET search_path` cố định, `REVOKE ALL … FROM PUBLIC`, `GRANT EXECUTE` chỉ cho role ứng dụng/job; không trả dòng dữ liệu của cơ sở khác. Nếu chạy J25 theo tổ chức thay vì hàm: chỉ role job, không qua API.

### B.4 FB-R2-SEC-BE-79 – đổi người của giấy tờ phải gỡ khóa / last4 / P05 ở hồ sơ cũ

- Ca bắt buộc (đúng 4 điểm của thẻ):
  1. Giấy tờ gắn A, A có P05 → A có `id_doc_hmac` + `id_doc_last4`. Đổi sang B → A **không** còn khóa/last4 (nếu trùng khóa của giấy tờ này).
  2. P05 của A được ghi qua giấy tờ này → về quyết định trước đó của A hoặc `not_asked`; có `audit_event` (không chứa số giấy tờ).
  3. B chưa có P05 → B **không** có khóa/last4; B có P05 → có.
  4. B quay lại lần sau → cổng khớp gắn vào **B**, không gắn A.
  5. Đổi qua lại A → B → A trong cùng lượt: trạng thái cuối đúng như chỉ gắn A.
  6. Mọi bước trong **một** giao dịch: lỗi giữa chừng (ép lỗi trong test) → không còn trạng thái nửa vời.
  7. Hồi quy `guest-document-profiles` (ca BE-73), CHECK `guest_id_doc_last4_consent_check` còn `convalidated = true`.

### B.5 FB-R2-SEC-BE-83 – chống chia nhỏ xóa nợ (R3-Q22), cùng ESC-026 A

- Nằm trong **lượt kiểm tiền** R3 Sprint 1 (plan 4.1 bước 4); DOM là oracle.
- Ca bắt buộc (dữ liệu: công nợ 5.000.000 trên một folio, giá 1 đêm cơ sở hạn mức 667.000):
  1. MGR gửi 450.000 → tự áp; gửi tiếp 450.000 (tổng 900.000 > 667.000) → `pending` chờ OWN. Mười lần tiếp theo đều `pending`.
  2. Biên: tổng đúng 667.000 → tự áp; thêm 1 đồng → `pending`.
  3. Yêu cầu bị từ chối / hủy **không** tính vào tổng; yêu cầu đang chờ **có** tính.
  4. **Song song:** hai yêu cầu MGR 400.000 cùng lúc (mỗi cái hợp lệ riêng, cộng lại vượt) → đúng một cái tự áp, cái kia `pending`. Đọc tổng dưới khóa folio, theo thứ tự khóa ARC 16.19.
  5. OWN tự áp không đổi hành vi.
  6. Công nợ đóng rồi mở lại (chu kỳ nợ mới) → tổng tính lại từ chu kỳ mới, theo định nghĩa DOM ghi ở BR-433 ("một lần = một công nợ").
  7. ESC-026 A: FOC thường vẫn theo hạn mức từng khoản; tổng FOC trên **một lượt ở** vượt hạn mức một lần của người miễn → thông báo OWN ngay + mục hậu kiểm 24 giờ. Có ca kiểm thông báo sinh đúng một lần, không chặn thao tác.
  8. Gỡ thẻ `pendingFix` `R3-SEC-BE-83` khỏi `br-examples.json`; dòng BR-525-26, BR-525-27 chạy xanh.
  9. Đưa ca 1–4 vào fuzz công nợ R3-Q30.
- Kèm R3-Q25 (Should, nếu làm cùng): MGR tự áp `debt_write_off` phải xác thực lại như khi duyệt (S1).

### B.6 FB-R2-SEC-BE-84 (a) – có người được báo khi ảnh thiếu mốc hạn lưu (R3-Q33 a)

- Đội chọn một trong hai (ARC ghi lựa chọn trước khi code):
  - **(a1) "Cần chú ý"** `attachment_retention_anchor_missing`: chỉ `owner`/`manager` thấy (FD, HK → không); nội dung chỉ số đếm và hướng dẫn; ARC thêm vào danh sách `check` OpenAPI; UXD viết câu theo brand.
  - **(a2) Cảnh báo OPS** từ `retention_run` `anchor_missing > 0`: người nhận `owner` (email/app), không chứa id hay dữ liệu cá nhân.
- Ca bắt buộc: tạo ảnh đã gắn, không mốc, `uploaded_at` quá `attachment_ops_retention_months` + biên → sau J16: (a1) GET "Cần chú ý" của OWN có mục với đúng số đếm, của FD không có; **hoặc** (a2) cảnh báo được sinh, người nhận OWN. Hết ảnh thiếu mốc → mục tự biến mất / không cảnh báo lặp. J16 **không** xóa ảnh thiếu mốc (hồi quy C.15 (b2)).
- (b) `FOR SHARE` là Should: nếu làm, có test hai giao dịch song song (upload `penalty_evidence` + trả phòng) → ảnh luôn có mốc.

### B.7 R3-Q15 (đi cùng nhóm, không thuộc 6 thẻ nhưng cùng cổng)

- `note` yêu cầu khách bị xóa (NULL hoặc thay chuỗi cố định) sau `retention.guest_request_months`; ca: trước hạn còn, sau hạn mất; bản ghi yêu cầu còn (để thống kê) nhưng không còn văn bản tự do; audit chỉ số đếm. SEC Verified theo B.0.

---

## C. R3-Q51 – màn "Tài khoản nhận chuyển khoản (VietQR)"

Mã server đã có (SEC F1–F3): chỉ `owner`, xác thực lại trong request, audit `money` che số, đẩy thông báo OWN/MGR, cảnh báo "vừa đổi trong 24 giờ", danh sách trả `accountNoMasked`. Yêu cầu cho màn mới và phần còn thiếu:

| Mã | Mức | Yêu cầu |
|---|---|---|
| Q51-1 | B | **Chỉ OWN.** Màn nằm ở `/settings/parameters` nhưng mục này chỉ hiện khi vai `owner`. API đọc lịch sử / đặt / hủy dòng lên lịch: vai khác → `403` (đọc) và `403` (ghi), có ca RBAC. `manager` **không** xem màn này (chỉ thấy cảnh báo "vừa đổi" trên QR như hiện nay). |
| Q51-2 | B | **Che số.** Mọi GET (hiện hành, lịch sử, dòng lên lịch, audit, thông báo, SSE, outbox, `idempotency_key.response_body`, log) chỉ có `accountNoMasked`. Số đầy đủ **chỉ** rời server trong payload VietQR. Đề xuất đổi định dạng che sang `•••• 1234` kèm **tên ngân hàng** tra từ BIN thay vì `<4 số BIN>••••1234` (dạng hiện tại giống số thẻ, dễ gây hiểu nhầm) – Suggestion cho BE-B/UXD. |
| Q51-3 | B | **Nhập:** ô số tài khoản **không** điền sẵn số cũ; `autocomplete="off"`, không lưu vào `localStorage`/`sessionStorage`/state toàn cục; gõ **hai lần** (ô xác nhận) và màn xác nhận hiện tên ngân hàng + `•••• 4 số cuối` + tên chủ tài khoản + ngày hiệu lực. Rời màn hoặc lưu xong → xóa giá trị trong form. |
| Q51-4 | B | **Xác thực lại S2** (A.5, 06.23) cho đặt mới và hủy dòng đã lên lịch. Trước khi `mfa_enforced` bật: mật khẩu (như `x-reauth-parameters` hiện tại). Sai đếm theo SR-RL-02. |
| Q51-5 | B | **Hiệu lực từ ngày mai** (luật lịch sử tham số, theo ngày kinh doanh của cơ sở, không theo ngày lịch máy). Không có đường "hiệu lực ngay". Hủy dòng lên lịch được khi chưa tới ngày hiệu lực. |
| Q51-6 | B | **Audit + báo:** đặt / hủy dòng → `audit_event money` (người, ngày hiệu lực, số **che** cũ và mới, tên chủ tài khoản); thông báo trong app mọi OWN/MGR **và email** cho mọi `owner` (kênh ngoài app – người chiếm phiên OWN không tự xóa được thông báo). Đến ngày hiệu lực → cảnh báo "vừa đổi" 24 giờ trên mọi QR (giữ `pay.receiving_account_changed`). |
| Q51-7 | B | Kiểm đầu vào giữ như `parseReceivingAccount` (BIN 6 số, số 6–19 chữ số, tên NAPAS in hoa không dấu ≤ 50, chặn số thẻ trong tên, không nhận trường thừa). Không có số tài khoản trong URL/query (SR-C3-05). |
| Q51-8 | B | Màn không có nút "xem đầy đủ số"; muốn đối chiếu thì OWN quét QR thử bằng app ngân hàng của mình với số tiền 0/nhỏ – hướng dẫn vận hành ghi. |
| Q51-9 | B | Staging: theo khuyến nghị E.13 (a), INV **tự nhập** tài khoản nhận thật của OTTIMO trên màn này (không đưa số vào repo, chat hay tài liệu). Trước khi làm xong màn: giữ biện pháp (b) đã làm (tên hiển thị thử) và quy tắc không quét QR staging bằng app ngân hàng thật. |

Ca test bắt buộc: RBAC 4 vai (OWN 200; MGR, FD, HK 403); quét JSON mọi đường đọc không có `accountNo` đầy đủ; đặt với mật khẩu sai → 401, không ghi; đặt hiệu lực hôm nay → 422; đặt + hủy → 2 dòng audit che số, thông báo + email; QR sinh ngày hiệu lực có cảnh báo, sau 24 giờ không; E2E: form không giữ giá trị sau khi rời màn, ô xác nhận khác → không cho lưu; axe trên màn mới.

---

## D. BUG-R2-208 (R3-Q19) – điều kiện SEC review trước khi gộp

Giữ nguyên 5 điều kiện ở `rounds/round-02/reviews/s4-SEC.md` mục F; cập nhật theo tình hình 22/10:

1. **Thứ tự:** 207 đã **Closed** (20/10, `d527f9c`). 208 chỉ gộp sau khi **210 (R3-Q21) đã gộp và SEC/QA Verified** `openDebtVnd` đúng trên dữ liệu ghi trước 0076. 209 song song được nếu khác tệp; nếu chung tệp với 208 thì 209 trước.
2. **SEC review riêng PR 208 trên commit sẽ gộp** (head SHA của PR sau rebase lên `main` có 210), ghi ở `rounds/round-03/reviews/SEC-on-BE-208.md`. Commit thêm sau khi SEC duyệt → review lại phần diff thêm. Không gộp khi chỉ có review trên cây làm việc.
3. **Test trong PR, DB thật:** (a) A32 tăng lặp rồi giảm vẫn 409, `openDebtVnd` không giảm trừ khi thu tiền hoặc xóa nợ đã duyệt; (b) biên = còn phải thu − `openDebtVnd` được, +1 đồng 409; (c) hai A32 giảm song song cộng lại vượt → đúng một 409, đọc dưới khóa folio theo ARC 16.19; (d) cổng `openDebt` trả `null` khi 0 không làm mất kiểm tra ở xóa nợ, J15; (e) các ca (a)–(c) vào fuzz R3-Q30, giữ bất biến BR-525 (ii).
4. **Không mở đường void phần nợ không qua OWN:** SEC rà **mọi** đường ghi `folio_line` trên folio `settled` trong cửa sổ (A32 tăng/giảm, void, đảo, đổi giá, chuyển dòng sang folio khác, FOC đăng lại); phần đã thành nợ chỉ giảm qua `debt_write_off` (BR-433, tính theo tổng khi BE-83 xong) hoặc thu tiền. Mỗi lần giảm được phép ghi audit có vai, số giảm, `openDebtVnd` trước/sau.
5. **`Folio.totals.openDebtVnd`** chỉ cho FD+; không thêm vai đọc.
6. **Bổ sung R3:** 208 **không phụ thuộc** BE-83 để gộp (208 không làm lỗ chia nhỏ xóa nợ rộng hơn), nhưng lượt kiểm tiền chỉ "đạt" khi cả hai Verified và fuzz R3-Q30 chạy trên bản có cả hai. Nếu 209 đổi J15 (ARC 16.31.2 b), SEC review gộp với 208 ở điểm 4 vì cùng làm thay đổi `openDebtVnd`.

Thiếu điều kiện nào → SEC không ký, giữ N-7 theo chu kỳ như hiện tại.

---

## E. R3-Q31 – phân loại cảnh báo Dependabot (đọc 22/10 bằng `gh api`, chỉ đọc)

Nguồn: `GET repos/anhvh93-tech/ottimo-hotel-app-public/dependabot/alerts` → **3 cảnh báo mở, cả 3 mức "medium" theo GitHub, không có Critical/High**. `automated-security-fixes`: bật (INV/ORC 22/10). Không có PR vá bảo mật tự động: bản vá của `react-router` là nhánh 7 (bản lớn, gói đổi tên), còn `esbuild` 0.18.20 bị khóa bởi `@esbuild-kit/core-utils` của `drizzle-kit` 0.31.11 – Dependabot không tự nâng được.

| # | Gói / đường vào | Advisory | Có chạm tới? (kiểm lại trên `ca369cd`) | Mức SEC | Sprint 1? |
|---|---|---|---|---|---|
| 1 | `esbuild` 0.18.20 – chỉ dev, qua `drizzle-kit` → `@esbuild-kit` | GHSA-67mh-4wv8-2f99 (dev server) | Không: không chạy `esbuild --serve`; không vào image production | Low | **Không.** Đóng cảnh báo lý do "vulnerable code not used", ngày xem lại 22/01/2027 hoặc khi `drizzle-kit` bỏ `@esbuild-kit` |
| 2 | `react-router` 6.30.6 (admin-web) | GHSA-337j-9hxr-rhxg (SSR hydrate) | Không: admin-web là SPA, không `createStaticHandler`/`hydrateRoot`/SSR | Low | **Không.** Hết khi nâng v7 |
| 3 | `react-router` 6.30.6 (admin-web) | GHSA-wrjc-x8rr-h8h6 (chuyển hướng ngoài bằng `\`) | Hầu như không: điểm duy nhất là `LoginPage.tsx` (`from` từ `location.state`, do `RequireAuth` đặt bằng `pathname`; phải `startsWith` một đường của `NAV`). Mọi đường `NAV` có đoạn sau `/` (không có `/` trống), nên `/\…` không lọt | Low | **Một phần:** thêm test chặn ngay (không đợi v7) |

**Quyết định SEC (trong quyền):**

- **Không cảnh báo nào bắt buộc sửa mã phụ thuộc trong Sprint 1.** Không cần Security Advisory nháp (không có Critical/High, không khai thác được từ ngoài).
- **Sprint 1 – bắt buộc (nhẹ):** FE-A thêm unit test cho `useAfterLoginPath`: `from` = `/\\evil.example`, `//evil.example`, `/%5Cevil.example`, `/overview\\@evil.example`, `https://evil.example` → luôn về `homePath`, không điều hướng ra ngoài. Thêm quy tắc lint/review: không `navigate()` tới chuỗi lấy từ query/hash.
- **Trước bản dùng thử cuối R3 (Should, cùng S4-16 toolchain FE):** nâng `react-router-dom` 6 → `react-router` ≥ 7.18 (ARC/FE-A lên kế hoạch, ngoài lượt kiểm tiền). Nếu dời R4 → ORC/OPS đóng 2 cảnh báo `react-router` với lý do "vulnerable code not used" + dẫn mục này, ngày xem lại.
- **OPS/ORC (SEC không tự đổi trạng thái cảnh báo):** đóng cảnh báo #1 như trên.
- **6 PR Dependabot cập nhật phiên bản (#1, 2, 3, 5, 6, 7) – không phải vá bảo mật:**
  - #7 (minor/patch: turbo, fontsource, astro, fake-indexeddb, axe, playwright): gộp được khi CI xanh, ngoài lượt kiểm tiền.
  - #1 `actions/upload-artifact` 4 → 7: đổi workflow → **SEC review** theo E.6 (6) (ghim SHA, không đổi quyền), rồi gộp.
  - #2 (React 19), #3 (vite), #5 (`@vitejs/plugin-react` 6), #6 (jsdom 30): bản lớn → gom vào S4-16, không gộp trong Sprint 1.
- **Thường trực:** cảnh báo mới mức High/Critical → SEC phân loại trong 2 ngày làm việc; khai thác được và chưa vá → SEC **đề xuất** Security Advisory nháp (ORC/INV tạo), repo chỉ ghi một dòng. CI giữ `pnpm audit --audit-level=high`.

---

## F. Việc theo vai (tóm tắt để ORC giao)

| Vai | Việc |
|---|---|
| ARC | 06.9 (idempotency của setup 2FA), 06.17/06.29 hợp đồng `mfaToken`, S2 token, `MFA_ENROLLMENT_REQUIRED`, `MFA_INVALID`; chọn B.6 (a1)/(a2); US-164 trạng thái hết hạn (06.30) |
| BE-C | US-143 (A), BE-65 gộp, BE-74, BE-75, BE-79, BE-84 (a) |
| BE-B | BE-83 + ESC-026 A, R3-Q51 phần server (S2, email), 208/209 theo D |
| FE-A | Màn 2FA (đăng ký, bước 2, mã khôi phục, màn hạn chế), S2 dialog, R3-Q51, test `useAfterLoginPath` |
| UXD | Câu chữ 2FA, mã khôi phục, `auth.enroll.single_owner`, R3-Q51, mục "Cần chú ý" (nếu a1) – theo brand OTTIMO |
| OPS | Thủ tục 06.33 (ngoài repo), cờ `mfa_enforced` trên staging, (a2) nếu chọn, đóng cảnh báo Dependabot #1 |
| QA | Ca A.7, B.1–B.6, C, D vào bộ test; ca đồng hồ giả cho TOTP |
| SEC | Review PR US-143, US-164, R3-Q51, 208; Verified 6 thẻ theo B.0; cập nhật `security-requirements.md` SR-AUTH-06 theo mục A |
