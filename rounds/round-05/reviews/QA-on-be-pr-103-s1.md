# QA review PR #103 – BE-S PR-S1: cổng `x-write-roles`, V5-14 giá gõ trong báo giá, V5-22 `min`/`max`

- Round 5 (v1.0.5), bước **Review**, góc kiểm thử. Người review: QA. Ngày 07/11/2026.
- PR: #103 `r5-s1`.
  - Đọc diff ở `7c6908f0`.
  - HEAD hiện tại là **`60c25cb9`**: BE-H gộp `main` @ `ba2dc355` vào nhánh. `git show --remerge-diff 60c25cb9` chỉ có một chỗ: dòng import ở `quote-pricing.ts`, giữ cả `readMinStay` và `rateOutOfRange`.
  - 5 tệp test không đổi giữa hai SHA. Kết luận dưới đây áp cho `60c25cb9`.
- Đã đọc:
  - `rounds/round-05/reviews/ARC-on-be-pr-103-s1.md` và `SEC-on-be-pr-103-s1.md`, để không lặp thẻ;
  - hợp đồng 0.3.13 mục 1.3, 1.9, 1.16, 1.17, 1.24 BE 12;
  - `openapi.yaml`: `QuoteInput.nightlyRates`, `QuoteInput.channelId`, `NightRate.edited`, `AuditEvent`;
  - `rbac-cases.json` `fieldCases` (21 ca);
  - BR-105, BR-107 (v0.3.8, v0.5.0), BR-111;
  - `outputs/DOM/rules-v1.0.5.md`: không có mục V5-14 hay V5-22, không có câu nào trái các ca dưới đây.
- Mã đã đọc ngoài diff:
  - `quotes.service.ts` `createHold`: lấy `s.calc.nightlyRates` từ snapshot;
  - `pricing.service.ts` `price`: `edited` vắng ở B1 = `manual`; biên kiểm trên `calendarVnd`;
  - `pricing.ts` và `money.ts`: làm tròn nửa lên;
  - `unit-of-work.ts`: 422 ném trong giao dịch thì khóa được trả lại;
  - Desk `BookingDialog.tsx` và `QuoteDialog.tsx`: thân `createHoldFromQuote` chỉ có `{ holdHours, depositMethod }`;
  - `e2e/api`: không spec nào gửi trường giá vào `create-hold`. Vì vậy 422 mới không làm hỏng client nào.

Cách kiểm:
- Worktree tách riêng ở `60c25cb9` và PostgreSQL 17 tạm trong scratchpad `qa-pr103/` (chỉ `127.0.0.1`, mật khẩu CI công khai của repo). Xóa sau review. Không checkout bản làm việc chung.
- Chạy 5 tệp test của PR (`write-roles-units`, `write-roles-gate`, `v5-14-quote-typed-rates`, `v5-22-rate-bounds`, `bug-r4-038`): **69/69 qua**.
- Viết tệp test dò (probe) 9 ca cho các ca QA thấy thiếu, chỉ trong worktree, **không commit**: **9/9 qua**. Mã làm đúng ở cả 9 ca. Các thẻ dưới đây là thiếu test, không phải lỗi sản phẩm.
- Toàn bộ API ở `60c25cb9`: 4651 ca qua, 0 lỗi (mục 8).
- CI của `60c25cb9` lúc viết: mọi job đã xong đều xanh; job `format · lint · audit · test · build` còn chạy.
- Không gọi staging hay production. Tệp này không có bí mật hay dữ liệu khách.

---

## 0. Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

