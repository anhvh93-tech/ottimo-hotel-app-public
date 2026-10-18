# Phản hồi BA – Round 2, Sprint 4 ổn định (bước Phản hồi & sửa, sau gộp #19 `f6803d0`)

- Người làm: BA | Ngày: 18/10/2026 | Không commit
- Đầu vào: `outputs/ARC/openapi-0.3.7.md` 16.27–16.30 (thẻ FB-R2-ARC-BA-S4-01 ở 16.30.7), `outputs/BE/s4-be-b.md` mục 25, `reviews/s4-SEC.md` C.12, `product/docs/business-rules.md` BR-525, decision-log 18/10 (ORC gộp #19, dời BE-S4-17/18 sang R3).
- Đối chiếu mã đã gộp: `services/api/src/modules/folio/internal/foc.service.ts` (`request`, `onDecided`), `services/api/src/modules/approvals/public/approval.service.ts` (`approve`, `setAppliedCap`, `cancelApproved`, `monthlyApprovedBy`).

## Thẻ feedback

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-ARC-BA-S4-01 | Done | `state-machines.md` v0.2.7: SM-10 thêm cạnh **A7** SYS `pending`/`escalated` → `cancelled` (`debt_cleared`) – lệnh duyệt 200, không ghi FOC, dòng chờ → `rejected`, người gửi và người được hỏi duyệt nhận `approval_cancelled`, không tính hạn mức. Mục **10.1** mới: điều kiện gửi, trần lúc gửi (công nợ đang mở − Σ yêu cầu `debt_write_off` đang chờ, 422 `AMOUNT_EXCEEDS_BALANCE` + `max`), áp một phần lúc duyệt (`approved`, `amountVnd` giữ số xin, `effectiveAmountVnd` cố định `applied_cap_vnd`, nhật ký `approval.applied_capped`), bất biến không dư thừa. Phần (b) của thẻ (hủy ngay khi công nợ đóng) ghi là **R3** theo quyết định ORC dời FB-R2-ARC-BE-S4-17; ghi kèm lệch đã biết BE-S4-18. Chọn cạnh riêng A7 (không mở rộng A6) – lý do ở SM-10 và decision-log. DOM xem theo thẻ: không đổi quy tắc nghiệp vụ, chỉ trình bày cách mã thực hiện điều kiện BR-525 "không vượt công nợ đang mở". |

## Việc cho vai khác (gợi ý, không chặn)
- ARC: `approveRequest` trong `api/openapi.yaml` đang ghi `x-transition: [A3, A4]` – có thể thêm `A7`. Bảng mã sự kiện (state-machines mục 19) ghi A7 = `approve` (SYS tự hủy trong cùng lệnh), không thêm tên sự kiện mới.
- QA: ca "duyệt `debt_write_off` khi đã trả đủ → 200 `cancelled`" và "áp một phần → `effectiveAmountVnd` < `amountVnd`" (ARC 16.30.8) lấy kỳ vọng từ SM-10 A7 và 10.1 điểm 3; số "sẽ áp" của yêu cầu chờ chưa trừ công nợ là lệch đã biết (BE-S4-18, R3).
