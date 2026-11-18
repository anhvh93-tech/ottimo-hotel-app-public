# UXD review – FE PR #189 (FB-INV-012: phiếu thanh toán tháng, chốt công tơ, trang in A5/A4)

- Người review: UXD | Round 5 – bước **Review** | 17/11/2026
- Đối tượng: **#189** `r5-fb012-fe-statements`. Chỉ đọc qua `gh pr diff 189` và ảnh chụp FE (dữ liệu giả, ở scratchpad, không vào repo). Không checkout, không đẩy, không gộp.
- Đối chiếu:
  - `00-brief/context/brand/brand-guidelines.md` (80/15/5, Lora / Be Vietnam Pro / JetBrains Mono, giọng EN dẫn – VI hỗ trợ);
  - `rounds/round-05/fb-inv-012/contract.md` §5–§8, `DOM-rules.md` BR-LS-01/02/09;
  - thay đổi INV 17/11 (đầu kỳ nhập tay, hao hụt không in).
- Ảnh đã xem: `print-a5.png`, `print-a4.png`, `print-a5.pdf` (1 trang, 420×595 pt = A5), `print-a4.pdf` (1 trang, A4), `meters-entry.png`, `meters-saved.png`, `statement-draft.png`, `statement-issued.png`, `today-attention.png`.
- Đã đọc mã: `StatementPrintPage.tsx`, `statements.css`, `StatementsAttention.tsx`, phần chữ `stmt.*`, `meters.*`, `bill.line.*` trong `gen_strings.py`.

## 0. Kết luận

**CHƯA DUYỆT – sửa 4 thẻ Major rồi UXD xem lại ảnh (không cần review lại toàn bộ).**

Phần brand đạt:
- CSS chỉ dùng `--brand-*`, có test quét;
- Lora cho tên cơ sở và tiêu đề, Be Vietnam Pro cho nội dung, JetBrains Mono cho mã phiếu, chỉ số, nội dung chuyển khoản;
- quá hạn dùng Earth Brown, không đỏ;
- không emoji;
- không in điện thoại, email hay giấy tờ của khách;
- **không in dòng hao hụt**.

Chưa đạt là ở chỗ khách đọc phiếu:
- (1) số trên từng dòng không cộng ra "Subtotal";
- (2) phiếu tháng 11 có điện nước và dịch vụ tháng 10 nhưng không ghi kỳ;
- (3) ngưỡng 9 dòng làm A5 tràn sang trang 2, chữ VI trên A5 quá nhỏ;
- (4) bảng trong ngăn phiếu nháp bị cắt cột tiền.

Ngưỡng A5 → A4: **đổi từ 9 thành 6 dòng**, thêm chặn tràn đo bằng chiều cao (thẻ 03).

| Thẻ | Mức | Việc |
|---|---|---|
| FB-R5-UXD-FE-189-01 | Major | Dòng điện/nước in thành tiền chưa VAT để các dòng cộng ra Subtotal; VAT tách một dòng |
| FB-R5-UXD-FE-189-02 | Major | In kỳ thuê và kỳ điện nước, dịch vụ trên phiếu; ghi tháng trên dòng điện, nước |
| FB-R5-UXD-FE-189-03 | Major | Ngưỡng A5 = 6 dòng + chặn tràn; cỡ chữ A5 9pt, VI ≥ 7pt |
| FB-R5-UXD-FE-189-04 | Major | Ngăn phiếu (S16): bảng tràn, cột Thành tiền bị cắt |
| FB-R5-UXD-FE-189-05 | Minor | Chữ in theo góc nhìn khách: "Đã thu/Còn phải thu" → "Đã thanh toán/Còn phải thanh toán"; chốt bảng chữ mục 2 |
| FB-R5-UXD-FE-189-06 | Minor | Phiếu phát hành sau hạn: in "Payment due on receipt" thay ngày đã qua |
| FB-R5-UXD-FE-189-07 | Minor | Dòng dịch vụ in "× 1" trùng cột Qty |
| FB-R5-UXD-FE-189-08 | Minor | "Cần chú ý": dòng phiếu tháng lệch kiểu, không vào số đếm, link không mở tab Quá hạn |
| FB-R5-UXD-FE-189-09 | Minor | S12: ô tải ảnh dùng nút gốc trình duyệt ("Choose File", tiếng Anh trong giao diện VI) |
| FB-R5-UXD-FE-189-10 | Minor | Tiêu đề ngăn "Phiếu tháng Nháp" |
| FB-R5-UXD-FE-189-11 | Suggestion | In tên phòng (The Mist…) cạnh số căn; thêm "Scan to pay" và câu giữ nguyên nội dung chuyển khoản |

## 1. Thẻ feedback

