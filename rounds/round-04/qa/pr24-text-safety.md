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
