# UXD review – FE PR #195 (`r5-fb012-fe-qa-fixes` @ `bb616403`): BUG-R5-009, 011, 012, 013

- Người review: UXD | Round 5 – bước **Phản hồi & sửa → review** | 18/11/2026
- Cách kiểm:
  - đọc `gh pr diff 195`: chữ `meters.*`, `params.grp_statement`, `params.stmt.*`, `error.READING_OUT_OF_WINDOW(_PAST_LATE)`; CSS `statements.css`; `statementParams.tsx`; `MetersPage.tsx`;
  - dựng worktree riêng ở scratchpad (`uxd-wt195`, detached tại `bb616403`, không đụng checkout chung), chạy mock Vite + MSW ở cổng 5371;
  - chụp bằng Chromium không giao diện với `qa.fd` (S12, trang in) và `qa.owner` (Tham số). Đồng hồ thật 18/11/2026;
  - ảnh FE `bug012-tab.png`, `bug012-dialog.png`, `bug011-before.png`;
  - ảnh và PDF chỉ nằm ở scratchpad, dữ liệu giả, không vào repo.
- Đối chiếu: `00-brief/context/brand/brand-guidelines.md`; `UXD-on-fe-pr-189.md` (ngưỡng A5 6 dòng, chặn tràn); BR-LS-01/07/08/10.

## 0. Kết luận

**DUYỆT (UXD).** Không có Blocker/Major. Các thẻ dưới đây là Minor/Suggestion; nên làm trước tag, không chặn gộp.

**A5 vẫn in một trang.** Đo PDF (`page.pdf`, `preferCSSPageSize`):

| Ca (phiếu giả TT-2610-302) | Khổ | Số trang PDF |
|---|---|---|
| 3 dòng | A5 | 1 |
| 4 dòng | A5 | 1 |
| 5 dòng | A5 | 1 |
| 6 dòng ngắn | A5 | 1 |
| 6 dòng, 1 nhãn dài xuống 2 hàng | tự sang A4 ("Đã chuyển sang A4 để vừa một trang") | 1 |
| 7 dòng | A4 | 1 |
| 6–7 dòng, 3 nhãn dài **3 hàng mỗi nhãn** (ca cực đoan) | A4 | **2** – thẻ 195-01 |

- Bảng không còn lấn lề trên A5: mép phải bảng trừ mép nội dung = −1 px ở mọi ca.
- Chặn tràn của #189 vẫn chạy với cột Nội dung xuống dòng.
- Ca 2 trang **không do #195**: #195 chỉ đổi CSS `.stmt-a5`, còn khổ A4 chưa bao giờ có chặn tràn.
- 189-11: tên phòng đã in ("The Ivory · 302").

Brand: không thêm màu hay font ngoài bảng; khung cảnh báo dùng tông warn của DS; không emoji.

## 1. Chữ – rà và chốt

