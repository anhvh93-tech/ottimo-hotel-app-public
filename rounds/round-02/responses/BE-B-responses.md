# BE-B – phản hồi thẻ Round 2, Sprint 1 (vòng sửa sau review)

- Vai: BE (luồng BE-B: identity, platform, guests, seed, migration `_be_b`) | Ngày: 16/10/2026 | Không commit
- Đầu vào: `reviews/ARC-on-BE.md`, `reviews/SEC-on-BE.md`, `reviews/QA-on-BE.md`, `qa/bug-list.md`, `outputs/SEC/s1-decisions.md`, `outputs/ARC/s1-fix.md` (OpenAPI 0.3.4-draft)
- Thẻ thuộc BE-A (approvals, audit, guard, UoW) trả lời ở `BE-A-responses.md`; dưới đây chỉ ghi phần BE-B và các thẻ dùng chung.

## 1. Thẻ ARC-on-BE

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-ARC-BE-02 | Done (phần identity) | `PasswordReauth` là bản duy nhất (BE-A đã xóa `approvals/internal/reauth.ts` và tiêm bản này); lỗi chuẩn `401 REAUTH_FAILED` + `errors[{field, code: REAUTH_FAILED}]` giữ nguyên |
| FB-R2-ARC-BE-03 | Done | `auth.service.ts registerFailure`: `UPDATE app_user SET failed_login_count = failed_login_count + 1 … RETURNING` (khóa dòng tới COMMIT) → quyết định khóa trên giá trị vừa trả; nhánh "đã bị request song song khóa" trả 429; đăng nhập đúng kiểm lại khóa bằng `UPDATE … WHERE locked_until IS NULL OR <= now RETURNING`. Test `be-b-review-fixes.test.ts`: 10 lần sai `Promise.all` → 5×401 + 5×429, lần đúng tiếp theo 429, đúng 1 dòng `auth.account_locked`. SEC đã chấp nhận 429 khi đang khóa (SR-AUTH-04) |
| FB-R2-ARC-BE-05 | Done | Migration `0009_identity_hardening_be_b`: `auth_resolve_session` trả thêm `client_origin, last_active_at, must_change_password`; guard gắn `principal.session`; `SessionPolicyInterceptor` không còn truy vấn – chỉ UPDATE trượt `idle_expires_at` tối đa 1 lần/phút/phiên, kiểm `PASSWORD_CHANGE_REQUIRED` từ dữ liệu guard. Thống nhất với BE-A: BE-B làm (sửa nhỏ phần `authenticate()` của guard) |
| FB-R2-ARC-BE-07 | Done | Cảnh báo BR-952 dùng `g.name_search % $4` (`pg_trgm.similarity_threshold = 0.3` cục bộ giao dịch) + lọc `namesLookAlike`; chạy **khi tạo/sửa** và lưu cờ `possible_duplicate_at` cho cả hai hồ sơ; `getGuest` chỉ tính lại danh sách khi hồ sơ có cờ. EXPLAIN ANALYZE trên 50.000 hồ sơ giả (DB `ottimo_test_beb`, giao dịch ROLLBACK): nhánh có ngày sinh 0,04 ms (`guest_dob_idx`); nhánh thiếu ngày sinh 58 ms (planner chọn seq scan vì dữ liệu giả có 2.179 tên gần giống) – nay chỉ chạy lúc ghi, không ở mỗi lần xem |
| FB-R2-ARC-BE-10 | Done | `parameter-rules.ts`: `foc_limits` (đủ 3 vai, mỗi vai đúng một trong `perTimeVnd` 0–100.000.000 / `perTime ∈ {unlimited, one_night_rate}`, `perMonthVnd` hoặc `perMonth: unlimited`, không khóa lạ, FDL ≤ quản lý), `foc_self_apply.front_desk.per_time/per_month` (0–100.000.000, lần ≤ tháng), `.categories`, `foc_approval_push_roles` (`lowest_sufficient_role_plus_manager` hoặc danh sách vai duyệt) → 422 `PARAM_OUT_OF_RANGE`. Test 5 dạng sai + 1 đúng |
| FB-R2-ARC-BE-11 | Done | `IdentityParamsService` đọc `session_policy`/`login_lockout` theo **ngày nghiệp vụ của từng cơ sở** (`PropertyContextService.now(tx).today`); bỏ mọi `localDate(now, 'UTC')` trong identity |
| FB-R2-ARC-BE-12 | Done (b) | (a) BE-A làm. (b) `config.ts parseAllowedOrigins` trả thêm `admin`, `staffPwa` (cùng giá trị đã kiểm https); `main.ts` truyền vào `IdentityOptions` – identity không còn đọc `ADMIN_BASE_URL/STAFF_BASE_URL` thô. `config.test.ts` cập nhật |
| FB-R2-ARC-BE-14 | Done | `screens.ts`: MGR bỏ `S26` (nguyên tắc Q8 ghi ở đầu tệp); unit test `screensFor(['manager'])` không có S26. Chưa rà ô ◐ khác ngoài S26 (ARC chỉ nêu S26) |
| FB-R2-ARC-BE-15 | Done (1–3) | (1) 2 `createGuest` cùng SĐT song song → đúng 1×201 + 1×409; (2) 2 OWN hạ vai owner của nhau song song → đúng 1 thành công, còn đúng 1 owner; (3) đăng nhập sai song song (thẻ 03). (4) thuộc BE-A |
| FB-R2-ARC-BE-17 | Done | (1) Q1: test CTV tra email khách của SAL → `{matches: [], match: possible_duplicate}`, FD không nhận `match`; (2) Q6: `bedSetup` (trim, ≤ 100, V-09), `bedCount` 1–10, `areaM2` ≥ 1 ở `createRoom`/`updateRoom` (`null` = xóa)/`listRooms`, audit allowlist `room`; (3) Q7: migration `0008_guest_possible_duplicate_be_b` + `GuestSummary.possibleDuplicate` (serializer ẩn với SAL/CTV); `lastStayDate` Sprint 2; (4) Q4 giữ hình dạng `REAUTH_FAILED` |
| FB-R2-ARC-BE-18 | Done một phần | `createRoom`: `23505` chỉ ánh xạ `roomNo DUPLICATE` khi ràng buộc là `room_property_room_no_key`. Dời Sprint 2: dùng `parseLimit/decodeCursor` (con trỏ mờ) và `assertVersion` ở guests/rooms – làm cùng reservations để không đổi định dạng con trỏ 2 lần |
| FB-R2-ARC-BE-01, 04, 06, 08, 09, 13, 16, 19 | – | Thuộc BE-A (xem `BE-A-responses.md`) |

