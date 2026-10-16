# QA review BE – Round 2, Sprint 1 (bước Kiểm thử)

- Người review: QA | Ngày: 16/10/2026 | Đối tượng: `product/services/api` tại commit `d7d42e4` (identity, sessions, users, devices; platform rooms + parameters; guests; serializer; CSRF; audit; approvals) và báo cáo `outputs/BE/s1-be-a.md`, `s1-be-b.md`
- Cách review: chạy thật RBAC runner + E2E API trên stack compose dùng một lần (`ottimo-qa-r2s1`, DS-E, có `ADMIN_BASE_URL`), thử tay bằng script, đọc controller/service liên quan. Không chạy lại `vitest` của api (cần DB test riêng) – số 510 ca xanh lấy theo báo cáo BE.
- Kết quả chạy: xem `rounds/round-02/qa/s1-test-report.md`. Lỗi: `qa/bug-list.md` BUG-R2-005, 007, 008, 011.

### FB-R2-QA-BE-01
- Mức độ: Blocker
- Vị trí: `services/api/src/modules/identity/internal/users.controller.ts:110` (`createUser`), `devices.controller.ts:70-73` (`trustCurrentDevice`), `platform/internal/platform.controller.ts:139` (`createRoom`), `approvals/internal/approvals.controller.ts` (`rejectRequest`) – kết hợp với `shared/http/auth.guard.ts` (vai của operation có Idempotency-Key quyết trong `UnitOfWork`)
- Vấn đề: controller gọi `parseBody()` / `reauth.verify()` **trước** `uow.run()`, nên vai không thuộc `x-roles` nhận `422 VALIDATION_FAILED` hoặc `401 REAUTH_FAILED` (rồi `429`) thay vì `403 FORBIDDEN_ACTION`, và **không** có `audit_event access.denied`. Bằng chứng: RBAC runner RB-1784…1792 (9/9 vai bị cấm `trustCurrentDevice` → 401), lần chạy đầu RB-0387…0395 (`createUser` → 422); E2E mới `TC-NT-008 (thứ tự kiểm, BUG-R2-005)` đỏ; thử tay `createRoom` FD `{}` → 422, `rejectRequest` HK `{}` → 422. Đối chứng đúng: `createGuest` HK → 403, `setParameter` FD → 403.
- Vì sao quan trọng: trái mục "Thứ tự kiểm" của OpenAPI và US-002 AC2 (mọi lần bị từ chối phải có nhật ký – TC-NT-008); vai bị cấm dò được cấu trúc body và tự khóa bộ đếm xác nhận mật khẩu. Test tầng A `rbac-sprint1.test.ts` (243 ca) không bắt được vì chỉ gửi body hợp lệ. Lỗi phân quyền → P1 (BUG-R2-005).
- Đề xuất sửa: gọi `AuthGuard.enforce(req)` ngay đầu handler (sau bước tra Idempotency-Key, trước parse/reauth) hoặc chuyển `parseBody`/`reauth.verify` vào callback `uow.run`. Thêm vào `rbac-sprint1.test.ts` biến thể "vai bị cấm + body rỗng → 403 + 1 dòng `access.denied`" cho **mọi** operation có Idempotency-Key (sinh từ `openapi-meta`), để lỗi cùng loại không quay lại ở Sprint 2 (createReservation, createHoldFromQuote…).
- Trạng thái: Open

### FB-R2-QA-BE-02
- Mức độ: Major
- Vị trí: `ParameterService` / `setParameter` – khóa `hold_hours_default` (erd 9.1a dòng 1151 "chéo: ∈ `hold_hours_options`")
- Vấn đề: `value: 36` được lưu `200` (owner và manager), lịch sử H05 hiện "24 giờ → 36 giờ"; chỉ biên đơn 1–72 được kiểm. TC-NT-012 đỏ 3/3 lần chạy (BUG-R2-007). Báo cáo BE-B mục 6 có ghi "khóa dạng khác … Sprint 2" nhưng kiểm chéo này nằm trong US-005 AC1 của Sprint 1.
- Vì sao quan trọng: giữ chỗ mới sẽ mang hạn 36 giờ không thuộc chính sách INV-006 (12/24/48) – lễ tân và khách thấy hạn khác chính sách đã công bố; FE chặn được ở UI nhưng API là nơi chốt.
- Đề xuất sửa: thêm bảng ràng buộc chéo (`hold_hours_default ∈ hold_hours_options`, và khi đổi `hold_hours_options` phải còn chứa mặc định) → `422 PARAM_OUT_OF_RANGE` (hoặc `VALIDATION_FAILED`) tại `value` kèm `allowed`; test tầng A đọc ví dụ BR-302 trong `br-examples.json`.
- Trạng thái: Open

