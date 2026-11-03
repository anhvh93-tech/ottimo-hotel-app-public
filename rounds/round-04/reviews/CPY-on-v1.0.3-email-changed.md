# CPY review – mẫu thư `email_changed` (v1.0.3, PR-1, BUG-R3-032)

- Người review: CPY | Round 4 – đợt v1.0.3 – bước **Review** | 03/11/2026
- Đối tượng: `product/integrations/notification/email-templates.ts` (case `email_changed`, 3 audience + bản trung tính) và `rounds/round-04/outputs/INT/v1.0.3-email-templates.md` trên nhánh `origin/int/v1.0.3-email-templates` @ `7413c8cf`. Không checkout, không sửa nhánh.
- Đối chiếu: brand guideline mục 2 (ngắn, lịch sự, điềm tĩnh, EN dẫn – VI hỗ trợ, không emoji); giọng các mẫu "Security notice" có sẵn (`mfa_recovery_code_used`, `mfa_reset*`); thẻ SEC `FB-R4-SEC-ARC-EM-12`; ARC `v1.0.3-contract-email.md` 4.2–4.3 (cột `via 'self'|'owner'` trong `user_email_change`).

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

Điểm tốt đã đạt: không địa chỉ (đầy đủ hay che), không link, không mã, không tên trong tiêu đề, không emoji, không IN HOA, EN trước VI, khung thư và màu đúng brand. Điều kiện để ĐẠT: sửa thẻ **01** (Major). Các thẻ 02–06 là Minor/Suggestion, nên làm cùng lượt vì chỉ đụng chuỗi trong `copyFor` và hai hằng chân thư.

| Thẻ | Mức | Tóm tắt |
|---|---|---|
| 01 | Major | Bản `self`/`previous` khi chủ đổi giúp (`via = owner`) đang bảo người nhận "không phải bạn → đổi mật khẩu" – sai tình huống |
| 02 | Minor | Bản `previous` chưa dặn "không trả lời thư này" ngay trong câu hành động (SEC EM-12.3) |
| 03 | Minor | Thời gian lồng ngoặc kép: "(23/10/2026 14:05 (GMT+7))" và gắn sai chỗ trong câu "will now receive" |
| 04 | Minor | Thuật ngữ: "security e-mail" lặp "security" trong tiêu đề; VI "thư bảo mật" lệch nhãn Desk "Email nhận thông báo bảo mật"; "của … của" |
| 05 | Suggestion | Câu chống lừa đảo ở chân thư chưa nói "không có link" (SEC EM-12.2) |
| 06 | Suggestion | Bản `previous`: "changed or removed" đổi thành một câu đúng cho cả hai trường hợp, gọn hơn |

---

### FB-R4-CPY-INT-01
- Mức độ: Major
- Vị trí: `email-templates.ts`, `copyFor` → `case 'email_changed'` → `self`, `previous`
- Vấn đề: ARC 4.2 ghi `via 'self'|'owner'`. Khi chủ đổi giúp, nhân viên nhận câu "If this was not you, contact the owner … and change your password". Nhưng việc này đúng là không phải họ làm, và việc đổi mật khẩu không liên quan. Đây lại là luồng chính của BUG-R3-032: nhiều tài khoản nhân viên chưa có email, nên lần đặt đầu thường do chủ làm, và thư đầu tiên họ nhận là bản `self` này.
- Vì sao quan trọng: Thư bảo mật đầu tiên đã làm người nhận lo, rồi họ gọi chủ hoặc đổi mật khẩu không cần thiết. Người nhận cũng quen bỏ qua câu "not you", nên khi có sự cố thật câu này mất tác dụng.
- Đề xuất sửa: dispatcher (BE-A) truyền thêm tham số `via` (`'self'|'owner'`, lấy từ `user_email_change.via`). Tham số này không phải dữ liệu cá nhân, đúng như SEC EM-12.1 đề xuất. ARC thêm `via` vào danh sách tham số ở 4.3. Mẫu thêm một câu "The change was made by the property owner." và đổi câu hành động (chữ ở mục "Chữ đề xuất"). Thiếu `via` thì dùng bản `self` như hiện nay.
- Trạng thái: Open

