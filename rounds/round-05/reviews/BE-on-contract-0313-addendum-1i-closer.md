# BE – Review người dùng hợp đồng 0.3.13 bổ sung 1i, phần đổi người chốt (ARC, PR #152)

Round 5 · bước **Review** · BE (làn BE-H, người cài đặt `r5-h1c`) · 07/11/2026

- **Đối tượng:** PR #152 @ `ca276f8a`, phần đổi người chốt:
  - `openapi.yaml` `updateReservation`: gạch "Quyền theo mốc", thứ tự lỗi, đơn `checked_out`, audit, Desk/FE;
  - `ReservationPatch.closerChangeReason`;
  - `contract-0.3.13.md` 1.30, các dòng BE-H 1H-01/02, SEC 1H-01/03.
- **Đối chiếu với:** #154 @ `4e81c3be` (mã ở `279b5492`, `4e81c3be` chỉ gộp `main`):
  - `reservations.service.ts` `update()`, hằng `CLOSER_CHANGE_BEFORE_CHECKIN` / `CLOSER_CHANGE_AFTER_CHECKIN`;
  - `reservations.controller.ts` (`recordUseCaseDenial`), `audit/public/use-case-denial.ts`;
  - `folio.service.ts` `syncCommissionOnly()`, `tryEarnCommissions()`;
  - `reservations/audit-entities.ts`, `test/integration/v5-30-closer-change.test.ts` (18 ca).
- **Không chứa:** mật khẩu, bí mật, dữ liệu khách hay số hoa hồng.

## Kết luận: **DUYỆT** PR #152 @ `ca276f8a` (phần đổi người chốt)

Chữ 1h + 1i khớp mã #154 ở mọi luật dưới đây. Hai mã lý do `access.denied` khớp **đúng từng ký tự** với hằng trong mã. 0 Blocker · 0 Major · 1 Minor · 1 Suggestion, cả hai là chữ cho 0.3.14, không chặn gộp #152 hay #154.

| Chữ 1h/1i @ `ca276f8a` | #154 | Test |
|---|---|---|
| Ngoài `hold`, chưa nhận phòng: MGR+; FD/FDL → 403 + `access.denied` sau rollback, `auditReason` = `CLOSER_CHANGE_BEFORE_CHECKIN` | `export const CLOSER_CHANGE_BEFORE_CHECKIN = 'CLOSER_CHANGE_BEFORE_CHECKIN'`, ném ở nhánh MGR+ của `update()`, controller liệt kê trong `recordUseCaseDenial` | ca (a): FD, FDL → mỗi người +1 dòng |
| Sau nhận phòng: chỉ OWN; MGR/FDL/FD → 403 + `access.denied`, `CLOSER_CHANGE_AFTER_CHECKIN` | `export const CLOSER_CHANGE_AFTER_CHECKIN = 'CLOSER_CHANGE_AFTER_CHECKIN'`, cùng đường ghi. "Đã nhận phòng" = có `actual_checkin_at` hoặc `in_house`/`checked_out` | ca (b), đơn `rate_missing`, đơn đã trả phòng |
| Mỗi 403 ghi **đúng một** `access.denied`, không chứa lý do người gọi gõ | `recordDenied`: `entityType = 'operation'`, `entityId = 'updateReservation'`, `reason` = mã, `after = { operationId, roles }` | ca (a), (b) đọc lại `after` |
| Thứ tự 403 → 422 (`closerUserId`, `closerChangeReason`) → 409 hoa hồng | Kiểm quyền trước `f.done()` lần hai (lỗi `NOT_IN_LIST`, kênh, lý do) và trước `syncCommissionOnly` (409 `payable`/`paid`). Xem thẻ 1I-02 về các kiểm đứng **trước** 403 | ca (b): MGR gửi lý do ngắn → 403 |
| Đơn `checked_out`: chỉ nhận `closerUserId` (+ `closerChangeReason`); trường khác → 409 `currentState = checked_out` | `closerOnly` + `closerChange` trong `editable` | ca X: `adults`, `closerUserId` + `adults`, `closerUserId` + `internalNote` → 409, không ghi gì |
| Người mới theo luật đạt của B18; `recognized_at` = lúc sửa | `tryEarnCommissions` (cả DOM 1H-04) khi đơn `checked_out`, ghi `clock.now()` | ca X, DOM 1H-04 (K1, K2) |
| Lý do ở **cột `reason`** của audit `reservation.closer_changed`; `after` = `closerUserId`; allowlist chỉ thêm `closerUserId` | `recordMoney({ …, after: { closerUserId }, reason })`; `reservations/audit-entities.ts` không có `reason` | ca (a), (b), T-30-3; ca allowlist |
| `closerChangeReason` 3–500, V-08, V-09; thiếu/ngắn → `REASON_REQUIRED` | `Fields.text(…, 500, { required, min: 3 })`: ngắn → `REASON_REQUIRED`, dài → `TOO_LONG`, số thẻ → `CARD_NUMBER_DETECTED` | ca (b) |
| Ghi chú FE: gửi lý do mà không đổi người chốt → 422 `NOT_ALLOWED` | Đúng ở `hold`/`confirmed`/`in_house`. Trên đơn `checked_out` là 409 – thẻ 1I-01 | ca "NOT_ALLOWED", ca X |
| 409 `payable`/`paid`, không ghi gì | Đầu `syncCommissionOnly`, cả giao dịch rollback | ca `payable` |

