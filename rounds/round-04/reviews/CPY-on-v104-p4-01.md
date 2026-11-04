# CPY review chữ v1.0.4 P4-01 (`v104/uxd-strings`)

- Người review: CPY | Round 4 – v1.0.4 – bước **Review** (review chéo câu chữ) | 05/11/2026
- Đối tượng: `origin/v104/uxd-strings` @ `36f38edd`, so với `origin/main` @ `7b5b6117` (merge-base `3320fb33`).
  - Nguồn: `product/design/tools/gen_strings.py` (3 nhóm mới: "v1.0.4 P4-01 – UXD lượt 1", "v1.0.4 P4-50", "v1.0.4 PR24PM-01 – guest-web"; 3 khóa sửa tại chỗ; 1 khóa xóa).
  - Tệp sinh: `product/design/copy/strings-{en,vi,ru}.json`, `product/design/wireframes/assets/strings.js`, `product/design/tools/strings-tables.md`.
- Đã đọc thêm:
  - `product/docs/business-rules.md` BR-214, BR-302, BR-303, BR-308 và bảng tham số (`hold_latest_time_on_arrival`);
  - chữ đang chạy liên quan: `debt.collect`, `debt.write_off`, `ci.shortfall_accepted`, `reauth.s2_failed`, `error.REAUTH_FAILED`, `error.HOLD_EXPIRED`, `drawer.hold.expired`, `attn.*`, `common.retry`, `common.error_network_body`, `checkout.step.bill`, `drawer.action.early_departure`;
  - chữ landing cùng mã lỗi: `product/apps/landing-web/src/scripts/booking-strings/{en,vi,ru}.ts` khóa `idNumber`;
  - `product/apps/guest-web/src/app/i18n.tsx` (guest-web chỉ có VI / EN / RU, nên không cần KO / ZH cho `error.ID_NUMBER_DETECTED`);
  - `origin/v104/mob-2fa`: `product/apps/mobile/src/pages/LoginPage.tsx`, `src/__tests__/v104-mfa-signin.test.tsx`.
- Brand: `00-brief/context/brand/brand-guidelines.md`. Chữ cho khách: ngắn, lịch sự, điềm tĩnh, EN dẫn, VI hỗ trợ, không emoji. Chữ Desk / app nhân viên: tiếng Việt rõ ràng, nói việc cần làm.
- Không sửa mã, không sửa decision-log. Tệp này không có dữ liệu khách.

---

## 0. Kết luận

**ĐẠT.** Không có Blocker, không có Major. Có 5 Minor và 5 Suggestion.

Đã kiểm:
- Phạm vi đúng: 30 khóa mới ở EN và VI, 1 khóa mới ở RU (`error.ID_NUMBER_DETECTED`). Sửa chữ 3 khóa (`error.FOLIO_LOCKED`, `early_departure.row_refund_help`, `early_departure.lease_rule_paid`). Xóa 1 khóa (`auth.mfa_later`). JSON sinh khớp nguồn `gen_strings.py`. Bảng `strings-tables.md` khớp.
- Quét máy trên mọi chuỗi mới hoặc đổi:
  - 0 emoji, 0 dấu "!";
  - 0 chữ IN HOA để nhấn (chữ hoa duy nhất là tên "OTTIMO");
  - "Vui lòng" chỉ có ở chuỗi cho khách (`error.ID_NUMBER_DETECTED`), không có ở chuỗi nhân viên.
- 0 từ cấm (small hotel, homestay, giá rẻ, phụ thu, phí phát sinh, apartment / căn hộ / апартаменты…) trong các chuỗi mới.
- Ngoài phạm vi diff, thấy khi đọc `strings-ru.json`: 7 chuỗi RU cho khách trên main dùng "апартаменты": `guest.stay.checkin_time`, `guest.oci.done_body`, `gw.room`, `sale.quote_text`, `msg.booking_confirmed`, `msg.deposit_received`, `msg.hot_water_issue`. Đây là từ cấm RU theo `rounds/round-04/outputs/CPY/lp-v2-copy.md`. Không mở thẻ ở đây vì không thuộc P4-01. CPY đề nghị ORC đưa vào một lượt chữ RU riêng (CPY viết lại, người bản xứ đọc).
- Thuật ngữ khớp chữ đang chạy:
  - Giữ chỗ / Hold; cọc thiếu / short deposit (khớp `ci.shortfall_accepted`);
  - Thu công nợ / Collect debt, Xóa công nợ / Write off debt (khớp `debt.*`);
  - Trả sớm / Early departure (khớp `drawer.action.early_departure`);
  - xác thực 2 bước / 2-step verification (22 chỗ dùng cùng chữ);
  - Thử lại / Try again (khớp `common.retry`).
  - Mẫu `attn.*` "Nhãn: {n} – việc cần làm" giữ đúng như các mục Cần chú ý khác.
