# BE-B – Round 2, Sprint 3: folio/bill, thu tiền, VietQR, đối soát, tiền mặt nộp quầy, hoàn tiền, minibar, tài khoản nhận

- Vai: BE (luồng BE-B) | Ngày: 16/10/2026 | Bước: Sản xuất | **Không commit** (ORC commit)
- Đầu vào: `outputs/ARC/s3-contract.md` (vùng BE-B, cổng 4.3, quy tắc migration 4.2), `outputs/SEC/s3-checklist.md` (A, F), `specs/EP03-05-stay.md` v0.2 mục 2, 3, 5.2–5.4, OpenAPI **0.3.6-draft**, BR v0.3.3 (BR-521/522/527, oracle BR-522-01, BR-527-01/05, BR-434-01, BR-507-01, BR-511-02, BR-702-01), decision-log 16/10 (PO Q-S3-1, ESC-017 A).
- Làm song song BE-A (frontdesk, events) và BE-C (crypto, files) trên cùng thư mục; DB test riêng `ottimo_test_beb` (tạo lại sạch, mô hình 4 vai).

## 1. Operation / trạng thái

| Operation | Trạng thái | Điểm chính |
|---|---|---|
| `getFolio` | Xong (mở rộng) | `totals.creditVnd` (A-34), `balanceDueVnd` không âm; giao dịch đảo không tính; `invoiceRequest`; Payment có `recordedByRole`, `reconciledByName`, `confirmedByName`, `approvalRequestId` |
| `addFolioLine` (A30) | Xong | Danh mục từ tham số (`PRICE_NOT_EDITABLE`), F&B/dịch vụ nhập giá; phạt/hư hỏng cần ảnh hoặc ghi chú ≥ 3 (`EVIDENCE_REQUIRED`, ảnh qua cổng `ATTACHMENT_USAGE` purpose `penalty_evidence`); giặt ủi 1 chữ số thập phân; `serviceDate` trong kỳ ở; hư hỏng ngoài bảng → `pending_approval` + `damage_pricing` (hook duyệt → `posted`/`rejected`); folio `settled` chỉ trong `post_checkout_window_until` (dòng `post_checkout`) |
| `adjustFolioLine` (A31/A32) | Xong | `If-Match` = `Folio.version`; bút toán đảo + dòng mới có `reason`; folio `settled` → FD/FDL 403; dòng phòng FD/FDL chỉ trong sàn–trần BR-105 (theo giá dòng – giả định) |
| `requestFoc` | Giữ S2 | Không đổi |
| `getChargeCatalog` | Xong | `adhoc_cleaning_fee`, `laundry`, `smoking_fee`, `key_card_fee`, `damage.<code>` (tham số mới `damage_catalog`), `fnb`, `service_fee` |
| `getBill` | Xong | G-12 (cặp gốc/đảo không in), FOC ngay dưới dòng gốc (BR-434), G-13 `ota_prepaid` ẩn tiền phòng + `otaPrepaidNote`/`otaPrepaidVnd`, `refunds[]`/`refundedVnd`, `locale` vi_en theo quốc tịch/ngôn ngữ người đứng tên + `usdReference` (BR-004), `vietqrTransferContent` (mã đơn → số bill sau trả phòng) |
| `setInvoiceRequest` | Xong (mức R2) | Bảng `invoice_request`; V-04 `TAX_CODE_INVALID`, V-03 `EMAIL_INVALID`; `retail` → NOT_IN_LIST; `einvoiceStatus=not_requested` (MISA R3) |
| `recordPayment` (A33) | Xong | = `PaymentPort.recordInTx`; `refund` → 422 NOT_IN_LIST; SAL chỉ cọc đơn mình, vượt còn phải thu → 422; FD+ thu dư cần `note`; nhập lùi > 24 h cần `note`, không trước lúc tạo đơn; SAL/CTV luôn `pending`; snapshot `recorded_by_role`; ảnh biên nhận (A-17 bỏ chặn) |
| `listPayments` | Xong | Mặc định `pending`; FD/FDL `own_or_cash_handover` (khoản của mình **hoặc** tiền mặt SAL/CTV chờ nộp – E15-04), SAL `own`; lọc `recordedByRole`, `method`, `status`, ngày nghiệp vụ ≤ 92 ngày (`DATE_RANGE_TOO_LONG`); `pendingDays`, `reconcileOverdue` (≥ `bank_reconcile_alert_days` × 24 h – oracle BR-527-01), `hasAttachment`; con trỏ |
| `confirmPaymentReceived` | Xong | VietQR `pending` chưa hết hạn → `succeeded` + `reconciliation=pending`, `confirmedBy`; hết hạn → 409 `currentState=expired` |
| `reconcilePayment` (A46) | Xong | MGR+; người ghi/người xác nhận → 403 `SELF_RECONCILE_FORBIDDEN` (OWN được, cờ `self_reconciled` + audit); `If-Match`; `disputed` bắt buộc ghi chú + push `payment_disputed` OWN/MGR (trừ người ghi), không tự đảo |
| `confirmCashHandover` (A46a) | Xong | FD+; chỉ `cash` + SAL/CTV + `pending`; người ghi → 403 (kể cả OWN); `short` → `disputed` + `receivedAmountVnd` + ghi chú; `received` → hoa hồng người ghi `earned` (oracle BR-527-05) |
| `reversePayment` (A34) | Xong | MGR+, lý do; dòng đảo âm `reversal_of_id`, gốc `reversed`; đảo khoản hoàn trả lại `refunded_vnd` |
| `createVietQr` | Xong | SEC F1: trần = còn phải thu (giữ chỗ: cọc còn thiếu) → `AMOUNT_EXCEEDS_BALANCE` + `max`; `overBalanceReason` chỉ FD+ (SAL 403); nội dung = mã đơn/số bill chuẩn hóa; payload EMVCo dùng bộ dựng của INT (`@ottimo/integrations/payment`); 1 QR chờ/folio (`expiredPaymentIds`); hết hạn = mốc đổi ngày nghiệp vụ kế tiếp; `receivingAccountMasked/ChangedAt/RecentlyChanged` (SEC F3); chưa cấu hình → 409 `PAYMENT_NOT_CONFIGURED` |
| `confirmDeposit` (B-29) | Xong (mở rộng) | `acceptShortfallReason` chỉ MGR+ (FD/FDL/SAL → 403 trước khi đọc gì), đã thu > 0 → `confirmed` + cột `reservation.deposit_shortfall_*`, audit `deposit.shortfall_accepted` (`shortfallVnd`), push `deposit_shortfall_accepted` OWN; ảnh biên nhận cọc nhận được; `createDepositNotice.attachmentId` nhận được |
| `createRefundRequest` (A43) | Xong | Folio `open`, ≤ `creditVnd` − yêu cầu hoàn đang mở → `REFUND_EXCEEDS_APPROVED`; `ApprovalService.submit(type=refund, reasonCode=overpayment)` – không bao giờ tự áp |
| `setRefundDestination` (A43) | Xong | Thiết bị được cấp (guard); `cash`/`bank_transfer`/`original_method`; Luhn → `CARD_NUMBER_DETECTED`; số TK + tên mã hóa DEK riêng qua `REFUND_ACCOUNT_CIPHER` (BE-C CryptoService), chỉ lưu 4 số cuối đọc được; đổi sau duyệt → `pending` (+ push duyệt lại); `c3_access_log` create/update; `no-store` |
| `getRefundDestination` (A47) | Xong | Thiết bị + step-up (BE-C `C3AccessGate.assertStepUp`, 401 `REAUTH_REQUIRED`) → log `view` trước khi trả (gate: SR-RL-06, 503 khi không ghi được log) → giải mã; `no-store` |
| `executeCashRefund` (A47a) | Xong | Nơi nhận `cash` (khác → 409); người tạo yêu cầu → 403 `SELF_REFUND_FORBIDDEN`; ≤ duyệt − đã chi và ≤ đã thu − đã hoàn; biên nhận `refund_proof` bắt buộc; `not_required` (ca R3) |
| `executeRefund` (A47) | Xong | OWN/MGR, nơi nhận `bank_transfer`/`original_method`; `bankReference` + ảnh bắt buộc khi chuyển khoản (POS: mã); `reconciliation=pending` (đối soát bởi người khác người chi); chi đủ → hủy DEK + `c3_access_log purge` (T09) |
| `recordMinibarCheck` (A37) | Xong | Module `inventory` mới; đủ món tủ chuẩn (`MINIBAR_ITEMS_INCOMPLETE`), ≤ chuẩn (`MINIBAR_QTY_OVER_STANDARD`), ngoài tủ `NOT_IN_LIST`; mỗi món tính tiền dùng > 0 → 1 dòng `minibar`; kiểm lại `checkout` thay bản cũ (đảo dòng, `replacesCheckId`); HK phạm vi "today" (đang ở; kiểm trả phòng chỉ ngày đi), HK không thấy tiền |
| `getMinibarStandard` | Xong | Món + `latestCheck` (bản `checkout` sống trong ngày nghiệp vụ) |
| `setParameter` (`payment_receiving_account`) | Xong | Chỉ OWN (MGR 403 trước khi hỏi mật khẩu, có `access.denied`), `reauth` bắt buộc (`REQUIRED`/401 `REAUTH_FAILED`, bộ đếm chung PasswordReauth), audit `money` số che, push `receiving_account_changed` mọi OWN/MGR; `listParameters`/history chỉ trả `accountNoMasked`; `accountNo`/`accountHolder` thêm vào `SECRET_BODY_FIELDS` (không vào hash idempotency, log) |
| `quote-copy.ts` | Sinh lại | 5 chuỗi RU của UXD đã có (BUG-R2-027/PO-S2-01) – `QUOTE_COPY_MISSING` rỗng; `--check` xanh |