- **QA không chặn gộp #103.** Gộp ở `60c25cb9` khi job API của CI xanh.
- 0 Blocker · 0 Major · 3 Minor · 1 Suggestion. Không có lỗi sản phẩm.
- Điều kiện để QA đóng phần BE của BUG-R4-040 và BUG-R4-041:
  1. **Trước tag v1.0.5**: thẻ QA 01–03 vào PR test `r5-s1-tests` (BE-H, cùng ARC S1-01 và SEC S1-01, S1-03). Không cần PR riêng.
  2. **Staging v1.0.5 (17–18/11)**: các ca TC-V105-S1-01…05, 07, 08 đạt (`rounds/round-05/qa/v1.0.5-test-cases.md` mục 1.2).
     - TC-V105-S1-05 phải tạo dữ liệu **trước** giờ deploy staging. ORC báo QA giờ deploy trước ít nhất 1 giờ.
  3. T14-6 và T22-2 thuộc FE-A. QA chạy TC-V105-S1-06 khi FE-A gộp, với oracle chặt hơn ở mục 2.2.
- ESC mới: **không**.

| Phần | Test của PR | QA |
|---|---|---|
| Cổng `x-write-roles` (1.16) | Đủ: 21 `fieldCases`, H-05…H-07, H-09, T14-12, thứ tự, replay | Thẻ 04 (a), (b): siết nhánh `pass`, phân biệt hai loại 403 trong audit |
| V5-14 (1.3, 1.17) | Đủ ở nhánh không giảm và ở `calculateQuote` | Thẻ 01: giữ chỗ khi có mã/bậc. Thẻ 02: `edited` vắng; báo giá lưu trước V5-14 |
| V5-22 (1.9, 1.24 BE 12) | Đủ: B1, cảnh báo OTA, báo giá, B13 một đêm | Thẻ 03: biên trên giá trước giảm; `dates[]` khi gửi không theo thứ tự |

---

## 1. Đối chiếu ca test QA với test của PR

| Ca | Oracle | Test của PR | QA |
|---|---|---|---|
| T14-1 | Đêm của đơn = giá gõ, nguồn `manual`, cọc theo giá gõ | `v5-14` T14-1: 700.000 + 650.000 + 792.000 = 2.142.000, cọc 600.000; snapshot báo giá và đơn `manual`/`manual`/`calendar`, `manual_agreed`; `stay_night` đúng số | Đủ ở nhánh **không giảm**. Nhánh có mã/bậc: thẻ 01 |
| T14-2 | 422 kèm `dates[]`, `min`, `max`; không lưu | Calc và save; 529.000 và 1.901.000 trên 2 đêm; đúng sàn/trần → 200; đếm báo giá | Đủ. Biên trên giá trước giảm: thẻ 03. Biên khác nhau giữa các đêm: ARC S1-01 (3) |
| T14-3 | SAL → 403 | `write-roles-gate` H-05 (SAL), H-06 (SAL) | Đủ |
| T14-4 | Dài hạn → `NOT_ALLOWED` (`nightlyRates`); OTA → `NOT_IN_LIST` (`channelId`) | `v5-14` T14-4; OTA không `nightlyRates` ở `sales.test.ts` có sẵn | Đủ. Chữ hợp đồng mục 1.3 lệch: mục 2.1 |
| T14-5 | 422 `NOT_ALLOWED` từng trường; không có đơn; báo giá còn `active` | 6 trường × (`[]`, `null`, 1.000); nhiều trường một lần; trường lạ khác vẫn bỏ qua | Đủ. Báo giá ngoài phạm vi: SEC S1-03. Gửi lại cùng khóa: thẻ 04 (c) |
| T14-6 | E2E Desk | Không có (FE-A) | Chưa có. Oracle cần chặt hơn: mục 2.2 |
| T14-7 | `calculateQuote` = `createReservation` | Một ca: 101, 7 đêm, bậc −10 %: 630.000, 621.000; so với lệnh tạo đơn thật (mạnh hơn `previewOnly`) | Đủ ở một điểm, ARC S1-01 mở rộng. Không qua `create-hold`, không có nhánh BR-111: thẻ 01 |
| T14-8 | FD kênh `internal`, có và không giá gõ → `NOT_IN_LIST` | Calc và save, đếm báo giá | Đủ |
| T14-9 | SAL `saveQuote` kênh `internal` → 422, không lưu | Có | Đủ |
| T14-10 | Thiếu 1 đêm → `REQUIRED` | Thiếu 1 đêm, `[]`, cả kênh `internal` (thân lệnh trước kênh); `DATE_INVALID` ngoài khoảng và trùng; `AMOUNT_NOT_POSITIVE` (cả `edited: false` với 0); số lẻ | Đủ |
| T14-11 | `edited = false`, `amountVnd` = 1 → giá lịch | Trong T14-1 | Đủ. `edited` **vắng**: thẻ 02 |
| T14-12 | FD ∪ SAL qua | `calculateQuote`; `saveQuote` qua `fieldCases` | Đủ |
| T22-1 | 422 có `min`, `max`, `dates[]` | Dưới sàn và trên trần ở 2 đêm; đúng biên → 201; cảnh báo OTA | Đủ. Gửi không theo thứ tự ngày: thẻ 03 |
| T22-2 | Câu trên Desk | Không có (FE-A) | – |
| T22-3 | B13: `dates[]`, `date`, `min`, `max` | `bug-r4-038` một đêm | Đủ cho v1.0.5. Nhiều đêm: ARC S1-03 |
| H-05 | CTV `saveQuote` → 403, không lưu | CTV và SAL; ca đối chứng không trường → 201 | Đủ |
| H-06 | SAL, CTV `calculateQuote` → 403 | Có; đối chứng → 200 | Đủ |
| H-07 | SAL dưới sàn → 403, không `min`/`max` | Có; so mọi khóa của thân lỗi | Đủ |
| H-09 | Đúng một `access.denied` | `expectFieldDenied` đếm trước +1, `reason`, `after.fields` | Đủ cho H-05…H-07. H-01…H-04 ở PR-A1b, H-08 ở PR-B2 |
| `fieldCases` (21) | `RBF-<operationId>-<field>-<subject>` | Unit 21/21 (id, `writeRoles` = meta, quyết định); tích hợp 14 ca `calculateQuote`, `saveQuote`; 7 ca `createReservationGroup` tự chạy khi có route | Đủ. Nhánh `pass` kiểm yếu: thẻ 04 (a) |
| Thứ tự cổng | 403 trước kiểm thân lệnh, trước giữ khóa; replay ADR-009 | Có cả ba | Đủ. Dùng lại khóa với thân khác: SEC S1-01 |

