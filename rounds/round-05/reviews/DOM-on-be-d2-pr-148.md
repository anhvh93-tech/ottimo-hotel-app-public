# DOM review – BE-D2 PR #148 (`r5-b3`, V5-5B 5B-1): tiền về sau khi đơn đã đóng

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #148, nhánh `r5-b3` @ **`a5911138`** (draft). Mã bổ sung 1i ở `e2071bc7`; `a5911138` chỉ thêm tài liệu trên `d7cc3c8e`. Phần nghiệp vụ DOM đọc:
  - `payments/internal/payments.service.ts`: `recordAfterClosure`, `afterClosureType`, `afterClosureRefundVnd`;
  - `payments/public/payment.service.ts`: `recordInTxWithDue` (N đọc sau khóa folio), `recordManual`, `assertBankReferenceFree`;
  - `payments/internal/refunds.service.ts`: `createAfterClosureRefund`, `serverFixedDestination`, `setRefundDestination`, `payOut`, `executeRefund`;
  - `payments/internal/deposits.service.ts`: `createDepositNotice` trên đơn đã đóng;
  - `folio/public/folio.service.ts`: `POSSIBLE_DUPLICATES_SQL`, `refundRouting`, `refundDuplicateCodes`, `refundsDownToCredit`; `events/internal/attention.service.ts` ("Không thấy tiền");
  - test `pr-b3-after-closure.test.ts`, `pr-b3-bank-reference.test.ts`, `pr-b3-units.test.ts`; `rounds/round-05/outputs/BE/pr-b3.md`.
