# Báo cáo INT – Round 1, Bước 2 (Sản xuất, Đợt 1)
- Người làm: INT | Ngày: 15/10/2026 | Việc giao: plan R1 mục 3.1 dòng INT

> Ghi chú ORC: INT không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nguyên nội dung INT gửi, với sự đồng ý của INV.

## 1. Đã làm gì
- Lập danh sách 9 tích hợp và 1 mục phụ I2b (báo tiền về tự động): channel manager, VietQR, VNPay, MoMo, MISA meInvoice, khóa cửa thông minh, Zalo OA/ZNS, email, khai báo lưu trú. Mỗi mục có: mục đích, Round (khớp PRD R2/R3/Sau), kiểu kết nối, tài liệu/sandbox, chi phí kèm nguồn hoặc "chưa xác minh", việc INV phải cung cấp. Bảng việc INV cần cung cấp có 11 dòng.
- So sánh channel manager bản 1 với 4 phương án (Beds24, ezCloud, Channex, Cloudbeds tham khảo) theo số OTA, API cho hệ thống riêng, giá/tháng cho 10 căn, tiếng Việt, đồng bộ giá/phòng trống/đặt phòng, sandbox, ràng buộc hợp đồng. Đề xuất Beds24 vì đủ 6/6 OTA và có API V2.
- Khóa cửa:
  - Các hãng/nền tảng phổ biến tại VN: TTLock, Tuya, igloohome, Kaadas, Samsung/Philips/Yale/Häfele/Dessmann, Hune/Viro/Hexa, khóa thẻ khách sạn truyền thống.
  - Đã xác minh API TTLock trên tài liệu chính thức.
  - 10 tiêu chí chọn khóa; luồng tự động và luồng nhập mã thủ công.
  - Phân tích mã theo ngày sinh nhật.
- Thiết kế interface adapter (giả mã), danh sách biến môi trường, checklist chất lượng adapter.
- Soạn 3 dự thảo ESC (INT-A channel manager, INT-B tài khoản, INT-C khóa cửa).
- Tra web ngày 15/10/2026, ghi nguồn. Không đăng ký tài khoản, không dùng khóa thật.

## 2. File đã tạo/sửa
- product/docs/integrations.md (mới)
- product/docs/integrations/channel-manager-comparison.md (mới)
- product/docs/integrations/smart-lock.md (mới)
- product/integrations/README.md (mới)
- rounds/round-01/outputs/INT/report.md (mới)

Không sửa decision-log và escalations-index; đề xuất ORC ghi các dòng ở mục 3.

## 3. Giả định
- Kỹ thuật (quyền INT):
  - Adapter + Mock; chuyển môi trường bằng biến môi trường; outbox/inbox, chống xử lý trùng.
  - Chỉ ghi nhận tiền từ IPN/webhook có chữ ký.
  - Không dùng iCal; không scraping cổng BCA.
  - Tự sinh chuỗi VietQR trong app.
- [GIẢ ĐỊNH – chờ INV xác nhận]: thẻ quốc tế qua VNPay INTCARD.
- [GIẢ ĐỊNH]: tỉ giá 1 EUR ≈ 30.500 đ, 1 USD ≈ 26.200 đ; ~25 link Beds24 (5 OTA × 3 nhóm căn + Airbnb 10 căn).
- [GIẢ ĐỊNH – chờ INV xác nhận]: mã cửa mặc định ngẫu nhiên 6 số; mã sinh nhật = ddmm + 2 số ngẫu nhiên khi khách đồng ý; gửi mã vào ngày đến; xóa khi trả phòng (chờ SEC review).

