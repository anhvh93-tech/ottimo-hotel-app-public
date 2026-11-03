# ARC review – Sổ tay 1.8 / bộ hướng dẫn 1.6: email nhận thông báo bảo mật (v1.0.3)

- Người review: ARC | Round 4 – Bước: Review (QC v1.0.3 ĐK11(c), phần ARC) | Ngày: 03/11/2026
- Tác giả: BA (FB-R4-UXD-FE-EM-09). DOM đọc cùng phần ở `rounds/round-04/reviews/DOM-on-manual-1.8.md`; tệp này không lặp lại thẻ của DOM, chỉ thêm phần kỹ thuật và trả lời thẻ DOM chuyển sang ARC (FB-R4-DOM-BA-M18-10, mục 4).
- Phạm vi (Markdown, chưa xem HTML vì chưa dựng lại): `product/docs/manual/user-manual-v1.0.md` mục 0.2, 0.3, 0.3a, bảng thuật ngữ, lịch sử bản 1.8; `guides/01-chu-dau-tu-quan-ly.md` mục 1.6, 1.6a, 1.9; `guides/02-le-tan.md` mục 1.6 (menu, email); `guides/05-sale-ctv.md` mục 1.5 (menu).
- Trọng tâm ARC theo gate: S2, `info@` (hộp thư chung bị từ chối), email hiện dạng che, quay lui.
- Đối chiếu với mã ở `SHA_V103` `da6d6f3d`: `modules/identity/internal/security-email.service.ts` (`check`), `security-email.controller.ts` (thứ tự kiểm), `identity/public/strong-reauth.ts` + `password-reauth.ts` (S2, bộ đếm), `shared/email.ts` (`normalizeSecurityEmail`, `maskEmail`), `jobs/email-dispatch.ts` (người nhận), `admin-web/src/components/SecurityEmailCard.tsx`, `admin-web/src/app/email.ts`, test `v103-email-fea.test.tsx`; chuỗi `product/design/copy/strings-vi.json` (`secmail.*`, `users.*email*`, `reauth.*`, `field.EMAIL_SHARED_MAILBOX`, `error.RATE_LIMITED`); v1.0.2 `e5fffe05:jobs/email-dispatch.ts` (cho phần quay lui); runbook v1.0.3 R7; `product/integrations/notification/smtp.ts`.

## Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

- Tên menu, tên khối, nút, câu báo trong sổ tay **khớp chuỗi Desk ở `da6d6f3d`**. Sổ tay ghi nguồn chuỗi là `v1.0.3-email` @ `3aaa971c`; ARC đã kiểm `git diff 3aaa971c da6d6f3d` trên các khóa `secmail.*`, `shell.account_security`, `users.*email*`, `secnudge.*`, `reauth.*`, `field.EMAIL_SHARED_MAILBOX`: không đổi. Ai được đặt email của ai (tự đặt; chủ đầu tư đặt cho nhân viên; quản lý không thấy cột Email; chủ đầu tư khác tự đặt) và ai nhận thư (địa chỉ mới, địa chỉ cũ, các chủ đầu tư; mỗi người một bản) **đúng mã**.
- ARC **đồng ý 4 thẻ Major của DOM** (M18-01…04), nhất là M18-02 (`info@`): đó là đúng trọng tâm ARC, mã xác nhận Desk chỉ chặn một địa chỉ.
- ARC thêm **0 Major, 3 Minor, 2 Suggestion**. Điều kiện: BA sửa **ARC-M18-01** (cùng lượt với DOM M18-02, cùng câu chữ) và **ARC-M18-02** trước khi UXD dựng lại HTML (ĐK11a). ARC-M18-03, 04 nên làm cùng lượt vì rẻ (mỗi thẻ 1–2 câu); không kịp thì dời bản sổ tay kế tiếp, không chặn ORC báo INV.

## 1. Đối chiếu theo 4 trọng tâm

