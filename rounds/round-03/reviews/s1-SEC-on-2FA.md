# SEC review – US-143 (2FA) R3 Sprint 1: server BE-C + client FE-A

- Người review: SEC | Ngày: 23/10/2026 | Round 3 Sprint 1 – Bước Review
- Căn cứ: `outputs/SEC/s1-security-requirements.md` mục A (06.1–06.35, 16 ca A.7); OpenAPI 0.3.8-draft; báo cáo `outputs/BE/s1-be-c.md`, `outputs/FE/s1-fe-a.md` (trong từng worktree).
- Server: nhánh `worktree-agent-aeb2b1b2ad5190d92`. Review `bd0fb4f` (US-143 server), `8712822` (S2 không vỡ trên `changeMyPassword` / `trustCurrentDevice`), `ae836f7` (CỔNG S2). `db7d3f1` phía trên chỉ thêm báo cáo, không đổi mã.
- Client: nhánh `worktree-agent-aefb4922ed24dd839`, commit `2888322`.
- Dữ liệu dùng để kiểm: toàn bộ là dữ liệu giả của fixture. Không có bí mật, mã hay dữ liệu thật trong tệp.

## Kết luận

| Commit | Kết luận SEC |
|---|---|
| `bd0fb4f` + `8712822` (server) | **Gộp được**, 0 Blocker. Điều kiện: `MFA_ENFORCED` giữ `false` trên staging tới khi sửa FB-R3-SEC-BEC-01. |
| `ae836f7` (CỔNG S2) | **Không gộp riêng.** Chỉ gộp **cùng** phần FE gắn hộp S2 vào 6 thao tác và phần sửa E2E của QA (FB-R3-SEC-FEA-01). Mã server của cổng đạt yêu cầu bảo mật. |
| `2888322` (FE-A) | **Gộp được**, 0 Blocker. Gộp cùng hoặc sau `bd0fb4f`. |
| US-143 / SR-AUTH-06 | **Chưa Verified.** Còn 3 Major, 4 ca A.7 chưa có hoặc chưa đúng (12, 14, 16, phần log của 12), các mục staging của điều kiện Verified. |

Thẻ Blocker: **không có**.

Thẻ Major (phải xử lý trong round):

- **FB-R3-SEC-BEC-01**: kẹt vòng giữa mật khẩu tạm và phiên hạn chế khi `MFA_ENFORCED = true`. Mọi `manager`/`owner` mới tạo, hoặc vừa được đặt lại mật khẩu, không đăng nhập vào làm việc được. Phải sửa trước khi bật cờ trên staging.
- **FB-R3-SEC-BEC-02**: ca 12 quét `audit_event` không kiểm được gì, vì nối chuỗi với `NULL`. Ca vẫn xanh nhưng không chứng minh gì.
- **FB-R3-SEC-FEA-01**: FE chưa gắn S2 vào 6 thao tác. Hậu quả: `ae836f7` chưa gộp được. Ngay cả không có cổng, người đã bật 2FA cũng không đổi được mật khẩu và không đăng ký được thiết bị.

### Ca 11: chấp nhận `422 STRONG_REAUTH_REQUIRED` thay cho 401 khi thiếu yếu tố thứ hai

**Chấp nhận.** SEC sửa ca 11 thành: thiếu yếu tố thứ hai → `422 VALIDATION_FAILED` + `errors[].code = STRONG_REAUTH_REQUIRED`; sai mật khẩu hoặc sai mã → `401 REAUTH_FAILED`.

Lý do (đã đọc `strong-reauth.ts` dòng 97–118):
1. Server trả 422 **trước** khi kiểm mật khẩu (dòng 116, `verifyPassword` ở dòng 119), nên phản hồi giống hệt dù mật khẩu đúng hay sai. Không thành công cụ dò mật khẩu.
2. Nhánh 422 không tiêu mã, không ghi bộ đếm, không mở cửa sổ, không làm thao tác. Cái nó tiết lộ ("tài khoản này đã bật 2FA") là điều người giữ phiên vốn đọc được qua `GET /v1/me`.
3. Gửi đủ yếu tố mà sai bất kỳ cái nào thì vẫn ra **một** câu 401, có đếm SR-RL-02. Đúng ý 06.20 và ca 11.

Điều kiện giữ chấp nhận:
- (a) Không có nhánh nào trả 422 **sau** khi đã kiểm mật khẩu.
- (b) Test ca 11 giữ assert "422 với mật khẩu sai + thiếu mã" (thêm nếu chưa có), để chứng minh (a).
- (c) FE hiện cùng một câu cho 422/401 của S2. `StrongReauthDialog` đã làm vậy.

