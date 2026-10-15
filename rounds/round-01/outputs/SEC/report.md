# Báo cáo SEC – Round 1 · Bước 2 Sản xuất · Đợt 1 (Phần 1)

> Ghi chú ORC: SEC không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nguyên nội dung SEC gửi, với sự đồng ý của INV.

## 1. Đã làm gì
- Kiểm kê 28 nhóm dữ liệu cá nhân (D01–D28): khách, người đi cùng, trẻ em, CTV, nhân viên, lead. Mỗi nhóm có nguồn, vị trí trong BL, mục đích, loại pháp lý, mức nội bộ và ai được xem (đề xuất cho RBAC của BA).
- Thang phân loại C0 Công khai, C1 Nội bộ, C2 Nhạy cảm, C3 Rất nhạy cảm, kèm kiểm soát tối thiểu cho từng mức.
- 11 mục đích xử lý (P01–P11) kèm cơ sở pháp lý theo NĐ 13/2023. Yêu cầu về đồng ý (R-CON), thông báo xử lý dữ liệu, quyền của khách (R-DSR), hồ sơ đánh giá tác động và chuyển dữ liệu ra nước ngoài.
- 18 thời hạn lưu/xóa (T01–T18), cần luật sư xác nhận, cấu hình được.
- 12 yêu cầu khai báo lưu trú (R-REG) và 10 yêu cầu thanh toán/PCI DSS (R-PAY).
- 14 phát hiện từ baseline (F01–F14), nổi bật là F02, F05, F06, F07, F08, F09.
- Bảng đầu vào cho BA, DOM, ARC, INT, OPS, UXD, PO, QA (mục 11) và 10 câu hỏi pháp lý (mục 12).
- Tạo ESC-001 và ESC-002.

## 2. File đã tạo/sửa
- `product/docs/security/data-risk-assessment.md` (tạo mới)
- `02-escalations/ESC-001.md`, `02-escalations/ESC-002.md` (tạo mới)
- `rounds/round-01/outputs/SEC/report.md` (file này)
- Không sửa escalations-index và decision-log; ORC cập nhật theo mục 13 của tài liệu.

## 3. Giả định
- `[GIẢ ĐỊNH – chờ INV xác nhận]` Thời hạn lưu/xóa ở mục 7 là giá trị mặc định cấu hình được, chờ ESC-001.
- `[GIẢ ĐỊNH]` Điều khoản dẫn chiếu là hiểu biết của đội, chưa tra văn bản gốc, có thể đã bị Luật 91/2025/QH15 và văn bản hướng dẫn thay đổi.
- `[GIẢ ĐỊNH]` Cổng Bộ Công an không có API, khai báo bán tự động.
- `[GIẢ ĐỊNH]` Thẻ online qua trang của cổng; thẻ tại quầy dùng POS ngân hàng.
- Ngưỡng trẻ em để bảo vệ dữ liệu là dưới 16 tuổi, khác ngưỡng dưới 14 tuổi của BL 3.17. DOM và BA thống nhất.

## 4. Rủi ro / vướng mắc
- Pháp lý chưa chắc chắn: đội không phải luật sư và Luật 91/2025 đã thay khung NĐ 13. Giảm thiểu bằng ESC-001 và để mọi con số cấu hình được.
- Nếu hạn khai báo khách nước ngoài đúng là 12 giờ thì phải đổi BR khai báo của DOM và job nhắc hạn của ARC.
- Mã cửa theo ngày sinh là mong muốn INV đã nêu nhưng rủi ro an toàn cao. PO/INT đưa vào ESC khóa cửa.
- Ảnh giấy tờ trong nhóm chat Zalo là rủi ro ngoài app, cần INV ban hành quy định nội bộ.
- Số ESC 001/002 có thể trùng với PO/DOM; ORC đánh lại nếu cần.

## 5. Việc chưa xong
- **Phần 2 (Đợt 4, chờ ARC Pha B có ERD và OpenAPI):**
  - `product/docs/security/threat-model.md` (STRIDE).
  - `product/docs/security/security-requirements.md`: xác thực, phân quyền, mã hóa và quản lý khóa, nhật ký truy cập ảnh giấy tờ, callback thanh toán, lưu trữ trên thiết bị.
- Review bắt buộc ARC, INT, OPS ở bước 3; khuyến nghị mạnh review RBAC của BA; soát OpenAPI/ERD ở bước 5.
- Bản nháp hồ sơ đánh giá tác động: Round 3.
