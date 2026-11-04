# CPY – Bản tiếng Nga (RU) của thông báo `privacy-2026-10-v2` cho trang khách (P4-42)

- Tác giả: CPY | Round 4 – v1.0.4, gói P4-42 – Bước: Sản xuất | 04/11/2026 (hạn SEC 06/11 10:00)
- Chữ gốc: `rounds/round-04/reviews/SEC-on-plan-v1.0.4.md` mục 6.2 (EN dẫn + VI), điều kiện mục 6.4 ý 3.
- Chuẩn duyệt: CPY dịch, SEC đối chiếu nghĩa, UXD duyệt giọng, không người bản xứ (INV, decision-log 04/11; SEC giả định 9.1).
- Đã đọc thêm:
  - RU đang có trong `product/design/tools/gen_strings.py` (khối `RU_EXTRA`: `gw.notice_body` v1, 6 khóa đồng ý, `gw.notice_read`);
  - `product/apps/guest-web/src/app/i18n.tsx` (`RU_UNREVIEWED_LEGAL`);
  - RU của thông báo landing trên `lp-v2-main` (`privacy.ts`, khối `ru`, câu Δ5 – INV đã chấp nhận 04/11);
  - quy ước RU ở `rounds/round-04/outputs/CPY/lp-v2-copy.md` mục 1.
- Không sửa `strings-*.json` hay `gen_strings.py` (UXD gộp lượt chữ). Không commit. Không có dữ liệu khách trong tệp này.

---

## 1. Bảng 4 khóa – chữ RU đề xuất

Thứ tự đúng như trên trang (SEC 6.4 ý 2). Ký hiệu `⍽` trong bảng = khoảng trắng không ngắt U+00A0. Khi chép vào `gen_strings.py`, dùng ` `, không dùng dấu cách thường.

| Khóa | EN (gốc SEC) | VI (gốc SEC) | RU (CPY) | Ghi chú thuật ngữ |
|---|---|---|---|---|
| `gw.notice_body` (sửa) | OTTIMO uses your ID details to register your stay with the police, as required by Vietnamese law. ID photos are encrypted; only reception and managers can see them. We will ask separately whether we may keep your ID photos after registration. Saying no does not affect your stay. | OTTIMO dùng thông tin giấy tờ của bạn để khai báo lưu trú với cơ quan công an theo luật Việt Nam. Ảnh giấy tờ được mã hóa; chỉ lễ tân và quản lý xem được. Chúng tôi sẽ hỏi riêng bạn có muốn cho lưu ảnh giấy tờ sau khi khai báo hay không. Bạn không đồng ý cũng không ảnh hưởng gì tới việc lưu trú. | OTTIMO использует данные ваших документов, чтобы зарегистрировать ваше проживание в полиции, как требует закон Вьетнама. Фото документов зашифрованы; их могут видеть только администраторы и управляющие. Мы отдельно спросим, можно ли нам хранить фото ваших документов после регистрации. Отказ не повлияет на ваше проживание. | Xem 2.1 |
| `gw.notice_retention` (mới) | ID photos and saved ID details are deleted within 3 months after check-out, unless the law requires us to keep them longer. Copies in our encrypted backups are deleted within a further 35 days. | Ảnh và thông tin giấy tờ được xóa trong vòng 3 tháng sau khi trả phòng, trừ phần pháp luật yêu cầu lưu lâu hơn. Bản sao trong dữ liệu sao lưu đã mã hóa được xóa trong 35 ngày sau đó. | Фото документов и сохранённые данные из них удаляются в течение 3⍽месяцев после выезда, если закон не обязывает нас хранить их дольше. Из наших зашифрованных резервных копий они удаляются в течение последующих 35⍽дней. | Xem 2.2 |
| `gw.notice_translation` (mới) | We may use a translation service, such as Google Translate, to read your messages and reply to you. The text we translate may include your name, contact, stay details and message. The service handles this text under its own privacy policy, and its servers may be outside Viet Nam. | OTTIMO có thể dùng một dịch vụ dịch, như Google Dịch, để đọc tin nhắn và trả lời bạn. Nội dung được dịch có thể gồm tên, liên hệ, thông tin lưu trú và lời nhắn của bạn. Dịch vụ này xử lý nội dung đó theo chính sách riêng của họ, và máy chủ của họ có thể đặt ngoài Việt Nam. | Мы можем пользоваться сервисом перевода, например Google Переводчиком, чтобы читать ваши сообщения и отвечать вам. Переводимый текст может включать ваше имя, контакт, сведения о проживании и текст сообщений. Этот сервис обрабатывает такой текст в соответствии со своей политикой конфиденциальности, и его серверы могут находиться за пределами Вьетнама. | Xem 2.3 |
| `gw.notice_rights` (mới) | To see, correct or delete your details, please ask reception. | Muốn xem, sửa hoặc xóa thông tin của bạn, vui lòng hỏi lễ tân. | Чтобы посмотреть, исправить или удалить свои данные, обратитесь, пожалуйста, к администратору. | Xem 2.4 |

