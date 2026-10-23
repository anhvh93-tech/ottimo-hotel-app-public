# BE-C – phản hồi thẻ Round 3 Sprint 1 (bước Phản hồi & sửa – US-143 server)

- Vai: BE-C | Ngày: 23/10/2026 | Nhánh `worktree-agent-aeb2b1b2ad5190d92` (đã dựng lại trên `main` `ae1c945`; bỏ commit chép đầu vào cũ vì `main` đã có)
- Nguồn thẻ: `rounds/round-03/reviews/s1-SEC-on-2FA.md` (thẻ BE-C), `rounds/round-03/outputs/ARC/s1-contracts.md` mục 12 "0.3.8 bổ sung 1".
- Thứ tự commit trên nhánh: US-143 lõi → S2 không vỡ → báo cáo → **sửa theo review (bước này)** → **CỔNG S2 cuối nhánh** (commit riêng, chỉ gộp cùng FE-A + QA E2E – FB-R3-SEC-FEA-01).
- Test: Postgres 17 riêng, migrate từ đầu tới 0079; toàn bộ api vitest xanh ở **cả hai** điểm: commit trước cổng và đầu nhánh (số ở mục cuối).

## SEC-on-2FA

| ID | Mức | Trạng thái | Ghi chú |
|---|---|---|---|
| FB-R3-SEC-BEC-01 | Major | Done | Đi theo đề xuất SEC "đổi mật khẩu trước, đăng ký 2FA sau". (1) `AuthGuard`: phiên hạn chế cho đi `changeMyPassword` **chỉ khi** `session.mustChangePassword`. (2) Phiên mới sau đổi mật khẩu giữ `enrollment_only` của phiên cũ, và guard vẫn suy ra hạn chế từ `mfa_required && !mfa_enabled`. (3) Thứ tự FE: FE-A (đã có `/change-password` → `/enroll-2fa`). (4) Ca mới trong `mfa-us143`: manager mật khẩu tạm, `MFA_ENFORCED = true` → setup bị `PASSWORD_CHANGE_REQUIRED` → đổi mật khẩu 204 → phiên mới `mfaEnrollmentRequired = true`, API khác 403 `MFA_ENROLLMENT_REQUIRED` → setup/confirm → vào được `/guests` (thay cho `/reservations` – route đó cần tham số giá không có trong fixture, không liên quan 2FA) |
| FB-R3-SEC-BEC-02 | Major | Done | (1) Ca 12 dùng `coalesce` cho từng cột của `audit_event`, `outbox_message`, `idempotency_key`, `staff_notification`, thêm `c3_access_log`. (2) Có assert "dump chứa chuỗi đã biết" (`regenerateMyRecoveryCodes`, `recoveryCodesRemaining` trong `after`) – quét rỗng sẽ đỏ. (3) Ca mới quét log: app riêng có `logStream` (pino, mức `trace`) + bắt `process.stdout/stderr` (logger Nest); chạy đăng ký, đăng nhập 2 bước (sai + đúng), S2 sai + đúng, body 422 có mã khôi phục/mfaToken; assert không có bí mật base32, mã khôi phục (cũ + mới), `mfaToken`, mật khẩu, `otpauth`, và không có trường `totpCode`/`recoveryCode`/`mfaToken`/`password` nào mang giá trị thật trong log. Ca có assert log đã thu được dòng (route `/v1/auth/login/mfa`) để không xanh rỗng. Bỏ ca "lỗi 5xx giả": không có đường tạo 5xx sạch trong identity mà không sửa mã sản phẩm; `ProblemFilter` chỉ ghi `describeError` (tên lớp/mã pg), đã có test riêng ở `redact.test.ts` |
| FB-R3-SEC-BEC-03 | Minor | Done | `SessionService.revokeAll` xóa mọi `mfa_login_challenge` của người đó trong cùng giao dịch – áp cho đổi/đặt lại mật khẩu, khóa, đổi vai, bật/tắt/đặt lại 2FA. Ca mới: đang dở bước 2 → `revokeAll('password_reset')` → `loginMfa` bằng mã đúng → 401 `MFA_INVALID`. **Job T16 dọn dòng hết hạn: Deferred** – repo chưa có job T16 nào (cả `user_session`); dòng hết hạn của người đó bị xóa ở lần đăng nhập kế; làm cùng T16 chung (OPS/BE, ghi backlog) |
| FB-R3-SEC-BEC-04 | Minor | Done | `User.mfaEnabled` (luôn có) + `mfaRecoveryCodesRemaining` (khi đã bật) trong `listUsers`/`createUser`/`updateUser`/`setUserRoles`. Mọi operation `users.*` có `x-roles: [owner]` nên chỉ OWN nhận; MGR → 403 ở guard. Không trả băm/bí mật. Ca mới: OWN thấy `mfaEnabled: true` + số mã của người đã bật, `false` và không có số mã cho FD; FD gọi `listUsers` → 403 |
| FB-R3-SEC-BEC-05 | Minor | Done (đã có từ trước) + test | `http.ts` đã có lớp chặn thứ hai: `formatters.log` gọi `withoutSecrets()` đệ quy (mọi độ sâu) trước khi ghi – nhóm trường 2FA nằm trong `SECRET_BODY_FIELDS` nên được thay ở mọi cấp, không chỉ `*.k` của `redact`. Test log mới (BEC-02 (3)) kiểm hành vi thật |
| FB-R3-SEC-BEC-06 | Minor | Done | `StrongReauthService.verify` trả `method`; `changeMyPassword` truyền `amr` (`totp`/`recovery_code`, người chưa 2FA giữ `pwd`) cho phiên mới → `mfa_at` được ghi. Ca `changeMyPassword` assert `amr = totp`, `mfa_at` có giá trị |
| FB-R3-SEC-BEC-07 | Suggestion | Done | Trong commit CỔNG: ghi chú rõ an toàn của quyết định `escalates` dựa vào `If-Match` (đọc ngoài giao dịch ghi; một lần hạ vai chen giữa làm tăng `version` → lượt nâng vai nhận 412) và thêm ca đua: hạ vai chen giữa → nâng vai cũ trả 412 |
| FB-R3-SEC-BEC-08 | Suggestion | Done | `architecture.test.ts` thêm ca liệt kê đúng 8 bảng có policy `entry_function_read` (chỉ `ottimo_owner`, chỉ `SELECT`); thêm bảng mới sẽ đỏ và phải qua SEC |
| Ca 11 – điều kiện (a)(b) | – | Done | Đã có (a): nhánh 422 ở trước `verifyPassword`. Thêm (b): mật khẩu **sai** + thiếu mã → 422 với body giống hệt mật khẩu đúng + thiếu mã |
| FB-R3-SEC-FEA-01 | Major | FE-A / QA | Không thuộc BE-C. Phía server giữ CỔNG S2 ở commit riêng cuối nhánh để gộp cùng FE + E2E |