## Thẻ

### FB-R5-BE-ARC-1I-01
- Mức độ: **Minor**. Không chặn gộp. Sửa chữ ở 0.3.14; mã giữ nguyên.
- Người nhận: ARC (chữ), FE-A, QA
- Vị trí: `openapi.yaml` `updateReservation`, gạch Desk (FE-A): "chỉ gửi khi `closerUserId` đổi – gửi mà không đổi người chốt → 422 `NOT_ALLOWED`"; `ReservationPatch.closerChangeReason`: "Gửi mà không đổi `closerUserId` → 422 `NOT_ALLOWED`".
- Vấn đề:
  - Câu này đúng ở `hold`, `confirmed`, `in_house`.
  - Trên đơn `checked_out`, thân không đổi người chốt (chỉ có `closerChangeReason`, hoặc gửi lại đúng người chốt đang lưu kèm lý do) bị chặn ở gạch "Đơn `checked_out`" trước, nên ra **409** `INVALID_TRANSITION` (`currentState` = `checked_out`), không ra 422.
  - QA hay FE viết ca theo chữ của trường sẽ chờ 422 và đỏ. Ca X của #154 đã ghim 409 cho `{ closerUserId: <người đang lưu>, closerChangeReason }`.
- Đề xuất sửa: thêm vào hai câu trên "(trên đơn `checked_out`: 409, xem gạch đơn `checked_out`)".
- Trạng thái: Open

### FB-R5-BE-ARC-1I-02
- Mức độ: Suggestion. Gộp cùng SEC FB-R5-SEC-ARC-1I-01 ở 0.3.14.
- Người nhận: ARC (chữ), QA
- Vị trí: `updateReservation`, câu "Thứ tự lỗi (bổ sung 1i, SEC 1H-03): 403 → 422 → 409".
- Vấn đề: ngoài lỗi dạng thân lệnh mà SEC 1I-01 đã nêu, còn hai nhóm kiểm đứng **trước** 403 trong `update()`:
  1. If-Match: 428/412;
  2. 409 trạng thái đơn (`editable`): đơn `cancelled`/`no_show`/…, đơn `checked_out` có trường khác.
  - Hôm nay ba nhánh cờ (`roomReturnRecorded`, `roomDisclosedToGuest`, `doorAccessHandedOver`) cũng chạy trước 403: đó là thẻ SEC FB-R5-SEC-BE-154-03. BE-H chuyển khối kiểm quyền người chốt lên ngay sau `editable` ở PR tiếp theo `r5-h1d`. Sau PR đó, chỉ còn hai nhóm trên đứng trước 403.
  - Không lộ gì: các lỗi đó không cần dữ liệu hoa hồng, và trạng thái đơn thì FD vốn đọc được.
- Đề xuất sửa: "If-Match (428/412) → lỗi dạng của thân → 409 trạng thái đơn → 403 → 422 cần đơn (`closerUserId` `NOT_IN_LIST`/kênh, `closerChangeReason`) → 409 hoa hồng `payable`/`paid`".
- Trạng thái: Open

## Dòng decision-log (ORC chép)

| 2026-11-07 | 5 | **BE-H – review người dùng hợp đồng 0.3.13 bổ sung 1i, phần đổi người chốt (#152 @ ca276f8a): DUYỆT.** Chữ 1h + 1i khớp #154 @ 4e81c3be; CLOSER_CHANGE_BEFORE_CHECKIN và CLOSER_CHANGE_AFTER_CHECKIN khớp đúng hằng trong mã; lý do ở cột reason, after = closerUserId, allowlist không có reason; checked_out chỉ nhận người chốt + lý do. 1I-01 Minor (trên đơn checked_out, lý do không kèm đổi người chốt → 409, không phải 422 NOT_ALLOWED – sửa chữ 0.3.14), 1I-02 Suggestion (thứ tự đầy đủ: If-Match → lỗi dạng → 409 trạng thái đơn → 403 → 422 cần đơn → 409 hoa hồng; gộp với SEC 1I-01). Không ESC. | BE-H | rounds/round-05/reviews/BE-on-contract-0313-addendum-1i-closer.md |
