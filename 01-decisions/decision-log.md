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
| 2026-10-16 | 1 | Vai DB: `ottimo_owner` (chủ schema), `ottimo_migrator` (migrate), `ottimo_app` (api + worker, không superuser, không BYPASSRLS), `ottimo_readonly` (OPS); hai URL `DATABASE_URL`/`MIGRATION_DATABASE_URL`; OPS hiện thực ở compose/CI | ARC | BE-ARC-01, -03 |
| 2026-10-16 | 1 | RLS dùng `app_current_property()` có `NULLIF`, biến số ít đặt bằng `set_config(…, true)` câu đầu mỗi giao dịch; truy vấn trước ngữ cảnh chỉ qua 7 hàm `SECURITY DEFINER` hẹp; `username` duy nhất toàn hệ thống | ARC | BE-ARC-01, -02 |
| 2026-10-16 | 1 | Job theo lịch: pg-boss tick mỗi phút, so mốc theo `Clock`; `job_run` + nghiệp vụ + outbox trong một giao dịch của pool app (mẫu architecture 9.1) | ARC | BE-ARC-05 |
| 2026-10-16 | 1 | `MutableClock` (bảng `dev_clock` dùng chung api/worker) + endpoint `/__test__/*` chỉ khi `APP_ENV ≠ production`, đặc tả riêng `openapi.test.yaml`; cấm `now()` trong SQL nghiệp vụ | ARC | BE-ARC-04, QA |
| 2026-10-16 | 1 | Migration SQL là nguồn sự thật của schema; drizzle-kit chỉ sinh nháp, cấm `push`, CI kiểm schema.ts khớp migration | ARC | BE-ARC-07 |
| 2026-10-16 | 1 | "Cần chú ý": mục suy từ trạng thái tính lúc đọc; mục sự kiện lưu `attention_event`; thông báo nhân viên `staff_notification` + SSE ở R2, Web Push R3 | ARC | BE-ARC-06 |
| 2026-10-16 | 1 | Idempotency: khóa trong cùng giao dịch, kiểm trước `If-Match`; `dryRun` không cần khóa; header khai `required: false`, middleware trả 428; lỗi khóa lạc quan là 412 | ARC | BE-ARC-11, -12; QA #3 |
| 2026-10-16 | 1 | [GIẢ ĐỊNH – đội tự chốt] Mọi phép tính giá dùng giá đêm niêm yết đã làm tròn đã lưu; làm tròn điểm giữa lên theo trị tuyệt đối | ARC (DOM xác nhận ví dụ BR-107) | BE-ARC-15 |
| 2026-10-16 | 1 | Bản ghi xung đột OTA lưu ở `overbooking_incident` mở rộng (không thêm bảng `booking_conflict`); lễ tân gán căn bằng `assignRoom` (B7a), đổi chéo bằng `swapRoom` (EXCLUDE DEFERRABLE) | ARC | INT, PO, BE-ARC-08 |
| 2026-10-16 | 1 | Webhook một họ đường dẫn `/v1/webhooks/{provider}/{propertySlug}` (+ GET VNPay); payload kênh chỉ lưu bản lọc allowlist, xóa sau 90 ngày | ARC (khớp INT, SEC) | SEC-ARC-08, -09 |
| 2026-10-16 | 1 | Gói nội bộ ESM xuất kép ESM/CJS qua `exports`; `services/api` build CJS `moduleResolution: Node16`; Node ≥ 22.12 | ARC | ARC tự nhận, FB-R1-ARC-OPS-01 |
| 2026-10-16 | 1 | Nhật ký `audit_event`, `c3_access_log`, `state_transition` phân vùng theo tháng ngay từ R2; `reservation_change` là nguồn lịch sử chỉ số (giữ theo T08) | ARC | BE-ARC-18, DATA-ARC-05 |
| 2026-10-16 | 1 | ARC chấp nhận ước lượng BE R2 ≈ 20–25 tuần-người (thay 9–11); phạm vi xử lý theo phân xử ORC + ESC-012 | ARC | BE-ARC-16 |
| 2026-10-16 | 1 | API 0.2.0-draft: đổi phá vỡ so với 0.1 (verify khách, cookie `__Host-`, webhook, `codeHint`, `AllowedAction`, `CancelReasonCode`, `approveRequest`) – báo MOB/FE/BE/INT; R2 code theo 0.2 | ARC | Skill ARC "không đổi contract mà không báo" |
| 2026-10-15 | 1 | Nhận trước 06:00 đi bằng chuyển riêng B9a "thêm đêm trước" (Trực tiếp/CTV thêm đêm đầu đơn; OTA tạo đơn con kênh Trực tiếp đi thẳng `in_house`); bỏ cách đổi ngày đến bằng B7 | BA (theo DOM) | DOM-BA-02; B7 cấm đổi ngày đơn OTA |
| 2026-10-15 | 1 | Đơn OTA chưa gán căn: thêm chuyển B7a "gán căn", B7b "OTA nhập tay vào căn kín" (409 + gợi ý / làn chưa gán), B7c "OTA sửa đơn"; nhận phòng bị chặn khi `conflict_state = open` | BA | ARC-BA-05, DOM-BA-06, quyết định PO |
| 2026-10-15 | 1 | Thêm SM-16 Nhóm đơn (mỗi căn vẫn là một đơn), SM-17 Ca làm việc, thuộc tính đối soát của giao dịch (`not_required/pending/reconciled/disputed`); chuyển khoản ghi tay và cọc do SAL xác nhận luôn `pending` cho tới khi MGR+ đối soát | BA | DOM-BA-03/05, SEC-BA-12 |
| 2026-10-15 | 1 | Thêm quy trình P11 Đóng ca/đối soát và P12 Vận hành khi mất mạng/mất điện; nhập bù dùng "giờ thực tế" + lý do, phụ thu và hạn khai báo tính theo giờ thực tế | BA | DOM-BA-03/04 |
| 2026-10-15 | 1 | Khai báo lưu trú khôi phục bằng K12 `void → none` dùng lại bản ghi (giữ UK một bản ghi/đơn) | BA | ARC-BA-03 |
| 2026-10-15 | 1 | RBAC: ký hiệu Q (chỉ thiết bị được cấp) cho mọi hành động/trường C3; cột khách tách GST1/GST2/GSTp; D12 tách tag / lưu ý sức khỏe (C3) / ghi chú tự do; đổi tài khoản nhận tiền chỉ OWN (A108); người thực hiện chuyển khoản hoàn là MGR+ | BA (theo SEC) | SEC-BA-01…04, ARC-BA-02/09 |
| 2026-10-15 | 1 | Mã sự kiện máy đọc (snake_case) cho mọi chuyển trạng thái ở `state-machines.md` mục 18; bản RBAC máy đọc `rbac-matrix.json` sinh từ `rbac-matrix.md` (tài liệu .md là nguồn sự thật) | BA | ARC-BA-10; QA đối chiếu `x-roles` |
| 2026-10-15 | 1 | Link check-in online: một link cho mỗi đơn, người đứng tên tải giấy tờ cho cả nhóm; link riêng từng người là ý tưởng R3 | BA | ARC-BA-06, ADR-006 |
| 2026-10-15 | 1 | Occupancy chỉ đếm đêm `sold` đã gán căn (luôn ≤ 100%). Đêm OTA xung đột chưa gán vẫn vào doanh thu phòng và ADR, không trừ đêm khả dụng, báo riêng ở S1c. Đối chiếu R-06 tách thành R-06a (đẳng thức đêm đã gán + OOO + trống = số căn) và R-06b (cảnh báo nghiệp vụ) | DATA | ARC M5, FB-R1-DATA-ARC-03 |
| 2026-10-15 | 1 | Phí kênh, hoa hồng, giảm giá/FOC tiền phòng, phí dịch vụ dài hạn được phân bổ và lưu theo đêm trên `stay_night`: phần nguyên đồng, dư dồn đêm cuối. Báo cáo không tự chia lại. Tổng OTA không có giá từng đêm thì chia đều | DATA | BL 8.2 #11; Σ các tháng khớp đúng số của đơn (R-09) |
| 2026-10-15 | 1 | Nguồn lịch sử đơn cho chỉ số là `reservation_change` (thời hạn T08). `stay_night` giữ `sold_at`/`voided_at`/`void_reason`/`prev_state` để tính pickup và đêm mất | DATA | FB-R1-DATA-ARC-04, 05 |
| 2026-10-15 | 1 | Thêm K-22: tỉ lệ hủy đơn đã xác nhận (loại giữ chỗ hết hạn, dời khách, kênh hủy do xung đột), tỉ lệ no-show (mẫu số = đơn đến hạn đến), đêm mất theo kênh | DATA | Thiếu chỉ số hủy/no-show (D-4) |
| 2026-10-15 | 1 | GOP gồm chi phí dời khách do overbooking (Σ `overbooking_incident.cost_vnd` đã giải quyết trong kỳ) | DATA | BR-312 |
| 2026-10-15 | 1 | S2 đích phụ đo theo tham số `front_desk_hours` cùng đệm cuối ca 60 phút (tham số, chờ DOM đưa vào BR mục 13). S5 tính trên mọi đơn đủ điều kiện, kèm S5-pre (đã gửi link trước 48 giờ) và S5-link. S11 dùng `user_activity_day` | DATA | FB-R1-PO-DATA-01, 05; D-8 |
| 2026-10-15 | 1 | Chỉ số theo thời điểm sự kiện dùng ngày nghiệp vụ (đổi lúc 06:00). Riêng dòng tiền K-20 dùng ngày lịch để khớp sao kê | DATA | Áp quyết định DOM ngày nghiệp vụ 06:00 |
| 2026-10-15 | 1 | Chốt tháng, pickup, bộ đối chiếu R-01…R-09 và MetricRegistry là R3 (chờ story PO). R2 chỉ lưu đủ trường và hiện K-01/K-02/K-03 đêm nay, S1c, S7 giám sát | DATA (theo PO) | FB-R1-PO-DATA-02, 06 |
| 2026-10-15 | 1 | `business-rules.md` v0.2: mã BR cũ giữ nguyên, quy tắc mới dùng số mới; con số không có khóa ở mục 13 thì không được dùng trong code; khung giờ "A–B" hiểu là [A, B), "quá N" = đủ N là quá | DOM | BA-DOM-08, BA-DOM-13 |
| 2026-10-15 | 1 | Số ngày báo trước (hủy, trả sớm, chấm dứt HĐ) đếm theo ngày lịch giữa ngày nghiệp vụ lúc báo và ngày mốc (BR-011); trả sớm "≥ 1 ngày" thay "≥ 24 giờ" | DOM | BA-DOM-07 |
| 2026-10-15 | 1 | Khôi phục no-show: FD/FDL tự làm khi còn trong ngày nghiệp vụ, căn chưa bán lại, không có tiền ra; còn lại MGR+ duyệt; đơn OTA đã báo kênh luôn MGR+ (BR-315) | DOM | BA SQ-1 |
| 2026-10-15 | 1 | Nhận phòng trước 06:00: kiểm căn trống đêm trước; đơn trực tiếp thêm đêm, đơn OTA tạo đơn con kênh Trực tiếp vào thẳng `in_house`; không ghi phụ thu (BR-417). Trả sau 18:00 xử lý như gia hạn | DOM | DOM-PO-03, BA-DOM-14 |
| 2026-10-15 | 1 | Nhận phòng khi buồng VD/CL: chỉ lễ tân trưởng+ với lý do, căn → OD, dọn ưu tiên; không áp cho đổi phòng khách đang ở (BR-402, 803, 424) | DOM | BA-DOM-04 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV qua ESC-007] Trả phòng nhanh chỉ khi còn phải thu = 0; phát sinh sau trả phòng ghi dòng riêng trên folio `settled` trong 24 giờ, quá hạn → công nợ; hóa đơn điện tử xuất khi folio `closed` (BR-427) | DOM | BA-DOM-05 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV qua ESC-007] Cơ sở phụ thu nhận sớm/trả muộn của đơn OTA = giá kênh Trực tiếp hiện hành của đêm đó (BR-415) | DOM | PO-DOM-03 |
| 2026-10-15 | 1 | [PHÁP LÝ – chờ ESC-001] Giấy tờ NN không đạt: thị thực hết trước ngày đi hoặc hộ chiếu hết trong kỳ ở → không chặn; đã hết hạn tại ngày nhận hoặc thiếu dấu nhập cảnh → chặn giao mã cửa, lễ tân trưởng+ quyết (BR-613) | DOM | PO-DOM-04 |
| 2026-10-15 | 1 | Đơn nhóm: mã nhóm liên kết đơn căn; kiểm tồn mọi căn trong một giao dịch; cọc chung phân bổ theo tiền phòng; hủy từng căn theo BR-309 trên cọc phân bổ; bill gộp mặc định, tách được; một bản ghi hoa hồng (BR-321…326) | DOM | DOM-PO-02 |
| 2026-10-15 | 1 | Đóng ca bắt buộc: tiền mặt đếm thực tế, chênh lệch có lý do; chuyển khoản ghi tay mang cờ "chờ đối soát" tới khi MGR+ tick theo sao kê; không nhận tiền mã hóa (BR-526, 527) | DOM | DOM-PO-06, DOM-BA-03 |
| 2026-10-15 | 1 | Vận hành dự phòng: bảng dự phòng hằng ngày (không có số giấy tờ, mã cửa); mất mạng thì không nhận đơn điện thoại khi chưa xem tồn; nhập bù theo giờ thực tế có lý do trong 24 giờ (BR-961…964) | DOM | DOM-BA-04 |
| 2026-10-15 | 1 | Xung đột OTA: phương án trong 60 phút nếu khách đến trong 24 giờ; đồng bộ lỗi > 15 phút → quản lý đóng bán thủ công trên extranet; mỗi xung đột có bản ghi chi phí (BR-317) | DOM | DOM-INT-01 |
| 2026-10-15 | 1 | Hạn sửa chữa: mức Cao không dừng khi chờ vật tư; TB/Thấp dừng khi `waiting_parts` có ngày dự kiến (BR-809) | DOM | BA SQ-2 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV qua ESC-005] Hoa hồng gộp theo tháng lịch: `payable` ngày 1, chi trước ngày 10 tháng sau; điều chỉnh sau khi chi trừ vào kỳ sau (BR-212, 903) | DOM | BA SQ-4 |
| 2026-10-15 | 1 | Thuế suất VAT là tham số có ngày hiệu lực; hóa đơn điện tử phát hành theo sự kiện nghiệp vụ BR-524, không theo từng lần thu (BR-523, 524) | DOM | DOM-PO-09, DOM-INT-02 |
| 2026-10-15 | 1 | Nhắc gia hạn thị thực: khách dài hạn trước 30 ngày, ngắn ngày trước 14 ngày (BR-605) | DOM | DOM-UXR J2-7 |
| 2026-10-15 | 1 | Ở tối thiểu (min stay) có tham số, mặc định tắt đến khi INV chọn (BR-113) | DOM | DOM-PO-13 |
| 2026-10-15 | 1 | Danh mục mã lý do hủy chuẩn `cancel_reason_code` (có `guest_cancelled`, `hold_expired`, `ota_cancelled`…) dùng chung mọi luồng hủy (BR-308) | DOM | Đề nghị DATA |
| 2026-10-15 | 1 | Interface adapter v0.2: mọi phương thức nhận `IntegrationContext {propertyId, credentialsRef, requestId}`; adapter không đọc `process.env`, khóa qua `CredentialProvider`; ngày = `LocalDate` (YYYY-MM-DD, nửa mở), thời điểm = `IsoInstant` có offset; lỗi duy nhất `IntegrationError` có `retryable`; mọi adapter có `healthCheck`; lõi chỉ import `@ottimo/integrations/contracts` | INT (ARC review) | ADR-007, ADR-008, ADR-011; ARC-INT-01/02/06/07/08/13 |
| 2026-10-15 | 1 | Không giữ payload thô của đối tác: DTO dựng theo allowlist từng trường, lọc dữ liệu thẻ (tên trường + Luhn 13–19 số) trước khi ghi, `rawFiltered` xóa sau 90 ngày; không bật quyền xem thẻ trên Beds24 | INT + SEC | SEC-INT-01 (Blocker), TM-30 |
| 2026-10-15 | 1 | Webhook kênh chỉ là tín hiệu (`parseWebhookSignal` → inbox) – worker luôn kéo lại đơn qua API (`fetchBooking`); Beds24 không ký webhook | INT | ARC-INT-04, SEC-INT-02 |
| 2026-10-15 | 1 | IPN thanh toán: `verifyCallback` trả `{ok:true,event} \| {ok:false,reason}` (không fail-open); ghi `succeeded` chỉ khi chữ ký + merchant + `paymentCode` đang `pending` + số tiền/VND khớp + `queryStatus` khớp; trùng `providerTxnId` → `already_confirmed` | INT + SEC | SEC-INT-03, SR-PAY-01…05 |
| 2026-10-15 | 1 | Đường dẫn webhook `/v1/webhooks/{provider}/{propertySlug}` (GET+POST cho VNPay), che query string trong log; cấu hình `…_MODE/PROVIDER=off\|mock\|sandbox\|production`, mặc định `off`, `off` không đăng ký webhook; production từ chối khởi động nếu tiền/kênh/khóa ở mock/sandbox | INT + SEC | ADR-011, SEC-INT-04, ARC-INT-12, SR-SECR-05(c) |
| 2026-10-15 | 1 | Trạng thái thanh toán dùng đúng SM-12/ERD; hoàn tiền là dòng `payment(type=refund)` riêng tạo sau duyệt SM-10, mã dòng hoàn làm khóa idempotency khi gọi cổng; `payment.method` = tên cổng | INT (khớp BA/ARC) | ARC-INT-11, BR-522, BR-008 |
| 2026-10-15 | 1 | Báo tiền về (SePay/payOS): chỉ HMAC, hoặc API key + IP nguồn + kéo lại giao dịch; khớp tự động chỉ khi đúng TK nhận + số tiền + đúng một mã bill + bill đang chờ | INT + SEC | SEC-INT-06, TM-31 |
| 2026-10-15 | 1 | Outbox chỉ chứa tham chiếu, nội dung (mã cửa, mã xác minh, email/SĐT) dựng lúc gửi; mã cửa mặc định gửi link app khách, mã trực tiếp chỉ khi khách chọn, ngày đến, không kèm địa chỉ/số căn | INT + SEC | SEC-INT-07, SEC-INT-09 |
| 2026-10-15 | 1 | Hóa đơn điện tử phát hành theo sự kiện BR-524 (trả phòng / kỳ thu / điện nước tháng), không theo từng lần thu; cọc/ký quỹ không phát hành | INT (theo DOM) | DOM-INT-02, BR-523/524 – kế toán xác nhận qua ESC-008 |
| 2026-10-15 | 1 | Đẩy tồn/giá/hạn chế lên CM theo khoảng ngày, gộp lô 10–30 giây, giữ ≥ 20% hạn mức Beds24 cho kéo đơn | INT | ARC-INT-09 |
| 2026-10-15 | 1 | Mỗi Mock có `MockScenario` (14 kịch bản lỗi) cấu hình qua `<NHÓM>_MOCK_SCENARIO` hoặc `setScenario()` | INT | ARC-INT-10 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận qua ESC-010] Email giao dịch dùng Amazon SES vùng Singapore; dự phòng Resend | INT | ARC-INT-17; rẻ, gần VN |
| 2026-10-15 | 1 | Mã nhân viên mở cửa: mỗi người một mã theo khung giờ, mã chủ chỉ quản lý giữ, nhật ký mở cửa đối chiếu việc buồng phòng | INT (theo DOM) | DOM-INT-07 |
| 2026-10-15 | 1 | api CommonJS dùng gói ESM dùng chung qua `require(esm)`: Node ≥ 22.12, `exports` có `default`, TypeScript ~5.8 `nodenext` cho api, test `createRequire` chặn tái phát | OPS (ARC đồng ý cách a) | FB-R1-ARC-OPS-01 |
| 2026-10-15 | 1 | 3 vai DB `ottimo_owner` (migration) / `ottimo_app` (api, worker, test; NOSUPERUSER NOBYPASSRLS) / `ottimo_readonly` (BYPASSRLS, NOLOGIN, theo runbook); superuser `ottimo_admin` không bao giờ trong cấu hình ứng dụng; `DATABASE_URL` và `MIGRATION_DATABASE_URL` tách | OPS | FB-R1-SEC-OPS-01, FB-R1-BE-ARC-03, ERD 2.1 |
| 2026-10-15 | 1 | `APP_ENV` (`dev|test|staging|production`) quyết hành vi môi trường, không dùng `NODE_ENV`; api/worker dừng khi cấu hình sai (khóa thiếu/yếu ở staging/production, `CLOCK_OVERRIDE`/mock/sandbox ở production, `TRUST_PROXY=true`) | OPS | FB-R1-SEC-OPS-09, SR-SECR-05 |
| 2026-10-15 | 1 | Log request chỉ ghi method + mẫu route + status; không query, header, IP; `TRUST_PROXY` mặc định không tin ai | OPS | FB-R1-ARC-OPS-04/05, FB-R1-SEC-OPS-02/08 |
| 2026-10-15 | 1 | CI: action ghim SHA, image ghim digest, `persist-credentials: false`, `pnpm audit --audit-level=high`, Redocly lint (R1 không chặn), gitleaks có allowlist kèm lý do | OPS | FB-R1-SEC-OPS-04/05, FB-R1-ARC-OPS-02/08 |
| 2026-10-15 | 1 | Không khôi phục backup production vào staging/dev; diễn tập trong môi trường dùng một lần; tắt snapshot hãng (≤ 7 ngày nếu bắt buộc); đích backup chỉ ghi thêm | OPS | FB-R1-ARC-OPS-09, FB-R1-SEC-OPS-03, SR-BAK-03…06 |
| 2026-10-15 | 1 | Bí mật mạnh nạp qua Docker secrets (`<TÊN>_FILE`), sổ bí mật trong hosting-plan 8.1 | OPS | FB-R1-SEC-OPS-10 |
| 2026-10-15 | 1 | ESLint chạy một lần ở gốc workspace, mỗi package chỉ `typecheck`; thêm `jsx-a11y` | OPS (ARC chọn b) | FB-R1-ARC-OPS-03/08 |
| 2026-10-15 | 1 | Duyệt FOC ở R2: người duyệt xác thực lại bằng mật khẩu đăng nhập của chính mình; PIN duyệt riêng ở R3; tài khoản 8 vai ở R2 tạo bằng dữ liệu khởi tạo/lệnh quản trị, đổi mật khẩu lần đầu | PO | FB-R1-BA-PO-02; BR-432 |
| 2026-10-15 | 1 | Lễ tân tự áp FOC minibar trong hạn mức lần + tháng không cần người thứ hai (US-007 AC6); vượt hạn mức đi luồng duyệt | PO (theo DOM) | FB-R1-DOM-PO-01; SM-10 A2 |
| 2026-10-15 | 1 | US-139 (đơn OTA trùng: cờ xung đột, làn "Chưa gán căn", chặn nhận phòng khi chưa gán) nâng Must R2; US-018 chặn trùng chỉ áp cho kênh Trực tiếp/CTV/HĐ | PO | FB-R1-BA-PO-01; BR-312 |
| 2026-10-15 | 1 | Ghi nhận đã thu từng kỳ HĐ dài hạn (US-119 AC5) làm cùng round với sinh HĐ (R2), để kỳ đã trả không bị báo quá hạn | PO | FB-R1-BA-PO-04 |
| 2026-10-15 | 1 | Link app khách sau `checked_out`: mã cửa, Wi-Fi, gửi yêu cầu khóa ngay; ân hạn `post_checkout_charge_hours` (BR-427) chỉ xem bill và trả phát sinh | PO | FB-R1-BA-PO-05; SEC M4; ADR-006 |
| 2026-10-15 | 1 | Nhận phòng trước mốc tròn 1 đêm: Trực tiếp/CTV thêm đêm vào đơn, OTA tạo đơn con Trực tiếp; căn không trống thì không cho nhận sớm (US-026 AC3) | PO (theo DOM) | FB-R1-DOM-PO-03 |
| 2026-10-15 | 1 | Đơn OTA nhập tay: giá ngoài sàn–trần chỉ cảnh báo + lý do; sàn–trần chặn với Trực tiếp/CTV/HĐ và khi sửa lịch giá | PO (theo DOM) | FB-R1-DOM-PO-11 |
| 2026-10-15 | 1 | Đóng ca/bàn giao ca (US-124) là kiểm soát tiền, nâng Must R3; X3 chỉ còn xếp ca/chấm công | PO | FB-R1-DOM-PO-06 |
| 2026-10-15 | 1 | Thêm US-140 Đơn nhóm nhiều căn (Must R3); ở R2 dùng đơn rời + ghi chú nhóm | PO | FB-R1-DOM-PO-02; R2 đã vượt ước lượng |
| 2026-10-15 | 1 | Thêm story bảo mật: US-141 xác minh nhẹ app khách (Must R2), US-142 thiết bị được cấp cho C3 (Must R2), US-143 2FA owner/manager (Must R3); US-144 chốt số liệu tháng (Could R3), US-145 vận hành dự phòng mất mạng/mất điện (Should R3). Backlog 145 story, 77 Must R2, 19 Must R3 | PO | T7, T11; decision-log SEC |
| 2026-10-15 | 1 | Không tạo ESC mới ở bước 4: câu hỏi phát sinh gom vào ESC-001, 004, 006, 007, 008, 010, 011, 012 (câu phụ có phương án + đề xuất); ESC-004…007 có bảng chọn từng dòng; tổng vẫn 12 ESC | PO | Protocol mục 8; FB-R1-BA-PO-14 |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV qua ESC-012] Nếu INV chưa trả lời, plan R2 theo phương án R-C: dời báo giá/HĐ dài hạn + ghi thu kỳ, app khách nâng cao (bill, mã cửa, OTP), nhắc kỳ thu/gia hạn tự động, mẫu tin sang đầu R3; không cắt nền tảng, chống trùng, folio/thu tiền, bảo vệ giấy tờ | PO | FB-R1-BE-ARC-16; PHÂN XỬ ORC |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV qua ESC-007] Phụ thu nhận sớm/trả muộn của đơn OTA tính trên giá trực tiếp hiện hành của căn | PO | T9; ESC-007 câu phụ (2) |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV qua ESC-008] Thuế suất VAT là tham số có ngày hiệu lực; loại hóa đơn tạm "hóa đơn GTGT" | PO (theo DOM) | FB-R1-DOM-PO-09 |
| 2026-10-15 | 1 | Chuyển khoản ghi tay mang cờ "chờ đối soát" từ R2 (US-119 AC6); màn đóng ca đầy đủ US-124 ở R3 | PO | UC-32, BR-527; BA đề nghị |
| 2026-10-15 | 1 | US-136: người trực tự khôi phục no-show khi đủ 3 điều kiện BR-315, ngoài điều kiện thì MGR+ | PO (theo DOM, BA) | BR-315, SM-01 B12 v0.2 |
| 2026-10-15 | 1 | Kiểm quyền lấy rbac-matrix (`rbac-matrix.json` cho A-xx, `rbac-matrix.md` cho S-xx/Dxx) làm nguồn chuẩn; OpenAPI `x-roles`/`x-scope`/`x-visible-to` được kiểm tĩnh so với rbac trong CI (`gen_traceability.py --strict`); OpenAPI cho thêm vai = lỗi tài liệu P1 (P0 nếu C3) | QA | FB-R1-BA-QA-03 |
| 2026-10-15 | 1 | Ma trận truy vết có thêm "chuyển trạng thái → TC" cho mọi máy SM và chỉ số "AC có TC chạy được ở R2 với kỳ vọng xác định" (TC nhãn `[BLOCKED]`/`[UNDECIDED]` không được tính) | QA | FB-R1-BA-QA-02, -04 |
| 2026-10-15 | 1 | Ưu tiên test: Cao = điều kiện ra round; nhãn (S) = bộ Smoke khoảng 38 ca chạy mọi PR, phần Cao còn lại chạy hằng đêm | QA | FB-R1-PO-QA-03 |
| 2026-10-15 | 1 | R2: story chỉ xong khi QA chạy hết TC Cao và PO nghiệm thu từng AC trên staging (Accepted / Trả lại) | QA + PO | FB-R1-PO-QA-04, DoD |
| 2026-10-15 | 1 | [GIẢ ĐỊNH QA – chờ DOM] "30 ngày sau trả phòng" = xóa ở lần chạy J16 đầu tiên từ 00:00 của (ngày trả theo lịch giờ VN + 30) | QA | FB-R1-BA-QA-01, BA-DOM-07 |
| 2026-10-15 | 1 | Dữ liệu DS-0: đơn còn hiệu lực nạp qua API (phải thỏa quy tắc hiện hành); đơn đã trả phòng và lịch sử nạp thẳng (`seed_source = direct`) | QA | FB-R1-BA-QA-07 |
| 2026-10-15 | 1 | Ảnh giấy tờ chuẩn hóa sang JPEG ở client (canvas); server chỉ nhận JPEG/PNG/WebP và vẫn mã hóa lại bằng `sharp`; HEIC gửi thẳng → 422; MVP không nhận PDF giấy tờ, bỏ ClamAV | SEC (theo ARC) | FB-R1-ARC-SEC-01, -02; SR-FILE-01/03/05 |
| 2026-10-15 | 1 | Mã xác minh lễ tân qua hộp thư OTA/Zalo: tham số `guest_verify_code_channels` mặc định tắt, OWN bật theo kênh; mã 6 số một lần, gắn token, 15 phút, tin riêng không chứa link, chỉ gửi vào hội thoại của đơn bằng Zalo của cơ sở; đếm sai chung theo token | SEC (thực thi phân xử ORC) | FB-R1-ARC-SEC-03; SR-GST-08/13; TM-61 |
| 2026-10-15 | 1 | Ô email không bắt buộc ở form đặt phòng; đổi email sau khi cấp link → không gửi OTP tới email mới trong 24 giờ | SEC | SR-GST-14 |
| 2026-10-15 | 1 | Thiết bị di động **của cơ sở** mở admin-web được cấp C3 theo checklist di động, hạn ≤ 30 ngày; máy cá nhân và PWA không bao giờ được cấp | SEC (thực thi phân xử ORC) | FB-R1-ARC-SEC-05; SR-DEV-08/09; TM-62 |
| 2026-10-15 | 1 | Step-up C3 là cửa sổ trượt 15 phút theo thao tác C3 gần nhất; đo khả dụng ở R2 rồi chỉnh | SEC | FB-R1-ARC-SEC-10; SR-C3-09 |
| 2026-10-15 | 1 | Cổng thanh toán không dùng đặt `off`; production chỉ chặn khởi động khi adapter đang bật ở `mock` | SEC | FB-R1-ARC-SEC-04; SR-SECR-05 |
| 2026-10-15 | 1 | Cảnh báo xem C3 "ngoài giờ" dùng `front_desk_hours` (không có phân hệ ca ở MVP) | SEC | FB-R1-ARC-SEC-06; SR-LOG-06 |
| 2026-10-15 | 1 | (R3, nên có) KEK tách khỏi `.env`, nạp qua Compose secrets, loại khỏi sao lưu tệp; TM-13 vẫn High | SEC | FB-R1-ARC-SEC-07; SR-KEY-10 |
| 2026-10-16 | 1 | Design System v0.3: thêm token `--focus-on-dark` (#F4F0E8 / #1B1A18) cho vùng nền tối; `--line-strong` sáng #8C8578 → #857E71; nút bị khóa không dùng opacity (nền `--surface-2`, chữ `--muted`, viền đứt); 0 cặp tương phản không đạt | UXD | FB-R1-UXR-UXD-05, 13 |
| 2026-10-16 | 1 | Cỡ chữ/vùng chạm tối thiểu áp cho mọi điều khiển theo mật độ (toast, seg, chip, thanh dưới, `.btn.sm`): Touch 14px/44px, HK 16px/48px; mọi nhãn ≥ 12px | UXD | FB-R1-UXR-UXD-04 |
| 2026-10-16 | 1 | Mẫu "Đến muộn / tự nhận phòng": xong thủ tục trước là có mã cửa; mã xem lại trong phiên (sessionStorage – SEC chốt thời gian giữ); luôn có nút gọi/nhắn người trực ở trang lưu trú, mã cửa, màn bị khóa | UXD (theo PHÂN XỬ ORC 15/10) | FB-R1-UXR-UXD-01 |
| 2026-10-16 | 1 | Trạng thái buồng VC một tên "Đã dọn – chờ kiểm", tông gỗ sồi (không dùng tông "ok" của Sẵn sàng) | UXD | FB-R1-UXR-UXD-09 |
| 2026-10-16 | 1 | Chữ tự do của nhân viên hiện cho khách: lý do chọn từ danh sách đã dịch, ghi chú tự do có nhãn "(tiếng Việt)" + `lang="vi"`; màn chưa đủ RU hiện "Русская версия скоро" | UXD | FB-R1-UXR-UXD-06 |
| 2026-10-16 | 1 | Wireframe dùng DS-0 của QA làm bộ dữ liệu mẫu duy nhất; đơn kịch bản ngoài DS-0 phải liệt kê ở `wireframes/index.html` | UXD (theo PO) | FB-R1-PO-UXD-02 |
| 2026-10-16 | 1 | VI dùng "Làm thủ tục trước (check-in online)" cho app khách; nút chân form "Đóng (giữ nháp)" thay "Hủy" | UXD | FB-R1-UXR-UXD-12, 16 |
| 2026-10-16 | 1 | [Đề nghị PO + SEC quyết] Có bắt buộc tài khoản owner thứ 2 / người khôi phục 2FA trước khi bật TOTP bắt buộc (R3) không – UXD đã vẽ cảnh báo "chủ đầu tư duy nhất" | PO + SEC | FB-R1-UXR-UXD-07 |
| 2026-10-15 | 1 | Cập nhật mức nghiêm trọng heuristic prototype R0 (v0.2): **HR-20** (khóa phòng từ phiếu sửa không chặn bán) **nâng Blocker** → danh sách Blocker = HR-01, HR-04, HR-06, HR-07, HR-20; HR-13 tách HR-13a (Major, buồng phòng) / HR-13b (Minor, chủ đầu tư/bill); HR-12 Major nếu H-01 đúng, Minor nếu sai. Tổng 26 phát hiện = 5 Blocker / 11 Major / 8 Minor / 2 Suggestion | UXR | Thuộc quyền UXR (mức nghiêm trọng vấn đề khả dụng); FB-R1-UXD-UXR-05; bán nhầm phòng hỏng = sai nghiệp vụ nghiêm trọng |
| 2026-10-15 | 1 | Tài liệu nghiên cứu (persona, hành trình) dùng hạn khai báo lưu trú **theo từng khách** – khách VN theo BR-602 (23:00), khách NN theo BR-603 (giờ đến + 12 giờ); nhắc hạn theo **thời gian còn lại**, mốc là tham số, không dùng giờ cố định | UXR | FB-R1-UXD-UXR-04, PO-UXR-02, DOM-UXR-02; số quy tắc lấy từ BR |
| 2026-10-15 | 1 | Luật quyết định cho H-05 (buồng phòng tự dùng app), áp khi có kết quả phiếu ESC-003: ≥ 2/3 nhiệm vụ tự làm → giữ L6; 1/3 → L6 rút gọn (Việc của tôi + Dọn xong), lễ tân nhập minibar/sự cố hộ; 0/3 hoặc từ chối → lễ tân cập nhật hộ + bảng in (PO điều chỉnh EP07) | UXR | Thuộc quyền UXR (kết luận nghiên cứu); FB-R1-UXD-UXR-03 |
| 2026-10-15 | 1 | Giả thuyết người dùng sau review: H-20 (bàn giao ca) nâng Cao; H-03 hạ TB; H-06 đóng bằng thiết kế; thêm H-21 (buồng phòng và kỹ thuật khác người – Cao), H-22, H-23, H-24 (TB). ESC-003 chỉ hỏi 7 giả thuyết Cao, H-04 → ESC-010, H-10 → INT, H-19 → ESC-007 | UXR | FB-R1-UXD-UXR-01/06/07, PO-UXR-03, DOM-UXR-03/06 |
| 2026-10-16 | 1 | Kết luận kiểm thử R1: 0 P0/P1, 9 P2, 13 P3 (chưa gồm sec-findings); TC-X-050 và CI BLOCKED do môi trường, không tính đạt | QA | rounds/round-01/qa/test-report.md |
| 2026-10-16 | 1 | Lệch rbac ↔ OpenAPI "cho thêm vai" được xem từng trường trước khi xếp mức; listRooms/listRoomGroups = P2 vì giá đã che bằng x-visible-to | QA | BUG-R1-005 |
