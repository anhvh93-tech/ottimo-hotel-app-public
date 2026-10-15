# Product Backlog – OTTIMO Desk

- Chủ sở hữu: PO | Cập nhật: 15/10/2026 – Round 1, bước 2, **đợt 3** (hoàn thiện AC theo BR/UC/SM/RBAC)
- Nguồn: `product/docs/PRD.md` (phân hệ M0–M15), `product/docs/round-0-baseline.md` (**BL**), `00-brief/investor-brief.md` (**Brief**), `business-rules.md` (**BR-xxx** – nguồn sự thật cho mọi con số), `use-cases.md` (**UC-xx**), `state-machines.md` (**SM-xx**, mã chuyển), `rbac-matrix.md` (mã vai, hành động **A-xx**, trường **Dxx**), `research/heuristic-review-r0.md` (**HR-xx**), `02-escalations/` (**ESC-xxx**).
- Trạng thái chung: chờ review BA, DOM (bắt buộc), ARC, UXD (khuyến nghị). Đợt 3: mọi con số quy tắc trong tiêu chí nghiệm thu (AC) đã thay bằng **mã BR-xxx**; tên trạng thái theo `state-machines.md`; vai theo mã vai của `rbac-matrix.md`; thêm 7 story (US-133…US-139), nâng US-024 lên Must R2. Chính sách chưa chốt ghi "chờ ESC-xxx".

## 1. Quy ước

| Cột | Ý nghĩa |
|---|---|
| ID | `US-xxx`, không tái sử dụng khi xóa |
| Vai | Nhóm PRD U1–U5 kèm **mã vai** của `rbac-matrix.md` mục 1: U1 `owner` (chủ đầu tư), `manager` (quản lý) · U2 `front_desk_lead` (lễ tân trưởng), `front_desk` (lễ tân, gồm người trực đêm) · U3 `housekeeping` (buồng phòng), `maintenance` (bảo trì/kỹ thuật) · U4 `sales_staff` (sale nội bộ), `collaborator` (CTV/môi giới) · U5 `guest` (khách, qua link của đơn). Vai trong câu story là **người hưởng lợi chính**; quyền thao tác chi tiết theo `rbac-matrix.md` (một tài khoản nhiều vai = hợp quyền). Ký hiệu nhóm: FD+ = front_desk, front_desk_lead, manager, owner; FDL+ = front_desk_lead, manager, owner; MGR+ = manager, owner |
| MoSCoW | **Must** = bắt buộc cho bản RC cuối R3 · **Should** = nên có, dời được nếu thiếu thời gian · **Could** = làm nếu dư · **Won't** = không làm trong MVP (xem PRD 5.3) |
| Round | Round dự kiến giao (R2, R3, R4+ = sau MVP) |
| Nguồn | Mục BL / Brief / decision-log làm căn cứ; "Mới" = không có trong BL, đội đề xuất |
| Trạng thái | Mới · Sẵn sàng (đủ AC, đã review) · Đang làm · Xong · Dời |

Thứ tự ưu tiên trong R2 nếu thiếu thời gian (PRD D6): EP00 → EP02/EP11 (đơn, chống trùng, giữ chỗ) → EP03–EP05 → EP06 → EP07/EP08 → EP14 → phần còn lại.

## 2. Danh sách epic

| Epic | Tên | Phân hệ PRD | Số story | Must R2 |
|---|---|---|--:|--:|
| EP00 | Nền tảng: đăng nhập, phân quyền, cấu hình, nhật ký, phê duyệt, xác nhận hành động | M0 | 10 | 8 |
| EP01 | Tổng quan (dashboard) | M1 | 6 | 3 |
| EP02 | Room rack & đặt phòng | M2 | 10 | 10 |
| EP03 | Nhận phòng | M2 | 3 | 3 |
| EP04 | Lưu trú: gia hạn, trả muộn, trả sớm, nhắc trả phòng, phát sinh | M2, M6 | 8 | 5 |
| EP05 | Trả phòng & bill | M2, M6, M12 | 7 | 5 |
| EP06 | Giấy tờ, khai báo lưu trú & quyền dữ liệu của khách | M3 | 12 | 9 |
| EP07 | Buồng phòng | M4 | 9 | 6 |
| EP08 | Bảo trì & điện nước | M5 | 5 | 2 |
| EP09 | Kho F&B / minibar | M6 | 5 | 1 |
| EP10 | Khách hàng (CRM) | M7 | 9 | 3 |
| EP11 | Sale, báo giá, giữ chỗ, hợp đồng dài hạn | M8 | 14 | 8 |
| EP12 | Kênh OTA & channel manager | M9 | 7 | 0 |
| EP13 | Báo cáo | M10 | 6 | 0 |
| EP14 | App khách | M11 | 14 | 7 |
| EP15 | Thanh toán & hóa đơn điện tử | M12 | 6 | 2 |
| EP16 | Giao tiếp với khách (mẫu tin đa ngôn ngữ) | M13 | 3 | 1 |
| EP17 | Khóa cửa & thẻ phòng | M14 | 3 | 1 |
| EP18 | Đặt phòng trực tiếp trên web | M15 | 2 | 0 |
| | **Tổng** | | **139** | **74** |

## 3. User story

### EP00 – Nền tảng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-001 | Là **nhân viên OTTIMO** (mọi vai nội bộ) (U1–U4), tôi muốn đăng nhập bằng tài khoản riêng, để mọi thao tác được ghi đúng người làm | Must | R2 | BL 2, BL 7 | Mới |
| US-002 | Là **chủ đầu tư** (`owner`), tôi muốn gán vai (`owner`, `manager`, `front_desk_lead`, `front_desk`, `housekeeping`, `maintenance`, `sales_staff`, `collaborator`) cho từng tài khoản, để mỗi người chỉ thấy và làm đúng phần việc của mình | Must | R2 | BL 2, BL 8.2 #27, decision-log 15/10 (4 nhóm), rbac mục 1 | Mới |
| US-003 | Là **chủ đầu tư** (`owner`), tôi muốn dữ liệu nhạy cảm (giấy tờ tùy thân, giá vốn, P&L, hoa hồng người khác) bị ẩn với vai không được phép ở mọi màn hình, để tránh lộ thông tin và thất thoát | Must | R2 | BL 2 (mâu thuẫn quyền), BL 8.2 #27, BL 5.13 | Mới |
| US-004 | Là **chủ đầu tư** (`owner`), tôi muốn quản lý danh mục căn (số, tên, nhóm, giá niêm yết đêm/tháng, sức chứa, trạng thái bán), để sơ đồ phòng và giá luôn đúng thực tế | Must | R2 | BL 4.1, BL 9 #1, #5 | Mới |
| US-005 | Là **chủ đầu tư** (`owner`), tôi muốn tự chỉnh bảng tham số quy tắc (`business-rules.md` mục 13: giảm giá, phụ thu, cọc, hạn giữ chỗ, giờ chuẩn, đơn giá điện nước, phí phạt, hoa hồng), để đổi chính sách mà không cần lập trình viên | Must | R2 | BL 5 (toàn bộ), BL 4.17, decision-log 15/10 (số quy tắc cấu hình được) | Mới |
| US-006 | Là **chủ đầu tư** (`owner`), tôi muốn xem nhật ký mọi thao tác liên quan tới tiền (folio, giảm giá, FOC, hủy, thu tiền) với người làm, thời điểm, giá trị cũ/mới, để kiểm soát thất thoát | Must | R2 | BL 5.7, BL 8.2 #24 | Mới |
| US-007 | Là **quản lý / lễ tân trưởng** (`manager`, `front_desk_lead`), tôi muốn tự xác nhận các khoản FOC/giảm giá cần duyệt bằng chính tài khoản của mình (không để người thao tác chọn tên người duyệt), để việc miễn phí có người chịu trách nhiệm thật | Must | R2 | BL 5.7, BL 8.2 #24, BL 9 #8 | Mới |
| US-008 | Là **chủ đầu tư** (`owner`), tôi muốn tự thêm, khóa tài khoản và đặt lại mật khẩu cho nhân viên, để không phụ thuộc đội kỹ thuật khi nhân sự thay đổi | Should | R3 | Mới | Mới |
| US-009 | Là **chủ đầu tư** (`owner`), tôi muốn chọn cơ sở khi đăng nhập, để sau này quản lý thêm cơ sở thứ hai trên cùng app | Could | R4+ | BL 9 #24, decision-log (đa cơ sở thiết kế sẵn) | Mới |
| US-135 | Là **nhân viên OTTIMO** (mọi vai nội bộ), tôi muốn mọi hành động không đảo ngược (hủy đơn/giữ chỗ, no-show, hoàn tất trả phòng, đóng/mở bán kênh, gộp hồ sơ, đóng phiếu sửa mở khóa phòng, xóa ảnh giấy tờ) đều có hộp xác nhận nêu rõ hậu quả, để không mất đơn hay sai tiền vì bấm nhầm | Must | R2 | HR-06 (Blocker), BL 8.2 #23 | Mới |

### EP01 – Tổng quan
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-010 | Là **chủ đầu tư / lễ tân** (`owner`, `front_desk`), tôi muốn thấy KPI đêm nay (công suất, số căn đang ở, khách đến, khách đi, căn khóa) tính từ dữ liệu thật, để nắm tình hình trong 5 giây | Must | R2 | BL 3.2, BL 8.2 #8, #28, #29 | Mới |
| US-011 | Là **lễ tân** (`front_desk`), tôi muốn danh sách khách đến/đi hôm nay có nút Nhận phòng/Trả phòng và không lẫn đơn hủy hoặc giữ chỗ, để xử lý đúng việc trong ngày | Must | R2 | BL 3.2, BL 8.2 #7 | Mới |
| US-012 | Là **chủ đầu tư / lễ tân** (`owner`, `front_desk`), tôi muốn mục "Cần chú ý" tự sinh từ dữ liệu (chưa khai báo lưu trú, thị thực sắp hết, kỳ thu dài hạn sắp tới, hợp đồng sắp hết hạn, giữ chỗ sắp hết hạn, căn khóa, phiếu sửa mức Cao), để không bỏ sót việc quan trọng | Must | R2 | BL 3.2, BL 8.2 #28, BL 5.20 | Mới |
| US-013 | Là **lễ tân** (`front_desk`), tôi muốn thấy số việc buồng phòng chưa xong, phiếu sửa đang mở, yêu cầu khách chưa xử lý và bấm vào để mở đúng màn hình, để điều phối nhanh | Should | R2 | BL 3.2 | Mới |
| US-014 | Là **chủ đầu tư** (`owner`), tôi muốn xem ADR, RevPAR tháng và biểu đồ công suất 30 ngày qua + 14 ngày tới so với mục tiêu công suất G1 (PRD 3.1), để biết cần đẩy bán hay không | Should | R3 | BL 3.2, Brief 1 | Mới |
| US-015 | Là **chủ đầu tư** (`owner`), tôi muốn được cảnh báo khi công suất dự kiến hoặc số căn dài hạn lệch mục tiêu, để hành động sớm | Could | R4+ | BL 9 #25 | Mới |

### EP02 – Room rack & đặt phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-016 | Là **lễ tân** (`front_desk`), tôi muốn xem sơ đồ phòng 10 căn × 14 ngày với thanh đơn phân biệt loại (đang ở, đã xác nhận, dài hạn, giữ chỗ, đã trả, khóa) bằng cả màu và chữ, để thấy ngay phòng trống | Must | R2 | BL 3.3a, BL 8.3 | Mới |
| US-017 | Là **lễ tân** (`front_desk`), tôi muốn tạo đơn ngắn ngày (căn, kênh, ngày đến, số đêm, số khách, giá/đêm, mã OTA, đã thu qua OTA hay chưa), để mọi đơn – kể cả đơn OTA – nằm ở một nơi | Must | R2 | BL 3.5, BL 8.2 #26 | Mới |
| US-018 | Là **lễ tân** (`front_desk`), tôi muốn hệ thống chặn đặt trùng căn – đêm ngay cả khi hai người lưu cùng lúc, để không bao giờ phải đuổi khách vì trùng phòng | Must | R2 | BL 5.4, BL 8.2 #30 | Mới |
| US-019 | Là **lễ tân** (`front_desk`), tôi muốn căn đang khóa (OOO) bị coi là không bán được trên sơ đồ, khi kiểm trùng và khi tính phòng trống, để không nhận khách vào phòng hỏng | Must | R2 | BL 8.2 #5 | Mới |
| US-020 | Là **lễ tân** (`front_desk`), tôi muốn mở chi tiết đơn thấy tiến trình, thông tin khách, folio và chỉ những nút hành động hợp lệ với trạng thái đơn và vai của tôi, để không thao tác nhầm | Must | R2 | BL 3.4, BL 8.2 #27 | Mới |
| US-021 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn hủy đơn hoặc hủy giữ chỗ với lý do bắt buộc (BR-308), có hộp xác nhận nêu hậu quả và phí hủy/hoàn theo BR-309/BR-310, để có dấu vết và mở lại phòng ngay | Must | R2 | BL 3.18, BL 8.2 #23, BL 9 #6, HR-06, UC-05, ESC-006 | Mới |
| US-022 | Là **lễ tân** (`front_desk`), tôi muốn thêm người đi cùng (người lớn có hồ sơ, trẻ em có năm sinh) vào đơn và được cảnh báo khi số người khai ít hơn số khách, để khai báo lưu trú đủ người | Must | R2 | BL 3.4, BL 3.17 | Mới |
| US-023 | Là **lễ tân** (`front_desk`), tôi muốn mỗi mã đơn, mã khách, mã phiếu, số bill là duy nhất và không đổi, để tra cứu và đối soát không nhầm | Must | R2 | BL 8.2 #18 | Mới |
| US-024 | Là **lễ tân** (`front_desk`), tôi muốn đổi căn hoặc đổi ngày của đơn chưa nhận phòng và đổi phòng cho khách đang ở (có kiểm trùng, lý do bắt buộc, giá theo quy tắc), để xử lý khi khách đổi kế hoạch hoặc phòng có sự cố | Must | R2 | Mới (BL không có); BR-424, BR-906; SM-01 B7, B14; UC-16 – **nâng từ Should** vì US-061/BR-809 cần đổi phòng khi có sự cố | Mới |
| US-136 | Là **lễ tân** (`front_desk`), tôi muốn được nhắc gọi khách chưa đến và tự đánh dấu "không đến" (no-show) sau mốc giờ quy định – hệ thống không tự đánh dấu – và quản lý khôi phục được khi khách đến muộn, để mở bán lại đêm trống mà không đuổi nhầm khách đến khuya | Must | R2 | BR-311; SM-01 B11, B12; UC-05 | Mới |

### EP03 – Nhận phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-025 | Là **lễ tân** (`front_desk`), tôi muốn nhận phòng cho khách (ghi giờ thực tế, cảnh báo nếu buồng chưa sẵn sàng), để đơn chuyển "đang ở" và buồng chuyển "có khách" đúng lúc | Must | R2 | BL 3.6, BL 5.15 | Mới |
| US-026 | Là **lễ tân** (`front_desk`), tôi muốn phụ thu nhận sớm tự tính theo bậc giờ và không tự phát sinh phí khi tôi chưa nhập giờ, để thu đúng mà không làm khách khó chịu | Must | R2 | BL 5.6, BL 8.2 #2 | Mới |
| US-027 | Là **lễ tân** (`front_desk`), tôi muốn phụ thu nhận sớm/trả muộn của khách dài hạn được tính trên giá đêm quy đổi (không phải giá tháng), để không tính nhầm hàng triệu đồng | Must | R2 | BL 5.6, BL 8.2 #1, BL 9 #7 | Mới |

