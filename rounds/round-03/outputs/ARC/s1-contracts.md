# Hợp đồng Sprint 1 Round 3 – OpenAPI 0.3.8-draft (ARC, 22/10/2026)

- **Trạng thái**: đã áp vào `product/docs/api/openapi.yaml` (`info.version: 0.3.8-draft`, mục "Thay đổi phiên bản 0.3.8-draft"); đã sinh lại `openapi-meta.ts`, `openapi-schemas.ts`, api-client `openapi.ts`, `rbac-cases.json/.csv`; `erd.md` mục 4.15 mới + dòng lịch sử. **Chưa commit** – ORC commit.
- **Quy ước số phiên bản**: giữ quy ước repo `0.3.x-draft`, mỗi sprint một số. Đây là 0.3.8. Bổ sung trong sprint ghi "0.3.8 bổ sung n" như R2.
- **Đầu vào**: `rounds/round-03/plan.md` (3.1, 3.3, 4.1, 4.2, 4.4), `sprint-1-plan.md` 4.2; decision-log 22/10 "INV – trả lời tổng kết Round 2"; ESC-024 B, ESC-026 A, ESC-027 B; SEC `round-03/outputs/SEC/s1-security-requirements.md` (A, C, D – ORC chuyển 06.9); DOM `round-03/outputs/DOM/s1-money-oracle.md` (mục 2, 5.3 – ORC chuyển); `round-02/outputs/ARC/openapi-0.3.7.md` 16.31; `round-02/reviews/s4-ARC.md` (S4-03, S4-09, F); backlog 5.5.
- **Nhãn**: [ARC] = quyết định kỹ thuật của ARC (đã ghi decision-log). [GIẢ ĐỊNH – vai] = chờ vai đó xác nhận, đội vẫn làm theo. Repo công khai: tài liệu này không có bí mật, số tài khoản, thủ tục khôi phục chi tiết.

---

## 0. Kiểm tra đã chạy (cây làm việc, 22/10)

| Kiểm tra | Kết quả |
|---|---|
| `openapi-spec-validator` 0.7.2 (`openapi.yaml`, `openapi.test.yaml`) | OK / OK |
| Redocly 1.34.21 `lint` | 0 lỗi, 4 cảnh báo – đúng 4 cảnh báo cũ; 0 cảnh báo mới |
| `check-no-test-surface.sh spec` | OK |
| `gen-openapi-meta.mjs` + `--check` | sinh lại, up to date (205 operation, trước 196) |
| api-client `gen.mjs` | sinh lại; vitest api-client 30/30 |
| `gen_rbac_cases.py` + `--check` | sinh lại; 205 operation, 2.255 ca, R3 418, **rbac mismatch []** |
| `gen_traceability.py --strict` | **exit 0**: ops lệch 0, thuộc tính lệch 0, `x-rbac-field` 178 gắn, 0 thiếu, mã lạ [] |
| vitest api `contract`, `serializer`, `module-boundaries`, `redact` | 31/31 (tập đóng audit `money` không đổi) |
| `tsc --noEmit` api, api-client, admin-web, guest-web, mobile | 0 lỗi |
| prettier (spec, generated, fixtures) | xanh |

Không chạy test tích hợp cần PostgreSQL (không đổi mã server).

---

## 1. US-143 – Đăng nhập hai bước owner/manager + khôi phục (ESC-027 B, SEC mục A)

### 1.1 Hợp đồng

| Thành phần | 0.3.8 |
|---|---|
| Cờ bắt buộc | **Biến triển khai `MFA_ENFORCED`** (OPS, `.env.example` thêm dòng) – không phải tham số trên màn [ARC]. `true` bắt buộc ở staging/production; server **từ chối khởi động** `APP_ENV=production` khi `false`. dev/CI mặc định `false` (E2E cũ không vỡ); bộ E2E 2FA chạy stack có `true` |
| Phiên hạn chế (06.4) | `login` 200 + `Me.mfaEnrollmentRequired = true` → chỉ `getMe`, `getMy2fa`, `startMy2faSetup`, `confirmMy2fa`, `logout`; còn lại `403 MFA_ENROLLMENT_REQUIRED` (guard chung, đọc `user_session.enrollment_only`) |
| `login` có 2FA | `401 MFA_REQUIRED` + `Problem.mfaToken` (≥ 256 bit, lưu SHA-256 ở `mfa_login_challenge`, một lần, 5 phút, gắn kênh) |
| `loginMfa` | Thân `{mfaToken, totpCode \| recoveryCode}` (**bỏ trường `code`** – tránh tên chung chung trong bộ che log); mọi lỗi `401 MFA_INVALID` giống hệt; 5 sai/token, 5 sai/người/15 phút, cộng vào khóa đăng nhập SR-AUTH-04 |
| TOTP | RFC 6238 SHA-1/6 số/30 giây, ±1 bước; chống phát lại `app_user.mfa_last_used_step` (cập nhật nguyên tử) – áp cho **mọi** chỗ nhận TOTP (đăng nhập, S2, SR-AUTH-11) |
| Mã khôi phục | 10 mã × 16 ký tự base32 Crockford (≥ 80 bit), hiển thị 4-4-4-4; DB SHA-256; dùng một lần bằng một câu `UPDATE … WHERE` |
| `startMy2faSetup`, `confirmMy2fa` | **Bỏ `Idempotency-Key`** (SEC 06.9 – ORC chuyển): phản hồi có bí mật C3/mã khôi phục không bao giờ vào `idempotency_key`. Gửi lại setup = bí mật chờ **mới** (QR cũ hết hiệu lực); gửi lại confirm = `409` (đã bật) → tạo bộ mã mới. `confirmMy2fa` thân `totpCode`; thu hồi phiên khác + cấp phiên mới |
| Mới `regenerateMyRecoveryCodes` | `POST /v1/me/2fa/recovery-codes`, S2, không `Idempotency-Key` |
| Mới `resetUser2fa` | `POST /v1/users/{userId}/2fa/actions/reset` – OWN (A100), S2, `reason`; tự đặt lại cho mình → 422; đặt lại OWN khác được (đường ESC-027 A sau này không sửa mã) |
| Khôi phục OWN duy nhất (06.33) | **Không có endpoint.** Lệnh quản trị chạy trong container api (script `services/api/scripts/` do BE-C viết, OPS chạy): xóa 2FA + mã, thu hồi phiên, buộc đăng ký lại, audit `mfa.reset_by_operator`, email cho OWN. Thủ tục xác minh danh tính: OPS viết, SEC duyệt, **ngoài repo** |
| `Me` | `mfaEnrollmentRequired`, `soleOwner` (câu `auth.enroll.single_owner`), `recoveryCodesLow` (≤ 3) |
| `getMy2fa` | thêm `enforced`, `pendingSetup`, `enrolledAt`, `soleOwner` |
| `User` | `mfaEnabled`, `mfaRecoveryCodesRemaining` (OWN xem ở S26 – 06.35) |

