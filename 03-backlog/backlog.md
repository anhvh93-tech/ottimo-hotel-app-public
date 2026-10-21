# Product Backlog – OTTIMO Desk

- Chủ sở hữu: PO | Cập nhật: **21/10/2026 (Round 2 – Bước 4 sau cổng QC Round 2 KHÔNG ĐẠT, R-1) – PO chấm lại nghiệm thu trên `21bb797` (CI push 39364680576, T9 39462961483 + T9 lịch 39485554354 xanh): 71 story Must R2 = 64 Đạt (stack CI) + 7 Đang nghiệm thu, 0 Xong (staging); đổi tên nhãn "Đạt (stack tạm)" → "Đạt (stack CI)"; mục 5.5 thêm R3-Q40…Q45 (Zalo – INT)**; trước đó **18/10/2026 (Sprint 4, tuần Ổn định – QC nghiệm thu) – nghiệm thu PO Sprint 4: 15 story Sprint 4 → Đang nghiệm thu, US-003/019/084/085 lên Đạt (stack tạm); US-012 AC7 "Đồng bộ kênh lỗi" và US-031 AC1 thông báo J4 dời R3 (P-S4-14, 15); hàng chờ R3 mục 5.5 (18 mục – gồm SEC BE-65/74/75 Must trước dữ liệu thật)**; trước đó **18/10/2026 (Sprint 4, tuần Ổn định) – SEC ARC-25: thêm US-164 xác nhận từ xa của quản lý (Must R3; tổng 164, Must R3 30); mở ESC-023, ESC-024**; trước đó **17/10/2026 (Sprint 4) – INV chọn A "rút dữ liệu về phân tích": mở rộng US-104 (xuất báo cáo + dữ liệu theo kỳ, dữ liệu khách che, chỉ `owner`, nhật ký `export`), Should → Must R3 (Must R3 28 → 29)**; trước đó **17/10/2026 (Sprint 4 – Phản hồi & sửa sau workflow landing): INV chốt ESC-020 L7 = A → gỡ nhãn chờ INV ở US-155; US-155 AC2 (nguồn luôn `website` – BR-112 v0.3.7; "đã chuyển" khi giữ chỗ/đơn), AC7 (câu hứa BR-912), AC9; US-151 AC1 (Zalo đầu mọi ngôn ngữ, kể cả ô chọn kênh của form); US-147 AC6 bỏ chữ "10 căn"; US-146 AC5 `LodgingBusiness`, không tự nhận "khách sạn"/hạng sao; US-155 AC8 (Q-W09); ghi chú US-012, US-021 (xếp DOM-S4-11 (2), DOM-S4-17 sang R3); trả lời BA Q-W09, Q-W12–14 (`rounds/round-02/outputs/PO/qa-log.md`)**; trước đó **17/10/2026 (Sprint 4) – góp ý landing của INV (FB-INV-002): US-155 vào luồng LP-v1 (Must, phương án A chờ INV – ESC-020 L7); AC EP19 mới: không nêu số phòng, định vị boutique stay, Zalo trước + kênh khác ở chỗ phụ, link fanpage Facebook**; trước đó **17/10/2026 (khuya) – khởi động Sprint 4: ESC-019 A vào US-024 AC5–AC7, xác nhận AC EP19 theo ESC-020 A, cột trạng thái Sprint 4** (`rounds/round-02/sprint-4-plan.md`); trước đó **17/10/2026 (tối) – gộp landing + Zalo OA: EP16 thêm US-161…US-163, chỉnh US-034/040/116/126/138 theo ESC-021, EP19 áp điều kiện SEC, Brand Guidelines v1.0, e-brochure (4 hạng phòng) và ESC-020 L6**; trước đó **17/10/2026 (chiều) – thêm EP19 Landing page ottimo.vn (FB-INV-001, ESC-020)**; trước đó **17/10/2026 – Round 2 nghiệm thu PO Sprint 3 (CI + stack tạm, trước cổng QC)**; trước đó **16/10/2026 – Round 2 khởi động Sprint 3: nghiệm thu PO Sprint 1 + 2 (stack tạm) + áp ESC-015…017**; trước đó 16/10/2026 – Round 2 tuần 1 (W12): áp phạm vi R-C (INV quyết ESC-012 16/10) và kết quả 13 ESC; trước đó 15/10/2026 – Round 1, **bước 4** (sửa theo review BA, DOM, QA; trước đó: bước 2 đợt 3 – hoàn thiện AC theo BR/UC/SM/RBAC)
- Nguồn: `product/docs/PRD.md` (phân hệ M0–M15), `product/docs/round-0-baseline.md` (**BL**), `00-brief/investor-brief.md` (**Brief**), `business-rules.md` (**BR-xxx** – nguồn sự thật cho mọi con số), `use-cases.md` (**UC-xx**), `state-machines.md` (**SM-xx**, mã chuyển), `rbac-matrix.md` (mã vai, hành động **A-xx**, trường **Dxx**), `research/heuristic-review-r0.md` (**HR-xx**), `02-escalations/` (**ESC-xxx**).
- Trạng thái chung: đã qua review bắt buộc BA, DOM (bước 3) và sửa ở bước 4 – xem `rounds/round-01/responses/PO-responses.md`. Bước 4: thêm 6 story (US-140…US-145), US-139 nâng Must R2, US-124 nâng Must R3; tổng **145 story, 77 Must R2**. Đợt 3: mọi con số quy tắc trong tiêu chí nghiệm thu (AC) đã thay bằng **mã BR-xxx**; tên trạng thái theo `state-machines.md`; vai theo mã vai của `rbac-matrix.md`; thêm 7 story (US-133…US-139), nâng US-024 lên Must R2. Chính sách chưa chốt ghi "chờ ESC-xxx".
- **Round 2 tuần 1 (16/10/2026):** INV đã quyết cả 13 ESC theo đề xuất của đội. Áp **R-C**: 5 story dời đầu R3 (US-081, US-111, US-125, US-128, US-141 – Round = R3, trạng thái "Dời"), 4 story làm một phần ở R2 (US-012 trừ AC2, US-086 trừ AC3, US-108 trừ phần mã cửa của AC2, US-119 trừ AC5); thêm **US-017 AC5a tạm** (đơn dài hạn nhập tay). Còn **72 Must R2**, **24 Must R3**. Chỗ ghi "chờ ESC-xxx" nay ghi "INV quyết ESC-xxx 16/10"; nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` chỉ giữ cho thông tin INV còn phải gửi: sức chứa từng căn (ESC-004), loại hình kinh doanh (ESC-008), tài khoản ngân hàng + tên miền (ESC-010), thông tin khóa (ESC-011).
- **Round 2 Sprint 2 – Phản hồi & sửa (16/10/2026, PO):** **US-056 dời đầu R3** (cùng HĐ dài hạn – đơn dài hạn nhập tay AC5a mặc định không có gói dọn, BR-204/DOM D-15) → **71 Must R2**; **US-008 Should R3 → Must R3** (chỉ phần "Thêm người dùng" – R2 đã có khóa/mở, đặt lại mật khẩu ở S26 theo US-002) → Must R3 = 26; sửa **US-012 AC3** theo SEC SR-RET-06, thêm **US-012 AC8** (cảnh báo BR-435 cho OWN ở R2, tính khi đọc), **US-017 AC9** (người chốt bắt buộc với kênh CTV và nguồn `sales_staff`), **US-025 AC7** (ô "Đã giao mã cửa/thẻ" không bắt buộc). Chi tiết: `rounds/round-02/responses/s2-PO.md`.
- **Round 2 – nghiệm thu Sprint 1 + 2 (16/10/2026, PO – ĐK-S2-5 của QC):** nghiệm thu **trên stack tạm (CI compose, run 38911271416), chờ staging** – `rounds/round-02/outputs/PO/acceptance.md`. 30 story: **10 Đạt (stack tạm)** (US-001, 017, 023, 071, 072, 073, 080, 082, 084, 087), **19 Đang nghiệm thu**, **1 chưa làm** (US-022 → Sprint 3). Phần dời đều trong R2 (Sprint 3/4), ghi ở đầu AC từng story (dòng "> Nghiệm thu S2"). Trả lại US-083 AC2 phần tiếng Nga (PO-S2-01). Áp INV quyết 16/10: **ESC-015 A** (ghi chú US-005), **ESC-016 A** (US-109 AC1), **ESC-017 A** (US-084 AC1, US-086 AC5, US-119 AC6) – bổ sung vào AC có sẵn, không thêm số AC.
- **Round 2 – nghiệm thu Sprint 3 (17/10/2026, PO – trước cổng QC Sprint 3):** trên **CI 38998735861 (code `6af7173`) + stack tạm, chờ staging** – `rounds/round-02/outputs/PO/s3-acceptance.md`. 27 story Sprint 3: **17 Đạt (stack tạm)** (US-022, 026, 027, 035, 036, 037, 039, 042, 044, 045, 046, 047, 049, 050, 106, 107, 120), **10 Đang nghiệm thu** (US-025, 028, 029, 030, 031, 032, 038, 043, 048, 119 – phần dời đều Sprint 4), 0 trả lại. Chấm lại phần S1/S2 dời sang S3: lên Đạt US-002, 004, 005, 018, 021, 083, 142; **US-084 hạ về Đang nghiệm thu** (mã VietQR cọc chưa có trên Desk). Phần dời ghi ở dòng "> Nghiệm thu S3" của từng story: mã S4-xx theo `rounds/round-02/s4-carryover.md`; S4-25*…S4-33* là PO đề nghị ORC thêm. **US-066** xếp Sprint 4. Không phần Must R2 nào dời R3. **ESC-019** (giá khi khách xin đổi căn trước ngày đến – S4-21) chờ INV.
- **Round 2 – EP19 Landing page (17/10/2026, PO – FB-INV-001; INV quyết làm landing 17/10):** thêm **EP19** gồm 15 story **US-146…US-160**. **v1** (9 story: 7 Must, 2 Should) – trang giới thiệu công khai ở tên miền gốc, nút "Đặt phòng" mở chat Zalo OA/gọi/email, không form, không thu dữ liệu cá nhân; PO đề xuất làm **song song Sprint 4** bằng UXD + một luồng FE riêng, **không tính vào cổng QC Round 2**, có cổng QA/QC rút gọn riêng trước khi lên mạng (ORC chốt). **v2** (6 story, R3/R4+) nối vào EP18: hộp yêu cầu đặt phòng trong Desk (US-155) → US-131 (phòng trống + giá thật) → US-132. Câu phụ chờ INV ở **ESC-020** (L1–L5); AC viết theo phương án đội đề xuất, đổi theo lựa chọn của INV. Tổng **160 story**; Must R2 không đổi – **71** (ô tổng bảng epic trước đây ghi nhầm 72, đã sửa). Phạm vi chi tiết: `rounds/round-02/outputs/PO/landing-scope.md`.
- **Round 2 – Zalo OA chăm sóc khách (17/10/2026 tối, PO – tin nhắn INV 17/10; ESC-021 chờ INV):** thêm 3 story EP16: **US-161** lịch nhắn tin + "Tin cần gửi hôm nay" (Must R3 – chạy được khi chưa có tài khoản Zalo), **US-162** mời/nhắc check-in online + nhắc trước ngày đến kèm vị trí (Must R3 – lấp khoảng trống INV hỏi), **US-163** hộp thư Zalo OA trong Desk (Could R4+). US-126 giữ **Should R3** (phụ thuộc Zalo duyệt mẫu và tài khoản của INV), xếp Sprint 1 (bản giả lập) → Sprint 2 (nối thật) nếu INV chọn ESC-021 A. US-034 đi qua US-161 từ Sprint 1, tự gửi khi US-126 bật. US-116 tách: cảm ơn + mời đánh giá (Sprint 2–3) và mã đặt trực tiếp (chỉ người đã đồng ý US-077, theo ESC-021 K1). EP19 áp điều kiện SEC (C-1, DOM-05, DOM-06, UXD-02, C-2/C-3 cho US-155), **Brand Guidelines v1.0** (INV 17/10 – màu/chữ/giọng văn, không terracotta, phòng mang tên, không đánh số với khách), e-brochure 2026 (4 hạng phòng) và ESC-020 L6 (ảnh). Tổng **163 story**; Must R2 giữ **71**; Must R3 **26 → 28**.
- **Round 2 – khởi động Sprint 4 (17/10/2026 khuya, PO – `rounds/round-02/sprint-4-plan.md`):**
  - **INV quyết ESC-019 = A:** khách tự xin đổi sang căn khác trước ngày đến thì tính giá căn mới. Thêm **US-024 AC5–AC7** (Trực tiếp/CTV, đổi do OTTIMO, đơn OTA), Must R2, Sprint 4 – S4-21. AC1 ghi rõ phạm vi giữ snapshot.
  - **INV quyết ESC-020 = A hết:** AC EP19 thành AC chính thức, bỏ các nhánh "nếu INV chọn khác" (US-147, 151, 152, 156). PO xác nhận US-152 AC2 bản ARC (ADR-014 mục 3). US-148 dùng ghim Google Maps INV gửi 17/10, chung nguồn với US-108.
  - **INV quyết ESC-021 = A, K1 = A:** cập nhật chữ ở US-126 và ghi chú Zalo.
  - **Cột trạng thái:** 15 story Must R2 chưa làm → **"Sẵn sàng (Sprint 4)"** (US-010, 011, 012, 052, 053, 054, 055, 057, 061, 062, 066, 108, 109, 110, 112). 9 story EP19 v1 → **"Sẵn sàng (LP-v1)"**. **US-083 hạ về "Đang nghiệm thu"**: hộp báo giá Desk thiếu tiếng Nga (BUG-R2-080; ĐK-S3-4). "Sẵn sàng (…)" = Sẵn sàng (đủ AC, đã review) kèm đợt giao.
  - **Must R2: 71** = 32 Đạt (stack tạm) · 24 Đang nghiệm thu · 15 Sẵn sàng (Sprint 4). Tổng 163 story, không đổi.
  - **Truy vết:** US-024 thêm 3 AC → QA phải thêm TC **cùng commit**, nếu không `gen_traceability.py --strict` đỏ (job "API contract").
- **Round 2 – góp ý landing của INV (17/10/2026, PO – `04-investor-feedback/FB-INV-002.md`; ESC-020 L7 chờ INV – *INV chọn A cùng ngày, xem mục kế tiếp*):**
  - **US-155 (yêu cầu đặt phòng từ website vào Desk): Should R3 → Must "R2 – LP-v1"** theo ý 3 (INV muốn đặt phòng trực tiếp; nút "Đặt ngay" trên fanpage trỏ về website; Desk ghi nguồn `website`). AC viết theo **ESC-020 L7-A** (yêu cầu đặt phòng: không phòng trống/giá, không giữ phòng, không thanh toán online), nhãn **[GIẢ ĐỊNH – chờ INV xác nhận ý 3]**; AC9 giữ đường lên L7-B (US-131). AC4: form chỉ bật trên mạng khi có trả lời luật sư LZ-8 + LZ-2 (ESC-001), Desk chạy thật qua SEC-G1/G2, đạt SEC C-2/C-3; trước đó nút "Đặt phòng" mở chat Zalo.
  - **AC sửa/mới:** US-146 AC1, AC2, AC3 (sửa), **AC5–AC7** (định vị boutique stay; hai nhóm khách ngắn ngày/dài ngày; bố cục v1.2 INV duyệt trước khi dựng); US-147 tên story, AC1, AC3 (chữ "Ở dài ngày"), **AC6** (không nêu số phòng); US-149 AC5 (bắt buộc trước khi bật form); US-151 AC1, AC3, AC5 (sửa), **AC7** (Zalo đứng đầu ở mọi ngôn ngữ, WhatsApp/Telegram/Viber ở "Kênh khác"), **AC8** (link fanpage Facebook, không plugin); US-153 AC8 (thêm Telegram/Viber/Facebook vào danh sách "chỉ là link"); US-155 AC1–AC4 (sửa), AC5 (giữ), **AC6–AC11** (mới).
  - **Đếm:** tổng **163** story (không đổi); Must R2 **71** (không đổi – story luồng LP-v1 không tính); luồng **LP-v1: 8 Must** (thêm US-155) + 2 Should; Must R3 **28** (không đổi – US-155 trước đây là Should R3).
  - **Cổng LP-v1 hai mốc** (landing-scope mục 8): *trang* (US-146…US-154; form tắt trên mạng) và *form* (US-155 đạt trên bản thử + điều kiện AC4 → bật trên mạng).
  - **Lịch, năng lực:** `rounds/round-02/outputs/PO/landing-scope.md` mục 0 và 7.3 – BE-D làm phần máy chủ sau mốc D5, FE-B làm hàng chờ Desk sau việc CỔNG, FE-LP làm form; việc sửa lỗi tiền luôn đi trước; dừng cùng FE-LP ở bước cắt 4.
  - **Truy vết:** chưa có TC cho EP19 → `--strict` vẫn xanh (luồng riêng, mục 9 của traceability). Trước cổng LP-v1, QA viết TC cho mọi AC Must của luồng, **gồm US-155** (gắn `[BLOCKED …]` khi chưa có mã), để `--strict --strict-track LP-v1` xanh. Khi ARC thêm operation của US-155 vào `openapi.yaml`, BA phải thêm hành động vào `rbac-matrix` **cùng commit**, nếu không `--strict` (kiểm RBAC) đỏ.
- **Round 2 – Phản hồi & sửa sau workflow landing (17/10/2026, PO – INV chốt ESC-020 L7 = A; review `rounds/round-02/reviews/landing-booking-SEC.md`, `landing-v12-critic.md`; BA `specs/EP19-website-requests.md` mục 12; DOM BR v0.3.7/v0.3.8):**
  - **INV chọn L7 = A** (FB-INV-002, mục "Xác nhận của INV"): gỡ nhãn **[GIẢ ĐỊNH – chờ INV xác nhận ý 3]** ở US-155 (phương án, AC7, AC9), quy ước EP19, bảng epic, US-131, bảng 5.4. L7-B/L7-C là quyết định mới của INV.
  - **AC sửa:** US-155 AC1 (Zalo đầu ô chọn kênh), **AC2** (đơn từ yêu cầu web luôn nguồn `website` do server đặt – BR-112 v0.3.7, BA Q-W13; yêu cầu "đã chuyển" khi có giữ chỗ/đơn – BR-913 v0.3.8, SM-18), **AC7** (câu hứa công khai theo BR-912 (4): trong 1 giờ / trước 09:00), AC9 (SEC ARC-18); US-151 AC1 (BA Q-W14); US-147 AC6 (bỏ chữ "10 căn" – chuỗi cấm trỏ về danh sách DOM/UXD); **US-146 AC5** (khai `LodgingBusiness`, không `Hotel`; không tự nhận "khách sạn"/hạng sao – DOM, ESC-001 LZ-9).
  - **Q-W09** (BA): làm ở mốc "form" của LP-v1 – US-155 AC8 thêm báo lên FDL + MGR khi quá hạn và cờ "đến hôm nay" (`sprint-4-plan.md` 16.3 c). **Xếp lịch DOM v0.3.8:** DOM-S4-17 "khách để lại" cho đơn đã đóng → R3 Sprint 1 (ghi chú US-021); DOM-S4-11 phần (2) người đi cùng VIP/Khách quen → R3 Sprint 1 (ghi chú US-012; US-012 AC7 nghiệm thu R2 theo người đứng tên).
  - Không đổi số story, MoSCoW, round. Còn mở cho PO (chờ ARC/DOM): Q-W05, Q-W07 (+ SEC ARC-14 "một cách liên hệ", trẻ em theo nhóm tuổi – AC1), Q-W11.
- **Round 2 – INV chọn A "rút dữ liệu về phân tích" (17/10/2026, PO – decision-log dòng INV 17/10):** **mở rộng US-104** thay vì thêm story (cùng người dùng `owner`, cùng việc xuất ra bảng tính, cùng quyền A105 và yêu cầu SEC SR-INP-06/TM-59 – một lối xuất, một nhật ký, một bộ quy tắc che). Story nay gồm báo cáo đã định dạng (gửi kế toán) **và** dữ liệu thô theo kỳ (đơn, đêm, doanh thu, folio, thu/hoàn, kênh, nguồn khách) dạng ZIP gồm các tệp CSV UTF-8 có BOM; dữ liệu khách che; chỉ `owner` (A105 bỏ MGR); mọi lần xuất ghi `audit_event` category `export`. **Should → Must R3**: INV đã chọn và đây là lối duy nhất để INV tự phân tích khi INV đã loại đẩy dữ liệu ra dịch vụ ngoài (B) và kết nối thẳng cơ sở dữ liệu (C). Tổng 163 story (không đổi); Must R2 71; **Must R3 28 → 29**. Phụ thuộc R3: SEC, ARC, DATA, BA (ghi ở AC US-104).
- **Round 2 – SEC ARC-25 (18/10/2026, PO – `rounds/round-02/reviews/s4-SEC-lateFee-reauth.md`):** đường "phụ thu trả muộn bằng giá 1 đêm" (BR-416-06) cần quản lý nhập mật khẩu tại quầy, nhưng thường xảy ra sau 18:00 khi quản lý vắng → nguy cơ đọc mật khẩu qua điện thoại. Thêm **US-164** (EP00, **Must R3**): quản lý xác nhận từ xa trên thiết bị của mình bằng PIN/2FA; áp chung cho mọi đường cần quản lý xác nhận tại quầy. Hướng dẫn vận hành: cấm đọc mật khẩu qua điện thoại (`rounds/round-02/demo-1-guide.md` mục 2). Cách làm khi quản lý không trả lời là chính sách → **ESC-024** (chờ INV). Tổng **164** story; Must R2 71; **Must R3 30**.
- **Round 2 – cổng QC Sprint 4 KHÔNG ĐẠT, K10 (19/10/2026, PO – `rounds/round-02/qc/s4-qc-gate.md` mục 5):** hàng chờ R3 mục 5.5 thêm R3-Q19…Q32 (dời từ cổng S4, mỗi mục có vai và hạn; mọi thẻ `pendingFix` của `br-examples.json` trỏ tới mục có thật). Mã cửa theo INV 19/10 (R3-Q32; US-130 sửa chữ). Không đổi số story.
- **Round 2 – nghiệm thu PO Sprint 4 (18/10/2026, tuần Ổn định – G6.1/G6.2 của QC; `rounds/round-02/outputs/PO/s4-acceptance.md`):** mã HEAD `7ac11a4`, bằng chứng CI #12 `3bd4ac4`, stack tạm, chờ staging. 86 AC phần Sprint 4: **50 Đạt** (7 trong đó "Đạt (G1)" – chờ kiểm lại S4-38 lần 6), **32 Chờ ca UI**, **2 Chưa** (S4-33), **2 Dời R3**. Cột trạng thái: 15 story "Sẵn sàng (Sprint 4)" → **Đang nghiệm thu**; US-003, US-019, US-084, US-085 lên **Đạt (stack tạm)**. Must R2 71 = **36 Đạt (stack tạm) · 35 Đang nghiệm thu · 0 Sẵn sàng**. Quyết định P-S4-14…20: US-012 AC7 dòng "Đồng bộ kênh lỗi" và US-031 AC1 thông báo chủ động J4 → R3 (phụ thuộc kết nối kênh thật và gửi tin thật – R3); US-061 AC1 ngày mở bán lại hiện sau khi lưu ở R2; US-052 AC1 nhãn trạng thái bằng câu (H19); US-066 AC2 đọc theo BR-702-04; story có AC tiền trong phạm vi S4-38 hoặc còn review bắt buộc/Major mở thì giữ "Đang nghiệm thu". Thêm **mục 5.5 – hàng chờ R3** (16 mục, không thêm story). Không đổi số story (164), MoSCoW, round, số AC; Must R3 giữ 30.

## 1. Quy ước

| Cột | Ý nghĩa |
|---|---|
| ID | `US-xxx`, không tái sử dụng khi xóa |
| Vai | Nhóm PRD U1–U5 kèm **mã vai** của `rbac-matrix.md` mục 1: U1 `owner` (chủ đầu tư), `manager` (quản lý) · U2 `front_desk_lead` (lễ tân trưởng), `front_desk` (lễ tân, gồm người trực đêm) · U3 `housekeeping` (buồng phòng), `maintenance` (bảo trì/kỹ thuật) · U4 `sales_staff` (sale nội bộ), `collaborator` (CTV/môi giới) · U5 `guest` (khách, qua link của đơn). Vai trong câu story là **người hưởng lợi chính**; quyền thao tác chi tiết theo `rbac-matrix.md` (một tài khoản nhiều vai = hợp quyền). Ký hiệu nhóm: FD+ = front_desk, front_desk_lead, manager, owner; FDL+ = front_desk_lead, manager, owner; MGR+ = manager, owner |
| MoSCoW | **Must** = bắt buộc cho bản RC cuối R3 · **Should** = nên có, dời được nếu thiếu thời gian · **Could** = làm nếu dư · **Won't** = không làm trong MVP (xem PRD 5.3) |
| Round | Round dự kiến giao (R2, R3, R4+ = sau MVP) |
| Nguồn | Mục BL / Brief / decision-log làm căn cứ; "Mới" = không có trong BL, đội đề xuất |
| Trạng thái | Mới · Sẵn sàng (đủ AC, đã review) · Đang làm · **Đang nghiệm thu** (đã giao, PO nghiệm thu từng AC: còn AC đạt một phần/dời trong R2/thiếu bằng chứng/trả lại – xem `rounds/round-<n>/outputs/PO/acceptance.md`) · **Đạt (stack CI)** (trước 21/10 ghi "Đạt (stack tạm)" – cùng nghĩa: mọi AC phần R2 đạt trên stack CI dùng một lần; **chưa** phải đạt trên staging; chờ PO nghiệm thu lại giao diện trên staging – P-R2-7) · **Xong = Đạt (staging)** (đạt trên staging; tới 21/10 chưa story nào vì chưa có staging) · Dời · Nghiệm thu S3 (17/10) ghi Accepted = **Đạt (stack tạm)**, Accepted một phần = **Đang nghiệm thu** (`rounds/round-02/outputs/PO/s3-acceptance.md`) |

Thứ tự ưu tiên trong R2 nếu thiếu thời gian (PRD D6): EP00 → EP02/EP11 (đơn, chống trùng, giữ chỗ) → EP03–EP05 → EP06 → EP07/EP08 → EP14 → phần còn lại.

## 2. Danh sách epic

| Epic | Tên | Phân hệ PRD | Số story | Must R2 (sau R-C) |
|---|---|---|--:|--:|
| EP00 | Nền tảng: đăng nhập, phân quyền, cấu hình, nhật ký, phê duyệt, xác nhận hành động, thiết bị được cấp, 2FA | M0 | 13 *(+US-164, 18/10)* | 9 |
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
| EP19 | Landing page ottimo.vn (website giới thiệu công khai + yêu cầu đặt phòng vào Desk; LP-v1 trước, v2 nối EP18) | M15 (mở rộng – INV quyết ESC-020 = A hết 17/10; FB-INV-002 17/10 thêm đặt phòng trên website – ESC-020 L7 = A (INV 17/10); PO cập nhật PRD M15 trong Sprint 4) | 15 | 0 (luồng LP-v1 riêng: 8 Must – không thuộc cổng QC R2) |
| | **Tổng** | | **164** | **71** |

## 3. User story

### EP00 – Nền tảng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-001 | Là **nhân viên OTTIMO** (mọi vai nội bộ) (U1–U4), tôi muốn đăng nhập bằng tài khoản riêng, để mọi thao tác được ghi đúng người làm | Must | R2 | BL 2, BL 7; UC-28 | Đạt (stack CI) |
| US-002 | Là **chủ đầu tư** (`owner`), tôi muốn gán vai (`owner`, `manager`, `front_desk_lead`, `front_desk`, `housekeeping`, `maintenance`, `sales_staff`, `collaborator`) cho từng tài khoản, để mỗi người chỉ thấy và làm đúng phần việc của mình | Must | R2 | BL 2, BL 8.2 #27, decision-log 15/10 (4 nhóm), rbac mục 1 | Đạt (stack CI) |
| US-003 | Là **chủ đầu tư** (`owner`), tôi muốn dữ liệu nhạy cảm (giấy tờ tùy thân, giá vốn, P&L, hoa hồng người khác) bị ẩn với vai không được phép ở mọi màn hình, để tránh lộ thông tin và thất thoát | Must | R2 | BL 2 (mâu thuẫn quyền), BL 8.2 #27, BL 5.13 | Đạt (stack CI) |
| US-004 | Là **chủ đầu tư** (`owner`), tôi muốn quản lý danh mục căn (số, tên, nhóm, giá niêm yết đêm/tháng, sức chứa, trạng thái bán), để sơ đồ phòng và giá luôn đúng thực tế | Must | R2 | BL 4.1, BL 9 #1, #5 | Đạt (stack CI) |
| US-005 | Là **chủ đầu tư** (`owner`), tôi muốn tự chỉnh bảng tham số quy tắc (`business-rules.md` mục 13: giảm giá, phụ thu, cọc, hạn giữ chỗ, giờ chuẩn, đơn giá điện nước, phí phạt, hoa hồng), để đổi chính sách mà không cần lập trình viên | Must | R2 | BL 5 (toàn bộ), BL 4.17, decision-log 15/10 (số quy tắc cấu hình được) | Đạt (stack CI) |
| US-006 | Là **chủ đầu tư** (`owner`), tôi muốn xem nhật ký mọi thao tác liên quan tới tiền (folio, giảm giá, FOC, hủy, thu tiền) với người làm, thời điểm, giá trị cũ/mới, để kiểm soát thất thoát | Must | R2 | BL 5.7, BL 8.2 #24 | Đạt (stack CI) |
| US-007 | Là **quản lý / lễ tân trưởng** (`manager`, `front_desk_lead`), tôi muốn tự xác nhận các khoản FOC/giảm giá cần duyệt bằng chính tài khoản của mình (không để người thao tác chọn tên người duyệt), để việc miễn phí có người chịu trách nhiệm thật | Must | R2 | BL 5.7, BL 8.2 #24, BL 9 #8 | Đạt (stack CI) |
| US-008 | Là **chủ đầu tư** (`owner`), tôi muốn tự thêm, khóa tài khoản và đặt lại mật khẩu cho nhân viên, để không phụ thuộc đội kỹ thuật khi nhân sự thay đổi | Must (nâng từ Should – R2 Sprint 2, PO) | R3 (phần "Thêm người dùng"; khóa/mở, đặt lại mật khẩu đã có ở R2 – US-002, EP00 mục 2) | Mới | Mới |
| US-009 | Là **chủ đầu tư** (`owner`), tôi muốn chọn cơ sở khi đăng nhập, để sau này quản lý thêm cơ sở thứ hai trên cùng app | Could | R4+ | BL 9 #24, decision-log (đa cơ sở thiết kế sẵn) | Mới |
| US-142 | Là **chủ đầu tư** (`owner`), tôi muốn dữ liệu giấy tờ tùy thân (C3) chỉ mở được trên thiết bị của cơ sở do tôi cấp quyền (máy quầy, máy tính bảng của cơ sở), không bao giờ trên điện thoại cá nhân, để giấy tờ khách không rời khách sạn | Must | R2 | Mới; decision-log SEC (C3 chỉ trên thiết bị được cấp), PHÂN XỬ ORC ca tối; SEC SR-DEV-01…07 | Đạt (stack CI) |
| US-143 | Là **chủ đầu tư / quản lý** (`owner`, `manager`), tôi muốn đăng nhập có bước xác thực thứ hai (mã từ ứng dụng xác thực), để tài khoản quyền cao không bị chiếm khi lộ mật khẩu | Must | R3 | Mới; decision-log SEC (2FA TOTP trước dữ liệu thật); SEC SR-AUTH-06 | Mới |
| US-135 | Là **nhân viên OTTIMO** (mọi vai nội bộ), tôi muốn mọi hành động không đảo ngược (hủy đơn/giữ chỗ, no-show, hoàn tất trả phòng, đóng/mở bán kênh, gộp hồ sơ, đóng phiếu sửa mở khóa phòng, xóa ảnh giấy tờ) đều có hộp xác nhận nêu rõ hậu quả, để không mất đơn hay sai tiền vì bấm nhầm | Must | R2 | HR-06 (Blocker), BL 8.2 #23 | Đang nghiệm thu |
| US-164 | Là **quản lý / chủ đầu tư** (`manager`, `owner`), tôi muốn xác nhận từ xa trên thiết bị của chính mình (PIN duyệt hoặc 2FA) các thao tác cần quản lý xác nhận tại quầy – trước hết "phụ thu trả muộn bằng giá 1 đêm" (BR-416-06) – để lễ tân không phải giữ khách chờ và không ai phải đọc mật khẩu qua điện thoại | Must | R3 | **SEC FB-R2-SEC-ARC-25 (Major)** `rounds/round-02/reviews/s4-SEC-lateFee-reauth.md`; BR-416, BR-433; SR-AUTH-09, SR-AUTH-06, SR-AUTH-11 mới (SEC); ESC-024 (khi quản lý không trả lời) | Mới – AC ở mục 4 "Story mới Must R3" |

### EP01 – Tổng quan
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-010 | Là **chủ đầu tư / lễ tân** (`owner`, `front_desk`), tôi muốn thấy KPI đêm nay (công suất, số căn đang ở, khách đến, khách đi, căn khóa) tính từ dữ liệu thật, để nắm tình hình ngay khi mở app | Must | R2 | BL 3.2, BL 8.2 #8, #28, #29 | Đang nghiệm thu |
| US-011 | Là **lễ tân** (`front_desk`), tôi muốn danh sách khách đến/đi hôm nay có nút Nhận phòng/Trả phòng và không lẫn đơn hủy hoặc giữ chỗ, để xử lý đúng việc trong ngày | Must | R2 | BL 3.2, BL 8.2 #7 | Đạt (stack CI) |
| US-012 | Là **chủ đầu tư / lễ tân** (`owner`, `front_desk`), tôi muốn mục "Cần chú ý" tự sinh từ dữ liệu (chưa khai báo lưu trú, thị thực sắp hết, kỳ thu dài hạn sắp tới, hợp đồng sắp hết hạn, giữ chỗ sắp hết hạn, căn khóa, phiếu sửa mức Cao, đồng bộ kênh lỗi, khách quen/VIP đến hôm nay), để không bỏ sót việc quan trọng | Must | R2 (một phần; AC2 + job J12 → R3 – INV quyết ESC-012 16/10 – R-C; AC7 dòng "Đồng bộ kênh lỗi" → R3 – PO 18/10, P-S4-14) | BL 3.2, BL 8.2 #28, BL 5.20; BR-907 | Đang nghiệm thu |
| US-013 | Là **lễ tân** (`front_desk`), tôi muốn thấy số việc buồng phòng chưa xong, phiếu sửa đang mở, yêu cầu khách chưa xử lý và bấm vào để mở đúng màn hình, để điều phối nhanh | Should | R2 | BL 3.2 | Mới |
| US-014 | Là **chủ đầu tư** (`owner`), tôi muốn xem ADR, RevPAR tháng và biểu đồ công suất 30 ngày qua + 14 ngày tới so với mục tiêu công suất G1 (PRD 3.1), để biết cần đẩy bán hay không | Should | R3 | BL 3.2, Brief 1 | Mới |
| US-015 | Là **chủ đầu tư** (`owner`), tôi muốn được cảnh báo khi công suất dự kiến hoặc số căn dài hạn lệch mục tiêu, để hành động sớm | Could | R4+ | BL 9 #25 | Mới |

### EP02 – Room rack & đặt phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-016 | Là **lễ tân** (`front_desk`), tôi muốn xem sơ đồ phòng 10 căn × 14 ngày với thanh đơn phân biệt loại (đang ở, đã xác nhận, dài hạn, giữ chỗ, đã trả, khóa) bằng cả màu và chữ, để thấy ngay phòng trống | Must | R2 | BL 3.3a, BL 8.3 | Đạt (stack CI) |
| US-017 | Là **lễ tân** (`front_desk`), tôi muốn tạo đơn ngắn ngày (căn, kênh, ngày đến, số đêm, số khách, giá/đêm, mã OTA, đã thu qua OTA hay chưa), để mọi đơn – kể cả đơn OTA – nằm ở một nơi | Must | R2 | BL 3.5, BL 8.2 #26 | Đạt (stack CI) |
| US-018 | Là **lễ tân** (`front_desk`), tôi muốn hệ thống chặn đặt trùng căn – đêm ngay cả khi hai người lưu cùng lúc (đơn OTA đã có thật thì không chặn mà gắn cờ xung đột – US-139), để không bao giờ phải đuổi khách vì trùng phòng | Must | R2 | BL 5.4, BL 8.2 #30; BR-312 | Đạt (stack CI) |
| US-019 | Là **lễ tân** (`front_desk`), tôi muốn căn đang khóa (OOO) bị coi là không bán được trên sơ đồ, khi kiểm trùng và khi tính phòng trống, để không nhận khách vào phòng hỏng | Must | R2 | BL 8.2 #5 | Đạt (stack CI) |
| US-020 | Là **lễ tân** (`front_desk`), tôi muốn mở chi tiết đơn thấy tiến trình, thông tin khách, folio và chỉ những nút hành động hợp lệ với trạng thái đơn và vai của tôi, để không thao tác nhầm | Must | R2 | BL 3.4, BL 8.2 #27 | Đạt (stack CI) |
| US-021 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn hủy đơn hoặc hủy giữ chỗ với lý do bắt buộc (BR-308), có hộp xác nhận nêu hậu quả và phí hủy/hoàn theo BR-309/BR-310, để có dấu vết và mở lại phòng ngay | Must | R2 | BL 3.18, BL 8.2 #23, BL 9 #6, HR-06, UC-05, ESC-006 | Đạt (stack CI) |
| US-022 | Là **lễ tân** (`front_desk`), tôi muốn thêm người đi cùng (người lớn có hồ sơ, trẻ em có năm sinh) vào đơn và được cảnh báo khi số người khai ít hơn số khách, để khai báo lưu trú đủ người | Must | R2 | BL 3.4, BL 3.17 | Đạt (stack CI) |
| US-023 | Là **lễ tân** (`front_desk`), tôi muốn mỗi mã đơn, mã khách, mã phiếu, số bill là duy nhất và không đổi, để tra cứu và đối soát không nhầm | Must | R2 | BL 8.2 #18 | Đạt (stack CI) |
| US-024 | Là **lễ tân** (`front_desk`), tôi muốn đổi căn hoặc đổi ngày của đơn chưa nhận phòng và đổi phòng cho khách đang ở (có kiểm trùng, lý do bắt buộc, giá theo quy tắc), để xử lý khi khách đổi kế hoạch hoặc phòng có sự cố | Must | R2 | Mới (BL không có); BR-424, BR-906; SM-01 B7, B14; UC-16, UC-23 – **nâng từ Should** vì US-061/BR-809 cần đổi phòng khi có sự cố | Đạt (stack CI) |
| US-136 | Là **lễ tân** (`front_desk`), tôi muốn được nhắc gọi khách chưa đến và tự đánh dấu "không đến" (no-show) sau mốc giờ quy định – hệ thống không tự đánh dấu – và tôi (người trực) tự khôi phục được khi khách đến muộn trong điều kiện an toàn, ngoài điều kiện thì quản lý duyệt, để mở bán lại đêm trống mà không đuổi nhầm khách đến khuya | Must | R2 | BR-311, BR-315; SM-01 B11, B12 (v0.2); UC-05 | Đạt (stack CI) |

### EP03 – Nhận phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-025 | Là **lễ tân** (`front_desk`), tôi muốn nhận phòng cho khách (ghi giờ thực tế, cảnh báo nếu buồng chưa sẵn sàng), để đơn chuyển "đang ở" và buồng chuyển "có khách" đúng lúc | Must | R2 | BL 3.6, BL 5.15 | Đạt (stack CI) |
| US-026 | Là **lễ tân** (`front_desk`), tôi muốn phụ thu nhận sớm tự tính theo bậc giờ và không tự phát sinh phí khi tôi chưa nhập giờ, để thu đúng mà không làm khách khó chịu | Must | R2 | BL 5.6, BL 8.2 #2 | Đạt (stack CI) |
| US-027 | Là **lễ tân** (`front_desk`), tôi muốn phụ thu nhận sớm/trả muộn của khách dài hạn được tính trên giá đêm quy đổi (không phải giá tháng), để không tính nhầm hàng triệu đồng | Must | R2 | BL 5.6, BL 8.2 #1, BL 9 #7 | Đạt (stack CI) |

### EP04 – Lưu trú
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-028 | Là **lễ tân** (`front_desk`), tôi muốn gia hạn đơn trong số đêm liên tiếp còn trống (tối đa theo tham số), có giá mặc định theo quy tắc và ghi dòng "thu trực tiếp" với đơn OTA, để bán thêm đêm mà không mất phí kênh | Must | R2 | BL 3.9, BL 5.8, BL 8.2 #12, #13 | Đạt (stack CI) |
| US-029 | Là **lễ tân** (`front_desk`), tôi muốn đặt trả muộn với phụ thu theo bậc giờ, được cảnh báo nếu có khách đến căn đó cùng ngày, và miễn phí (FOC) khi có người duyệt, để linh hoạt mà không ảnh hưởng khách sau | Must | R2 | BL 3.10, BL 5.6, BL 5.7, BL 8.2 #4 | Đạt (stack CI) |
| US-030 | Là **lễ tân** (`front_desk`), tôi muốn ghi giờ trả phòng khách xác nhận và nhật ký các lần nhắc, để cả ca biết khách nào đã trả lời | Must | R2 | BL 3.10, BL 4.15 | Đạt (stack CI) |
| US-031 | Là **lễ tân** (`front_desk`), tôi muốn thẻ "Khách trả phòng hôm nay chưa trả" đổi trạng thái theo giờ thật (chờ trả lời → cần gọi → quá giờ), để biết lúc nào phải gọi khách | Must | R2 (một phần; AC1 thông báo chủ động J4 → R3 – PO 18/10, P-S4-15) | BL 3.3b, BL 5.9 | Đạt (stack CI) |
| US-032 | Là **lễ tân** (`front_desk`), tôi muốn thêm dòng phát sinh vào folio (giặt ủi, đồ ăn, hư hỏng, phí phạt như khử mùi thuốc lá, làm lại thẻ phòng) từ danh mục có giá mặc định, để bill cuối không thiếu khoản nào | Must | R2 | BL 3.7, Brief 5 (phí phạt thực tế) | Đạt (stack CI) |
| US-033 | Là **buồng phòng / lễ tân** (`housekeeping`, `front_desk`), tôi muốn kiểm minibar giữa kỳ cho khách đang ở và ghi tiền vào folio ngay, để không dồn hết vào lúc trả phòng | Should | R2 | BL 3.13 | Mới |
| US-034 | Là **lễ tân** (`front_desk`), tôi muốn hệ thống tự gửi nhắc trả phòng cho khách theo các mốc giờ (tối hôm trước, sáng ngày trả) và nhận lựa chọn của khách (trả đúng giờ / ở thêm / trả muộn), để giảm cuộc gọi | Should | R3 (Sprint 1 qua danh sách gửi tay US-161; tự gửi khi US-126 bật – ESC-021) | BL 5.9, BL 7; DOM TP-07 (BR-425); kênh theo US-161 AC3 | Mới |
| US-137 | Là **lễ tân** (`front_desk`), tôi muốn ghi khách trả phòng sớm hơn ngày đi (mở bán lại các đêm còn lại, tính phần hoàn theo chính sách, cập nhật khai báo khách nước ngoài), để tồn phòng và tiền đúng | Should | R2 | BR-428, BR-604; SM-01 B16; ESC-006 | Mới |

### EP05 – Trả phòng & bill
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-035 | Là **lễ tân** (`front_desk`), tôi muốn bước 1 trả phòng là kiểm minibar (nhập số còn lại, tự tính số đã dùng và tiền, đồ miễn phí không tính tiền), để thu đúng đồ khách dùng | Must | R2 | BL 3.7, BL 5.14 | Đạt (stack CI) |
| US-036 | Là **lễ tân** (`front_desk`), tôi muốn bước 2 nhập phụ phí, giờ trả thực tế (tự tính phụ thu trả muộn), FOC và cách thanh toán, để chốt mọi khoản trước khi in bill | Must | R2 | BL 3.7, BL 5.6, BL 5.7 | Đạt (stack CI) |
| US-037 | Là **lễ tân** (`front_desk`), tôi muốn bước 3 xem bill đúng công thức (tiền phòng từng đêm, phát sinh, minibar, phụ thu, dòng FOC âm, trừ đã cọc, còn phải thu), song ngữ Việt – Anh và quy đổi USD tham khảo cho khách nước ngoài, để khách hiểu và trả tiền ngay | Must | R2 | BL 3.8, BL 5.20 | Đạt (stack CI) |
| US-038 | Là **lễ tân** (`front_desk`), tôi muốn bấm "hoàn tất" để đơn chuyển "đã trả", buồng chuyển "cần dọn", tự tạo việc dọn và bổ sung minibar, bill bị khóa không sửa được (chỉ điều chỉnh có ghi vết), để không còn việc làm tay sau khi khách đi | Must | R2 | BL 3.7, BL 5.15 | Đang nghiệm thu |
| US-039 | Là **lễ tân** (`front_desk`), tôi muốn ghi thông tin xuất hóa đơn GTGT cho công ty (tên, MST, email) ngay trong bước trả phòng, để phát hành hóa đơn đúng | Must | R2 | BL 3.7, BL 5.16 (MST), BL 5.20 | Đạt (stack CI) |
| US-040 | Là **lễ tân** (`front_desk`), tôi muốn in bill, xuất PDF và gửi bill qua email/Zalo, để khách có chứng từ ngay | Should | R3 | BL 3.8, BL 7; gửi Zalo qua US-126 (ESC-021); **bill đơn OTA không in mã đặt trực tiếp** (DOM BR-981 dự thảo, ESC-021 K1) | Mới |
| US-041 | Là **lễ tân** (`front_desk`), tôi muốn trả phòng cho khách dài hạn với tiền thuê/điện nước kỳ cuối và khấu trừ hoặc hoàn ký quỹ theo chính sách, để kết thúc hợp đồng đúng tiền | Must | R3 | BL 8.2 #6, BL 9 #9; UC-20 | Mới |

### EP06 – Giấy tờ, khai báo lưu trú & quyền dữ liệu của khách
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-042 | Là **lễ tân** (`front_desk`), tôi muốn danh sách khách cần khai báo kèm hạn tính theo BR-602/BR-603 ("khi nhận phòng", "trước <hạn> hôm nay", "đã quá hạn") và được nhắc trước hạn, để không bị phạt | Must | R2 | BL 3.11, BL 5.12 | Đạt (stack CI) |
| US-043 | Là **lễ tân** (`front_desk`), tôi muốn nhập giấy tờ từng người (chụp/tải ảnh và các trường: họ tên, loại, số, ngày sinh, quốc tịch, hạn hộ chiếu, thị thực, ngày nhập cảnh; trẻ em dùng số định danh), để có đủ dữ liệu khai báo | Must | R2 | BL 3.11, BL 4.12, BL 5.12 | Đang nghiệm thu |
| US-044 | Là **lễ tân** (`front_desk`), tôi muốn hệ thống đối chiếu tự động (tên khớp đơn, hộ chiếu còn hạn sau ngày trả, thị thực còn hạn đến ngày trả, đủ số người), để phát hiện sai sót trước khi khai báo | Must | R2 | BL 5.12, BL 8.2 #3 | Đạt (stack CI) |
| US-045 | Là **lễ tân** (`front_desk`), tôi muốn ghi nhận khách đã đồng ý cho OTTIMO lưu ảnh giấy tờ trước khi lưu, để tuân thủ luật dữ liệu cá nhân | Must | R2 | BL 5.13, BL 3.11 | Đạt (stack CI) |
| US-046 | Là **lễ tân** (`front_desk`), tôi muốn khai báo bán tự động: chọn đúng loại (tạm trú người nước ngoài / lưu trú công dân Việt Nam), sao chép dữ liệu, mở cổng Bộ Công an, dán mã hồ sơ, đánh dấu đã xác nhận, để làm nhanh dù cổng chưa có kết nối | Must | R2 | BL 3.11, BL 5.12, BL 9 #15 | Đạt (stack CI) |
| US-047 | Là **lễ tân** (`front_desk`), tôi muốn mọi đơn (đặt mới, từ báo giá, từ OTA) đều tự có bản ghi khai báo với số người cần khai, để không đơn nào bị sót | Must | R2 | BL 8.2 #9 | Đạt (stack CI) |
| US-048 | Là **chủ đầu tư** (`owner`), tôi muốn ảnh giấy tờ chỉ lễ tân và quản lý được xem, mỗi lần mở đều ghi nhật ký, hồ sơ khách chỉ hiện 4 số cuối, để bảo vệ dữ liệu nhạy cảm | Must | R2 | BL 5.13, BL 8.2 #27 | Đang nghiệm thu |
| US-049 | Là **chủ đầu tư** (`owner`), tôi muốn ảnh giấy tờ tự xóa sau số ngày cấu hình kể từ ngày trả phòng và xóa sớm khi khách yêu cầu, để không giữ dữ liệu quá mức cần thiết | Must | R2 | BL 5.13, BL 9 #14 | Đạt (stack CI) |
| US-050 | Là **lễ tân** (`front_desk`), tôi muốn được nhắc cập nhật ngày đi thực tế khi khách nước ngoài gia hạn/trả sớm, và bị cảnh báo khi ngày đi dự kiến vượt hạn thị thực/tạm trú, để khai báo tạm trú luôn đúng | Must | R2 | Brief 5 (khai báo tạm trú), BL 5.12 | Đạt (stack CI) |
| US-051 | Là **lễ tân** (`front_desk`), tôi muốn quét QR CCCD gắn chip hoặc vùng MRZ hộ chiếu để tự điền thông tin, để giảm gõ tay và sai sót | Should | R3 | BL 3.11, BL 7 | Mới |
| US-133 | Là **khách** (`guest`), tôi muốn gửi yêu cầu xem, sửa, xóa, rút đồng ý hoặc nhận bản sao dữ liệu cá nhân của mình qua app khách hoặc tại quầy và thấy thời hạn trả lời, để thực hiện quyền của chủ thể dữ liệu | Must | R3 | UC-30; SEC R-DSR-01, R-DSR-02; Luật 91/2025 (INV quyết ESC-001 16/10 – luật sư rà soát trước khi có dữ liệu thật) | Mới |
| US-134 | Là **quản lý** (`manager`, `owner`), tôi muốn hộp yêu cầu dữ liệu cá nhân có bước xác minh danh tính, nhắc hạn, liệt kê phần xóa được và phần luật buộc giữ, xuất bản sao dữ liệu của đúng khách đó, để xử lý đúng luật và có dấu vết | Must | R3 | UC-30; SEC R-DSR-02…04; rbac S31, A74 | Mới |

### EP07 – Buồng phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-052 | Là **buồng phòng** (`housekeeping`), tôi muốn xem trạng thái 10 căn trên điện thoại với bộ lọc (cần dọn, có khách, sẵn sàng) và khách đến kế tiếp, để biết dọn căn nào trước | Must | R2 | BL 3.12, BL 4.5 | Đạt (stack CI) |
| US-053 | Là **buồng phòng** (`housekeeping`), tôi muốn đổi trạng thái buồng chỉ theo các bước hợp lệ (bắt đầu dọn → dọn xong → kiểm đạt…), dọn xong thì việc dọn tự đánh dấu xong, để lễ tân thấy phòng sẵn sàng ngay | Must | R2 | BL 5.15; UC-22 | Đạt (stack CI) |
| US-054 | Là **buồng phòng** (`housekeeping`), tôi muốn danh sách việc hôm nay tự sinh (dọn trả phòng, dọn phòng khách đang ở, bổ sung minibar, yêu cầu từ app khách, lịch dọn dài hạn) và tick xong được, để không cần ai nhắn việc | Must | R2 | BL 3.12, BL 5.15, BL 5.19 | Đạt (stack CI) |
| US-055 | Là **buồng phòng** (`housekeeping`), tôi muốn đi qua checklist kiểm phòng trước khi đánh dấu "đã kiểm · sẵn sàng", để phòng đạt chuẩn OTTIMO | Must | R2 | BL 3.12; UC-23 | Đạt (stack CI) |
| US-056 | Là **buồng phòng** (`housekeeping`), tôi muốn việc dọn của khách dài hạn tự xuất hiện đúng ngày theo gói dọn (BR-204/BR-807) và khung giờ đã hẹn, để không quên lịch | Must | R3 (dời đầu R3 cùng HĐ dài hạn – PO R2 Sprint 2, E07-06/B-06) | BL 5.15, BL 3.21 | Dời |
| US-057 | Là **buồng phòng** (`housekeeping`), tôi muốn báo sự cố từ điện thoại (căn, mô tả, ảnh, mức độ), để kỹ thuật nhận phiếu ngay | Must | R2 | BL 3.14 | Đạt (stack CI) |
| US-058 | Là **buồng phòng** (`housekeeping`), tôi muốn thao tác đổi trạng thái vẫn được ghi nhận khi mạng chập chờn và tự gửi lại khi có mạng, để không phải làm lại | Should | R2 | BL 9 #22 | Mới |
| US-059 | Là **lễ tân** (`front_desk`), tôi muốn phân việc buồng phòng cho từng người và mỗi người chỉ thấy việc của mình trước, để rõ trách nhiệm | Should | R3 | BL 4.6, BL 9 #13 | Mới |
| US-060 | Là **buồng phòng** (`housekeeping`), tôi muốn chụp ảnh phòng sau kiểm và đính vào lần kiểm, để có bằng chứng khi khách phản ánh | Could | R3 | BL 3.12 | Mới |

### EP08 – Bảo trì & điện nước
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-061 | Là **kỹ thuật / lễ tân** (`maintenance`, `front_desk`), tôi muốn tạo phiếu sửa chữa (căn, mức độ, mô tả, người xử lý) và chọn khóa phòng với khoảng ngày dự kiến, để phòng hỏng không bị bán | Must | R2 | BL 3.14, BL 8.2 #5 | Đạt (stack CI) |
| US-062 | Là **kỹ thuật** (`maintenance`), tôi muốn cập nhật trạng thái phiếu (mới → đang xử lý → chờ vật tư → xong); khi xong thì căn được mở khóa và chuyển "cần dọn", để phòng quay lại bán nhanh | Must | R2 | BL 3.14, BL 5.15 | Đạt (stack CI) |
| US-063 | Là **kỹ thuật** (`maintenance`), tôi muốn việc bảo trì định kỳ tự sinh kỳ kế tiếp và báo trước hạn theo BR-810, để không quên bảo dưỡng | Should | R3 | BL 3.14, BL 4.8; UC-25 | Mới |
| US-064 | Là **kỹ thuật / lễ tân** (`maintenance`, `front_desk`), tôi muốn chốt chỉ số điện nước theo kỳ cho căn dài hạn, bị chặn khi chỉ số mới nhỏ hơn cũ, và xem lịch sử chỉ số, để tính tiền đúng | Must | R3 | BL 3.14, BL 5.10, BL 8.2 #21; UC-21; BR-501, BR-504, BR-505 | Mới |
| US-065 | Là **lễ tân** (`front_desk`), tôi muốn tiền điện nước đã chốt tự vào hóa đơn tháng của khách và hiện trong app khách, để thu không cần nhắn tin tính tay | Must | R3 | BL 5.10, BL 3.21; BR-501, BR-505, BR-506 (dọn lẻ tính vào hóa đơn tháng) | Mới |

### EP09 – Kho F&B / minibar
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-066 | Là **chủ đầu tư** (`owner`), tôi muốn quản lý danh mục mặt hàng minibar/F&B (giá vốn, giá bán hoặc miễn phí, mức chuẩn mỗi tủ, mức tối thiểu), để kiểm minibar và tính tiền đúng | Must | R2 | BL 4.13, BL 5.14 | Đạt (stack CI) |
| US-067 | Là **lễ tân** (`front_desk`), tôi muốn nhập kho, xuất kho (có lý do, không vượt tồn) và kiểm kê, xem bảng xuất nhập tồn tháng, để biết hàng còn bao nhiêu | Should | R3 | BL 3.15, BL 5.14; BR-705, BR-706 | Mới |
| US-068 | Là **buồng phòng** (`housekeeping`), tôi muốn tick việc "Bổ sung minibar" thì kho tự trừ và tủ về mức chuẩn, để tồn kho khớp thực tế | Should | R3 | BL 5.14 | Mới |
| US-069 | Là **lễ tân** (`front_desk`), tôi muốn được báo mặt hàng hết hoặc dưới mức tối thiểu, để nhập hàng kịp | Should | R3 | BL 3.15 | Mới |
| US-070 | Là **chủ đầu tư** (`owner`), tôi muốn xem doanh thu, lãi gộp F&B, chi phí đồ miễn phí và mặt hàng bán chạy, để điều chỉnh danh mục | Could | R3 | BL 3.15, BL 5.14 | Mới |

### EP10 – Khách hàng (CRM)
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-071 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn tạo và sửa hồ sơ khách (họ tên, SĐT/Zalo/WhatsApp, email, ngày sinh, quốc tịch, ngôn ngữ, liên hệ ưu tiên, công ty/MST, nhóm khách, sở thích, ghi chú), để phục vụ đúng người | Must | R2 | BL 3.16, BL 5.16 | Đạt (stack CI) |
| US-072 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn bị chặn khi tạo hồ sơ trùng SĐT hoặc email đã có (và được cảnh báo khi trùng tên + ngày sinh), để không sinh hồ sơ đôi | Must | R2 | BL 5.16 | Đạt (stack CI) |
| US-073 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn một bộ chọn khách dùng chung (tìm theo tên có/không dấu, SĐT, email, mã KH hoặc tạo nhanh) ở mọi nơi cần chọn khách, để thao tác giống nhau | Must | R2 | BL 3.16 (guestPicker) | Đạt (stack CI) |
| US-074 | Là **lễ tân** (`front_desk`), tôi muốn gộp hai hồ sơ trùng mà mọi đơn, người đi cùng, khai báo, báo giá, hợp đồng, công tơ đều chuyển theo và có nhật ký gộp, để lịch sử khách liền mạch | Should | R3 | BL 5.16, BL 8.2 #16; BR-953 | Mới |
| US-075 | Là **chủ đầu tư / sale** (`owner`, `sales_staff`), tôi muốn lọc khách theo phân khúc (khách quen, dài hạn, nước ngoài, VIP, người đi cùng, tiềm năng), để chăm sóc đúng nhóm | Should | R3 | BL 4.20 | Mới |
| US-076 | Là **lễ tân** (`front_desk`), tôi muốn xem dòng thời gian, số lượt lưu trú, doanh thu thanh toán và doanh thu phân bổ của khách, để nhận ra khách quen | Should | R3 | BL 3.16, BL 5.11 | Mới |
| US-077 | Là **lễ tân** (`front_desk`), tôi muốn ghi đồng ý nhận ưu đãi riêng từng người và gửi link mời người đi cùng tự điền liên hệ, để làm marketing hợp pháp | Should | R3 | BL 5.18, BL 3.17 | Mới |
| US-078 | Là **lễ tân** (`front_desk`), tôi muốn thấy độ đầy đủ hồ sơ tính đúng (chỉ tính "đồng ý ưu đãi" khi khách đã trả lời), để biết cần hỏi thêm gì | Could | R3 | BL 5.17, BL 8.2 #14; BR-955 | Mới |
| US-079 | Là **lễ tân** (`front_desk`), tôi muốn phát hiện hồ sơ nghi trùng theo tên chính xác hơn (không báo nhầm tên đảo chữ, bắt được tên thiếu một chữ), để gộp đúng | Could | R3 | BL 8.2 #15 | Mới |

### EP11 – Sale, báo giá, giữ chỗ, hợp đồng dài hạn
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-080 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn báo giá ngắn ngày (giảm theo số đêm, cọc, hoa hồng của tôi, phần OTTIMO còn lại), để trả lời khách ngay trong cuộc chat | Must | R2 | BL 5.3 | Đạt (stack CI) |
| US-081 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn báo giá dài hạn theo kỳ hạn, loại khách, gói dọn, số người (tiền thuê, phí dịch vụ, điện nước ước tính, ký quỹ, chu kỳ thu, thu khi chốt, hoa hồng, phần OTTIMO còn lại), để chốt hợp đồng tháng nhanh | Must | R3 (dời đầu R3 – INV quyết ESC-012 16/10 – R-C) | BL 5.2 | Dời |
| US-082 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn biết căn còn trống trong khoảng ngày và được gợi ý căn trống khác, để không hứa phòng đã có khách | Must | R2 | BL 5.4 | Đạt (stack CI) |
| US-083 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn lưu báo giá (có mã, hạn hiệu lực theo tham số) và sao chép văn bản báo giá Việt/Anh/Nga để gửi Zalo, để khách nhận báo giá chuyên nghiệp | Must | R2 | BL 3.18, BL 5.4, BL 8.2 #19, decision-log P4 | Đạt (stack CI) |
| US-084 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn tạo đơn giữ chỗ từ báo giá với hạn giữ theo BR-302 và cách nhận cọc, căn bị khóa ngay, để khách yên tâm chuyển cọc | Must | R2 | BL 3.18, BL 5.5 | Đạt (stack CI) |
| US-085 | Là **sale/CTV** (`sales_staff`, `collaborator`), tôi muốn giữ chỗ quá hạn mà chưa cọc được hệ thống tự xử lý theo chính sách BR-303 (mặc định tự hủy, mở lại phòng – INV quyết ESC-006 16/10) và báo cho tôi, để phòng không bị "treo" | Must | R2 | BL 5.5, BL 8.2 #19, BL 9 #11 | Đạt (stack CI) |
| US-086 | Là **sale / lễ tân** (`sales_staff`, `front_desk`), tôi muốn xác nhận đã nhận cọc/ký quỹ để đơn chuyển "đã xác nhận" và – với dài hạn – sinh hợp đồng có lịch thu theo kỳ đúng công thức, để không phải lập lịch thu bằng tay | Must | R2 (một phần; AC3 → R3 – INV quyết ESC-012 16/10 – R-C) | BL 3.18, BL 5.5, BL 8.2 #10 | Đạt (stack CI) |
| US-087 | Là **CTV** (`collaborator`), tôi muốn chỉ thấy báo giá, đơn, khách tiềm năng và hoa hồng của chính mình, để thông tin của người khác được bảo mật | Must | R2 | BL 2, BL 8.2 #27 | Đạt (stack CI) |
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
| US-139 | Là **lễ tân** (`front_desk`), tôi muốn đơn OTA trùng căn – đêm (nhập tay ở R2, về tự động ở R3 qua US-095) vẫn được nhận, gắn cờ xung đột, nằm ở làn "Chưa gán căn", báo đỏ ngay cho tôi và quản lý kèm gợi ý căn, để xử lý trước khi khách đến | Must | R2 | BR-312, BR-905; SM-01 mục 1.3; **bước 4: nâng từ R3** (FB-R1-BA-PO-01, QA #2); phần đơn về tự động vẫn R3 (US-095) | Đạt (stack CI) |

### EP13 – Báo cáo
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-100 | Là **chủ đầu tư** (`owner`), tôi muốn báo cáo vận hành theo tháng (công suất trừ phòng khóa, không tính giữ chỗ, ADR, RevPAR, thời gian ở trung bình theo kênh, cơ cấu ngắn/dài hạn), để quyết định giá và kênh | Must | R3 | BL 3.20, BL 5.11, BL 8.2 #8, #29; BR-215, BR-902; metrics R-01…R-07 | Mới |
| US-101 | Là **chủ đầu tư** (`owner`), tôi muốn báo cáo kênh bán (doanh thu, phí kênh, thực thu theo kênh), để biết kênh nào thực sự lời | Must | R3 | BL 5.11, BL 8.2 #11 | Mới |
| US-102 | Là **chủ đầu tư** (`owner`), tôi muốn báo cáo FOC theo tháng (tổng giá trị, số lần, lý do, người duyệt), để soát thất thoát | Must | R3 | BL 5.7 | Mới |
| US-103 | Là **chủ đầu tư** (`owner`), tôi muốn nhập chi phí vận hành trong app và xem lãi lỗ đơn giản (doanh thu, chi phí, GOP, GOPPAR), với doanh thu dài hạn ghi nhận theo quy ước của DATA, để biết lãi thật | Should | R3 | BL 5.11, BL 8.2 #22, BL 9 #26 | Mới |
| US-104 | Là **chủ đầu tư** (`owner`), tôi muốn xuất báo cáo **và dữ liệu theo kỳ** (đơn, đêm, doanh thu, folio, kênh, nguồn khách – dữ liệu khách đã che) ra file bảng tính, để gửi kế toán và tự phân tích *(mở rộng 17/10 – INV chọn A "rút dữ liệu về phân tích")* | **Must** *(17/10: Should → Must)* | R3 | BL 7; **decision-log INV 17/10 (phương án A)**; ESC-002 A; rbac A105; SR-INP-06, SR-AZ-10; TM-59; `metrics-definitions.md` | Mới – AC ở mục 4 "Story mới Must R3" |
| US-144 | Là **chủ đầu tư** (`owner`), tôi muốn chốt số liệu tháng (khóa số đã báo cáo, chỉ điều chỉnh bằng bút toán có ghi vết sang tháng sau), để báo cáo đã gửi kế toán không tự đổi | Could | R3 | Mới; `metrics-definitions.md` (MonthClose, ngày chốt 5), ERD; PO review DATA-02 | Mới |
| US-105 | Là **chủ đầu tư** (`owner`), tôi muốn nhập điểm đánh giá theo kênh và xem tổng hợp khen/chê, để cải thiện dịch vụ | Could | R3 | BL 3.20 | Mới |

### EP14 – App khách
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-106 | Là **khách** (`guest`), tôi muốn mở trang của đơn mình bằng link hoặc QR mà không cần cài app hay tạo tài khoản, để dùng ngay | Must | R2 | BL 3.21, BL 7 | Đạt (stack CI) |
| US-107 | Là **khách sắp đến** (`guest`), tôi muốn check-in online (tải giấy tờ từng người, giờ đến dự kiến, đồng ý lưu giấy tờ), để nhận phòng nhanh tại quầy | Must | R2 | BL 3.21, BL 5.12, BL 5.13 | Đạt (stack CI) |
| US-108 | Là **khách** (`guest`), tôi muốn xem thông tin lưu trú (ngày, giờ nhận/trả, Wi-Fi, mã cửa khi đến hạn, chỉ đường, nội quy và phí phạt), để không phải hỏi lễ tân | Must | R2 (một phần; phần mã cửa của AC2 → R3 – INV quyết ESC-012 16/10 – R-C) | BL 3.21, Brief 5 | Đạt (stack CI) |
| US-109 | Là **khách đang ở** (`guest`), tôi muốn gửi yêu cầu (dọn thêm, khăn/đồ dùng, báo hỏng, đặt xe/tour, trả muộn, khác) và thấy yêu cầu đã được nhận/xử lý, để yên tâm | Must | R2 | BL 5.19, Brief 5 (sự cố thường gặp) | Đạt (stack CI) |
| US-110 | Là **lễ tân / buồng phòng / kỹ thuật** (`front_desk`, `housekeeping`, `maintenance`), tôi muốn yêu cầu của khách tự vào đúng hàng việc (việc buồng phòng, phiếu sửa, việc lễ tân) và có báo mới, để phản hồi trong thời gian cam kết | Must | R2 | BL 5.19, BL 3.21 | Đạt (stack CI) |
| US-111 | Là **khách** (`guest`), tôi muốn xem folio/hóa đơn tạm tính của đơn (tiền phòng, phát sinh, đã trả, còn phải trả), để không bất ngờ khi trả phòng | Must | R3 (dời đầu R3 – INV quyết ESC-012 16/10 – R-C) | BL 3.21 | Dời |
| US-112 | Là **khách nước ngoài** (`guest`), tôi muốn chuyển trang của mình sang tiếng Anh, để hiểu mọi nội dung | Must | R2 | BL 1, DoD (VI + EN), decision-log P4 | Đang nghiệm thu |
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
| US-119 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn ghi nhận các lần thu tiền của một đơn (cọc, thu khi nhận, thu khi trả, theo kỳ) theo cách thanh toán (chuyển khoản, thẻ, tiền mặt, đã thu qua OTA), để số "còn phải thu" luôn đúng | Must | R2 (một phần; AC5 → R3 – INV quyết ESC-012 16/10 – R-C) | BL 3.7, BL 5.20 | Đạt (stack CI) |
| US-120 | Là **lễ tân** (`front_desk`), tôi muốn hiện mã VietQR đúng số tiền với nội dung chuyển khoản là mã bill/đơn, để khách chuyển đúng và dễ đối soát | Must | R2 | BL 3.8, BL 5.20, decision-log (VietQR) | Đạt (stack CI) |
| US-121 | Là **khách** (`guest`), tôi muốn thanh toán cọc/tiền phòng qua VNPay hoặc MoMo bằng link, để trả nhanh từ xa | Should | R3 | Brief 7 #4, BL 9 #20 | Mới |
| US-122 | Là **lễ tân** (`front_desk`), tôi muốn hóa đơn điện tử được phát hành qua MISA meInvoice khi thu tiền (khách lẻ hoặc công ty), để tuân thủ thuế | Must | R3 | BL 5.20, Brief 7 #3, BL 9 #16; BR-523, BR-524 | Mới |
| US-123 | Là **quản lý** (`manager`), tôi muốn ghi nhận hoàn cọc/hoàn tiền có lý do và người duyệt, để khớp sổ | Should | R3 | BL 9 #6, BL 8.2 #23 | Mới |
| US-145 | Là **lễ tân / quản lý** (`front_desk`, `manager`), tôi muốn có bảng dự phòng in sẵn mỗi sáng (khách đến/đi, căn, còn phải thu – không có số giấy tờ, mã cửa), hướng dẫn khi mất mạng/mất điện và được nhập bù giao dịch theo giờ thực tế kèm lý do khi có mạng lại, để quầy vẫn chạy và dữ liệu không sai khi sự cố | Should | R3 | Mới; UC-33; BR-961…964; FB-R1-DOM-BA-04 | Mới |
| US-124 | Là **lễ tân** (`front_desk`), tôi muốn **đóng ca / bàn giao ca**: tổng thu của ca theo cách thanh toán, tiền mặt đếm thực tế so với hệ thống (chênh phải có lý do), danh sách chuyển khoản ghi tay "chờ đối soát" để quản lý tick sau khi xem sao kê, và việc tồn (khai báo, khách chưa đến), để kiểm soát tiền mặt và chuyển khoản mỗi ca | Must | R3 | Mới; BR-521, rbac A44; BR-526, BR-527; UC-32; **bước 4: nâng từ Should, mở rộng** (FB-R1-DOM-PO-06) | Mới |

### EP16 – Giao tiếp với khách
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-125 | Là **lễ tân / sale** (`front_desk`, `sales_staff`), tôi muốn chọn mẫu tin nhắn theo tình huống (xác nhận đặt, link check-in, nhắc trả phòng, nội quy, xin lỗi sự cố nước nóng…) bằng Việt/Anh/Nga có sẵn dữ liệu đơn và sao chép được, để nhắn nhóm chat nhanh, đúng ngôn ngữ | Must | R3 (dời đầu R3 – INV quyết ESC-012 16/10 – R-C) | Brief 5, decision-log P4 | Dời |
| US-126 | Là **lễ tân** (`front_desk`), tôi muốn tin nhắn quan trọng (xác nhận, link check-in, nhắc trước ngày đến, nhắc trả phòng, bill) tự gửi qua Zalo OA/ZNS hoặc email, để không phải gửi tay | Should | R3 (Sprint 1 bản giả lập → Sprint 2 nối Zalo thật – INV chọn ESC-021 A 17/10; email độc lập với Zalo) | BL 7, BL 9 #19; tin nhắn INV 17/10; ESC-021 (mở lại phần Zalo của ESC-010); `integrations/zalo-oa.md`; SEC C-4…C-9 | Mới |
| US-161 | Là **lễ tân** (`front_desk`), tôi muốn Desk tự lập lịch tin cần gửi cho từng đơn (xác nhận, mời/nhắc check-in online, nhắc trước ngày đến, nhắc trả phòng, cảm ơn, nhắc kỳ thu dài hạn) và mỗi sáng hiện danh sách "Tin cần gửi hôm nay" soạn sẵn đúng ngôn ngữ để tôi bấm sao chép, để không quên nhắn khách kể cả khi chưa có Zalo OA | Must | R3 (Sprint 1) | Tin nhắn INV 17/10; DOM `guest-messaging-journey.md` TP-00…TP-15, BR-971…983 (dự thảo); US-125 (mẫu tin); SEC DOM-04, INT-09 | Mới |
| US-162 | Là **khách** (`guest`), tôi muốn nhận lời mời làm check-in online, lời nhắc nếu chưa làm, và tin nhắc trước ngày đến có giờ nhận phòng, địa chỉ, nút chỉ đường, chỗ đỗ xe, để đến nơi nhanh mà không phải hỏi | Must | R3 (Sprint 1 nội dung + gửi tay qua US-161; tự gửi khi US-126 bật) | Tin nhắn INV 17/10 ("remind ngày nhận phòng, gửi vị trí"); DOM TP-02, TP-03; US-107, US-108 (cùng nguồn địa chỉ với US-148) | Mới |
| US-163 | Là **lễ tân** (`front_desk`), tôi muốn đọc và trả lời tin Zalo OA của khách ngay trong Desk, gắn với đơn của khách, để không phải mở OA Manager riêng | Could | R4+ (sau ~1 tháng chat OA – ESC-021) | `integrations/zalo-oa.md` 4.9 giai đoạn 2; SEC INT-07 (webhook có chữ ký), INT-12 | Mới |
| US-127 | Là **chủ đầu tư** (`owner`), tôi muốn sửa nội dung các mẫu tin, để phù hợp giọng văn OTTIMO | Should | R3 | Mới; rbac A106 (`owner`, `manager`) | Mới |

### EP17 – Khóa cửa & thẻ phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-128 | Là **lễ tân** (`front_desk`), tôi muốn nhập mã cửa (và thời hạn hiệu lực) vào đơn, để khách thấy mã trong app từ ngày nhận phòng | Must | R3 (dời đầu R3 – INV quyết ESC-012 16/10 – R-C) | Brief 7 #3, decision-log (khóa thông minh) | Dời |
| US-129 | Là **lễ tân** (`front_desk`), tôi muốn ghi số thẻ phòng đã cấp/thu cho từng đơn và tự thêm phí khi thiếu thẻ lúc trả phòng, để không thất thoát thẻ | Should | R3 | Brief 5 (phí làm lại thẻ) | Mới |
| US-130 | Là **lễ tân** (`front_desk`), tôi muốn app tự tạo mã cửa có hạn (mã ngẫu nhiên 8 số – INV 19/10, R3-Q32) qua API hãng khóa, để không phải đặt mã trên app khóa riêng | Could | R4+ | Brief 7 #3 | Mới |

### EP18 – Đặt phòng trực tiếp trên web
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-131 | Là **khách** (`guest`), tôi muốn xem phòng trống và giá trực tiếp trên website OTTIMO rồi gửi yêu cầu giữ chỗ, để đặt mà không qua OTA | Should | R3 | BL 3.19 (kênh Website), BL 5.11 (giảm phí kênh); **FB-INV-001 (17/10):** chạy trên landing EP19 – là bản v2 của nút "Đặt phòng" (US-151), dùng chung hộp yêu cầu US-155; **ESC-020 L7-B** (INV chọn L7-A 17/10; làm B ở R3 cần INV quyết riêng – đổi L3-A vì hiện giá đêm, lịch còn/hết công khai theo SEC ARC-18; US-155 AC9) | Mới |
| US-132 | Là **khách** (`guest`), tôi muốn đặt và thanh toán ngay trên website mà không cần chờ xác nhận, để chốt nhanh | Could | R4+ | Mới; phụ thuộc BR-305, ESC-006 (chính sách hủy), ESC-010 (cổng thanh toán); **FB-INV-001:** đích cuối của nút "Đặt phòng" trên landing EP19 | Mới |

### EP19 – Landing page ottimo.vn (website giới thiệu công khai)
Nguồn chung: **FB-INV-001** (INV 17/10/2026 – "landing page kiểu ottimo.vn để khách tham khảo, tìm hiểu thông tin và đặt phòng"; quyết làm 17/10), câu phụ **ESC-020**; **FB-INV-002** (INV 17/10, góp ý bản mẫu v1.1: không nêu số phòng, định vị boutique stay, đặt phòng trực tiếp trên website → US-155 vào LP-v1, Zalo OA là kênh chat chính, link fanpage Facebook, bố cục gọn hơn). Phạm vi, khe ảnh, ước lượng: `rounds/round-02/outputs/PO/landing-scope.md`. Round **"R2 – LP-v1"** = đề xuất làm song song Sprint 4 bằng UXD + một luồng FE riêng, không tính vào cổng QC R2; nếu ORC xếp sang R3 thì đổi thành R3 (đầu round). Trang ở **tên miền gốc** (`hosting-plan.md` 5.1); app giữ desk./staff./g.

| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-146 | Là **khách tiềm năng**, tôi muốn mở ottimo.vn và thấy ngay OTTIMO là một **boutique stay** ở Đà Lạt (ảnh mặt tiền/sảnh, câu giới thiệu, ở đâu, hợp cả ở ngắn ngày lẫn ở dài ngày) cùng nút "Đặt phòng" luôn trong tầm tay, để quyết định có tìm hiểu tiếp không | Must | R2 – LP-v1 | FB-INV-001; **FB-INV-002 ý 2, 5**; Brief 1, 2; Brand Guidelines mục 1 | Sẵn sàng (LP-v1) – AC1–AC3 sửa, AC5–AC7 mới 17/10 chờ review BA, DOM |
| US-147 | Là **khách tiềm năng**, tôi muốn xem các hạng phòng của OTTIMO (4 hạng của e-brochure, ánh xạ 3 nhóm giá Lầu 1–2, Căn N, Căn N+) với ảnh, sức chứa, tiện nghi chính và giá ở dài ngày "từ … /tháng" (INV quyết ESC-020 L3-A 17/10) – trang **không** nêu số lượng phòng (FB-INV-002 ý 1), để chọn hạng phòng hợp với mình | Must | R2 – LP-v1 | FB-INV-001; **FB-INV-002 ý 1**; Brief 1; BL 4.1; BR-101, BR-110, BR-201, BR-203 | Sẵn sàng (LP-v1) – AC1, AC3 sửa, AC6 mới 17/10 chờ review BA, DOM |
| US-148 | Là **khách tiềm năng**, tôi muốn xem tiện nghi chung và vị trí (địa chỉ, bản đồ, khoảng cách tới các điểm chính, nút chỉ đường), để biết đi lại có tiện không | Must | R2 – LP-v1 | FB-INV-001; BL 3.21 (chỉ đường); US-108 AC1 (cùng nguồn địa chỉ) | Sẵn sàng (LP-v1) |
| US-149 | Là **khách tiềm năng**, tôi muốn đọc tóm tắt chính sách (giờ nhận/trả, cọc, hủy, nội quy và phí phạt, thuê tháng gồm những gì), để không bất ngờ khi đặt | Must | R2 – LP-v1 | FB-INV-001; BR-401, BR-305, BR-309, BR-511, BR-201…BR-205, BR-501; ESC-004…006 | Sẵn sàng (LP-v1) |
| US-150 | Là **khách tiềm năng**, tôi muốn xem câu hỏi thường gặp (đi từ sân bay, giữ hành lý, giặt ủi, thú cưng, hóa đơn, khai báo lưu trú, Wi-Fi/làm việc từ xa…), để tự có câu trả lời mà không phải nhắn | Should | R2 – LP-v1 | FB-INV-001; Brief 5 (câu hỏi thường gặp) | Sẵn sàng (LP-v1) |
| US-151 | Là **khách tiềm năng**, tôi muốn bấm "Chat Zalo" hoặc "Liên hệ" để nhắn OTTIMO qua **Zalo OA – kênh chính**, hoặc khi cần qua kênh khác (WhatsApp, Telegram, Viber), gọi điện, email hay fanpage Facebook, để hỏi phòng và đặt trực tiếp không qua OTA | Must | R2 – LP-v1 | FB-INV-001; **FB-INV-002 ý 4**; PRD G3 (kênh trực tiếp ≥ 35%); BR-112 (`directSource`); ESC-010; ESC-020 L2 (sửa 17/10); nút "Đặt phòng" → form US-155 (LP-v1), sau này US-131, US-132 | Sẵn sàng (LP-v1) – AC1, AC3, AC5 sửa, AC7–AC8 mới 17/10 chờ review BA, DOM |
| US-152 | Là **khách nước ngoài**, tôi muốn đọc trang bằng tiếng Anh (VI/EN ở v1; RU ở v2 – INV quyết ESC-020 L1-A 17/10), để hiểu mọi nội dung | Must | R2 – LP-v1 | FB-INV-001; DoD (VI + EN); PRD N1; content-guide mục 6 | Sẵn sàng (LP-v1) |
| US-153 | Là **chủ đầu tư** (`owner`), tôi muốn trang mang đúng nhận diện OTTIMO (kem – gỗ sồi, Lora + Be Vietnam Pro), mở nhanh trên điện thoại 4G, đọc được với người dùng bàn phím/trình đọc màn hình và không bao giờ vỡ khung khi thiếu ảnh, để khách có ấn tượng boutique ngay lần đầu | Must | R2 – LP-v1 | FB-INV-001; design-system D1; PRD N3, N9 | Sẵn sàng (LP-v1) |
| US-154 | Là **chủ đầu tư** (`owner`), tôi muốn trang tìm thấy được trên Google và hiện ảnh + tiêu đề đẹp khi gửi link qua Zalo/Facebook, để khách tự tìm đến kênh trực tiếp | Should | R2 – LP-v1 | FB-INV-001; PRD G3 | Sẵn sàng (LP-v1) |
| US-155 | Là **sale / lễ tân** (`sales_staff`, `front_desk`), tôi muốn nhận yêu cầu đặt phòng khách gửi từ website (kể cả khách bấm nút "Đặt ngay" trên fanpage Facebook) – ngày, hạng phòng, số khách, cách liên hệ, ngôn ngữ – vào một hàng chờ trong Desk với nguồn **website** và chuyển thành báo giá/giữ chỗ, để trả lời nhanh, không sót khách và đếm được khách đến từ website | Must | R2 – LP-v1 | FB-INV-001; **FB-INV-002 ý 3** (17/10 – trước đây Should R3); ESC-020 L7 = **A** (INV 17/10 – FB-INV-002 "Xác nhận của INV"); ADR-014 4.3–4.6 (nấc L1); US-080, US-084; BR-112 (`website`), BR-911…916; SEC C-1…C-3, C-11…C-13 (`landing-booking-SEC.md`); ESC-001 LZ-2, LZ-8; đặc tả BA `specs/EP19-website-requests.md`, SM-18 | Mới (LP-v1) – BA, DOM, SEC đã review 17/10; AC1, AC2, AC7, AC9 sửa 17/10; còn Q-W05, Q-W07, Q-W09, Q-W11 |
| US-156 | Là **khách nói tiếng Nga**, tôi muốn đọc landing bằng tiếng Nga đã được người bản ngữ duyệt, để yên tâm đặt thuê dài hạn | Should | R3 (v2 – INV quyết ESC-020 L1-A 17/10: tiếng Nga không có ở v1) | FB-INV-001; Brief 1, 5; US-115; content-guide mục 6 | Mới |
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
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC2 (TT `minibar-catalog-s4-bed` + E2E-UI TC-RB-003/017), AC4 (TT – KPI không có trường tiền, FD không nhận `foc_threshold`; R2 FD không mở Tổng quan) đạt → **Đạt (stack tạm)**.
- AC1: Given tài khoản `sales_staff` hoặc `collaborator`, When mở hồ sơ một khách đã có giấy tờ (giao diện hoặc API), Then phản hồi không chứa loại giấy tờ, số giấy tờ (kể cả dạng che) hay ảnh (D03–D07 = K; khắc phục BL 8.2 #27, rbac M1).
- AC2: Given tài khoản `housekeeping`, When xem minibar hoặc kho, Then thấy số lượng, mức chuẩn, món thiếu nhưng không có giá vốn, giá trị tồn, thành tiền (rbac M3).
- AC3: Given tài khoản `sales_staff`, `collaborator` hoặc `housekeeping`, When mở P&L (S21) hoặc báo cáo kênh (S20), Then không có menu và truy cập trực tiếp bị từ chối (rbac M2). Ở R2 hai màn này chưa có (R3), nên R2 chỉ kiểm việc bị từ chối truy cập đường dẫn/API.
- AC4: Given tài khoản `front_desk`, When mở Tổng quan, Then không thấy doanh thu tháng, ADR, RevPAR và cảnh báo FOC (rbac ghi chú 1).

#### US-004 – Danh mục căn
> Nghiệm thu S1 (16/10): AC3 đạt; AC1, AC2 thiếu bằng chứng (TC-NT-018/019 còn `skip` dù endpoint đã có – QA bỏ skip tuần 1 Sprint 3). Hạ sức chứa dưới đơn tương lai: QC-S2-01/ĐK-S2-2 (Sprint 3 tuần 1).
> Nghiệm thu S3 (17/10): AC1, AC2 đạt (TC-NT-018/019); hạ sức chứa dưới đơn tương lai đạt (BUG-R2-025 Closed) → **Đạt (stack tạm)**.
> **Sprint 4 (PO 17/10 – S4-49, S4-52; BR-012 v0.3.5 của DOM):**
> - Mỗi căn có thêm **tên phòng** và **hạng phòng công khai**: khách chỉ thấy tên phòng; màn nhân viên hiện "401 · The Pine"; khai báo lưu trú ghi số căn.
> - ARC chọn tên trường trong 0.3.7.
> - Tới khi INV gửi bảng ghép (hẹn 19/10), dùng **ánh xạ tạm của prototype (BL 4.1)** như BR-012 (6): 101 The Amber … 402 The Ember `[GIẢ ĐỊNH – chờ INV xác nhận]`. Đổi ánh xạ chỉ sửa cấu hình căn, không sửa đơn (sprint-4-plan P-S4-8).
> - Story giữ **Đạt (stack tạm)**. Phần này nghiệm thu cùng S4-49; không thêm số AC.
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
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1 điều chỉnh dòng trên Desk (S4-27): có mã + vitest, **chờ ca UI** (U5).
- AC1: Given đơn có folio `open`, When `front_desk` thêm hoặc điều chỉnh một dòng phát sinh, Then nhật ký ghi người, thời điểm, giá trị trước/sau, lý do; không có thao tác xóa dòng – sửa sai bằng bút toán điều chỉnh (BR-008).
- AC2: Given `owner` mở nhật ký (S27), When lọc theo ngày và người làm, Then thấy đúng các thao tác tiền (folio, giảm giá, FOC, hủy, thu, hoàn) trong khoảng đó; `front_desk` chỉ thấy nhật ký của chính mình.

#### US-007 – Phê duyệt FOC/giảm giá (UC-27, SM-10)
> Nghiệm thu S1 (16/10): nền duyệt đạt (TC-NT-027); AC1–AC6 nghiệm thu đủ ở **Sprint 3** (cần `requestFoc` + folio + trả phòng).
> Nghiệm thu S3 (17/10): AC2–AC5 đạt. AC1, AC6: API đạt (TC-NT-027, TC-NT-032); Desk chỉ xin FOC được ở bước nhận phòng – xin FOC cho trả muộn, dòng phát sinh, bước 2 trả phòng và lễ tân tự áp FOC minibar → **Sprint 4** (S4-25*, cần cho luồng A1 của QC). Báo cáo đóng ca: R3 (US-124).
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1 (E2E-UI TC-X-071, TC-L4-099, TC-L3-083) và AC6 (E2E-UI TC-NT-053, TC-L4-126) đạt **(G1)**. Lên Đạt (stack tạm) khi kiểm lại S4-38 lần 6 có 0 ca lệch.
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
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1 phần phiếu sửa `done` đạt (E2E-UI TC-L6-045). AC3 vẫn chờ kiểm tay trình đọc màn hình trên staging.
> **Chấm lại 21/10 (R-1, `21bb797`):** Đang nghiệm thu – AC3 vẫn chờ kiểm tay bằng trình đọc màn hình trên staging.
- AC1: Given một trong các hành động: hủy giữ chỗ/hủy đơn, đánh dấu no-show, hoàn tất trả phòng, đóng/mở bán kênh, gộp hồ sơ khách, chuyển phiếu sửa sang `done` (mở khóa phòng), xóa sớm ảnh giấy tờ, When người dùng bấm, Then hiện hộp xác nhận nêu hậu quả cụ thể (ví dụ "Căn 203 sẽ mở bán lại 19–22/10 trên mọi kênh") và nút xác nhận ghi đúng tên hành động.
- AC2: Given hộp xác nhận đang mở, When bấm Hủy hoặc phím Esc, Then không có dữ liệu nào thay đổi.
- AC3: Given người dùng bàn phím hoặc trình đọc màn hình, Then thao tác được hộp xác nhận và nghe được nội dung hậu quả (WCAG 2.2 AA – decision-log UXR).

### EP01 – Tổng quan

#### US-010 – KPI đêm nay
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC3 đạt (TT `dashboard-s4-bed`). AC1, AC2: server đạt, **chờ ca UI** H03 (U1) và DATA đối chiếu A7 trên DS-0.
> **Chấm lại 21/10 (R-1, `21bb797`):** Đang nghiệm thu – AC1, AC2 vẫn **chờ ca UI**: TC-X-078/TC-X-073 có mở H03/H24 nhưng không kiểm số KPI, chú thích mẫu số, và KPI đổi khi dữ liệu đổi. DATA A7 114/114 đã khớp.
- AC1: Given 10 căn, trong đó 6 căn có đơn `confirmed`/`in_house` phủ đêm nay, 1 căn có khối OOO `active`, 1 căn chỉ có đơn `hold`, When mở Tổng quan, Then công suất đêm nay = 6/9 theo công thức `metrics-definitions.md` (đêm khả dụng trừ OOO – BR-804; `hold` không là đêm bán – BR-904) và có chú thích mẫu số (khắc phục BL 8.2 #8, #29).
- AC2: Given dữ liệu đơn thay đổi, When tải lại Tổng quan, Then KPI thay đổi theo; không còn số cố định trong giao diện (BL 8.2 #28).
- AC3 *(bước 4)*: Given lúc 02:00 ngày 21/10, When mở Tổng quan, Then "đêm nay" là đêm 20/10 đang diễn ra (ngày nghiệp vụ – BR-010), không phải đêm 21/10.

#### US-011 – Khách đến/đi hôm nay (BR-404)
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1–AC3: server đạt (TT, `allowedActions`), **chờ ca UI** H03 (U1).
- AC1: Given hôm nay có 1 đơn `cancelled` và 1 đơn `no_show` có ngày đến hôm nay, When mở "Khách đến", Then hai đơn đó không xuất hiện; đơn `hold` có ngày đến hôm nay chỉ nằm ở mục riêng "Giữ chỗ chưa cọc" (BL 8.2 #7).
- AC2: Given đơn `confirmed` đến hôm nay, Then dòng có nút "Nhận phòng"; đơn `in_house` có ngày đi hôm nay có nút "Trả phòng"; đơn đã chuyển trạng thái hiện chip "Đã nhận"/"Đã trả".
- AC3 *(bước 4 – FB-R1-DOM-PO-04)*: Given đơn `confirmed` ngày đến 20/10, When 01:30 ngày 21/10 mở "Khách đến", Then đơn vẫn hiện và nút "Nhận phòng" dùng được (ngày nghiệp vụ vẫn là 20/10 – BR-010).

#### US-012 – Cần chú ý (BR-907)
> Sprint 3–4 (PO 17/10, BUG-R2-034): nguồn dữ liệu cho AC1 (khai báo) và AC3 (thị thực) làm ở **Sprint 3** cùng EP06; màn/khung "Cần chú ý" trên Tổng quan và nghiệm thu US-012 ở **Sprint 4**.
> **Sprint 4 – thay đổi sau đóng băng (PO 17/10, `sprint-4-plan.md` 16.3 b):** AC7 dòng "khách quen/VIP đến hôm nay" nghiệm thu R2 theo **người đứng tên** (nhóm VIP/Khách quen, hoặc đã từng ở và trả phòng – BR-956 (2), BE-D đã làm). Người đi cùng mang nhóm VIP/Khách quen (DOM-S4-11 phần 2, NÊN) → **R3 Sprint 1** cùng US-075, cần ARC duyệt cho module `reporting` đọc bảng người đi cùng.
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC6, AC7 (phần khách quen/VIP – người đứng tên), AC8 đạt (TT). AC1, AC3, AC4, AC5 **chờ ca UI** H03 (U1). **AC7 dòng "Đồng bộ kênh lỗi" [Dời R3 – PO 18/10, P-S4-14]**: làm cùng US-096 và job J18 (mục 5.5 R3-Q12); R2 không có kết nối kênh thật (adapter Mock) nên không có lỗi đồng bộ thật để báo; lễ tân đóng bán thủ công trên extranet như hiện nay. TC-L8-012 ở R2 chỉ kiểm phần VIP.
> **Chấm lại 21/10 (R-1, `21bb797`):** Đang nghiệm thu – AC1 chưa chắc chạy (TC-X-078 bấm mở H14 nằm trong nhánh có điều kiện); AC3 (thị thực), AC4 (giữ chỗ sắp hết hạn, căn khóa) và AC5 (trạng thái rỗng) chưa có ca UI. AC4 phần phiếu Gấp đạt.
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
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1 (E2E-UI TC-L2-001), AC2 (TC-L2-002 + axe H08 sáng/tối trên token v0.4.1) đạt. AC3 **chờ ca UI** bấm thanh đơn bằng chuột và bàn phím (U6).
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
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** Form khối OOO trên Desk/PWA (E2E-UI TC-L6-040, TC-X-072) và AC2 phần Tổng quan + đêm khả dụng (TT `dashboard-s4-bed`) đạt → **Đạt (stack tạm)**. Khóa có kế hoạch (Đổi ngày mở bán, Hủy khóa, Mở khóa sớm) chưa có ca UI – QA bổ sung, không thuộc chữ AC.
- AC1: Given căn 401 có khối OOO `planned` hoặc `active` 15–17/10, When tạo đơn, giữ chỗ hoặc báo giá căn 401 cho đêm 16/10, Then bị chặn với lý do "Phòng đang khóa".
- AC2: Given căn đang khóa, Then rack hiện thanh "Khóa phòng"; phòng trống trên Tổng quan/báo giá và đêm khả dụng không tính căn này trong các đêm khóa (BR-904).

#### US-020 – Chi tiết đơn
> Nghiệm thu S2 (16/10) – **phần dời:** xem folio đầy đủ (dòng phát sinh, giao dịch) trên chi tiết đơn → **Sprint 3** (cùng folio/bill); AC2 nút "Trả phòng"/"Xem bill" → **Sprint 3** (cần nhận/trả phòng). AC1, AC3, AC4 đạt.
> Nghiệm thu S3 (17/10): xem folio đầy đủ trên chi tiết đơn và nút "Trả phòng" đạt; **"Xem bill" cho đơn `checked_out`** (mở lại bill đã chốt, in lại) chưa có → **Sprint 4** (S4-29*).
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC2 "Xem bill" đơn `checked_out` (S4-29): **chờ ca UI** (U5).
- AC1: Given đơn `hold`, When mở chi tiết, Then thấy tiến trình đúng loại đơn (ngắn ngày/dài hạn – BL 3.4) và chỉ các nút hợp lệ: "Xác nhận cọc" (FD+, `sales_staff` – A04), "Gia hạn giữ chỗ" (nếu chưa gia hạn – B3), "Hủy giữ chỗ"; `collaborator` thấy "Báo đã chuyển cọc" thay cho "Xác nhận cọc" (A53).
- AC2: Given đơn `in_house` có ngày đi hôm nay, Then có nút "Trả phòng"; đơn `checked_out` chỉ có "Xem bill"; đơn `cancelled`/`no_show` không có nút thay đổi, trừ "Khôi phục no-show" cho `manager`/`owner` (B12) và cho `front_desk`/`front_desk_lead` theo US-136 AC4–AC5 (tự khôi phục khi đủ 3 điều kiện BR-315, ngoài ra "Gửi yêu cầu khôi phục").
- AC3: Given `collaborator`, When mở đơn không do mình chốt, Then bị từ chối; với đơn của mình chỉ thấy tổng tiền phòng và cọc (rbac ghi chú 4).
- AC4: Given gọi API một chuyển không hợp lệ với trạng thái hiện tại (ví dụ nhận phòng đơn `hold`), Then bị từ chối (state-machines 0.2).

#### US-021 – Hủy đơn / hủy giữ chỗ (UC-05, B5, B10)
> Nghiệm thu S2 (16/10): AC1–AC3 đạt; AC4 phần **chi tiền hoàn** (`refund`) → **Sprint 3**; AC5 dời ngày đã có API nhưng thiếu ca E2E (QA bổ sung S3); AC6 kiểm khi có nhận phòng (**Sprint 3**).
> Nghiệm thu S3 (17/10): AC4 chi tiền hoàn (TC-L4-062, tách nhiệm), AC5 (TC-L2-055), AC6 đạt → **Đạt (stack tạm)**. Quy tắc mới áp Sprint 4: S4-06, S4-08.
> **Sprint 4 – thay đổi sau đóng băng (PO 17/10, `sprint-4-plan.md` 16.3 a):** DOM-S4-17 – thao tác "khách để lại" tiền dư cho **đơn đã đóng** (`cancelled`/`no_show`, mục `closed_reservation_credit` – S4-06), chỉ MGR+, có bằng chứng khách đồng ý (BR-522 v0.3.8) → **R3 Sprint 1**, phải xong trước RC; PO viết AC khi lập `round-03/plan.md`. Tới đó mục "Cần chú ý" giữ mở tới khi chi hoàn đủ; khách muốn để lại thì MGR ghi chú trên đơn.
> **R3 (PO 18/10 – backlog mục 5.5):** R3-Q01 "OTTIMO hủy đơn vì lỗi của cơ sở → hoàn đủ cọc, không phí" (BR-309-18; R2 tạm: MGR miễn qua đường duyệt BR-433); R3-Q02 K11-06 hướng (b): ghi dòng vào folio đơn đã đóng thì chạy lại `refundPlan` (R2 dùng hướng (a): `addFolioLine` trả 409 với mọi vai – DOM 18/10). PO viết AC khi lập `round-03/plan.md`.
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
> **ESC-019 = A (INV 17/10 – "yes, tất nhiên"):** khách **tự xin** đổi sang căn khác trước ngày đến thì tính theo giá căn mới, giống đổi phòng khi đang ở (BR-424). Đổi do OTTIMO vẫn giữ giá. Thêm **AC5–AC7**, Must R2, **Sprint 4 – S4-21** (cổng QC Sprint 4). AC1 giữ nguyên cho đổi do OTTIMO, lý do `other` và đổi ngày. Quy tắc theo **BR-429 v0.3.5 (a)–(f)** DOM ghi 17/10 (cùng BR-106, BR-424, BR-434, tham số `room_move_pricing`); số ở AC5–AC7 là ví dụ của BR đó. Phần FOC trên đêm đổi giá làm sau S4-02 (BR-434 lấy số đã duyệt). QA viết TC cho AC5–AC7 **cùng commit** với backlog để `gen_traceability.py --strict` không đỏ.
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC5–AC7 đạt **(G1)** (E2E-UI TC-L2-097 (a)–(d); E2E qua `previewThenMove()`). AC4 nhánh `ROOM_NOT_READY` **chưa** có ca (S4-33, TC-L2-068 – tuần Ổn định). `swapRoom` trên Desk cùng `previewSwapRoom` → R3 (mục 5.5 R3-Q04).
- AC1: Given đơn `confirmed`, When `front_desk` đổi sang căn khác hoặc khoảng ngày khác kèm lý do, Then kiểm trùng ở server (BR-906), giá các đêm không đổi giữ snapshot (BR-006), có lệnh đồng bộ; với đơn OTA chỉ đổi được căn nội bộ, không đổi ngày (B7). *(17/10 – ESC-019)* Giữ snapshot áp cho đổi do OTTIMO (AC6) và đổi ngày; khách tự xin đổi **căn** thì theo AC5 (đơn Trực tiếp/CTV) hoặc AC7 (đơn OTA).
- AC2: Given đơn `in_house` đổi phòng với lý do "sự cố OTTIMO", Then giữ giá cũ; với lý do "khách yêu cầu", Then giá căn mới tính từ đêm đổi (BR-424).
- AC3: Given đổi phòng xong, Then căn cũ → `VD`/`OD` kèm việc dọn, mã cửa cũ hiển thị "đã hủy" và yêu cầu nhập mã mới (BR-403), khai báo không phải khai lại (BR-424).
- AC4: Given **đổi phòng khách đang ở** (B14) mà căn mới không ở `VI`/`VC`, Then bị chặn; Given đổi căn cho **đơn tương lai** (B7), Then chỉ kiểm trùng và khối OOO trong khoảng ngày của đơn, không đòi căn đang sạch; mọi trường hợp: có khối OOO trùng hoặc thiếu lý do → bị chặn (FB-R1-DOM-PO-11).
- AC5 *(ESC-019 A – INV 17/10, S4-21)*: Given đơn **Trực tiếp** căn 101, 3 đêm thường 10–13/11 × 667.000 = 2.001.000, đã cọc 600.000, chưa nhận phòng, When FD+ đổi sang căn 401 bằng B7 với lý do `guest_request` (khách tự xin – BR-429 v0.3.5 (a), (d), (e)), Then:
  - **trước khi lưu**, Desk hiện bản tính thử: từng đêm giá cũ → giá mới theo lịch giá hiện hành của căn mới (BR-104, giá Trực tiếp/CTV), đã áp lại giảm theo số đêm (BR-107) và mã khách quay lại (BR-111) nếu đơn có; tổng chênh lệch; cọc đã thu; còn phải thu mới;
  - ô "Đã báo khách số tiền mới" **bắt buộc tick** mới lưu được (như BR-414); khách không đồng ý thì không lưu;
  - lưu xong, tổng = **3.126.000**, cọc giữ 600.000 (không đòi cọc bổ sung), còn phải thu khi nhận phòng **2.526.000**;
  - dòng tiền phòng được đảo và ghi lại; nhật ký tiền ghi giá trị cũ/mới, lý do, người làm (BR-008);
  - tính **hai chiều**: đơn 401 cùng ngày (3.126.000, cọc 900.000) xin xuống 101 → **2.001.000**, còn thu **1.101.000**; tổng mới thấp hơn số đã thu thì phần thừa theo BR-522; đổi về lại căn cũ cũng lấy giá hiện hành;
  - đơn 7 đêm căn 202 (5.205.000) xin sang 302 → **6.025.000**;
  - phụ thu người theo định mức căn mới (BR-429); FOC/giảm giá đặc biệt đã duyệt trên đêm đổi giá = min(số đã duyệt, giá mới), không duyệt lại (BR-434); hoa hồng theo tiền phòng mới (BR-903);
  - OTTIMO muốn tặng phần chênh cho khách đã xin đổi: vẫn chọn `guest_request`, phần chênh đi **giảm giá đặc biệt có duyệt** (BR-431…BR-433, vào báo cáo FOC); không được chọn `upgrade` để né giá;
  - chỉ đổi ngày, giữ căn: như AC1;
  - mọi số khớp ví dụ BR-429 / BR-106 v0.3.5 trong `br-examples.json`.
- AC6 *(ESC-019 A)*: Given đổi căn trước ngày đến **do OTTIMO** (lý do `property_fault`, `overbooking`, `upgrade`, `inventory_optimize`, gán căn cho đơn xung đột B7a) hoặc lý do `other` (BR-429 v0.3.5 (b)), Then:
  - giữ nguyên mọi dòng: giá từng đêm đã chốt (BR-106) và dòng chênh lệch OTA đã ghi; không thu thêm, không giảm. Dữ liệu thử: đơn 202, 10–13/11 × 792.000, bình nóng lạnh hỏng → dời 401 (`property_fault`) → vẫn **2.376.000**;
  - phụ thu người mỗi đêm = min(cũ, theo căn mới) (BR-429), khách không bao giờ trả thêm vì OTTIMO đổi căn;
  - bản tính thử vẫn hiện, chênh lệch 0;
  - `upgrade`, và `other` sang căn có giá hiện hành cao hơn, chỉ **lễ tân trưởng trở lên** làm được; `inventory_optimize` chỉ khi chưa báo căn cho khách; `front_desk` bị server từ chối và ghi nhật ký;
  - lý do và người làm có trong nhật ký.
- AC7 *(ESC-019 A – đơn OTA)*: Given đơn **Agoda** nhóm Lầu 1–2 tự gán căn 203, 2 đêm thường 10–12/11, chưa nhận phòng; trước ngày đến khách nhắn OTTIMO xin sang 401 (`guest_request` – BR-429 v0.3.5 (c), BR-424), Then:
  - giá OTA và "Đã thu qua OTA" (BR-307) giữ nguyên;
  - mỗi đêm có dòng chênh lệch = max(0, giá Trực tiếp hiện hành căn mới − giá Trực tiếp hiện hành **căn gốc**) → **500.000**. Dòng này là doanh thu phòng (BR-904), thu tại quầy muộn nhất khi nhận phòng;
  - căn gốc = căn gán đầu tiên, không tính nâng hạng do OTTIMO (BR-424);
  - Desk hiện số chênh lệch và ô "Đã báo khách" trước khi lưu, như AC5;
  - khách xin tiếp sang 302: đảo 500.000, ghi **250.000** (không cộng dồn); xin xuống 101 → **0**, không hoàn tiền OTA đã thu (như S4-05);
  - khách đã nhận phòng rồi đổi phòng (B14): chênh lệch vẫn so với cùng căn gốc;
  - **OTA sửa đơn** đổi loại phòng trên kênh → theo giá OTA mới, chênh lệch tại quầy 0 (R2: hủy `ota_cancelled` phạt 0 rồi tạo lại – BR-429);
  - lý do do OTTIMO → không có dòng chênh lệch.

#### US-136 – Đánh dấu no-show (UC-05, B11, B12, BR-311) – *mới*
> Nghiệm thu S2 (16/10) – **phần dời:** AC1 nhắc gọi khách (J6/J7) → **Sprint 4**; AC2 việc "Báo no-show trên kênh" cho đơn OTA và AC4 thông báo cho `manager` → **Sprint 4** (cùng "Cần chú ý"/thông báo); AC4 dòng trong đóng ca → R3 (US-124). AC3, AC5 và phần chính AC2, AC4 đạt.
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1, AC2 (việc "Báo no-show trên kênh"), AC4 (thông báo MGR) đạt (TT `dashboard-s4-bed`, E2E TC-L2-070). Giữ Đang nghiệm thu chờ G1 (tiền no-show BR-311, B12 trong phạm vi S4-38).
- AC1: Given đơn `confirmed` đến hôm nay chưa nhận phòng và không có giờ đến dự kiến, When qua mốc gọi khách của BR-311, Then `front_desk` nhận nhắc gọi/nhắn khách.
- AC2: Given đã qua mốc đánh dấu của BR-311 và đã ghi kết quả liên lạc, When `front_desk` bấm "No-show" và xác nhận (US-135), Then đơn `no_show`; đơn trực tiếp giữ cọc theo BR-311 (ghi "doanh thu khác" – BR-904); các đêm còn lại mở bán + đồng bộ; khai báo → `void`; hoa hồng → `void`; đơn OTA có việc "Báo no-show trên kênh". Hệ thống **không bao giờ** tự đánh dấu.
- AC3: Given chưa ghi kết quả liên lạc hoặc chưa qua mốc đánh dấu, Then nút "No-show" bị khóa.
- AC4 *(bước 4 – theo BR-315, state-machines v0.2 B12)*: Given đơn `no_show`, khách đến muộn **còn trong ngày nghiệp vụ** của đêm đến (trước 06:00 hôm sau – BR-010), căn của đơn vẫn trống/chưa bán lại/không phải đổi căn, và không phát sinh hoàn tiền hay đổi giá, When `front_desk`/`front_desk_lead` bấm "Khôi phục no-show" kèm lý do, Then đơn về `confirmed`, đóng lại phòng, **bản ghi khai báo của đơn được dùng lại** và chuyển `void` → `none` (SM-05 K12; giữ ràng buộc một bản ghi khai báo/đơn – ERD 4.7, UK `registration.reservation_id`; **không** sinh bản ghi khai báo mới), ảnh giấy tờ đã xóa theo K11 **không** khôi phục – khách/lễ tân nộp lại, `manager` nhận thông báo, lần khôi phục hiện trong đóng ca (BR-526). *(Sửa BUG-R1-002, 16/10)*
- AC5 *(bước 4)*: Given thiếu một trong 3 điều kiện ở AC4 (căn đã bán lại, phải đổi căn, có tiền ra, đã qua ngày nghiệp vụ) hoặc đơn OTA **đã báo no-show lên kênh**, Then `front_desk` chỉ gửi được yêu cầu duyệt; `manager`/`owner` duyệt (đơn OTA kèm việc "Báo kênh hủy no-show").

### EP03 – Nhận phòng

#### US-025 – Nhận phòng (UC-11, B9, BR-402)
> Sprint 3 (PO 17/10, BUG-R2-034): AC4 "đơn vào Cần chú ý" = nguồn API `registration_due`/`registration_overdue` làm **trong Sprint 3** (nghiệm thu qua `GET /attention`); khung hiển thị trên Tổng quan nghiệm thu ở Sprint 4 (US-012).
> Nghiệm thu S3 (17/10): AC1, AC2, AC4–AC7 đạt (AC4 nghiệm thu qua `GET /attention`). AC3 một phần: điều kiện "đã thu đủ" chưa cộng phụ thu nhận sớm/đêm B9a (BUG-R2-038) → **Sprint 4** (S4-10, OpenAPI 0.3.7); B18 vẫn chặn khi còn nợ. Mã cửa: R3.
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC3 đạt **(G1)** (E2E-UI TC-L3-079 (a)(b); E2E TC-L3-011 (c), 078, 081, 082; BUG-R2-038 Closed).
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
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC4 đạt (TT S4-31, E2E TC-L4-004). Giữ Đang nghiệm thu chờ G1 (giá đêm B13 – BUG-R2-160…162 chờ kiểm lại lần 6).
- AC1: Given căn 201 còn trống 3 đêm liên tiếp sau ngày đi, When mở gia hạn, Then chọn được tối đa min(3, giới hạn BR-421) đêm, mỗi đêm hiện "Trống"; muốn vượt giới hạn → được hướng sang báo giá dài hạn (BR-108).
- AC2: Given đơn trực tiếp giá 700.000, When gia hạn 2 đêm ngày thường, Then giá khớp ví dụ BR-421 (giữ giá của đơn); đêm rơi vào ngày đặc biệt của BR-104 lấy giá ngày đó.
- AC3: Given đơn Booking.com/Agoda, When gia hạn 1 đêm, Then tạo đơn con kênh Trực tiếp liên kết đơn gốc (BR-422) với giá trực tiếp hiện hành, folio chung, đơn OTA gốc không đổi; thông báo "tiết kiệm phí kênh" lấy tỷ lệ từ cấu hình kênh BR-901.
- AC4: Given gia hạn thành công, Then ngày đi được cập nhật, buồng → `OD` (BR-802), việc "Dọn trả phòng" đổi thành "Dọn phòng khách đang ở", có lệnh đồng bộ, khai báo của khách NN → `needs_update` (BR-604) và hạn thu tiền gia hạn theo BR-423.
- AC5: Given hai người cùng gia hạn và tạo đơn mới vào cùng đêm, Then chỉ một thao tác thành công (US-018).

#### US-029 – Trả muộn (B15, BR-412, BR-414, BR-416)
> Nghiệm thu S3 (17/10): AC1–AC3 đạt; AC4 phần việc dọn "dọn sau giờ trả" → **Sprint 4** (S4-31*); hiệu lực mã cửa: R3.
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC4 đạt (TT: việc `checkout_clean` mang giờ trả đã chốt). Giữ Đang nghiệm thu chờ G1 (phụ thu trả muộn trong phạm vi S4-38).
- AC1: Given đơn có giá đêm cuối 700.000, When đặt trả muộn 15:00, Then phụ thu đề xuất khớp ví dụ BR-412 (đã tính tham số ân hạn – INV quyết ESC-007 16/10), hiện trước khi lưu và chỉ ghi folio khi lễ tân xác nhận (BR-414).
- AC2: Given căn có khách đến cùng ngày và không còn căn thay thế cùng nhóm, Then `front_desk` bị chặn, chỉ `manager`/`owner` duyệt được (BR-416, A16); Given còn căn thay thế, Then hiện cảnh báo nêu tên khách đến và giờ đến dự kiến.
- AC3: Given giờ trả sau mốc tính tròn 1 đêm của BR-412, Then hệ thống chuyển sang luồng gia hạn 1 đêm (BR-416, US-028).
- AC4: Given lưu trả muộn, Then việc dọn của căn ghi "dọn sau <giờ trả>", hiệu lực mã cửa kéo dài tới giờ trả muộn (BR-403), nhật ký nhắc ghi giờ trả đã chốt.

#### US-030 – Xác nhận giờ trả (UC-14)
> Nghiệm thu S3 (17/10): AC1 đạt; AC2 trạng thái "đã trả lời" đạt ở API, thẻ trên màn Hôm nay → **Sprint 4** (S4-31*, cùng US-011).
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC2: server đạt (E2E TC-L4-021 `reminderState = replied`), **chờ ca UI** chip trên H03 (U1).
- AC1: Given khách trả lời qua điện thoại, When lễ tân chọn giờ 11:00 và ghi chú, Then nhật ký nhắc của đơn có dòng "Gọi điện – khách trả lúc 11:00" với người ghi và thời điểm.
- AC2: Given giờ trả đã được xác nhận, Then thẻ "khách trả phòng hôm nay" của đơn đó chuyển sang trạng thái "đã trả lời".

#### US-031 – Thẻ khách trả phòng hôm nay chưa trả (BR-425)
> Nghiệm thu S3 (17/10): AC1 trạng thái theo từng mốc BR-425 đạt (tính lúc đọc); thẻ + báo đỏ FD/MGR và AC2 (xếp đầu khi có khách đến) → **Sprint 4** (S4-31*, cùng US-011). Gửi nhắc tự động cho khách là US-034 (R3).
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC2 đạt (TT, E2E TC-L4-023 – thứ tự thẻ). AC1 phần R2 = thẻ "Quá giờ trả phòng" màu đỏ, có chữ, xếp đầu trên Hôm nay của FD/FDL và MGR – **chờ ca UI** (U1). **AC1 phần thông báo chủ động J4 (FD + MGR lúc 12:00/12:31 theo BR-425) [Dời R3 – PO 18/10, P-S4-15]**: làm cùng US-034/US-161 (mục 5.5 R3-Q13); R2 push là Mock; vận hành tạm: lễ tân gọi quản lý khi thẻ đỏ có khách đến cùng căn.
- AC1: Given đơn `in_house` có ngày đi hôm nay, khách chưa trả lời, When đồng hồ đi qua từng mốc của BR-425, Then trạng thái thẻ đổi đúng thứ tự "Đã nhắc, chờ khách trả lời" → "Chưa trả lời – lễ tân gọi xác nhận" → "Quá giờ trả phòng" (báo đỏ `front_desk` + `manager`); kiểm ở thời điểm ngay trước và ngay sau mỗi mốc, giờ VN (BR-001).
- AC2: Given căn đó có khách đến trong ngày, Then thẻ được xếp lên đầu.

#### US-032 – Dòng phát sinh / phí phạt (UC-17, BR-511, BR-512)
> Nghiệm thu S3 (17/10): AC2–AC4 đạt (app khách: R3). AC1 đạt trừ **sửa số lượng dòng đã ghi** (điều chỉnh dòng) – Desk chưa có nút → **Sprint 4** (S4-27*).
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1 sửa số lượng dòng đã ghi (S4-27): **chờ ca UI** (U5).
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
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC2 (S4-27), AC3 "Ghi công nợ" (S4-26): có mã + vitest, **chờ ca UI** (U5).
> **Chấm lại 21/10 (R-1, `21bb797`):** Đang nghiệm thu – AC3 đạt (TC-L4-142). AC2 (sau `settled`: FD không sửa được, MGR/OWN tạo bút toán điều chỉnh) chưa có ca UI. Ghi chú: BUG-R2-208 (P2, R3-Q19) chạm đường A32 khi còn chu kỳ nợ.
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
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC3 đạt (E2E TC-L3-032 (a)(b), TT `guest-document-profiles`). Giữ Đang nghiệm thu chờ SEC G2.4 (nhóm D mục A, A.3).
> **Chấm lại 21/10 (R-1, `21bb797`):** Đang nghiệm thu – AC1–AC4 đạt. Giữ vì SEC BE-74, BE-75, BE-79 (Major, cùng đường giấy tờ – hồ sơ) dời R3-Q17, hạn trước dữ liệu thật (P-S4-19).
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
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC3: server đạt (`idDocLast4` chỉ ghi khi P05), **chờ ca UI** hồ sơ khách H06 (U6); QA đóng BUG-R2-063.
> **Chấm lại 21/10 (R-1, `21bb797`):** Đang nghiệm thu – AC3 màn hình đạt (TC-RB-008 (E)). Giữ vì SEC BE-79 (Major, dời R3-Q17): đổi người của giấy tờ không gỡ `id_doc_last4` trên hồ sơ cũ – đúng cột của AC3.
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
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC3 đạt (TT phạm vi T; MOB `guard.test`). AC1, AC2 **chờ ca UI** PWA H19 360 px (U2). **P-S4-17:** H19 hiện trạng thái bằng câu thường + icon + màu (không mã VC/VD) – PO nhận là "nhãn trạng thái bằng chữ"; mã vẫn hiện trên Desk.
- AC1: Given điện thoại rộng 360px, When `housekeeping` mở màn hình, Then thấy thẻ 10 căn với số căn, nhãn trạng thái bằng chữ (`VC`…`OOO` kèm tên tiếng Việt – BR-801), khách đến kế tiếp, không cuộn ngang.
- AC2: Given chọn lọc "Cần dọn", Then chỉ còn căn `VD`, `OD`, `CL`.
- AC3: Given tài khoản `housekeeping`, Then thẻ căn chỉ hiện tên gọi khách cho căn có việc hôm nay (D01 – Tên+căn), không có kênh, giá (rbac ghi chú 2).

#### US-053 – Đổi trạng thái buồng hợp lệ (SM-03, BR-802)
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1–AC4 đạt (E2E-UI A1/A4 TC-X-070/072 trên PWA; TT `housekeeping-s4`). Giữ Đang nghiệm thu tới khi ARC Verified FB-R2-ARC-BE-S4-01, 02 (Major – hàng đợi offline, thứ tự khóa; `reviews/s4-ARC.md`).
- AC1: Given căn `VD`, Then chỉ có nút "Bắt đầu dọn" (R1 → `CL`); Given căn `CL` còn đơn `in_house`, Then "Dọn xong" chuyển `OC` (R2), không còn khách → `VC` (R3).
- AC2: Given chuyển sang `VC`/`OC`, Then việc dọn mở đầu tiên của căn tự chuyển `done`.
- AC3: Given căn `VC`, When bấm "Kiểm đạt", Then phải qua checklist US-055 mới chuyển `VI`; `housekeeping` chỉ tự kiểm được khi cơ sở bật chế độ một người và có ảnh (R4, A81).
- AC4: Given gọi một chuyển bị cấm (vào/ra `OOO` bằng tay, `VD` → `VI`, `OC` → `VC`), Then bị từ chối (SM-03).

#### US-054 – Việc hôm nay tự sinh (SM-14, BR-807)
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1 (E2E-UI A1), AC3 (E2E-UI TC-L6-022/033), AC4 (TT thứ tự BR-807) đạt. AC2 **chờ ca UI** (chip "App khách", U2).
- AC1: Given lễ tân hoàn tất trả phòng căn 201, Then việc "Dọn trả phòng 201" xuất hiện trong danh sách của `housekeeping` trong ngân sách độ trễ của `architecture.md` mục 16.
- AC2: Given khách gửi yêu cầu "Khăn, đồ dùng" từ app, Then việc có chip "App khách" và ghi chú của khách (BR-811).
- AC3: Given tick xong, Then bộ đếm x/y cập nhật và lễ tân thấy cùng trạng thái.
- AC4: Given danh sách việc, Then sắp theo thứ tự ưu tiên của BR-807.

#### US-055 – Checklist kiểm phòng (R4, BR-808)
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1, AC2 đạt (E2E-UI A1/A4; TT). Giữ Đang nghiệm thu như US-053 (ARC FB-R2-ARC-BE-S4-01, 02 trên `recordInspection`).
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
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1 đạt (TT; E2E-UI TC-X-072 màn H21). AC2 **chờ ca UI** (HK đề nghị khóa → Desk khóa theo đề nghị, U2).
- AC1: Given `housekeeping` chọn căn, mô tả "mất nước nóng", đính 1 ảnh, chọn mức, When gửi, Then tạo phiếu `new` nguồn "buồng phòng", mã do server cấp, `maintenance` thấy ngay; mức Cao → báo `maintenance`, `front_desk`, `manager` và vào "Cần chú ý" (BR-809).
- AC2: Given chọn "cần khóa phòng", Then phiếu ghi đề nghị khóa; `front_desk`/`maintenance` xác nhận tạo khối OOO như US-061 (`housekeeping` không tự tạo khối – A86).

### EP08 – Bảo trì

#### US-061 – Tạo phiếu sửa và khóa phòng (UC-24, W1, O1, BR-804)
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1 (E2E-UI TC-L6-040, TC-X-072), AC3 (TC-L6-042), AC4 (TC-L6-043) đạt. AC2 **chờ ca UI** (danh sách đơn trùng, U3). **P-S4-16:** R2 nhận ngày "mở bán lại từ …" hiện ngay sau khi lưu (server tính theo BR-804); hiện trước khi lưu → R3 (mục 5.5 R3-Q16).
- AC1: Given tạo phiếu ngày 15/10 cho căn 401 có tích "Khóa phòng" với ngày dự kiến xong 17/10, Then form hiện rõ cả hai ngày "dự kiến xong 17/10" và "mở bán lại từ 18/10" (ngày xong + `ooo_reopen_buffer_days` – BR-804); khối OOO `active` khóa các đêm 15, 16, 17 (lưu nửa mở [15/10, 18/10) – decision-log DOM), buồng → `OOO`, căn bị chặn bán trên rack, kiểm trùng, phòng trống và có lệnh đồng bộ đóng phòng (khắc phục BL 8.2 #5).
- AC2: Given khoảng khóa trùng đơn `hold`/`confirmed` tương lai, When lưu, Then hiện danh sách đơn cần dời; chỉ lưu được khi không còn đơn trùng hoặc `manager`/`owner` xác nhận đã có phương án (O1).
- AC3: Given căn đang có đơn `in_house`, Then không tạo được khối OOO và được gợi ý đổi phòng trước (US-024).
- AC4: Given bỏ trống mô tả, Then không lưu được.

#### US-062 – Cập nhật phiếu sửa (SM-04, O4)
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1 (E2E-UI TC-L6-045, TC-X-072), AC2 (TT SM-04 + lịch sử) đạt. AC3 **chờ ca UI** (gợi ý phương án trong drawer, U3).
- AC1: Given phiếu có khối OOO liên kết, When chuyển `done` (xác nhận US-135), Then khối → `released`, buồng `OOO` → `VD`, có việc "Dọn sau sửa chữa" và lệnh đồng bộ mở bán.
- AC2: Given đổi trạng thái hoặc người xử lý, Then chỉ theo các chuyển của SM-04 (`new` → `in_progress` ↔ `waiting_parts` → `done`; `cancelled` có lý do) và nhật ký phiếu ghi người đổi, thời điểm.
- AC3: Given phiếu mức Cao của căn có khách đang ở quá thời hạn phương án của BR-809, Then hệ thống gợi ý đổi phòng (US-024) + FOC bù sự cố (US-007).

### EP09 – Kho F&B / minibar

#### US-066 – Danh mục mặt hàng minibar (BR-701, A91)
> Xếp **Sprint 4** (PO 17/10): story Must R2 này chưa thuộc sprint nào (QA đang bỏ qua TC-L4-070/071); minibar khi trả phòng ở Sprint 3 dùng danh mục seed.
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1, AC3 đạt (TT; E2E-UI TC-RB-017). AC2 đạt **(G1)**. **P-S4-18:** AC2 đọc theo BR-702-04 (DOM 18/10, minibar M-1): giá mới áp từ lần nạp sau, các lần kiểm trong cùng kỳ nạp giữ giá lúc nạp, dòng folio đã ghi giữ nguyên. Lên Đạt (stack tạm) khi kiểm lại S4-38 lần 6 có 0 ca lệch.
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
> **Rà lại 17/10 khuya (PO – ĐK-S3-4, BUG-R2-080): hạ về Đang nghiệm thu.**
> - Bản tiếng Nga mới đạt ở API. Hộp báo giá trên Desk (`QuoteDialog`) chỉ cho chọn Tiếng Việt/English.
> - Theo QC-S3-09, AC giao diện chỉ nhận khi có ca UI bấm thật.
> - Sửa ở **Sprint 4** (S4-50a, FE-A, cổng QC Sprint 4): thêm Русский vào hộp báo giá; ca UI sao chép văn bản RU.
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC2 tiếng Nga trên hộp báo giá Desk (BUG-R2-080): **chờ ca UI** sao chép văn bản RU (U5).
- AC1: Given lưu báo giá, Then có mã duy nhất (BR-007), trạng thái `active`, hạn hiệu lực theo BR-304 và snapshot giá, tham số (BR-006).
- AC2: Given chọn ngôn ngữ Anh hoặc Nga, When bấm "Sao chép gửi Zalo", Then văn bản báo giá bằng đúng ngôn ngữ đó và có ngày hết hiệu lực.
- AC3: Given báo giá `expired`, When tạo giữ chỗ từ báo giá đó, Then hệ thống yêu cầu lập báo giá mới theo giá hiện hành hoặc `manager`/`owner` gia hạn (Q4); `sales_staff`/`collaborator` chỉ gửi được yêu cầu gia hạn (A51 = D).

#### US-084 – Tạo đơn giữ chỗ (UC-02, B1, BR-302)
> Nghiệm thu S3 (17/10): **hạ về Đang nghiệm thu** – AC4: H12/H11 chưa vẽ mã VietQR cọc sau khi giữ chỗ (API có; chuỗi "tạo ngay sau khi giữ chỗ" hứa sai – PO-S3-04) → **Sprint 4** (S4-28*, cần cho luồng A1 của QC).
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC4 đạt (E2E-UI TC-L5-025 (a), TC-X-070) → **Đạt (stack tạm)**.
- AC1: Given báo giá `active` và căn còn trống, When tạo giữ chỗ với một mức hạn trong BR-302, Then đơn `hold` (viền đứt trên rack), hạn thực tế theo công thức BR-302 (khớp ví dụ BR-302: tạo 20:00 cho ngày đến hôm sau → hạn là mốc trần của ngày đến), căn bị chặn bán, có lệnh đồng bộ, báo giá → `converted`, lead → `holding`. *(bổ sung – INV quyết ESC-017 A 16/10)* Given `collaborator`/`sales_staff` đã có số giữ chỗ đang mở bằng mức tối đa của vai (BR-302, tham số `max_open_holds_per_user`; đếm theo người tạo hoặc người chốt, mỗi căn của đơn nhóm tính 1; FD+ không giới hạn), When tạo thêm giữ chỗ, Then bị chặn với thông báo đã đạt giới hạn; xác nhận cọc hoặc hủy một giữ chỗ thì tạo lại được.
- AC2: Given ngày đến là hôm nay, Then không tạo được giữ chỗ và được hướng sang tạo đơn đã thu (UC-02 A1).
- AC3: Given khách chưa có SĐT, Then không tạo được.
- AC4: Given giữ chỗ tạo xong, Then hiện số tiền cần thu (ngắn ngày: cọc BR-305; dài hạn: ký quỹ BR-206/BR-306) và VietQR/nội dung chuyển khoản theo mã đơn (US-120).

#### US-085 – Hết hạn giữ chỗ (B3, B6, BR-303)
> Nghiệm thu S2 (16/10) – **phần dời:** AC2 nhắc trước hạn (J2) + mục "Cần chú ý" → **Sprint 4**. AC1, AC3, AC4 đạt.
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC2 đạt (TT J2 `hold.remind`, dòng `hold_expiring` có hạn) → **Đạt (stack tạm)**.
- AC1: Given đơn `hold` chưa có giao dịch cọc `succeeded`, When đến hạn, Then trong ngân sách độ trễ job của `architecture.md` mục 16, job chuyển đơn → `cancelled` lý do "Hết hạn giữ chỗ", mở phòng, có lệnh đồng bộ, lead → `quoted`, người tạo nhận thông báo (BR-303 – INV quyết ESC-006 16/10).
- AC2: Given đến mốc nhắc trước hạn của BR-303, Then người tạo nhận nhắc và đơn vào "Cần chú ý" với thời gian còn lại.
- AC3: Given người tạo gia hạn giữ chỗ trước hạn, Then hạn mới không vượt mức của BR-303 và trần của BR-302; lần gia hạn thứ hai bị chặn.
- AC4: Given job chạy trễ nhưng đã có giao dịch cọc `succeeded` trước hạn, Then đơn không bị hủy; Given tiền về sau khi đơn đã tự hủy, Then tạo cảnh báo "Tiền về cho đơn đã hủy" cho FD/sale (state-machines 1.3).

#### US-086 – Xác nhận cọc & sinh hợp đồng (UC-03, UC-07, B4, H1)
> Nghiệm thu S2 (16/10): AC1, AC2, AC5 đạt; AC4 phần **ảnh biên nhận** (cần tải tệp) → **Sprint 3**; phần đối soát theo ESC-017 A (AC5) nghiệm thu ở **Sprint 3** cùng đối soát giao dịch; AC3 dời R3 (R-C).
> Nghiệm thu S3 (17/10): AC5 đối soát theo ESC-017 A đạt (TC-L5-052, TC-L4-069); AC4 ô **ảnh biên nhận** khi CTV báo chuyển cọc chưa có trên Desk (API có) → **Sprint 4** (S4-30*); AC3 R3.
> **Sprint 4 (PO 17/10 – BUG-R2-081 gộp S4-30):** AC4 "FD/sale nhận thông báo" gồm cả việc hộp **Xác nhận cọc** hiện số tiền, giờ chuyển, ghi chú và ảnh biên nhận CTV đã báo, để lễ tân đối chiếu sao kê trước khi xác nhận. Không thêm số AC.
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC4 (S4-30 + BUG-R2-081): có mã + vitest, **chờ ca UI** (U5).
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
> **Sprint 4 (PO 17/10):** nút "Chỉ đường" dùng **ghim Google Maps INV gửi 17/10** (https://maps.app.goo.gl/oYos42G5YvUEcDCc6), lưu ở cấu hình cơ sở. Đây là **một nguồn** cho US-108, US-148 (landing) và US-162 (R3), theo US-148 AC3. Link chỉ mở khi khách bấm, không nhúng bản đồ. SEC xác nhận tên miền link trong danh sách cho phép (E14-08). Xem `rounds/round-02/sprint-4-plan.md` P-S4-7, S4-51.
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC2 (phần Wi-Fi) đạt (TT, E2E TC-L7-021). AC1 **chờ ca UI** H23 (U4). SEC đã xác nhận tên miền ghim `maps.app.goo.gl` (`reviews/s4-SEC.md` mục B, S4-51).
- AC1: Given đơn `confirmed`, Then trang hiện ngày nhận/trả, giờ chuẩn nhận/trả (BR-401), địa chỉ + chỉ đường, nội quy kèm phí phạt (BR-511).
- AC2 *(R2 theo R-C, P-R2-5: chỉ Wi-Fi theo khung hiệu lực; **phần mã cửa [Dời R3 – R-C]** cùng US-128 – R2 app khách không hiện mã cửa, lễ tân giao như hiện nay)*: Given trước thời điểm hiệu lực của mã cửa (BR-403), Then mã cửa và Wi-Fi bị ẩn với dòng "sẽ hiện vào ngày nhận phòng"; trong khoảng hiệu lực thì hiện; sau khi trả phòng thì ẩn (D22).

#### US-109 – Khách gửi yêu cầu (UC-15, SM-15)
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** Phần server đạt (TT `guest-requests-s4-bed`: phí BR-506, SM-15, ghi phí folio một lần). AC1, AC2 **chờ ca UI** H23 (U4).
- AC1: Given khách chọn "Báo hỏng" và ghi "Không có nước nóng", When gửi, Then thấy thẻ "Đã gửi" với thời điểm; nhãn trạng thái theo SM-15: Đã gửi · Đã nhận · Đang xử lý · Hoàn thành · Không thực hiện được. *(bổ sung – INV quyết ESC-016 A 16/10)* Given khách **ngắn ngày** chọn "Dọn thêm" khi căn đã được dọn đầy đủ trong ngày, Then app hiện phí theo BR-506 và khách phải bấm đồng ý phí trước khi gửi; phí vào folio khi buồng phòng làm xong; Given khách đã từ chối dọn buổi sáng (dọn bù) hoặc chỉ yêu cầu thay khăn/bổ sung đồ dùng, Then không có phí.
- AC2: Given nhân viên xử lý xong (`done`), Then trang khách đổi thành "Hoàn thành"; Given `declined`, Then khách thấy lý do.

#### US-110 – Định tuyến yêu cầu (BR-811, BR-809)
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC1–AC3 đạt (TT `guest-requests-s4-bed`, J10, DOM-S4-10). Giữ Đang nghiệm thu tới khi xong review SEC G2.4 (guest-web P-R2-4, luật B-15 trong `replyNote`) và ARC `reviews/s4-ARC.md` mục B (EP14). QA thêm ca UI hàng yêu cầu H03 (U1) để nghiệm thu lại trên staging.
- AC1: Given yêu cầu "Báo hỏng", Then tạo phiếu sửa mức mặc định theo BR-809 nguồn "App khách"; "Dọn phòng thêm"/"Khăn, đồ dùng" → việc buồng phòng; "Đặt xe, tour"/"Trả muộn"/"Khác" → việc lễ tân (BR-811).
- AC2: Given yêu cầu chưa được "Đã nhận" sau thời hạn của BR-811 trong giờ trực, Then `front_desk` nhận nhắc; ngoài giờ trực, Then khách nhận trả lời tự động kèm giờ xử lý.
- AC3: Given `housekeeping`/`maintenance`, Then chỉ thấy yêu cầu được định tuyến tới bộ phận mình (S30 = T).

#### US-111 – Khách xem folio
> **[Dời R3 – R-C]** cả story (INV quyết ESC-012 16/10). R2 app khách không hiện folio (plan R2 P-R2-4).
- AC1: Given đơn có tiền phòng, 1 dòng minibar và đã cọc, Then trang khách hiện các dòng, tổng, đã trả, còn phải trả khớp với chi tiết đơn ở Desk.
- AC2: Given folio có dòng/ghi chú nội bộ (ví dụ giá vốn, ghi chú lễ tân), Then không hiện cho khách.

#### US-112 – App khách tiếng Anh (HR-01)
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC3 đạt (UXD duyệt chuỗi Sprint 4). AC1, AC2: server đạt (TT `guest-locale-s4-bed`), **chờ ca UI** H23 bằng EN (U4).
> **Chấm lại 21/10 (R-1, `21bb797`):** Đang nghiệm thu – AC1 đạt (TC-X-077). AC2 phần màn chưa chứng minh: ca mở bằng trình duyệt en-US nhưng hồ sơ vi được ưu tiên, nên khách tự đổi. Phần server (TT `guest-locale-s4-bed`) đạt.
- AC1: Given khách bấm chuyển "English", Then mọi chữ trên trang (menu, nút, lỗi, trạng thái yêu cầu) là tiếng Anh; không còn chuỗi tiếng Việt cố định.
- AC2: Given hồ sơ khách có ngôn ngữ "English" hoặc trình duyệt dùng tiếng Anh, When mở link lần đầu, Then trang mặc định tiếng Anh; vẫn chọn tay được ở đầu trang.
- AC3: Given các chuỗi pháp lý (thông báo xử lý dữ liệu, đồng ý, chính sách hủy, nội quy), Then bản tiếng Anh là bản dịch đã được duyệt theo content-guide của UXD, không dịch máy.

### EP15 – Thanh toán & hóa đơn

#### US-119 – Ghi nhận thu tiền (SM-12, BR-521)
> Nghiệm thu S3 (17/10): AC1, AC2, AC4, AC6 đạt; AC3 API đạt (TC-L4-062) nhưng Desk chưa có nút **"Đảo giao dịch"** cho MGR/OWN → **Sprint 4** (S4-27*); AC5 R3.
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC3 nút "Đảo giao dịch" (S4-27): **chờ ca UI** (U5).
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
> Giữ **Should**: phụ thuộc tài khoản của INV và Zalo duyệt mẫu; khi chưa có, US-161 vẫn chạy gửi tay. **INV quyết ESC-021 = A, K1 = A (17/10)**:
> - chat OA (gửi tay trên OA Manager) bắt đầu ngay khi OA được xác thực, không lập trình;
> - xếp R3 Sprint 1 (bản giả lập) → Sprint 2 (nối thật);
> - không gửi mã giảm cho khách OTA.
>
> Trong Sprint 4 R2 chỉ soạn trước mẫu tin ZBS để INV gửi duyệt (sprint-4-plan mục 9.2).
- AC1: Given `owner` bấm "Kết nối Zalo OA" trên thiết bị được cấp (xác nhận lại mật khẩu), Then chỉ nhận đúng OA của OTTIMO; OA khác → từ chối, không lưu khóa, ghi nhật ký bảo mật; khóa kết nối lưu mã hóa (SEC C-5).
- AC2: Given tin đến hạn từ US-161 và khách có kênh tự động, Then gửi trong khung giờ tham số (tin mẫu Zalo mặc định [08:00, 21:00)), mỗi tin tối đa một lần (không tự gửi lại khi hết thời gian chờ sau lúc đã gửi); ghi trạng thái gửi và chi phí ước; lỗi → về danh sách gửi tay.
- AC3: Given khách chặn tin OA/ZNS hoặc nhắn từ chối, Then kênh Zalo của khách tắt ngay; tin vận hành chuyển kênh khác; tin ưu đãi dừng (SEC C-8).
- AC4: Given một mẫu tin, Then chỉ dùng biến trong danh sách cho phép **theo mẫu và theo kênh**; render có mã cửa, số giấy tờ, ngày sinh, mã xác minh, số căn trước ngày đến → không gửi (`422`) (SEC C-7); nhật ký gửi không chứa SĐT, nội dung, token (SEC C-9); webhook Zalo kiểm chữ ký trên thân thô (SEC C-4).
- AC5: Given chưa có tài khoản Zalo hoặc chưa đạt SEC C-4…C-9, Then kênh Zalo chạy giả lập; email vẫn gửi được; không gửi tin tự động tới khách thật trước SEC-G1, SEC-G2 và máy chủ thật.

#### Ghi chú lịch các story Zalo khác (INV quyết ESC-021 = A, K1 = A ngày 17/10; AC đầy đủ viết đầu R3)
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
> **Nghiệm thu S4 (18/10, `rounds/round-02/outputs/PO/s4-acceptance.md`):** AC3 **chưa** có ca (S4-33, TC-L2-026 – tuần Ổn định).
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

#### US-104 – Xuất báo cáo và dữ liệu theo kỳ ra bảng tính – *mở rộng 17/10/2026 (INV chọn A), Should → Must R3*
> **Vì sao mở rộng US-104, không thêm story (PO 17/10):** cùng người dùng (`owner`), cùng việc "xuất ra bảng tính", cùng quyền A105 và cùng yêu cầu bảo mật (SR-INP-06, SR-AZ-10, TM-59). Hai story sẽ thành hai lối xuất với hai cách che và hai nhật ký – dễ lệch. **Vì sao Must:** INV đã chọn (decision-log 17/10); khi INV loại phương án đẩy dữ liệu ra dịch vụ ngoài (B) và kết nối thẳng cơ sở dữ liệu (C), đây là lối duy nhất để INV tự phân tích.
> **Ngoài phạm vi R3:** tệp XLSX (CSV có BOM mở được bằng Excel/Google Sheets; XLSX xét lại theo phản hồi INV); tùy chọn bỏ che dữ liệu khách; lịch xuất tự động; API đọc dữ liệu thô.
> **Phụ thuộc R3 (làm trước khi BE cài):** **SEC** duyệt danh sách trường và cách che theo phân loại C2/C3 (`security/data-risk-assessment.md`), giới hạn ở AC6, xác thực lại ở AC1; sửa SR-INP-06, SR-AZ-10 (A105 chỉ OWN), TM-59. **ARC** hợp đồng: thao tác tạo bản xuất + tải một lần, job tạo tệp, nơi lưu tạm, `audit_event` category `export`. **DATA** định nghĩa cột từng tệp và từ điển `columns.csv` theo `metrics-definitions.md` (Q-01, Q-02, Q-05, Q-09…Q-11, K-01…K-20), dữ liệu thử và ca đối chiếu AC9. **BA** sửa `rbac-matrix` A105 = chỉ `owner` (bỏ `manager` – INV 17/10), mã hành động xem lịch sử xuất, đặc tả màn xuất. UXD màn chọn kỳ + chuỗi VI/EN; QA ca mở tệp bằng Excel/Sheets, CSV injection, kiểm che. Story liên quan: US-143 (2FA), US-100…US-102 (số báo cáo), US-144 (chốt tháng).
- AC1 *(quyền)*: Given người dùng không phải `owner` (kể cả `manager`), Then không thấy chức năng xuất và API trả 403 (A105 – chỉ `owner`, INV 17/10). Given `owner`, When bấm "Xuất dữ liệu", Then phải nhập lại mã 2FA (US-143) trước khi tệp được tạo `[GIẢ ĐỊNH – SEC chốt cách xác thực lại]`.
- AC2 *(kỳ)*: Given màn xuất, Then chọn được **tháng lịch** (mặc định tháng trước) hoặc **khoảng ngày** từ–đến, tối đa 366 ngày, không vượt ngày nghiệp vụ hiện tại; mọi ngày theo ngày nghiệp vụ (BR-010, `metrics-definitions.md` Q-01). Dòng thuộc kỳ: đêm, dòng folio, giao dịch thu/hoàn có ngày nghiệp vụ trong kỳ; đơn có ít nhất một đêm trong kỳ hoặc được tạo/hủy/đánh dấu no-show trong kỳ; khách là người đứng tên/người đi cùng của các đơn đó.
- AC3 *(tệp – DATA chốt tên và nghĩa cột)*: Given xuất thành công, Then tải về **một tệp ZIP** gồm: `reservations.csv` (đơn: mã đơn, mã nhóm, kênh, nguồn `directSource` + nguồn phụ website, trạng thái, loại ở ngắn/dài, ngày tạo, ngày đến, ngày đi, số đêm, người lớn, trẻ em theo nhóm tuổi BR-110, căn + tên phòng, hạng/nhóm giá, tiền phòng, cọc yêu cầu/đã thu, ngày + mã lý do hủy/no-show, mã người chốt, mã hồ sơ người đứng tên); `nights.csv` (đêm-phòng: ngày, mã đơn, căn, loại đêm theo Q-05, giá đêm sau giảm, doanh thu phòng phân bổ theo đêm – Q-10, kênh); `folio_lines.csv` (mã đơn, ngày nghiệp vụ, nhóm khoản theo Q-09, loại dòng, số tiền, FOC/giảm giá kèm mã lý do); `payments.csv` (mã đơn, ngày, loại cọc/thu/hoàn/đảo, phương thức, số tiền, trạng thái đối soát); `revenue_daily.csv` (theo ngày × kênh: K-01, K-02, K-06…K-10); `guests.csv` (nguồn khách: mã hồ sơ, quốc tịch mã 3 chữ, nhóm khách BR-956, lần ở đầu/cuối, số lượt ở, nguồn của đơn đầu tiên); `rooms.csv`, `channels.csv` (danh mục căn, tên phòng, hạng, nhóm giá; kênh, % phí kênh); `columns.csv` (từ điển cột: tên, nghĩa VI/EN, mã chỉ số/BR, đơn vị); `manifest.csv` (kỳ, thời điểm xuất, người xuất, phiên bản bộ cột, số dòng mỗi tệp, ghi chú tháng đã chốt hay chưa – US-144).
- AC4 *(che dữ liệu khách – SEC duyệt danh sách)*: Given bất kỳ tệp nào, Then **không** có: số hay ảnh giấy tờ, ngày sinh, địa chỉ, thị thực, ghi chú tự do (đơn, folio, khách), lưu ý phục vụ/sức khỏe, mã cửa, số tài khoản/số thẻ, tên người chuyển tiền, ảnh biên nhận, IP; trẻ em chỉ có số đếm theo nhóm tuổi; mọi dữ liệu C3 không bao giờ có (SR-AZ-10). **SĐT che**, chỉ còn mã quốc gia + 3 số cuối (ví dụ `+84 *** *** 123`); email che (ký tự đầu + tên miền, ví dụ `a***@gmail.com`); tên khách chỉ còn chữ cái đầu (ví dụ `N. V. A.`) `[GIẢ ĐỊNH – SEC chọn viết tắt hay bỏ hẳn tên]`. Mã hồ sơ khách là mã nội bộ, không suy ra được từ số giấy tờ hay SĐT. R3 không có tùy chọn bỏ che.
- AC5 *(định dạng)*: Given mỗi tệp CSV, Then mã hóa **UTF-8 có BOM**, phân tách dấu phẩy, dòng đầu là tên cột tiếng Anh dạng `snake_case` (nhãn VI/EN ở `columns.csv`); ngày `yyyy-mm-dd`, giờ ISO 8601 kèm `+07:00`; tiền là số nguyên VND, không dấu phân cách nghìn; ô bắt đầu bằng `=`, `+`, `-`, `@`, tab hoặc xuống dòng được thêm dấu `'` phía trước (SR-INP-06, TM-59 – chống công thức độc); dòng cuối mỗi tệp ghi người xuất và thời điểm xuất (SR-INP-06). Kiểm: mở bằng Excel (Windows, macOS) và Google Sheets, tên tiếng Việt và tiếng Nga hiện đúng, cột số tiền là số.
- AC6 *(giới hạn)*: Given yêu cầu xuất, Then kỳ ≤ 366 ngày; ZIP ≤ 20 MB (vượt → báo chia nhỏ kỳ, không tạo tệp); tối đa 10 lần xuất/ngày/tài khoản; tệp tạo trên máy chủ tại Việt Nam, tải thẳng về trình duyệt qua link **một lần dùng, hết hạn sau 10 phút**; máy chủ xóa tệp ngay sau khi tải hoặc khi hết hạn; không gửi email, không lưu lên dịch vụ ngoài `[GIẢ ĐỊNH – SEC đặt biên cho các con số]`. Kỳ 12 tháng trên dữ liệu thử tạo xong ≤ 30 giây `[GIẢ ĐỊNH – mục tiêu của PO]`.
- AC7 *(nhật ký)*: Given mọi lần xuất (thành công, bị từ chối, lỗi), Then ghi `audit_event` category `export`: người xuất, thời điểm, kỳ, danh sách tệp + số dòng, kích thước, mã băm SHA-256 của ZIP, kết quả, thiết bị/IP theo quy tắc nhật ký của SEC; nhật ký **không** chứa dữ liệu khách. `owner` xem được lịch sử xuất (ai, khi nào, kỳ nào) trong Nhật ký.
- AC8 *(báo cáo đã định dạng – phần cũ của US-104, gửi kế toán)*: Given màn báo cáo US-100, US-101, US-102 (US-103 khi có), When `owner` bấm "Xuất", Then tải về CSV đúng các con số đang hiện (cùng kỳ, cùng bộ lọc), áp cùng quy tắc AC4–AC7.
- AC9 *(khớp số)*: Given dữ liệu thử của DATA, Then tổng cộng từ `nights.csv` và `folio_lines.csv` khớp `revenue_daily.csv` và báo cáo US-100/US-101 cùng kỳ (các đối chiếu R-01…R-07 của `metrics-definitions.md`) – lệch 0 đồng.
- AC10 *(không có lối khác – INV loại B, C 17/10)*: Then hệ thống **không** có API công khai đọc dữ liệu thô, tài khoản đọc thẳng cơ sở dữ liệu cho người ngoài đội vận hành, hay tác vụ tự đẩy tệp ra dịch vụ ngoài (Google Drive, email, kho dữ liệu đám mây…). Kiểm: SEC rà hợp đồng API và cấu hình khi review.

