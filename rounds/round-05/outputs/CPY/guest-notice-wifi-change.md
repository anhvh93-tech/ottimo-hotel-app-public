# Tin báo khách đang ở khi OTTIMO đổi mật khẩu Wi-Fi

- Người viết: CPY | Round 5 – bước Phản hồi & sửa | Ngày: 07/11/2026
- Nguồn:
  - bước 4 trong khối "[Chờ xác nhận – Wi-Fi trên Desk vào v1.0.5]" (bản nháp của BA): sổ tay `product/docs/manual/user-manual-v1.0.md` 1.4 và `guides/01-chu-dau-tu-quan-ly.md` 9.2, commit `d467578b`, `df271ee7`;
  - DOM `rounds/round-05/reviews/DOM-on-be-pr-120-v5-58.md` (FB-R5-DOM-BA-120-02);
  - BR-012 (7) (một mạng chung, mật khẩu do chủ đầu tư nhập), BR-808 (thẻ Wi-Fi trong phòng), BR-973, BR-974;
  - brand guideline mục 2.
- Viết theo mẫu đang có:
  - mẫu `msg.*` (design-system 11.2.1): "Hello {name}," / "Chào {name},", xưng "bạn", không "!";
  - chữ trên trang khách: tab "My stay" / "Lưu trú", "Back to my stay" / "Về trang lưu trú", và "reception" như các chuỗi trang khách khác (`gw.wifi_ask_desk`).
- Chỗ dùng: BA thay câu ở bước 4 của khối trên.
- Review:
  - DOM đã review 07/11 (`b0fa79ff`, FB-R5-DOM-BA-05): giữ câu 4, chốt giờ đổi, thêm vế loại trừ ở mục 1 (Lượt 2);
  - còn chờ UXD (giọng).

  Không có câu về dữ liệu khách, nên không cần SEC duyệt nghĩa.

---

## 1. Dùng khi nào, gửi thế nào

- **Mục đích:** một tin, một việc. Báo mật khẩu Wi-Fi đã đổi, chỉ chỗ xem mật khẩu mới, báo thẻ trong phòng sẽ được thay.
- **Lúc gửi:** ngay sau bước 3, tức là bộ phát đã đổi, Desk đã lưu và trang khách đã kiểm. Giờ đổi là 13:00–17:00 (DOM BA-05). Gửi cho **mọi khách đang ở**, kể cả khách dài hạn, qua kênh đang dùng với từng khách. **Không gửi** cho:
  - khách đi hôm nay, kể cả trả muộn;
  - khách nhận phòng sau giờ đổi;
  - đơn hôm nay đã có 2 tin chủ động (trần BR-974).

  Các khách này được báo ở quầy khi hỏi; lễ tân ghi sổ giao ca mã đơn. Một đơn nhiều phòng: gửi một tin cho người liên hệ của đơn. Chủ đầu tư quyết đổi gấp ngoài khung giờ: tin này là tin sự cố, gửi ngay.
- **Một ngôn ngữ mỗi tin, theo khách:** tiếng Việt cho khách Việt, tiếng Anh cho khách khác. Bản tiếng Anh là bản gốc.
- **Chọn bản:**
  - Zalo (OA hoặc số cơ sở): bản ngắn (mục 3);
  - WhatsApp, Telegram, Viber, email, SMS, hộp thư OTA: bản đầy đủ (mục 2).
- **Tiêu đề thư (email):** "OTTIMO · Wi-Fi password updated" / "OTTIMO · Mật khẩu Wi-Fi mới".
- **Không ghi trong tin:**
  - mật khẩu, kể cả mật khẩu cũ;
  - link trang khách: link chỉ hiện một lần khi cấp, gửi lại tức là cấp link mới (rbac D25);
  - tên phòng hay số căn.

  Khách cần mật khẩu ngay thì lễ tân đọc trên Desk, tại quầy hoặc qua điện thoại.
