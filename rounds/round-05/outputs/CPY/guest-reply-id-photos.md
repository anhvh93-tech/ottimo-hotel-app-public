# Câu trả lời khách khi khách gửi ảnh giấy tờ qua tin nhắn

- Người viết: CPY | Round 5 – bước Phản hồi & sửa | Ngày: 07/11/2026
- Nguồn:
  - DOM `rounds/round-05/reviews/DOM-on-ba-v105-docs.md` mục 5, thẻ FB-R5-DOM-BA-08 (`b0fa79ff`);
  - BA lượt 4 (`da596507`);
  - INT `rounds/round-05/outputs/INT/message-deletion-by-channel.md` (kênh xóa được, kênh không xóa được);
  - SEC `rounds/round-05/responses/SEC-responses.md` 6.1 và 6.5 (cách làm với số thẻ, dùng làm khuôn);
  - BR-972 (không nhận ảnh giấy tờ qua chat, dẫn khách sang link check-in online);
  - `product/docs/integrations/zalo-oa.md` (khách đã gửi thì nhắc khách thu hồi).
- Viết theo cùng khuôn với `guest-reply-card-number.md`:
  - ba ý: cảm ơn; không nhận và (ở kênh xóa được) xóa; mời thu hồi và chỉ cách đúng;
  - "Hello {name}," / "Chào {name},", xưng "bạn", "reception";
  - chữ trang khách: "Online check-in" / "Làm thủ tục trước (check-in online)".
- Trạng thái:
  - **SEC xác nhận 07/11** (`SEC-responses.md` mục 6.6): "sẽ xóa", không "đã xóa"; trả lời trước, xóa ngay sau; chỉ hai lối; ba bản theo kênh;
  - chờ DOM, UXD review giọng và vận hành.
- Lượt sửa: Lượt 2 ở cuối tệp.

---

## 1. Dùng khi nào, gửi thế nào

- **Mục đích:** một tin, một việc. Cảm ơn khách, nói OTTIMO không nhận ảnh giấy tờ qua tin nhắn, nhờ khách thu hồi, chỉ cách đúng: link check-in online, hoặc mang bản gốc khi nhận phòng.
- **Lúc gửi:** ngay khi thấy tin có ảnh CCCD, hộ chiếu hay giấy tờ khác. Thứ tự như số thẻ (SEC 6.5.1, 6.6 (b)): trả lời bằng **một tin mới**, không bấm Trả lời, không trích tin có ảnh; rồi xóa ngay ở kênh xóa được.
- **Một ngôn ngữ mỗi tin, theo khách:** tiếng Việt cho khách Việt, tiếng Anh cho khách khác.
- **Chọn bản** (theo bảng kênh của INT):

| Kênh | Bản | Bỏ câu nào |
|---|---|---|
| WhatsApp, Telegram, Viber | Bản A, bản đầy đủ (mục 2) | – |
| Email (thư mới) | Bản A | Câu 4 (email không thu hồi được) |
| SMS | Bản A | Câu 4 (SMS không thu hồi được) |
| Zalo số cơ sở | Bản ngắn (mục 2a) | – |
| Zalo OA, hộp thư OTA, Messenger | Bản B (mục 3), kênh không xóa được | – |

- **Câu cuối, chọn một.** Chỉ hai lối (SEC 6.6 (b)):
  - **5a – đơn đã xác nhận:** báo sẽ gửi link check-in online. Lễ tân gửi link **riêng 1–1** theo `02` 17.3, tới liên hệ ghi trên đơn, ở **tin riêng** (`msg.checkin_link`). Người nhắn dùng số khác số trên đơn thì link vẫn chỉ đi tới liên hệ trên đơn (sổ tay 2.9 bước 3).
  - **5b – đơn chưa xác nhận, hoặc chưa có đơn:** mời khách mang bản gốc khi nhận phòng.
  - Không mời khách gửi lại qua kênh chat khác.
