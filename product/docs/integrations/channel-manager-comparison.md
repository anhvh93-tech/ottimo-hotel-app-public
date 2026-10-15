# So sánh Channel Manager – Bản 1

- Người lập: INT (cùng ARC góp ý ở Đợt 2) | Round 1 – Bước 2 (Sản xuất, Đợt 1) | Ngày tra cứu: 15/10/2026
- Trạng thái: **Bản 1 – dự thảo**, làm căn cứ cho dự thảo ESC "Chọn channel manager" (xem `product/docs/integrations.md` mục 5)
- Đầu vào: brief mục 1, 7 (INV muốn kết nối **toàn bộ** OTA: Airbnb, Booking.com, Agoda, Expedia, Trip.com, Traveloka); BL 3.19, 4.18, 5.11, 5.21, 7

> Quy ước: **[Nguồn]** = đã thấy trên trang chính thức của hãng ngày 15/10/2026; **[Bên thứ ba]** = số liệu từ trang review, chưa đối chiếu với hãng; **[Chưa xác minh]** = suy luận hoặc chưa tìm được nguồn, phải hỏi báo giá. Tỉ giá tạm tính: 1 EUR ≈ 30.500 đ, 1 USD ≈ 26.200 đ (USD lấy theo BL mục 7) – [GIẢ ĐỊNH].

## 1. Yêu cầu bắt buộc của OTTIMO với channel manager (CM)

Đặt ra trước khi so sánh, vì OTTIMO **không** mua CM để dùng thay app – app OTTIMO là **nguồn dữ liệu chính** (BL 5.21):

| # | Yêu cầu | Vì sao |
|---|---|---|
| Y1 | Kết nối 2 chiều (giá, phòng trống, đặt phòng) với cả 6 OTA, **gồm Airbnb và Traveloka** | Brief mục 7. Airbnb chỉ mở API cho đối tác, không cho chủ nhà nhỏ kết nối thẳng (BL 3.19); prototype đã ghi "không dùng iCal" |
| Y2 | Có **API công khai cho hệ thống riêng (PMS bên ngoài)**: đẩy giá/phòng trống, nhận đơn qua webhook | Không có API thì app OTTIMO không thể là nguồn dữ liệu chính; nhân viên sẽ phải nhập 2 nơi → đặt trùng |
| Y3 | Chi phí phù hợp quy mô 10 căn | Ngân sách hạ tầng ≤ 1 tr/tháng **chưa gồm** phí CM → phí CM là **chi phí riêng**, INV duyệt riêng (ESC-009) |
| Y4 | Hỗ trợ tiếng Việt / múi giờ VN / VND | Nhân viên vận hành là người Việt |
| Y5 | Không ràng buộc hợp đồng dài, có môi trường thử (sandbox/test) | Round 2 cần thử trước khi bật thật |

## 2. Bảng so sánh