- Đúng nghiệp vụ:
  - Ba lối ra của giữ chỗ có cọc một phần (thu nốt, quản lý chấp nhận cọc thiếu, hủy và hoàn 100 %, không phí) khớp BR-303 (3) và BR-308.
  - "Không tự hủy khi quá trần" khớp BR-303.
  - Câu `lease_rule_paid` mới khớp BR-214: có thêm minibar / dọn lẻ chưa thu.
  - Câu `FOLIO_LOCKED` mới bỏ được vế sai "quản lý ghi được bút toán điều chỉnh".
- Số ít / số nhiều: các nhãn đếm dùng dạng "Nhãn: {n}" hoặc "({n})", không ghép số với danh từ đếm. Khi count = 1 đã có khóa `_one` riêng. Đạt.
- Chữ nhân viên ngắn và nói việc cần làm, đúng hướng dẫn trong nguồn: không "Vui lòng", không "!". Chữ thông báo PWA không có số tiền, không có tên khách. Câu audit không nhắc số tài khoản. Đạt về giọng và về dữ liệu.

Các thẻ Minor nên làm luôn trong lượt UXD tiếp theo vì sửa rẻ. Riêng thẻ 03 là việc thứ tự gộp nhánh, ORC chốt.

---

## 1. Thẻ feedback

### FB-R4-CPY-UXD-P401-01
- Mức độ: Minor
- Vị trí: `gen_strings.py` nhóm "v1.0.4 P4-01", khóa `users.reset_2fa_confirm` (EN + VI)
- Vấn đề:
  - Câu mặc định người bị đặt lại luôn có **điện thoại mới**: "trên điện thoại mới" / "on their new phone". Nhưng chính ô lý do bên dưới đưa nhiều tình huống khác (mất điện thoại, xóa nhầm ứng dụng, đổi ứng dụng xác thực). Khi đó câu không đúng.
  - EN dùng thì hiện tại cho việc sẽ xảy ra sau khi bấm: "They are signed out… At next sign-in, they add…". Đọc như đã xảy ra. Thiếu "their" trước "next sign-in".
- Vì sao quan trọng: đây là câu xác nhận trước một thao tác bảo mật không đảo ngược được. OWN cần hiểu đúng hậu quả trước khi bấm.
- Đề xuất sửa:
  - VI: "Đặt lại xác thực 2 bước cho {name}? Người này sẽ bị đăng xuất trên mọi máy và mã khôi phục cũ hết hiệu lực. Ở lần đăng nhập tới, người này thêm lại OTTIMO vào ứng dụng xác thực trên điện thoại."
  - EN: "Reset 2-step verification for {name}? They will be signed out on every device and their old recovery codes will stop working. At their next sign-in, they will add OTTIMO to the authenticator app on their phone again."
- Trạng thái: Open

### FB-R4-CPY-UXD-P401-02
- Mức độ: Minor
- Vị trí:
  - `hold.paid_overdue_banner`: "Mốc xử lý: 12:00 {date}" / "Deadline to decide: 12:00 on {date}";
  - `staff.notif.k.hold_overdue_cap`: "sau 12:00 ngày đến" / "after 12:00 on arrival day".
- Vấn đề:
  - Hai câu ghi cứng "12:00". Đây là giá trị mặc định của tham số `hold_latest_time_on_arrival` (BR-302, bảng tham số).
  - Hai câu cùng nhóm `attn.hold_overdue_cap` và `attn.hold_overdue_cap_one` lại lấy giờ từ `{time}`. Cùng một mốc, chữ chỗ lấy tham số, chỗ ghi cứng.
  - Nguyên tắc CPY: lời hứa thời gian lấy theo tham số đang chạy, không ghi cứng.