### FB-R5-UXD-FE-189-01
- Mức độ: Major
- Vị trí: `StatementPrintPage.tsx` bảng dòng + tổng; `print-a5.png`, `print-a4.png`; ngăn S16 (`statement-draft.png`) cùng cách hiện
- Vấn đề:
  - Dòng Điện ghi `142 kWh × 4.000`, VAT 8%, Thành tiền **613.440** (đã gồm VAT). Dòng Nước ghi 89.250 (đã gồm VAT).
  - Cộng các dòng ra 8.500.000 + 613.440 + 89.250 + 150.000 + 150.000 = **9.502.690**. Nhưng ngay bên dưới "Subtotal" in **9.453.000**, rồi "VAT 49.690".
  - Khách tự cộng sẽ thấy lệch 49.690 và nghĩ VAT bị tính hai lần. Ngoài ra 142 × 4.000 = 568.000 ≠ 613.440 trên cùng một dòng.
- Vì sao quan trọng:
  - Phiếu thu tiền khách tự kiểm tra bằng máy tính. Số không khớp gây hỏi lại hoặc nghi ngờ, trái trụ cột "Utilities that just work" và "Refined simplicity".
  - Đây là chỗ khách dài hạn đọc kỹ nhất mỗi tháng.
- Đề xuất sửa (chỉ đổi cách hiện, không đổi số BE):
  - Cột Amount của dòng điện, nước in `netVnd` (568.000; 85.000). Thuê, dịch vụ giữ `amountVnd` (giá đã gồm VAT). Cột VAT của thuê, dịch vụ in "incl." thay vì để trống.
  - Tổng in theo thứ tự:
    - Subtotal = tổng cột Amount = 9.453.000;
    - "VAT on electricity and water" = 49.690;
    - Rounding −690;
    - Total 9.502.000.
  - Như vậy mọi cột cộng thẳng được, VAT chỉ hiện một lần.
  - Ngăn S16 làm giống trang in để lễ tân giải thích cùng một con số.

### FB-R5-UXD-FE-189-02
- Mức độ: Major
- Vị trí: đầu phiếu in (Guest / Room / Month / Issued) và dòng Electricity / Water / Extra cleaning
- Vấn đề:
  - Phiếu ghi "Month: November 2026" nhưng điện nước là chỉ số **tháng 10** (S12 "Kỳ điện nước 10/2026") và dịch vụ ngày 12/10, 26/10 (BR-LS-01: thuê M trả trước, điện nước và dịch vụ M−1 trả sau).
  - Ngăn S16 có "Kỳ thuê" và "Kỳ điện nước, dịch vụ", còn trang in **không có**.
  - Khách thấy dọn phòng tháng 10 trên phiếu tháng 11 và không biết điện nước của tháng nào.
- Vì sao quan trọng: khách sẽ hỏi "tháng 11 chưa hết sao đã tính điện?" hoặc nghĩ bị tính trùng. Lễ tân phải giải thích từng người, từng tháng.
- Đề xuất sửa:
  - Hàng meta đổi thành: `Guest · Room · Rent period · Utilities & services · Issued`. Bỏ ô "Month" vì mã phiếu và tiêu đề đã có tháng.
  - Dòng điện, nước kèm tháng: `Electricity · Oct 2026` / `Điện tháng 10/2026`.
  - Khóa chữ ở mục 2.

### FB-R5-UXD-FE-189-03
- Mức độ: Major
- Vị trí: `A5_MAX_LINES = 9` trong `StatementPrintPage.tsx`; `.stmt-sheet { font-size: 8pt }`, `.bi .vi { font-size: 0.82em }`, `.stmt-table-print th { 0.85em }` trong `statements.css`
- Vấn đề:
  - **Ngưỡng 9 dòng sai.** Đo trên `print-a5.png`: 5 dòng đã đẩy chân trang xuống khoảng 185 mm của trang 210 mm (lề dưới 8 mm, còn khoảng 17 mm). Mỗi dòng hai tầng EN/VI cao khoảng 8,7 mm, tức chỉ chứa thêm **2 dòng**.
  - Với 8–9 dòng, khối VietQR hoặc chân trang sẽ sang trang 2. Trái tiêu chí "một trang" (contract §6.6, §8 FE-3). PDF hiện chỉ thử với 5 dòng.
  - **Chữ quá nhỏ trên A5:** nội dung 8pt, dòng VI 6,6pt, nhãn VI ở đầu cột khoảng 5,6pt. Guideline: Body 11–13pt, Label 9–11pt. Phiếu in là chỗ khách đọc dưới đèn 2700K (guideline mục 5).
