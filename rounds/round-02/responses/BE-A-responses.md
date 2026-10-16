# BE-A – phản hồi thẻ Round 2, Sprint 1 (vòng sửa sau review)

- Vai: BE (luồng BE-A) | Ngày: 16/10/2026 | Không commit (ORC commit)
- Vùng: `src/shared/**`, `src/modules/audit/**`, `src/modules/approvals/**`, migration `0010_approvals_open_target_idx_be_a`, kèm chỉnh nhỏ nền (`db/database.ts`, `http.ts`, `main.ts`, `modules/feature-modules.ts`, `test-support/`) và `docs/api/openapi.test.yaml` (ARC xem lại).
- Test chạy trên DB riêng `ottimo_test_bea`. Thẻ thuộc BE-B (identity/guests/platform) không trả lời ở đây – ghi "BE-B" ở cột ghi chú khi có phần chung.

## ARC-on-BE

| ID | Mức | Trạng thái | Ghi chú |
|---|---|---|---|
| FB-R2-ARC-BE-01 | Major | Done | (a) `approveRequest`/`rejectRequest`: xác nhận lại mật khẩu chạy **trước** `uow.run` (giao dịch riêng, tuần tự). (b) `UnitOfWork`: khi quyết định vai bị hoãn mà không có khóa đã hoàn tất để replay → ném dấu hiệu nội bộ, giao dịch rollback và trả kết nối, **sau đó** mới `recordDenied` + 403. Phần lớn ca bị từ chối giờ đã trả 403 ngay trong guard (xem QA-BE-01), không mở giao dịch UoW. Quy tắc chung: `db/database.ts` `runInUnitOfWork` (AsyncLocalStorage) – `withContext`/`entry` trong handler của UoW ném lỗi lập trình. Test `role-gate-first.test.ts`: pool `max: 2`, 3 lần duyệt + 5 lệnh bị cấm cùng lúc → 200×3, 403×5, tổng < 4 giây; kết nối lồng → lỗi |
| FB-R2-ARC-BE-02 | Major | Done | Xóa `approvals/internal/reauth.ts`; approvals tiêm `PasswordReauth` (identity/public – bản duy nhất, purpose `approval` → audit `approval.reauth_failed/locked` giữ nguyên tên). Lỗi chuẩn `401 REAUTH_FAILED` + `errors[{field: secret, code: REAUTH_FAILED}]` (khớp 0.3.4 Q4). `authMethod` (`pin` → 422 `NOT_IN_LIST` tới R3) và độ dài `secret` kiểm ở controller approvals trước khi gọi. Không sửa hành vi `PasswordReauth` (chỉ sửa comment cũ trỏ tới file đã xóa – báo BE-B) |
| FB-R2-ARC-BE-03 | Major | – | BE-B (auth.service) |
| FB-R2-ARC-BE-04 | Major | Done | (a) `submit()` lấy `pg_advisory_xact_lock('approval-limit:'‖userId)` (cùng khóa với `approve`) khi yêu cầu có thể tự áp; thứ tự khóa thống nhất: dòng yêu cầu → khóa hạn mức. (b) `monthlyApprovedBy(scope)`: OWN/MGR một ngân sách `all` (duyệt cho người khác + tự áp) ở cả tự áp, duyệt và số còn lại; FDL `others`; FD/FDL tự áp minibar `self` (BR-436) – ghi ở đầu `approval.service.ts`. Test: 2 tự áp minibar 300.000 song song với 500.000/tháng → đúng 1 `approved` 1 `pending`; MGR hạn mức tháng 600.000: tự áp 500.000 rồi tự áp 200.000 → `pending`, duyệt 200.000 cho người khác → 403 leo thang OWN |
| FB-R2-ARC-BE-05 | Minor | Done (BE-B làm chính) | BE-B mở rộng `auth_resolve_session` (migration 0009) và đưa `client_origin/last_active_at/must_change_password` vào principal trong guard; BE-A giữ nguyên phần guard còn lại, không đụng phần đó |
| FB-R2-ARC-BE-06 | Minor | Done | Danh sách S23: đọc múi giờ 1 lần/trang, `toApprovalDto` thuần cho từng dòng (tên người gửi/duyệt đã JOIN sẵn). `context()` và `foc_limits` ghi nhớ theo giao dịch (WeakMap theo `tx`) nên một request duyệt chỉ đọc mỗi thứ 1 lần |
| FB-R2-ARC-BE-07 | Minor | – | BE-B (guests) |
| FB-R2-ARC-BE-08 | Minor | Done | `approve()`: người duyệt dưới cấp `required_role` (hoặc dưới vai tối thiểu của loại) → `403 APPROVAL_LIMIT_EXCEEDED` + `approver`, **không ghi gì** (như `reject`). `escalated` chỉ khi người duyệt đủ cấp định tuyến nhưng vượt hạn mức lần/tháng (A4). Test AC3 sửa lại: trạng thái `pending`, `version` giữ, không có audit `approval.escalated` |
| FB-R2-ARC-BE-09 | Minor | Done (giả định) | Hướng an toàn: yêu cầu do người có vai cao nhất là `front_desk_lead` gửi (ngoài tự áp minibar BR-436) → `required_role` tối thiểu `manager`. Giả định ghi `decision-log` + đầu `approval.service.ts`; **cần BA/DOM xác nhận** câu BR-433 ("quản lý duyệt" hay "không tự duyệt"). Test AC4 sửa: FDL2 nhận 403 `approver: manager`, MGR duyệt được |
| FB-R2-ARC-BE-10 | Minor | – | BE-B (platform parameter-rules) |
| FB-R2-ARC-BE-11 | Minor | – | BE-B (identity) |
| FB-R2-ARC-BE-12 | Minor | Done (a) / BE-B (b) | (a) `featureModules()` là nơi duy nhất liệt kê module (thêm `AuditModule`, `ApprovalsModule`); `main.ts` chỉ gọi hàm này; test dùng `startFeatureApp` giờ nạp đủ 5 module như production (`role-gate-first.test.ts` chạy trên bộ này). (b) origin của identity lấy từ `config` – phần của BE-B |
| FB-R2-ARC-BE-13 | Minor | Done | Guard: thiết bị hợp lệ → `UPDATE trusted_device SET last_seen_at` tối đa 1 lần/5 phút/thiết bị (bộ nhớ + điều kiện SQL), trong ngữ cảnh tenant đã kiểm (cơ sở thiết bị = cơ sở request) – không cần hàm SECURITY DEFINER mới. Test: cookie thiết bị hợp lệ → `last_seen_at` có giá trị; lần 2 trong 5 phút không đổi |
| FB-R2-ARC-BE-14 | Minor | – | BE-B (screens) |
| FB-R2-ARC-BE-15 | Minor | Done (4) / BE-B (1–3) | (4) tự áp FOC song song – xem thẻ 04; thêm ca đồng thời pool nhỏ (thẻ 01). (1)–(3) thuộc BE-B |
| FB-R2-ARC-BE-16 | Minor | Done | Migration `0010_approvals_open_target_idx_be_a.sql` (drizzle-kit, schema `approvals.ts`): `approval_request_open_target_idx (property_id, target_type, target_id) WHERE status IN ('pending','escalated')`; `pendingFor` thêm `property_id = $1` |
| FB-R2-ARC-BE-17 | Minor | – | BE-B (lookup, Room, possibleDuplicate). Phần (4) `REAUTH_FAILED` có `errors[]` cho approvals: Done (thẻ 02) |
| FB-R2-ARC-BE-18 | Suggestion | Done một phần | Xóa comment cũ V-09 ở `shared/validation.ts` (platform đã re-export); `luhnValid` chuyển sang `shared/redact.ts` dùng chung. Phần của BE-B (helper phân trang/version ở guests/rooms, `23505` theo tên ràng buộc) – BE-B. `audit-log.controller` giữ tự đọc múi giờ (ngày lịch cho bộ lọc, không phải ngày nghiệp vụ) |
| FB-R2-ARC-BE-19 | Suggestion | Deferred → SEC | Chọn phương án ARC nghiêng: giữ `response_body` (replay đi lại qua serializer theo vai), SEC ghi `idempotency_key` vào bản đồ dữ liệu C2 + hạn xóa (job dọn hiện có). Chờ SEC xác nhận ở `outputs/SEC` R2 S2; nếu SEC chọn `storeBody: 'id'` thì BE-A thêm tùy chọn cho `createGuest/updateGuest` ở Sprint 2 |