Cùng lý do, SEC chấp nhận cách ARC 1.2 gửi bằng chứng S2 **trong** chính request, thay cho "token S2 gắn `operationId`" của mục A.5. Bằng chứng gửi kèm chỉ dùng được cho đúng request đó, và TOTP chống phát lại theo bước, nên chặt hơn token. Ca 11 "token S2 dùng cho thao tác khác / dùng lại → 401" được hiểu là "mã TOTP đã dùng, gửi lại ở thao tác khác hoặc cùng thao tác → 401". SEC cập nhật A.5/A.7 trong `s1-security-requirements.md` ở lượt sau.

## Kiểm đã chạy

Chạy trên Postgres 17 riêng của SEC (container tạm, đã xóa), role `ottimo_app`, migration bằng `ottimo_migrator`, từ đầu tới 0079.

1. Server: `be-c-r3-s1-units`, `integration/mfa-us143`, `integration/identity`, `config`: **75/75 đạt**, không skip.
2. Client: `admin-web/src/__tests__/r3-s1-fea.test.tsx`: **37/37 đạt**.
3. SEC tự viết test dò tạm, không commit, đã xóa khỏi worktree (worktree sạch):
   - **P1:** manager có `must_change_password = true`, app chạy với `MFA_ENFORCED = true`. Đăng nhập `200` với `mfaEnrollmentRequired: true` và `mustChangePassword: true`. `POST /v1/me/2fa/setup` → `403 PASSWORD_CHANGE_REQUIRED`. `POST /v1/me/password` → `403 MFA_ENROLLMENT_REQUIRED`. **Kẹt**, xem FB-R3-SEC-BEC-01.
   - **P2:** đọc lại bảng `audit_event` sau bộ test. Cả 152 dòng `auth.*`, `mfa.*`, `stepup.*` đều có `before IS NULL`, nên câu quét của ca 12 bỏ qua hết (FB-R3-SEC-BEC-02). SEC quét lại đúng cách bằng `coalesce` và regex (otpauth, mẫu mã khôi phục, tên trường `mfaToken`/`totpCode`/`recoveryCode`). Có 4 dòng khớp, đều là UUID trong `user.created`/`user.roles_changed` hoặc lý do "lost phone", tức khớp nhầm. Mã server **không rò** vào audit, chỉ có test là chưa chứng minh.
4. SEC đọc mã: `totp.ts`, `mfa-store.ts`, `strong-reauth.ts`, `auth.service.ts` (`login`, `loginMfa`), `mfa.service.ts`, `mfa.controller.ts`, `auth.guard.ts`, `0079_mfa_two_factor.sql`, `operator-reset.ts` + CLI, `users.controller.ts`, `devices.controller.ts`, `auth.controller.ts`, `secret-fields.ts`, `http.ts` (redact). Phía FE: `LoginPage`, `MfaStep`, `Enroll2faPage`, `RecoveryCodes`, `StrongReauthDialog`, `SessionProvider`, `QrCode` của `@ottimo/ui`.

## Đối chiếu 06.1–06.35

