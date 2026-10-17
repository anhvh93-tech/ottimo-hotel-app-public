# Việc chờ anh/chị (cập nhật tối 17/10/2026)

> **Cập nhật 17/10 sáng – INV đã trả lời:** (1) đang mua VPS + tên miền, sẽ báo; (2) ESC-018: ngày dd/mm/yyyy, quốc tịch mã 3 chữ cái in hoa; (3) ESC-016: chưa có HĐ hẹn dọn cố định, nhưng cần tùy chọn dọn cố định (US-056, R3); (4) Dependabot: giao ORC quyết theo khuyến nghị OPS. Còn chờ: thông tin VPS + tên miền.

Cập nhật bởi ORC. Không mục nào chặn việc code – đội đang chạy theo phương án đề xuất.

## 1. Gấp – Máy chủ chạy thử (staging)
OPS đã viết sẵn và diễn tập trọn bộ trên máy (deploy 18 giây, tự quay về bản trước khi lỗi, sao lưu + khôi phục). Chỉ còn thiếu thông tin từ anh/chị:
- Nhà cung cấp VPS + địa chỉ IP (Ubuntu LTS, đặt tại Việt Nam).
- Tên miền đã mua + nơi mua. OPS đã soạn danh sách bản ghi DNS để anh/chị tự dán (`product/docs/hosting-plan.md` mục 10).
- **Không gửi mật khẩu hay khóa vào chat.** Một mã truy cập kho ảnh GitHub (quyền chỉ đọc) sẽ cần tạo – OPS hướng dẫn từng bước khi tới lúc, anh/chị tự dán vào máy chủ.

Nếu chưa có staging: QC cuối Round 2 phần "chạy trên môi trường thật" sẽ KHÔNG ĐẠT.

## 2. Anh/chị hẹn gửi thứ Hai 19/10
- VPS + tên miền (đang mua ở Mắt Bão). Tài khoản tên miền đứng tên công ty, bật xác thực 2 lớp, khóa chuyển nhượng.
- Bảng ghép **tên phòng (The Pine … The Ember) ↔ số căn ↔ hạng phòng**. (Ghép thư mục ảnh ↔ hạng phòng: anh/chị đã xác nhận đúng.)
- Logo SVG gốc.
- Tạo và xác thực Zalo OA bằng ĐKKD CTCP UTMG Living; thêm 2 nhân viên quản trị.
- Quyền dùng ảnh; chỗ đậu xe, thang máy, thú cưng; link OTA + 3–5 đánh giá thật.

## 3. Đã quyết trong ngày 17/10
- ESC-018 (ngày dd/mm/yyyy, quốc tịch mã 3 chữ cái in hoa) đã áp vào app.
- ESC-016: thêm tùy chọn lịch dọn cố định cho khách dài hạn ở Round 3 (US-056).
- **ESC-019 = A:** khách tự xin đổi sang căn khác trước ngày đến thì tính giá căn mới. Làm ở Sprint 4.
- Email chung: **booking@ottimo.vn**. Ghép ảnh ↔ hạng phòng: đúng.
- **ESC-020 = A hết** (landing page) và **ESC-021 = A, K1 = A** (Zalo OA). Đã nhận ghim Google Maps.
- Dependabot: đã gộp 4 bản nâng công cụ CI (CI vẫn xanh), đóng 5 đề nghị không phù hợp, hoãn bản nâng giao diện sang Round 3, chia nhóm cập nhật cho các lần sau.

## 4. Để anh/chị biết (không cần trả lời)
- Tài khoản ngân hàng nhận tiền VietQR (tài khoản Techcombank thử) không còn đọc từ file cấu hình `.env` nữa (theo bảo mật SEC). Khi có staging, anh/chị (vai chủ đầu tư) nhập tài khoản ở màn **Tham số**, có nhập lại mật khẩu. Mình đã tạm vô hiệu 3 dòng đó trong `.env` trên máy (vẫn giữ nguyên giá trị dưới dạng ghi chú).
- Hoàn tiền **chuyển khoản**: người duyệt, người nhập tài khoản nhận và người chi phải là 3 người khác nhau – **riêng anh/chị (chủ đầu tư) được vừa duyệt vừa chi** (PO quyết 17/10). Quản lý không được tự duyệt rồi tự chi. Khi anh/chị vắng: anh/chị duyệt từ xa trên điện thoại, quản lý chi tại máy quầy. Nếu anh/chị muốn cho quản lý một mình duyệt + chi khi anh/chị vắng thì báo đội (đây là nới kiểm soát, chỉ anh/chị quyết được).
- Đã thêm 2 câu hỏi vào danh sách gửi luật sư (ESC-001): ảnh biên nhận chuyển khoản có phải lưu 10 năm không; văn bản đồng ý tiếng Anh có đủ cho khách nói tiếng Nga không.
- Thư viện xử lý ảnh `sharp` đã nâng lên 0.35.5 vì bản cũ có lỗ hổng mức cao.

## 5. Cập nhật khuya 17/10
- **Đã quyết:** rút dữ liệu về phân tích = **A** – Desk xuất CSV/Excel theo kỳ (đơn, đêm, doanh thu, folio, kênh, nguồn khách), che dữ liệu khách, chỉ chủ đầu tư, có nhật ký; làm ở Round 3.
- **Chờ anh/chị duyệt cùng landing v1.2.1:** 4 câu nội dung (`outputs/PO/landing-inv-questions.md`) + Premium có giường 1m4 không; ESC-022 tên mạng Wi-Fi (gửi tên mạng hiện tại, không gửi mật khẩu).
- **Cần cho landing lên mạng (form tắt):** tên miền + VPS; logo SVG; tên công ty + MST cho chân trang; tên chủ tài khoản nhận cọc; đậu xe, thang máy, thú cưng, gửi hành lý, đưa đón sân bay; quyền dùng ảnh; bảng tên phòng ↔ số căn ↔ hạng.
- **Zalo OA mức 1 (0 đ):** tạo OA, xác thực bằng ĐKKD CTCP UTMG Living (người đại diện bấm xác nhận trong 48 giờ), thêm 2 quản trị viên, gửi đội link OA.
- **Zalo tự gửi tin (Round 3):** tạo tài khoản ZBS + nạp tiền, gửi duyệt 8 mẫu tin đội soạn (dự trù 2 tuần), đầu R3 mua gói Tăng trưởng 2,5 tr/năm và tạo Zalo App (`product/docs/integrations/zalo-oa.md` mục 6).
- **Form đặt phòng bật thật:** chờ luật sư trả lời ESC-001 LZ-2, LZ-8 (Luật TMĐT 2025 + NĐ 248/2026).
- **Chính sách cần anh/chị quyết sau (DOM nêu):** khách rút ngắn đơn khi còn dưới 7 ngày mà vẫn đến ở hiện không chịu phí cho các đêm bỏ – có thu phí phần này không? Đội sẽ soạn ESC kèm phương án.
