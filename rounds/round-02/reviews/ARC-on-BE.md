# ARC review BE – Round 2, Sprint 1 (commit d7d42e4)

- Người review: ARC | Ngày: 16/10/2026 | Review bắt buộc ARC → BE (plan R2 mục 5)
- Phạm vi: `product/services/api` – BE-A: `shared/serialization`, `shared/http/{csrf,precondition,unit-of-work,auth.guard,pagination}`, `shared/validation.ts`, `modules/audit`, `modules/approvals`, migration 0006–0007. BE-B: `modules/identity`, `modules/platform`, `modules/guests`, migration 0004–0005, seed DS-E (catalogue căn).
- Đối chiếu: `architecture.md`, ADR-001…013, `erd.md` 0.3.3, `openapi.yaml` 0.3.3-draft, `coding-standards.md` 0.2, `rbac-matrix.md` 0.2.1, báo cáo `outputs/BE/s1-be-a.md`, `s1-be-b.md`, `outputs/FE/s1-report.md`.
- Cách làm: đọc mã nguồn + migration + meta sinh từ spec; không chạy lại test (BE đã báo 510/510 xanh trên DB thật). Không sửa mã, không sửa spec ở bước này.

## Tóm tắt

| Mức | Số thẻ | Thẻ |
|---|---|---|
| Blocker | 0 | – |
| Major | 4 | 01, 02, 03, 04 |
| Minor | 13 | 05 → 17 |
| Suggestion | 2 | 18, 19 |

Kết luận kiểm theo checklist ARC:

| Hạng mục | Kết quả |
|---|---|
| Ranh giới module public/internal | Đạt – không import `*/internal` chéo module; chỉ `shared/http/auth.guard.ts` phụ thuộc `modules/audit/public` (chấp nhận được) |
| RLS + ngữ cảnh | Đạt – 0005/0007 ENABLE+FORCE RLS + policy cho 5 bảng mới, GRANT không có DELETE; mọi truy vấn trong `withContext`; `guest` cấp tổ chức đúng erd 2.6 |
| Giao dịch, khóa | Một phần – xem 01 (kết nối lồng nhau), 03 (mất cập nhật bộ đếm đăng nhập), 04 (hạn mức tự áp không khóa) |
| Idempotency | Đạt – khóa INSERT trong cùng giao dịch, replay trước kiểm vai, commit-then-fail lưu đúng lỗi |
| Job đúng một lần | Không có job mới trong Sprint 1; outbox `staff.push` ghi cùng giao dịch, có `dedupe_key` – đạt |
| Clock | Đạt – không có `Date.now()`/`new Date()`/`now()` trong mã và SQL nghiệp vụ; lệch nhỏ: ngày hiệu lực tham số theo UTC (11) |
| Tiền số nguyên | Đạt – `divideRoundVnd` số nguyên, điểm giữa làm tròn lên theo trị tuyệt đối, `bigint` mode number |
| Migration | Đạt – 0004/0006 drizzle-kit, 0005/0007 SQL tay cho RLS/trigram/SECURITY DEFINER; chỉ tiến; `auth_resolve_session` DROP+CREATE có cấp lại quyền |
| Lệch hợp đồng | 4 câu hỏi hợp đồng – ARC chốt ở mục "Quyết định hợp đồng" (Q1–Q8); việc BE còn lại ở thẻ 14, 17 |
| Hiệu năng truy vấn | Một phần – N+1 ở danh sách duyệt (06), so khớp tên quét cả bảng ở mỗi lần xem khách (07), thêm 1 giao dịch mỗi request (05) |
| Trùng code BE-A/BE-B | Có – xác nhận lại mật khẩu 2 bản (02), nguồn origin 2 nơi, danh sách module 2 nơi (12), helper phân trang/version (18) |

---

## Thẻ feedback

### FB-R2-ARC-BE-01
- Mức độ: Major
- Vị trí: `src/modules/approvals/internal/approvals.controller.ts` dòng 105, 140 (`reauth.verify` bên trong `uow.run`); `src/shared/http/unit-of-work.ts` dòng 146 (`guard.enforce` → `AuditService.recordDenied` bên trong `withContext`); `src/db/pool.ts` dòng 19 (`max: 10`, `connectionTimeoutMillis: 5_000`)
- Vấn đề: Hai chỗ mở **kết nối thứ hai** trong khi vẫn giữ kết nối của giao dịch nghiệp vụ. (a) `approveRequest`/`rejectRequest`: `UnitOfWork` đã mở giao dịch và giữ khóa dòng `idempotency_key`, rồi `ApproverReauth.verify` gọi `db.withContext` lần nữa (kết nối mới), trong đó `SELECT … FOR UPDATE` dòng `app_user` và chạy argon2 (~50–100 ms) khi đang khóa. (b) Mọi operation có `Idempotency-Key` mà vai bị từ chối: `enforce()` chạy trong giao dịch của UoW và `recordDenied` mở thêm một kết nối. Pool chỉ có 10 kết nối: 10 request đồng thời loại này giữ hết 10 kết nối ngoài, chờ kết nối trong, và tất cả hỏng sau 5 giây (`connectionTimeoutMillis`) → 500 cho mọi người dùng. Trường hợp (b) do một tài khoản vai thấp gửi song song các lệnh ghi bị cấm là đủ (tự gây từ chối dịch vụ).
- Vì sao quan trọng: Lễ tân và quản lý cùng dùng một tiến trình api (R2 một bản chạy); treo pool là cả quầy không làm được gì. Vi phạm `coding-standards` 6 "Giao dịch" (một use case = một giao dịch) và ngân sách p95.
- Đề xuất sửa: (a) Gọi xác nhận lại mật khẩu **trước** `uow.run` như identity đang làm với `changeMyPassword`/`trustCurrentDevice` (bộ đếm vẫn ghi ở giao dịch riêng, nhưng tuần tự, không lồng). Chấp nhận việc gửi lại cùng khóa sau khi thành công vẫn phải nhập đúng mật khẩu. (b) Trong `UnitOfWork`, khi `enforce` quyết định từ chối: ném dấu hiệu để giao dịch rollback và **trả kết nối**, sau đó mới ghi `access.denied` bằng `recordDenied` (vẫn trước khi trả 403). Thêm test: pool `max: 2`, 3 request `approveRequest` song song → không có request nào chờ quá 1 giây; 5 request bị cấm song song → 403 cả 5, không 500. Quy tắc chung (ghi vào `unit-of-work.ts`): **cấm `db.withContext`/`db.entry` bên trong handler của UoW**; test kiến trúc có thể bắt bằng cờ AsyncLocalStorage "đang trong giao dịch".
- Trạng thái: Open

