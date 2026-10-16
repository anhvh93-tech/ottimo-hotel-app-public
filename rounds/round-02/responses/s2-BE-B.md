# BE-B – phản hồi thẻ Round 2, Sprint 2 (bước Phản hồi & sửa)

- Vai: BE (luồng BE-B: folio, sales, payments, identity `listCloserCandidates`) | Ngày: 16/10/2026 | Không commit
- Đầu vào: `reviews/s2-DOM.md` (gồm mục E – quyết định DOM cho SEC BE-22/28), `reviews/s2-SEC.md`, `reviews/s2-ARC.md`, `outputs/ARC/s2-contract.md` mục 5, OpenAPI 0.3.5, BR v0.3.2, `br-examples.json` (dòng mới)
- Chi tiết code/test: `outputs/BE/s2-be-b-fix.md`

## 1. DOM (s2-DOM.md)

| ID | Trạng thái mới | Phản hồi |
|---|---|---|
| FB-R2-DOM-BE-01 (Blocker) | Done | `FolioService.voidStay` cài cổng `FOLIO_STAY_SYNC` mà BE-A định nghĩa ở `reservations/public/folio-sync-port.ts`, đăng ký trong FolioModule. Hàm này: (1) đảo dòng `room` của các đêm vừa void, dòng `extra_person` cùng ngày, và các dòng FOC/giảm đã áp lên chúng (bút toán đảo `reversal_of_id`, không sửa số – BR-008); (2) ghi **một** dòng `cancellation_fee`/`no_show_fee` bằng `retainedVnd` (doanh thu khác – BR-904); (3) phần hoàn để luồng `refund`, nên trước khi chi hoàn số dư hiện âm; (4) ghi audit tiền `folio.stay_reversed`. B12: đồng bộ lại sẽ đảo `no_show_fee` rồi ghi lại các đêm. BE-A gọi từ MoneyBridge. Test: hủy đơn đã xác nhận ra 14 dòng đảo + 1 dòng phí, tổng tiền phòng = 0, số dư = phí − đã thu, hoa hồng void |
| FB-R2-DOM-BE-02 | Done | `resyncStay` (cùng logic với `onReservationConfirmed`) đồng bộ đủ: đêm không còn bán và đêm đổi giá thì đảo dòng; đêm mới thì ghi dòng; phụ thu người đảo rồi ghi lại theo số người mới; hoa hồng void + ghi mới khi người chốt/cơ sở/% đổi; phí kênh OTA tính và phân bổ lại. Test: PATCH 3 → 2 người thì phụ thu về 0 và số dư giảm theo |
| FB-R2-DOM-BE-03 | Done (phần folio) | Phần tính lại bậc giảm trên giá lịch là của BE-A (`calendar_rate_vnd`, 0018); folio đi theo qua `resyncStay`. Test oracle **BR-107-04** (5 → 7 đêm: 4.079.000 → 5.205.000, đảo 5 dòng) và **BR-107-03** (7 → 5 đêm: về 4.079.000) đều xanh, chạy end to end |
| FB-R2-DOM-BE-04…10 | — | Thuộc BE-A (reservations / job / kit), BE-B không sửa |
| FB-R2-DOM-QA-01 / D-2 | Done (đã đúng) | Mốc hết hạn báo giá giữ 00:00 (ngày lập theo lịch + `quote_validity_days` + 1). Thêm test oracle **BR-304-02** (lập 01:30 15/10 → còn hiệu lực 23:59:59 18/10, hết từ 00:00 19/10) |
| D-11 (BR-903-02/03) | Done / Deferred | Mỗi đơn giữ hoa hồng đúng tới đồng (test oracle BR-903-02 = 156.150). Làm tròn ở kỳ chi (BR-903-03) thuộc phần chi hoa hồng US-089 – R3 |
| BR-904-02 | Ghi nhận | Đêm Nội bộ: dòng folio giá 0, cờ `is_complimentary` do BE-A ghi trên `stay_night`; phân bổ giảm giá của BE-B giữ nguyên cờ này khi giá gộp (gross) = 0 |

## 2. SEC (s2-SEC.md)

