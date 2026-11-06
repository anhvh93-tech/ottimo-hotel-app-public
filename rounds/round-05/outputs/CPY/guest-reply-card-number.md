# Câu trả lời khách khi khách lỡ gửi số thẻ qua tin nhắn

- Người viết: CPY | Round 5 – bước Sản xuất | Ngày: 07/11/2026
- Nguồn:
  - SEC `rounds/round-05/responses/SEC-responses.md` mục 6, 6.1 (bản nháp nội dung, thứ tự xử lý ở quầy);
  - DOM FB-R5-DOM-BA-01;
  - brand guideline `00-brief/context/brand/brand-guidelines.md` mục 2.
- Mẫu đang có, viết theo cùng mẫu:
  - `product/design/design-system.md` 11.2 (giọng chữ khách), 11.2.1 (mẫu `msg.*`: "Hello {name}," / "Chào {name},", xưng "bạn", không "!");
  - `product/design/content-guide.md` mục 1 và 7;
  - câu chống giả danh ở sổ tay `guides/02-le-tan.md` 4.1;
  - FAQ landing: "We never ask for card numbers." / "OTTIMO không bao giờ hỏi số thẻ."
- Chỗ dùng: sổ tay `product/docs/manual/user-manual-v1.0.md` và `guides/02-le-tan.md`, dòng "Khách lỡ gửi số thẻ hoặc ảnh thẻ qua Zalo, SMS, email". BA thay chữ "(câu chuẩn: chờ CPY)" (mục 6).
- Chờ review:
  - SEC: nghĩa, mục 7;
  - UXD: giọng, chỗ in;
  - DOM: đúng vận hành ở quầy.

---

## 1. Dùng khi nào, gửi thế nào (cho lễ tân)

- **Mục đích:** một tin, một việc. Cảm ơn khách, nói OTTIMO không nhận thông tin thẻ qua tin nhắn và sẽ xóa tin, nhờ khách thu hồi, mời trả thẻ tại quầy.
- **Lúc gửi:** ngay khi thấy tin có số thẻ hoặc ảnh thẻ, **trước** khi xóa tin (thứ tự của SEC 6.1). Gửi xong thì xóa ngay, không chờ khách thu hồi. Đây là tin trả lời khách nên gửi được mọi giờ (BR-973 (4)).
- **Gửi bằng một tin mới:**
  - Zalo: không bấm **Trả lời**, không trích tin của khách;
  - WhatsApp, Telegram, Viber: không vuốt để trả lời;
  - email: **soạn thư mới** tới địa chỉ của khách, không bấm Trả lời hay Chuyển tiếp, vì cả hai đều chép lại thư cũ.
- **Một ngôn ngữ mỗi tin, theo khách** (design-system 11.2 mục 3): tiếng Việt cho khách Việt, tiếng Anh cho mọi khách khác. Không gửi hai thứ tiếng trong cùng một tin. Bản tiếng Anh là bản gốc.
- **Chọn bản:**

| Kênh | Bản | Bỏ câu nào |
|---|---|---|
| Zalo | Bản ngắn (mục 3) | – |
| WhatsApp, Telegram, Viber | Bản đầy đủ (mục 2) | – |
| Email | Bản đầy đủ, thư mới | Câu 4 (email không thu hồi được) |
| SMS | Bản đầy đủ | Câu 4 (SMS không thu hồi được) |
| Hội thoại OTA, hoặc kênh lễ tân không xóa được tin | **Chưa dùng hai bản này** | Đây là ca "không xóa được" ở SEC 6.3: gọi chủ đầu tư. Câu cho ca này ở mục 5, chờ SEC |

- **Tiêu đề thư (email):** "OTTIMO · About your message" / "OTTIMO · Về thư bạn gửi". Không ghi gì về thẻ trong tiêu đề.
- **Tên khách:** chưa rõ tên thì viết "Hello," / "Chào bạn,".
- **Xưng hô tiếng Việt:** câu chuẩn dùng "bạn" (content-guide mục 1). Khách lớn tuổi thì lễ tân đổi sang "anh/chị", đổi cho **cả tin**.
- **Không thêm gì vào câu:**
  - không nhắc lại số, 4 số cuối hay loại thẻ;
  - không giải thích rủi ro, không viết "lừa đảo", "lộ thông tin";
  - không hứa gì thêm (SEC 6.3).
