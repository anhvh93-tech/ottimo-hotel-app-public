# ADR-006 – App khách là web mở bằng link/QR gắn theo đơn

- Trạng thái: Đề xuất | Người quyết: ARC | Ngày: 15/10/2026 | Round 1 – Pha A
- Liên quan: PRD M11, X10; SEC F09, F12; decision-log 15/10 (link gắn với đơn, hết hạn khi trả phòng); backlog EP14 (US AC3 "xác minh nhẹ")

## Bối cảnh
- Khách không cài app (BL 3.21, PRD X10); nhiều khách nước ngoài (EN/RU); mở bằng link gửi qua email/Zalo/nhóm chat hoặc QR.
- SEC F09: QR cố định theo phòng làm lộ dữ liệu khách trước.

## Quyết định
1. `product/apps/guest-web`: React + Vite SPA mobile-first (ADR-004), có manifest PWA nhẹ (thêm vào màn hình chính tùy chọn), **không** hàng đợi offline ghi (chỉ cache trang thông tin lưu trú để xem khi mất mạng).
2. **Truy cập theo đơn**: mỗi đơn có `guest_access_token` ngẫu nhiên ≥ 128 bit, DB chỉ lưu **băm** (SHA-256); link dạng `https://<domain>/g/<token>`. Hiệu lực từ lúc xác nhận đơn tới **trả phòng + thời gian ân hạn cấu hình** (mặc định 24 giờ – để xem bill); thu hồi được (cấp lại link mới khi lộ).
3. **Hai mức quyền trong phiên khách**:
   - Mức 1 (chỉ có link): thông tin lưu trú, Wi-Fi, giờ, gửi yêu cầu, check-in online (tải giấy tờ – chỉ ghi, không đọc lại ảnh).
   - Mức 2 (link + xác minh): xem bill/folio, hợp đồng, mã cửa – xác minh bằng 4 số cuối SĐT/mã đặt phòng hoặc OTP email (cơ chế cụ thể SEC chốt ở Phần 2). Phiên mức 2 hết hạn sau 30 phút không hoạt động.
4. **QR trong phòng** chỉ dẫn tới trang công khai của căn (hướng dẫn, liên hệ) + ô nhập mã đặt phòng → không lộ dữ liệu khách (F09).
5. Ngôn ngữ: VI/EN ở R2, RU ở R3; ngôn ngữ mặc định theo `guest.preferred_locale` rồi tới `Accept-Language`.
6. Token khách không bao giờ nằm trong log truy cập: Caddy và API che đường dẫn `/g/*` trong log.

## Phương án đã cân nhắc
| Phương án | Vì sao không chọn |
|---|---|
| Tài khoản khách (email + mật khẩu) | Tăng ma sát; khách lưu trú 1–3 đêm không tạo tài khoản |
| Link không hết hạn | Lộ dữ liệu lâu dài khi link bị chuyển tiếp trong nhóm chat |
| Native app cho khách | Ngoài phạm vi (PRD X10) |

## Hệ quả
- Tốt: khách mở trong 1 chạm; kiểm soát dữ liệu theo đơn.
- Phải chấp nhận: link bị chuyển tiếp vẫn xem được mức 1 → mức 1 không chứa dữ liệu C2/C3 ngoài tên gọi tắt và số căn.
