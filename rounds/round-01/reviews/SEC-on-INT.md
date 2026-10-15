# Review SEC → INT – Round 1 · Bước 3

- Người review: SEC | Tác giả: INT | Ngày: 15/10/2026
- Phạm vi: `product/docs/integrations.md`, `product/docs/integrations/channel-manager-comparison.md`, `product/docs/integrations/smart-lock.md`, `product/integrations/README.md`
- Căn cứ: `threat-model.md` (TM-xx), `security-requirements.md` (SR-xxx), `rounds/round-01/outputs/SEC/report.md` mục 4 (SEC-R1-07, -08) và các mã mới SEC-R1-28…30.
- Không có thông tin nào ở đây đã được thử trên hệ thống thật của bên thứ ba; mọi khẳng định về hành vi của đối tác có ghi **[Chưa xác minh]** khi chưa đối chiếu tài liệu.

| Mức | Số thẻ |
|---|---|
| Blocker | 1 |
| Major | 4 |
| Minor | 5 |
| Suggestion | 2 |
| **Tổng** | **12** |

---

### FB-R1-SEC-INT-01
- Mức độ: Blocker
- Vị trí: `product/integrations/README.md` mục 3.1 `ChannelBookingEvent.raw: unknown`; `integrations.md` mục 3.1 "Dữ liệu nhận về"
- Vấn đề: Sự kiện đặt phòng giữ nguyên payload thô (`raw: unknown`). Đơn từ Booking.com/Expedia/Agoda qua channel manager có thể kèm **thẻ ảo (VCC) hoặc thẻ của khách** (số thẻ, hạn, CVV) [Chưa xác minh với Beds24 API V2 – có tùy chọn chuyển thẻ]. Lưu/log `raw` là đưa dữ liệu thẻ vào OTTIMO. [SEC-R1-08; SR-PAY-09; TM-30; R-PAY-01/06]
- Vì sao quan trọng: Vi phạm nguyên tắc 5 của chính tài liệu ("không lưu số thẻ"); một lần lưu PAN là toàn bộ VPS, DB, backup, log rơi vào phạm vi PCI DSS – vượt khả năng của dự án.
- Đề xuất sửa: (1) Bỏ `raw` khỏi interface; adapter trả DTO đã lọc theo **danh sách trường cho phép**; trường nghi thẻ (`card*`, `cc*`, `cvv`, `vcc*`, chuỗi 13–19 số qua Luhn) bị loại, tăng bộ đếm cảnh báo, không log. (2) Nếu cần lưu để đối soát: chỉ bản đã lọc, xóa sau 90 ngày. (3) Thêm vào checklist mục 5: "test payload mẫu có trường thẻ → không xuất hiện trong DB/log". (4) Ghi vào việc INV/INT: tắt chuyển thẻ trên Beds24 và chọn scope token tối thiểu, xác minh trước R3.
- Trạng thái: Open

### FB-R1-SEC-INT-02
- Mức độ: Major
- Vị trí: `README.md` mục 3.1 `parseWebhook(...) // ném lỗi nếu xác thực sai`; `integrations.md` I1
- Vấn đề: Interface giả định webhook Beds24 có chữ ký để "xác thực", nhưng tài liệu chưa chỉ ra Beds24 ký webhook bằng gì [Chưa xác minh]. Nếu không có chữ ký, `parseWebhook` sẽ tin nội dung POST từ bất kỳ ai biết URL → tạo/hủy đơn giả, chiếm tồn phòng. [SEC-R1-28 mới; SR-INT-01; TM-34]
- Vì sao quan trọng: Đơn giả/hủy giả từ Internet làm lệch tồn phòng và có thể hủy đơn thật của khách.
- Đề xuất sửa: Áp mẫu "webhook chỉ là thông báo": adapter chỉ lấy `externalId` từ webhook rồi **gọi lại API Beds24** (`GET /bookings`) để lấy dữ liệu thật (khớp architecture.md mục 10 "webhook kênh → kéo lại dữ liệu qua API"). Thêm bí mật đường dẫn/khóa header nếu Beds24 hỗ trợ; ghi vào mục 3.1 và đổi tên `parseWebhook` → `parseNotification` cho rõ.
- Trạng thái: Open

