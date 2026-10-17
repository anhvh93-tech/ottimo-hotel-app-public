# Product Backlog – OTTIMO Desk

- Chủ sở hữu: PO | Cập nhật: **17/10/2026 (tối) – gộp landing + Zalo OA: EP16 thêm US-161…US-163, chỉnh US-034/040/116/126/138 theo ESC-021, EP19 áp điều kiện SEC, Brand Guidelines v1.0, e-brochure (4 hạng phòng) và ESC-020 L6**; trước đó **17/10/2026 (chiều) – thêm EP19 Landing page ottimo.vn (FB-INV-001, ESC-020)**; trước đó **17/10/2026 – Round 2 nghiệm thu PO Sprint 3 (CI + stack tạm, trước cổng QC)**; trước đó **16/10/2026 – Round 2 khởi động Sprint 3: nghiệm thu PO Sprint 1 + 2 (stack tạm) + áp ESC-015…017**; trước đó 16/10/2026 – Round 2 tuần 1 (W12): áp phạm vi R-C (INV quyết ESC-012 16/10) và kết quả 13 ESC; trước đó 15/10/2026 – Round 1, **bước 4** (sửa theo review BA, DOM, QA; trước đó: bước 2 đợt 3 – hoàn thiện AC theo BR/UC/SM/RBAC)
- Nguồn: `product/docs/PRD.md` (phân hệ M0–M15), `product/docs/round-0-baseline.md` (**BL**), `00-brief/investor-brief.md` (**Brief**), `business-rules.md` (**BR-xxx** – nguồn sự thật cho mọi con số), `use-cases.md` (**UC-xx**), `state-machines.md` (**SM-xx**, mã chuyển), `rbac-matrix.md` (mã vai, hành động **A-xx**, trường **Dxx**), `research/heuristic-review-r0.md` (**HR-xx**), `02-escalations/` (**ESC-xxx**).
- Trạng thái chung: đã qua review bắt buộc BA, DOM (bước 3) và sửa ở bước 4 – xem `rounds/round-01/responses/PO-responses.md`. Bước 4: thêm 6 story (US-140…US-145), US-139 nâng Must R2, US-124 nâng Must R3; tổng **145 story, 77 Must R2**. Đợt 3: mọi con số quy tắc trong tiêu chí nghiệm thu (AC) đã thay bằng **mã BR-xxx**; tên trạng thái theo `state-machines.md`; vai theo mã vai của `rbac-matrix.md`; thêm 7 story (US-133…US-139), nâng US-024 lên Must R2. Chính sách chưa chốt ghi "chờ ESC-xxx".
- **Round 2 tuần 1 (16/10/2026):** INV đã quyết cả 13 ESC theo đề xuất của đội. Áp **R-C**: 5 story dời đầu R3 (US-081, US-111, US-125, US-128, US-141 – Round = R3, trạng thái "Dời"), 4 story làm một phần ở R2 (US-012 trừ AC2, US-086 trừ AC3, US-108 trừ phần mã cửa của AC2, US-119 trừ AC5); thêm **US-017 AC5a tạm** (đơn dài hạn nhập tay). Còn **72 Must R2**, **24 Must R3**. Chỗ ghi "chờ ESC-xxx" nay ghi "INV quyết ESC-xxx 16/10"; nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` chỉ giữ cho thông tin INV còn phải gửi: sức chứa từng căn (ESC-004), loại hình kinh doanh (ESC-008), tài khoản ngân hàng + tên miền (ESC-010), thông tin khóa (ESC-011).
- **Round 2 Sprint 2 – Phản hồi & sửa (16/10/2026, PO):** **US-056 dời đầu R3** (cùng HĐ dài hạn – đơn dài hạn nhập tay AC5a mặc định không có gói dọn, BR-204/DOM D-15) → **71 Must R2**; **US-008 Should R3 → Must R3** (chỉ phần "Thêm người dùng" – R2 đã có khóa/mở, đặt lại mật khẩu ở S26 theo US-002) → Must R3 = 26; sửa **US-012 AC3** theo SEC SR-RET-06, thêm **US-012 AC8** (cảnh báo BR-435 cho OWN ở R2, tính khi đọc), **US-017 AC9** (người chốt bắt buộc với kênh CTV và nguồn `sales_staff`), **US-025 AC7** (ô "Đã giao mã cửa/thẻ" không bắt buộc). Chi tiết: `rounds/round-02/responses/s2-PO.md`.
- **Round 2 – nghiệm thu Sprint 1 + 2 (16/10/2026, PO – ĐK-S2-5 của QC):** nghiệm thu **trên stack tạm (CI compose, run 38911271416), chờ staging** – `rounds/round-02/outputs/PO/acceptance.md`. 30 story: **10 Đạt (stack tạm)** (US-001, 017, 023, 071, 072, 073, 080, 082, 084, 087), **19 Đang nghiệm thu**, **1 chưa làm** (US-022 → Sprint 3). Phần dời đều trong R2 (Sprint 3/4), ghi ở đầu AC từng story (dòng "> Nghiệm thu S2"). Trả lại US-083 AC2 phần tiếng Nga (PO-S2-01). Áp INV quyết 16/10: **ESC-015 A** (ghi chú US-005), **ESC-016 A** (US-109 AC1), **ESC-017 A** (US-084 AC1, US-086 AC5, US-119 AC6) – bổ sung vào AC có sẵn, không thêm số AC.
- **Round 2 – nghiệm thu Sprint 3 (17/10/2026, PO – trước cổng QC Sprint 3):** trên **CI 38998735861 (code `6af7173`) + stack tạm, chờ staging** – `rounds/round-02/outputs/PO/s3-acceptance.md`. 27 story Sprint 3: **17 Đạt (stack tạm)** (US-022, 026, 027, 035, 036, 037, 039, 042, 044, 045, 046, 047, 049, 050, 106, 107, 120), **10 Đang nghiệm thu** (US-025, 028, 029, 030, 031, 032, 038, 043, 048, 119 – phần dời đều Sprint 4), 0 trả lại. Chấm lại phần S1/S2 dời sang S3: lên Đạt US-002, 004, 005, 018, 021, 083, 142; **US-084 hạ về Đang nghiệm thu** (mã VietQR cọc chưa có trên Desk). Phần dời ghi ở dòng "> Nghiệm thu S3" của từng story: mã S4-xx theo `rounds/round-02/s4-carryover.md`; S4-25*…S4-33* là PO đề nghị ORC thêm. **US-066** xếp Sprint 4. Không phần Must R2 nào dời R3. **ESC-019** (giá khi khách xin đổi căn trước ngày đến – S4-21) chờ INV.
- **Round 2 – EP19 Landing page (17/10/2026, PO – FB-INV-001; INV quyết làm landing 17/10):** thêm **EP19** gồm 15 story **US-146…US-160**. **v1** (9 story: 7 Must, 2 Should) – trang giới thiệu công khai ở tên miền gốc, nút "Đặt phòng" mở chat Zalo OA/gọi/email, không form, không thu dữ liệu cá nhân; PO đề xuất làm **song song Sprint 4** bằng UXD + một luồng FE riêng, **không tính vào cổng QC Round 2**, có cổng QA/QC rút gọn riêng trước khi lên mạng (ORC chốt). **v2** (6 story, R3/R4+) nối vào EP18: hộp yêu cầu đặt phòng trong Desk (US-155) → US-131 (phòng trống + giá thật) → US-132. Câu phụ chờ INV ở **ESC-020** (L1–L5); AC viết theo phương án đội đề xuất, đổi theo lựa chọn của INV. Tổng **160 story**; Must R2 không đổi – **71** (ô tổng bảng epic trước đây ghi nhầm 72, đã sửa). Phạm vi chi tiết: `rounds/round-02/outputs/PO/landing-scope.md`.
- **Round 2 – Zalo OA chăm sóc khách (17/10/2026 tối, PO – tin nhắn INV 17/10; ESC-021 chờ INV):** thêm 3 story EP16: **US-161** lịch nhắn tin + "Tin cần gửi hôm nay" (Must R3 – chạy được khi chưa có tài khoản Zalo), **US-162** mời/nhắc check-in online + nhắc trước ngày đến kèm vị trí (Must R3 – lấp khoảng trống INV hỏi), **US-163** hộp thư Zalo OA trong Desk (Could R4+). US-126 giữ **Should R3** (phụ thuộc Zalo duyệt mẫu và tài khoản của INV), xếp Sprint 1 (bản giả lập) → Sprint 2 (nối thật) nếu INV chọn ESC-021 A. US-034 đi qua US-161 từ Sprint 1, tự gửi khi US-126 bật. US-116 tách: cảm ơn + mời đánh giá (Sprint 2–3) và mã đặt trực tiếp (chỉ người đã đồng ý US-077, theo ESC-021 K1). EP19 áp điều kiện SEC (C-1, DOM-05, DOM-06, UXD-02, C-2/C-3 cho US-155), **Brand Guidelines v1.0** (INV 17/10 – màu/chữ/giọng văn, không terracotta, phòng mang tên, không đánh số với khách), e-brochure 2026 (4 hạng phòng) và ESC-020 L6 (ảnh). Tổng **163 story**; Must R2 giữ **71**; Must R3 **26 → 28**.

## 1. Quy ước

| Cột | Ý nghĩa |
|---|---|
| ID | `US-xxx`, không tái sử dụng khi xóa |
| Vai | Nhóm PRD U1–U5 kèm **mã vai** của `rbac-matrix.md` mục 1: U1 `owner` (chủ đầu tư), `manager` (quản lý) · U2 `front_desk_lead` (lễ tân trưởng), `front_desk` (lễ tân, gồm người trực đêm) · U3 `housekeeping` (buồng phòng), `maintenance` (bảo trì/kỹ thuật) · U4 `sales_staff` (sale nội bộ), `collaborator` (CTV/môi giới) · U5 `guest` (khách, qua link của đơn). Vai trong câu story là **người hưởng lợi chính**; quyền thao tác chi tiết theo `rbac-matrix.md` (một tài khoản nhiều vai = hợp quyền). Ký hiệu nhóm: FD+ = front_desk, front_desk_lead, manager, owner; FDL+ = front_desk_lead, manager, owner; MGR+ = manager, owner |
| MoSCoW | **Must** = bắt buộc cho bản RC cuối R3 · **Should** = nên có, dời được nếu thiếu thời gian · **Could** = làm nếu dư · **Won't** = không làm trong MVP (xem PRD 5.3) |
| Round | Round dự kiến giao (R2, R3, R4+ = sau MVP) |
| Nguồn | Mục BL / Brief / decision-log làm căn cứ; "Mới" = không có trong BL, đội đề xuất |
| Trạng thái | Mới · Sẵn sàng (đủ AC, đã review) · Đang làm · **Đang nghiệm thu** (đã giao, PO nghiệm thu từng AC: còn AC đạt một phần/dời trong R2/thiếu bằng chứng/trả lại – xem `rounds/round-<n>/outputs/PO/acceptance.md`) · **Đạt (stack tạm)** (mọi AC phần R2 đạt trên stack CI tạm; chờ PO nghiệm thu lại giao diện trên staging – P-R2-7) · Xong (đạt trên staging) · Dời · Nghiệm thu S3 (17/10) ghi Accepted = **Đạt (stack tạm)**, Accepted một phần = **Đang nghiệm thu** (`rounds/round-02/outputs/PO/s3-acceptance.md`) |

Thứ tự ưu tiên trong R2 nếu thiếu thời gian (PRD D6): EP00 → EP02/EP11 (đơn, chống trùng, giữ chỗ) → EP03–EP05 → EP06 → EP07/EP08 → EP14 → phần còn lại.

## 2. Danh sách epic

| Epic | Tên | Phân hệ PRD | Số story | Must R2 (sau R-C) |
|---|---|---|--:|--:|
| EP00 | Nền tảng: đăng nhập, phân quyền, cấu hình, nhật ký, phê duyệt, xác nhận hành động, thiết bị được cấp, 2FA | M0 | 12 | 9 |
| EP01 | Tổng quan (dashboard) | M1 | 6 | 3 |
| EP02 | Room rack & đặt phòng | M2 | 10 | 10 |
| EP03 | Nhận phòng | M2 | 3 | 3 |
| EP04 | Lưu trú: gia hạn, trả muộn, trả sớm, nhắc trả phòng, phát sinh | M2, M6 | 8 | 5 |
| EP05 | Trả phòng & bill | M2, M6, M12 | 7 | 5 |
| EP06 | Giấy tờ, khai báo lưu trú & quyền dữ liệu của khách | M3 | 12 | 9 |
| EP07 | Buồng phòng | M4 | 9 | 5 (US-056 dời R3 – Sprint 2) |
| EP08 | Bảo trì & điện nước | M5 | 5 | 2 |
| EP09 | Kho F&B / minibar | M6 | 5 | 1 |
| EP10 | Khách hàng (CRM) | M7 | 9 | 3 |
| EP11 | Sale, báo giá, giữ chỗ, hợp đồng dài hạn, đơn nhóm | M8 | 15 | 7 |
| EP12 | Kênh OTA & channel manager | M9 | 7 | 1 |
| EP13 | Báo cáo | M10 | 7 | 0 |
| EP14 | App khách | M11 | 15 | 6 |
| EP15 | Thanh toán & hóa đơn điện tử, đóng ca, vận hành dự phòng | M12 | 7 | 2 |
| EP16 | Giao tiếp với khách (mẫu tin đa ngôn ngữ, lịch nhắn tin, Zalo OA) | M13 | 6 | 0 |
| EP17 | Khóa cửa & thẻ phòng | M14 | 3 | 0 |
| EP18 | Đặt phòng trực tiếp trên web | M15 | 2 | 0 |
| EP19 | Landing page ottimo.vn (website giới thiệu công khai; v1 trước, v2 nối EP18) | M15 (mở rộng – PRD cập nhật sau khi INV trả lời ESC-020) | 15 | 0 (v1 làm song song, không thuộc cổng QC R2) |
| | **Tổng** | | **163** | **71** |

## 3. User story

### EP00 – Nền tảng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-001 | Là **nhân viên OTTIMO** (mọi vai nội bộ) (U1–U4), tôi muốn đăng nhập bằng tài khoản riêng, để mọi thao tác được ghi đúng người làm | Must | R2 | BL 2, BL 7; UC-28 | Đạt (stack tạm) |
| US-002 | Là **chủ đầu tư** (`owner`), tôi muốn gán vai (`owner`, `manager`, `front_desk_lead`, `front_desk`, `housekeeping`, `maintenance`, `sales_staff`, `collaborator`) cho từng tài khoản, để mỗi người chỉ thấy và làm đúng phần việc của mình | Must | R2 | BL 2, BL 8.2 #27, decision-log 15/10 (4 nhóm), rbac mục 1 | Đạt (stack tạm) |
| US-003 | Là **chủ đầu tư** (`owner`), tôi muốn dữ liệu nhạy cảm (giấy tờ tùy thân, giá vốn, P&L, hoa hồng người khác) bị ẩn với vai không được phép ở mọi màn hình, để tránh lộ thông tin và thất thoát | Must | R2 | BL 2 (mâu thuẫn quyền), BL 8.2 #27, BL 5.13 | Đang nghiệm thu |
| US-004 | Là **chủ đầu tư** (`owner`), tôi muốn quản lý danh mục căn (số, tên, nhóm, giá niêm yết đêm/tháng, sức chứa, trạng thái bán), để sơ đồ phòng và giá luôn đúng thực tế | Must | R2 | BL 4.1, BL 9 #1, #5 | Đạt (stack tạm) |
| US-005 | Là **chủ đầu tư** (`owner`), tôi muốn tự chỉnh bảng tham số quy tắc (`business-rules.md` mục 13: giảm giá, phụ thu, cọc, hạn giữ chỗ, giờ chuẩn, đơn giá điện nước, phí phạt, hoa hồng), để đổi chính sách mà không cần lập trình viên | Must | R2 | BL 5 (toàn bộ), BL 4.17, decision-log 15/10 (số quy tắc cấu hình được) | Đạt (stack tạm) |
| US-006 | Là **chủ đầu tư** (`owner`), tôi muốn xem nhật ký mọi thao tác liên quan tới tiền (folio, giảm giá, FOC, hủy, thu tiền) với người làm, thời điểm, giá trị cũ/mới, để kiểm soát thất thoát | Must | R2 | BL 5.7, BL 8.2 #24 | Đang nghiệm thu |
| US-007 | Là **quản lý / lễ tân trưởng** (`manager`, `front_desk_lead`), tôi muốn tự xác nhận các khoản FOC/giảm giá cần duyệt bằng chính tài khoản của mình (không để người thao tác chọn tên người duyệt), để việc miễn phí có người chịu trách nhiệm thật | Must | R2 | BL 5.7, BL 8.2 #24, BL 9 #8 | Đang nghiệm thu |
| US-008 | Là **chủ đầu tư** (`owner`), tôi muốn tự thêm, khóa tài khoản và đặt lại mật khẩu cho nhân viên, để không phụ thuộc đội kỹ thuật khi nhân sự thay đổi | Must (nâng từ Should – R2 Sprint 2, PO) | R3 (phần "Thêm người dùng"; khóa/mở, đặt lại mật khẩu đã có ở R2 – US-002, EP00 mục 2) | Mới | Mới |
| US-009 | Là **chủ đầu tư** (`owner`), tôi muốn chọn cơ sở khi đăng nhập, để sau này quản lý thêm cơ sở thứ hai trên cùng app | Could | R4+ | BL 9 #24, decision-log (đa cơ sở thiết kế sẵn) | Mới |
| US-142 | Là **chủ đầu tư** (`owner`), tôi muốn dữ liệu giấy tờ tùy thân (C3) chỉ mở được trên thiết bị của cơ sở do tôi cấp quyền (máy quầy, máy tính bảng của cơ sở), không bao giờ trên điện thoại cá nhân, để giấy tờ khách không rời khách sạn | Must | R2 | Mới; decision-log SEC (C3 chỉ trên thiết bị được cấp), PHÂN XỬ ORC ca tối; SEC SR-DEV-01…07 | Đạt (stack tạm) |
| US-143 | Là **chủ đầu tư / quản lý** (`owner`, `manager`), tôi muốn đăng nhập có bước xác thực thứ hai (mã từ ứng dụng xác thực), để tài khoản quyền cao không bị chiếm khi lộ mật khẩu | Must | R3 | Mới; decision-log SEC (2FA TOTP trước dữ liệu thật); SEC SR-AUTH-06 | Mới |
| US-135 | Là **nhân viên OTTIMO** (mọi vai nội bộ), tôi muốn mọi hành động không đảo ngược (hủy đơn/giữ chỗ, no-show, hoàn tất trả phòng, đóng/mở bán kênh, gộp hồ sơ, đóng phiếu sửa mở khóa phòng, xóa ảnh giấy tờ) đều có hộp xác nhận nêu rõ hậu quả, để không mất đơn hay sai tiền vì bấm nhầm | Must | R2 | HR-06 (Blocker), BL 8.2 #23 | Đang nghiệm thu |

### EP01 – Tổng quan
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-010 | Là **chủ đầu tư / lễ tân** (`owner`, `front_desk`), tôi muốn thấy KPI đêm nay (công suất, số căn đang ở, khách đến, khách đi, căn khóa) tính từ dữ liệu thật, để nắm tình hình ngay khi mở app | Must | R2 | BL 3.2, BL 8.2 #8, #28, #29 | Mới |
| US-011 | Là **lễ tân** (`front_desk`), tôi muốn danh sách khách đến/đi hôm nay có nút Nhận phòng/Trả phòng và không lẫn đơn hủy hoặc giữ chỗ, để xử lý đúng việc trong ngày | Must | R2 | BL 3.2, BL 8.2 #7 | Mới |
| US-012 | Là **chủ đầu tư / lễ tân** (`owner`, `front_desk`), tôi muốn mục "Cần chú ý" tự sinh từ dữ liệu (chưa khai báo lưu trú, thị thực sắp hết, kỳ thu dài hạn sắp tới, hợp đồng sắp hết hạn, giữ chỗ sắp hết hạn, căn khóa, phiếu sửa mức Cao, đồng bộ kênh lỗi, khách quen/VIP đến hôm nay), để không bỏ sót việc quan trọng | Must | R2 (một phần; AC2 + job J12 → R3 – INV quyết ESC-012 16/10 – R-C) | BL 3.2, BL 8.2 #28, BL 5.20; BR-907 | Mới |
| US-013 | Là **lễ tân** (`front_desk`), tôi muốn thấy số việc buồng phòng chưa xong, phiếu sửa đang mở, yêu cầu khách chưa xử lý và bấm vào để mở đúng màn hình, để điều phối nhanh | Should | R2 | BL 3.2 | Mới |
| US-014 | Là **chủ đầu tư** (`owner`), tôi muốn xem ADR, RevPAR tháng và biểu đồ công suất 30 ngày qua + 14 ngày tới so với mục tiêu công suất G1 (PRD 3.1), để biết cần đẩy bán hay không | Should | R3 | BL 3.2, Brief 1 | Mới |
| US-015 | Là **chủ đầu tư** (`owner`), tôi muốn được cảnh báo khi công suất dự kiến hoặc số căn dài hạn lệch mục tiêu, để hành động sớm | Could | R4+ | BL 9 #25 | Mới |

### EP02 – Room rack & đặt phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-016 | Là **lễ tân** (`front_desk`), tôi muốn xem sơ đồ phòng 10 căn × 14 ngày với thanh đơn phân biệt loại (đang ở, đã xác nhận, dài hạn, giữ chỗ, đã trả, khóa) bằng cả màu và chữ, để thấy ngay phòng trống | Must | R2 | BL 3.3a, BL 8.3 | Đang nghiệm thu |
| US-017 | Là **lễ tân** (`front_desk`), tôi muốn tạo đơn ngắn ngày (căn, kênh, ngày đến, số đêm, số khách, giá/đêm, mã OTA, đã thu qua OTA hay chưa), để mọi đơn – kể cả đơn OTA – nằm ở một nơi | Must | R2 | BL 3.5, BL 8.2 #26 | Đạt (stack tạm) |
| US-018 | Là **lễ tân** (`front_desk`), tôi muốn hệ thống chặn đặt trùng căn – đêm ngay cả khi hai người lưu cùng lúc (đơn OTA đã có thật thì không chặn mà gắn cờ xung đột – US-139), để không bao giờ phải đuổi khách vì trùng phòng | Must | R2 | BL 5.4, BL 8.2 #30; BR-312 | Đạt (stack tạm) |
| US-019 | Là **lễ tân** (`front_desk`), tôi muốn căn đang khóa (OOO) bị coi là không bán được trên sơ đồ, khi kiểm trùng và khi tính phòng trống, để không nhận khách vào phòng hỏng | Must | R2 | BL 8.2 #5 | Đang nghiệm thu |
| US-020 | Là **lễ tân** (`front_desk`), tôi muốn mở chi tiết đơn thấy tiến trình, thông tin khách, folio và chỉ những nút hành động hợp lệ với trạng thái đơn và vai của tôi, để không thao tác nhầm | Must | R2 | BL 3.4, BL 8.2 #27 | Đang nghiệm thu |
| US-021 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn hủy đơn hoặc hủy giữ chỗ với lý do bắt buộc (BR-308), có hộp xác nhận nêu hậu quả và phí hủy/hoàn theo BR-309/BR-310, để có dấu vết và mở lại phòng ngay | Must | R2 | BL 3.18, BL 8.2 #23, BL 9 #6, HR-06, UC-05, ESC-006 | Đạt (stack tạm) |
| US-022 | Là **lễ tân** (`front_desk`), tôi muốn thêm người đi cùng (người lớn có hồ sơ, trẻ em có năm sinh) vào đơn và được cảnh báo khi số người khai ít hơn số khách, để khai báo lưu trú đủ người | Must | R2 | BL 3.4, BL 3.17 | Đạt (stack tạm) |
| US-023 | Là **lễ tân** (`front_desk`), tôi muốn mỗi mã đơn, mã khách, mã phiếu, số bill là duy nhất và không đổi, để tra cứu và đối soát không nhầm | Must | R2 | BL 8.2 #18 | Đạt (stack tạm) |
| US-024 | Là **lễ tân** (`front_desk`), tôi muốn đổi căn hoặc đổi ngày của đơn chưa nhận phòng và đổi phòng cho khách đang ở (có kiểm trùng, lý do bắt buộc, giá theo quy tắc), để xử lý khi khách đổi kế hoạch hoặc phòng có sự cố | Must | R2 | Mới (BL không có); BR-424, BR-906; SM-01 B7, B14; UC-16, UC-23 – **nâng từ Should** vì US-061/BR-809 cần đổi phòng khi có sự cố | Đang nghiệm thu |
| US-136 | Là **lễ tân** (`front_desk`), tôi muốn được nhắc gọi khách chưa đến và tự đánh dấu "không đến" (no-show) sau mốc giờ quy định – hệ thống không tự đánh dấu – và tôi (người trực) tự khôi phục được khi khách đến muộn trong điều kiện an toàn, ngoài điều kiện thì quản lý duyệt, để mở bán lại đêm trống mà không đuổi nhầm khách đến khuya | Must | R2 | BR-311, BR-315; SM-01 B11, B12 (v0.2); UC-05 | Đang nghiệm thu |

### EP03 – Nhận phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-025 | Là **lễ tân** (`front_desk`), tôi muốn nhận phòng cho khách (ghi giờ thực tế, cảnh báo nếu buồng chưa sẵn sàng), để đơn chuyển "đang ở" và buồng chuyển "có khách" đúng lúc | Must | R2 | BL 3.6, BL 5.15 | Đang nghiệm thu |
| US-026 | Là **lễ tân** (`front_desk`), tôi muốn phụ thu nhận sớm tự tính theo bậc giờ và không tự phát sinh phí khi tôi chưa nhập giờ, để thu đúng mà không làm khách khó chịu | Must | R2 | BL 5.6, BL 8.2 #2 | Đạt (stack tạm) |
| US-027 | Là **lễ tân** (`front_desk`), tôi muốn phụ thu nhận sớm/trả muộn của khách dài hạn được tính trên giá đêm quy đổi (không phải giá tháng), để không tính nhầm hàng triệu đồng | Must | R2 | BL 5.6, BL 8.2 #1, BL 9 #7 | Đạt (stack tạm) |

### EP04 – Lưu trú
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-028 | Là **lễ tân** (`front_desk`), tôi muốn gia hạn đơn trong số đêm liên tiếp còn trống (tối đa theo tham số), có giá mặc định theo quy tắc và ghi dòng "thu trực tiếp" với đơn OTA, để bán thêm đêm mà không mất phí kênh | Must | R2 | BL 3.9, BL 5.8, BL 8.2 #12, #13 | Đang nghiệm thu |
| US-029 | Là **lễ tân** (`front_desk`), tôi muốn đặt trả muộn với phụ thu theo bậc giờ, được cảnh báo nếu có khách đến căn đó cùng ngày, và miễn phí (FOC) khi có người duyệt, để linh hoạt mà không ảnh hưởng khách sau | Must | R2 | BL 3.10, BL 5.6, BL 5.7, BL 8.2 #4 | Đang nghiệm thu |
| US-030 | Là **lễ tân** (`front_desk`), tôi muốn ghi giờ trả phòng khách xác nhận và nhật ký các lần nhắc, để cả ca biết khách nào đã trả lời | Must | R2 | BL 3.10, BL 4.15 | Đang nghiệm thu |
| US-031 | Là **lễ tân** (`front_desk`), tôi muốn thẻ "Khách trả phòng hôm nay chưa trả" đổi trạng thái theo giờ thật (chờ trả lời → cần gọi → quá giờ), để biết lúc nào phải gọi khách | Must | R2 | BL 3.3b, BL 5.9 | Đang nghiệm thu |
| US-032 | Là **lễ tân** (`front_desk`), tôi muốn thêm dòng phát sinh vào folio (giặt ủi, đồ ăn, hư hỏng, phí phạt như khử mùi thuốc lá, làm lại thẻ phòng) từ danh mục có giá mặc định, để bill cuối không thiếu khoản nào | Must | R2 | BL 3.7, Brief 5 (phí phạt thực tế) | Đang nghiệm thu |
| US-033 | Là **buồng phòng / lễ tân** (`housekeeping`, `front_desk`), tôi muốn kiểm minibar giữa kỳ cho khách đang ở và ghi tiền vào folio ngay, để không dồn hết vào lúc trả phòng | Should | R2 | BL 3.13 | Mới |
| US-034 | Là **lễ tân** (`front_desk`), tôi muốn hệ thống tự gửi nhắc trả phòng cho khách theo các mốc giờ (tối hôm trước, sáng ngày trả) và nhận lựa chọn của khách (trả đúng giờ / ở thêm / trả muộn), để giảm cuộc gọi | Should | R3 (Sprint 1 qua danh sách gửi tay US-161; tự gửi khi US-126 bật – ESC-021) | BL 5.9, BL 7; DOM TP-07 (BR-425); kênh theo US-161 AC3 | Mới |
| US-137 | Là **lễ tân** (`front_desk`), tôi muốn ghi khách trả phòng sớm hơn ngày đi (mở bán lại các đêm còn lại, tính phần hoàn theo chính sách, cập nhật khai báo khách nước ngoài), để tồn phòng và tiền đúng | Should | R2 | BR-428, BR-604; SM-01 B16; ESC-006 | Mới |

### EP05 – Trả phòng & bill
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-035 | Là **lễ tân** (`front_desk`), tôi muốn bước 1 trả phòng là kiểm minibar (nhập số còn lại, tự tính số đã dùng và tiền, đồ miễn phí không tính tiền), để thu đúng đồ khách dùng | Must | R2 | BL 3.7, BL 5.14 | Đạt (stack tạm) |
| US-036 | Là **lễ tân** (`front_desk`), tôi muốn bước 2 nhập phụ phí, giờ trả thực tế (tự tính phụ thu trả muộn), FOC và cách thanh toán, để chốt mọi khoản trước khi in bill | Must | R2 | BL 3.7, BL 5.6, BL 5.7 | Đạt (stack tạm) |
| US-037 | Là **lễ tân** (`front_desk`), tôi muốn bước 3 xem bill đúng công thức (tiền phòng từng đêm, phát sinh, minibar, phụ thu, dòng FOC âm, trừ đã cọc, còn phải thu), song ngữ Việt – Anh và quy đổi USD tham khảo cho khách nước ngoài, để khách hiểu và trả tiền ngay | Must | R2 | BL 3.8, BL 5.20 | Đạt (stack tạm) |
| US-038 | Là **lễ tân** (`front_desk`), tôi muốn bấm "hoàn tất" để đơn chuyển "đã trả", buồng chuyển "cần dọn", tự tạo việc dọn và bổ sung minibar, bill bị khóa không sửa được (chỉ điều chỉnh có ghi vết), để không còn việc làm tay sau khi khách đi | Must | R2 | BL 3.7, BL 5.15 | Đang nghiệm thu |
| US-039 | Là **lễ tân** (`front_desk`), tôi muốn ghi thông tin xuất hóa đơn GTGT cho công ty (tên, MST, email) ngay trong bước trả phòng, để phát hành hóa đơn đúng | Must | R2 | BL 3.7, BL 5.16 (MST), BL 5.20 | Đạt (stack tạm) |
| US-040 | Là **lễ tân** (`front_desk`), tôi muốn in bill, xuất PDF và gửi bill qua email/Zalo, để khách có chứng từ ngay | Should | R3 | BL 3.8, BL 7; gửi Zalo qua US-126 (ESC-021); **bill đơn OTA không in mã đặt trực tiếp** (DOM BR-981 dự thảo, ESC-021 K1) | Mới |
| US-041 | Là **lễ tân** (`front_desk`), tôi muốn trả phòng cho khách dài hạn với tiền thuê/điện nước kỳ cuối và khấu trừ hoặc hoàn ký quỹ theo chính sách, để kết thúc hợp đồng đúng tiền | Must | R3 | BL 8.2 #6, BL 9 #9; UC-20 | Mới |

### EP06 – Giấy tờ, khai báo lưu trú & quyền dữ liệu của khách
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-042 | Là **lễ tân** (`front_desk`), tôi muốn danh sách khách cần khai báo kèm hạn tính theo BR-602/BR-603 ("khi nhận phòng", "trước <hạn> hôm nay", "đã quá hạn") và được nhắc trước hạn, để không bị phạt | Must | R2 | BL 3.11, BL 5.12 | Đạt (stack tạm) |
| US-043 | Là **lễ tân** (`front_desk`), tôi muốn nhập giấy tờ từng người (chụp/tải ảnh và các trường: họ tên, loại, số, ngày sinh, quốc tịch, hạn hộ chiếu, thị thực, ngày nhập cảnh; trẻ em dùng số định danh), để có đủ dữ liệu khai báo | Must | R2 | BL 3.11, BL 4.12, BL 5.12 | Đang nghiệm thu |
| US-044 | Là **lễ tân** (`front_desk`), tôi muốn hệ thống đối chiếu tự động (tên khớp đơn, hộ chiếu còn hạn sau ngày trả, thị thực còn hạn đến ngày trả, đủ số người), để phát hiện sai sót trước khi khai báo | Must | R2 | BL 5.12, BL 8.2 #3 | Đạt (stack tạm) |
| US-045 | Là **lễ tân** (`front_desk`), tôi muốn ghi nhận khách đã đồng ý cho OTTIMO lưu ảnh giấy tờ trước khi lưu, để tuân thủ luật dữ liệu cá nhân | Must | R2 | BL 5.13, BL 3.11 | Đạt (stack tạm) |
| US-046 | Là **lễ tân** (`front_desk`), tôi muốn khai báo bán tự động: chọn đúng loại (tạm trú người nước ngoài / lưu trú công dân Việt Nam), sao chép dữ liệu, mở cổng Bộ Công an, dán mã hồ sơ, đánh dấu đã xác nhận, để làm nhanh dù cổng chưa có kết nối | Must | R2 | BL 3.11, BL 5.12, BL 9 #15 | Đạt (stack tạm) |
| US-047 | Là **lễ tân** (`front_desk`), tôi muốn mọi đơn (đặt mới, từ báo giá, từ OTA) đều tự có bản ghi khai báo với số người cần khai, để không đơn nào bị sót | Must | R2 | BL 8.2 #9 | Đạt (stack tạm) |
| US-048 | Là **chủ đầu tư** (`owner`), tôi muốn ảnh giấy tờ chỉ lễ tân và quản lý được xem, mỗi lần mở đều ghi nhật ký, hồ sơ khách chỉ hiện 4 số cuối, để bảo vệ dữ liệu nhạy cảm | Must | R2 | BL 5.13, BL 8.2 #27 | Đang nghiệm thu |
| US-049 | Là **chủ đầu tư** (`owner`), tôi muốn ảnh giấy tờ tự xóa sau số ngày cấu hình kể từ ngày trả phòng và xóa sớm khi khách yêu cầu, để không giữ dữ liệu quá mức cần thiết | Must | R2 | BL 5.13, BL 9 #14 | Đạt (stack tạm) |
| US-050 | Là **lễ tân** (`front_desk`), tôi muốn được nhắc cập nhật ngày đi thực tế khi khách nước ngoài gia hạn/trả sớm, và bị cảnh báo khi ngày đi dự kiến vượt hạn thị thực/tạm trú, để khai báo tạm trú luôn đúng | Must | R2 | Brief 5 (khai báo tạm trú), BL 5.12 | Đạt (stack tạm) |
| US-051 | Là **lễ tân** (`front_desk`), tôi muốn quét QR CCCD gắn chip hoặc vùng MRZ hộ chiếu để tự điền thông tin, để giảm gõ tay và sai sót | Should | R3 | BL 3.11, BL 7 | Mới |
| US-133 | Là **khách** (`guest`), tôi muốn gửi yêu cầu xem, sửa, xóa, rút đồng ý hoặc nhận bản sao dữ liệu cá nhân của mình qua app khách hoặc tại quầy và thấy thời hạn trả lời, để thực hiện quyền của chủ thể dữ liệu | Must | R3 | UC-30; SEC R-DSR-01, R-DSR-02; Luật 91/2025 (INV quyết ESC-001 16/10 – luật sư rà soát trước khi có dữ liệu thật) | Mới |
| US-134 | Là **quản lý** (`manager`, `owner`), tôi muốn hộp yêu cầu dữ liệu cá nhân có bước xác minh danh tính, nhắc hạn, liệt kê phần xóa được và phần luật buộc giữ, xuất bản sao dữ liệu của đúng khách đó, để xử lý đúng luật và có dấu vết | Must | R3 | UC-30; SEC R-DSR-02…04; rbac S31, A74 | Mới |

### EP07 – Buồng phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-052 | Là **buồng phòng** (`housekeeping`), tôi muốn xem trạng thái 10 căn trên điện thoại với bộ lọc (cần dọn, có khách, sẵn sàng) và khách đến kế tiếp, để biết dọn căn nào trước | Must | R2 | BL 3.12, BL 4.5 | Mới |
| US-053 | Là **buồng phòng** (`housekeeping`), tôi muốn đổi trạng thái buồng chỉ theo các bước hợp lệ (bắt đầu dọn → dọn xong → kiểm đạt…), dọn xong thì việc dọn tự đánh dấu xong, để lễ tân thấy phòng sẵn sàng ngay | Must | R2 | BL 5.15; UC-22 | Mới |
| US-054 | Là **buồng phòng** (`housekeeping`), tôi muốn danh sách việc hôm nay tự sinh (dọn trả phòng, dọn phòng khách đang ở, bổ sung minibar, yêu cầu từ app khách, lịch dọn dài hạn) và tick xong được, để không cần ai nhắn việc | Must | R2 | BL 3.12, BL 5.15, BL 5.19 | Mới |
| US-055 | Là **buồng phòng** (`housekeeping`), tôi muốn đi qua checklist kiểm phòng trước khi đánh dấu "đã kiểm · sẵn sàng", để phòng đạt chuẩn OTTIMO | Must | R2 | BL 3.12; UC-23 | Mới |
| US-056 | Là **buồng phòng** (`housekeeping`), tôi muốn việc dọn của khách dài hạn tự xuất hiện đúng ngày theo gói dọn (BR-204/BR-807) và khung giờ đã hẹn, để không quên lịch | Must | R3 (dời đầu R3 cùng HĐ dài hạn – PO R2 Sprint 2, E07-06/B-06) | BL 5.15, BL 3.21 | Dời |
| US-057 | Là **buồng phòng** (`housekeeping`), tôi muốn báo sự cố từ điện thoại (căn, mô tả, ảnh, mức độ), để kỹ thuật nhận phiếu ngay | Must | R2 | BL 3.14 | Mới |
| US-058 | Là **buồng phòng** (`housekeeping`), tôi muốn thao tác đổi trạng thái vẫn được ghi nhận khi mạng chập chờn và tự gửi lại khi có mạng, để không phải làm lại | Should | R2 | BL 9 #22 | Mới |
| US-059 | Là **lễ tân** (`front_desk`), tôi muốn phân việc buồng phòng cho từng người và mỗi người chỉ thấy việc của mình trước, để rõ trách nhiệm | Should | R3 | BL 4.6, BL 9 #13 | Mới |
| US-060 | Là **buồng phòng** (`housekeeping`), tôi muốn chụp ảnh phòng sau kiểm và đính vào lần kiểm, để có bằng chứng khi khách phản ánh | Could | R3 | BL 3.12 | Mới |

### EP08 – Bảo trì & điện nước
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-061 | Là **kỹ thuật / lễ tân** (`maintenance`, `front_desk`), tôi muốn tạo phiếu sửa chữa (căn, mức độ, mô tả, người xử lý) và chọn khóa phòng với khoảng ngày dự kiến, để phòng hỏng không bị bán | Must | R2 | BL 3.14, BL 8.2 #5 | Mới |
| US-062 | Là **kỹ thuật** (`maintenance`), tôi muốn cập nhật trạng thái phiếu (mới → đang xử lý → chờ vật tư → xong); khi xong thì căn được mở khóa và chuyển "cần dọn", để phòng quay lại bán nhanh | Must | R2 | BL 3.14, BL 5.15 | Mới |
| US-063 | Là **kỹ thuật** (`maintenance`), tôi muốn việc bảo trì định kỳ tự sinh kỳ kế tiếp và báo trước hạn theo BR-810, để không quên bảo dưỡng | Should | R3 | BL 3.14, BL 4.8; UC-25 | Mới |
| US-064 | Là **kỹ thuật / lễ tân** (`maintenance`, `front_desk`), tôi muốn chốt chỉ số điện nước theo kỳ cho căn dài hạn, bị chặn khi chỉ số mới nhỏ hơn cũ, và xem lịch sử chỉ số, để tính tiền đúng | Must | R3 | BL 3.14, BL 5.10, BL 8.2 #21; UC-21; BR-501, BR-504, BR-505 | Mới |
| US-065 | Là **lễ tân** (`front_desk`), tôi muốn tiền điện nước đã chốt tự vào hóa đơn tháng của khách và hiện trong app khách, để thu không cần nhắn tin tính tay | Must | R3 | BL 5.10, BL 3.21; BR-501, BR-505, BR-506 (dọn lẻ tính vào hóa đơn tháng) | Mới |

### EP09 – Kho F&B / minibar
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-066 | Là **chủ đầu tư** (`owner`), tôi muốn quản lý danh mục mặt hàng minibar/F&B (giá vốn, giá bán hoặc miễn phí, mức chuẩn mỗi tủ, mức tối thiểu), để kiểm minibar và tính tiền đúng | Must | R2 | BL 4.13, BL 5.14 | Mới |
| US-067 | Là **lễ tân** (`front_desk`), tôi muốn nhập kho, xuất kho (có lý do, không vượt tồn) và kiểm kê, xem bảng xuất nhập tồn tháng, để biết hàng còn bao nhiêu | Should | R3 | BL 3.15, BL 5.14; BR-705, BR-706 | Mới |
| US-068 | Là **buồng phòng** (`housekeeping`), tôi muốn tick việc "Bổ sung minibar" thì kho tự trừ và tủ về mức chuẩn, để tồn kho khớp thực tế | Should | R3 | BL 5.14 | Mới |
| US-069 | Là **lễ tân** (`front_desk`), tôi muốn được báo mặt hàng hết hoặc dưới mức tối thiểu, để nhập hàng kịp | Should | R3 | BL 3.15 | Mới |
| US-070 | Là **chủ đầu tư** (`owner`), tôi muốn xem doanh thu, lãi gộp F&B, chi phí đồ miễn phí và mặt hàng bán chạy, để điều chỉnh danh mục | Could | R3 | BL 3.15, BL 5.14 | Mới |

### EP10 – Khách hàng (CRM)
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-071 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn tạo và sửa hồ sơ khách (họ tên, SĐT/Zalo/WhatsApp, email, ngày sinh, quốc tịch, ngôn ngữ, liên hệ ưu tiên, công ty/MST, nhóm khách, sở thích, ghi chú), để phục vụ đúng người | Must | R2 | BL 3.16, BL 5.16 | Đạt (stack tạm) |
| US-072 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn bị chặn khi tạo hồ sơ trùng SĐT hoặc email đã có (và được cảnh báo khi trùng tên + ngày sinh), để không sinh hồ sơ đôi | Must | R2 | BL 5.16 | Đạt (stack tạm) |
| US-073 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn một bộ chọn khách dùng chung (tìm theo tên có/không dấu, SĐT, email, mã KH hoặc tạo nhanh) ở mọi nơi cần chọn khách, để thao tác giống nhau | Must | R2 | BL 3.16 (guestPicker) | Đạt (stack tạm) |
| US-074 | Là **lễ tân** (`front_desk`), tôi muốn gộp hai hồ sơ trùng mà mọi đơn, người đi cùng, khai báo, báo giá, hợp đồng, công tơ đều chuyển theo và có nhật ký gộp, để lịch sử khách liền mạch | Should | R3 | BL 5.16, BL 8.2 #16; BR-953 | Mới |
| US-075 | Là **chủ đầu tư / sale** (`owner`, `sales_staff`), tôi muốn lọc khách theo phân khúc (khách quen, dài hạn, nước ngoài, VIP, người đi cùng, tiềm năng), để chăm sóc đúng nhóm | Should | R3 | BL 4.20 | Mới |
| US-076 | Là **lễ tân** (`front_desk`), tôi muốn xem dòng thời gian, số lượt lưu trú, doanh thu thanh toán và doanh thu phân bổ của khách, để nhận ra khách quen | Should | R3 | BL 3.16, BL 5.11 | Mới |
| US-077 | Là **lễ tân** (`front_desk`), tôi muốn ghi đồng ý nhận ưu đãi riêng từng người và gửi link mời người đi cùng tự điền liên hệ, để làm marketing hợp pháp | Should | R3 | BL 5.18, BL 3.17 | Mới |
| US-078 | Là **lễ tân** (`front_desk`), tôi muốn thấy độ đầy đủ hồ sơ tính đúng (chỉ tính "đồng ý ưu đãi" khi khách đã trả lời), để biết cần hỏi thêm gì | Could | R3 | BL 5.17, BL 8.2 #14; BR-955 | Mới |
| US-079 | Là **lễ tân** (`front_desk`), tôi muốn phát hiện hồ sơ nghi trùng theo tên chính xác hơn (không báo nhầm tên đảo chữ, bắt được tên thiếu một chữ), để gộp đúng | Could | R3 | BL 8.2 #15 | Mới |

### EP11 – Sale, báo giá, giữ chỗ, hợp đồng dài hạn
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-080 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn báo giá ngắn ngày (giảm theo số đêm, cọc, hoa hồng của tôi, phần OTTIMO còn lại), để trả lời khách ngay trong cuộc chat | Must | R2 | BL 5.3 | Đạt (stack tạm) |
| US-081 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn báo giá dài hạn theo kỳ hạn, loại khách, gói dọn, số người (tiền thuê, phí dịch vụ, điện nước ước tính, ký quỹ, chu kỳ thu, thu khi chốt, hoa hồng, phần OTTIMO còn lại), để chốt hợp đồng tháng nhanh | Must | R3 (dời đầu R3 – INV quyết ESC-012 16/10 – R-C) | BL 5.2 | Dời |
| US-082 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn biết căn còn trống trong khoảng ngày và được gợi ý căn trống khác, để không hứa phòng đã có khách | Must | R2 | BL 5.4 | Đạt (stack tạm) |
| US-083 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn lưu báo giá (có mã, hạn hiệu lực theo tham số) và sao chép văn bản báo giá Việt/Anh/Nga để gửi Zalo, để khách nhận báo giá chuyên nghiệp | Must | R2 | BL 3.18, BL 5.4, BL 8.2 #19, decision-log P4 | Đạt (stack tạm) |
| US-084 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn tạo đơn giữ chỗ từ báo giá với hạn giữ theo BR-302 và cách nhận cọc, căn bị khóa ngay, để khách yên tâm chuyển cọc | Must | R2 | BL 3.18, BL 5.5 | Đang nghiệm thu |
| US-085 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn giữ chỗ quá hạn mà chưa cọc được hệ thống tự xử lý theo chính sách BR-303 (mặc định tự hủy, mở lại phòng – INV quyết ESC-006 16/10) và báo cho tôi, để phòng không bị "treo" | Must | R2 | BL 5.5, BL 8.2 #19, BL 9 #11 | Đang nghiệm thu |
| US-086 | Là **sale / lễ tân** (`sales_staff`, `front_desk`), tôi muốn xác nhận đã nhận cọc/ký quỹ để đơn chuyển "đã xác nhận" và – với dài hạn – sinh hợp đồng có lịch thu theo kỳ đúng công thức, để không phải lập lịch thu bằng tay | Must | R2 (một phần; AC3 → R3 – INV quyết ESC-012 16/10 – R-C) | BL 3.18, BL 5.5, BL 8.2 #10 | Đang nghiệm thu |
| US-087 | Là **CTV** (`collaborator`), tôi muốn chỉ thấy báo giá, đơn, khách tiềm năng và hoa hồng của chính mình, để thông tin của người khác được bảo mật | Must | R2 | BL 2, BL 8.2 #27 | Đạt (stack tạm) |
| US-088 | Là **lễ tân / chủ đầu tư** (`front_desk`, `owner`), tôi muốn danh sách hợp đồng dài hạn với kỳ thu tới, được nhắc trước hạn thu theo BR-207 và ghi nhận đã thu từng kỳ, để không sót tiền thuê | Must | R3 | BL 3.18, BL 5.20; UC-08. **Bước 4:** phần "ghi nhận đã thu từng kỳ" đã kéo lên R2 trong US-119 AC5 để vòng đời HĐ tạo ở R2 không bị kẹt (FB-R1-BA-PO-04); R3 còn danh sách HĐ, nhắc thu, quá hạn | Mới |
| US-089 | Là **chủ đầu tư** (`owner`), tôi muốn hoa hồng CTV/sale được ghi nhận theo từng hợp đồng/đơn, đánh dấu đã chi theo đợt, và mỗi người xem phần của mình, để chi đúng, đủ | Must | R3 | BL 3.18, BL 5.2, BL 9 #3; UC-26; màn tổng hợp "Hoa hồng của tôi" (S17) chuyển từ US-087 sang đây | Mới |
| US-090 | Là **sale** (`sales_staff`), tôi muốn bảng kanban khách tiềm năng (mới → đã báo giá → giữ chỗ → đã chốt) gắn với hồ sơ khách theo mã (không theo tên), để theo dõi cơ hội | Should | R3 | BL 3.18, BL 8.2 #17 | Mới |
| US-091 | Là **sale** (`sales_staff`), tôi muốn được nhắc chào gia hạn hợp đồng trước khi hết hạn theo tham số, để giữ khách dài hạn | Should | R3 | BL 5.20 | Mới |
| US-092 | Là **sale / chủ đầu tư** (`sales_staff`, `owner`), tôi muốn xuất hợp đồng thuê dài hạn ra PDF từ mẫu có sẵn dữ liệu, để ký nhanh | Should | R3 | BL 9 #17 | Mới |
| US-140 | Là **sale / lễ tân** (`sales_staff`, `front_desk`), tôi muốn tạo **đơn nhóm** gồm nhiều căn cho một người đặt/người trả (gia đình, nhóm bạn, công ty) với cọc chung phân bổ theo căn, hủy từng căn hoặc cả nhóm, bill gộp hoặc tách và danh sách khách từng căn, để không phải cộng tay 3 đơn rời và không sai tiền lúc đông khách | Must | R3 | Mới; FB-R1-DOM-PO-02; BR-321…326; UC-31; BR-309 | Mới |
| US-093 | Là **chủ đầu tư** (`owner`), tôi muốn xử lý chấm dứt hợp đồng sớm theo chính sách (phạt, hoàn ký quỹ), để quy trình rõ ràng | Should | R3 | BL 9 #6; UC-09; BR-313, BR-314 | Mới |

### EP12 – Kênh OTA & channel manager
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-094 | Là **lễ tân** (`front_desk`), tôi muốn mỗi thay đổi phòng trống (đặt, giữ chỗ, gia hạn, khóa, hủy) tạo một lệnh đồng bộ kênh trong nhật ký (giả lập ở R2), để R3 nối channel manager không phải sửa luồng | Should | R2 | BL 5.21, BL 3.19 | Mới |
| US-095 | Là **lễ tân** (`front_desk`), tôi muốn đơn từ OTA tự vào Desk qua channel manager, tự tạo/gắn hồ sơ khách theo SĐT/email, để không nhập tay | Must | R3 | BL 3.19, BL 5.21, BL 9 #18, Brief 7 #3; đơn về trùng đi theo luồng xung đột của US-139 | Mới |
| US-096 | Là **lễ tân** (`front_desk`), tôi muốn phòng trống được đẩy tự động lên mọi kênh khi có thay đổi, để tránh trùng phòng giữa các OTA | Must | R3 | BL 5.21 | Mới |
| US-097 | Là **chủ đầu tư** (`owner`), tôi muốn sửa giá theo nhóm căn × ngày và đẩy lên các kênh, bị chặn khi giá trống/0 hoặc ngoài giá sàn–trần, để quản lý giá ở một nơi | Should | R3 | BL 3.19, BL 8.2 #20 | Mới |
| US-098 | Là **chủ đầu tư** (`owner`), tôi muốn xem trạng thái kết nối từng kênh và bật/tắt mở bán, để kiểm soát kênh | Should | R3 | BL 3.19 | Mới |
| US-099 | Là **chủ đầu tư** (`owner`), tôi muốn mỗi đơn lưu phí kênh thực tế (theo tỉ lệ kênh hoặc số OTA báo), để báo cáo thực thu đúng | Must | R3 | BL 5.11, BL 8.2 #11, #12 | Mới |
| US-139 | Là **lễ tân** (`front_desk`), tôi muốn đơn OTA trùng căn – đêm (nhập tay ở R2, về tự động ở R3 qua US-095) vẫn được nhận, gắn cờ xung đột, nằm ở làn "Chưa gán căn", báo đỏ ngay cho tôi và quản lý kèm gợi ý căn, để xử lý trước khi khách đến | Must | R2 | BR-312, BR-905; SM-01 mục 1.3; **bước 4: nâng từ R3** (FB-R1-BA-PO-01, QA #2); phần đơn về tự động vẫn R3 (US-095) | Đang nghiệm thu |

### EP13 – Báo cáo
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-100 | Là **chủ đầu tư** (`owner`), tôi muốn báo cáo vận hành theo tháng (công suất trừ phòng khóa, không tính giữ chỗ, ADR, RevPAR, thời gian ở trung bình theo kênh, cơ cấu ngắn/dài hạn), để quyết định giá và kênh | Must | R3 | BL 3.20, BL 5.11, BL 8.2 #8, #29; BR-215, BR-902; metrics R-01…R-07 | Mới |
| US-101 | Là **chủ đầu tư** (`owner`), tôi muốn báo cáo kênh bán (doanh thu, phí kênh, thực thu theo kênh), để biết kênh nào thực sự lời | Must | R3 | BL 5.11, BL 8.2 #11 | Mới |
| US-102 | Là **chủ đầu tư** (`owner`), tôi muốn báo cáo FOC theo tháng (tổng giá trị, số lần, lý do, người duyệt), để soát thất thoát | Must | R3 | BL 5.7 | Mới |
| US-103 | Là **chủ đầu tư** (`owner`), tôi muốn nhập chi phí vận hành trong app và xem lãi lỗ đơn giản (doanh thu, chi phí, GOP, GOPPAR), với doanh thu dài hạn ghi nhận theo quy ước của DATA, để biết lãi thật | Should | R3 | BL 5.11, BL 8.2 #22, BL 9 #26 | Mới |
| US-104 | Là **chủ đầu tư** (`owner`), tôi muốn xuất báo cáo ra file bảng tính, để gửi kế toán | Should | R3 | BL 7 | Mới |
| US-144 | Là **chủ đầu tư** (`owner`), tôi muốn chốt số liệu tháng (khóa số đã báo cáo, chỉ điều chỉnh bằng bút toán có ghi vết sang tháng sau), để báo cáo đã gửi kế toán không tự đổi | Could | R3 | Mới; `metrics-definitions.md` (MonthClose, ngày chốt 5), ERD; PO review DATA-02 | Mới |
| US-105 | Là **chủ đầu tư** (`owner`), tôi muốn nhập điểm đánh giá theo kênh và xem tổng hợp khen/chê, để cải thiện dịch vụ | Could | R3 | BL 3.20 | Mới |

### EP14 – App khách
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-106 | Là **khách** (`guest`), tôi muốn mở trang của đơn mình bằng link hoặc QR mà không cần cài app hay tạo tài khoản, để dùng ngay | Must | R2 | BL 3.21, BL 7 | Đạt (stack tạm) |
| US-107 | Là **khách sắp đến** (`guest`), tôi muốn check-in online (tải giấy tờ từng người, giờ đến dự kiến, đồng ý lưu giấy tờ), để nhận phòng nhanh tại quầy | Must | R2 | BL 3.21, BL 5.12, BL 5.13 | Đạt (stack tạm) |
| US-108 | Là **khách** (`guest`), tôi muốn xem thông tin lưu trú (ngày, giờ nhận/trả, Wi-Fi, mã cửa khi đến hạn, chỉ đường, nội quy và phí phạt), để không phải hỏi lễ tân | Must | R2 (một phần; phần mã cửa của AC2 → R3 – INV quyết ESC-012 16/10 – R-C) | BL 3.21, Brief 5 | Mới |
| US-109 | Là **khách đang ở** (`guest`), tôi muốn gửi yêu cầu (dọn thêm, khăn/đồ dùng, báo hỏng, đặt xe/tour, trả muộn, khác) và thấy yêu cầu đã được nhận/xử lý, để yên tâm | Must | R2 | BL 5.19, Brief 5 (sự cố thường gặp) | Mới |
| US-110 | Là **lễ tân / buồng phòng / kỹ thuật** (`front_desk`, `housekeeping`, `maintenance`), tôi muốn yêu cầu của khách tự vào đúng hàng việc (việc buồng phòng, phiếu sửa, việc lễ tân) và có báo mới, để phản hồi trong thời gian cam kết | Must | R2 | BL 5.19, BL 3.21 | Mới |
| US-111 | Là **khách** (`guest`), tôi muốn xem folio/hóa đơn tạm tính của đơn (tiền phòng, phát sinh, đã trả, còn phải trả), để không bất ngờ khi trả phòng | Must | R3 (dời đầu R3 – INV quyết ESC-012 16/10 – R-C) | BL 3.21 | Dời |
| US-112 | Là **khách nước ngoài** (`guest`), tôi muốn chuyển trang của mình sang tiếng Anh, để hiểu mọi nội dung | Must | R2 | BL 1, DoD (VI + EN), decision-log P4 | Mới |
| US-113 | Là **khách trả phòng hôm nay** (`guest`), tôi muốn tự chọn trả đúng giờ, ở thêm (nếu còn phòng) hoặc trả muộn có phí hiển thị trước, để không phải gọi lễ tân | Should | R3 | BL 3.21, BL 5.9 | Mới |
| US-114 | Là **khách dài hạn** (`guest`), tôi muốn xem hợp đồng, lịch dọn, kỳ thanh toán tới và hóa đơn điện nước hằng tháng, để chủ động thanh toán | Must | R3 | BL 3.21, BL 5.10 | Mới |
| US-115 | Là **khách nói tiếng Nga** (`guest`), tôi muốn dùng trang của mình bằng tiếng Nga, để thoải mái hơn | Must | R3 | Brief 5, decision-log P4 | Mới |
| US-116 | Là **chủ đầu tư** (`owner`), tôi muốn app tự hỏi thăm khách theo mốc cấu hình (BL 5.18), gửi lời cảm ơn + mã giảm đặt trực tiếp khi trả phòng và mời đánh giá trên kênh khách đã đặt theo mốc cấu hình, để tăng điểm đánh giá và khách quay lại | Should | R3 (Sprint 2–3, sau US-161/US-126; tách 2 phần – xem ghi chú mục 4 EP16) | BL 5.18; DOM TP-05/06/08/09/10; SEC INT-11, DOM-05 (mã giảm là tin marketing, cần đồng ý US-077); ESC-021 K1 | Mới |
| US-117 | Là **khách** (`guest`), tôi muốn xem gợi ý Đà Lạt (điểm tham quan, quán cà phê) và nhờ OTTIMO đặt xe/tour, để có trải nghiệm tốt | Could | R3 | BL 3.21 | Mới |
| US-118 | Là **lễ tân** (`front_desk`), tôi muốn ghi nhận đồ khách để quên và thông báo cho khách, để xử lý chuyên nghiệp | Could | R3 | Brief 5 (sự cố thường gặp); BR-513 | Mới |
| US-141 | Là **khách** (`guest`), tôi muốn xác minh nhẹ bằng mã một lần gửi tới email của đơn (hoặc mã do lễ tân cấp) trước khi xem mã cửa, hóa đơn, giấy tờ trên app khách, để người cầm được link của tôi không xem được thông tin riêng | Must | R3 (dời đầu R3 – INV quyết ESC-012 16/10 – R-C) | Mới; decision-log SEC (app khách mức 2), PHÂN XỬ ORC (khách không có email); SEC SR-GST-07…11; ADR-006 | Dời |
| US-138 | Là **khách trả phòng sớm buổi sáng** (`guest`), tôi muốn tự bấm "Trả phòng" trên app khi đã thanh toán đủ và nhận bill qua email/Zalo, để không phải chờ quầy mở | Should | R3 | BR-427; UC-19; SM-01 B18; bill qua Zalo dùng US-126 (ESC-021) | Mới |

### EP15 – Thanh toán & hóa đơn điện tử
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-119 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn ghi nhận các lần thu tiền của một đơn (cọc, thu khi nhận, thu khi trả, theo kỳ) theo cách thanh toán (chuyển khoản, thẻ, tiền mặt, đã thu qua OTA), để số "còn phải thu" luôn đúng | Must | R2 (một phần; AC5 → R3 – INV quyết ESC-012 16/10 – R-C) | BL 3.7, BL 5.20 | Đang nghiệm thu |
| US-120 | Là **lễ tân** (`front_desk`), tôi muốn hiện mã VietQR đúng số tiền với nội dung chuyển khoản là mã bill/đơn, để khách chuyển đúng và dễ đối soát | Must | R2 | BL 3.8, BL 5.20, decision-log (VietQR) | Đạt (stack tạm) |
| US-121 | Là **khách** (`guest`), tôi muốn thanh toán cọc/tiền phòng qua VNPay hoặc MoMo bằng link, để trả nhanh từ xa | Should | R3 | Brief 7 #4, BL 9 #20 | Mới |
| US-122 | Là **lễ tân** (`front_desk`), tôi muốn hóa đơn điện tử được phát hành qua MISA meInvoice khi thu tiền (khách lẻ hoặc công ty), để tuân thủ thuế | Must | R3 | BL 5.20, Brief 7 #3, BL 9 #16; BR-523, BR-524 | Mới |
| US-123 | Là **quản lý** (`manager`), tôi muốn ghi nhận hoàn cọc/hoàn tiền có lý do và người duyệt, để khớp sổ | Should | R3 | BL 9 #6, BL 8.2 #23 | Mới |
| US-145 | Là **lễ tân / quản lý** (`front_desk`, `manager`), tôi muốn có bảng dự phòng in sẵn mỗi sáng (khách đến/đi, căn, còn phải thu – không có số giấy tờ, mã cửa), hướng dẫn khi mất mạng/mất điện và được nhập bù giao dịch theo giờ thực tế kèm lý do khi có mạng lại, để quầy vẫn chạy và dữ liệu không sai khi sự cố | Should | R3 | Mới; UC-33; BR-961…964; FB-R1-DOM-BA-04 | Mới |
| US-124 | Là **lễ tân** (`front_desk`), tôi muốn **đóng ca / bàn giao ca**: tổng thu của ca theo cách thanh toán, tiền mặt đếm thực tế so với hệ thống (chênh phải có lý do), danh sách chuyển khoản ghi tay "chờ đối soát" để quản lý tick sau khi xem sao kê, và việc tồn (khai báo, khách chưa đến), để kiểm soát tiền mặt và chuyển khoản mỗi ca | Must | R3 | Mới; BR-521, rbac A44; BR-526, BR-527; UC-32; **bước 4: nâng từ Should, mở rộng** (FB-R1-DOM-PO-06) | Mới |

### EP16 – Giao tiếp với khách
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-125 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn chọn mẫu tin nhắn theo tình huống (xác nhận đặt, link check-in, nhắc trả phòng, nội quy, xin lỗi sự cố nước nóng…) bằng Việt/Anh/Nga có sẵn dữ liệu đơn và sao chép được, để nhắn nhóm chat nhanh, đúng ngôn ngữ | Must | R3 (dời đầu R3 – INV quyết ESC-012 16/10 – R-C) | Brief 5, decision-log P4 | Dời |
| US-126 | Là **lễ tân** (`front_desk`), tôi muốn tin nhắn quan trọng (xác nhận, link check-in, nhắc trước ngày đến, nhắc trả phòng, bill) tự gửi qua Zalo OA/ZNS hoặc email, để không phải gửi tay | Should | R3 (Sprint 1 bản giả lập → Sprint 2 nối Zalo thật nếu INV chọn ESC-021 A; email độc lập với Zalo) | BL 7, BL 9 #19; tin nhắn INV 17/10; ESC-021 (mở lại phần Zalo của ESC-010); `integrations/zalo-oa.md`; SEC C-4…C-9 | Mới |
| US-161 | Là **lễ tân** (`front_desk`), tôi muốn Desk tự lập lịch tin cần gửi cho từng đơn (xác nhận, mời/nhắc check-in online, nhắc trước ngày đến, nhắc trả phòng, cảm ơn, nhắc kỳ thu dài hạn) và mỗi sáng hiện danh sách "Tin cần gửi hôm nay" soạn sẵn đúng ngôn ngữ để tôi bấm sao chép, để không quên nhắn khách kể cả khi chưa có Zalo OA | Must | R3 (Sprint 1) | Tin nhắn INV 17/10; DOM `guest-messaging-journey.md` TP-00…TP-15, BR-971…983 (dự thảo); US-125 (mẫu tin); SEC DOM-04, INT-09 | Mới |
| US-162 | Là **khách** (`guest`), tôi muốn nhận lời mời làm check-in online, lời nhắc nếu chưa làm, và tin nhắc trước ngày đến có giờ nhận phòng, địa chỉ, nút chỉ đường, chỗ đỗ xe, để đến nơi nhanh mà không phải hỏi | Must | R3 (Sprint 1 nội dung + gửi tay qua US-161; tự gửi khi US-126 bật) | Tin nhắn INV 17/10 ("remind ngày nhận phòng, gửi vị trí"); DOM TP-02, TP-03; US-107, US-108 (cùng nguồn địa chỉ với US-148) | Mới |
| US-163 | Là **lễ tân** (`front_desk`), tôi muốn đọc và trả lời tin Zalo OA của khách ngay trong Desk, gắn với đơn của khách, để không phải mở OA Manager riêng | Could | R4+ (sau ~1 tháng chat OA – ESC-021) | `integrations/zalo-oa.md` 4.9 giai đoạn 2; SEC INT-07 (webhook có chữ ký), INT-12 | Mới |
| US-127 | Là **chủ đầu tư** (`owner`), tôi muốn sửa nội dung các mẫu tin, để phù hợp giọng văn OTTIMO | Should | R3 | Mới; rbac A106 (`owner`, `manager`) | Mới |

### EP17 – Khóa cửa & thẻ phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-128 | Là **lễ tân** (`front_desk`), tôi muốn nhập mã cửa (và thời hạn hiệu lực) vào đơn, để khách thấy mã trong app từ ngày nhận phòng | Must | R3 (dời đầu R3 – INV quyết ESC-012 16/10 – R-C) | Brief 7 #3, decision-log (khóa thông minh) | Dời |
| US-129 | Là **lễ tân** (`front_desk`), tôi muốn ghi số thẻ phòng đã cấp/thu cho từng đơn và tự thêm phí khi thiếu thẻ lúc trả phòng, để không thất thoát thẻ | Should | R3 | Brief 5 (phí làm lại thẻ) | Mới |
| US-130 | Là **lễ tân** (`front_desk`), tôi muốn app tự tạo mã cửa có hạn (theo ngày sinh nhật khách nếu khách muốn) qua API hãng khóa, để không phải đặt mã trên app khóa riêng | Could | R4+ | Brief 7 #3 | Mới |

### EP18 – Đặt phòng trực tiếp trên web
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-131 | Là **khách** (`guest`), tôi muốn xem phòng trống và giá trực tiếp trên website OTTIMO rồi gửi yêu cầu giữ chỗ, để đặt mà không qua OTA | Should | R3 | BL 3.19 (kênh Website), BL 5.11 (giảm phí kênh); **FB-INV-001 (17/10):** chạy trên landing EP19 – là bản v2 của nút "Đặt phòng" (US-151), dùng chung hộp yêu cầu US-155 | Mới |
| US-132 | Là **khách** (`guest`), tôi muốn đặt và thanh toán ngay trên website mà không cần chờ xác nhận, để chốt nhanh | Could | R4+ | Mới; phụ thuộc BR-305, ESC-006 (chính sách hủy), ESC-010 (cổng thanh toán); **FB-INV-001:** đích cuối của nút "Đặt phòng" trên landing EP19 | Mới |

### EP19 – Landing page ottimo.vn (website giới thiệu công khai)
Nguồn chung: **FB-INV-001** (INV 17/10/2026 – "landing page kiểu ottimo.vn để khách tham khảo, tìm hiểu thông tin và đặt phòng"; quyết làm 17/10), câu phụ **ESC-020**. Phạm vi, khe ảnh, ước lượng: `rounds/round-02/outputs/PO/landing-scope.md`. Round **"R2 – LP-v1"** = đề xuất làm song song Sprint 4 bằng UXD + một luồng FE riêng, không tính vào cổng QC R2; nếu ORC xếp sang R3 thì đổi thành R3 (đầu round). Trang ở **tên miền gốc** (`hosting-plan.md` 5.1); app giữ desk./staff./g.

| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-146 | Là **khách tiềm năng**, tôi muốn mở ottimo.vn và thấy ngay OTTIMO là gì (ảnh mặt tiền/sảnh, câu giới thiệu, ở đâu, ngắn ngày hay thuê tháng) cùng nút "Đặt phòng" luôn trong tầm tay, để quyết định có tìm hiểu tiếp không | Must | R2 – LP-v1 | FB-INV-001; Brief 1, 2 | Mới |
| US-147 | Là **khách tiềm năng**, tôi muốn xem 10 căn theo 4 hạng phòng của e-brochure (ánh xạ 3 nhóm giá Lầu 1–2, Căn N, Căn N+) với ảnh, sức chứa, tiện nghi chính và giá theo ESC-020 L3, để chọn loại căn hợp với mình | Must | R2 – LP-v1 | FB-INV-001; Brief 1; BL 4.1; BR-101, BR-110, BR-201, BR-203 | Mới |
| US-148 | Là **khách tiềm năng**, tôi muốn xem tiện nghi chung và vị trí (địa chỉ, bản đồ, khoảng cách tới các điểm chính, nút chỉ đường), để biết đi lại có tiện không | Must | R2 – LP-v1 | FB-INV-001; BL 3.21 (chỉ đường); US-108 AC1 (cùng nguồn địa chỉ) | Mới |
| US-149 | Là **khách tiềm năng**, tôi muốn đọc tóm tắt chính sách (giờ nhận/trả, cọc, hủy, nội quy và phí phạt, thuê tháng gồm những gì), để không bất ngờ khi đặt | Must | R2 – LP-v1 | FB-INV-001; BR-401, BR-305, BR-309, BR-511, BR-201…BR-205, BR-501; ESC-004…006 | Mới |
| US-150 | Là **khách tiềm năng**, tôi muốn xem câu hỏi thường gặp (đi từ sân bay, giữ hành lý, giặt ủi, thú cưng, hóa đơn, khai báo lưu trú, Wi-Fi/làm việc từ xa…), để tự có câu trả lời mà không phải nhắn | Should | R2 – LP-v1 | FB-INV-001; Brief 5 (câu hỏi thường gặp) | Mới |
| US-151 | Là **khách tiềm năng**, tôi muốn bấm "Đặt phòng" hoặc "Liên hệ" để mở chat Zalo OA, WhatsApp, gọi điện hoặc gửi email cho OTTIMO (v1 – ESC-020 L2-A), để hỏi phòng và đặt trực tiếp không qua OTA | Must | R2 – LP-v1 | FB-INV-001; PRD G3 (kênh trực tiếp ≥ 35%); BR-112 (`directSource`); ESC-010; v2 → US-155, US-131, US-132 | Mới |
| US-152 | Là **khách nước ngoài**, tôi muốn đọc trang bằng tiếng Anh (VI/EN ở v1; RU theo ESC-020 L1), để hiểu mọi nội dung | Must | R2 – LP-v1 | FB-INV-001; DoD (VI + EN); PRD N1; content-guide mục 6 | Mới |
| US-153 | Là **chủ đầu tư** (`owner`), tôi muốn trang mang đúng nhận diện OTTIMO (kem – gỗ sồi, Lora + Be Vietnam Pro), mở nhanh trên điện thoại 4G, đọc được với người dùng bàn phím/trình đọc màn hình và không bao giờ vỡ khung khi thiếu ảnh, để khách có ấn tượng boutique ngay lần đầu | Must | R2 – LP-v1 | FB-INV-001; design-system D1; PRD N3, N9 | Mới |
| US-154 | Là **chủ đầu tư** (`owner`), tôi muốn trang tìm thấy được trên Google và hiện ảnh + tiêu đề đẹp khi gửi link qua Zalo/Facebook, để khách tự tìm đến kênh trực tiếp | Should | R2 – LP-v1 | FB-INV-001; PRD G3 | Mới |
| US-155 | Là **sale / lễ tân** (`sales_staff`, `front_desk`), tôi muốn nhận yêu cầu đặt phòng gửi từ website (ngày, nhóm căn, số khách, cách liên hệ, ngôn ngữ) vào một hàng chờ trong Desk và chuyển thành báo giá/giữ chỗ, để trả lời nhanh và không sót khách | Should | R3 (v2 – trước hoặc cùng US-131) | FB-INV-001; ESC-020 L2-B; US-080, US-084; BR-112 (`website`) | Mới |
| US-156 | Là **khách nói tiếng Nga**, tôi muốn đọc landing bằng tiếng Nga đã được người bản ngữ duyệt, để yên tâm đặt thuê dài hạn | Should | R3 (v2; lên v1 nếu INV chọn ESC-020 L1-B) | FB-INV-001; Brief 1, 5; US-115; content-guide mục 6 | Mới |
| US-157 | Là **khách thuê tháng / làm việc từ xa**, tôi muốn có trang riêng "Thuê tháng" với ước tính tiền thuê theo kỳ hạn và gửi yêu cầu báo giá dài hạn, để so sánh nhanh trước khi liên hệ | Could | R3 (v2) | FB-INV-001; PRD G2 (4–6 căn dài hạn); BR-201…BR-205; US-081 | Mới |
| US-158 | Là **chủ đầu tư** (`owner`), tôi muốn biết bao nhiêu lượt bấm "Đặt phòng"/liên hệ và bao nhiêu đơn trực tiếp đến từ website, để đo hiệu quả của trang so với mục tiêu G3 | Should | R3 (v2) | FB-INV-001; PRD G3; BR-112; `metrics-definitions.md` (DATA) | Mới |
| US-159 | Là **chủ đầu tư** (`owner`), tôi muốn tự sửa một số nội dung (giá "từ", ảnh, câu hỏi thường gặp, thông báo ngắn) mà không cần đội làm, để trang luôn đúng | Could | R4+ | FB-INV-001 | Mới |
| US-160 | Là **khách tiềm năng**, tôi muốn xem đánh giá của khách đã ở và gợi ý Đà Lạt (dùng chung nội dung tab Đà Lạt của app khách), để tin chọn OTTIMO | Could | R4+ | FB-INV-001; BL 3.21 (tab Đà Lạt); US-116, US-117 | Mới |

### Won't (ngoài phạm vi MVP – chi tiết PRD 5.3)
POS nhà hàng; kế toán tổng hợp/lương; ca làm việc & chấm công; ký số hợp đồng; kết nối trực tiếp từng OTA; iCal; định giá tự động; hạng thành viên; đa tiền tệ thanh toán; app cài từ store cho khách; tiếng Hàn/Trung.

---

## 4. Tiêu chí nghiệm thu – 77 story Must Round 2 theo bản R1 (sau R-C: 72 làm ở R2; 5 story dời giữ AC để làm đầu R3) (+ story mới Must R3)

Quy ước (đợt 3):
- Định dạng **Given / When / Then**, mỗi AC là ít nhất một ca kiểm thử (QA).
- **Không chép con số quy tắc**: mọi giá, %, giờ, hạn, hạn mức ghi bằng mã **BR-xxx** của `business-rules.md` (QC B3). "**khớp ví dụ BR-xxx**" = với tham số mặc định, kết quả phải bằng con số ở cột "Mặc định & ví dụ số" của BR đó (nếu DOM sửa số, AC tự đúng theo). Các con số còn lại (giá đơn 700.000/820.000, ngày 19–22/10, căn 201/203…) là **dữ liệu thử** lấy từ dữ liệu mẫu BL, không phải quy tắc.
- Trạng thái dùng tên trong code của `state-machines.md` (SM-01 đơn: `hold`, `confirmed`, `in_house`, `checked_out`, `cancelled`, `no_show`; SM-03 buồng: `VC`, `VI`, `VD`, `CL`, `OC`, `OD`, `OOO`; SM-05 khai báo; SM-10 duyệt…), kèm mã chuyển (B1…, K1…, R1…).
- Vai dùng mã của `rbac-matrix.md`; FD+ / FDL+ / MGR+ như mục 1. Mọi AC "bị từ chối" nghĩa là **server từ chối và ghi nhật ký lần bị từ chối**, không chỉ ẩn nút (rbac mục 8).
- Thời điểm tính theo giờ Asia/Ho_Chi_Minh (BR-001); kiểm các mốc giờ bằng đồng hồ giả lập (ADR-008).
- **"Hôm nay" / "đêm nay" = ngày nghiệp vụ**, đổi lúc 06:00 giờ VN, không đổi lúc nửa đêm (BR-010, khóa `business_day_rollover`). Ví dụ: lúc 01:30 ngày 21/10, "hôm nay" vẫn là 20/10 và "đêm nay" là đêm 20/10.
- Con số không phải quy tắc kinh doanh được tách làm hai loại (bước 4): (a) **ràng buộc nhập liệu** (độ dài SĐT, dạng MST, số kết quả gợi ý, khung hiển thị) theo đặc tả trường của BA/thiết kế UXD – AC chỉ ghi "theo đặc tả trường"; (b) **mục tiêu vận hành** (độ trễ job, thời gian hiện việc) là ngân sách hiệu năng ở `architecture.md` mục 16.
- Chính sách: INV đã quyết 13 ESC ngày 16/10/2026 theo đề xuất của đội (ghi "INV quyết ESC-xxx 16/10"); AC kiểm theo giá trị mặc định của BR (DOM cập nhật tham số nếu phương án được chọn khác mặc định); INV đổi chính sách về sau thì chỉ đổi tham số. Thông tin INV còn phải gửi ghi nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]`.
- **Phạm vi R-C (Round 2 tuần 1):** AC đánh dấu **[Dời R3 – R-C]** không thuộc nghiệm thu R2 (QA không tính vào TC Cao R2, QC mục 7 plan R2); story dời giữ nguyên AC.

