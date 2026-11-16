# DOM review – FE PR #181 (FB-INV-010 Đợt 1: landing dài hạn, giá tháng, FAQ dài hạn)

- Round 5 · Bước: Review (rút gọn) · DOM · 16/11/2026
- PR #181, nhánh `r5-fb010-fe-landing` @ `05f3d303`.
- DOM đọc: `content/en.ts`, `content/vi.ts` (đọc kỹ), `content/ko.ts`, `zh.ts`, `ru.ts` (chỉ soát số), diff `site.json`, `booking-strings/en.ts`, `booking-strings/vi.ts`, diff `Rooms.astro`, `BookingForm.astro`. Đối chiếu `04-investor-feedback/FB-INV-010.md`, `rounds/round-05/fb-inv-010/CPY-copy.md` (phụ lục INV 16/11), quy tắc giá tháng của PR #180. DOM không chạy test.
- Không có dữ liệu khách thật.

## 0. Kết luận

**DUYỆT.** Không Blocker, không Major. 3 thẻ Minor (chữ, có thể sửa cùng PR hoặc dời), 2 Suggestion. Không ESC.

## 1. Kết quả kiểm theo yêu cầu ORC

| Mục kiểm | EN | VI | KO/ZH/RU (số) | Nguồn |
|---|---|---|---|---|
| Tối thiểu 1 tháng | Đúng (`faq-policy a[1]`, `monthsHint`, `rooms.note`) | Đúng | Đúng | `site.json longStay.minMonths = 1` |
| Cọc 1 tháng | Đúng (`a[1]`, `book.steps[2]`, `faq-long`) | Đúng | Đúng (1개월분 보증금 / 一个月押金 / депозит за один месяц) | `depositMonths = 1` |
| Điện 4.000 VND/kWh, nước 25.000 VND/m³ | Đúng, "on what you actually use" | Đúng | Đúng (RU dùng khoảng trắng không ngắt) | `site.json` |
| Chốt cuối tháng, thanh toán chậm nhất ngày 5 | "last day of each month… by the 5th" | "chậm nhất ngày 5" | 5일까지 / 最迟于次月 5 日 / не позднее 5-го числа (đều gồm ngày 5, khớp phụ lục mục 2) | `billingDueDay = 5` |
| Chăn ga + khăn theo số người, không gồm amenities | Đúng (`a[0]`) | Đúng | Đúng | Phụ lục mục 3 |
| Dọn phòng thêm: Studio 150.000, Premium/Signature 200.000/lần | Đúng (`a[4]`), FAQ dọn phòng đã bỏ ý miễn phí | Đúng | Đúng | `housekeepingVndPerVisit` |
| Giá thẻ phòng / hộp giá | "From X / month" + "Taxes included" khi API có số, không có số → "Monthly rate on request"; tổng = "For n months: from X" | Đúng | – | Khớp #180 (giá niêm yết tháng nhỏ nhất, gồm VAT, × n, không giảm kỳ hạn, không +10 %) |
| Không còn ngắn ngày/theo đêm | Form bỏ radio theo đêm/theo tháng, bỏ ngày trả phòng; số tháng bắt buộc 1/2/3/6/12/24; `shortMaxNights` bỏ; FAQ bỏ "dọn phòng mỗi ngày cho kỳ ngắn", bỏ "ở càng lâu càng ưu đãi" | Đúng | Không thấy chữ "đêm/night" bán ngắn ngày | – |
| Không hứa điều Desk chưa làm | Không có câu "giữ phòng tự động", không lịch trống; `estimate.final` "No room is held yet. Your room is confirmed once your deposit is received." | Đúng | – | Đợt 2 mới có |
| Cọc/xác nhận khớp quy trình | Lễ tân báo giá qua Zalo → khách chuyển cọc QR → xác nhận; "Nothing to pay here"; không cổng online | Đúng | – | FB-INV-010 mục quy trình |

Giờ nhận/trả gắn đúng "ngày dọn vào / ngày cuối" (12:00, luôn sẵn sàng 14:00, trả trước 12:00) – khớp BR-401.

## 2. Thẻ feedback

### FB-R5-DOM-FE-181-01
- Mức độ: Minor
- Vị trí: `content/en.ts` `faq.items[faq-long].a[0]`; `content/vi.ts` cùng khóa (KO/ZH/RU tương ứng)
- Vấn đề: "Someone is always here when you need help." / "Và luôn có người hỗ trợ khi bạn cần." Lễ tân chỉ trực 07:00–22:00 (chính trang ghi ở Tiện nghi và các bước). Với khách ở cả tháng, "always" dễ bị hiểu là có người 24/7 tại chỗ.
- Vì sao quan trọng: khách dài hạn sẽ gặp sự cố đêm (mất nước, kẹt khóa); hứa "luôn có người" mà 23:00 không ai trực là khiếu nại dễ thấy nhất. Câu có từ trước PR nhưng nay nằm ngay câu quy trình đặt dài hạn.
- Đề xuất sửa: EN "We are here for you throughout your stay, at reception [[07:00–22:00]] and by phone after hours." – VI "Chúng tôi đồng hành suốt kỳ ở: lễ tân [[07:00–22:00]], ngoài giờ có số điện thoại hỗ trợ." (Nếu ngoài giờ không có số trực thật, bỏ vế sau: EN "We are here for you throughout your stay." / VI "Chúng tôi đồng hành cùng bạn suốt kỳ ở.") CPY chốt câu, KO/ZH/RU theo.
- Trạng thái: Open

