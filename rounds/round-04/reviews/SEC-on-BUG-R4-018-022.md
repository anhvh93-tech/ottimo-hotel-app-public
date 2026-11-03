# SEC review – bản sửa BUG-R4-018 / 019 / 022 (v1.0.3)

- Round 4, đợt v1.0.3, bước **Review**. Người review: SEC. Tác giả: BE-A.
- Nhánh `be-a/v1.0.3-email` @ `ead8ac83`, so với `d6fcb6c4`. Bản này đã gộp vào `v1.0.3-email` (`0b00e1dd`).
- Cách kiểm:
  - Đọc `git diff d6fcb6c4 ead8ac83` và báo cáo BE `rounds/round-04/outputs/BE/v1.0.3-email.md` mục 10.
  - Đọc mô tả lỗi QA (`origin/qa/v1.0.3-email:rounds/round-04/qa/bug-list.md`).
  - Đọc thêm mã liên quan trên nhánh: `serialize.interceptor.ts`, `serializer.ts` (`responseShapeFor`, `serializeSchema`), `generated/openapi-schemas.ts` + `openapi-meta.ts`, `mfa.controller.ts`, `mfa.service.ts`, `security-email.controller.ts` + `.service.ts`, `auth.controller.ts`, `unit-of-work.ts` (`completedReplay`), `http.ts` (logger), `c3-access-gate.ts`, `apps/mobile/src/data/cache.ts`, `apps/mobile/public/sw.js`, `admin-web/src/components/RecoveryCodes.tsx`, `docs/api/openapi.yaml` (`StrongReauth`).
  - Không checkout. Chạy `test/serializer.test.ts` trên một bản `git archive` của `HEAD` (có `ead8ac83`) trong thư mục tạm, kèm 5 phép đột biến (mục 4). Không chạy test tích hợp cần PostgreSQL. Kết quả DB lấy từ báo cáo BE.

**Kết luận: ĐẠT.** Không có Blocker, không có Major. Có 2 thẻ Minor (BE, ARC) và 2 Suggestion (BE), đều dời được sang v1.0.4.

**`recoveryCodes`: SEC chấp nhận** đưa `confirmMy2fa.recoveryCodes` và `regenerateMyRecoveryCodes.recoveryCodes` vào `SELF_DATA_FIELDS`. Đây là quyết định kỹ thuật thuộc quyền SEC, không cần ESC. Lý do ở mục 2.

---

## 1. Có lộ dữ liệu người khác qua `SELF_DATA_FIELDS` không

**Kết luận: không có đường nào.** Miễn trừ gắn theo khóa `<owner>.<property>`. `owner` chỉ có giá trị ở hai chỗ:
- Cấp đầu của phản hồi: `serializeResponse` truyền `operationId`.
- Khi đi qua `ref`: `owner` = tên schema đích.

Mọi thuộc tính con đều đi với `owner = null`. Nhánh `array` cũng gọi `walk` không có `owner`.

| Đường có thể lộ | Kết quả | Bằng chứng |
|---|---|---|
| Schema lồng | Không lộ | `email` của object inline lồng bên trong thì không được miễn. Nếu nằm trong `ref` khác thì `owner` là tên schema đó (`PropertySummary`, `User`…), không có trong danh sách. `Me.properties[]` là object inline, không có trường mã D |
| Op khác trả `Me` | Không lộ hôm nay, có test chặn | Trong `OPENAPI_SCHEMAS.responses`, chỉ `getMe`, `login`, `loginMfa` trả `ref Me`. Không schema nào tham chiếu `Me`. Cả ba op chỉ trả `Me` của chính phiên (`me.build` theo `p.userId`, hoặc người vừa đăng nhập). `loginMfa` chỉ trả `Me` sau khi đủ yếu tố thứ hai |
| `allOf` / ghép schema | Không lộ (đóng mặc định) | `gen-openapi-meta.mjs` dàn phẳng `allOf` thành object inline. Một op mới dùng `allOf: [$ref Me, …]` sẽ có khóa `<op>.email`, không có trong danh sách, nên vẫn bị ẩn |
| `User` cùng tên trường `email` | Không lộ | Khóa là `User.email`, không có trong danh sách. `User.email` còn có `x-visible-to: [owner]`, lớp này kiểm **trước** mã D và không được nới. Test 3 xác nhận HK, MT, SAL, CTV, MGR, FD đều không thấy |
| Phản hồi lỗi | Không lộ | Lỗi không qua serializer (`ProblemFilter`). `OPENAPI_SCHEMAS.responses` chỉ có hình 2xx. Lỗi của `setMyEmail` chỉ có `field` + `code` (`EMAIL_INVALID`, `EMAIL_SHARED_MAILBOX`), không lặp giá trị. Không có kiểm trùng email giữa người dùng, nên không dò được email của người khác |
| Idempotent replay (`setMyEmail`) | Không lộ | `completedReplay` lọc theo `principal_type = 'user' AND principal_id = <người gọi>`. Người khác dùng cùng `Idempotency-Key` không nhận được phản hồi đã lưu |
| SSE / outbox (`serializeSchema`) | Không lộ | Trong `src/` không có nơi nào gọi `serializeSchema` (chỉ có interceptor gọi `serializeResponse`) |
| Trùng tên khóa giữa op và schema | Lý thuyết | Khóa op viết camelCase, schema viết PascalCase. Chỉ trùng khi có schema tên `setMyEmail`… Xem Suggestion 02 |