## SEC-on-BE

| ID | Mức | Trạng thái | Ghi chú |
|---|---|---|---|
| FB-R2-SEC-BE-04, 05, 07, 08, 09, 11, 14, 15, 19, 20 | – | – | BE-B (identity/guests) |
| FB-R2-SEC-BE-06 | Major | Done | `requestHash` băm body đã qua `withoutSecrets()` – mọi trường trong `shared/secret-fields.ts` (`password, currentPassword, newPassword, initialPassword, resetPassword, secret, pin, newPin, totpCode, otp`, mọi độ sâu) thay bằng `"[secret]"`. Cùng danh sách được nạp vào `REDACT_PATHS` của log (`http.ts`). Test: `request_hash` của `approveRequest` thật = hash khi đổi `secret`; ≠ SHA-256 của body gốc; unit `redact.test.ts`. **Việc cho OPS/QA**: xóa dòng `idempotency_key` cũ ở dev/staging (hash cũ còn chứa mật khẩu dạng băm nhanh) – `DELETE FROM idempotency_key` an toàn (chỉ mất khả năng replay các request cũ) |
| FB-R2-SEC-BE-10 | Minor | Done (BE-B) | BE-B làm trong migration 0009 (`ALTER FUNCTION … SET search_path = pg_catalog, public, pg_temp` cho mọi hàm SECURITY DEFINER + test). BE-A không thêm hàm SECURITY DEFINER mới (thẻ ARC-13 làm trong ngữ cảnh tenant) |
| FB-R2-SEC-BE-12 | Minor | Done (guard) / BE-B (`unknown → admin`) | Guard: operation public chỉ nhận origin đúng phía – `login`/`loginMfa` chỉ origin nhân viên (admin + PWA), operation khách/trang công khai (`roles` có `guest`, đường dẫn `/v1/guest/`, `/v1/public/`) chỉ origin guest-web. Test: login từ origin guest-web → 403. Phần phân loại origin `unknown` trong `auth.service` – BE-B |
| FB-R2-SEC-BE-13 | Minor | Done | `shared/redact.ts`: `redactText()` (thẻ Luhn 13–19, CCCD 12 số/CMND 9 số, hộ chiếu, dòng MRZ, email, SĐT VN) và `describeError()` (lỗi PostgreSQL chỉ `code/constraint/routine`; lỗi khác `tên: thông điệp đã che`). `ProblemFilter` dùng `describeError`. Test: thẻ thử, CCCD giả, email trong thông điệp lỗi đều bị che |
| FB-R2-SEC-BE-16 | Minor | – | ARC (đã sửa spec 0.3.4); serializer tự áp sau khi sinh lại meta (đã chạy `gen:openapi`) |
| FB-R2-SEC-BE-17 | Suggestion | Done | Cùng thẻ ARC-01/02 |
| FB-R2-SEC-BE-18 | Suggestion | Deferred → Sprint 2 (cùng `requestFoc*`) | Hiện `submit()` chưa có nơi gọi HTTP (folio/requestFoc là Sprint 2). Khi làm `requestFoc*`, BE-A thay cờ `requesterReauthenticated` bằng bằng chứng do `PasswordReauth.verify` trả (`{userId, at, method}` có ký hiệu riêng) và `submit` kiểm `userId` + `at ≤ 60 s` – cần BE-B thêm giá trị trả về cho `verify`. Theo dõi ở backlog Sprint 2 (US-007 AC6) |