Ghi chú khóa (giữ như SEC đặt, thêm phần RU): `Văn bản pháp lý privacy-2026-10-v2 – SEC chữ gốc (SEC-on-plan-v1.0.4 mục 6) – RU: CPY privacy-2026-10-v2-ru.md – đổi chữ = đổi version`.

Bản để chép (chuỗi Python, đã có ` `):

```python
"gw.notice_body": "OTTIMO использует данные ваших документов, чтобы зарегистрировать ваше проживание в полиции, как требует закон Вьетнама. Фото документов зашифрованы; их могут видеть только администраторы и управляющие. Мы отдельно спросим, можно ли нам хранить фото ваших документов после регистрации. Отказ не повлияет на ваше проживание.",
"gw.notice_retention": "Фото документов и сохранённые данные из них удаляются в течение 3 месяцев после выезда, если закон не обязывает нас хранить их дольше. Из наших зашифрованных резервных копий они удаляются в течение последующих 35 дней.",
"gw.notice_translation": "Мы можем пользоваться сервисом перевода, например Google Переводчиком, чтобы читать ваши сообщения и отвечать вам. Переводимый текст может включать ваше имя, контакт, сведения о проживании и текст сообщений. Этот сервис обрабатывает такой текст в соответствии со своей политикой конфиденциальности, и его серверы могут находиться за пределами Вьетнама.",
"gw.notice_rights": "Чтобы посмотреть, исправить или удалить свои данные, обратитесь, пожалуйста, к администратору.",
```

Độ dài (ký tự, đếm bằng script): body EN 279 → RU 323 (+16 %); retention 193 → 218 (+13 %); translation 280 → 352 (+26 %); rights 61 → 94 (+54 %). Cả 4 là đoạn văn trong khung `max-width: 560px`, không có nút hay thanh đáy, nên không cần bản ngắn. Tổng 4 đoạn RU 987 ký tự, khoảng 14–16 dòng ở 360 px: UXD xem có cần khoảng cách đoạn rõ hơn không (mỗi khóa một đoạn, SEC 6.2).

---

## 2. Ghi chú thuật ngữ và lựa chọn từng câu

### 2.1 `gw.notice_body`
- **Câu 1–2 giữ ý v1** (SEC: "giữ nguyên văn v1"). Bản RU v1 trong `RU_EXTRA` chưa bao giờ hiện cho khách (khóa nằm trong `RU_UNREVIEWED_LEGAL`, trang RU rơi về EN), nên CPY sửa 2 chỗ cho sát EN mà không đổi version nào:
  - thêm "ваше" (зарегистрировать **ваше** проживание) cho rõ là lưu trú của chính khách;
  - "их видят только…" → "их **могут** видеть только…", cho khớp "can see" (quyền truy cập, không phải việc đã xem).
- "ID details" = **данные ваших документов**; "ID photos" = **фото документов**. Dùng số nhiều có chủ ý: một người có thể gửi hộ giấy tờ của cả nhóm (`gw.docs_have` "{n}/{m} гостей"), và một khách có thể có hộ chiếu + thị thực. Không dùng "паспорт" vì khách Việt dùng CCCD.
- "Police" = **полиция**, "register your stay" = **зарегистрировать проживание**: cùng từ với `guest.oci.why`. Không dùng "миграционный учёт" (thủ tục của Nga, sai ngữ cảnh Việt Nam).
- "Reception and managers" = **администраторы и управляющие**: theo thuật ngữ đang dùng xuyên suốt guest-web RU ("администратор" ở `gw.door_at_desk`, `gw.closed_body`, `guest.oci.withdraw_hint`…). Landing dùng "сотрудники стойки регистрации, руководители" vì câu landing còn có nhóm sales; trang khách lưu trú giữ từ của guest-web. Phạm vi gồm cả OWN như SEC giả định 9.3.
- "After registration" = **после регистрации**, cùng từ với `guest.oci.consent_q` và `guest.oci.consent_no`. Câu 1 đã nói rõ "регистрация" là khai báo với công an.
- "Saying no does not affect your stay" = **Отказ не повлияет на ваше проживание.** Danh từ "Отказ" tránh động từ chia theo giống ("если вы отказались/отказалась"). Không thêm "никак" (nhấn mạnh hơn EN).

