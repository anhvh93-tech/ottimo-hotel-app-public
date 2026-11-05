# ARC review – PR #73 phương án (A): thiếu `ota_base_rate` thì đơn OTA để trống lấy giá đêm niêm yết (điều kiện phát hành #70, BUG-R4-037)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** | 05/11/2026
- Đối tượng: `v104/ota-rate-fallback` @ `78ef6196`, một commit cắt từ `main` `c2506a53`. Đọc bằng `git diff c2506a53 78ef6196`.
- Tệp trong PR:
  - `services/api/src/modules/reservations/public/pricing.service.ts` (+11/−7);
  - `services/api/test/helpers/reservations-fixture.ts` (+15/−3, tùy chọn `otaBaseRate`);
  - test mới `services/api/test/integration/v104-ota-list-price-fallback.test.ts` (3 ca);
  - `services/api/test/reservations-pricing.test.ts` (+164, 5 ca);
  - `tests/fixtures/br-examples.json` (+27, dòng BR-103-05).
- Đọc kèm:
  - `reservations.service.ts` (B1 `create`, `createHold`);
  - `sales/internal/quote-pricing.ts`;
  - `stay-support.ts` 330–361, `move-planner.ts` 255–299, `stay-night-pricing.ts` 136–175 (các nhánh lùi về giá niêm yết đã có);
  - `pricing.ts` `calendarRate`;
  - `production-defaults.ts`;
  - `tests/tools/validate-fixtures.mjs`;
  - BE `bug-r4-037-data-impact.md` mục 1.5–1.6, 2.3–2.6, 3.2;
  - `business-rules.md` BR-005, BR-103, BR-104;
  - review trước của ARC: `ARC-on-v104-pr70-rate-carryover.md` mục 6.2.
- Số dòng theo tệp ở `78ef6196`.
- ARC tự chạy trong worktree tạm và một PostgreSQL 17 dùng một lần (đã xóa cả hai khi xong): chạy test, đảo phần src, đột biến mã.

## Phán quyết (head `78ef6196`): **ĐẠT**

Đủ 7 điều kiện ở mục 6.2 của review #70 về phía mã. Test đỏ thật khi đảo src. Không đổi schema, OpenAPI hay `api-client`. Không chồng tệp mã với #70, #71, #74. Gộp được ngay.

Một điểm BE báo không đúng: **máy chủ không có báo giá kênh OTA** (mục 3). Câu "báo giá OTA để trống cũng hết 422" trong mô tả PR, thông điệp commit và `decision-log.md` dòng 1250 cần sửa. Sai ở câu chữ, mã không sai, nên ARC không chặn gộp (thẻ BE-PR73-01).

Việc sau gộp (không phải điều kiện gộp):
1. QA đổi kỳ vọng TC-V104-RG-13 thành "đơn tạo theo giá niêm yết", rồi chạy trên bản có cả #70 và #73.
2. DOM thêm câu BR-103 (điều kiện 7, chưa có trên nhánh nào) và cập nhật hướng dẫn về khóa `ota_base_rate` (thẻ DOM-PR73-01).
3. ARC tự ghi nhánh lùi vào `erd.md` 9.1a, dòng `ota_base_rate`, sau khi gộp.

## 1. Đối chiếu 7 điều kiện (mục 6.2 review #70)

