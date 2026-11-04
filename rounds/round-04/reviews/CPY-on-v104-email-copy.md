# CPY review chữ 5 mẫu thư bảo mật – P4-05 (`v104/int-email`)

- Người review: CPY | Round 4 – v1.0.4 – bước **Review** | 05/11/2026
- Đối tượng: `product/integrations/notification/email-templates.ts` trên `origin/v104/int-email` @ `51991057`; báo cáo `rounds/round-04/outputs/INT/v1.0.4-int-email.md`.
- Đã đọc thêm:
  - `rounds/round-04/reviews/CPY-on-v1.0.3-email-changed.md` (lượt 2, "Ghi chú cho v1.0.4");
  - `rounds/round-04/reviews/INT-on-PR31-dispatcher.md` thẻ FB-R4-INT-CPY-31-06;
  - chữ Desk trong `product/design/tools/gen_strings.py` (`rcv.*`, `auth.*`, `mfa.*`, `error.*`);
  - nơi gửi thư `receiving_account_changed`: `services/api/src/modules/platform/internal/platform.controller.ts` dòng 323, 373, 425–456 và `jobs/email-dispatch.ts` dòng 285–305 (cùng commit).
- Brand: `00-brief/context/brand/brand-guidelines.md`. Ngắn, lịch sự, điềm tĩnh, EN dẫn, VI hỗ trợ, không emoji.
- Không sửa mã, không commit. Không có địa chỉ email thật hay dữ liệu khách trong tệp này.

---

## 0. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN.**

| Điểm ORC hỏi | CPY chốt |
|---|---|
| 1. Chân thư "security notices" cho cả 5 mẫu | **Đúng, giữ.** Cả 5 thư đều cảnh báo an toàn tài khoản hoặc đường tiền. Để câu đúng tuyệt đối, đổi tiêu đề `receiving_account_changed` sang "Security notice: …" (thẻ 02). Nhân lượt thuật ngữ, đổi "sign-in codes" thành "any code" (thẻ 03) |
| 2. Dòng "Time:" / "Thời điểm:" | **Đạt, giữ nguyên chữ.** Dòng riêng, không lồng ngoặc, không có `occurredAt` thì không có dòng, đứng sau câu chính và trước câu hành động ở cả 5 mẫu |
| 3. `receiving_account_changed` "from {date}" → "effective {date}" | **Có đổi, nhưng câu INT đề xuất chưa đủ.** Mã gửi **cùng một thư** khi đặt lịch đổi tài khoản và khi **hủy** lịch đổi (`action: 'set' \| 'cancel'`, payload không mang `action`). Câu nào nói "was changed" cũng sai khi lịch bị hủy. Cần 2 câu theo `change`, cộng một câu trung tính dự phòng (thẻ 01, **Major**) |
| 4. FB-R4-INT-CPY-31-06 (thuật ngữ theo Desk) | **Có, vào v1.0.4, trong P4-05, cùng PR.** Đổi một lượt cho cả 5 mẫu, không đổi lẻ. Nếu không kịp lượt gộp P4-05 + P4-06 thì dời **cả lượt** sang v1.0.5, trừ thẻ 01 (thẻ 03) |

Điều kiện để ĐẠT: sửa thẻ 01 trước khi gộp PR. Thẻ 02 và 03 làm cùng PR nếu kịp, theo luật "cả lượt hoặc không" ở trên.

---

## 1. Điểm 1: chân thư chung

Chữ đang có:
- EN: "OTTIMO security notices never contain links and never ask for your password or sign-in codes."
- VI: "Thư bảo mật của OTTIMO không bao giờ có đường liên kết và không bao giờ hỏi mật khẩu hay mã đăng nhập."

Đánh giá:
- **"security notices" dùng được cho cả 5 mẫu.** `receiving_account_changed` là cảnh báo về đường tiền (SEC Q51-6), và chính là loại thư kẻ gian thích giả nhất ("tài khoản nhận đã đổi, chuyển vào số mới"). Nếu đổi chân thư thành "OTTIMO notices…" thì câu rộng hơn mức ta bảo đảm được: thư gửi khách (báo giá, xác nhận) sau này có thể có link.
- Chỗ lệch duy nhất: tiêu đề mẫu này là "Notice:", không phải "Security notice:". Người đọc có thể tự hỏi thư này có thuộc "security notices" không. Cách sửa là đổi tiêu đề (thẻ 02), không đổi chân thư.
- Không có thẻ 02 thì chân thư vẫn chấp nhận được (không sai sự thật: thư này cũng không có link).
- Chữ "sign-in codes" / "mã đăng nhập" đổi trong lượt thuật ngữ (thẻ 03). Desk gọi mã 2 bước là "mã xác thực", và kẻ gian hay hỏi **mã khôi phục**. "any code" / "bất kỳ mã nào" phủ cả hai.
- Đặt một lần ở chân thư, cỡ 12 px, màu Stone Grey: đúng brand và đúng quyết định phương án A. Đã bỏ câu trùng ở thân thư.

