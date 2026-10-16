# ARC – Phản hồi thẻ review Round 2, Sprint 1

- Vai: ARC | Ngày: 16/10/2026 | Hợp đồng: `product/docs/api/openapi.yaml` **0.3.4-draft**, `product/docs/erd.md` 0.3.4
- Không có file `reviews/*-on-ARC.md` ở Sprint 1. Các thẻ dưới đây là thẻ gửi tác giả khác nhưng ghi **người sửa: ARC** hoặc đề xuất ARC sửa hợp đồng.
- Chi tiết thay đổi: `outputs/ARC/s1-fix.md`.

### FB-R2-SEC-BE-16 (Minor) – `Guest.gender` lộ cho SAL/CTV
- Trạng thái: **Accepted – đã sửa** (0.3.4)
- Cách sửa: `Guest.gender` thêm `x-visible-to: [owner, manager, front_desk_lead, front_desk]` (D01 SAL/CTV chỉ tên + quốc tịch). `openapi-schemas.ts` đã sinh lại → serializer BE lọc ngay, không cần sửa mã. QA thêm vào snapshot JSON theo vai.
- Ghi chú: `isForeigner`, `preferredLocale`, `preferredContact` giữ cho SAL/CTV (cần cho liên hệ/đặt phòng) – nếu SEC muốn thu hẹp nữa thì mở thẻ R3.

### FB-R2-QA-BE-04 (Minor) – Định dạng SĐT trả về
- Trạng thái: **Accepted – đã chốt**
- Quyết định: response API là **E.164 có `+`** (`+84905123456`) – khớp mã BE hiện tại (`phoneForApi`). `Guest.phone` thêm `pattern: '^\+[1-9][0-9]{7,14}$'`; mục "Quy ước chung" ghi rõ. DB `guest.phone_e164` giữ không dấu `+` (erd ghi rõ). EP00 V-02 đã thêm câu "API trả về dạng E.164 có `+`" kèm thẻ `[ARC 16/10 – BA xác nhận câu chữ]`. QA siết TC-L5-041 theo dạng `+84…`.

### FB-R2-QA-BE-05 (Minor) – `changeMyPassword` "giữ phiên hiện tại"
- Trạng thái: **Accepted – đã sửa**
- Cách sửa: summary → "thu hồi mọi phiên kể cả phiên đang gọi, cấp phiên mới cho client đang gọi"; thêm `description` + `204` có header `Set-Cookie`, nêu `csrfToken` đổi (gọi lại `getMe`) và `User.version` tăng (ETag cũ → 412). Sai mật khẩu hiện tại → `401 REAUTH_FAILED` (Q4).

### FB-R2-SEC-BE-20 (Suggestion) – Phạm vi `session_policy`/`login_lockout`
- Trạng thái: **Accepted (phương án 2)**
- Quyết định: giữ lưu theo cơ sở (không thêm tầng tham số tổ chức ở R2); khi đăng nhập/kiểm phiên server dùng giá trị **chặt nhất** trong các cơ sở người dùng có vai đang hoạt động; ngày hiệu lực theo giờ cơ sở. Ghi ở mô tả `x-security-parameters` và erd 9.3. Tham số cấp tổ chức xem lại ở R3 khi có chuỗi nhiều cơ sở thật.