| # | Điều kiện | Kết quả | Căn cứ |
|---|---|---|---|
| 1 | Sửa đúng nhánh `group === 'ota' && otaRoomAmountVnd === undefined`; gốc giá mỗi đêm = `groupBase ?? PricingService.listPriceOn(input.room, date)` | **Đạt.** Đúng nguyên văn, theo **từng đêm**: giá niêm yết đổi giữa kỳ ở thì đêm sau lấy giá mới | `pricing.service.ts` 321–342. Đột biến M3 (lấy giá của đêm đầu cho mọi đêm) đỏ |
| 2 | Giữ `calendarRate(base, date, 'ota', p.calendar, p.otaRateUnit)` và hình dạng `{ amountVnd, calendarVnd, source:'calendar', uplift }` | **Đạt.** Kết quả trùng hệt lúc có khóa = giá niêm yết (ca đơn vị 2 so `toEqual` cả `PriceResult`). Làm tròn theo `otaRateUnit`, như `bounds()` | Dòng 334–341. Đột biến M1 (bỏ `calendarVnd`), M2 (làm tròn `nightRateUnit`), M7 (`source:'manual'`) đều đỏ. M6 (`'direct'` thay `'ota'`) sống: thẻ BE-PR73-02 |
| 3 | Thiếu giá niêm yết ở **bất kỳ** đêm nào: vẫn 422 `nightlyRates REQUIRED`, không đổi sang `roomId NOT_IN_LIST` | **Đạt.** Chỉ đổi chuỗi `detail` (chữ cho lập trình viên). FE #70 bắt theo trường, không theo `detail` | Dòng 328–333. Ca đơn vị 4 (không có giá; giá chỉ từ 31/10) và ca tích hợp 3 (201 → 422, không ghi `reservation_segment`). Đột biến M4 đỏ |
| 4 | Test 3 ca đơn vị + 1 ca tích hợp B1 OTA không giá, không khóa | **Đạt, dư.** 5 ca đơn vị (thêm "phòng không có mã nhóm" và dòng oracle BR-103-05). 3 ca tích hợp trên PostgreSQL, gồm ca kiểm thật sự không có dòng tham số | Mục 2 |
| 5 | Không sửa `production-defaults.ts` / `INV_ENTERS_KEYS` | **Đạt.** Không chạm | Danh sách tệp PR |
| 6 | Đi cùng #70; PR riêng | **Đạt.** PR riêng, không chồng tệp mã | Mục 5 |
| 7 | Ghi `decision-log.md`; DOM thêm một câu vào BR-103 | **Một nửa.** ARC (dòng 1241) và BE (dòng 1250) đã ghi. Câu BR-103 chưa có trên `main`, #71, #72, #74. Việc của DOM, không chặn gộp mã | Thẻ DOM-PR73-01 |

Thêm:
- **Không đổi hợp đồng.** Không chạm `openapi.yaml`, `api-client`, migration. Không thêm mã lỗi.
- **Không vỡ đường khác.** Mọi chỗ đọc `p.otaBaseRates` đã lùi về giá niêm yết khi thiếu khóa từ trước (`stay-support.ts` 355, `move-planner.ts` 287, `stay-night-pricing.ts` 153, `bounds()` dòng 247–254). Không có chỗ nào khác đọc thẳng tham số `ota_base_rate` (`git grep`). Ca tích hợp 201 đi trọn B1: ghi đơn, `stay_night`, folio (`money.posted`).
- **Đơn OTA không gán căn** (`allowUnassigned`) vẫn định giá theo căn đã yêu cầu (`rm` luôn là `roomId`), nên dùng giá niêm yết của căn đó.
- Có khóa thì hành vi không đổi. Ca đơn vị 3 khóa lại: khóa nhóm thắng giá niêm yết, và không cần giá niêm yết. Đột biến M5 (giá niêm yết thắng khóa) đỏ.

## 2. Chạy (worktree tạm, PostgreSQL 17 dùng một lần, tải máy ~60)

| Lượt | Kết quả |
|---|---|
| Head `78ef6196`: `reservations-pricing.test.ts` + `v104-ota-list-price-fallback.test.ts` + `reservations-fix.test.ts` (BUG-R2-017) | **111 xanh, 1 todo** (3 tệp), 210 s. Khớp số BE báo (88 + 23) |
| Đảo **chỉ** `pricing.service.ts` về `c2506a53`, giữ test | **4 đỏ / 87 xanh**, đúng lý do: ca đơn vị 1, 2, 5 đỏ với `ProblemError: ota_base_rate is not configured for this room group`; ca tích hợp 201 nhận 422 `nightlyRates REQUIRED`. Ca 3, 4 xanh, vì `main` vốn đã làm vậy (đúng ý: hai ca này khóa hành vi không đổi) |
| `tests/tools/validate-fixtures.mjs` | 0 lỗi, 1 cảnh báo có từ trước; 551 dòng, 210 dòng tính lại. Có tính lại BR-103-05 (`calc: nightRates`) |
| prettier trên 5 tệp | Sạch |
| `gh pr checks 73` | **Xanh hết** ở run `41857997120`, `headSha` = `78ef6196`. `format · lint · audit · test · build` 9m37s: api 4134 xanh, 19 bỏ qua, 1 todo; tệp tích hợp mới chạy thật (3 ca, có DB). E2E smoke 17m14s, contract, OpenAPI lint, gitleaks, confidential, infra, landing, no-test-endpoints. 3 job deploy/publish `skipping` |

