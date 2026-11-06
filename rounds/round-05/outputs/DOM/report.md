# Báo cáo DOM – Round 5, Gói 0–2, bước Sản xuất và Review (06/11/2026)

ORC lưu tệp này từ báo cáo bàn giao của DOM (subagent không ghi tệp báo cáo). Chi tiết ở `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 0–11.

## 1. Đã làm gì
- **QC R4 ĐK-6 và V5-1A:**
  - `night_from_month_divisor` vẫn chạy ở đường API, giữ 12, không sửa;
  - giá đêm bắt buộc, thiếu thì 422 (BR-101 (5)).
- **V5-11:** trả sớm và phí giữ lại trong khung 00:00–05:59: BR-010, 309, 311, 428.
- **V5-16:** chọn đề xuất (a) của SEC, thêm phần báo cáo (b), thành BR-438 mới.
  - Lễ tân chỉ sửa giảm thẳng được dòng chính mình nhập tay trong ngày nghiệp vụ hiện tại.
  - Mọi trường hợp khác đi đường FOC có duyệt.
- **V5-30:** chỉ chốt cấu trúc, không có số. 4 điểm bảng nội bộ để ngỏ thành ESC-051.
- **V5-31:** khóa phí dọn theo căn, giá công khai.
- **"Chốt:" cho ARC 0.3.13** (`rules-v1.0.5.md` mục 7): V5-15, 16, 30, 31, 58, 11.
  - SEC ARC-03 (V5-15): chọn (a). Quản lý tự trả phòng được khi bỏ tối đa 1 đêm; từ 2 đêm thì chỉ chủ đầu tư. Lý do: khớp hạn mức quản lý 1 đêm mỗi lần INV chọn ở ESC-007 A.
  - Kèm audit `nightsNotBilled` và lọc `overdueOnly`. Không migration.
- **Cho UXD (mục 8):**
  - G6: một câu chung cho `penalty` và `damage`;
  - `hold_expiry_reminder_hours` = 0 nghĩa là không nhắc;
  - 29 tên khóa đúng nghĩa, đã vào từ điển bản 1.2;
  - `weekend_nights` phải ở dạng `["FRI","SAT"]`: sửa bộ kiểm khi lưu, không sửa bộ tính giá;
  - thẻ mới FB-R5-DOM-UXD-01 (Major): câu "Bạn sẽ được nhắc…" ở `sale.hold_next_*` sai, vì sale và CTV không có chỗ nhận tin.
- **CPY thẻ 04 (mục 10):** ca sửa thẳng dòng phụ thu thay đêm xảy ra được. Dùng `bill.line.late_fee_after_limit` khi số tiền khác `limit_ref_vnd`.
- **Tờ 2a lượt 2: CHƯA IN.**
  - Thẻ 02–06 đóng. Thẻ 01 đóng một phần; DOM đồng ý chỗ PO đổi thành "báo chủ đầu tư".
  - Thẻ mới 07 (Major): nút "Tất cả" chỉ hiện 100 đơn đầu theo ngày đến, không có "xem thêm". Tin tự hủy chỉ tới người tạo đơn, mà sale và CTV không nhận tin ở đâu. Đề xuất rà theo mã đơn ghi trong sổ giao ca.
  - PO áp đúng "bản gộp" ở thẻ 07 thì in được, không cần DOM đọc lại.
  - Luật A.5 đổi: tin `hold_expired` gửi thêm lễ tân và lễ tân trưởng (mục 9, việc BE).
- **Tiền về mà giữ chỗ đã tự hủy (mục 11):** chọn (a).
  - Lễ tân kiểm tiền theo mã đơn trước khi hủy hoặc báo khách.
  - Tiền đã về: còn căn thì đặt lại cùng căn, cùng giá; căn đã bán thì chủ đầu tư hoàn đủ theo sao kê.
  - Đây là lỗi phần mềm: QA ghi bug (đề xuất P2), PO xếp việc BE.

## 2. File tạo/sửa
- `product/docs/tham-so-quy-tac.md`, `.json`: bản 1.1 rồi 1.2.
  - Mục divisor, mục "Sắp có ở v1.0.5".
  - 29 tên tham số, `c3_stepup_minutes`, `hold_expiry_reminder_hours`.
  - `weekend_nights`, `min_stay`, `rounding.night_rate`, đoạn "các cặp phải đổi cùng nhau".
- `product/docs/business-rules.md` v0.5.12: BR-010, 101, 204, 212, 309, 311, 428, 438 (mới), 506, 903, mục 13, mục 18.
- `product/tests/fixtures/br-examples.json`: thêm dòng oracle. Validator OK (0 lỗi, 1 cảnh báo).
- `02-escalations/ESC-051.md` (mới), `02-escalations/escalations-index.md`.
- `01-decisions/decision-log.md`: 10 dòng DOM.
- `rounds/round-05/outputs/DOM/rules-v1.0.5.md`: mục 0–11.
- `rounds/round-05/reviews/DOM-on-staff-one-pager-2a.md`: lượt 1, lượt 2, thẻ 07 bản gộp, mục 4.4.
- Commit trên `main`, đều đã push: 6085138d, e5c7904a, a4e2cb3e, 3e758b31, ca6ba1bf, 330652be, 27234d33, 15c96404.

## 3. ESC mới và giả định
- **ESC-051** (Cao, hạn 20/11/2026): 4 câu về bảng hoa hồng nội bộ; đội đề xuất A cả 4. Tệp không có tỷ lệ, số tiền hay ranh giới khoảng nào. Không chặn v1.0.5.
- Giả định:
  - [GIẢ ĐỊNH – chờ INV] ESC-051 theo A.
  - Tên khóa và mã lỗi mới là đề xuất; ARC chốt.
  - Tỷ lệ đợt 1 cộng đợt 2 bằng 100 %.
  - Ngưỡng cảnh báo sửa giảm dùng chung `foc_alert_count_per_approver`.
  - Trần 1 đêm ở V5-15 là hằng số theo BR-433, không thêm tham số.
- Việc chủ đầu tư làm trên Desk sau khi v1.0.5 lên:
  1. Dán `long_stay_cleaning_fee_by_room` (giá công khai, bảng 01/11).
  2. Tự nhập `long_stay_commission` và `manager_performance_bonus_pct` theo bảng nội bộ; không gửi số cho đội.
  3. Nhập cùng một số cho hai khóa con của `short_stay_commission_pct`.
  4. Kiểm `commission_payable_day`, `commission_pay_by_day` khớp ngày trả lương.
  5. Không sửa `night_from_month_divisor`.
  6. Kiểm giá đêm các căn đã tạo bằng API.
  7. Không sửa `weekend_nights` tới khi sửa xong BUG-R5-001.

  Mục 2 và 3 phải xong trước kỳ chốt 01/12.

## 4. Rủi ro
- Chưa xong diễn tập khôi phục (V5-61) thì migration danh mục của V5-30/31 tách sang bản riêng trước 01/12. Tới đó, hoa hồng thuê tháng và thưởng quản lý tính ngoài Desk.
- In Tờ 2a khi chưa áp bản gộp thẻ 07: khách có giữ chỗ tự hủy có thể không được báo.
- Sale và CTV hiện không nhận được nhắc hạn lẫn tin tự hủy.

## 5. Việc chưa xong (ORC giao)
- QA: ghi bug "tiền cọc về cho giữ chỗ đã tự hủy" (mục 11.3).
- PO:
  - xếp việc BE đổi người nhận tin `hold_expired` (mục 9);
  - xếp việc BE ghi tiền cho đơn đã tự hủy, khôi phục đơn hoặc hoàn (mục 11.4);
  - áp bản gộp thẻ 07 vào Tờ 2a.
- UXD/CPY:
  - thẻ FB-R5-DOM-UXD-01;
  - chữ G6 gồm bồi thường hư hỏng.
- BE-B: nhãn `late_fee_after_limit`.
- ARC: điểm còn mở ở mục 7.1 và 11.4.
- DOM: lần sửa BR tới thêm "và lễ tân" vào BR-303.
