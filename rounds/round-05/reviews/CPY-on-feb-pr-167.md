# CPY review chữ hướng khách trong PR #167 của FE-B (V5-24 tiếng Nga, V5-23 phần trang khách)

- Người review: CPY | Round 5 – v1.0.5 – bước **Review** | 07/11/2026
- Đối tượng: PR #167 `r5-feb-g2-guest` @ `838be376` (đã gộp `main` @ `fc4c2b08`). Chỉ đọc bằng `gh pr diff 167` và `git show 838be376:<tệp>`, không checkout nhánh PR.
- Đã đọc:
  - `product/design/copy/strings-{en,vi,ru}.json` @ `838be376` so với `fc4c2b08`;
  - `product/design/tools/gen_strings.py` (diff) và `product/services/api/src/generated/quote-copy.ts` @ `838be376`;
  - mã trang khách: `GuestShell.tsx`, `HomePage.tsx`, `RequestsPage.tsx` 255–266;
  - test: `guest-copy-lint.test.ts`, `v5-24-ru-copy.test.tsx`, `requests.test.tsx`, `tests/e2e/ui/guest-web.h18.spec.ts` (TC-L7-053), `v5-24-guest-ru-font.r5.spec.ts`.
- Chữ đã duyệt dùng để so:
  - `rounds/round-05/outputs/UXD/copy-v1.0.5.md` trên `main` (bản 2.7), mục 4.6, 4.20 (a) và (b), 4.21, 5.1. Chữ ở các mục này không đổi từ bản 1.1;
  - thẻ CPY 01, 02, 06–10 trong `rounds/round-05/reviews/CPY-on-uxd-copy-v1.0.5.md`. Lượt 2 (mục 9 tệp đó) đã xác nhận bản 1.1 khớp nguyên văn các thẻ.
- Brand: `00-brief/context/brand/brand-guidelines.md`. Với khách: ngắn, lịch sự, điềm tĩnh, EN dẫn, VI hỗ trợ, không emoji, không từ cảm thán.
- Tệp này không có dữ liệu khách, không có số hoa hồng.

---

## 0. Kết luận

**DUYỆT.** Chữ khách trong PR #167 đúng từng ký tự với chữ CPY đã duyệt. Không còn điều kiện nào về chữ trước khi gộp.

| Mục | Kết quả |
|---|---|
| Khớp chữ đã duyệt | **31/31** cặp khóa–ngôn ngữ khớp. Gồm 28 cặp đổi, trùng từng byte với bảng chữ, và 3 cặp bảng chữ ghi "giữ" vẫn giữ đúng: EN `msg.booking_confirmed`, EN `msg.deposit_received`, VI `gw.req.clean_long_fee` |
| Đổi ngoài phạm vi | **0.** PR đổi đúng 28 cặp chữ khách, và cả 28 đều có trong bảng chữ |
| Chia cách "номер" | Đúng ở cả 9 chỗ trong 7 chuỗi V5-24. Chỗ "в номере" có sẵn ở `msg.house_rules_smoking` cũng đúng. Xem mục 2 |
| Giọng thương hiệu | Đạt. 0 emoji. 0 dấu "!" trong chữ khách EN, VI. RU chỉ còn lời chào "Здравствуйте, {name}!" như đã duyệt. 0 từ cấm |
| KO, ZH | PR không đụng. Trang khách chỉ có VI, EN, RU, và repo không có `strings-ko/zh.json` |
| Thẻ | **0 Blocker, 0 Major, 0 Minor, 1 Suggestion** (FB-R5-CPY-FE-167-01, không chặn gộp) |
| ESC | **Không** |

---

## 1. Cách kiểm và bảng đối chiếu

Cách kiểm:
- Một script đọc chữ duyệt **thẳng từ** `copy-v1.0.5.md`, không gõ lại tay: bảng 4.6, bảng 4.20 (a) và khung `sale.quote_text` VI, bảng 4.21, bảng 5.1, khung `sale.quote_text` RU, 3 khối `msg.*`, bảng `gw.req.clean_long_fee`.
- Script so bằng `==` với `strings-*.json` @ `838be376`.
- Sau đó liệt kê mọi khóa đổi giữa `fc4c2b08` và `838be376`, để tìm chỗ đổi không có trong bảng chữ.
- Ký tự đặc biệt cũng phải khớp:
  - gạch ngang "–" (U+2013) ở `gw.req.clean_makeup_free` và dòng 1 báo giá;
  - gạch dài "—" (U+2014) ở "остаток {balance} — при заселении";
  - mũi tên "→" (U+2192);
  - chữ "ё" ở "Счёт", "придёт";
  - dấu nháy ASCII ở "we've", "We're", "isn't". Cả 42 chuỗi khách EN có dấu nháy đều dùng ASCII, nên nhất quán.
