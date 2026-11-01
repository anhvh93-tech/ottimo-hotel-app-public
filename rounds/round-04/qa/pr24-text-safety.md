# QA – PR #24: một luật số giấy tờ/thẻ cho form và tin Google Chat (text safety)

- Tác giả: QA | Round 4 – v1.0.1 đợt 2 – Bước: **Kiểm thử** | 01/11/2026 ~21:10–21:40
- Đối tượng: PR #24 `be-d/v1.0.1-text-safety`, head `b89dbde4`. Nhánh cắt từ PR #16 `98ff43bb`, nên có cả phần Google Chat. Gốc so với `main` là `84472dc7`: 37 tệp, +4600/−89. Báo cáo BE: `rounds/round-04/outputs/BE/text-safety.md` (trên nhánh).
- Đối chiếu: bảng 2a–2d lượt 2 trong `rounds/round-03/reviews/QA-on-BE-gchat-notify.md`, BUG-R3-058 trong `rounds/round-03/qa/bug-list.md`, FB-R3-QA-BE-GCHAT-06, giả định G1–G4 của BE.
- Môi trường:
  - Worktree QA tách rời ở `b89dbde4`. Node 22.23.3, `pnpm install --frozen-lockfile --offline`, build `@ottimo/contracts` và `@ottimo/integrations`.
  - DB: container Postgres 17 tạm `qa-pr24-pg`, cổng 55541. Không trùng với các stack `ottimo-qapr22`, `ottimo-esc031`, `ottimo-demo` đang chạy. Đã chạy `infra/postgres/init/02-roles.sh` như CI. Test chạy với vai `ottimo_app`. **Đã xóa container** lúc 21:20.
  - Webhook: chỉ dùng webhook giả `test/helpers/fake-chat-webhook.ts` (127.0.0.1). Không gửi tin ra ngoài.
  - Dữ liệu: chỉ dữ liệu giả, gồm CCCD `079203012345`, thẻ thử `4111…`, SĐT `0905 111 222`, tên miền `*.example`.

## 0. Kết luận

**ĐẠT – không chặn gộp. BUG-R3-058: Đã sửa – đã xác nhận.**

| # | Việc | Kết quả |
|---|---|---|
| 1 | Bảng 2a/2b/2c/2d lượt 2, chạy qua **form** (POST thật → 422/202) | **Đạt.** 70/70 chuỗi phải chặn đều nhận 422, đúng trường, đúng mã, không lưu dòng nào, không tạo dòng `staff.chat`. 18/18 chuỗi 2c được 202 |
| 2 | Cùng bảng trên **tin Chat mức C** qua webhook giả | **Đạt.** Form và Chat cho cùng một kết quả ở **167/167** chuỗi. Chuỗi bị chặn ở form thì Chat che. Chuỗi được nhận thì Chat in đúng như khách gõ, chỉ khác `[.]` ở tên miền |
| 3 | BUG-R3-058 (form nhận CCCD/thẻ tách bằng ký tự ẩn, `_ / ,`, chữ số toàn độ rộng) | **Đã sửa – đã xác nhận.** Gồm mọi chuỗi bổ sung 31/10 (nhóm SEC GCHAT-07 và QA FB-06 a/b/c) |
| 4 | `(+84) 905-111-222` qua form | **Đạt:** 202. Tin C in nguyên `(+84) 905-111-222` |
| 5 | SĐT VN/quốc tế, ngày, giờ, tiền có đơn vị, mã đặt **không bị chặn/che** | **Đạt 55/58** (cộng 18/18 chuỗi 2c). Còn 3 chuỗi bị che thừa và cả 3 là **mới so với `main`**: `0084 905 111 222`, `₫150,000,000`, `budget VND 150,000,000`. Ghi vào **BUG-R4-016 (P3)** |
| 6 | Đánh giá G2 | Che thừa lớn hơn BE ghi. Ngoài `201,202,203` và `150,000,000`, số tiền **≥ 1 tỷ không ghi đơn vị** cũng bị chặn, kể cả viết dấu chấm kiểu Việt (`1.500.000.000`); `main` không chặn chuỗi này. Đề xuất cho PO ở mục 5 |
| 7 | Bộ test | api toàn bộ: **142 tệp đạt, 2 bỏ qua; 3542 ca đạt, 19 bỏ qua; 0 lỗi**. Năm bộ text-safety/Chat/form: **302/302** ở 4 múi giờ tiến trình |

Lỗi mới: **BUG-R4-016 (P3, BE-D)**. Lỗi này không chặn gộp. ESC mới: không có.

## 1. Cách test

**A. Bảng chuỗi đầu–cuối (167 ca).** QA viết một tệp test tạm ở `services/api/test/integration/` và chạy trên Postgres tạm. Tệp này **không commit** và đã xóa sau khi chạy. Mỗi chuỗi đi qua hai đường:
- **Form:**
  - App NestJS/Fastify đầy đủ (`startFeatureApp`, `app.inject`), chạy đủ guard, rate-limit, form token, schema, luật V-09 và ghi DB.
  - Thông báo `2026-10-31` đã đăng. Bật `public_booking_requests_enabled`. `public_booking_request_daily_cap` = 500.
  - Mỗi ca dùng IP riêng (rate-limit theo IP) và SĐT riêng (giới hạn 3 lần/ngày cho mỗi liên hệ).
  - Nhận 202 thì chạy `ChatDispatcher` thật ở **mức C**, client Chat thật (`postChatText`) bắn tới webhook giả, rồi đọc dòng `Khách:` hoặc khối lời nhắn.
  - Nhận 422 thì đếm dòng `staff.chat` còn chờ (kỳ vọng 0).