## 2. Cổng cho BE-A (ARC 4.3 – đã cài thật, không phải bản giả)
`folio/public/folio.service.ts` (`FolioService`, kiểu xuất cùng file):
- `postLines(tx, folioId, lines: FolioLineInput[], actor: FolioActor, opts?: { allowPostCheckout?: boolean }): Promise<string[]>` – khóa folio, `open` (hoặc trong cửa sổ sau trả phòng khi cho phép), mỗi dòng audit `folio.line_posted`.
- `reverseLine(tx, lineId, reason, actor, opts?: { allowSettled?: boolean }): Promise<{ reversalId, reversedVnd, folioId }>` – đảo dòng + FOC/giảm giá đã áp lên nó (G-10).
- `balance(tx, folioId): Promise<{ totalVnd, paidVnd, refundedVnd, balanceDueVnd, creditVnd }>` (A-34 blocker `credit_balance`).
- `settle(tx, folioId, actor): Promise<{ billNo, settledAt, postCheckoutWindowUntil }>` – số `F{yy}-`, cửa sổ `post_checkout_charge_hours`, audit `folio.settled`.
- `lockForPosting`, `folioOfReservation` (tiện ích).
`payments/public/payment.service.ts` (`PaymentService`):
- `recordInTx(tx, actor: {userId, roles, requestId?}, folioId, raw: PaymentCreateInput, ctx: {reservationId, reservationCode, channelGroup?, reservationCreatedAt?, fieldPrefix?}): Promise<PaymentRowLite>` – đúng quy tắc `recordPayment`; `fieldPrefix: 'finalPayment.'` cho `checkOut`.

