# Danh sách tích hợp – OTTIMO Desk

- Người lập: INT | Round 1 – Bước 2 (Sản xuất, Đợt 1) | Ngày: 15/10/2026 | Trạng thái: **v0.2 – đã sửa theo review Bước 3** (ARC 18 thẻ, SEC 12 thẻ, DOM 8 thẻ – trả lời ở `rounds/round-01/responses/INT-responses.md`)
- Đầu vào: brief mục 1, 3, 5, 7; decision-log 15/10/2026; plan R1 mục 3.1; PRD nháp (`product/docs/PRD.md` mục 5, M9/M12/M13/M14); BL 3.19, 5.11, 5.12, 5.20, 5.21, 7
- Tài liệu con: `integrations/channel-manager-comparison.md` (so sánh CM), `integrations/smart-lock.md` (khóa cửa), `integrations/zalo-oa.md` (Zalo OA + ZNS, 17/10/2026); thiết kế adapter: `product/integrations/README.md`
- Quy ước nguồn: **[Nguồn]** = tài liệu chính thức, tra 15/10/2026 (link ở mục 8); **[Bên thứ ba]** = trang review/bài báo; **[Chưa xác minh]** = chưa tìm được nguồn, phải hỏi nhà cung cấp. Không có số liệu nào trong file này là báo giá chính thức.

## 1. Nguyên tắc tích hợp (INT tự quyết, ghi decision-log khi ORC commit)
1. **App OTTIMO là nguồn dữ liệu chính** (BL 5.21). Bên thứ ba chỉ nhận/gửi dữ liệu qua **adapter** có giao diện cố định; đổi nhà cung cấp = viết adapter mới, không sửa lõi.
2. **Mỗi adapter có bản Mock** chạy không cần mạng, để dev/QA làm việc khi INV chưa cấp tài khoản. Chuyển `mock` ↔ `sandbox` ↔ `production` **chỉ bằng biến môi trường**.
3. **Tiền chỉ được ghi nhận từ kênh server-to-server có chữ ký** (IPN/webhook đã xác thực), không bao giờ từ trang chuyển hướng của trình duyệt.
4. Mọi callback **idempotent** (xử lý trùng, đến trễ, đến trước response); mọi lệnh gọi ra có **timeout + retry giới hạn + nhật ký đối soát**; lệnh gửi đi đi qua **hàng đợi (outbox)** để không mất khi mất mạng.
5. Không lưu số thẻ (PCI DSS – SEC); không lưu khóa thật trong repo – chỉ tên biến trong `.env.example`.
6. **Không giữ payload thô của đối tác**: adapter dựng dữ liệu bằng **danh sách trường cho phép**; trường nghi là thẻ (tên trường `card*`, `cc*`, `cvv`, `vcc*`… hoặc dãy 13–19 số hợp lệ Luhn) bị loại trước khi ghi bất cứ đâu, có bộ đếm cảnh báo, không log (SEC-R1-08, decision-log SEC). Chi tiết: README mục 1.8.
7. **Webhook = tín hiệu**: nhận webhook kênh xong luôn **kéo lại** dữ liệu qua API rồi mới ghi; IPN thanh toán chỉ ghi tiền khi chữ ký hợp lệ + đúng merchant + đúng số tiền + giao dịch đang chờ + truy vấn lại cổng khớp. Đường dẫn `/v1/webhooks/{provider}/{propertySlug}`.
8. **Production không bao giờ chạy Mock/sandbox** cho tiền, kênh, khóa: ứng dụng từ chối khởi động nếu cấu hình sai (README mục 1.3).

## 2. Bảng tổng hợp

Cột "Round" khớp PRD nháp mục 5: **R2** = MVP Round 2; **R3** = MVP Round 3 (bản RC); **Sau** = sau MVP.

