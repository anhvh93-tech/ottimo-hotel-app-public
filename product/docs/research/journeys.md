# Bản đồ hành trình – OTTIMO Boutique Stay

> **Mô phỏng – cần INV kiểm chứng.**
> Các hành trình dưới đây do UXR **mô phỏng** dựa trên persona (`product/docs/research/personas.md`), brief chủ đầu tư mục 1 và 5, và prototype Round 0 (`product/docs/round-0-baseline.md` = **BL**). Giờ giấc, tần suất, cảm xúc là **giả định**, chưa quan sát người thật. Giả thuyết cần kiểm chứng có mã **H-xx** (danh sách ở `personas.md` mục 9).
>
> Người viết: UXR · Round 1 · Bước 2 · 15/10/2026 · Phiên bản 0.2 (Bước 4 – sửa theo review; xem mục 7)
>
> **Số quy tắc lấy từ `business-rules.md`** (BR-xxx), không ghi lại ở đây. Đặc biệt **hạn khai báo lưu trú khác nhau theo khách**: khách Việt Nam trước 23:00 ngày đến (BR-602); khách nước ngoài trong **12 giờ kể từ giờ đến** (BR-603) – ví dụ đến 08:00 thì hạn 20:00 cùng ngày, đến 21:30 thì hạn 09:30 hôm sau. Mọi nhắc hạn trong tài liệu này tính **theo thời gian còn lại tới hạn của từng khách**, không theo giờ cố định.

Quy ước:
- **Cảm xúc**: thang chữ **Tốt / Bình thường / Lo / Bực** (không dùng biểu tượng để đọc được bằng trình đọc màn hình).
- **Cơ hội** ghi mã luồng wireframe UXD (plan.md mục 3.3: L1…L8) và tham chiếu BL để PO đưa vào backlog.
- **Mức đau**: Cao / TB / Thấp – mức ảnh hưởng tới khách, doanh thu hoặc pháp lý (đánh giá của UXR, mô phỏng).

---

## J1. Khách ngắn ngày (P5 nội địa đặt trực tiếp · P7 quốc tế qua OTA)

Hành trình chung 7 giai đoạn; cột "Biến thể" ghi khác biệt giữa khách trực tiếp (P5) và khách OTA (P7).