- `gen_strings.py` (nguồn) khớp JSON (tệp sinh). Dòng 5 và 57 của `quote-copy.ts` khớp `sale.quote_text` VI, RU trong JSON. RU báo giá không còn "Депозит".

| Khóa | EN | VI | RU | Nguồn duyệt |
|---|---|---|---|---|
| `guest.stay.checkin_time` | – | – | Khớp | 5.1, C1 |
| `guest.oci.done_body` | – | – | Khớp | 5.1, C1 |
| `gw.room` | – | (giữ "Căn", 4.20 c v1.0.6) | Khớp | 5.1, C1 |
| `sale.quote_text` | – | Khớp (dòng 2 "Phòng") | Khớp (dòng 2 "Номер", dòng 4 "Предоплата, чтобы закрепить номер") | 4.20 (a), 5.1, thẻ 01, 02 (a) |
| `msg.booking_confirmed` | Giữ, đúng | Khớp ("phòng {room}") | Khớp ("Предоплата {deposit} получена, остаток {balance} — при заселении.") | 5.1, 4.20 (b), thẻ 08 |
| `msg.deposit_received` | Giữ, đúng | Khớp | Khớp | 5.1, 4.20 (b) |
| `msg.hot_water_issue` | Khớp | Khớp | Khớp | 5.1, thẻ 06 |
| `gw.req.clean_long_fee` | Khớp (bỏ "rent") | Giữ, đúng | Khớp (bỏ "аренда") | 5.1, thẻ 09 |
| `gw.req.clean_makeup_free` | – | Khớp | – | 4.20 (a) |
| `gw.req.clean_second_fee` | – | Khớp | – | 4.20 (a) |
| `gw.lang_auto` | Khớp | Khớp | Khớp | 4.6, C2 |
| `gw.lang_auto_sr` (mới) | Khớp | Khớp | Khớp | 4.6, thẻ 10 |
| `msg.house_rules_smoking` | Khớp | Khớp | Khớp | 4.21, thẻ 07 |
| `msg.bill` | – | – | Khớp | 4.21, thẻ 07 |
| `guest.late.done_title` | Khớp | Khớp | – | 4.21, thẻ 07 |

Chỗ dùng cũng đúng ý thẻ 10:
- `GuestShell.tsx` dùng `gw.lang_auto_sr` **chỉ** ở `span.sr-only#gw-lang-state`;
- `HomePage.tsx` giữ `gw.lang_auto` cho dòng chữ dưới lời chào;
- `requests.test.tsx` kiểm đúng 1 dòng hiện, cộng mô tả của ô chọn là "Language selected for you", và cả trang không có "browser", "trình duyệt", "браузер".

Không chữ nào còn nói ngôn ngữ lấy từ đâu, nên BUG-R2-218 đóng đúng nghĩa.

---

## 2. Chia cách của "номер" trong từng câu RU

| Khóa | Cụm | Cách, giống, số | Kết luận |
|---|---|---|---|
| `guest.stay.checkin_time` | (номер всегда готов к 14:00) | Chủ ngữ nguyên cách. Tính từ ngắn giống đực số ít "готов". Câu cũ dùng số nhiều "апартаменты … готовы" | Đúng |
| `guest.oci.done_body` | если номер уже готов; к 14:00 он готов всегда | Nguyên cách. Đại từ "он" (giống đực) thay "они" | Đúng |
| `gw.room` | Номер | Nhãn, nguyên cách | Đúng |
| `sale.quote_text` dòng 2 | Номер {room} {room_name}, … | Nguyên cách, đầu dòng | Đúng |
| `sale.quote_text` dòng 4 | Предоплата, чтобы закрепить номер: {deposit}. | Đối cách. Danh từ bất động vật nên trùng dạng nguyên cách | Đúng |
| `msg.booking_confirmed` | бронирование {code}: номер {room}, … | Nguyên cách, đồng vị sau dấu hai chấm | Đúng |
| `msg.booking_confirmed` | (номер всегда готов к 14:00) | Như `guest.stay.checkin_time` | Đúng |
| `msg.booking_confirmed` | Предоплата {deposit} получена, остаток {balance} — при заселении. | "получена": phân từ bị động ngắn, giống cái số ít, hợp với "предоплата". Gạch dài thay động từ bị lược | Đúng |
| `msg.deposit_received` | (номер {room}, {from} → {to}) | Nguyên cách trong ngoặc | Đúng |
| `msg.hot_water_issue` | в номере {room} | Giới cách sau "в". Câu cũ dùng giới cách số nhiều "в апартаментах" | Đúng |
| `msg.house_rules_smoking` (có sẵn) | За курение в номере | Giới cách. PR chỉ đổi "!" thành "." | Đúng |

