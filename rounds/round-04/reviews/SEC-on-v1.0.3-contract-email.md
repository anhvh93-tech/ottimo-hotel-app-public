# SEC review – hợp đồng OpenAPI 0.3.10 phần email (PR-1 v1.0.3, BUG-R3-032)

- Round 4, đợt v1.0.3, bước **Review** (sớm, trước khi BE-A / FE-A / INT gộp mã). Người review: SEC. Tác giả: ARC.
- Nhánh `origin/arc/v1.0.3-contract`: `c7a9e43c` (hợp đồng 0.3.10 + tệp sinh) và `60f610b7` (hướng dẫn `rounds/round-04/outputs/ARC/v1.0.3-contract-email.md`). Base `origin/main` @ `f11db568`.
- Cách kiểm: `git diff origin/main origin/arc/v1.0.3-contract`, `git show` tệp trên nhánh. Không checkout, không sửa nhánh, không chạy test. Đọc thêm mã `main` mà hợp đồng sẽ chạm: `shared/http/unit-of-work.ts`, `shared/secret-fields.ts`, `shared/redact.ts`, `http.ts`, `identity/public/strong-reauth.ts`, `identity/public/mfa-store.ts`, `identity/internal/users.{controller,service}.ts`, `jobs/email-dispatch.ts`, `jobs/builtin-jobs.ts`, `integrations/notification/{smtp,email-templates}.ts`, `apps/mobile/src/data/cache.ts`, `apps/mobile/src/App.tsx`, `apps/admin-web/src/app/storage.ts`.
- Đối chiếu: `rounds/round-03/reviews/SEC-on-B2-readiness.md` mục 1.4–1.5, `product/docs/security/security-requirements.md` (SR-AUTH-06/07, SR-LOG-04, SR-PWA-01), `product/docs/security/data-risk-assessment.md` (D27, P10, L1/L2).

**Kết luận: ĐẠT CÓ ĐIỀU KIỆN.**

Thiết kế hợp đồng đúng hướng SEC đã đặt ở B2-readiness 1.5. Có S2 cho mọi lần đổi email, thư tới cả địa chỉ cũ lẫn mới, bảng `user_email_change` để địa chỉ cũ không bị ghi đè, outbox không chứa địa chỉ, audit chỉ ghi dạng che. Hợp đồng không có Blocker.

Có **5 thẻ Major**. Thẻ 06 nằm ở mã PWA hiện có, các thẻ còn lại nằm ở mã BE-A / INT sắp viết. Cả 5 phải xong **trong PR-1, trước khi gộp**. Lý do: khi BE trả `Me.email`, lỗi ở thẻ 06 xảy ra ngay trên production. Các lỗi kia làm hỏng đúng đảm bảo mà BUG-R3-032 cần có: chủ tài khoản **luôn** được báo khi email bị đổi.

---

## 1. Trả lời 8 điểm ARC nêu ở mục 10 hướng dẫn