### FB-R2-ARC-BE-02
- Mức độ: Major
- Vị trí: `src/modules/approvals/internal/reauth.ts` (`ApproverReauth`) và `src/modules/identity/public/password-reauth.ts` (`PasswordReauth`)
- Vấn đề: Hai bản gần như sao chép của cùng một nghiệp vụ (cùng cột `approval_pin_failed_count/locked_until`, cùng hằng `REAUTH_MAX_FAILURES`, `REAUTH_LOCK_MS` định nghĩa 2 lần) nhưng **hành vi đã lệch**: approvals trả `401 REAUTH_FAILED` **không** có `errors[]`, identity trả có `errors[{field, code: REAUTH_FAILED}]`; tên hành động audit khác nhau (`approval.reauth_failed` vs `<purpose>.reauth_failed`); approvals kiểm `authMethod`/độ dài `secret`, identity không. Cả hai bên đã tự ghi TODO hợp nhất. R3 sẽ thêm PIN (SR-AUTH-09) và step-up C3 – nếu không gộp bây giờ sẽ thành 3–4 bản.
- Vì sao quan trọng: Một quy tắc bảo mật (SR-RL-02: 5 sai/15 phút, bộ đếm chung) phải có đúng một chỗ cài; FE đang phải xử lý 2 hình dạng lỗi cho cùng mã `REAUTH_FAILED` (H01 đổi mật khẩu, H07 cấp máy, S23 duyệt).
- Đề xuất sửa: Giữ `identity/public/password-reauth.ts` làm bản duy nhất, thêm tham số `{ authMethod, secret }` (R2 chỉ `password`, `pin` → 422 `NOT_IN_LIST` cho tới R3) và `purpose`; approvals tiêm `PasswordReauth` (identity export sẵn) thay vì `new ApproverReauth(...)`; xóa `approvals/internal/reauth.ts`. Hình dạng lỗi chuẩn: `401 REAUTH_FAILED` + `errors[{field: <tên ô mật khẩu của operation>, code: REAUTH_FAILED}]` (ARC ghi vào spec 0.3.4 – xem Q4). Làm cùng thẻ 01 (gọi trước `uow.run`).
- Trạng thái: Open

### FB-R2-ARC-BE-03
- Mức độ: Major
- Vị trí: `src/modules/identity/internal/auth.service.ts` dòng 157–196 (`registerFailure`), đọc `failed_login_count` ở `auth_find_user` (giao dịch `entry` dòng ~83)
- Vấn đề: Bộ đếm sai mật khẩu bị **mất cập nhật khi đăng nhập song song**: `failures = u.failed_login_count + 1` lấy từ lần đọc trước khi chạy argon2 (ở giao dịch khác), rồi `UPDATE … SET failed_login_count = $2` ghi **giá trị tuyệt đối**. N lần sai gửi cùng lúc đều đọc 0 và đều ghi 1 → không bao giờ tới ngưỡng khóa. Tương tự trạng thái `locked` được kiểm trên dữ liệu đã cũ. Giới hạn 20 lần/IP/15 phút (bộ nhớ) không thay được khóa theo tài khoản khi kẻ tấn công dùng nhiều IP.
- Vì sao quan trọng: SR-AUTH-04 (khóa 5 lần sai) là lớp chống dò mật khẩu theo tài khoản; hiện vượt được chỉ bằng cách gửi song song. Tài khoản OWN/MGR có quyền tiền và cấu hình.
- Đề xuất sửa: Trong giao dịch ghi lỗi: `SELECT failed_login_count, lock_count_24h, locked_until, status FROM app_user WHERE id = $1 FOR UPDATE` rồi tính trên giá trị vừa khóa (hoặc `UPDATE … SET failed_login_count = failed_login_count + 1 … RETURNING`), kiểm lại `status/locked_until` sau khi khóa. Test: 8 lần sai mật khẩu gửi bằng `Promise.all` → tài khoản `locked`, lần sau 429. Gửi SEC (review bắt buộc với PR chạm phiên): câu trả lời 429 khi tài khoản đang khóa khác 401 khi tên không tồn tại – theo đúng SR-AUTH-04 nhưng lộ việc tài khoản có tồn tại; SEC xác nhận chấp nhận hay đổi.
- Trạng thái: Open

