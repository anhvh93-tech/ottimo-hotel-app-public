# FB-INV-012 – Hợp đồng BE ↔ FE: phiếu thanh toán hằng tháng khách dài hạn (ARC 17/11)

- Tác giả: ARC | Round 5 – Sản xuất | Đầu vào: `04-investor-feedback/FB-INV-012.md`, `rounds/round-05/fb-inv-012/DOM-rules.md` (BR-LS-01…16, bản 17/11), `erd.md` 4.11 (`billing_period`, `meter_reading` thiết kế R3, chưa có bảng), schema `folio.ts`, `payments.service.ts` (`createVietQr`, `qr_purpose = billing_period` đang bị chặn), `0098_fx_rates_fb_inv_011.sql` (mẫu tham số json + hook).
- Tên gọi: **Monthly statement / Phiếu thanh toán tháng**. Không gọi "Phiếu thanh toán" để khỏi nhầm với bill trả phòng hiện có (`BillDialog`, `getBill`).
- Mọi điểm DOM còn mở (kỳ trả trước/sau, % VAT, kỳ lẻ, làm tròn, hạn) là **tham số OWN có ngày hiệu lực**, không gõ cứng. DOM đổi luật thì đổi giá trị, không phải đổi mã.
- **Sửa đổi 18/11** (sau INV bổ sung 17/11 và review PR #190, #189): xem **mục 11**. Mục 11 thắng mọi chỗ khác trong file nếu lệch. Các dòng đã lỗi thời có ghi chú *(thay bởi mục 11)*.

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

| Tình huống | Xử lý | Vai |
|---|---|---|
| **Cuối kỳ < đầu kỳ** cùng kỳ, không `exception` | `422 METER_LOWER_THAN_PREVIOUS` – chặn (BR-LS-12, số này thành tiền). Ngoại lệ thay đồng hồ / quay vòng → lưu | Ngoại lệ: FDL+ (FD → `403 FORBIDDEN_ACTION`) |
| **Đầu kỳ < cuối kỳ trước**, không `exception` | **Cảnh báo hai bước**: gửi lần đầu → `422 OPENING_BELOW_PREVIOUS_CLOSING` (`meter`, `previousValue`, `previousReadingId`, `previousKind`). Gửi lại cùng body + `acknowledgeLowerThanPrevious: true` (Idempotency-Key mới) → lưu, `gap` âm, audit `acknowledgedLower`. Nháp phiếu dùng lần đọc này có cảnh báo `OPENING_BELOW_PREVIOUS_CLOSING`, phát hành phải `acknowledgeWarnings` | FD+ |
| Đầu kỳ < cuối kỳ trước do thay đồng hồ trong khoảng trống | Gửi `exception` → lưu, không cảnh báo | FDL+ |
| **Đọc sau cửa sổ** `period_start`/`period_end`, trong `readingWindow.lateMaxDays` (mặc định 10, 0–31) | Có `lateReason` (3–300) → lưu (`late_reason`, `late_approved_by`, audit `meter_reading.late`, cảnh báo nháp `READING_LATE`). FD hoặc thiếu lý do → `422 READING_OUT_OF_WINDOW` kèm `windowFrom`, `windowTo`, `lateUntil`, `lateNeedsRole` | FDL+ |
| Quá `lateMaxDays` | `422 READING_OUT_OF_WINDOW` (không có `lateUntil`) | – |

Tham số `monthly_statement_rules` thêm `readingWindow.lateMaxDays` (mục 3).

### 11.3 Thay đổi API (chỉ thêm, trừ một mã cảnh báo bị bỏ)

| Chỗ | Thay đổi |
|---|---|
| `MeterReadingCreate` | thêm `acknowledgeLowerThanPrevious`, `lateReason` |
| `MeterReading` | thêm `previousClosing {readingId, readOn, electricity, water}`, `gap {electricity, water}`, `consumption {fromReadingId, electricity, water}`, `late`, `lateReason`, `readByInitials` (chữ cái đầu, không họ tên), `onIssuedStatement` |
| `listBillingCandidates` phần tử | thêm `reservationCode`, `kind`, `draftId`, `rooms[{roomId, roomNo, opening, closing, nextOpening}]` (`missing`/`recorded`/`exception`/`not_needed`; `nextOpening` không có `exception`). `readingStatus` gồm cả đầu kỳ, có `not_needed`. Có đơn `checked_out` còn trong `daysAfter` cần phiếu `final` |
| `BillingPeriod` | thêm `reservationCode`, `missingReadings[]`, `excludedLines[]` (nháp, không cộng tổng), `excludedFolioLineIds`, `priorAdjustment`, `note`, `replacesCode`, `voidReason`; dòng có `periodMonth` |
| `BillingPeriodTotals` | thêm `unreconciledVnd`, `disputed` (khoản thu VietQR `pending`/`disputed`; trạng thái phiếu không đổi) |
| `createBillingPeriod` | `kind` tùy chọn, server tự suy |
| `recordBillingPeriodPayment` | trả `{billingPeriod, payment {id, method, amountVnd, status, reconciliation}}` |
| `voidBillingPeriod` | trả `BillingPeriod` phẳng + `canReplace` (`BillingPeriodVoided`) |
| `getBillingPeriodPrint` | allowlist riêng (`BillingPeriodPrint`): không ghi chú, lý do, folio, giá chụp, thao tác (SEC BE-190-03). `property.email` = null (chưa có cột) |
| Cảnh báo | **bỏ `PRICE_CHANGED_SINCE_DRAFT`**: nháp không lưu số, giá và VAT đọc lại lúc phát hành. Thêm `OPENING_BELOW_PREVIOUS_CLOSING`, `READING_LATE` |
| Mã lỗi mới | `OPENING_BELOW_PREVIOUS_CLOSING` (422). `READING_OUT_OF_WINDOW` thêm trường |

### 11.4 Dữ liệu và quyền

- Migration `0099` (sửa tại chỗ trước khi merge, chưa chạy ở môi trường nào):
  - `meter_reading` thêm `previous_reading_id`, `electricity_gap`, `water_gap`, `late_reason`, `late_approved_by` (CHECK đi cặp);
  - FK `payment_billing_period_fk (property_id, billing_period_id) → billing_period`.

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