### 1.2 Xác nhận lại dùng chung (step-up) – S1 / S2 (SEC A.5)

- **S1 giữ nguyên**: `stepUp` (PIN hoặc mật khẩu, cửa sổ `c3_stepup_minutes`) cho thao tác C3; PIN trong request cho duyệt FOC/xóa nợ.
- **S2 = schema mới `StrongReauth`** `{password, totpCode | recoveryCode}` gửi **trong** request [ARC]. Không làm token S2 riêng: bằng chứng gửi kèm đúng một request đã thỏa "gắn một thao tác, dùng một lần, không cửa sổ" của SEC (chặt hơn token 5 phút), không thêm bảng, không thêm vòng gọi. Hệ quả: hai thao tác S2 trong cùng 30 giây cần mã của bước TOTP kế tiếp (chống phát lại) – UXD ghi câu "Chờ mã mới".
- Đánh dấu `x-strong-reauth` (tài liệu; BE giữ danh sách trong mã + test so với spec): `createUser`, `updateUser` (khi có `status`/`resetPassword`), `setUserRoles` (khi thêm vai owner/manager), `trustCurrentDevice` (giữ `currentPassword` + `totpCode`, thêm `recoveryCode`), `revokeTrustedDevice`, `changeMyPassword` (thêm `totpCode`/`recoveryCode`), `disableMy2fa`, `regenerateMyRecoveryCodes`, `resetUser2fa`, `cancelScheduledParameter`, `setParameter` (chỉ khóa `payment_receiving_account`). US-104 xuất dữ liệu: S2 khi ARC ra hợp đồng US-104 (Sprint 2).
- Thiếu yếu tố → 422 `STRONG_REAUTH_REQUIRED` (không đếm); sai → 401 `REAUTH_FAILED` (đếm SR-RL-02). Một hàm `StrongReauthService.verify` ở module identity – module khác gọi qua `identity/public`.
- **CỔNG**: các operation đã cài (`createUser`, `updateUser`, `setUserRoles`, `revokeTrustedDevice`, `changeMyPassword`, `setParameter`) đổi hành vi → BE + FE **cùng PR** (như B-6 ở R2). `MFA_ENFORCED = false` và người chưa bật 2FA: S2 = mật khẩu (FE vẫn phải gửi `reauth`).
- SR-AUTH-11 (tại quầy): `lateFeeInsteadOfNight.totpCode`; người xác nhận có 2FA chỉ `pin` hoặc `password` + `totpCode`.

### 1.3 Việc BE (theo bảng ORC: BE-C server, FE-A màn, OPS cờ + lệnh)
- Migration (số kế tiếp lúc rebase – mục 7): cột `app_user`/`user_session`, bảng `mfa_login_challenge` (erd 4.15).
- `secret-fields.ts` thêm `mfaToken`, `recoveryCode`, `recoveryCodes`, `otpauthUri` (SEC 06.22). Ghi chú: các trường hiện đã có `totpCode`, `otp`, `pin`, `password`.
- Mã nhận TOTP dùng một thư viện đã có kiểm định (ví dụ `otplib`) hay tự viết 30 dòng theo RFC 6238 + vector thử RFC: BE-C chọn, **ARC duyệt PR**; không thêm dịch vụ ngoài.

---

## 2. US-164 – Quản lý xác nhận từ xa (ESC-024 B, SEC 06.29–06.31)

### 2.1 Quyết định thiết kế [ARC]
- **Tài nguyên riêng `ManagerConfirmation`** (module frontdesk, bảng `manager_confirmation`), **không** dùng `approval_request`. Lý do: (1) mã duyệt FOC/xóa nợ đang trong lượt kiểm tiền – thêm loại vào đó là chạm mã tiền đóng băng; (2) vòng đời khác hẳn (hết hạn 15 phút, dùng một lần ở B18, nhánh tự ghi khi hết hạn); (3) yêu cầu này không được vào blocker `pending_approvals` của B18. Ý SEC 06.29 "gắn một yêu cầu cụ thể, dùng một lần" giữ nguyên: B18 nhận đúng `confirmationId`, tiêu thụ trong cùng giao dịch. **SEC xác nhận điểm lệch chữ này.**
- **Duyệt chỉ bằng PIN** (không mật khẩu) trên phiên đã qua bước 2 (`user_session.mfa_at`), mỗi yêu cầu nhập PIN, không cửa sổ.
- **Kênh tới điện thoại quản lý**: Web Push chuẩn (VAPID, `putMyPushSubscription` đã có hợp đồng) + SSE + hộp thông báo – không thêm dịch vụ trả phí, không Zalo/SMS. Payload đẩy chỉ `kind` + `refId`. Màn duyệt: **Desk đáp ứng trên điện thoại** (admin-web, route `/confirmations/:id`), không phải PWA buồng phòng (PWA là phiên `staff_pwa` 30 ngày – không hợp cho duyệt tiền) [ARC]. Khóa VAPID qua biến môi trường (`.env.example`: `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_SUBJECT` – placeholder).