| Trọng tâm | Mã thật (`da6d6f3d`) | Sổ tay | KQ |
|---|---|---|---|
| **S2** | Hộp xác nhận cần mật khẩu + mã 6 số (tài khoản có 2 bước) hoặc chỉ mật khẩu (`reauth.s2_help_password`). Sai bất kỳ yếu tố nào → cùng một câu `reauth.s2_failed` (không nói sai cái nào). Mỗi mã dùng một lần. Sai **5 lần → khóa 15 phút** (`REAUTH_MAX_FAILURES = 5`, `REAUTH_LOCK_MS = 15 phút`), bộ đếm **dùng chung** cho mọi thao tác cần xác nhận (đổi tài khoản nhận, duyệt, cấp quyền máy…), có thông báo `security_alert` trong app. Mật khẩu sai thì không tiêu mã khôi phục | 0.3a bước 3 và `02` 1.6 bước 3: "…và mã 6 số nếu tài khoản có 2 bước" (đúng). `01` 1.6a, 1.9: luôn đòi mã (đúng, chủ đầu tư/quản lý có 2 bước). Câu "Mật khẩu hoặc mã chưa đúng…" có, kèm cách xử lý. **Thiếu:** khóa sau 5 lần và việc khóa chặn cả thao tác nhạy cảm khác | Thiếu → ARC-M18-02 |
| **`info@`** | `check()` chạy **trước** S2 (controller dòng 7): chuẩn hóa (cắt khoảng trắng, chữ thường), so **bằng đúng** với địa chỉ của `EMAIL_FROM` → 422 `EMAIL_SHARED_MAILBOX`, không ghi, không đếm, không tiêu mã. `EMAIL_FROM` trống thì luật tắt (staging). Desk chỉ thấy lỗi **sau khi bấm Lưu email trong hộp xác nhận** (test `shared mailbox (info@): … TOTP not spent`) | "Không dùng `info@`. Desk từ chối: '…'" đặt ở bước 2, trước hộp xác nhận | Câu chữ hiểu sai phạm vi và thời điểm → DOM M18-02 + ARC-M18-01 |
| **Email hiện dạng che** | Dạng che `o***@e***.test` (`maskEmail`) **chỉ có trong nhật ký kiểm toán** (`user.email_changed`), Desk v1.0.3 không có màn xem nhật ký này. Desk hiện **đủ địa chỉ, không che** ở 3 chỗ: khối của chính mình ("Địa chỉ đang dùng"), hộp xác nhận ("Địa chỉ mới"), và với chủ đầu tư: cột **Email** + hộp **Sửa email** ở **Người dùng & vai**. Thư `email_changed` và thông báo trong app (`staff.notif.sec.email_changed_*`) **không ghi địa chỉ**, cả dạng che | "Thư không ghi địa chỉ email" (đúng). `01` 1.9 "Cột Email hiện địa chỉ" (đúng). Nhưng câu báo Desk được chép là "Đã lưu. Thông báo đã gửi tới …" – dấu "…" làm người đọc chờ một địa chỉ (đủ hoặc che), trong khi Desk viết "…tới địa chỉ này." / "…tới địa chỉ mới và địa chỉ cũ." Sổ tay chưa nói Desk hiện đủ địa chỉ nên không chụp màn hình khối này | → ARC-M18-03 |
| **Quay lui** | Lùi về v1.0.2: menu về tên **Xác thực 2 bước**, khối email biến mất (v1.0.2 không có `PUT /v1/me/email`, `getMe` không có `email`). Email đã lưu **vẫn ở DB**, dispatcher v1.0.2 vẫn đọc `app_user.email`, nên thư mã khôi phục / đặt lại 2 bước / đổi tài khoản nhận **vẫn tới**. Thư "email đã đổi" tạo ngay trước lúc lùi thành `BAD_TEMPLATE`, chỉ gửi lại khi lên lại + R9 trong 7 ngày. Không đổi/xóa được email cho tới khi lên lại. Runbook R7 đã có các câu này cho ORC báo INV | Sổ tay chỉ có "Có từ v1.0.3" và "Trước v1.0.3, mục … có tên Xác thực 2 bước". Không có dòng nào cho trường hợp đã lên rồi lùi | → ARC-M18-04 |

## 2. Thẻ feedback

### FB-R4-ARC-BA-M18-01
- Mức độ: Minor (bổ sung kỹ thuật cho DOM M18-02 – BA sửa cùng một câu)
- Vị trí: `user-manual-v1.0.md` 0.3a bước 2 gạch 2; `01` 1.6a bước 2, 1.9 bước 3; `02` 1.6 bước 2; `05` 1.5.
- Vấn đề: ngoài điều DOM nêu (Desk chỉ chặn đúng `info@`), có hai điểm sổ tay viết lệch mã:
  1. **Thời điểm:** câu "Desk từ chối" đặt ở bước 2, như thể Desk báo ngay khi bấm **Thêm email**. Thực tế Desk mở hộp xác nhận trước; câu "Đây là hộp thư chung của cơ sở…" chỉ hiện **dưới ô Email sau khi nhập mật khẩu, mã và bấm Lưu email**. Người dùng nhập đúng mật khẩu và mã mà vẫn bị từ chối dễ tưởng mình gõ sai.
  2. **Biến thể:** luật so bằng đúng địa chỉ. `info+abc@ottimo.vn` (thêm `+…` trước `@`) qua được kiểm, mà Google Workspace vẫn giao thư đó vào hộp `info@`. Tức là "Desk chặn `info@`" chỉ đúng với đúng một cách viết.
