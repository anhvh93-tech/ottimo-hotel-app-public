# PO review UXR – Round 1, bước 3

- Người review: PO | Ngày: 15/10/2026
- Đối tượng: `product/docs/research/personas.md`, `journeys.md`, `heuristic-review-r0.md` (v0.1)
- Góc nhìn: nghiên cứu có phục vụ mục tiêu PRD (G1–G5, S1–S12) và story Must R2 không, có đẩy phạm vi phình ra không, có mâu thuẫn với quy tắc DOM đã chốt sau đó không. Đã đối chiếu `business-rules.md`, PRD mục 3–5, `rbac-matrix.md`, BL mục 2.
- Tổng: **0 Blocker · 2 Major · 3 Minor · 1 Suggestion**

---

### FB-R1-PO-UXR-01
- Mức độ: Major
- Vị trí: `journeys.md` J3, dòng 10:30 "Khách xin nhận sớm", cột Cơ hội
- Vấn đề: cơ hội được đề xuất là "Giờ mặc định = **giờ thực**, hiển thị phí và cho gửi yêu cầu duyệt FOC". Điều này ngược với chính phát hiện Blocker HR-04 của UXR ("mặc định không có phụ thu") và ngược với BR-414 / BL 8.2 #2 (ô giờ mặc định = **giờ chuẩn**, không tự áp phụ thu).
- Vì sao quan trọng: nếu giữ nguyên câu này, lỗi sai tiền BL 8.2 #2 có thể quay lại. Journeys là đầu vào của UXD, FE và QA, và theo protocol thì sai tiền là mức Blocker ở sản phẩm.
- Đề xuất sửa: đổi thành "Giờ mặc định = giờ chuẩn (BR-414); lễ tân bật 'Khách nhận sớm' rồi nhập giờ, thấy phí theo BR-411, tick 'đã báo khách'; nếu miễn phí thì gửi duyệt FOC (BR-432)". Rà lại toàn bộ cột Cơ hội để không còn câu nào trái HR-04.
- Trạng thái: Open

### FB-R1-PO-UXR-02
- Mức độ: Major
- Vị trí: `journeys.md` phần đầu J3 ("hạn khai báo 23:00 (BL 5.12)"), dòng 14:00–15:00; mục 5 O-01 ("nhắc hạn 23:00 theo mốc"); `personas.md` P2 dòng Mục tiêu và Thước đo ("100% khai báo trước 23:00"), P1 dòng Điểm đau
- Vấn đề: mọi chỗ đều dùng một mốc 23:00 cho mọi khách. Trong khi BR-603 (DOM, cùng round) đã chốt giả định: với người nước ngoài, hạn là mốc **sớm hơn** giữa "giờ nhận + 12 giờ" và "23:00", ví dụ nhận 08:00 thì hạn là 20:00 cùng ngày. O-01 là cơ hội số 1 trong danh sách ưu tiên mà vẫn ghi theo quy tắc cũ của BL.
- Vì sao quan trọng: hạn khai báo là nghĩa vụ pháp lý (G5, S2). Lễ tân quen mốc 23:00 chính là tình huống rủi ro S8 mà DOM đã nêu. UXD và QA đọc journeys để thiết kế nhắc việc và viết test.
- Đề xuất sửa: thay "23:00" bằng "hạn theo BR-602 (VN) / BR-603 (NN – có thể sớm hơn 23:00)" ở J3, O-01, P1, P2. Thước đo P2 đổi thành "100% khai báo đúng hạn (S2)".
- Trạng thái: Open

### FB-R1-PO-UXR-03
- Mức độ: Minor
- Vị trí: `personas.md` mục 0 và P3, P2, P1; so với PRD mục 4 (U1–U4), BL mục 2, `rbac-matrix.md` mục 1
- Vấn đề: cơ cấu nhân sự trong persona khác với PRD và RBAC. (a) P3 "Chú Bảy" là một người kiêm buồng phòng và bảo trì, 45–58 tuổi, trong khi BL ghi 2 nhân viên buồng phòng (Chị Lan, Chị Mai) và 1 kỹ thuật (Anh Tùng), còn RBAC tách `housekeeping` và `maintenance`. (b) Không có persona cho `manager` (Quản lý anh Hoàng Anh), là người duyệt FOC, hoàn tiền, khôi phục no-show. (c) P2 kiêm sale, trong khi `sales_staff` là vai riêng. Wireframe L1 đã phải ghi chú "persona P3 = housekeeping + maintenance".
- Vì sao quan trọng: giao diện L6 và menu gộp có thể được tối ưu cho một người kiêm hai vai, trong khi thực tế có thể là 3 người khác nhau. Thiếu persona quản lý thì luồng duyệt (US-007, ESC-007) không có người dùng mục tiêu rõ.
- Đề xuất sửa: thêm bảng ánh xạ "persona ↔ nhóm PRD U1–U5 ↔ mã vai RBAC ↔ người thật trong BL". Thêm biến thể P3 (2 nhân viên buồng phòng nữ, không kiêm sửa chữa) và một dòng biến thể "Quản lý" trong P1. Thêm giả thuyết H-21 "buồng phòng và kỹ thuật là người khác nhau" vào nhóm Cao (đi cùng H-05).
- Trạng thái: Open