- Vì sao quan trọng: phiếu tràn trang thì mất QR ở trang 1 hoặc in thừa giấy. Chữ VI 5,6pt khó đọc với khách lớn tuổi, đúng nhóm "tiếng Việt hỗ trợ".
- Đề xuất sửa (UXD chốt):
  - A5: nội dung **9pt**, VI **≥ 7pt** (0.8em), nhãn đầu cột VI ≥ 7pt (bỏ 0.85em lồng nhau). Tiêu đề Lora giữ tỷ lệ.
  - A4: 10.5pt giữ nguyên (VI khoảng 8.6pt, đạt).
  - Ngoại lệ có chủ đích so với bảng cỡ chữ của guideline (thang cỡ chữ đó cho tài liệu A4 hoặc màn hình). UXD ghi vào decision-log.
  - **Ngưỡng: A5 khi số dòng in (không tính dòng làm tròn) ≤ 6, từ 7 dòng tự sang A4.** 6 = thuê + điện + nước + tối đa 3 dịch vụ hoặc điều chỉnh, đủ cho tháng thường.
  - **Chặn tràn:** sau khi dựng, nếu chiều cao `.stmt-sheet` vượt vùng in A5 (210 − 16 mm) thì tự chuyển A4 và hiện ghi chú trên thanh công cụ "Switched to A4 to fit one page" / "Đã chuyển sang A4 để vừa một trang". Lý do: tên dịch vụ dài, có dấu PAID, nhãn điều chỉnh xuống hai dòng.
  - Thêm ảnh/PDF kiểm với 6 dòng (A5 một trang) và 7 dòng (A4 một trang).

### FB-R5-UXD-FE-189-04
- Mức độ: Major
- Vị trí: `StatementDrawer.tsx`, bảng dòng ở trạng thái Nháp (`statement-draft.png`)
- Vấn đề:
  - Ở trạng thái Nháp, nút "Dời sang phiếu sau" làm cột Nội dung rộng ra. Bảng tràn ngăn: tiêu đề "THÀNH TIỀN" và mọi số tiền bị cắt (8.500.00…, 613.44…).
  - Ở trạng thái đã phát hành (không có nút) bảng vừa.
- Vì sao quan trọng: lễ tân kiểm số **trước khi phát hành** đúng ở màn này. Số bị cắt dễ đọc sai và phát hành sai tiền.
- Đề xuất sửa:
  - Đưa "Dời sang phiếu sau" xuống một hàng riêng dưới dòng (nút chữ nhỏ, vùng chạm ≥ 44 px), không nằm trong ô Nội dung.
  - Cột tiền `white-space: nowrap` và có độ rộng tối thiểu. Bảng bọc trong `overflow-x: auto` làm lưới an toàn.
  - Kiểm ở 1280 px và ngăn hẹp 390 px.

### FB-R5-UXD-FE-189-05
- Mức độ: Minor
- Vị trí: `stmt.print.*`, `bill.line.*` trong `gen_strings.py`
- Vấn đề: chữ in đúng giọng ngắn, không emoji, EN dẫn. Có vài chỗ viết theo góc nhìn khách sạn ("Đã thu", "Còn phải thu") và câu hạn "Vui lòng thanh toán **trước hết ngày**" (mơ hồ, nghe như phải trả trước ngày đó).
- Vì sao quan trọng: phiếu là chữ khách đọc. Giọng phải hướng về khách, lịch sự, rõ nghĩa.
- Đề xuất sửa: thay bằng bảng chữ chốt ở **mục 2** (EN + VI). Chữ Desk (`stmt.*` không có `print`, `meters.*`) giữ bản FE, trừ các thẻ 08 và 10.

### FB-R5-UXD-FE-189-06
- Mức độ: Minor
- Vị trí: `stmt.print.pay_by`; `statement-issued.png` ("Quá hạn 12 ngày" ngay khi vừa phát hành)
- Vấn đề:
  - Phiếu 11/2026 phát hành 17/11 vẫn in "Please pay by 05 Nov 2026", tức một ngày đã qua.
  - Dữ liệu giả gây ra, nhưng thực tế sẽ gặp khi lễ tân phát hành muộn hoặc lập phiếu thay (`-R<n>`).
- Vì sao quan trọng: khách cầm phiếu đã "quá hạn" ngay khi nhận, dễ phật ý.
- Đề xuất sửa:
  - Nếu `issuedAt > dueDate` thì in `stmt.print.due_on_receipt`: "Payment due on receipt." / "Vui lòng thanh toán khi nhận phiếu."
  - Desk giữ cách tính quá hạn theo BR-LS-02. Không đổi luật, chỉ đổi chữ in.

### FB-R5-UXD-FE-189-07
- Mức độ: Minor
- Vị trí: dòng dịch vụ "Extra cleaning × 1 · 12 Oct" (in và ngăn S16)
- Vấn đề: "× 1" lặp với cột Qty = 1. Ở ngăn S16 nhãn còn xuống dòng xấu ("× 1 ·" / "12/10").
- Vì sao quan trọng: dòng chữ thừa trên phiếu nhỏ A5, và làm dòng cao thêm (ảnh hưởng thẻ 03).
- Đề xuất sửa: nhãn dòng dịch vụ trên phiếu là `{service} · {date}` ("Extra cleaning · 12 Oct" / "Dọn phòng thêm · 12/10"); số lượng chỉ ở cột Qty.

