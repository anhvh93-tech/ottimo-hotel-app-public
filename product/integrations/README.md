# product/integrations – Adapter tích hợp bên thứ ba

- Chủ sở hữu: INT | Tạo: Round 1 Bước 2 (15/10/2026) | Sửa: **Round 1 Bước 4 (15/10/2026) – Interface v0.2** theo review ARC (FB-R1-ARC-INT-01…18), SEC (FB-R1-SEC-INT-01…12), DOM (FB-R1-DOM-INT-01…08)
- Ngôn ngữ/khung: **TypeScript**, package `@ottimo/integrations` (ADR-002, ADR-011). Lõi (`services/api`) **chỉ** import `@ottimo/integrations/contracts` (kiểu + lỗi + ngữ cảnh); cài đặt adapter (có SDK/HTTP của đối tác) chỉ được nạp qua `IntegrationRegistry` trong tầng hạ tầng.
- Trạng thái mã (R2 tuần 1, W9 – 16/10/2026): `contracts/` có **đủ** interface 3.0–3.6 (`common`, `channel`, `payment`, `bankfeed`, `einvoice`, `doorlock`, `notification`, `guest-registration`) – chép nguyên chữ ký v0.2, chỉ đặt tên cho các kiểu tham số/kết quả (vd. `CreatePaymentRequest`, `EInvoiceIssueRequest`). `common/` (export `@ottimo/integrations/common`) có `scrubCardData`, `EnvCredentialProvider`, `assertSafeConfig`/`findUnsafeIntegrationConfig` – `services/api/src/config.ts` gọi hàm này lúc khởi động. Adapter đã cài: Mock Notification. Đổi chữ ký interface phải qua ARC.
- Danh sách tích hợp, chi phí, việc INV cần cung cấp: `product/docs/integrations.md`

## 1. Nguyên tắc

### 1.1 Lõi chỉ gọi interface
Lõi nghiệp vụ không gọi SDK/HTTP của đối tác. Đổi nhà cung cấp = viết adapter mới, không sửa lõi.

### 1.2 Mỗi interface có Mock cấu hình được kịch bản lỗi (ARC-10)
- Mỗi interface có ít nhất `Mock` (không mạng, dữ liệu xác định) và cài đặt thật.
- Mock nhận `MockScenario` (mục 3.0) – qua biến `<NHÓM>_MOCK_SCENARIO` (chỉ `APP_ENV=dev|test|staging`) hoặc qua `setScenario()` trong test:
  `ok | timeout | rate_limited | unavailable | auth_error | invalid_signature | duplicate_callback | late_callback | callback_before_response | amount_mismatch | merchant_mismatch | conflict_booking | out_of_order | card_data_in_payload`.
- Mock thanh toán có `emitCallback(paymentCode, variant)` để test gọi IPN vào API thật (không mạng ngoài). Mock kênh có `emitSignal(externalId, hint)` + kho đơn giả để `fetchBooking` trả về.

### 1.3 Cấu hình và chặn cấu hình nguy hiểm ở production (ARC-12, SEC-04)
- Quy ước chung: `<NHÓM>_PROVIDER=off|mock|<tên>`; mặc định `off`. Thanh toán theo từng cổng: `PAYMENT_<CỔNG>_MODE=off|mock|sandbox|production` + `PAYMENT_METHODS_ENABLED=<danh sách>` (vd. `vietqr,vnpay`). Cổng/nhóm `off` → Registry trả `null`, giao diện không hiện phương thức đó và **route webhook của nhà cung cấp đó không được đăng ký** (gọi vào → 404) – SR-SECR-05(c).
- Khi `APP_ENV=production`, ứng dụng **từ chối khởi động** nếu: (a) bất kỳ adapter tiền (`PAYMENT_*`, `BANKFEED_*`), kênh (`CHANNEL_*`), khóa (`DOORLOCK_*`) ở `mock` hoặc `sandbox`; (b) một phương thức trong `PAYMENT_METHODS_ENABLED` có `MODE` khác `production`. `off` luôn hợp lệ (vd. INV bỏ MoMo → `PAYMENT_MOMO_MODE=off`).
- Route webhook `mock` **không đăng ký** khi `APP_ENV=production`.
- Không có `if (APP_ENV === 'production')` rải trong code: kiểm tra tập trung một chỗ ở `common/safe-config.ts` (`assertSafeConfig(env, appEnv)` / `findUnsafeIntegrationConfig`), được `services/api/src/config.ts` gọi khi api và worker khởi động. Thêm: (c) `*_MOCK_SCENARIO` có giá trị → từ chối ở production; (d) mọi môi trường: biến chọn nhà cung cấp ở mục 4 phải có giá trị hợp lệ (vd. `PAYMENT_VIETQR_MODE=sandbox` bị từ chối vì VietQR không có sandbox), `PAYMENT_<X>_MODE` và `PAYMENT_METHODS_ENABLED` chỉ nhận `vietqr|vnpay|momo`. Ở dev/test/staging, phương thức bật mà `MODE=off` chỉ bị ẩn, không lỗi. (e) `mock`/`sandbox` so khớp không phân biệt hoa thường (cả biến chọn chưa có trong danh sách, vd. `BLOBSTORE_PROVIDER=MOCK`); (f) ngoài production, `PAYMENT_VNPAY_MODE`/`PAYMENT_MOMO_MODE=production` bị từ chối (môi trường thử không được thu tiền thật); VietQR giữ nguyên (P-R2-6) – FB-R2-SEC-INT-05.

