# CPY – câu nói với khách: Bill có đêm thêm, tin gửi link check-in không tên khách, nháp gw.wifi_open

- Round 5 (v1.0.5) · Bước: Sản xuất / Review chữ khách · CPY · 07/11/2026
- Đọc: `rounds/round-05/reviews/DOM-on-arc-card-169-03.md` (mục 4), `DOM-on-sec-v5-74.md` (thẻ V574-01 phương án (b)), `DOM-on-ba-card-v574-01.md`, `BA-on-sec-v5-74.md` mục 5; `product/docs/runbook-su-co-du-lieu-khach.md` bản 1.2 (mục 3, 4, 6); `product/docs/manual/guides/02-le-tan.md` 11.1, 17.3; `product/docs/manual/user-manual-v1.0.md` 2.9, 2.14; `product/design/tools/gen_strings.py` (`msg.checkin_link`, `gw.wifi_*`); `rounds/round-05/outputs/UXD/copy-v1.0.5.md` bản 2.8; `rounds/round-05/reviews/UXD-on-fe2-prs-136-138.md` thẻ 136-05; brand guideline mục 2.
- Không có dữ liệu khách thật. Không có số hoa hồng. Số tiền trong ví dụ là "…".

## 1. Bill có đêm thêm – câu lễ tân nói với khách (đã sửa trực tiếp)

Chỗ: `guides/02-le-tan.md` 11.1 bước 4, gạch "Khách hỏi vì sao hai số khác nhau"; `user-manual-v1.0.md` 2.14 bước 4, cùng gạch.

| | EN | VI |
|---|---|---|
| Cũ (BA, theo DOM mục 4) | The amount due is … Your receipt will show each night in full. | Số cần thanh toán là … Phiếu sẽ ghi đủ từng đêm. |
| Mới | The amount due is … VND, with every night and charge included. Your receipt lists each one. | Số anh/chị cần thanh toán là … đ, đã gồm đủ các đêm và các khoản. Phiếu in ghi rõ từng khoản. |

Vì sao đổi (giữ ý DOM: đọc số Còn phải thu, phiếu in là số đúng):
- **"each night in full"** dễ nghe thành "tính đủ giá mỗi đêm", tức không giảm. Đúng ca hay gặp nhất (đêm thêm làm đơn lên bậc 7 hoặc 14 đêm), số thu lại **thấp hơn** màn. Khách có thể hiểu ngược.
- **"each night"** bỏ sót ca thấp hơn: phụ thu người của đêm thêm không phải "một đêm". "every night and charge" phủ cả hai ca mà không phải nói "phụ thu".
- Thêm đơn vị (VND / đ) cho khớp câu hoàn tiền cùng mục ("1,200,000 VND" / "1.200.000 đ"). VI thêm "anh/chị" như các câu nói ở quầy khác trong 11.1.
- Câu chỉ dẫn lễ tân: "ghi đủ từng đêm" → "ghi rõ từng đêm và từng khoản". Thêm một câu: "Nói với khách, không dùng chữ "phụ thu"." (từ hạn chế của brand; DOM mục 4 nói "phụ thu người" cho lễ tân hiểu, không phải câu cho khách).
- Không thêm câu giải thích bậc giảm hay định mức cho khách: một câu số, một câu phiếu, rồi đưa phiếu. Khách cần giải thích thêm thì phiếu in đã ghi từng dòng.

## 2. Tin gửi link check-in online không kèm tên khách (V574-01 (b)) – đã chép

Chỗ: `guides/02-le-tan.md` 17.3 bước 3 và `user-manual-v1.0.md` 2.9 bước 3, gạch con mới ngay dưới bước 3 (BA đồng ý CPY chép; ORC giao). Kèm một ghi chú HTML nguồn.

Quy tắc ghép: chỉ một biến `{link}`. **Không** `{name}`, ngày ở, số căn, mã đơn. Lời chào chung "Hello from OTTIMO" thay "Hi {name}", để người nhận vẫn biết tin từ ai mà không thấy tên khách. Một tin, một việc. Trang khách chào bằng tên sau khi mở link, nên khách thật không mất gì (DOM V574-01 (b)).

