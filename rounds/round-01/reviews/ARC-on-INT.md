# ARC review INT – Round 1, Bước 3

- Người review: ARC | Ngày: 15/10/2026 | Loại: review bắt buộc (plan R1 mục 5)
- Phạm vi đã đọc: `product/docs/integrations.md`, `product/docs/integrations/channel-manager-comparison.md`, `product/docs/integrations/smart-lock.md`, `product/integrations/README.md`; đối chiếu với `architecture.md` mục 13–14, ADR-011, `erd.md` (mục 4.6, 4.12, 5, 7), `api/openapi.yaml`, `state-machines.md` SM-12, `security-requirements.md` (SR-PAY, SR-INT, SR-LOCK, SR-SECR-05), khung OPS `product/integrations/**`.
- Ghi chú: 10 điểm bổ sung B1–B10 ARC đã nêu ở ADR-011 mục 4 và architecture mục 13 được chuyển thành thẻ 01–10 dưới đây (đúng như architecture mục 13 hứa). Thẻ 11–18 là phát hiện thêm khi đối chiếu ERD/OpenAPI/SEC.
- Kết luận nhanh: thiết kế adapter + outbox/inbox của INT **đúng hướng và ARC giữ làm nền** (ADR-011). Cần sửa interface trước khi BE/INT code R2, vì interface là hợp đồng giữa lõi và adapter – đổi sau sẽ phải sửa mọi Mock và test.

---

### FB-R1-ARC-INT-01
- Mức độ: Major
- Vị trí: `product/integrations/README.md` mục 3.1–3.6 (mọi interface) – điểm **B1** của ADR-011
- Vấn đề: Không lời gọi nào nhận ngữ cảnh cơ sở. Ví dụ `pushAvailability(items)`, `createPayment(req)`, `issue(req)` – adapter không biết đang thao tác cho cơ sở nào, dùng tài khoản Beds24/VNPay/MISA nào. Registry chỉ chọn cài đặt theo biến môi trường toàn hệ thống (mục 1.3).
- Vì sao quan trọng: ADR-007 thiết kế đa cơ sở từ đầu (mỗi cơ sở có `propCode` Beds24, `TmnCode` VNPay, MST/mẫu hóa đơn MISA riêng). Thêm tham số sau khi đã có 6 adapter + Mock + test = sửa toàn bộ.
- Đề xuất sửa: Mọi phương thức nhận tham số đầu `ctx: IntegrationContext = { propertyId: string; credentialsRef: string; requestId: string }`. `IntegrationRegistry.get<T>(kind, propertyId)` trả instance theo cơ sở (cache). Ví dụ: `pushAvailability(ctx, ranges)`, `createPayment(ctx, req)`. Cập nhật luôn `notification/types.ts` trong khung OPS (INT tiếp quản).
- Trạng thái: Open

### FB-R1-ARC-INT-02
- Mức độ: Major
- Vị trí: README 3.1 `getInventorySnapshot(from: Date, to: Date)`, `AvailabilityItem.date` (kiểu chưa nêu), `RateItem.date`; 3.3 `issuedAt: Date`; 3.2 `expiresAt: Date` – điểm **B2**
- Vấn đề: Ngày lưu trú/ngày lịch đang có chỗ dùng `Date` (một thời điểm UTC). `new Date('2026-10-20')` là 00:00 UTC = 07:00 giờ VN; chuyển qua lại dễ lệch 1 ngày khi format theo múi giờ máy chủ (TZ=UTC) – đúng loại lỗi BL 8.2 về ngày. `ChannelBookingEvent.checkIn: string` thì đã đúng.
- Vì sao quan trọng: tồn phòng sai ngày đẩy lên OTA = đặt trùng hoặc mất bán (ADR-009, BR-905).
- Đề xuất sửa: Quy ước trong README mục 1: (a) ngày lịch (`date`, `from`, `to`, `checkIn`, `checkOut`) = `LocalDate` kiểu chuỗi `YYYY-MM-DD` theo `property.timezone`; (b) thời điểm (`expiresAt`, `issuedAt`, `validFrom`, `validTo`, `modifiedAt`, `since`) = chuỗi ISO 8601 **có offset** (`2026-10-20T14:00:00+07:00`), không dùng `Date` trong interface. Thêm `type LocalDate = string` / `type IsoInstant = string` (brand type) vào `@ottimo/integrations/contracts`.
- Trạng thái: Open

