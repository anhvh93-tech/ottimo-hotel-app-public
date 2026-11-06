# ARC – Hợp đồng OpenAPI 0.3.13-draft (v1.0.5)

- Người làm: ARC | Round 5 (bảo trì v1.0.5) – Gói 0 – Bước: **Sản xuất** | 06/11/2026
- Nhánh: `r5-contract-0313`, cắt từ `main` @ `4a36180a`. Không rebase, không force.
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
| V5-15 | B18 nhận đơn quá ngày đi với ngày rời thật, **chỉ OWN/MGR**. Nút Cần dọn là việc giao diện | Thêm trường, luật, cờ `overdue` | Không | DOM xác nhận vai (mục 3) |
| V5-16 | Bộ lọc tuần làm ngay. Phần chặn theo vai chờ DOM chọn | Thêm 2 tham số lọc, 3 khóa audit | Không | **Có**: phần chặn |
| V5-18 | `Reservation.depositUnverifiedVnd` | Thêm trường đọc | Không | Không |
| V5-19 | Chỉ phác (Gói 5, có điều kiện kích hoạt) | Chưa đổi | Không | Không |
| V5-1A | Giá đêm **bắt buộc**, thiếu thì 422 | **Đổi phá vỡ có chủ đích** (lý do ở 1.8) | Không | Không |
| V5-22 | `RATE_OUT_OF_RANGE` luôn có `min`, `max` | Thêm trường mở rộng | Không | Không |
| V5-30 | Không số mặc định. Thiếu tỷ lệ thì báo, không tính | Thêm `commission.status`, `listParameters.missing[]` | Có thể (dòng danh mục khóa) | **Có**: cấu trúc bảng H2 |
| V5-44 | `Problem.lockReason`. Lỗi trigger 0094 → 409 | Thêm trường mở rộng, đổi 500 → 409 | Không | Không |
| V5-46 | Đã có từ 0.3.12 (i) | Không đổi | Không | Không |
| V5-50 | Desk lọc theo `listRoomStatuses` | Không đổi | Không | Không |
| V5-57 | Đã có từ 0.3.7 (`q` tìm theo tên) | Không đổi | Không | Không |
| V5-58 | Hai operation riêng cho Wi-Fi, ghi vào cột trang khách đang đọc | Thêm `getPropertyWifi`, `setPropertyWifi` | Không | Không |
| V5-62 | Giữ (a). **Đề xuất 15:30 thay 14:00** để đúng câu "mất tối đa 12 giờ" | Không (hạ tầng) | Không | Không |
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
- Vòng xoay theo tuổi (≤ 7 ngày giữ hết; bộ Chủ nhật UTC < 35 ngày) vẫn đúng trần 35 ngày.

**ARC đề xuất đặt lượt thứ hai lúc 15:30, không phải 14:00:**
- 03:30 + 14:00 cho khoảng cách lớn nhất 13 giờ 30 (14:00 → 03:30 hôm sau). Câu "mất tối đa 12 giờ từ v1.0.5" (sổ vận hành 1.2, INV xác nhận 20/11) sẽ sai.
- 03:30 + 15:30 cho đúng 12 giờ mỗi khoảng.
- Nếu PO giữ 14:00 thì sửa chữ thành "tối đa 13 giờ 30".

**Việc của OPS:**
- `ottimo-backup.timer` thêm dòng `OnCalendar` thứ hai.
- `ops-check.sh` hạ `BACKUP_MAX_HOURS` từ 26 xuống 14 (khoảng cách 12 giờ + 2 giờ dư).
- `pull-backups.sh` đã `--ignore-existing`, kéo hai bản một ngày không đổi gì.
- `hosting-plan.md` mục 7 sửa RPO.
- SEC sửa SR-BAK-01 khi bản lên.

**Migration:** không.

**Test:** `backup.test.sh` có 2 lượt trong cùng ngày với tên khác nhau; tuổi bản > 14 giờ thì ops-check báo FAIL.

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

**Quyền đọc:**
- `/var/log/journal` thuộc `root:systemd-journal`, tệp 0640.
- OPS kiểm nhóm `adm` và `systemd-journal` chỉ có tài khoản vận hành. Không user thường nào đọc được.

**Giữ nguyên:**
- Cách che hiện có: ứng dụng che khóa nhạy cảm; Caddy che `/g/*` và mọi query string.
- Log **không** vào bản sao lưu ngoài máy: `backup.sh` không đọc `/var/log/journal`; `pull-backups.sh` chỉ kéo thư mục bản sao lưu.

**Ảnh hưởng tới công cụ:**
- `docker logs` vẫn chạy với journald, nhưng chỉ đọc container hiện tại.
- `pricegap` và các kiểm khác cần đọc qua nhiều lần deploy thì dùng `journalctl -t <tag> --since …`.
- `ops-check.sh` thêm một kiểm: bản ghi cũ nhất của journal ≤ 91 ngày. Quá thì báo, vì đó là dấu hiệu trần không chạy.