### 2.2 `gw.notice_retention`
- "ID photos and saved ID details" = **Фото документов и сохранённые данные из них**. "из них" tránh lặp "документов" hai lần và vẫn rõ là dữ liệu lấy từ giấy tờ.
- "Within 3 months after check-out" = **в течение 3 месяцев после выезда**. Đây là mức trên (SEC 6.3), nên "в течение" (trong vòng) là đúng; không dùng "через 3 месяца" (nghe như đúng mốc 3 tháng).
- "Unless the law requires us" = **если закон не обязывает нас**. "обязывает" sát "requires us" hơn "требует"; vế này giữ trọn, không rút gọn.
- "Within a further 35 days" = **в течение последующих 35 дней**: cụm pháp lý quen trong tiếng Nga cho "thêm tối đa N ngày sau mốc trước". Không dùng "ещё 35 дней" (dễ hiểu là bản sao còn nằm đó đúng 35 ngày).
- "Copies in our encrypted backups" viết lại thành **Из наших зашифрованных резервных копий они удаляются**. Lý do: dịch sát "копии в резервных копиях" lặp từ. Nghĩa giữ: chính dữ liệu ấy, ở bản sao lưu mã hóa, bị xóa trong 35 ngày sau mốc 3 tháng. **SEC đối chiếu điểm này** (mục 3, điểm 2).
- Số 3 và 35 là chữ cố định, không phải biến. Cách chia đã đúng: sau "в течение" là sinh cách số nhiều, "3 месяцев", "35 дней". Nếu sau này SEC đổi thành tham số `{months}`/`{days}` thì RU cần khóa số nhiều riêng (`_one/_few/_many`) vì cách chia đổi theo số (1 месяца / 3 месяцев / 35 дней).

### 2.3 `gw.notice_translation`
- Chép từ câu Δ5 RU của thông báo landing (`lp-v2-main`, `privacy.ts` khối `ru`, INV chấp nhận 04/11). Hai thông báo cùng một ý nên cùng chữ, SEC dễ so. Chỉ đổi 2 chỗ, theo đúng chỗ SEC đã đổi ở EN ("request" → "messages"):
  - "прочитать ваш запрос и ответить вам" → **читать ваши сообщения и отвечать вам**. Dùng thể chưa hoàn thành vì tin nhắn qua lại nhiều lần trong kỳ lưu trú;
  - "…и сообщение" → **и текст сообщений**, vì vế trước đã nói "ваши сообщения" số nhiều. Để "сообщение" số ít thì câu nghe như chỉ một tin.
- "Google Translate" = **Google Переводчик** (tên chính thức của sản phẩm bằng tiếng Nga), ở cách 5 "Google Переводчиком".
- "Contact" = **контакт**: giữ như landing (một cách liên hệ: số điện thoại hoặc email). "контактные данные" tự nhiên hơn nhưng làm hai thông báo lệch nhau. Nếu đổi thì đổi cả hai cùng lượt.
- "Its servers may be outside Viet Nam" = **его серверы могут находиться за пределами Вьетнама**, giữ nguyên landing.
- Câu **không** nhắc giấy tờ, đúng như EN (SEC 6.3, giả định 9.2).

### 2.4 `gw.notice_rights`
- "To see, correct or delete" = **посмотреть, исправить или удалить**. Landing dùng "показать" vì ở đó khách nhờ OTTIMO "показать" (cho xem); ở đây chủ ngữ ngầm là khách nên "посмотреть" đúng ngữ pháp.
- "Your details" = **свои данные** (đại từ phản thân, đúng chuẩn khi chủ ngữ ngầm là "вы").
- "Please ask reception" = **обратитесь, пожалуйста, к администратору**. "обратиться к" là cách nói lịch sự, trung tính khi gửi yêu cầu. "Администратор" số ít như các câu guest-web khác.

---

## 3. Điểm SEC cần đối chiếu nghĩa