| Tiêu chí | **A. Beds24** | **B. ezCloud (ezCms)** | **C. Channex.io** | **D. Cloudbeds** (tham khảo) |
|---|---|---|---|---|
| Bản chất | PMS + CM, nhưng mở API cho hệ thống ngoài | PMS Việt Nam (ezCloudhotel) + CM (ezCms) đi kèm | CM "API-first" dành cho bên làm PMS/booking engine | PMS + CM trọn gói (quốc tế) |
| **Airbnb** | Có – tự giới thiệu là "Airbnb preferred partner" [Nguồn: beds24.com/airbnb-channel-manager.html] | **Chưa xác nhận** – trang chủ chỉ có logo Booking.com, Agoda, Trip.com, "200+ OTA" [Nguồn: ezcloud.vn] | Có [Nguồn: channex.io/pricing] | Có [Chưa xác minh] |
| **Booking.com** | Có [Nguồn] | Có (logo đối tác) [Nguồn] | Có [Nguồn] | Có [Chưa xác minh] |
| **Agoda** | Có (cả Agoda Homes) [Nguồn] | Có (logo đối tác) [Nguồn] | Có [Nguồn] | Có [Chưa xác minh] |
| **Expedia** | Có [Nguồn] | **Chưa xác nhận** | Có [Nguồn] | Có [Chưa xác minh] |
| **Trip.com** | Có [Nguồn] | Có (logo đối tác) [Nguồn] | Có (ghi "Ctrip") [Nguồn] | Có [Chưa xác minh] |
| **Traveloka** | Có [Nguồn: beds24.com/channel-manager.html] | **Chưa xác nhận** | **Không thấy trong danh sách** – phải hỏi [Nguồn] | Có – có hướng dẫn kết nối Traveloka [Nguồn: myfrontdesk.cloudbeds.com] |
| Đủ 6/6 OTA của OTTIMO? | **6/6 xác nhận** | 3/6 xác nhận, 3 chưa rõ | 5/6, thiếu Traveloka | 6/6 (chưa đối chiếu hết) |
| **API cho hệ thống riêng** | **Có – API V2** (REST, token + refresh token; đặt phòng, lịch giá/phòng trống `/inventory/rooms/calendar`, webhook đặt phòng và webhook tồn) [Nguồn: wiki.beds24.com Category:API_V2]. Giới hạn 100 "credit"/5 phút, nâng lên 200 mất €10/tháng | **Không tìm thấy API công khai**. Chỉ có bằng chứng ezCloud tích hợp với CM khác (eRevMax) [Nguồn: hospitalitytech.com]. Mô hình chính: dùng PMS của ezCloud | **Có – trọng tâm sản phẩm**: API đầy đủ, Mapping API, sandbox miễn phí `staging.channex.io` [Nguồn: channex.io/pricing] | Có REST + GraphQL + webhook, môi trường staging [Nguồn: developers.cloudbeds.com]; nhưng có nguồn nói API **không có ở mọi gói** [Bên thứ ba] |
| Sandbox / thử | Dùng thử tài khoản; API thử trên tài khoản thật (chưa thấy sandbox tách riêng) [Chưa xác minh] | Dùng thử 7 ngày miễn phí [Nguồn: ezcloud.vn] | Staging miễn phí, không cần thẻ [Nguồn] | Staging cho đối tác [Nguồn] |
| **Giá/tháng cho 10 căn** | Ước **€30–75 ≈ 0,9–2,3 tr đ** [Bên thứ ba + tính toán, xem 3.1]. Không hoa hồng theo đơn, không hợp đồng [Nguồn: beds24.com/pricing.html] | Ước **~0,5–1 tr đ** nếu 48.000 đ/phòng/tháng tính tối thiểu 20 phòng cho ezCms [Chưa xác minh – trang báo giá không ghi rõ đơn vị, xem 3.2] | **≥ $137 ≈ 3,6 tr đ** (phí nền tảng từ $130 + $7/khách sạn) [Nguồn: channex.io/pricing] | **~$108–200+ ≈ 2,8–5,2 tr đ**, báo giá theo từng cơ sở [Bên thứ ba] |
| Hỗ trợ tiếng Việt | **Không** (giao diện + wiki tiếng Anh, hỗ trợ qua ticket) [Chưa xác minh giao diện tiếng Việt] | **Có** – công ty Việt Nam, hỗ trợ tại chỗ | Không | Không rõ |
| Đồng bộ giá | Có, 2 chiều [Nguồn] | Có (gói Nâng cao ghi "đồng bộ phòng trống, giá, đặt phòng") [Nguồn: ezcloud.vn/bang-bao-gia…] | Có [Nguồn] | Có |
| Đồng bộ phòng trống | Có [Nguồn] | Có [Nguồn] | Có [Nguồn] | Có |
| Nhận đặt phòng về hệ thống riêng | Có, qua webhook + `GET /bookings` [Nguồn] | Chỉ trong PMS ezCloud; sang app OTTIMO **chưa có đường** | Có, qua webhook/API [Nguồn] | Có, nhưng app OTTIMO phải "đứng sau" Cloudbeds |
| Ràng buộc | Không hợp đồng [Nguồn] | Chưa rõ | Không hợp đồng, báo trước 30 ngày [Nguồn] | Thường theo hợp đồng năm [Chưa xác minh] |

## 3. Ghi chú tính giá