## 2. Thẻ SEC-on-BE

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-SEC-BE-04 | Done | = ARC-BE-03 (bộ đếm nguyên tử + test song song 10 yêu cầu) |
| FB-R2-SEC-BE-05 | Done | Khóa tạm chỉ đặt `locked_until` (status vẫn `active`); khóa cứng `status=locked`; **không** thu hồi phiên, không tăng `roles_version`; guard chỉ từ chối phiên khi `user_status = disabled`. `listUsers` hiện `locked` cho khóa tạm, `updateUser status=active` mở khóa. Test: phiên đang mở vẫn 200 sau 5 lần sai (khóa tạm) và khi khóa cứng. Chưa có đẩy cảnh báo OWN "≥ 3 khóa/giờ" (SR-LOG-06) – audit `auth.account_locked/hard_locked` đã ghi; cảnh báo làm cùng job cảnh báo Sprint 4 |
| FB-R2-SEC-BE-07 | Done | `resetPassword`/`status` yêu cầu người gọi sở hữu **mọi** cơ sở người đích có vai → không thì 403 `FORBIDDEN_ACTION` + `access.denied` (lý do `OTHER_PROPERTY`, ghi sau rollback); `displayName` vẫn sửa được. Test người có vai ở 2 cơ sở |
| FB-R2-SEC-BE-08 | Done một phần – **cần người tải SecLists** | Cơ chế đủ: tệp offline `identity/public/common-passwords.txt` nạp 1 lần vào `Set`, chuẩn hóa NFKC/chữ thường/trim; từ chối khi (a) có trong danh sách, (b) bỏ số/ký tự cuối ra từ có trong danh sách hoặc từ gốc nguồn B (`Dalat123456!`), (c) chỉ còn chữ là rỗng/từ gốc (`12345678abc`, `1234567890`), (d) chứa tên đăng nhập/`ottimo`; `common-passwords.SOURCE.md` (nguồn, giấy phép, lệnh tái lập, SHA-256); script `scripts/build-common-passwords.mjs`; build copy vào `dist`; staging/production **dừng khởi động** khi < 10.000 dòng (`CommonPasswordListCheck`). Tệp hiện **9.684 dòng chỉ từ nguồn B** – BE không được phép tự tải tệp Internet, nên chưa nhập SecLists. Việc: OPS/INV tải 2 tệp SecLists, chạy script `--seclists …`, ghi commit + SHA vào SOURCE.md. **Tới lúc đó staging/production không khởi động được** (đúng yêu cầu SEC). Test: ví dụ SR-AUTH-02, NFKC, SHA-256 khớp SOURCE.md, kiểm khởi động |
| FB-R2-SEC-BE-09 | Done | SAL/CTV: `createGuest`/`updateGuest` có SĐT/email tính vào cùng bộ đếm 30/giờ với tìm/tra cứu; 409 trùng hồ sơ ngoài phạm vi → `audit_event access guest.lookup` (`by` = tên ô, không giá trị), ghi sau rollback. Test: CTV tạo 31 hồ sơ → lần 31 = 429; CTV trùng hồ sơ SAL → 409 không id + 1 dòng audit không chứa SĐT |
| FB-R2-SEC-BE-10 | Done | Migration 0009: mọi hàm SECURITY DEFINER trong `public` → `search_path = pg_catalog, public, pg_temp`; `auth_resolve_session` mới ghi rõ `public.`. Test kiến trúc: mọi hàm `prosecdef` kết thúc bằng `pg_temp`. Không thu hồi `TEMPORARY` của `ottimo_app` (chưa kiểm hết nhu cầu pg-boss) – OPS cân nhắc |
| FB-R2-SEC-BE-11 | Done (tối thiểu) | Nhánh tên không tồn tại chạy thêm 3 giao dịch cùng hình dạng (vai/tham số/ghi lỗi) ngoài argon2. Chưa có test đo trung vị (dễ chập chờn trên CI) – đề nghị QA đo ở hiệu năng R3 |
| FB-R2-SEC-BE-12 | Done | Guard (BE-A) chỉ nhận origin nhân viên cho `login`; `auth.service`: origin `unknown` khi đã cấu hình → 403 (không còn mặc định `admin`). Test origin khách → 403 |
| FB-R2-SEC-BE-14 | Done | R2 giữ bộ đếm RAM (1 replica – ghi trong `rate-limiter.ts` và decision-log); lần từ chối đầu tiên mỗi cửa sổ của một IP ghi `audit_event security auth.ip_rate_limited` vào tổ chức của tên đăng nhập đã thử (không có → log ứng dụng). Bảng `rate_limit_counter` dời R3 (trước GL) |
| FB-R2-SEC-BE-15 | Done | `updateUser` chính mình + `resetPassword`/`status` → 422 `NOT_ALLOWED_FOR_SELF` (ARC cần thêm mã này vào bảng mã trường) |
| FB-R2-SEC-BE-20 | Done | Theo ARC 0.3.4: áp giá trị **chặt nhất** trong các cơ sở người dùng có vai (idle/max nhỏ nhất; `maxFailures`, `hardLockAfterLocks` nhỏ nhất; `lockMinutes`, `lockWindowHours` lớn nhất). Test: người có vai ở 2 cơ sở, cơ sở 2 đặt admin 10 phút/4 giờ → phiên mới 10 phút/4 giờ |
| FB-R2-SEC-BE-19 | Deferred | 2FA R3 – ghi chú TODO trong `auth.service.ts` theo đề xuất |
| FB-R2-SEC-BE-06, 13, 17, 18 | – | Thuộc BE-A |
| FB-R2-SEC-BE-16 | – | ARC đã gắn `x-visible-to` FD+ cho `Guest.gender`; serializer áp sau khi sinh lại meta |
| SEC s1-decisions mục 1 | Done | Migration 0009: `session_policy`, `login_lockout` `is_security = true`, `value_schema = security`, `bounds` = khai báo `x-security-parameters` (bỏ `default/ref/description`); `parameter-rules.ts` chỉ còn ràng buộc chéo `idleMinutes ≤ maxHours × 60` (lỗi tại `value.<kênh>.idleMinutes`). Test kiến trúc so khóa bảo mật bỏ `description` khi so `bounds` (ARC đồng ý) |

