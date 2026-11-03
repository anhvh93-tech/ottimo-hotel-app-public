# ARC duyệt PR #31 – v1.0.3 PR-1 `v1.0.3-email` (BUG-R3-032): hợp đồng 0.3.10 + BE-A (+INT) + MOB + FE-A

- PR: anhvh93-tech/ottimo-hotel-app-public#31 (nháp), nhánh `v1.0.3-email` @ `24de5895`. Base `origin/main` @ `bcfa0961`. Gồm 4 nhánh: `arc/v1.0.3-contract`, `be-a/v1.0.3-email` (đã có `int/v1.0.3-email-templates`), `mob/v1.0.3-cache-allowlist`, `fe-a/v1.0.3-email`.
- Người duyệt: ARC. Round 4, đợt v1.0.3, bước **Review**. Ngày 03/11/2026.
- Đối chiếu: OpenAPI 0.3.10-draft (`setMyEmail`, `updateUser`, `Me`, `User`, bảng mã trường); `rounds/round-04/outputs/ARC/v1.0.3-contract-email.md` (bản 04/11 theo SEC); `v1.0.3-tech-plan.md` mục 2; báo cáo `rounds/round-04/outputs/BE/v1.0.3-email.md`; review của INT (`INT-on-PR31-dispatcher.md`) để không lặp thẻ.
- Phạm vi: mã và migration. **Không** review chữ (FE-A đang sửa theo UXD), mẫu thư (INT/CPY đã duyệt) hay tài liệu hợp đồng của chính ARC.

## Cách review và kiểm đã chạy

- Đọc `git diff origin/main...origin/v1.0.3-email` (58 tệp) trong worktree ORC đang ở đúng `24de5895`. Không checkout, không sửa mã, không commit, không đăng lên PR.
- Postgres 17 tạm (image CI ghim digest), cổng riêng `127.0.0.1:55471`, mật khẩu CI giả `ci_*_only`, vai tạo bằng `infra/postgres/init/02-roles.sh`. Đã dừng và xóa container sau khi chạy.

| Kiểm | Kết quả |
|---|---|
| Migration của `origin/main` (tới 0090, lấy bằng `git archive`) → chèn `''`, `'   '`, `Owner@Example.test`, `NULL` → chạy 0091 của PR | Áp thành công, 68 dòng `__drizzle_migrations`. `''` và `'   '` thành `NULL`, địa chỉ hợp lệ giữ nguyên. `app_user` vẫn RLS ENABLE + FORCE. `user_email_change` RLS ENABLE + FORCE. Không có quyền `DELETE`. |
| DB thứ hai (tới 0090) có `'ab'` và `''` → chạy 0091 | Gãy đúng ở `ADD CONSTRAINT app_user_email_check`. **Rollback toàn bộ**: vẫn 67 dòng migration, không có bảng `user_email_change`, `''` vẫn nguyên, `app_user` **vẫn FORCE RLS**. Lệnh tắt RLS tạm không để lại trạng thái hở khi migration gãy. |
| Snapshot | `0091_snapshot.json.prevId` = id của 0090. Có `public.user_email_change`. `app_user.checkConstraints` có `app_user_email_check`. |
| `ottimo_readonly` | `rolbypassrls = t`, đúng giả định của câu tiền kiểm Q3. |
| Vitest api, có DB: `v103-security-email`, `architecture`, `email-dispatch` | 3 tệp, **61/61** |
| Vitest api, có DB: mọi tệp integration chạm `/v1/users`, `/v1/me`, `staff.email`, `job_run`, `BUILTIN_JOBS` | 10 tệp, **229/229** |
| Vitest api, không DB: `module-boundaries`, `migrations-journal`, `worker-jobs`, `worker-audit-registry`, `be-a-v103-email-units`, `be-c-r3-s1-units` (S2 = spec), `contract`, `redact`, `email-adapter` | 9 tệp, **79/79** |
| `api-client` vitest (gồm drift tệp sinh) | **37/37** |
| `mobile` `cache.test.ts` | **9/9** |
| `admin-web` `v103-email-fea.test.tsx` | **32/32** |
| CI PR #31 (`gh pr checks 31`, run 41621562540) | Hợp đồng, Redocly, shellcheck, LP-v1, no-test-surface: **pass**. `build-test`: đang chạy. **gitleaks: fail** (xem Điều kiện 1). |

