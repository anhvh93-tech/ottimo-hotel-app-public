# UXD review – v1.0.3 PR-1 phần Desk: email nhận thông báo bảo mật (BUG-R3-032)

- Người review: UXD | Round 4 – đợt v1.0.3 – bước **Review** | 03/11/2026
- Đối tượng: `git diff origin/arc/v1.0.3-contract origin/fe-a/v1.0.3-email` (@ `d0b2df3a`), gồm `SecurityEmailCard.tsx`, `UserEmailDialog.tsx`, `UsersPage.tsx`, `AppShell.tsx` (`SecurityEmailNudge`), `UserMenu.tsx`, `SecurityPage.tsx`, 34 khóa mới trong `gen_strings.py` → `strings-{vi,en}.json`. Đọc kèm báo cáo `rounds/round-04/outputs/FE/v1.0.3-email.md`. Không checkout, không sửa nhánh.
- Ảnh: 14 ảnh dữ liệu giả (VI + EN, 7 màn) ở scratchpad FE-A, 1280×860, không commit.
- Đối chiếu: brand guideline (`00-brief/context/brand/brand-guidelines.md`); DS v0.4.1 (`.mono` 13/1,4 cho Desk, `.stack>*+*` 12px); CPY `FB-R4-CPY-INT-04` (nhãn "Notification email"); SEC `FB-R4-SEC-ARC-EM-13` (câu mục đích, "thông báo" chứ không phải "xác nhận"); mẫu thư hiện có trong `email-templates.ts` (nhánh `int/v1.0.3-email-templates`).

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

Brand đạt. Không có mã màu tự đặt (chỉ `Alert`/`Button`/`Chip` của DS), chữ Lora ở tiêu đề trang và hộp, Be Vietnam Pro ở thân, JetBrains Mono cho địa chỉ, không emoji, không IN HOA ngoài nhãn nhóm của DS. SEC EM-13 đạt: có câu mục đích, không còn "thư xác nhận", toast không chứa địa chỉ.

Điều kiện để ĐẠT: sửa 3 thẻ Major (01–03). Cả ba chỉ đụng chuỗi trong `gen_strings.py` và thêm một khóa. Các thẻ Minor nên làm luôn trong PR-1 vì FE-A đang mở đúng các tệp đó. Không có thẻ cần báo chủ đầu tư.

| Thẻ | Mức | Tóm tắt |
|---|---|---|
| 01 | Major | `secmail.lead` hứa gửi thư khi đổi mật khẩu, trong khi hệ thống không có mẫu thư đó. "Tài khoản nhận tiền" cũng không phải thay đổi của tài khoản cá nhân |
| 02 | Major | Lần đầu OWN đặt email cho nhân viên (luồng chính BUG-R3-032), câu báo vẫn nói "đã gửi tới địa chỉ cũ". Cần biến thể `_first` |
| 03 | Major | Nhãn Desk "Security email" / "Email nhận thư bảo mật" lệch với tiêu đề thư "notification email" / "email nhận thông báo" (CPY 04, SEC EM-13) |
| 04 | Minor | Hai banner cam chồng nhau trên mọi màn. Gộp làm một khi cùng thiếu 2FA và email (trả lời câu 2) |
| 05 | Minor | Câu chữ: `field.EMAIL_SHARED_MAILBOX` nói "tới tay bạn" cả trong hộp OWN sửa cho người khác; EN `secmail.unchanged` "your address" cũng dùng cho người khác; ví dụ `name@domain.com` là tên miền thật; `field.NOT_ALLOWED_FOR_SELF` đọc ngược |
| 06 | Minor | Khối email: mất khoảng 12px giữa tiêu đề và câu dẫn. Icon cảnh báo khác khối 2FA. "Chưa có email." lặp với ô nhập |
| 07 | Minor | Hộp S2: địa chỉ mono đứng trơ, không nhãn, sát dòng dưới |
| 08 | Minor | Bảng Người dùng & vai: nút tắt và link cùng ở một ô làm hàng cao gần 100px; nút ghost lệch trái; EN cột đăng nhập gần nhất xuống 2 dòng (trả lời câu 4) |
| 09 | Minor | Đổi tên "Bảo mật tài khoản" chưa đi hết: link ở `Enroll2faPage.tsx` và sổ tay còn "Xác thực 2 bước" (trả lời câu 1) |
| 10 | Suggestion | Chip trạng thái ở đầu khối email như khối 2FA. Đánh dấu "Chưa có" cho hàng OWN/MGR trong bảng |
| 11 | Suggestion | Cỡ mono: giữ `.mono` 13px ở khối, hộp và bảng, không đặt cỡ riêng (trả lời câu 5) |
| 12 | Suggestion | Thư dùng "chủ cơ sở" / "property owner", Desk dùng vai "Chủ đầu tư" / "Owner" (cho CPY/INT) |

## Trả lời 5 câu FE-A hỏi

1. **Đổi tên menu và trang thành "Bảo mật tài khoản" / "Account security": GIỮ.** Trang nay có hai khối, nên giữ tên cũ là sai. Khối 2FA giữ tiêu đề "Xác thực 2 bước". Còn hai chỗ phải đổi theo (thẻ 09).
2. **Vị trí: giữ** khối email dưới khối 2FA (2FA quan trọng hơn và là việc bắt buộc). **Banner: GỘP** khi cùng lúc thiếu 2FA (`mfaRequiredButMissing`) và thiếu email. Khi chỉ thiếu một thứ, giữ banner riêng như hiện tại. Chữ và hành vi ở thẻ 04.
3. **Chữ:** sửa theo bảng ở mục "Chữ thay thế theo khóa". Các khóa không có trong bảng thì giữ nguyên. Ví dụ trong `secmail.invalid` đổi thành `ten@example.com` / `name@example.com`, vì `example.com` là tên miền dành riêng cho ví dụ (RFC 2606). `domain.com` là một nhà đăng ký tên miền có thật, còn `tenmien.vn` có thể đã có chủ.
4. **"Sửa email" ở trong ô email: GIỮ trong ô.** Cột thao tác đã có 3 nút và xuống dòng. Nhưng hàng của chính mình và hàng OWN khác thì bỏ nút tắt, chỉ để một dòng giải thích. Căn trái nút với địa chỉ. Chi tiết ở thẻ 08.
5. **Cỡ JetBrains Mono: 13px**, dùng `.mono` sẵn có của DS (Desk 13/1,4) ở cả khối, hộp S2 và bảng. Màu Ink, không muted. Trong ô nhập, `.input.mono` giữ cỡ chữ của ô nhập, chỉ đổi họ chữ (như hiện tại). Không thêm `fontSize` inline.

---

