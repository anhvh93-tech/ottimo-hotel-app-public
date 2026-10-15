# Phản hồi của BA – Round 1, Bước 4

- Tác giả: BA | Ngày: 15/10/2026
- Thẻ nhận: `reviews/DOM-on-BA.md` (9 thẻ + trả lời SQ-1…SQ-4), `reviews/ARC-on-BA.md` (10), `reviews/SEC-on-BA.md` (12), QA report mục 4 dòng #12 (1) – tổng **32**.
- Căn cứ thêm: decision-log 15/10/2026 (phân xử ORC nhận phòng khuya và mã xác minh qua OTA/Zalo; quyết định SEC về thiết bị được cấp, GST1/GST2, ân hạn 24 giờ, thu hồi phiên; quyết định DOM về ngày nghiệp vụ 06:00, OOO nửa mở, nhận trước 06:00, BR-603, FOC minibar; quyết định PO về màn "Hôm nay" và đơn OTA nhập tay vào căn kín).
- File đã sửa: `product/docs/state-machines.md` (v0.2), `rbac-matrix.md` (v0.2), `business-processes.md` (v0.2), `use-cases.md` (v0.2); tạo `product/docs/rbac-matrix.json`.

## 1. Tổng hợp

| Nguồn | Blocker | Major | Minor | Suggestion | Done | Rejected | Escalated | Deferred |
|---|---|---|---|---|---|---|---|---|
| DOM | 0 | 5 | 3 | 1 | 9 | 0 | 0 | 0 |
| ARC | 0 | 2 | 7 | 1 | 10 | 0 | 0 | 0 |
| SEC | 0 | 4 | 6 | 2 | 12 | 0 | 0 | 0 |
| QA #12 (P3) | – | – | 1 | – | 1 | 0 | 0 | 0 |
| **Tổng** | **0** | **11** | **17** | **4** | **32** | **0** | **0** | **0** |

Blocker/Major còn Open: **0**.