Danh sách hôm nay đúng bằng tập trường mã D trực tiếp của các op `/v1/me*` (SEC đã liệt kê từ `openapi-meta`):
- `setMyEmail.email`
- `startMy2faSetup.otpauthUri`
- `confirmMy2fa.recoveryCodes`
- `regenerateMyRecoveryCodes.recoveryCodes`

Cộng thêm `Me.email`, là trường mã D duy nhất của `Me`. Không có trường nào thừa.

Rủi ro còn lại (Low, chấp nhận): ai có mật khẩu của một nhân viên chưa bật 2FA thì đăng nhập được và xem được email bảo mật của người đó. Đây là dữ liệu của chính tài khoản, và OWN, MGR, FD đã như vậy từ v1.0.3. Không đổi được email nếu không qua S2.

## 2. `recoveryCodes` và `otpauthUri`: chỉ cho chính chủ, không log, không cache

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| Chỉ chính chủ | Đạt | Cả ba op nằm dưới `/v1/me/2fa*`, `roles: any_staff`, dùng `p.userId` của phiên. Không op nào nhận `userId` từ ngoài. `resetUser2fa` (OWN cho người khác) trả 204, không trả mã |
| Một lần | Đạt | `confirm` trả 10 mã một lần. Gọi lại khi đã bật → 409. `regenerate` cần S2 và tạo bộ mới, bộ cũ hết hiệu lực ngay (`UPDATE … mfa_recovery_codes_hash`). Lưu trên DB là bản băm (`hashRecoveryCodes`). `startSetup` cần `currentPassword` (đếm SR-RL-02). Khi 2FA đã bật, chỉ cho phép từ phiên đăng nhập bằng mã khôi phục (`mfa.service.ts` dòng 120). `getMy2fa` không trả bí mật |
| C3 vẫn chặn | Đạt | `otpauthUri` và `recoveryCodes` có `c3: true`. Ba op có `c3Log: true`. Test 2 xác nhận: thiếu `c3` thì vẫn bỏ, kể cả với chính chủ |
| `Cache-Control: no-store` | Đạt | `mfa.controller.ts`: `startSetup`, `confirm`, `regenerate`, `getMy2fa`, `loginMfa` đều đặt `no-store`. `auth.controller.ts`: `login`, `getMe` cũng vậy. `security-email.controller.ts` đặt `no-store` **trước** nhánh replay. Không có `Pragma: no-cache`, xem Suggestion 04 |
| Không qua kho idempotency | Đạt | Ba op 2FA có `idempotencyKey: false`. `setMyEmail` lưu `{email}` vào `idempotency_key.response_body`. Đây là dữ liệu C2 của chính chủ, đã ghi ở erd 12 (thẻ 10 cũ) |
| Không ghi log | Đạt | Logger `http.ts` chỉ ghi `req` gồm id, method, route và `res.statusCode`, không ghi thân. Audit `mfa.setup_started`, `mfa.recovery_codes_regenerated`, `stepup.s2_*` không có giá trị |
| Không lưu trên thiết bị | Đạt | `sw.js` không cache `/v1/*`. PWA `cacheableMe` (đã có trên `v1.0.3-email`) dùng danh sách cho phép, không chép `email`. Bản sửa này làm HK/MT/SAL/CTV, nhóm dùng PWA chính, **lần đầu** nhận `Me.email`, nên điều kiện này bắt buộc. Đã kiểm `HEAD` có cả hai. Mã khôi phục chỉ hiện trên admin-web (`RecoveryCodes.tsx`): tải `.txt` và in đều làm ở trình duyệt, không dùng Web Storage |

**Vì sao chấp nhận `recoveryCodes`:**
- Đây là bí mật **của chính người gọi**, tạo ra cho người gọi. D27 bảo vệ danh bạ và nhật ký của **người khác**, không phải bí mật này.
- Mọi lớp khác vẫn giữ: C3, `no-store`, bản băm, S2 khi tạo lại, audit không giá trị.
- Bỏ `recoveryCodes` mà vẫn trả `otpauthUri` thì tệ hơn về bảo mật. HK bật 2FA xong nhưng không có mã khôi phục, mất điện thoại là tự khóa tài khoản. Khi đó phải nhờ OWN `resetUser2fa`, và đó là đường khôi phục yếu hơn (dựa vào người, dễ bị lừa qua điện thoại).
- SEC 06.13 (mã hiện một lần, tải hoặc in) chỉ đạt được khi mã tới tay người dùng.

