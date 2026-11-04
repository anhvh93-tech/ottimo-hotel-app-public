# SEC đối chiếu nghĩa bản RU `privacy-2026-10-v2` (P4-42)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026 (hạn 06/11 10:00)
- Đối tượng: `rounds/round-04/outputs/CPY/privacy-2026-10-v2-ru.md` (CPY), mục 1 (4 khóa), mục 3 (7 điểm), mục 5 (7 khóa đang rơi về EN).
- Chữ gốc để so: `rounds/round-04/reviews/SEC-on-plan-v1.0.4.md` mục 6.2 (EN dẫn + VI, luật sư đã đọc EN/VI), điều kiện 6.4.
- Đã đọc thêm:
  - RU hiện có trong `product/design/tools/gen_strings.py` (`RU_EXTRA`);
  - `product/apps/guest-web/src/app/i18n.tsx` (`RU_UNREVIEWED_LEGAL`, `shownLocale` ghi làm bằng chứng đồng ý);
  - RU thông báo landing trên `lp-v2-main` (`landing-web/src/content/privacy.ts`, khối `ru`).
- Chuẩn: CPY dịch, SEC đối chiếu nghĩa, UXD duyệt giọng (INV miễn người bản xứ, decision-log 04/11; SEC giả định 9.1 của tệp plan).
- Không sửa strings, mã hay tệp nào khác. Không commit. Không có dữ liệu khách, email hay số giấy tờ thật trong tệp này.

---

## 0. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN.**

- Bản RU đúng nghĩa ở phần lớn các câu. Không bỏ vế, không thêm lời hứa. CPY liệt kê đủ chỗ viết lại.
- SEC sửa **3 câu**, đều để lời hứa với khách không đọc lệch:
  1. `gw.notice_retention` câu 2: neo 35 ngày vào **lúc xóa**, không vào mốc 3 tháng (mục 1, điểm 2–3);
  2. `gw.notice_body` câu 4: "Отказ" không rõ là từ chối việc gì (điểm 8, SEC thêm);
  3. `guest.oci.why`: câu bị động làm mất chủ thể của nghĩa vụ khai báo (mục 3).
- Điều kiện để P4-42 đạt AC "không rơi về EN": mục 4.
- ESC mới: **không**. Nghĩa câu thông báo thuộc quyền SEC. EN và VI **không đổi**, nên version vẫn là `privacy-2026-10-v2`.

---

## 1. Đối chiếu 7 điểm CPY nêu (mục 3 của CPY) và 1 điểm SEC thêm

Ký hiệu `⍽` = khoảng trắng không ngắt U+00A0, như quy ước của CPY.

| # | Khóa | Điểm | Quyết định SEC | Câu RU chốt / lý do |
|---|---|---|---|---|
| 1 | `gw.notice_body` | "их **могут** видеть только администраторы и управляющие" | **Chấp nhận** | Khớp "can see" (quyền truy cập), cùng cách nói với landing ("Видеть их могут только…") đã duyệt. Phạm vi: "администраторы" = lễ tân (thuật ngữ guest-web), "управляющие" = quản lý, gồm OWN như giả định 9.3. Nếu người đọc hiểu "администраторы" là quản trị hệ thống thì phạm vi nghe **rộng hơn** thực tế, không hứa hẹn quá mức. Không cần đổi |
| 2 | `gw.notice_retention` | Câu 2 lấy "они" (chính dữ liệu ấy) làm chủ ngữ, không dịch sát "Copies in our backups" | **Sửa** (gộp với điểm 3) | Xem dưới |
| 3 | `gw.notice_retention` | "в течение последующих 35 дней" | **Sửa** | **Câu chốt:** `После удаления они остаются в наших зашифрованных резервных копиях не более 35⍽дней.` |
| 4 | `gw.notice_retention` | "если закон не обязывает нас хранить их дольше", không thêm "часть" | **Chấp nhận** | Xem dưới |
| 5 | `gw.notice_translation` | "читать ваши сообщения", "текст сообщений" | **Chấp nhận** | Cùng hướng với chỗ SEC đổi ở EN ("request" → "messages"). Danh sách dữ liệu được dịch giữ đủ 4 mục, **không** nhắc giấy tờ (giả định 9.2). Vế "chính sách riêng" và "máy chủ ngoài Việt Nam" giữ nguyên câu landing |
| 6 | `gw.notice_body` | "после регистрации" | **Chấp nhận** | Câu 1 đã định nghĩa "зарегистрировать ваше проживание в полиции". Đọc theo nghĩa "làm thủ tục ở quầy" thì mốc gần như trùng, và hạn xóa tính từ ngày trả phòng, nên lời hứa không đổi. Cùng từ với `guest.oci.consent_q` |
| 7 | `gw.notice_rights` | Không nhắc rút đồng ý | **Chấp nhận** | Đúng như EN/VI. "свои данные" là toàn bộ dữ liệu của khách, không chỉ giấy tờ, khớp "your details" |
| 8 | `gw.notice_body` | **(SEC thêm)** "Отказ не повлияет на ваше проживание." | **Sửa** | **Câu chốt:** `Если вы не разрешите, это не повлияет на ваше проживание.` Xem dưới |