Ghi thêm: ARC mục 1.2 ghi "báo giá lưu trước V5-14 không có `nights[]` → mọi đêm `calendar` … Có test". QA không tìm thấy ca này. Ca "a quote without typed prices still holds at the calendar" lưu báo giá bằng mã mới, nên snapshot đã có `nights[]`. Probe P2b xác nhận mã đúng (thẻ 02).

---

## 2. Oracle lệch

### 2.1 T14-4 – chữ hợp đồng mục 1.3 đã cũ
- Bảng mục 1.3 ghi "Kênh OTA, hoặc `type = long` → 422 `NOT_ALLOWED`". OpenAPI `QuoteInput.channelId` và mục 1.17 ghi `ota`, `internal`, kênh ngừng → 422 `NOT_IN_LIST` (`channelId`). Mục 1.17 chỉ ghi "thay T14-4 cũ (kênh Nội bộ)", không sửa dòng OTA.
- PR làm theo OpenAPI. **Oracle QA**: dài hạn + `nightlyRates` → `NOT_ALLOWED` (`nightlyRates`); OTA → `NOT_IN_LIST` (`channelId`).
- Việc cho ARC: sửa chữ dòng T14-4 ở mục 1.3 trong danh sách 0.3.14. Không đổi hành vi.

### 2.2 T14-6 – "cọc trên hộp = số máy chủ" không bắt được BUG-R4-041
- Ở báo giá, `edited` vắng nghĩa là không sửa. Máy chủ lấy giá lịch của chính nó (probe P2a: ba đêm 700.000 không cờ → ba đêm 792.000).
- Nếu Desk quên gửi `edited: true`, giá gõ bị bỏ, máy chủ trả cọc theo giá lịch. Hộp vẫn hiện "đúng số máy chủ". Ca T14-6 như hiện nay vẫn xanh trong khi lỗi gốc quay lại.
- **Oracle QA cho T14-6** (TC-V105-S1-06):
  - (a) yêu cầu `saveQuote` có `edited: true` ở ô đã gõ, `edited: false` kèm giá lịch máy chủ ở ô không gõ, không gửi 0;
  - (b) cọc trên hộp = cọc tính từ **giá gõ** = `depositRequiredVnd` của đơn;
  - (c) đêm của đơn = giá gõ.