## 2. Phản hồi từng thẻ

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-DOM-BA-01 | Done | `state-machines.md` 0.2 điểm 7 "ngày nghiệp vụ đổi lúc 06:00" (decision-log DOM) kèm ví dụ 20/10–01:30 21/10; B9 điều kiện "ngày nghiệp vụ = ngày đến"; SM-01 1.1 cột "Hôm nay"; 1.3 thêm 2 dòng khách đến sau nửa đêm; P03 thêm E2b; UC-11 tiền điều kiện; đầu `business-processes.md`, `use-cases.md` ghi định nghĩa. |
| FB-R1-DOM-BA-02 | Done | Bỏ cách "đổi ngày đến bằng B7". Thêm chuyển **B9a "Nhận trước 06:00 – thêm đêm trước"**: kiểm căn trống đêm trước (BR-906); Trực tiếp/CTV thêm 1 đêm đầu đơn; OTA tạo đơn con kênh Trực tiếp đi thẳng `in_house` (như BR-422); giá BR-411 = đêm bán (BR-904); căn không trống → không nhận, gợi ý gửi hành lý. Sửa P03 E9, UC-11 A3, rbac A11a. |
| FB-R1-DOM-BA-03 | Done | Thêm **P11 – Đóng ca / chốt ngày, đối soát tiền** (bảng bước + swimlane + ngoại lệ người trực đêm một mình, quên đóng ca, ảnh chụp chuyển khoản), **SM-17 Ca làm việc**, **UC-32**; SM-12 thêm thuộc tính đối soát `reconciliation` (`not_required/pending/reconciled/disputed`) + `reconciled_at/by`; rbac A45 (đóng ca), A46 (đối soát – MGR+, không tự đối soát giao dịch mình ghi), S32, S33. Mốc đối soát và ngưỡng "chuyển khoản chưa xác minh" tham chiếu BR-526 – chờ DOM ghi. |
| FB-R1-DOM-BA-04 | Done | Thêm **P12 – Vận hành khi mất mạng/mất điện** (phòng ngừa 06:00 bằng danh sách dự phòng không có C3, thứ tự 4G của cơ sở → giấy, không nhận đơn mới khi không xem được tồn, nhập bù với giờ thực tế + lý do, phụ thu theo giờ thực tế BR-414, kiểm trùng + đối soát kênh khi có mạng), **UC-33**, rbac A11b, S34. Phần kỹ thuật bản đọc offline để ARC/UXD; mã cửa khi mất mạng theo loại khóa để INT/SEC (ghi rõ trong P12 bước 5). |
| FB-R1-DOM-BA-05 | Done | Thêm **SM-16 Nhóm đơn** (mỗi căn vẫn là một đơn SM-01; cọc chung phân bổ theo căn; hủy một căn tính BR-309 trên phần cọc của căn đó; bill gộp/tách), mục "Đơn nhóm" trong P01, **UC-31**, rbac A23. Phạm vi R2/R3 và story: đề nghị PO (mục 3). Quy tắc đoàn (mức cọc nhóm, hạn danh sách khách) chờ DOM; chưa có thì dùng quy tắc đơn lẻ. |
| FB-R1-DOM-BA-06 | Done | P01 E10 "OTA sửa đơn" + chuyển **B7c** (kiểm trùng lại, phần không xếp được → làn chưa gán, giá snapshot theo OTA, số người khai báo cập nhật/K9, `in_house` rút ngắn → việc cho FD xác nhận, không tự áp). |
| FB-R1-DOM-BA-07 | Done | (a) SM-07 T2 sửa "đợt 1 → `earned`"; `payable` chỉ do job kỳ chi (SM-11 theo SQ-4). (b) UC-30 trỏ US-133, US-134. |
| FB-R1-DOM-BA-08 | Done | B12 theo SQ-1: FD/FDL tự khôi phục khi đủ 3 điều kiện, ngoài ra MGR+ qua SM-10; OTA đã báo kênh → MGR+; MGR được báo, hiện trong báo cáo đóng ca. Sửa rbac A10 (ghi chú 35), 5.1, UC-05 A3, nguyên tắc 0.2 điểm 3. PO sửa US-136 AC4 cho khớp. |
| FB-R1-DOM-BA-09 | Done | P07 thêm "kiểm tra an toàn": quá `welfare_check_hours` (DOM đề xuất 48 giờ, đưa vào BR-807) → việc "Liên hệ khách" cho FD → không liên lạc được thì MGR + 1 nhân viên vào kiểm, biên bản; khách dài hạn kiểm 1 lần/tháng, báo trước 24 giờ. |
| FB-R1-ARC-BA-01 | Done | Theo **phân xử ORC 15/10/2026**: người trực dùng thiết bị **của cơ sở** đã được OWN cấp (máy quầy hoặc máy tính bảng của cơ sở) mở **admin-web**; PWA không bao giờ có C3. Sửa P03 (mục Thiết bị, E2), SM-01 1.3, B9 (điều kiện thiết bị), UC-11 (tiền điều kiện, A4, X4), rbac 1 (cột thiết bị), 8.7 (bỏ "chờ SEC/ARC"). Phương án (b) của ARC (dời đối chiếu C3 sang sáng) **không áp dụng** vì ORC đã chọn (a). Ai trực tối, bằng thiết bị gì → ESC-010 (ORC đã ghi). |
| FB-R1-ARC-BA-02 | Done | rbac mục 6 tách 3 cột **GST1 / GST2 / GSTp** cho mọi dòng D01–D29; mục 3 dùng ký hiệu Đ1/Đ2/Đp cho S04, S08, S09, S16, S30, S31; quy tắc vai 5 viết lại theo SR-GST-06/07/11 (bỏ "cách làm SEC/ARC chốt"); 8.6 sửa theo M4 (ân hạn 24 giờ, chỉ bill + thanh toán, bắt buộc GST2). ARC đồng bộ `x-visible-to`. |
| FB-R1-ARC-BA-03 | Done | Thêm **K12 `void → none`** (dùng lại bản ghi, giữ UK erd 4.7; ảnh đã xóa không khôi phục); B12 hệ quả trỏ K12; mermaid SM-05 thêm cạnh. |
| FB-R1-ARC-BA-04 | Done | R10 thêm nguồn `CL` (việc dọn đang làm → `cancelled`, lý do "khóa bảo trì"); mermaid SM-03 thêm `CL --> OOO` và `CL --> CL` khi trả phòng lúc đang dọn. |
| FB-R1-ARC-BA-05 | Done | (a) B9 thêm điều kiện `conflict_state` không `open`; (b) thêm **B7a "Gán căn cho đơn xung đột"** (`conflict_state → resolved`, đóng `overbooking_incident`; dời ra ngoài = MGR+ `resolveOverbookingExternal`); (c) UC-04 tách: X1 cho Trực tiếp/CTV (chặn), A2 cho `channel_group='ota'` theo **quyết định PO** (409 + gợi ý căn trống, hết căn → làn "Chưa gán căn" – B7b); thêm UC-04b. |
| FB-R1-ARC-BA-06 | Done | UC-10 A2: một link cho đơn, người đứng tên tải giấy tờ cho cả nhóm trong cùng phiên. "Link riêng từng người" → đề nghị PO đưa backlog Could R3 (mục 3). |
| FB-R1-ARC-BA-07 | Done | D25: "Một lần khi cấp (để sao chép/gửi), không xem lại; xem lại = cấp lại (thu hồi link cũ)", dẫn SR-GST-01/04, SR-MSG-03; tách A22 (gửi qua kênh hệ thống) và A22a (cấp + sao chép, FD+). |
| FB-R1-ARC-BA-08 | Done | Thêm rbac **4.7** A110–A118 (thiết bị, 2FA người khác, PIN/2FA của mình, cấp mã xác minh khách, thu hồi link, phiên, khôi phục OWN, đổi người nhanh, bật kênh gửi mã); A21 gộp "xem mã cửa". UC-28 viết lại: đổi mật khẩu lần đầu, 2FA OWN/MGR, khóa sau sai nhiều lần, đổi người nhanh, thu hồi phiên, khôi phục OWN, `DEVICE_NOT_TRUSTED`. Mã A113/A114 đã khớp `issueGuestVerificationCode`/`revokeGuestLink` trong `rbac-matrix.json`. |
| FB-R1-ARC-BA-09 | Done | Người **thực hiện** chuyển khoản hoàn = MGR+ (A47, xem D15 đầy đủ, chỉ trên yêu cầu `approved`); FD nhập yêu cầu, thấy dạng che. Sửa SM-12, P05c bước 7, rbac 5.1, D15. Ghi `[GIẢ ĐỊNH – DOM xác nhận thực tế vận hành ở R2]`. |
| FB-R1-ARC-BA-10 | Done | Thêm `state-machines.md` **mục 18 "Mã sự kiện"** (snake_case cho B1…B18, B7a/b/c, B9a, O, R, W, K, H, T, Q, A, G, C). Chọn bảng ánh xạ một chỗ thay vì thêm cột vào 17 bảng để dễ sinh code; ARC khớp `allowedActions` theo bảng này. |
| FB-R1-SEC-BA-01 | Done | rbac 8.7 thành quyết định SEC (mọi vai nhân viên, mọi đọc/ghi C3, chỉ thiết bị được cấp, PWA không bao giờ); thêm ký hiệu **Q** vào A11, A11a, A12, A21, A70, A71, A73, A74, A77, S06, S09, D03–D07, D09, D17, D22; thêm A110 cấp/thu hồi thiết bị (OWN; MGR khi OWN ủy quyền), S26 có danh sách thiết bị. |
| FB-R1-SEC-BA-02 | Done | GST1/GST2/GSTp (xem ARC-BA-02); D22, D14, D15, D16, D17 → GST2; sau `checked_out` chỉ bill + thanh toán phát sinh, GST2, ≤ 24 giờ; thêm A113 "Cấp mã xác minh khách" (FD+, audit; SAL/CTV ✖) và A118 bật kênh gửi mã qua OTA/Zalo (OWN, **mặc định tắt** – phân xử ORC). |
| FB-R1-SEC-BA-03 | Done | Thêm **A108** "Đổi tài khoản nhận tiền / thông tin thanh toán của cơ sở" – chỉ OWN, xác nhận lại mật khẩu (+2FA), audit, thông báo OWN, hiệu lực sau bước xác nhận thứ hai; A101 ghi rõ không gồm A108; dòng "Tài khoản nhận tiền của cơ sở" ở mục 6. D15: FD nhập, MGR+ duyệt rồi mới chuyển; đổi số tài khoản sau khi duyệt → duyệt lại (SM-12, rbac 5.1, 5.3). |
| FB-R1-SEC-BA-04 | Done | D12 tách **D12a** (tag không sức khỏe, C2), **D12b** (lưu ý sức khỏe từ danh mục, C3, chỉ ghi khi khách đồng ý, HK chỉ thấy nhãn chung, chi tiết FD+ có L), **D12c** (ghi chú tự do, C2, cảnh báo không ghi sức khỏe/giấy tờ; SAL/CTV/HK K). Câu hỏi "lưu ý sức khỏe có cần đồng ý riêng" → đề nghị gộp vào ESC-001 (mục 4); BA không sửa ESC. |
| FB-R1-SEC-BA-05 | Done | Ghi chú 30 viết lại đủ 4 ý: không lý do trong luồng đang mở của chính đơn; các lần khác chọn lý do; xác nhận lại PIN nếu > 15 phút; xem C3 đơn trả phòng > 7 ngày → cảnh báo OWN. UC-29 trỏ ghi chú 30. |
| FB-R1-SEC-BA-06 | Done | A100 thêm "có hiệu lực ngay, thu hồi mọi phiên", mật khẩu tạm buộc đổi; A111 bật/đặt lại 2FA người khác (OWN); A116 khôi phục OWN bằng mã khôi phục in sẵn do INV giữ, không qua MGR (runbook OPS); rbac 8.10. |
| FB-R1-SEC-BA-07 | Done | A22 (SAL: chỉ gửi qua kênh hệ thống, không thấy link) / A22a (sao chép link chỉ FD+, audit); D25 SAL/CTV K kể cả khi render mẫu; 8.9 biến link chỉ render cho FD+. `rbac-matrix.json` báo OpenAPI `issueGuestLink` đang thừa `sales_staff`. |
| FB-R1-SEC-BA-08 | Done | Thêm 8.9 (danh sách biến cho phép cố định, biến C3 duy nhất là mã cửa chỉ trong mẫu mã cửa do hệ thống gửi ngày đến, không có biến số giấy tờ, URL chỉ tên miền OTTIMO, audit trước/sau); A106 trỏ 8.9. |
| FB-R1-SEC-BA-09 | Done | Thêm 8.8 (mỗi người một tài khoản, đổi ca đăng xuất/đổi người nhanh A117, phiên admin 30 phút/12 giờ, PWA 72 giờ/30 ngày); SM-17 gắn ca với người đăng nhập; UC-28 A1. UXD thiết kế nút đổi người nhanh. |
| FB-R1-SEC-BA-10 | Done | Thêm dòng **D29** cảnh báo/danh sách đen (C2; OWN/MGR/FDL/FD đầy đủ; vai khác K; khách K, xem qua S31); A105 mặc định không có SĐT/email/số giấy tờ, chọn rõ từng cột + audit. |
| FB-R1-SEC-BA-11 | Done | A75 đổi tên "xuất giấy tờ **của nhiều người**"; thêm A77 bản sao dữ liệu một chủ thể (OWN/MGR, L, Q, giao qua app khách GST2, không email); UC-30 cập nhật. |
| FB-R1-SEC-BA-12 | Done | Chọn phương án 1 của SEC: xác nhận cọc của SAL tạo giao dịch `reconciliation = pending`, MGR+ đối soát trong ngày (P11 bước 7, A46); ghi vào rbac 5.3. Đơn vẫn `confirmed` để giữ phòng; `disputed` → cảnh báo OWN. |
| QA #12 (P3) | Done | S23 cho CTV = M (theo dõi/rút yêu cầu của mình); ghi chú 16; `rbac-matrix.json` báo OpenAPI `listApprovalRequests`, `cancelRequest` thiếu `collaborator` (x-scope own) – ARC sửa. |