- **Chat với dòng lưu sẵn:**
  - Chèn thẳng một dòng `website_booking_request` có tên hoặc lời nhắn y như chuỗi gốc, giả lập dòng cũ lưu trước bản sửa hoặc lối vào khác bỏ qua cổng form.
  - `consent_version = 2026-10-31`. Xếp `web_request_new`, gửi ở mức C, đọc tin.
- Kiểm chéo bằng DB: tenant thử có **79** dòng tạo qua form, đúng bằng số ca 202. 88 ca 422 không để lại dòng nào.

**B. So `main` với PR.** Script ở scratchpad, ngoài repo. Script chép nguyên luật cũ từ `origin/main` (`normalizeFreeText`, `looksLikeCard`, `looksLikeIdNumber`), rồi so với `sensitiveNumberKind` của PR trên 100 chuỗi. Mục đích là tách che thừa **có sẵn** khỏi che thừa **mới**.

**C. Hiệu năng/ReDoS.** 10 chuỗi 500 ký tự dựng để làm khó luật: chuỗi `' -'`, chuỗi dấu cách, `1 ` lặp lại, `1_/` lặp lại, `%XX` hỏng… Chậm nhất **0,61 ms** mỗi lần gọi.

**Chưa test:**
- Stack docker compose thật, trình duyệt landing, phòng Chat thật. Đường form đã chạy qua app thật trong tiến trình. Không dựng compose, vì 167 lượt gửi cần IP khác nhau để tránh rate-limit.
- lint, typecheck, format: BE báo đạt. Job CI `format · lint · audit · test · build` của PR lúc 21:20 **đang chạy**; 6 job khác đã xanh.
- Ngôn ngữ ko/zh/ru của câu báo lỗi trên landing.

## 2. Kết quả chạy test (head `b89dbde4`)

| Bộ | Phạm vi | Kết quả |
|---|---|---|
| Toàn bộ api | `vitest run`, DB thật, có `BOOTSTRAP_*` | **142 tệp đạt, 2 bỏ qua; 3542 ca đạt, 19 bỏ qua; 0 lỗi** (149 s). Lỗi `architecture.test.ts > accept ottimo_app` BE gặp ở lượt cuối **không tái hiện** |
| Text safety + Chat + form | `text-safety-units`, `gchat-units`, `gchat-notify`, `gchat-worker-only`, `public-site-r3-bed` với `TZ=UTC`, `America/Los_Angeles`, `Pacific/Kiritimati` (máy QA là +07) | **302/302** ở cả 3 múi giờ |
| Bảng chuỗi QA | 167 ca × (form + Chat C) | Xem mục 3 |

## 3. Bảng chuỗi – form và Chat mức C

"Chặn" = form trả 422 đúng mã. "Che" = trường trong tin C thành `(có dãy số giống giấy tờ hoặc thẻ – xem trên Desk)`. Lời nhắn thử dạng `CCCD <chuỗi> nhé`.

### 3a. Chuỗi lượt 1 (2a) – 15 ca

| Chuỗi | Form | Chat C |
|---|---|---|
| `0790<ZWSP>12345678`, `079<WJ>203<WJ>012<WJ>345`, `079203<SHY>012345`, `079_203_012_345`, `079,203,012,345`, `079/203/012/345`, `079<NBSP>203<NBSP>012<NBSP>345`, `０７９２０３０１２３４５`, đối chứng `079203012345` | 422 `note:ID_NUMBER_DETECTED` | Che |
| `4111<ZWSP>1111<ZWSP>1111<ZWSP>1111`, `4111_1111_1111_1111` | 422 `note:CARD_NUMBER_DETECTED` | Che |
| Tên `079_203_012_345`, `0790<ZWSP>12345678`, `０７９…` / `4111_1111_1111_1111` | 422 `guestName:ID_…` / `guestName:CARD_…` | Che |