- **Khách cần trả trước khi đến** (ví dụ tiền cọc): mời trả theo cách khác bằng **tin riêng, sau tin này**. Dùng mã VietQR Desk vừa tạo cho đúng đơn, kèm câu chống giả danh (sổ tay 4.1). Ở v1.0 không có link trả thẻ trực tuyến, nên không nhắc link.

## 2. Bản đầy đủ – WhatsApp, Telegram, Viber, email, SMS

| # | English (gốc) | Tiếng Việt |
|---|---|---|
| 1 | Hello {name}, thank you for getting in touch. | Chào {name}, cảm ơn bạn đã liên hệ OTTIMO. |
| 2 | For your security, OTTIMO does not accept card details by message or email. | Vì an toàn của bạn, OTTIMO không nhận thông tin thẻ qua tin nhắn hay email. |
| 3 | We will delete your message on our side straight away. | Ở phía OTTIMO, lễ tân sẽ xóa ngay tin bạn đã gửi. |
| 4 | If your app allows, please unsend it as well. | Nếu ứng dụng cho phép, bạn vui lòng thu hồi tin đó. |
| 5 | You are welcome to pay by card at our front desk, or we can suggest another way to pay. | Bạn có thể thanh toán bằng thẻ qua máy POS tại quầy, hoặc chọn cách khác theo hướng dẫn của lễ tân. |

Bản để sao chép.

EN:

> Hello {name}, thank you for getting in touch. For your security, OTTIMO does not accept card details by message or email. We will delete your message on our side straight away. If your app allows, please unsend it as well. You are welcome to pay by card at our front desk, or we can suggest another way to pay.

VI:

> Chào {name}, cảm ơn bạn đã liên hệ OTTIMO. Vì an toàn của bạn, OTTIMO không nhận thông tin thẻ qua tin nhắn hay email. Ở phía OTTIMO, lễ tân sẽ xóa ngay tin bạn đã gửi. Nếu ứng dụng cho phép, bạn vui lòng thu hồi tin đó. Bạn có thể thanh toán bằng thẻ qua máy POS tại quầy, hoặc chọn cách khác theo hướng dẫn của lễ tân.

## 3. Bản ngắn – Zalo (2 câu mỗi ngôn ngữ)

| # | English (gốc) | Tiếng Việt |
|---|---|---|
| 1 | Thank you – for your security, OTTIMO does not accept card details over chat, so we are deleting your message on our side now. | Cảm ơn bạn – vì an toàn của bạn, OTTIMO không nhận thông tin thẻ qua tin nhắn, nên lễ tân sẽ xóa ngay tin bạn đã gửi ở phía OTTIMO. |
| 2 | If you can, please recall it too; card payments are welcome at our front desk, or we can suggest another way. | Nếu được, bạn vui lòng thu hồi tin; bạn có thể thanh toán bằng thẻ qua máy POS tại quầy, hoặc theo cách lễ tân hướng dẫn. |

Bản để sao chép.

EN:

> Thank you – for your security, OTTIMO does not accept card details over chat, so we are deleting your message on our side now. If you can, please recall it too; card payments are welcome at our front desk, or we can suggest another way.

VI:

> Cảm ơn bạn – vì an toàn của bạn, OTTIMO không nhận thông tin thẻ qua tin nhắn, nên lễ tân sẽ xóa ngay tin bạn đã gửi ở phía OTTIMO. Nếu được, bạn vui lòng thu hồi tin; bạn có thể thanh toán bằng thẻ qua máy POS tại quầy, hoặc theo cách lễ tân hướng dẫn.

- "Recall" / "thu hồi" là đúng tên nút của Zalo. Bản đầy đủ dùng "unsend" vì WhatsApp, Telegram, Viber đặt tên nút khác nhau.
- Dấu "–" là gạch ngang dài (U+2013), giống các mẫu khác. Sao chép từ sổ tay, không gõ lại.

## 4. So với bản nháp của SEC (6.1)

