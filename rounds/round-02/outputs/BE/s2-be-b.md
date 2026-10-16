# BE-B – Round 2, Sprint 2: folio nền, báo giá ngắn ngày, giữ chỗ từ báo giá, xác nhận cọc, lead tối thiểu

- Vai: BE (luồng BE-B) | Ngày: 16/10/2026 | Không commit (ORC commit) | Plan R2 mục 4 Sprint 2 ("BE-B folio nền") + phiếu giao việc ORC
- Đầu vào: OpenAPI 0.3.4-draft, specs/EP02-reservations.md (mục 10 Sale, 0, 3.3), state-machines SM-01 B1/B4, SM-08…SM-13, BR v0.3.1 (101–113, 302–305, 903–904), erd 4.5/4.6/8, coding-standards 0.2, rbac-cases.json, br-examples.json, DS-E.
- Làm song song BE-A (reservations). Phối hợp qua `reservations/public/sales-port.ts` (BE-B viết bản đầu, BE-A dựng lại và cài adapter thật – cùng thành viên) và `reservation-hooks.ts`/`money-bridge.ts` của BE-A (gọi `FolioService`/`PaymentService` của BE-B). Test cuối chạy **end-to-end với module reservations thật** (không giả lập).

## 1. Operation / trạng thái

| Operation | Story / AC | Trạng thái | Điểm chính |
|---|---|---|---|
| `listChannels` | US-017 AC8, BR-901 | Xong | Bảng `channel` + `channel_commission_rate` (có ngày hiệu lực); `commissionRatePct` bị serializer bỏ với SAL/CTV; seed DS-E nạp khối `channels` |
| `calculateQuote` | US-080 AC1–AC5, US-082 AC1 | Xong | Giá niêm yết theo ngày hiệu lực → lịch giá BR-104 → giảm số đêm BR-107 / mã quay lại BR-111 (không cộng dồn, `stackable`) → phụ thu người BR-110 (người lớn lấp định mức trước, trẻ < 6 không tính, sức chứa = định mức + 1) → cọc BR-305 (chỉ tiền phòng) → hoa hồng người chốt BR-903 (CTV 8 %/sale 3 %) → "OTTIMO còn lại"; phương án 1 tháng BR-108 (thuê tháng + phí dịch vụ nhóm); ở tối thiểu BR-113 + ngoại lệ đêm lẻ; cửa sổ bán BR-112; ≥ 28 đêm → `LONG_STAY_REQUIRES_CONTRACT`; `long` → 422 (R3); kênh chỉ Trực tiếp/CTV; SAL/CTV luôn là người chốt; tình trạng phòng + ≤ 6 căn thay thế qua port (BE-A) |
| `saveQuote` | US-083 AC1 (Q1) | Xong | Mã `BG-` (DocNumberService), `active`, hạn BR-304 (00:00 ngày lập + 3 + 1), snapshot đầy đủ (BR-006), lead → `quoted` (tự tạo/gắn lead mở nếu không gửi `leadId`); SAL/CTV chỉ khách của mình |
| `listQuotes`, `getQuote` | US-083, US-087 AC1/AC2 | Xong | Phạm vi M trong SQL (người lập hoặc người chốt), 404 với mục người khác; hết hạn "lười" (Q3 không cần job); lọc `status`; con trỏ |
| `getQuoteText` | US-083 AC2 | Xong | Mẫu VI/EN/RU sinh từ `design/copy` (UXD) bằng `scripts/gen-quote-copy.mjs` (+ `--check` trong test); có hạn "23:59 dd/mm", không có hoa hồng/SĐT; **RU thiếu khóa → dùng EN** (mục 5) |
| `withdrawQuote` | SM-08 Q5 | Xong | `active`/`expired` → `withdrawn`, khác → 409 `INVALID_TRANSITION` |
| `createHoldFromQuote` | US-084 AC1–AC4 (B1 + Q2) | Xong | Hết hạn → 409 `QUOTE_EXPIRED`; đến hôm nay → 422 `HOLD_NOT_ALLOWED_TODAY`; khách chưa có SĐT → 422 `PHONE_REQUIRED`; `holdHours` ∈ `hold_hours_options`; VNPay/MoMo ẩn ở R2; giữ chỗ tạo qua port (EXCLUDE → 409 `ROOM_UNAVAILABLE`) với **giá snapshot của báo giá**; báo giá → `converted`; lead → `holding`; trả `Reservation` (cọc cần thu, hạn giữ) |
| `listLeads`, `createLead`, `changeLeadStage` | US-087, SM-09 | Xong (R2 tối thiểu) | Chuyển tay `new ↔ quoted`, `new/quoted → lost` (lý do BR-308, `other` bắt buộc ghi chú), `lost → new/quoted`; `If-Match`; hệ thống: Q1 → quoted, B1 → holding, B4 → won, B5/B6 → quoted (`LeadsService.onHoldEnded` cho BE-A gọi) |
| `confirmDeposit` | US-086 AC1, AC2, AC4, AC5 (B4) | Xong | FD+/SAL (của mình); `If-Match`; ghi giao dịch `PT-` (chuyển khoản/VietQR ghi tay → `reconciliation=pending`, tiền mặt/POS → `not_required`) hoặc dùng `existingPaymentId`; Σ cọc ≥ BR-305 → B4 qua port + ghi folio + hoa hồng + lead won + thông báo cọc "handled"; **thiếu → giao dịch vẫn lưu, đơn giữ `hold`, 422 `DEPOSIT_INSUFFICIENT` kèm số còn thiếu**; quá hạn giữ chỗ chỉ nhận khi tiền về trước hạn (US-085 AC4) |
| `createDepositNotice` | US-086 AC4 (A53) | Xong | SAL/CTV, đơn `hold` của mình → 202, bảng `deposit_notice`, đẩy outbox `staff.push` tới FD/FDL + sale phụ trách (không có số tiền trong push); `attachmentId` → 422 cho tới khi có tải tệp |
| `getFolio` | US-020, US-119 (phần xem) | Xong | Dòng, giao dịch, tổng tính từ dữ liệu (không lưu cột tổng); SAL chỉ folio đơn của mình; CTV chỉ `roomVnd` + `depositHeldVnd` (serializer) ; `ETag` |
| `requestFoc` | US-007 AC1 (A35), BR-434 | Xong | Dòng âm `foc`/`discount` ở `pending_approval` + `ApprovalService.submit()` cùng giao dịch; giảm giá đặc biệt chỉ dòng tiền phòng; không vượt phần còn lại của dòng; tự áp (A2) qua nhập lại mật khẩu; **hook `onDecided`**: duyệt → `posted` + `stay_night.discount_vnd` (100 % → `is_complimentary`), từ chối/rút → `rejected` |
| `listCommissions` | US-087 AC2 (thu hẹp R2) | Xong | SAL/CTV chỉ của mình; `payeeName` chỉ OWN/MGR; tổng `projected/earned/paid` |
| Folio nền (public, cho BE-A) | erd 4.6, 8 | Xong | `FolioService.openForReservation` (hook `created`), `onReservationConfirmed` (B2/B4/B12: dòng phòng mỗi đêm trỏ `stay_night`, dòng phụ thu người, hoa hồng `projected` + phân bổ `agent/staff_commission_vnd`, phí kênh OTA ước tính/thực tế + phân bổ `channel_fee_vnd`, Σ = tổng, dư dồn đêm cuối), `onReservationVoided` (hoa hồng → `void`), `depositPaid`; `PaymentService.recordManual` (BE-A dùng cho `initialPayment` B2) |