| # | Điểm ARC hỏi | SEC | Điều kiện |
|---|---|---|---|
| 1 | S2 + `Idempotency-Key` ở `setMyEmail`; thứ tự kiểm (dạng/hộp chung trước S2; 403 đích OWN trước S2) | **Duyệt** | Thứ tự này không tạo kênh dò thông tin. Lỗi dạng không phụ thuộc dữ liệu người khác. `EMAIL_FROM` vốn là địa chỉ gửi công khai. Người gọi `updateUser` đã là OWN và xem được vai qua `listUsers`. Kiểm trước S2 còn tránh tiêu mã TOTP cho lệnh chắc chắn bị từ chối. **Nhưng** mã hiện tại gọi S2 **trước** `uow.run`, trước cả kiểm trong service. Muốn đúng thứ tự trên thì phải sửa ở controller: xem thẻ 01 và 02. |
| 2 | Chặn OWN đổi email OWN khác (403), thay vì cho phép kèm thư | **Duyệt** | Đây là lớp phòng thủ thêm, không phải đảm bảo chính. Một OWN bị chiếm vẫn có thể gỡ vai `owner` của OWN-B (`setUserRoles`, còn ≥ 1 OWN) rồi đổi email của B. SEC chấp nhận đường vòng này. Lý do: gỡ vai thu hồi mọi phiên của B, rất dễ thấy. Thư `email_changed` bản `previous` vẫn tới **địa chỉ cũ** của B. Đảm bảo thật là thư `previous`, nên thẻ 04 là Major. |
| 3 | Không xác minh email ở v1.0.3 | **Duyệt** cho v1.0.3 | (a) Bất biến mới (SEC ghi vào `security-requirements.md`): email nhân viên **chỉ** là kênh nhận thông báo. Không bao giờ dùng để đăng nhập, đặt lại mật khẩu, khôi phục 2FA hay nhận mã OTP, cho tới khi có `emailVerifiedAt`. Hôm nay mã không có luồng nào như vậy (đã `grep` module identity). Vì thế đổi email **không** dẫn tới chiếm tài khoản. (b) Điều kiện 3 của tech plan 2.10 (INV xác nhận đã nhận thư) là cổng bắt buộc trước khi bật `EMAIL_NO_RECIPIENT_ALERT`. Khi có MGR thật: OWN xác nhận MGR đã nhận thư `self`. (c) Thẻ 05 phải xong. Nếu không, một địa chỉ API đã nhận nhưng adapter SMTP từ chối sẽ bị bỏ qua **im lặng**. Lúc đó "thư `self` là thư xác nhận" không còn đúng. |
| 4 | Bỏ `production-bootstrap --owner-email` | **Đồng ý đóng** SEC-on-B2-readiness 1.5 #3: "Rejected – lý do ARC 2.8" | Production đã khởi tạo. Dựng lại dùng bản sao lưu. Cơ sở mới thì OWN nhập trên Desk sau 2FA. Không cần thêm đường nhập bí mật nào trên máy chủ. SEC không đòi xếp v1.0.4. |
| 5 | Chữ thư `email_changed` 3 bản; `previous` không có địa chỉ mới | **Duyệt** | Không đưa địa chỉ mới, kể cả dạng che, vào thư gửi địa chỉ cũ. Hộp cũ có thể không còn thuộc về người đó (hộp của công ty cũ, hộp dùng chung). Góp ý chữ ở thẻ 12, không chặn. |
| 6 | `user_email_change` giữ địa chỉ cũ tới khi thư xong / tối đa 7 ngày; `ottimo_app` không có DELETE | **Duyệt** | Phải sửa thẻ 04 (`previous` không được rơi vào `dead NO_RECIPIENT`). Ghi rõ thêm: địa chỉ cũ còn nằm trong **bản sao lưu** theo hạn giữ sao lưu. Đây là thực tế, không cần sửa, nhưng phải có trong erd mục 12 / hồ sơ dữ liệu (thẻ 10). Dòng đã xóa địa chỉ chỉ còn id, người đổi, giờ. Giữ theo hạn audit. |
| 7 | `idempotency_key.response_body` của `setMyEmail` chứa email của chính người gọi (C2) | **Chấp nhận** | Cùng bảng, cùng RLS, cùng job dọn như các phản hồi C2 khác. Cũng chấp nhận việc `request_hash` (sha256, không muối) có email trong thân: bản rõ đã nằm ở `response_body` rồi. Ghi hạn giữ vào erd mục 12: tối đa `idempotency_ttl_hours`, mặc định 48 giờ, trần 720 giờ. Trần 720 giờ dài hơn mốc 7 ngày của `old_email`. Một địa chỉ đã bị thay có thể còn trong `response_body` tới 30 ngày nếu OWN nâng TTL. Mức này chấp nhận được, vì đây là địa chỉ chính người đó tự nhập. Xem thẻ 10. |
| 8 | Audit chỉ `emailMasked`; log không có địa chỉ | **Duyệt** | Phải sửa thẻ 05 về phần ASCII. Bộ che `redact.ts` dùng `EMAIL = /[A-Za-z0-9._%+-]+@…/`. Phần tên có ký tự Unicode (`nguyễn@…`) sẽ **không** khớp và lọt nguyên vào log. Cùng với thẻ 11: Problem 422 không được lặp lại giá trị. |
| + | Không thu hồi phiên khi đổi email | **Duyệt** | Email không phải yếu tố xác thực, xem điểm 3 (a). Tự đổi: người thao tác vừa qua S2, nên đá văng phiên khác của chính họ không thêm lớp bảo vệ nào. OWN đổi giúp FD: thông tin đăng nhập của FD không đổi. Xem lại khi email thành yếu tố khôi phục (v1.1). |

## 2. Đánh giá thêm

### 2.1 Chiếm tài khoản / tắt kênh báo qua đổi email (A → X → Y)

- **Đổi email không cho kẻ tấn công đăng nhập** (điểm 3 (a)). Rủi ro thật là **tắt kênh báo ngoài app**: kẻ có mật khẩu + mã của OWN đổi email sang địa chỉ của chúng. Từ đó mọi thư bảo mật sau đều về tay chúng.
- Thiết kế xử lý đúng ca A → X → Y. Mỗi lần đổi có một dòng `user_email_change` riêng. `previous` lần 1 tới A, lần 2 tới X. Thư `self` của cả hai lần tới địa chỉ lúc gửi là Y. Ghi đè trên `app_user` không làm mất địa chỉ cũ. SEC đồng ý.
- **Hệ quả cần biết**: dispatcher đọc địa chỉ lúc gửi. Mọi thư bảo mật **đã xếp hàng trước** lần đổi nhưng gửi **sau** lần đổi sẽ tới địa chỉ mới, kể cả thư "đã dùng mã khôi phục" của chính lần S2 dùng để đổi email. Vậy với chủ tài khoản thật, thư `previous` là **tín hiệu duy nhất** qua kênh ngoài. SEC chấp nhận, vì giữ nguyên nguyên tắc "outbox không có địa chỉ". Nhưng tín hiệu này không được hỏng ở bất kỳ nhánh nào: thẻ 04 (xóa email khi không còn ai khác có địa chỉ) và thẻ 05 (địa chỉ bị adapter bỏ qua).
- Đổi đồng thời: `setMyEmail` không có `If-Match`. Hai lệnh song song có thể cùng đọc `old = A`. Khi đó X không bao giờ được báo là `previous` (thẻ 08).