### 2.2 Hợp đồng

| Operation | Ai | Ghi chú |
|---|---|---|
| `createManagerConfirmation` `POST …/reservations/{id}/manager-confirmations` | FD, FDL | `kind = late_fee_as_night`, `departedAt`, `expectedLateFeeVnd`, `reason`, `requestFoc?`. Kiểm nghiệp vụ chỉ đọc dưới khóa L1→L2→L3; khóa số tiền; `expiresAt` = +`remote_confirm_timeout_minutes` (15). Một `pending` mỗi đơn (409 `MANAGER_CONFIRMATION_PENDING`) |
| `listManagerConfirmations`, `getManagerConfirmation` | OWN/MGR mọi; FD/FDL `own` | `expired` tính lúc đọc |
| `transitionManagerConfirmation` `approve`/`reject`/`cancel` | approve/reject OWN, MGR; cancel người gửi/FDL+ | PIN; FOC > hạn mức người duyệt → 403 không đổi; quá hạn → 409 `CONFIRMATION_EXPIRED`; `expectedVersion` |
| `checkOut.lateFeeInsteadOfNight.confirmationId` | FD+ | (2) đã duyệt: lấy số từ yêu cầu, không gửi số/mật khẩu; (3) **hết hạn** (ESC-024 B): ghi đúng phụ thu server tính, không FOC, `channel = expired_self_record`, thông báo + "Cần chú ý" `late_fee_post_review` 24 giờ (US-164 AC8) |
| Khóa đơn khi `pending` | – | `checkOut` khác, `extendStay`, `changeRoom`, `setLateCheckout` → 409; thu tiền, minibar, ghi chú vẫn được |

Thông báo `manager_confirmation_requested/decided/expired`, `late_fee_post_review`; SSE `manager_confirmation.changed`; "Cần chú ý" `manager_confirmation_pending`, `late_fee_post_review`; `refType` `manager_confirmation`. Khóa tham số (chỉ OWN): `remote_confirm_timeout_minutes` (5–60, 15), `late_fee_post_review_hours` (12–48, 24).

Miễn sau hậu kiểm (ESC-024 B "quản lý xem lại, thấy nên miễn thì hoàn"): MGR+ dùng **A32 có sẵn** trên folio `settled` trong cửa sổ 24 giờ → dư → hoàn tiền BR-522. Không thêm đường tiền. [GIẢ ĐỊNH – DOM chốt ở BR-416 0.4.0; nếu DOM muốn khoản này đếm vào báo cáo FOC thì DATA đếm dòng A32 có mã lý do `late_fee_waived_post_review`.]

Mã audit `money` mới `manager_confirmation.requested`, `manager_confirmation.decided`: **BE-A thêm vào tập đóng `AuditEvent.action` (spec) và `money-actions.ts` cùng PR** (test `module-boundaries` buộc hai bên khớp; ARC chưa thêm để CI hiện tại xanh). Audit B18 giữ mã `reservation.late_fee_instead_of_night`, `after.channel` ∈ `desk|self|remote|expired_self_record`, `after.confirmationId`.

### 2.3 Chia việc theo tệp (để không đụng lượt kiểm tiền)
- **(a) Song song ngay** – tệp mới: `frontdesk/internal/manager-confirmations.{service,controller}.ts`, migration, J27 hết hạn, thông báo/SSE/"Cần chú ý" (BE-D qua cổng `ManagerConfirmationReadPort`), FE-A Desk + màn duyệt trên điện thoại, MOB không có việc.
- **(b) Phần B18** (`frontdesk/internal/checkout.service.ts` nhánh `lateFeeInsteadOfNight`) cùng tệp với 209/210 → **gộp sau bước 3 (208)** của lượt kiểm tiền, như mục 6e của `sprint-1-plan.md`; nằm trong phạm vi critic + fuzz. Cùng PR: SR-AUTH-11 R3 (`totpCode`, mật khẩu đơn → 401) và R3-Q09 (403 theo vai trước kiểm mật khẩu).

---

## 3. US-155 phần Desk (R3-Q06)

- **Hợp đồng đã đủ** từ 0.3.7 bổ sung 2 (+ phản hồi review SEC/DOM): `getPublicFormToken`, `createWebsiteBookingRequest`, `listWebsiteBookingRequests`, `getWebsiteBookingRequest`, `transitionWebsiteBookingRequest` (claim/release/decline/mark-spam/reopen/erase), `lookupWebsiteBookingRequests`, `saveQuote`/`createHoldFromQuote`/`createReservation.websiteBookingRequestId`, thông báo/SSE/"Cần chú ý", Q-W01…Q-W12 đã trả lời (`openapi-0.3.7.md` mục 13). **0.3.8 đóng băng phần này cho Sprint 1**, chỉ thêm `x-rbac: [A64, S35]` cho list/get (rbac khớp, `--strict` xanh). `transitionWebsiteBookingRequest` giữ không `x-rbac` (một operation gộp A65–A68 với quyền khác nhau từng hành động – kiểm bằng ca QA E19-05).
- **BE-D làm trong Sprint 1 cả phần server công khai** (form token + tạo yêu cầu) để Desk nhận được yêu cầu thật trên staging; công tắc `public_booking_requests_enabled` mặc định `false` (bật cần luật sư LZ-2, LZ-8 + SEC C-2/C-3 – US-155 AC4). Form trên landing (FE-LP) là Sprint 2.
- Module mới `public-site` (erd 4.14): bảng `website_booking_request`, `privacy_notice_version`, `public_form_nonce`, `rate_limit_counter`; cổng `WebsiteRequestPort` cho `sales` (WR6 trong giao dịch giữ chỗ/đơn); job `web_request.stale` 06:05, `web_request.purge` 03:10. Khóa tham số theo chú thích `x-security-parameters` – thêm cùng migration.
- Q-W11 (`contactAttempts[]`): không làm Sprint 1. BE-A sửa 1 dòng chú thích `allowed-actions.ts` → "state-machines mục 19" (E19-02 cũ).