### FB-R1-SEC-INT-03
- Mức độ: Major
- Vị trí: `README.md` mục 3.2 `verifyCallback(...) : { valid: boolean; ... }`
- Vấn đề: Trả `valid: boolean` cùng với `paymentId/amountVnd/status` là mẫu dễ "fail-open" (lõi quên kiểm `valid` vẫn đọc được `status: 'succeeded'`). Chưa nêu: so sánh chữ ký thời gian hằng số, kiểm `TmnCode`/`partnerCode` khớp cấu hình, kiểm **đơn vị tiền** và trạng thái giao dịch đang `pending`, chống phát lại. [SEC-R1-29 mới; SR-PAY-01…05; TM-28]
- Vì sao quan trọng: Lỗi ở đây = ghi nhận tiền chưa thu (sai tiền – Blocker theo protocol khi xảy ra ở code).
- Đề xuất sửa: Kiểu kết quả phân biệt: `{ ok: true, event } | { ok: false, reason }` (hoặc ném lỗi), `event` chỉ tồn tại khi chữ ký hợp lệ. Ghi quy tắc: `crypto.timingSafeEqual`; khớp merchant code; khớp số tiền **và** `paymentId` tồn tại **và** đang `pending`; trùng `providerTxnId` → `already_confirmed`, không ghi lần 2. Thêm các case này vào checklist mục 5.
- Trạng thái: Open

### FB-R1-SEC-INT-04
- Mức độ: Major
- Vị trí: `README.md` mục 1.3 (chọn cài đặt bằng `<NHÓM>_PROVIDER`/`_MODE`); `integrations.md` I3 (IPN VNPay dạng GET)
- Vấn đề: (1) Không có quy tắc chặn `mock`/`sandbox` ở production: chỉ một biến `PAYMENT_VNPAY_MODE=mock` sót trên máy chủ là adapter Mock nhận "thanh toán thành công" giả. (2) IPN VNPay là GET có tham số trên query (`vnp_SecureHash`, số tiền, mã giao dịch) – sẽ bị ghi vào access log của Caddy/API nếu không che. (3) Webhook cần định danh cơ sở trong đường dẫn để chọn đúng bí mật. [SEC-R1-07; SR-PAY-05, SR-LOG-02; TM-28]
- Vì sao quan trọng: (1) là đường nhận tiền giả không cần chữ ký; (2) đưa dữ liệu thanh toán vào log giữ 90 ngày.
- Đề xuất sửa: Thêm nguyên tắc: "khi `APP_ENV=production`, ứng dụng **từ chối khởi động** nếu bất kỳ adapter tiền/kênh/khóa ở `mock` hoặc `sandbox`; route webhook `mock` không đăng ký". Ghi rõ IPN GET và yêu cầu che query string của `/v1/webhooks/*` trong log. Đường dẫn `/v1/webhooks/{provider}/{propertySlug}` theo ADR-011.
- Trạng thái: Open

### FB-R1-SEC-INT-05
- Mức độ: Major
- Vị trí: `integrations/smart-lock.md` mục 5 và 4.2.1; `integrations.md` ESC-INT-C phương án A
- Vấn đề: Mã sinh nhật dạng `ddmm` + **2** số ngẫu nhiên. Ngày sinh có trên CCCD/hộ chiếu, hồ sơ OTA, mạng xã hội → người biết ngày sinh chỉ còn **100** khả năng; khóa dân dụng thường không giới hạn thử sai [Chưa xác minh theo hãng]. [SR-LOCK-02; TM-38]
- Vì sao quan trọng: Thử 100 mã ở cửa mất vài phút → vào phòng khi khách vắng hoặc đang ngủ. Phương án A của ESC đang được trình INV là "an toàn hơn" nhưng thực tế vẫn yếu.
- Đề xuất sửa: Theo SR-LOCK-02: tối thiểu `ddmm` + **3** số ngẫu nhiên (7 số, 1.000 khả năng) **hoặc** `ddmm` + 2 số chỉ khi khóa có khóa tạm sau N lần sai (xác minh với hãng). Sửa câu chữ ESC-INT-C phương án A, và nêu rõ rủi ro còn lại cho INV. Giữ mặc định 6 số ngẫu nhiên (tốt).
- Trạng thái: Open

