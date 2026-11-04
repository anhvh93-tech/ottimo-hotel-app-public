# UXD duyệt giọng bản RU `privacy-2026-10-v2` (P4-42)

- Người review: UXD | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: 11 khóa RU đã chốt nghĩa ở `rounds/round-04/reviews/SEC-on-privacy-v2-ru.md` mục 2 và 3 (`origin/main` @ `3a4fb411`). Tham chiếu: `rounds/round-04/outputs/CPY/privacy-2026-10-v2-ru.md`; quy ước RU ở `rounds/round-04/outputs/CPY/lp-v2-copy.md` mục 1 (ngoặc «», gạch dài —, không "!", xưng **вы** viết thường); `RU_EXTRA` hiện tại trong `product/design/tools/gen_strings.py`; tờ in `product/docs/print/to-4-your-id-details-{a4,a4-2-ban,a5}.html`; brand `00-brief/context/brand/brand-guidelines.md`; `product/design/design-system.md` (font RU).
- Phạm vi: chỉ giọng và độ tự nhiên theo giọng khách của OTTIMO (ngắn, lịch sự, điềm tĩnh, không emoji). **Không** đổi nghĩa. Không đụng 3 chỗ khóa nghĩa của SEC và câu `guest.oci.why`.
- Chuẩn: INV miễn người bản xứ (decision-log 04/11). UXD đọc theo hiểu biết tiếng Nga của mình và so với RU landing đã duyệt. Chưa có người bản xứ đọc.
- Không sửa strings, mã hay tờ in. Không commit. Không có dữ liệu khách trong tệp này.

---

## 0. Kết luận

**ĐẠT** cho cả 11 khóa: giọng đúng, không cần sửa chữ.

- Cả 11 câu ngắn, lịch sự, điềm tĩnh. Không "!", không emoji, không IN HOA, không từ cấm (апартаменты, отель, гостиница…). Xưng **вы** viết thường, xưng mình **мы**, đúng quy ước LP-v2.
- Không còn chỗ nào chia theo giống của khách ("согласен(на)", "прочитал(а)" đã bỏ).
- **Không đề xuất sửa 3 chỗ khóa nghĩa hay `guest.oci.why`.** Cả bốn đọc tự nhiên. Không có gì gửi lại SEC.
- Chỉ có **một chỉnh kiểu chữ**: thêm khoảng trắng không ngắt U+00A0 trong `{days}⍽дн.` của `guest.oci.consent`, để số và chữ viết tắt không bị tách sang hai dòng trên màn 360 px. Đây là dấu câu/kiểu chữ, trong quyền UXD theo SEC mục 4 ý 1, không đổi nghĩa và không đổi version.
- **Tờ Your ID details bản RU chưa có trong repo** (mục 3). Cả 3 tờ in hiện chỉ có EN + VI, và vẫn là chữ v1. Danh sách việc để dựng tờ ở mục 3.2. Tờ không chặn khóa trên trang khách, nhưng phải có trước bước bật production ở 6.4 ý 5.

---

## 1. Duyệt giọng từng khóa

Ký hiệu `⍽` = U+00A0.