- Vì sao quan trọng: sổ tay là lớp chặn duy nhất cho mọi hộp thư chung khác `info@` (DOM M18-02). Nếu câu chữ ngụ ý Desk tự lo, người dùng thôi tự kiểm.
- Đề xuất sửa:
  - Sổ tay (BA, cùng câu DOM M18-02 đề xuất): thêm sau câu "Desk chỉ chặn được `info@`…": "Câu báo hiện **sau khi** anh/chị bấm **Lưu email** trong hộp xác nhận. Mật khẩu và mã **không bị tính là sai**, mã chưa bị dùng; chỉ cần nhập một email riêng khác." Ở `05` 1.5 chỉ cần câu ngắn "dùng email riêng chỉ mình đọc; Desk chỉ chặn được `info@`".
  - Mã (v1.0.4, BE-A; SEC duyệt; không chặn v1.0.3): so sánh sau khi bỏ phần `+…` của tên hộp thư; thêm tham số danh sách hộp thư chung (ít nhất `info@`, `booking@` của cơ sở) để Desk chặn được cả các hộp DOM nêu. Thêm ca test cho `info+x@` và `booking@`.
- Trạng thái: Open

### FB-R4-ARC-BA-M18-02
- Mức độ: Minor
- Vị trí: `user-manual-v1.0.md` 0.3a danh sách câu báo (sau ảnh C0-13); `01` 1.6a cùng chỗ; `02` 1.6 bước 3.
- Vấn đề:
  1. Sổ tay không nói **sai 5 lần thì Desk khóa 15 phút** ("Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại."), và trong 15 phút đó **mọi thao tác cần xác nhận bằng mật khẩu và mã đều bị chặn** (bộ đếm dùng chung), không riêng khối email.
  2. Tài khoản **không có 2 bước** (lễ tân, sale) nhận cùng câu "Mật khẩu hoặc mã chưa đúng. Kiểm tra lại rồi nhập mã mới." dù không có ô mã (BUG-R4-024, P3, sửa ở v1.0.4). Sổ tay chỉ dạy "chờ ứng dụng hiện mã mới", không có hướng cho người không có ứng dụng.
- Vì sao quan trọng: (1) chủ đầu tư thử vài lần lúc tối muộn rồi bị khóa duyệt/đổi tài khoản nhận 15 phút mà không biết vì sao; người trực ca đêm cũng vậy. (2) lễ tân đọc câu báo, đi tìm "mã" không tồn tại.
- Đề xuất sửa: thêm hai gạch:
  - "Tài khoản không có xác thực 2 bước: câu này nghĩa là **mật khẩu chưa đúng**. Nhập lại mật khẩu." (bỏ được khi BUG-R4-024 sửa).
  - "Sai **5 lần**, Desk báo 'Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại.' (khoảng 15 phút). Trong lúc đó mọi thao tác cần mật khẩu và mã đều chờ. Anh/chị không tự sai 5 lần mà vẫn thấy câu này: báo chủ đầu tư."
- Trạng thái: Open

### FB-R4-ARC-BA-M18-03
- Mức độ: Minor
- Vị trí: `user-manual-v1.0.md` 0.3a bước 4; `01` 1.6a bước 4, 1.9 bước 5.
- Vấn đề: câu báo Desk được chép là "Đã lưu. Thông báo đã gửi tới …" và "Đã lưu email của {tên}. Thông báo đã gửi tới …". Câu thật không có địa chỉ, đủ hay che: `secmail.saved_first` "…tới địa chỉ này.", `secmail.saved` "…tới địa chỉ mới và địa chỉ cũ.", `users.email_saved(_first)` "…tới địa chỉ mới, địa chỉ cũ và các chủ đầu tư." / "…tới địa chỉ này và các chủ đầu tư.". Ngược lại, sổ tay không nói rằng khối **Bảo mật tài khoản** và cột **Email** ở **Người dùng & vai** hiện **đủ địa chỉ, không che**.
- Vì sao quan trọng: người đọc chờ thấy địa chỉ trong câu báo, không thấy thì tưởng lưu lỗi. Và vì Desk hiện đủ địa chỉ, ảnh chụp các màn này là dữ liệu cá nhân: không được gửi qua chat, `/feedback` hay sổ giao ca (sổ tay `01` mục báo lỗi đã cấm chụp dữ liệu khách; email nhân viên cũng cùng loại).
- Đề xuất sửa: chép đủ câu báo như trên (hai biến thể lần đầu / đổi). Thêm một gạch ở 0.3a và `01` 1.6a: "Desk hiện **đủ** địa chỉ email ở khối này và ở **Người dùng & vai** (không che). Không chụp màn hình các màn này để gửi chat hay báo lỗi; báo lỗi bằng lời. Thư báo và thông báo trong app không ghi địa chỉ."
- Trạng thái: Open