## 3. Migration (dải 0040–0049, viết tay, không snapshot mới – ARC 4.2)
- **0040_money_s3_be_b**: `folio_line` + `room_change_difference`, `charge_code`, `reason`, `note`, `evidence_attachment_ids`, `post_checkout`, UK một dòng đảo/dòng; `payment` + `recorded_by_role` (backfill), `approval_requested_by`, `self_reconciled`, `received_amount_vnd`, `over_balance_reason`, `bank_reference`, CHECK `payment_refund_approval_check`, `payment_refund_not_requester_check`, `payment_reconcile_separation_check`, `payment_cash_handover_not_self_check`, FK cặp → `approval_request(property_id, id, requested_by)`; `approval_request` + `refund_method/bank_bin/account_last4/account_key_id/destination_set_at/_by`, `refunded_vnd`, CHECK `approval_request_refund_no_self_approval`; `reservation.deposit_shortfall_*` + CHECK; bảng `invoice_request` (RLS); `c3_access_log.subject_type` + `refund_account`; GRANT cột mới (K8); catalogue `payment_receiving_account` (OWN), `damage_catalog`.
- **0041_inventory_minibar_be_b**: `item`, `minibar_check` (UK một bản `checkout` sống/đơn, FK `replaced_by` DEFERRABLE), `minibar_check_line` (`used_qty` generated, giá/giá vốn snapshot), RLS + GRANT (dòng kiểm chỉ INSERT).
- `_journal.json`: nối 2 entry cuối mảng, `when = Date.now()` (lớn hơn entry trước), `idx` = vị trí. (Sau đó BE-A/BE-C nối thêm 0030, 0050–0052 – BE-C chưa đặt `when` lúc tôi kiểm.)
- Schema `.ts` sửa khớp SQL: `folio.ts`, `inventory.ts` (mới), `approvals.ts`, `reservations.ts`, `audit.ts`, `index.ts`.
- Kiểm lệch drizzle (không `generate` vào repo): chạy `drizzle-kit generate` với `out` là **bản sao** thư mục migration ở scratch → phần BE-B trong SQL sinh ra trùng khớp 0040/0041 (bảng, cột, CHECK, FK, index); khác duy nhất: `DEFERRABLE` của `minibar_check_replaced_by_fk` (drizzle không biểu diễn được) và RLS/GRANT (không thuộc drizzle). Snapshot gộp cuối sprint do BE-A (4.2-8).
- DS-E loader: nạp `minibarItems` + `consumableItems` vào `item`, `damage_catalog` từ `feeCatalog` BR-512 (bỏ khỏi danh sách "skipped").