### EP04 – Lưu trú
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-028 | Là **lễ tân** (`front_desk`), tôi muốn gia hạn đơn trong số đêm liên tiếp còn trống (tối đa theo tham số), có giá mặc định theo quy tắc và ghi dòng "thu trực tiếp" với đơn OTA, để bán thêm đêm mà không mất phí kênh | Must | R2 | BL 3.9, BL 5.8, BL 8.2 #12, #13 | Mới |
| US-029 | Là **lễ tân** (`front_desk`), tôi muốn đặt trả muộn với phụ thu theo bậc giờ, được cảnh báo nếu có khách đến căn đó cùng ngày, và miễn phí (FOC) khi có người duyệt, để linh hoạt mà không ảnh hưởng khách sau | Must | R2 | BL 3.10, BL 5.6, BL 5.7, BL 8.2 #4 | Mới |
| US-030 | Là **lễ tân** (`front_desk`), tôi muốn ghi giờ trả phòng khách xác nhận và nhật ký các lần nhắc, để cả ca biết khách nào đã trả lời | Must | R2 | BL 3.10, BL 4.15 | Mới |
| US-031 | Là **lễ tân** (`front_desk`), tôi muốn thẻ "Khách trả phòng hôm nay chưa trả" đổi trạng thái theo giờ thật (chờ trả lời → cần gọi → quá giờ), để biết lúc nào phải gọi khách | Must | R2 | BL 3.3b, BL 5.9 | Mới |
| US-032 | Là **lễ tân** (`front_desk`), tôi muốn thêm dòng phát sinh vào folio (giặt ủi, đồ ăn, hư hỏng, phí phạt như khử mùi thuốc lá, làm lại thẻ phòng) từ danh mục có giá mặc định, để bill cuối không thiếu khoản nào | Must | R2 | BL 3.7, Brief 5 (phí phạt thực tế) | Mới |
| US-033 | Là **buồng phòng / lễ tân** (`housekeeping`, `front_desk`), tôi muốn kiểm minibar giữa kỳ cho khách đang ở và ghi tiền vào folio ngay, để không dồn hết vào lúc trả phòng | Should | R2 | BL 3.13 | Mới |
| US-034 | Là **lễ tân** (`front_desk`), tôi muốn hệ thống tự gửi nhắc trả phòng cho khách theo các mốc giờ (tối hôm trước, sáng ngày trả) và nhận lựa chọn của khách (trả đúng giờ / ở thêm / trả muộn), để giảm cuộc gọi | Should | R3 | BL 5.9, BL 7 | Mới |
| US-137 | Là **lễ tân** (`front_desk`), tôi muốn ghi khách trả phòng sớm hơn ngày đi (mở bán lại các đêm còn lại, tính phần hoàn theo chính sách, cập nhật khai báo khách nước ngoài), để tồn phòng và tiền đúng | Should | R2 | BR-428, BR-604; SM-01 B16; ESC-006 | Mới |

### EP05 – Trả phòng & bill
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-035 | Là **lễ tân** (`front_desk`), tôi muốn bước 1 trả phòng là kiểm minibar (nhập số còn lại, tự tính số đã dùng và tiền, đồ miễn phí không tính tiền), để thu đúng đồ khách dùng | Must | R2 | BL 3.7, BL 5.14 | Mới |
| US-036 | Là **lễ tân** (`front_desk`), tôi muốn bước 2 nhập phụ phí, giờ trả thực tế (tự tính phụ thu trả muộn), FOC và cách thanh toán, để chốt mọi khoản trước khi in bill | Must | R2 | BL 3.7, BL 5.6, BL 5.7 | Mới |
| US-037 | Là **lễ tân** (`front_desk`), tôi muốn bước 3 xem bill đúng công thức (tiền phòng từng đêm, phát sinh, minibar, phụ thu, dòng FOC âm, trừ đã cọc, còn phải thu), song ngữ Việt – Anh và quy đổi USD tham khảo cho khách nước ngoài, để khách hiểu và trả tiền ngay | Must | R2 | BL 3.8, BL 5.20 | Mới |
| US-038 | Là **lễ tân** (`front_desk`), tôi muốn bấm "hoàn tất" để đơn chuyển "đã trả", buồng chuyển "cần dọn", tự tạo việc dọn và bổ sung minibar, bill bị khóa không sửa được (chỉ điều chỉnh có ghi vết), để không còn việc làm tay sau khi khách đi | Must | R2 | BL 3.7, BL 5.15 | Mới |
| US-039 | Là **lễ tân** (`front_desk`), tôi muốn ghi thông tin xuất hóa đơn GTGT cho công ty (tên, MST, email) ngay trong bước trả phòng, để phát hành hóa đơn đúng | Must | R2 | BL 3.7, BL 5.16 (MST), BL 5.20 | Mới |
| US-040 | Là **lễ tân** (`front_desk`), tôi muốn in bill, xuất PDF và gửi bill qua email/Zalo, để khách có chứng từ ngay | Should | R3 | BL 3.8, BL 7 | Mới |
| US-041 | Là **lễ tân** (`front_desk`), tôi muốn trả phòng cho khách dài hạn với tiền thuê/điện nước kỳ cuối và khấu trừ hoặc hoàn ký quỹ theo chính sách, để kết thúc hợp đồng đúng tiền | Must | R3 | BL 8.2 #6, BL 9 #9 | Mới |

### EP06 – Giấy tờ, khai báo lưu trú & quyền dữ liệu của khách
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-042 | Là **lễ tân** (`front_desk`), tôi muốn danh sách khách cần khai báo kèm hạn tính theo BR-602/BR-603 ("khi nhận phòng", "trước <hạn> hôm nay", "đã quá hạn") và được nhắc trước hạn, để không bị phạt | Must | R2 | BL 3.11, BL 5.12 | Mới |
| US-043 | Là **lễ tân** (`front_desk`), tôi muốn nhập giấy tờ từng người (chụp/tải ảnh và các trường: họ tên, loại, số, ngày sinh, quốc tịch, hạn hộ chiếu, thị thực, ngày nhập cảnh; trẻ em dùng số định danh), để có đủ dữ liệu khai báo | Must | R2 | BL 3.11, BL 4.12, BL 5.12 | Mới |
| US-044 | Là **lễ tân** (`front_desk`), tôi muốn hệ thống đối chiếu tự động (tên khớp đơn, hộ chiếu còn hạn sau ngày trả, thị thực còn hạn đến ngày trả, đủ số người), để phát hiện sai sót trước khi khai báo | Must | R2 | BL 5.12, BL 8.2 #3 | Mới |
| US-045 | Là **lễ tân** (`front_desk`), tôi muốn ghi nhận khách đã đồng ý cho OTTIMO lưu ảnh giấy tờ trước khi lưu, để tuân thủ luật dữ liệu cá nhân | Must | R2 | BL 5.13, BL 3.11 | Mới |
| US-046 | Là **lễ tân** (`front_desk`), tôi muốn khai báo bán tự động: chọn đúng loại (tạm trú người nước ngoài / lưu trú công dân Việt Nam), sao chép dữ liệu, mở cổng Bộ Công an, dán mã hồ sơ, đánh dấu đã xác nhận, để làm nhanh dù cổng chưa có kết nối | Must | R2 | BL 3.11, BL 5.12, BL 9 #15 | Mới |
| US-047 | Là **lễ tân** (`front_desk`), tôi muốn mọi đơn (đặt mới, từ báo giá, từ OTA) đều tự có bản ghi khai báo với số người cần khai, để không đơn nào bị sót | Must | R2 | BL 8.2 #9 | Mới |
| US-048 | Là **chủ đầu tư** (`owner`), tôi muốn ảnh giấy tờ chỉ lễ tân và quản lý được xem, mỗi lần mở đều ghi nhật ký, hồ sơ khách chỉ hiện 4 số cuối, để bảo vệ dữ liệu nhạy cảm | Must | R2 | BL 5.13, BL 8.2 #27 | Mới |
| US-049 | Là **chủ đầu tư** (`owner`), tôi muốn ảnh giấy tờ tự xóa sau số ngày cấu hình kể từ ngày trả phòng và xóa sớm khi khách yêu cầu, để không giữ dữ liệu quá mức cần thiết | Must | R2 | BL 5.13, BL 9 #14 | Mới |
| US-050 | Là **lễ tân** (`front_desk`), tôi muốn được nhắc cập nhật ngày đi thực tế khi khách nước ngoài gia hạn/trả sớm, và bị cảnh báo khi ngày đi dự kiến vượt hạn thị thực/tạm trú, để khai báo tạm trú luôn đúng | Must | R2 | Brief 5 (khai báo tạm trú), BL 5.12 | Mới |
| US-051 | Là **lễ tân** (`front_desk`), tôi muốn quét QR CCCD gắn chip hoặc vùng MRZ hộ chiếu để tự điền thông tin, để giảm gõ tay và sai sót | Should | R3 | BL 3.11, BL 7 | Mới |
| US-133 | Là **khách** (`guest`), tôi muốn gửi yêu cầu xem, sửa, xóa, rút đồng ý hoặc nhận bản sao dữ liệu cá nhân của mình qua app khách hoặc tại quầy và thấy thời hạn trả lời, để thực hiện quyền của chủ thể dữ liệu | Must | R3 | UC-30; SEC R-DSR-01, R-DSR-02; Luật 91/2025 (chờ ESC-001) | Mới |
| US-134 | Là **quản lý** (`manager`, `owner`), tôi muốn hộp yêu cầu dữ liệu cá nhân có bước xác minh danh tính, nhắc hạn, liệt kê phần xóa được và phần luật buộc giữ, xuất bản sao dữ liệu của đúng khách đó, để xử lý đúng luật và có dấu vết | Must | R3 | UC-30; SEC R-DSR-02…04; rbac S31, A74 | Mới |

### EP07 – Buồng phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-052 | Là **buồng phòng** (`housekeeping`), tôi muốn xem trạng thái 10 căn trên điện thoại với bộ lọc (cần dọn, có khách, sẵn sàng) và khách đến kế tiếp, để biết dọn căn nào trước | Must | R2 | BL 3.12, BL 4.5 | Mới |
| US-053 | Là **buồng phòng** (`housekeeping`), tôi muốn đổi trạng thái buồng chỉ theo các bước hợp lệ (bắt đầu dọn → dọn xong → kiểm đạt…), dọn xong thì việc dọn tự đánh dấu xong, để lễ tân thấy phòng sẵn sàng ngay | Must | R2 | BL 5.15 | Mới |
| US-054 | Là **buồng phòng** (`housekeeping`), tôi muốn danh sách việc hôm nay tự sinh (dọn trả phòng, dọn phòng khách đang ở, bổ sung minibar, yêu cầu từ app khách, lịch dọn dài hạn) và tick xong được, để không cần ai nhắn việc | Must | R2 | BL 3.12, BL 5.15, BL 5.19 | Mới |
| US-055 | Là **buồng phòng** (`housekeeping`), tôi muốn đi qua checklist kiểm phòng trước khi đánh dấu "đã kiểm · sẵn sàng", để phòng đạt chuẩn OTTIMO | Must | R2 | BL 3.12 | Mới |
| US-056 | Là **buồng phòng** (`housekeeping`), tôi muốn việc dọn của khách dài hạn tự xuất hiện đúng ngày theo gói (1/2/3 lần mỗi tuần) và khung giờ đã hẹn, để không quên lịch | Must | R2 | BL 5.15, BL 3.21 | Mới |
| US-057 | Là **buồng phòng** (`housekeeping`), tôi muốn báo sự cố từ điện thoại (căn, mô tả, ảnh, mức độ), để kỹ thuật nhận phiếu ngay | Must | R2 | BL 3.14 | Mới |
| US-058 | Là **buồng phòng** (`housekeeping`), tôi muốn thao tác đổi trạng thái vẫn được ghi nhận khi mạng chập chờn và tự gửi lại khi có mạng, để không phải làm lại | Should | R2 | BL 9 #22 | Mới |
| US-059 | Là **lễ tân** (`front_desk`), tôi muốn phân việc buồng phòng cho từng người và mỗi người chỉ thấy việc của mình trước, để rõ trách nhiệm | Should | R3 | BL 4.6, BL 9 #13 | Mới |
| US-060 | Là **buồng phòng** (`housekeeping`), tôi muốn chụp ảnh phòng sau kiểm và đính vào lần kiểm, để có bằng chứng khi khách phản ánh | Could | R3 | BL 3.12 | Mới |

### EP08 – Bảo trì & điện nước
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-061 | Là **kỹ thuật / lễ tân** (`maintenance`, `front_desk`), tôi muốn tạo phiếu sửa chữa (căn, mức độ, mô tả, người xử lý) và chọn khóa phòng với khoảng ngày dự kiến, để phòng hỏng không bị bán | Must | R2 | BL 3.14, BL 8.2 #5 | Mới |
| US-062 | Là **kỹ thuật** (`maintenance`), tôi muốn cập nhật trạng thái phiếu (mới → đang xử lý → chờ vật tư → xong); khi xong thì căn được mở khóa và chuyển "cần dọn", để phòng quay lại bán nhanh | Must | R2 | BL 3.14, BL 5.15 | Mới |
| US-063 | Là **kỹ thuật** (`maintenance`), tôi muốn việc bảo trì định kỳ tự sinh kỳ kế tiếp và báo trước hạn theo BR-810, để không quên bảo dưỡng | Should | R3 | BL 3.14, BL 4.8 | Mới |
| US-064 | Là **kỹ thuật / lễ tân** (`maintenance`, `front_desk`), tôi muốn chốt chỉ số điện nước theo kỳ cho căn dài hạn, bị chặn khi chỉ số mới nhỏ hơn cũ, và xem lịch sử chỉ số, để tính tiền đúng | Must | R3 | BL 3.14, BL 5.10, BL 8.2 #21 | Mới |
| US-065 | Là **lễ tân** (`front_desk`), tôi muốn tiền điện nước đã chốt tự vào hóa đơn tháng của khách và hiện trong app khách, để thu không cần nhắn tin tính tay | Must | R3 | BL 5.10, BL 3.21 | Mới |