### FB-R4-ARC-BA-M18-04
- Mức độ: Suggestion
- Vị trí: `user-manual-v1.0.md` 0.3a khung đầu; `01` 1.6a khung đầu.
- Vấn đề: sổ tay chưa nói gì nếu đội **quay lui** v1.0.3 sau khi mọi người đã nhập email. Khi đó menu đổi lại tên **Xác thực 2 bước**, khối email biến mất, nhưng email đã lưu vẫn nhận thư. Runbook R7 có câu cho ORC báo INV và lễ tân, nhưng nhân viên đọc sổ tay sẽ thấy Desk khác sổ tay.
- Đề xuất sửa: thêm một câu vào khung đầu: "Nếu đội báo **tạm quay về bản trước**: menu trở lại tên **Xác thực 2 bước** và khối email tạm ẩn. Email đã lưu vẫn dùng, thư báo bảo mật vẫn tới. Không cần nhập lại. Cần đổi email gấp thì báo chủ đầu tư." Chữ khớp R7; không đổi khi R7 đổi thì BA sửa cùng.
- Trạng thái: Open

### FB-R4-ARC-BA-M18-05
- Mức độ: Suggestion
- Vị trí: `user-manual-v1.0.md` lịch sử bản, dòng 1.8 ("Chữ theo chuỗi Desk … (nhánh `v1.0.3-email` @ `3aaa971c`)").
- Vấn đề: nhánh đã gộp; mốc đúng cho người đọc sau này là bản phát hành.
- Đề xuất sửa: ghi "khớp chuỗi Desk ở `v1.0.3` (`da6d6f3d`; ARC đã đối chiếu không đổi so với `3aaa971c`)".
- Trạng thái: Open

## 3. Những điểm đúng, giữ nguyên

1. Mỗi người tự nhập email của mình; chủ đầu tư đặt hộ có bước "hỏi tận miệng, đọc lại"; quản lý không đặt cho người khác: khớp quyền trong `users.controller.ts` (`NOT_ALLOWED_FOR_SELF`, `users.email_other_owner`).
2. "Ai nhận thư": mới (thêm/đổi), cũ (đổi/xóa), các chủ đầu tư (mọi lần), mỗi người một bản: khớp `email-dispatch.ts` (`ownerCopies` trước, rồi `self`, `previous`, bỏ trùng theo địa chỉ).
3. "Thư không có link, không hỏi mật khẩu hay mã; mở Desk bằng cách gõ địa chỉ": khớp mẫu thư và câu chống lừa đảo trong 3 bản (gate S5).

## 4. Trả lời FB-R4-DOM-BA-M18-10 (đường gửi dự phòng `smtp.gmail.com` và "Đã gửi" của `info@`)

**Câu hỏi của DOM:** nếu phải chuyển sang đường dự phòng, thư báo bảo mật có bị lưu bản sao trong "Đã gửi" của `info@` không, và sổ tay có cần ghi gì.

**Trả lời ARC:**

| Đường gửi | Có bản sao trong "Đã gửi" của `info@` không |
|---|---|
| **Chính** – `EMAIL_SMTP_MODE=relay`, `smtp-relay.gmail.com:587`, xác thực theo IP máy chủ, không đăng nhập hộp thư (`integrations/notification/smtp.ts`) | **Thường là không.** Thư đi qua dịch vụ chuyển tiếp của Google Workspace không tự vào "Đã gửi" của hộp thư nào. Ngoại lệ: nếu quản trị Workspace đã bật **lưu trữ thư toàn diện** (Comprehensive mail storage, mục Tuân thủ của Gmail), Google lưu bản sao thư gửi qua relay vào hộp thư của địa chỉ gửi, tức `info@`. ARC chưa kiểm được cài đặt này của OTTIMO |
| **Dự phòng** – `EMAIL_SMTP_MODE=app_password`, `smtp.gmail.com:465`, đăng nhập bằng `info@` + mật khẩu ứng dụng | **Có.** Gmail luôn lưu bản sao thư gửi qua SMTP đã đăng nhập vào "Đã gửi" của tài khoản đó. Cấu hình phía máy chủ không tắt được |

Bản sao chứa: tiêu đề, thân thư (tên hiển thị nhân viên, giờ, ai đổi) **và dòng người nhận `To:` = địa chỉ email riêng đầy đủ** (mỗi thư một người nhận: địa chỉ mới, địa chỉ cũ, từng chủ đầu tư). DOM đúng ở ý chính, và ARC thêm một điểm nặng hơn: ai đọc được `info@` thì thấy **địa chỉ riêng của mọi người** nhận thư, trái luật "địa chỉ email không xuất hiện ngoài DB và thư". Người đọc `info@` **không** chặn hay xóa được thư đã tới người nhận, nên tác dụng báo động của thư vẫn còn; lý do cấm dùng `info@` làm hộp **nhận** (người khác đọc và xóa được thư báo của mình) vẫn đúng nguyên.

