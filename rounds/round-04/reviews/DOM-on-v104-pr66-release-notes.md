# DOM review – PR #66 `v104/po-release-notes`: ghi chép phát hành v1.0.4

- Người review: DOM | Round 4 – v1.0.4 – Bước **Review** | 05/11/2026
- Tác giả: PO. Bản đọc: `git diff origin/main...origin/v104/po-release-notes -- product/docs/release-notes.md`, head `99d103a0`, 184 dòng thêm. Số dòng ghi trong file này là số dòng của `product/docs/release-notes.md` trên nhánh @ `99d103a0`.
- Căn cứ:
  - `product/docs/business-rules.md` v0.5.11: BR-105 (1)–(8), BR-110, BR-107, BR-108, BR-417, BR-421 (b), BR-428, mục 15;
  - các review DOM đã đóng: `DOM-on-v104-pr72-manual.md` (lượt 2), `DOM-on-v104-pr85-prices.md` (lượt 2, CO-05, thẻ 04, 05), `DOM-on-v104-pr89-minors.md` (thẻ 01);
  - `main` @ `2268b139`: #89 đã gộp (`192f087d`) cùng bản sửa DOM-PR89-01 (`ba82d332`). `02` 11.5.2 trên `main` đã có câu "phụ thu người khách đã trả cho các đêm bỏ vẫn hoàn";
  - `rounds/round-04/outputs/DOM/inv-price-switch-guide.md` phần C.
- Mã đối chiếu ở `main`: `sales/internal/quote-pricing.ts` dòng 139–140 (tham số đọc theo ngày làm việc hôm nay) và 176 (`DATE_IN_PAST` khi ngày đến đã qua); `frontdesk/internal/stay.service.ts` dòng 1745–1781 (hoàn trả sớm); chuỗi `field.TIME_AFTER_ACTION`.

---

## 1. Phán quyết

**ĐẠT.** Không có câu nào sai tiền hoặc sai quy tắc so với BR v0.5.11 và trạng thái đã gộp. Có 3 thẻ Minor về chữ và 2 thẻ Gợi ý. Thẻ Minor nên sửa ngay trong #66 vì chỉ là chữ, nhưng không chặn gộp.

Ngoài #66, DOM tìm ra một lỗi ở hướng dẫn chuyển giá của chính DOM (thẻ 06, Major). Ngày thử C1 là 06/11. Từ 07/11 ngày này đã qua, nên Desk từ chối báo giá. DOM đã sửa trong cây làm việc, **chưa commit**. ORC commit cùng file review này.

---

## 2. Bảng kiểm theo 6 phần ORC giao

