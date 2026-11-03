# FE-A trả lời UXD – v1.0.3 PR-1 phần Desk (email nhận thông báo bảo mật, BUG-R3-032)

- Người trả lời: FE-A | Round 4 – đợt v1.0.3 – bước **Phản hồi & sửa** | 03/11/2026
- Review: `rounds/round-04/reviews/UXD-on-v1.0.3-email-desk.md` (thẻ FB-R4-UXD-FE-EM-01..12, trên `d0b2df3a`).
- Nhánh: `fe-a/v1.0.3-email`, commit "round-4: Phản hồi & sửa – …" (SHA trong báo cáo ORC). Đồng thời khớp BE-A `origin/be-a/v1.0.3-email` @ `0dc60d31` (mục cuối).
- Mọi chữ sửa trong `product/design/tools/gen_strings.py` rồi chạy generator. Không sửa tay JSON. Chữ đúng bảng "Chữ thay thế theo khóa" của UXD.

| Thẻ | Mức | Trạng thái | Đã làm |
|---|---|---|---|
| EM-01 | Major | **Done** | `secmail.lead` VI/EN theo bảng UXD: chỉ nêu thông báo có thật (đặt lại 2FA, email này thay đổi). Ghi chú khóa trong `gen_strings.py`: khi có thư đổi mật khẩu mới thêm "mật khẩu". |
| EM-02 | Major | **Done** | Thêm `users.email_saved_first`. `UserEmailDialog` báo kết quả `first` / `saved` / `removed` theo địa chỉ **trước khi lưu** (`user.email`) và địa chỉ server trả về. Sửa `users.email_body`, `users.email_saved`, `users.email_removed` ("nếu có", "các chủ đầu tư"). Test: lần đầu → `_first` (và không có câu `email_saved`), có địa chỉ cũ → `email_saved`. |
| EM-03 | Major | **Done** | Nhãn "Notification email" / "Email nhận thông báo bảo mật" ở `secmail.title`, `secmail.s2_save_title`, `secmail.s2_remove_title`, `users.email_title`. Chữ mới cho `secmail.missing`, `secmail.nudge`, `secmail.s2_*_body`, `secmail.saved*`, `secmail.removed`, `secmail.purpose`. Test chuỗi chạy trên 30 khóa của nhóm, cấm "thư bảo mật", "thư xác nhận", "xác nhận email", "confirmation", "security email", `domain.com`, `tenmien`. Thêm test tiêu đề khối khớp tiêu đề thư (CPY INT-04). |
| EM-04 | Minor | **Done** | `AppShell.tsx`: gộp `MfaNudge` và `SecurityEmailNudge` thành `SecurityNudges`. Khi thiếu 2FA **và** thiếu email (cả hai chưa "Để sau"), hiện **một** banner `secnudge.both`, nút `secnudge.open` → `/security` (không neo), "Để sau" ghi cả hai cờ. Các ca khác giữ banner riêng (thiếu một thứ; `recoveryCodesLow` + thiếu email là 2 banner). Test cho 3 ca. |
| EM-05 | Minor | **Done** | `field.EMAIL_SHARED_MAILBOX`, `secmail.unchanged`, `secmail.invalid` (`ten@example.com` / `name@example.com`), `field.NOT_ALLOWED_FOR_SELF`, `users.email_none` EN "Not set" theo bảng. |
| EM-06 | Minor | **Done** | (a) Tiêu đề khối nằm trong `.row` như khối 2FA; bỏ `margin: 0` inline ở câu dẫn, nên `.stack` cho 12px. (b) Alert `secmail.missing` dùng icon mặc định của tone warn (tam giác). Banner shell giữ khiên. (c) `secmail.none` chỉ hiện khi không có cảnh báo `missing` (FD/HK… chưa có email). |
| EM-07 | Minor | **Done** | `EmailConfirmBody` dùng chung cho hộp S2 của khối mình và của OWN: nhãn `secmail.new_label` (`label-h`) + địa chỉ `.mono` đứng đầu → câu báo (cách 12px) → dòng xác thực của hộp. Hộp xóa không có nhãn/địa chỉ. Test kiểm nhãn + địa chỉ đã chuẩn hóa. |
| EM-08 | Minor | **Done** | (a) Hàng chính mình: bỏ nút, chỉ link `.li-s` `users.email_self` → `/security#security-email`. Hàng OWN khác: bỏ nút, chỉ dòng `.li-s` `users.email_other_owner`. Bỏ `aria-describedby`. Test đổi theo: hàng đó không có nút "Sửa email", có link/câu. (b) Class `.btn.btn-inline` (`padding-inline: 0`, hover gạch chân, giữ chiều cao `sm` 32px) trong `packages/ui/src/styles/app.css`, dùng cho "Sửa email". (c) `.nowrap` cho cột Đăng nhập gần nhất; `.users-email { overflow-wrap: anywhere }` cho ô email, không cắt "…". Ảnh `en-06` không còn gãy dòng ngày giờ. |
| EM-09 | Minor | **Done (phần FE)** | `Enroll2faPage.tsx` link sang `/security` dùng `shell.account_security`. Khối 2FA trong `SecurityPage.tsx` giữ `shell.security`. Sổ tay: không thuộc FE-A (ORC giao người khác). |
| EM-10 | Suggestion | **Done** | (a) Chip góc phải tiêu đề khối email: có email → `ok` + `check` "Đã có" / "Set"; chưa có → `neutral` + `shield` "Chưa có" / "Not set" (khóa mới `secmail.status_set`, `secmail.status_unset`). (b) Bảng: OWN/MGR chưa có email hiện `Chip tone="warn"` "Chưa có", vai khác giữ chữ muted. Test cả hai. |
| EM-11 | Suggestion | **Done (giữ nguyên)** | Không đặt cỡ riêng. `.mono` của DS (13px) ở khối, hộp S2, bảng. Địa chỉ màu Ink (không `muted`). Ô nhập `.input.mono` chỉ đổi họ chữ. |
| EM-12 | Suggestion | **N/A cho FE-A** | Thẻ cho CPY/INT. Câu Desk mới dùng "chủ đầu tư" / "owners", "xác thực 2 bước" như Desk. |

