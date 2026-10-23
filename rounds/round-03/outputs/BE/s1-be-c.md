# BE-C – Round 3 Sprint 1 – Sản xuất (US-143 phía server, R3-Q38)

- Người làm: BE-C | Ngày: 22–23/10/2026 | Bước: Sản xuất
- Đầu vào: `rounds/round-03/sprint-1-plan.md` (BE-C), `rounds/round-03/outputs/ARC/s1-contracts.md` (mục 1, 6.1, 7, 10), `rounds/round-03/outputs/SEC/s1-security-requirements.md` (A, B.6), OpenAPI 0.3.8-draft, BR-437.
- Nhánh: worktree `worktree-agent-aeb2b1b2ad5190d92`. Commit đầu (`4aa2714`) chỉ chép các tệp ARC/SEC/DOM chưa commit ở cây chính (OpenAPI 0.3.8, generated, rbac fixtures, sprint-1-plan…) để có hợp đồng – nội dung giống hệt cây chính, gộp không xung đột.
- Repo công khai: tài liệu và mã không chứa bí mật, không chứa thủ tục xác minh danh tính khi khôi phục (SEC 06.33 – OPS viết, SEC duyệt, lưu ngoài repo).

## 1. Đã làm

### 1.1 US-143 – đăng nhập hai bước, mã khôi phục, S2 (SEC A.1–A.6)

