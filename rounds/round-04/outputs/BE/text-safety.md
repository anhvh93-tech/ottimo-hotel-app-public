# BE-D – Round 4, Sản xuất (v1.0.1 đợt 2): làm sạch chữ – một luật số giấy tờ/thẻ cho form và tin Chat

- Nhánh: `be-d/v1.0.1-text-safety`, cắt từ `origin/be/gchat-booking-notify` @ `98ff43bb` (PR #16 chưa gộp `main` lúc bắt đầu). PR vào `main`, **phụ thuộc PR #16**.
- Thẻ xử lý: SEC FB-R3-SEC-BE-GCHAT-07 (bước 1–4), BUG-R3-058, QA FB-R3-QA-BE-GCHAT-06 (a)(b)(c) + ca `(+84) 905-111-222`, SEC `lp-v2-privacy-and-api.md` mục 10, và việc nhỏ ORC/OPS: khóa `level` trong log `chat detail level`.

## 1. Đã làm gì

**Một hàm duy nhất** `sensitiveNumberKind(text) → 'card' | 'id' | null` (tệp mới `services/api/src/modules/public-site/internal/sensitive-number.ts`):
- Form (`guestName`, `note`), lời nhắn từ chối (`declineNote`) và `chatSafeText` đều gọi hàm này. `looksLikeSensitiveNumber`, `looksLikeCard`, `looksLikeIdNumber` chỉ là hai nửa của cùng bộ phân tích. Không còn luật thứ hai trong `chat-message.ts`. Test khóa: Chat xuất lại đúng hàm của form.
- Luật chạy trên **bản dùng để kiểm** (không in, không lưu, không ghi log). Chữ khách gõ vẫn lưu như cũ.

Bản dùng để kiểm:
1. Giải mã `%XX` (QA 06 c).
2. NFKD, bỏ `\p{M}` và mọi `Default_Ignorable_Code_Point` (ZWSP, WJ, gạch mềm, U+034F, VS1–16, U+3164, keycap…), NFKC, bỏ ký tự điều khiển, chữ số `\p{Nd}` về ASCII, U+2800 thành dấu cách (SEC bước 1, QA 06 a, b).
3. Gạch Unicode (`\p{Pd}`, U+2212) thành `-`, chấm giữa thành `·`, nháy cong thành `'`, `。` `、` thành `.` `,`; `(+84)` và `+84 (0)` thành `+84` (SEC bước 2).
4. Che ngày, giờ như trước.

Nối nhóm số thành một dãy:
- dấu nối được nhận: một ` ` `.` `-` `_` `/` `,` `'` `·`; nhiều dấu cách/xuống dòng; gạch có dấu cách hai bên; chuỗi từ hai dấu trở lên (`__`, `_/`);
- **dấu phẩy hoặc chấm kèm dấu cách thì cắt dãy**, nên `0905 111 222, 0905 333 444` vẫn là hai SĐT.

Luật trong một dãy:
- **Giấy tờ:** các nhóm liền nhau cộng đúng 9 hoặc 12 chữ số (SEC bước 3, bắt `CCCD 079203012345 2 người`). Thêm số đăng ký cư trú Hàn `YYMMDD-NNNNNNN`, căn cước Trung Quốc 18 ký tự có ngày sinh (cuối có thể là `X`), hộ chiếu nội địa Nga `NN NN NNNNNN` / `NNNN NNNNNN` (SEC mục 10).
- **Không phải giấy tờ:**
  - phần SĐT sau `+` hoặc bắt đầu bằng `84` (≥ 11 chữ số đầu): `(+84) 905-111-222` nay **qua form**;
  - số tiền có đơn vị, mỗi vế của một khoảng `100 000 000 - 150 000 000 đ`.
  - Sửa luôn lỗi cũ: `đ`/`tr`/`k` chỉ là đơn vị khi đứng riêng, nên `079203012345 đến ngày…` không còn lọt.
- **Thẻ:** luật Luhn cũ trên đoạn nối bằng một ` ` `.` `-` (giữ nguyên), cộng các nhóm nguyên vẹn 13–19 chữ số đạt Luhn khi nhóm trông như thẻ (mọi nhóm ≥ 4 hoặc mọi nhóm ≤ 2 chữ số). Hai SĐT trên hai dòng không bị coi là thẻ.
- **Hộ chiếu:** nhận chữ thường (`c1234567`), một dấu cách sau chữ hoa (`C 1234567`) hoặc sau từ khóa (`hộ chiếu c 1234567`, `паспорт 4506123456`) (SEC bước 4).

`chatSafeText` (SEC mục 10):
- `＜` `＞` `﹤` `﹥` thành `‹` `›`;
- `：／／` thành `[:]//`;
- `。` `．` `｡`, tên miền chữ Kirin, `xn--`, tên miền chữ Hàn/Hán đã bị vô hiệu từ trước, nay có test khóa.

Log worker (ORC/OPS):
- `chat detail level` ghi `detailLevel` thay cho `level`;
- `src/shared/log-line.ts` ghi `level`/`msg` sau cùng, nên không trường extra nào đè được nữa. Chỉ có một chỗ cùng kiểu.

## 2. File tạo/sửa
- Mới: `product/services/api/src/modules/public-site/internal/sensitive-number.ts`, `product/services/api/src/shared/log-line.ts`, `product/services/api/test/text-safety-units.test.ts`
- Sửa: `website-request-rules.ts` (bỏ luật cũ, xuất lại từ tệp mới), `public-booking.service.ts`, `website-requests.service.ts`, `public/chat-message.ts`, `worker.ts`, `worker-chat.ts`; test `gchat-units.test.ts`, `integration/gchat-worker-only.test.ts`, `integration/public-site-r3-bed.test.ts`.
- Không migration, không đổi hợp đồng API: mã lỗi 422 giữ nguyên `CARD_NUMBER_DETECTED` / `ID_NUMBER_DETECTED`.

## 3. Test
- `text-safety-units.test.ts`: 153 ca.
  - Bảng SEC GCHAT-07: 18 ca. QA FB-06 bảng 2d: 20 ca. BUG-R3-058: 25 ca, cộng ca kiểm mã card/id.
  - SEC mục 10: 15 số giấy tờ Hàn/Trung/Nga và hộ chiếu, sinh trong test. Thêm 8 ca tên miền và 3 ca dấu ngoặc nhọn.
  - **57 chuỗi không được che nhầm**, chạy cả ở form lẫn Chat: SĐT VN và quốc tế, `(+84)`, SĐT Hàn/Trung/Nga, hotline 1900, ngày, giờ, khoảng ngày, số tiền và khoảng tiền, phòng, mã đặt Agoda 10 số, mã yêu cầu, chữ Hàn/Trung/Nga.
  - Có ca khóa phần che thừa SEC đã chấp nhận, và ca chi phí: 500 ký tự < 500 ms.
- Tích hợp form (DB thật): 8 chuỗi bị 422 đúng trường và mã, không lưu dòng nào. `(+84) 905-111-222`, `0905111222 2 người`, khoảng tiền đều được 202.
- Toàn bộ api trên Postgres 17 tạm riêng (cổng 55471, đã dừng và xóa):
  - Lượt 1: **142 tệp đạt, 3541 ca đạt, 0 lỗi**.
  - Lượt cuối, sau khi sửa log: **3541 đạt / 1 lỗi** ở `architecture.test.ts > accept ottimo_app` (`dev_clock` còn dòng do tệp khác chạy song song). Chạy lại tệp đó cùng các bộ Chat: 289/289 đạt. Lượt 1 và 2 không lỗi này. Lượt 2 lỗi bootstrap chỉ vì DB bootstrap đã dùng ở lượt 1.
- `eslint .`: 0 lỗi (3 cảnh báo có sẵn ở `mockServiceWorker.js`). `prettier --check .`: đạt. `turbo run typecheck`: 13/13 đạt.

## 4. Giả định
- G1: chữ lưu vào DB và hiện trên Desk **không đổi**. Chỉ bản dùng để kiểm được chuẩn hóa. Đề xuất cũ của QA "`normalizeFreeText` bỏ mọi Cf" không làm, vì không cần cho 422 và tránh đổi dữ liệu lưu.
- G2: che thừa SEC đã chấp nhận ở lượt 3 nay áp dụng cho **cả form** (một luật): `0905111222 0912333444` (hai SĐT cách một dấu cách, có từ trước), `201,202,203`, `150,000,000` không đơn vị. Khách nhận 422 và phải sửa lời nhắn.
- G3: ID cạnh tiền bị đọc là tiền chỉ khi ngay sau nó có gạch và đơn vị (`079203012345 - 100 000 đ`). Coi là rủi ro thấp.
- G4: kiểm tra phía trình duyệt của landing (`booking-logic.ts looksLikeCard`) không đổi. Máy chủ là nơi quyết định.

## 5. Việc SEC/QA cần kiểm
- SEC: đọc `sensitive-number.ts` (thứ tự chuẩn hóa, luật nối, ngoại lệ `+`/`84`/tiền, hộ chiếu); xác nhận GCHAT-07 bước 1–4 và mục 10 cho điều kiện ★5 trước khi đặt C. Chạy lại 50 chuỗi biên lượt 3.
- QA: chạy lại bảng 2b/2c/2d lượt 2 trên cả form và Chat; xác nhận BUG-R3-058 và `(+84) 905-111-222` qua form; đánh giá G2 (form nay từ chối thêm vài dạng che thừa).
- OPS: dòng log khởi động nay là `{"level":"info","msg":"chat detail level","detailLevel":"A"}` – bộ lọc/README dùng `detailLevel`.

## 6. Dòng decision-log đề xuất (BE tự quyết – chi tiết cài đặt)
`| 2026-11-01 | 4 | BE-D – V-09 một luật: sensitiveNumberKind (sensitive-number.ts) dùng cho form, lời nhắn từ chối và chatSafeText; kiểm trên bản chuẩn hóa (giải mã %XX, NFKD bỏ dấu/ký tự bỏ qua, NFKC, chữ số ASCII, gạch Unicode); nhóm số liền nhau 9/12 chữ số; số Hàn/Trung/Nga; hộ chiếu chữ thường; ngoại lệ SĐT sau + hoặc 84 và tiền có đơn vị; chữ lưu không đổi. Log worker: detailLevel. | BE-D | Quyền BE (cài đặt phía server theo chuẩn ARC) |`

## 7. Lượt 2 – Phản hồi & sửa (QA BUG-R4-016, SEC PR24-01/02/04)

| Thẻ | Đã sửa |
|---|---|
| BUG-R4-016 | `MONEY_BEFORE` nhận thêm `₫`, `đ`, `VND`/`VNĐ`/`USD`/`EUR` (đứng riêng, có thể có dấu cách sau). Tiền tố `00` + mã nước được tính như `+` (`00 84 …`, `0084 …`). Riêng `0084`, chọn vì CCCD tỉnh 008 có thể bắt đầu `0082`/`0086`, còn `0084` thì không. Dãy tách nhóm nghìn (một dấu `.` `,` hoặc dấu cách) có hai nhóm cuối `000` là tiền, kể cả hai vế của một khoảng `100,000,000-150,000,000`. 10 chuỗi QA cùng 6 chuỗi G2 đã vào nhóm "không che nhầm". |
| SEC PR24-02 | (1) Mọi luật chạy trên cả bản đã giải mã `%XX` lẫn bản giữ nguyên, rồi lấy OR: `%2B079203012345` bị bắt lại. (2) Đơn vị tiền chỉ tha cho số tận cùng `000`. `đồng ý` và `dong` trần không còn là đơn vị. `ID - 500k` (G3) bị bắt. |
| SEC PR24-01 | `№` (NFKC thành `No`), `номер`, `N°` giữa hai chữ số được đọc như dấu cách. Thêm từ khóa `серия`. Thêm hộ chiếu Hàn mẫu mới `[A-Z]\d{3}[A-Z]\d{4}`, và bản không phân biệt hoa/thường sau từ khóa. |
| SEC PR24-04 | `logLine` bỏ khóa `toJSON` trước khi ghép, có test. |
| SEC PR24-03 | Phần BE: ghi `86 138 0013 8000` và `8 912 345 67 89` vào danh sách che thừa đã chấp nhận (test). Câu báo lỗi thuộc CPY/UXD. |

Test:
- `text-safety-units` 225 ca (thêm 57 chuỗi không che nhầm từ QA 3e/G2/BUG-R4-016, 6 ca PR24-02, 8 ca PR24-01, ca CCCD tỉnh 001/008 không bị coi là tiền tố `00`).
- Tích hợp form: 10 chuỗi bị 422, 6 chuỗi được 202.
- Toàn bộ api trên Postgres tạm: **142 tệp đạt, 3615 ca đạt, 0 lỗi**.
- `eslint .`: 0 lỗi. `prettier --check`: đạt. `turbo run typecheck`: 13/13.

Không chạy lại được nguyên bộ chạy tạm của QA (167 ca) và của SEC (63 + 61 chuỗi): các bộ này ở scratchpad của QA/SEC, không có trong repo. BE đã đưa vào test mọi chuỗi được ghi trong `qa/pr24-text-safety.md` và `SEC-on-PR24-text-safety.md`. Đề nghị QA và SEC chạy lại bộ của mình trên commit mới.