| Câu cũ (SEC) | Vấn đề | Câu mới |
|---|---|---|
| "Thank you." / "Cảm ơn anh/chị." | Mẫu `msg.*` mở bằng "Hello {name}," / "Chào {name},". "Thank you." đứng một mình chưa rõ cảm ơn vì gì | Bản đầy đủ: "Hello {name}, thank you for getting in touch." / "Chào {name}, cảm ơn bạn đã liên hệ OTTIMO." Bản Zalo giữ "Thank you" ở đầu câu 1, cho gọn |
| "…does not accept card details by message." | Chưa nói tới email, mà sổ tay ghi cả email | Bản đầy đủ: "…by message or email." / "…qua tin nhắn hay email." |
| "We will delete your message on our side; please also recall it if you can." | Hai việc trong một câu. Thiếu chữ "ngay" của SEC ("xóa ngay, không chờ") | Tách làm câu 3 và câu 4, thêm "straight away" / "ngay" |
| "recall" | Chỉ Zalo gọi nút này là "Recall" | Zalo giữ "recall" / "thu hồi". Kênh khác dùng "unsend" |
| "You are welcome to pay by card at our front desk terminal." | "terminal" là chữ kỹ thuật. Chưa có vế "hoặc theo cách lễ tân hướng dẫn" (ORC giao), nên khách cần trả cọc trước khi đến không biết làm gì | "You are welcome to pay by card at our front desk, or we can suggest another way to pay." Bản tiếng Việt giữ "máy POS" vì khách Việt quen chữ này |
| "anh/chị" | Mẫu tin dùng "bạn" (content-guide mục 1) | "bạn". Lễ tân đổi sang "anh/chị" cho cả tin khi cần |
| ORC giao ý "đã xóa tin" | SEC 6.1 bảo gửi trả lời **trước**, xóa **ngay sau**. Lúc gửi tin, tin của khách chưa bị xóa, nên viết "đã xóa" là chưa đúng | Bản đầy đủ: "We will delete … straight away" / "sẽ xóa ngay". Bản Zalo: "we are deleting … now" / "sẽ xóa ngay". Nếu SEC đổi thứ tự (xóa trước, trả lời sau) thì CPY sửa thành "We have deleted…" / "…đã xóa…" |

Giữ nguyên ý SEC đã duyệt:
- không nhận thông tin thẻ qua tin nhắn;
- xóa ở phía OTTIMO, nhờ khách thu hồi;
- trả thẻ tại quầy.

Không thêm lời hứa nào. "On our side" / "ở phía OTTIMO" giữ đúng phạm vi: OTTIMO xóa trên máy và tài khoản của mình, không nói là tin đã mất khỏi Zalo hay máy của khách.

## 5. Ca không xóa được tin – chưa dùng, chờ SEC

Nhiều hộp thư OTA không cho cơ sở xóa tin khách gửi. CPY chưa biết OA Manager có cho xóa tin khách gửi hay không: INT kiểm. Gặp kênh như vậy thì vế "sẽ xóa" trong mục 2 và 3 là lời hứa không làm được. Theo SEC 6.3 đây là ca bất thường số 3: lễ tân gọi chủ đầu tư. Bản đề xuất bỏ vế xóa, phần còn lại giữ nguyên:

| | English (gốc) | Tiếng Việt |
|---|---|---|
| Đề xuất | Thank you – for your security, OTTIMO does not accept card details by message. If you can, please recall or unsend your message; card payments are welcome at our front desk, or we can suggest another way. | Cảm ơn bạn – vì an toàn của bạn, OTTIMO không nhận thông tin thẻ qua tin nhắn. Nếu được, bạn vui lòng thu hồi tin; bạn có thể thanh toán bằng thẻ qua máy POS tại quầy, hoặc theo cách lễ tân hướng dẫn. |

Khi SEC duyệt, BA mới đưa bản này vào sổ tay. Trước đó, gặp ca này: lễ tân gọi chủ đầu tư theo SEC 6.3 và hỏi nên nhắn khách thế nào.

## 6. Cho BA: chữ dán vào sổ tay

Thay "(câu chuẩn: chờ CPY)" ở `guides/02-le-tan.md` (dòng "Khách lỡ gửi số thẻ…") và `user-manual-v1.0.md` (dòng tương ứng) bằng:

> (câu chuẩn ở dưới bảng; Zalo dùng bản ngắn; email soạn thư mới, email và SMS bỏ câu thu hồi; hội thoại OTA chưa dùng, gọi chủ đầu tư)

