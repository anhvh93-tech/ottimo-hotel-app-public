# Danh sách tích hợp – OTTIMO Desk

- Người lập: INT | Round 1 – Bước 2 (Sản xuất, Đợt 1) | Ngày: 15/10/2026 | Trạng thái: **Bản nháp** – chờ review ARC, SEC (bắt buộc), BE, DOM (khuyến nghị)
- Đầu vào: brief mục 1, 3, 5, 7; decision-log 15/10/2026; plan R1 mục 3.1; PRD nháp (`product/docs/PRD.md` mục 5, M9/M12/M13/M14); BL 3.19, 5.11, 5.12, 5.20, 5.21, 7
- Tài liệu con: `integrations/channel-manager-comparison.md` (so sánh CM), `integrations/smart-lock.md` (khóa cửa); thiết kế adapter: `product/integrations/README.md`
- Quy ước nguồn: **[Nguồn]** = tài liệu chính thức, tra 15/10/2026 (link ở mục 8); **[Bên thứ ba]** = trang review/bài báo; **[Chưa xác minh]** = chưa tìm được nguồn, phải hỏi nhà cung cấp. Không có số liệu nào trong file này là báo giá chính thức.

## 1. Nguyên tắc tích hợp (INT tự quyết, ghi decision-log khi ORC commit)
1. **App OTTIMO là nguồn dữ liệu chính** (BL 5.21). Bên thứ ba chỉ nhận/gửi dữ liệu qua **adapter** có giao diện cố định; đổi nhà cung cấp = viết adapter mới, không sửa lõi.
2. **Mỗi adapter có bản Mock** chạy không cần mạng, để dev/QA làm việc khi INV chưa cấp tài khoản. Chuyển `mock` ↔ `sandbox` ↔ `production` **chỉ bằng biến môi trường**.
3. **Tiền chỉ được ghi nhận từ kênh server-to-server có chữ ký** (IPN/webhook đã xác thực), không bao giờ từ trang chuyển hướng của trình duyệt.
4. Mọi callback **idempotent** (xử lý trùng, đến trễ, đến trước response); mọi lệnh gọi ra có **timeout + retry giới hạn + nhật ký đối soát**; lệnh gửi đi đi qua **hàng đợi (outbox)** để không mất khi mất mạng.
5. Không lưu số thẻ (PCI DSS – SEC); không lưu khóa thật trong repo – chỉ tên biến trong `.env.example`.

## 2. Bảng tổng hợp

Cột "Round" khớp PRD nháp mục 5: **R2** = MVP Round 2; **R3** = MVP Round 3 (bản RC); **Sau** = sau MVP.