| Phần | Cài đặt | Tệp chính |
|---|---|---|
| Migration | `0079_mfa_two_factor` (số kế tiếp hiện tại; đổi số lúc rebase theo ARC 7): `app_user` thêm `mfa_pending_secret_enc`, `mfa_pending_expires_at`, `mfa_data_key_id`, `mfa_key_property_id`, `mfa_last_used_step`, `mfa_enrolled_at`, `mfa_reset_at`; `user_session` thêm `mfa_at`, `amr`, `enrollment_only`; bảng `mfa_login_challenge` (RLS tổ chức, FORCE); hàm `auth_mfa_challenge_resolve`; `auth_resolve_session` 0.3.8 (thêm `mfa_at`, `enrollment_only`, `mfa_enabled`, `mfa_required`) | `src/db/migrations/0079_mfa_two_factor.sql`, `src/db/schema/identity.ts` |
| TOTP | Tự viết theo RFC 6238 (HMAC-SHA-1, 6 số, 30 giây, ± 1 bước), không thêm thư viện; kiểm bằng vector RFC 6238 phụ lục B. Chống phát lại: `UPDATE … SET mfa_last_used_step = $step WHERE … mfa_last_used_step < $step` (một câu, nguyên tử) – áp cho mọi chỗ nhận TOTP (đăng nhập, S2, xác nhận đăng ký) | `identity/public/totp.ts`, `identity/public/mfa-store.ts` |
| Bí mật | 160 bit CSPRNG, mã hóa phong bì (`CryptoService`, purpose `mfa_secret`), một DEK cho mỗi lần đăng ký; DEK nằm ở cơ sở `mfa_key_property_id` (data_key RLS theo cơ sở). Đăng ký lại / tắt / đặt lại → hủy DEK (crypto-shredding) | `mfa-store.ts`, `internal/mfa.service.ts` |
| `login` | Có 2FA → `401 MFA_REQUIRED` + `mfaToken` (256 bit, DB chỉ SHA-256, 5 phút, gắn người + kênh). Mật khẩu đúng **không** xóa bộ đếm khóa (để kẻ dò TOTP không tự xóa bằng cách đăng nhập lại). `MFA_ENFORCED` + vai owner/manager chưa 2FA → phiên hạn chế | `internal/auth.service.ts` |
| `loginMfa` | Một giao dịch, khóa dòng challenge + user (`FOR UPDATE`); mọi lỗi `401 MFA_INVALID` giống hệt; 5 sai/token → token chết; mỗi lần sai cộng bộ đếm khóa SR-AUTH-04 (5 sai → khóa tạm → `429`; 3 lần khóa/24 giờ → khóa cứng); khóa qua TOTP → audit `mfa.locked` + `security_alert` cho người đó và OWN; phiên đang sống không bị đá. Đúng → phiên **mới** với `mfa_at`, `amr` | `auth.service.ts`, `internal/mfa.controller.ts` |
| Phiên hạn chế (06.4) | Guard chung (`AuthGuard`, trước mọi kiểm vai/nghiệp vụ): phiên `enrollment_only` **hoặc** (`MFA_ENFORCED` + có vai owner/manager + chưa bật 2FA – kể cả phiên mở trước khi bật cờ) → chỉ `getMe`, `getMy2fa`, `startMy2faSetup`, `confirmMy2fa`, `logout`; còn lại `403 MFA_ENROLLMENT_REQUIRED` | `src/shared/http/auth.guard.ts` |
| setup/confirm | Không `Idempotency-Key`. Gửi lại setup = bí mật chờ mới (QR cũ chết, DEK cũ hủy); confirm đúng → bật 2FA, 10 mã khôi phục, thu hồi **mọi** phiên, cấp phiên mới; gửi lại confirm → `409`. Sai mã → `422` (`totpCode`), đếm SR-RL-02 | `mfa.service.ts` |
| Mã khôi phục | 10 × 16 ký tự Crockford base32 (80 bit), hiển thị 4-4-4-4; DB SHA-256; dùng = một câu `UPDATE … array_remove … WHERE $hash = ANY(…)` (song song → đúng một thành công); dùng mã → audit `mfa.recovery_code_used`, thông báo `account_security_change` cho người đó + mọi OWN, email qua outbox; còn ≤ 3 → `Me.recoveryCodesLow` | `mfa-store.ts` |
| `regenerateMyRecoveryCodes`, `disableMy2fa` | S2; bộ cũ chết ngay; vai bắt buộc tắt → `403`; tắt → xóa bí mật + mã, thu hồi mọi phiên | `mfa.controller.ts`, `mfa.service.ts` |
| `resetUser2fa` | OWN, S2, `reason`; tự đặt cho mình → `422 NOT_ALLOWED`; người chưa bật → `409`; phải sở hữu mọi cơ sở của người kia (như `updateUser`, SEC-BE-07); xóa 2FA, thu hồi phiên; audit `mfa.reset_by_owner`, thông báo + email | `mfa.service.ts` |
| `StrongReauthService` (S2) | `identity/public/strong-reauth.ts` – hàm duy nhất, giao dịch riêng (gọi trước UnitOfWork). Có 2FA: mật khẩu + đúng một trong TOTP/mã khôi phục; thiếu yếu tố → `422 STRONG_REAUTH_REQUIRED` (không đếm); sai bất kỳ → `401 REAUTH_FAILED` (không nói yếu tố nào), đếm SR-RL-02 chung; chỉ kiểm yếu tố 2 khi mật khẩu đúng (sai mật khẩu không đốt mã khôi phục). Audit `stepup.s2_granted/failed` kèm `operationId`. Xuất `strongReauthSchema` + `STRONG_REAUTH_OPERATIONS` (test so với `x-strong-reauth` của spec) | `strong-reauth.ts` |
| Nối S2 vào thao tác đã có | **Không vỡ** (commit `8712822`): `changeMyPassword`, `trustCurrentDevice` (trước đây nhận `totpCode` nhưng không kiểm). **CỔNG** (commit riêng `ae836f7`): `createUser`, `updateUser` (khi `status`/`resetPassword`, không áp cho chính mình vì đằng nào cũng 422), `setUserRoles` (chỉ khi nâng lên owner, hoặc lên manager với người chưa là owner ở cơ sở đó), `revokeTrustedDevice` | `auth.controller.ts`, `devices.controller.ts`, `users.controller.ts` |
| Khôi phục OWN duy nhất (06.33) | **Không có endpoint.** Hàm `resetMfaByOperator` + lệnh `node dist/admin/mfa-operator-reset-cli.js --username --operator --ticket --reason` (vỏ `services/api/scripts/mfa-operator-reset.sh` chạy qua `docker compose exec api`). Kết quả như 06.32 + xóa challenge đang chờ; audit `mfa.reset_by_operator` (người chạy, lý do, mã phiếu xác minh – không giấy tờ); email cho người đó. Thủ tục xác minh: OPS viết, SEC duyệt, ngoài repo | `identity/public/operator-reset.ts`, `src/admin/mfa-operator-reset-cli.ts` |
| Cờ `MFA_ENFORCED` | `config.ts`: `true|false`, trống = `false`; `APP_ENV=production` mà không `true` → từ chối khởi động. Đã thêm `.env.example`, `infra/docker-compose.yml`, `infra/docker-compose.prod.yml`, `infra/server/env.example` (mặc định `false` – staging bật trước dữ liệu thật) | `src/config.ts`, `src/main.ts` |
| `Me` / `User` | `Me.mfaEnrollmentRequired`, `soleOwner` (chỉ khi là owner), `recoveryCodesLow`. `getMy2fa`: `enabled`, `required`, `enforced`, `pendingSetup`, `enrolledAt`, `recoveryCodesRemaining`, `soleOwner` | `internal/me.service.ts`, `mfa.service.ts` |
| Bộ che log (06.22) | `SECRET_BODY_FIELDS` thêm `mfaToken`, `recoveryCode`, `recoveryCodes`, `otpauthUri` (log + băm idempotency) | `src/shared/secret-fields.ts` |