### FB-R2-ARC-BE-04
- Mức độ: Major
- Vị trí: `src/modules/approvals/public/approval.service.ts` dòng 247–305 (`selfApplication`), so với `approve` dòng 322 (`pg_advisory_xact_lock`)
- Vấn đề: (a) Nhánh **tự áp** (A2 – OWN/MGR trong hạn mức, FD/FDL tự miễn minibar BR-436) đọc tổng tháng `monthlyApprovedBy` rồi INSERT mà **không khóa** – hai yêu cầu tự áp song song của cùng người (2 tab, 2 dòng minibar, gửi lại offline với khóa khác nhau) cùng thấy phần còn lại và cùng được duyệt, vượt `foc_self_apply.front_desk.per_month`. Luồng `approve` đã có khóa advisory theo người duyệt, luồng tự áp thì chưa. (b) OWN/MGR tự áp: kiểm hạn mức tháng bằng `monthlyApprovedBy(…, selfApplied=false)` nhưng ghi dòng với `self_applied = true` → các lần tự áp của OWN/MGR **không bao giờ được cộng** vào hạn mức tháng của chính họ. Với `foc_limits` mặc định (quản lý, chủ đầu tư không giới hạn tháng) chưa lộ, nhưng chỉ cần OWN đặt hạn mức tháng cho quản lý là vượt được không giới hạn.
- Vì sao quan trọng: Hạn mức FOC (BR-433, BR-436, INV quyết ESC-007) là kiểm soát tiền; `coding-standards` 10 bắt buộc test đồng thời cho "duyệt FOC đồng thời".
- Đề xuất sửa: Trong `submit`, trước khi tính `selfApplication`: `pg_advisory_xact_lock(hashtext('approval-limit:' || userId))` (cùng khóa với `approve` để thứ tự khóa thống nhất: dòng yêu cầu → khóa hạn mức người dùng). Với OWN/MGR: hạn mức tháng tính trên **tổng cả hai** (`self_applied` true + false) hoặc ghi rõ trong `limits.ts` loại nào cộng vào đâu theo BR-433 (BA xác nhận nếu cần); FD/FDL giữ ngân sách tự áp riêng như hiện tại. Test: 2 yêu cầu tự áp minibar song song mỗi cái 300.000 với `per_month` 500.000 → đúng 1 `approved`, 1 `pending`.
- Trạng thái: Open

### FB-R2-ARC-BE-05
- Mức độ: Minor
- Vị trí: `src/modules/identity/internal/session-policy.interceptor.ts` (bước 1) và `src/shared/http/auth.guard.ts` `authenticate()`
- Vấn đề: Hiệu lực phiên (thu hồi, `expires_at`, `idle_expires_at`, `user_status`) đang kiểm **ở hai nơi**: guard (từ `auth_resolve_session` 0.3.2) và interceptor (truy vấn lại `user_session JOIN app_user`). Interceptor mở thêm một giao dịch cho **mọi** request đã xác thực (BEGIN + 4 `set_config` + SELECT + COMMIT) chỉ để lấy `must_change_password`, `client_origin`, `last_active_at`. Hai nguồn sự thật cho cùng quy tắc dễ lệch khi R3 thêm 2FA.
- Vì sao quan trọng: Ngân sách p95 đọc < 300 ms, rack < 200 ms (architecture 16); mỗi request hiện có 3 giao dịch tuần tự trước nghiệp vụ.
- Đề xuất sửa: Mở rộng `auth_resolve_session` (migration custom mới, DROP+CREATE như 0005) trả thêm `client_origin`, `last_active_at`, `must_change_password`; guard kiểm tất cả và gắn vào `principal`; chỉ khi `now - last_active_at ≥ 60 s` mới chạy UPDATE trượt `idle_expires_at` (giữ hành vi hiện tại). Interceptor còn lại phần `PASSWORD_CHANGE_REQUIRED` không truy vấn DB (hoặc đưa vào guard ngay sau xác thực – đúng TODO đã ghi). Đây là việc của BE-A (chủ guard) + BE-B (chủ identity) – thống nhất một người làm.
- Trạng thái: Open

### FB-R2-ARC-BE-06
- Mức độ: Minor
- Vị trí: `src/modules/approvals/internal/approvals.controller.ts` (vòng `for … await this.approvals.toDto(tx, r, …)`), `approval.service.ts` dòng 548 (`toDto`) và 589 (`context`)
- Vấn đề: N+1: `toDto` gọi `context(tx)` (SELECT `property.timezone`) **cho từng dòng** – trang 50 dòng = 50 truy vấn thừa. Ngoài ra một request duyệt gọi `context()` 2–3 lần và đọc `foc_limits` nhiều lần. Danh sách S23 là màn hình FDL/MGR mở thường xuyên.
- Vì sao quan trọng: Hiệu năng (p95), và mẫu sẽ bị chép sang các danh sách khác.
- Đề xuất sửa: Lấy múi giờ một lần ở `list()` (hoặc dùng `PropertyContextService.now(tx)` – đã có, đúng ngày nghiệp vụ BR-010) rồi truyền vào `toApprovalDto(row, tz, …)` thuần; `toDto` chỉ dùng cho một dòng. Truyền `{ tz, today, now, focLimits }` giữa các bước trong cùng request thay vì đọc lại.
- Trạng thái: Open

