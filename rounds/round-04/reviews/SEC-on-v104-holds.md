# SEC review P4-10 `v104/be-holds`: SEC-BE-22 và G4 (`existingPaymentId` trên giữ chỗ quá hạn)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/be-holds` @ `8adeb7ad` (BE-B). Báo cáo `rounds/round-04/outputs/BE/v104-be-holds.md`, giả định G1–G4.
- Đã đọc mã trên nhánh:
  - `payments/internal/deposits.service.ts` (`confirm`, `overdueHoldAccepts`);
  - `reservations/internal/allowed-actions.ts`;
  - `payments/internal/payments.service.ts` (`record`, đường `recordPayment` chung);
  - tên ca của `test/integration/v104-holds.test.ts`.
- Căn cứ: thẻ gốc `rounds/round-02/reviews/s2-SEC.md` **FB-R2-SEC-BE-22** (4 điểm); `plan-v1.0.4.md` P4-10; BR-303 (1)(2), US-085 AC4, DOM A.6.
- Phạm vi: chỉ hai câu ORC hỏi (SEC-BE-22, G4) và những gì ảnh hưởng trực tiếp. Người nhận J1, "Cần chú ý", WA-04 và migration 0093 chỉ xem nhanh về dữ liệu cá nhân (mục 4).
- Không sửa tệp nào khác. Không commit. Không có dữ liệu thật.

---

## 0. Quyết định (để ARC chốt P4-00 (a) và mô tả `confirmDeposit`)

| Câu hỏi | Quyết định SEC |
|---|---|
| **SEC-BE-22** trên `confirmDeposit` sau hạn | **Giữ đủ.** Điểm (1), (2), (3) vẫn còn trên đường `confirmDeposit`. Điểm (4) không bị chạm. **Nhưng** đường `recordPayment` chung chưa có kiểm hạn: người không có vai FD+ vẫn ghi được cọc lên giữ chỗ đã quá hạn mà J1 chưa hủy. Đây là lỗ hổng có từ trước, nhưng G4 dựa vào nó, nên phải bịt trong P4-10 (thẻ HOLDS-01) |
| **G4**: `existingPaymentId` trên giữ chỗ quá hạn được nhận, bất kể tiền về lúc nào | **CHẤP NHẬN CÓ ĐIỀU KIỆN.** Vai: chỉ FD+ (đã có). Audit: thêm 5 trường (thẻ HOLDS-02). **Không** đặt trần thời gian (lý do ở mục 2.3). Điều kiện bắt buộc: thẻ HOLDS-01 cùng PR-F |
| MGR/OWN chấp nhận cọc thiếu sau hạn (FE-B dựa vào đây) | **Chấp nhận**, cùng điều kiện với G4. Vai MGR/OWN đã được kiểm (D12c, 403 trước khi đọc gì) |

ESC mới: **không**. Đây là kiểm soát kỹ thuật trên đường tiền, thuộc quyền SEC. Chính sách giữ chỗ tới khi nhận phòng (BR-303 (1), DOM A.6) đã có PO/DOM chốt.

---

## 1. SEC-BE-22: kiểm lại từng điểm

| Điểm của thẻ gốc | v1.0.4 | Kết quả |
|---|---|---|
| (1) Khoản do SAL ghi luôn `reconciliation = 'pending'`, kèm mục "Cần chú ý" `deposit_unverified` | Không đổi (`recordManual(... reconciliation: 'pending')`, `pushUnverified`) | Giữ |
| (2) SAL lùi `receivedAt` tối đa `staff_payment_backdate_max_hours`, không trước lúc tạo giữ chỗ. **Quá hạn thì chỉ FD+ được xác nhận** | Trên `confirmDeposit`: `overdueHoldAccepts` trả `false` khi `!desk`. `allowedActions` sau hạn chỉ mời FD+ và chỉ khi `depositPaidVnd > 0`. Có test SAL → 409 trên giữ chỗ có cọc của chính mình | Giữ trên `confirmDeposit`. **Hở** trên `recordPayment` (mục 1.1) |
| (3) Một khoản ≤ phần còn nợ, vượt thì FD+ phải ghi lý do | Không đổi | Giữ |
| (4) Hoa hồng chỉ thành `earned` khi cọc đã đối soát | Không chạm | Giữ (theo dõi ở `s3-checklist` mục F như cũ) |

