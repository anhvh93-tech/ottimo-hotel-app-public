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

---

## Round 2 – Sprint 2, bước Phản hồi & sửa (16/10/2026)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-DOM-ARC-01 | Done | Đã thêm vào `openapi.yaml` 0.3.5-draft (đoạn "Bổ sung theo DOM") + erd 0.3.5: (1) `MoveReasonCode` enum D-5 kèm ràng buộc vai/chế độ; (2) `CAPACITY_EXCEEDED_WARNING` + `capacityWarningAckReason`, `Reservation.capacityConflict`, điều kiện B9 `capacity_within_max`, kind "Cần chú ý" `capacity_conflict` – cờ **tách** khỏi `conflictState` (không lẫn làn chưa gán/KPI S1c); (3) `restoreNoShow` thêm `roomId` + `allowUnassigned`, đã duyệt thì không bao giờ 409, `OverbookingIncident.source` thêm `no_show_restore`; (4) `stay_night.calendar_rate_vnd` + `NightRate.calendarRateVnd` (chỉ đọc). Việc BE-A: `outputs/ARC/s2-contract.md` mục 8.3 |
| BUG-R2-017 (phần ARC) | Done | Tham số `ota_base_rate` (một khóa json theo mã nhóm) + biên + `rounding.ota_rate` trong erd 9.1/9.1a; OpenAPI không đổi. BE-A thêm vào catalogue bằng migration mới; QA seed. `s2-contract.md` mục 8.1 |
| BUG-R2-018 (phần ARC) | Done | Sàn–trần BR-105 tính theo `ota_base_rate[nhóm]`, làm tròn 10.000, mọi kênh – `s2-contract.md` mục 8.1 |
| BUG-R2-021 (phần ARC) | Done | architecture 9.1 chốt `hold.expire`, `ooo.activate`; J9 theo ngày nghiệp vụ 06:00 (BR-010) |

---

## Landing + Zalo OA – thẻ SEC (`reviews/landing-zalo-SEC.md`, mục 2) – trả lời 17/10/2026 khuya (OpenAPI 0.3.7 bổ sung 2, ADR-014 mục 4 viết lại)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-SEC-ARC-02 | Done | Trần cơ sở → `503 SITE_BUSY` + `Retry-After`, không lưu, không giả thành công; một thông báo `website_request_cap_reached` cho OWN/ngày; tham số bảo mật `public_booking_request_daily_cap` 100 (biên 50–500) – ghi chú trong `x-security-parameters`, bật cùng PR US-155. Ô bẫy vẫn 202 giống hệt. `createWebsiteBookingRequest` bước 10; ADR-014 4.4 điểm 5 |
| FB-R2-SEC-ARC-03 | Done | Hạn lưu cho mọi trạng thái + trần tuyệt đối (stale 30 · 7–60; declined 90 · 30–90; spam 7 · 1–7; max_age 180 · 90–180; ip_hmac 30 · 7–30); job đọc theo ngày tạo + hoạt động cuối; `reopen` không vượt `max_age`; `purge_journal`; ca `Clock` giả như thẻ. erd 4.14, 9.2, 12; ADR-014 4.6. Mã T19 là giả định – SEC đặt khi cập nhật DRA |
| FB-R2-SEC-ARC-04 | Done | Vượt giới hạn liên hệ → 202 giống hệt, không bản ghi mới, `duplicateCount` + cờ `repeat_contact`; IPv6 đếm theo /64; endpoint không đọc `guest`/`lead`/`reservation`/`room_occupancy` trước khi trả lời, mọi kết quả cùng hình dạng, không trả lại dữ liệu nhập; `refCode` không phải yếu tố xác minh, không có endpoint tra theo mã. ADR-014 4.3, 4.4 |
| FB-R2-SEC-ARC-05 | Done (phần kỹ thuật) | Ô đồng ý không tích sẵn, một mục đích, không ô ưu đãi; `consentVersion` phải là bản đã đăng (`privacy_notice_version` – băm văn bản, ngày đăng); bộ đếm trong DB `rate_limit_counter` từ ngày bật; căn cứ đổi sang "Luật 91/2025 + NĐ 356/2025" [Chưa xác minh – luật sư]. Văn bản thông báo: SEC soạn, luật sư duyệt (ESC-001) |
| FB-R2-SEC-ARC-06 | Done | Origin khai theo operation `x-allowed-origins: [landing]`; operation nhân viên/khách không bao giờ nhận origin landing; endpoint công khai bỏ qua cookie; Caddy origin landing chỉ proxy các đường dẫn đã bật (ADR-014 1.4); `public_resolve_property` theo mẫu SECURITY DEFINER (erd 4.14). Generator meta + guard: BE-D trong PR US-155; test "Origin landing gọi thao tác ghi của nhân viên/khách → 403" vào DoD |
| FB-R2-SEC-ARC-07 | Done | HMAC SĐT dùng khóa dẫn xuất `keyedHash('web_request_contact')`; `PUBLIC_FORM_SIGNING_KEY_FILE` ≥ 32 byte, kiểm khi khởi động khi bật form; sổ bí mật (OPS, xoay 12 tháng) – SEC thêm vào SR-SECR-04/05 |
| FB-R2-SEC-ARC-08 | Done | `note` có số CCCD/hộ chiếu/MRZ → 422 mã trường `ID_NUMBER_DETECTED`, không lưu (bộ nhận diện SR-LOG-04); trang ghi "Không ghi số thẻ, số giấy tờ hay thông tin sức khỏe" |
| FB-R2-SEC-ARC-09 | Deferred | `recordSiteEvent`/`web_metric_daily` chưa vào hợp đồng; làm cùng US-158 (R3) và áp đủ 3 điểm của thẻ lúc đó (đường dẫn trong danh sách đã phát hành, giới hạn giá trị mới, gom trong RAM ghi mỗi phút) |
| FB-R2-SEC-ARC-10 | Done (17/10 tối) | `hosting-plan.md` mục 10 + ADR-014 1.4/8: bảo vệ tài khoản tên miền (việc INV ở ESC-020 L4), CAA, kiểm tên miền con trước HSTS, staging chặn bằng basic auth/IP |
| FB-R2-SEC-ARC-11 | Done | Đã có từ 17/10 tối: kiểm CI `dist` + đếm request (ADR-014 2.6). Thêm 17/10 khuya: điều kiện thứ 5, câu cho thông báo quyền riêng tư, `localStorage` sáng/tối là tùy chọn giao diện (ADR-014 6.3) |
| FB-R2-SEC-ARC-12 | Done | SAL chỉ thấy yêu cầu `new` chưa giao + yêu cầu giao cho mình (`x-scope: { sales_staff: unassigned_or_own }` ở list/get/transition; ngoài phạm vi → 404); FD+ thấy hết; CTV không có quyền. Ca lớp 2 SR-AZ-09 lấy từ `rbac-cases` khi bỏ `x-round` |