### EP09 – Kho F&B / minibar
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-066 | Là **chủ đầu tư** (`owner`), tôi muốn quản lý danh mục mặt hàng minibar/F&B (giá vốn, giá bán hoặc miễn phí, mức chuẩn mỗi tủ, mức tối thiểu), để kiểm minibar và tính tiền đúng | Must | R2 | BL 4.13, BL 5.14 | Mới |
| US-067 | Là **lễ tân** (`front_desk`), tôi muốn nhập kho, xuất kho (có lý do, không vượt tồn) và kiểm kê, xem bảng xuất nhập tồn tháng, để biết hàng còn bao nhiêu | Should | R3 | BL 3.15, BL 5.14 | Mới |
| US-068 | Là **buồng phòng** (`housekeeping`), tôi muốn tick việc "Bổ sung minibar" thì kho tự trừ và tủ về mức chuẩn, để tồn kho khớp thực tế | Should | R3 | BL 5.14 | Mới |
| US-069 | Là **lễ tân** (`front_desk`), tôi muốn được báo mặt hàng hết hoặc dưới mức tối thiểu, để nhập hàng kịp | Should | R3 | BL 3.15 | Mới |
| US-070 | Là **chủ đầu tư** (`owner`), tôi muốn xem doanh thu, lãi gộp F&B, chi phí đồ miễn phí và mặt hàng bán chạy, để điều chỉnh danh mục | Could | R3 | BL 3.15, BL 5.14 | Mới |

### EP10 – Khách hàng (CRM)
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-071 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn tạo và sửa hồ sơ khách (họ tên, SĐT/Zalo/WhatsApp, email, ngày sinh, quốc tịch, ngôn ngữ, liên hệ ưu tiên, công ty/MST, nhóm khách, sở thích, ghi chú), để phục vụ đúng người | Must | R2 | BL 3.16, BL 5.16 | Mới |
| US-072 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn bị chặn khi tạo hồ sơ trùng SĐT hoặc email đã có (và được cảnh báo khi trùng tên + ngày sinh), để không sinh hồ sơ đôi | Must | R2 | BL 5.16 | Mới |
| US-073 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn một bộ chọn khách dùng chung (tìm theo tên có/không dấu, SĐT, email, mã KH hoặc tạo nhanh) ở mọi nơi cần chọn khách, để thao tác giống nhau | Must | R2 | BL 3.16 (guestPicker) | Mới |
| US-074 | Là **lễ tân** (`front_desk`), tôi muốn gộp hai hồ sơ trùng mà mọi đơn, người đi cùng, khai báo, báo giá, hợp đồng, công tơ đều chuyển theo và có nhật ký gộp, để lịch sử khách liền mạch | Should | R3 | BL 5.16, BL 8.2 #16 | Mới |
| US-075 | Là **chủ đầu tư / sale** (`owner`, `sales_staff`), tôi muốn lọc khách theo phân khúc (khách quen, dài hạn, nước ngoài, VIP, người đi cùng, tiềm năng), để chăm sóc đúng nhóm | Should | R3 | BL 4.20 | Mới |
| US-076 | Là **lễ tân** (`front_desk`), tôi muốn xem dòng thời gian, số lượt lưu trú, doanh thu thanh toán và doanh thu phân bổ của khách, để nhận ra khách quen | Should | R3 | BL 3.16, BL 5.11 | Mới |
| US-077 | Là **lễ tân** (`front_desk`), tôi muốn ghi đồng ý nhận ưu đãi riêng từng người và gửi link mời người đi cùng tự điền liên hệ, để làm marketing hợp pháp | Should | R3 | BL 5.18, BL 3.17 | Mới |
| US-078 | Là **lễ tân** (`front_desk`), tôi muốn thấy độ đầy đủ hồ sơ tính đúng (chỉ tính "đồng ý ưu đãi" khi khách đã trả lời), để biết cần hỏi thêm gì | Could | R3 | BL 5.17, BL 8.2 #14 | Mới |
| US-079 | Là **lễ tân** (`front_desk`), tôi muốn phát hiện hồ sơ nghi trùng theo tên chính xác hơn (không báo nhầm tên đảo chữ, bắt được tên thiếu một chữ), để gộp đúng | Could | R3 | BL 8.2 #15 | Mới |

### EP11 – Sale, báo giá, giữ chỗ, hợp đồng dài hạn
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-080 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn báo giá ngắn ngày (giảm theo số đêm, cọc, hoa hồng của tôi, phần OTTIMO còn lại), để trả lời khách ngay trong cuộc chat | Must | R2 | BL 5.3 | Mới |
| US-081 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn báo giá dài hạn theo kỳ hạn, loại khách, gói dọn, số người (tiền thuê, phí dịch vụ, điện nước ước tính, ký quỹ, chu kỳ thu, thu khi chốt, hoa hồng, phần OTTIMO còn lại), để chốt hợp đồng tháng nhanh | Must | R2 | BL 5.2 | Mới |
| US-082 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn biết căn còn trống trong khoảng ngày và được gợi ý căn trống khác, để không hứa phòng đã có khách | Must | R2 | BL 5.4 | Mới |
| US-083 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn lưu báo giá (có mã, hạn hiệu lực theo tham số) và sao chép văn bản báo giá Việt/Anh/Nga để gửi Zalo, để khách nhận báo giá chuyên nghiệp | Must | R2 | BL 3.18, BL 5.4, BL 8.2 #19, decision-log P4 | Mới |
| US-084 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn tạo đơn giữ chỗ từ báo giá với hạn giữ theo BR-302 và cách nhận cọc, căn bị khóa ngay, để khách yên tâm chuyển cọc | Must | R2 | BL 3.18, BL 5.5 | Mới |
| US-085 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn giữ chỗ quá hạn mà chưa cọc được hệ thống tự xử lý theo chính sách BR-303 (mặc định tự hủy, mở lại phòng – chờ ESC-006) và báo cho tôi, để phòng không bị "treo" | Must | R2 | BL 5.5, BL 8.2 #19, BL 9 #11 | Mới |
| US-086 | Là **sale / lễ tân** (`sales_staff`, `front_desk`), tôi muốn xác nhận đã nhận cọc/ký quỹ để đơn chuyển "đã xác nhận" và – với dài hạn – sinh hợp đồng có lịch thu theo kỳ đúng công thức, để không phải lập lịch thu bằng tay | Must | R2 | BL 3.18, BL 5.5, BL 8.2 #10 | Mới |
| US-087 | Là **CTV** (`collaborator`), tôi muốn chỉ thấy báo giá, đơn, khách tiềm năng và hoa hồng của chính mình, để thông tin của người khác được bảo mật | Must | R2 | BL 2, BL 8.2 #27 | Mới |
| US-088 | Là **lễ tân / chủ đầu tư** (`front_desk`, `owner`), tôi muốn danh sách hợp đồng dài hạn với kỳ thu tới, được nhắc trước hạn thu theo BR-207 và ghi nhận đã thu từng kỳ, để không sót tiền thuê | Must | R3 | BL 3.18, BL 5.20 | Mới |
| US-089 | Là **chủ đầu tư** (`owner`), tôi muốn hoa hồng CTV/sale được ghi nhận theo từng hợp đồng/đơn, đánh dấu đã chi theo đợt, và mỗi người xem phần của mình, để chi đúng, đủ | Must | R3 | BL 3.18, BL 5.2, BL 9 #3 | Mới |
| US-090 | Là **sale** (`sales_staff`), tôi muốn bảng kanban khách tiềm năng (mới → đã báo giá → giữ chỗ → đã chốt) gắn với hồ sơ khách theo mã (không theo tên), để theo dõi cơ hội | Should | R3 | BL 3.18, BL 8.2 #17 | Mới |
| US-091 | Là **sale** (`sales_staff`), tôi muốn được nhắc chào gia hạn hợp đồng trước khi hết hạn theo tham số, để giữ khách dài hạn | Should | R3 | BL 5.20 | Mới |
| US-092 | Là **sale / chủ đầu tư** (`sales_staff`, `owner`), tôi muốn xuất hợp đồng thuê dài hạn ra PDF từ mẫu có sẵn dữ liệu, để ký nhanh | Should | R3 | BL 9 #17 | Mới |
| US-093 | Là **chủ đầu tư** (`owner`), tôi muốn xử lý chấm dứt hợp đồng sớm theo chính sách (phạt, hoàn ký quỹ), để quy trình rõ ràng | Should | R3 | BL 9 #6 | Mới |

### EP12 – Kênh OTA & channel manager
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-094 | Là **lễ tân** (`front_desk`), tôi muốn mỗi thay đổi phòng trống (đặt, giữ chỗ, gia hạn, khóa, hủy) tạo một lệnh đồng bộ kênh trong nhật ký (giả lập ở R2), để R3 nối channel manager không phải sửa luồng | Should | R2 | BL 5.21, BL 3.19 | Mới |
| US-095 | Là **lễ tân** (`front_desk`), tôi muốn đơn từ OTA tự vào Desk qua channel manager, tự tạo/gắn hồ sơ khách theo SĐT/email, để không nhập tay | Must | R3 | BL 3.19, BL 5.21, BL 9 #18, Brief 7 #3 | Mới |
| US-096 | Là **lễ tân** (`front_desk`), tôi muốn phòng trống được đẩy tự động lên mọi kênh khi có thay đổi, để tránh trùng phòng giữa các OTA | Must | R3 | BL 5.21 | Mới |
| US-097 | Là **chủ đầu tư** (`owner`), tôi muốn sửa giá theo nhóm căn × ngày và đẩy lên các kênh, bị chặn khi giá trống/0 hoặc ngoài giá sàn–trần, để quản lý giá ở một nơi | Should | R3 | BL 3.19, BL 8.2 #20 | Mới |
| US-098 | Là **chủ đầu tư** (`owner`), tôi muốn xem trạng thái kết nối từng kênh và bật/tắt mở bán, để kiểm soát kênh | Should | R3 | BL 3.19 | Mới |
| US-099 | Là **chủ đầu tư** (`owner`), tôi muốn mỗi đơn lưu phí kênh thực tế (theo tỉ lệ kênh hoặc số OTA báo), để báo cáo thực thu đúng | Must | R3 | BL 5.11, BL 8.2 #11, #12 | Mới |
| US-139 | Là **lễ tân** (`front_desk`), tôi muốn đơn OTA về trùng căn – đêm (do đồng bộ trễ) vẫn được nhận, gắn cờ xung đột, báo đỏ ngay cho tôi và quản lý kèm gợi ý dời khách theo thứ tự ưu tiên, để xử lý trước khi khách đến | Must | R3 | BR-312, BR-905; SM-01 mục 1.3 | Mới |

### EP13 – Báo cáo
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-100 | Là **chủ đầu tư** (`owner`), tôi muốn báo cáo vận hành theo tháng (công suất trừ phòng khóa, không tính giữ chỗ, ADR, RevPAR, thời gian ở trung bình theo kênh, cơ cấu ngắn/dài hạn), để quyết định giá và kênh | Must | R3 | BL 3.20, BL 5.11, BL 8.2 #8, #29 | Mới |
| US-101 | Là **chủ đầu tư** (`owner`), tôi muốn báo cáo kênh bán (doanh thu, phí kênh, thực thu theo kênh), để biết kênh nào thực sự lời | Must | R3 | BL 5.11, BL 8.2 #11 | Mới |
| US-102 | Là **chủ đầu tư** (`owner`), tôi muốn báo cáo FOC theo tháng (tổng giá trị, số lần, lý do, người duyệt), để soát thất thoát | Must | R3 | BL 5.7 | Mới |
| US-103 | Là **chủ đầu tư** (`owner`), tôi muốn nhập chi phí vận hành trong app và xem lãi lỗ đơn giản (doanh thu, chi phí, GOP, GOPPAR), với doanh thu dài hạn ghi nhận theo quy ước của DATA, để biết lãi thật | Should | R3 | BL 5.11, BL 8.2 #22, BL 9 #26 | Mới |
| US-104 | Là **chủ đầu tư** (`owner`), tôi muốn xuất báo cáo ra file bảng tính, để gửi kế toán | Should | R3 | BL 7 | Mới |
| US-105 | Là **chủ đầu tư** (`owner`), tôi muốn nhập điểm đánh giá theo kênh và xem tổng hợp khen/chê, để cải thiện dịch vụ | Could | R3 | BL 3.20 | Mới |

### EP14 – App khách
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-106 | Là **khách** (`guest`), tôi muốn mở trang của đơn mình bằng link hoặc QR mà không cần cài app hay tạo tài khoản, để dùng ngay | Must | R2 | BL 3.21, BL 7 | Mới |
| US-107 | Là **khách sắp đến** (`guest`), tôi muốn check-in online (tải giấy tờ từng người, giờ đến dự kiến, đồng ý lưu giấy tờ), để nhận phòng nhanh tại quầy | Must | R2 | BL 3.21, BL 5.12, BL 5.13 | Mới |
| US-108 | Là **khách** (`guest`), tôi muốn xem thông tin lưu trú (ngày, giờ nhận/trả, Wi-Fi, mã cửa khi đến hạn, chỉ đường, nội quy và phí phạt), để không phải hỏi lễ tân | Must | R2 | BL 3.21, Brief 5 | Mới |
| US-109 | Là **khách đang ở** (`guest`), tôi muốn gửi yêu cầu (dọn thêm, khăn/đồ dùng, báo hỏng, đặt xe/tour, trả muộn, khác) và thấy yêu cầu đã được nhận/xử lý, để yên tâm | Must | R2 | BL 5.19, Brief 5 (sự cố thường gặp) | Mới |
| US-110 | Là **lễ tân / buồng phòng / kỹ thuật** (`front_desk`, `housekeeping`, `maintenance`), tôi muốn yêu cầu của khách tự vào đúng hàng việc (việc buồng phòng, phiếu sửa, việc lễ tân) và có báo mới, để phản hồi trong thời gian cam kết | Must | R2 | BL 5.19, BL 3.21 | Mới |
| US-111 | Là **khách** (`guest`), tôi muốn xem folio/hóa đơn tạm tính của đơn (tiền phòng, phát sinh, đã trả, còn phải trả), để không bất ngờ khi trả phòng | Must | R2 | BL 3.21 | Mới |
| US-112 | Là **khách nước ngoài** (`guest`), tôi muốn chuyển trang của mình sang tiếng Anh, để hiểu mọi nội dung | Must | R2 | BL 1, DoD (VI + EN), decision-log P4 | Mới |
| US-113 | Là **khách trả phòng hôm nay** (`guest`), tôi muốn tự chọn trả đúng giờ, ở thêm (nếu còn phòng) hoặc trả muộn có phí hiển thị trước, để không phải gọi lễ tân | Should | R3 | BL 3.21, BL 5.9 | Mới |
| US-114 | Là **khách dài hạn** (`guest`), tôi muốn xem hợp đồng, lịch dọn, kỳ thanh toán tới và hóa đơn điện nước hằng tháng, để chủ động thanh toán | Must | R3 | BL 3.21, BL 5.10 | Mới |
| US-115 | Là **khách nói tiếng Nga** (`guest`), tôi muốn dùng trang của mình bằng tiếng Nga, để thoải mái hơn | Must | R3 | Brief 5, decision-log P4 | Mới |
| US-116 | Là **chủ đầu tư** (`owner`), tôi muốn app tự hỏi thăm khách theo mốc cấu hình (BL 5.18), gửi lời cảm ơn + mã giảm đặt trực tiếp khi trả phòng và mời đánh giá trên kênh khách đã đặt theo mốc cấu hình, để tăng điểm đánh giá và khách quay lại | Should | R3 | BL 5.18 | Mới |
| US-117 | Là **khách** (`guest`), tôi muốn xem gợi ý Đà Lạt (điểm tham quan, quán cà phê) và nhờ OTTIMO đặt xe/tour, để có trải nghiệm tốt | Could | R3 | BL 3.21 | Mới |
| US-118 | Là **lễ tân** (`front_desk`), tôi muốn ghi nhận đồ khách để quên và thông báo cho khách, để xử lý chuyên nghiệp | Could | R3 | Brief 5 (sự cố thường gặp) | Mới |
| US-138 | Là **khách trả phòng sớm buổi sáng** (`guest`), tôi muốn tự bấm "Trả phòng" trên app khi đã thanh toán đủ và nhận bill qua email/Zalo, để không phải chờ quầy mở | Should | R3 | BR-427; UC-19; SM-01 B18 | Mới |

