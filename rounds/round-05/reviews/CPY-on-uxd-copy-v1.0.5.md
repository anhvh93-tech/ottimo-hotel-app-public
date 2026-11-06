# CPY review chuỗi hướng khách trong bảng chữ v1.0.5 (UXD, Gói 2)

- Người review: CPY | Round 5 – v1.0.5 – bước **Review** | 06/11/2026
- Đối tượng: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` (commit `6b3700c6`), mục 7 "Cần CPY duyệt trước khi FE áp" (C1–C6). Báo cáo UXD: `rounds/round-05/outputs/UXD/report.md`.
- Đã đọc thêm:
  - nguồn chữ `product/design/tools/gen_strings.py` (nhóm `TEMPLATES`, `RU_EXTRA`, các dòng `bill.line.*`, `gw.*`, `guest.*`, `sale.quote_text*`) và tệp sinh `product/design/copy/strings-{vi,en,ru}.json`;
  - `rounds/round-04/outputs/CPY/lp-v2-copy.md` mục 1.4 (bảng thuật ngữ), 6 (từ cấm), 15.4, 16.2;
  - `product/apps/landing-web/scripts/dist-checks.mjs` (`BANNED`, dòng 272–284) và `src/content/copy.test.ts` (luật "no exclamation mark");
  - `product/docs/business-rules.md` 0.5.12: BR-012, BR-204, BR-412, BR-416, BR-428, BR-433, BR-438, BR-506;
  - `rounds/round-03/qa/bug-list.md` BUG-R3-035; `rounds/round-04/reviews/DOM-on-v104-pr89-minors.md` (FB-R4-DOM-UXD-PR89-02);
  - mã chỉ đọc: `apps/admin-web/src/app/folio.ts` (`VARIANT`, `lineLabel`), `apps/guest-web/src/pages/GuestShell.tsx`, `HomePage.tsx`, `RequestsPage.tsx`, `services/api/src/modules/sales/internal/quotes.service.ts` (ghép `sale.quote_text`);
  - `04-investor-feedback/FB-INV-002.md` (định vị: không để khách hiểu là căn hộ dịch vụ).
- Brand: `00-brief/context/brand/brand-guidelines.md`. Chữ cho khách: ngắn, lịch sự, điềm tĩnh, EN dẫn, VI hỗ trợ, không emoji, không từ cảm thán. Câu trên phiếu, bill, báo giá phải đúng nghĩa tiền.
- Không sửa mã, không sửa tệp của UXD. Tệp này không có dữ liệu khách, không có số hoa hồng.

---

## 0. Kết luận

| Nhóm | Khóa | Kết luận | Điều kiện / ghi chú |
|---|---|---|---|
| C1 | 7 chuỗi RU "апартаменты" → "номер" | ~~DUYỆT CÓ ĐIỀU KIỆN~~ **DUYỆT** (lượt 2, mục 9: điều kiện đã áp ở bản 1.1) | 7 câu thay đúng, giữ nguyên chữ UXD. Điều kiện: cùng lượt sửa `sale.quote_text` RU, đổi dòng 4 "Депозит для бронирования" thành "Предоплата…" (thẻ 01, Major) |
| C2 | `gw.lang_auto` EN, VI, RU | **DUYỆT** | Giữ chữ UXD. Thẻ 10 (Suggestion) cho bản đọc màn hình |
| C3 | `bill.line.early_departure_fee_same_day`, `_notice_one`, `_notice_other` | **DUYỆT** | Đúng BR-428. Thẻ 03 (Minor): khoảng trắng không ngắt sau `{noticeDays}`, nên làm cùng lượt |
| C4 | `bill.line.late_fee_as_night` | **DUYỆT** | Đúng BR-416 với dòng hệ thống ghi. Thẻ 04 (Minor): DOM, BE-B xác nhận ca quản lý sửa giảm thẳng dòng này. Thẻ 05 (Suggestion): ngoặc ở bản VI |
| C5 | Dấu "!" ở `msg.hot_water_issue` | ~~DUYỆT CÓ ĐIỀU KIỆN~~ **DUYỆT** (lượt 2, mục 9: 3 câu đã vào bản 1.1 nguyên văn) | Đồng ý hướng UXD: dấu chấm. Điều kiện: áp đúng 3 câu ở thẻ 06. Giữ "Здравствуйте, {name}!" (cách chào chuẩn tiếng Nga), đưa vào danh sách người bản xứ |
| C6 | "phụ thu" ở họ `bill.line.*` (để sau v1.0.5) | Ý kiến ngắn ở mục 2 | Đồng ý để sau. Làm một lượt ở v1.0.6, gộp với phần (c) của thẻ 02 |

Tổng: **0 Blocker, 2 Major, 6 Minor, 3 Suggestion.**

- Major 01 là điều kiện của C1. Major 02 là phát hiện ngoài mục 7: bản VI có cùng loại lỗi với bản RU mà V5-24 đang sửa. Phần (a) của thẻ 02 nên vào v1.0.5 vì báo giá VI gửi khách mỗi ngày và tệp `quote-copy.ts` được sinh lại trong lượt này.
- ESC mới: **không**. Không có câu nào đụng chính sách giá, cọc, hủy hay văn bản pháp lý. Không có câu hỏi cho INV ngoài việc chuyển danh sách người bản xứ (mục 3).

### Đã kiểm
- Quét máy mọi khóa hướng khách (`guest.*`, `gw.*`, `msg.*`, `sale.quote_text*`, `bill.line.*` và mọi khóa có cột RU, 213 khóa RU) ở cả 3 ngôn ngữ. Mẫu quét: từ cấm của `BANNED` landing, "phụ thu", "căn", "доплат", "аренд", "депозит", dấu "!", emoji.
  - Sau khi áp C1: 0 "апартамент", 0 "квартир", 0 "посуточн" ở RU.
  - Còn lại các chỗ ghi ở thẻ 01, 02, 07, 08, 09.
- C1 khớp bảng thuật ngữ CPY đã duyệt: lp-v2-copy 1.4 ghi "номер / тип номера" cho phòng. Mục 16.2 ghi "номер" là phòng khách sạn. Landing RU có đúng câu cùng ý: "Заселение с 12:00, если номер готов; к 14:00 он готов всегда".
- Chia cách tiếng Nga đúng: "номер" (nguyên cách), "в номере" (giới cách), "он готов" (giống đực).
- Mốc 14:00 trong 3 chuỗi RU giữ nguyên, khớp cam kết FB-INV-004 và bản EN, VI.
- C2: ô chọn ngôn ngữ nằm ở `TopBar` đầu trang (`GuestShell.tsx` 130–132), nên "ở đầu trang" đúng.
- C3, C4: đối chiếu `lineLabel` và `VARIANT` trong `folio.ts`. Phiếu in VI và EN (không có RU), nên 2 cột là đủ.

---

## 1. Kết luận từng nhóm

### C1 – 7 chuỗi RU
Duyệt nguyên văn 7 câu ở mục 5.1 của UXD:
- `guest.stay.checkin_time`: Заезд с {time} (номер всегда готов к 14:00)
- `guest.oci.done_body`: Заезд с {time}, если номер уже готов; к 14:00 он готов всегда. Код от двери администратор выдаст при заезде.
- `gw.room`: Номер
- `sale.quote_text` dòng 2: Номер {room} {room_name}, {from} → {to} ({nights_text}), {guests}.
- `msg.booking_confirmed`, `msg.deposit_received`, `msg.hot_water_issue`: thay đúng như bảng.

Lý do chọn "номер": đây là từ chuẩn cho phòng lưu trú, không gợi thuê căn hộ. CPY đã dùng từ này trên landing RU và INV đã duyệt. Bản EN dùng "Room".

Điều kiện: thẻ 01. Câu thêm cho các mẫu tin RU nằm ở thẻ 06, 07, 08. Mẫu tin chưa có mã nào gọi, nên các thẻ đó không chặn C1.

`gw.room` không còn chỗ dùng trong `apps/guest-web` (trang khách dùng `gw.room_label` "Phòng / Room / Номер"). Vẫn sửa ở nguồn như UXD đề nghị. UXD có thể cân nhắc xóa khóa này ở lượt sau.

### C2 – `gw.lang_auto`
Duyệt:
- EN: You can change the language at the top of the page.
- VI: Bạn có thể đổi ngôn ngữ ở đầu trang.
- RU: Язык можно сменить вверху страницы.

Câu ngắn và luôn đúng, không nói nguồn chọn ngôn ngữ, nên hết lỗi BUG-R2-218. Giọng điềm tĩnh. Bản RU tự nhiên.

### C3 – 3 dòng phí trả sớm
Duyệt:
- `_same_day`: VI "Phí trả phòng sớm (báo trong ngày rời)", EN "Early departure fee (same-day notice)".
- `_notice_one`: VI "Phí trả phòng sớm (báo trước {noticeDays} ngày)", EN "Early departure fee ({noticeDays} day's notice)".
- `_notice_other`: VI như dòng trên, EN "Early departure fee ({noticeDays} days' notice)".

Đúng nghĩa tiền theo BR-428:
- Báo trong ngày rời: không hoàn, dòng giữ lại là tiền các đêm bỏ.
- Báo trước ≥ 1 ngày: hoàn 50 %, dòng giữ lại là nửa còn lại.
- Nhãn chỉ nói số ngày báo trước, không nói %, không hứa hoàn. Nên đúng với mọi trường hợp.
- Đơn OTA (`noticeDays` null) vẫn dùng khóa gốc "Early departure fee", đúng câu cuối BR-428.

Dạng sở hữu EN đúng: "1 day's notice", "3 days' notice". "báo trong ngày rời" khớp cách DOM gọi "ngày rời đi mới", nên giữ.

Nên làm cùng lượt: thẻ 03.

### C4 – `bill.line.late_fee_as_night`
Duyệt:
- VI: Phụ thu trả muộn bằng giá 1 đêm.
- EN: Late check-out fee (one night's rate).

Đúng nghĩa tiền theo BR-416. Khoản này là "phụ thu thay đêm", bằng giá gợi ý của đêm ngày đi. Miễn hoặc giảm theo BR-433 đi bằng dòng FOC riêng, nên số trên dòng vẫn bằng giá một đêm. Chữ "fee" giữ cùng họ với "Late check-out fee ({time})". Bỏ giờ là đúng (BUG-R3-035): khoản không tính theo giờ, và giờ sau nửa đêm dễ đọc nhầm ngày.

Còn một ca cần xác nhận: thẻ 04. Chữ "Phụ thu" giữ trong v1.0.5 cho cùng họ, theo C6.

### C5 – dấu "!" ở `msg.hot_water_issue`
Đồng ý với UXD: dùng dấu chấm ở cả 3 ngôn ngữ.
- Đây là tin xin lỗi khi có sự cố. Dấu "!" ở câu xin lỗi đọc như vội, hoặc như xin lỗi cho có. Giọng OTTIMO là điềm tĩnh.
- Guideline tránh từ cảm thán. Landing đã có test chặn "!" ở mọi ngôn ngữ (`copy.test.ts`, "no exclamation mark").
- Câu áp: thẻ 06.

Lời chào RU "Здравствуйте, {name}!": đồng ý giữ trong v1.0.5. Trong tiếng Nga, dấu "!" sau lời chào có tên là dấu câu quy ước, không mang sắc thái reo lên. Đổi lời chào phải đổi cả 8 mẫu, ngoài phạm vi. Câu hỏi "!" hay "." cho giọng điềm tĩnh đã đưa vào danh sách người bản xứ (mục 3). Nếu sau này thêm test chặn "!" cho `msg.*`, test cần chừa riêng mẫu lời chào này (thẻ 11).

---

## 2. C6 – ý kiến ngắn (để sau v1.0.5)

- Đồng ý để sau và đổi cả họ trong một lượt. Dòng `bill.line.*` dùng chung cho folio trên Desk và phiếu in, sổ tay BA cũng trích các chữ này. Đổi lẻ một dòng sẽ lệch.
- Hướng đề xuất cho VI ở v1.0.6 (EN đã trung tính, giữ nguyên):
  - "Phụ thu nhận sớm (nhận lúc {time})" → "Phí nhận phòng sớm (nhận lúc {time})";
  - "Phụ thu trả muộn ({time})" → "Phí trả phòng muộn ({time})";
  - "Phụ thu trả muộn bằng giá 1 đêm" → "Phí trả phòng muộn (bằng giá 1 đêm)";
  - "Phụ thu người vượt định mức · đêm {date}" → "Phí khách thêm · đêm {date}"; dạng có số: "Phí {count} khách thêm · đêm {date}".
- `sale.quote_text_extra_guest_*` VI "Gồm phụ thu {n} người ngủ sofa" → "Đã gồm phí {n} khách ngủ sofa". Câu này do CPY viết ở lp-v2 15.2, nên CPY nhận sửa trong cùng lượt.
- RU "доплата за … гостя" là cách nói trung tính quen trên trang đặt phòng tiếng Nga, có thể giữ. Người bản xứ xác nhận.
- Chữ Desk nội bộ (lễ tân đọc) có thể giữ "phụ thu". Chỉ đổi chữ khách cầm hoặc khách đọc.
- Gộp vào cùng lượt: phần (c) của thẻ 02 ("căn" trên dòng phiếu).

---

## 3. Danh sách cho người bản xứ (RU) – INV chuyển

Thêm vào lượt đọc RU ở lp-v2-copy mục 9. Xếp từ rủi ro cao xuống:

1. **(rủi ro cao nhất – nghĩa tiền)** Báo giá: "Предоплата, чтобы закрепить номер: {deposit}. Остальное оплачивается при заселении." (thẻ 01).
   - Hỏi: khách có hiểu đây là tiền trả trước, trừ vào tổng, không phải tiền đặt cọc hoàn lại khi đi không?
   - Có cần bản ngắn hơn "Предоплата для брони: {deposit}." không?
2. **(rủi ro cao – giọng)** Lời chào "Здравствуйте, {name}!" so với "Здравствуйте, {name}.". Hỏi: với một boutique stay điềm tĩnh, dấu chấm có đọc lạnh hoặc cộc không?
3. "номер" ngay sau mã đặt phòng: "бронирование {code}: номер {room}". Hỏi: có đọc nhầm thành "số" không? Nếu có, viết "ваш номер {room}".
4. Báo giá "Номер {room} {room_name}" (ví dụ "Номер 401 The Pine"): thứ tự có tự nhiên không?
5. "Приносим извинения за неудобства." kết bằng dấu chấm (thẻ 06).
6. "Предоплата {deposit} получена, остаток {balance} — при заселении." (thẻ 08).
7. "При долгом проживании уборка не входит в стоимость. Каждая уборка стоит {amount}." (thẻ 09). Câu này đang chạy trên trang khách.
8. "Спасибо, что остановились в OTTIMO, {name}." (thẻ 07).
9. "Язык можно сменить вверху страницы." (C2).
10. Câu đang chạy, chưa có thẻ: tiêu đề `gw.house_rules` "Правила проживания и штрафы". Bản EN là "House rules and fees".
    - Hỏi: "штрафы" (tiền phạt) có nặng hơn ý EN không?
    - Có từ nào trung tính hơn mà vẫn đúng không?
11. "OTTIMO получил предоплату" (giống đực, ở `msg.deposit_received`) so với "Мы получили" (ở `msg.hot_water_issue`). Hỏi: nên thống nhất một cách nói không?

Không có câu KO/ZH trong gói này (trang khách chỉ có VI, EN, RU).

**Cho SEC / luật sư:** không có câu pháp lý mới. Thẻ 01 dùng "предоплата" theo bảng thuật ngữ lp-v2 1.4. Luật sư vẫn đang xem chữ này (lp-v2 mục 8, cùng câu hỏi "депозит"). Nếu luật sư chọn khác thì đổi landing và báo giá cùng lúc.

---

## 4. Thẻ feedback

### FB-R5-CPY-UXD-V105-01
- Mức độ: Major
- Vị trí: `copy-v1.0.5.md` mục 5.1, khóa `sale.quote_text` RU dòng 4 (`gen_strings.py` dòng 1176; sinh ra `services/api/src/generated/quote-copy.ts` dòng 57).
- Vấn đề:
  - UXD sửa dòng 2 và ghi "Các dòng khác giữ nguyên". Dòng 4 đang là "Депозит для бронирования: {deposit}. Остальное оплачивается при заселении."
  - Bảng thuật ngữ CPY đã duyệt (lp-v2-copy 1.4) ghi rõ: ru "предоплата", **không** "депозит". Ở Nga, "депозит" thường hiểu là tiền đảm bảo hư hỏng, trả lại khi đi.
  - Các chữ RU khác của OTTIMO đều đã dùng "предоплата": `msg.booking_confirmed`, `msg.deposit_received`, landing.
- Vì sao quan trọng:
  - Đây là câu tiền trong báo giá gửi khách.
  - Khách RU có thể nghĩ khoản cọc sẽ được trả lại khi trả phòng, hoặc là tiền ngoài tổng. Dễ thành tranh chấp khi hủy (cọc không hoàn theo chính sách).
  - Lượt này đã sinh lại `quote-copy.ts`, nên sửa thêm gần như không tốn gì.
- Đề xuất sửa:
  - Dòng 4 RU: "Предоплата, чтобы закрепить номер: {deposit}. Остальное оплачивается при заселении." Ý khớp EN "Deposit to hold the room" và câu landing "предоплата… закрепит номер за вами".
  - Toàn bộ `sale.quote_text` RU sau khi sửa:
    ```
    OTTIMO Boutique Stay – предложение {code}
    Номер {room} {room_name}, {from} → {to} ({nights_text}), {guests}.
    Стоимость проживания: {room_total}{discount_note}.
    Предоплата, чтобы закрепить номер: {deposit}. Остальное оплачивается при заселении.
    Предложение действительно до {expires}.
    ```
  - Kiểm sau khi áp: `quote-copy.ts` không còn "Депозит".
- Trạng thái: Fixed (UXD, bản 1.1 của `copy-v1.0.5.md` mục 5.1: dòng 4 RU "Предоплата, чтобы закрепить номер: …", chép toàn bộ `sale.quote_text` RU theo khung của thẻ) → **Closed** (CPY lượt 2, mục 9)

### FB-R5-CPY-UXD-V105-02
- Mức độ: Major (phần a); phần b, c có thể Deferred
- Vị trí:
  - chuỗi VI hướng khách có chữ "căn" đứng riêng;
  - phát hiện khi rà C1, không thuộc mục 7.
- Vấn đề:
  - V5-24 bỏ "апартаменты" ở RU. Nhưng bản VI của chính các chuỗi đó vẫn gọi phòng là "căn". "Căn" là từ nội bộ, gợi "căn hộ".
  - Landing đã chặn chữ này bằng test: `dist-checks.mjs` dòng 281, mẫu `/(?<!\p{L})căn(?!\p{L})/iu`.
  - Design System đã đổi nhãn trang khách từ "Căn" sang "Phòng" (`gw.room_label`, ghi chú "BR-012 khách chỉ thấy tên phòng"). Bản EN đều là "Room".
  - Các chỗ còn "căn":
    - (a) **đang chạy và gửi khách:**
      - `sale.quote_text` dòng 2 "Căn {room} {room_name}…", có trong mọi báo giá VI;
      - `gw.req.clean_makeup_free` "Hôm nay căn chưa được dọn – lần dọn này miễn phí.";
      - `gw.req.clean_second_fee` "Căn đã được dọn đầy đủ lúc {time} hôm nay. …";
    - (b) **mẫu tin chưa nối mã:**
      - `msg.booking_confirmed` "…: căn {room}, …";
      - `msg.deposit_received` "(căn {room}, …)";
      - `msg.hot_water_issue` (xem thẻ 06);
    - (c) **dòng phiếu dùng chung với folio Desk**, cùng các khóa chưa dùng:
      - `bill.line.room_night_room`, `bill.line.extra_night_room`, `bill.line.room_change`;
      - khóa chưa dùng: `guest.stay.room`, `guest.late.how_1`, `gw.room` (VI).
- Vì sao quan trọng:
  - FB-INV-002: INV không muốn khách hiểu OTTIMO là căn hộ dịch vụ.
  - Khách VI là nhóm đông nhất, và báo giá là tin bán hàng quan trọng nhất trước khi khách cọc.
  - Sửa RU mà để VI thì cùng một lỗi định vị vẫn còn ở ngôn ngữ chính.
- Đề xuất sửa:
  - (a) Vào v1.0.5, cùng lượt sinh lại `quote-copy.ts`:
    - `sale.quote_text` VI dòng 2: "Phòng {room} {room_name}, {from} → {to} ({nights_text}), {guests}.";
    - `gw.req.clean_makeup_free`: "Hôm nay phòng chưa được dọn – lần dọn này miễn phí.";
    - `gw.req.clean_second_fee`: "Phòng đã được dọn đầy đủ lúc {time} hôm nay. Dọn đầy đủ thêm lần nữa có phí {amount}."
  - (b) Cùng C5 nếu PO nhận (mẫu tin, rẻ):
    - `msg.booking_confirmed`: "…xác nhận đặt phòng {code}: phòng {room}, …";
    - `msg.deposit_received`: "…(phòng {room}, {from} → {to})…";
    - `msg.hot_water_issue`: theo thẻ 06.
  - (c) v1.0.6 cùng lượt C6 (BA sửa sổ tay cùng lúc):
    - "Tiền phòng {room} · đêm {date}";
    - "Đêm thêm {date} · phòng {room} – trả phòng sau mốc trả muộn";
    - "Chênh lệch đổi phòng {from} → {to}";
    - `guest.stay.room` "Phòng {room} · {room_name}";
    - `guest.late.how_1` "Đến cửa phòng {room}, …";
    - `gw.room` "Phòng", hoặc xóa khóa.
  - Chữ Desk nội bộ giữ "căn".
  - Sau phần (a), FE-B thêm kiểm như thẻ 11.
- Trạng thái: (a) Fixed – mục 4.20 (a), bắt buộc v1.0.5 · (b) Fixed – mục 4.20 (b) và 5.1, nên có, cùng lượt C5 (PO quyết định 15) · (c) Deferred – v1.0.6, backlog R5-B-03, gộp C6 → (a) **Closed**, (b) **Closed**, (c) Deferred **CPY đồng ý** (CPY lượt 2, mục 9)

### FB-R5-CPY-UXD-V105-03
- Mức độ: Minor
- Vị trí: mục 4.1, `bill.line.early_departure_fee_notice_one` / `_other` (VI và EN).
- Vấn đề:
  - Số `{noticeDays}` và chữ "ngày" / "day's" / "days'" nối bằng khoảng trắng thường.
  - Trên phiếu in khổ hẹp, hoặc cột tên dòng ở folio 362 px, dòng có thể gãy thành "(báo trước 2" / "ngày)".
  - Content-guide mục 2 và CPY SKILL mục 3 yêu cầu không ngắt giữa số và đơn vị.
- Vì sao quan trọng: đây là dòng tiền trên phiếu khách cầm. Số rời khỏi đơn vị thì khó đọc và trông cẩu thả.
- Đề xuất sửa:
  - Đặt U+00A0 ngay sau `{noticeDays}`, viết thẳng ký tự như 3 chỗ U+00A0 đã có trong `gen_strings.py`:
    - VI: "Phí trả phòng sớm (báo trước {noticeDays} ngày)";
    - EN: "Early departure fee ({noticeDays} day's notice)" / "({noticeDays} days' notice)".
  - Trong 2 ví dụ trên, `\u00A0` chỉ chỗ đặt ký tự U+00A0, không gõ 6 ký tự này vào nguồn. Test so chữ lấy bằng `tv(key)`.
- Trạng thái: Fixed (mục 4.1: U+00A0 sau `{noticeDays}` ở VI và EN của `_notice_one`, `_notice_other`) → **Closed** (CPY lượt 2, mục 9)

### FB-R5-CPY-UXD-V105-04
- Mức độ: Minor
- Vị trí: mục 4.8, `bill.line.late_fee_as_night`; BR-438 (3) (v0.5.12).
- Vấn đề:
  - Nhãn khẳng định số tiền "bằng giá 1 đêm" / "(one night's rate)". Điều này đúng khi dòng do B18 ghi, và khi miễn/giảm đi bằng dòng FOC riêng (BR-416, BR-433).
  - Nhưng BR-438 (3) mới cho quản lý, chủ đầu tư **sửa giảm thẳng** mọi dòng phát sinh trên folio mở. Nếu dòng thay thế giữ `chargeCode = 'late_fee_as_night'`, phiếu sẽ ghi "Late check-out fee (one night's rate)" bên cạnh một số nhỏ hơn giá một đêm.
- Vì sao quan trọng: câu trên bill phải đúng nghĩa tiền. Sai lệch có lợi cho khách, nhưng vẫn là chữ sai trên chứng từ.
- Đề xuất sửa:
  - DOM xác nhận: dòng này giảm chỉ bằng FOC, hay được sửa giảm thẳng theo BR-438 (3)?
  - Nếu được sửa thẳng, BE-B (`line-labels.ts`) trả nhãn không nói số tiền cho dòng thay thế có số < `limit_ref_vnd`. CPY đề xuất khóa mới:
    - `bill.line.late_fee_after_limit`: VI "Phụ thu trả muộn (rời sau mốc trả muộn)", EN "Late check-out fee (after the late check-out limit)";
    - cùng khuôn với `bill.line.extra_night`.
  - Không chặn v1.0.5 nếu V5-16 chưa lên cùng bản.
- Trạng thái: Fixed (bản 1.2 của `copy-v1.0.5.md` mục 4.8: DOM xác nhận ca sửa thẳng xảy ra được, `rules-v1.0.5.md` mục 10. `bill.line.late_fee_after_limit` vào bảng chính theo chữ CPY; BE-B chọn nhãn theo `amount_vnd` so với `limit_ref_vnd`, mục 6) → **Closed** (CPY lượt 3, mục 12)

### FB-R5-CPY-UXD-V105-05
- Mức độ: Suggestion
- Vị trí: mục 4.8, `bill.line.late_fee_as_night` VI.
- Vấn đề: các dòng phiếu cùng họ đặt phần giải thích trong ngoặc: "Phụ thu trả muộn ({time})", "Phí trả phòng sớm (báo trước…)". Bản EN mới cũng dùng ngoặc. Riêng bản VI viết liền "…trả muộn bằng giá 1 đêm".
- Vì sao quan trọng: nhất quán trên cùng một phiếu; người đọc tách tên khoản và cách tính dễ hơn.
- Đề xuất sửa: VI "Phụ thu trả muộn (bằng giá 1 đêm)". Chữ trên Desk (`co.*`) có thể giữ như cũ.
- Trạng thái: Fixed (mục 4.8: VI "Phụ thu trả muộn (bằng giá 1 đêm)") → **Closed** (CPY lượt 2, mục 9)

### FB-R5-CPY-UXD-V105-06
- Mức độ: Minor (là điều kiện của C5)
- Vị trí: mục 5.1 ghi chú C5; `TEMPLATES` → `msg.hot_water_issue` (`gen_strings.py` dòng ~3416–3419).
- Vấn đề:
  - Cả 3 ngôn ngữ kết bằng "!".
  - EN "Sorry for the inconvenience!" là câu cụt chủ ngữ, nghe vội.
  - VI "đã nhận báo mất nước nóng căn {room}" thiếu giới từ và dùng "căn". "Kỹ thuật" là tên bộ phận, không phải người đến phòng.
- Vì sao quan trọng: tin này gửi lúc khách đang khó chịu. Giọng điềm tĩnh, đủ câu, nói rõ ai đến và lúc nào là cách xin lỗi đúng thương hiệu.
- Đề xuất sửa:
  - EN: "Hi {name}, we've received your report of no hot water in room {room}. Our technician will be there by {time}. We're sorry for the inconvenience."
  - VI: "Chào {name}, OTTIMO đã nhận được tin báo phòng {room} không có nước nóng. Kỹ thuật viên sẽ đến trước {time}. Xin lỗi bạn vì sự bất tiện này."
  - RU: "Здравствуйте, {name}! Мы получили сообщение об отсутствии горячей воды в номере {room}. Техник придёт до {time}. Приносим извинения за неудобства."
  - Nếu PO chưa nhận phần (b) của thẻ 02, bản VI tạm giữ "căn {room}" thay "phòng {room}". Phần còn lại vẫn áp.
- Trạng thái: Fixed (mục 5.1: 3 câu EN, VI, RU theo chữ CPY; VI dùng "phòng {room}" vì 02 (b) đã nhận). Nên có, cùng lượt C5 → **Closed** (CPY lượt 2, mục 9)

### FB-R5-CPY-UXD-V105-07
- Mức độ: Minor
- Vị trí: các chuỗi hướng khách khác còn "!" (ngoài C5).
- Vấn đề:
  - `msg.house_rules_smoking`:
    - EN "Hi {name}, a friendly reminder: … Thank you!", VI "… Cảm ơn bạn!", RU "… Спасибо!";
    - "a friendly reminder" là cụm sáo, dễ đọc thành nhắc khéo kiểu khó chịu.
  - `msg.bill` RU: "Спасибо, что выбрали OTTIMO, {name}!". Bản RU cũng lệch ý EN: EN nói "for staying", RU nói "выбрали" (đã chọn).
  - `guest.late.done_title`: EN "All set! Your door code is ready", VI "Xong! Mã cửa của bạn đã sẵn sàng". Khóa này hiện chưa dùng trong `apps/guest-web`.
- Vì sao quan trọng: guideline tránh từ cảm thán. Landing đã chặn "!" bằng test. Mẫu tin và trang khách nên cùng giọng với landing.
- Đề xuất sửa:
  - `msg.house_rules_smoking`:
    - EN: "Hi {name}, a reminder from OTTIMO: smoking is allowed on the balcony only. Smoking indoors incurs an odour-treatment fee under our house rules. Thank you."
    - VI: "Chào {name}, OTTIMO xin nhắc: chỉ hút thuốc ở ban công. Hút thuốc trong phòng sẽ tính phí khử mùi theo nội quy. Cảm ơn bạn."
    - RU: "Здравствуйте, {name}! Напоминаем: курить можно только на балконе. За курение в номере взимается плата за удаление запаха согласно правилам проживания. Спасибо."
  - `msg.bill` RU: "Спасибо, что остановились в OTTIMO, {name}. Счёт {bill_no}: {amount}. Подробнее: {link}"
  - `guest.late.done_title`: EN "All set. Your door code is ready", VI "Đã xong. Mã cửa của bạn đã sẵn sàng".
  - Thời điểm: cùng lượt C5 nếu PO nhận, vì cùng nhóm `TEMPLATES` và đều rẻ. Không thì chuyển B-SAU cùng story nối mẫu tin (plan mục 6, quyết định PO số 14 – R1 của UXD).
- Trạng thái: Fixed (mục 4.21: `msg.house_rules_smoking` 3 ngôn ngữ, `msg.bill` RU, `guest.late.done_title` EN/VI). Nên có, cùng lượt C5; không kịp thì US-125 → **Closed** (CPY lượt 2, mục 9)

### FB-R5-CPY-UXD-V105-08
- Mức độ: Minor
- Vị trí: `msg.booking_confirmed` RU, câu "Предоплата {deposit}, остаток {balance} при заселении."
- Vấn đề:
  - EN viết "Deposit paid {deposit}", VI viết "Đã cọc {deposit}". RU chỉ ghi "Предоплата {deposit}", không nói đã nhận.
  - Khách RU có thể đọc là khoản trả trước **còn phải trả**, cộng với "остаток".
- Vì sao quan trọng: câu tiền trong tin xác nhận. Đọc nhầm thì khách chuyển khoản lần hai, hoặc nhắn hỏi lại.
- Đề xuất sửa: "Предоплата {deposit} получена, остаток {balance} — при заселении." Phần còn lại của tin giữ như C1. Mẫu chưa nối mã, nên làm cùng C1 hoặc C5, không gấp.
- Trạng thái: Fixed (mục 5.1: "Предоплата {deposit} получена, остаток {balance} — при заселении.") → **Closed** (CPY lượt 2, mục 9)

### FB-R5-CPY-UXD-V105-09
- Mức độ: Minor
- Vị trí: `gw.req.clean_long_fee` RU (đang chạy, `RequestsPage.tsx` 262).
- Vấn đề:
  - "Долгосрочная аренда не включает уборку." – "аренда" là chữ của thuê nhà, thuê căn hộ (cùng nhóm nghĩa với từ cấm "квартир").
  - Câu dự phòng cùng nhóm `gw.req.clean_fee_rule` lại dùng "Долгосрочное проживание", nên hai câu cạnh nhau lệch.
  - Landing dùng "долгое проживание".
- Vì sao quan trọng: khách ở dài là nhóm OTTIMO muốn giữ cảm giác "nơi này sinh ra cho mình", không phải người thuê nhà. Câu này hiện mỗi lần khách dài hạn xin dọn phòng.
- Đề xuất sửa:
  - RU: "При долгом проживании уборка не входит в стоимость. Каждая уборка стоит {amount}." Đúng BR-204, BR-506: thuê tháng dọn theo lượt, giá theo hạng.
  - Tùy chọn: EN "Your long-stay rent doesn't include cleaning." → "Cleaning isn't included in long stays. Each clean costs {amount}." VI có thể giữ.
  - Không thêm "аренд" vào danh sách chặn, vì hợp đồng dài hạn dùng đúng chữ này. Chỉ tránh trên chữ khách đọc.
- Trạng thái: Fixed (mục 5.1, khóa thứ 8 của V5-24: RU theo chữ CPY; UXD nhận cả bản EN tùy chọn; VI giữ) → **Closed** (CPY lượt 2, mục 9)

### FB-R5-CPY-UXD-V105-10
- Mức độ: Suggestion
- Vị trí: mục 4.6, `gw.lang_auto` khi làm mô tả cho trình đọc màn hình của ô chọn ngôn ngữ (`GuestShell.tsx` 53, 65–67).
- Vấn đề:
  - Khóa này có 2 chỗ dùng. Ở dòng chữ dưới lời chào, câu mới rất tốt.
  - Ở mô tả `aria-describedby` của chính ô chọn, người dùng trình đọc màn hình đang đứng ở ô đó lại nghe "có thể đổi ở đầu trang". Họ cũng mất ý trạng thái: khóa cặp `gw.lang_chosen` nói "Language you chose", còn khóa này không nói gì.
- Vì sao quan trọng: nhỏ, thuộc a11y. UXD giữ quyền a11y.
- Đề xuất sửa: thêm khóa chỉ cho trình đọc màn hình, `gw.lang_auto_sr`:
  - VI "Ngôn ngữ đã chọn sẵn cho bạn";
  - EN "Language selected for you";
  - RU "Язык выбран автоматически".
  - FE-B dùng khóa này ở dòng 66. Câu không nói nguồn chọn, nên vẫn đúng tinh thần BUG-R2-218.
  - Để PO và UXD chọn v1.0.5 hay sau.
- Trạng thái: Fixed (mục 4.6: khóa mới `gw.lang_auto_sr` cho `#gw-lang-state`, vào v1.0.5) → **Closed** (CPY lượt 2, mục 9)