---

## 4. R3-Q51 – Màn tài khoản nhận VietQR (SEC mục C)

| Điểm | Hợp đồng 0.3.8 |
|---|---|
| Quyền | `payment_receiving_account` **chỉ OWN** đọc (cả bản che) và ghi; MGR/FDL `getParameterHistory` → 403; `listParameters` bỏ khóa khỏi vai khác (đổi nhỏ server – BE-B, `parameters.service.ts`) |
| Hiệu lực | `effectiveFrom` ≥ ngày **kinh doanh** + 1, kể cả lần đặt đầu → 422 `EFFECTIVE_FROM_TOMORROW`. Gửi lại cùng ngày của dòng đã lên lịch = sửa dòng đó (đường `ON CONFLICT … WHERE effective_from > today` hiện có) |
| Hủy dòng lên lịch | Operation mới `cancelScheduledParameter` `POST …/parameters/{key}/actions/cancel-scheduled` (`effectiveFrom`, `reason`, `reauth` S2); dòng đang hiệu lực → 409 |
| Xác thực lại | `setParameter.reauth` thêm `totpCode`/`recoveryCode` (S2) |
| Che số | `accountNoMasked = '•••• 1234'` + `bankName` tra BIN (bảng NAPAS tĩnh trong mã) – thay dạng `9704••••1234` (SEC Q51-2). `accountNo` đã có trong `SECRET_BODY_FIELDS` (log + băm idempotency); số đầy đủ chỉ trong `qrPayload` |
| Báo | `receiving_account_changed` lúc lưu/hủy (mọi OWN/MGR, chỉ "đã đổi" + ngày hiệu lực, không số) + **email mọi owner** (kênh email: xem rủi ro R2); cảnh báo 24 giờ trên QR giữ cách tính hiện có |
| Màn (FE-A + UXD, brand OTTIMO) | Không điền sẵn số cũ, gõ hai lần, màn xác nhận (ngân hàng + `•••• 4 số` + tên + ngày), xóa giá trị khi rời màn, không lưu trình duyệt; không nút "xem đủ số" |

Làm sau khi `StrongReauthService` của US-143 có (BE-B gọi qua `identity/public`).

---

## 5. Lượt kiểm tiền theo 16.31 (210 → 209 → 208) + BE-83/ESC-026 A

### 5.1 Thứ tự và chỗ song song (xác nhận, khớp `sprint-1-plan.md` 3.1)

| Bước | Việc | Tệp chạm chính | Song song |
|---|---|---|---|
| 1 | **210** (R3-Q21) | `frontdesk/internal/checkout.service.ts` (`writeDebt`, `openDebtVnd`) | – (làm đầu) |
| 2 | **209** (R3-Q20) | `checkout.service.ts` (`writeDebt` nối/mở theo `cycleOpenDebtVnd`, bỏ cờ `keep`, `debtOnCheckout` phần chênh); `folio/public/folio-close-job.ts` (J15); `frontdesk/internal/attention-sources.ts` (`checkout_debt` lọc `openDebtVnd > 0`) | **Cùng hàm với 210** → khuyên 210 + 209 **một PR** (16.31.2 gạch cuối); nếu tách: 209 rebase sau 210 |
| 3 | **208** (R3-Q19) | `folio/internal/folio-lines.service.ts` (A32 điều kiện theo số, N-15); `checkout.service.ts` (`openDebt` trả `null` khi 0, xuất `cycleOpenDebtVnd`); `folio/internal/foc.service.ts` (xóa nợ khi số = 0 → 409) | Phần `folio-lines.service.ts` code song song với 1–2 trên nhánh riêng; **gộp sau 210 (và 209 nếu đụng `openDebt`)**; SEC review trên head SHA sẽ gộp (SEC D) |
| 4 | **BE-83 + ESC-026 A** (R3-Q22, R3-Q25) | `folio/internal/foc.service.ts`, `approvals/**` (trần cộng dồn), bảng mới `foc_stay_alert`, thông báo/"Cần chú ý" (BE-D qua cổng đọc) | Sau bước 3 |
| 5–6 | R3-Q39 #8–#12 (FE-A), R3-Q01, Q10, Q23, Q24, Q29, **US-164 phần B18**, R3-Q27 phía payments | xem các mục | Sau bước 3; R3-Q39 FE song song từ đầu (không chạm server) |
| 7 | Fuzz R3-Q30 (QA) trên bản có 1–6 | – | – |

Thứ tự khóa giữ ARC 16.19 (L1 đơn → L2 căn → L3 folio → L4 phiếu/yêu cầu). Đường mới làm đổi `openDebtVnd` (US-164 nhánh hết hạn **không** đổi O vì ghi trước B18; thu hồi ESC-026 – dời, mục 5.4) phải qua checklist 16.31.3.

