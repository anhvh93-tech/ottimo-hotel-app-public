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

---

## Lượt 2 – f8080499

- Người review: SEC | Round 4 – Review lượt 2 | 01/11/2026
- Đọc: `git diff b89dbde4..f8080499` của `sensitive-number.ts` và `log-line.ts`; báo cáo BE mục 7 (trên nhánh). Các phần đã đọc: OR giữa bản giải mã và bản giữ nguyên `%XX`, điều kiện `000`, `amountSpans`, `phonePrefixDigits`, `NUMBER_SIGN`, `MONEY_BEFORE`/`MONEY_AFTER` mới, luật hộ chiếu Hàn.
- Cách kiểm: như lượt 1. Bộ chạy thử ở scratchpad `sec24`, chỉ thay tệp `sensitive-number.ts` và `log-line.ts` bằng bản `f8080499`. Chạy 63 chuỗi lượt 3, 61 chuỗi cố lách, 27 chuỗi che thừa, 15 chuỗi hiệu năng, cộng 35 chuỗi mới nhắm vào các ngoại lệ vừa thêm. Chỉ dùng số giả.
- CI của `f8080499` lúc viết: các job đang chạy, chưa có kết quả.

### Kết quả chạy lại

| Bộ | Kết quả trên `f8080499` |
|---|---|
| 63 chuỗi lượt 3 | 44/44 chuỗi phải bắt vẫn bị bắt ở form và Chat. `150,000,000` và `150.000.000` nay **hiện** (BUG-R4-016), đúng ý. `201,202,203` và Agoda 9 số vẫn bị che (đã chấp nhận). `Phòng 101 102 103` vẫn bị che như luật cũ. |
| 61 chuỗi cố lách | So với `b89dbde4`: **10 chuỗi trước lọt nay bị bắt**, không chuỗi nào trước bị bắt nay lọt. Gồm 4 ca `№`/`номер` Nga, 2 ca hộ chiếu Hàn mẫu mới, `ID - 500k` (G3), `… đồng ý`, `… dong`, `%2B079203012345`. Các ca cố ý che (`:` `|` `+` `~` `*` `#`, `O` thay `0`, dingbat, chữ số Hán, `%2520`…) vẫn lọt, mức thấp như lượt 1. |
| 27 chuỗi che thừa | Che thừa giảm: `150,000,000`, `150.000.000`, `4.500.000 x 30 đêm = 135.000.000`, `100 000 000 000` nay hiện. Không có chuỗi nào mới bị che. |
| Hiệu năng | Chạy hai bản kiểm nên chậm hơn: chậm nhất **6,6 ms** mỗi lần gọi (`ﷺ` ×500, cả bộ dò lẫn `chatSafeText`). Vẫn rất xa ngưỡng 500 ms của test. |
| `logLine` | Trường thêm có khóa `toJSON` nay bị bỏ: kết quả là `{"level":"info","msg":"m"}`. `level`/`msg` đè và `__proto__` vẫn không lọt. |

### 35 chuỗi nhắm vào ngoại lệ mới

| Nhóm | Kết quả |
|---|---|
| Đơn vị tiền chỉ tha số tận cùng `000` | `CCCD 079203012345 đồng ý`, `… đồng`, `… dong`, `VND 079203012345`, `USD079203012345` đều bị bắt. `VND 150,000,000` hiện. Đạt. |
| Số giấy tờ cạnh số tiền | `CCCD 079 203 012 345 1 500 000`, `CCCD 079203012345 150 000 000 đ`, `Ngân sách 1 000 000 079 203 012 345` đều bị bắt. Lý do: `amountSpans` chỉ phủ các nhóm của số tiền, cửa sổ chứa nhóm ngoài số tiền vẫn bị xét. Đạt. |
| Tiền tố `00` | `00 84 905 111 222` và `0084905111222` hiện. CCCD Hà Nội `001 203 012 345` và `0012 0301 2345` vẫn bị bắt. Còn lọt `00 079203012345` và `00 12 03 01 23 45` (CCCD Hà Nội viết từng cặp, cách bằng dấu cách). Hai cách viết này không tự nhiên. Cách viết từng cặp bằng `.`/`-` vốn đã lọt vì bị đọc là ngày. Rủi ro thấp, không mở thẻ. |
| `№` Nga | `45 06 № 123456`, `4506 номер 123456` bị bắt. **Còn lọt:** `Серия: 45 06 Номер: 123456`, `серия 45 06 №: 123456`, `серия 45 06 Номер 123456`. Hai lý do: `NUMBER_SIGN` phân biệt chữ hoa/thường (`Номер`), và không cho dấu `:` sau ký hiệu. Kiểu "Серия … Номер …" có dấu hai chấm là cách người Nga chép từ mẫu giấy tờ, nên khá tự nhiên. → giữ thẻ 01. |
| Hộ chiếu Hàn | `M123A4567`, `여권 m123a4567` bị bắt. `VN123A4567` (hai chữ đầu) hiện. Che thừa mới: mã có dạng `A123B4567`, `X100S2000`. Hiếm, hỏng theo hướng an toàn, chấp nhận. |