### 2.3 T14-7 – nhánh BR-111 không có oracle B1
- Hợp đồng ghi so với `createReservation previewOnly`. PR so với lệnh tạo đơn thật. Cách này mạnh hơn, QA nhận.
- `createReservation` không nhận mã quay lại. Vì vậy báo giá có mã không so được với B1. **Oracle QA** cho nhánh này là số tính tay theo BR-107 v0.3.8 + BR-111 (mục 3, thẻ 01).

### 2.4 B13 chỉ trả đêm đầu
- Mô tả PR ghi B13 mang `dates[]`. Hợp đồng ghi `Problem.dates` là mọi đêm ngoài sàn–trần.
- Ở v1.0.5, QA ghi đây là giới hạn đã biết (ARC S1-03). TC-V105-S1-07 mong đợi `dates` một phần tử. Không ghi lỗi mới.

---

## 3. Kiểm ví dụ giá

Làm tròn theo `divideRoundVnd` (nửa lên): giá đêm 1.000, cọc 100.000.

| Ca | Phép tính | Ở test | QA |
|---|---|---|---|
| BR-111 trên giá gõ | 700.000 × 95 % = **665.000**; 792.000 × 95 % = 752.400 → 752.000 | Ca BR-111: `[665.000, 700.000]`, `[752.000, 792.000]` (`amountVnd`, `calendarRateVnd`) | Đúng. Giá gõ là giá lịch trước BR-111; `calendarRateVnd` = giá gõ. Khớp câu BR-111 ARC đề nghị DOM thêm |
| BR-107 trên giá gõ (T14-7) | 700.000 × 90 % = 630.000; 690.000 × 90 % = 621.000 | Đúng hai số | Đúng BR-107 v0.3.8 |
| T14-1 | 700.000 + 650.000 + 792.000 = 2.142.000; 30 % = 642.600 → 600.000. Theo lịch: 2.376.000 → 712.800 → 700.000 | 2.142.000 / 600.000 | Đúng. Hai số cọc này không phân biệt được làm tròn xuống với làm tròn gần nhất. Quy tắc làm tròn cọc có test riêng, không cần thẻ |
| Biên L12 | 760.000 × 70 % = 532.000 → 530.000; × 250 % = 1.900.000 (đơn vị 10.000) | 530.000 / 1.900.000 | Đúng ví dụ BR-105 |
| `R202_WEEKDAY` | 792.000 | Chú thích ghi "9.500.000 / 12" | Số đúng. Từ V5-1A (PR-C1 `ca021763`), DS-E có `nightlyListPriceVnd` 792.000 cho 202. Số vẫn giữ, chú thích sẽ cũ (thẻ 04 (d)) |
| Probe P1a: mã + hai đêm gõ, rồi giữ chỗ | 665.000 + 650.000 × 95 % (617.500 → 618.000) + 752.000 = **2.035.000**; 30 % = 610.500 → **600.000** | Không có ở PR | Mã đúng: đơn giữ đúng 665.000 / 618.000 / 752.000, tổng 2.035.000, cọc 600.000; `calendarVnd` 700.000 / 650.000 / 792.000; `losDiscountPct` 5 |
| Probe P1b: 7 đêm bậc −10 %, rồi giữ chỗ | Đêm 1–2: 630.000 / 621.000 | Không có ở PR | Đơn = báo giá: 4.431.000 / cọc 1.300.000 |
| Probe P3a: gõ đúng sàn + mã | 530.000 × 95 % = 503.500 → 504.000 (dưới sàn) | Không có ở PR | 200, vì biên áp lên giá gõ trước giảm. Gõ 529.000 + mã → 422, `min` 530.000 |