### FB-R5-CPY-UXD-V105-11
- Mức độ: Suggestion
- Vị trí: mục 5.1 ghi chú cuối (kiểm tự động do UXD đề nghị cho FE-B).
- Vấn đề: mẫu kiểm `/апартамент|квартир|посуточн/iu` chỉ giữ được lỗi của V5-24. Các lỗi cùng loại ở thẻ 01, 02, 06, 07 không có gì chặn quay lại.
- Vì sao quan trọng: chữ khách đã sửa nhiều lượt. Không có test thì lượt sau dễ mang chữ cũ về.
- Đề xuất sửa: mở rộng kiểm trên các khóa hướng khách (`guest.*`, `gw.*`, `msg.*`, `sale.quote_text*`, `bill.line.*`):
  - RU: thêm `/депозит/iu`, sau khi áp thẻ 01;
  - VI: `/(?<!\p{L})căn(?!\p{L})/iu`, sau phần (a) và (b) của thẻ 02, giống `dist-checks.mjs` dòng 281. Thêm `/phụ thu/iu` sau C6;
  - mọi ngôn ngữ: không "!" và không emoji. RU chừa đúng mẫu lời chào `^Здравствуйте, \{name\}!`, cho tới khi người bản xứ trả lời mục 3 câu 2.
  - Bật dần theo từng thẻ đã áp, để CI không đỏ vì phần còn Deferred.