## 2. Điểm 2: dòng thời gian

- "Time: 03/11/2026 10:15 (GMT+7)" / "Thời điểm: 03/11/2026 10:15 (GMT+7)": **đạt.**
  - "Time:" ngắn, trung tính. Không dùng "When:" (giọng chat) hay "Date and time:" (dài, vì giá trị đã có cả ngày).
  - "Thời điểm:" đúng nghĩa và tự nhiên hơn "Thời gian:" (dễ hiểu là khoảng thời gian).
- Thứ tự câu chính, rồi dòng giờ, rồi câu hành động là đúng: người đọc biết chuyện gì, lúc nào, rồi mới biết làm gì.
- Ở `receiving_account_changed`, thư có cả ngày hiệu lực lẫn dòng giờ. Câu mới ở thẻ 01 nói rõ "effective from" / "có hiệu lực từ", nên dòng "Time:" chỉ còn một nghĩa: lúc thao tác được lưu. Không cần nhãn riêng.

## 3. Điểm 3: câu ngày của `receiving_account_changed`

Xem thẻ 01 với chữ cuối cùng. Tóm tắt:
- "was changed from {date}" mơ hồ ("đổi **từ** giá trị/ngày cũ"). Ngày này là ngày **có hiệu lực trong tương lai**: Desk bắt chọn từ ngày kinh doanh kế tiếp (`rcv.effective_help`), và Desk gọi nó là "Effective from" / "Hiệu lực từ" (`rcv.review_effective`).
- Đề xuất của INT ("…was changed, effective {date}." / "…áp dụng từ ngày {date}") sửa được chỗ mơ hồ, nhưng vẫn sai với nhánh **hủy lịch**.
- Thư phải dùng đúng chữ của Desk: "có hiệu lực từ", không dùng "áp dụng từ".

## 4. Điểm 4: thẻ FB-R4-INT-CPY-31-06

**Đưa vào v1.0.4**, lý do:
- P4-05 đã mở cả 5 mẫu để đổi bố cục và chân thư. Đổi thuật ngữ trong cùng lượt thì một lần review CPY + SEC và một lần sửa test là xong. Để sang v1.0.5 thì phải mở lại cả 5 mẫu.
- Người nhận đọc thư rồi tự mở Desk để làm theo. Thư ghi "đăng nhập 2 bước", "chủ cơ sở" mà Desk ghi "Xác thực 2 bước", "Chủ đầu tư" thì thư bảo mật trông như thư giả. Đó đúng là điều chân thư đang dạy người đọc cảnh giác.
- Chỉ đổi chữ, không đổi tham số, không đổi luồng.

Phạm vi và chữ cuối cùng: thẻ 03. Kèm hai việc ngoài tệp mẫu (mục 6).

---

## 5. Thẻ feedback

### FB-R4-CPY-INT-104-01
- Mức độ: **Major**
- Vị trí: `email-templates.ts` `copyFor` nhánh `receiving_account_changed`; `platform.controller.ts` `receivingAccountChanged(tx, effectiveFrom, action)` (gọi với `'set'` ở dòng 323, `'cancel'` ở dòng 373); `email-dispatch.ts` dòng 301–302.
- Vấn đề:
  - Khi chủ đầu tư **hủy** lịch đổi tài khoản nhận, outbox vẫn gửi mẫu `receiving_account_changed` với `effectiveDate` của lịch đã hủy. Payload không mang `action`. Thư nói "The bank account that receives deposits was changed from {date}." Câu này sai: tài khoản không đổi.
  - Câu INT đề xuất ("was changed, effective {date}") vẫn sai ở nhánh này.
  - Thêm hai chỗ lệch với Desk:
    - Desk gọi là "tài khoản nhận chuyển khoản" / "Receiving account" (`rcv.title`). Tài khoản này nhận **mọi** chuyển khoản VietQR (`rcv.lead`), không chỉ tiền cọc, nên "receives deposits" / "nhận cọc" hẹp hơn sự thật.
    - Câu hành động lặp "review it … review it".