| Mã | Trạng thái | Ghi chú |
|---|---|---|
| 06.1 | Đạt | HMAC-SHA-1, 6 số, 30 giây, có vector RFC 6238. Không có SMS/email/"ghi nhớ thiết bị". |
| 06.2 | Đạt | `requiresMfa` và `auth_resolve_session.mfa_required` đọc vai còn hiệu lực ở mọi cơ sở. |
| 06.3 | Đạt | `MFA_ENFORCED`: production thiếu `true` thì từ chối khởi động. Staging do OPS bật, là điều kiện cổng dữ liệu thật. |
| 06.4 | Đạt có điều kiện | Guard chung chạy trước kiểm vai, kể cả phiên mở trước khi bật cờ. Upload multipart chỉ kiểm sơ bộ rồi guard chạy đủ. **Kẹt với mật khẩu tạm** (BEC-01). |
| 06.5 | Đạt | Đổi vai thì thu hồi phiên, lần đăng nhập sau vào phiên hạn chế. |
| 06.6 | Đạt | `soleOwner` có, FE hiện `auth.enroll.single_owner`. |
| 06.7 | Đạt | Đòi `currentPassword` (PasswordReauth, đếm SR-RL-02). 160 bit CSPRNG, DEK riêng, trạng thái chờ. Setup lại thì hủy DEK cũ. |
| 06.8 | Đạt | `no-store`, nhãn `OTTIMO:<username>`, `issuer=OTTIMO`. QR vẽ tại client, không qua dịch vụ ngoài. |
| 06.9 | Đạt | Không có `Idempotency-Key` ở setup/confirm/regenerate. Ca 13 xanh. |
| 06.10 | Đạt | Thu hồi mọi phiên, cấp phiên mới, sinh 10 mã. |
| 06.11 | Đạt | Ghi `c3_access_log` `mfa_secret/create` và audit `mfa.enrolled`. |
| 06.12 | Đạt | 80 bit Crockford, SHA-256 có tiền tố. So khớp bằng `= ANY` trong SQL, chấp nhận vì kẻ tấn công không điều khiển được tiền tố băm. |
| 06.13 | Đạt | Hiện một lần. `.txt`/In làm ở client, iframe chỉ có text node. Phải tick ô xác nhận mới xong. Không ghi Web Storage. |
| 06.14 | Đạt | Một câu `UPDATE … array_remove … WHERE $hash = ANY(…)`. Ca 8 song song xanh. |
| 06.15 | Đạt | Có audit, thông báo người đó + OWN, email outbox (bộ gửi còn mock). Còn ≤ 3 mã → `recoveryCodesLow`. |
| 06.16 | Đạt | S2, bộ cũ chết ngay, có audit. |
| 06.17 | Đạt | 256 bit, DB chỉ giữ SHA-256, 5 phút, gắn người + kênh. Không cookie, không URL. FE chỉ giữ trong state React. Xem thêm BEC-03 (token không bị hủy khi đổi/đặt lại mật khẩu). |
| 06.18 | Đạt | ± 1 bước. `mfa_last_used_step` tăng bằng một câu `UPDATE … WHERE < $step`, áp cho cả đăng nhập, S2 và xác nhận. |
| 06.19 | Đạt | 5 sai/token → token chết. Mỗi lần sai cộng bộ đếm SR-AUTH-04 → khóa tạm 429 → khóa cứng. `mfa.locked` + `security_alert`. Mật khẩu đúng một mình không xóa bộ đếm. |
| 06.20 | Đạt | Một body `401 MFA_INVALID` cho 6 nhánh (ca 7). |
| 06.21 | Đạt | Phiên mới có `mfa_at`, `amr`, audit `auth.login_succeeded` có `amr`. |
| 06.22 | Đạt có điều kiện | `SECRET_BODY_FIELDS` đã thêm 4 trường. Request log không ghi body, Problem không bị log. Redact pino chỉ một cấp (BEC-05). Ca 12 chưa đúng (BEC-02). |
| 06.23, 06.24 | Chưa đến | `setParameter`/`cancelScheduledParameter` do BE-B (R3-Q51). US-104 chưa có. Đã có trong danh sách `x-strong-reauth`. |
| 06.25 | Đạt | Tắt 2FA (vai bắt buộc → 403), tạo lại mã, đổi mật khẩu khi đã bật 2FA: đều S2. |
| 06.26 | Đạt (server) | `createUser` luôn S2. `updateUser` S2 khi đổi `status`/`resetPassword`. `setUserRoles` S2 khi nâng vai (BEC-06). FE chưa gửi (FEA-01). |
| 06.27 | Đạt (server) | `trustCurrentDevice`, `revokeTrustedDevice`. FE chưa gửi (FEA-01). |
| 06.28 | Chưa đến | N, theo BE-B. |
| 06.29–06.31 | Một phần | Server đưa `principal.session.mfaAt` cho BE-A. US-164 chưa có (ca 14). SR-AUTH-11 vẫn fail-closed: người có 2FA không xác nhận được bằng mật khẩu một mình (ca 15 xanh), chưa nhận TOTP. |
| 06.32 | Đạt | OWN, S2, có lý do, không tự đặt cho mình. Phải sở hữu mọi cơ sở của người kia. Thu hồi phiên, audit, thông báo, email. |
| 06.33 | Đạt phần mã | Không có endpoint HTTP, chỉ có lệnh CLI, audit không chứa giấy tờ, có email. **Còn thiếu:** thủ tục OPS viết, SEC duyệt, lưu ngoài repo, và một lần diễn tập trên staging. |
| 06.34 | Đạt | Đủ sự kiện. `mfa.verify_failed` gộp theo phút. |
| 06.35 | Một phần | Màn "Bảo mật của tôi" có. `User.mfaEnabled` / `mfaRecoveryCodesRemaining` cho OWN ở `/settings/users` **chưa điền** (BEC-04). |

## Thẻ feedback