### 3.1 Beds24
- Trang chính thức: "from €15.50/month", phí kênh **€0.55/tháng cho mỗi "link"** (1 link = 1 loại phòng × 1 kênh), không hoa hồng, không hợp đồng; người dùng thêm €2/tháng; SMS €0.10/tin [Nguồn: beds24.com/pricing.html, tra 15/10/2026]. Phí theo số căn chỉ có trong máy tính giá, **không công bố** trên trang.
- Số link ước tính: 5 OTA (Booking, Agoda, Expedia, Trip.com, Traveloka) × 3 nhóm căn = 15 link; Airbnb thường đăng **từng căn** = 10 link → ~25 link × €0,55 ≈ **€14/tháng**.
- Phí nền theo số căn: trang review ghi các mức €38/tháng cho 6–15 căn, hoặc công thức €15,90 + căn × kênh × €0,55 (10 căn × 6 kênh ≈ €49) [Bên thứ ba: roommaster.com, comparatifchannelmanager.fr]. → Khoảng **€30–75/tháng**. **Phải chạy máy tính giá trên beds24.com trước khi trình ESC chốt.**

### 3.2 ezCloud
- Trang báo giá có 3 gói: Cơ bản 18.000 đ ("1 phòng/1 tháng", dưới 10 phòng tính 10); Nâng cao 48.000 đ (có ezCms, **ezCms dưới 20 phòng tính 20**); Cao cấp 66.000 đ (thêm booking engine, Google Hotels) [Nguồn: ezcloud.vn/bang-bao-gia-phan-mem-khach-san]. Trang không ghi danh sách OTA cụ thể, không ghi rõ gói Nâng cao/Cao cấp tính theo phòng.
- Nếu là 48.000 đ × 20 phòng = **960.000 đ/tháng** (chưa VAT) – [Chưa xác minh]. Chưa rõ có phí kết nối riêng từng OTA hay phí khởi tạo.

### 3.3 Channex
- Phí nền tảng từ $130/tháng + $7/khách sạn (hoặc $0,5/căn nếu là nhà cho thuê ngắn ngày); không phí khởi tạo, không tối thiểu số cơ sở [Nguồn]. Định giá cho **nhà phát triển PMS** phục vụ nhiều khách sạn – với 1 cơ sở thì đắt nhất.

### 3.4 Ước tính tải API Beds24 (ARC-09) – sửa Round 1 Bước 4
- Căn cứ [Nguồn: wiki.beds24.com API_V2.0]: hạn mức mặc định **100 credit / 5 phút / tài khoản** (mọi token cùng tài khoản dùng chung); nâng 200 credit mất €10/tháng; **chi phí mỗi lời gọi thay đổi theo độ phức tạp**, đọc từ header `x-request-cost`, `x-five-min-limit-remaining`, `x-five-min-limit-resets-in`. Tài liệu không công bố bảng giá credit cố định → các con số dưới là **[GIẢ ĐỊNH: ~1–2 credit/lời gọi đơn giản]**, đo lại bằng header ở R2.
- Thiết kế adapter: đẩy theo **khoảng ngày** (một lời gọi lịch mang nhiều căn × khoảng ngày), outbox **gộp thay đổi trong cửa sổ 10–30 giây**, luôn giữ **≥ 20% hạn mức** cho việc kéo đơn sau webhook; hết hạn mức → `RATE_LIMITED` với `retryAfterMs` từ header.

| Tình huống | Số lời gọi ước | Credit ước | So với 100/5 phút |
|---|---|---|---|
| (a) Một thay đổi đơn lẻ (đặt/hủy/đổi ngày 1 căn) | 1 đẩy tồn (+1 đẩy giá/hạn chế nếu có) | 1–4 | Không đáng kể |
| (b) Đối soát đêm 10 căn × 365 ngày | Đọc lịch theo căn hoặc theo cả cơ sở: 1–10 lời gọi; sửa lệch theo lô | ≤ 20 (+ sửa lệch) | Chạy 02:00–04:00, chia nhiều cửa sổ 5 phút nếu cần |
| (c) Đỉnh 10 thay đổi / 5 phút + 10 webhook | Sau gộp: ≤ 10 lời gọi đẩy + 10 lời gọi `GET /bookings` | ≤ 40 | Còn dư ≥ 60% |
- Kết luận tạm: 100 credit/5 phút đủ cho 10 căn với thiết kế gộp lô; không cần gói 200 credit ở MVP. Kiểm lại bằng số đo thật ở R2 (thêm vào `integration_log` cột chi phí credit).

## 4. Nhận định

