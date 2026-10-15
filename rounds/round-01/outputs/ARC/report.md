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

---

# Báo cáo ARC – Round 1, Bước 2 (Sản xuất), Đợt 3 – Pha B

- Người viết: ARC | Ngày: 15/10/2026
- Phạm vi: plan R1 mục 3.1 dòng ARC, **Pha B** (architecture.md mục 18): ERD, OpenAPI R2, mã chứng từ, job theo lịch, chuẩn code. Phần Pha A ở trên giữ nguyên.

## 1. Đã làm gì
1. **ERD** (`product/docs/erd.md`): khoảng 70 bảng chia theo module, 6 sơ đồ Mermaid và từ điển cột. Mỗi cột ghi mức C0–C3 và phạm vi R2/R3/sau MVP. ERD phủ mọi thực thể BL mục 4 (bảng truy vết 13.1) và đủ danh sách trường bắt buộc của DATA mục 9 (bảng 13.2), gồm bảng đêm-phòng `stay_night` và lịch sử đơn `reservation_change`. Có RLS theo cơ sở (3 vai DB, biến phiên, policy sinh tự động), 15 máy trạng thái của BA ánh xạ sang cột/enum, 10 ràng buộc then chốt kèm test bắt buộc. Bảng tham số có hiệu lực theo ngày phủ đủ khóa ở BR mục 13 và thời hạn lưu T01–T18 của SEC. ARC thêm 11 khóa hệ thống, chờ DOM/SEC xác nhận.
2. **Chốt cách biểu diễn đơn OTA xung đột, khớp BA**: không thêm trạng thái mới. Đơn vẫn là `confirmed`, có thêm cột `conflict_state`, segment chưa gán căn (`room_id NULL`) và không ghi `room_occupancy`, nên ràng buộc chống trùng vẫn tuyệt đối. Rack có làn "Chưa gán căn", kèm bảng `overbooking_incident`. Xung đột được xử lý bằng B7/B14 và không nhận phòng được khi chưa gán căn (erd mục 7). Đã cập nhật ADR-009 và architecture mục 8.
3. **OpenAPI 3.1 nháp** (`product/docs/api/openapi.yaml`): 116 path, 136 operation. Phủ **74/74 story Must R2** theo backlog đợt 3 (đã kiểm tự động qua `x-stories`). Có lỗi RFC 9457 kèm bảng 37 mã lỗi, phân trang con trỏ, `Idempotency-Key`, `If-Match`/`ETag` và ví dụ request/response cho các luồng chính (đơn OTA, trùng phòng 409, báo giá dài hạn khớp BL 5.2, nhận phòng thiếu điều kiện, trả phòng còn nợ). Mỗi operation ghi `x-roles`, `x-scope`, `x-rbac` (mã A-xx/S-xx), `x-transition` (B1…, K1…). Trường không được phép đánh dấu `x-visible-to` (server bỏ khỏi JSON); dữ liệu C3 chỉ trả qua endpoint `.../sensitive` hoặc tải ảnh. **Đã kiểm hợp lệ** bằng `openapi-spec-validator` 0.7.2 (Python; máy không có Node): kết quả VALID. Đã dò mọi flow-mapping YAML để tránh dấu phẩy làm sai giá trị ví dụ.
4. **Mã chứng từ an toàn** (erd mục 10, architecture 9a): dùng bảng `doc_sequence` theo (cơ sở/tổ chức, loại mã, kỳ) và cấp mã bằng `UPDATE … RETURNING` có khóa hàng trong cùng giao dịch. Cách này không hở số khi rollback, không trùng mã, không dùng SEQUENCE, thời gian hay số ngẫu nhiên. Định dạng `OTM-00171`, `BG-00049`, `WO-00034`, `HD-…`, `F-261015-0001` (số bill cấp khi folio chuyển `settled`), `PT-…`, `KH-0018` (theo tổ chức). Có thể seed nối tiếp bộ đếm của prototype.
5. **Job theo lịch** (architecture mục 9.1): 23 job, trong đó 18 job thuộc R2. Có các nguyên tắc chạy đúng một lần (`job_run` UK), bắt kịp sau khi worker dừng, đọc tham số tại thời điểm chạy, không bao giờ tự đánh dấu no-show. Gồm: giữ chỗ hết hạn (hẹn giờ + quét dự phòng 1 phút, ≤ 5 phút theo US-085), nhắc trả phòng theo `checkout_reminders`, hạn khai báo (công thức VN/NN, chế độ `earlier_of` cấu hình được, nhắc ca tối/sáng), nhắc gọi khách và nhắc đánh dấu no-show, buồng phòng 07:00, OOO đến hạn, SLA yêu cầu khách và phiếu sửa, kỳ thu, cảnh báo thị thực, đóng folio, xóa theo hạn (hủy DEK), kiểm toàn vẹn dữ liệu DATA R-04/05/06.
6. **Chuẩn code** (`product/docs/coding-standards.md`): nguyên tắc nền; ranh giới module; quy tắc TypeScript, tiền, thời gian, DB/migration/RLS, API (contract-first, phân quyền 3 lớp với test sinh từ `x-roles`), dữ liệu nhạy cảm/log, frontend/PWA offline/i18n/a11y; tầng test (gồm test đồng thời, coi ví dụ số trong BR là test vàng); Git/commit/PR checklist; ngân sách hiệu năng; DoD kỹ thuật. Mục nào CI kiểm tự động thì ghi **[LINT]**.

