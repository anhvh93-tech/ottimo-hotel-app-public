# BE-B – phản hồi thẻ Round 2, Sprint 3 (bước Phản hồi & sửa)

- Vai: BE (luồng BE-B: folio, payments, inventory/minibar, tham số `payment_receiving_account`) và một phần BE chung (guard) | Ngày: 17/10/2026 | Không commit.
- Đầu vào:
  - `reviews/s3-DOM.md`, `reviews/s3-ARC.md`, `reviews/s3-SEC.md`.
  - `outputs/ARC/s3-contract.md` mục 4.2a và mục 7 (OpenAPI 0.3.6 bổ sung 1 + 2).
  - `br-examples.json`: BR-527-05 đã sửa, BR-527-06 và BR-903-04 mới.
- Chi tiết code, test, lệnh: `outputs/BE/s3-be-b.md` mục 10.
- Migration mới: `0042_money_review_s3_be_b.sql`. Journal idx 28. Snapshot đầu `meta/0053_snapshot.json` sinh lại theo 4.2a-2c, giữ nguyên `id`/`prevId`.
- Kết quả test: DB test tạo mới (`ottimo_test_beb`), toàn bộ api **53 tệp / 2087 test xanh**.

## 1. DOM (s3-DOM.md)

| ID | Trạng thái mới | Phản hồi |
|---|---|---|
| FB-R2-DOM-BE-13 (Blocker) | Done | Đơn `ota_prepaid` có **một** khoản thu hệ thống: `method=ota_collect`, `provider=ota_system`, `type=charge`, `reconciliation=not_required`, người ghi null.<br>• Số tiền = các khoản OTA trả hộ của đơn chính (tiền phòng, phụ thu người, phí OTA giữ: hủy / không đến / trả sớm), sau khi trừ FOC/giảm giá đi kèm. Mỗi lần đồng bộ đêm (`syncStay`, `voidStay`, ghi các loại phí này) sẽ tự điều chỉnh: đảo khoản cũ rồi ghi khoản mới. Audit `payment.ota_collected` / `payment.ota_collect_adjusted`.<br>• `moneyPosition` chỉ dùng tiền OTA để trả các khoản OTA trả hộ. Phần OTA thu dư (`otaExcessVnd`) **không** tính vào `creditVnd`, không thành blocker, không vào luồng hoàn.<br>• Bill `ota_prepaid`: tổng và "đã thu" chỉ tính khoản tại quầy.<br>• Test: dữ liệu thật trên DB (bảy đêm + minibar 70.000 → còn thu 70.000; đồng bộ lại không sinh dòng mới; đổi mô hình thì đảo); thêm unit case Agoda 2 đêm 1.800.000 + 70.000 → 70.000.<br>• BE-A truyền `ConfirmedStay.paymentModel` (đã thêm ở `confirmedStay`). |
| FB-R2-DOM-BE-14 (Blocker) | Done | (a) `FolioService.balance()` trả thêm `unhandledCreditVnd` = `creditVnd` − yêu cầu hoàn đang mở. Trường `creditVnd` của **FolioBalance** cũng mang giá trị này, nên B16 → B18 của BE-A chỉ tạo **một** yêu cầu mà không cần sửa code. `Folio.totals` có `creditVnd`, `unhandledCreditVnd`, `otaExcessVnd` theo hợp đồng. `createRefundRequest` lấy trần = `unhandledCreditVnd`.<br>(b) Khi chi: số tiền phải ≤ min(còn được duyệt, `creditVnd` **hiện tại**), vượt → 422 `REFUND_EXCEEDS_APPROVED` + `max`.<br>(c) Phần thừa sinh từ khoản thu chưa đối soát → 409 `REFUND_SOURCE_NOT_RECONCILED` kèm `paymentIds[]`, `unreconciledVnd`. Khoản `disputed` chỉ tính số thực nhận.<br>(d) Test: yêu cầu thứ hai → `max` 0; phát sinh 70.000 sau khi duyệt → chi tối đa 630.000; chuyển khoản `pending` → 409; tiền mặt nộp thiếu → 409. |
| FB-R2-DOM-BE-15 | Done | `FolioService.tryEarnCommissions` theo S3-3: hoa hồng `earned` ⇔ đơn `checked_out` ∧ còn phải thu = 0 ∧ người nhận hoa hồng không còn khoản thu nào `pending`/`disputed` trên folio.<br>Hàm được gọi ở ba chỗ: B18 (hook `transitioned` B18 của ReservationHooks, đăng ký trong FolioModule), lúc đối soát / xác nhận tiền mặt nộp quầy, và lúc thu nợ sau trả phòng. Bỏ `earnRecorderCommission`.<br>Test theo oracle: BR-527-05 (sau B18 vẫn `projected`, xác nhận → `earned` 156.150), BR-527-06, và dạng BR-903-04. |
| FB-R2-DOM-BE-21 | Done | Mỗi dòng của `FolioLine` (getFolio, Bill) có `labelKey` (`bill.line.*`) và `labelParams`. Bill có `creditVnd`. Cột mới `folio_line.label_params` (0042). Tham số lưu ở cột này được ưu tiên; dòng cũ thì phân tích mô tả hệ thống. Số lượng luôn lấy theo dòng. Phòng in theo đoạn ở (`roomResolver`); tên món hư hỏng lấy từ bảng `damage_catalog`. `description` chỉ còn dùng cho nhật ký. Danh sách khóa cho UXD/FE ở mục 6. |
| FB-R2-DOM-BE-16 | Done (phần folio, BE-A sửa trong `syncStay`) | `syncStay` ghi một dòng `extra_person` mỗi đêm theo `nights[].extraPersonVnd`. BE-B thêm `labelParams {date, count}`. Hai bên đã thống nhất. |
| FB-R2-DOM-BE-24 | Done (nhãn) / BE-A | Bill in `bill.line.overpayment_retained` (dòng `deposit_forfeit`). BE-A cần thêm `charge_code=overpayment_retained` và bằng chứng khách đồng ý (`checkout.service`). |
| FB-R2-DOM-BE-27 | Deferred (Sprint 4, phụ thuộc BE-A) | Muốn chặn `key_card_fee.quantity ≤ cardsIssued − số thẻ đã phạt` thì cần cổng `StayInfo.cardsIssued` của BE-A (BE-B không đọc bảng `reservation`). Khi BE-A thêm trường, BE-B sẽ cài 422 `VALUE_OUT_OF_RANGE` ngay. Hai việc còn lại thuộc BE-A + ARC: `warnings HOUSE_RULES_NOT_SENT` (đổi hợp đồng) và cập nhật `cards_issued` khi đổi phòng. |
| FB-R2-DOM-BE-29 | Done | `mode=stayover` → 422 `NOT_IN_LIST` (field `mode`) cho tới khi làm US-033. |

