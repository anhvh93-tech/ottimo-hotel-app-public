# SEC – BUG-R5-002: ghi tiền và xin hoàn trên đơn đã đóng qua API

Round 5 · v1.0.5 · bước **Review** · SEC · 06/11/2026

Giao việc: ORC 06/11. BUG-R5-002 ghi "SEC xem quyền". `rounds/round-05/plan.md` dòng V5-5B và quyết định 20 để sẵn chỗ cho kết luận SEC (V5-48). ORC nhắn thêm 06/11 khuya: đưa thiết kế DOM mới (11.3, 11.4, commit `e9e0e2e4`) vào review, nói rõ thiết kế đó đã đủ bịt kẽ hở chưa và v1.0.5 phải chặn gì ngay. Trả lời ở mục 0 và mục 3.

Đối tượng và cách đọc:
- `main` @ `da6a5a75`. Mã sản phẩm (`product/services/api/src`, `product/apps/admin-web/src`) giống `6414be25` (production v1.0.4): `git diff` rỗng. Số dòng dưới đây đúng cho cả hai.
- DOM `rules-v1.0.5.md` 11.2–11.4 bản `e9e0e2e4`, và BR-522 v0.5.13 (cùng commit).
- Mã:
  - `modules/payments/internal/payments.service.ts`, `payments.controller.ts`, `refunds.service.ts`, `refunds.controller.ts`, `deposits.service.ts`;
  - `modules/payments/public/payment.service.ts`;
  - `modules/approvals/public/approval.service.ts`, `approvals/internal/limits.ts`;
  - `modules/folio/public/folio.service.ts` (`lockForPosting`, `balance`, `settle`, `refundRouting`);
  - `modules/reservations/internal/allowed-actions.ts`, `reservations.service.ts` (`restoreNoShow`, `expireOne`);
  - `generated/openapi-meta.ts` (vai của từng operation);
  - migration `0006`, `0040`, `0042` (CHECK tách nhiệm);
  - Desk: `pages/stay/PaymentPanel.tsx`, `DebtCollectDialog.tsx`, `CheckInPayment.tsx`, `pages/reservations/ReservationDialogs.tsx`.
- Tài liệu:
  - `product/docs/rbac-matrix.md`: A10, A33, A43, A46, A46a, A47, A47a, ghi chú 35, 38, 39;
  - `product/docs/business-rules.md`: BR-522, BR-526, BR-527;
  - DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 11;
  - QA `rounds/round-05/qa/bug-list.md` BUG-R5-002;
  - SEC `rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md` (FB-R5-SEC-PO-04, PO-05).
- SEC chỉ đọc mã, không chạy stack. Không SSH, không gọi staging hay production.
- Câu SQL ở mục 5 được thử cú pháp hai lần, cả hai chỉ ở máy local:
  - trên một PostgreSQL 17 dùng một lần, bảng tối thiểu, dữ liệu giả, đã xóa;
  - trên DB demo local, trong giao dịch READ ONLY.
- Tệp này không có bí mật, mã đơn thật hay dữ liệu khách.

---

## 0. Kết luận

1. **Mức rủi ro: Trung bình.** Không phải Critical hay High, nên không hotfix và không ESC.
2. **Kết luận (b): đưa vào v1.0.5.**
3. **Thiết kế DOM 5B-1 (bản `e9e0e2e4`) có đủ bịt kẽ hở không:**
   - **Đủ cho `recordPayment`**, với một điều kiện: máy chủ phải bắt luật (b), (c), (d) của DOM, với mọi vai kể cả OWN. Desk chỉ ẩn nút thì không đủ.
     - (b) chỉ chuyển khoản hoặc VietQR: chặn K1 và K2 (khoản thu giả bằng tiền mặt hoặc thẻ);
     - (c) ảnh chứng từ bắt buộc;
     - (d) luôn chờ đối soát, nên chưa đối soát thì không chi hoàn được;
     - yêu cầu hoàn tự tạo đứng tên người ghi, nên người ghi không tự duyệt.
   - **Chưa đủ ở 4 chỗ** (mục 3.2, thẻ ARC-02):
     - `confirmPaymentReceived` và `createVietQr` vẫn đặt được tiền lên đơn đã đóng, kể cả sale. Hai operation này không đi qua `recordPayment`;
     - nơi nhận hoàn của khoản này vẫn chọn được Tiền mặt;
     - "một khoản chỉ ghi một lần" mới là chữ trên hộp, máy chủ chưa chặn ghi trùng ở đơn cũ và đơn mới;
     - chưa có cờ "ghi sau khi đơn đóng" trên nhật ký và màn duyệt.
4. **v1.0.5 phải chặn ngay** (V5-48, bắt buộc, lên kể cả khi 5B-1 sang v1.0.6; không migration). Trên đơn đã đóng (`cancelled`, `no_show`), mọi vai kể cả OWN:
   - `recordPayment`: chỉ nhận `bank_transfer`, `vietqr`. Tiền mặt, POS, OTA → 422. Thiếu ảnh `deposit_receipt` → 422. Phần này trùng luật (b), (c) của DOM, nên 5B-1 dùng tiếp, không phải làm lại;
   - `confirmPaymentReceived` → 409;
   - `createVietQr` → 409.
   - Không bắt buộc trong V5-48: tự tạo yêu cầu hoàn, nút Desk, `deposit_after_cancel`. Ba phần này vẫn là 5B-1, mức nên có, theo đường cắt của quyết định 20.
   - Chi tiết ở mục 3.1.
5. **Tới khi v1.0.5 lên production** (dự kiến 20–21/11):
   - người duyệt hoàn làm theo lời dặn ở mục 3.3;
   - ORC chạy câu đếm chỉ đọc ở mục 5 khi INV cho phép SSH, để biết đường này đã bị dùng chưa;
   - có ca thuộc nhóm nặng thì SEC đổi kết luận (mục 3.5).
6. **Khôi phục đơn đã hủy về giữ chỗ (DOM 11.4 mục 6–10, 5B-2):**
   - FD+ (FD, FDL, MGR, OWN) tự làm, không cần duyệt, khi đủ ba điều kiện của DOM;
   - chỉ làm cùng lúc với việc ghi khoản thu có ảnh, chờ đối soát;
   - ngoài điều kiện thì không khôi phục;
   - sale, CTV không được làm;
   - audit và báo OWN/MGR như B12. Chi tiết ở mục 4.

---

## 1. Đường hiện có trên v1.0.4

### 1.1 Ghi khoản thu – `recordPayment` (A33)

| Điểm | Mã đang làm gì | Chỗ trong mã |
|---|---|---|
| Vai gọi được | OWN, MGR, FDL, FD: loại `deposit` hoặc `charge`. Sale: chỉ `deposit`, chỉ đơn của mình, không quá số còn phải thu, nên trên đơn đã đóng nhận 422 `AMOUNT_EXCEEDS_BALANCE`. CTV, buồng phòng, bảo trì: 403 (không có trong danh sách vai) | `openapi-meta.ts` 1404–1408; `payments.service.ts` 215, 281; `payment.service.ts` 369–377 |
| Đơn nào | Mọi đơn mà folio còn `open`. Folio chỉ thành `settled` ở bước trả phòng B18, và chỉ thành `closed` qua J15. Vì vậy folio của đơn `cancelled` (mọi lý do hủy, không riêng `hold_expired`) và đơn `no_show` **mở mãi**, không có hạn | `folio.service.ts` 868–886, 1352, 1449 |
| Cần gì (FD+) | Đơn đã đóng thường còn phải thu 0 đ, nên mọi khoản là "thu dư": chỉ cần **ghi chú từ 3 ký tự**. Các điều kiện khác: Giờ nhận tiền từ lúc tạo folio tới bây giờ; ghi lùi quá 24 giờ thì cũng cần ghi chú; thẻ POS cần mã chuẩn chi 1–12 ký tự, máy chủ không đối chiếu với máy POS nào | `payment.service.ts` 343–356, 163–173, 378–383 |
| Ảnh chứng từ | **Không bắt buộc** với mọi cách thu (`attachmentId` tùy chọn) | `payment.service.ts` 385–391 |
| Trần số tiền | **Không có** với FD+, chỉ giới hạn số nguyên an toàn | `payments.controller.ts` 29; `payment.service.ts` 370–384 |
| Đối soát | Chuyển khoản, VietQR: `pending`, quản lý trở lên đối soát với sao kê, người đối soát khác người ghi (trừ OWN). **Tiền mặt, thẻ POS, OTA: `not_required`**, tức là được coi là tiền chắc ngay | `payment.service.ts` 101–103, 229–233 |
| Nhật ký, báo | Nhật ký tiền `payment.recorded` ghi người làm, vai, số tiền, cách thu, cờ đối soát. SSE `payment.changed` gửi OWN, MGR và người ghi. **Không** có cờ "đơn đã đóng", **không** có mục "Cần chú ý", **không** tự tạo yêu cầu hoàn: đường tự tạo chỉ chạy cho đơn đã trả phòng | `payment.service.ts` 261–277; `payments.service.ts` 337–343, 352–359 |