ARC không chạy lại toàn bộ api ở máy này. CI đã chạy và xanh. 46 ca đỏ BE gặp ở tải 60–86 (hết giờ, tranh khóa) không chạm định giá OTA. ARC không kiểm lại số này.

### 2.1 Đột biến mã (chỉ nhánh lùi, `groupBase === undefined`), chạy 5 ca đơn vị mới

| Đột biến | Kết quả |
|---|---|
| M1 bỏ `calendarVnd` | **Đỏ** 3 ca |
| M2 làm tròn `nightRateUnit` (1.000) | **Đỏ** ca 1 (760.000 × 1,15 = 874.000, không phải 870.000). Ca tích hợp cũng bắt được (792.000 → 790.000) |
| M3 giá niêm yết của đêm đầu cho mọi đêm | **Đỏ** ca 1 |
| M4 thiếu giá niêm yết → `roomId NOT_IN_LIST` | **Đỏ** ca 4 |
| M5 giá niêm yết thắng khóa nhóm | **Đỏ** ca 3 |
| M6 lịch giá kênh `'direct'` thay `'ota'` | **Sống**. DS-E áp tăng cuối tuần cho mọi kênh (`'all'`), nên test không phân biệt được. Thẻ BE-PR73-02 |
| M7 `source: 'manual'` | **Đỏ** 3 ca |

## 3. "Báo giá kênh OTA dùng chung engine nên cũng hết 422": **không đúng, không ảnh hưởng mã**

ARC giữ nhận định lượt trước: **máy chủ không có báo giá kênh OTA.**

| Đường | Nhận kênh OTA? | Căn cứ |
|---|---|---|
| `POST /quotes/calculate`, `POST /quotes` (H12, bản xem của `BookingDialog`) | **Không.** 422 `channelId NOT_IN_LIST` | `quote-pricing.ts` 142–150 ("Trực tiếp / CTV only – BR-112"). Test có sẵn `sales.test.ts` 258–259 khóa đúng điều này (kênh Airbnb), xanh trên CI ở head này |
| Giữ chỗ `createHold` (cũng là `quotes/:id/actions/create-hold`) | **Không.** `channelId NOT_IN_LIST` | `reservations.service.ts` 993 |
| `PricingService.price()` | Chỉ 2 chỗ gọi: B1 `create` (dòng 717) và `createHold` (dòng 1040, chỉ Trực tiếp/CTV) | `git grep '\.price('` trên `src` |
| Giá ước tính web (`price-estimate`) | Chỉ kênh Trực tiếp | `public-rate.ts` 141 |

Vậy nhánh (A) chỉ chạy ở hai chỗ:
- B1 tạo đơn OTA không gửi giá;
- bước chạy thử của công cụ sửa 037 (data-impact 3.2, PA B), nếu đội làm công cụ đó. Công cụ này được lợi: thiếu khóa thì nay vẫn ra số đích, không bị 422.