### FB-R3-SEC-BEC-01
- Mức độ: Major
- Vị trí: `src/shared/http/auth.guard.ts` (`MFA_ENROLLMENT_OPERATIONS`) + `src/modules/identity/internal/session-policy.interceptor.ts` (`ALLOWED_WITH_TEMP_PASSWORD`). Phía FE, `LoginPage` gặp cùng vấn đề.
- Vấn đề: khi `MFA_ENFORCED = true`, người có vai `owner`/`manager` chưa bật 2FA mà có `must_change_password = true` sẽ bị kẹt. Trường hợp này xảy ra với mọi người do `createUser` tạo, và mọi người vừa được `updateUser.resetPassword`. Guard chặn `changeMyPassword` (`403 MFA_ENROLLMENT_REQUIRED`). Interceptor lại chặn `startMy2faSetup`/`confirmMy2fa`/`getMy2fa` (`403 PASSWORD_CHANGE_REQUIRED`). Test dò P1 của SEC tái hiện đúng hai mã lỗi này. FE cũng vòng lặp: `/change-password` → 403 → `/enroll-2fa` → 403 → …
- Vì sao quan trọng: `MFA_ENFORCED = true` trên staging là điều kiện của cổng dữ liệu thật, production bắt buộc `true`. Khi đó không thể đưa quản lý mới vào làm việc (US-008) và không thể giúp quản lý quên mật khẩu, trừ khi tắt cờ bảo mật. Kiểu kẹt này dễ dẫn tới "tạm tắt 2FA cho xong".
- Đề xuất sửa: thống nhất thứ tự **đổi mật khẩu trước, đăng ký 2FA sau**.
  - (1) Guard cho `changeMyPassword` đi qua phiên hạn chế khi `session.mustChangePassword = true`.
  - (2) Phiên mới sinh ra sau khi đổi mật khẩu vẫn phải là phiên hạn chế. Guard đã suy ra được nhờ `mfa_required && !mfa_enabled`, nhưng cần assert trong test.
  - (3) FE giữ thứ tự `/change-password` rồi `/enroll-2fa`.
  - (4) Thêm ca vào `mfa-us143`: manager mới tạo, cờ bật → đổi mật khẩu → đăng ký → vào được `/reservations`.
  - Cách ngược lại (cho phép đăng ký 2FA khi còn mật khẩu tạm) cũng được, nhưng khi đó mật khẩu tạm do OWN biết sẽ là yếu tố một của bí mật mới. Vì vậy SEC đề xuất cách trên.
- Trạng thái: Verified (`aa570e6`)

### FB-R3-SEC-BEC-02
- Mức độ: Major
- Vị trí: `test/integration/mfa-us143.test.ts` ca 12, dòng ~621–630: `SELECT before::text || after::text || coalesce(reason, '') AS x FROM audit_event`
- Vấn đề:
  - Trong PostgreSQL, `NULL || text` = `NULL`. Mọi sự kiện `auth.*`/`mfa.*`/`stepup.*` đều có `before = NULL` (P2: 152/152 dòng), nên ca 12 không đọc được `after` hay `reason` của dòng audit nào trong nhóm này. Ca xanh mà không kiểm gì.
  - Phần "quét log test" của ca 12 chưa có, báo cáo BE đã tự ghi điều này.
- Vì sao quan trọng: ca 12 là một trong 16 ca bắt buộc để ghi Verified. Nếu sau này một thay đổi đưa `totpCode` hoặc URI vào `after`, ca 12 vẫn xanh. SEC đã quét lại tay và **không** thấy rò, nhưng điều kiện Verified đòi test tự động.
- Đề xuất sửa:
  - (1) Đổi thành `coalesce(before::text,'') || coalesce(after::text,'') || coalesce(reason,'')`. Áp tương tự cho các cột có thể NULL của `outbox_message`, `idempotency_key`, `staff_notification`.
  - (2) Thêm assert "dump chứa ít nhất một chuỗi đã biết", ví dụ `"operationId": "regenerateMyRecoveryCodes"`, để test tự phát hiện khi quét rỗng.
  - (3) Thêm quét log: bắt output pino của `startFeatureApp` (stream giả), chạy luồng đăng ký, đăng nhập 2 bước, S2 sai/đúng và lỗi 5xx giả, rồi assert không có mã, token, bí mật hay `otpauth`.
- Trạng thái: Verified (`aa570e6`)

### FB-R3-SEC-FEA-01
- Mức độ: Major
- Vị trí: FE `2888322`: `StrongReauthDialog` mới chỉ gắn ở "Tạo bộ mã mới" và "Tắt 2FA" (`s1-fe-a.md` mục 5). Server: `8712822`, `ae836f7`.
- Vấn đề:
  - (a) Với `ae836f7`, `createUser`, `updateUser` (status/resetPassword), `setUserRoles` (nâng vai) và `revokeTrustedDevice` bắt buộc có `reauth`. FE hiện không gửi, nên màn Người dùng và màn Thiết bị sẽ trả 422 hết.
  - (b) Ngay cả **không** có cổng, sau `8712822` người đã bật 2FA (FE `2888322` đã cho bật) gọi `changeMyPassword` hoặc `trustCurrentDevice` mà không có `totpCode` sẽ nhận 422. Màn đổi mật khẩu và màn đăng ký thiết bị chưa có ô mã, nên người đó không đổi được mật khẩu và không đăng ký được thiết bị.