- **Trước khi Wi-Fi trên Desk lên bản:** trang khách vẫn ghi "hỏi lễ tân". Nếu phải đổi mật khẩu trước mốc đó, câu 3 bản đầy đủ thay bằng "Please ask reception for the new password." / "Bạn vui lòng hỏi lễ tân mật khẩu mới." Bản Zalo bỏ vế "please reopen your stay page to see it, or" / "bạn vui lòng mở lại trang lưu trú để xem, hoặc".

## 2. Bản đầy đủ – WhatsApp, Telegram, Viber, email, SMS, hộp thư OTA

| # | English (gốc) | Tiếng Việt |
|---|---|---|
| 1 | Hello {name}, we have updated the Wi-Fi password at OTTIMO. | Chào {name}, OTTIMO vừa đổi mật khẩu Wi-Fi. |
| 2 | Your devices will need the new password to reconnect. | Thiết bị của bạn cần mật khẩu mới để kết nối lại. |
| 3 | Please reopen your stay page to see it, or ask reception. | Bạn vui lòng mở lại trang lưu trú để xem, hoặc hỏi lễ tân. |
| 4 | We will also replace the Wi-Fi card in your room; until then, it shows the previous password. | OTTIMO sẽ thay thẻ Wi-Fi trong phòng; trước khi thay, thẻ vẫn ghi mật khẩu cũ. |
| 5 | Thank you for your understanding. | Cảm ơn bạn đã thông cảm. |

Bản để sao chép.

EN:

> Hello {name}, we have updated the Wi-Fi password at OTTIMO. Your devices will need the new password to reconnect. Please reopen your stay page to see it, or ask reception. We will also replace the Wi-Fi card in your room; until then, it shows the previous password. Thank you for your understanding.

VI:

> Chào {name}, OTTIMO vừa đổi mật khẩu Wi-Fi. Thiết bị của bạn cần mật khẩu mới để kết nối lại. Bạn vui lòng mở lại trang lưu trú để xem, hoặc hỏi lễ tân. OTTIMO sẽ thay thẻ Wi-Fi trong phòng; trước khi thay, thẻ vẫn ghi mật khẩu cũ. Cảm ơn bạn đã thông cảm.

## 3. Bản ngắn – Zalo (2 câu mỗi ngôn ngữ)

| # | English (gốc) | Tiếng Việt |
|---|---|---|
| 1 | Hello {name}, we have updated the Wi-Fi password at OTTIMO – please reopen your stay page to see it, or ask reception. | Chào {name}, OTTIMO vừa đổi mật khẩu Wi-Fi – bạn vui lòng mở lại trang lưu trú để xem, hoặc hỏi lễ tân. |
| 2 | The Wi-Fi card in your room shows the previous password until we replace it. | Thẻ Wi-Fi trong phòng vẫn ghi mật khẩu cũ cho tới khi OTTIMO thay thẻ mới. |

Bản để sao chép.

EN:

> Hello {name}, we have updated the Wi-Fi password at OTTIMO – please reopen your stay page to see it, or ask reception. The Wi-Fi card in your room shows the previous password until we replace it.

VI:

> Chào {name}, OTTIMO vừa đổi mật khẩu Wi-Fi – bạn vui lòng mở lại trang lưu trú để xem, hoặc hỏi lễ tân. Thẻ Wi-Fi trong phòng vẫn ghi mật khẩu cũ cho tới khi OTTIMO thay thẻ mới.

## 4. So với bản nháp của BA (bước 4)

| Câu cũ (BA) | Vấn đề | Câu mới |
|---|---|---|
| "The new Wi-Fi password is now on your guest page." / "Mật khẩu Wi-Fi mới đã có trên trang khách." | (1) Khách không biết "guest page": trang khách hiện tab "My stay" / "Lưu trú". (2) Không có lối cho khách chưa có link trang khách, hoặc đang mất Wi-Fi mà không có dữ liệu di động. (3) Không báo thiết bị phải kết nối lại. (4) Bước 5 thay thẻ trong phòng có khách lúc dọn phòng, nên khi tin đi thì thẻ vẫn ghi mật khẩu cũ. Khách đọc thẻ sẽ tưởng tin sai | Câu 1 báo đã đổi; câu 2 báo cần kết nối lại; câu 3 chỉ "stay page" hoặc "reception"; câu 4 báo thẻ trong phòng sẽ được thay và tới lúc đó còn ghi mật khẩu cũ |
| (không có lời chào, lời cảm ơn) | Tin chủ động gửi khách nên mở bằng "Hello {name}," như mẫu `msg.*` | Thêm lời chào; bản đầy đủ kết bằng "Thank you for your understanding." |