### 1.2 Hai đường khác cũng đặt được tiền lên đơn đã đóng (SEC đọc mã, QA chưa chạy)

- **`confirmPaymentReceived`** ("Ghi nhận đã thu" của VietQR):
  - J1 tự hủy giữ chỗ nhưng **không** cho QR `pending` của đơn hết hạn. QR chỉ hết hạn lúc 06:00 hôm sau, hoặc khi đơn có QR mới (`payments.service.ts` 1065–1073; `expireOne` không đụng `payment`).
  - Chặn của FB-R4-SEC-BE-HOLDS-01 (`assertHoldOpenForSales`, dòng 243) chỉ xét đơn đang `hold`. Khi J1 đã hủy, FD+ và **cả sale với đơn của mình** đều xác nhận được QR đó. Với QR cọc, số tiền ≤ cọc còn thiếu, nên không cần ghi chú (dòng 511–515, 556–562).
  - Kết quả: khoản thu `succeeded`, `pending`, không ảnh (dòng 602–604). Bước B4 sau đó nhận 409.
  - Trên Desk, ca này xảy ra được không cần API. Người dùng mở hộp **Xác nhận cọc** trước khi J1 chạy, rồi bấm sau khi J1 đã hủy. Hộp gọi `confirmPaymentReceived` trước, `confirmDeposit` sau (`ReservationDialogs.tsx` 608–655).
- **`createVietQr`**: FD+ ghi lý do thu dư (`overBalanceReason`) là tạo được QR cho đơn đã đóng. Hàm chỉ chặn theo trạng thái cho mục đích `check_in`/`check_out` (dòng 1007–1023, 1049–1056). Khách trả theo QR này là có tiền về cho đơn đã hủy, đúng ca BUG-R5-002.

### 1.3 Yêu cầu hoàn và chi

| Bước | Mã đang làm gì | Chỗ trong mã |
|---|---|---|
| Tạo yêu cầu (`createRefundRequest`, A43) | OWN, MGR, FDL, FD. Mọi trạng thái đơn trừ `hold`, folio chưa `closed`. Lý do bắt buộc. Số tiền ≤ số dư thừa chưa có yêu cầu. Không cần ảnh | `openapi-meta.ts` 1599–1603; `refunds.service.ts` 363–388 |
| Ai duyệt | **MGR hoặc OWN**, không giới hạn số tiền theo vai. FDL bấm duyệt thì nhận 403 `APPROVAL_LIMIT_EXCEEDED`. Người duyệt xác thực lại bằng mật khẩu hoặc PIN. Yêu cầu được đẩy tới người duyệt | `limits.ts` 26, 40–44; `approval.service.ts` 670–705 |
| Người tạo tự duyệt? | **Không, với mọi vai, kể cả OWN.** Yêu cầu hoàn không bao giờ tự áp. Có CHECK `approval_request_refund_no_self_approval` ở DB | `approval.service.ts` 599, 1355–1359; migration `0040` 118–119 |
| Tách nhiệm khác | Người đặt nơi nhận không duyệt (trừ OWN với chuyển khoản). Người đã sửa giảm A32 trên folio không duyệt, không chi | `approval.service.ts` 1360–1375; `refunds.service.ts` 893–904 |
| Chi tiền mặt (A47a) | FD+. Người chi khác người tạo yêu cầu, không ngoại lệ. Ảnh biên nhận bắt buộc. Số chi ≤ số đã duyệt còn lại và ≤ phần dư "chắc" | `refunds.service.ts` 700–701, 723–739, 765–767 |
| Chi chuyển khoản (A47) | MGR hoặc OWN. Người chi khác người tạo yêu cầu, người duyệt và người đặt nơi nhận, trừ OWN. Chuyển khoản ngân hàng cần mã giao dịch và ảnh | `openapi-meta.ts` executeRefund; `refunds.service.ts` 700–712, 761–767 |
| Dư "chắc" | Gồm khoản đã đối soát và khoản `not_required`. Tiền mặt, thẻ ghi tay vì vậy **chi được ngay**. Chuyển khoản, VietQR thì bị chặn (`REFUND_SOURCE_NOT_RECONCILED`) tới khi MGR/OWN đối soát | `folio.service.ts` 435, 452; `refunds.service.ts` 731–739 |

**Chỗ hở trong tách nhiệm.** Người **ghi khoản thu** làm ra số dư không nằm trong luật tách nhiệm nào. Luật hiện chỉ loại người tạo yêu cầu, người duyệt, người đặt nơi nhận và người sửa giảm A32. Vì vậy:
- người ghi nhờ một người khác bấm tạo yêu cầu hoàn;
- sau đó chính người ghi duyệt yêu cầu đó (nếu là MGR), hoặc chi tiền mặt (nếu là FD+).

### 1.4 Trả lời gọn câu hỏi của ORC

| Câu hỏi | Trả lời |
|---|---|
| Vai nào gọi được | Ghi khoản thu và tạo yêu cầu hoàn trên đơn đã đóng: **FD, FDL, MGR, OWN**. Sale bị chặn ở `recordPayment` (422) nhưng qua được `confirmPaymentReceived` khi QR còn chờ (mục 1.2). CTV: 403 |
| Trạng thái đơn nào | **Mọi đơn `cancelled`** (mọi lý do, không riêng `hold_expired`) **và `no_show`**, không có hạn thời gian |
| Cần gì | Ghi chú từ 3 ký tự. **Không cần ảnh. Không có trần số tiền.** Tiền mặt và thẻ không cần đối soát |
| Có audit không | **Có**: nhật ký tiền cho khoản thu, yêu cầu, duyệt, chi; SSE cho OWN và MGR. Nhưng không cờ nào nói khoản thu được ghi sau khi đơn đã đóng, và không có mục "Cần chú ý" |
| Còn phải MGR/OWN duyệt không | **Có**, mọi yêu cầu hoàn, không theo hạn mức |
| Người tạo tự duyệt được không | **Không**, kể cả OWN (mã và CHECK DB). Nhưng người **ghi khoản thu** thì duyệt hoặc chi được, nếu người khác bấm tạo yêu cầu (mục 1.3) |

### 1.5 Lệch với luật

- **BR-522 ghi chú 18/10 (K11-06)** chỉ nói `addFolioLine`, tức dòng phí tay. Mã làm đúng phần đó (`folio-lines.service.ts` 213–216).
- **Khoản thu** trên đơn đã đóng: DOM đã ghi luật ở `e9e0e2e4` (BR-522 v0.5.13, 11.3 bảng "dòng tay" khác "khoản thu", 11.4 mục 2). Mã v1.0.4 chưa theo luật đó. V5-48 và 5B-1 đưa luật vào máy chủ.
- BR-527 ghi: lễ tân ghi chuyển khoản "kèm ảnh/mã giao dịch". Máy chủ không bắt ảnh với FD+, ở mọi đơn. Phần chung này để v1.0.6 (thẻ ARC-03). Phần đơn đã đóng làm ở V5-48.
- BR-522 cho hoàn "qua cùng phương thức hoặc chuyển khoản". Máy chủ vẫn chi tiền mặt được cho số dư sinh từ khoản thu thẻ POS hoặc chuyển khoản. Thẻ ARC-03.

---

## 2. Rủi ro trên production hôm nay

### 2.1 Kịch bản