## 2. ARC (s3-ARC.md)

| ID | Trạng thái mới | Phản hồi |
|---|---|---|
| FB-R2-ARC-BE-S3-01 (Blocker) | Done (BE-A + BE-B) | BE-A tách phụ thu theo từng đêm (`stay_night.extra_person_fee_vnd`, 0031) và `syncStay` giữ dòng của từng đêm. BE-B gắn `labelParams` cho các dòng này. |
| FB-R2-ARC-BE-S3-02 (Blocker) | Done | `depositPaid` có thêm `AND reversal_of_id IS NULL`, cùng quy tắc với `moneyPosition`. Thêm UK `payment_one_reversal_key` (0042). Test: đảo cọc → `depositPaid = 0`; trần QR của đơn giữ chỗ = cọc yêu cầu; đảo lần hai → 409; ghi lại cọc đủ → `confirmed`. |
| FB-R2-ARC-BE-S3-04 | Done (BE chung) | Xem SEC-BE-33. |
| FB-R2-ARC-BE-S3-10 | Done | 0042 tắt RLS đúng mẫu 0016/0018: `NO FORCE` + `DISABLE` → backfill `recorded_by_role` và `reconciled_by_role` → `ENABLE` + `FORCE`.<br>Thêm `CHECK (recorded_by IS NULL OR recorded_by_role IS NOT NULL)`.<br>Người dùng không còn vai ở cơ sở được ghi `collaborator` – snapshot chặt nhất (A46a). |
| FB-R2-ARC-BE-S3-11 | Done | `recordManual` tự lấy vai từ `user_property_role` khi bên gọi không truyền vào. SAL/CTV thì ép `reconciliation=pending`. Test: CTV/SAL ghi qua `recordManual` → `pending` + `sales_staff`, và FD thấy khoản này trong danh sách. |
| FB-R2-ARC-BE-S3-12 | Done | 0042 thêm:<br>• `reconciled_by_role`.<br>• `payment_self_reconciled_fact_check`: `self_reconciled` = (người đối soát là người ghi hoặc người xác nhận).<br>• `payment_self_reconcile_owner_check`.<br>• `payment_reconciled_by_check`: khoản `reconciled`/`disputed` phải có người đối soát và vai.<br>• `cash_handover` dùng `COALESCE`.<br>• `refund_account_check` dùng `IS NOT DISTINCT FROM`.<br>• `approval_request`: REVOKE UPDATE cả bảng, GRANT theo 19 cột (quyết định, leo thang, `refund_*`, `refunded_vnd`).<br>Test: từng CHECK → 23514 đúng tên ràng buộc; `requested_by`/`amount_vnd`/`type` → 42501.<br>Đã sửa test RB-0100…0109 của BE-A (trước đây UPDATE `requested_by`, nay chèn bản sao). |
| FB-R2-ARC-BE-S3-13 | Done | Như DOM BE-14 (c). |
| FB-R2-ARC-BE-S3-14 | Done (tạm) | `adjustFolioLine` với dòng `room`/`extra_person` của đơn còn `hold`/`confirmed`/`in_house` → 422 `NOT_ALLOWED` (field = trường đã gửi). Muốn làm hẳn thì cần cổng `StayNightPricingPort.setNightRate` của BE-A (ghi giá đêm). Có cổng đó thì BE-B gọi trong cùng giao dịch và bỏ chặn. |
| FB-R2-ARC-BE-S3-15 | Done (a, b, c, d) | (a) `payments/public/payment-expiry.ts` (`expirePendingPayments`); J24 chỉ gọi vào.<br>(b) payments đăng ký nguồn "Cần chú ý" `reconcile_overdue` (`payments/public/reconcile-attention.ts`, ngưỡng ≥ N×24 giờ như `listPayments`). Đã bỏ truy vấn nội tuyến ở `events/attention.service.ts`; BE-A đã gộp với sửa SEC-BE-52.<br>(c) `FolioService.hasLiveLinesSince(tx, reservationId, at)` – BE-A dùng ở B17.<br>(d) `ApprovalService.reopenForRedecision` + `addRefunded`. payments không còn ghi trạng thái hay người duyệt của `approval_request`, chỉ ghi các cột `refund_*` (ARC B-4). |
| FB-R2-ARC-BE-S3-16 | Partial – chờ BE-A | Phần BE-B: tra `ATTACHMENT_USAGE` **một lần** rồi nhớ lại; thiếu cổng mà khoản thu có ảnh thì báo lỗi rõ.<br>Chưa tiêm qua constructor được: vòng MoneyBridge → PaymentService chỉ gỡ được khi BE-A tách `ReservationReadPort`. Có cổng đó thì BE-B chuyển token sang `files/public` và tiêm qua constructor trong cùng PR với BE-C. |
| FB-R2-ARC-BE-S3-21 | BE-A làm | Theo prompt của ORC, BE-A viết `schema-parity.test.ts`; BE-B không viết lại (đã nhắn BE-A). BE-B đã theo 4.2a: 0042 kèm snapshot đầu 0053 sinh lại, `drizzle-kit generate` (cấu hình thật) báo "No schema changes". |
| FB-R2-ARC-BE-S3-25 | Done | `payOut` khóa theo thứ tự đơn (`targetOf`) → folio → `approval_request` rồi mới kiểm trạng thái. Minibar khóa folio trước, đọc trạng thái lưu trú sau (cách này chạy được cả cho HK – ngoài phạm vi khóa đơn của bàn lễ tân). |
| FB-R2-ARC-BE-S3-26 | Done (1, 2, 4, 5) / Deferred (3) / ARC (6) | (1) `original_method` ra `cash`/`ota_collect` → 409.<br>(2) UK `payment_one_reversal_key`.<br>(4) `AMOUNT_EXCEEDS_BALANCE`.<br>(5) Có ảnh mà thiếu cổng → báo lỗi.<br>(3) Ghim `type=refund` vào FK cặp cần thêm cột snapshot `approval_type` cho `payment`. Dời Sprint 4; code đã khóa `type='refund'` và test DB đã có `payment_refund_approval_check`.<br>(6) Phần lệch hợp đồng thuộc ARC 0.3.7. |
| FB-R2-ARC-BE-S3-29 (3) | Done | Bỏ `maskAccount` (mã chết). Chỉ còn một kiểu che `maskedAccountNo` dạng `9704••••1234`. Ý (1)(2) thuộc INT. |
| FB-R2-ARC-BE-S3-32 | Done | 0042: GRANT UPDATE theo cột cho `item` và `invoice_request`. Kiểm minibar lại sẽ đảo dòng sống cuối của chuỗi `related_line_id` (dòng đã được `adjustFolioLine` thay thế). Test: kiểm → sửa còn 1 lon → kiểm lại → minibar = 0. |
| Hợp đồng 0.3.6 bổ sung 2 – mục 7.1/7.3 | Done | `REFUND_SOURCE_NOT_RECONCILED`, `unhandledCreditVnd`, `otaExcessVnd`, `x-ota-prepaid-rule`, `labelKey` (gồm `extra_night`), `Bill.creditVnd`, `AMOUNT_EXCEEDS_BALANCE`.<br>`AuditEvent.action` là tập đóng: mọi `recordMoney` của BE-B đều nằm trong danh sách. Đồng bộ đêm trước ghi `folio.charges_posted/charges_resynced` (ngoài danh sách), nay ghi `folio.line_posted` hoặc `folio.line_reversed` kèm `after.sync = confirmed / resynced` – **không cần thêm mã**.<br>Dòng `deposit_forfeit` ra `bill.line.overpayment_retained`. |

