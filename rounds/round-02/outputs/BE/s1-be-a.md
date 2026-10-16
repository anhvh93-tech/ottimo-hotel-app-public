# BE-A – Round 2, Sprint 1: phần (b) còn lại của nền + US-006, US-007, US-135

- Vai: BE (luồng BE-A) | Ngày: 16/10/2026 | Không commit (ORC commit) | Đầu vào: plan R2 mục 4 Sprint 1, d0-foundation.md mục 5, OpenAPI hiện hành, rbac-matrix 0.2.1 (mục 5, 6), EP00 mục 0.5/6/7/9, SM-10, BR-431…436, SR-SES-04/AZ-04/AZ-07/AUD-03/RL-02.
- Làm việc song song với BE-B trên cùng thư mục; test chạy trên DB riêng `ottimo_test_bea` (tạo bằng `02-roles.sh`, cùng mô hình 4 vai) để không đụng `ottimo_test`/`ottimo_test_beb`.

## 1. Bảng việc / trạng thái
| # | Việc | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Serializer theo `x-visible-to` / `x-rbac-field` (SR-AZ-04) | Xong | Generator sinh `src/generated/openapi-schemas.ts` (hình phản hồi 2xx mỗi operation + schema); `SerializeInterceptor` toàn cục cho mọi `@Operation`; API cho module: `serializeSchema()`, `serializeResponse()`; bảng K rbac mục 6 (`field-policy.ts`). Test CTV/SAL/HK/MT/FD/đa vai/không vai |
| 2 | CSRF/Origin + If-Match/ETag → 412 | Xong | Guard: xác thực → **CSRF/Origin** → thiết bị → Idempotency → If-Match → quyền. Token do identity (BE-B) sở hữu qua `CSRF_VERIFIER`. 3 origin từ config. If-Match lệch = `412 VERSION_CONFLICT` + `currentVersion` (`precondition.ts`) |
| 3 | US-006 nhật ký thao tác (listAuditEvents) + ghi audit tiền dùng chung | Xong | `AuditService.recordMoney()`, `entity_code`, allowlist `defineAuditEntity` (SR-AUD-03); lọc ngày ≤ 92, phạm vi own trong SQL, con trỏ |
| 4 | US-007 yêu cầu duyệt | Xong (phần server SM-10 + 4 endpoint S23) | `ApprovalService.submit/approve/reject/cancel/list/pendingFor/onDecided`; nhập lại mật khẩu, khóa 5 sai/15 phút, không tự duyệt, hạn mức lần/tháng, leo thang commit + 403, đẩy outbox `staff.push` |
| 5 | US-135 hỗ trợ server | Xong | `shared/validation.ts`: `requireReason` (V-08 → `REASON_REQUIRED`), `assertNoCardNumber` (V-09 → `CARD_NUMBER_DETECTED`), `optionalText`, `isDryRun`; trạng thái đổi giữa chừng → `409 INVALID_TRANSITION` / `412 VERSION_CONFLICT` |
| 6 | "Cần chú ý" (attention) | Dời Sprint 4 | Sprint 1 không có màn Hôm nay/Tổng quan (plan mục 5: EP01 dashboard + Cần chú ý + SSE ở Sprint 4). Chưa tạo bảng `attention_event`; BR-435 cảnh báo FOC cũng đi cùng Sprint 4 |