- Vì sao quan trọng: (a) chặn gộp cổng S2. Thiếu cổng thì các thao tác 06.26/06.27 còn chạy ở mức S1, tức kẻ chiếm được phiên OWN có thể tạo người dùng hay nâng vai mà không cần TOTP. (b) làm hỏng chức năng của OWN/MGR ngay khi họ làm đúng yêu cầu bật 2FA.
- Đề xuất sửa:
  - FE gắn `StrongReauthDialog` vào 6 thao tác: `createUser`, `updateUser` (status/resetPassword), `setUserRoles` (khi nâng lên owner/manager), `revokeTrustedDevice`, `trustCurrentDevice`, `changeMyPassword`. Màn đổi mật khẩu thêm ô TOTP/mã khôi phục khi `Me.mfaEnabled`.
  - QA sửa `tests/e2e/support/api.ts` và các spec theo `s1-be-c.md` mục 5.
  - Gộp `ae836f7` + FE + QA trong **một** lần gộp.
  - Nếu FE chưa kịp: gộp `bd0fb4f` + `8712822` + `2888322`, và tạm chưa cho bật 2FA trên staging tới khi (b) xong. Đây là đường dự phòng, không phải đích.
- Trạng thái: Verified (`aa570e6`)

### FB-R3-SEC-BEC-03
- Mức độ: Minor
- Vị trí: `auth.service.ts` `changeMyPassword`. Đường `resetPassword` của `users.service.ts`. Bảng `mfa_login_challenge`.
- Vấn đề: khi đổi hoặc đặt lại mật khẩu, mọi phiên bị thu hồi nhưng `mfa_login_challenge` còn sống của người đó **không** bị xóa. Kẻ đã có mật khẩu cũ và đang giữ `mfaToken` vẫn hoàn tất được `loginMfa` trong tối đa 5 phút sau khi OWN đặt lại mật khẩu để xử lý sự cố. Kẻ đó vẫn cần TOTP, nên đây là Minor.
- Vì sao quan trọng: phản ứng sự cố (đặt lại mật khẩu) phải cắt ngay mọi đường đang dở.
- Đề xuất sửa: trong cùng giao dịch với `sessions.revokeAll(..., 'password_changed' | 'password_reset' | 'disabled' | 'role_changed')`, chạy `DELETE FROM mfa_login_challenge WHERE user_id = $1`. Tốt nhất đặt trong `revokeAll`. Kèm một ca test. Nối luôn job dọn T16.
- Trạng thái: Verified phần chính (`aa570e6`); job T16 dọn dòng hết hạn: Deferred – SEC chấp nhận dời

### FB-R3-SEC-BEC-04
- Mức độ: Minor
- Vị trí: `users.service.ts` (`UserDto`). OpenAPI `User.mfaEnabled`, `mfaRecoveryCodesRemaining`.
- Vấn đề: hợp đồng 0.3.8 có hai trường cho 06.35 (OWN xem trạng thái 2FA của mọi người dùng), nhưng server chưa điền.
- Vì sao quan trọng: OWN không thấy ai chưa bật 2FA hay ai sắp hết mã, nên khó dùng đường 2 (06.32). Đây là điều kiện để ghi Verified.
- Đề xuất sửa: điền hai trường **chỉ** khi người gọi là `owner` (MGR không thấy). Không bao giờ trả bí mật hay băm. Thêm vào test `listUsers`/`getUser` cho cả hai vai.
- Trạng thái: Verified (`aa570e6`)

### FB-R3-SEC-BEC-05
- Mức độ: Minor
- Vị trí: `src/http.ts` `REDACT_PATHS` (`*.${k}`).
- Vấn đề: 06.22 đòi che `code`, `mfaToken`, `recoveryCode`, `otpauthUri` "ở mọi độ sâu". Wildcard của pino chỉ khớp một cấp (`*.mfaToken`), không khớp `err.details.body.mfaToken`. Hiện request log không ghi body và Problem không bị log, nên chưa có đường rò thực tế.
- Vì sao quan trọng: một thay đổi sau này, ví dụ log body khi 5xx, sẽ lộ ngay mà không có lớp chặn thứ hai.
- Đề xuất sửa: thêm serializer `err`/`req` gọi `withoutSecrets()` (đệ quy) trước khi ghi, hoặc thêm đường hai cấp `*.*.k` cho nhóm trường 2FA. Test cùng phần log của BEC-02.
- Trạng thái: Verified (`aa570e6`)