## 4. Test (PostgreSQL 17 thật, `ottimo_test_beb`, vai `ottimo_app`)
| File | Ca | Nội dung |
|---|---|---|
| `test/be-b-s3-units.test.ts` | 10 | CRC-16 (vector `123456789` → `29B1`), payload VietQR (TLV, CRC), từ chối nội dung/số tiền không do server tính, BR-521 nội dung; tài khoản nhận (kiểm, che, `withoutSecrets`); tổng folio credit/hoàn/đảo (BR-522-01); dòng bill G-12 + BR-434-01; `primaryRole`; oracle BR-527-01 |
| `test/integration/payments-s3.test.ts` | 19 | Toàn bộ mục 1 end-to-end với module reservations/approvals (BE-A), crypto/files (BE-C) thật: idempotency 1 bản ghi + audit `money` cùng `request_id`; oracle **BR-521-01**, **BR-527-05** (sale tự xác nhận → 403; FD ca chiều → `reconciled`, hoa hồng `earned`), **BR-527-01**, **BR-522-01** (4 lần thử: `paid`, `rejected_self_requested`, `rejected_transfer_manager_only`, `rejected_over_approved`; số dư 0), **BR-511-02** (700.000), **BR-507-01** (75.000), **BR-434-01** (net 0), **BR-702-01** (100.000); tách nhiệm: tự đối soát 403, OWN tự đối soát có cờ, tự xác nhận tiền mặt, tự chi hoàn 403, MGR tự duyệt hoàn 403; **CHECK DB**: UPDATE `reconciled_by = recorded_by` → 23514, `self_reconciled` trên tiền mặt SAL → 23514, INSERT hoàn do chính người tạo → 23514; C3: không thiết bị → 403, Luhn, chỉ 4 số cuối, đổi sau duyệt → `pending`, không step-up → 401, log `create/update/view/purge`, `no-store`, số TK không có trong `idempotency_key`; tài khoản nhận: MGR 403, thiếu/sai `reauth`, audit che, push đúng 4 OWN/MGR; VietQR: trần, `overBalanceReason` SAL 403, 1 QR chờ, hết hạn 409; B-29; settle + cửa sổ sau trả phòng + `FOLIO_LOCKED`; minibar HK/FD, kiểm lại đảo dòng |
| `test/integration/rbac-sprint3-beb.test.ts` | 221 | 220 ca `rbac-cases.json` của 20 operation (2xx/403/401; C3 có cookie thiết bị + cửa sổ step-up) + 1 ca phủ đủ |
| Sửa test S2 | – | `folio-payments` (`creditVnd`, ảnh biên nhận nhận được), `be-b-s2-units`, `seed.test` (+ `damage_catalog`, `items`) |

## 5. Kết quả lệnh (16/10/2026, Node 22.23.3, pnpm 9.15.4, PostgreSQL 17.11)
| Lệnh | Kết quả |
|---|---|
| Bộ test BE-B (12 file: 3 file S3 + folio-payments, sales, seed, platform, rbac S1/S2, architecture, rls, review-fixes, redact) | **810/810 xanh** |
| `vitest run` toàn bộ `@ottimo/api` | 1.737 xanh / 11 đỏ – **không ca nào của BE-B**: `registration-flow` (7, BE-C), `contract` (chuỗi `__test__` trong `registration/public/worker-jobs.ts`, BE-C), `role-gate-first` (`setGuestLocale` 401, BE-C), `frontdesk-stay` BR-417-02 (BE-A), `zz-debug-bec` (tệp debug BE-C) |
| `pnpm -s test` (turbo) | Đỏ do api (như trên) + `@ottimo/guest-web` 1 ca (RU fallback – chuỗi RU UXD vừa thêm, MOB); integrations 114, ui 10, api-client 14, i18n 3, mobile 1 xanh |
| `pnpm -s lint` | eslint **0 lỗi** (2 cảnh báo cũ `mockServiceWorker.js`); `typecheck` đỏ chỉ ở test BE-C (`registration-flow`, `crypto-envelope`, `guest-portal`) – `tsc` mã nguồn 0 lỗi |
| `pnpm -s format:check` | Đỏ 29 tệp, **không tệp nào của BE-B** (crypto/files/registration/guest-portal của BE-C, `main.ts`, `auth.guard.ts`, `tmp-bea`) |
| `pnpm -s build` | **Xanh** 6/6 |
| `node scripts/gen-openapi-meta.mjs --check` | up to date |
| `node scripts/gen-quote-copy.mjs --check` | up to date (đã sinh lại) |
| Kiểm lệch drizzle (bản sao) | Khớp phần BE-B (mục 3) |

## 6. Sửa ngoài vùng (tối thiểu, chỉ thêm) – báo chủ sở hữu
| Tệp | Chủ | Nội dung | Lý do |
|---|---|---|---|
| `approvals/public/approval.service.ts` | BE-A | `refund` không bao giờ tự áp (`maySelfApply`, `selfApplication`); người tạo yêu cầu `refund` duyệt → 403 `SELF_APPROVAL_FORBIDDEN` (kể cả OWN/MGR) | SEC F8 + CHECK 0040 (không có sửa này MGR tạo yêu cầu hoàn sẽ tự áp → lỗi CHECK 500) |
| `audit/public/audit.service.ts`, `db/schema/audit.ts` | BE-A | `C3AccessEntry.subjectType` + `refund_account` | erd 0.3.6 |
| `shared/secret-fields.ts` | chung | + `accountNo`, `accountHolder` | SEC F3/F8: số TK không vào hash idempotency/log |
| `db/schema/approvals.ts`, `reservations.ts` | BE-A | cột 0040 (ARC giao BE-B) | 4.2 |
| `feature-modules.ts`, `schema/index.ts` | chung | thêm `InventoryModule`, `inventory` | 4.1 |