| # | Khóa | Giọng | Nhận xét |
|---|---|---|---|
| 1 | `gw.notice_body` | Đạt | Câu 1 trang trọng vừa đủ cho một đoạn pháp lý. "как требует закон Вьетнама" ngắn hơn "как того требует…" mà vẫn chuẩn, nên giữ. Câu 4 của SEC ("Если вы не разрешите…") trả lời thẳng câu hỏi xin phép ngay trước, đọc mềm hơn "Отказ…". Câu khóa nghĩa "их могут видеть только администраторы и управляющие" tự nhiên, giữ |
| 2 | `gw.notice_retention` | Đạt | "После удаления они остаются … не более 35⍽дней" là cách nói tự nhiên, dễ hiểu hơn "в течение последующих…" của bản CPY. "если закон не обязывает нас хранить их дольше" đúng văn pháp lý thường dùng, không nặng. "данные из них" hơi gọn, nhưng tránh lặp "документов" lần thứ ba trong hai câu, nên giữ |
| 3 | `gw.notice_translation` | Đạt | Câu dài nhất (352 ký tự), nhưng là đoạn văn, không có nút. "контакт" số ít hơi khô so với "контактные данные", nhưng cùng chữ với landing đã duyệt. Giữ để hai thông báo khớp. Nếu đổi thì đổi cả hai ở lượt chữ sau (mục 4, S1) |
| 4 | `gw.notice_rights` | Đạt | "обратитесь, пожалуйста, к администратору": lịch sự, không cầu kỳ, đúng giọng OTTIMO |
| 5 | `guest.oci.why` | Đạt | "Зачем?" ngắn, đúng nhịp của "Why?". "мы обязаны" vừa đúng nghĩa SEC cần vừa ấm hơn câu bị động. Không đề xuất sửa |
| 6 | `guest.oci.consent_q` | Đạt | Câu hỏi bằng động từ nguyên thể là cách hỏi tự nhiên trên màn hình. Ngắn, điềm tĩnh |
| 7 | `guest.oci.consent` | Đạt, có một chỉnh kiểu chữ | "Даю согласие на то, чтобы…" là mẫu đồng ý chuẩn, cùng mẫu landing. Hơi trang trọng, nhưng đây là câu đồng ý nên phù hợp. "дн." chấp nhận được, vì tránh khóa số nhiều. Chỉnh: `{days}⍽дн.` |
| 8 | `guest.oci.consent_no` | Đạt | Gạch dài "—" đúng quy ước. Không chấm cuối, khớp EN và nhãn lựa chọn |
| 9 | `guest.oci.consent_optional` | Đạt | "Необязательно." đứng đầu rồi giải thích: rõ, không gây áp lực. "не согласны" không lộ giống |
| 10 | `guest.oci.withdraw_hint` | Đạt | Câu hỏi rồi chỉ việc cần làm, đúng mẫu brand. Gạch dài đúng |
| 11 | `gw.notice_read` | Đạt | "Прочитано" là nhãn nút trung tính, 9 ký tự, vừa nút ở 360 px. Không dùng "Понятно" vì nghĩa là "đã hiểu", khác "I've read this" |

Kiểm chung:
- Chữ **ё** dùng đầy đủ ("сохранённые"), khớp landing ("всё", "пришлём").
- Không có ngoặc kép trong 11 khóa, nên không cần «».
- Độ dài: 4 đoạn thông báo cộng lại khoảng 990 ký tự, 14–16 dòng ở 360 px. Mỗi khóa đã là một đoạn riêng (SEC 6.2). MOB giữ khoảng cách đoạn `--space-3` (12 px) như bản EN, không cần thêm.
- **Font:** Be Vietnam Pro không có Kirin. Trên guest-web, thân chữ RU rơi về Arial/`system-ui` (decision-log 15/10, `design-system.md` 331–332); tiêu đề `gw.notice_title` vẫn là Lora, vì Lora có Kirin. Đó là quy ước hiện hành, không chặn P4-42. Landing `/ru/` dùng Onest (LP-v2). Nếu muốn guest-web RU cùng font với landing thì đó là việc lượt sau (mục 4, S2).

---

## 2. Chữ cuối cùng của 11 khóa (để MOB/UXD chép)

Chữ đúng như SEC đã chốt, chỉ thêm U+00A0 ở `{days}⍽дн.`. Khối dưới là dòng của `RU_EXTRA` trong `gen_strings.py`. Các chỗ `3⍽месяцев`, `35⍽дней`, `{days}⍽дн.` (⍽ ở bảng) đã dùng U+00A0 thật, không phải dấu cách thường.

```python
"gw.notice_body": "OTTIMO использует данные ваших документов, чтобы зарегистрировать ваше проживание в полиции, как требует закон Вьетнама. Фото документов зашифрованы; их могут видеть только администраторы и управляющие. Мы отдельно спросим, можно ли нам хранить фото ваших документов после регистрации. Если вы не разрешите, это не повлияет на ваше проживание.",
"gw.notice_retention": "Фото документов и сохранённые данные из них удаляются в течение 3 месяцев после выезда, если закон не обязывает нас хранить их дольше. После удаления они остаются в наших зашифрованных резервных копиях не более 35 дней.",
"gw.notice_translation": "Мы можем пользоваться сервисом перевода, например Google Переводчиком, чтобы читать ваши сообщения и отвечать вам. Переводимый текст может включать ваше имя, контакт, сведения о проживании и текст сообщений. Этот сервис обрабатывает такой текст в соответствии со своей политикой конфиденциальности, и его серверы могут находиться за пределами Вьетнама.",
"gw.notice_rights": "Чтобы посмотреть, исправить или удалить свои данные, обратитесь, пожалуйста, к администратору.",
"guest.oci.why": "Зачем? По закону Вьетнама мы обязаны регистрировать проживание каждого гостя.",
"guest.oci.consent_q": "Хранить фото вашего документа после регистрации?",
"guest.oci.consent": "Даю согласие на то, чтобы OTTIMO хранил фото моего документа до {days} дн. после выезда, а затем автоматически удалил их.",
"guest.oci.consent_no": "Нет — использовать только для регистрации, затем удалить",
"guest.oci.consent_optional": "Необязательно. Если вы не согласны, мы используем данные только для регистрации и не храним фото.",
"guest.oci.withdraw_hint": "Хотите отозвать согласие на хранение фото? Сообщите администратору — фото будут удалены.",
"gw.notice_read": "Прочитано",
```