### FB-R4-CPY-INT-02
- Mức độ: Minor
- Vị trí: `previous`, câu thứ hai
- Vấn đề: Chân thư đã có "Please do not reply", nhưng chữ ở đó nhỏ (12 px, Stone Grey). Với địa chỉ cũ, khả năng người nhận bấm Trả lời gửi về hộp `EMAIL_FROM` chung là cao nhất (SEC EM-12.3).
- Vì sao quan trọng: Thư trả lời rơi vào hộp chung, không ai xử lý, người bị chiếm tài khoản mất thời gian.
- Đề xuất sửa: Gộp câu "không trả lời thư này" vào câu hành động của `previous` (xem mục "Chữ đề xuất"). Giữ nguyên chân thư.
- Trạng thái: Open

### FB-R4-CPY-INT-03
- Mức độ: Minor
- Vị trí: biến `at` dùng trong 3 bản `email_changed`
- Vấn đề: `occurredAt` đã có "(GMT+7)", nên câu ra "… OTTIMO Desk account (23/10/2026 14:05 (GMT+7))." Ở bản `self`, giờ đứng sau "will now receive", đọc như thể việc nhận thư bắt đầu từ giờ đó.
- Vì sao quan trọng: Hai lớp ngoặc trông như lỗi máy và kém chỉn chu theo brand.
- Đề xuất sửa: Riêng `email_changed`, đưa giờ thành một dòng riêng "Time: {occurredAt}" / "Thời điểm: {occurredAt}" và bỏ dòng khi thiếu `occurredAt`. Các mẫu cũ cũng lồng ngoặc như vậy. Đó là việc ngoài phạm vi đợt này, ghi lại để INT cân nhắc ở đợt sau.
- Trạng thái: Open

### FB-R4-CPY-INT-04
- Mức độ: Minor
- Vị trí: `subjectEn`, `subjectVi`, các câu VI
- Vấn đề:
  - "Security notice: the security e-mail was changed": chữ "security" lặp hai lần, lại có thể hiểu là "một thư bảo mật đã bị đổi".
  - VI "email nhận thư bảo mật" lệch nhãn Desk ARC đặt cho FE-A, "Email nhận thông báo bảo mật" (mục 7).
  - "của tài khoản OTTIMO Desk của bạn" lặp chữ "của".
  - Chữ mới viết "e-mail", nên dùng "email" cho thống nhất với VI và nhãn Desk.
- Vì sao quan trọng: Người nhận phải khớp được thư với ô họ thấy trong Desk. Tiêu đề hiện trên màn hình khóa, nên cần đọc hiểu ngay lần đầu.
- Đề xuất sửa: Tiêu đề EN "Security notice: notification email changed", VI "Thông báo bảo mật: email nhận thông báo đã thay đổi". Thân thư dùng "security notices" / "thông báo bảo mật". Câu VI viết "cho tài khoản OTTIMO Desk của bạn". Nhờ UXD dùng nhãn EN "Notification email" trong Desk (thẻ SEC EM-13) cho khớp.
- Trạng thái: Open

### FB-R4-CPY-INT-05
- Mức độ: Suggestion
- Vị trí: hằng `NO_LINK_EN` / `NO_LINK_VI` (chân thư, dùng chung mọi mẫu)
- Vấn đề: SEC EM-12.2 muốn cả 3 bản có câu chống lừa đảo. Chân thư hiện có "OTTIMO never asks for your password or codes by e-mail." nhưng chưa nói thư không bao giờ có link. Từ đợt này thư còn tới địa chỉ do người dùng tự gõ.
- Vì sao quan trọng: Nếu có thư giả có nút "Verify", người nhận nhận ra ngay vì thư thật không bao giờ có link.
- Đề xuất sửa: Sửa một chỗ ở hằng dùng chung, không thêm câu vào thân thư cho thân giữ ngắn: EN "OTTIMO security notices never contain links and never ask for your password or sign-in codes." VI "Thư bảo mật của OTTIMO không bao giờ có đường liên kết và không bao giờ hỏi mật khẩu hay mã đăng nhập." Câu vẫn đúng với `receiving_account_changed` vì mẫu đó cũng không có link. Nếu INT muốn giữ nguyên chân thư cho các mẫu cũ, phương án B là chỉ thêm câu này cuối thân 3 bản `email_changed`.
- Trạng thái: Open