### FB-R1-PO-UXR-04
- Mức độ: Minor
- Vị trí: `personas.md` P7 dòng Thước đo ("≥ 60% khách OTA hoàn tất check-in online"); P6 dòng Nhu cầu ("nhắc visa/tạm trú trước 30 ngày"); `journeys.md` J2-7 ("Nhắc visa 30 ngày trước")
- Vấn đề: con số trong persona khác với nguồn sự thật. PRD S5 đặt đích **≥ 40%**. BR-605 nhắc gia hạn thị thực trước **14 ngày** (`visa_expiry_warning_days`).
- Vì sao quan trọng: QC B3 yêu cầu số quy tắc chỉ lấy từ BR, còn đích chỉ số lấy từ PRD. Đội sẽ không biết nên làm theo 30 hay 14 ngày, 40% hay 60%.
- Đề xuất sửa: P7 ghi "đích S5 (PRD); giả thuyết H-11: có thể đạt 60% với khách OTA". P6 và J2-7 ghi "nhắc theo BR-605 (tham số)". Nếu UXR có lý do để đề xuất 30 ngày thì gửi DOM một thẻ riêng, không sửa số trong persona.
- Trạng thái: Open

### FB-R1-PO-UXR-05
- Mức độ: Minor
- Vị trí: `journeys.md` mục 5 (bảng O-01…O-12); J3 15:00 "Kết ca"; J4 14:30 "nói giọng nói"; J2-9 "mã giới thiệu"; `personas.md` P6 "USDT", H-12
- Vấn đề: (a) Bảng cơ hội chưa gắn với story US-xxx và round, nên PO không kiểm được cơ hội nào đã có trong backlog. (b) Một số ý đang vượt phạm vi MVP mà không ghi rõ: bàn giao ca/kết ca (PRD X3 – ca làm việc ngoài phạm vi), nhập giọng nói, mã giới thiệu, thanh toán USDT (PRD X9 – chỉ thu VND).
- Vì sao quan trọng: nhìn bảng ưu tiên, UXD hoặc dev có thể tưởng các ý này đã được chọn làm, gây phình phạm vi R2.
- Đề xuất sửa: thêm cột "Story / Round" vào bảng mục 5. Ví dụ: O-01 → US-025, 042–047 (R2); O-05 → US-125 (R2); O-10 → BR-427 (R3); O-11 → "ngoài MVP – PRD X3, chờ H-20". Các ý giọng nói, mã giới thiệu, USDT ghi "ngoài MVP / ý tưởng sau R4". H-12 bỏ USDT, chỉ hỏi "khách trả bằng cách nào trong các cách VND hiện có".
- Trạng thái: Open

### FB-R1-PO-UXR-06
- Mức độ: Suggestion
- Vị trí: `personas.md` mục 9; `heuristic-review-r0.md` mục 6 (việc R2)
- Vấn đề: giả thuyết H-05 (buồng phòng tự dùng app) đã được đánh giá là rủi ro cao nhất, nhưng việc kiểm chứng phụ thuộc hoàn toàn vào việc INV chọn phương án A của ESC-003.
- Vì sao quan trọng: app buồng phòng là story Must R2 (EP07). Nếu sai giả thuyết thì cả phân hệ phải làm lại.
- Đề xuất sửa: soạn sẵn một phiếu thử 15 phút dùng chính wireframe L6 (3 việc: xem việc hôm nay, bấm "Dọn xong", báo hỏng có ảnh) cùng tiêu chí đạt/không đạt, để INV làm ngay khi đọc round-summary R1, kể cả khi chưa trả lời hết ESC-003.
- Trạng thái: Open

---

## Điểm làm tốt
1. **Trung thực về độ tin cậy**: đầu mỗi file đều có nhãn "Mô phỏng – cần INV kiểm chứng", persona có cột "mức tin cậy", và 20 giả thuyết H-xx đều có cách kiểm chứng, tiêu chí xác nhận, mức ưu tiên. Đáp ứng đúng QC A16 và đủ để soạn ESC-003.
2. **Heuristic review có bằng chứng đo được**: số dòng mã, tỉ lệ tương phản tính theo công thức WCAG. 4 Blocker (HR-01, 04, 06, 07) đều gắn với tiền, pháp lý hoặc nhóm khách chính. PO đã đưa thành AC (US-026 / HR-04, US-135 / HR-06) và UXD đã dùng làm checklist.
3. **"Khoảnh khắc quyết định"** ở J1/J2 ("tiền đã đến chưa", "đứng trước cửa có vào được không", "bill có bất ngờ không") là cách nhìn rất tốt để PO xếp ưu tiên R2 và viết kịch bản UAT ở R3.