### EP00 – Nền tảng

#### US-001 – Đăng nhập (UC-28)
> Nghiệm thu S3 (17/10): AC3 có ca riêng TC-NT-004 – đạt.
- AC1: Given tài khoản `front_desk` hoặc `front_desk_lead` đang hoạt động, When đăng nhập đúng, Then vào màn hình mặc định của vai là **"Hôm nay"** (quyết định PO bước 4, FB-R1-PO-UXD-03; BA sửa rbac mục 1) và tên người dùng hiện trên đầu trang.
- AC2: Given chưa đăng nhập hoặc phiên đã hết hạn, When mở trực tiếp đường dẫn một màn hình nội bộ, Then bị chuyển về trang đăng nhập và API không trả dữ liệu.
- AC3: Given đã đăng nhập, When tạo hoặc sửa một đơn, Then lịch sử chuyển trạng thái và nhật ký ghi đúng tài khoản đó là người thực hiện, thời điểm theo BR-001.
- AC4: Given Round 2 (chưa có màn quản lý người dùng tự phục vụ – US-008 R3), Then tài khoản 8 vai được tạo bằng dữ liệu khởi tạo/lệnh quản trị do OPS–BE cung cấp, mật khẩu đầu tiên buộc đổi ở lần đăng nhập đầu; không có tài khoản dùng chung.