#### US-164 – Quản lý xác nhận từ xa trên thiết bị của mình – *mới 18/10/2026 (SEC ARC-25), Must R3*
> **Vì sao:** R2 cài D5 – quản lý gõ tên + mật khẩu đăng nhập của mình trên máy quầy để xác nhận "phụ thu trả muộn bằng giá 1 đêm" (BR-416-06, `checkOut.lateFeeInsteadOfNight`, kèm `requestFoc`). Đường này thường xảy ra sau 18:00, lúc quản lý vắng → áp lực đọc mật khẩu qua điện thoại; SEC chấp nhận D5 cho R2 có điều kiện (BE-59…63) và yêu cầu backlog R3. **Must R3:** phải có trước khi vận hành thật (RC). **Ngoài phạm vi:** gửi qua Zalo/SMS cho quản lý (cần SEC + ESC riêng nếu muốn); duyệt bằng cuộc gọi.
> **Phụ thuộc:** **SR-AUTH-09** (PIN duyệt của chính người đang đăng nhập – R3), **SR-AUTH-06** + US-143 (2FA cho OWN/MGR), **SR-AUTH-11 mới của SEC** ("người khác xác nhận tại quầy", `s4-SEC-lateFee-reauth.md` mục 6 – lưu ý số này đang trùng SR-AUTH-11 hiện có "đăng nhập gần nhất", SEC đánh lại số); điều kiện BE-59…63, ARC-24, ARC-26, FE-08 của SEC; SM-10 (phê duyệt); SSE theo vai; ARC chọn kênh đẩy thông báo tới điện thoại quản lý trong hạ tầng hiện có (không thêm dịch vụ ngoài nếu SEC chưa duyệt); DOM xác nhận nghiệp vụ (đơn không kẹt `in_house`, giờ rời thật); **ESC-024** quyết khi quản lý không trả lời. BA rà danh sách đường đang cần OWN/MGR có mặt tại quầy.
> **Ước lượng [PO, các vai xác nhận khi nhận việc]:** ARC 0,75–1 · BA 0,5 · BE 2,5–3,5 · FE Desk 1–1,5 · màn duyệt trên điện thoại của quản lý (Desk đáp ứng điện thoại/PWA) 1,5–2 · UXD 0,5–1 · SEC 0,5–1 · QA 1–1,5 → **≈ 8,25–12 ngày-người**.
- AC1 *(gửi)*: Given lễ tân làm trả phòng mà đường đó cần OWN/MGR xác nhận (R3: `lateFeeInsteadOfNight` kèm `requestFoc`; đường khác theo danh sách BA), When bấm "Gửi quản lý xác nhận", Then server tạo một yêu cầu xác nhận có hạn ngắn (tham số, mặc định 15 phút `[GIẢ ĐỊNH – DOM chốt]`), **ghi ngay giờ rời thật** của khách, khóa số tiền do server tính (phụ thu, FOC đề nghị, số khách phải trả), và gửi thông báo tới OWN/MGR **của cơ sở** đang hoạt động. Thông báo chỉ có mã đơn, tên phòng/số căn, loại việc, số tiền, người gửi – **không** tên khách, SĐT.
- AC2 *(duyệt trên thiết bị của quản lý)*: Given OWN/MGR mở yêu cầu trên phiên **của chính mình** (điện thoại hoặc máy tính), Then thấy đủ phụ thu, FOC đề nghị (trong hạn mức BR-433 của mình) và số khách phải trả trước khi duyệt; duyệt bằng **PIN duyệt** (SR-AUTH-09) hoặc mật khẩu + mã 2FA (SR-AUTH-06) – không bao giờ bằng mật khẩu đơn; từ chối bắt buộc lý do. Sai PIN/mã theo bộ đếm SR-RL-02 của chính người duyệt.
- AC3 *(Desk nhận kết quả)*: Given quản lý duyệt hoặc từ chối, Then Desk của lễ tân nhận kết quả qua SSE trong ≤ 5 giây, nút "Hoàn tất trả phòng" mở với **đúng** số đã duyệt (lệch → 409 như D5); bị từ chối → Desk hiện lý do và các lựa chọn hợp lệ; một yêu cầu chỉ dùng được một lần.
- AC4 *(hết hạn, không kẹt đơn)*: Given yêu cầu hết hạn mà chưa ai trả lời, Then Desk báo rõ, lễ tân gửi lại được; đơn không bị kẹt: giờ rời đã ghi giữ nguyên, các thao tác khác của đơn bị khóa tới khi có kết quả hoặc hủy yêu cầu; cách xử lý khi không liên lạc được quản lý theo **ESC-024** (chưa quyết: khách chờ hoặc quản lý tới quầy).
- AC5 *(bỏ mật khẩu trên máy quầy)*: Given US-164 đã bật, Then đường "người khác xác nhận tại quầy" của R2 (D5) **không còn nhận mật khẩu đơn**: tại quầy chỉ nhận PIN hoặc mật khẩu + mã 2FA của quản lý (SEC ARC-24); máy quầy không lưu mật khẩu (FE-08).
- AC6 *(nhật ký, phát hiện)*: Given mọi yêu cầu, Then audit `money` ghi người gửi, người duyệt, kênh `remote`/`desk`/`self`, `authMethod`, giờ gửi, giờ duyệt, số tiền; audit `security` khi sai PIN/mã; người duyệt nhận thông báo mỗi lần tài khoản của mình được dùng cho phiên người khác (SEC BE-62). Không ghi PIN, mật khẩu, tên khách.
- AC7 *(dùng chung)*: Given BA đã rà danh sách đường cần OWN/MGR có mặt tại quầy, Then mọi đường trong danh sách dùng chung cơ chế AC1–AC6; đường mới muốn kiểm PIN/mật khẩu của người không phải người gọi phải qua SEC review (SR-AUTH-11 mới).

