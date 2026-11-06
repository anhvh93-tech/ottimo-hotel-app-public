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
  - **chờ SEC** xác nhận vế xóa và thứ tự (SEC đang xác nhận BA-08 song song);
  - chờ DOM, UXD review.

  Chưa dán vào sổ tay trước khi SEC xác nhận.

---

## 1. Dùng khi nào, gửi thế nào

- **Mục đích:** một tin, một việc. Cảm ơn khách, nói OTTIMO không nhận ảnh giấy tờ qua tin nhắn, nhờ khách thu hồi, chỉ cách đúng: link check-in online, hoặc mang bản gốc khi nhận phòng.
- **Lúc gửi:** ngay khi thấy tin có ảnh CCCD, hộ chiếu hay giấy tờ khác. Thứ tự như số thẻ (SEC 6.1): trả lời bằng **một tin mới**, không bấm Trả lời, không trích tin có ảnh; rồi xóa ngay ở kênh xóa được. **Chờ SEC xác nhận.**
- **Một ngôn ngữ mỗi tin, theo khách:** tiếng Việt cho khách Việt, tiếng Anh cho khách khác.
- **Chọn bản** (theo bảng kênh của INT):

| Kênh | Bản | Bỏ câu nào |
|---|---|---|
| Zalo số cơ sở, WhatsApp, Telegram, Viber | Bản A (mục 2), kênh xóa được | – |
| Email (thư mới) | Bản A | Câu 4 (email không thu hồi được) |
| SMS | Bản A | Câu 4 (SMS không thu hồi được) |
| Zalo OA, hộp thư OTA, Messenger | Bản B (mục 3), kênh không xóa được | – |

- **Câu cuối, chọn một:**
  - **5a – link check-in online:** chỉ khi đơn đã xác nhận **và** kênh này là liên hệ ghi trên đơn (sổ tay 2.9 bước 3). Gửi xong câu trả lời thì gửi link ở **tin riêng** (`msg.checkin_link`).
  - **5b – mang bản gốc:** mọi ca còn lại. Gồm: chưa có đơn, đơn chưa xác nhận, người gửi dùng số hay tài khoản không có trên đơn.
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
| 5a | We will send you our online check-in link, where you can add your ID. | Lễ tân sẽ gửi bạn link làm thủ tục trước (check-in online); bạn gửi giấy tờ qua link đó. |
| 5b | Please bring the original documents to reception when you check in. | Bạn vui lòng mang bản gốc giấy tờ tới quầy lễ tân khi nhận phòng. |

Bản để sao chép.

EN, với 5a:

> Hello {name}, thank you for getting your documents ready ahead of your stay. For your privacy, OTTIMO does not accept photos of ID documents by message or email. We will delete your photos on our side straight away. If your app allows, please recall or unsend them as well. We will send you our online check-in link, where you can add your ID.

EN, với 5b:

> Hello {name}, thank you for getting your documents ready ahead of your stay. For your privacy, OTTIMO does not accept photos of ID documents by message or email. We will delete your photos on our side straight away. If your app allows, please recall or unsend them as well. Please bring the original documents to reception when you check in.

VI, với 5a:

> Chào {name}, cảm ơn bạn đã chuẩn bị giấy tờ trước cho kỳ lưu trú. Vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn hay email. Ở phía OTTIMO, lễ tân sẽ xóa ngay ảnh bạn đã gửi. Nếu ứng dụng cho phép, bạn vui lòng thu hồi tin đó. Lễ tân sẽ gửi bạn link làm thủ tục trước (check-in online); bạn gửi giấy tờ qua link đó.

VI, với 5b:

> Chào {name}, cảm ơn bạn đã chuẩn bị giấy tờ trước cho kỳ lưu trú. Vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn hay email. Ở phía OTTIMO, lễ tân sẽ xóa ngay ảnh bạn đã gửi. Nếu ứng dụng cho phép, bạn vui lòng thu hồi tin đó. Bạn vui lòng mang bản gốc giấy tờ tới quầy lễ tân khi nhận phòng.

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

> Hello {name}, thank you for getting your documents ready ahead of your stay. For your privacy, OTTIMO does not accept photos of ID documents by message. If you can, please recall or unsend the photos. We will send you our online check-in link, where you can add your ID.

EN, với 5b:

> Hello {name}, thank you for getting your documents ready ahead of your stay. For your privacy, OTTIMO does not accept photos of ID documents by message. If you can, please recall or unsend the photos. Please bring the original documents to reception when you check in.

VI, với 5a:

> Chào {name}, cảm ơn bạn đã chuẩn bị giấy tờ trước cho kỳ lưu trú. Vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn. Nếu được, bạn vui lòng thu hồi tin có ảnh. Lễ tân sẽ gửi bạn link làm thủ tục trước (check-in online); bạn gửi giấy tờ qua link đó.

