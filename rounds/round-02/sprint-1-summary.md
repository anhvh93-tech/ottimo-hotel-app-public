# Tổng kết Sprint 1 – Round 2 (Nền tảng)

- Người viết: ORC | Ngày: 16/10/2026 | CI: run 38891119081 – **xanh 6/6 job** (gồm E2E chạy trên stack thật)

## 1. Đã làm được (anh/chị bấm thử được trên máy dev)
- **Máy chủ:** đăng nhập/phiên an toàn, khóa tài khoản khi sai nhiều lần (không "đá" người đang làm việc), người dùng & 8 vai, thiết bị được cấp quyền (cho dữ liệu giấy tờ), danh mục căn (định mức/tối đa, bố trí giường, diện tích), tham số quy tắc có giới hạn trên/dưới, hồ sơ khách chặn trùng + tìm có/không dấu + cờ "nghi trùng", nhật ký tiền, duyệt FOC (không tự duyệt, nhập lại mật khẩu, hạn mức tháng).
- **Web quản trị:** 7 màn H01–H07 (đăng nhập, điều hướng theo vai, Hôm nay – đang phát triển, căn, tham số, khách hàng, người dùng & thiết bị), VI/EN, sáng/tối, font OTTIMO.
- **Bảo mật:** dữ liệu từng cơ sở tách biệt ở tầng cơ sở dữ liệu, trường nhạy cảm tự ẩn theo vai, chống giả mạo yêu cầu, danh sách 18.733 mật khẩu cấm dùng.
- **Chuẩn bị Sprint 3:** đặc tả + 6 màn thiết kế nhận/trả phòng, bill, VietQR, giấy tờ, check-in online; API 0.3.4.

## 2. Chất lượng
- Test tự động: **API 559**, web quản trị 70, tích hợp 46 – đều xanh; E2E chạy thật: **332 đạt / 0 trượt** (phần bỏ qua là tính năng của sprint sau hoặc R3).
- Review chéo Sprint 1: ARC 19, SEC 25, UXD 16, QA 13 góp ý – mọi Blocker/Major đã xử lý; 2 lỗi P1 (thứ tự kiểm quyền, build web) đã sửa và kiểm lại.

## 3. Còn mở / chuyển tiếp
- **Máy chủ chạy thử (staging):** chờ anh/chị thuê VPS + mua tên miền.
- Vài mục nhỏ dời Sprint 2–4 có ghi nơi theo dõi (cảnh báo khóa nhiều lần cho chủ đầu tư, endpoint đặt lại bộ đếm cho tài khoản bị khóa có chủ ý – BUG-R2-014 P3…).

## 4. Sprint 2 (tiếp theo)
Đặt phòng & room rack 14 ngày, tạo/đổi/hủy đơn, **chống đặt trùng** (kèm test đồng thời), khóa phòng bảo trì (OOO), không đến (no-show), báo giá ngắn, giữ chỗ + tự hết hạn, xác nhận cọc, đơn dài hạn nhập tay, đơn OTA trùng căn.