### FB-R4-UXD-FE-EM-01
- Mức độ: Major
- Vị trí: `secmail.lead` (VI + EN), khối email trên `/security`
- Vấn đề: Câu dẫn nói OTTIMO gửi thư "khi tài khoản của bạn có thay đổi quan trọng, như **mật khẩu**, xác thực 2 bước hay **tài khoản nhận tiền**". Trong `email-templates.ts` chỉ có các mẫu `mfa_recovery_code_used`, `mfa_reset*`, `receiving_account_changed` (gửi chủ, là việc của cơ sở) và `email_changed`. **Không có thư khi đổi mật khẩu.** Với nhân viên lễ tân, "tài khoản nhận tiền" cũng không phải thay đổi trên tài khoản của họ.
- Vì sao quan trọng: Người dùng đổi mật khẩu rồi chờ thư không bao giờ tới. Họ sẽ nghĩ hệ thống hỏng, hoặc tệ hơn là nghĩ đã có người chặn thư. Nguyên tắc của chúng ta là không hứa điều không có (giống lý do SEC bỏ chữ "xác nhận").
- Đề xuất sửa: Chỉ nêu ví dụ có thật, viết chung cho mọi vai (chữ ở bảng dưới):
  - VI: "OTTIMO gửi thông báo bảo mật tới địa chỉ này, ví dụ khi xác thực 2 bước của bạn được đặt lại hoặc email này thay đổi. Dùng email riêng của bạn."
  - EN: "OTTIMO sends security notices to this address, for example when your 2-step verification is reset or this email changes. Use your own address."
  - Khi sau này có thư đổi mật khẩu thì mới thêm "mật khẩu" vào câu. Ghi việc này vào ghi chú khóa trong `gen_strings.py`.
- Trạng thái: Open

### FB-R4-UXD-FE-EM-02
- Mức độ: Major
- Vị trí: `users.email_saved`, `users.email_body` (hộp `UserEmailDialog` + toast `UsersPage`)
- Vấn đề: Khối của chính mình đã tách `secmail.saved` / `secmail.saved_first`, còn phía OWN thì chỉ có một câu: "Thư thông báo đã gửi tới địa chỉ mới, **địa chỉ cũ** và chủ đầu tư". Trong ảnh 06, 6 trên 8 người chưa có email. Vì vậy lần đầu OWN đặt email cho nhân viên là luồng chính của BUG-R3-032, và khi đó **không có địa chỉ cũ** (`user.email == null`). `users.email_body` trong hộp cũng nói "địa chỉ cũ" mà không có "nếu có". Ngoài ra thư `owner` gửi tới **mọi** OWN của cơ sở (ARC G-E3), không phải một "chủ đầu tư".
- Vì sao quan trọng: Câu báo sai sự thật ngay ở thao tác dùng nhiều nhất. Chủ đầu tư sẽ hỏi "địa chỉ cũ nào?".
- Đề xuất sửa: Thêm khóa `users.email_saved_first` và chọn khóa theo `user.email` trước khi lưu (rỗng → `_first`). Thêm "nếu có" vào `users.email_body`. Đổi "chủ đầu tư" thành "các chủ đầu tư" ở 3 khóa (chữ ở bảng dưới). Thêm test: lần đầu → `_first`, có địa chỉ cũ → `email_saved`.
- Trạng thái: Open

### FB-R4-UXD-FE-EM-03
- Mức độ: Major
- Vị trí: `secmail.title`, `secmail.s2_save_title`, `secmail.s2_remove_title`, `secmail.missing`, `secmail.nudge`, `users.email_title`; cả từ "thư bảo mật" trong các câu VI
- Vấn đề: Tiêu đề thư (CPY `FB-R4-CPY-INT-04`) là "Security notice: **notification email** changed" / "Thông báo bảo mật: **email nhận thông báo** đã thay đổi". Thân thư dùng "security notices" / "thông báo bảo mật". Desk thì đang ghi "Security email" và "Email nhận thư bảo mật", và trộn "thư bảo mật" với "thư thông báo".
- Vì sao quan trọng: Người nhận thư phải tìm ra đúng ô trong Desk đã gây ra thư (SEC EM-13). Một khái niệm mà có ba tên thì người đọc dễ nghi thư giả. Đây chính là chỗ kẻ lừa đảo lợi dụng.
- Đề xuất sửa: Chốt một bộ thuật ngữ dùng ở mọi bề mặt (Desk, thư, sổ tay):
  - Tên ô: EN **"Notification email"**, VI **"Email nhận thông báo bảo mật"**.
  - Nội dung gửi đi: EN **"security notice(s)"**, VI **"thông báo bảo mật"** (bỏ "thư bảo mật"). Chỉ dùng "thư" khi nói về việc kiểm tra hộp thư ("chưa thấy thư").
  - Không dùng "xác nhận" (SEC EM-13). Test chuỗi đã có, nên thêm cả cụm "thư bảo mật" vào danh sách từ cấm của 34 khóa.
  - UXD ghi thuật ngữ này vào DS mục microcopy sau khi PR-1 gộp.
- Trạng thái: Open

### FB-R4-UXD-FE-EM-04
- Mức độ: Minor
- Vị trí: `AppShell.tsx` `MfaNudge` + `SecurityEmailNudge`; ảnh `vi-01-banner`, `en-01-banner`
- Vấn đề: OWN/MGR chưa bật 2FA và chưa có email thấy hai banner cam giống hệt nhau (cùng icon khiên, cùng tông warn), cao tổng khoảng 180px, trên **mọi** màn kể cả Sơ đồ phòng. Mỗi banner có một nút "Để sau" riêng.
- Vì sao quan trọng: Desk cần mật độ cao. Hai cảnh báo cùng màu thì giá trị của cảnh báo giảm, người dùng quen bấm "Để sau" cho cả hai. Hai việc này lại dẫn về cùng một trang.
- Đề xuất sửa: Gộp khi `mfaRequiredButMissing === true` **và** `securityEmailMissing === true` (cả hai đều chưa "Để sau"):
  - Một `Alert tone="warn" icon="shield"`. Chữ `secnudge.both`:
    - VI: "Tài khoản của bạn chưa bật xác thực 2 bước và chưa có email nhận thông báo bảo mật. Từ khi có dữ liệu khách thật, xác thực 2 bước là bắt buộc."
    - EN: "Your account has no 2-step verification and no notification email yet. Once real guest data is in the app, 2-step verification becomes mandatory."
  - Nút chính `secnudge.open` "Mở Bảo mật tài khoản" / "Open Account security", dẫn tới `/security` (không neo, khối 2FA ở trên cùng). Nút ghost "Để sau" (`mfa.nudge_later`) ghi **cả hai** cờ sessionStorage.
  - Các trường hợp khác giữ như hiện tại: chỉ thiếu một thứ, hoặc `recoveryCodesLow` + thiếu email. Trường hợp sau ít gặp và hai lời nhắc khác bản chất.
  - Nếu không kịp trong PR-1 thì chấp nhận hai banner cho v1.0.3 và ghi việc này vào backlog. Thẻ không chặn.
- Trạng thái: Open