| # | Kịch bản | Cần gì để làm được | Đang chặn | Chỗ hở | Mức |
|---|---|---|---|---|---|
| K1 | **Rút tiền bằng khoản thu giả.** Lễ tân ghi khoản thu giả "Thẻ POS" hoặc "Tiền mặt" (ví dụ 3.000.000, ghi chú "khách chuyển sau tự hủy") trên một đơn đã hủy. Tạo yêu cầu hoàn, chọn chi tiền mặt. Quản lý duyệt. Một người trực khác chi cho "khách", là người quen, ký biên nhận | Người làm biết gọi API bằng phiên Desk của mình (DevTools). Người duyệt không mở Nhật ký tiền. Người chi làm theo hàng chờ hoàn | Mọi yêu cầu hoàn cần MGR/OWN duyệt. Người tạo không tự duyệt, không tự chi. Chi phải có ảnh biên nhận. Nhật ký tiền ghi ai ghi khoản thu | Tiền mặt, thẻ được coi là tiền chắc ngay. Không trần số tiền, không ảnh. Màn duyệt không có cờ "ghi sau khi đóng". Người ghi không bị loại khỏi duyệt và chi. Khoản thẻ giả không đụng tới ngăn kéo, nên đếm tiền không lộ, và Desk chưa có đóng ca (US-124, v1.3) | **Trung bình**: thiệt hại cao, khả năng thấp |
| K2 | **Che khoản thiếu tiền mặt.** Ngăn kéo đã thiếu X. Lễ tân ghi khoản thu thẻ POS giả X rồi xin chi hoàn tiền mặt X, để sổ khớp với ngăn kéo | Như K1 | Như K1 | Như K1 | **Trung bình** |
| K3 | Như K1 nhưng khoản giả là **chuyển khoản hoặc VietQR** | Như K1, thêm người đối soát (MGR/OWN, khác người ghi) đối soát sai | Chi bị chặn tới khi khoản thu đối soát xong. Sao kê không có dòng nào thì lộ | Chỉ lọt khi quản lý thông đồng | **Thấp** |
| K4 | **Ghi nhầm, sai đối soát** (không gian lận) | Hôm nay chỉ qua API, nên hiếm | – | Nếu 5B-1 đưa nút lên Desk mà máy chủ chưa bắt luật (b), (c) của DOM: người trực chọn nhầm Tiền mặt cho tiền đã chuyển khoản. Khoản đó bỏ qua sao kê, yêu cầu hoàn chi được ngay, dòng sao kê không khớp đơn nào. Cùng loại: một khoản chuyển khoản ghi hai lần, ở đơn cũ và ở giữ chỗ mới (DOM 11.2) | Thấp hôm nay. **Trung bình–Cao sau 5B-1** nếu thiếu V5-48 hoặc điều kiện ở thẻ ARC-02 |
| K5 | **QR còn chờ trên đơn đã tự hủy.** Hộp Xác nhận cọc mở từ trước khi J1 chạy, hoặc gọi API (mục 1.2) | Không cần ý xấu, có thể xảy ra trên Desk | Khoản thu chờ đối soát, nên không chi được trước khi MGR/OWN thấy sao kê | Tiền nằm trên đơn đã hủy, không ai được báo (đúng BUG-R5-002). Sale lại ghi được tiền lên đơn của mình sau khi J1 hủy | **Thấp** |

### 2.2 Mức chung: Trung bình

- **Không phải Cao**, vì:
  - không có nút Desk: phải tự gọi API, trừ K5;
  - mọi khoản chi qua hai người khác nhau: MGR/OWN duyệt, rồi một người khác người tạo yêu cầu chi;
  - mọi bước có trong nhật ký tiền, lần ra được người ghi;
  - khoản chuyển khoản giả bị chặn chi tới khi đối soát sao kê;
  - cơ sở 10 căn, ít người dùng Desk, OWN là người duyệt chính.
- **Không phải Thấp**, vì:
  - tiền mặt và thẻ ghi tay chi được ngay, không trần, không ảnh, không cờ "ghi sau khi đóng";
  - người ghi khoản thu không bị tách khỏi duyệt và chi;
  - chưa có đóng ca để ngăn kéo tự đối chiếu;
  - 5B-1 sắp đưa đúng đường này lên nút Desk cho mọi lễ tân.
- **Đã bị dùng chưa:** chưa biết. Câu đếm ở mục 5 trả lời được. Desk v1.0.4 không có nút ghi khoản thu cho đơn đã đóng, nên mọi dòng "ghi tay" ở nhóm B1 đều đến từ gọi API thẳng.

---

## 3. Kết luận (b) – việc cụ thể

### 3.1 V5-48 – luật máy chủ cho khoản thu trên đơn đã đóng (bắt buộc v1.0.5; Gói 4, BE-B; không migration)

V5-48 là **phần luật máy chủ** ở bước (1) của quyết định 20, tức luật (a)–(d) của DOM 11.4 mục 2, cộng chặn hai operation không đi qua `recordPayment`.
- Theo plan, đây là nhánh "ảnh bắt buộc" của quyết định 20, mở rộng thêm hai chặn.
- **Không bắt buộc trong V5-48:** phần tự tạo yêu cầu hoàn của bước (1), nút Desk (bước 2), `deposit_after_cancel` (bước 3). Ba phần này ở lại 5B-1, mức nên có.
  - Lý do: tự tạo yêu cầu hoàn không bịt kẽ hở nào. Chi hoàn đã bị chặn tới khi khoản chuyển khoản được đối soát (`REFUND_SOURCE_NOT_RECONCILED`).
  - V5-48 vì vậy nhỏ, vừa làn BE-B đang kín. BE xác nhận ước.

**Áp khi nào.** Đơn chính của folio có `status` là `cancelled` hoặc `no_show`, với mọi vai, **kể cả OWN**.
- Đọc trạng thái dưới khóa đơn sẵn có: `scopedReservation(..., { lock: true })`, đã dùng ở `record` dòng 287 và `confirmReceived` dòng 533.
- Nhờ vậy, J1 hủy chen vào giữa lúc kiểm và lúc ghi cũng không lọt.

**`recordPayment` (`PaymentsService.record`):**
- Sale, CTV: vẫn bị chặn như hôm nay (422 `AMOUNT_EXCEEDS_BALANCE`, hoặc 404 nếu không phải đơn của mình). ARC chọn giữ mã đó hay đổi thành 403; điều bắt buộc là không ghi gì.
- `method` khác `bank_transfer`, `vietqr` → **422** (`method`, `NOT_IN_LIST`). Áp cho cả tiền mặt, `card_pos`, `ota_collect`.
- Thiếu `attachmentId` → **422** (`attachmentId`, `REQUIRED`).
  - Ảnh vẫn qua `assertUsable(..., 'deposit_receipt', { reservationId })` như hiện nay: đúng loại, đúng đơn.
  - `bindTo` giữ luật mỗi ảnh chỉ gắn một khoản.
- `reconciliation` luôn là `pending`. Hai cách thu này đã cho kết quả đó với mọi vai (`reconciliationFor`, dòng 101–103). V5-48 thêm một test để không ai đổi về sau.
- Giữ các luật đang có: ghi chú từ 3 ký tự (thu dư), khung Giờ nhận tiền.
- Nhật ký `payment.recorded` thêm `reservationStatus` (`cancelled` hoặc `no_show`) và `afterClosure: true`. Không thêm dữ liệu khách. Đây là chỗ bộ lọc tuần (S6) và câu đếm mục 5 đọc về sau.

**`confirmPaymentReceived` (`confirmReceived`):** QR còn chờ của đơn đã đóng → **409**, mọi vai.
- Tiền khách trả theo QR đó ghi bằng `recordPayment`, theo luật trên, có ảnh.

**`createVietQr`:** đơn đã đóng → **409**, mọi mục đích, kể cả khi có `overBalanceReason`.

**Mã lỗi:** ARC chốt.
- SEC đề xuất 409 `INVALID_TRANSITION`, kèm một trường cho biết đó là trạng thái **đơn** (`reservationStatus`), không phải trạng thái khoản thu.
- Lý do: hộp Xác nhận cọc đang đọc `currentState` của 409 như trạng thái khoản thu (`ReservationDialogs.tsx` 630–640).
- FE-A cho hộp đó hiện một câu rõ nghĩa, ví dụ "Đơn đã hủy. Làm theo Tờ 2a." UXD chốt chữ theo brand guideline OTTIMO: ngắn, điềm tĩnh, không emoji.
- Câu cho hai lỗi 422 đã có ở UXD `copy-v1.0.5.md` 9.1 (`field_error.after_cancel_method`, `field_error.after_cancel_proof`). Chỉ hiện khi 5B-1 có nút.

**Thứ tự kiểm:**
- 403 theo vai (dòng 281) → 404 theo phạm vi → luật đơn đã đóng → các luật còn lại của thân yêu cầu.
- Lỗi thì không ghi gì: không dòng `payment`, không nhật ký, folio không đổi version, ảnh không bị gắn.

**Không đụng tới các đường sau.** SEC đã rà; không đường thu hợp lệ nào cần tiền mặt hay QR mới trên đơn đã đóng.
- B2 `initialPayment`; B4 (`deposits.service.ts` đã 409 với đơn khác `hold`).
- B9, B18: `checkin.service.ts` 853 và `checkout.service.ts` 1221 gọi thẳng `recordInTx`, không qua `PaymentsService.record`.
- J24; `createRefundRequest` (trần là số dư thừa có thật); chi hoàn.
- `reversePayment`: MGR+ vẫn đảo được khoản ghi nhầm trên đơn đã đóng. Cần giữ đường này để dọn.
- Trên Desk:
  - `recordPayment` chỉ được gọi ở màn trả phòng (`PaymentPanel.tsx`) và thu nợ sau trả phòng (`DebtCollectDialog.tsx`);
  - `confirmPaymentReceived` chỉ được gọi ở `PaymentPanel.tsx`, `CheckInPayment.tsx` và hộp Xác nhận cọc của đơn `hold`.