## 4. Rủi ro / vướng mắc
- Giá channel manager chưa chính xác: Beds24 chỉ có máy tính giá; ezCloud không ghi rõ đơn vị gói Nâng cao.
- Không có bảng giá chính thức cho phí giao dịch VNPay/MoMo, Zalo ZNS, SePay.
- Không có API khai báo lưu trú cho phần mềm khách sạn (chỉ có ASM/VNeID), nên giữ bán tự động.
- Hãng khóa chưa rõ: nếu khóa không chạy TTLock/Tuya và không có gateway thì chưa tự động được.
- Mã sinh nhật có rủi ro an ninh và dữ liệu cá nhân, cần SEC xem.
- Xung đột tồn phòng OTA ↔ trực tiếp: INT đã có cơ chế kỹ thuật; quy tắc ưu tiên đơn nào cần DOM định nghĩa.
- Hóa đơn điện tử: trang MISA nhắc NĐ 123/2020, 70/2025, 254/2026; cần xác nhận văn bản hiện hành.

## 5. Việc chưa xong
- Chạy máy tính giá Beds24 cho cấu hình OTTIMO.
- Hỏi ezCloud (API, danh sách OTA, giá) và Channex (Traveloka): cần INV gửi hoặc cho phép.
- Tra chi tiết Zalo ZNS và endpoint MISA: Round 2.
- Đối chiếu adapter với ERD/OpenAPI của ARC (Đợt 3).
- Review ARC (bước 3).
- PO đánh số và đưa 3 dự thảo ESC vào 02-escalations.

---

# Bước 4 – Phản hồi & sửa (15/10/2026)

## 1. Đã làm gì
- Trả lời đủ **38 thẻ** (ARC 18, SEC 12, DOM 8) trong `rounds/round-01/responses/INT-responses.md`: **38 Done**, 0 Rejected/Deferred. Blocker còn Open: **0** (SEC-01). Major còn Open: **0** (ARC 01/02/03/04/06/09/10/11, SEC 02/03/04/05, DOM 01/02/03).
- **Interface adapter v0.2** (`product/integrations/README.md`):
  - Mọi phương thức nhận `IntegrationContext`; adapter không đọc `process.env`, nhận khóa qua `CredentialProvider`.
  - Ngày dùng `LocalDate`, thời điểm dùng `IsoInstant`; lỗi chuẩn `IntegrationError` có `retryable`; mọi adapter có `healthCheck`.
  - `MockScenario` 14 kịch bản; production từ chối khởi động nếu tiền/kênh/khóa ở mock/sandbox; giá trị `off` mặc định và không đăng ký webhook.
- **Không giữ payload thô**: bỏ `raw`, lọc theo allowlist từng trường, phát hiện thẻ bằng tên trường + Luhn 13–19 số, `rawFiltered` xóa sau 90 ngày, có test bắt buộc.
- **Webhook kênh chỉ là tín hiệu**: `parseWebhookSignal` + `fetchBooking`. Đã xác minh Beds24 không ký webhook. Đường dẫn webhook là `/v1/webhooks/{provider}/{propertySlug}`, VNPay IPN dùng GET, query string được che trong log.
- **IPN thanh toán không fail-open**: `verifyCallback` trả union `{ok:true,event} | {ok:false,reason}`. Lõi kiểm 6 bước theo thứ tự, gồm gọi `queryStatus` trước khi ghi `succeeded`.
- **Báo tiền về**: tách `BankFeedAdapter`, xác thực bằng HMAC hoặc API key + IP nguồn + kéo lại giao dịch; khớp tự động phải đủ 4 điều kiện.
- **Trạng thái thanh toán đồng bộ SM-12/ERD**: hoàn tiền là dòng `payment(type=refund)` riêng; `payment.method` là tên cổng.
- **Tài liệu nghiệp vụ** (`integrations.md`):
  - 7 quy tắc ưu tiên OTA vs trực tiếp (3.1.1), việc OTA phát sinh như sửa đơn/no-show/VCC (3.1.2), nhắn tin hội thoại OTA (3.1.3).
  - Hóa đơn phát hành theo sự kiện BR-524; hạn khai báo theo BR-602/603.
  - So sánh email (đề xuất SES Singapore); bảng quyền tối thiểu/chủ sở hữu/chu kỳ xoay bí mật (4.1); thêm RI10, RI11.