### FB-R1-SEC-INT-06
- Mức độ: Minor
- Vị trí: `integrations.md` I2b, `README.md` mục 3.2 `bankfeed`
- Vấn đề: Xác thực webhook báo tiền về ghi "HMAC-SHA256 / API key". Chỉ API key tĩnh trong header là yếu (lộ một lần là giả được mọi giao dịch). Chưa có quy tắc khớp giao dịch: nội dung chuyển khoản do khách tự gõ, có thể ghi mã bill của người khác. [SEC-R1-30 mới; SR-PAY-07; TM-31]
- Vì sao quan trọng: Đánh dấu "đã thu" sai bill → thất thoát tiền, tranh chấp với khách.
- Đề xuất sửa: Chọn dịch vụ có HMAC (ưu tiên); nếu chỉ có API key thì thêm danh sách IP nguồn + đối soát lại qua API của dịch vụ. Khớp tự động chỉ khi **đúng số tài khoản nhận + đúng số tiền + đúng mã bill + bill đang chờ**; lệch bất kỳ → "Cần chú ý" cho lễ tân. Bắt buộc trước R3.
- Trạng thái: Open

### FB-R1-SEC-INT-07
- Mức độ: Minor
- Vị trí: `integrations/smart-lock.md` mục 4.1 bước 2; `integrations.md` mục 3.4 và I7/I8
- Vấn đề: Mã cửa được gửi qua email/Zalo nằm vĩnh viễn trong hộp thư/khung chat, có thể bị chuyển tiếp; nếu cùng tin có địa chỉ + số căn thì một tin là một "chìa khóa hoàn chỉnh". [SR-MSG-02, SR-GST-10; TM-39]
- Vì sao quan trọng: Mã còn hiệu lực suốt kỳ lưu trú; chuyển tiếp tin là lộ phòng.
- Đề xuất sửa: Mặc định gửi **link app khách** (mã xem ở mức 2, có nhật ký); chỉ gửi mã trực tiếp khi khách chọn (khách không dùng được link), vào ngày đến, không kèm địa chỉ/số căn trong cùng tin. Ghi quy tắc này ở mục 3.4.
- Trạng thái: Open

### FB-R1-SEC-INT-08
- Mức độ: Minor
- Vị trí: `integrations/smart-lock.md` mục 2 (TTLock – Hangzhou; Tuya), tiêu chí T10; `README.md` mục 3.4 `createCode.label`
- Vấn đề: Nền tảng khóa cloud đặt máy chủ ngoài Việt Nam [Chưa xác minh vị trí]. `label` là chuỗi tự do → dễ bị điền tên khách/SĐT, tức là chuyển dữ liệu cá nhân ra nước ngoài không cần thiết. [ESC-002; RI9; TM-36, TM-41]
- Vì sao quan trọng: Thêm bên xử lý dữ liệu ngoài lãnh thổ là nghĩa vụ pháp lý (hồ sơ chuyển dữ liệu ra nước ngoài).
- Đề xuất sửa: `label` chỉ chứa mã đơn nội bộ hoặc mã ngẫu nhiên, không tên/SĐT/ngày sinh; với mã sinh nhật, hãng khóa chỉ nhận chuỗi số, không nhận "đây là ngày sinh". Thêm hãng khóa vào danh sách bên xử lý dữ liệu (RI9) để SEC đưa vào ESC-002.
- Trạng thái: Open

### FB-R1-SEC-INT-09
- Mức độ: Minor
- Vị trí: `README.md` mục 1.4–1.5 (outbox, `integration_log`), mục 3.5 `NotificationAdapter.send(params)`
- Vấn đề: Quy tắc "không log khóa, số thẻ, số giấy tờ, mã cửa" chỉ áp cho `integration_log`; chưa nói gì về **outbox**: nếu lõi ghi sẵn `params` (gồm mã cửa, email/SĐT) vào outbox thì C3 nằm trong bảng outbox và backup. [SR-C3-02; TM-19]
- Vì sao quan trọng: Outbox là bảng đọc nhiều, giữ lâu, không có nhật ký truy cập C3.
- Đề xuất sửa: Outbox chỉ chứa **tham chiếu** (`templateId`, `reservationId`, `recipientRef`); worker dựng nội dung ngay lúc gửi, đọc C3 qua `CryptoService` và ghi `c3_access_log` với `actor_type=system`. Ghi vào nguyên tắc 4.
- Trạng thái: Open

