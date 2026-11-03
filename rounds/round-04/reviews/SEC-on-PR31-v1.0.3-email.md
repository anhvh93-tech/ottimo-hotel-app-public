# SEC review – PR #31 `v1.0.3-email` (nháp): email nhận thư bảo mật (BUG-R3-032)

- Round 4, đợt v1.0.3, bước **Review**. Người review: SEC. Tác giả: BE-A (chính), FE-A, INT, MOB, ARC.
- Nhánh `origin/v1.0.3-email` @ `24de5895` (gộp `arc/v1.0.3-contract`, `be-a/v1.0.3-email`, `mob/v1.0.3-cache-allowlist`, `fe-a/v1.0.3-email`). Base `origin/main` @ `bcfa0961`.
- Cách kiểm: `git diff origin/main...origin/v1.0.3-email`, đọc mã trên nhánh (không checkout, không sửa, không chạy test). Đọc thêm mã liên quan đã có: `shared/http/unit-of-work.ts` (`completedReplay`, `requestHash`), `shared/secret-fields.ts`, `http.ts` (log), `platform/public/validation.ts` (`fieldErrors`), `identity/public/strong-reauth.ts`, `mfa-store.ts` (`consumeSecondFactor`), `0001_rls_grants_entry_functions.sql`, `worker.ts`, `apps/mobile/public/sw.js`, `admin-web/src/app/storage.ts`, `infra/docker-compose.prod.yml`, `ops/v1.0.3-email-alert:infra/server/bin/ops-check.sh`.
- Đối chiếu: `rounds/round-04/reviews/SEC-on-v1.0.3-contract-email.md` (thẻ 01–15), báo cáo `rounds/round-04/outputs/BE/v1.0.3-email.md`.

**Kết luận: ĐẠT CÓ ĐIỀU KIỆN.**

Cả 5 thẻ Major (01, 02, 04, 05, 06) và thẻ 03 của ARC đã xong trên mã thật, có test đúng ca SEC đòi. Không có Blocker. Không còn Major mở. Không thấy địa chỉ email trong log, audit, outbox, params, Problem, URL hay toast.

