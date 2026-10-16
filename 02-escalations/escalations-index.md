# Danh sách việc báo lên Chủ đầu tư

| ID | Tiêu đề | Người tạo | Round | Mức khẩn | Trạng thái | Quyết định |
|---|---|---|---|---|---|---|
| ESC-001 | Luật sư rà soát dữ liệu cá nhân và thời hạn lưu giấy tờ (+ hạn khai báo khách NN – 2 cách tính, ngưỡng tuổi trẻ em, hạn trả lời yêu cầu dữ liệu, nhận phòng khi hộ chiếu/thị thực không đạt, lưu ý sức khỏe có cần đồng ý riêng) | SEC (PO bổ sung) | 1 | Bình thường | Chờ INV | – |
| ESC-002 | Dữ liệu khách đặt máy chủ ở Việt Nam hay nước ngoài; duyệt chi phí hosting + tên miền | SEC (PO gộp câu OPS) | 1 | Bình thường | Chờ INV | – |
| ESC-003 | Kiểm chứng nhanh với người dùng thật trước khi code Round 2 (7 điều cần kiểm chứng: thiết bị chủ đầu tư/lễ tân, buồng phòng tự dùng app, CTV có tài khoản, khách Nga trả tiền thế nào, bàn giao ca, buồng phòng – kỹ thuật) – bản sửa bước 4 của UXR | UXR | 1 | Bình thường | Chờ INV | – |
| ESC-004 | Chính sách giá bán ngắn ngày: giá đêm, giá lễ/cuối tuần, phụ thu khách NN, giảm theo số đêm, phụ thu thêm người, sức chứa, ở tối thiểu, mùa cao điểm Đà Lạt | PO (DOM) | 1 | Bình thường | Chờ INV | – |
| ESC-005 | Thuê dài hạn: bảng kỳ hạn, phí dịch vụ – dọn phòng, hoa hồng và lịch chi | PO (DOM) | 1 | Bình thường | Chờ INV | – |
| ESC-006 | Hủy phòng, hoàn cọc, chấm dứt HĐ sớm, giữ chỗ hết hạn, hoàn ký quỹ, bất khả kháng, khách không cọc online được, đơn đoàn | PO (DOM) | 1 | Bình thường | Chờ INV | – |
| ESC-007 | Phụ thu nhận sớm/trả muộn (cả cơ sở tính cho đơn OTA) và hạn mức FOC (gồm hạn mức tháng lễ tân tự miễn) | PO (DOM) | 1 | Bình thường | Chờ INV | – |
| ESC-008 | Khoản ngoài tiền phòng và VAT: điện nước, giặt ủi, dọn phòng, loại hình kinh doanh, thuế suất có ngày hiệu lực, hóa đơn | PO (DOM, DATA) | 1 | Bình thường | Chờ INV | – |
| ESC-009 | Chọn channel manager và duyệt phí tháng (chi phí riêng, ngoài ngân sách hạ tầng) | PO (INT, ARC) | 1 | Bình thường | Chờ INV | – |
| ESC-010 | Tài khoản bên thứ ba: thu tiền, hóa đơn điện tử, Zalo, email, cổng khai báo lưu trú + ca tối (ai, ở đâu, thiết bị) + gửi mã xác minh qua OTA/Zalo; email SES Singapore, báo tiền về có chữ ký | PO (INT, SEC) | 1 | Bình thường | Chờ INV | – |
| ESC-011 | Khóa cửa thông minh: thông tin hãng và dạng mã sinh nhật (ddmm + 3 số ngẫu nhiên; khóa có tự khóa khi nhập sai không) | PO (INT, SEC, DOM) | 1 | Bình thường | Chờ INV | – |
| ESC-012 | Xác nhận phạm vi MVP, phạm vi Round 2 khi ước lượng vượt (R-A/R-B/R-C), mục tiêu đo thành công và logo chính thức | PO (UXD, DATA, BE) | 1 | Bình thường | Chờ INV | – |
| ESC-013 | Môi trường chạy thử khung + kiểm tra tự động (cài Node/Docker tại máy; repo GitHub riêng tư dự phòng) | OPS (ORC lập theo QC ĐK-1) | 1 | Gấp | INV đã chọn A – chờ cài đặt; B còn mở | A (15/10) |

Ghi chú: 12 ESC (mục tiêu plan ≤ 9 ESC mới: thực tế 9 ESC mới 004–012 + 3 ESC có từ trước 001–003; vượt mục tiêu vì chính sách giá, hủy, phụ thu, VAT, tài khoản, khóa cửa và phạm vi là các chủ đề độc lập INV phải quyết), tất cả mức Bình thường – gom trình trong `rounds/round-01/round-summary.md`. Bước 4 **không tạo ESC mới**: các câu mới từ review được gom vào ESC có sẵn dưới dạng câu phụ, mỗi câu có phương án và đề xuất. ESC-004 … ESC-007 có **bảng chọn từng dòng** để INV đánh dấu từng chính sách. Không ESC nào chặn việc code Round 2 (mọi con số đã có giá trị mặc định chỉnh được). Các mốc cần sớm nhất (đầu Round 2): phạm vi Round 2 (ESC-012 câu phụ R-A/R-B/R-C), sức chứa từng căn (ESC-004), tài khoản ngân hàng + tên miền (ESC-010, ESC-002), thông tin khóa cửa (ESC-011), chi phí hosting (ESC-002). Truy vết 26 câu BL mục 9 + câu mới: `product/docs/open-questions-resolution.md`.