### 5.2 Sửa câu 210 (ORC chuyển từ DOM `s1-money-oracle.md` mục 2)
Câu cuối 16.31.2 "X của dòng cũ = còn phải thu trước lần ghi" **sai khi folio có khoản trong cửa sổ** (ca 210-A ra 1.004.000 thay 934.000) – đã gạch và trỏ về đây trong `round-02/outputs/ARC/openapi-0.3.7.md`. Quy tắc cài cho BE-A/BE-B:
- Folio có nợ cũ chưa có chu kỳ (`debt_opened_at IS NULL`, `checkout_mode = 'debt'`) khi `writeDebt` chạy: **X = max(0, B_trước − W_cũ)**, trong đó B_trước = còn phải thu trước lần ghi; **W_cũ** = min(B_trước, Σ dòng phí **sống** ghi sau `checked_out_at` của lượt (dòng `post_checkout`, minibar sau trả phòng) + phần **tăng** của A32 sau trả phòng (dòng thay − dòng bị thay)). Khoản thu trả công nợ trước (G-6) nên không trừ khoản thu khỏi W_cũ. Kiểm: 210-A B_trước 170.000, W_cũ 70.000 → X 100.000 → O = 100.000 + 834.000 = **934.000**; 210-B B_trước 2.000.000, W_cũ 0 → O **2.916.000**.
- Khởi tạo chu kỳ: `debt_opened_at` = giữ lúc ghi nợ cũ nếu đọc được từ audit `reservation.debt_on_checkout` cũ nhất của chu kỳ, không thì `checked_out_at`; `debt_recorded_vnd` = X + phần ghi; `debt_base_vnd` = Σ giảm hiện tại; **giữ hạn và lý do cũ**.
- Không migration dữ liệu (staging dựng từ DB trống – điều kiện OPS C2; dữ liệu cũ chỉ có ở demo/QA). Test bắt buộc: oracle DOM 210-A, 210-A tiếp, 210-B, 210-B tiếp, 210-C.

### 5.3 BE-83 và ESC-026 A (theo DOM BR-433 (a)(b)(c) 0.4.0, oracle mục 5)
- (a) Xóa nợ: Σ cộng dồn theo folio, mọi chu kỳ (BR-525-25), gồm yêu cầu đang chờ, trừ từ chối/hủy; đọc dưới L3; hai yêu cầu song song → đúng một tự áp (BR-525-27). Không cột mới.
- (b) FOC thường: Σ theo khóa FOC (BR-434) của cùng người duyệt cấp.
- (c) Σ lượt (FOC, giảm giá đặc biệt, xóa nợ – số đang áp, do FD/FDL/MGR) > ngưỡng = hạn mức một lần của **vai cao nhất dưới OWN có khoản đang áp** → **thông báo `foc_stay_total_exceeded` mỗi lần áp** + **một** "Cần chú ý" mỗi lượt (bảng `foc_stay_alert`). Không chặn. "Lượt" = đơn gốc của chuỗi đơn con; dài hạn = đơn HĐ.
- Tham số "phần vượt chờ duyệt" (ESC-026 B sau này): khóa `foc_stay_total_hold_enabled` (bool, chỉ OWN, mặc định `false`) – **chưa cài ở Sprint 1**, ghi để chuyển B "bằng một tham số" như INV được hứa.

### 5.4 "OWN thu hồi khoản miễn" (BR-433 (c) v0.4.0, E26-6…8) – **dời Sprint 2** [ARC]
Đây là **đường tiền mới** (đảo dòng FOC đã áp, trả hạn mức, có thể tạo khoản trong cửa sổ trên folio `settled` – làm đổi B và W). Đưa vào giữa lượt kiểm tiền đang mở làm phình phạm vi critic/fuzz. Quyết định: Sprint 1 chỉ thông báo + "Cần chú ý" (E26-1…5, 9); E26-6…8 gắn `pendingFix: R3-FOC-REVOKE` (QA thêm). Hợp đồng dự kiến 0.3.9 (Sprint 2), cần ngoại lệ đóng băng mã tiền có dòng decision-log:
- `revokeApproval` `POST …/approval-requests/{id}/actions/revoke` – chỉ OWN, PIN (S1), `reason`, `expectedVersion`; yêu cầu `approved` loại `foc`/`special_discount`/`debt_write_off`; folio `open`/`settled` (`closed` → 409 `FOLIO_LOCKED`, E26-8); `focState` → `cancelled`, `focCancelReason = owner_revoked`, trả hạn mức; folio `settled` → khoản thành W (J15 chuyển nợ – E26-7); audit `money` `folio.foc_revoked`.

---

## 6. Quyết định R3-Q38 và R3-Q26–Q28

### 6.1 R3-Q38 – **CÓ**, đã vào 0.3.8 [ARC]
`Me.properties[].businessDate`, `businessDayRollover`; `BookingRules.businessDayRollover`. Cộng thêm, không phá vỡ (serializer sẽ trả khi server điền). Server: `getMe` đọc `PropertyContextService.now()` cho từng cơ sở (BE-C – identity; đọc qua `platform/public`). Sau khi có: FE-A bỏ nhánh `getRack` của `useBusinessDay` (R3-Q36 hẹn giờ tới mốc + `visibilitychange`), MOB bỏ hằng 06:00 (R3-Q37 – hằng chỉ dùng khi chưa từng có phiên). Lý do làm ngay: rẻ (2 trường), là nguồn ngày cho R3-Q39 #8–#12 trong lượt kiểm tiền.

### 6.2 R3-Q26–Q28 – **cả ba trong Sprint 1**, hạn trước bản dùng thử

