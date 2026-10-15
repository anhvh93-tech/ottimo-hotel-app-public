# product/integrations – Adapter tích hợp bên thứ ba

- Chủ sở hữu: INT | Tạo: Round 1 (15/10/2026) | Trạng thái: **thiết kế giao diện (chưa có code)** – code bắt đầu Round 2 sau khi ARC chốt ngôn ngữ/khung
- Danh sách tích hợp, chi phí, việc INV cần cung cấp: `product/docs/integrations.md`

## 1. Nguyên tắc
1. Lõi nghiệp vụ (`services/api`) **chỉ gọi interface** dưới đây, không gọi SDK/HTTP của đối tác trực tiếp.
2. Mỗi interface có ít nhất 2 cài đặt: `Mock` (không mạng, dữ liệu xác định – dùng cho dev, QA, CI) và cài đặt thật (`Beds24`, `VnPay`…).
3. Chọn cài đặt bằng biến môi trường `<NHÓM>_PROVIDER` (vd. `PAYMENT_VNPAY_MODE=mock|sandbox|production`). Không có `if (env === 'prod')` rải trong code.
4. Lệnh gọi ra đi qua **outbox** (ghi cùng giao dịch DB) + worker có retry giới hạn (gợi ý: 5 lần, lùi theo cấp số nhân, rồi chuyển "Cần chú ý"). Callback vào đi qua **inbox** có khóa idempotency.
5. Mọi lệnh gọi ghi `integration_log` (đối tác, hướng, mã tham chiếu, trạng thái, thời gian, độ trễ) – **không** ghi khóa, chữ ký, số thẻ, số giấy tờ, mã cửa ở dạng rõ.
6. Tên kiểu/hàm bằng tiếng Anh; ký hiệu dưới đây là **giả mã kiểu TypeScript**, ARC/BE chuyển sang ngôn ngữ được chọn.

## 2. Cấu trúc thư mục dự kiến
```
product/integrations/
├── README.md                 # file này
├── common/                   # outbox/inbox, retry, signature helpers, integration_log
├── channel/                  # ChannelAdapter: mock/, beds24/
├── payment/                  # PaymentAdapter: mock/, vietqr/, vnpay/, momo/, bankfeed/ (SePay|payOS)
├── einvoice/                 # EInvoiceAdapter: mock/, misa/
├── doorlock/                 # DoorLockAdapter: manual/, mock/, ttlock/ (khi đã biết hãng)
├── notification/             # NotificationAdapter: mock/, manual_copy/, email/, zalo/
└── guest-registration/       # GuestRegistrationAdapter: semi_auto/ (không có API BCA)
```

## 3. Interface (bản nháp – chờ ARC review)

### 3.1 ChannelAdapter
```ts
interface ChannelAdapter {
  // Đẩy phòng trống/giá/hạn chế cho 1 khoảng ngày, theo mã ánh xạ (channel_mapping)
  pushAvailability(items: AvailabilityItem[]): Promise<PushResult>;   // {roomRef, date, available: 0|1|n, closed?: boolean}
  pushRates(items: RateItem[]): Promise<PushResult>;                  // {roomRef, date, amountVnd, minStay?}
  // Nhận đơn: webhook → parse; hoặc kéo định kỳ để đối soát
  parseWebhook(headers: Record<string,string>, rawBody: string): ChannelBookingEvent; // ném lỗi nếu xác thực sai
  fetchBookingsModifiedSince(since: Date): Promise<ChannelBookingEvent[]>;
  getInventorySnapshot(from: Date, to: Date): Promise<AvailabilityItem[]>; // đối soát hằng đêm
}
type ChannelBookingEvent = {
  externalId: string; channel: 'airbnb'|'booking'|'agoda'|'expedia'|'tripcom'|'traveloka'|'other';
  type: 'new'|'modified'|'cancelled'; roomRef: string; checkIn: string; checkOut: string; // ngày theo Asia/Ho_Chi_Minh
  guest: { name: string; phone?: string; email?: string; country?: string };
  amountVnd?: number; channelFeeVnd?: number; raw: unknown;  // channelFee cho DATA tính thực thu (BL 5.11)
};
```
Idempotency: `(channel, externalId, type, modifiedAt)`. Đơn về mà căn đã bị chiếm → lõi tạo đơn trạng thái xung đột + cảnh báo (quy tắc ưu tiên do DOM định nghĩa).