### FB-R5-UXD-FE-189-08
- Mức độ: Minor
- Vị trí: `StatementsAttention.tsx`; `today-attention.png`
- Vấn đề:
  - Dòng "1 phiếu tháng quá hạn" nằm trong một `<ul>` riêng sau danh sách. Dòng này không có viền trái màu và vòng tròn icon như 7 dòng còn lại.
  - Không được đếm vào huy hiệu "Cần chú ý 7" (thực tế 8 dòng).
  - Nút "Mở" đưa về S16 tab Nháp, không phải tab Quá hạn.
- Vì sao quan trọng:
  - Dòng tiền quá hạn nhìn "nhẹ" hơn các việc khác, dễ bị bỏ qua.
  - Số đếm sai làm mất tin vào huy hiệu.
  - Thêm một bước bấm.
- Đề xuất sửa:
  - Đưa vào cùng danh sách và cùng component dòng (`task warn`, icon trong vòng tròn, viền Earth Brown khi `alert/escalate`). Cộng vào số đếm.
  - Link `…/long-stay/statements?tab=overdue`, hoặc `?tab=issued` khi chỉ có "đến hạn hôm nay".
  - Chữ khi có số tiền: "Phiếu tháng quá hạn: {n} · {amount} đ" (VI) / "Overdue statements: {n} · {amount} VND" (EN). Không có tổng tiền thì giữ chữ FE.

### FB-R5-UXD-FE-189-09
- Mức độ: Minor
- Vị trí: `MetersPage.tsx` ô `type="file"` (`meters-entry.png`)
- Vấn đề: nút gốc trình duyệt "Choose File / No file chosen" (tiếng Anh, font hệ thống) nằm giữa giao diện VI và lệch Design System. Trên điện thoại vùng chạm cũng nhỏ.
- Vì sao quan trọng: thao tác chính của S12 (chụp công tơ) là chỗ nhìn kém nhất trên màn hình.
- Đề xuất sửa:
  - Ẩn input, dùng nút DS `btn sm` có icon máy ảnh: "Chụp hoặc chọn ảnh" / "Take or choose a photo".
  - Sau khi chọn: hiện ảnh nhỏ + tên tệp + "Đổi ảnh" / "Change photo".

### FB-R5-UXD-FE-189-10
- Mức độ: Minor
- Vị trí: tiêu đề ngăn S16 khi nháp (`statement-draft.png`)
- Vấn đề: "Phiếu tháng Nháp": chữ "Nháp" dán vào tiêu đề và lặp với chip "Nháp" bên cạnh.
- Vì sao quan trọng: nhỏ, nhưng đọc như lỗi ghép chuỗi.
- Đề xuất sửa: khi nháp, tiêu đề chỉ là "Phiếu tháng" và giữ chip. Khi đã phát hành giữ "Phiếu tháng TT-…".

### FB-R5-UXD-FE-189-11
- Mức độ: Suggestion
- Vị trí: trang in, ô Room và khối VietQR
- Vấn đề:
  - Guideline mục 3 đề xuất hiện tên phòng cho khách (Desk đã có "The Mist", "The Ivory"…), nhưng phiếu chỉ in "203".
  - Khối QR không có lời gọi hành động và không nhắc giữ nguyên nội dung chuyển khoản, trong khi đối soát dựa vào mã phiếu.
- Vì sao quan trọng: tên phòng làm phiếu mang chất OTTIMO. Khách sửa nội dung chuyển khoản sẽ làm lễ tân khó đối soát (D7).
- Đề xuất sửa:
  - Room: "The Mist · 203" (tên phòng Lora hoặc đậm, số căn mono nhỏ) khi có tên.
  - Đầu khối QR: "Scan to pay" / "Quét mã để thanh toán".
  - Dưới nội dung chuyển khoản: "Please keep this reference unchanged." / "Vui lòng giữ nguyên nội dung này."
  - Số tài khoản giữ 4 số cuối theo contract §7 (SEC).

## 2. Chữ chốt cho trang in (EN dẫn, VI hỗ trợ)

Khóa giữ tên của FE. Dòng có "mới" là khóa thêm. Giọng ngắn, lịch sự, không emoji, không IN HOA để hét.