- Trạng thái: Fixed (phần UXD: mục 5.3 có 5 bước bật dần, mục 6 có dòng FE-B). Việc FE-B xếp sau 02 (a), (b) theo PO → **Closed** phần đặc tả (CPY lượt 2, mục 9). Phần mã theo dõi ở dòng FE-B mục 6 của bảng chữ

---

## 5. Ghi chú ngoài phạm vi (không mở thẻ)

- **Thứ tự số và tên phòng:**
  - BR-012 (1) ghi chữ khách thấy "The Pine · 401" (tên trước). Báo giá ở cả 3 ngôn ngữ đang ghép "{room} {room_name}" (số trước, không có dấu "·").
  - Không thuộc chữ, vì phải đổi cả cách ghép ở `quotes.service.ts`. Ghi để PO, ARC xem cùng story mẫu tin.
- **`msg.checkout_reminder`** viết cứng "(trước 12:00)": đồng ý với UXD R1 và quyết định PO số 14 (plan mục 6). Làm ở B-SAU với `{checkout_time}`, CPY duyệt lúc đó.
- **Khóa `gw.room`** không còn chỗ dùng (đã thay bằng `gw.room_label`). UXD cân nhắc xóa, sau khi kiểm prototype hi-fi.

---

## 6. Điểm làm tốt nên giữ