- Đối chiếu:
  - DOM `rules-v1.0.5.md` 11.4 (mục 2–5, 3a, 3b, ca QA (a')–(i)); `DOM-on-prs-105-125-128.md` thẻ FB-R5-DOM-ARC-105-01;
  - ARC FB-R5-ARC-BE-105-03 (`ARC-on-prs-105-119-125-128.md` mục 5); SEC `SEC-on-pr-119-delta-and-105-03.md` mục 2 (không bắt ảnh phiếu POS);
  - BE `BE-on-contract-0313-addendum-1i.md` thẻ C0313-38; `openapi.yaml` trên `main` (`recordPayment` (B), `createDepositNotice`, bảng `AttentionItem.kind`);
  - UXD `copy-v1.0.5.md` mục 9.1 (bản 2.4 trên `main` @ `37bb196d`); BR-308, BR-309, BR-310, BR-311, BR-522, BR-527.
- Cách đọc: worktree tạm ở `a5911138` (đã gỡ sau khi đọc). DOM đọc mã và test, không chạy test. CI của PR trên `a5911138`: mọi job chạy đều xanh (`gh pr checks 148`).
- Số tiền trong tệp là số thử của fixture (phí 500.000; chuyển 800.000, 300.000, 400.000). Không dữ liệu khách. Không số hoa hồng, thưởng.

## 0. Kết luận

**DUYỆT** PR #148 @ `a5911138` về nghiệp vụ.

Tiền về sau khi đơn đã đóng luôn có chỗ ghi. Quản lý và chủ đầu tư luôn thấy khoản đó. Phần phí của OTTIMO không bị hoàn nhầm. Tiền không ra khỏi quỹ trước khi khớp sao kê. Luật DOM 11.4 mục 2–5 và bảng N của thẻ 105-01 đúng từng dòng. Không có lỗi tiền.

| Mức | Số | Thẻ |
|---|---|---|
| Blocker | 0 | – |
| Major | 1 | 148-01: chữ hộp ghi ở UXD 9.1 còn theo luật trước 105-03 (UXD, FE-A). Phải sửa trước PR Desk 5B-1; không chặn #148 |
| Minor | 4 | 148-02 Desk không biết gửi `type` nào (ARC, FE-A); 148-03 nơi nhận cố định và yêu cầu đã duyệt sau khi thay thế (BE, ARC – v1.0.6 cùng 5B-2); 148-04 bốn câu sổ tay (BA, PO); 148-06 câu 409 trùng mã cho sale, khi không có mã đơn (UXD, FE-A) |
| Suggestion | 3 | 148-05 hai khoản cùng số trên cùng một đơn đã đóng; 148-07 chữ lỗi 409 "resolves to cash"; 148-08 "Không thấy tiền" khi tiền đã ghi trước lúc báo |

Không thẻ nào chặn gộp #148. Không ESC. Mọi điểm là luật đã có (BR-308, BR-309, BR-310, BR-522, BR-527, DOM 11.4) hoặc tính đúng nghiệp vụ thuộc quyền DOM.

**C0313-38: DOM chọn câu ở `createDepositNotice`**, đúng cách #148 đã làm. Câu ở `recordPayment` (B) sai; ARC sửa ở 0.3.14. Chữ thay ở mục 1.3.

Đề xuất ORC xử lý khi #148 gộp:
- FB-R5-DOM-ARC-105-01 (Major): đóng.
  - (a), (b) làm đúng: t1–t7.
  - (c) SEC chốt không bắt ảnh phiếu POS; DOM nhận (mục 3).
  - (d) cách tạm "thu trước, hủy sau" giữ trong sổ tay tới khi Desk có nút 5B-1 (thẻ 148-04 ý 4).
- BE hỏi DOM ba câu ở `pr-b3.md` mục 6. Trả lời:
  - "Có thể trùng" áp cho mọi khoản chuyển khoản: **giữ** (mục 2.3);
  - `type` theo `status_before_cancel`: **đúng** (mục 2.5);
  - t7: **đúng** (mục 2.1).

---

## 1. C0313-38 – mục `deposit_after_cancel` đóng lúc nào

### 1.1 Quyết định

Mục đóng khi một trong hai việc xảy ra:
- đơn có **khoản thu ghi sau lúc đóng đơn, trong lúc mục đang mở**. Áp cho 5B-1. Ở 5B-2, khôi phục cũng ghi một khoản thu, nên mục đóng ngay lúc đó, không chờ đối soát;
- FD+ bấm "Không thấy tiền" kèm ghi chú.

Mục **không** chờ hoàn xong, **không** chờ đối soát. Đây đúng chữ DOM 11.4 mục 5, câu ở `createDepositNotice`, và mã #148 (`recordAfterClosure`: báo `open` → `handled`, `resolveAttention` cùng giao dịch).

### 1.2 Vì sao, nhìn từ quầy

- Mục chỉ hỏi một câu: "Sale báo khách đã chuyển cho đơn đã hủy – tiền có về không?". Lễ tân ghi khoản thu là đã trả lời câu đó. Việc sau đã có chỗ theo dõi riêng:
  - hoàn tiền: mục `closed_reservation_credit`, tự đóng khi chi đủ;
  - đối soát: khoản thu luôn `pending`, để lâu thì có `reconcile_overdue`;
  - quản lý xem lại: bộ lọc tuần `afterClosureOnly`.
- Theo câu (B), có ca mục **không bao giờ tự đóng**, vì không có yêu cầu hoàn nào để "hoàn xong":
  - khách chuyển đúng N (trả phí, không hoàn – t4, 500.000);
  - 5B-2 khôi phục đơn (không có hoàn).
  
  Khi đó lễ tân chỉ còn cách bấm "Không thấy tiền" cho một khoản đã thấy. Audit tiền ghi `attention_event.resolved` sai ý. Màn tuần của chủ đầu tư sẽ đọc nó như một lần "không thấy tiền".
- Cũng theo câu (B), một đơn mang hai dòng "Cần chú ý" (tiền về và tiền dư) trong nhiều ngày, vì hoàn phải chờ đối soát rồi MGR/OWN duyệt. Ở 10 căn, danh sách này phải ngắn để lễ tân đọc hết khi vào ca.
- Câu (B) gộp hai mục làm một, như BE đã nêu ở C0313-38.

### 1.3 Chữ cho ARC (0.3.14)

Thay gạch đầu dòng "Mục 'Cần chú ý' `deposit_after_cancel` của đơn đóng khi đã hoàn xong…" trong `recordPayment` (B) bằng:

> - Mục "Cần chú ý" `deposit_after_cancel` (mở bởi `createDepositNotice` trên đơn đã đóng) tự đóng khi đơn có khoản thu ghi sau lúc đóng đơn, trong lúc mục đang mở. Cùng giao dịch, các báo `open` của đơn thành `handled` (`handled_payment_id`). 5B-2: khôi phục cũng ghi khoản thu nên mục đóng cùng lúc, không chờ đối soát. Hoặc FD+ đóng bằng "Không thấy tiền" (`resolveAttentionEvent`, ghi chú bắt buộc, audit người và giờ – S8). Tiền dư theo mục `closed_reservation_credit` (tự đóng khi chi đủ); đối soát theo `reconcile_overdue`. Bộ lọc tuần: `listAuditEvents.afterClosureOnly` (S6). Tin đẩy, audit, log chỉ có mã đơn.

Ở `createDepositNotice`, giữ câu hiện có và thêm một vế:

> Khoản thu ghi **trước** lúc báo không đóng mục của báo sau, vì báo có thể nói về một lần chuyển khác. FD+ kiểm rồi đóng tay, ghi mã phiếu thu vào ghi chú.

QA: ca (e') của 11.4 viết theo 1.1. Mục đóng ngay khi ghi khoản thu; không viết theo câu (B).

### 1.4 Hai ca biên DOM đã xét

- **Khoản thu ghi trước lúc báo.** Ví dụ: chủ đầu tư thấy tiền, gửi ảnh, lễ tân ghi; sau đó sale mới báo. Mục vẫn mở. Như vậy là đúng, vì báo có thể nói về lần chuyển thứ hai. Lễ tân đóng tay và ghi mã phiếu thu. Chữ ô ghi chú cần nói rõ ca này: thẻ 148-08.
- **Quẹt thẻ trên đơn có báo đang mở.** `card_pos` (thu phí, N > 0) cũng đóng mục và chuyển báo thành `handled`. Đúng ra quẹt thẻ chưa trả lời câu "tiền chuyển khoản có về không". Nhưng ca này gần như không xảy ra:
  - báo "khách đã chuyển" chỉ do sale, CTV gửi, trên đơn của họ;
  - quẹt thẻ sau khi đóng chỉ có khi đơn còn nợ phí, thường là đơn OTA trả tại chỗ.
  
  DOM giữ như #148, không ra thẻ. Gặp ca thật thì chỉ cần sửa một điều kiện.

---

## 2. Tiền về sau khi đóng – kết quả tiền ở OTTIMO

### 2.1 Từng ca (số thử)

| Ca | #148 làm | DOM |
|---|---|---|
| Đơn OTA trả tại chỗ hủy có phí 500.000 (N = 500.000); quẹt thẻ 500.000, có mã chuẩn chi | 201, chờ đối soát, không hoàn, còn phải thu 0 (t1) | Đúng 105-01 (a). Phí là doanh thu OTTIMO (BR-310); quỹ POS khớp Desk |
| Quẹt 500.001 | 422 `max` 500.000, không ghi gì (t2) | Đúng. Lễ tân thấy số tối đa |
| Hai lần quẹt 300.000 cùng lúc | một 201, một 422 `max` 200.000 (t5) | Đúng: N đọc sau khóa folio, không thu quá phí |
| N = 0: quẹt thẻ; N > 0: tiền mặt, `ota_collect` | 422 `method` (t3, t6) | Đúng 11.4 2(b) và 105-01 (a) |
| Chuyển 800.000 khi N = 500.000 | tự tạo yêu cầu hoàn 300.000 (t4) | Đúng 105-01 (b): giữ phần phí, hoàn phần dư |
| Chuyển đúng 500.000 | không hoàn (t4) | Đúng |
| Giữ chỗ đã tự hủy, khách chuyển 300.000 theo QR cũ | `deposit`, hoàn đủ 300.000, mục `deposit_after_cancel` đóng | Đúng 11.4 mục 3 (BR-308, không phí) |
| No-show giữ dòng dịch vụ đã đặt (t7) | quẹt tới N, không hoàn | Đúng BR-311: dòng giữ lại là nợ thật |
| Đơn đã xác nhận rồi hủy, đang có yêu cầu BR-309 | yêu cầu BR-309 giữ nguyên, khoản mới có yêu cầu riêng | Đúng 11.4 mục 3. Theo mã, nhánh đơn đã đóng trả về trước `afterSettledMoneyChange`, nên không sinh thêm yêu cầu `overpayment` thứ hai |

### 2.2 Luôn thấy, không mất

- **Khoản thu:** có cờ `Payment.afterClosure`; audit `payment.recorded` có `afterClosure`, nên hiện ở bộ lọc tuần của chủ đầu tư.
- **Đối soát:** luôn chờ, kể cả khi OWN ghi, kể cả quẹt thẻ. Để lâu thì có `reconcile_overdue`.
- **Tiền dư:** có yêu cầu hoàn, và `closed_reservation_credit` mở tới khi chi đủ.
- **Báo của sale:** mở mục `deposit_after_cancel` cho FD, FDL, MGR, OWN; audit `deposit_notice.created` có `afterClosure`.
- **"Không thấy tiền":** audit tiền, có trong bộ lọc tuần. Test đọc lại qua đúng lời gọi của màn tuần.
- **Không chi quá tiền đã về.** Hai chốt ở mức folio:
  - chi hoàn chỉ tới phần dư đã đối soát (`payableCreditVnd`, `REFUND_SOURCE_NOT_RECONCILED`);
  - tổng yêu cầu mở không vượt tiền dư (K11-06), chạy lại sau mỗi lần đảo.
  
  Vì vậy, kể cả khi nhãn hoặc nơi nhận của một yêu cầu bị lệch (mục 4.1), tổng tiền chi ra không vượt tiền đã về và đã khớp sao kê.
- Ca ngoài tầm #148: tiền về mà không ai ghi, không ai báo. Chỉ đối soát BR-527 (dòng sao kê không khớp đơn nào) bắt được. Desk chưa có báo từ ngân hàng (11.4 mục 5).

### 2.3 "Có thể trùng"

- #148 đúng điều kiện SEC và DOM 3a: khoản chuyển khoản/VietQR khác, chưa đảo, cùng số tiền, Giờ nhận tiền cách ≤ 24 giờ, ở đơn khác. Chỉ hiện mã đơn, chỉ FD+, không chặn. Đảo một khoản thì cờ mất (có test).
- **Trả lời BE: giữ cờ cho mọi khoản chuyển khoản**, không chỉ khoản ghi sau khi đóng. Lý do:
  - ở ca (i) của 11.4, khoản cọc trên giữ chỗ mới là khoản thường. Người đối soát cần thấy cờ ở **cả hai** khoản, để biết sao kê phải có hai dòng;
  - hai khách cùng chuyển 1.000.000 trong một ngày sẽ cùng có cờ. Ở màn đối soát, kiểm việc đó là đúng luật "một dòng sao kê chỉ khớp một khoản", không phải nhiễu.
- Desk chỉ hiện chip ở màn duyệt hoàn và màn đối soát (UXD 9.1 đã ghi), không hiện trên khung đơn thường. FE-A giữ đúng như vậy.
- Còn một hở: hai khoản cùng số trên **cùng một** đơn đã đóng không có cờ (thẻ 148-05).

### 2.4 Không có khoản thu đôi

- **Mã giao dịch:** trùng thì 409, kiểm dưới khóa tư vấn, so dạng chữ hoa. Mã của khoản chi hoàn không chặn khoản thu. Khoản đã đảo trả lại mã.
- **Thứ tự khóa mới:** có thể ra 409 `CONCURRENT_UPDATE` (thử lại sau 1 giây), không bao giờ ghi hai lần. Ở quầy chấp nhận được.
- **Một ảnh một khoản thu** (luật có sẵn). Báo của sale không sinh khoản thu, và ảnh của báo không dùng làm chứng từ (S7).
- **Một khoản thu sinh đúng một yêu cầu hoàn**, trong cùng giao dịch.
- **Khi không có mã:** chỉ còn cờ "Có thể trùng" và luật đối soát tay "một dòng sao kê chỉ khớp một khoản" (11.4 3a), tới v1.0.6.

### 2.5 `type`

Đúng 11.4 2(f):
- giữ chỗ hủy → `deposit`, để 5B-2 dùng lại chính khoản này;
- đơn khác → `charge`.

Hai ca của #144 và #139 đổi sang `charge` là đúng luật mới; ý của ca giữ nguyên. Phía Desk còn một việc: thẻ 148-02.

### 2.6 Trần S5 không có trong PR

ORC đã cắt phần này. DOM chấp nhận cho v1.0.5: một khoản ghi khống không thành tiền chi ra, vì có ảnh bắt buộc, có đối soát, và người ghi không duyệt, không chi. Trần chỉ giúp bắt lỗi gõ sớm hơn.

---

## 3. Ai ghi, ai duyệt, ai chi

- **Ghi:** chỉ FD+ ghi trên đơn đã đóng. Sale, CTV bị chặn như cũ. Đúng.
- **Người ghi:** vào `origin_actor_ids`, nên không duyệt, không chi (cả tiền mặt và chuyển khoản), kể cả khi yêu cầu bị từ chối rồi người khác tạo lại. `refundRouting` thêm người ghi vào mọi yêu cầu hoàn mới của folio. Đúng 11.4 mục 3.
  - Hệ quả DOM chấp nhận: lễ tân đã ghi tiền về trên đơn đó cũng không chi được yêu cầu BR-309 bằng tiền mặt của chính đơn. Lễ tân khác chi. Ca hiếm (khách đã hủy quay lại quầy lấy tiền mặt).
- **Ngoại lệ OWN chi chuyển khoản: giữ.** Lý do:
  - PO 17/10: cơ sở một chủ, OWN được nhập nơi nhận, duyệt và chi cùng một yêu cầu chuyển khoản, có step-up và cờ `ownSelfApprovedAndPaid`;
  - với yêu cầu 5B-1, nơi nhận cố định về đúng tài khoản đã chuyển, nên OWN không đổi được nơi tiền đi. Chi cũng chỉ khi đã đối soát;
  - tiền là của chủ đầu tư. Chặn OWN chỉ làm yêu cầu kẹt khi cơ sở không có MGR đang làm.
  - Lưu ý: nếu OWN **tự ghi** khoản thu thì OWN là người tạo yêu cầu, không duyệt được (SEC F8, không có ngoại lệ), nên cần MGR duyệt. Cách đúng ở quầy: chủ đầu tư gửi ảnh, lễ tân ghi, chủ đầu tư duyệt và chi. 11.4 2(c) đã ghi nguồn ảnh là chủ đầu tư hoặc quản lý gửi. Đưa vào sổ tay: thẻ 148-04 ý 3.
- **SAL `confirmDeposit` 409 không có mã đơn: đúng.** Sale chỉ thấy đơn của mình; đơn kia có thể ngoài phạm vi (SR-AZ-02). Sale báo lễ tân; lễ tân (FD+) gõ lại mã sẽ thấy mã đơn. Desk cần câu cho ca không có mã: thẻ 148-06.
- **`card_pos` không bắt ảnh phiếu POS (SEC chốt): DOM nhận.** Mã chuẩn chi và bảng kết toán POS đủ để đối soát. Ảnh chụp ở quầy dễ dính mặt thẻ.

---

## 4. Ba hạn chế BE-D2 nêu – có phải vấn đề thật ở quầy không

### 4.1 Thay thế "pha trộn" làm mất nơi nhận cố định

- **Khi nào xảy ra:**
  - đơn đã xác nhận rồi hủy, đang mở cùng lúc yêu cầu BR-309 (lễ tân nhập nơi nhận) và yêu cầu 5B-1 (nơi nhận cố định);
  - rồi tiền dư giảm, thường do đảo một khoản. `refundPlan` hủy các yêu cầu đang chờ và tạo lại một yêu cầu `overpayment`;
  - hai nơi nhận khác nhau, nên yêu cầu mới không có nơi nhận và mất dấu "máy chủ đặt".
- **Ở quầy:**
  - ca hay gặp nhất là đảo chính khoản ghi trùng sau khi đóng (11.4 3b). Khi đó phần còn lại là tiền BR-309, nên bỏ nơi nhận cố định là **đúng**;
  - sai khi tiền dư còn chứa tiền chuyển khoản sau khi đóng (tiền dư giảm vì lý do khác). Lễ tân nhập lại được nơi nhận bất kỳ, kể cả tiền mặt. Như vậy mất luật S3: tiền vào tài khoản thì hoàn về tài khoản.
- **Ca gần, DOM tìm thêm khi đọc `refundsDownToCredit`:**
  - yêu cầu 5B-1 **đã duyệt**, yêu cầu BR-309 còn chờ, rồi đảo khoản nguồn của 5B-1;
  - yêu cầu đang chờ bị hủy. Yêu cầu đã duyệt chỉ bị đóng khi tổng còn vượt tiền dư, nên yêu cầu 5B-1 đã duyệt **ở lại** và giữ phần tiền của BR-309 dưới nhãn "Tiền về sau khi hủy";
  - như vậy lệch 11.4 3b: "yêu cầu hoàn đi kèm tự hủy khi đảo, kể cả yêu cầu đã duyệt chưa chi";
  - nếu cọc BR-309 là tiền mặt thì folio không còn khoản chuyển khoản nào, tức đúng ca 4.2 (409, tiền kẹt).
- Tổng tiền vẫn đúng (mục 2.2). Hai chốt người vẫn còn: MGR/OWN duyệt, người chi khác người ghi.
- **Kết luận: có thật nhưng hiếm, không chặn v1.0.5.** Sửa ở v1.0.6 cùng 5B-2 (thẻ 148-03). Tới đó dùng hai câu sổ tay ở 148-04 (ý 1, 2).

### 4.2 Folio không có khoản chuyển khoản → `executeRefund` 409

- Đây là lỗi an toàn: tiền không ra.
- Theo mã, yêu cầu cố định chỉ rơi vào ca này khi khoản nguồn đã đảo như ở 4.1. 5B-1 chỉ tạo yêu cầu từ khoản chuyển khoản/VietQR, nên không có ca "chưa từng có khoản chuyển khoản".
- Ở quầy: yêu cầu để mở, `closed_reservation_credit` còn mở, quản lý báo chủ đầu tư. Đúng câu 11.4 mục 3 "tài khoản cũ không nhận được".
- Chỉ chữ lỗi sai hướng: "use executeCashRefund" mời chi tiền mặt, trong khi lối đó bị chặn (thẻ 148-07).
- **Kết luận: không phải vấn đề thật ở quầy**, ngoài chữ lỗi.

### 4.3 Truy vấn "Có thể trùng" không có chỉ mục

- Ở 10 căn, mỗi lần đọc folio chỉ có vài khoản thu. Số khoản thu của cơ sở mỗi năm khoảng vài nghìn [ước lượng DOM, chưa đo]. Truy vấn con lọc theo cơ sở và số tiền trên bảng cỡ này không làm chậm quầy.
- **Kết luận: không phải vấn đề ở quầy.** Chỉ mục `(property_id, amount_vnd)` ở v1.0.6 như BE đề xuất là đủ. Xem lại nếu chủ đầu tư mở thêm cơ sở.

---

## 5. Thẻ feedback

### FB-R5-DOM-UXD-148-01
- Mức độ: **Major** – UXD (chữ), FE-A (PR Desk 5B-1). Phải sửa trước khi nút "Ghi tiền về sau khi hủy" lên. Không chặn #148.
- Vị trí: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` mục 9.1 (bản 2.4 trên `main`). Các khóa: `rsv.after_cancel.intro`, `rsv.after_cancel.methods_hint`, `rsv.after_cancel.proof`, `rsv.after_cancel.done`, `rsv.after_cancel.submit`, `field_error.after_cancel_method`.
- Vấn đề: chữ 9.1 viết theo 11.4 bản đầu, khi N luôn bằng 0. Sau 105-01 / 105-03 và #148 có ba chỗ lệch:
  - đơn còn nợ phí (N > 0) nhận quẹt thẻ tới N. Nhưng `methods_hint` và `field_error.after_cancel_method` lại bảo "Tiền mặt hay quẹt thẻ: tạo đơn mới và thu trên đơn mới";
  - yêu cầu hoàn tự tạo chỉ bằng phần vượt N. Nhưng `intro` và `done` nói "hoàn đủ số tiền", và `done` hiện "Yêu cầu hoàn {amount}" với {amount} là số vừa ghi. Khi khoản ghi ≤ N thì không có yêu cầu hoàn nào;
  - ảnh bắt buộc chỉ cho chuyển khoản, VietQR. Quẹt thẻ cần mã chuẩn chi, không cần ảnh.
- Vì sao quan trọng:
  - lễ tân làm theo chữ sẽ tạo đơn mới để thu phí hủy. Phí nằm sai đơn, đơn cũ mãi "Còn phải thu", quỹ POS lệch Desk;
  - lễ tân sẽ hứa với khách "hoàn đủ", trong khi máy chủ giữ phần phí. Khách khiếu nại.
- Đề xuất sửa (ý DOM; UXD viết chữ, CPY xem bản EN nếu cần):
  - `intro`: "Ghi khoản này: phần vượt số đơn còn phải thu sẽ thành yêu cầu hoàn, không phí. Đơn không còn nợ thì hoàn đủ." Giữ câu "Khách muốn đặt lại…";
  - `methods_hint` theo `balanceDueVnd`:
    - N = 0: "Chỉ ghi tiền đã vào tài khoản OTTIMO: chuyển khoản hoặc VietQR.";
    - N > 0: thêm "Quẹt thẻ: chỉ để thu phí còn nợ, tối đa {N}. Tiền mặt: không ghi ở đây.";
    - FE chỉ hiện Quẹt thẻ khi N > 0 (ARC 105-03 ý 8);
  - `proof`: chữ "bắt buộc" chỉ hiện với chuyển khoản, VietQR. Với thẻ: ô mã chuẩn chi bắt buộc, dòng phụ "Không chụp thẻ";
  - `done`, hai câu:
    - có hoàn: "… Yêu cầu hoàn {refund} đã tạo…". {refund} đọc từ `openRefunds` (`reasonCode = payment_after_cancel`), vì `Payment.refundRequestId` chưa có tới 0.3.14;
    - không hoàn: "Đã ghi {amount} phí còn nợ của đơn {code}, chờ đối soát.";
  - 422 `AMOUNT_EXCEEDS_BALANCE` với thẻ: "Quẹt thẻ tối đa {max}, là số đơn còn phải thu.";
  - `submit`: "Ghi khoản thu", vì không phải lần nào cũng có yêu cầu hoàn.
- Trạng thái: Open (UXD; FE-A)

### FB-R5-DOM-ARC-148-02
- Mức độ: Minor – ARC (hợp đồng 0.3.14), FE-A. Trước PR Desk 5B-1.
- Vị trí:
  - `Reservation` (`reservation-dto.ts`): `cancellation` chỉ có `cancelledAt`, `reasonCode`, `note`;
  - `recordPayment` (B): luật `type`.
- Vấn đề:
  - máy chủ đòi `type = deposit` khi `status_before_cancel = hold`, gửi loại khác thì 422 `type` NOT_ALLOWED;
  - Desk không đọc được `status_before_cancel`, vì trường này không có trong `Reservation`;
  - đoán theo lý do hủy không chắc: giữ chỗ hủy tay có thể mang lý do "Khác".
- Vì sao quan trọng: lễ tân không chọn loại khoản thu, và không nên phải chọn. Desk gửi sai thì lễ tân gặp một lỗi 422 không sửa được ở quầy.
- Đề xuất sửa: ARC thêm `Reservation.cancellation.cancelledFrom` (`hold` | `confirmed`, FD+) để Desk tự gửi `type`, hoặc chốt cách khác cho Desk biết loại. Hộp 9.1 không có ô loại khoản thu.
- Trạng thái: Open (ARC; FE-A)

### FB-R5-DOM-BE-148-03
- Mức độ: Minor – BE (làn 5B-2), ARC. v1.0.6. Không chặn #148, không chặn v1.0.5.
- Vị trí:
  - `folio.service.ts` `refundsDownToCredit`: đóng yêu cầu đã duyệt "mới nhất trước", chỉ khi tổng còn vượt tiền dư; `peekDestination` trả null khi nơi nhận khác nhau;
  - `refunds.service.ts` `serverFixedDestination`.
- Vấn đề: hai ca ở mục 4.1:
  - (i) yêu cầu thay thế pha trộn mất nơi nhận cố định, trong khi tiền dư còn chứa tiền chuyển khoản sau khi đóng;
  - (ii) đảo khoản nguồn của một yêu cầu 5B-1 đã duyệt không đóng chính yêu cầu đó, khi folio còn tiền dư khác. Lệch 11.4 3b.
- Vì sao quan trọng:
  - (i) mất luật S3: tiền vào tài khoản thì hoàn về tài khoản, không chi tiền mặt;
  - (ii) yêu cầu "Tiền về sau khi hủy" giữ tiền của BR-309 và có thể kẹt 409 (mục 4.2). Tổng tiền không sai.
- Đề xuất sửa:
  - (i) luật chặt thắng. Folio còn khoản chuyển khoản/VietQR ghi sau khi đóng, chưa đảo → yêu cầu thay thế mang nơi nhận `original_method` do máy chủ đặt, như `createAfterClosureRefund`, có audit `refund.destination_set`. Phần BR-309 đi kèm cũng về tài khoản đã chuyển. Ở OTTIMO chấp nhận được: hoàn về tài khoản gốc là cách làm chuẩn;
  - (ii) đảo một khoản thu ghi sau khi đóng → đóng `superseded` trước yêu cầu 5B-1 sinh từ chính khoản đó (kể cả đã duyệt), rồi mới chạy `refundPlan` cho phần còn lại. Cần nối khoản thu với yêu cầu: dùng cột nối của migration 5B-2 (`Payment.refundRequestId`, bổ sung 1e);
  - test:
    - đơn xác nhận rồi hủy, cọc tiền mặt; BR-309 đang chờ, 5B-1 đã duyệt; đảo khoản 5B-1 → 5B-1 `superseded`, yêu cầu mới đủ tiền BR-309;
    - cùng ca, cọc bằng chuyển khoản;
    - tiền dư giảm vì lý do khác → yêu cầu mới vẫn cố định.
- Trạng thái: Open (BE; ARC; QA thêm ca (i) biến thể)

### FB-R5-DOM-BA-148-04
- Mức độ: Minor – BA (sổ tay 2.4, V5-71), PO (Tờ 2a nếu còn chỗ). Lên cùng PR Desk 5B-1.
- Vị trí: `product/docs/manual/guides/02-le-tan.md` (mục tiền về sau khi hủy); phần duyệt hoàn của sổ tay quản lý.
- Vấn đề: #148 để lại bốn việc cho người làm. Sổ tay chưa nói.
- Vì sao quan trọng: hai ý đầu là chốt tay cho ca 4.1 tới v1.0.6. Ý 3 tránh yêu cầu hoàn bị kẹt ở cơ sở không có quản lý. Ý 4 thay cách tạm của 105-01 (d).
- Đề xuất sửa (chữ DOM, BA biên tập):
  1. Quản lý, chủ đầu tư duyệt yêu cầu "Tiền về sau khi hủy" **sau khi** khoản thu đã đối soát. Chi vốn phải chờ đối soát, nên duyệt sau không làm chậm thêm. Lúc duyệt, người duyệt thấy luôn kết quả đối soát và chip "Có thể trùng".
  2. Đơn có khoản "Tiền về sau khi hủy" chưa đảo: mọi yêu cầu hoàn của đơn chi bằng chuyển khoản về tài khoản đã chuyển, không chi tiền mặt, kể cả yêu cầu được tạo lại. Áp tới khi 148-03 lên.
  3. Chủ đầu tư thấy tiền về cho đơn đã hủy: gửi ảnh cho lễ tân ghi, không tự ghi. Người ghi không duyệt được yêu cầu hoàn, nên khi không có quản lý đang làm thì yêu cầu sẽ kẹt.
  4. Phí hủy, phí không đến của đơn OTA trả tại chỗ: quẹt thẻ trên chính đơn đã đóng, tối đa số còn phải thu. Khi Desk có nút này, bỏ cách tạm "thu trước, hủy sau" (105-01 (d)).
- Trạng thái: Open (BA; PO)

### FB-R5-DOM-BE-148-05
- Mức độ: Suggestion – BE, ARC. v1.0.6, hoặc trong #148 nếu BE-D2 còn thời gian (một điều kiện SQL).
- Vị trí: `POSSIBLE_DUPLICATES_SQL` (`dup.reservation_id IS DISTINCT FROM p.reservation_id`).
- Vấn đề:
  - hai khoản chuyển khoản cùng số, cách ≤ 24 giờ, cùng ghi sau khi đóng trên **cùng** một đơn thì không có cờ. Ví dụ: hai lễ tân cùng ghi từ một ảnh, mỗi người tải ảnh lên một lần;
  - chữ DOM 3a (theo SEC) chỉ nói "ở đơn khác". Đây là hở của luật DOM, không phải lỗi #148.
- Vì sao quan trọng: mỗi khoản sinh một yêu cầu hoàn. Chốt còn lại chỉ là luật tay "một dòng sao kê chỉ khớp một khoản". Nếu người đối soát khớp cả hai khoản, OTTIMO hoàn hai lần cho một lần tiền về.
- Đề xuất sửa:
  - thêm nhánh "cùng đơn, cả hai khoản đều ghi sau khi đóng" → cờ mang mã của chính đơn;
  - không mở nhánh này cho khoản thường của cùng đơn: cọc và phần còn lại cùng số trước ngày đến là chuyện thường.
- Trạng thái: Open

### FB-R5-DOM-UXD-148-06
- Mức độ: Minor – UXD (chữ), FE-A. Lên cùng ô `bankReference` trên Desk.
- Vị trí: `copy-v1.0.5.md` 9.1, khóa `error.DUPLICATE_BANK_REFERENCE` ("… đã ghi ở đơn {code} …").
- Vấn đề: SAL/CTV nhận 409 **không có** `duplicateReservationCode`. Điều này đúng SEC ARC-21 và có test (i) của #148. Desk sẽ hiện "đã ghi ở đơn" với chỗ trống ở `{code}`.
- Vì sao quan trọng: sale đang xác nhận cọc cho khách, gặp câu thiếu chữ và không biết làm gì tiếp.
- Đề xuất sửa: thêm khóa cho ca không có mã, ví dụ:
  - VI: "Mã giao dịch này đã được ghi ở một khoản thu khác. Không ghi lại. Báo lễ tân kiểm.";
  - EN: "This transaction reference is already recorded on another payment. Don't record it again. Ask the front desk to check.";
  - FE chọn câu theo có hay không có `duplicateReservationCode`.
- Trạng thái: Open (UXD; FE-A)

### FB-R5-DOM-BE-148-07
- Mức độ: Suggestion – BE, FE-A.
- Vị trí: `refunds.service.ts` `executeRefund`, nhánh `detail: 'original method resolves to cash – use executeCashRefund'`.
- Vấn đề: với yêu cầu có nơi nhận cố định, chữ chi tiết mời dùng lối tiền mặt. Lối đó trả 409.
- Vì sao quan trọng: quản lý đọc lỗi sẽ thử chi tiền mặt, gặp thêm một 409, rồi mới hiểu là phải báo chủ đầu tư (mục 4.2).
- Đề xuất sửa:
  - với yêu cầu cố định, trả `detail` riêng (ví dụ "fixed destination: no transfer receipt left on the folio") hoặc thêm `extras.reason`;
  - FE hiện câu UXD, ví dụ: "Không còn khoản chuyển khoản nào để hoàn về. Không chi tiền mặt. Báo chủ đầu tư."
- Trạng thái: Open

### FB-R5-DOM-UXD-148-08
- Mức độ: Suggestion – UXD.
- Vị trí: `copy-v1.0.5.md` 9.1, khóa `today.money_after_cancel_not_found_note` ("Ghi chú (bắt buộc): đã kiểm ở đâu, lúc nào.").
- Vấn đề: ca ở mục 1.4. Tiền đã ghi trước lúc sale báo, nên lễ tân phải đóng mục bằng nút "Không thấy tiền".
- Vì sao quan trọng: chủ đầu tư đọc bộ lọc tuần sẽ thấy "không thấy tiền" mà không biết tiền đã ghi ở phiếu nào.
- Đề xuất sửa: thêm vào chữ gợi ý ô ghi chú: "Tiền đã ghi trước lúc báo: ghi mã phiếu thu." Không thêm nút, để giữ một nút và một loại audit.
- Trạng thái: Open

---

## 6. Điểm làm tốt

- Bảng N đúng từng dòng của 105-01, kể cả ca đua t5. N đọc ngay sau khóa folio nên hai lần quẹt cùng lúc không thu quá phí.
- `refundRouting` giữ người ghi trong danh sách "không duyệt, không chi" cho cả yêu cầu tạo lại sau khi bị từ chối. Đây là chỗ dễ sót nhất của S2.
- "Không thấy tiền" được kiểm qua đúng lời gọi của màn tuần chủ đầu tư, và audit không chép ghi chú tự do. BE-D2 tự nêu các hạn chế và hỏi DOM đúng những câu cần hỏi.

## 7. Giả định DOM dùng

1. DOM đọc mã và test ở `a5911138` trong worktree tạm (đã gỡ), không chạy test. "Xanh" lấy từ CI của PR trên đúng SHA và từ `pr-b3.md` mục 7.
2. Ca 4.1 (ii) và 4.2 là DOM suy ra từ mã `refundsDownToCredit`, `executeRefund`, `refundPlan`; chưa có test. BE xác nhận khi làm 148-03.
3. Desk trên `main` @ `37bb196d` chưa có nút ghi tiền về sau khi hủy. DOM chỉ thấy dòng "Cần chú ý" `deposit_after_cancel` (`app/attention.ts`) và nhãn audit "Không thấy tiền" ở sổ tiền; DOM không tìm thấy nơi nào dùng khóa `today.money_after_cancel_not_found` ngoài tệp chuỗi. Vì vậy 148-01, 148-02, 148-06, 148-08 chưa thành lỗi trên Desk v1.0.5 hiện tại.
4. Số khoản thu mỗi năm ở mục 4.3 là ước lượng DOM, chưa đo trên production.
5. Mọi số tiền là số thử của fixture ARC 105-03 và DOM 11.4.
6. Không có chính sách mới. Hoàn đủ, không phí cho giữ chỗ (BR-308), giữ phí hủy (BR-309, BR-310) và chi sau đối soát (BR-522) là luật đã chốt. Vì vậy không có ESC.

## 8. Dòng đề xuất ghi `decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review BE-D2 PR #148 (r5-b3, V5-5B 5B-1 tiền về sau khi đóng) @ a5911138: DUYỆT về nghiệp vụ.** card_pos chỉ khi N > 0 và ≤ N (N đọc sau khóa folio, t5 đua đúng); hoàn tự tạo = max(0, số ghi − N) nên giữ phí OTTIMO (BR-310); giữ chỗ hủy → deposit, đơn khác → charge; nơi nhận cố định original_method, không tiền mặt, chi sau đối soát; người ghi không duyệt, không chi kể cả yêu cầu tạo lại; giữ ngoại lệ OWN chi chuyển khoản (PO 17/10); SAL confirmDeposit 409 không mã đơn đúng; "Có thể trùng" giữ cho mọi khoản chuyển khoản (ca (i) cần cờ ở cả khoản cọc thường), Desk chỉ hiện ở màn duyệt hoàn và đối soát. **C0313-38: DOM chọn câu createDepositNotice** – deposit_after_cancel đóng khi có khoản thu ghi sau lúc đóng đơn trong lúc mục mở (5B-2 khôi phục cũng đóng ngay, không chờ đối soát) hoặc "Không thấy tiền"; tiền dư theo closed_reservation_credit, đối soát theo reconcile_overdue; ARC sửa câu recordPayment (B) ở 0.3.14 (chữ ở mục 1.3). Ba hạn chế: thay thế pha trộn mất nơi nhận cố định – thật nhưng hiếm, kèm ca yêu cầu 5B-1 đã duyệt ở lại sau khi đảo khoản nguồn (lệch 3b), tổng tiền vẫn đúng nhờ chốt mức folio → v1.0.6 (148-03) + sổ tay; executeRefund 409 khi hết khoản chuyển khoản – lỗi an toàn, chỉ sửa chữ (148-07); truy vấn trùng không chỉ mục – không phải vấn đề ở 10 căn. Thẻ: 148-01 Major UXD/FE-A chữ 9.1 theo 105-03 trước PR Desk 5B-1; 148-02 Minor ARC/FE-A Desk cần cancelledFrom để gửi type; 148-03 Minor BE/ARC v1.0.6; 148-04 Minor BA/PO bốn câu sổ tay; 148-06 Minor UXD câu 409 trùng mã không có mã đơn; 148-05, 148-07, 148-08 Suggestion. Đóng FB-R5-DOM-ARC-105-01 khi #148 gộp. Không ESC | DOM | rounds/round-05/reviews/DOM-on-be-d2-pr-148.md |`