| Khóa | EN (dòng chính) | VI (dòng phụ) | Ghi chú |
|---|---|---|---|
| `stmt.print.title` | Monthly statement | Phiếu thanh toán tháng | giữ |
| `stmt.print.guest` | Guest | Khách | giữ |
| `stmt.print.room` | Room | Phòng | đổi "Căn" → "Phòng" (chữ khách; "căn" là từ nội bộ) |
| `stmt.print.rent_period` (mới) | Rent period | Kỳ thuê | thay ô "Month", thẻ 02 |
| `stmt.print.utility_period` (mới) | Utilities & services | Điện nước, dịch vụ | giá trị dạng "01 – 31 Oct 2026" / "01/10 – 31/10/2026", thẻ 02 |
| `stmt.print.month` | – | – | bỏ khỏi phiếu (thẻ 02) |
| `stmt.print.issued` | Issued | Ngày phát hành | giữ |
| `stmt.print.col_desc` | Description | Nội dung | giữ |
| `stmt.print.col_reading` | Opening → Closing | Đầu kỳ → Cuối kỳ | đổi: khách thấy rõ đầu kỳ, cuối kỳ |
| `stmt.print.col_qty` | Usage / Qty | Tiêu thụ / SL | đổi: với điện nước cột này là tiêu thụ |
| `stmt.print.col_unit_price` | Unit price | Đơn giá | giữ (điện nước: giá chưa VAT) |
| `stmt.print.col_vat` (mới, in) | VAT | VAT | thuê, dịch vụ in `stmt.print.vat_incl` |
| `stmt.print.vat_incl` (mới) | incl. | đã gồm | thẻ 01 |
| `stmt.print.col_amount` | Amount | Thành tiền | giữ |
| `stmt.print.subtotal` | Subtotal | Cộng | đổi VI: "Tạm tính" nghe như số chưa chắc |
| `stmt.print.vat` | VAT on electricity and water | VAT điện, nước | đổi (thẻ 01) |
| `stmt.print.rounding` | Rounding | Làm tròn | giữ; số luôn âm, in dấu − |
| `stmt.print.total` | Total | Tổng cộng | giữ |
| `stmt.print.paid` | Paid | Đã thanh toán | đổi VI (góc nhìn khách) |
| `stmt.print.balance` | Balance due | Còn phải thanh toán | đổi VI (góc nhìn khách) |
| `stmt.print.pay_by` | Please pay by {date}. | Vui lòng thanh toán đến hết ngày {date}. | đổi VI ("trước hết ngày" mơ hồ) |
| `stmt.print.due_on_receipt` (mới) | Payment due on receipt. | Vui lòng thanh toán khi nhận phiếu. | thẻ 06 |
| `stmt.print.qr_title` (mới) | Scan to pay | Quét mã để thanh toán | thẻ 11 |
| `stmt.print.qr_amount` | Amount | Số tiền | giữ |
| `stmt.print.qr_content` | Transfer reference | Nội dung chuyển khoản | giữ |
| `stmt.print.qr_keep_ref` (mới) | Please keep this reference unchanged. | Vui lòng giữ nguyên nội dung này. | thẻ 11 |
| `stmt.print.qr_bank` | Account | Tài khoản nhận | đổi: dòng này gồm ngân hàng, chủ TK, 4 số cuối |
| `stmt.print.vat_note` | Rent and services include VAT. VAT on electricity and water is added at the rates shown. | Tiền thuê và dịch vụ đã gồm VAT. Điện, nước cộng VAT theo mức ghi trên phiếu. | đổi (khớp thẻ 01) |
| `stmt.print.contact` | Questions? Contact us | Cần hỗ trợ, vui lòng liên hệ | đổi: rõ mục đích, vẫn ngắn |
| `stmt.print.printed` | Printed {date} · {by} | – | giữ, chỉ EN (dòng nội bộ, chữ Stone Grey) |
| `stmt.print.paid_stamp` | Paid | Đã thanh toán | đổi VI |
| `stmt.print.void_stamp` | Void | Đã hủy | giữ |
| `bill.line.monthly_rent` | Rent · {from} – {to} | Tiền thuê {from} – {to} | thêm "·" ở EN |
| `bill.line.electricity` | Electricity · {month} | Điện tháng {month} | thêm tháng (thẻ 02); EN "Oct 2026", VI "10/2026" |
| `bill.line.water` | Water · {month} | Nước tháng {month} | như trên |
| `bill.line.statement_rounding` | Rounding | Làm tròn | giữ |
| `bill.line.statement_prior_adjustment` | Adjustment to previous statement | Điều chỉnh phiếu trước | đổi: khách hiểu hơn "prior period"; lý do vẫn không in |
| nhãn dịch vụ trên phiếu | {service} · {date} | {service} · {date} | bỏ "× n" (thẻ 07) |
| ghi chú thanh công cụ in (mới, Desk) | Switched to A4 to fit one page | Đã chuyển sang A4 để vừa một trang | thẻ 03 |

Chữ Desk thêm, theo thẻ: `meters.photo_pick` "Chụp hoặc chọn ảnh" / "Take or choose a photo"; `meters.photo_change` "Đổi ảnh" / "Change photo".

## 3. Kiểm brand (BẮT BUỘC) – kết quả