## 3. Việc nhờ vai khác (không sửa file của họ)

| Gửi | Việc | Căn cứ |
|---|---|---|
| ARC | Sửa `x-roles` theo `rbac-matrix.json` → `openapi_check.differences` (7 mục lúc sinh file): thêm `collaborator` (own) vào `listApprovalRequests`, `cancelRequest`; bỏ `sales_staff` khỏi `issueGuestLink`; thêm `front_desk` vào `setMyApprovalPin`; `manager` cho thiết bị chỉ khi làm ủy quyền. Dùng mã sự kiện `state-machines.md` mục 18 cho `allowedActions`. Thêm mô hình `reservation_group` (SM-16), `shift` (SM-17), thuộc tính đối soát của `payment` (SM-12), endpoint B9a, B7b (409 + gợi ý), B7c, A11b nhập bù, A108, A118. Endpoint đọc chưa gán mã hành động được liệt kê trong JSON (quyền theo màn hình/trường) | ARC-BA-05/08/10, SEC-BA-03/07, QA #12 |
| DOM | Ghi BR-526 (mốc đối soát chuyển khoản, ngưỡng chuyển khoản chưa xác minh `transfer_unverified_max`), tham số `welfare_check_hours` vào BR-807, quy tắc đoàn, xác nhận người thực hiện hoàn (MGR+), BR-311 theo SQ-1, BR-432/433 câu chung SQ-3 | DOM-BA-03/05/09, ARC-BA-09 |
| PO | Story cho UC-31 (đơn nhóm), UC-32 (đóng ca + đối soát, cùng US-124), UC-33 (mất mạng); sửa US-136 AC4 theo SQ-1; đưa "link check-in riêng từng người đi cùng" vào backlog Could R3; chốt phạm vi R2 của nhóm đơn và đóng ca | DOM-BA-05/03/04/08, ARC-BA-06 |
| SEC / PO | Gộp vào ESC-001 câu hỏi: "Lưu ý sức khỏe của khách (dị ứng, bệnh, mang thai, khuyết tật) có cần đồng ý riêng không?" | SEC-BA-04 |
| UXD | Nút "Đổi người nhanh"; màn Đóng ca, Đối soát chuyển khoản, Danh sách dự phòng; làn "Chưa gán căn"; hộp thoại 409 gợi ý căn | SEC-BA-09, DOM-BA-03/04, ARC-BA-05 |
| INT / SEC | Cách cấp mã cửa khi quầy mất mạng theo loại khóa (P12 bước 5) | DOM-BA-04 |
| QA | Dùng `product/docs/rbac-matrix.json` để sinh test phân quyền và đối chiếu `x-roles`; TC-NT-001/006 theo màn mặc định "Hôm nay" | QA #12, PO-on-QA |

