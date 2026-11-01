# SEC review – PR #24: một bộ dò số giấy tờ/thẻ cho form và tin Chat (BE-D, v1.0.1 đợt 2)

- Người review: SEC | Round 4 – Review | 01/11/2026
- Đọc tại nhánh `be-d/v1.0.1-text-safety`, head `b89dbde4`. Chỉ xét commit riêng của PR (`98ff43bb..b89dbde4`, 13 tệp). Các tệp còn lại trong diff là của PR #16 (chưa gộp, SEC đã duyệt ở round 3).
- Đã đọc toàn bộ: `sensitive-number.ts`, `shared/log-line.ts`, `text-safety-units.test.ts`; diff của `website-request-rules.ts`, `public-booking.service.ts`, `website-requests.service.ts`, `chat-message.ts`, `worker-chat.ts`; báo cáo `rounds/round-04/outputs/BE/text-safety.md`. Đối chiếu: `reviews/SEC-on-BE-gchat-notify.md` lượt 3 (GCHAT-07, ★5), `outputs/SEC/lp-v2-privacy-and-api.md` mục 10.
- Cách kiểm: tạo worktree tạm ở scratchpad (đã gỡ), chép `sensitive-number.ts` và phần `chatSafeText` ra tệp thử, chạy bằng Node 22. Chạy song song luật form cũ (`98ff43bb`) để so. Hàm `normalizeFreeText` của form được chạy trước, như trên server. SEC không chạy lại bộ test của BE.
- Chỉ dùng số giả: CCCD `079203012345`, CMND `123456789`, thẻ thử `4111…`, hộ chiếu `C1234567`, số Hàn/Trung/Nga tự đặt. Tệp này không chứa dữ liệu thật.
- CI của PR lúc viết: gitleaks, shellcheck, OpenAPI, API contract, landing **xanh**. Job `format · lint · audit · test · build` **đang chờ**.

## Tóm tắt

| Mức | Số thẻ |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 2 |
| Suggestion | 2 |

**Kết luận: Duyệt (phía SEC).** Gộp sau PR #16 và khi job `format · lint · audit · test · build` xanh. Hai thẻ Minor không chặn gộp và không là điều kiện đặt mức C. Thẻ 01 là điều kiện trước khi mở LP-v2 tiếng Nga/Hàn.

## 1. Kết quả đọc mã

| Điểm | Kết quả | Ghi chú |
|---|---|---|
| Một luật cho form, lời nhắn từ chối, Chat | **Đạt** | `looksLikeCard`/`looksLikeIdNumber`/`looksLikeSensitiveNumber` đều gọi cùng `runsOf(digitsCopy(...))`. `chat-message.ts` xuất lại đúng hàm của form, có test `toBe`. Form kiểm trên chữ sẽ lưu (sau `normalizeFreeText`), nên chữ được kiểm và chữ được lưu trùng nhau. |
| Thứ tự chuẩn hóa | **Đúng** | `%XX` → NFKD → bỏ `\p{M}` và Default_Ignorable → bỏ Cc (giữ khoảng trắng) → NFKC → `\p{Nd}` về ASCII → U+2800 → gạch/chấm giữa/nháy → `(+84)` → che ngày giờ. Bỏ dấu trước NFKC là đúng, vì chữ số có dấu kết hợp chỉ đọc được sau khi bỏ dấu. Bản kiểm không in, không lưu, không ghi log. |
| Luật nối nhóm | **Đạt** | Đúng bước 2–3 của GCHAT-07. `, ` và `. ` cắt dãy, nên danh sách SĐT không bị cộng. Cửa sổ cộng nhóm dừng ở 18–19 chữ số, nên chi phí là tuyến tính. |
| Ngoại lệ `+`/`84` | **Đạt, có lưu ý** | Chỉ bỏ qua ≥ 11 chữ số đầu, nên CCCD đứng sau SĐT `+84` vẫn bị bắt. Lưu ý ở thẻ 02: ngoại lệ được xét trên bản đã giải mã `%XX`. |
| Ngoại lệ tiền | **Đạt, có lưu ý** | `đ`/`tr`/`k` phải đứng riêng, nên sửa được lỗi cũ `079203012345 đến…`. Mỗi vế của khoảng tiền xét riêng. Lưu ý ở thẻ 02: `đồng ý`, `dong` và G3 `- 500k`. |
| Hộ chiếu | **Đạt** | Chữ thường, một dấu cách sau chữ hoa hoặc sau từ khóa, từ khóa 7 ngôn ngữ. Bản `lettersCopy` giữ dấu tiếng Việt, nên `ở 1234567` không bị bắt nhầm. |
| Hàn / Trung / Nga | **Đạt theo mẫu mục 10** | Hàn `YYMMDD-SNNNNNN` (1 nhóm hoặc 6+7). Trung 18 ký tự có ngày sinh, cả `X`/`x`. Nga `NN NN NNNNNN` / `NNNN NNNNNN`. Còn khe cách viết có `№` và hộ chiếu Hàn mẫu mới (thẻ 01). |
| `log-line.ts` | **Đạt** | `Object.assign({level,msg}, extra, {level,msg})`: `level`/`msg` luôn đứng đầu và không bị đè. SEC thử `{level:'A', msg:'x'}` và `__proto__` từ `JSON.parse`: không đè được. Chỉ có khóa `toJSON` là thay được cả dòng (thẻ 04). Hiện các chỗ gọi đều dùng khóa cố định, không có dữ liệu khách. Test có ở `gchat-units.test.ts:778` và `gchat-worker-only.test.ts`. |
| Hiệu năng | **Đạt** | 15 chuỗi cố làm chậm, mỗi chuỗi ≤ 500 ký tự: nhiều dấu cách liền, dấu cách xen gạch, `ﷺ` (NFKD nở ×18), 250 nhóm tách bằng dấu cách, `%XX`, `X`, từ khóa lặp. Chạy cả bộ dò lẫn `chatSafeText`: chậm nhất **2,5 ms** mỗi lần gọi. Không có biểu thức nào quay lui theo cấp số mũ. |