## QA-on-BE và bug-list

| ID | Mức | Trạng thái | Ghi chú |
|---|---|---|---|
| FB-R2-QA-BE-01 / BUG-R2-005 | Blocker / P1 | Done (gốc ở guard – sửa cho cả 4 operation) | Nguyên nhân gốc ở `AuthGuard` (BE-A): vai của operation có Idempotency-Key bị hoãn sang UoW. Giờ guard quyết định vai ngay (trước khi controller parse body / hỏi mật khẩu) – vai bị cấm → `403 FORBIDDEN_ACTION` + `access.denied`; chỉ hoãn khi chính người đó có khóa đã `completed` (replay ADR-009, chỉ truy vấn khi vai bị cấm nên đường bình thường không tốn thêm). Không cần BE-B sửa controller. Test mới `test/integration/role-gate-first.test.ts`, **sinh từ `@Operation` của controller + openapi-meta**: mọi operation ghi (không public, không cần thiết bị) với vai ngoài `x-roles` + body rỗng → 403 + đúng 1 dòng `access.denied` (hiện 7 operation có Idempotency-Key + các PATCH/PUT; Sprint 2 tự vào); 6 lần sai mật khẩu từ vai bị cấm không tăng bộ đếm xác nhận lại; replay khóa đã hoàn tất sau khi mất vai → 200 `Idempotent-Replayed`, khóa mới → 403 |
| FB-R2-QA-BE-07 | Minor | Done | `POST /__test__/rate-limits/reset` (TestSupportModule, cần `X-Test-Token` + phiên owner, audit `test.rate_limits_reset`): xóa cửa sổ RAM (`RateLimiter.resetAll` BE-B đã thêm) + đặt lại bộ đếm đăng nhập/khóa/xác nhận lại của tài khoản **cùng tổ chức người gọi** có `username` bắt đầu bằng `usernamePrefix` (mặc định `qa.`), `locked` → `active`. Khai ở `openapi.test.yaml` 0.1.2-draft (**ARC xem lại**). Test trong `http-foundation.test.ts` |
| FB-R2-QA-BE-08 | Suggestion | – | ARC (hợp đồng `AuditEvent`) |
| FB-R2-QA-BE-02…06 | – | – | BE-B / ARC |