### 1.4 Ngữ cảnh cơ sở và khóa (ARC-01, ARC-08)
- Mọi phương thức nhận tham số đầu `ctx: IntegrationContext = { propertyId, credentialsRef, requestId }`.
- `IntegrationRegistry.get(kind, propertyId)` trả instance theo cơ sở (cache theo `propertyId` + phiên bản khóa).
- Adapter **không đọc `process.env`**; nhận khóa qua `CredentialProvider.get(credentialsRef)`. MVP: `EnvCredentialProvider` (`common/env-credential-provider.ts`) đọc biến mục 4: `credentialsRef = env:<NHÓM>_<NHÀ_CUNG_CẤP>` (vd. `env:PAYMENT_VNPAY` → `{ MODE, TMN_CODE, HASH_SECRET, … }`; nhóm trơn `env:PAYMENT` bị từ chối `CONFIG` – quyền tối thiểu, FB-R2-SEC-INT-04), nhóm phải thuộc `CHANNEL|PAYMENT|BANKFEED|EINVOICE|DOORLOCK|EMAIL|ZALO` (không lấy được `SESSION_SECRET`, `DATA_KEK_*`…); hỗ trợ `<TÊN>_FILE` (Docker secrets, quy ước OPS) – có cả hai mà khác giá trị → lỗi `CONFIG`; thông báo lỗi chỉ nêu tên biến; khi > 1 cơ sở: `DbCredentialProvider` (bảng `integration_credential` mã hóa – ARC thêm vào ERD khi cần). Interface adapter không đổi.

### 1.5 Ngày và thời điểm (ARC-02)
- **Ngày lịch** (`date`, `from`, `to`, `checkIn`, `checkOut`, `issueDate`) = `LocalDate` – chuỗi `YYYY-MM-DD` theo `property.timezone`. Khoảng ngày luôn **nửa mở** `[from, to)` (BR-002).
- **Thời điểm** (`expiresAt`, `validFrom`, `validTo`, `modifiedAt`, `since`, `checkedAt`) = `IsoInstant` – ISO 8601 **có offset** (`2026-10-20T14:00:00+07:00`). Interface không dùng `Date`.

### 1.6 Lỗi chuẩn và retry (ARC-06)
Mọi adapter chỉ ném `IntegrationError` (mục 3.0). Worker (`outbox.dispatch`, J18):

| `code` | `retryable` | Worker làm gì |
|---|---|---|
| `TIMEOUT`, `UNAVAILABLE` | có | Retry lùi cấp số nhân, tối đa 5 lần, rồi "Cần chú ý" |
| `RATE_LIMITED` | có | Chờ `retryAfterMs` (Beds24: header `x-five-min-limit-resets-in`), không tính vào 5 lần |
| `AUTH`, `CONFIG` | không | "Cần chú ý" ngay + `healthCheck` → `down`; báo OWN/MGR |
| `INVALID_REQUEST`, `NOT_FOUND`, `CONFLICT` | không | "Cần chú ý" ngay, kèm mã tham chiếu |
| `UNKNOWN` | có (1 lần) | Retry 1 lần rồi "Cần chú ý" |

`providerMessage` đã lọc PII/khóa trước khi gán.

### 1.7 Outbox / inbox – chỉ tham chiếu, không dữ liệu nhạy cảm (SEC-09)
- Lệnh gọi ra đi qua **outbox** (ghi cùng giao dịch DB) + worker. Outbox chỉ chứa **tham chiếu** (`kind`, `propertyId`, `reservationId`/`paymentId`/`lockCredentialId`, `templateId`, `recipientRef`) – **không** chứa mã cửa, mã xác minh, email/SĐT, số giấy tờ. Worker dựng nội dung ngay lúc gửi, đọc C3 qua `CryptoService` và ghi `c3_access_log` với `actor_type=system`.
- Tín hiệu vào đi qua **inbox** với khóa duy nhất `(provider, external_event_id)`; nội dung lưu là **bản đã lọc** (1.8), không bao giờ là body thô.