| # | Phần | Dòng | Kết quả | Ghi chú |
|---|---|---|---|---|
| 1 | Giới hạn đã biết: BUG-R4-036 (CO-05 + PR85-04) | 132–137 | Khớp | Từ 06:00 tới trước 12:00 thì để nguyên giờ Desk điền sẵn. Trước 12:00 không phụ thu, không thêm đêm (BR-421, ân hạn 12:30). Quá 12:00 mới làm thì gõ 12:00, ghi giờ rời thật ở **Ghi chú giờ trả**, không phụ thu (DOM-PR85-04). Câu "Không gõ giờ trước 06:00" khớp CO-05 (Desk hiểu là ngày hôm sau, báo 422). Chuỗi "Giờ này muộn hơn hiện tại…" khớp `field.TIME_AFTER_ACTION`. Việc v1.0.5 ghi đúng là BUG-R4-051. Xem thẻ 03 |
| 2 | Trả sớm, báo trong ngày rời | 139 | Khớp | Đã gồm sửa DOM-PR89-01: chỉ đơn Trực tiếp/CTV; không hoàn tiền phòng. Phụ thu người đã trả của các đêm bỏ hoàn 100 %, qua **một** yêu cầu hoàn. Không có phụ thu thì Desk ghi "Không có khoản hoàn.". Báo trước từ 1 ngày thì hoàn 50 %. Khớp BR-428 và `stay.service.ts`. Đổi chữ dòng phí xếp đúng vào bảng "Chưa có" (dòng 171, FB-R4-DOM-UXD-PR89-02). Xem thẻ 02 |
| 3 | Đơn Nội bộ (BR-105) | 43, 58, 141–144, 177 | Khớp | (8): chỉ tạo khi OWN/MGR đồng ý, Ghi chú nội bộ ghi người cho, lý do, số đêm miễn phí; "Desk chưa chặn theo vai", và việc chặn theo vai ghi "Chưa xếp". (1)–(7): giá cho mọi đêm hoặc trống hết. (4) v0.5.9: đơn có cả đêm thu và đêm miễn phí thì sửa đêm miễn phí về 0 **trước khi nhận phòng**, không dùng FOC hay giảm 100 %. Cách làm khi tới lúc nhận phòng mà chưa sửa khớp `02` 5.1. Câu đêm thêm 0 đ, phụ thu theo giá đêm của chính đơn khớp BR-421 / #71 |
| 4 | Minibar khi đổi phòng | 57, 97, 145 | Khớp | Không ghi minibar căn cũ bằng **Thêm phát sinh**. Buồng phòng đếm tủ căn cũ trước khi dọn, số ghi sổ giao ca, lúc trả phòng nhập cho tủ căn cũ và không đếm lại. Dòng trùng thì **Bỏ cả dòng** trước **Trả phòng**, lý do "Trùng minibar tủ căn cũ". Dòng 97 giới hạn "chỉ dòng trùng đó". Khớp bản sửa PR72-02 của #72 |
| 5 | Giá theo ESC-045 (có điều kiện) | 97, 104, 127, 146–150 | Khớp | Bỏ +15 % / +30 %; trẻ 6–11 vượt định mức 150.000 như người lớn, dưới 6 miễn (BR-110, B8); bỏ giảm theo số đêm (BR-107, B3); dài hạn từ 30 đêm (BR-108, B4/B5); nhận sớm từ 11:00 không phụ thu (BR-417, B7). Có câu điều kiện "chỉ đúng sau khi anh/chị chuyển tham số" và "Đội chưa nhận được xác nhận". Câu với khách giữ "Check-in is from 12:00." Chữ Desk cũ ghi đúng là việc v1.0.5. Dòng 127 đúng: mức giá theo **Tham số quy tắc**, không đổi khi lên hay lùi bản |
| 6 | Bước Kiểm giá 1.600.000 / 1.840.000 | 105, 148 | Khớp số | Studio 800.000, đến thứ Sáu, 2 đêm (thứ Sáu và thứ Bảy), 2 người lớn: 1.600.000 khi mức tăng bằng 0, hoặc 800.000 × 1,15 × 2 = 1.840.000 khi +15 % còn bật. 2 đêm qua được luật ở tối thiểu cuối tuần. Xem thẻ 01 và 06 |

Kiểm thêm, không có lỗi:
- Dòng 151: đơn quá ngày đi. Gia hạn tới hôm nay rồi **Trả phòng**. Quên bấm thì giảm giá đặc biệt 100 % (MGR tới 1 đêm, OWN từ 2 đêm), xóa mã cửa, khai báo ghi ngày rời thật. Khớp BR-421 (b) v0.5.10 và `02` 11.1 (b). Xem thẻ 04.
- Dòng 124 (lùi bản): các cách làm "tới v1.0.3" khớp các khối đã duyệt ở #72.

---

## 3. Thẻ góp ý

### FB-R4-DOM-PO-PR66-01
- Mức độ: Minor
- Vị trí: dòng 105, bước 3 **Kiểm giá**
- Vấn đề: chỉ nói hai kết quả, 1.600.000 và 1.840.000. Không nói khi ra số khác. Dòng 148 cho lễ tân thì đã có "hoặc số khác". Bước này cũng không nói ngày đến phải chưa qua và phải có Studio còn trống.
- Vì sao quan trọng: chủ đầu tư kiểm trước khi lên. Đổi giá căn ở phần A mà sót thì ra số khác, ví dụ 1.500.000. Câu hiện tại không chỉ cho chủ đầu tư biết đó là lỗi. Thứ Sáu đã qua thì Desk báo lỗi ngày đã qua (`DATE_IN_PAST`).
- Đề xuất sửa: thêm vào cuối câu đầu: "Ra số khác: giá căn chưa đổi đúng ở phần A, dừng và nhắn đội. Chọn thứ Sáu chưa qua mà còn Studio trống."
- Trạng thái: Mở