| Khóa | Bản FE | Chốt VI | Chốt EN | Ghi chú |
|---|---|---|---|---|
| `meters.empty_month` | – | giữ | giữ | |
| `meters.checkin_due_title` | – | giữ | giữ | |
| `meters.closing_from` | Chốt cuối kỳ từ ngày {date}. / The closing reading opens on {date}. | Nhập cuối kỳ từ ngày {date}. | Closing reading from {date}. | "Chốt" trùng tiêu đề màn; câu EN gọn hơn. Xem thêm thẻ 195-03 |
| `meters.not_due` | – | giữ | giữ | |
| `meters.late_left` | …còn {n} căn chưa chốt… / {month}: {n} room(s) still without a closing reading (…) | giữ | Closing readings still missing for {month}: {n}. A late reading needs the front desk lead and a reason. | Tránh "room(s)"; tách hai câu cho dễ đọc |
| `meters.late_left_open` | – | giữ | giữ | |
| `error.READING_OUT_OF_WINDOW` | – | giữ | giữ | |
| `error.READING_OUT_OF_WINDOW_PAST_LATE` | Đã quá hạn ghi trễ cho ngày đọc này (hạn chốt {date}). Báo quản lý. | Đã quá hạn ghi trễ cho ngày đọc này (hạn chốt {date}). Vui lòng báo quản lý để xử lý. | This reading is past the late-entry limit (the window closed on {date}). Ask the manager to handle it. | "Báo quản lý." cụt; giọng lịch sự, không đổ lỗi |
| `params.grp_statement` | – | giữ | giữ | |
| `params.stmt.electricity`, `.water`, `.per_kwh`, `.per_m3`, `.price_help`, `.vat_electricity`, `.vat_water`, `.rent_timing`, `.rent_advance`, `.rent_arrears`, `.rent_help`, `.due_day`, `.rounding`, `.rounding_1`, `.partial`, `.partial_at_checkin`, `.partial_first_statement`, `.window_before`, `.window_after`, `.late_max`, `.range` | – | giữ | giữ | Rõ, đúng thuật ngữ BR-LS |
| `params.stmt.rounding_n` | Xuống {amount} đ / Down to {amount} VND | Làm tròn xuống {amount} đ | Round down to {amount} VND | Đứng riêng trong dòng tóm tắt vẫn hiểu (thẻ 195-04) |
| `params.stmt.price_value` | Điện … · Nước … (chưa VAT) | Điện {electricity} đ/kWh · Nước {water} đ/m³ | Electricity {electricity} VND/kWh · Water {water} VND/m³ | Tên tham số đã ghi "(chưa VAT)", không lặp |
| `params.stmt.vat_value`, `params.stmt.vat_help` | "8 %", "10 %" | dùng "8%", "10%" | dùng "8%", "10%" | Khớp phiếu in và ngăn S16 ("8%") |
| `params.stmt.due_value` | hạn ngày {day} | hạn thanh toán ngày {day} | payment due on day {day} | Thẻ 195-04 |
| `params.stmt.window_value` | chốt công tơ {before} ngày trước – {after} ngày sau cuối tháng, ghi trễ tối đa {late} ngày | giữ | giữ | |

## 2. Thẻ feedback

### FB-R5-UXD-FE-195-01
- Mức độ: Minor
- Vị trí: trang in, khổ A4 (`statements.css`, `StatementPrintPage.tsx`), có từ #189
- Vấn đề: không có chặn tràn cho A4.
  - Ca thử: 6–7 dòng, trong đó 3 nhãn dịch vụ dài 3 hàng (dùng `bill.line.extra_night_room`), cột Nội dung hẹp.
  - Kết quả: tờ cao 325–350 mm, PDF **2 trang**.
  - Đầu cột A4 cũng xuống hàng ("Opening → / Closing", "Usage / / Qty").
- Vì sao quan trọng: hiếm gặp với phiếu dài hạn, nhưng khi gặp thì khách nhận hai tờ, và lễ tân không được báo trước khi in.
- Đề xuất sửa:
  - (a) `.stmt-a4 .stmt-table-print th { white-space: nowrap; }` như A5;
  - (b) đo bản A4 như đã làm với A5: cao hơn 281 mm thì thanh công cụ hiện "Phiếu dài hơn một trang – kiểm lại trước khi in" / "Statement runs past one page – check before printing". Không tự cắt chữ.
  - Ca thực tế vẫn một trang (bảng ở mục 0), nên không chặn gộp.
- Trạng thái: Open

### FB-R5-UXD-FE-195-02
- Mức độ: Minor
- Vị trí: trang in, `lineText` trong `labels.ts`
- Vấn đề:
  - `labelKey` không có trong bảng chữ thì phiếu in **nguyên khóa** ("stmt.line.prior_adjustment", "stmt.line.service" trong `bug011-before.png`).
  - Ảnh đó dùng khóa giả của script đo. Nhưng chỉ cần BE thêm nhãn mới trước khi FE cập nhật chữ là khóa thô lên tờ khách.
- Vì sao quan trọng: đây là chữ khách đọc trên giấy thu tiền.
- Đề xuất sửa: khóa không dịch được thì dùng `description` nếu có; nếu không thì nhãn theo `kind`:
  - service: "Service" / "Dịch vụ";
  - prior_adjustment: "Adjustment to previous statement" / "Điều chỉnh phiếu trước";
  - rent: "Rent" / "Tiền thuê".
  - Thêm test cho nhánh này.