## 2. File tạo/sửa
- `product/docs/erd.md` (mới)
- `product/docs/api/openapi.yaml` (mới)
- `product/docs/coding-standards.md` (mới)
- `product/docs/architecture.md` (sửa: trạng thái đầu file, mục 8 chốt xung đột OTA, mục 9 + 9.1 danh sách job, mục 9a mã chứng từ, lịch sử)
- `product/docs/adr/ADR-009-double-booking-prevention.md` (thêm mục "Cập nhật Pha B")
- `rounds/round-01/outputs/ARC/report.md` (thêm phần Pha B)

Không sửa: `01-decisions/`, `02-escalations/`, file của BA, DOM, DATA, SEC, PO, INT, UXD, OPS (kể cả khung repo `product/apps|services|infra|packages`).

## 3. Giả định
- `id` dùng UUIDv7 sinh ở ứng dụng. Tỷ lệ lưu dạng phần trăm `numeric(7,4)`. Enum lưu `text + CHECK`.
- Đơn OTA tự gán căn theo thứ tự: căn ánh xạ, rồi căn trống cùng nhóm, rồi nhóm cao hơn theo `room_group.sort_order` (chờ DOM xác nhận, E2).
- Link app khách còn hiệu lực sau trả phòng `guest_link_grace_hours` (mặc định 24 giờ theo ADR-006) để khách xem bill/thanh toán phát sinh (BR-427). Xem M4.
- Khách từ chối lưu ảnh: khi khai báo chuyển `confirmed`, xóa ảnh ngay qua outbox, không chờ job 03:00. Job hằng ngày chỉ là lưới an toàn (T01).
- Chỉ hiện C3 trên "máy quầy được cấp" qua cờ `user_session.device_trusted` do OWN đánh dấu (rbac 8.7, chờ SEC).
- Job theo mốc giờ chạy bù nếu trễ ≤ 60 phút (`job_catchup_minutes`).
- Số tài khoản nhận hoàn tiền (D15) chỉ lưu mã hóa trên yêu cầu duyệt hoàn, hủy DEK khi hoàn xong (T09).
- Endpoint webhook thanh toán/kênh chỉ để chỗ (R3). R2 dùng Mock và nhập tay.
- Đơn vị đo "≤ 5 phút" của US-085/DATA S7 được thiết kế đạt khoảng 1–2 phút.