### FB-R4-DOM-PO-PR66-02
- Mức độ: Minor
- Vị trí: dòng 139, "**Nhập nơi nhận hoàn** như thường (mục 12.2)"
- Vấn đề: không ghi mục 12.2 của tài liệu nào. Chủ đầu tư thường đọc `01`, mà `01` 12.2 là "Xóa tin trong Google Chat". Mục đúng là `02` 12.2 "Đề nghị hoàn và nhập nơi nhận hoàn".
- Vì sao quan trọng: người đọc tra sai mục ở đúng bước có tiền hoàn.
- Đề xuất sửa: "(`02` mục 12.2)".
- Trạng thái: Mở

### FB-R4-DOM-PO-PR66-03
- Mức độ: Minor
- Vị trí: dòng 133, khách đi trước 06:00
- Vấn đề:
  - (a) Câu "Không bấm **Trả sớm** lần nữa" chép từ `02` 11.5.1. Ở `02`, câu này nằm trong luồng Trả sớm, nên "lần nữa" có nghĩa. Ở ghi chép phát hành, khối này đứng riêng, cho cả khách rời đúng ngày đi. "Lần nữa" làm người đọc hiểu là trước đó đã bấm Trả sớm.
  - (b) Trước 06:00, Desk chưa ghi được khoản thu và chưa có mã VietQR. Câu chỉ nói tiền mặt hoặc POS, thiếu trường hợp khách chỉ chuyển khoản được (`02` 11.5.1 có).
- Vì sao quan trọng: lễ tân ca đêm làm một mình. Thiếu trường hợp chuyển khoản thì dễ tự tạo QR ngoài Desk, hoặc để khách đi mà không ghi số còn thu.
- Đề xuất sửa:
  - (a) "Không bấm **Trả sớm** (trước 06:00 Desk vẫn tính là ngày hôm trước)."
  - (b) Thêm: "Khách chỉ chuyển khoản được: ghi sổ giao ca số còn thu, đầu ca sáng báo quản lý."
- Trạng thái: Mở

### FB-R4-DOM-PO-PR66-04
- Mức độ: Gợi ý
- Vị trí: dòng 151, đơn quá ngày đi, trường hợp quên bấm
- Vấn đề: thiếu hai ý mà `02` 11.1 (b) có.
  - Còn yêu cầu giảm chờ duyệt thì Desk chưa cho hoàn tất trả phòng.
  - Chưa rõ hạn và cách ghi trễ ngày đi trên cổng khai báo: hỏi quản lý trước khi gửi. Đội đang hỏi luật sư (BR v0.5.11 mục 15).
- Vì sao quan trọng: không sai, nhưng người chỉ đọc ghi chép phát hành sẽ gặp lỗi chặn trả phòng mà không biết vì sao.
- Đề xuất sửa: thêm: "Chờ duyệt xong mới **Trả phòng** được. Ghi trễ ngày đi trên cổng: hỏi quản lý trước khi gửi."
- Trạng thái: Mở (PO tự quyết)

### FB-R4-DOM-PO-PR66-05
- Mức độ: Gợi ý
- Vị trí: dòng 148, "Lễ tân kiểm bằng báo giá thử trước khi báo giá cho khách"
- Vấn đề: câu có thể hiểu là kiểm trước **mọi** lần báo giá.
- Đề xuất sửa: "Lễ tân kiểm một lần ở ca đầu tiên sau khi lên, và sau mỗi lần chủ đầu tư báo đã đổi giá: …". Khớp dòng "Kiểm sau khi chuyển giá" ở `02` (dòng 1763 trên `main`).
- Trạng thái: Mở (PO tự quyết)