### FB-R2-ARC-BE-07
- Mức độ: Minor
- Vị trí: `src/modules/guests/internal/guests.service.ts` dòng 317–331 (`warnings`), gọi từ `get` (dòng 343) và `update` (dòng 419)
- Vấn đề: Cảnh báo BR-952 chạy `similarity(g.name_search, $4) >= 0.3` – hàm `similarity()` dạng điều kiện **không dùng** chỉ mục GIN trigram (chỉ toán tử `%`/`LIKE` mới dùng). Nhánh "cùng quốc tịch khi thiếu ngày sinh" lọc theo `nationality_code = 'VN'` → gần như quét cả bảng `guest` của tổ chức và tính similarity từng dòng, **ở mỗi lần FD+ mở hồ sơ khách** (`getGuest`). Khách dài hạn + OTA tích lũy vài chục nghìn hồ sơ trong 1–2 năm.
- Vì sao quan trọng: `getGuest` nằm trên luồng nhận phòng/đặt phòng; vượt p95 khi bảng lớn. Không có `EXPLAIN` kèm PR (coding-standards 6 "Chỉ mục").
- Đề xuất sửa: (1) Dùng `g.name_search % $4` (sau `SET LOCAL pg_trgm.similarity_threshold = 0.3`) để chạy trên `guest_name_search_trgm_idx`; (2) theo quyết định Q7 bên dưới: tính cảnh báo **khi tạo/sửa** và lưu cờ trên hồ sơ, `getGuest` đọc cờ + danh sách nghi trùng thay vì tính lại mỗi lần xem; (3) kèm `EXPLAIN ANALYZE` trên 50.000 hồ sơ giả trong PR.
- Trạng thái: Open

### FB-R2-ARC-BE-08
- Mức độ: Minor
- Vị trí: `src/modules/approvals/public/approval.service.ts` `approve()` nhánh `!d.ok` + `limits.ts` `decide()`
- Vấn đề: Người duyệt **dưới cấp** `required_role` (ví dụ FDL bấm "Duyệt" yêu cầu đã định tuyến lên quản lý) vẫn ghi `UPDATE status='escalated'`, tăng `version`, ghi audit `approval.escalated` mỗi lần bấm, dù không ai thực sự vượt hạn mức. Trong khi `reject()` cùng tình huống trả 403 và không đổi gì. Một yêu cầu `pending` cấp quản lý có thể bị chuyển `escalated` chỉ vì FDL mở được id.
- Vì sao quan trọng: Nhật ký S27 bị nhiễu, trạng thái SM-10 sai nghĩa ("escalated" = đã có người duyệt cấp dưới thử và vượt hạn mức), `version` tăng làm client khác nhận 412 vô cớ.
- Đề xuất sửa: Khi `APPROVER_RANK[approverRole] < APPROVER_RANK[row.required_role]` → 403 `APPROVAL_LIMIT_EXCEEDED` + `approver: required_role`, **không ghi** (giống `reject`). Chỉ ghi `escalated` khi người duyệt đủ cấp định tuyến nhưng vượt hạn mức lần/tháng (A4). Thêm test.
- Trạng thái: Open

### FB-R2-ARC-BE-09
- Mức độ: Minor
- Vị trí: `src/modules/approvals/internal/limits.ts` `requiredRoleFor()`; BR-433
- Vấn đề: BR-433 ghi "Lễ tân trưởng … FOC **của chính mình** ngoài phần minibar BR-436 → **quản lý duyệt**". Mã định tuyến chỉ theo số tiền, không theo vai người gửi: FOC 200.000 do FDL gửi → `required_role = front_desk_lead` → một FDL khác duyệt được (chỉ chặn tự duyệt).
- Vì sao quan trọng: Lệch quy tắc nghiệp vụ về kiểm soát tiền (hai lễ tân trưởng duyệt chéo cho nhau).
- Đề xuất sửa: Hỏi BA/DOM xác nhận nghĩa ("quản lý duyệt" hay "không tự duyệt"). Trong lúc chờ, chọn hướng an toàn: khi người gửi có vai `front_desk_lead` và loại không phải tự áp minibar → `required_role` tối thiểu `manager`. Ghi giả định vào `s1-be-a.md` mục Giả định.
- Trạng thái: Open