### Story khác ngoài R2 – điều chỉnh bước 4
- **US-074 (Should R3)** nhận AC chuyển từ US-023: "Given một hồ sơ khách bị gộp, Then mã cũ vẫn tra được và trỏ tới hồ sơ được giữ lại (BR-953)". QA chuyển TC-NT-023 sang US-074.
- **US-089 (Must R3)** nhận màn "Hoa hồng của tôi" (S17) từ US-087.
- **US-100 (Must R3)**: thêm AC "các đối chiếu R-01…R-07 của `metrics-definitions.md` đều khớp trên dữ liệu thử" (T11).
- **US-144 (Could R3)** – chốt số liệu tháng: AC viết ở R3 cùng DATA.
- **US-145 (Should R3)** – vận hành dự phòng (UC-33): AC viết đầu R3 theo BR-961…964. Lý do Should R3: cần lõi R2 trước; khi chưa có, quầy vẫn dùng sổ giấy theo mẫu (BR-962). Phải xong trước khi đưa dữ liệu thật vào vận hành.
- **Quyết định xếp round theo đề nghị BA (UC-31…33):** đơn nhóm US-140 giữ **Must R3** (R2 đã vượt ước lượng – ESC-012; R2 dùng đơn rời + ghi chú nhóm). Đóng ca: phần **cờ "chờ đối soát"** cho chuyển khoản ghi tay là **Must R2** (US-119 AC6 – dữ liệu tiền phải đúng từ ngày đầu); màn đóng ca đầy đủ US-124 **Must R3** vì R2 chưa vận hành tiền thật (chưa có dữ liệu khách thật trước khi có RC). Mất mạng/mất điện US-145 **Should R3**.