## 2. Chạy lại 50 chuỗi biên của lượt 3

Chạy 63 chuỗi: 50 chuỗi của lượt 3 (`run.ts`, `qa.ts`) và 13 chuỗi "không được che" trong phác thảo GCHAT-07. Mỗi chuỗi chạy 4 cách: form (lời nhắn), form (tên, gộp dấu cách), Chat lời nhắn, Chat tên.

| Nhóm | Số chuỗi | Kết quả |
|---|---|---|
| Phải bị bắt (gồm toàn bộ bảng "Đường lách còn lại" của lượt 3) | 44 | **44/44 bị bắt**, ở cả form lẫn Chat. Mã lỗi đúng loại: thẻ thì `card`, giấy tờ thì `id`. |
| Không được che (SĐT, ngày, giờ, tiền có đơn vị, số người, mã đặt, iPhone 256GB) | 11 | **10/11 hiện**. Riêng `Phòng 101 102 103` bị che, nhưng luật cũ cũng che chuỗi này (9 chữ số nối một dấu cách). Không phải lỗi mới. |
| Che thừa đã chấp nhận ở lượt 3 | 8 | `201,202,203`, `150,000,000`, `150.000.000`, Agoda 9 số: vẫn che. Hai SĐT nối `/` hoặc `,` và `84 905 111 222`: **nay hiện**, tốt hơn lượt 3. |
| Rủi ro thấp đã chấp nhận (`07-92-03-01-23-45`, `07.92.03…`) | 2 | Vẫn lọt, vì bị đọc là ngày. Giữ nhận định lượt 3. |

**GCHAT-07 bước 1–4: đóng phía SEC.**

## 3. Chuỗi cố lách mới (61 chuỗi) – so với luật form cũ

**Nay bị bắt, trước đây lọt (16 ca):**
- `45 06 123456` (Nga); `900101-1234567` (Hàn); `CCCD … 2tr cọc`; `CCCD … 2030`;
- khoảng trắng U+2029, U+1680, U+180E, U+FFA0;
- `／` `∙` `⁃` `〜` giữa các nhóm;
- thẻ có dấu cách toàn độ rộng, Amex `3782  822463  10005`, các nhóm thẻ 3–4 chữ số cách bằng hai dấu cách.

**Lọt ở cả luật cũ lẫn mới, kiểu khách gõ tự nhiên:**
- `серия 45 06 № 123456`, `паспорт 45 06 № 123456`, `4506 № 123456`, `серия 4506 номер 123456`;
- hộ chiếu Hàn mẫu mới `M123A4567` (có hoặc không có từ khóa `여권`);
- `CCCD 079203012345 đồng ý …`.

→ thẻ 01 và 02.

