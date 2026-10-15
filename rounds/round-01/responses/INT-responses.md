# INT – Phản hồi review Round 1 (Bước 4)

- Tác giả: INT | Ngày: 15/10/2026
- Thẻ nhận: `reviews/ARC-on-INT.md` (18), `reviews/SEC-on-INT.md` (12), `reviews/DOM-on-INT.md` (8) = **38 thẻ**
- Tổng: **38 Done**, 0 Rejected, 0 Deferred, 0 Escalated mới. Blocker còn Open: **0**. Major còn Open: **0**.
- File đã sửa: `product/integrations/README.md` (interface v0.2), `product/docs/integrations.md`, `product/docs/integrations/channel-manager-comparison.md`, `product/docs/integrations/smart-lock.md`, mã `product/integrations/{contracts/*, notification/*, index.ts, package.json, tsconfig.json}`.
- Nguồn tra mới (15/10/2026): Beds24 API V2.0 wiki (webhook không ký, credit, `POST /bookings/messages`, quyền thẻ), AWS SES giá + vùng, Resend giá + vùng, Booking.com Partner Help, Agoda Partner Hub, TTLock `keyboardPwd/get`.

## 1. ARC → INT (18 thẻ)

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R1-ARC-INT-01 | Major | Done | Mọi phương thức nhận `ctx: IntegrationContext {propertyId, credentialsRef, requestId}`; `IntegrationRegistry.get(kind, propertyId)` cache theo cơ sở – README 1.4, 3.0–3.6. Mã: `contracts/common.ts`; `notification` Mock nhận `ctx`, idempotency theo `propertyId + idempotencyKey` |
| FB-R1-ARC-INT-02 | Major | Done | `LocalDate` (`YYYY-MM-DD`, theo `property.timezone`, khoảng nửa mở) và `IsoInstant` (ISO 8601 có offset) dạng brand type + hàm kiểm `localDate()`/`isoInstant()`; interface không còn `Date` – README 1.5, `contracts/common.ts` |
| FB-R1-ARC-INT-03 | Major | Done | `ChannelBooking` có `modifiedAt`, `externalRoomRef`, `ratePlanRef`, `adults`, `children`, `currency`, `amountOriginal` (đơn vị nhỏ nhất), `amountVnd?`, `channelFee {amount, currency, isEstimate}`, `groupRef` (đơn nhiều phòng → nhiều reservation liên kết), `collectModel`; vắng `channelFee` → ước tính BR-901, `channel_fee.source='estimate'` – README 3.1 |
| FB-R1-ARC-INT-04 | Major | Done | `parseWebhookSignal(ctx, req)` → `{eventId, externalId, hint}` chỉ để ghi `inbox_message`; thêm `fetchBooking(ctx, externalId)`; worker J19 luôn kéo lại. Đã xác minh: Beds24 **không** mô tả chữ ký webhook [Nguồn] → mẫu này là bắt buộc. Bỏ `raw`, chỉ còn `rawFiltered` theo allowlist (xóa sau 90 ngày) – README 1.8, 3.1 |
| FB-R1-ARC-INT-05 | Minor | Done | `verifyCallback(ctx, req: InboundHttp {method GET/POST, headers, query, rawBody, sourceIp})` async; kết quả có `currency`, `providerResultCode`; lõi gọi `queryStatus` trước khi ghi `succeeded` (SR-PAY-04) – README 3.2 |
| FB-R1-ARC-INT-06 | Major | Done | `IntegrationError {code, retryable, retryAfterMs?, providerMessage?}` có mã + bảng hành vi worker (README 1.6); đã cài trong `contracts/common.ts`, Mock ném đúng loại theo scenario, có test |
| FB-R1-ARC-INT-07 | Minor | Done | `healthCheck(ctx): Promise<HealthStatus>` ở mọi adapter, worker 15 phút, `down` → "Cần chú ý" – README 1.10; Mock notification đã cài |
| FB-R1-ARC-INT-08 | Minor | Done | Adapter không đọc `process.env`; `CredentialProvider.get(credentialsRef)`; MVP `EnvCredentialProvider`, sau `DbCredentialProvider` – README 1.4; interface trong `contracts/common.ts` |
| FB-R1-ARC-INT-09 | Major | Done | `pushAvailability/pushRates` theo khoảng `[from, to)`, adapter tự chia lô; thêm `pushRestrictions`. Bảng ước tính tải Beds24 (a/b/c) ở `channel-manager-comparison.md` mục 3.4 – Beds24 không công bố giá credit cố định nên dùng [GIẢ ĐỊNH ~1–2 credit/lời gọi], đo bằng header `x-request-cost` ở R2; kết luận 100 credit/5 phút đủ cho 10 căn |
| FB-R1-ARC-INT-10 | Major | Done | `MockScenario` 14 giá trị (gồm `card_data_in_payload`, `merchant_mismatch`), cấu hình qua `<NHÓM>_MOCK_SCENARIO` hoặc `setScenario()`; Mock thanh toán có `emitCallback`, Mock kênh có `emitSignal`; route `mock` không đăng ký ở production – README 1.2, 1.3; đã cài cho Mock notification + test |
| FB-R1-ARC-INT-11 | Major | Done | Đồng bộ SM-12/ERD: adapter chỉ trả `pending\|succeeded\|failed\|expired`; `reversed` nội bộ; hoàn tiền = dòng `payment(type=refund)` riêng tạo **sau** duyệt SM-10, `refundCode` (= `payment.code` của dòng hoàn) là khóa idempotency, kết quả cập nhật chính dòng hoàn; `method` đổi thành `channel?: qr\|atm\|intl_card\|wallet`, `payment.method` = tên cổng. Sửa `integrations.md` 3.2 + README 3.2. **Yêu cầu ARC** ở mục 4 (cột `method_detail`) |
| FB-R1-ARC-INT-12 | Minor | Done | `PAYMENT_METHODS_ENABLED`; `…_MODE=off\|mock\|sandbox\|production`, `…_PROVIDER=off\|mock\|<tên>`, mặc định `off`; production từ chối khởi động nếu tiền/kênh/khóa ở mock/sandbox; `off` không đăng ký webhook – README 1.3, 4. Yêu cầu OPS/SEC ở mục 4 |
| FB-R1-ARC-INT-13 | Minor | Done | Cập nhật trạng thái README (TypeScript, `@ottimo/integrations`); thêm `contracts/` + export phụ `"./contracts"` trong `package.json`; INT tiếp quản khung OPS, `notification/types.ts` nay chỉ re-export `contracts/notification.ts` |
| FB-R1-ARC-INT-14 | Minor | Done | `prepare(ctx, stayId)` trả `people[{personRef, kind, fields}]` (xử lý hồ sơ `mixed`); bỏ `submittedBy` (lõi lấy từ phiên); ràng buộc C3: chỉ thiết bị được cấp, ghi `c3_access_log` trước khi trả, không qua outbox/worker/log – README 3.6 |
| FB-R1-ARC-INT-15 | Minor | Done | Thêm `pricesIncludeVat`, `rounding`, `trigger`; tách `cancel/replace/adjust`; `issueDate: LocalDate`; đánh dấu R3, chờ ESC-008 – README 3.3 |
| FB-R1-ARC-INT-16 | Minor | Done | `capabilities` async (có `codeLength`, `lockoutAfterFailedAttempts`); mã 6–10 số CSPRNG do lõi sinh; mã sinh nhật `ddmm` + ≥ 3 số; thống nhất 3 thời điểm **tạo** (lúc `confirmed`) / **hiệu lực** (`validFrom` = giờ nhận phòng chuẩn) / **hiển thị** (app mức 2 trong khoảng hiệu lực) – README 3.4, `smart-lock.md` 4.1 |
| FB-R1-ARC-INT-17 | Minor | Done | Bảng so sánh SES / Resend / Brevo (giá < 1.000 email, vùng, API/SMTP, webhook) có nguồn; đề xuất **Amazon SES vùng Singapore**, dự phòng Resend; DNS SPF/DKIM/DMARC trước staging R2 – `integrations.md` 3.4.1. Đề xuất PO đưa vào ESC-010 (mục 5) |
| FB-R1-ARC-INT-18 | Suggestion | Done | Ghi "Phí CM là chi phí riêng, không thuộc ngân sách hạ tầng ≤ 1 tr/tháng" và đánh giá ARC cho phương án ezCloud vào dự thảo ESC (`integrations.md` mục 5) + `channel-manager-comparison.md`. Đề xuất PO chép sang ESC-009 |