#### US-002 – Gán vai (UC-28, rbac A100)
> Nghiệm thu S1 (16/10): AC1, AC2, AC4 đạt; AC3 (hợp quyền hai vai) thiếu ca chạy – QA bổ sung TC-NT-009 ở Sprint 3.
> Nghiệm thu S3 (17/10): AC3 đạt (TC-NT-009, quyền hợp FD ∪ SAL) → **Đạt (stack tạm)**. Q-QA-S3-01: thấy mọi báo giá là đúng theo hợp quyền; bộ lọc "Của tôi" trên màn Báo giá là tiện ích (Could), không phải ràng buộc quyền.
- AC1: Given `owner` mở một tài khoản, When đổi vai từ `front_desk` sang `housekeeping` và người đó đăng nhập lại, Then menu chỉ còn các màn hình được phép của `housekeeping` theo rbac mục 3.
- AC2: Given tài khoản `housekeeping`, When gọi trực tiếp API tạo đơn (A01), Then bị từ chối và nhật ký ghi người, hành động, đối tượng.
- AC3: Given tài khoản có hai vai `front_desk` + `sales_staff`, Then quyền là hợp hai vai (rbac mục 1, quy tắc 2).
- AC4: Given tài khoản `manager`, When mở màn Người dùng & vai (S26) hoặc gọi A100, Then bị từ chối (chỉ `owner`).