- **Tiêu đề thư (email):** "OTTIMO · About your message" / "OTTIMO · Về thư bạn gửi", như câu số thẻ.
- **Không thêm gì vào câu:**
  - không nhắc lại số giấy tờ, tên trên giấy tờ hay quốc tịch;
  - không viết "luật", "Nghị định", "rủi ro";
  - không hứa giữ hay không giữ bản gốc lúc nhận phòng.

## 2. Bản A – kênh xóa được (Zalo số cơ sở, WhatsApp, Telegram, Viber, email, SMS)

| # | English (gốc) | Tiếng Việt |
|---|---|---|
| 1 | Hello {name}, thank you for getting your documents ready ahead of your stay. | Chào {name}, cảm ơn bạn đã chuẩn bị giấy tờ trước cho kỳ lưu trú. |
| 2 | For your privacy, OTTIMO does not accept photos of ID documents by message or email. | Vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn hay email. |
| 3 | We will delete your photos on our side straight away. | Ở phía OTTIMO, lễ tân sẽ xóa ngay ảnh bạn đã gửi. |
| 4 | If your app allows, please recall or unsend them as well. | Nếu ứng dụng cho phép, bạn vui lòng thu hồi tin đó. |
| 5a | We will send your personal online check-in link to the contact details in your booking. You can add your ID there. | Lễ tân sẽ gửi riêng cho bạn link làm thủ tục trước (check-in online), qua liên hệ trong đơn đặt phòng. Bạn gửi giấy tờ qua link đó. |
| 5b | Please bring the original documents to reception when you check in. | Bạn vui lòng mang bản gốc giấy tờ tới quầy lễ tân khi nhận phòng. |

Bản để sao chép.

EN, với 5a:

> Hello {name}, thank you for getting your documents ready ahead of your stay. For your privacy, OTTIMO does not accept photos of ID documents by message or email. We will delete your photos on our side straight away. If your app allows, please recall or unsend them as well. We will send your personal online check-in link to the contact details in your booking. You can add your ID there.

EN, với 5b:

> Hello {name}, thank you for getting your documents ready ahead of your stay. For your privacy, OTTIMO does not accept photos of ID documents by message or email. We will delete your photos on our side straight away. If your app allows, please recall or unsend them as well. Please bring the original documents to reception when you check in.

VI, với 5a:

> Chào {name}, cảm ơn bạn đã chuẩn bị giấy tờ trước cho kỳ lưu trú. Vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn hay email. Ở phía OTTIMO, lễ tân sẽ xóa ngay ảnh bạn đã gửi. Nếu ứng dụng cho phép, bạn vui lòng thu hồi tin đó. Lễ tân sẽ gửi riêng cho bạn link làm thủ tục trước (check-in online), qua liên hệ trong đơn đặt phòng. Bạn gửi giấy tờ qua link đó.

VI, với 5b:

> Chào {name}, cảm ơn bạn đã chuẩn bị giấy tờ trước cho kỳ lưu trú. Vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn hay email. Ở phía OTTIMO, lễ tân sẽ xóa ngay ảnh bạn đã gửi. Nếu ứng dụng cho phép, bạn vui lòng thu hồi tin đó. Bạn vui lòng mang bản gốc giấy tờ tới quầy lễ tân khi nhận phòng.

## 2a. Bản ngắn – Zalo số cơ sở (2 câu mỗi ngôn ngữ)

Cùng ý với bản A, viết gọn cho chat, như bản ngắn của câu số thẻ. Câu 2 có hai dạng: 5a (đơn đã xác nhận) và 5b (chưa xác nhận).