## 2. SEC → INT (12 thẻ)

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R1-SEC-INT-01 | **Blocker** | Done | Bỏ `raw` khỏi interface. Adapter dựng DTO bằng **allowlist từng trường**; `scrubCardData()` chạy trước: loại khóa `card*/cc*/cvv/cvc/vcc*/pan/expir*/cardholder` và chuỗi 13–19 số hợp Luhn, tăng `integration_card_data_dropped_total`, cảnh báo SEC/OWN, không log; body thô chỉ trong bộ nhớ request; `rawFiltered` xóa sau 90 ngày; test bắt buộc với scenario `card_data_in_payload` (checklist mục 5). Beds24: quyền xem thẻ phải liên hệ hỗ trợ mới bật [Nguồn] → không yêu cầu; token scope tối thiểu – README 1.8, 3.1, 4; `integrations.md` nguyên tắc 6, mục 4.1, RI10 |
| FB-R1-SEC-INT-02 | Major | Done | Đổi thành `parseWebhookSignal` + `fetchBooking` (cùng ARC-04); đã xác minh Beds24 không ký webhook; thêm `CHANNEL_WEBHOOK_PATH_TOKEN` nếu Beds24 cho URL tùy ý [Chưa xác minh] – README 1.9, 3.1; RI11 |
| FB-R1-SEC-INT-03 | Major | Done | `verifyCallback` trả union phân biệt `{ok:true, event} \| {ok:false, reason}` – `event` chỉ tồn tại khi chữ ký hợp lệ và merchant khớp (không fail-open). Quy tắc lõi 6 bước: `timingSafeEqual`, khớp `TmnCode/partnerCode`, `paymentCode` tồn tại + đúng cơ sở + đang `pending`, khớp số tiền **và** `VND`, trùng `providerTxnId` → `already_confirmed`, `queryStatus` xác nhận lại – README 3.2; checklist mục 5 |
| FB-R1-SEC-INT-04 | Major | Done | (1) Production từ chối khởi động nếu adapter tiền/kênh/khóa ở mock/sandbox, route `mock` không đăng ký (`assertSafeConfig`); (2) IPN VNPay là GET → che query string `/v1/webhooks/*` trong log API + Caddy; (3) đường dẫn `/v1/webhooks/{provider}/{propertySlug}` – README 1.3, 1.9. Yêu cầu ARC sửa OpenAPI, OPS sửa Caddy (mục 4) |
| FB-R1-SEC-INT-05 | Major | Done | Mã sinh nhật = `ddmm` + **3** số ngẫu nhiên (theo decision-log "THAY dòng INT"); không còn biến thể + 2 số; thêm tiêu chí T11 (khóa tạm khi sai nhiều lần); sửa phương án A của dự thảo ESC khóa cửa và nêu rủi ro còn lại cho INV – `smart-lock.md` 1, 3, 4.2, 5; `integrations.md` mục 5. Đề xuất PO sửa ESC-011 (mục 5) |
| FB-R1-SEC-INT-06 | Minor | Done | `BankFeedAdapter` riêng: ưu tiên HMAC; chỉ API key → bắt buộc IP allowlist + `fetchTransaction` kéo lại; thiếu cả hai → không bật tự động. Khớp tự động chỉ khi đúng TK nhận + đúng số tiền + đúng một mã bill + bill đang chờ, lệch → "Cần chú ý" – README 3.2b, `integrations.md` I2b |
| FB-R1-SEC-INT-07 | Minor | Done | Mã cửa mặc định gửi **link app khách**; mã trực tiếp chỉ khi khách chọn, vào ngày đến, không kèm địa chỉ/số căn – `integrations.md` 3.4, README 3.5, `smart-lock.md` 4.1 |
| FB-R1-SEC-INT-08 | Minor | Done | `label` chỉ là mã tham chiếu nội bộ ngẫu nhiên, không tên/SĐT/ngày sinh; hãng khóa là bên xử lý dữ liệu ngoài VN (T10) – đề nghị SEC thêm vào RI9/ESC-002 (mục 4) |
| FB-R1-SEC-INT-09 | Minor | Done | Outbox chỉ chứa tham chiếu (`templateId`, `reservationId`, `recipientRef`…); worker dựng nội dung lúc gửi, đọc C3 qua `CryptoService`, ghi `c3_access_log actor_type=system`; `purpose` = `verification_code/door_code` → Mock không giữ `params` (có test) – README 1.7, 3.5 |
| FB-R1-SEC-INT-10 | Minor | Done | Bảng "Quyền tối thiểu – Chủ sở hữu – Chu kỳ xoay" cho 7 nhóm bí mật; MISA tài khoản API riêng chỉ quyền phát hành; Beds24 không quyền thẻ – `integrations.md` 4.1 |
| FB-R1-SEC-INT-11 | Suggestion | Done | `addCard.cardNumber` → `keyCardUid` – README 3.4 |
| FB-R1-SEC-INT-12 | Suggestion | Done | Số TK nhận VietQR: chỉ đổi qua `.env` (MVP); nếu có màn cấu hình → OWN + xác nhận lại mật khẩu/2FA + audit + thông báo OWN; QR hiện tên chủ TK – `integrations.md` 3.2, README 4 |