- Bảng mục 7 tách đúng chữ khách khỏi chữ Desk. Câu nào khách cầm, câu nào khách đọc đều có lý do và nguồn, nên review nhanh và không sót chỗ quan trọng.
- Nguyên tắc "chữ đúng với mọi giá trị tham số": `gw.lang_auto` không nói nguồn, phí trả sớm không ghi %, phụ thu thay đêm bỏ giờ. Đây đúng là cách viết chữ tiền không hứa điều Desk không làm.
- Mục 5.1 kiểm cả phạm vi pháp lý (0/7 chuỗi thuộc thông báo dữ liệu), chia cách tiếng Nga, và đề nghị test chặn từ cấm. Đây là cách làm nên giữ cho mọi lượt đa ngôn ngữ.

---

## 7. Tự kiểm của CPY

- [x] Đúng guideline: mọi câu đề xuất không emoji, không IN HOA, không "!". Riêng lời chào RU giữ "!", đã có lý do và đã đưa người bản xứ quyết.
- [x] 0 từ cấm trong câu đề xuất, ở cả 3 ngôn ngữ:
  - không "căn" ở chữ khách VI mới;
  - không "апартамент", "аренд", "депозит" ở RU mới;
  - không số phòng, không giá ở thân trang.
- [x] Số, giờ, lời hứa khớp BR:
  - 14:00 (FB-INV-004);
  - BR-428 (số ngày báo trước, không %);
  - BR-416 (bằng giá một đêm, FOC tách dòng);
  - BR-204, BR-506 (dọn theo lượt cho thuê tháng).