### FB-R4-UXD-FE-EM-05
- Mức độ: Minor
- Vị trí: `field.EMAIL_SHARED_MAILBOX`, `secmail.unchanged` (EN), `secmail.invalid`, `field.NOT_ALLOWED_FOR_SELF`, `users.email_none` (EN)
- Vấn đề:
  - `field.EMAIL_SHARED_MAILBOX` cũng hiện trong hộp OWN sửa email cho Quân (ảnh 07, `UserEmailDialog`). Lúc đó câu "để thư bảo mật chỉ tới tay bạn" nói sai người.
  - EN `secmail.unchanged` "That's already **your** address" cũng là toast của `UsersPage` khi OWN lưu lại đúng địa chỉ của người khác.
  - `name@domain.com` là tên miền thật (một nhà đăng ký tên miền).
  - VI `field.NOT_ALLOWED_FOR_SELF` "Thao tác này không làm cho chính tài khoản…" đọc như thao tác "không làm".
  - EN `users.email_none` "None" đứng một mình trong ô nghe cụt.
- Vì sao quan trọng: Đây là các câu lỗi và câu báo người dùng đọc lúc đang bối rối. Câu phải đúng người, đúng việc, và không quảng cáo cho bên thứ ba.
- Đề xuất sửa: Chữ ở bảng dưới. Các câu đã viết trung tính để dùng được ở cả hai nơi (khối của mình và hộp của OWN).
- Trạng thái: Open

### FB-R4-UXD-FE-EM-06
- Mức độ: Minor
- Vị trí: `SecurityEmailCard.tsx` dòng 127–166; ảnh `vi-02`, `vi-04`, `vi-05`
- Vấn đề:
  - (a) `<p className="muted" style={{ margin: 0 }}>` ghi đè `.stack>*+*{margin-top:12px}`, nên câu dẫn dính sát tiêu đề. Khối 2FA ngay trên có khoảng 12px vì h3 nằm trong `.row`.
  - (b) Cảnh báo `secmail.missing` dùng icon khiên. Cảnh báo warn trong khối 2FA ngay trên dùng icon tam giác mặc định. Hai cảnh báo cùng tông trong cùng trang lại khác icon.
  - (c) Khi chưa có email, khối hiện cả cảnh báo "cần có email", dòng "Chưa có email." và ô nhập trống. Dòng giữa thừa.
- Vì sao quan trọng: Nhất quán DS. Hai khối đặt cạnh nhau nên lệch nhỏ cũng thấy rõ.
- Đề xuất sửa:
  - (a) Bỏ `margin: 0` inline ở `<p>`, hoặc bọc h3 trong `<div className="row">` như khối 2FA. Bỏ được cả `margin: 0` của h3 nếu `.stack` đã lo.
  - (b) Bỏ `icon="shield"` ở Alert trong khối, dùng icon mặc định của tone warn. Banner ở shell vẫn giữ khiên như `MfaNudge`.
  - (c) Chỉ hiện `secmail.none` khi **không** có cảnh báo `missing` (tức là với FD/HK… chưa có email). Hoặc bỏ hẳn, vì ô nhập trống đã đủ nói.
- Trạng thái: Open

### FB-R4-UXD-FE-EM-07
- Mức độ: Minor
- Vị trí: `SecurityEmailCard.tsx` dòng 218–226 (hộp S2 lưu); ảnh `vi-03`, `en-03`
- Vấn đề: Thứ tự trong hộp là câu báo → địa chỉ mono (không nhãn, `margin 6px 0 0`) → "Thao tác này cần mật khẩu…". Địa chỉ dính sát dòng dưới, đọc như một phần của câu xác thực. Người dùng cần thấy rõ "mình sắp lưu địa chỉ nào" trước khi gõ mật khẩu.
- Vì sao quan trọng: Đây là bước cuối để bắt lỗi gõ sai địa chỉ. Gửi nhầm thì thư bảo mật đi tới người lạ.
- Đề xuất sửa: Địa chỉ đứng đầu, có nhãn. Dùng lại mẫu của khối (`label-h` + `.mono`): nhãn `secmail.new_label` "Địa chỉ mới" / "New address", rồi đến địa chỉ, rồi `secmail.s2_save_body`, rồi dòng xác thực. Các khối cách nhau 12px (`.stack`). Hộp xóa không cần nhãn này. Hộp của OWN (`UserEmailDialog` bước S2) làm giống vậy.
- Trạng thái: Open

### FB-R4-UXD-FE-EM-08
- Mức độ: Minor
- Vị trí: `UsersPage.tsx` ô email; ảnh `vi-06`, `en-06`
- Vấn đề:
  - (a) Hàng của chính mình có địa chỉ, nút "Sửa email" tắt (nền xám viền gạch) và một link 2 dòng gạch chân. Hàng cao khoảng 108px, gần gấp đôi hàng khác. Nút tắt đứng cạnh một link làm đúng việc đó là thừa.
  - (b) Nút ghost `sm` có padding ngang, nên chữ "Sửa email" thụt vào khoảng 10px so với địa chỉ hoặc "Chưa có" ở trên.
  - (c) EN: cột "Last sign-in" bị ép xuống 2 dòng ("16/10/2026 / 07:55") ở 1280px, vì thêm cột email.
- Vì sao quan trọng: Bảng là màn OWN dùng để rà nhanh. Hàng cao không đều và ngày giờ gãy dòng làm khó dò theo cột.
- Đề xuất sửa:
  - Giữ "Sửa email" trong ô (trả lời câu 4). Cột thao tác đã chật, và đặt ở đây thì nút gắn với dữ liệu nó sửa.
  - (a) Hàng **chính mình**: bỏ nút, chỉ để link `.li-s` "Đổi ở Bảo mật tài khoản" (khóa `users.email_self`, chữ ở bảng dưới). Hàng **OWN khác**: bỏ nút, để dòng `.li-s` muted `users.email_other_owner`. Không còn nút tắt thì cũng không cần `aria-describedby`. Link là phần tử thật và đọc được. Test hiện tại tìm nút tắt cần đổi theo: kiểm hàng đó **không** có nút "Sửa email", và có link hoặc câu.
  - (b) Cho nút ghost trong ô bảng `padding-inline: 0` (biến thể `link`/`inline` nếu DS đã có, nếu chưa thì một class `.btn-inline` trong `app.css`). Vùng chạm vẫn ≥ 32px chiều cao như nút `sm` của Desk.
  - (c) Cột ngày giờ `white-space: nowrap`. Ô email cho xuống dòng ở bất kỳ ký tự nào (`overflow-wrap: anywhere`), không cắt bằng dấu "…", vì OWN cần đọc đủ địa chỉ.
- Trạng thái: Open