## 3. DOM → INT (8 thẻ)

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R1-DOM-INT-01 | Major | Done | Ghi đủ 7 quy tắc ưu tiên OTA vs trực tiếp (không tự hủy đơn OTA; tự gán chỉ trong nhóm; đơn ghi nhận trước giữ căn + danh sách không bao giờ dời; thứ tự phương án dời; thời hạn ≤ 24 giờ / xa hơn; đồng bộ lỗi > 15 phút → đóng bán thủ công; ghi nhận chi phí) kèm cột "App làm gì" – `integrations.md` 3.1.1. Tham số `CHANNEL_SYNC_FAILURE_ALERT_MINUTES=15`. Yêu cầu ARC chỗ lưu bản ghi xung đột (mục 4) |
| FB-R1-DOM-INT-02 | Major | Done | Đổi I5 và 3.3: phát hành **theo sự kiện BR-524** (trả phòng / kỳ thu dài hạn / điện nước tháng), không theo từng lần thu; cọc/ký quỹ không phát hành (BR-523); `invoice_trigger` cấu hình được; interface `issue()` có `trigger` – README 3.3. Đề xuất PO ghi câu xác nhận của kế toán vào ESC-008 (mục 5) |
| FB-R1-DOM-INT-03 | Major | Done | Cùng SEC-05: `ddmm` + 3 số; thêm T11; decision-log đã có dòng "THAY dòng INT" (ORC) nên INT không đề xuất thêm |
| FB-R1-DOM-INT-04 | Minor | Done | Bỏ mốc cố định 23:00: hạn theo BR-602/BR-603 (khách NN giờ đến + 12 giờ – chờ ESC-001), tham số hóa, job nhắc trước X giờ – `integrations.md` I9, 3.5, RI6; README 3.6 |
| FB-R1-DOM-INT-05 | Minor | Done | Thêm bảng 3.1.2: (a) OTA sửa đơn – Beds24 có qua `modifiedAt` [Nguồn], kiểm trùng lại + khai báo `needs_update`; (b) báo no-show – API [Chưa xác minh, kiểm R2] → `reportNoShow?()`, không có thì việc thủ công; (c) trừ VCC – không qua CM, việc thủ công hạn ngày đến + đối soát phí kênh. `ChannelBooking.collectModel` |
| FB-R1-DOM-INT-06 | Suggestion | Done | Đã kiểm: Beds24 `POST /bookings/messages` gửi tin vào hội thoại **đơn OTA**, scope `bookings-personal` [Nguồn]; thêm kênh `ota_message` và `ChannelAdapter.sendGuestMessage?()`; link check-in cho đơn OTA mặc định qua hội thoại OTA, email dự phòng – `integrations.md` 3.1.3, README 3.5 |
| FB-R1-DOM-INT-07 | Suggestion | Done | (a) Mục 4.3 mã nhân viên: mã riêng theo khung giờ, mã chủ chỉ quản lý giữ, đối chiếu nhật ký mở cửa với việc buồng phòng, thu hồi khi nghỉ việc; tiêu chí T12. (b) TTLock có API sinh mã theo kỳ/lịch lặp không truyền giá trị mã [Nguồn]; có chạy không cần gateway không [Chưa xác minh] → T2 hạ "Nên có" **khi** hãng xác nhận – `smart-lock.md` 2, 3, 4.3; README 3.4 `kind: 'guest'\|'staff'` |
| FB-R1-DOM-INT-08 | Suggestion | Done | `pushRestrictions`: ở tối thiểu theo ngày đến, CTA, CTD, dừng bán theo nhóm × ngày (× kênh nếu CM hỗ trợ); Beds24 hỗ trợ theo kênh [Chưa xác minh – kiểm R2] – README 3.1, `integrations.md` 3.1 |