### 1.1 Lỗ hổng: `recordPayment` trên giữ chỗ quá hạn
- `PaymentsService.record` (A33 "own_deposit_only") cho người không có vai FD+ ghi `type = 'deposit'` lên folio của giữ chỗ. Hàm khóa đơn (`scopedReservation(..., { lock: true })`), nhưng **không** xét `hold_expires_at`.
- Thời điểm nguy hiểm là sau hạn mà J1 chưa hủy: bình thường ≤ 1 phút, nhưng **kéo dài nhiều giờ nếu worker dừng hay chậm**. Trong khoảng đó, SAL ghi được một khoản "đã nhận tiền mặt" (kể cả số nhỏ, `receivedAt` lùi trong giới hạn). Khoản đó `pending`, nhưng vẫn được tính vào `depositPaid`.
- Hệ quả:
  - J1 thấy `kept_paid` và **giữ** đơn, căn phòng bị khóa bán tới ngày đến;
  - từ v1.0.4, FD bấm xác nhận được ngay (G4), hoặc MGR chấp nhận cọc thiếu trên số tiền chưa có thật.
- Đây đúng là kịch bản SEC-BE-22 muốn chặn: "SAL cứu một giữ chỗ đã quá hạn mà job chưa kịp hủy".
- v1.0.3 cũng hở như vậy (SAL lùi `receivedAt` về trước hạn là v1.0.3 nhận). Vì thế G4 **không** làm rủi ro này nặng thêm đáng kể. Nhưng G4 chỉ an toàn khi khoản tiền nằm trên folio của một giữ chỗ quá hạn **chắc chắn** do FD+ ghi, do ngân hàng đẩy về (VietQR), hoặc được ghi **trước** hạn.

---

## 2. G4: đánh giá

### 2.1 G4 thực sự nới gì
- Đường `existingPaymentId` chỉ nhận một khoản cọc `succeeded`, chưa đảo, nằm trên **chính folio này**. Khoản đó đã nằm trong `depositPaid`, nên `paidBefore > 0` luôn đúng.
- Vậy trên đường này, luật sau hạn chỉ còn "có phải FD+ không". Luật AC4 về `receivedAt` không còn tác dụng. Hợp đồng phải nói rõ điều này (mục 3).
- Trên đường ghi khoản mới (`payment`), v1.0.3 cũng đã tin `receivedAt` do FD+ tự khai (FD+ lùi ngày không giới hạn, chỉ không trước lúc tạo giữ chỗ). Bỏ phép so `receivedAt` cho giữ chỗ đã có tiền **không** làm FD+ có thêm quyền gì thật. Nó chỉ bỏ một kiểm mà FD+ vốn tự vượt được.

### 2.2 Vì sao chấp nhận
- Giữ chỗ quá hạn **còn tồn tại** chỉ trong hai trường hợp:
  - (a) J1 giữ vì đã có tiền;
  - (b) J1 chưa chạy tới.
- Cả hai trường hợp, căn phòng **vẫn đang bị khóa**. Xác nhận lúc này không tạo bán trùng và không lấy lại phòng của ai.
- Rủi ro còn lại là tiền không có thật. Rủi ro này đã có 3 lớp: khoản do SAL ghi luôn `pending` + `deposit_unverified`, hoa hồng chỉ `earned` sau đối soát, và người xác nhận phải là FD+ (MGR/OWN nếu thiếu cọc). Sau khi bịt mục 1.1, SAL không còn tự tạo được điều kiện "đã có tiền" sau hạn.

### 2.3 Vì sao không đặt trần thời gian
- Trần (ví dụ "chỉ trong N giờ sau hạn") **không** trả phòng về để bán. Phòng vẫn bị J1 giữ vì đã có tiền. Trần chỉ chặn quầy ghi tiền thật của khách đã trả, rồi đẩy quầy sang cách vòng (hủy và tạo lại đơn), và dấu vết khi đó kém hơn.
- Người được báo đúng lúc đã có sẵn: `hold_overdue_cap` tới MGR/OWN lúc 12:00 ngày đến, và mục "Cần chú ý" `hold_overdue` cho FD+.
- G2 (xác nhận được cả sau ngày đến, rồi đi luồng no-show): chấp nhận, cùng lý do.

