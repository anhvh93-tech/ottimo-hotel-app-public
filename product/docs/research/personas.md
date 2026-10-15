# Persona người dùng – OTTIMO Boutique Stay

> **Mô phỏng – cần INV kiểm chứng.**
> Toàn bộ persona dưới đây do UXR (agent AI) **mô phỏng** từ: brief chủ đầu tư (`00-brief/investor-brief.md` mục 1, 5), đặc tả ngược prototype Round 0 (`product/docs/round-0-baseline.md`, gọi tắt **BL**) và hiểu biết chung về vận hành boutique stay ở Việt Nam. **Chưa có cuộc phỏng vấn hay khảo sát người thật nào.** Các câu "trích dẫn" là lời giả tưởng để minh họa, không phải phát ngôn thật. Mọi điểm cần kiểm chứng được đánh mã **H-xx** và gom ở mục 9.
>
> Người viết: UXR · Round 1 · Bước 2 (Sản xuất – Đợt 1) · 15/10/2026 · Phiên bản 0.1

---

## 0. Tóm tắt

| Mã | Persona | Nhóm | Thiết bị chính | Phân hệ dùng nhiều nhất (BL mục 3) | Mức tin cậy của mô phỏng |
|---|---|---|---|---|---|
| P1 | **Anh Quân** – Chủ đầu tư / quản lý | Nội bộ | Điện thoại (chủ yếu), laptop cuối tuần | Tổng quan, Báo cáo, duyệt FOC, Kênh OTA | Trung bình (dựa trên brief + cách INV viết prototype) |
| P2 | **Chị Thảo** – Lễ tân (kiêm sale nội bộ) | Nội bộ | Laptop tại quầy + điện thoại cá nhân (Zalo) | Lễ tân, Giấy tờ & khai báo, CRM, nhắn tin | Trung bình |
| P3 | **Chú Bảy** – Buồng phòng kiêm bảo trì | Nội bộ | Điện thoại Android tầm trung, màn ~6", 4G/Wi-Fi chập chờn | Buồng phòng, Bảo trì, minibar | **Thấp** – cần kiểm chứng sớm nhất |
| P4 | **Minh Anh** – CTV / môi giới căn hộ | Nội bộ (ngoài biên chế) | Điện thoại iPhone, Zalo | Sale & báo giá, hoa hồng | Trung bình |
| P5 | **Gia đình anh Hưng** – khách ngắn ngày nội địa (đi cùng mẹ lớn tuổi, con nhỏ) | Khách | Điện thoại, Zalo | Đặt trực tiếp, chuyển khoản, app khách | Trung bình |
| P6 | **Alexei** – khách nước ngoài thuê tháng, làm việc từ xa, nói Nga + Anh | Khách | Laptop + điện thoại, Telegram/WhatsApp | App khách (hóa đơn tháng, điện nước, yêu cầu), hợp đồng | Trung bình (brief mục 5 có dữ liệu thật về nhóm này) |
| P7 | **Ji-woo** – khách OTA ngắn ngày (Hàn Quốc, đặt qua Booking.com) | Khách | Điện thoại iPhone, KakaoTalk/email | Check-in online, mã cửa, chỉ đường, đánh giá | Trung bình |

Ghi chú về tên: tên persona là hư cấu, **không** trùng với nhân sự trong dữ liệu mẫu BL mục 2 (Chị Lan, Chị Mai, Hạnh, anh Tùng, anh Hoàng Anh, CTV Minh Anh*) để tránh nhầm với người thật. (*) "Minh Anh" trùng tên CTV mẫu trong prototype – giữ để đội dễ liên hệ với dữ liệu mẫu, nhưng là nhân vật hư cấu.

### 0.1 Ma trận persona × phân hệ (mức dùng: ●●● hằng ngày nhiều lần · ●● hằng ngày/tuần · ● thỉnh thoảng · – không dùng)

| Phân hệ | P1 Chủ | P2 Lễ tân | P3 Buồng/Bảo trì | P4 CTV | P5 Nội địa | P6 Dài hạn NN | P7 OTA |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Tổng quan | ●●● | ●● | – | – | – | – | – |
| Lễ tân (rack, nhận/trả, bill) | ● | ●●● | – | – | – | – | – |
| Giấy tờ & khai báo | ● (kiểm tra) | ●●● | – | – | ● (gửi giấy tờ) | ● (gia hạn visa) | ●● (check-in online) |
| Buồng phòng | ● | ●● | ●●● | – | – | – | – |
| Bảo trì | ● | ●● | ●●● | – | – | ● (báo hỏng) | ● |
| Kho F&B / minibar | ● | ● | ●● | – | – | – | – |
| CRM | ●● | ●● | – | ● (chỉ khách của mình) | – | – | – |
| Sale & báo giá | ●● | ●● | – | ●●● | – | – | – |
| Kênh OTA | ●● | ● | – | – | – | – | – |
| Báo cáo | ●●● | – | – | ● (hoa hồng của mình) | – | – | – |
| App khách | ● | ●● (nhận yêu cầu) | ●● (nhận việc) | – | ●● | ●●● | ●● |