1. **Beds24 là phương án duy nhất đã xác nhận đủ cả 6 OTA + có API công khai cho hệ thống riêng**, và rẻ nhất trong nhóm có API. Nhược điểm chính: không hỗ trợ tiếng Việt, giao diện cấu hình phức tạp (đội INT làm phần ghép phòng/kênh một lần, nhân viên không phải vào Beds24 hằng ngày); giới hạn 100 credit/5 phút đủ cho 10 căn nếu đẩy theo lô (ARC/INT thiết kế hàng đợi).
2. **ezCloud** (ARC: chỉ chấp nhận khi có văn bản xác nhận API 2 chiều; nếu phải dùng PMS ezCloud song song → nguy cơ đặt trùng) rẻ và có hỗ trợ tiếng Việt, nhưng **chưa thấy API cho hệ thống ngoài** và chưa xác nhận Airbnb/Expedia/Traveloka. Nếu chọn ezCloud, gần như phải dùng **PMS của ezCloud** song song với app OTTIMO → nhập 2 nơi, mâu thuẫn mục tiêu "all-in-one" (brief mục 2). Chỉ nên chọn nếu ezCloud xác nhận bằng văn bản: (a) có API đối tác 2 chiều, (b) kết nối Airbnb + Traveloka + Expedia.
3. **Channex** về kỹ thuật phù hợp nhất (sandbox tốt, API là sản phẩm chính) nhưng ~3,6 tr/tháng cho 1 cơ sở và thiếu Traveloka → dự phòng khi OTTIMO mở nhiều cơ sở.
4. **Cloudbeds**: đắt, và là một PMS trọn gói – trùng chức năng với app đang làm. Chỉ để tham chiếu.

**Đề xuất bản 1 của INT: Beds24** (phương án A). Dự phòng: Channex (nếu Beds24 không đạt khi thử Round 2); ezCloud chỉ khi có xác nhận API.

## 5. Việc cần làm trước khi chốt (Round 1 bước 4 hoặc đầu Round 2, không cần tài khoản thật)
- [ ] Chạy máy tính giá Beds24 với cấu hình 10 căn / 3 loại phòng / 6 kênh → thay khoảng ước tính bằng số chính xác.
- [ ] Gửi câu hỏi (qua form công khai, **INV gửi** hoặc INV cho phép) tới ezCloud: API đối tác, danh sách OTA, giá ezCms cho 10 căn.
- [ ] Hỏi Channex về Traveloka.
- [x] ARC review: hợp đồng adapter `ChannelAdapter` – đã sửa theo ARC-INT-01…04, 09 (README v0.2 mục 3.1).
- [x] DOM review: quy tắc khi OTA và đặt trực tiếp xung đột – đã ghi `integrations.md` mục 3.1.1.
- [x] Beds24 không ký webhook [Nguồn] → mẫu "webhook = tín hiệu, kéo lại qua API"; quyền xem thẻ phải liên hệ Beds24 mới bật → **không yêu cầu**.
- [ ] R2: đo `x-request-cost` thật; kiểm Beds24 hỗ trợ CTA/CTD/min-stay theo kênh, báo no-show qua API, kênh nào nhận tin nhắn qua `POST /bookings/messages`.

## 6. Nguồn (tra ngày 15/10/2026)
- Beds24 – bảng giá: https://beds24.com/pricing.html
- Beds24 – danh sách kênh: https://beds24.com/channel-manager.html
- Beds24 – Airbnb: https://beds24.com/airbnb-channel-manager.html
- Beds24 – API V2: https://wiki.beds24.com/index.php/Category:API_V2 ; API V2.0 (credit, webhook, tin nhắn, quyền thẻ): https://wiki.beds24.com/index.php/API_V2.0
- Beds24 giá (bên thứ ba): https://www.roommaster.com/blog/beds24-pricing ; https://comparatifchannelmanager.fr/?p=6009
- ezCloud – trang chủ: https://ezcloud.vn/ ; báo giá: https://ezcloud.vn/bang-bao-gia-phan-mem-khach-san
- ezCloud × eRevMax: https://hospitalitytech.com/erevmax-completes-integration-vietnamese-pms-ezcloud
- Channex – bảng giá: https://channex.io/pricing
- Cloudbeds – API: https://developers.cloudbeds.com/docs ; Traveloka: https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360011826673-Connect-Traveloka-to-Cloudbeds-PMS ; giá (bên thứ ba): https://www.roommaster.com/blog/cloudbeds-pricing