- Vì sao quan trọng:
  - Đây là thư về đường tiền. Chủ đầu tư nhận "đã đổi, có hiệu lực từ 08/11" ngay sau khi chính mình **hủy** một lịch đổi lạ. Họ sẽ nghĩ việc hủy không thành, hoặc có người đặt lại.
  - Ngược lại, một thư thật về lịch bị đặt bởi kẻ chiếm phiên lại trông giống hệt thư báo hủy.
  - Thư bảo mật mà sai sự thật một lần thì những lần sau người đọc bỏ qua.
- Đề xuất sửa:
  - **BE** thêm `action` vào payload outbox (`'set' | 'cancel'`). Bản đồ chủ tệp v1.0.4 không ghi chủ của `platform.controller.ts`. Plan mục 4.2 xếp tệp này vào nhóm LP-v2 có sửa, nên đây là việc giai đoạn B, sau `main@L`. ORC giao người làm.
  - **BE-A** (`email-dispatch.ts`, P4-06) chuyển thành tham số mẫu `change` (`'set' | 'cancel'`). Giá trị khác thì bỏ.
  - **INT** dùng chữ dưới đây. Thiếu `change` hoặc thiếu ngày thì dùng câu trung tính, đúng cho cả hai nhánh. Nhờ vậy thứ tự deploy BE/INT không bao giờ làm thư sai.

  | Trường hợp | EN | VI |
  |---|---|---|
  | Tiêu đề | Security notice: receiving account update | Thông báo bảo mật: cập nhật tài khoản nhận chuyển khoản |
  | `change = set`, có ngày | A new receiving bank account was set, effective from {date}. | Tài khoản ngân hàng nhận chuyển khoản mới đã được đặt, có hiệu lực từ ngày {date}. |
  | `change = cancel`, có ngày | The receiving bank account change scheduled for {date} was cancelled. | Lịch đổi tài khoản ngân hàng nhận chuyển khoản từ ngày {date} đã được hủy. |
  | Thiếu `change`, có ngày | The receiving bank account schedule for {date} was updated. | Lịch tài khoản ngân hàng nhận chuyển khoản ngày {date} vừa được cập nhật. |
  | Thiếu ngày (mọi `change`) | The receiving bank account settings were updated. | Thiết lập tài khoản ngân hàng nhận chuyển khoản vừa được cập nhật. |
  | Dòng giờ | Time: {occurredAt} (giữ) | Thời điểm: {occurredAt} (giữ) |
  | Câu hành động (mọi nhánh) | Open OTTIMO Desk as usual and check the receiving account. If you did not expect this, do it today. | Hãy mở OTTIMO Desk như thường lệ và kiểm tra tài khoản nhận. Nếu bạn không được báo trước, hãy làm ngay trong hôm nay. |

  - Tiêu đề trung tính ("update" / "cập nhật") vì tiêu đề không biết nhánh, và phải đúng cả khi hủy. Tiền tố "Security notice:" xử lý luôn thẻ 02.
  - Giữ "as usual" / "như thường lệ": câu này nhắc người đọc tự mở Desk, không bấm gì trong thư.
  - Thư chỉ gửi chủ đầu tư (`owners: true`), và chỉ chủ đầu tư xem được khối tài khoản nhận (`rcv.lead`), nên "kiểm tra tài khoản nhận" làm được.
  - Test đề xuất (INT):
    - nhánh `cancel` không chứa "new receiving" / "có hiệu lực";
    - nhánh `set` không chứa "cancel" / "hủy";
    - thiếu `change` thì ra câu trung tính;
    - không mẫu nào chứa "receives deposits" / "nhận cọc".
  - Nếu BE không kịp v1.0.4: INT vẫn ra mẫu mới. Thư sẽ luôn dùng câu trung tính có ngày, đúng sự thật dù kém cụ thể. Như vậy vẫn đạt điều kiện của thẻ này.
- Trạng thái: Open