### FB-R5-DOM-FE-181-02
- Mức độ: Minor
- Vị trí: `content/vi.ts` `book.title` = "Lên kế hoạch cho kỳ nghỉ"
- Vấn đề: "kỳ nghỉ" là đi nghỉ ngắn ngày (du lịch), lệch định vị dài hạn; phần còn lại của VI đã thống nhất "kỳ ở" (`book.steps`, `form.yourStay`, `monthsHint`).
- Vì sao quan trọng: tiêu đề khối đặt phòng là chỗ khách đọc ngay trước form; giữ giọng "ở dài" nhất quán với FB-INV-010.
- Đề xuất sửa: "Lên kế hoạch cho kỳ ở" (EN "Plan your stay" giữ nguyên).
- Trạng thái: Open

### FB-R5-DOM-FE-181-03
- Mức độ: Minor
- Vị trí: `booking-strings/en.ts`, `vi.ts` (và KO/ZH/RU) `when.callNow`; `content/*` `book.form.done.tonight`
- Vấn đề: `callNow` "As you arrive tonight, we will contact you within N minutes." / "Bạn đến trong tối nay…" còn chữ "arrive/đến" của luồng ngắn ngày, trong khi `done.tonight` đã đổi sang "Moving in tonight?" / "Bạn dọn vào ngay tối nay?". Hai câu hiện cùng màn hình cảm ơn.
- Vì sao quan trọng: nhỏ, chỉ là nhất quán từ "dọn vào"; nhưng cũng là dấu vết cuối của luồng theo đêm.
- Đề xuất sửa: EN "As you move in tonight, we will contact you within ${m} minutes." – VI "Bạn dọn vào trong tối nay, chúng tôi sẽ liên hệ bạn trong ${m} phút." CPY có thể giữ nếu muốn (CPY-copy dòng 284 đã chọn GIỮ) – khi đó đóng thẻ là Rejected có lý do.
- Trạng thái: Open

### FB-R5-DOM-FE-181-04
- Mức độ: Suggestion
- Vị trí: `content/*` `faq-policy a[3]`
- Vấn đề: câu "settle the bill, based on actual use, by the 5th" đúng nguyên văn INV, nhưng chưa nói tiền phòng tháng sau trả khi nào (cùng hạn ngày 5 hay đầu kỳ). Đợt 1 không bịa thêm là đúng.
- Vì sao quan trọng: lễ tân sẽ bị hỏi câu này đầu tiên khi báo giá; Đợt 3 (phiếu thu điện nước) cần một quy tắc.
- Đề xuất sửa: không sửa landing bây giờ. DOM ghi vào câu hỏi cho Đợt 3 (gom ESC cuối round nếu INV chưa nói): "Tiền phòng các tháng sau thu cùng phiếu ngày 5 hay thu trước đầu mỗi kỳ?".
- Trạng thái: Open

### FB-R5-DOM-FE-181-05
- Mức độ: Suggestion
- Vị trí: `content/ru.ts` dòng 4 (chú thích đầu file)
- Vấn đề: chú thích còn ghi "Deposit = предоплата, never 'депозит' (CPY 1.4)" nhưng chữ mới dùng "депозит" (CPY Đợt 1 chọn, câu hỏi mở số 3). Chỉ là chú thích code.
- Đề xuất sửa: FE cập nhật chú thích theo CPY Đợt 1 để người sau không "sửa ngược".
- Trạng thái: Open

## 3. Điểm làm tốt
- Mọi số chính sách dài hạn nằm một chỗ (`site.json longStay`) và test kiểm FAQ 5 ngôn ngữ theo đúng số – đổi tham số Desk không lệch chữ.
- Không có số thì không có chữ "From": thẻ phòng rơi về "Monthly rate on request", tránh giá ảo.
- Câu "No room is held yet… confirmed once your deposit is received" nói đúng năng lực hiện tại, không hứa giữ phòng tự động của Đợt 2.

| 2026-11-16 | 5 | **DOM – review FE PR #181 (FB-INV-010 Đợt 1 landing dài hạn) @ 05f3d303: DUYỆT.** Số FAQ dài hạn khớp INV 16/11 ở cả 5 ngôn ngữ (tối thiểu 1 tháng, cọc 1 tháng, điện 4.000/kWh, nước 25.000/m³, chốt cuối tháng, chậm nhất ngày 5, chăn ga + khăn theo số người, không gồm amenities, dọn phòng 150.000/200.000 mỗi lần); form chỉ còn dài hạn; không hứa giữ phòng tự động/lịch trống; cọc QR + lễ tân xác nhận đúng quy trình; giá tháng khớp #180. Minor 181-01 ("always here" vs lễ tân 07–22), 181-02 (VI "kỳ nghỉ" → "kỳ ở"), 181-03 (callNow "arrive" → "move in"); Suggestion 181-04 (hạn trả tiền phòng tháng sau – câu hỏi Đợt 3), 181-05 (chú thích RU). Không ESC | DOM | rounds/round-05/reviews/DOM-on-fe-pr-181.md |
