# SEC – Review PR #100 (BE-D, PR-D1)

Round 5 · bước **Review** · SEC · 07/11/2026

Đối tượng:
- PR #100, nhánh `r5-d1`, HEAD **`69471005`** (merge `main` @ `ab1fc4ae` vào nhánh, không rebase). CI của HEAD này xanh: `format · lint · audit · test · build` (có DB, chạy đủ `v105-be-d1-mfa-fdl` 7 ca, `serializer.test` 27 ca, `v104-holds` 13 ca, `r3-q51-receiving-account` 10 ca, `dashboard-s4-bed` 18 ca), gitleaks, API contract, OpenAPI lint, E2E smoke.
- 20 tệp, `git diff ab1fc4ae..69471005`. Tệp SEC đọc kỹ: `shared/http/auth.guard.ts`, `identity/public/mfa-roles.ts`, `mfa-store.ts`, `identity/internal/auth.service.ts`, `me.service.ts`, `identity-options.ts`, `shared/serialization/serializer.ts`, `test/serializer.test.ts` (đường dẫn CODEOWNERS), `main.ts`, `eslint.config.js`, `platform/internal/platform.controller.ts`, `reservations/internal/hold-notices.ts`, `reservations.service.ts`, `reporting/internal/dashboard.service.ts` và các tệp test đi kèm.

SEC đối chiếu thêm mã có sẵn (không đổi trong PR) để kiểm cửa sổ cache và phạm vi:
- `identity/internal/users.service.ts` `setRoles` (dòng 375–395): đổi vai thì tăng `roles_version` **và** thu hồi mọi phiên (`role_changed`);
- migration `0001` (dòng 38–44): `user_property_role` là bảng cấp tổ chức, RLS không lọc theo cơ sở;
- migration `0079`: `auth_resolve_session().mfa_required` chỉ có owner/manager;
- `identity/internal/mfa.service.ts` `roles()`, `events/public/events.service.ts` `notify` (dòng 397–400), `events/internal/events.controller.ts` (`streamEvents`, `listMyNotifications`), `shared/log-line.ts`, `config.ts` (`ConfigError`).
- Thẻ cũ: `rounds/round-04/reviews/SEC-on-v104-contract.md` (C0312-02), `SEC-on-v104-email-identity.md` (V104-07, V104-08 mục 6.4).

SEC chỉ đọc diff và một worktree tách riêng ở commit `69471005`; không checkout bản làm việc chung, không chạy test, không gọi staging hay production. Tệp này không có bí mật hay dữ liệu khách.

---

## 0. Kết luận: **DUYỆT**

Gộp được ở `69471005` (CI đã xanh). Không có Blocker hay Major. Các thẻ dưới đây **không** là điều kiện gộp. Nếu nhánh có thêm commit chạm `auth.guard.ts`, `serializer.ts`, `serializer.test.ts`, `mfa-roles.ts` hoặc `main.ts` thì SEC đọc lại phần chênh trước khi gộp.

0 Blocker · 0 Major · 2 Minor · 3 Suggestion.

| Thẻ cũ BE đề nghị đóng | SEC | Lý do ngắn |
|---|---|---|
| FB-R4-SEC-BE-C0312-02 | **Đóng (Done)** | Mục 2 |
| FB-R4-SEC-BE-V104-07 | **Đóng (Done)** | Mục 3. Ngoại lệ stderr còn lại tách thành thẻ D1-01 (Minor, không mở lại V104-07) |
| FB-R4-SEC-BE-V104-08 | **Đóng (Done)** | Mục 3. Đạt cả 3 điều kiện của mục 6.4 |

ESC mới: **không**.

---

## 1. V5-40 – FDL bắt buộc 2FA (guard tự kiểm thêm)

### 1.1 Cache 2FA có mở cửa sổ vượt chặn không