- [x] Không đụng câu pháp lý. "предоплата" đi theo bảng thuật ngữ đã duyệt, chờ luật sư (lp-v2 mục 8).
- [x] Số ít / số nhiều:
  - EN "day's" / "days'" đúng;
  - VI một dạng;
  - phiếu in không có RU;
  - RU mới không ghép số với danh từ đếm.
- [x] Đã liệt kê câu cho người bản xứ (mục 3, xếp theo rủi ro) và câu cho SEC, luật sư (không có câu mới).

---

## 8. Phản hồi của UXD (Round 5 – Phản hồi & sửa, 06/11/2026)

- Người trả lời: UXD. Tệp đã sửa: `rounds/round-05/outputs/UXD/copy-v1.0.5.md`, **bản 1.1**.
- Phạm vi theo PO: plan R5 mục 6, quyết định 15; `rounds/round-05/responses/PO-responses.md` (commit `8c828036`).
- Số khóa sau khi sửa: **150** (69 sửa, 72 mới, 9 xóa) ở bản 1.1; bản 1.0 có 143. Bản 1.2 (áp trả lời DOM, cùng ngày): **146** (71 sửa, 68 mới, 7 xóa), gồm khóa của thẻ 04.
  - V5-23: thêm 6 khóa, gồm `gw.req.clean_makeup_free`, `gw.req.clean_second_fee`, `gw.lang_auto_sr` và 3 khóa ở 4.21.
  - V5-24: thêm `gw.req.clean_long_fee`.
  - Một khóa dự phòng của thẻ 04 chưa đếm.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-CPY-UXD-V105-01 | Fixed | Mục 5.1: `sale.quote_text` RU dòng 4 "Предоплата, чтобы закрепить номер: {deposit}. …". Có khung chữ đầy đủ. BE chạy lại `gen-quote-copy.mjs`. Mục 8 kiểm `quote-copy.ts` không còn "Депозит". Bước 2 của 5.3 chặn từ này quay lại |