Ngoài vùng (theo phiếu): `recordPayment`, `createVietQr`, `confirmPaymentReceived`, `reconcilePayment`, `reversePayment`, `addFolioLine`, `adjustFolioLine`, `getBill` – Sprint 3 (nền `PaymentService`/`FolioService.insertLine` đã sẵn).

## 2. Migration
- **0011_sales_folio_be_b** (drizzle-kit): `channel`, `channel_commission_rate`, `folio`, `folio_line`, `payment` (UK `provider_txn_id`, UK một QR chờ/folio, chỉ mục đối soát), `channel_fee`, `commission` (UK hoa hồng sống/đơn/người nhận), `deposit_notice`, `lead`, `quote`; `room_group.service_fee_monthly_vnd` (BR-204/108). CHECK đủ enum, dấu tiền (FOC/giảm âm, hoàn tiền âm), `num_nonnulls`… Đã gỡ bảng `state_transition` của BE-A khỏi bản nháp (thuộc 0013 của BE-A).
- **0012_sales_folio_rls_be_b** (custom): ENABLE + FORCE RLS + `tenant_isolation` 10 bảng; GRANT không DELETE; **`folio_line`/`payment` chỉ INSERT + UPDATE theo cột trạng thái** (K8, BR-008).
- FK chéo sang `reservation`/`stay_night` do BE-A thêm ở **0014** (đã kiểm). `drizzle-kit generate` (bản sao thư mục): **"No schema changes"** sau 0011–0014.