Vì sao nhánh mã quan trọng: từ BR-107 v0.5.0, production có `los_discount` = `[]`. Mã OTTIMO-BACK5 (−5 %, kênh Trực tiếp) là nhánh giảm **duy nhất** đang chạy. Test của PR không đi qua nhánh này ở bước giữ chỗ.

---

## 4. Ca phải chạy lại trên staging v1.0.5

Chi tiết bước và mong đợi ở `rounds/round-05/qa/v1.0.5-test-cases.md` mục 1.2. Dữ liệu là số của staging (giá lịch, sàn–trần đọc từ API), không dùng số DS-E.

| Mã | Ca | Vì sao phải chạy trên staging |
|---|---|---|
| TC-V105-S1-01 | Giữ chỗ từ báo giá có giá gõ + mã quay lại (700.000 → 665.000) | Nhánh tiền đang chạy trên production; tham số thật (`return_guest_pct`, `short_stay_deposit_pct`, làm tròn) |
| TC-V105-S1-02 | T14-2, T22-1 với biên thật | Staging, giống production, có thể chưa có `ota_base_rate`: khi đó biên theo giá niêm yết từng đêm. Các ca T14-2 và V5-22 của CI đều chạy với `ota_base_rate` |
| TC-V105-S1-03 | Cổng trường cho 8 vai, audit S27 | Tài khoản và phiên thật; `access.denied` đọc qua S27 |
| TC-V105-S1-04 | `create-hold` + trường giá; cùng khóa gửi lại; Desk vẫn giữ chỗ được | Bảo đảm 422 mới không làm hỏng hai nút Giữ chỗ của Desk |
| TC-V105-S1-05 | Báo giá lưu ở v1.0.4, giữ chỗ sau khi lên v1.0.5 | Ca chuyển bản, chỉ xảy ra một lần; tạo dữ liệu trước deploy |
| TC-V105-S1-06 | T14-6 E2E Desk, oracle mục 2.2 | Khi FE-A gộp V5-14. Chưa gộp thì kiểm khóa nút v1.0.4 không hồi quy |
| TC-V105-S1-07 | B13 dưới sàn ở 2 đêm | Giới hạn đã biết (một đêm), câu Desk có số |
| TC-V105-S1-08 | Độ trễ `calculateQuote` có giá gõ | `engine.load` đọc lại tham số (ARC S1-02); Desk gọi lại mỗi khi sửa ô |

Hồi quy kèm: TC-V104-RG-15 (khóa nút Giữ chỗ khi có giá gõ) cho tới khi FE-A gộp V5-14.

---

## 5. Thẻ

### FB-R5-QA-BE-S1-01
- Mức độ: **Minor**. Làm trước tag v1.0.5 trong PR test `r5-s1-tests`. Không chặn gộp #103.
- Vị trí: `test/integration/v5-14-quote-typed-rates.test.ts` (T14-1, ca BR-111, T14-7); đường `quotes.service.ts` `createHold` (`nightlyRates: s.calc.nightlyRates`) → `sales-port.adapter.ts` `createHoldFromQuote`.
- Vấn đề:
  - Giữ chỗ từ báo giá có giá gõ chỉ được test ở nhánh **không giảm** (T14-1: 3 đêm, không mã). Ở nhánh này giá gõ trùng giá sau giảm. Vì vậy test không phân biệt được ba trường hợp:
    - đơn lấy số sau giảm (đúng);
    - đơn lấy `calendarRatesVnd` (bỏ giảm);
    - đơn giảm thêm lần hai.
  - Nhánh mã BR-111 chỉ được test ở `calculateQuote`. Nhánh bậc BR-107 chỉ được test ở `calculateQuote` và `createReservation` (T14-7). Cả hai không qua `create-hold`.
  - Báo giá có mã không có oracle B1 (mục 2.3).