**Lọt ở luật mới, luật cũ bắt được (3 ca):**

| Chuỗi | Vì sao lọt | Mức |
|---|---|---|
| `CCCD 079203012345 - 500k` | G3 của BE: một vế khoảng tiền | Thấp, BE đã nêu |
| `số 079203012345 dong` | `dong` nay là đơn vị tiền | Thấp |
| `%2B079203012345` | `%2B` giải mã thành `+`, nên ngoại lệ SĐT bỏ qua cả số. Chat vẫn in `%2B079203012345`, đọc được 12 chữ số. | Thấp (cố ý), nhưng do chính bước chuẩn hóa sinh ra |

→ thẻ 02.

**Lọt ở cả hai luật, phải cố ý che, SEC giữ mức rủi ro thấp như lượt 3:**
- nhóm số cách bằng `:` `|` `+` `~` `*` `#` `⁄` `∕`, hoặc `, ` / `. ` / ` . `;
- chữ `O` thay số `0`;
- chữ số dingbat `➆`, chữ số Hán `〇七九`;
- `%2520` (mã hóa hai lần);
- dấu kết hợp trên chữ số hộ chiếu (`lettersCopy` không bỏ `\p{M}`);
- nhóm 2 chữ số bị đọc là ngày (`079.20.30.12.345`);
- `+079203012345` và `84 079203012345`.

Lý do giữ mức thấp như lượt 3: người có giấy tờ không có lý do che số của chính mình. Người ngoài chèn số của người khác thì không lộ thêm gì so với thứ họ đã có.

## 4. Đánh giá G2 – form nay từ chối thêm một số chuỗi vô hại

So với luật form cũ, 27 chuỗi thử cho thấy form **mới** trả 422 thêm cho:
- `201,202,203` và `150,000,000` (BE đã nêu);
- `86 138 0013 8000`: SĐT Trung Quốc có mã nước nhưng thiếu `+`;
- `8 912 345 67 89`: SĐT Nga có số 8 đầu, viết toàn dấu cách.

Các chuỗi sau bị từ chối **từ trước**, không đổi:
- `Phòng 101 102 103`, `150.000.000`, `4.500.000 x 30 đêm = 135.000.000`;
- Agoda 9 số, `82 10 1234 5678`;
- hai SĐT cách một dấu cách, ĐT bàn + di động liền nhau.

Đánh giá rủi ro bảo mật: **chấp nhận.**
- Đây là hỏng theo hướng an toàn. 422 xảy ra **trước** khi ghi DB, không lưu dòng nào (test tích hợp của BE).
- Phản hồi chỉ có `field` + `code`, không nhắc lại chữ của khách, nên không thành công cụ dò hay kênh lộ dữ liệu.
- Không ảnh hưởng tin Chat, vì Chat vốn đã che các chuỗi này từ lượt 3.
- Cái giá là trải nghiệm: khách ghi danh sách phòng hoặc số tiền không có đơn vị sẽ thấy câu "No need to send ID numbers at this step. Please remove it." Câu này dễ gây khó hiểu, khách có thể bỏ form. Tần suất thấp. Đây là việc của PO/UXD/CPY, không phải rủi ro bảo mật → thẻ 03.

Không cần ESC: đây là yêu cầu kỹ thuật thuộc quyền SEC, không đổi chính sách kinh doanh.

## 5. Thẻ

### FB-R4-SEC-BE-PR24-01
- Mức độ: Minor (không chặn gộp, không là điều kiện đặt C). **Là điều kiện trước khi mở LP-v2 tiếng Nga và tiếng Hàn** (mục 10 là Must cho LP-v2).
- Vị trí: `sensitive-number.ts` – `runsOf`/`JOIN` (số Nga), `PASSPORT_RULES` (hộ chiếu Hàn).
- Vấn đề: hai cách viết tự nhiên còn lọt cả form lẫn Chat.
  - (a) Hộ chiếu nội địa Nga có ký hiệu số: `серия 45 06 № 123456`, `паспорт 45 06 № 123456`, `4506 № 123456`, `серия 4506 номер 123456`. NFKC đổi `№` thành `No`. Khoảng ` No ` không phải dấu nối, nên dãy bị cắt thành `45 06` và `123456`.
  - (b) Hộ chiếu Hàn mẫu mới, cấp từ cuối 2021: 1 chữ + 3 số + 1 chữ + 4 số (`M123A4567`). Luật hiện tại chỉ nhận chữ rồi đến 7–8 chữ số liền nhau.