## 3. Test (PostgreSQL 17 thật, DB `ottimo_test_beb` – tạo lại sạch trong phiên, vai `ottimo_app`)
| File | Ca | Nội dung |
|---|---|---|
| `test/be-b-s2-units.test.ts` | 12 | `allocate` (2.000 ca ngẫu nhiên Σ = tổng; 416.400 trên 7 đêm), tổng folio, nhóm doanh thu BR-904, oracle BR-903-01, BR-304-01 (hạn báo giá + lười), mẫu chữ sinh từ UXD (`--check`), quy tắc trường thanh toán, cờ đối soát BR-527 |
| `test/integration/sales.test.ts` | 22 | listChannels theo vai; **oracle** BR-107-01/02, BR-305-01/02, BR-108-01, BR-903-01, BR-110-01…05, BR-111-01, BR-113 (+ đêm lẻ thật trên rack), BR-302-01, BR-304-01; lỗi trường (ngày qua, cửa sổ 365 ngày biên, ≥ 28 đêm, OTA, `long`); US-082 căn bận + nhóm; lưu/idempotency/phạm vi CTV-SAL/serializer hoa hồng; văn bản VI/EN/RU; hết hạn lười 23:59/00:00; rút; giữ chỗ + đêm `hold` + folio mở; từ chối giữ chỗ; **2 giữ chỗ đồng thời cùng căn → đúng 1 thành công (409 `ROOM_UNAVAILABLE`)**; cách ly tổ chức; lead |
| `test/integration/folio-payments.test.ts` | 11 | B4 thiếu → 422 + giao dịch giữ lại, đủ → `confirmed`, 7 dòng phòng trỏ `stay_night` `sold` + 7 dòng phụ thu, tổng = 4.655.000 còn thu (BR-305-02), audit tiền đủ, lead won, hoa hồng sale 156.150; 428/412; CTV 403, SAL khác 404; **2 xác nhận đồng thời → 1 thành công, giao dịch kia rollback**; quy tắc trường; `existingPaymentId`; quá hạn giữ chỗ (US-085 AC4); **hoa hồng CTV 416.400 phân bổ 57.040×5 + 65.600×2 trên `stay_night`**; getFolio CTV chỉ 2 tổng; báo đã chuyển cọc + outbox; FOC duyệt/từ chối/tự áp + `stay_night` giảm 100 % → `is_complimentary`; K8 quyền cột |
| `test/integration/rbac-sprint2-beb.test.ts` | 177 | 176 ca `rbac-cases.json` của 16 operation (2xx/403/401) + 1 ca phủ đủ operation |

## 4. Kết quả lệnh (16/10/2026, Node 22, pnpm 9.15.4, PostgreSQL 17.11 `ottimo-dev`, `DATABASE_URL`/`MIGRATION_DATABASE_URL` → `ottimo_test_beb`)
| Lệnh | Kết quả |
|---|---|
| `pnpm -s format:check` (toàn repo) | **Đỏ – chỉ file BE-A đang làm dở**: `modules/reservations/**`, `src/worker.ts`, `src/jobs/reservation-jobs.ts`, `db/schema/audit.ts`, `meta/0013–0014_snapshot.json`, `test/helpers/reservations-fixture.ts`, `test/reservations-pricing.test.ts`. Mọi file BE-B sạch (`prettier --check`) |
| `pnpm -s lint` (toàn repo) | **1 lỗi của BE-A** (`reservations.service.ts:30 nightDates` không dùng) + 1 cảnh báo cũ của FE (`mockServiceWorker.js`). File BE-B: 0 lỗi |
| `pnpm -s test` (toàn repo) | Turbo **12/12**; `@ottimo/api` **Test Files 28 passed, Tests 847 passed** (gồm test BE-A); admin-web 100, integrations 46, api-client 10, ui 7, i18n 3, mobile 1, guest-web 1 |
| `pnpm -s build` | Turbo **6/6**; `dist/db/migrations` có 0000…0014 |
| `drizzle-kit generate` (bản sao) | `No schema changes, nothing to migrate` |
| `node scripts/gen-quote-copy.mjs --check` | up to date |

