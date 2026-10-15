# Persona người dùng – OTTIMO Boutique Stay

> **Mô phỏng – cần INV kiểm chứng.**
> Toàn bộ persona dưới đây do UXR (agent AI) **mô phỏng** từ: brief chủ đầu tư (`00-brief/investor-brief.md` mục 1, 5), đặc tả ngược prototype Round 0 (`product/docs/round-0-baseline.md`, gọi tắt **BL**) và hiểu biết chung về vận hành boutique stay ở Việt Nam. **Chưa có cuộc phỏng vấn hay khảo sát người thật nào.** Các câu "trích dẫn" là lời giả tưởng để minh họa, không phải phát ngôn thật. Mọi điểm cần kiểm chứng được đánh mã **H-xx** và gom ở mục 9.
>
> Người viết: UXR · Round 1 · Bước 2 (Sản xuất – Đợt 1) · 15/10/2026 · Phiên bản 0.2 (Bước 4 – sửa theo review UXD, PO, DOM; xem mục 10)
>
> **Số quy tắc** (hạn khai báo, nhắc thị thực, phí phạt…) **không ghi lại trong persona** mà tham chiếu `product/docs/business-rules.md` (BR-xxx); **đích chỉ số** tham chiếu PRD mục 3 (S1–S12). Số trong persona chỉ là giả thuyết của UXR và được ghi rõ như vậy.

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

### 0.2 Ánh xạ persona ↔ nhóm người dùng PRD ↔ mã vai RBAC ↔ người trong dữ liệu mẫu BL

| Persona | Nhóm PRD (mục 4) | Mã vai RBAC (`rbac-matrix.md` mục 1) | Người trong BL mục 2 | Ghi chú |
|---|---|---|---|---|
| P1 Anh Quân | U1 | `owner` | Chủ đầu tư | Biến thể **Quản lý** (`manager`, anh Hoàng Anh) ghi trong P1 – người duyệt FOC/hoàn tiền |
| P2 Chị Thảo | U2 | `front_desk`, `front_desk_lead` (gồm người trực đêm) | Lễ tân Hạnh (lễ tân trưởng) | Phần "kiêm sale" thuộc `sales_staff` (U4) nếu có NV sale riêng |
| P3 Chú Bảy | U3 | `housekeeping` + `maintenance` (một người kiêm) | Chị Lan, chị Mai (buồng phòng); anh Tùng (kỹ thuật) | Biến thể A trong P3: tách vai 2 + 1 người (H-21) |
| P4 Minh Anh | U4 | `collaborator` (CTV); `sales_staff` cho sale nội bộ | CTV Minh Anh; NV Hạnh (sale) | – |
| P5 Gia đình anh Hưng | U5 (a) | `guest` (link của đơn) | Huy (khách mẫu) | Đại diện cả khách lớn tuổi |
| P6 Alexei | U5 (c) | `guest` | Daniel, Emma | – |
| P7 Ji-woo | U5 (b) | `guest` | Ji-woo | – |

### 0.3 Bề mặt giao diện → persona chính / phụ (dùng khi phải đánh đổi)

| Bề mặt | Persona chính (ưu tiên khi xung đột) | Persona phụ | Ràng buộc quyết định |
|---|---|---|---|
| Web quầy (rack, nhận/trả, bill, khai báo) | P2 | P1/quản lý | Giả định laptop tối thiểu 1366×768 (H-02); mật độ thông tin theo P2 |
| Điện thoại nội bộ – buồng phòng/bảo trì (L6) | P3 | – | Nút ≥ 48px, chữ ≥ 16px, một tay, offline |
| Điện thoại nội bộ – tổng quan, duyệt (L8) | P1 (và quản lý) | P2 | Đọc nhanh ≤ 30 giây, không cần chuột |
| Điện thoại nội bộ – sale/báo giá (L5) | P4 | P2 | ≤ 3 màn từ căn trống tới gửi báo giá |
| App khách (L7) | P7 về **tốc độ/mạng yếu**; P5 (người lớn tuổi) về **khả năng đọc** | P6 | Khi xung đột: giữ chữ to và tương phản (P5) nhưng trang nhẹ, ít ảnh nặng (P7); P6 cần thêm hóa đơn tháng |

---

## 1. P1 – Anh Quân, chủ đầu tư / quản lý vận hành

**Mô phỏng – cần INV kiểm chứng.** (Đây là persona gần nhất với chính chủ đầu tư; INV có thể tự đối chiếu.)