### FB-R3-SEC-BEC-06
- Mức độ: Minor
- Vị trí: `auth.controller.ts` `changeMyPassword` → `auth.service.changeMyPassword` → `sessions.create`.
- Vấn đề: người đã bật 2FA đổi mật khẩu phải qua S2 (có TOTP), nhưng phiên mới cấp ra có `amr = 'pwd'`, `mfa_at = NULL`. Hệ quả: (1) duyệt US-164 trên phiên đó bị từ chối `MFA_REQUIRED` (06.29), phải đăng nhập lại; (2) audit ghi phiên là "chỉ mật khẩu", không đúng sự thật.
- Vì sao quan trọng: dữ liệu `amr`/`mfa_at` là căn cứ cho 06.29 và cho điều tra sự cố. Nó phải phản ánh đúng.
- Đề xuất sửa: trả `method` của `StrongReauthService.verify` về controller, truyền `amr: method` (`totp`/`recovery_code`) vào `sessions.create`. Người chưa có 2FA giữ `pwd`.
- Trạng thái: Verified (`aa570e6`)

### FB-R3-SEC-BEC-07
- Mức độ: Suggestion
- Vị trí: `users.controller.ts` `setUserRoles`: tập vai `current` được đọc trong một giao dịch chỉ đọc riêng, **trước** UnitOfWork.
- Vấn đề: việc quyết định có cần S2 hay không dựa trên dữ liệu đọc ngoài giao dịch ghi (TOCTOU). Hiện `If-Match` (version của người dùng) chặn được lượt đua, vì một lượt hạ vai chen vào sẽ làm lượt nâng vai nhận 412. Tuy vậy, an toàn đang dựa vào một cơ chế không được viết ra cho mục đích này.
- Đề xuất sửa: ghi chú rõ sự phụ thuộc vào `If-Match`, thêm một ca test đua (hạ vai chen giữa → 412). Hoặc tính `escalates` lại trong UnitOfWork, và nếu kết quả khác lúc trước thì trả 409 để client gửi lại kèm S2.
- Trạng thái: Verified (`aa570e6`)

### FB-R3-SEC-BEC-08
- Mức độ: Suggestion
- Vị trí: `0079_mfa_two_factor.sql` dòng 62 (`entry_function_read ON user_property_role … TO ottimo_owner`).
- Vấn đề: policy mới cho mọi hàm SECURITY DEFINER thuộc `ottimo_owner` đọc được toàn bộ `user_property_role` của mọi tổ chức. Cách làm giống các bảng `app_user` và `user_session` trong 0001, và `auth_resolve_session` chỉ trả một boolean, nên chấp nhận được.
- Đề xuất sửa: thêm `user_property_role` vào test `db-role`/`architecture` đang liệt kê các bảng có `entry_function_read`, để lần thêm sau có người review.
- Trạng thái: Verified (`aa570e6`)

## Việc còn lại trước khi SEC ghi Verified US-143 / SR-AUTH-06

1. Sửa xong BEC-01, BEC-02 và FEA-01, gộp cổng S2 (`ae836f7`) cùng FE và QA.
2. Ca 14 (US-164, BE-A), ca 16 (Playwright admin-web có đồng hồ giả, FE-A/QA), ca 12 phần log. SR-AUTH-11 nhận TOTP ở `verifyApprover` khi BE-A sẵn sàng.
3. CI push xanh 16 ca trên commit đã gộp.
4. Staging:
   - `MFA_ENFORCED=true` (sau BEC-01);
   - OWN và MGR thật đăng nhập 2 bước, SEC chứng kiến, không giữ mã;
   - thủ tục 06.33 do OPS viết, SEC duyệt, lưu ngoài repo; diễn tập một lần, biên bản chỉ ghi kết quả.
5. 06.23/06.24/06.28 theo BE-B (R3-Q51) và US-104.

## Điểm làm tốt nên giữ

- `StrongReauthService` là một hàm duy nhất. Hàm chỉ kiểm yếu tố hai khi mật khẩu đúng, nên sai mật khẩu không đốt mã khôi phục. Hàm chạy trong giao dịch riêng nên vẫn đếm được khi request lỗi. Danh sách operation được test so khớp với `x-strong-reauth` của spec.
- Các thao tác nguyên tử đều làm đúng chỗ: chống phát lại TOTP và tiêu mã khôi phục, mỗi việc chỉ bằng một câu `UPDATE` có điều kiện. `loginMfa` khóa dòng challenge và dòng user. Ở đăng nhập bước một, mật khẩu đúng **không** xóa bộ đếm khóa, nên kẻ dò TOTP không tự xóa được bằng cách đăng nhập lại.
- FE giữ `mfaToken`, bí mật và mã khôi phục chỉ trong state React. QR vẽ tại chỗ. Tải `.txt`/In làm ở client bằng text node. Mọi lỗi bước 2 hiện một câu.

