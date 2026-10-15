# Báo cáo ARC – Round 1, Bước 2 (Sản xuất), Đợt 2 – Pha A

- Người viết: ARC | Ngày: 15/10/2026
- Phạm vi: plan R1 mục 3.1 dòng ARC, **chỉ Pha A**. Chưa làm ERD, OpenAPI, coding-standards (Pha B – Đợt 3).

> Ghi chú ORC: ARC không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nguyên nội dung ARC gửi, với sự đồng ý của INV. Các dòng decision-log đề xuất đã được ORC ghi vào `01-decisions/decision-log.md`.

## 1. Đã làm gì
1. **Kiến trúc tổng thể** (`architecture.md` mục 3–5, C4 Context + Container bằng Mermaid). Backend là modular monolith NestJS chạy 2 tiến trình (api, worker). Bốn client dùng chung một API: web quản trị, app nhân viên, web khách, web đặt phòng (R3).
2. **App nhân viên chọn PWA, không làm native** (ADR-005). Lý do: một stack TypeScript, không tốn phí và thời gian duyệt của store, cập nhật ngay khi deploy. Đội tự chốt mức offline (BL 9 #22): đọc offline, xếp hàng ghi offline cho thao tác buồng phòng; mọi thao tác tiền và tồn phòng bắt buộc có mạng. Có ghi điều kiện chuyển sang app native.
3. **App khách** là web mở bằng link/QR gắn theo đơn: token lưu dạng băm, hết hạn sau khi trả phòng, có 2 mức xác minh (ADR-006, khớp SEC F09).
4. **Chọn công nghệ**: 13 ADR (`product/docs/adr/`). Không dùng Redis, Next.js, Flutter như gợi ý mặc định của skill; lý do ghi trong ADR-003/004/005.
5. **Chi phí hạ tầng**: so sánh hosting Việt Nam, Singapore, châu Âu (ADR-010). Ước tính VPS tại VN khoảng **0,45–0,9 triệu đ/tháng**, nằm trong ngân sách và không đắt hơn Singapore → ủng hộ phương án A của ESC-002.
6. **Đa cơ sở** (ADR-007: `organization`/`property`, RLS). **Múi giờ** (ADR-008: UTC + `date` theo cơ sở + `Clock` đặt được giờ giả cho QA). **Chống đặt trùng ở server** (ADR-009: exclusion constraint PostgreSQL + idempotency + khóa lạc quan; OOO chặn bán; đơn OTA bị xung đột thì không từ chối im lặng).
7. **Lớp adapter**: chấp nhận thiết kế của INT, bổ sung 10 điểm B1–B10 (ADR-011, architecture mục 13). Các điểm này sẽ thành thẻ review `ARC-on-INT.md` ở bước 3; ARC không sửa file của INT.
8. **Nhận xét so sánh channel manager** từ góc kỹ thuật (architecture mục 14): đồng ý đề xuất Beds24 kèm điều kiện; đề nghị loại ezCloud nếu không có API 2 chiều.
9. **Cấu trúc repo `product/` và công cụ build/test/lint** cho OPS (architecture mục 17, ADR-012), kèm khung tối thiểu để CI xanh. Ghi rõ những gì **Pha B cần từ BA, DATA, DOM, SEC, INT, PO** (architecture mục 18).
10. Kiểm lại cả 13 ADR sau khi mất mạng: đều trọn vẹn, không phải viết lại.

## 2. File tạo/sửa
- `product/docs/architecture.md` (mới)
- `product/docs/adr/README.md` và `ADR-001` … `ADR-013` (mới)
- `rounds/round-01/outputs/ARC/report.md` (mới, ORC lưu hộ)

Không sửa: `01-decisions/decision-log.md`, `02-escalations/`, file của INT, BA, UXD, DATA và các vai khác.

## 3. Giả định
- [GIẢ ĐỊNH – chờ INV xác nhận] Ngân sách hạ tầng ≤ 1 triệu đ/tháng (đã có trong decision-log); phí channel manager, SMS/Zalo tính riêng.
- [GIẢ ĐỊNH – chờ INV xác nhận] Nhân viên buồng phòng dùng điện thoại Android (decision-log UXR); chủ đầu tư/CTV có thể dùng iPhone, chấp nhận giới hạn PWA trên iOS.
- Giá hosting lấy từ trang tổng hợp bên thứ ba hoặc là ước tính của đội, **không phải báo giá chính thức**. Tỷ giá 1 USD ≈ 26.200 đ, 1 EUR ≈ 30.500 đ (giống INT).
- Tải nhỏ (< 10 người dùng nội bộ đồng thời, < 200 lượt mở app khách/ngày) → 1 VPS 2 vCPU/4 GB là đủ.
- Mỗi đơn OTA phải được gán căn ngay khi về (10 căn là 10 đơn vị riêng).
- RTO ≤ 4 giờ, RPO ≤ 15 phút là mục tiêu kỹ thuật (PRD chỉ yêu cầu RPO ≤ 24 giờ); OPS xác nhận.
- Hạn khai báo, giờ nhắc và mọi mốc giờ đều đọc từ bảng tham số (BR mục 13), nên khi luật sư/INV đổi thì không phải sửa code.

## 4. Rủi ro / vướng mắc
- **Phạm vi R2 lớn** (71 story Must R2 – PO report): kiến trúc đã tối giản, nhưng cần PO/ORC cắt theo thứ tự PRD D6. ARC sẽ ước lượng sau khi có OpenAPI (Pha B).
- **ESC-002 chưa quyết**: R2 vẫn chạy được vì staging chỉ có dữ liệu giả; production bị chặn tới khi INV quyết. Kiến trúc không đổi dù INV chọn A, B hay C (chỉ đổi nơi đặt VPS).
- **Beds24 không có sandbox riêng** [Chưa xác minh]: thử nghiệm có thể đẩy tồn ra OTA thật. Cách giảm: dùng tài khoản thử chưa nối OTA. Ghi vào architecture mục 14.
- **ezCloud**: nếu không có API 2 chiều thì mâu thuẫn nguyên tắc "một nguồn sự thật cho phòng trống". ARC đề nghị INT/PO loại ezCloud khỏi ESC chọn channel manager nếu ezCloud không xác nhận được bằng văn bản.
- **Phụ thuộc chéo đang chạy song song**: cách biểu diễn "đơn OTA xung đột" (trạng thái riêng hay cờ) chờ BA trong `state-machines.md`. ADR-009 để ngỏ điểm này.
- Rủi ro kỹ thuật T1–T8: xem architecture mục 19.

## 5. Việc chưa xong
**Pha B (Đợt 3) – còn chờ:**
- `product/docs/erd.md`, `product/docs/api/openapi.yaml` (luồng R2, chuẩn lỗi RFC 9457, phân trang, Idempotency-Key, ví dụ), sinh mã chứng từ an toàn (BL 8.2 #18), danh sách job đầy đủ, `product/docs/coding-standards.md`.
- Đầu vào đang chờ (chi tiết ở architecture mục 18): BA (`state-machines.md`, `rbac-matrix.md`, `use-cases.md`); DATA (`metrics-definitions.md` + danh sách trường); DOM (quy tắc gán căn đơn OTA, định dạng mã chứng từ); SEC (trường C3 cuối cùng, xác minh khách mức 2); INT (phản hồi B1–B10, mẫu payload Beds24).

**Bước 3 (review):** ARC review BA (bắt buộc), INT, OPS, SEC. Thẻ B1–B10 đưa vào `reviews/ARC-on-INT.md`.

**Đề xuất cho PO/ORC (không tạo ESC mới):**
- Bổ sung vào ESC-002, phương án A, bảng chi phí ADR-010 (ước 0,45–0,9 tr/tháng, vừa ngân sách, chờ OPS báo giá).
- Đưa nhận xét kỹ thuật ở architecture mục 14 vào ESC chọn channel manager (dự thảo ESC-INT-A).