### FB-R4-CPY-INT-104-02
- Mức độ: Minor
- Vị trí: `subjectEn`/`subjectVi` của `receiving_account_changed` ("Notice: the deposit receiving account was changed" / "Thông báo: tài khoản nhận cọc đã thay đổi").
- Vấn đề: chân thư chung nói về "OTTIMO security notices", nhưng tiêu đề mẫu này chỉ là "Notice:". Đây là mẫu duy nhất trong 5 mẫu không có tiền tố "Security notice:".
- Vì sao quan trọng: người đọc so tiêu đề với chân thư. Một họ thư cùng tiền tố thì dễ nhận ra thư thật, và câu chân thư phủ trọn họ thư.
- Đề xuất sửa: dùng tiêu đề ở thẻ 01 ("Security notice: receiving account update" / "Thông báo bảo mật: cập nhật tài khoản nhận chuyển khoản"). Chân thư giữ "security notices".
- Trạng thái: Open

### FB-R4-CPY-INT-104-03
- Mức độ: Minor (thực hiện thẻ FB-R4-INT-CPY-31-06)
- Vị trí: `email-templates.ts`: `notYouVi`, `mfa_reset*` (tiêu đề + thân), `emailChangedCopy` (`madeByOwner*`, câu hành động `self`/`previous` khi `via = owner`, bản `owner` khi `via = owner`, `previous` khi `via = self`), `NO_LINK_*`.
- Vấn đề: thư và Desk gọi cùng một thứ bằng hai tên:
  - chủ cơ sở / the property owner ↔ chủ đầu tư / the owner;
  - two-step sign-in / đăng nhập 2 bước ↔ 2-step verification / xác thực 2 bước;
  - sign-in codes / mã đăng nhập ↔ mã xác thực, mã khôi phục.
- Vì sao quan trọng: xem mục 4.
- Đề xuất sửa: chữ cuối cùng như bảng dưới. Câu không có trong bảng thì giữ nguyên.

  | Chỗ | EN | VI |
  |---|---|---|
  | `NO_LINK_*` | OTTIMO security notices never contain links and never ask for your password or any code. | Thư bảo mật của OTTIMO không bao giờ có đường liên kết và không bao giờ hỏi mật khẩu hay bất kỳ mã nào. |
  | `notYouEn` / `notYouVi` | (giữ) If this was not you, contact the owner or the OTTIMO team today and change your password. | Nếu không phải bạn, hãy báo chủ đầu tư hoặc đội OTTIMO ngay trong hôm nay và đổi mật khẩu. |
  | `mfa_reset*` tiêu đề | Security notice: 2-step verification was reset | Thông báo bảo mật: xác thực 2 bước đã được đặt lại |
  | `mfa_reset*` bản `self` | Your 2-step verification was reset{how}. | Xác thực 2 bước của tài khoản bạn đã được đặt lại{howVi}. |
  | `mfa_reset*` bản `owner` | {who}'s 2-step verification was reset{how}. (không có tên: "A staff member's 2-step verification was reset{how}.") | Xác thực 2 bước của {whoVi} đã được đặt lại{howVi}. |
  | `{how}` / `{howVi}` | (giữ) " by the OTTIMO technical team" | (giữ) " bởi đội kỹ thuật OTTIMO" |
  | `madeByOwner*` | The change was made by the owner. | Thay đổi do chủ đầu tư thực hiện. |
  | `email_changed` `self`, `via = owner` | (giữ) If you did not expect this, please contact the owner directly. | Nếu bạn chưa được báo trước, vui lòng liên hệ trực tiếp chủ đầu tư. |
  | `email_changed` `previous`, `via = owner` | (giữ) If you did not expect this, do not reply to this email. Please contact the owner directly. | Nếu bạn chưa được báo trước, vui lòng không trả lời thư này mà liên hệ trực tiếp chủ đầu tư. |
  | `email_changed` `previous`, `via = self` | (giữ) If this was not you, do not reply to this email. Contact the owner or the OTTIMO team right away and change your password. | Nếu không phải bạn, vui lòng không trả lời thư này. Hãy báo ngay chủ đầu tư hoặc đội OTTIMO và đổi mật khẩu. |
  | `email_changed` `owner`, `via = owner` | (giữ) An owner changed or removed the notification email of {who}. | Một chủ đầu tư vừa đổi hoặc gỡ email nhận thông báo bảo mật của {whoVi}. |

  Ghi chú chữ:
  - Không mở câu bằng chữ số ("2-step…") trong tiếng Anh, nên bản `self` dùng "Your 2-step verification…".
  - "chủ đầu tư" viết thường giữa câu, như câu lỗi trên Desk (`login.no_signup`, `error.PAYMENT_NOT_CONFIGURED`).
  - Giữ "An owner…" ở bản `owner` vì có thể có nhiều chủ đầu tư.
  - "any code" / "bất kỳ mã nào" thay "sign-in codes": phủ cả mã xác thực lẫn mã khôi phục, là hai thứ kẻ gian hay hỏi. **SEC xác nhận** câu chân thư mới.
  - Test INT đã đề xuất trong thẻ 31-06: chặn "chủ cơ sở", "property owner", "two-step sign-in", "Two-step sign-in", "đăng nhập 2 bước", "sign-in codes", "mã đăng nhập", "nhận cọc", "receives deposits" trong mọi bản dựng (5 mẫu × audience × via × change).