### FB-R2-ARC-BE-10
- Mức độ: Minor
- Vị trí: `src/modules/platform/internal/parameter-rules.ts` (TODO Sprint 2 gồm `foc_limits`); `approvals/internal/limits.ts` `roleLimit()`
- Vấn đề: `foc_limits` đã được module duyệt dùng từ Sprint 1, nhưng `setParameter` chưa kiểm cấu trúc khóa này (chỉ kiểm `json` khác `undefined`). OWN gõ sai (`"perTimeVnd": "300000"` dạng chuỗi, thiếu vai) → `roleLimit` hiểu là không có quyền/không biết hạn mức → mọi FOC dồn lên chủ đầu tư mà không ai biết vì sao.
- Vì sao quan trọng: Cấu hình sai lặng lẽ làm hỏng luồng duyệt của cả cơ sở.
- Đề xuất sửa: Đưa `foc_limits`, `foc_self_apply.front_desk.*`, `foc_approval_push_roles` vào `checkStructuredParameter` ngay Sprint 1 (schema zod: mỗi vai `perTimeVnd` số nguyên ≥ 0 hoặc `perTime ∈ {unlimited, one_night_rate}`, `perMonthVnd` số nguyên hoặc `unlimited`; FDL ≤ quản lý) → 422 `PARAM_OUT_OF_RANGE`. Phần còn lại của 9.1a giữ Sprint 2.
- Trạng thái: Open

### FB-R2-ARC-BE-11
- Mức độ: Minor
- Vị trí: `auth.service.ts` dòng 127, 159, 263; `session-policy.interceptor.ts` dòng 86 (`localDate(now, 'UTC')`)
- Vấn đề: Ngày hiệu lực khi đọc `session_policy`, `login_lockout` lấy theo **ngày UTC** thay vì ngày theo `property.timezone` (coding-standards 5.4). Từ 00:00 tới 07:00 giờ VN, tham số đổi hiệu lực "từ hôm nay" chưa áp dụng.
- Vì sao quan trọng: Nhỏ, nhưng là mẫu sai sẽ bị chép; tham số bảo mật (thời gian rảnh phiên) đổi trễ 7 tiếng.
- Đề xuất sửa: Khi có cơ sở trong ngữ cảnh: `PropertyContextService.now(tx).today`. Khi chưa có (đăng nhập trước khi biết cơ sở): dùng múi giờ mặc định của tổ chức/catalogue (tham số `timezone`) – viết một hàm `identityAsOf(tx)` dùng chung, có comment lý do.
- Trạng thái: Open

### FB-R2-ARC-BE-12
- Mức độ: Minor
- Vị trí: `src/main.ts` dòng 24–34; `src/modules/feature-modules.ts`; `test/integration/rbac-sprint1.test.ts`; `test/integration/approvals-audit.test.ts` dòng 175
- Vấn đề: (a) Danh sách module có **2 nơi**: `main.ts` tự thêm `AuditModule`, `ApprovalsModule`, còn `featureModules()` (mà test dùng "để chạy y như production") chỉ có platform/identity/guests → test RBAC 22 operation của BE-B không nạp module của BE-A, và test BE-A dùng `TestCsrfModule` thay identity thật – chưa có test nào chạy cả hai cùng nhau như production. (b) Origin có 2 nguồn: guard dùng `config.allowedOrigins` (đã kiểm https bắt buộc ở staging/production), identity tự đọc `ADMIN_BASE_URL`/`STAFF_BASE_URL` thô qua `originsFrom()` (không qua kiểm của `config.ts`).
- Vì sao quan trọng: Sprint 2 thêm reservations/folio – mỗi module mới phải nhớ thêm ở 2 chỗ; cấu hình origin lệch giữa guard và phân loại phiên là lỗi khó thấy trên staging.
- Đề xuất sửa: `featureModules(config)` là nơi **duy nhất** liệt kê module (gồm audit, approvals); `main.ts` chỉ gọi hàm này. `IdentityOptions.adminOrigins/pwaOrigins` lấy từ `config` (thêm `config.originsByClient = { admin, staffPwa, guest }` để identity phân loại phiên). `rbac-sprint1.test.ts` dùng đúng `featureModules` đầy đủ – thêm các ca rbac của 5 operation BE-A vào chung một runner.
- Trạng thái: Open

### FB-R2-ARC-BE-13
- Mức độ: Minor
- Vị trí: `src/shared/http/auth.guard.ts` `checkTrustedDevice()`; erd 4.2 `trusted_device.last_seen_at`; SR-DEV-06
- Vấn đề: Khi guard chấp nhận cookie thiết bị, `trusted_device.last_seen_at` không được cập nhật (BE-B đã nêu R5). Danh sách thiết bị S26 hiện "lần dùng gần nhất" sai; OWN rà danh sách hằng tháng (A110) không phát hiện được máy đã lâu không dùng để thu hồi.
- Vì sao quan trọng: Yêu cầu SEC SR-DEV-06; thiết bị được cấp mở dữ liệu C3.
- Đề xuất sửa: BE-A (chủ guard): sau khi thiết bị hợp lệ, cập nhật `last_seen_at` tối đa 1 lần/5 phút/thiết bị (điều kiện `WHERE last_seen_at < $now - interval` trong UPDATE, chạy chung giao dịch `entry` đã có – cần hàm SECURITY DEFINER `auth_touch_device(token_hash, now)` vì chưa có ngữ cảnh RLS, viết ở migration custom).
- Trạng thái: Open