- Bằng chứng: probe P1a, P1b qua ở `60c25cb9`. Mã đúng hôm nay, nhưng không có test nào giữ.
- Vì sao quan trọng:
  - Đây là tiền phòng và cọc 30 % trên đơn thật, ở nhánh giảm duy nhất đang chạy trên production (mục 3).
  - Nếu hỏng, BUG-R4-041 quay lại mà CI vẫn xanh.
- Đề xuất sửa (chỉ thêm test):
  - (a) Căn 202, 21–24/12:
    - đêm 1 gõ 700.000 `edited: true`, đêm 2 gõ 650.000 `edited: true`, đêm 3 792.000 `edited: false`, `returnGuestCode: 'OTTIMO-BACK5'`;
    - `calculateQuote` → `[665.000, 618.000, 752.000]`, tổng 2.035.000, cọc 600.000;
    - `saveQuote` → `create-hold` → `stay_night` `[665.000, 618.000, 752.000]`; `total_room_vnd` 2.035.000; `deposit_required_vnd` 600.000;
    - snapshot đơn: `nights` = `manual`/700.000, `manual`/650.000, `calendar`/792.000; `losDiscountPct` 5; `manual_agreed`.
    - 650.000 × 95 % = 617.500 → 618.000 giữ luôn quy tắc làm tròn nửa lên.
  - (b) T14-7 đi tiếp qua `create-hold`: căn 101, 7 đêm 7–14/12, gõ 700.000 / 690.000 → đêm 1–2 của đơn 630.000 / 621.000; tổng và cọc = báo giá (probe: 4.431.000 / 1.300.000).
- Trạng thái: Open

### FB-R5-QA-BE-S1-02
- Mức độ: **Minor**. Trước tag v1.0.5, cùng PR test.
- Vị trí: `quote-pricing.ts` `typedNightRates` (`r.edited === true`); `sales-port.adapter.ts` (`Array.isArray(quote.nights) ? … : []`); `v5-14-quote-typed-rates.test.ts`.
- Vấn đề: hai nhánh chọn nguồn đêm chưa có test.
  1. **`edited` vắng ở báo giá** = không sửa → giá lịch máy chủ (OpenAPI `QuoteInput.nightlyRates`, SEC ARC-06).
     - Ở B1 `createReservation`, `edited` vắng = quy tắc cũ (`manual`, `pricing.service.ts` dòng 78–80).
     - Cùng tên trường, vắng cờ thì hai lệnh hiểu khác nhau. Test chỉ có `edited: false` (T14-11).
     - Probe P2a: ba đêm 700.000 không cờ → 200, cả ba đêm 792.000. Đúng hợp đồng.
  2. **Báo giá lưu trước V5-14** (snapshot không có `nights[]` và `bookingRateSource`) → giữ chỗ toàn `calendar`. Không có test (mục 1, ghi thêm). Probe P2b: xóa hai khóa trong snapshot → `create-hold` 201, mọi đêm `calendar`, đơn `calendar`.
- Vì sao quan trọng:
  - (1) Có người "thống nhất" nghĩa với B1, hoặc Desk quên cờ: giá gõ bị bỏ lặng lẽ, đúng hình BUG-R4-041.
  - (2) Lúc lên v1.0.5, production sẽ có báo giá còn hạn lưu ở v1.0.4. Ca này chỉ xảy ra một lần, không chạy lại được.
- Đề xuất sửa:
  - (1) Ca: ba đêm 700.000 không có `edited` → `calculateQuote` trả giá lịch; `saveQuote` → snapshot `calendar`, `bookingRateSource = calendar`.
  - (2) Ca: lưu báo giá; `UPDATE quote SET pricing_snapshot = pricing_snapshot - 'nights' - 'bookingRateSource'`; `create-hold` → 201; đêm và đơn `calendar`; tiền = báo giá.
