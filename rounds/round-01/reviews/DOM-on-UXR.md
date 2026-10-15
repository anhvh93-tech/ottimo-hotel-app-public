# Review DOM → UXR – Round 1, Bước 3 (khuyến nghị)

- Người review: DOM | Ngày: 15/10/2026
- Phạm vi: `product/docs/research/personas.md`, `journeys.md`, `heuristic-review-r0.md`
- Góc nhìn: hành trình và persona có phản ánh đúng vận hành boutique stay ở Đà Lạt không; có chỗ nào mâu thuẫn với quy tắc nghiệp vụ đã chốt không.

---

### FB-R1-DOM-UXR-01
- Mức độ: Major
- Vị trí: `journeys.md` J3, dòng 10:30 "Khách xin nhận sớm", cột Cơ hội: "Giờ mặc định = giờ thực, hiển thị phí…"
- Vấn đề: Cơ hội đề xuất ở đây đi ngược chính phát hiện Blocker HR-04 của UXR ("mặc định **không có phụ thu**; lễ tân phải chủ động chọn Nhận sớm") và BR-414 (DOM đã chốt: form mặc định giờ chuẩn 14:00, không phải giờ hiện tại). "Giờ mặc định = giờ thực" chính là nguyên nhân của lỗi BL 8.2 #2.
- Vì sao quan trọng: UXD và FE đọc journeys để thiết kế modal Nhận phòng. Nếu theo câu này, lỗi thu nhầm phụ thu (Blocker, sai tiền) sẽ quay lại.
- Đề xuất sửa: Sửa thành "Giờ nhận mặc định = giờ chuẩn (BR-414); lễ tân bấm 'Nhận sớm' mới hiện giờ thực tế + phí đề xuất; miễn phí → gửi yêu cầu FOC (lễ tân trưởng/quản lý duyệt theo hạn mức BR-433), không gửi riêng cho P1".
- Trạng thái: Open

### FB-R1-DOM-UXR-02
- Mức độ: Minor
- Vị trí: `journeys.md` J3 (dòng đầu "hạn khai báo 23:00 (BL 5.12)", 14:00–15:00 "nhắc lại theo giờ 18:00, 21:00, 22:30"); mục 5 O-01 "nhắc hạn 23:00 theo mốc"; J1 bước 4
- Vấn đề: Hành trình dùng một mốc 23:00 cho mọi khách. BR-603 (theo hiểu biết DOM về luật, chờ luật sư) đặt hạn cho người nước ngoài là **giờ đến + 12 giờ**, nên khách NN đến lúc 08:00 có hạn 20:00, sớm hơn 23:00. DOM sẽ sửa cách diễn đạt BR-603 ở bước 4, nhưng nguyên tắc "khách NN tính theo giờ" không đổi.
- Vì sao quan trọng: OTTIMO có tỷ lệ khách NN cao. UXD dựng nhắc việc theo 23:00 sẽ để lọt hạn của khách NN đến buổi sáng (tình huống S8).
- Đề xuất sửa: Ghi "hạn theo BR-602 (khách VN) / BR-603 (khách NN, tính từ giờ đến)" và để mốc nhắc là tham số (nhắc trước hạn X giờ) thay vì các giờ cố định 18:00/21:00/22:30.
- Trạng thái: Open

### FB-R1-DOM-UXR-03
- Mức độ: Minor
- Vị trí: `personas.md` mục 9 H-20 (bàn giao ca – ưu tiên **Thấp**); `journeys.md` O-11
- Vấn đề: Bàn giao ca được xếp ưu tiên thấp và "chưa rõ nhu cầu". Theo kinh nghiệm vận hành, bàn giao ca (tiền mặt, chuyển khoản đã xác nhận, khách chưa đến, khai báo còn thiếu, yêu cầu khách đang mở) là thói quen bắt buộc ở mọi quầy lễ tân có từ 2 người xoay ca, và là điểm kiểm soát tiền chính.
- Vì sao quan trọng: Ưu tiên thấp ở nghiên cứu làm PO để US-124 ở Should R3. DOM đã đề nghị PO nâng Must R3 (FB-R1-DOM-PO-06) và BA thêm quy trình đóng ca (FB-R1-DOM-BA-03).
- Đề xuất sửa: Nâng H-20 lên **Cao**. Đổi câu kiểm chứng từ "có quy trình bàn giao không" thành "bàn giao những gì, bằng giấy hay Zalo, có đếm tiền mặt không, đã từng lệch tiền chưa". Đưa câu này vào ESC-003.
- Trạng thái: Open

### FB-R1-DOM-UXR-04
- Mức độ: Minor
- Vị trí: `personas.md` P6 (Alexei) "chuyển khoản qua người quen, tiền mặt hoặc **USDT**"; H-12
- Vấn đề: (a) Persona nêu USDT như một cách trả tiền có thể có mà không ghi chú pháp lý. Ở Việt Nam tiền mã hóa không phải phương tiện thanh toán hợp pháp, nên OTTIMO không được nhận. (b) H-12 được để ở mức "giả thuyết". Thực tế thẻ do ngân hàng Nga phát hành gần như không dùng được ở nước ngoài từ 2022 (thông tin công khai). Phần cần kiểm chứng chỉ là khách đang trả **bằng cách nào**.
- Vì sao quan trọng: (a) Đội khác có thể đọc persona thành yêu cầu. (b) Ảnh hưởng thẳng tới chính sách cọc với khách Nga đặt trực tiếp (DOM-on-PO FB-10).
- Đề xuất sửa: (a) Thêm ghi chú "OTTIMO không nhận tiền mã hóa (pháp lý)". (b) Viết lại H-12: "Khách Nga **không** dùng thẻ quốc tế được (gần chắc chắn) – cần biết kênh trả thực tế: tiền mặt USD/VND, chuyển khoản qua người thân tại VN, ví/ngân hàng nước thứ ba".
- Trạng thái: Open