VI, với 5b:

> Chào {name}, cảm ơn bạn đã chuẩn bị giấy tờ trước cho kỳ lưu trú. Vì quyền riêng tư của bạn, OTTIMO không nhận ảnh giấy tờ qua tin nhắn. Nếu được, bạn vui lòng thu hồi tin có ảnh. Bạn vui lòng mang bản gốc giấy tờ tới quầy lễ tân khi nhận phòng.

## 4. Vì sao viết vậy

- **Câu 1 cảm ơn việc khách định làm**, không cảm ơn "tin nhắn". Khách gửi ảnh để quầy làm sẵn (DOM BA-08), nên câu ghi nhận ý tốt đó và không có ý trách.
- **"For your privacy" / "Vì quyền riêng tư của bạn"**, không dùng "for your security" như câu số thẻ, vì giấy tờ là chuyện riêng tư hơn là an toàn tiền. Không nhắc luật, không nhắc rủi ro.
- **"photos of ID documents"**, không viết "ID photos", vì "ID photo" dễ hiểu thành ảnh thẻ (ảnh chân dung). Tiếng Việt dùng "giấy tờ" như `msg.checkin_link` và trang khách.
- **"recall or unsend"** để khớp tên nút ở nhiều app: Zalo "Thu hồi"/"Recall", Messenger "Unsend", WhatsApp "Delete for everyone". Theo INT, Zalo cho thu hồi trong 24 giờ, WhatsApp trong 2 ngày. "If your app allows" / "If you can" che ca đã hết hạn.
- **5a không hứa "an toàn" hay "bảo mật" cho link.** Câu chỉ nói link là nơi gửi giấy tờ, như `msg.checkin_link`.
- **5b dùng "reception"**, thống nhất với trang khách và Lượt 3, 4 của câu số thẻ.

## 5. Cho BA (sau khi SEC xác nhận)

- **Dòng bảng tình huống:** sổ tay `user-manual-v1.0.md` 2.21 và `guides/02-le-tan.md` 16.1, ngay dưới hai dòng "Khách lỡ gửi số thẻ". Dùng chữ DOM đề xuất ở BA-08. Thay gạch "Trả lời khách: …" bằng:

  > Trả lời khách bằng câu chuẩn ở dưới bảng (CPY `guest-reply-id-photos.md`): kênh xóa được dùng bản A, Zalo OA, hộp thư OTA và Messenger dùng bản B; email và SMS bỏ câu thu hồi. Câu cuối: đơn đã xác nhận và kênh này là liên hệ trên đơn thì báo sẽ gửi link check-in online, rồi gửi link ở tin riêng (mục 2.9); còn lại mời khách mang bản gốc khi nhận phòng.

- **Đoạn để sao chép:** đặt bản A và bản B ngay dưới bảng, cạnh các câu số thẻ, đúng nguyên văn. Mỗi bản có EN và VI; câu 5a và 5b viết thành hai dòng để lễ tân chọn. Mỗi bản ghi bốn đoạn như mục 2 và 3 là dễ sao chép nhất.
- **Luật ở quầy** theo DOM BA-08, SEC xác nhận:
  - không lưu ảnh về máy, không chuyển tiếp, không tải từ chat lên Desk;
  - xóa theo cách của kênh;
  - kênh không xóa được thì để nguyên.

  Đây không phải chữ của CPY.

## 6. Quy tắc kiểm và test đề xuất (khi làm mẫu tin v1.2)

- Khóa:
  - `msg.id_photos_by_message` (bản A), `msg.id_photos_by_message_no_delete` (bản B);
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
| A, 5 câu | 343 | 341 | 337 | 314 |
| A, bỏ câu 4 (email, SMS) | 285 | 283 | 285 | 262 |
| B, 4 câu | 270 | 268 | 268 | 245 |

Mọi câu ≤ 20 chữ tiếng Anh. Câu dài nhất: câu 2 bản A, 15 chữ.

## 7. Giả định và câu cần người khác xem

1. Thứ tự "trả lời trước, xóa ngay sau" và cách xóa theo kênh dùng y như số thẻ (SEC 6.1, 6.5). **SEC xác nhận**; nếu SEC đổi thì CPY sửa câu 3 bản A.
2. "Ảnh đã gửi" gồm cả ảnh trong thư email (tệp đính kèm). Câu 3 vẫn đúng, vì email xóa được, kể cả trong Thùng rác.
3. Mỗi tin một ngôn ngữ. Khách Nga, Hàn, Trung nhận bản EN. Không có câu cần người bản xứ đọc.
4. 5a chỉ báo sẽ gửi link. Có được gửi link hay không vẫn theo sổ tay 2.9: đơn đã xác nhận, gửi tới liên hệ trên đơn.
5. Không có câu cần luật sư: câu không nói về lưu trữ, thời hạn hay căn cứ pháp lý.