### Đánh giá rủi ro: số giấy tờ tận cùng `000000` bị coi là tiền

`amountSpans` tha mọi dãy có dạng nhóm nghìn: nhóm đầu 1–3 chữ số, tiếp theo ≥ 2 nhóm 3 chữ số, cùng một dấu tách, hai nhóm cuối là `000`. Việc này không cần đơn vị tiền. Đã xác nhận lọt: `079.203.000.000`, `079 203 000 000`, `CCCD 079,203,000,000`, `CMND 123 000 000`. Cũng lọt khi số giấy tờ bị nối thêm `000 000` (`CCCD 079 203 012 345 000 000`), nhưng đó là cách viết cố ý.

Để lọt, phải đủ cả hai điều kiện:
- 6 chữ số cuối của số giấy tờ đều là `0`. Với CCCD và CMND, đây là phần số thứ tự, xác suất khoảng 1/1.000.000.
- Khách viết số theo nhóm 3 bằng `.`, `,` hoặc dấu cách. Viết liền `079203000000` vẫn bị bắt.

Một biến thể nhẹ hơn: số tận cùng `000` đứng sát đơn vị tiền (`CCCD 079203012000 đ`). Xác suất khoảng 1/1.000, nhưng cần khách gõ đơn vị tiền ngay sau số giấy tờ, một cách viết không tự nhiên.

Hộ chiếu, số Hàn/Trung/Nga và luật thẻ (Luhn) không đi qua nhánh này.

Với vài trăm yêu cầu website mỗi năm, số ca lọt kỳ vọng gần bằng 0. Đổi lại, đội bỏ được nhóm che thừa lớn nhất mà QA ghi ở BUG-R4-016: khách ghi ngân sách không có đơn vị.

**Mức: Thấp, chấp nhận.** Không mở thẻ. Comment trong mã đã ghi rõ ca bỏ sót này (`Missed ID: one ending in 000000`).

### Trạng thái thẻ

| Thẻ | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-BE-PR24-01 (Minor) | **Open, phần lớn đã xong** | Hộ chiếu Hàn mẫu mới: **đóng**. `№`/`номер` thường: **đóng**. Còn: `NUMBER_SIGN` thêm cờ `i` và cho phép `:` (đề xuất `(?<=\d)\s*(?:№|No\.?|N[o°º]|номер|nr\.?)\s*:?\s*(?=\d)` với cờ `iu`), kèm 3 ca test ở trên. Vẫn là điều kiện trước khi mở LP-v2 tiếng Nga. Phần tiếng Hàn đã đủ. |
| FB-R4-SEC-BE-PR24-02 (Minor) | **Closed** | OR giữa hai bản kiểm, điều kiện `000`, `đồng ý`/`dong`, G3: đều kiểm lại đạt. |
| FB-R4-SEC-BE-PR24-03 (Suggestion) | Phần BE **Done** (2 ca SĐT CN/RU vào danh sách che thừa đã chấp nhận) | Câu báo lỗi vẫn chờ CPY/UXD. Nay ít gấp hơn, vì số tiền không đơn vị đã hết bị từ chối. |
| FB-R4-SEC-BE-PR24-04 (Suggestion) | **Closed** | `toJSON` bị bỏ, có test. |

### Kết luận lượt 2

