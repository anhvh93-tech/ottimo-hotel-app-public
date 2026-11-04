# BE-B review hợp đồng OpenAPI 0.3.12-draft – phần BE-B (P4-10 giữ chỗ)

- Người review: BE (làn BE-B) | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/arc-contract` @ `3320fb33`:
  - `product/docs/api/openapi.yaml`;
  - báo cáo `rounds/round-04/outputs/ARC/v1.0.4-contract-0.3.12.md` mục 1 (a), 2.2–2.4, 2.6, 2.7, 3 (dòng BE-B).
- So với mã: `origin/v104/be-holds` @ `e253a6c2`. Commit này gồm P4-10 và SEC-fix HOLDS-01/02.
- Phạm vi: chỉ phần BE-B. Các ý (b)–(i) không xem.

## 0. Kết luận

**ĐỒNG Ý** phần (a), có 2 thẻ Minor và 2 thẻ Info. Cả 4 thẻ không chặn việc gộp P4-00:
- MINOR-01 cần ARC sửa một câu trong `openapi.yaml`;
- MINOR-02 cần ARC/SEC chọn một trong hai phương án;
- 2 thẻ Info không bắt buộc sửa.

Các điểm khớp từng chữ với mã:

| Chỗ trong hợp đồng | Mã BE-B | Khớp |
|---|---|---|
| `StaffNotification.kind`: thêm `hold_overdue_with_deposit`, `hold_overdue_cap`. Người nhận theo DOM A.5. Dự phòng FD/FDL cho `hold_expired`. Không HK/MT/kế toán. Tài khoản đang hoạt động, mỗi người một dòng | `hold-notices.ts` (`HOLD_NOTICE_ROLES`, `HOLD_NOTICE_FALLBACK_ROLES`). CHECK 0093 | Có |
| Chống trùng: (đơn, `holdExpiresAt`) / một lần mỗi đơn. Cổng là `dedupe_key` outbox `staff.push` trong cùng giao dịch | `notifyHoldOnce`. Khóa `hold_overdue_partial:<id>:<expiresAt>`, `hold_overdue_cap:<id>`, `hold_expired:<id>` | Có |
| `AttentionItem` `hold_overdue` / `hold_overdue_cap`: `computed`, `critical`, có cả `count` lẫn `params.count`, `reservationIds`, `refCode` chỉ khi 1 đơn, không `link` | `attention-sources.ts` `holdsOverdue` | Có |
| `dueAt`: với `hold_overdue` là hạn cũ nhất, với `hold_overdue_cap` là mốc 12:00 sớm nhất | Như hợp đồng | Có |
| Đối tượng thấy: FD+ / OWN·MGR | `attentionAudience` | Có |
| `confirmDeposit` sau hạn theo chữ SEC: FD+ xác nhận khi đã nhận > 0 đ trước lần ghi này, gồm cả khoản `pending`; `existingPaymentId` không xét giờ; tới khi nhận phòng; folio chưa có tiền thì xét `receivedAt` < hạn; thiếu cọc thì chỉ MGR/OWN | `overdueHoldAccepts`. `paidBefore` đọc trước khi ghi. D12c giữ nguyên | Có |
| Audit `reservation.deposit_confirmed` có `afterDeadline: true` | HOLDS-02: có `afterDeadline` và thêm 4 trường (xem INFO-02) | Có (mã ghi nhiều hơn) |
| `recordPayment`: người gọi không có vai FD+ ghi vào hold quá hạn → `409 HOLD_EXPIRED` + `expiredAt`, không ghi gì | `assertHoldOpenForSales` trong `record()`, đặt sau khi khóa đơn và trước mọi lần ghi | Có |
| `Reservation.allowedActions`: sau hạn, `confirm-deposit` chỉ có khi FD+ và `depositPaidVnd > 0` | `allowed-actions.ts` | Có |
| Bảng `Problem.code` `HOLD_EXPIRED`. Ví dụ `holdExpiredSales` | `extras.expiredAt` theo giờ khách sạn (`toZonedIso`) | Có |

Hai kết luận ARC về OPS, BE-B **đồng ý**:
- **Q4:** không có job hay topic mới.
- **Q1:** khi v1.0.3 gặp kind lạ, PWA hiện câu chung, không hiện mã thô. BE-B nhận sửa: mục 6a biên bản `v104-be-holds.md` ghi "có thể hiện mã thô" là sai. BE-B sửa câu đó ở lần rebase lên `main@L`. Câu SQL R3b giữ nguyên.

---

## 1. Thẻ

### FB-R4-BEB-ARC-0312-01 – Minor: `hold_overdue_cap` "Cần chú ý" – hợp đồng thêm điều kiện "có cọc" mà mã không có
- Người làm: **ARC** (sửa một câu), hoặc BE-B nếu ARC chọn phương án (B).
- Vị trí: `openapi.yaml`, mô tả `AttentionItem.kind` (khoảng dòng 10744). Câu đang viết: "`hold_overdue_cap` – **chỉ OWN/MGR**: đơn `hold` có `depositPaidVnd > 0` mà giờ server ≥ ngày đến + `hold_latest_time_on_arrival`".
- Vấn đề:
  - Mã tính `hold_overdue_cap` là **tập con của `hold_overdue`**: mọi đơn `hold` đã quá hạn và đã tới mốc 12:00 ngày đến, **không** lọc theo cọc.
  - Lúc bình thường hai cách cho cùng kết quả, vì J1 hủy hold chưa cọc trong vòng một phút sau hạn.
  - Chỉ khác khi **worker dừng hoặc chậm**. Khi đó một hold chưa cọc quá 12:00 ngày đến vẫn còn khóa phòng. Theo mã, MGR/OWN thấy nó. Theo chữ hợp đồng, họ không thấy.
  - Thông báo hộp thư `hold_overdue_cap` (J1) chỉ gửi cho hold có cọc, và mô tả kind đã nói đúng điều đó. Thẻ này chỉ nói về mục "Cần chú ý".
- Đề xuất: **(A)**, đổi chữ hợp đồng theo mã: "`hold_overdue_cap` – chỉ OWN/MGR: các đơn của `hold_overdue` mà giờ server ≥ ngày đến + `hold_latest_time_on_arrival` (thường là đơn đã có cọc, vì J1 hủy đơn chưa cọc ngay sau hạn)".
  - Lý do: cap luôn là tập con của `hold_overdue`, nên FE-B đếm nhất quán.
  - MGR/OWN thấy được cả trường hợp worker dừng, đúng lúc họ cần biết nhất.
  - Phương án (B): BE-B thêm điều kiện `depositPaid > 0` vào câu SQL. Làm được trong khoảng 30 phút kèm test, nếu ARC/DOM muốn đúng chữ hiện tại.
- Trạng thái: Open.

### FB-R4-BEB-ARC-0312-02 – Minor: `confirmPaymentReceived` cũng trả `HOLD_EXPIRED` cho SAL trên hold quá hạn (G6) – hợp đồng chưa ghi
- Người làm: **ARC** (thêm 1 câu mô tả), cần **SEC** xác nhận.
- Vị trí: `openapi.yaml` `confirmPaymentReceived` (khoảng dòng 5829). Mô tả hiện chỉ nói về `INVALID_TRANSITION`.
- Vấn đề:
  - SEC-fix (`e253a6c2`) dùng **cùng một chốt** HOLDS-01 cho `confirmReceived`: SAL xác nhận "tiền QR cọc đã về" trên QR của mình, folio thuộc hold đã quá hạn mà J1 chưa hủy → `409 HOLD_EXPIRED` + `expiredAt`, QR vẫn `pending`. FD+ không đổi.
  - Lý do: đây là đường thứ hai để SAL đặt tiền lên hold quá hạn, đúng kịch bản SEC-BE-22 mà SEC mô tả ở mục 1.1 bài review, chỉ khác là đi qua QR.
  - SEC chỉ nêu `recordPayment`, nên biên bản BE-B ghi việc này là giả định G6.
- Đề xuất:
  - Thêm vào mô tả `confirmPaymentReceived`: "**0.3.12 (HOLDS-01)**: QR của folio thuộc giữ chỗ đã quá `holdExpiresAt`, người gọi không có vai FD+ (SAL) → `409 HOLD_EXPIRED` (+ `expiredAt`), không đổi gì; FD+ như cũ."
  - Phản hồi 409 đã là `Conflict` chung, mà bảng `Problem.code` đã có `HOLD_EXPIRED`, nên chỉ cần thêm câu mô tả. Trong dòng `HOLD_EXPIRED` của bảng thì thêm `confirmPaymentReceived` cạnh `recordPayment`.
  - Nếu SEC/ARC **không** muốn: BE-B bỏ một dòng gọi `assertHoldOpenForSales` trong `confirmReceived` và bỏ 1 assert trong test tích hợp.
- Trạng thái: Open.

### FB-R4-BEB-ARC-0312-03 – Info: `confirmDeposit` – câu "SAL/CTV luôn nhận 409" lệch thực tế với CTV
- Vị trí: mô tả `confirmDeposit` (dòng 2651). Câu đang viết: "Sau `holdExpiresAt`: **SAL/CTV** luôn nhận `409 HOLD_EXPIRED` (+ `expiredAt`) – CTV vốn không có quyền gọi".
- Thực tế: CTV không có trong `x-roles` của `confirmDeposit` và `recordPayment`, nên nhận **`403 FORBIDDEN_ACTION`** trước mọi kiểm khác. Test tích hợp `v104-holds.test.ts` (ca HOLDS-01) đã ghi lại điều này.
- Đề xuất: viết lại thành "Sau `holdExpiresAt`: **SAL** luôn nhận `409 HOLD_EXPIRED` (+ `expiredAt`), không ghi gì. CTV không có quyền gọi (`403`)." Nếu ARC giữ câu cũ thì vẫn không sai về an toàn.

### FB-R4-BEB-ARC-0312-04 – Info: audit HOLDS-02 ghi 5 trường, hợp đồng chỉ nêu `afterDeadline`
- Mã ghi `afterDeadline`, `holdExpiredAt`, `paidBeforeVnd`, `unverifiedPaidVnd` và `via: new_payment | existing_payment`. Đúng như thẻ SEC HOLDS-02. Không có số tài khoản, tên hay ghi chú. Xác nhận trước hạn thì dòng audit giữ nguyên.
- SEC nói HOLDS-02 "không đụng hợp đồng", nên **không bắt buộc** sửa.
- Nếu ARC muốn Desk hoặc màn nhật ký tiền đọc các trường này, có thể liệt kê 4 trường còn lại trong câu "audit `afterDeadline: true`". Nếu không thì giữ nguyên.

---

## 2. Việc BE-B làm sau khi P4-00 gộp
- Rebase `v104/be-holds` lên `main@L` (có cả P4-00), rồi đánh số lại journal theo biên bản mục 4.
- Dùng kiểu sinh từ 0.3.12: `AttentionKind` và `StaffNotificationKind` phía server phải khớp `openapi-meta`. Chạy typecheck, `module-boundaries` và `money-limit-basis-architecture`.
- Sửa mục 6a của biên bản: chữ "mã thô" thành "câu chung", theo ARC 2.6.
- Theo kết quả MINOR-01 và MINOR-02: sửa SQL `holdsOverdue` (nếu chọn B) hoặc bỏ chốt trong `confirmReceived` (nếu SEC/ARC không muốn).

## 3. Giả định
- Đối chiếu `openapi.yaml` @ `3320fb33` bằng cách đọc chữ. BE-B không chạy generator hay test trên nhánh `v104/arc-contract`, vì ARC đã chạy (mục 0 báo cáo ARC).
- Chống trùng phía client: hợp đồng ghi "client không lọc thêm". Server bảo đảm điều này bằng ràng buộc unique trên `outbox_message.dedupe_key`.