Đặt bốn đoạn để sao chép ở mục 2 và 3 (EN, VI mỗi bản) ngay dưới bảng tình huống, đúng nguyên văn. Thêm một dòng nhắc:

> Gửi một ngôn ngữ: tiếng Việt cho khách Việt, tiếng Anh cho khách khác. Gửi tin mới, không bấm Trả lời. Gửi xong thì xóa ngay tin của khách, không chờ khách thu hồi.

Nếu in lên Tờ 1 (quầy lễ tân): chỉ in bản ngắn mục 3, hai thứ tiếng. UXD chốt chỗ và cỡ chữ.

## 7. Quy tắc kiểm và test đề xuất

Ở v1.0 chưa có màn mẫu tin (mẫu tin dự kiến v1.2). Lễ tân sao chép câu từ sổ tay. Khi làm mẫu ở v1.2 (US-125), đề xuất:
- Khóa: `msg.card_by_message` (bản đầy đủ), `msg.card_by_message_short` (bản Zalo). Bản ở mục 5 thì thêm khóa `msg.card_by_message_no_delete` sau khi SEC duyệt.
- Biến: chỉ `{name}` (bản đầy đủ). Không có biến nào chứa thẻ, số tiền hay link.
- Test:
  - chuỗi không chứa chữ số `[0-9]`;
  - không "!", không emoji;
  - không viết hoa cả chữ, trừ "OTTIMO" và "POS";
  - không chứa từ cấm (danh sách `BANNED` của landing);
  - bản EN chứa "OTTIMO does not accept card details", bản VI chứa "OTTIMO không nhận thông tin thẻ".

Số đo (đếm bằng script; `{name}` tính 6 ký tự):

| Bản | EN | VI |
|---|---|---|
| Đầy đủ, 5 câu | 310 ký tự | 320 ký tự |
| Đầy đủ, bỏ câu 4 (email, SMS) | 264 ký tự | 268 ký tự |
| Zalo, 2 câu | 236 ký tự | 253 ký tự |

- Gửi bằng SMS: bản tiếng Việt có dấu nên tách thành nhiều tin SMS (khoảng 70 ký tự một tin). Điện thoại tự ghép lại; chấp nhận được.
- Câu dài nhất tính bằng chữ tiếng Anh: câu 1 bản Zalo, 23 chữ. Dài hơn mốc 20 chữ của content-guide một chút, để giữ trong 2 câu như ORC giao. Mọi câu ở bản đầy đủ ≤ 20 chữ.

## 8. Giả định

1. Gửi một ngôn ngữ theo khách (design-system 11.2 mục 3). Khách Nga, Hàn, Trung nhận bản tiếng Anh. Lượt này không viết RU/KO/ZH, nên không có câu nào cần người bản xứ đọc.
2. "Cách khác" là các cách đang chạy ở v1.0, gửi bằng tin riêng: VietQR do Desk tạo (cọc), tiền mặt, chuyển khoản. Không có link trả thẻ trực tuyến.
3. Xưng "bạn" theo content-guide. Lễ tân được đổi sang "anh/chị" cho cả tin.
4. "Thông tin thẻ" / "card details" gồm cả ảnh thẻ, nên không cần câu riêng cho ảnh.

## 9. Tự kiểm của CPY

- [x] Đúng guideline: tiếng Anh dẫn, không emoji, không "!", không IN HOA để nhấn, giọng điềm tĩnh. Không hù dọa (không "lừa đảo", "rủi ro", "lộ"), không đổ lỗi (không "bạn không nên gửi").
- [x] Không có từ cấm, không nêu số căn, không có giá.
- [x] Lời hứa khớp quy trình SEC: xóa ở phía OTTIMO, ngay sau khi trả lời; trả thẻ tại quầy; cách khác do lễ tân hướng dẫn. Ca không xóa được tách riêng (mục 5).
- [x] Giữ ba ý SEC đã duyệt. Không khẳng định "tuân thủ".
- [x] Câu cần SEC xem: thì "sẽ xóa" thay cho "đã xóa"; câu cho ca không xóa được (mục 5); chữ "unsend" / "recall". Không có câu cần luật sư.
- [x] Không có câu ko/zh/ru mới.