| Hạng mục | Kết quả |
|---|---|
| Màu chỉ 7 màu + giấy trắng, đúng 80/15/5 | ĐẠT. Nền Ivory/Cream/trắng; kẻ Oak đầu phiếu; viền Sage; quá hạn Earth Brown. Không có hex/rgb lạ (test quét `statements.css`) |
| Lora tiêu đề, Be Vietnam Pro nội dung, JetBrains Mono mã | ĐẠT (mã phiếu, chỉ số, nội dung chuyển khoản dùng Mono) |
| Cỡ chữ | CHƯA ĐẠT trên A5 (thẻ 03) |
| Giọng EN dẫn – VI hỗ trợ, không emoji | ĐẠT về cấu trúc; câu chữ chốt ở mục 2 (thẻ 05) |
| Không lộ dữ liệu khách | ĐẠT: chỉ họ tên + căn; liên hệ in là của khách sạn |
| Ngoài phạm vi PR (có sẵn trên Hôm nay) | Huy hiệu đỏ "7"/"2" và chip "Quá giờ trả phòng" màu đỏ là màu chức năng có từ trước, đã ghi ngoại lệ ở DS. Không tính cho #189 |

Kiểm phiếu khách hiểu được:

| Yêu cầu | Kết quả |
|---|---|
| Đầu kỳ, cuối kỳ | Có (cột Reading); đổi nhãn "Opening → Closing" |
| Tiêu thụ | Có (142 kWh, 3,4 m³) |
| Đơn giá, VAT | Có, nhưng không cộng khớp (thẻ 01) |
| Tiền thuê | Có |
| Dịch vụ phòng | Có, thiếu kỳ (thẻ 02, 07) |
| Làm tròn | Có (−690) |
| Tổng | Có |
| Hạn ngày 05 | Có; xem thẻ 06 |
| VietQR | Có: số tiền = còn phải thu, nội dung = mã phiếu |
| **Không có dòng hao hụt** | ĐẠT: S12 hiện hao hụt cho nhân viên ("không tính khách"); phiếu in không có |

## 4. Điểm làm tốt – nên giữ
- Trang in sạch, đúng tinh thần "Refined simplicity": kẻ Oak mảnh, cặp EN/VI xếp tầng, mã và chỉ số bằng Mono dễ dò. A4 và A5 cùng một bố cục.
- S12 xử lý thay đổi INV 17/11 gọn: "Cuối kỳ trước" chỉ để đối chiếu, câu hao hụt Earth Brown giải thích rõ "không tính cho khách", sau khi lưu gộp thành một dòng đọc nhanh.
- S16 bắt tick từng cảnh báo trước khi Phát hành, và quá hạn dùng Earth Brown thay đỏ. Đúng brand và không gây hoảng.

---

# Lượt 2 – 18/11/2026 (head `a34e03be`)

- Đầu vào:
  - trả lời FE trong `rounds/round-05/responses/FE-responses.md` (nhánh PR);
  - `gh pr diff 189` bản mới;
  - ảnh và PDF dữ liệu giả ở scratchpad: `r5-print-5lines-a5`, `r5-print-6lines-a5`, `r5-print-7lines-a4` (png + pdf), `r5-drawer-1280`, `r5-drawer-390`, `r5-meters-entry`, `r5-meters-below-dialog`, `r5-meters-saved`, `r5-today-attention`.
- Đo PDF: 5 dòng A5 = 1 trang (420×595 pt); 6 dòng A5 = 1 trang; 7 dòng A4 = 1 trang (595×842 pt).

## L2.0 Kết luận

**DUYỆT (UXD).** Đã đóng 4 Major và 6 Minor. 189-11 làm được một phần; phần còn lại (tên phòng) dời sang BE. Các thẻ mới bên dưới đều Minor/Suggestion, **không chặn gộp**. Nên làm trước tag phát hành; không kịp thì dời sang đợt sau.

## L2.1 Trạng thái thẻ lượt 1

| Thẻ | Trạng thái | Bằng chứng |
|---|---|---|
| 189-01 Major | **Closed** | 5 dòng A5: các dòng 8.500.000 + 568.000 + 85.000 + 150.000 + 150.000 = **9.453.000 = Cộng**; VAT điện, nước 49.690; Làm tròn −690; Tổng 9.502.000. Cột VAT "incl. / đã gồm". Ngăn S16 cùng cách |
| 189-02 Major | **Closed** | Có ô Rent period / Utilities & services; "Electricity · Nov 2026 / Điện tháng 11/2026"; bỏ ô Month |
| 189-03 Major | **Closed** | A5 9pt, dòng VI ≥ 7pt; ngưỡng 6 dòng; đo chiều cao > 194 mm thì chuyển A4. PDF 6 dòng A5 1 trang, 7 dòng A4 1 trang |
| 189-04 Major | **Closed** | 1280 và 390 px: bảng 3 cột, số tiền đủ, "Dời sang phiếu sau" ở hàng riêng |
| 189-05 Minor | **Closed** | Chữ in khớp bảng mục 2 (đã soát từng khóa trong `strings-*.json`) |
| 189-06 Minor | **Closed** | `due_on_receipt` khi phát hành sau hạn (đọc mã) |
| 189-07 Minor | **Closed** | "Extra cleaning · 12 Nov", không còn "× 1" |
| 189-08 Minor | **Closed** | Cùng danh sách, huy hiệu 8, viền Earth Brown, "Phiếu tháng quá hạn: 1 · 7.901.000 đ", link `?tab=overdue` |
| 189-09 Minor | **Closed** | Nút DS "Chụp hoặc chọn ảnh", ảnh nhỏ + tên tệp + "Đổi ảnh" |
| 189-10 Minor | **Closed** | Nháp: "Phiếu tháng" + chip |
| 189-11 Suggestion | **Done một phần → Deferred** | Đã có "Scan to pay" và câu giữ nguyên nội dung chuyển khoản. Tên phòng chờ BE trả `rooms[{roomNo, roomName}]` trong `BillingPeriodPrint`. ORC ghi backlog đợt sau |