Ghi chú khóa cho 4 khóa thông báo (như SEC mục 2, thêm bước UXD): `Văn bản pháp lý privacy-2026-10-v2 – SEC chữ gốc (SEC-on-plan-v1.0.4 mục 6) – RU: CPY privacy-2026-10-v2-ru.md, SEC chốt nghĩa SEC-on-privacy-v2-ru.md, UXD duyệt giọng UXD-on-privacy-v2-ru.md – đổi chữ = đổi version`.

Việc tiếp theo, theo điều kiện SEC mục 4:
- UXD đưa 11 dòng vào `RU_EXTRA` **trong một lượt chữ**, trong nhóm riêng của P4-42 (plan 2.4), rồi chạy `gen_strings.py`.
- MOB bỏ cả 8 khóa cũ khỏi `RU_UNREVIEWED_LEGAL` cùng lượt đó, và không thêm 3 khóa mới vào danh sách.
- Test `shownLocale = ru` cho 11 khóa.

---

## 3. Tờ Your ID details – bản RU

### 3.1 Hiện trạng (`origin/main` @ `3a4fb411`)
- Có 3 tờ: `to-4-your-id-details-a4.html`, `…-a4-2-ban.html`, `…-a5.html` (và PDF trong `print/pdf/`). Chỉ sửa một lần, ở `e7ac80f1` (Round 3).
- Cả 3 tờ **chỉ có EN + VI**. Trong HTML không có ký tự Kirin nào. **Chưa có bản RU.**
- Chữ trên tờ vẫn là **v1**: chỉ có 3 đoạn (thông báo, hạn lưu, quyền). **Chưa có đoạn dịch** (`gw.notice_translation`). Chân tờ vẫn là `OTTIMO · ID notice 11/2026`, chưa phải `… · v2 · 11/2026`. Việc 6.4 ý 4 cho EN/VI cũng chưa làm.
- Chữ EN/VI của 3 đoạn trên tờ khớp nguyên văn câu gốc của SEC (6.2). Tờ là nguồn chữ của bản máy tính bảng (`your-id-details-tablet.html`, dựng bằng `build_guides.py`) và của `guides/02-le-tan.md` (công cụ kiểm "khớp nguyên văn").
- Tờ tải font từ Google Fonts (`Be Vietnam Pro 400;600`, `Lora 500`, `JetBrains Mono 400`), không nhúng font.

### 3.2 Việc cần làm cho tờ (UXD, P4-42)