## 3. Thẻ QA-on-BE và bug-list

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-QA-BE-01 / BUG-R2-005 | Done | Gốc ở guard (BE-A sửa). Phần BE-B: test 9 operation có Idempotency-Key của BE-B (`createUser`, `updateUser`, `setUserRoles`, `createRoom`, `updateRoom`, `trustCurrentDevice`, `revokeTrustedDevice`, `createGuest`, `updateGuest`) với vai bị cấm + body rỗng/sai mật khẩu → 403 `FORBIDDEN_ACTION` + `access.denied` theo phiên |
| FB-R2-QA-BE-02 / BUG-R2-007 | Done | `hold_hours_default` phải ∈ `hold_hours_options` (36 → 422 `PARAM_OUT_OF_RANGE` + `allowed: [12, 24, 48]`); đổi `hold_hours_options` phải còn chứa mặc định hiện hành tại ngày hiệu lực |
| FB-R2-QA-BE-03 / BUG-R2-008 | Done | Sau 0.3.4: `match: possible_duplicate` cho SAL/CTV (test tầng A) |
| FB-R2-QA-BE-04 | Done (không đổi mã) | ARC chốt E.164 có `+` ở API, DB giữ `84…` – mã đã trả đúng dạng này |
| FB-R2-QA-BE-05 | Done | `identity.test.ts` thêm assert: cookie mới khác, `csrfToken` đổi, `User.version` tăng, phiên cũ 401 |
| FB-R2-QA-BE-06 / BUG-R2-011 | Done | `displayName` dùng chung `isValidName` (V-01); test `(`, `_`, `@` → `NAME_INVALID` |
| FB-R2-QA-BE-07 | Done (BE-A nối endpoint) | BE-B thêm `RateLimiter.resetAll()`; BE-A làm `POST /__test__/rate-limits/reset` |