## 3. SEC (s3-SEC.md)

| ID | Trạng thái mới | Phản hồi |
|---|---|---|
| FB-R2-SEC-BE-33 | Done (BE chung) | Sửa `auth.guard.ts`:<br>(1) `dryRun:true` trên operation có cờ dryRun → `enforce()` ngay trong guard.<br>(2) `hasCompletedKey` khớp thêm `method` + `path`.<br>(3) Lưới an toàn trong `SerializeInterceptor`: có principal mà quyết định vai chưa áp dụng và không được phép → `guard.enforce()` (403 + `access.denied`). BE-A đánh dấu replay là đã áp dụng trong UoW (ADR-009) nên replay hợp lệ vẫn đi qua.<br>Test `guard-s3.test.ts`: SAL + khóa đã hoàn thành của operation khác + `dryRun` → 403 + đúng 1 `access.denied`. |
| FB-R2-SEC-BE-34 | Done (BE chung) | `checkTrustedDevice`: phiên `staff_pwa` không bao giờ được coi là thiết bị tin cậy; nếu request gửi `Origin` thì phải thuộc `allowedOrigins.admin`. Test: phiên PWA + cookie thiết bị hợp lệ → 403 `DEVICE_NOT_TRUSTED`; phiên admin dùng cùng cookie thì qua. |
| FB-R2-SEC-BE-35 | Done (BE chung; SSE 5 luồng là BE-A) | Mỗi user tối đa 600 request/phút (đếm cả lần mở SSE); vượt → 429 `RATE_LIMITED` + `Retry-After`, mỗi cửa sổ chỉ một sự kiện `security.rate_limited`. Bộ đếm trong bộ nhớ mỗi process, như `RateLimiter` hiện có (R3 chuyển sang PG trước khi chạy nhiều bản).<br>`AuthOptions.staffRequestsPerMinute`: test mặc định 1.000.000 (đồng hồ test cố định nên cửa sổ không bao giờ hết); test riêng chạy với 600 → request thứ 601 bị 429, người khác vẫn 200, sang phút sau lại 200. |
| FB-R2-SEC-BE-36 | Done | Như ARC-02. |
| FB-R2-SEC-BE-37 | Done (1, 2, 4 + quyết định PO 17/10) / ARC + BE-A (3) | (1) Người đặt nơi nhận không được duyệt: code → `SELF_APPROVAL_FORBIDDEN`; DB có CHECK `approval_request_refund_destination_not_approver`.<br>(2) Chi chuyển khoản: người chi ≠ người tạo ≠ người duyệt ≠ người đặt nơi nhận → `SELF_REFUND_FORBIDDEN`.<br>(4) Mỗi lần đặt hoặc đổi nơi nhận → push `refund_destination_changed` tới người tạo + mọi OWN; đổi sau khi duyệt thì yêu cầu về `pending`.<br>**PO 17/10** (decision-log) – OWN, theo vai lúc thao tác, được miễn (1)(2) với hoàn **chuyển khoản**:<br>• OWN được đặt nơi nhận, duyệt và chi cùng một khoản (`approval.service` `assertNotSelf`; `refunds.service` `payOut`). CHECK 0031 được định nghĩa lại trong 0042: cho phép khi `approver_role_snapshot = 'owner'` và `refund_method ≠ cash`. `payment_refund_not_requester_check` cho phép khi `recorded_by_role = 'owner'` và `method ≠ cash`.<br>• Bước chi trên đường "tự làm" của OWN phải có cửa sổ step-up (401 `REAUTH_REQUIRED`); bước duyệt vẫn bắt nhập lại mật khẩu.<br>• Nhật ký `refund.paid` có `after.ownSelfApprovedAndPaid = true` (FE hiện "OWN tự duyệt và chi").<br>• MGR duyệt rồi chi cùng khoản → 403. Hoàn tiền mặt (A47a) không đổi; người duyệt ≠ người tạo (F8) vẫn áp cho mọi người.<br>• Test: OWN đặt nơi nhận + duyệt + chi → 401 khi chưa step-up, 201 khi đã step-up, có cờ nhật ký; MGR duyệt + chi → 403; CHECK DB chặn MGR, cho OWN.<br>(3) `If-Match` cho `approveRequest` và `executeRefund` là đổi hợp đồng → ARC đưa vào 0.3.7 (PO yêu cầu "mỗi bước If-Match"). |
| FB-R2-SEC-BE-39 | Done bởi BE-A | Job `idempotency.purge` (builtin-jobs). |
| FB-R2-SEC-BE-42 | Done | Như ARC-12. Test: UPDATE `self_reconciled=true` → 23514 (fact); người ghi tự đối soát mà không phải OWN → 23514 (owner). |
| FB-R2-SEC-BE-43 | Done (1) / ARC (2) | (1) `createVietQr`: bảng idempotency chỉ lưu `{paymentId, expiredPaymentIds}`. Phản hồi (cả lần đầu và replay) dựng lại trong giao dịch chỉ đọc, từ khoản thu và tài khoản nhận **đang hiệu lực**, nên không còn trả QR cũ. Test: đổi tài khoản từ ngày mai → replay ngày mai có số tài khoản mới; `response_body` không chứa số tài khoản.<br>(2) Thêm `Idempotency-Key` cho `setParameter` của các khóa `x-reauth-parameters` là việc của ARC (hợp đồng). |
| FB-R2-SEC-BE-44 | Done | `stripControlChars` dùng chung (C0/C1, zero-width, bidi), áp vào `requireReason` và `optionalText`. Kiểm Luhn cho:<br>• `addFolioLine.description` – bỏ ký tự điều khiển + Luhn.<br>• `accountHolder` của nơi nhận hoàn.<br>• `bankReference` – từ chối dãy 13–19 số hợp Luhn.<br>• `accountName` của tài khoản nhận.<br>`confirmPaymentReceived`: `receivedAt ≥ lúc tạo khoản thu`; FD+ nhập bù > 24 giờ phải có ghi chú; SAL bị giới hạn bởi `staff_payment_backdate_max_hours`.<br>Test: mô tả có số thẻ → 422 `CARD_NUMBER_DETECTED`, ký tự điều khiển bị bỏ; tên tài khoản có số thẻ → 422. |
| FB-R2-SEC-BE-45 | Done | `original_method` ra `cash` → 409 `INVALID_TRANSITION` (`currentState: cash`). Yêu cầu bị `rejected`/`cancelled` → hủy DEK, đặt `refund_account_enc = NULL`, ghi `c3_access_log purge`. Test cả hai ca. |