**Nên làm cùng** (ARC quyết): J1, B5, B10 và B11 cho QR `pending` của đơn hết hạn ngay trong giao dịch hủy. Khi đó Desk không còn hiện QR cũ là "đang chờ".

**Ghi để ARC và INT nhớ (không phải việc v1.0.5).** Khi có báo tiền tự động từ ngân hàng:
- đường đó không đi qua các hàm trên;
- tiền về đơn đã đóng vẫn ghi được, nhưng phải sinh `deposit_after_cancel`.

**Khi 5B-1 lên:** dùng đúng nhánh này của `record`, như DOM chọn. Thêm S2–S8 ở mục 3.2. Không nới luật.

**Ca kiểm:** BE viết, QA duyệt. Xem thẻ QA-06.

### 3.2 5B-1 – thiết kế DOM đủ chưa, và điều kiện SEC thêm

**Thiết kế DOM (`e9e0e2e4`) bịt được gì:**

| Luật DOM 11.4 | Chặn kịch bản nào (mục 2.1) | Còn thiếu gì |
|---|---|---|
| 2(a) chỉ FD+ | Sale ghi tiền qua `recordPayment` | `confirmPaymentReceived` không đi qua `recordPayment`, nên sale vẫn xác nhận được QR còn chờ (K5). Bịt ở V5-48 |
| 2(b) chỉ chuyển khoản, VietQR | K1, K2: không còn khoản tiền mặt hay thẻ giả "chi được ngay" | Phải có ở máy chủ, mọi vai (S1) |
| 2(c) ảnh bắt buộc | Thêm dấu vết, thêm bước phải làm giả | Ảnh không chứng minh tiền về. Ảnh phải là thông báo tiền vào tài khoản OTTIMO (4.3) |
| 2(d) luôn chờ đối soát | K3 còn ở mức Thấp: muốn chi thì MGR/OWN phải đối soát sai | – |
| 3 yêu cầu hoàn đứng tên người ghi | Người ghi không tự duyệt | Chưa nói nơi nhận hoàn (S3) |
| 3 "một khoản chỉ ghi một lần" | – | Mới là chữ trên hộp. Máy chủ chưa chặn (S4) |
| 10 bộ lọc tuần | – | Cần cờ trên nhật ký (S6) |

**Kết luận:** DOM 5B-1 cộng V5-48 cộng S1–S8 dưới đây thì đủ bịt kẽ hở. Riêng DOM 5B-1, nếu không có S1 và S4, thì chưa đủ.

**Điều kiện SEC.** Bắt buộc khi 5B-1 lên, trừ S5 là nên có.

- **S1. Luật (a)–(d) nằm ở máy chủ, mọi vai, kể cả OWN.** Chính là V5-48. Desk ẩn nút không thay được việc này.
- **S2. Yêu cầu hoàn tự tạo đứng tên người ghi, không đứng tên hệ thống.**
  - Nếu đứng tên hệ thống: một MGR ghi khoản thu rồi duyệt được chính khoản hoàn sinh từ khoản đó. Luật hiện chỉ loại người tạo yêu cầu (mục 1.3).
  - Thêm người ghi vào `origin_actor_ids` của yêu cầu, như người sửa giảm A32. Như vậy người ghi không duyệt, không chi, kể cả khi yêu cầu bị từ chối rồi một người khác tạo lại.
- **S3. Nơi nhận hoàn: chuyển khoản về đúng tài khoản đã chuyển** (`original_method`). `executeCashRefund` trên yêu cầu này → 409 hoặc 422.
  - Lý do: tiền thật của khách đã về và đã đối soát. Nếu chi tiền mặt cho một người tự xưng là khách, khách thật vẫn chờ hoàn.
  - Đây là phần của 5B-1 trong thẻ ARC-03 (3). Phần chung cho mọi folio để v1.0.6.
- **S4. Một khoản chỉ ghi một lần, máy chủ phải biết.** Ca cần chặn: cùng một lần chuyển khoản ghi ở đơn cũ (sinh hoàn 100 %) **và** ở giữ chỗ mới theo DOM 11.2 (thành cọc). Nếu cả hai được đối soát với cùng một dòng sao kê, OTTIMO hoàn tiền khách đã dùng làm cọc.
  - **Tối thiểu (bắt buộc):** màn duyệt hoàn và màn đối soát hiện "Có thể trùng" khi có khoản chuyển khoản hoặc VietQR khác:
    - chưa đảo;
    - cùng số tiền;
    - Giờ nhận tiền cách nhau ≤ 24 giờ;
    - ở một đơn khác.
    Chỉ hiện mã đơn kia, không tên khách.
  - **Tốt hơn (nên có):** hộp ghi bắt mã giao dịch ngân hàng, lưu vào `payment.bank_reference` (cột đã có từ migration 0040, chưa đường thu nào dùng). Máy chủ trả 409 nếu mã đó đã có ở một khoản thu chưa đảo của cơ sở.
    - Không cần migration nếu kiểm trong giao dịch dưới khóa.
    - Cần một trường mới trong thân `recordPayment` (ARC, hợp đồng).
    - DOM xác nhận lễ tân đọc được mã này trên thông báo ngân hàng (thẻ DOM-04).
- **S5. Trần (nên có):** một khoản ≤ tổng tiền phòng của đơn cũ theo giá đã chốt. Vượt trần thì chỉ MGR/OWN ghi, kèm lý do.
  - Chặn lỗi gõ thừa số 0.
  - Đối soát cũng bắt được lỗi này, nên S5 chỉ là "nên".
- **S6. Cờ và chỗ xem.**
  - `afterClosure` (có từ V5-48) hiện trên màn duyệt hoàn ("Tiền về sau khi đơn đã đóng") và trên Nhật ký tiền.
  - Bộ lọc tuần cho MGR/OWN (DOM 11.4 mục 10).
- **S7. `createDepositNotice` của sale, CTV trên đơn đã đóng chỉ sinh mục `deposit_after_cancel`.**
  - Không sinh khoản thu.
  - Ảnh khách gửi kèm tin báo (nếu có) không được dùng làm ảnh chứng từ của khoản thu.
- **S8. "Không thấy tiền".**
  - Ghi chú bắt buộc (UXD đã có `today.money_after_cancel_not_found_note`).
  - Nhật ký ghi người bấm và giờ bấm. Bộ lọc tuần có các mục đóng kiểu này.
  - Lý do: nếu không, một mục báo tiền thật của khách bị đóng lặng lẽ.
- **Mọi điều kiện:** tin đẩy, nhật ký, log ứng dụng chỉ có mã đơn. Không tên khách, số điện thoại, số tài khoản.

**DOM 11.4 mục 2(e), (f), (g) và mục 4:** SEC không có ý kiến thêm.

### 3.3 Tới khi v1.0.5 lên production – lời dặn cho người duyệt hoàn (INV, MGR)

> Duyệt yêu cầu hoàn của đơn **đã hủy** hoặc **no-show**: mở Nhật ký tiền của đơn và xem khoản thu làm ra số dư.
> - Khoản thu ghi **sau giờ hủy** mà là **Tiền mặt** hoặc **Thẻ**: không duyệt, báo đội.
> - **Chuyển khoản, VietQR**: chỉ duyệt khi đã thấy tiền trên sao kê.

- Desk v1.0.4 không có nút ghi khoản thu cho đơn đã hủy. Một khoản như trên vì vậy chỉ có thể đến từ gọi API thẳng, hoặc ca K5.
- Lời dặn không đổi chính sách hoàn. PO chọn chỗ đặt (thẻ PO-B002-05): mục "Việc chủ đầu tư" của release notes, hoặc lời ORC báo INV trong round-summary. BA thêm vào sổ tay phần duyệt hoàn nếu PO xếp.

### 3.4 Vì sao không (a), không (c)

- **Không (a).**
  - Rủi ro Trung bình, chưa có dấu hiệu bị dùng.
  - Muốn lấy tiền phải qua tay MGR/OWN, và còn dấu vết trong nhật ký.
  - Hotfix là thêm một lần lên production ngoài round, trong khi v1.0.5 dự kiến lên 20–21/11 (khoảng 2 tuần).
  - Lời dặn 3.3 cộng câu đếm mục 5 đủ che khoảng này.
- **Không (c).**
  - DOM chọn dùng lại `recordPayment`, nên luật đơn đã đóng sớm muộn cũng phải nằm trong `recordPayment`. Làm ở v1.0.5 không thừa việc: 5B-1 dùng tiếp.
  - Việc nhỏ: ba hàm, không migration, không nút Desk, không đổi luật nghiệp vụ (luật đã là của DOM).
  - Đúng phần mà quyết định 20 xếp làm trước ("bịt luôn kẽ hở").
  - Để sang v1.0.6 thì đường tiền mặt không ảnh mở thêm một bản. Hộp Xác nhận cọc cũng vẫn ghi được tiền lên đơn vừa tự hủy (K5).