**Migration:** không (hạ tầng).

**Test:**
- `ops-check` có ca "journal cũ hơn 91 ngày → FAIL".
- Smoke sau deploy: `journalctl -t <tên container api>` có dòng của container trước lần deploy.
- `stat` quyền thư mục.

---

## 2. Đầu vào theo làn và thứ tự PR

PR-0 là PR hợp đồng này. SEC và BE review; ORC gộp. Sau khi PR-0 gộp, các làn chạy song song.

Chia BE theo module là đề xuất của ARC; ORC đổi người làm được, chỉ cần giữ thứ tự phụ thuộc.

| Làn | PR | Đầu vào hợp đồng | Phụ thuộc | Ghi chú |
|---|---|---|---|---|
| BE-A (frontdesk) | PR-A1: V5-10 + V5-15 | 1.1, 1.4; `CheckoutSummary.checkoutAt`/`checkoutTimeNoteRequired`/`overdue`, `checkOut.overdueReason`, `AllowedAction.overdue` | PR-0 | V5-11 (DOM) gộp sau, cùng tệp `checkout.service.ts` → PR-A2 |
| BE-B (folio, payments) | PR-B1: V5-13 + V5-18 + V5-44 (a) + V5-16 (lọc) | 1.2, 1.6, 1.11 (a), 1.5; `OpenRefund`, `depositUnverifiedVnd`, `lockReason`, `action`/`removalsOnly` | PR-0 | Phần chặn V5-16 → PR-B2 sau DOM |
| BE-C (platform) | PR-C1: V5-1A + V5-44 (b) + V5-58 | 1.8, 1.11 (b), 1.13 | PR-0; **V5-73 gộp trước** | Bootstrap + công cụ nhập cùng PR |
| BE (sales, reservations) | PR-S1: V5-14 + V5-22 | 1.3, 1.9 | PR-0 | |
| BE (cấu hình hoa hồng) | PR-H1: V5-30 phần làm ngay; PR-H2: cấu trúc H2 | 1.10 | PR-0; PR-H2 sau DOM + ARC bổ sung | G3; hạn 01/12 |
| FE-A | Theo từng BE PR (gộp sau BE tương ứng): V5-10, 13, 14, 15, 16, 22, 44, 58 | Kiểu sinh từ PR-0 | BE tương ứng | Viết song song trên mock theo kiểu mới. Mock đúng phạm vi máy chủ (P432-03) |
| FE-A | V5-50, nút Cần dọn (V5-15) | Không đổi hợp đồng | Không | Làm ngay |
| FE-B | V5-18, V5-13 (khung đơn), V5-46 | 1.6, 1.2, 1.12 | PR-B1 (V5-18, 13); V5-46 không chờ | V5-46 bật cùng tag máy chủ |
| MOB | Nút Cần dọn trên app nhân viên (V5-15); V5-46 nếu thuộc app khách | 1.4, 1.12 | Không | Hàng đợi offline như R8 |
| OPS | V5-62, V5-63 | 1.14, 1.15 | Không | SEC review; ARC review cấu hình |

Luật chung:
- Mọi PR không sửa `docs/api/openapi.yaml`. Cần đổi hợp đồng thì báo ARC làm PR bổ sung.
- PR có migration ghi rõ ở mô tả (mục 4).

---

## 3. Mục chờ DOM

| Việc | DOM cần chốt | ARC làm sau khi DOM chốt |
|---|---|---|
| V5-16 | (a) chặn theo "dòng của mình, trong ngày nghiệp vụ" (SEC đề xuất), hay (b) chỉ đếm vào BR-435/BR-526 | (a): bổ sung 0.3.13 (403 + `requiredFlow`); (b): không đổi hợp đồng |
| V5-30 | Cấu trúc bảng H2: khóa, chiều (kênh, vai, loại lưu trú, mốc chi); ghi gì khi thiếu tỷ lệ lúc chốt đơn | Tên khóa + kiểu vào hợp đồng; nếu cần kind "Cần chú ý" mới → migration |
| V5-15 | Xác nhận vai **OWN/MGR** cho trả phòng quá ngày đi, hay muốn FDL, hoặc "lễ tân ghi, quản lý hậu kiểm" (v1.0.6, có migration) | Hướng khác → bổ sung |
| V5-11 | Luật trả sớm 00:00–05:59 (RN-05, B16 không hoàn đêm đã ở) | Review PR BE-A; có thể không đổi hợp đồng (409 `INVALID_TRANSITION` đã có) |
| V5-31 | Phí dọn thuê tháng theo hạng | Nếu cần khóa tham số mới → migration dòng danh mục |
| V5-58 (phụ) | FD có cần đọc Wi-Fi trên Desk không | Thêm vai (đổi nhỏ) + BA sửa rbac |

---

## 4. Mục có migration (QC R4 ĐK-2: không phát hành production có migration trước khi diễn tập khôi phục xong)