## 4. Ngoài thẻ – lỗi QA BUG-R2-051 (thấy trong `tests/e2e/api/stay-checkout.s3.api.spec.ts`)

`recordPayment` cho cọc của đơn **giữ chỗ**: trước đây trần = còn phải thu của folio, mà folio giữ chỗ chưa có dòng nên trần = 0 → SAL bị 422 `max 0`. Nay trần = cọc còn thiếu (BR-305), cùng quy tắc với `createVietQr`. QA có thể bỏ `test.fail`.

## 5. Việc cho vai khác

- **BE-A**:
  - E05-11: đặt `ConfirmedStay.nights[].extraNight = true` cho đêm thêm lúc trả phòng → dòng `room` có `charge_code=extra_night` → `bill.line.extra_night`.
  - `CheckoutSummary.creditVnd` lấy `FolioBalance.rawCreditVnd`; `unhandledCreditVnd` lấy trường cùng tên.
  - Truyền `labelParams` khi `postLines` (`late_checkout {time,pct}`, `early_checkin`, `room_change {from,to}`, `early_departure_fee {pct,nights,noticeDays}`, `deposit_forfeit` + `charge_code=overpayment_retained`).
  - Tách `ReservationReadPort` (ARC-16).
  - Thêm `StayInfo.cardsIssued` (DOM-27).
  - Viết `schema-parity.test.ts` (ARC-21) – snapshot đầu đã gồm 0042.
