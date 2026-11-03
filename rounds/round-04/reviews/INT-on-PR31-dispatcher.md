# INT review PR #31 (`v1.0.3-email`, nháp) – phần BE gọi mẫu thư `email_changed`

- Round 4 – v1.0.3 – bước **Review**. Người review: INT. Tác giả: BE-A (dispatcher, job dọn), CPY/UXD (thẻ thuật ngữ).
- Đã đọc: `git diff origin/main...origin/v1.0.3-email -- product/services/api/src/jobs product/integrations`; `origin/v1.0.3-email:rounds/round-04/outputs/BE/v1.0.3-email.md`; bản đầy đủ `email-dispatch.ts`, `smtp.ts` (`isEmailAddress`), `shared/email.ts` trên nhánh; `v1.0.2:…/email-dispatch.ts` và `v1.0.2:…/email-templates.ts` (kiểm quay lui); `UXD-on-v1.0.3-email-desk.md` thẻ 12; `product/design/content-guide.md` mục 3 và `strings-{vi,en}.json`. Không checkout, không chạy test, không sửa code.

## Kết luận: **ĐẠT**

Cả 4 điểm hợp đồng giữa dispatcher và mẫu thư đều đúng. Không có Blocker/Major. Có 3 Minor và 2 Suggestion, đều không chặn PR-1. Thẻ thuật ngữ là đề xuất cho CPY, nên gộp vào đợt chữ v1.0.4.

## 1. Bảng kiểm

| # | Điểm kiểm | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Params `{audience, via, staffName, occurredAt}`, không có địa chỉ | **Đạt** | `deliver()` gửi `params: { ...row.params, audience: rcpt.audience }`. `row.params` chỉ có `occurredAt` (giờ địa phương), `staffName` (display_name, có thì mới thêm), `effectiveDate` (chỉ khi payload có, `email_changed` không có), `via` (chỉ khi là `self` hoặc `owner`). `old_email` chỉ vào `Recipient.email` → `to`, không vào params. Test BE dòng 719 kiểm `JSON.stringify(m.params)` không chứa `@`. Mẫu còn bỏ qua mọi khóa lạ (test INT `leaky`). |
| 2 | `idempotencyKey` bản previous = `<outboxId>:<emailChangeId>` | **Đạt** | `idempotencyKey: \`${row.id}:${rcpt.userId}\``. Với previous, `userId = emailChangeId` (`previous.push({ userId: emailChangeId, … })`). `emailChangeId` đi qua `ids()` (lọc UUID), và câu SELECT ràng thêm `user_id = subjectIds[0]` nên payload không trỏ được tới dòng đổi của người khác. Message-ID = sha256(khóa) nên mỗi bản có Message-ID riêng, ổn định khi gửi lại. Chưa có test khóa định dạng này (thẻ 03). |
| 3 | Bỏ trùng theo địa chỉ chạy trước khi quyết NO_RECIPIENT | **Đạt** | Thứ tự trong `claim()`: gom self/owner → thêm previous → bỏ trùng theo `email.trim().toLowerCase()` (thứ tự self → previous → owner) → rồi mới `if (recipients.length === 0) NO_RECIPIENT`. OWN duy nhất xóa email vẫn có 1 bản previous (T23). Adapter từ chối X thì previous vẫn tới A (T24). |
| 4 | Quay lui: worker v1.0.2 gặp mẫu lạ thì dead BAD_TEMPLATE | **Đạt** | `v1.0.2:email-dispatch.ts` dòng 200: `if (!isStaffEmailTemplate(template)) deadReason 'BAD_TEMPLATE'` chạy trước mọi câu query phụ thuộc payload. Danh sách mẫu ở v1.0.2 không có `email_changed`. `statusOf` gặp `deadReason` thì trả `dead` ngay ở lần thử 1, không thử lại. Test chung `email-dispatch.test.ts:223` đã phủ nhánh này. `finish` của v1.0.2 dùng `payload || jsonb_build_object(...)`, nên `emailChangeId` còn nguyên trong payload. Thẻ 02 bàn chuyện xếp lại hàng đợi. |
| 5 | Rủi ro 4 của BE: `isEmailAddress` nhận Unicode | **Đồng ý dời v1.0.4**, kèm điều kiện ở thẻ 04 | Xem mục 2. |
| 6 | Thẻ UXD 12 (thuật ngữ) | **Đề xuất ở thẻ 06**, không sửa | Xem mục 3. |

