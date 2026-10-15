# Báo cáo UXR – Round 1 · Bước 2 (Sản xuất – Đợt 1)
> Mô phỏng – cần INV kiểm chứng. Mọi persona, hành trình, giả thuyết là mô phỏng của agent AI, chưa có dữ liệu người thật.
>
> Ghi chú ORC: UXR không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nguyên nội dung UXR gửi, với sự đồng ý của INV.

## 1. Đã làm gì
1. 7 persona mô phỏng P1–P7 + ma trận persona × phân hệ + yếu tố bao trùm (mù màu, lớn tuổi, mạng yếu, màn nhỏ, ngôn ngữ, ngắt quãng).
2. 4 hành trình: J1 khách ngắn ngày (7 giai đoạn, biến thể trực tiếp/OTA), J2 khách dài hạn, J3 một ca lễ tân, J4 một ngày buồng phòng/bảo trì; 12 cơ hội O-01…O-12 gắn L1–L8 và BL.
3. Heuristic review prototype R0 (Nielsen + WCAG 2.2 AA, đo tương phản): 25 phát hiện – 4 Blocker (HR-01, 04, 06, 07), 12 Major, 7 Minor, 2 Suggestion; bảng BL 8.3 → WCAG → mã; 6 điểm mạnh nên giữ.
4. 20 giả thuyết H-01…H-20 cần INV kiểm chứng; 9 giả thuyết ưu tiên Cao đưa vào dự thảo ESC.
5. Ghi 3 dòng decision-log.

## 2. File tạo/sửa
- product/docs/research/personas.md (mới)
- product/docs/research/journeys.md (mới)
- product/docs/research/heuristic-review-r0.md (mới)
- 02-escalations/ESC-DRAFT-UXR-kiem-chung-nguoi-dung.md (dự thảo, chờ ORC cấp số)
- 01-decisions/decision-log.md (nối 3 dòng)
- rounds/round-01/outputs/UXR/report.md (file này)
Ghi chú: skill đặt đường dẫn product/docs/ux/…; round này theo plan.md (product/docs/research/…).

## 3. Giả định
- [GIẢ ĐỊNH – chờ INV xác nhận] Chủ đầu tư và CTV dùng điện thoại là chính; lễ tân dùng laptop tại quầy; buồng phòng dùng Android tầm trung, mạng chập chờn.
- Hồ sơ persona và tên là hư cấu, dựa trên brief mục 1, 5.
- Mốc giờ J3/J4 lấy theo quy tắc BL; số ca, số người mỗi ca là giả định.
- Số liệu đánh giá OTA (nước nóng 9%, Wi-Fi 6%, đậu xe 5%) là dữ liệu mẫu của prototype.
- Heuristic review dựa trên đọc mã, chưa render giao diện.

## 4. Rủi ro / vướng mắc
- P3 buồng phòng có độ tin cậy thấp: nếu H-05 sai thì phân hệ buồng phòng mobile phải đổi hướng.
- H-10 (gửi link check-in cho khách OTA) phụ thuộc INT/channel manager.
- H-12 (cách khách Nga thanh toán) ảnh hưởng ESC thanh toán của PO/INT.
- Một số phát hiện trùng lỗi logic BL 8.2; phân loại nghiệp vụ vẫn thuộc DOM.
- Dự thảo ESC chưa có số.

## 5. Việc chưa xong
- Chưa có ảnh chụp màn hình cho heuristic review; UXD/QA xác nhận thị giác khi review.
- real-user-test-guide.md để Round 2 (bản rút gọn 1 trang nếu INV chọn phương án A).
- Bước 3: review UXD (bắt buộc), PO; chờ PO, UXD, DOM review sản phẩm UXR.