## 4. Yêu cầu gửi vai khác (INT không sửa file của vai khác)

| Gửi | Yêu cầu | Lý do / thẻ |
|---|---|---|
| ARC | `openapi.yaml`: đổi `/v1/webhooks/payments/{provider}` và `/v1/webhooks/channel/{provider}` thành **`/v1/webhooks/{provider}/{propertySlug}`** (`provider ∈ vnpay, momo, sepay, payos, beds24, mock`; `mock` không có ở production); thêm **GET** cho VNPay IPN (query string); `channel` trả 202, thanh toán trả theo định dạng cổng | ADR-011 mục 3, SEC-04 |
| ARC | ERD `payment`: thêm cột tùy chọn `method_detail` (`qr\|atm\|intl_card\|wallet`) hoặc xác nhận chỉ ghi ở `integration_log` | ARC-11 |
| ARC | ERD: nơi lưu bản ghi xung đột OTA (nguyên nhân, phương án i/ii/iii, chi phí, người quyết, hạn xử lý) – vd. bảng `booking_conflict` | DOM-01 quy tắc 5, 7 |
| ARC | ERD `inbox_message`: cột `filtered_payload jsonb` (chỉ allowlist) + job xóa sau 90 ngày; không có cột body thô | SEC-01 |
| ARC | ERD `integration_log`: cột `cost_units` (credit Beds24) | ARC-09 |
| ARC | `architecture.md` mục 13: sửa câu "dùng nguyên trạng thái INT trong ERD" (ARC đã tự nhận ở thẻ 11) | ARC-11 |
| OPS | `.env.example` theo README mục 4 (thêm `APP_ENV`, `PAYMENT_METHODS_ENABLED`, `*_MODE/PROVIDER=off` mặc định, `*_MOCK_SCENARIO`, `BANKFEED_API_KEY`, `BANKFEED_SOURCE_IP_ALLOWLIST`, `CHANNEL_WEBHOOK_PATH_TOKEN`, `CHANNEL_SYNC_FAILURE_ALERT_MINUTES`, `EMAIL_SES_REGION`); Caddy che query string `/v1/webhooks/*`; sổ bí mật theo `integrations.md` 4.1; bản ghi DNS SPF/DKIM/DMARC cho SES | ARC-12, SEC-04, SEC-10, ARC-17 |
| OPS / BE | Kiểm tra khởi động `assertSafeConfig()` (R2, BE cài trong bootstrap) | SEC-04 |
| SEC | SR-SECR-05(c): dùng giá trị `off` (cổng không dùng = `off`, không đăng ký webhook) – INT đã áp; thêm hãng khóa (TTLock/Tuya) và Amazon SES vào danh sách bên xử lý dữ liệu (RI9/ESC-002) | ARC-12, SEC-08, ARC-17 |
| DOM | Viết BR-312 theo 7 quy tắc ở `integrations.md` 3.1.1; BR-307 phần ai trừ VCC, khi nào; BR thêm `min_stay`/CTA/CTD | DOM-01, 05, 08 |

