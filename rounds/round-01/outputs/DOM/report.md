# Báo cáo DOM – Round 1, Bước 2 (Sản xuất – Đợt 1)
- Vai: DOM | Ngày: 15/10/2026 | Việc: plan R1 mục 3.1 dòng DOM, việc (1)–(3). Việc (4) là review, thuộc Bước 3.

> Ghi chú ORC: DOM không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nguyên nội dung DOM gửi, với sự đồng ý của INV.

## 1. Đã làm gì
1. Chuẩn hóa quy tắc kinh doanh thành 129 quy tắc BR-xxx trong 12 nhóm. Mỗi quy tắc có ví dụ số, nhãn và nguồn. Đã đưa vào phí phạt thực tế ở brief mục 5: khử mùi 500k, thẻ phòng 200k, dọn lẻ 100k.
2. Lập bảng khoảng 60 tham số cấu hình (mục 13 của business-rules) để ARC thiết kế bảng cấu hình.
3. Phân loại 30 lỗi BL 8.2: Sửa 25, Cần INV 4, Bỏ 1. Thêm 8 vấn đề mới X-01 đến X-08.
4. Đề xuất phương án cho các câu Q1–Q12 thuộc nghiệp vụ, đầu vào cho Q14–Q16, và 5 câu mới Q-D1–Q-D5, gom theo nhóm ESC ở plan mục 8.
5. Viết 10 tình huống cao điểm/sự cố (S1–S10) và danh sách nghĩa vụ pháp lý VN.

Phát hiện chính:
- Hạn khai báo khách nước ngoài có thể là 12 giờ, không phải 23:00.
- Mô hình phí dài hạn mâu thuẫn giữa BL và brief.
- Khách ngắn ngày ở dài trả đắt hơn thuê tháng.

## 2. File tạo/sửa
- `product/docs/business-rules.md` (mới)
- `product/docs/baseline-issues-triage.md` (mới)
- `rounds/round-01/outputs/DOM/report.md` (mới)
- Không sửa `decision-log.md`. 11 dòng đề xuất nằm ở mục 17 của business-rules.

## 3. Giả định
- Mọi con số ở BL mục 5 là giá trị mặc định cấu hình được.
- Các chính sách BL chưa có do DOM đề xuất, gắn nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]`.
- Trích dẫn luật theo hiểu biết nghiệp vụ, ghi "cần xác nhận".
- Tên trạng thái đơn: hold, confirmed, in_house, checked_out, cancelled, no_show. OOO là khối chặn tồn phòng.

## 4. Rủi ro / vướng mắc
- Nhiều con số chính sách là đề xuất. Nếu INV chọn khác thì phải sửa BR và test case; đã giảm thiểu bằng tham số cấu hình.
- Ba điểm pháp lý (hạn khai báo khách nước ngoài, giá điện bán lại, VAT) cần luật sư/kế toán xác nhận trước khi chạy thật.
- PO viết PRD song song nên tên trạng thái và con số có thể lệch; DOM sẽ đối chiếu khi review ở Bước 3.
- Các tài liệu khác phải tham chiếu mã BR, không chép lại số (tiêu chí QC B3).

## 5. Việc chưa xong
- Review PO, BA (bắt buộc), UXR, INT (khuyến nghị) ở Bước 3.
- Cùng PO viết ESC chính thức ở đợt 3.
- `nightmare-scenarios.md` đầy đủ (plan chưa giao); hiện có bản rút gọn ở mục 14 business-rules.
- Chỉ số do DATA làm trong `metrics-definitions.md`; DOM đã bàn giao quy ước BR-904 và BR-215.
