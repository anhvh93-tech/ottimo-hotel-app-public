# ARC review BA – Round 1, Bước 3

- Người review: ARC | Ngày: 15/10/2026 | Loại: review bắt buộc (plan R1 mục 5)
- Phạm vi đã đọc: `product/docs/business-processes.md` (P01–P10), `use-cases.md` (UC-01–UC-30), `state-machines.md` (SM-01–SM-15), `rbac-matrix.md` (mục 1–9); đối chiếu với `erd.md` (mục 2, 4.5–4.7, 5, 7), `api/openapi.yaml`, `architecture.md` mục 8–11, ADR-006/007/009/013, `security/security-requirements.md` (SR-DEV, SR-GST), `security/threat-model.md` mục 10.
- Câu hỏi review: (1) có hiện thực được không; (2) có nhất quán với ERD/OpenAPI của ARC không.
- Kết luận nhanh: **hiện thực được**. Bảng chuyển trạng thái có điều kiện + vai + hệ quả đủ để BE viết `{from, to, event, roles, guard}` trực tiếp (erd mục 5); tên trạng thái 15 máy khớp 100% enum ERD. Có 2 điểm phải sửa trong round vì va với quyết định bảo mật mới (thiết bị được cấp, mức xác minh khách) và vài lệch nhỏ với ERD.

---

### FB-R1-ARC-BA-01
- Mức độ: Major
- Vị trí: `business-processes.md` P03 ngoại lệ E2 ("người trực/MGR … làm B9 và khai báo **trên điện thoại**"); `state-machines.md` 1.3 dòng "Khách đến khuya" ("thực hiện B9 trên điện thoại"); `use-cases.md` UC-11 tác nhân "FD (gồm người trực đêm)"; đối chiếu `rbac-matrix.md` 8.7 và SEC SR-DEV-03/04
- Vấn đề: B9 (nhận phòng) yêu cầu khai báo ≥ `partial` có giấy tờ người đứng tên → lễ tân phải **ghi/đọc C3** (nhập số giấy tờ, xem ảnh check-in online để đối chiếu). Theo rbac 8.7 và SEC đã chốt (SR-DEV-03/04), mọi endpoint C3 chỉ chạy trên **thiết bị được cấp**, và PWA nhân viên **không bao giờ** được cấp. Vậy luồng "người trực nhận phòng khuya bằng điện thoại" như P03 E2 mô tả sẽ bị server từ chối `403 DEVICE_NOT_TRUSTED`.
- Vì sao quan trọng: đây là tình huống thật hằng tuần (khách bay đêm, BR-611). Nếu tài liệu nghiệp vụ hứa một luồng mà kiến trúc + bảo mật chặn, R2 sẽ phát hiện khi test E2E và phải chọn vội.
- Đề xuất sửa: BA cùng DOM, SEC chốt 1 phương án và sửa P03 E2, SM-01 1.3, UC-11. ARC đề xuất: (a) cơ sở có **một thiết bị trực đêm** (điện thoại/máy tính bảng của cơ sở, không phải máy cá nhân) mở **admin-web** (không phải PWA) và được OWN cấp như máy quầy (SR-DEV-02 cho phép origin admin-web; SEC bổ sung checklist cứng hóa cho thiết bị di động); (b) nếu không có thiết bị đó: khách khuya bắt buộc check-in online trước, người trực chỉ làm B9 khi giấy tờ đã có ở trạng thái `pre`, phần đối chiếu C3 dời sang sáng hôm sau trước hạn khai báo – cần DOM xác nhận có chấp nhận được về pháp lý/khai báo không. Ghi phương án được chọn vào rbac 8.7 (bỏ chữ "chờ SEC/ARC").
- Trạng thái: Open

