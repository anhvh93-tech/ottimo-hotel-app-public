# ADR-008 – Thời gian: UTC cho thời điểm, ngày nghiệp vụ theo múi giờ cơ sở, `Clock` tiêm được

- Trạng thái: Đề xuất | Người quyết: ARC | Ngày: 15/10/2026 | Round 1 – Pha A
- Liên quan: BR-001, BR-002, BR-003; PRD N5; BL 7 ("giờ demo" T0), 8.4 (tính ngày bằng độ lệch số nguyên); plan QC C3

## Bối cảnh
- Mọi hạn (giữ chỗ, 12:00 trả phòng, 23:00 khai báo VN, 12 giờ khai báo NN, 07:00 chuyển OC→OD) tính theo giờ Việt Nam kể cả khi người thao tác ở nước ngoài (chủ đầu tư đi công tác, CTV).
- Đêm lưu trú là **ngày lịch**, không phải thời điểm.
- QA cần "giờ demo" để test các mốc giờ (prototype dùng T0 cố định).

## Quyết định
1. **Hai kiểu dữ liệu tách bạch**:
   - *Thời điểm* (instant): `timestamptz` trong DB, lưu UTC; API trả ISO 8601 **có offset của cơ sở** (vd. `2026-10-15T14:00:00+07:00`).
   - *Ngày nghiệp vụ* (ngày đến/đi, đêm, kỳ thu, ngày chốt công tơ): `date` trong DB, API dạng `YYYY-MM-DD`, **luôn hiểu theo `property.timezone`**. Khoảng lưu trú là `daterange '[arrival, departure)'` (BR-002).
   - *Giờ trong ngày cấu hình* (14:00, 12:00, 23:00): `time` + múi giờ cơ sở → đổi ra instant khi cần.
2. **`Clock` service** duy nhất (`now()`, `businessDate(propertyId)`, `atLocal(date, time, propertyId)`); cấm gọi `new Date()`/`Date.now()` trong code nghiệp vụ (ESLint `no-restricted-syntax`). Môi trường dev/staging cho phép đặt giờ giả (`CLOCK_OVERRIDE`, chỉ khi `NODE_ENV != production`) → QA test mốc giờ.
3. Máy chủ, container, PostgreSQL chạy `TZ=UTC`; không phụ thuộc múi giờ hệ điều hành.
4. Job theo lịch (pg-boss) đăng ký theo **múi giờ cơ sở** (`tz: property.timezone`). Job theo thời điểm cụ thể (hết hạn giữ chỗ của đơn X) được lên lịch tại instant tính sẵn + **job quét mỗi phút** làm lưới an toàn nếu worker từng tắt.
5. Client hiển thị theo múi giờ cơ sở trả về từ API (`property.timezone`), không theo múi giờ thiết bị; nếu khác thiết bị, hiện nhãn "giờ Đà Lạt (GMT+7)".
6. Việt Nam không có giờ mùa hè, nhưng vẫn dùng thư viện múi giờ (`@date-fns/tz`) để cơ sở ở nước khác (chuỗi) không phải sửa code.

## Phương án đã cân nhắc
- Lưu mọi thứ là `timestamp` không múi giờ theo giờ VN: đơn giản nhưng sai khi chuỗi mở ở múi giờ khác và dễ nhầm khi so với giờ hệ thống UTC.
- Lưu ngày lưu trú bằng instant 14:00/12:00: gây lỗi lệch ngày khi đổi giờ nhận/trả phòng; tách "đêm" khỏi "giờ" như BR-002/003 rõ hơn.

## Hệ quả
- Tốt: test mốc giờ xác định; không lỗi lệch ngày; sẵn sàng đa múi giờ.
- Phải chấp nhận: dev phải phân biệt instant/date – ghi trong coding-standards (Pha B) và review bắt buộc.