| ID | Trạng thái mới | Phản hồi |
|---|---|---|
| FB-R2-SEC-BE-21 | Done (vùng BE-B) | `shared/http/dry-run.ts` `rejectDryRun()`: body có `dryRun` thì trả 422 `dryRun: NOT_ALLOWED` trước khi ghi gì. Áp cho `confirmDeposit`, `createDepositNotice`, `requestFoc`, `saveQuote`, `createHoldFromQuote`, `withdrawQuote`, `extendQuote`, `createLead`, `changeLeadStage`. Test: không tạo dòng mới. Phần chung (cờ `supportsDryRun` trong guard/UoW) để BE-A/ARC làm |
| FB-R2-SEC-BE-22 | Done – theo quyết định DOM (BR-527 v0.3.2) | (1) Mọi khoản do người **không** có vai FD+ ghi (cả tiền mặt/POS) đều `reconciliation=pending`, audit ghi `recordedByRole`, và push `deposit_unverified` tới FD/FDL/MGR. Push này thay tạm cho mục "Cần chú ý" (bảng `attention_event` – Sprint 4). (2) Giờ nhận lùi tối đa theo tham số `staff_payment_backdate_max_hours` (24, catalogue thêm ở 0019) và không trước lúc tạo giữ chỗ; giữ chỗ quá hạn chỉ FD+ xác nhận được. (3) **Trần = số đơn còn phải thu** (tiền phòng + phụ thu người theo báo giá − đã thu); vượt trần → 422 `AMOUNT_TOO_HIGH` + `max`, chỉ FD+ ghi được và phải có lý do ở `note`. (4) Hoa hồng của chính người ghi chỉ "đạt" khi khoản cọc đã đối soát: R2 chưa có bước `earned`, hoa hồng nằm ở `projected`; job ghi nhận R3 (US-089) phải kiểm `payment.reconciliation`, đã ghi vào báo cáo. Không cấm sale thu tiền mặt, không đổi quyền |
| FB-R2-SEC-BE-26 | Done (vùng BE-B) | `listCloserCandidates` và kiểm người chốt ở báo giá/hoa hồng chỉ nhận user `active` có vai còn hiệu lực. Ghi audit khi đổi người chốt đơn là phần `updateReservation` của BE-A; phía folio, `resyncStay` void hoa hồng cũ và tạo hoa hồng mới (có audit tiền) khi người chốt đổi |
| FB-R2-SEC-BE-27 | Done | Ghi `channel_fee.recorded`/`updated` vào `recordMoney` (kênh, cơ sở, %, ước tính/thực tế, nguồn). `requestId` truyền xuống hoa hồng `projected`/`voided` và phí kênh |
| FB-R2-SEC-BE-28 | Done (phần BE-B) | `calculateQuote` `nights` ≤ 60 (zod). `createDepositNotice` chỉ giữ 1 thông báo mở mỗi đơn: báo lại thì cập nhật bản cũ, không push lại trong 10 phút. Giới hạn số giữ chỗ (`max_open_holds_per_user`) do BE-A làm ở `createHold` |
| FB-R2-SEC-BE-29 | Done (vùng BE-B) | Thêm test SAL khác `withdrawQuote`/`createHoldFromQuote` → 404; CTV khác không thấy hoa hồng (đã có) |
| FB-R2-SEC-BE-30 | Done bởi BE-A | FK `folio_line(property_id, stay_night_id)` có ở 0016 (BE-A); BE-B thêm FK cặp `deposit_notice.handled_payment_id` ở 0019 |

## 3. ARC (s2-ARC.md + s2-contract.md mục 5)

| ID | Trạng thái mới | Phản hồi |
|---|---|---|
| FB-R2-ARC-BE-S2-01 / A-13 | Done | Đã ghi tiền thì trả **200** + `Reservation` (`status=hold`, `depositPaidVnd` do BE-A đưa vào DTO). Chỉ trả `422 DEPOSIT_INSUFFICIENT` (`depositRequiredVnd/depositPaidVnd/shortfallVnd`) khi không ghi gì mới (`existingPaymentId` vẫn thiếu). Không còn commit-then-fail trong payments |
| FB-R2-ARC-BE-S2-06 (BE-B) | Done | A-14: `QuoteCalculation.roomId/roomNo/roomTotalVnd/extraPersonFeeVnd/extraGuestCount`. A-05: báo giá theo nhóm khi thiếu đêm tối thiểu thì ưu tiên căn có đêm lẻ (test chọn 202 chứ không lấy 101); `MIN_STAY_NOT_MET` có `minStayNights` + `suggestions[orphanNight]`. A-02: `CAPACITY_EXCEEDED` có `roomNo`/`max`; `QUOTE_EXPIRED`/`HOLD_EXPIRED` có `expiredAt`; `INVALID_TRANSITION` có `currentState`. A-18: `extendQuote`. A-06: `listCloserCandidates` |
| FB-R2-ARC-BE-S2-07 | Done (phần folio) | Folio không còn tự `UPDATE stay_night` mà gọi `StayNightAllocationService` ở `reservations/public/stay-night-allocation.ts` (hoa hồng, phí kênh, giảm giá). Tạm đăng ký trong FolioModule; BE-A có thể chuyển sang ReservationsModule mà không đổi hành vi |
| FB-R2-ARC-BE-S2-09 | Done | FK `deposit_notice.handled_payment_id` (0019), điền khi B4 xử lý thông báo; FK `folio_line → stay_night` theo cặp: BE-A 0016 |
| A-18 extendQuote | Done | MGR/OWN → 200: báo giá `active`, hạn mới như lúc lưu, giữ giá snapshot. SAL/CTV (của mình) → 202 + `quote_extension` (lý do bắt buộc; đã có yêu cầu mở thì trả lại yêu cầu đó). Hook `onDecided` thực hiện Q4 khi được duyệt. Báo giá chưa hết hạn → 409 + `currentState` |
| A-06 listCloserCandidates | Done | identity: `kind=agent/staff/all`; chỉ trả id, tên, loại; FD+ |
| Hạn báo giá (D-2) | Done | 00:00 ngày lập (theo lịch) + `quote_validity_days` + 1 – gia hạn tính lại cùng công thức |