### 1.2 R3-Q38 – `Me.properties[].businessDate`, `businessDayRollover`
`MeService` đọc `PropertyContextService.now()` cho từng cơ sở (cơ sở trong ngữ cảnh: cùng giao dịch; cơ sở khác: giao dịch chỉ đọc riêng vì `config_parameter` RLS theo cơ sở). `PropertyNow` thêm `rollover` (cộng thêm, không phá). Thiếu tham số → bỏ hai trường (hợp đồng cho phép vắng) + log cảnh báo không dữ liệu cá nhân.

## 2. Kiểm thử

| Bộ | Kết quả |
|---|---|
| `test/be-c-r3-s1-units.test.ts` (mới, không DB): vector RFC 6238, cửa sổ ± 1, chống phát lại, mã khôi phục, URI otpauth, trường bí mật, `STRONG_REAUTH_OPERATIONS` = `x-strong-reauth` của spec, danh sách phiên hạn chế | 10/10 |
| `test/integration/mfa-us143.test.ts` (mới, PostgreSQL thật) – ca SEC A.7: 1, 2, 3, 4 (tuần tự + song song), 5, 6 (khóa tạm, khóa cứng, `security_alert`, phiên sống không bị đá), 7 (6 nhánh lỗi cùng body), 8 (mã khôi phục một lần + song song + audit/thông báo/email + ≤ 3), 9 (`MFA_ENFORCED`, phiên mở trước khi bật cờ cũng bị chặn), 10, 11 (S2 thiếu/sai/phát lại, cổng S2 trên createUser/setUserRoles/revoke), 12 (quét `audit_event`, `outbox_message`, `idempotency_key`, `staff_notification` không có mã TOTP, mã khôi phục, `mfaToken`, bí mật, URI), 13 (setup gửi lại cùng `Idempotency-Key` → bí mật mới, không lưu idempotency, DEK cũ bị hủy), 15 (người xác nhận có 2FA chỉ đưa mật khẩu → `REAUTH_FAILED`); thêm `resetUser2fa`, lệnh khôi phục 06.33, S2 trên `changeMyPassword`, `Me.businessDate` | 17/17 |
| Toàn bộ api `vitest` (DB Postgres 17 riêng, migrate từ đầu tới 0079) | **106 tệp, 2999 đạt, 2 skip, 0 lỗi** |
| `tsc --noEmit` api · ESLint api · Prettier | 0 lỗi · 0 · xanh |
| `drizzle-kit generate` | "No schema changes" |
| `gen-openapi-meta`, api-client `gen.mjs`, `gen_rbac_cases.py --check`, `gen_traceability.py --strict` | cập nhật / up to date / mismatch [] / exit 0 |
| `infra/ci/check-compose.sh` | OK |

Ca 14 (US-164 duyệt từ xa – BE-A), ca 16 (Playwright – FE-A/QA) không thuộc server BE-C; server đã đưa `principal.session.mfaAt` cho BE-A kiểm "phiên đã qua bước 2" (06.29). Ca 12 phần "quét log": dựa vào bộ che `SECRET_BODY_FIELDS` (đã có test đơn vị); chưa có test đọc log thật của Nest.