| # | English (gốc) | Tiếng Việt |
|---|---|---|
| 1 | Thank you – for your privacy, OTTIMO does not accept photos of your ID over chat, so we will delete them on our side. | Cảm ơn bạn – vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn, nên lễ tân sẽ xóa ngay ảnh bạn đã gửi ở phía OTTIMO. |
| 2 (5a) | Please recall them too if you can; we will send your personal online check-in link to the contact details in your booking. | Nếu được, bạn vui lòng thu hồi tin; lễ tân sẽ gửi riêng cho bạn link check-in online qua liên hệ trong đơn đặt phòng. |
| 2 (5b) | Please recall them too if you can, and bring the original documents to reception when you check in. | Nếu được, bạn vui lòng thu hồi tin, và mang bản gốc giấy tờ tới quầy lễ tân khi nhận phòng. |

Bản để sao chép.

EN, với 5a:

> Thank you – for your privacy, OTTIMO does not accept photos of your ID over chat, so we will delete them on our side. Please recall them too if you can; we will send your personal online check-in link to the contact details in your booking.

EN, với 5b:

> Thank you – for your privacy, OTTIMO does not accept photos of your ID over chat, so we will delete them on our side. Please recall them too if you can, and bring the original documents to reception when you check in.

VI, với 5a:

> Cảm ơn bạn – vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn, nên lễ tân sẽ xóa ngay ảnh bạn đã gửi ở phía OTTIMO. Nếu được, bạn vui lòng thu hồi tin; lễ tân sẽ gửi riêng cho bạn link check-in online qua liên hệ trong đơn đặt phòng.

VI, với 5b:

> Cảm ơn bạn – vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn, nên lễ tân sẽ xóa ngay ảnh bạn đã gửi ở phía OTTIMO. Nếu được, bạn vui lòng thu hồi tin, và mang bản gốc giấy tờ tới quầy lễ tân khi nhận phòng.

- "Photos of your ID" (gọn hơn "photos of ID documents") vẫn không bị hiểu thành ảnh chân dung.
- "Recall" là tên nút của Zalo.

## 3. Bản B – kênh không xóa được (Zalo OA, hộp thư OTA, Messenger)

Bỏ vế xóa, như bản mục 5 của câu số thẻ (SEC 6.5.2): ở các kênh này phía OTTIMO không có thao tác xóa tin khách gửi. Câu 2 bỏ "hay email".

| # | English (gốc) | Tiếng Việt |
|---|---|---|
| 1 | Hello {name}, thank you for getting your documents ready ahead of your stay. | Chào {name}, cảm ơn bạn đã chuẩn bị giấy tờ trước cho kỳ lưu trú. |
| 2 | For your privacy, OTTIMO does not accept photos of ID documents by message. | Vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn. |
| 3 | If you can, please recall or unsend the photos. | Nếu được, bạn vui lòng thu hồi tin có ảnh. |
| 4 | 5a hoặc 5b như mục 2 | 5a hoặc 5b như mục 2 |

Bản để sao chép.

EN, với 5a:

> Hello {name}, thank you for getting your documents ready ahead of your stay. For your privacy, OTTIMO does not accept photos of ID documents by message. If you can, please recall or unsend the photos. We will send your personal online check-in link to the contact details in your booking. You can add your ID there.

EN, với 5b:

> Hello {name}, thank you for getting your documents ready ahead of your stay. For your privacy, OTTIMO does not accept photos of ID documents by message. If you can, please recall or unsend the photos. Please bring the original documents to reception when you check in.

VI, với 5a:

> Chào {name}, cảm ơn bạn đã chuẩn bị giấy tờ trước cho kỳ lưu trú. Vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn. Nếu được, bạn vui lòng thu hồi tin có ảnh. Lễ tân sẽ gửi riêng cho bạn link làm thủ tục trước (check-in online), qua liên hệ trong đơn đặt phòng. Bạn gửi giấy tờ qua link đó.

VI, với 5b:

> Chào {name}, cảm ơn bạn đã chuẩn bị giấy tờ trước cho kỳ lưu trú. Vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn. Nếu được, bạn vui lòng thu hồi tin có ảnh. Bạn vui lòng mang bản gốc giấy tờ tới quầy lễ tân khi nhận phòng.

## 4. Vì sao viết vậy

