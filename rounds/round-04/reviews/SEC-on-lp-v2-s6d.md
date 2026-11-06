# SEC – Kết luận SEC 9.5 ca 3/4/8/10 trên staging (S6d)

Round 4 · bước **Review** · SEC · 06/11/2026 (tối)
Đối tượng: lượt ORC chạy trên staging 06/11 18:18–18:31 (+07), api `sha-6414be25f20d`, và kết luận QA ở `rounds/round-04/qa/lp-v2-staging-s6.md` mục S6d (commit `6664de95`).
Đầu vào SEC đã đọc: biên bản ORC `EVIDENCE.md` và toàn bộ tệp thô cùng thư mục (scratchpad của ORC, không vào repo vì có `estimateToken` và form token); các script `pub.sh`, `poll.sh`, `srvpub.sh`, `submit.sh`, `wave.sh`, `desk.py`, `ca3.py`; mã `public-rate.port.ts`, `public-rate.ts`, `price-estimate.service.ts`, `rooms.service.ts`, `db/schema/rooms.ts`, `ops-check.sh` (`check_pricegap`); test `lp-v2-price-estimate.test.ts:719`, `infra/server/test/ops-check-price.test.sh:85–97`; BUG-R4-056, BUG-R4-057 trong `rounds/round-04/qa/bug-list.md`.
SEC không SSH, không gọi API, không đọc DB. Tệp này không có IP, bí mật hay digest đầy đủ.

## 1. Kết luận

| Ca SEC 9.5 | Kết luận SEC | Ghi chú ngắn |
|---|---|---|
| **3** – chiếm hết căn một hạng, phản hồi không đổi | **ĐẠT** | Thân trùng từng byte sau khi bỏ 3 khóa thời gian/token; payload token chỉ khác `iat`, `exp` |
| **4** – hạng 2 căn khác giá: web chỉ "từ", Desk "từ – đến" | **Web ĐẠT** (phần bảo mật đủ). **Desk "đến": chưa có**, giữ FB-R4-SEC-BE-03 (Minor), đưa vào backlog có điều kiện kích hoạt (mục 4) | Không lộ số "đến" ở thân lẫn token; số "đến" đã lưu ở DB |
| **8** – OWN đổi giá, web theo trong ≤ 60 giây | **ĐẠT** | 2,5 giây khi đổi, 1,1 giây khi hủy; nhờ xóa bộ đệm khi đổi căn, TTL 60 giây chỉ là lưới cuối |
| **10** – căn thiếu giá đêm | **ĐẠT bằng bằng chứng thay thế** – SEC **chấp nhận**, kèm 1 điều kiện v1.0.5 (FB-R4-SEC-OPS-S6D-01) | Nhánh thiếu giá không tới được qua Desk/API; không cần ghi SQL trên staging |

Cùng với S6b.3 và mục 1 của QA: SEC 9.5 còn **0 ca đỏ**, không ca nào chặn vận hành. Ca 9 (công tắc tắt → 404) chỉ có kết quả trên stack thử; SEC giữ nguyên chấp nhận như lượt trước, không đòi chạy trên production.

## 2. SEC tự kiểm lại trên tệp thô

- **Ca 3:** `p10-before.json` (18:29:44) và `p10-after.json` (18:30:50) đều 13 khóa, cùng thứ tự. Bỏ `computedAt`, `estimateToken`, `expiresAt` thì hai thân **giống hệt** (371 byte dạng gọn). Giải mã phần giữa của hai token: 15 trường, khác đúng 2 trường `iat`, `exp`; `pv` (priceVersion) và `tot` = 8.890.000 không đổi. Hai lượt cách nhau 66 giây, `computedAt` mới, nên lượt sau là tính lại thật, không phải bản đệm.
- **Ca 4:** `est-ca4.json` = 1.950.000, `shortStay` 8 khóa; token có `tot` = 1.950.000, không có trường số "đến". `body-ca4.json` gửi đúng token đó, `sub-ca4.json` = `C3QACMYB`. Quét các tệp `p13-*`, `est-*`, `w/*`: 0 lần xuất hiện `toTotal`, `maxTotal`, `roomId`, `lines`, `priceGap`, tên căn.
- **Ca 8:** 12 tệp trước khi đổi đều 2.100.000, `computedAt` đứng theo bậc 60 giây (18:18:40 → 18:19:41 → 18:20:46 → 18:21:50) – đúng TTL. `p13-a650-1.json` 18:22:28 = 1.950.000 khi bản đệm 18:21:50 mới 38 giây tuổi → số mới đến từ xóa bộ đệm khi đổi căn. `p13-a700-1.json` 18:25:31 = 2.100.000 sau khi hủy dòng hẹn. `pv` đổi `6729728e…` → `67b128e0…` rồi về lại `6729728e…`.
- **Ca 10:** `w/m1-*.json`: 14 × 200 (13 có số, 700.000/đêm; 14/11 1 đêm `min_stay`), 11 × 429 `RATE_LIMITED`. Không lượt nào có dấu hiệu `QAT1`.
- **Cách ORC chạy:** mật khẩu xem trước đi qua `curl --config -` (stdin) và `printf` dựng sẵn, không nằm trên dòng lệnh, không in ra. Dữ liệu thử dùng `@example.test`, yêu cầu thử đã từ chối, giữ chỗ đã hủy, giá và nhãn đã trả về như trước. SEC không có nhận xét.