### FB-R1-ARC-INT-03
- Mức độ: Major
- Vị trí: README 3.1 `ChannelBookingEvent` và câu "Idempotency: `(channel, externalId, type, modifiedAt)`" – điểm **B3**
- Vấn đề: (1) Khóa idempotency dùng `modifiedAt` nhưng **kiểu không có trường `modifiedAt`** – mâu thuẫn ngay trong tài liệu. (2) Thiếu `externalRoomRef` + `ratePlanRef` (cần cho `channel_mapping` – erd 4.12), `adults`/`children` (BR-110 phụ thu, BR-601 số người khai báo), `currency` + `amountOriginal` (OTA quốc tế trả USD/EUR; `amountVnd` giả định đã quy đổi). (3) `channelFeeVnd?` không nói khi vắng thì sao – erd `channel_fee.source` cần biết là "thực tế" hay "ước tính". (4) Một đơn OTA nhiều phòng (Booking.com cho đặt 2 căn trong 1 đơn) – kiểu chỉ có một `roomRef`.
- Vì sao quan trọng: DATA tính thực thu, phí kênh (BL 5.11, metrics); thiếu số khách làm sai phụ thu và khai báo; đơn nhiều phòng là ca thật ở 10 căn/3 nhóm.
- Đề xuất sửa: Thêm `modifiedAt: IsoInstant`, `externalRoomRef`, `ratePlanRef`, `adults`, `children`, `currency`, `amountOriginal` (số nguyên đơn vị nhỏ nhất), `amountVnd?` (chỉ khi CM đã quy đổi), `channelFee?: { amount, currency, isEstimate: boolean }`, `groupRef?` (mã đơn gốc khi 1 đơn OTA tách nhiều phòng – lõi tạo nhiều `reservation` liên kết). Ghi rõ: vắng `channelFee` → lõi tính theo `channel_commission_pct` (BR-901) và `channel_fee.source = 'estimate'`.
- Trạng thái: Open

### FB-R1-ARC-INT-04
- Mức độ: Major
- Vị trí: README 3.1 `parseWebhook(headers, rawBody): ChannelBookingEvent` – điểm **B4**; liên quan SEC-R1-08 (`raw: unknown`)
- Vấn đề: Interface coi nội dung webhook là **dữ liệu đơn tin cậy** để ghi thẳng. Chưa xác minh Beds24 có ký webhook (channel-manager-comparison ghi "chưa xác minh"); `CHANNEL_WEBHOOK_SECRET` có thể không dùng được. Thiếu `fetchBooking(externalId)` để kéo lại đơn. Ngoài ra `raw: unknown` lưu nguyên payload có thể chứa thẻ ảo (VCC) – SEC đã nêu.
- Vì sao quan trọng: webhook giả mạo tạo/hủy đơn → sai tồn phòng, mất khách. Mẫu "webhook = tín hiệu, kéo lại qua API" an toàn bất kể nhà cung cấp có ký hay không (ADR-011 mục 3, SR-INT-01).
- Đề xuất sửa: Đổi thành `parseWebhookSignal(ctx, headers, rawBody): { externalId: string; hint?: 'new'|'modified'|'cancelled'; eventId: string }` (chỉ để ghi `inbox_message`), thêm `fetchBooking(ctx, externalId): Promise<ChannelBookingEvent | null>`; worker (J19) luôn kéo lại rồi mới ghi. `raw` đổi thành `rawFiltered` – adapter lọc theo danh sách trường cho phép trước khi trả (SR-PAY-09).
- Trạng thái: Open