- Vì sao quan trọng:
  - BR-302 v0.4.6 giữ 12:00, nên hôm nay câu vẫn đúng.
  - Nếu tham số đổi (ví dụ đổi theo `checkin_time`), băng đỏ trên đơn và thông báo cho quản lý sẽ báo sai mốc. Đây là mốc dùng để quyết tiền cọc của khách.
- Đề xuất sửa:
  - Banner: thêm biến `{cutoff}` (FE-B lấy từ tham số, như `attn.hold_overdue_cap` lấy `dueAt`): "Mốc xử lý: {cutoff} {date}." / "Deadline to decide: {cutoff} on {date}."
  - Thông báo PWA: payload chỉ có refCode nên không truyền được giờ. Bỏ giờ khỏi câu:
    - VI: "Giữ chỗ còn chờ cọc sau mốc giờ ngày đến – quản lý quyết";
    - EN: "A hold is still awaiting deposit past the arrival-day cutoff – manager to decide".
  - Nếu ARC/BE xác nhận tham số này khóa cứng ở 12:00 (không cho đổi trong Cài đặt), giữ chữ hiện tại. Ghi lý do vào cột Ghi chú để lượt sau không hỏi lại.
- Trạng thái: Open

### FB-R4-CPY-UXD-P401-03
- Mức độ: Minor (thứ tự gộp nhánh, ORC chốt)
- Vị trí: khóa bị xóa `auth.mfa_later`. Chỗ còn dùng: `product/apps/mobile/src/pages/LoginPage.tsx` dòng 49 trên chính `v104/uxd-strings` (và trên main). Test `origin/v104/mob-2fa`: `src/__tests__/v104-mfa-signin.test.tsx` dòng 57 gọi `tv('auth.mfa_later')`.
- Vấn đề:
  - Việc xóa chữ là đúng: câu "Ask the owner for help signing in" đã lỗi thời từ khi có 2 bước.
  - Nhưng nếu `v104/uxd-strings` gộp trước `v104/mob-2fa`, app nhân viên gặp `MFA_REQUIRED` sẽ hiện tên khóa thô "auth.mfa_later" ngay sau câu lỗi.
  - Ngoài ra, khi khóa đã mất, test `not.toContain(tv('auth.mfa_later'))` của MOB có thể đúng một cách vô nghĩa (so với tên khóa, không so với câu).
- Vì sao quan trọng: nhân viên thấy chữ kỹ thuật ở màn đăng nhập. Đây là lỗi hiển thị dễ gặp nhất khi 2 nhánh đi lệch nhau.
- Đề xuất sửa:
  - ORC gộp `v104/mob-2fa` cùng lúc hoặc trước `v104/uxd-strings`. Ghi thứ tự này vào checklist gộp v1.0.4.
  - MOB đổi assert sang chữ cố định của câu cũ ("Two-step sign-in comes in a later release") hoặc kiểm `LoginPage.tsx` không còn gọi khóa đó.
- Trạng thái: Open

### FB-R4-CPY-UXD-P401-04
- Mức độ: Minor
- Vị trí:
  - `early_departure.lease_rule_paid` (đã sửa);
  - `early_departure.lease_still_due` (không sửa, cùng Alert ở bước ②).
- Vấn đề:
  - Câu mới viết "trừ điện nước, phát sinh chưa thu (minibar, dọn lẻ) và hư hỏng" / "deduct utilities, unpaid extras (minibar, extra cleaning) and damage". Câu nhánh 2 ngay dưới vẫn dùng chữ cũ "điện nước, dọn lẻ, hư hỏng còn nợ" / "Unpaid utilities, extra cleaning and damage". Một Alert mà hai cách gọi cùng nhóm khoản.
  - EN bỏ chữ "unpaid" trước "utilities". Đọc như trừ **toàn bộ** tiền điện nước. BR-214 chỉ trừ **điện nước kỳ cuối**.
- Vì sao quan trọng: lễ tân đọc to cho khách thuê tháng nghe. Nếu nói "trừ tiền điện nước" chung chung, khách dễ hỏi lại về các kỳ đã trả.
- Đề xuất sửa:
  - `lease_rule_paid`:
    - VI: "…trừ điện nước kỳ cuối, phát sinh chưa thu (minibar, dọn lẻ) và hư hỏng, hoàn phần còn lại trong 7 ngày làm việc…";
    - EN: "…deduct the final utilities, unpaid extras (minibar, extra cleaning) and damage, then refund the rest within 7 working days…".
  - `lease_still_due`, cùng cách gọi:
    - VI: "Vẫn thu điện nước kỳ cuối, phát sinh chưa thu (minibar, dọn lẻ) và hư hỏng, không trừ vào ký quỹ. …";
    - EN: "The final utilities, unpaid extras (minibar, extra cleaning) and damage are still collected, not taken from the deposit. …".
  - DOM xác nhận nghĩa (BR-214, BR-313) trước khi áp.