### 2.2 Lộ email qua `User.email` / `Me.email`

- `User.email` có `x-visible-to: [owner]`, và `User` chỉ trả ở 4 op `x-roles: [owner]` (`listUsers`, `createUser`, `updateUser`, `setUserRoles`). Đúng với D27 "Đầy" cho OWN. Không thêm vào `staff-directory` / `listCloserCandidates`: đúng.
- `Me` trả ở `login`, `loginMfa` và `getMe`. **PWA `cache.saveMe(me)` lưu nguyên `Me` (chỉ bỏ `csrfToken`) vào IndexedDB.** Từ 0.3.10, email cá nhân của HK/MT sẽ nằm trên máy dùng chung của cơ sở. Như vậy vi phạm SR-PWA-01 ("không SĐT/email"). Xem **thẻ 06**. Desk (`admin-web/app/storage.ts`) không lưu `Me`, nên không bị.

### 2.3 RBAC A112 / A100

- `setMyEmail` `x-roles: [any_staff]`: hợp lý. Mỗi người chỉ đặt email của mình. Phiên hạn chế bị guard chặn. Người chưa bật 2FA thì S2 chỉ cần mật khẩu, đúng `StrongReauth` 0.3.8.
- `updateUser.email` giữ `x-roles: [owner]`. MGR bị 403 ở guard, trước mọi logic. Đúng yêu cầu B2-readiness 1.5 #1.
- Đích OWN → 403. Đích có vai ở cơ sở người gọi không sở hữu → 403 (`assertOwnsEveryProperty`). Hai trường hợp này phải trả **cùng** Problem (cùng mã, không `detail` khác nhau). Chỉ lý do trong `access.denied` mới khác. Xem thẻ 14.
- `gen_traceability` lệch 1 dòng (`User.email` thiếu MGR, ghi chú 45): SEC đồng ý là lệch **có chủ đích**. MGR không cần email của người khác.

### 2.4 S2, rate limit, enumeration

- S2 sai: 5 lần / 15 phút, chung bộ đếm SR-RL-02. Đủ.
- **Đổi thành công không có giới hạn.** Với S2 hợp lệ, mỗi bước TOTP 30 giây cho một lần đổi (mã khôi phục còn nhanh hơn). Kẻ có thông tin đăng nhập, hoặc một nhân viên nghịch, có thể dùng relay `ottimo.vn` gửi hàng trăm thư "Security notice" tới địa chỉ bất kỳ (thư `self` tới địa chỉ họ gõ). Họ cũng có thể dội thư vào hộp của mọi OWN. Mức Minor (thẻ 09), dời v1.0.4 được.
- **Enumeration**: email không unique và không có lỗi "đã có người dùng". Không dò được địa chỉ của người khác. `EMAIL_SHARED_MAILBOX` chỉ lộ `EMAIL_FROM`, vốn công khai. Giữ đúng như vậy: **không** thêm unique, **không** thêm mã lỗi trùng.

### 2.5 Dữ liệu cá nhân – Nghị định 13/2023 (và Luật 91/2025/QH15 đang hiệu lực)

Đội **không** tuyên bố tuân thủ. Đây là các biện pháp đã cài và các điểm cần luật sư xác nhận, gom vào ESC-001 như mọi câu pháp lý khác. SEC không tạo ESC mới.

| Nghĩa vụ (theo hiểu biết của đội, chưa xác nhận) | Hiện trạng thiết kế 0.3.10 | Còn thiếu |
|---|---|---|
| Email là dữ liệu cá nhân cơ bản (ND 13 Đ.2). Phải xử lý đúng mục đích đã báo | Mục đích duy nhất: thư bảo mật tài khoản (P10). Không dùng cho tiếp thị, không đưa vào danh sách khác | Câu mục đích ngay dưới ô nhập (thẻ 13). Thêm "email nhận thư bảo mật" vào dòng D27 của `data-risk-assessment.md` (SEC tự làm) |
| Thông báo trước khi xử lý (Đ.13); đồng ý (Đ.11) hoặc ngoại lệ hợp đồng lao động (Đ.17) | Người tự nhập: biết mục đích nếu có thẻ 13. OWN nhập giúp nhân viên: thư `self` là thông báo cho người đó | Luật sư xác nhận cơ sở pháp lý cho email nhân viên (hợp đồng lao động hay cần đồng ý). SEC thêm câu hỏi này vào danh sách Q của `data-risk-assessment.md` |
| Tối thiểu hóa, thời hạn lưu | Không bắt buộc với vai khác OWN/MGR. Địa chỉ cũ ≤ 7 ngày. Audit chỉ dạng che. Outbox không có địa chỉ | Hạn giữ bản sao lưu, `idempotency_key` (thẻ 10). Email của tài khoản đã khóa giữ vô hạn (thẻ 15) |
| Quyền xóa / sửa của chủ thể (Đ.9) | Tự sửa hoặc xóa (`null`) qua `setMyEmail` | – |
| Chuyển dữ liệu ra nước ngoài (Đ.25) | Thư đi qua Google Workspace relay. Địa chỉ người nhận được xử lý ngoài Việt Nam (đã đúng như vậy với thư bảo mật hiện có) | Hồ sơ chuyển dữ liệu phải có D27-email. Luật sư xác nhận cùng ESC-001 |
| Phát hiện và thông báo vi phạm (Đ.23, 72 giờ) | `email_changed` tới địa chỉ cũ + mọi OWN giúp phát hiện sớm việc chiếm tài khoản | – |

