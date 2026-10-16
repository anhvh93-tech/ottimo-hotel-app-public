# BE-B – Round 2, Sprint 1: identity, platform (căn + tham số), guests

- Vai: BE (luồng BE-B) | Ngày: 16/10/2026 | Không commit (ORC commit) | Plan R2 mục 4 Sprint 1
- Đầu vào: OpenAPI 0.3.2→0.3.3-draft, erd 0.3.2 (2.4, 4.1, 4.2, 4.4, 9.1a, 9.3), specs/EP00-platform.md, backlog AC US-001/002/004/005/071/072/073/142, rbac-matrix 3/6, security-requirements SR-AUTH/SES/DEV/RL, nền BE-A (d0-foundation.md) + phần BE-A Sprint 1 làm song song (CSRF/Origin trong guard, serializer x-visible-to, audit allowlist, precondition).

## 1. Operation đã làm (22/22 operation R2 của vùng BE-B)

| Operation | Story | Trạng thái | Điểm chính |
|---|---|---|---|
| `login` | US-001 | Xong | argon2id; 401 chung cho sai tên/sai mật khẩu/khóa cứng/disabled (+ audit `auth.login_refused/failed`); `login_lockout`: 5 sai liên tiếp → khóa 15 phút → lần 6: 429 + `Retry-After`; lần khóa thứ 3/24 h → khóa tới khi OWN mở; 20 lần/IP/15 phút (bộ nhớ); phiên mới mỗi lần (SR-SES-02); cookie `ottimo_sid`/`__Host-ottimo_sid` HttpOnly, SameSite=Lax, Path=/, Secure khi có tiền tố; `client_origin` admin/staff_pwa theo Origin; trả `Me` |
| `logout` | US-001 | Xong | thu hồi phiên (`revoked_reason=logout`), xóa cookie, 204 |
| `getMe` | US-001/002 | Xong | properties + roles + `screens` (rbac mục 3) + `deviceTrusted`, `csrfToken` (HMAC phiên), `mustChangePassword`, `mfaRequiredButMissing` (cờ R3) |
| `changeMyPassword` | US-001 | Xong | 401 `REAUTH_FAILED` (5 sai/15 phút → 429, bộ đếm DB dùng chung với duyệt – `PasswordReauth`), V-10 (`PASSWORD_TOO_SHORT/SAME_AS_USERNAME/REUSED/TOO_COMMON`), thu hồi **mọi** phiên + cấp cookie phiên mới (SR-SES-02/06), audit security |
| `listUsers`, `createUser`, `updateUser`, `setUserRoles` | US-002 | Xong | chỉ trong cơ sở OWN đang giữ vai owner; 409 `USERNAME_TAKEN` (citext, toàn hệ thống); mật khẩu tạm `must_change_password`; 412 theo `version`; `LAST_OWNER` (khóa dòng owner `FOR UPDATE`) cho `roles`/`status`; đổi vai/khóa/đặt lại mật khẩu → tăng `roles_version` + thu hồi mọi phiên cùng giao dịch; audit security |
| `listTrustedDevices`, `trustCurrentDevice`, `revokeTrustedDevice` | US-142 | Xong | chỉ OWN (x-roles); chỉ phiên admin-web (PWA → 403, SR-DEV-04); xác nhận lại mật khẩu qua `PasswordReauth` (401 `REAUTH_FAILED`, bộ đếm `approval_pin_*` dùng chung với module duyệt của BE-A), `CHECKLIST_REQUIRED`, tên trùng → `DUPLICATE`; hạn `trusted_device_days`/`trusted_device_mobile_days` (≤ 30 ngày, có CHECK DB); cookie `ottimo_did` SameSite=Strict + Expires; thu hồi có hiệu lực ngay; `isCurrentDevice`. 2FA TOTP (R3): `totpCode` nhận nhưng chưa kiểm |
| `listRoomGroups`, `listRooms` | US-004 | Xong | theo cơ sở (RLS); giá niêm yết hiện hành theo ngày nghiệp vụ; HK/MT 403 |
| `createRoom`, `updateRoom` | US-004 | Xong | định mức mặc định theo nhóm, sức chứa mặc định = định mức + 1; `MAX_OCCUPANCY_RANGE` (ESC-014); `DUPLICATE` số căn; giá đêm = tháng ÷ `night_from_month_divisor` làm tròn `rounding.night_rate` (BR-101/005, lưu đã làm tròn); giá có ngày hiệu lực (≥ hôm nay, `DATE_IN_PAST`), đơn cũ giữ snapshot; `CAPACITY_BELOW_BOOKINGS` qua cổng `ROOM_CAPACITY_CHECK` (mặc định chưa có đơn – Sprint 2 cắm truy vấn đơn); audit config |
| `listParameters`, `getParameterHistory`, `setParameter` | US-005 | Xong | qua `ParameterService`; khóa bảo mật/SR-* chỉ OWN/MGR xem (FDL → ẩn/404); khóa chỉ-OWN: MGR → 403 + `access.denied`; biên SEC + 9.1a + khóa cấu trúc (mục 4) → 422 `PARAM_OUT_OF_RANGE`; `DATE_IN_PAST`; V-09 trên `reason`; audit `security`/`config` |
| `searchGuests` | US-073 | Xong | tìm có/không dấu (`name_search` + chỉ mục trigram), mã `KH-`; `picker=true` ≤ 5 (mã đúng → đầu tên → mới nhất); con trỏ keyset; SAL/CTV chỉ khách mình tạo; 30 lượt/giờ SAL/CTV |
| `createGuest`, `updateGuest`, `getGuest` | US-071/072 | Xong | V-01…V-06, V-09, `CONTACT_REQUIRED`, `CONTACT_CHANNEL_EMPTY`; chuẩn hóa BR-951; 409 `DUPLICATE_GUEST` (+ `existingGuestId/Code` chỉ khi người gọi được thấy hồ sơ đó; chặn cả khi đua nhau nhờ UK một phần); cảnh báo BR-952 (tên giống, bỏ qua thứ tự từ + cùng ngày sinh, hoặc cùng quốc tịch khi thiếu ngày sinh); không có ô số giấy tờ; 412; trường theo vai (US-003 AC1) |
| `lookupGuestByContact` | US-072/073 | Xong (một lệch hợp đồng, mục 5) | POST, audit `access` không ghi giá trị tra; SAL/CTV không nhận dữ liệu hồ sơ người khác |

