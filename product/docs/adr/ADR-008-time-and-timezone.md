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
2. **`Clock` service** duy nhất, interface chốt: `now(): Instant`, `businessDate(tz): LocalDate` (đổi ngày lúc `business_day_rollover` 06:00 – BR-010), `atLocal(date, time, tz): Instant`. Cấm `new Date()`/`Date.now()` trong code nghiệp vụ (ESLint) và cấm `now()`, `current_date`, `CURRENT_TIMESTAMP` trong SQL nghiệp vụ – thời điểm luôn truyền từ `Clock` làm tham số; `DEFAULT now()` chỉ cho cột kỹ thuật (outbox, log).
   - `SystemClock` (production). **`MutableClock`** (dev/test/staging): offset lưu ở bảng 1 dòng `dev_clock(offset_ms, frozen_at)` để **api và worker dùng chung**, cache 1 giây, xóa cache bằng `NOTIFY clock_changed`; đặt/tua/đóng băng qua `POST /__test__/clock` (`docs/api/openapi.test.yaml`). Thay `FixedClock` (đóng băng) và `CLOCK_OVERRIDE` đọc lúc khởi động.
   - Endpoint `/__test__/*` (cả `POST /__test__/jobs/{jobKey}/run`) chỉ đăng ký khi `APP_ENV ∈ {dev, test, staging}`; module không được import ở production; CI kiểm bundle production không chứa `__test__`; production dừng khởi động nếu `CLOCK_MODE ≠ system` hoặc `dev_clock` có dòng (SR-SECR-05).
3. Máy chủ, container, PostgreSQL chạy `TZ=UTC`; không phụ thuộc múi giờ hệ điều hành.
4. **Một cơ chế lập lịch**: pg-boss chỉ là "chuông" tick mỗi phút; handler lặp theo cơ sở và **so mốc theo `Clock.now()` + `property.timezone`** (không dùng cron theo tz của pg-boss – cron chạy theo giờ DB, không theo `Clock`). Job theo thời điểm (hết hạn giữ chỗ) có `startAfter` để nhanh hơn, nhưng đúng đắn dựa vào lần quét mỗi phút với điều kiện `hold_expires_at <= $now`. Nhờ vậy `/__test__/jobs/{key}/run` cho kết quả giống chạy theo lịch.
5. Client hiển thị theo múi giờ cơ sở trả về từ API (`property.timezone`), không theo múi giờ thiết bị; nếu khác thiết bị, hiện nhãn "giờ Đà Lạt (GMT+7)".
6. Việt Nam không có giờ mùa hè, nhưng vẫn dùng thư viện múi giờ (`@date-fns/tz`) để cơ sở ở nước khác (chuỗi) không phải sửa code.

## Phương án đã cân nhắc
- Lưu mọi thứ là `timestamp` không múi giờ theo giờ VN: đơn giản nhưng sai khi chuỗi mở ở múi giờ khác và dễ nhầm khi so với giờ hệ thống UTC.
- Lưu ngày lưu trú bằng instant 14:00/12:00: gây lỗi lệch ngày khi đổi giờ nhận/trả phòng; tách "đêm" khỏi "giờ" như BR-002/003 rõ hơn.

## Hệ quả
- Tốt: test mốc giờ xác định; không lỗi lệch ngày; sẵn sàng đa múi giờ.
- Phải chấp nhận: dev phải phân biệt instant/date – ghi trong coding-standards (Pha B) và review bắt buộc.

## Cập nhật R1 bước 4 (16/10/2026)
- Điểm 2, 4 viết lại theo BE-ARC-04 và rủi ro kiểm thử của QA (MutableClock, endpoint test chỉ ngoài production, cấm `now()` trong SQL nghiệp vụ, tick + so mốc theo Clock).

## Cập nhật R2 Đợt 0 (16/10/2026) – biến môi trường (khớp `services/api/src/config.ts`)
- `CLOCK_MODE=system|mutable` (mặc định `system`; production bắt buộc `system`) chọn `SystemClock`/`MutableClock`. `FixedClock` chỉ dùng trong test đơn vị, cấu hình không chọn được.
- **Bỏ `CLOCK_OVERRIDE`**: đặt giá trị khác rỗng ở bất kỳ môi trường nào → api/worker dừng khởi động (tránh cấu hình cũ lặng lẽ bị bỏ qua).
- Điểm "endpoint `/__test__/*` chỉ đăng ký khi `APP_ENV ∈ {dev, test, staging}`" làm chặt hơn: module chỉ nạp khi **`INCLUDE_TEST_SUPPORT=1`** (biến chạy) **và** `APP_ENV ≠ production` (production đặt `1` → dừng khởi động); bản build không có build-arg cùng tên thì `dist/test-support` bị xóa. Mỗi request cần `X-Test-Token` = `TEST_SUPPORT_TOKEN` (≥ 32 ký tự, bắt buộc khi bật, cấm ở production) **và** phiên owner; ghi `audit_event`.
- `COOKIE_SECURE_PREFIX=true|false` (mặc định `true`): `false` chỉ cho dev/test chạy HTTP (cookie bỏ tiền tố `__Host-`); staging/production bắt buộc `true`.
- Bảng đầy đủ: `erd.md` mục 2.1; danh sách biến chung: `architecture.md` mục 13.