Kiểm thêm, không có lỗi:
- `user_property_role` là bảng cấp tổ chức (0001: "organisation-level on purpose"). Vì vậy câu lấy cơ sở có vai, chạy trong context của một cơ sở, vẫn thấy vai ở mọi cơ sở. SEC 07 đúng ở tầng dữ liệu.
- `ownerScope = []` (dòng không có cơ sở và người được đổi không còn vai) cho ra không có OWN, đúng ý.
- Dòng đổi chỉ bị xóa `old_email` khi `rowCount > 0`, nên lượt mất lease không xóa địa chỉ cũ của lượt đang giữ dòng. Tổng back-off khoảng 4,4 giờ, ngắn hơn hẳn mốc 7 ngày của `email_change.purge`, nên job dọn không cướp địa chỉ của một dòng còn đang thử.
- Log vẫn chỉ có outboxId, mẫu, lần thử và mã lỗi.

## 2. `isEmailAddress` rộng hơn luật API: đồng ý dời v1.0.4

Lý do đồng ý:
- Adapter chỉ nhận `to` lấy từ DB (`app_user.email`, `user_email_change.old_email`). Mọi địa chỉ ghi mới ở v1.0.3 đã qua `normalizeSecurityEmail` (ASCII in được). BE đã chạy một bảng ca chung qua cả 3 hàm: tập địa chỉ API nhận ⊆ tập adapter nhận ⊆ tập bộ che.
- Tập adapter rộng hơn không mở lỗ nào. `EMAIL_RE` loại `\s` (có cả CR/LF), `<>"',;` và `@` thứ hai, nên không chèn được header hay thêm người nhận. Adapter và dispatcher không ghi địa chỉ vào log, nên bộ che có bỏ sót Unicode cũng không lộ gì. Lỗi adapter chỉ trả chuỗi cố định (`Invalid recipient`).
- Nếu siết ngay ở v1.0.3, địa chỉ Unicode cũ (nếu có) sẽ âm thầm thành `RECIPIENT_SKIPPED`. Khi chưa đếm dữ liệu thật thì đó là đổi hành vi không cần thiết.

Điều kiện cho v1.0.4: thẻ 04.

## 3. Thẻ feedback

### FB-R4-INT-BE-31-01
- Mức độ: Minor
- Vị trí: `product/services/api/src/jobs/email-dispatch.ts`, `claim()`, khối "One copy per address, in this order: self, previous, owner"
- Vấn đề: `app_user.email` không unique (chỉ chặn `EMAIL_FROM`). Ở cơ sở nhỏ có ca nhân viên dùng tạm email của chủ đầu tư. Khi người đó đổi sang email riêng, địa chỉ cũ A cũng là email của một OWN. Bỏ trùng giữ bản `previous` và bỏ bản `owner`, nên chủ đầu tư nhận câu "This address no longer receives security notices for your OTTIMO Desk account… change your password". Họ dễ hiểu nhầm là tài khoản của chính mình bị đổi, và không biết đó là tài khoản của ai (bản previous không in tên). Ca ngược lại (địa chỉ mới X trùng email OWN) cũng tương tự với bản `self`.
- Vì sao quan trọng: thư bảo mật gây hiểu nhầm khiến chủ đầu tư hoảng và đi đổi mật khẩu của mình, trong khi đúng ra cần hỏi nhân viên. Hiếm gặp nhưng là ca có thật ở OTTIMO (10 căn, ít người, hay dùng chung hộp thư).
- Đề xuất sửa: v1.0.4, sau khi ARC/CPY đồng ý: khi một địa chỉ vừa là `previous` (hoặc `self`) vừa là email của OWN khác người được đổi, giữ bản `owner` (có tên, có "check with them today"). Thứ tự bỏ trùng thành self → owner → previous cho riêng địa chỉ trùng OWN. SEC 04 vẫn giữ, vì địa chỉ cũ vẫn nhận một thư. Thêm 1 ca test "địa chỉ cũ = email OWN". Không chặn PR-1.
- Trạng thái: Open

