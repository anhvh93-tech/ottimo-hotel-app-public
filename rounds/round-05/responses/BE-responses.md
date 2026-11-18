# Round 5 – Phản hồi thẻ của BE

ORC ghi theo báo cáo của từng lượt BE (BE không tự push lên `main`). Trạng thái "Done" nghĩa là đã có trên nhánh PR; thẻ đóng hẳn khi PR gộp với CI xanh.

## BE-A1 (07/11)

| ID | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-ARC-BE-A1-01 | Done | ARC đã kiểm (#127) |
| FB-R5-ARC-BE-V546-01 | Done | ARC đã kiểm (#113, đã gộp) |
| FB-R5-DOM-BE-PR106-01, FB-R5-SEC-BE-A1A-01, FB-R5-SEC-BE-A1B-01 | Done | #127 |
| FB-R5-SEC-BE-127-01 | Done | `6a670f3a` (#127) |
| FB-R5-ARC-BE-127-01 | Done | `ad507f94` (#127) |
| FB-R5-DOM-BE-PR114-01, FB-R5-ARC-BE-114-01, FB-R5-ARC-BE-114-02 | Done (lên ở lần push #114, sau khi #127 gộp) | `6a086d41`, `8a5f8145`, `9aafc549` |
| FB-R5-SEC-BE-113-01, FB-R5-ARC-BE-113-01 | Done ở PR test bổ sung (chưa mở) | `d574b518` |

## PR #180 – FB-INV-010 Đợt 1 (giá tháng công khai) – head b2d60596, CI xanh (gồm E2E smoke)
| Thẻ | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-ARC-BE-180-01 | Done | Câu trong mô tả `getPublicMonthlyRates` + changelog (d) + PR, `b2d60596` |
| FB-R5-ARC-BE-180-02 | Done | Release note trong changelog (e) + PR, không đổi code |
| FB-R5-ARC-BE-180-03 | Done | Gom theo slug, `slice(0,20)`, thêm 1 ca unit, `b2d60596` |
| FB-R5-ARC-BE-180-04 | Done | Changelog ghi ARC duyệt, `b2d60596` |
| FB-R5-ARC-BE-180-05 | Done | E2E smoke xanh ở `b2d60596` |

Câu hỏi DOM trong PR – ORC đóng theo quyết định INV 16/11: (1) không giảm kỳ hạn trên web (một giá tháng); (2) web không ghi +10 % khách NN – báo giá xử lý; (3) `rounding.monthly_rent` 10.000 vs BR-005 1.000 – kết quả như nhau với bảng giá hiện tại, để DOM rà ở Đợt 2.

## PR #190 – FB-INV-012 phiếu thanh toán tháng (Phản hồi & sửa 18/11)

Review: `rounds/round-05/reviews/ARC-on-be-pr-190.md`, `SEC-on-be-pr-190.md`; thẻ UXD FE-189-01/02 (phần dữ liệu BE). Mọi thay đổi chỉ thêm, OpenAPI vẫn 0.3.14-draft (mục "Sửa sau review 18/11").

| Thẻ | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-ARC-BE-190-01 | Done | **Đầu kỳ < cuối kỳ trước, không có `exception`** (cảnh báo hai bước):<br>- lần gửi đầu → 422 `OPENING_BELOW_PREVIOUS_CLOSING` (`meter`, `previousValue`, `previousReadingId`, `previousKind`);<br>- gửi lại với `acknowledgeLowerThanPrevious: true` → lưu, mọi vai FD+;<br>- `gap` âm lưu nguyên. Không thêm cột: suy ra từ `gap < 0`;<br>- audit có `acknowledgedLower: true`;<br>- nháp phiếu có cảnh báo cùng mã (`roomNo`, `meter`, `opening`, `previousClosing`, `readingId`). Phát hành phải `acknowledgeWarnings`.<br>**Cuối kỳ < đầu kỳ:** vẫn 422 `METER_LOWER_THAN_PREVIOUS`.<br>**Test:** 1.390 < 1.392 → 422, gửi lại với cờ (FD, có ảnh thật) → 201, `gap.electricity = -2`; nháp tháng 1 có cảnh báo; phát hành không xác nhận → 422 |
| FB-R5-ARC-BE-190-02 | Done | **Ứng viên thêm `rooms[]`:** `roomId`, `roomNo`, `opening`, `closing`, `nextOpening`.<br>- `closing` lấy theo cùng kiểm tra lúc phát hành (`compute().missing`), nên danh sách không báo "đủ" mà phát hành lại 422.<br>- `readingStatus` tổng hợp gồm cả đầu kỳ; giữ `roomNos`.<br>- Có thêm đơn `checked_out` trong `readingWindow.daysAfter` cần phiếu `final`.<br>**Test:** ngày 02/02, phiếu `final` thiếu cuối kỳ tháng 1 → `rooms` = opening `exception`, closing `missing`, nextOpening `missing`.<br>**Chưa có test** riêng cho đơn đã trả phòng (chỉ có code) |
| FB-R5-ARC-BE-190-03 | Done | **Đọc trễ:** FDL+ gửi `lateReason` (3–300 ký tự, qua `freeText`), tối đa `readingWindow.lateMaxDays` ngày sau cửa sổ (tùy chọn, 0–31, mặc định 10; hook kiểm biên).<br>- FD, hoặc FDL thiếu lý do → 422 `READING_OUT_OF_WINDOW`, kèm `lateUntil` và `lateNeedsRole: front_desk_lead`.<br>- Lưu vào cột mới `late_reason` và `late_approved_by` (trong 0099), có CHECK.<br>- Audit `meter_reading.late`; cảnh báo nháp `READING_LATE`.<br>**Test:** cuối kỳ tháng 1 đọc ngày 02/02: FD → 422 (`lateUntil` 2027-02-11), FDL không lý do → 422, FDL có lý do → 201; phiếu `final` có `READING_LATE`; `lateMaxDays: 40` → 422 |
| FB-R5-ARC-BE-190-04 | Done | Thêm 4 trường:<br>- `BillingPeriod.excludedLines` (chỉ nháp, không cộng vào tổng);<br>- `replacesCode`;<br>- `MeterReading.readByInitials` (chữ cái đầu, không trả họ tên);<br>- `onIssuedStatement` (cùng điều kiện với `voidMeterReading`).<br>Mỗi trường có test |
| FB-R5-ARC-BE-190-05 | Done | Thêm `payment_billing_period_fk` (`property_id`, `billing_period_id`) → `billing_period` ngay trong 0099. Mọi dòng cũ đều null. Test tĩnh khẳng định ALTER duy nhất trên `payment` là FK này |
| FB-R5-ARC-BE-190-06 | Done | Chọn kiểm lúc khởi động: `PaymentsModule.onApplicationBootstrap` dừng app nếu chưa có listener của BillingModule.<br>Worker không nạp Nest `PaymentsModule` và không đi đường đảo phiếu thu, nên không bị ảnh hưởng.<br>**Còn lại cho ARC:** chưa ghi vào `architecture.md` mục cổng module |
| FB-R5-ARC-BE-190-07 | Open (trước production) | OPS hoặc QA chạy 0099 trên bản sao staging. BE không đụng staging |
| FB-R5-ARC-BE-190-08 | Done | `totals.unreconciledVnd` (khoản thu `pending`/`disputed` chưa bị đảo) và `totals.disputed`. Không đổi máy trạng thái phiếu |
| FB-R5-ARC-BE-190-09 | Dời | Gom truy vấn khi có cơ sở thứ hai, theo đề xuất ARC |
| FB-R5-SEC-BE-190-01 | Done | **Mốc lưu giữ ảnh:** `AttachmentService.setMeterRetentionAnchor`, gọi từ `RegistrationService.onCheckedOut`, chạy cả khi đơn không có hồ sơ khai báo.<br>- Đặt mốc cho mọi ảnh `meter` gắn vào lần đọc của đơn (kể cả lần đọc đã hủy) và mọi ảnh `meter` upload theo đơn.<br>- Chỉ dời mốc về sau. J16 đã xóa `meter` theo `attachment_ops_retention_months`.<br>- `anchorMissing` đếm cả `meter`.<br>**Test:** trả phòng → mọi ảnh `meter` của đơn có mốc.<br>**Chưa làm:** đơn hủy/no-show có ảnh (đơn `in_house` không hủy được); test J16 xóa ở mốc + 12 tháng |
| FB-R5-SEC-BE-190-02 | Done | Thêm audit `billing_period.updated` khi điều chỉnh kỳ trước hoặc danh sách dòng dời thay đổi:<br>- `before`/`after` = `{priorAdjustmentVnd, excludedFolioLineCount}`;<br>- lý do điều chỉnh đi vào `reason`.<br>`issued` thêm 2 trường này vào `after`; allowlist cập nhật.<br>**Test:** 4 dòng nhật ký (dời, đưa lại, đặt −10.000, bỏ) |
| FB-R5-SEC-BE-190-03 | Done | `getBillingPeriodPrint` trả **allowlist** (schema `BillingPeriodPrint` riêng): không có ghi chú, lý do, folio, giá chụp, thao tác.<br>**Test:** `not.toMatch(/"note"\|[rR]eason\|folioId\|…/)` |
| FB-R5-SEC-BE-190-04 | Done | Test với tài khoản nhận giả (`0000000000`, BIN công khai):<br>- nội dung chuyển khoản chỉ có mã phiếu, không có tên khách;<br>- 4 số cuối; số đầy đủ chỉ nằm trong payload;<br>- số tiền QR = số dư (9.502.000; phiếu tháng 11 2.113.000);<br>- số dư 0 → `vietqr: null` |
| FB-R5-SEC-BE-190-05 | Dời | Chờ `attachment` có khóa duy nhất `(property_id, id)` |
| FB-R5-SEC-BE-190-06 | Done | Hủy phiếu đã phát hành: kiểm quyền FDL+ trước, nên FD nhận 403 trước 409. Có test |
| FB-R5-UXD-FE-189-01 (phần BE) | Done | Dòng điện, nước có sẵn `netVnd` (chưa VAT) và `vatVnd` riêng; `totals.netVnd` là Subtotal, `totals.vatVnd` là dòng VAT duy nhất. Trang in giữ đủ các trường này. **Test:** điện 568.000 + VAT 45.440; tổng 9.453.000 / 49.690 / −690 / 9.502.000 |
| FB-R5-UXD-FE-189-02 (phần BE) | Done | Mỗi dòng có `periodMonth` (`YYYY-MM`):<br>- thuê: kỳ thuê;<br>- điện, nước: kỳ điện nước (M−1);<br>- dịch vụ: ngày dịch vụ;<br>- làm tròn, điều chỉnh: null.<br>Phiếu và trang in đã có sẵn `rentPeriod`, `utilityPeriod`, `servicePeriod`. **Test:** phiếu tháng 12 → thuê 2026-12, điện/nước/dịch vụ 2026-11 |

**Lượt 2 – bổ sung (18/11, ORC quyết sửa trong #190):**

| Thẻ | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-ARC-BE-190-12 | Done | **Lần đọc `checkin` và `room_change_*` gắn với ngày thật** (`eventDateOf`):<br>- `checkin`: ngày đến, chỉ cho căn nhận lúc đến; `room_change_in`: ngày chuyển vào căn; `room_change_out`: ngày rời căn (đoạn sau là căn khác). Nhiều lần đổi thì lấy lần gần nhất ≤ `readOn`;<br>- cửa sổ [ngày sự kiện, + `readingWindow.daysAfter`]; trễ hơn tới `lateMaxDays` → FDL+ kèm `lateReason` (cùng cơ chế BE-190-03, audit `meter_reading.late`, cảnh báo `READING_LATE`); ngoài nữa → 422 `READING_OUT_OF_WINDOW`;<br>- căn không có sự kiện đó → 422 `kind` `NOT_ALLOWED`.<br>**Một lần đọc sống:** `checkin` một lần cho mỗi (đơn, căn) – kiểm trong service và chỉ mục duy nhất từng phần `meter_reading_checkin_live_key` (thêm thẳng vào 0099, chưa merge); `room_change_*` một lần cho mỗi lần đổi (kiểm trong service, trong khoảng cửa sổ + đọc trễ) → 409 `READING_EXISTS`.<br>**`rooms[]`** thêm `openingKind` (`checkin` / `room_change_in` / `period_start`) và `segmentFrom` (ngày đến hoặc ngày đổi căn).<br>**Test** (describe mới): `checkin` ngày 15 của đơn vào 01/11 → 422 không có `lateUntil`; FDL ngày 10 không lý do → 422 `lateUntil` 12/11; FDL có lý do → 201 `late`; `checkin` thứ hai → 409; INSERT thẳng → vướng chỉ mục; nháp có `READING_LATE`; đổi căn 10/12: sai căn → `NOT_ALLOWED`, trước ngày đổi → 422, `room_change_out`/`room_change_in` → 201, lần hai → 409; `rooms[]` tháng 01 = 203 `period_start`, 202 `room_change_in` 2026-12-10.<br>OpenAPI: mô tả `recordMeterReading`, bảng mã lỗi, `rooms[]`, changelog "Lượt 2". ARC cập nhật hợp đồng mục 11.2 |
| FB-R5-ARC-BE-190-11 | Done | Test mới: đơn `checked_out` (ra 20/02) có trong ứng viên tháng 02 với `kind: final` ngày 20/02 và 21/02 (`daysAfter` 1), không còn ngày 22/02 |
| FB-R5-UXD-FE-189-11 (phần BE) | Done | `BillingPeriodPrint.roomNames`: tên phòng cho khách (The Mist…), cùng thứ tự `roomNos`, null khi chưa đặt tên. Đọc tên hiện tại của `room` (đổi tên sau phát hành thì giấy in lại theo tên mới; số căn và tiền không đổi). Test: tên giả "The Mist" |
| FB-R5-ARC-BE-190-10 | Chờ OPS | CI đỏ ở `pnpm audit` (picomatch GHSA-fc5q-39xc-vjpf). BE merge `origin/main` khi ngoại lệ của OPS vào main |

**Phát hiện thêm khi viết test SEC BE-190-01** (BE tự sửa, báo ARC/SEC):
- `uploadAttachment` vẫn trả 422 `NOT_IN_LIST` cho `purpose=meter`. Danh sách `PURPOSES_ACCEPTED_NOW` còn ghi chú "chờ bản ghi R3", nên trước bản sửa này **không ai tải được ảnh đồng hồ**.
- Đã thêm `meter` vào danh sách và sửa test cũ trong `files-attachments`.
- MT vẫn tải được ảnh `meter` (quyền upload cũ), nhưng không ghi được lần đọc. Ảnh không gắn vào lần đọc nào thì J16 xóa sau `attachment_unbound_days`.

Ghi chú cho DOM (ARC BE-190-03): đầu kỳ đọc trễ thì phần dùng từ ngày 01 tới ngày đọc nằm trong `gap`, không tính cho khách. Đây là cách INV chọn.

## QA staging 18/11 – FB-INV-012 (nhánh `r5-fb012-be-qa-fixes`)

Bug: `rounds/round-05/qa/bug-list.md`. Không có migration mới.

| Bug | Trạng thái | Ghi chú |
|---|---|---|
| BUG-R5-008 (P2) | Fixed | **Đọc trễ xét theo ngày nhập** (`pc.today`, ngày nghiệp vụ của cơ sở), không chỉ theo `readOn`. Áp cho mọi loại có cửa sổ (`checkin`, `room_change_*`, `period_start`, `period_end`).<br>- `readOn` trong cửa sổ và nhập trước hết `windowTo` → ai trong FD+ cũng lưu được;<br>- nhập sau `windowTo` tới `lateUntil` → chỉ FDL+ kèm `lateReason`, `late=true`, cảnh báo `READING_LATE`; FD → 422 `READING_OUT_OF_WINDOW` kèm `lateUntil`;<br>- nhập sau `lateUntil` → 422, không còn đường ghi trễ;<br>- `readOn` sau hôm nay → 422 `readOn` `DATE_INVALID` (đã có, nay có test).<br>**Test:** `period_end` 12/2026 nhập ngày 05/01 với `readOn` 31/12: FD (ảnh thật) → 422 `lateUntil` 11/01; FDL không lý do → 422; `readOn` 06/01 → `DATE_INVALID`; FDL có lý do → 201 `late`; ngày 12/01 → 422 không `lateUntil`. Sửa một test cũ ghi đầu kỳ tháng 12 lùi ngày (đúng kiểu lỗi này) |
| BUG-R5-010 (P3) | Fixed | Nguyên nhân: bộ sinh `scripts/gen-openapi-meta.mjs` biến `allOf: [$ref kiểu vô hướng]` (cách thêm `description` cho `MoneyVnd`) thành object rỗng đóng, nên serializer bỏ trường. Nay `allOf` một phần tử không phải object thì lấy đúng kiểu được bọc. Sinh lại chỉ đổi 2 trường: `BillingPeriodTotals.unreconciledVnd` và `BillingPeriodLine.periodMonth`.<br>**Test:** ghi thu VietQR 1.000.000 → `totals.unreconciledVnd` 1.000.000, `disputed: false` trong phản hồi ghi thu và `GET`; sau khi đảo khoản thứ hai vẫn 1.000.000 |
| BUG-R5-013 (P3) | Fixed | `utilityPeriod` / `servicePeriod` = null khi kỳ kết thúc trước ngày đến (phiếu tháng nhận phòng). Áp cho nháp và lúc phát hành (cột kỳ lưu null). Phần tính vẫn giữ kỳ cũ (không có dòng nào), các tháng sau không đổi. FE in chỉ kỳ thuê khi null.<br>**Test:** phiếu tháng 11 (đến 20/11) → `utilityPeriod: null`, `servicePeriod: null` |

## Go-live fix – FB-INV-012 §12 (Sản xuất 18/11, nhánh `r5-fb012-golive-be`)

Hợp đồng: `rounds/round-05/fb-inv-012/contract.md` §12. OpenAPI **0.3.15-draft** (chỉ thêm). Migration `0100_go_live_fix_fb_inv_012.sql` (chỉ thêm, journal idx 74).

### Việc đã làm (BE-1…BE-12)

| # | Trạng thái | Ghi chú |
|---|---|---|
| BE-1 | Xong | 0100 gồm 5 mục của 12.7. Không `UPDATE`/`DELETE`. `0074_snapshot.json` của main giữ nguyên (drizzle-kit ghi đè lúc sinh, đã trả lại). Test tiền tố migration nới tới 0999 (ARC G8) |
| BE-2 | Xong | `MIGRATION_LOCK_TIMEOUT` 10s, ghi đè bằng biến môi trường 1s–120s (sai → dừng trước khi kết nối). Đặt **sau** khóa advisory và `SET ROLE`. Hết giờ (55P03) → `MigrationLockTimeoutError`: tên migration đang chờ + "retry off-peak", không file nào được ghi. **Test Q25:** phiên khác giữ khóa → lỗi trong ~1s, `__drizzle_migrations` không thêm dòng, cột không được thêm |
| BE-3 | Xong | `backdatedArrival {reason}` + hàm biên dùng chung `shared/backdate.ts` (`backdateBounds`). FDL/FD → 403 + một `access.denied` |
| BE-4 | Xong | `checkInBackdated` (service riêng, `checkIn` không đổi). Dùng lại `evaluate` (bỏ `room_ready`, thêm `room_occupied`), `syncLeaseNights`, hook B9. Dời ngày đến khi khác đơn. `allowedActions.check_in_backdated`, `Reservation.checkinBackdatedOn` |
| BE-5 | **Một phần** | Xong 12.1.3: cửa sổ chỉ số nhận phòng của đơn nhận phòng bù. **Chưa làm 12.5** (`catchUp`, `READING_CATCH_UP`): phần DB (`meter_reading.catch_up` + CHECK) đã có trong 0100. Hạn của 12.5 là 11/12 (contract 12.10), làm ở PR sau |
| BE-6 | Xong | `settleBillingPeriodOutsideDesk`, đường `recordInTx` riêng cho `outside_desk`, chặn hoàn tiền, `money-actions.ts`, `staff_notification` cho OWN |
| BE-7 | Xong | `getPropertyContact` / `setPropertyContact` theo mẫu Wi-Fi |
| BE-8 | **Chưa làm** | Khóa `long_stay_cleaning_fee_by_room` đã có trong `config_parameter_def` (0100, OWN/MGR, mặc định `{}`). Chưa có hook kiểm, `cleaningFeeFor`, `getChargeCatalog?folioId`. Hạn 29/11; trước đó lễ tân dùng cách tạm (dòng phần chênh, go-live-guide 5.3) |
| BE-9 | Xong | `openapi.yaml` 0.3.15-draft, `generated/*` và api-client sinh lại. `rbac-matrix.md` 0.2.11 (A127–A130, ghi chú 50, ghi chú A34/A101 – **không sửa mục 3**, `screens.ts` không đổi) + `.json` 0.2.11, `rbac-cases` sinh lại, `erd.md` |
| BE-10 | **Chưa làm** | Seed dev/e2e. Test tích hợp tự dựng dữ liệu nên không cần seed. Làm cùng PR 12.4/12.5 |
| BE-11 | Một phần | 190-08 xong: `onReservationVoided` đặt mốc lưu ảnh `meter` (SEC 12-08) + test. 190-07 (test J16 xóa ảnh `meter`) chưa làm, hạn 31/12 |
| BE-12 | Xong | Xem Q16 dưới |

### Trả lời review SEC (`rounds/round-05/reviews/SEC-on-arc-contract-12.md`)

| Thẻ | Trạng thái | Cách làm và test |
|---|---|---|
| FB-R5-SEC-ARC-12-01 (Major) | Fixed | (1) `backdatedArrival` kèm `closerUserId` khác null → 422 `closerUserId: NOT_ALLOWED`. Đơn nhập bù không có người chốt nên không có dòng `commission`. (2) Đổi người chốt trên đơn nhập bù (`checkin_backdated_on` có giá trị, hoặc ảnh chụp giá có `backdatedArrival`) chỉ OWN; MGR → 403 + một `access.denied`.<br>**Test:** MGR backdated + closer = chính mình → 422; MGR đổi người chốt → 403 (+1 `access.denied`); OWN → 200; không có dòng `commission` sau khi tạo |
| FB-R5-SEC-ARC-12-02 (Major) | Fixed | `x-requires-trusted-device: true`. MGR chỉ được ghi khi đủ cả ba: (a) phiếu có kỳ thuê chứa ngày đến của đơn có `checkin_backdated_on`; (b) số tiền ≤ tổng dòng `rent` − đã thu; (c) `receivedOn` ≤ `checkin_backdated_on`. Khác → 403 `FORBIDDEN_ACTION` "owner only" + một `access.denied` (`auditReason` `OUTSIDE_DESK_OWNER_ONLY`). OWN giữ luật 12.2.<br>**Test:**<br>- MGR trên phiếu 12/2026 → 403;<br>- MGR số tiền > phần thuê (mặc định = cả còn nợ, và thuê + 1) → 403;<br>- MGR `receivedOn` 25/11 > ngày nhận phòng bù 24/11 → 403;<br>- MGR phiếu 11, thuê, nhận 03/11 → 201;<br>- OWN phiếu 12 → 201;<br>- mỗi lần 403 thêm đúng một `access.denied`;<br>- MGR không có thiết bị → 403 |
| FB-R5-SEC-ARC-12-03 (Major) | Fixed | `PaymentMethod` (có `outside_desk`) chỉ ở phản hồi và bộ lọc `listPayments`. `PaymentMethodInput` (không có) cho `PaymentCreate`; các thân lệnh khác có `method` đã là enum riêng không chứa nó. `recordInTx` chỉ nhận `outside_desk` khi có `source: 'settle_outside_desk'`; gửi phương thức này mà không có source đi đường thường và bị `checkPaymentShape` trả 422 `method: NOT_IN_LIST`.<br>**Test** (`test/fb-inv-012-golive-units.test.ts`): duyệt mọi `requestBody` của mọi operation (theo `$ref`) → không enum nào có `outside_desk`; chỉ `listPayments` có ở tham số; `checkPaymentShape` từ chối. Tích hợp: `recordPayment` với `outside_desk` → 422 `NOT_IN_LIST`.<br>**Lệch:** test đọc `openapi.yaml`, không đọc `generated/openapi-schemas.ts`, vì file sinh chỉ có hình dạng phản hồi (không enum, không thân lệnh) |
| 12-06 (Minor) | Fixed | Chỉ số nhận phòng của đơn nhận phòng bù: `readOn` ≥ lần đọc còn hiệu lực gần nhất của căn (mọi đơn), nếu không → 422 `readOn: DATE_INVALID`. Kiểm trước `READING_EXISTS`. Có test |
| 12-08 (Minor) | Fixed | SEC 190-08: gọi `setMeterRetentionAnchor` trong `onReservationVoided`. Có test |
| 12-04 (a) (Minor) | Chưa làm | Miễn trừ hotline của `SENSITIVE_DATA_DETECTED` vẫn so 9 số cuối, chưa so cả số. Hotline vẫn đọc lại mỗi lần kiểm (không cache). (b) đã làm: `addressLine` từ chối ký tự điều khiển, bidi, zero-width |

### Kiểm trước khi code (contract 12.1.1, 12.2)

**Job no-show:** không có job tự đánh dấu no-show. `markNoShow` (B11) chỉ gọi từ controller (thủ công, BR-311 "không tự động"). Đơn nhập bù không bị job nào quét.

Một chỗ liên quan: `frontdesk/internal/attention-sources.ts` (~dòng 81) đưa đơn `confirmed` có `arrival_date ≤ T` vào mục "Cần chú ý" (đến chưa nhận phòng). Đơn nhập bù hiện ở đó tới lúc nhận phòng bù, thường vài phút. Không sửa: đúng là việc đang chờ lễ tân.

**Nơi đọc `payment.method`** (rà bằng `grep`):

| Nơi | Xử lý `outside_desk` |
|---|---|
| `folio.service` `moneyPosition` (~466) | Tính là đã thu (`not_required` → settled), như contract 12.2. Không sửa |
| `folio.service` `depositPaid` (~924), `checkout.service` `debtReductionsVnd` (~621) | Lọc `method <> 'ota_collect'` → khoản này được tính (là tiền đã thu thật). Không sửa |
| `folio.service` `unreconciledVnd` (~1628/1639), reconcile-attention, deposit-unverified | Lọc `reconciliation` pending/disputed → không tính. Không sửa |
| `payments.service` danh sách, tiền mặt bàn giao (`p.method = 'cash'`) | Không tính. Không có bảng ca (`shift_id` luôn null); không có báo cáo "thu theo phương thức" ở server |
| `payment-expiry` (chỉ `vietqr`), `bill.service` (chỉ OTA), `statements.service` (~1008) | Không ảnh hưởng |
| `refunds.service` `original_method` (~833) | **Sửa:** khoản thu gần nhất là `outside_desk` → 422 `refundMethod: NOT_ALLOWED` |
| `payments.controller` `METHODS` | **Sửa:** thêm `outside_desk` cho bộ lọc `listPayments` (đọc) |
| `payments.controller` `R2_METHODS` (`checkPaymentShape`), `deposits.controller` `DEPOSIT_METHODS` | Không thêm → mọi thân lệnh gửi `outside_desk` → 422 |
| `reversePayment` (A34) | Dòng đảo chép `method`, không có `billing_period_id`/`note` → CHECK 0100 miễn cho dòng đảo (xem Lệch) |

### Q16 – phiếu cuối không thu hai lần

Test `fb-inv-012-golive.test.ts`:
- Đơn đến 03/11, nhận phòng bù với ngày đến 01/11. Đi 15/01/2027, thuê 8.500.000.
- Phiếu 11 có dòng thuê 8.500.000. MGR ghi ngoài Desk phần thuê, OWN ghi phần còn lại → `paid`.
- Phiếu 12 phát hành. OWN ghi ngoài Desk 8.500.000.
- Phiếu cuối 01/2027: thuê = 20.962.000 (2 tháng + 14 ngày × 283.000) − 8.500.000 − 8.500.000 = **3.962.000**. Tháng 11 không bị thu lại.
- Không sửa công thức `priorRentVnd`.

### Lệch so với hợp đồng (BE tự quyết, báo ARC/SEC)

1. **CHECK `payment_outside_desk_check`:** miễn yêu cầu `billing_period_id` + `note` cho **dòng đảo** (`reversal_of_id` có giá trị). `reversePayment` chép `method` nhưng không chép hai cột đó; không miễn thì đảo khoản `outside_desk` (A34) bị CHECK chặn.
2. **`reference`:** không có cột riêng. Lưu nối vào `payment.note` (`<lý do> | ref <tham chiếu>`). Từ chối số thẻ (`CARD_NUMBER_DETECTED`) và chuỗi chỉ có số ≥ 9 chữ số (`reference: NOT_ALLOWED`, giống số tài khoản).
3. **Dời ngày đến khi nhận phòng bù:** chỉ cho đơn một đoạn (đơn nhập tay trước nhận phòng luôn một đoạn). Khác → 422 `arrivalDate: NOT_ALLOWED`.
4. **`USE_CHECK_IN`:** chỉ ở `checkInBackdated`. Ở `createReservation`, ngày đến = T với `backdatedArrival` trả `BACKDATE_OUT_OF_RANGE` (đơn tạo ngày hôm nay thì không cần `backdatedArrival`).
5. **Thông báo `statement_settled_outside_desk`:** chỉ mang mã phiếu (`refCode`) và đơn (`refId`). Không có số tiền hay người ghi: bảng `staff_notification` không có cột này, và SEC A5 cấm số tiền. Audit `money` có đủ.
6. **Số tiền mặc định `amountVnd`** = còn phải thu của phiếu. Với MGR, nếu còn phải thu > phần thuê chưa thu thì bị 403. FE nên điền sẵn phần thuê cho MGR.
7. **12.4, 12.5, BE-10 và test 190-07 chưa làm** (phạm vi tối thiểu contract 12.10 cho phép). OpenAPI 0.3.15 chưa có `catchUp`, `priceSource`, `getChargeCatalog?folioId`; A130 có trong rbac nhưng chưa gắn operation.

### Giả định

- `receivedOn` lưu 12:00 giờ cơ sở (Asia/Ho_Chi_Minh → 05:00Z).
- Phiếu tháng nhận phòng = phiếu có kỳ thuê chứa `arrival_date` (sau khi đã dời ngày đến).
- Biên tháng trước của `backdateBounds` dùng `readingWindow.daysAfter` + `lateMaxDays` (mặc định 10) của `monthly_statement_rules` có hiệu lực ngày T.

## PR #197 – Phản hồi & sửa (18/11, review `SEC-on-be-pr-197.md`, `ARC-on-be-pr-197.md`, contract §12.14)

### Trả lời thẻ SEC

| Thẻ | Mức | Trạng thái | Cách xử lý |
|---|---|---|---|
| FB-R5-SEC-BE-197-01 | Major | **Đã sửa** | `settleOutsideDesk`: sau luật mã ngân hàng, `reference` qua thêm `assertNoCardNumber` (luật văn bản tự do V-09). `recordOutsideDesk` kiểm lại cả `note` đã ghép trước khi ghi. Test: `reference: 'FT 4111 1111 1111 1111'` → 422 `CARD_NUMBER_DETECTED` (`errors[reference]`), thân lỗi không chứa số, không thêm dòng `payment` nào |
| FB-R5-SEC-BE-197-02 | Minor | **Đã sửa** | `assertManagerGoLiveScope` thêm: phiếu có khoản thu `status = 'reversed'`, hoặc khoản thu khác `outside_desk` nhận (theo giờ cơ sở) sau `checkin_backdated_on` → MGR 403 "owner only" + một `access.denied`. Test: MGR ghi ngoài Desk, MGR đảo, MGR ghi lại → 403; OWN ghi được. Nhánh "khoản thu thật sau ngày nhận phòng bù" chưa có test riêng (cùng câu SQL với nhánh `reversed`) |
| FB-R5-SEC-BE-197-03 | Minor | **Dời – trước khi PR-M gộp** | Chọn cách 1 của SEC: `checkInBackdated` chặn `closer_user_id` khác null khi người gọi không phải OWN (422 `closerUserId: NOT_ALLOWED`), làm cùng điều kiện 12-05 trong PR-M. Hôm nay đơn dài hạn chưa sinh hoa hồng |
| FB-R5-SEC-BE-197-04 | Minor | **Đã sửa** | CHECK `payment_outside_desk_check` siết thành `(reversal_of_id IS NOT NULL AND amount_vnd < 0) OR (billing_period_id IS NOT NULL AND note IS NOT NULL)`. Sửa thẳng trong 0100 (schema `folio.ts`, SQL, `0100_snapshot.json`; `drizzle-kit generate` báo không lệch). 0100 **chưa ở staging**: chỉ có trên nhánh này, chưa vào `main`; `release.yml` chỉ triển khai tag trỏ commit của `main`. Test: dòng đảo ghi được; đổi số tiền dòng đảo thành dương (vai `ottimo_owner`) → lỗi `payment_outside_desk_check` |
| FB-R5-SEC-BE-197-05 | Minor | **Dời – 31/12** | Chặn tiền tố `TK`/`STK`/`ACC` + ≥ 9 chữ số trong `reference`. Gợi ý dưới ô là việc của UXD/FE |
| FB-R5-SEC-ARC-12-04 (a)(c)(d) | Minor | **Dời – 31/12** | (a) so nguyên số hotline; (c) FE; (d) `x-requires-trusted-device` + thông báo OWN khác khi đổi hotline, cần thêm `kind` (gom vào migration kế tiếp) |
| FB-R5-SEC-ARC-12-07 | Minor | **Đã sửa** | `createReservation.backdatedArrival`: OWN/MGR phải ở thiết bị tin cậy, kiểm ở tầng trường. Tách phần kiểm thiết bị của `AuthGuard` thành `requireTrustedDevice(req, p)` (dùng chung cho cấp operation), controller gọi khi thân có `backdatedArrival`. Ngoài thiết bị → 403 `DEVICE_NOT_TRUSTED` + `access.denied` (`trusted_device`). FD/FDL vẫn nhận 403 theo vai trước (không hỏi thiết bị). OpenAPI ghi ở `backdatedArrival` |

### Trả lời thẻ ARC

| Thẻ | Mức | Trạng thái | Cách xử lý |
|---|---|---|---|
| FB-R5-ARC-BE-197-01 | Major | **Đã sửa** | Ca tích hợp mới (đơn thứ hai, căn khác): MGR ghi ngoài Desk 2.000.000 → `partially_paid`; MGR `reversePayment` → 200; dòng đảo `method = outside_desk`, `amount_vnd = -2.000.000`, `shift_id` null, `billing_period_id` null; phiếu về `issued`, `paidVnd = 0`. Sau đó OWN ghi lại, rồi một yêu cầu hoàn đã duyệt `original_method` → `executeRefund` 422 `refundMethod: NOT_ALLOWED`. **Một chỉnh mã nhỏ:** trước đây kiểm `outside_desk` nằm sau kiểm số dư (folio dài hạn không có dư thừa nên luôn trả `REFUND_EXCEEDS_APPROVED` trước). Đã đưa phần xác định phương thức gốc + chặn `outside_desk` lên trước kiểm số tiền; chặn tiền mặt/OTA giữ chỗ cũ. Test hoàn tiền S3 và chi hoàn vẫn xanh. Yêu cầu hoàn trong test được chèn bằng SQL (luồng tạo – duyệt – nơi nhận dài, không thuộc phần cần chứng minh) |
| FB-R5-ARC-BE-197-02 | Minor | **Đã sửa** | `actions()` nhận `stay`: OWN luôn thấy `settle_outside_desk` khi còn nợ; MGR chỉ khi đủ (a) (đơn có `checkinBackdatedOn`, kỳ thuê chứa ngày đến). Hàm `holdsBackdatedArrival` dùng chung với lúc ghi. Test: MGR thấy trên phiếu 11, không thấy trên phiếu 12; OWN thấy cả hai |
| FB-R5-ARC-BE-197-03 | Minor | Ghi nhận, không sửa PR này | Hook kiểm `long_stay_cleaning_fee_by_room` làm đầu tiên trong PR 12.4. DOM ghi câu cảnh báo vào go-live-guide 5.3 (ORC báo DOM) |
| FB-R5-ARC-BE-197-04 | Minor | **Dời – 31/12** | 12-04 (d) ghi ở bảng SEC trên, cùng (a) |
| FB-R5-ARC-BE-197-05 | Minor | **Đã sửa** | Bảng mã trường OpenAPI thêm `BACKDATE_OUT_OF_RANGE`, `PREVIOUS_MONTH_CLOSED`, `USE_CHECK_IN`, `DATE_IN_FUTURE`; mô tả settle ghi `DATE_IN_FUTURE`/`DATE_INVALID`/`REQUIRED` cho `receivedOn`. `createReservation` ngày đến = T kèm `backdatedArrival` → `BACKDATE_OUT_OF_RANGE` **kèm** `earliest = T − 45` (test). `unmet room_occupied` đã có ở mô tả `checkInBackdated`; không thêm dòng bảng mã vì `unmet` không phải mã trường |
| FB-R5-ARC-BE-197-06 | Minor | **Đã sửa** | Hằng số mới `CLOSER_CHANGE_BACKDATED_STAY`, thêm vào danh sách `recordUseCaseDenial` của `updateReservation`. Test SEC 12-01 (2) kiểm `access.denied.reason` |
| FB-R5-ARC-BE-197-07 | Minor | **Đã sửa** | Q4: đơn khác giữ đêm 04/11 trên căn → nhận phòng bù với ngày đến 03/11 → 409 `ROOM_UNAVAILABLE`, đơn vẫn `confirmed`, ngày đến 06/11, `checkin_backdated_on` null. Q5: ngày đến muộn hơn (08/11) → 200, đêm 06–07/11 thành `void` (`date_change`), `room_occupancy` bắt đầu 08/11 |
| FB-R5-ARC-BE-197-S1 | Gợi ý | **Đã làm** | Cùng sửa 197-04 |
| FB-R5-ARC-BE-197-S2 | Gợi ý | Ghi nhận | Thứ tự gộp #197 rồi #196 là việc của ORC. API không đổi `PaymentMethodInput` |

### Giả định

- 0100 chưa chạy ở môi trường nào ngoài CI và máy dev. Nên sửa thẳng 0100, không cần migration mới. DB thử cục bộ đã có 0100 cũ, BE tự DROP/ADD CHECK mới tay để chạy test. CI dùng DB mới.
- Ngày nhận tiền của khoản thu thật (SEC 197-02) so theo giờ cơ sở (`received_at AT TIME ZONE` múi giờ cơ sở).
- Field-level device check chạy trước body 422 (giống thiết bị cấp operation). MGR gửi `backdatedArrival` sai dạng ngoài thiết bị nhận 403, không phải 422.