**PR #24 vẫn duyệt (phía SEC).** Không có Blocker/Major. Điều kiện gộp như lượt 1: PR #16 gộp trước, và CI của `f8080499` xanh.

**★5 không đổi so với mục 6.** Phần mã đủ: GCHAT-07 bước 1–4 và mục 10 đạt trên `f8080499`. Còn gộp, triển khai v1.0.1 (thay `b89dbde4` bằng `f8080499` trong điều kiện (b)) và lượt kiểm INT trên phòng Chat thử. Thẻ 01 phần còn lại chỉ chặn việc mở LP-v2 tiếng Nga, không chặn mức C.

### Dòng decision-log đề xuất (lượt 2)

| 2026-11-01 | 4 | **SEC – PR #24 lượt 2 (`f8080499`): vẫn duyệt phía SEC** (`rounds/round-04/reviews/SEC-on-PR24-text-safety.md` mục Lượt 2). Đóng PR24-02 (OR bản giải mã/giữ nguyên `%XX`; đơn vị tiền chỉ tha số tận cùng `000`) và PR24-04 (`toJSON`). PR24-01 còn phần `Номер`/`№:` (chữ hoa, dấu hai chấm): điều kiện trước khi mở LP-v2 ru. Chấp nhận rủi ro Thấp: số giấy tờ tận cùng `000000` viết theo nhóm nghìn bị coi là tiền (≈ 1/1.000.000), để bỏ che thừa số tiền không đơn vị (BUG-R4-016). Chạy lại 63 + 61 + 27 + 35 chuỗi: không chuỗi nào trước bị bắt nay lọt; chậm nhất 6,6 ms. ★5: phần mã đủ; còn gộp, triển khai và lượt INT. | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |

---

## Lượt 3 – 80a73367

- Người review: SEC | Round 4 – Review lượt 3 | 01/11/2026
- Đọc: `git diff f8080499..80a73367` của `sensitive-number.ts`. Có 3 thay đổi:
  - `NUMBER_SIGN` thêm cờ `i` và cho phép `:` sau ký hiệu;
  - `amountSpans` và điều kiện `money` không nhận số bắt đầu bằng `0`;
  - tiền tố `00` chỉ nhận khi nhóm sau không bắt đầu bằng `0`.

  `log-line.ts` không đổi so với lượt 2.
- Cách kiểm: bộ chạy thử `sec24` ở scratchpad, thay `sensitive-number.ts` bằng bản `80a73367`. Chạy lại 63 + 61 + 27 + 15 chuỗi và 35 chuỗi của lượt 2, thêm 11 chuỗi thử `NUMBER_SIGN` cờ `i`. Chỉ dùng số giả.

### Kết quả

| Bộ | Kết quả |
|---|---|
| 63 chuỗi lượt 3 | Giống lượt 2: 44/44 chuỗi phải bắt đều bị bắt ở form và Chat. Che thừa đã chấp nhận không đổi. |
| 61 + 27 chuỗi (cố lách, che thừa) | Kết quả **trùng từng dòng** với `f8080499` (so bằng `diff`). |
| `Номер` / `№:` (thẻ 01) | `Серия: 45 06 Номер: 123456`, `серия 45 06 №: 123456`, `серия 45 06 Номер 123456`, `4506 NO: 123456` đều bị bắt. |
| Số giấy tờ tận cùng `000000` | Các ca CCCD trước lọt nay đều bị bắt: `079.203.000.000`, `079 203 000 000`, `CCCD 079,203,000,000`, `079 203 012 345 000 000`, `079.203.012.345.000.000`. Ca `CCCD 079203012000 đ` cũng bị bắt. CCCD luôn bắt đầu bằng `0`, nên nay **không CCCD nào** còn bị đọc nhầm là tiền. Còn lại CMND 9 chữ số không bắt đầu bằng `0` mà tận cùng `000000`, viết theo nhóm nghìn (`CMND 123 000 000`): xác suất khoảng 1/1.000.000, loại giấy tờ đang thôi dùng. Mức Thấp, giữ chấp nhận như lượt 2. |
| Tiền tố `00` | `00 079203012345` nay bị bắt. `00 84 905 111 222` và `0084905111222` vẫn hiện. `00 12 03 01 23 45` (CCCD viết từng cặp) vẫn lọt. Rủi ro thấp như lượt 2, không mở thẻ. |
| Hiệu năng | Chậm nhất 10,2 ms mỗi lần gọi (`ﷺ` ×500, cả bộ dò lẫn `chatSafeText`). Dao động do máy, mã không thêm vòng lặp. Vẫn xa ngưỡng 500 ms. |

