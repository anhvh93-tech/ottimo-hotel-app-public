# Việc dời từ Sprint 3 sang Sprint 4 (Round 2)

Nguồn: kiểm chứng đối kháng vòng 4–6 (`reviews/s3-round4-verification.md`, `s3-round5-verification.md`, `s3-round6-verification.md`), QA (`qa/bug-list.md`), decision-log 17/10. ORC lập ngày 17/10/2026, trước cổng QC Sprint 3.

Không mục nào dưới đây làm sai tiền âm thầm trên đường dùng thường ngày. Mục nào có thể gặp khi demo được ghi thêm ở `demo-1-limits.md` mục C.

| # | Hạng mục | Mức | Vai | Quy tắc / nguồn | Ghi chú |
|---|---|---|---|---|---|
| S4-01 | FOC lớn hơn giá đêm mới trên đơn có người chốt (CTV/sale) → lệnh đổi giá/đổi phòng trả 500 (`RangeError` allocate.ts) | Major | BE-B | s3-round6 FOC-RESYNC (2) | Giao dịch rollback sạch, không sai tiền; đường đi hiếm. Sửa: đọc lại đêm sau khi carry FOC rồi mới tính base hoa hồng (sửa luôn S4-03) |
| S4-02 | FOC carry lấy min(FOC hiện tại, giá mới) thay vì min(số đã duyệt, giá mới) – giá xuống rồi lên lại thì FOC không hồi lại | Minor | DOM → BE-B | decision-log 17/10 (FOC theo dòng mới) | Cần DOM xác nhận chữ "số đã duyệt"; tiền lệ G-10 làm giống hiện tại |
| S4-03 | Base hoa hồng còn cũ ngay sau B8 dời FOC (tự đúng ở lần resync sau) | Minor | BE-B | s3-round6 Minor (b) | Gộp với S4-01 |
| S4-04 | Preview B14 báo chênh lệch folio khác số thực ghi khi FOC > giá mới (đơn không người chốt) | Minor | BE-A | s3-round6 Minor (c) | Chỉ sai hiển thị |
| S4-05 | Chênh lệch đổi phòng đơn OTA (BR-424) luôn so với căn gốc, đảo/ghi lại khi đổi nhiều lần | Major | BE-A | DOM 17/10 (2) | Quy tắc đã chốt |
| S4-06 | (D) đơn `cancelled`/`no_show` còn tiền dư → tự tạo yêu cầu hoàn chờ duyệt + "Cần chú ý" | Major | BE-B | BR-522 (DOM 17/10) | – |
| S4-07 | (E) B7/B7a đổi/gán căn khác định mức → tính lại phụ thu người theo nguyên nhân | Major | BE-A | BR-429 | – |
| S4-08 | REFUND #2: hủy đơn tự đảo dòng dịch vụ chưa thực hiện, dòng đã thực hiện lễ tân chọn giữ kèm lý do | Major | BE-B | BR-309 | – |
| S4-09 | B14 "khách đồng ý – chỉ chuyển tới hết đơn gốc" (cần trường mới ở 0.3.7) | Minor | ARC → BE-A, FE | decision-log 17/10 BE-A B14 | Tới lúc đó lễ tân chọn căn khác |
| S4-10 | BUG-R2-038 `checkIn.payment` | P2 | ARC → BE-A | OpenAPI 0.3.7 | – |
| S4-11 | BUG-R2-033 (a) cột `guest.id_doc_hmac` không được ghi; (b) hồ sơ khách chỉ có giấy tờ (điều kiện SEC) | P2 | BE-C, SEC | qa/bug-list.md | – |
| S4-12 | BUG-R2-054 xóa ảnh khai báo chưa `confirmed` không ghi `imagesPurgedAt` (ảnh vẫn xóa đúng hạn) | P3 | BE-C | qa/bug-list.md | – |
| S4-13 | Duyệt FOC chạy song song với B10/B11/resync – chưa kiểm tranh chấp | Rủi ro | BE-B, QA | s3-round6 gaps | Thêm test đua |
| S4-14 | BR-434 với B7/B8 dời chồng ngày, rút đầu nối đuôi – có tính là "dời cả đơn" không | Câu hỏi | DOM | s3-round6 gaps | Vòng sửa 7 dùng k→k theo thứ tự đêm cho mọi lần dời cả đơn |
| S4-15 | Kiểm chứng upload sau Caddy thật (hiện mô phỏng bằng proxy Node keep-alive) | Rủi ro | OPS, QA | s3-round6 gaps | Làm khi dựng staging |