### 1.8 Lọc theo danh sách trường cho phép – không giữ payload thô (SEC-01 Blocker, ARC-04)
- Interface **không có trường `raw`**. Mọi DTO đi vào lõi được adapter dựng bằng **ánh xạ tường minh từng trường** (allowlist) – trường không có trong danh sách bị bỏ, kể cả khi đối tác thêm trường mới.
- **Sau** khi xác thực chữ ký trên body thô và **trước** khi ánh xạ, adapter chạy `scrubCardData()` (`common/scrub-card-data.ts`) trên payload: (a) loại khóa có **token** (tách theo `_ - .` và camelCase) là `card*`, `cc`, `cvv`, `cvc`, `vcc`, `pan`, `expiry`, `expiration`, `exp`+`month|year|date`, `track1|2`… – bản v0.2 dùng regex `/(^|_)(card|cc|cvv|cvc|vcc|pan|expir|cardholder)/i`, đổi sang token để bắt `creditCard`, `ccNumber` và không xóa nhầm `expiresAt`, `vnp_ExpireDate`, `ccy`, `panel` (decision-log INT 16/10/2026); `allowKeys` miễn **chỉ** luật tên cho trường đã biết không phải thẻ (vd. `vnp_CardType`); (b) **luật giá trị 2 tầng** (quyết định SEC 16/10/2026, FB-R2-SEC-INT-01/02/03): **Tầng A** – văn bản tự do và mọi khóa adapter **không khai kiểu** (hoặc khai `text`), mọi giá trị có ký tự khác chữ số: quét **mọi cửa sổ 13–19 chữ số liên tiếp** (bỏ khoảng trắng/gạch trong một dãy số) theo Luhn chặt, không IIN – bắt cả "số thẻ + CVV/hạn" viết liền; **Tầng B** – khóa adapter khai trong `fieldKinds` (`numericId`, `timestamp14`, `epochMs`) có giá trị chỉ gồm chữ số: chỉ xóa khi **Luhn + IIN + độ dài khớp thương hiệu** (`CARD_IIN_TABLE`, đổi bảng = SEC duyệt, chỉ được mở rộng); `timestamp14`/`epochMs` là ngày giờ hợp lệ trong ±2 năm → giữ. Không có miễn trừ tuyệt đối (`allowKeys` chỉ miễn luật tên; số thẻ thật trong trường mã vẫn bị xóa). Số nguyên vượt `Number.MAX_SAFE_INTEGER` (đã bị `JSON.parse` làm tròn) → xóa; adapter nhận mã ≥ 16 số dạng number nên dùng bộ đọc JSON giữ chuỗi/bigint. Hàm trả bản sao đã lọc + **số lượng** (`dropped`, `droppedByRule{name,value_text,value_id}`) + `attention[]` = các khóa trong `requiredKeys` bị xóa (chỉ tên khóa, lý do `card_suspect`, không giá trị). Adapter: `attention` không rỗng → **không** xử lý tự động, trả `malformed`/ghi inbox và tạo mục "Cần chú ý" `card_suspect`; tăng `integration_card_data_dropped_total{provider,rule}`, cảnh báo SEC/OWN, **không log** giá trị, không log tên trường kèm giá trị. Mỗi adapter thật phải khai `fieldKinds` cho mọi trường mã/số/ngày giờ dài của đối tác (vd. VNPay `vnp_PayDate: 'timestamp14'`, `vnp_TransactionNo: 'numericId'`; MoMo `transId: 'numericId'`, `responseTime: 'epochMs'`), nếu không sẽ bị Tầng A xóa nhầm ~10%.
- `rawFiltered` (tùy chọn) chỉ chứa các trường trong allowlist phục vụ đối soát; lưu trong `inbox_message`, **xóa sau 90 ngày** (job dọn).
- Body thô chỉ tồn tại trong bộ nhớ của request; không ghi file, DB, log, APM, thông báo lỗi.
- Bắt buộc: test với payload mẫu có trường thẻ (Mock scenario `card_data_in_payload`) → không xuất hiện trong DB/log/outbox (checklist mục 5).

### 1.9 Đường dẫn webhook (ADR-011, SEC-04)
- `GET|POST /v1/webhooks/{provider}/{propertySlug}`; `provider ∈ vnpay | momo | sepay | payos | beds24` (+ `mock` ngoài production). `propertySlug` → `propertyId` → `credentialsRef` → bí mật đúng của cơ sở. Slug không tồn tại → 404 không chi tiết.
- VNPay IPN là **GET** có tham số trên query → API và Caddy **che query string** của `/v1/webhooks/*` trong access log (chỉ giữ path + mã trạng thái + thời gian).
- Endpoint kênh chỉ: đọc tín hiệu → ghi `inbox_message` → trả 2xx nhanh; worker J19 kéo lại đơn. Riêng IPN thanh toán xử lý đồng bộ trong request (cổng cần mã phản hồi) nhưng vẫn idempotent.
- **Yêu cầu ARC**: `openapi.yaml` hiện là `/v1/webhooks/payments/{provider}` và `/v1/webhooks/channel/{provider}` (chỉ POST) → đổi theo dòng đầu mục này, thêm GET cho VNPay (xem `rounds/round-01/responses/INT-responses.md` mục yêu cầu ARC).

### 1.10 Nhật ký và sức khỏe kết nối (ARC-07)
- Mọi lệnh gọi ghi `integration_log` (đối tác, hướng, mã tham chiếu, trạng thái, độ trễ, `requestId`, chi phí credit nếu có) – **không** ghi khóa, chữ ký, số thẻ, số giấy tờ, mã cửa, mã xác minh, nội dung tin nhắn.
- Mỗi adapter có `healthCheck(ctx)` – gọi rẻ (vd. lấy thông tin tài khoản), worker chạy mỗi 15 phút, ghi `integration_log`; `down` → "Cần chú ý" (BR-907 "đồng bộ kênh lỗi").

## 2. Cấu trúc thư mục
```
product/integrations/
├── README.md
├── index.ts                  # export gốc "." (contracts + Mock dùng cho test/dev)
├── contracts/                # export "./contracts" – CHỈ kiểu, IntegrationError, IntegrationContext, MockScenario
│   ├── common.ts, index.ts
│   └── channel.ts, payment.ts, bankfeed.ts, einvoice.ts, doorlock.ts, notification.ts, guest-registration.ts
├── common/                   # export "./common": scrubCardData, EnvCredentialProvider, assertSafeConfig (có mã); R2: registry, signature helpers
├── channel/                  # ChannelAdapter: mock/, beds24/
├── payment/                  # PaymentAdapter: mock/, vietqr/, vnpay/, momo/
├── bankfeed/                 # BankFeedAdapter: mock/, sepay/ | payos/
├── einvoice/                 # EInvoiceAdapter: mock/, misa/
├── doorlock/                 # DoorLockAdapter: manual/, mock/, ttlock/ (khi đã biết hãng)
├── notification/             # NotificationAdapter: mock (có), manual_copy/, email/, zalo/, ota_message/
└── guest-registration/       # GuestRegistrationAdapter: semi_auto/ (không có API BCA)
```

