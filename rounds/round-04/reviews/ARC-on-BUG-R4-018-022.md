# ARC duyệt bản sửa BUG-R4-018 / 019 / 022 – v1.0.3 PR-1 (`be-a/v1.0.3-email` @ `ead8ac83`)

- Người duyệt: ARC. Round 4, đợt v1.0.3, bước **Review** (sau Kiểm thử QA @ `fb6a281c`). Ngày 03/11/2026.
- Đọc: `git diff d6fcb6c4 ead8ac83` (6 tệp: `field-policy.ts`, `serializer.ts`, `strong-reauth.ts`, 2 tệp test, báo cáo BE mục 10). Đối chiếu: OpenAPI 0.3.10-draft (`Me`, `setMyEmail`, `startMy2faSetup`, `confirmMy2fa`, `regenerateMyRecoveryCodes`, `disableMy2fa`); `rounds/round-04/outputs/ARC/v1.0.3-contract-email.md` mục 2 và 3.1; `rounds/round-04/qa/bug-list.md` (BUG-R4-018/019/022); FE `product/apps/admin-web` trên `origin/v1.0.3-email` @ `fb6a281c` (`StrongReauthDialog.tsx`, `SecurityPage.tsx`, `mocks/handlers.ts`).
- Không checkout, không chạy lại bộ test (dựa vào kết quả BE: 3777 ca đạt, `serializer` 17/17, `v103-security-email` 39/39). Có chạy một phép đo nhỏ bằng node trong scratchpad cho mục 2.

**Kết luận: ĐẠT.** Không có Blocker/Major. 1 thẻ Minor cho FE-A, 1 thẻ Minor và 2 Suggestion cho BE-A. Việc sửa spec để ở bản sau, ARC tự làm (mục 1).

## 1. Thiết kế: có hợp với D27 và hợp đồng 0.3.10 không

**Hợp.** Gốc lỗi là ở **spec của ARC**, không phải ở mã BE:
- D27 trong rbac-matrix mục 6 là "tài khoản nhân viên, nhật ký" của **người khác** (danh bạ). `RBAC_FIELD_DENY.D27 = [HK, MT, SAL, CTV]` là đúng cho nghĩa đó.
- Hợp đồng 0.3.10 mục 2 ghi rõ "Xem email mình (`Me.email`)" là ✔ cho cả 8 vai. Mô tả `Me.email` trong spec cũng ghi "dữ liệu của chính họ". `startMy2faSetup`, `confirmMy2fa`, `regenerateMyRecoveryCodes` đều `x-roles: [any_staff]`.
- Spec 0.3.10-draft lại gắn `x-rbac-field: D27` lên 5 thuộc tính trả về cho chính người gọi (dòng 882, 1015, 1058, 1092, 10185) và trên `setMyEmail` request `email` (dòng 870). Spec tự mâu thuẫn: tag ẩn, mô tả và `x-roles` cho phép. `otpauthUri` gắn D27 từ v1.0.2, nên BUG-R4-022 có từ trước.

Bản sửa giữ đúng các lớp khác: `writeOnly`, C3 (`x-c3-log`), mức khách và `x-visible-to` vẫn kiểm **trước** nhánh miễn trừ. Miễn trừ chỉ bỏ qua bước kiểm mã D. `User.email` vẫn chỉ OWN thấy nhờ `x-visible-to: [owner]`. Test đã ghim cả hai điều này.

### Quyết định ARC: danh sách bằng mã cho v1.0.3, sửa spec ở bản sau

| | v1.0.3 (bây giờ) | Bản sau (cùng lượt hợp đồng kế tiếp) |
|---|---|---|
| Mã | Giữ `SELF_DATA_FIELDS` như BE đã làm | BE-A xóa `SELF_DATA_FIELDS`, tham số `owner`/`selfKey` trong `walk`/`propertyAllowed`/`serializeShape` |
| Spec | Không đổi | ARC bỏ `x-rbac-field: D27` ở 6 chỗ: 5 thuộc tính trả về + `setMyEmail` request `email`. Giữ D27 ở `updateUser` request `email` và `User.email` (dữ liệu của người khác) |
| Test | Giữ test BE (danh sách đóng, `Me` chỉ do 3 op trả) | Đổi test "danh sách đóng" thành bất biến của spec: (a) `Me` và phản hồi inline của op `/v1/me*` không có thuộc tính nào mang `x-rbac-field`; (b) `Me` chỉ do `getMe`/`login`/`loginMfa` trả, không schema nào tham chiếu `Me` (giữ nguyên ý BE) |