- Trạng thái: Open

### FB-R4-CPY-UXD-P401-05
- Mức độ: Minor
- Vị trí: `error.ID_NUMBER_DETECTED` (guest-web: ô ghi chú yêu cầu, ô ghi chú lúc đến) – EN, VI, RU
- Vấn đề:
  - Lời mời cuối câu lệch nhau giữa các ngôn ngữ: EN "try again", VI "gửi lại", RU "отправьте снова" (gửi lại). Bản gốc EN nên khớp hành động trên nút (Gửi / Send), như VI và RU.
  - EN mở bằng mảnh câu "No need to…". Mảnh câu dùng được ở landing (`idNumber`), nhưng ở trang khách đang lưu trú thì câu đủ chủ ngữ nghe điềm tĩnh và lịch sự hơn.
  - EN dùng số nhiều "ID numbers" rồi số ít "the number". Bộ phát hiện có thể bắt một số không phải giấy tờ, nên dùng số ít, trung tính.
  - RU không có "Пожалуйста" trong khi EN và VI có "Please" / "Vui lòng". Mức lịch sự lệch nhau. Chữ landing RU cùng mã có "Пожалуйста".
- Vì sao quan trọng: đây là chuỗi **duy nhất cho khách** trong lượt này. Khách đọc nó ngay sau khi bị chặn gửi, lúc dễ khó chịu nhất.
- Đề xuất sửa (giữ ý SEC: không cần số giấy tờ, xóa rồi gửi lại, không nhắc lại chữ khách đã viết):
  - EN: "There's no need to include an ID number here. Please remove it and send again."
  - VI: "Không cần ghi số giấy tờ ở đây. Vui lòng xóa số đó rồi gửi lại." (đổi "gửi" thành "ghi" cho khớp `gw.req.note_help` "Không ghi số giấy tờ…")
  - RU: "Номер документа здесь указывать не нужно. Пожалуйста, удалите его и отправьте снова."
  - SEC xem lại nghĩa sau khi đổi (chuỗi do SEC viết gốc).
- Trạng thái: Open

### FB-R4-CPY-UXD-P401-06
- Mức độ: Suggestion
- Vị trí: `attn.hold_overdue`
- Vấn đề:
  - EN "Holds past their deadline: {n} – oldest since {time} on {date}, needs action": chủ ngữ số nhiều nhưng động từ số ít.
  - VI "cũ nhất từ" nghe như tuổi của đơn, không phải hạn. `attn.registration_due` đang dùng "hạn sớm nhất".
- Đề xuất sửa:
  - VI: "Giữ chỗ quá hạn: {n} đơn – sớm nhất từ {time} {date}, cần xử lý";
  - EN: "Holds past their deadline: {n} – earliest since {time} on {date}, action needed".
- Trạng thái: Open

### FB-R4-CPY-UXD-P401-07
- Mức độ: Suggestion
- Vị trí: `reauth.s2_failed_password`
- Vấn đề: EN "The password isn't right." Hai câu cùng họ đang viết "That password isn't right." (`error.REAUTH_FAILED`) và "The password or code isn't right." (`reauth.s2_failed`). Chỉ câu thứ hai có lý do dùng "The".
- Đề xuất sửa: EN "That password isn't right. Check it and try again." VI giữ nguyên.
- Trạng thái: Open

### FB-R4-CPY-UXD-P401-08
- Mức độ: Suggestion
- Vị trí:
  - `error.FOLIO_LOCKED` (EN);
  - `early_departure.row_refund_help` (EN).
- Vấn đề:
  - FOLIO_LOCKED: "For an amount still owed, use Collect debt, or a manager can Write off debt." Hai vế không song song: một vế ra lệnh, một vế kể.
  - row_refund_help: "One refund request for the early departure, which needs a manager's approval." Chữ "which" có thể đọc là "trả sớm cần quản lý duyệt".