- **Mọi mục đã chốt trong 0.3.13: không migration.** Gồm V5-10, 13, 14, 15, 16 (phần lọc), 18, 1A, 22, 44, 58, và V5-62/63 (hạ tầng).
- **Có thể có migration, chờ DOM:**
  - V5-30: dòng danh mục khóa hoa hồng mới, và/hoặc nới CHECK kind thông báo/"Cần chú ý";
  - V5-31: khóa phí dọn theo hạng;
  - V5-15 nếu DOM chọn hậu kiểm (kind mới, v1.0.6).
- **Ngoài hợp đồng, có thể có migration dữ liệu:** V5-17 (tính lại `is_complimentary`). ARC review khi DATA và BE đưa cách làm.
- Nếu v1.0.5 có bất kỳ migration nào thì bản phải chờ V5-61 (diễn tập khôi phục).

---

## 5. Tệp tạo/sửa

- `product/docs/api/openapi.yaml` → 0.3.13-draft (mục "Thay đổi phiên bản 0.3.13-draft").
- `product/services/api/src/generated/openapi-meta.ts`, `openapi-schemas.ts` (sinh lại).
- `product/packages/api-client/src/generated/openapi.ts` (sinh lại).
- `product/tests/fixtures/rbac-cases.json`, `rbac-cases.csv` (sinh lại; 2 operation mới).
- `rounds/round-05/outputs/ARC/contract-0.3.13.md` (tệp này).
- `rounds/round-05/outputs/ARC/report.md`: ARC gửi nội dung trong kết quả trả về; ORC lưu tệp, như đã làm với báo cáo PO.

---

## 6. Giả định

- G1. Máy chủ quy đổi giờ trả và trả `checkoutAt`, thay vì Desk tự ghép ngày với giờ. Desk không có ngưỡng sai lệch; luật chỉ nằm một chỗ (rủi ro ở plan mục 4).
- G2. V5-15 chỉ OWN/MGR, không hậu kiểm. Lý do ở 1.4; DOM xác nhận.
- G3. `openRefunds` chỉ FD+, cả ở `Folio.totals`. A1 viết "theo quyền đọc folio", nhưng SAL đọc được folio; ARC thu hẹp theo `unhandledCreditVnd`.
- G4. Wi-Fi dùng operation riêng, không dùng tham số. FD không đọc được (S24).
- G5. Lọc `removalsOnly` chạy trên jsonb mà không cần chỉ mục mới, vì số bản ghi một tuần của 10 căn nhỏ. BE đo trên staging.
- G6. `QuoteInput.nightlyRates` chỉ FD+ và kênh khác OTA, cùng lý do với A01.
- G7. Lượt sao lưu thứ hai lúc 15:30 (đề xuất); PO/ORC có thể giữ 14:00 và sửa chữ RPO.
- G8. Chia làn BE theo module như mục 2.

---

## 7. Rủi ro / việc chưa xong

- Phần chặn V5-16 và cấu trúc V5-30 chưa có trong hợp đồng; ARC thêm bổ sung trong ngày DOM chốt. Hạn H2 là 01/12.
- V5-1A là đổi phá vỡ. Script hay công cụ nào gọi `createRoom`/`updateRoom` mà chưa gửi giá đêm sẽ nhận 422. ORC/OPS đã gửi đủ hai giá từ Gói 0; BE-C rà bootstrap và công cụ nhập.
- V5-63: đổi driver phải đi cùng một lần dựng lại container. Bỏ quên `max-size` trong `daemon.json` thì Docker không khởi động. OPS diễn tập trên staging trước.
- `openapi-spec-validator` chưa chạy local; CI chạy.

---

## 8. Dòng decision-log đề nghị (ORC ghi khi gộp)

`| 2026-11-06 | 5 | **ARC – hợp đồng OpenAPI 0.3.13-draft cho v1.0.5** (rounds/round-05/outputs/ARC/contract-0.3.13.md; PR r5-contract-0313): V5-10 máy chủ quy đổi giờ trả theo một luật, CheckoutSummary.checkoutAt dùng chung cho tóm tắt, QR, B18; V5-13 openRefunds[] theo lý do (FD+); V5-14 QuoteInput.nightlyRates, createHoldFromQuote nhận trường giá → 422; V5-15 B18 đơn quá ngày đi chỉ OWN/MGR, checkoutAt + overdueReason; V5-16 lọc action/removalsOnly (phần chặn chờ DOM); V5-18 depositUnverifiedVnd; V5-1A giá đêm bắt buộc (đổi phá vỡ có chủ đích, BUG-R4-057); V5-22 min/max; V5-30 commission.status + listParameters.missing (cấu trúc H2 chờ DOM, không số); V5-44 Problem.lockReason, trigger 0094 → 409; V5-58 getPropertyWifi/setPropertyWifi; V5-62 đề xuất 15:30 cho RPO 12 giờ; V5-63 journald + MaxRetentionSec=90day. Không migration ở các mục đã chốt | ARC | Quyền ARC (hợp đồng API, kiến trúc) |`