Lý do để sau, không sửa spec ngay trong v1.0.3:
- PR-1 đang ở bước Kiểm thử, QA đang xác nhận lại. Sửa spec kéo theo sinh lại `openapi-schemas.ts`, `openapi-meta.ts`, `packages/api-client`, `rbac-cases.{json,csv}`, chạy lại `gen_traceability.py --strict`. Test BE `expect(p?.f).toBeDefined()` sẽ đỏ ngay, nên BE-A phải đổi mã cùng lúc. Đó là thêm một vòng BE + QA cho một thay đổi không đổi gì trên dây.
- Nhánh `lp-v2` cũng mang nhãn 0.3.10-draft và chờ gộp (spec dòng 302). Thêm chỉnh spec bây giờ là thêm chỗ xung đột.
- Hành vi trên dây sau bản sửa đã đúng hợp đồng. Lệch chỉ còn ở tag nội bộ `x-`, client không đọc tag này.

Không giữ danh sách làm "lớp phòng thủ" sau khi sửa spec (khác ý BE). Khi tag đã bỏ, nhánh miễn trừ không bao giờ chạy. Đó là mã chết và là nguồn sự thật thứ hai. Bất biến (a) ở trên chặn được việc ai đó gắn lại D27, mà không cần ngoại lệ lúc chạy.

**Version khi sửa spec:**
- Nếu sửa **trước** khi v1.0.3 phát hành (0.3.10 vẫn là draft): không đổi số. Thêm một dòng vào mục "Thay đổi phiên bản 0.3.10-draft".
- Nếu sửa **sau** khi phát hành: ghi vào nhãn draft kế tiếp (0.3.11-draft), mục thay đổi ghi "chỉ bỏ tag `x-rbac-field`, không đổi dạng dữ liệu, không đổi `x-roles`". Không cần bump vì lý do tương thích: bỏ một extension `x-` không làm đổi kiểu sinh ra cho client.
- Đề xuất của ARC: làm ở lượt hợp đồng kế tiếp (v1.0.4 hoặc khi gộp `lp-v2`, cái nào tới trước). ORC ghi vào decision-log:
  `| 03/11/2026 | R4 v1.0.3 | Dữ liệu của chính người gọi (Me.email, setMyEmail.email, otpauthUri, recoveryCodes): v1.0.3 miễn D27 bằng SELF_DATA_FIELDS trong mã; lượt hợp đồng kế tiếp ARC bỏ x-rbac-field D27 ở 6 chỗ, BE xóa danh sách, test thành bất biến spec | ARC | Spec tự mâu thuẫn (tag D27 với mô tả/x-roles); sửa spec ngay sẽ thêm một vòng BE+QA và xung đột lp-v2, trong khi hành vi trên dây đã đúng |`

## 2. Hiệu năng và tính đúng của việc truyền schema/op qua `walk`

**Đúng:**
- `serializeResponse` truyền `operationId` làm `owner` ở gốc. `ref` đổi `owner` thành tên schema. `union` giữ `owner` (nhánh object của một `oneOf` gốc vẫn là thuộc tính trực tiếp của phản hồi). `array`, `extra`, giá trị của thuộc tính thì không truyền `owner`. Nên khóa theo op chỉ khớp thuộc tính trực tiếp của phản hồi, đúng mô tả.
- Khóa theo schema (`Me.email`) thì khớp ở **mọi chỗ** gặp `Me`, kể cả lồng sâu, trong mảng, hay qua `serializeSchema('Me', …)` (SSE/outbox). Điều này chấp nhận được vì test ghim `Me` chỉ do 3 op trả và không schema nào tham chiếu `Me`. Chú thích trong `field-policy.ts` ("Direct properties only…") chỉ đúng hết cho khóa theo op. Không cần sửa, mã sẽ bị xóa ở bản sau (mục 1).
- Thứ tự kiểm trong `propertyAllowed` không đổi. Nhánh miễn trừ chỉ chạy khi `rbacFieldAllows` đã từ chối, nên không có trường hợp nào **mở** thêm ngoài 5 khóa.
- `propertyAllowed` chỉ được gọi trong `serializer.ts` (đã grep), tham số mới là tùy chọn, không làm hỏng chỗ gọi khác.

**Hiệu năng:** không đáng kể. Mỗi thuộc tính khai báo của một object có `owner` (gốc và mọi object qua `$ref`, tức hầu hết object) tạo một chuỗi `${owner}.${key}`, kể cả khi không cần. Đo bằng node 8 000 thuộc tính (200 đơn × 40 trường, cỡ `listReservations` trang lớn): tạo chuỗi luôn ≈ 0,08 ms, tạo khi cần ≈ 0,014 ms. Thêm ~0,07 ms một lượt, rất xa ngân sách p95 300 ms. Chỉ là Suggestion (thẻ BE-03).

## 3. `field` của 422 khác nhau giữa các op: FE có ánh xạ đủ không

`field` theo op ở `ead8ac83`:

| Op | Thân | Thiếu mật khẩu | Thiếu mã (đã bật 2FA) | Sai (401) |
|---|---|---|---|---|
| `setMyEmail`, `updateUser`, `createUser`, `setUserRoles`, `revokeTrustedDevice`, `resetUser2fa` | `{…, reauth: StrongReauth}` | `reauth` | `reauth.totpCode` | `reauth` |
| `disableMy2fa`, `regenerateMyRecoveryCodes` | `StrongReauth` phẳng | `password` | `totpCode` | `password` |
| `changeMyPassword`, `trustCurrentDevice` | schema riêng, `currentPassword` zod `min(1)` | `currentPassword` + `REQUIRED` (zod, **không** đổi trong bản này) | `totpCode` | `currentPassword` |

Server đúng: `field` là đường dẫn JSON thật trong thân của từng op, và hợp đồng 3.1 #5 chỉ chốt dạng `reauth` cho `setMyEmail`. Không đổi server.

FE (`StrongReauthDialog.tsx` dòng 25–33, `missingFactor`) chỉ nhận `reauth` / `reauth.password` → ô mật khẩu và `reauth.totpCode` / `reauth.recoveryCode` → ô mã. `SecurityPage.tsx` dòng 112–139 dùng cùng hộp thoại cho `regenerateMyRecoveryCodes` và `disableMy2fa`, gửi `reauth` phẳng làm thân. Với `field: password` hoặc `totpCode`, `missingFactor` trả `null`. Sau đó `isStrongReauthError` vẫn đúng (vì `code === STRONG_REAUTH_REQUIRED`), nên hộp thoại hiện banner chung `reauth.s2_failed` ("Mật khẩu hoặc mã chưa đúng") thay vì đánh dấu ô trống. Đây đúng là triệu chứng QA ghi ở BUG-R4-019, giờ chuyển sang 2 op này.

Mức thật thấp: hộp thoại tự kiểm ô trống trước khi gửi, nên Desk chỉ gặp ca này khi `Me.mfaEnabled` cũ (ca đó đã có banner dự phòng theo thiết kế) hoặc client khác. Vì vậy là **Minor** (thẻ FE-01), không chặn. Mock `handlers.ts` dòng 272 mặc định `reauth`/`reauth.totpCode` cho mọi op, nên test FE không bắt được lệch này.

## 4. Ý kiến về việc nới `recoveryCodes`

**Đồng ý, và bắt buộc phải nới cùng `otpauthUri`.** Bỏ `recoveryCodes` khỏi danh sách còn tệ hơn không sửa:
- `confirmMy2fa` bật 2FA và lưu băm của 10 mã. Không trả mã thì HK/MT/SAL/CTV có 2FA mà không có đường khôi phục. Mất điện thoại là tự khóa mình, phải nhờ OWN `resetUser2fa`.
- `regenerateMyRecoveryCodes` **hủy bộ mã cũ** rồi mới trả bộ mới. Không trả mã thì người dùng mất cả bộ cũ lẫn bộ mới. Desk `SecurityPage.tsx` dòng 118 còn `setCodes(data.recoveryCodes)` với `undefined`.
- Rủi ro lộ không tăng: mã là của chính người gọi, vẫn qua cổng C3 (`x-c3-log` trên cả hai op, test BE ghim "không `x-c3-log` thì vẫn bỏ"). `regenerateMyRecoveryCodes` đặt `cache-control: no-store`.
- Không cần ESC: đây là sửa cho đúng `x-roles: [any_staff]` đã chốt, không mở quyền mới.

---

## Thẻ feedback

### FB-R4-ARC-FE-018-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/components/StrongReauthDialog.tsx` dòng 25–33 (`missingFactor`); dùng ở `pages/SecurityPage.tsx` dòng 112–139; mock `src/mocks/handlers.ts` dòng 272 và handler `POST /me/2fa/recovery-codes` (dòng 811), `disableMy2fa`.
- Vấn đề: sau BUG-R4-019, `disableMy2fa` và `regenerateMyRecoveryCodes` trả `422 STRONG_REAUTH_REQUIRED` với `field: password` (thiếu mật khẩu) hoặc `field: totpCode` (thiếu mã), vì thân là `StrongReauth` phẳng. `missingFactor` chỉ nhận `reauth`, `reauth.password`, `reauth.totpCode`, `reauth.recoveryCode`, nên trả `null`. Hộp thoại rơi sang banner chung "Mật khẩu hoặc mã chưa đúng", không đánh dấu ô trống.
- Vì sao quan trọng: cùng triệu chứng QA ghi ở BUG-R4-019. Câu "chưa đúng" khi thật ra là "còn thiếu" làm người dùng nghĩ đã gõ sai và có thể nhập lại nhiều lần. Ít gặp vì hộp thoại tự kiểm ô trống trước khi gửi.
- Đề xuất sửa: trong `missingFactor`, sau khi bỏ tiền tố `body.`, bỏ thêm tiền tố `reauth.` rồi so: `reauth` | `password` | `currentPassword` → `'password'`; `totpCode` | `recoveryCode` → `'code'` (vẫn chỉ khi `hasMfa`). Cho mock nhận tham số `fields` đúng op: `{ password: 'password', factor: 'totpCode' }` cho 2 op phẳng. Thêm 1 test: `regenerateMyRecoveryCodes` trả `field: password` → ô mật khẩu báo "Bắt buộc", không có banner. Làm trong v1.0.3 nếu FE-A còn chỗ (khoảng 30 phút), nếu không thì dời sang v1.0.4. Không chặn.
- Trạng thái: Open