- Đề xuất sửa:
  - FOLIO_LOCKED EN: "This folio is locked. No one can add or adjust lines any more, managers included. If an amount is still owed, use Collect debt, or ask a manager to Write off debt."
  - row_refund_help EN: "One refund request for the early departure; a manager must approve it. Check-out won't create it again. If the folio has any other overpayment, the Bill step asks how to handle that part."
  - VI hai khóa giữ nguyên.
- Trạng thái: Open

### FB-R4-CPY-UXD-P401-09
- Mức độ: Suggestion
- Vị trí: `checkout.pending_refund_line` (EN)
- Vấn đề:
  - VI gọi đúng tên chức năng "(yêu cầu từ Trả sớm)". EN viết thường "(requested at early departure)".
  - Câu kế bên `checkout.use_early_departure` viết hoa "Early departure" như tên nút. Cùng một màn, hai cách viết.
- Đề xuất sửa: EN "Refund pending for the guest: {amount} (requested in Early departure)."
- Trạng thái: Open

### FB-R4-CPY-UXD-P401-10
- Mức độ: Suggestion
- Vị trí: `hold.paid_overdue_banner` (EN 256 ký tự, VI 210 ký tự)
- Vấn đề: băng trên khung đơn dài 4 câu. Câu thứ ba ("Thu nốt cọc, nhờ quản lý…, hoặc hủy và hoàn") lặp gần nguyên văn `error.HOLD_EXPIRED_PAID`. Ở 1024 px trong khung đơn, băng có thể chiếm 4–5 dòng.
- Đề xuất sửa: UXD đo trong khung đơn. Nếu quá 3 dòng, rút gọn:
  - VI: "Quá hạn giữ chỗ lúc {time}. Đã nhận {paid}/{required}, căn vẫn giữ. Thu nốt cọc, nhờ quản lý chấp nhận cọc thiếu, hoặc hủy và hoàn trước {cutoff} {date}.";
  - EN: "Hold deadline passed at {time}. {paid} of {required} received, room still held. Collect the rest, ask a manager to accept the short deposit, or cancel and refund by {cutoff} on {date}.".
  - `{cutoff}` theo thẻ 02.
- Trạng thái: Open

---

## 2. Danh sách cho người bản xứ đọc lại

| Khóa | Ngôn ngữ | Rủi ro | Vì sao |
|---|---|---|---|
| `error.ID_NUMBER_DETECTED` | RU | Thấp | Câu ngắn, cấu trúc giống chữ landing đã có. Cần xác nhận "указывать" (ghi) tự nhiên hơn "отправлять" (gửi) ở ô ghi chú, và độ lịch sự khi thêm "Пожалуйста" (thẻ 05) |

Chuỗi Desk / app nhân viên trong lượt này chỉ có VI + EN (RU ⟨chừa chỗ⟩, đúng phạm vi: Desk không có RU). Không có KO / ZH vì guest-web chỉ có VI / EN / RU.

## 3. Cần SEC / luật sư xem

- `error.ID_NUMBER_DETECTED`: chỉ đổi giọng (thẻ 05), giữ nguyên ý SEC. SEC xem lại câu sau khi đổi.
- Không có câu nào trong lượt này đụng thông báo xử lý dữ liệu, ô đồng ý, cọc hay hủy ở phía khách.

## 4. Điểm làm tốt (nên giữ)

1. Sửa đúng ba câu nói sai sự thật trước đây: `FOLIO_LOCKED` ("quản lý ghi được bút toán điều chỉnh"), `row_refund_help` ("không tạo thêm yêu cầu"), `lease_rule_paid` (thiếu phát sinh chưa thu). Cột Ghi chú ghi rõ câu nào bị bỏ và vì sao, khớp BR và release notes đính chính.
2. Chữ thông báo và audit tự giữ an toàn dữ liệu ngay từ câu chữ: không số tiền, không tên khách trên PWA; câu `refund.destination_carried` không nhắc số tài khoản; toast `reset_2fa_done` không hứa có thư.
3. Chữ nhân viên luôn chỉ ra bước tiếp theo bằng đúng tên nút đang có (Thu công nợ, Xóa công nợ, Trả sớm, Thử lại). Câu `staff.mfa_network` báo trước "Mã bạn đã nhập vẫn còn", nên nhân viên không phải nhập lại.

---

## Xác nhận lượt 2 (04/11)