- Vì sao quan trọng: khi LP-v2 mở tiếng Nga và tiếng Hàn, đây là cách khách Nga/Hàn quen viết. Ở mức C, số giấy tờ sẽ có một bản sao ở Google Chat tới 180 ngày.
- Đề xuất sửa, chỉ trên bản dùng để kiểm:
  - (a) Trong `digitsCopy`, đổi `(?<=\d)\s*(?:№|No\.?|N[º°]|номер)\s*(?=\d)` thành một dấu cách. Thêm từ khóa `серия` vào luật từ khóa Nga.
  - (b) Thêm luật `(?<![\p{L}\p{N}])[A-Z]\d{3}[A-Z]\d{4}(?![\p{L}\p{N}])`, và bản không phân biệt hoa/thường sau từ khóa (`passport|여권|hộ chiếu`).
  - Test: 6 ca trên phải bị bắt. Chạy lại 57 chuỗi "không che nhầm".
- Trạng thái: Open

### FB-R4-SEC-BE-PR24-02
- Mức độ: Minor (không chặn gộp; nên sửa trong PR nếu kịp, không thì v1.0.2).
- Vị trí: `sensitive-number.ts` – `decodePercent` trong `digitsCopy`, `idIn` (`PLUS_BEFORE`, `MONEY_BEFORE`, `MONEY_AFTER`).
- Vấn đề: các ngoại lệ nới luật được xét trên **bản đã chuẩn hóa**, nên bước chuẩn hóa có thể tự tạo ra ngữ cảnh ngoại lệ.
  - `%2B079203012345` thành `+079203012345` nên lọt. Luật cũ bắt được ca này. Chat in nguyên `%2B079203012345`, người đọc vẫn thấy 12 chữ số.
  - Danh sách đơn vị tiền nay rộng hơn, nên số giấy tờ đứng ngay trước một từ trông như đơn vị cũng lọt: `CCCD 079203012345 đồng ý …` (câu khách có thể gõ), `… dong`, `… - 500k` (G3).
- Vì sao quan trọng: mỗi ca đều hiếm, nhưng đi ngược nguyên tắc "chuẩn hóa chỉ được làm luật chặt hơn". Lượt 3 dùng cách OR giữa bản gốc và bản chuẩn hóa, nên không có lỗi loại này.
- Đề xuất sửa (chọn một hoặc cả hai):
  - (1) Ngoại lệ `+`/`$` chỉ nhận khi dấu đó có ở bản **chưa giải mã `%XX`**. Hoặc chạy `idIn` thêm trên bản không giải mã rồi OR hai kết quả.
  - (2) Ngoại lệ tiền chỉ áp dụng khi chuỗi số trông như số tiền: tận cùng `000`, hoặc tổng ≤ 8 chữ số. Mọi ca tiền trong bộ "không che nhầm" đều tận cùng `000`. Cách này đóng luôn G3, `đồng ý` và `dong`.
  - Test: 4 ca trên phải bị bắt. Các ca tiền và SĐT hiện có phải vẫn hiện.
- Trạng thái: Open

### FB-R4-SEC-BE-PR24-03
- Mức độ: Suggestion (chuyển PO/UXD/CPY, QA ghi nhận).
- Vị trí: `apps/landing-web/src/scripts/booking-strings.ts` `idNumber` (EN/VI); danh sách che thừa trong `text-safety-units.test.ts`.
- Vấn đề: G2 chấp nhận được về bảo mật, nhưng câu báo lỗi chỉ nói "không cần gửi số giấy tờ". Khách ghi `201,202,203` hoặc `150,000,000` sẽ không hiểu phải sửa gì. Ngoài ra còn 2 ca che thừa mới chưa nằm trong danh sách đã chấp nhận: `86 138 0013 8000` và `8 912 345 67 89`.
- Đề xuất sửa:
  - CPY/UXD thêm nửa câu gợi ý, giữ giọng thương hiệu (EN dẫn, VI hỗ trợ). Ví dụ VI: "Nếu là số phòng hoặc số tiền, vui lòng ghi kèm chữ hoặc đơn vị (ví dụ 150.000.000 đ)."
  - BE ghi 2 ca SĐT trên vào danh sách che thừa trong test, hoặc mở ngoại lệ SĐT cho `86` + 11 số và `8` + 10 số dạng Nga.