| Khóa (đề xuất) | EN (gốc) | VI | RU |
|---|---|---|---|
| `msg.checkin_link` (sửa, bỏ `{name}`) | Hello from OTTIMO. For a quicker arrival, please add your ID documents and arrival time here: {link} (about 2 minutes). This link is for your booking only; please do not forward it. | OTTIMO xin chào. Để nhận phòng nhanh hơn, bạn vui lòng gửi giấy tờ và giờ đến tại: {link} (khoảng 2 phút). Link chỉ dành cho đơn đặt phòng của bạn, xin đừng chuyển tiếp. | Здравствуйте, это OTTIMO. Чтобы заселение прошло быстрее, отправьте, пожалуйста, документы и время прибытия по ссылке: {link} (около 2 минут). Ссылка только для вашего бронирования, пожалуйста, не пересылайте её. |
| Tiêu đề email (sổ tay, chưa có khóa) | Your online check-in link – OTTIMO | Link làm thủ tục trước – OTTIMO | (dùng EN) |

Ghi chú:
- Mẫu hiện có RU (`gen_strings.py` dòng `msg.checkin_link`, 3 ngôn ngữ), nên viết đủ RU. Bỏ "!" sau "Здравствуйте" của mẫu cũ (brand: không "!").
- "ID documents", không "IDs": theo CPY `guest-reply-id-photos.md` (tránh "ID photo" = ảnh thẻ). "giấy tờ", "giờ đến", "khoảng 2 phút" giữ như mẫu cũ và trang khách.
- Câu "This link is for your booking only; please do not forward it." mới: giảm việc khách chuyển link vào nhóm gia đình. Giọng nhắc nhẹ, không cảnh báo. SEC xem có muốn giữ không (Suggestion, không chặn).
- Chọn ngôn ngữ: khách Việt VI; khách viết tiếng Nga RU; khách khác EN (như quy tắc báo giá ở 02 mục 3, khách Hàn, Trung nhận EN).
- Độ dài: EN 181 ký tự gồm `{link}`; vừa một bong bóng Zalo, không cần bản ngắn.

### FB-R5-CPY-UXD-0711-01
- Mức độ: Minor (không chặn v1.0.5; sổ tay đã chặn từ gốc vì lễ tân tự gõ tin)
- Vị trí: `product/design/tools/gen_strings.py`, khóa `msg.checkin_link` (VI, EN, RU); `product/design/content-guide.md` và `design-system.md` cùng khóa.
- Vấn đề: mẫu vẫn "Chào {name} / Hi {name} / Здравствуйте, {name}!". Hiện Desk không dùng mẫu này ở hộp link (không thấy `msg.checkin_link` trong `product/apps`), nhưng nếu sau này nối `/messages/render` thì tin sẽ có tên khách, trái runbook 1.2 và sổ tay 17.3 bước 3.
- Vì sao quan trọng: SEC xếp mức sự cố gửi nhầm theo "tin chỉ có link". Mẫu có tên làm mức Thấp không còn đúng.
- Đề xuất sửa: thay 3 chuỗi bằng bảng mục 2; ghi chú khóa "v1.0.5 – V574-01 (b), không biến tên". Test đề xuất: chuỗi `msg.checkin_link` ở mọi ngôn ngữ không chứa `{name}`, `{code}`, `{room}`, `{from}`, `{to}`; chỉ một biến `{link}`; không "!".
- Trạng thái: Open (UXD đưa vào copy-v1.0.5 bản kế tiếp; FE-A áp `gen_strings.py`)

## 3. Nháp `gw.wifi_open` (trang khách Wi-Fi mạng mở)