ORC gợi ý mời khách xem thẻ Wi-Fi trong phòng. CPY **không** viết vậy: theo bước 5, thẻ trong phòng có khách chỉ được thay lúc dọn, nên lúc tin đi thẻ vẫn ghi mật khẩu cũ. Câu 4 nói thẳng điều này, để khách không thử mật khẩu cũ.

## 5. Kiểm lời hứa

- "we have updated" / "vừa đổi": đúng, vì tin gửi sau bước 2 và 3.
- "on your stay page": đúng với khách đang ở từ khi Wi-Fi trên Desk lên bản (trang khách hiện Wi-Fi từ ngày đến, đọc ngay ở lần tải sau). Trước mốc đó dùng câu thay ở mục 1.
- "ask reception": không hứa giờ. Người trực đêm đọc Wi-Fi trên Desk được (lễ tân, lễ tân trưởng chỉ xem).
- "We will also replace the Wi-Fi card in your room": đúng nếu bước 5 thay thẻ cho mọi phòng.

  Bước 5 hiện ghi "căn có khách thay lúc dọn, **hoặc** đưa thẻ ở quầy". Nếu "đưa thẻ ở quầy" nghĩa là **không** thay thẻ trong phòng, câu 4 sai. Đề xuất BA/DOM sửa bước 5: căn có khách thay thẻ ở lần dọn tới; khách hỏi trước lúc đó thì đưa thẻ ở quầy. Nếu DOM giữ nguyên ý "hoặc", CPY đổi câu 4 thành "Reception can also give you an updated Wi-Fi card." / "Lễ tân có thể đưa bạn thẻ Wi-Fi mới." **DOM chốt 07/11 (BA-05): đồng ý thay thẻ mọi phòng, câu 4 giữ nguyên.**
- Không hứa thời điểm thay thẻ: khách dài hạn có thể dọn theo tuần.

## 6. Cho BA và DOM

- **BA:** thay câu ở bước 4 (sổ tay 1.4 và tệp 01 mục 9.2) bằng dòng:

  > Lễ tân báo mọi khách đang ở, kể cả khách dài hạn, bằng câu chuẩn ở CPY `guest-notice-wifi-change.md`: Zalo dùng bản ngắn, kênh khác dùng bản đầy đủ. Không gửi mật khẩu hay link trang khách trong tin.

  Đặt bốn đoạn để sao chép (mục 2 và 3, EN và VI) ngay dưới khối, đúng nguyên văn.
- **DOM, BA – đề xuất, không phải chữ của CPY:**
  1. Bước 1 "chọn giờ vắng khách": nên đổi trong **08:00–21:00** (BR-973). Đây là tin chủ động, không phải tin sự cố. Đổi ngoài khung thì khách mất Wi-Fi cả đêm mà tin báo phải chờ tới 08:00. **DOM chốt: 13:00–17:00 (BA-05).**
  2. Tin này tính vào trần 2 tin chủ động mỗi ngày mỗi đơn (BR-974). **DOM đồng ý; vế loại trừ ở mục 1.**
  3. Bước 5: xem mục 5. **DOM đã chốt.**

## 7. Quy tắc kiểm và test đề xuất (khi làm mẫu tin v1.2)

- Khóa: `msg.wifi_changed` (bản đầy đủ), `msg.wifi_changed_short` (bản Zalo).
- Biến: chỉ `{name}`. Không có biến cho mật khẩu, tên mạng hay link. Danh sách biến của mẫu cố định trong code (rbac-matrix 8.9).
- Test:
  - chuỗi không chứa giá trị `wifi.password` của cơ sở;
  - không chữ số, không "!", không emoji;
  - không chứa "căn", "apartment", tên phòng.