### FB-R4-UXD-FE-EM-09
- Mức độ: Minor
- Vị trí: `Enroll2faPage.tsx` dòng 170; `product/docs/manual/user-manual-v1.0.md` (3 chỗ), `guides/01-chu-dau-tu-quan-ly.md` (3), `guides/02-le-tan.md` (1), `screenshot-list.md`, `guides/screenshot-additions.md`
- Vấn đề: Menu và tiêu đề trang đã thành "Bảo mật tài khoản". Nhưng link "Xác thực 2 bước" ở trang bật 2FA vẫn dẫn về `/security`, và sổ tay vẫn chỉ đường "menu người dùng → Xác thực 2 bước".
- Vì sao quan trọng: Tên chỉ đường không khớp tên trên màn, nên người làm theo sổ tay không tìm thấy mục.
- Đề xuất sửa: FE-A đổi link ở `Enroll2faPage.tsx` sang `t('shell.account_security')`. Khối 2FA trong `SecurityPage.tsx` giữ `shell.security` làm tiêu đề khối. Sổ tay (người giữ manual, ORC phân) ghi "menu người dùng → Bảo mật tài khoản → khối Xác thực 2 bước" và thêm một đoạn về khối email. Ảnh sổ tay chụp lại sau khi QA kiểm che. Phần sổ tay có thể làm ở bước sau PR-1, nhưng phải xong trước khi phát hành v1.0.3.
- Trạng thái: **Closed** (03/11/2026). Phần FE đóng ở lượt 2. Phần sổ tay đóng ở lượt 3 bên dưới: Markdown sổ tay 1.8 + bộ hướng dẫn 1.6 (BA) đúng chỉ đường, HTML đã dựng lại, 6 ảnh đã gắn, kiểm 1440/390 đạt

### FB-R4-UXD-FE-EM-10
- Mức độ: Suggestion
- Vị trí: đầu khối email; ô email trong bảng
- Đề xuất:
  - (a) Đặt một `Chip` ở góc phải tiêu đề khối email, giống chip "Chưa bật" của khối 2FA: có email → tone `ok` icon `check`, "Đã có" / "Set". Chưa có → tone `neutral` icon `shield`, "Chưa có" / "Not set". Người dùng nhìn hai khối là biết trạng thái ngay.
  - (b) Trong bảng, hàng OWN/MGR chưa có email hiện "Chưa có" bằng `Chip tone="warn"` thay cho chữ muted, vì server cũng chỉ nhắc hai vai này. Các vai khác giữ chữ muted.
- Trạng thái: Open

### FB-R4-UXD-FE-EM-11
- Mức độ: Suggestion
- Vị trí: `.mono` ở khối, hộp S2, bảng
- Đề xuất: Hiện đúng 13px theo DS. Giữ nguyên, không đặt cỡ riêng cho bảng. Địa chỉ dùng màu Ink, `qa.owner` dưới tên dùng Stone. Như vậy hai chuỗi mono trong cùng hàng vẫn phân biệt được thứ bậc. Nếu sau này có chỗ cần địa chỉ nổi hơn (ví dụ hộp S2), dùng `font-weight: 500` (JetBrains Mono 500 đã tự host), không tăng cỡ.
- Trạng thái: Open

### FB-R4-UXD-FE-EM-12
- Mức độ: Suggestion (cho CPY/INT, không phải FE-A)
- Vị trí: chữ đề xuất của CPY cho `email_changed` ("chủ cơ sở" / "property owner")
- Đề xuất: Desk gọi vai này là "Chủ đầu tư" / "Owner" (`role.owner`), và các câu Desk ở PR này cũng vậy. Nhân viên nhận thư "liên hệ chủ cơ sở" sẽ phải tự hiểu đó là ai. EN "property owner" thì ổn. VI nên cân nhắc "chủ đầu tư" cho khớp Desk. Nếu CPY thấy "chủ cơ sở" tự nhiên hơn với khách bên ngoài thì giữ, nhưng thư này chỉ gửi nhân viên. CPY quyết. Cùng kiểu lệch: các thư `mfa_reset*` viết "two-step sign-in" / "đăng nhập 2 bước", Desk viết "2-step verification" / "xác thực 2 bước". Câu `secmail.lead` mới (thẻ 01) dùng chữ của Desk. Đề nghị CPY/INT đổi chữ trong thư theo Desk ở đợt sau. Không chặn PR-1.
- Trạng thái: Open

---

## Chữ thay thế theo khóa

Khóa nào không có trong bảng thì **giữ nguyên** (`secmail.current`, `secmail.field`, `secmail.add`, `secmail.change`, `secmail.remove`, `secmail.save`, `secmail.removed`, `users.col_email`, `users.edit_email`, `users.email_other_owner`, `shell.account_security`, `secmail.field_help`, `secmail.none` – riêng `secmail.none` xem thẻ 06c). Sửa trong `gen_strings.py` rồi chạy generator, không sửa tay JSON.

