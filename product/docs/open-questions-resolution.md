# Kết cục câu hỏi mở – BL mục 9 và câu hỏi mới Round 1

- Tác giả: PO (cùng DOM – phương án ở `business-rules.md` mục 16) | Round 1 – Bước 2, đợt 3 | Ngày: 15/10/2026
- Mục đích: tiêu chí QC **A6** – 26/26 câu hỏi BL mục 9 có kết cục: **ESC-xxx** hoặc **dòng decision-log** (có nhãn giả định khi cần). Thêm các câu mới phát sinh trong Round 1.
- Nguyên tắc chọn (protocol mục 8): báo lên khi liên quan tiền, chính sách kinh doanh, pháp lý, tài khoản/hợp đồng bên thứ ba, thông tin chỉ INV có, phạm vi lớn; còn lại đội tự chốt và ghi decision-log. Tổng ESC = 12 (giới hạn ≤ 12), tất cả mức **Bình thường**.
- Cột "Decision-log": "**Đã có**" = dòng đã có trong `01-decisions/decision-log.md`; "**Đề xuất D-x**" = dòng mới ORC ghi khi commit (bảng ở mục 3).

## 1. 26 câu hỏi BL mục 9

| # | Câu hỏi (rút gọn) | Kết cục | Ghi chú / mặc định đang dùng |
|---|---|---|---|
| 1 | Giá đêm = giá tháng ÷ 12, làm tròn, giá mùa/lễ cho kênh trực tiếp | **ESC-004** | Mặc định BR-005, BR-101, BR-104 (+30% lễ, +15% cuối tuần mọi kênh) |
| 2 | Phụ thu khách NN +10%: áp ngắn ngày? căn cứ VN/NN? Việt kiều? | **ESC-004** | BR-009, BR-109: chỉ dài hạn, theo giấy tờ khai báo |
| 3 | Bảng kỳ hạn, ký quỹ, chu kỳ thu, hoa hồng; cơ sở và thời điểm chi | **ESC-005** | BR-201, BR-212: chi 2 đợt 50/50 |
| 4 | Giảm 10%/15% theo số đêm cho mọi kênh? ngưỡng chuyển dài hạn | **ESC-004** | BR-107, BR-108: chỉ trực tiếp/CTV; 15 đêm so sánh, 28 đêm bắt buộc HĐ |
| 5 | Phụ thu thêm người, trẻ em, giường phụ; sức chứa | **ESC-004** | BR-110 (sức chứa thật – INV cung cấp) |
| 6 | Chính sách hủy/hoàn cọc ngắn ngày và dài hạn; phạt chấm dứt sớm | **ESC-006** | BR-309, BR-313, BR-314, BR-428 |
| 7 | Ân hạn 13:00? phụ thu cho dài hạn, cho khách OTA | **ESC-007** | BR-412 (tạm không ân hạn), BR-413, BR-415 |
| 8 | Hạn mức FOC theo người duyệt; duyệt trên app bằng PIN/OTP | **ESC-007** | BR-432, BR-433, BR-435. Phần "người duyệt tự xác nhận bằng tài khoản của mình" đã chốt: **Đã có** (DOM) |
| 9 | Trả phòng dài hạn: kiểm phòng, khấu trừ/hoàn ký quỹ, thời hạn hoàn | **ESC-006** | BR-214: hoàn trong 7 ngày làm việc, quản lý duyệt. Luồng kiểm phòng có ảnh = NGÀNH (đội tự chốt trong BR-214) |
| 10 | Điện nước cố định hay theo bậc EVN; phí internet/rác/xe | **ESC-008** | BR-501, BR-505 (cần kế toán/luật sư xác nhận giá điện) |
| 11 | Giữ chỗ hết hạn tự hủy hay báo sale? báo giá hết hạn có khóa? | **ESC-006** | BR-303, BR-304: tự hủy, nhắc trước 2 giờ, gia hạn 1 lần |
| 12 | Lịch dọn dài hạn ngày cố định, khung 9:00–11:00; giá giặt ủi | Tách 2 phần: lịch dọn dài hạn → **Đã có** (DOM tự chốt); giá giặt ủi + dọn hằng ngày khách ngắn ngày → **ESC-008** | BR-807, BR-507 |
| 13 | Quản lý ca, chấm công, phân việc theo người | **Đã có** (PO: ngoài MVP; phân việc theo người = US-059 Should R3) | Xác nhận lại trong ESC-012 |
| 14 | Thời hạn lưu ảnh giấy tờ 30 ngày; lưu thông tin khai báo dạng chữ lâu hơn? | **ESC-001** (luật sư – đã có câu thời hạn lưu; PO bổ sung câu lưu dạng chữ) | BR-610; decision-log SEC "thời hạn lưu là giá trị mặc định" – **Đã có** |
| 15 | Tài khoản cổng BCA; ai khai báo ca tối | **ESC-010** (tài khoản + người khai ca tối); hạn khai báo khách NN → **ESC-001** | BR-611 (giả định: check-in online + người trực nhận thông báo) |
| 16 | Hóa đơn điện tử: nhà cung cấp, VAT 8%/10%, giá gồm VAT cho dài hạn | Nhà cung cấp MISA: **Đã có** (INV chốt 15/10); VAT → **ESC-008** | BR-523, BR-524 |
| 17 | Hợp đồng điện tử/ký số trong app | **Đã có** (PO: ký số ngoài MVP; xuất PDF HĐ = US-092 Should R3) | Xác nhận lại trong ESC-012 |
| 18 | Chọn channel manager, ngân sách, OTA bán thật | **ESC-009** | Đề xuất Beds24; danh sách OTA thật – INV cung cấp |
| 19 | Zalo OA (ZNS); WhatsApp/KakaoTalk cho khách NN | **ESC-010** (Zalo); WhatsApp/Kakao/Telegram tự động → đội tự chốt **sau MVP** (**Đề xuất D-3**) | MVP: email + mẫu tin sao chép VI/EN/RU |
| 20 | Cổng thanh toán; tài khoản ngân hàng nhận VietQR | **ESC-010** | Giả định VNPay gồm thẻ quốc tế – **Đã có** (INT) |
| 21 | Phạm vi MVP: phân hệ bắt buộc ngày mở bán | **ESC-012** | Ranh giới PRD 5.2–5.3 – **Đã có** (PO, nhãn chờ INV) |
| 22 | Thiết bị từng vai; có cần chạy offline | **Đã có** (ARC + UXD: PWA, đọc offline + hàng đợi thao tác buồng phòng; UXR: thiết bị giả định) | Kiểm chứng thiết bị trong ESC-003 (H-05) |
| 23 | App khách có mã cửa/khóa điện tử tích hợp? Ngôn ngữ ưu tiên | Khóa cửa → **ESC-011**; ngôn ngữ VI + EN, RU thứ 3 → **Đã có** (PO P4) | Mã sinh nhật dạng ddmm + 2 số – **Đã có** (INT, nhãn chờ INV) |
| 24 | Đa cơ sở trong tương lai? Đa tiền tệ? | Đa cơ sở → **Đã có** (ORC/ARC: thiết kế sẵn, MVP 1 cơ sở); tiền tệ → **Đề xuất D-1** | BR-004: thu VND, USD chỉ hiển thị tham khảo |
| 25 | Cảnh báo khi lệch mục tiêu công suất 80%, 4–6 căn dài hạn | **Đã có** (PO: Could R4+, US-015) | Mục tiêu G1–G4 xác nhận trong ESC-012 |
| 26 | P&L nhập chi phí trong app hay từ kế toán; thuê nhà, khấu hao | **Đã có** (PO, nhãn chờ INV: nhập trong app, chưa khấu hao – US-103 Should R3) | – |