- Thời điểm: cùng PR P4-05 + P4-06. Làm cả lượt hoặc dời cả lượt sang v1.0.5. Không làm lẻ.
- Trạng thái: Open

### FB-R4-CPY-INT-104-04
- Mức độ: Suggestion (không chặn, INT làm nếu tiện trong lượt thẻ 03)
- Vị trí: `mfa_recovery_code_used` bản `self`.
- Vấn đề: "Your account signed in to OTTIMO Desk with a recovery code." / "Tài khoản của bạn vừa đăng nhập…": tài khoản không tự đăng nhập, người mới đăng nhập.
- Đề xuất sửa: "Your OTTIMO Desk account was signed in with a recovery code." / "Tài khoản OTTIMO Desk của bạn vừa được đăng nhập bằng mã khôi phục." Không viết "Someone signed in…", vì người đọc thường chính là người vừa đăng nhập, và câu sẽ nghe báo động.
- Trạng thái: Open

---

## 6. Việc kèm ngoài tệp mẫu (nếu nhận thẻ 01–03)

| Ai | Việc |
|---|---|
| BA | Sổ tay quote nguyên tiêu đề thư: `product/docs/manual/user-manual-v1.0.md` dòng 150–151 và `product/docs/manual/guides/01-chu-dau-tu-quan-ly.md` dòng 160–161. Đổi theo tiêu đề mới của `mfa_reset*` và `receiving_account_changed` trong cùng bản phát hành. Thêm một dòng: thư hủy lịch đổi tài khoản nhận cũng có tiêu đề "receiving account update" |
| OPS | `product/infra/server/README.md` dòng 431 trích "Thay đổi do chủ cơ sở thực hiện". Đổi thành "Thay đổi do chủ đầu tư thực hiện" |
| UXD | Thêm một dòng vào `content-guide.md` mục 3: "thư gửi nhân viên dùng đúng bảng thuật ngữ này" (đề xuất của thẻ 31-06). Ngoài phạm vi: `auth.mfa_later` trên Desk vẫn ghi "Two-step sign-in" / "Đăng nhập 2 bước". Nếu khóa còn dùng thì đổi theo "2-step verification" / "xác thực 2 bước", không thì bỏ |
| SEC | Xác nhận câu chân thư mới ("any code") và 4 câu `receiving_account_changed` (thẻ 01) |

## 7. Điểm làm tốt
- 5 thư giờ cùng một nhịp: chuyện gì, lúc nào, làm gì; câu chống lừa đảo chỉ một lần. Thân thư ngắn hơn rõ.
- Bỏ được ngoặc lồng "(… (GMT+7))". Không có `occurredAt` thì không còn dòng trống hay nhãn treo.
- `staffName` bị bỏ ngay ở mẫu cho mọi bản không phải `owner`. Chữ không phải đoán ai đang đọc.
- Khung thư giữ đúng bảng màu 80/15/5 và cặp chữ Lora / Be Vietnam Pro có dự phòng.

## 8. Giả định
1. `{date}` và `{occurredAt}` giữ định dạng dispatcher hiện tại (`25/10/2026`, `23/10/2026 14:05 (GMT+7)`), giống nhau ở EN và VI.
2. Thư `receiving_account_changed` chỉ gửi chủ đầu tư (`owners: true`). Nếu sau này gửi cả quản lý thì câu hành động phải đổi, vì quản lý không xem được khối tài khoản nhận.
3. Tên tham số mới `change` là đề xuất. ARC/BE có thể đổi tên, miễn mẫu nhận đúng hai giá trị `set` / `cancel` và có nhánh trung tính.