| # | Khóa | Điểm | CPY đề xuất | Rủi ro nếu sai |
|---|---|---|---|---|
| 1 | `gw.notice_body` | Đổi chữ RU v1 ở câu 2: "их видят" → "их **могут** видеть" | Nhận | Thấp. Bản v1 RU chưa từng hiện cho khách |
| 2 | `gw.notice_retention` | Câu 2 viết lại theo chủ ngữ "они" (chính dữ liệu ấy), không dịch sát "Copies in our backups" | Nhận | Trung bình. Nếu SEC muốn RU nói rõ "bản sao" thì dùng: "Их копии в наших зашифрованных резервных копиях удаляются в течение последующих 35 дней." (đúng nghĩa, kém tự nhiên hơn) |
| 3 | `gw.notice_retention` | "в течение последующих 35 дней" = trong 35 ngày **tính từ mốc xóa ở câu 1**, khớp "within a further 35 days" và VI "trong 35 ngày sau đó" | Nhận | Trung bình. Đây là chỗ pháp lý nặng nhất về thời hạn |
| 4 | `gw.notice_retention` | "если закон не обязывает нас хранить их дольше", không thêm "отдельные данные" (VI viết "trừ **phần** pháp luật yêu cầu") | Nhận. EN không có "phần", RU theo EN | Thấp. Muốn sát VI thì: "…если закон не обязывает нас хранить часть из них дольше" |
| 5 | `gw.notice_translation` | 2 chỗ đổi so với Δ5 landing đã duyệt: "читать ваши сообщения", "текст сообщений" | Nhận | Thấp. Cùng hướng với chỗ SEC đổi ở EN |
| 6 | `gw.notice_body` | "после регистрации" = sau khai báo với công an, không phải sau thủ tục nhận phòng. Câu 1 đã định nghĩa, và cùng từ với `guest.oci.consent_q` | Nhận | Trung bình. Trong khách sạn Nga, "регистрация" cũng có nghĩa là làm thủ tục ở quầy. Ở đây hai nghĩa gần nhau về thời điểm nên không đổi lời hứa |
| 7 | `gw.notice_rights` | RU không nhắc "rút đồng ý"; EN và VI cũng không (rút đồng ý nằm ở `guest.oci.withdraw_hint`) | Giữ theo EN | Không |

Không có câu nào trong 4 khóa mà CPY phải bỏ vế hay thêm ý. Không có từ cấm (апартаменты, посуточно, отель, мини-отель, хостел), không có "!" hay emoji.

---

## 4. Tự kiểm

### 4.1 Số ít/số nhiều
| Chỗ | Dạng | Đúng? |
|---|---|---|
| в течение 3 месяцев | sinh cách số nhiều sau "в течение" + số | Đúng |
| в течение последующих 35 дней | sinh cách số nhiều | Đúng |
| Фото документов зашифрованы | "фото" không đổi đuôi, động từ ở số nhiều theo nghĩa | Đúng |
| данные ваших документов / фото ваших документов | số nhiều có chủ ý (mục 2.1) | Đúng, SEC xem điểm 6 bảng mục 3 nếu muốn số ít |
| ваши сообщения … текст сообщений | thống nhất số nhiều | Đúng |
| к администратору | số ít, như guest-web | Đúng |
| Không có biến `{…}` trong 4 khóa | Không cần khóa `_one/_few/_many` | Đúng |

### 4.2 Cách xưng hô và giống
- Xưng khách **вы** viết thường (quy ước LP-v2 1.1, cùng guest-web RU). Xưng mình **мы**. Chủ ngữ "OTTIMO" ở câu đầu: động từ hiện tại "использует", không lộ giống.
- **Không có động từ quá khứ chia theo giống** trong 4 khóa (dùng "Отказ" thay "если вы отказались"). Không có "(а)".
- Lời mời lịch sự đúng mức: "обратитесь, пожалуйста". Không mệnh lệnh cụt, không "Уважаемый гость".

### 4.3 Theo skill CPY mục 8
- [x] Đúng guideline: không emoji, không IN HOA, không "!", câu ngắn và điềm tĩnh
- [x] 0 từ cấm RU; không nêu số phòng/căn; không có giá
- [x] Số liệu khớp chữ gốc SEC: 3 tháng (mức trên), 35 ngày sao lưu
- [x] Câu pháp lý giữ nguyên ý: không bỏ vế, không thêm ý. Các chỗ viết lại có liệt kê ở mục 3
- [x] Số ít/nhiều đúng; dấu câu RU theo quy ước (dấu chấm phẩy giữ như EN; ở đây không cần ngoặc «» hay gạch dài)
- [x] Đã liệt kê câu cần SEC đối chiếu (mục 3). Không có danh sách người bản xứ: INV đã bỏ bước này (04/11)