### EP19 – Landing page ottimo.vn (FB-INV-001, ESC-020) – *mới 17/10/2026*
Quy ước riêng cho EP19:
- "Khách tiềm năng" = người xem trang công khai, **không** có tài khoản, không phải vai `guest` (link của đơn). Trang không gọi API của Desk, **trừ** form yêu cầu đặt phòng US-155 (bật/tắt bằng công tắc cấu hình – US-155 AC4).
- **FB-INV-002 (INV 17/10, góp ý bản mẫu v1.1)** áp cho cả EP19: không nêu số phòng (US-147 AC6); định vị boutique stay, không "căn hộ dịch vụ" (US-146 AC5, AC6); Zalo OA là kênh chat chính, kênh khác ở chỗ phụ, link fanpage Facebook (US-151 AC1, AC7, AC8); bố cục v1.2 (US-146 AC7); đặt phòng trên website → **US-155 vào LP-v1**. Mức đặt phòng: **INV chọn ESC-020 L7 = A (17/10/2026)** – AC US-155 theo L7-A, không còn nhãn chờ INV. L7-B (US-155 AC9 + US-131) và L7-C (US-132) là quyết định mới của INV, trình khi lập kế hoạch R3.
- **Cổng LP-v1 hai mốc** (landing-scope mục 8): mốc *trang* – mọi AC Must của US-146…US-154 đạt, form US-155 tắt trên mạng; mốc *form* – mọi AC của US-155 đạt trên bản thử và đủ điều kiện US-155 AC4 → bật trên mạng. `--strict-track LP-v1` đòi TC cho mọi AC Must của luồng, gồm US-155 (TC được gắn `[BLOCKED …]` khi chưa có mã).
- **INV quyết ESC-020 L1–L6 = A hết (17/10/2026).** AC dưới đây là AC chính thức. Các nhánh "nếu INV chọn khác" đã bỏ. Thông tin INV hẹn gửi 19/10 vẫn là điều kiện **lên mạng**, không phải điều kiện dựng trang: tên miền, bảng ghép tên phòng ↔ số căn ↔ hạng phòng, logo SVG, hộp thư booking@ottimo.vn chạy được (INV đã xác nhận địa chỉ 17/10), Zalo OA đã xác thực.
- **Brand Guidelines v1.0** (INV 17/10, `00-brief/context/brand/brand-guidelines.md`) áp cho mọi chữ, màu, ảnh của landing; lệch với design system cũ hoặc e-brochure thì guideline thắng (landing không dùng terracotta). Nguồn chữ gốc: e-brochure 2026 (`00-brief/context/landing/ebrochure-text.md`).
- Điều kiện SEC (`rounds/round-02/reviews/landing-zalo-SEC.md`): **C-1** (không tải tài nguyên bên thứ ba khi mở trang, không script/style nội tuyến) là điều kiện cổng LP-v1; **C-2, C-3** là điều kiện bật form US-155.
- Con số quy tắc vẫn ghi bằng mã BR (giá trị tham số hiện hành lúc dựng trang). Mọi chữ hiển thị là bản INV đã duyệt (L5); không đăng thông tin chưa được INV xác nhận.
- Khe ảnh, khung giữ chỗ, cổng lên mạng: `rounds/round-02/outputs/PO/landing-scope.md` mục 5 và 8.