Hai câu RU đổi mà không có "номер":
- `gw.req.clean_long_fee` "При долгом проживании уборка не входит в стоимость." – "при" đi với giới cách "долгом проживании". Đúng.
- `msg.bill` "Спасибо, что остановились в OTTIMO, {name}." – tên thương hiệu không biến cách sau "в". Đúng.

Ở `msg.booking_confirmed`, "номер" đứng sau mã đặt phòng nên có thể bị đọc thành "số". Rủi ro này đã có trong danh sách người bản xứ (mục 10, câu 3, tệp review bảng chữ). Không mở thẻ mới.

---

## 3. Giọng thương hiệu

Quét mọi khóa hướng khách (`guest.*`, `gw.*`, `msg.*`, `sale.quote_*`, `bill.line.*`) ở 3 ngôn ngữ @ `838be376`:
- **Emoji:** 0. Không có ký tự hình nào.
- **Dấu "!":** 0 ở EN và VI. RU còn 7 chỗ, đều là lời chào "Здравствуйте, {name}!" ở đầu tin, như đã duyệt.
- **Từ cấm:**
  - RU: 0 "апартамент", "квартир", "посуточн", "депозит", 0 "аренд". Mẫu "доплат" chỉ khớp bên trong "предоплата", và trong `sale.quote_text_extra_guest_*` mà C6 giữ.
  - VI: "căn" chỉ còn ở đúng 6 khóa 4.20 (c), để v1.0.6. "phụ thu" chỉ còn ở họ `bill.line.*` và `sale.quote_text_extra_guest_*`, để C6 v1.0.6.
  - EN: 0 "rent", "apartment", "serviced", "cheap", "surcharge".
- **Câu mới đọc điềm tĩnh, đủ câu, không sáo.** "a reminder from OTTIMO" thay "a friendly reminder". "We're sorry for the inconvenience." thay câu cụt có "!". "Đã xong." thay "Xong!".
- **Độ dài:** không có nút, nhãn hay thanh đáy nào dài ra. Chỉ một câu RU dài thêm khoảng 12 ký tự: `gw.req.clean_long_fee`, một đoạn chữ trong `RequestsPage.tsx`, không cắt dòng, không `nowrap`. Các câu RU khác ngắn đi. Vì vậy CPY không đo lại bằng bản dựng. `v5-24-ru-copy.test.tsx` đã dựng các câu này trên trang.

---

## 4. Người bản xứ, SEC, luật sư

- PR không có câu RU nào mới so với lượt duyệt bảng chữ. 9 câu RU PR đưa lên đều nằm trong khối gửi người bản xứ, mục 10 của `CPY-on-uxd-copy-v1.0.5.md`: câu 1–9 và 11.
- Theo nguyên tắc CPY, bản RU chưa tính là xong cho tới khi INV báo người bản xứ đã đọc. Khối này vẫn là "INV chuyển khi tiện" và không chặn v1.0.5. Không đổi gì ở PR này.
- Không có câu pháp lý mới. Các khóa `gw.notice_*` và `guest.oci.consent*` không đổi. "предоплата" vẫn theo bảng thuật ngữ lp-v2 1.4.

---

## 5. Thẻ feedback

### FB-R5-CPY-FE-167-01
- Mức độ: Suggestion
- Vị trí:
  - `product/apps/guest-web/src/__tests__/guest-copy-lint.test.ts` dòng 18 (`GUEST_FACING`) và dòng 48 (`EMOJI`);
  - phạm vi ghi ở `copy-v1.0.5.md` mục 5.3.
- Vấn đề:
  1. Phạm vi `sale\.quote_text` bỏ sót 16 khóa × 3 ngôn ngữ đi thẳng vào mọi báo giá gửi khách:
     - các khóa: `sale.quote_nights_*`, `sale.quote_adults_*`, `sale.quote_kids_*`, `sale.quote_under6_*`;
     - `quotes.service.ts` ghép chúng vào `{nights_text}` và `{guests}`, và `gen-quote-copy.mjs` sinh chúng vào `quote-copy.ts`.
  2. Trang khách còn hiện 21 khóa ngoài 5 họ, gồm `common.*` (6), `error.*` (9), `field.*` (5) và `shell.skip`. Ví dụ `field.TOO_MANY_FILES`, `error.CARD_NUMBER_DETECTED`, `error.GUEST_LINK_INVALID`.
  3. Ở `EMOJI`, vế thứ hai là ký tự U+FE0F gõ thẳng (byte `EF B8 8F`). Ký tự này không hiện trong trình soạn thảo hay trong diff, nên người đọc test không biết nó có ở đó.
  - Hôm nay cả 37 khóa ở (1) và (2) đều sạch với bước 1–4: 0 từ cấm, 0 "căn", 0 "!", 0 emoji (CPY đã quét).
  - Thiếu sót phạm vi này đến từ thẻ CPY 11, tức CPY viết `sale.quote_text*`. FE-B làm đúng đặc tả.