Cách làm: `AuthGuard.mfaRequired` (dòng 472–500) chỉ chạy khi `MFA_ENFORCED` bật, `mfa_enabled` khác `true`, và `auth_resolve_session().mfa_required` chưa trả `true`. Nó đọc `user_property_role` (không lọc cơ sở) với `MFA_REQUIRED_ROLES`, rồi lưu cache theo khóa `user_id:roles_version`, sống `roleCacheMs` (mặc định 60 s).

Cache chỉ nguy hiểm khi nó giữ `required = false` trong lúc người đó đã có vai bắt buộc. SEC rà từng đường:

| Tình huống | Kết quả | Bằng chứng |
|---|---|---|
| Nâng FD lên FDL qua app (`setRoles`) | **Không có cửa sổ.** Cùng giao dịch: `roles_version + 1` và thu hồi mọi phiên. Phiên cũ bị chặn ngay ở lượt sau, vì `revoked_at` đọc mới mỗi request, không qua cache. Phiên mới mang `roles_version` mới nên cache trượt. Lúc đăng nhập, `requiresMfa` đọc thẳng DB và ghi `enrollment_only` vào phiên | `users.service.ts` dòng 375–395; `auth.service.ts` dòng 204–206, 263–276 |
| Tạo tài khoản mới có vai FDL | Không có cửa sổ. `user_id` mới, cache chưa có khóa | `users.service.ts` dòng 237–243 |
| Thu hồi vai FDL | Không phải vượt chặn: phiên bị thu hồi, `required` tính lại thành `false`, đúng với thực tế | như trên |
| Bật 2FA, reset 2FA, đổi mật khẩu, khóa tài khoản | `mfa_enabled` đọc mới mỗi request, không cache. Các đường này đều tăng `roles_version` và thu hồi phiên | `mfa.service.ts` dòng 238, `mfa-store.ts` dòng 286, `auth.service.ts` dòng 598, `users.service.ts` dòng 495 |
| Nhiều cơ sở: FDL chỉ ở cơ sở B, phiên đang ở cơ sở A | Bị chặn. Truy vấn không có `property_id`, mà RLS của `user_property_role` là cấp tổ chức (0001 dòng 38–44), nên thấy vai ở mọi cơ sở. Cùng vị từ với `requiresMfa` (đường đăng nhập) và `mfa.service.roles()` (`getMy2fa.required`, chặn `disableMy2fa`) | `auth.guard.ts` dòng 486–490 |
| Phiên mở trước khi bật cờ | Bị chặn ở lượt gọi sau (test đã chứng minh) | `v105-be-d1-mfa-fdl.test.ts` ca 2 |
| Lỗi DB trong `mfaRequired` | Request lỗi, không cho qua (fail closed) | – |
| Sửa vai bằng SQL tay mà không tăng `roles_version` (ngoài app: vận hành, seed DS-E trên staging) | Cửa sổ tối đa 60 s trên mỗi tiến trình API, và phiên không bị thu hồi. Đây là cùng giới hạn đã chấp nhận cho `rolesAt` từ R2. Chỉ người có quyền DB làm được, nên SEC **chấp nhận**. Ghi Info cho OPS ở mục 6 | – |

**Kết luận 1.1:** qua mọi đường của app, cache không tạo cửa sổ vượt chặn. Khóa có `user_id`, nên không lẫn giữa người dùng. Mỗi instance có cache riêng, không chia sẻ trạng thái.

### 1.2 Phiên hạn chế đúng phạm vi

- FDL dùng đúng cổng của owner/manager (`auth.guard.ts` dòng 325–333), chạy trước mọi kiểm vai và nghiệp vụ. Phiên hạn chế chỉ gọi được `getMe`, `getMy2fa`, `startMy2faSetup`, `confirmMy2fa`, `logout`; `changeMyPassword` chỉ khi đang phải đổi mật khẩu. PR không đổi danh sách này.
- SSE (`streamEvents`) là một `@Operation`, đi qua guard toàn cục, nên phiên hạn chế nhận 403. Luồng SSE đang mở thì không sống sót sang trạng thái hạn chế: đổi vai hay reset 2FA đều thu hồi phiên, và heartbeat kiểm lại phiên (FB-R2-SEC-BE-40). Bật cờ `MFA_ENFORCED` thì phải khởi động lại tiến trình.
- FD, HK, SAL không bị ảnh hưởng (test ca 3). Test đột biến (bỏ phần kiểm của guard) làm 2 ca đỏ.
- `Me.mfaEnrollmentRequired` và `mfaRequiredButMissing` dùng cùng danh sách vai. Lệch nhỏ về điều kiện "cơ sở đang hoạt động" ghi ở thẻ D1-03 (Suggestion): lệch về phía chặt hơn, không phải lỗ hổng.
- Danh sách `MFA_REQUIRED_ROLES` có test ghim đúng `['owner', 'manager', 'front_desk_lead']`. Bớt một vai thì test đỏ.