## 5. Đề xuất cho các câu cần INV quyết (PO gom – INT không sửa `02-escalations/`)

| ESC | Đề xuất cập nhật |
|---|---|
| ESC-009 (channel manager) | Thêm câu "Phí CM là chi phí riêng, không thuộc ngân sách hạ tầng ≤ 1 tr/tháng"; phương án ezCloud ghi đánh giá ARC (chỉ chấp nhận khi có văn bản API 2 chiều); thêm dữ kiện mới: Beds24 không ký webhook (đội đã thiết kế an toàn), 100 credit/5 phút đủ cho 10 căn theo ước tính |
| ESC-010 (tài khoản bên thứ ba) | Mục email: đề xuất **Amazon SES vùng Singapore** (< 3.000 đ/tháng ở lượng của OTTIMO), INV đứng tên tài khoản AWS, dán DNS trước staging R2; dự phòng Resend (miễn phí 3.000 email/tháng). Mục báo tiền về: chỉ chọn dịch vụ có chữ ký HMAC (hoặc API key + IP nguồn + kéo lại giao dịch) |
| ESC-011 (khóa cửa) | Phương án A sửa thành `ddmm` + **3** số ngẫu nhiên (7 số), nêu rủi ro còn lại (1.000 khả năng với người biết ngày sinh); câu hỏi phụ cho INV khi gửi ảnh khóa: khóa có tự khóa bàn phím sau nhiều lần nhập sai không |
| ESC-008 (VAT, hóa đơn) | Thêm câu cho kế toán: xác nhận thời điểm phát hành theo BR-524 (trả phòng / kỳ thu / điện nước tháng), cọc không phát hành |