## 3. Interface v0.2

### 3.0 Kiểu chung (`contracts/common.ts` – đã có mã)
```ts
type LocalDate = string & { readonly __brand: 'LocalDate' };   // 'YYYY-MM-DD'
type IsoInstant = string & { readonly __brand: 'IsoInstant' }; // ISO 8601 có offset
interface IntegrationContext { propertyId: string; credentialsRef: string; requestId: string }
type IntegrationErrorCode = 'TIMEOUT'|'RATE_LIMITED'|'UNAVAILABLE'|'AUTH'|'CONFIG'|'INVALID_REQUEST'|'NOT_FOUND'|'CONFLICT'|'UNKNOWN';
class IntegrationError extends Error { code; retryable; retryAfterMs?; providerMessage? }
interface HealthStatus { status: 'ok'|'degraded'|'down'; checkedAt: IsoInstant; detail?: string }
interface InboundHttp { method: 'GET'|'POST'; headers: Record<string,string>; query: Record<string,string>; rawBody: string; sourceIp: string }
interface CredentialProvider { get(credentialsRef: string): Promise<Readonly<Record<string,string>>> }
type MockScenario = 'ok'|'timeout'|'rate_limited'|'unavailable'|'auth_error'|'invalid_signature'|'duplicate_callback'
  |'late_callback'|'callback_before_response'|'amount_mismatch'|'merchant_mismatch'|'conflict_booking'|'out_of_order'|'card_data_in_payload';
```

### 3.1 ChannelAdapter (R2 Mock, R3 Beds24)
```ts
interface ChannelAdapter {
  // Đẩy theo KHOẢNG ngày [from, to); adapter tự chia lô theo giới hạn API (ARC-09)
  pushAvailability(ctx, ranges: { roomRef: string; from: LocalDate; to: LocalDate; available: number; closed?: boolean }[]): Promise<PushResult>;
  pushRates(ctx, ranges: { roomRef: string; ratePlanRef: string; from: LocalDate; to: LocalDate; amountVnd: number }[]): Promise<PushResult>;
  // Hạn chế bán (DOM-08): ở tối thiểu theo ngày đến, đóng nhận khách đến (CTA), đóng trả phòng (CTD), dừng bán
  pushRestrictions(ctx, ranges: { roomRef: string; ratePlanRef?: string; channel?: ChannelCode; from: LocalDate; to: LocalDate;
                                  minStayArrival?: number; closedToArrival?: boolean; closedToDeparture?: boolean; stopSell?: boolean }[]): Promise<PushResult>;
  // Webhook = TÍN HIỆU, không tin nội dung (ARC-04, SEC-02). Chỉ dùng để ghi inbox_message.
  parseWebhookSignal(ctx, req: InboundHttp): Promise<{ eventId: string; externalId: string; hint?: 'new'|'modified'|'cancelled' }>;
  // Worker J19 LUÔN kéo lại đơn qua API rồi mới ghi
  fetchBooking(ctx, externalId: string): Promise<ChannelBooking[] | null>;   // mảng: 1 phần tử / phòng (đơn nhiều phòng)
  fetchBookingsModifiedSince(ctx, since: IsoInstant): Promise<ChannelBooking[]>;
  getInventorySnapshot(ctx, from: LocalDate, to: LocalDate): Promise<{ roomRef: string; from: LocalDate; to: LocalDate; available: number; closed: boolean }[]>;
  reportNoShow?(ctx, externalId: string): Promise<void>;               // vắng → lõi tạo việc thủ công (DOM-05b)
  sendGuestMessage?(ctx, externalId: string, text: string): Promise<{ providerMsgId: string }>; // hộp thư OTA (DOM-06)
  healthCheck(ctx): Promise<HealthStatus>;
}
type ChannelCode = 'airbnb'|'booking'|'agoda'|'expedia'|'tripcom'|'traveloka'|'other';
interface PushResult { accepted: number; requests: number; creditsUsed?: number; warnings?: string[] }
interface ChannelBooking {
  externalId: string;            // mã đơn CM cho phòng này
  groupRef?: string;             // mã đơn gốc khi 1 đơn OTA có nhiều phòng → lõi tạo nhiều reservation liên kết
  channel: ChannelCode; otaRef?: string;           // mã đặt phòng trên OTA (hiển thị cho lễ tân)
  status: 'new'|'modified'|'cancelled';
  modifiedAt: IsoInstant;        // dùng cho idempotency và chống đến sai thứ tự
  externalRoomRef: string; ratePlanRef?: string;   // ánh xạ qua channel_mapping (erd 4.12)
  checkIn: LocalDate; checkOut: LocalDate; adults: number; children: number;
  guest: { name: string; phone?: string; email?: string; emailIsRelay?: boolean; country?: string; locale?: string };
  currency: string;              // ISO 4217
  amountOriginal: number;        // số nguyên, đơn vị nhỏ nhất của currency
  amountVnd?: number;            // chỉ khi CM đã quy đổi
  channelFee?: { amount: number; currency: string; isEstimate: boolean };
  collectModel: 'ota_collect'|'hotel_collect'|'unknown'; // DOM-05c – OTA thu hộ hay khách trả tại chỗ
  rawFiltered?: Readonly<Record<string, string|number|boolean|null>>; // chỉ trường trong allowlist (1.8)
}
```
- **Không có trường thẻ** trong `ChannelBooking`. Beds24: không bật quyền xem thẻ cho tài khoản/token của OTTIMO (tài liệu Beds24 nói quyền thẻ phải liên hệ hỗ trợ mới bật [Nguồn: wiki.beds24.com API_V2.0]); token chỉ scope cần thiết.
- **Idempotency**: inbox `(provider, eventId)`; xử lý đơn `(channel, externalId, modifiedAt)`. `modifiedAt` ≤ bản đã lưu → bỏ qua (đến sai thứ tự). Nếu Beds24 không có `eventId` → `eventId = sha256(provider + externalId + modifiedAt|receivedAt)`.
- Vắng `channelFee` → lõi tính theo `channel_commission_pct` (BR-901), `channel_fee.source = 'estimate'`; có và `isEstimate=false` → `source = 'channel_manager'`.
- Đơn về mà căn đã bị chiếm → lõi xử lý theo quy tắc ưu tiên trong `product/docs/integrations.md` mục 3.1.1 (DOM-01, BR-312).