- **Câu 1 cảm ơn việc khách định làm**, không cảm ơn "tin nhắn". Khách gửi ảnh để quầy làm sẵn (DOM BA-08), nên câu ghi nhận ý tốt đó và không có ý trách.
- **"For your privacy" / "Vì quyền riêng tư của bạn"**, không dùng "for your security" như câu số thẻ, vì giấy tờ là chuyện riêng tư hơn là an toàn tiền. Không nhắc luật, không nhắc rủi ro.
- **"photos of ID documents"**, không viết "ID photos", vì "ID photo" dễ hiểu thành ảnh thẻ (ảnh chân dung). Tiếng Việt dùng "giấy tờ" như `msg.checkin_link` và trang khách.
- **"recall or unsend"** để khớp tên nút ở nhiều app: Zalo "Thu hồi"/"Recall", Messenger "Unsend", WhatsApp "Delete for everyone". Theo INT, Zalo cho thu hồi trong 24 giờ, WhatsApp trong 2 ngày. "If your app allows" / "If you can" che ca đã hết hạn.
- **5a nói "personal" / "riêng cho bạn"**, không nói "secure" / "bảo mật". Link gắn với đơn và gửi 1–1 (SEC 6.6), nên "personal" đúng; "secure" là lời hứa về kỹ thuật mà CPY không chốt được. Câu cũng nói link đi tới liên hệ trên đơn, để khách nhắn từ số khác không chờ link ở cuộc chat này.
- **5b dùng "reception"**, thống nhất với trang khách và Lượt 3, 4 của câu số thẻ.

## 5. Cho BA (sau khi SEC xác nhận)

- **Dòng bảng tình huống:** sổ tay `user-manual-v1.0.md` 2.21 và `guides/02-le-tan.md` 16.1, ngay dưới hai dòng "Khách lỡ gửi số thẻ". Dùng chữ DOM đề xuất ở BA-08. Thay gạch "Trả lời khách: …" bằng:

  > Trả lời khách bằng câu chuẩn ở dưới bảng (CPY `guest-reply-id-photos.md`): WhatsApp, Telegram, Viber, email, SMS dùng bản đầy đủ (email và SMS bỏ câu thu hồi); Zalo số cơ sở dùng bản ngắn; Zalo OA, hộp thư OTA và Messenger dùng bản không có vế xóa. Câu cuối chỉ hai lối: đơn đã xác nhận thì báo sẽ gửi link check-in online, rồi gửi riêng 1–1 tới liên hệ trên đơn ở tin riêng (`02` 17.3, mục 2.9); đơn chưa xác nhận hoặc chưa có đơn thì mời khách mang bản gốc khi nhận phòng.

- **Đoạn để sao chép:** đặt bản A, bản ngắn và bản B ngay dưới bảng, cạnh các câu số thẻ, đúng nguyên văn. Mỗi bản ghi bốn đoạn (EN, VI; 5a, 5b) như mục 2, 2a và 3, tổng 12 đoạn.
- **Luật ở quầy:** theo DOM BA-08 và SEC 6.6 (1)–(3). Gồm:
  - mọi máy của cơ sở;
  - không tải về, không chụp màn hình;
  - xóa theo kênh như dòng số thẻ;
  - ca thường không ghi sổ, không báo;
  - ca bất thường gọi chủ đầu tư như 6.3.

  Đây không phải chữ của CPY.

## 6. Quy tắc kiểm và test đề xuất (khi làm mẫu tin v1.2)

- Khóa:
  - `msg.id_photos_by_message` (bản A), `msg.id_photos_by_message_short` (bản ngắn), `msg.id_photos_by_message_no_delete` (bản B);
  - câu cuối là khóa con `…_close_link` (5a) và `…_close_original` (5b).