Chung: theo phối hợp BE-A – CSRF/Origin do AuthGuard kiểm (BE-B đăng ký `CSRF_VERIFIER` = `SessionService`, đã bỏ bước này khỏi interceptor); V-09 dùng `src/shared/validation.ts`; If-Match/ETag dùng `src/shared/http/precondition.ts`; lọc trường theo vai do serializer chung (đã bỏ mapper lọc riêng); thực thể audit `app_user`, `trusted_device`, `room`, `guest` đăng ký `defineAuditEntity`. Phiên kiểm ở mọi request bởi `SessionPolicyInterceptor` (thu hồi, `expires_at`, **`idle_expires_at` trượt** – admin 30 phút/12 h, PWA 72 h/30 ngày theo `session_policy`; `user_status ≠ active` → 401; mật khẩu tạm → 403 `PASSWORD_CHANGE_REQUIRED` trừ `changeMyPassword/getMe/logout`). CSRF: `SessionService` đăng ký `CSRF_VERIFIER` cho guard của BE-A.

## 2. Migration
- **0004_rooms_guests** (drizzle-kit): `room_group`, `room` (base/max theo căn, `public_slug` ngẫu nhiên, CHECK), `room_list_price` (UK `room_id, effective_from`), `guest` (UK một phần SĐT/email trên hồ sơ sống, FK cặp).
- **0005_identity_rooms_guests_rls** (custom): `pg_trgm` + GIN `name_search`; ENABLE+FORCE RLS + policy (3 bảng cấp cơ sở, `guest` cấp tổ chức); GRANT S/I/U (không DELETE); **`auth_resolve_session` 0.3.2** (thêm `idle_expires_at`, `user_status` – DROP+CREATE); catalogue `session_policy`, `login_lockout` (chỉ owner, có mặc định).
- `drizzle-kit generate`: "No schema changes" (sau cả 0006/0007 của BE-A).