#### US-003 – Ẩn dữ liệu nhạy cảm (rbac mục 6–7)
> Nghiệm thu S1 (16/10): AC1 đạt phần serializer, kiểm đủ với khách có giấy tờ C3 ở **Sprint 3**; AC2 (minibar/kho) và AC4 (Tổng quan) → **Sprint 4**; AC3 R2 chỉ kiểm từ chối truy cập.
> Nghiệm thu S3 (17/10): AC1 đạt với khách có giấy tờ C3 thật (TC-RB-001/002). AC2, AC4 vẫn **Sprint 4**.
- AC1: Given tài khoản `sales_staff` hoặc `collaborator`, When mở hồ sơ một khách đã có giấy tờ (giao diện hoặc API), Then phản hồi không chứa loại giấy tờ, số giấy tờ (kể cả dạng che) hay ảnh (D03–D07 = K; khắc phục BL 8.2 #27, rbac M1).
- AC2: Given tài khoản `housekeeping`, When xem minibar hoặc kho, Then thấy số lượng, mức chuẩn, món thiếu nhưng không có giá vốn, giá trị tồn, thành tiền (rbac M3).
- AC3: Given tài khoản `sales_staff`, `collaborator` hoặc `housekeeping`, When mở P&L (S21) hoặc báo cáo kênh (S20), Then không có menu và truy cập trực tiếp bị từ chối (rbac M2). Ở R2 hai màn này chưa có (R3), nên R2 chỉ kiểm việc bị từ chối truy cập đường dẫn/API.
- AC4: Given tài khoản `front_desk`, When mở Tổng quan, Then không thấy doanh thu tháng, ADR, RevPAR và cảnh báo FOC (rbac ghi chú 1).

#### US-004 – Danh mục căn
> Nghiệm thu S1 (16/10): AC3 đạt; AC1, AC2 thiếu bằng chứng (TC-NT-018/019 còn `skip` dù endpoint đã có – QA bỏ skip tuần 1 Sprint 3). Hạ sức chứa dưới đơn tương lai: QC-S2-01/ĐK-S2-2 (Sprint 3 tuần 1).
> Nghiệm thu S3 (17/10): AC1, AC2 đạt (TC-NT-018/019); hạ sức chứa dưới đơn tương lai đạt (BUG-R2-025 Closed) → **Đạt (stack tạm)**.
- AC1: Given danh mục 10 căn (BL 4.1), When `owner` đổi giá niêm yết tháng của căn 203, Then giá đêm niêm yết tính lại theo BR-101 cho báo giá/đơn tạo sau; đơn, báo giá, HĐ đã có giữ nguyên snapshot (BR-006, BR-106).
- AC2: Given căn đánh dấu "ngừng bán", When tạo đơn mới, Then căn không có trong danh sách chọn và rack hiện nhãn "Ngừng bán".
- AC3: Given mỗi căn có sức chứa tối đa (BR-110 – chính sách INV quyết ESC-004 16/10; sức chứa thật từng căn `[GIẢ ĐỊNH – chờ INV xác nhận]` – INV gửi theo ESC-004, tạm dùng số trong BL), When tạo đơn, giữ chỗ hoặc báo giá vượt sức chứa, Then bị chặn tại ô số khách.

#### US-005 – Bảng tham số quy tắc (BR mục 13)
> Nghiệm thu S1 (16/10): AC2, AC3 đạt; AC1 thiếu bằng chứng (TC-NT-011 còn `skip` – QA bỏ skip Sprint 3).
> **ESC-015 A (INV 16/10):** danh sách ngày đặc biệt (BR-104) thêm **Giỗ Tổ Hùng Vương** (owner/manager nhập ngày dương lịch hằng năm như Tết) và **đêm 1/9**, áp đủ 3 hệ quả như ngày đặc biệt khác: giá BR-104, ở tối thiểu BR-113, không hoàn cọc BR-309. Không thêm AC (AC1–AC3 đã bao phủ việc chỉnh tham số; AC của US-080/US-021 dẫn BR-104/113/309); DOM cập nhật BR + ví dụ, BE/QA cập nhật seed `special_dates`.
> Nghiệm thu S3 (17/10): AC1 đạt (TC-NT-011); seed ngày đặc biệt theo ESC-015 đã có → **Đạt (stack tạm)**.
- AC1: Given tham số hạn giữ chỗ mặc định (BR-302), When `owner` đổi sang một mức khác trong danh sách cho phép, Then giữ chỗ tạo sau dùng mức mới; giữ chỗ đã tạo giữ hạn cũ (BR-006).
- AC2: Given `manager`, When sửa tham số vận hành (A101), Then được; When sửa hạn mức FOC, tỷ lệ hoa hồng, phí kênh (A102), Then bị từ chối. Given `front_desk_lead`, Then chỉ xem (S24 R); các vai khác không mở được màn này.
- AC3: Given sửa một tham số, Then nhật ký ghi giá trị cũ, giá trị mới, người sửa, thời điểm và ngày hiệu lực (BR mục 0.2).

#### US-006 – Nhật ký thao tác tiền (BR-008)
> Nghiệm thu S1 (16/10): AC1 phần thêm/điều chỉnh dòng folio → **Sprint 3**; AC2 đạt phần (2)(3), phần (1) kiểm ở Sprint 3.
> Nghiệm thu S3 (17/10): AC2 phần (1) đạt; AC1 phần thêm dòng đạt, phần **điều chỉnh dòng**: API đạt (TC-NT-016) nhưng Desk chưa có nút → **Sprint 4** (S4-27*).
- AC1: Given đơn có folio `open`, When `front_desk` thêm hoặc điều chỉnh một dòng phát sinh, Then nhật ký ghi người, thời điểm, giá trị trước/sau, lý do; không có thao tác xóa dòng – sửa sai bằng bút toán điều chỉnh (BR-008).
- AC2: Given `owner` mở nhật ký (S27), When lọc theo ngày và người làm, Then thấy đúng các thao tác tiền (folio, giảm giá, FOC, hủy, thu, hoàn) trong khoảng đó; `front_desk` chỉ thấy nhật ký của chính mình.

#### US-007 – Phê duyệt FOC/giảm giá (UC-27, SM-10)
> Nghiệm thu S1 (16/10): nền duyệt đạt (TC-NT-027); AC1–AC6 nghiệm thu đủ ở **Sprint 3** (cần `requestFoc` + folio + trả phòng).
> Nghiệm thu S3 (17/10): AC2–AC5 đạt. AC1, AC6: API đạt (TC-NT-027, TC-NT-032); Desk chỉ xin FOC được ở bước nhận phòng – xin FOC cho trả muộn, dòng phát sinh, bước 2 trả phòng và lễ tân tự áp FOC minibar → **Sprint 4** (S4-25*, cần cho luồng A1 của QC). Báo cáo đóng ca: R3 (US-124).
- AC1: Given `front_desk` gửi FOC cho phụ thu trả muộn với lý do từ danh mục BR-432, When lưu, Then yêu cầu ở `pending`, folio hiện dòng "chờ duyệt", form **không** có ô chọn tên người duyệt, và người có quyền theo BR-433 nhận thông báo.
- AC2: Given `front_desk_lead` xác thực lại bằng chính tài khoản của mình (R2: nhập lại **mật khẩu đăng nhập**; từ R3: **PIN duyệt** riêng – BR-432 "mật khẩu/PIN") và giá trị nằm trong hạn mức lần + hạn mức tháng còn lại (BR-433), Then yêu cầu `approved`; folio có dòng phát sinh + dòng FOC âm cùng giá trị, lý do và tên người duyệt thật (BR-434).
- AC3: Given giá trị vượt hạn mức của `front_desk_lead` (BR-433 – INV quyết ESC-007 16/10), When người đó mở yêu cầu, Then không duyệt được và yêu cầu chuyển `escalated` tới `manager`/`owner`.
- AC4: Given người duyệt là người gửi và không phải `manager`/`owner`, Then bị từ chối (BR-432) – **trừ** trường hợp tự áp trong hạn mức của vai ở AC6; Given mật khẩu/PIN xác thực lại sai, Then không duyệt được.
- AC5: Given folio còn yêu cầu `pending`/`escalated`, When hoàn tất trả phòng, Then bị chặn (SM-10).
- AC6 *(bước 4 – FB-R1-DOM-PO-01)*: Given `front_desk` gửi FOC loại **minibar** có giá trị ≤ hạn mức tự áp mỗi lần **và** còn trong hạn mức tháng của chính người đó (BR-436, hạn mức tháng mặc định 500.000 đ/người/tháng – INV quyết ESC-007 16/10), When xác thực lại bằng tài khoản của chính mình, Then yêu cầu `approved` ngay (SM-10 A2), dòng FOC ghi "tự áp trong hạn mức", được cộng vào hạn mức tháng, có trong báo cáo đóng ca/cuối ngày cho `front_desk_lead` và tính vào cảnh báo BR-435; vượt hạn mức lần hoặc tháng → đi luồng AC1.

#### US-008 – Thêm người dùng (S26) – *Must R3 (nâng R2 Sprint 2)*
> R2: màn S26 **ẩn hẳn** nút "Thêm người dùng" (không để nút tắt/"sắp có"); tài khoản tạo bằng seed/lệnh quản trị (US-001 AC4). Khóa/mở, đặt lại mật khẩu đã có ở R2 (US-002).
- AC1: Given `owner` ở S26, When bấm "Thêm người dùng", nhập tên hiển thị, tên đăng nhập, ít nhất một vai và mật khẩu tạm, Then tài khoản được tạo, buộc đổi mật khẩu ở lần đăng nhập đầu (như US-001 AC4), nhật ký ghi người tạo.
- AC2: Given tên đăng nhập đã tồn tại, Then báo lỗi tại ô, không tạo tài khoản; Given mật khẩu tạm nằm trong danh sách cấm hoặc ngắn hơn quy định, Then lỗi tại ô.
- AC3: Given tài khoản không phải `owner`, Then không thấy nút và API trả 403 (A100).

#### US-135 – Xác nhận hành động không đảo ngược (HR-06) – *mới*
> Nghiệm thu S1+S2 (16/10): hộp xác nhận hủy/no-show đã có (test FE); hành động còn lại theo sprint của từng màn; AC3 chờ axe/trình đọc màn hình (ĐK-S2-4).
> Nghiệm thu S3 (17/10): hộp xác nhận cho hoàn tất trả phòng và xóa sớm ảnh đạt; axe 0 vi phạm H01–H18. Còn: phiếu sửa `done` (**Sprint 4**), đóng/mở bán kênh (R3), gộp hồ sơ (US-074, R3), kiểm tay trình đọc màn hình trên staging.
- AC1: Given một trong các hành động: hủy giữ chỗ/hủy đơn, đánh dấu no-show, hoàn tất trả phòng, đóng/mở bán kênh, gộp hồ sơ khách, chuyển phiếu sửa sang `done` (mở khóa phòng), xóa sớm ảnh giấy tờ, When người dùng bấm, Then hiện hộp xác nhận nêu hậu quả cụ thể (ví dụ "Căn 203 sẽ mở bán lại 19–22/10 trên mọi kênh") và nút xác nhận ghi đúng tên hành động.
- AC2: Given hộp xác nhận đang mở, When bấm Hủy hoặc phím Esc, Then không có dữ liệu nào thay đổi.
- AC3: Given người dùng bàn phím hoặc trình đọc màn hình, Then thao tác được hộp xác nhận và nghe được nội dung hậu quả (WCAG 2.2 AA – decision-log UXR).

### EP01 – Tổng quan

#### US-010 – KPI đêm nay
- AC1: Given 10 căn, trong đó 6 căn có đơn `confirmed`/`in_house` phủ đêm nay, 1 căn có khối OOO `active`, 1 căn chỉ có đơn `hold`, When mở Tổng quan, Then công suất đêm nay = 6/9 theo công thức `metrics-definitions.md` (đêm khả dụng trừ OOO – BR-804; `hold` không là đêm bán – BR-904) và có chú thích mẫu số (khắc phục BL 8.2 #8, #29).
- AC2: Given dữ liệu đơn thay đổi, When tải lại Tổng quan, Then KPI thay đổi theo; không còn số cố định trong giao diện (BL 8.2 #28).
- AC3 *(bước 4)*: Given lúc 02:00 ngày 21/10, When mở Tổng quan, Then "đêm nay" là đêm 20/10 đang diễn ra (ngày nghiệp vụ – BR-010), không phải đêm 21/10.

#### US-011 – Khách đến/đi hôm nay (BR-404)
- AC1: Given hôm nay có 1 đơn `cancelled` và 1 đơn `no_show` có ngày đến hôm nay, When mở "Khách đến", Then hai đơn đó không xuất hiện; đơn `hold` có ngày đến hôm nay chỉ nằm ở mục riêng "Giữ chỗ chưa cọc" (BL 8.2 #7).
- AC2: Given đơn `confirmed` đến hôm nay, Then dòng có nút "Nhận phòng"; đơn `in_house` có ngày đi hôm nay có nút "Trả phòng"; đơn đã chuyển trạng thái hiện chip "Đã nhận"/"Đã trả".
- AC3 *(bước 4 – FB-R1-DOM-PO-04)*: Given đơn `confirmed` ngày đến 20/10, When 01:30 ngày 21/10 mở "Khách đến", Then đơn vẫn hiện và nút "Nhận phòng" dùng được (ngày nghiệp vụ vẫn là 20/10 – BR-010).

#### US-012 – Cần chú ý (BR-907)
> Sprint 3–4 (PO 17/10, BUG-R2-034): nguồn dữ liệu cho AC1 (khai báo) và AC3 (thị thực) làm ở **Sprint 3** cùng EP06; màn/khung "Cần chú ý" trên Tổng quan và nghiệm thu US-012 ở **Sprint 4**.
- AC1: Given một đơn đến hôm nay có khai báo ở trạng thái trước `sent`, Then "Cần chú ý" có dòng nêu số đơn chưa khai báo và hạn tính theo BR-602 (khách VN) / BR-603 (khách NN – giờ đến thực tế + số giờ của BR-603); bấm vào mở màn khai báo.
- AC2 **[Dời R3 – R-C]** *(cùng job J12; R2 chưa có HĐ trong hệ thống)*: Given HĐ có kỳ thu `scheduled`/`due` trong khoảng nhắc của BR-207, Then có dòng nhắc thu (tên khách, số tiền, ngày); When kỳ đó được ghi đã thu (US-119 AC5), Then dòng nhắc biến mất; Given HĐ hết hạn trong khoảng của BR-211, Then có dòng "chào gia hạn".
- AC3 *(sửa R2 Sprint 2 – E01-06, theo SEC SR-RET-06)*: Given khách NN có thị thực hết hạn trước ngày trả phòng (BR-605), Then có dòng cảnh báo nêu **mã đơn và căn** (không hiện ngày hết hạn trên "Cần chú ý"); When FD+ bấm vào dòng trên thiết bị được cấp (US-142), Then mở màn giấy tờ của đơn, nơi thấy ngày hết hạn thị thực (có nhật ký xem C3); trên thiết bị chưa cấp → thông báo theo US-142.
- AC4: Given có giữ chỗ trong khoảng nhắc trước hạn của BR-303, một khối OOO, một phiếu sửa mức Cao đang mở (BR-809), Then mỗi loại có một dòng riêng.
- AC5: Given không có việc nào thỏa điều kiện, Then hiện trạng thái rỗng "Không có việc cần chú ý".
- AC6: Given tài khoản `front_desk`, Then không thấy dòng cảnh báo FOC (BR-435 chỉ gửi `owner`).
- AC8 *(mới R2 Sprint 2 – E01-05/B-22)*: Given `owner` mở Tổng quan và tổng FOC lũy kế từ ngày 1 tháng tới hôm nay vượt ngưỡng tỷ lệ của BR-435 so với doanh thu phòng cùng kỳ, Then có một dòng cảnh báo nêu số FOC, tỷ lệ và ngưỡng (khớp ví dụ BR-435); Given một người duyệt vượt ngưỡng số lần trong tháng (gồm lần lễ tân tự áp minibar – BR-436), Then mỗi người một dòng; Given `manager`/`front_desk_lead`/`front_desk`, Then không thấy (AC6). Thông báo đẩy hằng ngày (job J21) thuộc R3.
- AC7 *(bước 4 – FB-R1-BA-PO-10)*: Given lệnh đồng bộ kênh ở trạng thái lỗi (R2: lớp giả lập; BR-905) quá ngưỡng của BR-905, Then có dòng đỏ "Đồng bộ kênh lỗi" nêu căn/kênh và hướng dẫn đóng bán thủ công trên extranet; Given khách quen hoặc khách gắn nhãn VIP đến hôm nay, Then có dòng riêng. Nguồn "công tơ chưa chốt" của BR-907 thuộc R3 (US-064).

### EP02 – Room rack & đặt phòng

#### US-016 – Room rack
> Nghiệm thu S2 (16/10): API + phân quyền đạt; AC1–AC3 là giao diện – chờ E2E UI/axe (ĐK-S2-4) và staging.
- AC1: Given dữ liệu mẫu, When mở màn Lễ tân, Then thấy 10 dòng căn × khung ngày mặc định theo thiết kế UXD (14 cột, có vài ngày đã qua – ràng buộc giao diện, không phải quy tắc), cột hôm nay (ngày nghiệp vụ) được đánh dấu.
- AC2: Given mỗi thanh trên rack, Then phân biệt `hold` (viền đứt), `confirmed`, `in_house`, `checked_out`, đơn dài hạn và khối OOO bằng cả màu và nhãn chữ/biểu tượng đọc được bởi trình đọc màn hình (BL 8.3).
- AC3: Given bấm vào một thanh đơn bằng chuột hoặc bàn phím, Then mở chi tiết đơn đó.
- AC4: Given tài khoản `housekeeping`/`maintenance`, Then rack chỉ cho xem trạng thái căn và có/không có khách đến, không có tên khách, kênh, giá; `sales_staff`/`collaborator` chỉ thấy căn – đêm còn/hết (rbac ghi chú 2, 3).

#### US-017 – Tạo đơn ngắn ngày đã đảm bảo (UC-04, B2)
- AC1: Given căn 203 trống 19–22/10, When `front_desk` tạo đơn kênh Booking.com 3 đêm 2 khách giá 820.000 có mã OTA và kiểu thanh toán OTA (BR-307), Then đơn ở `confirmed`, hiện trên rack, có bản ghi khai báo `none` cần 2 người (BR-608) và có lệnh đồng bộ đóng phòng (BR-905).
- AC2: Given kênh Trực tiếp hoặc CTV, When lưu mà khách không có SĐT, Then bị chặn với thông báo cần SĐT.
- AC3: Given bỏ trống giá, Then giá từng đêm mặc định theo lịch giá của kênh (BR-101, BR-103, BR-104) và hiện trước khi lưu; Given giá bằng 0 hoặc trống, Then lỗi tại ô; Given kênh Trực tiếp/CTV/HĐ và giá ngoài khoảng sàn–trần, Then lỗi tại ô (BR-105); Given kênh **OTA** và giá ngoài sàn–trần, Then chỉ **cảnh báo** và bắt ghi lý do, vẫn lưu được (giá do OTA quyết – FB-R1-DOM-PO-11).
- AC4: Given ngày đến sau 31/12/2026 nhưng trong cửa sổ bán BR-112, Then tạo được (khắc phục BL 8.2 #26); ngoài cửa sổ hoặc số đêm ngoài giới hạn BR-112 → lỗi tại ô.
- AC5: Given số đêm đạt ngưỡng bắt buộc hợp đồng của BR-108, Then không lưu được đơn ngắn ngày và được hướng sang báo giá dài hạn (UC-06). *(R2: báo giá dài hạn dời R3 → hướng sang AC5a.)*
- AC5a **[tạm cho R2 – R-C, plan R2 P-R2-3; bỏ khi US-081/US-086 AC3 xong ở R3]**: Given số đêm đạt ngưỡng BR-108, When FD+ chọn "Đơn dài hạn nhập tay" và nhập căn, ngày vào, ngày ra, số tiền/tháng (nhập tay), Then đơn được lưu ở `confirmed`, mang cờ **"HĐ ngoài hệ thống – chuyển vào app ở R3"**, chiếm tồn phòng như mọi đơn (chống trùng US-018 áp dụng; hiện trên rack kiểu đơn dài hạn – US-016 AC2), không sinh lịch kỳ thu; thu tiền ghi bằng US-119 AC1 (không gắn kỳ); Given `sales_staff`/`collaborator`, Then không tạo được (A01 ✖); danh sách đơn lọc được theo cờ để chuyển sang HĐ đầy đủ ở R3 (giữ nguyên mã đơn).
- AC6: Given tài khoản `sales_staff` hoặc `collaborator`, Then không có màn đặt phòng mới (A01 ✖); chỉ tạo giữ chỗ từ báo giá (US-084).
- AC7 *(bước 4 – FB-R1-DOM-PO-05)*: Given căn 302, kênh Trực tiếp, 3 người lớn, 3 đêm, Then có dòng phụ thu thêm người khớp ví dụ BR-110 (INV quyết ESC-004 16/10); Given kênh OTA, Then không cộng phụ thu người (OTA đã tính theo số khách), chỉ ghi số khách.
- AC8 *(bước 4 – T10)*: Given form tạo đơn, Then danh sách kênh = danh sách BR-901 (Traveloka chỉ hiện khi INV xác nhận có dùng) + "Nội bộ" cho phòng dùng nội bộ; kênh "Trực tiếp" có trường phụ bắt buộc "Nguồn" (Zalo/điện thoại, Website, vãng lai, khách quay lại); có ô email khách không bắt buộc (PHÂN XỬ ORC – để gửi mã xác minh app khách).
- AC9 *(mới R2 Sprint 2 – ARC A-06)*: Given kênh **CTV** (`agent`), When lưu đơn mà chưa chọn người chốt, Then lỗi tại ô "Người chốt" (bắt buộc, phải là một CTV); Given kênh Trực tiếp nguồn `sales_staff`, Then người chốt bắt buộc và là sale nội bộ; các kênh/nguồn khác người chốt không bắt buộc. Người chốt chọn từ danh sách tên hiển thị (không lộ SĐT/email).

#### US-018 – Chống đặt trùng (BR-002, BR-906)
> Nghiệm thu S2 (16/10): chống trùng ở DB/API đạt. Còn: câu báo trên UI khi `CONCURRENT_UPDATE` (QC-S2-02, ĐK-S2-3) → **Sprint 3 tuần 1**; AC4 phần gia hạn B13 và đổi phòng B14 → **Sprint 3**.
> Nghiệm thu S3 (17/10): câu báo khi lưu đồng thời đạt (BUG-R2-026 Closed); AC4 gia hạn B13 (TC-L4-005) và đổi phòng B14 (test tích hợp) đạt → **Đạt (stack tạm)**.
- AC1: Given căn 201 đã có đơn `confirmed` 20–22/10, When tạo đơn kênh **Trực tiếp, CTV hoặc HĐ** cho căn 201 từ 21/10, Then bị chặn và thông báo nêu khoảng ngày đang trùng.
- AC2: Given hai người cùng lưu đơn cho cùng căn – đêm gần như đồng thời, When cả hai bấm lưu, Then chỉ một đơn thành công, người kia nhận "Căn vừa được đặt" (kiểm ở máy chủ trong cùng giao dịch – BL 8.2 #30).
- AC3: Given ngày đi của đơn A = ngày đến của đơn B cùng căn, Then không coi là trùng (khoảng [đến, đi) – BR-002).
- AC4: Given các luồng giữ chỗ (B1), xác nhận cọc (B4), gia hạn (B13), đổi căn/đổi ngày (B7), đổi phòng (B14), khôi phục no-show (B12), tạo/kéo dài khối OOO (O1, O3), Then cùng một quy tắc kiểm trùng ở server được áp dụng (state-machines 0.2 mục 4).
- AC5 *(bước 4 – FB-R1-BA-PO-01, T2)*: Given căn 201 đã kín 21/10, When lễ tân nhập tay đơn **kênh OTA** cho căn 201 đêm 21/10, Then đơn **không bị chặn**: server không tự đổi căn mà không báo – trả lời xung đột kèm danh sách căn trống cùng nhóm (thứ tự theo BR-316: căn ánh xạ → căn trống cùng nhóm; nhóm khác chỉ gợi ý); lễ tân chọn căn gợi ý (đơn `confirmed` ở căn đó) hoặc chọn "Lưu chưa gán căn"/không còn căn → đơn `confirmed` có cờ xung đột, không chiếm tồn phòng, đi theo US-139.

#### US-019 – Phòng khóa chặn bán (SM-02, BR-804)
> Nghiệm thu S2 (16/10) – **phần dời:** màn tạo/sửa khối OOO (S4 Bảo trì) → **Sprint 4** (tới đó khối OOO chỉ tạo qua API/seed); AC2 phần Tổng quan + đêm khả dụng (BR-904) → **Sprint 4**. AC1 và AC2 phần rack/phòng trống đã đạt.
- AC1: Given căn 401 có khối OOO `planned` hoặc `active` 15–17/10, When tạo đơn, giữ chỗ hoặc báo giá căn 401 cho đêm 16/10, Then bị chặn với lý do "Phòng đang khóa".
- AC2: Given căn đang khóa, Then rack hiện thanh "Khóa phòng"; phòng trống trên Tổng quan/báo giá và đêm khả dụng không tính căn này trong các đêm khóa (BR-904).

#### US-020 – Chi tiết đơn
> Nghiệm thu S2 (16/10) – **phần dời:** xem folio đầy đủ (dòng phát sinh, giao dịch) trên chi tiết đơn → **Sprint 3** (cùng folio/bill); AC2 nút "Trả phòng"/"Xem bill" → **Sprint 3** (cần nhận/trả phòng). AC1, AC3, AC4 đạt.
> Nghiệm thu S3 (17/10): xem folio đầy đủ trên chi tiết đơn và nút "Trả phòng" đạt; **"Xem bill" cho đơn `checked_out`** (mở lại bill đã chốt, in lại) chưa có → **Sprint 4** (S4-29*).
- AC1: Given đơn `hold`, When mở chi tiết, Then thấy tiến trình đúng loại đơn (ngắn ngày/dài hạn – BL 3.4) và chỉ các nút hợp lệ: "Xác nhận cọc" (FD+, `sales_staff` – A04), "Gia hạn giữ chỗ" (nếu chưa gia hạn – B3), "Hủy giữ chỗ"; `collaborator` thấy "Báo đã chuyển cọc" thay cho "Xác nhận cọc" (A53).
- AC2: Given đơn `in_house` có ngày đi hôm nay, Then có nút "Trả phòng"; đơn `checked_out` chỉ có "Xem bill"; đơn `cancelled`/`no_show` không có nút thay đổi, trừ "Khôi phục no-show" cho `manager`/`owner` (B12) và cho `front_desk`/`front_desk_lead` theo US-136 AC4–AC5 (tự khôi phục khi đủ 3 điều kiện BR-315, ngoài ra "Gửi yêu cầu khôi phục").
- AC3: Given `collaborator`, When mở đơn không do mình chốt, Then bị từ chối; với đơn của mình chỉ thấy tổng tiền phòng và cọc (rbac ghi chú 4).
- AC4: Given gọi API một chuyển không hợp lệ với trạng thái hiện tại (ví dụ nhận phòng đơn `hold`), Then bị từ chối (state-machines 0.2).

#### US-021 – Hủy đơn / hủy giữ chỗ (UC-05, B5, B10)
> Nghiệm thu S2 (16/10): AC1–AC3 đạt; AC4 phần **chi tiền hoàn** (`refund`) → **Sprint 3**; AC5 dời ngày đã có API nhưng thiếu ca E2E (QA bổ sung S3); AC6 kiểm khi có nhận phòng (**Sprint 3**).
> Nghiệm thu S3 (17/10): AC4 chi tiền hoàn (TC-L4-062, tách nhiệm), AC5 (TC-L2-055), AC6 đạt → **Đạt (stack tạm)**. Quy tắc mới áp Sprint 4: S4-06, S4-08.
- AC1: Given đơn `hold`, When hủy mà không chọn lý do từ danh mục BR-308, Then không lưu được.
- AC2: Given bấm hủy, Then hộp xác nhận nêu căn, khoảng ngày sẽ mở bán lại và khoản giữ lại/hoàn (US-135 – khắc phục HR-06).
- AC3: Given hủy thành công, Then đơn `cancelled`, phòng trống ngay trên rack, có lệnh đồng bộ mở phòng, khai báo → `void`, hoa hồng → `void`, nhật ký ghi lý do và người hủy.
- AC4: Given đơn Trực tiếp/CTV `confirmed` đã cọc, When hủy, Then hiển thị phí hủy và phần hoàn theo BR-309 (khớp ví dụ BR-309 – INV quyết ESC-006 16/10) và phần hoàn tạo yêu cầu duyệt cho `manager`/`owner` (BR-522); đơn OTA: nhập số tiền phạt theo kênh, app không tự tính (BR-310).
- AC5: Given `manager`/`owner`, Then có lựa chọn "Dời ngày" thay cho hủy, một lần, giữ nguyên cọc (B8, BR-309); `front_desk` không có lựa chọn này (A08).
- AC6: Given đơn `in_house`, Then không có nút Hủy (dùng trả sớm – US-137).

#### US-022 – Người đi cùng
> Nghiệm thu S2 (16/10) – **chưa làm, dời cả story → Sprint 3** (cùng giấy tờ/khai báo; cần mã hóa dữ liệu trẻ em C3 – BE-A s2 mục 8). Vẫn Must R2.
> Nghiệm thu S3 (17/10): **Đạt (stack tạm)** – AC1–AC3 bằng test tích hợp, AC4 E2E TC-L3-056; QA thêm E2E TC-L2-060…062 (S4-33*).
- AC1: Given đơn 2 khách chỉ có người đứng tên, When mở chi tiết, Then hiện cảnh báo "Thiếu 1 người" ở khối khách (BR-601).
- AC2: Given thêm người dưới ngưỡng bảo vệ dữ liệu trẻ em (`is_minor_data` – rbac mục 9, ngưỡng mặc định – INV quyết ESC-001 16/10: luật sư rà soát trước khi có dữ liệu thật), Then không tạo hồ sơ CRM, không lưu liên hệ, không hỏi đồng ý marketing; bậc tuổi phụ thu tính riêng theo BR-110.
- AC3: Given chọn một người đã có trong đơn, When thêm lần nữa, Then bị chặn trùng.
- AC4 *(bước 4 – FB-R1-DOM-PO-05)*: Given đơn Trực tiếp/CTV đang `in_house`, When thêm 1 người lớn từ đêm thứ 2, Then hệ thống đề xuất dòng phụ thu thêm người từ đêm thêm người theo BR-110 và chỉ ghi folio khi lễ tân xác nhận số tiền (như BR-414); sức chứa căn (US-004 AC3) vẫn được kiểm; đơn OTA chỉ cập nhật số khách.

#### US-023 – Mã duy nhất (BR-007)
- AC1: Given tạo liên tiếp và đồng thời nhiều đơn, báo giá, phiếu sửa (kể cả phiếu từ app khách), bill, Then mỗi mã do server cấp theo mẫu BR-007, liên tục theo cơ sở, không trùng; mã của bản ghi đã hủy không được dùng lại (khắc phục BL 8.2 #18).
- AC2 *(bước 4 – thay AC cũ về gộp hồ sơ, đã chuyển sang US-074)*: Given hồ sơ khách có mã `KH-` do server cấp, When sửa tên, SĐT hoặc email, Then mã khách không đổi và mọi đơn cũ vẫn trỏ đúng hồ sơ.

#### US-024 – Đổi căn / đổi ngày / đổi phòng (UC-16, B7, B14, BR-424)
> Nghiệm thu S2 (16/10) – **phần dời:** AC2, AC3 và AC4 phần B14 (đổi phòng khách đang ở) → **Sprint 3**; FE đổi chéo căn (`swapRoom`) và sửa đơn (`updateReservation`) → **Sprint 3**. AC1 (B7 đơn `confirmed`) đạt ở API.
> Nghiệm thu S3 (17/10): AC1–AC3 đạt (FE dời căn/ngày, `updateReservation`; B14 bằng test tích hợp). AC4 nhánh B14 căn chưa sạch (`ROOM_NOT_READY`) có ở code nhưng chưa có ca chạy → QA **Sprint 4** (S4-33*). `swapRoom` trên Desk: Sprint 4 nếu kịp, không thì R3. S4-04/05/07/09 áp Sprint 4.
- AC1: Given đơn `confirmed`, When `front_desk` đổi sang căn khác hoặc khoảng ngày khác kèm lý do, Then kiểm trùng ở server (BR-906), giá các đêm không đổi giữ snapshot (BR-006), có lệnh đồng bộ; với đơn OTA chỉ đổi được căn nội bộ, không đổi ngày (B7).
- AC2: Given đơn `in_house` đổi phòng với lý do "sự cố OTTIMO", Then giữ giá cũ; với lý do "khách yêu cầu", Then giá căn mới tính từ đêm đổi (BR-424).
- AC3: Given đổi phòng xong, Then căn cũ → `VD`/`OD` kèm việc dọn, mã cửa cũ hiển thị "đã hủy" và yêu cầu nhập mã mới (BR-403), khai báo không phải khai lại (BR-424).
- AC4: Given **đổi phòng khách đang ở** (B14) mà căn mới không ở `VI`/`VC`, Then bị chặn; Given đổi căn cho **đơn tương lai** (B7), Then chỉ kiểm trùng và khối OOO trong khoảng ngày của đơn, không đòi căn đang sạch; mọi trường hợp: có khối OOO trùng hoặc thiếu lý do → bị chặn (FB-R1-DOM-PO-11).

#### US-136 – Đánh dấu no-show (UC-05, B11, B12, BR-311) – *mới*
> Nghiệm thu S2 (16/10) – **phần dời:** AC1 nhắc gọi khách (J6/J7) → **Sprint 4**; AC2 việc "Báo no-show trên kênh" cho đơn OTA và AC4 thông báo cho `manager` → **Sprint 4** (cùng "Cần chú ý"/thông báo); AC4 dòng trong đóng ca → R3 (US-124). AC3, AC5 và phần chính AC2, AC4 đạt.
- AC1: Given đơn `confirmed` đến hôm nay chưa nhận phòng và không có giờ đến dự kiến, When qua mốc gọi khách của BR-311, Then `front_desk` nhận nhắc gọi/nhắn khách.
- AC2: Given đã qua mốc đánh dấu của BR-311 và đã ghi kết quả liên lạc, When `front_desk` bấm "No-show" và xác nhận (US-135), Then đơn `no_show`; đơn trực tiếp giữ cọc theo BR-311 (ghi "doanh thu khác" – BR-904); các đêm còn lại mở bán + đồng bộ; khai báo → `void`; hoa hồng → `void`; đơn OTA có việc "Báo no-show trên kênh". Hệ thống **không bao giờ** tự đánh dấu.
- AC3: Given chưa ghi kết quả liên lạc hoặc chưa qua mốc đánh dấu, Then nút "No-show" bị khóa.
- AC4 *(bước 4 – theo BR-315, state-machines v0.2 B12)*: Given đơn `no_show`, khách đến muộn **còn trong ngày nghiệp vụ** của đêm đến (trước 06:00 hôm sau – BR-010), căn của đơn vẫn trống/chưa bán lại/không phải đổi căn, và không phát sinh hoàn tiền hay đổi giá, When `front_desk`/`front_desk_lead` bấm "Khôi phục no-show" kèm lý do, Then đơn về `confirmed`, đóng lại phòng, **bản ghi khai báo của đơn được dùng lại** và chuyển `void` → `none` (SM-05 K12; giữ ràng buộc một bản ghi khai báo/đơn – ERD 4.7, UK `registration.reservation_id`; **không** sinh bản ghi khai báo mới), ảnh giấy tờ đã xóa theo K11 **không** khôi phục – khách/lễ tân nộp lại, `manager` nhận thông báo, lần khôi phục hiện trong đóng ca (BR-526). *(Sửa BUG-R1-002, 16/10)*
- AC5 *(bước 4)*: Given thiếu một trong 3 điều kiện ở AC4 (căn đã bán lại, phải đổi căn, có tiền ra, đã qua ngày nghiệp vụ) hoặc đơn OTA **đã báo no-show lên kênh**, Then `front_desk` chỉ gửi được yêu cầu duyệt; `manager`/`owner` duyệt (đơn OTA kèm việc "Báo kênh hủy no-show").

### EP03 – Nhận phòng

#### US-025 – Nhận phòng (UC-11, B9, BR-402)
> Sprint 3 (PO 17/10, BUG-R2-034): AC4 "đơn vào Cần chú ý" = nguồn API `registration_due`/`registration_overdue` làm **trong Sprint 3** (nghiệm thu qua `GET /attention`); khung hiển thị trên Tổng quan nghiệm thu ở Sprint 4 (US-012).
> Nghiệm thu S3 (17/10): AC1, AC2, AC4–AC7 đạt (AC4 nghiệm thu qua `GET /attention`). AC3 một phần: điều kiện "đã thu đủ" chưa cộng phụ thu nhận sớm/đêm B9a (BUG-R2-038) → **Sprint 4** (S4-10, OpenAPI 0.3.7); B18 vẫn chặn khi còn nợ. Mã cửa: R3.
- AC1: Given đơn `confirmed` đến hôm nay, buồng `VI`, đã thu đủ, có giấy tờ người đứng tên, When `front_desk` nhận phòng lúc 14:30, Then đơn → `in_house`, buồng → `OC`, ghi giờ nhận 14:30, không có phụ thu (BR-401, BR-411).
- AC2: Given buồng đang `VD`, When `front_desk` nhận phòng, Then phải gửi yêu cầu để FDL+ xác nhận lý do (A12 = D); `front_desk_lead` tự xác nhận được; sau khi nhận, buồng → `OD` và có việc dọn ưu tiên (R7).
- AC3: Given còn phải thu > 0 (đơn trực tiếp/CTV) hoặc chưa có giấy tờ người đứng tên, Then không hoàn tất được nhận phòng và không giao mã cửa (BR-402).
- AC4: Given khai báo chưa `sent`, When nhận phòng xong, Then hiện hạn khai báo theo BR-602/BR-603 (khách NN tính từ giờ nhận thực tế) và đơn vào "Cần chú ý".
- AC5: Given nhận nhầm đơn, When `manager`/`owner` bấm "Hoàn tác nhận phòng" trong cùng ngày và chưa có dòng folio mới (B17), Then đơn về `confirmed`, buồng về trạng thái trước, mã cửa bị hủy, nhật ký ghi lý do; `front_desk` không có nút này (A13).
- AC6 *(bước 4 – FB-R1-DOM-PO-04)*: Given đơn ngày đến 20/10, When người trực nhận phòng lúc 01:30 ngày 21/10, Then nhận được (điều kiện B9 "hôm nay = ngày đến" dùng ngày nghiệp vụ), giờ nhận ghi đúng 01:30 21/10 và hạn khai báo khách NN tính từ giờ này.
- AC7 *(mới R2 Sprint 2 – ARC Q-P1, UXD S1 #4)*: Given màn nhận phòng, Then có ô "Đã giao mã cửa/thẻ cho khách" **không bắt buộc** (R2 lễ tân giao mã ngoài app – US-128 dời R3); tick → đơn ghi thời điểm + người tick; app **không** lưu, không hiện mã cửa; không tick vẫn hoàn tất được nhận phòng; ô này tick bổ sung được từ chi tiết đơn khi khách đến muộn.

#### US-026 – Phụ thu nhận sớm (BR-411, BR-414; HR-04)
> Nghiệm thu S3 (17/10): đạt cả 4 AC → **Đạt (stack tạm)**.
- AC1: Given mở form nhận phòng vào bất kỳ giờ nào, Then giờ nhận mặc định = giờ chuẩn BR-401, phụ thu = 0 và chưa có dòng folio nào (khắc phục BL 8.2 #2, HR-04).
- AC2: Given đơn có giá đêm đầu 700.000, When lễ tân chủ động chọn "Nhận sớm" và nhập 11:00, Then hệ thống đề xuất phụ thu khớp ví dụ BR-411 và chỉ ghi folio sau khi lễ tân xác nhận đúng số tiền đang hiển thị.
- AC3 *(bước 4 – viết lại theo FB-R1-DOM-PO-03)*: Given giờ nhận trước mốc tính tròn 1 đêm của BR-411, Then theo BR-417 hệ thống kiểm căn còn trống đêm hôm trước (BR-906): còn trống → đơn Trực tiếp/CTV được **thêm 1 đêm** vào đầu đơn, giá theo BR-411; đơn OTA → tạo **đơn con kênh Trực tiếp** cho đêm đó, liên kết đơn gốc, giá theo BR-421/BR-422; đêm này là đêm bán và doanh thu phòng, không phải phụ thu (BR-904, decision-log DOM); căn không trống → không cho nhận sớm, gợi ý gửi hành lý hoặc căn khác.
- AC4: Given lễ tân muốn miễn phụ thu, Then đi theo luồng duyệt US-007.

#### US-027 – Phụ thu cho đơn dài hạn (BR-102, BR-213, BR-413)
> Nghiệm thu S3 (17/10): đạt cả 2 AC (R2 qua đơn dài hạn nhập tay; HĐ đầy đủ R3) → **Đạt (stack tạm)**.
- AC1: Given HĐ tiền thuê 11.130.000/tháng, When tính phụ thu trả muộn ở bậc thấp nhất của BR-412 (trường hợp phải thu), Then cơ sở tính là giá đêm quy đổi BR-102 và kết quả khớp ví dụ BR-413 (không phải 3.339.000 – lỗi BL 8.2 #1).
- AC2: Given chính sách miễn phí cho dài hạn của BR-413 đang bật và căn không có khách đến cùng ngày, Then phụ thu đề xuất = 0 trong khung miễn phí; INV đổi chính sách (ESC-007) chỉ cần đổi tham số.

### EP04 – Lưu trú

#### US-028 – Gia hạn (UC-13, B13, BR-421–423)
> Nghiệm thu S3 (17/10): AC1–AC3, AC5 đạt; AC4 đạt trừ phần đổi việc "Dọn trả phòng" → "Dọn phòng khách đang ở" – kiểm cùng EP07 ở **Sprint 4** (S4-31*). Báo giá dài hạn khi vượt giới hạn: R3.
- AC1: Given căn 201 còn trống 3 đêm liên tiếp sau ngày đi, When mở gia hạn, Then chọn được tối đa min(3, giới hạn BR-421) đêm, mỗi đêm hiện "Trống"; muốn vượt giới hạn → được hướng sang báo giá dài hạn (BR-108).
- AC2: Given đơn trực tiếp giá 700.000, When gia hạn 2 đêm ngày thường, Then giá khớp ví dụ BR-421 (giữ giá của đơn); đêm rơi vào ngày đặc biệt của BR-104 lấy giá ngày đó.
- AC3: Given đơn Booking.com/Agoda, When gia hạn 1 đêm, Then tạo đơn con kênh Trực tiếp liên kết đơn gốc (BR-422) với giá trực tiếp hiện hành, folio chung, đơn OTA gốc không đổi; thông báo "tiết kiệm phí kênh" lấy tỷ lệ từ cấu hình kênh BR-901.
- AC4: Given gia hạn thành công, Then ngày đi được cập nhật, buồng → `OD` (BR-802), việc "Dọn trả phòng" đổi thành "Dọn phòng khách đang ở", có lệnh đồng bộ, khai báo của khách NN → `needs_update` (BR-604) và hạn thu tiền gia hạn theo BR-423.
- AC5: Given hai người cùng gia hạn và tạo đơn mới vào cùng đêm, Then chỉ một thao tác thành công (US-018).

#### US-029 – Trả muộn (B15, BR-412, BR-414, BR-416)
> Nghiệm thu S3 (17/10): AC1–AC3 đạt; AC4 phần việc dọn "dọn sau giờ trả" → **Sprint 4** (S4-31*); hiệu lực mã cửa: R3.
- AC1: Given đơn có giá đêm cuối 700.000, When đặt trả muộn 15:00, Then phụ thu đề xuất khớp ví dụ BR-412 (đã tính tham số ân hạn – INV quyết ESC-007 16/10), hiện trước khi lưu và chỉ ghi folio khi lễ tân xác nhận (BR-414).
- AC2: Given căn có khách đến cùng ngày và không còn căn thay thế cùng nhóm, Then `front_desk` bị chặn, chỉ `manager`/`owner` duyệt được (BR-416, A16); Given còn căn thay thế, Then hiện cảnh báo nêu tên khách đến và giờ đến dự kiến.
- AC3: Given giờ trả sau mốc tính tròn 1 đêm của BR-412, Then hệ thống chuyển sang luồng gia hạn 1 đêm (BR-416, US-028).
- AC4: Given lưu trả muộn, Then việc dọn của căn ghi "dọn sau <giờ trả>", hiệu lực mã cửa kéo dài tới giờ trả muộn (BR-403), nhật ký nhắc ghi giờ trả đã chốt.

#### US-030 – Xác nhận giờ trả (UC-14)
> Nghiệm thu S3 (17/10): AC1 đạt; AC2 trạng thái "đã trả lời" đạt ở API, thẻ trên màn Hôm nay → **Sprint 4** (S4-31*, cùng US-011).
- AC1: Given khách trả lời qua điện thoại, When lễ tân chọn giờ 11:00 và ghi chú, Then nhật ký nhắc của đơn có dòng "Gọi điện – khách trả lúc 11:00" với người ghi và thời điểm.
- AC2: Given giờ trả đã được xác nhận, Then thẻ "khách trả phòng hôm nay" của đơn đó chuyển sang trạng thái "đã trả lời".

#### US-031 – Thẻ khách trả phòng hôm nay chưa trả (BR-425)
> Nghiệm thu S3 (17/10): AC1 trạng thái theo từng mốc BR-425 đạt (tính lúc đọc); thẻ + báo đỏ FD/MGR và AC2 (xếp đầu khi có khách đến) → **Sprint 4** (S4-31*, cùng US-011). Gửi nhắc tự động cho khách là US-034 (R3).
- AC1: Given đơn `in_house` có ngày đi hôm nay, khách chưa trả lời, When đồng hồ đi qua từng mốc của BR-425, Then trạng thái thẻ đổi đúng thứ tự "Đã nhắc, chờ khách trả lời" → "Chưa trả lời – lễ tân gọi xác nhận" → "Quá giờ trả phòng" (báo đỏ `front_desk` + `manager`); kiểm ở thời điểm ngay trước và ngay sau mỗi mốc, giờ VN (BR-001).
- AC2: Given căn đó có khách đến trong ngày, Then thẻ được xếp lên đầu.

#### US-032 – Dòng phát sinh / phí phạt (UC-17, BR-511, BR-512)
> Nghiệm thu S3 (17/10): AC2–AC4 đạt (app khách: R3). AC1 đạt trừ **sửa số lượng dòng đã ghi** (điều chỉnh dòng) – Desk chưa có nút → **Sprint 4** (S4-27*).
- AC1: Given danh mục phí có "Khử mùi thuốc lá" và "Mất/hỏng thẻ phòng", When lễ tân thêm vào folio, Then giá mặc định khớp BR-511, dòng thuộc loại "Phí phạt" (không phải doanh thu phòng – BR-904), sửa được số lượng và có nhật ký (US-006).
- AC2: Given dòng phí phạt hoặc hư hỏng, When lưu mà không có ảnh/ghi chú bằng chứng, Then bị chặn (BR-511, BR-512).
- AC3: Given folio có dòng phát sinh mới, Then "Còn phải thu" ở chi tiết đơn và ở app khách cập nhật đúng.
- AC4: Given món hư hỏng không có trong bảng giá BR-512, Then lễ tân gửi yêu cầu định giá cho `manager`/`owner` (SM-10).

### EP05 – Trả phòng & bill

#### US-035 – Trả phòng bước 1: minibar (BR-701, BR-702)
> Nghiệm thu S3 (17/10): đạt cả 3 AC (E2E + giao diện H16) → **Đạt (stack tạm)**.
- AC1: Given tủ chuẩn căn 201 có 2 lon Coca, When nhập còn 0, Then đã dùng 2 và tiền = 2 × giá bán Coca trong danh mục (BR-702).
- AC2: Given món miễn phí (nước suối), When đã dùng 2, Then dòng ghi "Miễn phí", không cộng tiền nhưng vẫn ghi tiêu hao (BR-701).
- AC3: Given nhập số còn lại lớn hơn mức chuẩn hoặc số âm, Then bị chặn (BR-702).

#### US-036 – Trả phòng bước 2: phụ phí
> Nghiệm thu S3 (17/10): đạt cả 3 AC → **Đạt (stack tạm)**. Xin FOC ở bước 2 chấm ở US-007 (S4-25*).
- AC1: Given đơn có trả muộn đã hẹn, When mở bước 2, Then giờ trả thực tế mặc định = giờ đã hẹn và phụ thu theo BR-412; Given không hẹn, Then giờ mặc định = giờ chuẩn BR-401 và phụ thu = 0 (BR-414).
- AC2: Given nhập giặt ủi 120.000 và chọn cách thanh toán "Chuyển khoản QR", Then bảng tóm tắt "Còn phải thu" cập nhật ngay.
- AC3: Given đơn OTA kiểu "OTA thu hộ" (BR-307), Then bước 2 chỉ còn các khoản phát sinh phải thu tại quầy.

#### US-037 – Trả phòng bước 3: bill
> Nghiệm thu S3 (17/10): đạt cả 3 AC (TC-L4-050 khớp 2.485.000) → **Đạt (stack tạm)**.
- AC1: Given đơn 3 đêm × 820.000, minibar 25.000, một phụ thu trả muộn (BR-412) có FOC `approved`, chưa cọc, Then bill có 3 dòng tiền phòng, 1 dòng minibar, 1 dòng phụ thu, 1 dòng FOC âm cùng giá trị, tổng = 2.485.000, còn phải thu = 2.485.000.
- AC2: Given khách NN (theo giấy tờ – BR-009) hoặc hồ sơ có ngôn ngữ khác tiếng Việt, Then bill song ngữ Việt – Anh và có dòng quy đổi USD tham khảo theo tỷ giá cấu hình kèm ngày cập nhật (BR-004).
- AC3: Given đơn đã cọc/đã thu một phần, Then dòng "Đã thu" bằng đúng tổng các giao dịch `succeeded` của đơn (US-119).

#### US-038 – Hoàn tất trả phòng (UC-18, B18, SM-13)
> Nghiệm thu S3 (17/10): AC1, AC4 đạt (mã cửa "đã hủy": R3). API AC2, AC3 đạt (TC-L4-054/055) nhưng Desk chưa có nút **bút toán điều chỉnh** (S4-27*) và **"Ghi công nợ"** cho MGR/OWN (S4-26*) → **Sprint 4**.
- AC1: Given bấm "Đã thu X đ – hoàn tất" và xác nhận (US-135), Then đơn → `checked_out`, folio → `settled` có số bill do server cấp (BR-007), buồng → `VD`, mã cửa hiển thị "đã hủy", có việc "Dọn trả phòng" và (nếu có tiêu hao) "Bổ sung minibar"; khách NN → khai báo `needs_update` (BR-604).
- AC2: Given folio `settled`, When `front_desk` sửa một dòng, Then không được; chỉ `manager`/`owner` tạo bút toán điều chỉnh có lý do (A32).
- AC3: Given còn phải thu > 0 mà chưa ghi giao dịch, When `front_desk` bấm hoàn tất, Then bị chặn; chỉ `manager`/`owner` được ghi công nợ có hạn thanh toán (A19, BR-525).
- AC4: Given folio còn yêu cầu FOC `pending`/`escalated`, Then bị chặn (SM-10).

#### US-039 – Thông tin hóa đơn GTGT công ty
> Nghiệm thu S3 (17/10): đạt cả 2 AC (phát hành hóa đơn thật: US-122, R3) → **Đạt (stack tạm)**.
- AC1: Given tích "Khách lấy hóa đơn công ty", When MST sai dạng theo đặc tả trường của BA (BL 5.16), Then bị chặn với thông báo rõ tại ô.
- AC2: Given lưu đủ tên công ty, MST, email, Then thông tin gắn với bill và hồ sơ khách để phát hành hóa đơn (phát hành thật ở US-122, R3 – BR-524).

### EP06 – Giấy tờ, khai báo lưu trú & quyền dữ liệu của khách

#### US-042 – Danh sách cần khai báo (UC-12, BR-602, BR-603, BR-611)
> Nghiệm thu S3 (17/10): đạt cả 3 AC → **Đạt (stack tạm)**.
- AC1: Given khách VN đến hôm nay chưa khai báo, Then hạn hiển thị theo BR-602; Given khách NN nhận phòng lúc 08:00, Then hạn khớp ví dụ BR-603 (giờ đến thực tế + số giờ của BR-603); Given đơn quá hạn mà khai báo trước `sent`, Then hiện "Đã quá hạn" với màu cảnh báo kèm nhãn chữ.
- AC2: Given đến mốc nhắc của BR-611 mà còn hồ sơ chưa khai, Then người trực (`front_desk`) và `manager` nhận thông báo trong app.
- AC3: Given tham số hạn khai báo đổi sau khi luật sư xác nhận (ESC-001), Then hạn của các đơn chưa khai tính lại mà không đổi code.

#### US-043 – Nhập giấy tờ (K3–K5, BR-601, BR-606, BR-612)
> Nghiệm thu S3 (17/10): AC1, AC2, AC4 đạt; AC3 (khớp hồ sơ theo số giấy tờ; hồ sơ "từ giấy tờ") → **Sprint 4** (S4-11, BUG-R2-033 (a)(b)).
- AC1: Given đơn 2 người lớn, When nhập đủ trường cho người thứ nhất, Then khai báo → `partial`; When nhập đủ người thứ hai, Then → `review` (BR-601).
- AC2: Given trẻ em, Then loại giấy tờ là số định danh cá nhân (BR-612) và không bắt ảnh.
- AC3: Given người lớn từ giấy tờ chưa có trong đơn, When lưu, Then được gắn vào đơn: khớp hồ sơ theo khóa định danh BR-951 nếu có, không thì tạo hồ sơ mới quan hệ "Chưa rõ". *(làm rõ – PO 17/10, BUG-R2-033 (b))* Hồ sơ tạo từ giấy tờ **không cần SĐT/email**: khóa định danh là số giấy tờ (BR-951 khóa 1); hồ sơ mang nguồn "từ giấy tờ", tên lấy theo giấy tờ, không hỏi đồng ý marketing, không vào danh sách/xuất dữ liệu tiếp thị, quan hệ "Chưa rõ"; dữ liệu giấy tờ theo quy tắc C3 hiện có. Given người mới làm số người có mặt vượt số khách của đơn, Then vẫn gắn vào đơn nhưng cảnh báo "Đơn ghi {n} khách" và hướng lễ tân sửa số khách (đơn chưa nhận phòng) hoặc thêm người có ngày hiệu lực (đơn đang ở) – phụ thu người không tự ghi.
- AC4: Given mỗi lần xem hoặc nhập trường giấy tờ, Then nhật ký truy cập dữ liệu C3 ghi người, thời điểm, đơn (A70 L).

#### US-044 – Đối chiếu tự động (K5, BR-605; HR-07)
> Sprint 3 (PO 17/10, BUG-R2-034): AC4 "đơn vào Cần chú ý" = nguồn API `visa_expiring` làm **trong Sprint 3**, chỉ nêu mã đơn + căn (US-012 AC3); khung hiển thị ở Sprint 4.
> Nghiệm thu S3 (17/10): đạt cả 4 AC → **Đạt (stack tạm)**.
- AC1: Given hộ chiếu hết hạn trước hoặc đúng ngày trả phòng, Then kiểm "hộ chiếu còn hạn" = **Không đạt** (khắc phục BL 8.2 #3).
- AC2: Given thiếu dữ liệu để kiểm (ví dụ chưa nhập ngày hết hạn), Then kết quả = **Chưa kiểm được – cần kiểm tay**; mỗi mục kiểm chỉ có 3 kết quả Đạt / Không đạt / Chưa kiểm được và không bao giờ hiện "Đạt" khi chưa thực sự kiểm (HR-07).
- AC3: Given tên đơn "Daniel Weber" và giấy tờ "WEBER DANIEL", Then kiểm tên = Đạt (bỏ dấu, chấp nhận đảo thứ tự – BR-952).
- AC4: Given thị thực hết hạn trước ngày trả phòng, Then cảnh báo đỏ, đơn vào "Cần chú ý", ngày đi khai báo đề xuất = ngày hết hạn thị thực (BR-605); chặn hay không theo BR-613 (thị thực hết trước ngày đi, hộ chiếu hết trong kỳ ở → không chặn, cảnh báo; hộ chiếu/thị thực đã hết tại ngày nhận hoặc thiếu dấu nhập cảnh → chặn giao mã cửa, chỉ `front_desk_lead`+ xác nhận nhận tiếp – INV quyết ESC-001 16/10, luật sư rà soát trước khi có dữ liệu thật); mọi trường hợp phải có ghi chú xử lý mới chuyển được `scanned` (K5).

#### US-045 – Ghi nhận đồng ý lưu ảnh giấy tờ (K5, BR-609)
> Nghiệm thu S3 (17/10): đạt cả 3 AC → **Đạt (stack tạm)**.
- AC1: Given đủ giấy tờ, When lễ tân bấm "Đối chiếu xong", Then phải chọn trạng thái đồng ý lưu ảnh **Có** hoặc **Không** (không tích sẵn) mới chuyển `scanned`; chọn "Không" vẫn khai báo bình thường (đồng ý không là điều kiện khai báo – decision-log SEC/BA; sửa trình tự BL 5.12).
- AC2: Given chọn "Không", Then ảnh được đánh dấu xóa ngay khi khai báo `confirmed`, chỉ giữ các trường văn bản cần thiết (BR-609).
- AC3: Given khách đã chọn đồng ý qua check-in online (US-107), Then trạng thái đồng ý được ghi kèm thời điểm, hình thức "qua app" và mục đích.

#### US-046 – Khai báo bán tự động (K6–K8, BR-606)
> Nghiệm thu S3 (17/10): đạt cả 3 AC (định dạng theo ESC-018) → **Đạt (stack tạm)**.
- AC1: Given đơn có ít nhất một người mang giấy tờ nước ngoài, When mở khai báo, Then tiêu đề "Khai báo tạm trú người nước ngoài"; đơn toàn công dân VN → "Thông báo lưu trú công dân Việt Nam".
- AC2: Given bấm "Sao chép dữ liệu", Then bộ nhớ tạm có đủ trường bắt buộc của từng người theo BR-606, đúng thứ tự cổng yêu cầu; chức năng chỉ có trên máy quầy được cấp và có nút xóa bộ nhớ tạm (A73). *(INV quyết ESC-018 17/10)* Ngày dạng **dd/mm/yyyy**, quốc tịch là **mã 3 chữ cái in hoa ISO alpha-3** (ví dụ KOR) – mặc định tham số `portal_date_format`/`portal_nationality_format` (OWN/MGR đổi được nếu cổng đổi).
- AC3: Given dán mã hồ sơ và lưu, Then khai báo → `sent`; bấm "Cổng đã xác nhận" → `confirmed` và đơn rời danh sách cần xử lý; bấm "Cổng từ chối" kèm lý do → `scanned` để khai lại.

#### US-047 – Mọi đơn có bản ghi khai báo (K1, BR-608)
> Nghiệm thu S3 (17/10): đạt cả 3 AC (HĐ dài hạn: R3) → **Đạt (stack tạm)**.
- AC1: Given đơn tạo từ mọi luồng (đặt mới, từ báo giá – US-084, đơn OTA, HĐ dài hạn), Then có bản ghi khai báo `none` với số người cần khai = số khách của đơn (khắc phục BL 8.2 #9).
- AC2: Given đơn con gia hạn (BR-422), Then không sinh bản ghi mới mà tạo việc "Cập nhật ngày đi" (BR-608).
- AC3: Given số khách của đơn thay đổi, Then số người cần khai cập nhật theo; nếu khai báo đã `confirmed` → `needs_update` (K9).

#### US-048 – Quyền xem ảnh giấy tờ (A71, D03–D06, BR-610)
> Nghiệm thu S3 (17/10): AC1, AC2, AC4 đạt. AC3: CRM không lộ số đầy đủ nhưng **không hiện 4 ký tự cuối** – cột `guest.id_doc_last4` không được ghi (PO-S3-07) → **Sprint 4** (S4-32*, gộp S4-11).
- AC1: Given tài khoản `front_desk`, When mở ảnh giấy tờ còn trong hạn lưu BR-610, Then xem được và nhật ký C3 ghi người xem, thời điểm, đơn, người được xem.
- AC2: Given tài khoản `housekeeping`, `maintenance`, `sales_staff` hoặc `collaborator`, When truy cập ảnh hoặc số giấy tờ (kể cả đường dẫn/API trực tiếp), Then bị từ chối, trường không được trả về.
- AC3: Given hồ sơ khách ở CRM, Then số giấy tờ chỉ hiện 4 ký tự cuối (BR-610).
- AC4: Given bất kỳ vai nào, Then không có chức năng xuất hàng loạt dữ liệu giấy tờ (A75).

#### US-049 – Tự xóa ảnh giấy tờ (UC-29, BR-609, BR-610)
> Nghiệm thu S3 (17/10): đạt cả 3 AC → **Đạt (stack tạm)**. BUG-R2-054 (H14 thiếu dòng "Ảnh đã xóa lúc…") → S4-12.
- AC1: Given đơn `checked_out` đã quá thời hạn lưu ảnh của BR-610 (giá trị mặc định – INV quyết ESC-001 16/10, luật sư rà soát), When job xóa chạy, Then ảnh bị xóa (hủy khóa – ADR-013), dữ liệu khai báo dạng chữ giữ theo tham số riêng, nhật ký ghi lần xóa.
- AC2: Given khách chọn không đồng ý lưu ảnh, Then ảnh bị xóa ngay khi khai báo `confirmed` (BR-609).
- AC3: Given khách yêu cầu xóa sớm, When `manager`/`owner` xác nhận (A74, US-135), Then ảnh bị xóa ngay và có nhật ký; `front_desk` không có chức năng này.

#### US-050 – Ngày đi thực tế & hạn tạm trú (K9–K10, BR-604, BR-605)
> Sprint 3 (PO 17/10, BUG-R2-034): cảnh báo thị thực trong "Cần chú ý" (nguồn `visa_expiring`) làm **trong Sprint 3**; khung hiển thị ở Sprint 4.
> Nghiệm thu S3 (17/10): đạt cả 2 AC → **Đạt (stack tạm)**.
- AC1: Given khách NN có khai báo `confirmed`, When gia hạn, trả sớm hoặc trả phòng, Then khai báo → `needs_update` và có việc "Cập nhật ngày đi" trong ngày cho `front_desk`; nhập xong → `updated`.
- AC2: Given ngày đi dự kiến sau ngày hết hạn thị thực, When lưu đơn hoặc gia hạn, Then hiện cảnh báo chặn mềm (phải xác nhận lý do), ngày khai không vượt hạn thị thực và có nhắc khách gia hạn trước số ngày của BR-605.

#### US-133 – Khách gửi yêu cầu về dữ liệu cá nhân (UC-30, SEC R-DSR-01) – *mới, Must R3*
- AC1: Given link app khách còn hạn, When khách chọn loại yêu cầu (xem, sửa, xóa, rút đồng ý, nhận bản sao) và gửi, Then yêu cầu được ghi nhận, khách thấy mã yêu cầu, ngày nhận và hạn trả lời (tham số – INV quyết ESC-001 16/10, luật sư rà soát).
- AC2: Given khách rút đồng ý lưu ảnh giấy tờ, Then hồ sơ đồng ý cập nhật ngay và ảnh vào hàng xóa theo BR-609.
- AC3: Given link đã hết hạn (sau khi hết ân hạn `post_checkout_charge_hours` (BR-427) – US-106 AC2), Then trang hướng dẫn gửi yêu cầu qua email hoặc tại quầy (lễ tân ghi hộ vào hộp yêu cầu).

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
- AC1: Given lễ tân hoàn tất trả phòng căn 201, Then việc "Dọn trả phòng 201" xuất hiện trong danh sách của `housekeeping` trong ngân sách độ trễ của `architecture.md` mục 16.
- AC2: Given khách gửi yêu cầu "Khăn, đồ dùng" từ app, Then việc có chip "App khách" và ghi chú của khách (BR-811).
- AC3: Given tick xong, Then bộ đếm x/y cập nhật và lễ tân thấy cùng trạng thái.
- AC4: Given danh sách việc, Then sắp theo thứ tự ưu tiên của BR-807.

#### US-055 – Checklist kiểm phòng (R4, BR-808)
- AC1: Given checklist theo BR-808 (nội dung cấu hình được), When chưa tick đủ mục bắt buộc, Then không chuyển được `VI`.
- AC2: Given tick đủ và lưu, Then biên bản kiểm ghi người kiểm, thời điểm, căn (và ảnh nếu có).

#### US-056 – Lịch dọn khách dài hạn (BR-807)
> INV 17/10 (câu phụ ESC-016): hiện chưa HĐ nào hẹn dọn cố định, nhưng sản phẩm phải có tùy chọn lịch dọn cố định cho khách dài hạn → US-056 là story bao phủ (AC3); đơn nhập tay có tùy chọn này qua bước chuyển sang HĐ ở R3 (AC4). Vẫn Must R3.
> **[Dời R3 – PO R2 Sprint 2]** cùng HĐ dài hạn (US-086 AC3). R2: đơn dài hạn nhập tay (US-017 AC5a) mặc định không có gói dọn (BR-204, DOM D-15) – dọn theo yêu cầu (BR-506) qua yêu cầu khách/việc tạo tay (`createHkTask`); nếu HĐ giấy có hẹn dọn cố định, lễ tân tạo việc tay theo tuần. AC giữ nguyên để làm ở R3.
- AC1: Given HĐ có gói dọn "2 lần/tuần – thứ Hai, thứ Năm" với khung giờ theo BR-807, When đến thứ Hai, Then việc "Dọn phòng khách dài hạn" kèm khung giờ xuất hiện trong việc hôm nay và buồng `OC` → `OD` theo lịch gói (R8).
- AC2: Given HĐ kết thúc hoặc khách đổi gói, Then các việc sau ngày đó không còn sinh theo gói cũ.
- AC3 *(mới – INV trả lời câu phụ ESC-016 17/10)*: Given lập hoặc sửa HĐ dài hạn (US-081/US-086 AC3), Then có **tùy chọn lịch dọn cố định**: chọn gói dọn theo BR-204 kèm ngày trong tuần và khung giờ theo BR-807, hoặc "Không có gói dọn" (dọn lẻ theo BR-506); lịch đã chọn hiện trên HĐ, trong app khách (US-114) và sinh việc theo AC1.
- AC4 *(mới – PO 17/10)*: Given đơn dài hạn nhập tay ở R2 (US-017 AC5a) được chuyển sang HĐ đầy đủ ở đầu R3 (giữ mã đơn), When chuyển, Then bước chuyển hỏi lịch dọn như AC3 (mặc định "Không có gói dọn" – BR-204); không làm tùy chọn lịch dọn riêng cho đơn nhập tay.

#### US-057 – Báo sự cố từ điện thoại (W1, BR-809)
- AC1: Given `housekeeping` chọn căn, mô tả "mất nước nóng", đính 1 ảnh, chọn mức, When gửi, Then tạo phiếu `new` nguồn "buồng phòng", mã do server cấp, `maintenance` thấy ngay; mức Cao → báo `maintenance`, `front_desk`, `manager` và vào "Cần chú ý" (BR-809).
- AC2: Given chọn "cần khóa phòng", Then phiếu ghi đề nghị khóa; `front_desk`/`maintenance` xác nhận tạo khối OOO như US-061 (`housekeeping` không tự tạo khối – A86).

### EP08 – Bảo trì

#### US-061 – Tạo phiếu sửa và khóa phòng (UC-24, W1, O1, BR-804)
- AC1: Given tạo phiếu ngày 15/10 cho căn 401 có tích "Khóa phòng" với ngày dự kiến xong 17/10, Then form hiện rõ cả hai ngày "dự kiến xong 17/10" và "mở bán lại từ 18/10" (ngày xong + `ooo_reopen_buffer_days` – BR-804); khối OOO `active` khóa các đêm 15, 16, 17 (lưu nửa mở [15/10, 18/10) – decision-log DOM), buồng → `OOO`, căn bị chặn bán trên rack, kiểm trùng, phòng trống và có lệnh đồng bộ đóng phòng (khắc phục BL 8.2 #5).
- AC2: Given khoảng khóa trùng đơn `hold`/`confirmed` tương lai, When lưu, Then hiện danh sách đơn cần dời; chỉ lưu được khi không còn đơn trùng hoặc `manager`/`owner` xác nhận đã có phương án (O1).
- AC3: Given căn đang có đơn `in_house`, Then không tạo được khối OOO và được gợi ý đổi phòng trước (US-024).
- AC4: Given bỏ trống mô tả, Then không lưu được.

#### US-062 – Cập nhật phiếu sửa (SM-04, O4)
- AC1: Given phiếu có khối OOO liên kết, When chuyển `done` (xác nhận US-135), Then khối → `released`, buồng `OOO` → `VD`, có việc "Dọn sau sửa chữa" và lệnh đồng bộ mở bán.
- AC2: Given đổi trạng thái hoặc người xử lý, Then chỉ theo các chuyển của SM-04 (`new` → `in_progress` ↔ `waiting_parts` → `done`; `cancelled` có lý do) và nhật ký phiếu ghi người đổi, thời điểm.
- AC3: Given phiếu mức Cao của căn có khách đang ở quá thời hạn phương án của BR-809, Then hệ thống gợi ý đổi phòng (US-024) + FOC bù sự cố (US-007).

### EP09 – Kho F&B / minibar

#### US-066 – Danh mục mặt hàng minibar (BR-701, A91)
> Xếp **Sprint 4** (PO 17/10): story Must R2 này chưa thuộc sprint nào (QA đang bỏ qua TC-L4-070/071); minibar khi trả phòng ở Sprint 3 dùng danh mục seed.
- AC1: Given `owner` thêm mặt hàng với giá bán "miễn phí", Then khi kiểm minibar mặt hàng đó không tính tiền nhưng vẫn ghi tiêu hao (BR-701).
- AC2: Given đổi giá bán, Then các lần kiểm minibar sau dùng giá mới, dòng folio đã ghi giữ nguyên (BR-006).
- AC3: Given `front_desk` hoặc `housekeeping`, Then không sửa được danh mục, giá bán, giá vốn (A91).

### EP10 – Khách hàng (CRM)

#### US-071 – Tạo/sửa hồ sơ khách
- AC1: Given form hồ sơ, When thiếu họ tên hoặc thiếu cả SĐT lẫn email, Then không lưu được. *(PO 17/10)* Quy tắc "phải có SĐT hoặc email" áp cho hồ sơ tạo/sửa ở form CRM và người đứng tên đơn; **không** áp cho hồ sơ người đi cùng tạo từ giấy tờ (US-043 AC3) – khi hồ sơ đó được thêm liên hệ hoặc trở thành người đứng tên thì áp đủ quy tắc.
- AC2: Given SĐT hoặc email sai dạng theo đặc tả trường của BA, Then báo lỗi tại ô tương ứng; SĐT/email được chuẩn hóa theo BR-951 trước khi lưu.
- AC3: Given form hồ sơ, Then không có ô nhập tay số giấy tờ (chỉ lấy từ bước giấy tờ – BL 3.16).

#### US-072 – Chặn hồ sơ trùng (BR-951, BR-952)
- AC1: Given đã có khách SĐT 0901 234 567, When tạo khách mới SĐT "+84 901234567", Then bị chặn và có nút "Mở hồ sơ đó" (chuẩn hóa BR-951).
- AC2: Given tên gần giống (BR-952) + cùng ngày sinh nhưng khác SĐT/email, Then chỉ cảnh báo nghi trùng, vẫn cho lưu.

#### US-073 – Bộ chọn khách dùng chung
- AC1: Given gõ "do mai anh" (không dấu), Then kết quả có "Đỗ Mai Anh" (số ký tự tối thiểu và số kết quả theo đặc tả trường/thiết kế).
- AC2: Given không tìm thấy, When tạo nhanh với SĐT đã tồn tại, Then hiện cảnh báo trùng và nút "Dùng hồ sơ này".
- AC3: Given `sales_staff`/`collaborator`, Then bộ chọn chỉ trả về khách/lead của mình (rbac M6).

### EP11 – Sale, báo giá, giữ chỗ, hợp đồng dài hạn

#### US-080 – Báo giá ngắn ngày (UC-01)
- AC1: Given căn 202, 7 đêm kênh Trực tiếp, When tính, Then tổng tiền khớp ví dụ BR-107; cọc theo BR-305; hoa hồng của người chốt theo BR-903; mã khách quay lại không cộng dồn với giảm theo số đêm (BR-111).
- AC2: Given `collaborator`, Then thấy "Sale nhận" (hoa hồng của mình) nhưng không thấy "OTTIMO còn lại" (rbac ghi chú 34 – PO đồng ý); `sales_staff` thấy cả hai.
- AC3: Given số đêm đạt ngưỡng so sánh của BR-108, Then hiện thêm phương án thuê 1 tháng khớp ví dụ BR-108; đạt ngưỡng bắt buộc → chuyển sang báo giá dài hạn (UC-06).
- AC4: Given vượt sức chứa (BR-110), ngày đã qua hoặc ngoài cửa sổ bán (BR-112), Then lỗi tại ô; Given không còn căn trống, Then báo "Hết phòng trong khoảng ngày" và gợi ý ngày khác.
- AC5 *(bước 4 – FB-R1-DOM-PO-05)*: Given căn 302, 3 người lớn, 3 đêm; và 2 người lớn + 1 trẻ 8 tuổi, Then dòng phụ thu thêm người khớp ví dụ BR-110 (bậc tuổi theo BR-110 – INV quyết ESC-004 16/10) và được cộng vào tổng báo giá.

#### US-081 – Báo giá dài hạn (UC-06)
> **[Dời R3 – R-C]** cả story (INV quyết ESC-012 16/10); AC giữ nguyên cho đầu R3.
- AC1: Given dữ liệu ví dụ của BR-208 (căn 302, khách NN, 6 tháng, dọn 2 lần/tuần, 1 người, CTV chốt, vào ở 1/11/2026), When tính với tham số mặc định, Then tiền thuê/tháng, phí dịch vụ + gói dọn, ký quỹ và tổng thu khi chốt khớp ví dụ BR-204, BR-206, BR-208 (công thức BR-203); ngày trả phòng theo BR-209; hoa hồng theo BR-212.
- AC2: Given đổi bất kỳ trường nào, Then kết quả tính lại ngay, không cần bấm nút.
- AC3: Given khách NN, Then có quy đổi USD tham khảo theo tỷ giá cấu hình (BR-004).
- AC4: Given kỳ hạn không trùng mốc, Then áp mức của mốc thấp hơn gần nhất (BR-202); Given sale đặt phí dịch vụ = 0, Then bắt buộc lý do (BR-204 – INV quyết ESC-005 16/10).

#### US-082 – Kiểm phòng trống khi báo giá
- AC1: Given căn chọn bị trùng lịch hoặc có khối OOO, Then chip "Trùng lịch"/"Đang khóa" và danh sách các căn khác còn trống trong cùng khoảng (số căn hiển thị theo thiết kế).
- AC2: Given ngày vào ở đã qua, Then báo "Ngày đã qua" và khóa nút tạo giữ chỗ.

#### US-083 – Lưu và gửi báo giá (SM-08 Q1–Q4, BR-304)
> Nghiệm thu S2 (16/10): AC1, AC3 đạt; **trả lại AC2 phần tiếng Nga** – văn bản báo giá RU đang ra tiếng Anh (PO-S2-01) → sửa **Sprint 3 tuần 1** (UXD chuỗi RU, BE-B sinh lại).
> Nghiệm thu S3 (17/10): AC2 tiếng Nga đạt (TC-L5-016 ru, BUG-R2-027 Closed) → **Đạt (stack tạm)**.
- AC1: Given lưu báo giá, Then có mã duy nhất (BR-007), trạng thái `active`, hạn hiệu lực theo BR-304 và snapshot giá, tham số (BR-006).
- AC2: Given chọn ngôn ngữ Anh hoặc Nga, When bấm "Sao chép gửi Zalo", Then văn bản báo giá bằng đúng ngôn ngữ đó và có ngày hết hiệu lực.
- AC3: Given báo giá `expired`, When tạo giữ chỗ từ báo giá đó, Then hệ thống yêu cầu lập báo giá mới theo giá hiện hành hoặc `manager`/`owner` gia hạn (Q4); `sales_staff`/`collaborator` chỉ gửi được yêu cầu gia hạn (A51 = D).

#### US-084 – Tạo đơn giữ chỗ (UC-02, B1, BR-302)
> Nghiệm thu S3 (17/10): **hạ về Đang nghiệm thu** – AC4: H12/H11 chưa vẽ mã VietQR cọc sau khi giữ chỗ (API có; chuỗi "tạo ngay sau khi giữ chỗ" hứa sai – PO-S3-04) → **Sprint 4** (S4-28*, cần cho luồng A1 của QC).
- AC1: Given báo giá `active` và căn còn trống, When tạo giữ chỗ với một mức hạn trong BR-302, Then đơn `hold` (viền đứt trên rack), hạn thực tế theo công thức BR-302 (khớp ví dụ BR-302: tạo 20:00 cho ngày đến hôm sau → hạn là mốc trần của ngày đến), căn bị chặn bán, có lệnh đồng bộ, báo giá → `converted`, lead → `holding`. *(bổ sung – INV quyết ESC-017 A 16/10)* Given `collaborator`/`sales_staff` đã có số giữ chỗ đang mở bằng mức tối đa của vai (BR-302, tham số `max_open_holds_per_user`; đếm theo người tạo hoặc người chốt, mỗi căn của đơn nhóm tính 1; FD+ không giới hạn), When tạo thêm giữ chỗ, Then bị chặn với thông báo đã đạt giới hạn; xác nhận cọc hoặc hủy một giữ chỗ thì tạo lại được.
- AC2: Given ngày đến là hôm nay, Then không tạo được giữ chỗ và được hướng sang tạo đơn đã thu (UC-02 A1).
- AC3: Given khách chưa có SĐT, Then không tạo được.
- AC4: Given giữ chỗ tạo xong, Then hiện số tiền cần thu (ngắn ngày: cọc BR-305; dài hạn: ký quỹ BR-206/BR-306) và VietQR/nội dung chuyển khoản theo mã đơn (US-120).

#### US-085 – Hết hạn giữ chỗ (B3, B6, BR-303)
> Nghiệm thu S2 (16/10) – **phần dời:** AC2 nhắc trước hạn (J2) + mục "Cần chú ý" → **Sprint 4**. AC1, AC3, AC4 đạt.
- AC1: Given đơn `hold` chưa có giao dịch cọc `succeeded`, When đến hạn, Then trong ngân sách độ trễ job của `architecture.md` mục 16, job chuyển đơn → `cancelled` lý do "Hết hạn giữ chỗ", mở phòng, có lệnh đồng bộ, lead → `quoted`, người tạo nhận thông báo (BR-303 – INV quyết ESC-006 16/10).
- AC2: Given đến mốc nhắc trước hạn của BR-303, Then người tạo nhận nhắc và đơn vào "Cần chú ý" với thời gian còn lại.
- AC3: Given người tạo gia hạn giữ chỗ trước hạn, Then hạn mới không vượt mức của BR-303 và trần của BR-302; lần gia hạn thứ hai bị chặn.
- AC4: Given job chạy trễ nhưng đã có giao dịch cọc `succeeded` trước hạn, Then đơn không bị hủy; Given tiền về sau khi đơn đã tự hủy, Then tạo cảnh báo "Tiền về cho đơn đã hủy" cho FD/sale (state-machines 1.3).

#### US-086 – Xác nhận cọc & sinh hợp đồng (UC-03, UC-07, B4, H1)
> Nghiệm thu S2 (16/10): AC1, AC2, AC5 đạt; AC4 phần **ảnh biên nhận** (cần tải tệp) → **Sprint 3**; phần đối soát theo ESC-017 A (AC5) nghiệm thu ở **Sprint 3** cùng đối soát giao dịch; AC3 dời R3 (R-C).
> Nghiệm thu S3 (17/10): AC5 đối soát theo ESC-017 A đạt (TC-L5-052, TC-L4-069); AC4 ô **ảnh biên nhận** khi CTV báo chuyển cọc chưa có trên Desk (API có) → **Sprint 4** (S4-30*); AC3 R3.
- AC1: Given đơn `hold` ngắn ngày, When FD+ hoặc `sales_staff` ghi giao dịch ≥ mức cọc BR-305 và xác nhận, Then đơn → `confirmed`, hạn giữ chỗ bị bỏ, lead → `won`, hoa hồng → `projected`.
- AC2: Given thu thiếu, Then giao dịch vẫn được ghi, đơn giữ `hold` và hiện "còn thiếu".
- AC3 **[Dời R3 – R-C]**: Given đơn giữ chỗ dài hạn theo dữ liệu ví dụ BR-208 (căn 302, khách NN, 6 tháng), When xác nhận ký quỹ (BR-206), Then sinh HĐ `signed` với lịch kỳ thu `scheduled` theo BR-207/BR-208 (số tiền mỗi kỳ = (thuê + dịch vụ) × chu kỳ, khớp ví dụ BR-208), ngày kết thúc theo BR-209 (khắc phục BL 8.2 #10).
- AC4: Given `collaborator`, Then không có nút xác nhận cọc; chỉ có "Báo đã chuyển cọc" kèm ảnh biên nhận và FD/sale nhận thông báo (A04 ✖, A53 – chờ INV xác nhận ở decision-log BA).
- AC5: Given xác nhận cọc, Then nhật ký tiền ghi số tiền, cách thanh toán, người xác nhận (BR-008). *(bổ sung – INV quyết ESC-017 A 16/10)* Given khoản do `sales_staff` ghi (mọi cách thu, kể cả tiền mặt) hoặc do `collaborator` báo, Then đơn vẫn được xác nhận ngay nhưng giao dịch mang cờ "chờ đối soát" (BR-527) tới khi FD+ tick đã thấy tiền/khớp sao kê; hoa hồng của chính người ghi chỉ chuyển "đạt" sau đối soát; giờ nhận tiền khai lùi và trần số tiền theo BR-527.

#### US-087 – CTV chỉ thấy phần của mình (rbac phạm vi M)
> Nghiệm thu S3 (17/10): AC3 kiểm lại với khách có giấy tờ C3 (TC-RB-001) – đạt.
- AC1: Given `collaborator` Minh Anh đăng nhập, When mở danh sách báo giá, đơn, khách tiềm năng, Then chỉ thấy mục do Minh Anh tạo, được gán hoặc là người chốt.
- AC2 *(bước 4 – thu hẹp ở R2, T4)*: Given `collaborator`, Then chỉ thấy hoa hồng **dự kiến** của mình trên chi tiết báo giá/đơn của mình; When gọi API báo giá hoặc đơn của người khác, Then nhận 404. Màn tổng hợp "Hoa hồng của tôi" (S17) thuộc US-089 (R3).
- AC3: Given `collaborator`, Then không thấy bất kỳ trường giấy tờ nào của khách, kể cả khách của mình (D03–D07 = K).

### EP14 – App khách

#### US-106 – Mở app khách bằng link/QR (ADR-006, A22)
> Nghiệm thu S3 (17/10): đạt phần R2 (AC3 theo P-R2-4 – không có phần nhạy cảm; xác minh nhẹ US-141 ở R3) → **Đạt (stack tạm)**.
- AC1: Given đơn `confirmed`, When lễ tân bấm "Gửi link check-in", Then có link riêng của đơn để sao chép; mở link trên điện thoại vào thẳng trang của đơn, không cần cài app hay tạo tài khoản.
- AC2 *(bước 4 – FB-R1-BA-PO-05)*: Given link của đơn A, Then không xem được dữ liệu đơn B. Given đơn chuyển `checked_out` (dài hạn: HĐ `closed`), Then mã cửa, Wi-Fi và gửi yêu cầu bị khóa **ngay**; link còn hiệu lực trong thời hạn ghi phát sinh sau trả phòng `post_checkout_charge_hours` (BR-427; mặc định 24 giờ – ADR-006, decision-log SEC M4) **chỉ** để xem bill và thanh toán khoản phát sinh; hết ân hạn → trang "đã hết hạn" kèm cách liên hệ. BA cập nhật rbac 8.6 theo AC này.
- AC3: Given mở phần nhạy cảm (giấy tờ, hóa đơn, mã cửa), Then cần thêm bước xác minh nhẹ theo US-141 (ADR-006).

#### US-107 – Check-in online (UC-10, K2)
> Nghiệm thu S3 (17/10): đạt cả 5 AC (H18 VI/EN + axe) → **Đạt (stack tạm)**. Chưa thử điện thoại thật – kiểm lại trên staging.
- AC1: Given khách sắp đến, When hoàn tất các bước (đọc thông báo xử lý dữ liệu → giấy tờ từng người → giờ đến dự kiến → chọn đồng ý lưu ảnh Có/Không, không tích sẵn), Then khai báo → `pre`, `front_desk` thấy giờ đến và nhận thông báo.
- AC2: Given khách bỏ dở ở bước giấy tờ, When mở lại link, Then tiếp tục từ bước còn dở, dữ liệu đã nhập vẫn còn.
- AC3: Given khách chọn **không** đồng ý lưu ảnh, Then vẫn hoàn tất check-in online; ảnh chỉ dùng để khai báo rồi xóa (BR-609, decision-log SEC; thay AC cũ "chưa đồng ý thì không hoàn tất").
- AC4: Given tệp sai loại hoặc quá lớn, Then báo lỗi và cho tải lại; Given link hết hạn hoặc không đúng đơn, Then trang lỗi kèm cách liên hệ lễ tân.
- AC5: Given khách dùng tiếng Anh, Then mọi bước, kể cả thông báo xử lý dữ liệu và mục đồng ý, bằng tiếng Anh đã duyệt (HR-01).

#### US-108 – Thông tin lưu trú
- AC1: Given đơn `confirmed`, Then trang hiện ngày nhận/trả, giờ chuẩn nhận/trả (BR-401), địa chỉ + chỉ đường, nội quy kèm phí phạt (BR-511).
- AC2 *(R2 theo R-C, P-R2-5: chỉ Wi-Fi theo khung hiệu lực; **phần mã cửa [Dời R3 – R-C]** cùng US-128 – R2 app khách không hiện mã cửa, lễ tân giao như hiện nay)*: Given trước thời điểm hiệu lực của mã cửa (BR-403), Then mã cửa và Wi-Fi bị ẩn với dòng "sẽ hiện vào ngày nhận phòng"; trong khoảng hiệu lực thì hiện; sau khi trả phòng thì ẩn (D22).

#### US-109 – Khách gửi yêu cầu (UC-15, SM-15)
- AC1: Given khách chọn "Báo hỏng" và ghi "Không có nước nóng", When gửi, Then thấy thẻ "Đã gửi" với thời điểm; nhãn trạng thái theo SM-15: Đã gửi · Đã nhận · Đang xử lý · Hoàn thành · Không thực hiện được. *(bổ sung – INV quyết ESC-016 A 16/10)* Given khách **ngắn ngày** chọn "Dọn thêm" khi căn đã được dọn đầy đủ trong ngày, Then app hiện phí theo BR-506 và khách phải bấm đồng ý phí trước khi gửi; phí vào folio khi buồng phòng làm xong; Given khách đã từ chối dọn buổi sáng (dọn bù) hoặc chỉ yêu cầu thay khăn/bổ sung đồ dùng, Then không có phí.
- AC2: Given nhân viên xử lý xong (`done`), Then trang khách đổi thành "Hoàn thành"; Given `declined`, Then khách thấy lý do.

#### US-110 – Định tuyến yêu cầu (BR-811, BR-809)
- AC1: Given yêu cầu "Báo hỏng", Then tạo phiếu sửa mức mặc định theo BR-809 nguồn "App khách"; "Dọn phòng thêm"/"Khăn, đồ dùng" → việc buồng phòng; "Đặt xe, tour"/"Trả muộn"/"Khác" → việc lễ tân (BR-811).
- AC2: Given yêu cầu chưa được "Đã nhận" sau thời hạn của BR-811 trong giờ trực, Then `front_desk` nhận nhắc; ngoài giờ trực, Then khách nhận trả lời tự động kèm giờ xử lý.
- AC3: Given `housekeeping`/`maintenance`, Then chỉ thấy yêu cầu được định tuyến tới bộ phận mình (S30 = T).

#### US-111 – Khách xem folio
> **[Dời R3 – R-C]** cả story (INV quyết ESC-012 16/10). R2 app khách không hiện folio (plan R2 P-R2-4).
- AC1: Given đơn có tiền phòng, 1 dòng minibar và đã cọc, Then trang khách hiện các dòng, tổng, đã trả, còn phải trả khớp với chi tiết đơn ở Desk.
- AC2: Given folio có dòng/ghi chú nội bộ (ví dụ giá vốn, ghi chú lễ tân), Then không hiện cho khách.

#### US-112 – App khách tiếng Anh (HR-01)
- AC1: Given khách bấm chuyển "English", Then mọi chữ trên trang (menu, nút, lỗi, trạng thái yêu cầu) là tiếng Anh; không còn chuỗi tiếng Việt cố định.
- AC2: Given hồ sơ khách có ngôn ngữ "English" hoặc trình duyệt dùng tiếng Anh, When mở link lần đầu, Then trang mặc định tiếng Anh; vẫn chọn tay được ở đầu trang.
- AC3: Given các chuỗi pháp lý (thông báo xử lý dữ liệu, đồng ý, chính sách hủy, nội quy), Then bản tiếng Anh là bản dịch đã được duyệt theo content-guide của UXD, không dịch máy.

### EP15 – Thanh toán & hóa đơn

#### US-119 – Ghi nhận thu tiền (SM-12, BR-521)
> Nghiệm thu S3 (17/10): AC1, AC2, AC4, AC6 đạt; AC3 API đạt (TC-L4-062) nhưng Desk chưa có nút **"Đảo giao dịch"** cho MGR/OWN → **Sprint 4** (S4-27*); AC5 R3.
- AC1: Given đơn tổng 2.460.000 đã thu cọc 800.000, When ghi thu 1.660.000 bằng chuyển khoản, Then còn phải thu = 0 và đơn có 2 giao dịch `succeeded` với cách thanh toán, người thu, thời điểm.
- AC2: Given đơn OTA kiểu "OTA thu hộ" (BR-307), Then tiền phòng không cộng vào còn phải thu tại quầy, chỉ còn phát sinh.
- AC3: Given ghi thu sai, Then chỉ `manager`/`owner` tạo giao dịch đảo (`reversed`) có lý do; không xóa được (A34, BR-008).
- AC4: Given `sales_staff`, Then chỉ ghi thu cọc cho đơn của mình; `collaborator` không ghi thu được (A33).
- AC5 **[Dời R3 – R-C]** *(bước 4 – FB-R1-BA-PO-04; làm cùng US-086 AC3)*: Given HĐ dài hạn có kỳ thu `scheduled`/`due`, When FD+ ghi một giao dịch thu và gắn vào kỳ đó (rbac A58, UC-08, SM-07 T2), Then kỳ → `paid` khi đủ tiền, nhắc thu của kỳ trong "Cần chú ý" tắt, và job quá hạn (BR-207) không còn chuyển kỳ này sang `overdue`. Danh sách HĐ và nhắc thu đầy đủ vẫn ở US-088 (R3).
- AC6 *(bước 4 – UC-32, BR-527)*: Given lễ tân/sale tự ghi giao dịch chuyển khoản "đã nhận" (chưa có xác nhận tiền về tự động), Then giao dịch mang cờ **"chờ đối soát"** cho tới khi `manager`/`owner` tick đã khớp sao kê; danh sách chờ đối soát lọc được theo ngày và người ghi. Màn đóng ca đầy đủ ở US-124 (R3). *(bổ sung – INV quyết ESC-017 A 16/10)* Khoản do `sales_staff` ghi bằng **mọi cách thu** (kể cả tiền mặt, quẹt thẻ) cũng mang cờ "chờ đối soát" như trên (US-086 AC5).

#### US-120 – VietQR (I2)
> Nghiệm thu S3 (17/10): đạt cả 2 AC (tài khoản thử – ESC-010) → **Đạt (stack tạm)**. QR cọc khi giữ chỗ: xem US-084.
- AC1: Given còn phải thu 1.660.000 và chọn chuyển khoản, Then hiện mã VietQR theo chuẩn với số tiền 1.660.000 và nội dung = mã bill/đơn không dấu cách (BR-521).
- AC2: Given chưa cấu hình tài khoản nhận (bộ kênh B – INV quyết ESC-010 16/10; tài khoản ngân hàng `[GIẢ ĐỊNH – chờ INV xác nhận]` – INV gửi; R2 dùng tài khoản thử), Then không hiện QR giả mà hiện "Chưa cấu hình tài khoản nhận" cho `manager`/`owner`.

### EP16 – Giao tiếp với khách

#### US-125 – Mẫu tin nhắn đa ngôn ngữ
> **[Dời R3 – R-C]** cả story (INV quyết ESC-012 16/10); làm cùng tiếng Nga US-115 ở R3.
- AC1: Given đơn của khách có ngôn ngữ Nga, When chọn mẫu "Link check-in", Then văn bản tiếng Nga có tên khách, ngày nhận/trả, link check-in điền sẵn và nút sao chép.
- AC2: Given đổi ngôn ngữ sang Anh/Việt, Then nội dung đổi tương ứng, dữ liệu đơn giữ nguyên.
- AC3: Given mẫu có chèn mã cửa, Then chỉ FD+ dùng được mẫu đó (D22); mẫu không bao giờ chèn số giấy tờ (rbac mục 8.3).

#### US-161 – Lịch nhắn tin + "Tin cần gửi hôm nay" – *mới 17/10, Must R3 (Sprint 1)*
> Nguồn: tin nhắn INV 17/10; DOM `rounds/round-02/outputs/DOM/guest-messaging-journey.md` (TP-00…TP-15, tham số mục 8 – BR-971…983 còn dự thảo, DOM đưa vào `business-rules.md` trước khi BE làm); SEC `landing-zalo-SEC.md`. Chạy được ở mọi phương án ESC-021 (kể cả C – gửi tay). Phụ thuộc US-125 (mẫu tin).
- AC1: Given đơn `confirmed` (ngắn ngày hoặc dài hạn), Then Desk lập lịch tin theo mốc mặc định của DOM (tham số `guest_msg.*`, `oci.*`, `pre_arrival.offset`…; `owner` chỉnh được); đơn đổi ngày/căn/hủy → lịch tính lại, tin cũ hủy; tin quá hạn gửi thì bỏ, không gửi muộn, và tạo việc cho lễ tân (BR-980 dự thảo).
- AC2: Given đầu ngày nghiệp vụ, When FD+ mở "Tin cần gửi hôm nay", Then thấy tin đến hạn theo giờ, soạn sẵn đúng ngôn ngữ của đơn (mẫu US-125), dữ liệu lấy từ đơn và tham số BR (không gõ tay giờ, giá); "Sao chép" ghi `message_log` = `copied` (không ghi nội dung, link); "Bỏ qua" bắt buộc lý do.
- AC3: Given liên hệ của khách, Then gợi ý kênh theo thứ tự: chat Zalo OA (khách đã nhắn OA) → Zalo theo SĐT khách **tự đưa** cho OTTIMO → hộp thư OTA (đơn OTA) → email → gọi điện. SĐT/email nhận từ OTA chỉ dùng cho hộp thư OTA và gọi điện vận hành (SEC DOM-02, lưu nguồn liên hệ `ota` | `guest_provided`). Đơn Airbnb: tin không có link, không mã giảm (DOM mục 5).
- AC4: Given khách đã làm việc mà tin nhắc tới (đã check-in online, đã chọn giờ trả), Then tin nhắc đó tự bỏ. Mỗi đơn không quá `guest_msg.max_proactive_per_day` tin chủ động/ngày; tin chủ động chỉ trong `guest_msg.send_window`, ngoài khung thì dời sang đầu khung kế tiếp nếu chưa quá hạn.
- AC5: Given tin có link trang khách, Then link dùng **token thông báo** (mức 1, hạn ≤ 7 ngày, tối đa 1 token thông báo còn hiệu lực/đơn, không thu hồi link lễ tân đã gửi – SEC INT-09, C-6); `collaborator` thấy việc nhưng không chép được tin có link (SR-MSG-03); tin không bao giờ chứa mã cửa, số giấy tờ (SEC C-7, C-10).
- AC6: Given US-126 đã bật cho một kênh, Then cùng lịch đó tự gửi qua kênh ấy; gửi lỗi hoặc khách không có kênh tự động → tin quay về danh sách gửi tay; lịch không đổi.

#### US-162 – Mời/nhắc check-in online và nhắc trước ngày đến kèm vị trí – *mới 17/10, Must R3*
> Lấp khoảng trống INV hỏi 17/10 ("gửi check-in online, remind ngày nhận phòng, gửi vị trí"): US-034 chỉ nhắc **trả phòng**. Đi qua lịch US-161; tự gửi khi US-126 bật.
- AC1: Given đơn trực tiếp vừa `confirmed`, Then tin xác nhận kèm lời mời check-in online (link trang khách, US-107). Given đơn OTA, Then lời mời gửi theo `oci.invite_offset` (mặc định D-4 10:00) trong hộp thư OTA, ghi rõ đây là khai báo lưu trú theo luật Việt Nam, khác check-in của OTA.
- AC2: Given khách chưa check-in online và còn ≥ `oci.min_lead_days_for_nudge` ngày tới ngày đến, Then nhắc **một** lần theo `oci.nudge_offset` (mặc định D-2 10:00); khách đã làm thì không nhắc.
- AC3: Given D-1 theo `pre_arrival.offset` (mặc định 10:00), Then tin nhắc có: ngày và giờ nhận phòng chuẩn (BR-401), địa chỉ dạng chữ, nút "Xem chỉ đường" mở trang khách (US-108 – cùng nguồn địa chỉ với landing US-148), chỗ đỗ xe (`property.parking_info`), cách liên hệ khi đến khuya; **không** có mã cửa, số căn, Wi-Fi.
- AC4: Given đơn đặt sát ngày (đặt trong ngày đến, hoặc D-1 sau mốc nhắc), Then gộp xác nhận + mời check-in + nhắc đến thành **một** tin (BR-975 dự thảo).
- AC5: Given ngôn ngữ của đơn VI/EN (RU khi có US-115), Then tin đúng ngôn ngữ; bản gửi qua Zalo dùng câu chữ mẫu đã được Zalo duyệt (US-126). Dữ liệu thử: căn 202, đặt 15/10, đến 23/10 → lịch khớp ví dụ DOM mục 4.

#### US-126 – Tự gửi qua Zalo OA/ZNS hoặc email – *Should R3; AC mới 17/10 theo ESC-021 và SEC*
> Giữ **Should**: phụ thuộc tài khoản của INV và Zalo duyệt mẫu; khi chưa có, US-161 vẫn chạy gửi tay. Xếp Sprint 1 (bản giả lập) → Sprint 2 (nối thật) nếu INV chọn ESC-021 A; chọn C thì chỉ bật email.
- AC1: Given `owner` bấm "Kết nối Zalo OA" trên thiết bị được cấp (xác nhận lại mật khẩu), Then chỉ nhận đúng OA của OTTIMO; OA khác → từ chối, không lưu khóa, ghi nhật ký bảo mật; khóa kết nối lưu mã hóa (SEC C-5).
- AC2: Given tin đến hạn từ US-161 và khách có kênh tự động, Then gửi trong khung giờ tham số (tin mẫu Zalo mặc định [08:00, 21:00)), mỗi tin tối đa một lần (không tự gửi lại khi hết thời gian chờ sau lúc đã gửi); ghi trạng thái gửi và chi phí ước; lỗi → về danh sách gửi tay.
- AC3: Given khách chặn tin OA/ZNS hoặc nhắn từ chối, Then kênh Zalo của khách tắt ngay; tin vận hành chuyển kênh khác; tin ưu đãi dừng (SEC C-8).
- AC4: Given một mẫu tin, Then chỉ dùng biến trong danh sách cho phép **theo mẫu và theo kênh**; render có mã cửa, số giấy tờ, ngày sinh, mã xác minh, số căn trước ngày đến → không gửi (`422`) (SEC C-7); nhật ký gửi không chứa SĐT, nội dung, token (SEC C-9); webhook Zalo kiểm chữ ký trên thân thô (SEC C-4).
- AC5: Given chưa có tài khoản Zalo hoặc chưa đạt SEC C-4…C-9, Then kênh Zalo chạy giả lập; email vẫn gửi được; không gửi tin tự động tới khách thật trước SEC-G1, SEC-G2 và máy chủ thật.

#### Ghi chú lịch các story Zalo khác (theo ESC-021 – đội đề xuất A; AC đầy đủ viết đầu R3)
- **US-034** (nhắc trả phòng): Sprint 1 R3 qua danh sách US-161 (TP-07: R-1 20:00; R 09:00 chỉ khi khách chưa chọn – BR-425); nút "Chọn giờ trả phòng" mở trang khách; tự gửi khi US-126 bật. 11:00 chưa trả lời → lễ tân gọi, không gửi thêm tin.
- **US-116** tách hai phần: (a) cảm ơn + bill sau trả phòng, mời đánh giá R+1 cho **mọi** khách (không lọc khách hài lòng; hoãn khi còn khiếu nại mở) – Sprint 2–3; (b) mã đặt trực tiếp là **tin marketing riêng**, chỉ gửi người đã đồng ý (US-077), không gửi khách OTA nếu INV chọn ESC-021 K1-A, không gắn ưu đãi với việc để lại đánh giá (SEC INT-11, DOM-05).
- **US-040, US-138:** bill qua Zalo dùng mẫu "xác nhận thanh toán" của US-126; bill đơn OTA không in mã đặt trực tiếp.
- **US-163** (hộp thư Zalo trong Desk): R4+, sau khoảng 1 tháng chat OA; điều kiện SEC C-4 (webhook) và INT-12.

### EP17 – Khóa cửa & thẻ phòng

#### US-128 – Mã cửa trong đơn (BR-403, A21, D22)
> **[Dời R3 – R-C]** cả story (INV quyết ESC-012 16/10). Điều kiện trước khi cài A21: plan R2 W15 (step-up mã cửa – BUG-R1-SEC-10).
- AC1: Given FD+ nhập mã cửa, Then hiệu lực mặc định từ giờ nhận đến giờ trả (gồm trả muộn đã duyệt) theo BR-403; app khách chỉ hiện mã trong khoảng đó.
- AC2: Given `housekeeping`, `maintenance`, `sales_staff`, `collaborator`, Then không thấy mã cửa của khách; FD+ xem có nhật ký C3.
- AC3: Given trả phòng hoặc đổi phòng, Then mã cũ hiển thị "đã hủy" và có việc nhắc lễ tân xóa mã trên app khóa (MVP nhập tay – INV quyết ESC-011 16/10; thông tin khóa `[GIẢ ĐỊNH – chờ INV xác nhận]` – INV gửi).

### EP12 – Kênh OTA

#### US-139 – Xung đột đơn OTA trùng (BR-312, SM-01 mục 1.3) – *bước 4: nâng Must R2*
> Nghiệm thu S2 (16/10): AC1, AC2 đạt; AC3 chặn nhận phòng `RESERVATION_UNASSIGNED` kiểm ở **Sprint 3** (cùng nhận phòng).
> Nghiệm thu S3 (17/10): AC3 có ở code (`RESERVATION_UNASSIGNED`, ẩn nút Nhận phòng) nhưng chưa có ca test chạy → QA **Sprint 4** (TC-L2-026, S4-33*).
- AC1: Given đơn OTA trùng căn – đêm với đơn đã có (R2: lễ tân nhập tay theo US-018 AC5; R3: channel manager gửi về – US-095), Then đơn OTA vẫn được tạo `confirmed`, gắn cờ "Xung đột", **không** chiếm tồn phòng, nằm ở làn "Chưa gán căn" trên rack và cảnh báo đỏ ngay cho `front_desk` và `manager`.
- AC2: Given đơn có cờ xung đột, Then hệ thống gợi ý căn theo thứ tự BR-316 ( căn ánh xạ → căn trống cùng nhóm, ưu tiên `VI`/`VC` và ít tạo đêm lẻ; nhóm khác chỉ là gợi ý, thứ tự nhóm theo cấu hình); không bao giờ tự đổi căn mà không báo; lễ tân/quản lý gán căn bằng B7 (hoặc dời đơn khác bằng B7/B14, kèm lý do – US-024); không dời khách đang ở, khách dài hạn, khách quen (BR-312). Cờ chỉ tắt khi đơn đã có căn và không còn trùng; thời hạn có phương án, xử lý đồng bộ lỗi kéo dài và bản ghi chi phí xung đột theo BR-317.
- AC3: Given đơn còn cờ xung đột hoặc chưa gán căn, When bấm nhận phòng, Then bị chặn với thông báo "Đơn chưa được gán căn" (`RESERVATION_UNASSIGNED`).


### Story mới bước 4 (R2)

#### US-141 – Xác minh nhẹ trên app khách (decision-log SEC, PHÂN XỬ ORC) – *mới, Must R2 → **[Dời R3 – R-C]***
> Dời cả story (INV quyết ESC-012 16/10) với điều kiện P-R2-4 của plan R2: R2 app khách không hiện dữ liệu nhạy cảm nào; SEC xác nhận trong tuần 1, SEC không đồng ý thì story quay lại R2.
- AC1: Given đơn có email, When khách mở phần nhạy cảm (mã cửa, hóa đơn, giấy tờ) lần đầu, Then app gửi mã một lần tới email của đơn; nhập đúng → mở được trong phiên; 4 số cuối SĐT và mã đặt phòng **không** được dùng làm yếu tố xác minh.
- AC2: Given đơn không có email, When FD+ cấp mã xác minh tại Desk, Then lễ tân đọc/gửi mã cho khách; gửi qua kênh nhắn tin OTA hoặc Zalo chỉ khả dụng khi `owner` đã bật kênh đó (mặc định **tắt** – PHÂN XỬ ORC).
- AC3: Given nhập sai mã quá số lần cho phép (SEC, đếm theo link), Then tạm khóa xác minh của link đó, khách thấy hướng dẫn liên hệ lễ tân, nhật ký ghi sự kiện.

#### US-142 – Thiết bị được cấp cho dữ liệu C3 (decision-log SEC) – *mới, Must R2*
> Nghiệm thu S1 (16/10): AC1 đạt; AC2, AC3 → **Sprint 3** (cần giấy tờ C3 và nhận phòng).
> Nghiệm thu S3 (17/10): AC2 (TC-RB-022, TC-SEC-010) và AC3 (nhận phòng 01:30 trên máy được cấp – TC-L3-008) đạt → **Đạt (stack tạm)**.
- AC1: Given `owner` cấp quyền cho một thiết bị của cơ sở (máy quầy, máy tính bảng), Then thiết bị có trong danh sách "thiết bị được cấp" kèm tên, người cấp, ngày; `owner` thu hồi được bất kỳ lúc nào (có hộp xác nhận – US-135).
- AC2: Given FD+ dùng thiết bị **chưa** được cấp hoặc PWA trên điện thoại, When mở ảnh/số giấy tờ, khai báo hoặc "Sao chép dữ liệu" (A71, A73), Then bị từ chối, giao diện hướng dẫn dùng máy quầy; nhật ký C3 ghi lần bị từ chối.
- AC3: Given người trực đêm làm việc trên thiết bị của cơ sở đã được cấp (PHÂN XỬ ORC), Then nhận phòng và khai báo cho khách đến khuya đầy đủ như ca ngày.

### Story mới Must R3 (bước 4)

#### US-140 – Đơn nhóm nhiều căn (FB-R1-DOM-PO-02) – *mới, Must R3*
- AC1: Given sale tạo đơn nhóm 3 căn cho một người đặt, Then có một mã nhóm liên kết 3 đơn căn, mỗi đơn vẫn kiểm trùng riêng (US-018), một khoản cọc chung phân bổ theo căn theo quy tắc nhóm của DOM (BR-321…326).
- AC2: Given hủy 1 căn trong nhóm, Then chỉ đơn căn đó `cancelled`, phí/hoàn tính theo BR-309 trên phần cọc đã phân bổ cho căn đó; hủy cả nhóm → mọi đơn căn `cancelled` sau một hộp xác nhận (US-135).
- AC3: Given trả phòng nhóm, Then mặc định bill gộp một người trả; chọn được tách bill theo căn; số bill vẫn theo BR-007.
- AC4: Given hạn danh sách khách của nhóm (BR-323), Then mỗi căn có bản ghi khai báo riêng và nhóm vào "Cần chú ý" nếu căn nào thiếu tên khách trước hạn.

#### US-124 – Đóng ca / bàn giao ca (FB-R1-DOM-PO-06) – *bước 4: nâng Must R3*
- AC1: Given cuối ca, When `front_desk` bấm "Đóng ca", Then thấy tổng thu của ca theo cách thanh toán (BR-521) và phải nhập số tiền mặt đếm thực tế; chênh lệch khác 0 bắt buộc lý do và báo `manager`.
- AC2: Given các giao dịch chuyển khoản lễ tân tự ghi "đã nhận" trong ca, Then chúng nằm trong danh sách "chờ đối soát" cho tới khi `manager`/`owner` tick đã khớp sao kê (BR-526, BR-527).
- AC3: Given ca kế tiếp đăng nhập, Then thấy biên bản bàn giao: tiền mặt bàn giao, việc tồn (khai báo chưa xong, khách chưa đến, yêu cầu khách đang mở).

#### US-143 – Xác thực hai bước cho owner/manager (decision-log SEC) – *mới, Must R3*
- AC1: Given tài khoản `owner` hoặc `manager` chưa bật 2FA, When đăng nhập trên bản có dữ liệu thật, Then bị buộc thiết lập mã từ ứng dụng xác thực trước khi vào app.
- AC2: Given đã bật, When đăng nhập với mật khẩu đúng nhưng mã sai, Then không vào được và nhật ký ghi lần thất bại.

### Story khác ngoài R2 – điều chỉnh bước 4
- **US-074 (Should R3)** nhận AC chuyển từ US-023: "Given một hồ sơ khách bị gộp, Then mã cũ vẫn tra được và trỏ tới hồ sơ được giữ lại (BR-953)". QA chuyển TC-NT-023 sang US-074.
- **US-089 (Must R3)** nhận màn "Hoa hồng của tôi" (S17) từ US-087.
- **US-100 (Must R3)**: thêm AC "các đối chiếu R-01…R-07 của `metrics-definitions.md` đều khớp trên dữ liệu thử" (T11).
- **US-144 (Could R3)** – chốt số liệu tháng: AC viết ở R3 cùng DATA.
- **US-145 (Should R3)** – vận hành dự phòng (UC-33): AC viết đầu R3 theo BR-961…964. Lý do Should R3: cần lõi R2 trước; khi chưa có, quầy vẫn dùng sổ giấy theo mẫu (BR-962). Phải xong trước khi đưa dữ liệu thật vào vận hành.
- **Quyết định xếp round theo đề nghị BA (UC-31…33):** đơn nhóm US-140 giữ **Must R3** (R2 đã vượt ước lượng – ESC-012; R2 dùng đơn rời + ghi chú nhóm). Đóng ca: phần **cờ "chờ đối soát"** cho chuyển khoản ghi tay là **Must R2** (US-119 AC6 – dữ liệu tiền phải đúng từ ngày đầu); màn đóng ca đầy đủ US-124 **Must R3** vì R2 chưa vận hành tiền thật (chưa có dữ liệu khách thật trước khi có RC). Mất mạng/mất điện US-145 **Should R3**.

### EP19 – Landing page ottimo.vn (FB-INV-001, ESC-020) – *mới 17/10/2026*
Quy ước riêng cho EP19:
- "Khách tiềm năng" = người xem trang công khai, **không** có tài khoản, không phải vai `guest` (link của đơn). Trang v1 không gọi API của Desk.
- AC viết theo phương án đội đề xuất ở **ESC-020** (L1-A … L6-A). INV chọn khác → PO sửa AC liên quan trong ngày.
- **Brand Guidelines v1.0** (INV 17/10, `00-brief/context/brand/brand-guidelines.md`) áp cho mọi chữ, màu, ảnh của landing; lệch với design system cũ hoặc e-brochure thì guideline thắng (landing không dùng terracotta). Nguồn chữ gốc: e-brochure 2026 (`00-brief/context/landing/ebrochure-text.md`).
- Điều kiện SEC (`rounds/round-02/reviews/landing-zalo-SEC.md`): **C-1** (không tải tài nguyên bên thứ ba khi mở trang, không script/style nội tuyến) là điều kiện cổng LP-v1; **C-2, C-3** là điều kiện bật form US-155.
- Con số quy tắc vẫn ghi bằng mã BR (giá trị tham số hiện hành lúc dựng trang). Mọi chữ hiển thị là bản INV đã duyệt (L5); không đăng thông tin chưa được INV xác nhận.
- Khe ảnh, khung giữ chỗ, cổng lên mạng: `rounds/round-02/outputs/PO/landing-scope.md` mục 5 và 8.

#### US-146 – Trang giới thiệu – *Must, LP-v1*
- AC1: Given khách mở tên miền gốc trên điện thoại (màn ≥ 360px) hoặc máy tính, Then màn đầu có: ảnh khe `hero`, tên "OTTIMO Boutique Stay", câu giới thiệu đã duyệt, "Đà Lạt" + khu vực, hai lối "Ở ngắn ngày" / "Thuê tháng" dẫn tới phần căn tương ứng, và nút "Đặt phòng".
- AC2: Given khách cuộn tới bất kỳ phần nào, Then nút "Đặt phòng" vẫn trong tầm nhìn (trên điện thoại là thanh cố định) và không che nội dung hay nút khác.
- AC3: Given các phần Căn · Tiện nghi · Vị trí · Chính sách · Câu hỏi · Liên hệ, Then menu dẫn tới đúng phần; trên điện thoại menu gọn trong một nút; mỗi phần có địa chỉ neo riêng để gửi link thẳng.
- AC4: Given chưa có nội dung INV duyệt (ESC-020 L5) hoặc chưa có thông tin liên hệ (L2), Then trang **không** được đưa lên tên miền công khai; chỉ có bản xem thử gắn `noindex`.

#### US-147 – 10 căn theo nhóm – *Must, LP-v1*
- AC1: Given danh mục căn hiện hành (US-004; BL 4.1), Then trang hiện **4 hạng phòng** theo e-brochure 2026 (Studio hướng thành phố, Studio hướng vườn, Premium 1 phòng ngủ + 1, Signature 2 phòng ngủ) với sức chứa và diện tích theo brochure, ánh xạ tới 3 nhóm giá trong Desk (Lầu 1–2, Căn N, Căn N+) theo bảng ghép INV gửi (ESC-020 mục "Còn thiếu" 4); khách thấy **tên phòng** (The Pine … The Ember), không thấy số căn (Brand Guidelines mục 3). Mỗi hạng có ảnh đại diện, mô tả ngắn, số người theo định mức và tối đa (BR-110), tiện nghi chính theo thông tin INV gửi (ESC-020 L5 mục 3), danh sách căn trong nhóm (tên căn chỉ hiện nếu INV đồng ý – L5 mục 4).
- AC2: Given khách bấm ảnh của một nhóm, Then mở thư viện ảnh của nhóm; xem tiếp bằng vuốt hoặc phím mũi tên; đóng bằng nút hoặc Esc; mỗi ảnh có mô tả thay thế VI/EN.
- AC3 *(theo ESC-020 L3-A)*: Given một nhóm căn, Then hiện "Thuê tháng từ {giá}" = giá tháng niêm yết thấp nhất của nhóm (BR-101), ngay dưới có ghi chú: giảm theo kỳ hạn (BR-201), chưa gồm phí dịch vụ (BR-204) và điện nước theo công tơ (BR-501), khách nước ngoài +10% (BR-109). Ngắn ngày hiện "Giá tốt nhất khi đặt trực tiếp" + nút "Nhận báo giá" (mở US-151); **không** hiện số giá đêm. Dữ liệu thử: Lầu 1–2 "từ 8.000.000 đ/tháng" (căn 101).
- AC4: Given giá tháng niêm yết trong Desk khác số đang hiện trên trang, Then bản phát hành kế tiếp không được ra với số cũ: số "từ" lấy từ một nguồn duy nhất (danh mục căn) lúc dựng trang, có bước so khớp trong checklist phát hành; trang ghi "Giá cập nhật {ngày}".
- AC5: Given ảnh của nhóm chưa có (chưa tải từ Drive hoặc chưa biết thư mục "Phòng n" thuộc nhóm nào), Then hiện khung giữ chỗ đúng tỉ lệ, nhãn "Ảnh đang cập nhật"; **không** dùng ảnh mẫu (stock) hay ảnh không phải của OTTIMO.

#### US-148 – Tiện nghi và vị trí – *Must, LP-v1*
- AC1: Given phần Tiện nghi, Then chỉ liệt kê tiện nghi chung INV đã xác nhận, mỗi mục có chữ + biểu tượng (không chỉ biểu tượng – PRD N9); tiện nghi chưa xác nhận không hiện.
- AC2: Given phần Vị trí, Then có địa chỉ đầy đủ (sao chép được), bản đồ, nút "Chỉ đường" mở ứng dụng bản đồ tới đúng ghim INV gửi, và các khoảng cách tham khảo INV đã duyệt (ví dụ sân bay Liên Khương, chợ đêm) ghi kèm "khoảng".
- AC3: Given địa chỉ và ghim bản đồ, Then dùng **cùng một nguồn** với trang thông tin lưu trú của app khách (US-108 AC1): sửa một nơi thì cả hai đúng (ARC chọn cách).
- AC4 *(riêng tư)*: Given khách chưa bấm vào bản đồ, Then trang chưa tải nội dung của bên thứ ba có thể theo dõi khách (bản đồ nhúng, script mạng xã hội, widget chat); bấm "Xem bản đồ" mới tải hoặc mở ứng dụng bản đồ. SEC xác nhận danh sách bên thứ ba được phép.

#### US-149 – Tóm tắt chính sách – *Must, LP-v1*
- AC1: Given phần Chính sách, Then có: giờ nhận/trả chuẩn (BR-401) và việc nhận sớm/trả muộn có phụ thu (BR-411, BR-412); cọc đặt trực tiếp (BR-305); hủy và hoàn cọc, gồm ngày cao điểm (BR-309, BR-104); nội quy chính và phí phạt (BR-511); thuê tháng gồm những gì (BR-203, BR-204, BR-206, BR-501); cần giấy tờ tùy thân để khai báo lưu trú theo luật.
- AC2: Given con số trong chính sách (giờ, %, phí), Then đúng giá trị tham số hiện hành của BR lúc dựng trang; chữ pháp lý bản EN là bản đã duyệt (content-guide 5.6), không dịch máy.
- AC3: Given khách đặt qua OTA, Then trang ghi rõ: điều kiện hủy và thanh toán của đơn OTA theo OTA đã đặt (BR-307), chính sách trên trang chỉ áp cho đặt trực tiếp.
- AC4: Given một chính sách đang chờ INV quyết (ví dụ ESC-019), Then trang không nêu điểm đó; chính sách đổi thì cập nhật ở bản phát hành kế tiếp.
- AC5 *(Should trong story Must – không chặn cổng LP-v1; bắt buộc trước US-155 – SEC mục 6)*: Given chân trang, Then có link tới trang quyền riêng tư ngắn VI/EN: trang không dùng cookie theo dõi, chỉ đếm tổng số lượt theo ngày; nhật ký máy chủ giữ theo hạn SEC; link sang Zalo/WhatsApp/bản đồ theo chính sách của họ; cách liên hệ OTTIMO.

#### US-150 – Câu hỏi thường gặp – *Should, LP-v1*
- AC1: Given phần Câu hỏi thường gặp, Then có các câu INV đã duyệt (gợi ý: đi từ sân bay, đến khuya và check-in online, gửi hành lý, giặt ủi, hóa đơn VAT, thú cưng, chỗ để xe, Wi-Fi và làm việc từ xa, thuê tháng); mỗi câu mở/đóng được bằng chuột, chạm và bàn phím.
- AC2: Given câu trả lời có con số quy tắc, Then theo US-149 AC2; câu INV chưa trả lời (ví dụ thú cưng) thì không đăng.
- AC3 *(SEC DOM-06)*: Given mục Hỏi đáp, Then có câu chống giả danh đã duyệt: OTTIMO chỉ nhắn từ Zalo OA đã xác thực và hộp thư OTA; không bao giờ đổi số tài khoản nhận tiền qua tin nhắn, không hỏi số thẻ.

#### US-151 – Liên hệ và nút "Đặt phòng" (v1) – *Must, LP-v1*
- AC1 *(theo ESC-020 L2-A)*: Given khách bấm "Đặt phòng" hoặc "Nhận báo giá", Then hiện lựa chọn kênh: **Zalo** (mở chat Zalo OA của OTTIMO – trên điện thoại mở ứng dụng Zalo nếu có), **WhatsApp · Telegram · Viber** (số quốc tế của cơ sở in trong e-brochure – ESC-020 L2-A), **Gọi điện** (mở trình gọi với số công khai), **Email** (mở thư mới tới địa chỉ công khai, tiêu đề điền sẵn "Đặt phòng – OTTIMO"). Bản VI xếp Zalo trước; bản EN xếp WhatsApp/Telegram trước. Ô "Hỏi phòng trống" (nếu UXD giữ) chỉ soạn sẵn tin trên máy khách, không gửi dữ liệu về OTTIMO, không gửi ngày/số khách vào bộ đếm (SEC UXD-03).
- AC2: Given OTTIMO chưa có Zalo OA đã xác thực (ESC-020 L2), Then nút Zalo dùng Zalo của số điện thoại **cơ sở** (không dùng Zalo cá nhân của nhân viên – SEC INT-13); đổi sang OA chỉ bằng thay cấu hình nội dung, không sửa giao diện.
- AC3: Given bản v1, Then trang **không** có form, không lưu dữ liệu cá nhân của khách và không có link dẫn sang trang OTA.
- AC4: Given sale/lễ tân tạo đơn trực tiếp cho khách đến từ website, Then chọn được nguồn đúng theo BR-112 để đo G3 khi chưa có US-158 (DOM làm rõ: khách xem website rồi nhắn Zalo tính `website` hay `zalo_phone` – câu hỏi nội bộ ở landing-scope mục 9).
- AC5 *(v2)*: Given US-155/US-131 đã phát hành, Then nút "Đặt phòng" dẫn tới form/phòng trống thật; Zalo, gọi, email vẫn ở phần Liên hệ.
- AC6 *(SEC DOM-05)*: Given trang ở v1 hoặc v2, Then **không** có ô đăng ký nhận ưu đãi/bản tin; thay bằng nút "Quan tâm Zalo OA" (khách tự bấm trên Zalo của mình). Mục "Đặt xong, OTTIMO lo phần còn lại" chỉ hứa ưu đãi lần sau "nếu bạn muốn nhận" (SEC UXD-03).

#### US-152 – Song ngữ Việt – Anh – *Must, LP-v1*
- AC1: Given khách chọn "English", Then mọi chữ (menu, nút, mô tả ảnh, chính sách, câu hỏi, tiêu đề trang) là tiếng Anh đã duyệt, không còn chuỗi tiếng Việt cố định; mỗi ngôn ngữ có địa chỉ riêng để gửi link và để công cụ tìm kiếm nhận ra.
- AC2 *(sửa 17/10 – ARC viết theo ADR-014 mục 3, chờ PO xác nhận; thay bản cũ "trình duyệt tiếng Anh thì gợi ý EN")*:
  - **Mặc định:** Given khách mở bất kỳ địa chỉ nào của trang, Then trang hiện đúng ngôn ngữ của địa chỉ đó. Tên miền gốc là bản tiếng Anh (Brand Guidelines: tiếng Anh dẫn dắt); bản Việt ở `/vi/`.
  - **Không tự chuyển:** trang **không** tự chuyển sang ngôn ngữ khác theo cài đặt trình duyệt.
  - **Gợi ý:** When ngôn ngữ của trình duyệt, hoặc ngôn ngữ khách đã chọn trước đó, khác ngôn ngữ trang và trang có bản ở ngôn ngữ đó, Then hiện một dải gợi ý nhỏ:
    - viết bằng ngôn ngữ đó, dẫn tới cùng trang;
    - đóng được;
    - không che nút "Đặt phòng", không làm xô lệch bố cục.
  - **Giữ lựa chọn:** khách đã chọn tay (bấm đổi ngôn ngữ, bấm gợi ý hoặc đóng gợi ý) thì giữ lựa chọn đó; trang không tự đổi.
  - **Nút đổi ngôn ngữ:** luôn thấy ở đầu trang trên điện thoại và máy tính.
- AC3: Given INV chọn ESC-020 L1-B, Then áp US-156 AC1 ngay ở v1; chọn L1-A thì v1 không hiện nút tiếng Nga.
- AC4: Given chữ EN dài hơn bản VI, Then bố cục không vỡ ở màn 360px (chừa thêm 40% – content-guide mục 6).

#### US-153 – Nhận diện, ảnh, tốc độ, truy cập – *Must, LP-v1*
- AC1: Given trang, Then dùng màu và chữ theo **Brand Guidelines v1.0** (bảng màu 80/15/5 Ivory/Cream/Stone Grey/Ink · Light Oak/Earth Brown · Sage; **không** terracotta; Lora + Be Vietnam Pro + JetBrains Mono tự host) qua token Design System (UXD cập nhật DS v0.4); mọi cặp chữ/nền đạt mức tương phản như design-system mục 2.2; UXD ký duyệt bản dựng.
- AC2: Given điện thoại tầm trung trên mạng 4G, Then phần nội dung lớn nhất của màn đầu hiện trong **≤ 2,5 giây** ở 75% lượt tải (ngưỡng "tốt" của LCP – https://web.dev/articles/lcp) `[GIẢ ĐỊNH – mục tiêu của PO, QA chọn công cụ đo]`; ảnh ngoài màn đầu chỉ tải khi gần tới vùng nhìn.
- AC3: Given ảnh gốc từ Drive (PNG 4–60 MB/ảnh), Then trang chỉ dùng bản đã tối ưu, nhiều cỡ theo màn hình; ảnh gốc không vào git (`00-brief/context/landing/README.md`).
- AC4: Given người dùng chỉ dùng bàn phím hoặc trình đọc màn hình, Then đi qua được mọi menu, nút, thư viện ảnh theo thứ tự hợp lý, có viền focus theo DS, ảnh có mô tả thay thế, không thông tin nào chỉ thể hiện bằng màu (PRD N9); kiểm tự động không còn lỗi mức nghiêm trọng.
- AC5: Given một khe ảnh thiếu hoặc tải lỗi, Then hiện khung giữ chỗ đúng tỉ lệ; bố cục không vỡ, không hiện biểu tượng ảnh hỏng.
- AC6: Given chiều rộng 360px, 768px và ≥ 1280px, Then trang hiển thị đúng, không cuộn ngang.
- AC7 *(SEC UXD-02)*: Given ảnh và e-brochure đưa lên trang, Then không có ảnh cận khóa cửa/bàn phím mã, không thấy số căn cùng cửa sổ nhìn ra phố, không thấy màn hình, giấy tờ, mật khẩu Wi-Fi; ảnh có người đã có đồng ý (ESC-020 L7); PDF đã xóa thông tin ẩn; mã QR Zalo và ảnh bản đồ tự lưu trên máy chủ OTTIMO, bản đồ có ghi công theo giấy phép.
- AC8 *(SEC C-1 – điều kiện cổng LP-v1)*: Given bản dựng production, When mở bất kỳ trang nào, Then **0** yêu cầu tới tên miền ngoài (font tự host, không bản đồ nhúng, không pixel, không widget chat); không có script/style nội tuyến (trừ JSON-LD); header bảo mật theo ADR-014 mục 1.4 qua kiểm tự động không lỗi; Zalo/WhatsApp/bản đồ chỉ là link khách bấm mới mở.

#### US-154 – Tìm kiếm và xem trước khi chia sẻ link – *Should, LP-v1*
- AC1: Given mỗi ngôn ngữ, Then có tiêu đề và mô tả trang riêng đã duyệt và ảnh chia sẻ (khe `og-share`); dán link vào Zalo/Facebook thì hiện đúng ảnh, tiêu đề, mô tả của ngôn ngữ đó (giao thức Open Graph – https://ogp.me).
- AC2: Given công cụ tìm kiếm, Then trang có sơ đồ trang, khai báo các bản ngôn ngữ và dữ liệu có cấu trúc kiểu cơ sở lưu trú (https://schema.org/LodgingBusiness: tên, địa chỉ, điện thoại, ảnh) khớp thông tin đang hiện; bản xem thử/staging gắn `noindex` (hosting-plan 5.1).
- AC3: Given OTTIMO có hồ sơ trên Google Maps, Then tên – địa chỉ – điện thoại trên trang trùng hồ sơ đó (tạo/sửa hồ sơ Google do INV làm).

#### US-155 – Hộp yêu cầu đặt phòng từ website (v2) – *Should, R3*
- AC1: Given khách điền form trên website (ngày đến/đi, nhóm căn, số người lớn/trẻ em, tên, cách liên hệ Zalo/SĐT/email, ngôn ngữ, ghi chú) sau khi đọc thông báo xử lý dữ liệu, Then yêu cầu vào hàng chờ "Yêu cầu từ website" trong Desk của `sales_staff` và FD+, có thông báo mới; khách thấy trang cảm ơn kèm thời gian phản hồi dự kiến (tham số).
- AC2: Given một yêu cầu, When sale bấm "Báo giá" hoặc "Giữ chỗ", Then mở US-080/US-084 điền sẵn dữ liệu; đơn tạo ra có kênh `direct`, nguồn `website` (BR-112); hồ sơ khách qua chống trùng BR-951.
- AC3: Given gửi tự động hoặc lặp nhiều lần, Then bị chặn theo quy định chống spam của SEC; yêu cầu không thành đơn tự xóa theo hạn SEC đặt.
- AC4: Given Desk chưa chạy production hoặc chưa qua ESC-001 và kiểm tra SEC cho dữ liệu khách thật (SEC-G1, SEC-G2), Then form không được bật trên trang công khai. Ngoài ra phải đạt SEC **C-2** (hạn xóa cho mọi trạng thái của yêu cầu, kể cả `new`/`in_progress`, và trần tuổi tuyệt đối) và **C-3** (thông báo xử lý dữ liệu có phiên bản đã đăng; ô đồng ý không tích sẵn, chỉ một mục đích "để OTTIMO liên hệ trả lời yêu cầu này"; bộ đếm giới hạn nằm trong DB).
- AC5 *(SEC ARC-02, ARC-04, ARC-08, DOM-05)*: Given đã chạm trần yêu cầu trong ngày, Then trang báo "đang bận – vui lòng nhắn Zalo hoặc gọi", **không** báo gửi thành công rồi bỏ yêu cầu; phản hồi không cho biết SĐT/email đã từng gửi hay đã có hồ sơ; lời nhắn có số giấy tờ/số thẻ bị từ chối kèm nhắc "không cần gửi giấy tờ ở bước này"; form **không** có ô nhận ưu đãi.

#### US-156 – Tiếng Nga (v2) – *Should, R3*
- AC1: Given khách chọn "Русский", Then mọi chữ là tiếng Nga đã được người bản ngữ duyệt; chuỗi pháp lý chưa có bản RU duyệt thì hiện bản EN đã duyệt kèm thông báo (content-guide mục 6); chữ Cyrillic hiện đúng font (design-system mục 3).

#### US-157 – Trang thuê tháng (v2) – *Could, R3*
- AC1: Given khách chọn nhóm căn, kỳ hạn (BR-201) và quốc tịch VN/NN, Then trang hiện ước tính tiền thuê/tháng (BR-203), phí dịch vụ (BR-204), ký quỹ (BR-206), điện nước ước tính (BR-205), ghi rõ "ước tính – báo giá chính thức do sale gửi"; kết quả khớp công cụ báo giá dài hạn US-081 với cùng đầu vào. Dữ liệu thử: căn 301, khách NN, 1 năm → khớp ví dụ BR-203.
- AC2: Given khách bấm "Gửi yêu cầu báo giá", Then yêu cầu vào hàng chờ US-155 kèm kỳ hạn đã chọn.

#### US-158 – Đo hiệu quả website (v2) – *Should, R3*
- AC1: Given khách bấm "Đặt phòng", Zalo, gọi hoặc email, Then hệ thống đếm lượt theo kênh và ngôn ngữ, **không** dùng cookie quảng cáo, không lưu dữ liệu cá nhân (SEC duyệt cách đo).
- AC2: Given báo cáo kênh (US-100), Then có số đơn trực tiếp nguồn `website` và doanh thu phòng của chúng theo tháng; DATA định nghĩa chỉ số trong `metrics-definitions.md`.

#### US-159 – Chủ đầu tư tự sửa nội dung – *Could, R4+*
- AC1: Given `owner` hoặc `manager` sửa giá "từ", ảnh, câu hỏi thường gặp hoặc thông báo ngắn trong Desk, Then trang công khai cập nhật sau khi bấm "Phát hành"; mọi lần sửa có nhật ký; phần thiếu bản EN thì không phát hành phần đó.

#### US-160 – Đánh giá khách và gợi ý Đà Lạt – *Could, R4+*
- AC1: Given đánh giá được `owner` chọn đăng (khách đồng ý, hoặc trích nguồn công khai có link), Then trang hiện kèm nguồn; không sửa nội dung đánh giá, không đăng đánh giá không có nguồn.
- AC2: Given nội dung tab Đà Lạt của app khách (US-117), Then landing dùng chung một nguồn nội dung.

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
| SM-01 mục 1.3 / BR-312 (xung đột OTA) | US-139 (mới; bước 4 nâng Must R2), US-018 AC5 |
| UC-08 (thu kỳ) | US-119 AC5 (R2), US-088 (R3) |
| UC-09 (gia hạn/chấm dứt HĐ) | US-093, US-091 |
| UC-20 (trả phòng dài hạn) | US-041 |
| UC-21 (công tơ) | US-064 |
| UC-22 (dọn phòng) | US-053 |
| UC-23 (kiểm phòng) | US-055 |
| UC-25 (bảo trì định kỳ) | US-063 |
| UC-26 (hoa hồng) | US-089 |
| UC-31 (đơn nhóm) | US-140 |
| UC-32 (đóng ca, đối soát chuyển khoản) | US-119 AC6 (R2), US-124 (R3) |
| UC-33 (mất mạng/mất điện) | US-145 |

### 5.3 Rà soát 4 story "Mới" (không có trong BL) với BR của DOM
| Story | Kết luận | Căn cứ |
|---|---|---|
| US-024 | Khớp BR-424 (đổi phòng), BR-906; **nâng Must R2** vì US-061 và BR-809 cần đổi phòng khi sự cố | SM-01 B7, B14; UC-16 |
| US-124 | Khớp BR-521 và rbac A44; **bước 4: DOM xác nhận nhưng yêu cầu nâng Must R3 và mở rộng thành đóng ca** – đã làm (FB-R1-DOM-PO-06) | BR-526, BR-527 |
| US-127 | Khớp rbac A106 (chỉ `owner`/`manager` sửa mẫu); không có BR mâu thuẫn; giữ Should R3 | – |
| US-132 | Không mâu thuẫn BR; phụ thuộc chính sách cọc/hủy (BR-305, BR-309 – ESC-006) và cổng thanh toán (ESC-010); giữ Could R4+ | ESC-012 phương án C |

### 5.4 Story chịu ảnh hưởng của từng ESC
Trạng thái 16/10/2026: **INV đã quyết cả 13 ESC** theo đề xuất của đội (`02-escalations/escalations-index.md`). Còn chờ INV gửi thông tin: ESC-004 (sức chứa từng căn), ESC-008 (loại hình kinh doanh), ESC-010 (tài khoản ngân hàng, tên miền), ESC-011 (thông tin khóa).

| ESC | Story |
|---|---|
| ESC-001 (luật sư) | US-022, US-042, US-044, US-049, US-071 (lưu ý sức khỏe), US-133, US-134 |
| ESC-002 (nơi đặt dữ liệu, hosting) | Không đổi AC; ảnh hưởng môi trường chạy thử R2 |
| ESC-004 (giá ngắn ngày) | US-004, US-017, US-022, US-028, US-080, US-097 (ở tối thiểu – BR-113) |
| ESC-005 (dài hạn, hoa hồng) | US-081, US-086, US-089 |
| ESC-006 (hủy, hoàn, giữ chỗ) | US-021, US-041, US-085, US-093, US-123, US-136, US-137, US-140 |
| ESC-007 (phụ thu, FOC) | US-007 (AC6 tự áp), US-026, US-027, US-029, US-036 |
| ESC-008 (điện nước, VAT) | US-032, US-039, US-064, US-065, US-122 (INV quyết 16/10 phương án A; loại hình kinh doanh – doanh nghiệp hay hộ kinh doanh `[GIẢ ĐỊNH – chờ INV xác nhận]` – INV gửi, ảnh hưởng loại hóa đơn ở US-039/US-122) |
| ESC-009 (channel manager) | US-094–US-099, US-139 |
| ESC-010 (tài khoản) | US-042 (ca tối), US-120, US-121, US-122, US-126, US-141 (kênh gửi mã), US-142 (thiết bị ca tối) – **phần Zalo mở lại ở ESC-021** |
| ESC-011 (khóa cửa) | US-128, US-130 |
| ESC-012 (phạm vi, mục tiêu) | Toàn bộ ranh giới Round; US-131, US-132; câu phụ phạm vi R2 – **INV chọn R-C**: dời US-081, 111, 125, 128, 141; một phần US-012, 086, 108, 119; thêm US-017 AC5a |
| ESC-013 (môi trường chạy thử) | Không đổi AC; ảnh hưởng CI/khung R2 |
| ESC-020 (landing page – câu phụ L1–L6, chờ INV) | EP19: L1 → US-152, US-156; L2 → US-151, US-155; L3 → US-147 AC3; L4 → mọi story v1 (ngày lên mạng); L5 → US-146 AC4, US-147, US-148, US-149, US-150; L6 (ảnh) → US-147 AC5, US-153 AC3/AC7. Màu/chữ: INV quyết bằng Brand Guidelines 17/10 → US-153 AC1. Gián tiếp: US-131, US-132 (đích nút "Đặt phòng" ở v2) |
| ESC-021 (Zalo OA chăm sóc khách – chờ INV) | A/B/C → US-126 (thời điểm nối thật), US-163; mọi phương án → US-161, US-162 (gửi tay khi chưa có Zalo); K1 → US-116 phần (b), US-040; gián tiếp US-034, US-138, US-151 (nút Zalo OA trên landing) |

## 6. Ghi chú cho các vai
- **DOM:** AC không còn chép con số quy tắc; "khớp ví dụ BR-xxx" phụ thuộc cột ví dụ của BR – nếu DOM sửa ví dụ, báo PO/QA. PO đồng ý đề xuất rbac ghi chú 34 (CTV không thấy "OTTIMO còn lại").
- **BA:** AC đã dùng mã chuyển của `state-machines.md` và hành động A-xx của `rbac-matrix.md`. US-045/US-107 đã sửa theo quyết định "đồng ý lưu ảnh không là điều kiện khai báo".
- **QA:** mỗi AC ở mục 4 là ít nhất một ca kiểm thử; các mốc giờ kiểm bằng đồng hồ giả lập ngay trước/sau mốc; ca phân quyền kiểm cả giao diện lẫn API.
- **ARC:** story có yêu cầu thời gian/đồng thời: US-018, US-023, US-031, US-042, US-085, US-136 (job theo lịch, giờ VN); US-135 là mẫu giao diện chung (UXD).
- **UXD:** US-135 (hộp xác nhận), US-044 (3 trạng thái kiểm tra), US-112 AC3 (chuỗi pháp lý dịch người). Bước 4: làn "Chưa gán căn" (US-139), màn xác minh khách (US-141), từ chối trên thiết bị chưa cấp (US-142), form OOO hiện 2 ngày (US-061 AC1).
- **Bước 4 – báo các vai:** ARC chỉnh OpenAPI theo US-018 AC5/US-139 (không tự đổi căn im lặng; 409 kèm gợi ý; `RESERVATION_UNASSIGNED`), US-119 AC5 (gắn giao dịch vào kỳ thu), `post_checkout_charge_hours` (BR-427) (US-106 AC2); BA sửa rbac mục 1 (màn mặc định FD = "Hôm nay"), rbac 8.6, đặc tả trường SĐT/MST; DOM đã thêm (business-rules v0.2): BR-010 ngày nghiệp vụ, BR-315 khôi phục no-show, BR-316/317 xung đột OTA, BR-321…326 đơn nhóm, BR-417 nhận trước 06:00, BR-436 tự miễn FOC, BR-526/527 đóng ca – chờ đối soát, BR-613 giấy tờ NN không đạt, BR-961…964 dự phòng; QA chuyển TC-NT-023 sang US-074, thêm ca 01:30 (US-011 AC3, US-025 AC6).

## 7. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 (đợt 1) | Bản đầu: 19 epic, 132 story, AC cho 71 story Must R2 | PO |
| 15/10/2026 | 1 (đợt 3) | AC tham chiếu mã BR (bỏ con số quy tắc), dùng tên trạng thái SM-xx và mã vai RBAC; sửa US-045, US-107 theo quyết định SEC/BA; thêm US-133–US-139 (UC-30, HR-06, no-show, trả sớm, trả phòng nhanh, xung đột OTA); US-024 nâng Must R2; tổng 139 story, 74 Must R2; truy vết HR, UC, ESC | PO |
| 15/10/2026 | 1 (bước 4) | Sửa theo 28 thẻ BA/DOM + 11 lỗi tự nhận (T1–T11): ngày nghiệp vụ 06:00 vào quy ước AC; US-001 màn mặc định "Hôm nay" + AC4 tài khoản R2; US-007 xác thực lại bằng mật khẩu ở R2, AC6 lễ tân tự áp FOC minibar; US-018 AC5 + US-139 nâng Must R2 (đơn OTA trùng); US-023 AC2 đổi (gộp → US-074); US-026 AC3 nhận trước 06:00 = thêm đêm; US-017/022/080 phụ thu người; US-017 AC3 OTA chỉ cảnh báo sàn–trần, AC8 danh sách kênh; US-024 AC4 tách B7/B14; US-061 AC1 khối OOO nửa mở; US-087 AC2 thu hẹp; US-106 AC2 ân hạn link; US-119 AC5 ghi thu kỳ HĐ ở R2; US-012 AC7; bỏ con số không phải quy tắc khỏi AC; thêm US-140 (đơn nhóm, Must R3), US-141 (xác minh khách, Must R2), US-142 (thiết bị được cấp, Must R2), US-143 (2FA, Must R3), US-144 (chốt tháng, Could R3), US-145 (vận hành dự phòng, Should R3); US-124 nâng Must R3 (đóng ca), US-119 AC6 cờ chờ đối soát (R2); US-136 theo BR-315; đối chiếu mã BR với business-rules v0.2; gắn 13 BR chưa có story; bổ sung UC vào cột Nguồn. Tổng **145 story, 77 Must R2**, 19 Must R3 | PO |
| 16/10/2026 | 2 (tuần 1 – W12) | INV quyết 13 ESC: áp **R-C** – US-081, 111, 125, 128, 141 Round → R3, trạng thái Dời; US-012 (AC2 + J12), US-086 (AC3), US-108 (phần mã cửa AC2), US-119 (AC5) làm một phần, phần dời gắn **[Dời R3 – R-C]**; thêm US-017 AC5a tạm (đơn dài hạn nhập tay, P-R2-3); bảng epic còn **72 Must R2**; "chờ ESC-xxx" → "INV quyết ESC-xxx 16/10", giữ nhãn giả định cho sức chứa (ESC-004), tài khoản ngân hàng (ESC-010), thông tin khóa (ESC-011). QA sinh lại traceability | PO |
| 16/10/2026 | 2 (Sprint 2 – Phản hồi & sửa) | US-056 → R3 (Dời; EP07 Must R2 6→5, tổng **71 Must R2**); US-008 Should → **Must R3** + AC1–AC3 (R2 ẩn nút "Thêm người dùng"); US-012 AC3 sửa theo SR-RET-06 (mã đơn + căn), thêm AC8 (BR-435 cho OWN, tính khi đọc); US-017 AC9 (người chốt bắt buộc kênh CTV / nguồn `sales_staff`); US-025 AC7 (ô "Đã giao mã cửa/thẻ" không bắt buộc). QA sinh lại traceability | PO |
| 16/10/2026 | 2 (Sprint 3 – khởi động) | Nghiệm thu PO Sprint 1 + 2 trên stack tạm (ĐK-S2-5, `outputs/PO/acceptance.md`): thêm trạng thái "Đang nghiệm thu", "Đạt (stack tạm)"; cột Trạng thái 30 story (10 Đạt stack tạm, 19 Đang nghiệm thu, US-022 Dời Sprint 3); dòng "> Nghiệm thu" ghi phần dời (US-019, 020, 022, 024, 085, 136 + 002–007, 016, 018, 021, 083, 086, 135, 139, 142) – mọi phần dời trong R2; áp ESC-015 A (ghi chú US-005), ESC-016 A (US-109 AC1), ESC-017 A (US-084 AC1, US-086 AC5, US-119 AC6). Must R2 vẫn 71 | PO |
| 17/10/2026 | 2 (Sprint 3) | BUG-R2-034: nguồn "Cần chú ý" cho khai báo/thị thực (US-025 AC4, US-044 AC4, US-050 AC2, US-012 AC1/AC3) làm ở Sprint 3; khung hiển thị Tổng quan ở Sprint 4 – ghi chú dưới 4 story | PO |
| 17/10/2026 | 2 (Sprint 3) | BUG-R2-033 (b): làm rõ US-043 AC3 (hồ sơ người đi cùng tạo từ giấy tờ, không cần SĐT/email, không tiếp thị; cảnh báo khi vượt số khách) và US-071 AC1 (phạm vi quy tắc liên hệ) – chờ SEC ký phần dữ liệu cá nhân | PO |
| 17/10/2026 | 2 (Sprint 3) | INV trả lời câu phụ ESC-016: US-056 thêm AC3 (tùy chọn lịch dọn cố định khi lập/sửa HĐ) + AC4 (đơn nhập tay AC5a có tùy chọn qua bước chuyển sang HĐ ở R3, không làm riêng); INV quyết ESC-018: US-046 AC2 ghi định dạng ngày dd/mm/yyyy + quốc tịch ISO alpha-3 | PO |
| 17/10/2026 | 2 (sau Sprint 3) | FB-INV-001 + INV quyết làm landing page 17/10: thêm **EP19** (US-146…US-160, 15 story: v1 – 7 Must + 2 Should, round "R2 – LP-v1" đề xuất song song Sprint 4; v2 – US-155…158 R3, US-159/160 R4+) kèm AC; nối US-131/US-132 (EP18) làm đích nút "Đặt phòng" ở v2; mở **ESC-020** (câu phụ L1–L5); bảng epic: tổng 160 story, sửa ô Must R2 72 → **71** (khớp các dòng epic). Không đổi story Must R2 nào | PO |
| 17/10/2026 | 2 (sau Sprint 3 – gộp landing + Zalo OA) | Tin nhắn INV 17/10 + ESC-021 (INT) + review SEC `landing-zalo-SEC.md` + hành trình DOM: thêm **US-161** (lịch nhắn tin + "Tin cần gửi hôm nay", Must R3 Sprint 1), **US-162** (mời/nhắc check-in online + nhắc trước ngày đến kèm vị trí, Must R3), **US-163** (hộp thư Zalo trong Desk, Could R4+); US-126 giữ Should R3 + AC1–AC5 (SEC C-4…C-9); ghi chú lịch US-034, US-116 (tách cảm ơn/đánh giá và mã giảm), US-040, US-138; EP19: US-147 AC1 (tên nhóm công khai), US-149 AC5 (trang quyền riêng tư), US-150 AC3 (chống giả danh), US-151 AC1/AC2 (WhatsApp, Zalo số cơ sở) + AC6 (không ô nhận ưu đãi), US-153 AC7 (lọc ảnh) + AC8 (SEC C-1), US-155 AC4 (C-2, C-3) + AC5; US-147 AC1 theo 4 hạng phòng của e-brochure và tên phòng của Brand Guidelines v1.0; bảng ESC thêm ESC-021, ESC-020 L6 (ảnh). Tổng **163 story**, Must R2 **71**, Must R3 **28** | PO |