| Mục | Phạm vi Sprint 1 | Ai | Test kiến trúc (ARC Verified) |
|---|---|---|---|
| R3-Q26 đọc chéo bảng (S4-03, S4-09, phần còn lại BUG-R2-186) | Cổng mới `reservations/public/stay-occupancy.port.ts` (`inHouseByRoom`, `arrivalsByRoom`, `stayArrival`, `activeBlocks` – một định nghĩa với J8) – **BE-C viết tệp mới, BE-A review** (BE-A đang ở lượt tiền); `guests/public` `displayName`, `serviceNotes`, cờ VIP (không `tags` thô) – BE-B; housekeeping, guest-portal chuyển sang cổng (`room`/`property` qua `platform/public`) – BE-C, BE-D | BE-C, BE-D (+ BE-A, BE-B review cổng) | `module-boundaries.test.ts` thêm khối **"SQL chỉ chạm bảng của module mình"**: bảng → module chủ (danh sách trong test, sinh từ erd mục 4), quét `FROM|JOIN|INSERT INTO|UPDATE <bảng>` ở `src/modules/<m>/**`; ngoại lệ: `REPORTING_READ_TABLES` và danh sách tạm `KNOWN_CROSS_READS` **về 0 trước bản dùng thử**. Ca parity "khách ở ngày đi" giữa cổng và J8 |
| R3-Q27 gỡ `ModuleRef` | (1) `files/public/attachment.service.ts` → `ReservationReadPort` qua constructor (BE-C); (2) `payments/public/payment.service.ts` → tiêm `ATTACHMENT_USAGE` ở constructor, token chuyển sang `files/public` (BE-B) – **tệp tiền**: gộp trong cửa sổ lượt kiểm tiền sau bước 3, thuần nối dây, không đổi logic | BE-C rồi BE-B | Test "ModuleRef only where listed": danh sách cho phép → **rỗng**; thêm khẳng định không `ModuleRef` trong `src/modules/**` |
| R3-Q28 registration qua cổng đọc (S3-15 (e), BUG-R2-205, S4-24) | registration thôi đọc `reservation_guest`/`reservation.booker_guest_id` (`registration.service.ts`, `registration.repo.ts`) – dùng `ReservationReadPort` (BE-A thêm hàm đọc người của đơn – tệp `read-port.ts`, không phải tệp tiền); `partyOverCount` dùng `hooks.partyCount` | BE-C (+ BE-A cổng) | Cùng khối SQL ở R3-Q26 (registration không còn trong `KNOWN_CROSS_READS`) |

R3-Q26/Q28 không chạm tiền → song song lượt kiểm tiền; chỗ nào chạm tệp của lượt tiền thì sau bước 3 (đúng `sprint-1-plan` 3.3).

---

## 7. Migration – quy ước số trong Sprint 1 [ARC]
Nhiều luồng song song cùng thêm migration. Drizzle bỏ qua migration có `when` nhỏ hơn bản đã chạy, nên **không giữ chỗ số trước**: số = số kế tiếp trên `main` **lúc rebase trước khi gộp**, `when` = lúc rebase; test `migrations-journal` phải xanh trên nhánh đã rebase. Thứ tự dự kiến (chỉ để lên kế hoạch): 2FA (BE-C) · `manager_confirmation` + 2 khóa tham số (BE-A) · `public-site` (BE-D) · `foc_stay_alert` (BE-B, bước 4). Lượt tiền bước 1–3 không cần migration.

---

## 8. Hai quyết định nhỏ ORC giao ở `sprint-1-plan` 4.2 (làm luôn)
- **R3-Q10** [ARC]: server **bắt buộc** `periodId` + `roomId` khi vai `housekeeping` gọi `recordMinibarCheck` (thiếu → 422 `REQUIRED`); FD+ giữ như cũ. Không đổi hình dạng hợp đồng (trường đã có). BE-B cài trước, MOB đổi màn sau.
- **SEC B.6** [ARC]: chọn **(a1)** – "Cần chú ý" `data_quality` `check = attachment_retention_anchor_missing`, chỉ OWN/MGR, đã ghi mô tả `AttentionItem.params`. BE-C (đếm từ `retention_run`), UXD câu theo brand, FE-A.

## 9. Mục `sprint-1-plan` 4.2 **chưa** có trong 0.3.8 (BE không code phần API mới của các mục này tới khi ARC chốt – "0.3.8 bổ sung 1", dự kiến D3)
US-021 AC7 mã `property_fault` + nhánh hoàn đủ; R3-Q13 thông báo `checkout_overdue`; R3-Q42 token `purpose=notify` + ADR-006 điểm 4; US-128 tham số mã cửa 8 số; US-141 xác minh nhẹ; US-161/162 lịch tin + `message_log`. US-008 dùng `createUser` hiện có + S2 (đã có trong 0.3.8).

---

## 10. Việc được bắt đầu ngay (sau khi ORC commit 0.3.8)

| Vai | Việc |
|---|---|
| BE-B | Lượt tiền bước 1–2 (210 + 209, mục 5.2); code 208 phần `folio-lines` trên nhánh riêng |
| BE-C | US-143 server (migration, guard 06.4, `loginMfa`, setup/confirm, mã khôi phục, `StrongReauthService`, `resetUser2fa`, lệnh quản trị); `Me.businessDate` (R3-Q38); R3-Q26 cổng `stay-occupancy` (tệp mới); R3-Q27 phía files; R3-Q28; B.6 (a1) |
| BE-A | US-164 phần (a) (tài nguyên, migration, J27); review cổng R3-Q26/Q28; chú thích `allowed-actions.ts` |
| BE-D | US-155 server (module `public-site` + Desk); thông báo/SSE/"Cần chú ý" cho US-164 qua cổng đọc |
| FE-A | Màn 2FA (đăng ký, bước 2, mã khôi phục, phiên hạn chế, "Bảo mật của tôi"), hộp S2 dùng chung; US-164 Desk + màn duyệt trên điện thoại; R3-Q51 màn (sau `StrongReauthService`); R3-Q36, R3-Q39 |
| FE-B | S35 hàng chờ yêu cầu website (MSW theo hợp đồng) |
| MOB | R3-Q37 đọc `Me.properties[].businessDate` (MSW tới khi server có); R3-Q10 sau BE-B |
| OPS | `MFA_ENFORCED` + VAPID vào `.env.example`/staging secrets (giá trị do INV/OPS tự đặt, không vào repo); thủ tục khôi phục ngoài repo |
| BA | rbac: A-code cho US-164 (tạo/xem/duyệt/hủy), `cancelScheduledParameter` dùng A101/A102/A118/A119; SM-19 `manager_confirmation`; danh sách đường cần OWN/MGR tại quầy (AC7) |
| QA | Ca SEC A.7, C, oracle DOM 2–5; `pendingFix: R3-FOC-REVOKE` cho E26-6…8 |