### FB-R4-CPY-INT-06
- Mức độ: Suggestion
- Vị trí: `previous`, câu đầu
- Vấn đề: "was changed or removed … This address will no longer receive security notices." Hai câu nói cùng một ý, và "changed or removed" nghe như hệ thống không biết chuyện gì đã xảy ra.
- Đề xuất sửa: Viết một câu đúng cho cả đổi lẫn gỡ, từ góc nhìn địa chỉ đang đọc thư: "This address no longer receives security notices for your OTTIMO Desk account." Bản `owner` giữ "changed or removed", vì chủ cần biết có thể đã gỡ hẳn.
- Trạng thái: Open

---

## Chữ đề xuất (thay cho `case 'email_changed'`)

Quy tắc ghép mỗi bản: câu chính → (câu `via = owner` nếu có) → dòng thời gian (nếu có `occurredAt`) → câu hành động. Chân thư dùng chung (NO_LINK + FOOTER) như các mẫu khác.

**Tiêu đề chung (giữ một tiêu đề cho mọi audience, G-INT-3; không tên người, SEC EM-12.4)**

| | EN | VI |
|---|---|---|
| subject | Security notice: notification email changed | Thông báo bảo mật: email nhận thông báo đã thay đổi |

Tiêu đề đầy đủ sau tiền tố: `OTTIMO – Security notice: notification email changed / Thông báo bảo mật: email nhận thông báo đã thay đổi`, khoảng 104 ký tự. Tiêu đề hiện tại khoảng 113 ký tự.

**Dòng thời gian (chung 3 bản, bỏ khi thiếu `occurredAt`)**

| EN | VI |
|---|---|
| Time: {occurredAt} | Thời điểm: {occurredAt} |

**`self` (tới địa chỉ mới)**

| Phần | EN | VI |
|---|---|---|
| Câu chính | This address will now receive security notices for your OTTIMO Desk account. | Từ nay, địa chỉ này sẽ nhận thông báo bảo mật cho tài khoản OTTIMO Desk của bạn. |
| `via = owner` thêm | The change was made by the property owner. | Thay đổi do chủ cơ sở thực hiện. |
| Hành động, `via = self` / thiếu | (giữ `notYouEn`) If this was not you, contact the owner or the OTTIMO team today and change your password. | (giữ `notYouVi`) Nếu không phải bạn, hãy báo chủ cơ sở hoặc đội OTTIMO ngay trong hôm nay và đổi mật khẩu. |
| Hành động, `via = owner` | If you did not expect this, please contact the owner directly. | Nếu bạn chưa được báo trước, vui lòng liên hệ trực tiếp chủ cơ sở. |

**`previous` (tới địa chỉ cũ)**

| Phần | EN | VI |
|---|---|---|
| Câu chính | This address no longer receives security notices for your OTTIMO Desk account. | Địa chỉ này không còn nhận thông báo bảo mật cho tài khoản OTTIMO Desk của bạn. |
| `via = owner` thêm | The change was made by the property owner. | Thay đổi do chủ cơ sở thực hiện. |
| Hành động, `via = self` / thiếu | If this was not you, do not reply to this email. Contact the owner or the OTTIMO team right away and change your password. | Nếu không phải bạn, vui lòng không trả lời thư này. Hãy báo ngay chủ cơ sở hoặc đội OTTIMO và đổi mật khẩu. |
| Hành động, `via = owner` | If you did not expect this, do not reply to this email. Please contact the owner directly. | Nếu bạn chưa được báo trước, vui lòng không trả lời thư này mà liên hệ trực tiếp chủ cơ sở. |

**`owner` (tới mọi OWN)**

| Phần | EN | VI |
|---|---|---|
| Câu chính | The notification email of {staffName} was changed or removed. | Email nhận thông báo bảo mật của {staffName} vừa được đổi hoặc gỡ. |
| Hành động | (giữ `ownerEn`) If this was not expected, check with them today. | (giữ `ownerVi`) Nếu việc này không được báo trước, hãy kiểm tra với người đó trong hôm nay. |

