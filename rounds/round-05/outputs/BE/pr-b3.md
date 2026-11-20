# BE-D2 – PR-B3: V5-5B 5B-1 "Tiền về sau khi hủy" (máy chủ)

- Người làm: BE (làn BE-D2) | Round 5 – v1.0.5 – Bước: **Sản xuất** | 07/11/2026
- Nhánh: `r5-b3`, cắt từ `origin/main` `5ca6db0b`, đã gộp `origin/main` năm lần (merge, không rebase): lần hai có #119 (`f84cd605`), lần ba tới `5c1f54f0`, lần bốn có #139, #120, #131, #133 (`aed9ec8a`), lần năm tới `d6efc170` (`d7cc3c8e`). PR nháp: xem mục 8.
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
- #139 (SEC 105-01) đã lên main và đã gộp vào nhánh này. Xung đột chỉ ở chú thích của `recordAfterClosure`; mã tự gộp được và giữ cả hai luật: ảnh do sale/CTV tải (`uploadedBySales`, qua cổng `files`) hoặc ảnh của báo chuyển khoản → 422 `attachmentId` NOT_IN_LIST, và nhánh `card_pos` không bắt ảnh. Ảnh gửi kèm phiếu thẻ cũng qua luật ảnh của sale. Hai ca của #139 trong `v5-48-closed-booking-money.test.ts` (139-02 và SEC 6 (a)) ghi `type: deposit` trên đơn **đã xác nhận** rồi hủy, nên đổi sang `charge` theo luật 5B-1. Ý của ca giữ nguyên. PR-B3 không đọc bảng `attachment` trực tiếp.

**DOM**
- "Có thể trùng" áp cho mọi khoản chuyển khoản cùng số tiền trong 24 giờ, đúng chữ hợp đồng. Hai khách cùng chuyển cọc 1.000.000 trong ngày sẽ cùng hiện "Có thể trùng" – chỉ là cảnh báo. Nếu DOM muốn chỉ hiện ở khoản ghi sau khi đóng, sửa một điều kiện.
- `type` theo `status_before_cancel` (giữ chỗ hủy → `deposit`).
- No-show giữ dòng dịch vụ (t7): thẻ thu tới N.