Hệ quả cho thiết kế (đưa UXD, BA): bốn vai nội bộ có **thiết bị và nhịp làm việc khác hẳn nhau** → không nên dùng chung một giao diện desktop thu nhỏ (như prototype với tab dưới 9–11 mục, BL 8.3). Ít nhất cần: (a) web quầy lễ tân cho laptop, (b) giao diện điện thoại một tay cho buồng phòng/bảo trì, (c) giao diện điện thoại gọn cho chủ đầu tư và CTV, (d) app khách mobile web đa ngôn ngữ.

---

## 1. P1 – Anh Quân, chủ đầu tư / quản lý vận hành

**Mô phỏng – cần INV kiểm chứng.** (Đây là persona gần nhất với chính chủ đầu tư; INV có thể tự đối chiếu.)

| Mục | Nội dung |
|---|---|
| Hồ sơ | 35–45 tuổi, đầu tư và tự vận hành OTTIMO (10 căn, Đà Lạt). Có thể không ở Đà Lạt thường xuyên. Hiểu tài chính, tự viết prototype bằng vibe code → thoải mái với công nghệ, kỳ vọng cao về độ "xịn, mượt" |
| Thiết bị & bối cảnh | Điện thoại là chính (xem nhanh giữa các việc khác), laptop khi làm báo cáo cuối tháng, chốt giá OTA, ký hợp đồng |
| Mục tiêu | Công suất tháng 80%; giữ 4–6 căn dài hạn làm nền; tăng tỷ lệ đặt trực tiếp để tránh phí OTA 15–18%; kiểm soát thất thoát (FOC, minibar, phụ thu); yên tâm về pháp lý (khai báo lưu trú, dữ liệu giấy tờ) |
| Nhiệm vụ chính | Xem KPI ngày/tháng; xử lý mục "Cần chú ý"; duyệt FOC/giảm giá; chỉnh giá theo nhóm căn và đẩy lên kênh; theo dõi hợp đồng dài hạn sắp hết hạn, kỳ thu; xem P&L; trả lời đánh giá OTA |
| Điểm đau (giả định) | Số liệu rời rạc giữa OTA, sổ sách, Zalo; không biết nhân viên có quên khai báo trước 23:00 không; FOC "tự duyệt" (BL 8.2 #24); số liệu dashboard prototype là số cứng (BL 8.2 #28) → mất niềm tin nếu sai; phải tự nhắn tin cho khách nước ngoài bằng Google Dịch |
| Nhu cầu với app | Một màn "hôm nay có gì cần tôi" ưu tiên theo rủi ro tiền/pháp lý; số liệu **truy được nguồn** (bấm vào KPI thấy danh sách đơn); duyệt FOC bằng 1 chạm trên điện thoại kèm thông báo; báo cáo đúng công thức (DATA) |
| Hành vi công nghệ | Dùng thành thạo app ngân hàng, Airbnb host app, Booking Pulse – sẽ **so sánh** OTTIMO Desk với các app này |
| Thước đo thành công | Mở app ≤ 30 giây là biết tình hình ngày; 0 lần quá hạn khai báo; tổng FOC/tháng nằm trong hạn mức; báo cáo tháng không cần đối chiếu tay |
| Trích dẫn giả tưởng | "Tôi không cần xem hết, tôi cần biết hôm nay có gì sắp cháy." |
| Rủi ro thiết kế nếu hiểu sai | Nếu INV thực tế ngồi quầy thường xuyên → P1 và P2 gộp vai, cần chuyển vai nhanh trong cùng phiên (H-01) |

## 2. P2 – Chị Thảo, lễ tân (kiêm sale nội bộ, kiêm trực tối)

**Mô phỏng – cần INV kiểm chứng.**

| Mục | Nội dung |
|---|---|
| Hồ sơ | 24–32 tuổi, tốt nghiệp trung cấp/cao đẳng du lịch, tiếng Anh giao tiếp khá, **không nói tiếng Nga**. Với 10 căn, có thể chỉ 1–2 người lễ tân xoay ca; một người kiêm nhận đặt phòng qua Zalo, báo giá dài hạn, thu tiền, khai báo lưu trú |
| Thiết bị & bối cảnh | Laptop tại quầy; điện thoại cá nhân để nhắn Zalo/WhatsApp với khách; thường bị **ngắt quãng** (khách đến, điện thoại, nhắn tin cùng lúc). Có lúc phải rời quầy (dẫn khách lên phòng) |
| Mục tiêu | Nhận/trả phòng nhanh, không sai tiền; không quên khai báo trước 23:00; trả lời tin nhắn khách nhanh; ít phải gọi chủ đầu tư hỏi |
| Nhiệm vụ chính (theo tần suất) | Xem khách đến/đi hôm nay → nhận phòng (giấy tờ, khai báo, giao mã cửa) → trả phòng 3 bước (minibar, phụ phí, bill) → nhắc giờ trả phòng → xử lý gia hạn/trả muộn → tạo đơn trực tiếp từ Zalo → chuyển yêu cầu khách sang buồng phòng/bảo trì → soạn tin nhắn Anh/Nga |
| Điểm đau (từ brief mục 5 + BL) | Mất nước nóng, mất/nhầm thẻ phòng, đồ để quên, lịch dọn theo yêu cầu – đều đến qua chat, phải chép tay; khai báo bán tự động phải **sao chép – mở cổng BCA – dán mã** (BL 3.11); modal đóng khi lỡ bấm nền/Esc là mất dữ liệu đang nhập (heuristic HR-05); tự tính phụ thu dễ sai (BL 8.2 #1, #2) |
| Nhu cầu với app | Danh sách việc theo **giờ** trong ca; nút hành động đúng ngữ cảnh (đơn đến hôm nay → "Nhận phòng"); mẫu tin nhắn đa ngôn ngữ có biến (tên, giờ, mã cửa, số tiền); cảnh báo trước khi làm sai (đặt trùng, phòng chưa sạch, thị thực sắp hết hạn); bàn giao ca |
| Hành vi công nghệ | Quen Excel, Zalo, extranet OTA; học nhanh nếu giao diện giống thứ đã quen; ngại thao tác nhiều bước khi có khách đứng trước quầy |
| Thước đo thành công | Nhận phòng khách đã check-in online ≤ 3 phút; trả phòng ≤ 5 phút; 0 lỗi tính tiền; 100% khai báo trước 23:00 |
| Trích dẫn giả tưởng | "Khách đang đứng đây, em không có thời gian bấm 5 màn hình." |
| Biến thể cần xét | Lễ tân trực tối/ca đêm (có thể là chính chủ đầu tư hoặc người nhà) – khách đến sau 22:00 làm gấp khai báo (BL câu 15) – H-04 |

## 3. P3 – Chú Bảy, buồng phòng kiêm bảo trì

**Mô phỏng – cần INV kiểm chứng. Mức tin cậy THẤP: brief chỉ ghi "buồng phòng (anh Long?)"; đội không biết tuổi, trình độ đọc chữ, thiết bị thật.**

| Mục | Nội dung |
|---|---|
| Hồ sơ | 45–58 tuổi, người địa phương, làm buồng phòng và sửa vặt (thay bóng, kiểm nước nóng, thông tắc). Có thể có 1 người phụ dọn bán thời gian. Đọc tiếng Việt được nhưng **không thích đọc nhiều chữ**; mắt bắt đầu kém (cần chữ to); không đọc tiếng Anh |
| Thiết bị & bối cảnh | Điện thoại Android tầm trung (màn ~6", đã cũ), pin yếu; **tay ướt / đeo găng** khi dọn; Wi-Fi tầng trên có thể yếu, 4G chập chờn trong phòng; thường cầm xe đẩy, chỉ rảnh **một tay** |
| Mục tiêu | Biết phòng nào cần dọn trước (khách sắp đến), dọn xong báo nhanh, không bị gọi điện liên tục; báo hỏng có ảnh để khỏi giải thích |
| Nhiệm vụ chính | Xem việc hôm nay theo thứ tự ưu tiên → bắt đầu dọn → checklist kiểm phòng 12 điểm (BL 3.12) → đếm minibar → báo xong; nhận việc từ app khách (thêm khăn, dọn thêm); tạo/cập nhật phiếu sửa chữa, khóa phòng khi hỏng; chốt số điện nước cuối tháng |
| Điểm đau (giả định) | Prototype: thẻ buồng dùng **mã VC/VI/VD/OD** – thuật ngữ khách sạn quốc tế, người lao động địa phương có thể không quen (H-06); ô nhập số minibar nhỏ 64–96px (BL 8.3); chuyển trạng thái chỉ bằng nút nhỏ (btn.sm ~26px cao); không có ảnh; không có chế độ offline (BL câu 22) |
| Nhu cầu với app | Màn hình **một cột, nút lớn ≥ 48px**, chữ ≥ 16px, ít chữ + icon + màu **kèm nhãn**; trạng thái bằng câu thường ("Cần dọn – khách đến 14:00"); bấm-tăng/giảm cho minibar thay vì gõ số; chụp ảnh báo hỏng; **vẫn bấm "Dọn xong" được khi mất mạng** và tự gửi khi có mạng lại; đọc thông báo bằng giọng nói (khả năng sau MVP) |
| Hành vi công nghệ | Dùng Zalo (gửi ảnh, gửi voice), YouTube; ít dùng app công việc; sợ "bấm nhầm hỏng máy" → cần hoàn tác |
| Thước đo thành công | Báo "dọn xong" ≤ 2 chạm; không cần lễ tân gọi hỏi tiến độ; chấp nhận dùng app sau 1 buổi hướng dẫn ≤ 30 phút |
| Trích dẫn giả tưởng | "Cứ nói chú phòng nào trước, xong chú bấm một cái là được." |
| Rủi ro thiết kế nếu hiểu sai | Nếu thực tế buồng phòng **không dùng app** (nhắn Zalo cho lễ tân) → cần phương án lễ tân cập nhật hộ + bảng giấy in (H-05). Đây là giả thuyết rủi ro cao nhất |

## 4. P4 – Minh Anh, CTV / môi giới căn hộ

**Mô phỏng – cần INV kiểm chứng.**

| Mục | Nội dung |
|---|---|
| Hồ sơ | 26–38 tuổi, môi giới căn hộ thuê tháng/ngắn ngày ở Đà Lạt, làm cho nhiều chủ nhà cùng lúc; có nhóm Facebook/Zalo khách nước ngoài, nhiều khách Nga |
| Thiết bị & bối cảnh | iPhone, gần như 100% làm việc trên điện thoại, ngoài đường, khi đang dẫn khách xem nhà |
| Mục tiêu | Báo giá nhanh và đúng ngay tại chỗ; giữ được căn cho khách trong lúc khách cân nhắc; biết chắc hoa hồng của mình và khi nào được chi |
| Nhiệm vụ chính | Kiểm phòng trống theo khoảng ngày → công cụ báo giá dài hạn (BL 5.2) → sao chép gửi Zalo/Telegram → tạo giữ chỗ 12/24/48h → theo dõi cọc → xem hoa hồng đã chi/còn lại |
| Điểm đau (giả định) | Prototype cho vai Sale xem cả P&L và giấy tờ đã che (BL 8.2 #27) – CTV là **người ngoài**, không nên thấy; báo giá chỉ tiếng Việt khi gửi khách Nga; giữ chỗ hết hạn không tự mở lại (BL 8.2 #19) → có thể giành căn của nhau; không có thông báo khi khách đã cọc |
| Nhu cầu với app | Màn điện thoại "Căn trống + Báo giá + Giữ chỗ" trong ≤ 3 màn; báo giá xuất **EN/RU** đẹp (ảnh hoặc link) gửi được qua mọi chat; bộ đếm giờ giữ chỗ hiển thị rõ; trang "Hoa hồng của tôi" minh bạch; **chỉ thấy khách và đơn của mình** |
| Thước đo thành công | Từ lúc khách hỏi đến lúc gửi báo giá ≤ 2 phút; 0 tranh chấp hoa hồng |
| Trích dẫn giả tưởng | "Khách hỏi giá 3 tháng có dọn phòng là em phải trả lời liền, chậm là họ thuê chỗ khác." |
| Câu hỏi mở | CTV có được cấp tài khoản riêng hay gửi yêu cầu qua lễ tân? (H-08; liên quan RBAC của BA) |

## 5. P5 – Gia đình anh Hưng, khách ngắn ngày nội địa

**Mô phỏng – cần INV kiểm chứng.** (Persona này cũng đại diện khách **lớn tuổi**: mẹ anh Hưng, 68 tuổi, đi cùng.)

| Mục | Nội dung |
|---|---|
| Hồ sơ | Anh Hưng 38 tuổi, nhân viên văn phòng TP.HCM, đi Đà Lạt cuối tuần/lễ cùng vợ, con 6 tuổi và mẹ 68 tuổi. 2–3 đêm. Tìm qua Google Maps/TikTok/nhóm Facebook, rồi **nhắn Zalo hỏi trực tiếp** để có giá tốt hơn OTA |
| Thiết bị & bối cảnh | Điện thoại Android/iPhone, Zalo, app ngân hàng (chuyển khoản/VietQR quen thuộc). Mẹ dùng điện thoại chữ to, chỉ dùng Zalo gọi video |
| Mục tiêu | Giá rõ ràng, có chỗ cho trẻ nhỏ/người lớn tuổi (phòng tầng thấp? thang máy?), nhận phòng không phải chờ, có chỗ đậu xe, nước nóng ổn định (Đà Lạt lạnh) |
| Nhiệm vụ chính | Hỏi phòng trống + giá qua Zalo → nhận báo giá → chuyển cọc 30% qua QR → nhận xác nhận → gửi giấy tờ (CCCD cả nhà, giấy khai sinh của con) → nhận phòng → yêu cầu thêm chăn → trả phòng, lấy hóa đơn công ty (tùy) |
| Điểm đau (giả định) | Không biết giấy tờ trẻ em cần gì (BL 5.12 – số định danh trẻ em); ngại chụp CCCD gửi qua chat (lo lộ dữ liệu); không rõ phụ thu thêm người/trẻ em (BL câu 5); xác nhận đặt phòng chỉ là tin nhắn chat, không có "phiếu" để yên tâm; cần biết chỗ đậu xe (đánh giá mẫu: 5% phàn nàn đậu xe, BL 3.20) |
| Nhu cầu với app | Link xác nhận đơn (không cần cài app, không cần tạo tài khoản) có: ngày, căn, tiền đã cọc, còn lại, chính sách hủy, đường đi, chỗ đậu xe; gửi giấy tờ an toàn **trong link** thay vì chat; chữ to, tương phản cao, nút rõ cho người lớn tuổi |
| Thước đo thành công | Hoàn tất đặt + cọc ≤ 10 phút qua chat; không phải hỏi lại "đã nhận tiền chưa" |
| Trích dẫn giả tưởng | "Chuyển khoản xong mà không ai báo đã nhận là tôi lo lắm." |

## 6. P6 – Alexei, khách nước ngoài thuê tháng, làm việc từ xa

**Mô phỏng – cần INV kiểm chứng.** (Dựa trên brief mục 5: khách Nga nhiều, giao tiếp qua nhóm chat Anh/Nga, thuê ~10 tr/tháng, điện nước ~1,2–2 tr/tháng, dọn không bắt buộc 100k/lần.)

| Mục | Nội dung |
|---|---|
| Hồ sơ | 32 tuổi, quốc tịch Nga, lập trình viên làm từ xa cho công ty nước ngoài; ở Đà Lạt 3–6 tháng (có thể đi cùng bạn đời). Tiếng Nga là mẹ đẻ, tiếng Anh làm việc được; **không đọc tiếng Việt** |
| Thiết bị & bối cảnh | Laptop làm việc cả ngày tại phòng → **Wi-Fi là sống còn** (checklist yêu cầu ≥ 50 Mbps, BL 3.12; đánh giá mẫu 6% phàn nàn Wi-Fi); điện thoại dùng Telegram/WhatsApp; thanh toán: thẻ quốc tế có thể bị hạn chế với người Nga → thường **chuyển khoản qua người quen, tiền mặt hoặc USDT** (giả định – H-12) |
| Mục tiêu | Giá tháng minh bạch, biết trước tổng chi (thuê + điện nước + dọn); không bị tính sai điện nước; hợp đồng rõ ràng bằng ngôn ngữ đọc được; gia hạn tạm trú/visa đúng hạn; yên tĩnh, có bàn làm việc |
| Nhiệm vụ chính | Nhận báo giá dài hạn (EN/RU) → ký hợp đồng + ký quỹ → nhận phòng, gửi hộ chiếu/visa/dấu nhập cảnh → hằng tháng xem hóa đơn điện nước (ảnh công tơ), trả tiền → đặt dọn phòng 100k/lần khi cần → báo hỏng (nước nóng) → gia hạn hợp đồng → trả phòng, nhận lại ký quỹ |
| Điểm đau (từ brief + BL) | Thông báo tiếng Việt hoặc Google Dịch khó hiểu; không biết tiền điện tính thế nào (prototype app khách: chỉ số + đơn giá có hiển thị, nhưng không có ảnh công tơ); phí phạt (khử mùi thuốc lá 500k, làm lại thẻ 200k – brief mục 5) nếu không được báo rõ từ đầu sẽ gây tranh chấp; trả phòng dài hạn **không có khấu trừ/hoàn ký quỹ** (BL 8.2 #6) → lo mất cọc; visa sắp hết mà không ai nhắc (BL 5.12: ví dụ Emma) |
| Nhu cầu với app | App khách **tiếng Anh và tiếng Nga**; hóa đơn tháng có ảnh công tơ đầu/cuối kỳ; lịch dọn đặt/hủy được; nút "báo hỏng" có ảnh và theo dõi trạng thái; nhắc visa/tạm trú trước 30 ngày; biên bản trả phòng + ký quỹ minh bạch |
| Thước đo thành công | Không phải nhắn hỏi "tháng này bao nhiêu tiền"; sự cố nước nóng được xác nhận ≤ 10 phút, xử lý trong ngày; nhận lại ký quỹ đúng hạn đã cam kết |
| Trích dẫn giả tưởng | "I just need stable Wi-Fi, hot water, and a bill I can understand." |

## 7. P7 – Ji-woo, khách OTA ngắn ngày (quốc tế)

**Mô phỏng – cần INV kiểm chứng.** (Khớp khách mẫu Ji-woo trong BL 3.21: căn 203, 19–22/10, Booking.com.)

| Mục | Nội dung |
|---|---|
| Hồ sơ | 29 tuổi, Hàn Quốc, đi du lịch cùng bạn 3 đêm; đặt qua Booking.com/Agoda (đã trả trước hoặc trả tại chỗ). Tiếng Anh cơ bản, ưu tiên tiếng Hàn. Đại diện chung cho nhóm khách OTA quốc tế (Hàn, Singapore, Pháp, Đức – brief mục 1) |
| Thiết bị & bối cảnh | Điện thoại, dùng **roaming/eSIM** – có lúc mạng yếu khi vừa xuống sân bay Liên Khương; chủ yếu nhận tin qua email của OTA và tin nhắn trong app OTA; không có Zalo |
| Mục tiêu | Đến nơi nhận phòng nhanh (kể cả đến muộn, quầy không có người); biết đường đi; không bị phụ thu bất ngờ |
| Nhiệm vụ chính | Nhận link check-in online (qua email/tin nhắn OTA) → tải hộ chiếu, chọn giờ đến → nhận mã cửa sáng hôm đến → tìm đường → vào phòng → yêu cầu khăn/hỏi tour → trả phòng (để chìa trên bàn) → mời đánh giá |
| Điểm đau (giả định) | Link check-in gửi qua kênh nào? OTA che email thật của khách (email ủy quyền) → có thể không nhận được (H-10); app khách prototype **chỉ tiếng Việt** (heuristic HR-01); không rõ ai là người thật để liên hệ khi kẹt ngoài cửa lúc 23:00; tải ảnh hộ chiếu trên mạng yếu dễ lỗi |
| Nhu cầu với app | Link nhẹ, tải nhanh trên 3G; ngôn ngữ tự nhận theo trình duyệt (EN tối thiểu, KO là điểm cộng); mã cửa + hướng dẫn mở khóa có hình; nút liên hệ khẩn (WhatsApp/gọi); ảnh hộ chiếu nén trước khi gửi, có thể thử lại |
| Thước đo thành công | ≥ 60% khách OTA hoàn tất check-in online trước khi đến (chỉ số giả định để DATA theo dõi – H-11); vào phòng ≤ 5 phút từ khi đến cửa |
| Trích dẫn giả tưởng | "I arrived at 11 pm and nobody was there. Where is my code?" |

---

## 8. Yếu tố bao trùm cần xét cho mọi persona

| Yếu tố | Persona chịu ảnh hưởng mạnh | Yêu cầu tối thiểu (đưa UXD/ARC) |
|---|---|---|
| **Khiếm thị màu** (~8% nam giới) | P2, P3 (màu trạng thái buồng: xanh lá / cam / đỏ), P1 (biểu đồ) | Trạng thái không chỉ dựa vào màu: luôn có nhãn chữ + icon/hoa văn (sọc, viền đứt) – prototype mới làm được một phần (HR-11) |
| **Người lớn tuổi / thị lực kém** | P3, mẹ của P5 | Chữ thân ≥ 16px trên mobile, tương phản ≥ 4.5:1 (prototype dùng `--faint` 2.65:1 cho chữ – HR-10), vùng chạm ≥ 44×44px, hỗ trợ phóng chữ của hệ điều hành |
| **Mạng yếu / mất mạng** | P3 (trong phòng), P7 (roaming), P2 (mất điện/mạng quầy) | Buồng phòng ghi được thao tác khi offline và đồng bộ lại; link khách nhẹ; có thông báo rõ "chưa gửi được – sẽ tự gửi lại" |
| **Màn hình nhỏ** | P3, P4, P5, P7, P1 | Thiết kế mobile-first cho các luồng điện thoại; không ép room rack 14 ngày lên màn 360px – cần chế độ xem danh sách |
| **Ngôn ngữ** | P6 (RU/EN), P7 (EN/KO), P2 (soạn tin RU) | App khách VI/EN bắt buộc, RU thứ 3 (decision-log P4); mẫu tin nhắn RU cho lễ tân; tránh văn bản dịch máy cho nội dung pháp lý (hợp đồng, chính sách hủy) |
| **Ngắt quãng** | P2, P3 | Không mất dữ liệu khi đóng modal/đổi màn; nháp tự lưu; thao tác dở dang hiện lại |

---

## 9. Danh sách giả thuyết cần INV kiểm chứng với người thật

Quy ước ưu tiên: **Cao** = sai thì phải đổi kiến trúc/luồng chính, kiểm chứng **trước khi bắt đầu code Round 2**; **TB** = kiểm chứng trong Round 2; **Thấp** = trước RC (Round 3).
Cách kiểm chứng gợi ý: hỏi trực tiếp 5–10 phút/người, hoặc quan sát 1 ca làm việc. UXR sẽ soạn bộ câu hỏi chi tiết (`real-user-test-guide.md`) ở Round 2.

| Mã | Giả thuyết (đội đang tin là…) | Persona | Nếu sai thì ảnh hưởng | Kiểm chứng với ai, bằng cách nào | Tiêu chí xác nhận | Ưu tiên |
|---|---|---|---|---|---|---|
| H-01 | Chủ đầu tư chủ yếu xem app trên **điện thoại**, không ngồi quầy thường xuyên | P1 | Thiết kế dashboard sai thiết bị | INV tự trả lời | Có/Không + tỷ lệ thời gian điện thoại vs laptop | Cao |
| H-02 | Lễ tân dùng **laptop tại quầy**; có 1–2 người xoay ca; một người kiêm sale nội bộ | P2 | Ưu tiên web quầy vs mobile sai | Hỏi lễ tân hiện tại; xem quầy | Thiết bị, số người, ca | Cao |
| H-03 | Lễ tân giao tiếp khách nước ngoài chủ yếu bằng **chat (Zalo/WhatsApp/Telegram)** và cần mẫu tin RU | P2, P6 | Mẫu tin nhắn đa ngôn ngữ ưu tiên thấp/cao sai | Xem lại 1 tuần lịch sử chat (ẩn danh); đếm tin theo ngôn ngữ, theo chủ đề | ≥ 30% tin nhắn khách NN là tiếng Nga hoặc cần dịch | Cao |
| H-04 | Khách đến sau 22:00 xảy ra ≥ 1 lần/tuần; có người trực để khai báo trước 23:00 | P2, P7 | Luồng tự nhận phòng + khai báo ca tối | Đếm giờ đến thực tế tháng 9–10; hỏi INV ai trực tối | Tần suất/tuần | Cao |
| H-05 | **Buồng phòng sẽ tự dùng app trên điện thoại** (không qua lễ tân) | P3 | Cả phân hệ buồng phòng mobile có thể thành vô ích | Hỏi trực tiếp nhân viên buồng phòng; cho xem 3 màn mẫu (giấy hoặc wireframe) | Đồng ý thử + tự bấm được "dọn xong" không cần trợ giúp | **Cao** |
| H-06 | Nhân viên buồng phòng **không quen mã VC/VI/VD/OD** → cần nhãn tiếng Việt thường | P3 | Lỗi đổi trạng thái sai | Hỏi "VD nghĩa là gì?" + cho chọn giữa mã và câu | ≥ 1 người không hiểu mã → bỏ mã khỏi giao diện buồng phòng | Cao |
| H-07 | Điện thoại buồng phòng là Android tầm trung, có 4G; Wi-Fi trong một số căn yếu | P3 | Yêu cầu offline, hiệu năng | Ghi đời máy; đo sóng ở 3 phòng tầng cao | Đời máy, Android version, có/không mất sóng | TB |
| H-08 | CTV có **tài khoản riêng** trong app và chỉ thấy khách/đơn của mình | P4 | RBAC và luồng sale | INV quyết (chính sách) + hỏi 1–2 CTV có muốn dùng app không | Có/không tài khoản CTV ở MVP | Cao |
| H-09 | Khách nội địa đặt trực tiếp **chủ yếu qua Zalo** và trả cọc bằng **chuyển khoản/VietQR** | P5 | Kênh gửi link xác nhận/thanh toán | Đếm đơn trực tiếp tháng 9–10 theo kênh + phương thức trả | ≥ 70% qua Zalo + chuyển khoản | TB |
| H-10 | Có thể gửi link check-in online tới khách OTA (qua tin nhắn của OTA hoặc channel manager) và khách **mở được** | P7 | Luồng check-in online cho 60%+ khách OTA có thể không chạy | INT xác minh với channel manager + INV thử với 3–5 khách OTA thật | ≥ 3/5 khách mở link | Cao |
| H-11 | ≥ 60% khách OTA sẵn lòng check-in online (tải hộ chiếu) trước khi đến | P7 | Ước lượng tải quầy, giá trị tính năng | Thử với khách thật trong R2–R3; DATA theo dõi | Tỷ lệ hoàn tất | TB |
| H-12 | Khách Nga thuê tháng gặp khó với thanh toán thẻ quốc tế → cần chuyển khoản nội địa/tiền mặt | P6 | Lựa chọn cổng thanh toán (ESC thanh toán) | Hỏi 3–5 khách dài hạn hiện tại về cách trả tiền | Phương thức thực tế | Cao |
| H-13 | Khách dài hạn muốn xem **hóa đơn tháng + ảnh công tơ** trong app thay vì nhận tin chat | P6 | Ưu tiên app khách dài hạn | Hỏi 3–5 khách dài hạn | ≥ 3/5 muốn | TB |
| H-14 | Khách dài hạn cần app **tiếng Nga** (không chỉ tiếng Anh) | P6 | Ưu tiên RU (decision-log P4) | Hỏi khách Nga: đọc hợp đồng/hóa đơn tiếng Anh có thoải mái không | ≥ 2/3 muốn RU | TB |
| H-15 | Khách gia đình nội địa ngại gửi ảnh CCCD qua chat, sẵn lòng gửi qua link bảo mật | P5 | Luồng giấy tờ trước khi đến | Hỏi 3–5 khách nội địa | ≥ 3/5 thích link | Thấp |
| H-16 | Khách lớn tuổi / gia đình có trẻ nhỏ quan tâm tầng thấp, thang máy, chỗ đậu xe, nước nóng | P5 | Thông tin trên link xác nhận và trang đặt phòng | Xem 20 tin nhắn hỏi trước khi đặt; đánh giá OTA | Chủ đề được hỏi nhiều nhất | Thấp |
| H-17 | Sự cố phổ biến nhất là **nước nóng, thẻ phòng, đồ để quên, lịch dọn** (brief mục 5) – đủ để làm danh mục yêu cầu app khách | P2, P3, P6 | Danh mục yêu cầu (BL 5.19) | INV liệt kê sự cố 2 tháng gần nhất | Top 5 sự cố | TB |
| H-18 | Khách OTA quốc tế có thể tự vào phòng bằng **mã cửa** mà không cần lễ tân | P7 | Luồng tự nhận phòng, tích hợp khóa (INT) | INV thử 1 lần với khách thật | Khách vào được không cần gọi | TB |
| H-19 | Chủ đầu tư muốn **duyệt FOC trên điện thoại** theo thời gian thực (thay vì soát cuối tháng) | P1 | Luồng phê duyệt, thông báo | INV trả lời | Có/không, hạn mức | TB |
| H-20 | Lễ tân cần **bàn giao ca** trong app (việc dở, tiền mặt, khách chưa khai báo) | P2 | Thêm màn bàn giao ca (BL câu 13 đang dự kiến ngoài MVP) | Hỏi lễ tân hiện bàn giao thế nào | Có quy trình bàn giao hay không | Thấp |

Giả thuyết **Cao** (H-01, H-02, H-03, H-04, H-05, H-06, H-08, H-10, H-12) được đề nghị gom trong dự thảo ESC của UXR (xem `rounds/round-01/outputs/UXR/report.md`).

---

## 10. Lịch sử thay đổi
| Phiên bản | Ngày | Người | Nội dung |
|---|---|---|---|
| 0.1 | 15/10/2026 | UXR | Bản đầu, 7 persona mô phỏng + 20 giả thuyết |