| # | Giai đoạn | Hành động của khách | Điểm chạm | Cảm xúc | Điểm đau (mức) | Cơ hội cho sản phẩm | Biến thể P5 / P7 |
|---|---|---|---|---|---|---|---|
| 1 | **Tìm phòng** | Xem ảnh trên OTA/Google Maps/mạng xã hội; so giá; hỏi phòng trống | OTA, Google, TikTok/Facebook, Zalo OA | Bình thường → Lo (sợ ảnh không giống thật) | Không biết giá trực tiếp có rẻ hơn OTA không; câu hỏi lặp lại (đậu xe, nước nóng, bếp, Wi-Fi) mất thời gian lễ tân (TB) | Trang/tin nhắn giới thiệu chuẩn bị sẵn theo ngôn ngữ; mẫu trả lời FAQ cho lễ tân (L2 – mẫu tin) – H-16 | P5 hỏi qua Zalo; P7 chỉ thấy trang OTA |
| 2 | **Đặt phòng** | Chọn ngày, căn, số người; nhận báo giá; xác nhận | Zalo + lễ tân (P5) / OTA (P7) → channel manager → Desk | Lo (chờ phản hồi) | P5: chờ lễ tân trả lời, giá phải tính tay; không có phiếu xác nhận. P7: đơn OTA về Desk phải đúng, không trùng (BL 8.2 #30) (Cao) | Lễ tân tạo đơn ≤ 1 phút từ rack (L2); kiểm trùng ở server; gửi **link xác nhận đơn** (ngày, căn, giá, chính sách hủy) đa ngôn ngữ | P7 bỏ qua bước này trong Desk (OTA lo); lễ tân chỉ cần thấy đơn mới + thông báo |
| 3 | **Thanh toán / cọc** | Chuyển cọc 30% (P5) hoặc đã trả OTA/trả tại chỗ (P7) | VietQR, app ngân hàng; OTA | **Lo** (đã chuyển tiền nhưng chưa ai báo nhận) | Đối soát tay "đã nhận cọc chưa"; khách hỏi lại; giữ chỗ hết hạn không tự mở (BL 8.2 #19) (Cao) | VietQR có nội dung theo mã đơn + đối soát tự động; tin "Đã nhận cọc X đ" tự gửi; bộ đếm giữ chỗ (L5, L2) – H-09 | P7: hiển thị rõ cho lễ tân "đã trả qua OTA" vs "thu tại chỗ" để khỏi thu nhầm |
| 4 | **Trước khi đến + check-in** | Nhận link check-in online, tải giấy tờ, chọn giờ đến; nhận mã cửa; đến nơi, vào phòng | Link app khách (L7); email/tin OTA; khóa thông minh; quầy (L3) | Lo (đường đi, giờ, giấy tờ) → Tốt nếu vào phòng nhanh | Ảnh giấy tờ gửi qua chat (lộ dữ liệu – SEC); khách OTA có thể không nhận link (H-10); đến khuya không có người (H-04); khách NN đến sáng có hạn khai báo ngay trong ngày (BR-603); **kẹt ngoài cửa** khi tự nhận phòng – mã sai, khóa hết pin, mã chưa có hiệu lực vì đến sớm (H-23); khách xe đêm đến 04:00–06:00 muốn vào phòng/gửi đồ (H-22); phụ thu nhận sớm tự tính sai (BL 8.2 #2); app khách chỉ tiếng Việt (HR-01) (Cao) | Check-in online đa ngôn ngữ, ảnh nén, thử lại khi mạng yếu; khai báo lưu trú được chuẩn bị sẵn từ dữ liệu check-in (BL 5.12); mã cửa + hướng dẫn hình; **số khẩn cấp luôn hiển thị trong link + mã dự phòng do quản lý cấp từ xa**; nhận phòng tại quầy ≤ 3 phút khi đã check-in online | P5: CCCD cả nhà + số định danh trẻ em – cần hướng dẫn. P7: hộ chiếu + visa/miễn thị thực + dấu nhập cảnh |
| 5 | **Lưu trú** | Dùng Wi-Fi, bếp; xin thêm chăn/khăn; báo sự cố (nước nóng); hỏi tour/xe | App khách tab Yêu cầu; chat; lễ tân; buồng phòng; bảo trì | Tốt → **Bực** nếu sự cố không được xử lý nhanh | Yêu cầu qua chat bị chìm; không biết đã ai nhận chưa; nước nóng (9% đánh giá cần cải thiện – số mẫu BL 3.20) (TB) | Yêu cầu có trạng thái (Đã nhận → Đang xử lý → Xong) hiển thị cho khách; tự định tuyến (BL 5.19) với cam kết 10 phút; hỏi thăm ngày thứ 2 (BL 5.18) | P7 cần EN; liên hệ khẩn bằng WhatsApp |
| 6 | **Check-out** | Nhận nhắc giờ trả; chọn trả đúng giờ / ở thêm / trả muộn; trả phòng; thanh toán phần còn lại; lấy hóa đơn | Tin nhắc 20:00 & 09:00 (BL 5.9); app khách; quầy (L4); VietQR; HĐĐT MISA | Bình thường → Lo (phí phát sinh bất ngờ) | Phụ thu trả muộn chưa có ân hạn rõ (BL 8.2 #4); minibar tính tranh cãi; khách OTA ở thêm bị giá khác (BL 8.2 #13); phải chờ lễ tân kiểm minibar (Cao – sai tiền) | Khách tự chọn ở thêm/trả muộn trong app với giá hiện rõ trước khi xác nhận; bill xem trước trên điện thoại; trả phòng không cần chờ quầy (express check-out, BR-427) **có bước trả thẻ**: khách xác nhận trong app đã trả đủ **2 thẻ phòng** (bỏ vào hộp/để tại vị trí được hướng dẫn) hoặc khai số thẻ còn thiếu, thấy trước phí 200.000 đ/thẻ (BR-511); buồng phòng xác nhận số thẻ thu được khi kiểm phòng; thanh toán phát sinh qua QR | P5 có thể cần HĐ công ty (MST); P7 đã trả OTA → chỉ trả phát sinh |
| 7 | **Đánh giá & quay lại** | Nhận lời mời đánh giá; viết đánh giá; nhận mã OTTIMO-BACK5 | Tin nhắn sau 1 ngày; OTA; Google Maps; CRM | Tốt (nếu ở vui) | Mời đánh giá thủ công, quên; khách OTA không biết đặt trực tiếp lần sau rẻ hơn (TB) | Tự động hóa 4 bước xin đánh giá (BL 5.18); lọc khách chưa hài lòng (ngày 2) trước khi mời; CRM nhận diện khách quay lại | P7: mời đánh giá đúng kênh (Booking/Agoda); P5: Google Maps + Zalo OA |

**Khoảnh khắc quyết định (moments of truth):** (a) bước 3 – "tiền đã đến chưa"; (b) bước 4 – đứng trước cửa có vào được ngay không; (c) bước 6 – bill có đúng và không bất ngờ không.

---

## J2. Khách dài hạn (P6 – Alexei, thuê 3–6 tháng)

| # | Giai đoạn | Hành động | Điểm chạm | Cảm xúc | Điểm đau (mức) | Cơ hội |
|---|---|---|---|---|---|---|
| 1 | **Tìm & hỏi giá** | Thấy bài đăng nhóm Telegram/Facebook expat hoặc qua CTV; hỏi giá tháng, dọn phòng, điện nước | CTV (P4), chat, ảnh | Lo (giá có minh bạch không, phí ẩn) | Báo giá tiếng Việt hoặc dịch máy; điện nước "theo thực tế" khó hình dung (TB) | Báo giá dài hạn EN/RU dạng link/ảnh: thuê, phí dịch vụ, điện nước **ước tính**, phí phạt (thuốc lá 500k, thẻ phòng 200k – brief 5) ngay từ đầu (L5) |
| 2 | **Xem phòng & giữ chỗ** | Xem trực tiếp hoặc video call; yêu cầu giữ căn | CTV/lễ tân; Desk (giữ chỗ 12/24/48h) | Lo (sợ mất căn) | Giữ chỗ không có đếm giờ, không tự mở lại (BL 8.2 #19) (TB) | Bộ đếm giữ chỗ hiển thị cho cả khách và sale; nhắc trước khi hết hạn |
| 3 | **Ký hợp đồng & ký quỹ** | Đọc hợp đồng, chuyển ký quỹ + kỳ thu đầu | Hợp đồng (PDF), chuyển khoản/tiền mặt | **Lo** (hợp đồng tiếng Việt; ký quỹ lớn ~2 tháng thuê với khách NN – BL 5.2) | Không đọc được hợp đồng; khó thanh toán quốc tế (H-12); không có biên nhận ký quỹ (Cao) | Hợp đồng song ngữ VI/EN (RU tóm tắt) xuất PDF; biên nhận ký quỹ trong app; nhiều phương thức thanh toán |
| 4 | **Nhận phòng** | Gửi hộ chiếu, visa, dấu nhập cảnh; nhận chìa/mã; biên bản tình trạng phòng | Quầy (L3), app khách | Bình thường | Khai báo tạm trú phải đủ ảnh trang hộ chiếu, dấu nhập cảnh, visa (brief 5); ngày đi dự kiến không vượt hạn tạm trú (Cao – pháp lý) | Checklist giấy tờ người nước ngoài; cảnh báo visa hết trước ngày kết thúc hợp đồng (BL 5.12, mẫu Emma); **biên bản nhận phòng có ảnh** (làm căn cứ khấu trừ ký quỹ sau này) |
| 5 | **Sống hằng tháng** | Làm việc tại phòng; đặt dọn 100k/lần khi cần; nhận hóa đơn điện nước; trả tiền kỳ | App khách (hóa đơn, lịch dọn, yêu cầu); chat | Tốt nếu Wi-Fi + nước nóng ổn | Không biết tiền điện tính sao; muốn thấy chỉ số công tơ; dọn phòng phải nhắn hẹn; nhắc kỳ thu bằng tin chat lẫn lộn (TB) | Hóa đơn tháng có ảnh công tơ, đơn giá (BL 5.10); đặt/hủy dọn trong app (H-13); nhắc thu trước 7 ngày (BL 5.20); trạng thái yêu cầu báo hỏng |
| 6 | **Sự cố** | Báo mất nước nóng / Wi-Fi chậm | App khách → Bảo trì (P3) | **Bực** (ảnh hưởng công việc) | Không biết ai xử lý, bao giờ xong (Cao với người làm việc từ xa) | Phiếu sửa có ảnh, có ETA cho khách; ưu tiên cao cho sự cố Wi-Fi/nước nóng ở căn dài hạn |
| 7 | **Gia hạn visa / hợp đồng** | Gia hạn visa; quyết định ở tiếp | Lễ tân; app khách | Lo | Không ai nhắc visa; chào gia hạn hợp đồng trễ (BL 5.20: trước ~1 tháng) (TB) | Nhắc gia hạn thị thực theo BR-605 (tham số; DOM đang sửa thành 30 ngày cho khách dài hạn vì gia hạn qua dịch vụ mất 5–10 ngày làm việc); chào gia hạn hợp đồng trong app kèm giá (BR-211); cập nhật khai báo tạm trú khi gia hạn |
| 8 | **Trả phòng & hoàn ký quỹ** | Kiểm phòng, chốt điện nước kỳ cuối, trả thẻ (2 thẻ), nhận lại ký quỹ | Quầy (L4 biến thể dài hạn); app | **Lo** (sợ bị trừ cọc) | Prototype không có khấu trừ/hoàn ký quỹ (BL 8.2 #6); phí làm lại thẻ 200k nếu thiếu thẻ (Cao – tiền) | Biên bản trả phòng so với ảnh lúc nhận; bảng khấu trừ minh bạch; cam kết thời hạn hoàn ký quỹ (chính sách – chờ ESC của PO/DOM) |
| 9 | **Sau khi đi** | Đánh giá; giới thiệu bạn bè | Nhóm expat, Google | Tốt/Bực tùy bước 8 | – | Mã giới thiệu cho khách dài hạn (**ngoài MVP** – ý tưởng sau R4, không thuộc backlog hiện tại) |

**Khoảnh khắc quyết định:** bước 3 (hiểu hợp đồng + ký quỹ), bước 6 (sự cố được xử lý trong ngày), bước 8 (nhận lại ký quỹ đúng như cam kết).

---

## J3. Một ca lễ tân (P2 – Chị Thảo, ca ngày 07:00–15:00 → bàn giao ca chiều)

Mốc giờ dựa trên quy tắc BL: nhận phòng 14:00, trả phòng 12:00, nhắc 09:00/11:00/12:00 (BL 5.9), hạn khai báo theo BR-602 (khách VN, 23:00) / BR-603 (khách NN, giờ đến + 12 giờ – có thể sớm hơn 23:00 nhiều; BL dùng 23:00 cho mọi khách là **sai** với khách NN). Ngày minh họa: Thứ Năm 15/10/2026 (ngày demo của prototype). Số ca/giờ ca là **giả định** (H-02, H-20).

| Giờ | Việc | Màn hình / công cụ (prototype → đề xuất) | Cảm xúc | Điểm đau (mức) | Cơ hội |
|---|---|---|---|---|---|
| 07:00 | Nhận ca: đọc ghi chú ca đêm, kiểm tiền mặt, xem khách đến/đi hôm nay | Prototype: Tổng quan (KPI tài chính đứng đầu) | Bình thường | Không có bàn giao ca; KPI tài chính (ADR, RevPAR) không phải thứ lễ tân cần đầu ca (TB) | Dashboard **theo vai**: lễ tân thấy "Việc hôm nay theo giờ" trước; ghi chú bàn giao ca (H-20) |
| 07:30 | Kiểm tra khai báo còn sót của khách đến khuya hôm qua; xem khách NN nào đến sáng nay (hạn rơi vào chiều/tối nay) | Giấy tờ & khai báo | Lo | Prototype hiển thị "Đã quá hạn" nhưng không có hướng xử lý; không phân biệt hạn khách VN và NN (TB – pháp lý) | Danh sách khai báo **sắp xếp theo thời gian còn lại tới hạn của từng khách** ở đầu dashboard + hướng dẫn xử lý khi quá hạn (US-042) |
| 08:00–09:00 | Trả lời tin nhắn đêm qua (Zalo/WhatsApp/OTA), soạn tin tiếng Anh/Nga | Ngoài app (điện thoại cá nhân) | **Bực** | Chuyển qua lại điện thoại – laptop; dịch tiếng Nga; không lưu vào hồ sơ khách (Cao – thời gian) | Mẫu tin nhắn VI/EN/RU có biến, sao chép 1 chạm; ghi chú tin nhắn quan trọng vào hồ sơ khách (H-03) |
| 09:00 | Hệ thống nhắc lần 2 cho khách trả phòng hôm nay | Thẻ "Khách trả phòng hôm nay chưa trả" (BL 3.3b) | Bình thường | – (điểm mạnh prototype) | Giữ; thêm khách trả lời tự cập nhật |
| 09:00–11:00 | Phối hợp buồng phòng: phòng nào dọn trước cho khách đến sớm; nhận yêu cầu từ khách | Buồng phòng; App khách (phần nhân viên) | Lo | Phải gọi điện hỏi buồng phòng tiến độ; yêu cầu app khách nằm ở màn khác (TB) | Bảng trạng thái buồng cập nhật thời gian thực từ điện thoại buồng phòng; ưu tiên dọn tự động theo giờ khách đến |
| 10:30 | Khách xin nhận sớm | Modal Nhận phòng | Lo | Mặc định tự tính phụ thu 30% (BL 8.2 #2); FOC tự chọn người duyệt (8.2 #24) (Cao – tiền) | Giờ nhận mặc định = **giờ chuẩn 14:00, phụ thu 0** (BR-414; đúng phát hiện Blocker HR-04). Lễ tân bấm "Khách nhận sớm" mới nhập giờ thực tế và thấy phí đề xuất theo BR-411, tick "đã báo khách" rồi mới lưu. Nếu miễn phí → gửi yêu cầu FOC tới người có quyền theo hạn mức (BR-432, 433: lễ tân trưởng/quản lý/chủ đầu tư), không mặc định gửi P1 |
| 11:00 | Khách chưa trả lời giờ trả → gọi điện | Thẻ trả phòng (trạng thái "Chưa trả lời · lễ tân gọi") | Bình thường | Số điện thoại phải gõ sang máy khác (Thấp) | Nút gọi/nhắn trực tiếp (tel:, WhatsApp) |
| 11:30–12:30 | **Cao điểm trả phòng**: kiểm minibar → phụ phí → bill → thu tiền → HĐĐT | Trả phòng 3 bước (L4) | Lo → Tốt khi xong | Minibar nhập số vào ô nhỏ; lỡ bấm nền/Esc là mất hết (HR-05); phải chờ buồng phòng báo minibar (TB) | Buồng phòng nhập minibar trước khi khách xuống; bill xem trước; lưu nháp tự động |
| 12:00 | Quá giờ trả phòng – cảnh báo đỏ | Thẻ trả phòng | Lo | Toast 2,8 giây dễ bỏ lỡ (HR-09) (Thấp) | Cảnh báo bền vững trên dashboard đến khi xử lý |
| 12:30–13:30 | Nhận đặt phòng mới qua Zalo; báo giá dài hạn cho khách hỏi | Đặt phòng mới (L2), Báo giá (L5) | Bình thường | Đặt phòng mới không chọn được giá theo kênh, tối đa 60 đêm (BL 8.2 #26) (TB) | Đặt phòng từ ô trống trên rack (bấm vào ngày/căn) – điền sẵn |
| 14:00–15:00 | Nhận phòng khách đến: giấy tờ → đối chiếu → khai báo → giao mã cửa | Nhận phòng (L3) + Giấy tờ & khai báo | Lo (khách chờ) | Khai báo: sao chép – mở cổng BCA – dán mã (BL 3.11), dễ quên làm sau; hạn hộ chiếu luôn "Khớp" (BL 8.2 #3) (Cao – pháp lý) | Gộp nhận phòng + khai báo thành một luồng; hiện **hạn của chính khách đó** ngay khi nhận phòng (ví dụ khách NN nhận phòng 08:00 → hạn 20:00 cùng ngày theo BR-603; cách tính chi tiết luôn lấy từ BR-603, không tự suy ra ở giao diện); nếu chưa khai báo thì nhắc theo **thời gian còn lại** (ví dụ còn 3 giờ, còn 1 giờ, còn 15 phút – mốc là tham số), không theo giờ cố định |
| 15:00 | Bàn giao ca chiều: tiền thu trong ca, khách chưa đến, khai báo còn thiếu (kèm hạn từng khách) | Không có | Lo | Không có; tiền mặt và khai báo dở dễ rơi giữa hai ca (TB → có thể Cao, chờ H-20) | Tổng thu ca theo cách thanh toán (US-124, R3); màn "Kết ca" đầy đủ là **ngoài MVP** (PRD X3) cho tới khi có kết quả H-20 |

Tổng hợp ca: **6–8 lần chuyển giữa ứng dụng** (Desk, Zalo, cổng BCA, app ngân hàng, extranet OTA) là nguồn đau lớn nhất (mô phỏng – cần quan sát 1 ca thật để đếm).

---

## J4. Một ngày buồng phòng / bảo trì (P3 – Chú Bảy, 08:00–17:00)

Ngày minh họa: 3 phòng trả (dọn trả phòng), 2 phòng khách đang ở (1 dài hạn đã đặt dọn 100.000 đ/lần), 1 phòng khóa (OOO), 1 yêu cầu từ app khách, cuối tháng có chốt điện nước. **Giả định** – H-05, H-06, H-07.

| Giờ | Việc | Công cụ (prototype → đề xuất) | Cảm xúc | Điểm đau (mức) | Cơ hội |
|---|---|---|---|---|---|
| 08:00 | Xem việc hôm nay, phòng nào ưu tiên | Prototype: màn Buồng phòng desktop thu nhỏ; tab dưới 9–11 mục (BL 8.3) | Lo | Danh sách việc không xếp theo giờ khách đến; mã VC/OD (H-06) (Cao) | Màn "Việc của tôi" sắp theo ưu tiên: khách đến sớm nhất trước; nhãn câu thường |
| 08:30–09:00 | Dọn phòng dài hạn **theo yêu cầu** – 100.000 đ/lần, không bắt buộc (brief mục 5; gói dọn định kỳ chỉ có nếu INV chọn ở ESC-005) | Thẻ buồng | Bình thường | Không biết khách có ở trong phòng không / có muốn dọn hôm nay (TB) | Khách xác nhận/hoãn lịch dọn trong app; buồng phòng thấy trạng thái "khách đồng ý dọn 9–11h" |
| 09:00–12:30 | Chờ khách trả phòng; dọn phòng trống cần chuẩn bị | Thẻ buồng; checklist 12 điểm (văn bản tĩnh) | Bực (chờ đợi) | Không biết khách đã trả chưa → phải hỏi lễ tân (TB) | Thông báo đẩy "Phòng 201 đã trả phòng – có thể dọn"; checklist tick được |
| 10:15 | Nhận yêu cầu "thêm khăn" từ app khách | Việc hôm nay (chip "App khách") | Bình thường | Phải tự mở app để thấy; không có thông báo (TB) | Thông báo đẩy + rung; bấm "Đã giao" → khách thấy trạng thái |
| 12:30–14:00 | Dọn trả phòng: kiểm minibar, checklist, báo xong | Modal minibar (ô nhập 64–96px); nút Bắt đầu dọn/Dọn xong (btn.sm) | Bực (tay ướt, nút nhỏ) | Vùng chạm nhỏ; nhập số bằng bàn phím; mạng yếu trong phòng (H-07) (Cao) | Nút +/− lớn cho minibar; "Dọn xong" 1 chạm, hoạt động offline; chụp ảnh phòng sau kiểm (checklist mục 12) |
| 14:00 | Lễ tân giục phòng cho khách đến | Điện thoại gọi | Bực | Thông tin thời gian thực không có (TB) | Trạng thái tự đồng bộ; lễ tân thấy "đang dọn, còn ~15 phút" |
| 14:30 | Báo hỏng: vòi sen phòng 402 rò nước | Bảo trì → phiếu mới (desktop form) | Bình thường | Không chụp ảnh; tick "khóa phòng" không chặn bán (BL 8.2 #5) (Cao – bán nhầm phòng hỏng) | Phiếu sửa từ điện thoại: chọn phòng (tự gợi ý phòng đang đứng), chụp ảnh; khóa phòng **thật sự chặn bán trên mọi kênh** và giao diện chỉ báo "Đã khóa" khi hệ thống xác nhận (HR-20 – Blocker). Nhập giọng nói: ngoài MVP |
| 15:00–16:00 | Sửa nước nóng phòng dài hạn (yêu cầu từ khách) | Phiếu sửa – đổi trạng thái dropdown | Bình thường | Không báo được cho khách "đang sửa, xong lúc…" (TB) | Cập nhật trạng thái phiếu → tự báo khách (EN/RU) |
| 15:00 | **Giao lại căn sau sửa** (khi buồng phòng và kỹ thuật là hai người – H-21): kỹ thuật báo xong vòi sen 402; căn có khách đến 16:00 | Không có liên kết phiếu sửa ↔ việc dọn | Lo | Buồng phòng không biết căn đã sửa xong để dọn lại → căn kẹt trạng thái khóa/chờ dọn, có thể mất đêm bán (Cao – doanh thu) | Phiếu sửa "xong" tự tạo việc "Dọn sau sửa chữa" cho buồng phòng, hiện giờ khách đến tiếp theo; mở bán lại chỉ sau kiểm phòng |
| 16:00 | Bổ sung minibar, lấy hàng từ kho | Việc "Bổ sung minibar" | Bình thường | – (prototype đã tự trừ kho khi tick – điểm mạnh) | Giữ |
| Cuối tháng | Chốt số điện nước các căn dài hạn | Bảo trì → bảng chỉ số (desktop) | Lo (sợ ghi sai) | Chỉ số mới < cũ bị ép về 0 (BL 8.2 #21); không chụp ảnh công tơ (Cao – tiền, tranh chấp với khách P6) | Nhập từ điện thoại tại công tơ + chụp ảnh; kiểm tra bất thường (âm, tăng đột biến) |
| 17:00 | Kết thúc ngày | – | – | Không biết hôm nay đã làm đủ chưa | Tóm tắt "Đã xong 8/9 việc"; việc dở chuyển sang hôm sau |

---

## 4b. Ngoại lệ thường gặp (đầu vào cho trạng thái lỗi / rỗng / mất mạng của UXD)

Mô phỏng – cần INV kiểm chứng. Mỗi dòng: chuyện gì xảy ra · người dùng cảm thấy gì · hệ thống nên làm gì (đề xuất – UXD quyết cách hiển thị).

| Giai đoạn | Ngoại lệ | Người dùng cảm thấy | Hệ thống nên làm |
|---|---|---|---|
| J1-3 Thanh toán/cọc | Khách chuyển khoản **sai số tiền** hoặc **thiếu nội dung mã đơn** | P5: lo, nghĩ đã xong; P2: không khớp được giao dịch | Giao dịch không khớp vào hàng "Chờ đối soát" cho lễ tân ghép tay vào đơn; khách nhận tin "Đã nhận X đ, còn thiếu Y đ" thay vì im lặng |
| J1-3 | Giữ chỗ **hết hạn đúng lúc** khách đang chuyển tiền | Bực (mất căn sau khi đã trả) | Tiền về sau hạn → báo lễ tân xử lý ngay (căn còn trống thì khôi phục, hết thì đề xuất căn thay thế/hoàn) |
| J1-4 Check-in online | **Tải ảnh giấy tờ thất bại** nhiều lần (mạng yếu, ảnh quá nặng) | P7: bỏ dở | Nén ảnh trên máy; giữ ảnh đã chụp để thử lại; sau 2 lần lỗi gợi ý "gửi tại quầy khi đến" – không chặn đơn |
| J1-4 | Khách OTA **đến mà chưa check-in online** (không nhận link – H-10) | P2: khách đứng chờ | Nhận phòng tại quầy đủ bước như thường (quét giấy tờ), không coi là lỗi; ghi lý do để DATA đo S5 |
| J1-4 | Khách đến khuya **không nhận được mã cửa** / mã sai / khóa hết pin (H-23) | Rất bực, lo an toàn | Số khẩn cấp + WhatsApp trong link và tin chào; người trực/quản lý nhận thông báo, cấp mã dự phòng từ xa; tin nhắn hướng dẫn chỗ chờ |
| J1-6 Check-out | Express check-out nhưng **trả thiếu thẻ** | Lo bị phạt bất ngờ | App hỏi số thẻ trả; thiếu → hiện phí BR-511 trước khi xác nhận; buồng phòng đối chiếu khi kiểm phòng, lệch thì lễ tân liên hệ trong 24 giờ (BR-427) |
| J2-3 Ký quỹ | Khách Nga trả bằng **tiền mặt USD** hoặc qua người thân | Lo không có bằng chứng | Biên nhận trong app (số tiền, quy đổi tham khảo, người nhận); PRD X9 – sổ sách ghi VND |
| J3 14:00 Khai báo | Lễ tân **mở cổng BCA nhưng chưa dán mã hồ sơ** rồi bị ngắt quãng | Quên | Trạng thái "Đã mở cổng – chưa có mã" ở đầu danh sách, nhắc theo thời gian còn lại tới hạn |
| J4 12:30 Dọn | Buồng phòng bấm **"Dọn xong" khi mất mạng**, trong lúc lễ tân đã đổi trạng thái căn (ví dụ khóa vì hỏng) | Không biết thao tác có được ghi không | Ghi tạm trên máy, hiện "Chưa gửi – sẽ tự gửi"; khi đồng bộ gặp xung đột thì **không ghi đè** trạng thái khóa, báo cả hai bên (ADR-005) |
| J4 14:30 Báo hỏng | Gửi phiếu kèm ảnh khi **mất mạng** | Sợ mất ảnh | Phiếu và ảnh lưu hàng đợi, đánh dấu "chờ gửi"; ảnh nén |

---

## 5. Tổng hợp cơ hội theo mức ưu tiên (đề xuất cho PO – không phải quyết định phạm vi)

Cột "Story / Round" đối chiếu `03-backlog/backlog.md` tại 15/10/2026; "ngoài MVP" = không có trong backlog hiện tại, chỉ là ý tưởng.

| # | Cơ hội | Hành trình / giai đoạn | Persona | Lý do ưu tiên | Liên kết BL / luồng UXD | Story / Round |
|---|---|---|---|---|---|---|
| O-01 | Nhận phòng + giấy tờ + khai báo lưu trú thành **một luồng**; nhắc hạn **theo thời gian còn lại tới hạn của từng khách** (BR-602 VN / BR-603 NN) | J1-4, J2-4, J3 14:00 | P2, P5, P6, P7 | Pháp lý + thời gian quầy | BL 3.6, 3.11, 5.12; L3 | US-025, 042, 046, 047 – R2 |
| O-02 | **App khách đa ngôn ngữ (VI/EN, RU)**: xác nhận đơn, check-in online, yêu cầu có trạng thái, hóa đơn | J1-2..6, J2-5..6 | P5, P6, P7 | Khách NN là nhóm lớn; app prototype chỉ tiếng Việt | BL 3.21; L7; decision-log P4 | US-107, 110, 112 – R2; US-114, 115 – R3 |
| O-03 | **Giao diện điện thoại cho buồng phòng/bảo trì**: một tay, nút lớn, offline, ảnh | J4 toàn bộ | P3 | Nếu P3 không dùng được, trạng thái buồng sai → bán sai phòng | BL 3.12, 3.14, 8.3; L6 | US-052, 053, 054, 057, 058 – R2; US-060 – R3 (phụ thuộc H-05) |
| O-04 | Đối soát thanh toán/cọc + tin "đã nhận tiền" | J1-3, J2-3 | P2, P5, P6 | Khoảnh khắc lo lắng nhất của khách | BL 5.5, 5.20; L4, L5 | US-086 – R2 (xác nhận tay); tự động: theo ESC-010 – R3 |
| O-05 | Mẫu tin nhắn VI/EN/RU có biến, gửi/sao chép 1 chạm | J3 08:00, J2 toàn bộ | P2, P4 | Brief mục 5 nêu trực tiếp | Brief 5 | US-125 – R2; US-127 – R3 |
| O-06 | Trả phòng dài hạn: biên bản + khấu trừ/hoàn ký quỹ minh bạch | J2-8 | P6, P2 | Tranh chấp tiền | BL 8.2 #6; L4 biến thể | US-041 – R3 |
| O-07 | Dashboard theo vai (lễ tân: việc theo giờ; chủ đầu tư: rủi ro tiền/pháp lý) | J3 07:00 | P1, P2 | Mỗi vai cần khác nhau | BL 3.2; L1, L8 | US-012, 013 – R2 |
| O-08 | Không mất dữ liệu khi bị ngắt quãng (nháp tự lưu, xác nhận trước khi đóng) | J3 11:30 | P2 | Lễ tân bị gián đoạn liên tục | HR-05 | Chưa có story riêng – pattern Design System (UXD); đề xuất PO thêm AC |
| O-09 | Chốt điện nước từ điện thoại có ảnh công tơ, hiện trong app khách | J4 cuối tháng, J2-5 | P3, P6 | Minh bạch tiền cho khách dài hạn | BL 3.14, 5.10, 8.2 #21 | US-064, 065 – R3 |
| O-10 | Express check-out (khách tự trả phòng, **xác nhận trả 2 thẻ**, thanh toán QR) | J1-6 | P5, P7 | Giảm tải quầy giờ cao điểm | BL 3.21 (Huy); BR-427, BR-511 | BR-427 – R3 |
| O-11 | Bàn giao ca | J3 07:00, 15:00 | P2 | Kiểm soát tiền giữa hai ca (DOM); chờ H-20 (nay ưu tiên Cao) | BL câu 13 | US-124 (tổng thu ca) – R3; màn kết ca đầy đủ: ngoài MVP (PRD X3) cho tới khi có H-20 |
| O-12 | Duyệt FOC trên điện thoại | J3 10:30 | P1, quản lý | Kiểm soát thất thoát | BL 5.7, 8.2 #24 | US-007 – R2 (hạn mức: ESC-007) |

Các ý **ngoài MVP** xuất hiện trong hành trình (chỉ để ghi nhận, không đưa vào R2/R3): nhập giọng nói (J4), mã giới thiệu (J2-9), màn kết ca đầy đủ (J3 15:00, chờ H-20).

---

## 7. Lịch sử thay đổi
| Phiên bản | Ngày | Người | Nội dung |
|---|---|---|---|
| 0.1 | 15/10/2026 | UXR | Bản đầu: 4 hành trình (J1–J4) + 12 cơ hội |
| 0.2 | 15/10/2026 | UXR | Bước 4 R1: hạn khai báo theo BR-602/603, nhắc theo thời gian còn lại (J3, O-01); J3 10:30 sửa theo BR-414 (giờ mặc định = giờ chuẩn, không phụ thu); J4 dọn theo yêu cầu 100k/lần (bỏ "gói dọn"); express check-out có bước trả 2 thẻ (J1-6, O-10); J1-4 thêm kẹt ngoài cửa, khách đến sớm 04–06h; J4 thêm giao lại căn sau sửa; nhắc thị thực theo BR-605; thêm mục 4b Ngoại lệ thường gặp; mục 5 thêm cột Story/Round, ghi rõ ý ngoài MVP |