## 3. Test (PostgreSQL 17 thật, DB `ottimo_test`, vai `ottimo_app`)
| File | Ca | Nội dung |
|---|---|---|
| `test/be-b-units.test.ts` | 16 | làm tròn (667.000, 1.042.000, 792.000, ±712.500), BR-951/952, V-10, màn hình theo vai, ESC-014, 9.1a, Luhn, GuestSummary qua serializer chung theo vai, rate limiter |
| `test/integration/identity.test.ts` | 19 | đăng nhập/cookie/Me, 401 giống nhau, khóa 5 lần → 429 → mở sau 16 phút, khóa cứng/disabled, idle 30 phút trượt, logout, thiếu CSRF 403, mật khẩu tạm → đổi → phiên cũ 401, users (403 MGR, 201/409/422, 412, đổi vai thu hồi phiên + menu HK, LAST_OWNER, reset), thiết bị (401/422/201 cookie, 180/30 ngày, trùng tên, danh sách, thu hồi, 404 cơ sở khác, PWA 403), Origin lạ 403 + phiên PWA, 5 lần sai mật khẩu xác nhận lại → 429 (bộ đếm DB) |
| `test/integration/platform-catalog.test.ts` | 10 | import catalogue (seed) + từ chối giá lệch BR-101, danh sách, HK 403 + audit, **RLS 2 cơ sở** (404 + 0 dòng), tạo/sửa căn (định mức, sức chứa, trùng, 428/412, giá tương lai, audit), tham số (ẩn khóa bảo mật với FDL, MGR sửa khóa vận hành, MGR 403 khóa OWN + audit, biên SEC/9.1a/cấu trúc, số thẻ) |
| `test/integration/guests.test.ts` | 11 | tạo + chuẩn hóa, 409 (`+84 901234567`), SAL không lộ id, lỗi theo ô, DOB_MINOR, số thẻ, cảnh báo tên+ngày sinh ("AN NHI"/"NHI AN" không báo), picker không dấu/≤ 5/mã KH/con trỏ, phạm vi own, trường theo vai (SAL, CTV, HK 403), lookup + audit không chứa SĐT, sửa 412/409, **cách ly 2 tổ chức** + hồ sơ dùng chung giữa 2 cơ sở cùng tổ chức |
| `test/integration/rbac-sprint1.test.ts` | 243 | sinh từ `tests/fixtures/rbac-cases.json`: 242 ca của 22 operation (2xx = qua cổng vai, 403 `FORBIDDEN_ACTION`, 401 cookie khách) + 1 ca phủ đủ operation |
| `test/integration/seed.test.ts` (sửa 2 dòng) | – | DS-E nạp đủ nhóm căn/căn |

## 4. Kết quả lệnh (16/10/2026, máy INV, Node 22, pnpm 9.15.4, PostgreSQL 17.11 compose `ottimo-dev`, DB `ottimo_test`)
| Lệnh | Kết quả |
|---|---|
| `pnpm -s format:check` (toàn repo) | sạch, exit 0 |
| `pnpm -s lint` (toàn repo) | exit 0 – 0 lỗi, 1 cảnh báo (`apps/admin-web/public/mockServiceWorker.js`, của FE) |
| `pnpm -s test` (toàn repo, `DATABASE_URL`/`MIGRATION_DATABASE_URL` → `ottimo_test`) | Turbo **12/12**; `@ottimo/api` **Test Files 20 passed, Tests 510 passed**, không skipped; admin-web 64, integrations 46, ui 7, api-client 5, i18n 4, mobile 1, guest-web 1 |
| `pnpm -s build` | Turbo **6/6**; `dist/db/migrations` có 0000…0007 |
| `npx drizzle-kit generate` | `No schema changes, nothing to migrate` (không sinh file lạ) |
| Smoke `node dist/main.js` (APP_ENV=test) | `/health` 200; login sai → 401 problem+json; route cơ sở không cookie → 401; module BE-A + BE-B nạp cùng nhau không lỗi DI |