| # | Việc | Ghi chú |
|---|---|---|
| T1 | **Trước hết, EN/VI v2** trên cả 3 tờ (6.4 ý 4): thêm đoạn `gw.notice_translation` EN + VI ở vị trí thứ 3 (sau hạn lưu, trước quyền), giống thứ tự trên trang. Chân tờ thành `OTTIMO · ID notice · v2 · 11/2026` | Bản cũ giữ trong lịch sử repo (SEC D08). Không xóa tệp |
| T2 | **Tờ RU mới**: `to-4-your-id-details-a4-ru.html`, cùng bố cục 2 cột: **EN dẫn bên trái, RU bên phải** (thay cột VI). Tờ ở quầy cho khách nói tiếng Nga là tờ thứ hai, đặt cạnh tờ EN/VI | Không dồn 3 ngôn ngữ lên một tờ A4: 4 đoạn × 3 ngôn ngữ sẽ phải hạ chữ dưới cỡ đọc được ở quầy |
| T3 | Chữ RU của 4 đoạn: **chép nguyên văn** 4 khóa `gw.notice_*` ở mục 2, đúng thứ tự body → retention → translation → rights, giữ U+00A0 ở `3⍽месяцев`, `35⍽дней`. Không lấy 7 khóa đồng ý (chúng không có trên tờ) | Một nguồn chữ duy nhất. Sửa chữ RU thì sửa cả trang và tờ, và đổi version |
| T4 | Tiêu đề: giữ `Your ID details` (Lora), dòng phụ RU **Данные ваших документов** (thay "Thông tin giấy tờ của bạn"). Dùng đúng cụm "данные ваших документов" của câu 1 | Tiêu đề không phải câu pháp lý, UXD đặt. CPY xem lại khi review tờ |
| T5 | Chân tờ RU: `OTTIMO · ID notice · v2 · 11/2026` (giữ tiếng Anh, giống tờ EN/VI, để nhân viên nhận ra phiên bản) | – |
| T6 | **Font:** tiêu đề và dòng phụ RU dùng Lora (có Kirin, `lora-cyrillic-500`). Thân chữ RU **không dùng được Be Vietnam Pro** (không có Kirin). Dùng **Onest** như landing `/ru/` (LP-v2 design mục 1), cả cột RU. Cột EN giữ Be Vietnam Pro. Nhúng font (base64, cách `doc_fonts.py` của P4-21), không tải Google Fonts, để in ở quầy khi mất mạng vẫn đúng | Dùng Arial thì in vẫn được, nhưng tờ giấy nằm lâu ở quầy, nên chọn font cùng landing. Onest chưa có trong `landing-web` của `main` thì lấy theo gói LP-v2 trên `main@L` |
| T7 | Đo vừa tờ bằng `window.__measure` có sẵn trong tờ: RU dài hơn EN khoảng 13–26 % mỗi đoạn. Cột RU dùng cùng `--fs` với cột EN nếu vừa; không vừa thì hạ cột RU tối đa 0,5 pt (như cách `--fs-vi` đang làm), không hạ dưới 10 pt | Chỉ làm **A4**. Bản A5 và A4-2-bản cho RU bỏ, trừ khi INV/OWN cần: A5 với 4 đoạn RU sẽ dưới cỡ đọc được |
| T8 | Xuất PDF `print/pdf/to-4-your-id-details-a4-ru.pdf` cùng cách các tờ khác (A4, tỉ lệ 100 %) | – |
| T9 | Bản máy tính bảng RU: **không làm ở v1.0.4.** `build_guides.py` hiện chỉ đọc tờ A4 EN/VI. Ghi vào việc sau nếu quầy cần | Báo BA: `02-le-tan.md` trích tờ EN/VI phải cập nhật theo T1 (thêm đoạn dịch), rồi dựng lại HTML hướng dẫn |
| T10 | Thứ tự: T1 và T2–T8 xong **trước bước 6.4 ý 5.2** (INV/OWN thay tờ v2 ở quầy), tức là trước khi OWN đặt tham số `privacy_notice_version` = v2 | Tờ ở quầy phải là v2 cả EN/VI lẫn RU trước khi Desk ghi v2 |

Kiểm khi review tờ (QA/CPY): so từng câu RU trên tờ với 4 dòng ở mục 2 (sao chép, không gõ lại); kiểm U+00A0; tờ in A4 không tràn; font nhúng (mở khi mất mạng vẫn là Lora/Onest); không có tên khách hay số giấy tờ trên tờ mẫu.

---

## 4. Gợi ý cho lượt chữ sau (không chặn P4-42)

- **S1.** "контакт" → "контактные данные" ở `gw.notice_translation` **và** câu Δ5 RU của landing, cùng một lượt. Nghĩa gần như không đổi, nhưng đây là câu pháp lý: đổi chữ = version mới, và SEC phải đối chiếu lại. Chỉ làm khi có lý do khác để nâng version.
- **S2.** Thân chữ guest-web RU: cân nhắc dùng Onest như landing `/ru/` thay Arial, cho trang khách và landing cùng một nét. Cần ARC/MOB xem cỡ tải.
- **S3.** Như CPY và SEC đã ghi: thay "апартаменты" ở `gw.room`, `guest.oci.done_body`, `guest.stay.checkin_time`, `msg.hot_water_issue` bằng "номер". Việc của UXD + CPY ở lượt chữ sau.

## 5. Giả định
- G1. Không có người bản xứ đọc. Độ tự nhiên ở đây dựa trên UXD so với RU landing đã duyệt (INV 04/11). Rủi ro còn lại thấp: các câu là văn mẫu thông báo phổ biến.
- G2. Thêm U+00A0 ở `{days}⍽дн.` chỉ là kiểu chữ. Nếu SEC coi đây là đổi chuỗi pháp lý, bỏ U+00A0 thì 10 khóa kia vẫn ĐẠT.
- G3. Tờ RU chỉ cần khổ A4 (T7). OWN cần A5 hoặc A4-2-bản cho RU thì báo UXD.