**Sự cố đã xử lý**: `PaymentService` (BE-B) tiêm `ATTACHMENT_USAGE` (BE-C `AttachmentService` → reservations port → `MoneyBridge` → `PaymentService`) tạo **vòng phụ thuộc DI làm app treo khi khởi động** (mọi test integration timeout ~22:37). Đã sửa: `PaymentService` lấy cổng lúc gọi qua `ModuleRef` (không tiêm lúc dựng). BE-A đang để đoạn tạm `TMP-BEA-CYCLE` (bật bằng `BEA_TMP_CYCLE_BREAK`) trong `test/helpers/feature-app.ts` – **nên gỡ**. Cổng giả của tôi (`UnverifiedAttachmentUsage`, `EphemeralRefundCipher`) và `stepUp` riêng đã **gỡ** vì BE-C đã bind `ATTACHMENT_USAGE`, `REFUND_ACCOUNT_CIPHER` và có `StepUpController`/`C3AccessGate`.

## 7. Việc cho vai khác / còn mở
| # | Gửi | Nội dung |
|---|---|---|
| S3-B1 | BE-A / ARC | Duyệt `refund` đi qua `foc_limits`: MGR `perTime = one_night_rate` mà yêu cầu hoàn không có `limitBasisVnd` → luôn lên OWN (test dùng OWN duyệt). BR-522 "MGR/OWN duyệt" → đề nghị `refund` chỉ giới hạn theo vai (không theo hạn mức FOC) |
| S3-B2 | BE-A | `listApprovalRequests`/`approveRequest` chưa trả `refundDestination` (che) + `refundedVnd` – BE-B có `RefundsService.dto()` dùng lại được |
| S3-B3 | BE-A | **Đã xong (mục 9)**: minibar, `listPayments` và phản hồi Payment dùng `RESERVATION_SALES_PORT.stayInfo()` – không còn đọc bảng `reservation` |
| S3-B4 | BE-A | **Đã xong (mục 9)**: `FD_MINIBAR_PORT` gắn bản thật (inventory) – blocker `minibar_not_checked` và việc `minibar_refill` của B18 hoạt động |
| S3-B5 | OPS/BE-A | Job J24 `payment.expire` chưa có (QR hết hạn vẫn bị chặn tại chỗ khi xác nhận) |
| S3-B6 | DOM | Xác nhận "hoa hồng `earned` khi khoản do SAL/CTV ghi đã đối soát" (oracle BR-527-05) với BR-903 "đạt khi thu đủ lúc trả phòng" |
| S3-B7 | FE | `adjustFolioLine` `If-Match` = ETag của `getFolio`/`addFolioLine`; `createVietQr.receivingAccountChangedAt` là instant có offset; minibar HK không có `amountVnd/totalVnd` |
| S3-B8 | QA | Ca mới ở mục 4; oracle đã dùng: BR-521-01, BR-522-01, BR-527-01/04/05, BR-434-01, BR-507-01, BR-511-02, BR-702-01, BR-004-01 |
| Còn lại | – | Ca (shift) chưa có ở R2 → `shiftId = null`, `SHIFT_NOT_OPEN` R3; MISA phát hành R3; refund qua cổng VNPay/MoMo R3 (`original_method` chỉ ghi nhận) |

## 8. Giả định
- `adjustFolioLine` giá phòng của FD/FDL: sàn–trần BR-105 tính trên **giá của dòng** (chưa có giá OTA nền theo nhóm ở folio) – MGR+ không giới hạn.
- `createVietQr` khi đơn `hold`: trần = cọc còn thiếu (BR-305); khác: còn phải thu; `purpose` mặc định theo trạng thái đơn.
- Nội dung VietQR sau trả phòng = số bill; folio `closed` → `FOLIO_LOCKED`.
- `executeRefund` `original_method` = phương thức của khoản thu gần nhất của folio; POS/chuyển khoản cần `bankReference`.
- Hoàn tiền mặt: chưa có ca (R2) → `shiftId = null`.
- `recordPayment` lên folio đơn `hold`: không có dòng phí → trần 0, FD+ phải ghi chú (cọc của giữ chỗ đi qua `confirmDeposit`).
- Tên khoản danh mục là nhãn tiếng Việt cố định (chưa i18n) – giá luôn từ tham số.
- Không có ESC mới: mọi quy tắc tiền đã có BR/oracle hoặc quyết định PO/INV; điểm cần vai khác xác nhận ghi ở mục 7.

