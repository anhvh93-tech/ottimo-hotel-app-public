# PO + SEC ký điểm HD-23 `qa.sal` (Round 4 – Review, 06/11/2026)

Nguồn: `rounds/round-04/reviews/QC-on-drill-5.0-r3.md` ĐK-4; TC-V104-HD-23 (`rounds/round-04/qa/v1.0.4-test-cases.md`), `v1.0.4-stg-api-checklist.md`.

## Mục PO – kết luận: LỆCH CHẤP NHẬN (không phải lỗi)
- `product/docs/rbac-matrix.md` ghi chú 33a: SAL chỉ xem giao dịch/cọc **của đơn mình** (`recordedBy`/`confirmedBy` = mình, `x-scope: own`); ghi chú 41: SAL giữ `own`; ghi chú 42: ngoài phạm vi → không có trong danh sách / 404. Sales không xác nhận cọc thiếu (chấp nhận cọc thiếu là quyền FDL+ theo hạn mức).
- H3 do người khác chốt → `qa.sal` không thấy đơn, `GET` 404 là đúng nghiệp vụ. Mục tiêu của HD-23 (SAL không chấp nhận được cọc thiếu) vẫn đạt, chặt hơn 403.
- Test case cũ ghi 403 là sai kỳ vọng; QA đã sửa 05/11. Không đổi backlog, không ESC.

## Mục SEC – kết luận: CHẤP NHẬN
- 404 cho tài nguyên ngoài phạm vi `own` là mẫu đã chốt (ghi chú 42, A66): không phân biệt "không tồn tại" và "không có quyền" → không lộ sự tồn tại của đơn, chống dò mã đơn (IDOR/enumeration). 403 ở đây mới là lộ thông tin.
- Điều kiện: thân 404 giống hệt đơn không tồn tại (cùng mã lỗi, không tên khách/số tiền); `confirm-deposit` với `acceptShortfallReason` trên đơn ngoài phạm vi cũng trả 404, không ghi thay đổi. QA xác nhận trong lượt 07/11 theo checklist; lệch → mở BUG P1.
- FD/FDL (thấy đơn) nhận 403 `FORBIDDEN_ACTION` là đúng, không lộ thêm gì.

Ký: PO, SEC – 06/11/2026. ĐK-4 phần HD-23 `qa.sal`: đóng (kèm điều kiện SEC kiểm ở lượt 07/11).