### FB-R2-ARC-BE-14
- Mức độ: Minor
- Vị trí: `src/modules/identity/internal/screens.ts` dòng 15 (`manager: range(1, 34)`)
- Vấn đề: `getMe.screens` của quản lý chứa `S26`. rbac 0.2.1 ô S26 × MGR là ◐ (ghi chú 20a): ở R2 quản lý chỉ đổi mật khẩu/PIN/2FA/phiên **của mình** qua menu người dùng; mọi API của màn S26 (users, trusted devices) chỉ OWN. FE đã phải tự lọc S26 ở client – trái quy tắc "client không tự suy quyền theo tên vai" (coding-standards 9).
- Vì sao quan trọng: Menu/route đến màn mà mọi thao tác trả 403.
- Đề xuất sửa: Theo quyết định Q8: bỏ `S26` khỏi `manager` ở R2; thêm test đơn vị `screensFor(['manager'])` không chứa S26; rà lại cả bảng theo nguyên tắc Q8 (ô ◐ chỉ gồm thao tác "của mình" ở menu người dùng không tính là màn hình). Khi PO mở ủy quyền thiết bị cho MGR (20a) thì thêm lại.
- Trạng thái: Open

### FB-R2-ARC-BE-15
- Mức độ: Minor
- Vị trí: `test/integration/guests.test.ts`, `identity.test.ts`
- Vấn đề: Thiếu test đồng thời cho các chỗ mà mã đã cố tình chống đua: (1) 2 `createGuest` cùng SĐT cùng lúc → đúng 1 `201`, 1 `409 DUPLICATE_GUEST` (đường `23505 → ROLLBACK TO SAVEPOINT → 409`); (2) 2 OWN cùng bỏ vai owner của nhau → đúng 1 thành công, 1 `LAST_OWNER`; (3) đăng nhập sai song song (thẻ 03); (4) tự áp FOC song song (thẻ 04). Hiện chỉ có "2 người duyệt đồng thời".
- Vì sao quan trọng: coding-standards 10 "Đồng thời"; các đường xử lý lỗi `23505` hiện không có test nào đi qua.
- Đề xuất sửa: Thêm 4 ca `Promise.all` trên DB thật như `approvals-audit.test.ts` dòng 529.
- Trạng thái: Open

### FB-R2-ARC-BE-16
- Mức độ: Minor
- Vị trí: `src/modules/approvals/public/approval.service.ts` dòng 480 (`pendingFor`); migration 0006 (chỉ mục)
- Vấn đề: `pendingFor(target_type, target_id)` – cổng chặn trả phòng `409 PENDING_APPROVALS` (AC5, Sprint 3) – không có chỉ mục khớp; 3 chỉ mục hiện có đều bắt đầu bằng `property_id, status|requested_by|approver_id`. Bảng `approval_request` giữ mãi (không xóa, BR-434).
- Vì sao quan trọng: Truy vấn chạy trong giao dịch trả phòng (ghi < 500 ms); thêm chỉ mục lúc bảng còn rỗng rẻ hơn về sau.
- Đề xuất sửa: Migration mới: `CREATE INDEX approval_request_open_target_idx ON approval_request (property_id, target_type, target_id) WHERE status IN ('pending','escalated')` và thêm `property_id = $` vào điều kiện truy vấn.
- Trạng thái: Open

### FB-R2-ARC-BE-17
- Mức độ: Minor
- Vị trí: hợp đồng 0.3.4 (ARC sẽ sửa – xem mục Quyết định hợp đồng); `guests.service.ts` `lookup()`, `platform/internal/rooms.service.ts`, `guest-mapper.ts`
- Vấn đề: Việc BE phải làm theo các quyết định hợp đồng bên dưới, khi ARC đã đẩy 0.3.4 và sinh lại `openapi-schemas.ts`: (1) Q1 – không cần sửa logic `lookup`, chỉ thêm test SAL/CTV nhận `{ matches: [], match: possible_duplicate }` (hiện serializer xóa `match`); (2) Q6 – `Room` thêm `bedSetup`, `bedCount`, `areaM2` (cột đã có ở 0004) vào `listRooms`/`createRoom`/`updateRoom` + audit allowlist `room`; (3) Q7 – cột `guest.possible_duplicate_at` (migration mới), đặt khi tạo/sửa tìm thấy nghi trùng (cả hai hồ sơ), `GuestSummary.possibleDuplicate`; `lastStayDate` làm ở Sprint 2 khi có bảng đơn; (4) Q4 – thống nhất `REAUTH_FAILED` có `errors[]` (cùng thẻ 02).
- Vì sao quan trọng: FE đang ẩn cột "bố trí giường", "lưu trú gần nhất", chip "nghi trùng" và hiểu sai phản hồi tra cứu của SAL/CTV.
- Đề xuất sửa: Làm (1), (2), (4) trong Sprint 1 bước sửa; (3) phần cờ trong Sprint 1, `lastStayDate` Sprint 2.
- Trạng thái: Open

### FB-R2-ARC-BE-18
- Mức độ: Suggestion
- Vị trí: `guests.controller.ts` (`search`: tự kiểm `limit`, con trỏ là UUID thô); `rooms.service.ts`, `guests.service.ts` (tự so `version` rồi `throw VERSION_CONFLICT`); `approval.service.ts` `context()`, `audit-log.controller.ts` (tự SELECT `property.timezone`); `shared/validation.ts` dòng 36 (comment cũ); `rooms.service.ts` `create()` (mọi `23505` → `roomNo DUPLICATE`)
- Vấn đề: Helper dùng chung đã có nhưng chưa được dùng đồng đều: `parseLimit/decodeCursor/page` (con trỏ mờ), `assertVersion`/`versionedUpdate`, `PropertyContextService.now()`. Comment V-09 ở `shared/validation.ts` vẫn nói "2 bản phải giống nhau" trong khi platform đã re-export. `create()` phòng báo `DUPLICATE` cho `roomNo` cả khi va `public_slug`.
- Vì sao quan trọng: Mẫu ở Sprint 1 sẽ được chép cho reservations/folio ở Sprint 2.
- Đề xuất sửa: Dùng helper chung; ánh xạ `23505` theo tên ràng buộc (`room_property_room_no_key`); xóa comment cũ. Không gấp.
- Trạng thái: Open