- Trạng thái: Open

### FB-R5-QA-BE-S1-03
- Mức độ: **Minor**. Trước tag v1.0.5, cùng PR test. Ý (2) gộp với ARC S1-01 (3).
- Vị trí: `v5-14-quote-typed-rates.test.ts` T14-2; `v5-22-rate-bounds.test.ts` T22-1.
- Vấn đề: hai biên chưa có test.
  1. **BR-105 áp lên giá gõ** (giá lịch, trước bậc và mã), không áp lên giá sau giảm. Ca biên của T14-2 không có giảm.
     - Probe P3a: gõ 530.000 (= sàn L12) + mã → đêm 504.000, dưới sàn, vẫn 200. Gõ 529.000 + mã → 422, `min` 530.000.
     - Đúng BR-107 v0.3.8 ("giá nhập là giá lịch") và DOM ở ARC mục 3.
  2. **`dates[]` theo thứ tự ngày khi `nightlyRates` gửi lộn thứ tự.** Test chỉ gửi đúng thứ tự.
     - Probe P3b: gửi đêm 13, 11, 12 → `dates` = `[12, 13]`, `min`/`max` của đêm 12.
     - Luật này mới vào decision-log hôm nay (ARC mục 4): "`dates[]` theo thứ tự ngày, biên của `dates[0]`".
- Vì sao quan trọng:
  - (1) Nếu ai đó chuyển kiểm biên sang giá sau giảm, đơn có mã ở giá thấp sẽ bị chặn sai, và không test nào đỏ.
  - (2) Desk tô ô sai theo `dates`. Lễ tân sửa ô sau cùng thì client có thể gửi lộn thứ tự.
- Đề xuất sửa:
  - (1) Thêm vào T14-2: gõ đúng sàn + mã → 200, `amountVnd` 504.000, `calendarRateVnd` 530.000; gõ 529.000 + mã → 422.
  - (2) Thêm vào T22-1: gửi lộn thứ tự → `dates` theo thứ tự ngày. Đặt chung với ca hai đêm khác biên của ARC S1-01 (3) để `min`/`max` thật sự là của đêm sớm nhất.
- Trạng thái: Open

### FB-R5-QA-BE-S1-04
- Mức độ: **Suggestion**.
- Vị trí: `write-roles-gate.test.ts` (nhánh `pass` của `fieldCases`); `v5-14-quote-typed-rates.test.ts` (T14-5, hằng `R202_WEEKDAY`).
- Vấn đề và đề xuất:
  - (a) Nhánh `pass` chỉ kiểm "không 401/403/500". Đường dẫn fixture sai hay route đổi (404) vẫn qua. Thân lệnh là `{ nightlyRates: [] }`, nên mong đợi thật là 422 `VALIDATION_FAILED`. Đề xuất `expect(res.statusCode).toBe(422)`.
  - (b) Không ca nào kiểm: vai **ngoài** `x-roles` gửi `nightlyRates` → `access.denied` không có `reason = WRITE_ROLES` và không có `after.fields`.
    - Probe P4c: HK → `reason` null, `after` không có `fields`. Đúng.
    - Nên có ca để báo cáo S27 luôn tách được hai loại từ chối.
  - (c) Ca gửi lại cùng Idempotency-Key sau 422:
    - `create-hold` kèm `depositVnd` → 422; cùng khóa, bỏ trường → 201 (probe P4a);
    - `saveQuote` 422 `RATE_OUT_OF_RANGE`; cùng khóa, sửa giá → 201 (probe P4b);
    - ARC mục 2 (c) và SEC mục 1.1 đã nêu bằng lời. Desk `QuoteDialog` dùng lại `keys.current.hold` khi bấm lại, nên cần test.
  - (d) Chú thích `R202_WEEKDAY` "9.500.000 / 12": từ V5-1A, giá đêm lấy từ `nightlyListPriceVnd` của DS-E, không suy từ giá tháng. Sửa chú thích khi PR-C1 gộp. Số không đổi.