### EP15 – Thanh toán & hóa đơn điện tử
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-119 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn ghi nhận các lần thu tiền của một đơn (cọc, thu khi nhận, thu khi trả, theo kỳ) theo cách thanh toán (chuyển khoản, thẻ, tiền mặt, đã thu qua OTA), để số "còn phải thu" luôn đúng | Must | R2 | BL 3.7, BL 5.20 | Mới |
| US-120 | Là **lễ tân** (`front_desk`), tôi muốn hiện mã VietQR đúng số tiền với nội dung chuyển khoản là mã bill/đơn, để khách chuyển đúng và dễ đối soát | Must | R2 | BL 3.8, BL 5.20, decision-log (VietQR) | Mới |
| US-121 | Là **khách** (`guest`), tôi muốn thanh toán cọc/tiền phòng qua VNPay hoặc MoMo bằng link, để trả nhanh từ xa | Should | R3 | Brief 7 #4, BL 9 #20 | Mới |
| US-122 | Là **lễ tân** (`front_desk`), tôi muốn hóa đơn điện tử được phát hành qua MISA meInvoice khi thu tiền (khách lẻ hoặc công ty), để tuân thủ thuế | Must | R3 | BL 5.20, Brief 7 #3, BL 9 #16 | Mới |
| US-123 | Là **quản lý** (`manager`), tôi muốn ghi nhận hoàn cọc/hoàn tiền có lý do và người duyệt, để khớp sổ | Should | R3 | BL 9 #6, BL 8.2 #23 | Mới |
| US-124 | Là **lễ tân** (`front_desk`), tôi muốn xem tổng thu trong ngày theo cách thanh toán, để bàn giao tiền mặt và đối soát chuyển khoản | Should | R3 | Mới; BR-521, rbac A44 | Mới |

### EP16 – Giao tiếp với khách
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-125 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn chọn mẫu tin nhắn theo tình huống (xác nhận đặt, link check-in, nhắc trả phòng, nội quy, xin lỗi sự cố nước nóng…) bằng Việt/Anh/Nga có sẵn dữ liệu đơn và sao chép được, để nhắn nhóm chat nhanh, đúng ngôn ngữ | Must | R2 | Brief 5, decision-log P4 | Mới |
| US-126 | Là **lễ tân** (`front_desk`), tôi muốn tin nhắn quan trọng (xác nhận, link check-in, nhắc trả phòng, bill) tự gửi qua Zalo OA/ZNS hoặc email, để không phải gửi tay | Should | R3 | BL 7, BL 9 #19 | Mới |
| US-127 | Là **chủ đầu tư** (`owner`), tôi muốn sửa nội dung các mẫu tin, để phù hợp giọng văn OTTIMO | Should | R3 | Mới; rbac A106 (`owner`, `manager`) | Mới |

### EP17 – Khóa cửa & thẻ phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-128 | Là **lễ tân** (`front_desk`), tôi muốn nhập mã cửa (và thời hạn hiệu lực) vào đơn, để khách thấy mã trong app từ ngày nhận phòng | Must | R2 | Brief 7 #3, decision-log (khóa thông minh) | Mới |
| US-129 | Là **lễ tân** (`front_desk`), tôi muốn ghi số thẻ phòng đã cấp/thu cho từng đơn và tự thêm phí khi thiếu thẻ lúc trả phòng, để không thất thoát thẻ | Should | R3 | Brief 5 (phí làm lại thẻ) | Mới |
| US-130 | Là **lễ tân** (`front_desk`), tôi muốn app tự tạo mã cửa có hạn (theo ngày sinh nhật khách nếu khách muốn) qua API hãng khóa, để không phải đặt mã trên app khóa riêng | Could | R4+ | Brief 7 #3 | Mới |

### EP18 – Đặt phòng trực tiếp trên web
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-131 | Là **khách** (`guest`), tôi muốn xem phòng trống và giá trực tiếp trên website OTTIMO rồi gửi yêu cầu giữ chỗ, để đặt mà không qua OTA | Should | R3 | BL 3.19 (kênh Website), BL 5.11 (giảm phí kênh) | Mới |
| US-132 | Là **khách** (`guest`), tôi muốn đặt và thanh toán ngay trên website mà không cần chờ xác nhận, để chốt nhanh | Could | R4+ | Mới; phụ thuộc BR-305, ESC-006 (chính sách hủy), ESC-010 (cổng thanh toán) | Mới |

### Won't (ngoài phạm vi MVP – chi tiết PRD 5.3)
POS nhà hàng; kế toán tổng hợp/lương; ca làm việc & chấm công; ký số hợp đồng; kết nối trực tiếp từng OTA; iCal; định giá tự động; hạng thành viên; đa tiền tệ thanh toán; app cài từ store cho khách; tiếng Hàn/Trung.

---

## 4. Tiêu chí nghiệm thu – 74 story Must Round 2 (+ story mới Must R3)

Quy ước (đợt 3):
- Định dạng **Given / When / Then**, mỗi AC là ít nhất một ca kiểm thử (QA).
- **Không chép con số quy tắc**: mọi giá, %, giờ, hạn, hạn mức ghi bằng mã **BR-xxx** của `business-rules.md` (QC B3). "**khớp ví dụ BR-xxx**" = với tham số mặc định, kết quả phải bằng con số ở cột "Mặc định & ví dụ số" của BR đó (nếu DOM sửa số, AC tự đúng theo). Các con số còn lại (giá đơn 700.000/820.000, ngày 19–22/10, căn 201/203…) là **dữ liệu thử** lấy từ dữ liệu mẫu BL, không phải quy tắc.
- Trạng thái dùng tên trong code của `state-machines.md` (SM-01 đơn: `hold`, `confirmed`, `in_house`, `checked_out`, `cancelled`, `no_show`; SM-03 buồng: `VC`, `VI`, `VD`, `CL`, `OC`, `OD`, `OOO`; SM-05 khai báo; SM-10 duyệt…), kèm mã chuyển (B1…, K1…, R1…).
- Vai dùng mã của `rbac-matrix.md`; FD+ / FDL+ / MGR+ như mục 1. Mọi AC "bị từ chối" nghĩa là **server từ chối và ghi nhật ký lần bị từ chối**, không chỉ ẩn nút (rbac mục 8).
- Thời điểm tính theo giờ Asia/Ho_Chi_Minh (BR-001); kiểm các mốc giờ bằng đồng hồ giả lập (ADR-008).
- Chính sách chưa chốt ghi "chờ ESC-xxx": AC kiểm theo giá trị mặc định; INV đổi chính sách thì chỉ đổi tham số.

### EP00 – Nền tảng

#### US-001 – Đăng nhập (UC-28)
- AC1: Given tài khoản `front_desk` đang hoạt động, When đăng nhập đúng, Then vào màn hình mặc định của vai (room rack – rbac mục 1) và tên người dùng hiện trên đầu trang.
- AC2: Given chưa đăng nhập hoặc phiên đã hết hạn, When mở trực tiếp đường dẫn một màn hình nội bộ, Then bị chuyển về trang đăng nhập và API không trả dữ liệu.
- AC3: Given đã đăng nhập, When tạo hoặc sửa một đơn, Then lịch sử chuyển trạng thái và nhật ký ghi đúng tài khoản đó là người thực hiện, thời điểm theo BR-001.

#### US-002 – Gán vai (UC-28, rbac A100)
- AC1: Given `owner` mở một tài khoản, When đổi vai từ `front_desk` sang `housekeeping` và người đó đăng nhập lại, Then menu chỉ còn các màn hình được phép của `housekeeping` theo rbac mục 3.
- AC2: Given tài khoản `housekeeping`, When gọi trực tiếp API tạo đơn (A01), Then bị từ chối và nhật ký ghi người, hành động, đối tượng.
- AC3: Given tài khoản có hai vai `front_desk` + `sales_staff`, Then quyền là hợp hai vai (rbac mục 1, quy tắc 2).
- AC4: Given tài khoản `manager`, When mở màn Người dùng & vai (S26) hoặc gọi A100, Then bị từ chối (chỉ `owner`).

