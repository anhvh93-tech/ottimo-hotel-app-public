# ARC – Hợp đồng OpenAPI 0.3.13-draft (v1.0.5)

- Người làm: ARC | Round 5 (bảo trì v1.0.5) – Gói 0 – Bước: **Sản xuất** | 06/11/2026
- Nhánh: `r5-contract-0313`, cắt từ `main` @ `4a36180a`. Không rebase, không force.
- **Bổ sung 1 (06/11 tối, bước Phản hồi & sửa)**: sửa theo review SEC (`SEC-on-contract-0.3.13.md`, 14 thẻ), BE (`BE-on-contract-0.3.13.md`, 21 thẻ), BA (`outputs/BA/report.md`
  ghi chú 46b, A07b/A33), QA (BUG-R5-001/002/003) và trả lời của DOM (`outputs/DOM/rules-v1.0.5.md` mục 2–5, 7, 9, 11). Phần mới ở mục 1.16–1.24; mục 0, 1.14, 2, 3, 4, 6, 7, 8
  đã sửa. Trả lời từng thẻ: `rounds/round-05/responses/ARC-on-contract-0.3.13-reviews.md`. Nơi mục 1.1–1.13 khác mục 1.16–1.24, **mục 1.16–1.24 thắng**.
- Căn cứ:
  - `rounds/round-05/plan.md` mục 2 (Gói 1, 2, 4, 5, 6), mục 3 (dòng ARC), mục 4;
  - `rounds/round-04/reviews/ARC-on-v104-p4-32.md` (A1 (b), thẻ P432-02/03/04);
  - `ARC-on-v104-bug050-rule.md` (một `checkoutAt`);
  - `ARC-on-v104-pr75-hold-lock.md` (PR75-01);
  - `ARC-on-v104-p4-11.md` (P411-02);
  - `SEC-on-lp-v2-s6d.md` (ràng buộc V5-1A, FB-R4-SEC-BE-03);
  - `SEC-on-commission-numbers.md` (G1–G4, SEC-BE-01);
  - `SEC-on-v104-pr72-manual.md` (A31-01);
  - `SEC-on-v104-holds.md` (HOLDS-03);
  - `SEC-on-plan-v1.0.4.md` (P104-03);
  - `responses/FE-P4-41.md`;
  - `qa/bug-list-v1.0.4.md` (036, 040, 041, 051, 057);
  - `round-03/qa/bug-list.md` (BUG-R3-021, 023);
  - `business-rules.md` BR-012 (7), BR-101, BR-421 v0.5.7;
  - mã `main` @ `4a36180a`: `checkout.service.ts`, `folio-lines.service.ts`, `rooms.service.ts`, `FolioDialog.tsx`, `StayDialogs.tsx`, `guest-portal.service.ts`, `infra/docker-compose.prod.yml`, `infra/server/bin/backup.sh`, `ops-check.sh`.
- Trong tệp này, trong hợp đồng và trong PR **không có** tỷ lệ hay số tiền hoa hồng, dữ liệu khách, mật khẩu Wi-Fi hay bí mật nào. Giá trong ví dụ là giá niêm yết công khai (BR-101).

---

## 0. Tóm tắt