## 3. Ca 3 – giữ chỗ không lộ qua web

ĐẠT theo đúng SR-PE-04. Ngoài thân phản hồi, SEC kiểm thêm **token** (cũng là dữ liệu công khai): `pv` là băm của tham số giá, giá niêm yết các căn trong hạng và cờ OOO (`public-rate.port.ts:135–149`), không có gì từ đơn đặt hay giữ chỗ, nên token cũng không đổi theo giữ chỗ. Đêm đã bán (Sage, S6b.3) đã được thử trước đó. OOO vẫn lộ theo thiết kế (PE-RR2, đã chấp nhận): sổ tay vẫn phải giữ câu "không dùng OOO để giữ căn".

## 4. Ca 4 – web chỉ "từ"

- **Web: ĐẠT.** SR-PE-05 đạt cả ở thân lẫn token. SR-PE-06 đạt: số `seen` lấy từ token ký, server tính lại trong giao dịch nhận, DB lưu `atSubmit.fromTotalVnd` 1.950.000 / `toTotalVnd` 2.100.000 (theo ORC, SQL READ ONLY), `suspiciousFlags` rỗng vì token hợp lệ.
- **Desk "đến": chưa có.** Đúng thẻ FB-R4-SEC-BE-03 (Minor, BE Deferred v1.0.x). SEC giữ mức **Minor** và đồng ý **không** đưa vào v1.0.5, vì hiện mọi hạng trên production có các căn cùng giá (City 800.000 cả Amber và Mist; Premium 1.100.000 cả Ivory và Ember – bảng S6c.2), nên số "đến" luôn bằng số "từ". **Điều kiện kích hoạt:** trước khi OWN đặt hai căn cùng hạng khác giá trên production, ARC + FE-A làm xong thẻ này (trường chỉ đọc `atSubmit.fromTotalVnd`, `toTotalVnd`, `priceChangedSinceSeen` trong `PublicPriceEstimateRecord`, hiện ở S35). Trong lúc chờ, sổ tay lễ tân dặn: số trên yêu cầu web là "giá thấp nhất của hạng lúc khách gửi", báo giá thật luôn làm trên Desk theo từng căn. PO ghi điều kiện này vào backlog.

## 5. Ca 8 – đổi giá thì web theo

ĐẠT. SR-PE-09 đạt cả hai nhánh: vô hiệu khi đổi (`platform.controller.ts:261–265`, `288–291`) và TTL ≤ 60 giây. Thân sau khi đổi không có tên căn, `roomId` hay số "đến". Ghi nhận: `pv` là hàm thuần của đầu vào nên người ngoài thấy được "có thay đổi" (không thấy giá trị); mức này đã nằm trong PE-RR1/PE-RR2, không mở thẻ.

## 6. Ca 10 – căn thiếu giá đêm

### 6.1 Sửa biên bản ORC
Biên bản ghi "server chép giá đêm 750.000 sang dòng mới" là **sai cơ chế**: khi `PATCH` không gửi `nightlyListPriceVnd`, server tính giá đêm = giá tháng ÷ `night_from_month_divisor` (12), làm tròn 1.000 (`rooms.service.ts:593–596`, `nightlyFromMonthly` 383–387; BR-101 (5)). `QAT1` có giá tháng 9.000.000 nên ra 750.000, trùng giá cũ. Kết luận về ca 10 **không đổi**: đường này luôn ghi một giá đêm > 0, nên vẫn không tạo được khe.