Tình trạng: **chưa có trong `copy-v1.0.5.md`**. Bản 2.8 mục 9.19 là `bill.total_estimate` (Bill, #169), không phải Wi-Fi. Nháp chỉ nằm ở `rounds/round-05/reviews/UXD-on-fe2-prs-136-138.md` thẻ FB-R5-UXD-FE-136-05 ("CPY duyệt trước khi dùng"). CPY duyệt nháp đó ngay để UXD chép; UXD cần **đổi số mục** khi chép (9.19 đã dùng), ví dụ 9.20.

| Khóa | Nháp UXD | Kết quả CPY | EN | VI | RU |
|---|---|---|---|---|---|
| `gw.wifi_open` | Open network, no password needed. / Mạng mở, không cần mật khẩu. / Открытая сеть, пароль не нужен. | **DUYỆT CÓ ĐIỀU KIỆN**: dùng câu CPY bên phải | No password needed. Select this network to connect. | Không cần mật khẩu. Chọn mạng này để kết nối. | Пароль не нужен. Выберите эту сеть для подключения. |

Vì sao đổi:
- "Open network" mở câu bằng chữ kỹ thuật, nghe như cảnh báo an ninh. Điện thoại của khách đã tự báo mạng không mật khẩu; trang khách không cần nhấn thêm. Câu bắt đầu bằng điều khách cần biết: không cần mật khẩu.
- Câu thứ hai nói việc cần làm, vì dòng mật khẩu (thường có nút sao chép) bị thay bằng câu này. "this network" trỏ về tên mạng ngay trên, không phụ thuộc chữ "above".
- Điều kiện: câu thay cả dòng mật khẩu, **không** đi kèm nhãn `gw.wifi_pass` ("Password") và không hiện nút `gw.wifi_copy`. Nếu FE-B giữ nhãn "Password" bên trái thì quay lại chỉ câu một ("No password needed." / "Không cần mật khẩu." / "Пароль не нужен.").
- Độ dài: EN 51, VI 45, RU 51 ký tự; xuống 2 dòng ở 320 px là được, không phải nút.
- Không trùng từ cấm; không "!", không emoji.

## 4. Người bản xứ đọc lại (RU)

1. `msg.checkin_link` RU, câu cuối "Ссылка только для вашего бронирования, пожалуйста, не пересылайте её." – rủi ro nhất: nghe cộc hay lạnh với khách Nga không; có thể cần "Эта ссылка предназначена только для вашего бронирования. Пожалуйста, не пересылайте её." (dài hơn).
2. `gw.wifi_open` RU "Выберите эту сеть для подключения." – kiểm "сеть" trong ngữ cảnh Wi-Fi tự nhiên, không phải "подключитесь к этой сети".
Không coi xong trước khi INV báo người bản xứ đã duyệt.

## 5. Cần SEC / DOM xem

- SEC: câu "do not forward" (mục 2) có giữ không; không đổi ý pháp lý nào.
- DOM: mục 2 thêm "mã đơn" vào danh sách không ghi trong tin (DOM V574-01 nêu tên, ngày ở, căn). Lý do: mã đơn không giúp khách, mà là thứ người nhận nhầm dùng để hỏi thêm. Sổ giao ca vẫn ghi theo mẫu runbook mục 6 (không đổi).

## 6. Tự kiểm

- [x] Không emoji, không "!", không IN HOA; EN dẫn, VI hỗ trợ
- [x] 0 từ cấm (không "phụ thu" với khách, không "căn hộ/apartment/апартаменты")
- [x] Số liệu: không số mới; "khoảng 2 phút" giữ như mẫu đang chạy
- [x] Câu pháp lý: không đổi; chỉ bỏ tên khách khỏi tin theo DOM/SEC
- [x] RU vào danh sách người bản xứ
- [x] Không dữ liệu khách thật

## 7. Không ESC

Không có việc phải hỏi chủ đầu tư.

| 2026-11-07 | 5 | **CPY – câu nói với khách v1.0.5.** (1) Bill có đêm thêm (guides/02 11.1 bước 4, sổ tay 2.14 bước 4): câu khách đổi thành "The amount due is … VND, with every night and charge included. Your receipt lists each one." / "Số anh/chị cần thanh toán là … đ, đã gồm đủ các đêm và các khoản. Phiếu in ghi rõ từng khoản." – bỏ "each night in full" (dễ hiểu là không giảm, trong khi ca hay gặp số thu thấp hơn màn), phủ cả ca phụ thu người mà không nói "phụ thu"; giữ ý DOM 169-03 mục 4. (2) Tin gửi link check-in online không tên khách (DOM V574-01 (b), runbook 1.2): EN/VI/RU chỉ biến {link}, "Hello from OTTIMO…", không tên, ngày ở, căn, mã đơn; đã chép guides/02 17.3 bước 3 và sổ tay 2.9 bước 3; thẻ FB-R5-CPY-UXD-0711-01 Minor sửa mẫu msg.checkin_link còn {name}. (3) gw.wifi_open: nháp UXD ở thẻ 136-05 (chưa vào copy-v1.0.5; 9.19 đã là bill.total_estimate) duyệt có điều kiện với câu "No password needed. Select this network to connect." / "Không cần mật khẩu. Chọn mạng này để kết nối." / "Пароль не нужен. Выберите эту сеть для подключения."; RU chờ người bản xứ. Không ESC | CPY | rounds/round-05/reviews/CPY-guest-lines-0711.md |