Tùy chọn khi đã có `via` (INT tự cân nhắc): với `via = owner`, đổi câu chính thành "An owner changed or removed the notification email of {staffName}." / "Một chủ cơ sở vừa đổi hoặc gỡ email nhận thông báo bảo mật của {staffName}." Lợi ích: chủ khác biết ngay việc này do một chủ làm, không phải nhân viên tự làm.

**Bản trung tính (thiếu hoặc lạ `audience`)**

| EN | VI |
|---|---|
| The notification email of an OTTIMO Desk account was changed. | Email nhận thông báo bảo mật của một tài khoản OTTIMO Desk vừa thay đổi. |
| + dòng thời gian + `notYouEn` | + dòng thời gian + `notYouVi` |

**Chân thư dùng chung (thẻ 05, phương án A)**

| Hằng | EN | VI |
|---|---|---|
| `NO_LINK_*` | OTTIMO security notices never contain links and never ask for your password or sign-in codes. | Thư bảo mật của OTTIMO không bao giờ có đường liên kết và không bao giờ hỏi mật khẩu hay mã đăng nhập. |
| `FOOTER_*` | giữ nguyên | giữ nguyên |

## Test đề xuất (bổ sung khối `email_changed`)

- Ba bản và bản trung tính: không có `@`, `http`, `href`, `((`. Tiêu đề không chứa `staffName`.
- `self` + `via=owner`: có "property owner" / "chủ cơ sở thực hiện", **không** có "change your password" / "đổi mật khẩu".
- `previous` (cả hai `via`): có "do not reply" / "không trả lời thư này", không có "will now receive".
- Thiếu `occurredAt`: không có dòng "Time:" / "Thời điểm:".
- `via` lạ hoặc thiếu: ra như `via=self`.
- Chân thư mọi mẫu có "never contain links" / "không bao giờ có đường liên kết".

## Việc cho vai khác

- ARC: thêm `via` vào danh sách tham số của 4.3 trong hướng dẫn hợp đồng (không phải dữ liệu cá nhân). BE-A: dispatcher truyền `via` từ `user_email_change`.
- SEC: xác nhận câu chân thư mới (thẻ 05) và câu `previous` (thẻ 02) đủ ý EM-12.2–12.3.
- UXD/FE-A: nhãn Desk EN "Notification email", VI "Email nhận thông báo bảo mật", cho khớp với thư (EM-13).

## Điểm làm tốt nên giữ

- Bản `self` dùng "will now receive", nên đúng cho cả lần đặt đầu lẫn lần đổi. Bản `previous` không để lộ địa chỉ mới. Đây là cách ít dữ liệu nhất mà vẫn rõ.
- Bản trung tính chỉ nói điều đúng với mọi người nhận, đúng tinh thần "không hứa điều không có".
- Giữ nguyên `notYou*` / `owner*` của các mẫu cũ, nên giọng các thư "Security notice" thống nhất.

---

## Lượt 2 – xác nhận bản sửa trên `main` @ `da6d6f3d` (QC v1.0.3 ĐK4)

- Người review: CPY | Round 4 – đợt v1.0.3 – bước **Review lượt 2** | 03/11/2026
- Đối tượng: `product/integrations/notification/email-templates.ts` @ `da6d6f3d` (hàm `emailChangedCopy`, dòng 128–224; khung thư `renderStaffEmail`, dòng 250–324), `product/services/api/src/jobs/email-dispatch.ts` @ `da6d6f3d` dòng 259–304 (lấy và truyền `via`), phản hồi INT ở `rounds/round-04/outputs/INT/v1.0.3-email-templates.md` mục 3, khối test `email_changed` trong `email-templates.test.ts` (11 nhóm `it`, có vòng lặp nhiều tham số). Tệp mẫu thư trên `main` hiện tại (`92010000`) trùng `da6d6f3d`.
- Cách kiểm: đọc mã, rồi dựng thử 12 tổ hợp `audience` (`self` / `previous` / `owner` / lạ) × `via` (`self` / `owner` / thiếu) bằng `renderStaffEmail` (chạy `tsx` từ thư mục scratchpad, không sửa mã, không ghi tệp trong repo). Tham số mẫu: `occurredAt = 23/10/2026 14:05 (GMT+7)`, `staffName = Lan`. Kết quả dựng: 0 ký tự `@`, 0 `http`, 0 `((`, 0 emoji ở cả 12 bản.

