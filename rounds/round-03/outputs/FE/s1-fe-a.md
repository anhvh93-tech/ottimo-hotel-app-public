# FE-A – Round 3 Sprint 1 – Bước Sản xuất (đợt 1)

- Người làm: FE-A | Ngày: 23/10/2026 | Nhánh worktree: `worktree-agent-aefb4922ed24dd839` (trên `8228f33`, OpenAPI 0.3.8-draft)
- Đầu vào: `sprint-1-plan.md` (dòng FE-A), ARC `s1-contracts.md` mục 1, 6.1, 10; SEC `s1-security-requirements.md` mục A, E; backlog US-143 AC1–AC4, R3-Q36/Q38; brand `00-brief/context/brand/brand-guidelines.md`.
- Phạm vi đợt này: (1) màn 2FA, (2) hộp S2 dùng chung, (3) test `useAfterLoginPath` (SEC E), (4) R3-Q36. Server chưa có (BE-C đang làm) → chạy trên MSW theo hợp đồng 0.3.8.

## 1. Đã làm

### 1.1 US-143 – đăng nhập hai bước, đăng ký bắt buộc, mã khôi phục
- **Bước 2 đăng nhập** (`pages/MfaStep.tsx`): `401 MFA_REQUIRED` + `mfaToken` → màn nhập mã. Một ô duy nhất (`one-time-code`), dán "123 456" được. "Mất điện thoại? Dùng mã khôi phục" chuyển sang ô mã khôi phục (JetBrains Mono, nhận chữ thường, có/không gạch). Mọi lỗi = một câu `error.MFA_INVALID` (SEC 06.20). Sau 5 lần sai hoặc 5 phút → tự về bước mật khẩu, kèm câu `mfa.step_expired`. `mfaToken` chỉ nằm trong state React (không storage, URL, log – SEC 06.17).
- **Đăng nhập bằng mã khôi phục** → mở màn "Xác thực 2 bước" với thông báo `mfa.recovery_used_title/body` và số mã còn lại (AC3 a).
- **Phiên hạn chế** (SEC 06.4, AC1): `Me.mfaEnrollmentRequired` hoặc bất kỳ `403 MFA_ENROLLMENT_REQUIRED` nào (bắt toàn cục trong `SessionProvider`) → route guard chuyển tới `/enroll-2fa`, giữ `from` để quay lại đúng trang sau khi xong. Màn có nút Đăng xuất.
- **Màn đăng ký** `/enroll-2fa` (`pages/Enroll2faPage.tsx`), 3 bước theo hi-fi 01-login 1.4:
  1. Cài ứng dụng.
  2. Mật khẩu → `startMy2faSetup` → QR vẽ tại chỗ (`QrCode` của `@ottimo/ui`, không dịch vụ ngoài) + khóa nhập tay nhóm 4 ký tự (JetBrains Mono) → mã đầu tiên → `confirmMy2fa`.
  3. 10 mã khôi phục hiện **một lần**: dạng 4-4-4-4, JetBrains Mono, tải `.txt` / In tạo ở client; ô bắt buộc "đã cất tách khỏi điện thoại" mới bật Hoàn tất. Bí mật và mã chỉ nằm trong state của màn – rời màn là mất, không vào Web Storage.
  - Xử lý lỗi: sai mật khẩu → lỗi dưới ô; mã sai (422) → `auth.totp.error`, xóa ô; 409 → đọc lại Me: đã bật → `mfa.already_on`, chưa → `mfa.qr_expired` (tạo QR mới). Sau confirm gọi lại `getMe` (CSRF mới – SEC 06.10).
  - `soleOwner` → câu `auth.enroll.single_owner` ở bước 3 và trên màn Xác thực 2 bước (AC3 c, ESC-027 B).
- **Màn "Xác thực 2 bước"** `/security` (menu người dùng, mọi vai): trạng thái, ngày bật, số mã còn; ≤ 3 mã → nhắc (SEC 06.15); "Tạo bộ mã mới" (S2); "Tắt xác thực 2 bước" chỉ cho vai không bắt buộc (S2) → đăng xuất vì server thu hồi mọi phiên; chưa bật → "Bật ngay".
- **Nhắc trên mọi màn** (SEC 06.3): `Me.mfaRequiredButMissing` hoặc `Me.recoveryCodesLow` → banner dưới thanh tiêu đề, "Để sau" ẩn trong phiên tab (cờ UI, bị xóa khi đăng xuất).