### 2.4 Điều kiện (để G4 được tính là chấp nhận)
1. **Vai:** giữ đúng như mã hiện tại:
   - sau hạn, `confirmDeposit` chỉ FD+;
   - chấp nhận cọc thiếu chỉ MGR/OWN;
   - CTV không bao giờ.
   - Thêm cấm SAL/CTV ghi cọc qua `recordPayment` sau hạn (thẻ HOLDS-01).
2. **Audit** (thẻ HOLDS-02): lần xác nhận sau hạn phải có dấu vết để đối chiếu sau, không cần đọc nhiều bảng.
3. **Hợp đồng** (ARC, P4-00): mô tả như mục 3.

---

## 3. Chữ đề xuất cho ARC (P4-00, 0.3.12)

**`confirmDeposit`, phần "giữ chỗ quá hạn":**
> Sau `holdExpiresAt`: SAL/CTV luôn nhận 409 `HOLD_EXPIRED`. FD+ xác nhận được khi folio **đã nhận > 0 đ trước lần ghi này**. Tính cả khoản `pending` chờ đối soát. Khi dùng `existingPaymentId` thì điều kiện này luôn đúng, nên giờ nhận tiền không được xét. Được tới khi nhận phòng, không có trần giờ. Folio chưa nhận gì thì chỉ xác nhận được bằng khoản mới có `receivedAt` < `holdExpiresAt` (US-085 AC4). `acceptShortfallReason` sau hạn: chỉ MGR/OWN, như trước hạn. Lần xác nhận sau hạn ghi audit `reservation.deposit_confirmed` có `afterDeadline: true`.

**`recordPayment`, thêm:**
> Folio của giữ chỗ đã quá `holdExpiresAt`: người gọi không có vai FD+ nhận 409 `HOLD_EXPIRED`, không ghi gì. FD+ ghi được như cũ.

Đồng ý với đề xuất 1, 2, 4, 5 của BE-B (mục 6 báo cáo): kind mới, `AttentionItem`, `allowedActions`, và không đổi `capacity_conflict`/`overbooking`. Không có trường mới trong thân yêu cầu hay câu đáp. Thẻ HOLDS-02 chỉ thêm trường trong audit, không đụng hợp đồng.

---

## 4. Xem nhanh dữ liệu cá nhân (J1, "Cần chú ý", WA-04)

- Thông báo J1 và mục "Cần chú ý" chỉ mang kind, mã đơn, id và `count`. Không có tên, số điện thoại hay số tiền của khách. **Đạt.**
- Người nhận theo DOM A.5. Không có HK, MT hay kế toán. Lượt dự phòng FD/FDL chỉ chạy khi lượt đầu không ra ai. **Đạt.**
- WA-04: yêu cầu FOC tự hủy với lý do `reservation_cancelled`. Thông báo tới người tạo không chứa nội dung yêu cầu. **Đạt.**
- Migration 0093 chỉ nới CHECK. Không cột dữ liệu cá nhân mới. **Đạt.**

---

## 5. Thẻ feedback

### Major
Không có.

### Minor

#### FB-R4-SEC-BE-HOLDS-01: chặn SAL/CTV ghi cọc lên giữ chỗ đã quá hạn
- Mức độ: Minor (**điều kiện để chấp nhận G4. Làm trong P4-10, cùng PR-F**)
- Người làm: **BE-B**; ARC ghi hợp đồng (mục 3)
- Vị trí: `payments/internal/payments.service.ts` `record()`, sau `scopedReservation(..., { lock: true })`.
- Vấn đề: mục 1.1. Không có kiểm `hold_expires_at` cho người không có vai FD+. Khoản ghi trong khoảng trễ của J1 (dài ra khi worker dừng) làm J1 giữ đơn. Từ v1.0.4, đơn đó xác nhận được ngay (G4).
- Vì sao quan trọng: SEC-BE-22 (2) gian lận nội bộ. Căn bị khóa bán bằng tiền chưa có thật, đúng mùa cao điểm.
- Đề xuất sửa:
  - `r.status === 'hold'`, `holdExpiresAt ≤ now` (đồng hồ tiêm) và người gọi không có vai FD+ → 409 `HOLD_EXPIRED` (`extras.expiredAt`), không ghi gì;
  - FD+ và khoản do ngân hàng đẩy về (VietQR, không đi qua hàm này) giữ như cũ.
  - Test:
    - SAL `recordPayment` deposit 1 phút sau hạn, J1 chưa chạy → 409, không có dòng `payment`; J1 chạy sau đó → đơn hủy;
    - FD cùng thao tác → 201;
    - SAL trước hạn → 201 `pending` như cũ.