## Dòng decision-log đề xuất

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 1 | Interface adapter v0.2: mọi phương thức nhận `IntegrationContext {propertyId, credentialsRef, requestId}`; adapter không đọc `process.env`, khóa qua `CredentialProvider`; ngày = `LocalDate` (YYYY-MM-DD, nửa mở), thời điểm = `IsoInstant` có offset; lỗi duy nhất `IntegrationError` có `retryable`; mọi adapter có `healthCheck`; lõi chỉ import `@ottimo/integrations/contracts` | INT (ARC review) | ADR-007, ADR-008, ADR-011; ARC-INT-01/02/06/07/08/13 |
| 2026-10-15 | 1 | Không giữ payload thô của đối tác: DTO dựng theo allowlist từng trường, lọc dữ liệu thẻ (tên trường + Luhn 13–19 số) trước khi ghi, `rawFiltered` xóa sau 90 ngày; không bật quyền xem thẻ trên Beds24 | INT + SEC | SEC-INT-01 (Blocker), TM-30 |
| 2026-10-15 | 1 | Webhook kênh chỉ là tín hiệu (`parseWebhookSignal` → inbox) – worker luôn kéo lại đơn qua API (`fetchBooking`); Beds24 không ký webhook | INT | ARC-INT-04, SEC-INT-02 |
| 2026-10-15 | 1 | IPN thanh toán: `verifyCallback` trả `{ok:true,event} \| {ok:false,reason}` (không fail-open); ghi `succeeded` chỉ khi chữ ký + merchant + `paymentCode` đang `pending` + số tiền/VND khớp + `queryStatus` khớp; trùng `providerTxnId` → `already_confirmed` | INT + SEC | SEC-INT-03, SR-PAY-01…05 |
| 2026-10-15 | 1 | Đường dẫn webhook `/v1/webhooks/{provider}/{propertySlug}` (GET+POST cho VNPay), che query string trong log; cấu hình `…_MODE/PROVIDER=off\|mock\|sandbox\|production`, mặc định `off`, `off` không đăng ký webhook; production từ chối khởi động nếu tiền/kênh/khóa ở mock/sandbox | INT + SEC | ADR-011, SEC-INT-04, ARC-INT-12, SR-SECR-05(c) |
| 2026-10-15 | 1 | Trạng thái thanh toán dùng đúng SM-12/ERD; hoàn tiền là dòng `payment(type=refund)` riêng tạo sau duyệt SM-10, mã dòng hoàn làm khóa idempotency khi gọi cổng; `payment.method` = tên cổng | INT (khớp BA/ARC) | ARC-INT-11, BR-522, BR-008 |
| 2026-10-15 | 1 | Báo tiền về (SePay/payOS): chỉ HMAC, hoặc API key + IP nguồn + kéo lại giao dịch; khớp tự động chỉ khi đúng TK nhận + số tiền + đúng một mã bill + bill đang chờ | INT + SEC | SEC-INT-06, TM-31 |
| 2026-10-15 | 1 | Outbox chỉ chứa tham chiếu, nội dung (mã cửa, mã xác minh, email/SĐT) dựng lúc gửi; mã cửa mặc định gửi link app khách, mã trực tiếp chỉ khi khách chọn, ngày đến, không kèm địa chỉ/số căn | INT + SEC | SEC-INT-07, SEC-INT-09 |
| 2026-10-15 | 1 | Hóa đơn điện tử phát hành theo sự kiện BR-524 (trả phòng / kỳ thu / điện nước tháng), không theo từng lần thu; cọc/ký quỹ không phát hành | INT (theo DOM) | DOM-INT-02, BR-523/524 – kế toán xác nhận qua ESC-008 |
| 2026-10-15 | 1 | Đẩy tồn/giá/hạn chế lên CM theo khoảng ngày, gộp lô 10–30 giây, giữ ≥ 20% hạn mức Beds24 cho kéo đơn | INT | ARC-INT-09 |
| 2026-10-15 | 1 | Mỗi Mock có `MockScenario` (14 kịch bản lỗi) cấu hình qua `<NHÓM>_MOCK_SCENARIO` hoặc `setScenario()` | INT | ARC-INT-10 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận qua ESC-010] Email giao dịch dùng Amazon SES vùng Singapore; dự phòng Resend | INT | ARC-INT-17; rẻ, gần VN |
| 2026-10-15 | 1 | Mã nhân viên mở cửa: mỗi người một mã theo khung giờ, mã chủ chỉ quản lý giữ, nhật ký mở cửa đối chiếu việc buồng phòng | INT (theo DOM) | DOM-INT-07 |