**QA**
- Ca DOM 11.4 (a'), (a''), (d'), (e') có trong `pr-b3-after-closure.test.ts`; ca (a) của BUG-R5-002 đổi kết quả mong đợi (nhận) đã đúng từ V5-48.
- Desk (FE-A) chưa có nút: thử qua API hoặc chờ PR Desk.

## 7. Kết quả chạy

Chạy trên máy, PostgreSQL 17 tạm (container riêng, xóa sau khi xong).

- `tsc --noEmit` (gồm `src` và `test`): sạch. Prettier, ESLint trên các file của PR: sạch.
- **Lần mới nhất** – head `d7cc3c8e` (bổ sung 1i, gộp `origin/main` `d6efc170`): **217 file qua, 2 bỏ qua; 5.170 test qua, 19 bỏ qua, 1 todo**. Lần chạy trước đó trên cùng mã có 2 test đỏ ở file không thuộc PR này, chạy riêng thì qua (22/22), chạy lại cả bộ thì xanh: `sec-be65-retention` (6b) `could not obtain lock on relation "reservation"` (tranh khóa khi chạy song song) và `v5-58-property-wifi` T58-13 (bộ đếm 0 thay vì 3).
- Sau khi gộp main lần bốn (`aed9ec8a`, có #139): 214 file qua, 5.133 test qua.
- Toàn bộ API Vitest sau khi gộp `origin/main` `5c1f54f0`: **208 file qua, 2 bỏ qua; 5.046 test qua, 19 bỏ qua, 1 todo** (lần chạy có 1 test đỏ, đã sửa và chạy lại file đó: 2/2 qua). Test đỏ là ca 105-01 của `v5-48-arc-followups.test.ts` (BE-B, mới lên main qua #144, chỉ test): ghi `type: deposit` sau khi hủy một đơn **đã xác nhận**. Theo luật 5B-1 của PR này, đơn đó nhận `charge` (`deposit` chỉ cho đơn hủy khi còn giữ chỗ). Tôi đổi một dòng sang `charge`, ghi chú lý do; ý của ca (cờ `afterClosure` theo giờ máy chủ ghi, không theo `receivedAt`) giữ nguyên. BE-B nên biết.
- Lần chạy trước đó (sau khi gộp `f84cd605`, #119): 202 file qua, 4.995 test qua. Lần đầu đỏ 2 chỗ, cả hai đã xử lý:
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
- Lịch sử nhánh: `3a59a015` (máy chủ 5B-1) → `2fed4383` (gộp main) → `6b4eb1b3` (test t1–t7, S2–S8, 127-02) → `e250874d` (gộp main có #119) → `ebd30bce` (`bankReference`, file này) → `01507ab3` (gộp main `5c1f54f0`) → commit sửa ca 105-01 của #144.
- CI đã biết hay chập chờn: shellcheck `postgres-log-terse` (OPS-11, #126), không liên quan PR này.
- #139 đã gộp (mục 6, SEC). Lần gộp main thứ tư: `aed9ec8a`. Bổ sung 1i: `e2071bc7`. Lần gộp thứ năm: `d7cc3c8e`, không xung đột. PR không đụng `strings.js`, nên không phải chạy `gen_strings.py`.

## 9. Bổ sung 1i: C0313-31, C0313-32 (Phản hồi & sửa, ORC chuyển 07/11)

ARC chốt ở bổ sung 1i (PR #152 @ `1d0b4ce8`, chỉ mô tả): **C0313-31 = phương án B**. Ô `bankReference` qua kiểu và mẫu của chính ô mà giống số thẻ → 422 `CARD_NUMBER_DETECTED` ngay, chỉ lỗi này, trước lỗi của các trường khác và trước `NOT_ALLOWED` (phương thức) của chính ô; không ghi gì.

**C0313-31 – phần mã.** ARC ghi "PR-B3 giữ thứ tự này, không đổi mã". Khi viết ca (iv) cho từng đường, tôi thấy ba chỗ #148 chưa đúng chữ "trước lỗi của các trường khác":
- `recordPayment`: lỗi kiểu của zod ở trường khác (ví dụ `amountVnd: "abc"`) ra trước, vì `parseBody` chạy trước `checkPaymentShape`. `type: refund` cũng bị trả `type` NOT_IN_LIST trước mọi kiểm thân (`PaymentsService.record`).
- `confirmDeposit`: lỗi kiểu của zod ở trường khác ra trước.
- `checkIn`: `payment` chỉ được kiểm lúc ghi (`recordInTx`). Vì vậy lỗi các trường của thân nhận phòng (`cardsIssued`, `checkinTime`…), phiên bản và trạng thái đơn đều ra trước số thẻ.

Sửa bằng một hàm `assertBankReferenceNotCardFirst(body, at)` (`shared/validation.ts`). Mỗi bộ đọc gọi hàm này trên thân thô, trước khi đọc gì khác: `recordPayment`, `confirmDeposit` (trong controller, trước `rejectDryRun` và `parseBody`), `createReservation`, `checkIn`, `checkOut` (`readInput`). Giá trị không phải chuỗi hoặc sai mẫu thì để bộ đọc báo như cũ. `readBankReference` và kiểm chốt ở `recordManual` không đổi. Nếu ARC thấy phần thêm này thừa, có thể bỏ ở `createReservation` và `checkOut`: hai đường này vốn đã báo số thẻ trước (xem đột biến M34, M36 ở dưới). Ba đường kia thì cần.

**Test 1i:**
- (iv) một ca ở **cả 5 đường**. Thân có lỗi ở trường khác (lỗi kiểm thân, lỗi kiểu zod, `type: refund`, `cardsIssued` thiếu, `checkinTime`/`checkoutTime` sai, `roomId` sai) và có số thẻ ở `bankReference` → chỉ một lỗi `CARD_NUMBER_DETECTED` với đúng tiền tố, không ghi gì, đơn giữ trạng thái.
- (iv) `cash` kèm số thẻ → `CARD_NUMBER_DETECTED`, không phải `NOT_ALLOWED`. Có ở `recordPayment`, `confirmDeposit`, `createReservation`, `checkOut`, và ở mức hàm.
- `posAuthCode` có số thẻ, mã ngân hàng bình thường → báo `posAuthCode` (BUG-R2-043).
- Ca đơn vị cho `assertBankReferenceNotCardFirst`.
- (i) SAL `confirmDeposit` trên giữ chỗ của mình, mã đã dùng → 409 **không có** `duplicateReservationCode`, không ghi gì, đơn vẫn `hold`.
- C0313-32: mỗi đường có đủ 3 ca HTTP (số thẻ → 422 có tiền tố, không ghi gì; mã chữ thường → lưu chữ hoa; mã trùng → 409). Ca trùng mới thêm ở `createReservation.initialPayment` (không tạo đơn), `checkIn` (đơn vẫn `confirmed`), `checkOut` (vẫn `in_house`).
- C0313-32 (e) "Không thấy tiền": ghi chú thiếu, 2 ký tự, toàn khoảng trắng hoặc toàn ký tự ẩn (U+2060, U+200B) → 422 `REASON_REQUIRED`, mục còn mở, không có dòng audit.
- Danh sách SR-PAY-10 bản 07/11 ở mức hàm đã có ở `v09-reference-card-units.test.ts` (#119). PR-B3 không chép lại. `GroupDepositInput` là R3. Trước PR-B3 máy chủ bỏ qua trường này, không từ chối.

**Đột biến:**
- M32 (`recordPayment`), M33 (`confirmDeposit`), M35 (`checkIn`) bỏ kiểm sớm → đỏ.
- M37 (bộ đọc kiểm phương thức trước số thẻ) → đỏ.
- M34 (`createReservation`), M36 (`checkOut`) → **xanh**, là đột biến tương đương: hai đường này gom lỗi các trường rồi mới ném lỗi số thẻ của `initialPayment`/`finalPayment`, nên vốn đã báo số thẻ trước. Kiểm sớm ở đây chỉ giữ một luật chung cho cả 5 đường.
- Chạy lại sau khi thêm ca: M11 (mã đơn cho mọi vai) nay đỏ ở 2 ca (SAL `recordPayment`, SAL `confirmDeposit`); M14, M21–M24 đỏ.

## 10. PR-B3b – sửa theo review #148 (Phản hồi & sửa, ORC giao 07/11)

ARC, SEC, DOM đã duyệt #148 @ `a5911138`; #148 gộp nguyên trạng. Các thẻ còn lại làm ở PR tiếp theo, trước tag v1.0.5.

- Nhánh `r5-b3b`, cắt từ `a5911138`. Sau khi #148, #152, #154 lên `main`, nhánh gộp `origin/main` `dda49347` (merge `f5908503`, không rebase, không xung đột). PR nháp **#160** (`r5-b3b` → `main`); người review: SEC, ARC.
- Mỗi thẻ một commit. SEC 148-01 và ARC 148-01 chung một commit, theo ORC.
- Không làm (ORC dời v1.0.6):
  - SEC 148-02: luật S3 ở mức folio, làm cùng DOM 148-03;
  - yêu cầu thay thế "pha trộn";
  - `executeRefund` 409 khi không còn khoản chuyển khoản.
- DOM 148-07 (chữ `detail` của 409) không có trong danh sách ORC giao.

| Thẻ | Commit | Sửa |
|---|---|---|
| SEC 148-01 (Minor) + ARC 148-01 (Minor) | `1699caec` | Mã: hai điều kiện ở `refunds.service.ts`. Test: ca SEC P2, ca ARC P1, P2 |
| SEC 148-03 (Suggestion) | `a696030f` | Test: bản OWN của ca S2 |
| ARC 148-02 (Minor) | `eea96017` | Chỉ chú thích: `AFTER_CLOSURE_SQL`, `PaymentRowLite.after_closure`, `refundRouting` |
| ARC 148-03 (Suggestion) | `3b6093a9` | Test: các biên của "Có thể trùng" và của báo cọc đã xử lý. Sửa tên tệp ở đầu `v5-48-closed-booking-money.test.ts` |
| ARC 148-04 (Suggestion) | `42f65f96` | Chỉ chú thích ở `recordManual`: thứ tự khóa và điều kiện để không deadlock |
| ARC review #148 mục 2.1 (không phải thẻ) | `3162abf0` | Chỉ chú thích ở hai lời gọi kiểm sớm 1i tương đương (`createReservation`, `checkOut`) |

**SEC 148-01 – OWN là người gốc thì chi theo đường "tự chi".**
- `isOwnSelfPayout` thêm `OR $2::uuid = ANY(origin_actor_ids)`. Controller `executeTransfer` vì vậy đòi step-up (401 `REAUTH_REQUIRED`).
- `payOut` thêm `origin_actor_ids` vào `ownSelf`, nên audit `refund.paid` có cờ `ownSelfApprovedAndPaid: true`.
- Không đổi hợp đồng: mã 401 và cờ đã có từ PO 17/10.
- Phạm vi: `origin_actor_ids` hiện gồm người ghi sau khi đóng (5B-1) và người làm A32. `refundRouting` đã bỏ người làm A32 là OWN (`actor_role <> 'owner'`). Vì vậy điều kiện mới chỉ chạm OWN ghi tiền sau khi đóng.
- Test (ca P2 của SEC):
  - OWN ghi chuyển khoản 900.000 → yêu cầu 5B-1 400.000 đứng tên OWN. MGR từ chối, MGR2 tạo lại. FD đặt `original_method`, MGR duyệt, MGR đối soát.
  - OWN chi khi chưa step-up → 401, `refunded_vnd` = 0.
  - Step-up rồi chi → 201, audit `refund.paid` có `{recordedByRole: 'owner', ownSelfApprovedAndPaid: true}`.
  - Ca kiểm luôn rằng OWN không phải người tạo, người duyệt hay người đặt nơi nhận, mà chỉ là người gốc.

**ARC 148-01 – hai ca P1, P2 (theo ARC mục 4.2).**
- P1 (DOM 11.4 3b): FD ghi chuyển khoản 800.000 sau khi đóng → yêu cầu 5B-1 300.000. MGR đảo khoản thu → yêu cầu đó `cancelled`, `auto_cancel_reason = superseded`. Không có yêu cầu mới. Mục `closed_reservation_credit` đóng. Còn phải thu lại là 500.000.
- P2:
  - MGR ghi `card_pos` 100.000 khi đơn còn mở, rồi **đồng hồ tiến 5 phút**, rồi OTA hủy (N = 400.000).
  - FD ghi chuyển khoản 600.000 → yêu cầu 5B-1 200.000 có `origin_actor_ids = [FD]`, không có MGR. MGR duyệt được (200).
- Đầu tệp test có thêm câu dặn: ca nào ghi tiền rồi đóng đơn phải cho đồng hồ tiến, vì `AFTER_CLOSURE_SQL` so bằng `>=`.

**SEC 148-03 – bản OWN của ca S2.** OWN ghi chuyển khoản 900.000 sau khi đóng.
- OWN duyệt yêu cầu 5B-1 của chính mình → 403 `SELF_APPROVAL_FORBIDDEN`.
- MGR từ chối, MGR2 tạo lại. OWN duyệt yêu cầu mới → 403 `SELF_APPROVAL_FORBIDDEN` (người gốc).
- FD đặt nơi nhận `cash`, MGR duyệt. OWN chi tiền mặt → 403 `SELF_REFUND_FORBIDDEN`, chưa chi đồng nào. Ngoại lệ OWN chỉ áp cho chuyển khoản.
- Phần chuyển khoản (step-up, cờ) là ca của SEC 148-01.
- Yêu cầu tạo lại nhận được nơi nhận `cash` vì S3 chưa theo sang yêu cầu tạo lại. Đó là lỗ SEC 148-02, dời v1.0.6. Ca này chỉ dùng điều đó để kiểm chốt chi tiền mặt.

**ARC 148-02 – vì sao an toàn ở v1.0.5, và sửa chú thích.**
- Chú thích cũ của `AFTER_CLOSURE_SQL` ghi "không quyết định lúc ghi nào đọc biểu thức này". Câu đó sai: `refundRouting` (S2) đọc nó dưới L3 để đưa người ghi vào `origin_actor_ids`.
- Chú thích mới nói đúng điều đó, và ghi hạn chế: biểu thức theo trạng thái đơn **hiện tại**.
  - Đơn khôi phục (B12; 5B-2 `cancelled → hold`) đọc ra `false`. Yêu cầu hoàn tạo tay sau đó không còn chặn người ghi.
  - Yêu cầu thay thế vẫn giữ người ghi, qua `carriedOrigin`.
- Vì sao chấp nhận ở v1.0.5:
  - FD không duyệt hoàn, nên chỉ MGR là người ghi mới có lợi gì;
  - B12 cần MGR+;
  - tiền chỉ chi khi khoản thu đã đối soát.
- 5B-2 (v1.0.6) thay bằng dấu lưu lúc ghi, theo thiết kế ARC 0.3.14. Chú thích dặn không đặt thêm quyết định lúc ghi nào lên biểu thức này.
- Không đổi mã, không thêm test: hạn chế này là hành vi đã biết, sẽ thay ở 5B-2.

**ARC 148-03 – các biên.** Một ca mới, chạy theo đồng hồ của riêng nó:
- (A7) hai khoản chuyển khoản cùng số trên **cùng** một đơn → không có cờ;
- (A19) khoản `card_pos` và tiền mặt cùng số ở đơn khác → không đơn nào có cờ, kể cả khoản thẻ. Đối chứng: thêm một khoản chuyển khoản cùng số ở đơn thứ ba → khoản chuyển khoản có cờ;
- (A9) đơn OTA có khoản chuyển khoản ghi **trước** khi hủy. Khoản đó vẫn có cờ ở `Payment`. Yêu cầu hoàn do lệnh hủy tự tạo (150.000) thì **không** có `possibleDuplicateCodes`;
- (A5) khoản thu thứ hai sau khi đóng trên `hS` không ghi đè `handled_payment_id` của báo đã `handled`;
- (A8) hai khoản cùng số cách nhau 25 giờ → không cờ. Hai khoản cùng giờ ở hai đơn khác → có cờ cho nhau.

**Đột biến PR-B3b** (`mutate-b3b.py`). Mỗi đột biến chạy riêng trên `pr-b3-after-closure.test.ts`, rồi trả mã về:

| # | Đột biến | Kết quả |
|---|---|---|
| B1 | `isOwnSelfPayout` bỏ điều kiện `origin_actor_ids` | đỏ (ca SEC 148-01) |
| B2 | `ownSelf` bỏ điều kiện `origin_actor_ids` | đỏ (ca SEC 148-01) |
| B3 | `payOut` chặn luôn OWN người gốc chi chuyển khoản (SEC S7, ARC A3) | đỏ |
| B4 | `refundRouting` bỏ OWN ghi sau khi đóng (SEC S10) | đỏ (2 ca) |
| B5 | `refundRouting` thêm mọi người ghi của folio (ARC A1) | đỏ (P2) |
| B6 | đảo khoản không xử lý yêu cầu hoàn đi kèm | đỏ (P1) |
| B7 | đảo khoản không đóng mục `closed_reservation_credit` | đỏ (P1) |
| B8 | báo đã `handled` bị khoản thu sau ghi đè (ARC A5) | đỏ |
| B9 | "Có thể trùng" tính cả cùng đơn (ARC A7) | đỏ |
| B10 | khung 24 giờ thành 48 giờ (ARC A8) | đỏ |
| B11 | cờ ở yêu cầu hoàn xét mọi khoản thu của folio (ARC A9) | đỏ |
| B12 | khoản thẻ/tiền mặt cũng nhận cờ (ARC A19, vế ngoài) | đỏ |
| B13 | khoản thẻ/tiền mặt được tính là khoản trùng (ARC A19, vế trong) | đỏ (3 ca) |
| B14 | `approve` cho OWN người gốc duyệt | đỏ (ca SEC 148-03) |
| B15 | `payOut` cho OWN người gốc chi tiền mặt | đỏ (ca SEC 148-03) |

Kết quả: 15/15 đỏ. Các đột biến sống ở review #148 nay đều đỏ: SEC S7 và S10 (B3, B4, B14); ARC A1, A5, A7, A8, A9, A19 (B5, B8–B13).

**Kết quả chạy** (trên `f5908503` = 6 commit của PR-B3b + gộp `main` `dda49347`):
- `tsc --noEmit` (src + test) sạch. ESLint và Prettier sạch trên các tệp đã sửa.
- `pr-b3-after-closure.test.ts`: 18/18 xanh (5 ca mới).
- Toàn bộ API Vitest trên PostgreSQL 17 tạm, database mới: **221 tệp qua, 2 bỏ qua; 5.208 test qua, 19 bỏ qua, 1 todo**. Không ca nào đỏ hay chập chờn.
- Đột biến: B1–B15 chạy lại trên cây đã gộp, cả 15 đỏ. M1–M37 của #148 cũng chạy lại, kết quả như ở #148: chỉ M5 (đứng riêng) và hai đột biến tương đương M34, M36 sống.