### 1.2 Hộp S2 dùng chung – `components/StrongReauthDialog.tsx`
- Mật khẩu + mã TOTP mới (hoặc mã khôi phục); người chưa bật 2FA (chỉ khi `MFA_ENFORCED = false`) chỉ mật khẩu.
- Gửi `StrongReauth` **trong** request của thao tác (ARC 1.2 – không token, không cửa sổ). Người gọi truyền `onConfirm(reauth)`.
- `REAUTH_FAILED` / `STRONG_REAUTH_REQUIRED` → một câu `reauth.s2_failed`, kèm `reauth.s2_wait_code` ("chờ mã mới"). Xóa cả hai ô sau mỗi lần thử và khi đóng hộp.
- `isStrongReauthError()` xuất ra cho các màn khác dùng.
- Đang dùng ở: tạo bộ mã mới, tắt 2FA. **Chưa** gắn vào các operation đã cài (xem mục 5).

### 1.3 SEC E – `useAfterLoginPath` không chuyển hướng ra ngoài
- `session/safePath.ts`:
  - `safeInternalPath` chỉ nhận đường bắt đầu bằng đúng một `/`;
  - từ chối `//`, `\`, `%5C`, ký tự điều khiển (thô hoặc mã hóa), scheme;
  - kiểm thêm sau `decodeURIComponent` và bằng `new URL` cùng origin.
- `navItemOf` khớp mục menu theo đoạn đường đầy đủ, nên `/overviewx` không còn khớp `/overview`.
- `afterLoginPath()` tách khỏi hook để test thuần.
- Test: 5 vector của SEC + 10 vector thêm → luôn về `homePath`; 5 vector chạy qua đăng nhập thật (MemoryRouter `state.from`) → về Hôm nay.

### 1.4 R3-Q36 (dùng R3-Q38) – `useBusinessDay` theo mốc 06:00
- **Nguồn**: `Me.properties[].businessDate` + `businessDayRollover`.
- **Cách tính ngày**: neo vào câu trả lời của server. Khi đồng hồ máy qua mốc thì cộng số ngày đã qua, nên đồng hồ máy lệch không đổi được ngày.
- **Khi nào tính lại**:
  - hẹn giờ tới mốc đổi ngày kế tiếp (`msUntilNextRollover`);
  - tab hiện lại (`visibilitychange`) → tính lại và đọc lại `getMe`, tối đa 1 lần/phút.
- **Server chưa trả trường** → giữ nhánh R2 (`getBookingRules` / `getRack`). MSW đã trả trường; cờ test `meBusinessDate=false` giả server cũ.

### 1.5 api-client, mock, chuỗi
- **api-client** (`endpoints.ts`, `types.ts`): thêm `loginMfa`, `getMy2fa`, `startMy2faSetup`, `confirmMy2fa`, `regenerateMyRecoveryCodes`, `disableMy2fa`, `resetUser2fa` và các kiểu `StrongReauth`, `My2fa`… Không gửi `Idempotency-Key` ở setup/confirm/mã khôi phục (SEC 06.9).
- **MSW** (`mocks/handlers.ts`, `mocks/totp.ts`):
  - TOTP RFC 6238 (Web Crypto), ±1 bước, chống phát lại theo bước;
  - `mfaToken` dùng một lần, 5 phút, 5 lần sai; mã khôi phục 16 ký tự Crockford, dùng một lần;
  - guard phiên hạn chế; S2 (`strongReauth`): 422 khi thiếu yếu tố, 401 khi sai;
  - cờ `mfaEnforced` (mặc định `false` như dev/CI); `Me.businessDate`/`businessDayRollover`;
  - `mockControl.enableMfa()` cho test.
- **Chuỗi**: nhóm mới "R3 Sprint 1 – FE-A" trong `design/tools/gen_strings.py`, 37 khóa VI/EN, sinh lại `copy/strings-*.json` – **chờ UXD duyệt**.
  - Giọng OTTIMO: ngắn, điềm tĩnh, không emoji, không nêu số lần thử còn lại.
  - Sửa `auth.code_label.recovery` "8 ký tự" → "16 ký tự" theo hợp đồng 0.3.8, kèm dòng tương ứng trong hi-fi `01-login.html` để `check_hifi.py` xanh.
- **Brand**:
  - không thêm màu: chỉ dùng class/tokens DS hiện có (`alert`, `chip`, `progress-steps`, `code-input`, `quote-text`, `mono`);
  - JetBrains Mono cho mã khôi phục, khóa nhập tay, ô mã;
  - bản in dùng Ink #2B2B28 trên nền trắng.

## 2. Kiểm thử
- Test mới `apps/admin-web/src/__tests__/r3-s1-fea.test.tsx`, 37 ca:

  | Nhóm | Số ca | Ca kiểm |
  |---|---|---|
  | SEC E | 22 | 15 vector + đường hợp lệ + 5 lần đăng nhập thật |
  | Bước 2 | 4 | – |
  | Đăng ký | 4 | Gồm 403 phiên hạn chế, QR hết hạn, banner nhắc |
  | S2 + màn Xác thực 2 bước | 5 | – |
  | R3-Q36 | 3 | Hẹn giờ qua 06:00 khi đang mở form; tab hiện lại sau mốc → đổi ngày + đọc lại Me |

- `s4-211-fea`: ca maintenance tách làm hai.
  - Server cũ → vẫn đọc `Rack.today`.
  - R3-Q38 → không gọi rack/booking-rules.
- Kết quả:

  | Gói / kiểm tra | Kết quả |
  |---|---|
  | admin-web | **529/529** (trước 489) |
  | api-client | 30/30 |
  | i18n | 19/19 |
  | mobile | 122/122 |
  | `tsc` admin-web, guest-web, mobile, api-client, i18n, ui | 0 lỗi |
  | eslint (admin-web, api-client) | xanh |
  | prettier | xanh |
  | `check_hifi.py` | xanh |

- SEC A.7 phần FE có ca trên MSW:
  - đã có: #1 (không phiên trước bước 2), #7 (một câu lỗi), #8 (mã khôi phục dùng một lần), #9 (phiên hạn chế), #10 (tắt 2FA vai tự nguyện), #12 (không lưu token/bí mật/mã ở trình duyệt);
  - **chưa có**: #16 E2E Playwright – chờ server BE-C.

## 3. Giả định
- **G-FE-A-1**: sau khi đăng nhập bằng mã khôi phục, AC3 (a) đòi "buộc thiết lập lại 2FA trên thiết bị mới". Hợp đồng 0.3.8 không cho làm việc này khi 2FA đang bật: `startMy2faSetup` trả 409, vai bắt buộc không được tắt.
  - Desk tạm hiện thông báo, hướng dẫn tạo bộ mã mới và nhờ OWN đặt lại (`resetUser2fa`).
  - **Hỏi ARC (Q1)** – xem mục 4.
- **G-FE-A-2**: `confirmMy2fa` sai mã trả 422 với mã trường bất kỳ; Desk chỉ dựa vào `VALIDATION_FAILED`.
- **G-FE-A-3**: mã khôi phục server trả 16 ký tự liền, Desk tự hiện 4-4-4-4. Nếu server trả sẵn có gạch thì Desk hiện nguyên.
- **G-FE-A-4**: câu AC3 (c) dùng khóa `auth.enroll.single_owner` mà hợp đồng chỉ định. Chữ khác đôi chút với câu trong backlog – UXD chốt.
- **G-FE-A-5**: banner nhắc 2FA đặt dưới thanh tiêu đề. Chờ UXD chốt vị trí trong hi-fi R3.

## 4. Câu hỏi cho vai khác (không phải ESC)
- **ARC Q1**: sau khi đăng nhập bằng mã khôi phục, có cần operation "đăng ký lại TOTP khi đang bật" không (ví dụ `startMy2faSetup` nhận S2 khi `mfa_enabled = true`, thay bí mật)? Hay giữ đường "OWN đặt lại" và PO sửa chữ AC3 (a)?
- **BE-C**:
  - `Me.properties[].businessDate` – Desk đã dùng, chỉ cần server điền;
  - `mfaToken` trong `Problem` của `401 MFA_REQUIRED` đúng tên trường;
  - `confirmMy2fa` 409 khi bí mật chờ hết hạn.
- **UXD**:
  - duyệt 37 chuỗi nhóm "R3 Sprint 1 – FE-A" và chữ sửa `auth.code_label.recovery`;
  - đưa màn bước 2, đăng ký, mã khôi phục, Xác thực 2 bước, hộp S2, banner nhắc vào hi-fi R3. Các chỗ chờ đánh dấu `[CHỜ UXD]` trong mã.

## 5. Việc còn lại (FE-A Sprint 1)
- **CỔNG S2 trên operation đã cài** (ARC 1.2 – BE-C và FE cùng PR):
  - các operation: `createUser`, `updateUser`, `setUserRoles`, `revokeTrustedDevice`, `trustCurrentDevice`, `changeMyPassword` (`totpCode`/`recoveryCode`), `setParameter`;
  - làm khi nhánh BE-C sẵn;
  - hộp `StrongReauthDialog` đã sẵn sàng để gắn.
- `resetUser2fa` trên S26: OWN đặt lại 2FA cho người khác. Vai FE-B/US-008 – đã có endpoint; xác nhận ai làm.
- R3-Q51 màn tài khoản nhận VietQR (sau `StrongReauthService`), US-164 phía Desk + màn duyệt trên điện thoại, R3-Q01 UI, R3-Q39 #8–#12.
- E2E Playwright SEC A.7 #16 khi server US-143 có trên stack CI.
- SEC E "quy tắc lint/review: không `navigate()` tới chuỗi lấy từ query/hash": đã ghi trong chú thích `safeInternalPath`. Quy tắc eslint tự động chưa thêm – đề xuất làm cùng S4-16 toolchain.

## 6. File tạo/sửa
- **Mới**:
  - `product/apps/admin-web/src/pages/MfaStep.tsx`
  - `product/apps/admin-web/src/pages/Enroll2faPage.tsx`
  - `product/apps/admin-web/src/pages/SecurityPage.tsx`
  - `product/apps/admin-web/src/components/StrongReauthDialog.tsx`
  - `product/apps/admin-web/src/components/RecoveryCodes.tsx`
  - `product/apps/admin-web/src/session/safePath.ts`
  - `product/apps/admin-web/src/mocks/totp.ts`
  - `product/apps/admin-web/src/__tests__/r3-s1-fea.test.tsx`
- **Sửa**:
  - `product/apps/admin-web/src/pages/LoginPage.tsx`
  - `product/apps/admin-web/src/session/SessionProvider.tsx`
  - `product/apps/admin-web/src/app/routes.tsx`
  - `product/apps/admin-web/src/app/businessDay.ts`
  - `product/apps/admin-web/src/app/dates.ts`
  - `product/apps/admin-web/src/components/AppShell.tsx`
  - `product/apps/admin-web/src/components/UserMenu.tsx`
  - `product/apps/admin-web/src/mocks/handlers.ts`
  - `product/apps/admin-web/src/mocks/seed.ts`
  - `product/apps/admin-web/src/__tests__/s4-211-fea.test.tsx`
  - `product/packages/api-client/src/endpoints.ts`
  - `product/packages/api-client/src/types.ts`
  - `product/design/tools/gen_strings.py` và các tệp sinh ra: `copy/strings-vi.json`, `copy/strings-en.json`, `tools/strings-tables.md`, `wireframes/assets/strings.js`
  - `product/design/hifi/01-login.html` (một nhãn)
  - `01-decisions/decision-log.md`

## 7. Phản hồi & sửa (23/10)

Theo SEC `s1-SEC-on-2FA.md` và ARC mục 12.3. Chi tiết ở `rounds/round-03/responses/s1-FE-A.md`.

- **FEA-01**: S2 gắn vào `updateUser` (status/resetPassword), `setUserRoles` (nâng lên owner/manager), `revokeTrustedDevice` bằng hộp dùng chung; `trustCurrentDevice`, `changeMyPassword` có ô mã riêng (`SecondFactorField`); `createUser` có endpoint (màn là của FE-B); MSW trả 422 `STRONG_REAUTH_REQUIRED` như server.
- **G-FE-A-1 (mục 3) bỏ**: đăng nhập bằng mã khôi phục → phiên hạn chế → đăng ký lại trên màn `/enroll-2fa` ("Đăng ký lại trên điện thoại mới", chờ UXD).
- **Kiểm**: admin-web 535/535.