### 3.2 PaymentAdapter (R2 VietQR + Mock; R3 VNPay/MoMo)
```ts
type Gateway = 'vietqr'|'vnpay'|'momo';      // = payment.method trong ERD
interface PaymentAdapter {
  readonly gateway: Gateway;
  createPayment(ctx, req: { paymentCode: string;          // payment.code 'PT-xxxxxx' – sinh TRƯỚC khi gọi cổng
                            amountVnd: number; description: string; // ≤ 50 ký tự, không dấu
                            returnUrl?: string; expiresAt: IsoInstant; locale: 'vi'|'en';
                            channel?: 'qr'|'atm'|'intl_card'|'wallet' }): Promise<{ redirectUrl?: string; qrPayload?: string; providerRef?: string }>;
  // KHÔNG fail-open (SEC-03): event chỉ tồn tại khi chữ ký hợp lệ VÀ merchant khớp cấu hình của ctx
  verifyCallback(ctx, req: InboundHttp): Promise<
    | { ok: true; event: { paymentCode: string; providerTxnId: string; amount: number; currency: 'VND';
                           providerResultCode: string; outcome: 'succeeded'|'failed'; paidAt?: IsoInstant } }
    | { ok: false; reason: 'invalid_signature'|'merchant_mismatch'|'malformed'|'source_not_allowed' }>;
  callbackAck(outcome: 'ok'|'already_confirmed'|'not_found'|'invalid_amount'|'invalid_signature'|'error'): { status: number; headers: Record<string,string>; body: string };
  queryStatus(ctx, paymentCode: string): Promise<{ status: 'pending'|'succeeded'|'failed'|'expired'; providerTxnId?: string; amount?: number; providerResultCode?: string }>;
  refund?(ctx, req: { refundCode: string;                 // payment.code của DÒNG HOÀN (type=refund) – khóa idempotency
                      originalPaymentCode: string; originalProviderTxnId: string; amountVnd: number; reason: string })
    : Promise<{ status: 'pending'|'succeeded'|'failed'; providerRefundTxnId?: string }>;
  healthCheck(ctx): Promise<HealthStatus>;
}
```
**Đồng bộ trạng thái với SM-12/ERD (ARC-11):**
- Adapter chỉ trả `pending|succeeded|failed|expired` – đúng tập con của `payment.status`. `reversed` là thao tác nội bộ (MGR+ ghi sai → giao dịch đảo), adapter không bao giờ trả.
- **Hoàn tiền là giao dịch riêng**: lõi tạo dòng `payment(type=refund, amount_vnd < 0, status=pending, approval_request_id)` **sau khi** yêu cầu SM-10 `approved` (BR-522) → worker gọi `refund({ refundCode: <code dòng hoàn>, ... })` → kết quả cập nhật **chính dòng hoàn** (`succeeded|failed`, `provider_txn_id = providerRefundTxnId`). Dòng thu gốc giữ nguyên `succeeded`.
- `payment.method` = `gateway` (`vietqr|vnpay|momo`); `channel` (`qr|atm|intl_card|wallet`) là phương thức con của cổng → đề nghị ARC thêm cột tùy chọn `payment.method_detail` (hoặc ghi vào `integration_log` nếu ARC không thêm). `payment.provider` = `vnpay|momo|sepay|payos` (nguồn xác nhận); `provider_txn_id` = mã giao dịch cổng.
- VietQR: chỉ `createPayment` → `qrPayload` (tự sinh chuỗi EMVCo/NAPAS); không có callback. Xác nhận bằng `BankFeedAdapter` (3.2b) hoặc FD+ bấm tay (SM-12 `pending → succeeded`, `received_at`, `recorded_by`).