Chưa chạy: toàn bộ bộ api (BE đã chạy 3762 ca), E2E, docker build. Kiểm quay lui về v1.0.2 làm bằng đọc mã, không chạy mã v1.0.2 trên DB đã có 0091 (xem mục 2).

## Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

Không có Blocker hay Major. Mã đúng hợp đồng 0.3.10 và hướng dẫn ARC ở mọi điểm được giao kiểm. 3 thẻ Minor, 2 thẻ Suggestion.

Điều kiện để gộp PR #31:
1. **gitleaks xanh.** 4 phát hiện `generic-api-key` đều nằm trong lịch sử `main` (`642e1947`, `b046363b`, runbook v1.0.2). Đây không phải mã của PR này. Allowlist neo hai đầu ở PR #30 đã làm gitleaks của PR #30 xanh. Vì vậy PR #30 gộp trước, rồi PR #31 cập nhật từ `main`. Sau đó `gh pr checks 31` phải xanh **hết**, gồm `build-test` và docker build/E2E.
2. Commit chữ của FE-A theo UXD đã vào nhánh. Test FE vẫn xanh. ARC không duyệt lại chữ.
3. ORC ghi vào `decision-log.md`: quyết định G-BE-1..4 (mục 3) và thứ tự deploy/quay lui (thẻ 02).
4. Thẻ 02: BE-A sửa câu Q1 (b)(c) trong báo cáo (chỉ tài liệu). Phần runbook chuyển cho OPS ở PR-2.

Thẻ 01 (tài liệu của ARC) và 03 (FE) nên làm trong PR-1, vì FE-A còn đang sửa nhánh. Nếu không kịp thì dời v1.0.4, không chặn gộp.

## 1. Bảng kiểm theo yêu cầu