### 3.5 Khi nào SEC đổi kết luận

- **Câu đếm mục 5 có dòng B1 `ghi_tay` với cách thu `cash`/`card_pos`, hoặc dòng B2 `co` + `da_chi`:**
  - ORC báo INV trong ngày;
  - SEC tạo ESC Gấp, xét hotfix (a) chặn ngay;
  - INV đối chiếu quỹ, sao kê, Nhật ký tiền trên Desk.
- **Chỉ có dòng `xac_nhan_qr`/`vietqr`/`pending`:** gần như chắc là ca K5. Đó là tiền thật của khách, chưa chi được. Giữ (b); lễ tân xử lý như Tờ 2a.
- **5B-1 không kịp v1.0.5:** V5-48 vẫn lên v1.0.5 và đủ bịt kẽ hở. 5B-1 sang v1.0.6, dùng tiếp nhánh của V5-48, thêm S2–S8.
- **v1.0.5 dời quá 01/12:** xem mục 8.

---

## 4. Trả lời DOM 11.4 mục 10 – ai được khôi phục đơn đã hủy về giữ chỗ (5B-2, đích v1.0.6)

ORC gọi là "mục 4" theo bản trước của DOM. Ở `e9e0e2e4` câu hỏi nằm ở mục 10; điều kiện ở mục 6–9.

Phần dưới là yêu cầu bảo mật (quyền SEC). Giá và chính sách vẫn do DOM quyết.

### 4.1 Quyết định SEC

| | FD, FDL | MGR, OWN | Sale, CTV |
|---|---|---|---|
| Đủ ba điều kiện của DOM mục 6: (1) đơn bị hủy lúc còn là giữ chỗ (J1 `hold_expired` hoặc B5); (2) căn cũ còn trống đủ các đêm; (3) ngày nghiệp vụ chưa qua ngày đến | **Tự làm**, không cần duyệt | Tự làm | **Không** |
| Thiếu một điều kiện | Không khôi phục | **Không khôi phục**, kể cả OWN | Không |

- **Ngoài điều kiện không có nhánh "xin duyệt để khôi phục".**
  - Lối ra là hoàn (5B-1 mục 3), hoặc giữ chỗ mới như DOM 11.2.
  - Qua ngày đến mà khôi phục là xác nhận lùi ngày. Căn đã bán mà khôi phục là bán trùng. Cả hai đã có đường khác.
- **Vì sao FD, FDL tự làm được:**
  - giống B12 trong luật (A10, ghi chú 35);
  - tiền luôn chờ đối soát, và người đối soát khác người ghi (A46, trừ OWN);
  - thay đổi hẹp: cùng mã đơn, cùng căn, cùng giá;
  - MGR/OWN được báo ngay, và thấy trong bộ lọc tuần.
- **Rủi ro còn lại, chấp nhận.** Ảnh giả dẫn tới một đơn đã xác nhận mà khách chưa trả.
  - Rủi ro này giống B4 hôm nay: BR-527 cho đơn xác nhận ngay khi đủ cọc, đối soát sau.
  - Bù lại: quá `bank_reconcile_alert_days` (2 ngày) chưa đối soát thì sinh "Cần chú ý".
  - Đối soát thấy không có tiền: ghi `disputed`, MGR/OWN xử lý như cọc không về.
- **Ca 2 giữ cùng giá** (DOM 11.2, sửa 06/11 khuya) là quyết định nghiệp vụ. SEC không phản đối, vì:
  - giá giữ là giá đã báo khách;
  - mọi lần khôi phục đều có tiền, ảnh, đối soát;
  - mọi lần khôi phục đều nằm trong bộ lọc tuần.

### 4.2 Điều kiện máy chủ (mọi vai)

- **Kiểm ở máy chủ.** Ba điều kiện kiểm dưới khóa căn (`occupancy.lockRooms`), như B12 và J1. Hai thao tác cùng lúc trên một căn thì một bên nhận 409, không bán trùng.
- **Chỉ cùng lúc với ghi khoản thu theo V5-48:** chuyển khoản hoặc VietQR, có ảnh, chờ đối soát. Không có thao tác "khôi phục" riêng mà không kèm tiền.
  - Khôi phục khi chưa có tiền thì thành gia hạn giữ chỗ lần hai, giữ giá cũ. Điều đó vượt BR-303 (chỉ gia hạn 1 lần).
- **Một giao dịch:** ghi khoản thu, khôi phục, xác nhận cọc. Lỗi ở bất kỳ bước nào thì không ghi gì (DOM mục 8).
- **Đơn cũ còn yêu cầu hoàn chưa đóng** (ví dụ B5 hủy giữ chỗ có cọc một phần): lỗi rõ, không khôi phục, tới khi yêu cầu đó bị từ chối hoặc bị hủy.
  - Lý do: tránh cùng một số tiền vừa được tính vào cọc vừa được chi hoàn.
  - Số đã chi hoàn trước đó không được tính vào cọc. Số dư folio đã trừ phần này, BE kiểm bằng test.
- **Lý do khôi phục bắt buộc.** Dùng chung Ghi chú của khoản thu cũng được.
- Mã đơn, căn và giá đêm (snapshot cũ) giữ nguyên, theo DOM.
- **Thiếu cọc:** đơn thành giữ chỗ có cọc một phần đã quá hạn, theo BR-303 (DOM mục 7).
  - Không cho FD gia hạn thêm từ trạng thái này. BR-303 đã chỉ cho 1 lần.

### 4.3 Chứng từ

- Ảnh thông báo **tiền vào tài khoản OTTIMO**: chủ đầu tư gửi, hoặc lấy từ app ngân hàng của OTTIMO.
  - Không dùng ảnh chụp hay SMS khách gửi.
  - UXD có thể thêm cụm "vào tài khoản OTTIMO" vào nhãn `rsv.after_cancel.proof` (thẻ DOM-04).
- Ảnh gắn với khoản thu (`deposit_receipt`), lưu và xóa theo hạn của ảnh chứng từ hiện hành (SEC I5).
- Nếu S4 bản tốt hơn được làm: mã giao dịch ngân hàng là bắt buộc.
- Ghi chú không chép số tài khoản đầy đủ của khách.

### 4.4 Audit

- **`state_transition`** `cancelled → hold` hoặc `cancelled → confirmed` (mã sự kiện ARC đặt). Ghi:
  - người làm, lý do;
  - `cancel_reason_code` cũ, hạn giữ chỗ cũ;
  - mã khoản thu.
- **Nhật ký tiền:** `payment.recorded` có `afterClosure`. Xác nhận cọc ghi như thường.
- **Báo OWN và MGR**, không gửi người làm, như `no_show_restored`. Tin chỉ có mã đơn.
- **"Cần chú ý" `deposit_after_cancel`** đóng khi đơn đã khôi phục **và** khoản thu đã đối soát, hoặc khi đã hoàn xong.
- **Bộ lọc tuần cho quản lý:** đơn khôi phục sau khi hủy, kèm người làm (DOM 11.4 mục 10).
- Nhật ký, tin đẩy và log ứng dụng không có tên khách, số điện thoại, số tài khoản.

### 4.5 Căn đã bán, hoặc đã qua ngày đến

- Trả mã lỗi rõ (ARC chốt), không 500. Không ghi nửa chừng.
- Lễ tân chọn lối hoàn (5B-1 mục 3), hoặc mời căn khác bằng một giữ chỗ mới như DOM 11.2.
- Không tự đổi căn trong thao tác khôi phục.

---

## 5. Câu đếm chỉ đọc trên production (ORC chạy khi INV cho phép SSH; SEC không chạy)

### 5.1 Luật chạy

Theo luật 1–5 và 7 của `rounds/round-04/qa/v1.0.4-prod-readonly-pack.md` mục 1:
- chạy một lần gọi SSH, từ tệp trích ra từ commit này, so SHA-256 trước (mục 5.3);
- không dán tay, không sửa câu, không `tee`, không `>`;
- 5 dòng đầu phải đúng `on`, `ottimo_readonly`, `30s`, `3s`, `t|f`, khác thì dừng;
- có lỗi, hoặc dòng cuối không phải `#END`: dừng, chỉ báo SEC mục `#B…` và loại lỗi, không chép giá trị trong lỗi;
- gặp `permission denied`: dừng, báo OPS, không chạy lại bằng vai quản trị;
- một nhóm đủ 200 dòng: dừng, báo SEC.

