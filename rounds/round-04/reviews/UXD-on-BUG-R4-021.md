# UXD review – BUG-R4-021: câu thông báo bảo mật tài khoản trên PWA

Round 4 · v1.0.3 · Bước: Review · Nhánh `origin/mob/v1.0.3-notif-text` @ `fa99b116` (diff so với `origin/v1.0.3-email`)
Người review: UXD · Tác giả: MOB · Ngày: 03/11/2026

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

Cách sửa đúng hướng: PWA tự viết câu theo `refCode`, mã nội bộ không còn hiện ở cả dòng chính lẫn dòng phụ, có thêm lớp chặn `INTERNAL_CODE` cho `refType` lạ. Thuật ngữ khớp bộ đã chốt. Câu không có tên, không có địa chỉ, không emoji, không dấu chấm cuối, đúng kiểu `staff.notif.k.*`. Dòng chính là `<b class="d-block">` trong `.grow` và được xuống dòng (không có `nowrap` hay `ellipsis`), nên câu dài 2 dòng ở 375px vẫn đọc trọn.

**Điều kiện trước khi merge:** thay 4 câu theo FB-01 và FB-02 (chỉ sửa nhóm "v1.0.3 BUG-R4-021" trong `gen_strings.py` rồi sinh lại), sửa 2 câu viết cứng trong test, rồi đổi nhãn nhóm từ "Chờ UXD duyệt" sang "UXD duyệt 03/11". Giữ nguyên 2 câu `_self` của đổi email và đặt lại 2FA.

## Kiểm theo yêu cầu

| Tiêu chí | Kết quả |
|---|---|
| Thuật ngữ: "Email nhận thông báo bảo mật" / "Notification email", "xác thực 2 bước" / "2-step verification" | Đạt. Khớp `secmail.title`, `shell.security`, `users.more_help` |
| Giọng OTTIMO: ngắn, điềm tĩnh, không emoji, không dấu chấm cuối | Đạt cho 4 câu đổi email và đặt lại 2FA. 2 câu chung chưa đạt vì nói "thay đổi" cho cả sự kiện không phải thay đổi (FB-02) |
| Không nêu tên người | Đạt. Nhưng "một nhân viên" không đúng khi người bị đổi là chủ đầu tư (FB-01) |
| Hợp dòng thông báo PWA | Đạt. Câu dài nhất (VI) xuống 2 dòng, layout không vỡ |

## Bảng câu sau review

| Khóa | VI | EN | Trạng thái |
|---|---|---|---|
| `staff.notif.sec.email_changed_self` | Email nhận thông báo bảo mật của bạn đã thay đổi | Your notification email was changed | Duyệt, giữ nguyên |
| `staff.notif.sec.email_changed_other` | Email nhận thông báo bảo mật của một tài khoản khác đã thay đổi | Another account's notification email was changed | Thay (FB-01) |
| `staff.notif.sec.mfa_reset_self` | Xác thực 2 bước của bạn đã được đặt lại | Your 2-step verification was reset | Duyệt, giữ nguyên |
| `staff.notif.sec.mfa_reset_other` | Xác thực 2 bước của một tài khoản khác đã được đặt lại | Another account's 2-step verification was reset | Thay (FB-01) |
| `staff.notif.sec.other_self` | Thông báo bảo mật về tài khoản của bạn | Security notice for your account | Thay (FB-02) |
| `staff.notif.sec.other_other` | Thông báo bảo mật về một tài khoản khác | Security notice for another account | Thay (FB-02) |

## Thẻ feedback

### FB-R4-UXD-MOB-021-01
- Mức độ: Minor
- Vị trí: `product/design/tools/gen_strings.py` nhóm "v1.0.3 BUG-R4-021", khóa `staff.notif.sec.email_changed_other`, `staff.notif.sec.mfa_reset_other`
- Vấn đề: Câu `_other` gọi người bị đổi là "một nhân viên" / "a staff member". Nhưng chủ đầu tư cũng nhận câu này về chủ đầu tư khác:
  - `SecurityEmailService` gửi `account_security_change` cho người bị đổi kèm `roles: ['owner']`. Khi một OWN tự đổi email, mọi OWN còn lại nhận câu `_other` về OWN đó.
  - `mfa.reset_by_operator`, `mfa.recovery_code_used` (`owners: true`) có thể nói về một tài khoản OWN.
  - Trong bộ chữ, "nhân viên" và "chủ đầu tư" là hai nhóm khác nhau (ví dụ `users.email_other_owner`). Một chủ đầu tư được gọi là "nhân viên" thì sai vai và kém lịch sự.