- Trạng thái: Open

### FB-R4-SEC-BE-PR24-04
- Mức độ: Suggestion.
- Vị trí: `services/api/src/shared/log-line.ts`.
- Vấn đề: `Object.assign` chép cả khóa `toJSON` của `extra`. `JSON.stringify` khi đó gọi `toJSON` và thay **cả dòng log**: `logLine('info','m',{toJSON:()=>({level:'evil'})})` cho ra `{"level":"evil"}`. Hiện không chỗ gọi nào truyền khóa này, và `extra` không chứa dữ liệu khách, nên không khai thác được.
- Đề xuất sửa: bỏ khóa `toJSON` trước khi ghép (`const { toJSON: _drop, ...rest } = extra`), thêm một ca vào test `gchat-units.test.ts:778`.
- Trạng thái: Open

## 6. Cập nhật điều kiện ★5 trước khi production đặt mức C

| # | Điều kiện | Ai | Trạng thái |
|---|---|---|---|
| ★5 | Mã chống chèn: **Đạt** (lượt 2). Lọc số sau làm sạch (BUG-R3-057): **Đạt** (`98ff43bb`). **GCHAT-07 bước 1–4: Đạt trong mã** (`b89dbde4`, 44/44 chuỗi bị bắt ở form và Chat). Mục 10 (số Hàn/Trung/Nga đúng các mẫu đã nêu, `＜＞`, `：／／`, `。．｡`, tên miền Kirin, `xn--`): **Đạt**. Còn lại: (a) PR #16 rồi PR #24 được gộp, job `format · lint · audit · test · build` của PR #24 xanh; (b) v1.0.1 chứa `98ff43bb` và `b89dbde4` lên production; (c) lượt INT trên phòng thử như lượt 2, cộng TC-GC-14 và các ca thẻ 06. | BE-D, ORC/OPS, INT | **Chưa đủ.** Phần mã đã xong; còn gộp, triển khai và lượt INT. |
| LP-v2 ko/ru | Thẻ PR24-01 (`№`, hộ chiếu Hàn mẫu mới) | BE-D | Chưa. Không chặn C. Chặn mở tiếng Nga/Hàn. |

Production **chưa** được đặt C cho tới khi đủ các điều kiện ★1–★8 trong bảng lượt 2/3 của `rounds/round-03/reviews/SEC-on-BE-gchat-notify.md`. Dòng ★5 trong bảng đó được thay bằng dòng trên.

## 7. Điểm làm tốt
- Một hàm, một bản kiểm, test khóa bằng `toBe`. Từ nay form và Chat không thể lệch luật nhau, đúng gốc của BUG-R3-058.
- Bản kiểm tách khỏi chữ lưu (G1): không đổi dữ liệu, không cần migration. Comment đầu tệp ghi rõ thứ tự chuẩn hóa và các ca che thừa đã chấp nhận.
- Số giấy tờ nước ngoài được sinh trong test, kể cả chữ số kiểm tra của căn cước Trung Quốc. Repo không chứa số trông như thật.

## Dòng decision-log đề xuất

| 2026-11-01 | 4 | **SEC – PR #24 (BE-D, một bộ dò V-09 cho form và Chat): duyệt phía SEC** (`rounds/round-04/reviews/SEC-on-PR24-text-safety.md`, head `b89dbde4`). Gộp sau PR #16, khi CI xanh. GCHAT-07 bước 1–4 và lp-v2 mục 10 đạt trong mã: 63 chuỗi lượt 3 (44/44 bị bắt) và 61 chuỗi cố lách mới, hiệu năng ≤ 2,5 ms. Chấp nhận G2 (form từ chối thêm `201,202,203`, `150,000,000`, SĐT CN/RU thiếu `+`): hỏng theo hướng an toàn, không lưu, không nhắc lại chữ. Thẻ Minor PR24-01 (`№` Nga, hộ chiếu Hàn mẫu mới) là điều kiện trước khi mở LP-v2 ru/ko. Thẻ Minor PR24-02 (ngoại lệ `+`/tiền xét trên bản đã giải mã `%XX`; `đồng ý`, G3) nên sửa trong v1.0.1/v1.0.2. ★5: phần mã đủ; production vẫn chưa đặt C cho tới khi gộp, triển khai và có lượt INT phòng thử. | SEC | Quyền SEC (yêu cầu bảo mật kỹ thuật) |