| # | Tích hợp | Mục đích | Round | Kiểu kết nối | Tài liệu / Sandbox | Chi phí ước tính | INV phải cung cấp |
|---|---|---|---|---|---|---|---|
| I1 | **Channel manager** (đề xuất Beds24) → Airbnb, Booking.com, Agoda, Expedia, Trip.com, Traveloka | Đơn OTA tự về app; đẩy phòng trống + giá ra 6 OTA; chống đặt trùng | R2: Mock + nhập tay; **R3: thật** | REST API + webhook (Beds24 API V2) | wiki.beds24.com API V2; Swagger beds24.com/api/v2 [Nguồn]. Chưa thấy sandbox tách riêng – dùng tài khoản thử [Chưa xác minh] | Beds24 ~€30–75/tháng ≈ 0,9–2,3 tr đ [Bên thứ ba + tính toán]; ezCloud ~0,5–1 tr đ [Chưa xác minh]; Channex ≥ 3,6 tr đ [Nguồn] – chi tiết ở file so sánh | Quyết định chọn CM (ESC); **tự đăng ký** tài khoản CM; tài khoản/extranet từng OTA để bật kết nối CM (Airbnb, Booking, Agoda, Expedia, Trip.com, Traveloka – Traveloka đang "chờ duyệt"); tạo API token và tự điền `CHANNEL_*` |
| I2 | **VietQR** (mã QR chuyển khoản theo số tiền bill) | Khách quét QR trả đúng số tiền, nội dung = số bill (BL 5.20) | **R2** | Sinh ảnh/chuỗi QR theo chuẩn VietQR (Quick Link `img.vietqr.io` hoặc tự sinh chuỗi EMVCo) | vietqr.io – Quick Link [Nguồn]. **Lưu ý: trang báo các API Generate/Quicklink sẽ thay đổi từ tháng 10/2026** → ưu tiên tự sinh chuỗi QR trong app | Sinh QR: 0 đ [Chưa xác minh với vietqr.io]. Phí chuyển khoản: theo ngân hàng | Ngân hàng + số tài khoản + tên chủ tài khoản nhận tiền (không phải bí mật, nhưng INV phải xác nhận) |
| I2b | **Xác nhận tiền về tự động** cho VietQR (SePay / payOS / Casso) | Tự đánh dấu "đã thu" khi tiền vào tài khoản, khỏi đối chiếu sao kê bằng tay | **R3** (R2: lễ tân bấm xác nhận tay) | Webhook biến động số dư (HMAC-SHA256 / API key; SePay retry tối đa 7 lần) [Nguồn: developer.sepay.vn] | SePay có Test mode [Nguồn]; payOS có webhook có chữ ký [Bên thứ ba] | SePay: [Chưa xác minh]; payOS: miễn phí ~100 giao dịch/ngày theo bình luận 2024 [Bên thứ ba, có thể đã đổi] | Chọn dịch vụ (ESC); **tự đăng ký** và liên kết tài khoản ngân hàng; tạo khóa webhook, tự điền `BANKFEED_*` |
| I3 | **VNPay** | Thu cọc/thanh toán online bằng thẻ ATM nội địa, QR ngân hàng, **thẻ quốc tế** (khách nước ngoài); hoàn tiền | **R3** (code sandbox được từ R2) | Redirect URL có chữ ký HMAC-SHA512 + **IPN** server-to-server (GET, bắt buộc SSL, trả `RspCode`; VNPay retry tối đa 10 lần, ~5 phút/lần); API truy vấn/hoàn tiền [Nguồn] | Sandbox: `sandbox.vnpayment.vn` (đăng ký tại `/devreg/`) [Nguồn] | Phí giao dịch theo hợp đồng merchant – **không công bố** [Chưa xác minh] | Hợp đồng merchant VNPay (giấy phép kinh doanh, tài khoản ngân hàng); `TmnCode` + `HashSecret` – INV tự điền `VNPAY_*` |
| I4 | **MoMo** | Thanh toán ví MoMo (khách nội địa) | **R3** (code sandbox được từ R2) | `POST /v2/gateway/api/create`, chữ ký HMAC-SHA256; IPN server-to-server; API truy vấn/hoàn tiền [Nguồn] | developers.momo.vn; môi trường test `test-payment.momo.vn` [Nguồn] | Phí theo hợp đồng – **không công bố** [Chưa xác minh] | Hợp đồng đối tác MoMo Business; `partnerCode`, `accessKey`, `secretKey` – INV tự điền `MOMO_*` |
| I5 | **MISA meInvoice** (INV đã chốt) | Phát hành hóa đơn điện tử (từ máy tính tiền) mỗi lần thu tiền; khách lẻ hoặc có MST (BL 5.20) | **R3** | REST API hoặc SDK của MISA ("tích hợp sâu": phần mềm gọi lên cloud để tạo, ký, phát hành, gửi, tải hóa đơn) [Nguồn: doc.meinvoice.vn] | Test: `testapp.meinvoice.vn`; chính thức `app.meinvoice.vn` [Nguồn] | Theo gói MISA đang dùng; MISA quảng bá kết nối phần mềm bán hàng miễn phí [Nguồn – quảng bá, chưa xác nhận cho phần mềm tự viết] | Tài khoản meInvoice + quyền API; mẫu số/ký hiệu hóa đơn; chữ ký số (HSM/USB) theo cách MISA ký; **thuế suất VAT, giá đã gồm VAT** (pháp lý – BL 9 #16, PO/DOM gom ESC) |
| I6 | **Khóa cửa thông minh** (hãng chưa rõ) | Tạo/xóa mã cửa có hạn theo đơn, mã theo ngày sinh nhật, thẻ từ; nhập tay khi chưa có API | **R2: thủ công**; tự động: **Sau** (hoặc R3 nếu INV chọn hãng sớm) | Cloud API của hãng (TTLock/Tuya có API) + gateway Wi-Fi tại khóa | Xem `integrations/smart-lock.md` | Khóa + gateway + phí nền tảng: [Chưa xác minh] | Ảnh khóa + tên app quản lý khóa; có gateway chưa; nếu có API: tài khoản nhà phát triển (INV tự đăng ký) – `DOORLOCK_*` |
| I7 | **Zalo OA / ZNS** | Gửi xác nhận đặt phòng, mã cửa, nhắc trả phòng, bill cho khách Việt; nhắn tin 2 chiều qua OA | **R3** (R2: mẫu tin để **sao chép** gửi tay – PRD M13) | Zalo OA API + ZNS API (mẫu tin phải được Zalo duyệt trước) | developers.zalo.me [Chưa xác minh chi tiết – tra ở Round 2] | ZNS tính phí theo tin, có thể khác theo loại mẫu – **chưa tìm được bảng giá chính thức** [Chưa xác minh]. Brief: phí Zalo nằm ngoài ngân sách hạ tầng | Zalo OA đã xác thực doanh nghiệp; đăng ký ZNS + nạp tiền; mẫu tin được duyệt; App ID/Secret – `ZALO_*` |
| I8 | **Email** (giao dịch) | Xác nhận đặt phòng, bill PDF, mời đánh giá – kênh chính cho **khách nước ngoài** (EN/RU) | **R2** (email xác nhận theo skill INT Round 2) | SMTP hoặc HTTP API của dịch vụ gửi mail; cần SPF/DKIM/DMARC cho tên miền | Ứng viên: Amazon SES, Resend, Brevo… – chọn cùng ARC/OPS | Lượng gửi của 10 căn rất nhỏ (ước < 1.000 email/tháng) → thường nằm trong gói miễn phí hoặc vài chục nghìn đ/tháng [Chưa xác minh] | **Tên miền** (vd. ottimo…) và quyền sửa DNS; địa chỉ gửi (vd. `booking@…`) |
| I9 | **Khai báo lưu trú** (cổng Bộ Công an) | Thông báo lưu trú công dân VN / khai báo tạm trú người nước ngoài trước 23:00 ngày đến (BL 5.12) | **R2: bán tự động** (giữ như prototype); tự động: **Sau** (chỉ khi BCA cấp kết nối) | **Không có API công khai** cho phần mềm khách sạn [không tìm thấy nguồn nào]. App chuẩn bị dữ liệu → lễ tân dán/nhập trên cổng hoặc ứng dụng **ASM** (đăng nhập bằng VNeID, quét QR CCCD) → nhập mã hồ sơ về app | Người nước ngoài: `tbltkbtt.bocongan.gov.vn` (BL 5.12); người Việt: ASM / VNeID [Bên thứ ba: báo địa phương] | 0 đ | Tài khoản cơ sở lưu trú trên cổng BCA / ASM (BL 9 #15); người chịu trách nhiệm khai báo ca tối (pháp lý – PO/DOM gom ESC) |

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
- **Dữ liệu đẩy đi (app → CM):** phòng trống theo **từng căn/nhóm căn × ngày** (đặt mới, giữ chỗ, gia hạn, khóa OOO, hủy – BL 5.21), giá theo nhóm × ngày, ở tối thiểu, đóng/mở bán.
- **Dữ liệu nhận về (CM → app):** đơn mới / sửa / hủy (webhook) → tạo đơn + hồ sơ khách, gộp theo SĐT/email/số giấy tờ (BL 5.16, 5.21); số tiền và **phí kênh thực tế** để DATA tính thực thu (BL 5.11).
- **Chống đặt trùng (đề xuất kỹ thuật, ARC chốt):**
  1. Kiểm tra trùng **ở server** trong 1 giao dịch DB khi tạo đơn từ bất kỳ nguồn nào (BL 8.2 #30).
  2. Mọi thay đổi tồn → ghi bản ghi "cần đồng bộ" vào outbox **cùng giao dịch** → worker đẩy lên CM, gộp theo lô (giới hạn Beds24: 100 credit/5 phút [Nguồn]).
  3. Đơn OTA về mà căn đã bị chiếm (OTA chưa kịp nhận lệnh đóng) → **không từ chối im lặng**: tạo đơn trạng thái "xung đột", báo "Cần chú ý" cho lễ tân chuyển căn cùng nhóm hoặc liên hệ OTA. Quy tắc nghiệp vụ ưu tiên ai → **DOM** định nghĩa (gửi thẻ review).
  4. Đối soát định kỳ (vd. mỗi đêm): so tồn app ↔ CM, lệch → cảnh báo.
- **Căn nhóm hay căn lẻ:** Airbnb thường đăng từng căn, các OTA khác theo loại phòng → ERD cần bảng ánh xạ `channel_mapping` (căn/nhóm ↔ mã phòng của CM ↔ kênh) – gửi ARC.
- **Không dùng iCal** (BL 3.19): chỉ đồng bộ ngày, chậm, dễ trùng.

### 3.2 Thanh toán (I2, I2b, I3, I4)
- **R2:** VietQR theo số tiền bill + nội dung `<mã bill>` (≤ 50 ký tự, không dấu, không ký tự đặc biệt [Nguồn: vietqr.io]); lễ tân xác nhận "đã nhận" thủ công; folio ghi 4 cách thu (BL 5.20).
- **R3:** VNPay (gồm thẻ quốc tế cho khách nước ngoài – thay "link thanh toán thẻ" chỉ là chữ trong prototype) + MoMo; webhook ngân hàng để tự xác nhận VietQR.
- **Thẻ quốc tế:** VNPay có `vnp_BankCode=INTCARD` [Nguồn] → có thể đủ, không cần Stripe/OnePay trong MVP [GIẢ ĐỊNH – chờ INV xác nhận qua ESC tài khoản].
- **Trạng thái giao dịch (đề xuất):** `created → pending → succeeded | failed | expired`; `succeeded → refund_pending → refunded`. Chỉ IPN/webhook đã xác thực chữ ký **và** khớp số tiền mới chuyển `succeeded`. ReturnUrl chỉ hiển thị (VNPay ghi rõ không cập nhật trạng thái tại ReturnUrl [Nguồn]).
- **Hoàn cọc / ký quỹ:** qua API hoàn tiền của cổng nếu thu qua cổng; nếu thu chuyển khoản → hoàn tay, app ghi nhận. Chính sách hoàn → PO/DOM (ESC hủy/hoàn cọc).

### 3.3 Hóa đơn điện tử MISA (I5)
- Mỗi lần thu tiền → tạo yêu cầu phát hành; không có thông tin công ty → hóa đơn khách lẻ (BL 5.20).
- Cần tách VAT (prototype chưa tách) → **thuế suất và "giá đã gồm VAT"** là câu hỏi pháp lý/thuế (BL 9 #16) – thuộc ESC của PO/DOM, INT chỉ cần kết quả để cấu hình.
- Phát hành bất đồng bộ qua outbox; lỗi → "Cần chú ý", không chặn trả phòng.
- Cần tra kỹ ở Round 2/3: endpoint, cách ký số (HSM hay token USB), luồng "máy tính tiền" theo nghị định mới nhất (trang MISA nhắc nhiều văn bản: NĐ 123/2020, 70/2025, 254/2026 [Nguồn: meinvoice.vn]) – **SEC/kế toán xác nhận văn bản hiện hành**.

### 3.4 Thông báo (I7, I8)
- Một `NotificationAdapter` chung, nhiều kênh: `email`, `zalo_zns`, `zalo_oa`, `manual_copy` (R2: tạo nội dung + nút sao chép).
- Mẫu tin đa ngôn ngữ VI/EN/RU (quyết định P4) do UXD viết nội dung; ZNS cần **đăng ký mẫu với Zalo trước** → mẫu phải chốt sớm (đầu R3).
- Không gửi số giấy tờ, ảnh giấy tờ qua kênh thông báo; mã cửa chỉ gửi vào ngày đến (SEC review).

### 3.5 Khai báo lưu trú (I9)
- Giữ **bán tự động** như prototype (BL 5.12): app chuẩn bị dữ liệu đúng thứ tự trường của cổng → nút "Sao chép" + "Mở cổng" → lễ tân nhập mã hồ sơ → trạng thái `sent` → `confirmed`.
- Nhắc hạn 23:00 bằng job theo lịch (ARC).
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

## 5. Dự thảo ESC (chưa đánh số – PO gom vào `02-escalations/` cùng các ESC khác cuối Round 1)

### ESC-INT-A – Chọn channel manager để kết nối toàn bộ OTA
- Người tạo: INT | Round: 1 | Mức khẩn: Bình thường (gom cuối round)
- Bối cảnh: OTTIMO muốn kết nối cả 6 OTA. Airbnb không cho chủ nhà nhỏ kết nối thẳng, nên phải qua một "channel manager" (CM) đứng giữa. App OTTIMO cần CM có cổng kết nối (API) để đơn OTA tự về app và phòng trống tự đóng/mở trên OTA – nếu không, lễ tân phải nhập 2 nơi và dễ đặt trùng.
- Câu hỏi cần quyết định: Chọn CM nào và đồng ý mức phí tháng?
- Phương án:
  - A: **Beds24** – Ưu: đủ 6/6 OTA đã xác nhận (có Airbnb, Traveloka), có API công khai, không hợp đồng, không hoa hồng theo đơn. – Nhược: giao diện/hỗ trợ tiếng Anh; đội cấu hình ban đầu. – Chi phí: ước 0,9–2,3 tr đ/tháng (chờ máy tính giá chính thức).
  - B: **ezCloud (ezCms)** – Ưu: công ty Việt, hỗ trợ tiếng Việt, giá ước ~0,5–1 tr đ/tháng. – Nhược: chưa thấy API cho hệ thống riêng; chưa xác nhận Airbnb/Expedia/Traveloka → có nguy cơ phải dùng phần mềm ezCloud song song với app OTTIMO. – Chi phí: chưa xác minh.
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
  - A: Mã **ngẫu nhiên** mặc định; mã sinh nhật **chỉ khi khách muốn**, dạng ngày-tháng + 2 số ngẫu nhiên (vd. 1503**47**). – Ưu: an toàn hơn, vẫn giữ trải nghiệm. – Nhược: không "thuần" sinh nhật.
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
| RI6 | Không có API khai báo lưu trú | Lễ tân vẫn thao tác tay | Bán tự động + nhắc hạn 23:00; không scraping |
| RI7 | Văn bản pháp luật hóa đơn điện tử thay đổi (MISA nhắc NĐ 70/2025, 254/2026) | Tích hợp sai luồng | SEC/kế toán xác nhận văn bản hiện hành trước R3 |
| RI8 | VietQR Quick Link thay đổi API từ 10/2026 [Nguồn] | QR hỏng | Tự sinh chuỗi QR chuẩn EMVCo/NAPAS trong app, không phụ thuộc dịch vụ ngoài |
| RI9 | Thêm bên xử lý dữ liệu khách (CM, Zalo, cổng thanh toán) | Nghĩa vụ theo Luật BVDLCN 91/2025 | SEC liệt kê bên xử lý dữ liệu; chỉ gửi trường tối thiểu |

## 7. Việc tiếp theo
- **Round 1 (bước 3–4):** nhận review ARC/SEC/BE/DOM; chạy máy tính giá Beds24; đối chiếu `ChannelAdapter` với ERD/OpenAPI của ARC.
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
- Zalo ZNS: chưa tìm được bảng giá chính thức – tra lại ở Round 2