### FB-R1-ARC-INT-05
- Mức độ: Minor
- Vị trí: README 3.2 `verifyCallback(...)` (đồng bộ) – điểm **B5**
- Vấn đề: `verifyCallback` trả kết quả đồng bộ. Một số cổng/bank feed cần gọi API để xác minh (SR-PAY-04 yêu cầu `queryStatus` trước khi ghi `succeeded`; SR-PAY-07 kéo lại giao dịch bank feed). Kết quả cũng thiếu `currency` và mã kết quả gốc của cổng để SR-PAY-02 kiểm "mã kết quả là thành công".
- Vì sao quan trọng: đổi chữ ký hàm từ sync sang async sau này kéo theo sửa controller IPN và test.
- Đề xuất sửa: `verifyCallback(ctx, req: { method: 'GET'|'POST'; headers; query; rawBody }): Promise<{ valid; paymentId; providerTxnId; amount; currency; providerResultCode; status }>`; thêm `method` vì VNPay IPN có thể là GET (SEC-R1-07, INT xác minh).
- Trạng thái: Open

### FB-R1-ARC-INT-06
- Mức độ: Major
- Vị trí: README mục 1.4 (retry 5 lần) – điểm **B6**; thiếu kiểu lỗi chuẩn
- Vấn đề: Không có quy ước lỗi. Worker (J18 `outbox.dispatch`) không phân biệt được lỗi tạm (timeout, 429, 5xx → retry) với lỗi vĩnh viễn (sai cấu hình, 4xx dữ liệu, chữ ký sai → chuyển "Cần chú ý" ngay, không retry 5 lần).
- Vì sao quan trọng: retry lỗi vĩnh viễn làm chậm báo lỗi (5 lần lùi cấp số nhân ≈ hàng chục phút) và tốn credit Beds24 (100 credit/5 phút).
- Đề xuất sửa: Định nghĩa `class IntegrationError extends Error { code: 'TIMEOUT'|'RATE_LIMITED'|'UNAVAILABLE'|'AUTH'|'CONFIG'|'INVALID_REQUEST'|'NOT_FOUND'|'CONFLICT'|'UNKNOWN'; retryable: boolean; retryAfterMs?: number; providerMessage?: string /* đã lọc PII */ }`. Mọi adapter chỉ ném lỗi này; Mock ném được từng loại (thẻ 10).
- Trạng thái: Open

### FB-R1-ARC-INT-07
- Mức độ: Minor
- Vị trí: README mục 3 – điểm **B7**
- Vấn đề: Không có cách hỏi trạng thái kết nối của adapter.
- Vì sao quan trọng: BR-907 "Cần chú ý" có mục "đồng bộ kênh lỗi"; Tổng quan và OPS cần biết token Beds24 hết hạn/MISA sai mật khẩu trước khi có đơn lỗi.
- Đề xuất sửa: Mỗi adapter có `healthCheck(ctx): Promise<{ status: 'ok'|'degraded'|'down'; checkedAt: IsoInstant; detail?: string }>` – gọi rẻ (ví dụ lấy thông tin tài khoản), worker chạy mỗi 15 phút, ghi `integration_log`.
- Trạng thái: Open

### FB-R1-ARC-INT-08
- Mức độ: Minor
- Vị trí: README mục 4 (biến môi trường) – điểm **B8**
- Vấn đề: Khóa đọc thẳng từ biến môi trường toàn hệ thống. Đúng cho MVP 1 cơ sở, nhưng interface chưa che chuyện này (adapter tự đọc `process.env`?).
- Vì sao quan trọng: khi có cơ sở thứ 2 không muốn thêm `CHANNEL_BEDS24_REFRESH_TOKEN_2`… và sửa adapter.
- Đề xuất sửa: Adapter **không** đọc `process.env`; nhận `credentials` qua `CredentialProvider.get(credentialsRef)`. MVP: `EnvCredentialProvider` đọc biến như mục 4. Khi > 1 cơ sở: `DbCredentialProvider` đọc bảng `integration_credential` mã hóa (ARC thêm vào ERD khi cần). Interface adapter không đổi.
- Trạng thái: Open