Mức: **Minor, không chặn v1.0.3.** Production dùng đường chính `relay` (decision-log 23/10, SEC EMAIL-01 A). Đường dự phòng chỉ bật khi có sự cố, bằng đổi `.env`, cần INV đồng ý.

Việc đề xuất (ORC giao; ARC không sửa tệp của vai khác):
1. **OPS** (README `infra/server` mục email + runbook mục chuyển sang `app_password`, v1.0.4 hoặc trước lần chuyển đầu tiên): ghi rõ "đường dự phòng lưu bản sao thư, có địa chỉ người nhận, trong Đã gửi của `info@`". Trước khi chuyển: ORC hỏi INV ai đang đọc được `info@`. Trong thời gian dùng dự phòng: **INV tự** xóa các thư có tiêu đề bắt đầu "OTTIMO – Security notice" hoặc "OTTIMO – Notice:" trong "Đã gửi" của `info@` và dọn thùng rác (thao tác xóa do INV làm, đội không làm hộ). Quay về `relay` sớm nhất.
2. **Kiểm một lần, chỉ đọc, sau K8** (ORC nhắn INV, không cần địa chỉ): INV mở "Đã gửi" của `info@`, tìm "Security notice", trả lời **có** / **không**. "Có" trên đường `relay` nghĩa là lưu trữ thư toàn diện đang bật: xử lý như ý 1 cho mọi lúc, và SEC xem lại.
3. Nếu INV muốn bỏ hẳn rủi ro này: gửi từ một tài khoản chỉ để gửi, không ai đọc. Việc này có thể tốn thêm phí giấy phép Workspace, nên nếu đội đề xuất thì ORC tạo ESC ở v1.0.4. Hiện ARC **không** tạo ESC.

**Sổ tay:** không cần đổi (đồng ý DOM). Đây là thao tác hạ tầng do ORC/OPS làm theo runbook, nhân viên không làm gì khác. Thẻ DOM M18-10 về phía ARC: **trả lời xong**, chuyển phần việc cho OPS (ý 1) và ORC (ý 2); DOM đóng thẻ khi OPS ghi xong.

## 5. Dòng decision-log đề nghị (ORC ghi)

`| 2026-11-03 | 4 | ARC – review sổ tay 1.8 / bộ 1.6 (email nhận thông báo bảo mật v1.0.3, QC v1.0.3 ĐK11c phần ARC): ĐẠT CÓ ĐIỀU KIỆN. Chữ Desk khớp da6d6f3d; quyền đặt email và người nhận thư khớp mã. Đồng ý 4 Major DOM M18-01…04. ARC thêm Minor 01 (info@: Desk chỉ chặn đúng EMAIL_FROM, báo sau khi bấm Lưu trong hộp xác nhận, không đếm sai; info+x@ lọt – mã v1.0.4), 02 (S2 sai 5 lần khóa 15 phút mọi thao tác cần xác nhận; câu báo với tài khoản chỉ mật khẩu), 03 (chép đủ câu báo, Desk hiện đủ địa chỉ – không chụp gửi), Suggestion 04 (quay lui), 05 (mốc chuỗi). Điều kiện trước khi UXD dựng HTML: BA sửa DOM Major + ARC 01, 02. Trả lời DOM M18-10: đường dự phòng smtp.gmail.com lưu bản sao (có địa chỉ người nhận) trong Đã gửi của info@; relay thì không, trừ khi bật lưu trữ thư toàn diện; OPS ghi README/runbook, INV kiểm một lần sau K8; sổ tay không đổi; không ESC | ARC | Quyền ARC (kỹ thuật); BA sửa sổ tay |`

## 6. Điểm làm tốt

1. Sổ tay dùng đúng tên trên Desk ở mọi chỗ (menu, khối, nút, câu báo) và ghi nguồn chuỗi, nên ARC đối chiếu được bằng `git diff` thay vì mở Desk.
2. Ghi rõ "Có từ v1.0.3" và tên cũ của menu, giúp người dùng không lạc trong giờ chuyển bản.
3. Phần "Ai nhận thư" mô tả đúng cả ba loại người nhận mà không lộ địa chỉ mẫu thật nào (chỉ `name@example.com`).

---

## RN103-02 – ARC kiểm