### Kết luận lượt 2: ĐẠT

Thẻ Major 01 đã đóng. Các thẻ 02, 04, 06 đóng. Thẻ 03 và 05 đóng trong phạm vi v1.0.3: phần còn lại (giờ lồng ngoặc ở các mẫu cũ, phương án A chân thư chung) đã được ghi dời sang v1.0.4. Mẫu `email_changed` dùng được cho P0 của v1.0.3.

| Thẻ | Mức | Lượt 2 | Căn cứ trên mã @ `da6d6f3d` |
|---|---|---|---|
| FB-R4-CPY-INT-01 | Major | **Closed** | Dispatcher đọc `via` từ `user_email_change` và chỉ truyền khi giá trị là `self` hoặc `owner` (dòng 261–268, 303). Mẫu: `byOwner = p.via === 'owner'`; giá trị thiếu hoặc lạ ra bản `self` (đã dựng `via` thiếu: giống hệt `via = self`). Bản `self` + `via = owner`: "The change was made by the property owner." / "Thay đổi do chủ cơ sở thực hiện.", câu hành động "If you did not expect this, please contact the owner directly." / "Nếu bạn chưa được báo trước, vui lòng liên hệ trực tiếp chủ cơ sở." Không còn "change your password" / "đổi mật khẩu". Bản `previous` + `via = owner` cũng như vậy. Chữ trùng từng chữ với mục "Chữ đề xuất" của lượt 1. |
| FB-R4-CPY-INT-02 | Minor | **Closed** | `previous`, cả hai `via`: câu hành động có "do not reply to this email" / "vui lòng không trả lời thư này". Chân thư giữ nguyên. |
| FB-R4-CPY-INT-03 | Minor | **Closed** (phạm vi `email_changed`) | Giờ là dòng riêng "Time: …" / "Thời điểm: …", nằm sau câu "do chủ cơ sở thực hiện" và trước câu hành động. Dòng này bị bỏ khi thiếu `occurredAt` (có test). Không còn `((`. Các mẫu cũ (`mfa_*`, `receiving_account_changed`) vẫn lồng ngoặc: INT ghi Deferred v1.0.4, CPY đồng ý (ngoài phạm vi PR-1). |
| FB-R4-CPY-INT-04 | Minor | **Closed** | Tiêu đề "Security notice: notification email changed" / "Thông báo bảo mật: email nhận thông báo đã thay đổi". Tiêu đề đầy đủ sau tiền tố 106 ký tự, cùng một tiêu đề cho mọi bản, không có tên người. Thân thư viết "email" không gạch nối, có "cho tài khoản OTTIMO Desk của bạn", không còn "của … của". Nhãn Desk EN "Notification email" thuộc UXD/FE-A (EM-13), không chặn thẻ này. |
| FB-R4-CPY-INT-05 | Suggestion | **Closed – phương án B**; phương án A dời v1.0.4 | Câu "OTTIMO security notices never contain links and never ask for your password or sign-in codes." / "Thư bảo mật của OTTIMO không bao giờ có đường liên kết và không bao giờ hỏi mật khẩu hay mã đăng nhập." nằm cuối thân cả 3 bản và bản trung tính. Hằng `NO_LINK_*` không đổi, các mẫu cũ không có câu này (có test giữ). Lưu ý cho phương án A ở v1.0.4, xem "Ghi chú cho v1.0.4" bên dưới. |
| FB-R4-CPY-INT-06 | Suggestion | **Closed** | `previous` dùng một câu: "This address no longer receives security notices for your OTTIMO Desk account." / "Địa chỉ này không còn nhận thông báo bảo mật cho tài khoản OTTIMO Desk của bạn." Bản `owner` giữ "changed or removed" / "đổi hoặc gỡ". |