## 9. Bổ sung theo ORC (sau khi BE-A, BE-C xong Sprint 3)
| # | Việc | Kết quả |
|---|---|---|
| 1 | Gắn `FD_MINIBAR_PORT` | `inventory/public/minibar-checkout.port.ts` (`MinibarCheckoutPort`), `InventoryModule` @Global bind token. `checkoutStatus`: `required` = tủ có món tính tiền (BR-701; tủ chỉ món miễn phí → bước 1 tự đạt), `checked` = có bản kiểm `checkout` sống của đơn cho căn. `onCheckedOut`: tạo `hk_task minibar_refill` (`refill_items` = món đã dùng, `quantity` = tổng), ghi `minibar_check.refill_task_id`, outbox + SSE `hk_task.changed`; gọi lại → không tạo việc thứ hai. Test: `FrontdeskPorts.minibar` là `MinibarCheckoutPort`; trạng thái trước/sau kiểm; việc bổ sung (`payments-s3` ca minibar) |
| 2 | Đổi sang `stayInfo` | `MinibarService.stay()` = `stayInfo` + phạm vi HK áp ở BE-B; `listPayments` lấy mã đơn qua `stayInfo` (1 lần/đơn khác nhau trong trang); phản hồi Payment cũng vậy. Còn **một** chỗ ghi bảng vùng khác có chủ đích: `confirmDeposit` cập nhật `reservation.deposit_shortfall_*` (cột 0040 do ARC giao BE-B) |
| 3 | Kiểm migration trên DB tạo mới | `ottimo_test_beb` xóa và tạo lại → `db:migrate` chạy 26/26 (`__drizzle_migrations` = số entry journal); `minibar_check_replaced_by_fk` **DEFERRABLE INITIALLY DEFERRED**; `GRANT UPDATE` cột `payment` có đủ `self_reconciled, received_amount_vnd, received_at, note, attachment_id`. Hai ca đỏ của BE-A là do DB `ottimo_test_bea` đã chạy bản 0040/0041 cũ (migration chỉ tiến) – cần tạo lại DB đó |
| 4 | Mốc hạn lưu ảnh biên nhận (BE-C, SEC I5) | `ATTACHMENT_USAGE.setRetentionAnchor` thêm vào interface + hàm `anchorPaymentAttachment`: `reconciled` (đối soát sao kê **và** xác nhận tiền mặt nộp quầy) → mốc = lúc đó; `disputed` → giữ, mốc khi đảo giao dịch; thu tiền mặt/POS tại quầy (`not_required`, cả `confirmDeposit`) → mốc ngay; hoàn tiền mặt → mốc `refund_proof` ngay, hoàn chuyển khoản → khi đối soát. Test mới `SEC I5: a receipt image starts its retention…` |
| 5 | Vòng phụ thuộc DI | Đã sửa ở BE-B (`ModuleRef`); BE-C cũng chuyển `AttachmentService` lấy reservations port qua `ModuleRef` |

Kết quả lệnh lần cuối (toàn repo, DB `ottimo_test_beb` tạo mới):
| Lệnh | Kết quả |
|---|---|
| `pnpm -s format:check` | **Xanh** |
| `pnpm -s lint` (eslint + typecheck) | **Xanh** – 0 lỗi (2 cảnh báo cũ `mockServiceWorker.js`), typecheck 12/12 |
| `pnpm -s test -- --force` | **Xanh** – turbo 12/12; `@ottimo/api` 50 tệp / **2.033** ca |
| `pnpm -s build` | **Xanh** 6/6 |
| `gen-openapi-meta --check`, `gen-quote-copy --check` | up to date |

## 10. Phản hồi & sửa (17/10/2026 – theo `reviews/s3-DOM.md`, `s3-ARC.md`, `s3-SEC.md`, hợp đồng 0.3.6 bổ sung 1 + 2)

Phản hồi từng thẻ: `responses/s3-BE-B.md`. Phần dưới chỉ ghi những gì đã đổi trong code.