**Điều kiện** (không chặn gộp PR #31, **chặn deploy v1.0.3 lên production**): thẻ 09 chỉ được dời giới hạn cứng sang v1.0.4 khi có **chỉ số đếm trong `ops-check`** (thẻ mới PR31-01, OPS). Lý do: ngoài rủi ro relay, SEC thấy thêm một hệ quả. Dispatcher lấy **10 dòng/phút/cơ sở, theo thứ tự FIFO**. Một đợt dội lệnh đổi email sẽ làm **trễ mọi thư bảo mật khác** hàng giờ (mục 3).

---

## 1. Trạng thái các thẻ cũ (SEC-on-v1.0.3-contract-email)

| Thẻ | Mức | Kiểm trên mã | Trạng thái SEC |
|---|---|---|---|
| 01 | Major | `security-email.controller.ts` dòng 46: `uow.completedReplay(req)` chạy **trước** `parseBody`, `check`, S2. `requestHash` dùng `withoutSecrets` (bỏ `password`, `totpCode`), nên cùng khóa + cùng thân thì nhận lại phản hồi cũ. T21 gửi lại **cùng** TOTP → 200 `Idempotent-Replayed`, không `stepup.*`, không đếm sai, 1 dòng đổi. | **Closed** |
| 02 | Major | `users.controller.ts` `update`: khi có `email`, chạy `precheckEmail` READ ONLY (404 → 422 tự đổi → 403 đích OWN → 403 khác cơ sở), rồi `check` (422), **rồi** S2. `users.service.update` kiểm lại `assertNotOwnerAccount` + `assertOwnsEveryProperty` trong giao dịch, trên dòng đã khóa `load(..., true)`. T4/T5/T22 không có `stepup.s2_*`. | **Closed** |
| 03 | Minor (ARC) | Hướng dẫn mục 3.1 (bước 2b), 3.2, mục 6 và bảng test T21–T25 đã cập nhật (`60eb82c6`). | **Closed**. Còn lệch tài liệu ở G-E3, xem PR31-04 |
| 04 | Major | `email-dispatch.ts`: `previous` được gom vào danh sách **trước** nhánh `NO_RECIPIENT`. Bỏ trùng theo địa chỉ. `finish` đặt `old_email = NULL` cả khi `dead`. T23 (OWN duy nhất xóa email) và T24 (adapter từ chối X) xanh. | **Closed** |
| 05 | Major | `shared/email.ts` `normalizeSecurityEmail`: chỉ ASCII in được, đúng một `@`, phần tên `[a-z0-9._%+-]{1,64}`, ≥ 2 nhãn, TLD chữ, 3–254 ký tự. Chặn CRLF/`Bcc:` (chống chèn header). Một bảng ca chạy qua V-03, `isEmailAddress` và `redactText`. Cả hai op cùng dùng `SecurityEmailService.check`. CHECK DB `app_user_email_check` là lớp chặn thêm. | **Closed**. Adapter vẫn rộng hơn (nhận Unicode), nhưng an toàn vì không còn đường ghi `app_user.email` nào khác (`createUser`, `production-bootstrap`, seed đều không ghi email thật). Đã kiểm. Gợi ý v1.0.4 ở PR31-07 |
| 06 | Major (MOB) | `apps/mobile/src/data/cache.ts` `cacheableMe`: dùng **danh sách cho phép** (`id`, `displayName`, `activePropertyId`, `properties[]` với 7 trường). `loadMe` lọc lại và **ghi đè** bản cũ có `email`. Bản hỏng thì xóa. Test dump IndexedDB không có `@`. `sw.js` không lưu `/v1/*` vào Cache Storage. | **Closed** |
| 07 | Minor | Dispatcher: OWN = OWN active của **mọi cơ sở** người được đổi có vai, cộng cơ sở của dòng outbox. `user_property_role` là bảng cấp tổ chức (0001), nên truy vấn thấy đủ. Thông báo trong app vẫn chỉ ở cơ sở của phiên (G-BE-1). Tập người nhận thư **chứa** tập người nhận thông báo trong app. SEC chấp nhận: lệch theo hướng báo **nhiều hơn**, an toàn hơn đề xuất ban đầu. | **Accepted (Done một phần)**, với điều kiện: ghi G-BE-1 vào decision-log, sửa G-E3 (PR31-04), thêm test (PR31-05) |
| 08 | Minor | `setOwn`: `SELECT … FOR UPDATE`. `updateUser`: `load(..., true)`. Hai đường cùng khóa dòng `app_user`, nên chạy tuần tự. Có test song song. | **Closed** |
| 09 | Minor | Chưa làm. Xem mục 3. | **Deferred v1.0.4 – chấp nhận CÓ ĐIỀU KIỆN** (PR31-01 trước deploy) |
| 10 | Minor (ARC) | erd 4.16 + mục 12 có thêm dòng `idempotency_key.response_body` và bản sao lưu. | **Closed**. Câu "runbook chạy J16" sai tên job, xem PR31-04 |
| 11 | Minor | T7: thân 422 không có `@`. T4: `access.denied.after` không có `@`. T6: outbox, `staff_notification`, SSE-push, audit không có địa chỉ. T9: outbox chỉ có id. `fieldErrors` chỉ trả `field` + `code`, không trả giá trị (kể cả khóa lạ của `.strict()`). | **Closed** |
| 12 | Suggestion (INT) | Có `via`, có câu chống lừa đảo ở cả 3 bản, `previous` có "do not reply", tiêu đề cố định không có tên. Bản `self`/`previous` không có dữ liệu do người dùng nhập. Mọi tham số qua `escapeHtml`. | **Closed** |
| 13 | Minor (FE) | (a) `secmail.purpose` nằm ngay dưới ô nhập ở cả `SecurityEmailCard` và `UserEmailDialog` (VI + EN). (b) Câu báo đã đổi thành "Thư thông báo", không còn "xác nhận". Có câu "kiểm tra Spam sau 15 phút". Chuyển trang dùng `#security-email`, không có địa chỉ trong URL. Toast `users.email_saved/removed` chỉ có `{name}`. Không có `console.*`. Web Storage chỉ giữ cờ giao diện. | **Closed** |
| 14 | Suggestion | Hai nhánh 403 cùng `problem('FORBIDDEN_ACTION', { detail: 'other property' })`. T22 so **toàn bộ** thân với T4 (bỏ `requestId`): giống nhau. `access.denied.reason` = `TARGET_OWNER` / `OTHER_PROPERTY` (qua `WeakSet`, không lộ ra ngoài). | **Closed** |
| 15 | Suggestion (PO) | Ngoài phạm vi PR. | Open – backlog v1.1 |

## 2. Các điểm kiểm thêm

| Điểm | Kết quả | Bằng chứng |
|---|---|---|
| Không có email trong **params** thư | Đạt | Dispatcher chỉ truyền `audience`, `via`, `staffName`, `occurredAt`. `staffName` theo V-01 (không cho phép `@`). `idempotencyKey` = `<outboxId>:<emailChangeId>`. `sentUserIds` của bản `previous` là `emailChangeId` |
| … trong **log** | Đạt | `http.ts` chỉ log method, mẫu route, status, thời gian, không log body. Dispatcher log id, mẫu, mã lỗi. T16 (mức trace) không có `@` |
| … trong **audit** | Đạt | Chỉ `emailMasked` (`o***@e***.test`) + `via`. Allowlist `app_user` thêm đúng 2 khóa |
| … trong **URL** | Đạt | `PUT /v1/me/email` (thân), `PATCH /v1/users/{id}`. FE dùng hash `#security-email` |
| … trong **toast / Problem** | Đạt | Xem thẻ 11, 13 |
| 403 đích OWN = 403 khác cơ sở | Đạt | Thẻ 14. Không có kênh dò qua thân. Thứ tự 404 → 422 → 403 → 403 không cho biết thêm gì người gọi chưa biết |
| Lỗi reauth | Đạt | Thiếu `reauth` → 422 `STRONG_REAUTH_REQUIRED` (`field: reauth`), không đếm (T1). Có 2FA mà thiếu mã → 422 (`reauth.totpCode`), không đếm, không thử mật khẩu (T7-TOTP). Sai → 401 `REAUTH_FAILED`, đếm SR-RL-02, đúng thì đếm về 0 (T2). Bị khóa → 429 |
| TOTP replay | Đạt (cơ chế chung) | `consumeSecondFactor`: `mfa_last_used_step` + `lockUser FOR UPDATE`, nên một bước TOTP chỉ dùng được một lần, kể cả khi chạy song song (đã test ở `mfa-us143` ca 4). Lệnh bị từ chối trước S2 không tiêu mã (T7-TOTP). Gửi lại cùng khóa thì trả phản hồi cũ, không chạm S2 (T21). **Thiếu** ca riêng cho `setMyEmail`: khóa mới + mã đã dùng phải ra 401 (PR31-05) |
| `old_email` bị xóa khi `finish` | Đạt | `finish`: dòng outbox sang `done`/`dead` (kể cả `NO_RECIPIENT`, `BAD_TEMPLATE`) → `old_email = NULL, old_notified_at`, **cùng** giao dịch, chỉ khi còn giữ lease (`rowCount > 0`). T10, T23 |
| … khi purge 7 ngày | Đạt | `EMAIL_CHANGE_PURGE_JOB`: daily 03:00, `catchUp: always`, lô 1000 `FOR UPDATE SKIP LOCKED`, `purge_journal` chỉ có id. Không DELETE. T19 (8 ngày → NULL, 2 ngày giữ) |
| RLS `user_email_change` | Đạt | ENABLE + FORCE. `tenant_isolation` theo `app_current_org()`, có cả USING và WITH CHECK. Cấp tổ chức, như `app_user`. `ottimo_app`: SELECT/INSERT/UPDATE, **không** DELETE. Không có API nào đọc bảng này. Dispatcher đọc theo `id AND user_id`. T18 kiểm tổ chức khác thấy 0 dòng. Test kiến trúc tự bao bảng mới. Migration tắt RLS `app_user` cho một lệnh UPDATE rồi bật lại ENABLE + FORCE, trong giao dịch của migrator (mẫu 0042/0043): chấp nhận |
| PWA không lưu email vào IndexedDB | Đạt | Thẻ 06 |
| Test chỉ dùng `@example.test` | **Chưa đạt đúng chữ** (Minor) | Đa số dùng `addr(...)@example.test`. Còn sót: `be-a-v103-email-units.test.ts` có `fd.le+desk@mail.example.vn`, `a_b-c%d@sub-1.example.co`, `"x"@y.vn`, `nguyễn@x.vn`, `owner@exämple.test`. `v103-security-email.test.ts` có `"x"@y.vn`, `nguyễn@x.vn`. `shared/email.ts` có `info@x.vn` trong chú thích. Các địa chỉ này chỉ qua hàm thuần hoặc bị 422, **không** được lưu hay gửi đi. Rủi ro thực tế bằng 0, nhưng `.vn`/`.co` là tên miền thật. Xem PR31-03 |
| Không trùng chữ ví dụ giao diện | Ghi chú | `secmail.invalid` lấy ví dụ `name@domain.com` (tên miền thật, có bán dịch vụ email). Không phải lỗi bảo mật. UXD/CPY cân nhắc đổi thành `name@example.com` |
| `EMAIL_FROM` có tới api | Đạt | `docker-compose.prod.yml`: `x-api-env` có `EMAIL_FROM`, dùng chung cho `api` và `worker` |
| `Cache-Control` | Đạt phần chính | `getMe`, `login`, `setMyEmail` có `no-store`. `listUsers`/`updateUser` (nay có email người khác) chưa có. Xem PR31-08 |

## 3. Relay bị lợi dụng gửi "Security notice" tới địa chỉ lạ (trả lời thẻ 09)

**Kênh tấn công**: `setMyEmail` có `x-roles: [any_staff]`. HK/MT/FD không bắt buộc 2FA, nên S2 của họ **chỉ cần mật khẩu**. Không giới hạn số lần đổi thành công. Rate limit chung là 600 lệnh/phút/người (`STAFF_REQUESTS_PER_MINUTE`). Mỗi lần đổi sinh 1 dòng outbox, gửi tới: địa chỉ mới (do người gõ chọn), địa chỉ cũ (cũng do họ chọn lần trước), và mọi OWN. Người tấn công: nhân viên nghịch, hoặc kẻ có mật khẩu của một tài khoản nhân viên.

**Không lợi dụng được nội dung**: bản `self`/`previous` là chữ cố định, không có trường nào do người gõ nhập. `staffName` chỉ có ở bản `owner`, đã escape và không cho phép `@`. Địa chỉ chặn CRLF, dấu phẩy, nhiều `@`, nên không chèn được header hay thêm người nhận. Không có link. Relay **không** thành công cụ phishing có nội dung tùy ý.

**Hậu quả còn lại**:
1. Thư "Security notice" từ `ottimo.vn` tới địa chỉ bất kỳ (quấy rối, spam). Ảnh hưởng uy tín tên miền. Google có thể giới hạn hoặc treo relay đúng lúc kênh này cần chạy.
2. Dội thư và thông báo trong app vào OWN, làm thư thật bị chìm.
3. **Mới (SEC thấy khi đọc mã)**: `StaffEmailDispatcher` lấy `LIMIT 10`, `ORDER BY created_at`, tick 60 giây (`worker.ts`). 600 lệnh đổi trong 1 phút tạo hàng đợi khoảng 60 phút. Mọi thư bảo mật khác của cơ sở đó (`receiving_account_changed`, `mfa_reset`, `recovery_code_used`…) bị trễ theo. Một chuỗi đáng lo: kẻ có OWN đổi tài khoản nhận tiền, đồng thời dùng mật khẩu một HK dội hàng đợi. Thư báo cho OWN thật có thể tới **sau** ngày hiệu lực.

**Yếu tố giảm nhẹ**: phải đăng nhập và có mật khẩu đúng mỗi lần (argon2). Mỗi lần đổi đều để lại audit `user.email_changed` và thông báo **trong app** tới OWN ngay lập tức (không qua hàng đợi thư), nên rất dễ thấy. Production có 1 cơ sở và ít nhân viên. OWN khóa tài khoản là dừng được.

**Quyết định SEC về thẻ 09** (trong quyền SEC; đề nghị ORC ghi decision-log):
- **Chấp nhận** dời giới hạn cứng sang v1.0.4, **chỉ khi** trước deploy v1.0.3 lên production đã có **chỉ số đếm trong `ops-check`** (PR31-01). Không có chỉ số này thì SEC không đồng ý deploy.
- v1.0.4, **việc đầu tiên** của phần email: 5 lần đổi thành công / người được đổi / 24 giờ → `429 RATE_LIMITED`, đếm trên `user_email_change` (đã có `user_id`, `changed_at` và chỉ mục). Cộng một trần theo tổ chức, ví dụ 30 lần / 24 giờ. Khoảng 15 dòng mã và 2 test. Nếu BE-A còn thời gian trong PR #31, SEC **khuyến nghị làm luôn**.
- Ghi vào rủi ro còn lại: "Không giới hạn số lần đổi email thành công. Dội lệnh có thể làm trễ thư bảo mật khác. Phát hiện bằng `ops-check email_changes`. Chặn cứng ở v1.0.4."

---

## 4. Thẻ feedback mới

### FB-R4-SEC-OPS-PR31-01
- Mức độ: **Minor – điều kiện trước deploy production v1.0.3** (cho OPS, PR #30 `ops/v1.0.3-email-alert`)
- Vị trí: `product/infra/server/bin/ops-check.sh` (đang có `email_dead`, `email_missing`; chưa có gì về `user_email_change` hay hàng đợi thư)
- Vấn đề: Thẻ 09 dời sang v1.0.4. Hiện không có cách nào phát hiện việc dội lệnh đổi email, hay hàng đợi `staff.email` bị nghẽn (mục 3).
- Vì sao quan trọng: Nếu không phát hiện, một nhân viên chỉ cần mật khẩu của mình là có thể làm trễ mọi thư bảo mật hàng giờ và làm hỏng uy tín relay.
- Đề xuất sửa: Thêm check `email_changes` (READ ONLY qua `psql_ro`, chỉ in số, không in id hay địa chỉ):
  ```sql
  SELECT count(*), coalesce(max(n), 0) FROM (
    SELECT user_id, count(*) AS n FROM user_email_change
     WHERE changed_at > now() - interval '24 hours' GROUP BY user_id) s;
  SELECT count(*), coalesce(extract(epoch FROM now() - min(created_at))::int, 0)
    FROM outbox_message WHERE topic = 'staff.email' AND status IN ('pending', 'failed', 'in_flight');
  ```
  FAIL khi một người > 5 lần/24 giờ, hoặc tổng > 20/24 giờ, hoặc thư `staff.email` cũ nhất còn chờ > 30 phút. Báo bằng câu cố định, như các check khác. Có ca trong `infra/ci/test-ops-check.sh`. Runbook v1.0.3 thêm cách xử lý: khóa tài khoản đang dội, báo SEC. Không tự xóa dòng outbox.
- Trạng thái: Open

### FB-R4-SEC-BE-PR31-02
- Mức độ: Minor (cho BE-A; dời v1.0.4 được)
- Vị trí: `jobs/email-dispatch.ts`, vòng bỏ trùng `for (const rc of [...self, ...previous, ...ownerCopies])`
- Vấn đề: Bỏ trùng theo thứ tự self → previous → owner. Email không unique và không xác minh, nên HK có thể đặt email của mình **bằng địa chỉ của OWN**. Khi đó OWN chỉ nhận bản `self` ("This address will now receive security notices for your OTTIMO Desk account"). Bản `owner` (có tên người được đổi) bị bỏ. OWN dễ hiểu nhầm là tài khoản **của mình** bị đổi. Ca tương tự: `previous` trùng địa chỉ OWN.
- Vì sao quan trọng: Thư bảo mật tới OWN mất thông tin "ai bị đổi", đúng thông tin OWN cần để xử lý. Chữ gây hoang mang còn mở đường cho lừa đảo kiểu "gọi lại để xác nhận".
- Đề xuất sửa: Khi một địa chỉ vừa thuộc bản `self`/`previous`, vừa là email của một OWN active **khác** người được đổi, giữ bản `owner`. Không thêm kiểm "trùng email OWN" lúc lưu: kiểm đó tạo kênh dò email OWN. Test: HK đặt email = email OWN-B → OWN-B nhận đúng 1 bản `owner`.
- Trạng thái: Open

### FB-R4-SEC-BE-PR31-03
- Mức độ: Minor (cho BE-A)
- Vị trí: `services/api/test/be-a-v103-email-units.test.ts` dòng 15, 16, 28, 29; `test/integration/v103-security-email.test.ts` dòng 200–201; `src/shared/email.ts` dòng 8, 35 (chú thích)
- Vấn đề: Quy ước của đội là địa chỉ trong test chỉ dùng `@example.test`. Còn sót `mail.example.vn`, `sub-1.example.co`, `y.vn`, `x.vn`. Đây đều là tên miền thật hoặc có thể đăng ký được.
- Vì sao quan trọng: Hôm nay không gửi đi đâu (hàm thuần, hoặc bị 422). Nhưng bảng ca hợp lệ có thể bị dùng lại trong test có SMTP thật (staging, `mail-test`) ở round sau. Giữ quy ước tuyệt đối thì gitleaks/rà PII mới không phải đoán.
- Đề xuất sửa: Đổi thành `fd.le+desk@mail.example.test`, `a_b-c%d@sub-1.example.test`, `"x"@example.test`, `nguyễn@example.test`; chú thích `OTTIMO <info@example.test>`. Ca `a@b.c,d@e.f` giữ nguyên (`.c`, `.f` không phải TLD).
- Trạng thái: Open

### FB-R4-SEC-ARC-PR31-04
- Mức độ: Minor (cho ARC; ORC ghi decision-log)
- Vị trí: `rounds/round-04/outputs/ARC/v1.0.3-contract-email.md` G-E3 (dòng 244); `product/docs/erd.md` mục 12, dòng "bản sao lưu" (dòng 1567)
- Vấn đề: (a) G-E3 ghi: thư `owner` và thông báo trong app cùng một tập, là OWN của cơ sở ghi trên dòng outbox. Mã BE làm rộng hơn: thư tới OWN của mọi cơ sở (G-BE-1). (b) erd 12 ghi: sau khôi phục, "runbook chạy J16" để dọn `old_email`. Thật ra việc dọn là job `email_change.purge` trong `BUILTIN_JOBS` (G-BE-2), `catchUp: always`, không phải J16.
- Vì sao quan trọng: Runbook khôi phục và hồ sơ hạn giữ (ESC-001) phải đúng với mã. Nếu theo chữ, OPS sẽ đi tìm J16.
- Đề xuất sửa: (a) Viết lại G-E3 theo G-BE-1 (tập thư chứa tập thông báo trong app; v1.0.4 làm thông báo trong app theo mọi cơ sở). (b) erd 12: "job `email_change.purge` (daily, catchUp) chạy khi worker lên lại". OPS kiểm job này có trong `job_run` sau khi khôi phục. Ghi G-BE-1, G-BE-2 vào decision-log.
- Trạng thái: Open

### FB-R4-SEC-BE-PR31-05
- Mức độ: Minor (cho BE-A)
- Vị trí: `test/integration/v103-security-email.test.ts`
- Vấn đề: Còn thiếu 2 ca. (a) Thẻ 07: không có test OWN **chỉ** ở cơ sở 2 nhận bản `owner` khi nhân viên đa cơ sở tự đổi email lúc đang mở cơ sở 1 (fixture dispatch chỉ có 1 cơ sở). (b) TOTP replay riêng cho `setMyEmail`: sau một lần lưu thành công, lệnh **khóa mới + cùng mã** phải ra 401 `REAUTH_FAILED` và đếm 1. Hiện T21 chỉ thử cùng khóa.
- Vì sao quan trọng: (a) Phần vượt v1.0.4 của thẻ 07 chưa có gì giữ, dễ hỏng âm thầm khi sửa truy vấn `ownerScope`. (b) Khóa đúng ca ngược với T21, tức `completedReplay` không được thành đường vòng qua S2.
- Đề xuất sửa: Thêm 2 ca trên. Ca (b) kiểm thêm: không có dòng `user_email_change` thứ hai.
- Trạng thái: Open

### FB-R4-SEC-BE-PR31-06
- Mức độ: Suggestion (cho BE-A)
- Vị trí: `security-email.service.ts` `check` (`email === this.sharedMailbox`)
- Vấn đề / góp ý: Google Workspace giao `info+abc@ottimo.vn` vào hộp `info@`. So khớp chính xác nên địa chỉ có `+tag` của hộp chung lọt qua `EMAIL_SHARED_MAILBOX`.
- Vì sao quan trọng: Đây là chốt chống **nhầm** (B2-readiness 1.4), không phải ranh giới bảo mật. Người cố ý thì có thể gõ bất kỳ địa chỉ nào.
- Đề xuất sửa: So sánh sau khi bỏ phần `+…` của phần tên ở cả hai phía. Thêm ca `info+x@example.test` → 422.
- Trạng thái: Open

### FB-R4-SEC-INT-PR31-07
- Mức độ: Suggestion (cho INT, v1.0.4)
- Vị trí: `integrations/notification/smtp.ts` `EMAIL_RE` / `isEmailAddress`
- Vấn đề / góp ý: Thẻ 05 đóng vì mọi địa chỉ chỉ vào DB qua `normalizeSecurityEmail`. Nhưng adapter vẫn nhận Unicode, mà bộ che log thì không che được Unicode. Nếu sau này có đường ghi khác (nhập CSV, SQL tay), tính chất "adapter ⊆ bộ che" không còn.
- Đề xuất sửa: Như BE đề nghị: `isEmailAddress` gọi lại cùng luật (hoặc luật ASCII tương đương), giữ bảng ca chung.
- Trạng thái: Open

### FB-R4-SEC-BE-PR31-08
- Mức độ: Suggestion (cho BE-A)
- Vị trí: `users.controller.ts` (`listUsers`, `updateUser`, `createUser`, `setUserRoles`)
- Vấn đề / góp ý: (a) Từ 0.3.10, `User` có email của người khác (C2), nhưng các phản hồi `users.*` không có `Cache-Control: no-store`. `getMe`/`setMyEmail` thì có. (b) `updateUser` không gọi `completedReplay` trước S2. Mạng chập rồi gửi lại cùng mã thì ra 401 và bị đếm. Hiện FE `UserEmailDialog` không tự gửi lại nên chưa xảy ra.
- Đề xuất sửa: (a) Thêm `no-store` cho 4 op `users.*`. (b) Khi nào `updateUser` có `Idempotency-Key`, làm như `setMyEmail`. Không chặn.
- Trạng thái: Open

---

## 5. Việc trước khi gộp / trước khi deploy

| Mốc | Việc | Ai |
|---|---|---|
| Gộp PR #31 | Không còn điều kiện SEC. PR31-02, 03, 05 nên làm trong PR nếu kịp; không kịp thì trả lời Deferred kèm số backlog | BE-A |
| Gộp PR #31 | Ghi G-BE-1, G-BE-2 và quyết định SEC về thẻ 09 vào `decision-log.md` | ORC |
| **Deploy production v1.0.3** | **PR31-01**: `ops-check email_changes` + tuổi hàng đợi `staff.email`, có test CI, có dòng runbook | OPS |
| Deploy production v1.0.3 | Cổng 2.10 giữ nguyên: INV xác nhận đã nhận thư `email_changed`, rồi mới bật `EMAIL_NO_RECIPIENT_ALERT` | OPS + INV |
| Bước Phản hồi & sửa | PR31-04 (tài liệu) | ARC |

**SEC còn nợ** (từ review hợp đồng, chưa thấy trên `main` lẫn nhánh; SEC làm ở bước Phản hồi & sửa, không chặn PR):
- `security-requirements.md`: bất biến "email nhân viên không phải yếu tố xác thực hay khôi phục cho tới khi có `emailVerifiedAt`". Đóng SEC-on-B2-readiness 1.5 #3.
- `data-risk-assessment.md`: dòng D27 thêm email nhận thư bảo mật. Thêm câu hỏi luật sư (cơ sở pháp lý cho email nhân viên, chuyển dữ liệu qua Google Workspace) vào danh sách gom cho ESC-001. Thêm rủi ro còn lại của thẻ 09.

QA staging (bổ sung bộ ca SEC của tech plan 2.12):
- dump IndexedDB PWA sau đăng nhập không có `@`;
- gửi lại cùng khóa + cùng mã → 200 replay;
- khóa mới + mã đã dùng → 401;
- OWN duy nhất xóa email → thư `previous` tới địa chỉ cũ;
- `ops-check email_changes` ra FAIL khi đổi 6 lần trong 24 giờ (dùng `@example.test`, mock SMTP).

## 6. Điểm làm tốt (nên giữ)

- Thứ tự kiểm **replay → dạng → đọc trước 403 → S2 → giao dịch có kiểm lại** được làm đúng và có test cho từng bước, gồm chứng minh "không tiêu mã TOTP" bằng cách dùng lại chính mã đó. Đây là mẫu tốt cho mọi op S2 sau này.
- Một hàm `normalizeSecurityEmail` duy nhất, với một bảng ca chạy qua cả ba lớp (API, adapter, bộ che log). Thêm CHECK DB làm lớp cuối. Chặn luôn CRLF và `Bcc:`.
- PWA chuyển sang danh sách cho phép và **tự làm sạch** bản cache cũ khi đọc, nên máy dùng chung không giữ email tới lần đăng nhập sau.
