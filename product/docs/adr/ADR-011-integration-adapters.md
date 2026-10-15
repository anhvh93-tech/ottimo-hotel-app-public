# ADR-011 – Lớp adapter tích hợp + outbox/inbox (xác nhận thiết kế INT, có bổ sung)

- Trạng thái: Đề xuất | Người quyết: ARC (kiến trúc) cùng INT (chi tiết adapter) | Ngày: 15/10/2026
- Liên quan: `product/integrations/README.md` (INT), `product/docs/integrations.md`; decision-log 15/10 (INT: adapter có Mock, outbox/inbox; chỉ ghi tiền từ IPN đã xác thực); ADR-003; architecture.md mục 13–14

## Bối cảnh
INT đã đề xuất 6 interface (`ChannelAdapter`, `PaymentAdapter`, `EInvoiceAdapter`, `DoorLockAdapter`, `NotificationAdapter`, `GuestRegistrationAdapter`), mỗi cái có Mock, chọn bằng biến môi trường, gọi ra qua outbox, callback vào qua inbox idempotent. ARC cần chốt vị trí trong kiến trúc và những điểm bổ sung để đa cơ sở + thay nhà cung cấp không sửa lõi.

## Quyết định
1. **Chấp nhận** thiết kế INT làm nền. Vị trí code: `product/integrations/` là **workspace package TypeScript** `@ottimo/integrations` (mỗi nhóm một thư mục con như INT đề xuất), được `services/api` và `worker` import. Lõi chỉ phụ thuộc **interface** trong `@ottimo/integrations/contracts`; cài đặt cụ thể được NestJS DI chọn lúc khởi động qua `IntegrationRegistry`.
2. **Luồng ra**: nghiệp vụ ghi `outbox_message(topic, aggregate_id, payload, dedupe_key, property_id)` **cùng giao dịch** → worker (pg-boss) gọi adapter → ghi `integration_log`. Retry 5 lần lùi cấp số nhân → "Cần chú ý" (BR-907).
3. **Luồng vào**: endpoint `POST /v1/webhooks/{provider}/{propertySlug}` (+ `GET` cho cổng gửi IPN qua query string – VNPay) chỉ làm 3 việc: xác thực chữ ký (nếu nhà cung cấp có), ghi `inbox_message` với khóa duy nhất, trả 2xx nhanh; worker xử lý sau. Riêng **IPN thanh toán** xử lý đồng bộ trong request (vì cổng cần `RspCode` đúng) nhưng vẫn idempotent theo `paymentId`.
4. **Bổ sung bắt buộc so với bản INT** (gửi lại INT ở bước 3 dưới dạng thẻ review; INT sửa README):
   | # | Bổ sung | Lý do |
   |---|---|---|
   | B1 | Mọi lời gọi adapter nhận `ctx: { propertyId, credentialsRef }`; registry tạo instance **theo cơ sở** | Đa cơ sở: mỗi cơ sở có tài khoản CM/VNPay/MISA riêng (ADR-007) |
   | B2 | Ngày lưu trú truyền dạng chuỗi `YYYY-MM-DD` (`LocalDate`), thời điểm dạng ISO có offset; **không** dùng `Date` cho ngày lưu trú | ADR-008 – tránh lệch ngày khi đổi UTC |
   | B3 | `ChannelBookingEvent` thêm `modifiedAt`, `externalRoomRef` + `ratePlanRef`, `adults`/`children`, `currency` + `amountOriginal` (OTA có thể trả USD/EUR), `channelFee` **có thể vắng** → lõi dùng `channel_commission_pct` (BR-901) và đánh dấu "ước tính" | DATA tính thực thu (BL 5.11); không bịa phí |
   | B4 | **Webhook kênh = tín hiệu, không phải dữ liệu tin cậy**: sau khi nhận, worker **kéo lại đơn** qua API (`fetchBooking(externalId)`) rồi mới ghi | Không phụ thuộc việc CM có ký webhook hay không; chống giả mạo |
   | B5 | `verifyCallback` trả về `Promise` (async) | Một số cổng cần gọi lại API để xác minh |
   | B6 | Lỗi chuẩn `IntegrationError { code, retryable, providerMessage }` | Worker biết khi nào retry, khi nào chuyển "Cần chú ý" ngay |
   | B7 | Mỗi adapter có `healthCheck()` | Hiện trạng thái tích hợp trên Tổng quan (BR-907 "đồng bộ kênh lỗi") |
   | B8 | Khóa/tài khoản: MVP đọc từ biến môi trường (như INT đề xuất). Khi > 1 cơ sở: chuyển sang bảng `integration_credential` mã hóa bằng khóa trong biến môi trường; interface không đổi | Đa cơ sở không phải thêm biến môi trường cho từng cơ sở |
   | B9 | `pushAvailability` nhận **khoảng ngày đã gộp** (`from`, `to`, `available`) thay vì từng ngày; adapter tự chia theo giới hạn API | Giới hạn Beds24 100 credit/5 phút [Nguồn INT] |
   | B10 | Mock adapter có **kịch bản lỗi cấu hình được** (timeout, chữ ký sai, gửi trùng, đến trễ) | QA test đường lỗi trong CI không cần mạng |
5. **Đồng bộ tồn lên kênh**: thay đổi trong `room_occupancy` (ADR-009) sinh outbox `channel.availability_changed(propertyId, roomGroup|room, from, to)`; worker **gộp lô** theo `singletonKey` mỗi 20–30 giây rồi đẩy – mục tiêu ≤ 1 phút (BR-905). Đối soát mỗi đêm 02:00 giờ cơ sở: `getInventorySnapshot` so với DB, lệch → "Cần chú ý".

## Phương án đã cân nhắc
- Gọi SDK nhà cung cấp trực tiếp từ module nghiệp vụ: nhanh lúc đầu, nhưng đổi CM/cổng phải sửa lõi; không test được khi chưa có tài khoản.
- Đặt adapter thành dịch vụ riêng (process riêng): thừa ở quy mô này; worker đã là process riêng.

## Hệ quả
- Tốt: R2 chạy hoàn toàn bằng Mock; R3 bật thật bằng biến môi trường; đổi Beds24 → Channex chỉ viết adapter mới.
- Phải chấp nhận: thêm bảng outbox/inbox/log và độ trễ bất đồng bộ (vài chục giây) cho đồng bộ kênh.

## Cập nhật R1 bước 4 (16/10/2026)
- OpenAPI dùng đúng đường dẫn điểm 3 (một họ đường dẫn cho cổng thanh toán và channel manager, `provider ∈ vnpay, momo, sepay, payos, beds24, mock`); `mock` không đăng ký ở production; provider `off` không đăng ký route; body ≤ 64 KB; cơ sở xác định bằng hàm `webhook_resolve_property` (erd 2.4).
- Payload channel manager chỉ lưu bản **đã lọc theo allowlist** (`inbox_message.filtered_payload`), xóa sau 90 ngày; không lưu `ChannelBookingEvent.raw` (SR-PAY-09).
- `integration_log.cost_units` theo dõi credit Beds24; `payment.method_detail` cho kênh con của cổng; hoàn tiền là `payment` riêng `type=refund`; bản ghi xung đột OTA ở `overbooking_incident` (không thêm bảng `booking_conflict`).
- Đóng gói `@ottimo/integrations`: ADR-012 mục "Đóng gói ESM/CJS".
