# ARC review PR #148 (BE-D2) – `r5-b3`, PR-B3: V5-5B 5B-1 "tiền về sau khi đóng đơn"

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- PR: [#148](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/148), nhánh `r5-b3`, `base = main`, head **`a5911138`**. CI 9/9 job xanh, kể cả `docker images build · E2E smoke`.
- Quy mô (so với điểm gộp `d6efc170`): 31 tệp; 25 tệp `src` (+645/−61), 5 tệp test, 1 báo cáo. **Không migration**. Không sửa `openapi.yaml`, tệp sinh hay `strings.js`.
- Đối chiếu:
  - hợp đồng 0.3.13: mục 1.21 ý 3 (`recordPayment` (B)), bổ sung 1e, 1f, 1g (`main`), bổ sung 1i (#152 @ `ca276f8a`: C0313-31 phương án B, danh sách test C0313-32);
  - thẻ ARC FB-R5-ARC-BE-105-03 (trả lời DOM FB-R5-DOM-ARC-105-01), FB-R5-ARC-BE-119-01;
  - `rounds/round-05/outputs/BE/pr-b3.md`, mô tả PR, `BE-on-contract-0313-addendum-1i.md` (C0313-34…38);
  - `DOM-on-be-d2-pr-148.md` (`38b1f476`) và `SEC-on-be-d2-pr-148.md` (`f9127735`). Hai bản này lên `main` khi ARC đã chạy xong phần kiểm. ARC không lặp thẻ của DOM, SEC; mục 5 nêu ý kiến ARC về các thẻ gửi ARC.
- Cách kiểm:
  - ref riêng `refs/arc-review/pr148`, `refs/arc-review/pr152`; hai worktree tạm trong scratchpad (một cho gộp thử và chạy đủ, một cho đột biến). Không checkout nhánh PR trong thư mục chính, không push vào nhánh PR.
  - PostgreSQL 17 tạm: container `ottimo-arc148-pg`, chỉ nghe `127.0.0.1`, mật khẩu là mật khẩu CI công khai của repo. Một database cho lần chạy đủ, một database riêng cho đột biến.
  - Container, worktree và ref tạm đã xóa sau review. Không gọi staging hay production. Tệp này không có bí mật, số hoa hồng, số thưởng hay dữ liệu khách. Số tiền trong tệp là số thử của fixture.

---

## 0. Kết luận

| PR @ SHA | Kết luận ARC | Ghi chú gộp | Thẻ ARC |
|---|---|---|---|
| **#148 @ `a5911138`** | **DUYỆT** | Gộp sau #152 (hợp đồng trước mã). DOM và SEC đã DUYỆT. Gộp bằng merge commit, như lịch sử nhánh | 148-01, 148-02 (Minor); 148-03, 148-04, 148-05 (Suggestion) |

- Mã khớp hợp đồng ở mọi điểm ARC đối chiếu (mục 1). 105-03 làm đủ 9 ý. 1i làm đủ: số thẻ ở `bankReference` báo trước, một mình, ở cả 5 đường.
- Không migration. Mọi thứ PR cần đã có trên `main`:
  - cột `payment.bank_reference` và CHECK mẫu `^[A-Za-z0-9./_-]{1,64}$` từ 0040;
  - kind `deposit_after_cancel` của thông báo và "Cần chú ý" từ 0030 (CHECK cập nhật tới 0093);
  - CHECK `approval_request_origin_check` từ 0085. Luật S2 "người ghi không duyệt" vì vậy được giữ cả ở DB.
- Gộp thử trên `main` @ `37bb196d`: git tự gộp, không xung đột. `tsc --noEmit` (src + test) sạch. Toàn bộ API Vitest: **220 tệp qua, 2 tự bỏ qua; 5180 ca qua, 19 bỏ qua, 1 todo, 0 hỏng** (318 s).
  - Từ `37bb196d` tới `main` lúc viết (`49eaa33f`) chỉ thêm 5 tệp review, không đổi gì trong `product/`. Kết quả trên vẫn áp.
- Đột biến của ARC: 18 đột biến khác với 37 đột biến của BE-D2 và 17 của SEC. 8 đỏ, 3 tương đương, 7 sống dù mã đúng (mục 4).
  - ARC viết thử hai ca P1, P2 (mục 4.2). Cả hai xanh trên mã hiện tại. P2 làm đỏ đột biến A1. Thẻ 148-01 đề nghị đưa hai ca này vào bộ test.
  - Thiếu test, không phải lỗi mã, nên không chặn gộp.
- Trả lời 7 điểm BE-D2 hỏi: mục 2. Tóm tắt:
  - giữ kiểm sớm 1i ở cả 5 đường;
  - đồng ý tách `recordInTxWithDue` và mở rộng `refundRouting` (kèm 148-02);
  - **giữ thứ tự khóa mới** (khóa tư vấn → `doc_sequence`);
  - ba hạn chế: hạn chế 1 và 2 sang v1.0.6 cùng 5B-2; hạn chế 3 **không có thật**, vì truy vấn con đã đi qua chỉ mục sẵn có;
  - C0313-38 theo DOM, ARC sửa chữ ở 0.3.14;
  - đúng khi đổi `deposit` → `charge` ở 3 ca của #144, #139;
  - SEC 127-02 đúng về kỹ thuật.

---

## 1. Đối chiếu hợp đồng

| Điểm hợp đồng | Mã #148 | Kết quả |
|---|---|---|
| 105-03 bước 1: N = `balanceDueVnd` đọc ngay sau L3 | `recordInTxWithDue`: `owed` đọc ngay sau `lockForPosting`, trước kiểm `receivedAt`; trả `dueBeforeVnd` | Khớp. t5 (hai `card_pos` đua trên L3) đỏ khi bỏ trần |
| Bước 2–3: `card_pos` khi N > 0, `amountVnd` ≤ N; N = 0 → `method` NOT_IN_LIST | `capToDue` truyền từ `recordAfterClosure`, kiểm sau khi có N | Khớp (t1–t3, t7) |
| Bước 4: `posAuthCode` bắt buộc, không bắt ảnh phiếu POS | `!attachmentId && !card`; ảnh gửi kèm vẫn qua luật ảnh của sale | Khớp. ARC A11 đỏ 4 ca |
| Bước 5: `cash`, `ota_collect` → 422 kể cả N > 0 | `AFTER_CLOSURE_METHODS` + `card` | Khớp (t6) |
| Bước 6: hoàn = max(0, `amountVnd` − N) | `afterClosureRefundVnd`. `balanceDueVnd` đã kẹp ≥ 0 nên `max(0, N)` bên trong là phòng thủ | Khớp (t4) |
| (B) `type` theo `status_before_cancel` | `afterClosureType`, đọc qua `DepositTarget.statusBeforeCancel` dưới khóa đơn | Khớp. ARC A18 (bỏ trường ở adapter) đỏ 11 ca |
| (B) yêu cầu `payment_after_cancel` đứng tên người ghi, người ghi vào `origin_actor_ids` (S2) | `createAfterClosureRefund` + `refundRouting` thêm mọi người ghi sau khi đóng của folio | Khớp. Xem 148-01, 148-02 |
| (B) nơi nhận `original_method` cố định, `setRefundDestination` → 409, tiền mặt → 409 (S3) | `serverFixedDestination`, UPDATE ngay khi tạo, audit `refund.destination_set` | Khớp cho yêu cầu 5B-1. Yêu cầu tạo lại và yêu cầu thay thế: SEC 148-02, DOM 148-03 (v1.0.6) |
| (B) `executeRefund` về khoản chuyển khoản/VietQR, chỉ khi đã đối soát | lọc `method IN (bank_transfer, vietqr)` khi `fixed`; `payableCreditVnd` | Khớp. ARC A2 đỏ |
| (B) "Có thể trùng" trên `Payment` và `ApprovalRequest`, FD+ | `POSSIBLE_DUPLICATES_SQL`; `refundDuplicateCodes` một truy vấn mỗi trang, qua cổng `provideRefundDuplicates` (không đọc chéo bảng) | Khớp. Biên chưa có ca: 148-03 |
| (B) `bankReference` 5 đường, chữ hoa, khóa tư vấn trước câu kiểm trùng, chỉ so khoản thu, FD+ mới có `duplicateReservationCode` | `readBankReference` (một bộ đọc), chốt ở `recordManual`, `assertBankReferenceFree` | Khớp |
| 1i C0313-31 (B): số thẻ ở ô mã báo trước, một mình | `assertBankReferenceNotCardFirst` trên thân thô ở cả 5 bộ đọc | Khớp |
| C0313-32 (i)–(iv) | Có đủ, kể cả SAL `confirmDeposit` 409 không mã đơn và ca thứ tự ở cả 5 đường | Khớp |
| `createDepositNotice` trên đơn đã đóng → 202, một mục `deposit_after_cancel`, báo FD+, không ghi tiền (S7) | `closedStatusOf`, `openAttention` có khóa trùng, `notifyStaff` chỉ mã đơn | Khớp |
| "Không thấy tiền" (S8, ARC-20) | `requireReason`, audit `attention_event.resolved` `after = {kind, afterClosure}`, đăng ký thực thể cho api và worker, `AFTER_CLOSURE_ACTIONS` | Khớp |
| `Payment.refundRequestId` chưa trả tới 0.3.14 (1e) | Không trả | Khớp |

Ghi chú hiệu năng (ngân sách p95 < 300 ms):
- Mỗi lần đọc folio hoặc danh sách khoản thu, mỗi dòng khoản thu chạy thêm hai truy vấn con: `AFTER_CLOSURE_SQL` (đã có từ #105) và "Có thể trùng".
- ARC chạy `EXPLAIN` trên database gộp thử (2507 khoản thu). Truy vấn con "Có thể trùng" dùng **`payment_list_idx (property_id, received_at, id)`** (migration 0040), quét theo khoảng `received_at` ± 24 giờ, rồi nối `reservation_pkey`. Không quét cả bảng.
- `listApprovalRequests`: một truy vấn cho cả trang. Không có N+1.

---

## 2. Trả lời các điểm BE-D2 hỏi

### 2.1 Kiểm sớm 1i (C0313-34): giữ ở cả 5 đường

- **ARC chốt: giữ lời gọi `assertBankReferenceNotCardFirst` ở cả 5 bộ đọc.** Đây là phần mã thêm hợp lệ của 1i. Chữ "PR-B3 không đổi mã" của 1i sai, ARC sửa ở 0.3.14 (BE C0313-34, mục 6).
- Ở `recordPayment`, `confirmDeposit`, `checkIn`, hàm này là bắt buộc. Thiếu nó thì (iv) đỏ (M32, M33, M35 của BE).
- ARC tự kiểm hai đường kia: bỏ lời gọi ở `checkOut` (A15) và ở `createReservation` (A16), cả hai còn xanh. Như vậy M34, M36 đúng là đột biến tương đương **trên mã hôm nay**.
- Vẫn giữ, vì ba lý do:
  - một luật chạy ở một chỗ cho cả 5 đường;
  - nếu sau này `readInput` hay `parseInitialPayment` đổi thứ tự (ví dụ thêm một lần ném sớm), luật 1i không lặng lẽ hỏng;
  - chi phí bằng 0: hàm chỉ đọc thân, không truy vấn.
- Nếu BE-D2 sửa #148 thêm lần nữa thì thêm một dòng chú thích ở hai chỗ đó: "tương đương hôm nay (M34/M36), giữ để một luật cho 5 đường". Không bắt buộc.

### 2.2 Tách `recordInTxWithDue` (N đọc sau L3): đồng ý

- `recordInTx` giữ chữ ký cũ và gọi `recordInTxWithDue`. Người gọi cũ không đổi gì.
- `owed` chuyển lên ngay sau khóa folio, trước kiểm `receivedAt`. Giữa chỗ cũ và chỗ mới không có câu ghi nào, nên kết quả của đường cũ giữ nguyên. Lần chạy đủ bộ 5180 ca xanh xác nhận điều này.
- `dueBeforeVnd` lấy đúng `owed`, tức `outstandingCapVnd ?? balanceDueVnd`. Chỉ `recordAfterClosure` đọc giá trị này, và đường đó không truyền `outstandingCapVnd`. Đúng.

### 2.3 `refundRouting` mở rộng: đồng ý, kèm hai việc

- Cách làm đúng mẫu A32 (`folio_settled_reduction`). Luật S2 vì vậy theo mọi yêu cầu mới của folio, kể cả yêu cầu tạo lại sau khi bị từ chối. `carriedOrigin` chép `origin_actor_ids` sang yêu cầu thay thế.
- **Thiếu ca chứng minh người ghi trước khi đóng không bị thêm.** ARC bỏ điều kiện `AFTER_CLOSURE_SQL` trong câu đọc người ghi (A1). Khi đó mọi người từng ghi tiền trên folio đều vào `origin_actor_ids`. Đột biến này **sống** qua 24 tệp test có "refund" và "approve" (366 ca).
  - Hậu quả nếu lỗi này xảy ra: MGR ghi cọc bình thường, đơn hủy, MGR không duyệt được yêu cầu hoàn BR-309 của chính đơn đó.
  - Ca P2 của ARC làm đỏ A1 → thẻ **148-01**.
- **Câu đọc này là một quyết định lúc ghi, nhưng dùng biểu thức "chỉ để hiển thị"** → thẻ **148-02**.

### 2.4 Thứ tự khóa trong `recordManual`: giữ thứ tự mới

**ARC chốt: giữ thứ tự khóa tư vấn (cơ sở, mã) → kiểm trùng → số `PT-` (`doc_sequence`) → INSERT. Không đổi lại.**

- Lý do:
  - Theo thứ tự cũ, luật "một mã một khoản thu" đúng chỉ nhờ một chi tiết của bộ đánh số: mọi khoản thu của cơ sở xếp hàng trên dòng `doc_sequence`. Đổi cách cấp số (ví dụ dùng `sequence` của PostgreSQL, không khóa dòng) là luật trùng hỏng mà không test nào biết.
  - Thứ tự mới đúng ý hợp đồng 1e: khóa của (cơ sở, mã) là khóa đầu tiên hai khoản cùng mã gặp nhau. Ca đua của PR (giữ khóa bằng kết nối riêng, chờ tới khi cả hai bước bị chặn) kiểm đúng điều này, và M30 bắt được thứ tự cũ.
- Rủi ro deadlock BE-D2 nêu, ARC đã dò:
  - Có 6 chỗ gọi `allocate(tx, 'payment')`. Trên mã v1.0.5, **không đường nào cấp số `payment` trước rồi mới ghi một khoản thu có mã trong cùng giao dịch**:
    - `checkOut`: ghi `finalPayment` (dòng 1377) trước `resyncOtaCollect` (dòng 1413);
    - `createReservation`: `recordInitialPayment` (894) trước khi đăng dòng (`posted`, 974);
    - `confirmDeposit`: `recordManual` (235) trước `onReservationConfirmed` (334);
    - VietQR, chi hoàn, đảo khoản không ghi khoản thu có mã sau khi cấp số.
  - Vậy deadlock chỉ có ở một đường **tương lai**. Nếu xảy ra, PostgreSQL hủy một bên, `concurrencyProblem` đổi 40P01 thành 409 `CONCURRENT_UPDATE` + `Retry-After: 1`. Gửi lại thì nhận 409 `DUPLICATE_BANK_REFERENCE`. Không bao giờ có khoản thu đôi.
- Việc kèm theo:
  - ARC thêm luật vào danh sách thứ tự khóa ở `architecture.md` (0.3.14): "khóa tư vấn `bank-ref` sau L1/L3, trước `doc_sequence`; giao dịch ghi khoản thu có mã thì ghi trước khi cấp số `payment` khác";
  - BE thêm một dòng chú thích ở `recordManual` nói đúng luật đó (thẻ 148-04).

### 2.5 Ba hạn chế đã biết

1. **Yêu cầu thay thế "pha trộn" làm mất nơi nhận cố định.** ARC đọc mã, xác nhận đúng như BE-D2 và DOM tả:
   - `peekCarryableDestination` trả null khi nơi nhận khác nhau;
   - yêu cầu thay thế mang `reasonCode = overpayment`, nên `serverFixedDestination` trả false.
   
   Chốt còn lại: chỉ chi được tiền đã đối soát (`payableCreditVnd`); người ghi vẫn ở `origin_actor_ids` (chép qua `carriedOrigin`, `refundRouting` thêm lại); "Có thể trùng" vẫn hiện, vì `refundDuplicateCodes` theo đơn đích, không theo lý do. ARC đồng ý hướng của DOM 148-03 và SEC 148-02 cho v1.0.6, xem mục 5.
2. **Folio không còn khoản chuyển khoản → `executeRefund` 409.** Lỗi an toàn: không có tiền nào ra. Ca thật duy nhất là khi khoản chuyển khoản nguồn bị đảo mà yêu cầu cố định vẫn còn mở (DOM 148-03 (ii)). Câu `detail` nên nói đúng ca này (DOM 148-07). Không đổi mã lỗi.
3. **Truy vấn "Có thể trùng" không có chỉ mục mới: không phải hạn chế.** Như mục 1, truy vấn con đã đi theo `payment_list_idx` của 0040. **Đóng điểm này, v1.0.6 không cần chỉ mục `(property_id, amount_vnd)`.**
   - Câu kiểm trùng `bankReference` lúc ghi thì không có chỉ mục theo mã: nó quét các khoản thu của cơ sở, theo tiền tố `property_id`, dưới khóa tư vấn. Ở 10 căn, vài nghìn khoản mỗi năm, như vậy là đủ.
   - Unique index một phần ở DB vẫn là việc v1.0.6, không bắt buộc, như hợp đồng 1e đã ghi.

### 2.6 `deposit_after_cancel` đóng lúc nào (C0313-38)

- DOM đã chốt ở `DOM-on-be-d2-pr-148.md` mục 1: dùng câu của `createDepositNotice`, đúng như #148 đang làm. Mục đóng khi đơn có khoản thu ghi sau lúc đóng đơn, trong lúc mục còn mở, hoặc khi FD+ bấm "Không thấy tiền".
- **ARC theo DOM. #148 không đổi mã.** ARC sửa ở 0.3.14:
  - `recordPayment` (B): thay gạch "đóng khi đã hoàn xong…" bằng chữ DOM 1.3;
  - `createDepositNotice`: thêm vế "khoản thu ghi **trước** lúc báo không đóng mục";
  - `contract-0.3.13.md` 1.21 ý 4 (5B-2): bỏ vế "`deposit_after_cancel` đóng khi đã khôi phục **và** khoản thu đã đối soát". Khoản thu của lần khôi phục tự đóng mục ngay lúc ghi.
- QA viết ca (e') theo DOM 1.1.

### 2.7 Ca test của làn khác đổi `deposit` → `charge`: đúng

| Ca | Đơn trước khi hủy | Vì sao `charge` đúng |
|---|---|---|
| #144 `v5-48-arc-followups` 105-01 | `confirmed('301', …)` rồi hủy `found_other` | Luật 5B-1: chỉ giữ chỗ hủy mới nhận `deposit`. Giữ `deposit` thì 201 thành 422 `type` NOT_ALLOWED. Điều ca kiểm (`afterClosure` theo giờ máy chủ ghi, không theo `receivedAt`) không đổi |
| #139 `v5-48-closed-booking-money` 139-02 | Tạo với `initialPayment` cọc tiền mặt đủ, tức `confirmed`, rồi hủy | Ca so khớp đúng danh sách lỗi (`toEqual([{attachmentId, NOT_IN_LIST}])`). Giữ `deposit` thì thêm lỗi `type`, ca đỏ vì lý do khác. Điều ca kiểm (ảnh CTV) không đổi |
| #139 SEC 6 (a) | `confirmed('302', …)` rồi hủy | Như trên |

- Cả ba đổi đúng, ý của ca giữ nguyên. Ca (h1) thêm câu kiểm N = 0 trước khi chờ `card_pos` → NOT_IN_LIST. Thêm như vậy là đúng 105-03 ý 9, và làm ca không phụ thuộc dữ liệu mẫu.
- Một lỗi chữ nhỏ: chú thích đầu tệp `v5-48-closed-booking-money.test.ts` trỏ tới `v5-5b1-after-closure.test.ts`, tệp thật là `pr-b3-after-closure.test.ts` (gộp vào 148-03).
- ORC báo BE-B rằng ca của làn BE-B đã đổi.

### 2.8 SEC 127-02 (`accountHolder` qua `stripControlChars`): đúng

- Bỏ bộ lọc riêng C0 + DEL, dùng bộ lọc chung SR-INP-05 (Cc, Cf gồm ký tự đảo chiều, ký tự mặc định bỏ qua). Có ca 3 × U+2060 → 422 `REQUIRED` và U+202E bị bỏ trước khi lưu (M19 của BE đỏ).
- Lợi thêm: `accountHolder` không phải chuỗi giờ trả 422 `REQUIRED`. Mã cũ gọi `?.replace` trên số thì ném `TypeError`, thành 500.
- SEC đóng thẻ của SEC.

---

## 3. Gộp thử và chạy đủ bộ API

- `refs/arc-review/pr148` (`a5911138`) gộp `origin/main` @ `37bb196d` (51 commit, có #146, #149, #151, #153, #154 và các review). Git tự gộp, không xung đột.
- Có hai chỗ `main` chạm vùng PR, cả hai gộp sạch:
  - `audit-log.controller.ts`: #149 thêm cổng hiển thị audit; PR thêm `attention_event.resolved` vào `AFTER_CLOSURE_ACTIONS`;
  - `approvals-refund-payout.test.ts`: `withoutRandomIds`.
- `pnpm install --frozen-lockfile`, dựng `@ottimo/integrations`, `@ottimo/contracts`; `tsc -p tsconfig.json --noEmit`: sạch.
- `vitest run` toàn bộ API trên PostgreSQL 17 tạm (vai `ottimo_app`, migration bằng `ottimo_migrator`, database bootstrap riêng): **220 tệp qua, 2 tự bỏ qua; 5180 ca qua, 19 bỏ qua, 1 todo, 0 hỏng.** Hai ca chập chờn BE-D2 gặp ở `d7cc3c8e` (`sec-be65-retention` 6b, `v5-58-property-wifi` T58-13) không tái hiện. `main` đã sửa hai tệp này ở `37bb196d`.
- Ca chặn số thẻ trong `pr-b3-bank-reference.test.ts` dò chuỗi 16 chữ số trên cả thân phản hồi. Khó trùng ngẫu nhiên với `requestId`, nên không cần `withoutRandomIds`. Ca dò mã đơn (`not.toContain(d1.code)`) cũng vậy.

---

## 4. Đột biến của ARC

Chạy trên cây gộp thử, mỗi lần một chỗ sửa. Chạy 5 tệp của PR (`pr-b3-after-closure`, `pr-b3-bank-reference`, `pr-b3-units`, `v5-48-closed-booking-money`, `v5-48-arc-followups`; 45 ca), rồi trả mã về. Không lặp các đột biến BE-D2 (M1–M37) và SEC (S1–S17) đã chạy.

### 4.1 Kết quả

| # | Đột biến | Kết quả |
|---|---|---|
| A1 | `refundRouting` thêm **mọi** người ghi của folio (bỏ `AFTER_CLOSURE_SQL`) | **sống**, kể cả qua 24 tệp refund/approve (366 ca) → P2 đỏ → 148-01 |
| A2 | `executeRefund` bỏ lọc "chỉ khoản chuyển khoản" khi nơi nhận cố định | đỏ (2 ca) |
| A3 | `payOut` bỏ ngoại lệ OWN cho người trong `origin_actor_ids` | **sống** – trùng SEC S7, thẻ SEC 148-03 |
| A4 | `createAfterClosureRefund` không ghi audit `refund.destination_set` | đỏ (2 ca: t4, S4) |
| A5 | Câu chuyển báo thành `handled` bỏ `status = 'open'` (ghi đè `handled_payment_id` của báo đã xử lý) | **sống** → 148-03 |
| A6 | Tin `deposit_after_cancel` không loại người báo | sống, **tương đương**: `createDepositNotice` chỉ cho SAL, CTV, mà tin chỉ gửi FD+ |
| A7 | "Có thể trùng" bỏ điều kiện "ở đơn khác" | **sống** → 148-03 (liên quan DOM 148-05) |
| A8 | "Có thể trùng" nới khung 24 giờ thành 48 giờ | **sống** → 148-03 |
| A9 | `ApprovalRequest.possibleDuplicateCodes` xét mọi khoản thu của folio, không chỉ khoản sau khi đóng | **sống** → 148-03 |
| A10 | Audit `deposit_notice.created` bỏ `afterClosure: true` | đỏ (S7, S8) |
| A11 | `card_pos` sau khi đóng bắt ảnh như chuyển khoản | đỏ (4 ca) |
| A12 | Kiểm trùng mã bỏ `status = 'succeeded'` | đỏ |
| A13 | "Có thể trùng" bỏ `dup.status = 'succeeded'` | đỏ |
| A15 | `checkOut` bỏ kiểm sớm 1i | sống, **tương đương** (xác nhận M36) |
| A16 | `createReservation` bỏ kiểm sớm 1i | sống, **tương đương** (xác nhận M34) |
| A17 | `setRefundDestination` bỏ 409 của nơi nhận cố định | đỏ (2 ca) |
| A18 | Adapter không trả `statusBeforeCancel` | đỏ (11 ca) |
| A19 | "Có thể trùng" tính cho khoản thu mọi phương thức (thẻ, tiền mặt) | **sống** → 148-03 |

Một lần thử A4 khác (đổi tên action) ném lỗi vì action ngoài tập `money`. ARC không tính lần đó, vì đỏ do ném lỗi chứ không do ca bắt được. A4 ở bảng là bản bỏ hẳn lời gọi audit.

### 4.2 Hai ca ARC viết thử (P1, P2)

ARC chép vào cuối `pr-b3-after-closure.test.ts`, chỉ trong worktree đột biến. Cả hai dùng fixture của tệp và đồng hồ giả. Cả hai **xanh** trên mã hiện tại.

- **P1 – DOM 11.4 3b, ca đơn giản:**
  - đơn OTA hủy có phí 500.000; FD ghi chuyển khoản 800.000 → yêu cầu 5B-1 300.000 `pending`;
  - MGR đảo khoản thu → yêu cầu đó `cancelled` (`superseded`), không sinh yêu cầu mới, mục `closed_reservation_credit` đóng.
  
  Hành vi này đến từ `reconcileRefundsAfterReversal` sẵn có. Hợp đồng (B) hứa "yêu cầu hoàn đi kèm tự `superseded`" nhưng chưa ca nào ghim. P1 ghim nó. Biến thể nhiều yêu cầu là DOM 148-03 (ii).
- **P2 – người ghi trước khi đóng không vào `origin_actor_ids`:**
  - MGR ghi `card_pos` 100.000 khi đơn còn mở; **đồng hồ tiến 5 phút**; hủy có phí 500.000 (N = 400.000);
  - FD ghi chuyển khoản N + 200.000 → yêu cầu 5B-1 có `origin_actor_ids = [FD]`, không có MGR.
  
  P2 làm đỏ A1.
- Lần viết đầu, P2 không cho đồng hồ tiến giữa khoản thu và lúc hủy. Kết quả: MGR **có** trong `origin_actor_ids`. Lý do: `AFTER_CLOSURE_SQL` so `p.created_at >= cancelled_at`, mà khoản thu và lệnh hủy cùng một giờ giả.
  - Trên production giờ thật khác nhau ít nhất vài mili giây, nên đây không phải lỗi.
  - Nhưng ca test nào ghi tiền rồi hủy ở cùng một giờ giả sẽ thấy người ghi trước khi đóng bị tính là người ghi sau khi đóng. Ca mới phải cho đồng hồ tiến (ghi ở 148-01).

---

## 5. Ý kiến ARC về các thẻ DOM và SEC gửi ARC

| Thẻ | ARC |
|---|---|
| **DOM FB-R5-DOM-ARC-148-02** (Desk không biết gửi `type` nào) | **Đồng ý. ARC chốt:** thêm `Reservation.cancellation.cancelledFrom` (`hold` \| `confirmed`), chỉ FD+ (`x-visible-to`), đọc từ `reservation.status_before_cancel` (cột đã có, không migration). Vắng khi đơn chưa hủy. Đơn `no_show` không có trường này, Desk gửi `charge`. Desk: `cancelledFrom === 'hold'` → `deposit`, còn lại → `charge`. ARC ghi ở bổ sung kế tiếp (1j) **trước PR Desk 5B-1 của FE-A**. BE thêm trường vào `reservation-dto.ts` (≤ 0,1 ngày), có thể làm ở PR nhỏ sau #148. Không chặn #148 |
| **DOM FB-R5-DOM-BE-148-03** và **SEC FB-R5-SEC-BE-148-02** (S3 với yêu cầu tạo lại và yêu cầu thay thế; đảo khoản nguồn) | **Đồng ý hướng, v1.0.6, làm cùng 5B-2 (0.3.14).** Thiết kế ARC sẽ ghi: (i) luật S3 ở mức folio, đặt ở `submit` qua `refundRouting` – folio có khoản chuyển khoản/VietQR ghi sau khi đóng, chưa đảo → mọi yêu cầu mới (tạo lại, thay thế) nhận `original_method` do máy chủ đặt, có audit `refund.destination_set`. Luật chặt thắng, như DOM đề xuất; (ii) đảo khoản thu sau khi đóng → đóng trước yêu cầu sinh từ chính khoản đó, dùng cột nối của migration 5B-2 (`Payment.refundRequestId`, 1e); (iii) dấu "ghi sau khi đóng" lưu lúc ghi, không tính lúc đọc (thẻ 148-02). Tới đó: câu sổ tay DOM 148-04 ý 2, lời dặn người duyệt của SEC |
| **SEC FB-R5-SEC-BE-148-01** (OWN là người gốc chi chuyển khoản mà không xác thực lại, không cờ) | Đồng ý về kỹ thuật: hai điều kiện SEC đề xuất (`isOwnSelfPayout` thêm `origin_actor_ids`; `ownSelf` thêm `origin_actor_ids`) đúng chỗ, không đổi hợp đồng (cờ `ownSelfApprovedAndPaid` và 401 `REAUTH_REQUIRED` đã có). **ARC đề nghị BE-D2 làm trong #148, cùng một commit với SEC 148-03 và ARC 148-01**, nếu không làm trễ việc gộp; không thì một PR nhỏ trước tag v1.0.5. ORC chọn |
| DOM FB-R5-DOM-BE-148-05 (trùng trên cùng đơn) | Đồng ý là hở của luật DOM 3a, không phải lỗi #148. ARC A7 cho thấy điều kiện "ở đơn khác" hiện chưa có ca ghim (148-03). Nhánh mới "cùng đơn, cả hai sau khi đóng" là đổi chữ hợp đồng – ARC ghi ở 0.3.14 nếu PO xếp v1.0.6 |
| DOM FB-R5-DOM-BE-148-07 (chữ `detail` của 409) | Đồng ý: khi nơi nhận cố định, `detail` nói "không còn khoản chuyển khoản để hoàn về", không nói "dùng `executeCashRefund`". Giữ 409 `INVALID_TRANSITION`. Không đổi hợp đồng |

---

## 6. Thẻ feedback

### FB-R5-ARC-BE-148-01
- Mức độ: Minor – BE-D2. Trước tag v1.0.5; tốt nhất cùng commit với SEC 148-01/148-03. Không chặn gộp.
- Vị trí: `test/integration/pr-b3-after-closure.test.ts`; `folio.service.ts` `refundRouting` (câu đọc `late`); `reconcileRefundsAfterReversal`.
- Vấn đề:
  - A1 sống. Không ca nào chứng minh người ghi tiền **trước** khi đóng đơn không bị thêm vào `origin_actor_ids`. Cả 24 tệp test refund/approve cũng không bắt được. Ca t4 kiểm `origin_actor_ids = [FD]`, nhưng folio của ca đó không có khoản thu nào trước khi đóng.
  - Hứa hẹn "đảo khoản thu sau khi đóng → yêu cầu đi kèm tự `superseded`" của (B) và DOM 3b chưa có ca ghim ở #148. ARC P1 xanh trên mã hiện tại.
- Vì sao quan trọng: người sửa `refundRouting` ở 5B-2 (BE đã báo "5B-2 cần xem lại") có thể bỏ điều kiện này mà không ca nào đỏ. Khi đó MGR ghi cọc thường thì không duyệt được hoàn BR-309 của chính đơn đó, và với chủ đầu tư thì luồng duyệt hoàn tắc.
- Đề xuất sửa: thêm hai ca theo mục 4.2:
  - P2: MGR ghi `card_pos` trước khi hủy, **đồng hồ tiến** rồi mới hủy; FD ghi chuyển khoản sau khi đóng → `origin_actor_ids = [FD]`. Thêm: MGR duyệt yêu cầu 5B-1 đó → 200;
  - P1: đảo khoản chuyển khoản sau khi đóng → yêu cầu 5B-1 `cancelled`, không có yêu cầu mới, `closed_reservation_credit` đóng.
  - Ghi chú ở đầu tệp: ca nào ghi tiền rồi hủy phải cho đồng hồ tiến, vì `AFTER_CLOSURE_SQL` so bằng `>=`.
- Trạng thái: Open

### FB-R5-ARC-BE-148-02
- Mức độ: Minor – BE-D2 (chú thích, ngay), ARC (chữ hợp đồng 0.3.14), BE làn 5B-2 (v1.0.6).
- Vị trí:
  - `folio.service.ts`, chú thích của `AFTER_CLOSURE_SQL`: "No write-time decision reads it";
  - `refundRouting`, câu đọc `late`;
  - `openapi.yaml` `recordPayment` (A), bổ sung 1e: "Quyết định lúc ghi (V5-48, 5B-1, S5) đọc trạng thái đơn dưới khóa đơn …, **không** đọc trường này".
- Vấn đề:
  - `refundRouting` là một quyết định lúc ghi của 5B-1 (ai không được duyệt). Nó lại dùng chính biểu thức `AFTER_CLOSURE_SQL`, biểu thức mà chú thích và hợp đồng ghi là "chỉ để hiển thị".
  - Biểu thức xét trạng thái đơn **lúc đọc**. Đơn no-show được khôi phục (B12) thì biểu thức thành false, người ghi sau khi đóng không còn bị thêm vào yêu cầu **mới** tạo tay. Yêu cầu thay thế vẫn giữ người ghi qua `carriedOrigin`. BE-D2 đã nêu điểm này.
  - Ở v1.0.5 rủi ro thấp. FD không duyệt hoàn, nên chỉ MGR là người ghi mới có lợi gì. Tiền chưa đối soát thì không chi được. Và B12 cần MGR+.
- Vì sao quan trọng: chú thích sai sẽ dẫn người sau đặt thêm quyết định lúc ghi lên một biểu thức đổi giá trị theo trạng thái đơn hiện tại. Ở 5B-2, `cancelled → hold` sẽ làm luật S2 rơi khỏi mọi yêu cầu mới của đơn được khôi phục.
- Đề xuất sửa:
  - BE-D2: sửa chú thích `AFTER_CLOSURE_SQL`: "Hiển thị, và `refundRouting` (S2) đọc dưới L3; đơn khôi phục (B12) thì đọc false – 5B-2 thay bằng dấu lưu lúc ghi";
  - ARC 0.3.14: sửa câu 1e cho khớp, và ghi trong thiết kế 5B-2 một dấu lưu lúc ghi cho khoản thu sau khi đóng. Có thể là cột nối của migration 5B-2, hoặc cột `recorded_after_closure` cùng migration đó. `refundRouting` và luật S3 mức folio (mục 5) đọc dấu này.
- Trạng thái: Open

### FB-R5-ARC-BE-148-03
- Mức độ: Suggestion – BE-D2, QA biết.
- Vị trí: `pr-b3-after-closure.test.ts`, ca S4 "Có thể trùng" và ca DOM 11.4 mục 5; `v5-48-closed-booking-money.test.ts` (chú thích đầu tệp).
- Vấn đề: các biên của "Có thể trùng" và của việc đóng báo còn sống dưới đột biến (A5, A7, A8, A9, A19). Ở đầu tệp v5-48, tên tệp trỏ tới (`v5-5b1-after-closure.test.ts`) không tồn tại.
- Vì sao quan trọng: đây là cảnh báo duy nhất ở mức máy chủ cho ca DOM 11.4 (i), "hoàn tiền khách đã dùng làm cọc", tới khi v1.0.6 có luật đối soát. Nới một điều kiện sẽ làm cờ hiện khắp nơi (người duyệt bỏ qua). Siết một điều kiện sẽ làm mất cờ.
- Đề xuất sửa: thêm vào ca S4 các câu kiểm:
  - cùng số tiền, cách 25 giờ → không có cờ (A8);
  - hai khoản cùng số trên **cùng** một đơn → không có cờ, tới khi DOM 148-05 đổi luật (A7);
  - khoản `card_pos` hoặc tiền mặt cùng số → `possibleDuplicateCodes` vắng (A19);
  - yêu cầu hoàn của đơn chỉ có khoản trùng ghi **trước** khi đóng → `ApprovalRequest.possibleDuplicateCodes` vắng (A9);
  - khoản thu sau khi đóng thứ hai không ghi đè `handled_payment_id` của báo đã `handled` (A5).
  
  Sửa tên tệp trong chú thích thành `pr-b3-after-closure.test.ts`.
- Trạng thái: Open

### FB-R5-ARC-BE-148-04
- Mức độ: Suggestion – BE-D2 (một dòng chú thích); ARC (`architecture.md`, 0.3.14).
- Vị trí: `payment.service.ts` `recordManual`, ngay trên `assertBankReferenceFree`.
- Vấn đề: thứ tự khóa mới đúng (mục 2.4), nhưng điều kiện để không deadlock chỉ nằm trong mô tả PR.
- Đề xuất sửa:
  - Chú thích: "Giao dịch ghi khoản thu có `bankReference` phải ghi nó trước khi cấp số `payment` khác (`doc_sequence`). Ngược lại thì đua cùng mã → 40P01 → 409 `CONCURRENT_UPDATE` (`concurrencyProblem`), không bao giờ ghi đôi."
  - ARC thêm khóa tư vấn `bank-ref` vào danh sách thứ tự khóa ở `architecture.md`.
- Trạng thái: Open

### FB-R5-ARC-DOM-148-05
- Mức độ: Suggestion – DOM (luật), ARC (0.3.14 nếu DOM đồng ý).
- Vị trí: J1 (`hold_expired`), B10 (hủy tay); `createDepositNotice`; DOM 11.4 mục 5.
- Vấn đề:
  - `deposit_after_cancel` chỉ mở khi sale báo **sau** lúc đơn đã đóng.
  - Một báo "khách đã chuyển" gửi **trước** hạn, còn `open` lúc J1 hủy giữ chỗ, thì không mở mục nào. Đây chính là ca gốc của BUG-R5-002: sale báo đúng hạn, lễ tân chưa xác nhận, J1 hủy.
  - Báo đó vẫn hiện ở `Reservation.depositNotices` của đơn đã hủy. Nhưng "Cần chú ý" không có dòng nào, và FD+ không nhận tin.
- Vì sao quan trọng: tiền có thể đã về mà không ai được nhắc. SEC K5 đã nêu ca tương tự cho QR còn chờ.
- Đề xuất sửa: DOM quyết có nên thêm luật "J1/B10 hủy một đơn còn báo `open` → mở `deposit_after_cancel` (cùng khóa trùng), báo FD+". Nếu có, ARC ghi ở 0.3.14. BE làm ở một chỗ, trong giao dịch hủy, qua cổng payments (khoảng 0,25 ngày, không migration).
- Trạng thái: Open

---

## 7. Việc của ARC sau review này

Ghi ở danh sách 0.3.14 (mục 1.26 của `contract-0.3.13.md`). PR tài liệu kế tiếp, chỉ mô tả, trừ ý 1:
1. **Bổ sung 1j, trước PR Desk 5B-1:** `Reservation.cancellation.cancelledFrom` (DOM 148-02, mục 5). Ý này có đổi schema, nhưng chỉ thêm trường.
2. `recordPayment` (A): `card_pos` trên đơn đã đóng theo 105-03 (N > 0, ≤ N, `posAuthCode`, không bắt ảnh). Chữ (A) hiện còn ghi `card_pos` → 422.
3. `recordPayment` (B) và `createDepositNotice`: C0313-38 theo DOM 1.3; 1.21 ý 4 bỏ vế "đóng khi đã khôi phục và đã đối soát".
4. BE C0313-34…37: "PR-B3 kiểm sớm trên thân thô ở cả 5 bộ đọc"; luật "báo trước" chỉ cho `bankReference`; kiểm sớm đứng trước 404/409/412 và 403 tầng service, sau guard và cổng quá giờ của `checkOut`; mã thành công theo đường (201/200).
5. 1e: câu "quyết định lúc ghi không đọc trường này" (148-02); `architecture.md`: thứ tự khóa `bank-ref` (148-04).
6. Thiết kế 5B-2: S3 mức folio, đóng yêu cầu theo khoản nguồn khi đảo, dấu "ghi sau khi đóng" lưu lúc ghi (mục 5).

---

## 8. Điểm làm tốt

- Một bộ đọc `readBankReference` cho cả 5 đường, chốt lại ở chỗ INSERT duy nhất, và kiểm sớm đặt trên thân thô. Luật số thẻ vì vậy không thể lệch giữa các đường. Ca HTTP ở từng đường bắt đúng lỗi "zod bỏ khóa không khai".
- Ca đua khóa tư vấn viết chắc chắn: giữ khóa bằng kết nối riêng, chờ tới khi `pg_blocking_pids` thấy cả hai bước bị chặn, rồi mới thả. Không dựa vào `sleep`. Chính ca này bắt được thứ tự khóa cũ.
- BE-D2 tự nêu cả ba hạn chế, ca deadlock và hai đột biến tương đương, kèm cách đổi một dòng nếu người review muốn khác. Việc review vì vậy chỉ cần kiểm lại, không phải đi tìm.

---

## 9. Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do / tài liệu |
|---|---|---|---|---|
| 2026-11-07 | 5 | **ARC DUYỆT BE-D2 PR #148 (`r5-b3`, PR-B3 V5-5B 5B-1) @ `a5911138`**, gộp sau #152 (DOM, SEC đã duyệt). Mã khớp 1.21 ý 3, 1e–1i và 105-03 (N đọc sau L3; `card_pos` khi 0 < số ≤ N; hoàn = max(0, số − N); `type` theo `status_before_cancel`; yêu cầu `payment_after_cancel` đứng tên người ghi, nơi nhận cố định; "Có thể trùng" FD+; `bankReference` một bộ đọc + chốt ở `recordManual`; 1i kiểm sớm trên thân thô). Không migration. Gộp thử trên `main` @ `37bb196d`: không xung đột, `tsc` sạch, API 220 tệp / 5180 ca xanh trên PostgreSQL 17. ARC chốt: giữ kiểm sớm 1i ở cả 5 đường (M34/M36 và A15/A16 tương đương hôm nay); giữ thứ tự khóa tư vấn → `doc_sequence` (không đường v1.0.5 nào cấp số `payment` trước khoản thu có mã; deadlock tương lai → 409 `CONCURRENT_UPDATE`, không ghi đôi); hạn chế "không chỉ mục" không có thật (truy vấn con đi qua `payment_list_idx`, EXPLAIN); C0313-38 theo DOM, ARC sửa chữ (B) ở 0.3.14; ba ca đổi `deposit` → `charge` của #144/#139 đúng; DOM 148-02: thêm `Reservation.cancellation.cancelledFrom` (FD+) ở bổ sung 1j trước PR Desk 5B-1; DOM 148-03 / SEC 148-02: S3 mức folio + đóng theo khoản nguồn ở v1.0.6 cùng 5B-2; SEC 148-01 nên làm trong #148 cùng ARC 148-01. 18 đột biến ARC: 8 đỏ, 3 tương đương, 7 sống → 148-01 Minor (ca P1 đảo khoản 3b, P2 người ghi trước khi đóng – P2 làm đỏ A1), 148-02 Minor (`AFTER_CLOSURE_SQL` dùng cho quyết định lúc ghi), 148-03/04 Suggestion, ARC-DOM 148-05 Suggestion (báo `open` lúc J1 hủy không mở `deposit_after_cancel`). Không ESC | ARC | rounds/round-05/reviews/ARC-on-be-d2-pr-148.md |