- **ARC**:
  - ERD 4.6: cột `folio_line.label_params`, `payment.reconciled_by_role`; các CHECK mới; UK `payment_one_reversal_key`; GRANT theo cột của `approval_request`/`item`/`invoice_request`.
  - 0.3.7: `If-Match` cho `approveRequest` loại refund (SEC-37 (3)); `Idempotency-Key` cho `setParameter` có re-auth (SEC-43 (2)); FK ghim `type=refund` (ARC-26 (3)).
- **FE/UXD**: hiển thị theo `labelKey` (danh sách ở mục 6). `REFUND_SOURCE_NOT_RECONCILED` có `paymentIds[]` + `unreconciledVnd`, dùng để khóa nút chi với chú thích "Chờ đối soát khoản thu …".
- **QA**: có thể dùng các ca mới trong `payments-s3.test.ts` (OTA trả trước, B16→B18, tiền mặt nộp thiếu, hoa hồng S3-3, CHECK 0042) làm oracle cho E2E.
- **DOM/PO**: câu hỏi SEC-37 ở mục 3.

## 6. Danh sách `labelKey` (đóng theo khóa) – cho UXD/FE

| Khóa | Tham số |
|---|---|
| `bill.line.room_night` | `{date, room}` |
| `bill.line.extra_night` | `{date, room}` |
| `bill.line.extra_person` | `{date, count}` |
| `bill.line.early_checkin` | `{time, pct}` |
| `bill.line.late_checkout` | `{time, pct}` |
| `bill.line.early_departure_fee` | `{pct?, nights?, noticeDays?}` |
| `bill.line.overpayment_retained` | – |
| `bill.line.room_change` | `{from, to}` |
| `bill.line.minibar` | `{item, qty}` |
| `bill.line.cancellation_fee` | – |
| `bill.line.no_show_fee` | – |
| `bill.line.foc` | `{reason}` |
| `bill.line.discount` | `{reason}` |
| `bill.line.laundry` | `{qty}` |
| `bill.line.adhoc_cleaning` | `{qty}` |
| `bill.line.smoking_fee` | – |
| `bill.line.key_card_fee` | `{qty}` |
| `bill.line.damage` | `{item, qty}` |
| `bill.line.fnb` | `{text, qty}` |
| `bill.line.service_fee` | `{text, qty}` |
| `bill.line.utilities` | – |
| `bill.line.adjustment` | – |