- Yêu cầu: ORC, 03/11/2026. Thẻ `FB-R4-DOM-PO-RN103-02` (Major) trong `rounds/round-04/reviews/DOM-on-release-notes-v1.0.3.md`. ARC chỉ đọc mã ở `da6d6f3d` (so với `e5fffe05` = v1.0.2), không chạy gì trên staging hay production.
- Đã đọc: `services/api/src/shared/serialization/field-policy.ts` (D27, `SELF_DATA_FIELDS`) ở cả hai commit; `identity/internal/auth.service.ts` (nhánh `MFA_REQUIRED`); `identity/internal/mfa.service.ts` (`assertState`, `disable`); `identity/public/mfa-store.ts` (`MFA_REQUIRED_ROLES = ['owner', 'manager']`); `identity/public/operator-reset.ts` + `src/admin/mfa-operator-reset-cli.ts` + `services/api/scripts/mfa-operator-reset.sh`; `apps/mobile/src/pages/LoginPage.tsx`; `apps/admin-web/src/pages/SecurityPage.tsx`, `UsersPage.tsx`; chuỗi `auth.mfa_later`, `mfa.disable`, `mfa.disable_note`; `qa/bug-list.md` BUG-R4-020, 022; decision-log dòng 926 (diễn tập 06.33 trên staging).

### (1) DOM nói đúng không

**Đúng về hậu quả. Cần chỉnh phạm vi "mới ở đâu":**

| Vai | Tự bật 2 bước trên Desk | Từ bản nào | Lý do trong mã |
|---|---|---|---|
| Buồng phòng (`housekeeping`), bảo trì (`maintenance`), sale nội bộ (`sales_staff`), CTV (`collaborator`) | **Được** | **Mới ở v1.0.3.** Ở v1.0.2 (production hiện nay) không được | v1.0.2: field policy `D27: [HK, MT, SAL, CTV]` bỏ `otpauthUri` và `recoveryCodes` khỏi trả lời của `/v1/me/2fa/*`, nên không lấy được khóa để quét. v1.0.3: bản sửa BUG-R4-018/022 (`SELF_DATA_FIELDS`, `b00972ff`, có trong `da6d6f3d`) cho người gọi thấy dữ liệu của chính mình |
| Lễ tân trưởng (`front_desk_lead`), lễ tân (`front_desk`) | **Được** | **Từ v1.0.0**, không phải mới | D27 không ẩn với FDL/FD ở cả hai bản |
| Chủ đầu tư, quản lý | Bắt buộc | – | `MFA_REQUIRED_ROLES` |

Đường bật: Desk `desk.ottimo.vn` → **tên của mình → Bảo mật tài khoản → khối Xác thực 2 bước** → bật (`setup` → quét mã → `confirm`, 10 mã khôi phục). Desk không chặn các vai này đăng nhập. Không có lời nhắc nào đẩy các vai này bật: banner `secnudge`/`secmail.nudge` chỉ cho chủ đầu tư và quản lý.

Hậu quả khi đã bật: `auth.service.ts` trả `401 MFA_REQUIRED` cho **mọi** tài khoản có `mfa_enabled`, không theo vai. App nhân viên (`LoginPage.tsx` dòng 48–49) chưa có bước 2, chỉ báo "…Đăng nhập 2 bước sẽ có ở bản sau. Nhờ chủ đầu tư hỗ trợ đăng nhập." Vậy người đó **mất app nhân viên**. Desk vẫn dùng được (Desk có bước nhập mã). Desk **không** có nút đặt lại 2 bước cho người khác (BUG-R4-020); API `resetUser2fa` chạy đúng nhưng chỉ gọi được bằng phiên chủ đầu tư qua API, INV không có công cụ.

### (2) Đường khôi phục hiện có

1. **Tự khôi phục, nhanh nhất, không cần ai.** Người đó vẫn có điện thoại hoặc mã khôi phục: đăng nhập **Desk** bằng mật khẩu + mã → **Bảo mật tài khoản → Tắt xác thực 2 bước** (nút có cho mọi vai không bắt buộc: `SecurityPage.tsx` hiện nút khi `!required`; API `disableMy2fa` chỉ cấm vai chủ đầu tư/quản lý) → nhập mật khẩu + mã (S2) → Desk kết thúc mọi phiên → đăng nhập lại app nhân viên bằng mật khẩu như cũ. Khoảng 2 phút.
2. **Mất cả điện thoại lẫn mã khôi phục, hoặc không tự làm được: đội kỹ thuật.** Lệnh 06.33 `mfa-operator-reset-cli` **không giới hạn vai** (chỉ cần `--username`), chạy trên máy chủ: `dc exec -T api node dist/admin/mfa-operator-reset-cli.js --username … --operator … --ticket … --reason …` (vỏ `services/api/scripts/mfa-operator-reset.sh`). Kết quả: xóa 2 bước và mã khôi phục, thu hồi mọi phiên, ghi audit `mfa.reset_by_operator`, gửi thông báo cho người đó và các chủ đầu tư. Vai không bắt buộc thì lần sau đăng nhập bình thường, không bị buộc bật lại. Đã diễn tập trên staging (decision-log 26/10, 06.33 nhánh 3B). Điều kiện: INV đồng ý trong chat và xác nhận đúng người (thủ tục xác minh của SEC, ngoài repo). Đây là thao tác ghi trên production, ORC chạy qua SSH như các bước runbook. Không in tên đăng nhập thật vào chat.
3. **Trong lúc chờ:** Desk trang **Buồng phòng** cho lễ tân thấy việc dọn, nhưng **đổi trạng thái căn vẫn ở app nhân viên**. Vì vậy một nhân viên buồng phòng khác trong ca bấm thay, hoặc dùng cách 1 ngay.