## 5. Lệch hợp đồng / việc cần vai khác
| # | Gửi | Nội dung |
|---|---|---|
| R1 | ARC | `lookupGuestByContact` mô tả "khách khác → chỉ `{ match: possible_duplicate }`" nhưng schema 200 chỉ có `matches[]` (đóng) → serializer chung xóa trường `match`. Hiện SAL/CTV nhận `matches: []` (không lộ dữ liệu, nhưng mất tín hiệu "có thể trùng"). Đề nghị thêm `match: enum [possible_duplicate]` vào response |
| R2 | ARC | Thêm vào bảng `FieldError.code`: `PASSWORD_TOO_COMMON`, `CHECKLIST_REQUIRED`, `CONTACT_REQUIRED`, `CONTACT_CHANNEL_EMPTY`, `DOB_MINOR` (đã có), `DUPLICATE_GUEST` dùng làm mã trường; ghi rõ `changeMyPassword` 204 **đặt cookie phiên mới** (FE phải gọi lại `getMe` lấy `csrfToken` mới) |
| R3 | ARC + SEC | `session_policy`, `login_lockout` (catalogue mới, chỉ owner, biên kiểm ở use case) – cân nhắc đưa vào `x-security-parameters` với biên SEC |
| R4 | ARC | Giao việc yêu cầu "US-072 PARTY_DUPLICATE/409": theo hợp đồng `createGuest` dùng `DUPLICATE_GUEST`; `PARTY_DUPLICATE` thuộc `addPartyMember` (Sprint 2–3) – BE-B làm theo hợp đồng |
| R5 | BE-A | Cập nhật `trusted_device.last_seen_at` khi guard chấp nhận cookie thiết bị (SR-DEV-06 "lần dùng gần nhất"); `approvals/internal/reauth.ts` có thể gọi `identity/public/password-reauth.ts` (cùng cột, cùng giới hạn) để chỉ còn một bản; `config.allowedOrigins.staff` gộp admin + PWA nên identity vẫn đọc `ADMIN_BASE_URL`/`STAFF_BASE_URL` riêng để phân loại `client_origin` |
| R7 | OPS | `STAFF_BASE_URL` (PWA) cần có ở staging để phiên PWA được phân loại `staff_pwa` (hạn 72 h); `ADMIN_BASE_URL` dùng để nhận diện admin-web (đã do BE-A bắt buộc trong config staging/production) |
| R8 | SEC | Tệp ≥ 10.000 mật khẩu phổ biến (SR-AUTH-02) để thay danh sách tạm trong `passwords.ts` |
| R9 | QA | Seed DS-E nay nạp `roomGroups` + `rooms` (giá đêm server tính, đối chiếu `expectedNightlyListPriceVnd`) → TC-NT-040e chạy được |

## 6. Còn lại / chuyển tiếp
- `CAPACITY_BELOW_BOOKINGS` và cảnh báo "n đơn tương lai" khi ngừng bán: chờ bảng đơn (Sprint 2) – cắm vào `ROOM_CAPACITY_CHECK`.
- Khóa tham số dạng bậc/danh sách % (erd 9.1a "Khóa dạng khác": `*_tiers`, `los_discount`, `commission_payout` Σ=100, `foc_limits`, `wo_sla`, enum text) – Sprint 2.
- 2FA TOTP (`loginMfa`, `/me/2fa*`) – R3 (đã để chỗ: `mfa_enabled` → 401 `MFA_REQUIRED`).
- Rate limit đăng nhập theo IP và tra khách SAL/CTV còn trong bộ nhớ tiến trình (đúng với 1 replica R2); nhiều replica → chuyển DB/Redis. Xác nhận lại mật khẩu đã lưu DB.
- `trustCurrentDevice`: mật khẩu được kiểm trước kiểm "chỉ admin-web" (phiên PWA gửi sai mật khẩu nhận 401 thay vì 403; không lộ gì thêm).
- Danh mục `tags`/`serviceNotes` (DOM E00-06) chưa có: hiện nhận chuỗi 1–40 ký tự, ≤ 20 mục.
- `seed:ds-0` chưa có loader (ngoài vùng giao).

## 7. Giả định
- `room_group.name` là text (OpenAPI `name: string`), chưa dùng `name_i18n` của erd.
- Phạm vi "M" của hồ sơ khách = `guest.created_by` (chưa có `assigned_to`).
- Cảnh báo BR-952: khi cả hai hồ sơ có ngày sinh thì phải trùng ngày sinh; chỉ dùng quốc tịch khi một bên thiếu ngày sinh (để ví dụ "AN NHI/NHI AN khác ngày sinh → không báo" đúng).
- Khóa tạm do sai mật khẩu đặt `status=locked` → các phiên đang mở của người đó cũng bị 401 cho tới khi hết khóa (theo erd 2.4 "user_status ≠ active → 401").
- `effectiveFrom` của tham số chỉ có mặc định catalogue = ngày tạo cơ sở.
- Collaborator gửi `tags` → bị bỏ qua (D12a K).
- DB phụ `ottimo_test_beb` (tạo trong phiên để chạy thử, không dùng cho kết quả cuối) còn trên postgres dev – xóa được bất cứ lúc nào.
- Không có ESC mới.
