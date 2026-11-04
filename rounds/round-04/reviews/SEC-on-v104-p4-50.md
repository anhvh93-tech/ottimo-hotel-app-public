# SEC review code P4-50 – đăng nhập 2 bước trên app nhân viên (`v104/mob-2fa`)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/mob-2fa` @ `59e73cd4` (tác giả MOB, ARC-RN103-02 + BUG-R3-052), so với merge-base `3a4fb411`. Đối chiếu `origin/main` @ `7b5b6117`.
- Trọng tâm theo ORC:
  - lưu khóa/secret;
  - recovery code không ghi log;
  - chống brute-force;
  - kho bảo mật của thiết bị.
- Đã đọc:
  - `apps/mobile/src/pages/{LoginPage,MfaStepPage,SetPasswordPage,EnrollOnDeskPage}.tsx`;
  - `src/App.tsx`, `src/app/{api,config,notifications}.ts(x)`, `src/queue/queue.ts`, `src/data/cache.ts`;
  - `src/main.tsx`, `src/mocks/handlers.ts`, `README.md`;
  - `rounds/round-04/outputs/MOB/v1.0.4-P4-50.md`;
  - phía server, `identity/internal/auth.service.ts` (`login`, `loginMfa`) trên `main`.
- Đã chạy (worktree tạm, không đẩy gì):
  - `vitest run` app mobile: **13 tệp, 160 test xanh**;
  - `vite build` bản production, rồi quét `dist/`: **không** có `MOCK_PASSWORD`, `MOCK_RECOVERY_CODE` hay mã mock nào. Mock chỉ nạp khi `import.meta.env.DEV && apiMode() === 'mock'`.
- Không sửa mã, không sửa decision-log. Không có dữ liệu thật hay khóa thật trong tệp này.

---

## 0. Kết luận

**ĐẠT.** Không có Blocker hay Major. Merge được.

- **Không có secret nào nằm trên điện thoại:**
  - app không bật 2 bước (bật trên Desk, QR quét bằng chính điện thoại), nên không có TOTP secret;
  - không hiện hay lưu 10 mã khôi phục;
  - `mfaToken`, mã 6 số, mã khôi phục, mật khẩu chỉ nằm trong state React. Không vào IndexedDB, Cache, URL, log hay hàng đợi offline.
- Câu hỏi "kho bảo mật của thiết bị" (Keychain/Keystore) **không áp dụng** cho bản PWA này: không có gì cần cất. Nếu sau này app native lưu token hay secret thì phải dùng Keychain/Keystore (SR-PWA, MASVS-STORAGE). Mục 3 ghi điều này thành ràng buộc.
- Chống brute-force do **máy chủ** làm (đã có trên `main`):
  - token 5 phút, dùng một lần, gắn với `client_origin`;
  - 5 lần sai thì token chết;
  - lần sai bước 2 cũng tính vào bộ đếm khóa tài khoản (`registerFailure`), khóa thì có cảnh báo `mfa.locked`;
  - giới hạn theo IP.
  - Bộ đếm 5 lần và hạn 5 phút ở app chỉ để báo đúng lúc. Phía máy chủ không dựa vào chúng.
- Mọi lần sai là một câu `MFA_INVALID`, không lộ "sai mã nào".
- 2 thẻ Minor, 1 Suggestion. Không chặn merge.
- **Điều kiện trước khi phát hành** (không phải trước merge): QA chạy trên staging, với BE thật, 3 ca ở mục 4. MOB mới thử bằng mock.

---

## 1. Kiểm theo trọng tâm