## Khóa chuỗi mới ở bước này (6)

`secmail.new_label`, `secmail.status_set`, `secmail.status_unset`, `secnudge.both`, `secnudge.open`, `users.email_saved_first`. Nhóm v1.0.3 nay có 40 khóa.

## Khớp với BE-A (`origin/be-a/v1.0.3-email` @ `0dc60d31`, báo cáo BE mục 6)

| Điểm | Desk |
|---|---|
| 422 `STRONG_REAUTH_REQUIRED` với `field: reauth` / `reauth.password` / `reauth.totpCode` / `reauth.recoveryCode` | `StrongReauthDialog` (dùng chung mọi thao tác S2) đánh dấu **đúng ô** trong hộp: mật khẩu hoặc ô mã, câu `common.required`, không bao giờ ở ô email. Hộp ở lại. Nếu server đòi mã mà Desk chưa hiện ô mã (`Me.mfaEnabled` cũ), quay về câu chung `reauth.s2_failed`. Test: `reauth` → ô mật khẩu; `reauth.totpCode` → ô mã, ô mật khẩu và ô email không lỗi. |
| 401 `REAUTH_FAILED` | Câu chung `reauth.s2_failed`, xóa ô (như cũ), test có. |
| `updateUser` hai loại 403 cùng thân | UI không đọc thân để phân biệt. Hàng OWN khác bị loại theo `User.roles` (có `owner` ở bất kỳ cơ sở nào), không có nút. 403 khác cơ sở (nếu gặp) → câu `error.FORBIDDEN_ACTION` ở đầu trang. |
| Server trả `{email}` đã chuẩn hóa | Khối của mình hiện địa chỉ **server trả về** ngay sau khi lưu (giữ tới khi `Me` tải lại). Câu báo chọn theo giá trị đó. Bảng thay hàng bằng `User` server trả. Test: server trả địa chỉ khác chuỗi đã gõ → Desk hiện đúng địa chỉ server. |
| Giữ `Idempotency-Key` khi gửi lại | Như cũ: một khóa mỗi lần Lưu, gửi lại một lần cùng khóa + cùng thân khi mất kết nối. Test có. |
| `Me.email` / `Me.securityEmailMissing` ở `login`, `loginMfa`, `getMe` | Desk đọc từ `session.me`, đã có sau mọi đường vào (mock cũng trả ở cả 3 qua `toMe`). Không lưu `Me` vào Web Storage. |
| Server kiểm dạng chặt hơn (ASCII, ≥ 2 nhãn, TLD chữ) | Client giữ kiểm lỏng (`local@domain`). Server kiểm trước S2 nên không tiêu mã; lỗi về ô email. |

## Kiểm thử sau sửa