| # | Điểm | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | `setMyEmail`: replay trước mọi kiểm và trước S2 | **Đạt** | `security-email.controller.ts:46-47` gọi `uow.completedReplay(req)` trước `parseBody` (:48), `check` (:49) và `strong.verify` (:51). `completedReplay` (`unit-of-work.ts:261-301`) trả `IDEMPOTENCY_KEY_REUSED` hoặc `IDEMPOTENCY_IN_PROGRESS` trước khi thử mật khẩu. Meta sinh: `idempotencyKey: true` (`openapi-meta.ts:73`), nên middleware trả 428. T21 có test. |
| 2 | Thứ tự dạng / hộp chung → S2 → ghi | **Đạt** | `check` (:49) → `verify` (:51) → `uow.run` (:56). zod để `reauth` tùy chọn (:26), nên S2 trả `STRONG_REAUTH_REQUIRED`, không trả `REQUIRED`. `.strict()` khớp `additionalProperties: false`. |
| 3 | Mã lỗi, field | **Đạt** | `EMAIL_INVALID`, `EMAIL_SHARED_MAILBOX` (`security-email.service.ts:48,51`), `NOT_ALLOWED_FOR_SELF` với `field: email` (`users.service.ts` precheck + `update`). 401 `REAUTH_FAILED` và 422 `STRONG_REAUTH_REQUIRED` do `StrongReauthService` dùng chung. Không có `Problem.code` mới. |
| 4 | S2 | **Đạt** | `STRONG_REAUTH_OPERATIONS` có `setMyEmail` (`strong-reauth.ts:79`). Test so spec xanh. `updateUser` hỏi S2 khi có `email` (`users.controller.ts:193-198`). |
| 5 | `updateUser.email`: kiểm trước S2, kiểm lại trong giao dịch | **Đạt** | `precheckEmail` chạy READ ONLY (`users.controller.ts:179-189`): 404 → chính mình 422 → đích OWN 403 → khác cơ sở 403. Sau đó mới `check` dạng / hộp chung, rồi S2. Trong `update`, cả hai kiểm 403 chạy lại trên dòng đã khóa `load(..., true)`. Hai nhánh 403 trả cùng thân `detail: 'other property'`. `user_property_role` là bảng cấp tổ chức (0001), nên "vai owner ở bất kỳ cơ sở nào" đếm đúng dù phiên đang ở một cơ sở. |
| 6 | `FOR UPDATE`, transaction | **Đạt** | `setOwn` dùng `SELECT … FOR UPDATE` trong `uow.run` (`security-email.service.ts:71-74`). `update` dùng `load(..., true)`. Mọi việc kèm theo (dòng đổi, audit, thông báo, outbox) chạy trong **cùng** giao dịch ghi. Audit `access.denied` ghi **sau** rollback, như mẫu SEC-BE-07. Test song song EM-08 xanh. |
| 7 | Trùng địa chỉ | **Đạt** | `setMyEmail`: không ghi, không tăng `version` (`:77`). `updateUser`: không có dòng đổi, audit hay outbox. Riêng `version` vẫn tăng (G-BE-3, chấp nhận). |
| 8 | Migration 0091 | **Đạt** | Journal idx **67**, `when` **1792782171681** (= 0090 + 2000). CHECK trên `app_user` đúng phác thảo. `user_email_change` có `via` CHECK, FK ghép `(organization_id, …)`, index một phần, RLS ENABLE + FORCE, `tenant_isolation`, `GRANT SELECT, INSERT, UPDATE`. Bước làm sạch `''` → `NULL` theo mẫu 0042/0043 (NO FORCE → DISABLE → UPDATE → ENABLE → FORCE), **trước** CHECK, trong giao dịch duy nhất của migrator. Cần tắt RLS vì `entry_function_read` (0001:77) chỉ cho `ottimo_owner` SELECT: dưới FORCE, UPDATE của chủ bảng sẽ âm thầm khớp 0 dòng. Đã thử cả ca thành công lẫn ca gãy. |
| 9 | Quay lui về v1.0.2 | **Đạt** | Migration chỉ thêm. v1.0.2 không đọc/ghi `user_email_change`. Đã rà mọi chỗ `INSERT/UPDATE app_user` trên `main`: `users.service`, `production-bootstrap`, `staging-add-owner`, `ds-e` seed. Không chỗ nào ghi `email`, nên CHECK không làm gãy v1.0.2. Lưu ý vận hành: thẻ 02. |
| 10 | Dispatcher 3 audience | **Đạt** | `self` / `owner` lấy từ `app_user` lúc gửi. `previous` lấy từ `user_email_change WHERE id = $1 AND user_id = $2` (ràng với người được đổi). Khóa theo dõi = `emailChangeId`. |
| 11 | Bỏ trùng trước `NO_RECIPIENT` | **Đạt** | `email-dispatch.ts:273-283`: gom self → previous → owner, bỏ trùng theo địa chỉ chữ thường, rồi mới quyết `NO_RECIPIENT`. T23, T24 xanh. |
| 12 | `finish` dọn `old_email` | **Đạt** | `:396-401`: chỉ khi `rowCount > 0` (còn giữ lease) và dòng `done`/`dead`. `deferred`/`failed` giữ địa chỉ cũ để thử lại. |
| 13 | Dọn 7 ngày, `purge_journal` | **Đạt** | `builtin-jobs.ts`: `email_change.purge`, chạy hằng ngày, `catchUp: always`. Lô 1000 `FOR UPDATE SKIP LOCKED`, chỉ `SET old_email = NULL`, mỗi dòng 1 `purge_journal` (`null_columns`, chỉ id). Có trong cả `core.module` lẫn `worker-jobs`, như `IDEMPOTENCY_PURGE_JOB`. T19 xanh. |
| 14 | Ranh giới module | **Đạt** | `security-email.service` chỉ import `audit/public`, `events/public`, `platform/public`, `shared/`. `users.service` dùng service cùng module. `jobs/` vốn là tầng chạy ngang bảng (như `email-dispatch.ts` đọc `app_user`). `module-boundaries.test.ts` xanh. `architecture.test.ts` thêm ca 0091. Ca chung "mọi bảng RLS + FORCE" tự phủ bảng mới. |
| 15 | Không lộ địa chỉ | **Đạt** | Outbox chỉ có id (`security-email.service.ts:156-161`). Audit chỉ có `maskEmail`. Allowlist `app_user` thêm `emailMasked`, `via`. Log dispatcher giữ quy tắc cũ. T9, T16 xanh. `EMAIL_FROM` đọc qua `IdentityOptions` (`main.ts`), không đặt cứng. |
| 16 | PWA cache allowlist (SEC 06) | **Đạt** | `cacheableMe` dựng lại `Me` theo danh sách cho phép, bỏ `email`, `securityEmailMissing` và các cờ tài khoản. `loadMe` lọc lại bản cũ và ghi đè xuống đĩa. Bản ghi hỏng thì xóa. Test dump IndexedDB không còn `@`. Bỏ `mustChangePassword` / cờ 2FA khỏi bản offline cũng được, vì guard server vẫn chặn khi online. |
| 17 | FE gọi api-client | **Đạt**, xem thẻ 03 | `setMyEmail(body, idempotencyKey)` đúng `PUT /v1/me/email`, đúng header. Kiểu `SetMyEmailBody`/`Result` sinh từ spec. `updateUser(userId, {email, reauth}, user.version)` gửi `If-Match`. Địa chỉ không vào URL (`#security-email` chỉ là anchor). Một khóa cho mỗi lần Lưu, gửi lại giữ khóa (`app/email.ts:51-59`). |