---

## 5. Rà RU của 7 khóa đang rơi về EN (SEC 6.4 ý 3, cùng hạn 06/11 10:00)

SEC giao thêm việc này trong mục 6.4 ý 3. ORC chỉ giao 4 khóa ở trên, nên CPY ghi phần này để ORC/SEC dùng nếu muốn gộp cùng lượt: P4-42 chỉ đạt AC "không rơi về EN" khi cả 7 khóa này cũng qua đủ 3 bước. EN và VI của các khóa này **không đổi**.

| Khóa | EN (đang chạy) | RU hiện tại (`RU_EXTRA`) | RU đề xuất | Lý do |
|---|---|---|---|---|
| `guest.oci.why` | Why? Vietnamese law requires hotels to register every guest's stay. | Зачем? По закону Вьетнама гостиница обязана регистрировать проживание каждого гостя. | Зачем? По закону Вьетнама проживание каждого гостя должно быть зарегистрировано. | Bỏ "гостиница": cùng nghĩa với "отель" mà landing cấm, và OTTIMO không tự gọi mình là khách sạn trước khách. Nghĩa giữ: luật bắt buộc khai báo mọi khách. **SEC xem** vì chủ thể của nghĩa vụ không còn được nêu |
| `guest.oci.consent_q` | Keep your ID photos after registration? | Хранить фото вашего документа после регистрации? | Giữ nguyên | Đúng nghĩa, ngắn |
| `guest.oci.consent` | I agree OTTIMO may keep photos of my ID until {days} days after check-out, then delete them automatically. | Я согласен(на), чтобы OTTIMO хранил фото моего документа до {days} дн. после выезда, а затем автоматически удалил их. | Даю согласие на то, чтобы OTTIMO хранил фото моего документа до {days} дн. после выезда, а затем автоматически удалил их. | Bỏ "согласен(на)" chia theo giống, theo mẫu đã duyệt của landing `consent` ("Даю согласие на то, чтобы…"). Giữ "дн." (viết tắt chuẩn, không phụ thuộc số nên không cần khóa số nhiều). Muốn viết đủ chữ thì MOB cần 3 khóa `_one/_few/_many` (день/дня/дней) |
| `guest.oci.consent_no` | No – use them for registration only, then delete | Нет – использовать только для регистрации, затем удалить | Нет — использовать только для регистрации, затем удалить | Chỉ đổi gạch ngắn "–" sang gạch dài "—" (quy ước RU LP-v2 1.1) |
| `guest.oci.consent_optional` | Optional. If you don't agree, we only use the details for registration and don't keep the photos. | Необязательно. Если вы не согласны, мы используем данные только для регистрации и не храним фото. | Giữ nguyên | Đúng nghĩa. "не согласны" là số nhiều lịch sự, không lộ giống |
| `guest.oci.withdraw_hint` | Want to withdraw consent to keep photos? Tell reception – the photos will be deleted. | Хотите отозвать согласие на хранение фото? Сообщите администратору – фото будут удалены. | Хотите отозвать согласие на хранение фото? Сообщите администратору — фото будут удалены. | Chỉ đổi gạch "—" |
| `gw.notice_read` | I've read this | Я прочитал(а) | Прочитано | Bỏ "(а)" chia theo giống. "Прочитано" là nhãn nút trung tính, đúng nghĩa xác nhận đã đọc. 9 ký tự, vừa nút |

Gợi ý cho MOB/ORC: bỏ cả nhóm khóa thông báo (4 khóa ở mục 1 + `gw.notice_read`) khỏi `RU_UNREVIEWED_LEGAL` **cùng một lượt**. Bỏ lẻ thì trang RU sẽ trộn đoạn RU với đoạn EN trong cùng một thông báo, và `notice_locale` khó ghi cho đúng (decision-log 17/10).

Ngoài phạm vi, ghi để UXD biết: guest-web RU đang dùng **"апартаменты"** ở `gw.room`, `guest.oci.done_body`, `guest.stay.checkin_time` (và mẫu tin `msg.hot_water_issue`). Đây là từ cấm của landing (FB-INV-002). Đề xuất thay bằng "номер" trong lượt chữ sau; không thuộc P4-42.