Tổng: 26/26 có kết cục. Số câu vào ESC (toàn bộ hoặc một phần): 20 (#1–12, 14–16, 18–21, 23); số câu đội tự chốt hoàn toàn: 6 (#13, 17, 22, 24, 25, 26) – các câu phạm vi #13, #17, #25 vẫn được nêu lại trong ESC-012 để INV biết.

## 2. Câu hỏi mới phát sinh trong Round 1

| Mã | Nguồn | Câu hỏi (rút gọn) | Kết cục |
|---|---|---|---|
| Q-D1 | DOM | Phí dịch vụ cố định + gói dọn (BL) hay "chỉ tiền thuê + dọn 100k/lần" (thực tế) | **ESC-005** |
| Q-D2 | DOM | Hoa hồng CTV ngắn ngày 8% hay 7% | **ESC-005** |
| Q-D3 | DOM, BA, SEC | Hạn khai báo khách NN 12 giờ hay 23:00 | **ESC-001** (luật sư); mặc định "mốc sớm hơn" – **Đã có** (DOM) |
| Q-D4 | DOM, SEC | Mã cửa theo ngày sinh dễ đoán – thêm 2 số ngẫu nhiên | **ESC-011** |
| Q-D5 | DOM | Sức chứa và số giường thật từng căn | **ESC-004** (thông tin chỉ INV có) |
| O-1 | DATA | Báo cáo dùng doanh thu gồm hay trước VAT | **ESC-008**; mặc định gồm VAT – **Đã có** (DATA) |
| O-2 | DATA | CTV/môi giới có tính "kênh trực tiếp" trong mục tiêu G3 | **ESC-012**; mặc định không tính – **Đã có** (DATA) |
| O-3 | DATA | Ngày chốt số liệu tháng | Đội tự chốt: ngày 5 tháng sau – **Đã có** (DATA, nhãn chờ INV); không cần ESC |
| BA-1 | BA (rbac mục 9) | Ngưỡng tuổi trẻ em cho chế độ bảo vệ dữ liệu (dưới 16 hay dưới 14) | **ESC-001** (luật sư); mặc định dưới 16 – **Đã có** (BA) |
| BA-2 | BA (rbac ghi chú 34) | CTV có thấy "OTTIMO còn lại" trên báo giá không | Đội tự chốt (PO): **không** – **Đề xuất D-4** |
| SEC-DSR | SEC R-DSR, BA UC-30 | Thời hạn trả lời yêu cầu của chủ thể dữ liệu | **ESC-001**; chức năng = US-133, US-134 (Must R3) |
| UXD-1 | UXD (qua ORC) | Logo chính thức OTTIMO | **ESC-012** (câu phụ logo); mặc định chữ "OTTIMO" font Lora |
| OPS-1 | OPS (qua ORC) | Duyệt chi phí hosting, phương án máy chủ, tên miền | **ESC-002** (câu phụ hosting, gói H-B đề xuất) |
| ARC-1 | ARC | Đưa chi phí ADR-010 vào ESC-002; nhận xét kỹ thuật channel manager | Đã đưa vào **ESC-002** và **ESC-009** |
| UXR-H | UXR | 9 giả thuyết ưu tiên Cao cần kiểm chứng (H-12 thanh toán khách Nga…) | **ESC-003** (đã có); H-12 nhắc trong **ESC-010** |

## 3. Dòng decision-log đề xuất (ORC ghi khi commit – PO không sửa trực tiếp)

| Mã | Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|---|
| D-1 | 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Tiền tệ: thu và lưu VND số nguyên; USD chỉ hiển thị tham khảo theo tỷ giá nhập tay có ngày cập nhật (BR-004); không đa tiền tệ thanh toán trong MVP | PO | BL 9 #24; PRD X9 |
| D-2 | 2026-10-15 | 1 | 26 câu hỏi BL mục 9 + câu mới xử lý theo `product/docs/open-questions-resolution.md`; tạo ESC-004…ESC-012, gộp câu luật sư vào ESC-001, câu hosting (OPS) vào ESC-002, câu logo (UXD) vào ESC-012; tổng 12 ESC, đều Bình thường | PO | Plan R1 mục 8; QC A6 |
| D-3 | 2026-10-15 | 1 | WhatsApp/KakaoTalk/Telegram tự động để sau MVP; MVP dùng email + mẫu tin sao chép VI/EN/RU | PO | BL 9 #19; ít tích hợp cho 10 căn |
| D-4 | 2026-10-15 | 1 | CTV (`collaborator`) không thấy "OTTIMO còn lại" trên báo giá, chỉ thấy hoa hồng của mình | PO | rbac ghi chú 34; bảo mật biên lợi nhuận |
| D-5 | 2026-10-15 | 1 | US-024 (đổi căn/đổi ngày/đổi phòng) nâng từ Should lên Must R2; thêm US-133…US-139 (yêu cầu chủ thể dữ liệu, xác nhận hành động không đảo ngược, no-show, trả sớm, trả phòng nhanh, xung đột OTA); backlog 139 story, 74 Must R2 | PO | UC-05, UC-16, UC-19, UC-30; HR-06; BR-311, BR-312, BR-428 |
| D-6 | 2026-10-15 | 1 | Tiêu chí nghiệm thu chỉ tham chiếu mã BR ("khớp ví dụ BR-xxx"), không chép con số quy tắc; dùng tên trạng thái `state-machines.md` và mã vai `rbac-matrix.md` | PO | QC B1, B3 |
| D-7 | 2026-10-15 | 1 | Mọi hành động không đảo ngược có hộp xác nhận nêu hậu quả (US-135) | PO | HR-06 (Blocker UXR) |