### Rà giọng và brand trên bản dựng

- EN trước, VI sau, trong cả bản text lẫn HTML (khối VI nền Cream, `lang="vi"`). Câu ngắn, mỗi câu một việc. Giọng điềm tĩnh: "please contact the owner directly", không có chữ "urgent" hay "immediately". Không emoji, không IN HOA để hét (chữ in hoa duy nhất là dòng "Boutique Stay · Da Lat" 11 px trong khung chung, đã duyệt từ trước).
- Bản `owner` + `via = owner`: "An owner changed or removed the notification email of Lan." / "Một chủ cơ sở vừa đổi hoặc gỡ email nhận thông báo bảo mật của Lan." Câu tùy chọn ở lượt 1 đã được nhận đúng chữ. Chủ trực tiếp đổi cũng nhận bản này kèm câu "If this was not expected…". Câu vẫn đúng với họ và không gây lo, nên giữ.
- Bản trung tính (thiếu hoặc lạ `audience`) chỉ nói điều đúng với mọi người nhận và luôn dùng `notYou*`, kể cả khi `via = owner`. Đây là cách an toàn, giữ.
- Không có địa chỉ (đầy đủ hay che), không link, không mã. Tên người chỉ có trong thân bản `owner`, đã escape.
- Câu pháp lý / bảo mật: không đổi ý so với bản SEC đã xem ở lượt 1 (EM-12.1–12.4).

### Ghi chú cho v1.0.4 (không chặn v1.0.3, không mở thẻ mới)

1. **Câu chống lừa đảo đang lặp ý (hệ quả của phương án B).** Thư `email_changed` hiện có hai câu gần giống nhau: câu cuối thân thư và câu `NO_LINK_*` ở chân thư ("OTTIMO never asks for your password or codes by e-mail."). Chân thư cũ còn viết "e-mail" có gạch nối. Khi làm phương án A ở v1.0.4, làm cả hai việc trong cùng một commit:
   - đổi `NO_LINK_EN` thành "OTTIMO security notices never contain links and never ask for your password or sign-in codes.", đổi `NO_LINK_VI` thành "Thư bảo mật của OTTIMO không bao giờ có đường liên kết và không bao giờ hỏi mật khẩu hay mã đăng nhập.";
   - bỏ `antiPhishEn` / `antiPhishVi` khỏi thân `email_changed`, và sửa test "older templates … do not get the email_changed anti-phishing line" thành "every template's footer has 'never contain links'".

   Mức: Suggestion, gộp vào việc tồn "CPY-INT-05 phương án A" đã có ở QC v1.0.3 mục việc dời. Câu `receiving_account_changed` không phải "security notice" theo tiêu đề. Nếu muốn chính xác tuyệt đối thì dùng "OTTIMO notices never contain links…" cho chân thư chung. CPY nghiêng về "security notices", vì cả 5 mẫu đều là thư cảnh báo an toàn tài khoản. INT chốt khi làm.
2. **Giờ lồng ngoặc ở 4 mẫu cũ** (phần còn lại của thẻ 03). Áp cùng mẫu "Time:" / "Thời điểm:" khi làm phương án A, để cả 5 thư có cùng bố cục.

### Câu cho Điều phối viên ghi decision-log (CPY không tự sửa decision-log)

`| 2026-11-03 | 4 | **CPY – Review lượt 2 mẫu thư email_changed** @ da6d6f3d (QC v1.0.3 ĐK4): **ĐẠT**. Đóng FB-R4-CPY-INT-01 (Major, biến thể via=owner bỏ "đổi mật khẩu", dispatcher truyền via, thiếu/lạ = self), 02, 03 (phạm vi email_changed), 04, 05 (phương án B), 06. Dời v1.0.4: phương án A chân thư chung NO_LINK_* (kèm bỏ câu chống lừa đảo trùng trong thân email_changed) và dòng "Time:" cho 4 mẫu cũ | CPY | Quyền review chéo (chữ hướng người nhận); rounds/round-04/reviews/CPY-on-v1.0.3-email-changed.md mục "Lượt 2" |`
