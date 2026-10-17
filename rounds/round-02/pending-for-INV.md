# Việc chờ anh/chị (gom trong đêm 16–17/10/2026)

> **Cập nhật 17/10 sáng – INV đã trả lời:** (1) đang mua VPS + tên miền, sẽ báo; (2) ESC-018: ngày dd/mm/yyyy, quốc tịch mã 3 chữ cái in hoa; (3) ESC-016: chưa có HĐ hẹn dọn cố định, nhưng cần tùy chọn dọn cố định (US-056, R3); (4) Dependabot: giao ORC quyết theo khuyến nghị OPS. Còn chờ: thông tin VPS + tên miền.

Cập nhật bởi ORC. Không mục nào chặn việc code – đội đang chạy theo phương án đề xuất.

## 1. Gấp – Máy chủ chạy thử (staging)
OPS đã viết sẵn và diễn tập trọn bộ trên máy (deploy 18 giây, tự quay về bản trước khi lỗi, sao lưu + khôi phục). Chỉ còn thiếu thông tin từ anh/chị:
- Nhà cung cấp VPS + địa chỉ IP (Ubuntu LTS, đặt tại Việt Nam).
- Tên miền đã mua + nơi mua. OPS đã soạn danh sách bản ghi DNS để anh/chị tự dán (`product/docs/hosting-plan.md` mục 10).
- **Không gửi mật khẩu hay khóa vào chat.** Một mã truy cập kho ảnh GitHub (quyền chỉ đọc) sẽ cần tạo – OPS hướng dẫn từng bước khi tới lúc, anh/chị tự dán vào máy chủ.

Nếu chưa có staging: QC cuối Round 2 phần "chạy trên môi trường thật" sẽ KHÔNG ĐẠT.

## 2. ESC-018 – Biểu mẫu cổng khai báo lưu trú (không gấp)
Nhờ lễ tân chụp biểu mẫu trống của cổng khai báo (khách Việt + khách nước ngoài): định dạng ngày, cách chọn quốc tịch, ô nào bắt buộc. Đang tạm dùng ngày dd/mm/yyyy và "Hàn Quốc (KOR)".

## 3. Câu phụ ESC-016 (chưa trả lời)
Có hợp đồng dài hạn nào đang chạy được hẹn dọn cố định hằng tuần không? Đội đang hiểu là không có.

## 4. Cho phép thao tác GitHub – cập nhật thư viện (Dependabot)
OPS khuyến nghị gộp 4, hoãn 2, đóng 5 (`rounds/round-02/outputs/OPS/s2-dependabot.md`). Chưa làm gì cho tới khi anh/chị đồng ý.

## 5. Để anh/chị biết (không cần trả lời)
- Tài khoản ngân hàng nhận tiền VietQR (tài khoản Techcombank thử) không còn đọc từ file cấu hình `.env` nữa (theo bảo mật SEC). Khi có staging, anh/chị (vai chủ đầu tư) nhập tài khoản ở màn **Tham số**, có nhập lại mật khẩu. Mình đã tạm vô hiệu 3 dòng đó trong `.env` trên máy (vẫn giữ nguyên giá trị dưới dạng ghi chú).
- Hoàn tiền **chuyển khoản**: người duyệt, người nhập tài khoản nhận và người chi phải là 3 người khác nhau – **riêng anh/chị (chủ đầu tư) được vừa duyệt vừa chi** (PO quyết 17/10). Quản lý không được tự duyệt rồi tự chi. Khi anh/chị vắng: anh/chị duyệt từ xa trên điện thoại, quản lý chi tại máy quầy. Nếu anh/chị muốn cho quản lý một mình duyệt + chi khi anh/chị vắng thì báo đội (đây là nới kiểm soát, chỉ anh/chị quyết được).
- Đã thêm 2 câu hỏi vào danh sách gửi luật sư (ESC-001): ảnh biên nhận chuyển khoản có phải lưu 10 năm không; văn bản đồng ý tiếng Anh có đủ cho khách nói tiếng Nga không.
- Thư viện xử lý ảnh `sharp` đã nâng lên 0.35.5 vì bản cũ có lỗ hổng mức cao.