## 2. Chi tiết theo nhóm (gợi ý commit)
| Nhóm | Nội dung | File |
|---|---|---|
| `feat(api): role serializer from OpenAPI (SR-AZ-04)` | Shape: `any/scalar/ref/array/object/union`, cờ `v`/`f`/`w`/`c3`; allOf/oneOf gộp (giao `x-visible-to` khi trùng); thuộc tính không khai bị bỏ (trừ schema mở); bị ẩn = **vắng mặt**; operation `x-c3-log` mới có C3; thiếu schema JSON 2xx mà handler trả JSON → 500 | `scripts/gen-openapi-meta.mjs`, `src/generated/openapi-schemas.ts`, `src/shared/openapi-types.ts`, `src/shared/serialization/*`, `src/core.module.ts` |
| `feat(api): CSRF/Origin in guard, If-Match helpers` | `csrf.ts`, guard `checkCsrf` (audit `access.denied` reason ORIGIN/CSRF), public write cũng kiểm Origin (login CSRF); `parseAllowedOrigins` (staging/production bắt buộc 3 URL https); `main.ts` từ chối khởi động staging/production khi chưa có verifier; `precondition.ts` (`parseEntityTag`, `expectedVersion`, `assertVersion`, `versionedUpdate`, `setETag`); guard kiểm thêm `idle_expires_at`/`user_status` (cột mới của BE-B 0005) | `src/shared/http/{csrf,precondition,auth.guard,pagination}.ts`, `src/config.ts`, `src/main.ts` |
| `feat(api): UnitOfWork commit-then-fail` | Handler trả `{ fail: problem }` → commit + lưu phản hồi lỗi cho idempotency → ném lỗi; replay ném lại đúng lỗi | `src/shared/http/unit-of-work.ts` |
| `feat(audit): money audit writer, allowlist, S27 log (US-006)` | `recordMoney`, `auditContextOf`, `entityCode`; allowlist đăng ký sẵn cho `operation, config_parameter, dev_clock, job, dataset, approval_request, app_user` (gồm các trường identity của BE-B đang ghi) | `src/modules/audit/**` |
| `feat(approvals): SM-10 approval requests (US-007)` | Bảng `approval_request` (CHECK K6 không tự duyệt, `self_applied` chỉ khi người duyệt = người gửi + approved), RLS, 3 chỉ mục; `limits.ts` (thuần, đọc `foc_limits`), `reauth.ts`, service, controller | `src/db/schema/approvals.ts`, `src/db/migrations/0006_approvals_audit_be_a.sql`, `0007_approvals_rls_be_a.sql`, `src/modules/approvals/**` |
| `feat(api): shared validation (US-135)` | Lý do bắt buộc, quét số thẻ, dryRun | `src/shared/validation.ts` |
| `test(api): …` | xem mục 4 | `test/serializer.test.ts`, `test/integration/approvals-audit.test.ts`, `test/config.test.ts`, sửa `architecture.test.ts`, `seed.test.ts` |

### Quy tắc US-007 đã cài
- **Định tuyến (A1)**: `required_role` = vai thấp nhất có hạn mức lần đủ (`foc_limits`); loại không theo tiền theo rbac 5.1 (`foc`, `checkin_room_not_ready` từ FDL; còn lại từ MGR). Quản lý "≤ giá 1 đêm" dùng `limit_basis_vnd` (giá đêm người gọi truyền khi gửi); thiếu → coi như vượt → OWN.
- **Tự áp (A2)**: OWN/MGR trong hạn mức của mình; FD/FDL chỉ FOC dòng thuộc `foc_self_apply.front_desk.categories` (minibar), ≤ lần + tổng tháng tự áp, và chỉ khi người gọi đã xác nhận lại mật khẩu (`requesterReauthenticated`).
- **Duyệt (A3)**: chỉ mật khẩu của chính tài khoản đang đăng nhập; FDL tự duyệt → `403 SELF_APPROVAL_FORBIDDEN` (cả từ chối); CHECK DB chặn lần nữa. Hạn mức tháng = Σ đã duyệt cho người khác trong tháng lịch giờ cơ sở; khóa advisory theo người duyệt để 2 lần duyệt song song không cùng dùng phần còn lại.
- **Leo thang (A4)**: vượt lần/tháng hoặc yêu cầu đã ở cấp trên → `escalated` (commit), `required_role` lên cấp cần, đẩy cấp mới, trả `403 APPROVAL_LIMIT_EXCEEDED` + `approver`.
- **Đẩy (BR-432 v0.3)**: outbox `staff.push` (Mock R2) tới vai thấp nhất đủ hạn mức + quản lý; OWN chỉ khi cần OWN hoặc không có quản lý đang hoạt động; không bao giờ gửi người gửi; payload chỉ id/mã/vai.
- **Từ chối (A5)**: lý do V-08/V-09; người duyệt dưới cấp `required_role` → 403 (không đổi trạng thái). **Rút (A6)**: chỉ người gửi (người khác 404), chỉ `pending`.
- **Danh sách (S23)**: phạm vi trong SQL — OWN/MGR tất cả; FDL = gửi bởi mình + mình đã quyết + đang định tuyến FDL; vai khác chỉ của mình; `approverRemainingMonthlyVnd` cho người xem có hạn mức tháng (serializer bỏ với vai khác).
- **Hook cùng giao dịch** `onDecided(type, fn)` để folio (Sprint 2–3) thêm dòng FOC âm (BR-434); `pendingFor()` cho chặn trả phòng (AC5).