| Khóa | VI | EN | Thẻ |
|---|---|---|---|
| `secmail.title` | Email nhận thông báo bảo mật | Notification email | 03 |
| `secmail.lead` | OTTIMO gửi thông báo bảo mật tới địa chỉ này, ví dụ khi xác thực 2 bước của bạn được đặt lại hoặc email này thay đổi. Dùng email riêng của bạn. | OTTIMO sends security notices to this address, for example when your 2-step verification is reset or this email changes. Use your own address. | 01 |
| `secmail.missing` | Tài khoản chủ đầu tư và quản lý cần có email nhận thông báo bảo mật. Nhập email riêng của bạn bên dưới. | Owner and manager accounts need a notification email. Enter your own address below. | 03 |
| `secmail.purpose` | Chỉ dùng để gửi thông báo bảo mật cho tài khoản này. | Used only to send security notices for this account. (giữ) | 03, SEC EM-13 |
| `secmail.s2_save_title` | Lưu email nhận thông báo bảo mật | Save notification email | 03 |
| `secmail.s2_save_body` | OTTIMO sẽ gửi thông báo tới địa chỉ mới và tới địa chỉ cũ, nếu có. | A notice will go to the new address, and to the old one if there is one. | 03 |
| `secmail.new_label` *(mới)* | Địa chỉ mới | New address | 07 |
| `secmail.s2_remove_title` | Xóa email nhận thông báo bảo mật | Remove notification email | 03 |
| `secmail.s2_remove_body` | Sau khi xóa, bạn không nhận thông báo bảo mật qua email nữa. OTTIMO sẽ gửi một thông báo tới địa chỉ cũ. | After this, you won't get security notices by email. A notice will go to the old address. | 03 |
| `secmail.saved` | Đã lưu. Thông báo đã gửi tới địa chỉ mới và địa chỉ cũ. Sau 15 phút chưa thấy thư, hãy xem mục Spam hoặc kiểm tra lại địa chỉ. | Saved. A notice has been sent to the new address and the old one. If nothing arrives within 15 minutes, check your spam folder or the address. | 03 |
| `secmail.saved_first` | Đã lưu. Thông báo đã gửi tới địa chỉ này. Sau 15 phút chưa thấy thư, hãy xem mục Spam hoặc kiểm tra lại địa chỉ. | Saved. A notice has been sent to this address. If nothing arrives within 15 minutes, check your spam folder or the address. | 03 |
| `secmail.removed` | Đã xóa email. Thông báo đã gửi tới địa chỉ cũ. | Email removed. A notice has been sent to the old address. (giữ) | 03 |
| `secmail.unchanged` | Địa chỉ này đã được lưu. Không có gì thay đổi. | That address is already saved. Nothing has changed. | 05 |
| `secmail.invalid` | Email chưa đúng dạng, ví dụ ten@example.com. | Check the email format, e.g. name@example.com. | 05 |
| `secmail.nudge` | Tài khoản của bạn chưa có email nhận thông báo bảo mật. Thêm email để được báo khi có thay đổi quan trọng. | Your account has no notification email yet. Add one to receive security notices. | 03 |
| `secnudge.both` *(mới)* | Tài khoản của bạn chưa bật xác thực 2 bước và chưa có email nhận thông báo bảo mật. Từ khi có dữ liệu khách thật, xác thực 2 bước là bắt buộc. | Your account has no 2-step verification and no notification email yet. Once real guest data is in the app, 2-step verification becomes mandatory. | 04 |
| `secnudge.open` *(mới)* | Mở Bảo mật tài khoản | Open Account security | 04 |
| `field.EMAIL_SHARED_MAILBOX` | Đây là hộp thư chung của cơ sở. Thông báo bảo mật cần tới một email riêng. | This is the property's shared mailbox. Security notices need a personal address. | 05 |
| `field.NOT_ALLOWED_FOR_SELF` | Bạn không thể làm việc này cho chính tài khoản của mình tại đây. | You can't do this for your own account here. | 05 |
| `users.email_none` | Chưa có (giữ) | Not set | 05 |
| `users.email_title` | Email nhận thông báo bảo mật – {name} | Notification email – {name} | 03 |
| `users.email_body` | OTTIMO sẽ gửi thông báo tới địa chỉ mới, địa chỉ cũ (nếu có) và các chủ đầu tư. | A notice will go to the new address, the old one if there is one, and all owners. | 02 |
| `users.email_saved` | Đã lưu email của {name}. Thông báo đã gửi tới địa chỉ mới, địa chỉ cũ và các chủ đầu tư. | {name}'s notification email is saved. A notice has been sent to the new address, the old one and all owners. | 02 |
| `users.email_saved_first` *(mới)* | Đã lưu email của {name}. Thông báo đã gửi tới địa chỉ này và các chủ đầu tư. | {name}'s notification email is saved. A notice has been sent to that address and all owners. | 02 |
| `users.email_removed` | Đã xóa email của {name}. Thông báo đã gửi tới địa chỉ cũ và các chủ đầu tư. | {name}'s notification email is removed. A notice has been sent to the old address and all owners. | 02 |
| `users.email_self` | Đổi email của bạn ở Bảo mật tài khoản. | Change your own email under Account security. (giữ) | 08 |

Ghi chú:
- Sau sửa, 34 khóa cũ + 4 khóa mới (`secmail.new_label`, `secnudge.both`, `secnudge.open`, `users.email_saved_first`; `secnudge.*` chỉ khi làm thẻ 04) không còn cụm "thư bảo mật", "thư xác nhận", "confirmation", "security email". Thêm các cụm này vào test chuỗi hiện có.
- `secmail.saved*` vẫn nói "đã gửi" dù thư đi qua outbox (FE G-FE-E3). UXD chấp nhận: thư thường tới sau vài giây, và câu 15 phút là lối thoát.
- `secmail.purpose` dùng "cho tài khoản này" ở cả khối của mình và hộp của OWN. Hộp OWN có tên người ở tiêu đề nên vẫn rõ, không cần biến thể `{name}` (SEC EM-13 gợi ý "…this person's account"; UXD thấy không cần và chịu trách nhiệm chữ).

## Brand OTTIMO – kết quả rà

| Mục | Kết quả |
|---|---|
| Màu | Đạt. Diff không có mã hex, `rgb` hay `color` inline. Banner/cảnh báo dùng tone warn, info, ok, bad của DS (ngoại lệ chức năng DS 2.4) |
| Chữ | Đạt. Tiêu đề trang và hộp dùng Lora, thân và nút dùng Be Vietnam Pro, địa chỉ dùng JetBrains Mono 13px. Mono chỉ cho chuỗi địa chỉ, không cho câu (DS mục 3) |
| Giọng | Đạt sau khi sửa 01–03, 05. Câu ngắn, điềm tĩnh, không đổ lỗi ("chưa đúng dạng", không phải "bạn nhập sai") |
| Emoji / IN HOA | Không có emoji. IN HOA chỉ ở nhãn `label-h` và tiêu đề cột bảng của DS |
| Dữ liệu cá nhân | Ảnh chỉ dùng `*@example.test`. Toast và URL không có địa chỉ (neo `#security-email` không mang dữ liệu) |

Không có lệch giữa guideline và DS trong phạm vi PR này.

## Điểm làm tốt nên giữ

- Kiểm dạng và kiểm trùng ở client **trước** khi mở S2, nên không tốn mã TOTP. Gặp hộp thư chung thì đóng hộp và báo lỗi ngay dưới ô, giữ nguyên chữ đã nhập. Đây là chi tiết UX đúng chỗ.
- Tách `saved` / `saved_first` / `removed` ở khối của mình, và câu 15 phút cho biết phải làm gì tiếp mà không hứa quá. Phía OWN chỉ cần làm theo cùng cách (thẻ 02).
- Banner dẫn bằng neo và focus vào ô email, không đưa dữ liệu vào URL. "Để sau" chỉ ẩn trong phiên, giống cờ 2FA.

---

## Lượt 2 – 03/11/2026

- Người review: UXD | Round 4 – đợt v1.0.3 – bước **Review lượt 2** (sau "Phản hồi & sửa" của FE-A).
- Đối tượng: `git diff d0b2df3a 42876026` (16 tệp). Trả lời từng thẻ ở `rounds/round-04/responses/FE-on-UXD-v1.0.3-email.md` @ `42876026`. 14 ảnh dữ liệu giả mới (VI + EN, 7 màn, 1280×860, scratchpad FE-A, không commit). Không checkout, không sửa nhánh.
- Ba trạng thái không có ảnh nên soát qua mã: hộp S2 khi tài khoản đã bật 2FA (có ô mã), lỗi `STRONG_REAUTH_REQUIRED` trong hộp, bảng Người dùng & vai khi mất mạng.

### Kết luận lượt 2: ĐẠT

Ba thẻ Major (01–03) đã đóng. Brand vẫn đạt. Còn 2 thẻ Minor (07 mở lại một phần, 13 mới) và 2 thẻ Suggestion (14, 15). Mỗi thẻ chỉ cần sửa vài dòng. Nên làm luôn trong PR-1. Nếu không kịp thì ghi backlog v1.0.4, không chặn gộp. Không có việc cần báo chủ đầu tư.

