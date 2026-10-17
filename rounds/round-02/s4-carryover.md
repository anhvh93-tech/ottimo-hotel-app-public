# Việc dời từ Sprint 3 sang Sprint 4 (Round 2)

Nguồn: kiểm chứng đối kháng vòng 4–6 (`reviews/s3-round4-verification.md`, `s3-round5-verification.md`, `s3-round6-verification.md`), QA (`qa/bug-list.md`), decision-log 17/10. ORC lập ngày 17/10/2026, trước cổng QC Sprint 3.

Không mục nào dưới đây làm sai tiền âm thầm trên đường dùng thường ngày. Mục nào có thể gặp khi demo được ghi thêm ở `demo-1-limits.md` mục C.

| # | Hạng mục | Mức | Vai | Quy tắc / nguồn | Ghi chú |
|---|---|---|---|---|---|
| S4-01 | FOC lớn hơn giá đêm mới trên đơn có người chốt (CTV/sale) → lệnh đổi giá/đổi phòng trả 500 (`RangeError` allocate.ts) | Major | BE-B | s3-round6 FOC-RESYNC (2) | Giao dịch rollback sạch, không sai tiền; đường đi hiếm. Sửa: đọc lại đêm sau khi carry FOC rồi mới tính base hoa hồng (sửa luôn S4-03) |
| S4-02 | FOC carry lấy min(FOC hiện tại, giá mới) thay vì min(số đã duyệt, giá mới) – giá xuống rồi lên lại thì FOC không hồi lại; **mở rộng (s3-round8)**: phí phụ thu về 0 rồi tăng lại (4A→2A→4A) thì FOC phụ thu mất hẳn (+150k) – phải đọc số đã duyệt từ approval kể cả khi dòng FOC đã bị đảo, kèm test 4A→2A→4A | Major-defer | BE-B | BR-434 (DOM 17/10: "số đã duyệt" = số trên yêu cầu duyệt) | DOM đã trả lời; còn sửa code |
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
| S4-14 | ~~BR-434 với B7/B8 dời chồng ngày, rút đầu nối đuôi~~ – **ĐÓNG 17/10**: DOM chốt quy tắc theo ngày (đêm giữ giữ FOC; đêm bỏ thứ i → đêm thêm thứ i; không có thì hủy), áp ngay ở vòng sửa 8 | – | DOM | BR-434, br-examples BR-434-02…06 | – |
| S4-15 | Kiểm chứng upload sau Caddy thật (hiện mô phỏng bằng proxy Node keep-alive) | Rủi ro | OPS, QA | s3-round6 gaps | Làm khi dựng staging |
| S4-16 | Dependabot PR gộp mới sau khi sửa `dependabot.yml` (17/10): #12 upload-artifact v7, #15 minor-and-patch → gộp sau cổng QC Sprint 3 nếu CI xanh; #13 nhóm react (React 19), #14 nhóm vite (vite 8 + plugin-react 6), #16 eslint-plugin-react-hooks 7, #7 cũ → hoãn tới đợt nâng toolchain FE ở R3 | – | OPS, FE | outputs/OPS/s2-dependabot.md | Không gộp gì trong lúc QC xét Sprint 3 để kết quả CI không bị lẫn |
| S4-17 | Upload gửi thẳng api bằng HTTP pipelining (không qua Caddy) giữ được ~1 GB thân, vượt trần 4 × 42 MB; listener `error` sau khi đọc xong còn giữ `body` qua closure (chú thích http.ts:268 sai) | Major (không với tới từ client ở prod) | BE-C | s3-round7 UP-1, UP-2 | Prod không mở cổng api (compose prod), Caddy không pipeline lên upstream; sửa `body = null`/noop + giới hạn pipelining, kiểm cùng S4-15 |
| S4-18 | FOC đang chờ duyệt mà dòng đêm bị ghi lại (B8 dời đơn, **đổi giá do giảm theo số đêm/LOS ở ngày giữ** – s3-round8) → khi duyệt, dòng FOC thành `rejected` dù yêu cầu `approved` (A5 có từ trước); FOC bị hủy theo quy tắc phải có audit `folio.foc_cancelled` và không tính vào `monthlyApprovedBy`/báo cáo FOC tháng | Major-defer | BE-B | s3-round7 FOC-5 | Tiền folio đúng (không giảm), lệch hạn mức/báo cáo FOC; cần báo người duyệt hoặc chuyển yêu cầu sang đêm mới |
| S4-19 | ~~Ví dụ BR-434 (căn 302 giá 917k) áp cho B14 hay cả B7~~ – **ĐÓNG 17/10**: DOM – chỉ B14 khách yêu cầu (BR-434) | – | DOM | s3-round7 FOC-7 | Câu hỏi chính sách giá B7 tách ra S4-21 |
| S4-20 | Test chập chờn `http-foundation.test.ts` "runs a job now…" – bảng `dev_clock` 1 dòng dùng chung giữa các tệp test chạy song song (approvals-audit, architecture, platform đổi đồng hồ) | Rủi ro CI | BE, QA | BE-B báo vòng sửa 8 | Đóng băng đồng hồ trong test hoặc truyền `slot` cố định; có từ trước |
| S4-21 | B7 khách xin đổi sang căn đắt hơn trước khi đến vẫn giữ giá từng đêm cũ (BR-429) – kẽ hở doanh thu (ví dụ 101 giá 667.000 → 401 giá 1.042.000). DOM đề xuất tính theo giá căn mới như B14 (BR-424) | Câu hỏi chính sách | PO + DOM → có thể ESC | DOM 17/10 (FOC-7) | Chính sách giá – gom vào tổng kết Round 2 nếu cần INV quyết |
| S4-22 | B12 khôi phục đơn no-show làm mất FOC đã duyệt (+300k) – BR-434 chưa nói B12, BR-315(a) dùng lại đêm cũ giữ giá nên nhiều khả năng FOC phải quay lại | Major-defer | DOM → BE-B | s3-round8 mny-1 | Hiếm: FOC trước khi đến → no-show → khôi phục; DOM chốt trước khi sửa |
| S4-23 | Note: lọc `service_date` null khỏi `focDateMap` (hoặc CHECK); hỏi DOM thứ tự áp giảm giá đặc biệt / FOC trên cùng dòng (chỉ lệch báo cáo) | Note | BE-B, DOM | s3-round8 code-2, code-5 | – |
| S4-24 | QA: thêm spec api/E2E cho BR-434-02/03 qua endpoint move; sửa sinh số điện thoại ngẫu nhiên trùng ở TC-L3-013 (`support/s3.ts:901`); xem vì sao TC-L3-011 (`test.fail`) có retry ở run 38998735861 | QA | QA | s3-round8 breg-1, breg-3 | Không chặn cổng |