**Quy tắc lõi khi nhận IPN (bắt buộc, thứ tự):**
1. `verifyCallback` → `ok:false` ⇒ `callbackAck('invalid_signature')`, ghi `integration_log`, **không đọc thêm gì**. So sánh chữ ký bằng `crypto.timingSafeEqual` trên buffer cùng độ dài; kiểm `vnp_TmnCode`/`partnerCode` khớp khóa của `ctx`.
2. `paymentCode` không tồn tại hoặc không thuộc `ctx.propertyId` ⇒ `not_found`.
3. Đã `succeeded` với **cùng** `providerTxnId` ⇒ `already_confirmed`, không ghi lần 2 (UK `payment(provider, provider_txn_id)` – ERD K5). Đã `succeeded` với `providerTxnId` khác, hoặc đã `expired/failed` mà nay báo thành công ⇒ "Cần chú ý" (tiền về cho giao dịch đã đóng – SM-01 1.3), trả `ok` để cổng ngừng gửi.
4. `amount ≠ payment.amount_vnd` hoặc `currency ≠ 'VND'` ⇒ `invalid_amount`, "Cần chú ý".
5. `outcome='succeeded'` và `providerResultCode` là mã thành công của cổng ⇒ gọi `queryStatus` xác nhận lại (SR-PAY-04); khớp ⇒ `pending → succeeded` trong 1 giao dịch DB với ghi `inbox_message`; `queryStatus` lỗi/timeout ⇒ trả `error` để cổng gửi lại (VNPay retry tối đa 10 lần [Nguồn]).
6. `outcome='failed'` ⇒ `pending → failed`.
Callback đến trước response tạo thanh toán vẫn xử lý được vì `paymentCode` sinh trước khi gọi cổng.

### 3.2b BankFeedAdapter – báo tiền về cho VietQR (R3) (SEC-06)
```ts
interface BankFeedAdapter {
  readonly provider: 'sepay'|'payos';
  verifyNotification(ctx, req: InboundHttp): Promise<
    | { ok: true; event: { providerTxnId: string; accountNo: string; amountVnd: number; transferContent: string; bankTime: IsoInstant } }
    | { ok: false; reason: 'invalid_signature'|'source_not_allowed'|'malformed' }>;
  fetchTransaction(ctx, providerTxnId: string): Promise<{ accountNo: string; amountVnd: number; transferContent: string } | null>;
  healthCheck(ctx): Promise<HealthStatus>;
}
```
- **Xác thực không chỉ bằng API key tĩnh**: ưu tiên dịch vụ có chữ ký HMAC trên body (so sánh thời gian hằng số). Nếu dịch vụ chỉ có API key: bắt buộc thêm (a) danh sách IP nguồn của dịch vụ và (b) `fetchTransaction` kéo lại giao dịch qua API của dịch vụ trước khi ghi tiền. Thiếu cả hai → không bật tự động, chỉ dùng xác nhận tay.
- **Khớp tự động chỉ khi đủ 4 điều kiện**: đúng số tài khoản nhận đã cấu hình của cơ sở + đúng số tiền + nội dung chứa **đúng một** mã thanh toán/bill hợp lệ + giao dịch đó đang `pending`. Lệch bất kỳ → "Cần chú ý" cho lễ tân ghép tay (không tự ghi).
- Idempotency: UK `payment(provider, provider_txn_id)`.

### 3.3 EInvoiceAdapter (R3 – chờ ESC-008 về thuế suất/diện máy tính tiền)
```ts
interface EInvoiceAdapter {
  issue(ctx, req: { invoiceRef: string;                            // khóa idempotency
                    trigger: 'checkout'|'long_stay_period_paid'|'utilities_monthly'|'manual'; // BR-524 (DOM-02)
                    buyer: { name?: string; taxCode?: string; address?: string; email?: string } | 'retail';
                    lines: { name: string; qty: number; unitPriceVnd: number; vatRatePct: number | 'exempt' | 'not_subject' }[];
                    pricesIncludeVat: boolean; rounding: 'per_line'|'per_invoice'; // từ cấu hình (BR-523)
                    paymentMethod: string; issueDate: LocalDate }): Promise<{ providerId: string; number?: string; lookupCode?: string; status: 'issued'|'pending'|'failed' }>;
  getStatus(ctx, providerId: string): Promise<'issued'|'pending'|'failed'|'cancelled'|'replaced'|'adjusted'>;
  downloadPdf(ctx, providerId: string): Promise<Uint8Array>;
  cancel(ctx, providerId: string, reason: string): Promise<void>;
  replace(ctx, providerId: string, newReq: Parameters<EInvoiceAdapter['issue']>[1]): Promise<{ providerId: string }>;
  adjust(ctx, providerId: string, delta: { lines: { name: string; qty: number; unitPriceVnd: number; vatRatePct: number | 'exempt' | 'not_subject' }[]; direction: 'increase'|'decrease'; reason: string }): Promise<{ providerId: string }>;
  healthCheck(ctx): Promise<HealthStatus>;
}
```
- Phát hành theo **sự kiện nghiệp vụ BR-524**, không theo từng giao dịch thu: ngắn ngày khi hoàn tất trả phòng (SM-01 B18); dài hạn khi kỳ thu được thanh toán; điện nước mỗi tháng. Ký quỹ/cọc **không** phát hành (BR-523) cho đến khi bị khấu trừ. Thời điểm cấu hình được qua tham số `invoice_trigger` (kế toán chỉnh) – chờ kế toán xác nhận qua ESC-008.
- Loại nghiệp vụ sửa hóa đơn (hủy / thay thế / điều chỉnh) do kế toán chọn; endpoint MISA tương ứng tra ở R3.