### FB-R4-INT-BE-31-02
- Mức độ: Minor
- Vị trí: BE báo cáo mục 4 Q1 (quay lui); runbook deploy PR-2 (OPS)
- Vấn đề: hành vi BAD_TEMPLATE đúng, nhưng thư `email_changed` bị dead do worker v1.0.2 sẽ không bao giờ được gửi, kể cả khi lên lại v1.0.3. Cửa sổ này có cả khi deploy bình thường, nếu api v1.0.3 lên trước worker.
- Vì sao quan trọng: thư tới địa chỉ cũ là cảnh báo duy nhất mà chủ hộp thư cũ nhận được (SEC 04). Mất thư thì người bị chiếm tài khoản không biết.
- Đề xuất sửa: (a) runbook PR-2: lên worker **trước** api (worker v1.0.3 vẫn chạy được mẫu cũ, api v1.0.2 không sinh `email_changed`), quay lui theo thứ tự ngược lại. (b) Thêm vào runbook một câu xếp lại hàng đợi, chạy tay sau khi lên lại v1.0.3 và trong 7 ngày kể từ lúc đổi: `UPDATE outbox_message SET status='pending', attempts=0, next_attempt_at=NULL, last_error=NULL WHERE topic='staff.email' AND status='dead' AND last_error='BAD_TEMPLATE' AND payload->>'template'='email_changed'`. Được vì v1.0.2 không xóa `old_email` và `emailChangeId` còn trong payload. Quá 7 ngày thì job dọn đã xóa `old_email`, câu này chỉ gửi lại bản self/owner. OPS/BE quyết có đưa vào không.
- Trạng thái: Open

### FB-R4-INT-BE-31-03
- Mức độ: Minor
- Vị trí: `product/services/api/test/integration/v103-security-email.test.ts` (nhóm T10/T13)
- Vấn đề: chưa có test khóa định dạng `idempotencyKey` của bản previous (`<outboxId>:<emailChangeId>`). Hiện chỉ code bảo đảm. Message-ID của adapter suy từ khóa này, và cơ chế "không gửi trùng khi thử lại" dựa vào `emailChangeId` nằm trong `sentUserIds`.
- Vì sao quan trọng: nếu sau này ai đổi khóa theo dõi của previous (ví dụ dùng userId của người được đổi), previous và self sẽ trùng khóa. Bản previous khi đó bị coi là đã gửi và bị bỏ qua mà không có test nào đỏ.
- Đề xuất sửa: thêm 2 assert vào T10: `adapter.sent.find(m => m.params.audience === 'previous').idempotencyKey === \`${outboxId}:${emailChangeId}\``, và mọi `idempotencyKey` trong một dòng outbox khác nhau. Có thể làm ngay trong PR-1 (chỉ test) hoặc v1.0.4.
- Trạng thái: Open

### FB-R4-INT-BE-31-04
- Mức độ: Suggestion (INT tự nhận làm ở v1.0.4)
- Vị trí: `product/integrations/notification/smtp.ts` `EMAIL_RE` / `isEmailAddress`; `product/services/api/src/shared/email.ts` `normalizeSecurityEmail`
- Vấn đề: hai luật địa chỉ tách rời. Adapter nhận Unicode, API thì không (rủi ro 4 của BE, thẻ SEC 05).
- Vì sao quan trọng: hiện chưa có lỗ (mục 2), nhưng hai luật sẽ trôi xa nhau theo thời gian.
- Đề xuất sửa: INT đồng ý dời sang v1.0.4, với 3 điều kiện: (1) PR-2 thêm vào `ops-check` một câu đếm chỉ đọc, chỉ in số: địa chỉ `app_user.email` không khớp luật ASCII (vai `ottimo_readonly`, như câu tiền kiểm Q3). (2) v1.0.4 đưa luật vào **một** hàm dùng chung (đặt ở `@ottimo/integrations` hoặc package chung). API dùng nó để chuẩn hóa, adapter dùng nó để kiểm. Bảng ca chung của BE chạy trên hàm đó. (3) Chỉ siết adapter khi số đếm ở (1) bằng 0, hoặc đã báo chủ tài khoản đổi địa chỉ.
- Trạng thái: Open

### FB-R4-INT-BE-31-05
- Mức độ: Suggestion
- Vị trí: `email-dispatch.ts` `deliver()`; BE G-BE-4
- Vấn đề: `staffName` vẫn đi vào params của bản `self` và `previous`. Mẫu không in, nhưng adapter vẫn nhận tên người cho một địa chỉ (previous) có thể đã không còn là của người đó.
- Vì sao quan trọng: tối thiểu dữ liệu. Nếu sau này adapter hoặc mock có ghi params (debug, lưu thư mock để QA xem), tên sẽ đi cùng địa chỉ cũ.
- Đề xuất sửa: v1.0.4, `params: rcpt.audience === 'owner' ? {...} : omit(row.params, 'staffName')`. Không chặn.
- Trạng thái: Open