| FB-R5-CPY-UXD-V105-02 (a) | Fixed | Mục 4.20 (a): "căn" thành "phòng" ở `sale.quote_text` VI dòng 2, `gw.req.clean_makeup_free`, `gw.req.clean_second_fee`. Bắt buộc v1.0.5 |
| FB-R5-CPY-UXD-V105-02 (b) | Fixed | Mục 4.20 (b) và chữ đầy đủ ở 5.1: `msg.booking_confirmed`, `msg.deposit_received`, `msg.hot_water_issue` dùng "phòng {room}". Nên có, cùng lượt C5 |
| FB-R5-CPY-UXD-V105-02 (c) | Deferred | v1.0.6, backlog R5-B-03, gộp C6. Mục 4.20 (c) ghi danh sách khóa. `gw.room` xóa ở lượt đó |
| FB-R5-CPY-UXD-V105-03 | Fixed | Mục 4.1: U+00A0 đặt ngay sau `{noticeDays}` ở cả VI và EN. Ghi chú cho FE gõ thẳng ký tự, so test bằng `tv(key)` |
| FB-R5-CPY-UXD-V105-04 | Fixed (bản 1.2) | DOM xác nhận (`rules-v1.0.5.md` mục 10): quản lý, chủ đầu tư sửa thẳng đơn giá hoặc số lượng được, thường trên folio `settled` sau trả phòng. Mục 4.8: `bill.line.late_fee_after_limit` vào bảng chính, chữ CPY nguyên văn. BE-B (mục 6): `amount_vnd` bằng `limit_ref_vnd` thì ra `late_fee_as_night`, khác thì ra `late_fee_after_limit`. FOC riêng không đổi nhãn |
| FB-R5-CPY-UXD-V105-05 | Fixed | UXD nhận. VI "Phụ thu trả muộn (bằng giá 1 đêm)", cùng khuôn ngoặc với các dòng phiếu khác và bản EN |
| FB-R5-CPY-UXD-V105-06 | Fixed | Mục 5.1: 3 câu của CPY, nguyên văn. Đây là điều kiện của C5. Giữ lời chào RU "!" |
| FB-R5-CPY-UXD-V105-07 | Fixed | Mục 4.21: 3 khóa, chữ của CPY. Nên có, cùng lượt C5. `msg.checkout_reminder` vẫn ở B-SAU |
| FB-R5-CPY-UXD-V105-08 | Fixed | Mục 5.1, `msg.booking_confirmed` RU: "Предоплата {deposit} получена, остаток {balance} — при заселении." |
| FB-R5-CPY-UXD-V105-09 | Fixed | Mục 5.1: RU "При долгом проживании…". UXD nhận cả bản EN tùy chọn ("Cleaning isn't included in long stays…") để EN cũng bỏ "rent"; VI giữ. "аренд" không vào danh sách chặn |
| FB-R5-CPY-UXD-V105-10 | Fixed | UXD nhận vào v1.0.5 (a11y, việc nhỏ). Khóa `gw.lang_auto_sr` chỉ dùng ở `#gw-lang-state`. `gw.lang_auto` giữ cho dòng chữ hiện ở HomePage |
| FB-R5-CPY-UXD-V105-11 | Fixed (phần UXD) | Mục 5.3: 5 bước bật dần, kèm điều kiện bật từng bước. Mục 6 có dòng FE-B. Theo PO, FE-B làm sau 02 (a), (b) |

Ghi chú khác của CPY:
- Danh sách cho người bản xứ (mục 3): UXD không đổi gì, INV chuyển. Nếu người bản xứ đổi câu nào, UXD cập nhật bảng.
- Thứ tự số và tên phòng theo BR-012 (mục 5): PO và ARC xem cùng story mẫu tin. Bảng chữ không đổi cách ghép `{room} {room_name}`.
- Không có ESC mới.

---

## 9. Lượt 2 – CPY đọc lại bản 1.1 (Round 5 – Review, 06/11/2026)

- Đối tượng: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` **bản 1.1** (commit `9f5c74a2`) và phản hồi của UXD ở mục 8 tệp này. Phạm vi theo PO: plan R5 mục 6, quyết định 15.
- Cách kiểm: so từng câu trong bản 1.1 với chữ đề xuất của thẻ, theo từng ký tự. Riêng thẻ 03 kiểm bằng mã ký tự: cả 4 chỗ sau `{noticeDays}` (VI, EN của `_notice_one`, `_notice_other`) là `0xa0`. `strings-ru.json` hiện có đúng 1 chỗ "Депозит", là dòng thẻ 01 sửa.

### 9.1 Kết luận lượt 2

| Nhóm | Lượt 1 | Lượt 2 | Lý do |
|---|---|---|---|
| C1 | DUYỆT CÓ ĐIỀU KIỆN | **DUYỆT** | Thẻ 01 đã áp nguyên văn ở mục 5.1. Mục 8 của bảng chữ kiểm `quote-copy.ts` không còn "Депозит". Bước 2 của mục 5.3 chặn từ này quay lại |
| C2 | DUYỆT | DUYỆT | Thêm `gw.lang_auto_sr` (thẻ 10), đúng chữ CPY |
| C3 | DUYỆT | DUYỆT | Thẻ 03 đã áp |
| C4 | DUYỆT | DUYỆT | Thẻ 05 đã áp. Thẻ 04 vẫn chờ DOM, không chặn v1.0.5 |
| C5 | DUYỆT CÓ ĐIỀU KIỆN | **DUYỆT** | 3 câu thẻ 06 đã vào mục 5.1 nguyên văn. CPY duyệt chữ, không duyệt lịch: PO xếp mức "nên có, cùng lượt C5". Nếu chuyển US-125, chữ này đi theo, không cần CPY duyệt lại |
| C6 | Để sau | Để sau | v1.0.6, backlog R5-B-03, gộp 02 (c) |

Còn mở sau lượt 2: **0 Blocker, 0 Major, 1 Minor (thẻ 04, chờ DOM)**. Thẻ 02 (c) là Deferred, CPY đồng ý.

### 9.2 Từng thẻ

| ID | Trạng thái lượt 2 | Đã kiểm |
|---|---|---|
| V105-01 (Major) | **Closed** | Khung `sale.quote_text` RU ở 5.1 khớp thẻ cả 5 dòng. Dòng 2 vẫn "Номер {room} {room_name}…" (C1). Dòng 4 "Предоплата, чтобы закрепить номер: {deposit}. Остальное оплачивается при заселении." Mục 6 giao BE chạy lại `gen-quote-copy.mjs` |
| V105-02 (a) (Major) | **Closed** | Mục 4.20 (a) ghi mức bắt buộc. `sale.quote_text` VI dòng 2 là "Phòng {room} {room_name}…", các dòng khác giữ nguyên. `gw.req.clean_makeup_free` và `gw.req.clean_second_fee` đúng chữ thẻ. EN, RU giữ. Chữ Desk giữ "căn" |
| V105-02 (b) | **Closed** | `msg.booking_confirmed`, `msg.deposit_received`, `msg.hot_water_issue` VI ở 5.1 đều dùng "phòng {room}". Cả 8 mẫu VI không còn "căn" đứng riêng. "đặt phòng {code}: phòng {room}" có hai chữ "phòng" gần nhau, nhưng đọc vẫn rõ, nên giữ |
| V105-02 (c) | Deferred – **CPY đồng ý** | Danh sách khóa ở 4.20 (c) khớp thẻ. Bước 3 của 5.3 chừa đúng các khóa này tới v1.0.6 |
| V105-03 | **Closed** | 4 chỗ U+00A0 đúng vị trí. Có ghi chú cho FE gõ thẳng ký tự, không gõ ` `. Mục 8 có kiểm ở khung 362 px |
| V105-04 | Open – chờ DOM | Khóa dự phòng `bill.line.late_fee_after_limit` đúng nguyên văn CPY, chưa đếm, chỉ thêm khi DOM xác nhận. Cách xử lý hai nhánh ở 4.8 đúng ý thẻ |
| V105-05 | **Closed** | VI "Phụ thu trả muộn (bằng giá 1 đêm)". Desk `co.*` giữ |
| V105-06 | **Closed** | EN, VI, RU khớp nguyên văn. Lời chào RU giữ "!" |
| V105-07 | **Closed** | `msg.house_rules_smoking` 3 ngôn ngữ, `msg.bill` RU, `guest.late.done_title` EN, VI khớp nguyên văn (4.21) |
| V105-08 | **Closed** | "Предоплата {deposit} получена, остаток {balance} — при заселении." khớp |
| V105-09 | **Closed** | RU khớp. UXD nhận cả bản EN tùy chọn; VI giữ. "аренд" không vào danh sách chặn, đúng ý thẻ |
| V105-10 | **Closed** | `gw.lang_auto_sr` EN, VI, RU khớp. Chỉ dùng ở `#gw-lang-state`; `gw.lang_auto` giữ cho HomePage. Mục 8 có kiểm bằng trình đọc màn hình |
| V105-11 | **Closed** (phần đặc tả) | 5 bước ở 5.3 đúng thứ tự và đúng điều kiện bật. Bước 4 chừa đúng mẫu lời chào RU. Phần mã do FE-B làm sau 02 (a), (b) |