### FB-R1-ARC-INT-09
- Mức độ: Major
- Vị trí: README 3.1 `pushAvailability(items: AvailabilityItem[])` với `{roomRef, date, available}` – điểm **B9**; `channel-manager-comparison.md` mục 5 (việc cần làm)
- Vấn đề: Đẩy tồn **theo từng ngày**. Giới hạn Beds24 100 credit/5 phút [Nguồn INT]; đối soát hằng đêm 10 căn × 365 ngày. Chưa có ước tính số lời gọi/credit mỗi ngày (architecture mục 14 đề nghị bổ sung 1).
- Vì sao quan trọng: vượt hạn mức → Beds24 từ chối → tồn trên OTA cũ → đặt trùng (mục tiêu S1, BR-905 ≤ 1 phút).
- Đề xuất sửa: Đổi thành `pushAvailability(ctx, ranges: { roomRef; from: LocalDate; to: LocalDate /* nửa mở */; available: number; closed?: boolean }[])`; adapter tự chia lô theo giới hạn API. Tương tự `pushRates` theo khoảng. Bổ sung vào comparison mục 3.1 bảng ước tính: số lời gọi/credit cho (a) một thay đổi đơn lẻ, (b) đối soát đêm 365 ngày, (c) đỉnh 10 thay đổi/5 phút – dựa trên tài liệu API V2 (không cần tài khoản).
- Trạng thái: Open

### FB-R1-ARC-INT-10
- Mức độ: Major
- Vị trí: README mục 1.2 ("Mock không mạng, dữ liệu xác định"); khung `integrations/notification/mock.ts` – điểm **B10**
- Vấn đề: Mock chỉ có đường thành công. Không có cách cấu hình kịch bản lỗi.
- Vì sao quan trọng: SR-PAY-01 (R2 với Mock) yêu cầu test chữ ký sai/thiếu/trường bị sửa; QA cần test IPN trùng, đến trễ, đến trước response, timeout, OTA gửi đơn trùng căn (ERD mục 7) – tất cả trong CI, không mạng. Thiếu kịch bản lỗi thì các test bắt buộc của ADR-009/011 không viết được.
- Đề xuất sửa: Mỗi Mock nhận `MockScenario` cấu hình được qua biến `<NHÓM>_MOCK_SCENARIO` (dev/staging) và qua hàm trong test: `ok | timeout | rate_limited | invalid_signature | duplicate_callback | late_callback | callback_before_response | amount_mismatch | conflict_booking | out_of_order`. Mock thanh toán có hàm `emitCallback(paymentId, variant)` để test gọi IPN vào API. Route webhook `mock` không đăng ký khi `NODE_ENV=production` (SR-PAY-05).
- Trạng thái: Open