### FB-R1-ARC-BA-02
- Mức độ: Major
- Vị trí: `rbac-matrix.md` mục 6 (cột GST chỉ ghi "Đ"), mục 1 quy tắc 5 ("cách làm SEC/ARC chốt"), mục 8.6
- Vấn đề: ADR-006 và SEC đã chốt app khách có **2 mức** (SR-GST-06/07) và **phạm vi thu hẹp sau trả phòng** (SR-GST-11, threat-model mục 10 M4). Ma trận trường của BA chưa phân biệt mức 1/mức 2: ví dụ D14 kết quả thanh toán, D16 thông tin hóa đơn, D17 hợp đồng, D22 mã cửa, D10 người đi cùng, D02 liên hệ – SEC yêu cầu mức 2; Wi-Fi, nội quy, gửi yêu cầu, tải giấy tờ (chỉ ghi) – mức 1. rbac 8.6 vẫn ghi "hết hạn khi trả phòng" (SEC đề nghị sửa: còn xem bill trong ân hạn, bắt buộc mức 2).
- Vì sao quan trọng: serializer của guest-portal (R2 Must – US-106…US-113) cần bảng trường × mức để code và để QA viết test SR-GST-06 ("JSON mức 1 không có trường cấm"). Hiện nguồn sự thật bị chia ở 3 nơi (BA, SEC, OpenAPI `x-visible-to`).
- Đề xuất sửa: Tách cột GST thành **GST-1**, **GST-2**, **GST sau trả phòng** trong mục 6 (và các dòng S04, S08, S09, S16, S30, S31 ở mục 3); sửa rbac 8.6 theo câu SEC M4; bỏ "cách làm SEC/ARC chốt" ở quy tắc 5 và dẫn SR-GST-07. ARC sẽ đồng bộ `x-visible-to` của schema khách trong OpenAPI theo bảng này ở bước 4.
- Trạng thái: Open

### FB-R1-ARC-BA-03
- Mức độ: Minor
- Vị trí: `state-machines.md` SM-01 B12 (Khôi phục no-show: "khai báo → `none` (bản ghi mới)"); SM-05 K1; đối chiếu `erd.md` 4.7 `registration.reservation_id` **UK** ("một bản ghi cho mỗi đơn gốc")
- Vấn đề: B12 tạo bản ghi khai báo mới cho cùng đơn, nhưng ERD (theo chính K1/BR-608 của BA) chỉ cho một bản ghi/đơn. Hai cách hiện thực mâu thuẫn; SM-05 cũng không có chuyển ra khỏi `void`.
- Vì sao quan trọng: BE sẽ gặp lỗi UK khi làm B12, hoặc phải phá ràng buộc "một bản ghi/đơn" mà job hạn khai báo (J5) dựa vào.
- Đề xuất sửa: Thêm chuyển **K12 `void → none`** "Khôi phục đơn (B12)" – SYS, dùng lại bản ghi, ghi `state_transition`; ảnh đã xóa theo K11 không khôi phục. Sửa B12 cột Hệ quả thành "khai báo `void` → `none` (K12)". ARC giữ UK ở ERD.
- Trạng thái: Open

### FB-R1-ARC-BA-04
- Mức độ: Minor
- Vị trí: `state-machines.md` SM-03 R10 (`VC`/`VI`/`VD` → `OOO`), R9 (ghi chú "đang `CL` khi khách trả: giữ `CL`"), sơ đồ mermaid SM-03; SM-02 O1
- Vấn đề: Bảo trì tạo khối OOO `active` ngay (O1, từ phiếu sửa) khi buồng đang `CL` (HK đang dọn sau trả phòng) là ca thật (dọn thì phát hiện hỏng). R10 không có `CL → OOO` và danh sách "chuyển bị cấm" cấm mọi chuyển vào `OOO` bằng tay → server sẽ từ chối tạo khối hoặc để buồng lệch với khối. Sơ đồ mermaid cũng thiếu nhánh R9 từ `CL`.
- Vì sao quan trọng: lệch buồng – khối OOO làm rack và đồng bộ kênh sai (BR-804, BR-806).
- Đề xuất sửa: Thêm R10 nguồn `CL` (hệ quả: việc dọn đang làm → `cancelled`, ghi lý do "khóa bảo trì"); vẽ thêm cạnh `CL --> VD`/giữ `CL` khi trả phòng và `CL --> OOO` trong mermaid.
- Trạng thái: Open