### 1.3 Log và dữ liệu
`mfaRequired` không ghi log. Lỗi DB đi theo bộ lọc lỗi chung. PR không thêm trường nào vào audit hay log.

---

## 2. V5-43 – `serializeSchema` (đóng C0312-02)

- `serializeSchema` (dòng 182–190) gọi `walk(…, owner null, self false)`. Ở nhánh `ref`, owner chỉ thành `schema:<tên>` khi `self` đúng, nên ở **mọi cấp**, trong mọi `union` và `array`, owner luôn `null`. Vì vậy `propertyAllowed` bỏ mọi thuộc tính `sd`, với mọi vai, kể cả OWN, kể cả khi bật C3. Đúng phương án (a) SEC đề xuất.
- Đường phản hồi operation (`serializeShape` với `self` = `true`) giữ nguyên hành vi cũ. `getMe` vẫn trả email của chính người gọi (test).
- Test quét `src/`: ngoài `serializer.ts` và `serialize.interceptor.ts`, không tệp nào được nhắc `serializeShape`, `serializeResponse`, `propertyAllowed`. Test cũng kiểm interceptor truyền `auth.operationId`. Đây là phương án (b), làm thêm. SEC xác nhận hiện `src/` không có lời gọi `serializeSchema` nào ngoài `serializer.ts`.
- Ca cũ "`serializeSchema('Me')` vẫn trả email" đã thay bằng ca ngược lại cho 8 vai. `PINNED_SELF_DATA_FIELDS` và `field-policy.ts` không đổi.

**C0312-02: Đóng.** Gợi ý giữ chặt hai tệp mà test quét tin cậy: thẻ D1-04.

---

## 3. V104-07, V104-08

**V104-07 – Đóng.** Hai dòng `info`/`warn` của `main.ts` đi qua `writeLogLine`, JSON y như cũ. ESLint `no-console` áp cho `main.ts`. Còn đúng một `console.error` có chú thích, ở dòng báo lỗi khởi động. Dòng này có từ trước và in `err.message` cho **mọi** lỗi, không chỉ `ConfigError`/`StartupCheckError` như chú thích nói. Rủi ro thấp, ghi thẻ D1-01.

**V104-08 – Đóng.** Đạt cả 3 điều kiện ở `SEC-on-v104-email-identity.md` mục 6.4:
1. `action` lấy đúng tham số của nhánh controller đã chạy: `'set'` ở dòng 354, `'cancel'` ở dòng 405, ghi nguyên vào payload (dòng 481–488). Không suy ra từ chỗ khác.
2. Test đầu–cuối API → outbox → dispatcher → thư đã dựng: `set` ra câu đặt lịch, không có "cancel/hủy"; `cancel` ra câu hủy, không có "new", "effective", "mới", "có hiệu lực"; dòng outbox cũ không có `action` ra câu trung tính. Thư dựng xong không chứa số tài khoản.
3. Ngày trong thư hủy là `effectiveFrom` của chính lịch bị hủy (test 25/03 và 28/03).

---

## 4. V5-1B – `hold_expired` gửi FD/FDL