### FB-R1-ARC-INT-11
- Mức độ: Major
- Vị trí: `integrations.md` mục 3.2 "Trạng thái giao dịch (đề xuất)"; README 3.2 `method?: 'qr'|'atm'|'intl_card'|'wallet'`, `refund(...) → { refundId, status: 'pending'|'succeeded'|'failed' }`
- Vấn đề: Lệch với BA SM-12 và ERD `payment`: (1) INT: `created → pending → succeeded|failed|expired; succeeded → refund_pending → refunded`. BA/ERD: `pending|succeeded|failed|expired|reversed`, **hoàn tiền là một giao dịch riêng** `type=refund` (số âm) cần yêu cầu duyệt SM-10 (BR-522) – không đổi trạng thái giao dịch gốc. (2) `method` của INT khác enum ERD (`vietqr|bank_transfer|cash|card_pos|vnpay|momo|ota_collect`). (3) Không nói `refundId` ánh xạ vào đâu.
- Vì sao quan trọng: hai mô hình trạng thái tiền song song = sai số dư folio, báo cáo thực thu lệch (BR-008: tiền không xóa, chỉ điều chỉnh). (Ghi chú: architecture mục 13 của ARC đã viết nhầm là "dùng nguyên trạng thái INT trong ERD" – ARC tự sửa ở bước 4.)
- Đề xuất sửa: INT dùng đúng SM-12/ERD: adapter trả `status` thuộc `pending|succeeded|failed|expired`; `refund()` được lõi gọi **sau khi** đã tạo dòng `payment(type=refund, status=pending)` đã duyệt, dùng `code` của dòng đó làm khóa idempotency, kết quả cập nhật chính dòng refund. `method` trong `createPayment` đổi thành `channel?: 'qr'|'atm'|'intl_card'|'wallet'` (phương thức con của cổng) và ghi rõ ánh xạ sang `payment.method` (= tên cổng). Sửa bảng mục 3.2.
- Trạng thái: Open

### FB-R1-ARC-INT-12
- Mức độ: Minor
- Vị trí: README mục 1.3 ("`<NHÓM>_PROVIDER` … vd. `PAYMENT_VNPAY_MODE=mock|sandbox|production`") và mục 4
- Vấn đề: (1) Quy ước tên không nhất quán: kênh, hóa đơn, khóa, email dùng `_PROVIDER`; thanh toán dùng `_MODE` theo từng cổng; không có biến nói cổng nào **đang bật**. (2) Không có giá trị "tắt". SEC SR-SECR-05(c) chặn khởi động production nếu adapter tiền là `mock`; nếu INV chọn ESC-INT-B phương án B (bỏ MoMo) thì `PAYMENT_MOMO_MODE` chỉ có thể là `mock` → hệ thống không khởi động được, hoặc người vận hành đặt bừa `production` không có khóa.
- Vì sao quan trọng: cấu hình sai ở production = mất thu tiền hoặc không deploy được.
- Đề xuất sửa: Thêm `PAYMENT_METHODS_ENABLED=vietqr,vnpay` (danh sách bật); mỗi cổng `…_MODE=off|mock|sandbox|production` (mặc định `off`); `mock` chỉ hợp lệ ngoài production. Áp cùng quy ước cho mọi nhóm (`…_PROVIDER=off|mock|<tên>`). Báo OPS cập nhật `.env.example`, báo SEC chỉnh câu chữ SR-SECR-05 (ARC đã ghi ở ARC-on-SEC).
- Trạng thái: Open

### FB-R1-ARC-INT-13
- Mức độ: Minor
- Vị trí: README đầu tệp ("Trạng thái: thiết kế giao diện (chưa có code) – code bắt đầu Round 2 sau khi ARC chốt ngôn ngữ/khung"), mục 2 (cấu trúc thư mục), mục 1.6 ("giả mã… ARC/BE chuyển sang ngôn ngữ được chọn")
- Vấn đề: Đã lỗi thời: ARC chốt TypeScript (ADR-002, ADR-011 – package `@ottimo/integrations`), OPS đã dựng khung có `notification/types.ts` chép từ README. ADR-011 quy định lõi chỉ phụ thuộc **interface** ở `@ottimo/integrations/contracts`, nhưng cấu trúc thư mục README không có `contracts/`, và khung OPS chỉ `exports` gốc `"."`.
- Vì sao quan trọng: nếu interface nằm lẫn với cài đặt, `services/api` sẽ import cả SDK nhà cung cấp vào lõi – trái nguyên tắc 1.1.
- Đề xuất sửa: Cập nhật trạng thái; thêm `contracts/` (chỉ kiểu + `IntegrationError` + `IntegrationContext` + `MockScenario`) và export phụ `"./contracts"` trong `package.json`; nhận tiếp quản khung OPS (review `notification/types.ts` khớp README sau khi sửa thẻ 01–02).
- Trạng thái: Open