### Trạng thái từng thẻ

| Thẻ | Mức | Lượt 2 | Bằng chứng |
|---|---|---|---|
| 01 | Major | **Đóng** | `secmail.lead` đúng bảng, chỉ nêu thông báo có thật. Ghi chú khóa nhắc thêm "mật khẩu" khi có thư đổi mật khẩu. Ảnh vi-02, en-02 |
| 02 | Major | **Đóng** | `UserEmailDialog` chọn `first` / `saved` / `removed` theo `user.email` trước khi lưu và `data.email` server trả về. `UsersPage` dùng `users.email_saved_first`. `users.email_body` có "(nếu có)" và "các chủ đầu tư". Có test hai ca. Ảnh vi-07 |
| 03 | Major | **Đóng** | Tiêu đề khối, hai hộp S2, hộp OWN, `missing`, `nudge` đúng bộ thuật ngữ. Test cấm cụm từ và test tiêu đề khối khớp tiêu đề thư (CPY INT-04). Ảnh vi-03, en-03, en-04 |
| 04 | Minor | **Đóng** | `SecurityNudges` hiện một banner khi thiếu cả hai, "Để sau" ghi cả hai cờ. Các ca khác giữ banner riêng. Banner gộp cao khoảng 80px, trước đây hai banner khoảng 180px. Ảnh vi-01, en-01 |
| 05 | Minor | **Đóng** | 5 khóa đúng bảng. Câu hộp thư chung trung tính, dùng được cả trong hộp OWN. Ảnh vi-05 |
| 06 | Minor | **Đóng** | (a) Tiêu đề nằm trong `.row`, câu dẫn cách 12px. (b) Alert trong khối dùng icon tam giác như khối 2FA. (c) Không còn dòng "Chưa có email." khi đã có cảnh báo. Ảnh vi-02 |
| 07 | Minor | **Mở lại (một phần)** | Nhãn "Địa chỉ mới" và địa chỉ đứng đầu hộp: đạt, dùng chung `EmailConfirmBody` cho cả hai hộp. Còn lỗi: dòng "Thao tác này cần mật khẩu…" vẫn dính sát câu báo (ảnh vi-03, en-03). Lỗi nằm ở hộp dùng chung. Xem thẻ 07 bên dưới |
| 08 | Minor | **Đóng** (kèm thẻ 13) | (a) Hàng của mình chỉ còn link, hàng OWN khác chỉ còn câu. Hàng không còn cao gấp đôi. (b) "Sửa email" thẳng hàng với địa chỉ và chip. (c) en-06: "Last sign-in" một dòng, địa chỉ không bị cắt. Trạng thái tắt của `.btn-inline` còn lỗi, tách sang thẻ 13 |
| 09 | Minor | **Đóng phần FE**. Phần sổ tay vẫn mở | `Enroll2faPage` dùng `shell.account_security`. Sổ tay (7 tệp ở thẻ 09) chưa đổi. ORC giao người giữ sổ tay, phải xong trước khi phát hành v1.0.3 |
| 10 | Suggestion | **Đóng** | Chip "Đã có" / "Chưa có" ở góc phải, cùng kiểu chip "Chưa bật" của khối 2FA. Hàng OWN/MGR chưa có email dùng chip warn, vai khác giữ chữ muted. Ảnh vi-02, vi-04, vi-06, en-06 |
| 11 | Suggestion | **Đóng** | `.mono` 13px ở khối, hộp, bảng, địa chỉ màu Ink. Không còn `fontSize` inline |
| 12 | Suggestion | **Mở**, chuyển CPY/INT | Không thuộc FE-A. Câu Desk mới đã dùng "chủ đầu tư" và "xác thực 2 bước" |

### Soát 6 khóa chữ mới

Sinh từ `gen_strings.py` và khớp `strings-{vi,en}.json` @ `42876026`.

| Khóa | VI | EN | Kết quả |
|---|---|---|---|
| `secmail.new_label` | Địa chỉ mới | New address | Đạt. Hiện bằng `label-h` (IN HOA là kiểu nhãn của DS) |
| `secmail.status_set` | Đã có | Set | Đạt. Chip ngắn, cùng nhịp với "Chưa bật" / "Off" của khối 2FA |
| `secmail.status_unset` | Chưa có | Not set | Đạt. Trùng chữ với `users.email_none` nhưng tách khóa là đúng (hai chỗ dùng khác nhau) |
| `secnudge.both` | Tài khoản của bạn chưa bật xác thực 2 bước và chưa có email nhận thông báo bảo mật. Từ khi có dữ liệu khách thật, xác thực 2 bước là bắt buộc. | Your account has no 2-step verification and no notification email yet. Once real guest data is in the app, 2-step verification becomes mandatory. | Đạt. Đúng bảng, đúng thuật ngữ thẻ 03, vế sau khớp `mfa.nudge` |
| `secnudge.open` | Mở Bảo mật tài khoản | Open Account security | Đạt. Tên đích khớp menu và tiêu đề trang |
| `users.email_saved_first` | Đã lưu email của {name}. Thông báo đã gửi tới địa chỉ này và các chủ đầu tư. | {name}'s notification email is saved. A notice has been sent to that address and all owners. | Đạt. Không còn "địa chỉ cũ" ở lần đầu |

Cả 6 khóa ngắn, điềm tĩnh, không emoji, không đổ lỗi, không có cụm bị cấm. Chỉ có `secmail.status_set` chưa nằm trong danh sách test chuỗi (thẻ 15).

### Soát `.btn.btn-inline` (`packages/ui/src/styles/app.css`)

- Đạt:
  - Chỉ đặt `padding-inline: 0`. Màu lấy từ `.btn.ghost` (`--oak-ink`), chiều cao lấy từ `.btn.sm` (32px, đủ chuẩn nút `sm` của Desk). Không có mã màu tự đặt.
  - `app.css` nạp sau `hifi.css`, cùng độ ưu tiên (0,2,0), nên lớp mới thắng phần padding của `.sm`.
  - Vòng focus chung (`:focus-visible` 2px, offset 2px) vẫn thấy rõ khi không có padding.
  - Gạch chân khi hover khớp kiểu link ở hàng bên cạnh.
  - `.nowrap` và `.users-email` đạt. Tên `.nowrap` không trùng tiện ích nào trong `hifi.css`.
- Lỗi: trạng thái tắt (mất mạng, `disabled={!online}`) bị vỡ. Xem thẻ 13.
- Việc của UXD sau khi gộp: ghi biến thể `btn-inline` vào DS (mục nút, C-button), kèm quy tắc "chỉ dùng trong ô bảng hoặc dòng dữ liệu, ngay dưới giá trị nó sửa". Sau này chuyển lớp sang `hifi.css` khi UXD phát hành DS. FE giữ ở `app.css` cho v1.0.3.