### 1.1 Điểm 2–3: thời hạn sao lưu (nặng nhất)

- Hệ thống thật (6.3, 6.5): bản sao lưu giữ tối đa 35 ngày rồi quay vòng. Dữ liệu bị xóa khỏi hệ thống chính lúc nào thì biến mất khỏi sao lưu **chậm nhất 35 ngày sau lúc đó**.
- Câu CPY "в течение последующих 35 дней" đọc được theo hai cách:
  - (a) 35 ngày sau **lúc xóa** ở câu 1: đúng với mọi trường hợp;
  - (b) 35 ngày sau **mốc 3 tháng**: **sai** với phần pháp luật bắt giữ lâu hơn. Phần đó nằm trong sao lưu tới 35 ngày sau ngày nó thực sự bị xóa, có thể muộn hơn 3 tháng + 35 ngày rất nhiều.
- "последующих" gắn với khoảng thời gian vừa nêu (3 tháng), nên cách đọc (b) là cách đọc tự nhiên. Đây là chỗ RU hứa nhiều hơn hệ thống làm được.
- Câu chốt neo thẳng vào **lúc xóa** ("После удаления"), nói rõ dữ liệu **còn** trong sao lưu, và đặt mức trên "не более 35⍽дней". Đúng với cả dữ liệu xóa trước 3 tháng lẫn phần luật bắt giữ lâu hơn.
- Có khớp EN không: "Copies in our encrypted backups are deleted within a further 35 days" = bản sao còn tối đa thêm 35 ngày. VI "được xóa trong 35 ngày sau đó" ("sau đó" = sau lúc xóa). Câu RU chốt nói đúng nghĩa SEC đặt khi viết EN/VI, nên **không đổi nghĩa và không đổi version**. EN/VI giữ nguyên.
- Phương án dự phòng của CPY ("Их копии в наших зашифрованных резервных копиях…") **không dùng**: vẫn còn "последующих".

### 1.2 Điểm 4: "если закон не обязывает нас хранить их дольше"

- Ngữ pháp đúng là "unless". "их" phủ cả ảnh lẫn dữ liệu, áp cho từng mục: mục nào luật bắt giữ thì giữ, còn lại xóa. Cùng nghĩa với "them" ở EN.
- **Không** dùng phương án "часть из них". Lý do: phần luật bắt giữ là gì vẫn chờ luật sư (ESC-001). "часть" hứa trước rằng chỉ một phần được giữ, hẹp hơn EN mà luật sư đã đọc. Theo EN là an toàn hơn.
- Không đổi "обязывает" thành "требует": "обязывает нас" sát "requires us" hơn.

### 1.3 Điểm 8: "Отказ" ở `gw.notice_body` câu 4

- Đoạn văn mở đầu bằng **nghĩa vụ** khai báo. "Отказ" đứng một mình có thể đọc thành "từ chối đưa giấy tờ cũng không sao". Hiểu như vậy là sai: không có giấy tờ thì không khai báo được, và khách phải ra quầy.
- "Если вы не разрешите" trả lời thẳng câu hỏi xin phép ngay trước ("можно ли нам хранить…"). Khớp EN "Saying no" và VI "Bạn không đồng ý". Không lộ giống, không lặp "хранить фото" lần nữa.

---

## 2. Bốn khóa: câu RU đã chốt

