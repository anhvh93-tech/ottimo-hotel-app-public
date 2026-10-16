# ADR-006 – App khách là web mở bằng link/QR gắn theo đơn

- Trạng thái: Đề xuất | Người quyết: ARC | Ngày: 15/10/2026 | Round 1 – Pha A
- Liên quan: PRD M11, X10; SEC F09, F12; decision-log 15/10 (link gắn với đơn, hết hạn khi trả phòng); backlog EP14 (US AC3 "xác minh nhẹ")

## Bối cảnh
- Khách không cài app (BL 3.21, PRD X10); nhiều khách nước ngoài (EN/RU); mở bằng link gửi qua email/Zalo/nhóm chat hoặc QR.
- SEC F09: QR cố định theo phòng làm lộ dữ liệu khách trước.

## Quyết định
1. `product/apps/guest-web`: React + Vite SPA mobile-first (ADR-004), có manifest PWA nhẹ (thêm vào màn hình chính tùy chọn), **không** hàng đợi offline ghi (chỉ cache trang thông tin lưu trú để xem khi mất mạng).
2. **Truy cập theo đơn**: mỗi đơn có `guest_access_token` ngẫu nhiên ≥ 128 bit, DB chỉ lưu **băm** (SHA-256); link dạng `https://<domain>/g/<token>`. Hiệu lực từ lúc xác nhận đơn tới **trả phòng + thời gian ân hạn cấu hình** (mặc định 24 giờ); thu hồi được (cấp lại link mới khi lộ). **Trong ân hạn sau `checked_out` (SR-GST-11, BR-427, US-106 AC2)** chỉ còn xem bill + thanh toán phát sinh, bắt buộc mức 2; Wi-Fi, mã cửa, yêu cầu, tải giấy tờ, đồng ý mới → `403 GUEST_STAY_ENDED`.
3. **Hai mức quyền trong phiên khách**:
   - Mức 1 (chỉ có link): thông tin lưu trú, Wi-Fi, giờ, gửi yêu cầu, check-in online (tải giấy tờ – chỉ ghi, không đọc lại ảnh).
   - Mức 2 (link + xác minh): xem bill/folio, hợp đồng, mã cửa, họ tên đầy đủ. Xác minh bằng **một trong**: (a) **OTP email** 6 số, CSPRNG, 10 phút, gửi tới email trên đơn (tối đa 3 lần/giờ/token; không gửi tới email vừa đổi < 24 giờ – SR-GST-14); (b) **mã xác minh do lễ tân cấp** 6 số, dùng một lần, gắn token đang hiệu lực – đọc tại quầy/gọi điện (10 phút) hoặc, nếu owner bật theo kênh (`guest_verify_code_channels`, **mặc định tắt** – phân xử ORC 15/10, SR-GST-13), dán vào hội thoại OTA/Zalo của đơn (15 phút, ≤ 3 lần/24 giờ, mẫu `verify_code` không chứa link). **4 số cuối SĐT và mã đặt phòng không bao giờ là yếu tố xác minh** (mã đơn tăng dần và nằm trong chính tin chứa link – TM-21). Đếm sai **theo token** (không theo phiên), chung mọi loại mã: 5 lần sai/24 giờ → khóa xác minh, chỉ mã lễ tân tại quầy/điện thoại còn dùng được (SR-GST-08). Phiên mức 2 hết sau 30 phút không hoạt động, tối đa 24 giờ.
4. **QR trong phòng** chỉ dẫn tới trang công khai của căn (`room.public_slug` – hướng dẫn, liên hệ), không truy vấn dữ liệu đơn (SR-GST-12). Ô "nhập mã đặt phòng" trên trang này **không cấp phiên**: chỉ gửi lại link tới **email đã có trên đơn**, luôn trả cùng một thông báo "Nếu mã đúng, link đã được gửi", giới hạn 5 lần/giờ/IP và 3 lần/ngày/đơn (`POST /v1/public/units/{unitSlug}/resend-link`). **Không thu hồi link đang dùng** (BUG-R1-SEC-03 – chống người lạ trong căn phá link của khách): server cấp **link chờ** (`activation=pending`); link cũ, phiên và mã xác minh đang có vẫn dùng được cho tới khi link chờ được **mở lần đầu** – lúc đó mới thu hồi link cũ. Tối đa 2 token/đơn (1 đang dùng + 1 chờ; gọi lại thì thay link chờ). Link chờ kế thừa bộ đếm sai/khóa xác minh. Đơn không có email → không cấp, không đổi gì. Mỗi lần xử lý ghi `audit_event security`. Lễ tân cấp lại link (`issueGuestLink`, khi link bị lộ) vẫn thu hồi ngay.
5. Ngôn ngữ: VI/EN ở R2, RU ở R3; ngôn ngữ mặc định theo `guest.preferred_locale` rồi tới `Accept-Language`.
6. Token khách không bao giờ nằm trong log truy cập: Caddy và API che đường dẫn `/g/*` trong log.
7. Cookie phiên khách `__Host-ottimo_gsid` ở origin guest-web riêng (3 origin – SR-HDR-04); không endpoint nào nhận cả cookie khách và cookie nhân viên.
8. Khách đến khuya (SR-GST-15): mời check-in online + xác minh mức 2 trong giờ trực; người trực đêm dùng **thiết bị của cơ sở** đã được cấp để đối chiếu giấy tờ và đọc mã xác minh – không dùng điện thoại cá nhân/PWA.

## Phương án đã cân nhắc
| Phương án | Vì sao không chọn |
|---|---|
| Tài khoản khách (email + mật khẩu) | Tăng ma sát; khách lưu trú 1–3 đêm không tạo tài khoản |
| Link không hết hạn | Lộ dữ liệu lâu dài khi link bị chuyển tiếp trong nhóm chat |
| Native app cho khách | Ngoài phạm vi (PRD X10) |

## Hệ quả
- Tốt: khách mở trong 1 chạm; kiểm soát dữ liệu theo đơn.
- Phải chấp nhận: link bị chuyển tiếp vẫn xem được mức 1 → mức 1 không chứa dữ liệu C2/C3 ngoài tên gọi tắt và số căn.

## Cập nhật R1 bước 4 (16/10/2026)
- Điểm 2, 3, 4 viết lại theo SEC (SR-GST-07…15), thẻ FB-R1-SEC-ARC-01, -02, -03, -20 và phân xử ORC 15/10 (kênh OTA/Zalo mặc định tắt). Endpoint: `sendGuestOtp`, `verifyGuestSession {method, code}`, `issueGuestVerificationCode`, `resendGuestLinkFromUnit`, `withdrawGuestConsent` (US-141).

## Cập nhật R1 bước 5 (16/10/2026)
- Điểm 4: link chờ khi gửi lại từ trang QR căn, không thu hồi link đang dùng (BUG-R1-SEC-03; erd `guest_access_token.activation`).
- App khách: mọi operation khai `x-after-checkout` và `403 GuestForbidden` (`GUEST_STAY_ENDED`/`GUEST_VERIFICATION_REQUIRED`); `getGuestStay` khai `x-c3-log` (BUG-R1-SEC-04).