---

## 3. Thẻ feedback

### FB-R4-SEC-ARC-EM-01
- Mức độ: **Major** (cho BE-A)
- Vị trí: `identity/internal` controller `setMyEmail` (sắp viết); hướng dẫn mục 3.1; test T21
- Vấn đề: Lý do bắt buộc `Idempotency-Key` là: gửi lại vì rớt mạng phải nhận phản hồi cũ, không bị 401. Nhưng mẫu controller hiện có (`users.controller.ts`, `mfa.controller.ts`) gọi `StrongReauthService.verify` **trước** `uow.run`. Khóa chỉ được đọc trong `uow.run` (`claimKey`). Lần gửi lại mang **cùng** mã TOTP. Mã này đã bị đánh dấu dùng (chống phát lại theo bước), nên `verify` trả `401 REAUTH_FAILED` **và đếm** SR-RL-02 trước khi kịp tới bước trả phản hồi cũ. Chỉ `frontdesk.controller.ts` đang dùng `uow.completedReplay(req)` (BUG-R2-150).
- Vì sao quan trọng: Người dùng đã lưu thành công vẫn thấy lỗi "sai mật khẩu hoặc mã". Ba lần gửi lại là gần tới khóa 15 phút. FE-A sẽ bảo họ nhập lại, sinh thêm một lần đổi và một loạt thư nữa.
- Đề xuất sửa: Controller `setMyEmail` gọi `await this.uow.completedReplay(req)` **trước** kiểm dạng và S2 (đã có trả lời `IDEMPOTENCY_KEY_REUSED` / `IDEMPOTENCY_IN_PROGRESS`). Thứ tự: replay → dạng / hộp chung → S2 → `uow.run`. T21 phải gửi lại **cùng** `totpCode` đã dùng. Kiểm: 200, có `Idempotent-Replayed: true`, bộ đếm `approval_pin_*` không tăng, không có `stepup.s2_failed`. Không tạo dòng `user_email_change` thứ hai.
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-02
- Mức độ: **Major** (cho BE-A)
- Vị trí: `users.controller.ts` `update` (dòng gọi `this.s2(...)` trước `uow.run`); hướng dẫn mục 3.2 (#1–#5); T4, T22, T7
- Vấn đề: Hợp đồng ghi rõ: chính mình → 422, đích OWN → 403, không sở hữu mọi cơ sở → 403, sai dạng → 422, tất cả **trước** S2. Hiện `NOT_ALLOWED_FOR_SELF` có kiểm trước ở controller (`userId !== p.userId`). Còn `assertOwnsEveryProperty` thì nằm trong `users.service.update`, tức **sau** S2. Nếu BE-A chỉ thêm `email` vào `accountWide` trong service, thứ tự sẽ thành S2 → 403. Hệ quả: tiêu mã TOTP, ghi `stepup.s2_granted` cho một lệnh bị từ chối, và T7 "không tiêu TOTP" sẽ đỏ hoặc bị viết sai cho xanh.
- Vì sao quan trọng: Lệch hợp đồng ở đúng thứ tự kiểm SEC đã duyệt (điểm 1). Nếu sửa bằng cách chỉ chuyển kiểm ra ngoài giao dịch thì lại mở lỗi TOCTOU: vai `owner` được cấp giữa lúc kiểm và lúc ghi.
- Đề xuất sửa: Khi `email !== undefined`, controller đọc trước một lần (READ ONLY, như `setRoles` đang làm với `current`): đích có vai `owner` chưa thu hồi → 403 + `access.denied`; đích có vai ở cơ sở người gọi không sở hữu → 403; kiểm dạng / `EMAIL_SHARED_MAILBOX` → 422. Rồi mới S2. **Giữ** cả hai kiểm 403 trong `users.service.update`, trong giao dịch: đó là lớp có hiệu lực, lớp đọc trước chỉ để không tiêu mã. Test T4 và T22 kiểm thêm: không có `stepup.s2_*` trong audit, TOTP còn dùng được ở lệnh kế tiếp.
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-03
- Mức độ: Minor (cho ARC – sửa hướng dẫn, không đổi spec)
- Vị trí: `v1.0.3-contract-email.md` mục 3.1 bảng thứ tự (#1 → #8) và mục 6 (việc BE-A)
- Vấn đề: Bảng thứ tự chưa có bước "trả phản hồi cũ của khóa đã hoàn tất" (thẻ 01). Mục 6 cũng chưa nói việc tách kiểm trước S2 ở `updateUser` (thẻ 02). BE-A làm đúng theo chữ thì mắc cả hai lỗi.
- Vì sao quan trọng: BE-A đang code song song theo đúng tài liệu này.
- Đề xuất sửa: Thêm dòng "1b – khóa đã hoàn tất → trả lại phản hồi cũ (`uow.completedReplay`), trước mọi kiểm, không hỏi S2" vào 3.1. Thêm vào mục 6: "`updateUser` có `email`: kiểm trước S2 bằng lượt đọc READ ONLY + giữ kiểm trong tx". Báo BE-A ngay, không đợi bước Phản hồi & sửa.
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-04
- Mức độ: **Major** (cho BE-A; INT review)
- Vị trí: `jobs/email-dispatch.ts` claim (đoạn `if (recipients.length === 0) { … deadReason: 'NO_RECIPIENT' }`); hướng dẫn 4.2; T12
- Vấn đề: Hiện danh sách người nhận chỉ lấy từ `app_user` (subject + OWN có email). Nếu BE-A thêm audience `previous` **sau** nhánh `NO_RECIPIENT`, sẽ có ca: OWN duy nhất **xóa** email của mình (`null`) hoặc đổi sang địa chỉ mà adapter từ chối. Khi đó `self` rỗng, `owner` chính là họ và cũng rỗng. Dòng outbox thành `dead NO_RECIPIENT`. `finish` đặt `old_email = NULL`. **Địa chỉ cũ không bao giờ được báo.** T12 hiện chỉ thử ca còn OWN khác có email, nên không bắt được.
- Vì sao quan trọng: Đây đúng là kịch bản xấu nhất ở tech plan 2.3: kẻ có mật khẩu + mã của OWN duy nhất (production hiện có đúng 1 OWN, G-E2) xóa email. Thư `previous` là tín hiệu ngoài duy nhất (mục 2.1).
- Đề xuất sửa: Gom `previous` vào danh sách người nhận **trước** khi quyết `NO_RECIPIENT`. Chỉ `dead NO_RECIPIENT` khi cả ba audience đều rỗng. Thêm test **T23**: 1 OWN duy nhất có email A, xóa email (`null`). Mong đợi: đúng 1 thư `previous` tới A, dòng `done`, rồi `old_email IS NULL`. Thêm **T24**: OWN duy nhất đổi A → X, adapter từ chối X (`INVALID_REQUEST`). Mong đợi: `previous` vẫn tới A, `last_error = RECIPIENT_SKIPPED`.
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-05
- Mức độ: **Major** (cho BE-A + INT)
- Vị trí: hàm kiểm dạng V-03 mới trong `shared/` (hướng dẫn mục 6); `integrations/notification/smtp.ts` `EMAIL_RE` / `isEmailAddress`; `shared/redact.ts` `EMAIL`
- Vấn đề: Hiện có ba định nghĩa "email hợp lệ" khác nhau. (1) Adapter SMTP: `/^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/` (nhận Unicode, bắt buộc có dấu chấm ở tên miền). (2) Bộ che log: chỉ ASCII `[A-Za-z0-9._%+-]`. (3) V-03 mới mà BE-A sắp viết, theo hợp đồng chỉ là "dạng `local@domain`". Nếu API nhận địa chỉ mà adapter từ chối (ví dụ `a@localhost`, `"a b"@x.vn`, có dấu `,`), dispatcher sẽ `skip` im lặng. Khi đó `securityEmailMissing = false`, câu đếm `email_missing` = 0, nhưng không thư nào tới. Nếu API nhận phần tên Unicode, bộ che log không khớp và địa chỉ lọt nguyên vào log.
- Vì sao quan trọng: Lỗi này tái tạo đúng BUG-R3-032 (kênh báo câm), còn tệ hơn vì mọi chỉ số đều báo "có email". Đồng thời vi phạm SR-LOG-04.
- Đề xuất sửa: **Một** hàm duy nhất (BE-A đặt trong `shared/`, INT cho adapter dùng lại hoặc ngược lại) với luật: sau khi cắt khoảng trắng và đổi chữ thường; chỉ ASCII in được; đúng một `@`; phần tên `[a-z0-9._%+-]{1,64}`; tên miền gồm các nhãn `[a-z0-9-]` có ít nhất một dấu chấm; TLD `[a-z]{2,}`; tổng ≤ 254. Như vậy tập API nhận ⊆ tập adapter nhận ⊆ tập bộ che khớp. Test: bảng ca chung chạy qua cả hàm V-03, `isEmailAddress` và `redactText` (mỗi địa chỉ hợp lệ phải được cả ba nhận hoặc che). Thêm ca `a@b.c,d@e.f`, `"x"@y.vn`, `nguyễn@x.vn`, `a@localhost` → 422 `EMAIL_INVALID`.
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-06
- Mức độ: **Major** (cho MOB – ORC giao người làm; mã không thuộc BE-A/FE-A/INT)
- Vị trí: `product/apps/mobile/src/data/cache.ts` `saveMe` (chỉ bỏ `csrfToken`); `App.tsx` dòng `await cache.saveMe(me)`; hợp đồng `Me.email`
- Vấn đề: Từ 0.3.10, `getMe` trả `email`. PWA lưu nguyên `Me` vào IndexedDB (`snapshot/me`) để mở offline. Email cá nhân của HK/MT/FD vì thế nằm trên máy di động **dùng chung** của cơ sở. SR-PWA-01 cấm: "không SĐT/email".
- Vì sao quan trọng: Vi phạm yêu cầu bảo mật đã duyệt, với dữ liệu cá nhân (C2) trên thiết bị nhiều người dùng. Lỗi xuất hiện **ngay khi BE của PR-1 lên production**, dù PWA không có UI email nào.
- Đề xuất sửa: `saveMe` lưu theo **danh sách cho phép** thay vì danh sách loại trừ. Chỉ giữ `id`, `displayName`, `activePropertyId`, `properties` (các trường PWA đang đọc); bỏ `email`, `securityEmailMissing`, `csrfToken` và mọi trường mới sau này. Thêm vào `cache.test.ts`: `Me` có `email` → bản lưu không có khóa `email`, cũng không có chuỗi chứa `@`. Gộp **cùng PR-1** (hoặc PR riêng gộp trước PR-1). Phương án khác nếu không kịp: BE không trả `Me.email` cho phiên PWA. SEC không khuyến nghị, vì hợp đồng sẽ phụ thuộc client.
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-07
- Mức độ: Minor (cho BE-A)
- Vị trí: outbox `staff.email` `email_changed` (`property_id = tx.ctx.propertyId`); dispatcher `AND ($3::uuid IS NULL OR r.property_id = $3)`; giả định G-E3
- Vấn đề: G-E3 ghi "mọi OWN của các cơ sở người được đổi có vai". Nhưng `owners: true` của dispatcher chỉ lấy OWN của **cơ sở ghi trên dòng outbox**, tức cơ sở đang mở của người gọi. Nhân viên có vai ở 2 cơ sở tự đổi email khi đang mở cơ sở 1 thì OWN chỉ ở cơ sở 2 không nhận thư. Thông báo trong app (tính theo tập khác) sẽ lệch với thư.
- Vì sao quan trọng: Hôm nay production có 1 cơ sở, 1 OWN, nên chưa xảy ra. Sẽ xảy ra khi mở cơ sở thứ hai.
- Đề xuất sửa: v1.0.3: ghi rõ giới hạn này vào hướng dẫn 4.2 và G-E3, cho thông báo trong app dùng **cùng** tập người nhận với dispatcher. v1.0.4: payload `ownerPropertyIds` (chỉ id) để dispatcher lấy OWN của các cơ sở đó, bỏ trùng theo địa chỉ như đã thiết kế.
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-08
- Mức độ: Minor (cho BE-A)
- Vị trí: `setMyEmail` service – bước ghi (hướng dẫn 4.1 #1–#2)
- Vấn đề: `setMyEmail` không có `If-Match`. Hai lệnh song song cho cùng người (hai tab, hoặc tự đổi đúng lúc OWN đổi giúp) có thể cùng đọc `old_email = A` rồi cùng ghi. Hai dòng `user_email_change` cùng ghi `A`. Địa chỉ trung gian không bao giờ được báo là `previous`.
- Vì sao quan trọng: Lỗ nhỏ trong đảm bảo "mọi địa chỉ bị thay đều được báo" (mục 2.1).
- Đề xuất sửa: Đọc email hiện tại bằng `SELECT email FROM app_user WHERE id = $1 FOR UPDATE` trong cùng giao dịch ghi. `updateUser` đã khóa dòng qua `load(..., true)`, nên giữ nguyên. Test: hai lệnh song song A → X và A → Y cho ra hai dòng có `old_email` lần lượt `A` và (`X` hoặc `Y`).
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-09
- Mức độ: Minor (cho ARC + BE-A; dời v1.0.4 được)
- Vị trí: `setMyEmail` `x-rate-limit` (chỉ đếm lần sai); `updateUser.email`
- Vấn đề: Không giới hạn số lần đổi **thành công**. Mỗi lần đổi gửi thư tới một địa chỉ do người gõ tự chọn, cộng thư tới mọi OWN.
- Vì sao quan trọng: Dùng relay `ottimo.vn` gửi thư "Security notice" tới địa chỉ lạ. Hậu quả: uy tín tên miền, có thể bị Google chặn relay, đúng lúc kênh này cần chạy. Dội thư vào hộp OWN cũng làm thư thật bị chìm.
- Đề xuất sửa: Giới hạn 5 lần đổi thành công / người được đổi / 24 giờ. Quá → `429 RATE_LIMITED`, đếm theo `user_email_change` (có sẵn `user_id`, `changed_at`), không cần bảng mới. Nếu không kịp v1.0.3: ghi vào rủi ro còn lại và thêm dòng `ops-check` đếm `user_email_change` 24 giờ (chỉ số).
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-10
- Mức độ: Minor (cho ARC – erd mục 12; SEC tự cập nhật `data-risk-assessment.md`)
- Vị trí: `erd.md` mục 12 (bảng hạn giữ), 4.16
- Vấn đề: Mục 12 mới có dòng `user_email_change.old_email`. Chưa ghi hai chỗ khác còn giữ địa chỉ: (a) `idempotency_key.response_body` của `setMyEmail` (`{email}`), dọn theo `idempotency_ttl_hours`, mặc định 48 giờ, trần 720 giờ; (b) bản sao lưu DB, theo hạn giữ sao lưu.
- Vì sao quan trọng: Hồ sơ hạn giữ phải đúng thực tế khi luật sư rà (ESC-001) và khi trả lời yêu cầu xóa dữ liệu của nhân viên.
- Đề xuất sửa: Thêm 2 dòng vào mục 12. SEC đề nghị **không** đổi mã cho việc này. Lựa chọn `storeBody: false` + đọc lại email lúc replay phức tạp hơn mà lợi ích nhỏ (điểm 7).
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-11
- Mức độ: Minor (cho BE-A)
- Vị trí: `parseBody` / zod của `setMyEmail` và `updateUser`; thông báo `account_security_change`; T16
- Vấn đề: Hợp đồng nói "không đưa địa chỉ vào Problem". Bộ test T16 chỉ kiểm log. Chưa có test nào bảo đảm thân 422 (`errors[]`), `access.denied.after`, nội dung thông báo trong app và sự kiện SSE không chứa giá trị email.
- Vì sao quan trọng: Lớp chuyển lỗi zod dễ đưa `received` / giá trị vào `detail`. Thông báo trong app dễ bị "tiện tay" thêm địa chỉ mới.
- Đề xuất sửa: Thêm khẳng định "không có `@`" vào T7 (thân 422), T4 (`access.denied`), T6 (thông báo + payload SSE) và T9 (outbox, đã có). Thông báo `account_security_change` chỉ có `refCode` + `via`.
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-12
- Mức độ: Suggestion (cho INT; UXD/CPY duyệt chữ)
- Vị trí: mẫu `email_changed` (hướng dẫn 4.3, tech plan 2.1 (f))
- Vấn đề / góp ý:
  1. Bản `self` khi `via = owner`: người nhận không tự đổi. Câu "Không phải bạn → báo chủ" sẽ làm họ bối rối. Đề nghị truyền thêm `via` vào tham số (không phải dữ liệu cá nhân), chọn câu "The property owner set this address…" / "Chủ cơ sở đã đặt địa chỉ này…".
  2. Cả 3 bản thêm một câu chống lừa đảo: "OTTIMO security notices never contain links and never ask for your password or codes." / "Thư bảo mật của OTTIMO không bao giờ có link và không bao giờ hỏi mật khẩu hay mã." Từ nay thư tới cả địa chỉ do người dùng tự gõ, kể cả hộp lạ.
  3. Bản `previous`: thêm "Do not reply to this email; contact the owner directly." / "Không trả lời thư này; hãy liên hệ trực tiếp chủ cơ sở." Hộp `EMAIL_FROM` là hộp chung (B2-readiness 1.4).
  4. Tiêu đề cố định "Security notice: …", không có tên người (tiêu đề hiện trên màn hình khóa).
- Vì sao quan trọng: Giảm nhầm lẫn và giảm rủi ro lừa đảo giả danh thư bảo mật. Chữ vẫn theo brand OTTIMO (EN dẫn – VI hỗ trợ, ngắn, điềm tĩnh, không emoji).
- Đề xuất sửa: Như trên. Test `email-templates.test.ts` khẳng định bản `previous` không có `@`, ngoài địa chỉ trong chân thư nếu có.
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-13
- Mức độ: Minor (cho FE-A; UXD/CPY chốt chữ)
- Vị trí: `SecurityPage.tsx` khối "Email nhận thông báo bảo mật"; `UsersPage.tsx` hộp sửa email (hướng dẫn mục 7)
- Vấn đề: (a) Chưa có câu mục đích xử lý dữ liệu cạnh ô nhập (ND 13 Đ.13, mục 2.5). (b) Câu sau khi lưu "đã gửi **thư xác nhận**" dễ hiểu là phải bấm link xác nhận. Thư không có link, và v1.0.3 không xác minh.
- Vì sao quan trọng: (a) là biện pháp tối thiểu cho nghĩa vụ thông báo. (b) Nếu người dùng chờ một link không bao giờ tới, họ sẽ nghĩ hệ thống hỏng hoặc đi tìm "link xác nhận". Đó đúng là thói quen kẻ lừa đảo lợi dụng.
- Đề xuất sửa: (a) Một dòng phụ, ví dụ "Used only to send security notices about your account." / "Chỉ dùng để gửi thông báo bảo mật về tài khoản của bạn." Ở hộp của OWN: "…about this person's account." (b) Đổi thành "thư **thông báo**", giữ phần "không nhận được trong 15 phút: kiểm tra Spam hoặc địa chỉ đã nhập". Không hiển thị email trong toast, URL, `console`. Test MSW đã ghi ở mục 7 thêm ca chuỗi VI + EN cho câu (a).
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-14
- Mức độ: Suggestion (cho BE-A)
- Vị trí: `updateUser` nhánh 403 đích OWN và 403 `assertOwnsEveryProperty`; `recordDenied` (`reason: 'OTHER_PROPERTY'` đang cố định)
- Vấn đề / góp ý: Hai nhánh 403 phải trả cùng một thân Problem (`FORBIDDEN_ACTION`, không `detail` riêng). Như vậy câu trả lời không cho biết người đích là OWN ở một cơ sở khác. Ngược lại, `access.denied.reason` nên **khác** nhau (ví dụ `TARGET_OWNER` và `OTHER_PROPERTY`) để OWN đọc nhật ký phân biệt được. Hiện controller ghi cứng `OTHER_PROPERTY`.
- Vì sao quan trọng: Điều tra sự cố. Một OWN bị chiếm cố đổi email OWN khác là tín hiệu rõ, cần đọc được trong audit.
- Đề xuất sửa: Như trên. T4 kiểm `reason = TARGET_OWNER`.
- Trạng thái: Open

### FB-R4-SEC-ARC-EM-15
- Mức độ: Suggestion (cho PO – backlog v1.1)
- Vị trí: vòng đời `app_user.email` của tài khoản `disabled`
- Vấn đề / góp ý: Nhân viên nghỉ việc thì tài khoản bị khóa, nhưng email cá nhân của họ nằm lại vô hạn. Dispatcher không gửi cho `disabled`, nên dữ liệu này không còn mục đích.
- Vì sao quan trọng: Tối thiểu hóa và hạn lưu (ND 13 / Luật 91/2025).
- Đề xuất sửa: v1.1: J16 đặt `email = NULL` cho tài khoản `disabled` quá 90 ngày, ghi `purge_journal` chỉ id. Kèm `emailVerifiedAt` nếu làm xác minh.
- Trạng thái: Open

---

## 4. Việc phải xong trước khi gộp PR-1

| Thẻ | Ai | Điều kiện đóng |
|---|---|---|
| 01 | BE-A | `completedReplay` trước S2; T21 gửi lại cùng TOTP → 200 replay, không đếm sai |
| 02 | BE-A | Kiểm 422/403 của `updateUser.email` trước S2 (đọc trước) + giữ kiểm trong tx; T4/T22 không có `stepup.s2_*` |
| 03 | ARC | Hướng dẫn mục 3.1 + 6 cập nhật, BE-A đã được báo |
| 04 | BE-A (INT review) | `previous` vào danh sách trước `NO_RECIPIENT`; T23, T24 xanh |
| 05 | BE-A + INT | Một hàm kiểm email dùng chung, chỉ ASCII; bảng ca chung qua V-03, `isEmailAddress`, `redactText` |
| 06 | MOB (ORC giao) | `saveMe` theo danh sách cho phép, test không có `email`; gộp cùng hoặc trước PR-1 |

Các thẻ Minor (07–11, 13) nên làm trong PR-1 nếu kịp. Không kịp thì trả lời Deferred kèm số backlog, riêng 07 phải ghi rõ giới hạn vào hướng dẫn. Thẻ 12, 14, 15: tác giả tự cân nhắc.

**SEC tự làm** (không chặn PR-1, xong trong bước Phản hồi & sửa):
- `security-requirements.md`: ghi bất biến "email nhân viên không phải yếu tố xác thực/khôi phục cho tới khi có `emailVerifiedAt`" và đóng SEC-on-B2-readiness 1.5 #3.
- `data-risk-assessment.md`: dòng D27 thêm email nhận thư bảo mật; thêm câu hỏi luật sư (cơ sở pháp lý cho email nhân viên, chuyển qua Google Workspace) vào danh sách gom cho ESC-001.

QA staging: cần thêm 3 ca vào bộ ca SEC của tech plan 2.12: T23 (OWN duy nhất xóa email → thư `previous` tới địa chỉ cũ), gửi lại cùng khóa + cùng mã (thẻ 01), và dump IndexedDB PWA sau đăng nhập không có `@` (thẻ 06).

## 5. Điểm làm tốt (nên giữ)

- Bảng `user_email_change` có `old_email` tự xóa, còn outbox chỉ chứa id. Đây là cách đúng để vừa báo được địa chỉ cũ trong ca A → X → Y, vừa không rải địa chỉ ra outbox và log. Không có DELETE cho `ottimo_app`, có RLS ENABLE + FORCE.
- Không unique email, không mã lỗi "đã có người dùng": không có kênh dò địa chỉ. Kiểm dạng và hộp chung trước S2, nên không tiêu mã cho lệnh hỏng.
- Không làm đường nhập email qua CLI, SQL tay hay `mail-test` với địa chỉ thật. Email của INV không đi qua chat, repo hay lịch sử shell (tech plan 2.7, 2.9).