| Khóa | RU chốt | So với CPY |
|---|---|---|
| `gw.notice_body` | OTTIMO использует данные ваших документов, чтобы зарегистрировать ваше проживание в полиции, как требует закон Вьетнама. Фото документов зашифрованы; их могут видеть только администраторы и управляющие. Мы отдельно спросим, можно ли нам хранить фото ваших документов после регистрации. Если вы не разрешите, это не повлияет на ваше проживание. | Câu 4 sửa (điểm 8) |
| `gw.notice_retention` | Фото документов и сохранённые данные из них удаляются в течение 3⍽месяцев после выезда, если закон не обязывает нас хранить их дольше. После удаления они остаются в наших зашифрованных резервных копиях не более 35⍽дней. | Câu 2 sửa (điểm 2–3) |
| `gw.notice_translation` | Мы можем пользоваться сервисом перевода, например Google Переводчиком, чтобы читать ваши сообщения и отвечать вам. Переводимый текст может включать ваше имя, контакт, сведения о проживании и текст сообщений. Этот сервис обрабатывает такой текст в соответствии со своей политикой конфиденциальности, и его серверы могут находиться за пределами Вьетнама. | Giữ nguyên CPY |
| `gw.notice_rights` | Чтобы посмотреть, исправить или удалить свои данные, обратитесь, пожалуйста, к администратору. | Giữ nguyên CPY |

Bản để chép (chuỗi Python, chỗ `3 месяцев` và `35 дней` đã dùng U+00A0):

```python
"gw.notice_body": "OTTIMO использует данные ваших документов, чтобы зарегистрировать ваше проживание в полиции, как требует закон Вьетнама. Фото документов зашифрованы; их могут видеть только администраторы и управляющие. Мы отдельно спросим, можно ли нам хранить фото ваших документов после регистрации. Если вы не разрешите, это не повлияет на ваше проживание.",
"gw.notice_retention": "Фото документов и сохранённые данные из них удаляются в течение 3 месяцев после выезда, если закон не обязывает нас хранить их дольше. После удаления они остаются в наших зашифрованных резервных копиях не более 35 дней.",
"gw.notice_translation": "Мы можем пользоваться сервисом перевода, например Google Переводчиком, чтобы читать ваши сообщения и отвечать вам. Переводимый текст может включать ваше имя, контакт, сведения о проживании и текст сообщений. Этот сервис обрабатывает такой текст в соответствии со своей политикой конфиденциальности, и его серверы могут находиться за пределами Вьетнама.",
"gw.notice_rights": "Чтобы посмотреть, исправить или удалить свои данные, обратитесь, пожалуйста, к администратору.",
```

Ghi chú khóa đề xuất: `Văn bản pháp lý privacy-2026-10-v2 – SEC chữ gốc (SEC-on-plan-v1.0.4 mục 6) – RU: CPY privacy-2026-10-v2-ru.md, SEC chốt nghĩa SEC-on-privacy-v2-ru.md – đổi chữ = đổi version`.

UXD được chỉnh dấu câu, kiểu chữ và trật tự từ cho giọng tự nhiên. **Không** được đổi 3 chỗ sau mà không báo SEC:
- "После удаления … не более 35⍽дней";
- "если закон не обязывает нас хранить их дольше";
- "их могут видеть только администраторы и управляющие".

---

## 3. Bảy khóa đang rơi về EN (CPY mục 5)

| Khóa | Quyết định SEC | RU chốt |
|---|---|---|
| `guest.oci.why` | **Sửa** | Зачем? По закону Вьетнама мы обязаны регистрировать проживание каждого гостя. |
| `guest.oci.consent_q` | Chấp nhận (giữ RU hiện tại) | Хранить фото вашего документа после регистрации? |
| `guest.oci.consent` | Chấp nhận đề xuất CPY | Даю согласие на то, чтобы OTTIMO хранил фото моего документа до {days} дн. после выезда, а затем автоматически удалил их. |
| `guest.oci.consent_no` | Chấp nhận đề xuất CPY | Нет — использовать только для регистрации, затем удалить |
| `guest.oci.consent_optional` | Chấp nhận (giữ RU hiện tại) | Необязательно. Если вы не согласны, мы используем данные только для регистрации и не храним фото. |
| `guest.oci.withdraw_hint` | Chấp nhận đề xuất CPY | Хотите отозвать согласие на хранение фото? Сообщите администратору — фото будут удалены. |
| `gw.notice_read` | Chấp nhận đề xuất CPY | Прочитано |