| Nhóm | Thay đổi | Tệp chính |
|---|---|---|
| Vị thế tiền (một nơi tính) | `moneyPosition`: OTA chỉ trả các khoản OTA trả hộ (`otaCoveredOf`), có thêm `otaExcessVnd`; số dư phải thu tính sau OTA; `payableCreditVnd` (chỉ khoản thu đã đối soát hoặc tiền mặt/POS; `disputed` = số thực nhận); `unsettledPaymentIds`. `computeTotals(lines, payments, openRefundVnd)` thêm `unhandledCreditVnd`, `otaExcessVnd`. `FolioBalance` thêm `unhandledCreditVnd`, `rawCreditVnd`, `openRefundVnd`, `unreconciledVnd`, `otaExcessVnd` (`creditVnd` = phần chưa xử lý). `depositPaid` bỏ dòng đảo | `folio/public/folio.service.ts`, `folio-view.ts`, `folio.controller.ts`, `bill.service.ts` |
| OTA trả trước (DOM BE-13) | `syncOtaCollect` gọi ở cuối `syncStay`, `voidStay`, và `postLines` khi ghi loại phí OTA trả hộ. `ConfirmedStay.paymentModel` (BE-A trả) | `folio.service.ts`, `reservations/public/sales-port.ts`, `reservations.service.ts` (`confirmedStay`) |
| Hoàn tiền (DOM BE-14, SEC 37/44/45, ARC 13/25) | `createRefundRequest` lấy trần = `unhandledCreditVnd`. `payOut`: trần = `creditVnd` hiện tại, `REFUND_SOURCE_NOT_RECONCILED`, khóa folio trước `approval_request`, người chi ≠ người tạo/duyệt/đặt nơi nhận, `original_method` ra `cash` → 409, `bankReference` không nhận số thẻ. `setDestination` mở lại yêu cầu qua `ApprovalService`, push `refund_destination_changed`. Yêu cầu bị từ chối/hủy → hủy DEK | `payments/internal/refunds.service.ts`, `approvals/public/approval.service.ts` (thêm hàm) |
| Hoa hồng (DOM BE-15) | `tryEarnCommissions` (S3-3), gọi qua hook B18, khi đối soát/nộp quầy, khi thu nợ sau trả phòng | `folio.service.ts`, `folio.module.ts`, `payments.service.ts` |
| Nhãn bill (DOM BE-21) | `line-labels.ts` (`lineLabel`, `roomResolver`), cột `label_params`, `labelKey`/`labelParams` trên `FolioLine`, `Bill.creditVnd`, đêm `extra_night` qua `charge_code` | `folio/public/line-labels.ts`, `folio-view.ts`, `bill.service.ts`, `foc.service.ts`, `minibar.service.ts` |
| Ghi tiền | `recordManual` tự lấy vai, SAL/CTV ép `pending` (ARC-11). Trần cọc của đơn giữ chỗ = cọc còn thiếu (BUG-R2-051). `confirmPaymentReceived` kiểm `receivedAt` (SEC-44). VietQR chỉ lưu id, dựng lại phản hồi theo tài khoản đang hiệu lực (SEC-43) | `payments/public/payment.service.ts`, `payments/internal/payments.service.ts`, `payments.controller.ts` |
| Dòng folio / minibar | `adjustFolioLine` chặn `room`/`extra_person` khi đơn còn lưu trú (ARC-14, tạm). `addFolioLine` bỏ ký tự điều khiển + Luhn cho mô tả. Minibar: `stayover` → 422, kiểm lại đảo theo chuỗi, kiểm trạng thái sau khi khóa | `folio-lines.service.ts`, `inventory/internal/minibar.service.ts` |
| Ranh giới module (ARC-15) | `payments/public/payment-expiry.ts` (J24 gọi vào), `payments/public/reconcile-attention.ts` (nguồn "Cần chú ý"), bỏ truy vấn `payment` khỏi `events` | `jobs/payment-jobs.ts`, `events/internal/attention.service.ts`, `payments.module.ts` |
| BE chung (SEC 33/34/35) | Guard: `dryRun` → quyết định ngay; replay phải khớp method + path; phiên PWA không bao giờ là thiết bị tin cậy; 600 request/phút/user. Lưới an toàn ở `SerializeInterceptor`. `stripControlChars` dùng chung | `shared/http/auth.guard.ts`, `shared/serialization/serialize.interceptor.ts`, `shared/validation.ts`, `test/helpers/feature-app.ts` |
| Migration 0042 | `label_params`, `reconciled_by_role`; backfill vai khi đã tắt RLS; CHECK tách nhiệm (fact / owner / reconciled_by / role required / cash handover COALESCE); UK một lần đảo / khoản thu; sửa `refund_account_check`; GRANT UPDATE theo cột cho `approval_request`, `item`, `invoice_request`. `.ts` (folio, approvals) và snapshot đầu 0053 sinh lại theo 4.2a-2c | `src/db/migrations/0042_money_review_s3_be_b.sql`, `meta/_journal.json`, `meta/0053_snapshot.json`, `db/schema/folio.ts`, `db/schema/approvals.ts` |

Test mới / sửa:
- `payments-s3.test.ts`: 14 ca mới
  - SEC-36 / ARC-02, DOM BE-13, DOM BE-14, ARC-13, DOM BE-15 (BR-527-06, BR-903-04), ARC-11
  - SEC-37, SEC-45, ARC-12 / SEC-42, ARC-14, DOM BE-21, SEC-43, SEC-44, DOM BE-29 / ARC-32
  - Sửa: BR-527-05 (thêm B18 trước xác nhận), A47 (chờ đối soát rồi mới chi), CHECK người tạo yêu cầu.
- `guard-s3.test.ts` (mới): 3 ca, SEC-33/34/35.
- `be-b-s3-units.test.ts`: `moneyPosition` (OTA trả hộ / OTA thu dư / tiền chưa đối soát) và `lineLabel`.
- `folio-payments.test.ts`, `be-b-s2-units.test.ts`: hai trường totals mới; `AMOUNT_EXCEEDS_BALANCE`; nhật ký `folio.line_posted`.
- `approvals-audit.test.ts` (BE-A): RB-0100…0109 chèn bản sao thay vì UPDATE `requested_by` (vì GRANT theo cột).

Kết quả lệnh (17/10/2026, DB `ottimo_test_beb` xóa – tạo lại – `db:migrate` 29/29):
| Lệnh | Kết quả |
|---|---|
| `pnpm -s test` (toàn repo) | **Xanh** – turbo 12/12; `@ottimo/api` 55 tệp / **2.119** ca (lần cuối, sau quyết định PO 17/10). Lần chạy trước: một ca `platform.test.ts` (NOTIFY `dev_clock`, phụ thuộc thời gian khi máy tải nặng) đỏ; chạy lại tệp 3/3 xanh, chạy lại toàn repo xanh |
| `pnpm -s lint` (eslint + typecheck) | **Xanh** – 0 lỗi, typecheck 12/12 |
| `pnpm -s build` | **Xanh** 6/6 |
| `pnpm -s format:check` | **Xanh** (lần cuối) |
| `drizzle-kit generate` (cấu hình thật) | "No schema changes" – không sinh tệp |
| `gen-openapi-meta --check`, api-client `gen.mjs --check`, `gen-quote-copy --check`, `gen-portal-copy --check` | up to date |