## 3. Thiếu mật khẩu → 422 `STRONG_REAUTH_REQUIRED`, không đếm

| Câu hỏi | Kết quả | Bằng chứng |
|---|---|---|
| Có đếm vào khóa không | Không đếm | `verify` trả 422 ngay dòng đầu, **trước** `keyContext`, `lockUser`, kiểm khóa, kiểm TOTP. Không `UPDATE approval_pin_*`, không audit `stepup.s2_failed`. Test tích hợp đã kiểm 3 thân `{totpCode}`, `{password: ''}`, `{}`: `failures = 0`, `stepups = 0`, `changes = 0` |
| Có dùng để dò được không | Không | Ca thiếu mật khẩu không đọc DB, không so TOTP, không dùng mã khôi phục, không lấy khóa idempotency (S2 chạy trước `uow.run`). Phản hồi luôn giống nhau, kể cả khi tài khoản đang khóa. Người gọi không biết thêm gì: không biết TOTP đúng hay sai, không biết trạng thái 2FA, không biết đang bị khóa hay không. Điều kiện để gọi đã là có phiên, CSRF, Origin |
| S2 cũ có đổi không | Không | Mật khẩu khác rỗng (kể cả 1 ký tự hay chỉ có khoảng trắng) đi đúng đường cũ, sai thì đếm. Trước đây `password: ''` bị zod trả 422 `REQUIRED`/`TOO_SHORT`, cũng không đếm. Chỉ mã lỗi đổi. `.strict()`, regex `totpCode`/`recoveryCode`, `max(256)` giữ nguyên. Các nơi dùng `strongReauthSchema` (`users`, `devices`, `mfa` disable/regenerate/reset, `setMyEmail`) đều gọi `verify`, không dùng `password` trực tiếp |
| Lệch hợp đồng | Có, chỉ ở tài liệu | `openapi.yaml` `StrongReauth` vẫn ghi `required: [password]`, `minLength: 8`. Xem thẻ 03 (ARC) |

Rủi ro còn lại (Low, chấp nhận): ca thiếu mật khẩu không để lại audit, nên một đợt gửi dồn không thấy trong `security`. Ca này không thu được gì. SEC không kiểm lại giới hạn tần suất chung cho request có phiên trong lần review này.

## 4. Test danh sách đóng có làm đỏ không

SEC chạy `test/serializer.test.ts` trên bản sao `HEAD`: 17/17 xanh. Sau đó sửa từng chỗ, chạy lại, rồi trả về như cũ:

| Đột biến | Kết quả |
|---|---|
| M1: thêm op `getUserProfile` trả `ref Me` | **Đỏ** (ca 4) |
| M2: thêm op trả `array` của `ref Me` | **Đỏ** (ca 4) |
| M3: thêm schema `Wrapper` có thuộc tính `ref Me` | **Đỏ** (ca 4) |
| M4: thêm `'User.email'` vào `SELF_DATA_FIELDS` | **Đỏ** (ca 4). Ca 3 vẫn xanh vì `x-visible-to` chặn trước |
| M5: thêm `'listUsers.data'` (không có mã D) | **Đỏ** (ca 4) |

**Kết luận: test làm đỏ đúng khi có op hoặc schema mới trả `Me`.**

Còn một lỗ: thêm khóa cho op **mới** dưới `/v1/me*` có trường mã D chứa dữ liệu người khác (ví dụ `/v1/me/team`) thì test vẫn xanh. Test chỉ kiểm đường dẫn, không kiểm nghĩa. Xem thẻ 01.

---

## 5. Thẻ feedback

### FB-R4-SEC-BE-018-01
- Mức độ: Minor
- Vị trí: `product/services/api/test/serializer.test.ts`, ca "every SELF_DATA_FIELDS key is a D-tagged direct property of a self-only answer"; `src/shared/serialization/field-policy.ts` `SELF_DATA_FIELDS`
- Vấn đề: test chỉ đòi khóa op nằm dưới `/v1/me(/|$)` và có mã D. Một op mới như `GET /v1/me/team` trả danh bạ người khác, có `email: D27`, có thể thêm vào danh sách mà test vẫn xanh. Không có gì buộc SEC phải xem khi danh sách thay đổi.
- Vì sao quan trọng: danh sách này là ngoại lệ duy nhất của D27. Mở rộng nó sai là lộ email hoặc số điện thoại nhân viên cho vai HK/MT/SAL/CTV, mà không có test nào báo.
- Đề xuất sửa (v1.0.4):
  - (a) Ghim nội dung danh sách bằng một mảng hằng trong test, kèm chú thích "thêm khóa phải có SEC review".
  - (b) Thêm ca liệt kê mọi trường mã D trực tiếp của các op `/v1/me*` và của `Me`. Mỗi trường phải nằm trong `SELF_DATA_FIELDS` hoặc trong danh sách `DELIBERATELY_HIDDEN`, để op mới buộc người viết phải chọn.
  - (c) Thêm `field-policy.ts` vào CODEOWNERS của SEC (OPS) nếu repo dùng.