### Soát `StrongReauthDialog` (hộp S2 dùng chung)

- Hộp được dùng ở 9 chỗ: `SecurityPage` (Tạo bộ mã mới, Tắt 2FA), `UsersPage`, `AddUserDialog`, `DevicesPage`, `ReceivingAccount` (2 hộp), `SecurityEmailCard`, `UserEmailDialog`.
- Lượt này hộp chỉ thay một chỗ: `missingFactor`. Phần thân email đi qua `children`, nên 7 hộp cũ không đổi bố cục.
- Hành vi cũ giữ nguyên:
  - 401 `REAUTH_FAILED` vẫn một câu chung, không nói yếu tố nào sai (SEC 06.20).
  - Hai ô được xóa sau mỗi lần thử.
  - Câu "Chờ mã mới" vẫn hiện khi đã bật 2FA.
- UXD đồng ý đánh dấu ô bằng `common.required` khi server báo **thiếu** yếu tố: báo thiếu không cho biết yếu tố nào sai. Phần bảo mật do SEC xác nhận trong review SEC của PR #31.
- Có 2 điểm:
  - Dòng xác thực dính sát `children`. Lỗi có ở cả 9 hộp, kể cả hộp 2FA cũ. Sửa một dòng là cả 9 hộp đều đúng (thẻ 07).
  - Không đưa focus về ô cần nhập khi server báo thiếu mã (thẻ 14).
- UXD chốt bố cục hộp S2 làm chuẩn: `children` → dòng xác thực (`reauth.s2_help*`) → banner lỗi → Mật khẩu → Mã. Các khối cách nhau 12px nhờ `.stack`, dùng modal `sm` (C15). FE bỏ nhãn `[CHỜ UXD] hi-fi R3 of this dialog` trong JSDoc. UXD ghi bố cục này vào DS sau khi gộp.

### FB-R4-UXD-FE-EM-07 (mở lại)
- Mức độ: Minor
- Vị trí: `StrongReauthDialog.tsx`, thẻ `<p className="muted" style={{ margin: 0 }}>` của dòng `reauth.s2_help` / `reauth.s2_help_password`. Ảnh vi-03, en-03
- Vấn đề: `margin: 0` inline ghi đè `.stack>*+*{margin-top:12px}`. Vì vậy câu "Thao tác này cần mật khẩu đăng nhập của bạn." dính sát dưới câu "…tới địa chỉ cũ, nếu có.", đọc như một đoạn. Thẻ 07 lượt 1 yêu cầu các khối cách nhau 12px. Lỗi có ở cả 9 hộp S2, ví dụ hộp Tạo bộ mã mới: `mfa.regen_note` cũng dính sát dòng xác thực.
- Vì sao quan trọng: Câu báo và câu hướng dẫn nhập là hai việc khác nhau. Khi dính nhau, người dùng dễ bỏ qua câu báo về địa chỉ.
- Đề xuất sửa: Bỏ `style={{ margin: 0 }}` ở thẻ `<p>` đó. Chỉ một dòng, và cả 9 hộp đều đúng. `EmailConfirmBody` giữ nguyên `margin: 12px 0 0` của nó, vì nằm trong `<div>` bọc `children`, ngoài `.stack`. QA chụp lại 3 hộp để chắc bố cục không vỡ: Lưu email, Tạo bộ mã mới, Hủy lịch đổi tài khoản nhận tiền (hộp có ô lý do).
- Trạng thái: Open

### FB-R4-UXD-FE-EM-13
- Mức độ: Minor
- Vị trí: `packages/ui/src/styles/app.css` `.btn.btn-inline`; nút "Sửa email" ở `UsersPage.tsx` (`disabled={!online}`)
- Vấn đề:
  - `hifi.css` dòng 132 cho `.btn[disabled]` nền `--surface-2` và viền gạch. `.btn-inline` chỉ bỏ padding ngang, nên khi mất mạng mỗi hàng hiện một hộp xám viền gạch ôm sát chữ "Sửa email". Đó đúng là kiểu nút tắt mà thẻ 08 vừa bỏ, nay còn xấu hơn vì không có padding.
  - Luật `:hover` cũng áp lên nút tắt, nên chữ được gạch chân như thể vẫn bấm được.
- Vì sao quan trọng: Desk có chế độ chỉ đọc khi mất mạng (thanh offline ở đầu trang). Bảng 8 hàng với 8 hộp gạch đứt sẽ rối và lệch DS.
- Đề xuất sửa:
  ```css
  .btn.btn-inline[disabled],
  .btn.btn-inline[aria-disabled='true'] {
    background: transparent;
    border-color: transparent;
  }
  .btn.btn-inline:not([disabled]):not([aria-disabled='true']):hover {
    background: transparent;
    text-decoration: underline;
  }
  ```
  - Giữ màu muted và con trỏ `not-allowed` từ DS. Thanh offline đã giải thích lý do.
  - Test: render khi offline thì nút có `disabled`. QA chụp bảng khi mất mạng.
- Trạng thái: Open

### FB-R4-UXD-FE-EM-14
- Mức độ: Suggestion
- Vị trí: `StrongReauthDialog.tsx`, nhánh `missingFactor` trong `submit`
- Vấn đề: Khi server báo thiếu `reauth.totpCode` / `reauth.recoveryCode`, hộp đánh dấu ô mã nhưng không chuyển focus. Chỉ ca mật khẩu mới có `pwRef.focus()`. Hai ô cũng vừa bị xóa, nên người dùng điền mã, bấm xác nhận, rồi mới thấy "Bắt buộc" ở ô mật khẩu. Họ phải sửa hai lượt.
- Vì sao quan trọng: Người dùng bàn phím và trình đọc màn hình không biết lỗi nằm ở đâu. Trường hợp này hiếm, vì client đã bắt buộc cả hai ô, nên chỉ là Suggestion.
- Đề xuất sửa: Trong nhánh này luôn focus `pwRef`, vì đó là ô đầu tiên vừa bị xóa, giống nhánh `REAUTH_FAILED`. Vẫn giữ dấu "Bắt buộc" ở ô server nêu. Thêm một assert focus vào test sẵn có (`reauth.totpCode` → ô mã).
- Trạng thái: Open

### FB-R4-UXD-FE-EM-15
- Mức độ: Suggestion
- Vị trí: `product/design/tools/gen_strings.py` (nhóm v1.0.3), `v103-email-fea.test.tsx`
- Vấn đề:
  - `secmail.status_set` chưa có trong `KEYS` của test chuỗi (5 trên 6 khóa mới đã có).
  - Ghi chú khóa còn tả bản cũ:
    - `users.email_self`: "nút tắt + câu này";
    - `users.email_other_owner`: "nút tắt (403 FORBIDDEN_ACTION)";
    - `secmail.purpose`: "nói \"thư thông báo\"".
  - Tiêu đề nhóm vẫn ghi "**Chờ UXD/CPY duyệt**".
  - Chú thích dòng 16 của test còn "Email nhận thư bảo mật".