### (3) Mức rủi ro và có cần chặn bằng mã trước Release v1.0.3 không

**Rủi ro production: Thấp.**
- Xác suất thấp: phải tự mở Desk, chủ động vào **Bảo mật tài khoản**, cài ứng dụng xác thực, quét mã, cất 10 mã. Không có lời nhắc nào cho các vai này. Ở OTTIMO hiện chỉ vài tài khoản buồng phòng/bảo trì.
- Tác động: một người mất app nhân viên từ vài phút (cách 1) tới vài giờ (cách 2). Không sai tiền, không mất hay lộ dữ liệu, không ảnh hưởng người khác.
- Lễ tân trưởng/lễ tân đã có rủi ro này từ v1.0.0 mà chưa xảy ra lần nào.

**Không chặn bằng mã trước Release v1.0.3.** Mọi sửa mã đều đổi `SHA_V103`: phải chạy CI mới, deploy staging, diễn tập 5.0 và QC lại, sát hạn ESC-040 (09/11). Lợi ích chỉ là bỏ một rủi ro Thấp mà đã có cách khôi phục tại chỗ. **Sổ tay + release notes dặn là đủ cho v1.0.3.**
- ARC đồng ý câu DOM đề xuất (tách sale/CTV "nên bật" khỏi buồng phòng/bảo trì/lễ tân trưởng "không bật ở v1.0.x"). Đề nghị thêm cách tự khôi phục để người lỡ bật không phải chờ đội: "**Lỡ bật:** đăng nhập Desk bằng mật khẩu và mã → **Bảo mật tài khoản → Tắt xác thực 2 bước** → đăng nhập lại app. Mất điện thoại và mã khôi phục: báo chủ đầu tư, chủ đầu tư báo đội." Cùng câu vào `03` mục 1, `04` mục 1, `02` (lễ tân trưởng) và `01` 1.9.
- Release notes (PO) và sổ tay (BA) sửa trước khi ORC báo INV "v1.0.3 đã lên", cùng lượt ĐK5/ĐK11. Không phải điều kiện trước P0 về kỹ thuật.

**Sửa thật ở v1.0.4** (PO đưa vào backlog 5.6, cùng BUG-R4-020):
1. **Ưu tiên:** app nhân viên có bước 2 khi đăng nhập (`401 MFA_REQUIRED` → màn nhập mã → `loginMfa`; API và hợp đồng 0.3.8 đã có, Desk đã dùng). Đây là gốc của lỗi. Vai MOB, ARC review, SEC duyệt.
2. BUG-R4-020: Desk có nút **Đặt lại xác thực 2 bước** cho chủ đầu tư ở **Người dùng & vai** (`resetUser2fa` đã có).
3. ARC **không** đề xuất ẩn nút Bật với buồng phòng/bảo trì: khi ý 1 xong lại phải mở ra, và việc tự bật 2 bước là điều nên khuyến khích.

### Dòng decision-log đề nghị (ORC ghi)

`| 2026-11-03 | 4 | ARC – kiểm DOM RN103-02 (đọc mã da6d6f3d so với e5fffe05): đúng về hậu quả – tài khoản có 2 bước bị 401 MFA_REQUIRED, app nhân viên chưa có bước 2 nên mất app. Mới ở v1.0.3 cho buồng phòng/bảo trì/sale/CTV (bản sửa BUG-R4-022 bỏ ẩn D27 với dữ liệu của chính mình); lễ tân/lễ tân trưởng tự bật được từ v1.0.0. Khôi phục: (1) người đó tự đăng nhập Desk bằng mã → Bảo mật tài khoản → Tắt xác thực 2 bước (vai không bắt buộc) → đăng nhập lại app; (2) mất máy và mã: đội chạy mfa-operator-reset-cli (06.33, mọi vai, đã diễn tập staging 26/10) khi INV đồng ý. Rủi ro Thấp; KHÔNG chặn bằng mã trước Release v1.0.3 (đổi SHA_V103 = CI/staging/diễn tập/QC lại); release notes + sổ tay 01/02/03/04 dặn "không bật ở v1.0.x, lỡ bật thì tự tắt trên Desk". v1.0.4: app nhân viên có bước 2 (loginMfa đã có) + BUG-R4-020 nút đặt lại trên Desk | ARC | Quyền ARC (đánh giá kỹ thuật); PO/BA sửa chữ |`