### FB-R2-ARC-BE-19
- Mức độ: Suggestion
- Vị trí: `src/shared/http/unit-of-work.ts` (`response_body` lưu nguyên kết quả handler)
- Vấn đề: Phản hồi lưu để replay là kết quả **trước** serializer – với `createGuest` gồm SĐT, email, ngày sinh (C2) nằm trong `idempotency_key.response_body` tới khi bị dọn. Đúng thiết kế (replay đi lại qua serializer theo vai người gọi) nhưng mở rộng chỗ chứa C2.
- Vì sao quan trọng: Bản đồ dữ liệu C2 của SEC (data-risk-assessment) cần biết bảng này chứa C2 và thời hạn xóa.
- Đề xuất sửa: Hỏi SEC: hoặc chấp nhận và ghi `idempotency_key` vào bản đồ dữ liệu C2 + hạn xóa (job dọn hiện có), hoặc thêm tùy chọn `storeBody: 'id'` cho các operation trả C2 (client gửi lại nhận `{id}` rồi GET lại). ARC nghiêng về phương án đầu cho R2.
- Trạng thái: Open

---

## Quyết định hợp đồng (ARC) – trả lời câu hỏi của BE-B và FE

ARC sẽ sửa `openapi.yaml` → 0.3.4-draft (và erd khi cần) ở bước sửa sau, báo FE/BE/MOB/INT; **chưa sửa ở bước review này**.

| # | Câu hỏi (người hỏi) | Quyết định | Việc kéo theo |
|---|---|---|---|
| Q1 | `lookupGuestByContact` thiếu `match` trong response (BE-B R1, FE) | **Thêm** vào schema 200: `match: { type: string, enum: [possible_duplicate] }`, tùy chọn. Nghĩa: có ít nhất một hồ sơ sống trùng SĐT/email nằm **ngoài phạm vi** người gọi (chỉ xảy ra với SAL/CTV `exists_only_or_own`). `matches[]` chỉ chứa hồ sơ trong phạm vi. FD+ không bao giờ nhận `match`. FE hiện "Có thể trùng – liên hệ lễ tân" khi có `match`; **không** dựng phần tử rỗng tên trong `matches` (cách hiểu hiện tại của FE là sai). Không dùng `x-visible-to` cho `match` (SAL/CTV cần nó) | ARC sửa spec; BE thẻ 17 (1); FE sửa H06 |
| Q2 | Mã lỗi trường `PASSWORD_TOO_COMMON`, `CHECKLIST_REQUIRED`, `CONTACT_REQUIRED`, `CONTACT_CHANNEL_EMPTY` (BE-B R2) | **Chấp nhận cả 4**, thêm vào bảng "Mã lỗi theo trường": `PASSWORD_TOO_COMMON` (V-10, cùng dòng mật khẩu); `CHECKLIST_REQUIRED` (`trustCurrentDevice.hardeningChecklistConfirmed` ≠ true); `CONTACT_REQUIRED` (thiếu cả SĐT và email – `field` = `phone`, US-071 AC1); `CONTACT_CHANNEL_EMPTY` (`preferredContact` trỏ tới kênh chưa có giá trị). Thêm `REAUTH_FAILED` làm mã trường (xem Q4). `DUPLICATE_GUEST` được dùng làm `errors[].code` bên trong thân 409 (chỉ ra `phone`/`email`) | ARC sửa spec; UXD thêm chuỗi `field_error.*` |
| Q3 | `changeMyPassword` trả cookie mới, FE gọi lại `getMe` (BE-B R2) | **Giữ cách BE-B đã làm** (đúng SR-SES-02/06): đổi mật khẩu thu hồi **mọi** phiên kể cả phiên hiện tại và cấp phiên mới cho chính client đang gọi: `204` + `Set-Cookie` phiên mới. `csrfToken` gắn với phiên nên **đổi** → client bắt buộc gọi lại `getMe` trước lệnh ghi tiếp theo. Sửa câu tóm tắt spec ("giữ phiên hiện tại" → "cấp phiên mới cho client đang gọi") và mô tả 204 | ARC sửa spec; FE đã làm đúng |
| Q4 | 401 riêng cho `changeMyPassword` khi sai mật khẩu hiện tại (FE) | **Giữ HTTP 401, mã `REAUTH_FAILED`** (khác `UNAUTHENTICATED`), kèm `errors[{field: currentPassword, code: REAUTH_FAILED}]`. Áp chung cho mọi chỗ xác nhận lại (`trustCurrentDevice`, `approveRequest`, `rejectRequest`, sau này step-up/PIN). Quy tắc cho client: **chỉ `code = UNAUTHENTICATED` mới là hết phiên**; `REAUTH_FAILED` hiện lỗi tại ô mật khẩu, không chuyển trang đăng nhập. Không thêm `CURRENT_PASSWORD_WRONG` (hai tên cho một nghĩa). Spec thêm 401 mô tả rõ ở 4 operation | ARC sửa spec; BE thẻ 02; FE sửa interceptor 401 theo `code` |
| Q5 | `DUPLICATE_GUEST` hay `PARTY_DUPLICATE` cho US-072 (BE-B R4) | **BE-B đúng**: `createGuest`/`updateGuest` → `409 DUPLICATE_GUEST`; `PARTY_DUPLICATE` chỉ của `addPartyMember` (người đã có trong đơn, Sprint 2–3). Phiếu giao việc ghi sai. Bổ sung spec: `existingGuestId/existingGuestCode` **chỉ có khi người gọi được xem hồ sơ đó** (SAL/CTV ngoài phạm vi → vắng), khớp mã hiện tại | ARC sửa mô tả 409 |
| Q6 | `Room` thiếu "bố trí giường" (FE, hi-fi H04) | **Thêm** vào `Room`, `RoomCreate`, `RoomPatch`: `bedSetup` (string ≤ 100, C0, ví dụ "1 giường đôi 1m8 + sofa giường"), `bedCount` (integer 1–10, BR-110), `areaM2` (integer, tùy chọn). Cột đã có ở erd 4.1 và migration 0004 – không cần migration. Xem: mọi vai đang xem được `Room`; sửa: OWN/MGR như các trường khác. R2 là văn bản một ngôn ngữ (không i18n) – chấp nhận | ARC sửa spec; BE thẻ 17 (2); FE bật cột |
| Q7 | `GuestSummary` thiếu "lưu trú gần nhất" và cờ nghi trùng (FE, H06) | **Thêm 2 trường tùy chọn**: `lastStayDate` (LocalDate – ngày đi của lưu trú `checked_out`/`in_house` gần nhất; `x-rbac-field: D11` → MT không thấy) – **Sprint 2** khi có bảng đơn, tới lúc đó vắng mặt và FE ẩn cột khi mọi dòng vắng; `possibleDuplicate` (boolean, `x-visible-to: [owner, manager, front_desk_lead, front_desk]`) – **lưu sẵn** ở cột mới `guest.possible_duplicate_at` (erd 0.3.4), đặt khi tạo/sửa phát hiện nghi trùng BR-952 (đặt cho cả hai hồ sơ), xóa khi gộp hồ sơ (R3). Không tính similarity theo từng dòng của danh sách (tránh N+1 – xem thẻ 07) | ARC sửa spec + erd; BE thẻ 17 (3) |
| Q8 | `getMe.screens` của manager không chứa S26 (FE) | **Đồng ý với FE.** Nguyên tắc chốt cho `Me.screens`: một màn có trong danh sách khi vai có ✔ hoặc ◐ **và** ở round hiện tại có ít nhất một thao tác của màn đó (theo `x-roles`) vai được làm; ô ◐ chỉ gồm thao tác "của mình" đặt ở menu người dùng (đổi mật khẩu, PIN, 2FA, phiên của mình) **không** tính là màn. R2: MGR **không** có S26 | ARC ghi vào mô tả `Me.screens`; BE thẻ 14; BA ghi chú 20a thêm câu này |