### 3.1 `guest.oci.why`: vì sao không nhận câu bị động
- Câu CPY "проживание каждого гостя должно быть зарегистрировано" đúng là luật bắt buộc khai báo, nhưng **không nói ai** phải khai báo. Khách có thể hiểu là chính mình phải tự đi đăng ký (thói quen ở Nga: khách nước ngoài tự lo "регистрация"). Hiểu vậy thì khách không thấy lý do OTTIMO cần giấy tờ của mình.
- Nghĩa vụ của cơ sở lưu trú chính là căn cứ để OTTIMO thu giấy tờ mà không cần khách đồng ý. Câu "Why?" phải giữ ý đó.
- "мы обязаны" nêu đúng chủ thể, không dùng "гостиница/отель", không lộ giống, và khớp `gw.notice_body` câu 1 ("OTTIMO … как требует закон Вьетнама"). EN nói "hotels" (chung). RU nói "chúng tôi" (một trường hợp của nhóm đó). Hẹp hơn nhưng đúng sự thật, không đổi lời hứa.

### 3.2 Ghi chú cho các khóa chấp nhận
- `guest.oci.consent`:
  - "хранил … удалил" chia theo chủ ngữ OTTIMO, không theo giới của khách, nên đạt mục tiêu bỏ "(на)";
  - "до {days} дн. после выезда" khớp "until {days} days after check-out";
  - giữ "дн." để không cần khóa số nhiều.
- `guest.oci.consent_q` dùng "документа" số ít, còn thông báo dùng số nhiều. Chấp nhận: mỗi khách đồng ý cho giấy tờ của chính mình.
- `gw.notice_read` "Прочитано": khách bấm nút là xác nhận đã đọc, đúng nghĩa "I've read this". Không còn "(а)".
- RU của 6 khóa đồng ý **chưa từng hiện** cho khách (đều trong `RU_UNREVIEWED_LEGAL`). Không có bản ghi đồng ý nào với `notice_locale = ru`, nên đổi chữ không đụng bằng chứng cũ.

---

## 4. Điều kiện (để P4-42 đạt AC RU)

1. **UXD duyệt giọng** cả 11 khóa ở mục 2 và 3. Có sửa đụng tới 3 chỗ khóa nghĩa (cuối mục 2) hoặc câu `guest.oci.why` thì gửi lại SEC. Sửa dấu câu, trật tự từ thì không cần.
2. **Một lượt chữ** (UXD gộp vào `gen_strings.py`): đúng câu ở mục 2 và 3, kể cả U+00A0. Ghi chú khóa như mục 2.
3. **MOB bỏ cả 8 khóa cũ khỏi `RU_UNREVIEWED_LEGAL` cùng một lượt** (`gw.notice_body`, 6 khóa `guest.oci.*`, `gw.notice_read`), và **không** thêm 3 khóa mới vào danh sách nếu chúng vào cùng lượt chữ đã duyệt.
   - Bỏ lẻ thì một thông báo trộn RU với EN, và `shownLocale` ghi bằng chứng sai ngôn ngữ (decision-log 17/10).
   - Có khóa nào chưa qua UXD thì giữ **cả nhóm** trong danh sách, và P4-42 chưa đạt AC RU.
4. **Test MOB:** ở `ru`, `shownLocale` trả `ru` cho cả 11 khóa. Lượt đồng ý thử (dữ liệu `…@example.test`) ghi `notice_locale = ru` và `privacy-2026-10-v2`.
5. **SEC kiểm sau production** (6.5 của tệp plan): trang RU hiện đúng 4 đoạn, khớp từng câu ở mục 2.
6. **Tờ Your ID details bản RU** (6.4 ý 4): UXD dùng đúng 4 câu ở mục 2. In sau khi điều kiện 1 xong.

Ngoài phạm vi, đồng ý với CPY: "апартаменты" trên guest-web RU (`gw.room`, `guest.oci.done_body`, `guest.stay.checkin_time`, mẫu tin) là việc lượt chữ sau của UXD/CPY. Không chặn P4-42, không phải văn bản pháp lý.