| # | Điểm kiểm | Kết quả | Bằng chứng |
|---|---|---|---|
| S1 | Lưu secret/khóa | Đạt | Không có luồng bật 2 bước trên app (`EnrollOnDeskPage` chỉ dẫn sang Desk). Không có mã nào ghi `mfaToken` hay mã vào `KvStore`, `cache` hay `queue`. `loginMfa`, `changeMyPassword` gọi `local: true`, không qua hàng đợi offline. CSRF vẫn chỉ trong bộ nhớ (SR-PWA-07) |
| S2 | Mã khôi phục / TOTP không vào log | Đạt | Mã nguồn mobile và `api-client` không có `console.*` hay telemetry. `ApiError` chỉ giữ problem của **phản hồi**, không giữ body yêu cầu. Mã sai thì ô được xóa (`setCode('')`). Đăng nhập xong thì component bị gỡ |
| S3 | `mfaToken` | Đạt | Lấy từ `err.problem.mfaToken` của `401 MFA_REQUIRED`, giữ trong state `LoginPage`. Quay lại bước 1 thì token bỏ (`setMfaToken(null)`). Mật khẩu xóa khỏi ô ngay khi sang bước 2 |
| S4 | Brute-force | Đạt (máy chủ) | `auth.service.ts`: `MFA_TOKEN_TTL_MS = 5 phút`, `MFA_TOKEN_MAX_FAILURES = 5`, `used_at`, so `client_origin`, `registerFailure` theo `login_lockout`, `limiter.consume('login:ip:…')`. App: mã sai dạng bị chặn trên máy, không gửi, và máy chủ trả 422 không tính lượt. 429 báo "chờ … phút", không báo "sai mã" |
| S5 | Một câu cho mọi lần sai (SEC 06.20) | Đạt | `MFA_INVALID` và `VALIDATION_FAILED` cùng `error.MFA_INVALID`. Ở đổi mật khẩu có 2 bước: `REAUTH_FAILED` là một câu `reauth.s2_failed` cho cả mật khẩu lẫn mã |
| S6 | Mạng yếu: không gửi lại mã đã dùng | Đạt | Mất câu trả lời thì "Thử lại" gọi `getMe` trước. Đã có phiên thì vào luôn, không gửi lại mã dùng một lần. Đổi mật khẩu mà gặp 401 (phiên cũ đã bị thu hồi vì lần trước có thể đã thành công) thì về đăng nhập, không lặp lại |
| S7 | Phiên hạn chế (BUG-R3-052) | Đạt, có Minor | Không lưu `Me` của phiên hạn chế. Hàng đợi gặp 403 `PASSWORD_CHANGE_REQUIRED`/`MFA_ENROLLMENT_REQUIRED` thì **tạm dừng** như 401, không bỏ thao tác. Vào bằng mã khôi phục thì máy chủ cấp phiên chỉ để bật lại 2 bước (`enrollmentOnly`), app dẫn sang Desk. Còn hở: hồ sơ cũ trong cache, xem thẻ 01 |
| S8 | Link Desk | Đạt | `deskUrl()` suy từ `location.hostname` của chính app (`staff.<miền>` → `https://desk.<miền>/`), không nhận tham số ngoài. Luôn `https`. `target="_blank" rel="noopener noreferrer"`. Localhost không hiện link |
| S9 | Mật khẩu | Đạt | `type="password"`, `autoComplete="current-password"`/`"new-password"`. Mật khẩu hiện tại và mã bị xóa ngay khi đổi xong. Mật khẩu mới chỉ còn trong state tới lúc đọc `getMe` |
| S10 | Mock/test | Đạt | `MOCK_PASSWORD = 'change_me_mock_dev_only'`, `MOCK_TOTP`, `MOCK_RECOVERY_CODE` là giá trị giả, rõ chữ "mock". Không có trong bản production (đã quét `dist/`). Tài khoản mock là tên vai, không có email |
| S11 | Thông báo `mfa.locked` | Đạt | Hiện câu chung `staff.notif.sec.other_*`, không hiện mã thô |

---

## 2. Thẻ feedback

### FB-R4-SEC-MOB-P450-01
- Mức độ: Minor
- Vị trí: `apps/mobile/src/App.tsx` `enter()` (`if (!offline && !restriction) await cache.saveMe(me)`), cùng đường khởi động offline (`cache.loadMe()` → `enter(cached, true)`).
- Vấn đề: phiên hạn chế không **ghi** `Me` mới, nhưng cũng **không xóa** bản `Me` đầy đủ đã cache từ lần đăng nhập trước của cùng người. Ví dụ: buồng phòng vừa vào bằng mã khôi phục, hoặc vừa bị OWN đặt mật khẩu tạm. Lần sau mở app khi mất mạng, app lấy hồ sơ cũ và vào thẳng màn **Việc**: đọc dữ liệu cache và xếp được thao tác, bỏ qua màn "Đặt mật khẩu" / "Bật 2 bước". Có mạng lại thì máy chủ chặn (403, hàng đợi dừng), nên không có thao tác nào vượt quyền tới máy chủ.
- Vì sao quan trọng: phiên hạn chế có nghĩa là "chưa đủ điều kiện dùng app". Dữ liệu lộ ra chỉ là bản cache của chính người đó trên máy của họ, nên rủi ro thấp. Nhưng hành vi lệch với ý của BUG-R3-052 và SEC 06.4.
- Đề xuất sửa: khi `restriction` có giá trị, xóa `snapshot/me` (thêm `cache.clearMe()` hoặc `store.delete('snapshot','me')`). Thêm test: đăng nhập `hk.temp`, tắt mạng, mở lại app thì ra màn đăng nhập hoặc màn hạn chế, không ra **Việc**.
- Trạng thái: Open