Phải chờ: US-164 phần B18 (sau bước 3), R3-Q27 phía payments (sau bước 3), R3-Q51 server (sau S2), mục 9.

---

## 11. Rủi ro / giả định
- R1 – CỔNG S2 trên operation đã cài: BE + FE cùng PR, nếu tách sẽ vỡ màn người dùng/thiết bị/đổi mật khẩu/tham số.
- R2 – **Email** (SEC 06.15, 06.33, Q51-6): repo chưa có kênh email chạy thật. Sprint 1 dùng adapter email qua outbox với chế độ mock (như US-141); gửi thật cần hộp thư info@ottimo.vn có SMTP – không phát sinh phí nếu dùng hộp thư sẵn có [GIẢ ĐỊNH – INT/OPS xác nhận; nếu cần dịch vụ trả phí thì ORC mở ESC].
- R3 – Web Push trên iOS chỉ chạy khi Desk được "Thêm vào màn hình chính" (iOS 16.4+); quản lý dùng iPhone phải làm bước này – hướng dẫn vận hành (OPS + DOM). SSE + hộp thông báo vẫn là đường dự phòng.
- Giả định: DOM chốt BR-416 (miễn sau hậu kiểm qua A32) và SM-19 do BA đặt mã; SEC xác nhận lệch 06.29 (tài nguyên riêng thay `approval_request`) và S2 gửi trong request thay token.

---

## 12. 0.3.8 bổ sung 1 (23/10/2026 – bước Review, ORC chuyển 3 điểm)

`info.version` giữ `0.3.8-draft`. Chỉ đổi mô tả + erd; không thêm trường/operation. Đã chạy lại: `gen-openapi-meta --check` up to date, api-client sinh lại (JSDoc), `gen_rbac_cases --check` OK, `gen_traceability --strict` exit 0, Redocly 0 lỗi (4 cảnh báo cũ), prettier xanh.

| # | Điểm | Quyết định ARC |
|---|---|---|
| 1 | BE-C thêm `x-c3-log` cho `confirmMy2fa`, `regenerateMyRecoveryCodes` (nhánh `worktree-agent-aeb2b1b2ad5190d92`) | **Đồng ý – lỗi hợp đồng của ARC**: hai operation trả `recoveryCodes` gắn `x-classification: C3` mà thiếu `x-c3-log`, serializer (SR-AZ-04) sẽ bỏ trường này. Lấy đúng thay đổi trên nhánh BE-C (ARC **không** sửa cùng dòng trên `main` để tránh xung đột). Một chỉnh: `regenerateMyRecoveryCodes` dùng `action: update` (thay bộ mã đã có), `confirmMy2fa` giữ `action: create`. Ghi `c3_access_log` **trước** khi trả mã (ADR-013) |
| 2 | `mfa_login_challenge` RLS theo tổ chức + hàm entry; cột `mfa_data_key_id`, `mfa_key_property_id` | **Đồng ý**, erd 4.15 đã sửa. Lý do: cùng mẫu `user_session` (token → tổ chức qua hàm entry hẹp, mọi ghi dưới RLS) – chặt hơn bảng không RLS chỉ đi qua SECURITY DEFINER. Điều kiện: hàm entry chỉ trả `(user_id, organization_id)`, không trả `failed_count`/`expires_at`; `REVOKE … FROM PUBLIC`, `GRANT EXECUTE` cho `ottimo_app` (đúng như migration 0079 nhánh BE-C). `mfa_key_property_id` = cơ sở dùng bọc DEK lúc đăng ký, cố định tới khi đăng ký lại; mất vai ở cơ sở đó không làm mất khả năng mở DEK (CryptoService mở theo id đã lưu, không theo vai) – BE-C có ca test |
| 3 | FE-A Q1 – US-143 AC3 (a) "buộc đăng ký lại 2FA trên thiết bị mới sau khi vào bằng mã khôi phục" | **Giữ AC, mở đường trong hợp đồng** (không sửa AC): (a) `loginMfa` bằng `recoveryCode` → phiên **hạn chế** (`enrollment_only`, `Me.mfaEnrollmentRequired = true`) cho **mọi** người có 2FA, không chỉ vai bắt buộc; (b) `startMy2faSetup` cho phép khi 2FA đang bật **chỉ** nếu phiên hiện tại `amr = recovery_code` (còn lại vẫn 409) – sinh bí mật chờ, bí mật cũ chạy tới khi xác nhận; (c) `confirmMy2fa` trên đường này **thay** bí mật, sinh 10 mã mới (bộ cũ hết hiệu lực), thu hồi phiên khác, cấp phiên mới `amr = totp`, audit `security` `mfa.reenrolled`. Không operation mới, không cần OWN. Lý do: AC đúng về bảo mật (mã khôi phục đã dùng nghĩa là điện thoại cũ coi như mất), và ESC-027 B có một OWN – đường "nhờ OWN đặt lại" không dùng được cho chính OWN. Đã ghi mô tả `loginMfa`, `startMy2faSetup` trong `openapi.yaml`. **Việc**: BE-C (guard + nhánh confirm), FE-A (bỏ thông báo tạm G-FE-A-1, dùng màn đăng ký có sẵn với chữ "Đăng ký lại trên điện thoại mới" – UXD), QA (ca: vào bằng mã khôi phục → API khác 403; đăng ký lại → mã cũ + bộ khôi phục cũ hết hiệu lực; phiên `amr = totp` gọi setup → 409), SEC xem lại cùng Verified US-143 |
| 4 | SEC Blocker FB-R3-SEC-BE-B-07 + DOM BR-433 (d) v0.4.1 – cơ sở hạn mức được bảo vệ | **Chốt kỹ thuật** (chi tiết: `reviews/s1-ARC-on-BE-B.md` mục "Hướng dẫn sửa FB-07"; erd 4.15). Ba cột (`stay_night.reference_rate_vnd`, `folio_line.limit_ref_vnd` có CHECK bắt buộc với dòng `room`/`late_fee_as_night`, `folio.limit_basis_checkout_vnd` chụp lúc B18) gộp vào migration của BE-B (0080 nếu 2FA gộp trước). Một cổng nội bộ `FolioService.limitBasisVnd(tx, folioId, lineId \| null)` thay `nightRateBasis`/`folioNightBasisVnd` cho (a)(b)(c), BR-416, US-164. Không đổi hình dạng OpenAPI. Mô tả `requestFoc` (đoạn `nightRateBasis`) đổi thành "cơ sở hạn mức bảo vệ BR-433 (d)" ở lần sinh lại kế tiếp |

