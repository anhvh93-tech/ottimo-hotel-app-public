# Báo cáo DATA – Round 1, Bước 2 (Sản xuất – đợt 2)

- Vai: DATA | Ngày: 15/10/2026 | Việc giao: plan R1 mục 3.1 dòng DATA, quyết định P1 (tham gia nhẹ)

## 1. Đã làm gì
- Viết `product/docs/metrics-definitions.md` v0.1:
  - 15 quy ước nền (Q-01…Q-15): múi giờ và ngày lưu trú; bảng đêm-phòng làm đơn vị gốc; trạng thái đơn nào tính đêm bán/doanh thu (theo BR-301, BR-904); đêm khả dụng trừ OOO; tách đêm miễn phí; nhận trước 06:00 / trả sau 18:00 là đêm bán; gia hạn, đổi phòng, trả sớm; phân loại doanh thu phòng / khác / không phải doanh thu; doanh thu dài hạn phân bổ theo đêm (chia theo tháng hợp đồng, có lý do); kênh và loại lưu trú tách thành 2 chiều; phí kênh và hoa hồng; dồn tích và dòng tiền; đóng kỳ; làm tròn.
  - 21 chỉ số K-01…K-21, mỗi chỉ số có công thức, nguồn dữ liệu và ví dụ tính bằng số tháng 9–10/2026 của BL: Đêm khả dụng, Đêm bán, Occupancy, ADR, RevPAR, Doanh thu phòng/khác/tổng, Phí kênh, Thực thu, Tỉ lệ kênh trực tiếp, Cơ cấu dài hạn/ngắn ngày, Số căn dài hạn, ALOS, GOP, Biên GOP, GOPPAR, FOC, Khách/phòng, Dòng tiền, So sánh kỳ trước.
  - Xử lý BL 8.2 #8, #11, #22, #28, #29 (bảng trước → sau + dữ liệu bắt buộc), xử lý thêm #12 và mâu thuẫn CTV 7%/8% (X-03).
  - Định nghĩa chính xác S1–S12 của PRD (công thức, kỳ, dữ liệu cần, ví dụ); gắn G1–G5 với chỉ số; 7 quy tắc đối chiếu R-01…R-07; nguyên tắc dữ liệu cá nhân (không dùng dữ liệu C3).
  - Mục 9: danh sách TRƯỜNG DỮ LIỆU BẮT BUỘC gửi ARC (26 thực thể – trường – vì sao cần) + 5 nguyên tắc chung + 3 ràng buộc kỹ thuật.
- Kết quả tính lại tháng 9 theo quy ước mới: phí OTA 15.794.500 (thay 15.500.000 nhập tay), GOP 119.660.500, biên 61,1% (thay 61,3%), GOPPAR 398.868; Occupancy 71,3%, ADR 871.028, RevPAR 621.333, trực tiếp 28,0%, dài hạn 28,0% đêm (2,0 căn bình quân).

## 2. File tạo/sửa
- Tạo: `product/docs/metrics-definitions.md`
- Tạo: `rounds/round-01/outputs/DATA/report.md`
- Không sửa file của vai khác, không sửa `01-decisions/decision-log.md`, `02-escalations/`.