## 4. Mâu thuẫn giữa các vai – đưa vào bước 3 (review), ARC **không** sửa file của họ
| # | Mâu thuẫn | Ở đâu | Đề xuất ARC | Gửi |
|---|---|---|---|---|
| M1 | **BR-603**: quy tắc "hạn sớm hơn giữa giờ nhận + 12 giờ và 23:00 ngày đến" mâu thuẫn với chính ví dụ của BR-603 ("nhận 21:30 → hạn 09:30 hôm sau"; theo quy tắc phải là 23:00). Tình huống S3 (đến 01:30 → hạn 13:30) cũng khác kết quả nếu áp mốc 08:00 của BR-602 | `business-rules.md` BR-603, mục 14 S3; decision-log DOM | Đã cài tham số `registration_deadline_foreigner_mode` (`earlier_of` hoặc `hours_only`). DOM sửa ví dụ hoặc quy tắc cho thống nhất; luật sư chốt qua ESC-001 | DOM, SEC |
| M2 | BR mục 13 thiếu khóa cho các con số đang dùng: thời hạn phát sinh sau trả phòng nhanh (BR-427, 24 giờ), mốc nhắc khai báo ca tối/sáng (BR-611), "nhắc trước 2 giờ" (S8), bật/tắt HK tự kiểm (BR-802), ngưỡng tuổi bảo vệ dữ liệu trẻ em (rbac mục 9) | BR mục 13; erd 9.3 | DOM thêm các khóa ở erd 9.3 vào BR mục 13 | DOM, BA |
| M3 | Ảnh giấy tờ khi khách **không** đồng ý: SEC T01 cho xóa "trong 24 giờ sau xác nhận", còn BR-609 và US-045 AC2 ghi "xóa ngay" | SEC mục 7; BR-609; backlog US-045 | ARC xóa ngay qua outbox; tham số T01 là giới hạn trên. SEC/DOM thống nhất câu chữ | SEC, DOM, PO |
| M4 | Link app khách: US-106 AC2 và rbac 8.6 cho hết hiệu lực **khi `checked_out`**; ADR-006 cho thêm 24 giờ ân hạn; BR-427 cần link thanh toán phát sinh trong 24 giờ sau trả phòng nhanh | backlog US-106; rbac 8.6; ADR-006; BR-427 | Giữ ân hạn cấu hình được. Sau `checked_out` chỉ còn xem bill/thanh toán phát sinh, không còn mã cửa/Wi-Fi/yêu cầu. PO/SEC chọn giá trị mặc định (0 hoặc 24 giờ) | PO, SEC |
| M5 | DATA R-06 (đêm có khách + OOO + trống = số căn) chưa tính đơn OTA xung đột **chưa gán căn** (erd mục 7) | metrics mục 6 | Thêm vế "đêm xung đột chưa gán" hoặc tính riêng | DATA |
| M6 | Mã bill BR-007 `F-yymmdd-nnnn` đánh lại số theo ngày, trong khi câu chữ ghi "liên tục theo cơ sở" | BR-007 | ARC hiểu là liên tục trong từng ngày; DOM xác nhận (hoặc đổi sang đánh số liên tục cả năm) | DOM |
| M7 | Sức chứa: BR-110 đặt theo **nhóm căn**, US-004 yêu cầu sức chứa **từng căn** | BR-110; backlog US-004 | ERD hỗ trợ cả hai (`room.max_occupancy` ghi đè nhóm). PO/DOM xác nhận ưu tiên dữ liệu thật từng căn (Q-D5) | DOM, PO |
| M8 | rbac 8.7 (C3 chỉ mở trên máy quầy) chưa có cơ chế; SEC chưa chốt | rbac 8.7 | Cờ `device_trusted` theo phiên do OWN cấp (erd E4) | SEC, BA |
| M9 | Ngày cảnh báo thị thực (`visa_alert_on`) lưu dạng rõ để job và "Cần chú ý" truy vấn được, trong khi hạn thị thực là C3 | SEC D05; erd E1 | Chấp nhận vì đây là giá trị suy ra (hạn − N ngày). SEC duyệt hoặc yêu cầu giải mã khi chạy job | SEC |
| M10 | (Đã giải quyết – ghi để truy vết) ADR-009 bản Pha A nói "đơn OTA chưa gán căn không tồn tại"; BA chọn tạo `confirmed` + cờ xung đột | ADR-009; state-machines 1.3 | ARC theo BA, đã cập nhật ADR-009 | – |
| M11 | (Đã giải quyết bởi PO đợt 3) US-045 AC1/US-107 AC3 cũ bắt đồng ý mới cho khai báo, trái SEC R-REG-05 | backlog | OpenAPI theo bản đợt 3: phải ghi Có/Không, không bắt Có | – |