### FB-R1-ARC-INT-14
- Mức độ: Minor
- Vị trí: README 3.6 `GuestRegistrationAdapter.prepare(stayId) → { kind, portalUrl, fields: { label, value }[] }`
- Vấn đề: (1) `fields[].value` là dữ liệu C3 (số giấy tờ, ngày sinh, thị thực) – README chưa nói adapter này chỉ được gọi trong request của nhân viên trên **thiết bị được cấp** và phải ghi `c3_access_log` trước khi trả (SR-DEV-03, SR-C3-07), không bao giờ qua outbox/worker/log. (2) `kind` chỉ có 2 giá trị, ERD `registration.kind` có thêm `mixed` (đoàn có cả khách VN và NN). (3) `submittedBy: string` – nên là `userId` lấy từ phiên, không do client gửi.
- Vì sao quan trọng: đây là đường C3 rời hệ thống (TB-11 threat model); dùng sai chỗ là lộ dữ liệu nhạy cảm nhất.
- Đề xuất sửa: Ghi ràng buộc trên vào mục 3.6; trả về theo **từng người** (`people: [{ personRef, kind, fields }]`) để xử lý hồ sơ `mixed`; bỏ `submittedBy` khỏi tham số (lõi tự ghi).
- Trạng thái: Open

### FB-R1-ARC-INT-15
- Mức độ: Minor
- Vị trí: README 3.3 `EInvoiceAdapter`
- Vấn đề: (1) Thiếu cờ giá đã gồm VAT hay chưa (BL 9 #16 còn mở) và quy tắc làm tròn tiền thuế theo dòng/tổng – MISA tính khác nhau theo cách gửi. (2) `cancelOrAdjust(providerId, reason)` gộp hai nghiệp vụ pháp lý khác nhau (hủy, thay thế, điều chỉnh tăng/giảm). (3) `issuedAt: Date` (xem thẻ 02).
- Vì sao quan trọng: sai cách tính VAT là sai tiền trên hóa đơn pháp lý; sửa hóa đơn đã phát hành phải đúng loại nghiệp vụ.
- Đề xuất sửa: Thêm `pricesIncludeVat: boolean`, `rounding: 'per_line'|'per_invoice'` lấy từ cấu hình; tách `cancel(ctx, providerId, reason)`, `replace(ctx, providerId, newReq)`, `adjust(ctx, providerId, delta)`; đánh dấu R3 và chờ ESC thuế suất.
- Trạng thái: Open

### FB-R1-ARC-INT-16
- Mức độ: Minor
- Vị trí: README 3.4 `DoorLockAdapter`; `smart-lock.md` mục 4.1 bước 1, mục 5
- Vấn đề: (1) `capabilities(lockRef)` đồng bộ – với TTLock/Tuya phải gọi API để biết model → nên async. (2) `createCode({ code? })` chưa ràng buộc độ dài; SEC SR-LOCK-01 chốt 6–10 chữ số, mặc định 6 số từ CSPRNG; biến thể sinh nhật theo SR-LOCK-02 (`ddmm` + 3 số, hoặc + 2 số nếu khóa có khóa bàn phím sau ≤ 5 lần sai) – smart-lock.md mục 5 vẫn ghi `ddmm` + 2 số. (3) smart-lock 4.1 tạo mã "khi đơn chuyển confirmed", còn BA SM-01 B9 ghi "mã cửa hiệu lực khi nhận phòng" – cần thống nhất thời điểm **tạo** (có thể sớm) với thời điểm **hiệu lực** (`validFrom`) và thời điểm **hiển thị cho khách** (SR-GST-10).
- Vì sao quan trọng: mã cửa là C3 liên quan an toàn thân thể khách (AS-03).
- Đề xuất sửa: Sửa 3 điểm trên; ghi rõ: tạo mã có thể lúc `confirmed` với `validFrom` = giờ nhận phòng chuẩn ngày đến, khách chỉ thấy mã ở app mức 2 trong khoảng hiệu lực.
- Trạng thái: Open

### FB-R1-ARC-INT-17
- Mức độ: Minor
- Vị trí: `integrations.md` I8 (Email – R2, "Ứng viên: SES, Resend, Brevo… chọn cùng ARC/OPS")
- Vấn đề: Email nay là **phụ thuộc bắt buộc của R2**: SEC chốt xác minh mức 2 app khách bằng OTP email (SR-GST-07), cảnh báo bảo mật gửi OWN qua email (SR-LOG-06). Chưa chọn nhà cung cấp, chưa đánh giá nơi đặt máy chủ (ESC-002 – dữ liệu C2 ra nước ngoài), chưa nêu DNS SPF/DKIM/DMARC cần INV làm.
- Vì sao quan trọng: thiếu email thì luồng mức 2 (bill, mã cửa trên app) không chạy được ở R2.
- Đề xuất sửa: Bổ sung bảng so sánh ngắn 2–3 nhà cung cấp (giá ở < 1.000 email/tháng, vị trí máy chủ, API/SMTP, có webhook trả lỗi gửi), đề xuất 1, ghi vào ESC-INT-B mục tên miền; phối hợp OPS (hosting-plan) để DNS sẵn trước staging R2.
- Trạng thái: Open

### FB-R1-ARC-INT-18
- Mức độ: Suggestion
- Vị trí: `integrations.md` mục 5 ESC-INT-A; `channel-manager-comparison.md` mục 4–5
- Vấn đề: ESC-INT-A nêu phí Beds24 0,9–2,3 tr/tháng nhưng chưa ghi rõ khoản này **nằm ngoài** ngân sách hạ tầng ≤ 1 tr/tháng (architecture mục 14 điểm 4); phương án B (ezCloud) chưa ghi ARC đánh giá "không đạt nguyên tắc một nguồn tồn phòng nếu không có API 2 chiều" (architecture mục 14 điểm 3).
- Vì sao quan trọng: INV đọc ESC để quyết tiền; cần thấy tổng chi phí thực và rủi ro kỹ thuật của từng phương án.
- Đề xuất sửa: Thêm 1 dòng "Phí CM là chi phí riêng, không thuộc ngân sách hạ tầng ≤ 1 tr/tháng" và ở phương án B ghi "ARC: chỉ chấp nhận khi có văn bản xác nhận API 2 chiều; nếu phải dùng PMS ezCloud song song → nguy cơ đặt trùng".
- Trạng thái: Open

---

## Điểm làm tốt nên giữ
1. Nguyên tắc tích hợp chuẩn ngay từ đầu: tiền chỉ ghi từ kênh server-to-server có chữ ký + khớp số tiền, `paymentId` sinh trước khi gọi cổng (xử lý được callback đến trước response), outbox/inbox, Mock cho mọi tích hợp – ARC giữ nguyên làm nền ADR-011.
2. Tra cứu có kỷ luật: mỗi con số gắn [Nguồn]/[Bên thứ ba]/[Chưa xác minh] kèm link; so sánh channel manager dựa trên yêu cầu bắt buộc Y1–Y5 thay vì cảm tính; chủ động loại iCal và loại tự động điền cổng BCA với lý do rõ.
3. Nhìn thấy rủi ro an toàn trong yêu cầu kinh doanh (mã cửa theo ngày sinh) và đưa ra phương án giữ trải nghiệm mà giảm rủi ro, đẩy quyết định chính sách lên INV qua ESC.
