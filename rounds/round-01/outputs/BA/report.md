# Báo cáo BA – Round 1, Bước 2 (Sản xuất, đợt 2)

- Ngày: 15/10/2026 | Vai: BA | Trạng thái: nộp, chờ review DOM, ARC (bắt buộc), QA, SEC (khuyến nghị)

## 1. Đã làm gì
- **Sơ đồ trạng thái** (ưu tiên cho ARC Pha B): 15 máy trạng thái, mỗi máy có Mermaid + bảng chuyển (điều kiện server kiểm, vai được chuyển, hệ quả). Đơn dùng đúng tên DOM chốt (`hold`, `confirmed`, `in_house`, `checked_out`, `cancelled`, `no_show`); OOO tách thành khối chặn tồn phòng riêng (SM-02). Có thêm: buồng 7 mã, phiếu sửa chữa, khai báo lưu trú (sửa trình tự BL 5.12 theo SEC R-REG-05), hợp đồng dài hạn, kỳ thu, báo giá, lead, yêu cầu duyệt, hoa hồng, giao dịch thanh toán, folio, việc buồng phòng, yêu cầu khách.
- **Ma trận phân quyền**: 9 vai + hệ thống (tách lễ tân trưởng, sale nội bộ/CTV, buồng phòng/bảo trì); 31 màn hình; khoảng 70 hành động; phê duyệt và hạn mức (tham chiếu BR-433); ma trận trường D01–D28 theo thang C0–C3 của SEC + dữ liệu kinh doanh (giá vốn, P&L, phí kênh, hoa hồng). Giải quyết 8 mâu thuẫn của BL mục 2 và BL 8.2 #27 (mục 7). Quy tắc thực thi cho ARC/BE/SEC (mục 8).
- **Quy trình nghiệp vụ**: 10 quy trình (9 quy trình được giao + P10 duyệt FOC dùng chung), mỗi quy trình có bảng bước, swimlane Mermaid, ngoại lệ, lỗi.
- **Use case**: 30 use case, truy vết tới P, SM, BR, US.
- Ghi rõ 2 mâu thuẫn được giao: ngưỡng trẻ em (BL 3.17 dưới 14 – SEC R-CON-05 dưới 16 – BR-110 bậc tuổi giá) → tách 2 thuộc tính độc lập (rbac mục 9); hạn khai báo khách nước ngoài (BR-603 so với BL 5.12) → dùng hạn sớm hơn theo giả định đã có.
- Mọi con số nghiệp vụ chỉ tham chiếu mã BR, không chép số.

## 2. File tạo/sửa
- Tạo `product/docs/state-machines.md`
- Tạo `product/docs/rbac-matrix.md`
- Tạo `product/docs/business-processes.md`
- Tạo `product/docs/use-cases.md`
- Tạo `rounds/round-01/outputs/BA/report.md`
- Không sửa `01-decisions/decision-log.md`, `02-escalations/`, file của UXD/DATA/ARC.

## 3. Giả định
Dòng decision-log đề xuất (ORC ghi khi commit):

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 1 | Bộ mã vai: owner, manager, front_desk_lead (kế thừa front_desk), front_desk, housekeeping, maintenance, sales_staff, collaborator, guest (link), system; một tài khoản nhiều vai = hợp quyền | BA | Quyền BA (cách đặc tả); PRD U1–U5 |
| 2026-10-15 | 1 | Quyền kiểm ở server theo 3 lớp: màn hình, hành động, trường; trường không được phép không trả về từ API | BA | BL 8.2 #27, US-002 AC2 |
| 2026-10-15 | 1 | Khai báo lưu trú: đồng ý lưu ảnh không còn là điều kiện sang `scanned` (sửa trình tự BL 5.12); thêm trạng thái `void` cho đơn hủy/no-show | BA | SEC R-REG-05, decision-log SEC |
| 2026-10-15 | 1 | Người trong đơn có 2 thuộc tính độc lập: `is_minor_data` theo ngưỡng bảo vệ dữ liệu của SEC (thay ngưỡng BL 3.17) và bậc tuổi phụ thu theo BR-110 | BA | SEC R-CON-05; ngưỡng cuối do luật sư (ESC-001) |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] CTV không được xác nhận cọc (chỉ báo đã chuyển kèm biên nhận); lễ tân/sale nội bộ xác nhận | BA | Kiểm soát tiền; CTV ngoài biên chế |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Chỉ chủ đầu tư được gán vai, đặt hạn mức FOC, tỷ lệ hoa hồng, phí kênh; quản lý sửa tham số vận hành | BA | Tách người đặt hạn mức với người duyệt |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] SAL/CTV không thấy bất kỳ trường giấy tờ nào (kể cả dạng che); chỉ thấy khách/lead của mình; CTV không thấy "OTTIMO còn lại" | BA | BR-610, SEC D01–D04 |
| 2026-10-15 | 1 | Thêm các chuyển ngoại lệ có duyệt MGR+: khôi phục no-show, hoàn tác nhận phòng nhầm (chờ DOM xác nhận) | BA | Tình huống thực tế khách đến khuya |

Giả định khác dùng trong tài liệu: lễ tân trưởng chỉ xem báo cáo vận hành không có doanh thu; người trực đêm dùng vai lễ tân; hoa hồng gộp chi theo tháng (chờ DOM); trường C3 chỉ mở trên thiết bị quầy (chờ SEC/ARC).

## 4. Rủi ro / vướng mắc
- **Câu hỏi cho DOM** (gửi qua review, không cần INV) – `state-machines.md` mục 16: SQ-1 khôi phục no-show; SQ-2 thời hạn phiếu khi chờ vật tư; **SQ-3 BR-432 ("không tự duyệt") và BR-433/BR-704 (lễ tân FOC minibar trong hạn mức) đọc mâu thuẫn**; SQ-4 kỳ chi hoa hồng. Đề nghị DOM thêm tham số ngưỡng trẻ em (bảo vệ dữ liệu) vào BR-612.
- **Đề xuất cho PO**: thêm story cho UC-30 (yêu cầu của chủ thể dữ liệu – SEC R-DSR) và cho "khôi phục no-show", "trả phòng nhanh qua app" (BR-427) nếu chưa có.
- **Dự thảo bổ sung ESC (không tạo ESC mới)** – PO/SEC gộp vào ESC đã có:
  - ESC-001 (luật sư): thêm câu hỏi "Ngưỡng tuổi trẻ em áp chế độ bảo vệ dữ liệu (đội đang dùng dưới 16 theo SEC thay cho dưới 14 của prototype)?" và "Hạn khai báo tạm trú người nước ngoài: 12 giờ kể từ khi đến hay 23:00 ngày đến (BR-603)?" – nếu PO chưa đưa vào nhóm ESC pháp lý.
- Rủi ro: tài liệu dài, ARC cần đọc kỹ cột "Điều kiện" của SM-01, SM-05, SM-10 để đưa vào ERD/OpenAPI. Persona/thiết bị là mô phỏng (ESC-003) – nếu buồng phòng không tự dùng app, RBAC vẫn đúng nhưng lễ tân sẽ thao tác hộ (vai FD đã có quyền A80–A82).

## 5. Việc chưa xong
- Đặc tả chức năng theo phân hệ ở mức trường/kiểm tra hợp lệ/thông báo lỗi chi tiết (`specs/<phân-hệ>.md`) – để bước 4 hoặc đầu R2 sau khi có ERD/OpenAPI của ARC và wireframe UXD.
- Review QA (khuyến nghị) – làm ở bước 3 khi QA có test case.
- Trả lời thẻ review DOM/ARC ở bước 4.