### FB-R4-INT-CPY-31-06
- Mức độ: Suggestion (cho CPY quyết; INT sửa mẫu khi CPY chốt; không sửa ở PR-1)
- Vị trí: `product/integrations/notification/email-templates.ts`: `notYouVi`, `mfa_reset*` (subject + thân), `emailChangedCopy` (madeByOwner, câu hành động, bản owner via=owner, câu chống lừa đảo). Liên quan `FB-R4-UXD-FE-EM-12`.
- Vấn đề: thư và Desk gọi cùng một thứ bằng hai tên. Bảng thuật ngữ `content-guide.md` mục 3 là "một khái niệm – một tên": `owner` = **Chủ đầu tư / Owner**. Desk cũng dùng "báo chủ đầu tư…", "ask the owner…" trong các thông báo lỗi. Cụ thể:

  | Khái niệm | Thư hiện tại | Desk (`strings-*.json`) |
  |---|---|---|
  | vai owner (VI) | chủ cơ sở (6 chỗ) | Chủ đầu tư / chủ đầu tư |
  | vai owner (EN) | the owner; **the property owner** (2 chỗ); An owner | Owner / the owner |
  | 2FA (EN) | two-step sign-in | 2-step verification |
  | 2FA (VI) | đăng nhập 2 bước | xác thực 2 bước |
  | mã 2FA | sign-in codes / mã đăng nhập | authentication code / mã xác thực (`auth.totp.title`) |
  | email bảo mật | notification email / email nhận thông báo bảo mật | khớp sau thẻ UXD 03 (`secmail.title` → "Email nhận thông báo bảo mật" / "Notification email") |

- Vì sao quan trọng: nhân viên đọc thư rồi mở Desk để làm theo. Nếu thư nói "đăng nhập 2 bước" mà màn hình ghi "Xác thực 2 bước", hoặc "liên hệ chủ cơ sở" mà danh sách người dùng ghi "Chủ đầu tư", họ phải tự đoán. Với thư bảo mật, lệch chữ còn làm thư trông giống thư giả.
- Đề xuất (theo brand: ngắn, điềm tĩnh, EN dẫn – VI hỗ trợ, không emoji): **lấy chữ của Desk làm chuẩn cho mọi thư nhân viên.**
  - EN: "the owner" (bỏ "property"). Ví dụ "The change was made by the owner." / "please contact the owner directly." Giữ "An owner changed…" vì có thể có nhiều OWN.
  - VI: "chủ đầu tư" (viết thường giữa câu, như các câu lỗi của Desk). Ví dụ "Thay đổi do chủ đầu tư thực hiện." / "Một chủ đầu tư vừa đổi…" / "hãy báo chủ đầu tư hoặc đội OTTIMO…".
  - 2FA: "2-step verification" / "xác thực 2 bước". Subject `mfa_reset*`: "Security notice: 2-step verification was reset" / "Thông báo bảo mật: xác thực 2 bước đã được đặt lại".
  - Câu chống lừa đảo: "…never ask for your password or verification codes." / "…không bao giờ hỏi mật khẩu hay mã xác thực."
  - Giữ nguyên "notification email" / "email nhận thông báo bảo mật" (đã khớp Desk sau thẻ UXD 03).
  - Thời điểm: **v1.0.4, làm một đợt chữ cho cả 5 mẫu**, gộp với phương án A của `FB-R4-CPY-INT-05` (footer chung). Không làm ở PR-1 vì: `notYouVi` và `mfa_reset*` đã chạy ở v1.0.2, sửa riêng `email_changed` thì một họ thư lại có hai tên; subject `mfa_reset*` đổi cần CPY duyệt cả EN lẫn VI. Thêm một dòng "thư nhân viên dùng thuật ngữ mục 3" vào `content-guide.md` để sau này không lệch lại. INT sẽ thêm test chặn "chủ cơ sở", "two-step sign-in", "đăng nhập 2 bước" trong mọi mẫu.
  - Nếu CPY thấy "chủ đầu tư" quá trang trọng trong thư gửi nhân viên, phương án thay thế: VI "chủ khách sạn". Nhưng khi đó phải đổi cả `role.owner` trên Desk, phạm vi lớn hơn. INT không khuyến nghị.
- Trạng thái: Open

## 4. Điểm làm tốt
- Gom previous trước NO_RECIPIENT và bỏ trùng theo địa chỉ, không theo userId. Đây đúng là chỗ dễ sai nhất của mẫu này, và có test T23/T24 đi kèm.
- `old_email` được xóa trong cùng tx 2 khi dòng kết thúc, có `rowCount` canh lease, và job 7 ngày làm lưới an toàn. Địa chỉ cũ không sống lâu hơn thư báo của nó.
- Ràng `emailChangeId` với `user_id` của người được đổi trong câu SELECT, nên payload hỏng không thể kéo địa chỉ của người khác vào thư.