- Trạng thái: Open

#### FB-R4-SEC-BE-HOLDS-02: audit của lần xác nhận sau hạn
- Mức độ: Minor
- Người làm: **BE-B**
- Vị trí: `deposits.service.ts`, `audit.recordMoney({ action: 'reservation.deposit_confirmed', … })`.
- Vấn đề: dòng audit hiện chỉ có `depositPaidVnd`, `depositRequiredVnd`, `status`. Không biết lần xác nhận đó là **sau hạn**, dựa vào khoản nào, và trong số tiền được tính có bao nhiêu chưa đối soát.
- Vì sao quan trọng: G4 bỏ một kiểm tự động. Kiểm soát thay thế là xem lại sau. Không có trường thì kiểm toán phải ghép nhiều bảng.
- Đề xuất sửa: khi `holdExpiresAt ≤ now` thì `after` có thêm:
  - `afterDeadline: true`;
  - `holdExpiredAt` (ISO);
  - `paidBeforeVnd`;
  - `unverifiedPaidVnd` (tổng các khoản cọc được tính có `reconciliation = 'pending'`);
  - `via: 'existing_payment' | 'new_payment'`.
  - Không thêm số tài khoản, tên hay ghi chú tự do. Trước hạn thì không thêm trường nào, để giữ nguyên dòng audit cũ.
  - Test: ca 042 của bug-list và ca MGR chấp nhận cọc thiếu sau hạn đều đọc được 5 trường. Ca trước hạn không có các trường này.
- Trạng thái: Open

### Info

#### FB-R4-SEC-FE-HOLDS-03: hộp thoại chấp nhận cọc thiếu sau hạn
- Người làm: FE-B (v1.0.5, không chặn)
- Khi MGR/OWN chấp nhận cọc thiếu trên giữ chỗ quá hạn, Desk nên nói rõ trong số tiền đã nhận có bao nhiêu chưa đối soát. Việc này cần một trường đọc, ví dụ `depositUnverifiedVnd`, nên để hợp đồng v1.0.5. Ở v1.0.4, mục "Cần chú ý" `deposit_unverified` là lớp báo thay.

---

## 6. Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-11-04 | 4 | **SEC – P4-10 be-holds: SEC-BE-22 + G4** (rounds/round-04/reviews/SEC-on-v104-holds.md): SEC-BE-22 giữ đủ trên confirmDeposit (SAL pending, quá hạn chỉ FD+, trần số tiền). G4 (existingPaymentId trên hold quá hạn nhận bất kể giờ tiền về) CHẤP NHẬN CÓ ĐK: vai FD+ (thiếu cọc MGR/OWN), không trần thời gian (phòng vẫn bị J1 giữ, trần chỉ chặn ghi tiền thật), audit deposit_confirmed thêm afterDeadline/holdExpiredAt/paidBeforeVnd/unverifiedPaidVnd/via (HOLDS-02), và bắt buộc HOLDS-01: recordPayment của người không có vai FD+ trên hold quá hạn → 409 HOLD_EXPIRED (lỗ hổng có từ v1.0.3, G4 dựa vào nó). ARC ghi mô tả confirmDeposit/recordPayment ở 0.3.12 theo mục 3 | SEC | Quyền SEC (kiểm soát kỹ thuật đường tiền); BR-303, DOM A.6 |`

---

## 7. Giả định

1. `FolioService.depositPaid` cộng các khoản cọc `succeeded`, chưa đảo, kể cả khoản `pending` (G1 của BE-B). Nếu tính thêm khoản đã đảo thì `paidBefore > 0` có thể đúng sai chỗ. Khi đó QA thêm ca "khoản duy nhất đã bị đảo → `HOLD_EXPIRED`".
2. VietQR/ngân hàng đẩy tiền vào folio bằng đường riêng, không qua `PaymentsService.record` với vai người dùng. Tiền đó là tiền thật nên không bị thẻ HOLDS-01 chặn. Nếu thực tế đi chung đường thì BE-B phân biệt bằng `actor` (máy) hay phương thức.
3. Không tự chạy test. Kết luận dựa trên đọc mã, tên ca test và báo cáo BE-B (bộ API 3800 ca xanh trên máy làn BE-B).