---

## 13. 0.3.8 bổ sung 2 và 3 (23–24/10/2026)

`info.version` giữ `0.3.8-draft`. Không thêm trường hay operation; chỉ nới điều kiện và đổi mô tả.

### 13.1 Bổ sung 2 (R3-Q51, đã commit `bea761f` + ORC)
- `getParameterHistory`: `current` không bắt buộc.
- Mã trường `ACCOUNT_NUMBER_NOT_ALLOWED`.
- Chi tiết: `reviews/s1-ARC-on-Q51.md`.

### 13.2 Bổ sung 3 – tiền dư sau trả phòng (FB-R3-ARC-FUZZ-01, BUG-R3-002; BR-522 K11-06, oracle I4)

| # | Điểm | Quyết định ARC |
|---|---|---|
| 1 | `createRefundRequest` trên folio `settled` | **Nhận folio `open` hoặc `settled`**, kể cả `settled` đã quá `post_checkout_window_until` mà J15 đang chờ (`waiting_refund`). Folio `closed` → 409 `FOLIO_LOCKED`; theo I4, folio `closed` không còn tiền dư. Giữ nguyên như folio `open`: vai FD+ (A43, `x-roles` không đổi, chỉ tạo yêu cầu, không đổi tiền), trần `unhandledCreditVnd` (422 `REFUND_EXCEEDS_APPROVED` + `max`), `reasonCode = overpayment`, người duyệt MGR+ khác người xin (SEC F8), nơi nhận qua `setRefundDestination` |
| 2 | Quy tắc K11-06 ở server | Thao tác **do người bấm** trên folio `settled` mà sau thao tác `unhandledCreditVnd` > 0 → `FolioService.closeStayCredit` **cùng giao dịch**, dưới L3 người gọi đã giữ: **một** yêu cầu hoàn `overpayment` bằng phần chưa yêu cầu, người xin = người thao tác, kèm "Cần chú ý" `closed_reservation_credit`. Yêu cầu hoàn đang mở > tiền dư → chạy lại `refundPlan` (hủy `superseded` + tạo lại – DOM-S4-14; gộp FB-R3-ARC-FUZZ-02). Áp cho `adjustFolioLine` (đã có, BUG-R3-002), `recordPayment`, `confirmPaymentReceived`. Ghi ở mô tả ba operation này |
| 3 | Đường **không** có người bấm (đối soát tự động, khách trả qua link, đồng bộ `ota_collect`) | Không tự tạo yêu cầu, vì `requested_by` phải là người thật. J15 giữ folio `settled` (`waiting_refund`) + "Cần chú ý" `closed_reservation_credit` (đã có). Nhân viên xử lý bằng điểm 1. Mục tự đóng khi tiền dư đã có yêu cầu hoàn đủ; J15 đóng folio ở lần chạy kế tiếp sau khi chi xong hoặc khách để lại tiền |
| 4 | Hình dạng | Không đổi request/response của operation nào. `openapi-meta`/`openapi-schemas` up to date; api-client sinh lại (chỉ JSDoc) |

**Việc BE-B** (một PR, review ARC + SEC, mã tiền):
- `refunds.service.ts` `create`: nhận folio `settled` (`closed` → `FOLIO_LOCKED`).
- `recordPayment` và `confirmPaymentReceived` (nhánh người bấm): sau khi ghi, nếu folio `settled` và `unhandledCreditVnd` > 0, hoặc `openRefundVnd` > `rawCreditVnd`, thì gọi `closeStayCredit`. Gom điều kiện này thành **một** hàm dùng chung với `folio-lines.service.ts`, ví dụ `FolioService.afterSettledMoneyChange(tx, folioId, actor)`, để không có hai định nghĩa.
- Test:
  - QR về muộn, dư sau trả phòng (người bấm xác nhận) → có yêu cầu hoàn đúng số;
  - khoản đối soát tự động dư → J15 `waiting_refund` + "Cần chú ý" → FD gọi `createRefundRequest` trên folio `settled` → MGR duyệt, chi → J15 đóng;
  - folio `closed` → 409;
  - A32 tăng làm tiền dư < yêu cầu đang mở → `refundPlan` hủy và tạo lại (FUZZ-02).

**Việc FE-A:** thao tác "Tạo yêu cầu hoàn" hiện cả trên folio `settled` (nhãn và chữ theo brand OTTIMO). Từ mục "Cần chú ý" `closed_reservation_credit` dẫn tới folio đó.

**Việc QA:** fuzz thêm thao tác "QR về muộn dư" và "đối soát tự động dư" vào các họ có trả phòng; I4 vẫn phải bằng 0.

**Kiểm đã chạy (24/10):**
- `openapi-spec-validator`: OK;
- `gen-openapi-meta --check`: up to date;
- api-client sinh lại, tsc đạt, vitest 30/30;
- `gen_rbac_cases --check`: OK;
- `gen_traceability --strict`: exit 0. `traceability.md` sinh lại có lệch không do thay đổi này, nên không đưa vào commit; QA sinh lại;
- api `contract` 5/5;
- prettier: xanh;
- Redocly không có trên máy, CI `contract-lint` chạy.