| # | Tích hợp | Mục đích | Round | Kiểu kết nối | Tài liệu / Sandbox | Chi phí ước tính | INV phải cung cấp |
|---|---|---|---|---|---|---|---|
| I1 | **Channel manager** (đề xuất Beds24) → Airbnb, Booking.com, Agoda, Expedia, Trip.com, Traveloka | Đơn OTA tự về app; đẩy phòng trống + giá ra 6 OTA; chống đặt trùng | R2: Mock + nhập tay; **R3: thật** | REST API + webhook (Beds24 API V2). Webhook Beds24 **không thấy cơ chế ký** [Nguồn: wiki.beds24.com API_V2.0] → webhook chỉ là tín hiệu, app kéo lại đơn qua `GET /bookings` | wiki.beds24.com API V2; Swagger beds24.com/api/v2 [Nguồn]. Chưa thấy sandbox tách riêng – dùng tài khoản thử [Chưa xác minh] | Beds24 ~€30–75/tháng ≈ 0,9–2,3 tr đ [Bên thứ ba + tính toán]; ezCloud ~0,5–1 tr đ [Chưa xác minh]; Channex ≥ 3,6 tr đ [Nguồn] – chi tiết ở file so sánh | Quyết định chọn CM (ESC); **tự đăng ký** tài khoản CM; tài khoản/extranet từng OTA để bật kết nối CM (Airbnb, Booking, Agoda, Expedia, Trip.com, Traveloka – Traveloka đang "chờ duyệt"); tạo API token và tự điền `CHANNEL_*` |
| I2 | **VietQR** (mã QR chuyển khoản theo số tiền bill) | Khách quét QR trả đúng số tiền, nội dung = số bill (BL 5.20) | **R2** | Sinh ảnh/chuỗi QR theo chuẩn VietQR (Quick Link `img.vietqr.io` hoặc tự sinh chuỗi EMVCo) | vietqr.io – Quick Link [Nguồn]. **Lưu ý: trang báo các API Generate/Quicklink sẽ thay đổi từ tháng 10/2026** → ưu tiên tự sinh chuỗi QR trong app | Sinh QR: 0 đ [Chưa xác minh với vietqr.io]. Phí chuyển khoản: theo ngân hàng | Ngân hàng + số tài khoản + tên chủ tài khoản nhận tiền (không phải bí mật, nhưng INV phải xác nhận) |
| I2b | **Xác nhận tiền về tự động** cho VietQR (SePay / payOS / Casso) | Tự đánh dấu "đã thu" khi tiền vào tài khoản, khỏi đối chiếu sao kê bằng tay | **R3** (R2: lễ tân bấm xác nhận tay) | Webhook biến động số dư (SePay retry tối đa 7 lần) [Nguồn: developer.sepay.vn]. **Chỉ chấp nhận** chữ ký HMAC; nếu dịch vụ chỉ có API key → bắt buộc thêm danh sách IP nguồn + kéo lại giao dịch qua API trước khi ghi tiền. Khớp tự động chỉ khi đúng TK nhận + đúng số tiền + đúng một mã bill + bill đang chờ (README 3.2b) | SePay có Test mode [Nguồn]; payOS có webhook có chữ ký [Bên thứ ba] | SePay: [Chưa xác minh]; payOS: miễn phí ~100 giao dịch/ngày theo bình luận 2024 [Bên thứ ba, có thể đã đổi] | Chọn dịch vụ (ESC); **tự đăng ký** và liên kết tài khoản ngân hàng; tạo khóa webhook, tự điền `BANKFEED_*` |
| I3 | **VNPay** | Thu cọc/thanh toán online bằng thẻ ATM nội địa, QR ngân hàng, **thẻ quốc tế** (khách nước ngoài); hoàn tiền | **R3** (code sandbox được từ R2) | Redirect URL có chữ ký HMAC-SHA512 + **IPN** server-to-server (GET – app che query string trong log; đường dẫn `/v1/webhooks/vnpay/{propertySlug}`; bắt buộc SSL, trả `RspCode`; VNPay retry tối đa 10 lần, ~5 phút/lần); API truy vấn/hoàn tiền [Nguồn] | Sandbox: `sandbox.vnpayment.vn` (đăng ký tại `/devreg/`) [Nguồn] | Phí giao dịch theo hợp đồng merchant – **không công bố** [Chưa xác minh] | Hợp đồng merchant VNPay (giấy phép kinh doanh, tài khoản ngân hàng); `TmnCode` + `HashSecret` – INV tự điền `VNPAY_*` |
| I4 | **MoMo** | Thanh toán ví MoMo (khách nội địa) | **R3** (code sandbox được từ R2) | `POST /v2/gateway/api/create`, chữ ký HMAC-SHA256; IPN server-to-server; API truy vấn/hoàn tiền [Nguồn] | developers.momo.vn; môi trường test `test-payment.momo.vn` [Nguồn] | Phí theo hợp đồng – **không công bố** [Chưa xác minh] | Hợp đồng đối tác MoMo Business; `partnerCode`, `accessKey`, `secretKey` – INV tự điền `MOMO_*` |
| I5 | **MISA meInvoice** (INV đã chốt) | Phát hành hóa đơn điện tử (từ máy tính tiền) **theo sự kiện nghiệp vụ BR-524**: ngắn ngày khi hoàn tất trả phòng, dài hạn mỗi kỳ thu được thanh toán, điện nước mỗi tháng; **không** phát hành cho cọc/ký quỹ (BR-523); khách lẻ hoặc có MST (BL 5.20) | **R3** | REST API hoặc SDK của MISA ("tích hợp sâu": phần mềm gọi lên cloud để tạo, ký, phát hành, gửi, tải hóa đơn) [Nguồn: doc.meinvoice.vn] | Test: `testapp.meinvoice.vn`; chính thức `app.meinvoice.vn` [Nguồn] | Theo gói MISA đang dùng; MISA quảng bá kết nối phần mềm bán hàng miễn phí [Nguồn – quảng bá, chưa xác nhận cho phần mềm tự viết] | Tài khoản meInvoice + **tài khoản API riêng chỉ quyền phát hành**; mẫu số/ký hiệu hóa đơn; chữ ký số (HSM/USB) theo cách MISA ký; **thuế suất VAT, giá đã gồm VAT** (pháp lý – BL 9 #16, PO/DOM gom ESC) |
| I6 | **Khóa cửa thông minh** (hãng chưa rõ) | Tạo/xóa mã cửa có hạn theo đơn, mã theo ngày sinh nhật (`ddmm` + ≥ 3 số ngẫu nhiên), thẻ từ; mã riêng cho nhân viên; nhập tay khi chưa có API | **R2: thủ công**; tự động: **Sau** (hoặc R3 nếu INV chọn hãng sớm) | Cloud API của hãng (TTLock/Tuya có API) + gateway Wi-Fi tại khóa | Xem `integrations/smart-lock.md` | Khóa + gateway + phí nền tảng: [Chưa xác minh] | Ảnh khóa + tên app quản lý khóa; có gateway chưa; nếu có API: tài khoản nhà phát triển (INV tự đăng ký) – `DOORLOCK_*` |
| I7 | **Zalo OA / ZNS** (ZNS nay tên "ZBS Template Message") – chi tiết: `integrations/zalo-oa.md` (17/10/2026) | Gửi xác nhận đặt phòng + link check-in, nhắc ngày đến, nhắc trả phòng, bill, cảm ơn/đánh giá cho khách Việt; chat 2 chiều qua OA. **Không** gửi mã cửa/mã xác minh qua ZNS | R2: sao chép gửi tay (PRD M13). Đề xuất ESC-021 A: chat OA thủ công ngay (OA Manager, không lập trình), gửi tự động **đầu R3** | OAuth v4 PKCE (access token 25 giờ, refresh token 3 tháng dùng 1 lần); ZNS `POST business.openapi.zalo.me/message/template` theo SĐT; tin tư vấn OA theo UID; webhook có `X-ZEvent-Signature`, phải trả 200 trong 2 giây [Nguồn: zalo-oa.md mục 10] | developers.zalo.me + zalo.solutions; chế độ phát triển ZNS chỉ gửi quản trị viên [Nguồn] | Gói OA **Tăng trưởng 2.500.000 đ/năm** (bắt buộc cho mọi API) + ZNS ~300–400 đ/tin chưa VAT → ~230.000–290.000 đ/tháng cho 10 căn [Nguồn + ước tính, zalo-oa.md mục 5]. Chat OA gói Cơ bản 0 đ. Ngoài ngân sách hạ tầng | OA **đã xác thực** (giấy đăng ký kinh doanh DN/HKD); tài khoản ZBS + nạp tiền; mẫu tin được duyệt (1–3 ngày làm việc/lượt); Zalo App; `ZALO_*` (zalo-oa.md 4.11) – ESC-021 |
| I8 | **Email** (giao dịch) | Xác nhận đặt phòng, bill PDF, mời đánh giá – kênh chính cho **khách nước ngoài** (EN/RU) | **R2** (email xác nhận theo skill INT Round 2) | SMTP hoặc HTTP API của dịch vụ gửi mail; cần SPF/DKIM/DMARC cho tên miền. **Phụ thuộc bắt buộc của R2**: OTP email app khách mức 2 (SR-GST-07), cảnh báo bảo mật cho OWN (SR-LOG-06) | So sánh + đề xuất: mục 3.4.1 (đề xuất **Amazon SES – Singapore**) | < 1.000 email/tháng: SES ≈ $0,10/1.000 email [Nguồn] → dưới 3.000 đ/tháng; Resend gói miễn phí 3.000 email/tháng, 100/ngày [Nguồn] | **Tên miền** (vd. ottimo…) và quyền sửa DNS (SPF, DKIM, DMARC – OPS soạn bản ghi, INV dán); địa chỉ gửi (vd. `booking@…`); tài khoản AWS do INV đứng tên |
| I9 | **Khai báo lưu trú** (cổng Bộ Công an) | Thông báo lưu trú công dân VN / khai báo tạm trú người nước ngoài theo hạn **BR-602** (khách VN) và **BR-603** (khách NN: giờ đến + 12 giờ – chờ luật sư ESC-001), tham số hóa (BL 5.12) | **R2: bán tự động** (giữ như prototype); tự động: **Sau** (chỉ khi BCA cấp kết nối) | **Không có API công khai** cho phần mềm khách sạn [không tìm thấy nguồn nào]. App chuẩn bị dữ liệu → lễ tân dán/nhập trên cổng hoặc ứng dụng **ASM** (đăng nhập bằng VNeID, quét QR CCCD) → nhập mã hồ sơ về app | Người nước ngoài: `tbltkbtt.bocongan.gov.vn` (BL 5.12); người Việt: ASM / VNeID [Bên thứ ba: báo địa phương] | 0 đ | Tài khoản cơ sở lưu trú trên cổng BCA / ASM (BL 9 #15); người chịu trách nhiệm khai báo ca tối (pháp lý – PO/DOM gom ESC) |

### 2.1 Tích hợp liên quan, chưa nằm trong danh sách giao (để ARC/PO biết)
| Tích hợp | Ghi chú | Round |
|---|---|---|
| Google Hotel Ads / Google đặt trực tiếp (BL 5.11 có kênh "Google") | Beds24 có kết nối Google Hotel Ads / Google for Vacation Rentals [Nguồn] → đi chung CM | Sau |
| WhatsApp / KakaoTalk / Telegram cho khách nước ngoài (BL 9 #19) | Khách Nga hay dùng Telegram/WhatsApp – để sau, MVP dùng email + mẫu tin sao chép | Sau |
| Đọc QR CCCD gắn chip, MRZ hộ chiếu (BL 7) | Xử lý trên thiết bị (camera), không cần bên thứ ba; PRD đặt R3 | R3 |
| Tỷ giá USD (BL 7) | Cấu hình tay trong MVP | Sau |

## 3. Chi tiết theo nhóm

### 3.1 Channel manager (I1)
- **Chọn nhà cung cấp:** xem `integrations/channel-manager-comparison.md`. Đề xuất bản 1: **Beds24** – duy nhất đã xác nhận đủ 6/6 OTA (có Airbnb, Traveloka) **và** có API V2 cho hệ thống riêng. ezCloud chưa thấy API công khai.
- **Dữ liệu đẩy đi (app → CM):** phòng trống theo **từng căn/nhóm căn × khoảng ngày** `[from, to)` (đặt mới, giữ chỗ, gia hạn, khóa OOO, hủy – BL 5.21), giá theo nhóm × khoảng ngày, và **hạn chế bán** (DOM-08): ở tối thiểu theo ngày đến, đóng nhận khách đến (CTA), đóng trả phòng (CTD), dừng bán – theo nhóm × ngày (× kênh nếu CM hỗ trợ). Beds24 có lịch tồn/giá theo căn qua `/inventory/rooms/calendar` [Nguồn]; mức hỗ trợ CTA/CTD theo **từng kênh** [Chưa xác minh – INT kiểm ở R2 bằng tài khoản thử].
- **Dữ liệu nhận về (CM → app):** webhook chỉ là **tín hiệu** (Beds24 không ký webhook [Nguồn: wiki.beds24.com API_V2.0]) → worker kéo lại đơn qua API → tạo/sửa/hủy đơn + hồ sơ khách, gộp theo SĐT/email/số giấy tờ (BL 5.16, 5.21); số người lớn/trẻ em (BR-110, BR-601), tiền tệ gốc + số tiền, **phí kênh thực tế** (vắng → ước tính theo BR-901, đánh dấu `estimate`), mô hình thu (OTA thu hộ / khách trả tại chỗ). Đơn nhiều phòng → nhiều đơn liên kết cùng `groupRef`. **Không bao giờ nhận dữ liệu thẻ** (kể cả VCC): token Beds24 không được bật quyền thẻ; adapter lọc theo danh sách trường cho phép.
- **Chống đặt trùng (đề xuất kỹ thuật, ARC chốt):**
  1. Kiểm tra trùng **ở server** trong 1 giao dịch DB khi tạo đơn từ bất kỳ nguồn nào (BL 8.2 #30).
  2. Mọi thay đổi tồn → ghi bản ghi "cần đồng bộ" vào outbox **cùng giao dịch** → worker đẩy lên CM, gộp theo lô (giới hạn Beds24: 100 credit/5 phút [Nguồn]).
  3. Đơn OTA về mà căn đã bị chiếm (OTA chưa kịp nhận lệnh đóng) → **không từ chối im lặng**: đơn `confirmed` + `conflict_state`, chưa gán căn (ERD mục 7, decision-log ARC) → xử lý theo **3.1.1**.
  4. Đối soát định kỳ (mỗi đêm, 365 ngày tới): so tồn app ↔ CM, lệch → cảnh báo; ước tính tải API ở `integrations/channel-manager-comparison.md` mục 3.4.

#### 3.1.1 Quy tắc ưu tiên khi đơn OTA và đơn trực tiếp tranh cùng căn – đêm (DOM chốt – FB-R1-DOM-INT-01, decision-log DOM 15/10/2026; DOM viết thành BR-312)
| # | Quy tắc | Ai / hạn | App làm gì (INT/BE) |
|---|---|---|---|
| 1 | **Không bao giờ từ chối hay tự hủy đơn OTA** đã về: luôn tạo `confirmed`. Hủy một đơn OTA từ phía OTTIMO là phương án cuối | MGR+ duyệt nếu hủy | Không có đường tự động hủy đơn OTA; hủy tay cần MGR+ |
| 2 | **Tự gán căn cho đơn OTA mới**: (a) căn ánh xạ (kênh đăng từng căn như Airbnb); (b) căn trống **cùng nhóm**, ưu tiên buồng `VI`/`VC`, rồi căn ít tạo đêm lẻ nhất; (c) **không tự gán sang nhóm khác** – chỉ gợi ý | SYS; lễ tân/quản lý bấm chọn khi khác nhóm | Không còn căn cùng nhóm → đơn "chưa gán căn" + cảnh báo |
| 3 | **Khi trùng thật, đơn được server ghi nhận trước giữ căn** (theo thời điểm ghi trong app, không theo thời điểm OTA tạo). Đơn đến sau được dời. **Không bao giờ dời**: khách `in_house`, khách dài hạn, khách VIP/quen, đơn Airbnb đặt đúng căn trong ảnh (dời trong nhóm được nếu khách đồng ý) | SYS xác định; lễ tân thực hiện | So `created_at` server; cờ "không dời" lấy từ trạng thái/hồ sơ khách/kênh |
| 4 | **Thứ tự phương án dời**: (i) căn trống cùng nhóm (lễ tân tự làm); (ii) nâng hạng miễn phí sang nhóm khác (FDL+ xác nhận); (iii) chuyển sang cơ sở tương đương gần đó, OTTIMO trả chênh lệch đêm đầu + xe (MGR+ duyệt, ghi chi phí). Buộc chuyển ra ngoài → ưu tiên khách trực tiếp/CTV **nếu khách đồng ý**; không thì chuyển đơn đến sau | FD / FDL+ / MGR+ | Gợi ý phương án theo thứ tự; ghi người quyết |
| 5 | **Thời hạn xử lý**: ngày đến ≤ 24 giờ → cảnh báo đỏ ngay cho lễ tân + quản lý, phương án trong 1 giờ; xa hơn → "Cần chú ý", phương án trước 12:00 hôm sau. Liên hệ khách **trước** khi khách lên đường | FD + MGR | Hạn tính tự động, quá hạn leo thang |
| 6 | **Đồng bộ lỗi kéo dài** (CM không nhận lệnh > 15 phút – tham số `CHANNEL_SYNC_FAILURE_ALERT_MINUTES`): cảnh báo đỏ + checklist cho quản lý **đóng bán thủ công trên extranet** những ngày còn ≤ 1 căn trống mỗi nhóm; có lại kết nối → đối soát toàn bộ | MGR | `healthCheck` = `down` hoặc outbox kênh tồn > 15 phút → cảnh báo + danh sách ngày cần đóng |
| 7 | **Ghi nhận** mỗi xung đột: nguyên nhân, phương án, chi phí → DATA báo cáo số vụ/tháng (mục tiêu S1 = 0) | SYS | Bản ghi xung đột (đề nghị ARC: bảng/trường cho nguyên nhân, phương án, chi phí – xem responses) |

#### 3.1.2 Các việc OTA phát sinh thêm (FB-R1-DOM-INT-05)
| Việc | CM có API không (Beds24) | Phương án thủ công nếu không có |
|---|---|---|
| (a) OTA **sửa đơn** (đổi ngày, số khách, hủy một phần đêm) | Có: đơn sửa đến qua webhook/`GET /bookings` với `modifiedAt` [Nguồn] | – . Lõi kiểm trùng lại (BR-906) và đánh dấu khai báo `needs_update` khi đổi số người |
| (b) **Báo no-show lên kênh** | [Chưa xác minh] – INT kiểm ở R2; nếu có thì `reportNoShow()` | Việc "Báo no-show trên extranet <kênh>" cho lễ tân, hạn trong ngày (SM-01 B11) |
| (c) **Thu tiền đơn OTA thu hộ / trừ thẻ ảo (VCC)** | **Không dùng** – OTTIMO không kéo VCC qua CM (decision-log SEC) | Việc "Trừ thẻ ảo <kênh> cho đơn X" cho người được giao (DOM chốt vai ở BR-307), hạn = ngày khách đến; đối soát tiền OTA chuyển về với `channel_fee` thực tế (BR-901) |

#### 3.1.3 Nhắn tin trong hội thoại đơn của OTA (DOM-06, SR-GST-13)
- **Qua API**: Beds24 có `POST /bookings/messages` gửi tin vào hội thoại của **đơn OTA** (không dùng cho đơn đặt trực tiếp), cần scope `bookings-personal` [Nguồn: wiki.beds24.com API_V2.0]; kênh nào được hỗ trợ [Chưa xác minh – kiểm ở R2/R3].
- **Thủ công trên extranet (MVP)**: Booking.com – mở đơn → mục hội thoại, hoặc Inbox → Reservation messages [Nguồn: partnerhelp.booking.com]; Agoda – Customer Messaging System trong YCS, **phải yêu cầu Agoda bật**, chỉ nhắn khi đơn đã xác nhận [Nguồn: partnerhub.agoda.com]; Airbnb – hội thoại theo từng đặt phòng trong ứng dụng chủ nhà [GIẢ ĐỊNH – hiểu biết chung, chưa đối chiếu tài liệu]; Expedia, Trip.com, Traveloka [Chưa xác minh]. → Lễ tân **gửi tay** mã xác minh vào hội thoại đơn được (SR-GST-13) cho Booking.com và Agoda; các kênh còn lại coi là chưa chắc cho đến khi kiểm trên tài khoản thật.
- Gửi **link check-in** cho đơn OTA: mặc định qua hội thoại OTA (email OTA thường là địa chỉ chuyển tiếp/che – Booking.com `@guest.booking.com`, Agoda che email [Nguồn]); email là dự phòng. Gửi **mã xác minh** qua kênh OTA/Zalo: **mặc định tắt**, OWN bật theo từng kênh (PHÂN XỬ ORC 15/10/2026).
- **Căn nhóm hay căn lẻ:** Airbnb thường đăng từng căn, các OTA khác theo loại phòng → ERD cần bảng ánh xạ `channel_mapping` (căn/nhóm ↔ mã phòng của CM ↔ kênh) – gửi ARC.
- **Không dùng iCal** (BL 3.19): chỉ đồng bộ ngày, chậm, dễ trùng.

### 3.2 Thanh toán (I2, I2b, I3, I4)
- **R2:** VietQR theo số tiền bill + nội dung `<mã bill>` (≤ 50 ký tự, không dấu, không ký tự đặc biệt [Nguồn: vietqr.io]); lễ tân xác nhận "đã nhận" thủ công; folio ghi 4 cách thu (BL 5.20).
- **R3:** VNPay (gồm thẻ quốc tế cho khách nước ngoài – thay "link thanh toán thẻ" chỉ là chữ trong prototype) + MoMo; webhook ngân hàng để tự xác nhận VietQR.
- **Thẻ quốc tế:** VNPay có `vnp_BankCode=INTCARD` [Nguồn] → có thể đủ, không cần Stripe/OnePay trong MVP [GIẢ ĐỊNH – chờ INV xác nhận qua ESC tài khoản].
- **Trạng thái giao dịch – theo đúng SM-12/ERD `payment`** (thay đề xuất cũ của INT): `pending | succeeded | failed | expired | reversed`. Adapter chỉ trả `pending|succeeded|failed|expired`; `reversed` là bút toán đảo nội bộ (MGR+). Chỉ IPN/webhook đã xác thực chữ ký **và** đúng merchant **và** khớp số tiền **và** giao dịch đang `pending` **và** truy vấn lại cổng khớp mới chuyển `succeeded`. ReturnUrl chỉ hiển thị (VNPay ghi rõ không cập nhật trạng thái tại ReturnUrl [Nguồn]).
- **Hoàn tiền = giao dịch riêng** `payment(type=refund, số âm)` sau khi yêu cầu hoàn được duyệt (SM-10, BR-522); dòng thu gốc không đổi trạng thái. Thu qua cổng → app gọi API hoàn của cổng với mã của dòng hoàn làm khóa chống trùng; thu chuyển khoản → hoàn tay, lễ tân/kế toán ghi nhận. Chính sách hoàn → ESC-006.
- **Phương thức**: `payment.method` = tên cổng (`vietqr|vnpay|momo`) hoặc cách thu tay (`cash|bank_transfer|card_pos|ota_collect`); phương thức con của cổng (`qr|atm|intl_card|wallet`) là thông tin phụ.
- **Số tài khoản nhận VietQR** là dữ liệu toàn vẹn quan trọng (SEC-12): MVP chỉ đổi qua `.env` trên máy chủ; nếu sau này có màn cấu hình → chỉ OWN, xác nhận lại mật khẩu/2FA, ghi audit, thông báo OWN; QR hiển thị tên chủ tài khoản để đối chiếu.

### 3.3 Hóa đơn điện tử MISA (I5)
- Phát hành theo **sự kiện nghiệp vụ BR-524** (không theo từng giao dịch thu): ngắn ngày khi hoàn tất trả phòng; dài hạn khi kỳ thu được thanh toán; điện nước mỗi tháng. Cọc/ký quỹ **không** phát hành (BR-523) cho đến khi bị khấu trừ. Thời điểm cấu hình được (`invoice_trigger`) để kế toán chỉnh – chờ kế toán xác nhận qua ESC-008. Không có thông tin công ty → hóa đơn khách lẻ (BL 5.20).
- Sửa hóa đơn đã phát hành tách 3 nghiệp vụ: hủy / thay thế / điều chỉnh; cách làm tròn VAT (theo dòng / theo tổng) và "giá đã gồm VAT" lấy từ cấu hình (BR-523).
- Cần tách VAT (prototype chưa tách) → **thuế suất và "giá đã gồm VAT"** là câu hỏi pháp lý/thuế (BL 9 #16) – thuộc ESC của PO/DOM, INT chỉ cần kết quả để cấu hình.
- Phát hành bất đồng bộ qua outbox; lỗi → "Cần chú ý", không chặn trả phòng.
- Cần tra kỹ ở Round 2/3: endpoint, cách ký số (HSM hay token USB), luồng "máy tính tiền" theo nghị định mới nhất (trang MISA nhắc nhiều văn bản: NĐ 123/2020, 70/2025, 254/2026 [Nguồn: meinvoice.vn]) – **SEC/kế toán xác nhận văn bản hiện hành**.

### 3.4 Thông báo (I7, I8)
- Một `NotificationAdapter` chung, nhiều kênh: `email`, `zalo_zns`, `zalo_oa`, `manual_copy` (R2: tạo nội dung + nút sao chép).
- Mẫu tin đa ngôn ngữ VI/EN/RU (quyết định P4) do UXD viết nội dung; ZNS cần **đăng ký mẫu với Zalo trước** → mẫu phải chốt sớm (đầu R3).
- Không gửi số giấy tờ, ảnh giấy tờ qua kênh thông báo.
- **Mã cửa** (SEC-07): mặc định gửi **link app khách** (xem mã ở mức 2, có nhật ký); chỉ gửi mã trực tiếp khi khách chọn, vào ngày đến, **không kèm địa chỉ/số căn** trong cùng tin.
- Outbox chỉ giữ tham chiếu (mã đơn, mẫu tin, người nhận); nội dung dựng lúc gửi (SEC-09).

#### 3.4.1 Chọn dịch vụ email giao dịch (ARC-17) – tra 15/10/2026
| Tiêu chí | **Amazon SES** | **Resend** | Brevo |
|---|---|---|---|
| Giá ở < 1.000 email/tháng | $0,10/1.000 email (à la carte) [Nguồn: aws.amazon.com/ses/pricing] → < 3.000 đ/tháng | Miễn phí 3.000 email/tháng, tối đa 100/ngày; Pro $20/tháng [Nguồn: resend.com/pricing] | Có gói miễn phí theo ngày [Chưa xác minh – trang giá không đọc được] |
| Vị trí máy chủ gần VN | Có vùng **Singapore** `ap-southeast-1` (API + SMTP) [Nguồn: docs.aws.amazon.com/general/latest/gr/ses.html] | us-east-1, eu-west-1, sa-east-1, **Tokyo** [Nguồn: resend.com/docs] | EU [Chưa xác minh] |
| API / SMTP | Cả hai | API + SMTP | Cả hai [Chưa xác minh] |
| Webhook báo lỗi gửi / bounce | Có (qua SNS/EventBridge) [Chưa xác minh chi tiết] | Có, 1 endpoint ở gói miễn phí [Nguồn] | [Chưa xác minh] |
| Lưu ý | Tài khoản mới ở sandbox, phải xin mở gửi thật; hạn mức mặc định 200 email/24 giờ [Nguồn] – đủ cho 10 căn | Giới hạn 100 email/ngày ở gói miễn phí – đủ thường ngày, sát trần ngày cao điểm | – |
- **Đề xuất INT: Amazon SES vùng Singapore** – rẻ nhất, gần VN, không trần ngày đáng lo; dự phòng Resend. Dữ liệu C2 (email, tên khách) ra nước ngoài → thuộc ESC-002 (SEC gom bên xử lý dữ liệu). DNS SPF/DKIM/DMARC: OPS soạn bản ghi trong `hosting-plan`, INV dán khi có tên miền – phải xong **trước staging R2**. Ghi vào ESC-010 mục email (PO cập nhật).
- **Cập nhật 23/10/2026 (R3, v1.0):** INV quyết gửi email giao dịch qua **Google Workspace SMTP** (`smtp.gmail.com`, cổng 465 TLS / 587 STARTTLS) từ hộp thư sẵn có `info@ottimo.vn`, xác thực bằng mật khẩu ứng dụng Google (cần xác minh 2 bước) – thay SES cho v1.0, 0 đ. Giới hạn khoảng 2.000 email/ngày/hộp thư [Nguồn: knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app, tra 23/10/2026]; mật khẩu ứng dụng bị Google thu hồi khi đổi mật khẩu hộp thư [Nguồn: support.google.com/accounts/answer/185833, tra 23/10/2026]. Mã: `integrations/notification/smtp.ts` (nodemailer 10.0.16 ghim), mẫu thư `email-templates.ts`, worker `services/api/src/jobs/email-dispatch.ts`. Chi tiết: `rounds/round-03/outputs/INT/s1-email.md`. SES/Resend bỏ khỏi `EMAIL_PROVIDER`.

### 3.5 Khai báo lưu trú (I9)
- Giữ **bán tự động** như prototype (BL 5.12): app chuẩn bị dữ liệu đúng thứ tự trường của cổng → nút "Sao chép" + "Mở cổng" → lễ tân nhập mã hồ sơ → trạng thái `sent` → `confirmed`.
- Hạn theo **BR-602** (khách VN) / **BR-603** (khách NN: giờ đến + 12 giờ – chờ luật sư ESC-001), tham số hóa; job nhắc trước hạn X giờ (ARC).
- Dữ liệu chuẩn bị là C3: chỉ hiện trong request của nhân viên trên thiết bị được cấp, ghi `c3_access_log`, không qua outbox/log/thông báo; trả theo từng người (đoàn có cả khách VN và NN).
- Không có API công khai → **không** tự động điền form trên cổng BCA (scraping/bot vào cổng nhà nước là rủi ro pháp lý và vi phạm điều khoản) – ghi rõ để không ai đề xuất lại.
- Theo dõi: nếu Bộ Công an/ASM công bố kết nối cho phần mềm cơ sở lưu trú → đánh giá ở Round 4+.

## 4. Danh sách INV cần cung cấp (gom một chỗ)

> Tất cả là tài khoản/hợp đồng **INV tự đăng ký, tự điền khóa** vào file `.env` trên máy chủ. Đội không yêu cầu gửi khóa qua chat, không ghi khóa vào repo.

| # | Cần cung cấp / quyết định | Dùng cho | Khi nào cần | Thuộc ESC (dự thảo) |
|---|---|---|---|---|
| 1 | Chọn channel manager + đồng ý phí tháng | I1 | Cuối R1 (để R3 kết nối thật) | ESC-INT-A |
| 2 | Tài khoản CM + bật kết nối từng OTA trong extranet (6 OTA; Traveloka đang chờ duyệt) | I1 | Đầu R3 | ESC-INT-A |
| 3 | Ngân hàng + số tài khoản + tên chủ TK nhận VietQR | I2 | **Đầu R2** | ESC-INT-B |
| 4 | Có dùng dịch vụ báo tiền về tự động (SePay/payOS) không | I2b | Đầu R3 | ESC-INT-B |
| 5 | Hợp đồng merchant VNPay (gồm thẻ quốc tế) | I3 | Sandbox: R2 (đội tự đăng ký sandbox được nếu INV đồng ý); thật: R3 | ESC-INT-B |
| 6 | Hợp đồng MoMo Business – có cần MoMo không | I4 | R3 | ESC-INT-B |
| 7 | Tài khoản MISA meInvoice có quyền API + chữ ký số; tài khoản test | I5 | R3 | ESC-INT-B |
| 8 | Zalo OA đã xác thực + đăng ký ZNS + nạp tiền | I7 | R3 (đăng ký mẫu mất thời gian → nên bắt đầu cuối R2) | ESC-INT-B |
| 9 | Tên miền + quyền sửa DNS cho email | I8 | **Đầu R2** | ESC-INT-B |
| 10 | Tài khoản cơ sở lưu trú trên cổng BCA / ASM; người khai báo ca tối | I9 | R2 (dùng thật khi vận hành) | Pháp lý – PO/DOM gom |
| 11 | Ảnh khóa + tên app khóa + có gateway chưa; quyết định mã sinh nhật | I6 | Cuối R1 / đầu R2 | ESC-INT-C |

### 4.1 Bí mật tích hợp – quyền tối thiểu, chủ sở hữu, chu kỳ xoay (SEC-10, SR-SECR-03/04)
| Bí mật | Quyền tối thiểu | Chủ sở hữu | Xoay |
|---|---|---|---|
| Beds24 refresh token | Chỉ scope cần: đặt phòng, `bookings-personal` (tin nhắn OTA), lịch tồn/giá; **không** quyền thẻ/tài chính (quyền thẻ phải liên hệ Beds24 mới bật [Nguồn] – không yêu cầu) | INV (OWN) | 12 tháng hoặc khi nghi lộ / người giữ nghỉ việc |
| VNPay `HashSecret`, MoMo `secretKey/accessKey` | Theo merchant; không chia sẻ với hệ thống khác | INV (OWN) | Khi nghi lộ; xin cổng cấp lại |
| SePay/payOS khóa webhook | Chỉ webhook + đọc giao dịch của **một** tài khoản nhận | INV (OWN) | 12 tháng |
| MISA meInvoice | **Tài khoản API riêng chỉ quyền phát hành hóa đơn**, không dùng tài khoản quản trị kế toán | Kế toán (INV chỉ định) | 6 tháng |
| TTLock / hãng khóa | Tài khoản nhà phát triển riêng cho OTTIMO, chỉ khóa của cơ sở | INV (OWN) | 12 tháng |
| Email (SES/Resend) | Khóa chỉ quyền gửi từ tên miền OTTIMO | OPS (INV đứng tên tài khoản) | 12 tháng |
| Zalo App Secret | Chỉ OA của OTTIMO | INV (OWN) | 12 tháng |
Mọi dòng ghi vào sổ bí mật (SR-SECR-04, OPS giữ). Cổng không dùng đặt `off`, không đăng ký webhook (SR-SECR-05(c)).

## 5. Dự thảo ESC – **đã được PO gom thành ESC-009 (A), ESC-010 (B), ESC-011 (C)**; nội dung dưới đây là bản INT sửa ở Bước 4, đề xuất PO cập nhật ESC tương ứng (INT không sửa `02-escalations/`)

### ESC-INT-A – Chọn channel manager để kết nối toàn bộ OTA
- Người tạo: INT | Round: 1 | Mức khẩn: Bình thường (gom cuối round)
- Bối cảnh: OTTIMO muốn kết nối cả 6 OTA. Airbnb không cho chủ nhà nhỏ kết nối thẳng, nên phải qua một "channel manager" (CM) đứng giữa. App OTTIMO cần CM có cổng kết nối (API) để đơn OTA tự về app và phòng trống tự đóng/mở trên OTA – nếu không, lễ tân phải nhập 2 nơi và dễ đặt trùng. **Phí CM là chi phí riêng, không thuộc ngân sách hạ tầng ≤ 1 tr/tháng.**
- Câu hỏi cần quyết định: Chọn CM nào và đồng ý mức phí tháng?
- Phương án:
  - A: **Beds24** – Ưu: đủ 6/6 OTA đã xác nhận (có Airbnb, Traveloka), có API công khai, không hợp đồng, không hoa hồng theo đơn. – Nhược: giao diện/hỗ trợ tiếng Anh; đội cấu hình ban đầu. – Chi phí: ước 0,9–2,3 tr đ/tháng (chờ máy tính giá chính thức).
  - B: **ezCloud (ezCms)** – Ưu: công ty Việt, hỗ trợ tiếng Việt, giá ước ~0,5–1 tr đ/tháng. – Nhược: chưa thấy API cho hệ thống riêng; chưa xác nhận Airbnb/Expedia/Traveloka → có nguy cơ phải dùng phần mềm ezCloud song song với app OTTIMO. **ARC: chỉ chấp nhận khi có văn bản xác nhận API 2 chiều; nếu phải dùng PMS ezCloud song song → nguy cơ đặt trùng.** – Chi phí: chưa xác minh.
  - C: **Channex** – Ưu: kỹ thuật tốt nhất cho app tự viết, có môi trường thử miễn phí. – Nhược: ≥ 3,6 tr đ/tháng cho 1 cơ sở; chưa thấy Traveloka.
- Đội đề xuất: **A (Beds24)**; dự phòng C nếu thử Beds24 ở R2 không đạt; B chỉ khi ezCloud xác nhận bằng văn bản có API 2 chiều + đủ OTA.
- Nếu chưa quyết thì: R2 vẫn chạy (đơn OTA nhập tay + đồng bộ giả lập). R3 không bật được đồng bộ OTA thật.
- Hạn cần trả lời: cuối Round 1 (chậm nhất giữa Round 2).
- Trạng thái: Chờ INV

### ESC-INT-B – Tài khoản thanh toán, hóa đơn điện tử, Zalo, email
- Người tạo: INT | Round: 1 | Mức khẩn: Bình thường
- Bối cảnh: Để thu tiền online, tự xuất hóa đơn và tự gửi tin cho khách, OTTIMO phải tự đăng ký tài khoản với từng nhà cung cấp (ngân hàng, VNPay, MoMo, MISA, Zalo, tên miền email). Đội không đăng ký thay và không nhận mật khẩu/khóa qua chat; INV tự điền vào cấu hình máy chủ.
- Câu hỏi cần quyết định: Xác nhận bộ kênh thanh toán – thông báo cho MVP và thời điểm INV mở tài khoản?
- Phương án:
  - A: **Đủ bộ** – VietQR (R2) + VNPay có thẻ quốc tế + MoMo + báo tiền về tự động + MISA + Zalo ZNS + email (R3). – Ưu: tự động tối đa. – Nhược: nhiều hợp đồng, phí giao dịch VNPay/MoMo và phí ZNS theo tin (chưa có giá chính thức).
  - B: **Gọn** – VietQR + báo tiền về tự động + VNPay (gồm thẻ quốc tế) + MISA + email; **bỏ MoMo**; Zalo ZNS để sau MVP (R2–R3 dùng mẫu tin sao chép). – Ưu: ít hợp đồng, chi phí thấp; khách nước ngoài vẫn trả thẻ qua VNPay, khách Việt trả VietQR. – Nhược: khách quen MoMo phải chuyển khoản; tin Zalo vẫn gửi tay.
  - C: **Tối thiểu** – chỉ VietQR + MISA + email. – Nhược: không thu online thẻ quốc tế; cọc của khách nước ngoài khó.
- Đội đề xuất: **B** – vừa đủ cho 10 căn; thêm MoMo/ZNS khi có số liệu vận hành.
- Nếu chưa quyết thì: R2 chạy VietQR + email (cần tài khoản ngân hàng + tên miền **đầu R2**), các cổng khác dùng Mock.
- Hạn cần trả lời: tài khoản ngân hàng + tên miền: đầu Round 2; còn lại: giữa Round 2.
- Trạng thái: Chờ INV

### ESC-INT-C – Hãng khóa cửa và mã theo ngày sinh nhật
- Người tạo: INT | Round: 1 | Mức khẩn: Bình thường
- Bối cảnh: Khóa của OTTIMO mở bằng app/mật mã/vân tay/thẻ, nhưng chưa biết hãng. Chỉ một số nền tảng (TTLock, Tuya…) cho phần mềm khác tạo mã tự động. Mã theo ngày sinh nhật dễ nhớ nhưng người khác dễ đoán (ngày sinh có trên giấy tờ).
- Câu hỏi cần quyết định: (1) Gửi thông tin khóa hiện có để đội kiểm tra API; (2) mã sinh nhật dùng dạng nào?
- Phương án:
  - A: Mã **ngẫu nhiên** mặc định; mã sinh nhật **chỉ khi khách muốn**, dạng ngày-tháng + **3** số ngẫu nhiên (vd. 1503**479**, 7 số). – Ưu: vẫn giữ trải nghiệm. – Nhược: không "thuần" sinh nhật, dài hơn 1 số. **Rủi ro còn lại**: người biết ngày sinh của khách (có trên giấy tờ, mạng xã hội) còn 1.000 khả năng phải thử – chấp nhận được khi khóa có giới hạn thử sai, yếu nếu khóa không giới hạn.
  - B: Mã **đúng ngày sinh** (vd. 150390) cho mọi khách. – Ưu: đúng ý ban đầu. – Nhược: dễ đoán, rủi ro an ninh và dữ liệu cá nhân.
  - C: Không dùng mã sinh nhật, chỉ mã ngẫu nhiên.
- Đội đề xuất: **A**. Về hãng: nếu khóa hiện tại chạy TTLock/Tuya có gateway → tự động từ R3; nếu không → MVP nhập mã tay, cân nhắc thay khóa khi mở rộng.
- Nếu chưa quyết thì: MVP dùng nhập mã thủ công (PRD M14), không chặn công việc.
- Hạn cần trả lời: thông tin khóa – đầu Round 2; chính sách mã – cuối Round 2.
- Trạng thái: Chờ INV

## 6. Rủi ro tích hợp

| # | Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| RI1 | Đặt trùng do độ trễ đồng bộ OTA | Khách đến không có phòng – sự cố nặng nhất | Kiểm trùng ở server, outbox đẩy ngay, trạng thái "xung đột" + cảnh báo, đối soát hằng đêm (mục 3.1) |
| RI2 | Giá CM thực tế khác ước tính | Vượt ngân sách | Chạy máy tính giá trước khi chốt ESC-INT-A |
| RI3 | Traveloka/Expedia duyệt kết nối CM lâu | Chậm bán trên các kênh đó | INV bắt đầu thủ tục từ R2; Mock không phụ thuộc |
| RI4 | Callback thanh toán giả mạo / trùng | Sai tiền | Xác thực chữ ký, khớp số tiền, idempotency key = mã giao dịch cổng |
| RI5 | Hãng khóa không có API | Không tự động mã cửa | Chế độ thủ công là chính thức trong MVP |
| RI6 | Không có API khai báo lưu trú | Lễ tân vẫn thao tác tay | Bán tự động + nhắc theo hạn BR-602/603 (tham số); không scraping |
| RI10 | Payload OTA có dữ liệu thẻ (VCC) lọt vào hệ thống | Kéo cả hệ thống vào phạm vi PCI DSS | Không bật quyền thẻ Beds24; lọc allowlist + phát hiện Luhn; test bắt buộc (README 1.8) |
| RI11 | Webhook giả mạo (Beds24 không ký) | Đơn/hủy giả, lệch tồn | Webhook chỉ là tín hiệu, luôn kéo lại qua API; bí mật đường dẫn nếu cấu hình được |
| RI7 | Văn bản pháp luật hóa đơn điện tử thay đổi (MISA nhắc NĐ 70/2025, 254/2026) | Tích hợp sai luồng | SEC/kế toán xác nhận văn bản hiện hành trước R3 |
| RI8 | VietQR Quick Link thay đổi API từ 10/2026 [Nguồn] | QR hỏng | Tự sinh chuỗi QR chuẩn EMVCo/NAPAS trong app, không phụ thuộc dịch vụ ngoài |
| RI9 | Thêm bên xử lý dữ liệu khách (CM, Zalo, cổng thanh toán) | Nghĩa vụ theo Luật BVDLCN 91/2025 | SEC liệt kê bên xử lý dữ liệu; chỉ gửi trường tối thiểu |

## 7. Việc tiếp theo
- **Round 1 (bước 4 – đã làm):** sửa theo 38 thẻ review; interface v0.2 (README); quy tắc xung đột OTA (3.1.1); email (3.4.1); quyền tối thiểu bí mật (4.1). Còn lại: chạy máy tính giá Beds24 (cần trình duyệt có tương tác – đầu R2).
- **Round 2:** VietQR (sinh QR trong app) + email thật; Mock cho CM, VNPay, MoMo, MISA, Zalo, khóa; adapter VNPay/MoMo chạy sandbox nếu INV cho phép đăng ký sandbox.
- **Round 3:** CM thật, VNPay/MoMo thật, MISA, Zalo ZNS, webhook báo tiền về; test lỗi mạng, timeout, callback trùng.

## 8. Nguồn (tra ngày 15/10/2026)
- Channel manager: xem mục 6 của `integrations/channel-manager-comparison.md`
- Khóa cửa: xem mục 7 của `integrations/smart-lock.md`
- VietQR Quick Link: https://www.vietqr.io/danh-sach-api/link-tao-ma-nhanh/
- VNPay – tài liệu thanh toán (sandbox): https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
- MoMo – thanh toán ví một lần: https://developers.momo.vn/v3/docs/payment/api/wallet/onetime
- SePay – webhook: https://developer.sepay.vn/en/sepay-webhooks
- payOS (bên thứ ba): https://apps.odoo.com/apps/modules/18.0/payment_payos ; https://viblo.asia/q/r1QLxaYxVAw
- MISA meInvoice – tài liệu tích hợp: https://doc.meinvoice.vn/about ; trang chủ: https://www.meinvoice.vn/
- Khai báo lưu trú ASM (báo địa phương): https://baolaocai.vn/thi-diem-thong-bao-luu-tru-qua-phan-mem-asm-post370972.html ; https://hatinh.gov.vn/vi/bai-viet/ha-tinh-trien-khai-thong-bao-luu-tru-qua-phan-mem-asm
- Zalo OA / ZNS (tra 17/10/2026): https://zalo.solutions/oa/pricing ; https://zalo.solutions/business-message/pricing – danh sách đủ ở `integrations/zalo-oa.md` mục 10
- Beds24 API V2.0 (webhook, credit, tin nhắn OTA, quyền thẻ): https://wiki.beds24.com/index.php/API_V2.0
- Amazon SES – giá: https://aws.amazon.com/ses/pricing/ ; vùng: https://docs.aws.amazon.com/general/latest/gr/ses.html
- Resend – giá: https://resend.com/pricing ; vùng: https://resend.com/docs/dashboard/domains/regions
- Booking.com – liên hệ khách qua extranet: https://partnerhelp.booking.com/hc/en-us/articles/115003970605
- Agoda – kênh liên hệ khách: https://partnerhub.agoda.com/?p=3221