---

## Review lại – nhánh tích hợp `r3-2fa-int`, head `aa570e6` (23/10/2026)

Phạm vi: main + BE-C (sửa BEC-01…08, ARC 0.3.8 bổ sung 1, đăng ký lại qua mã khôi phục) + CỔNG S2 `6f87ad4` + FE-A (FEA-01) + QA E2E `a237cab` + FE-B US-008 (createUser + S2). Căn cứ: `responses/s1-BE-C.md`, `responses/s1-FE-A.md`.

### Kết luận

**Gộp được cả nhánh vào main ở head `aa570e6`.** Còn 0 Blocker, 0 Major. 3 thẻ Major đã Verified. Cổng S2 nay đi cùng FE và E2E trong một lần gộp, đúng điều kiện đặt ra ở lượt trước.

US-143 / SR-AUTH-06 **chưa Verified**. Còn các điều kiện ở mục "Điều kiện còn lại" bên dưới.

### Kiểm đã chạy

Chạy trên Postgres 17 riêng của SEC (container tạm, đã xóa), migrate từ đầu. Worktree vẫn sạch: các `dist/` build tạm nằm trong `.gitignore`.

1. Toàn bộ api vitest: **108 tệp đạt, 1 skip; 3032 ca đạt, 2 skip, 0 lỗi.**
   - Muốn chạy được phải build trước `packages/contracts` và `integrations`.
   - Nếu chưa build thì 73 tệp đỏ vì không resolve được `@ottimo/contracts`. Đây là lỗi môi trường, không phải lỗi mã.
2. admin-web vitest: **52 tệp, 541/541 đạt.**
3. E2E Playwright: SEC **không** chạy lại vì cần stack đầy đủ. Kết luận về E2E dựa vào việc đọc spec và báo cáo "cục bộ xanh" của QA.
4. SEC đọc diff identity và guard từ `ae836f7` tới `aa570e6`:
   - `auth.guard.ts`, `auth.service.ts` (`loginMfa`, `changeMyPassword`);
   - `mfa.service.ts` (`startSetup`, `confirm` đường đăng ký lại);
   - `session.service.ts` (`revokeAll`), `users.service.ts`, `users.controller.ts`.
   - Phía FE: các nơi dùng `StrongReauthDialog`, gồm `UsersPage`, `DevicesPage`, `ChangePasswordPage`, `SecurityPage`, `AddUserDialog`. Không có Web Storage, không có `console`.

### Đối chiếu thẻ

| ID | Kết quả review lại |
|---|---|
| BEC-01 | Đạt. Guard chỉ cho `changeMyPassword` đi qua phiên hạn chế khi `mustChangePassword = true`. Phiên mới giữ `enrollment_only`. Có ca tích hợp đầy đủ: setup bị `PASSWORD_CHANGE_REQUIRED` → đổi mật khẩu → vẫn hạn chế → đăng ký → vào được. FE giữ thứ tự `/change-password` rồi `/enroll-2fa`. |
| BEC-02 | Đạt. Câu quét dùng `coalesce` cho từng cột, thêm `c3_access_log`, có assert "dump chứa chuỗi đã biết". Có ca quét log thật (pino + stdout/stderr) kèm assert đã thu được dòng log. |
| FEA-01 | Đạt. S2 đã gắn ở 6 thao tác, cùng quy tắc nâng vai với server. 401/422 hiện một câu. E2E API kiểm cả "thiếu/sai S2 thì không ghi gì". FE-B `createUser` cũng gửi `reauth`. |
| BEC-03 | Đạt. `revokeAll` xóa mọi `mfa_login_challenge` trong cùng giao dịch, có ca test. Job T16 dọn dòng hết hạn: chấp nhận dời. Rủi ro thấp: DB chỉ có SHA-256, token chết sau 5 phút. Ghi backlog chung với T16. |
| BEC-04 | Đạt. `User.mfaEnabled` / `mfaRecoveryCodesRemaining` chỉ đi qua các operation `users.*` (`x-roles: [owner]`). MGR/FD → 403. Không trả băm. |
| BEC-05 | Đạt. `formatters.log` gọi `withoutSecrets()` đệ quy, test log kiểm hành vi thật. |
| BEC-06 | Đạt. Phiên sau `changeMyPassword` mang `amr` và `mfa_at` theo yếu tố của S2. |
| BEC-07 | Đạt. Có ghi chú phụ thuộc `If-Match` và ca đua "hạ vai chen giữa → 412". |
| BEC-08 | Đạt. `architecture.test.ts` khóa đúng 8 bảng có `entry_function_read`. |
| Ca 11 (a)(b) | Đạt. Mật khẩu sai + thiếu mã → 422, body giống hệt trường hợp mật khẩu đúng. |