### 3.2 PaymentAdapter
```ts
interface PaymentAdapter {
  createPayment(req: { paymentId: string; amountVnd: number; description: string; // description ≤ 50 ký tự, không dấu
                       returnUrl?: string; expiresAt: Date; method?: 'qr'|'atm'|'intl_card'|'wallet' }): Promise<{ redirectUrl?: string; qrPayload?: string }>;
  verifyCallback(headers: Record<string,string>, query: Record<string,string>, rawBody: string):
    { valid: boolean; paymentId: string; providerTxnId: string; amountVnd: number; status: 'succeeded'|'failed' };
  callbackAck(result: 'ok'|'already_confirmed'|'not_found'|'invalid_amount'|'invalid_signature'|'error'): HttpResponse; // vd. VNPay RspCode 00/02/01/04/97/99
  queryStatus(paymentId: string): Promise<'pending'|'succeeded'|'failed'|'expired'>;
  refund(req: { paymentId: string; amountVnd: number; reason: string }): Promise<{ refundId: string; status: 'pending'|'succeeded'|'failed' }>;
}
```
Quy tắc: chỉ `verifyCallback` hợp lệ **và** số tiền khớp mới chuyển `succeeded`; trang ReturnUrl chỉ hiển thị. Callback đến trước response tạo thanh toán → vẫn xử lý được nhờ `paymentId` sinh trước khi gọi cổng. Không lưu số thẻ.
Cài đặt: `vietqr` (chỉ `createPayment` → `qrPayload`, tự sinh chuỗi theo chuẩn VietQR; xác nhận qua `bankfeed` hoặc lễ tân bấm tay), `vnpay`, `momo`, `bankfeed`.

