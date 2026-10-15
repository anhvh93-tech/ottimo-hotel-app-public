# PO review DOM – Round 1, bước 3

- Người review: PO | Ngày: 15/10/2026
- Đối tượng: `product/docs/business-rules.md` (v0.1), `product/docs/baseline-issues-triage.md` (v0.1)
- Góc nhìn: quy tắc có đủ rõ để viết AC cho story Must R2 không, có khớp PRD/backlog không, chính sách nào đang bị "chốt ngầm" mà chưa đưa cho INV. Đã đối chiếu thêm `state-machines.md`, `architecture.md` mục 9.1, `test-strategy.md` mục 4, wireframe L3/L9 và báo cáo QA (mục 4: #1, #4, #5, #10).
- Tổng: **0 Blocker · 4 Major · 4 Minor · 1 Suggestion**

---

### FB-R1-PO-DOM-01
- Mức độ: Major
- Vị trí: `business-rules.md` BR-804 (cột ví dụ), so với BR-002 và BR-904
- Vấn đề: BR-002 quy định một đơn chiếm khoảng nửa mở **[ngày đến, ngày đi)**. Ví dụ của BR-804 lại viết "khóa 15–17/10 → 3 đêm không bán", tức coi ngày cuối là đêm bị khóa (khoảng đóng). Dữ liệu mẫu BL 4.4 dùng khoảng nửa mở: căn 401 khóa ngày 0–2 (đêm 15 và 16), còn đơn OTM-0154 bán từ 17/10. Nếu code theo ví dụ BR-804 thì khối OOO trùng với OTM-0154. Nếu code theo BL thì ví dụ "đêm khả dụng 310 − 3 = 307" ở BR-804 và BR-904 sai (DATA đã chép số 307 vào K-01 và K-03). QA cũng ghi P1 (report QA mục 4 #1). OpenAPI `RoomBlockCreate.endDatePlanned` chưa nói rõ có gồm ngày cuối hay không.
- Vì sao quan trọng: đây là chỗ giao giữa "chống đặt trùng" (S1 = 0, US-018, US-019) và "đêm khả dụng" (G1, K-01). Hiểu khác nhau thì hoặc bán trùng phòng đang sửa, hoặc mất 1 đêm bán mỗi lần khóa phòng.
- Đề xuất sửa: ghi rõ trong BR-804: khối OOO dùng **cùng quy ước [ngày bắt đầu, ngày mở bán lại)** như BR-002, trường kết thúc là "ngày mở bán lại". Sửa ví dụ thành một trong hai cách cho nhất quán, ví dụ "khóa 15/10 → mở bán 17/10 = 2 đêm (15, 16) → 310 − 2 = 308", hoặc giữ 3 đêm thì ghi "15/10 → mở bán 18/10". Sửa cùng số ở BR-904. Báo DATA (K-01, K-03), ARC (`endDatePlanned`) và QA (DS-0) để cập nhật theo.
- Trạng thái: Open

### FB-R1-PO-DOM-02
- Mức độ: Major
- Vị trí: `business-rules.md` BR-603 (cột ví dụ) và mục 14 tình huống S3, S8; mục 17 dòng giả định hạn khai báo người nước ngoài
- Vấn đề: quy tắc nói app hiển thị hạn **sớm hơn** giữa "giờ nhận + 12 giờ" và "23:00 ngày đến" (chế độ `earlier_of`, cũng là dòng đề xuất decision-log ở mục 17). Nhưng ví dụ "nhận 21:30 → hạn 09:30 hôm sau" lại là chế độ "chỉ tính 12 giờ". Theo `earlier_of` thì kết quả phải là 23:00 cùng ngày. ARC (architecture 9.1) và QA (TC-L3-046, report QA #4) đều đã vấp phải chỗ này. Tình huống S3 "đến 01:30 → hạn 13:30 hôm sau" chưa nói khách đến sau 23:00 thì tính "ngày đến" ra sao.
- Vì sao quan trọng: đây là hạn pháp lý, nằm trong chỉ số S2 và mục tiêu G5. Ví dụ là "oracle" của test (`br-examples.json`, test-strategy 2.1). Ví dụ sai thì test sai theo, và lễ tân có thể khai trễ hạn.
- Đề xuất sửa: viết lại các ví dụ BR-603 theo chế độ mặc định `earlier_of`, gồm 3 ca: nhận 08:00 → 20:00; nhận 21:30 → 23:00; nhận 01:30 (sau nửa đêm, khách đến muộn) → nêu rõ cách tính, ví dụ áp như BR-602 "đến sau 23:00" thì lấy giờ nhận + 12 giờ. Ghi thêm một dòng "chế độ `hours_only` (nếu luật sư xác nhận): nhận 21:30 → 09:30". Sửa S3 và S8 cho khớp. PO sẽ đưa đúng hai chế độ này vào ESC-001.
- Trạng thái: Open

### FB-R1-PO-DOM-03
- Mức độ: Major
- Vị trí: `business-rules.md` BR-411, BR-412 (cơ sở "% trên giá đêm của đêm đầu/cuối"), BR-415 (khách OTA)
- Vấn đề: BR không nói phụ thu nhận sớm/trả muộn của **đơn OTA** tính trên giá nào: giá OTA trên đơn (đã gồm hoa hồng kênh), giá trực tiếp hiện hành của đêm đó, hay giá niêm yết. Chính các tài liệu đang hiểu khác nhau. Wireframe L3 mục 3.4 tính phụ thu cho Ji-woo (Booking.com, 820.000/đêm theo backlog US-017 và DS-0 OTM-0153) là "30% × 792.000" (giá niêm yết căn 203). Còn BR-421 với đơn OTA gia hạn thì lại dùng "giá trực tiếp hiện hành".
- Vì sao quan trọng: khách OTA là nhóm đông nhất (6–7 kênh), và phụ thu là khoản thu trực tiếp tại quầy. Cùng một khách nhưng ba cách tính cho ba con số khác nhau thì dễ tranh cãi với khách và lệch giữa folio với test. Story Must R2 bị ảnh hưởng: US-026, US-029.
- Đề xuất sửa: thêm một câu vào BR-415, ví dụ "cơ sở phụ thu của đơn OTA = giá kênh Trực tiếp hiện hành của đêm đó (cùng nguồn giá với BR-421)", hoặc phương án khác DOM thấy đúng ngành. Gắn nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` và thêm 1 ví dụ số cho đơn OTA. PO sẽ gom vào ESC-007 (phụ thu).
- Trạng thái: Open

### FB-R1-PO-DOM-04
- Mức độ: Major
- Vị trí: `business-rules.md` BR-605, BR-402; so với `state-machines.md` K5, SEC R-REG-03, wireframe L3 mục 3.2, `design-system.md` mục 6.4
- Vấn đề: BR-605 chỉ quy định cách **kiểm** (hộ chiếu còn hạn sau ngày trả phòng, thị thực còn hạn) mà không nói **hệ quả khi kiểm "Không đạt"**: có được nhận phòng không, ai được quyết. Hiện BA, SEC và UXD đã tự chốt là "không chặn, lễ tân trở lên ghi cách xử lý" (K5, R-REG-03, L3 3.2). Đây là chính sách kinh doanh kèm pháp lý (nhận khách người nước ngoài có hộ chiếu/thị thực hết hạn) mà chưa có nhãn và chưa có trong ESC nào.
- Vì sao quan trọng: nếu chính sách thật là "phải chặn" hoặc "phải quản lý duyệt" thì luồng nhận phòng R2 (US-025, US-043) và wireframe phải làm lại. Protocol mục 8 yêu cầu chính sách và pháp lý phải do INV quyết.
- Đề xuất sửa: thêm vào BR-605 (hoặc một BR mới) hệ quả theo từng loại: hộ chiếu hết hạn trước ngày trả phòng / thị thực hết trước ngày đi / thiếu dấu nhập cảnh → mặc định đội đề xuất (ví dụ: không chặn với thị thực ngắn hơn lưu trú vì BR-605 đã có cách khai; còn hộ chiếu **đã hết hạn tại ngày nhận** thì phải lễ tân trưởng trở lên xác nhận). Gắn nhãn `PHÁP LÝ – cần xác nhận`. PO sẽ thêm câu hỏi này vào ESC-001.
- Trạng thái: Open

### FB-R1-PO-DOM-05
- Mức độ: Minor
- Vị trí: `business-rules.md` BR-607
- Vấn đề: danh sách trạng thái khai báo thiếu `void`. Trong khi đó SM-05 (`state-machines.md` dòng 41), backlog US-021 AC3, US-136 AC2 và wireframe đều dùng "khai báo → `void`" khi đơn hủy hoặc no-show (report QA #10).
- Vì sao quan trọng: QC B1 yêu cầu một bộ tên trạng thái thống nhất giữa BR, BA, ERD, OpenAPI và wireframe. Mà BR lại là nguồn sự thật.
- Đề xuất sửa: thêm "`void` (đơn hủy/không đến trước khi khai xong)" vào BR-607, đúng thứ tự như SM-05.
- Trạng thái: Open

### FB-R1-PO-DOM-06
- Mức độ: Minor
- Vị trí: `business-rules.md` BR-609, BR-610; so với SEC T01 và job J16 (`architecture.md`)
- Vấn đề: BR-609 viết khách không đồng ý thì "không lưu ảnh". SEC T01 lại viết "xóa trong 24 giờ", còn job J16 chạy lúc 03:00. Ba nơi nói ba thời điểm khác nhau (report QA #5), trong khi US-049 (Must R2) cần một kết quả kiểm được.
- Vì sao quan trọng: đây là AC của story Must R2 và là cam kết với khách về dữ liệu cá nhân (Nghị định 13/2023).
- Đề xuất sửa: thống nhất với SEC một câu cho BR-609, ví dụ "ảnh của khách không đồng ý chỉ giữ tới khi ghi mã hồ sơ khai báo, xóa muộn nhất 24 giờ sau đó". ARC và QA theo đó chỉnh J16 và TC-L3-070…072.
- Trạng thái: Open

### FB-R1-PO-DOM-07
- Mức độ: Minor
- Vị trí: `baseline-issues-triage.md` mục 2, dòng #14 (cột Round "R2") và #15 (R2–R3)
- Vấn đề: lỗi #14 (độ đầy đủ hồ sơ, BR-955) được xếp R2. Nhưng PRD M7 và backlog để "độ đầy đủ hồ sơ" ở R3 (US-078 không phải Must R2), và QA cũng không viết TC vì lý do này (r1-main-flows mục 11). Lỗi #16 (gộp hồ sơ) ghi R2–R3 trong khi ERD để gộp hồ sơ ở R3.
- Vì sao quan trọng: cột Round của bảng phân loại được ORC và QC dùng để kiểm A5 và lập plan R2. Lệch round sẽ làm dev R2 tưởng phải làm.
- Đề xuất sửa: #14 → R3 (theo US-078). #16 → R3 (PO sẽ chuyển US-023 AC2 sang story gộp hồ sơ R3, xem PO-on-QA phần tự nhận lỗi). #15 giữ R2 cho phần chặn trùng SĐT/email (US-072), còn so khớp gần đúng tên ghi R3.
- Trạng thái: Open

### FB-R1-PO-DOM-08
- Mức độ: Minor
- Vị trí: `business-rules.md` BR-805
- Vấn đề: viết "Căn VC/VI quá 3 ngày chưa có khách → tự về VC". Từ VC về VC thì không có gì thay đổi, nên câu này đọc không ra ý.
- Vì sao quan trọng: BA dùng câu này cho SM-03 và QA dùng cho TC-L6-029. Câu mơ hồ thì mỗi bên làm một kiểu.
- Đề xuất sửa: "Căn **VI** quá 3 ngày chưa giao khách → chuyển **VC** (cần kiểm lại trước khi giao)". VC không đổi.
- Trạng thái: Open

### FB-R1-PO-DOM-09
- Mức độ: Suggestion
- Vị trí: `business-rules.md` BR-215; so với `metrics-definitions.md` Q-10
- Vấn đề: BR-215 viết doanh thu dài hạn = "tiền thuê tháng ÷ số đêm của **tháng lịch**". DATA (Q-10, đã ghi rõ quyền "DATA chốt") chia theo **tháng hợp đồng**, để tổng tiền của HĐ bắt đầu giữa tháng vẫn đúng. Hai cách cho cùng kết quả khi HĐ bắt đầu ngày 1, nhưng khác nhau ở các trường hợp còn lại.
- Vì sao quan trọng: hai tài liệu "nguồn sự thật" mà nói khác nhau thì dễ gây nhầm khi làm báo cáo R3.
- Đề xuất sửa: BR-215 chỉ giữ nguyên tắc ("phân bổ theo đêm, dòng tiền theo dõi riêng") và trỏ sang `metrics-definitions.md` Q-10 cho công thức, bỏ cụm "tháng lịch".
- Trạng thái: Open

---

## Điểm làm tốt
1. **Một nguồn sự thật có nhãn rõ ràng**: mỗi BR đều có nhãn NGÀNH / GIẢ ĐỊNH / PHÁP LÝ và nguồn, kèm bảng tham số mục 13 có khóa tiếng Anh. Nhờ vậy PRD và backlog chỉ cần tham chiếu mã BR, đáp ứng QC B3. PO đã tự tính lại các ví dụ số BR-107, 203, 208, 212, 305, 309, 313 và thấy đều khớp.
2. **Bảng phân loại đủ 30/30 lỗi BL 8.2**, mỗi lỗi có BR, vai xử lý và round, có thêm 8 vấn đề mới (X-01…X-08). Đặc biệt X-01 (hạn khai báo người nước ngoài) và X-02 (mâu thuẫn phí dài hạn giữa BL và Brief) là những phát hiện mà đọc riêng BL sẽ không thấy.
3. **Mục 16 soạn sẵn phương án, ưu nhược và khuyến nghị** cho từng câu hỏi chính sách. PO gom được thẳng thành ESC-004…ESC-008 mà không phải tự nghĩ phương án.