Ghi chú tự sửa của ARC (phát hiện khi review, không phải lỗi của BE):
- `GuestInput.nationalityCode` (alpha-2, theo DB `^[A-Z]{2}$` và EP00) và `GuestDocumentInput.nationalityCode` (alpha-3 từ 0.3.3) hiện không có `pattern` ở schema khách – ARC thêm `pattern: '^[A-Z]{2}$'` cho `GuestInput/Guest/GuestSummary` và ghi rõ hai chuẩn + nơi chuyển đổi (registration) ở 0.3.4.
- `session_policy`, `login_lockout` (BE-B R3): ARC đưa vào `x-security-parameters` khi SEC cho biên; tới lúc đó BE kiểm cấu trúc ở use case như hiện tại.

---

## Điểm làm tốt (nên giữ)

1. **Serializer theo vai sinh từ OpenAPI** (BE-A): mặc định từ chối trường, trường bị ẩn **vắng mặt** chứ không `null`, kết hợp `x-visible-to` + bảng `x-rbac-field` "fail closed" với mã lạ, chạy toàn cục cho mọi `@Operation` kể cả replay idempotent – đúng tinh thần SR-AZ-04 và dễ kiểm bằng test.
2. **UnitOfWork + idempotency đúng thứ tự hợp đồng**: khóa idempotency INSERT trong cùng giao dịch nghiệp vụ, replay trước kiểm vai/If-Match, cơ chế "commit-then-fail" cho leo thang SM-10 A4 (vừa giữ thay đổi vừa trả 403, replay trả lại đúng lỗi) – giải pháp gọn cho một chỗ khó của hợp đồng.
3. **Migration và RLS kỷ luật** (BE-B): tách đúng drizzle (0004) và SQL tay (0005: RLS FORCE, trigram, `auth_resolve_session` DROP+CREATE có cấp lại quyền), không GRANT DELETE, FK cặp `(property_id, x_id)`, UK một phần cho SĐT/email chống trùng cả khi đua, làm tròn tiền bằng số nguyên với test số âm và ví dụ vàng BR-101.