### FB-R2-QA-BE-03
- Mức độ: Major
- Vị trí: `guests/internal/guests.service.ts` `lookup()` + schema 200 của `lookupGuestByContact` (`docs/api/openapi.yaml` ~dòng 5700) + serializer chung
- Vấn đề: SAL/CTV tra SĐT/email của khách người khác nhận `{"matches":[]}` – trường `match: possible_duplicate` bị serializer xóa vì schema 200 đóng (BE-B đã nêu R1 cho ARC nhưng chưa có thẻ/hạn). TC-RB-010 đỏ (BUG-R2-008). Không có test tầng A nào khẳng định trường này có mặt nên lỗi lọt qua 510 ca xanh.
- Vì sao quan trọng: AC US-087/US-072 và EP00 6.3 – sale/CTV phải biết "có thể trùng – liên hệ lễ tân" trước khi nhập hồ sơ; hiện họ chỉ biết khi bấm Lưu và nhận 409.
- Đề xuất sửa: ARC thêm `match: { type: string, enum: [possible_duplicate] }` vào schema 200 (0.3.4), BE sinh lại `openapi-schemas.ts`; thêm 1 ca tầng A "CTV tra email khách SAL → `match = possible_duplicate`, không có id/tên". QA đã có E2E (TC-RB-010) để xác nhận.
- Trạng thái: Open

### FB-R2-QA-BE-04
- Mức độ: Minor
- Vị trí: `guests/public/normalize.ts` `phoneForApi()` (trả `+84…`) ↔ EP00 V-02 ("lưu dạng `84…` không dấu `+`"), TC-L5-041 ("chuẩn hóa `84905123456`"), OpenAPI `Guest.phone` (không có `pattern`/mô tả định dạng)
- Vấn đề: API trả `+84905123456`, tài liệu và TC nói `84905123456`. Hợp đồng không quy định nên không phải lỗi, nhưng QA phải nới E2E (chấp nhận cả hai) và mock FE có thể đang dùng dạng khác.
- Vì sao quan trọng: SĐT đi sang Zalo/SMS adapter (INT) và khai báo lưu trú; mỗi bên tự đoán định dạng sẽ lệch khi gộp hồ sơ theo BR-951.
- Đề xuất sửa: ARC chốt một dạng cho API (đề nghị E.164 có `+`, thêm `pattern: '^\+[1-9]\d{7,14}$'` cho phản hồi), BA sửa câu V-02 phần "lưu" (DB) tách với "trả về" (API); QA siết lại TC-L5-041.
- Trạng thái: Open

### FB-R2-QA-BE-05
- Mức độ: Minor
- Vị trí: `docs/api/openapi.yaml` `changeMyPassword` summary "thu hồi mọi phiên khác, giữ phiên hiện tại"; `auth.service.ts changeMyPassword` (thu hồi **mọi** phiên + cấp cookie mới, `app_user.version + 1`)
- Vấn đề: hành vi đúng hướng bảo mật (SR-SES-02) nhưng khác chữ trong hợp đồng: token hiện tại cũng thành 401, `version` người dùng tăng nên `If-Match` của owner (đọc trước đó) thành 412. E2E QA đỏ 2 ca vì tin theo hợp đồng (đã sửa test – BUG-R2-012). BE-B có nêu R2 nhưng OpenAPI 0.3.3 chưa đổi.
- Vì sao quan trọng: client (FE, MOB PWA) phải biết đọc lại `getMe` lấy `csrfToken` mới và màn H07 đang mở phải tải lại version; nếu không sẽ có lỗi "phiên hết hạn"/412 khó hiểu.
- Đề xuất sửa: ARC sửa summary + mô tả 204 ("đặt cookie phiên mới, mọi phiên cũ kể cả phiên gọi bị thu hồi; `User.version` tăng"); BE thêm assert trong `identity.test.ts` cho cả hai điểm.
- Trạng thái: Open