## ARC 0.3.8 bổ sung 1 (mục 12)

| # | Trạng thái | Ghi chú |
|---|---|---|
| 1 – `x-c3-log` | Done | `confirmMy2fa` `mfa_secret/create`; `regenerateMyRecoveryCodes` đổi sang `mfa_secret/update` (spec + `openapi-meta` sinh lại + mã ghi `c3_access_log` `update`). Hai dòng log đều ghi trong giao dịch trước khi trả mã |
| 2 – RLS + DEK theo cơ sở | Done + test | Ca mới: người có vai ở P0 và P1, đăng ký (DEK ở P0), mất vai ở P0 → vẫn đăng nhập 2 bước, `activePropertyId = P1` |
| 3 – Đăng ký lại sau khi vào bằng mã khôi phục | Done + 3 ca QA | (a) `loginMfa` bằng `recoveryCode` → phiên `enrollment_only` cho **mọi** người có 2FA (`Me.mfaEnrollmentRequired = true`). (b) `startMy2faSetup` khi 2FA đang bật chỉ được nếu phiên `amr = recovery_code`; bí mật chờ mã hóa bằng DEK hiện có, bí mật cũ chạy tới lúc xác nhận; phiên khác → 409. (c) `confirmMy2fa` trên đường này thay bí mật, 10 mã mới (bộ cũ chết), thu hồi phiên khác, phiên mới `amr = totp`, audit `mfa.reenrolled` + thông báo người đó và OWN. Ca test: vào bằng mã khôi phục → API khác 403 `MFA_ENROLLMENT_REQUIRED`; đăng ký lại → TOTP cũ và mã khôi phục cũ 401, TOTP mới 200; phiên `amr = totp` gọi setup → 409; đúng 1 dòng `mfa.reenrolled`. `getMy2fa.pendingSetup` giờ đúng cả khi 2FA đang bật |
| `User.mfaEnabled` (06.35) | Done | Xem BEC-04 |

## Còn mở / chuyển tiếp
- FB-R3-SEC-FEA-01 (FE-A, QA) – điều kiện gộp CỔNG S2.
- T16 dọn `mfa_login_challenge` hết hạn (Deferred, xem BEC-03).
- Ca 14 (US-164, BE-A), ca 16 (Playwright, FE-A/QA), SR-AUTH-11 nhận TOTP trong `verifyApprover` (khi BE-A sẵn sàng).
- Điều kiện staging của SEC Verified: `MFA_ENFORCED = true` (BEC-01 đã sửa), thủ tục 06.33 ngoài repo + diễn tập (OPS/SEC).