### 3.3 EInvoiceAdapter
```ts
interface EInvoiceAdapter {
  issue(req: { invoiceRef: string; buyer: { name?: string; taxCode?: string; address?: string; email?: string } | 'retail';
               lines: { name: string; qty: number; unitPriceVnd: number; vatRate: number | 'exempt' }[];
               paymentMethod: string; issuedAt: Date }): Promise<{ providerId: string; number?: string; lookupCode?: string; status: 'issued'|'pending'|'failed' }>;
  getStatus(providerId: string): Promise<'issued'|'pending'|'failed'|'cancelled'>;
  downloadPdf(providerId: string): Promise<Uint8Array>;
  cancelOrAdjust(providerId: string, reason: string): Promise<void>;
}
```
`vatRate` lấy từ cấu hình (chờ ESC thuế suất – BL 9 #16). `invoiceRef` là khóa idempotency.

### 3.4 DoorLockAdapter
```ts
interface DoorLockAdapter {
  capabilities(lockRef: string): { remote: boolean; customCode: boolean; card: boolean; fingerprint: boolean; logs: boolean };
  createCode(req: { lockRef: string; code?: string; validFrom: Date; validTo: Date; label: string }): Promise<{ credentialId: string; code: string; installed: boolean }>;
  updateValidity(credentialId: string, validFrom: Date, validTo: Date): Promise<void>;
  revoke(credentialId: string): Promise<void>;
  addCard?(req: { lockRef: string; cardNumber: string; validFrom: Date; validTo: Date }): Promise<{ credentialId: string }>;
  accessLog?(lockRef: string, since: Date): Promise<{ at: Date; method: string; credentialId?: string }[]>;
}
```
`manual` adapter: `installed=false` → lõi tạo việc "Cài mã trên app khóa" cho lễ tân; `revoke` → tạo việc "Xóa mã". Sinh mã (ngẫu nhiên / ngày sinh + 2 số) nằm ở lõi, không trùng mã đang hiệu lực trên cùng khóa – xem `product/docs/integrations/smart-lock.md` mục 5.

### 3.5 NotificationAdapter
```ts
interface NotificationAdapter {
  send(msg: { channel: 'email'|'zalo_zns'|'zalo_oa'|'manual_copy'; to: string; templateId: string;
              locale: 'vi'|'en'|'ru'; params: Record<string,string>; attachments?: { name: string; mime: string; data: Uint8Array }[];
              idempotencyKey: string }): Promise<{ providerMsgId?: string; status: 'sent'|'queued'|'failed'|'copied' }>;
}
```
`manual_copy` trả nội dung đã điền để lễ tân sao chép (R2). ZNS dùng mã mẫu đã được Zalo duyệt.

### 3.6 GuestRegistrationAdapter (khai báo lưu trú)
```ts
interface GuestRegistrationAdapter {
  prepare(stayId: string): Promise<{ kind: 'foreigner_temp_residence'|'vn_citizen_stay'; portalUrl: string; fields: { label: string; value: string }[] }>;
  recordSubmission(stayId: string, portalReference: string, submittedBy: string): Promise<void>;
}
```
Chỉ có cài đặt `semi_auto` – **không** tự điền/scrape cổng BCA.

## 4. Biến môi trường (chỉ tên – OPS đưa vào `product/.env.example` với giá trị trống)
```
# Channel manager
CHANNEL_PROVIDER=mock            # mock | beds24
CHANNEL_BEDS24_API_BASE=
CHANNEL_BEDS24_REFRESH_TOKEN=
CHANNEL_WEBHOOK_SECRET=
# Payment
PAYMENT_VIETQR_BANK_BIN=
PAYMENT_VIETQR_ACCOUNT_NO=
PAYMENT_VIETQR_ACCOUNT_NAME=
PAYMENT_VNPAY_MODE=mock          # mock | sandbox | production
PAYMENT_VNPAY_TMN_CODE=
PAYMENT_VNPAY_HASH_SECRET=
PAYMENT_VNPAY_PAY_URL=
PAYMENT_VNPAY_API_URL=
PAYMENT_MOMO_MODE=mock
PAYMENT_MOMO_PARTNER_CODE=
PAYMENT_MOMO_ACCESS_KEY=
PAYMENT_MOMO_SECRET_KEY=
PAYMENT_MOMO_ENDPOINT=
BANKFEED_PROVIDER=none           # none | sepay | payos
BANKFEED_WEBHOOK_SECRET=
# E-invoice
EINVOICE_PROVIDER=mock           # mock | misa
EINVOICE_MISA_BASE_URL=
EINVOICE_MISA_APP_ID=
EINVOICE_MISA_TAX_CODE=
EINVOICE_MISA_USERNAME=
EINVOICE_MISA_PASSWORD=
# Door lock
DOORLOCK_PROVIDER=manual         # manual | mock | ttlock
DOORLOCK_TTLOCK_CLIENT_ID=
DOORLOCK_TTLOCK_CLIENT_SECRET=
# Notification
EMAIL_PROVIDER=mock              # mock | smtp | ses | resend ...
EMAIL_FROM=
EMAIL_SMTP_URL=
ZALO_PROVIDER=manual_copy        # manual_copy | zns
ZALO_APP_ID=
ZALO_APP_SECRET=
ZALO_OA_ID=
```
Tên biến MISA/ZNS là dự kiến – chỉnh khi đọc tài liệu chi tiết ở Round 2/3.

## 5. Checklist chất lượng cho mỗi adapter (áp dụng từ Round 2)
- [ ] Xác thực chữ ký callback/webhook (VNPay HMAC-SHA512, MoMo HMAC-SHA256, SePay HMAC-SHA256…)
- [ ] Callback trùng / đến trễ / đến trước response – có test
- [ ] Timeout + retry giới hạn + `integration_log` đối soát
- [ ] Đổi mock ↔ sandbox ↔ production chỉ bằng cấu hình
- [ ] Mock chạy được trong CI, không cần mạng ngoài
- [ ] Không log dữ liệu nhạy cảm (SEC)