Thêm cho gói này:
- **Thời điểm.** Hỏi INV cho phép trong chat, vì quyền ngày 05/11 và 06/11 chỉ dành cho các lần chạy trước. Nên gộp vào lần SSH kéo sao lưu ĐK-3 (`rounds/round-05/qa/v5-02-closeout.md` mục 4), trước 10/11, để ARC kịp chốt hướng 5B-1. Không chạy khi `deploy.sh` hoặc migrate đang chạy.
- **Không có khối in mã đơn.** Chỉ có số đếm và nhãn nhóm: trạng thái đơn, lý do hủy, đường ghi, cách thu, cờ đối soát, trạng thái khoản thu, vai người ghi, trạng thái yêu cầu, cờ đã chi.
  - Không có mã đơn, ngày, số tiền, tên, liên hệ, id người.
  - ORC chép nguyên các dòng kết quả vào decision-log, kèm giờ chạy.
- **Cần xem từng đơn** (chỉ khi mục 3.5 bảo vậy): INV/MGR tự lọc trên Desk (Nhật ký tiền, lọc theo cách thu và ngày). Không chạy câu in mã đơn nếu SEC chưa viết riêng và INV chưa đồng ý.

### 5.2 Khối chạy

Dòng `ssh` trùng từng ký tự với dòng 61 của `rounds/round-04/qa/v1.0.4-prod-readonly-pack.md`, bản đã được SEC duyệt.

```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'\''' <<'SQL'
SHOW default_transaction_read_only;
SELECT current_user;
SHOW statement_timeout;
SHOW lock_timeout;
SELECT r.rolbypassrls, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user;
SELECT '#B1 khoan thu ghi sau khi don da dong';
WITH dong AS (
  SELECT r.id, r.status, COALESCE(r.cancel_reason_code, '-') AS ly_do,
         CASE WHEN r.status = 'cancelled' THEN r.cancelled_at ELSE r.no_show_marked_at END AS luc_dong
    FROM reservation r
   WHERE r.status IN ('cancelled', 'no_show')
),
thu AS (
  SELECT d.status, d.ly_do,
         CASE WHEN p.confirmed_at IS NOT NULL THEN 'xac_nhan_qr' ELSE 'ghi_tay' END AS duong,
         p.method, p.reconciliation, p.status AS trang_thai_thu,
         COALESCE(p.recorded_by_role, '-') AS vai_ghi
    FROM payment p
    JOIN dong d ON d.id = p.reservation_id
   WHERE p.type IN ('deposit', 'charge')
     AND p.reversal_of_id IS NULL
     AND p.amount_vnd > 0
     AND p.status IN ('succeeded', 'reversed')
     AND d.luc_dong IS NOT NULL
     AND COALESCE(p.confirmed_at, p.created_at) > d.luc_dong
)
SELECT COALESCE(status, 'TONG'), ly_do, duong, method, reconciliation, trang_thai_thu, vai_ghi, count(*)
  FROM thu
 GROUP BY GROUPING SETS ((status, ly_do, duong, method, reconciliation, trang_thai_thu, vai_ghi), ())
 ORDER BY GROUPING(status), 1, 2, 3, 4, 5, 6, 7
 LIMIT 200;
SELECT '#B2 yeu cau hoan tao sau khi don da dong';
WITH dong AS (
  SELECT r.id, r.status, COALESCE(r.cancel_reason_code, '-') AS ly_do,
         CASE WHEN r.status = 'cancelled' THEN r.cancelled_at ELSE r.no_show_marked_at END AS luc_dong
    FROM reservation r
   WHERE r.status IN ('cancelled', 'no_show')
),
thu_muon AS (
  SELECT DISTINCT p.reservation_id
    FROM payment p
    JOIN dong d ON d.id = p.reservation_id
   WHERE p.type IN ('deposit', 'charge')
     AND p.reversal_of_id IS NULL
     AND p.amount_vnd > 0
     AND p.status IN ('succeeded', 'reversed')
     AND d.luc_dong IS NOT NULL
     AND COALESCE(p.confirmed_at, p.created_at) > d.luc_dong
),
yc AS (
  SELECT d.status AS don,
         CASE WHEN t.reservation_id IS NULL THEN 'khong' ELSE 'co' END AS co_thu_muon,
         a.status AS yeu_cau,
         CASE WHEN a.refunded_vnd > 0 THEN 'da_chi' ELSE 'chua_chi' END AS chi
    FROM approval_request a
    JOIN dong d ON a.target_type = 'reservation' AND d.id = a.target_id
    LEFT JOIN thu_muon t ON t.reservation_id = d.id
   WHERE a.type = 'refund'
     AND d.luc_dong IS NOT NULL
     AND a.requested_at > d.luc_dong + interval '5 seconds'
)
SELECT COALESCE(don, 'TONG'), co_thu_muon, yeu_cau, chi, count(*)
  FROM yc
 GROUP BY GROUPING SETS ((don, co_thu_muon, yeu_cau, chi), ())
 ORDER BY GROUPING(don), 1, 2, 3, 4
 LIMIT 200;
SELECT '#B3 VietQR con cho tren don da dong';
SELECT COALESCE(r.status, 'TONG'), count(*)
  FROM payment p
  JOIN reservation r ON r.id = p.reservation_id
 WHERE p.method = 'vietqr'
   AND p.status = 'pending'
   AND r.status IN ('cancelled', 'no_show')
 GROUP BY GROUPING SETS ((r.status), ())
 ORDER BY GROUPING(r.status), 1;
SELECT '#END';
SQL
```

### 5.3 Trích từ commit, so SHA, rồi chạy

```bash
cd /Users/anhvh/Desktop/hotel-app
C=$(git log -1 --format=%H -- rounds/round-05/reviews/SEC-on-bug-r5-002.md)
W=$(mktemp -d)
git show "${C}:rounds/round-05/reviews/SEC-on-bug-r5-002.md" > "$W/b002.md"
awk -v d="$W" '/^ssh .*<<'\''SQL'\''$/ {n++; f=d "/b002_" n ".sh"; h=d "/b002_" n ".sql"; print > f; inb=1; next}
  inb && /^SQL$/ {print > f; close(f); close(h); inb=0; next}
  inb {print > f; print > h}' "$W/b002.md"
cd "$W" && shasum -a 256 b002_1.sql b002_1.sh
```

**Đúng là** (cả 2 dòng phải trùng; lệch thì không chạy, báo SEC):

| Tệp | SHA-256 |
|---|---|
| `b002_1.sql` (heredoc) | `339cd5c472fcd869a38afff93510fdf8c4dff6f6dcdad4005dc0115d6429570d` |
| `b002_1.sh` (cả khối, gồm dòng `ssh`) | `fde3432d1fea7bd0a399faae6754ae5135b652417a7afade844c355710b9edad` |

Chạy: `bash "$W/b002_1.sh"`, một lần gọi, không `| tee`, không `>`. Xong thì xóa `$W`; thư mục này chỉ chứa câu SQL.

### 5.4 Đọc kết quả

| Mục | Cột | Đúng là | Khác thì |
|---|---|---|---|
| Chốt phiên | 5 dòng | `on`, `ottimo_readonly`, `30s`, `3s`, `t|f` | Dừng (luật 3 của gói v1.0.4) |
| `#B1` | trạng thái đơn, lý do hủy, đường (`ghi_tay`/`xac_nhan_qr`), cách thu, cờ đối soát, trạng thái khoản thu, vai người ghi, số khoản | Chỉ một dòng `TONG\|\|\|\|\|\|\|0` | Dòng `ghi_tay` cách thu `cash`/`card_pos`: mục 3.5, nhóm nặng. Dòng `ghi_tay` cách thu `bank_transfer`/`vietqr`: ORC báo INV; MGR/OWN đối soát các khoản `pending` với sao kê trước khi duyệt hoàn nào trên đơn đó. Dòng `xac_nhan_qr`: ca K5, giữ (b) |
| `#B2` | trạng thái đơn, có khoản thu muộn (`co`/`khong`), trạng thái yêu cầu, đã chi (`da_chi`/`chua_chi`), số yêu cầu | Không dòng `co`. Dòng `khong` được phép: hoàn lập lại sau khi hệ thống tính lại, hoặc lễ tân tạo lại yêu cầu bị từ chối | `co` + `da_chi`: mục 3.5, nhóm nặng. `co` + `chua_chi`: không duyệt yêu cầu đó tới khi INV đối chiếu theo lời dặn 3.3 |
| `#B3` | trạng thái đơn, số QR còn chờ | Số nhỏ, hết sau 06:00 hôm sau. Không phải dấu hiệu lạm dụng, chỉ cho biết K5 có thể xảy ra hôm nay | – |
| Dòng cuối | `#END` | – | Dừng, báo SEC |