## 2. Thẻ feedback

### FB-R4-ARC-BE-31-01
- Mức độ: Minor
- Vị trí: `product/services/api/src/jobs/email-dispatch.ts:223-238` (`ownerScope`); `security-email.service.ts:131-146` (thông báo trong app); spec `openapi.yaml:849-851`; hướng dẫn ARC `v1.0.3-contract-email.md` mục 4.2 và G-E3
- Vấn đề: hướng dẫn ARC (bản 04/11, SEC 07) yêu cầu thư `owner` và thông báo trong app dùng **cùng** tập OWN, là OWN của cơ sở ghi trên outbox. BE làm rộng hơn cho thư: OWN của **mọi** cơ sở mà người được đổi còn vai, cộng cơ sở của dòng. Thông báo trong app vẫn chỉ ở cơ sở của phiên (G-BE-1). Mô tả spec `setMyEmail` lại ghi "mọi `owner` của các cơ sở của họ" cho thông báo. Vậy là ba chỗ ghi ba ý khác nhau.
- Vì sao quan trọng: không sai an toàn. Thư tới nhiều OWN hơn là hướng an toàn, và production có 1 cơ sở nên hai tập bằng nhau. Nhưng QA/QC đối chiếu theo tài liệu sẽ mở lỗi giả, còn v1.0.4 (`ownerPropertyIds`) không biết đâu là điểm xuất phát.
- Đề xuất sửa: giữ mã BE như hiện tại. ARC (không phải BE) sửa tài liệu: hướng dẫn mục 4.2 và G-E3 ghi "thư ⊇ thông báo trong app; bằng nhau khi 1 cơ sở". Mô tả spec chỉ sửa chữ (không đổi schema, không đổi số phiên bản), trong PR-1 nếu FE-A còn mở nhánh, nếu không thì ở v1.0.4. Việc của v1.0.4 lúc đó chỉ còn là đưa thông báo trong app ra các cơ sở khác.
- Trạng thái: Open (ARC tự làm)