- Đối tượng: `origin/v104/uxd-strings` @ `fd1d85d8`, diff `36f38edd..fd1d85d8`. Trả lời của UXD: `rounds/round-04/responses/UXD-P4-01.md` (trên nhánh).
- Cách kiểm: đọc từng chuỗi trong `product/design/copy/strings-{vi,en,ru}.json` sinh ở `fd1d85d8`, so với lượt 1, đối chiếu `content-guide.md` v0.4.5 mục 2.
  - Quét máy 22 chuỗi EN, 11 chuỗi VI, 1 chuỗi RU đã đổi hoặc mới: 0 emoji, 0 "!", 0 từ cấm.
- Kết luận: **ĐẠT.** Cả 10 thẻ CPY đã đóng. Không còn thẻ Blocker, Major hay Minor nào mở. Mở 1 Suggestion mới (thẻ 11).

### Đối chiếu thẻ CPY 01–10

| ID | UXD trả lời | CPY xác nhận | Ghi chú |
|---|---|---|---|
| FB-R4-CPY-UXD-P401-01 | Done | Closed | Đã bỏ "điện thoại mới". EN đã sang thì tương lai và có "their next sign-in". Tách tiêu đề thành `users.reset_2fa_title` làm câu dẫn gọn hơn đề xuất. Đạt |
| FB-R4-CPY-UXD-P401-02 | Done | Closed | Banner dùng `{cutoff}`, tách khỏi `{time}`. Thông báo PWA bỏ giờ ("sau mốc giờ ngày đến" / "past the arrival-day cutoff"). Luật đã ghi vào content-guide mục 2. FE-B nhớ truyền `cutoff`, nếu không câu sẽ hiện "{cutoff}" thô |
| FB-R4-CPY-UXD-P401-03 | Done (giữ khóa) | Closed | Giữ `auth.mfa_later` thì thứ tự gộp không còn rủi ro. Việc đổi assert test MOB do ORC chuyển cho MOB, không còn là việc chữ |
| FB-R4-CPY-UXD-P401-04 | Done | Closed | `lease_rule_paid` và `lease_still_due` gọi cùng một cách: "điện nước kỳ cuối, phát sinh chưa thu (minibar, dọn lẻ) và hư hỏng" / "the final utilities, unpaid extras (minibar, extra cleaning) and damage". Khớp BR-214. DOM xem nghĩa ở lượt review kế |
| FB-R4-CPY-UXD-P401-05 | Done | Closed | EN "There's no need to include an ID number here. Please remove it and send again." VI "Không cần ghi số giấy tờ ở đây. Vui lòng xóa số đó rồi gửi lại." RU "Номер документа здесь указывать не нужно. Пожалуйста, удалите его и отправьте снова." Đã thêm "Пожалуйста". Cả 3 ngôn ngữ cùng nghĩa "gửi lại" (send again / gửi lại / отправьте снова), cùng mức lịch sự (Please / Vui lòng / Пожалуйста). Còn chờ SEC xem lại câu và người bản ngữ đọc RU (rủi ro thấp) |
| FB-R4-CPY-UXD-P401-06 | Done | Closed | "sớm nhất từ" / "earliest since …, action needed". `_one` cùng nhịp |
| FB-R4-CPY-UXD-P401-07 | Done | Closed | "That password isn't right. Check it and try again." |
| FB-R4-CPY-UXD-P401-08 | Done | Closed | Hai câu EN đúng đề xuất. VI giữ nguyên |
| FB-R4-CPY-UXD-P401-09 | Done | Closed | "(requested in Early departure)" |
| FB-R4-CPY-UXD-P401-10 | Done (chữ khác đề xuất) | Closed | Đồng ý lý do của UXD: banner vẫn hiện sau mốc, nên "trước {cutoff}" sẽ sai. Giữ "Mốc xử lý: {cutoff} {date}." Giữ "nên đơn chưa hủy" là đúng, vì đây là điểm khác với `drawer.hold.expired`. VI ngắn còn 176 ký tự. EN 241 ký tự vẫn dài nhưng chấp nhận được trong Alert bad |

### Khóa mới và khóa đổi ORC nhờ kiểm

