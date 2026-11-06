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
| C1 | 7 chuỗi RU "апартаменты" → "номер" | **DUYỆT CÓ ĐIỀU KIỆN** | 7 câu thay đúng, giữ nguyên chữ UXD. Điều kiện: cùng lượt sửa `sale.quote_text` RU, đổi dòng 4 "Депозит для бронирования" thành "Предоплата…" (thẻ 01, Major) |
| C2 | `gw.lang_auto` EN, VI, RU | **DUYỆT** | Giữ chữ UXD. Thẻ 10 (Suggestion) cho bản đọc màn hình |
| C3 | `bill.line.early_departure_fee_same_day`, `_notice_one`, `_notice_other` | **DUYỆT** | Đúng BR-428. Thẻ 03 (Minor): khoảng trắng không ngắt sau `{noticeDays}`, nên làm cùng lượt |
| C4 | `bill.line.late_fee_as_night` | **DUYỆT** | Đúng BR-416 với dòng hệ thống ghi. Thẻ 04 (Minor): DOM, BE-B xác nhận ca quản lý sửa giảm thẳng dòng này. Thẻ 05 (Suggestion): ngoặc ở bản VI |
| C5 | Dấu "!" ở `msg.hot_water_issue` | **DUYỆT CÓ ĐIỀU KIỆN** | Đồng ý hướng UXD: dấu chấm. Điều kiện: áp đúng 3 câu ở thẻ 06. Giữ "Здравствуйте, {name}!" (cách chào chuẩn tiếng Nga), đưa vào danh sách người bản xứ |
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
- Trạng thái: Fixed (UXD, bản 1.1 của `copy-v1.0.5.md` mục 5.1: dòng 4 RU "Предоплата, чтобы закрепить номер: …", chép toàn bộ `sale.quote_text` RU theo khung của thẻ)

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
- Trạng thái: (a) Fixed – mục 4.20 (a), bắt buộc v1.0.5 · (b) Fixed – mục 4.20 (b) và 5.1, nên có, cùng lượt C5 (PO quyết định 15) · (c) Deferred – v1.0.6, backlog R5-B-03, gộp C6

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
- Trạng thái: Fixed (mục 4.1: U+00A0 sau `{noticeDays}` ở VI và EN của `_notice_one`, `_notice_other`)

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
- Trạng thái: Open – chờ DOM (ORC đã hỏi). UXD đã soạn sẵn khóa dự phòng `bill.line.late_fee_after_limit` theo chữ CPY ở mục 4.8, chưa đếm. DOM trả lời "chỉ giảm bằng FOC" thì đóng thẻ

### FB-R5-CPY-UXD-V105-05
- Mức độ: Suggestion
- Vị trí: mục 4.8, `bill.line.late_fee_as_night` VI.
- Vấn đề: các dòng phiếu cùng họ đặt phần giải thích trong ngoặc: "Phụ thu trả muộn ({time})", "Phí trả phòng sớm (báo trước…)". Bản EN mới cũng dùng ngoặc. Riêng bản VI viết liền "…trả muộn bằng giá 1 đêm".
- Vì sao quan trọng: nhất quán trên cùng một phiếu; người đọc tách tên khoản và cách tính dễ hơn.
- Đề xuất sửa: VI "Phụ thu trả muộn (bằng giá 1 đêm)". Chữ trên Desk (`co.*`) có thể giữ như cũ.
- Trạng thái: Fixed (mục 4.8: VI "Phụ thu trả muộn (bằng giá 1 đêm)")

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
- Trạng thái: Fixed (mục 5.1: 3 câu EN, VI, RU theo chữ CPY; VI dùng "phòng {room}" vì 02 (b) đã nhận). Nên có, cùng lượt C5

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
- Trạng thái: Fixed (mục 4.21: `msg.house_rules_smoking` 3 ngôn ngữ, `msg.bill` RU, `guest.late.done_title` EN/VI). Nên có, cùng lượt C5; không kịp thì US-125

### FB-R5-CPY-UXD-V105-08
- Mức độ: Minor
- Vị trí: `msg.booking_confirmed` RU, câu "Предоплата {deposit}, остаток {balance} при заселении."
- Vấn đề:
  - EN viết "Deposit paid {deposit}", VI viết "Đã cọc {deposit}". RU chỉ ghi "Предоплата {deposit}", không nói đã nhận.
  - Khách RU có thể đọc là khoản trả trước **còn phải trả**, cộng với "остаток".
- Vì sao quan trọng: câu tiền trong tin xác nhận. Đọc nhầm thì khách chuyển khoản lần hai, hoặc nhắn hỏi lại.
- Đề xuất sửa: "Предоплата {deposit} получена, остаток {balance} — при заселении." Phần còn lại của tin giữ như C1. Mẫu chưa nối mã, nên làm cùng C1 hoặc C5, không gấp.
- Trạng thái: Fixed (mục 5.1: "Предоплата {deposit} получена, остаток {balance} — при заселении.")

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
- Trạng thái: Fixed (mục 5.1, khóa thứ 8 của V5-24: RU theo chữ CPY; UXD nhận cả bản EN tùy chọn; VI giữ)

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
- Trạng thái: Fixed (mục 4.6: khóa mới `gw.lang_auto_sr` cho `#gw-lang-state`, vào v1.0.5)

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
- Trạng thái: Fixed (phần UXD: mục 5.3 có 5 bước bật dần, mục 6 có dòng FE-B). Việc FE-B xếp sau 02 (a), (b) theo PO

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
- Số khóa sau khi sửa: **150** (69 sửa, 72 mới, 9 xóa); bản 1.0 có 143.
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
| FB-R5-CPY-UXD-V105-04 | Open – chờ DOM | Mục 4.8: chờ DOM xác nhận ca sửa giảm thẳng (BR-438 (3)). Khóa dự phòng `bill.line.late_fee_after_limit` đã soạn theo chữ CPY, chỉ thêm khi DOM xác nhận. Không chặn v1.0.5 nếu V5-16 không lên cùng bản |
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