Đã thử trên DB dùng một lần, dữ liệu giả:
- đếm đúng khoản ghi sau lúc đóng: tiền mặt ghi tay, QR xác nhận muộn, thẻ đã bị đảo;
- bỏ đúng khoản ghi trước lúc đóng, dòng đảo, khoản của đơn còn mở, yêu cầu hoàn hệ thống tạo lúc hủy;
- không có dòng nào thì in đúng một dòng `TONG` = 0.

---

## 6. Thẻ feedback

### FB-R5-SEC-BE-B002-01
- Mức độ: Major
- Người nhận:
  - BE-B: làm;
  - ARC: mã lỗi, một dòng hợp đồng 0.3.13 cho 3 operation;
  - FE-A, UXD: câu lỗi 409 ở hộp Xác nhận cọc.
- Vị trí: `product/services/api/src/modules/payments/internal/payments.service.ts`:
  - `record` 273–345;
  - `confirmReceived` 521–647;
  - `createVietQr` 972–1023.
- Vấn đề:
  - FD, FDL, MGR, OWN ghi được khoản thu trên mọi đơn `cancelled` hay `no_show`: không ảnh, không trần. Tiền mặt và thẻ không cần đối soát (mục 1.1).
  - Sale ghi được tiền lên đơn đã tự hủy của mình qua `confirmPaymentReceived` khi QR còn chờ (mục 1.2).
  - FD+ tạo được QR mới cho đơn đã đóng.
  - Desk không có nút cho các đường này, trừ ca hộp Xác nhận cọc mở từ trước khi J1 chạy (K5).
  - DOM đã chốt luật (11.4 mục 2), nhưng máy chủ chưa theo.
- Vì sao quan trọng: K1, K2 ở mục 2. Tiền ra khỏi quỹ bằng một khoản thu giả, hoặc che một khoản thiếu tiền mặt.
- Đề xuất sửa: **V5-48** đúng như mục 3.1. Trên đơn đã đóng, mọi vai, kể cả OWN:
  - `recordPayment` chỉ nhận `bank_transfer`, `vietqr`, còn lại → 422;
  - thiếu ảnh `deposit_receipt` → 422;
  - luôn `pending`;
  - nhật ký có `afterClosure`;
  - `confirmPaymentReceived` → 409;
  - `createVietQr` → 409.
  - Thứ tự kiểm và các đường không đụng: theo mục 3.1.
  - Không gồm tự tạo yêu cầu hoàn.
- Trạng thái: Open

### FB-R5-SEC-ARC-B002-02
- Mức độ: Major
- Người nhận: ARC chốt hướng 5B-1 trước 10/11, rồi BE-B hoặc BE-D, FE-A. DOM, QA biết.
- Vị trí:
  - `rounds/round-05/plan.md`: dòng V5-5B, quyết định 20;
  - DOM `rules-v1.0.5.md` 11.4 (`e9e0e2e4`);
  - UXD `copy-v1.0.5.md` 9.1.
- Vấn đề: thiết kế DOM 5B-1 đúng hướng. Dùng lại `recordPayment` được, với điều kiện nhánh đơn đã đóng chính là V5-48. Còn thiếu:
  - yêu cầu hoàn tự tạo phải đứng tên người ghi (S2);
  - nơi nhận hoàn (S3);
  - máy chủ biết một khoản đã ghi hai lần (S4);
  - cờ và bộ lọc tuần (S6);
  - tin báo của sale và nút "Không thấy tiền" (S7, S8).
  - 5B-2 chưa nói ai làm, và làm trong điều kiện nào ở máy chủ.
- Vì sao quan trọng:
  - Thiếu S2: một MGR ghi khoản thu rồi duyệt được khoản hoàn sinh từ khoản đó.
  - Thiếu S4: cùng một lần chuyển khoản vừa thành cọc ở đơn mới, vừa được hoàn 100 % ở đơn cũ (K4 lên mức Trung bình–Cao).
  - Thiếu S3: tiền thật của khách đã đối soát có thể được chi tiền mặt cho người khác.
- Đề xuất sửa:
  - 5B-1: theo S1–S8 ở mục 3.2. S5 là nên có; S4 tối thiểu là cảnh báo "Có thể trùng".
  - 5B-2: theo mục 4. FD+ tự làm trong ba điều kiện DOM, chỉ cùng thao tác với khoản thu V5-48. Ngoài điều kiện thì không khôi phục. Kèm các điều kiện máy chủ 4.2 và audit 4.4.
  - ARC ghi các điều kiện này vào hợp đồng 0.3.13 hoặc 0.3.14. SEC review PR hợp đồng và PR BE.
- Trạng thái: Open

### FB-R5-SEC-ARC-B002-03
- Mức độ: Minor (v1.0.6)
- Người nhận: ARC, BE-B. DOM xác nhận phần luật.
- Vị trí:
  - `approval.service.ts` 1355–1375;
  - `refunds.service.ts` 700–712, 723–739;
  - `payment.service.ts` 370–384;
  - `folio.service.ts` 435, 452.
- Vấn đề:
  1. Người ghi khoản thu làm ra số dư không nằm trong luật tách nhiệm của yêu cầu hoàn (mục 1.3). S2 chỉ sửa cho 5B-1.
  2. Trên đơn còn mở, gọi thẳng API thì FD+ vẫn ghi được khoản thu dư bằng tiền mặt hoặc thẻ, chỉ cần ghi chú. Khoản đó chi được ngay. Desk thì chặn ở màn trả phòng (`PaymentPanel.tsx` 136–157).
  3. Số dư sinh từ khoản thu thẻ POS hoặc chuyển khoản vẫn chi hoàn bằng tiền mặt được. BR-522 chỉ cho "cùng phương thức hoặc chuyển khoản". S3 chỉ sửa cho 5B-1.
- Vì sao quan trọng: đây là cùng cơ chế K1, nhưng trên đơn còn mở. Mức thấp hơn, vì:
  - khách đang ở;
  - DOM G-15 cho thu dư kèm ghi chú;
  - BR-522 chấp nhận tiền mặt, thẻ là tiền chắc.
  V5-48 không đóng đường này.
- Đề xuất sửa (v1.0.6):
  - (1) Người ghi các khoản thu làm ra số dư được thêm vào `origin_actor_ids` của mọi yêu cầu hoàn trên folio đó.
  - (2) Máy chủ dùng cùng luật như Desk cho thu dư tiền mặt, thẻ qua API (≤ số còn phải thu). Nếu DOM cần giữ thu dư, khoản dư phải chờ một người khác xác nhận, như A46a, rồi mới chi được.
  - (3) Chỉ chi tiền mặt khi folio có khoản thu tiền mặt đủ số. Không đủ thì chi chuyển khoản.
  - Nếu OTTIMO không dùng máy POS thẻ: PO xem có ẩn cách thu "Thẻ" trên Desk không.
- Trạng thái: Open

### FB-R5-SEC-DOM-B002-04
- Mức độ: Minor
- Người nhận: DOM. UXD biết (ý 3).
- Vị trí: `rounds/round-05/outputs/DOM/rules-v1.0.5.md` 11.4 mục 2(c) và mục 3; `product/docs/business-rules.md` BR-522.
- Đã xong ở `e9e0e2e4`, SEC đóng hai ý của bản trước:
  - 11.3 tách "dòng tay" và "khoản thu";
  - 11.2 cho Ca 2 cùng giá.
- Vấn đề còn lại:
  1. Chưa có luật nơi nhận hoàn cho khoản thu ghi sau khi đơn đóng.
  2. "Một khoản chỉ ghi một lần" chưa có cách xử lý khi đã lỡ ghi hai lần.
  3. 11.4 mục 2(c) chưa nói ảnh chứng từ là ảnh của ai.
  4. S4 bản tốt hơn cần biết lễ tân có đọc được mã giao dịch ngân hàng không.
- Vì sao quan trọng: BE, QA cần căn cứ cho S3, S4. Ảnh khách gửi không chứng minh tiền đã về.
- Đề xuất sửa:
  1. Thêm vào 11.4 mục 3 và BR-522: "hoàn chuyển khoản về tài khoản đã chuyển, không chi tiền mặt".
  2. Thêm: khi thấy một khoản đã ghi ở cả đơn cũ và đơn mới:
     - khoản ở đơn cũ ghi `disputed`;
     - MGR/OWN đảo khoản đó;
     - yêu cầu hoàn đi kèm bị hủy;
     - ghi sổ giao ca.
  3. Thêm vào 11.4 mục 2(c): "ảnh thông báo tiền vào tài khoản OTTIMO (chủ đầu tư gửi hoặc app ngân hàng của OTTIMO), không dùng ảnh hay SMS khách gửi". UXD có thể thêm cụm "vào tài khoản OTTIMO" vào nhãn `rsv.after_cancel.proof`.
  4. Xác nhận lễ tân đọc được mã giao dịch trên thông báo ngân hàng. Không đọc được thì S4 chỉ làm bản tối thiểu.
- Trạng thái: Open