- Payload push (cổng chống trùng) chỉ có `kind`, `roles`, `userIds`, `refType`, `refId`, `refCode` (mã đơn). Test so khớp toàn bộ payload. Dòng `staff_notification` chỉ có kind, ref, mã đơn, thời điểm. `listMyNotifications` trả đúng các cột đó, không nối sang bảng khách. **Không có dữ liệu khách** trong tin (SEC A5).
- FD và FDL vốn đọc được đặt phòng của cơ sở mình theo `x-roles`, nên tin này không mở thêm quyền dữ liệu nào, kể cả với đơn do CTV tạo.
- Người nhận phải có `u.status = 'active'` và vai còn hiệu lực **tại cơ sở đó** (`events.service.ts` dòng 397–400); người tạo, người chốt cũng phải qua điều kiện này. Tài khoản `disabled` hay `locked` không nhận (test với `disabled`). Khóa tạm do sai mật khẩu (status vẫn `active`) vẫn nhận tin. SEC thấy đúng: khóa tạm là để chống dò mật khẩu, không phải cho nghỉ việc; tin chỉ có mã đơn.
- Không bao giờ gửi MGR, OWN, HK, MT, kế toán (test). Khóa chống trùng giữ theo đơn; nhịp sau không gửi lại (test).

**Đạt.**

## 5. `departuresDate` (hợp đồng 1.19)

Ngày do máy chủ tính từ đồng hồ và múi giờ của cơ sở. Không có tham số vào mới, chạy cùng giao dịch có RLS theo cơ sở, không thêm loại dữ liệu nào vào phản hồi. **Không có vấn đề bảo mật.**

---

## 6. Thẻ feedback

### FB-R5-SEC-BE-D1-01
- Mức độ: Minor
- Vị trí: `product/services/api/src/main.ts` dòng 99–105 (`bootstrap().catch`)
- Vấn đề: chú thích nói chỉ in message vì "ConfigError/StartupCheckError never contain secret values", nhưng mã in `${err.name}: ${err.message}` cho **mọi** `Error`: lỗi `pg` lúc kết nối, lỗi khởi tạo module Nest, `KeyringError`… Giá trị không phải `Error` thì in nguyên. Worker đã làm chặt hơn: `writeErrorLine('worker failed', errorTag(err))`, chỉ tên và mã, theo SEC S-1. SEC đã rà các `ConfigError` có chèn biến (`config.ts`): chỉ chèn tên biến, `APP_ENV`, danh sách giá trị hợp lệ, nên hiện chưa thấy lộ.
- Vì sao quan trọng: dòng cuối trước khi container dừng sẽ vào `docker logs` và log tập trung. Thư viện bên thứ ba có thể đưa giá trị vào message (chuỗi kết nối, đường dẫn tệp khóa). Chú thích hiện tại làm người sau tin rằng đã có giới hạn.
- Đề xuất sửa: giữ chữ thường trên stderr cho người vận hành, nhưng chỉ in message khi `err` là `ConfigError`, `StartupCheckError` hoặc `KeyringError`. Các lỗi khác in `${err.name}` kèm `code` của `errorTag(err)`. Giá trị không phải `Error` thì in `'startup failed'`. Thêm một ca đơn vị. Chú thích đầu tệp sửa "every line of the api process goes through log-line.ts" thành "every line of this file": `crypto/internal/keyring.ts` dòng 93 và `files/public/encrypted-blob.service.ts` dòng 179 còn `console.warn`. Cả hai đều an toàn (không có message), nhưng chưa đi qua `log-line.ts`. Làm ở PR BE sau hoặc v1.0.6.
- Trạng thái: Open