- Trạng thái: Open

### FB-R4-SEC-BE-018-02
- Mức độ: Suggestion
- Vị trí: `field-policy.ts` `SELF_DATA_FIELDS`; `serializer.ts` `walk` (`owner` = tên schema **hoặc** `operationId`)
- Vấn đề: tên schema và `operationId` dùng chung một không gian khóa. Hôm nay không trùng được, vì một bên camelCase, một bên PascalCase, và test kiểm đường dẫn op. Nhưng quy ước đặt tên là thứ duy nhất ngăn trùng.
- Vì sao quan trọng: lớp phòng thủ nên tự đứng vững, không dựa vào quy ước.
- Đề xuất sửa: tách tiền tố, ví dụ `schema:Me.email` và `op:setMyEmail.email`, hoặc dùng hai Set riêng.
- Trạng thái: Open

### FB-R4-SEC-ARC-018-03
- Mức độ: Minor
- Vị trí: `product/docs/api/openapi.yaml`:
  - `components.schemas.StrongReauth` (`required: [password]`, `password.minLength: 8`);
  - `x-rbac-field: D27` trên `Me.email`, `setMyEmail` 200 `email`, `otpauthUri`, `recoveryCodes` (2 chỗ).
- Vấn đề:
  - (a) Hợp đồng vẫn đòi `password` bắt buộc, dài tối thiểu 8. Mã hiện cho phép vắng mặt và trả `STRONG_REAUTH_REQUIRED`, đúng hợp đồng v1.0.3 mục 3.1 #5. Kiểm thử hợp đồng tự động, hoặc client sinh từ spec, sẽ thấy lệch.
  - (b) 5 thuộc tính vẫn gắn D27, trong khi ý nghĩa thật là "dữ liệu của chính người gọi". Ngoại lệ hiện chỉ nằm trong mã BE.
- Vì sao quan trọng: spec là nguồn sự thật cho FE, MOB, QA. Ngoại lệ bảo mật nên đọc được ngay trong hợp đồng.
- Đề xuất sửa (bản spec sau):
  - (a) Bỏ `password` khỏi `required` và ghi rõ "vắng hoặc rỗng → 422 `STRONG_REAUTH_REQUIRED`, không đếm". `minLength` để mô tả độ dài khi đặt mật khẩu, không dùng để kiểm đầu vào.
  - (b) Thay `x-rbac-field: D27` trên 5 thuộc tính bằng một đánh dấu tường minh, ví dụ `x-self-data: true`, cho generator sinh ra. Giữ `SELF_DATA_FIELDS` làm lớp kiểm chéo: test so hai nguồn phải khớp.
- Trạng thái: Open

### FB-R4-SEC-BE-018-04
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/modules/identity/internal/mfa.controller.ts` (các dòng `reply.header('cache-control', 'no-store')`)
- Vấn đề: SR-C3-03 có helper `noStore()` (`c3-access-gate.ts`), đặt cả `Cache-Control: no-store` lẫn `Pragma: no-cache`. Ba phản hồi chứa C3 của 2FA lại tự đặt `no-store`, không có `Pragma`.
- Vì sao quan trọng: rủi ro thực tế rất thấp (Caddy và trình duyệt hiện đại tôn trọng `no-store`). Nhưng nên có một cách làm thống nhất cho mọi phản hồi C3.
- Đề xuất sửa: gọi `noStore(reply)` trong `startSetup`, `confirm`, `regenerate`.
- Trạng thái: Open

---

## 6. Điểm làm tốt (nên giữ)

- Miễn trừ **đóng và hẹp**: gắn theo `<owner>.<property>`, chỉ áp cho thuộc tính trực tiếp, chỉ bỏ qua **một** lớp (mã D). `x-visible-to`, `writeOnly`, C3, mức khách vẫn chạy trước. Op mới mặc định vẫn bị ẩn.
- Test ghim "chỉ `getMe`/`login`/`loginMfa` trả `Me`, không schema nào tham chiếu `Me`" đỏ thật với cả 3 biến thể (op mới, mảng, schema lồng).
- Ca thiếu mật khẩu chặn ngay trước mọi đọc DB. Không có đường dò TOTP, không lộ trạng thái khóa.
