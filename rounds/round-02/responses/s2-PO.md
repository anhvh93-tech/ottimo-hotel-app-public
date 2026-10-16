# Phản hồi PO – Round 2, Sprint 2 (bước Phản hồi & sửa)

- Người làm: PO | Ngày: 16/10/2026 | Không sửa code, không commit
- Đầu vào: `responses/s2-BA.md` mục 4, `outputs/BA/s2-report.md` (R-1…R-3), `outputs/ARC/s2-contract.md` (A-06, B-06, B-22, B-27, Q-P1 ở `s1-contract.md`), `reviews/s2-DOM.md` (D-13 b, D-15, gợi ý `special_dates`), `reviews/s2-SEC.md` (BE-22, BE-28), `business-rules.md` v0.3.2 (mục 16 Q-D6…Q-D8), specs EP01 mục 3.3–3.4, EP07-08 mục 3.5, `outputs/FE/s1-report.md`, `outputs/UXD/s1-report.md`, `d0-report.md`.
- Không có thẻ `FB-R2-*-PO-*` gửi PO trong Sprint 2; file này trả lời các điểm các vai chuyển cho PO.

## 1. Quyết định trong quyền PO

| # | Điểm (nguồn) | Quyết định | Lý do | Sửa ở đâu |
|---|---|---|---|---|
| 1 | US-056 cho đơn dài hạn nhập tay AC5a (BA E07-06, ARC B-06) | **Không làm ở R2.** US-056 dời đầu R3 cùng HĐ dài hạn (US-086 AC3). **Không** thêm `manualLongStay.cleaningPlan` ở R2. R2: dọn khách dài hạn theo yêu cầu BR-506 (`guest_request`/`adhoc_clean`); nếu HĐ giấy có hẹn dọn cố định, lễ tân tạo việc tay theo tuần (`createHkTask`) | DOM D-15 + BR-204: đơn nhập tay mặc định 0 lần/tuần → tính năng không có dữ liệu thật để chạy ở R2 (AC1 chỉ kiểm được bằng dữ liệu mẫu); AC5a là tạm, gói dọn sẽ gắn HĐ ở R3 – làm hai lần (đơn rồi HĐ, cộng chuyển đổi) là phí; Sprint 4 đã nặng. ARC tự quyết giữ thiết kế B-06 cho R3 hay đưa vào 0.3.6 (PO không yêu cầu cài) | backlog US-056 (R3, Dời, ghi chú R2), bảng epic EP07 6→5 → **71 Must R2**; PRD 5.4; decision-log. Câu xác nhận "có HĐ đang chạy nào hẹn dọn cố định không" gom vào ESC nháp 2 |
| 2 | Cảnh báo BR-435 cho OWN (BA E01-05, ARC B-22) | **Làm ở R2** (Sprint 4, cùng "Cần chú ý"): tính khi đọc lúc OWN mở Tổng quan theo EP01 mục 3.3; thông báo đẩy hằng ngày (J21) giữ R3 | Duyệt FOC (US-007) và lễ tân tự áp minibar (BR-436) chạy từ R2 → rủi ro thất thoát có ngay từ R2; INV chọn hạn mức FOC ở ESC-007 nên cần công cụ theo dõi từ xa; ARC: không đổi hợp đồng, chi phí nhỏ | backlog **US-012 AC8** (mới); decision-log |
| 3 | US-012 AC3 ↔ SEC SR-RET-06 (BA E01-06, ARC B-27) | **Sửa AC theo SEC**, không xin SEC nới: dòng thị thực chỉ nêu **mã đơn + căn**; bấm vào → màn giấy tờ trên thiết bị được cấp mới thấy ngày hết hạn (nhật ký C3) | Việc lễ tân cần là biết đơn nào phải xử lý – mã đơn + căn đủ để hành động, chỉ thêm 1 lần bấm; ngày hết hạn là dữ liệu giấy tờ; INV đã chọn cho luật sư rà soát dữ liệu cá nhân (ESC-001) nên không nới trước khi có ý kiến luật sư | backlog **US-012 AC3**; EP01 mục 3.4 đã đúng (BA chỉ cần bỏ "đề nghị E01-06" → "PO đã quyết") |
| 4a | Nút "Thêm người dùng" ở S26/H07 (UXD d0 #3, FE s1) | **Ẩn hẳn ở R2** (không để nút tắt hay "sắp có"). US-008 nâng **Should → Must R3** (phần thêm người dùng) + AC1–AC3 | US-001 AC4 quy định tài khoản R2 tạo bằng seed; nút không chạy làm INV hiểu nhầm khi xem staging; R3 là bản dùng thử với nhân viên thật – INV cần tự thêm người mà không gọi kỹ thuật. Khóa/mở, đặt lại mật khẩu đã có ở R2 (US-002) | backlog US-008 (dòng + AC), decision-log |
| 4b | Ô "Đã giao mã cửa/thẻ" – có bắt buộc khi nhận phòng không (ARC Q-P1, UXD s1 #4) | **Không bắt buộc**; tick được ở màn nhận phòng hoặc bổ sung từ chi tiết đơn; ghi thời điểm + người; không lưu, không hiện mã | R2 mã cửa giao ngoài app (US-128 dời R3); khách đến khuya hoặc giao mã sau – bắt buộc sẽ thành tick cho có; điều kiện thật trước khi giao mã (thu đủ + giấy tờ, BR-402) đã chặn ở US-025 AC3 | backlog **US-025 AC7** (mới); decision-log |
| 5 | Người chốt bắt buộc với kênh CTV? (ARC A-06 – PO/DOM) | **Bắt buộc** khi kênh `agent` (phải là CTV) và khi kênh Trực tiếp nguồn `sales_staff` (phải là sale); kênh/nguồn khác không bắt buộc | Hoa hồng BR-903 (INV chọn ESC-005) tính theo người chốt; đơn CTV thiếu người chốt = mất hoa hồng hoặc tranh chấp khi chi. Chỉ đổi kiểm tra (`REQUIRED`/`NOT_IN_LIST`), không đổi hợp đồng | backlog **US-017 AC9** (mới); decision-log. DOM được mời phản biện nếu thấy ngoại lệ thực tế |

## 2. Việc chờ INV – đã gom thành bản nháp ESC
File: `rounds/round-02/outputs/PO/s2-esc-drafts.md` (3 bản nháp, chưa đánh số, đều "Bình thường", không chặn):

| Bản nháp | Gồm | Đội đề xuất |
|---|---|---|
| 1 – Ngày lễ tăng giá bổ sung | Q-D6: Giỗ Tổ Hùng Vương + đêm 1/9 (nêu rõ hệ quả: +30%, ở tối thiểu 2 đêm, không hoàn cọc khi hủy) | A – thêm cả hai |
| 2 – Phí dọn thêm khách ngắn ngày | D-13 b / Q-D7 (BR-506) + câu xác nhận HĐ đang chạy có hẹn dọn cố định không (hệ quả quyết định #1) | A – cách hiểu DOM |
| 3 – Giữ chỗ và tiền do sale/CTV ghi | Q-D8 (CTV 3 / sale 5 – BR-302, SEC BE-28) + báo INV cách kiểm soát BR-527 (SEC BE-22, DOM chốt NGÀNH) vì ảnh hưởng thời điểm hoa hồng CTV | A – giữ mặc định |

Không đưa lên INV: các giá trị DOM chốt nhãn NGÀNH (`staff_payment_backdate_max_hours` 24 giờ, trần số tiền một lần), quyết định 1–5 ở trên (trong quyền PO).

## 3. Việc cho các vai
| Vai | Việc |
|---|---|
| **BA** | EP07-08 mục 3.5 + bảng truy vết: US-056 "Dời R3 – PO quyết", bỏ đề nghị E07-06 khỏi R2; EP01 mục 3.3 (E01-05 → "PO quyết làm R2") và 3.4 (E01-06 → "PO sửa AC3 theo SEC"); EP00 mục 2: S26 R2 không có nút thêm người dùng; EP02 mục 3: `closerUserId` ĐK bắt buộc theo US-017 AC9; EP03-05 (nhận phòng): ô `doorAccessHandedOver` không bắt buộc, sửa được từ chi tiết đơn |
| **ARC** | B-06: không cần cài ở R2 (tự quyết giữ thiết kế cho R3); B-22: R2 tính khi đọc; Q-P1 đóng (tùy chọn); A-06: thêm mô tả kiểm `closerUserId` bắt buộc theo kênh/nguồn (không đổi schema); US-025 AC7: bảo đảm có đường API để tick bổ sung `doorAccessHandedOver` từ chi tiết đơn sau khi đã nhận phòng (ARC chọn cách) |
| **FE** | H07 ẩn nút "Thêm người dùng"; ô "Đã giao mã cửa/thẻ" không bắt buộc; "Người chốt" bắt buộc theo US-017 AC9 |
| **BE** | Sprint 4: `foc_threshold` tính khi đọc cho OWN; kiểm `closerUserId` theo US-017 AC9; không làm `cleaningPlan` |
| **QA** | Sinh lại traceability: US-056 sang nhãn Dời R3; TC mới cho US-012 AC8, US-017 AC9, US-025 AC7; sửa TC US-012 AC3 (không có ngày hết hạn trên dòng); US-008 AC1–3 cho R3 |
| **ORC** | Đánh số và chép 3 bản nháp ESC vào `02-escalations/` khi tổng kết R2; round-summary nêu: US-056 dời R3 (71 Must R2) |

## 4. File đã sửa (bước này)
- `03-backlog/backlog.md` – ghi chú đầu file, bảng epic EP07, US-008 (dòng + AC1–3), US-012 AC3/AC8, US-017 AC9, US-025 AC7, US-056 (dòng + ghi chú), lịch sử thay đổi
- `product/docs/PRD.md` – mục 5.4 thêm dòng M4, lịch sử thay đổi
- `01-decisions/decision-log.md` – 7 dòng PO 16/10
- `rounds/round-02/outputs/PO/s2-esc-drafts.md` (mới)
- `rounds/round-02/responses/s2-PO.md` (mới)

## 5. Giả định
- `[GIẢ ĐỊNH – PO]` Không có HĐ dài hạn đang chạy nào hẹn dọn cố định (theo BR-204 / Brief mục 5 "chỉ tiền thuê"); hỏi xác nhận trong ESC nháp 2, nếu có thì lễ tân tạo việc tay tới R3.
- `[GIẢ ĐỊNH – PO]` Sprint 4 còn chỗ cho `foc_threshold` tính khi đọc (ARC đánh giá chi phí nhỏ); nếu Sprint 4 trễ, US-012 AC8 là AC đầu tiên được dời và ghi trong round-summary.