## 3. Quyết định trong quyền BE (ghi decision-log khi ORC gộp)
1. **TOTP tự viết** (≈ 60 dòng, vector RFC xanh) thay `otplib` – không thêm phụ thuộc, ARC duyệt PR theo ARC 1.3.
2. **`mfa_login_challenge` dùng RLS tổ chức + một hàm entry** (`auth_mfa_challenge_resolve`) thay vì "chỉ hàm SECURITY DEFINER" ở erd 4.15: token → (user, tổ chức) qua hàm; khóa/cập nhật dòng dưới RLS trong cùng giao dịch với user (như `user_session`). An toàn tương đương, khóa dòng được. **ARC xác nhận / sửa erd 4.15.**
3. **DEK theo cơ sở**: cột `mfa_data_key_id`, `mfa_key_property_id` (erd 4.2 đã nhắc `mfa_data_key_id`). Hủy DEK khác cơ sở làm sau UnitOfWork.
4. **Khóa đăng nhập do sai TOTP trả `429 RATE_LIMITED`** (như SR-AUTH-04 cho mật khẩu – SEC 06.19 "→ 429"); mọi nhánh khác `401 MFA_INVALID`.
5. **S2 trước UnitOfWork** (giao dịch riêng, đếm được khi request lỗi) – hệ quả: gửi lại cùng `Idempotency-Key` của `resetUser2fa`/`createUser`… phải có bằng chứng S2 **mới** (TOTP bước kế) trước khi nhận phản hồi đã lưu.
6. **`setUserRoles`**: S2 chỉ khi *nâng* (owner mới; manager mới với người chưa là owner ở cơ sở đó) – hạ owner → manager không cần S2.
7. Email (06.15, 06.33, reset): ghi outbox topic `staff.email` (`template`, `userIds`) – chưa có bộ gửi (ARC R2: INT/BE-D, mock như US-141).

## 4. Lệch hợp đồng cần ARC xác nhận (đã sửa tối thiểu để chạy)
- **`x-c3-log` thêm cho `confirmMy2fa`, `regenerateMyRecoveryCodes`** (`openapi.yaml`, đã sinh lại `openapi-meta.ts`): `recoveryCodes` mang `x-classification: C3` nhưng hai operation không khai `x-c3-log` → serializer **bỏ trường `recoveryCodes`** khỏi phản hồi (mã khôi phục không tới được client). Server ghi `c3_access_log` `mfa_secret/create` cho hai lệnh này. ARC ghi vào "0.3.8 bổ sung 1".
- SEC ca 11 ghi "không TOTP → 401"; hợp đồng ARC 1.2 là `422 STRONG_REAUTH_REQUIRED` (không đếm). Làm theo ARC; SEC xác nhận khi Verified.

## 5. Rủi ro / cần phối hợp
- **CỔNG S2 (commit `ae836f7`)**: chỉ gộp **cùng** FE-A (màn Người dùng, Thiết bị gửi `reauth`) và QA (E2E: `tests/e2e/support/api.ts` `createThrowawayUser`, `api/identity.api.spec.ts`, `rbac/sprint1-ops.ts` phải gửi `reauth: { password }`). Gộp `4aa2714…8712822` trước được – không phá client hiện có.
- `MFA_ENFORCED=true` trên staging: OPS đặt trong `/opt/ottimo/.env`; production không khởi động nếu thiếu.
- Lệnh khôi phục 06.33 chạy bằng `docker compose exec api node dist/admin/mfa-operator-reset-cli.js` (image chỉ có `dist/`); OPS diễn tập một lần trên staging trước dữ liệu thật.
- SR-AUTH-11 (06.31) "người xác nhận có 2FA dùng mật khẩu + TOTP": hiện vẫn **fail-closed** (người có 2FA không xác nhận được bằng mật khẩu – ca 15 xanh). Nhận TOTP trong `verifyApprover` cần sửa `password-reauth.ts` + trường `lateFeeInsteadOfNight.totpCode` ở `checkout.service.ts` (tệp tiền, BE-A sau bước 3) – BE-C làm phần identity khi BE-A sẵn sàng.

## 6. Việc còn lại của BE-C trong Sprint 1
- R3-Q26 (cổng `reservations/public/stay-occupancy.port.ts`, chuyển housekeeping khỏi 20+ câu SQL đọc `reservation`/`reservation_segment`/`room_block`, khối test "SQL chỉ chạm bảng của module mình"), R3-Q27 phía files, R3-Q28 (registration qua `ReservationReadPort` – cần BE-A thêm hàm ở `read-port.ts`): **chưa làm** (lần này dành cho US-143).
- R3-Q17 (BE-65 kiểm lại, BE-74, BE-75, BE-79), R3-Q33 (a1) B.6, US-008 phía server (S2 đã có cho `createUser`), US-128/R3-Q32: chưa làm.
- Nhận TOTP trong `verifyApprover` (SR-AUTH-11 R3) – chờ BE-A.
- T16 xóa dòng `mfa_login_challenge` hết hạn: hiện xóa theo người lúc đăng nhập kế; job dọn toàn bảng chưa nối.