### FB-R1-ARC-BA-05
- Mức độ: Minor
- Vị trí: `state-machines.md` 1.3 (đơn OTA trùng – chỉ mô tả bằng lời), bảng B2/B9; `use-cases.md` UC-04 X1 và A2; đối chiếu `erd.md` mục 7, OpenAPI lỗi `RESERVATION_UNASSIGNED`; QA đã nêu cùng vấn đề (QA report #2, P1)
- Vấn đề: ARC đã chốt (erd 7, khớp ý BA): đơn OTA không còn căn → `confirmed` + `conflict_state='open'`, phân đoạn **chưa gán căn**, không chèn `room_occupancy`, **cấm nhận phòng** cho tới khi gán căn. Tài liệu BA chưa có: (a) điều kiện B9 "`conflict_state` không phải `open`"; (b) chuyển "Gán căn cho đơn xung đột" (dùng B7) và cách đóng `overbooking_incident`; (c) UC-04 cho lễ tân nhập tay đơn OTA ở R2 vừa có X1 "trùng → báo lỗi" vừa có A2 "trùng → vẫn tạo" – không rõ khi nào áp cái nào.
- Vì sao quan trọng: QA không viết được kỳ vọng thống nhất; FE không biết khi nào hiện làn "Chưa gán căn".
- Đề xuất sửa: Thêm vào B9 điều kiện (a); thêm dòng B7' "Gán căn cho đơn xung đột" (FD+, kiểm trùng, `conflict_state → resolved`); sửa UC-04: X1 áp cho kênh Trực tiếp/CTV; A2 áp cho kênh thuộc nhóm OTA (`channel_group='ota'`) – đúng erd 7 điểm 7. Chờ PO chốt US-018/US-139 theo QA #2.
- Trạng thái: Open

### FB-R1-ARC-BA-06
- Mức độ: Minor
- Vị trí: `use-cases.md` UC-10 A2 ("đơn nhiều người → gửi link cho từng người đi cùng")
- Vấn đề: ADR-006, ERD `guest_access_token` và SEC (SR-GST-04: cấp lại link = thu hồi mọi token cũ của **đơn**) đều thiết kế link **theo đơn**, không theo người. "Link cho từng người" chưa có mô hình: token không gắn `reservation_guest`, không giới hạn người đó chỉ tải giấy tờ của mình, và cấp link cho người thứ 2 sẽ thu hồi link của người đứng tên.
- Vì sao quan trọng: hoặc phải đổi ERD/OpenAPI + quy tắc SEC, hoặc use case hứa điều không làm được ở R2.
- Đề xuất sửa: R2: một link cho đơn, người đứng tên tải giấy tờ cho cả nhóm (mỗi người một mục trong cùng phiên); "link riêng cho từng người" chuyển thành ý tưởng R3 (PO đưa backlog Could) – khi đó ARC thêm `guest_access_token.reservation_guest_id` và SEC xem lại SR-GST-04.
- Trạng thái: Open

### FB-R1-ARC-BA-07
- Mức độ: Minor
- Vị trí: `rbac-matrix.md` mục 6 dòng D25 (OWN/MGR/FD: "K (chỉ tạo/thu hồi)") và mục 4.1 A22 (FD gửi link app khách)
- Vấn đề: R2 gửi tin cho khách bằng **mẫu tin sao chép** (Zalo `manual_copy`, PRD M13). Muốn sao chép thì FD phải thấy link đầy đủ (chứa token) ít nhất một lần. "K" hiểu theo nghĩa đen (không trả về từ API) thì A22 không làm được.
- Vì sao quan trọng: mâu thuẫn làm BE/FE không biết nên trả token hay không; SEC SR-GST-01 đã định nghĩa "token rõ chỉ trả **một lần** khi cấp".
- Đề xuất sửa: Sửa D25 thành "Một lần khi cấp (để sao chép/gửi), không xem lại; xem lại = cấp lại (thu hồi link cũ)". Dẫn SR-GST-01, SR-GST-04, SR-MSG-03.
- Trạng thái: Open

### FB-R1-ARC-BA-08
- Mức độ: Minor
- Vị trí: `rbac-matrix.md` mục 3 (S01, S26), mục 4.6; `use-cases.md` UC-28
- Vấn đề: Chưa phản ánh các hành động bảo mật SEC đã chốt và UXD đã vẽ: cấp/thu hồi **thiết bị được cấp** (OWN; MGR nếu OWN bật – SR-DEV-01), bật/đặt lại **2FA TOTP** (bắt buộc OWN/MGR từ R3 – SR-AUTH-06), đặt **PIN duyệt** (SR-AUTH-09), **cấp mã xác minh cho khách** tại quầy (FD+ – SR-GST-07b), **thu hồi link khách** (SR-GST-04), **xem mã cửa** D22 (có ở mục 6 nhưng không có mã hành động), xem/thu hồi phiên (SR-SES-07). UC-28 chưa có bước 2FA, khóa tài khoản, đổi mật khẩu lần đầu.
- Vì sao quan trọng: SR-AZ-01/09 sinh test phân quyền từ `x-roles` của OpenAPI; ARC cần mã hành động A-xx để gắn `x-roles` cho các endpoint mới (thẻ UXD/SEC gửi ARC). Thiếu mã → không truy vết được.
- Đề xuất sửa: Thêm nhóm 4.7 "Bảo mật tài khoản & thiết bị" với mã A110–A117 cho các hành động trên (vai theo SEC); cập nhật UC-28 luồng chính + A/X (sai 5 lần → khóa, mật khẩu tạm buộc đổi, 2FA).
- Trạng thái: Open

### FB-R1-ARC-BA-09
- Mức độ: Minor
- Vị trí: `rbac-matrix.md` mục 6 D15 (Tài khoản ngân hàng nhận hoàn: OWN/MGR "Đầy L", FDL/FD "Che"); `state-machines.md` SM-12, SM-10 (hoàn tiền); `business-processes.md` P05c bước 7 ("FD/MGR … hoàn")
- Vấn đề: Hoàn tiền chuyển khoản là thao tác tay ngoài hệ thống; người thực hiện cần số tài khoản đầy đủ. Tài liệu cho FD thực hiện hoàn (P05c bước 7) nhưng D15 cho FD chỉ thấy bản che.
- Vì sao quan trọng: hoặc FD không làm được việc, hoặc BE phải nới quyền ngoài ma trận.
- Đề xuất sửa: Chốt người **thực hiện** chuyển khoản hoàn là MGR+ (đã duyệt SM-10), FD chỉ ghi nhận sau khi MGR báo đã chuyển; hoặc cho FD "Đầy L" chỉ trên yêu cầu hoàn đã `approved`. Cần DOM xác nhận thực tế vận hành.
- Trạng thái: Open

### FB-R1-ARC-BA-10
- Mức độ: Suggestion
- Vị trí: `state-machines.md` các bảng chuyển (cột "Sự kiện" bằng tiếng Việt); `erd.md` mục 5 điểm 2 (bảng chuyển trong `packages/contracts/src/state-machines/*.ts` "sinh từ state-machines.md")
- Vấn đề: Sự kiện đang là câu tiếng Việt ("Xác nhận cọc / ký quỹ"), không có mã máy đọc. OpenAPI đặt tên hành động trong `allowedActions` theo tiếng Anh; QA trích mã B1…; ba nơi khó đối chiếu tự động.
- Vì sao quan trọng: ARC muốn sinh bảng chuyển trạng thái từ tài liệu BA để tránh lệch (một nguồn sự thật).
- Đề xuất sửa: Thêm cột "Mã sự kiện" (snake_case tiếng Anh, ví dụ B4 `confirm_deposit`, B9 `check_in`, B11 `mark_no_show`) cho SM-01…SM-15; ARC dùng đúng mã này trong `allowedActions` của OpenAPI ở bước 4 và gửi danh sách hiện có để BA khớp.
- Trạng thái: Open

---

## Điểm làm tốt nên giữ
1. Máy trạng thái viết ở mức "code được": mỗi chuyển có mã (B1…, K1…, R1…), điều kiện server kiểm, vai, hệ quả (gồm `sync` kênh, tác động khai báo, hoa hồng); có danh sách **chuyển bị cấm** cho buồng và nguyên tắc chung 0.2 (chỉ server chuyển, trạng thái kết thúc không mở lại trừ ngoại lệ có tên, kiểm chiếm phòng trong cùng giao dịch) – khớp ADR-009 và erd mục 5 mà không cần dịch.
2. Ma trận trường dữ liệu dùng ký hiệu "K = không trả về từ API, không chỉ ẩn trên giao diện" và tách phạm vi M/T/Đ bằng cột dữ liệu cụ thể (`created_by`, `closer_user_id`, `assigned_user_id`) – ARC dùng nguyên để thiết kế serializer + RLS; giải quyết dứt điểm mâu thuẫn BL mục 2 / 8.2 #27 (bảng M1–M8).
3. Biểu diễn xung đột OTA bằng cờ thay vì thêm trạng thái, OOO tách thành máy riêng (SM-02), no-show không tự động – ba quyết định giúp ràng buộc chống đặt trùng ở DB giữ được tuyệt đối.