### FB-R2-QA-BE-06
- Mức độ: Minor
- Vị trí: `identity/internal/users.controller.ts:29-38` (`displayName`)
- Vấn đề: chỉ kiểm "có chữ cái, không chữ số" → nhận `(`, `_`, `@`… (BUG-R2-011); `fullName` khách (`isValidName`) và FE `validation.ts` đã đúng V-01.
- Vì sao quan trọng: cùng một quy tắc V-01 ba cách cài → tên hiển thị trên bill/nhật ký có ký tự lạ, và form FE báo lỗi cho dữ liệu server đã nhận.
- Đề xuất sửa: dùng chung `isValidName` (guests/public) cho `displayName`; thêm 3 ca vào `be-b-units.test.ts`.
- Trạng thái: Open

### FB-R2-QA-BE-07
- Mức độ: Minor
- Vị trí: testability – `/__test__/*` (`services/api/src/test-support/`), rate limiter trong RAM (login 20/IP/15 phút, lookup SAL/CTV 30/giờ), bộ đếm xác nhận mật khẩu trong DB (5 sai/15 phút)
- Vấn đề: không có cách đặt lại bộ đếm cho stack test. Chạy lại E2E trong 15 phút trên cùng stack: RBAC runner nhận `429 RATE_LIMITED` ở `changeMyPassword`, `trustCurrentDevice`, `rejectRequest` của `qa.owner`/`qa.mgr` (lần chạy 2) – đỏ giả do môi trường; QA phải dựng lại stack để có số sạch.
- Vì sao quan trọng: hồi quy hằng đêm và chạy lại sau khi sửa lỗi trên staging (plan R2 mục 6) sẽ chập chờn; ca khóa tài khoản (TC-NT-043) bắt buộc phải xài hết hạn mức.
- Đề xuất sửa: thêm `POST /__test__/rate-limits/reset` (chỉ khi `INCLUDE_TEST_SUPPORT=1`, cần `X-Test-Token`, khai trong `openapi.test.yaml`) xóa bộ đếm RAM + `approval_pin_*`/lockout của tài khoản `qa.*`; QA gọi ở `global-setup`.
- Trạng thái: Open

### FB-R2-QA-BE-08
- Mức độ: Suggestion
- Vị trí: `AuditEvent` (OpenAPI 0.3.3) + `listAuditEvents` (có tham số lọc `actorUserId` nhưng dòng trả về không có định danh người làm)
- Vấn đề: chỉ có `actorName` (D27) – hai nhân viên trùng tên hiển thị không phân biệt được; QA kiểm phạm vi "own" (TC-NT-017) phải so theo tên.
- Vì sao quan trọng: nhật ký tiền (TC-NT-017(1), Sprint 2–3) cần đối soát "ai thu/hoàn" chính xác cho chủ đầu tư (A7).
- Đề xuất sửa: ARC cân nhắc thêm `actorUserId` (cùng `x-rbac-field: D27`) hoặc `actorCode`; nếu không, ghi rõ `displayName` là duy nhất trong tổ chức.
- Trạng thái: Open

## Điểm làm tốt (nên giữ)
- Cổng vai sinh từ `x-roles` chạy đúng trên 26/27 operation Sprint 1 đã có trên build: **288/297 ca RBAC đạt** ở lần chạy sạch (9 ca đỏ cùng một nguyên nhân, cùng một operation), 404 cho cơ sở không có vai, `access.denied` có ghi.
- Phiên và khóa đăng nhập vững: cookie HttpOnly + token mới mỗi lần (TC-SEC-020), khóa 5 lần → 429 kể cả mật khẩu đúng và mở lại sau 15 phút bằng MutableClock (TC-NT-043 a,b), đổi vai/khóa/đặt lại mật khẩu thu hồi mọi phiên tức thì (TC-NT-007, TC-SEC-022).
- Dữ liệu khách an toàn: CTV tạo trùng hồ sơ người khác bị `409 DUPLICATE_GUEST` **không** kèm id; tìm không dấu và chặn trùng `+84` chạy đúng; giá đêm niêm yết tính đúng BR-101 (101 → 667.000, 202 → 792.000).