## 7. Giả định đã dùng

1. Phần OTA thu dư (`otaExcessVnd`) = tiền `ota_collect` − các khoản OTA trả hộ của **chính** các đơn có `ota_collect` (đơn con kênh Trực tiếp không tính). Dữ liệu cũ thiếu `reservation_id` thì giữ cách cũ (tiền OTA trả cả folio).
2. Trong `FolioBalance`, trường `creditVnd` = `unhandledCreditVnd`, để mọi bên đang gọi (B16, B18, hủy đơn) tự tránh hoàn trùng. Giá trị `creditVnd` theo hợp đồng nằm ở `rawCreditVnd`.
3. Backfill 0042: người dùng không còn vai ở cơ sở → `recorded_by_role = 'collaborator'` (snapshot chặt nhất); người đối soát không còn vai → `front_desk`; dòng `self_reconciled` → `owner`.
4. ARC-14 tạm thời: chặn sửa dòng của đơn `hold`/`confirmed`/`in_house`. Sau `checked_out` (folio `settled`, chỉ MGR+) thì vẫn sửa được vì không còn đồng bộ đêm.
5. Giới hạn 600 request/phút đặt trong guard, đếm theo user và theo từng process (như `RateLimiter` của Sprint 1–2).
6. Mỗi lần đồng bộ đêm ghi **một** dòng nhật ký tiền: `folio.line_posted` khi có ghi dòng mới, `folio.line_reversed` khi chỉ có đảo.
7. PO 17/10: OWN được miễn cả "người chi ≠ người tạo" với hoàn chuyển khoản (mục (2) của quyết định gồm cả người tạo). "Người duyệt ≠ người tạo" (SEC F8) không nằm trong (1)(2) nên vẫn áp cho OWN. "Xác thực lại ở mỗi bước": bước chi dùng cửa sổ step-up sẵn có (`/v1/me/step-up`) cho tới khi hợp đồng 0.3.7 có `If-Match` + re-auth trong body.