### 6.2 Vì sao không tới được nhánh thiếu giá qua Desk/API
SEC đọc mã và đồng ý với S6d.2 của QA:
- DB: `nightly_list_price_vnd` `NOT NULL` + `CHECK > 0` (`db/schema/rooms.ts:129, 143`); API `money` ≥ 1. "Giá 0" không tồn tại.
- `create` ghi dòng giá đầu đúng ngày `activeFrom`; `RoomPatchInput` không có `activeFrom`; hủy dòng đầu → 409 `first_price`, hủy dòng duy nhất → 409 `only_price`, dòng đã hiệu lực → 409 `effective`.
- `rooms()` chỉ lấy căn `is_sellable`, `active_from <= arrival` (`public-rate.port.ts:92–93`), nên căn chưa hoạt động như `QAT1` (từ 01/12) không bao giờ vào phép tính 10–13/11.
- Khe giá chỉ đến từ dữ liệu không qua Desk/API: `production-bootstrap` tạo căn có nhãn mà chưa có giá, hoặc SQL tay/migration.

### 6.3 Quyết định về bằng chứng thay thế: **CHẤP NHẬN**
Ca 10 cần chứng minh hai điều: (1) web vẫn ra số của căn còn lại, không ra số sai; (2) người ngoài không tạo được hàng loạt cảnh báo (T9). Bằng chứng:
1. `lp-v2-price-estimate.test.ts:719` chạy với Postgres thật: căn thiếu giá bị bỏ, web ra 3 × 667.000 của căn kia, 3 lượt (mỗi lượt xóa bộ đệm) chỉ sinh **1** dòng `public_price_missing`. Khóa khử trùng `property|room|ngày` (`price-estimate.service.ts:377–389`) không phụ thuộc số lượt gọi. `!(nightlyVnd > 0)` cũng được coi là khe (`public-rate.ts:139`), nên nhánh "giá 0" nếu có (dữ liệu ngoài Desk) đi cùng đường.
2. `ops-check-price.test.sh:85–97`: 2 căn thiếu → `FAIL pricegap: 2 room(s)…`, rc=1, không lộ room/property id ở output, webhook, tệp trạng thái; không có dòng → ok.
3. `ops-check.sh pricegap` chạy thật trên cả hai máy (theo ORC): `ok`. Lệnh đọc được log container thật, không báo nhầm.
4. Commit đang chạy `6414be25` có đúng test và mã trên; không có thay đổi nào ở `services/api/src` sau commit đó (SEC đối chiếu git).

Phần còn hở (QA nêu đúng): chưa lần nào thấy trọn chuỗi "api ghi dòng → ops-check đọc → FAIL → webhook" trên máy thật, và `pricegap` dựa vào log nên production `ok` chỉ nghĩa là "24 giờ qua không lượt gọi nào chạm khe". SEC đóng chỗ hở bằng **kiểm tĩnh** (mục 6.4), không bằng cách ép khe trên staging.

**Ghi SQL trên staging: không cần.** Lý do: chuỗi so khớp là chuỗi cố định đã có test hai đầu; kiểm tĩnh trả lời thẳng câu "có khe hay không" mà không cần ai gọi trúng ngày; ép khe trên staging phải sửa `room`/`room_list_price` bằng SQL (đúng loại dữ liệu ngoài Desk mà ta đang muốn tránh) và phải hoàn tác tay. Bước dựng stack cục bộ bằng bootstrap mà QA gợi ý (khoảng 20 phút, không ghi gì vào staging) là **tùy chọn**, không là điều kiện.

### 6.4 Cách thử khác – kiểm tĩnh SQL READ ONLY
Câu hỏi cần trả lời: có căn nào đang bán, có nhãn, sẽ hoạt động trong 365 ngày tới (cửa sổ ngày đến của web, BR-112), mà **không** có dòng giá nào hiệu lực từ ngày đầu nó có thể được bán tính từ hôm nay? Vì giá chỉ ghi thêm và dòng sau thay dòng trước theo ngày, có một dòng `effective_from <= greatest(active_from, hôm nay)` là đủ cho mọi đêm về sau.

Ý tưởng truy vấn (OPS viết bản chạy được trong `psql_ro`, chỉ trả **một số đếm**, không trả id):
- lọc `room`: `is_sellable`, `public_room_type IS NOT NULL`, `active_from <= hôm nay + 365`, `active_to IS NULL OR active_to >= hôm nay`;
- đếm các căn mà `NOT EXISTS (room_list_price p WHERE p.room_id = room.id AND p.effective_from <= greatest(room.active_from, hôm nay))`;
- kết quả phải là **0**.