### FB-R4-ARC-BE-31-02
- Mức độ: Minor
- Vị trí: `rounds/round-04/outputs/BE/v1.0.3-email.md` mục 4 Q1 (b)(c); `product/infra/server/bin/ops-check.sh:233`; runbook v1.0.3 (OPS, PR-2). Bổ sung cho `FB-R4-INT-BE-31-02`.
- Vấn đề:
  - (b) sai: `ops-check email_dead` chỉ đếm `last_error = 'NO_RECIPIENT'` (`ops-check.sh:233`). Dòng `dead BAD_TEMPLATE` do worker v1.0.2 sinh ra khi quay lui **không** hiện ở đâu cả.
  - (c) gây hiểu nhầm: trong suốt thời gian chạy v1.0.2 không có job dọn nào, nên `old_email` nằm lại **không giới hạn**, không phải "≤ 7 ngày". Khi lên lại v1.0.3, `catchUp: always` dọn bù ngay lượt đầu, nên tự lành.
- Vì sao quan trọng: thư `previous` là cảnh báo duy nhất ngoài app cho chủ hộp thư cũ (SEC 04). Mất thư mà không có số đếm thì OPS không biết để xếp lại hàng đợi.
- Đề xuất sửa:
  - BE-A: sửa câu (b)(c) trong báo cáo. Chỉ là tài liệu.
  - Quyết định ARC (trả lời INT-02 (a)), OPS ghi vào runbook PR-2:
    - Deploy theo thứ tự **migrate → worker → api**. Worker v1.0.3 chạy đúng với api v1.0.2 sau khi migrate.
    - Quay lui theo thứ tự ngược lại: **api → worker**. DB giữ nguyên.
  - OPS, runbook PR-2: sau quay lui, chạy một câu đếm READ ONLY, chỉ in số: `SELECT count(*) FROM outbox_message WHERE topic='staff.email' AND status='dead' AND last_error='BAD_TEMPLATE' AND payload->>'template'='email_changed'`. ARC đồng ý câu xếp lại hàng đợi của INT-02 (b), với hai điều kiện: chạy **sau** khi lên lại v1.0.3, và chỉ cho dòng có `created_at` trong 7 ngày.
- Trạng thái: Open

### FB-R4-ARC-FE-31-03
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/app/email.ts:51-59` (`sendWithOneKey`); `components/SecurityEmailCard.tsx:90-96`
- Vấn đề: khi mất mạng, `sendWithOneKey` gửi lại **ngay** với cùng khóa, và chỉ gửi lại một lần. Nếu lệnh đầu còn đang chạy ở server (mạng chập khi server chưa ghi xong), lần gửi lại nhận `409 IDEMPOTENCY_IN_PROGRESS`. Card khi đó báo lỗi chung dù email đã lưu. Ngoài ra, nếu lần gửi lại tới server trong khoảng giữa `strong.verify` và lúc `uow.run` giữ khóa (vài ms), nó thử lại cùng mã TOTP đã dùng → `401` và bị đếm 1 lần sai. Khoảng này có từ trước ở mọi op S2 + `Idempotency-Key` (mẫu frontdesk), BE không cần sửa.
- Vì sao quan trọng: đây đúng là ca `Idempotency-Key` được thêm vào để xử lý (rớt mạng khi lưu). Người dùng thấy lỗi, thử lại bằng mã mới và có thể tạo thêm một thư `email_changed`.
- Đề xuất sửa (FE-A, làm cùng đợt sửa chữ):
  - Khi nhận `409 IDEMPOTENCY_IN_PROGRESS` thì chờ khoảng 1,5 giây rồi gửi lại **cùng khóa**, tối đa 2 lần.
  - Sau mọi lỗi không phải lỗi trường hay lỗi S2, gọi `session.refresh()` để card hiện địa chỉ thật đang lưu.
  - Thêm 1 test MSW: lần 1 lỗi mạng, lần 2 trả 409, lần 3 trả 200 `Idempotent-Replayed`.
- Trạng thái: Open

### FB-R4-ARC-BE-31-04
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/modules/identity/internal/users.service.ts:75,277`; `users.controller.ts:119`
- Vấn đề: lý do `access.denied` (`TARGET_OWNER` / `OTHER_PROPERTY`) dựa vào việc **chính đối tượng lỗi** còn nằm trong `WeakSet` sau khi qua `uow.run`. Nhánh trước S2 có test (T4). Nhánh kiểm lại trong giao dịch (TOCTOU) chưa có test. Nếu sau này `UnitOfWork` bọc lỗi hoặc tạo lại `ProblemError`, audit sẽ âm thầm ghi `OTHER_PROPERTY`.
- Vì sao quan trọng: chỉ ảnh hưởng lý do trong audit, không ảnh hưởng phản hồi. Nhưng đây là cơ chế ngầm, khó đọc.
- Đề xuất sửa: v1.0.4: đưa lý do vào một trường nội bộ của `ProblemError`, không tuần tự hóa ra thân phản hồi, hoặc thêm 1 test cho nhánh trong giao dịch.
- Trạng thái: Open