## 8. Kiểm chéo đối kháng Blocker 17/10 (`reviews/s3-blocker-verification.md`, checkpoint `e3959ec`)

| ID | Trạng thái mới | Phản hồi |
|---|---|---|
| FB-R2-DOM-BE-13 (mở lại, Blocker) | Done | (1) `syncOtaCollect` chỉ xét khoản `ota_collect` **của chính đơn** (lọc thêm `reservation_id`). Đơn con kênh Trực tiếp (B13, B9a, E05-11) cùng folio không còn đảo khoản của đơn cha.<br>(2) Theo DOM 17/10: bỏ `extra_person` khỏi `OTA_COVERED`. "Đã thu qua OTA" chỉ gồm tiền phòng OTA đã thu và các phí OTA giữ; phụ thu người vượt max(chuẩn căn, số khách OTA) thu tại quầy.<br>(3) Bill không còn lấy `otaNet` làm số dự phòng: không có khoản `ota_collect` thì không ẩn dòng nào và không in "Đã thu qua OTA".<br>(4) Test đầu-cuối mới `ota-prepaid-flow.test.ts`, đi từ POST /reservations kênh Agoda:<br>• B13 gia hạn → B18 chỉ thu đêm của đơn con; bill in "Đã thu qua Agoda 1.800.000".<br>• B9a đêm trước → thêm người thứ 3 (phòng chuẩn 2) → phụ thu thu tại quầy, khoản OTA giữ nguyên → B18 kèm E05-11 → số dư 0, đủ dòng `extra_night`.<br>Đã thử đổi lại truy vấn cũ: 2 ca này đỏ. |
| DOM 17/10 (b) – phụ thu người của đơn OTA | Đã đối chiếu (code BE-A) | `nightFee` của BE-A tính phụ thu = phí(số người thực tế) − phí(số khách OTA), sau khi trừ chuẩn căn. Kết quả đúng quy tắc max(chuẩn căn, số khách OTA): phòng 302 (chuẩn 3) thêm người thứ 3 → 0; phòng 201 (chuẩn 2) → 150.000/đêm. Bộ đồ dùng BR-812 (oracle BR-812-07) là phần BE-A. |
| FB-R2-VER-BE-S3-01 (Major mới) – B10 tạo yêu cầu hoàn trùng | Done | `cancellationQuote`: số được đề nghị hoàn = min(chính sách BR-308/309, cọc còn giữ − yêu cầu hoàn đang mở). Thêm `MoneyBridge.openRefunds` gọi `FolioService.openRefundVnd`. Đây là tệp của BE-A, đã nhắn BE-A. Test: có yêu cầu 500.000 đang mở → bản tính thử khi hủy giảm đúng 500.000, tổng các yêu cầu = 500.000 + phần hoàn khi hủy. |
| FB-R2-VER-BE-S3-02 (Major mới) – cọc tính cả tiền đã hoàn; hoàn khi đơn còn giữ chỗ | Done | `depositPaid` = min(tổng cọc, tiền của khách còn giữ = cọc + thu tại quầy − đã hoàn). Không tính dòng đảo, không tính `ota_collect`. Không cho tạo yêu cầu hoàn tay khi đơn đang `hold` → 409 `INVALID_TRANSITION` (`currentState: hold`); tiền của đơn giữ chỗ được trả qua B5 hoặc dùng để xác nhận đơn qua B4. |
| FB-R2-VER-BE-S3-03 (Major mới) – đơn giữ chỗ có khoản thu ghi nhầm loại `charge` | Done | Đơn `hold` chỉ nhận khoản `deposit`: `recordPayment` loại khác → 422 `type: NOT_IN_LIST`; `createVietQr` với `purpose` khác `deposit` → 422 `purpose: NOT_IN_LIST`. Nhờ đó J1 và B4 đếm đúng tiền đã nhận.<br>Sửa thêm sau CI 38985674779 (TC-L4-063): SAL/CTV ghi khoản không phải cọc → 403 `FORBIDDEN_ACTION` (phạm vi A33 `own_deposit_only`, kiểm vai trước – BUG-R2-005) trước luật 422 của đơn giữ chỗ; FD+ vẫn nhận 422. Có test. |
| FB-R2-VER-BE-S3-04 (Major mới) – thiếu test | Done | B16 → B18 qua endpoint thật → đúng 1 yêu cầu hoàn, tóm tắt trả phòng không còn `credit_balance` (`ota-prepaid-flow.test.ts`). J1 với cọc đã đảo → đơn bị hủy; đơn đã đảo rồi ghi lại 50.000 → vẫn giữ (`payments-s3` "Verification 17/10"). |
| FB-R2-VER-BE-S3-05 (Minor) – `confirmDeposit` nhận id của dòng đảo | Done | `existingPaymentId` phải là khoản thu không phải dòng đảo (`reversal_of_id IS NULL`); dòng đảo → 422 `existingPaymentId: NOT_IN_LIST`. Có test. |
| Đơn OTA trả trước tạo trước 0042 (Minor) | Deferred | Chưa có dữ liệu thật. Lần đồng bộ đêm kế tiếp sẽ tự ghi khoản `ota_collect` cho đơn đó. Nếu cần backfill trước khi staging nhận dữ liệu thì làm migration trong dải 0043–0049. |

Kết quả (DB `ottimo_test_beb` tạo lại):
- format:check, lint + typecheck (12/12), build (6/6): xanh.
- test toàn repo xanh: turbo 12/12; api 56 tệp / 2.142 ca.
- `drizzle-kit generate`: không có thay đổi. Đợt này không thêm migration.