### FB-R5-SEC-PO-B002-05
- Mức độ: Major
- Người nhận: PO xếp bản. ORC: lời dặn, câu đếm. BA: sổ tay, nếu PO xếp.
- Vị trí:
  - `rounds/round-05/plan.md`: dòng V5-5B ("Chỗ cho kết luận SEC"), quyết định 20, mục 7 (bảng đếm);
  - `product/docs/release-notes.md` mục v1.0.5.
- Vấn đề: plan để V5-48 chờ kết luận SEC. SEC kết luận nhánh "ảnh bắt buộc", mở rộng (mục 3.1).
- Vì sao quan trọng: luật chỉ có tác dụng khi được xếp vào bản. Khoảng tới 20–21/11 cần lời dặn cho người duyệt.
- Đề xuất sửa:
  1. Đưa **V5-48** vào v1.0.5: bắt buộc, Gói 4, BE-B, không migration. Đếm vào mục 7.
     - Phạm vi: phần luật máy chủ của bước (1), cộng chặn `confirmPaymentReceived` và `createVietQr` (mục 3.1).
     - Không gồm tự tạo yêu cầu hoàn. Phần đó ở lại 5B-1, mức nên có.
     - Tiêu chí: mục 3.1. Ca kiểm: thẻ QA-06.
  2. 5B-1 thêm tiêu chí nghiệm thu S2–S8 (mục 3.2). 5B-2 thêm tiêu chí từ mục 4.
     - 5B-1 không kịp thì sang v1.0.6. V5-48 vẫn ở v1.0.5.
  3. Lời dặn 3.3: chọn chỗ (release notes "Việc chủ đầu tư", hoặc ORC báo INV trong round-summary). Gỡ khi V5-48 lên production.
  4. ORC xin INV cho phép chạy câu đếm mục 5, trước 10/11 nếu được.
- Trạng thái: Open

### FB-R5-SEC-QA-B002-06
- Mức độ: Minor
- Người nhận: QA
- Vị trí: `rounds/round-05/qa/bug-list.md` BUG-R5-002: mục "Phát hiện thêm" và "Ca hồi quy đề xuất".
- Vấn đề:
  - Bug ghi đường `recordPayment` và `createRefundRequest`, chưa ghi `confirmPaymentReceived` (cả sale) và `createVietQr` trên đơn đã đóng (mục 1.2).
  - Chưa có ca kiểm cho V5-48.
- Vì sao quan trọng: V5-48 phải chặn cả ba operation. Sót một cái thì đường vẫn mở.
- Đề xuất sửa:
  - Thêm hai đường ở mục 1.2 vào "Phát hiện thêm", ghi "SEC đọc mã". Nếu được, chạy lại một lần trên stack local như lần 06/11.
  - Giữ **P2**. SEC không đổi mức: mức Trung bình là của phần bảo mật, đã có V5-48.
  - Ca (a) của bug đã đổi theo DOM: đơn hủy vì lý do khác → **nhận** khoản chuyển khoản có ảnh.
  - Ca cho V5-48 (BE viết, QA duyệt). Áp trên đơn `cancelled` (`hold_expired` và một lý do khác) và `no_show`:
    - (h1) FD, FDL, MGR, OWN gọi `recordPayment`:
      - tiền mặt, `card_pos`, `ota_collect` → 422;
      - chuyển khoản không ảnh → 422;
      - lỗi thì không có dòng `payment`, không nhật ký, version folio không đổi, ảnh không bị gắn;
    - (h2) FD+ ghi chuyển khoản hoặc VietQR có ảnh → 201, `pending`. OWN ghi cũng `pending`. Nhật ký có `afterClosure: true`;
    - (h3) sale với đơn đã tự hủy của mình:
      - `recordPayment` vẫn bị chặn;
      - `confirmPaymentReceived` với QR còn chờ → 409;
      - CTV → 403;
    - (h4) `confirmPaymentReceived` của FD+ với QR còn chờ của đơn đã tự hủy → 409. Hộp Xác nhận cọc hiện câu "đơn đã hủy", không hiện lỗi chung;
    - (h5) `createVietQr`, kể cả có `overBalanceReason`, trên đơn đã đóng → 409;
    - (h6) hồi quy, không đổi:
      - thu ở bước nhận phòng, trả phòng, thu nợ sau trả phòng;
      - B4 trên giữ chỗ còn hạn và quá hạn có tiền (`v104-holds.test.ts`);
      - `reversePayment` trên đơn đã đóng;
      - `createRefundRequest` và chi hoàn cho số dư có sẵn của đơn đã hủy.
  - Khi 5B-1, 5B-2 lên: thêm ca cho S2–S8 và mục 4.2 (người ghi không duyệt, không chi; chi tiền mặt bị chặn; cảnh báo "Có thể trùng"; khôi phục khi còn yêu cầu hoàn chưa đóng → lỗi).
- Trạng thái: Open

---

## 7. Điểm làm tốt (giữ)

- Tách nhiệm hoàn tiền chắc:
  - người tạo không bao giờ tự duyệt, kể cả OWN, có cả CHECK ở DB;
  - người chi tiền mặt khác người tạo, không ngoại lệ;
  - số dư từ chuyển khoản chưa đối soát không chi được.
  Nhờ vậy đường hở này vẫn cần hai người khác nhau mới lấy được tiền.
- Nhật ký tiền có ở mọi bước, ghi cả vai lúc làm (A-40). Người lạm dụng lần ra được.
- QA chạy cục bộ, không đụng staging, production, và ghi rõ mã HTTP cùng `Problem.code`. Nhờ vậy SEC đối chiếu thẳng với mã.

---

## 8. Giả định

- **[GIẢ ĐỊNH]** OTTIMO chưa có máy POS thẻ tại quầy. Nếu có, K1 bằng "Thẻ" khó che hơn khi chủ đầu tư đối chiếu bảng kê POS, nhưng mức chung không đổi.
- **[GIẢ ĐỊNH]** Lễ tân không được hướng dẫn gọi API thẳng, và không có công cụ nội bộ nào gọi `recordPayment` cho đơn đã đóng. Câu đếm mục 5 kiểm giả định này.
- **[GIẢ ĐỊNH]** v1.0.5 lên production 20–21/11 (plan mục "Thứ tự và lịch đề xuất"). Nếu dời quá 01/12 thì SEC xem lại: có thể tách V5-48 thành bản riêng như ngoại lệ ở quyết định 19.
- **[GIẢ ĐỊNH]** Desk v1.0.5 không thêm chỗ gọi `recordPayment`, `confirmPaymentReceived` hay `createVietQr` cho đơn đã đóng ngoài 5B-1. Nếu có, chỗ đó theo V5-48.
- **[GIẢ ĐỊNH]** Mã giao dịch ngân hàng có trên thông báo tiền vào của OTTIMO (cho S4 bản tốt hơn). DOM xác nhận ở thẻ DOM-04.
- Phần ở mục 1.2 là SEC đọc mã, chưa chạy. Thẻ QA-06 xin QA chạy.

---

## 9. Dòng decision-log

`| 2026-11-06 | 5 | SEC – BUG-R5-002 phần quyền (rounds/round-05/reviews/SEC-on-bug-r5-002.md, theo DOM 11.4 bản e9e0e2e4): mức **Trung bình**, không hotfix, không ESC. Kết luận **(b)**: **V5-48 bắt buộc v1.0.5**, Gói 4, không migration. Trên đơn đã đóng (cancelled, no_show), mọi vai kể cả OWN: recordPayment chỉ nhận bank_transfer/vietqr (tiền mặt, POS, OTA → 422), thiếu ảnh deposit_receipt → 422, luôn chờ đối soát, nhật ký có afterClosure; confirmPaymentReceived → 409; createVietQr → 409. Tự tạo yêu cầu hoàn, nút Desk, deposit_after_cancel vẫn là 5B-1 (nên có). Thiết kế DOM 5B-1 đủ bịt kẽ hở khi có V5-48 và S2–S8: hoàn đứng tên người ghi, hoàn chuyển khoản về tài khoản đã chuyển (không tiền mặt), máy chủ cảnh báo "Có thể trùng", cờ và bộ lọc tuần. Khôi phục về giữ chỗ (5B-2): FD+ tự làm, không cần duyệt, khi đủ ba điều kiện DOM 11.4 mục 6 và chỉ cùng thao tác với khoản thu V5-48; ngoài điều kiện không khôi phục, kể cả OWN; sale, CTV không; còn yêu cầu hoàn chưa đóng thì không khôi phục; audit cancelled → hold/confirmed, báo OWN/MGR. Tới khi lên: người duyệt không duyệt hoàn từ khoản tiền mặt/thẻ ghi sau giờ hủy; ORC chạy câu đếm chỉ đọc (mục 5) khi INV cho SSH | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |`