### FB-R1-SEC-INT-10
- Mức độ: Minor
- Vị trí: `README.md` mục 4 (biến môi trường); `integrations.md` mục 4
- Vấn đề: Chưa có yêu cầu quyền tối thiểu cho tài khoản/khóa đối tác: MISA dùng `USERNAME/PASSWORD` (có thể là tài khoản quản trị kế toán), Beds24 refresh token dài hạn (chưa nêu scope), TTLock client secret. Không có chu kỳ xoay, không nêu ai giữ. [SR-SECR-03, SR-SECR-04; TM-33, TM-35]
- Vì sao quan trọng: Lộ `.env` = lộ quyền quản trị ở MISA/Beds24 chứ không chỉ quyền tích hợp.
- Đề xuất sửa: Thêm cột "Quyền tối thiểu" vào bảng mục 4 integrations.md: MISA tài khoản API riêng chỉ phát hành hóa đơn; Beds24 token chỉ scope cần thiết (không scope tài chính/thẻ nếu có – [Chưa xác minh]); mỗi bí mật có chủ sở hữu và chu kỳ xoay trong sổ bí mật (SR-SECR-04).
- Trạng thái: Open

### FB-R1-SEC-INT-11
- Mức độ: Suggestion
- Vị trí: `README.md` mục 3.4 `addCard.cardNumber`
- Vấn đề: Tên `cardNumber` (số thẻ từ phòng) trùng từ khóa với số thẻ thanh toán → bộ lọc log/quét PCI sẽ báo nhầm, hoặc ngược lại người viết bộ lọc thêm ngoại lệ cho `cardNumber` làm lọt PAN thật.
- Vì sao quan trọng: Giữ bộ lọc dữ liệu thẻ đơn giản, không ngoại lệ.
- Đề xuất sửa: Đổi tên `keyCardUid`.
- Trạng thái: Open

### FB-R1-SEC-INT-12
- Mức độ: Suggestion
- Vị trí: `integrations.md` I2 (VietQR – `PAYMENT_VIETQR_ACCOUNT_NO`)
- Vấn đề: Số tài khoản nhận tiền "không phải bí mật" nhưng là dữ liệu **toàn vẹn quan trọng**: ai đổi được nó là chuyển tiền khách sang tài khoản khác. Hiện ở `.env` (an toàn); nếu sau này đưa lên màn cấu hình thì cần kiểm soát. [SEC-R1-32 mới; TM-29, TM-33; liên quan FB-R1-SEC-BA-03]
- Vì sao quan trọng: Lừa đảo đổi tài khoản nhận tiền là kiểu gian lận phổ biến.
- Đề xuất sửa: Ghi rõ: chỉ đổi qua `.env` trên máy chủ (MVP); nếu có màn cấu hình thì chỉ OWN, xác nhận lại mật khẩu/2FA, ghi audit và gửi thông báo cho OWN; QR hiển thị tên chủ tài khoản để lễ tân/khách đối chiếu.
- Trạng thái: Open

---

## Điểm làm tốt nên giữ
1. Nguyên tắc "tiền chỉ ghi nhận từ IPN/webhook có chữ ký và khớp số tiền, ReturnUrl chỉ hiển thị" và idempotency theo mã giao dịch cổng – đúng chuẩn và có dẫn nguồn VNPay.
2. Không scraping/bot vào cổng Bộ Công an; khai báo bán tự động – ghi rõ để không ai đề xuất lại.
3. Không nhận khóa qua chat, INV tự điền `.env`; mã cửa mặc định ngẫu nhiên 6 số, xóa ngay khi trả phòng, không log mã rõ; đã tự nhận diện rủi ro mã sinh nhật và đưa lên ESC.