- Biến: chỉ `{name}`. Link check-in đi ở tin riêng (`msg.checkin_link`), không ghép vào mẫu này.
- Test:
  - không chữ số;
  - không "!", không emoji;
  - không chứa "CCCD", "passport number", "số giấy tờ";
  - bản B không chứa "delete" / "xóa".

Số đo (đếm bằng script; `{name}` tính 6 ký tự):

| Bản | EN 5a | EN 5b | VI 5a | VI 5b |
|---|---|---|---|---|
| A, đầy đủ | 388 | 341 | 380 | 314 |
| A, bỏ câu 4 (email, SMS) | 330 | 283 | 328 | 262 |
| Ngắn, Zalo số cơ sở | 240 | 217 | 254 | 228 |
| B, không có vế xóa | 315 | 268 | 311 | 245 |

Bản A và bản B: mọi câu ≤ 20 chữ tiếng Anh. Bản ngắn: câu 1 dài 23 chữ, câu 2 (5a) 21 chữ, để giữ trong 2 câu như bản ngắn của câu số thẻ.

## 7. Giả định và câu cần người khác xem

1. Thứ tự "trả lời trước, xóa ngay sau" và cách xóa theo kênh dùng y như số thẻ. SEC đã xác nhận (6.6 (b)).
2. "Ảnh đã gửi" gồm cả ảnh trong thư email (tệp đính kèm). Câu 3 vẫn đúng, vì email xóa được, kể cả trong Thùng rác.
3. Mỗi tin một ngôn ngữ. Khách Nga, Hàn, Trung nhận bản EN. Không có câu cần người bản xứ đọc.
4. 5a chỉ báo sẽ gửi link. Gửi theo `02` 17.3 và sổ tay 2.9: đơn đã xác nhận, gửi riêng 1–1 tới liên hệ trên đơn.
5. Không có câu cần luật sư: câu không nói về lưu trữ, thời hạn hay căn cứ pháp lý.

---

## Lượt 2 – theo SEC 6.6 (FB-R5-DOM-BA-08)

- Nguồn:
  - SEC `rounds/round-05/responses/SEC-responses.md` mục 6.6;
  - ORC giao 07/11.
- SEC xác nhận:
  - "sẽ xóa" / "will delete", không "đã xóa";
  - trả lời trước, xóa ngay sau.

  Câu 3 bản A giữ nguyên. Đầu tệp và mục 1 bỏ "chờ SEC".
- **Chỉ hai lối** (SEC 6.6 (b)): 5a cho đơn đã xác nhận, 5b cho đơn chưa xác nhận hoặc chưa có đơn. Bỏ điều kiện cũ "kênh này là liên hệ ghi trên đơn". Link luôn đi riêng 1–1 tới liên hệ trên đơn (`02` 17.3), nên khách nhắn từ số khác vẫn thuộc lối 5a.
- **Câu 5a viết lại** ở bản A, bản B và bảng:
  - cũ: "We will send you our online check-in link, where you can add your ID." / "Lễ tân sẽ gửi bạn link làm thủ tục trước (check-in online); bạn gửi giấy tờ qua link đó.";
  - mới: "We will send your personal online check-in link to the contact details in your booking. You can add your ID there." / "Lễ tân sẽ gửi riêng cho bạn link làm thủ tục trước (check-in online), qua liên hệ trong đơn đặt phòng. Bạn gửi giấy tờ qua link đó.";
  - lý do: nói rõ link đi riêng và đi tới đâu, đúng "gửi riêng 1–1".
- **Thêm bản ngắn cho Zalo số cơ sở** (mục 2a), để có đủ ba bản theo kênh như câu số thẻ (SEC 6.6, việc cho CPY). Bảng "Chọn bản" ở mục 1 tách Zalo số cơ sở khỏi bản A.
- Mục 4, 5, 6, 7 cập nhật theo các điểm trên: lý do chữ "personal", chữ dán cho BA, khóa `msg.id_photos_by_message_short`, số đo.
- Không mời khách gửi lại qua kênh chat khác: cả ba bản đều không có câu như vậy.