#### US-146 – Trang giới thiệu – *Must, LP-v1*
- AC1 *(sửa 17/10 – FB-INV-002 ý 1, 2)*: Given khách mở tên miền gốc trên điện thoại (màn ≥ 360px) hoặc máy tính, Then màn đầu có: ảnh khe `hero`, tên "OTTIMO Boutique Stay", câu giới thiệu đã duyệt nói OTTIMO là **boutique stay** (AC5), "Đà Lạt" + khu vực, hai lối "Ở ngắn ngày" / "Ở dài ngày" (EN "Short stays" / "Long stays") dẫn tới phần tương ứng, và nút "Đặt phòng"; màn đầu **không** có con số nào về số lượng phòng (US-147 AC6).
- AC2 *(sửa 17/10 – FB-INV-002 ý 4)*: Given khách cuộn tới bất kỳ phần nào, Then nút "Đặt phòng" vẫn trong tầm nhìn; trên điện thoại là thanh cố định chỉ gồm **"Đặt phòng"** và **"Chat Zalo"** (US-151 AC7); thanh không che nội dung hay nút khác.
- AC3 *(sửa 17/10 – FB-INV-002 ý 5)*: Given các phần chính theo bản mẫu v1.2 INV đã duyệt (gợi ý: Hạng phòng · Ở dài ngày · Tiện nghi và vị trí · Chính sách và câu hỏi · Liên hệ), Then menu dẫn tới đúng phần; trên điện thoại menu gọn trong một nút; mỗi phần có địa chỉ neo riêng để gửi link thẳng.
- AC4: Given chưa có nội dung INV duyệt (ESC-020 L5) hoặc chưa có thông tin liên hệ (L2), Then trang **không** được đưa lên tên miền công khai; chỉ có bản xem thử gắn `noindex`.
- AC5 *(mới 17/10 – FB-INV-002 ý 2, định vị)*: Given mọi chữ khách hoặc máy tìm kiếm đọc được (trang VI + EN, tiêu đề và mô tả tìm kiếm, ảnh chia sẻ link, mô tả ảnh, dữ liệu có cấu trúc, e-brochure đăng kèm), Then OTTIMO được giới thiệu là **boutique stay** có dịch vụ kiểu khách sạn (Brand Guidelines mục 1: giữa khách sạn và boutique stay); loại chỗ ở gọi là "phòng" / "room" hoặc tên hạng (Studio, Suite…), **không** gọi là "căn hộ" / "apartment"; **không** xuất hiện "căn hộ dịch vụ", "serviced apartment", "cho thuê căn hộ", "apartment for rent", "chung cư", "condotel", "5 sao", "five-star"; loại hình khai báo cho máy tìm kiếm là **cơ sở lưu trú** (`LodgingBusiness` – như US-154 AC2), không phải căn hộ cho thuê và **không** khai `Hotel` *(sửa 17/10 – DOM `landing-positioning.md` 2.2)*; chữ **không** tự nhận "khách sạn"/"hotel", không nêu hạng sao, không "luxury"/"sang trọng" (được dùng "dịch vụ kiểu khách sạn", "chăn ga chuẩn khách sạn") – chờ luật sư ESC-001 LZ-9. Kiểm: QA quét bản build VI + EN, các chuỗi trên = 0 `[GIẢ ĐỊNH – PO đặt danh sách chuỗi cấm; UXD, DOM được đề xuất thêm; INV duyệt nội dung (L5) là bước cuối]`.
- AC6 *(mới 17/10 – FB-INV-002 ý 2, hai nhóm khách)*: Given phần Hạng phòng, Tiện nghi và lối "Ở dài ngày", Then trang bị khác phòng khách sạn thường (bếp hoặc bếp nhỏ, máy giặt, bàn làm việc, khu sinh hoạt – chỉ những mục INV xác nhận) được viết thành **điểm cộng vượt mong đợi** cho khách ở ngắn ngày; lối "Ở dài ngày" có phần riêng viết cho khách ở từ một tháng (làm việc từ xa, dọn phòng định kỳ, giá theo tháng theo L3-A) để họ thấy chỗ ở **làm ra cho họ**; dịch vụ kiểu khách sạn (hỗ trợ của lễ tân, dọn phòng, nhận phòng online) có ở cả hai lối. Kiểm: UXR cho ≥ 5 người (có cả người hay đặt khách sạn ngắn ngày và người từng ở dài ngày) xem màn đầu + phần Hạng phòng khoảng 10 giây rồi hỏi "đây là chỗ ở loại gì?": ≥ 4/5 trả lời khách sạn / boutique stay, không ai trả lời căn hộ dịch vụ / chung cư `[GIẢ ĐỊNH – ngưỡng của PO]`; DOM đọc soát chữ.
- AC7 *(mới 17/10 – FB-INV-002 ý 5, bố cục)*: Given bản mẫu v1.2 của UXD (sơ đồ trang mới: ít phần hơn, một mạch đọc, nhiều khoảng trắng – Brand Guidelines "Calm"), Then UXR + PO đã review theo Brand Guidelines và **INV đã xem, đồng ý bố cục trước khi FE-LP dựng** các phần bị đổi; bản dựng khớp bản mẫu INV đã đồng ý (UXD ký duyệt – US-153 AC1).