## 3. Giả định
Quyết định thuộc quyền DATA – đề nghị ORC ghi decision-log:

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 1 | Chỉ số đêm và doanh thu phòng tính trên bảng đêm-phòng (StayNight); kỳ báo cáo lọc theo ngày lưu trú, giờ Asia/Ho_Chi_Minh | DATA | Một nguồn đếm đêm, tránh lặp lỗi BL 8.2 #8, #22 |
| 2026-10-15 | 1 | Đêm khả dụng thuần = số căn kinh doanh × ngày − đêm OOO; Occupancy/RevPAR/GOPPAR dùng mẫu số thuần, báo kèm số gộp | DATA | BL 8.2 #29, BR-804, BR-904 |
| 2026-10-15 | 1 | Occupancy dùng đêm có khách (gồm đêm miễn phí); ADR dùng đêm bán có thu tiền | DATA | Không để đêm 0 đồng kéo ADR |
| 2026-10-15 | 1 | Doanh thu dài hạn phân bổ theo đêm, chia theo tháng hợp đồng (tổng HĐ = Σ đêm); tiền thu theo kỳ là dòng tiền riêng | DATA | BR-215, BL 8.2 #22 – chi tiết lý do ở metrics-definitions Q-10 |
| 2026-10-15 | 1 | Kênh và loại lưu trú là 2 chiều tách biệt; "HĐ dài hạn" không còn là kênh | DATA | Báo cáo kênh T9 của INV đã ghi dài hạn theo kênh nguồn |
| 2026-10-15 | 1 | Chi phí kênh = phí OTA + hoa hồng CTV; hoa hồng nhân viên sale ở dòng riêng của P&L; phí kênh/hoa hồng ghi nhận theo đêm cùng kỳ doanh thu | DATA | BL 5.11, BR-901–903 |
| 2026-10-15 | 1 | Nhận phòng trước 06:00 và trả sau 18:00 sinh đêm bán (doanh thu phòng); phụ thu 30%/50% và phụ thu người thêm là doanh thu khác | DATA | BR-003, 411, 416, 904 – chờ DOM xác nhận ở review |
| 2026-10-15 | 1 | ALOS đếm theo lượt lưu trú (gộp đơn con gia hạn), tách ngắn ngày và dài hạn | DATA | Tránh HĐ 1 năm làm ALOS vô nghĩa |

Giả định cần INV (nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]`):
- Báo cáo dùng doanh thu **gồm VAT** cho đến khi kế toán chốt thuế suất (O-1).
- CTV/môi giới **không** tính là kênh trực tiếp trong mục tiêu G3 (O-2).
- Chốt số liệu tháng vào ngày 5 tháng sau (O-3).
- Ngưỡng 5 phút cho S7 (O-6, ARC xác nhận).
- Đích S1–S12 giữ như PRD (đã có trong decision-log).

## 4. Rủi ro / vướng mắc
- **ESC mới: không tạo.** Đề xuất PO gộp vào các ESC đã dự kiến thay vì mở ESC riêng (giữ ≤ 9 ESC):
  - O-2 (CTV có là kênh trực tiếp) → thêm 1 câu vào ESC xác nhận mục tiêu/S1–S12 hoặc ESC phạm vi MVP của PO.
  - O-1 (gồm/trước VAT) → thêm vào ESC "Hóa đơn điện tử: thuế suất VAT" (BL 9 #16).
  - O-3 (ngày chốt tháng) → nếu INV không có ý kiến, đội tự chốt.
- **Điểm cần DOM xác nhận ở bước review** (DATA sẽ viết thẻ trong `reviews/DATA-on-DOM.md` nếu ORC giao): BR-411 mức 100% trước 06:00 nên ghi là đêm (doanh thu phòng) chứ không phải phụ thu; BR-215 câu chữ "÷ số đêm tháng lịch" nên đổi thành "÷ số đêm của tháng hợp đồng" (khác nhau khi HĐ bắt đầu giữa tháng, ví dụ sai 143.333 đ ở metrics-definitions Q-10).
- **Phụ thuộc ARC**: nếu ERD không có bảng đêm-phòng (StayNight) và lịch sử đơn, Round 3 phải tính lại từ ngày đến/đi và dễ tái lỗi #8, #22. DATA sẽ review ERD (khuyến nghị trong ma trận review mục 5).
- **Phụ thuộc BA**: tên trạng thái đơn đang dùng theo BR-301; nếu sơ đồ trạng thái của BA thêm trạng thái (ví dụ `extended`, `moved`), cần cập nhật bảng Q-03.
- S11 dùng nhật ký đăng nhập nhân viên – SEC/BA cần xác nhận cách thông báo cho nhân viên.
- Số liệu ví dụ tháng 9 lấy từ prototype (có số cứng); chưa biết 214 đêm tháng 9 có gồm đơn `hold` hay không – chỉ dùng để minh họa công thức.

## 5. Việc chưa xong
- Tracking sự kiện (`analytics/tracking-plan.md`), truy vấn mẫu, đặc tả báo cáo, dashboard: Round 2–3 theo P1.
- Bảng ánh xạ "thẻ dashboard → mã chỉ số" cho S9: làm cùng FE khi có wireframe Tổng quan của UXD.
- Review ERD của ARC (đợt 3) để kiểm đủ trường ở mục 9.
- Chờ review bắt buộc của PO (`PO-on-DATA.md`), khuyến nghị BE.