- Trạng thái: Open

---

## 6. Việc cho làn khác (không phải thẻ của BE)

- **ARC**: sửa dòng T14-4 ở hợp đồng mục 1.3 (mục 2.1) trong danh sách 0.3.14. Ghi oracle T14-6 mục 2.2 vào T14-6.
- **FE-A (V5-14, T14-6)**:
  - luôn gửi `edited` cho mọi đêm (OpenAPI `NightRate.edited`: "Desk luôn gửi");
  - đêm chưa có giá lịch thì không gửi 0: báo giá trả 422 `AMOUNT_NOT_POSITIVE` kể cả khi `edited: false`;
  - mock `create-hold` (`mocks/reservations.ts`) trả 422 `NOT_ALLOWED` khi thân có trường giá;
  - E2E theo oracle mục 2.2.
- **ORC**:
  - báo QA giờ deploy v1.0.5 lên staging trước ít nhất 1 giờ (TC-V105-S1-05);
  - nếu muốn chạy ca biên khác nhau giữa các đêm trên staging: cho QA thêm một dòng giá niêm yết hiệu lực xa cho một căn thử;
  - ghi dòng decision-log ở mục 7.
- **DOM**: không có việc mới. Câu BR-111 ARC đề nghị ("mã áp trên giá lịch của đêm, kể cả giá lễ tân gõ", 700.000 → 665.000) khớp ca QA.

---

## 7. Đề xuất dòng decision-log (QA tự quyết – kết luận kiểm thử)

```
| 2026-11-07 | 5 | QA review PR #103 (BE-S PR-S1) @ 60c25cb9: ĐẠT CÓ ĐIỀU KIỆN – không chặn gộp (5 tệp test 69/69, probe 9/9, toàn bộ API 4651 ca 0 lỗi trên PostgreSQL 17 tạm). Trước tag v1.0.5: FB-R5-QA-BE-S1-01…03 (Minor) vào PR test r5-s1-tests; staging v1.0.5: TC-V105-S1-01…05, 07, 08 đạt (TC-V105-S1-05 tạo dữ liệu trước deploy). Oracle: T14-4 OTA → 422 NOT_IN_LIST (channelId) theo OpenAPI, không NOT_ALLOWED; T14-6 so cọc trên hộp với cọc tính từ giá gõ và kiểm Desk gửi edited: true | QA | Quyền QA (kết luận kiểm thử) |
```

---

## 8. Toàn bộ API ở `60c25cb9` (máy QA)

- Chạy toàn bộ `vitest run` của API trên PostgreSQL 17 tạm, cùng worktree, không tính tệp probe.
- Kết quả: **180 tệp qua, 2 tệp bỏ qua; 4651 ca qua, 19 bỏ qua, 1 todo; 0 lỗi** (292 giây).
- Các dòng `ERROR [ProblemFilter]` trong log là lỗi do test cố ý gây ra (ví dụ "failure after the debt was written"), không phải ca đỏ.
- Đây là bằng chứng phụ. QA vẫn chờ job API của CI trên `60c25cb9` trước khi coi là xanh.

---

## 9. Điểm làm tốt

- `fieldCases` đọc thẳng từ fixture của QA: kiểm id, kiểm `writeRoles` khớp meta sinh, và tự lọc theo thao tác đã có route. Khi `createReservationGroup` có route, 7 ca tự chạy mà không ai phải nhớ.
- Ca "nothing saved" có mặt ở mọi nhánh lỗi: 403, 422 biên, 422 kênh, 422 trường giá của giữ chỗ. Có ca đối chứng không trường để biết 403 là do cổng chứ không do thân lệnh.
- Ví dụ số khớp business rules và tính lại được bằng tay: 700.000 → 665.000 với mã, 630.000 / 621.000 với bậc, biên 530.000 / 1.900.000.