## 5. Lệch hợp đồng / việc cần vai khác
| # | Gửi | Nội dung |
|---|---|---|
| S2-1 | ARC | `QuoteCalculation` thiếu trường tách: `roomTotalVnd`, `extraPersonFeeVnd`, `extraGuestCount` (US-080 AC5, BR-305). Hiện `totalVnd` = tiền phòng + phụ thu người; client suy phụ thu = `totalVnd − Σ nightlyRates`. Đề nghị thêm ở 0.3.5 |
| S2-2 | ARC | Mã trường dùng mà bảng chưa có: `MIN_STAY_NOT_MET`, `LONG_STAY_REQUIRES_CONTRACT`, `RETURN_CODE_INVALID`, `AMOUNT_NOT_POSITIVE`, `DATE_IN_PAST`; `DEPOSIT_INSUFFICIENT` có thêm `depositRequiredVnd/depositPaidVnd/shortfallVnd/paymentCode` |
| S2-3 | ARC | erd: `folio_line.revenue_group` là cột thường (không generated – dòng FOC theo nhóm dòng gốc); `room_group.service_fee_monthly_vnd` (mới); `deposit_notice` (bảng mới cho A53); `quote.withdrawn_at` |
| S2-4 | ARC + SEC | `PaymentCreate.attachmentId`/`createDepositNotice.attachmentId` bị từ chối 422 cho tới khi có `uploadAttachment` (Sprint 3, SR-FILE) |
| S2-5 | BE-A | (1) `ConfirmedStay` mất `commissionRatePctSnapshot` khi dựng lại port → hoa hồng B4 lấy % tham số tại ngày xác nhận thay vì snapshot báo giá (BR-006). Đề nghị trả lại trường này (đọc `pricing_snapshot.commissionRatePct` – BE-B đã ghi vào snapshot); (2) `Promise.all` trên cùng `tx` ở `reservations.service.ts`, `rack.service.ts`, `pricing.service.ts` → cảnh báo pg "client.query() when the client is already executing" (bị bỏ ở pg@9) – nên chạy tuần tự; (3) B5/B6 gọi `LeadsService.onHoldEnded(tx, quoteId)` (lead → `quoted`) nếu chưa gọi; (4) format/lint các file reservations (mục 4) |
| S2-6 | UXD | `strings-ru.json` thiếu `sale.quote_text`, `sale.quote_text_extra_guest`, `occ.*_short` → văn bản báo giá RU đang dùng tiếng Anh |
| S2-7 | QA | Test mới ở mục 3 (oracle BR-107/108/110/111/113/302/304/305/903); runner RBAC Sprint 2 của BE-B dùng id ngẫu nhiên; ca đồng thời B1/B4 |
| S2-8 | DATA | Giảm theo số đêm (BR-107) nằm trong giá đêm (`room_revenue_gross_vnd` = giá sau giảm); `discount_vnd` chỉ nhận FOC/giảm giá đặc biệt đã duyệt – xác nhận đúng định nghĩa FB-02 |

## 6. Còn lại / chuyển tiếp
- Sprint 3: `recordPayment`, VietQR (`createVietQr`, `confirmPaymentReceived`, J24), đối soát/đảo, `addFolioLine`/`adjustFolioLine`, bill + số `F26-`, khóa folio khi trả phòng.
- Báo giá: gia hạn báo giá Q4 (MGR+) và yêu cầu gia hạn `quote_extension` (SAL/CTV, A51 = D) – chưa có endpoint trong hợp đồng; nhắc trước hạn giữ chỗ BR-303 (job của BE-A).
- Hoa hồng `earned/payable/paid` + chi (US-089) – R3.
- Rate-limit `calculateQuote` cho CTV (chống dò giá) – chưa có yêu cầu SEC; để R3 nếu SEC yêu cầu.

## 7. Giả định
- Tiền phòng/phụ thu ghi folio khi đơn `confirmed` (B2/B4/B12), giữ chỗ chưa có dòng; mô tả dòng hệ thống là mã trung tính (`room_night`, `extra_guest xN`) – client hiển thị theo `category` + `serviceDate`.
- Hạn báo giá theo **ngày lịch** của cơ sở lúc lập (không theo mốc 06:00).
- Báo giá theo nhóm căn: tự chọn căn trống đầu tiên của nhóm; hết căn → tính theo căn đầu nhóm và báo `available=false`.
- "OTTIMO còn lại" = tổng báo giá − hoa hồng người chốt; kênh Trực tiếp/CTV không có phí kênh.
- Lead: lưu báo giá không kèm `leadId` → gắn lead mở (new/quoted/holding) của người lập + khách, nếu không có thì tạo mới (`source=quote`); SM-09 `lost → quoted` và OpenAPI `lost → new` đều cho phép.
- Người nhận hoa hồng theo vai của người chốt trong cơ sở: CTV → `agent`, sale → `staff`; người chốt khác vai → không có hoa hồng.
- Thông báo "đã chuyển cọc" gửi FD/FDL + sale là người tạo/chốt đơn; không gửi người báo.
- DB `ottimo_test_beb` được xóa và tạo lại (cùng mô hình 4 vai) trong phiên để chạy migration sạch sau khi 0013/0014 của BE-A xuất hiện giữa chừng.
- Không có ESC mới (mọi con số đọc từ tham số BR mục 13 đã INV quyết; chỗ chưa rõ ghi giả định trên).