### FB-R5-SEC-BE-D1-02
- Mức độ: Minor
- Vị trí: `product/services/api/test/integration/v105-be-d1-mfa-fdl.test.ts`
- Vấn đề: chưa có ca nhiều cơ sở. Đọc mã thì đúng: truy vấn không lọc cơ sở, RLS cấp tổ chức. Nhưng không test nào giữ điều này: người sau thêm `AND property_id = $…` (cho giống `rolesAt`) thì không ca nào đỏ. Tất cả ca hiện tại đều đặt vai ở `propertyIds[0]`, cũng là cơ sở của phiên.
- Vì sao quan trọng: ORC hỏi đúng tình huống này. Thêm một bộ lọc theo cơ sở là đủ để FDL ở cơ sở B làm việc không cần 2FA khi phiên đang ở cơ sở A.
- Đề xuất sửa: thêm 1 ca có DB. Tenant có 2 cơ sở; người dùng là FD ở P1 (cơ sở đang hoạt động của phiên) và FDL ở P2, chưa bật 2FA, có `MFA_ENFORCED`. Gọi một API FD ở P1 phải ra 403 `MFA_ENROLLMENT_REQUIRED`; `getMy2fa.required` phải là `true`. Thêm ca đột biến (lọc theo `propertyId`) để thấy test đỏ. Làm ở PR BE-D kế tiếp, trước khi đóng V5-40 ở QC.
- Trạng thái: Open

