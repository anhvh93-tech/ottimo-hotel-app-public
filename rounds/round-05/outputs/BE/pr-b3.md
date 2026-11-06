# BE-D2 – PR-B3: V5-5B 5B-1 "Tiền về sau khi hủy" (máy chủ)

- Người làm: BE (làn BE-D2) | Round 5 – v1.0.5 – Bước: **Sản xuất** | 07/11/2026
- Nhánh: `r5-b3`, cắt từ `origin/main` `5ca6db0b`, đã gộp `origin/main` hai lần (merge, không rebase), lần sau có #119 (`f84cd605`). PR nháp: xem mục 8.
- Căn cứ: hợp đồng 0.3.13 bổ sung 1 mục 1.21 ý 3 (`recordPayment` (B)), bổ sung 1e (SEC ARC-15), 1f (SEC ARC-16, ARC-20, ARC-21, C0313-25); DOM `rules-v1.0.5.md` 11.4 mục 2–5; SEC `SEC-on-bug-r5-002.md` 3.2 (S2–S8); thẻ ARC FB-R5-ARC-BE-105-03 (trả lời DOM FB-R5-DOM-ARC-105-01), FB-R5-ARC-BE-119-01; SEC FB-R5-SEC-BE-119-02, FB-R5-SEC-BE-127-02 (ORC giao thêm 07/11), SEC-responses 4.3.
- Không làm trong PR này (ORC chốt): SEC 105-01 (BE-B, #139), ca test riêng ARC 105-01/105-02, DOM ARC-120-01, SQL 0079, trần S5 (cắt theo đường cắt của dòng V5-5B).

## 1. Trả lời DOM FB-R5-DOM-ARC-105-01 (theo ARC FB-R5-ARC-BE-105-03)

Đơn OTA thu tại khách sạn bị hủy / no-show có phí (khách còn nợ phí, quẹt thẻ ở quầy):

| Bước | Máy chủ làm |
|---|---|
| 1. N | N = `balanceDueVnd` của folio, đọc **ngay sau khóa folio** (L3, `recordInTxWithDue`). Hai khoản thu cùng lúc xếp hàng trên khóa này, khoản sau thấy khoản trước (`balanceDueVnd` đã trừ mọi khoản `succeeded`, kể cả chờ đối soát) |
| 2. `card_pos` khi N > 0 | Nhận khi `amountVnd ≤ N`. Vượt → 422 `AMOUNT_EXCEEDS_BALANCE` (`field` = `amountVnd`), `max` = N. Không có lối "thu dư kèm ghi chú" cho thẻ |
| 3. `card_pos` khi N = 0 | 422 `VALIDATION_FAILED` `{field: method, code: NOT_IN_LIST}` như V5-48 |
| 4. Chứng từ | `posAuthCode` bắt buộc (như mọi phiếu thẻ). Không bắt ảnh phiếu POS. Ảnh gửi kèm vẫn qua kiểm ảnh như cũ |
| 5. Phương thức khác | `cash`, `ota_collect` (và ví) → 422 `method` NOT_IN_LIST, kể cả khi N > 0. Chuyển khoản, VietQR giữ luật V5-48 (ảnh bắt buộc) |
| 6. Hoàn tự tạo | Số hoàn = max(0, `amountVnd` − N). Thẻ luôn 0 (đã chặn ở bước 2). Chuyển khoản 800.000 trên đơn còn nợ phí 500.000 → hoàn 300.000; đúng 500.000 → không hoàn |
| Chung | Khoản thu luôn `reconciliation = pending`; audit `payment.recorded` có `afterClosure`, `reservationStatus`; lỗi thì không ghi gì |

Test t1–t7 ở `pr-b3-after-closure.test.ts` (mục 4). Ca h1 của #105 (V5-48) sửa theo luật mới: `card_pos` trên folio N = 0 vẫn ra `method` NOT_IN_LIST, test kiểm thêm N = 0 trên cả ba đơn.

## 2. 5B-1 – phần còn lại

- **`type`**: `deposit` khi `status_before_cancel = hold`, `charge` với đơn khác. Gửi loại kia → 422 `{field: type, code: NOT_ALLOWED}`, gom cùng lỗi `method`/`attachmentId` trong một 422.
- **Yêu cầu hoàn tự tạo** (`RefundsService.createAfterClosureRefund`, cùng giao dịch): `refund`, `reasonCode = payment_after_cancel`, ghi chú máy "Tự sinh từ khoản thu {mã} {phương thức}", `refundSource = other`, không phí. Yêu cầu BR-309 có sẵn của đơn giữ nguyên.
  - S2: đứng tên **người ghi**, người ghi trong `origin_actor_ids` → không duyệt (CHECK + `SELF_APPROVAL_FORBIDDEN`). `refundRouting` thêm mọi người ghi khoản thu sau khi đóng của folio vào `origin_actor_ids` của **mọi** yêu cầu hoàn mới trên folio đó, nên bị từ chối rồi người khác tạo lại vẫn chặn. `payOut` (chi chuyển khoản và tiền mặt) chặn người trong `origin_actor_ids` → 403 `SELF_REFUND_FORBIDDEN`, giữ ngoại lệ OWN chi chuyển khoản của PO 17/10.
  - S3: nơi nhận `original_method`, `refund_destination_set_by` = NULL (máy chủ đặt), audit tiền `refund.destination_set`. `setRefundDestination` → 409 `INVALID_TRANSITION`; `executeCashRefund` → 409; `executeRefund` trả về khoản **chuyển khoản/VietQR** mới nhất của folio, chỉ khi khoản đó đã đối soát (`REFUND_SOURCE_NOT_RECONCILED` như mọi yêu cầu).
  - "Cần chú ý" `closed_reservation_credit` của đơn mở (đóng khi chi hết, S4-06).
- **"Có thể trùng"** (S4 tối thiểu, ARC-16): tính lúc đọc, không cột mới.
  - `Payment.possibleDuplicateCodes`: với khoản chuyển khoản/VietQR `succeeded`, chưa đảo: mã đơn của khoản chuyển khoản/VietQR khác của cơ sở, chưa đảo, cùng số tiền, `receivedAt` cách ≤ 24 giờ, ở đơn khác. Đúng chữ hợp đồng: áp cho **mọi** khoản chuyển khoản, không riêng khoản sau khi đóng.
  - `ApprovalRequest.possibleDuplicateCodes` (yêu cầu `refund`): hợp các mã trên của các khoản thu sau khi đóng trên folio đích. Một truy vấn cho cả trang (`listApprovalRequests`), cổng `provideRefundDuplicates` từ folio sang approvals (không đọc chéo bảng).
  - Cả hai chỉ FD+ (`x-visible-to` đã sinh ở serializer). Test: sale đọc folio đơn của mình không thấy trường.
- **`bankReference`** (S4 nên có, ARC-15, C0313-25): xem mục 3.
- **`createDepositNotice` trên đơn đã đóng** (S7, DOM 11.4 mục 5): 202 như đơn giữ chỗ, ghi `deposit_notice`, audit `afterClosure: true`; mở **một** mục "Cần chú ý" `deposit_after_cancel` (khóa `deposit_after_cancel:<id đơn>`, chỉ mã đơn); báo FD, FDL, MGR, OWN (không gửi người báo), tin chỉ có mã đơn. Không sinh khoản thu, không đổi đơn. Ảnh của báo không bao giờ là chứng từ (V5-48, giữ).
- **Mục đóng** (DOM 11.4 mục 5): khi có khoản thu ghi sau khi đóng đơn, trong cùng giao dịch: mục `deposit_after_cancel` đóng, các báo đang `open` của đơn thành `handled` với `handled_payment_id`. Hoặc FD+ bấm "Không thấy tiền".
- **"Không thấy tiền"** (S8, ARC-20): `resolveAttentionEvent` trên `deposit_after_cancel` bắt buộc ghi chú (3–500, `REASON_REQUIRED`); audit tiền `attention_event.resolved`, `entity_type = attention_event`, mã đơn, `after = {kind, afterClosure: true}`, không ghi chú tự do (ghi chú ở dòng mục). Đăng ký thực thể `attention_event` (`events/audit-entities.ts`, nạp ở api và worker), thêm action vào `AFTER_CLOSURE_ACTIONS` của `afterClosureOnly`. Test đọc lại từ bảng `audit_event` và qua `GET /audit-events?afterClosureOnly=true&from&to` **không** có `category`, đúng lời gọi của màn tuần OWN.

## 3. `bankReference` ở mọi đường `PaymentCreate` (ARC 119-01, SEC 119-02)

- Khai trường ở cả 5 bộ đọc: `recordPayment` (zod), `confirmDeposit` (zod + `depositPayment`, tiền tố `payment.`), `createReservation.initialPayment` (`initialPayment.`), `checkIn.payment` (`payment.`), `checkOut.finalPayment` (`finalPayment.`). `GroupDepositInput` (`allocateGroupDeposit`) chưa có handler trên máy chủ, không có gì để nối.
- Một hàm đọc chung `readBankReference(field, raw, method)` (`shared/validation.ts`), theo thứ tự: không có / null / chỉ khoảng trắng = không có mã; không phải chuỗi hoặc sai mẫu `^[A-Za-z0-9./_-]{1,64}$` (sau khi bỏ khoảng trắng đầu/cuối) → `VALIDATION_FAILED`; số thẻ theo luật ô mã của #119 (`isCardNumberReference`, không dùng V-09 chữ tự do) → **ném** 422 `CARD_NUMBER_DETECTED`, `field` có tiền tố, không lặp giá trị; phương thức khác `bank_transfer`/`vietqr` → `NOT_ALLOWED`. Số thẻ được kiểm trước phương thức, giống `posAuthCode`. `checkPaymentShape` (đường `recordPayment`, `checkIn`, `checkOut`), `depositPayment` và `parseInitialPayment` cùng gọi hàm này. Zod của `recordPayment` và `confirmDeposit` khai `bankReference: z.string().max(64)` (dài hơn 64 → `TOO_LONG`).
- `recordManual` (chỗ INSERT duy nhất của khoản thu) tự kiểm lại trước câu INSERT (SEC 119-02 ý 2): mẫu → `VALIDATION_FAILED`, số thẻ → `CARD_NUMBER_DETECTED`, phương thức → `NOT_ALLOWED` (`field` = `bankReference`). Một đường thu mới không qua bộ đọc vẫn không lưu được số thẻ. Sau đó chuẩn hóa (trim, chữ hoa), khóa tư vấn `pg_advisory_xact_lock(hashtextextended('bank-ref:' || property_id || ':' || mã, 0))`, rồi mới kiểm trùng.
- Khóa tư vấn nay lấy **trước** khi cấp số chứng từ `PT-…`. Lúc đầu cấp số đứng trước, nên khoản thu thứ hai chờ ở khóa bộ đếm số chứng từ chứ không chờ ở khóa tư vấn (test song song đã bắt được). Kết quả vẫn đúng, nhưng thứ tự mới đúng ý hợp đồng: khóa của (cơ sở, mã) là khóa đầu tiên hai khoản cùng mã gặp nhau.
- Trùng: chỉ so với **khoản thu** (`deposit`/`charge`, không phải dòng đảo, còn `succeeded`). Mã của khoản chi hoàn không chặn khoản thu. Khoản đã đảo trả lại mã. 409 `DUPLICATE_BANK_REFERENCE`; `duplicateReservationCode` chỉ khi người ghi có vai FD+ (SEC ARC-21/ARC-24). Không ghi gì trước 409.
- Test HTTP: mỗi đường một ca số thẻ (đúng tiền tố) và một ca mã thường (lưu chữ hoa); ca SEC 4.3 trên `recordPayment` (4 dạng số thẻ thử có/không dấu → 422; `FT42222222222227`, 16 số không qua Luhn, 12 số, 8 số → 201; `note` có số thẻ vẫn 422 theo V-09); song song cùng mã khác hoa thường (giữ khóa tư vấn bằng một kết nối riêng, thả khi cả hai đã chờ) → một 201, một 409; mã trùng mã của khoản chi hoàn (`RF-PRB3-0001` của lần chi o2) → 201; sale nhận 409 không có mã đơn, FD có; `Payment.bankReference` chỉ FD+ đọc được. Thêm một ca gọi thẳng `recordManual` (số thẻ, sai mẫu, tiền mặt có mã → 422, không lưu gì).

## 4. Test

- `test/integration/pr-b3-after-closure.test.ts` (Postgres, đồng hồ giả): t1–t7; `type` NOT_ALLOWED; yêu cầu hoàn (S2, S3) gồm từ chối rồi tạo lại; "Có thể trùng" (cả khoản đảo); S7; mục đóng khi ghi khoản thu; S8 đọc lại audit; FB-R5-SEC-BE-127-02.
- `test/integration/pr-b3-bank-reference.test.ts`: mục 3.
- `test/integration/v5-48-closed-booking-money.test.ts`: `type` theo đơn, `card_pos` khi N = 0.
- `test/pr-b3-units.test.ts`: `afterClosureType`, `afterClosureRefundVnd`, `serverFixedDestination`, `normalizeBankReference`, `AFTER_CLOSURE_ACTIONS`, allowlist `attention_event`, `readBankReference` (mọi nhánh, lỗi không lặp số thẻ), `checkPaymentShape` với tiền tố `finalPayment.`/`payment.`.
- Kết quả và kiểm đột biến: mục 7.

## 5. FB-R5-SEC-BE-127-02 (ORC giao thêm 07/11)

`refunds.service.ts`: bỏ hằng riêng `CONTROL_CHARS` (C0 + DEL), `accountHolder` qua `stripControlChars` của `shared/validation.ts` (bộ lọc chung của 127-01). Test HTTP: tên chỉ gồm 3 × U+2060 → 422 `REQUIRED`; tên có U+202E → lưu bản đã bỏ ký tự (đọc lại qua `getRefundDestination` có step-up).

## 6. Điểm cần người review xem

**ARC**
- `recordInTx` tách thành `recordInTxWithDue` (trả thêm N); `recordInTx` giữ chữ ký cũ. `owed` nay đọc ngay sau khóa folio, trước kiểm `receivedAt` (cùng giao dịch, cùng khóa – không đổi kết quả của đường cũ).
- `refundRouting` mở rộng: người ghi khoản thu sau khi đóng vào `origin_actor_ids` của mọi yêu cầu hoàn mới trên folio đó (đọc `payment`, như A32 đọc `folio_settled_reduction`). Đơn no-show được khôi phục (B12) thì `AFTER_CLOSURE_SQL` thành false, người ghi không còn bị thêm vào yêu cầu **mới** (yêu cầu cũ giữ). 5B-2 cần xem lại.
- Hạn chế đã biết: yêu cầu thay thế kiểu "pha trộn" (`peekCarryableDestination` trả null vì các nơi nhận khác nhau) không mang dấu "máy chủ đặt", nơi nhận có thể mất; không có khoản chuyển khoản nào trên folio thì `executeRefund` ra 409 với chữ "original method resolves to cash".
- "Có thể trùng" là truy vấn con theo từng dòng khoản thu ở mọi lần đọc folio/danh sách khoản thu; không chỉ mục mới (SQL 0079 ngoài phạm vi). Với 10 căn thì nhỏ; v1.0.6 nên có chỉ mục `(property_id, amount_vnd)` cho khoản chuyển khoản.
- Thứ tự khóa trong `recordManual` (mục 3): khóa tư vấn (cơ sở, mã) → số chứng từ `PT-…` (khóa dòng `doc_sequence`) → INSERT. Rủi ro còn lại: một giao dịch đã cấp số `PT-…` trước đó (ví dụ `syncOtaCollect` khi đăng dòng trong cùng giao dịch; tôi chưa dò hết các đường như vậy) rồi mới ghi khoản thu có mã, đúng lúc một giao dịch khác ghi cùng mã → PostgreSQL phát hiện deadlock, hủy một bên → 409 `CONCURRENT_UPDATE` (`Retry-After: 1`), không có khoản thu đôi. Thứ tự cũ (số chứng từ trước) không có deadlock nhưng khóa tư vấn khi đó không bao giờ bị tranh: mọi khoản thu của cơ sở đã xếp hàng ở `doc_sequence`, nên luật trùng dựa vào một chi tiết của bộ đánh số. Tôi chọn thứ tự mới; ARC muốn ngược lại thì đổi một dòng (đột biến M30 sẽ phải bỏ).
- Hợp đồng và DOM lệch nhau về lúc đóng `deposit_after_cancel`: openapi "đóng khi đã hoàn xong", DOM 11.4 mục 5 "khi đơn có khoản thu ghi sau lúc báo". Tôi theo DOM; phần "đến khi hoàn xong" do mục `closed_reservation_credit` lo. Đề nghị ARC sửa chữ ở 0.3.14.

**SEC**
- S2 ở `payOut`: ngoại lệ OWN chi chuyển khoản (PO 17/10) giữ cả cho người trong `origin_actor_ids`. OWN là người ghi khoản thu sau khi đóng vẫn tự chi được yêu cầu đó (có step-up, có cờ `ownSelfApprovedAndPaid`). Nếu SEC muốn chặn hẳn thì bỏ điều kiện `!ownerTransfer` ở một dòng.
- `deposit_after_cancel`: tin đẩy theo `notifyStaff` (FD, FDL, MGR, OWN; không gửi người báo), không gửi kèm số tiền; push cũ `deposit_notice` cho người phụ trách không đi trên đơn đã đóng.
- Audit `refund.destination_set` khi máy chủ đặt nơi nhận (`before.refundMethod = null`, `after.refundMethod = original_method`) – action đã có trong tập `money`.
- `duplicateReservationCode` theo vai của **người ghi** (snapshot vai ở `recordManual`), không theo vai đọc.
- SEC 105-01 (#139) gộp sau thì xung đột ở khối S7 của `recordAfterClosure`: giữ kiểm `uploadedBySales` của #139 và nhánh `card_pos` không bắt ảnh của PR này.

**DOM**
- "Có thể trùng" áp cho mọi khoản chuyển khoản cùng số tiền trong 24 giờ, đúng chữ hợp đồng. Hai khách cùng chuyển cọc 1.000.000 trong ngày sẽ cùng hiện "Có thể trùng" – chỉ là cảnh báo. Nếu DOM muốn chỉ hiện ở khoản ghi sau khi đóng, sửa một điều kiện.
- `type` theo `status_before_cancel` (giữ chỗ hủy → `deposit`).
- No-show giữ dòng dịch vụ (t7): thẻ thu tới N.

**QA**
- Ca DOM 11.4 (a'), (a''), (d'), (e') có trong `pr-b3-after-closure.test.ts`; ca (a) của BUG-R5-002 đổi kết quả mong đợi (nhận) đã đúng từ V5-48.
- Desk (FE-A) chưa có nút: thử qua API hoặc chờ PR Desk.

## 7. Kết quả chạy

Chạy trên máy, PostgreSQL 17 tạm (container riêng, xóa sau khi xong), sau khi gộp `origin/main` `f84cd605` (#119):

- `tsc --noEmit` (gồm `src` và `test`): sạch. Prettier, ESLint trên các file của PR: sạch.
- Toàn bộ API Vitest: **202 file qua, 2 bỏ qua; 4.995 test qua, 19 bỏ qua, 1 todo**. Lần chạy đầu đỏ 2 chỗ, cả hai đã xử lý:
  - `be-b-s2-units.test.ts` so khớp đúng hình `depositPayment`. Hàm nay chỉ thêm `bankReference` khi có mã, nên hình cũ giữ nguyên. Không sửa test của làn khác.
  - `production-bootstrap.test.ts` cần cơ sở dữ liệu mới tinh. Lỗi do môi trường máy (lần chạy trước đã dùng nó), không do code. Tạo lại container thì qua.
- Bốn file của PR (`pr-b3-after-closure`, `pr-b3-bank-reference`, `pr-b3-units`, `be-b-s2-units`): 43/43 qua.

Kiểm đột biến (mỗi lần một chỗ sửa, chạy file test liên quan, mong đỏ, rồi trả lại code):

| # | Đột biến | Kết quả |
|---|---|---|
| M1 | `card_pos` không chặn trần N | đỏ |
| M2 | `card_pos` nhận khi N = 0 | đỏ |
| M3 | số hoàn không trừ N | đỏ |
| M4 | tắt luật `type` | đỏ |
| M5 | không đưa người ghi vào `origin_actor_ids` khi tạo yêu cầu hoàn | **xanh khi đứng riêng**: `refundRouting` cũng thêm người ghi (hai lớp). M5 + M8 cùng lúc → đỏ |
| M6 | `payOut` bỏ kiểm `origin_actor_ids` | đỏ |
| M7 | nơi nhận không cố định | đỏ |
| M8 | `refundRouting` quên người ghi sau khi đóng | đỏ |
| M9 | bỏ khóa tư vấn | đỏ |
| M10 | so mã phân biệt hoa thường | đỏ |
| M11 | `duplicateReservationCode` cho mọi vai | đỏ |
| M12 | mã của khoản chi hoàn chặn khoản thu | đỏ |
| M13 | "Không thấy tiền" không ghi audit | đỏ |
| M14 | "Không thấy tiền" không bắt ghi chú | đỏ |
| M15 | `afterClosureOnly` thiếu `attention_event.resolved` | đỏ |
| M16 | báo chuyển khoản trên đơn đã đóng → 409 | đỏ |
| M17 | `ApprovalRequest` không có "Có thể trùng" | đỏ |
| M18 | khoản thu không đóng mục `deposit_after_cancel` | đỏ |
| M19 | `accountHolder` quay lại bộ lọc riêng C0 + DEL | đỏ |
| M20 | zod `recordPayment` bỏ `bankReference` | đỏ |
| M21 | zod `confirmDeposit` bỏ `bankReference` | đỏ |
| M22 | tắt bộ đọc `initialPayment.bankReference` | đỏ |
| M23 | `checkIn` không chuyển `bankReference` | đỏ |
| M24 | `checkOut` không chuyển `bankReference` | đỏ |
| M25 | tắt luật phương thức trong `readBankReference` | đỏ |
| M26 | `recordManual` bỏ kiểm số thẻ | đỏ |
| M27 | `recordInTx` không chuyển mã xuống `recordManual` | đỏ |
| M28 | `checkPaymentShape` bỏ lỗi của bộ đọc | đỏ |
| M29 | bộ đọc dùng V-09 chữ tự do thay luật ô mã | đỏ |
| M30 | cấp số `PT-…` trước khóa tư vấn | đỏ |
| M31 | `recordManual` bỏ kiểm phương thức | đỏ |

M1–M8 và M13–M19 đã chạy lại sau khi thêm phần `bankReference`.

## 8. PR

- PR nháp **#148** (`r5-b3` → `main`). Head là commit chứa file này; SHA và trạng thái CI ghi ở PR và báo cáo gửi ORC.
- Lịch sử nhánh: `3a59a015` (máy chủ 5B-1) → `2fed4383` (gộp main) → `6b4eb1b3` (test t1–t7, S2–S8, 127-02) → `e250874d` (gộp main có #119) → commit `bankReference`.
- CI đã biết hay chập chờn: shellcheck `postgres-log-terse` (OPS-11, #126), không liên quan PR này.
- Xung đột sẽ gặp khi #139 lên trước: khối S7 của `recordAfterClosure` và test V5-48. Cách gộp ở mục 6 (SEC).