### FB-R4-SEC-MOB-P450-02
- Mức độ: Minor
- Vị trí: `rounds/round-04/outputs/MOB/v1.0.4-P4-50.md` mục 2 và 7 (chỉ thử bằng mock).
- Vấn đề: mock (`handlers.ts`) mô phỏng 5 lần sai, hạn 5 phút, một lần dùng. Nhưng phía thật có thêm 3 thứ mock không có:
  - `client_origin` (token cấp ở `staff.` phải được nhận ở `staff.`);
  - bộ đếm khóa tài khoản;
  - cảnh báo `mfa.locked`.
- Vì sao quan trọng: `client_origin` lệch thì mọi lần nhập mã trên app đều bị trả `MFA_INVALID`. Nhân viên có 2 bước sẽ không vào được app, mà câu báo lại là "sai mã".
- Đề xuất sửa: QA thêm 3 ca staging vào kế hoạch P4-50 (mục 4). MOB ghi kết quả vào báo cáo khi có.
- Trạng thái: Open

### FB-R4-SEC-MOB-P450-03
- Mức độ: Suggestion
- Vị trí: `MfaStepPage.tsx` và `SetPasswordPage.tsx`, ô mã khi ở chế độ **mã khôi phục** (`autoComplete="one-time-code"`).
- Vấn đề: mã khôi phục không phải mã một lần gửi qua SMS. Một số trình duyệt (Firefox, một số WebView Android) có thể lưu giá trị vào lịch sử điền form khi token `autocomplete` không phải `off`.
- Vì sao quan trọng: rủi ro thấp, vì mã dùng một lần và đã dùng thì hết giá trị. Nhưng một mã gõ rồi gặp mạng lỗi, chưa dùng, có thể bị gợi ý lại trên máy dùng chung.
- Đề xuất sửa: `autoComplete={totp ? 'one-time-code' : 'off'}`. Giữ `spellCheck={false}`, `autoCorrect="off"` như hiện tại.
- Trạng thái: Open

---

## 3. Ràng buộc ghi lại cho bản native sau này (không phải thẻ)
- Nếu app nhân viên thành app native (Expo/React Native) và có lưu phiên, refresh token hay khóa thiết bị, thì bắt buộc dùng **Keychain (iOS) / Keystore (Android)** qua `expo-secure-store` hoặc tương đương. Không dùng AsyncStorage hay tệp thường.
- Không bật 2 bước trên chính điện thoại nhận mã. Giữ cách hiện tại: QR trên Desk.
- Mã khôi phục không bao giờ lưu trên máy. Mỗi lần cần thì người dùng gõ.

## 4. Ca QA staging (điều kiện phát hành, theo thẻ 02)
1. Tài khoản thử có 2 bước, đăng nhập trên `staff.` (staging) bằng mã TOTP đúng: vào được. Đây là ca kiểm `client_origin`.
2. Nhập sai 5 lần trên một token: app tự về bước 1. Lặp lại tới ngưỡng `login_lockout`: lần sau trả 429, OWN nhận `mfa.locked` trên Desk/PWA, câu hiện ra là câu chung.
3. Đăng nhập bằng một mã khôi phục thử: ra màn "Bật xác thực 2 bước", mọi màn khác bị chặn. Hàng đợi offline giữ nguyên, không vào "Cần xem lại".

Chỉ dùng tài khoản thử và mã thử của staging. Không ghi mã hay ảnh có mã vào repo.

## 5. Điểm làm tốt
- Đường "mất câu trả lời → `getMe` trước khi gửi lại" giải đúng chỗ khó nhất của mã dùng một lần trên mạng yếu.
- Phiên hạn chế dừng hàng đợi như 401, không đẩy thao tác của buồng phòng vào "Cần xem lại".
- Hạn 5 phút tính theo mốc giờ, có kiểm khi app trở lại màn hình, nên máy ngủ không kéo dài hạn.