| Việc | Quyết định ARC | Hợp đồng 0.3.13 | Migration | Chờ DOM |
|---|---|---|---|---|
| V5-10 | Máy chủ quy đổi giờ trả theo **một** luật. `CheckoutSummary.checkoutAt` là giá trị duy nhất Desk gửi tiếp | Thêm trường đọc, luật ở `checkOut` | Không | Không |
| V5-13 | `openRefunds[]` gom theo lý do (A1 (b)) | Thêm trường đọc + schema `OpenRefund` | Không | Không |
| V5-14 | Giá gõ đi vào **báo giá** (`QuoteInput.nightlyRates`). Giữ chỗ dùng giá chụp | Thêm trường thân lệnh, thêm 422 | Không | Không |
| V5-15 | B18 nhận đơn quá ngày đi với ngày rời thật. **Bổ sung 1**: OWN luôn; MGR khi `nightsNotBilled` ≤ 1 (DOM 7.1 (a)). Nút Cần dọn là việc giao diện | Thêm trường, luật, cờ `overdue`; bổ sung 1: `nightsNotBilled`, `overdueOnly`, `requiredRole` | Không | Đã chốt (1.18) |
| V5-16 | Bộ lọc tuần làm ngay. **Bổ sung 1**: phần chặn BR-438 (SEC (a) + báo cáo (b)) | Thêm 2 tham số lọc, 3 khóa audit; bổ sung 1: 403 `requiredFlow`, `reductionsOnly`, `entered_in_error`, `lineReductions` | Không | Đã chốt (1.20) |
| V5-18 | `Reservation.depositUnverifiedVnd` | Thêm trường đọc | Không | Không |
| V5-19 | Chỉ phác (Gói 5, có điều kiện kích hoạt) | Chưa đổi | Không | Không |
| V5-1A | Giá đêm **bắt buộc**, thiếu thì 422 | **Đổi phá vỡ có chủ đích** (lý do ở 1.8) | Không | Không |
| V5-22 | `RATE_OUT_OF_RANGE` luôn có `min`, `max` | Thêm trường mở rộng | Không | Không |
| V5-30 | Không số mặc định. Thiếu tỷ lệ thì báo, không tính. **Bổ sung 1**: cấu trúc H2 theo DOM 4, 7.3 | Thêm `commission.status`, `listParameters.missing[]`; bổ sung 1: `instalmentNo`, `getManagerPerformanceBonus`, `commission_rate_missing` | **Có** – PR-M riêng (mục 4) | Đã chốt cấu trúc; số do INV (ESC-051) |
| V5-31 | **Bổ sung 1**: khóa `long_stay_cleaning_fee_by_room` (DOM 5, 7.4) | `GuestRequest.feeFallback` | **Có** – cùng PR-M | Đã chốt |
| V5-11 | **Bổ sung 1**: review DOM 2 – B16 trong 00:00–05:59 | 409 `INVALID_TRANSITION` + `minNewDepartureDate`, `useCheckout` | Không | Đã chốt (1.21) |
| V5-25 | **Bổ sung 1**: dạng lưu `weekend_nights`, `min_stay` (BUG-R5-001, BUG-R5-003) | Chỉ mô tả `setParameter`; **không đổi schema, không trường mở rộng mới** | Không | DOM viết luật lưu; ARC chốt điểm còn mở (1.24) |
| V5-5B (BUG-R5-002) | **Bổ sung 1**: 5B-1 = nhánh đơn đã đóng trong `recordPayment` (DOM 11.4 bản khuya); 5B-2 khôi phục ở 0.3.14 | Mô tả `recordPayment`, `createDepositNotice` (202); `Payment.refundRequestId`; mã hoàn `payment_after_cancel` | Không (cả 5B-2) | Đã chốt (1.21) |
| Chung | **Bổ sung 1**: `x-write-roles` (SEC ARC-02), id `rbac-cases` ổn định (SEC ARC-13), `x-round: R5` | Phần mở rộng mới; bộ sinh | Không | – |
| V5-44 | `Problem.lockReason`. Lỗi trigger 0094 → 409 | Thêm trường mở rộng, đổi 500 → 409 | Không | Không |
| V5-46 | Đã có từ 0.3.12 (i) | Không đổi | Không | Không |
| V5-50 | Desk lọc theo `listRoomStatuses` | Không đổi | Không | Không |
| V5-57 | Đã có từ 0.3.7 (`q` tìm theo tên) | Không đổi | Không | Không |
| V5-58 | Hai operation riêng cho Wi-Fi, ghi vào cột trang khách đang đọc. **Bổ sung 1**: chống tự điền, chặn trùng tên đăng nhập/mật khẩu, byte, PUT không trả mật khẩu | Thêm `getPropertyWifi`, `setPropertyWifi`; bổ sung 1: `passwordSet` | Không | FD đọc: chờ dòng rbac BA (1.23) |
| V5-62 | Giữ (a). Lượt hai: production 15:00, staging 15:30, mỗi khoảng 12 giờ (plan V5-62, PR #93) | Không (hạ tầng) | Không | Không |
| V5-63 | Driver `journald` + `MaxRetentionSec=90day` | Không (hạ tầng) | Không | Không |

Đã chạy trên nhánh:
- `gen:openapi` và api-client `gen`: đã sinh lại;
- Redocly 1.34.21: 0 lỗi, 6 cảnh báo, bằng `main`;
- `gen_traceability.py --strict`: exit 0, 0 operation lệch; 1 trường lệch có sẵn từ `main`;
- `gen_rbac_cases.py`: đã sinh lại, `--check` OK;
- `turbo typecheck`: 13/13 đạt;
- unit API 51 tệp, 1122 ca: đạt;
- `contract.test.ts`: đạt.

Chưa chạy local: `openapi-spec-validator`, vì máy này không có gói đó. CI chạy bước này.

**Bổ sung 1 – đã chạy lại trên nhánh (sau khi gộp `main` vào nhánh):** sinh lại meta, schemas, api-client, `rbac-cases` (2310 ca + 21 `fieldCases`), `traceability.md`; Redocly 0 lỗi, 6 cảnh báo;
`gen_traceability.py --strict` exit 0 (0 operation lệch, 1 trường lệch có sẵn); `gen_rbac_cases.py --check` OK; `gen-openapi-meta --check` OK; `turbo typecheck` 13/13; unit API 51 tệp, 1123 ca
(gồm `contract.test.ts`); api-client 37 ca; admin-web 88 tệp, 994 ca; prettier sạch.

---

## 1. Từng việc

### 1.1 V5-10 – một `checkoutAt` cho tóm tắt, VietQR và Trả phòng (BUG-R4-036, BUG-R4-051, FB-R4-ARC-FE-P432-04)

**Lỗi hiện tại** (`checkout.service.ts` `departure()`):
- Không gửi `checkoutAt` thì giờ `checkoutTime` được đặt lên trục ngày nghiệp vụ, nên 00:00–05:59 luôn bị hiểu là "sau nửa đêm của ngày đi".
- Ví dụ: lúc 07:00 ngày 23/11 lễ tân gõ 05:30 (khách rời trước 06:00 sáng nay). Máy chủ hiểu là 05:30 ngày 24/11, rồi trả 422 hoặc đòi đêm thêm (BUG-R4-051).
- Desk không có `manual_time_tolerance_minutes`, nên không tự ghép ngày với giờ cho đúng được.

**Quyết định.** Luật nằm ở máy chủ, một chỗ, dùng cho cả `getCheckoutSummary`, `createVietQr purpose=check_out` và `checkOut`:

1. Có `checkoutAt`: dùng nguyên. Ngày nghiệp vụ phải là ngày đi của lượt, hoặc thuộc cửa sổ sau nửa đêm của ngày đó. Khác thì 422 `DATE_INVALID`, như hiện nay.
2. Không có `checkoutAt`: lấy giờ `t` = `checkoutTime` ?? giờ hẹn ?? `checkout_time`. Ứng viên:
   - (ngày lịch = ngày đi, `t`);
   - thêm (ngày đi + 1, `t`) khi `t` < `business_day_rollover`.

   Chọn ứng viên **muộn nhất mà không sau** giờ máy chủ + `manual_time_tolerance_minutes`. Không ứng viên nào đạt thì lấy ứng viên sớm nhất, và B18 trả `TIME_AFTER_ACTION`.
3. `getCheckoutSummary` trả `checkoutAt` đã quy đổi và `checkoutTimeNoteRequired`. Desk gửi **đúng** `checkoutAt` đó cho QR và cho B18.
4. `allowedActions` có `check_out` từ 00:00 ngày lịch = ngày đi. Hợp đồng đã ghi điều này từ 0.3.6; mã sai ở `allowed-actions.ts` dòng 115 (`c.today === c.departureDate`), BUG-R4-036.

**Không phá vỡ.** Luật mới chỉ đổi kết quả ở các ca trước đây bị 422 `TIME_AFTER_ACTION`. Ca 01:05 ngày 24/11 gõ 01:00 vẫn ra 24/11 01:00, sau mốc cuối, cần đêm thêm, như cũ.

**Trường và mã lỗi:**
- Thêm `CheckoutSummary.checkoutAt` (Instant) và `CheckoutSummary.checkoutTimeNoteRequired` (boolean).
- Viết lại mô tả `checkOut.checkoutAt` và `createVietQr.checkoutAt`.
- Không có mã mới.

**P432-04** là việc của FE: tóm tắt đọc lỗi vào ngày trước ngày đi thì trang không chỉ sang Trả sớm. Nút Trả sớm chỉ theo `allowedActions.early_departure`.

**Migration:** không.

**Thứ tự PR:** hợp đồng → BE-A (quy đổi giờ + `allowed-actions.ts`) → FE-A. FE-A viết song song trên kiểu mới, gộp sau BE-A.

**Test bắt buộc:**

| # | Ca | Mong đợi |
|---|---|---|
| T10-1 | 07:00 ngày đi, gõ 05:30 | `checkoutAt` = ngày đi 05:30, phụ thu 0, `checkoutTimeNoteRequired = true` khi quá ngưỡng sai lệch |
| T10-2 | 01:05 ngày đi + 1, gõ 01:00 | `checkoutAt` = ngày đi + 1 01:00, `extraNightRequired = true` |
| T10-3 | 00:30 ngày lịch = ngày đi, gõ 00:20 | Cửa sổ sau nửa đêm. `allowedActions` có `check_out` cho FD |
| T10-4 | Gõ giờ ở tương lai quá ngưỡng | B18 → 422 `TIME_AFTER_ACTION` |
| T10-5 | Cùng một `checkoutAt` | Tóm tắt, trần QR và B18 ra cùng `amountDueAtCheckoutVnd` (dryRun so khớp) |
| T10-6 | FE: hai lần đọc tóm tắt rồi gửi QR + B18 | Cả hai lệnh mang đúng `checkoutAt` của lần tóm tắt cuối |
| T10-7 | FE: tóm tắt lỗi vào ngày trước ngày đi | Không có liên kết sang Trả sớm |

### 1.2 V5-13 – `openRefunds` (ARC A1 (b), FB-R4-ARC-FE-P432-02/03, FB-R4-UXD-FE-P432-03)

**Quyết định.** Thêm `OpenRefund { reasonCode, openVnd }`, dùng ở `CheckoutSummary.openRefunds[]` và `Folio.totals.openRefunds[]`.
- Nguồn: `approval_request` loại `refund` của mọi đơn trên folio, trạng thái `pending`/`escalated`/`approved`, `openVnd` = Σ (số xin − đã chi) > 0, gom theo `reason_code`.
- Dùng chung câu truy vấn với `FolioService.openRefundVnd` (phần trừ trong `unhandledCreditVnd`). Hai số không bao giờ lệch.
- Có **kể cả yêu cầu do người khác tạo**. Chỉ lộ số tiền theo lý do: không mã yêu cầu, không người tạo, không nơi nhận. Vì vậy không cần nới phạm vi `listApprovalRequests`.
- Vai thấy: FD+ (OWN, MGR, FDL, FD). SAL và CTV không nhận trường này (như `unhandledCreditVnd`). Tóm tắt trả phòng vốn chỉ dành cho FD+.
- Vắng (máy chủ cũ) khác rỗng. Desk không được hiểu "vắng" là "không có khoản chờ hoàn". Lỗi đọc dùng câu `checkout.pending_refund_unavailable` (UXD U5).

**Migration:** không.

**Thứ tự PR:** hợp đồng → BE-B → FE-A (trang Trả phòng, folio) và FE-B (khung đơn, số chờ hoàn U4).

**Test bắt buộc:**

| # | Ca | Mong đợi |
|---|---|---|
| T13-1 | FD-2 đọc tóm tắt, yêu cầu hoàn `pending` do FD-1 tạo sau B16 | Có dòng `early_departure` với `openVnd` đúng |
| T13-2 | Yêu cầu đã chi một phần | `openVnd` = phần còn lại |
| T13-3 | Yêu cầu đã chi đủ | Không có dòng |
| T13-4 | SAL đọc folio | Không có `openRefunds` |
| T13-5 | So hai số | Σ `openRefunds.openVnd` = `creditVnd` − `unhandledCreditVnd` khi có dư |
| T13-6 | Mock Desk (P432-03) | Đúng phạm vi máy chủ, kể cả ca CO-01b |

### 1.3 V5-14 – giữ chỗ theo đúng giá đã gõ (BUG-R4-041, FB-R4-ARC-FE-PR75-01)

**Lỗi hiện tại.** `BookingDialog.hold()` gọi `saveQuote` mà không mang giá gõ (`QuoteInput` không có trường giá), rồi gọi `createHoldFromQuote`. Máy chủ tính lại theo giá niêm yết, nên cọc 30 % sai. v1.0.4 chỉ khóa ô giá và nút trong lúc chạy.

**Quyết định:**
- Thêm `QuoteInput.nightlyRates` (`NightRate[]`, gồm cờ `edited`), cùng nghĩa với `ReservationCreate.nightlyRates`:
  - sàn–trần BR-105 → 422 `RATE_OUT_OF_RANGE` kèm `dates[]`, `min`, `max`;
  - đơn Nội bộ theo BR-421 v0.5.3;
  - đêm vắng = giá lịch.
- Giới hạn:
  - chỉ `type = short`;
  - kênh khác nhóm `ota` (khác → 422 `NOT_ALLOWED`);
  - chỉ FD+ (SAL/CTV → 403, cùng lý do A01: SAL/CTV không tạo đơn với giá tùy ý);
  - đêm ngoài khoảng hoặc trùng ngày → 422 `DATE_INVALID`.
- `saveQuote` chụp giá vào báo giá. `createHoldFromQuote` dùng giá chụp; đêm `edited = true` thì nguồn `manual`, `bookingRateSource = manual_agreed`.
- `createHoldFromQuote` nhận trường giá (`nightlyRates`, `rates`, `rateVnd`, `amountVnd`, `totalVnd`, `depositVnd`) → 422 `NOT_ALLOWED` từng trường, không ghi gì. Đây là cam kết ARC ở PR75-01: lệnh không nhận giá thì không âm thầm bỏ giá. Trường lạ khác vẫn bị bỏ qua như cũ; đổi cả bộ đọc thân lệnh sang chế độ chặt là việc riêng, không làm ở v1.0.5.
- Sau khi FE gửi giá thật: bỏ vòng xóa lỗi `rates`/`nightlyRates[i]` ở `hold()` (PR75-02), và BA bỏ các bước tạm của DOM điểm 3.

**Migration:** không. `pricing_snapshot` là jsonb.

**Thứ tự PR:** hợp đồng → BE (module sales) → FE-A.

**Test bắt buộc:**

| # | Ca | Mong đợi |
|---|---|---|
| T14-1 | Gõ 2 đêm giá thỏa thuận trong sàn–trần → lưu báo giá → giữ chỗ | Đêm của đơn = giá gõ, nguồn `manual`, cọc tính theo giá gõ |
| T14-2 | Giá ngoài sàn–trần | 422 kèm `min`/`max` |
| T14-3 | SAL gửi `nightlyRates` | 403 |
| T14-4 | Kênh OTA, hoặc `type = long` | 422 `NOT_ALLOWED` |
| T14-5 | `createHoldFromQuote` kèm `nightlyRates` | 422 `NOT_ALLOWED`, không có đơn nào được tạo |
| T14-6 | E2E Desk: gõ giá → Giữ chỗ | Số cọc trên hộp = số máy chủ |

### 1.4 V5-15 – trả phòng đơn quá ngày đi; nút Cần dọn

**Hiện nay** (BR-421 v0.5.7): B18 chỉ chạy đúng ngày đi nghiệp vụ. Lễ tân phải gia hạn B13 tới hôm nay rồi xin giảm giá đặc biệt 100 % cho các đêm khách không ở.

**Quyết định.** B18 nhận lượt quá ngày đi (ngày nghiệp vụ > ngày đi, ngoài cửa sổ sau nửa đêm) với **ngày khách rời thật**, khi đủ ba điều kiện:
1. Người gọi **OWN/MGR**. FD/FDL → 403, kiểm trước thân lệnh.
2. Có `checkoutAt` = lúc khách rời thật, ngày nghiệp vụ = ngày đi của lượt, không sau giờ máy chủ.
3. Có `overdueReason`.

Các luật đi kèm:
- Khách ở thêm đêm nào thì **gia hạn B13 trước** tới ngày khách rời thật, rồi B18 theo đường này. Một lệnh làm một việc, tiền đêm ở lại vẫn đi đường B13 có sẵn.
- `extraNight` và `lateFeeInsteadOfNight` → 422 `NOT_ALLOWED`. Rời sau mốc cuối → 422 `LATE_CHECKOUT_AFTER_LIMIT`.
- Phụ thu trả muộn theo giờ của `checkoutAt`.
- Minibar: lần đếm có ngày nghiệp vụ ≥ ngày đi được tính. Đây là ngoại lệ của K11-09, vì lễ tân đếm tủ sau khi khách đã đi.
- `post_checkout_window_until` tính từ lúc ghi.
- Audit `state` `reservation.checked_out` thêm `after.overdue = { departureDate, checkoutAt, recordedAt, reason }`.
- `AllowedAction.overdue = true` chỉ trả cho OWN/MGR.
- `CheckoutSummary.overdue`. Tóm tắt vẫn cho FD+ đọc.
- QR `check_out` của đơn quá ngày đi: cùng vai với B18.

**Vì sao chỉ OWN/MGR, không "lễ tân ghi, quản lý hậu kiểm":**
- Đường này làm giảm đêm bán so với cách gia hạn. Đây là chỗ lễ tân có thể giấu tiền khách ở thêm.
- Xác nhận tại quầy bằng mật khẩu quản lý luôn thất bại khi người đó có 2FA (fail-closed, ESC-031).
- Hậu kiểm cần loại thông báo hoặc mục "Cần chú ý" mới, tức phải nới CHECK `staff_notification.kind`. Đó là migration, và QC R4 ĐK-2 chặn bản có migration.
- Trong lúc chờ quản lý, căn vẫn "Đang ở" nhưng không ai mất tiền. Khách mới đến dùng đổi căn hoặc gọi quản lý; MGR làm được trên điện thoại.

DOM có thể chọn hướng hậu kiểm ở v1.0.6 (mục 3).

**Nút Cần dọn:** không đổi hợp đồng. Dùng `transitionRoomStatus` `event = needs_cleaning` (R8, FD+ và HK). Nút hiện khi `RoomStatusEntry.allowedEvents` có `needs_cleaning`. Desk (FE-A) và app nhân viên (MOB) đọc cùng trường; PWA gửi qua hàng đợi offline như R1–R3.

**Migration:** không.

**Thứ tự PR:** hợp đồng → BE-A → FE-A (hộp "Trả phòng quá ngày đi"). Nút Cần dọn của FE-A và MOB không chờ BE.

**Test bắt buộc:**

| # | Ca | Mong đợi |
|---|---|---|
| T15-1 | FD gọi B18 trên đơn quá ngày đi | 403, không ghi gì |
| T15-2 | MGR, `checkoutAt` 11:00 ngày đi, có lý do | 200. Đêm sau ngày đi không thành đêm bán. Audit có `after.overdue` |
| T15-3 | Thiếu `checkoutAt`, hoặc `checkoutAt` sai ngày, hoặc thiếu lý do | 422 `REQUIRED`, `DATE_INVALID`, `REASON_REQUIRED` |
| T15-4 | Gửi `extraNight` | 422 `NOT_ALLOWED` |
| T15-5 | B13 tới ngày X rồi B18 quá ngày đi với `checkoutAt` ngày X | 200, đêm thêm đúng giá B13 |
| T15-6 | Đơn chưa quá ngày đi mà gửi `overdueReason` | 422 `NOT_ALLOWED` |
| T15-7 | `allowedActions` | Có `check_out` + `overdue` với MGR, không có với FD |
| T15-8 | Nút Cần dọn (Desk, PWA, cả offline) | OC → OD; 409 `INVALID_TRANSITION` khi trạng thái đã đổi |

### 1.5 V5-16 – lễ tân bỏ hoặc giảm về 0 dòng phát sinh (FB-R4-SEC-BE-A31-01, Major)

**Làm ngay** (không phụ thuộc DOM chọn (a) hay (b)):
- `listAuditEvents` thêm `action` (nhiều giá trị, tối đa 10) và `removalsOnly` (chỉ `folio_line.adjusted` có `after.amountVnd = 0`, dòng không phải tiền phòng).
- Mọi `folio_line.adjusted` ghi thêm:
  - `before.actorRole`;
  - `before.postedByActor` (người sửa cũng là người ghi dòng);
  - `before.sameBusinessDay`.

  Không thêm số tiền nào. Tập mã `money` không đổi.
- Desk có bộ lọc "Bỏ/giảm dòng – tuần này" cho MGR/OWN. FD/FDL vẫn chỉ thấy bản ghi của mình.

**Chờ DOM** (phần chặn). Nếu DOM chọn (a) như SEC đề xuất, ARC thêm bổ sung 1 của 0.3.13 trong ngày DOM chốt:
- FD/FDL bỏ hoặc giảm về 0 một dòng không do mình ghi, hoặc không cùng ngày nghiệp vụ → `403 FORBIDDEN_ACTION`, thêm trường mở rộng `requiredFlow: foc_request`. Desk chuyển sang hộp xin miễn/giảm (A35).
- Trong phạm vi được phép → 200, có audit như trên.

Nếu DOM chọn (b): không đổi hợp đồng. BE đưa lần bỏ/giảm vào BR-435 và danh sách đóng ca BR-526.

**Migration:** không. Lọc trên jsonb của `audit_event` theo `property_id` và khoảng ngày; BE đo trên staging, nếu chậm thì thêm chỉ mục ở bản sau.

**Thứ tự PR:** hợp đồng → BE-B (lọc + khóa audit) → FE-A (bộ lọc quản lý). Phần chặn: DOM → ARC bổ sung → BE-B → FE-A.

**Test bắt buộc:**

| # | Ca | Mong đợi |
|---|---|---|
| T16-1 | `removalsOnly` | Chỉ ra lần bỏ/giảm về 0, không ra lần giảm một phần |
| T16-2 | Lọc `action` nhiều giá trị | Đúng các mã đã chọn |
| T16-3 | FD lọc | Chỉ bản ghi của mình |
| T16-4 | Khóa audit mới | `before.postedByActor` / `sameBusinessDay` đúng ở 4 ca (mình/người khác × cùng ngày/khác ngày) |
| T16-5 | Khi có phần chặn (a) | FD bỏ dòng người khác → 403. FD bỏ dòng mình vừa ghi → 200 + audit (đúng ca test SEC đề xuất) |

### 1.6 V5-18 – phần cọc chưa đối soát (FB-R4-SEC-FE-HOLDS-03)

**Quyết định:**
- `Reservation.depositUnverifiedVnd` = Σ giao dịch cọc `succeeded`, không phải dòng đảo, `reconciliation = pending`.
- Cùng câu truy vấn với `deposits.service.ts` `unverifiedDepositVnd` (nguồn của `after.unverifiedPaidVnd` trong audit).
- Vai thấy: FD+.
- Hộp "chấp nhận cọc thiếu sau hạn" nêu số này. Câu chữ do UXD làm.

SEC ghi rằng Desk tự tính được từ `folio.payments`. ARC vẫn chọn trường đọc: một luật ở máy chủ, và hộp không phải tải folio.

**Migration:** không. **Thứ tự PR:** hợp đồng → BE-B → FE-B.

**Test bắt buộc:**

| # | Ca | Mong đợi |
|---|---|---|
| T18-1 | Hai khoản cọc, một khoản `pending` | Số = khoản `pending` |
| T18-2 | Đối soát xong | 0 |
| T18-3 | SAL | Không có trường |

### 1.7 V5-19 – Desk "từ – đến" (Gói 5, chỉ phác)

- Thêm vào `PublicPriceEstimateRecord` khối chỉ đọc `atSubmit { fromTotalVnd, toTotalVnd, priceChangedSinceSeen }`. Số "đến" đã nằm trong DB; máy chủ giải mã như phần còn lại của bản ghi.
- Schema đang `additionalProperties: false`, nên phải sửa schema; đây là việc thêm, không phá vỡ.
- Chỉ Desk (S35, FD+), không bao giờ ở thân hay token của web.
- **Điều kiện kích hoạt** (SEC 06/11): phải lên trước khi hai căn cùng hạng có giá khác nhau trên production.
- Khi PO kích hoạt, ARC viết hợp đồng trong một PR nhỏ. Không migration.

### 1.8 V5-1A – giá đêm bắt buộc (BUG-R4-057)

**Quyết định:**
- `RoomInput.nightlyListPriceVnd` và `RoomPatch.listPrice.nightlyListPriceVnd` **bắt buộc**. Thiếu → 422 `VALIDATION_FAILED`, `errors[] = { field, code: REQUIRED }`, không ghi gì.
- Bỏ `nightlyFromMonthly` ở `rooms.service.ts` (create dòng 434, update dòng 593–596).
- Giữ `MoneyVnd` (≥ 1) ở hợp đồng và `CHECK > 0` ở DB (SEC 06/11). Thiếu giá đêm là 422, không bao giờ 500.
- Ví dụ `updateRoom` ghi đủ hai giá.

**Vì sao đổi phá vỡ:**
- BR-101 (5) đã hẹn bỏ đường tạm này. BR-101 (1) nói hai giá độc lập.
- Gọi API thẳng mà quên giá đêm thì ra giá sai mà không ai được báo, và web cùng Desk hiện số sai.
- Ai bị ảnh hưởng:
  - Desk không bị: Desk luôn gửi giá đêm khi đổi giá, và Desk không có màn tạo căn; `createRoom` chỉ được gọi từ script và công cụ.
  - Script của ORC/OPS: đã phải gửi đủ hai giá từ Gói 0.
  - `production-bootstrap.ts` và công cụ nhập danh mục căn: BE phải cho nhận giá đêm, hoặc tạo căn ở trạng thái ngừng bán tới khi OWN nhập giá. Kiểm tĩnh `pricegap` (V5-73) phải lên trước bản này.
- Khóa `night_from_month_divisor` không còn được mã đọc sau bản này. DOM sửa từ điển ở Gói 0 (giữ khóa, ghi "không còn dùng từ v1.0.5"); dọn khóa khỏi danh mục là việc sau.

**Migration:** không.

**Thứ tự PR:** hợp đồng → BE-C (rooms, bootstrap, công cụ nhập). V5-73 phải gộp trước BE-C.

**Test bắt buộc:**

| # | Ca | Mong đợi |
|---|---|---|
| T1A-1 | `updateRoom` thiếu giá đêm | 422 `REQUIRED`, giá không đổi |
| T1A-2 | `createRoom` thiếu giá đêm | 422, không có căn |
| T1A-3 | Giá đêm 0 | 422, không phải 500 |
| T1A-4 | Đủ hai giá | Dòng giá đúng cả hai số |
| T1A-5 | Bootstrap hoặc nhập danh mục không có giá | Căn ngừng bán, `pricegap` tĩnh = 0 |

### 1.9 V5-22 – câu giá ngoài sàn–trần có số thật (BUG-R4-040)

**Quyết định:**
- Mọi `RATE_OUT_OF_RANGE` / `RATE_OUT_OF_RANGE_WARNING` có `min`, `max` = sàn và trần của đêm đầu tiên trong `dates[]`, cạnh `dates[]`.
- `stay-night-pricing.ts` dòng 200 đã làm vậy. `reservations.service.ts` dòng 740 thì chưa: thêm `min`, `max` từ đêm đầu tiên của `priced.outOfRange`.

Hai ý khác của V5-22 là việc FE/UXD, không đổi hợp đồng:
- Ô OTA trống: nói rõ hệ quả.
- Không hiện "0 đ" khi máy chủ sẽ tính theo lịch giá: Desk lấy số từ `previewOnly`/`calculateQuote`, không tự điền 0.

**Migration:** không. **Thứ tự PR:** hợp đồng → BE (reservations) → FE-A.

**Test bắt buộc:**

| # | Ca | Mong đợi |
|---|---|---|
| T22-1 | Tạo đơn giá dưới sàn | 422 có `min`, `max`, `dates[]` |
| T22-2 | Câu trên Desk | Hiện số, không còn `{min}`/`{max}` |

### 1.10 V5-30 – H2 hoa hồng theo bảng nội bộ, không số mặc định (FB-R4-SEC-BE-01 Major, FB-R4-SEC-ORC-01 G3)

**Làm ngay** (không phụ thuộc cấu trúc bảng):
- `QuoteCalculation.commission.status`:
  - `computed`;
  - `rate_missing`: không có `ratePct`/`amountVnd`; máy chủ không tính bằng 0 hay bằng số cũ;
  - `not_applicable`.
- `listParameters.missing[]`: tên các khóa không có mặc định mà chưa có giá trị hiệu lực. Chỉ OWN/MGR, chỉ tên, không giá trị.
- BE bỏ mọi số hoa hồng mặc định trong mã (`production-defaults.ts`: `short_stay_commission_pct`, `lease_terms[].commissionStaffPct`/`commissionCollaboratorPct`).
- Khóa hoa hồng chuyển sang nhóm "OWN nhập trên Desk, không mặc định".
- Ghi hoa hồng lúc chốt đơn (`commission.projected`) khi thiếu tỷ lệ: **chờ DOM**. ARC đề xuất không tạo dòng, và có mục "Cần chú ý" cho OWN. Nếu cần kind mới thì có migration (mục 4).

**Chờ DOM:** cấu trúc bảng H2 (khóa nào, theo kênh, vai, loại lưu trú hay mốc chi). DOM gửi chi tiết **ngoài kho mã**. ARC chỉ đưa **tên khóa và kiểu** vào hợp đồng, không số.
- Nếu cần khóa mới trong danh mục `config_parameter_def`: một migration chỉ thêm dòng danh mục, không giá trị.
- OWN nhập tỷ lệ thật trên Desk. Không xóa dòng cũ (lịch sử chỉ thêm): OWN đặt giá trị mới có hiệu lực từ ngày chuyển.

**Quy tắc G3** cho mọi PR của V5-30:
- Seed, fixtures, test, ví dụ, mô tả PR, commit và báo cáo QA chỉ dùng tham số thử tên `test_rate_*`.
- Không số tiền hoa hồng tính theo tỷ lệ thật.
- CI `confidential-paths` (OPS) phải xanh.

**Thứ tự PR:** hợp đồng (phần làm ngay) → BE (bỏ mặc định, `status`, `missing[]`) → DOM chốt cấu trúc → ARC bổ sung → BE → FE-A. Hạn cứng: kỳ chốt hoa hồng 01/12/2026.

**Test bắt buộc:**

| # | Ca | Mong đợi |
|---|---|---|
| T30-1 | Chưa có tỷ lệ | `status = rate_missing`, không `amountVnd`; SAL thấy "Chưa có tỷ lệ hoa hồng" |
| T30-2 | Có tỷ lệ thử `test_rate_*` | `computed` |
| T30-3 | `listParameters` của OWN | Có khóa trong `missing[]`; FDL không có thuộc tính |
| T30-4 | Quét mã | Không còn số mặc định ở `production-defaults.ts` (test so danh sách khóa, không so số) |

### 1.11 V5-44 – bỏ dò chữ `detail`; trigger 0094 → 409

**(a) `Problem.lockReason`.** Luôn có với `409 FOLIO_LOCKED`. Giá trị:

| Giá trị | Khi nào | Nơi trả hiện nay |
|---|---|---|
| `closed` | Folio đã đóng | `folio-lines.service.ts` dòng 508 |
| `settled` | Lệnh không nhận folio `settled` | Ví dụ `recordPayment` `type` ≠ `charge` |
| `post_checkout_window_over` | Quá cửa sổ sau trả phòng | Dòng 519, N-15 |
| `debt_reduction_requires_write_off` | Giảm vượt phần còn trong cửa sổ khi có công nợ (BR-525) | Dòng 576 |

`FolioDialog.tsx` dòng 381–391 bỏ regex `BR-525|debt_write_off` trên `detail`, đọc `lockReason`. Giá trị lạ hoặc vắng → câu chung.

**(b) Trigger 0094.** Ở `cancelScheduledListPrice`, bọc lệnh `DELETE`: `pgCode(e) === '23514'` → `409 INVALID_TRANSITION`, `currentState: effective`, rollback, không audit.
- Ca xảy ra: ngày lịch vừa sang giữa lúc kiểm và lúc xóa, hoặc staging `CLOCK_MODE=mutable` lùi về quá khứ (P411-02).
- Chỉ ánh xạ ở lệnh này. `check_violation` khác vẫn 500.

**Migration:** không. **Thứ tự PR:** hợp đồng → BE-B (a) và BE-C (b) song song → FE-A (a).

**Test bắt buộc:**

| # | Ca | Mong đợi |
|---|---|---|
| T44-1 | Bốn đường `FOLIO_LOCKED` | Mỗi đường đúng `lockReason` |
| T44-2 | FE: hai câu trên hộp folio | Theo `lockReason`, không theo `detail` |
| T44-3 | Staging đồng hồ lùi, xóa dòng giữa ngày giả và ngày thật | 409 `effective`, không 500 |
| T44-4 | `check_violation` khác | Vẫn 500 (test đơn vị với lỗi giả) |

### 1.12 V5-46, V5-50, V5-57 – không đổi hợp đồng

- **V5-46**:
  - `ID_NUMBER_DETECTED` cho `createGuestRequest.note` và `updateOnlineCheckin.arrivalNote` đã có từ 0.3.12 (i).
  - Việc còn lại là của FE-B/MOB: guest-web nối mã (`app/problem.ts` dòng 35, 60, cạnh `CARD_NUMBER_DETECTED`), thêm khóa `error.ID_NUMBER_DETECTED` theo chữ CPY, và bật cùng tag với máy chủ (luật "cùng tag" 4.2 ý 6).
  - Test: mock `errors[{field: note, code: ID_NUMBER_DETECTED}]` → câu đúng EN/VI/RU.
- **V5-50**:
  - Hộp Đổi phòng lấy danh sách căn từ `searchAvailability`; danh sách này không có trạng thái buồng.
  - Desk đọc thêm `listRoomStatuses` (FD+ đã có quyền) và chỉ hiện căn `VI`/`VC` khi ngày áp dụng là hôm nay.
  - Máy chủ vẫn chặn bằng `409 ROOM_NOT_READY` (BR-803).
  - Không thêm trường vào `AvailabilityResult`, để giữ phản hồi chung cho SAL/CTV. Làm ở FE-A, không cần BE.
- **V5-57**:
  - `listReservations.q` tìm theo tên người đứng tên từ 0.3.7 (S4-44). Máy chủ đã cài (`rack.service.ts` dòng 439, `name_search`); Desk đã gửi `q` (`ReservationsPage.tsx` dòng 64).
  - QA kiểm lại trên staging rồi đóng BUG-R2-077. Còn sai thì đó là lỗi cài đặt BE/FE, không phải việc hợp đồng.
  - Tìm theo tên người đi cùng vẫn ngoài phạm vi (SEC, 0.3.7).

### 1.13 V5-58 – ô nhập Wi-Fi trên Desk (BUG-R3-021 phần Desk)

**Quyết định.** Hai operation mới ở `/v1/properties/{propertyId}/wifi`.
- **`getPropertyWifi`**:
  - Vai: OWN, MGR, FDL (S24).
  - `configured = false` khi chưa nhập.
  - `Cache-Control: no-store`.
- **`setPropertyWifi`**:
  - Vai: OWN, MGR (A101; BR-012 (7) "chủ đầu tư hoặc quản lý được giao").
  - Ghi `{ ssid, password }` vào `property.wifi_info_i18n`, cột `guest-portal.service.ts` `wifiOf()` đang đọc, nên trang khách không phải sửa.
  - Kiểm `ssid`: 1–32 ký tự; chứa số căn như một từ riêng → 422 `NOT_ALLOWED`, vì tên mạng khách thấy không được lộ căn.
  - Kiểm `password`: 8–63 ký tự (WPA2), hoặc rỗng cho mạng mở.
  - Audit `config` `property.wifi_changed` chỉ có `ssid` trước/sau và `passwordChanged`; không bao giờ có mật khẩu.

**Vì sao không dùng `setParameter`:**
- Tham số không cho sửa dòng đang hiệu lực trong ngày. OWN gõ sai mật khẩu thì phải chờ tới hôm sau mới sửa được.
- Trang khách đọc cột `property`, không đọc tham số.
- Thêm khóa vào danh mục tham số cần migration.

**FD không đọc được** (theo S24). Khách xem trên trang khách hoặc thẻ trong căn; đổi mật khẩu thì quản lý báo đội. DOM/SEC muốn FD đọc thì BA thêm dòng rbac và ARC thêm vai; đổi nhỏ.
**Bổ sung 1:** DOM 7.5 muốn FD đọc, SEC ARC-10 không phản đối – xem 1.23.

**Mật khẩu thật** chỉ OWN nhập trên Desk. Seed, fixtures, ví dụ và ảnh chỉ dùng `<wifi-password>`.

**Migration:** không. **Thứ tự PR:** hợp đồng → BE-C → FE-A (màn Cấu hình). SEC và UXD review.

**Test bắt buộc:**

| # | Ca | Mong đợi |
|---|---|---|
| T58-1 | OWN đặt Wi-Fi | Trang khách trong ngày nhận phòng hiện đúng tên mạng |
| T58-2 | SSID có "401" | 422 |
| T58-3 | Mật khẩu 7 ký tự | 422 |
| T58-4 | FD gọi GET | 403 |
| T58-5 | Nội dung audit | Không có mật khẩu (grep giá trị thử trong `audit_event` và log = 0) |
| T58-6 | Phản hồi GET | Có `no-store` |

### 1.14 V5-62 – thêm lượt sao lưu (OR-M2)

**Quyết định:**
- Giữ hướng (a): thêm một lượt `backup.sh` mỗi ngày, cùng mã hóa `age`, cùng chủ và quyền.
- Tên tệp đã có giờ (`date -u +%Y%m%dT%H%M%SZ`), nên hai bản một ngày không đè nhau.
- Vòng xoay theo tuổi (giây) đọc từ tên tệp: < 7 ngày giữ hết; bộ Chủ nhật UTC < 33 ngày; `purge-journal` < 40 ngày (ARC duyệt 33 ngày ở `ARC-on-ops-prs-92-93-95.md` 1.2) – lỡ hai lượt liền vẫn < 35 ngày (T18).

**Giờ chạy – theo `plan.md` V5-62 (OPS 06/11, PR #93); bổ sung 1 sửa theo SEC ARC-09 và `ARC-on-ops-prs-92-93-95.md` 1.7:**
- production chạy `ottimo-backup@ottimo-prod.timer` (tệp `ottimo-backup@.timer`) lúc **03:00 + 15:00**;
- staging chạy `ottimo-backup.timer` lúc **03:30 + 15:30**;
- mỗi khoảng đúng 12 giờ, nên câu "mất tối đa 12 giờ từ v1.0.5" (sổ vận hành 1.2) đúng. Nếu chọn 14:00 thì khoảng lớn nhất của production là 13 giờ (14:00 → 03:00).
- Nguồn giờ duy nhất là dòng V5-62 của plan và hai tệp timer trong repo. SEC sửa SR-BAK-01 khi bản lên.

**Việc của OPS (đã làm ở PR #93):**
- `ottimo-backup@.timer` (production) và `ottimo-backup.timer` (staging): mỗi tệp có một dòng `OnCalendar` thứ hai.
- `ops-check.sh` hạ `BACKUP_MAX_HOURS` từ 26 xuống 14 (khoảng cách 12 giờ + 2 giờ dư).
- `pull-backups.sh` đã `--ignore-existing`, kéo hai bản một ngày không đổi gì.
- `hosting-plan.md` mục 7 sửa RPO.
- SEC sửa SR-BAK-01 khi bản lên.

**Migration:** không.

**Test:** `infra/server/test/backup-schedule.test.sh` – 2 lượt trong cùng ngày với tên khác nhau, vòng xoay theo tuổi (giây); tuổi bản > 14 giờ thì ops-check báo FAIL.

### 1.15 V5-63 – giữ log qua lần dựng lại container, trần cứng 90 ngày (OR-M3, FB-R4-SEC-OPS-OR-04)

**Quyết định:** đổi driver log của Docker từ `local` sang **`journald`**, và đặt cấu hình journald riêng trên máy chủ. Lý do:
- Driver `local` mất log khi container bị xóa, mà mỗi lần deploy đều xóa container.
- journald giữ log ở máy chủ, qua mọi lần deploy, và có trần theo tuổi sẵn có.
- Không thêm tiến trình, cron hay ổ đĩa nào.
- Không chọn hướng "giữ `local`, cron chép ra tệp, logrotate `maxage 90`": nhiều mảnh hơn, và vẫn mất log nằm giữa hai lần chép.

**Cấu hình** (OPS viết; số dung lượng do OPS chọn theo đĩa, đĩa đang dùng 18 %):
- `infra/docker-compose.prod.yml` `x-hardening.logging` và `infra/edge/docker-compose.edge.yml`: `driver: journald`, `options: { tag: '{{.Name}}' }`.
- **Phải bỏ** `max-size`/`max-file`: hai tùy chọn này không hợp lệ với journald và làm container không khởi động.
- `bootstrap-vps.sh` `daemon.json`: `"log-driver": "journald"`, bỏ `log-opts`.
- `/etc/systemd/journald.conf.d/50-ottimo.conf`:
  - `Storage=persistent`, `Compress=yes`;
  - `MaxRetentionSec=90day`;
  - `MaxFileSec=1day`, để tệp xoay mỗi ngày và trần 90 ngày không trễ quá 1 ngày;
  - `SystemMaxUse=` và `SystemKeepFree=` (trần dung lượng);
  - `RateLimitBurst` đủ cao cho `docker.service`, vì mọi container chung một nguồn.
- Rsyslog của Ubuntu chép journal ra `/var/log/syslog`: OPS kiểm logrotate của tệp đó giữ ít hơn 90 ngày (mặc định 4 tuần), hoặc đặt `ForwardToSyslog=no` nếu không có gì khác cần syslog.
  **PR #93 đã chọn `ForwardToSyslog=no`** (không script, runbook hay tài liệu nào đọc `/var/log/syslog`, `/var/log/auth.log` – ghi ở README).
- **PR #93 (bổ sung 1 ghi lại):** `daemon.json` trên VPS đang chạy giữ nguyên ở W6 (container ghi rõ `journald` không bị ghép `max-size`), chỉ `bootstrap-vps.sh` đổi; Postgres chạy
  `log_error_verbosity=terse` (SEC ARC-08).

**Quyền đọc:**
- `/var/log/journal` thuộc `root:systemd-journal`, tệp 0640.
- OPS kiểm nhóm `adm`, `systemd-journal` **và `docker`** chỉ có tài khoản vận hành (SEC ARC-07). Không user thường nào đọc được.

**Giữ nguyên:**
- Cách che hiện có: ứng dụng che khóa nhạy cảm; Caddy che `/g/*` và mọi query string.
- Log **không** vào bản sao lưu ngoài máy: `backup.sh` không đọc `/var/log/journal`; `pull-backups.sh` chỉ kéo thư mục bản sao lưu.

**Ảnh hưởng tới công cụ:**
- `docker logs` vẫn chạy với journald, nhưng chỉ đọc container hiện tại.
- `pricegap` và các kiểm khác cần đọc qua nhiều lần deploy thì dùng `journalctl -t <tag> --since …`.
- `ops-check.sh` thêm một kiểm: bản ghi cũ nhất của journal ≤ 91 ngày. Quá thì báo, vì đó là dấu hiệu trần không chạy.
- PR #93 thêm (SEC ARC-07): ngưỡng dưới – journal xoay sớm vì dung lượng → WARN; đếm dòng `Suppressed` của journald trong 24 giờ → WARN.

**Migration:** không (hạ tầng).

**Test:**
- `ops-check` có ca "journal cũ hơn 91 ngày → FAIL".
- Smoke sau deploy: `journalctl CONTAINER_TAG=<tên container api>` có dòng của container trước lần deploy (như PR #93).
- `stat` quyền thư mục.

---

## Bổ sung 1 (06/11 tối) – sửa theo review SEC, BE và trả lời DOM

### 1.16 `x-write-roles` và các ca cấm viết tay (SEC ARC-02; BA ghi chú 46b)

**Phần mở rộng mới.** Ở mức operation: `x-write-roles: { <đường dẫn trường>: [vai] }`.
- Đường dẫn: `a` (trường gốc của thân lệnh), `a.b` (trường con), `a[].b` (trường của mọi phần tử mảng).
- Vai có trong `x-roles` mà không có trong danh sách gửi trường đó (kể cả `null`, mảng rỗng) → `403 FORBIDDEN_ACTION` + `audit_event access.denied`.
- Thứ tự: tra `Idempotency-Key` (ADR-009) → `x-roles` → `x-write-roles` → kiểm thân lệnh → kiểm kênh/trạng thái → tính giá. Thân lỗi 403 không có trường mở rộng nào (không `min`, `max`, `dates`, `errors`).
- Tài khoản nhiều vai: qua khi **một** vai có trong danh sách (hợp quyền, như `x-roles`). Ví dụ FD ∪ SAL gửi được `nightlyRates` – trả lời BA ghi chú 46b.
- Bộ sinh: `gen-openapi-meta.mjs` đưa `writeRoles` vào `openapi-meta.ts` (kiểm mọi vai thuộc `x-roles`, danh sách không rỗng); `gen_rbac_cases.py` sinh `fieldCases` (21 ca: 6 × 403, 15 × pass) – danh sách riêng, runner sprint không đọc.
- BE cài một guard chung đọc `writeRoles` (không viết tay trong từng service).

**Đã gắn ở 0.3.13:** `calculateQuote`, `saveQuote` (`nightlyRates`); `createReservationGroup` (`rooms[].nightlyRates`, R3).
**Việc sau (không chặn v1.0.5):** gắn cho các luật trường đã có (`publicRoomType` chỉ OWN, `overBalanceReason` FD+, `documentBlockOverride` FDL+…) ở 0.3.14; tới đó vẫn viết tay như cũ.

**Ranh giới theo trạng thái** (không biểu diễn được bằng `x-write-roles`) – ca cấm viết tay, BE viết test integration, QA đưa vào bộ hồi quy:

| # | Ca | Mong đợi |
|---|---|---|
| H-01 | FD gọi B18 đơn quá ngày đi (`nightsNotBilled` = 1) | 403 `FORBIDDEN_ACTION`, không trường mở rộng, `access.denied`, folio/đơn không đổi |
| H-02 | FDL như H-01 | như H-01 |
| H-03 | FD, FDL gọi `createVietQr` `purpose = check_out` cho đơn quá ngày đi | 403 trước kiểm trạng thái (không 409) |
| H-04 | MGR gọi B18 đơn quá ngày đi, `nightsNotBilled` = 2 | 403 kèm `requiredRole: owner`, `nightsNotBilled: 2`; `dryRun` cùng kết quả |
| H-05 | CTV `saveQuote` có `nightlyRates` | 403, không báo giá nào được lưu |
| H-06 | SAL, CTV `calculateQuote` có `nightlyRates` | 403 |
| H-07 | SAL `calculateQuote` có `nightlyRates` dưới sàn | 403 (không phải 422 `RATE_OUT_OF_RANGE`) – thân lỗi không có `min`, `max` |
| H-08 | FD `adjustFolioLine` giảm dòng hệ thống (phụ thu trả muộn) | 403 + `requiredFlow: foc_request` |
| H-09 | Mỗi ca H-01…H-08 | Có đúng một `audit_event access.denied` |

### 1.17 V5-14 bổ sung – báo giá chỉ kênh trực tiếp/đại lý; nghĩa `nightlyRates` như B1 (SEC ARC-01, ARC-06; BE C0313-05)

**Quyết định:**
- Báo giá chỉ nhận kênh nhóm `direct`, `agent` (BR-112, đúng mã hiện nay ở `quote-pricing.ts`). `ota`, `internal`, kênh ngừng → 422 `VALIDATION_FAILED` (`field` = `channelId`, `code` = `NOT_IN_LIST`), có hay không `nightlyRates`. Đơn Nội bộ chỉ tạo bằng `createReservation` (A01 FD+). Câu cũ "đơn kênh Nội bộ theo BR-421" và "kênh khác nhóm `ota`" bị bỏ.
- `nightlyRates` cùng nghĩa với `createReservation` kênh `direct`/`agent`:
  - gửi thì phủ **mọi** đêm (thiếu → 422 `REQUIRED`); ngoài khoảng/trùng ngày → 422 `DATE_INVALID`;
  - giá gõ = giá lịch, **trước** bậc BR-107 và mã quay lại BR-111 (BR-107 v0.3.8);
  - luôn sàn–trần BR-105; không đêm 0 đ (`AMOUNT_NOT_POSITIVE`).
- Đêm `edited` ≠ `true`: máy chủ lấy giá lịch của chính nó, bỏ `amountVnd` gửi lên (SEC ARC-06). Khác B1 ở bản này – có chủ đích; B1 theo sau ở 0.3.14 nếu SEC muốn.
- Cài đặt: phần giá đêm gọi `PricingService.price` (module reservations, public). Snapshot báo giá lưu `nights[].source` và giá thỏa thuận; `createHoldFromQuote` lấy nguồn trong snapshot (`edited = true` → `manual`, `bookingRateSource = manual_agreed`).

**Test thêm:**

| # | Ca | Mong đợi |
|---|---|---|
| T14-7 | Oracle chung: cùng căn, ngày, khách, giá gõ | `calculateQuote.totalVnd`, `depositVnd` = `createReservation` `previewOnly` |
| T14-8 | FD báo giá kênh `internal`, có và không `nightlyRates` | 422 `NOT_IN_LIST` (`channelId`) |
| T14-9 | SAL `saveQuote` kênh `internal` | 422, không báo giá nào được lưu |
| T14-10 | FD gửi `nightlyRates` thiếu 1 đêm | 422 `REQUIRED` (`nightlyRates`) |
| T14-11 | FD gửi đêm `edited = false` với `amountVnd` = 1 | Giá đêm đó = giá lịch máy chủ |
| T14-12 | FD ∪ SAL (tài khoản nhiều vai) gửi `nightlyRates` | Qua cổng trường (`fieldCases` `pass`) |

Thay T14-4 cũ ("kênh Nội bộ theo BR-421") bằng T14-8.

### 1.18 V5-15 bổ sung – trần đêm cho MGR, `nightsNotBilled`, bộ lọc OWN (SEC ARC-03; DOM 7.1 (a); BE C0313-03, 09, 10)

**DOM chốt (a):** OWN luôn; MGR khi `nightsNotBilled` ≤ 1; từ 2 đêm chỉ OWN. Hằng số theo BR-433 / ESC-007 A (không thêm tham số). Không migration.

**Luật trong hợp đồng (`checkOut`, "bổ sung 1 – đơn quá ngày đi"):**
- `nightsNotBilled` = ngày nghiệp vụ lúc ghi − ngày đi **hiệu lực** (`stayDepartureDate`, gồm đơn con gia hạn BR-422).
- MGR quá trần → 403 + `requiredRole: owner`, `nightsNotBilled` (chỉ hai trường này). FD/FDL → 403 không trường mở rộng.
- Thứ tự kiểm: Idempotency → tải đơn không khóa → vai/trần → thân lệnh → khóa → tiền.
- `checkoutAt` không sau giờ server + dung sai; `checkoutTimeNote` không bắt buộc; `checkoutTime` có thể vắng khi có `checkoutAt` (gửi cả hai thì phải khớp).
- `overdueReason` đi qua cùng hàm đọc chữ D12c với `checkoutTimeNote` (bỏ ký tự điều khiển, V-09 số thẻ → 422 `CARD_NUMBER_DETECTED`).
- Audit `after.overdue = { departureDate, checkoutAt, recordedAt, reason, nightsNotBilled }`; allowlist `reservation` thêm `overdue`.
- **Thời điểm ghi (BE C0313-03):** mọi B18 có `checkoutAt` ghi `reservation.actual_checkout_at` = `registration.actual_checkout_at` = `stay_ended_at` = `checkoutAt`. `recordedAt` chỉ cho audit và `post_checkout_window_until`. DOM đã xác nhận khai báo lúc đi dùng giờ rời thật. **SEC xác nhận** mốc giữ chứng cứ phạt (`stay_ended_at`) tính theo `checkoutAt`.
- QR `check_out` đơn quá ngày đi: cùng vai, cùng trần; FD/FDL → 403 trước kiểm trạng thái.
- `CheckoutSummary.nightsNotBilled` (chỉ khi `overdue`); `AllowedAction.overdue` chỉ khi người gọi làm được.
- `listAuditEvents.overdueOnly` (ghim `category = state`, `action = reservation.checked_out`) – bộ lọc "Trả phòng quá ngày đi – tuần này" của OWN (SEC ARC-03 ý 3).
- Minibar (BE C0313-10): PR-A1b đổi `minibar-checkout.port.ts` (`countFrom: LocalDate`) – người giữ module inventory review.

**Test thêm** (thay T15 tương ứng cũ):

| # | Ca | Mong đợi |
|---|---|---|
| T15-9 | MGR, đi 10/11, ghi 09:00 ngày 11/11 | 200; audit `after.overdue.nightsNotBilled = 1` (đọc lại `audit_event`) |
| T15-10 | MGR, đi 10/11, ghi 06:30 ngày 12/11 | 403 `requiredRole: owner`, `nightsNotBilled: 2`; đơn, folio không đổi |
| T15-11 | OWN, cùng đơn T15-10 | 200 |
| T15-12 | `listAuditEvents?overdueOnly=true` | Có cả T15-9 và T15-11, không có B18 thường |
| T15-13 | FDL gọi B18 đơn quá ngày đi | 403 không trường mở rộng (H-02) |
| T15-14 | `overdueReason` có số thẻ giả hợp Luhn | 422 `CARD_NUMBER_DETECTED` |
| T15-15 | Đơn chính có đơn con gia hạn còn hiệu lực, ngày lịch = ngày đi đơn chính | Không `check_out`, không `overdue` |

### 1.19 V5-10 bổ sung (BE C0313-01, 02, 07, 08)

- **QR và số phải thu (01):** `createVietQr` `purpose = check_out` và `amountDueNow` dùng cùng hàm quy đổi với B18 (`resolveCheckoutAt`, đặt ở `stay-support.ts` hoặc tương đương). Sau giờ server + dung sai → 422 `TIME_AFTER_ACTION`, không tạo QR, không ghi gì. `CheckoutSummary.checkoutAtAfterNow` cho Desk tắt nút trước.
- **Danh sách đi trong đêm (02):** `getArrivalsDepartures` vắng `date` trong cửa sổ sau nửa đêm → `departures` lấy ngày đi = ngày lịch; trả `departuresDate`. `arrivals` giữ ngày nghiệp vụ. BE-D làm (cùng V5-40, V5-43).
- **Ứng viên thứ ba (07):** khi giờ server ở cửa sổ sau nửa đêm của ngày đi và `t` ≥ rollover → thêm (ngày đi − 1, `t`) – giữ hành vi hiện có cho "khách rời tối hôm trước, lễ tân ghi trong đêm". `checkoutAt` gửi thẳng có ngày nghiệp vụ = ngày đi − 1 chỉ nhận trong cùng điều kiện, không trước giờ nhận phòng thực tế. Câu "Luật mới chỉ đổi kết quả…" bị bỏ (sai).
- **`createVietQr.checkoutAt` vắng (08):** quy đổi như `checkOut` (bỏ "vắng = giờ server"). Desk chỉ chuyển tiếp `checkoutAt` của lần tóm tắt có gửi giờ.

| # | Ca | Mong đợi |
|---|---|---|
| T10-8 | Đi 24/11; 01:05 ngày 24/11 gõ 23:50 | `checkoutAt` = 23/11 23:50, phụ thu 0; B18 và QR cùng giá trị |
| T10-9 | `checkoutAt` = 1 giờ sau giờ server | Tóm tắt `checkoutAtAfterNow = true`; QR `check_out` 422 `TIME_AFTER_ACTION`, không QR |
| T10-10 | 01:30 ngày 24/11, `getArrivalsDepartures` không `date` | `departuresDate` = 24/11; đơn đi 24/11 có mặt, có `check_out` |

### 1.20 V5-16 phần chặn – BR-438 (DOM 3, 7.2; BE C0313-04, 20)

**Luật (DOM chọn SEC (a) + báo cáo (b)):**
- "Sửa giảm" = `voidLine`, giảm `newQuantity`, giảm `newUnitPriceVnd`; dòng khác `room`, `extra_person`, `room_change_difference`; folio chưa `settled`.
- FD/FDL sửa giảm trực tiếp khi dòng **gốc** của chuỗi `related_line_id` (BE 04): `source = manual`, do chính người gọi ghi, ngày nghiệp vụ ghi = hôm nay. Ngoài ra → 403 + `requiredFlow: foc_request`; Desk chuyển sang "Gửi miễn có duyệt" (A35).
- Audit tính trên dòng gốc: `before.postedByActor`, `before.sameBusinessDay`, thêm `before.rootLineId`, `before.rootLineManual`. Allowlist `folio_line` thêm 4 khóa (BE).
- Báo cáo: `listAuditEvents.reductionsOnly`; `ShiftReport.lineReductions[]` (tính lúc đọc từ audit; không kịp thì v1.0.6 – DOM 7.2 ý 4); "Cần chú ý" `foc_threshold` `check = line_reduction_count` (ngưỡng chung `foc_alert_count_per_approver`, tháng theo ngày nghiệp vụ).
- FOC `reasonCode` thêm `entered_in_error` (không CHECK DB). Sửa giảm theo luật (1) không tính FOC tháng, không tính hạn mức BR-433.
- `removalsOnly`, `reductionsOnly`: máy chủ ghim `category = money`, `action = folio_line.adjusted` (BE 20).

**Migration:** không. **PR:** PR-B2 (BE-B), sau PR-B1.

| # | Ca | Mong đợi |
|---|---|---|
| T16-6 | FD bỏ dòng tay của chính mình, cùng ngày nghiệp vụ | 200; audit `rootLineManual = true`, `postedByActor = true`, `sameBusinessDay = true` |
| T16-7 | FD bỏ dòng tay của FD khác | 403 `requiredFlow: foc_request` |
| T16-8 | FD giảm dòng tay của mình ghi hôm qua | 403 |
| T16-9 | FD giảm dòng đã sửa một lần (dòng gốc của mình, hôm nay) | 200 – xét trên dòng gốc |
| T16-10 | FD bỏ phụ thu trả muộn hệ thống tạo khi chính FD bấm | 403 (H-08) |
| T16-11 | MGR sửa giảm dòng bất kỳ | 200 như cũ |
| T16-12 | FD sửa giảm 3 lần/tháng với ngưỡng thử 2 | `foc_threshold` `check = line_reduction_count`, `count = 3`, không tên |

### 1.21 V5-11, tin `hold_expired`, tiền về sau tự hủy (DOM 2, 7.6, 9, 11.4; BUG-R5-002)

**V5-11 – ARC review BR-010, BR-309, BR-311, BR-428 (DOM 7.6):** đồng ý luật DOM. Hợp đồng `earlyDeparture`:
- trong W (00:00 tới trước rollover, ngày lịch D+1): ngày đi hiệu lực = D+1 → 409 `INVALID_TRANSITION` + `useCheckout: true`; `newDepartureDate` ≤ D → 409 + `minNewDepartureDate` = D+1; kiểm trước mọi kiểm ngày khác, cả `dryRun`;
- dòng phí giữ lại lấy `serviceDate` = ngày nghiệp vụ lúc thao tác (không đổi hợp đồng);
- một hàm "ngày lịch tối thiểu" dùng chung cho B16 và V5-10. Không migration. PR-A2 (BE-A, sau PR-A1a).
- Nhận xét cho DOM: BR-309 và BR-311 không cần sửa chữ; BR-428 nên thêm một câu "trong W, nút Trả sớm không có cho lượt đi hôm nay theo ngày lịch – dùng Trả phòng" để khớp `useCheckout`.

**Tin `hold_expired` (DOM 9):** người tạo + người chốt + mọi FD, FDL đang hoạt động; một lần mỗi đơn, mỗi người một dòng. Không đổi schema; mô tả `StaffNotification` đã sửa.

**Tiền về cho đơn đã đóng – V5-5B (DOM 11.4 bản 06/11 khuya `e9e0e2e4`, BUG-R5-002) – ARC chốt cách làm:**

DOM quyết dùng lại `recordPayment`, áp cho mọi đơn `cancelled`/`no_show`. Bản trước của mục này (đóng đường, làm thao tác riêng) **bỏ**.

1. **5B-1 = một nhánh trong `recordPayment`**, không thao tác bọc. Lý do: một khoản tiền một đường (số PT-, audit, đối soát, đóng ca, báo cáo đọc một nguồn); thao tác bọc vẫn phải gọi cùng hàm nhưng thêm một route, một dòng rbac, một bộ ca quyền. Nhánh vào khi folio có đơn `cancelled`/`no_show`:
   - FD+ (SAL vẫn bị chặn, mã như hiện nay);
   - `method` chỉ `bank_transfer`, `vietqr`; **tiền mặt bị từ chối ở API** (hiện nay nhận) cùng POS, ví, `ota_collect` → 422 `VALIDATION_FAILED` (`method`, `NOT_ALLOWED`);
   - `attachmentId` bắt buộc (422 `REQUIRED`); `note` bắt buộc (422 `REASON_REQUIRED`);
   - `type` = `deposit` khi `status_before_cancel = hold`, `charge` với đơn khác (sai → 422 `NOT_ALLOWED` ở `type`) – trả lời DOM 2 (f);
   - `receivedAt` từ lúc tạo đơn tới bây giờ;
   - kết quả cùng giao dịch: `reconciliation = pending`; yêu cầu hoàn `refund` mã lý do **mới** `payment_after_cancel` (không dùng lại `overpayment`: báo cáo và nhãn Desk cần tách "Tiền về sau khi hủy"; `reason_code` là text, không migration), số = phần vượt còn phải thu (thường 100 %), không phí; `Payment.refundRequestId`; chi chỉ khi khoản thu `reconciled`; người ghi không tự duyệt; mục `deposit_after_cancel` đóng; audit `afterCancel: true`; đơn, folio không đổi trạng thái.
   - BE kiểm khi làm: (i) chặn "chi trước đối soát" đã có ở đường hoàn chưa – chưa có thì thêm 409 `INVALID_TRANSITION` ở bước thực hiện hoàn; (ii) giao dịch VietQR `pending` tạo trước khi đơn bị hủy rồi khách trả sau: hướng ARC – `confirmPaymentReceived` trên đơn đã đóng đi cùng nhánh 5B-1 (ảnh, hoàn 100 %), không có đường thứ hai.
2. **`createDepositNotice` trên đơn đã đóng (QA ca (f)):** **202** như đơn `hold`, lưu báo `open`, mở `deposit_after_cancel` cho FD, FDL, MGR, OWN; sale không cần biết thêm (thấy trạng thái đơn ở danh sách). Mục đóng khi có khoản thu ghi sau lúc báo, hoặc FD+ `resolveAttentionEvent` "Không thấy tiền" kèm ghi chú. Kind đã có trong CHECK DB – không migration.
3. **Migration 5B-1:** không. **PR:** PR-B1 (BE-B) nếu PO xếp v1.0.5; tới đó QA ca (a'')…(e') chờ.
4. **5B-2 – khôi phục giữ chỗ (v1.0.6, hợp đồng 0.3.14), phác:**
   - Thân `recordPayment` thêm `restoreHold: true` (FD+, chỉ đơn `cancelled` có `status_before_cancel = hold`; đơn khác → 422 `NOT_ALLOWED`). Cùng giao dịch: ghi khoản thu `deposit`, đơn `cancelled → hold` (cùng mã, căn, giá đã giữ), xác nhận cọc bằng chính khoản này (như `confirmDeposit.existingPaymentId`), **không** tạo yêu cầu hoàn. Đủ cọc → `confirmed`; thiếu → giữ chỗ có cọc một phần quá hạn (BR-303).
   - **Căn đã bán** (một đêm bất kỳ trùng): 409 `ROOM_UNAVAILABLE` + `conflicts[]`, `suggestions[]` – **cùng mã với khôi phục B12** (`restoreNoShow`), như DOM gợi ý. **Đã qua ngày đến:** 409 `INVALID_TRANSITION`. Lỗi nào cũng rollback cả giao dịch – khoản thu không ghi nửa chừng; lễ tân chọn lại lối hoàn (5B-1) hoặc mời căn khác.
   - **Tồn phòng song song (QA ca (b)):** đặt lại `room_occupancy.active = true` trong cùng giao dịch; ràng buộc `room_occupancy_no_overlap` (EXCLUDE, ADR-009) quyết người thắng – bên thua nhận 23P01 → 409 `ROOM_UNAVAILABLE`. Không cần khóa thêm ngoài khóa đơn như B12.
   - **Migration: không** – không có trigger chặn chuyển `cancelled → hold`; `reservation_cancelled_check` chỉ ràng khi `status = cancelled`; `cancel_reason_code`, `cancelled_at` giữ lại để tra (hoặc xóa – BE chọn, ghi audit). Máy trạng thái SM-01 thêm chuyển `cancelled → hold` (BA). SEC xem ai được khôi phục (DOM đề xuất FD+).

### 1.22 V5-30, V5-31 – cấu trúc và migration (DOM 4, 5, 7.3, 7.4)

**Khóa tham số** (không có mặc định, không số trong repo – SEC G3):
- `short_stay_commission_pct` (giữ);
- `long_stay_commission` (mới): `{ bands: [{ fromMonths, toMonths | null, vnPct, foreignPct }], firstInstalmentPct }` – thay phần hoa hồng thuê dài đang nằm trong `lease_terms` (BE C0313-17);
- `manager_performance_bonus_pct` (mới);
- `long_stay_cleaning_fee_by_room` (mới, V5-31): `{ "<roomNo>": VND }`, bội 1.000, 0–5.000.000, căn phải có; căn vắng → `adhoc_cleaning_fee`.

**Hợp đồng (cài cùng PR-M):** `Commission.instalmentNo` (1 | 2), `Commission.voidReason`; `getManagerPerformanceBonus` (tính lúc đọc, OWN/MGR, MGR chỉ của mình; dòng rbac BA thêm); `AttentionItem` `commission_rate_missing` (OWN, `computed`, không lưu kind); `GuestRequest.feeFallback` (FD+).
**Thiếu tỷ lệ lúc chốt:** không tạo bản ghi `commission`; lần đồng bộ sau khi có tỷ lệ tạo bù (DOM 7.3).

**Migration – có:**
- dòng `config_parameter_def` cho 3 khóa mới (danh mục khóa sống ở migration 0002 – thêm khóa = migration);
- cột `commission.instalment_no` (smallint null, CHECK `instalment_no IN (1, 2)`; bắt buộc khi `lease_contract_id` có, null khi `reservation_id` có) và unique mới
  `(lease_contract_id, payee_user_id, instalment_no) WHERE status <> 'void' AND lease_contract_id IS NOT NULL`; giữ `commission_live_key` cho đơn ngắn ngày. Bảng `commission_payout` chưa có thật
  (chỉ ở `erd.md`), nên đợt chi ghi trên `commission`.
- **Đề xuất tách PR-M riêng** (không gộp vào PR-0, PR-H1, PR-C1): nếu diễn tập khôi phục V5-61 chưa xong khi chốt bản thì v1.0.5 lên **không có** PR-M, mọi phần khác vẫn lên. Operation/trường của mục này chỉ cài cùng PR-M.

### 1.23 V5-58 bổ sung (SEC ARC-04, 05, 10; BE C0313-16, 21; DOM 7.5)

- Client: ô mật khẩu Wi-Fi không là `type="password"`, `autocomplete="off"`, tên ô không chứa `user`/`login`/`pass`, không điền sẵn, bước xác nhận "Khách sẽ thấy…". FE-A + UXD.
- Máy chủ: `ssid` trùng tên đăng nhập nhân viên cơ sở → 422 `NOT_ALLOWED`; mật khẩu trùng mật khẩu đăng nhập của **chính người gọi** (một lần argon2 verify, không đếm khóa, không log) → 422 `NOT_ALLOWED`. Không ghi, không audit khi lỗi.
- `ssid` ≤ 32 byte UTF-8; mật khẩu rỗng hoặc 8–63 ASCII in được; 422 không lặp giá trị; `no-store` cả PUT; PUT trả `passwordSet`, không `password`; không SSE; đọc cả dạng phẳng và dạng theo ngôn ngữ (`wifiOf`); ghi dạng phẳng; thực thể audit `property` đăng ký.
- Không `If-Match` (BE 21 ý 3): tần suất rất thấp, audit giữ `before.ssid` – từ chối có lý do.
- **FD đọc (DOM 7.5, SEC không phản đối):** cần BA thêm dòng rbac riêng "Xem Wi-Fi cơ sở" (đề xuất `S36`: OWN, MGR, FDL, FD) – S24 là màn Tham số, FD không xem. Khi BA có dòng, ARC đổi `getPropertyWifi` `x-rbac` sang dòng mới và thêm `front_desk` (đổi nhỏ, không migration). Tới đó T58-4 (FD → 403) giữ nguyên.

| # | Ca | Mong đợi |
|---|---|---|
| T58-7 | Hai cơ sở, đặt Wi-Fi cơ sở A | Cơ sở B không đổi |
| T58-8 | Dữ liệu dạng cũ theo ngôn ngữ (`raw.vi`) | GET đọc đúng như trang khách |
| T58-9 | `ssid` = tên đăng nhập `qa.fd`; mật khẩu = mật khẩu thử của người gọi | 422 `NOT_ALLOWED` cả hai, không ghi, không audit, thân lỗi không có giá trị gửi |
| T58-10 | E2E: trình duyệt đã lưu tài khoản Desk mở màn Wi-Fi | Hai ô trống |
| T58-6 (sửa) | Phản hồi GET **và** PUT | Có `no-store`; PUT không có `password` |

### 1.24 Các thẻ còn lại và V5-25 (BE C0313-06, 11–19; SEC ARC-12; BA; QA BUG-R5-001/003)

- **`lockReason` (BE 11):** thêm `invoice_issued`; thu nợ trên folio đang mở → 409 `INVALID_TRANSITION`. Một hàm `folioLocked(reason)`.
- **`RATE_OUT_OF_RANGE` (BE 12):** `min`, `max` ở mọi nơi trả mã (gồm bản `_WARNING`, B13, báo giá); B13 thêm `dates[]`, giữ `date`. T22-3.
- **`depositUnverifiedVnd` (BE 13):** = min(`depositPaidVnd`, Σ cọc chờ đối soát). T18-4.
- **`openRefunds` (BE 14):** T13-5 sửa: Σ `openVnd` = tiền hoàn đang mở; `creditVnd` − `unhandledCreditVnd` = min(`creditVnd`, Σ `openVnd`). `reasonCode` = mọi mã lý do của yêu cầu hoàn (BE liệt kê đủ trong PR-B1 cho UXD).
- **V5-1A (BE 15, SEC ARC-12):** sửa câu changelog (Desk không có màn tạo căn); bootstrap tạo căn `isSellable = false` khi chưa có giá. Danh sách việc kèm của BE (viết lại TC-NT-018, ví dụ BR-101 (5) ở `br-examples`, `validate-fixtures` bỏ ÷12, DS-E `expectedNightlyListPriceVnd`, các test gọi `createRoom`) là việc của PR-C1. Cảnh báo `NIGHTLY_PRICE_UNUSUAL` (không chặn) khi giá đêm < giá tháng ÷ 30 (BR-101 (4), đúng kiểm mềm Desk đang có) hoặc > giá tháng ÷ 3 [GIẢ ĐỊNH – DOM chốt biên trên]. DOM ghi `night_from_month_divisor` "ngừng dùng từ v1.0.5".
- **`listParameters.missing[]` (BE 17):** lọc vai như `data`; mọi chỗ đọc khóa hoa hồng bắt `ParameterMissingError` → `rate_missing`. T30-5.
- **Trigger 0094 (BE 19):** bắt theo SQLSTATE `23514` + tiền tố câu, trong `SAVEPOINT`. T44-4.
- **V5-25 (BE 06, 18; BUG-R5-001, BUG-R5-003; DOM 8.4, 12) – trả lời ORC: chỉ thêm dòng mô tả ở `setParameter`; không đổi schema, không trường mở rộng mới.** `PARAM_OUT_OF_RANGE` đã có `min`, `max`, `allowed[]`, `errors[{field, code}]`. ARC chốt tên DOM để mở:
  - `weekend_nights` = `Weekday[]` (`MON`…`SUN`), không rỗng, không trùng; số → 422; sửa bộ kiểm, không sửa bộ tính giá; `erd.md` 9.1, 9.1a đã sửa;
  - `min_stay` theo DOM 12.1: 0–20 luật; khóa chỉ `nights`, `channels`, `arrivalWeekdays`, `arrivalOnSpecialDates`; `nights` 1–min(7, `short_stay_max_nights`); `channels` bắt buộc (`"all"` hoặc con của `direct`/`agent`/`ota`); mỗi luật áp ít nhất một ngày; `[]` = không tối thiểu;
  - lỗi báo điểm sai đầu tiên: `errors[0].field` = `value[<i>].<khóa>`, `code` thuộc bảng mã trường có sẵn (`REQUIRED`, `VALUE_OUT_OF_RANGE`, `NOT_IN_LIST`, `DUPLICATE`, `NOT_ALLOWED`); `min`/`max`/`allowed` như bảng DOM;
  - kiểm ngược `short_stay_max_nights` < `nights` lớn nhất của `min_stay` (hiệu lực ở `effectiveFrom` hoặc đã lên lịch sau) → 422, `min` = số đó;
  - bộ đọc phòng thủ ở 3 chỗ gọi `minStayNights`: không mảng → không luật; phần tử hỏng → bỏ; log một lần; không 500;
  - không mở đường sửa dòng hiệu lực hôm nay (R5-B-06).

- **BA (a) – `rbac-matrix.json` A07b, A33 trỏ `channelWebhook`, `paymentCallback`:** ARC đề nghị BA **bỏ** hai operationId này (không đổi tên): đường hệ thống thật là `webhookPost`/`webhookGet` (`x-roles: [system]`, R3); gắn vào A07b/A33 (vai FD+) sẽ làm `rbac_check` báo lệch. BA ghi chú "đường cổng thanh toán/OTA: `webhookPost` (system)".
- **BA (b) – ghi chú 46b:** chốt hợp quyền, xem 1.16.
- **SEC ARC-13:** id `rbac-cases` ổn định `RB-<operationId>-<subject>`, ca trường `RBF-<operationId>-<field>-<subject>`; id cũ trong tài liệu trước 0.3.13 (`RB-0387`…) theo đánh số của commit đó – tra git. Thêm `x-round: R5` cho `getPropertyWifi`, `setPropertyWifi`, `getManagerPerformanceBonus`.

---

## 2. Đầu vào theo làn và thứ tự PR

PR-0 là PR hợp đồng này (gồm bổ sung 1). SEC và BE review; ORC gộp. Sau khi PR-0 gộp, các làn chạy song song.

Chia BE theo module là đề xuất của ARC; ORC đổi người làm được, chỉ cần giữ thứ tự phụ thuộc. **Bổ sung 1** tách PR-A1 thành hai làn theo đề xuất BE, chuyển V5-40, V5-43 sang BE-D, thêm PR-B2 và PR-M.

| Thứ tự | Làn | PR | Đầu vào hợp đồng | Phụ thuộc | Hạn / ghi chú |
|---|---|---|---|---|---|
| 0 | ARC | **PR-0** (#94): hợp đồng 0.3.13 + bổ sung 1 | – | – | SEC, BE review lại bổ sung 1 |
| 1a | BE-A1 | **PR-A1a**: V5-10 (+ BE 01, 07, 08) | 1.1, 1.19 | PR-0 | |
| 1b | BE-A2 | **PR-A1b**: V5-15 (+ trần MGR, BE 03, 09, 10, cổng minibar) | 1.4, 1.18, 1.16 H-01…H-04 | PR-0; rebase theo PR-A1a nếu cùng chạm `checkout.service.ts` (gộp sau PR-A1a) | Người giữ inventory review cổng minibar |
| 1c | BE-D | **PR-D1**: V5-40, V5-43 + `departuresDate` (BE 02) | 1.19 | PR-0 | |
| 2 | BE-A | **PR-A2**: V5-11 | 1.21 | PR-A1a | Hàm "ngày lịch tối thiểu" dùng chung |
| 1d | BE-B | **PR-B1**: V5-13 + V5-18 + V5-44 (a) + V5-16 (lọc, `reductionsOnly`) + BE 11, 13, 14 | 1.2, 1.6, 1.11 (a), 1.5, 1.20, 1.24 | PR-0 | |
| 2 | BE-B | **PR-B3**: V5-5B 5B-1 (nhánh đơn đã đóng, `createDepositNotice` 202, `deposit_after_cancel`) | 1.21 | PR-B1 | Nếu PO xếp v1.0.5; FE nút trên khung đơn đã đóng |
| 2 | BE-B | **PR-B2**: V5-16 phần chặn BR-438 + `lineReductions` + `foc_threshold` `line_reduction_count` | 1.20 | PR-B1 | |
| 1e | BE-S | **PR-S1**: V5-14 + V5-22 + guard `x-write-roles` | 1.3, 1.9, 1.16, 1.17 | PR-0 | **≤ 08/11** (BE 05) |
| 1f | BE-C | **PR-C1**: V5-1A (+ cảnh báo tỷ lệ, bootstrap) + V5-44 (b) + V5-58 (+ bổ sung) | 1.8, 1.11 (b), 1.13, 1.23, 1.24 | PR-0; **V5-73 gộp trước** | |
| 1g | BE-C | **PR-C2**: V5-25 (`weekend_nights`, `min_stay`; BUG-R5-001, BUG-R5-003) | 1.24 | PR-0; luật lưu của DOM | Ưu tiên: BUG-R5-003 là P1 |
| 1h | BE-H | **PR-H1**: V5-30 phần làm ngay (`status`, `missing[]`, bắt `ParameterMissingError`) | 1.10, 1.24 | PR-0 | |
| 3 | BE-H | **PR-M** (migration): 3 khóa danh mục + `commission.instalment_no` + phần hợp đồng 1.22 | 1.22 | PR-H1; **V5-61 (diễn tập khôi phục)** trước khi lên production | Tách bản được (mục 4); hạn H2 01/12 |
| – | FE-A | Theo từng BE PR (gộp sau BE tương ứng): V5-10, 13, 14, 15, 16, 22, 44, 58; nút chuyển FOC khi `requiredFlow` | Kiểu sinh từ PR-0 | BE tương ứng | Mock đúng phạm vi máy chủ (P432-03) |
| – | FE-A | V5-50, nút Cần dọn (V5-15) | Không đổi hợp đồng | Không | Làm ngay |
| – | FE-B | V5-18, V5-13 (khung đơn), V5-46 | 1.6, 1.2, 1.12 | PR-B1 (V5-18, 13); V5-46 không chờ | V5-46 bật cùng tag máy chủ |
| – | MOB | Nút Cần dọn trên app nhân viên (V5-15); V5-46 nếu thuộc app khách | 1.4, 1.12 | Không | Hàng đợi offline như R8 |
| – | OPS | V5-62, V5-63 (+ SEC ARC-07, 08) | 1.14, 1.15 | Không | SEC review; ARC review cấu hình |
| sau | BE | 0.3.14: 5B-2 khôi phục (`recordPayment.restoreHold`) | 1.21 | PR-B3 | v1.0.6 |

"Thứ tự" cùng số = chạy song song. Gộp PR-A1a trước PR-A1b vì cùng tệp.

Luật chung:
- Mọi PR không sửa `docs/api/openapi.yaml`. Cần đổi hợp đồng thì báo ARC làm PR bổ sung.
- PR có migration ghi rõ ở mô tả (mục 4).

---

## 3. Mục chờ DOM

**Bổ sung 1:** DOM đã trả lời các mục chờ (`rules-v1.0.5.md` mục 7, 9, 11). Tình trạng:

| Việc | DOM chốt | ARC đã làm | Còn mở |
|---|---|---|---|
| V5-16 | SEC (a) + báo cáo (b) → BR-438 | 1.20 | – |
| V5-30 | Cấu trúc khóa, đợt chi, thiếu tỷ lệ (4, 7.3) | 1.22 (PR-M) | Số do INV nhập (ESC-051 câu 1–3 còn mở; đội dùng A) |
| V5-15 | (a): OWN luôn, MGR ≤ 1 đêm | 1.18 | SEC xác nhận mốc giữ chứng cứ theo `checkoutAt` |
| V5-11 | Luật W (2, 7.6) | 1.21 | DOM thêm câu BR-428 nếu đồng ý nhận xét 1.21 |
| V5-31 | Khóa theo căn (5, 7.4) | 1.22 (PR-M) | – |
| V5-58 (phụ) | FD đọc (7.5) | 1.23 | **BA** thêm dòng rbac; ARC thêm vai |
| 11.4 / V5-5B | Dùng lại `recordPayment`, mọi đơn đã đóng; 5B-2 khôi phục cùng đơn | 1.21 (5B-1 vào 0.3.13; 5B-2 phác 0.3.14) | SEC chốt ai được khôi phục; PO xếp bản |
| V5-25 | Luật lưu `min_stay` (mục 12), `weekend_nights` (8.4) | 1.24, mô tả `setParameter` | – |
| BR-101 (4) | – | Biên dưới giá tháng ÷ 30 | **DOM chốt biên trên** (ARC giả định ÷ 3) |

**Điểm còn mở ở DOM 7.1 (ORC hỏi):** ARC thấy 7.1 đủ cho hợp đồng. Hai điểm nhỏ đề nghị DOM ghi rõ: (1) ngày nghiệp vụ lúc ghi là của **lúc bấm** (không phải `checkoutAt`) – hợp đồng đã viết theo cách này; (2) lượt có đơn con gia hạn: "ngày đi" là ngày đi hiệu lực của cả lượt (BR-422).

---

## 4. Mục có migration (QC R4 ĐK-2: không phát hành production có migration trước khi diễn tập khôi phục xong)

- **Không migration:** V5-10, 11, 13, 14, 15 (cả trần MGR), 16 (cả BR-438), 18, 1A, 22, 25, 44, 58, V5-5B (5B-1 và 5B-2), tin `hold_expired`, `x-write-roles`; V5-62/63 (hạ tầng).
- **Có migration – gom vào một PR riêng PR-M** (trả lời ORC: V5-30, V5-31 **có** migration):
  - `config_parameter_def`: `long_stay_commission`, `manager_performance_bonus_pct`, `long_stay_cleaning_fee_by_room` (không giá trị mặc định – SEC G3);
  - `commission.instalment_no` + unique mới (1.22).
  - Không có kind thông báo/"Cần chú ý" mới cần nới CHECK: `commission_rate_missing` là mục `computed` (không lưu).
- **Đề xuất tách bản:** PR-M chỉ gộp vào `main` khi PO xếp nó vào v1.0.5 **và** V5-61 xong; nếu V5-61 chưa xong thì v1.0.5 lên không có PR-M, H2 lên ở bản kế (hạn 01/12). Các PR khác không phụ thuộc PR-M.
- **Có thể có migration, chờ BE xác nhận:** 5B-2 (ARC thấy không cần – 1.21 ý 4).
- **Ngoài hợp đồng, có thể có migration dữ liệu:** V5-17 (tính lại `is_complimentary`). ARC review khi DATA và BE đưa cách làm.

---

## 5. Tệp tạo/sửa

- `product/docs/api/openapi.yaml` → 0.3.13-draft (mục "Thay đổi phiên bản 0.3.13-draft").
- `product/services/api/src/generated/openapi-meta.ts`, `openapi-schemas.ts` (sinh lại).
- `product/packages/api-client/src/generated/openapi.ts` (sinh lại).
- `product/tests/fixtures/rbac-cases.json`, `rbac-cases.csv` (sinh lại; 2 operation mới).
- **Bổ sung 1:** `openapi.yaml` (vẫn `0.3.13-draft`); `services/api/scripts/gen-openapi-meta.mjs`, `src/shared/openapi-types.ts` (`writeRoles`); `tests/tools/gen_rbac_cases.py` (id ổn định,
  `fieldCases`); `docs/erd.md` 9.1, 9.1a (`weekend_nights`, `min_stay`); `docs/qa/traceability.md` (sinh lại); `apps/admin-web/src/pages/RoomsPage.tsx` (một dòng: `count` thành tùy chọn);
  `rounds/round-05/responses/ARC-on-contract-0.3.13-reviews.md`.
- `rounds/round-05/outputs/ARC/contract-0.3.13.md` (tệp này).
- `rounds/round-05/outputs/ARC/report.md`: ARC gửi nội dung trong kết quả trả về; ORC lưu tệp, như đã làm với báo cáo PO.

---

## 6. Giả định

- G1. Máy chủ quy đổi giờ trả và trả `checkoutAt`, thay vì Desk tự ghép ngày với giờ. Desk không có ngưỡng sai lệch; luật chỉ nằm một chỗ (rủi ro ở plan mục 4).
- G2. V5-15: ~~chỉ OWN/MGR~~ **bổ sung 1**: OWN luôn, MGR ≤ 1 đêm (DOM 7.1 (a)), không hậu kiểm.
- G3. `openRefunds` chỉ FD+, cả ở `Folio.totals`. A1 viết "theo quyền đọc folio", nhưng SAL đọc được folio; ARC thu hẹp theo `unhandledCreditVnd`.
- G4. Wi-Fi dùng operation riêng, không dùng tham số. FD không đọc được (S24) **tới khi BA có dòng rbac đọc Wi-Fi** (bổ sung 1, DOM 7.5).
- G5. Lọc `removalsOnly` chạy trên jsonb mà không cần chỉ mục mới, vì số bản ghi một tuần của 10 căn nhỏ. BE đo trên staging.
- G6. `QuoteInput.nightlyRates` chỉ FD+ (`x-write-roles`); báo giá chỉ kênh `direct`/`agent` (bổ sung 1, SEC ARC-01).
- G7. Lượt hai: production 15:00, staging 15:30 (plan V5-62, PR #93). Chỉ câu "RPO 12 giờ" còn chờ INV xác nhận ngày 20/11.
- G8. Chia làn BE theo module như mục 2.
- G9. Biên trên cảnh báo giá đêm = giá tháng ÷ 3 [GIẢ ĐỊNH – DOM chốt]; biên dưới ÷ 30 theo BR-101 (4).
- G10. Ứng viên thứ ba của "Quy đổi giờ trả" (BE 07) giữ hành vi hiện có, không phải luật nghiệp vụ mới; DOM V5-11 luật 3 cùng hướng.
- G11. Bộ đọc `min_stay` phòng thủ coi giá trị hỏng như không có luật trong ngày đó (thà mất luật tối thiểu đêm một ngày hơn là dừng bán cả ngày).
- G12. V5-5B: 5B-1 là nhánh trong `recordPayment`; 5B-2 khôi phục **cùng đơn**; không migration (BE xác nhận ràng buộc `payment`, chặn chi trước đối soát).
- G13. `x-write-roles` chỉ gắn cho luật mới của 0.3.13; luật trường cũ chuyển sang ở 0.3.14.
- G14. Từ chối tiền mặt trên đơn đã đóng không làm mất việc nào đang làm trên Desk (Desk không có nút ghi thu cho đơn đã hủy – QA BUG-R5-002); khách ở quầy thu trên đơn mới (DOM 2 (b)).

---

## 7. Rủi ro / việc chưa xong

- Phần chặn V5-16 và cấu trúc V5-30 chưa có trong hợp đồng; ARC thêm bổ sung trong ngày DOM chốt. Hạn H2 là 01/12.
- V5-1A là đổi phá vỡ. Script hay công cụ nào gọi `createRoom`/`updateRoom` mà chưa gửi giá đêm sẽ nhận 422. ORC/OPS đã gửi đủ hai giá từ Gói 0; BE-C rà bootstrap và công cụ nhập.
- V5-63: đổi driver phải đi cùng một lần dựng lại container. Rủi ro bỏ quên `max-size`: **đã xử lý ở PR #93**, test 18, 19, 21 của `ops-check-journal.test.sh` giữ. Desk gián đoạn 20–60 giây ở W6 bước 4 (ARC-on-ops-prs 1.1).
- `openapi-spec-validator` chưa chạy local; CI chạy.
- **Bổ sung 1:** đổi id `rbac-cases` làm mọi id cũ đổi một lần (QA biết; tài liệu cũ tra git). Bổ sung 1 thêm nhiều luật vào PR-A1b, PR-B2, PR-S1 – hạn PR-S1 ≤ 08/11 sát; nếu trễ, ORC dời phần `x-write-roles` guard chung sang PR riêng nhưng **không** cho PR-S1 lên mà thiếu chặn SAL/CTV.
- PR-M phụ thuộc V5-61; H2 có thể trượt sang bản sau 01/12 nếu diễn tập trễ.
- BR-438 chưa có story/TC tham chiếu (`traceability.md` 5.5): PO gắn vào story V5-16, QA viết TC theo T16-6…T16-12.

---

## 8. Dòng decision-log đề nghị (ORC ghi khi gộp)

`| 2026-11-06 | 5 | **ARC – hợp đồng OpenAPI 0.3.13-draft cho v1.0.5** (rounds/round-05/outputs/ARC/contract-0.3.13.md; PR r5-contract-0313): V5-10 máy chủ quy đổi giờ trả theo một luật, CheckoutSummary.checkoutAt dùng chung cho tóm tắt, QR, B18; V5-13 openRefunds[] theo lý do (FD+); V5-14 QuoteInput.nightlyRates, createHoldFromQuote nhận trường giá → 422; V5-15 B18 đơn quá ngày đi chỉ OWN/MGR, checkoutAt + overdueReason; V5-16 lọc action/removalsOnly (phần chặn chờ DOM); V5-18 depositUnverifiedVnd; V5-1A giá đêm bắt buộc (đổi phá vỡ có chủ đích, BUG-R4-057); V5-22 min/max; V5-30 commission.status + listParameters.missing (cấu trúc H2 chờ DOM, không số); V5-44 Problem.lockReason, trigger 0094 → 409; V5-58 getPropertyWifi/setPropertyWifi; V5-62 lượt hai production 15:00, staging 15:30 (RPO 12 giờ); V5-63 journald + MaxRetentionSec=90day. Không migration ở các mục đã chốt | ARC | Quyền ARC (hợp đồng API, kiến trúc) |`

`| 2026-11-06 | 5 | **ARC – 0.3.13-draft bổ sung 1** (contract-0.3.13.md mục 1.16–1.24; responses/ARC-on-contract-0.3.13-reviews.md): x-write-roles (403 trước mọi kiểm thân lệnh, hợp quyền nhiều vai); báo giá chỉ kênh direct/agent, nightlyRates như B1; V5-15 MGR ≤ 1 đêm, từ 2 đêm chỉ OWN, overdueOnly; V5-16 BR-438 (dòng gốc nhập tay của chính mình, trong ngày nghiệp vụ; khác → FOC); V5-11 minNewDepartureDate/useCheckout; hold_expired gửi cả FD, FDL; V5-5B 5B-1 nhánh đơn đã đóng trong recordPayment (FD+, chỉ chuyển khoản/VietQR, ảnh bắt buộc, chờ đối soát, hoàn 100 % payment_after_cancel), createDepositNotice đơn đã đóng → 202 + deposit_after_cancel, 5B-2 khôi phục cùng đơn ở 0.3.14 (409 ROOM_UNAVAILABLE như B12, không migration); V5-25 luật lưu min_stay theo DOM 12, không đổi schema; V5-30/31 có migration – PR-M riêng, tách bản được nếu V5-61 chưa xong; id rbac-cases ổn định | ARC | Quyền ARC (hợp đồng API, kiến trúc) |`