### 3.4 DoorLockAdapter (R2 `manual`; tự động khi biết hãng)
```ts
interface DoorLockAdapter {
  capabilities(ctx, lockRef: string): Promise<{ remote: boolean; customCode: boolean; codeLength: { min: number; max: number };
                                                card: boolean; fingerprint: boolean; logs: boolean; lockoutAfterFailedAttempts?: number }>;
  createCode(ctx, req: { lockRef: string; code: string;            // 6–10 chữ số, lõi sinh bằng CSPRNG (SR-LOCK-01)
                         kind: 'guest'|'staff'; validFrom: IsoInstant; validTo: IsoInstant;
                         label: string })                          // CHỈ mã tham chiếu nội bộ ngẫu nhiên – không tên/SĐT/ngày sinh (SEC-08)
    : Promise<{ credentialId: string; installed: boolean }>;
  updateValidity(ctx, credentialId: string, validFrom: IsoInstant, validTo: IsoInstant): Promise<void>;
  revoke(ctx, credentialId: string): Promise<void>;
  addCard?(ctx, req: { lockRef: string; keyCardUid: string; validFrom: IsoInstant; validTo: IsoInstant; label: string }): Promise<{ credentialId: string }>;
  accessLog?(ctx, lockRef: string, since: IsoInstant): Promise<{ at: IsoInstant; method: 'code'|'card'|'fingerprint'|'app'|'key'; credentialId?: string }[]>;
  healthCheck(ctx): Promise<HealthStatus>;
}
```
- Adapter **không trả lại mã** (mã do lõi sinh, lưu mã hóa C3); `manual`: `installed=false` → lõi tạo việc "Cài mã trên app khóa"; `revoke` → việc "Xóa mã".
- Sinh mã ở lõi: mặc định 6 số ngẫu nhiên; **mã sinh nhật = `ddmm` + ≥ 3 số ngẫu nhiên** (decision-log DOM+SEC, SR-LOCK-02), chỉ khi khách muốn; không dùng `ddmm` + 2 số. `lockoutAfterFailedAttempts` chỉ để hiển thị mức an toàn của khóa (T11). Không trùng mã đang hiệu lực trên cùng khóa.
- Thời điểm (ARC-16): **tạo** mã có thể lúc đơn `confirmed`; **hiệu lực** `validFrom` = giờ nhận phòng chuẩn ngày đến (hoặc giờ nhận sớm đã xác nhận); **hiển thị cho khách** chỉ trong app khách mức 2 trong khoảng hiệu lực (SR-GST-10). Chi tiết: `product/docs/integrations/smart-lock.md`.

### 3.5 NotificationAdapter (`contracts/notification.ts` – đã có mã)
```ts
interface NotificationAdapter {
  send(ctx, msg: { channel: 'email'|'zalo_zns'|'zalo_oa'|'ota_message'|'manual_copy';
                   purpose: 'transactional'|'verification_code'|'door_code'|'security_alert';
                   to: string;                // dựng lúc gửi từ recipientRef – không nằm trong outbox
                   templateId: string; locale: 'vi'|'en'|'ru'; params: Record<string,string>;
                   attachments?: { name: string; mime: string; data: Uint8Array }[];
                   idempotencyKey: string }): Promise<{ providerMsgId?: string; status: 'sent'|'queued'|'failed'|'copied' }>;
  healthCheck(ctx): Promise<HealthStatus>;
}
```
- `purpose ∈ {verification_code, door_code}` → `params` là bí mật: adapter không log, không lưu sau khi gửi (Mock chỉ giữ khóa idempotency + kênh).
- **Mã xác minh qua kênh OTA/Zalo** (`ota_message`, `zalo_*` với `purpose='verification_code'`): **mặc định tắt**, OWN bật theo từng kênh (PHÂN XỬ ORC 15/10/2026). Lõi kiểm cờ trước khi gọi; adapter không tự quyết chính sách.
- **Mã cửa** (SEC-07): mặc định gửi **link app khách** (xem mã ở mức 2, có nhật ký); chỉ gửi mã trực tiếp khi khách chọn, vào ngày đến, **không kèm địa chỉ/số căn** trong cùng tin.
- `ota_message`: gửi vào hộp thư OTA qua `ChannelAdapter.sendGuestMessage` (Beds24 `POST /bookings/messages`, chỉ cho đơn OTA, cần scope `bookings-personal` [Nguồn: wiki.beds24.com API_V2.0]).
- `manual_copy` trả nội dung đã điền để lễ tân sao chép (R2). ZNS dùng mẫu đã được Zalo duyệt.

### 3.6 GuestRegistrationAdapter – khai báo lưu trú (ARC-14)
```ts
interface GuestRegistrationAdapter {
  prepare(ctx, stayId: string): Promise<{ portalUrl: string;
    people: { personRef: string; kind: 'foreigner_temp_residence'|'vn_citizen_stay'; fields: { label: string; value: string }[] }[] }>;
  recordSubmission(ctx, stayId: string, portalReference: string): Promise<void>; // người nộp = userId lấy từ phiên, lõi tự ghi
}
```
- `fields[].value` là **C3**: chỉ gọi trong request của nhân viên trên **thiết bị được cấp** (SR-DEV-03); lõi ghi `c3_access_log` **trước** khi trả; **không bao giờ** qua outbox/worker/log/thông báo.
- Hồ sơ đoàn có cả khách VN và NN (`registration.kind = mixed` ở ERD) → trả theo từng người.
- Hạn khai báo theo BR-602 (khách VN) / BR-603 (khách NN, giờ đến + 12 giờ – chờ luật sư ESC-001), tham số hóa; job nhắc trước hạn X giờ.
- Chỉ có cài đặt `semi_auto` – **không** tự điền/scrape cổng BCA.

