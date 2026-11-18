# FB-INV-012 – Hợp đồng BE ↔ FE: phiếu thanh toán hằng tháng khách dài hạn (ARC 17/11)

- Tác giả: ARC | Round 5 – Sản xuất | Đầu vào: `04-investor-feedback/FB-INV-012.md`, `rounds/round-05/fb-inv-012/DOM-rules.md` (BR-LS-01…16, bản 17/11), `erd.md` 4.11 (`billing_period`, `meter_reading` thiết kế R3, chưa có bảng), schema `folio.ts`, `payments.service.ts` (`createVietQr`, `qr_purpose = billing_period` đang bị chặn), `0098_fx_rates_fb_inv_011.sql` (mẫu tham số json + hook).
- Tên gọi: **Monthly statement / Phiếu thanh toán tháng**. Không gọi "Phiếu thanh toán" để khỏi nhầm với bill trả phòng hiện có (`BillDialog`, `getBill`).
- Mọi điểm DOM còn mở (kỳ trả trước/sau, % VAT, kỳ lẻ, làm tròn, hạn) là **tham số OWN có ngày hiệu lực**, không gõ cứng. DOM đổi luật thì đổi giá trị, không phải đổi mã.
- **Sửa đổi 18/11** (sau INV bổ sung 17/11 và review PR #190, #189): xem **mục 11**. Mục 11 thắng mọi chỗ khác trong file nếu lệch. Các dòng đã lỗi thời có ghi chú *(thay bởi mục 11)*.
- **Sửa đổi 18/11 lần 2 – gói sửa trước ra mắt v1.0.7** (INV chọn go-live-guide cách A): xem **mục 12**. Mục 12 chỉ thêm; thắng mục 11 ở chỗ lệch.

## 1. Quyết định kiến trúc (ARC tự quyết, ORC ghi decision-log)

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Module mới `services/api/src/modules/billing` (feature module). Đọc folio, đơn qua cổng `public/` hiện có (`FolioService`, `ReservationSalesPort`). Ghi dòng folio qua hàm append của `FolioService` (không SQL thẳng vào `folio_line`). | Giữ ranh giới module. folio_line vẫn chỉ-thêm (BR-008). |
| D2 | Dùng lại tên bảng `billing_period` của ERD và cột có sẵn `payment.billing_period_id`. `lease_contract_id` để null: chưa có bảng HĐ, khóa theo `reservation_id`. | Không đẻ khái niệm thứ hai. Khi có `lease_contract` thì chỉ điền cột. |
| D3 | Phiếu tháng M chứa ba phần, mỗi phần có kỳ riêng: tiền thuê (`rent_period`), điện nước (`utility_period`), dịch vụ (`service_period`). Kỳ nào lấy tháng nào là tham số `rentTiming` (mặc định `advance` theo BR-LS-01: thuê M, điện nước và dịch vụ M−1). | DOM đổi trả trước/trả sau thì không đụng mã. |
| D4 | Nháp **không lưu dòng**: đọc nháp = tính lại tại thời điểm đọc (đây chính là "xem trước"). Lúc phát hành mới chụp dòng vào `billing_period_line` và ghi folio. | Không có hai nguồn số. Nháp luôn khớp chỉ số mới nhất. |
| D5 | Dịch vụ phòng đã là dòng folio (A30) → phiếu chỉ **tham chiếu** (`folio_line_id`), không ghi lại. Tiền thuê, điện, nước, làm tròn, điều chỉnh kỳ trước → phiếu **ghi dòng folio mới** lúc phát hành. | Không thu hai lần một dịch vụ. |
| D6 | Thu tiền đi qua `payment` hiện có (`type=charge`, `billing_period_id`). Trạng thái thu của phiếu suy ra từ Σ payment `succeeded` gắn phiếu. "Quá hạn" **suy ra** (không lưu): `issued/partially_paid` và hôm nay > `due_date`. | Một nguồn tiền. Không cần job đổi trạng thái. |
| D7 | VietQR in trên phiếu là **QR tĩnh** (EMVCo: số tiền còn phải thu + nội dung = mã phiếu) do server dựng. **Không** tạo payment `pending` khi in. Lễ tân thấy tiền thì ghi thu `method=vietqr`, đối soát `pending` như chuyển khoản ghi tay (SM-12). | Giấy để nhiều ngày, QR `pending` có hạn sẽ hết hạn. Giữ nguyên luồng `createVietQr`. |
| D8 | Màn hình dùng lại **S12** (chốt công tơ) và **S16** (HĐ dài hạn, kỳ thu) đã có trong `rbac-matrix.md` mục 3 và `screens.ts`. **Không thêm màn hình, không sửa mục 3.** | Tránh lỗi đỏ main khi tài liệu mục 3 lệch `screens.ts` (đã gặp). |

## 2. Mô hình dữ liệu – migration `0099_monthly_statement_fb_inv_012.sql` (chỉ thêm)

Số file theo thứ tự merge (ghi chú ở 0098): PR merge sau lấy số kế tiếp, snapshot dựng lại từ main. Không `UPDATE`/`DELETE` dữ liệu cũ, không đổi CHECK cũ. RLS + FORCE RLS cho cả 3 bảng mới (test kiến trúc quét `pg_class`), policy theo `property_id` như bảng folio.

### 2.1 `meter_reading` – một lần đọc cả hai đồng hồ của một căn

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id`, `organization_id`, `property_id` | uuid | FK property như mọi bảng |
| `reservation_id`, `room_id` | uuid not null | FK (`property_id`, …). Đổi căn giữa kỳ → mỗi căn một chuỗi chỉ số |
| `kind` | text | `checkin`, `period_start`, `period_end`, `room_change_out`, `room_change_in`, `checkout` *(thêm `period_start` – mục 11.1)* |
| `period_month` | date null | Ngày 01 của tháng mà lần đọc **đóng** (chỉ `period_end`). Đọc ngày 01/12 vẫn đóng tháng 11 (BR-LS-10) |
| `read_on` | date not null | Ngày kinh doanh lúc đọc |
| `electricity_value` | numeric(10,0) | kWh nguyên (BR-LS-11) |
| `water_value` | numeric(10,1) | m³ một số lẻ, bỏ phần lẻ (BR-LS-11) |
| `electricity_exception`, `water_exception` | jsonb null | `{type: "replaced", oldFinal, newStart, replacedOn}` hoặc `{type: "rollover", maxValue}`. CHECK `jsonb_typeof = 'object'` |
| `photo_attachment_id` | uuid null | FK `attachment` (`purpose='meter'` đã có). Null chỉ khi `photo_waived_by` có giá trị |
| `photo_waived_by`, `exception_approved_by` | uuid null | FDL+ (mục 4) |
| `note` | text null | 3–300 ký tự, lọc mẫu số giấy tờ/số thẻ như `internal_note` |
| `read_by`, `read_by_role`, `voided_at`, `voided_by`, `void_reason` | | Sửa "Nhập sai" = hủy lần đọc rồi nhập lại; không sửa đè |
| audit columns | | |

- UK một phần (`reservation_id`, `room_id`, `kind`, `period_month`) WHERE `voided_at IS NULL` (`kind ≠ period_end` dùng `read_on` thay `period_month`; BE chọn biểu thức chỉ mục, ghi trong migration).
- CHECK: `kind = 'period_end'` ⇔ `period_month IS NOT NULL`; giá trị ≥ 0.
- ~~Chỉ số đầu kỳ không lưu, không cho gõ~~ *(thay bởi mục 11.1: đầu kỳ là lần đọc lễ tân nhập mỗi kỳ, số cuối kỳ trước chỉ để so)*.

### 2.2 `billing_period` – phiếu

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id`, `organization_id`, `property_id`, `folio_id`, `reservation_id` | uuid | FK (`property_id`, `folio_id`) → folio |
| `lease_contract_id` | uuid null | Để sẵn cho R3 (D2) |
| `code` | text null | Cấp lúc phát hành: `TT-<yymm>-<số căn>`, phiếu thay thế thêm `-R<n>`. UK (`property_id`, `code`) |
| `statement_month` | date | Ngày 01 tháng M |
| `kind` | text | `regular`, `final` (kỳ cuối BR-LS-04: tiền thuê = thuê × số tháng − Σ đã thu; **không trừ cọc** – cọc ở bill quyết toán) |
| `rent_period_from/to`, `utility_period_from/to`, `service_period_from/to` | date null | Tính từ tham số khi phát hành (nháp: tính lúc đọc) |
| `due_date` | date null | Ngày `dueDay` của tháng M (mặc định 05) |
| `status` | text | `draft`, `issued`, `partially_paid`, `paid`, `void`. CHECK |
| `excluded_folio_line_ids` | uuid[] not null default '{}' | Lễ tân dời dòng dịch vụ sang kỳ sau (BR-LS-14) |
| `prior_adjustment_vnd`, `prior_adjustment_reason` | bigint null, text null | "Điều chỉnh kỳ trước" (BR-LS-16), FDL+ |
| `replaces_id` | uuid null | FK tự thân, phiếu bị hủy mà phiếu này thay |
| `rates_snapshot` | jsonb null | Đơn giá, % VAT, quy tắc đã dùng (BR-006). Ghi lúc phát hành |
| `net_vnd`, `vat_vnd`, `rounding_vnd`, `total_vnd` | bigint null | Chụp lúc phát hành |
| `paid_vnd` | bigint not null default 0 | Bộ đệm = Σ payment `succeeded` gắn phiếu (cập nhật cùng giao dịch ghi/đảo payment) |
| `issued_at/by`, `paid_at`, `voided_at/by`, `void_reason` | | |
| `version` | int | ETag / `If-Match` |
| audit columns | | |

- UK một phần (`reservation_id`, `statement_month`, `kind`) WHERE `status <> 'void'`: một phiếu sống mỗi tháng.
- CHECK `status = 'draft'` ⇔ `code IS NULL`; `status = 'void'` ⇔ `voided_at IS NOT NULL`.
- Chỉ mục (`property_id`, `status`, `due_date`) cho danh sách quá hạn.

### 2.3 `billing_period_line` – dòng đã chụp lúc phát hành

`billing_period_id` (FK), `kind` (`rent`, `electricity`, `water`, `service`, `rounding`, `prior_adjustment`), `folio_line_id` (FK folio_line, not null), `meter_from_reading_id`, `meter_to_reading_id` (null), `room_id`, `quantity` numeric(12,2), `unit` (`month`, `day`, `kwh`, `m3`, `item`), `unit_price_net_vnd`, `vat_rate_pct` numeric(5,2) null (null = giá đã gồm VAT), `net_vnd`, `vat_vnd`, `amount_vnd`, `label_key`, `label_params` jsonb, `sort_order`, `active` bool (false khi phiếu hủy).

- UK một phần (`folio_line_id`) WHERE `active`: một dòng dịch vụ chỉ nằm trên một phiếu sống.

### 2.4 Cách ghi folio lúc phát hành (D5)

| Dòng | `category` | `charge_code` | Số |
|---|---|---|---|
| Tiền thuê | `room` | `monthly_rent` | `quantity` 1 (hoặc số ngày lẻ), `unit_price_vnd` = thuê tháng (hoặc giá ngày), `limit_ref_vnd` = `unit_price_vnd` (thỏa CHECK `folio_line_limit_ref_required_check`), `period_from/to` = kỳ thuê, `stay_night_id` null |
| Điện / nước | `utilities` | `electricity` / `water` | `quantity` = tiêu thụ, `unit_price_vnd` = đơn giá **đã gồm VAT** làm tròn đồng, `amount_vnd` = round(quantity × unit) (giữ bất biến số lượng × đơn giá mà `folio-lines.service.ts` dùng), `vat_rate_pct` = % |
| Làm tròn | `adjustment`, `adjusts_group='other'` | `statement_rounding` | âm |
| Điều chỉnh kỳ trước | `adjustment`, `adjusts_group` theo dòng gốc | `statement_prior_adjustment` | âm hoặc dương, `reason` bắt buộc |

- Tất cả: `source='system'`, `posted_by` = người phát hành, `label_params.statementCode`. Nhãn in mới: `bill.line.monthly_rent`, `bill.line.electricity`, `bill.line.water`, `bill.line.statement_rounding`, `bill.line.statement_prior_adjustment` (cập nhật `line-labels.ts`, i18n).
- **BE kiểm trước khi code** (báo ARC nếu vướng): (a) các đường đọc `category='room'` (giới hạn giảm BR-433, KPI, `limitBasisVnd`) có giả định `stay_night_id` khác null không; nếu có, dùng `category='room'` + loại `monthly_rent` khỏi các đường đó, không đổi sang nhóm doanh thu khác. (b) Khách dài hạn hiện được ghi tiền thuê tay thế nào. Nếu đã có dòng thuê của kỳ thuê thì nháp báo `RENT_ALREADY_POSTED`, phiếu tham chiếu dòng đó, không ghi thêm.
- Phiếu tháng ghi folio nhưng **không** chốt folio (`settle`). Folio `settled`/`closed` → `409 FOLIO_LOCKED`.

## 3. Tham số (OWN, có ngày hiệu lực – theo cách `fx_rate_overrides`)

Thêm 3 khóa vào `config_parameter_def` trong cùng migration (`edit_roles='{owner}'`, có `default_value`, nên production bootstrap không ghi dòng). Kiểm giá trị bằng hook của module billing gắn vào `setParameter` (như hook public-site cho fx). Sai → `422 PARAM_OUT_OF_RANGE` / `VALIDATION_FAILED`.

| Khóa | Mặc định (nguồn) | Biên hook |
|---|---|---|
| `utility_unit_price` | `{"electricityVndPerKwh": 4000, "waterVndPerM3": 25000}` – chưa VAT (INV 17/11) | số nguyên 1–20.000 / 1–200.000 |
| `utility_vat_rate` | `{"electricity": 8, "water": 5}` (DOM ĐỀ XUẤT, chờ kế toán). Loại không có trong bảng (thuê, dọn phòng) = giá đã gồm VAT | mỗi giá trị ∈ {0, 5, 8, 10} |
| `monthly_statement_rules` | `{"rentTiming": "advance", "dueDay": 5, "totalRoundingVnd": 1000, "partialFirstMonthRent": "at_checkin", "readingWindow": {"daysBeforeMonthEnd": 0, "daysAfter": 1}}` (BR-LS-01/02/03/09/10) | `rentTiming` ∈ {advance, arrears}; `dueDay` 1–28; `totalRoundingVnd` ∈ {1, 100, 1000}; `partialFirstMonthRent` ∈ {at_checkin, first_statement} |

- Đơn giá lấy theo **ngày cuối kỳ điện nước**; % VAT lấy theo **ngày phát hành** (BR-LS-07/08). Ghi cả hai vào `rates_snapshot`.
- Dùng lại khóa đang có: `long_stay_daily_divisor` (30, BR-LS-03), `rounding.night_rate` (1.000, phần ngày lẻ), `meter_anomaly_factor`, `meter_anomaly_default_kwh`, `meter_anomaly_default_m3` (BR-LS-12), `rent_overdue_alert_days`, `rent_overdue_escalate_days` (BR-LS-02).
- `electricity_price`, `water_price` (BR-501 cũ: 5.000/kWh, nước theo người) **giữ nguyên, không đọc nữa**. Không xóa khóa (test `parameters-delete-architecture`). DOM ghi BR-501 thay bằng BR-LS-07.
- FE: thêm 3 khóa vào `paramCatalog.ts` (S24). Chỉ OWN sửa; MGR, FDL chỉ xem.

## 4. Quyền theo vai (khớp DOM mục 5)

| Thao tác (operationId) | OWN | MGR | FDL | FD | Khác | rbac |
|---|:-:|:-:|:-:|:-:|---|---|
| `listMeterReadings`, `recordMeterReading`, `voidMeterReading` | ✔ | ✔ | ✔ | ✔ | 403 | A88 |
| Lần đọc có `exception` (thay đồng hồ, quay vòng) hoặc thiếu ảnh | ✔ | ✔ | ✔ | 403 `FORBIDDEN_ACTION` | 403 | A89 |
| `listBillingCandidates`, `listBillingPeriods`, `getBillingPeriod`, `getBillingPeriodPrint` | ✔ | ✔ | ✔ | ✔ | 403 | A121 (mới) |
| `createBillingPeriod`, `updateBillingPeriod` (dời dòng), `issueBillingPeriod` | ✔ | ✔ | ✔ | ✔ | 403 | A121 |
| `updateBillingPeriod.priorAdjustment` | ✔ | ✔ | ✔ | 403 | 403 | A122 (mới) |
| `voidBillingPeriod` – nháp | ✔ | ✔ | ✔ | ✔ | 403 | A121 |
| `voidBillingPeriod` – đã phát hành, chưa thu | ✔ | ✔ | ✔ | 403 | 403 | A122 |
| `recordBillingPeriodPayment` | ✔ | ✔ | ✔ | ✔ | 403 | A58 + A33 |
| Sửa 3 tham số mục 3 | ✔ | 403 | 403 | 403 | 403 | A119 kiểu thường (setParameter `edit_roles`) |

- HK, MT, SAL, CTV: không có trong `x-roles` → 403. MT có A88 trong ma trận nhưng đợt này chưa mở cho MT (MT không được thấy tên khách, SEC D18). Ghi chú trong rbac.
- Lệch có chủ đích so với ma trận: A89 là "D – MGR+ duyệt". Đợt này **không** dùng luồng duyệt `meter_lower_than_previous`: FD bị chặn và được nhắc gọi lễ tân trưởng; FDL+ lưu thẳng, ghi `exception_approved_by`. Luồng duyệt để sau nếu INV cần.
- BE PR thêm dòng A121, A122 và ghi chú vào `rbac-matrix.md` (mục hành động) **và** `rbac-matrix.json` trong cùng commit. Không đụng mục 3.

## 5. API (OpenAPI → `0.3.14-draft`, BE cập nhật `openapi.yaml` + file sinh trong PR BE)

Tất cả dưới `/v1/properties/{propertyId}`. Chuẩn lỗi, ETag, Idempotency-Key như phần còn lại. Mọi phản hồi có `Cache-Control: no-store`. Đơn không phải dài hạn có tiền thuê (`stay_type='long'`, `manual_long_stay.monthly_rent_vnd`) → `422 NOT_LONG_STAY`. Đơn không `in_house` → `409 INVALID_TRANSITION` (trừ đọc, và `kind=final` cho phép đến hết cửa sổ sau trả phòng).

| Method, path | operationId | Ghi chú |
|---|---|---|
| `GET /reservations/{reservationId}/meter-readings` | `listMeterReadings` | Mọi lần đọc (kể cả đã hủy, đánh dấu), kèm `consumption` so với lần trước |
| `POST /reservations/{reservationId}/meter-readings` | `recordMeterReading` | Idempotency-Key. Body bên dưới. `period_end` ngoài cửa sổ `readingWindow` → `422 READING_OUT_OF_WINDOW`. Cuối < đầu mà không có `exception` → `422 METER_LOWER_THAN_PREVIOUS` (kèm `previousValue`). Trùng (UK) → `409 READING_EXISTS`. *Đầu kỳ < cuối kỳ trước và đọc trễ: mục 11.2* |
| `POST /meter-readings/{readingId}/void` | `voidMeterReading` | `{reason}`. Lần đọc đang dùng trên phiếu đã phát hành → `409 READING_ON_ISSUED_STATEMENT` |
| `GET /billing-periods/candidates?month=2026-12` | `listBillingCandidates` | Đơn dài hạn đang ở, chưa có phiếu sống của tháng: phòng, tên hiển thị, `readingStatus` (`missing`/`recorded`/`exception`), có phiếu nháp chưa |
| `POST /reservations/{reservationId}/billing-periods` | `createBillingPeriod` | `{month, kind}` → 201 `BillingPeriod` nháp (đã tính). Đã có phiếu sống → `409 STATEMENT_EXISTS` (kèm `billingPeriodId`) |
| `GET /billing-periods?status=&month=&overdue=true&roomId=&cursor=` | `listBillingPeriods` | Danh sách S16 + "Cần chú ý". Phần tử: `id, code, roomNos, guestDisplayName, month, totalVnd, balanceVnd, dueDate, status, overdueDays, alertLevel` (`due_today`/`overdue`/`alert`/`escalate` theo BR-LS-02) |
| `GET /billing-periods/{id}` | `getBillingPeriod` | Nháp: tính lại khi đọc (= xem trước). Đã phát hành: bản chụp. ETag |
| `PATCH /billing-periods/{id}` | `updateBillingPeriod` | Chỉ nháp, `If-Match`. `{excludedFolioLineIds?, priorAdjustment?: {amountVnd, reason}, note?}`. Dời dòng không thuộc kỳ dịch vụ → `422 NOT_IN_LIST` |
| `POST /billing-periods/{id}/issue` | `issueBillingPeriod` | `If-Match` + Idempotency-Key. Body `{acknowledgeWarnings: bool}`. Thiếu chỉ số cuối kỳ → `422 METER_READING_MISSING`. Có cảnh báo mà chưa `acknowledgeWarnings` → `422 WARNINGS_NOT_ACKNOWLEDGED` (kèm `warnings[]`). Một giao dịch: khóa đơn `KEY SHARE` → folio `FOR UPDATE` → tính → ghi dòng folio (mục 2.4) → chụp `billing_period_line` → `status=issued`, cấp `code`. Tổng ≤ 0 → `422 AMOUNT_NOT_POSITIVE` |
| `POST /billing-periods/{id}/void` | `voidBillingPeriod` | `{reason}` 3–300. Đã có payment `succeeded` → `409 STATEMENT_HAS_PAYMENTS` (dùng "Điều chỉnh kỳ trước", BR-LS-16). Đã phát hành: đảo các dòng folio phiếu tự ghi (cơ chế `reversal_of_id` có sẵn), `active=false` cho dòng tham chiếu, cùng giao dịch. Phản hồi có `canReplace: true` → FE mở `createBillingPeriod` với cùng tháng (server điền `replaces_id`, mã `-R<n>`) |
| `POST /billing-periods/{id}/payments` | `recordBillingPeriodPayment` | Idempotency-Key. `{method: "cash" \| "vietqr", amountVnd, receivedAt?, note?}`. Gọi đường ghi thu của `PaymentsService` (`type=charge`, `billing_period_id`). `vietqr` → `reconciliation=pending` (SM-12). `cash` → vào ca đang mở (luật ca hiện có). Vượt `balanceVnd` → `422 AMOUNT_OVER_BALANCE`. Cập nhật `paid_vnd`, `status` → `partially_paid` / `paid` (+ `paid_at`). Đảo payment (A34) phải trừ lại `paid_vnd` và lùi `status` trong cùng giao dịch |
| `GET /billing-periods/{id}/print` | `getBillingPeriodPrint` | Chỉ phiếu đã phát hành (nháp → `409 INVALID_TRANSITION`). Trả `BillingPeriodPrint` (mục 5.2). Ghi audit `billing_period.printed` |

`createVietQr` **giữ** `purpose=billing_period → 422` (D7). Không đổi luồng QR hiện có.

### 5.1 Hình dạng chính

```json
// recordMeterReading – body
{ "roomId": "…", "kind": "period_end", "periodMonth": "2026-11", "readOn": "2026-11-30",
  "electricity": { "value": 1392, "exception": null },
  "water": { "value": 38.6, "exception": { "type": "replaced", "oldFinal": 37.9, "newStart": 0, "replacedOn": "2026-11-15" } },
  "photoAttachmentId": "…", "photoWaived": false, "note": null }

// BillingPeriod
{ "id": "…", "code": null, "status": "draft", "kind": "regular", "month": "2026-12",
  "reservationId": "…", "folioId": "…", "roomNos": ["203"], "guestDisplayName": "N. Minh",
  "rentPeriod": { "from": "2026-12-01", "to": "2026-12-31" },
  "utilityPeriod": { "from": "2026-11-01", "to": "2026-11-30" },
  "servicePeriod": { "from": "2026-11-01", "to": "2026-11-30" },
  "dueDate": "2026-12-05", "overdueDays": 0, "alertLevel": null,
  "lines": [
    { "kind": "rent", "labelKey": "bill.line.monthly_rent", "labelParams": {"from": "2026-12-01", "to": "2026-12-31"},
      "quantity": 1, "unit": "month", "unitPriceNetVnd": 8500000, "vatRatePct": null,
      "netVnd": 8500000, "vatVnd": 0, "amountVnd": 8500000, "folioLineId": null },
    { "kind": "electricity", "roomNo": "203", "meter": { "from": 1250, "to": 1392, "exception": null },
      "quantity": 142, "unit": "kwh", "unitPriceNetVnd": 4000, "vatRatePct": 8,
      "netVnd": 568000, "vatVnd": 45440, "amountVnd": 613440, "folioLineId": null },
    { "kind": "service", "labelKey": "bill.line.cleaning", "serviceDate": "2026-11-12",
      "quantity": 1, "unit": "item", "unitPriceNetVnd": 150000, "vatRatePct": null,
      "netVnd": 150000, "vatVnd": 0, "amountVnd": 150000, "folioLineId": "…" }
  ],
  "totals": { "netVnd": 0, "vatVnd": 0, "roundingVnd": -690, "totalVnd": 0, "paidVnd": 0, "balanceVnd": 0 },
  "warnings": [ { "code": "METER_ANOMALY", "roomNo": "203", "meter": "electricity", "consumption": 320, "threshold": 290 } ],
  "availableActions": ["update", "issue", "void"],
  "ratesSnapshot": null, "replacesId": null, "issuedAt": null, "paidAt": null, "voidedAt": null }
```

- `warnings[].code`: `METER_ANOMALY`, `RENT_ALREADY_POSTED`, `SERVICE_LINE_ON_OTHER_STATEMENT` (bỏ khỏi phiếu, chỉ báo), `PHOTO_WAIVED`, `OPENING_BELOW_PREVIOUS_CLOSING`, `READING_LATE` *(bỏ `PRICE_CHANGED_SINCE_DRAFT`, thêm 2 mã – mục 11.3)*. Client phải xử lý mã lạ bằng câu chung và vẫn bắt xác nhận.
- `availableActions` ∈ `update`, `prior_adjustment`, `issue`, `void`, `record_payment`, `print` (6 giá trị); server tính theo vai + trạng thái. FE chỉ hiện nút có trong danh sách (không tự suy quyền).
- `guestDisplayName`: tên rút gọn như danh sách Hôm nay. Không trả SĐT, email, quốc tịch, giấy tờ.
- Số tiền: VND nguyên. VAT tính theo dòng, làm tròn đồng. Tổng làm tròn **xuống** theo `totalRoundingVnd`, phần lẻ thành dòng `rounding` (BR-LS-09).

### 5.2 `BillingPeriodPrint`

`BillingPeriod` (đã phát hành) + `property { displayName, addressLine, hotline, email }` + `guest { fullName }` (chỉ họ tên đầy đủ, để khách nhận biết phiếu của mình) + `vietqr { payload, bankShortName, accountHolder, accountNoMasked, amountVnd, transferContent }`, trong đó:
- `payload`: chuỗi EMVCo server dựng bằng `buildVietQrPayload` từ `payment_receiving_account` hiệu lực hôm nay, `amountVnd` = `balanceVnd`, `transferContent` = `transferContentOf(code)`. Hết nợ → `vietqr` null (phiếu in dấu PAID).
- `accountNoMasked` chỉ 4 số cuối. Số đầy đủ nằm trong QR, không trả riêng.
- `printedAt`, `printedByInitials` (chữ cái đầu, không họ tên nhân viên).

## 6. FE – Desk

1. **S16 "Long stay · Monthly statements"** (route `/long-stay/statements`): tab Draft / Issued / Overdue / Paid / Void, chọn tháng. Đầu trang có khối "Ready to bill {month}" từ `listBillingCandidates`, nút tạo nháp cho từng đơn. Hàng quá hạn đánh dấu theo `alertLevel` (màu chỉ trong bảng 80/15/5: Earth Brown cho quá hạn, không thêm đỏ ngoài bảng; UXD chốt).
2. **S12 nhập chỉ số**: bảng cuối tháng (mỗi căn dài hạn một hàng: đầu kỳ chỉ đọc, ô cuối kỳ điện, nước, tải ảnh, trạng thái), và tab "Meters" trong ngăn đơn dài hạn (lịch sử, hủy lần đọc). Cuối < đầu → hỏi Nhập sai / Thay đồng hồ / Quay vòng. Hai lựa chọn sau chỉ FDL+ (FD thấy chữ "Ask the front desk lead").
3. **Chi tiết phiếu** (ngăn bên): dòng, cảnh báo (bấm xác nhận trước Phát hành), dời dòng dịch vụ, Điều chỉnh kỳ trước (FDL+), Phát hành, Hủy (lý do), Ghi thu (VietQR / Tiền mặt, số tiền mặc định = còn phải thu), In.
4. **Hôm nay / Cần chú ý**: số phiếu đến hạn hôm nay và quá hạn, từ `listBillingPeriods?overdue=true` (không cần thông báo đẩy đợt này).
5. **S24 tham số**: 3 khóa mục 3 (OWN sửa, có ngày hiệu lực như mọi khóa).
6. **Trang in** `/print/statements/:id`, dùng mẫu `print-root` + `print.css` của bill hiện có:
   - Khổ **A5 dọc mặc định**, nút đổi A4 (đổi `@page size` qua lớp trên `.print-root`). Một trang. Dòng dài thì A5 tự sang A4 (UXD chốt ngưỡng).
   - Brand OTTIMO: nền giấy trắng/Ivory, chữ Ink, phụ Stone Grey, kẻ Sage, đường đầu trang Light Oak, dấu PAID Earth Brown, VOID Stone Grey. Lora cho tên cơ sở và tiêu đề "Monthly statement", Be Vietnam Pro cho nội dung, JetBrains Mono cho mã phiếu, chỉ số đồng hồ, nội dung chuyển khoản. Chỉ màu trong bảng 80/15/5. Không emoji.
   - Song ngữ trên cùng tờ: dòng EN dẫn, dòng VI nhỏ hơn bên dưới (ví dụ "Electricity · Điện", "Please pay by 05 Dec 2026 · Vui lòng thanh toán trước hết ngày 05/12/2026"). Câu chữ khách thấy do UXD/CPY duyệt.
   - Bố cục: đầu trang (tên cơ sở, mã phiếu, tháng, ngày phát hành) → khách (họ tên, căn) → bảng dòng (mô tả, chỉ số đầu/cuối, số lượng, đơn giá, VAT, thành tiền) → tổng (tạm tính, VAT, làm tròn, đã thu, còn phải thu) → khối VietQR (QR vẽ ở trình duyệt từ `payload`, số tiền, nội dung chuyển khoản, ngân hàng, chủ tài khoản, 4 số cuối) → chân trang (hotline, email, câu ghi giá thuê đã gồm VAT).
   - QR vẽ bằng thư viện QR mà FE đang dùng cho VietQR lúc nhận/trả phòng (không thêm phụ thuộc mới; nếu chưa có thì báo ARC).

## 7. Chia việc – mỗi bên 1 PR

**PR BE** `r5-fb012-be-statements` (làm trước, FE làm song song trên mock theo hợp đồng này):
- Migration 0099 (mục 2, 3), schema drizzle, journal + snapshot.
- Module `billing`: tính phiếu (hàm thuần, dễ test), service, controller, hook tham số, nhãn `line-labels.ts`.
- `PaymentsService`: ghi thu gắn `billing_period_id`, đảo payment cập nhật `paid_vnd`/`status`.
- `openapi.yaml` 0.3.14-draft + `generated/*`, `rbac-matrix.md` (A121, A122, ghi chú A88/A89) + `rbac-matrix.json`.
- Seed dev/e2e: 1 đơn dài hạn, chỉ số giả, tham số mặc định.

**PR FE** `r5-fb012-fe-statements` (merge sau BE):
- Màn hình mục 6.1–6.5, trang in 6.6, mock `apps/admin-web/src/mocks/` theo hình dạng 5.1, i18n EN/VI.

## 8. Tiêu chí test

**BE (unit + tích hợp, Postgres thật)**
1. Tiêu thụ: bình thường; thay đồng hồ (ví dụ BR-LS-12: 60 + 82 = 142); quay vòng; nước một số lẻ, bỏ phần lẻ.
2. Đầu kỳ = lần đọc còn hiệu lực trước đó. Hủy lần đọc → nháp tính lại. Đổi căn giữa kỳ → cộng hai căn.
3. Ví dụ DOM ra đúng số: điện 142 × 4.000 + 8 % = 613.440; nước 3,4 × 25.000 + 5 % = 89.250; kỳ lẻ 8.500.000 vào 20/11 = 3.113.000; kỳ cuối 5.387.000; làm tròn 9.502.690 → 9.502.000 với dòng −690.
4. `rentTiming=arrears`, `dueDay`, `utility_vat_rate` khác mặc định → kỳ và số đổi theo, không đổi mã. Đơn giá theo ngày cuối kỳ, VAT theo ngày phát hành (dùng dev clock).
5. Dòng dịch vụ: lấy đúng kỳ, bỏ FOC/âm/đã dời; không nằm trên hai phiếu sống (UK `folio_line_id`).
6. Phát hành: ghi đúng dòng folio (mục 2.4), `amount = round(quantity × unit)`, tổng folio tăng đúng `total_vnd`. Gửi lại cùng Idempotency-Key → cùng kết quả, không ghi hai lần. `If-Match` cũ → 412. Hai phát hành đồng thời → một thắng.
7. Hủy: chưa thu → đảo dòng, phiếu thay có `-R1`; đã thu → 409. Ghi thu một phần/đủ, vượt còn nợ → 422, đảo payment → lùi trạng thái.
8. Quá hạn suy ra đúng: ngày 05 `due_today`, 06 `overdue`, 08 `alert`, 15 `escalate`.
9. Quyền: ma trận mục 4 cho đủ 8 vai (403 đúng chỗ). OWN sửa được 3 khóa, MGR → 403. Giá trị ngoài biên → 422.
10. RLS: phiếu, chỉ số của cơ sở khác → 404. Test kiến trúc RLS, migrations-journal, parameters-delete-architecture xanh.
11. Migration chỉ thêm: chạy trên bản sao dữ liệu staging, không đổi số dòng/giá trị bảng cũ, folio cũ tính tiền như trước.

**FE (vitest + Playwright)**
1. Nút theo `availableActions`, FD không thấy Hủy phiếu đã phát hành, không thấy lựa chọn thay đồng hồ.
2. Luồng E2E: nhập chỉ số → nháp → xác nhận cảnh báo → phát hành → in → ghi thu VietQR → trạng thái Paid.
3. Trang in A5 và A4: một trang, ảnh chụp so sánh 2 khổ; chỉ font và màu brand (quét CSS biến màu ngoài bảng); không emoji; QR quét ra đúng số tiền và nội dung.
4. Trang in không có SĐT, email, quốc tịch, số giấy tờ. URL chỉ có `id`.

## 9. SEC cần xem (trước khi lên production)

1. **Dữ liệu cá nhân trên giấy**: chỉ họ tên, số căn, kỳ, số tiền. Không SĐT, email, quốc tịch, giấy tờ, ghi chú nội bộ, tên nhân viên đầy đủ. Phiếu giao tận tay hoặc để trong căn (không dán chỗ chung) – ghi vào sổ vận hành.
2. **VietQR**: `payment_receiving_account` hiện chỉ OWN đọc. Đợt này server dựng payload cho FD in. SEC xác nhận chấp nhận (giống QR lúc nhận/trả phòng). Nội dung chuyển khoản chỉ có mã phiếu, không tên khách (sao kê ngân hàng). QR tĩnh không tự xác nhận tiền: ghi thu VietQR luôn `reconciliation=pending`, không tự đối soát.
3. **Ảnh đồng hồ**: attachment C2 `purpose=meter`, chỉ chụp mặt đồng hồ. Thời gian lưu (DOM giả định hết HĐ + 12 tháng) đối chiếu `attachment_ops_retention_months`.
4. **IDOR, tenant**: mọi đường dẫn theo `propertyId` + RLS; `folioLineId` trong `excludedFolioLineIds` phải thuộc đúng folio.
5. **Nhật ký**: `meter_reading.recorded/voided/exception`, `billing_period.issued/voided/printed/payment_recorded`, sửa tham số (trước/sau). `note`, `void_reason`, `prior_adjustment_reason` qua bộ lọc mẫu số thẻ/giấy tờ đang có.
6. **Pháp lý giá điện** (không phải lỗ hổng, nhưng là rủi ro): DOM BR-LS-08 (c) – giá 4.000 đ/kWh bán lại cho người thuê có thể vượt trần giá bán lẻ. Chờ kế toán.

## 10. Còn mở – cần DOM / INV chốt (không chặn code, đã thành tham số)

| # | Điểm | Mặc định đang dùng | Ai chốt |
|---|---|---|---|
| 1 | Tiền thuê phần lẻ tháng đầu thu lúc nhận phòng hay gộp phiếu đầu (DOM câu 1) | `partialFirstMonthRent=at_checkin` (DOM đề xuất B) | INV |
| 2 | Phí dịch vụ 200.000/tháng (BR-204) còn thu không (DOM câu 2) | Không có dòng này trên phiếu | INV |
| 3 | % VAT điện, nước và trần giá điện bán lại (DOM câu 3) | 8 % / 5 % | INV + kế toán |
| 4 | Trả trước / trả sau tiền thuê | `advance` | DOM (đã đề xuất) |
| 5 | Ranh giới phiếu `final` và bill quyết toán lúc trả phòng: phiếu `final` không trừ cọc, bill trả phòng đọc folio như cũ. DOM xác nhận không cần gộp | Như mô tả | DOM |
| 6 | "Dịch vụ chưa thu" (BR-LS-14): folio không phân bổ tiền theo dòng, nên ARC hiểu là dòng chưa nằm trên phiếu sống nào và không phải FOC. Dòng đã thu ngay tại quầy thì lễ tân tự dời | Như mô tả | DOM |
| 7 | A89 làm đơn giản: FDL+ lưu thẳng ngoại lệ đồng hồ, không qua hộp duyệt | Như mục 4 | DOM + BA |
| 8 | Mã phiếu `TT-<yymm>-<số căn>[-R<n>]` có số căn: chấp nhận được (không phải dữ liệu cá nhân) | Như mô tả | DOM |

## 11. Sửa đổi 18/11 (INV bổ sung 17/11 + review PR BE #190, FE #189)

Tác giả: ARC. Đã có trên PR BE #190 (head `f522aa60`, OpenAPI vẫn `0.3.14-draft`, mọi thay đổi chỉ thêm). Review: `rounds/round-05/reviews/ARC-on-be-pr-190.md` (lượt 1 + lượt 2) và `ARC-on-fe-pr-189.md` (mục 1, bảng chốt tên trường).

### 11.1 Chỉ số đầu kỳ – lễ tân nhập mỗi kỳ (INV 17/11, thay mục 2.1 dòng "không lưu, không cho gõ")

- **Đầu kỳ là một lần đọc riêng**, có ngày, ảnh, người nhập riêng:
  - `checkin`: tháng nhận phòng;
  - `period_start` (`period_month` = tháng **mở**, đọc trong cửa sổ cuối tháng trước → hết ngày 01);
  - `room_change_in`: căn mới khi đổi căn.

  `period_start` của tháng nhận phòng → `422 VALIDATION_FAILED` (`periodMonth: NOT_ALLOWED`).
- **Số cuối kỳ trước** của **căn** (mọi đơn, kể cả khách trước) chỉ để so: cột `previous_reading_id`, API `previousClosing`.
- **Hao hụt:** `gap = đầu kỳ − cuối kỳ trước` lưu ở `electricity_gap`, `water_gap`, **không tính cho khách**, cho OWN xem. API trả `gap` trên lần đọc đầu kỳ.
- **Tiêu thụ tính tiền** = cuối kỳ − đầu kỳ **của cùng kỳ**. API trả `consumption` trên lần đọc cuối kỳ.
- **Thiếu** đầu kỳ hoặc cuối kỳ → phát hành `422 METER_READING_MISSING` (`missingReadings[].kind` ∈ `opening`, `period_end`, `room_change_out`).
- Bảng cuối tháng (S12): mỗi căn nhập **Closing M** (`period_end`) và **Opening M+1** (`period_start`) = 2 POST.
  - Ô đầu kỳ bắt buộc, không điền sẵn.
  - Một ảnh chỉ gắn được một lần đọc, nên FE tải ảnh hai lần.
- Đầu kỳ đọc trễ (11.2) thì phần dùng từ ngày 01 tới ngày đọc nằm trong `gap`, không tính khách. Đây là cách INV chọn, DOM ghi vào business-rules.

### 11.2 Kiểm tra lúc ghi chỉ số

**Trễ xét theo ngày nhập** (BUG-R5-008, PR #194): một lần đọc là "trong cửa sổ" khi `readOn` ∈ [from, to] **và** ngày nhập (ngày nghiệp vụ của cơ sở lúc gửi) ≤ to. Nhập sau `to` là đọc trễ, kể cả khi `readOn` lùi về trong cửa sổ. Đọc trễ nhận `readOn` ∈ [from, `lateUntil`] và ngày nhập ≤ `lateUntil` (`lateUntil` = to + `lateMaxDays`). `readOn` sau hôm nay → `422 VALIDATION_FAILED` (`readOn: DATE_INVALID`). Luật áp cho mọi loại có cửa sổ (`period_*`, `checkin`, `room_change_*`).

| Tình huống | Xử lý | Vai |
|---|---|---|
| **Cuối kỳ < đầu kỳ** cùng kỳ, không `exception` | `422 METER_LOWER_THAN_PREVIOUS` – chặn (BR-LS-12, số này thành tiền). Ngoại lệ thay đồng hồ / quay vòng → lưu | Ngoại lệ: FDL+ (FD → `403 FORBIDDEN_ACTION`) |
| **Đầu kỳ < cuối kỳ trước**, không `exception` | **Cảnh báo hai bước**: gửi lần đầu → `422 OPENING_BELOW_PREVIOUS_CLOSING` (`meter`, `previousValue`, `previousReadingId`, `previousKind`). Gửi lại cùng body + `acknowledgeLowerThanPrevious: true` (Idempotency-Key mới) → lưu, `gap` âm, audit `acknowledgedLower`. Nháp phiếu dùng lần đọc này có cảnh báo `OPENING_BELOW_PREVIOUS_CLOSING`, phát hành phải `acknowledgeWarnings` | FD+ |
| Đầu kỳ < cuối kỳ trước do thay đồng hồ trong khoảng trống | Gửi `exception` → lưu, không cảnh báo | FDL+ |
| **Đọc sau cửa sổ** `period_start`/`period_end`, trong `readingWindow.lateMaxDays` (mặc định 10, 0–31) | Có `lateReason` (3–300) → lưu (`late_reason`, `late_approved_by`, audit `meter_reading.late`, cảnh báo nháp `READING_LATE`). FD hoặc thiếu lý do → `422 READING_OUT_OF_WINDOW` kèm `windowFrom`, `windowTo`, `lateUntil`, `lateNeedsRole` | FDL+ |
| Quá `lateMaxDays` | `422 READING_OUT_OF_WINDOW` (không có `lateUntil`) | – |
| **`checkin` / `room_change_in` / `room_change_out`** (BE-190-12) | Gắn với **ngày sự kiện thật**: `checkin` = ngày đến, chỉ cho căn nhận lúc đến; `room_change_in` = ngày vào căn; `room_change_out` = ngày rời căn. Có nhiều lần đổi căn thì lấy lần gần nhất ≤ `readOn`. Cửa sổ [ngày sự kiện, + `readingWindow.daysAfter`]; trễ hơn tới `lateMaxDays` thì như dòng đọc sau cửa sổ (FDL+ kèm `lateReason`, cảnh báo `READING_LATE`); ngoài nữa → `422 READING_OUT_OF_WINDOW`. Căn không có sự kiện đó → `422 VALIDATION_FAILED` (`kind: NOT_ALLOWED`) | Trong cửa sổ: FD+. Trễ: FDL+ |
| Lần đọc thứ hai cùng sự kiện | `checkin`: một lần còn hiệu lực cho mỗi (đơn, căn) – chỉ mục `meter_reading_checkin_live_key`. `room_change_*`: một lần cho mỗi lần đổi căn. Trùng → `409 READING_EXISTS`; muốn sửa thì hủy lần đọc cũ rồi nhập lại | – |
| `checkout` | Chưa gắn cửa sổ (dùng cho bill quyết toán, ngoài phạm vi phiếu tháng) | FD+ |

Tham số `monthly_statement_rules` thêm `readingWindow.lateMaxDays` (mục 3).

### 11.3 Thay đổi API (chỉ thêm, trừ một mã cảnh báo bị bỏ)

| Chỗ | Thay đổi |
|---|---|
| `MeterReadingCreate` | thêm `acknowledgeLowerThanPrevious`, `lateReason` |
| `MeterReading` | thêm `previousClosing {readingId, readOn, electricity, water}`, `gap {electricity, water}`, `consumption {fromReadingId, electricity, water}`, `late`, `lateReason`, `readByInitials` (chữ cái đầu, không họ tên), `onIssuedStatement` |
| `listBillingCandidates` phần tử | thêm `reservationCode`, `kind`, `draftId`, `rooms[{roomId, roomNo, opening, closing, nextOpening, openingKind, segmentFrom}]` (`openingKind` ∈ `checkin`/`room_change_in`/`period_start` cho FE biết ô đầu kỳ nào cần nhập; `segmentFrom` = ngày đến hoặc ngày đổi căn) (`missing`/`recorded`/`exception`/`not_needed`; `nextOpening` không có `exception`). `readingStatus` gồm cả đầu kỳ, có `not_needed`. Có đơn `checked_out` còn trong `daysAfter` cần phiếu `final` |
| `BillingPeriod` | thêm `reservationCode`, `missingReadings[]`, `excludedLines[]` (nháp, không cộng tổng), `excludedFolioLineIds`, `priorAdjustment`, `note`, `replacesCode`, `voidReason`; dòng có `periodMonth` |
| `BillingPeriodTotals` | thêm `unreconciledVnd`, `disputed` (khoản thu VietQR `pending`/`disputed`; trạng thái phiếu không đổi) |
| `createBillingPeriod` | `kind` tùy chọn, server tự suy |
| `recordBillingPeriodPayment` | trả `{billingPeriod, payment {id, method, amountVnd, status, reconciliation}}` |
| `voidBillingPeriod` | trả `BillingPeriod` phẳng + `canReplace` (`BillingPeriodVoided`) |
| `getBillingPeriodPrint` | allowlist riêng (`BillingPeriodPrint`): không ghi chú, lý do, folio, giá chụp, thao tác (SEC BE-190-03). `property.email` = null (chưa có cột). Thêm `roomNames` (tên phòng cho khách, cùng thứ tự `roomNos`, null khi chưa đặt tên; đọc tên hiện tại) |
| Cảnh báo | **bỏ `PRICE_CHANGED_SINCE_DRAFT`**: nháp không lưu số, giá và VAT đọc lại lúc phát hành. Thêm `OPENING_BELOW_PREVIOUS_CLOSING`, `READING_LATE` |
| Mã lỗi mới | `OPENING_BELOW_PREVIOUS_CLOSING` (422). `READING_OUT_OF_WINDOW` thêm trường |

### 11.4 Dữ liệu và quyền

- Migration `0099` (sửa tại chỗ trước khi merge, chưa chạy ở môi trường nào):
  - `meter_reading` thêm `previous_reading_id`, `electricity_gap`, `water_gap`, `late_reason`, `late_approved_by` (CHECK đi cặp);
  - FK `payment_billing_period_fk (property_id, billing_period_id) → billing_period`.
  - chỉ mục duy nhất từng phần `meter_reading_checkin_live_key (reservation_id, room_id) WHERE kind = 'checkin' AND voided_at IS NULL`.

  Sau merge, mọi sửa đổi là migration mới.
- Quyền:
  - 3 API chỉ số dùng **A123** (OWN/MGR/FDL/FD) thay A88. A88 có MT, đợt này chưa mở cho MT; khi mở thì gộp.
  - A89 làm đơn giản như mục 4.
- `PaymentsModule` dừng lúc khởi động nếu thiếu listener của `BillingModule`. Mọi app có PaymentsModule phải nạp BillingModule.
- Ảnh đồng hồ: `purpose=meter` đã mở upload. Mốc lưu giữ đặt lúc trả phòng (`setMeterRetentionAnchor`), xóa theo `attachment_ops_retention_months` (SEC BE-190-01).

### 11.5 Còn mở

- Trước production: chạy 0099 trên bản sao staging (BE-190-07).
- Trước merge: CI đủ bước xanh, hiện đỏ ở `pnpm audit`, không do PR (BE-190-10).
- DOM: ghi vào `business-rules.md` các điểm của 11.1 (đầu kỳ nhập mỗi kỳ, hao hụt không tính khách, đọc trễ thì hao hụt gồm phần đầu tháng) và 11.2.

## 12. Sửa đổi 18/11 lần 2 – gói sửa trước ra mắt v1.0.7 (khách dài hạn đang ở)

Tác giả: ARC. Căn cứ: INV 18/11 chọn "sửa nhỏ trước ra mắt" (decision-log, dòng cuối), `go-live-guide.md` cách A, `DOM-late-entry-proposal.md` (BR-LS-17), `business-rules.md` §3A, OPS `report.md` §18.3, §20, QC `fb-inv-012-qc-gate.md` điều kiện 3, 5, 9, 10, 11. Code đọc trên main @ `e8b419af`.

Nguyên tắc: **chỉ thêm, expand-first**. Không đổi hành vi của đường đang chạy (nhận phòng thường, tạo đơn thường, ghi thu tiền mặt/VietQR, giá dọn khách ngắn ngày). Mỗi tính năng mới là một đường riêng, quyền MGR/OWN, có lý do và audit. Không thêm màn hình.

### 12.0 Quyết định ARC (ORC ghi decision-log)

| # | Quyết định | Lý do |
|---|---|---|
| G1 | **Nhận phòng bù là operation riêng** `checkInBackdated`, không thêm cờ vào `checkIn`. | `checkIn` có giờ, phụ thu, B9a, khoản thu, nhánh duyệt 202. Đường riêng không đụng đường cũ, quyền MGR/OWN khai ở `x-roles`, test tách. |
| G2 | **Ngày đến trên Desk của khách ở từ trước Desk** = ngày đến thật nếu còn trong biên (12.1); khách ở trước ngày 01 của tháng đang chốt thì ngày đến trên Desk = **ngày 01 của tháng đó** (thường là 01/11), ngày bắt đầu HĐ thật ghi ở `manualLongStay.note`. | Desk chỉ quản lý từ kỳ có số điện nước đầu kỳ (INV 18/11: có số đầu tháng 11). Tiền thuê HĐ trên Desk tính từ ngày đến trên Desk tới ngày hết HĐ, nên phiếu cuối khớp. Không đưa vào Desk các tháng đã quyết toán ở nền tảng cũ. |
| G3 | **Phiếu tháng nhận phòng không tự sinh.** Sau nhận phòng bù, Desk hiện phiếu tháng nhận phòng trong "Ready to bill" như nhận phòng thường (`partialFirstMonthRent=at_checkin`). Khách đã trả ngoài Desk thì lễ tân tạo nháp → phát hành → **ghi "đã thu ngoài Desk"** (12.2). Chưa trả thì thu như thường. | Một đường tiền duy nhất: phiếu đã phát hành có dòng thuê trong `billing_period_line`, nên `priorRentVnd` của phiếu cuối tự trừ (BR-LS-04). Không cần sửa công thức phiếu cuối. |
| G4 | "Đã thu ngoài Desk" là **một khoản thu** `payment` với phương thức mới `outside_desk`, không phải dòng điều chỉnh folio. | Doanh thu tiền thuê vẫn ghi đúng tháng, folio cân, phiếu chuyển `paid` bằng `refreshPaid` có sẵn. Điều chỉnh âm sẽ xóa doanh thu tháng 11 và làm sai giới hạn giảm giá trên nhóm `room`. |
| G5 | Địa chỉ, hotline đi theo mẫu `getPropertyWifi`/`setPropertyWifi`: đọc/ghi cột `property.address`, `property.phone_public` có sẵn, không thành tham số. | Hai cột đã là nguồn của chân phiếu (`print()`), trang công khai căn và miễn trừ hotline của bộ lọc `SENSITIVE_DATA_DETECTED`. Một nguồn. |
| G6 | Giá dọn thêm dài hạn = khóa mới `long_stay_cleaning_fee_by_room` theo **số căn** (đúng mô tả H3 trong `tham-so-quy-tac.md`), mặc định `{}`. Căn không có trong bảng → `adhoc_cleaning_fee` như hôm nay. | Mặc định rỗng = hành vi v1.0.7 không đổi tới khi OWN nhập. Không đụng `adhoc_cleaning_fee` của khách ngắn ngày. |
| G7 | Đọc bù BR-LS-17 = `recordMeterReading` thêm `catchUp: true`, theo gợi ý DOM §4. | Chỉ thêm trường; luật trễ theo ngày nhập (BUG-R5-008) giữ nguyên. |
| G8 | **Migration `0100_go_live_fix_fb_inv_012.sql`** gom mọi thay đổi DB của gói này. **FB-INV-013 đổi sang `0101`** và OpenAPI `0.3.16-draft` (đã sửa `fb-inv-013/contract.md`). Mã hành động của FB-INV-013 (A124–A126) giữ nguyên; gói này dùng **A127–A130**. | FB-INV-013 chưa bắt đầu, gói này lên production trước. Không bao giờ hai file cùng số. |
| G9 | Migrator đặt `lock_timeout` (12.6). Production đang ở 73: v1.0.7 chạy **0099 + 0100 trong một giao dịch** (drizzle chạy các file còn thiếu trong một giao dịch) – hết `lock_timeout` thì không file nào được áp. | QC điều kiện 10; OPS §18.3. |

### 12.1 Nhận phòng bù và tạo đơn dài hạn với ngày đến đã qua (MGR/OWN)

**Biên ngày đến bù** (dùng chung cho cả hai đường dưới), so với ngày nghiệp vụ hôm nay `T`:
- `arrivalDate` ∈ [`T` − 45 ngày, `T` − 1]. Ngoài biên → `422 VALIDATION_FAILED` (`arrivalDate: BACKDATE_OUT_OF_RANGE`, kèm `earliest`). 45 là hằng số trong mã, không phải tham số.
- Ngày đến thuộc **tháng trước** tháng của `T`: chỉ nhận khi chỉ số cuối kỳ tháng đó còn nhập được dạng ghi trễ, tức `T` ≤ `lateUntil` của `period_end` tháng đó (`windowOf` + `lateMaxDays`, mặc định hết ngày 11). Khác → `422` (`arrivalDate: PREVIOUS_MONTH_CLOSED`). Lý do: nếu không, phiếu tháng sau bị `METER_READING_MISSING` mà không ai nhập được cuối kỳ (DOM ghi luật G2 cho trường hợp này).
- Ngày đi > `T` (khách còn ở). Khác → `422` (`departureDate: DATE_IN_PAST`).
- Chỉ đơn **dài hạn nhập tay** (`stay_type='long'`, có `manual_long_stay`). Đơn khác → `422 NOT_LONG_STAY`.

#### 12.1.1 `createReservation` – thêm `backdatedArrival` (chỉ thêm trường)

- Body thêm `backdatedArrival: { reason: string 3–300 }` (lọc mẫu số thẻ/giấy tờ như `internal_note`). Chỉ hợp lệ cùng `manualLongStay`; thiếu `manualLongStay` → `422` (`backdatedArrival: NOT_ALLOWED`).
- Có `backdatedArrival`: bỏ kiểm `arrivalDate: DATE_IN_PAST` (dòng ~621 `reservations.service.ts`), thay bằng biên 12.1. Không có `backdatedArrival` → giữ nguyên `DATE_IN_PAST`.
- Vai: OWN, MGR. FDL/FD gửi `backdatedArrival` → `403 FORBIDDEN_ACTION` (+ audit `access.denied`). `x-roles` của `createReservation` không đổi; server kiểm vai theo trường.
- Mọi kiểm khác giữ nguyên: `assertSellable` và khóa căn trên **cả các đêm đã qua** (căn đã có lượt khác trong khoảng đó → `409 ROOM_UNAVAILABLE` như cũ), ngưỡng dài hạn, `depositHeldVnd`. Đơn tạo ra là `confirmed`, `syncLeaseNights` như cũ.
- Audit `reservation.created` thêm `after.backdatedArrival = true` và lý do; `staff_notification` cho OWN (`kind = backdated_stay`, chỉ mã đơn + số căn).
- BE kiểm trước khi code: job đổi ngày nghiệp vụ / no-show không quét đơn `confirmed` dài hạn nhập tay có ngày đến đã qua trước khi nhận phòng bù (6 đơn production đang ở trạng thái này nên nhiều khả năng không quét). Nếu có quét, loại đơn có `backdatedArrival` khỏi job tới hết ngày tạo.

#### 12.1.2 `checkInBackdated` (operation mới)

`POST /v1/properties/{propertyId}/reservations/{reservationId}/actions/check-in-backdated` – `If-Match`, `Idempotency-Key`, `x-requires-trusted-device: true`, `x-roles: [owner, manager]`, `x-rbac: [A127, S06]`.

```json
// body
{ "arrivalDate": "2026-11-01", "reason": "Khách ở từ trước khi có Desk – HĐ giấy",
  "cardsIssued": 2, "documentBlockOverride": { "reason": "Đã khai tạm trú ngoài Desk" } }
```

| Bước | Luật |
|---|---|
| Thứ tự kiểm | thiết bị → quyền → `If-Match` → `status = confirmed` (khác → `409 INVALID_TRANSITION`) → đơn dài hạn nhập tay (`422 NOT_LONG_STAY`) → biên 12.1 cho `arrivalDate` → `conflictState` → điều kiện → dữ liệu trường |
| `arrivalDate` | Ngày đến thật (hoặc ngày 01 theo G2). Bắt buộc < `T`. Bằng `T` → `422` (`arrivalDate: USE_CHECK_IN`, dùng `checkIn` thường). Khác `reservation.arrival_date` → server **dời ngày đến** của đơn trong cùng giao dịch (sớm hơn: kiểm căn trống các đêm thêm, `409 ROOM_UNAVAILABLE`; muộn hơn: trả các đêm thừa), `booked_arrival_date` giữ nguyên, `syncLeaseNights` lại. Tiền thuê tháng và ngày hết HĐ **không đổi** |
| Điều kiện BR-402 | Dùng lại `evaluate` của `checkIn`. **Bỏ** `room_ready` (khách đang ở trong căn), nhưng căn có lượt khác `in_house` hoặc phủ các đêm đó → `409 CHECKIN_CONDITIONS_NOT_MET` (`unmet: [room_occupied]`). `balance_paid`: đơn nhập tay không có dòng folio lúc nhận phòng nên đạt. `document_check_block`: như `checkIn`, MGR/OWN là FDL+ nên được `documentBlockOverride` có lý do |
| Không có | Giờ nhận phòng, phụ thu nhận sớm, B9a, `payment`, `houseRulesSent`, nhánh 202. Gửi các trường đó → `422` (`<field>: NOT_ALLOWED`) |
| Ghi | Khóa: đơn → căn → folio (như `checkIn`). `status = in_house`, `actual_checkin_at` = **giờ bấm thật** (không lùi), `cards_issued`, buồng → `OC`. Cột mới `checkin_backdated_on` = `T`, `checkin_backdated_reason`. Không ghi dòng folio, không thu tiền |
| Sự kiện | Cùng hook/outbox như B9 (`reservation.checked_in`, SSE) + `after.backdated = {arrivalDate, previousArrivalDate}`. Audit `reservation.checked_in_backdated` (category `state`), `staff_notification` OWN như 12.1.1 |
| Khai báo lưu trú | Hạn khai báo tính từ `actual_checkin_at` như B9 (không lùi về ngày đến). Khách đã khai ngoài Desk: lễ tân đánh dấu theo luồng khai báo hiện có; khi FB-INV-013 lên thì dùng K14 |
| Phản hồi | `Reservation` như `checkIn`. `Reservation` thêm `checkinBackdatedOn: LocalDate \| null` (staff, không lý do). `allowedActions` thêm `check_in_backdated` khi: vai OWN/MGR, đơn `confirmed` dài hạn nhập tay, `arrival_date` < `T`. FE chỉ hiện nút theo `allowedActions` |

#### 12.1.3 Chỉ số nhận phòng của đơn nhận phòng bù

Đây là lần đọc `kind = checkin` như cũ, khác ở cửa sổ (sửa `gate` trong `meter-readings.service.ts`, chỉ khi `checkin_backdated_on` có giá trị):
- `readOn` ∈ [`arrival` − 1 ngày, `T`]: được khai ngày đọc trên sổ giấy (ví dụ tối 31/10 cho ngày đến 01/11). Đây là ngoại lệ có kiểm soát của BUG-R5-008, chỉ cho `checkin` của đơn nhận phòng bù.
- **Luôn là đọc trễ**: FDL+ và `lateReason` bắt buộc; `late = true`, audit `meter_reading.late`, nháp có `READING_LATE`. FD → `422 READING_OUT_OF_WINDOW` (`lateNeedsRole: front_desk_lead`).
- Nhập được tới `lateUntil` = `checkin_backdated_on` + `daysAfter` + `lateMaxDays` (mặc định + 11 ngày). Sau đó chỉ còn đọc bù 12.5 (ngày đọc = hôm nay).
- Không có ảnh (số trên sổ giấy): FDL+ chọn thiếu ảnh kèm `note` như BR-LS-13.
- Hệ quả: **không cần OWN nâng `lateMaxDays`** như go-live-guide mục 3. DOM sửa hướng dẫn.

Phiếu tháng nhận phòng: theo G3. Phiếu tháng sau (12/2026): điện nước = cuối kỳ 11 − chỉ số nhận phòng (bù), như mọi đơn.

### 12.2 Ghi "đã thu ngoài Desk" cho phiếu tháng (MGR/OWN)

`POST /v1/properties/{propertyId}/billing-periods/{id}/settle-outside-desk` – `operationId: settleBillingPeriodOutsideDesk`, `If-Match` + `Idempotency-Key`, `x-roles: [owner, manager]`, `x-rbac: [A128]`.

```json
{ "amountVnd": 8500000, "receivedOn": "2026-11-03", "reason": "Tiền thuê 11/2026 đã trả trên nền tảng cũ", "reference": null }
```

| Điểm | Luật |
|---|---|
| Trạng thái | Chỉ phiếu `issued`/`partially_paid` (khác → `409 INVALID_TRANSITION`) |
| `amountVnd` | Tùy chọn, mặc định = còn phải thu. > còn phải thu → `422 AMOUNT_OVER_BALANCE`. ≤ 0 → `422 VALIDATION_FAILED`. Cho phép một phần (khách trả trước tiền thuê ngoài Desk, điện nước trả trên Desk) |
| `receivedOn` | Bắt buộc, ≤ `T`. Lưu `received_at` = 12:00 giờ cơ sở của ngày đó |
| `reason` | Bắt buộc 3–300, lưu vào `payment.note`, qua bộ lọc mẫu số thẻ/giấy tờ. `reference` tùy chọn ≤ 64 ký tự `[A-Za-z0-9 ./-]`, lọc như `bankReference`; không nhận số tài khoản |
| Ghi | Qua `PaymentsService.recordInTx` (đường mới, chỉ module billing gọi được): `type = charge`, `method = outside_desk`, `status = succeeded`, `reconciliation = not_required`, `shift_id = NULL`, `billing_period_id` = phiếu. Rồi `refreshPaid` (có sẵn) → `partially_paid`/`paid` |
| Ngoài ca và đối soát | Không vào ca, không vào đóng ca, không vào hàng đối soát chuyển khoản/VietQR, không vào tiền mặt bàn giao. CHECK DB bảo đảm (12.7) |
| Hoàn, đảo | Không hoàn tiền trên khoản `outside_desk` (`createRefund` với nguồn là khoản này → `422 NOT_ALLOWED`). Ghi nhầm → **đảo** bằng `reversePayment` có sẵn (A34, OWN/MGR); listener đảo đã trừ `paid_vnd` và lùi trạng thái |
| Audit, báo | Audit `billing_period.settled_outside_desk` (category `money`, thêm vào `money-actions.ts`): số tiền, ngày nhận, lý do. `staff_notification` cho mọi OWN của cơ sở mỗi lần ghi (chỉ mã phiếu + id đơn; **không số tiền, không người ghi**, theo SEC A5 – số tiền và người ghi ở audit `money`; ARC review #197 lệch 5) |
| Phản hồi | Như `recordBillingPeriodPayment`: `{billingPeriod, payment {id, method, amountVnd, status, reconciliation}}` |
| `availableActions` | Thêm giá trị thứ 7 `settle_outside_desk` (vai OWN/MGR, phiếu còn nợ). Client gặp giá trị lạ thì bỏ qua (5.1) |
| Trên phiếu in | Khoản `outside_desk` tính vào "Đã thu" (`paidVnd`). Hết nợ → không QR, dấu PAID như cũ. Không in lý do |

**Phiếu cuối không thu hai lần** (BR-LS-04): `priorRentVnd` cộng dòng `rent` của mọi phiếu `issued/partially_paid/paid`, không xét phiếu được thu bằng cách nào. Phiếu tháng nhận phòng phát hành rồi ghi ngoài Desk vẫn có dòng thuê, nên phiếu cuối = tiền thuê HĐ (tính từ ngày đến trên Desk) − Σ thuê đã phát hành. **Không sửa** công thức; BE thêm test (12.10 BE-12).

**Phương thức mới ở mọi nơi đọc `payment.method`** (BE rà bằng `grep`, sửa đúng chỗ, ghi danh sách trong PR):

| Nơi | Cách xử lý `outside_desk` |
|---|---|
| Số dư folio, bill trả phòng, `paidVnd` phiếu | Tính là đã thu (như mọi `charge` `succeeded`) |
| Ca, đóng ca, tiền mặt bàn giao (A46a) | Không tính (đã loại vì `shift_id` null; kiểm lại các truy vấn lọc theo `method <> …`) |
| Hàng đối soát (SM-12), `unreconciledVnd` | Không tính (`not_required`) |
| Báo cáo thu theo phương thức | Dòng riêng "Paid outside the app · Khách đã trả ngoài app" (UXD 196-01, sửa 18/11; khóa i18n vẫn là `payment.method.outside_desk`). Không cộng vào "thu tại quầy" |
| Nhãn bill, lịch sử thanh toán FE | `payment.method.outside_desk` EN/VI |
| `payments.controller.ts` `METHODS`, `R2_METHODS` | **Không thêm**: `recordPayment`, `confirmPaymentReceived`, B9/B18 gửi `outside_desk` → `422` (`method: NOT_IN_LIST`) |
| Hoàn tiền | Như bảng trên |

### 12.3 OWN sửa địa chỉ và hotline cơ sở (chân phiếu)

| Operation | Đường | Vai | rbac |
|---|---|---|---|
| `getPropertyContact` | `GET /v1/properties/{propertyId}/contact` | OWN, MGR, FDL (vai xem S24) | S24 |
| `setPropertyContact` | `PUT /v1/properties/{propertyId}/contact` | **OWN** (MGR, khác → `403 FORBIDDEN_ACTION`) | A129 |

- Thân và phản hồi `PropertyContact { addressLine: string \| null, hotline: string \| null }` ↔ `property.address`, `property.phone_public`. `Cache-Control: no-store`. Không `If-Match` (như Wi-Fi, audit giữ bản trước).
- Kiểm: `addressLine` bỏ khoảng trắng đầu/cuối, 5–200 ký tự, một dòng, không ký tự điều khiển; `hotline` khớp `^\+?[0-9][0-9 .-]{7,19}$`, lưu dạng đã chuẩn hóa (bỏ dấu cách/chấm/gạch, giữ `+`). Sai → `422 VALIDATION_FAILED` (không lặp lại giá trị đã gửi). `null` = xóa.
- Audit `config` `property.contact_changed` (trước/sau – đây là thông tin công khai). Không SSE.
- Tác động: chân phiếu in (`print()` đã đọc hai cột), trang công khai căn (`phonePublic`), và **miễn trừ hotline** của bộ lọc `SENSITIVE_DATA_DETECTED` (đọc lại ở lần kiểm sau, không cache lâu hơn giao dịch). BE kiểm cả ba.

### 12.4 Giá dọn thêm theo hạng cho khách dài hạn (H3)

- Khóa `long_stay_cleaning_fee_by_room` (thêm vào `config_parameter_def` trong 0100): `edit_roles = {owner, manager}` (như `adhoc_cleaning_fee`, A101), `default_value = {}`, có ngày hiệu lực. Giá trị `{"<số căn>": VND}`. Hook kiểm: số căn có trong danh mục căn của cơ sở; mỗi giá 0–5.000.000, bội 1.000. Sai → `422 PARAM_OUT_OF_RANGE` / `VALIDATION_FAILED`.
- **Một hàm chọn giá** (module folio, public): `cleaningFeeFor(tx, {reservationId, onDate})` = nếu đơn `stay_type = 'long'` và căn đơn đang giữ ngày `onDate` có trong bảng hiệu lực ngày `onDate` → giá trong bảng; ngược lại → `adhoc_cleaning_fee`. Trả kèm `source: 'long_stay_room' | 'default'`.
- Dùng ở: (a) `addFolioLine` với `chargeCode = adhoc_cleaning_fee` (giá không sửa được như cũ; `onDate` = ngày dịch vụ hoặc hôm nay); (b) `guest-requests.service.ts` `options()` và lúc tạo yêu cầu dọn của khách (giá chụp vào `fee_vnd_snapshot` như cũ – yêu cầu đã gửi giữ giá); (c) `getChargeCatalog` thêm query tùy chọn `folioId` → mục `adhoc_cleaning_fee` trả giá theo hàm trên + `priceSource`. Không có `folioId` → như cũ.
- Khách ngắn ngày: không đổi gì (`adhoc_cleaning_fee`). `production-defaults.ts` không ghi dòng mới (mặc định `{}`).
- OWN/MGR đặt trên production: `{"101":150000,…}` theo hạng BR-LS-07 (DOM sửa dòng "Đội đề xuất" của H3 sang 150.000/200.000). Staging sửa theo (QC điều kiện 3). Khi đã đặt, lễ tân **bỏ** dòng phần chênh +50.000/+100.000 (go-live-guide mục 5.3).

### 12.5 Đọc bù sau hạn ghi trễ – BR-LS-17 (MGR/OWN)

- `MeterReadingCreate` thêm `catchUp: boolean` (mặc định false). Lý do dùng lại `lateReason`.
- Nhận `catchUp: true` khi **cả** các điều kiện: ngày nhập > `lateUntil` của lần đọc đó (theo `gate` 11.2, kể cả 12.1.3); `readOn` = `T`; vai OWN/MGR; `lateReason` 3–300; có `photoAttachmentId` (không `photoWaived`).
  - FD/FDL gửi `catchUp` → `403 FORBIDDEN_ACTION`.
  - Còn trong cửa sổ hoặc còn hạn ghi trễ → `422 VALIDATION_FAILED` (`catchUp: NOT_ALLOWED`) – dùng đường thường.
  - `readOn` ≠ `T` → `422` (`readOn: CATCH_UP_TODAY_ONLY`). Thiếu ảnh hoặc `photoWaived` → `422` (`photoAttachmentId: REQUIRED`). Thiếu lý do → `422` (`lateReason: REQUIRED`).
- `READING_OUT_OF_WINDOW` khi đã quá `lateUntil` thêm `catchUpNeedsRole: "manager"` (FE hiện nút "Catch-up reading today · Đọc bù hôm nay" cho MGR/OWN, câu báo DOM §3.3 cho FD/FDL).
- Áp cho `checkin`, `period_start`, `period_end`, `room_change_in`. `period_end` bù: `readOn` = `T` vẫn là cuối kỳ của `periodMonth`; lễ tân ghi tiếp `period_start` tháng sau cùng số, cùng ngày, cũng `catchUp` (`gap` = 0). Đơn giá vẫn theo ngày cuối tháng M (BR-LS-07, mã có sẵn dùng `periods.utility.to`); phiếu in ngày đọc thật.
- **`room_change_out` bù: ngoài phạm vi v1.0.7.** Gửi `catchUp` với `room_change_out` → `422` (`kind: NOT_ALLOWED`). Gợi ý số của lượt sau (BR-LS-17 (c)) làm round sau; tới lúc đó ORC xử lý bằng BR-LS-16 (hiếm: khách dài hạn đổi căn rồi quên chốt căn cũ quá 10 ngày).
- Lưu `catch_up = true`, `late_reason`, `late_approved_by` = người ghi; audit riêng `meter_reading.catch_up`; nháp phiếu dùng lần đọc này có cảnh báo **`READING_CATCH_UP`** (thay `READING_LATE` cho lần đọc đó), phát hành phải `acknowledgeWarnings`. `MeterReading` thêm `catchUp`.
- Không đổi: cảnh báo hai bước đầu kỳ < cuối kỳ trước, chặn cuối < đầu, ngoại lệ đồng hồ (A89), `voidMeterReading`, lần đọc trên phiếu đã phát hành không bị thay.
- Kèm trong PR BE (QC điều kiện 11, nhỏ): SEC 190-07 (test J16 xóa ảnh `meter`), 190-08 (đặt mốc lưu ảnh khi đơn bị hủy sau hoàn tác nhận phòng). Tách PR riêng nếu làm chậm gói; hạn 31/12.

### 12.6 `lock_timeout` cho migrator

- `src/db/migrate.ts`: sau `pg_advisory_lock` và `SET ROLE ottimo_owner`, chạy `SET lock_timeout = '10s'` trước `migrate(...)`. Giá trị là hằng số `MIGRATION_LOCK_TIMEOUT = '10s'`; cho phép ghi đè bằng biến môi trường `MIGRATION_LOCK_TIMEOUT` (khớp `^\d{1,3}s$`, 1–120 s; sai → dừng với lỗi rõ). Đặt **sau** khóa advisory để hai lượt deploy chồng nhau vẫn chờ nhau như cũ.
- Hết giờ → Postgres `55P03 lock_not_available`, giao dịch migrate rollback (không file nào được ghi vào `__drizzle_migrations`), tiến trình thoát mã ≠ 0, `deploy.sh` dừng trước khi thay container (OPS xác nhận nhánh này), api cũ chạy tiếp. Log in tên migration đang chạy và gợi ý "retry off-peak".
- OPS §19.6 mục 4 giữ kiểm `pg_locks` trước khi duyệt (lớp thứ nhất); `lock_timeout` là lớp thứ hai.

### 12.7 Migration `0100_go_live_fix_fb_inv_012.sql` (chỉ thêm)

| # | Thay đổi | Khóa trên production |
|---|---|---|
| 1 | `reservation` ADD COLUMN `checkin_backdated_on date NULL`, `checkin_backdated_reason text NULL`; CHECK `reservation_checkin_backdated_pair_check` (cùng null hoặc cùng có; lý do 3–300) | ACCESS EXCLUSIVE rất ngắn (thêm cột null không mặc định = chỉ metadata; CHECK quét 11 dòng) |
| 2 | `payment`: DROP + ADD `payment_method_check` thành **tập cha** (thêm `outside_desk`); ADD CHECK `payment_outside_desk_check`: `method <> 'outside_desk' OR (type = 'charge' AND billing_period_id IS NOT NULL AND reconciliation = 'not_required' AND shift_id IS NULL AND note IS NOT NULL)` | ACCESS EXCLUSIVE ngắn, quét 3 dòng |
| 3 | `meter_reading` ADD COLUMN `catch_up boolean NOT NULL DEFAULT false`; CHECK `NOT catch_up OR (late_reason IS NOT NULL AND late_approved_by IS NOT NULL AND photo_attachment_id IS NOT NULL)` | Bảng mới của 0099, 0 dòng |
| 4 | `config_parameter_def`: thêm `long_stay_cleaning_fee_by_room` (12.4) | Dòng mới |
| 5 | `staff_notification.kind` (nếu có CHECK): nới thành tập cha, thêm `backdated_stay`, `statement_settled_outside_desk` | Như 0093 |

- Không `UPDATE`/`DELETE` dữ liệu cũ. Không đụng `property` (cột có sẵn). Schema drizzle, journal + snapshot dựng lại từ main.
- **Quay lui** (`rollback.sh sha-f8791cf83b63` hoặc image v1.0.7 trước gói): DB đi trước image. Image cũ không đọc cột/khóa mới. Rủi ro duy nhất: nếu đã có khoản `outside_desk` mà quay về image cũ, nhãn phương thức có thể hiện mã thô trên Desk cũ. Không mất tiền, không chặn đọc.
- Chạy trên staging (đang ở 74) trước. Trên production: 0099 + 0100 cùng giao dịch; OPS ghi số đếm trước/sau như §19.6 (thêm: 3 cột mới, 2 CHECK mới `convalidated = true`, `config_parameter_def` +4 so với 200).

### 12.8 OpenAPI `0.3.15-draft` (chỉ thêm)

| Chỗ | Thay đổi |
|---|---|
| `createReservation` | thêm `backdatedArrival {reason}`; mô tả biên 12.1, `403` theo trường |
| `checkInBackdated` | operation mới (12.1.2) |
| `Reservation` | thêm `checkinBackdatedOn`; `allowedActions` thêm `check_in_backdated` |
| `settleBillingPeriodOutsideDesk` | operation mới (12.2) |
| `PaymentMethod` | thêm `outside_desk` – ghi rõ "chỉ server ghi qua `settleBillingPeriodOutsideDesk`; mọi thân tạo khoản thu khác → `422 NOT_IN_LIST`" |
| `BillingPeriod.availableActions` | thêm `settle_outside_desk` |
| `getPropertyContact`, `setPropertyContact`, `PropertyContact` | mới (12.3) |
| `getChargeCatalog` | query `folioId` tùy chọn; `ChargeCatalogItem.priceSource` tùy chọn |
| `MeterReadingCreate` / `MeterReading` | `catchUp` |
| `READING_OUT_OF_WINDOW` | thêm `catchUpNeedsRole` |
| Cảnh báo phiếu | thêm `READING_CATCH_UP` |
| Mã trường mới | `BACKDATE_OUT_OF_RANGE`, `PREVIOUS_MONTH_CLOSED`, `USE_CHECK_IN`, `CATCH_UP_TODAY_ONLY` (đều trong `422 VALIDATION_FAILED`); `unmet` thêm `room_occupied` |
| `setParameter` | khóa `long_stay_cleaning_fee_by_room` (A101) |

### 12.9 Quyền – `rbac-matrix.md` mục 4 + `rbac-matrix.json` (cùng commit). **Không sửa mục 3, không sửa `screens.ts`**

| # | Hành động | OWN | MGR | FDL | FD | Khác | Màn hình có sẵn |
|---|---|:-:|:-:|:-:|:-:|:-:|---|
| A127 | Nhập bù khách dài hạn đang ở: tạo đơn với ngày đến đã qua, nhận phòng bù (12.1) | ✔ Q | ✔ Q | ✖ | ✖ | ✖ | S04, S06 |
| A128 | Ghi "đã thu ngoài Desk" cho phiếu tháng (12.2) | ✔ | ✔ | ✖ | ✖ | ✖ | S16 |
| A129 | Sửa địa chỉ, hotline công khai của cơ sở (12.3) | ✔ | ✖ | ✖ | ✖ | ✖ | S24 (MGR, FDL chỉ xem) |
| A130 | Đọc bù chỉ số sau hạn ghi trễ (BR-LS-17, 12.5) | ✔ | ✔ | ✖ | ✖ | ✖ | S12, S16 |
| A101 (có) | + khóa `long_stay_cleaning_fee_by_room` | ✔ | ✔ | ✖ | ✖ | ✖ | S24 |
| A34 (có) | + đảo khoản `outside_desk` | ✔ | ✔ | ✖ | ✖ | ✖ | S04 |

- Mọi màn hình trên đã có ở mục 3 cho OWN/MGR. `getPropertyContact` gắn S24 (OWN/MGR/FDL đã có S24). Vì vậy `SCREENS_BY_ROLE` không đổi và test đồng bộ tài liệu ↔ `screens.ts` không đỏ.
- A124–A126 đã giữ cho FB-INV-013. Ghi chú mới (số kế tiếp trong rbac) cho A127–A130: "FB-INV-012 gói sửa trước ra mắt, contract §12".

### 12.10 Chia việc – 2 PR chạy song song sau hợp đồng này

**PR BE** `r5-fb012-golive-be` (nhánh từ main; FE làm song song trên mock):

| # | Việc |
|---|---|
| BE-1 | Migration 0100 (12.7), schema drizzle, journal + snapshot |
| BE-2 | `migrate.ts` `lock_timeout` (12.6) + test tích hợp |
| BE-3 | `createReservation.backdatedArrival` + hàm biên dùng chung `backdateBounds(T, arrival, rules)` (12.1) |
| BE-4 | `checkInBackdated` (controller, service tách khỏi `checkIn`, dùng lại `evaluate`, `syncLeaseNights`, hook B9); `allowedActions.check_in_backdated`; `checkinBackdatedOn` |
| BE-5 | `meter-readings.service.ts` `gate`: cửa sổ nhận phòng bù (12.1.3) và `catchUp` (12.5); cảnh báo `READING_CATCH_UP` trong `statements.service.ts` |
| BE-6 | `settleBillingPeriodOutsideDesk` + đường `recordInTx` cho `outside_desk`; rà mọi nơi đọc `payment.method` theo bảng 12.2; chặn hoàn tiền; `money-actions.ts`; `staff_notification` OWN |
| BE-7 | `getPropertyContact`/`setPropertyContact` theo mẫu Wi-Fi |
| BE-8 | `long_stay_cleaning_fee_by_room`: hook kiểm, `cleaningFeeFor`, dùng ở `addFolioLine`, `guest-requests`, `getChargeCatalog?folioId` |
| BE-9 | `openapi.yaml` 0.3.15-draft + `generated/*`; `rbac-matrix.md` (A127–A130, ghi chú A34/A101) + `.json`; `erd.md` (cột mới, phương thức mới) |
| BE-10 | Seed dev/e2e: 1 đơn dài hạn nhập tay `confirmed` có ngày đến = hôm nay − 10; bảng `long_stay_cleaning_fee_by_room` mẫu (giá giả); địa chỉ/hotline giả |
| BE-11 | SEC 190-07, 190-08 (tách nếu chậm) |
| BE-12 | Test: mục QA dưới đây phần BE, và phiếu cuối không thu hai lần (đơn đến 01/11, phiếu 11 ghi ngoài Desk 8.500.000, HĐ 3 tháng → phiếu cuối = 25.500.000 − 8.500.000 − 8.500.000 trên các tháng đã phát hành) |

**PR FE** `r5-fb012-golive-fe` (mock theo 12.1–12.5, merge sau BE):

| # | Việc |
|---|---|
| FE-1 | Tạo đơn dài hạn nhập tay (FB-INV-010): MGR/OWN thấy ô "Guest already in house · Khách đã ở" → cho chọn ngày đến đã qua trong biên, ô lý do bắt buộc. Lưu xong mở luôn hộp nhận phòng bù |
| FE-2 | Hộp "Backdated check-in · Nhận phòng bù" (S04/S06, nút theo `allowedActions.check_in_backdated`): ngày đến thật (mặc định = ngày đến của đơn), lý do, số thẻ, `documentBlockOverride` khi có điều kiện giấy tờ. Không có giờ, phụ thu, thu tiền. Xong → gợi ý "Record check-in meter reading" (S12, đọc trễ: FDL+ kèm lý do, cho chọn ngày trên sổ, thiếu ảnh kèm ghi chú) và "Arrival-month statement" (S16) |
| FE-3 | Chi tiết phiếu S16: nút "Paid outside the app · Khách đã trả ngoài app" (UXD 196-01) theo `availableActions.settle_outside_desk`: số tiền (mặc định còn phải thu), ngày nhận, lý do, tham chiếu; bước xác nhận nêu rõ "không vào ca, không vào đối soát". Lịch sử thu hiện nhãn phương thức mới |
| FE-4 | S24 Tham số: khối "Property contact · Liên hệ cơ sở" (địa chỉ, hotline) – OWN sửa, MGR/FDL chỉ xem; xem trước chân phiếu một dòng. Khóa `long_stay_cleaning_fee_by_room` trong `paramCatalog.ts` (bảng số căn → giá; OWN/MGR sửa) |
| FE-5 | Thêm phát sinh (A30): gọi `getChargeCatalog?folioId=` để giá dọn lẻ đúng giá dài hạn; hiện nhãn nguồn giá |
| FE-6 | S12/tab Meters: `READING_OUT_OF_WINDOW` có `catchUpNeedsRole` → MGR/OWN thấy "Catch-up reading today", ngày khóa = hôm nay, lý do + ảnh bắt buộc; FD/FDL thấy câu DOM §3.3. Nháp phiếu: cảnh báo `READING_CATCH_UP` |
| FE-7 | i18n EN/VI, nhãn `payment.method.outside_desk`; mã lạ trong `availableActions`/`allowedActions` bỏ qua |
| FE-8 | **Brand OTTIMO** cho mọi chữ và màn mới: màu chỉ trong bảng 80/15/5, Lora/Be Vietnam Pro/JetBrains Mono (chỉ số đồng hồ, mã phiếu), không emoji; chữ khách thấy (chân phiếu) EN dẫn – VI hỗ trợ. UXD duyệt chữ hộp xác nhận |

Phạm vi tối thiểu nếu thiếu giờ: **12.1, 12.2, 12.3, 12.6 bắt buộc trước ra mắt** (không có thì phiếu 12/2026 của khách đang ở không đúng). 12.4 và 12.5 có cách tạm (dòng phần chênh; nâng `lateMaxDays`) và hạn muộn hơn (12.4: 29/11; 12.5: 11/12), nên tách sang PR sau được – phần DB của chúng vẫn nằm trong 0100 để không cần migration thứ hai.

### 12.11 Tiêu chí test cho QA

| # | Ca | Kỳ vọng |
|---|---|---|
| Q1 | MGR tạo đơn dài hạn nhập tay ngày đến `T`−10, có lý do | 201 `confirmed`; audit `backdatedArrival`; OWN có thông báo |
| Q2 | Như Q1 nhưng FDL, FD | 403. Không gửi `backdatedArrival` mà ngày đến đã qua → 422 `DATE_IN_PAST` như cũ |
| Q3 | Ngày đến `T`−46; ngày đến tháng trước khi `T` > hạn ghi trễ cuối kỳ tháng đó; ngày đi ≤ `T`; đơn ngắn ngày | 422 đúng mã trường (`BACKDATE_OUT_OF_RANGE`, `PREVIOUS_MONTH_CLOSED`, `DATE_IN_PAST`, `NOT_LONG_STAY`) |
| Q4 | Căn đã có lượt khác trong các đêm đã qua | 409 `ROOM_UNAVAILABLE`, không ghi gì |
| Q5 | MGR `checkInBackdated` đơn `confirmed` ngày đến 05/11 với `arrivalDate` 05/11; và với `arrivalDate` 01/11 (dời sớm) | 200 `in_house`, `checkinBackdatedOn` = `T`, `actualCheckinAt` = giờ bấm, buồng OC, không dòng folio; dời: ngày đến 01/11, lease nights khớp |
| Q6 | FD/FDL gọi `checkInBackdated`; `arrivalDate` = `T`; gửi `payment`/`checkinTime` | 403; 422 `USE_CHECK_IN`; 422 `NOT_ALLOWED` |
| Q7 | Hồi quy `checkIn` thường: ngày đến hôm nay, B9a, thu tiền lúc nhận phòng | Không đổi (bộ test hiện có xanh) |
| Q8 | Đơn nhận phòng bù: FDL ghi chỉ số `checkin` `readOn` = ngày đến − 1 (số sổ giấy), có `lateReason`, thiếu ảnh có ghi chú | 201, `late=true`; FD → 422 `READING_OUT_OF_WINDOW` (`lateNeedsRole`); `readOn` = ngày đến − 2 → 422 `DATE_INVALID` |
| Q9 | Đơn nhận phòng bù, ngày nhập > `checkin_backdated_on` + 11 | 422 `READING_OUT_OF_WINDOW` có `catchUpNeedsRole`; MGR đọc bù hôm nay → 201 |
| Q10 | Phiếu tháng nhận phòng của đơn nhận phòng bù | Có trong "Ready to bill"; nháp chỉ có tiền thuê phần lẻ (hoặc trọn tháng nếu đến ngày 01); phát hành được, không cần chỉ số |
| Q11 | MGR "đã thu ngoài Desk" toàn bộ phiếu 11 | `paid`; payment `outside_desk`, `not_required`, không ca; không có trong đóng ca, tiền mặt bàn giao, hàng đối soát; OWN có thông báo; audit `money` |
| Q12 | FD/FDL gọi 12.2; số tiền > còn nợ; thiếu lý do; `receivedOn` > `T`; phiếu nháp/void | 403; 422 `AMOUNT_OVER_BALANCE`; 422; 422; 409 |
| Q13 | Gửi `method: outside_desk` vào `recordPayment`, `recordBillingPeriodPayment`, B9, B18 | 422 `NOT_IN_LIST` |
| Q14 | Đảo khoản `outside_desk` (MGR) | Phiếu lùi về `issued`; hoàn tiền trên khoản này → 422 |
| Q15 | Thu một phần ngoài Desk (tiền thuê) + phần còn lại VietQR trên Desk | `partially_paid` → `paid`; QR in đúng số còn lại |
| Q16 | **Phiếu cuối không thu hai lần**: đơn đến 01/11 (bù), HĐ tới 31/01, phiếu 11 ghi ngoài Desk, phiếu 12 thu thường, trả phòng tháng 1 | Phiếu cuối tiền thuê = HĐ − (phiếu 11 + phiếu 12); tổng thuê trên Desk = tiền thuê HĐ |
| Q17 | OWN sửa địa chỉ, hotline; MGR sửa → 403; FDL xem → 200; hotline sai dạng, địa chỉ 2 dòng → 422 | Phiếu in thấy giá trị mới; trang công khai căn thấy hotline mới; audit trước/sau |
| Q18 | Sau khi đổi hotline: ghi chú có hotline mới không bị `SENSITIVE_DATA_DETECTED`; hotline cũ thì bị | Như mô tả |
| Q19 | `long_stay_cleaning_fee_by_room` rỗng | Dọn lẻ khách dài hạn = `adhoc_cleaning_fee` (như v1.0.7 trước gói) |
| Q20 | Đặt bảng Studio 150.000 / Premium 200.000; FD thêm dọn lẻ cho đơn dài hạn căn Studio, căn Premium, và đơn ngắn ngày | 150.000; 200.000; ngắn ngày vẫn `adhoc_cleaning_fee`. Catalog `?folioId=` trả đúng giá; yêu cầu dọn của khách dài hạn trên trang khách hiện đúng giá; yêu cầu đã gửi trước khi đổi giữ giá cũ. Phiếu tháng cộng đúng |
| Q21 | Bảng có số căn không tồn tại, giá không bội 1.000, FDL sửa | 422; 403 |
| Q22 | Đọc bù `period_end` 11 ngày 15/12 (đồng hồ giả) + `period_start` 12 cùng số | 201 ×2, `catch_up=true`, `gap`=0; nháp 12/2026 có `READING_CATCH_UP`, phát hành không xác nhận → 422 `WARNINGS_NOT_ACKNOWLEDGED`; đơn giá theo 30/11 |
| Q23 | Đọc bù: FDL; `readOn` ≠ hôm nay; thiếu ảnh; `photoWaived`; còn trong hạn ghi trễ; `room_change_out` | 403; 422 `CATCH_UP_TODAY_ONLY`; 422; 422; 422 `catchUp: NOT_ALLOWED`; 422 `kind: NOT_ALLOWED` |
| Q24 | Hồi quy BUG-R5-008 (a)–(d), cảnh báo hai bước, cuối < đầu | Không đổi |
| Q25 | `lock_timeout`: phiên khác giữ khóa trên `payment` (BEGIN; LOCK … IN ROW EXCLUSIVE MODE), chạy migrate | Dừng sau ~10 s, mã thoát ≠ 0, `__drizzle_migrations` không thêm dòng, 0099/0100 đều không áp; thả khóa rồi chạy lại → áp đủ |
| Q26 | Migrate 73 → 75 trên bản sao (hoặc staging 74 → 75) | 0 lỗi; số đếm bảng cũ không đổi; CHECK mới `convalidated`; image cũ chạy được trên DB 75 |
| Q27 | RBAC: 8 vai × A127–A130; `Me.screens` mọi vai không đổi so với trước gói | Đúng ma trận 12.9; test đồng bộ rbac ↔ `screens.ts` xanh |
| Q28 | Hồi quy FB-INV-012 trên image mới: luồng E2E nhập chỉ số → nháp → phát hành → in → VietQR; ca 1.9, 1.14, 2.3 của QC điều kiện 6 vẫn chạy trên image này | Như lượt 2 |

### 12.12 SEC cần xem

1. **Nhận phòng bù / đơn lùi ngày** (A127): làm đổi số liệu quá khứ (đêm phòng, công suất, thưởng quản lý A120 tính lúc đọc, hoa hồng). Biện pháp: chỉ MGR/OWN, thiết bị được cấp, lý do, biên 45 ngày + không lùi vào tháng đã đóng, audit, thông báo OWN mỗi lần. SEC xem có cần OWN duyệt khi người làm là MGR và đơn có người hưởng thưởng/hoa hồng là chính MGR đó.
2. **Đã thu ngoài Desk** (A128): đường dễ dùng để "xóa nợ" mà không có tiền vào quầy. Biện pháp: MGR/OWN, lý do, CHECK DB (không ca, không đối soát, chỉ gắn phiếu), không hoàn được, đảo qua A34, thông báo mọi OWN mỗi lần, dòng riêng trên báo cáo thu. SEC xem có cần trần số tiền hay OWN duyệt khi MGR ghi (tương tự SEC 148-01).
3. **`readOn` lùi ngày cho chỉ số nhận phòng bù** (12.1.3): ngoại lệ có giới hạn của BUG-R5-008 – chỉ `checkin` của đơn có `checkin_backdated_on`, ≥ ngày đến − 1, luôn `late` + FDL+ + lý do + cảnh báo nháp. Đọc bù 12.5 thì không bao giờ lùi ngày và luôn có ảnh.
4. **Hotline** (A129): đổi hotline đổi miễn trừ của bộ lọc `SENSITIVE_DATA_DETECTED` – chỉ OWN, kiểm dạng số, audit. Địa chỉ in trên phiếu và trang khách: chỉ văn bản thuần (FE không render HTML).
5. **`PaymentMethod` mở rộng**: bảo đảm không đường tạo khoản thu nào khác nhận `outside_desk` (Q13), và nhãn không lộ lý do trên phiếu in/trang khách.
6. **Giá dọn theo căn** (A101): sửa giá như các khóa giá khác, audit tham số trước/sau.
7. SEC 190-07/08 trong PR BE (12.5).

### 12.13 Giả định và việc của vai khác

- **DOM**: (a) luật G2 (khách ở trước ngày 01 tháng đang chốt → ngày đến trên Desk = ngày 01; ngày bắt đầu HĐ thật ghi ghi chú); (b) tiền thuê phần lẻ/tháng nhận phòng trên Desk tính theo công thức BR-LS-03; nếu khách đã trả ngoài Desk số khác, chênh lệch xử lý ngoài Desk, Desk ghi "đã thu ngoài Desk" đúng số trên phiếu; (c) sửa `go-live-guide.md` mục 2.2, 3, 5.1, 5.3 theo §12 (bỏ bước OWN nâng `lateMaxDays` cho chỉ số nhận phòng; OWN tự nhập địa chỉ/hotline trên Tham số; bỏ dòng phần chênh khi đã đặt bảng giá dọn); (d) H3 trong `tham-so-quy-tac.md`: giá đề xuất 150.000/200.000 theo hạng, ai sửa OWN/MGR; (e) `business-rules.md` BR-LS-07, BR-LS-17 dòng *Cài đặt* → v1.0.7 (nếu 12.4/12.5 kịp).
- **OPS**: `deploy.sh` dừng khi migrate thoát ≠ 0 (Q25); checklist §19.6 cho 73 → 75; số đếm thêm như 12.7.
- **QA**: chạy lại lượt hồi quy FB-INV-012 trên image mới (ứng viên v1.0.7 đổi khỏi `sha-5e98ec5aec1b`).
- Không ESC: mọi điểm là kỹ thuật (ARC) hoặc luật vận hành nội bộ đã theo INV 18/11.

### 12.14 Lệch BE đã chấp nhận (ARC review PR #197, 18/11)

Chi tiết: `rounds/round-05/reviews/ARC-on-be-pr-197.md` mục 2.

| # | Luật chốt |
|---|---|
| 1 | CHECK `payment_outside_desk_check` miễn `billing_period_id` + `note` cho dòng đảo (`reversal_of_id` có giá trị); dòng đảo vẫn `charge`, `not_required`, không ca |
| 2 | `reference` không có cột riêng: lưu nối vào `payment.note` (`<lý do> \| ref <tham chiếu>`); chuỗi toàn số ≥ 9 chữ số → `422 reference: NOT_ALLOWED` |
| 3 | `checkInBackdated` dời ngày đến chỉ cho đơn một đoạn; khác → `422 arrivalDate: NOT_ALLOWED` |
| 4 | `USE_CHECK_IN` chỉ ở `checkInBackdated`; `createReservation` + `backdatedArrival` với ngày đến = T → `BACKDATE_OUT_OF_RANGE` (kèm `earliest`) |
| 5 | Thông báo `statement_settled_outside_desk` không có số tiền, người ghi (12.2 đã sửa) |
| 6 | `amountVnd` mặc định = còn phải thu; MGR vượt phần thuê chưa thu → 403. FE điền sẵn phần thuê cho MGR |
| 7 | `receivedOn` > T → `422 receivedOn: DATE_IN_FUTURE` |
| 8 | Hoàn tiền: chỉ `original_method` bị chặn khi khoản thu gần nhất là `outside_desk`; hoàn bằng `cash`/`bank_transfer` theo luồng SM-10 như cũ (tiền đã vào cơ sở trên nền tảng cũ) |
| 9 | A130 là quyền theo trường của `recordMeterReading.catchUp` (như A127 với `createReservation`): `operationIds` rỗng, không gắn `x-rbac: [A130]` vào operation; thêm ca trường vào `rbac-cases` khi 12.5 lên |