## Thay đổi hành vi cần FE/QA biết
1. Vai bị cấm luôn nhận 403 trước 422/401/429 (mọi lệnh ghi).
2. `approveRequest`: người duyệt dưới cấp định tuyến → 403 `APPROVAL_LIMIT_EXCEEDED` nhưng yêu cầu **không** chuyển `escalated` (chỉ chuyển khi người đủ cấp vượt hạn mức).
3. Yêu cầu do lễ tân trưởng gửi → cần quản lý (giả định chờ BA/DOM).
4. `login` từ origin guest-web → 403.
5. Gửi lại cùng Idempotency-Key của `approve/reject` vẫn phải đúng mật khẩu (ARC chấp nhận).

## Kết quả lệnh (16/10/2026, Node 22.23.3, pnpm 9.15.4, PostgreSQL 17.11, DB `ottimo_test_bea`)
| Lệnh | Kết quả |
|---|---|
| `pnpm -s format:check` | xanh |
| `pnpm -s lint` | xanh (0 lỗi; 1 cảnh báo cũ ở `admin-web/public/mockServiceWorker.js` – FE) ; typecheck 12/12 |
| `pnpm --filter @ottimo/api gen:openapi` (+ `--check`) | sinh từ 0.3.4-draft, up to date |
| `drizzle-kit generate` | `No schema changes` sau 0010 |
| `pnpm -s build` | Turbo 6/6 |
| `pnpm -s test` | 11/12 gói xanh; `@ottimo/api` **520/525** – 5 ca đỏ đều thuộc phần BE-B đang sửa dở: `architecture.test.ts` (cột `auth_resolve_session` mới của 0009; `session_policy`/`login_lockout` vào `x-security-parameters`), `identity.test.ts` (khóa đăng nhập SEC-04/05; `NOT_ALLOWED_FOR_SELF` SEC-15 làm đổi kỳ vọng `LAST_OWNER`), `platform-catalog.test.ts` (kiểm tham số có cấu trúc). Toàn bộ test BE-A xanh: `approvals-audit` 75, `role-gate-first` 9, `http-foundation` 17, `redact` 5 |