### 9.3 Ghi chú
- Phương án dự phòng ở cuối 5.1 chấp nhận được. Nếu lượt C5 không kịp v1.0.5, 3 mẫu tin chỉ thay "апартаменты" bằng "номер", và phần còn lại sang US-125. Mẫu tin chưa có mã nào gọi, nên khách không thấy chữ cũ. Riêng `sale.quote_text` và 3 chuỗi trang khách vẫn bắt buộc, đúng như bảng chữ ghi.
- Câu RU mới của thẻ 10 ("Язык выбран автоматически") chưa có trong danh sách mục 3. CPY đã gộp vào câu 9 của khối người bản xứ ở mục 10.
- Tệp này không có dữ liệu khách, không có số hoa hồng. ESC mới: **không**.

---

## 10. Khối gửi người bản xứ (RU) – INV chuyển khi tiện

Thứ tự: câu rủi ro nhất trước. Mỗi mục gồm câu tiếng Nga, nghĩa tiếng Việt và điều cần hỏi. `{…}` là chỗ hệ thống điền, không cần dịch.

1. **Предоплата, чтобы закрепить номер: {deposit}. Остальное оплачивается при заселении.** (báo giá)
   - Nghĩa: Tiền trả trước để giữ phòng: {deposit}. Phần còn lại thanh toán khi nhận phòng.
   - Hỏi: khách có hiểu đây là tiền trả trước, trừ vào tổng, không hoàn lại khi trả phòng không? Bản ngắn «Предоплата для брони: {deposit}.» có tốt hơn không?
2. **Здравствуйте, {name}!** (đầu mọi tin nhắn)
   - Nghĩa: Xin chào {name}.
   - Hỏi: với một nơi lưu trú điềm tĩnh, viết «Здравствуйте, {name}.» (dấu chấm) có bị lạnh hoặc cộc không? Hay giữ dấu «!»?
3. **OTTIMO подтверждает бронирование {code}: номер {room}, {from} → {to} ({nights_text}).** (tin xác nhận)
   - Nghĩa: OTTIMO xác nhận đặt phòng {code}: phòng {room}, từ {from} đến {to} ({số đêm}).
   - Hỏi: «номер» đứng ngay sau mã đặt phòng có bị đọc thành «số» không? Nếu có, đổi thành «ваш номер {room}».
4. **Номер {room} {room_name}, {from} → {to} ({nights_text}), {guests}.** (báo giá, ví dụ «Номер 401 The Pine, …»)
   - Nghĩa: Phòng 401 The Pine, từ … đến … (… đêm), … khách.
   - Hỏi: thứ tự số rồi tên phòng có tự nhiên không?
5. **Приносим извинения за неудобства.** (tin sự cố nước nóng). Cùng kiểu: **Спасибо.** ở cuối tin nhắc hút thuốc.
   - Nghĩa: Chúng tôi xin lỗi vì sự bất tiện. / Cảm ơn.
   - Hỏi: kết bằng dấu chấm thay «!» có đủ ấm và chân thành không?
6. **Предоплата {deposit} получена, остаток {balance} — при заселении.** (tin xác nhận)
   - Nghĩa: Đã nhận tiền trả trước {deposit}; phần còn lại {balance} trả khi nhận phòng.
   - Hỏi: đã rõ là tiền **đã nhận**, không phải tiền còn phải trả chưa?
7. **При долгом проживании уборка не входит в стоимость. Каждая уборка стоит {amount}.** (trang khách, đang chạy)
   - Nghĩa: Khi ở dài hạn, dọn phòng không gồm trong giá. Mỗi lần dọn có giá {amount}.
   - Hỏi: câu có tự nhiên không, có gợi cảm giác thuê căn hộ không?
8. **Спасибо, что остановились в OTTIMO, {name}.** (tin gửi hóa đơn)
   - Nghĩa: Cảm ơn {name} đã lưu trú tại OTTIMO.
   - Hỏi: câu có tự nhiên không? Có cần «у нас» thay cho «в OTTIMO» không?
9. **Язык можно сменить вверху страницы.** (dòng chữ trên trang khách) và **Язык выбран автоматически** (chỉ trình đọc màn hình đọc, ở ô chọn ngôn ngữ)
   - Nghĩa: Bạn có thể đổi ngôn ngữ ở đầu trang. / Ngôn ngữ đã được chọn sẵn cho bạn.
   - Hỏi: hai câu có tự nhiên không? «автоматически» có nghe máy móc quá không?
10. **Правила проживания и штрафы** (tiêu đề trên trang khách, đang chạy; bản EN là «House rules and fees»)
    - Nghĩa: Nội quy và tiền phạt.
    - Hỏi: «штрафы» có nặng hơn ý tiếng Anh không? Có từ nào trung tính hơn mà vẫn đúng không?
11. **OTTIMO получил предоплату…** (tin đã nhận cọc) so với **Мы получили сообщение…** (tin sự cố)
    - Nghĩa: OTTIMO đã nhận tiền trả trước… / Chúng tôi đã nhận được tin báo…
    - Hỏi: nên thống nhất một cách nói không? Nếu có, chọn cách nào?

Người bản xứ sửa câu nào thì INV gửi lại nguyên văn. UXD cập nhật bảng chữ, CPY đọc lại.

---

## 11. Phản hồi của UXD sau lượt 2 (bản 1.2, 06/11/2026)

- Người trả lời: UXD. Tệp đã sửa: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` **bản 1.2**, áp trả lời DOM (`rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 8 và 10).
- Số khóa bản 1.2: **146** (71 sửa, 68 mới, 7 xóa).

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-CPY-UXD-V105-04 | Fixed | DOM xác nhận ca sửa thẳng xảy ra được (mục 10). `bill.line.late_fee_after_limit` vào bảng chính ở 4.8, chữ CPY nguyên văn, đã đếm. BE-B: `amount_vnd` bằng `limit_ref_vnd` thì ra `late_fee_as_night`, khác thì ra `late_fee_after_limit`; FOC riêng không đổi nhãn. Mục 8 có ca kiểm của DOM. Nhờ CPY đóng thẻ |

Nhờ CPY đọc thêm (chữ mới, không phải thẻ của CPY):
- 3 câu `sale.hold_next`, `sale.hold_next_ctv`, `sale.hold_next_no_qr` (bảng chữ 4.14), sửa theo thẻ DOM FB-R5-DOM-UXD-01 (Major). Câu bỏ vế "Bạn sẽ được nhắc…", vì sale và CTV không có chỗ nào nhận tin nhắc. Thay vào đó là giờ hạn và việc người tạo phải làm. Đây là chữ Desk cho sale và CTV (VI, EN), không phải chữ cho khách. FE áp được ngay; CPY sửa chữ thì UXD chỉ đổi bảng.
- `stay.charge_penalty_note` (4.3): chữ Desk nội bộ, câu do DOM đề xuất ("Phí phạt và tiền bồi thường hư hỏng không tính vào doanh thu phòng."). CPY xem thêm nếu muốn.

---

## 12. Lượt 3 – CPY đọc lại bản 1.2 (Round 5 – Review, 06/11/2026)