Bản QA gợi ý (`active_from <= hôm nay`) bỏ sót căn **sắp** hoạt động mà chưa có giá, ví dụ căn bootstrap từ 01/12 chưa nhập giá: web vẫn nhận ngày đến tới +365 nên căn đó sẽ chạm khe. Vì vậy SEC lấy cửa sổ 365 ngày.

- **Ngay khi tiện (không chặn):** ORC chạy truy vấn này một lần bằng `SQLRO` trên production và staging, ghi kết quả (chỉ số đếm) vào S6d hoặc biên bản vận hành. Không cần INV.
- **v1.0.5:** đưa vào `ops-check pricegap` thành hai phần: phần log như hiện có và phần tĩnh; FAIL nếu một trong hai > 0, tin chỉ nêu số căn (FB-R4-SEC-OPS-S6D-01).

### 6.5 Số tin cảnh báo cho một khe
`notify` gửi 1 tin khi sang FAIL rồi nhắc mỗi 6 giờ (`REMIND_SECONDS` 21600), cửa sổ log 24 giờ → khoảng 4 tin FAIL + 1 tin hết lỗi cho một khe. SEC **chấp nhận**: số tin không phụ thuộc số lượt khách gọi, đúng mục đích SR-PE-12/T9 (lệch "log thay thông báo OWN" đã chấp nhận ở `SEC-on-LP-v2-code.md`, dòng SR-PE-12). Khi thêm phần tĩnh, khe tồn tại tới khi OWN nhập giá thì tin nhắc tiếp mỗi 6 giờ – đó là hành vi mong muốn. Staging không có webhook nên chỉ có journal, đúng thiết kế.

## 7. Ba điểm ORC chuyển từ QA

1. **Sửa biên bản ORC (÷12):** đã ghi ở mục 6.1. Không đổi kết luận.
2. **BUG-R4-056 (P3, tài liệu thử):** SEC đồng ý và đã làm phần của SEC:
   - Sửa câu ca 10 trong `rounds/round-04/outputs/SEC/lp-v2-privacy-and-api.md` mục 9.5 thành "một căn đang bán, có nhãn hạng, thiếu giá đêm cho ít nhất một đêm (chỉ có từ dữ liệu ngoài Desk/API)", kèm cách kiểm thay thế và trỏ về tệp này.
   - Dòng ghi nhận: **SEC chấp nhận bằng chứng thay thế cho SEC 9.5 ca 10 (test tích hợp `:719`, test `ops-check-price` ca 5–6, `pricegap` chạy thật ok trên hai máy), kèm điều kiện kiểm tĩnh SQL READ ONLY ở v1.0.5.**
   - Phần SEC của BUG-R4-056 xong; QA đóng lỗi khi đọc tệp này.
3. **BUG-R4-057 (P3, BE + ARC + DOM) – có liên quan bảo mật không: KHÔNG.** Lý do:
   - Không vượt quyền: chỉ người đã có quyền đặt giá (OWN/MGR qua API, script ORC/OPS, công cụ nhập danh mục) mới đi đường này. Tham số `night_from_month_divisor` cũng chỉ OWN/MGR đổi được và có `audit_event`.
   - Không lộ dữ liệu, không ảnh hưởng web công khai ngoài việc web hiện đúng giá đã lưu (sai do người gọi API, không do khách).
   - Mọi lần đổi giá đều ghi `audit_event` `config` có giá đêm trước/sau, nên vẫn truy được.
   - Đây là lỗi **đúng-sai số tiền** ở đường API ít dùng (Desk không đi đường này), thuộc ARC/BE/DOM. SEC chỉ yêu cầu khi gỡ đường tạm: giữ `money ≥ 1` và `CHECK > 0`; thiếu giá đêm → 422 chứ không 500. Trong lúc chờ, ORC/OPS gửi đủ hai giá và đọc lại sau khi ghi (QA đề xuất 3) – SEC đồng ý.
   - Nếu gỡ đường tạm thì `production-bootstrap`/nhập danh mục phải nhận giá đêm hoặc tạo căn chưa có giá; trường hợp sau chính là nguồn khe giá ở mục 6.2, nên kiểm tĩnh 6.4 càng cần.

## 8. Thẻ feedback