#### US-147 – Hạng phòng (không nêu số phòng) – *Must, LP-v1*
- AC1: Given danh mục căn hiện hành (US-004; BL 4.1), Then trang hiện **4 hạng phòng** theo e-brochure 2026 (Studio hướng thành phố, Studio hướng vườn, Premium 1 phòng ngủ + 1, Signature 2 phòng ngủ) với sức chứa và diện tích theo brochure, ánh xạ tới 3 nhóm giá trong Desk (Lầu 1–2, Căn N, Căn N+) theo bảng ghép INV gửi (ESC-020 mục "Còn thiếu" 4 – INV hẹn 19/10); khách thấy **tên phòng** (The Pine … The Ember), không thấy số căn (Brand Guidelines mục 3; BR-012 – landing chỉ đăng tên phòng khi INV đã xác nhận bảng ghép, không dùng ánh xạ tạm). Mỗi hạng có ảnh đại diện, mô tả ngắn, số người theo định mức và tối đa (BR-110), tiện nghi chính theo thông tin INV gửi (ESC-020 L5 mục 3). *(Sửa 17/10 – FB-INV-002 ý 1:)* tên phòng theo bảng ghép chỉ dùng trong mô tả hoặc chú thích ảnh, **không** liệt kê đủ danh sách phòng của một hạng hay của cả OTTIMO (AC6); INV duyệt cùng nội dung (L5-A).
- AC2: Given khách bấm ảnh của một nhóm, Then mở thư viện ảnh của nhóm; xem tiếp bằng vuốt hoặc phím mũi tên; đóng bằng nút hoặc Esc; mỗi ảnh có mô tả thay thế VI/EN.
- AC3 *(INV quyết ESC-020 L3-A 17/10; chữ sửa 17/10 theo FB-INV-002 ý 2 – cách tính giữ nguyên)*: Given một nhóm căn, Then ở lối "Ở dài ngày" hiện "Từ {giá}/tháng" (EN "From {price}/month") = giá tháng niêm yết thấp nhất của nhóm (BR-101), ngay dưới có ghi chú: giảm theo kỳ hạn (BR-201), chưa gồm phí dịch vụ (BR-204) và điện nước theo công tơ (BR-501), khách nước ngoài +10% (BR-109). Ngắn ngày hiện "Giá tốt nhất khi đặt trực tiếp" + nút "Nhận báo giá" (mở US-151); **không** hiện số giá đêm. Dữ liệu thử: Lầu 1–2 "từ 8.000.000 đ/tháng" (căn 101).
- AC4: Given giá tháng niêm yết trong Desk khác số đang hiện trên trang, Then bản phát hành kế tiếp không được ra với số cũ: số "từ" lấy từ một nguồn duy nhất (danh mục căn) lúc dựng trang, có bước so khớp trong checklist phát hành; trang ghi "Giá cập nhật {ngày}".
- AC5: Given ảnh của nhóm chưa có (chưa tải từ Drive hoặc chưa biết thư mục "Phòng n" thuộc nhóm nào), Then hiện khung giữ chỗ đúng tỉ lệ, nhãn "Ảnh đang cập nhật"; **không** dùng ảnh mẫu (stock) hay ảnh không phải của OTTIMO.
- AC6 *(mới 17/10 – FB-INV-002 ý 1, không nêu số phòng)*: Given mọi nội dung khách thấy hoặc máy tìm kiếm đọc (chữ VI + EN, tiêu đề, mô tả ảnh, ảnh chia sẻ link, dữ liệu có cấu trúc, sơ đồ trang, e-brochure đăng kèm), Then **không** có số lượng phòng của OTTIMO hay của từng hạng, viết bằng chữ số hay bằng chữ, EN hoặc VI *(sửa 17/10 – AC không chép lại chuỗi đếm phòng; chuỗi cấm cụ thể nằm ở DOM `landing-positioning.md` mục 2.2–2.3 và script kiểm của UXD `concept.md` mục 12.1)*; không có số phòng còn trống hay "chỉ còn x phòng" (kể cả khi lên ESC-020 L7-B – cờ "sắp hết phòng" giữ tắt); dữ liệu cho máy tìm kiếm không khai số phòng (`numberOfRooms`); tên phòng không được liệt kê đủ cả bộ trong một khối để khách tự đếm `[GIẢ ĐỊNH – PO hiểu ý 1 gồm cả cách đếm gián tiếp; INV xác nhận khi duyệt nội dung L5]`. Kiểm: QA quét bản build VI + EN theo danh sách chuỗi cấm của DOM (mục 2.2–2.3) và script UXD (concept 12.1), gồm cả khóa `numberOfRooms` = 0; PO đọc soát.