- Vì sao quan trọng: v1.0.6 sẽ viết lại họ `sale.quote_*` (C6) và có thể thêm câu lỗi cho trang khách. Khi đó, không có gì chặn "!" hay từ cấm vào những chữ khách vẫn đọc.
- Đề xuất sửa:
  - FE-B:
    - thêm vào `GUEST_FACING` mẫu `sale\.quote_(nights|adults|kids|under6)_`. Tốt hơn nữa: lấy danh sách khóa từ `QUOTE_COPY` của `quote-copy.ts`, để test đi theo công cụ sinh;
    - thêm một tập `GUEST_SHARED` ghi rõ 21 khóa chung mà trang khách gọi, kèm ghi chú "thêm khóa ở đây khi guest-web gọi khóa mới ngoài 5 họ";
    - viết `\u{FE0F}` thay cho ký tự gõ thẳng.
  - Không mở rộng sang cả `sale.quote_*`, vì `sale.quote_title`, `sale.quote_active`… là chữ Desk cho sale đọc.
  - UXD sửa dòng phạm vi ở 5.3 cho khớp.
  - Làm ở PR này nếu FE-B còn sửa, không thì làm cùng bước 5 ở v1.0.6. Không chặn gộp.
- Trạng thái: Open

---

## 6. Điểm làm tốt nên giữ

- FE-B lấy chữ bằng script đọc thẳng bảng chữ và chỉ cho đổi đúng chỗ bảng ghi. Kết quả là 28/28 cặp trùng từng byte, kể cả gạch dài, "ё" và mũi tên. Đây là cách áp chữ đa ngôn ngữ nên giữ.
- Test so chữ bằng câu đã duyệt hoặc bằng `tv()` từ JSON, không viết câu khác: `v5-24-ru-copy`, `requests`, TC-L7-053. Ca cuối của `guest-copy-lint` đỏ khi một khóa 4.20 (c) đã sửa mà chưa gỡ khỏi danh sách chừa. Như vậy chữ cũ không quay lại được, mà danh sách chừa cũng không bị bỏ quên.
- Bản EN của `gw.req.clean_long_fee` và câu xin lỗi nước nóng cũng được áp, dù là mức "nên có". Cả gói chữ khách lên cùng một lượt, nên khách RU, VI và EN đọc cùng một giọng.

---

## 7. Tự kiểm của CPY

- [x] Đúng guideline: không emoji, không IN HOA, giọng điềm tĩnh. Dấu "!" chỉ còn ở lời chào RU đã duyệt.
- [x] 0 từ cấm ở mọi ngôn ngữ trên chữ PR đổi. Không nêu số phòng, căn. Không giá ở thân trang (PR không đụng landing).
- [x] Mốc 14:00 và câu cọc ("Предоплата … получена", "Đã cọc") khớp chữ đã duyệt và BR đang chạy. Không có lời hứa mới.
- [x] Không đụng câu pháp lý.
- [x] Chia cách RU đúng (mục 2). PR không đụng chữ ko/zh.
- [x] Không có câu mới cho người bản xứ hay SEC. Khối RU cũ vẫn chờ INV chuyển (mục 4).

| 2026-11-07 | 5 | CPY – review chữ khách FE-B PR #167 @ 838be376 (rounds/round-05/reviews/CPY-on-feb-pr-167.md): **DUYỆT**. 31/31 cặp khóa–ngôn ngữ khớp chữ CPY đã duyệt (copy-v1.0.5 4.6, 4.20 a–b, 4.21, 5.1; thẻ 01, 06–10): 28 cặp đổi trùng từng byte, 3 cặp "giữ" đúng, 0 đổi ngoài bảng. Gồm 7 chuỗi RU "номер", báo giá RU "Предоплата", `gw.req.clean_long_fee` RU/EN, `gw.lang_auto` + `gw.lang_auto_sr` 3 ngôn ngữ, "phòng" ở 6 chuỗi VI, bỏ "!" ở 3 khóa 4.21 và tin nước nóng. Chia cách "номер" đúng ở 9 chỗ. Không đụng KO/ZH. 1 Suggestion FB-R5-CPY-FE-167-01 (lint 5.3 thêm 16 khóa ghép vào báo giá và 21 khóa chung trang khách hiện, viết \u{FE0F}), không chặn gộp. Khối RU cho người bản xứ không đổi. Không ESC | CPY | Quyền CPY (câu chữ hướng khách) |