### FB-R4-SEC-OPS-S6D-01
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/ops-check.sh` `check_pricegap` (dòng 666–679); README `infra/server` dòng 120
- Vấn đề: `pricegap` chỉ đếm dòng `public_price_missing` trong log 24 giờ. Khe giá chỉ hiện khi có khách gọi đúng hạng, đúng ngày chạm khe; production `ok` không chứng minh "không có khe". Log cũng mất khi container dựng lại (OR-M3). Câu README "nhất là sau khi nhập lại bảng giá 01/11" chỉ sai nguồn: nhập giá trên Desk không tạo được khe.
- Vì sao quan trọng: khe giá đến đúng từ dữ liệu ngoài Desk (bootstrap tạo căn chưa có giá, SQL tay). Căn bị bỏ khỏi giá web mà không ai biết; với hạng 2 căn, web có thể hiện giá của căn đắt hơn.
- Đề xuất sửa: thêm phần tĩnh theo mục 6.4 (READ ONLY qua `psql_ro`, chỉ số đếm, cửa sổ 365 ngày); FAIL khi phần log **hoặc** phần tĩnh > 0; tin chỉ nêu số căn. Test: thêm 2 ca vào `ops-check-price.test.sh` (đếm tĩnh 1 → FAIL không lộ id; 0 → ok). README dòng 120 sửa theo gợi ý QA ("thường do dữ liệu khởi tạo hoặc sửa thẳng DB: OWN nhập giá cho căn đó trên Desk, OPS tìm nguồn").
- Trạng thái: Open

### FB-R4-SEC-BE-03 (giữ, cập nhật)
- Mức độ: Minor (không đổi)
- Trạng thái: Deferred → backlog có điều kiện kích hoạt ở mục 4 (trước khi hai căn cùng hạng khác giá trên production).

## 9. Việc SEC đưa ra từ tệp này

| Việc | Vai | Mức | Đợt |
|---|---|---|---|
| `pricegap` thêm kiểm tĩnh SQL READ ONLY (FB-R4-SEC-OPS-S6D-01) | OPS | Minor | v1.0.5 |
| Chạy truy vấn tĩnh một lần trên production + staging, ghi số đếm | ORC (`SQLRO`) | Minor | Khi tiện, không chặn |
| BUG-R4-057 gỡ đường tạm ÷12 – **không phải lỗi bảo mật**; SEC chỉ đặt 2 ràng buộc ở mục 7.3 | ARC + BE + DOM | P3 (QA) | v1.0.x, theo PO |
| FB-R4-SEC-BE-03 Desk "từ – đến" | ARC + FE-A | Minor | Backlog, kích hoạt theo mục 4 |
| Sổ tay lễ tân: số trên yêu cầu web = giá thấp nhất của hạng lúc khách gửi; báo giá thật làm trên Desk từng căn | BA/DOM | Suggestion | Lần sửa sổ tay tới |

## 10. Dòng decision-log đề xuất (ORC chép, SEC là người quyết)

`| 2026-11-06 | 4 | SEC – SEC 9.5 ca 3/4/8/10 trên staging (ORC chạy 18:18–18:31, sha-6414be25f20d; rounds/round-04/reviews/SEC-on-lp-v2-s6d.md): ca 3 ĐẠT (thân + token không đổi khi giữ cả hai căn Signature), ca 8 ĐẠT (2,5 s / 1,1 s nhờ xóa bộ đệm), ca 4 web ĐẠT – Desk "từ – đến" giữ FB-R4-SEC-BE-03 Minor, backlog, làm trước khi hai căn cùng hạng khác giá; ca 10 ĐẠT bằng bằng chứng thay thế (test tích hợp :719, test ops-check-price, pricegap thật ok hai máy) – nhánh thiếu giá không tới được qua Desk/API, không ghi SQL staging; điều kiện v1.0.5: pricegap thêm kiểm tĩnh READ ONLY (cửa sổ 365 ngày, chỉ số đếm). Câu ca 10 ở 9.5 sửa theo BUG-R4-056. BUG-R4-057 không phải lỗi bảo mật | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |`

## 11. Điểm làm tốt

- ORC kiểm cả token chứ không chỉ thân, và tự hoàn tác đủ (giá, nhãn, giữ chỗ, yêu cầu thử) – staging sạch sau 13 phút.
- QA không tự thay ca của SEC, chỉ ra giả định sai trong kịch bản của chính mình (BUG-R4-056) và tìm ra cơ chế ÷12 thay cho "chép giá".
- Bằng chứng ca 8 tách được hai cơ chế (xóa bộ đệm và TTL) nhờ ghi `computedAt` ở từng lượt.