Bổ sung sau quyết định PO 17/10 (SEC-37, decision-log): OWN được miễn tách nhiệm trên hoàn **chuyển khoản**.
- OWN được đặt nơi nhận, duyệt và chi cùng một khoản (`approval.service` `assertNotSelf`, `refunds.service` `payOut`).
- CHECK trong 0042: `approval_request_refund_destination_not_approver`, `payment_refund_not_requester_check`.
- Chi trên đường "tự làm" cần cửa sổ step-up (`refunds.controller`).
- Nhật ký `refund.paid` có `after.ownSelfApprovedAndPaid`.
- MGR duyệt rồi chi → 403.
- Test: `payments-s3` ca "PO 17/10 (SEC-37)…".

## 11. Kiểm thử Sprint 3 – sửa lỗi QA đợt 2 (17/10/2026, HEAD `c8b83f3`, `qa/bug-list.md`)

| Lỗi | Sửa | Test |
|---|---|---|
| BUG-R2-051 (P2) SR-RL-09 | Cửa sổ đếm 600 request/phút/user chạy theo **đồng hồ đơn điệu của tiến trình** (`MONOTONIC_CLOCK`, `performance.now()`), không theo MutableClock nên tua giờ dev/test không còn ảnh hưởng.<br>`RateLimiter` bỏ qua cửa sổ mở ở thời điểm "tương lai" (đồng hồ lùi), áp cho cả bộ đếm đăng nhập của identity.<br>`/__test__/rate-limits/reset` xóa luôn bộ đếm của guard (`AuthGuard.resetRateLimits()`).<br>Giới hạn đọc từ cấu hình `STAFF_REQUESTS_PER_MINUTE` (mặc định 600; dev/test được tăng, staging/production chỉ được giảm; `.env.example`). | `guard-s3.test.ts`: tua đồng hồ nghiệp vụ lùi 3 năm → `Retry-After` ≤ 60, reset → 200; ca unit đồng hồ lùi. `config.test.ts`: kiểm biên cấu hình |
| BUG-R2-041 (P2) hóa đơn công ty → hồ sơ khách | `setInvoiceRequest` (`buyerType=company`) ghi `company_name`/`tax_code` (đã chuẩn hóa) vào hồ sơ người đặt, qua cổng của guests module `guests/public/guest-contact.ts` `setInvoiceCompany`.<br>Chỉ ghi khi hồ sơ còn hiệu lực và giá trị thay đổi. Audit `guest.updated` chỉ ghi tên trường (C2). | `payments-s3` "BUG-R2-041" |
| BUG-R2-043 (P3) số thẻ ở `posAuthCode` | Thứ tự kiểm mới ở `recordPayment` (`recordInTx`) và `confirmDeposit`: Luhn → `CARD_NUMBER_DETECTED` trước, sau đó mới `TOO_LONG` (> 12 ký tự) / `VALIDATION_FAILED`. Zod chỉ còn chặn 64 ký tự. | `payments-s3` "BUG-R2-043" |
| BUG-R2-046 (P1, cùng BE-A) mốc FOC "≤ 1 đêm" | Cổng mới `FolioService.nightRateBasis(tx, lineId)` trả giá đêm làm mốc:<br>• dòng `room`: giá chính nó;<br>• trả muộn: đêm cuối;<br>• nhận sớm: đêm đầu;<br>• dòng khác: đêm của ngày dịch vụ (không có thì đêm gần nhất trước đó).<br>Dùng ở `foc.service` (`requestFoc`) và ở `stay-support.requestFoc` của BE-A (thêm 1 dòng, đã nhắn BE-A). | `payments-s3` "BUG-R2-046": FOC trên dòng dịch vụ có mốc = giá đêm của ngày đó, MGR duyệt 200; FOC trên dòng trả muộn có mốc = đêm cuối |

Việc cho vai khác:
- **BE-A**: `createReservation.initialPayment.posAuthCode` (`reservations.service.ts`) đang dùng `pf.text('posAuthCode', 12)`, cùng mẫu lỗi BUG-R2-043.
- **OPS**: stack E2E có thể đặt `STAFF_REQUESTS_PER_MINUTE` (ví dụ 5000) cho tài khoản `qa.*` dùng chung giữa các worker.
- **QA**: có thể bỏ `test.fail` ở TC-L4-059, TC-L4-066, TC-NT-029/030/036, TC-L4-056 sau khi gộp.

Kết quả lệnh (DB `ottimo_test_beb` tạo lại):
- lint + typecheck: xanh 12/12. build: xanh 6/6.
- api: 53/55 tệp, 2123/2125 ca. Hai ca đỏ nằm ở tệp BE-C đang sửa dở, không liên quan BE-B:
  - `module-boundaries` báo `ModuleRef` mới trong `registration/*`;
  - ca mới `BUG-R2-036` của `registration-flow` – chạy riêng thì xanh, chạy cả bộ thì 401 do thứ tự đồng hồ.
- format:check: 4 tệp chưa format, đều của BE-C (`registration/*`) và BE-A (`frontdesk.test.ts`).
- Mọi tệp BE-B: xanh.