Lượt 2 (PR #16), form **nhận** 10/11 chuỗi lời nhắn. Nay form chặn cả 11.

### 3b. Chuỗi cố lách (2b) – 31 ca, tất cả bị chặn và che

Các nhóm:
- trộn ZWSP với `_`, `.`;
- ZWSP hoặc `_` giữa từng chữ số (CCCD và thẻ 16 số);
- chữ số Devanagari, Thái, Bengal, Ả Rập, trộn hệ, Devanagari kèm ZWSP hoặc `_`;
- chữ số toán học, đơn cách (thẻ), chỉ số trên, khoanh tròn;
- U+2009, U+3000;
- số thẻ, CCCD, hộ chiếu trong URL, kể cả có ZWSP;
- tên có `__`, hai dấu cách, `\n`, `\r\n`, U+2028;
- lời nhắn trên 8 dòng có dòng 9 nối vào.

Mã đúng loại: thẻ → `CARD_NUMBER_DETECTED`, còn lại → `ID_NUMBER_DETECTED`.

### 3c. SĐT và chữ thường (2c) – 18 ca, tất cả 202, Chat in nguyên

`Gọi em số 0905 111 222 nhé`, `0905111222`, `0905.111.222`, `0905-111-222`, `0905_111_222`, `+84 905 111 222`, `+84905111222`, `84905111222`, `０９０５１１１２２２`, `0905 111 222, 0905 333 444`, `Zalo 0905111222 hoặc 0283 822 1234`, `Đến 12/11/2026, đi 15/11/2026, 2 người lớn 1 trẻ 5 tuổi`, `Ngân sách 1,500,000 đ/đêm`, `Gọi sau 18:00 ngày 12.11`, `Phòng 101, 102`, `Mã đặt Agoda 1234567890`, **`(+84) 905-111-222`**.

Thay đổi so với lượt 2: `0905111222,0905333444` (hai SĐT nối bằng `,` không có dấu cách) trước bị Chat che thừa. Nay nó **qua** cả form lẫn Chat, nên giảm được một ca che thừa.

### 3d. Chuỗi từng lọt (2d) – 24 ca, nay tất cả bị chặn và che

| Nhóm (lượt 2: form nhận, Chat in y nguyên) | Nay |
|---|---|
| Nhiều ký tự tách: `0790__12345678`, `079__203__012__345`, `079_/203_/012_/345`, `079 - 203 - 012 - 345`, hai dấu cách; tên `079_/203_/012_/345` | 422 + Che |
| Xuống dòng `\n`, `\r\n`, U+2028 (CCCD, thẻ, `079203⏎012345`) | 422 + Che |
| `–`, U+2011, `·`, `'` | 422 + Che |
| U+034F, VS1, VS16, keycap `0️⃣…`, dấu kết hợp trên từng chữ số | 422 + Che |
| U+3164 (Hangul filler), U+2800 (Braille trống) | 422 + Che |
| `%20`, `%E2%80%8B` giữa các nhóm | 422 + Che |

### 3e. Phải hiện (không chặn, không che) – 58 ca mới (cộng 5 ca biên và 16 ca G2 ở mục 5, tổng bảng 167)

| Nhóm | Ca đạt | Ca che thừa |
|---|---|---|
| SĐT VN/quốc tế (22) | `0905 111 222 hoặc 0912 333 444`, `0905111222 / 0912333444`, `+84 (0) 905 111 222`, `(+84) 905 111 222`, `(+84)905111222`, `028 3822 1234`, `(028) 3822 1234`, `Hotline 1900 1234`, `1800 5888 99`, `+82 10-1234-5678`, `010-1234-5678`, `+86 138 0013 8000`, `138 0013 8000`, `+7 912 345-67-89`, `8 (912) 345-67-89`, `+1 (415) 555-0123`, `+44 20 7946 0958`, `+61 412 345 678`, `+65 9123 4567`, `+33 6 12 34 56 78`, `WhatsApp +84 905 111 222, Zalo 0905 111 222` | **`0084 905 111 222`** → 422 (mới, BUG-R4-016) |
| Ngày, giờ (11) | `12/11 - 15/11`, `12-15/11/2026`, `từ 12.11 đến 15.11.2026`, `2026-11-12 → 2026-11-15`, `Nov 12–15, 2026`, `check-in 14:00, check-out 12h`, `14h30 ngày 12/11`, `2pm-3pm`, `12/11/2026 14:00 – 15/11/2026 12:00`, `12/11, 13/11, 14/11, 15/11`, `bay VN1234 hạ cánh 13:45 ngày 12/11` | – |
| Tiền có đơn vị (17) | `1.500.000đ/đêm`, `1,500,000 VND`, `150.000.000 đ`, `150,000,000 VND`, `150 000 000 VNĐ`, `$1,200`, `USD 1,200`, `15 triệu/tháng`, `100 000 000 - 150 000 000 đ`, `100.000.000-150.000.000đ`, `khoảng 150tr`, `150.000.000 đồng`, `ngân sách 150 triệu`, `150,000,000 VND/6 tháng`, `budget 150,000,000 vnd` | **`₫150,000,000`**, **`budget VND 150,000,000`** → 422 (mới, BUG-R4-016) |
| Mã đặt, hóa đơn (8) | `REQ-7K3P9QXA`, `Mã yêu cầu 7K3P9QXA`, `Booking.com 4012.345.678`, `Booking.com 4012345678 PIN 1234`, `Agoda 1234567890`, `Traveloka 1234567890`, `Airbnb HMABCD1234`, `Xuất hóa đơn MST 0312345678` | – |

Ca biên đã biết, ghi để PO biết. Các ca này **không mới**: `main` cũng chặn y như vậy.
- `905 111 222` (bỏ số 0 đầu) và `(84) 905 111 222`: 9 chữ số.
- `0905111222 0912333444`: hai SĐT cách một dấu cách, đọc như thẻ (SEC đã chấp nhận).
- `0905111222 10 người`, `0905 111 222 12 khách`: SĐT cộng số người ra đủ 12 chữ số.
- `Agoda booking ID 562378912`: mã đặt 9 chữ số.

`Expedia itinerary 7212345678901` (13 chữ số), `MST 0312345678-001` qua lần thử này. Tuy vậy, mọi dãy 13–19 chữ số liền đều có khoảng 1/10 khả năng đạt Luhn và bị đọc là thẻ. Điều này giống hệt `main`.

## 4. BUG-R3-058 – xác nhận

Kỳ vọng của lỗi: form trả 422 `ID_NUMBER_DETECTED` / `CARD_NUMBER_DETECTED` cho CCCD/thẻ tách bằng ZWSP, WJ, gạch nối mềm, NBSP, `_`, `/`, `,`, hoặc viết bằng chữ số toàn độ rộng. Gồm cả các chuỗi bổ sung 31/10: nhiều ký tự tách, xuống dòng, gạch Unicode, `·`, `'`, U+034F/VS, keycap, dấu kết hợp, U+3164, U+2800, `%XX`.

Kết quả trên `b89dbde4`:
- **mọi chuỗi** đều 422, đúng trường, đúng mã, không lưu dòng, không xếp tin Chat;
- `(+84) 905-111-222` nay qua;
- form và Chat dùng **một** hàm (`sensitiveNumberKind`). QA kiểm bằng 167 ca: hai bên không lệch nhau ca nào.

→ **Đã sửa – đã xác nhận** (Open → Fixed). Lỗi sang **Closed** khi PR #16 và PR #24 gộp vào `main` với job CI `format · lint · audit · test · build` xanh.

G1 (chữ lưu không đổi, chỉ bản dùng để kiểm được chuẩn hóa): QA đồng ý. Bước kiểm trên bản chuẩn hóa đã đủ để trả 422. Không cần đổi dữ liệu lưu.

Ca cố ý lách còn lại, rủi ro thấp, ghi cho SEC biết:
- `(+84) 079 203 012 345`: `main` chặn, nay qua. Đây là mặt trái của ngoại lệ `(+84)`. Phải cố ý mới viết CCCD sau `(+84)`.
- `CCCD 079203012345 - 100 000 đ`: G3 BE đã ghi.

QA không mở lỗi cho hai ca này.

## 5. G2 – che thừa: có chặn khách thật không, đề xuất cho PO

### 5.1. Đo trên `main` và PR (lời nhắn)

| Chuỗi khách có thể gõ | `main` | PR #24 |
|---|---|---|
| `căn 201, 202, 203` · `căn 201 và 202` · `căn 201,202` · `căn 202,203 và 302` | qua | qua |
| `căn 201 202 203` · `căn 201-202-203` · `Phòng 202 203 204 cho 15 người` | **chặn** | chặn |
| `Căn 201,202,203` · `căn 201/202/203` · `căn 101,201,301` · `Rooms 201,202,203 please` · `căn 201,202,203,302` | qua | **chặn (mới)** |
| `ngân sách 150.000.000` · `150 000 000` · `tổng 120.000.000` · `VNĐ 150.000.000` | **chặn** | chặn |
| `Ngân sách 150,000,000` · `budget 150,000,000 for 6 months` · `tổng 120,000,000 cho 8 tháng` · `100,000,000-150,000,000` | qua | **chặn (mới)** |
| `Ngân sách 1.500.000.000` · `1,500,000,000` · `1 500 000 000` (≥ 1 tỷ, không đơn vị) | qua | **chặn (mới – BE chưa ghi ở G2)** |
| `VND 150,000,000` · `₫150,000,000` · `USD 150,000,000` (có đơn vị **đứng trước**) | qua | **chặn (mới – lỗi, BUG-R4-016)** |
| `150,000,000 VND` · `150.000.000 đ` · `1.500.000.000đ` · `15,000,000/tháng` · `99,000,000` · `150 triệu` | qua | qua |

Câu khách nhận khi bị chặn: "No need to send ID numbers at this step. Please remove it." / "Không cần gửi số giấy tờ ở bước này. Vui lòng xóa số đó." (`booking-strings.ts`). Chữ khách gõ vẫn còn trong ô. Tuy vậy, khách ghi số phòng hay ngân sách sẽ **không hiểu** "số giấy tờ" nào bị nói tới.

### 5.2. Đánh giá

- **Số phòng (`201,202,203`):** chỉ bị chặn khi khách ghi **từ 3 căn trở lên**, nối bằng `,` hoặc `/` không có dấu cách. OTTIMO có 10 căn, mã 3 chữ số (101…401). Khách lần đầu ít khi biết số căn. Khách quay lại hoặc nhóm gia đình đặt 3 căn thì có thể biết, và trên điện thoại hay gõ dấu phẩy liền. QA ước tính **hiếm, dưới 1% yêu cầu**. Chưa có dữ liệu thật để đo; QA không đọc lời nhắn thật của khách.
- **Ngân sách 9 chữ số không đơn vị:** đúng tệp khách **dài hạn** của OTTIMO. Thuê 6–12 tháng có tổng khoảng 100–999 triệu. Khách Việt chủ yếu ghi `150 triệu`, `150tr`, hoặc `150.000.000` (dạng này `main` đã chặn từ trước). Khách nước ngoài ghi `150,000,000`, thường kèm VND. Khi gõ `VND` **trước** số, như Agoda/Booking hiển thị, thì nay bị chặn (BUG-R4-016). QA ước tính **thỉnh thoảng gặp** ở khách dài hạn. Mỗi lần gặp là một lead giá trị cao bị cản, kèm câu báo lỗi khó hiểu.
- **≥ 1 tỷ không đơn vị:** hiếm (hợp đồng năm cho nhiều căn), nhưng là bước lùi so với `main`.
- Mặt an toàn: không có cách nào phân biệt `201,202,203` với CMND 9 số `201 202 203` chỉ bằng hình dạng. Với tiền thì phân biệt được: tiền gần như luôn tận cùng bằng nhóm `000`.

### 5.3. Đề xuất cho PO (QA khuyến nghị PA1)

| PA | Nội dung | Ai | Đích | Ưu / nhược |
|---|---|---|---|---|
| **PA1 (đề xuất)** | (a) **Đổi câu báo lỗi `ID_NUMBER_DETECTED`** ở lời nhắn để khách tự sửa được. Gợi ý (CPY/UXD chốt theo brand, đủ 5 ngôn ngữ): EN "This looks like an ID or card number. If it is a room number, budget or booking code, please write it with words or spaces, e.g. '201, 202, 203' or '150 million VND'." / VI "Có dãy số giống số giấy tờ. Nếu là số căn, ngân sách hay mã đặt, vui lòng ghi kèm chữ hoặc dấu cách, ví dụ '201, 202, 203' hoặc '150 triệu'." (b) BE-D sửa **BUG-R4-016**: nhận `VND`/`VNĐ`/`USD`/`₫`/`đ` đứng trước, coi `00` + mã nước như `+`, và coi dãy tách nhóm nghìn có **hai nhóm cuối là `000`** là tiền (`150,000,000`, `1.500.000.000`). SEC duyệt (b) vì đổi luật V-09. (c) DATA/OPS đếm số 422 `note:ID_NUMBER_DETECTED` trên tổng số lần gửi mỗi tuần, trong 4 tuần đầu. Log chỉ có `field` + `code`, không có chữ khách gõ. Nếu vượt 2% thì PO xem lại | CPY/UXD + FE-B (a); BE-D + SEC (b); DATA/OPS (c) | (a)(c) v1.0.1 nếu kịp; (b) v1.0.1 hoặc v1.0.2 | Giữ đúng US-155 AC5 và fail-safe của SEC. Gỡ gần hết ca ngân sách (dạng cho lead giá trị cao). Số phòng vẫn bị chặn, nhưng khách biết cách sửa. Chi phí nhỏ |
| PA2 | Giữ nguyên, chỉ làm (a) | CPY/UXD + FE-B | v1.0.1 | Rẻ nhất. Ngân sách `150,000,000` và `≥ 1 tỷ` vẫn bị chặn |
| PA3 | Với dạng "yếu" (nhóm 3 số nối bằng `,`/`/`, không có từ khóa giấy tờ): chỉ **cảnh báo** trên trình duyệt, cho khách xác nhận rồi gửi. Máy chủ vẫn lưu, Chat vẫn che | FE-B + BE-D + SEC | v1.0.2 | Ít cản khách nhất. Nhưng trái US-155 AC5 ("không nhận số giấy tờ"), lưu C3 vào DB nếu đúng là CMND. **QA không khuyến nghị** |

Việc này thuộc quyền PO (tiêu chí nghiệm thu) và SEC (luật V-09), không cần INV quyết, nên **không tạo ESC**. G2 **không chặn gộp PR #24**: các dạng mới bị chặn là fail-safe và hiếm.

## 6. Lỗi mới

### BUG-R4-016 – Form chặn nhầm số tiền có đơn vị đứng trước, số tiền ≥ 1 tỷ không đơn vị và SĐT viết với tiền tố `00` (mới so với `main`)

Chi tiết ở `rounds/round-04/qa/bug-list.md`. Tóm tắt:
- **Mức:** P3. Không sai tiền, không lộ dữ liệu, khách sửa chữ là gửi được. Nhưng câu báo lỗi nói về "số giấy tờ", và trúng tệp khách dài hạn.
- **Vai:** BE-D (`sensitive-number.ts`).
- **Thực tế:** 422 `note:ID_NUMBER_DETECTED` cho `₫150,000,000`, `VND 150,000,000`, `USD 150,000,000`, `Ngân sách 1.500.000.000`, `0084 905 111 222`, `00 84 905 111 222`. `main` nhận cả 6 chuỗi. Chat che các chuỗi này nếu có dòng lưu sẵn.
- **Nguyên nhân (đọc mã):**
  - `MONEY_BEFORE = /[$€£¥₩]\s?$/` thiếu `₫` và các mã chữ `VND`/`VNĐ`/`USD`;
  - luật mới "các nhóm liền nhau cộng đúng 9/12 chữ số" đọc **phần đuôi** `500.000.000` của `1.500.000.000` như CMND;
  - ngoại lệ SĐT chỉ nhận `+` hoặc nhóm đầu `84`, không nhận `0084` hay `00 84`. Đuôi `905 111 222` có 9 chữ số.
- **Mong đợi:** 202 như `main`. Chú thích đầu tệp cũng viết "an amount next to its currency" không phải giấy tờ.
- **Đề xuất:** xem PA1 (b). Thêm các chuỗi trên vào nhóm "57 chuỗi không được che nhầm" của `text-safety-units.test.ts`.

## 7. Điều kiện

**Gộp PR #24 (phía QA):** đạt. Còn chờ:
- job CI `format · lint · audit · test · build` xanh trên `b89dbde4`;
- PR #16 gộp trước, hoặc gộp cùng;
- SEC duyệt `sensitive-number.ts` (GCHAT-07 bước 1–4, mục 10).

QA không còn thẻ Major mở.

**Trước khi đặt `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C`:**
- phần QA trong điều kiện ★5 đã xong: FB-06 (a)(b)(c) có trong PR, và QA đã xác nhận trên form lẫn Chat;
- các điều kiện còn lại giữ như lượt 2: 057/058 lên production; TC-GC-14 có trong lượt kiểm INT trên phòng thử; FB-03 đã chọn dạng mã.

**Dòng decision-log đề nghị ORC ghi:**
`| 2026-11-01 | 4 | QA – kiểm thử PR #24 (text safety, head b89dbde4, gồm PR #16): ĐẠT, không chặn gộp. BUG-R3-058 Đã sửa – đã xác nhận (Closed khi #16 + #24 gộp main + CI xanh). 167 chuỗi chạy qua form (POST → 422/202) và tin Chat mức C (webhook giả): form và Chat không lệch ca nào; 70 chuỗi CCCD/thẻ (2a/2b/2d) bị chặn và che; (+84) 905-111-222 và 55/58 chuỗi SĐT/ngày/giờ/tiền/mã đặt qua. api 3542/0 lỗi; 302/302 ở 3 múi giờ. Lỗi mới BUG-R4-016 (P3): chặn nhầm VND/₫ đứng trước số, tiền ≥ 1 tỷ không đơn vị, SĐT 0084. G2: đề xuất PO chọn PA1 (đổi câu báo lỗi + BE-D sửa 014 + đếm 422) | QA | Quyền QA (mức lỗi, kết luận kiểm thử) |`

---

## Lượt 2 – f8080499

- Người test: QA | Round 4 – Bước: **Kiểm thử** (test lại bản sửa) | 01/11/2026 ~22:00–22:40
- Đối tượng: PR #24 head `f8080499`, một commit trên `b89dbde4`. Commit sửa `sensitive-number.ts`, `log-line.ts`, các test và báo cáo BE mục 7. Mục tiêu sửa: BUG-R4-016, SEC PR24-01/02/04. Đã đọc thêm `rounds/round-04/reviews/SEC-on-PR24-text-safety.md` mục "Lượt 2" (SEC vẫn duyệt).
- Cách test giống lượt 1:
  - Worktree tách rời ở `f8080499`. Postgres 17 tạm `qa-pr24r2-pg`, cổng 55542, chạy `02-roles.sh`. **Đã xóa container.**
  - Bảng chuỗi chạy qua app thật trong tiến trình. Mỗi chuỗi đi hai đường: POST form (422/202), rồi `ChatDispatcher` mức C bắn tới webhook giả, cho cả dòng tạo từ form lẫn dòng lưu sẵn y như chuỗi gốc.
  - Tệp test tạm không commit, đã xóa. Chỉ dữ liệu giả.
- Bộ chuỗi: **167 ca lượt 1, giữ nguyên ID và thứ tự**, cộng **48 ca mới**, tổng **215**:
  - R2G: 6 ca G2 ngân sách BE đưa vào "không che nhầm";
  - R2B: đủ 10 chuỗi của BUG-R4-016;
  - R2S: 13 ca SEC PR24-01/02 và số giấy tờ đứng cạnh số tiền, phải chặn;
  - R2P: 19 ca QA dò thêm quanh `amountSpans` và tiền tố `00`.
- So sánh: so từng ca với kết quả lượt 1 trên `b89dbde4`. Ngoài ra chạy script ở scratchpad so ba bản `main`, `b89dbde4` và `f8080499` trên chuỗi nghi vấn.

### L2.0. Kết luận lượt 2: **ĐẠT. BUG-R4-016 Đã sửa – đã xác nhận. Không hồi quy.**

| # | Việc | Kết quả |
|---|---|---|
| 1 | Toàn bộ api | **142 tệp đạt, 2 bỏ qua; 3615 ca đạt, 19 bỏ qua; 0 lỗi**, khớp số BE báo. Năm bộ text-safety/Chat/form: **375/375** ở `UTC` và `Pacific/Kiritimati` (máy QA là +07) |
| 2 | 215 ca, form và Chat C | Form và Chat cho cùng kết quả ở **215/215** ca. Ca 422 không tạo dòng `staff.chat` nào. Ca 202 có đúng 1 dòng yêu cầu |
| 3 | Hồi quy trên 167 ca lượt 1 | **10 ca đổi kết quả, cả 10 đều đổi đúng hướng (422 → 202).** 70/70 chuỗi CCCD/thẻ (2a/2b/2d) vẫn bị chặn và che. Không ca nào trước được 202 nay bị chặn |
| 4 | BUG-R4-016: 10 chuỗi | **10/10 được 202**, tin C in nguyên |
| 5 | 6 ca G2 ngân sách | **6/6 được 202**, tin C in nguyên |
| 6 | SEC PR24-01/02 và số giấy tờ cạnh số tiền | **13/13 bị chặn và che** |
| 7 | Dò thêm (R2P) | Không lỗi mới. 2 ghi nhận và 1 đề xuất (mục L2.4) |

### L2.1. 10 ca lượt 1 đổi kết quả (422 → 202, tin C in nguyên)

| ID | Chuỗi | Nhóm |
|---|---|---|
| PH-094 | `0084 905 111 222` | BUG-R4-016 |
| MN-129 | `₫150,000,000` | BUG-R4-016 |
| MN-140 | `budget VND 150,000,000` | BUG-R4-016 |
| G2-160 | `Ngân sách 150,000,000` | G2 |
| G2-161 | `ngân sách 150.000.000` | G2, `main` cũng chặn |
| G2-162 | `ngân sách 150 000 000` | G2, `main` cũng chặn |
| G2-163 | `budget 150,000,000 for 6 months` | G2 |
| G2-164 | `ngân sách 100,000,000-150,000,000` | G2 |
| G2-165 | `Ngân sách 1,500,000,000` | G2 / BUG-R4-016 |
| G2-167 | `ngân sách 150,000,000 cho 6 tháng` | G2 |

Còn bị chặn và đã được chấp nhận:
- số phòng: `Căn 201,202,203`, `căn 201 202 203`, `căn 201-202-203`, `căn 201/202/203`, `căn 201,202,203,302`;
- `905 111 222`, `0905111222 0912333444`, `Agoda booking ID 562378912`: giống `main`.

Câu báo lỗi theo PA1 (a) thuộc CPY/FE.

### L2.2. Ca mới

| Nhóm | Chuỗi | Kết quả |
|---|---|---|
| R2G (6) | `Ngân sách 150,000,000`, `budget 150,000,000 for 6 months`, `tổng 120,000,000 cho 8 tháng`, `100,000,000-150,000,000`, `ngân sách 150.000.000`, `VNĐ 150.000.000` | 202, Chat in nguyên |
| R2B (10) | `₫150,000,000`, `₫ 150,000,000`, `VND 150,000,000`, `budget VND 150,000,000`, `USD 150,000,000`, `Ngân sách 1.500.000.000`, `Ngân sách 1,500,000,000`, `ngân sách 1 500 000 000`, `0084 905 111 222`, `00 84 905 111 222` | 202. Chat in nguyên, trừ ghi nhận L2.4 (2) |
| R2S (13) | `CCCD %2B079203012345`, `CCCD 079203012345 đồng ý nhận phòng sớm`, `số 079203012345 dong`, `CCCD 079203012345 - 500k`, `VND 079203012345`, `đ 079203012345`, `CCCD 001 203 012 345`, `008212345678`, `паспорт 45 06 № 123456`, `серия 4506 номер 123456`, `passport M123A4567` | 422 `ID_NUMBER_DETECTED`, Chat che |
| | `CCCD 079-203-012-345 150,000,000`, `079203012345 1.500.000.000` | 422 `CARD_NUMBER_DETECTED` (dãy dài đạt Luhn), Chat che. Vẫn bị chặn, chỉ khác mã lỗi |
| R2P – vẫn qua, đúng ý | `Ngân sách 150.000.000, phòng 201`, `budget 2,400,000,000 VND cho 12 tháng`, `tổng 1.200.000.000 / 12 tháng`, `Đặt cọc 30,000,000, còn lại 120,000,000`, `SĐT 0084905111222`, `0082 10 1234 5678` | 202 |
| R2P – vẫn bị chặn, đúng ý | `Ngân sách 150,000,000 VND, CCCD 079 203 012 345`, `Ngân sách 150.000.000 079.203.012.345`, `CCCD 0084 079 203 012 345` | 422, Chat che |

### L2.3. Hồi quy

- Không ca nào trong 167 ca lượt 1 đổi theo hướng xấu.
- 70 chuỗi phải chặn lượt 1 vẫn bị chặn đúng mã. 2c, SĐT, ngày, giờ, mã đặt vẫn qua.
- Tin C vẫn đủ 11 dòng.
- `logLine` (SEC PR24-04) có test trong bộ api, xanh. QA không kiểm thêm.

### L2.4. Ghi nhận (không mở lỗi mới)

**(1) Che thừa còn lại, cho PO và CPY. Không phải lỗi.**
- `ngân sách 120,500,000` và `ngân sách 150,000,500` vẫn 422, vì `amountSpans` chỉ tha số có **hai** nhóm cuối là `000`. Khách dài hạn ghi tổng lẻ, ví dụ 120,5 triệu không đơn vị, vẫn gặp. Đây là giới hạn có chủ ý (SEC giữ rủi ro ~1/1.000.000). Câu báo lỗi mới theo PA1 (a) hướng dẫn khách ghi kèm đơn vị hoặc chữ "triệu".
- Che thừa mới do luật hộ chiếu Hàn mẫu mới: `Mã voucher T123A4567` → 422. SEC đã ghi và chấp nhận (`A123B4567`, `X100S2000`).
- `0086 138 0013 8000` → 422 `CARD_NUMBER_DETECTED`, giống `main`.

**(2) Hiển thị trong tin C, không phải lỗi.** `Ngân sách 1.500.000.000` hiện thành `Ngân sách 1[.]500[.]000[.]000`, vì bốn nhóm số nối bằng dấu chấm bị bước chống link coi như địa chỉ IPv4. Lễ tân vẫn đọc được, và Desk giữ chữ gốc. Trên `b89dbde4` chuỗi này bị chặn ngay ở form nên chưa thấy. Gợi ý cho BE-D, mức Suggestion, làm khi tiện: không coi là IPv4 khi có nhóm lớn hơn 255.

**(3) Lỗ mới so với `b89dbde4`, nhưng không mới so với `main`. SEC đã đánh giá Thấp và chấp nhận. QA đồng ý mức, kèm đề xuất bịt rẻ.**

So ba bản trên cùng chuỗi:

| Chuỗi | `main` | `b89dbde4` | `f8080499` |
|---|---|---|---|
| `CCCD 079 203 012 345 000 000` (cả `.` và `,`) | qua | chặn | **qua, tin C in nguyên** |
| `CMND 123 456 789 000 000` | qua | chặn | qua |
| `CCCD 00 079203012345`, `CCCD 00 079 203 012 345`, `CCCD 00 123 456 789` | qua | chặn | qua |

Cùng nhánh này, `CMND 201 000 000` (R2P) cũng qua. Đây đúng là ca số giấy tờ tận cùng `000000` SEC đã nhận (~1/1.000.000).

- Nguyên nhân 1: `amountSpans` coi cả dãy là tiền khi hai nhóm cuối là `000`.
- Nguyên nhân 2: `phonePrefixDigits` coi `00` là tiền tố quốc tế dù nhóm sau bắt đầu bằng `0`.
- Cả hai đều cần khách **cố ý** nối thêm `000 000` hoặc `00 ` vào số của chính mình. SEC lượt 2 đã nêu hai dạng này và xếp Thấp, không mở thẻ. QA giữ đúng cách xử lý như ca `(+84) 079 203 012 345` ở lượt 1: **không mở lỗi**.
- Đề xuất cho BE-D và SEC, mức Suggestion, làm cùng phần còn lại của PR24-01. Hai sửa này gần như không làm tăng che thừa, vì số tiền và mã nước không bao giờ bắt đầu bằng `0`, còn CCCD luôn bắt đầu bằng `0`:
  - `amountSpans`: nhóm đầu của số tiền không bắt đầu bằng `0`, và tổng chữ số ≤ 12 (≤ 999 tỷ). Cách này cũng thu hẹp rủi ro 1/1.000.000 SEC đã nhận (`079 203 000 000`) về chỉ còn CMND 9 số.
  - `phonePrefixDigits`: sau `00`, nhóm kế không bắt đầu bằng `0`, và phần số sau `00` dài 10–15 chữ số (E.164).
  - Thêm 6 chuỗi ở bảng trên vào test "phải bắt".

### L2.5. Trạng thái

| Mục | Trạng thái |
|---|---|
| BUG-R4-016 | **Đã sửa – đã xác nhận** trên `f8080499`. Closed khi PR #16 và #24 gộp `main` và CI xanh |
| BUG-R3-058 | Vẫn **Đã sửa – đã xác nhận** (đã kiểm lại trên `f8080499`: 70/70) |
| Gộp PR #24 (phía QA) | **Đạt.** Điều kiện: PR #16 gộp trước, job CI `format · lint · audit · test · build` của `f8080499` xanh. Lúc QA chạy, CI chưa có kết quả (theo SEC) |

**Dòng decision-log đề nghị ORC ghi:**
`| 2026-11-01 | 4 | QA – PR #24 lượt 2 (f8080499): ĐẠT, không hồi quy. BUG-R4-016 Đã sửa – đã xác nhận (Closed khi #16 + #24 gộp main + CI xanh). 215 ca (167 ca lượt 1 + 48 mới) qua form và Chat C: form và Chat không lệch ca nào; 10 ca lượt 1 đổi 422 → 202 (đúng hướng), 0 ca đổi xấu; 70/70 CCCD/thẻ vẫn chặn; 10/10 chuỗi 016 và 6/6 G2 ngân sách qua; 13/13 ca SEC PR24-01/02 bị chặn. api 3615/0 lỗi; 375/375 ở 2 múi giờ. Ghi nhận: CCCD nối "000 000" hoặc "00 " phía trước lọt (như main, SEC xếp Thấp) – đề xuất BE-D bịt rẻ (nhóm đầu không bắt đầu bằng 0). | QA | Quyền QA (kết luận kiểm thử) |`