## 3. Kết quả lệnh (16/10/2026, Node 22.23.3, pnpm 9.15.4, PostgreSQL 17.11, DB `ottimo_test_bea`)
| Lệnh | Kết quả |
|---|---|
| `pnpm --filter @ottimo/api exec vitest run` | **Test Files 18 passed, Tests 250 passed** (gồm test của BE-B đang có trong thư mục); trước Sprint 1: 121 |
| `npx turbo run test --filter=@ottimo/api --force` | xanh (lần chạy toàn repo đầu có 1 ca đỏ thoáng qua lúc openapi.yaml đang được ARC sửa – chạy lại xanh) |
| `node scripts/gen-openapi-meta.mjs --check` | `openapi-meta.ts and openapi-schemas.ts are up to date` |
| `drizzle-kit generate` (kiểm schema ↔ migration) | `No schema changes, nothing to migrate` |
| `pnpm -s build` | Turbo **6/6** |
| `prettier --check` + `eslint` + `tsc` trên **file của BE-A** | sạch |
| `pnpm -s format:check` toàn repo | **Đỏ – 63 file của FE (admin-web, packages/ui/i18n/api-client) và BE-B (identity, guests, platform, rooms, snapshot 0004/0005)** đang làm dở; không file nào của BE-A |
| `pnpm -s lint` toàn repo | **Đỏ – 12 lỗi**: admin-web (`GuestPicker.tsx` a11y, `mocks/handlers.ts`), `packages/ui/Modal.tsx`, `identity/internal/users.controller.ts` (`headerOf` thừa); typecheck: `test/helpers/feature-app.ts`, `identity.test.ts`, `platform-catalog.test.ts` (BE-B) |
| `turbo run test` toàn repo | `@ottimo/api-client` đỏ: kiểu sinh lệch openapi.yaml mới (FE chạy `pnpm --filter @ottimo/api-client gen`) |

## 4. Test mới
| File | Số ca | Nội dung |
|---|---|---|
| `test/serializer.test.ts` | 13 | CTV/SAL/FD/đa vai trên `Guest`; `approverRemainingMonthlyVnd`; HK mất `phoneMasked` (D02), MT mất tên (D01) dù không có `x-visible-to`; `actorName` D27; mọi mã `x-rbac-field` trong spec có trong bảng; vai rỗng; writeOnly/C3; bọc danh sách; 204 trả JSON → lỗi |
| `test/integration/approvals-audit.test.ts` | 74 | CSRF/Origin (thiếu/lạ/origin khách/thiếu token/token phiên khác → 403 + audit; CSRF trước 428 và quyền; login cần Origin); If-Match 428/422/412+`currentVersion`/200+ETag; US-007: AC1/AC2, **SELF_APPROVAL_FORBIDDEN** (+ CHECK DB), A2, AC3 leo thang 521.000 → MGR và 2.000.000 → OWN, hạn mức tháng 1.500.000 + replay 403, khóa sau 5 sai → 429, `pin` → 422, **2 người duyệt đồng thời → 200 + 409**, từ chối (REASON_REQUIRED, CARD_NUMBER_DETECTED), rút, phạm vi danh sách + phân trang, 404 chéo tổ chức; US-006: ghi/đọc tiền, own vs actor filter, HK 403, 92 ngày/thứ tự/ngày sai/limit/cursor; **55 ca rbac-cases.json** của 5 operation |
| `test/config.test.ts` | +3 | 3 origin: chuẩn hóa, bắt buộc + https ở staging/production, `APP_BASE_URL` |

## 5. Việc cần vai khác / phối hợp
- **BE-B (identity)**: (1) đăng ký `{ provide: CSRF_VERIFIER, useExisting: SessionService }` và export trong `IdentityModule` – khi có, guard kiểm CSRF; (2) bỏ bước 3 (CSRF/Origin) khỏi `SessionPolicyInterceptor` sau khi (1) chạy – guard đã làm đúng thứ tự (TODO(BE-A) đã xong); bước 1 (idle/status) guard cũng đã kiểm; (3) `IdentityOptions.adminOrigins/pwaOrigins` nên lấy từ `config.allowedOrigins` để một nguồn; (4) `platform/public/validation.ts` trùng `assertNoCardNumber`/`parseIfMatch`/`etag` với `src/shared` (cùng thuật toán) – nên re-export từ `shared/validation.ts` và `shared/http/precondition.ts`; (5) audit entity mới phải `defineAuditEntity()` (đã đăng ký sẵn `app_user` với các trường đang ghi); (6) đếm sai xác nhận lại: duyệt dùng cột DB, step-up/thiết bị của BE-B dùng `RateLimiter` trong RAM – thống nhất về một bộ đếm; (7) tôi đã sửa `seed.test.ts` (rooms không còn trong `skippedBlocks`) và `architecture.test.ts` (cột `idle_expires_at`, `user_status` của `auth_resolve_session`) cho khớp migration 0005 của BE-B.
- **ARC**: (1) `FocRequestInput` thiếu `authMethod`/`secret` cho tự áp FOC minibar AC6 (service đã sẵn tham số `requesterReauthenticated`); (2) erd: thêm `approval_request.target_code`, `limit_basis_vnd`, `self_applied`, `audit_event.entity_code`; (3) `AuditEvent.entityId` khai Uuid nhưng nhiều thực thể khóa text (tham số) – hiện trả mã đó ở `entityCode`; (4) thêm `DATE_RANGE_TOO_LONG` vào bảng mã lỗi trường; (5) `listAuditEvents` x-roles có FDL/FD (own) – phiếu giao việc ghi "chỉ owner/manager": tôi theo hợp đồng.
- **OPS**: compose api/worker cần `ADMIN_BASE_URL`, `STAFF_BASE_URL`, `GUEST_BASE_URL` (staging/production bắt buộc, https); `.env.example` đổi `APP_BASE_URL` → `ADMIN_BASE_URL` (code vẫn nhận tên cũ).
- **QA**: TC-SEC-023 (ca âm CSRF/Origin): 403 `FORBIDDEN_ACTION`, `audit_event access.denied` với `reason` = `ORIGIN`/`CSRF`; header token `X-CSRF-Token` = `Me.csrfToken`.
- **FE**: `api-client` cần sinh lại; khi PATCH gửi `If-Match: "<version>"`; 403 `APPROVAL_LIMIT_EXCEEDED` có `approver`.
- **ORC**: migration BE-A là **0006/0007** (sau 0004/0005 của BE-B, cùng `_journal.json`); nếu BE-B sinh thêm migration trước khi gộp thì giữ thứ tự `when` tăng dần.

## 6. Giả định
- Mã lỗi If-Match lệch = `VERSION_CONFLICT` (412) theo hợp đồng, không có `PRECONDITION_FAILED`.
- Rút yêu cầu (A6) chỉ khi `pending` (đúng SM-10); `escalated` không rút được – hỏi BA nếu muốn cho rút để không chặn trả phòng.
- Thiếu giá 1 đêm khi gửi → hạn mức quản lý coi như vượt (lên OWN), thiên về an toàn.
- `foc_approval_push_roles` = `lowest_sufficient_role_plus_manager` (DS-E) hoặc mảng vai.
- Dev/test: danh sách origin rỗng = không kiểm Origin; không có verifier = không kiểm token (production/staging đều bị chặn khởi động).
- Giới hạn 92 ngày, 5 sai/15 phút là hằng kỹ thuật/bảo mật (BA/SEC), không phải tham số nghiệp vụ.
- Không có ESC mới.
