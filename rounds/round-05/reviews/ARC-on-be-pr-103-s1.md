# ARC review PR #103 – BE-S PR-S1: cổng `x-write-roles`, V5-14 giá gõ trong báo giá, V5-22 `min`/`max`

- Round 5 (v1.0.5), bước **Review**. Người review: ARC. Ngày 07/11/2026.
- PR: #103 `r5-s1` @ `7c6908f0` (gốc `ab1fc4ae`), làn BE-S. 4 commit: `fd986f48` (guard), `33c664bb` (V5-14), `a94524fd` (V5-22), `7c6908f0` (gộp `main`). Không đổi trong lúc review.
- Đối chiếu với `main`:
  - `rounds/round-05/outputs/ARC/contract-0.3.13.md` mục 1.3, 1.9, 1.16, 1.17 và 1.24 ý BE 12;
  - `openapi.yaml`: changelog bổ sung 1 (a), (b), (h); bảng trường mở rộng (dòng 230); `calculateQuote`, `saveQuote`, `QuoteInput.nightlyRates`, `Problem.min`/`max`/`dates`;
  - `product/tests/fixtures/rbac-cases.json` `fieldCases` (21 ca); `rbac-matrix.md` ghi chú 46b;
  - `business-rules.md` BR-101, 105, 107, 111, 417, 429; `outputs/DOM/rules-v1.0.5.md`.