#### US-148 – Tiện nghi và vị trí – *Must, LP-v1*
- AC1: Given phần Tiện nghi, Then chỉ liệt kê tiện nghi chung INV đã xác nhận, mỗi mục có chữ + biểu tượng (không chỉ biểu tượng – PRD N9); tiện nghi chưa xác nhận không hiện.
- AC2: Given phần Vị trí, Then có địa chỉ đầy đủ (sao chép được), bản đồ, nút "Chỉ đường" mở ứng dụng bản đồ tới đúng ghim INV gửi 17/10 (https://maps.app.goo.gl/oYos42G5YvUEcDCc6 – cấu hình cơ sở, chung với US-108), và các khoảng cách tham khảo INV đã duyệt (ví dụ sân bay Liên Khương, chợ đêm) ghi kèm "khoảng".
- AC3: Given địa chỉ và ghim bản đồ, Then dùng **cùng một nguồn** với trang thông tin lưu trú của app khách (US-108 AC1): sửa một nơi thì cả hai đúng (ARC chọn cách).
- AC4 *(riêng tư)*: Given khách chưa bấm vào bản đồ, Then trang chưa tải nội dung của bên thứ ba có thể theo dõi khách (bản đồ nhúng, script mạng xã hội, widget chat); bấm "Xem bản đồ" mới tải hoặc mở ứng dụng bản đồ. SEC xác nhận danh sách bên thứ ba được phép.

#### US-149 – Tóm tắt chính sách – *Must, LP-v1*
- AC1: Given phần Chính sách, Then có: giờ nhận/trả chuẩn (BR-401) và việc nhận sớm/trả muộn có phụ thu (BR-411, BR-412); cọc đặt trực tiếp (BR-305); hủy và hoàn cọc, gồm ngày cao điểm (BR-309, BR-104); nội quy chính và phí phạt (BR-511); thuê tháng gồm những gì (BR-203, BR-204, BR-206, BR-501); cần giấy tờ tùy thân để khai báo lưu trú theo luật.
- AC2: Given con số trong chính sách (giờ, %, phí), Then đúng giá trị tham số hiện hành của BR lúc dựng trang; chữ pháp lý bản EN là bản đã duyệt (content-guide 5.6), không dịch máy.
- AC3: Given khách đặt qua OTA, Then trang ghi rõ: điều kiện hủy và thanh toán của đơn OTA theo OTA đã đặt (BR-307), chính sách trên trang chỉ áp cho đặt trực tiếp.
- AC4: Given một chính sách đang chờ INV quyết, Then trang không nêu điểm đó; chính sách đổi thì cập nhật ở bản phát hành kế tiếp.
- AC5 *(không chặn mốc trang của cổng LP-v1; bắt buộc trước khi bật form US-155 – SEC mục 6, ARC-05; sửa 17/10)*: Given chân trang, Then có link tới trang quyền riêng tư ngắn VI/EN: trang không dùng cookie theo dõi, chỉ đếm tổng số lượt theo ngày; nhật ký máy chủ giữ theo hạn SEC; link sang Zalo/WhatsApp/Telegram/Viber/Facebook/bản đồ theo chính sách của họ; cách liên hệ OTTIMO. Trước khi bật form US-155, trang có thêm phần dữ liệu của form (mục đích, hạn lưu, phiên bản) – US-155 AC10.

#### US-150 – Câu hỏi thường gặp – *Should, LP-v1*
- AC1: Given phần Câu hỏi thường gặp, Then có các câu INV đã duyệt (gợi ý: đi từ sân bay, đến khuya và check-in online, gửi hành lý, giặt ủi, hóa đơn VAT, thú cưng, chỗ để xe, Wi-Fi và làm việc từ xa, thuê tháng); mỗi câu mở/đóng được bằng chuột, chạm và bàn phím.
- AC2: Given câu trả lời có con số quy tắc, Then theo US-149 AC2; câu INV chưa trả lời (ví dụ thú cưng) thì không đăng.
- AC3 *(SEC DOM-06)*: Given mục Hỏi đáp, Then có câu chống giả danh đã duyệt: OTTIMO chỉ nhắn từ Zalo OA đã xác thực và hộp thư OTA; không bao giờ đổi số tài khoản nhận tiền qua tin nhắn, không hỏi số thẻ.

#### US-151 – Liên hệ: Zalo OA trước, kênh khác, Facebook; nút "Đặt phòng" – *Must, LP-v1*
- AC1 *(sửa 17/10 – FB-INV-002 ý 4; thay thứ tự kênh của ESC-020 L2-A "bản EN xếp WhatsApp/Telegram trước" – bỏ hẳn; xác nhận lại 17/10 theo BA Q-W14: áp cả ô chọn kênh trả lời trong form US-155)*: Given khách bấm "Liên hệ", "Nhận báo giá", hoặc "Đặt phòng" khi form US-155 chưa bật, Then hiện lựa chọn kênh với **Zalo** (mở chat Zalo OA của OTTIMO – trên điện thoại mở ứng dụng Zalo nếu có) **đứng đầu và nổi nhất ở mọi ngôn ngữ**, rồi **Gọi điện** (mở trình gọi với số công khai) và **Email** (mở thư mới tới địa chỉ công khai, tiêu đề điền sẵn "Đặt phòng – OTTIMO"); **WhatsApp · Telegram · Viber** (số quốc tế của cơ sở in trong e-brochure) nằm trong mục **"Kênh khác"** thu gọn (AC7). Trong form US-155, ô chọn kênh trả lời xếp **Zalo đầu tiên và mặc định** ở mọi ngôn ngữ; WhatsApp được đứng ngay sau Zalo (khách nước ngoài) nhưng không mặc định. Ô "Hỏi phòng trống" (nếu UXD giữ) chỉ soạn sẵn tin trên máy khách, không gửi dữ liệu về OTTIMO, không gửi ngày/số khách vào bộ đếm (SEC UXD-03).
- AC2: Given OTTIMO chưa có Zalo OA đã xác thực (ESC-020 L2; INV quyết ESC-021 A 17/10 – INV tạo và xác thực OA, hẹn 19/10), Then nút Zalo dùng Zalo của số điện thoại **cơ sở** (không dùng Zalo cá nhân của nhân viên – SEC INT-13); đổi sang OA chỉ bằng thay cấu hình nội dung, không sửa giao diện.
- AC3 *(sửa 17/10 – FB-INV-002 ý 3)*: Given trang công khai, Then **không** có form nào ngoài form yêu cầu đặt phòng US-155 (chỉ hiện khi công tắc bật – US-155 AC4); trang không lưu dữ liệu cá nhân của khách ngoài form đó và không có link dẫn sang trang OTA.
- AC4: Given sale/lễ tân tạo đơn trực tiếp cho khách đến từ website, Then chọn được nguồn đúng theo BR-112 để đo G3 khi chưa có US-158 (DOM làm rõ: khách xem website rồi nhắn Zalo tính `website` hay `zalo_phone` – câu hỏi nội bộ ở landing-scope mục 9).
- AC5 *(sửa 17/10 – FB-INV-002 ý 3)*: Given công tắc form US-155 bật, Then nút "Đặt phòng" mở form US-155; công tắc tắt thì "Đặt phòng" mở chat Zalo. Khi US-131 phát hành (ESC-020 L7-B), "Đặt phòng" thêm bước phòng trống + giá (US-155 AC9). Zalo, "Kênh khác", gọi, email, Facebook luôn ở phần Liên hệ.
- AC6 *(SEC DOM-05)*: Given trang ở v1 hoặc v2, Then **không** có ô đăng ký nhận ưu đãi/bản tin; thay bằng nút "Quan tâm Zalo OA" (khách tự bấm trên Zalo của mình). Mục "Đặt xong, OTTIMO lo phần còn lại" chỉ hứa ưu đãi lần sau "nếu bạn muốn nhận" (SEC UXD-03).
- AC7 *(mới 17/10 – FB-INV-002 ý 4, Zalo trước)*: Given bất kỳ màn hình nào, Then thanh nút cố định (điện thoại) và đầu trang (máy tính) chỉ có "Đặt phòng" và "Chat Zalo"; WhatsApp, Telegram, Viber **không** xuất hiện ở màn đầu, thanh cố định hay menu chính – chỉ trong mục "Kênh khác" ở phần Liên hệ và trong hộp chọn kênh (AC1), cần **một** lần bấm để mở; vẫn đi được bằng bàn phím và trình đọc màn hình (US-153 AC4). Bản EN cũng để Zalo đầu tiên; ngay dưới nút Zalo có lối phụ cho khách không dùng Zalo: "Gửi yêu cầu đặt phòng" (khi form bật) hoặc "Kênh khác".
- AC8 *(mới 17/10 – FB-INV-002 ý 4, fanpage Facebook)*: Given phần Liên hệ và chân trang, Then có link "Facebook" tới fanpage OTTIMO (https://www.facebook.com/profile.php?id=100091335431646 – lưu ở cấu hình nội dung, đổi được không sửa giao diện), mở ở thẻ mới và không gửi địa chỉ trang nguồn; **không** nhúng nút Thích/Chia sẻ, plugin trang, chat Messenger hay pixel của Facebook (SEC C-1, US-153 AC8); biểu tượng Facebook là tệp tự lưu trên máy chủ OTTIMO và luôn kèm chữ "Facebook" (PRD N9).

#### US-152 – Song ngữ Việt – Anh – *Must, LP-v1*
- AC1: Given khách chọn "English", Then mọi chữ (menu, nút, mô tả ảnh, chính sách, câu hỏi, tiêu đề trang) là tiếng Anh đã duyệt, không còn chuỗi tiếng Việt cố định; mỗi ngôn ngữ có địa chỉ riêng để gửi link và để công cụ tìm kiếm nhận ra.
- AC2 *(sửa 17/10 – ARC viết theo ADR-014 mục 3; **PO xác nhận 17/10**, sprint-4-plan P-S4-5; thay bản cũ "trình duyệt tiếng Anh thì gợi ý EN")*:
  - **Mặc định:** Given khách mở bất kỳ địa chỉ nào của trang, Then trang hiện đúng ngôn ngữ của địa chỉ đó. Tên miền gốc là bản tiếng Anh (Brand Guidelines: tiếng Anh dẫn dắt); bản Việt ở `/vi/`.
  - **Không tự chuyển:** trang **không** tự chuyển sang ngôn ngữ khác theo cài đặt trình duyệt.
  - **Gợi ý:** When ngôn ngữ của trình duyệt, hoặc ngôn ngữ khách đã chọn trước đó, khác ngôn ngữ trang và trang có bản ở ngôn ngữ đó, Then hiện một dải gợi ý nhỏ:
    - viết bằng ngôn ngữ đó, dẫn tới cùng trang;
    - đóng được;
    - không che nút "Đặt phòng", không làm xô lệch bố cục.
  - **Giữ lựa chọn:** khách đã chọn tay (bấm đổi ngôn ngữ, bấm gợi ý hoặc đóng gợi ý) thì giữ lựa chọn đó; trang không tự đổi.
  - **Nút đổi ngôn ngữ:** luôn thấy ở đầu trang trên điện thoại và máy tính.
- AC3 *(INV quyết ESC-020 L1-A 17/10)*: Given bản v1, Then không có nút, đường dẫn `/ru/` hay khai báo hreflang tiếng Nga; tiếng Nga làm ở v2 (US-156, R3).
- AC4: Given chữ EN dài hơn bản VI, Then bố cục không vỡ ở màn 360px (chừa thêm 40% – content-guide mục 6).

#### US-153 – Nhận diện, ảnh, tốc độ, truy cập – *Must, LP-v1*
- AC1: Given trang, Then dùng màu và chữ theo **Brand Guidelines v1.0** (bảng màu 80/15/5 Ivory/Cream/Stone Grey/Ink · Light Oak/Earth Brown · Sage; **không** terracotta; Lora + Be Vietnam Pro + JetBrains Mono tự host) qua token Design System (UXD cập nhật DS v0.4); mọi cặp chữ/nền đạt mức tương phản như design-system mục 2.2; UXD ký duyệt bản dựng.
- AC2: Given điện thoại tầm trung trên mạng 4G, Then phần nội dung lớn nhất của màn đầu hiện trong **≤ 2,5 giây** ở 75% lượt tải (ngưỡng "tốt" của LCP – https://web.dev/articles/lcp) `[GIẢ ĐỊNH – mục tiêu của PO, QA chọn công cụ đo]`; ảnh ngoài màn đầu chỉ tải khi gần tới vùng nhìn.
- AC3: Given ảnh gốc từ Drive (PNG 4–60 MB/ảnh), Then trang chỉ dùng bản đã tối ưu, nhiều cỡ theo màn hình; ảnh gốc không vào git (`00-brief/context/landing/README.md`).
- AC4: Given người dùng chỉ dùng bàn phím hoặc trình đọc màn hình, Then đi qua được mọi menu, nút, thư viện ảnh theo thứ tự hợp lý, có viền focus theo DS, ảnh có mô tả thay thế, không thông tin nào chỉ thể hiện bằng màu (PRD N9); kiểm tự động không còn lỗi mức nghiêm trọng.
- AC5: Given một khe ảnh thiếu hoặc tải lỗi, Then hiện khung giữ chỗ đúng tỉ lệ; bố cục không vỡ, không hiện biểu tượng ảnh hỏng.
- AC6: Given chiều rộng 360px, 768px và ≥ 1280px, Then trang hiển thị đúng, không cuộn ngang.
- AC7 *(SEC UXD-02)*: Given ảnh và e-brochure đưa lên trang, Then không có ảnh cận khóa cửa/bàn phím mã, không thấy số căn cùng cửa sổ nhìn ra phố, không thấy màn hình, giấy tờ, mật khẩu Wi-Fi; ảnh có người đã có đồng ý (ESC-020 L7); PDF đã xóa thông tin ẩn; mã QR Zalo và ảnh bản đồ tự lưu trên máy chủ OTTIMO, bản đồ có ghi công theo giấy phép.
- AC8 *(SEC C-1 – điều kiện cổng LP-v1)*: Given bản dựng production, When mở bất kỳ trang nào, Then **0** yêu cầu tới tên miền ngoài (font tự host, không bản đồ nhúng, không pixel, không widget chat); không có script/style nội tuyến (trừ JSON-LD); header bảo mật theo ADR-014 mục 1.4 qua kiểm tự động không lỗi; Zalo/WhatsApp/Telegram/Viber/Facebook/bản đồ chỉ là link khách bấm mới mở (sửa 17/10 – FB-INV-002 ý 4). Form US-155 chỉ gửi về máy chủ của OTTIMO.

#### US-154 – Tìm kiếm và xem trước khi chia sẻ link – *Should, LP-v1*
- AC1: Given mỗi ngôn ngữ, Then có tiêu đề và mô tả trang riêng đã duyệt và ảnh chia sẻ (khe `og-share`); dán link vào Zalo/Facebook thì hiện đúng ảnh, tiêu đề, mô tả của ngôn ngữ đó (giao thức Open Graph – https://ogp.me).
- AC2: Given công cụ tìm kiếm, Then trang có sơ đồ trang, khai báo các bản ngôn ngữ và dữ liệu có cấu trúc kiểu cơ sở lưu trú (https://schema.org/LodgingBusiness: tên, địa chỉ, điện thoại, ảnh) khớp thông tin đang hiện; bản xem thử/staging gắn `noindex` (hosting-plan 5.1).
- AC3: Given OTTIMO có hồ sơ trên Google Maps, Then tên – địa chỉ – điện thoại trên trang trùng hồ sơ đó (tạo/sửa hồ sơ Google do INV làm).

#### US-155 – Yêu cầu đặt phòng từ website vào Desk – *Must, LP-v1 – FB-INV-002 ý 3, trước đây Should R3*
Phương án: **ESC-020 L7-A** – "yêu cầu đặt phòng": không hiện phòng trống/giá, không giữ phòng, không thanh toán online – **INV chọn A ngày 17/10/2026** (FB-INV-002, mục "Xác nhận của INV"; nhãn giả định đã gỡ). Lên L7-B (thêm bước phòng trống + giá của US-131 theo AC9, các AC khác giữ) hay L7-C (US-132, R4+) là quyết định mới của INV. Thiết kế: ADR-014 mục 4.3–4.6 (nấc L1); điều kiện SEC ở `rounds/round-02/reviews/landing-zalo-SEC.md` (C-2, C-3, ARC-02…ARC-12, SR-RL-11) và `landing-booking-SEC.md` (C-1…C-3, C-11…C-13, ARC-13…ARC-23); quy tắc BR-911…916; đặc tả Desk `product/docs/specs/EP19-website-requests.md`, SM-18. Nút "Đặt ngay" trên fanpage Facebook là **link thường** tới mục `#book` của trang, có UTM theo DOM `landing-positioning.md` 6.3 (PO chốt một link – SEC UXD-07); INV tự đặt khi trang lên mạng (ESC-020 mục "Việc anh/chị tự làm cho fanpage"); form tắt thì mục `#book` mở chat Zalo.

> **ORC 18/10 – phần Desk → R3 Sprint 1 (backlog mục 5.5 R3-Q06):** hàng chờ "Yêu cầu từ website" trên Desk (BE-D list/get/transition theo vai, chuyển thành báo giá/đơn, thông báo, SSE, "Cần chú ý", Q-W09; FE-B S35). Mốc "trang" của LP-v1 không đổi; mốc "form" đi theo (form vốn chỉ bật production từ đầu R3 – sprint-4-plan 16.2a).
- AC1 *(sửa 17/10)*: Given form đang bật (AC4) và khách bấm "Đặt phòng" trên website (VI hoặc EN, kể cả đi từ nút "Đặt ngay" của fanpage), Then khách thấy form ngắn: kiểu ở (ngắn ngày: ngày đến + ngày đi; dài ngày: ngày đến + số tháng), hạng phòng (không bắt buộc), số người lớn/trẻ em, tên gọi, **ít nhất một** cách liên hệ (Zalo, SĐT, WhatsApp hoặc email) và kênh muốn được liên hệ (mặc định Zalo; Zalo đứng đầu ô chọn kênh ở mọi ngôn ngữ – US-151 AC1, BA Q-W14), lời nhắn (không bắt buộc), link thông báo xử lý dữ liệu; ngôn ngữ lấy theo trang. Form **không** hỏi quốc tịch, giấy tờ, ngày sinh, địa chỉ, số thẻ. Ngày và số đêm theo BR-112 (cửa sổ 365 ngày; ngắn ngày 1–27 đêm, từ 28 đêm tính là dài ngày – BR-108); số người theo BR-110. Gửi hợp lệ thì yêu cầu vào hàng chờ "Yêu cầu từ website" trong Desk (AC8).
- AC2 *(sửa 17/10)*: Given một yêu cầu trong hàng chờ, When nhân viên bấm "Chuyển thành báo giá" hoặc "Giữ chỗ", Then nhân viên chọn hoặc tạo hồ sơ khách qua kiểm trùng BR-951 (hệ thống **không** tự gộp theo SĐT/email khách nhập – ADR-014 4.3), rồi mở US-080/US-084 điền sẵn ngày, số người, hạng phòng, ngôn ngữ, kênh liên hệ; *(sửa lần 2, 17/10 – BR-112 v0.3.7, BA Q-W13)* đơn tạo ra có kênh `direct`, nguồn **luôn** `website` do server đặt (BR-112 (a)) – kể cả khi khách đã từng ở hay sale chốt; nhân viên không đổi được nguồn; nguồn phụ (`websiteSubSource`, BR-911) đi theo tới đơn; khách quen vẫn đếm từ hồ sơ khách, hoa hồng theo người chốt (BR-903). Yêu cầu sang trạng thái đã chuyển đơn khi có **giữ chỗ hoặc đơn** (WR6); chỉ lưu báo giá thì yêu cầu vẫn đang xử lý và gắn báo giá (BR-913 v0.3.8, SM-18).
- AC3 *(sửa 17/10 – SEC ARC-02, ARC-04, C-2)*: Given gửi tự động hoặc lặp nhiều lần, Then bị chặn theo giới hạn SEC (SR-RL-11: theo IP, theo liên hệ, trần cả cơ sở mỗi ngày) và ô bẫy; yêu cầu ở **mọi** trạng thái đều có hạn xóa (tự đóng khi lâu không hoạt động, xóa dữ liệu cá nhân sau hạn, trần tuổi tuyệt đối, spam xóa nhanh) theo tham số SEC đặt biên, DOM/PO đặt mặc định – không phụ thuộc việc nhân viên có bấm đóng hay không.
- AC4 *(sửa 17/10 – điều kiện bật trên mạng, thêm LZ-8)*: Given Desk chưa chạy production hoặc chưa đạt kiểm tra SEC cho dữ liệu khách thật (SEC-G1, SEC-G2), **hoặc** chưa có trả lời luật sư **LZ-8** (website có chức năng đặt phòng có phải thông báo Bộ Công Thương không – hoặc OTTIMO đã thông báo) và **LZ-2** (ESC-001), **hoặc** chưa đạt SEC **C-2** (hạn xóa cho mọi trạng thái, kể cả mới và đang xử lý, và trần tuổi tuyệt đối) và **C-3** (thông báo xử lý dữ liệu có phiên bản đã đăng; ô đồng ý không tích sẵn, chỉ một mục đích "để OTTIMO liên hệ trả lời yêu cầu này"; bộ đếm giới hạn nằm trong DB), Then form **không** được bật trên trang công khai: công tắc cấu hình tắt, nút "Đặt phòng" mở chat Zalo (US-151 AC5), form chỉ chạy ở bản thử (`noindex`, chặn truy cập theo SEC ARC-10). Bật/tắt form không cần dựng lại trang.
- AC5 *(SEC ARC-02, ARC-04, ARC-08, DOM-05)*: Given đã chạm trần yêu cầu trong ngày, Then trang báo "đang bận – vui lòng nhắn Zalo hoặc gọi", **không** báo gửi thành công rồi bỏ yêu cầu; phản hồi không cho biết SĐT/email đã từng gửi hay đã có hồ sơ; lời nhắn có số giấy tờ/số thẻ bị từ chối kèm nhắc "không cần gửi giấy tờ ở bước này"; form **không** có ô nhận ưu đãi.
- AC6 *(mới 17/10 – nguồn website, nhãn Facebook)*: Given khách tới form từ link của nút "Đặt ngay" trên fanpage (link gắn nhãn `facebook` – ESC-020 L7) hoặc link khác có nhãn chiến dịch, Then yêu cầu trong Desk hiện nguồn **"Website · Facebook"** (hoặc "Website · {nhãn}"; không nhãn → "Website"); đơn tạo ra vẫn là nguồn `website` theo BR-112 (không thêm nguồn mới); nhãn được giữ cho báo cáo kênh US-158. Nhãn chỉ lấy từ đường link, **không** dùng cookie, pixel hay định danh từng người xem (SEC ARC-11).
- AC7 *(mới 17/10 – phương án L7-A; nhãn chờ INV gỡ 17/10 – INV chọn A; câu hứa sửa theo BR-912 v0.3.7)*: Given khách gửi yêu cầu hợp lệ, Then trang cảm ơn ghi rõ **"Yêu cầu đã gửi – chưa giữ phòng"**, mã tham chiếu, thời gian phản hồi theo **câu hứa công khai BR-912 (4)** – chữ đọc từ tham số, không viết cứng: gửi trong giờ trực (BR-811) → "trong 1 giờ"; gửi ngoài giờ → "trước 09:00 sáng hôm sau"; ngày đến là hôm nay → hiện số gọi (BR-912 (3)) – `[GIẢ ĐỊNH – INV duyệt câu chữ ở L5, trình cùng bản mẫu v1.2.1]` – và nút "Chat Zalo" để nhắn kèm mã; form **không** hiện phòng trống, giá, không giữ phòng, không thu tiền; hệ thống **không** tự gửi email/Zalo tới liên hệ khách nhập (ADR-014 4.3).
- AC8 *(mới 17/10 – hàng chờ trong Desk)*: Given yêu cầu mới, Then hàng chờ "Yêu cầu từ website" trong Desk hiện yêu cầu ở trạng thái mới kèm nguồn (AC6), có thông báo trong app cho `sales_staff` và FD+ (thông báo **không** chứa tên, SĐT, email); nhân viên nhận xử lý, đóng (kèm lý do), đánh dấu spam hoặc mở lại trong hạn lưu; yêu cầu chưa ai nhận quá ngưỡng (tham số DOM, tính trong giờ trực BR-811) hiện ở "Cần chú ý" (US-012) – ngưỡng = chưa có phản hồi đầu sau `web_request_response_minutes` (BR-912 (1)–(2)). *(Thêm 17/10 – BA Q-W09, mốc "form" của LP-v1, `sprint-4-plan.md` 16.3 c:)* quá `web_request_escalate_minutes` vẫn chưa phản hồi → **một** thông báo cho `front_desk_lead` và `manager` (không chứa tên, SĐT, email); yêu cầu có **ngày đến = ngày nghiệp vụ hiện tại** được gắn cờ "đến hôm nay", lên đầu hàng chờ và "Cần chú ý" mức cao nhất, báo ngay người đang trực kể cả ngoài giờ (BR-912 (3)) – chỉ trong app, không SMS/Zalo cho nhân viên ở LP-v1. Quyền xem: FD+ thấy mọi yêu cầu; `sales_staff` thấy yêu cầu mới chưa giao và yêu cầu giao cho mình (SEC ARC-12); `collaborator` không thấy.
- AC9 *(mới 17/10 – đường lên phương án L7-B; nhãn chờ INV gỡ 17/10 – INV chọn A, B là quyết định mới)*: Given INV quyết lên ESC-020 L7-B (chưa có – trình khi lập kế hoạch R3) và US-131 phát hành, Then form thêm bước xem phòng trống + giá tham khảo **trước** các ô liên hệ; hàng chờ Desk, các trường đã có, nguồn `website` và nhãn, cách chuyển thành báo giá **giữ nguyên**; yêu cầu gửi kèm giá khách đã thấy để nhân viên so với giá tính lại – giá đó có chữ ký của server, sai/thiếu chữ ký thì không giữ giá (SEC ARC-18, BR-916 (2)); lịch còn/hết theo hạng là thông tin công khai (INV biết khi chọn B). Trước khi INV chọn B, trang **không** hiện số giá đêm (L3-A) và không hiện số phòng còn trống (US-147 AC6).
- AC10 *(mới 17/10 – ngôn ngữ, quyền riêng tư)*: Given form, trang cảm ơn, thông báo lỗi và trang quyền riêng tư, Then có đủ bản VI + EN đã duyệt (US-152), chữ pháp lý không dịch máy; trang quyền riêng tư (US-149 AC5) có phần dữ liệu của form (mục đích, hạn lưu, phiên bản) **trước** khi bật form.
- AC11 *(mới 17/10 – trạng thái lỗi)*: Given mạng lỗi, máy chủ bận (AC5) hoặc dữ liệu sai, Then form giữ nguyên dữ liệu khách đã nhập, báo lỗi ngay cạnh ô bằng chữ (không chỉ bằng màu), luôn có lối "Nhắn Zalo" để khách không bị kẹt; đi được bằng bàn phím và trình đọc màn hình (US-153 AC4); có trạng thái đang gửi, không gửi trùng khi bấm hai lần.

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
| ESC-019 (giá khi khách tự xin đổi căn trước ngày đến – **INV quyết A 17/10**) | US-024 AC1 (làm rõ), **AC5–AC7** (mới, S4-21); gián tiếp US-139 AC2 (gán căn B7a giữ giá – AC6) |
| ESC-020 (landing page – câu phụ L1–L6; **INV quyết A hết 17/10**; **L7 = A – INV 17/10** – FB-INV-002) | EP19: **L7 = A (mức đặt phòng trên website) → US-155 AC1–AC11, US-151 AC5; B/C (quyết định mới của INV) → US-155 AC9 + US-131 (L7-B), US-132 (L7-C)**; FB-INV-002 → US-146 AC1–AC3, AC5–AC7, US-147 AC1, AC3, AC6, US-151 AC1, AC3, AC7, AC8, US-153 AC8; L1 → US-152, US-156; L2 (đổi 17/10: có yêu cầu đặt phòng vào Desk) → US-151, US-155; L3 → US-147 AC3; L4 → mọi story v1 (ngày lên mạng); L5 → US-146 AC4, US-147, US-148, US-149, US-150; L6 (ảnh) → US-147 AC5, US-153 AC3/AC7. Màu/chữ: INV quyết bằng Brand Guidelines 17/10 → US-153 AC1. Gián tiếp: US-131, US-132 (đích nút "Đặt phòng" ở v2) |
| ESC-021 (Zalo OA chăm sóc khách – **INV quyết A, K1 = A 17/10**) | A → US-126 (nối thật R3 Sprint 2), US-163; mọi phương án → US-161, US-162 (gửi tay khi chưa có Zalo); K1 → US-116 phần (b), US-040; gián tiếp US-034, US-138, US-151 (nút Zalo OA trên landing) |
| ESC-023 (rút ngắn đơn trực tiếp/CTV khi còn < 7 ngày – **chờ INV**, đội đề xuất B; mở 17/10) | Nếu B hoặc C: thêm AC phí rút ngắn vào **US-024** (đổi ngày/đổi căn trước ngày đến B7/B8) và đối chiếu **US-021** (hủy) – R3, trước vận hành thật; BR-309 do DOM viết lại. Nếu A: không đổi AC. Không ảnh hưởng đơn OTA (BR-310), dài hạn (EP11) |
| ESC-024 (khi quản lý không trả lời yêu cầu xác nhận "phụ thu trả muộn bằng giá 1 đêm" – **chờ INV**, đội đề xuất B; mở 18/10) | **US-164** AC4 (hết hạn – làm theo phương án INV chọn), BR-416 (DOM viết lại nếu B/C), US-006 (nhật ký hậu kiểm) – R3 |

### 5.5 Hàng chờ R3 – việc dời từ tuần Ổn định Sprint 4 (PO 18/10, P-S4-20)

Việc đã quyết làm ở R3 nhưng chưa thành story hoặc AC riêng. PO chuyển thành AC/story khi lập `rounds/round-03/plan.md`. Mục gắn story có sẵn thì không đổi số story. "Must R3" = phải xong trước bản phát hành ứng viên (RC) cuối R3.

| Mã | Việc | Gắn story | Ưu tiên | Sprint R3 dự kiến | Vai | Nguồn |
|---|---|---|---|---|---|---|
| R3-Q01 | "OTTIMO hủy đơn vì lỗi của cơ sở → hoàn đủ cọc, không phí" (BR-309-18; thẻ `pendingFix` `R3-OTTIMO-FAULT-CANCEL`): mã lý do mới, nới CHECK, nhánh hoàn đủ trong `cancellationQuote`, màn Desk. R2 tạm: MGR miễn qua đường duyệt BR-433 | US-021 (thêm AC) | **Must R3** (tiền) | Sprint 1 | BE-A, BE-B, FE-A, DOM (gỡ `pendingFix` BR-309-18), QA | decision-log 18/10 ORC gộp #10; `br-examples.json` BR-309-18; `s4-be-a.md` 15.3 |
| R3-Q02 | K11-06 hướng (b): khi folio của đơn đã đóng (`cancelled`/`no_show`) đổi thì chạy lại `refundPlan` (BR-522: yêu cầu chờ duyệt tự hủy, tạo lại đúng số dư thừa). R2 giữ hướng (a): `addFolioLine` 409 với mọi vai | US-021 | **Must R3** nếu R3 mở đường ghi nào vào folio đơn đã đóng (DOM-S4-17 "khách để lại"); không thì Should | Sprint 1 (cùng DOM-S4-17) | BE-B, DOM (BR-522-06), QA | decision-log 18/10 DOM K11-06; `reviews/s4-money-recheck5b.md`; BUG-R2-176 |
| R3-Q03 | Quản lý xác nhận từ xa trên thiết bị của mình (PIN/2FA) cho BR-416-06 và mọi đường cần quản lý xác nhận tại quầy; phần "quản lý không trả lời" theo INV quyết ESC-024 | US-164 (có sẵn) | **Must R3** | Sprint 1–2 (cùng US-143) | ARC, SEC, BE-A, FE-A | decision-log 18/10 PO (SEC ARC-25); ESC-024 |
| R3-Q04 | BE-A: cổng đọc `stay-port.stayRoomsOf` (các căn của một lượt ở, để module khác thôi đọc thẳng bảng đơn – xem `reviews/s4-ARC.md` FB-R2-ARC-BE-S4-03) và `previewSwapRoom` (contract-ahead `x-round: R3`: xem trước + "đã báo khách" cho `swapRoom`, cùng hàm tính như B7) | US-024 (`swapRoom` trên Desk – Should R2 đã cắt ở bước 1) | Should R3; `previewSwapRoom` bắt buộc trước khi Desk có nút `swapRoom` | Sprint 1 | BE-A, ARC, FE-A | ORC 18/10; decision-log 17/10 ARC 0.3.7 bổ sung 4 (3) |
| R3-Q05 | Xuất báo cáo + dữ liệu theo kỳ ra bảng tính (ZIP CSV, che dữ liệu khách, chỉ `owner`, nhật ký `export`) | US-104 (có sẵn) | **Must R3** (INV chọn A 17/10) | Sprint 2 | BE-D, DATA, SEC, ARC, BA, FE-B | decision-log 17/10 INV; backlog US-104 |
| R3-Q06 | Phần Desk của yêu cầu đặt phòng từ website: hàng chờ, list/get/transition theo vai, chuyển thành báo giá/đơn, thông báo, SSE, "Cần chú ý", Q-W09 (`arrivesToday`, `website_request_overdue`); FE-B màn S35 | US-155 (LP-v1) | **Must** (LP-v1, mốc "form") | Sprint 1 | BE-D, FE-B, SEC, QA | ORC 18/10; sprint-4-plan 16.1, 16.3 c |
| R3-Q07 | BE-C: `transitionHkTask` từ chối `performedAt` sớm hơn `hk_task.created_at`, và `complete` sớm hơn `started_at` (ARC FB-R2-ARC-BE-S4-05) – nếu không làm cùng FB-R2-ARC-BE-S4-01 ở tuần Ổn định | US-053, US-054 | Should R3 (P3) | Sprint 1 | BE-C | ORC 18/10; `s4-be-b.md` mục 17; `reviews/s4-money-recheck5.md` (BUG-R2-163) |
| R3-Q08 | BE-A: `activeRootBookings` (`reservations/public/stay-view.ts`) lấy `LIMIT 2000` rồi mới lọc → J16 có thể bỏ sót đơn mới khi có hơn 2.000 đơn mở. Lọc trước rồi giới hạn (cùng kiểu sửa BUG-R2-170) | US-042, US-047 | Should R3 (lưới an toàn; 10 căn chưa chạm ngưỡng) | Sprint 1 | BE-A | ORC 18/10; `s4-be-c.md` (ghi chú cho BE-A) |
| R3-Q09 | SEC gợi ý: ở B18 phụ thu trả muộn bằng giá 1 đêm, kiểm 403 theo vai người gọi **trước** khi kiểm mật khẩu người xác nhận (giả định BE-A r5-2) | US-029, US-164 | Should R3 – xong trước bản dùng thử cuối R3, cùng nhóm SEC ARC-24, ARC-26, FE-08 | Sprint 1 | BE-A, SEC | ORC 18/10; decision-log 18/10 BE-A vòng sửa 5 (r5-2); `reviews/s4-SEC-lateFee-reauth.md` |
| R3-Q10 | K11-08: màn đếm minibar của HK trên PWA (H20.4) bắt buộc gửi `periodId` + `roomId`; ARC quyết server bắt buộc `periodId` với vai HK (hoặc tủ đã có kỳ khác `check_in`) **trước khi** MOB làm màn | US-068, US-035 | **Must R3** – điều kiện trước khi phát hành H20.4 (tiền minibar) | Sprint 1 | ARC, MOB, BE-B, QA | ORC 18/10; `reviews/s4-money-recheck5b.md` K11-08; `qa/bug-list.md` (cấp số K11) |
| R3-Q11 | PWA báo cho buồng phòng khi việc bổ sung minibar (`minibar_refill`) bị hủy (đếm lại dùng 0 – `reconcileRefillTasks`): dùng thông báo `hk_task_cancelled` sẵn có, hiện trên chuông và thẻ việc | US-068, US-054 | Should R3 | Sprint 1 | MOB (BE-C, BE-B) | ORC 18/10; decision-log 18/10 BE-B vòng sửa 5 |
| R3-Q12 | Dòng "Đồng bộ kênh lỗi" (`channel_sync_error`, critical, hướng dẫn đóng bán thủ công trên extranet) + job J18 `outbox.dispatch` (retry, trạng thái `dead`) | US-012 AC7, US-096 | **Must R3** (cùng nối channel manager, trước RC) | Sprint 2 (cùng US-096) | INT, BE-D, FE-B, QA | PO 18/10 P-S4-14 |
| R3-Q13 | Thông báo chủ động J4 "quá giờ trả phòng" cho FD + MGR (12:00 nếu căn có khách đến hôm nay, 12:31 nếu không – BR-425); ARC thêm loại thông báo vào hợp đồng | US-031 AC1, US-034, US-161 | **Must R3** | Sprint 1 | ARC, BE-D, FE-B, QA | PO 18/10 P-S4-15 |
| R3-Q14 | H24 bản 24.2 "Tổng quan" rút gọn cho FDL/FD (mã đã có, chưa bật – bật bằng `session/nav.ts`); UXD sửa thẻ vai H02 2.2 trước khi bật | US-010, US-013 | Should R3 | Sprint 2 | FE-B, UXD | `rounds/round-02/responses/s4-FE.md` (FE-B mục D); QC `qc/s4-gate-readiness.md` mục 2 (c) |
| R3-Q15 | T13: xóa `note` của yêu cầu khách sau `retention.guest_request_months` (phần R3 của J16) | US-109, US-110 | **Must R3** – trước khi có dữ liệu khách thật (bản dùng thử) | Sprint 1 | BE-D, SEC | `s4-be-d.md` mục 6; QC `qc/s4-gate-readiness.md` mục 2 (c) |
| R3-Q16 | Hiện ngày "mở bán lại từ …" **trước khi lưu** trên Desk S11 và PWA H22 (ARC thêm `BookingRules.oooReopenBufferDays` hoặc tính thử) | US-061 AC1 | Should R3 | Sprint 2 | ARC, FE-B, MOB | PO 18/10 P-S4-16; đề nghị của FE-B, MOB |
| R3-Q17 | SEC Major dời có hạn (4 thẻ): **BE-65** ảnh phiếu sự cố và ảnh kiểm phòng chưa có hạn lưu (thay điểm 2 của BE-38); **BE-74** J25 chỉ ẩn danh tên, còn giữ SĐT/email/công ty của hồ sơ "từ giấy tờ"; **BE-75** hồ sơ của đơn hủy, no-show hoặc thành viên bị bỏ khỏi đoàn không có mốc hạn lưu; **BE-79** `updateGuestDocument` đổi người của giấy tờ nhưng không gỡ khóa giấy tờ và `last4` trên hồ sơ cũ. (BE-73 không dời – đã Verified 18/10, SEC ký S4-11/S4-32) | US-049, US-057, US-055, US-043 | **Must** – hạn **trước khi có dữ liệu thật** (cùng cổng ESC-001) | Sprint 1 | BE-C (BE-B review guests, folio-lines), SEC | decision-log 18/10 ORC "dời có hạn các Major SEC Sprint 4" và ORC "SEC BE-73/BE-78(a) Verified" (BE-79); `reviews/s4-SEC.md` dòng 31–34, mục C.10 (FB-R2-SEC-BE-79) |
| R3-Q18 | Nhóm Minor/Suggestion của SEC Sprint 4: BE-66 (ghi chú phục vụ lộ chữ tự do với HK), BE-67 (HK nhận họ tên đầy đủ), BE-68 (`performedAt` lùi trước lúc tạo việc/nhận phòng), BE-69 (`deviceTrusted` không xét `client_origin`), BE-70 (tên căn của đoạn lưu trú chưa hiệu lực), BE-71 (MT không mở được ảnh HK chụp), BE-72, BE-76 (giới hạn 20 yêu cầu/ngày vượt khi gửi song song), BE-77 (luật B-15 V2 – làm cùng PR yêu cầu khách của BE-D), BE-78, MOB-03 (xóa IndexedDB khi hết phiên), MOB-04 (`CARD_NUMBER_DETECTED` ở guest-web), OPS-04 | US-052, US-053, US-054, US-062, US-108, US-109, US-110, US-142 | Should – hạn **trước bản dùng thử cuối R3** (làm sớm ở tuần Ổn định nếu kịp) | Sprint 1 | BE-B, BE-C, BE-D, MOB, OPS, SEC (Verified) | decision-log 18/10 ORC "dời có hạn các Major SEC Sprint 4"; `reviews/s4-SEC.md` dòng 31–34 |
| R3-Q19 | **BUG-R2-208** (P2) – N-7 theo số: A32 giảm dòng trên folio `settled` trong cửa sổ được khi phần giảm ≤ còn phải thu − `openDebtVnd`, vượt → 409; cổng `openDebt` trả null khi `openDebtVnd` = 0; N-15 (folio quá cửa sổ coi như `closed`); hợp đồng đi trước `Folio.totals.openDebtVnd` cho Desk. Theo **ARC 16.31** (16.31.1) và nguyên tắc "một định nghĩa công nợ" | US-036, US-037, US-138, US-119 | **Must R3** (tiền) | Sprint 1 – **hạn trước bản dùng thử**; thứ tự cài 207 → 210 → **208**; trong **lượt kiểm tiền riêng** R3 (critic đọc log gốc – điều kiện C1 cổng S4) | DOM, ARC; BE-B, BE-A, FE-A; **SEC review trước gộp** (điều kiện ghi ở `s4-SEC.md`); QA (oracle 16.31.1, mức lỗi tiền mặc định P0) | QC `qc/s4-qc-gate.md` K10, mục 7; decision-log 18/10 ARC 16.31, ORC "xếp lịch 208/209/210"; `outputs/ARC/openapi-0.3.7.md` 16.31; `reviews/s4-money-recheck8.md` |
| R3-Q20 | **BUG-R2-209** (P2) – J15 ghi phần chênh khi hết cửa sổ: nối vào công nợ đang mở hoặc mở công nợ mới theo **ARC 16.31.2 (chọn b)**, ghi nhật ký + thông báo phần tăng (BR-427 (d)) | US-036, US-138, US-119 | **Must R3** (tiền) | Sprint 1 – **hạn trước bản dùng thử**; cùng lượt kiểm tiền R3-Q19 | ARC, BE-A, BE-B, DOM, QA | QC K10, mục 7; `openapi-0.3.7.md` 16.31.2; decision-log 18/10 DOM BR-525/BR-427 (d) |
| R3-Q21 | **BUG-R2-210** (P3, **có lệch tiền** trên dữ liệu ghi trước migration 0076) – sửa số nợ cũ; tới khi sửa giữ thủ tục OPS (điều kiện C2: không nâng tại chỗ, không dựng staging từ dump, demo chỉ cập nhật bằng `demo-up.sh`) | US-036, US-119 | **Must R3** (tiền) | Sprint 1 – **hạn trước bản dùng thử**; cài **trước** R3-Q19 (207 → 210 → 208); cùng lượt kiểm tiền | BE-A; OPS (thủ tục C2); ARC; QA | QC K10, C2, mục 7; decision-log 18/10 OPS, ORC; `outputs/OPS/s4-env-0076.md` |
| R3-Q22 | **FB-R2-SEC-BE-83** – chống chia nhỏ xóa nợ dưới giá 1 đêm: hạn mức "mỗi lần" của MGR cho `debt_write_off` tính trên tổng cộng dồn của cùng công nợ (gồm yêu cầu đang xét), vượt → chờ OWN (BR-433 (a)(b)(c), BR-525 ghi chú [R3] – DOM 18/10). **Thẻ `pendingFix` trong `product/tests/fixtures/br-examples.json`: `R3-SEC-BE-83`** (BR-525-26, BR-525-27 và các dòng cùng thẻ) – gỡ khi cài xong | US-007, US-102 | **Must** – hạn **trước khi có dữ liệu thật** (cùng cổng ESC-001, như R3-Q17) | Sprint 1; mã tiền → đi cùng lượt kiểm tiền R3 | BE-B (folio/approvals), DOM (oracle), SEC (Verified), QA | QC K10; `reviews/s4-SEC.md` C.13; decision-log 18/10 DOM "FB-R2-SEC-BE-83" |
| R3-Q23 | ARC **FB-R2-ARC-BE-S4-17** (đóng công nợ thì tự hủy yêu cầu `debt_write_off` đang chờ – bỏ lệch mock Desk), **-18** (`effectiveAmountVnd` của yêu cầu chờ trừ `openDebtVnd`, cổng đọc không khóa), **-19** (khóa đơn con `ORDER BY id`) | US-007, US-036, US-140 | Should R3 (Minor) – 17/18 chạm đường xóa nợ nên đi cùng lượt kiểm tiền | Sprint 1 – hạn trước bản dùng thử | BE-A, BE-B; ARC (Verified) | QC K10, mục 7; `openapi-0.3.7.md` 16.30–16.31 (thẻ BE-S4-17…19); decision-log 18/10 ORC gộp #19 (dời 17/18) |
| R3-Q24 | **N-11** (A04 `confirmDeposit`): `touch` folio chạy trước khi giữ L3 – R3 lấy L2 → L3 trước khi ghi phiếu thu, bỏ ngoại lệ E4 (ARC đã ghi 16.19/16.31) | US-086, US-119 | Should R3 (Note, P3) | Sprint 1 – cùng lượt kiểm tiền | BE-B; ARC (Verified) | QC K10, mục 7; `reviews/s4-money-recheck8.md` (N-11); `openapi-0.3.7.md` E4 |
| R3-Q25 | **FB-R2-SEC-BE-82** (Suggestion): (a) 403 theo trường trong handler cũng ghi `access.denied`; (b) MGR tự áp `debt_write_off` phải xác thực lại như khi duyệt | US-007, US-164 | Should R3 – làm cùng R3-Q22 nếu tiện | Sprint 1 – hạn trước bản dùng thử | BE-B, ARC; SEC (Verified) | QC K10; `reviews/s4-SEC.md` C.12 |
| R3-Q26 | Đọc chéo bảng giữa module (không tiền): ARC **FB-R2-ARC-BE-S4-03** phần đọc chéo (housekeeping đọc thẳng bảng đơn/khách – gồm **phần còn lại của BUG-R2-186** sau khi QA tách) và **FB-R2-ARC-BE-S4-09** phần đọc chéo (guest-portal đọc bảng housekeeping/reservations/platform – phần tiền đã làm ở R2); thêm test kiến trúc dò SQL bảng ngoài vùng | US-053, US-054, US-109, US-110 | **Must R3** (Major phần dời) | Sprint 1 – hạn trước bản dùng thử | BE-C, BE-D (+ BE-A, BE-B cổng); ARC (Verified, test kiến trúc) | QC K6, K10, mục 7; `reviews/s4-ARC.md` S4-03, S4-09; `qa/bug-list.md` BUG-R2-186 |
| R3-Q27 | ARC **FB-R2-ARC-BE-S3-16** – gỡ vòng provider che bằng `ModuleRef` (payments ↔ files ↔ reservations): dùng `ReservationReadPort`, tiêm ở constructor, chuyển token `ATTACHMENT_USAGE` sang `files/public`, test kiến trúc cấm `ModuleRef` trong `src/modules/**` | US-119, US-045 | **Must R3** (Major dời) | Sprint 1 – hạn trước bản dùng thử | BE-B, BE-C, BE-A; ARC (Verified) | QC K10, mục 7; `reviews/s3-ARC.md` FB-R2-ARC-BE-S3-16 |
| R3-Q28 | ARC **FB-R2-ARC-BE-S3-15 điểm (e)** + lần đọc `reservation_guest` của **BUG-R2-205**: registration thôi đọc thẳng `reservation_guest`/`reservation.booker_guest_id`, đi qua cổng đọc của reservations; gộp ARC **FB-R2-ARC-BE-S4-24** (`partyOverCount` dùng `hooks.partyCount` hoặc cổng đọc) | US-043, US-044, US-046 | **Must R3** (Major phần dời, không tiền) | Sprint 1 – hạn trước bản dùng thử | BE-C (+ BE-A cổng); ARC (Verified – cùng review K7) | QC K7, K10, mục 7; `reviews/s3-ARC.md` dòng 272; `qa/bug-list.md` BUG-R2-205 |
| R3-Q29 | **BUG-R2-123** (P3) – `move-preview` nhận `overbookingResolution` để có bản tính thử cho B7a khi đơn đang xung đột | US-024, US-139 | Should R3 (P3, chạm tiền) | Sprint 1 – **trong lượt kiểm tiền** (điều kiện C1) | BE-A, ARC; QA | QC C1, mục 7; `qa/bug-list.md` BUG-R2-123 (A-CH-06) |
| R3-Q30 | **Fuzz công nợ** (QA): chuỗi thao tác ngẫu nhiên so với hàm tham chiếu đọc sổ, kiểm bất biến BR-525 (ii) sau mọi thao tác (ghi nợ B18, J15, thu, đảo khoản thu nợ, xóa nợ tự áp/duyệt, A32 tăng/giảm, FOC); đề bài gồm các khoảng hở tiền QC liệt kê ở mục 7 (FOC qua nhánh dòng đêm, công nợ trên đơn con, đơn dài hạn, nhiều tổ chức, đảo khoản thu trên folio `closed`) | US-036, US-138, US-119 | **Must R3** (tiền) | Sprint 1 – **hạn trước bản dùng thử**; chạy trên bản đã cài R3-Q19…Q21 | QA (critic đọc log gốc); DOM (oracle) | QC K10, A-CH-04, mục 7; `reviews/s4-money-recheck8.md` (cách chặn lớp lỗi); `openapi-0.3.7.md` bảng việc 16.31 |
| R3-Q31 | 3 cảnh báo Dependabot mức trung bình trên repo công khai (`react-router` ×2, `esbuild`): SEC phân loại, quyết nâng hay chấp nhận có hạn; làm cùng phân loại 6 PR Dependabot (điều kiện C9) và toolchain FE (S4-16 R3) | – (kỹ thuật) | Should R3 – hạn trước bản dùng thử | Sprint 1 | SEC (OPS hỗ trợ, FE nâng nếu cần) | decision-log 19/10 ORC "ESC-025 xong"; QC K11 (4), C9 |
| R3-Q32 | **Mã cửa theo INV 19/10**: mã ngẫu nhiên 8 số, bỏ cách đặt mã cũ. DOM sửa BR-403 (mã mặc định, độ dài) và ví dụ liên quan; INT cập nhật ESC-011/đặc tả khóa thông minh; ARC/BE đổi tham số nếu có; UXD/QA cập nhật chữ và ca. Không ghi cách đặt mã hay thông tin an ninh vật lý vào tài liệu (repo công khai) | US-128, US-130, US-108 | **Must R3** (quyết định INV) | Sprint 1 – hạn trước bản dùng thử | DOM, INT; ARC, BE-C; UXD, QA; SEC review | decision-log 19/10 INV (ESC-025 – mã cửa); decision-log 15/10 dòng khóa cửa |
| R3-Q33 | **FB-R2-SEC-BE-84** (Minor, rủi ro Low – tách từ BE-65 sau khi Verified 19/10): (a) ảnh đã gắn mà thiếu mốc hạn lưu (`anchor_missing` của `retention_run`) phải có người được báo – mục "Cần chú ý" `attachment_retention_anchor_missing` cho OWN/MGR **hoặc** cảnh báo OPS từ `retention_run` (người nhận OWN); (b) `upload` đọc trạng thái đơn với khóa `FOR SHARE`, có test song song với trả phòng (ảnh `penalty_evidence` tải trong cửa sổ trước khi trả phòng commit) | US-049, US-012, US-043 | **Must** phần (a) – hạn **trước khi có dữ liệu thật** (cùng cổng ESC-001, như R3-Q17); phần (b) Should | Sprint 1 | BE-C; ARC + UXD + FE-A nếu chọn mục "Cần chú ý", hoặc OPS nếu chọn cảnh báo; SEC (Verified) | ORC 19/10; `reviews/s4-SEC.md` mục C.15, FB-R2-SEC-BE-84 |
| R3-Q34 | ARC **FB-R2-ARC-BE-S4-23** (Minor): guest-web tải giấy tờ với số ô cũ sau khi lễ tân bỏ người và dồn ô → ảnh gắn nhầm người trong đoàn. `guestProgress` trả `slotsVersion`, guest-web gửi kèm khi tải; lệch → 409 `CONCURRENT_UPDATE`, tải lại danh sách ô; test dồn ô rồi tải bản cũ → 409 | US-107, US-043 | Should R3 (dữ liệu cá nhân – lẫn ảnh giấy tờ) – hạn trước bản dùng thử | Sprint 1 | BE-C, MOB (guest-web); ARC (Verified) | ORC 19/10; `reviews/s4-ARC.md` FB-R2-ARC-BE-S4-23 |
| R3-Q35 | ARC **FB-R2-ARC-BE-S4-25** (Suggestion): dồn `person_index` có thể làm lệch quyết định P02b nếu sau này mở P02b cho ô ≥ 2 trên guest-web – thêm chú thích bất biến ở `onPartyMemberRemoved` + test khóa (P02b `personIndex` ≠ 1 → 422); khi mở ô ≥ 2 thì ghi bản sao quyết định gắn `guest_document_id` | US-107, US-045 | Should R3 (Suggestion) – trước khi mở P02b cho ô ≥ 2 | Sprint 1 | BE-C; ARC | ORC 19/10; `reviews/s4-ARC.md` FB-R2-ARC-BE-S4-25 |
| R3-Q36 | ARC **FB-R2-ARC-FE-S4-01** (Minor): `useBusinessDay` của Desk chỉ tính lại khi render → màn mở qua mốc đổi ngày giữ ngày D-1 cho mặc định và `min`. Hẹn giờ tới mốc đổi ngày kế tiếp hoặc tính lại khi tab được focus (`visibilitychange`). Không sai tiền (server kiểm lại, trả 422) | US-018, US-024 | Should R3 (Minor) – hạn trước bản dùng thử | Sprint 1 | FE-A; ARC (Verified) | ORC 20/10; `reviews/s4-ARC.md` mục F; BUG-R2-211 |
| R3-Q37 | ARC **FB-R2-ARC-MOB-S4-01** (Minor): PWA bỏ hằng `BUSINESS_DAY_ROLLOVER = '06:00'` – đọc ngày kinh doanh từ server (tạm `getRack({days:1}).today` khi trực tuyến, lưu kèm bản offline; đích là trường mới của R3-Q38); hằng 06:00 chỉ dùng khi chưa từng đọc được | US-054, US-061 | Should R3 (Minor) – hạn trước bản dùng thử | Sprint 1 (sau R3-Q38 nếu có kịp) | MOB; ARC (Verified) | ORC 20/10; `reviews/s4-ARC.md` mục F |
| R3-Q38 | ARC **FB-R2-ARC-FE-S4-02** (Suggestion – hợp đồng 0.3.8, cộng thêm, không phá vỡ): `Me.property.businessDate` + `businessDayRollover` cho mọi vai (nguồn chung Desk và PWA, lưu được offline); `BookingRules.businessDayRollover`. Khi có: FE bỏ nhánh `getRack` trong `useBusinessDay`, MOB bỏ hằng 06:00 | US-005, US-018 | Should R3 – không chặn bản dùng thử (server luôn kiểm lại) | Sprint 1 | ARC (hợp đồng); BA nếu đổi rbac trường; FE-A, MOB dùng | ORC 20/10; `reviews/s4-ARC.md` mục F |
| R3-Q39 | Phần còn lại của bảng **"Rà ngày kinh doanh"** (BUG-R2-211, `outputs/FE/s4-report.md`): các chỗ P3 còn dùng ngày lịch thay ngày kinh doanh (#7…#19 chưa sửa ở đợt 27), trong đó **#8–#12 chạm tiền** (giá niêm yết `effectiveFrom`, tham số `effectiveFrom`, chặng hiện tại lấy tủ minibar lúc trả phòng, hạn công nợ, gợi ý "đã thực hiện" khi no-show); gồm **hai lỗi so sánh `<`/`≤`**: hạn công nợ (Desk coi `debtDue < today` là đã qua trong khi server cần `due > today` → ban ngày lệch 1 ngày) và gợi ý no-show. Dùng chung nguồn ngày của R3-Q36/Q38; mock MSW cũng đổi sang ngày kinh doanh | US-005, US-035, US-036, US-136, US-024 | Should R3 (P3) – #8–#12 **đi trong lượt kiểm tiền** R3 Sprint 1 (điều kiện C1); hạn trước bản dùng thử | Sprint 1 | FE-A; ARC (duyệt), QA (đồng hồ giả 02:40/06:00, xếp mức lỗi tiền) | ORC 20/10; `outputs/FE/s4-report.md` mục "Rà ngày kinh doanh"; BUG-R2-211 |
| R3-Q40 | Webhook Zalo theo `product/docs/integrations/zalo-oa.md` 4.12-A: giới hạn kích thước/tần suất, chữ ký trên byte thô (so sánh an toàn thời gian), kiểm `app_id`/`oa_id`, cửa sổ `timestamp`, chống lặp bằng khóa duy nhất `inbox_message`, 401 không chi tiết, không ghi body vào log, 4 ca mock. Xác minh dạng chữ ký trên tài liệu Zalo + OA thật | US-126 | **Must R3** – trước khi bật webhook (US-126 Sprint 2); điều kiện [CHẶN] C-4 của SEC | Sprint 2 | INT + BE; SEC review | FB-R2-SEC-INT-07; INT 21/10 (R-2 cổng QC R2); `responses/INT-responses.md` mục "Bước 4 sau cổng QC (R-2)"; `reviews/landing-zalo-SEC.md` |
| R3-Q41 | Kết nối Zalo OA: bảng `integration_credential` mã hóa (`CryptoService`), OAuth chỉ OWN + xác nhận lại mật khẩu, `state` gắn phiên + PKCE, từ chối OA khác `ZALO_OA_ID`, làm mới token an toàn, bí mật dạng `_FILE`, kiểm khi khởi động lúc `ZALO_PROVIDER=zalo` | US-126 (AC1) | **Must R3** – trước kết nối thật; điều kiện [CHẶN] C-5. Cần App Zalo + OA đã xác thực của INV (ESC-021) | Sprint 2 | INT + BE + ARC; SEC review | FB-R2-SEC-INT-08; INT 21/10 (R-2 cổng QC R2); `responses/INT-responses.md` mục "Bước 4 sau cổng QC (R-2)"; `reviews/landing-zalo-SEC.md` |
| R3-Q42 | Token thông báo `purpose=notify` (4.12-B: ≤ 1 token thông báo/đơn, tổng ≤ 3, token gốc chỉ trong bộ nhớ, chỉ gửi tới liên hệ đã xác nhận, audit mỗi lần cấp) + ARC sửa ADR-006 điểm 4 + cờ "liên hệ đã xác nhận" | US-161 (AC5) | **Must R3** – điều kiện [CHẶN] C-6 | Sprint 1 (cùng US-161 AC5) | BE + ARC; SEC review | FB-R2-SEC-INT-09 (quyết định SEC 17/10); INT 21/10 (R-2 cổng QC R2); `responses/INT-responses.md` mục "Bước 4 sau cổng QC (R-2)"; `reviews/landing-zalo-SEC.md` |
| R3-Q43 | Tin marketing Zalo: chỉ gửi khi có `consent_record` P06 của chính người nhận (follow OA không thay được), không gửi khách OTA, token hủy đăng ký HMAC riêng + trang hủy, xử lý mã từ chối của Zalo, lễ tân tắt được | US-116 (b), US-077 | **Must R3** – trước tin marketing đầu tiên; điều kiện [CHẶN] C-8 | Sprint 2–3 (cùng US-116 (b)) | BE + INT + FE; SEC review | FB-R2-SEC-INT-11; INT 21/10 (R-2 cổng QC R2); `responses/INT-responses.md` mục "Bước 4 sau cổng QC (R-2)"; `reviews/landing-zalo-SEC.md` |
| R3-Q44 | Hướng dẫn vận hành chat OA cho nhân viên (4.12-E: OA Manager bản web trên máy cơ sở, mỗi người một tài khoản, gỡ quyền trong ngày, không nhận ảnh giấy tờ qua chat…) + SEC sửa SR-DEV-07/08 | US-126 (vận hành); hướng dẫn vận hành R3 | Should R3 – hạn trước khi lễ tân chat OA với khách thật | Sprint 2 | DOM + SEC; UXD biên tập | FB-R2-SEC-INT-12; INT 21/10 (R-2 cổng QC R2); `responses/INT-responses.md` mục "Bước 4 sau cổng QC (R-2)"; `reviews/landing-zalo-SEC.md` |
| R3-Q45 | Thông tin bên nhận dữ liệu Zalo/VNG (tên pháp nhân, nơi lưu, vai bên xử lý theo điều khoản ZBS) → SEC cập nhật DRA P11 và thông báo xử lý dữ liệu cho khách | US-126, US-161 | **Must R3** – trước tin tự động đầu tiên; điều kiện [CHẶN] C-9 điểm 1; phụ thuộc luật sư (ESC-001) | Sprint 1 | INT → SEC; luật sư qua ESC-001 | FB-R2-SEC-INT-14 điểm 1; INT 21/10 (R-2 cổng QC R2); `responses/INT-responses.md` mục "Bước 4 sau cổng QC (R-2)"; `reviews/landing-zalo-SEC.md` |

- Đếm: **45 mục** – **25 Must** (R3-Q01, 02 có điều kiện, 03, 05, 06, 10, 12, 13, 15, 17, 19, 20, 21, 22, 26, 27, 28, 30, 32, 33 phần (a), 40, 41, 42, 43, 45), **20 Should** (R3-Q04, 07, 08, 09, 11, 14, 16, 18, 23, 24, 25, 29, 31, 34, 35, 36, 37, 38, 39, 44). R3-Q19…Q32 thêm 19/10 theo QC cổng S4 K10 (`rounds/round-02/qc/s4-qc-gate.md`); R3-Q33…Q35 thêm 19/10 theo ORC (SEC-BE-84, ARC S4-23, S4-25); R3-Q36…Q39 thêm 20/10 theo ORC (ngày kinh doanh – BUG-R2-211). R3-Q40…Q45 thêm 21/10 theo ORC (INT đề nghị sau R-2 cổng QC R2 – thẻ SEC `landing-zalo-SEC.md`; các điều kiện [CHẶN] C-4…C-9 của SEC giữ tới khi cài xong và SEC xác nhận).
- **Thẻ `pendingFix` trong `br-examples.json` ↔ hàng chờ:** `R3-OTTIMO-FAULT-CANCEL` → R3-Q01; `R3-SEC-BE-83` → R3-Q22; `BUG-R2-208` → R3-Q19; `BUG-R2-209` → R3-Q20.
- **Lượt kiểm tiền riêng R3 Sprint 1** (điều kiện C1 cổng S4): gồm R3-Q19, Q20, Q21, Q22, Q23 (phần 17/18), Q24, Q29, Q39 (#8–#12), chạy Q30; mặc định lỗi tiền P0 tới khi chứng minh.
- Mục đã có story (US-104, US-155, US-164) không làm tăng số story; Must R3 vẫn 30.
- Cũng là R3 nhưng đã có quyết định trước (xem `qc/s4-gate-readiness.md` mục 2 (c)): toolchain FE (S4-16), contract-ahead nhóm D, tự gửi tin Zalo/email, DOM-S4-17, DOM-S4-11 (2), SEC ARC-24/26/FE-08, cảnh báo QR khi bán đêm, giá nạp minibar lúc vào lại, các phần R-C, US-056, US-008.

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
| 17/10/2026 | 2 (Sprint 4 – Lập kế hoạch) | ESC-019 A → US-024 AC5–AC7 (giá căn mới khi khách tự xin đổi căn trước ngày đến; giữ giá khi OTTIMO đổi; đơn OTA giữ giá OTA, chênh lệch so với căn gốc thu tại quầy như BR-424), AC1 làm rõ; ESC-020 A → bỏ các nhánh chờ INV ở EP19 (US-147 AC1/AC3, US-148 AC2 ghim bản đồ, US-149 AC4, US-151 AC1/AC2, US-152 AC2 PO xác nhận, AC3 viết lại theo L1-A; US-156 Round); ESC-021 A → US-126, ghi chú Zalo, bảng 5.4 (+ESC-019); ghi chú Sprint 4 cho US-083 (hạ về Đang nghiệm thu – BUG-R2-080), US-086 (BUG-R2-081), US-108 (ghim bản đồ); trạng thái: 15 story Must R2 → Sẵn sàng (Sprint 4), 9 story EP19 v1 → Sẵn sàng (LP-v1). Must R2 71, tổng 163 | PO |
| 17/10/2026 | 2 (Sprint 4 – góp ý landing của INV) | FB-INV-002 (INV góp ý bản mẫu v1.1): **US-155 Should R3 → Must "R2 – LP-v1"** – AC1–AC4 sửa (form, chuyển thành báo giá, chống spam/hạn xóa, điều kiện bật trên mạng thêm LZ-8), AC5 giữ, AC6–AC11 mới (nhãn "Website · Facebook", trang cảm ơn phương án A, hàng chờ Desk + quyền xem, đường lên L7-B, VI/EN + quyền riêng tư, trạng thái lỗi) – AC7, AC9 gắn **[GIẢ ĐỊNH – chờ INV xác nhận ý 3]**; US-146 AC1, AC2, AC3 sửa + AC5 (định vị boutique stay, chuỗi cấm), AC6 (hai nhóm khách, kiểm 5 giây của UXR), AC7 (bố cục v1.2 INV duyệt trước khi dựng); US-147 đổi tên, AC1, AC3 sửa + **AC6** (không nêu số phòng); US-149 AC5; US-151 AC1, AC3, AC5 sửa + **AC7** (Zalo đứng đầu mọi ngôn ngữ, kênh khác ở chỗ phụ) + **AC8** (fanpage Facebook, không plugin); US-153 AC8; US-131 ghi chú L7-B; bảng epic EP19; bảng 5.4 ESC-020 (+L7). **ESC-020 L7** mở (chờ INV, đội đề xuất A). Tổng 163, Must R2 71, Must R3 28, luồng LP-v1 8 Must + 2 Should | PO |
| 17/10/2026 | 2 (Sprint 4 – Phản hồi & sửa sau workflow landing) | INV chốt **ESC-020 L7 = A** (FB-INV-002 "Xác nhận của INV"): gỡ nhãn **[GIẢ ĐỊNH – chờ INV xác nhận ý 3]** ở US-155 (phương án, AC7, AC9), quy ước EP19, bảng epic, US-131, bảng 5.4; **US-155 AC2** nguồn luôn `website` (BR-112 v0.3.7 – BA Q-W13) + "đã chuyển" khi giữ chỗ/đơn (BR-913 v0.3.8); **AC7** câu hứa theo BR-912 (4) (1 giờ / trước 09:00, đọc từ tham số); AC9 chữ ký giá (SEC ARC-18); AC1 + **US-151 AC1** Zalo đầu ô chọn kênh mọi ngôn ngữ (BA Q-W14); **US-147 AC6** bỏ chữ "10 căn" (chuỗi cấm trỏ về DOM/UXD); **US-146 AC5** `LodgingBusiness`, không tự nhận "khách sạn"/hạng sao (DOM; ESC-001 LZ-9); dòng US-155 thêm SEC `landing-booking-SEC.md`, BR-911…916, đặc tả BA. **US-155 AC8** thêm báo lên FDL + MGR khi quá hạn và cờ "đến hôm nay" (BA Q-W09 – LP-v1 mốc "form"); ghi chú **US-012** (AC7 nghiệm thu R2 theo người đứng tên; người đi cùng VIP → R3, DOM-S4-11 (2)) và **US-021** (DOM-S4-17 "khách để lại" đơn đã đóng → R3 Sprint 1). Trả lời BA Q-W09, Q-W12–14 ở `rounds/round-02/outputs/PO/qa-log.md`. Không đổi số story: tổng 163, Must R2 71, Must R3 28, LP-v1 8 Must + 2 Should | PO |
| 17/10/2026 | 2 (Sprint 4 – INV chọn A "rút dữ liệu về phân tích") | Decision-log INV 17/10: **mở rộng US-104** (không thêm story – một lối xuất, một nhật ký, một bộ quy tắc che) thành xuất báo cáo + dữ liệu theo kỳ (ZIP gồm `reservations`, `nights`, `folio_lines`, `payments`, `revenue_daily`, `guests`, danh mục, `columns`, `manifest` – CSV UTF-8 có BOM); **Should → Must R3**; AC1–AC10 mới (chỉ `owner` + xác thực lại 2FA; kỳ tháng/khoảng ngày ≤ 366 ngày; che dữ liệu khách – không giấy tờ, SĐT/email che, tên viết tắt; chống công thức độc; ZIP ≤ 20 MB, 10 lần/ngày, link một lần 10 phút; nhật ký `export`; báo cáo đã định dạng; khớp số R-01…R-07; không API/kết nối DB/đẩy ra ngoài). Phụ thuộc R3: SEC (trường + cách che, biên), ARC (hợp đồng), DATA (cột theo `metrics-definitions.md`), BA (A105 chỉ `owner`). Tổng 163; Must R2 71; **Must R3 29** | PO |
| 18/10/2026 | 2 (Sprint 4) | Mở **ESC-023** (chờ INV – khách rút ngắn đơn trực tiếp/CTV khi còn < 7 ngày mà vẫn đến ở; đội đề xuất B theo bậc BR-309): thêm dòng bảng 5.4 (US-024, US-021 – R3 nếu B/C). Không đổi AC, không đổi số story | PO |
| 18/10/2026 | 2 (Sprint 4, tuần Ổn định – SEC ARC-25) | Thêm **US-164** (EP00, **Must R3**): quản lý xác nhận từ xa trên thiết bị của mình bằng PIN/2FA cho "phụ thu trả muộn bằng giá 1 đêm" (BR-416-06) và mọi đường cần quản lý xác nhận tại quầy; AC1–AC7, phụ thuộc SR-AUTH-09, SR-AUTH-06/US-143, SR-AUTH-11 mới (SEC), BE-59…63, ARC-24/26, FE-08; ước lượng ≈ 8,25–12 ngày-người. Mở **ESC-024** (chờ INV – khi quản lý không trả lời); bảng 5.4 thêm dòng. Bảng epic EP00 13 story. Tổng **164**; Must R2 71; **Must R3 30** | PO |
| 18/10/2026 | 2 (Sprint 4, tuần Ổn định – QC nghiệm thu) | Nghiệm thu PO Sprint 4 (`rounds/round-02/outputs/PO/s4-acceptance.md`): 86 AC phần Sprint 4 – 50 Đạt (7 Đạt (G1)), 32 Chờ ca UI, 2 Chưa, 2 Dời R3; 15 story "Sẵn sàng (Sprint 4)" → Đang nghiệm thu; US-003, 019, 084, 085 → Đạt (stack tạm) (Must R2: 36 Đạt · 35 Đang nghiệm thu); dòng "> Nghiệm thu S4" ở 39 story; P-S4-14 US-012 AC7 "Đồng bộ kênh lỗi" → R3; P-S4-15 US-031 AC1 thông báo J4 → R3 (cột Round US-012, US-031 ghi chú); P-S4-16…18 cách hiểu AC US-061 AC1, US-052 AC1, US-066 AC2; thêm mục 5.5 hàng chờ R3 (16 mục, ghi chú US-021, US-155). Không đổi số story, MoSCoW, số AC | PO |
| 18/10/2026 | 2 (Sprint 4, tuần Ổn định) | Theo ORC "dời có hạn các Major SEC Sprint 4" (decision-log 18/10; `reviews/s4-SEC.md` dòng 31–34): mục 5.5 thêm R3-Q17 (**Must** – SEC BE-65, BE-74, BE-75, hạn trước khi có dữ liệu thật, cùng cổng ESC-001) và R3-Q18 (Minor/Suggestion SEC BE-66…72, 76…78, MOB-03/04, OPS-04, hạn trước bản dùng thử cuối R3); hàng chờ R3 nay 18 mục | PO |
| 18/10/2026 | 2 (Sprint 4, tuần Ổn định) | R3-Q17 thêm **SEC BE-79** (Major – `updateGuestDocument` đổi người không gỡ khóa giấy tờ/`last4` trên hồ sơ cũ), **Must**, hạn trước khi có dữ liệu thật, cùng BE-65/74/75 (ORC 18/10; `reviews/s4-SEC.md` mục C.10). Không đổi số mục hàng chờ (18) | PO |
| 19/10/2026 | 2 (Sprint 4 – Phản hồi & sửa sau cổng QC, K10) | Mục 5.5 thêm **R3-Q19…R3-Q32** (14 mục, có vai và hạn): BUG-R2-208/209/210 + ARC 16.31 (lượt kiểm tiền riêng R3 Sprint 1, thứ tự 207 → 210 → 208, SEC review 208); FB-R2-SEC-BE-83 = R3-Q22 khớp thẻ `pendingFix` `R3-SEC-BE-83`; ARC BE-S4-17/18/19; N-11; SEC-BE-82; ARC S4-03/S4-09 đọc chéo + phần còn lại BUG-R2-186; S3-16; S3-15 (e) + BUG-R2-205; BUG-R2-123; fuzz công nợ; 3 cảnh báo Dependabot (SEC); mã cửa theo INV 19/10 (R3-Q32, sửa chữ US-130). R3-Q01 ghi thẻ `R3-OTTIMO-FAULT-CANCEL`. Bảng đối chiếu `pendingFix` ↔ hàng chờ. Hàng chờ R3: 32 mục (19 Must, 13 Should). Không đổi số story, MoSCoW, số AC | PO |
| 19/10/2026 | 2 (Sprint 4 – Phản hồi & sửa, ORC bổ sung) | Mục 5.5 thêm **R3-Q33** (FB-R2-SEC-BE-84 – phần (a) cảnh báo ảnh thiếu mốc hạn lưu Must trước dữ liệu thật), **R3-Q34** (ARC S4-23 `slotsVersion` guest-web), **R3-Q35** (ARC S4-25); R3-Q28 gộp ARC S4-24. Hàng chờ R3: 35 mục (20 Must, 15 Should) | PO |
| 20/10/2026 | 2 (Sprint 4 – Phản hồi & sửa, ORC bổ sung) | Mục 5.5 thêm **R3-Q36** (ARC FE-S4-01 `useBusinessDay` theo mốc đổi ngày), **R3-Q37** (ARC MOB-S4-01 PWA bỏ hằng 06:00), **R3-Q38** (ARC FE-S4-02 hợp đồng `businessDate`/`businessDayRollover`), **R3-Q39** (phần còn lại bảng "Rà ngày kinh doanh" BUG-R2-211, #8–#12 chạm tiền vào lượt kiểm tiền, hai lỗi so sánh hạn công nợ và gợi ý no-show). Hàng chờ R3: 39 mục (20 Must, 19 Should). Không đổi số story | PO |
| 21/10/2026 | 2 (Bước 4 sau cổng QC Round 2 KHÔNG ĐẠT, ORC giao) | Mục 5.5 thêm **R3-Q40…R3-Q45** theo đề nghị của INT (`responses/INT-responses.md`, R-2): webhook Zalo (Q40), kết nối OA + token mã hóa (Q41), token thông báo + ADR-006 (Q42), điều kiện tin marketing (Q43), hướng dẫn vận hành chat OA + SR-DEV-07/08 (Q44, Should), bên nhận dữ liệu Zalo/VNG (Q45). Hàng chờ R3: 45 mục (25 Must, 20 Should). Không đổi số story | PO |
| 21/10/2026 | 2 (Bước 4 sau cổng QC Round 2 KHÔNG ĐẠT – R-1) | PO chấm lại `rounds/round-02/outputs/PO/s4-acceptance.md` mục 0 trên `21bb797`: 28 story **Đang nghiệm thu → Đạt (stack CI)** (US-006, 007, 011, 016, 020, 024, 025, 028, 029, 030, 031, 032, 052, 053, 054, 055, 057, 061, 062, 066, 083, 086, 108, 109, 110, 119, 136, 139); còn **7 Đang nghiệm thu** (US-010, 012, 038, 112 – thiếu ca UI cho một phần AC; US-043, 048 – SEC BE-74/75/79 Major dời R3-Q17; US-135 – AC3 kiểm tay trên staging). Nhãn "Đạt (stack tạm)" đổi tên "Đạt (stack CI)" (không đổi nghĩa, không đổi tiêu chí). 0 story Xong (staging) | PO |