### Ca `0905111222 no 0912333444` – che thừa, chấp nhận

Cờ `i` làm `no`, `No.`, `nó` (thành `no` sau khi bỏ dấu), `nr` giữa hai chữ số được đọc như dấu cách. Hai SĐT nối bằng các từ này trở thành một dãy 20 chữ số nối chặt. Với cửa sổ Luhn 13–19, dãy này gần như luôn bị đọc là thẻ:
- `0905111222 no 0912333444`, `0905111222 No. 0912333444`, `0905 111 222 nó 0912 333 444`, `0905111222 nr 0912333444` đều bị che (`card`).

Các ca sau vẫn hiện: `Phòng 2 nợ 500.000`, `Phòng 101 no 102`, `2 người no 3 trẻ`, `Room 12 No 5, floor 3`.

SEC **chấp nhận** che thừa này, vì 3 lý do:
- Đây cùng loại với `0905111222 0912333444` (hai SĐT cách một dấu cách), đã chấp nhận từ lượt 3 round 3.
- Lỗi theo hướng an toàn: form trả 422 trước khi ghi DB; Chat thay cả trường, Desk vẫn có bản gốc.
- Cách khách viết tự nhiên là `hoặc` / `or` / `/` / `, `, và các cách này vẫn hiện. Ghép hai SĐT bằng `no`/`nó` hiếm gặp.

Không cần sửa. Nếu muốn, BE thêm ca này vào danh sách che thừa đã chấp nhận trong test để khóa hành vi.

### Trạng thái thẻ

| Thẻ | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-BE-PR24-01 (Minor) | **Closed** | `№`/`Номер`, mọi kiểu hoa/thường, có hoặc không `:`, và hộ chiếu Hàn mẫu mới đều bị bắt. Điều kiện số giấy tờ Nga/Hàn trước khi mở LP-v2 ru/ko: **đạt phía SEC**. |
| FB-R4-SEC-BE-PR24-02 | Closed (lượt 2) | Giữ nguyên. Điều kiện "không bắt đầu bằng `0`" còn thu hẹp thêm ca bỏ sót. |
| FB-R4-SEC-BE-PR24-03 | Phần BE Done | Câu báo lỗi vẫn chờ CPY/UXD (Suggestion). |
| FB-R4-SEC-BE-PR24-04 | Closed (lượt 2) | – |

### Kết luận lượt 3

**PR #24 duyệt (phía SEC), không còn thẻ Minor nào mở.** Điều kiện gộp: PR #16 gộp trước, và CI của `80a73367` xanh.

**★5:** phần mã đủ. Còn lại:
- (a) gộp PR #16 rồi PR #24;
- (b) v1.0.1 chứa `98ff43bb` và `80a73367` lên production;
- (c) INT chạy lượt kiểm trên phòng Chat thử.

Production chưa đặt C cho tới khi đủ ★1–★8.

### Dòng decision-log đề xuất (lượt 3)

| 2026-11-01 | 4 | **SEC – PR #24 lượt 3 (`80a73367`): duyệt phía SEC, đóng PR24-01** (`rounds/round-04/reviews/SEC-on-PR24-text-safety.md` mục Lượt 3). `NUMBER_SIGN` không phân biệt hoa/thường và cho phép `:`: bắt `Серия … Номер: …`. Số tiền và tiền tố `00` không bắt đầu bằng `0`: không CCCD nào còn bị đọc là tiền. Rủi ro còn lại Thấp: CMND không bắt đầu bằng `0` mà tận cùng `000000`, viết theo nhóm nghìn. Chấp nhận che thừa hai SĐT nối bằng `no`/`nó`/`nr` (cùng loại hai SĐT cách một dấu cách). Bộ chuỗi chạy lại trùng lượt 2, không chuỗi nào trước bị bắt nay lọt. ★5: phần mã đủ; còn gộp, triển khai và lượt INT. | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |
