# UXR – Phản hồi review Round 1 (Bước 4)

- Tác giả: UXR · Ngày: 15/10/2026
- Thẻ nhận: UXD-on-UXR (14), PO-on-UXR (6), DOM-on-UXR (7) = **27 thẻ** (8 Major, 13 Minor, 6 Suggestion; 0 Blocker).
- Kết quả: **25 Done · 2 Deferred · 0 Rejected · 0 Escalated**. Blocker/Major còn Open: **0**.
- File đã sửa: `product/docs/research/personas.md` (v0.2), `journeys.md` (v0.2), `heuristic-review-r0.md` (v0.2), `02-escalations/ESC-003.md` (viết lại); file mới: `product/docs/research/real-user-check-guide.md`.

## UXD → UXR

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R1-UXD-UXR-01 | Major | Done | ESC-003 viết lại: một danh sách duy nhất **7 điều Cao** (H-01, 02, 05, 08, 12, 20, 21) diễn đạt bằng câu đời thường, mã để trong ngoặc; câu phụ ghi rõ "hỏi kèm, không bắt buộc". H-10 ghi rõ chuyển INT; H-04 → ESC-010; H-06, H-19 nêu lý do không hỏi. `personas.md` mục 9 có cột "Đường kiểm chứng" khớp ESC |
| FB-R1-UXD-UXR-02 | Major | Done | ESC-003 tách thời gian theo người, tổng **chủ động ~1–1,5 giờ + tối đa 3 ngày chờ** khách; H-03 đổi thành lễ tân **ước lượng** (không lục chat – tránh dữ liệu cá nhân), DATA đo ở R2; H-04 chuyển ESC-010 + DATA; H-10 rút về INT; phiếu 1 trang `real-user-check-guide.md` tạo ngay ở bước 4; ghi rõ nơi gửi kết quả (ORC → `04-investor-feedback/`) |
| FB-R1-UXD-UXR-03 | Major | Done | H-05 thành kịch bản **3 nhiệm vụ** (tìm phòng dọn trước, báo dọn xong 202, báo hỏng kèm ảnh) trên **chính điện thoại nhân viên** với `06-housekeeping-mobile.html`; ghi Tự làm / Có hỗ trợ / Không làm được + thời gian; câu mở đầu "thử phần mềm, không phải kiểm tra anh/chị"; luật quyết định ≥2/3 · 1/3 · 0/3 (thử 2 người lấy kết quả thấp hơn). Nhờ UXD gửi link mở được trên điện thoại (bản tĩnh) kèm round-summary |
| FB-R1-UXD-UXR-04 | Major | Done | Toàn bộ "23:00" thay bằng hạn theo BR-602 (VN 23:00) / BR-603 (NN giờ đến + 12 giờ); mốc nhắc J3 đổi thành **theo thời gian còn lại** (tham số); H-04 hỏi cả khách NN đến buổi sáng. Sửa ở personas P1, P2; journeys đầu file, J1-4, J3 07:30/14:00/15:00, O-01; heuristic HR-09, HR-21, mục 5 |
| FB-R1-UXD-UXR-05 | Major | Done | HR-20 **nâng Blocker** (chuyển lên mục Blocker, thêm AC đề xuất cho PO); HR-13 tách HR-13a (Major, buồng phòng) / HR-13b (Minor, chủ đầu tư/bill); HR-02 ghi lý do Major; HR-12 "Major nếu H-01 đúng, Minor nếu sai". Tổng mới 26 = 5B/11M/8m/2S. Dòng decision-log đề xuất ở cuối file |
| FB-R1-UXD-UXR-06 | Minor | Done | ESC-003: H-19 → "xem ESC-007", H-04 → "xem ESC-010"; H-08 thành 1 câu có/không xác nhận RBAC; H-06 đóng ("đã xử lý bằng thiết kế, kiểm lại khi test L6") |
| FB-R1-UXD-UXR-07 | Minor | Done | Mục 9 có cột "Tiêu chí / luật quyết định (đúng → / sai →)" cho mọi giả thuyết Cao; H-13 đổi "≥ 2/3"; H-12 có luật quyết định theo kênh trả; H-03 hạ TB, đo bằng ước lượng + DATA R2 |
| FB-R1-UXD-UXR-08 | Minor | Done | J4 "dọn theo yêu cầu 100k/lần (brief) – gói định kỳ chờ ESC-005"; express check-out (J1-6, O-10, P7) thêm bước xác nhận **trả 2 thẻ** + phí BR-511; P6 bỏ USDT, ghi "OTTIMO không nhận tiền mã hóa" |
| FB-R1-UXD-UXR-09 | Minor | Done | Thêm `journeys.md` mục 4b "Ngoại lệ thường gặp" (10 dòng: chuyển khoản sai tiền/thiếu nội dung, giữ chỗ hết hạn khi đang chuyển tiền, tải ảnh lỗi, OTA chưa check-in online, kẹt ngoài cửa, trả thiếu thẻ, ký quỹ tiền mặt USD, khai báo dở, "Dọn xong" offline xung đột, báo hỏng offline) |
| FB-R1-UXD-UXR-10 | Minor | Deferred | Dời Round 2: tương phản token tối, trạng thái tải/rỗng/lỗi/mất mạng và luồng check-in online app khách sẽ đánh giá trên wireframe/bản build mới trong `usability-report-r2.md` (prototype R0 không còn là đối tượng thiết kế). Đã ghi rõ phần chưa bao phủ ở `heuristic-review-r0.md` mục 1 |
| FB-R1-UXD-UXR-11 | Minor | Done | Thêm `personas.md` mục 0.3 "Bề mặt → persona chính/phụ"; P2 và H-02 thêm giả định laptop quầy tối thiểu 1366×768 |
| FB-R1-UXD-UXR-12 | Suggestion | Done | P3 thêm "Biến thể B – nhân viên trẻ 25–35" (giữ nút lớn/offline, hạ ưu tiên giọng nói/hướng dẫn dài); phiếu H-05 ghi tuổi + số năm dùng smartphone |
| FB-R1-UXD-UXR-13 | Suggestion | Deferred | Dời Round 2: thêm J5 "CTV báo giá tại chỗ xem nhà" và J6 "Chủ đầu tư 5 phút đầu ngày" làm kịch bản test L5, L8 trong test kịch bản R2 |
| FB-R1-UXD-UXR-14 | Suggestion | Done | ESC-003 thêm câu liên hệ ESC-012 (dời app buồng phòng sang R3 thì H-05 kiểm trên bản dùng thử ở R2) |

## PO → UXR

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R1-PO-UXR-01 | Major | Done | J3 10:30: "Giờ nhận mặc định = giờ chuẩn 14:00, phụ thu 0 (BR-414)"; lễ tân bật "Khách nhận sớm" → nhập giờ → thấy phí BR-411 → tick "đã báo khách"; miễn phí → FOC theo BR-432/433. Đã rà toàn bộ cột Cơ hội, không còn câu trái HR-04 |
| FB-R1-PO-UXR-02 | Major | Done | Cùng nội dung FB-R1-UXD-UXR-04; thước đo P2 đổi "100% khai báo **đúng hạn** (S2)"; O-01 tham chiếu BR-602/603 |
| FB-R1-PO-UXR-03 | Minor | Done | Thêm `personas.md` mục 0.2 ánh xạ persona ↔ U1–U5 ↔ mã vai RBAC ↔ người trong BL; P1 thêm biến thể **Quản lý** (`manager`); P3 thêm biến thể A tách vai (2 buồng phòng + 1 kỹ thuật); P2 ghi phần sale thuộc `sales_staff`; thêm **H-21** (buồng phòng và kỹ thuật khác người) mức Cao, đưa vào ESC-003 |
| FB-R1-PO-UXR-04 | Minor | Done | P7 thước đo theo PRD S5 ≥ 40%, 60% chỉ là giả thuyết H-11; P6 và J2-7 tham chiếu BR-605 (tham số), không ghi số cứng |
| FB-R1-PO-UXR-05 | Minor | Done | `journeys.md` mục 5 thêm cột "Story / Round" (O-01…O-12 đối chiếu backlog); thêm dòng liệt kê ý **ngoài MVP** (giọng nói, mã giới thiệu, màn kết ca đầy đủ); H-12 bỏ USDT |
| FB-R1-PO-UXR-06 | Suggestion | Done | Phiếu thử 15–20 phút với wireframe L6 (3 việc + tiêu chí) là phần C của `real-user-check-guide.md`; ESC-003 ghi "nếu ít thời gian, làm phần C trước" |

## DOM → UXR

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R1-DOM-UXR-01 | Major | Done | Như FB-R1-PO-UXR-01; FOC gửi người duyệt theo hạn mức BR-433, không mặc định gửi P1 |
| FB-R1-DOM-UXR-02 | Minor | Done | Như FB-R1-UXD-UXR-04: hạn theo BR-602/BR-603 (tính từ giờ đến), mốc nhắc là tham số theo thời gian còn lại. Ví dụ trong tài liệu chỉ dùng trường hợp đúng với mọi cách diễn đạt BR-603 (đến 08:00 → hạn 20:00) và luôn dẫn "cách tính chi tiết lấy từ BR-603" để không lệch khi DOM sửa câu chữ |
| FB-R1-DOM-UXR-03 | Minor | Done | H-20 nâng **Cao**, câu hỏi đổi thành "bàn giao những gì, giấy hay Zalo, có đếm tiền mặt, đã từng lệch tiền chưa", đưa vào ESC-003 (điều 6) và phiếu B2; luật quyết định: có bàn giao tiền mặt/từng lệch → đề nghị PO nâng US-124 lên Must R3 |
| FB-R1-DOM-UXR-04 | Minor | Done | P6: bỏ USDT, ghi chú "OTTIMO không nhận tiền mã hóa (pháp lý)", thẻ ngân hàng Nga gần như không dùng được ở nước ngoài từ 2022; H-12 viết lại: chỉ cần biết kênh trả thực tế (tiền mặt USD/VND, chuyển khoản qua người thân tại VN, ngân hàng/ví nước thứ ba) |
| FB-R1-DOM-UXR-05 | Minor | Done | J2-7 và P6 tham chiếu BR-605 và ghi DOM đang sửa thành 30 ngày (dài hạn) / 14 ngày (ngắn ngày) |
| FB-R1-DOM-UXR-06 | Suggestion | Done | Thêm H-22 (khách đến 04:00–06:00) và H-23 (kẹt ngoài cửa), hỏi kèm trong phiếu B5, B6; J1-4 thêm điểm đau "kẹt ngoài cửa" + cơ hội "số khẩn cấp trong link + mã dự phòng do quản lý cấp từ xa"; thêm vào mục Ngoại lệ |
| FB-R1-DOM-UXR-07 | Suggestion | Done | P3 thêm biến thể tách vai; J4 thêm dòng 15:00 "giao lại căn sau sửa" (phiếu sửa xong → việc "Dọn sau sửa chữa" + giờ khách đến tiếp theo) |

## Ghi chú thêm

- Thẻ UXR gửi UXD **FB-R1-UXR-UXD-16** (từ "check-in" với khách lớn tuổi): UXR đưa vào giả thuyết **H-24** và câu không bắt buộc B7 trong phiếu (lễ tân hỏi 3 khách Việt trên 50 tuổi trong 3 ngày).
- Cần UXD: gửi link bản tĩnh `06-housekeeping-mobile.html` mở được trên điện thoại để ORC đính kèm round-summary (phiếu phần C). Nếu không có link, INV có thể mở trực tiếp tệp HTML trên điện thoại.

## Dòng decision-log đề xuất

(UXR không sửa `decision-log.md`; ORC/PO chép vào nếu đồng ý.)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 1 | Cập nhật mức nghiêm trọng heuristic prototype R0 (v0.2): **HR-20** (khóa phòng từ phiếu sửa không chặn bán) **nâng Blocker** → danh sách Blocker = HR-01, HR-04, HR-06, HR-07, HR-20; HR-13 tách HR-13a (Major, buồng phòng) / HR-13b (Minor, chủ đầu tư/bill); HR-12 Major nếu H-01 đúng, Minor nếu sai. Tổng 26 phát hiện = 5 Blocker / 11 Major / 8 Minor / 2 Suggestion | UXR | Thuộc quyền UXR (mức nghiêm trọng vấn đề khả dụng); FB-R1-UXD-UXR-05; bán nhầm phòng hỏng = sai nghiệp vụ nghiêm trọng |
| 2026-10-15 | 1 | Tài liệu nghiên cứu (persona, hành trình) dùng hạn khai báo lưu trú **theo từng khách** – khách VN theo BR-602 (23:00), khách NN theo BR-603 (giờ đến + 12 giờ); nhắc hạn theo **thời gian còn lại**, mốc là tham số, không dùng giờ cố định | UXR | FB-R1-UXD-UXR-04, PO-UXR-02, DOM-UXR-02; số quy tắc lấy từ BR |
| 2026-10-15 | 1 | Luật quyết định cho H-05 (buồng phòng tự dùng app), áp khi có kết quả phiếu ESC-003: ≥ 2/3 nhiệm vụ tự làm → giữ L6; 1/3 → L6 rút gọn (Việc của tôi + Dọn xong), lễ tân nhập minibar/sự cố hộ; 0/3 hoặc từ chối → lễ tân cập nhật hộ + bảng in (PO điều chỉnh EP07) | UXR | Thuộc quyền UXR (kết luận nghiên cứu); FB-R1-UXD-UXR-03 |
| 2026-10-15 | 1 | Giả thuyết người dùng sau review: H-20 (bàn giao ca) nâng Cao; H-03 hạ TB; H-06 đóng bằng thiết kế; thêm H-21 (buồng phòng và kỹ thuật khác người – Cao), H-22, H-23, H-24 (TB). ESC-003 chỉ hỏi 7 giả thuyết Cao, H-04 → ESC-010, H-10 → INT, H-19 → ESC-007 | UXR | FB-R1-UXD-UXR-01/06/07, PO-UXR-03, DOM-UXR-03/06 |