- Vì sao quan trọng: Ghi chú khóa là thứ CPY và người dịch đọc (`strings-tables.md`). Ghi chú sai sẽ dẫn họ sửa sai.
- Đề xuất sửa:
  - Thêm `secmail.status_set` vào `KEYS`.
  - Sửa 3 ghi chú theo mã hiện tại.
  - Đổi tiêu đề nhóm thành "UXD đã duyệt (lượt 2, 03/11/2026)". Phần CPY để CPY tự ghi.
  - Sửa chú thích test thành "thông báo bảo mật".
  - Chạy lại generator.
- Trạng thái: Open

### Brand OTTIMO – rà lại lượt 2

| Mục | Kết quả |
|---|---|
| Màu | Đạt. CSS mới chỉ có `transparent`. Chip và Alert dùng tone `ok`, `neutral`, `warn` của DS |
| Chữ | Đạt. Lora ở tiêu đề trang, khối, hộp. Be Vietnam Pro ở thân, nút, nhãn. JetBrains Mono 13px chỉ cho địa chỉ |
| Giọng | Đạt. 6 khóa mới ngắn, điềm tĩnh. Chỉ dùng một bộ thuật ngữ: "Notification email" / "Email nhận thông báo bảo mật" |
| Emoji / IN HOA | Không có emoji (có test). IN HOA chỉ ở `label-h` và tiêu đề cột của DS |
| Dữ liệu cá nhân | Ảnh chỉ dùng `*@example.test`. Toast và URL không chứa địa chỉ |

Không có lệch giữa guideline và DS trong phạm vi lượt này.

### Điểm làm tốt lượt 2

- `EmailConfirmBody` dùng chung cho hai hộp S2, nên sửa một lần là đúng cả khối của mình lẫn hộp OWN.
- Câu báo và địa chỉ hiển thị đều theo địa chỉ server trả về (đã chuẩn hóa), không theo chuỗi người dùng gõ. Như vậy người dùng thấy đúng địa chỉ sẽ nhận thư.
- Banner gộp giữ đúng ranh giới: chỉ gộp khi thiếu 2FA và thiếu email. Ca "còn ít mã khôi phục" vẫn để riêng, vì đó là việc khác.

## Lượt 3 – 03/11/2026: phần sổ tay của thẻ 09 (QC v1.0.3 ĐK11a/b)

- Người review: UXD | Round 4 – đợt v1.0.3 – bước **Sản xuất** (điều kiện QC ĐK11a/b, `rounds/round-04/qc/v1.0.3-gate.md` S7).
- Đối tượng: Markdown của BA @ `0d12cbc5` (không sửa): `user-manual-v1.0.md` bản 1.8, `guides/0*.md` bản 1.6, `screenshot-list.md`, `guides/screenshot-additions.md`. 6 ảnh trong `product/docs/manual/img/` @ `8a399f17` (đã qua QA kiểm che). HTML dựng lại bằng `build_manual.py`, `build_guides.py`. Báo cáo: `rounds/round-04/outputs/UXD/manual-1.8-html-report.md`.

| Yêu cầu của thẻ 09 | Kết quả | Bằng chứng |
|---|---|---|
| Chỉ đường "tên của mình → Bảo mật tài khoản → khối Xác thực 2 bước" | **Đạt** | Sổ tay 0.2, 0.3; `01` 1.4, 1.6; `02` 1.6; `05` 1.5. Không còn chỉ đường cũ "→ Xác thực 2 bước" nào thiếu chú "trước v1.0.3". Tên khớp chuỗi `shell.account_security` |
| Đoạn về khối email | **Đạt** | Sổ tay 0.3a (mới), 1.5; `01` 1.6a, 1.9; `02` 1.6; `05` 1.5. Tên khối, chip "Đã có"/"Chưa có", câu lỗi theo `secmail.*`, `users.*email*` |
| Ảnh chụp lại sau khi QA kiểm che | **Đạt** | C0-06, G1-01, C1-07, C0-12, C0-13, C1-22 đã gắn vào HTML (khớp từng byte tệp trong `img/`). HTML không chứa ảnh nào ngoài `img/` |
| HTML sổ tay khớp Markdown | **Đạt** | `ottimo-manual-v1.0.html` có 9 lần "Bảo mật tài khoản"; `guides/html/01` 9, `02` 4, `05` 2, `00` 1. Không tràn ngang ở 390 px và 1440 px (7 trang HTML + tờ máy tính bảng vừa khung). Ảnh kiểm `rounds/round-04/outputs/UXD/manual-1.8-check-1440.png`, `…-390.png` |

Sửa thêm trong công cụ dựng (không đụng Markdown): mục có chữ cái như **0.3a**, **1.6a** trước đây không có số ở mục lục và link "mục 0.3a" chỉ nối tới 0.3, chữ "a" lẻ ngoài link. Nay `build_manual.py` và `build_guides.py` nhận số mục có một chữ cái cuối, nên mục lục hiện `0.3a`, `1.6a` và link về đúng mục. Các mục cũ 2.5a, 2.14a, 9.1a, 13.1a–d, 13.2a, 6.3a cũng được sửa theo.

Thẻ 09: **Closed** (chỉ đường, đoạn khối email, ảnh). Thẻ này không phụ thuộc 4 thẻ Major của DOM (`DOM-on-manual-1.8.md`, M18-01…04 về nội dung thư, `info@`, lúc dừng kiểm sáng, nơi mở hộp thư). Các thẻ đó BA sửa Markdown sau khi ARC review xong. Khi đó UXD dựng lại HTML bằng một lệnh:
`python3 -I product/design/tools/rebuild_manual_html.py --out-dir rounds/round-04/outputs/UXD --tag manual-1.8`
Việc còn lại thuộc người khác: DOM + ARC đọc phần sổ tay đổi ở 1.6/1.8 (ĐK11c). ORC quyết có commit HTML không. HTML ở lượt này là bản trước khi BA sửa theo DOM, nên chưa trình INV.

**Cập nhật 03/11/2026 – dựng lại từ sổ tay 1.9 / bộ hướng dẫn 1.7** (BA đã sửa theo DOM M18-01…07, 09 và ARC M18-01…05): chạy `rebuild_manual_html.py --tag manual-1.9`, kết quả ĐẠT. Không tràn 390/1440 px. 6 ảnh có đủ. 0 link mục bị cắt. Bảng "Thư nào – làm gì" vừa khung ở 390 px. Ảnh kiểm: `rounds/round-04/outputs/UXD/manual-1.9-check-1440.png`, `…-390.png`. Chỉ đường của thẻ 09 vẫn đúng, nên thẻ 09 vẫn **Closed**. HTML này thay cho bản lượt 3 ở trên. Lần dựng sau dùng `--tag` theo số bản mới.