## 4. Biến môi trường (chỉ tên – OPS đưa vào `product/infra/.env.example` với giá trị trống; `EnvCredentialProvider` đọc)
```
APP_ENV=dev                      # dev | test | staging | production (theo services/api/src/config.ts APP_ENVS; production chặn mock/sandbox – 1.3)
# Channel manager
CHANNEL_PROVIDER=off             # off | mock | beds24
CHANNEL_MOCK_SCENARIO=ok
CHANNEL_BEDS24_API_BASE=
CHANNEL_BEDS24_REFRESH_TOKEN=    # scope tối thiểu: bookings, bookings-personal, inventory; KHÔNG quyền thẻ
CHANNEL_WEBHOOK_PATH_TOKEN=      # bí mật kèm đường dẫn nếu Beds24 cho cấu hình URL tùy ý (Beds24 không ký webhook)
CHANNEL_SYNC_FAILURE_ALERT_MINUTES=15
# Payment
PAYMENT_METHODS_ENABLED=vietqr   # danh sách bật, vd. vietqr,vnpay
PAYMENT_MOCK_SCENARIO=ok
PAYMENT_VIETQR_MODE=off          # off | mock | production (VietQR không có sandbox – chỉ sinh chuỗi)
PAYMENT_VIETQR_BANK_BIN=
PAYMENT_VIETQR_ACCOUNT_NO=       # toàn vẹn quan trọng – chỉ đổi qua .env trên máy chủ (SEC-12)
PAYMENT_VIETQR_ACCOUNT_NAME=
PAYMENT_VNPAY_MODE=off           # off | mock | sandbox | production
PAYMENT_VNPAY_TMN_CODE=
PAYMENT_VNPAY_HASH_SECRET=
PAYMENT_VNPAY_PAY_URL=
PAYMENT_VNPAY_API_URL=
PAYMENT_MOMO_MODE=off
PAYMENT_MOMO_PARTNER_CODE=
PAYMENT_MOMO_ACCESS_KEY=
PAYMENT_MOMO_SECRET_KEY=
PAYMENT_MOMO_ENDPOINT=
BANKFEED_PROVIDER=off            # off | mock | sepay | payos
BANKFEED_WEBHOOK_SECRET=         # HMAC; nếu chỉ có API key thì bắt buộc 2 biến dưới
BANKFEED_API_KEY=
BANKFEED_SOURCE_IP_ALLOWLIST=
# E-invoice
EINVOICE_PROVIDER=off            # off | mock | misa
EINVOICE_MISA_BASE_URL=
EINVOICE_MISA_APP_ID=
EINVOICE_MISA_TAX_CODE=
EINVOICE_MISA_USERNAME=          # tài khoản API riêng, chỉ quyền phát hành (SEC-10)
EINVOICE_MISA_PASSWORD=
# Door lock
DOORLOCK_PROVIDER=manual         # off | manual | mock | ttlock
DOORLOCK_TTLOCK_CLIENT_ID=
DOORLOCK_TTLOCK_CLIENT_SECRET=
# Notification
EMAIL_PROVIDER=mock              # off | mock | ses | resend | smtp
EMAIL_FROM=
EMAIL_SES_REGION=                # vd. ap-southeast-1
EMAIL_SMTP_URL=
ZALO_PROVIDER=manual_copy        # off | manual_copy | zns
ZALO_APP_ID=
ZALO_APP_SECRET=
ZALO_OA_ID=
```
Tên biến MISA/ZNS là dự kiến – chỉnh khi đọc tài liệu chi tiết ở R2/R3. Chủ sở hữu, quyền tối thiểu và chu kỳ xoay của từng bí mật: `product/docs/integrations.md` mục 4.1.

## 5. Checklist chất lượng cho mỗi adapter (áp dụng từ Round 2)
- [ ] Xác thực chữ ký callback/webhook bằng so sánh thời gian hằng số; kiểm merchant code; kết quả `ok:false` không mang dữ liệu (không fail-open)
- [ ] Webhook kênh chỉ là tín hiệu → `fetchBooking` kéo lại trước khi ghi
- [ ] Payload mẫu có trường thẻ (scenario `card_data_in_payload`) → không xuất hiện trong DB/log/outbox/inbox; bộ đếm tăng
- [ ] Callback trùng / đến trễ / đến trước response / sai thứ tự / sai số tiền / sai merchant – có test bằng `MockScenario`
- [ ] Ném đúng `IntegrationError` với `retryable`; timeout + retry giới hạn + `integration_log`
- [ ] `healthCheck` chạy được trên Mock và bản thật
- [ ] Đổi off ↔ mock ↔ sandbox ↔ production chỉ bằng cấu hình; production từ chối khởi động với mock/sandbox
- [ ] Mock chạy được trong CI, không mạng ngoài
- [ ] Không log dữ liệu nhạy cảm; query string `/v1/webhooks/*` được che
- [ ] Không đọc `process.env` trong adapter; mọi phương thức nhận `ctx`; ngày là `LocalDate`, thời điểm là `IsoInstant`