### FB-R1-DOM-UXR-05
- Mức độ: Minor
- Vị trí: `journeys.md` J2 bước 7 "Nhắc visa 30 ngày trước"; BR-605 (14 ngày)
- Vấn đề: Hành trình nhắc thị thực trước 30 ngày, còn BR-605 đặt 14 ngày. Hai tài liệu lệch nhau.
- Vì sao quan trọng: Với khách dài hạn, 30 ngày mới thực tế, vì gia hạn thị thực qua dịch vụ thường mất 5–10 ngày làm việc và khách còn phải chuẩn bị giấy tờ. 14 ngày chỉ đủ cho khách ngắn ngày.
- Đề xuất sửa: UXR giữ 30 ngày cho J2. **DOM sẽ sửa BR-605** thành 30 ngày (dài hạn) / 14 ngày (ngắn ngày), xem DOM-on-PO mục B.19. Sau đó UXR tham chiếu BR-605 thay vì ghi số.
- Trạng thái: Open

### FB-R1-DOM-UXR-06
- Mức độ: Suggestion
- Vị trí: `personas.md` mục 9 (danh sách giả thuyết); `journeys.md` J1 bước 4
- Vấn đề: Thiếu hai tình huống đặc thù Đà Lạt có ảnh hưởng lớn tới quầy: (1) khách **đi xe giường nằm đêm** (từ TP.HCM, các tỉnh miền Trung) đến khoảng 04:00–05:30, muốn vào phòng ngay hoặc gửi hành lý, tắm rửa; (2) khách tự nhận phòng bằng mã cửa bị **kẹt ngoài cửa** (mã sai, khóa hết pin, mã chưa có hiệu lực vì nhận phòng trước giờ) khi không có lễ tân.
- Vì sao quan trọng: (1) Quyết định tần suất của luồng "nhận trước 06:00 = thêm đêm" (BR-411) và nhu cầu gửi hành lý. (2) Đây là "khoảnh khắc quyết định" (b) của J1, và với khách OTA quốc tế lúc nửa đêm thì là trải nghiệm tệ nhất có thể xảy ra.
- Đề xuất sửa: Thêm H-21 "Tỷ lệ khách đến 04:00–06:00 bằng xe đêm/chuyến bay sớm; họ muốn gì (vào phòng, gửi đồ, tắm)" và H-22 "Có lần nào khách bị kẹt ngoài cửa? Liên hệ ai, mất bao lâu?". Trong J1 bước 4, thêm điểm đau "kẹt ngoài cửa" cùng cơ hội "số khẩn cấp hiển thị trong link + mã dự phòng do quản lý cấp từ xa".
- Trạng thái: Open

### FB-R1-DOM-UXR-07
- Mức độ: Suggestion
- Vị trí: `personas.md` P3 "Chú Bảy – buồng phòng kiêm bảo trì"; J4
- Vấn đề: Brief và BL có 2 người buồng phòng (chị Lan, chị Mai) và 1 kỹ thuật (anh Tùng) riêng. Persona gộp hai vai làm một. Như vậy hợp lý cho trường hợp "một người kiêm", nhưng làm mờ phối hợp **giữa** buồng phòng và kỹ thuật (buồng phòng phát hiện hỏng, báo kỹ thuật, kỹ thuật xong thì buồng phòng dọn lại), đúng chỗ hay rơi việc.
- Vì sao quan trọng: Luồng chuyển giao giữa hai người (phiếu sửa → `done` → "Dọn sau sửa chữa" → kiểm phòng) là nơi căn bị kẹt `OOO`/`VD` lâu hơn cần thiết, làm mất đêm bán.
- Đề xuất sửa: Giữ P3, thêm một "biến thể" cho trường hợp hai người tách vai, và một dòng trong J4 về lúc giao lại căn sau sửa ("kỹ thuật báo xong lúc 15:00, buồng phòng có biết để dọn trước 16:00 cho khách đến không?").
- Trạng thái: Open

---

## Điểm làm tốt
1. Heuristic review chọn đúng 4 Blocker có hậu quả tiền và pháp lý thật (phụ thu tính sẵn, hủy một chạm, hạn hộ chiếu "Khớp" giả, app khách chỉ tiếng Việt). Đây chính là những lỗi lễ tân sẽ gặp đầu tiên.
2. "Khoảnh khắc quyết định" của J1/J2 (tiền đã đến chưa, đứng trước cửa có vào được không, nhận lại ký quỹ đúng cam kết) trùng với ba điểm gây đánh giá 1 sao phổ biến nhất của căn hộ dịch vụ.
3. Mọi kết luận gắn nhãn "Mô phỏng – cần INV kiểm chứng" kèm cách kiểm chứng và tiêu chí đo. Đúng nguyên tắc không trình bày giả định như sự thật.