### Phần mới: đăng ký lại qua mã khôi phục (ARC 0.3.8 bổ sung 1 #3)

SEC chấp nhận về bảo mật. Lý do:

- Đăng nhập bằng mã khôi phục → phiên `enrollment_only`. Phiên này không làm được gì ngoài đăng ký lại và đăng xuất, nên giảm phạm vi phiên so với trước.
- `startMy2faSetup` vẫn đòi `currentPassword` và chỉ chạy khi phiên có `amr = recovery_code`. Phiên khác → 409.
- Bí mật cũ vẫn chạy tới lúc `confirm`. Đăng ký lại thay bí mật, sinh bộ mã mới (bộ cũ chết), thu hồi phiên khác, xóa các bước 2 đang dở.
- Có audit `mfa.reenrolled`, thông báo người đó và OWN, và email (đã gửi từ lúc dùng mã khôi phục, theo 06.15).
- Ai có mật khẩu + một mã khôi phục vốn đã có toàn quyền tài khoản. Đường này không cấp thêm quyền nào, chỉ buộc người dùng gắn điện thoại mới ngay.

SEC sẽ bổ sung `mfa.reenrolled` vào danh sách 06.34 và mô tả đường này vào A.6 của `s1-security-requirements.md`.

### Ghi nhận (không mở thẻ mới)

- **G1 – ca 16 thiếu đồng hồ giả.** Ca 16 (`tests/e2e/ui/mfa-us143.r3s1.spec.ts`) phủ: đăng ký, đăng nhập TOTP, đăng nhập bằng mã khôi phục, màn hạn chế, axe. Còn thiếu ca đồng hồ giả mà A.7 #16 yêu cầu, ví dụ `mfaToken` quá 5 phút → về bước mật khẩu, hoặc mã của bước ±1/±2 qua UI. Ca 16 dùng FDL tự nguyện, nên màn hạn chế 06.4 với `MFA_ENFORCED = true` mới được phủ ở mức tích hợp server và vitest FE, chưa có ở E2E. **Đây là điều kiện Verified, không chặn gộp.**
- **G2 – trường hợp hiếm, chấp nhận.** Phiên hạn chế từ mã khôi phục mà gặp mật khẩu tạm, nếu người dùng chứng minh S2 bằng TOTP thì phiên mới mang `amr = totp` và không đăng ký lại được (409) cho tới khi đăng nhập lại. Người mất điện thoại sẽ dùng mã khôi phục, nên trường hợp này hiếm và tự thoát được khi đăng nhập lại.

### Điều kiện còn lại để SEC ghi Verified US-143 / SR-AUTH-06

1. **CI push xanh trên commit gộp vào main**: vitest api, vitest admin-web và E2E (`api/mfa-s2.r3s1`, `ui/mfa-us143.r3s1`, `api/identity`).
2. **Ca 14** (US-164 duyệt từ xa, BE-A) và **SR-AUTH-11** (người xác nhận có 2FA dùng PIN hoặc mật khẩu + TOTP trong `verifyApprover`). Ca 15 hiện vẫn đạt nhờ fail-closed.
3. **Ca 16** thêm phần đồng hồ giả (G1). Nên có thêm một lượt với `MFA_ENFORCED = true` cho MGR chưa bật 2FA.
4. **06.23 / 06.24 / 06.28**: S2 trên `setParameter` `payment_receiving_account` và `cancelScheduledParameter` (BE-B, R3-Q51), và trên xuất US-104 khi có. Riêng 06.23 phải xong trước khi màn tài khoản nhận VietQR lên staging.
5. **Staging**:
   - OPS đặt `MFA_ENFORCED=true`;
   - OWN và MGR thật đăng nhập 2 bước được, SEC chứng kiến lúc PO/INV nghiệm thu, không giữ mã;
   - tài khoản OWN thật đã đăng ký 2FA và cất mã khôi phục tách khỏi điện thoại.
6. **06.33**: OPS viết thủ tục xác minh danh tính, SEC duyệt, lưu ngoài repo. Diễn tập lệnh `mfa-operator-reset` một lần trên staging, biên bản chỉ ghi kết quả. Repo chỉ ghi "có thủ tục, SEC duyệt ngày …".
7. **Backlog**: job T16 dọn `mfa_login_challenge` (và `user_session`) hết hạn, theo phần dời của BEC-03.