| Mục | Nội dung |
|---|---|
| Hồ sơ | 35–45 tuổi, đầu tư và tự vận hành OTTIMO (10 căn, Đà Lạt). Có thể không ở Đà Lạt thường xuyên. Hiểu tài chính, tự viết prototype bằng vibe code → thoải mái với công nghệ, kỳ vọng cao về độ "xịn, mượt" |
| Thiết bị & bối cảnh | Điện thoại là chính (xem nhanh giữa các việc khác), laptop khi làm báo cáo cuối tháng, chốt giá OTA, ký hợp đồng |
| Mục tiêu | Công suất tháng 80%; giữ 4–6 căn dài hạn làm nền; tăng tỷ lệ đặt trực tiếp để tránh phí OTA 15–18%; kiểm soát thất thoát (FOC, minibar, phụ thu); yên tâm về pháp lý (khai báo lưu trú, dữ liệu giấy tờ) |
| Nhiệm vụ chính | Xem KPI ngày/tháng; xử lý mục "Cần chú ý"; duyệt FOC/giảm giá; chỉnh giá theo nhóm căn và đẩy lên kênh; theo dõi hợp đồng dài hạn sắp hết hạn, kỳ thu; xem P&L; trả lời đánh giá OTA |
| Điểm đau (giả định) | Số liệu rời rạc giữa OTA, sổ sách, Zalo; không biết nhân viên có khai báo lưu trú **đúng hạn** không (khách VN: trước 23:00 – BR-602; khách nước ngoài: trong 12 giờ kể từ giờ đến – BR-603, nên khách NN đến 08:00 có hạn 20:00); FOC "tự duyệt" (BL 8.2 #24); số liệu dashboard prototype là số cứng (BL 8.2 #28) → mất niềm tin nếu sai; phải tự nhắn tin cho khách nước ngoài bằng Google Dịch |
| Nhu cầu với app | Một màn "hôm nay có gì cần tôi" ưu tiên theo rủi ro tiền/pháp lý; số liệu **truy được nguồn** (bấm vào KPI thấy danh sách đơn); duyệt FOC bằng 1 chạm trên điện thoại kèm thông báo; báo cáo đúng công thức (DATA) |
| Hành vi công nghệ | Dùng thành thạo app ngân hàng, Airbnb host app, Booking Pulse – sẽ **so sánh** OTTIMO Desk với các app này |
| Thước đo thành công | Mở app ≤ 30 giây là biết tình hình ngày; 0 lần quá hạn khai báo (hạn theo BR-602/603; đích PRD S2); tổng FOC/tháng nằm trong hạn mức; báo cáo tháng không cần đối chiếu tay |
| Trích dẫn giả tưởng | "Tôi không cần xem hết, tôi cần biết hôm nay có gì sắp cháy." |
| Rủi ro thiết kế nếu hiểu sai | Nếu INV thực tế ngồi quầy thường xuyên → P1 và P2 gộp vai, cần chuyển vai nhanh trong cùng phiên (H-01) |
| Biến thể: Quản lý (`manager`, anh Hoàng Anh trong BL) | Có mặt tại cơ sở nhiều hơn chủ đầu tư; là người **duyệt** FOC/giảm giá theo hạn mức (BR-432, 433), hoàn tiền, khôi phục no-show; dùng laptop + điện thoại. Cần: hàng đợi "chờ tôi duyệt" trên điện thoại có số tiền, lý do, người đề nghị; duyệt bằng PIN của chính mình. Có thể bị giới hạn xem P&L (PRD A4). Nếu chủ đầu tư không ở Đà Lạt thì quản lý là người dùng chính của L8 hằng ngày |

## 2. P2 – Chị Thảo, lễ tân (kiêm sale nội bộ, kiêm trực tối)

**Mô phỏng – cần INV kiểm chứng.**

| Mục | Nội dung |
|---|---|
| Hồ sơ | 24–32 tuổi, tốt nghiệp trung cấp/cao đẳng du lịch, tiếng Anh giao tiếp khá, **không nói tiếng Nga**. Với 10 căn, có thể chỉ 1–2 người lễ tân xoay ca; một người kiêm nhận đặt phòng qua Zalo, báo giá dài hạn, thu tiền, khai báo lưu trú |
| Thiết bị & bối cảnh | Laptop tại quầy (giả định màn tối thiểu **1366×768** – quyết định room rack hiện được bao nhiêu ngày; kiểm chứng trong H-02); điện thoại cá nhân để nhắn Zalo/WhatsApp với khách; thường bị **ngắt quãng** (khách đến, điện thoại, nhắn tin cùng lúc). Có lúc phải rời quầy (dẫn khách lên phòng) |
| Mục tiêu | Nhận/trả phòng nhanh, không sai tiền; khai báo lưu trú **trước hạn** – khách VN 23:00 (BR-602), khách nước ngoài giờ đến + 12 giờ (BR-603), nên cần nhớ hạn **theo từng khách**, không theo một mốc chung; trả lời tin nhắn khách nhanh; ít phải gọi chủ đầu tư hỏi |
| Nhiệm vụ chính (theo tần suất) | Xem khách đến/đi hôm nay → nhận phòng (giấy tờ, khai báo, giao mã cửa) → trả phòng 3 bước (minibar, phụ phí, bill) → nhắc giờ trả phòng → xử lý gia hạn/trả muộn → tạo đơn trực tiếp từ Zalo → chuyển yêu cầu khách sang buồng phòng/bảo trì → soạn tin nhắn Anh/Nga |
| Điểm đau (từ brief mục 5 + BL) | Mất nước nóng, mất/nhầm thẻ phòng, đồ để quên, lịch dọn theo yêu cầu – đều đến qua chat, phải chép tay; khai báo bán tự động phải **sao chép – mở cổng BCA – dán mã** (BL 3.11); modal đóng khi lỡ bấm nền/Esc là mất dữ liệu đang nhập (heuristic HR-05); tự tính phụ thu dễ sai (BL 8.2 #1, #2) |
| Nhu cầu với app | Danh sách việc theo **giờ** trong ca; nút hành động đúng ngữ cảnh (đơn đến hôm nay → "Nhận phòng"); mẫu tin nhắn đa ngôn ngữ có biến (tên, giờ, mã cửa, số tiền); cảnh báo trước khi làm sai (đặt trùng, phòng chưa sạch, thị thực sắp hết hạn); bàn giao ca |
| Hành vi công nghệ | Quen Excel, Zalo, extranet OTA; học nhanh nếu giao diện giống thứ đã quen; ngại thao tác nhiều bước khi có khách đứng trước quầy |
| Thước đo thành công | Nhận phòng khách đã check-in online ≤ 3 phút (PRD S4); trả phòng ≤ 5 phút (S3); 0 lỗi tính tiền; 100% khai báo **đúng hạn** (S2) |
| Trích dẫn giả tưởng | "Khách đang đứng đây, em không có thời gian bấm 5 màn hình." |
| Biến thể cần xét | (a) Lễ tân trực tối/ca đêm (có thể là chính chủ đầu tư hoặc người nhà) – khách đến khuya phải khai báo kịp hạn; theo phân xử ORC người trực dùng **thiết bị của cơ sở**; ai trực tối hỏi ở ESC-010 (H-04). (b) Lễ tân **không kiêm sale**: RBAC tách `sales_staff`; nếu thực tế có NV sale riêng thì phần báo giá chuyển sang P4/U4 |

## 3. P3 – Chú Bảy, buồng phòng kiêm bảo trì

**Mô phỏng – cần INV kiểm chứng. Mức tin cậy THẤP: brief chỉ ghi "buồng phòng (anh Long?)"; đội không biết tuổi, trình độ đọc chữ, thiết bị thật.**

| Mục | Nội dung |
|---|---|
| Hồ sơ | 45–58 tuổi, người địa phương, làm buồng phòng và sửa vặt (thay bóng, kiểm nước nóng, thông tắc). Có thể có 1 người phụ dọn bán thời gian. Đọc tiếng Việt được nhưng **không thích đọc nhiều chữ**; mắt bắt đầu kém (cần chữ to); không đọc tiếng Anh |
| Thiết bị & bối cảnh | Điện thoại Android tầm trung (màn ~6", đã cũ), pin yếu; **tay ướt / đeo găng** khi dọn; Wi-Fi tầng trên có thể yếu, 4G chập chờn trong phòng; thường cầm xe đẩy, chỉ rảnh **một tay** |
| Mục tiêu | Biết phòng nào cần dọn trước (khách sắp đến), dọn xong báo nhanh, không bị gọi điện liên tục; báo hỏng có ảnh để khỏi giải thích |
| Nhiệm vụ chính | Xem việc hôm nay theo thứ tự ưu tiên → bắt đầu dọn → checklist kiểm phòng 12 điểm (BL 3.12) → đếm minibar → báo xong; nhận việc từ app khách (thêm khăn, dọn thêm); tạo/cập nhật phiếu sửa chữa, khóa phòng khi hỏng; chốt số điện nước cuối tháng |
| Điểm đau (giả định) | Prototype: thẻ buồng dùng **mã VC/VI/VD/OD** – thuật ngữ khách sạn quốc tế, người lao động địa phương có thể không quen (H-06 – đã xử lý bằng thiết kế: giao diện buồng phòng dùng câu thường, mã chỉ ở giao diện quản lý); ô nhập số minibar nhỏ 64–96px (BL 8.3); chuyển trạng thái chỉ bằng nút nhỏ (btn.sm ~26px cao); không có ảnh; không có chế độ offline (BL câu 22) |
| Nhu cầu với app | Màn hình **một cột, nút lớn ≥ 48px**, chữ ≥ 16px, ít chữ + icon + màu **kèm nhãn**; trạng thái bằng câu thường ("Cần dọn – khách đến 14:00"); bấm-tăng/giảm cho minibar thay vì gõ số; chụp ảnh báo hỏng; **vẫn bấm "Dọn xong" được khi mất mạng** và tự gửi khi có mạng lại; đọc thông báo bằng giọng nói (khả năng sau MVP) |
| Hành vi công nghệ | Dùng Zalo (gửi ảnh, gửi voice), YouTube; ít dùng app công việc; sợ "bấm nhầm hỏng máy" → cần hoàn tác |
| Thước đo thành công | Báo "dọn xong" ≤ 2 chạm; không cần lễ tân gọi hỏi tiến độ; chấp nhận dùng app sau 1 buổi hướng dẫn ≤ 30 phút |
| Trích dẫn giả tưởng | "Cứ nói chú phòng nào trước, xong chú bấm một cái là được." |
| Rủi ro thiết kế nếu hiểu sai | Nếu thực tế buồng phòng **không dùng app** (nhắn Zalo cho lễ tân) → cần phương án lễ tân cập nhật hộ + bảng giấy in (H-05, có luật quyết định ở mục 9). Đây là giả thuyết rủi ro cao nhất |
| Biến thể A – tách vai (theo BL và RBAC) | 2 nhân viên buồng phòng (chị Lan, chị Mai – `housekeeping`) và 1 kỹ thuật (anh Tùng – `maintenance`) là **người khác nhau** (H-21). Khi đó điểm dễ rơi việc là **chuyển giao giữa hai người**: buồng phòng phát hiện hỏng → báo kỹ thuật → kỹ thuật báo xong → buồng phòng dọn lại → kiểm phòng. Căn dễ bị kẹt ở trạng thái khóa/chờ dọn lâu hơn cần thiết → mất đêm bán. Cần: thông báo "Căn X sửa xong – cần dọn lại" tới buồng phòng, thấy giờ khách đến tiếp theo |
| Biến thể B – nhân viên trẻ 25–35 tuổi, dùng smartphone thành thạo | Yêu cầu nút lớn ≥ 48px, chữ ≥ 16px, offline **vẫn giữ** (tay ướt, một tay, mạng yếu không phụ thuộc tuổi); đọc giọng nói, hướng dẫn chi tiết từng bước **hạ ưu tiên**. Tuổi và kinh nghiệm smartphone được ghi trong buổi thử H-05 |

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
| Câu hỏi mở | RBAC đã giả định CTV có tài khoản riêng (`collaborator`) và chỉ thấy khách/đơn của mình (decision-log). H-08 chỉ còn là **xác nhận có/không** của INV |

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
| Thiết bị & bối cảnh | Laptop làm việc cả ngày tại phòng → **Wi-Fi là sống còn** (checklist yêu cầu ≥ 50 Mbps, BL 3.12; đánh giá mẫu 6% phàn nàn Wi-Fi); điện thoại dùng Telegram/WhatsApp; thanh toán: thẻ do ngân hàng Nga phát hành gần như không dùng được ở nước ngoài từ 2022 (thông tin công khai) → thường trả **tiền mặt (USD/VND) hoặc chuyển khoản qua người thân/bạn tại VN**, đôi khi qua ngân hàng/ví ở nước thứ ba (cần kiểm chứng cách trả thực tế – H-12). **OTTIMO không nhận tiền mã hóa** (không phải phương tiện thanh toán hợp pháp tại VN); PRD X9: chỉ thu VND |
| Mục tiêu | Giá tháng minh bạch, biết trước tổng chi (thuê + điện nước + dọn); không bị tính sai điện nước; hợp đồng rõ ràng bằng ngôn ngữ đọc được; gia hạn tạm trú/visa đúng hạn; yên tĩnh, có bàn làm việc |
| Nhiệm vụ chính | Nhận báo giá dài hạn (EN/RU) → ký hợp đồng + ký quỹ → nhận phòng, gửi hộ chiếu/visa/dấu nhập cảnh → hằng tháng xem hóa đơn điện nước (ảnh công tơ), trả tiền → đặt dọn phòng 100k/lần khi cần → báo hỏng (nước nóng) → gia hạn hợp đồng → trả phòng, nhận lại ký quỹ |
| Điểm đau (từ brief + BL) | Thông báo tiếng Việt hoặc Google Dịch khó hiểu; không biết tiền điện tính thế nào (prototype app khách: chỉ số + đơn giá có hiển thị, nhưng không có ảnh công tơ); phí phạt (khử mùi thuốc lá 500k, làm lại thẻ 200k – brief mục 5) nếu không được báo rõ từ đầu sẽ gây tranh chấp; trả phòng dài hạn **không có khấu trừ/hoàn ký quỹ** (BL 8.2 #6) → lo mất cọc; visa sắp hết mà không ai nhắc (BL 5.12: ví dụ Emma) |
| Nhu cầu với app | App khách **tiếng Anh và tiếng Nga**; hóa đơn tháng có ảnh công tơ đầu/cuối kỳ; lịch dọn đặt/hủy được; nút "báo hỏng" có ảnh và theo dõi trạng thái; nhắc gia hạn thị thực/tạm trú theo BR-605 (tham số `visa_expiry_warning_days`; DOM đang đề xuất 30 ngày cho khách dài hạn, 14 ngày cho khách ngắn ngày); biên bản trả phòng + ký quỹ minh bạch |
| Thước đo thành công | Không phải nhắn hỏi "tháng này bao nhiêu tiền"; sự cố nước nóng được xác nhận ≤ 10 phút, xử lý trong ngày; nhận lại ký quỹ đúng hạn đã cam kết |
| Trích dẫn giả tưởng | "I just need stable Wi-Fi, hot water, and a bill I can understand." |

## 7. P7 – Ji-woo, khách OTA ngắn ngày (quốc tế)

**Mô phỏng – cần INV kiểm chứng.** (Khớp khách mẫu Ji-woo trong BL 3.21: căn 203, 19–22/10, Booking.com.)

| Mục | Nội dung |
|---|---|
| Hồ sơ | 29 tuổi, Hàn Quốc, đi du lịch cùng bạn 3 đêm; đặt qua Booking.com/Agoda (đã trả trước hoặc trả tại chỗ). Tiếng Anh cơ bản, ưu tiên tiếng Hàn. Đại diện chung cho nhóm khách OTA quốc tế (Hàn, Singapore, Pháp, Đức – brief mục 1) |
| Thiết bị & bối cảnh | Điện thoại, dùng **roaming/eSIM** – có lúc mạng yếu khi vừa xuống sân bay Liên Khương; chủ yếu nhận tin qua email của OTA và tin nhắn trong app OTA; không có Zalo |
| Mục tiêu | Đến nơi nhận phòng nhanh (kể cả đến muộn, quầy không có người); biết đường đi; không bị phụ thu bất ngờ |
| Nhiệm vụ chính | Nhận link check-in online (qua email/tin nhắn OTA) → tải hộ chiếu, chọn giờ đến → nhận mã cửa sáng hôm đến → tìm đường → vào phòng → yêu cầu khăn/hỏi tour → trả phòng (**trả đủ 2 thẻ phòng** nếu căn dùng thẻ – thiếu thẻ phạt 200.000 đ/thẻ, BR-511; khi trả không có người ở quầy theo BR-427) → mời đánh giá |
| Điểm đau (giả định) | Link check-in gửi qua kênh nào? OTA che email thật của khách (email ủy quyền) → có thể không nhận được (H-10); app khách prototype **chỉ tiếng Việt** (heuristic HR-01); không rõ ai là người thật để liên hệ khi **kẹt ngoài cửa** lúc 23:00 (mã sai, khóa hết pin, mã chưa có hiệu lực – H-23); tải ảnh hộ chiếu trên mạng yếu dễ lỗi |
| Nhu cầu với app | Link nhẹ, tải nhanh trên 3G; ngôn ngữ tự nhận theo trình duyệt (EN tối thiểu, KO là điểm cộng); mã cửa + hướng dẫn mở khóa có hình; nút liên hệ khẩn (WhatsApp/gọi); ảnh hộ chiếu nén trước khi gửi, có thể thử lại |
| Thước đo thành công | Đích chính thức: **PRD S5 ≥ 40%** khách check-in online trước khi đến (sau 2 tháng). Giả thuyết riêng của UXR (H-11): với khách OTA có thể đạt 60% nếu link đến được tay khách. Vào phòng ≤ 5 phút từ khi đến cửa |
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
Cách kiểm chứng: phiếu 1 trang `product/docs/research/real-user-check-guide.md` (đính kèm ESC-003). Bộ test đầy đủ với 3–5 người (`real-user-test-guide.md`) vẫn ở Round 2.
Cột **Đường kiểm chứng**: "ESC-003" = có trong phiếu 1 trang; "ESC-0xx" = câu đã nằm ở ESC khác (không hỏi lại); "INT/DATA" = vai khác xác minh; "Thiết kế" = đã xử lý bằng thiết kế, không cần hỏi.

| Mã | Giả thuyết (đội đang tin là…) | Persona | Kiểm chứng với ai, bằng cách nào | Tiêu chí / luật quyết định (nếu đúng → … / nếu sai → …) | Ưu tiên | Đường kiểm chứng |
|---|---|---|---|---|---|---|
| H-01 | Chủ đầu tư chủ yếu xem app trên **điện thoại**, không ngồi quầy thường xuyên | P1 | INV tự trả lời | Đúng → L8 thiết kế mobile trước, HR-12 giữ Major. Sai (chủ yếu laptop/ngồi quầy) → L8 ưu tiên laptop, thêm chuyển vai nhanh P1↔P2; HR-12 hạ Minor | Cao | ESC-003 |
| H-02 | Lễ tân dùng **laptop tại quầy** (màn ≥ 1366×768); 1–2 người xoay ca; một người kiêm sale | P2 | Hỏi lễ tân; xem máy quầy | Đúng → giữ web quầy làm bề mặt chính. Màn nhỏ hơn 1366 → rack mặc định 7 ngày + cuộn. Chủ yếu dùng điện thoại → báo UXD/PO đổi ưu tiên L2/L3 sang mobile | Cao | ESC-003 |
| H-03 | Lễ tân trao đổi với khách NN chủ yếu qua chat và cần mẫu tin **tiếng Nga** | P2, P6 | Lễ tân **ước lượng** tỷ lệ tin cần tiếng Nga trong tuần qua (không lục lịch sử chat – dữ liệu cá nhân); R2: DATA đếm mức dùng mẫu tin RU | Decision-log đã chốt mẫu VI/EN/RU cho MVP. Ước lượng ≥ 1/4 → giữ RU ở R2–R3; < 1/10 → PO cân nhắc dời RU | TB (hạ từ Cao) | ESC-003 (hỏi kèm) + DATA R2 |
| H-04 | Khách đến ngoài giờ trực (khuya) hoặc khách NN đến buổi sáng (hạn BR-603 sớm) xảy ra hằng tuần; luôn có người khai báo kịp hạn | P2, P7 | Ai trực tối, thiết bị gì → **ESC-010**; lễ tân ước lượng số khách đến khuya và khách NN đến trước 10:00 mỗi tuần; DATA lấy giờ đến từ dữ liệu đơn khi có | ≥ 1 lần/tuần → nhắc hạn theo thời gian còn lại + thông báo người trực là Must R2 (đã có US-042) | Cao | ESC-010 + ESC-003 (hỏi kèm) + DATA |
| H-05 | **Buồng phòng tự dùng app trên điện thoại** (không qua lễ tân) | P3 | Kịch bản 3 nhiệm vụ trên **chính điện thoại nhân viên** với wireframe `06-housekeeping-mobile.html` (chi tiết trong phiếu) | Tính theo từng người, nếu thử 2 người lấy kết quả **thấp hơn**: **≥ 2/3** nhiệm vụ tự làm được → giữ L6 như thiết kế. **1/3** → đơn giản hóa L6 (chỉ "Việc của tôi" + "Dọn xong"), lễ tân nhập minibar/sự cố hộ. **0/3 hoặc từ chối dùng** → L6 thành màn cho lễ tân cập nhật hộ + bảng việc in; UXR ghi decision-log, PO điều chỉnh backlog EP07 | **Cao** | ESC-003 |
| H-06 | Nhân viên buồng phòng không quen mã VC/VI/VD/OD | P3 | – | **Đã xử lý bằng thiết kế** (giao diện buồng phòng dùng câu thường, mã chỉ ở giao diện quản lý – decision-log). Kiểm lại khi test L6 ở R2 | Đóng | Thiết kế |
| H-07 | Điện thoại buồng phòng là Android tầm trung, có 4G; Wi-Fi trong một số căn yếu | P3 | Ghi đời máy, phiên bản Android trong buổi thử H-05 (không tốn thêm thời gian) | Android < 9 hoặc RAM ≤ 2 GB → báo ARC kiểm PWA offline (ADR-005) trên máy đó | TB | ESC-003 (ghi kèm H-05) |
| H-08 | CTV có **tài khoản riêng** và chỉ thấy khách/đơn của mình (đã giả định trong RBAC) | P4 | INV xác nhận **có/không** | Có → giữ RBAC. Không → CTV gửi yêu cầu qua lễ tân; PO bỏ màn CTV khỏi R2 | Cao | ESC-003 |
| H-09 | Khách nội địa đặt trực tiếp chủ yếu qua Zalo, cọc bằng chuyển khoản/VietQR | P5 | DATA/INV đếm đơn trực tiếp tháng 9–10 theo kênh khi có dữ liệu | ≥ 70% → giữ VietQR + link qua Zalo làm luồng chính | TB | DATA R2 |
| H-10 | Gửi được link check-in online tới khách OTA và khách mở được | P7 | **INT** xác minh tài liệu channel manager (R2); INV thử với khách thật khi hệ thống gửi link đã chạy (R2–R3) | ≥ 3/5 khách mở link → giữ; < 3/5 → lễ tân gửi link qua tin nhắn OTA thủ công + QR tại cửa | Cao | INT (không hỏi INV ở R1) |
| H-11 | Với khách OTA có thể đạt 60% check-in online (đích PRD S5 là ≥ 40%) | P7 | DATA theo dõi từ R2–R3 | Theo PRD S5 | TB | DATA |
| H-12 | Khách Nga **không** dùng thẻ quốc tế được (gần chắc chắn); chưa biết kênh trả thực tế | P6 | Hỏi 3 khách dài hạn hiện tại qua chat (câu soạn sẵn) | Đa số trả tiền mặt/chuyển khoản qua người thân tại VN → giữ VietQR + tiền mặt **có biên nhận trong app**, không ưu tiên thẻ cho nhóm này. Đa số qua ngân hàng/ví nước thứ ba → báo PO/INT xem lại ESC-010. Ghi kết quả vào cọc khách Nga đặt trực tiếp (DOM-on-PO FB-10) | Cao | ESC-003 |
| H-13 | Khách dài hạn muốn xem hóa đơn tháng + ảnh công tơ trong app | P6 | Cùng tin nhắn H-12 | **≥ 2/3** muốn → giữ US-114/065 ở R3; ≤ 1/3 → gửi hóa đơn qua chat, hạ ưu tiên màn hóa đơn | TB | ESC-003 (hỏi kèm) |
| H-14 | Khách dài hạn cần app **tiếng Nga** | P6 | Cùng tin nhắn H-12 | ≥ 2/3 muốn RU → giữ US-115 R3; ≤ 1/3 → RU chỉ cho hợp đồng/nội quy | TB | ESC-003 (hỏi kèm) |
| H-15 | Khách gia đình nội địa ngại gửi ảnh CCCD qua chat, sẵn lòng gửi qua link bảo mật | P5 | Hỏi 3–5 khách nội địa (R2) | ≥ 3/5 thích link | Thấp | R2 |
| H-16 | Khách lớn tuổi / gia đình có trẻ nhỏ quan tâm tầng thấp, thang máy, đậu xe, nước nóng | P5 | Xem 20 tin hỏi trước khi đặt; đánh giá OTA (R2) | Chủ đề hỏi nhiều nhất | Thấp | R2 |
| H-17 | Sự cố phổ biến: nước nóng, thẻ phòng, đồ để quên, lịch dọn | P2, P3, P6 | INV liệt kê sự cố 2 tháng gần nhất (R2) | Top 5 sự cố → danh mục yêu cầu app khách | TB | R2 |
| H-18 | Khách OTA quốc tế tự vào phòng bằng mã cửa không cần lễ tân | P7 | INV thử 1 lần khi có khóa (ESC-011) | Khách vào được không cần gọi | TB | Sau ESC-011 |
| H-19 | Chủ đầu tư muốn duyệt FOC trên điện thoại theo thời gian thực | P1 | – | Câu hỏi hạn mức và cách duyệt đã nằm ở **ESC-007** – không hỏi lại | TB | ESC-007 |
| H-20 | Lễ tân cần **bàn giao ca** (tiền mặt, chuyển khoản đã xác nhận, khách chưa đến, khai báo còn thiếu, yêu cầu đang mở) | P2 | Hỏi lễ tân: bàn giao những gì, bằng giấy hay Zalo, có đếm tiền mặt không, đã từng lệch tiền chưa | Có bàn giao tiền mặt hoặc từng lệch tiền → đề nghị PO nâng US-124 lên Must R3 (cùng DOM-PO-06); không → giữ Should | **Cao** (nâng từ Thấp theo DOM) | ESC-003 |
| H-21 | Buồng phòng và kỹ thuật là **người khác nhau** (2 + 1 như BL), không phải một người kiêm | P3 | INV tự trả lời | Khác người → L6 cần luồng chuyển giao "sửa xong – cần dọn lại" (biến thể A của P3). Một người kiêm → giữ menu gộp | Cao | ESC-003 |
| H-22 | Có khách đến **04:00–06:00** (xe giường nằm đêm, chuyến bay sớm) và họ muốn vào phòng/gửi đồ/tắm | P2, P5 | Lễ tân ước lượng số lần/tháng | ≥ 2 lần/tháng → luồng "nhận trước 06:00 = thêm đêm" (BR-411) và gửi hành lý cần rõ trên quầy và tin nhắn | TB | ESC-003 (hỏi kèm) |
| H-23 | Khách tự nhận phòng bằng mã cửa có lúc **kẹt ngoài cửa** (mã sai, hết pin, mã chưa hiệu lực) | P7 | Lễ tân/INV: đã từng xảy ra chưa, khách liên hệ ai, mất bao lâu | Đã từng → link khách có số khẩn cấp + quản lý cấp mã dự phòng từ xa (gửi INT/UXD) | TB | ESC-003 (hỏi kèm) |
| H-24 | Khách nội địa lớn tuổi **không hiểu** cụm "check-in online" (UXR-UXD-16) | P5 | Lễ tân hỏi 3 khách nội địa ≥ 50 tuổi trong 3 ngày: chỉ thẻ chữ "Check-in online" và "Làm thủ tục trước", hỏi "cụm nào dễ hiểu hơn?" | ≥ 2/3 chọn "Làm thủ tục trước" → UXD dùng cụm tiếng Việt làm chính, "check-in online" trong ngoặc | TB | ESC-003 (không bắt buộc) |

Tóm tắt đường đi: **7 giả thuyết Cao hỏi qua ESC-003** (H-01, H-02, H-05, H-08, H-12, H-20, H-21); **2 giả thuyết Cao đi đường khác** (H-04 → ESC-010 + DATA, có 1 câu ước lượng hỏi kèm; H-10 → INT); H-06 đóng bằng thiết kế; H-19 đã nằm ở ESC-007; các câu TB "hỏi kèm" (H-03, H-07, H-13, H-14, H-22, H-23, H-24) mỗi câu < 1 phút, không làm tăng đáng kể thời gian.

---

## 10. Lịch sử thay đổi
| Phiên bản | Ngày | Người | Nội dung |
|---|---|---|---|
| 0.1 | 15/10/2026 | UXR | Bản đầu, 7 persona mô phỏng + 20 giả thuyết |
| 0.2 | 15/10/2026 | UXR | Bước 4 R1: hạn khai báo theo BR-602/603 (P1, P2); bỏ USDT, ghi chú pháp lý (P6); thước đo P7 theo PRD S5; nhắc thị thực theo BR-605; thêm mục 0.2 ánh xạ persona–PRD–RBAC–BL, mục 0.3 bề mặt → persona chính; biến thể Quản lý (P1), tách vai và nhân viên trẻ (P3); viết lại mục 9: cột luật quyết định, H-03 hạ TB, H-06 đóng bằng thiết kế, H-19 → ESC-007, H-20 nâng Cao, thêm H-21…H-24; trả 2 thẻ phòng khi trả phòng (P7). Theo thẻ FB-R1-UXD-UXR-*, PO-UXR-*, DOM-UXR-* |