- Trạng thái: Open

### FB-R5-UXD-FE-195-03
- Mức độ: Minor
- Vị trí: S12 giữa tháng (ảnh UXD 18/11, căn 203 và 302)
- Vấn đề:
  - (a) Căn 203 hiện hai khung cảnh báo giống nhau "Chưa có chỉ số đầu kỳ của tháng này." (điện và nước) nhưng không có việc gì để bấm. Đầu kỳ 11 nằm ở màn tháng 10.
  - (b) "Chốt cuối kỳ từ ngày 30/11/2026." lặp 4 lần trên 2 căn.
- Vì sao quan trọng: cảnh báo không chỉ cách xử lý thì lễ tân không biết làm gì. Chữ lặp làm bảng nặng.
- Đề xuất sửa:
  - (a) Gộp thành một dòng cho cả hàng: "Chưa có đầu kỳ {month}. Nhập ở tháng {prev}." / "No opening reading for {month}. Enter it under {prev}.", kèm link mở tháng trước (như `meters.late_left_open`).
  - (b) Hiện `meters.closing_from` một lần trong câu hướng dẫn đầu bảng, mỗi hàng chỉ giữ chip "Chưa tới kỳ chốt".
- Trạng thái: Open

### FB-R5-UXD-FE-195-04
- Mức độ: Minor
- Vị trí: Tham số, giá trị tóm tắt của `monthly_statement_rules`
- Vấn đề:
  - Dòng tóm tắt "Thu trước · hạn ngày 5 · Xuống 1.000 đ · Thu khi nhận phòng · chốt công tơ…" ghép nhãn của ô chọn. Khi đứng riêng, "Xuống 1.000 đ" và "Thu khi nhận phòng" không rõ nói về gì.
  - Chữ hoa đầu cụm không đều.
- Vì sao quan trọng: chủ đầu tư đọc dòng này để biết luật đang chạy mà không mở hộp sửa.
- Đề xuất sửa: dùng chuỗi tóm tắt riêng, chữ thường đầu cụm. Ví dụ: "tiền thuê thu trước · hạn thanh toán ngày 5 · làm tròn xuống 1.000 đ · tháng lẻ thu khi nhận phòng · chốt công tơ 0 ngày trước – 1 ngày sau cuối tháng, ghi trễ tối đa 10 ngày".
  - Khóa mới: `params.stmt.sum_rent_advance` / `sum_rent_arrears` ("tiền thuê thu trước/thu sau" – "rent in advance/in arrears"), `sum_partial_at_checkin` / `sum_partial_first_statement` ("tháng lẻ thu khi nhận phòng / cộng vào phiếu đầu" – "part month at check-in / on the first statement").
  - Dùng `rounding_n` và `due_value` đã chốt ở mục 1.
- Trạng thái: Open

### FB-R5-UXD-FE-195-05
- Mức độ: Suggestion
- Vị trí: bảng Tham số, cột "Quy tắc" (`bug012-tab.png`)
- Vấn đề: mã "BR-LS-07", "BR-LS-08" xuống hàng giữa mã ("BR-LS-" / "07").
- Vì sao quan trọng: mã quy tắc bị cắt khó dò.
- Đề xuất sửa: `white-space: nowrap` cho ô mã quy tắc.
- Trạng thái: Open

## 3. Điểm làm tốt – nên giữ
- S12 mở đúng tháng đang có việc. Thông báo ghi trễ tháng trước có số căn và nút mở tháng đó. Chip "Chưa tới kỳ chốt" thay ô nhập giữa tháng, tránh nhập sớm.
- Hộp sửa tham số theo từng ô: có đơn vị (đ/kWh, ngày), dòng giới hạn "Từ … đến …" dưới ô, lỗi 422 nằm đúng ô. Dễ hơn nhiều so với sửa JSON.
- Sửa A5 nhỏ và đúng chỗ: chỉ cột Nội dung được xuống dòng, đầu cột giữ một hàng, chặn tràn vẫn hoạt động.