| Khóa | Chữ (VI / EN) | CPY |
|---|---|---|
| `staff.mfa_enroll_desk` | "Mở OTTIMO Desk trên máy tính để bật xác thực 2 bước, rồi đăng nhập lại ở đây." / "Open OTTIMO Desk on a computer to turn on 2-step verification, then sign in here again." | Đạt. Một câu, nói việc cần làm, không có địa chỉ Desk, không "Vui lòng" |
| `users.reset_2fa_title` | "Đặt lại xác thực 2 bước cho {name}?" / "Reset 2-step verification for {name}?" | Đạt. Câu hỏi xác nhận ngắn. Thuật ngữ khớp `users.reset_2fa` |
| `rsv.hold_paid_keep` | "Đã nhận {paid}/{required}. Tới hạn mà chưa đủ cọc thì đơn không tự hủy, căn vẫn giữ – thu nốt cọc hoặc nhờ quản lý chấp nhận cọc thiếu." / "{paid} of {required} received. If the deadline passes before the rest is paid, the booking isn't cancelled and the room stays held – collect the rest or ask a manager to accept the short deposit." | Đạt. Khớp BR-303 lối ra (1) và (2). Dùng đúng thuật ngữ "cọc thiếu / short deposit". Không thêm "đ" sau biến tiền (biến đã có đơn vị). Lối (3) hủy và hoàn không có ở đây. Chấp nhận, vì câu này nhắc trước hạn, còn banner sau hạn mới nêu đủ 3 lối |
| `early_departure.lease_end_line` | "HĐ thuê tháng hết hạn {date}." / "The monthly lease ends on {date}." | Đạt. VI "HĐ" là chữ viết tắt nội bộ đã dùng cả nhóm `early_departure.lease_*` |
| "6‑digit" ở 6 chuỗi EN | `auth.totp.help`, `auth.enroll.confirm`, `reauth.s2_help`, `guest.verify.sent_to`, `guest.verify.label`, `ci.door_step1` | Đạt. Kiểm từng mã ký tự: cả 6 chuỗi dùng U+2011. Không còn "6-digit" gạch thường. Hai chuỗi cho khách (`guest.verify.*`) giữ giọng cũ, chỉ đổi ký tự gạch |

### Thẻ mới

### FB-R4-CPY-UXD-P401-11
- Mức độ: Suggestion
- Vị trí: `product/design/content-guide.md` v0.4.5 mục 2 (luật gạch không ngắt). Các chuỗi EN có "2-step" dùng gạch thường, gồm `staff.mfa_enroll_desk`, `users.reset_2fa`, `users.reset_2fa_title`, `users.reset_2fa_done`, `error.MFA_ENROLLMENT_REQUIRED`, `mfa.*`, `auth.enroll.*`. Tổng 24 chuỗi EN có mẫu "số-chữ" với gạch thường.
- Vấn đề:
  - Luật mới viết chung "Cụm số–chữ có gạch nối trong EN … dùng gạch không ngắt U+2011". Nhưng mới chỉ áp cho "6‑digit".
  - "2-step" cũng có thể ngắt thành "2-" / "step" ở khung hẹp (thẻ 362 px của app nhân viên).
  - Luật và chữ đang chạy chưa khớp nhau.
- Vì sao quan trọng: không sai nghĩa và không ảnh hưởng khách. Nhưng nếu để luật rộng hơn chữ thật, lượt sau sẽ có người hỏi lại hoặc sửa lẻ từng chỗ.
- Đề xuất sửa:
  - Không chặn v1.0.4.
  - Ở lượt dọn chữ v1.0.5, chọn một trong hai cách:
    - (a) áp U+2011 cho mọi "2-step", "7-day"… trong EN, bằng một lần thay trong `gen_strings.py`;
    - (b) thu hẹp luật trong content-guide về "chỉ các cụm từng gãy dòng trên màn thật (hiện là 6‑digit)".
  - CPY nghiêng về (a): một lần sửa, khỏi phải nhớ ngoại lệ.
- Trạng thái: Open

### Còn chờ (không phải việc của CPY)
- SEC xem lại câu `error.ID_NUMBER_DETECTED` sau khi CPY/UXD đổi giọng.
- Người bản ngữ RU đọc lại câu này (rủi ro thấp).
- FE-B truyền `{cutoff}` cho `hold.paid_overdue_banner`.
- MOB đổi assert khi xóa `auth.mfa_later` ở P4-50.
- Ngoài phạm vi: 7 chuỗi RU cho khách có "апартаменты" (mục 0). Vẫn đề nghị ORC xếp một lượt chữ RU riêng.