### FB-R4-DOM-DOM-PR66-06 (DOM tự sửa hướng dẫn của mình)
- Mức độ: Major
- Vị trí: `rounds/round-04/outputs/DOM/inv-price-switch-guide.md`, phần C. #66 dòng 105 dẫn tới phần này.
- Vấn đề: ngày thử C1 là 06/11/2026. Ngày làm việc từ 07/11 trở đi thì Desk trả `DATE_IN_PAST` (`quote-pricing.ts` dòng 176), không báo giá. C2, C3 là 09/11 và C4 là 10/11, cũng hết dùng được nếu ngày lên lùi tới 10/11. Theo #66, chủ đầu tư làm bước 3 trước khi lên, tức 06/11–10/11.
- Vì sao quan trọng: chủ đầu tư sẽ gặp lỗi ở bước kiểm bắt buộc trước khi lên. Chủ đầu tư dễ nghĩ chuyển giá hỏng và gửi `/feedback P0`.
- Đã sửa (cây làm việc, chưa commit):
  - Đổi ngày: C1 13/11 (thứ Sáu), C2 và C3 16/11 (thứ Hai), C4 17/11 (thứ Ba).
  - Số Desk phải hiện không đổi. Đã đếm lại: C1 có 2 đêm cuối tuần. C2 có 5 đêm thường và 2 đêm cuối tuần. C3 có 21 đêm thường và 8 đêm cuối tuần, đêm cuối là 14/12, trước khoảng `special_dates` 24/12. C4 có 2 đêm thường.
  - Thêm 2 dòng hướng dẫn: ngày đến phải từ hôm nay trở đi (đã qua thì lấy cùng thứ của tuần sau); căn trong bảng đã có khách thì thử căn cùng giá.
  - Cột "Nếu ra số khác" của C1 đổi thành "số khác (ví dụ 1.500.000) → giá căn vừa thử chưa đổi ở phần A".
  - Dòng đầu file ghi "Sửa 05/11/2026 lần 2".
- Trạng thái: Đã sửa – chờ ORC commit

---

## 4. Ghi chú cho ORC

1. #89 đã gộp với chữ đã sửa DOM-PR89-01 (`ba82d332`, `main` `02` 11.5.2), nên dòng 139 của #66 khớp `main`. Không cần chờ thêm.
2. Thẻ 06 nằm ngoài #66 và không đổi số nào. Commit `inv-price-switch-guide.md` cùng file này. Nếu đã gửi chủ đầu tư bản hướng dẫn có ngày 06/11, nhắn kèm một câu: "Phần C đã đổi ngày thử sang 13–17/11, số giữ nguyên." Không cần ESC.
3. Không đổi BR, không có ESC mới.

---

## 5. Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **DOM – review PR #66 @ `99d103a0` (ghi chép phát hành v1.0.4): ĐẠT.** BUG-R4-036 khớp CO-05 và DOM-PR85-04. Trả sớm báo trong ngày rời khớp BR-428 sau DOM-PR89-01. Đơn Nội bộ khớp BR-105 (1)–(8). Minibar đổi phòng khớp #72. Giá ESC-045 ghi đúng điều kiện "sau khi chủ đầu tư chuyển". Kiểm giá 1.600.000 / 1.840.000 đúng số. 3 Minor về chữ, nên sửa trong #66, không chặn: PR66-01 thêm "ra số khác" vào bước Kiểm giá; PR66-02 "`02` mục 12.2"; PR66-03 bỏ "lần nữa" và thêm cách làm khi khách chỉ chuyển khoản trước 06:00. 2 Gợi ý: PR66-04, PR66-05 | DOM | Không câu nào sai tiền. Các Minor giúp chủ đầu tư và lễ tân ca đêm không tra sai mục, không bỏ sót trường hợp |
| 2026-11-05 | 4 | **Hướng dẫn chuyển giá, phần C: đổi ngày thử sang 13/11–17/11** (FB-R4-DOM-DOM-PR66-06, DOM tự sửa). Số kỳ vọng giữ nguyên. Thêm cách chọn ngày khi ngày đã qua và cách chọn căn cùng giá | DOM | Desk không báo giá ngày đến đã qua (`DATE_IN_PAST`), nên C1 06/11 hết dùng được từ 07/11, đúng lúc chủ đầu tư kiểm trước khi lên (06–10/11) |