- Mã đã đọc ngoài diff: `pricing.service.ts` (`load`, `price`, `snapshot`), `pricing.ts` (`applyNightDiscount`, `discountedNight`, `rateBounds`), `unit-of-work.ts` (`claimKey`, hoãn quyết định vai), `quotes.service.ts` (`save`, `createHold`), `reservations.module.ts` (`@Global`, xuất `PricingService`), các chỗ khác trả `RATE_OUT_OF_RANGE` (check-in, checkout, folio, `stay-night-pricing.ts`).
- Kiểm:
  - `git merge-tree` PR với `main` @ `ad8a7c61`: sạch. Bổ sung 1e (#104) không đổi nghĩa mục 1.3, 1.9, 1.16, 1.17.
  - Trong lúc review, `main` lên `18bdd279` (gộp #96 V5-25 và #100 V5-40). Chạy lại `git merge-tree` với `18bdd279`:
    - **một xung đột** ở `quote-pricing.ts` dòng import: `main` thêm `readMinStay`, PR thêm `rateOutOfRange`;
    - `auth.guard.ts`, `pricing.service.ts`, `reservations.service.ts`, `stay.service.ts` tự gộp sạch;
    - bản gộp không còn dùng `MinStayRule`; `deniedWriteFields` vẫn đứng sau bước kiểm 2FA của V5-40;
    - `engine.load` của báo giá có giá gõ nay đọc `min_stay` qua `readMinStay` (V5-25) – đúng ý DOM 12.3, không cần sửa thêm.
  - Log CI run `42251248559`, job API: 175 tệp / 4224 ca qua trên PostgreSQL 17. Trong đó có `v5-14-quote-typed-rates` (11 ca), `write-roles-gate` (10 ca), `write-roles-units` (34 ca), `v5-22-rate-bounds` (3 ca).
  - Không chạy lại ở máy. CI đã chạy đủ test tích hợp có DB.
- Số dòng trong tệp này theo `7c6908f0`.

## 0. Kết luận

**ĐẠT – ARC approve mã @ `7c6908f0`.** Không Blocker, không Major.

- Gộp được khi:
  - QA (vai review bắt buộc thứ hai) review xong và SEC (BE đã nhờ) không mở thẻ chặn;
  - **BE gộp `main` @ `18bdd279` vào `r5-s1`** (không rebase), giữ **cả hai** import ở `quote-pricing.ts`, CI xanh lại trên HEAD mới. Đây là thao tác, không phải thẻ. Nếu commit gộp chỉ gỡ xung đột import này thì ARC không cần review lại.
- ARC không approve trên GitHub; ORC gộp.
- Thẻ: 3 Minor, 2 Suggestion.
  - **01** (test oracle và builder) làm **trước tag v1.0.5**. Được làm PR test riêng, không chặn gộp #103.
  - **02** (một đường tính giá) và **03** (B13 `dates[]`) sang v1.0.6. 03 làm sớm hơn nếu BE còn chỗ trước 08/11.
- Đúng luật PR: không sửa `openapi.yaml`, không sửa tệp sinh, không migration.
- Không lộ dữ liệu:
  - 403 của cổng trường không có trường mở rộng;
  - audit chỉ ghi tên trường lấy từ hợp đồng, không ghi giá trị;
  - test dùng dữ liệu giả.

| Mục hợp đồng | Kết quả | Ghi chú |
|---|---|---|
| 1.16 `x-write-roles` | Đúng | Thứ tự, "đã gửi", hợp vai, 403 không trường mở rộng, audit, `fieldCases`, H-05…H-07, H-09 |
| 1.3 + 1.17 V5-14 | Đúng | Kênh `direct`/`agent`, phủ mọi đêm, giá gõ = giá lịch, sàn–trần qua `PricingService.price`, `edited` ≠ `true` lấy giá máy chủ, hold `manual`/`manual_agreed`, 422 `NOT_ALLOWED` ở `createHoldFromQuote` |
| 1.9 + 1.24 BE 12 V5-22 | Đúng, lệch nhỏ ở B13 | `dates[]` + `min`/`max` ở `createReservation` (chặn và `_WARNING`), báo giá, B13. B13 chỉ trả đêm vượt biên đầu tiên (thẻ 03) |

---

## 1. Đối chiếu hợp đồng

### 1.1 Mục 1.16 – `x-write-roles`: đúng

- **Thứ tự** (`auth.guard.ts` 345–371). Hợp đồng ghi: tra `Idempotency-Key` → `x-roles` → `x-write-roles` → thân lệnh.
  - Guard tính `deniedFields` chỉ khi `x-roles` cho qua, gộp vào `allowed`, rồi dùng đúng đường quyết định vai có sẵn:
    - không có khóa idempotency, hoặc `dryRun` → `enforce` ngay;
    - có khóa đã `completed` cùng method + path → hoãn sang UnitOfWork để replay (ADR-009).
  - ARC đọc chữ "tra" trong hợp đồng là **tra cứu chỉ đọc**, không phải giữ khóa. PR đúng nghĩa đó: test xác nhận 403 trả ra mà không ghi dòng `idempotency_key`.
- **"Đã gửi"** (`write-roles.ts`):
  - own key ở đường dẫn, mọi giá trị đều tính (`null`, `[]`, `{}`, `0`);
  - thân lệnh không phải object, hoặc là mảng ở gốc → không gửi gì;
  - gặp mảng ở chỗ cần object thì tìm từng phần tử, gặp object ở chỗ `a[]` thì coi như một phần tử. Đây là fail-closed, không phụ thuộc bước kiểm thân lệnh chạy sau;
  - tên trường lấy từ `operation.writeRoles` (sinh từ hợp đồng), không lấy từ khóa trong thân lệnh.
- **Hợp vai**: qua khi **một** vai có trong danh sách. Có ca FD ∪ SAL qua (T14-12) và CTV ∪ SAL bị chặn.
- **403**: `problem('FORBIDDEN_ACTION')` không có trường mở rộng. Test so mọi khóa của thân lỗi với danh sách Problem trơn. H-07: giá dưới sàn vẫn 403, không có `min`/`max`/`dates`.
- **Audit**: đúng **một** `access.denied` mỗi lần (H-09), `reason = WRITE_ROLES`, `after.fields`. Đường hoãn qua UnitOfWork ghi giống hệt vì `deniedFields` được giữ trên `RequestAuth`.
- **`fieldCases`**:
  - unit chạy đủ 21 ca với meta sinh; kiểm id `RBF-<operationId>-<field>-<subject>`; kiểm mọi vai trong `writeRoles` thuộc `x-roles`; kiểm không gắn cho thao tác `any_staff`/`guest`/`system`;
  - tích hợp chạy 14 ca của `calculateQuote`, `saveQuote`;
  - 7 ca `createReservationGroup` tự chạy khi thao tác đó có route (R3).
- H-01…H-04 thuộc PR-A1b, H-08 thuộc PR-B2. PR ghi rõ ranh giới này.

### 1.2 Mục 1.3 + 1.17 – V5-14: đúng

| Luật hợp đồng | Mã | Test |
|---|---|---|
| Chỉ `type = short` → khác: 422 `NOT_ALLOWED` (`nightlyRates`) | `calculate` dòng đầu | T14-4 |
| Kênh chỉ `direct`/`agent`; `ota`, `internal`, kênh ngừng → 422 `NOT_IN_LIST` (`channelId`), có hay không `nightlyRates` | như cũ | T14-4, T14-8, T14-9 |
| Thân lệnh trước kênh: ngoài khoảng/trùng → `DATE_INVALID` ở `nightlyRates[i].date`; ≤ 0 → `AMOUNT_NOT_POSITIVE`; thiếu đêm (cả `[]`) → `REQUIRED` | `typedNightRates`, gọi trước `channels.byId` | T14-10 (cả kênh `internal`), ca ngày, ca số tiền |
| Giá gõ = giá lịch trước BR-107/BR-111; luôn sàn–trần BR-105 qua `PricingService.price` | `typedCalendar` 588–633 | T14-2 (biên kín hai đầu), T14-7, ca BR-111 |
| Đêm `edited` ≠ `true` dùng giá lịch máy chủ, bỏ `amountVnd` gửi lên | `typed` chỉ giữ `edited === true`; đêm khác gửi `serverCalendar[i]` với `edited: false` | T14-11 (gửi 1 đ → giá lịch) |
| Snapshot lưu `nights[].source`; hold: đêm gõ `manual`, `manual_agreed`, cọc theo giá chụp | snapshot 539–546; `sales-port.adapter.ts` 84–127 | T14-1 (đêm đơn, tổng, cọc 600.000, nguồn, `calendarVnd`) |
| `createHoldFromQuote` có trường giá → 422 `NOT_ALLOWED` từng trường, không ghi gì, báo giá còn `active`; trường lạ khác vẫn bỏ qua | `rejectHoldPriceFields` | T14-5 (6 trường × 3 giá trị, nhiều trường một lần) |

- Nguồn đêm trong snapshot do máy chủ ghi, nên hold không tin dữ liệu client.
- Báo giá lưu trước V5-14 không có `nights[]` → mọi đêm `calendar`, như cũ. Có test.
- `PricingService` được inject qua `ReservationsModule` `@Global`. Test chạy `AppModule` + `featureModules` thật, nên đường production đã được đi qua.

### 1.3 Mục 1.9 + 1.24 BE 12 – V5-22: đúng, lệch nhỏ ở B13

- `createReservation` (`reservations.service.ts` 732–741): bản chặn và bản `_WARNING` của OTA cùng gọi builder `rateOutOfRange`. `dates[]` là các đêm `manual` vượt biên, theo thứ tự ngày. `min`/`max` là biên của `dates[0]`. Test: T22-1, biên đúng bằng sàn/trần, cảnh báo OTA.
- Báo giá: cùng builder (T14-2).
- B13 (`stay.service.ts` 376–382): thêm `dates: [date]`, giữ `date`, có `min`/`max` (T22-3 trong `bug-r4-038`). Chỉ trả đêm vượt biên **đầu tiên** → thẻ 03.
- Các chỗ trả mã này cho một đêm (giá đêm trước khi nhận phòng, đêm thêm khi trả phòng, sửa giá dòng folio, `stay-night-pricing`) đã có `min`/`max` từ trước. Hợp đồng không đòi `dates[]` ở các chỗ này.

---

## 2. Trả lời 4 câu BE hỏi ARC

### (a) Báo giá dùng `PricingService.load/price` cho giá lịch từng đêm và biên BR-105, rồi tự tính LOS/BR-111/cộng dồn – có nên dùng chung một đường?

**Có, về lâu dài nên một đường. Nhưng không làm ở PR-S1.**

- Hợp đồng 1.17 chỉ đòi "phần giá đêm và sàn–trần gọi `PricingService.price`". PR đã đạt.
- ARC so từng bước hai đường trên mã hiện tại. Kết quả hiện **bằng nhau**:

| Bước | Báo giá (`quote-pricing.ts`) | Tạo đơn (`pricing.service.ts`) | Bằng nhau? |
|---|---|---|---|
| Giá lịch đêm không gõ | `calendarRate(list, d, group, rules, rounding.night_rate)` | cùng hàm, cùng tham số | Có |
| Đêm gõ | `engine.price` (đêm gõ = `calendarVnd`) | cùng hàm | Có (cùng lệnh gọi) |
| Bậc BR-107 | `applyNightDiscount(calendar, pct, unit)` trên mảng | cùng hàm, từng đêm | Có (hàm làm tròn từng phần tử) |
| BR-111 mã quay lại | chỉ báo giá có | `createReservation` không nhận mã | – (chỉ một bên) |
| Phụ thu người BR-110 | `extraPersons(...)` | cùng hàm; chỉ `direct`/`agent` thu | Có (báo giá chỉ có `direct`/`agent`) |
| Cọc BR-305 | `shortDeposit(roomTotal, pct, unit)` | cùng hàm | Có |
| Sàn–trần BR-105 | chỉ qua engine | engine | Có |

- Rủi ro nằm ở **bộ điều phối** bị lặp, không nằm ở công thức. Khi đổi một bên mà quên bên kia, báo giá sẽ lệch đơn thật. Ví dụ:
  - 0.3.14 cho B1 dùng giá lịch máy chủ với đêm `edited` ≠ `true` (SEC ARC-18 (2));
  - bật lại bậc BR-107;
  - đổi luật phụ thu người.
- Với báo giá có giá gõ, `engine.price` đã tính xong bậc, tổng, phụ thu và cọc. Báo giá bỏ hết kết quả đó rồi tính lại. Trong cùng một request có hai lần tính ra cùng một số.
- Việc cần làm:
  - **Bây giờ** (thẻ 01): mở rộng oracle T14-7 để giữ "báo giá = đơn thật" ở các nhánh tiền khác nhau.
  - **v1.0.6** (thẻ 02): gộp thành một đường. Đưa BR-111 vào engine bằng hàm `discountedNight` đã dùng chung ở `stay-night-pricing.ts`, rồi cho báo giá gọi `engine.price` cho mọi báo giá ngắn ngày. Không đổi hợp đồng.

### (b) Allowlist audit thêm `fields` cho entity `operation`

**Đồng ý.**

- Giá trị của `fields` là khóa của `operation.writeRoles` (hợp đồng sinh ra): đã sắp xếp, số lượng có giới hạn. Không bao giờ là khóa hay giá trị trong thân lệnh, nên không có dữ liệu người dùng hay dữ liệu cá nhân vào log.
- `audit-fields.ts` dùng chung cho tiến trình api và worker. `worker-audit-registry.test.ts` vẫn so hai bên.
- `reason = WRITE_ROLES` đúng kiểu mã của guard (`ORIGIN`, `CSRF`, `DEVICE_NOT_TRUSTED`).
- ARC sẽ ghi vào danh sách 0.3.14: bảng mã `reason` của `access.denied` và nghĩa của `after.fields`. Hiện hợp đồng chưa liệt kê các mã này.

### (c) 422 trường giá của `createHoldFromQuote` đứng trước bước tra phạm vi

**Đồng ý.**

- Lỗi 422 chỉ phụ thuộc thân lệnh. Báo giá có thật, không có thật hay ngoài phạm vi đều nhận cùng một câu trả lời, nên không lộ sự tồn tại của báo giá.
- Cách này khớp với `parseBody(holdInput)`, vốn đã chạy trước bước tra phạm vi. Cũng khớp `rbac-matrix.md` 46b: "422 `NOT_ALLOWED` với mọi vai".
- Thứ tự hiện có, ARC muốn giữ: guard (`x-roles` → 403) → `quoteId` sai dạng 404 → `dryRun` → trường giá 422 → schema thân lệnh → phạm vi/trạng thái trong service.
- Kiểm tra chạy ở controller, trước UnitOfWork, nên không giữ khóa idempotency. Client sửa thân lệnh rồi gửi lại cùng khóa vẫn được.

### (d) B13: `dates` chỉ chứa đêm đang thêm, dừng ở đêm vượt biên đầu tiên

**Chấp nhận cho v1.0.5.**

- `min`/`max` khớp `dates[0]`, đúng mục 1.9.
- Không sai tiền: lệnh bị chặn, không ghi gì.
- Còn lệch chữ hợp đồng: `Problem.dates` là "các đêm có giá ngoài sàn–trần". B13 cũng là chỗ duy nhất còn tự dựng lỗi này, không qua builder chung. Xem thẻ 03.
- Nếu dời sang v1.0.6, ARC ghi vào 0.3.14: "B13 ở v1.0.5 chỉ trả đêm vượt biên đầu tiên".

---

## 3. Góc DOM (ARC ghi theo yêu cầu ORC; quyền chốt nghiệp vụ vẫn là DOM)

Câu hỏi: giá gõ tay là giá lịch trước BR-107/BR-111, và đêm `edited:false` giữ giá lịch máy chủ – có đúng `rules-v1.0.5.md` và BR-101/105/107/111 không?

**Kết luận: đúng, không thấy mâu thuẫn.** Có một chỗ nên DOM ghi rõ thêm (BR-111, xem dưới).

- **BR-107 (v0.3.8)**: "Giá đêm lễ tân nhập là giá lịch của đêm (trước bậc) ở mọi chỗ: giá thỏa thuận lúc đặt…", bậc áp lên mọi đêm kể cả đêm nhập tay, và "cùng một đêm thì nhập hay để mặc định đều ra cùng giá".
  - Mã đúng như vậy. T14-7, 7 đêm, bậc −10 %: gõ 700.000 → 630.000, gõ 690.000 → 621.000; đêm không gõ ra đúng như báo giá không gõ.
- **BR-111**: mã quay lại chỉ cho kênh Trực tiếp, không cộng dồn với BR-107, áp mức có lợi hơn cho khách.
  - Mã: `max(bậc, mã)` khi `stackable = false`, áp trên giá lịch của đêm, kể cả đêm gõ. Ca test: 700.000 −5 % → 665.000.
  - Hàng BR-111 chưa nói gì về giá gõ. Hợp đồng 1.17 nêu điều này dựa trên BR-107 v0.3.8 và BR-429 (a1) ("đơn từ báo giá lưu giá lịch + % đã áp, không giảm hai lần"). Cách hiểu này nhất quán: mã quay lại là mức thay cho bậc, nên áp trên cùng cơ sở với bậc.
  - **Đề nghị ORC chuyển DOM**: thêm vào BR-111 ở bản business-rules kế tiếp một câu "mã áp trên giá lịch của đêm, kể cả giá lễ tân gõ (BR-107 v0.3.8)" và ví dụ 700.000 → 665.000. Không chặn PR.
- **BR-105**:
  - giá gõ luôn trong sàn–trần của nhóm căn; Lầu 1–2 là 530.000–1.900.000 như ví dụ BR-105;
  - đúng bằng biên thì qua; ngoài khoảng thì chặn;
  - giá 0 hay âm → 422 `AMOUNT_NOT_POSITIVE` ở trường `nightlyRates` (như B1). Desk tô ô lỗi phía client;
  - kênh Nội bộ không vào được báo giá, nên không có nhánh bỏ sàn–trần.
- **BR-101 (2)**:
  - giá lịch lấy từ giá niêm yết đêm có hiệu lực từng đêm, không suy từ giá tháng;
  - đêm `edited:false` dùng giá máy chủ, nên client không hạ được đêm không sửa bằng cách gửi số nhỏ (SEC ARC-06). Điều này khớp "một mức giá mọi kênh" và câu "nhập hay để mặc định đều ra cùng giá" của BR-107.
- **BR-417 (2), BR-429 (a1)**:
  - hold từ báo giá có giá gõ ra đêm `manual` và `manual_agreed`;
  - đêm thêm sau đó (B9a, B13, B18) gợi ý giá thỏa thuận;
  - tính lại bậc dùng `calendarVnd` = giá gõ và % đã áp trong snapshot. Khớp.
- **`rules-v1.0.5.md`**: không có mục V5-14 và không có câu nào trái luật trên.
  - Ghi chú nhỏ: mục 12.3 trỏ `quote-pricing.ts` dòng 201–202 cho `minStayNights`. Sau PR này lệnh gọi nằm ở dòng 277. DOM sửa dòng tham chiếu khi tiện.

---

## 4. Đề xuất decision-log của BE

**ARC đồng ý cả hai.** Câu đề nghị ORC ghi:

```
| 2026-11-07 | 5 | ARC đồng ý (PR #103): cổng `x-write-roles` là một phần quyết định vai trong AuthGuard – sau tra cứu Idempotency-Key (chỉ đọc), trước mọi kiểm thân lệnh và tính giá; hoãn qua UnitOfWork như `x-roles` (ADR-009). "Đã gửi" = thân lệnh có own key ở đường dẫn, mọi giá trị kể cả `null`/`[]`; hình dạng lạ tính là đã gửi (fail-closed); tài khoản nhiều vai lấy hợp. 403 không trường mở rộng; `access.denied` `reason = WRITE_ROLES`, `after.fields` = đường dẫn trong hợp đồng, không ghi giá trị | ARC | Quyền ARC (kiến trúc, hợp đồng API) |
| 2026-11-07 | 5 | ARC đồng ý (PR #103): 422 `RATE_OUT_OF_RANGE(_WARNING)` nhiều đêm dựng bằng một builder `rateOutOfRange` (`reservations/public`): `dates[]` theo thứ tự ngày, `min`/`max` = sàn/trần của `dates[0]`, không có biên thì bỏ khóa. B13 dùng chung builder và trả mọi đêm vượt biên từ v1.0.6 (FB-R5-ARC-BE-S1-03) | ARC | Quyền ARC |
```

---

## 5. Thẻ

### FB-R5-ARC-BE-S1-01
- Mức độ: **Minor**. Làm trước tag v1.0.5; được làm PR test riêng; không chặn gộp #103.
- Vị trí:
  - `test/integration/v5-14-quote-typed-rates.test.ts` T14-7;
  - `test/integration/v5-22-rate-bounds.test.ts`;
  - `src/modules/reservations/public/rate-out-of-range.ts` (chưa có unit test).
- Vấn đề:
  - T14-7 là oracle duy nhất giữ "báo giá = đơn thật", nhưng chỉ có một ca: kênh `direct`, 2 người lớn bằng định mức (phụ thu người 0), một dòng giá niêm yết, 2 đêm gõ và 5 đêm lịch. Phần báo giá tự tính (phụ thu người BR-110, cọc BR-305, bậc trên đêm gõ) chỉ được đối chiếu ở nhánh đơn giản nhất.
  - Mọi ca V5-22 và T14-2 chạy trên dữ liệu có `ota_base_rate`, nên mọi đêm cùng biên. Vì vậy không ca nào phân biệt được "`min`/`max` của đêm đầu trong `dates[]`" với "của một đêm bất kỳ".
  - Production chưa có `ota_base_rate` (v1.0.4 #70). Ở đó biên lấy theo giá niêm yết từng đêm, và khác nhau khi giá đổi giữa kỳ ở.
- Vì sao quan trọng:
  - Hai đường tính lệch nhau = số báo cho khách và số cọc khác đơn thật, tức sai tiền.
  - Luật decision-log mới (biên của đêm đầu) chưa có test nào giữ.
- Đề xuất sửa:
  1. Đổi T14-7 thành bảng ít nhất 4 ca. Mỗi ca so `totalVnd` với tiền phòng + phụ thu người của đơn, so `depositVnd` và giá từng đêm:
     - kênh `agent`;
     - 3 người lớn + 1 trẻ 6–11 trên căn định mức 2;
     - giá niêm yết đổi giữa kỳ (2 dòng `effective_from`);
     - gõ mọi đêm.
  2. Unit test thuần cho `rateOutOfRange`:
     - hai đêm khác biên → `min`/`max` lấy của `dates[0]`;
     - không có biên → không có khóa `min`/`max`;
     - `warning` → `VALIDATION_FAILED` + mã trường `RATE_OUT_OF_RANGE_WARNING`.
  3. Một ca tích hợp trên tenant không có `ota_base_rate`, giá niêm yết đổi giữa kỳ, hai đêm vượt biên với biên khác nhau → `min`/`max` của đêm đầu.
- Trạng thái: Open

### FB-R5-ARC-BE-S1-02
- Mức độ: **Minor**. Làm ở v1.0.6, cùng đợt SEC ARC-18 (2) đổi B1 với đêm `edited` ≠ `true`. Không chặn v1.0.5.
- Vị trí:
  - `quote-pricing.ts` 377–450 (giá lịch, bậc, BR-111, cộng dồn, tổng, phụ thu người, cọc) và `typedCalendar` 588–633;
  - `pricing.service.ts` `price` 239–428.
- Vấn đề:
  - Báo giá có giá gõ: `engine.price` đã tính bậc, tổng, phụ thu người, cọc; báo giá bỏ hết rồi tính lại bằng logic riêng.
  - Báo giá không gõ: không đi qua engine.
  - Hai bộ điều phối dùng cùng công thức. Chúng bằng nhau chỉ nhờ dùng chung hàm thuần trong `pricing.ts` và một oracle.
  - Hai điểm phụ:
    - `engine.load` đọc lại khoảng 27 tham số tuần tự mà báo giá đã đọc riêng. Mỗi lần Desk tính lại báo giá có giá gõ, số lần đọc tham số tăng gấp đôi;
    - `@Optional()` trên `engine`: nếu thiếu wiring, lỗi thành 500 lúc chạy thay vì hỏng lúc khởi động.
- Vì sao quan trọng: sửa luật giá ở một bên mà quên bên kia thì báo giá lệch đơn thật, và không có lỗi biên dịch nào báo.
- Đề xuất sửa (không đổi hợp đồng):
  - `PriceInput` thêm `returnGuest?: { pct: number; stacked: boolean }` (chỉ kênh `direct`). Engine tính từng đêm bằng `discountedNight` (`pricing.ts` 142, hàm `stay-night-pricing.ts` đang dùng để tính lại bậc). Như vậy tạo đơn, báo giá và tính lại bậc dùng một hàm.
  - Báo giá gọi `engine.price` cho **mọi** báo giá ngắn ngày, có hay không có giá gõ. Báo giá chỉ giữ phần riêng: kênh, người chốt, tối thiểu đêm, chọn căn, hoa hồng, so sánh thuê tháng, snapshot.
  - Báo giá đọc tham số giá từ `PricingParams` (load một lần).
  - Bỏ `@Optional()` của `engine`.
  - Giữ snapshot như nay (`losDiscountPct`, `returnGuestPct` tách riêng – BR-429 (a1)).
  - Sau khi gộp, T14-7 thành kiểm cấu trúc.
- Trạng thái: Open

### FB-R5-ARC-BE-S1-03
- Mức độ: **Minor**. Chấp nhận cho v1.0.5; sửa ở v1.0.6, hoặc sớm hơn nếu BE còn chỗ trước 08/11.
- Vị trí: `src/modules/frontdesk/internal/stay.service.ts` 359–383 (B13 `extendStay`, vòng tính giá đêm thêm).
- Vấn đề:
  - B13 ném lỗi ở đêm vượt biên đầu tiên, `dates = [đêm đó]`. Hợp đồng ghi `Problem.dates` là "các đêm có giá ngoài sàn–trần" (bảng trường mở rộng, `openapi.yaml` dòng 230 và 10687).
  - B13 tự dựng lỗi, không qua `rateOutOfRange`, nên cùng một lỗi có hai chỗ dựng.
  - Ca lý thuyết: biên dự phòng `ceiling = Number.MAX_SAFE_INTEGER` có thể lọt vào `max` nếu một đêm có `floorVnd` mà thiếu `ceilingVnd`. Hiện dto luôn có cả hai.
- Vì sao quan trọng: gia hạn nhiều đêm mà có 2 đêm sai giá thì lễ tân sửa đêm đầu, gửi lại mới biết đêm thứ hai sai. Desk không tô được mọi ô sai như ở B1 và báo giá.
- Đề xuất sửa:
  - duyệt hết các đêm thêm, gom mọi đêm vượt biên, rồi dựng lỗi bằng `rateOutOfRange` (biên lấy từ `o.dto.nights`) và giữ `date = dates[0]` cho client cũ;
  - test: gia hạn 2 đêm, cả hai dưới sàn → `dates` có 2 đêm, `date` = đêm đầu, `min`/`max` của đêm đầu.
- Trạng thái: Open

### FB-R5-ARC-BE-S1-04
- Mức độ: **Suggestion** (0.3.14; SEC cân nhắc).
- Vị trí: `auth.guard.ts` `hasCompletedKey` (376–400); `unit-of-work.ts` `claimKey`.
- Vấn đề:
  - Guard hoãn quyết định vai khi có khóa `completed` cùng method + path, mà không so `request_hash`.
  - Ví dụ: SAL dùng lại khóa của một lần lưu báo giá đã xong (thân lệnh khác), lần này kèm `nightlyRates`. UnitOfWork trả 422 `IDEMPOTENCY_KEY_REUSED`, không 403, không `access.denied`.
  - Cách này đúng thứ tự hợp đồng (tra khóa trước) và không lộ gì. Nhưng một lần thử trái quyền không để lại dấu trong audit.
  - Không phải lỗi mới của PR: `x-roles` đã như vậy từ trước.
- Vì sao quan trọng: H-09 muốn mỗi lần bị chặn vì quyền có một dòng audit. Ca dùng lại khóa là kẽ hở nhỏ của điều đó.
- Đề xuất sửa:
  - `hasCompletedKey` so cả `request_hash` (tính `requestHash` ngay trong guard). Chỉ replay thật mới được hoãn; khác thì 403 + `access.denied` ngay;
  - test: khóa đã xong của thân lệnh A; SAL gửi thân lệnh B có `nightlyRates` cùng khóa → 403 `WRITE_ROLES`.
- Trạng thái: Open

### FB-R5-ARC-BE-S1-05
- Mức độ: **Suggestion**.
- Vị trí: `quote-pricing.ts` 539–546 (snapshot `nights[].agreedRateVnd`, `bookingRateSource`).
- Vấn đề:
  - `agreedRateVnd` lặp lại `calendarRatesVnd[i]`;
  - `bookingRateSource` của snapshot báo giá không có chỗ nào đọc (adapter suy ra từ `nights[].source`);
  - hai nguồn cho cùng một số trong dữ liệu lưu lâu (BR-006) dễ lệch khi sửa về sau.
- Vì sao quan trọng: người sửa sau có thể đọc nhầm trường phụ làm nguồn chính.
- Đề xuất sửa: giữ `nights[].source` + `calendarRatesVnd` làm nguồn duy nhất; bỏ `agreedRateVnd`, hoặc ghi chú "chỉ để đọc, = `calendarRatesVnd[i]`" ở chỗ ghi và ở adapter. Không đổi hợp đồng (snapshot không có trong OpenAPI).
- Trạng thái: Open

---

## 6. Việc cho làn khác (không phải thẻ của BE)

- **FE-A (V5-14, T14-6)**:
  - lấy cờ `edited` từ trạng thái ô trên form (như `BookingDialog.tsx` 587–592 đang làm với B1), không suy từ câu trả lời. Ở báo giá, `edited` vắng nghĩa là không sửa, khác B1;
  - với đêm gõ, `calculateQuote.nightlyRates[].calendarRateVnd` trả về chính giá gõ;
  - E2E T14-6: số cọc trên hộp phải bằng số máy chủ.
- **ARC** sẽ thêm vào danh sách 0.3.14:
  - bảng mã `reason` của `access.denied` (`ORIGIN`, `CSRF`, `DEVICE_NOT_TRUSTED`, `WRITE_ROLES`) và nghĩa `after.fields`;
  - câu B13 nếu thẻ 03 dời.
- **DOM**: câu BR-111 ở mục 3; sửa dòng tham chiếu ở `rules-v1.0.5.md` 12.3.
- **QA**:
  - đưa H-05…H-07, T14-1/2/4/5/7…12 và T22-1/3 vào bộ hồi quy;
  - runner `fieldCases` đã tự lọc theo thao tác có route.

---

## 7. Điểm làm tốt

- Cổng trường nằm đúng một chỗ (AuthGuard, đọc meta sinh) và đi lại đường quyết định vai có sẵn, nên replay ADR-009, đường hoãn qua UnitOfWork và audit không phải viết lại. Test phủ cả ngữ nghĩa "đã gửi" lẫn bất biến của meta.
- V5-14 không chép lại phần giá trong module sales: đêm gõ và biên đi qua engine của module reservations. Snapshot do máy chủ ghi là nguồn duy nhất cho hold. Có oracle so với `createReservation` thật, không chỉ so với số viết tay.
- Builder `rateOutOfRange` dùng chung cho tạo đơn và báo giá. Test kiểm cả hai đầu biên và bản cảnh báo OTA.