## 4. ESC
Không tạo ESC mới. Đề xuất bổ sung 1 câu vào ESC-001 (mục 3, SEC/PO gộp). Câu "ai trực tối, bằng thiết bị gì" đã được ORC đưa vào ESC-010.

## 5. Giả định đã dùng
- `[GIẢ ĐỊNH – DOM xác nhận ở R2]` Người thực hiện chuyển khoản hoàn là MGR+.
- `[GIẢ ĐỊNH – chờ INV qua ESC-007]` Hạn mức tháng FOC minibar tự áp (tham số `foc_self_monthly_limit`, DOM đề xuất 500.000 đ/người/tháng).
- `[GIẢ ĐỊNH – chờ INV]` Kỳ chi hoa hồng trước ngày 10.
- `[GIẢ ĐỊNH – chờ INV qua ESC-010]` Tiền mặt của người trực đêm khi không có người nhận ca cất két theo quy định nội bộ.
- Tham số mới cần DOM đưa vào bảng tham số: `welfare_check_hours`, `shift_max_hours`, `offline_backfill_max_hours`, `transfer_unverified_max`, `foc_self_monthly_limit`.

## 6. Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 1 | Nhận trước 06:00 đi bằng chuyển riêng B9a "thêm đêm trước" (Trực tiếp/CTV thêm đêm đầu đơn; OTA tạo đơn con kênh Trực tiếp đi thẳng `in_house`); bỏ cách đổi ngày đến bằng B7 | BA (theo DOM) | DOM-BA-02; B7 cấm đổi ngày đơn OTA |
| 2026-10-15 | 1 | Đơn OTA chưa gán căn: thêm chuyển B7a "gán căn", B7b "OTA nhập tay vào căn kín" (409 + gợi ý / làn chưa gán), B7c "OTA sửa đơn"; nhận phòng bị chặn khi `conflict_state = open` | BA | ARC-BA-05, DOM-BA-06, quyết định PO |
| 2026-10-15 | 1 | Thêm SM-16 Nhóm đơn (mỗi căn vẫn là một đơn), SM-17 Ca làm việc, thuộc tính đối soát của giao dịch (`not_required/pending/reconciled/disputed`); chuyển khoản ghi tay và cọc do SAL xác nhận luôn `pending` cho tới khi MGR+ đối soát | BA | DOM-BA-03/05, SEC-BA-12 |
| 2026-10-15 | 1 | Thêm quy trình P11 Đóng ca/đối soát và P12 Vận hành khi mất mạng/mất điện; nhập bù dùng "giờ thực tế" + lý do, phụ thu và hạn khai báo tính theo giờ thực tế | BA | DOM-BA-03/04 |
| 2026-10-15 | 1 | Khai báo lưu trú khôi phục bằng K12 `void → none` dùng lại bản ghi (giữ UK một bản ghi/đơn) | BA | ARC-BA-03 |
| 2026-10-15 | 1 | RBAC: ký hiệu Q (chỉ thiết bị được cấp) cho mọi hành động/trường C3; cột khách tách GST1/GST2/GSTp; D12 tách tag / lưu ý sức khỏe (C3) / ghi chú tự do; đổi tài khoản nhận tiền chỉ OWN (A108); người thực hiện chuyển khoản hoàn là MGR+ | BA (theo SEC) | SEC-BA-01…04, ARC-BA-02/09 |
| 2026-10-15 | 1 | Mã sự kiện máy đọc (snake_case) cho mọi chuyển trạng thái ở `state-machines.md` mục 18; bản RBAC máy đọc `rbac-matrix.json` sinh từ `rbac-matrix.md` (tài liệu .md là nguồn sự thật) | BA | ARC-BA-10; QA đối chiếu `x-roles` |
| 2026-10-15 | 1 | Link check-in online: một link cho mỗi đơn, người đứng tên tải giấy tờ cho cả nhóm; link riêng từng người là ý tưởng R3 | BA | ARC-BA-06, ADR-006 |