- admin-web `vitest run`: **67 tệp, 737/737 xanh** (trước 715; `v103-email-fea.test.tsx` từ 32 lên 54 ca).
- api-client 37/37, i18n 21/21, ui 13/13.
- `tsc --noEmit` admin-web: 0 lỗi. `eslint .`: 0 lỗi (3 cảnh báo có sẵn ở `public/mockServiceWorker.js` do MSW sinh). `prettier --check .`: sạch.
- Ảnh chụp lại (dữ liệu giả, VI + EN, 7 màn mỗi bản, không commit): `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/shots/`. `01-banner` nay là banner gộp.

## Điểm UXD khen – giữ

Kiểm ở client trước S2, đóng hộp khi gặp hộp thư chung, bộ câu `saved` / `saved_first` / `removed`, neo `#security-email` không mang dữ liệu: giữ nguyên.

---

## Lượt 2 – 03/11/2026 (trả lời "Lượt 2" của `reviews/UXD-on-v1.0.3-email-desk.md`)

Kết luận UXD lượt 2: ĐẠT. Các thẻ còn mở được sửa luôn trong PR-1, cùng commit với thẻ ARC FB-R4-ARC-FE-31-03 (xem `responses/FE-on-ARC-PR31.md`).

| Thẻ | Mức | Trạng thái | Sửa |
|---|---|---|---|
| EM-07 (mở lại) | Minor | **Done** | Bỏ `style={{ margin: 0 }}` ở dòng `reauth.s2_help*` trong `StrongReauthDialog`. Dòng này nay cách khối phía trên 12px nhờ `.stack` (`p{margin:0 0 8px}` gộp với `margin-top:12px` thành 12px). Sửa một dòng nên cả 9 hộp S2 đều đúng. Ảnh `r2-01..03`. |
| EM-13 | Minor | **Done** | Thêm vào `app.css` 2 luật UXD ghi trong thẻ: nút tắt có nền và viền `transparent`; chỉ gạch chân khi hover với nút **không** tắt. Màu muted và con trỏ `not-allowed` giữ theo `.btn[disabled]` của DS. Đo trong trình duyệt khi mất mạng: nền `rgba(0,0,0,0)`, viền trong suốt, hover không gạch chân, con trỏ `not-allowed`. Test mới: mất mạng thì "Sửa email" tắt, có mạng lại thì bật. Ảnh `r2-04`. |
| EM-14 | Suggestion | **Done** | Nhánh `missingFactor` luôn đưa focus về ô mật khẩu, vì đó là ô đầu tiên vừa bị xóa, giống nhánh `REAUTH_FAILED`. Dấu "Bắt buộc" vẫn ở ô server nêu. Test `reauth.totpCode` thêm assert: ô mật khẩu có focus. |
| EM-15 | Suggestion | **Done** | `secmail.status_set` đã vào `KEYS` của test chuỗi. Sửa 3 ghi chú khóa theo mã hiện tại: `users.email_self` (chỉ link, không nút), `users.email_other_owner` (chỉ câu muted, không nút), `secmail.purpose` ("thông báo bảo mật"). Tiêu đề nhóm đổi thành "UXD đã duyệt (lượt 2, 03/11/2026)", phần CPY để CPY tự ghi. Chú thích test đổi thành "thông báo bảo mật". Đã chạy lại generator: 3399 chuỗi, JSON không đổi, `strings-tables.md` cập nhật ghi chú. JSDoc `StrongReauthDialog` bỏ `[CHỜ UXD]` và ghi bố cục UXD đã chốt (children → dòng xác thực → banner lỗi → Mật khẩu → Mã, cách nhau 12px, modal `sm`). |

### Ảnh dữ liệu giả lượt 2

Không commit ảnh. Thư mục: `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/shots/`. Mỗi màn có bản VI và EN, khổ 1280×860. Tài khoản OWN đã bật 2FA nên có ô mã.

- `{vi,en}-r2-01-s2-save-email.png`: hộp Lưu email nhận thông báo bảo mật.
- `{vi,en}-r2-02-s2-regen-codes.png`: hộp Tạo bộ mã mới.
- `{vi,en}-r2-03-s2-cancel-receiving.png`: hộp Hủy tài khoản nhận đã lên lịch (có ô lý do). Tài khoản thử, chỉ hiện 4 số cuối.
- `{vi,en}-r2-04-users-offline.png`: bảng Người dùng & vai khi mất mạng.

Ghi nhận ngoài phạm vi, không sửa: trong hộp Hủy lịch, dòng tài khoản hiện "Vietcombank•••• 8888", không có khoảng cách giữa tên ngân hàng và dấu chấm. Dòng này là `AccountLine` có sẵn từ R3-Q51. Đề nghị UXD xem có cần thêm khoảng cách không.