#### US-003 – Ẩn dữ liệu nhạy cảm (rbac mục 6–7)
- AC1: Given tài khoản `sales_staff` hoặc `collaborator`, When mở hồ sơ một khách đã có giấy tờ (giao diện hoặc API), Then phản hồi không chứa loại giấy tờ, số giấy tờ (kể cả dạng che) hay ảnh (D03–D07 = K; khắc phục BL 8.2 #27, rbac M1).
- AC2: Given tài khoản `housekeeping`, When xem minibar hoặc kho, Then thấy số lượng, mức chuẩn, món thiếu nhưng không có giá vốn, giá trị tồn, thành tiền (rbac M3).
- AC3: Given tài khoản `sales_staff`, `collaborator` hoặc `housekeeping`, When mở P&L (S21) hoặc báo cáo kênh (S20), Then không có menu và truy cập trực tiếp bị từ chối (rbac M2).
- AC4: Given tài khoản `front_desk`, When mở Tổng quan, Then không thấy doanh thu tháng, ADR, RevPAR và cảnh báo FOC (rbac ghi chú 1).

#### US-004 – Danh mục căn
- AC1: Given danh mục 10 căn (BL 4.1), When `owner` đổi giá niêm yết tháng của căn 203, Then giá đêm niêm yết tính lại theo BR-101 cho báo giá/đơn tạo sau; đơn, báo giá, HĐ đã có giữ nguyên snapshot (BR-006, BR-106).
- AC2: Given căn đánh dấu "ngừng bán", When tạo đơn mới, Then căn không có trong danh sách chọn và rack hiện nhãn "Ngừng bán".
- AC3: Given mỗi căn có sức chứa tối đa (BR-110 – số thật chờ ESC-004), When tạo đơn, giữ chỗ hoặc báo giá vượt sức chứa, Then bị chặn tại ô số khách.

#### US-005 – Bảng tham số quy tắc (BR mục 13)
- AC1: Given tham số hạn giữ chỗ mặc định (BR-302), When `owner` đổi sang một mức khác trong danh sách cho phép, Then giữ chỗ tạo sau dùng mức mới; giữ chỗ đã tạo giữ hạn cũ (BR-006).
- AC2: Given `manager`, When sửa tham số vận hành (A101), Then được; When sửa hạn mức FOC, tỷ lệ hoa hồng, phí kênh (A102), Then bị từ chối. Given `front_desk_lead`, Then chỉ xem (S24 R); các vai khác không mở được màn này.
- AC3: Given sửa một tham số, Then nhật ký ghi giá trị cũ, giá trị mới, người sửa, thời điểm và ngày hiệu lực (BR mục 0.2).

#### US-006 – Nhật ký thao tác tiền (BR-008)
- AC1: Given đơn có folio `open`, When `front_desk` thêm hoặc điều chỉnh một dòng phát sinh, Then nhật ký ghi người, thời điểm, giá trị trước/sau, lý do; không có thao tác xóa dòng – sửa sai bằng bút toán điều chỉnh (BR-008).
- AC2: Given `owner` mở nhật ký (S27), When lọc theo ngày và người làm, Then thấy đúng các thao tác tiền (folio, giảm giá, FOC, hủy, thu, hoàn) trong khoảng đó; `front_desk` chỉ thấy nhật ký của chính mình.

#### US-007 – Phê duyệt FOC/giảm giá (UC-27, SM-10)
- AC1: Given `front_desk` gửi FOC cho phụ thu trả muộn với lý do từ danh mục BR-432, When lưu, Then yêu cầu ở `pending`, folio hiện dòng "chờ duyệt", form **không** có ô chọn tên người duyệt, và người có quyền theo BR-433 nhận thông báo.
- AC2: Given `front_desk_lead` xác nhận bằng PIN của chính mình và giá trị nằm trong hạn mức lần + hạn mức tháng còn lại (BR-433), Then yêu cầu `approved`; folio có dòng phát sinh + dòng FOC âm cùng giá trị, lý do và tên người duyệt thật (BR-434).
- AC3: Given giá trị vượt hạn mức của `front_desk_lead` (BR-433 – chờ ESC-007), When người đó mở yêu cầu, Then không duyệt được và yêu cầu chuyển `escalated` tới `manager`/`owner`.
- AC4: Given người duyệt là người gửi và không phải `manager`/`owner`, Then bị từ chối (BR-432); Given PIN sai, Then không duyệt được.
- AC5: Given folio còn yêu cầu `pending`/`escalated`, When hoàn tất trả phòng, Then bị chặn (SM-10).

#### US-135 – Xác nhận hành động không đảo ngược (HR-06) – *mới*
- AC1: Given một trong các hành động: hủy giữ chỗ/hủy đơn, đánh dấu no-show, hoàn tất trả phòng, đóng/mở bán kênh, gộp hồ sơ khách, chuyển phiếu sửa sang `done` (mở khóa phòng), xóa sớm ảnh giấy tờ, When người dùng bấm, Then hiện hộp xác nhận nêu hậu quả cụ thể (ví dụ "Căn 203 sẽ mở bán lại 19–22/10 trên mọi kênh") và nút xác nhận ghi đúng tên hành động.
- AC2: Given hộp xác nhận đang mở, When bấm Hủy hoặc phím Esc, Then không có dữ liệu nào thay đổi.
- AC3: Given người dùng bàn phím hoặc trình đọc màn hình, Then thao tác được hộp xác nhận và nghe được nội dung hậu quả (WCAG 2.2 AA – decision-log UXR).

### EP01 – Tổng quan

#### US-010 – KPI đêm nay
- AC1: Given 10 căn, trong đó 6 căn có đơn `confirmed`/`in_house` phủ đêm nay, 1 căn có khối OOO `active`, 1 căn chỉ có đơn `hold`, When mở Tổng quan, Then công suất đêm nay = 6/9 theo công thức `metrics-definitions.md` (đêm khả dụng trừ OOO – BR-804; `hold` không là đêm bán – BR-904) và có chú thích mẫu số (khắc phục BL 8.2 #8, #29).
- AC2: Given dữ liệu đơn thay đổi, When tải lại Tổng quan, Then KPI thay đổi theo; không còn số cố định trong giao diện (BL 8.2 #28).

#### US-011 – Khách đến/đi hôm nay (BR-404)
- AC1: Given hôm nay có 1 đơn `cancelled` và 1 đơn `no_show` có ngày đến hôm nay, When mở "Khách đến", Then hai đơn đó không xuất hiện; đơn `hold` có ngày đến hôm nay chỉ nằm ở mục riêng "Giữ chỗ chưa cọc" (BL 8.2 #7).
- AC2: Given đơn `confirmed` đến hôm nay, Then dòng có nút "Nhận phòng"; đơn `in_house` có ngày đi hôm nay có nút "Trả phòng"; đơn đã chuyển trạng thái hiện chip "Đã nhận"/"Đã trả".

#### US-012 – Cần chú ý (BR-907)
- AC1: Given một đơn đến hôm nay có khai báo ở trạng thái trước `sent`, Then "Cần chú ý" có dòng nêu số đơn chưa khai báo và hạn tính theo BR-602 (khách VN) / BR-603 (khách NN, hạn sớm hơn); bấm vào mở màn khai báo.
- AC2: Given HĐ có kỳ thu trong khoảng nhắc của BR-207, Then có dòng nhắc thu (tên khách, số tiền, ngày); Given HĐ hết hạn trong khoảng của BR-211, Then có dòng "chào gia hạn".
- AC3: Given khách NN có thị thực hết hạn trước ngày trả phòng (BR-605), Then có dòng cảnh báo nêu căn và ngày hết hạn.
- AC4: Given có giữ chỗ trong khoảng nhắc trước hạn của BR-303, một khối OOO, một phiếu sửa mức Cao đang mở (BR-809), Then mỗi loại có một dòng riêng.
- AC5: Given không có việc nào thỏa điều kiện, Then hiện trạng thái rỗng "Không có việc cần chú ý".
- AC6: Given tài khoản `front_desk`, Then không thấy dòng cảnh báo FOC (BR-435 chỉ gửi `owner`).

### EP02 – Room rack & đặt phòng

#### US-016 – Room rack
- AC1: Given dữ liệu mẫu, When mở màn Lễ tân, Then thấy 10 dòng căn × 14 cột ngày (2 ngày trước tới 11 ngày sau hôm nay), cột hôm nay được đánh dấu.
- AC2: Given mỗi thanh trên rack, Then phân biệt `hold` (viền đứt), `confirmed`, `in_house`, `checked_out`, đơn dài hạn và khối OOO bằng cả màu và nhãn chữ/biểu tượng đọc được bởi trình đọc màn hình (BL 8.3).
- AC3: Given bấm vào một thanh đơn bằng chuột hoặc bàn phím, Then mở chi tiết đơn đó.
- AC4: Given tài khoản `housekeeping`/`maintenance`, Then rack chỉ cho xem trạng thái căn và có/không có khách đến, không có tên khách, kênh, giá; `sales_staff`/`collaborator` chỉ thấy căn – đêm còn/hết (rbac ghi chú 2, 3).

#### US-017 – Tạo đơn ngắn ngày đã đảm bảo (UC-04, B2)
- AC1: Given căn 203 trống 19–22/10, When `front_desk` tạo đơn kênh Booking.com 3 đêm 2 khách giá 820.000 có mã OTA và kiểu thanh toán OTA (BR-307), Then đơn ở `confirmed`, hiện trên rack, có bản ghi khai báo `none` cần 2 người (BR-608) và có lệnh đồng bộ đóng phòng (BR-905).
- AC2: Given kênh Trực tiếp hoặc CTV, When lưu mà khách không có SĐT, Then bị chặn với thông báo cần SĐT.
- AC3: Given bỏ trống giá, Then giá từng đêm mặc định theo lịch giá của kênh (BR-101, BR-103, BR-104) và hiện trước khi lưu; Given giá bằng 0, trống hoặc ngoài khoảng sàn–trần, Then lỗi tại ô (BR-105).
- AC4: Given ngày đến sau 31/12/2026 nhưng trong cửa sổ bán BR-112, Then tạo được (khắc phục BL 8.2 #26); ngoài cửa sổ hoặc số đêm ngoài giới hạn BR-112 → lỗi tại ô.
- AC5: Given số đêm đạt ngưỡng bắt buộc hợp đồng của BR-108, Then không lưu được đơn ngắn ngày và được hướng sang báo giá dài hạn (UC-06).
- AC6: Given tài khoản `sales_staff` hoặc `collaborator`, Then không có màn đặt phòng mới (A01 ✖); chỉ tạo giữ chỗ từ báo giá (US-084).

#### US-018 – Chống đặt trùng (BR-002, BR-906)
- AC1: Given căn 201 đã có đơn `confirmed` 20–22/10, When tạo đơn căn 201 từ 21/10, Then bị chặn và thông báo nêu khoảng ngày đang trùng.
- AC2: Given hai người cùng lưu đơn cho cùng căn – đêm gần như đồng thời, When cả hai bấm lưu, Then chỉ một đơn thành công, người kia nhận "Căn vừa được đặt" (kiểm ở máy chủ trong cùng giao dịch – BL 8.2 #30).
- AC3: Given ngày đi của đơn A = ngày đến của đơn B cùng căn, Then không coi là trùng (khoảng [đến, đi) – BR-002).
- AC4: Given các luồng giữ chỗ (B1), xác nhận cọc (B4), gia hạn (B13), đổi căn/đổi ngày (B7), đổi phòng (B14), khôi phục no-show (B12), tạo/kéo dài khối OOO (O1, O3), Then cùng một quy tắc kiểm trùng ở server được áp dụng (state-machines 0.2 mục 4).

#### US-019 – Phòng khóa chặn bán (SM-02, BR-804)
- AC1: Given căn 401 có khối OOO `planned` hoặc `active` 15–17/10, When tạo đơn, giữ chỗ hoặc báo giá căn 401 cho đêm 16/10, Then bị chặn với lý do "Phòng đang khóa".
- AC2: Given căn đang khóa, Then rack hiện thanh "Khóa phòng"; phòng trống trên Tổng quan/báo giá và đêm khả dụng không tính căn này trong các đêm khóa (BR-904).

#### US-020 – Chi tiết đơn
- AC1: Given đơn `hold`, When mở chi tiết, Then thấy tiến trình đúng loại đơn (ngắn ngày/dài hạn – BL 3.4) và chỉ các nút hợp lệ: "Xác nhận cọc" (FD+, `sales_staff` – A04), "Gia hạn giữ chỗ" (nếu chưa gia hạn – B3), "Hủy giữ chỗ"; `collaborator` thấy "Báo đã chuyển cọc" thay cho "Xác nhận cọc" (A53).
- AC2: Given đơn `in_house` có ngày đi hôm nay, Then có nút "Trả phòng"; đơn `checked_out` chỉ có "Xem bill"; đơn `cancelled`/`no_show` không có nút thay đổi, trừ "Khôi phục no-show" cho `manager`/`owner` (B12).
- AC3: Given `collaborator`, When mở đơn không do mình chốt, Then bị từ chối; với đơn của mình chỉ thấy tổng tiền phòng và cọc (rbac ghi chú 4).
- AC4: Given gọi API một chuyển không hợp lệ với trạng thái hiện tại (ví dụ nhận phòng đơn `hold`), Then bị từ chối (state-machines 0.2).

#### US-021 – Hủy đơn / hủy giữ chỗ (UC-05, B5, B10)
- AC1: Given đơn `hold`, When hủy mà không chọn lý do từ danh mục BR-308, Then không lưu được.
- AC2: Given bấm hủy, Then hộp xác nhận nêu căn, khoảng ngày sẽ mở bán lại và khoản giữ lại/hoàn (US-135 – khắc phục HR-06).
- AC3: Given hủy thành công, Then đơn `cancelled`, phòng trống ngay trên rack, có lệnh đồng bộ mở phòng, khai báo → `void`, hoa hồng → `void`, nhật ký ghi lý do và người hủy.
- AC4: Given đơn Trực tiếp/CTV `confirmed` đã cọc, When hủy, Then hiển thị phí hủy và phần hoàn theo BR-309 (khớp ví dụ BR-309 – chờ ESC-006) và phần hoàn tạo yêu cầu duyệt cho `manager`/`owner` (BR-522); đơn OTA: nhập số tiền phạt theo kênh, app không tự tính (BR-310).
- AC5: Given `manager`/`owner`, Then có lựa chọn "Dời ngày" thay cho hủy, một lần, giữ nguyên cọc (B8, BR-309); `front_desk` không có lựa chọn này (A08).
- AC6: Given đơn `in_house`, Then không có nút Hủy (dùng trả sớm – US-137).

#### US-022 – Người đi cùng
- AC1: Given đơn 2 khách chỉ có người đứng tên, When mở chi tiết, Then hiện cảnh báo "Thiếu 1 người" ở khối khách (BR-601).
- AC2: Given thêm người dưới ngưỡng bảo vệ dữ liệu trẻ em (`is_minor_data` – rbac mục 9, ngưỡng chờ ESC-001), Then không tạo hồ sơ CRM, không lưu liên hệ, không hỏi đồng ý marketing; bậc tuổi phụ thu tính riêng theo BR-110.
- AC3: Given chọn một người đã có trong đơn, When thêm lần nữa, Then bị chặn trùng.

#### US-023 – Mã duy nhất (BR-007)
- AC1: Given tạo liên tiếp và đồng thời nhiều đơn, báo giá, phiếu sửa (kể cả phiếu từ app khách), bill, Then mỗi mã do server cấp theo mẫu BR-007, liên tục theo cơ sở, không trùng; mã của bản ghi đã hủy không được dùng lại (khắc phục BL 8.2 #18).
- AC2: Given một hồ sơ khách bị gộp, Then mã cũ vẫn tra được và trỏ tới hồ sơ được giữ lại (BR-953).

#### US-024 – Đổi căn / đổi ngày / đổi phòng (UC-16, B7, B14, BR-424)
- AC1: Given đơn `confirmed`, When `front_desk` đổi sang căn khác hoặc khoảng ngày khác kèm lý do, Then kiểm trùng ở server (BR-906), giá các đêm không đổi giữ snapshot (BR-006), có lệnh đồng bộ; với đơn OTA chỉ đổi được căn nội bộ, không đổi ngày (B7).
- AC2: Given đơn `in_house` đổi phòng với lý do "sự cố OTTIMO", Then giữ giá cũ; với lý do "khách yêu cầu", Then giá căn mới tính từ đêm đổi (BR-424).
- AC3: Given đổi phòng xong, Then căn cũ → `VD`/`OD` kèm việc dọn, mã cửa cũ hiển thị "đã hủy" và yêu cầu nhập mã mới (BR-403), khai báo không phải khai lại (BR-424).
- AC4: Given căn mới không ở `VI`/`VC` hoặc có khối OOO, hoặc thiếu lý do, Then bị chặn.

#### US-136 – Đánh dấu no-show (UC-05, B11, B12, BR-311) – *mới*
- AC1: Given đơn `confirmed` đến hôm nay chưa nhận phòng và không có giờ đến dự kiến, When qua mốc gọi khách của BR-311, Then `front_desk` nhận nhắc gọi/nhắn khách.
- AC2: Given đã qua mốc đánh dấu của BR-311 và đã ghi kết quả liên lạc, When `front_desk` bấm "No-show" và xác nhận (US-135), Then đơn `no_show`; đơn trực tiếp giữ cọc theo BR-311 (ghi "doanh thu khác" – BR-904); các đêm còn lại mở bán + đồng bộ; khai báo → `void`; hoa hồng → `void`; đơn OTA có việc "Báo no-show trên kênh". Hệ thống **không bao giờ** tự đánh dấu.
- AC3: Given chưa ghi kết quả liên lạc hoặc chưa qua mốc đánh dấu, Then nút "No-show" bị khóa.
- AC4: Given khách đến muộn trong cùng ngày nghiệp vụ và căn còn trống, When `manager`/`owner` bấm "Khôi phục no-show" (B12), Then đơn về `confirmed`, đóng lại phòng, khai báo có bản ghi mới `none`; `front_desk` chỉ gửi được yêu cầu duyệt (A10 = D).

### EP03 – Nhận phòng

#### US-025 – Nhận phòng (UC-11, B9, BR-402)
- AC1: Given đơn `confirmed` đến hôm nay, buồng `VI`, đã thu đủ, có giấy tờ người đứng tên, When `front_desk` nhận phòng lúc 14:30, Then đơn → `in_house`, buồng → `OC`, ghi giờ nhận 14:30, không có phụ thu (BR-401, BR-411).
- AC2: Given buồng đang `VD`, When `front_desk` nhận phòng, Then phải gửi yêu cầu để FDL+ xác nhận lý do (A12 = D); `front_desk_lead` tự xác nhận được; sau khi nhận, buồng → `OD` và có việc dọn ưu tiên (R7).
- AC3: Given còn phải thu > 0 (đơn trực tiếp/CTV) hoặc chưa có giấy tờ người đứng tên, Then không hoàn tất được nhận phòng và không giao mã cửa (BR-402).
- AC4: Given khai báo chưa `sent`, When nhận phòng xong, Then hiện hạn khai báo theo BR-602/BR-603 (khách NN tính từ giờ nhận thực tế) và đơn vào "Cần chú ý".
- AC5: Given nhận nhầm đơn, When `manager`/`owner` bấm "Hoàn tác nhận phòng" trong cùng ngày và chưa có dòng folio mới (B17), Then đơn về `confirmed`, buồng về trạng thái trước, mã cửa bị hủy, nhật ký ghi lý do; `front_desk` không có nút này (A13).

#### US-026 – Phụ thu nhận sớm (BR-411, BR-414; HR-04)
- AC1: Given mở form nhận phòng vào bất kỳ giờ nào, Then giờ nhận mặc định = giờ chuẩn BR-401, phụ thu = 0 và chưa có dòng folio nào (khắc phục BL 8.2 #2, HR-04).
- AC2: Given đơn có giá đêm đầu 700.000, When lễ tân chủ động chọn "Nhận sớm" và nhập 11:00, Then hệ thống đề xuất phụ thu khớp ví dụ BR-411 và chỉ ghi folio sau khi lễ tân xác nhận đúng số tiền đang hiển thị.
- AC3: Given giờ nhận trước mốc tính tròn 1 đêm của BR-411, Then hệ thống yêu cầu đổi ngày đến sang hôm trước (BR-003) thay vì ghi phụ thu.
- AC4: Given lễ tân muốn miễn phụ thu, Then đi theo luồng duyệt US-007.

#### US-027 – Phụ thu cho đơn dài hạn (BR-102, BR-213, BR-413)
- AC1: Given HĐ tiền thuê 11.130.000/tháng, When tính phụ thu trả muộn ở bậc thấp nhất của BR-412 (trường hợp phải thu), Then cơ sở tính là giá đêm quy đổi BR-102 và kết quả khớp ví dụ BR-413 (không phải 3.339.000 – lỗi BL 8.2 #1).
- AC2: Given chính sách miễn phí cho dài hạn của BR-413 đang bật và căn không có khách đến cùng ngày, Then phụ thu đề xuất = 0 trong khung miễn phí; INV đổi chính sách (ESC-007) chỉ cần đổi tham số.

### EP04 – Lưu trú

#### US-028 – Gia hạn (UC-13, B13, BR-421–423)
- AC1: Given căn 201 còn trống 3 đêm liên tiếp sau ngày đi, When mở gia hạn, Then chọn được tối đa min(3, giới hạn BR-421) đêm, mỗi đêm hiện "Trống"; muốn vượt giới hạn → được hướng sang báo giá dài hạn (BR-108).
- AC2: Given đơn trực tiếp giá 700.000, When gia hạn 2 đêm ngày thường, Then giá khớp ví dụ BR-421 (giữ giá của đơn); đêm rơi vào ngày đặc biệt của BR-104 lấy giá ngày đó.
- AC3: Given đơn Booking.com/Agoda, When gia hạn 1 đêm, Then tạo đơn con kênh Trực tiếp liên kết đơn gốc (BR-422) với giá trực tiếp hiện hành, folio chung, đơn OTA gốc không đổi; thông báo "tiết kiệm phí kênh" lấy tỷ lệ từ cấu hình kênh BR-901.
- AC4: Given gia hạn thành công, Then ngày đi được cập nhật, buồng → `OD` (BR-802), việc "Dọn trả phòng" đổi thành "Dọn phòng khách đang ở", có lệnh đồng bộ, khai báo của khách NN → `needs_update` (BR-604) và hạn thu tiền gia hạn theo BR-423.
- AC5: Given hai người cùng gia hạn và tạo đơn mới vào cùng đêm, Then chỉ một thao tác thành công (US-018).

#### US-029 – Trả muộn (B15, BR-412, BR-414, BR-416)
- AC1: Given đơn có giá đêm cuối 700.000, When đặt trả muộn 15:00, Then phụ thu đề xuất khớp ví dụ BR-412 (đã tính tham số ân hạn – chờ ESC-007), hiện trước khi lưu và chỉ ghi folio khi lễ tân xác nhận (BR-414).
- AC2: Given căn có khách đến cùng ngày và không còn căn thay thế cùng nhóm, Then `front_desk` bị chặn, chỉ `manager`/`owner` duyệt được (BR-416, A16); Given còn căn thay thế, Then hiện cảnh báo nêu tên khách đến và giờ đến dự kiến.
- AC3: Given giờ trả sau mốc tính tròn 1 đêm của BR-412, Then hệ thống chuyển sang luồng gia hạn 1 đêm (BR-416, US-028).
- AC4: Given lưu trả muộn, Then việc dọn của căn ghi "dọn sau <giờ trả>", hiệu lực mã cửa kéo dài tới giờ trả muộn (BR-403), nhật ký nhắc ghi giờ trả đã chốt.

#### US-030 – Xác nhận giờ trả (UC-14)
- AC1: Given khách trả lời qua điện thoại, When lễ tân chọn giờ 11:00 và ghi chú, Then nhật ký nhắc của đơn có dòng "Gọi điện – khách trả lúc 11:00" với người ghi và thời điểm.
- AC2: Given giờ trả đã được xác nhận, Then thẻ "khách trả phòng hôm nay" của đơn đó chuyển sang trạng thái "đã trả lời".

#### US-031 – Thẻ khách trả phòng hôm nay chưa trả (BR-425)
- AC1: Given đơn `in_house` có ngày đi hôm nay, khách chưa trả lời, When đồng hồ đi qua từng mốc của BR-425, Then trạng thái thẻ đổi đúng thứ tự "Đã nhắc, chờ khách trả lời" → "Chưa trả lời – lễ tân gọi xác nhận" → "Quá giờ trả phòng" (báo đỏ `front_desk` + `manager`); kiểm ở thời điểm ngay trước và ngay sau mỗi mốc, giờ VN (BR-001).
- AC2: Given căn đó có khách đến trong ngày, Then thẻ được xếp lên đầu.

#### US-032 – Dòng phát sinh / phí phạt (UC-17, BR-511, BR-512)
- AC1: Given danh mục phí có "Khử mùi thuốc lá" và "Mất/hỏng thẻ phòng", When lễ tân thêm vào folio, Then giá mặc định khớp BR-511, dòng thuộc loại "Phí phạt" (không phải doanh thu phòng – BR-904), sửa được số lượng và có nhật ký (US-006).
- AC2: Given dòng phí phạt hoặc hư hỏng, When lưu mà không có ảnh/ghi chú bằng chứng, Then bị chặn (BR-511, BR-512).
- AC3: Given folio có dòng phát sinh mới, Then "Còn phải thu" ở chi tiết đơn và ở app khách cập nhật đúng.
- AC4: Given món hư hỏng không có trong bảng giá BR-512, Then lễ tân gửi yêu cầu định giá cho `manager`/`owner` (SM-10).

### EP05 – Trả phòng & bill

#### US-035 – Trả phòng bước 1: minibar (BR-701, BR-702)
- AC1: Given tủ chuẩn căn 201 có 2 lon Coca, When nhập còn 0, Then đã dùng 2 và tiền = 2 × giá bán Coca trong danh mục (BR-702).
- AC2: Given món miễn phí (nước suối), When đã dùng 2, Then dòng ghi "Miễn phí", không cộng tiền nhưng vẫn ghi tiêu hao (BR-701).
- AC3: Given nhập số còn lại lớn hơn mức chuẩn hoặc số âm, Then bị chặn (BR-702).

#### US-036 – Trả phòng bước 2: phụ phí
- AC1: Given đơn có trả muộn đã hẹn, When mở bước 2, Then giờ trả thực tế mặc định = giờ đã hẹn và phụ thu theo BR-412; Given không hẹn, Then giờ mặc định = giờ chuẩn BR-401 và phụ thu = 0 (BR-414).
- AC2: Given nhập giặt ủi 120.000 và chọn cách thanh toán "Chuyển khoản QR", Then bảng tóm tắt "Còn phải thu" cập nhật ngay.
- AC3: Given đơn OTA kiểu "OTA thu hộ" (BR-307), Then bước 2 chỉ còn các khoản phát sinh phải thu tại quầy.

#### US-037 – Trả phòng bước 3: bill
- AC1: Given đơn 3 đêm × 820.000, minibar 25.000, một phụ thu trả muộn (BR-412) có FOC `approved`, chưa cọc, Then bill có 3 dòng tiền phòng, 1 dòng minibar, 1 dòng phụ thu, 1 dòng FOC âm cùng giá trị, tổng = 2.485.000, còn phải thu = 2.485.000.
- AC2: Given khách NN (theo giấy tờ – BR-009) hoặc hồ sơ có ngôn ngữ khác tiếng Việt, Then bill song ngữ Việt – Anh và có dòng quy đổi USD tham khảo theo tỷ giá cấu hình kèm ngày cập nhật (BR-004).
- AC3: Given đơn đã cọc/đã thu một phần, Then dòng "Đã thu" bằng đúng tổng các giao dịch `succeeded` của đơn (US-119).

#### US-038 – Hoàn tất trả phòng (UC-18, B18, SM-13)
- AC1: Given bấm "Đã thu X đ – hoàn tất" và xác nhận (US-135), Then đơn → `checked_out`, folio → `settled` có số bill do server cấp (BR-007), buồng → `VD`, mã cửa hiển thị "đã hủy", có việc "Dọn trả phòng" và (nếu có tiêu hao) "Bổ sung minibar"; khách NN → khai báo `needs_update` (BR-604).
- AC2: Given folio `settled`, When `front_desk` sửa một dòng, Then không được; chỉ `manager`/`owner` tạo bút toán điều chỉnh có lý do (A32).
- AC3: Given còn phải thu > 0 mà chưa ghi giao dịch, When `front_desk` bấm hoàn tất, Then bị chặn; chỉ `manager`/`owner` được ghi công nợ có hạn thanh toán (A19, BR-525).
- AC4: Given folio còn yêu cầu FOC `pending`/`escalated`, Then bị chặn (SM-10).

#### US-039 – Thông tin hóa đơn GTGT công ty
- AC1: Given tích "Khách lấy hóa đơn công ty", When MST không phải 10 hoặc 13 chữ số (cho phép gạch ngang), Then bị chặn với thông báo rõ tại ô (BL 5.16).
- AC2: Given lưu đủ tên công ty, MST, email, Then thông tin gắn với bill và hồ sơ khách để phát hành hóa đơn (phát hành thật ở US-122, R3 – BR-524).

### EP06 – Giấy tờ, khai báo lưu trú & quyền dữ liệu của khách

#### US-042 – Danh sách cần khai báo (UC-12, BR-602, BR-603, BR-611)
- AC1: Given khách VN đến hôm nay chưa khai báo, Then hạn hiển thị theo BR-602; Given khách NN nhận phòng lúc 08:00, Then hạn khớp ví dụ BR-603 (sớm hơn mốc BR-602); Given đơn quá hạn mà khai báo trước `sent`, Then hiện "Đã quá hạn" với màu cảnh báo kèm nhãn chữ.
- AC2: Given đến mốc nhắc của BR-611 mà còn hồ sơ chưa khai, Then người trực (`front_desk`) và `manager` nhận thông báo trong app.
- AC3: Given tham số hạn khai báo đổi sau khi luật sư xác nhận (ESC-001), Then hạn của các đơn chưa khai tính lại mà không đổi code.

#### US-043 – Nhập giấy tờ (K3–K5, BR-601, BR-606, BR-612)
- AC1: Given đơn 2 người lớn, When nhập đủ trường cho người thứ nhất, Then khai báo → `partial`; When nhập đủ người thứ hai, Then → `review` (BR-601).
- AC2: Given trẻ em, Then loại giấy tờ là số định danh cá nhân (BR-612) và không bắt ảnh.
- AC3: Given người lớn từ giấy tờ chưa có trong đơn, When lưu, Then được gắn vào đơn: khớp hồ sơ theo khóa định danh BR-951 nếu có, không thì tạo hồ sơ mới quan hệ "Chưa rõ".
- AC4: Given mỗi lần xem hoặc nhập trường giấy tờ, Then nhật ký truy cập dữ liệu C3 ghi người, thời điểm, đơn (A70 L).

#### US-044 – Đối chiếu tự động (K5, BR-605; HR-07)
- AC1: Given hộ chiếu hết hạn trước hoặc đúng ngày trả phòng, Then kiểm "hộ chiếu còn hạn" = **Không đạt** (khắc phục BL 8.2 #3).
- AC2: Given thiếu dữ liệu để kiểm (ví dụ chưa nhập ngày hết hạn), Then kết quả = **Chưa kiểm được – cần kiểm tay**; mỗi mục kiểm chỉ có 3 kết quả Đạt / Không đạt / Chưa kiểm được và không bao giờ hiện "Đạt" khi chưa thực sự kiểm (HR-07).
- AC3: Given tên đơn "Daniel Weber" và giấy tờ "WEBER DANIEL", Then kiểm tên = Đạt (bỏ dấu, chấp nhận đảo thứ tự – BR-952).
- AC4: Given thị thực hết hạn trước ngày trả phòng, Then cảnh báo đỏ, đơn vào "Cần chú ý", ngày đi khai báo đề xuất = ngày hết hạn thị thực (BR-605); cảnh báo không chặn nhận phòng nhưng phải có ghi chú xử lý mới chuyển được `scanned` (K5).

#### US-045 – Ghi nhận đồng ý lưu ảnh giấy tờ (K5, BR-609)
- AC1: Given đủ giấy tờ, When lễ tân bấm "Đối chiếu xong", Then phải chọn trạng thái đồng ý lưu ảnh **Có** hoặc **Không** (không tích sẵn) mới chuyển `scanned`; chọn "Không" vẫn khai báo bình thường (đồng ý không là điều kiện khai báo – decision-log SEC/BA; sửa trình tự BL 5.12).
- AC2: Given chọn "Không", Then ảnh được đánh dấu xóa ngay khi khai báo `confirmed`, chỉ giữ các trường văn bản cần thiết (BR-609).
- AC3: Given khách đã chọn đồng ý qua check-in online (US-107), Then trạng thái đồng ý được ghi kèm thời điểm, hình thức "qua app" và mục đích.

#### US-046 – Khai báo bán tự động (K6–K8, BR-606)
- AC1: Given đơn có ít nhất một người mang giấy tờ nước ngoài, When mở khai báo, Then tiêu đề "Khai báo tạm trú người nước ngoài"; đơn toàn công dân VN → "Thông báo lưu trú công dân Việt Nam".
- AC2: Given bấm "Sao chép dữ liệu", Then bộ nhớ tạm có đủ trường bắt buộc của từng người theo BR-606, đúng thứ tự cổng yêu cầu; chức năng chỉ có trên máy quầy được cấp và có nút xóa bộ nhớ tạm (A73).
- AC3: Given dán mã hồ sơ và lưu, Then khai báo → `sent`; bấm "Cổng đã xác nhận" → `confirmed` và đơn rời danh sách cần xử lý; bấm "Cổng từ chối" kèm lý do → `scanned` để khai lại.

#### US-047 – Mọi đơn có bản ghi khai báo (K1, BR-608)
- AC1: Given đơn tạo từ mọi luồng (đặt mới, từ báo giá – US-084, đơn OTA, HĐ dài hạn), Then có bản ghi khai báo `none` với số người cần khai = số khách của đơn (khắc phục BL 8.2 #9).
- AC2: Given đơn con gia hạn (BR-422), Then không sinh bản ghi mới mà tạo việc "Cập nhật ngày đi" (BR-608).
- AC3: Given số khách của đơn thay đổi, Then số người cần khai cập nhật theo; nếu khai báo đã `confirmed` → `needs_update` (K9).

#### US-048 – Quyền xem ảnh giấy tờ (A71, D03–D06, BR-610)
- AC1: Given tài khoản `front_desk`, When mở ảnh giấy tờ còn trong hạn lưu BR-610, Then xem được và nhật ký C3 ghi người xem, thời điểm, đơn, người được xem.
- AC2: Given tài khoản `housekeeping`, `maintenance`, `sales_staff` hoặc `collaborator`, When truy cập ảnh hoặc số giấy tờ (kể cả đường dẫn/API trực tiếp), Then bị từ chối, trường không được trả về.
- AC3: Given hồ sơ khách ở CRM, Then số giấy tờ chỉ hiện 4 ký tự cuối (BR-610).
- AC4: Given bất kỳ vai nào, Then không có chức năng xuất hàng loạt dữ liệu giấy tờ (A75).

#### US-049 – Tự xóa ảnh giấy tờ (UC-29, BR-609, BR-610)
- AC1: Given đơn `checked_out` đã quá thời hạn lưu ảnh của BR-610 (giá trị chờ ESC-001), When job xóa chạy, Then ảnh bị xóa (hủy khóa – ADR-013), dữ liệu khai báo dạng chữ giữ theo tham số riêng, nhật ký ghi lần xóa.
- AC2: Given khách chọn không đồng ý lưu ảnh, Then ảnh bị xóa ngay khi khai báo `confirmed` (BR-609).
- AC3: Given khách yêu cầu xóa sớm, When `manager`/`owner` xác nhận (A74, US-135), Then ảnh bị xóa ngay và có nhật ký; `front_desk` không có chức năng này.

#### US-050 – Ngày đi thực tế & hạn tạm trú (K9–K10, BR-604, BR-605)
- AC1: Given khách NN có khai báo `confirmed`, When gia hạn, trả sớm hoặc trả phòng, Then khai báo → `needs_update` và có việc "Cập nhật ngày đi" trong ngày cho `front_desk`; nhập xong → `updated`.
- AC2: Given ngày đi dự kiến sau ngày hết hạn thị thực, When lưu đơn hoặc gia hạn, Then hiện cảnh báo chặn mềm (phải xác nhận lý do), ngày khai không vượt hạn thị thực và có nhắc khách gia hạn trước số ngày của BR-605.

#### US-133 – Khách gửi yêu cầu về dữ liệu cá nhân (UC-30, SEC R-DSR-01) – *mới, Must R3*
- AC1: Given link app khách còn hạn, When khách chọn loại yêu cầu (xem, sửa, xóa, rút đồng ý, nhận bản sao) và gửi, Then yêu cầu được ghi nhận, khách thấy mã yêu cầu, ngày nhận và hạn trả lời (tham số – chờ ESC-001).
- AC2: Given khách rút đồng ý lưu ảnh giấy tờ, Then hồ sơ đồng ý cập nhật ngay và ảnh vào hàng xóa theo BR-609.
- AC3: Given link đã hết hạn (đã trả phòng), Then trang hướng dẫn gửi yêu cầu qua email hoặc tại quầy (lễ tân ghi hộ vào hộp yêu cầu).

#### US-134 – Quản lý xử lý yêu cầu dữ liệu cá nhân (UC-30, R-DSR-02…04, S31) – *mới, Must R3*
- AC1: Given có yêu cầu mới, Then chỉ `manager`/`owner` thấy hộp yêu cầu (S31); trước khi trả dữ liệu phải ghi bước xác minh danh tính người yêu cầu (R-DSR-04).
- AC2: Given yêu cầu xóa, Then hệ thống liệt kê phần xóa được và phần luật buộc giữ (hóa đơn, chứng từ, bằng chứng khai báo) kèm lý do, đưa vào nội dung trả lời khách (R-DSR-03).
- AC3: Given yêu cầu sắp quá hạn trả lời, Then xuất hiện trong "Cần chú ý" của `manager`/`owner`.
- AC4: Given yêu cầu nhận bản sao, When `manager` xuất file, Then file chỉ chứa dữ liệu của đúng khách đó và có nhật ký C3.

### EP07 – Buồng phòng

#### US-052 – Xem trạng thái buồng (S10)
- AC1: Given điện thoại rộng 360px, When `housekeeping` mở màn hình, Then thấy thẻ 10 căn với số căn, nhãn trạng thái bằng chữ (`VC`…`OOO` kèm tên tiếng Việt – BR-801), khách đến kế tiếp, không cuộn ngang.
- AC2: Given chọn lọc "Cần dọn", Then chỉ còn căn `VD`, `OD`, `CL`.
- AC3: Given tài khoản `housekeeping`, Then thẻ căn chỉ hiện tên gọi khách cho căn có việc hôm nay (D01 – Tên+căn), không có kênh, giá (rbac ghi chú 2).

#### US-053 – Đổi trạng thái buồng hợp lệ (SM-03, BR-802)
- AC1: Given căn `VD`, Then chỉ có nút "Bắt đầu dọn" (R1 → `CL`); Given căn `CL` còn đơn `in_house`, Then "Dọn xong" chuyển `OC` (R2), không còn khách → `VC` (R3).
- AC2: Given chuyển sang `VC`/`OC`, Then việc dọn mở đầu tiên của căn tự chuyển `done`.
- AC3: Given căn `VC`, When bấm "Kiểm đạt", Then phải qua checklist US-055 mới chuyển `VI`; `housekeeping` chỉ tự kiểm được khi cơ sở bật chế độ một người và có ảnh (R4, A81).
- AC4: Given gọi một chuyển bị cấm (vào/ra `OOO` bằng tay, `VD` → `VI`, `OC` → `VC`), Then bị từ chối (SM-03).

#### US-054 – Việc hôm nay tự sinh (SM-14, BR-807)
- AC1: Given lễ tân hoàn tất trả phòng căn 201, Then việc "Dọn trả phòng 201" xuất hiện trong danh sách của `housekeeping` trong vòng 1 phút.
- AC2: Given khách gửi yêu cầu "Khăn, đồ dùng" từ app, Then việc có chip "App khách" và ghi chú của khách (BR-811).
- AC3: Given tick xong, Then bộ đếm x/y cập nhật và lễ tân thấy cùng trạng thái.
- AC4: Given danh sách việc, Then sắp theo thứ tự ưu tiên của BR-807.

#### US-055 – Checklist kiểm phòng (R4, BR-808)
- AC1: Given checklist theo BR-808 (nội dung cấu hình được), When chưa tick đủ mục bắt buộc, Then không chuyển được `VI`.
- AC2: Given tick đủ và lưu, Then biên bản kiểm ghi người kiểm, thời điểm, căn (và ảnh nếu có).

#### US-056 – Lịch dọn khách dài hạn (BR-807)
- AC1: Given HĐ có gói dọn "2 lần/tuần – thứ Hai, thứ Năm" với khung giờ theo BR-807, When đến thứ Hai, Then việc "Dọn phòng khách dài hạn" kèm khung giờ xuất hiện trong việc hôm nay và buồng `OC` → `OD` theo lịch gói (R8).
- AC2: Given HĐ kết thúc hoặc khách đổi gói, Then các việc sau ngày đó không còn sinh theo gói cũ.

#### US-057 – Báo sự cố từ điện thoại (W1, BR-809)
- AC1: Given `housekeeping` chọn căn, mô tả "mất nước nóng", đính 1 ảnh, chọn mức, When gửi, Then tạo phiếu `new` nguồn "buồng phòng", mã do server cấp, `maintenance` thấy ngay; mức Cao → báo `maintenance`, `front_desk`, `manager` và vào "Cần chú ý" (BR-809).
- AC2: Given chọn "cần khóa phòng", Then phiếu ghi đề nghị khóa; `front_desk`/`maintenance` xác nhận tạo khối OOO như US-061 (`housekeeping` không tự tạo khối – A86).

### EP08 – Bảo trì

#### US-061 – Tạo phiếu sửa và khóa phòng (UC-24, W1, O1, BR-804)
- AC1: Given tạo phiếu căn 401 có tích "Khóa phòng" với ngày dự kiến xong 17/10, Then khối OOO `active` 15–17/10, buồng → `OOO`, căn bị chặn bán trên rack, kiểm trùng, phòng trống và có lệnh đồng bộ đóng phòng (khắc phục BL 8.2 #5).
- AC2: Given khoảng khóa trùng đơn `hold`/`confirmed` tương lai, When lưu, Then hiện danh sách đơn cần dời; chỉ lưu được khi không còn đơn trùng hoặc `manager`/`owner` xác nhận đã có phương án (O1).
- AC3: Given căn đang có đơn `in_house`, Then không tạo được khối OOO và được gợi ý đổi phòng trước (US-024).
- AC4: Given bỏ trống mô tả, Then không lưu được.

#### US-062 – Cập nhật phiếu sửa (SM-04, O4)
- AC1: Given phiếu có khối OOO liên kết, When chuyển `done` (xác nhận US-135), Then khối → `released`, buồng `OOO` → `VD`, có việc "Dọn sau sửa chữa" và lệnh đồng bộ mở bán.
- AC2: Given đổi trạng thái hoặc người xử lý, Then chỉ theo các chuyển của SM-04 (`new` → `in_progress` ↔ `waiting_parts` → `done`; `cancelled` có lý do) và nhật ký phiếu ghi người đổi, thời điểm.
- AC3: Given phiếu mức Cao của căn có khách đang ở quá thời hạn phương án của BR-809, Then hệ thống gợi ý đổi phòng (US-024) + FOC bù sự cố (US-007).

### EP09 – Kho F&B / minibar

#### US-066 – Danh mục mặt hàng minibar (BR-701, A91)
- AC1: Given `owner` thêm mặt hàng với giá bán "miễn phí", Then khi kiểm minibar mặt hàng đó không tính tiền nhưng vẫn ghi tiêu hao (BR-701).
- AC2: Given đổi giá bán, Then các lần kiểm minibar sau dùng giá mới, dòng folio đã ghi giữ nguyên (BR-006).
- AC3: Given `front_desk` hoặc `housekeeping`, Then không sửa được danh mục, giá bán, giá vốn (A91).

### EP10 – Khách hàng (CRM)

#### US-071 – Tạo/sửa hồ sơ khách
- AC1: Given form hồ sơ, When thiếu họ tên hoặc thiếu cả SĐT lẫn email, Then không lưu được.
- AC2: Given SĐT dưới 9 chữ số hoặc email sai dạng, Then báo lỗi tại ô tương ứng; SĐT/email được chuẩn hóa theo BR-951 trước khi lưu.
- AC3: Given form hồ sơ, Then không có ô nhập tay số giấy tờ (chỉ lấy từ bước giấy tờ – BL 3.16).

#### US-072 – Chặn hồ sơ trùng (BR-951, BR-952)
- AC1: Given đã có khách SĐT 0901 234 567, When tạo khách mới SĐT "+84 901234567", Then bị chặn và có nút "Mở hồ sơ đó" (chuẩn hóa BR-951).
- AC2: Given tên gần giống (BR-952) + cùng ngày sinh nhưng khác SĐT/email, Then chỉ cảnh báo nghi trùng, vẫn cho lưu.

#### US-073 – Bộ chọn khách dùng chung
- AC1: Given gõ "do mai anh" (không dấu), Then kết quả có "Đỗ Mai Anh" (tối đa 5 kết quả, từ 2 ký tự).
- AC2: Given không tìm thấy, When tạo nhanh với SĐT đã tồn tại, Then hiện cảnh báo trùng và nút "Dùng hồ sơ này".
- AC3: Given `sales_staff`/`collaborator`, Then bộ chọn chỉ trả về khách/lead của mình (rbac M6).

### EP11 – Sale, báo giá, giữ chỗ, hợp đồng dài hạn

#### US-080 – Báo giá ngắn ngày (UC-01)
- AC1: Given căn 202, 7 đêm kênh Trực tiếp, When tính, Then tổng tiền khớp ví dụ BR-107; cọc theo BR-305; hoa hồng của người chốt theo BR-903; mã khách quay lại không cộng dồn với giảm theo số đêm (BR-111).
- AC2: Given `collaborator`, Then thấy "Sale nhận" (hoa hồng của mình) nhưng không thấy "OTTIMO còn lại" (rbac ghi chú 34 – PO đồng ý); `sales_staff` thấy cả hai.
- AC3: Given số đêm đạt ngưỡng so sánh của BR-108, Then hiện thêm phương án thuê 1 tháng khớp ví dụ BR-108; đạt ngưỡng bắt buộc → chuyển sang báo giá dài hạn (UC-06).
- AC4: Given vượt sức chứa (BR-110), ngày đã qua hoặc ngoài cửa sổ bán (BR-112), Then lỗi tại ô; Given không còn căn trống, Then báo "Hết phòng trong khoảng ngày" và gợi ý ngày khác.

#### US-081 – Báo giá dài hạn (UC-06)
- AC1: Given dữ liệu ví dụ của BR-208 (căn 302, khách NN, 6 tháng, dọn 2 lần/tuần, 1 người, CTV chốt, vào ở 1/11/2026), When tính với tham số mặc định, Then tiền thuê/tháng, phí dịch vụ + gói dọn, ký quỹ và tổng thu khi chốt khớp ví dụ BR-204, BR-206, BR-208 (công thức BR-203); ngày trả phòng theo BR-209; hoa hồng theo BR-212.
- AC2: Given đổi bất kỳ trường nào, Then kết quả tính lại ngay, không cần bấm nút.
- AC3: Given khách NN, Then có quy đổi USD tham khảo theo tỷ giá cấu hình (BR-004).
- AC4: Given kỳ hạn không trùng mốc, Then áp mức của mốc thấp hơn gần nhất (BR-202); Given sale đặt phí dịch vụ = 0, Then bắt buộc lý do (BR-204 – chờ ESC-005).

#### US-082 – Kiểm phòng trống khi báo giá
- AC1: Given căn chọn bị trùng lịch hoặc có khối OOO, Then chip "Trùng lịch"/"Đang khóa" và danh sách tối đa 6 căn khác còn trống trong cùng khoảng.
- AC2: Given ngày vào ở đã qua, Then báo "Ngày đã qua" và khóa nút tạo giữ chỗ.

#### US-083 – Lưu và gửi báo giá (SM-08 Q1–Q4, BR-304)
- AC1: Given lưu báo giá, Then có mã duy nhất (BR-007), trạng thái `active`, hạn hiệu lực theo BR-304 và snapshot giá, tham số (BR-006).
- AC2: Given chọn ngôn ngữ Anh hoặc Nga, When bấm "Sao chép gửi Zalo", Then văn bản báo giá bằng đúng ngôn ngữ đó và có ngày hết hiệu lực.
- AC3: Given báo giá `expired`, When tạo giữ chỗ từ báo giá đó, Then hệ thống yêu cầu lập báo giá mới theo giá hiện hành hoặc `manager`/`owner` gia hạn (Q4); `sales_staff`/`collaborator` chỉ gửi được yêu cầu gia hạn (A51 = D).

#### US-084 – Tạo đơn giữ chỗ (UC-02, B1, BR-302)
- AC1: Given báo giá `active` và căn còn trống, When tạo giữ chỗ với một mức hạn trong BR-302, Then đơn `hold` (viền đứt trên rack), hạn thực tế theo công thức BR-302 (khớp ví dụ BR-302: tạo 20:00 cho ngày đến hôm sau → hạn là mốc trần của ngày đến), căn bị chặn bán, có lệnh đồng bộ, báo giá → `converted`, lead → `holding`.
- AC2: Given ngày đến là hôm nay, Then không tạo được giữ chỗ và được hướng sang tạo đơn đã thu (UC-02 A1).
- AC3: Given khách chưa có SĐT, Then không tạo được.
- AC4: Given giữ chỗ tạo xong, Then hiện số tiền cần thu (ngắn ngày: cọc BR-305; dài hạn: ký quỹ BR-206/BR-306) và VietQR/nội dung chuyển khoản theo mã đơn (US-120).

#### US-085 – Hết hạn giữ chỗ (B3, B6, BR-303)
- AC1: Given đơn `hold` chưa có giao dịch cọc `succeeded`, When đến hạn, Then trong vòng 5 phút job chuyển đơn → `cancelled` lý do "Hết hạn giữ chỗ", mở phòng, có lệnh đồng bộ, lead → `quoted`, người tạo nhận thông báo (BR-303 – chờ ESC-006).
- AC2: Given đến mốc nhắc trước hạn của BR-303, Then người tạo nhận nhắc và đơn vào "Cần chú ý" với thời gian còn lại.
- AC3: Given người tạo gia hạn giữ chỗ trước hạn, Then hạn mới không vượt mức của BR-303 và trần của BR-302; lần gia hạn thứ hai bị chặn.
- AC4: Given job chạy trễ nhưng đã có giao dịch cọc `succeeded` trước hạn, Then đơn không bị hủy; Given tiền về sau khi đơn đã tự hủy, Then tạo cảnh báo "Tiền về cho đơn đã hủy" cho FD/sale (state-machines 1.3).

#### US-086 – Xác nhận cọc & sinh hợp đồng (UC-03, UC-07, B4, H1)
- AC1: Given đơn `hold` ngắn ngày, When FD+ hoặc `sales_staff` ghi giao dịch ≥ mức cọc BR-305 và xác nhận, Then đơn → `confirmed`, hạn giữ chỗ bị bỏ, lead → `won`, hoa hồng → `projected`.
- AC2: Given thu thiếu, Then giao dịch vẫn được ghi, đơn giữ `hold` và hiện "còn thiếu".
- AC3: Given đơn giữ chỗ dài hạn 1 năm, When xác nhận ký quỹ (BR-206), Then sinh HĐ `signed` với lịch kỳ thu `scheduled` theo BR-207/BR-208 (số tiền mỗi kỳ = (thuê + dịch vụ) × chu kỳ, khớp ví dụ BR-208), ngày kết thúc theo BR-209 (khắc phục BL 8.2 #10).
- AC4: Given `collaborator`, Then không có nút xác nhận cọc; chỉ có "Báo đã chuyển cọc" kèm ảnh biên nhận và FD/sale nhận thông báo (A04 ✖, A53 – chờ INV xác nhận ở decision-log BA).
- AC5: Given xác nhận cọc, Then nhật ký tiền ghi số tiền, cách thanh toán, người xác nhận (BR-008).

#### US-087 – CTV chỉ thấy phần của mình (rbac phạm vi M)
- AC1: Given `collaborator` Minh Anh đăng nhập, When mở danh sách báo giá, đơn, khách tiềm năng, Then chỉ thấy mục do Minh Anh tạo, được gán hoặc là người chốt.
- AC2: Given `collaborator` mở màn Hoa hồng (S17), Then chỉ thấy hoa hồng của mình; gọi API hoa hồng người khác bị từ chối.
- AC3: Given `collaborator`, Then không thấy bất kỳ trường giấy tờ nào của khách, kể cả khách của mình (D03–D07 = K).

### EP14 – App khách

#### US-106 – Mở app khách bằng link/QR (ADR-006, A22)
- AC1: Given đơn `confirmed`, When lễ tân bấm "Gửi link check-in", Then có link riêng của đơn để sao chép; mở link trên điện thoại vào thẳng trang của đơn, không cần cài app hay tạo tài khoản.
- AC2: Given link của đơn A, Then không xem được dữ liệu đơn B; link hết hiệu lực khi đơn `checked_out` (dài hạn: khi HĐ `closed`) – rbac mục 8.6.
- AC3: Given mở phần nhạy cảm (giấy tờ, hóa đơn, mã cửa), Then cần thêm bước xác minh nhẹ do SEC/ARC chốt (ADR-006).

#### US-107 – Check-in online (UC-10, K2)
- AC1: Given khách sắp đến, When hoàn tất các bước (đọc thông báo xử lý dữ liệu → giấy tờ từng người → giờ đến dự kiến → chọn đồng ý lưu ảnh Có/Không, không tích sẵn), Then khai báo → `pre`, `front_desk` thấy giờ đến và nhận thông báo.
- AC2: Given khách bỏ dở ở bước giấy tờ, When mở lại link, Then tiếp tục từ bước còn dở, dữ liệu đã nhập vẫn còn.
- AC3: Given khách chọn **không** đồng ý lưu ảnh, Then vẫn hoàn tất check-in online; ảnh chỉ dùng để khai báo rồi xóa (BR-609, decision-log SEC; thay AC cũ "chưa đồng ý thì không hoàn tất").
- AC4: Given tệp sai loại hoặc quá lớn, Then báo lỗi và cho tải lại; Given link hết hạn hoặc không đúng đơn, Then trang lỗi kèm cách liên hệ lễ tân.
- AC5: Given khách dùng tiếng Anh, Then mọi bước, kể cả thông báo xử lý dữ liệu và mục đồng ý, bằng tiếng Anh đã duyệt (HR-01).

#### US-108 – Thông tin lưu trú
- AC1: Given đơn `confirmed`, Then trang hiện ngày nhận/trả, giờ chuẩn nhận/trả (BR-401), địa chỉ + chỉ đường, nội quy kèm phí phạt (BR-511).
- AC2: Given trước thời điểm hiệu lực của mã cửa (BR-403), Then mã cửa và Wi-Fi bị ẩn với dòng "sẽ hiện vào ngày nhận phòng"; trong khoảng hiệu lực thì hiện; sau khi trả phòng thì ẩn (D22).

#### US-109 – Khách gửi yêu cầu (UC-15, SM-15)
- AC1: Given khách chọn "Báo hỏng" và ghi "Không có nước nóng", When gửi, Then thấy thẻ "Đã gửi" với thời điểm; nhãn trạng thái theo SM-15: Đã gửi · Đã nhận · Đang xử lý · Hoàn thành · Không thực hiện được.
- AC2: Given nhân viên xử lý xong (`done`), Then trang khách đổi thành "Hoàn thành"; Given `declined`, Then khách thấy lý do.

#### US-110 – Định tuyến yêu cầu (BR-811, BR-809)
- AC1: Given yêu cầu "Báo hỏng", Then tạo phiếu sửa mức mặc định theo BR-809 nguồn "App khách"; "Dọn phòng thêm"/"Khăn, đồ dùng" → việc buồng phòng; "Đặt xe, tour"/"Trả muộn"/"Khác" → việc lễ tân (BR-811).
- AC2: Given yêu cầu chưa được "Đã nhận" sau thời hạn của BR-811 trong giờ trực, Then `front_desk` nhận nhắc; ngoài giờ trực, Then khách nhận trả lời tự động kèm giờ xử lý.
- AC3: Given `housekeeping`/`maintenance`, Then chỉ thấy yêu cầu được định tuyến tới bộ phận mình (S30 = T).

#### US-111 – Khách xem folio
- AC1: Given đơn có tiền phòng, 1 dòng minibar và đã cọc, Then trang khách hiện các dòng, tổng, đã trả, còn phải trả khớp với chi tiết đơn ở Desk.
- AC2: Given folio có dòng/ghi chú nội bộ (ví dụ giá vốn, ghi chú lễ tân), Then không hiện cho khách.

#### US-112 – App khách tiếng Anh (HR-01)
- AC1: Given khách bấm chuyển "English", Then mọi chữ trên trang (menu, nút, lỗi, trạng thái yêu cầu) là tiếng Anh; không còn chuỗi tiếng Việt cố định.
- AC2: Given hồ sơ khách có ngôn ngữ "English" hoặc trình duyệt dùng tiếng Anh, When mở link lần đầu, Then trang mặc định tiếng Anh; vẫn chọn tay được ở đầu trang.
- AC3: Given các chuỗi pháp lý (thông báo xử lý dữ liệu, đồng ý, chính sách hủy, nội quy), Then bản tiếng Anh là bản dịch đã được duyệt theo content-guide của UXD, không dịch máy.

### EP15 – Thanh toán & hóa đơn

#### US-119 – Ghi nhận thu tiền (SM-12, BR-521)
- AC1: Given đơn tổng 2.460.000 đã thu cọc 800.000, When ghi thu 1.660.000 bằng chuyển khoản, Then còn phải thu = 0 và đơn có 2 giao dịch `succeeded` với cách thanh toán, người thu, thời điểm.
- AC2: Given đơn OTA kiểu "OTA thu hộ" (BR-307), Then tiền phòng không cộng vào còn phải thu tại quầy, chỉ còn phát sinh.
- AC3: Given ghi thu sai, Then chỉ `manager`/`owner` tạo giao dịch đảo (`reversed`) có lý do; không xóa được (A34, BR-008).
- AC4: Given `sales_staff`, Then chỉ ghi thu cọc cho đơn của mình; `collaborator` không ghi thu được (A33).

#### US-120 – VietQR (I2)
- AC1: Given còn phải thu 1.660.000 và chọn chuyển khoản, Then hiện mã VietQR theo chuẩn với số tiền 1.660.000 và nội dung = mã bill/đơn không dấu cách (BR-521).
- AC2: Given chưa cấu hình tài khoản nhận (chờ ESC-010), Then không hiện QR giả mà hiện "Chưa cấu hình tài khoản nhận" cho `manager`/`owner`.

### EP16 – Giao tiếp với khách

#### US-125 – Mẫu tin nhắn đa ngôn ngữ
- AC1: Given đơn của khách có ngôn ngữ Nga, When chọn mẫu "Link check-in", Then văn bản tiếng Nga có tên khách, ngày nhận/trả, link check-in điền sẵn và nút sao chép.
- AC2: Given đổi ngôn ngữ sang Anh/Việt, Then nội dung đổi tương ứng, dữ liệu đơn giữ nguyên.
- AC3: Given mẫu có chèn mã cửa, Then chỉ FD+ dùng được mẫu đó (D22); mẫu không bao giờ chèn số giấy tờ (rbac mục 8.3).

### EP17 – Khóa cửa & thẻ phòng

#### US-128 – Mã cửa trong đơn (BR-403, A21, D22)
- AC1: Given FD+ nhập mã cửa, Then hiệu lực mặc định từ giờ nhận đến giờ trả (gồm trả muộn đã duyệt) theo BR-403; app khách chỉ hiện mã trong khoảng đó.
- AC2: Given `housekeeping`, `maintenance`, `sales_staff`, `collaborator`, Then không thấy mã cửa của khách; FD+ xem có nhật ký C3.
- AC3: Given trả phòng hoặc đổi phòng, Then mã cũ hiển thị "đã hủy" và có việc nhắc lễ tân xóa mã trên app khóa (MVP nhập tay – chờ ESC-011).

### Story mới Must R3 khác

#### US-139 – Xung đột đơn OTA về trùng (BR-312, SM-01 mục 1.3) – *mới, Must R3*
- AC1: Given channel manager gửi về đơn OTA trùng căn – đêm với đơn đã có, Then đơn OTA vẫn được tạo `confirmed`, gắn cờ "Xung đột", cảnh báo đỏ ngay cho `front_desk` và `manager`.
- AC2: Given đơn có cờ xung đột, Then hệ thống gợi ý dời khách theo thứ tự ưu tiên BR-312 (căn trống cùng nhóm hoặc cao hơn; không dời khách đang ở, khách dài hạn, khách quen) và cờ chỉ tắt khi không còn trùng.

---

## 5. Truy vết bổ sung (đợt 3)

### 5.1 Blocker heuristic của UXR → story/AC
| HR | Vấn đề | Story / AC xử lý |
|---|---|---|
| HR-01 | App khách chỉ tiếng Việt | US-112 AC1–AC3, US-107 AC5, US-115 (RU – R3) |
| HR-04 | Phụ thu nhận sớm tính sẵn khi mở form | US-026 AC1–AC2, US-036 AC1, US-029 AC1 |
| HR-06 | Hủy giữ chỗ một chạm, không xác nhận | US-135 (mới), US-021 AC1–AC2, US-136 AC2, US-038 AC1, US-062 AC1 |
| HR-07 | Kiểm hạn hộ chiếu báo "Khớp" giả | US-044 AC1–AC2 |

### 5.2 Use case → story mới/sửa
| UC | Story |
|---|---|
| UC-05 (no-show, khôi phục) | US-136 (mới), US-021 |
| UC-11 (hoàn tác nhận phòng B17) | US-025 AC5 |
| UC-16 (đổi phòng) | US-024 (nâng Must R2) |
| UC-19 (trả phòng nhanh qua app) | US-138 (mới, Should R3) |
| UC-30 (yêu cầu của chủ thể dữ liệu – SEC R-DSR) | US-133, US-134 (mới, Must R3) |
| SM-01 B16 (trả sớm) | US-137 (mới, Should R2) |
| SM-01 mục 1.3 / BR-312 (xung đột OTA) | US-139 (mới, Must R3) |

### 5.3 Rà soát 4 story "Mới" (không có trong BL) với BR của DOM
| Story | Kết luận | Căn cứ |
|---|---|---|
| US-024 | Khớp BR-424 (đổi phòng), BR-906; **nâng Must R2** vì US-061 và BR-809 cần đổi phòng khi sự cố | SM-01 B7, B14; UC-16 |
| US-124 | Khớp BR-521 (mỗi khoản thu là giao dịch có cách thanh toán) và rbac A44 (FD xem tổng thu ca của mình); giữ Should R3 | – |
| US-127 | Khớp rbac A106 (chỉ `owner`/`manager` sửa mẫu); không có BR mâu thuẫn; giữ Should R3 | – |
| US-132 | Không mâu thuẫn BR; phụ thuộc chính sách cọc/hủy (BR-305, BR-309 – ESC-006) và cổng thanh toán (ESC-010); giữ Could R4+ | ESC-012 phương án C |

### 5.4 Story chịu ảnh hưởng của từng ESC
| ESC | Story |
|---|---|
| ESC-001 (luật sư) | US-022, US-042, US-049, US-133, US-134 |
| ESC-002 (nơi đặt dữ liệu, hosting) | Không đổi AC; ảnh hưởng môi trường chạy thử R2 |
| ESC-004 (giá ngắn ngày) | US-004, US-017, US-028, US-080 |
| ESC-005 (dài hạn, hoa hồng) | US-081, US-086, US-089 |
| ESC-006 (hủy, hoàn, giữ chỗ) | US-021, US-041, US-085, US-093, US-123, US-136, US-137 |
| ESC-007 (phụ thu, FOC) | US-007, US-026, US-027, US-029, US-036 |
| ESC-008 (điện nước, VAT) | US-032, US-064, US-065, US-122 |
| ESC-009 (channel manager) | US-094–US-099, US-139 |
| ESC-010 (tài khoản) | US-042 (ca tối), US-120, US-121, US-122, US-126 |
| ESC-011 (khóa cửa) | US-128, US-130 |
| ESC-012 (phạm vi, mục tiêu) | Toàn bộ ranh giới Round; US-131, US-132 |

## 6. Ghi chú cho các vai
- **DOM:** AC không còn chép con số quy tắc; "khớp ví dụ BR-xxx" phụ thuộc cột ví dụ của BR – nếu DOM sửa ví dụ, báo PO/QA. PO đồng ý đề xuất rbac ghi chú 34 (CTV không thấy "OTTIMO còn lại").
- **BA:** AC đã dùng mã chuyển của `state-machines.md` và hành động A-xx của `rbac-matrix.md`. US-045/US-107 đã sửa theo quyết định "đồng ý lưu ảnh không là điều kiện khai báo".
- **QA:** mỗi AC ở mục 4 là ít nhất một ca kiểm thử; các mốc giờ kiểm bằng đồng hồ giả lập ngay trước/sau mốc; ca phân quyền kiểm cả giao diện lẫn API.
- **ARC:** story có yêu cầu thời gian/đồng thời: US-018, US-023, US-031, US-042, US-085, US-136 (job theo lịch, giờ VN); US-135 là mẫu giao diện chung (UXD).
- **UXD:** US-135 (hộp xác nhận), US-044 (3 trạng thái kiểm tra), US-112 AC3 (chuỗi pháp lý dịch người).

## 7. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 (đợt 1) | Bản đầu: 19 epic, 132 story, AC cho 71 story Must R2 | PO |
| 15/10/2026 | 1 (đợt 3) | AC tham chiếu mã BR (bỏ con số quy tắc), dùng tên trạng thái SM-xx và mã vai RBAC; sửa US-045, US-107 theo quyết định SEC/BA; thêm US-133–US-139 (UC-30, HR-06, no-show, trả sớm, trả phòng nhanh, xung đột OTA); US-024 nâng Must R2; tổng 139 story, 74 Must R2; truy vết HR, UC, ESC | PO |