Ghi chú cho review OPS (không phải mâu thuẫn): file compose dev nằm ở `product/infra/docker-compose.yml`, còn architecture mục 17 ghi `infra/compose/`. ARC chấp nhận vị trí của OPS; coding-standards đã ghi theo vị trí thực tế.

## 5. Rủi ro / vướng mắc
- **Khối lượng R2** vẫn lớn: 74 story Must, 136 operation. ARC ước tính thô cho BE khoảng 9–11 tuần-người cho phần API + job + test (giả định 1 BE toàn thời gian dùng AI hỗ trợ, chưa tính FE/MOB). PO/ORC nên giữ thứ tự cắt theo PRD D6 nếu thiếu thời gian. Ước tính sẽ chỉnh sau review BE.
- Endpoint C3 và phân quyền theo trường là phần dễ sai nhất. Đã đặt test sinh tự động từ `x-roles`/`x-visible-to`, nhưng SEC Phần 2 (threat model) có thể bổ sung yêu cầu và làm đổi hợp đồng.
- Chế độ hạn khai báo khách NN (M1) chưa chắc về pháp lý. Đổi chế độ chỉ là đổi tham số, không đổi code.
- Chưa có tài liệu Beds24 thật: `channel_mapping`, `inbox_message`, webhook mới là khung (R3).

## 6. Việc chưa xong / bước tiếp
- **Bước 3 (review)**: cần BE, SEC review bắt buộc ERD + OpenAPI; DATA review erd mục 8, 13.2 và M5; DOM review E2, M1, M2, M6; INT review webhook/`channel_mapping`/outbox; UXD đối chiếu các điểm: làn "Chưa gán căn" trên rack, hộp xác nhận dùng `dryRun` (US-135), mục "Không áp dụng được" khi đồng bộ offline. ARC review BA (bắt buộc), INT (thẻ B1–B10), OPS, SEC.
- R2: BE sinh migration từ erd; sinh `packages/contracts` từ `openapi.yaml`; thêm Spectral/validator vào CI (OPS).
- Chưa làm: tách ADR riêng cho "phân quyền theo trường bằng `x-visible-to`" (đang mô tả trong OpenAPI + coding-standards). Làm khi SEC chốt Phần 2.

## 7. Đề xuất dòng decision-log (ORC ghi khi commit – ARC không sửa decision-log)
| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 1 | ERD: bảng số ít snake_case, tiền `bigint` VND, enum `text + CHECK` đúng tên trạng thái BA, UUIDv7, không xóa cứng dữ liệu nghiệp vụ, RLS theo `property_id`/`organization_id` cho mọi bảng | ARC | `erd.md` mục 1–2 |
| 2026-10-15 | 1 | Đơn OTA xung đột: giữ `confirmed` + `conflict_state`, segment chưa gán căn, không chèn `room_occupancy`; xử lý bằng đổi căn/đổi phòng; không nhận phòng khi chưa gán | ARC (khớp BA) | BR-312, ADR-009, `erd.md` mục 7 |
| 2026-10-15 | 1 | Mã chứng từ cấp bằng bảng `doc_sequence` khóa hàng trong cùng giao dịch; số bill cấp khi folio `settled` | ARC | BR-007, BL 8.2 #18 |
| 2026-10-15 | 1 | Job theo lịch: đúng một lần qua `job_run`, chạy bù có giới hạn, đọc tham số khi chạy, không tự đánh dấu no-show | ARC | architecture 9.1 |
| 2026-10-15 | 1 | Chuẩn API: RFC 9457 + `code`, phân trang con trỏ, `Idempotency-Key` bắt buộc cho POST ghi, `If-Match` cho sửa/chuyển trạng thái, phân quyền khai báo bằng `x-roles`/`x-scope`/`x-visible-to` | ARC | `openapi.yaml` info |
| 2026-10-15 | 1 | Áp dụng `coding-standards.md` cho mọi mã từ R2 | ARC | Skill ARC, QC R1 |

## 8. ESC mới
Không có. Các vấn đề cần INV quyết định đều đã nằm trong ESC hiện có: hạn khai báo khách NN thuộc ESC-001, channel manager thuộc ESC-009, phạm vi thuộc ESC-012. Pha B không phát sinh chi phí định kỳ mới.