- **Khóa cửa** (`smart-lock.md`):
  - Mã sinh nhật `ddmm` + 3 số, bỏ biến thể + 2 số theo decision-log; thêm tiêu chí T11, T12.
  - Tách 3 thời điểm tạo / hiệu lực / hiển thị mã; mã nhân viên (4.3); `label` không chứa dữ liệu cá nhân; gửi mã mặc định qua link app khách.
- **Channel manager** (`channel-manager-comparison.md` 3.4): ước tính tải Beds24 (đơn lẻ / đối soát đêm / đỉnh) → 100 credit/5 phút đủ cho 10 căn.
- **Mã**:
  - Thêm `contracts/common.ts` (LocalDate/IsoInstant, IntegrationContext, IntegrationError, HealthStatus, InboundHttp, CredentialProvider, MockScenario), `contracts/notification.ts`, `contracts/index.ts`; export `"./contracts"`.
  - Mock notification: nhận `ctx`, có scenario, có `healthCheck`, đồng hồ tiêm vào (ADR-008), không giữ tham số bí mật; test tăng từ 2 lên 6 ca.
- Việc ORC chuyển tiếp từ SEC: (1) giá trị `off` đã áp cho mọi nhóm, `off` không đăng ký webhook. (2) Đã xác minh nhắn tin theo từng đơn trên extranet: Booking.com có [Nguồn]; Agoda có nhưng phải yêu cầu bật [Nguồn]; Airbnb [GIẢ ĐỊNH]; Expedia/Trip.com/Traveloka [Chưa xác minh]. Beds24 API cũng gửi được tin vào hội thoại đơn OTA [Nguồn].

## 2. File tạo/sửa (Bước 4)
- product/integrations/README.md (viết lại – v0.2)
- product/docs/integrations.md (sửa)
- product/docs/integrations/smart-lock.md (sửa)
- product/docs/integrations/channel-manager-comparison.md (sửa)
- product/integrations/contracts/common.ts, contracts/notification.ts, contracts/index.ts (mới)
- product/integrations/notification/types.ts, mock.ts, mock.test.ts (sửa – INT tiếp quản khung OPS)
- product/integrations/index.ts, package.json (thêm export `./contracts`), tsconfig.json (include `contracts`) (sửa)
- rounds/round-01/responses/INT-responses.md (mới)
- rounds/round-01/outputs/INT/report.md (thêm phần này)

## 3. Giả định
- [GIẢ ĐỊNH] Mỗi lời gọi đơn giản tốn khoảng 1–2 credit Beds24 (tài liệu không công bố bảng giá credit); sẽ đo bằng header `x-request-cost` ở R2.
- [GIẢ ĐỊNH – chờ INV qua ESC-010] Email giao dịch dùng Amazon SES vùng Singapore.
- [GIẢ ĐỊNH] Airbnb có hội thoại theo từng đặt phòng cho chủ nhà; chưa đối chiếu tài liệu.
- Bỏ hẳn biến thể mã `ddmm` + 2 số, theo dòng decision-log "THAY dòng INT", dù SR-LOCK-02 cho phép khi khóa có giới hạn thử sai.

## 4. Rủi ro / vướng mắc
- Chưa chạy được `tsc`/`vitest` (máy không có Node) → mã `contracts/` và Mock notification **chưa được biên dịch/kiểm thử**; CI của OPS cần chạy ở lần đẩy kế tiếp.
- OpenAPI vẫn dùng đường dẫn webhook cũ và chỉ có POST → đã ghi yêu cầu ARC (responses mục 4).
- Chưa xác minh: Beds24 hỗ trợ CTA/CTD theo kênh, báo no-show qua API, kênh nào nhận tin nhắn; TTLock sinh mã có hạn có cần gateway không.

## 5. Việc chưa xong
- Máy tính giá Beds24 (đầu R2).
- Đầu R2: chép interface 3.1–3.4, 3.6 vào `contracts/*.ts`; cài `scrubCardData`, `assertSafeConfig`, `EnvCredentialProvider`.
- PO cập nhật ESC-008/009/010/011 theo đề xuất ở responses mục 5; ORC ghi các dòng decision-log đề xuất.