### FB-R4-ARC-BE-31-05
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/jobs/email-dispatch.ts:64` và `modules/identity/internal/security-email.service.ts:25`
- Vấn đề: hằng `EMAIL_CHANGED_TEMPLATE = 'email_changed'` khai hai lần. `jobs/` không được import `identity/internal`, nên hai bản dễ trôi nhau.
- Đề xuất sửa: v1.0.4: cả hai lấy tên mẫu từ `STAFF_EMAIL_TEMPLATES` của `@ottimo/integrations`, nơi giữ danh sách mẫu thật.
- Trạng thái: Open

## 3. Quyết định về giả định của BE

| Mã | Nội dung | Quyết định ARC |
|---|---|---|
| G-BE-1 | Thông báo trong app chỉ ở cơ sở của phiên. Thư tới OWN của mọi cơ sở người được đổi có vai. | **Chấp nhận.** Ràng buộc RLS của `staff_notification` theo cơ sở là có thật. Thư rộng hơn là hướng an toàn. ARC sửa tài liệu (thẻ 01). ORC ghi decision-log. |
| G-BE-2 | Job `email_change.purge` ở `jobs/builtin-jobs.ts`, chạy hằng ngày theo cơ sở. | **Chấp nhận.** Hướng dẫn 4.2 cho BE chọn chỗ đặt. `jobs/` là tầng đúng, vì không phải đăng ký job chéo module. Chạy theo cơ sở trên bảng cấp tổ chức là lũy đẳng: lượt đầu làm hết, các lượt sau không còn gì. Mỗi ngày tối đa 1000 dòng × số cơ sở, quá đủ. |
| G-BE-3 | `updateUser` vẫn tăng `version` khi email trùng. Chỉ `setMyEmail` cam kết không tăng. | **Chấp nhận.** Hợp đồng 3.2 #6 chỉ nói phần email không ghi gì: không dòng đổi, audit hay thư. Mọi PATCH thành công vẫn tăng `version` (ngữ nghĩa `If-Match` có sẵn). QA không viết ca "updateUser email trùng → version giữ". |
| G-BE-4 | `staffName` truyền cho cả 3 bản, mẫu chỉ in ở bản `owner`. | **Chấp nhận cho v1.0.3.** Adapter và log không ghi params. v1.0.4 bỏ `staffName` khỏi bản `self`/`previous` theo `FB-R4-INT-BE-31-05`. |

## 4. Điểm làm tốt
- Thứ tự replay → dạng → S2 → ghi được làm đúng ở cả hai op, và test chứng minh bằng việc **dùng lại cùng mã TOTP** (T21, T7). Đây là phần khó nhất của hợp đồng này.
- Migration 0091 có bước làm sạch `''` đặt trước CHECK, đúng mẫu 0042/0043. ARC đã thử ca gãy: rollback trọn, RLS không bị để hở.
- MOB chuyển `saveMe` từ danh sách cấm sang danh sách cho phép, và dọn luôn bản cũ trên máy khi đọc. Cách này chặn được cả những trường server thêm sau này.