### FB-R5-SEC-BE-D1-03
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/modules/identity/internal/me.service.ts` dòng 113–117 (`properties`: `p.status = 'active'`), dòng 209–213
- Vấn đề: `Me.mfaEnrollmentRequired` chỉ tính vai ở cơ sở đang hoạt động. Guard, đăng nhập và `getMy2fa` tính ở **mọi** cơ sở. Người có vai bắt buộc chỉ ở một cơ sở đã ngừng hoạt động sẽ bị guard chặn, nhưng `Me` báo không cần đăng ký. Web sẽ không mở màn đăng ký 2FA, và mọi lệnh gọi đều ra 403. Lệch này có từ trước cho owner/manager; V5-40 chỉ làm nhóm người bị ảnh hưởng rộng hơn. Lệch về phía chặt hơn nên không phải lỗ hổng.
- Đề xuất sửa: tính `mfaRequiredButMissing` và `mfaEnrollmentRequired` bằng cùng vị từ với guard: vai còn hiệu lực ở mọi cơ sở, không lọc trạng thái cơ sở. Tốt nhất dùng chung một hàm SQL hoặc helper. **Không** nới guard cho khớp `Me`.
- Trạng thái: Open

### FB-R5-SEC-BE-D1-04
- Mức độ: Suggestion
- Người làm: OPS (PR riêng; `CODEOWNERS` là đường dẫn SEC), ORC ghi vào bước kiểm trước khi gộp
- Vị trí: `.github/CODEOWNERS`
- Vấn đề: test quét của V5-43 coi `serializer.ts` và `serialize.interceptor.ts` là hai tệp duy nhất được tin cậy. Cổng 2FA nằm ở `auth.guard.ts`, danh sách vai ở `mfa-roles.ts`. Cả 4 tệp đều chưa có trong `CODEOWNERS`. Hiện chỉ `field-policy.ts` và `serializer.test.ts` có mặt, nên một PR sửa serializer hay guard sẽ không hiện dấu "cần SEC".
- Đề xuất sửa: thêm 4 dòng `/product/services/api/src/shared/serialization/serializer.ts`, `/product/services/api/src/shared/serialization/serialize.interceptor.ts`, `/product/services/api/src/shared/http/auth.guard.ts`, `/product/services/api/src/modules/identity/public/mfa-roles.ts`. Theo `SEC-on-v104-email-identity.md` mục 3, CODEOWNERS ở repo này chỉ là chỉ dẫn, nên lớp chặn thật vẫn là bước ORC kiểm.
- Trạng thái: Open

### FB-R5-SEC-BE-D1-05
- Mức độ: Suggestion
- Người làm: ARC (hợp đồng, thiết kế migration), BE (khi có migration sau, ví dụ 0.3.14 hoặc 5B-2)
- Vị trí: `0079_mfa_two_factor.sql` (`auth_resolve_session().mfa_required`, danh sách `('owner', 'manager')`), `identity/public/mfa-roles.ts`
- Vấn đề: hiện có hai nguồn cho danh sách vai bắt buộc 2FA: một trong SQL, một trong TS. Guard lấy OR của hai nguồn nên đang an toàn. Nhưng nếu sau này bỏ một vai khỏi TS mà quên SQL (hoặc ngược lại), hai nơi sẽ lệch lặng lẽ.
- Đề xuất sửa: khi sửa hàm ở lần migration sau, chọn một trong hai cách. (a) Bỏ cột `mfa_required`, guard chỉ đọc theo `MFA_REQUIRED_ROLES`. (b) Giữ cột nhưng thêm test so danh sách trong định nghĩa hàm (`pg_get_functiondef`) với `MFA_REQUIRED_ROLES`. SEC chọn (a). Trong lúc chờ, giữ nguyên phần guard tự kiểm. Mô tả `openapi.yaml` (mã lỗi `MFA_ENROLLMENT_REQUIRED`, `login`, `Me.mfaRequiredButMissing`, `getMy2fa`) thêm `front_desk_lead` ở delta tài liệu 0.3.14, như BE đã nêu.
- Trạng thái: Open

---

## 7. Ghi chú (Info, không thẻ)

- **PO/BA – release notes v1.0.5:** khi bản lên, FDL chưa bật 2FA bị hạn chế ngay ở **lượt gọi kế tiếp**, kể cả khi đang đăng nhập, không chỉ "ở lần đăng nhập đầu sau deploy". Nên sửa câu này, và nhắc chủ khách sạn cho lễ tân trưởng bật 2FA trước ngày deploy, để ca đêm không bị kẹt. Nếu mất điện thoại thì vẫn dùng đường reset 2FA của OWN như hiện nay.
- **OPS – sổ vận hành:** mọi lần sửa `user_property_role` bằng SQL tay phải tăng `app_user.roles_version` và thu hồi phiên, như `setRoles` làm. Nếu không, guard có thể dùng vai cũ tới 60 s (mục 1.1, dòng cuối).
- **QA/OPS – staging `MFA_ENFORCED=true`:** seed TOTP của các tài khoản thử FDL (`qa.*`, `E2E_TOTP_ENROLL`) chỉ để trong secret CI hoặc biến môi trường. Không ghi vào repo, fixture hay báo cáo test.
- **BE (tùy chọn):** `roleCache` và `mfaRoleCache` không bao giờ xóa mục hết hạn. Số mục bị giới hạn bởi số nhân viên × số lần đổi `roles_version`, nên rủi ro bộ nhớ thấp. Nếu tiện, xóa mục cũ khi `set`.
- **FE-A:** mock `apps/admin-web/src/mocks/handlers.ts` còn `MFA_ROLES = ['owner','manager']`, như BE đã nêu. Màn thật đọc cờ của máy chủ nên không lộ gì. Sửa mock để test FE khớp.

## 8. Điểm làm tốt
- Guard tự kiểm thay vì chờ migration, có test chứng minh đúng chỗ SQL không biết FDL (ca "phiên trước khi bật cờ" kiểm `auth_resolve_session` trả `false` rồi mới gọi API). Có thử đột biến.
- `serializeSchema` làm cả hai phương án SEC đưa ra: fail closed ở mọi cấp, và test quét nơi gọi hàm. Ca cũ được thay, không để song song.
- V104-08 có test đầu–cuối tới tận thư đã dựng, có cả dòng outbox cũ và kiểm không có số tài khoản. V5-1B so khớp toàn bộ payload push.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **SEC – review PR #100 (BE-D PR-D1) @ 69471005: DUYỆT** (rounds/round-05/reviews/SEC-on-be-pr-100-d1.md). V5-40: cache 2FA theo user_id:roles_version không mở cửa sổ vượt chặn qua app (setRoles tăng roles_version + thu hồi phiên; truy vấn mọi cơ sở, RLS cấp tổ chức); SQL tay không tăng roles_version → tối đa 60 s, chấp nhận. Phiên hạn chế của FDL cùng phạm vi owner/manager. V5-1B: tin hold_expired chỉ id + mã đơn, chỉ người active có vai tại cơ sở. Đóng FB-R4-SEC-BE-C0312-02, V104-07, V104-08. Thẻ mới không chặn gộp: D1-01, D1-02 (Minor), D1-03…05 (Suggestion). | SEC |`
