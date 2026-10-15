# Nhật ký quyết định

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 0 | Đội 16 vai, tối thiểu 3 round, có QA + QC; INV chỉ nhận các việc báo lên | INV | Thống nhất khi trao đổi ý tưởng |
| 2026-10-15 | 0 | Prototype OTTIMO Desk (vibe code) được coi là Round 0; Round 1 chuẩn hóa từ baseline | INV | Đã làm trước 1 round |
| 2026-10-15 | 0 | Khóa cửa là khóa thông minh có app (mật mã / vân tay / thẻ từ, đặt mã cửa [đã ẩn – INV 19/10: đổi sang mã ngẫu nhiên 8 số]); INT tìm hãng và khả năng API ở Round 1 | INV | Trả lời /start |
| 2026-10-15 | 0 | Hóa đơn điện tử dùng MISA meInvoice | INV | Trả lời /start |
| 2026-10-15 | 0 | Cần kết nối toàn bộ OTA qua channel manager; ARC + INT so sánh Beds24 / ezCloud / phương án khác và đề xuất bằng ESC cuối Round 1 | INV | Trả lời /start |
| 2026-10-15 | 0 | Người dùng thử: chủ đầu tư, lễ tân, buồng phòng/bảo trì, CTV/sale → cần phân quyền cho cả 4 vai | INV | Trả lời /start |
| 2026-10-15 | 0 | [GIẢ ĐỊNH] Ngân sách hạ tầng ≤ 1 triệu đ/tháng, không ép thời hạn | ORC | INV chưa rõ, chọn dùng giả định |
| 2026-10-15 | 0 | [GIẢ ĐỊNH] Cổng thanh toán: VietQR chuyển khoản + VNPay/MoMo | ORC | Giữ giả định trong brief, chờ INV xác nhận |
| 2026-10-15 | 0 | [GIẢ ĐỊNH] Thiết kế sẵn đa cơ sở, MVP 1 cơ sở; chưa dùng POS | ORC | Giữ giả định trong brief, chờ INV xác nhận |
| 2026-10-15 | 0 | [GIẢ ĐỊNH] Mô hình tài chính lấy theo số liệu tháng 9/2026 trong prototype cho đến khi INV bổ sung `00-brief/context/` | ORC | Không chặn Round 1 |
| 2026-10-15 | 1 | DATA tham gia nhẹ ở Round 1 (chỉ `metrics-definitions.md`); tracking + dashboard để Round 3 | PO | Công thức chỉ số ảnh hưởng ERD (lỗi baseline 8.2 #8, #11, #22, #28, #29) |
| 2026-10-15 | 1 | MOB, FE, BE không sản xuất ở Round 1, chỉ review | PO | Round 1 là round tài liệu/thiết kế |
| 2026-10-15 | 1 | PO đề xuất ranh giới MVP trong PRD, trình ESC để INV xác nhận phạm vi | PO | Câu hỏi mở baseline mục 9 #21 |
| 2026-10-15 | 1 | Ngôn ngữ: VI + EN bắt buộc; RU là ngôn ngữ thứ 3 (thay KR/CN của prototype) | PO | Brief mục 5: khách Nga nhiều, cần tin nhắn tiếng Nga |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Mọi con số quy tắc ở baseline mục 5 là giá trị mặc định cấu hình được | PO | Sẽ xác nhận qua ESC cuối Round 1 |
| 2026-10-15 | 1 | Bộ 7 persona mô phỏng (P1–P7) và 4 hành trình (J1–J4) là cơ sở nghiên cứu Round 1; mọi kết luận ghi "Mô phỏng – cần INV kiểm chứng" cho tới khi có kiểm chứng người thật | UXR | Thuộc quyền UXR (kết luận nghiên cứu); đội AI không phỏng vấn được người thật |
| 2026-10-15 | 1 | Mức nghiêm trọng heuristic prototype R0: Blocker = HR-01 (app khách chỉ tiếng Việt), HR-04 (phụ thu nhận sớm tính sẵn), HR-06 (hủy giữ chỗ không xác nhận), HR-07 (kiểm hạn hộ chiếu giả "Khớp"); chuẩn a11y mục tiêu WCAG 2.2 AA | UXR | Thuộc quyền UXR (mức nghiêm trọng vấn đề khả dụng); chi tiết `product/docs/research/heuristic-review-r0.md` |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Nhân viên buồng phòng/bảo trì dùng điện thoại Android tầm trung, cần giao diện mobile riêng (nút ≥ 48px, chữ ≥ 16px, thao tác được khi mất mạng); lễ tân dùng laptop tại quầy; chủ đầu tư và CTV dùng điện thoại là chính | UXR | Persona P1–P4, giả thuyết H-01, H-02, H-05, H-07 |
| 2026-10-15 | 1 | Danh mục quy tắc kinh doanh BR-xxx trong `product/docs/business-rules.md` là nguồn sự thật duy nhất cho con số nghiệp vụ; tài liệu khác chỉ tham chiếu mã BR | DOM | Tiêu chí QC B3 |
| 2026-10-15 | 1 | Trạng thái đơn chuẩn: hold, confirmed, in_house, checked_out, cancelled, no_show; OOO là khối chặn tồn phòng, không phải đơn khách | DOM | BL 8.2 #5, #8 (BR-301, 804) |
| 2026-10-15 | 1 | Giữ chỗ không tính đêm bán; đêm khả dụng trừ đêm OOO (DATA chốt công thức) | DOM | Chuẩn ngành; BL 8.2 #8, #29 (BR-904) |
| 2026-10-15 | 1 | Hai loại giá đêm: niêm yết (bán ngắn ngày) và quy đổi dài hạn = thuê tháng ÷ 30 (ngày lẻ, phụ thu, hoàn trả) | DOM | BL 8.2 #1, #13 (BR-102) |
| 2026-10-15 | 1 | Phụ thu nhận sớm/trả muộn không tự áp theo giờ hiện tại; form mặc định giờ chuẩn | DOM | BL 8.2 #2 (BR-414) |
| 2026-10-15 | 1 | Đơn/báo giá/HĐ lưu snapshot giá và tham số; mã chứng từ do server cấp, liên tục | DOM | BL 8.2 #10, #18 (BR-006, 007) |
| 2026-10-15 | 1 | FOC phải do tài khoản người duyệt xác nhận, không tự duyệt (hạn mức chờ INV) | DOM | BL 8.2 #24 (BR-432) |
| 2026-10-15 | 1 | Ngày kết thúc HĐ dài hạn theo tháng lịch (thay × 30,4 ngày) | DOM | Chuẩn ngành (BR-209) |
| 2026-10-15 | 1 | Giá vốn kho bình quân gia quyền | DOM | Chuẩn kế toán kho (BR-705) |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Hạn khai báo tạm trú người nước ngoài: áp hạn sớm hơn giữa "giờ đến + 12 giờ" và "23:00 ngày đến" cho đến khi luật sư xác nhận | DOM | An toàn pháp lý (BR-603) |
| 2026-10-15 | 1 | Lịch dọn dài hạn ngày cố định, khung 9:00–11:00 (khách đổi qua app) | DOM | BL 9 #12 – plan R1 mục 8 giao DOM tự chốt |
| 2026-10-15 | 1 | Thang phân loại dữ liệu C0–C3 (data-risk-assessment mục 3) là chuẩn chung cho RBAC, ERD, log | SEC | Một ngôn ngữ chung cho BA, ARC, QA |
| 2026-10-15 | 1 | OTTIMO không lưu/nhận/truyền dữ liệu thẻ; chỉ dùng trang thanh toán của cổng; không kéo thẻ ảo (VCC) từ channel manager | SEC | Giữ phạm vi PCI DSS tối thiểu |
| 2026-10-15 | 1 | Dữ liệu C3 lưu tách, mã hóa mức trường/tệp, ghi nhật ký mỗi lần xem; ảnh giấy tờ xóa bằng hủy khóa riêng | SEC | BL 5.13 + yêu cầu tối thiểu |
| 2026-10-15 | 1 | Đồng ý lưu ảnh giấy tờ không là điều kiện để khai báo lưu trú | SEC | Tách nghĩa vụ luật với việc cần đồng ý (F02) |
| 2026-10-15 | 1 | Không đăng ký vân tay khách; mẫu vân tay nhân viên không rời thiết bị khóa | SEC | Dữ liệu sinh trắc (F06) |
| 2026-10-15 | 1 | Link app khách gắn với đơn, hết hạn khi trả phòng | SEC | Chống lộ dữ liệu khách trước (F09) |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV/luật sư xác nhận] Thời hạn lưu/xóa dữ liệu (data-risk-assessment mục 7) là giá trị mặc định cấu hình được | SEC | Chờ ESC-001 |
| 2026-10-15 | 1 | Mọi tích hợp đặt sau adapter có bản Mock; chuyển mock/sandbox/production bằng biến môi trường; outbox/inbox chống xử lý trùng | INT | Quyền kỹ thuật INT |
| 2026-10-15 | 1 | Chỉ ghi nhận tiền từ IPN/webhook đã xác thực chữ ký và khớp số tiền; không dùng iCal; không scraping cổng Bộ Công an; VietQR tự sinh chuỗi trong app | INT | Quyền kỹ thuật INT |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Thẻ quốc tế đi qua VNPay (INTCARD), MVP không cần Stripe/OnePay | INT | Chờ ESC tài khoản thanh toán |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Mã cửa mặc định ngẫu nhiên 6 số; mã theo ngày sinh = ddmm + 2 số ngẫu nhiên, chỉ khi khách đồng ý; gửi mã vào ngày đến, xóa khi trả phòng | INT | Mã sinh nhật dễ đoán (SEC F05, DOM Q-D4); chờ ESC khóa cửa |
| 2026-10-15 | 1 | Ranh giới MVP theo PRD mục 5.2–5.3; ca/chấm công và ký số hợp đồng ngoài MVP; cảnh báo lệch mục tiêu là Could R4+ | PO | BL 9 #13, #17, #25 – quyền phạm vi của PO, ranh giới MVP vẫn trình ESC xác nhận |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Đích kênh trực tiếp ≥ 35% doanh thu phòng, GOP ≥ 60%; các chỉ số thành công S1–S12 do đội đề xuất | PO | PRD |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Không có vai F&B/kế toán riêng; quản lý thuộc nhóm chủ đầu tư; lễ tân trưởng = lễ tân có quyền duyệt FOC trong hạn mức | PO | PRD |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Booking engine công khai là Should R3; khóa cửa MVP nhập mã tay, tích hợp API R4+ | PO | PRD |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] R2 chỉ ghi nhận thanh toán + VietQR; VNPay/MoMo, MISA, Zalo ZNS, channel manager thật ở R3; app khách VI/EN ở R2, tiếng Nga ở R3 (mẫu tin nhắn có tiếng Nga từ R2) | PO | PRD |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] P&L R3 nhập chi phí trong app, chưa tính thuê nhà/khấu hao | PO | BL 9 #26 |
| 2026-10-15 | 1 | Kiến trúc modular monolith (api + worker), contract-first OpenAPI; server là nguồn sự thật cho mọi tính toán tiền và tồn phòng | ARC | ADR-001 |
| 2026-10-15 | 1 | Stack: Node 22 + TypeScript + NestJS + Drizzle + PostgreSQL 17 + pg-boss; chưa dùng Redis; real-time SSE | ARC | ADR-002, 003 – quy mô 10 căn, ngân sách |
| 2026-10-15 | 1 | Web quản trị và web khách: React + Vite SPA build tĩnh; booking-web chọn công nghệ ở R3 | ARC | ADR-004 |
| 2026-10-15 | 1 | App nhân viên là PWA, không native ở MVP; offline: đọc + hàng đợi thao tác buồng phòng, thao tác tiền/tồn bắt buộc có mạng (chốt BL 9 #22) | ARC (+UXD) | ADR-005 |
| 2026-10-15 | 1 | App khách: link/QR theo đơn, token băm, hết hạn sau trả phòng, 2 mức xác minh | ARC | ADR-006, SEC F09 |
| 2026-10-15 | 1 | Đa cơ sở: organization/property, `property_id` mọi bảng + Row Level Security | ARC | ADR-007 |
| 2026-10-15 | 1 | Thời gian: UTC cho thời điểm, `date` theo múi giờ cơ sở, `Clock` duy nhất (giờ giả cho dev/staging) | ARC | ADR-008, BR-001 |
| 2026-10-15 | 1 | Chống đặt trùng bằng exclusion constraint PostgreSQL trên (căn, khoảng ngày) + Idempotency-Key + khóa lạc quan | ARC | ADR-009, BL 8.2 #30, BR-906 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận qua ESC-002] Hosting 1 VPS tại Việt Nam + Docker Compose, ước 0,45–0,9 tr/tháng | ARC | ADR-010 |
| 2026-10-15 | 1 | Monorepo pnpm + Turborepo; ESLint, Prettier, Vitest, Playwright, k6, gitleaks | ARC | ADR-012 |
| 2026-10-15 | 1 | Ảnh giấy tờ: mã hóa phong bì, xóa bằng hủy khóa, log mỗi lần xem | ARC + SEC | ADR-013 |
| 2026-10-15 | 1 | Chỉ số đêm và doanh thu phòng tính trên bảng đêm-phòng (StayNight); kỳ báo cáo lọc theo ngày lưu trú, giờ Asia/Ho_Chi_Minh | DATA | Một nguồn đếm đêm, tránh lặp lỗi BL 8.2 #8, #22 |
| 2026-10-15 | 1 | Đêm khả dụng thuần = số căn kinh doanh × ngày − đêm OOO; Occupancy/RevPAR/GOPPAR dùng mẫu số thuần, báo kèm số gộp | DATA | BL 8.2 #29, BR-804, BR-904 |
| 2026-10-15 | 1 | Occupancy dùng đêm có khách (gồm đêm miễn phí); ADR dùng đêm bán có thu tiền | DATA | Không để đêm 0 đồng kéo ADR |
| 2026-10-15 | 1 | Doanh thu dài hạn phân bổ theo đêm, chia theo tháng hợp đồng (tổng HĐ = Σ đêm); tiền thu theo kỳ là dòng tiền riêng | DATA | BR-215, BL 8.2 #22 – chi tiết lý do ở metrics-definitions Q-10 |
| 2026-10-15 | 1 | Kênh và loại lưu trú là 2 chiều tách biệt; "HĐ dài hạn" không còn là kênh | DATA | Báo cáo kênh T9 của INV đã ghi dài hạn theo kênh nguồn |
| 2026-10-15 | 1 | Chi phí kênh = phí OTA + hoa hồng CTV; hoa hồng nhân viên sale ở dòng riêng của P&L; phí kênh/hoa hồng ghi nhận theo đêm cùng kỳ doanh thu | DATA | BL 5.11, BR-901–903 |
| 2026-10-15 | 1 | Nhận phòng trước 06:00 và trả sau 18:00 sinh đêm bán (doanh thu phòng); phụ thu 30%/50% và phụ thu người thêm là doanh thu khác | DATA | BR-003, 411, 416, 904 – chờ DOM xác nhận ở review |
| 2026-10-15 | 1 | ALOS đếm theo lượt lưu trú (gộp đơn con gia hạn), tách ngắn ngày và dài hạn | DATA | Tránh HĐ 1 năm làm ALOS vô nghĩa |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Báo cáo dùng doanh thu gồm VAT cho đến khi kế toán chốt thuế suất; CTV/môi giới không tính là kênh trực tiếp trong mục tiêu G3; chốt số liệu tháng vào ngày 5 tháng sau | DATA | metrics-definitions O-1, O-2, O-3 |
| 2026-10-15 | 1 | Bộ mã vai: owner, manager, front_desk_lead (kế thừa front_desk), front_desk, housekeeping, maintenance, sales_staff, collaborator, guest (link), system; một tài khoản nhiều vai = hợp quyền | BA | Quyền BA (cách đặc tả); PRD U1–U5 |
| 2026-10-15 | 1 | Quyền kiểm ở server theo 3 lớp: màn hình, hành động, trường; trường không được phép không trả về từ API | BA | BL 8.2 #27, US-002 AC2 |
| 2026-10-15 | 1 | Khai báo lưu trú: đồng ý lưu ảnh không còn là điều kiện sang `scanned` (sửa trình tự BL 5.12); thêm trạng thái `void` cho đơn hủy/no-show | BA | SEC R-REG-05, decision-log SEC |
| 2026-10-15 | 1 | Người trong đơn có 2 thuộc tính độc lập: `is_minor_data` theo ngưỡng bảo vệ dữ liệu của SEC (thay ngưỡng BL 3.17) và bậc tuổi phụ thu theo BR-110 | BA | SEC R-CON-05; ngưỡng cuối do luật sư (ESC-001) |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] CTV không được xác nhận cọc (chỉ báo đã chuyển kèm biên nhận); lễ tân/sale nội bộ xác nhận | BA | Kiểm soát tiền; CTV ngoài biên chế |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Chỉ chủ đầu tư được gán vai, đặt hạn mức FOC, tỷ lệ hoa hồng, phí kênh; quản lý sửa tham số vận hành | BA | Tách người đặt hạn mức với người duyệt |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] SAL/CTV không thấy bất kỳ trường giấy tờ nào (kể cả dạng che); chỉ thấy khách/lead của mình; CTV không thấy "OTTIMO còn lại" | BA | BR-610, SEC D01–D04 |
| 2026-10-15 | 1 | Thêm các chuyển ngoại lệ có duyệt MGR+: khôi phục no-show, hoàn tác nhận phòng nhầm (chờ DOM xác nhận) | BA | Tình huống thực tế khách đến khuya |
| 2026-10-15 | 1 | Design System OTTIMO v0.1: giữ màu nền/thương hiệu R0; sửa `--muted`, `--faint`, `--oak-ink`, `--ok`, `--warn`, focus; `--faint` cũ thành `--deco` (cấm dùng cho chữ); thêm `--line-strong`, `--ink-inverse`. Mọi cặp chữ ≥ 4,5:1, UI ≥ 3:1 cả sáng và tối | UXD | HR-10, BL 8.3, WCAG 2.2 AA |
| 2026-10-15 | 1 | Ba mật độ giao diện: Desk (máy tính, chữ 14, chạm 32), Touch (điện thoại, chữ 16, chạm 44), HK (buồng phòng, chữ 16–17, chạm 48/56) | UXD | Persona P2, P3 |
| 2026-10-15 | 1 | Giao diện buồng phòng dùng câu thường thay mã VC/VI/VD…; mức độ phiếu sửa "Gấp / Trong ngày / Không gấp" | UXD | HR-13 |
| 2026-10-15 | 1 | Mẫu bắt buộc: xác nhận phá hủy, phụ thu chủ động, kiểm tra 3 trạng thái, nhắc việc bền vững thay toast, hoàn tác 10 giây | UXD | HR-04, 06, 07, 09, 17 |
| 2026-10-15 | 1 | Chính tả kiểu mới (hủy, khóa, hóa đơn); "Phiếu thanh toán" cho bill khách, "Hóa đơn" chỉ cho hóa đơn GTGT/điện tử; không in "FOC" trên giấy tờ khách | UXD | HR-19, HR-13 |
| 2026-10-15 | 1 | Font tự host Lora + Be Vietnam Pro (SIL OFL, miễn phí); chữ Nga dùng font hệ thống | UXD | Be Vietnam Pro không có Cyrillic |
| 2026-10-15 | 1 | App khách xưng "bạn" (VI), "Вы" (RU) | UXD | Giọng boutique, khách trẻ/quốc tế |
| 2026-10-15 | 1 | Dependabot cho cập nhật phụ thuộc (npm, GitHub Actions, Docker); gitleaks chạy bằng image CLI chính thức trong CI | OPS | ADR-012 |
| 2026-10-15 | 1 | Vòng xoay backup 7 ngày + 4 tuần (≤ 35 ngày) theo SEC T18 (ARC cần sửa ADR-010 – thẻ review) | OPS | SEC T18 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] RPO ≤ 15 phút, RTO ≤ 4 giờ | OPS | architecture/ADR-010 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Tiền tệ: thu và lưu VND số nguyên; USD chỉ hiển thị tham khảo theo tỷ giá nhập tay có ngày cập nhật (BR-004); không đa tiền tệ thanh toán trong MVP | PO | BL 9 #24; PRD X9 |
| 2026-10-15 | 1 | 26 câu hỏi BL mục 9 + câu mới xử lý theo `product/docs/open-questions-resolution.md`; tạo ESC-004…ESC-012, gộp câu luật sư vào ESC-001, câu hosting (OPS) vào ESC-002, câu logo (UXD) vào ESC-012; tổng 12 ESC, đều Bình thường | PO | Plan R1 mục 8; QC A6 |
| 2026-10-15 | 1 | WhatsApp/KakaoTalk/Telegram tự động để sau MVP; MVP dùng email + mẫu tin sao chép VI/EN/RU | PO | BL 9 #19; ít tích hợp cho 10 căn |
| 2026-10-15 | 1 | CTV (`collaborator`) không thấy "OTTIMO còn lại" trên báo giá, chỉ thấy hoa hồng của mình | PO | rbac ghi chú 34; bảo mật biên lợi nhuận |
| 2026-10-15 | 1 | US-024 (đổi căn/đổi ngày/đổi phòng) nâng từ Should lên Must R2; thêm US-133…US-139 (yêu cầu chủ thể dữ liệu, xác nhận hành động không đảo ngược, no-show, trả sớm, trả phòng nhanh, xung đột OTA); backlog 139 story, 74 Must R2 | PO | UC-05, UC-16, UC-19, UC-30; HR-06; BR-311, BR-312, BR-428 |
| 2026-10-15 | 1 | Tiêu chí nghiệm thu chỉ tham chiếu mã BR ("khớp ví dụ BR-xxx"), không chép con số quy tắc; dùng tên trạng thái `state-machines.md` và mã vai `rbac-matrix.md` | PO | QC B1, B3 |
| 2026-10-15 | 1 | Mọi hành động không đảo ngược có hộp xác nhận nêu hậu quả (US-135) | PO | HR-06 (Blocker UXR) |
| 2026-10-15 | 1 | Chấp nhận ESC-002 và ESC-012 có "câu phụ" (hosting + tên miền; logo) để giữ tổng ESC ≤ 12 – mỗi câu phụ có phương án và đề xuất riêng | ORC | Bảo vệ thời gian INV; cùng chủ đề |
| 2026-10-15 | 1 | ERD: bảng số ít snake_case, tiền `bigint` VND, enum `text + CHECK` đúng tên trạng thái BA, UUIDv7, không xóa cứng dữ liệu nghiệp vụ, RLS theo `property_id`/`organization_id` cho mọi bảng | ARC | `erd.md` mục 1–2 |
| 2026-10-15 | 1 | Đơn OTA xung đột: giữ `confirmed` + `conflict_state`, segment chưa gán căn, không chèn `room_occupancy`; xử lý bằng đổi căn/đổi phòng; không nhận phòng khi chưa gán | ARC (khớp BA) | BR-312, ADR-009, `erd.md` mục 7 |
| 2026-10-15 | 1 | Mã chứng từ cấp bằng bảng `doc_sequence` khóa hàng trong cùng giao dịch; số bill cấp khi folio `settled` | ARC | BR-007, BL 8.2 #18 |
| 2026-10-15 | 1 | Job theo lịch: đúng một lần qua `job_run`, chạy bù có giới hạn, đọc tham số khi chạy, không tự đánh dấu no-show | ARC | architecture 9.1 |
| 2026-10-15 | 1 | Chuẩn API: RFC 9457 + `code`, phân trang con trỏ, `Idempotency-Key` bắt buộc cho POST ghi, `If-Match` cho sửa/chuyển trạng thái, phân quyền khai báo bằng `x-roles`/`x-scope`/`x-visible-to` | ARC | `openapi.yaml` info |
| 2026-10-15 | 1 | Áp dụng `coding-standards.md` cho mọi mã từ R2 | ARC | Skill ARC, QC R1 |
| 2026-10-15 | 1 | App khách mức 2 = OTP email của đơn hoặc mã xác minh lễ tân cấp; 4 số cuối SĐT và mã đặt phòng không dùng làm yếu tố xác minh; đếm sai theo token | SEC | TM-21 (mã đơn tăng dần, nằm trong tin chứa link) |
| 2026-10-15 | 1 | C3 chỉ đọc/ghi trên thiết bị được OWN cấp (bảng `trusted_device`, cookie thiết bị); PWA không bao giờ được cấp | SEC | M8, TM-46 |
| 2026-10-15 | 1 | 2FA TOTP bắt buộc cho owner, manager trước khi đưa dữ liệu thật (R3) | SEC | TM-01 |
| 2026-10-15 | 1 | Thu hồi mọi phiên khi đổi vai/khóa/đặt lại mật khẩu; phiên admin 30 phút không hoạt động – tối đa 12 giờ; PWA 72 giờ – tối đa 30 ngày | SEC | TM-02, TM-03 |
| 2026-10-15 | 1 | Backup và snapshot ≤ 35 ngày là ràng buộc cứng; "xóa bằng hủy khóa" chỉ có hiệu lực trong backup sau ≤ 35 ngày; thêm `purge_journal` áp lại sau khôi phục | SEC | TM-15, TM-56 |
| 2026-10-15 | 1 | Ảnh của người không đồng ý: xóa ngay khi khai báo `confirmed`, 24 giờ là hạn trên (M3); link khách ân hạn 24 giờ với phạm vi thu hẹp (M4); `visa_alert_on` C2 có điều kiện (M9) | SEC | Mâu thuẫn ARC M3, M4, M9 |
| 2026-10-15 | 1 | Mã cửa ≥ 6 chữ số ngẫu nhiên; biến thể sinh nhật cần ≥ 3 số ngẫu nhiên hoặc khóa có giới hạn thử sai (chờ ESC-011) | SEC | TM-38 |
| 2026-10-15 | 1 | admin-web, PWA nhân viên, guest-web ở 3 tên miền con riêng, cookie `__Host-`, không CORS | SEC | TM-05, TM-27 |
| 2026-10-15 | 1 | Payload channel manager lọc theo danh sách trường cho phép trước khi lưu; không lưu payload thô có trường thẻ | SEC | TM-30, R-PAY-06 |
| 2026-10-15 | 1 | Dự thảo ESC "kiểm thử bảo mật độc lập + chấp nhận rủi ro còn lại TM-13/TM-17" (SEC report Phần 2 mục 7) dời trình INV ở cuối Round 2 – hạn quyết là trước Round 3, không cần INV quyết bây giờ | ORC | Bảo vệ thời gian INV; đã có 12 ESC ở Round 1 |
| 2026-10-15 | 1 | Lỗi máy chủ hiện "mã tham chiếu" = `requestId`; lỗi nghiệp vụ hiện theo chuỗi `error.<CODE>` (khớp `Problem.code` OpenAPI) | UXD | Thay mã lỗi minh họa đợt 2 |
| 2026-10-15 | 1 | Design System v0.2: thêm C31 Code input, C32 Code display (OTP, mã xác minh, 2FA) | UXD | SEC SR-GST, SR-AUTH |
| 2026-10-15 | 1 | Buồng phòng sau khi dọn hiển thị "Sạch – chờ kiểm" (CL→VC cần kiểm), không nhảy thẳng "Sẵn sàng" | UXD | state-machines SM buồng |
| 2026-10-15 | 1 | Thang mức lỗi P0–P3 cho sản phẩm và tài liệu (test-strategy mục 8); lỗi tiền, tồn phòng, C3 mặc định là P0 | QA | Protocol – quyền QA |
| 2026-10-15 | 1 | Tiêu chí ra R2: 100% TC ưu tiên Cao đạt, ≥ 95% TC TB đã chạy, 0 lỗi P0/P1 | QA | test-strategy |
| 2026-10-15 | 1 | Bộ dữ liệu test DS-E/DS-0 (T0 = 15/10/2026); tài khoản test `qa.*`, mật khẩu chỉ nằm trong file seed; ma trận truy vết chỉ sinh bằng script | QA | test-strategy |
| 2026-10-15 | 1 | Màn mặc định của `front_desk` và `front_desk_lead` là "Hôm nay" (sửa US-001 AC1, rbac, TC-NT-001/006) | PO | QA #8 |
| 2026-10-15 | 1 | 10 story Must R2 thiếu wireframe được vẽ ở bước 4 Round 1; riêng nhật ký tiền (US-006) được trễ sang tuần đầu R2 | PO | QA #9, QC C1 |
| 2026-10-15 | 1 | Lễ tân nhập tay đơn OTA vào căn đã kín: server không tự đổi căn mà không báo – trả 409 kèm gợi ý căn trống, lễ tân chọn; hết căn thì vào làn "Chưa gán căn"; phần tối thiểu US-139 kéo lên Must R2 | PO | QA #2 |
| 2026-10-15 | 1 | US-023 AC2 (gộp hồ sơ) chuyển sang US-074 (R3); US-087 AC2 thu hẹp ở R2, màn tổng hợp hoa hồng sang US-089 (R3); "Chốt số liệu tháng" là Could R3 | PO | QA #6, #7 |
| 2026-10-15 | 1 | Kênh đặt phòng R2 = danh sách BR-901 + trường "nguồn" cho đơn trực tiếp; Traveloka chỉ thêm khi INV xác nhận có dùng | PO | Brief mục 1 (Traveloka chờ duyệt) |
| 2026-10-15 | 1 | THAY dòng DOM trước về BR-603: [GIẢ ĐỊNH – chờ luật sư qua ESC-001] Hạn khai báo khách nước ngoài = giờ đến + 12 giờ (bỏ mốc 23:00 cho khách NN); khách VN giữ mốc 23:00 | DOM | ARC M1, BA-DOM-01 |
| 2026-10-15 | 1 | THAY dòng INT về mã sinh nhật: mã cửa theo ngày sinh = ddmm + ≥ 3 số ngẫu nhiên (theo SEC), chỉ khi khách muốn | DOM + SEC | SEC TM-38 |
| 2026-10-15 | 1 | Khối OOO lưu nửa mở [bắt đầu, ngày mở bán lại); mở bán lại mặc định = ngày xong + 1 (cùng cách tính đơn BR-002) | DOM | QA #1, PO-DOM-01 |
| 2026-10-15 | 1 | Sức chứa là thuộc tính từng căn; mã bill dạng `F26-000123` liên tục theo cơ sở; BR-607 thêm `void` | DOM | ARC M6, M7; QA #10 |
| 2026-10-15 | 1 | BR-411: nhận trước 06:00 = đêm bán; BR-215: phân bổ dài hạn chia theo số đêm của tháng hợp đồng | DOM | Đề nghị DATA |
| 2026-10-15 | 1 | Tự gán căn đơn OTA: căn ánh xạ → căn trống cùng nhóm; sang nhóm cao hơn chỉ gợi ý, không tự gán; thứ tự nhóm theo cấu hình | DOM | ARC Pha B |
| 2026-10-15 | 1 | Lễ tân được tự miễn (FOC) minibar trong hạn mức, có hạn mức tháng và báo cáo cảnh báo thất thoát; [GIẢ ĐỊNH – chờ INV qua ESC-007] 500.000 đ/người/tháng | DOM | BA SQ-3 |
| 2026-10-15 | 1 | Ngày nghiệp vụ đổi lúc 06:00 (khách đến sau nửa đêm vẫn thuộc ngày hôm trước) | DOM | DOM-BA-01 |
| 2026-10-15 | 1 | Ưu tiên khi đơn OTA và trực tiếp trùng căn: không tự hủy đơn OTA; tự gán chỉ trong nhóm; đơn ghi nhận trước giữ căn; đồng bộ lỗi > 15 phút thì cảnh báo đỏ và đóng bán thủ công trên extranet | DOM | DOM-INT-01 |
| 2026-10-15 | 1 | PHÂN XỬ ORC – nhận phòng khuya / ca tối (UXR-UXD-01, ARC-BA-01): giữ nguyên quy tắc SEC "C3 chỉ trên thiết bị được cấp, PWA điện thoại cá nhân không bao giờ được cấp". Người trực đêm dùng **thiết bị của cơ sở** (máy quầy hoặc máy tính bảng của cơ sở) đã được owner cấp quyền, mở admin-web; khuyến khích khách đến khuya check-in online trước. Ai trực tối và bằng thiết bị gì → câu hỏi bổ sung vào ESC-010 | ORC | SEC quyền bảo mật; DOM/BA quy trình; tránh vượt quyền |
| 2026-10-15 | 1 | PHÂN XỬ ORC – khách không có email (ARC-SEC-03, UXR-UXD-02): cho phép gửi mã xác minh do lễ tân cấp qua kênh nhắn tin OTA hoặc Zalo, MẶC ĐỊNH TẮT, owner bật theo từng kênh; thêm ô email (không bắt buộc) ở form đặt phòng mới; rủi ro còn lại ghi trong threat-model và báo INV ở round-summary | ORC | Cân bằng SEC (TM-21) và vận hành thực tế |
| 2026-10-15 | 1 | PHÂN XỬ ORC – ước lượng R2 lệch (ARC 9–11 vs BE 20–25 tuần-người): PO lập plan R2 theo thứ tự ưu tiên PRD D6 và bổ sung phương án thu hẹp R2 vào ESC-012 cho INV quyết | ORC | Phạm vi/mốc phát hành thuộc INV |