- Vì sao quan trọng: Thông báo bảo mật phải đúng sự thật. Chủ đầu tư đọc "một nhân viên" sẽ đi tìm trong danh sách nhân viên trong khi thật ra là đồng chủ đầu tư.
- Đề xuất sửa: Dùng "một tài khoản khác" / "Another account's". Cách này đúng cho mọi vai và vẫn không nêu tên (SR-PWA-06):
  - `email_changed_other`: "Email nhận thông báo bảo mật của một tài khoản khác đã thay đổi" / "Another account's notification email was changed"
  - `mfa_reset_other`: "Xác thực 2 bước của một tài khoản khác đã được đặt lại" / "Another account's 2-step verification was reset"
  - Sửa 2 câu viết cứng ở `v103-notif-text.test.tsx` dòng 64 và 67. Đổi tên ca test dòng 48 từ "a staff member" sang "another account".
- Trạng thái: Open

### FB-R4-UXD-MOB-021-02
- Mức độ: Minor
- Vị trí: khóa `staff.notif.sec.other_self`, `staff.notif.sec.other_other`
- Vấn đề: Câu chung nói "có thay đổi bảo mật" / "There was a security change", nhưng phần lớn mã rơi vào câu này là cảnh báo, không phải thay đổi:
  - `mfa.locked` và `stepup.s2_failed` (`security_alert`): bị khóa vì nhập sai;
  - `mfa.recovery_code_used`: vừa dùng mã khôi phục;
  - `security_alert` từ `frontdesk.controller` `onLocked`: không có `refCode`, được gửi cho người bị khóa, người gọi (FD) và OWN.
  - EN "There was a security change on a staff member's account" có 9 từ và mở đầu bằng "There was", dài và yếu hơn các dòng `staff.notif.k.*`.
- Vì sao quan trọng: Người nhận cảnh báo khóa tài khoản lại đọc thành "có thay đổi", dễ tưởng là việc bình thường. Câu chung phải đúng cho mọi mã, kể cả mã BE thêm sau này.
- Đề xuất sửa: Dùng danh từ trung tính "Thông báo bảo mật" / "Security notice". Câu này đúng cho cả thay đổi lẫn cảnh báo, giọng điềm tĩnh, không gây hoảng:
  - `other_self`: "Thông báo bảo mật về tài khoản của bạn" / "Security notice for your account"
  - `other_other`: "Thông báo bảo mật về một tài khoản khác" / "Security notice for another account"
  - Ghi chú khóa trong `gen_strings.py`: thêm `mfa.recovery_code_used`, `mfa.recovery_codes_regenerated` và `security_alert` không có `refCode` vào danh sách mã dùng câu chung.
- Trạng thái: Open

### FB-R4-UXD-MOB-021-03
- Mức độ: Suggestion (v1.0.4)
- Vị trí: `USER_EVENT_KEYS` trong `product/apps/mobile/src/app/notifications.tsx`
- Vấn đề: 5 mã `mfa.disabled`, `mfa.recovery_code_used`, `mfa.recovery_codes_regenerated`, `mfa.locked`, `stepup.s2_failed` dùng câu chung.
- Vì sao quan trọng: **Chấp nhận cho v1.0.3**, với điều kiện câu chung được đổi theo FB-02. Lý do:
  - không lộ mã;
  - câu đúng sự thật;
  - chi tiết đã có ở Desk (mục cần chú ý `security_alert` của OWN) và trong email bảo mật;
  - lỗi gốc chỉ là P3.

  Riêng OWN sẽ được lợi nếu biết ngay đó là khóa tài khoản hay dùng mã khôi phục.
- Đề xuất sửa: Ở v1.0.4, UXD viết câu riêng ít nhất cho `mfa.locked` / `stepup.s2_failed` (gom chung thành "tài khoản bị khóa tạm") và `mfa.recovery_code_used`, mỗi câu có `_self` và `_other`. `mfa.disabled` và `mfa.recovery_codes_regenerated` do chính người dùng làm nên giữ câu chung. Đưa vào backlog v1.0.4, không chặn bản này.
- Trạng thái: Open

## Việc của UXD sau khi merge
- Dán bảng 6 câu đã duyệt vào `product/design/content-guide.md` (mục thông báo PWA). Ghi dòng quyết định vào `decision-log.md`: "Câu thông báo bảo mật PWA dùng 'một tài khoản khác' và 'Thông báo bảo mật' cho câu chung".

## Điểm làm tốt
- Có 2 lớp chặn mã nội bộ: theo `refType = user` và theo dạng mã `a.b_c`. Mã BE thêm sau này cũng không lộ ra.
- Mọi mã chưa biết đều rơi về câu chung, không rơi về câu sai. Khóa viết nguyên văn, hợp với `used-keys.ts`.
- Chuỗi được sinh từ `gen_strings.py` kèm ghi chú ngữ cảnh từng khóa. UXD duyệt nhanh, không phải đọc mã.