---

## Phản hồi BA

- Người trả lời: BA | Round 4 – Phản hồi & sửa (QC v1.0.3 ĐK11) | Ngày: 03/11/2026
- Bản sau khi sửa: sổ tay **bản nội dung 1.9**, bộ hướng dẫn **bản 1.7**. Câu Desk chép từ `product/design/copy/strings-vi.json` (chuỗi ở `da6d6f3d`). HTML chưa sửa: UXD dựng lại sau.

| Thẻ | Trạng thái | Đã làm / lý do |
|---|---|---|
| FB-R4-ARC-BA-M18-01 (Minor) | **Fixed (phần sổ tay)** | Bỏ câu "Desk từ chối" ở bước 2. Thêm gạch con ở bước 3 của sổ tay 0.3a, `01` 1.6a, `02` 1.6: **sau khi** bấm **Lưu email**, Desk báo dưới ô **Email** "Đây là hộp thư chung của cơ sở…". Mật khẩu và mã **không bị tính là sai**, mã chưa bị dùng, nhập email riêng khác. Sổ tay 1.5 / `01` 1.9 bước 4 ghi cùng ý. `05` 1.5 có câu ngắn "Desk chỉ chặn được `info@`". Phần mã (bỏ `+…`, danh sách hộp chung có `booking@`, ca test `info+x@`) là việc của BE-A/SEC ở v1.0.4. BA không sửa mã. Đề nghị ORC đưa vào backlog v1.0.4. Sổ tay chưa nói tới biến thể `info+…@`: câu "Không dùng hộp thư chung" đã bao trường hợp này, và nêu biến thể thì như chỉ cách lách luật |
| FB-R4-ARC-BA-M18-02 (Minor) | **Fixed** | Thêm hai gạch ở sổ tay 0.3a, `01` 1.6a (bản cho chủ đầu tư/quản lý), `02` 1.6 bước 3. (1) Tài khoản không có 2 bước: câu "Mật khẩu hoặc mã chưa đúng…" nghĩa là mật khẩu chưa đúng. Bỏ gạch này khi BUG-R4-024 sửa. (2) Sai 5 lần: "Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại." (khoảng 15 phút). Trong lúc đó mọi thao tác cần mật khẩu và mã đều chờ. Không tự sai mà vẫn thấy câu này thì báo chủ đầu tư (chủ đầu tư gọi đội) |
| FB-R4-ARC-BA-M18-03 (Minor) | **Fixed** | Chép đủ câu báo, hai biến thể lần đầu / đổi: `secmail.saved_first`, `secmail.saved` (sổ tay 0.3a, `01` 1.6a, `02` 1.6) và `users.email_saved_first`, `users.email_saved` (sổ tay 1.5, `01` 1.9 bước 5). Thêm gạch: Desk hiện **đủ** địa chỉ ở khối này và ở **Người dùng & vai**, **không chụp màn hình** để gửi chat hay báo lỗi, báo lỗi bằng lời và chép đủ câu Desk báo; thư báo và thông báo trong app không ghi địa chỉ |
| FB-R4-ARC-BA-M18-04 (Suggestion) | **Fixed** | Thêm câu "tạm quay về bản trước" vào khung đầu sổ tay 0.3a và `01` 1.6a, chữ theo đề xuất (khớp R7). `02` 1.6 có bản ngắn. Khi R7 đổi, nhờ OPS báo BA để sửa cùng |
| FB-R4-ARC-BA-M18-05 (Suggestion) | **Fixed** | Dòng lịch sử 1.9 (sổ tay 5.7) ghi "khớp chuỗi Desk ở `v1.0.3` (`da6d6f3d`; ARC đã đối chiếu không đổi so với `3aaa971c`)". Dòng 1.8 giữ nguyên, vì lịch sử bản ghi đúng lúc viết. Đổi ví dụ địa chỉ trong sổ tay, bộ hướng dẫn và `screenshot-list.md` từ `name@example.com` sang `@example.test`, khớp địa chỉ QA đã dùng khi chụp C0-12, C0-13, C1-22. Câu Desk "ví dụ ten@example.com" là chữ của Desk nên giữ |