Số đo (đếm bằng script; `{name}` tính 6 ký tự):

| Bản | EN | VI |
|---|---|---|
| Đầy đủ, 5 câu | 299 ký tự | 256 ký tự |
| Zalo, 2 câu | 195 ký tự | 178 ký tự |

Câu dài nhất: câu 1 bản Zalo, 21 chữ tiếng Anh, để giữ trong 2 câu. Mọi câu ở bản đầy đủ ≤ 20 chữ.

## 8. Giả định

1. Một ngôn ngữ mỗi tin. Khách Nga, Hàn, Trung nhận bản EN, nên không có câu cần người bản xứ đọc.
2. Chỉ đổi mật khẩu, tên mạng giữ "OTTIMO BOUTIQUE STAY" (BR-012 (7)). Nếu đổi cả tên mạng, câu 1 đổi thành "we have updated the Wi-Fi network name and password" / "OTTIMO vừa đổi tên mạng và mật khẩu Wi-Fi".
3. Guest-facing EN dùng "reception" như trang khách và landing.

   Câu trả lời số thẻ (`guest-reply-card-number.md`, SEC đã duyệt) dùng "front desk". Cùng nghĩa, nhưng hai mẫu nên dùng một chữ. Đề xuất đổi "front desk" thành "reception" ở tệp đó trong một lượt sau. Đây chỉ là đổi chữ, không đổi nghĩa, và cần ORC đồng ý vì BA đã dán câu vào sổ tay.

## 9. Tự kiểm của CPY

- [x] Đúng guideline: tiếng Anh dẫn, ngắn, điềm tĩnh, không emoji, không "!", không IN HOA để nhấn.
- [x] Không mật khẩu, không link, không số căn, không tên phòng, không từ cấm. Dùng "phòng" / "room", không dùng "căn".
- [x] Lời hứa khớp quy trình: gửi sau khi đổi; trang khách chỉ nhắc khi đã lên bản; thẻ trong phòng báo rõ là còn ghi mật khẩu cũ. DOM đã chốt bước 5 (BA-05).
- [x] Không có câu ko/zh/ru mới; không có câu cần SEC hay luật sư.

---

## Lượt 2 – vế loại trừ ở "Lúc gửi" (DOM FB-R5-DOM-BA-05)

- Nguồn:
  - DOM `rounds/round-05/reviews/DOM-on-ba-v105-docs.md` mục 5, thẻ FB-R5-DOM-BA-05 (`b0fa79ff`);
  - BA lượt 4 (`da596507`).
- Không đổi chữ nào gửi khách. Mục 2 và 3 giữ nguyên văn.
- Mục 1, gạch **Lúc gửi**:
  - thêm giờ đổi 13:00–17:00;
  - thêm vế loại trừ đúng như bước 4 DOM đề xuất: khách đi hôm nay, khách nhận phòng sau giờ đổi, đơn đã có 2 tin chủ động, đơn nhiều phòng, đổi gấp.
- Ghi "DOM chốt" ngay tại chỗ ở đầu tệp, mục 5, mục 6 và mục 9. Ba điểm CPY hỏi đã đóng:
  - thay thẻ mọi phòng, câu 4 giữ nguyên;
  - giờ đổi 13:00–17:00;
  - tin tính vào trần BR-974.
- Hỏi DOM, không chặn: khi đổi gấp ngoài khung, tin là tin sự cố nên không tính trần (BR-974). Vậy có còn bỏ khách đi hôm nay và đơn đã có 2 tin không?
  - CPY đề xuất: đổi gấp thì gửi mọi khách đang ở, kể cả khách đi hôm nay chưa trả phòng, vì họ đang mất Wi-Fi.
  - Chữ ở mục 1 tạm theo nguyên văn DOM ("tin sự cố, gửi ngay").