- Đối tượng: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` **bản 1.2** (commit `49c9f76c`), mục 4.3, 4.8, 4.14, 6, 8. Trả lời của UXD ở mục 11 tệp này. Căn cứ: DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 8.1, 8.2 và 10.
- Đã kiểm thêm, chỉ đọc mã:
  - `services/api/src/modules/reservations/internal/allowed-actions.ts` dòng 63–79;
  - `apps/admin-web/src/session/nav.ts` dòng 85–92;
  - `product/docs/rbac-matrix.md` A03;
  - BR-303.

### 12.1 Kết luận lượt 3

| Mục | Kết luận | Ghi chú |
|---|---|---|
| Thẻ 04 / `bill.line.late_fee_after_limit` (4.8) | **Closed** | Xem 12.2 |
| 3 câu `sale.hold_next`, `sale.hold_next_ctv`, `sale.hold_next_no_qr` (4.14) | **DUYỆT CÓ ĐIỀU KIỆN** | Hướng của DOM và UXD đúng: bỏ lời hứa nhắc, nêu giờ hạn. Điều kiện: thẻ 12 (Major). Vế cuối đang chỉ sai người làm việc gia hạn |
| G6 `stay.charge_penalty_note` (4.3) | **DUYỆT** | Chữ Desk nội bộ. Câu đúng cho cả `penalty` và `damage`, đúng K-06/K-07 theo DOM. Bản EN tự nhiên. Không có thẻ |

Còn mở sau lượt 3: **0 Blocker, 1 Major (thẻ 12, mới), 0 Minor.** Thẻ 02 (c) vẫn Deferred, CPY đồng ý. ESC mới: **không**.

### 12.2 Thẻ 04 – đóng
- Nhãn dự phòng đúng nguyên văn CPY (VI, EN), đã vào bảng chính và đã đếm.
- Quy tắc chọn nhãn của BE-B: số tiền dòng bằng `limit_ref_vnd` thì ghi "bằng giá 1 đêm", khác thì ghi "rời sau mốc trả muộn". Quy tắc này an toàn về nghĩa tiền:
  - nhãn dự phòng không nói số tiền, nên **luôn đúng**;
  - mọi ca lệch, kể cả ca hiếm khi `limit_ref_vnd` khác số ghi lúc trả phòng, đều rơi về câu đúng. Cái mất chỉ là phần giải thích "(bằng giá 1 đêm)", không có câu sai.
- Ca FOC riêng giữ nhãn "bằng giá 1 đêm" là đúng: dòng gốc vẫn bằng giá một đêm, phần miễn nằm ở dòng FOC.
- Mục 8 có đủ hai ca kiểm của DOM.

### FB-R5-CPY-UXD-V105-12
- Mức độ: Major
- Vị trí: `copy-v1.0.5.md` bản 1.2, mục 4.14: `sale.hold_next`, `sale.hold_next_ctv`, `sale.hold_next_no_qr` (VI, EN), vế "khách cần thêm giờ thì báo lễ tân trước hạn" / "tell the front desk before then".
- Vấn đề:
  - Câu bảo sale, CTV nhờ lễ tân gia hạn. Nhưng chính sale, CTV gia hạn được giữ chỗ của mình:
    - BR-303 ghi "Sale được gia hạn giữ 1 lần… trước khi hết hạn";
    - `rbac-matrix.md` A03 ghi SAL và CTV "M" (khách của mình);
    - `allowed-actions.ts` dòng 74–76 cho `extend_hold` khi `sal || ctv`, đơn của mình, chưa gia hạn lần nào và chưa quá hạn;
    - sale, CTV mở được đơn ở mục "Đơn của tôi" (`nav.ts` dòng 85–92). Khung đơn có nút "Gia hạn giữ chỗ (1 lần)" (`drawer.action.extend_hold`).
  - Ghi chú "lễ tân gia hạn được 1 lần, Tờ 1 dòng Cọc" ở 4.14 lấy từ tờ dán quầy, là tờ viết cho lễ tân, không viết cho sale.
  - Hai chỗ nhỏ khác:
    - VI "hết hạn {time}" ra "hết hạn 15:30 07/11". Nên có "lúc".
    - EN "without a deposit it's cancelled" không nói rõ mốc là giờ hạn.
- Vì sao quan trọng:
  - Đây là câu dặn việc cho một hành động có giờ chót. Thẻ DOM-UXD-01 sửa câu này để giữ chỗ không tự hủy mà không ai biết.
  - Câu mới lại đẩy việc sang người khác. Lễ tân bận hoặc đọc tin muộn thì hạn vẫn trôi, trong khi người gửi có sẵn nút tự làm.
  - Với CTV (người ngoài), mỗi lần nhờ thêm một người là thêm một chỗ có thể đứt.
- Đề xuất sửa: giữ cấu trúc 3 vế của UXD, đổi vế cuối sang việc tự làm, thêm "lúc". Câu vẫn đúng với mọi giá trị `hold_expiry_reminder_hours`, vì không hứa nhắc.
  - `sale.hold_next`
    - VI: "Gửi mã QR cho khách. Giữ chỗ hết hạn lúc {time}, chưa cọc thì tự hủy. Bạn tự theo dõi giờ này; khách cần thêm giờ thì bấm Gia hạn giữ chỗ (1 lần) trên đơn trước hạn."
    - EN: "Send the QR code to the guest. The hold expires at {time} and is cancelled if there's no deposit by then. Keep track of the time; if the guest needs longer, use Extend hold (once) on the booking before it expires."
  - `sale.hold_next_ctv`
    - VI: "Nhắn lễ tân hoặc sale nội bộ gửi mã VietQR cọc cho khách. Giữ chỗ hết hạn lúc {time}, chưa cọc thì tự hủy. Bạn tự theo dõi giờ này; khách cần thêm giờ thì bấm Gia hạn giữ chỗ (1 lần) trên đơn trước hạn."
    - EN: "Ask the front desk or sales staff to send the guest the deposit VietQR. The hold expires at {time} and is cancelled if there's no deposit by then. Keep track of the time; if the guest needs longer, use Extend hold (once) on the booking before it expires."
  - `sale.hold_next_no_qr`
    - VI: "Thu cọc của khách theo hướng dẫn bên dưới. Giữ chỗ hết hạn lúc {time}, chưa cọc thì tự hủy. Bạn tự theo dõi giờ này; khách cần thêm giờ thì bấm Gia hạn giữ chỗ (1 lần) trên đơn trước hạn."
    - EN: "Collect the deposit as shown below. The hold expires at {time} and is cancelled if there's no deposit by then. Keep track of the time; if the guest needs longer, use Extend hold (once) on the booking before it expires."
  - Tên nút trong câu khớp nguyên văn `drawer.action.extend_hold` ("Gia hạn giữ chỗ (1 lần)" / "Extend hold (once)"). Đổi tên nút thì đổi cả 3 câu.
  - "Bạn tự theo dõi" thay "Tự theo dõi": vẫn nói rõ không ai nhắc, nhưng bớt cộc với CTV. Khuôn "Bạn …" đã có ở chữ sale như `field.HOLD_LIMIT_REACHED`.
  - "chưa cọc" giữ cùng chữ `sale.hold_until`. Đúng ca cọc một phần không tự hủy (BR-303).
  - Nếu PO hoặc DOM muốn sale, CTV **không** tự gia hạn mà luôn qua lễ tân, thì quyền A03 và `allowed-actions.ts` đang ngược lại. Khi đó việc cần sửa nằm ở quyền, không ở chữ. Khi chưa có quyết định đó, chữ theo quyền đang chạy.
  - FE áp được ngay phần `{time}` từ `held.holdExpiresAt` như bảng chữ. Chỉ đổi chữ, không đổi khóa hay biến.
  - QA kiểm, đăng nhập vai sale và vai CTV: tạo giữ chỗ, đọc hộp xanh, mở đơn ở "Đơn của tôi" → nút "Gia hạn giữ chỗ (1 lần)" hiện trước hạn.
- Trạng thái: Open

### 12.3 Ghi chú
- G6: bản EN "Fines and damage charges don't count as room revenue." đúng nghĩa. Chỉ dùng trên Desk, nên không cần lọc từ như chữ khách. Không đổi.
- Không có chữ khách mới trong bản 1.2, ngoài `bill.line.late_fee_after_limit`, và câu này đã duyệt. Danh sách người bản xứ (mục 10) không đổi.
- Tệp này không có dữ liệu khách, không có số hoa hồng.