---

## 5. Thẻ feedback

### FB-R4-SEC-CPY-RU2-01
- Mức độ: Major
- Vị trí: `privacy-2026-10-v2-ru.md` mục 1, `gw.notice_retention` câu 2 ("в течение последующих 35 дней").
- Vấn đề: cách đọc tự nhiên neo 35 ngày vào mốc 3 tháng. Với phần pháp luật bắt giữ lâu hơn, bản sao lưu còn tới 35 ngày sau ngày xóa thật, muộn hơn nhiều.
- Vì sao quan trọng: câu hạn lưu là lời hứa pháp lý với khách. RU không được hứa nhiều hơn EN/VI hay hơn hệ thống.
- Đề xuất sửa: dùng `После удаления они остаются в наших зашифрованных резервных копиях не более 35⍽дней.`
- Trạng thái: Open (CPY/UXD áp trong lượt chữ)

### FB-R4-SEC-CPY-RU2-02
- Mức độ: Minor
- Vị trí: `gw.notice_body` câu 4 ("Отказ не повлияет…").
- Vấn đề: không rõ từ chối việc gì. Có thể hiểu thành từ chối đưa giấy tờ.
- Vì sao quan trọng: khách hiểu sai thì nghĩ khai báo là tùy chọn, rồi bị chặn ở quầy.
- Đề xuất sửa: `Если вы не разрешите, это не повлияет на ваше проживание.`
- Trạng thái: Open

### FB-R4-SEC-CPY-RU2-03
- Mức độ: Minor
- Vị trí: `privacy-2026-10-v2-ru.md` mục 5, `guest.oci.why` (đề xuất bị động).
- Vấn đề: mất chủ thể của nghĩa vụ khai báo. Khách có thể hiểu là mình phải tự đi đăng ký.
- Vì sao quan trọng: câu "Why?" là chỗ khách hiểu căn cứ để OTTIMO thu giấy tờ.
- Đề xuất sửa: `Зачем? По закону Вьетнама мы обязаны регистрировать проживание каждого гостя.`
- Trạng thái: Open

---

## 6. Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-11-04 | 4 | **SEC – đối chiếu nghĩa RU privacy-2026-10-v2** (rounds/round-04/reviews/SEC-on-privacy-v2-ru.md): ĐẠT CÓ ĐK. 4 khóa thông báo + 7 khóa đồng ý/nút đã chốt câu RU; sửa 3 câu: (1) retention câu 2 neo vào lúc xóa ("После удаления … не более 35 дней"), không neo mốc 3 tháng; (2) notice_body câu 4 "Если вы не разрешите…" thay "Отказ…"; (3) guest.oci.why giữ chủ thể "мы обязаны" thay câu bị động. EN/VI không đổi, version giữ privacy-2026-10-v2. ĐK: UXD duyệt giọng (đổi 3 chỗ khóa nghĩa thì gửi lại SEC); MOB bỏ cả 8 khóa khỏi RU_UNREVIEWED_LEGAL cùng một lượt; test shownLocale = ru cho 11 khóa | SEC | Quyền SEC (chữ thông báo); INV miễn người bản xứ 04/11 |`

---

## 7. Giả định

1. Sao lưu quay vòng với mức giữ tối đa 35 ngày (6.5 của tệp plan), nên dữ liệu đã xóa khỏi hệ thống chính hết hẳn trong sao lưu chậm nhất 35 ngày sau. Nếu OPS đổi cách sao lưu (giữ bản tháng, lưu trữ dài hạn) thì câu RU, EN và VI đều phải xem lại (version mới).
2. "Администратор" trên guest-web RU nghĩa là nhân viên lễ tân, như các khóa guest-web khác. SEC không dùng "сотрудники стойки регистрации" của landing, để trang khách thống nhất một từ.
3. Chuẩn duyệt RU như INV quyết 04/11 (không người bản xứ). SEC đối chiếu nghĩa dựa trên hiểu biết tiếng Nga của mình và so chéo với bản landing đã duyệt. **Chưa** có người bản xứ đọc. Rủi ro còn lại là độ tự nhiên, UXD gánh. Về nghĩa pháp lý, SEC chịu trách nhiệm cho các câu ở mục 2 và 3.