### FB-R4-ARC-BE-018-02
- Mức độ: Minor
- Vị trí: `rounds/round-04/outputs/BE/v1.0.3-email.md` mục 10, dòng BUG-R4-019.
- Vấn đề: báo cáo ghi "`field` … `reauth` cho `setMyEmail`/`updateUser`/thiết bị". Ở `ead8ac83`, `trustCurrentDevice` dùng `passwordField: 'currentPassword'` và schema riêng có `currentPassword: z.string().min(1)`. Thiếu mật khẩu ở op này vẫn là `422 REQUIRED` từ zod, không phải `STRONG_REAUTH_REQUIRED`. Chỉ `revokeTrustedDevice` dùng `reauth`. `changeMyPassword` cũng như `trustCurrentDevice`.
- Vì sao quan trọng: QA và FE-A dựa vào bảng này để kiểm lại và ánh xạ. Ghi sai dễ dẫn tới một lỗi giả, hoặc bỏ sót.
- Đề xuất sửa: sửa câu thành "`reauth` cho các op có thân `{…, reauth}` (`setMyEmail`, `updateUser`, `createUser`, `setUserRoles`, `revokeTrustedDevice`, `resetUser2fa`); `password` cho `disableMy2fa`/`regenerateMyRecoveryCodes`; `changeMyPassword`/`trustCurrentDevice` không đổi (`currentPassword`, zod `REQUIRED`)". Việc thống nhất mã thiếu `currentPassword` thành `STRONG_REAUTH_REQUIRED` cho 2 op này để lượt hợp đồng sau, ARC ghi vào spec cùng lúc với mục 1. Không làm ở v1.0.3.
- Trạng thái: Open

### FB-R4-ARC-BE-018-03
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/shared/serialization/serializer.ts`, nhánh `object` của `walk` (`propertyAllowed(p, ctx, owner ? \`${owner}.${key}\` : undefined)`).
- Vấn đề: chuỗi khóa được tạo cho mọi thuộc tính của mọi object có `owner`, dù chỉ cần khi `rbacFieldAllows` đã từ chối. Đo: ~0,07 ms thêm cho 8 000 thuộc tính.
- Vì sao quan trọng: không đáng kể so với p95 300 ms. Chỉ ghi để biết, vì đây là đường nóng của mọi phản hồi.
- Đề xuất sửa: không làm ở v1.0.3. Mã này sẽ bị xóa ở lượt hợp đồng kế tiếp (mục 1). Nếu vì lý do nào đó phải giữ, truyền `owner` và `key` riêng, chỉ ghép chuỗi trong nhánh từ chối.
- Trạng thái: Open

### FB-R4-ARC-BE-018-04
- Mức độ: Suggestion
- Vị trí: `field-policy.ts` `SELF_DATA_FIELDS`; `test/serializer.test.ts` ca "every SELF_DATA_FIELDS key is a D-tagged direct property…".
- Vấn đề: khóa theo tên schema (`Me.*`) và theo operationId (`setMyEmail.*`) dùng chung một không gian tên. Hiện không trùng (schema PascalCase, op camelCase), nhưng không có gì chặn một schema đặt trùng tên một op.
- Vì sao quan trọng: rủi ro rất thấp, và chỉ sống tới khi xóa danh sách.
- Đề xuất sửa: không làm ở v1.0.3. Khi chuyển test thành bất biến spec (mục 1), không còn khóa nên vấn đề tự hết.
- Trạng thái: Open

## Điểm làm tốt
- Thu hẹp đúng chỗ: chỉ bỏ qua bước kiểm mã D, sau khi `writeOnly`, C3, mức khách, `x-visible-to` đã kiểm. Có test cho thấy `User.email`, `AuditEvent.actorName` và C3 không đổi.
- Test "danh sách đóng" ghim cả điều kiện không nhìn thấy được (`Me` chỉ do 3 op trả, không schema nào tham chiếu `Me`). Op mới trả `Me` sẽ làm đỏ test, buộc phải review.
- Tự phát hiện `recoveryCodes` nằm ngoài phạm vi ORC giao mà vẫn thuộc cùng lỗi, ghi rõ lý do và cách bỏ.