## 4. Kết quả lệnh (16/10/2026, Node 22.23.3, pnpm 9.15.4, PostgreSQL 17 compose `ottimo-dev`, DB `ottimo_test_beb` tạo lại sạch)

| Lệnh | Kết quả |
|---|---|
| `pnpm -s format:check` (toàn repo) | sạch |
| `pnpm -s lint` (toàn repo) | 0 lỗi, 1 cảnh báo cũ (`admin-web/public/mockServiceWorker.js`, của FE) |
| `pnpm -s test` (toàn repo) | Turbo 12/12; `@ottimo/api` 23 tệp, **559 passed**, không bỏ qua; admin-web 70, integrations 46, ui 7, api-client 5, i18n 3, mobile 1, guest-web 1 |
| `pnpm -s build` | Turbo 6/6; `dist/db/migrations` có 0000…0009; `dist/modules/identity/public/common-passwords.txt` |

## 5. Giả định / việc cần vai khác
- ARC: thêm mã trường `NOT_ALLOWED_FOR_SELF` (updateUser); ghi `listUsers.status = locked` gồm cả khóa tạm (`locked_until` tương lai).
- OPS/INV: nhập SecLists cho `common-passwords.txt` trước khi deploy staging (xem SOURCE.md); cân nhắc `REVOKE TEMPORARY` của `ottimo_app`.
- Cờ `possible_duplicate_at` là dữ liệu dẫn xuất: đặt/xóa không tăng `version` hồ sơ (tránh 412 vô cớ); cờ của hồ sơ "bên kia" không tự xóa khi hồ sơ này sửa hết giống (xóa khi gộp – R3).
- `foc_approval_push_roles`: giá trị chữ hợp lệ duy nhất hiện nay là `lowest_sufficient_role_plus_manager` (BR-432 v0.3); thêm giá trị mới cần BA/DOM.