Ảnh hưởng của câu sai:
- Mã: không có.
- Tài liệu: câu này đang ở mô tả PR, thông điệp commit và `decision-log.md` dòng 1250. Nếu để nguyên, QA có thể lập ca "báo giá OTA" không chạy được, và PO có thể ghi vào ghi chú phát hành (#66) một điều không có. Sửa theo thẻ BE-PR73-01.
- Có thể BE nhầm với bản xem trong hộp đặt phòng. Bản xem đó gọi `calculateQuote`, và FE vốn tắt nó khi chọn OTA.

## 4. Q0–Q5 và chỉ số

- Đêm OTA tạo theo (A) có `calendarVnd` trong bản chụp giá, và `stay_night.calendar_rate_vnd` = gross, không NULL. Ca tích hợp 2 kiểm cả hai.
  - Vì vậy đêm này không khớp dấu hiệu 037 của Q1/Q2: `calendarVnd IS NULL AND calendar_rate_vnd IS NULL`, data-impact 1.5.
  - Ở Q3, đêm này rơi vào nhóm `calendar|t|t|t` ("đường lịch OTA, đúng"). Không vào nhóm `calendar|f|f|t` (bị dính), cũng không vào nhóm "dừng và báo BE".
- Đêm bị 037 cũ (Desk gửi số của bản xem, `edited:false`) đi nhánh giá gửi lên (dòng 259–320), nhánh này PR không chạm. Đêm đó vẫn giữ dấu hiệu, nên Q1/Q2 vẫn đếm đúng.
- Doanh thu và ADR đọc `stay_night` như mọi đêm OTA theo lịch. Định nghĩa chỉ số không đổi.
- Cột `ota_chenh_uoc_tinh_vnd` của Q1 vẫn lấy `config_parameter.ota_base_rate`. Production không có dòng này, nên các đêm bị dính đếm vào `ota_dem_khong_co_gia_nen` như hiện nay.
  - Sau (A), số "đúng" của hệ thống cho đêm OTA không gõ giá chính là giá niêm yết. BE có thể cho cột này lùi về `room_list_price` theo `stay_date` cho khớp. Không bắt buộc, không thuộc PR này.
  - Lưu ý: production không tăng giá cuối tuần (BR-104 v0.5.1), nên đêm OTA bị 037 thường có số đang ghi bằng giá niêm yết, tức chênh ước tính 0 (data-impact 1.7 (a)). Giá OTA thật vẫn phải đối với sao kê OTA (BR-112).

## 5. Chồng tệp và thứ tự gộp

| PR / nhánh | Tệp chung với #73 | `git merge-tree` |
|---|---|---|
| #70 `v104/fix-booking-rate-carryover` @ `98d8a3ad` (chỉ admin-web) | Không | Sạch |
| #71 `v104/fix-internal-added-night` @ `7557e485` (`stay-support`, `stay.service`, `checkin`, `checkout`, `folio-lines`, `stay-night-pricing`) | Chỉ `br-examples.json`, khác khúc: #71 sửa đầu tệp (`version` 0.5.3) và thêm BR-421-04… ở dòng ~9907; #73 thêm BR-103-05 ở dòng 1188 | Sạch |
| #74 BUG-R4-039 `v104/fix-checkin-occupied-exception` @ `9646029d` (`checkin.service.ts`) | Chỉ `br-examples.json`, khác khúc: #74 sửa dòng `owner` đầu tệp và thêm BR-402-03/04 ở dòng ~7357 | Sạch |
| #72 `v104/ba-docs-r4c`, `v104/fe-hold-typed-rate-lock` | Không | – |

- Mô phỏng gộp nối tiếp vào `main` `ea979fe7` theo 3 thứ tự: 73→70→71→74, 70→71→74→73, 74→71→73→70. **Cả 3 đều sạch.**
- #71 và #74 không sửa `pricing.service.ts`. Cả hai còn mang bản của `main`, với chuỗi `detail` cũ. Gộp sau #73 thì bản của #73 được giữ, không xung đột.

**Thứ tự đề nghị với #70:**
- Gộp **#73 trước** #70, hoặc cùng lượt, để bản cắt v1.0.4 có cả hai. Mã không phụ thuộc nhau.
- #73 đứng một mình là an toàn. Desk cũ vẫn điền ô OTA từ bản xem (lỗi 037), nên đi nhánh giá gửi lên. Nhánh (A) chỉ đổi ca ô OTA trống, từ 422 thành giá niêm yết.
- #70 đứng một mình cũng an toàn. Ô OTA trống thì 422, và Desk hiện câu "Nhập giá mỗi đêm" (điều kiện 1 của phán quyết #70). Chỉ là bất tiện cho lễ tân.
- **Nếu ORC đi đường hotfix trên nhánh `v1.0.3`**, thay vì cắt v1.0.4 từ `main`, thì cherry-pick `78ef6196` lên `v1.0.3` **xung đột** ở `reservations-pricing.test.ts`. Ca 5 (BR-103-05) dùng `pp`/`roomOf` của P4-11, mà hai hàm này chưa có ở `v1.0.3`.
  - Phần src, helper, test tích hợp và fixture đều sạch: `pricing.service.ts` và `reservations-fixture.ts` ở `v1.0.3` giống hệt `c2506a53`.
  - Nếu đi đường này, BE bỏ hoặc viết lại ca 5 trên nhánh hotfix.
  - Cắt v1.0.4 từ `main` thì không gặp vấn đề này.

Ghi chú cho FE, không phải thẻ: test #70 `v104-booking-rate-carryover.test.tsx` dòng 483–490 giả lập 422 kèm `detail` cũ, với tiêu đề "room group without an OTA base rate".
- Sau #73, máy chủ chỉ còn trả 422 này khi căn **thiếu giá niêm yết**.
- Test vẫn đúng và vẫn xanh, vì FE bắt theo trường chứ không theo `detail`.
- Khi FE chạm tệp ở v1.0.5, nên đổi tiêu đề và `detail` cho khớp.

## 6. Thẻ feedback

### FB-R4-ARC-BE-PR73-01
- Mức độ: Minor (sửa chữ, không chặn gộp)
- Vị trí: mô tả PR #73 (đoạn **Problem**: "An OTA booking or OTA quote left empty…"); thông điệp commit `78ef6196` ("An OTA booking (or OTA quote)…"); `01-decisions/decision-log.md` dòng 1250 ("Báo giá OTA để trống cũng hết 422").
- Vấn đề: máy chủ không có báo giá kênh OTA.
  - `calculateQuote`/`saveQuote` trả 422 `channelId NOT_IN_LIST` cho kênh OTA (`quote-pricing.ts` 142–150; test `sales.test.ts` 258–259).
  - `createHold` cũng chỉ nhận Trực tiếp/CTV (`reservations.service.ts` 993).
  - `PricingService.price()` chỉ được gọi ở B1 và `createHold`. Bằng chứng ở mục 3.
- Vì sao quan trọng:
  - `decision-log.md` là nguồn để QA lập ca và PO viết ghi chú phát hành v1.0.4. Một câu sai về hành vi tiền có thể thành ca test không chạy được, hoặc thành lời hứa với INV về một chức năng không có.
- Đề xuất sửa:
  - BE sửa mô tả PR: "Only `POST /reservations` (B1) reaches this branch; quotes and holds accept direct/agent channels only."
  - ORC sửa dòng 1250, bỏ ý "báo giá OTA". Có thể thay bằng "công cụ sửa 037 (data-impact 3.2 PA B) chạy thử được khi thiếu khóa".
  - Thông điệp commit giữ nguyên, không viết lại lịch sử. Khi gộp bằng squash thì sửa trong thông điệp squash.
- Trạng thái: Open

### FB-R4-ARC-BE-PR73-02
- Mức độ: Suggestion (cùng PR nếu BE còn chạm tệp; không thì v1.0.5)
- Vị trí: `reservations-pricing.test.ts`, khối `OTA booking without a price when ota_base_rate is missing`.
- Vấn đề: đột biến M6 (nhánh lùi gọi `calendarRate(…, 'direct', …)` thay `'ota'`) vẫn 5/5 xanh. Lý do: `params` DS-E có `weekend_uplift_channels` = `'all'`. Đối số kênh `'ota'` là một nửa của điều kiện 2, nhưng chưa có ca nào khóa nó.
- Vì sao quan trọng:
  - Production hiện để `'all'` và tăng 0 %, nên hôm nay không lệch tiền.
  - Nhưng OWN đổi được tham số phạm vi kênh. Nếu một lần sửa sau làm nhánh lùi đi theo lịch Trực tiếp, đêm OTA sẽ nhận mức tăng của kênh khác mà CI vẫn xanh.
- Đề xuất sửa: thêm 1 ca. Không khóa, `weekend_uplift_channels: ['direct', 'agent']`. Đêm thứ Sáu và thứ Bảy của đơn OTA phải bằng giá niêm yết (`uplift: 'none'`), và trùng kết quả lúc có khóa.
- Trạng thái: Open

### FB-R4-ARC-QA-PR73-01
- Mức độ: Suggestion (QA + DOM; v1.0.5)
- Vị trí: `tests/tools/validate-fixtures.mjs` `calendarRateFor` dòng ~126–134; `business-rules.md` BR-005 v0.5.0; `production-defaults.ts` dòng 479 (`rounding.ota_rate` = 10.000).
- Vấn đề:
  - (a) Máy làm tròn mọi đêm OTA theo `otaRateUnit`, kể cả đêm không tăng giá (`calendarRate` dòng 94: `roundVnd(baseVnd, unit)`). Validator thì trả nguyên `baseVnd` cho đêm không tăng.
    - Trước (A), gốc OTA luôn là khóa nhóm (760.000 / 1.050.000 / 980.000, đều chẵn 10.000), nên không lộ ra.
    - Nay gốc có thể là giá niêm yết lẻ, ví dụ DS-E căn 203 = 792.000. Máy ra 790.000, validator ra 792.000. Dòng oracle OTA ngày thường trên giá lẻ sẽ báo sai.
  - (b) BR-005 v0.5.0 ghi "giá OTA = giá đêm (một mức giá)", và chỉ ghi làm tròn OTA 10.000 cho giai đoạn "trước v0.5.0". Production vẫn khởi tạo `rounding.ota_rate` = 10.000.
    - Giá niêm yết 01/11 đều chẵn 10.000 và không tăng cuối tuần, nên hôm nay OTA = Trực tiếp.
    - Nếu INV đặt giá lẻ, ví dụ 795.000, thì đơn OTA để trống sẽ ra 800.000. Cách tính này giống hệt lúc có khóa = giá đêm, nên (A) đúng điều kiện 2. Nhưng kết quả lệch "một mức giá".
- Vì sao quan trọng: oracle là chuẩn để đối chiếu tiền. Hai cách làm tròn khác nhau cho cùng một quy tắc sẽ gây báo đỏ oan, hoặc che lệch thật.
- Đề xuất sửa:
  - (a) QA cho validator làm tròn cả đêm không tăng: `roundTo(baseVnd * 100, 100, step)`.
  - (b) DOM chốt: theo BR-005 v0.5.0 thì OWN đặt `rounding.ota_rate` = 1.000. Đây là đổi tham số, không sửa mã, và không cần ESC, vì INV đã quyết "một mức giá" (ESC-043 C). Nếu DOM giữ 10.000 thì ghi rõ vào BR-005.
- Trạng thái: Open

### FB-R4-ARC-DOM-PR73-01
- Mức độ: Minor (tài liệu, đi cùng v1.0.4)
- Vị trí: `business-rules.md` BR-103; hướng dẫn B6 và tin nhắn INV 7.3 của DOM (`DOM-on-v104-pr68-docs.md`); đầu tệp `br-examples.json` (dòng `owner`).
- Vấn đề:
  - (a) Điều kiện 7 của (A) chưa làm: BR-103 chưa có câu "thiếu `ota_base_rate` thì đơn OTA không nhập giá theo giá đêm niêm yết của căn". ARC đã tìm trên `main`, #71, #72, #74.
  - (b) Sau (A), **không có** dòng `ota_base_rate` lại là trạng thái an toàn hơn cho v1.0.x:
    - không có dòng: đơn OTA để trống và sàn–trần BR-105 tự đi theo giá niêm yết của từng căn, kể cả giá đã hẹn ngày đổi;
    - có dòng: khóa nhóm **thắng** giá niêm yết, nên OWN phải đổi khóa cùng lúc với mỗi lần đổi bảng giá, nếu không thì đơn OTA để trống ra giá cũ.
    - Câu hiện tại "OWN giữ bằng giá đêm của nhóm" chưa nói rủi ro này.
  - (c) Dòng oracle BR-103-05 do BE thêm (labels `INV-043`, `INV-045`, `NGÀNH`), nhưng phần nhật ký ở đầu tệp không ghi dòng này.
- Vì sao quan trọng:
  - INV và lễ tân đọc BR-103 và hướng dẫn B6 để biết có cần nhập khóa hay không.
  - Đổi bảng giá mà quên đổi khóa là ghi sai tiền OTA, và không ai thấy cho tới khi đối soát.
- Đề xuất sửa:
  - (a) DOM thêm câu BR-103 nêu trên.
  - (b) DOM ghi: "v1.0.x không cần nhập `ota_base_rate`. Đã nhập thì phải đổi cùng lúc với bảng giá, hoặc nhờ OPS gỡ dòng". Nới hướng dẫn B6 và tin INV 7.3 như mô tả PR #73 gợi ý. Câu sổ tay "đơn OTA ghi đúng tiền OTA thu (BR-112); gõ giá theo extranet khi khác giá niêm yết" giữ nguyên.
  - (c) DOM rà dòng BR-103-05. QA thêm "BR-103-05 (BE, #73)" vào nhật ký đầu tệp ở lần chạm fixture kế tiếp, **sau** khi #74 gộp, vì #74 sửa đúng dòng `owner` đó. Không sửa trong #73, để tránh xung đột.
- Trạng thái: Open

## 7. Rủi ro còn lại (chấp nhận được, như mục 6.2 review #70)

- Trước đây, 422 buộc lễ tân gõ giá theo xác nhận OTA. Nay máy chủ tự lấy giá niêm yết. Nếu OTA chạy khuyến mãi riêng, số ghi sẽ lệch tiền OTA thu. Đây đúng là hành vi khi đã có khóa (BUG-R2-017). BR-112 và sổ tay 5.3 vẫn dặn gõ giá theo extranet.
- Nếu production còn tăng giá cuối tuần, tức OWN chưa đặt 0 % theo BR-104 v0.5.1, thì đơn OTA để trống nhận mức tăng của lịch OTA, làm tròn 10.000. Có thể lệch Trực tiếp tối đa 5.000 một đêm, ví dụ 1.100.000 × 1,15: Trực tiếp 1.265.000, OTA 1.270.000. Có khóa thì cũng y như vậy.

## 8. Điểm làm tốt

- Sửa **đúng một chỗ, đúng nghĩa**: `groupBase ?? listPriceOn(room, date)` theo từng đêm, giữ nguyên `calendarRate` và hình dạng đêm. Ca đơn vị 1 đối chiếu từng đêm với một lượt định giá có khóa = giá niêm yết của chính đêm đó. Ca 2 so `toEqual` cả `PriceResult`. Đây là cách chứng minh "trùng hệt lúc có khóa" chặt nhất có thể.
- Ca tích hợp chạy trên một cơ sở **thật sự không có dòng tham số**: có ca kiểm `config_parameter` rỗng, và có tùy chọn `seedBooking({ otaBaseRate: false })` mà mặc định giữ nguyên. Ca này đi trọn B1 tới `stay_night.calendar_rate_vnd`, nên khóa luôn điều kiện "Q0–Q5 không dương tính giả" ở tầng dữ liệu, không chỉ ở bản chụp giá.
- Mô tả PR có số đỏ/xanh trên `main`, nêu rõ ca nào xanh sẵn và vì sao. Có ghi chú làm tròn 792.000 → 790.000. Có nêu thứ tự gộp, và nói rõ phần tài liệu không nằm trong PR. ARC kiểm lại được từng câu, trừ câu ở thẻ 01.