Hai điểm về **bằng chứng**, không phải lỗi sản phẩm:
- **Ảnh 6 và 7 dòng in "Cộng 9.453.000"**, không khớp cột tiền (9.503.000 và 9.553.000). Đã truy nguyên:
  - `wrap.js` của FE chèn dòng giả và cộng thêm vào `totals.subtotalVnd`, nhưng khóa này không tồn tại; khóa đúng là `netVnd`.
  - Mã in đọc `totals.netVnd`, mock tính `netVnd` từ các dòng, nên dữ liệu thật vẫn khớp (ảnh 5 dòng đúng).
  - **Không dùng hai ảnh này để trình INV hay làm mẫu.** Muốn dùng thì sửa `wrap.js` (cộng vào `netVnd`) rồi chụp lại.
  - Đề nghị thêm một test: Cộng = tổng cột Thành tiền trên trang in (khóa bất biến của 189-01).
- **`r5-meters-below-dialog.png` giống hệt `r5-meters-entry.png`**: hộp thoại không được chụp. UXD rà hộp "đầu kỳ thấp hơn cuối kỳ trước" bằng mã và chữ (L2.3). QA chụp lại ở bước Kiểm thử.

## L2.2 Thẻ mới

### FB-R5-UXD-FE-189-12
- Mức độ: Minor
- Vị trí: trang in A5, dòng tiền thuê (`r5-print-5lines-a5.png`)
- Vấn đề: cột "Usage / Qty" và "Unit price" sát nhau, chữ "1 8.500.000" đọc như một số. Cột số trên A5 gần như không có khoảng cách.
- Vì sao quan trọng: khách có thể đọc nhầm số lượng thành một phần của đơn giá.
- Đề xuất sửa: `padding-left: 6pt` cho các cột số của `.stmt-table-print` (Qty, Unit price, VAT, Amount), hoặc thu hẹp cột Description. Kiểm lại PDF 6 dòng A5 vẫn 1 trang.
- Trạng thái: Open

### FB-R5-UXD-FE-189-13
- Mức độ: Minor
- Vị trí: `.stmt-qr-title` (khối VietQR)
- Vấn đề: "Scan to pay" và dòng VI "Quét mã để thanh toán" đều dùng Lora. Trong khi đó tiêu đề phiếu cho dòng VI dùng Be Vietnam Pro (`.stmt-title .vi`). Dòng VI Lora ở 7pt khó đọc dấu.
- Vì sao quan trọng: nhất quán hệ chữ. Guideline mục 6: tiêu đề phụ dùng Be Vietnam Pro SemiBold; Lora cho tiêu đề lớn.
- Đề xuất sửa: `.stmt-qr-title .vi { font-family: var(--sans); font-weight: 400; }`. Dòng EN giữ Lora, hoặc chuyển Be Vietnam Pro SemiBold; UXD chấp nhận cả hai.
- Trạng thái: Open

### FB-R5-UXD-FE-189-14
- Mức độ: Minor
- Vị trí: chữ Desk mới trong `gen_strings.py`, `MetersPage.tsx`
- Vấn đề và chữ chốt:

| Khóa | Hiện tại | Chốt VI | Chốt EN | Lý do |
|---|---|---|---|---|
| `meters.below_inline` | – | giữ | giữ | Rõ, đúng giọng |
| `meters.below_title`, `meters.below_body` | – | giữ | giữ | |
| `meters.save_anyway` | Vẫn lưu – số đã đúng | Vẫn lưu – số này đúng | Save anyway – this number is right | "đã đúng" nghe như hệ thống xác nhận |
| `meters.below_saved` | {gap} below the last closing – the statement asks to check it. | giữ VI | {gap} below the last closing – flagged on the statement. | EN gọn, đúng nghĩa |
| `meters.late`, `meters.late_fd`, `meters.late_reason` | – | giữ | giữ | Đúng vai: FD được nhắc nhờ lễ tân trưởng, FDL+ ghi lý do |
| `meters.checkin_enter`, `meters.checkin_title`, `meters.checkin_date`, `meters.checkin_date_range`, `meters.checkin_saved` | – | giữ | giữ | |
| `meters.checkin_help` | The meters when the guest checked in, with a photo… | Chỉ số đồng hồ lúc khách nhận phòng, kèm ảnh. Đây là đầu kỳ của tháng đầu tiên. | Meter readings at check-in, with a photo. This is the opening for the first month. | EN thiếu "readings"; VI thêm "Chỉ số" cho đủ nghĩa |
| `meters.last_closing_pending` | Cuối kỳ trước: nhập cuối kỳ trước | Cuối kỳ trước: nhập ô Cuối kỳ ở trên trước | Last closing: enter the closing above first | Câu hiện tại lặp chữ, không chỉ ra ô nào |
| `meters.ask_lead` trong hộp "đầu kỳ thấp hơn" | "Thay đồng hồ hoặc quay vòng cần lễ tân trưởng…" | khóa mới `meters.ask_lead_replaced`: Thay đồng hồ cần lễ tân trưởng. Nhờ lễ tân trưởng nhập giúp. | A replaced meter needs the front desk lead. Ask them to enter it. | Hộp này không có lựa chọn "quay vòng" |
| `stmt.warning.unknown` | Kiểm lại phiếu này trước khi phát hành. | Có cảnh báo chưa rõ ({code}). Kiểm lại phiếu trước khi phát hành. | Unrecognised warning ({code}). Check the statement before issuing. | Có mã để báo kỹ thuật; vẫn phải tick như FE làm |
| `stmt.paper_switched` | – | giữ | giữ | |

- Ngoài chữ: dòng "Đầu kỳ: 1.262" trong nhóm Cuối kỳ đang để cả nhãn bằng Mono. Nên để nhãn Be Vietnam Pro, chỉ số bằng Mono (như "Cuối kỳ trước: 1.404" ở dưới).
- Vì sao quan trọng: chữ Desk rõ thì lễ tân không hỏi lại. Mã cảnh báo lạ cần dấu vết để hỗ trợ.
- Trạng thái: Open

### FB-R5-UXD-FE-189-15
- Mức độ: Minor
- Vị trí: hộp thoại "Chỉ số nhận phòng" (`CheckinReadingDialog`, `useState('')` cho `readOn`)
- Vấn đề:
  - Ngày nhận phòng để trống, lễ tân phải tự chọn, trong khi đơn đã có ngày nhận phòng thật.
  - Phần còn lại của hộp thoại đạt: Modal DS, giới hạn ngày (trong tháng chốt, không sau hôm nay), điện + nước + ảnh bắt buộc, xử lý `OPENING_BELOW_PREVIOUS_CLOSING`, Hủy/Lưu đúng thứ tự.
- Vì sao quan trọng: bớt một thao tác và tránh chọn nhầm ngày, vì ngày này quyết định kỳ lẻ đầu tiên.
- Đề xuất sửa: điền sẵn bằng ngày nhận phòng của đơn khi ngày đó nằm trong tháng chốt; vẫn cho sửa. Ứng viên chưa có trường này thì lấy từ đơn, hoặc nhờ BE thêm `checkInDate` vào candidate.
- Trạng thái: Open

### FB-R5-UXD-FE-189-16
- Mức độ: Suggestion
- Vị trí: thanh công cụ trang in
- Vấn đề: ảnh 7 dòng mặc định A4 nhưng không hiện ghi chú. `stmt.paper_switched` chỉ hiện khi đo chiều cao tràn, không hiện khi chuyển do số dòng.
- Vì sao quan trọng: lễ tân quen A5 sẽ thắc mắc vì sao lần này là A4.
- Đề xuất sửa: hiện cùng ghi chú cho cả hai trường hợp.
- Trạng thái: Open

## L2.3 Rà nhanh màn mới / thay đổi

- **S12 hai nhóm Cuối kỳ M / Đầu kỳ M+1:**
  - đường kẻ đứt chia nhóm, nhãn nhóm chữ hoa nhỏ;
  - "(xem trước)" trước khi lưu, sau khi lưu là số server;
  - hao hụt màu Earth Brown;
  - cảnh báo "thấp hơn" trong khung nền kem viền Oak có icon.
  - Màu đều thuộc bảng 80/15/5. Đạt.
- **Hộp "đầu kỳ thấp hơn cuối kỳ trước":** ba lựa chọn (Nhập sai / Thay đồng hồ (FDL+) / Vẫn lưu) và nút Quay lại. Thứ tự đúng: an toàn nhất trước. Chỉ sửa câu nhắc FD (thẻ 14).
- **"Cần chú ý":** đạt 189-08. Huy hiệu đỏ và chip của các mục khác có từ trước, ngoài phạm vi PR.
- **Brand trên phiếu:** không thêm màu hay font ngoài bảng, không emoji, không in hao hụt, không in liên hệ khách. Footer gộp "Printed" cùng hàng liên hệ, gọn.
