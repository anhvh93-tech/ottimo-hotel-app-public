# Báo cáo INT – Round 1, Bước 2 (Sản xuất, Đợt 1)
- Người làm: INT | Ngày: 15/10/2026 | Việc giao: plan R1 mục 3.1 dòng INT

> Ghi chú ORC: INT không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nguyên nội dung INT gửi, với sự đồng ý của INV.

## 1. Đã làm gì
- Lập danh sách 9 tích hợp và 1 mục phụ I2b (báo tiền về tự động): channel manager, VietQR, VNPay, MoMo, MISA meInvoice, khóa cửa thông minh, Zalo OA/ZNS, email, khai báo lưu trú. Mỗi mục có: mục đích, Round (khớp PRD R2/R3/Sau), kiểu kết nối, tài liệu/sandbox, chi phí kèm nguồn hoặc "chưa xác minh", việc INV phải cung cấp. Bảng việc INV cần cung cấp có 11 dòng.
- So sánh channel manager bản 1 với 4 phương án (Beds24, ezCloud, Channex, Cloudbeds tham khảo) theo số OTA, API cho hệ thống riêng, giá/tháng cho 10 căn, tiếng Việt, đồng bộ giá/phòng trống/đặt phòng, sandbox, ràng buộc hợp đồng. Đề xuất Beds24 vì đủ 6/6 OTA và có API V2.
- Khóa cửa:
  - Các hãng/nền tảng phổ biến tại VN: TTLock, Tuya, igloohome, Kaadas, Samsung/Philips/Yale/Häfele/Dessmann, Hune/Viro/Hexa, khóa thẻ khách sạn truyền thống.
  - Đã xác minh API TTLock trên tài liệu chính thức.
  - 10 tiêu chí chọn khóa; luồng tự động và luồng nhập mã thủ công.
  - Phân tích mã theo ngày sinh nhật.
- Thiết kế interface adapter (giả mã), danh sách biến môi trường, checklist chất lượng adapter.
- Soạn 3 dự thảo ESC (INT-A channel manager, INT-B tài khoản, INT-C khóa cửa).
- Tra web ngày 15/10/2026, ghi nguồn. Không đăng ký tài khoản, không dùng khóa thật.

## 2. File đã tạo/sửa
- product/docs/integrations.md (mới)
- product/docs/integrations/channel-manager-comparison.md (mới)
- product/docs/integrations/smart-lock.md (mới)
- product/integrations/README.md (mới)
- rounds/round-01/outputs/INT/report.md (mới)

Không sửa decision-log và escalations-index; đề xuất ORC ghi các dòng ở mục 3.

## 3. Giả định
- Kỹ thuật (quyền INT):
  - Adapter + Mock; chuyển môi trường bằng biến môi trường; outbox/inbox, chống xử lý trùng.
  - Chỉ ghi nhận tiền từ IPN/webhook có chữ ký.
  - Không dùng iCal; không scraping cổng BCA.
  - Tự sinh chuỗi VietQR trong app.
- [GIẢ ĐỊNH – chờ INV xác nhận]: thẻ quốc tế qua VNPay INTCARD.
- [GIẢ ĐỊNH]: tỉ giá 1 EUR ≈ 30.500 đ, 1 USD ≈ 26.200 đ; ~25 link Beds24 (5 OTA × 3 nhóm căn + Airbnb 10 căn).
- [GIẢ ĐỊNH – chờ INV xác nhận]: mã cửa mặc định ngẫu nhiên 6 số; mã sinh nhật = ddmm + 2 số ngẫu nhiên khi khách đồng ý; gửi mã vào ngày đến; xóa khi trả phòng (chờ SEC review).

## 4. Rủi ro / vướng mắc
- Giá channel manager chưa chính xác: Beds24 chỉ có máy tính giá; ezCloud không ghi rõ đơn vị gói Nâng cao.
- Không có bảng giá chính thức cho phí giao dịch VNPay/MoMo, Zalo ZNS, SePay.
- Không có API khai báo lưu trú cho phần mềm khách sạn (chỉ có ASM/VNeID), nên giữ bán tự động.
- Hãng khóa chưa rõ: nếu khóa không chạy TTLock/Tuya và không có gateway thì chưa tự động được.
- Mã sinh nhật có rủi ro an ninh và dữ liệu cá nhân, cần SEC xem.
- Xung đột tồn phòng OTA ↔ trực tiếp: INT đã có cơ chế kỹ thuật; quy tắc ưu tiên đơn nào cần DOM định nghĩa.
- Hóa đơn điện tử: trang MISA nhắc NĐ 123/2020, 70/2025, 254/2026; cần xác nhận văn bản hiện hành.

## 5. Việc chưa xong
- Chạy máy tính giá Beds24 cho cấu hình OTTIMO.
- Hỏi ezCloud (API, danh sách OTA, giá) và Channex (Traveloka): cần INV gửi hoặc cho phép.
- Tra chi tiết Zalo ZNS và endpoint MISA: Round 2.
- Đối chiếu adapter với ERD/OpenAPI của ARC (Đợt 3).
- Review ARC (bước 3).
- PO đánh số và đưa 3 dự thảo ESC vào 02-escalations.
