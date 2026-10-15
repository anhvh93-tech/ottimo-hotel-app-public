# PRD – OTTIMO Desk · App All-in-one cho OTTIMO Boutique Stay (MVP)

- Người viết: PO | Round 1 – Bước 2, đợt 1 | Ngày: 15/10/2026
- Trạng thái: **BẢN NHÁP** – chờ review bắt buộc của BA, DOM (khuyến nghị ARC, UXD). Phạm vi MVP chờ INV xác nhận qua ESC cuối Round 1 (câu hỏi BL 9 #21).
- Đầu vào: `00-brief/investor-brief.md` (gọi tắt **Brief**), `01-decisions/decision-log.md`, `product/docs/round-0-baseline.md` (gọi tắt **BL**), `rounds/round-01/plan.md`.
- Tài liệu liên quan (đang viết song song): `business-rules.md` (DOM – nguồn sự thật cho mọi con số quy tắc), `baseline-issues-triage.md` (DOM), `research/personas.md`, `research/journeys.md` (UXR), `integrations.md` (INT), `security/data-risk-assessment.md` (SEC).
- Backlog chi tiết: `03-backlog/backlog.md`.

> **Quy ước số liệu:** PRD này không là nguồn sự thật cho giá, %, giờ, phí. Mọi con số quy tắc dưới đây chỉ để minh họa và trích từ BL; khi DOM ban hành mã BR-xxx, PRD sẽ chỉ tham chiếu mã BR (tiêu chí QC B3). Mọi con số quy tắc là **giá trị mặc định cấu hình được** `[GIẢ ĐỊNH – chờ INV xác nhận]` (decision-log 15/10/2026).

---

## 1. Bối cảnh và vấn đề

OTTIMO Boutique Stay (Đà Lạt) vận hành **10 căn** theo **mô hình lai**: bán ngắn ngày qua 6–7 OTA + kênh trực tiếp, đồng thời cho thuê dài hạn theo tháng (mục tiêu 4–6 căn). Khách có tỉ lệ người nước ngoài cao (Nga, Pháp, Đức, Hàn, Singapore…), nhiều người làm việc từ xa.

Chủ đầu tư đã tự làm prototype "OTTIMO Desk" (Round 0) – một file HTML với dữ liệu mẫu. Prototype chứng minh được **luồng nghiệp vụ đúng** (BL 8.1) nhưng chưa dùng được để vận hành thật:

| Vấn đề hiện tại | Hậu quả với OTTIMO | Nguồn |
|---|---|---|
| Không lưu dữ liệu, không đăng nhập, không phân quyền thật | Không thể dùng hằng ngày; dữ liệu giấy tờ tùy thân lộ cho mọi vai | BL 7, 8.2 #27 |
| Kiểm trùng lịch chỉ ở máy người dùng; khóa phòng sửa chữa không chặn bán | Rủi ro **đặt trùng phòng** – sự cố tệ nhất với khách OTA | BL 8.2 #5, #30 |
| Đồng bộ OTA, thanh toán, hóa đơn điện tử, gửi tin chỉ là giả lập | Lễ tân vẫn phải làm tay trên 6–7 extranet, chat, ngân hàng | BL 7 |
| Báo cáo phần lớn là số cứng, công thức chỉ số lệch | Chủ đầu tư không có số thật để ra quyết định giá/kênh | BL 8.2 #8, #11, #22, #28, #29 |
| Nhiều quy tắc tiền chưa đúng (phụ thu dài hạn tính theo giá tháng, ký quỹ không hoàn/khấu trừ, FOC tự duyệt) | Sai tiền với khách, thất thoát | BL 8.2 #1, #6, #24 |
| Khai báo lưu trú hạn 23:00 làm tay, không có nhắc thật | Rủi ro bị xử phạt hành chính | BL 5.12 |

**Tóm lại:** MVP không phải "làm thêm tính năng" mà là **biến các luồng đã đúng trong prototype thành thật, đúng tiền, an toàn dữ liệu, dùng được mỗi ngày** – rồi mới mở rộng.

## 2. Tầm nhìn sản phẩm

> Một app duy nhất để đội OTTIMO nhỏ (chủ đầu tư, 1–2 lễ tân, 2 buồng phòng, 1 kỹ thuật, CTV) vận hành 10 căn lai ngắn ngày + dài hạn **không cần sổ tay, Excel hay 7 extranet**, và để khách – kể cả khách nước ngoài – **tự làm phần lớn việc trên điện thoại mà không phải cài app**.

Nguyên tắc sản phẩm (dùng để nói "không" với tính năng thừa):
1. **Đúng tiền trước, đẹp sau** – mọi luồng có tiền phải đúng công thức, có dấu vết, có người chịu trách nhiệm.
2. **Một nguồn sự thật cho phòng trống** – OTTIMO Desk là nơi quyết định phòng trống; không bao giờ để đặt trùng.
3. **Ít thao tác cho đội nhỏ** – mỗi việc hằng ngày (nhận phòng, trả phòng, khai báo, dọn phòng) xong trong vài chạm, có nhắc tự động.
4. **Khách tự phục vụ, đa ngôn ngữ** – VI + EN bắt buộc, RU thứ ba (decision-log 15/10/2026).
5. **Giữ nhận diện OTTIMO** – tông kem – gỗ sồi, Lora + Be Vietnam Pro, cảm giác boutique (Brief mục 1).
6. **Cấu hình được, không cố định trong code** – giá, %, giờ, phí là tham số chủ đầu tư tự chỉnh.

## 3. Mục tiêu kinh doanh và chỉ số thành công

### 3.1 Mục tiêu kinh doanh (của OTTIMO, sản phẩm phải hỗ trợ)
| # | Mục tiêu | Mốc hiện tại | Đích | Nguồn |
|---|---|---|---|---|
| G1 | Công suất phòng tháng | 71,3% (T9/2026) | **≥ 80%** mỗi tháng | Brief mục 1 |
| G2 | Nền khách dài hạn | Trong dữ liệu mẫu: 2 hợp đồng đang chạy | **4–6 căn** dài hạn cùng lúc | Brief mục 1 |
| G3 | Giảm phí kênh bằng cách kéo khách về kênh trực tiếp | Trực tiếp 52,2/186,4 tr ≈ **28%** doanh thu phòng T9; phí kênh ≈ 18,1 tr/tháng | Trực tiếp **≥ 35%** doanh thu phòng sau 3 tháng vận hành `[GIẢ ĐỊNH – chờ INV xác nhận]` | BL 5.11 |
| G4 | Giữ biên lợi nhuận gộp | GOP ~61% (T9) | **≥ 60%** `[GIẢ ĐỊNH – chờ INV xác nhận]` | BL 5.11 |
| G5 | Tuân thủ pháp lý | Khai báo làm tay | **100%** khách được khai báo đúng hạn; 0 sự cố lộ dữ liệu giấy tờ | BL 5.12, 5.13 |

### 3.2 Chỉ số thành công của sản phẩm (đo sau khi INV vận hành thật từ Round 4)
Các chỉ số dưới đây là đích đội đề xuất `[GIẢ ĐỊNH – chờ INV xác nhận]`; công thức chính xác do DATA chốt trong `metrics-definitions.md`.

| # | Chỉ số | Đích | Cách đo (dự kiến) |
|---|---|---|---|
| S1 | Số lần **đặt trùng phòng** do hệ thống | **0** | Đơn trùng căn × đêm ở trạng thái đã xác nhận/đang ở |
| S2 | Tỉ lệ khách được **khai báo lưu trú trước 23:00** ngày đến | **≥ 98%** (100% với khách đến trước 21:00) | Thời điểm ghi mã hồ sơ so với hạn |
| S3 | Thời gian **trả phòng** tại quầy (từ mở đơn tới thu tiền xong) | **≤ 5 phút** trung vị | Nhật ký thao tác |
| S4 | Thời gian **nhận phòng** với khách đã check-in online | **≤ 3 phút** trung vị | Nhật ký thao tác |
| S5 | Tỉ lệ khách đã check-in online trước khi đến (đơn trực tiếp + OTA có liên hệ) | **≥ 40%** sau 2 tháng | Đơn có giấy tờ nhận trước qua app |
| S6 | Thời gian lập báo giá dài hạn và gửi cho khách | **≤ 3 phút** | Từ mở công cụ tới bấm gửi |
| S7 | Tỉ lệ đơn giữ chỗ hết hạn được tự xử lý (không còn "treo" phòng) | **100%** | Đơn giữ chỗ quá hạn vẫn khóa phòng = 0 |
| S8 | Tỉ lệ FOC có người duyệt hợp lệ (người duyệt có quyền, đã xác nhận) | **100%** | Nhật ký FOC |
| S9 | Số liệu trên Tổng quan/Báo cáo **tính từ dữ liệu thật** (không số cứng) | **100%** chỉ số | Rà soát QC |
| S10 | Lỗi tiền (bill sai công thức) phát hiện sau phát hành | **0** lỗi P0 | Bug list + feedback INV |
| S11 | Mức sử dụng hằng ngày của nhân viên (lễ tân, buồng phòng) | **≥ 5/7 ngày**/tuần mỗi người | Phiên đăng nhập |
| S12 | Hài lòng của chủ đầu tư với độ "mượt, thân thiện" | **≥ 4/5** mỗi round từ R3 | Phiếu hỏi trong round-summary |

## 4. Người dùng

5 nhóm người dùng (4 nội bộ + khách), theo decision-log 15/10/2026 "cả 4 nhóm dùng thử". Persona chi tiết do UXR viết ở `research/personas.md` (mô phỏng – cần INV kiểm chứng). Quyền chi tiết do BA viết ở `rbac-matrix.md`; bảng dưới chỉ là định hướng sản phẩm.

| # | Nhóm | Ai (theo BL) | Thiết bị chính `[GIẢ ĐỊNH]` | Việc quan trọng nhất | Không được thấy (định hướng) |
|---|---|---|---|---|---|
| U1 | **Chủ đầu tư / Quản lý** (owner, manager) | Chủ đầu tư; Quản lý anh Hoàng Anh | Laptop + điện thoại | Xem KPI và "cần chú ý", duyệt FOC/giảm giá, cấu hình giá & quy tắc, xem báo cáo kênh và P&L | – (toàn quyền, mọi lần xem ảnh giấy tờ vẫn ghi log) |
| U2 | **Lễ tân** (front office; gồm lễ tân trưởng) | Lễ tân Hạnh | Máy tính quầy + điện thoại | Room rack, đặt phòng, nhận/trả phòng, bill & thu tiền, khai báo lưu trú, trả lời khách | P&L, giá vốn, hoa hồng người khác |
| U3 | **Buồng phòng / Bảo trì** | Chị Lan, Chị Mai; Anh Tùng (kỹ thuật) | Điện thoại | Việc hôm nay, đổi trạng thái buồng, kiểm phòng, minibar, phiếu sửa chữa, chốt số điện nước | Giấy tờ khách, giá phòng, doanh thu, giá vốn kho (chỉ thấy số lượng) |
| U4 | **CTV / Sale** | NV Hạnh (sale nội bộ), CTV Minh Anh | Điện thoại | Báo giá, giữ chỗ, theo dõi khách tiềm năng, xem hoa hồng **của mình** | Giấy tờ khách, P&L, báo cáo kênh, hoa hồng người khác, phòng chi tiết khách không do mình bán |
| U5 | **Khách lưu trú** – 3 kiểu: (a) ngắn ngày nội địa đặt trực tiếp/Zalo; (b) khách OTA (nhiều người nước ngoài); (c) khách nước ngoài thuê tháng, làm việc từ xa (Anh/Nga) | Ji-woo, Huy, Daniel, Emma (dữ liệu mẫu BL 3.21) | Điện thoại, không cài app | Check-in online, nhận mã cửa/thông tin Wi-Fi, gửi yêu cầu, xem hóa đơn & điện nước, ở thêm/trả muộn, đánh giá | Mọi dữ liệu không thuộc đơn của mình |

Ghi chú về các vai trong skill PO (F&B, kế toán): OTTIMO **không có bộ phận F&B và kế toán riêng** ở quy mô 10 căn. Việc kho F&B/minibar do lễ tân + buồng phòng làm; việc kế toán (đối soát, chi phí, P&L) do chủ đầu tư/quản lý làm. Không tạo vai riêng trong MVP `[GIẢ ĐỊNH – chờ INV xác nhận]`.

## 5. Phân hệ (theo BL mục 3) và ranh giới MVP

### 5.1 Định nghĩa các mức phạm vi
- **MVP – R2:** lõi vận hành hằng ngày, phải có để bỏ sổ tay/Excel. Giao ở Round 2.
- **MVP – R3:** hoàn thiện để chủ đầu tư dùng thử bản RC cuối Round 3 (phân hệ còn lại theo protocol mục 4, tích hợp thật, báo cáo).
- **Sau MVP (R4+):** có giá trị nhưng chờ phản hồi vận hành thật hoặc phụ thuộc bên thứ ba chưa chốt.
- **Ngoài phạm vi:** không làm trong dự án này (trừ khi INV quyết định mở rộng qua ESC).

### 5.2 Bảng phân hệ
| # | Phân hệ | Nguồn BL | MVP – R2 | MVP – R3 | Sau MVP (R4+) |
|---|---|---|---|---|---|
| M0 | **Nền tảng**: đăng nhập, phân quyền 4 vai + khách, cơ sở/căn/nhóm căn, tham số cấu hình, nhật ký thao tác | BL 2, 4.1, 7 | Đăng nhập, RBAC theo màn hình + hành động + trường nhạy cảm, danh mục căn & giá niêm yết, bảng tham số quy tắc, nhật ký thao tác, giờ Việt Nam | Quản lý người dùng tự phục vụ, xác nhận phê duyệt bằng PIN | Vận hành đa cơ sở thật (đã thiết kế sẵn) |
| M1 | **Tổng quan (dashboard)** | BL 3.2 | KPI đêm nay (công suất, khách đến/đi, đang ở), "cần chú ý" tính từ dữ liệu thật, việc trong ngày | ADR/RevPAR tháng, biểu đồ công suất 30+14 ngày, so sánh kỳ trước | Cảnh báo lệch mục tiêu (BL 9 #25) |
| M2 | **Lễ tân** | BL 3.3–3.10 | Room rack 14 ngày, đặt phòng mới ngắn ngày (kênh, giá, mã OTA), chi tiết đơn & folio, nhận phòng (phụ thu sớm + FOC có duyệt), trả phòng 3 bước + bill, gia hạn, trả muộn, xác nhận giờ trả, nhắc trả phòng theo mốc giờ (hiển thị + nhắc nội bộ), chống đặt trùng ở máy chủ, đổi phòng | In/xuất PDF bill, gửi bill qua email/Zalo, nhắc trả phòng tự động gửi tới khách | – |
| M3 | **Giấy tờ & khai báo lưu trú** | BL 3.11, 5.12, 5.13 | Nhập/tải ảnh giấy tờ, đối chiếu tự động (tên, hạn hộ chiếu, thị thực, đủ người), đồng ý lưu giấy tờ, khai báo **bán tự động** (sao chép dữ liệu → cổng BCA → ghi mã hồ sơ), nhắc hạn 23:00, ảnh mã hóa + log xem + tự xóa theo hạn | Đọc QR CCCD gắn chip, đọc MRZ hộ chiếu | Kết nối tự động với cổng BCA (nếu BCA cấp kết nối) |
| M4 | **Buồng phòng** | BL 3.12, 5.15 | Trạng thái buồng 7 mã, đổi trạng thái trên điện thoại, việc hôm nay (tự sinh khi trả phòng/gia hạn/yêu cầu khách), checklist kiểm phòng, lịch dọn khách dài hạn | Phân việc theo người, ảnh sau kiểm phòng | Ca làm việc, chấm công (BL 9 #13 – đề xuất ngoài MVP) |
| M5 | **Bảo trì** | BL 3.14 | Phiếu sửa chữa (mức độ, người xử lý, trạng thái), **khóa phòng chặn bán thật** | Bảo trì định kỳ tự sinh kỳ kế tiếp, chốt số điện nước → hóa đơn tháng | – |
| M6 | **Kho F&B / minibar** | BL 3.13, 3.15, 5.14 | Kiểm minibar khi trả phòng và giữa kỳ (ghi folio), danh mục mặt hàng + giá bán | Xuất nhập tồn, kiểm kê, bổ sung tủ trừ kho, mặt hàng cần nhập, bán chạy | Giá vốn bình quân, nhà cung cấp, đơn đặt hàng, hạn sử dụng |
| M7 | **Khách hàng (CRM)** | BL 3.16, 3.17, 5.16–5.18 | Hồ sơ khách, chống tạo trùng theo SĐT/email, người đi cùng & trẻ em trong đơn, bộ chọn khách dùng chung | Gộp hồ sơ (cập nhật mọi tham chiếu + nhật ký), phân khúc, độ đầy đủ hồ sơ, dòng thời gian, đồng ý ưu đãi theo người | Chiến dịch ưu đãi theo phân khúc, hạng thành viên |
| M8 | **Sale & báo giá** | BL 3.18, 5.2–5.5 | Công cụ báo giá ngắn ngày + dài hạn, giữ chỗ (khóa phòng, hết hạn tự xử lý), xác nhận cọc/ký quỹ, sinh hợp đồng dài hạn, văn bản báo giá để gửi Zalo | Kanban khách tiềm năng, lịch thu theo kỳ + nhắc thu, chào gia hạn HĐ, trả phòng dài hạn có khấu trừ/hoàn ký quỹ, hoa hồng CTV/sale (ghi nhận + đã chi), xuất PDF hợp đồng | Ký số hợp đồng (BL 9 #17 – đề xuất ngoài MVP) |
| M9 | **Kênh OTA** | BL 3.19, 5.21 | Ghi nhận đơn OTA nhập tay (kênh, mã OTA, giá thực tế); lớp đồng bộ **giả lập** để đóng/mở phòng | Kết nối channel manager thật (theo ESC chọn nhà cung cấp): đơn về tự động, đẩy phòng trống & giá, nhật ký đồng bộ, đối soát | Tối ưu giá theo kênh tự động |
| M10 | **Báo cáo** | BL 3.20, 5.11 | – (chỉ KPI ở Tổng quan) | Báo cáo vận hành (công suất, ADR, RevPAR, ALOS, cơ cấu ngắn/dài hạn), kênh bán (phí kênh, thực thu), FOC, P&L đơn giản (nhập chi phí trong app), xuất file | Đánh giá OTA tự lấy từ kênh, lợi nhuận ròng có khấu hao |
| M11 | **App khách** (web trên điện thoại, mở bằng link/QR) | BL 3.21, 5.19 | Mở bằng link riêng theo đơn, check-in online (giấy tờ + giờ đến + đồng ý), gửi yêu cầu (định tuyến tới đúng bộ phận), xem hóa đơn/folio, thông tin lưu trú (Wi-Fi, giờ, chỉ đường), VI/EN | Ở thêm/trả muộn tự phục vụ, thanh toán online, hóa đơn điện nước tháng cho khách dài hạn, tab Đà Lạt, xin đánh giá theo mốc, tiếng Nga | Mã cửa tự động qua API khóa thông minh |
| M12 | **Thanh toán & hóa đơn** (xuyên phân hệ) | BL 5.20 | Ghi nhận thu tiền 4 cách (chuyển khoản VietQR, thẻ, tiền mặt, đã thu qua OTA), VietQR theo số tiền bill (sandbox/tĩnh), folio đúng công thức | VNPay/MoMo (theo ESC), phát hành hóa đơn điện tử MISA meInvoice, hoàn cọc | Đối soát ngân hàng tự động |
| M13 | **Giao tiếp với khách** (xuyên phân hệ) | Brief mục 5, BL 7 | Mẫu tin nhắn đa ngôn ngữ (VI/EN/RU) để **sao chép gửi** qua nhóm chat/Zalo | Gửi tự động qua Zalo OA/ZNS và email (theo ESC tài khoản) | WhatsApp/KakaoTalk tự động |
| M14 | **Khóa cửa thông minh** | Brief mục 7 #3 | Lễ tân **nhập tay** mã cửa vào đơn, app khách hiển thị đúng thời hạn | – | Tích hợp API hãng khóa: sinh mã theo ngày sinh nhật, mã có hạn (khi đã chọn hãng) |
| M15 | **Trang đặt phòng trực tiếp** (booking engine công khai) | BL 3.19 (kênh Website), Brief mục 1 | – | **Should**: trang xem phòng trống + giá trực tiếp + gửi yêu cầu giữ chỗ (sale xác nhận) | Đặt và thanh toán tức thì không cần người duyệt |

**Vì sao ranh giới như vậy** (PO tự quyết theo quyền ưu tiên backlog, chờ INV xác nhận phạm vi lớn qua ESC):
- R2 tập trung vào **4 việc hằng ngày có rủi ro cao nhất**: không đặt trùng, đúng tiền khi nhận/trả phòng, khai báo đúng hạn, buồng phòng biết căn nào cần dọn. Đây là những gì INV cần để "vận hành OTTIMO thật" (Brief mục 6).
- Tích hợp thật (channel manager, VNPay/MoMo, MISA, Zalo ZNS) để **R3** vì đều cần **tài khoản/hợp đồng do INV cấp** (protocol mục 8) – R2 chạy với giả lập/sandbox và nhập tay.
- Kho F&B đầy đủ, CRM gộp hồ sơ, báo cáo, kanban sale có giá trị nhưng **không chặn vận hành hằng ngày** → R3.
- Khóa cửa API để sau MVP vì **chưa biết hãng** (Rủi ro R2 trong plan); MVP vẫn phục vụ khách bằng mã nhập tay.

### 5.3 Ngoài phạm vi (không làm trong dự án, trừ khi INV quyết qua ESC)
| # | Hạng mục | Lý do |
|---|---|---|
| X1 | POS nhà hàng/quầy bar | OTTIMO không có nhà hàng; Brief mục 7 #3: chưa dùng POS |
| X2 | Kế toán tổng hợp, sổ sách thuế, tính lương | Dùng phần mềm kế toán riêng; app chỉ cung cấp số liệu doanh thu/chi phí vận hành |
| X3 | Quản lý ca làm việc, chấm công nhân sự | Đội nhỏ, giá trị thấp so với công sức (BL 9 #13) – đề xuất, chờ INV xác nhận |
| X4 | Ký số hợp đồng điện tử (chữ ký số có giá trị pháp lý) | Cần nhà cung cấp chữ ký số và tư vấn pháp lý; MVP chỉ xuất PDF hợp đồng (BL 9 #17) |
| X5 | Kết nối trực tiếp từng OTA (không qua channel manager) | Airbnb chỉ mở API cho đối tác lớn; dùng channel manager (BL 3.19) |
| X6 | Đồng bộ lịch bằng iCal | Chậm, dễ đặt trùng (BL 3.19) |
| X7 | Tự động định giá (revenue management/AI) | Cần dữ liệu vận hành thật vài tháng trước |
| X8 | Chương trình hạng thành viên/tích điểm | Chính sách kinh doanh chưa có; chỉ giữ mã giảm khách quay lại (BL 5.18) |
| X9 | Đa tiền tệ thanh toán | Thu VND; chỉ hiển thị quy đổi USD tham khảo (BL 9 #24) |
| X10 | App cài từ App Store/Google Play cho khách | Khách không phải cài app (BL 3.21); hình thức kỹ thuật app nhân viên do ARC quyết |
| X11 | Tiếng Hàn, tiếng Trung | Thay bằng tiếng Nga (decision-log P4); có thể thêm sau theo feedback |

## 6. Luồng chính cần bao phủ

### 6.1 Luồng khách (hành trình)
| Bước | Khách ngắn ngày trực tiếp/CTV | Khách OTA | Khách dài hạn | Phân hệ | Round |
|---|---|---|---|---|---|
| Tìm phòng | Hỏi qua Zalo/CTV → nhận báo giá có phòng trống | Tìm trên OTA | Hỏi qua Zalo/CTV → báo giá dài hạn | M8 (M15 ở R3) | R2 |
| Đặt | Giữ chỗ có hạn | Đơn OTA vào Desk (R2 nhập tay, R3 tự động) | Giữ chỗ → hợp đồng | M2, M8, M9 | R2 |
| Thanh toán | Cọc qua VietQR/chuyển khoản | Theo OTA (đã thu/trả tại chỗ) | Ký quỹ + kỳ đầu | M12 | R2 (cổng online R3) |
| Check-in | Check-in online qua link → nhận phòng nhanh tại quầy | Như trực tiếp | Như trực tiếp | M11, M3, M2 | R2 |
| Lưu trú | Gửi yêu cầu, xem folio, ở thêm/trả muộn | Như trực tiếp; ở thêm thu trực tiếp | Lịch dọn, hóa đơn điện nước tháng, thu theo kỳ | M11, M4, M5 | R2 (tự phục vụ ở thêm, điện nước R3) |
| Check-out | Trả phòng 3 bước + bill + thu tiền | Như trực tiếp (phát sinh) | Trả phòng có khấu trừ/hoàn ký quỹ | M2, M6, M12 | R2 (dài hạn R3) |
| Đánh giá | Mời đánh giá theo mốc, mã quay lại | Mời đánh giá trên OTA đã đặt | Hỏi thăm định kỳ | M11, M10 | R3 |

### 6.2 Luồng nhân viên
- **Lễ tân:** mở ca → xem Tổng quan/"cần chú ý" → room rack → đặt phòng/giữ chỗ → nhận phòng + giấy tờ + khai báo trước 23:00 → xử lý yêu cầu khách → nhắc/chốt giờ trả → trả phòng + bill + thu tiền.
- **Buồng phòng/Bảo trì:** mở điện thoại → việc hôm nay → bắt đầu dọn → dọn xong → kiểm phòng (checklist) → báo sự cố (tạo phiếu, khóa phòng nếu cần) → kiểm minibar → (bảo trì) xử lý phiếu, mở khóa phòng, chốt số điện nước.
- **CTV/Sale:** nhận yêu cầu khách → báo giá → gửi Zalo → giữ chỗ → xác nhận cọc → (dài hạn) hợp đồng → xem hoa hồng của mình.
- **Chủ đầu tư/Quản lý:** xem KPI + cần chú ý → duyệt FOC/giảm giá → chỉnh giá & tham số → xem báo cáo kênh, P&L (R3).

## 7. Yêu cầu phi chức năng (mức sản phẩm – chi tiết kỹ thuật do ARC/SEC)
| # | Yêu cầu | Mức đích |
|---|---|---|
| N1 | Ngôn ngữ | Giao diện nhân viên: VI (EN có sẵn chuỗi). App khách: VI + EN ở R2, thêm RU ở R3. Bill song ngữ VI/EN cho khách nước ngoài |
| N2 | Thiết bị | Lễ tân: trình duyệt máy tính. Buồng phòng/sale: điện thoại màn hình ≥ 360px. Khách: điện thoại, không cài app |
| N3 | Tốc độ cảm nhận | Màn hình chính tải ≤ 2 giây trên 4G; thao tác lưu phản hồi ≤ 1 giây `[GIẢ ĐỊNH]` |
| N4 | Mạng yếu | Buồng phòng đổi trạng thái được khi mạng chập chờn (lưu tạm, gửi lại) – mức độ do ARC đề xuất (BL 9 #22) |
| N5 | Thời gian | Giờ Việt Nam (Asia/Ho_Chi_Minh) cho mọi hạn: 23:00 khai báo, 12:00 trả phòng, hết hạn giữ chỗ |
| N6 | Dữ liệu cá nhân | Tuân thủ Nghị định 13/2023 và Luật BVDLCN 91/2025/QH15 (theo BL 5.13 – SEC xác minh); ảnh giấy tờ mã hóa, chỉ lễ tân + quản lý xem, log mọi lần xem, tự xóa theo hạn |
| N7 | Thanh toán | Không lưu số thẻ; dùng cổng thanh toán |
| N8 | Truy vết | Mọi thao tác tiền (folio, FOC, giảm giá, hủy, hoàn cọc) ghi ai – lúc nào – giá trị cũ/mới |
| N9 | Khả dụng | Truy cập được bằng bàn phím; trạng thái không chỉ bằng màu (khắc phục BL 8.3) |
| N10 | Chi phí hạ tầng | ≤ 1 triệu đ/tháng (chưa gồm channel manager, SMS/Zalo) `[GIẢ ĐỊNH – chờ INV xác nhận]` |
| N11 | Sao lưu | Không mất dữ liệu đơn/tiền quá 24 giờ khi có sự cố `[GIẢ ĐỊNH]` – OPS đề xuất ở R2–R3 |

## 8. Phụ thuộc và rủi ro sản phẩm
| # | Phụ thuộc / rủi ro | Ảnh hưởng tới phạm vi | Cách xử lý |
|---|---|---|---|
| D1 | Chính sách giá, hủy, phụ thu, ký quỹ, FOC chưa được INV chốt (BL 9 #1–12) | Tiêu chí nghiệm thu dùng giá trị mặc định | Mọi con số là tham số; ESC cuối R1 |
| D2 | Channel manager chưa chọn (BL 9 #18) | M9 R3 có thể trễ | R2 nhập tay + giả lập; ESC chọn nhà cung cấp |
| D3 | Tài khoản Zalo OA, merchant VNPay/MoMo, VietQR, MISA, cổng BCA (BL 9 #15, #19, #20) | Tích hợp R3 bị chặn nếu INV chưa cấp | R2 làm phần không cần tài khoản; ESC liệt kê tài khoản cần cấp |
| D4 | Hãng khóa cửa chưa rõ | M14 tự động để sau MVP | Nhập mã tay trong MVP |
| D5 | Persona/hành trình là mô phỏng | Ưu tiên có thể lệch nhu cầu thật | INV kiểm chứng với lễ tân, buồng phòng, khách dài hạn trước R2 |
| D6 | Phạm vi R2 lớn (M0–M5, M8, M11, M12 cùng lúc) | Trễ R2 | Thứ tự ưu tiên trong R2: M0 → M2/M8 (đơn, chống trùng) → M3 → M4/M5 → M11; story Should R2 được dời R3 nếu thiếu thời gian |
| D7 | Thời hạn lưu ảnh giấy tờ cần luật sư (BL 9 #14) | Tự xóa dùng giá trị mặc định | Tham số cấu hình; ESC pháp lý |

## 9. Giả định (dùng cho PRD này)
Mọi giả định cần ghi vào `decision-log.md` (ORC ghi khi commit) với nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]`.

| # | Giả định | Ảnh hưởng nếu sai |
|---|---|---|
| A1 | Mọi con số quy tắc ở BL mục 5 là giá trị mặc định cấu hình được (đã có trong decision-log) | Phải sửa tham số, không sửa code |
| A2 | Mục tiêu kênh trực tiếp ≥ 35% doanh thu phòng và GOP ≥ 60% là đích hợp lý (G3, G4) | Chỉ ảnh hưởng chỉ số đo, không ảnh hưởng tính năng |
| A3 | Đích S1–S12 do đội đề xuất | Điều chỉnh đích sau khi INV vận hành |
| A4 | Không có vai F&B, kế toán riêng; quản lý (anh Hoàng Anh) cùng nhóm U1 với chủ đầu tư nhưng có thể bị giới hạn xem P&L – BA chốt trong RBAC | Thêm vai con trong RBAC |
| A5 | Lễ tân trưởng là lễ tân có thêm quyền duyệt FOC trong hạn mức (hạn mức chờ ESC – BL 9 #8) | Đổi quyền duyệt |
| A6 | Khách tìm phòng chủ yếu qua OTA và hỏi trực tiếp Zalo/CTV; booking engine công khai chỉ là Should R3 | Nếu INV coi website đặt phòng là bắt buộc → tăng phạm vi R3 |
| A7 | Khóa cửa: MVP lễ tân nhập mã tay; tự động sinh mã sau MVP | Nếu INV muốn tự động ngay → phụ thuộc chọn hãng có API |
| A8 | R2 chạy thanh toán ở chế độ ghi nhận + VietQR (mã QR theo số tiền, không tự đối soát); cổng VNPay/MoMo ở R3 | Nếu cần thu online ngay R2 → cần tài khoản sandbox sớm |
| A9 | Nhân viên dùng giao diện tiếng Việt; khách dùng VI/EN (RU từ R3) | Thêm ngôn ngữ giao diện nhân viên |
| A10 | Thiết bị: lễ tân máy tính, buồng phòng/sale điện thoại; không yêu cầu chạy offline hoàn toàn (BL 9 #22) | Nếu cần offline đầy đủ → thay đổi kiến trúc |
| A11 | MVP 1 cơ sở, thiết kế sẵn đa cơ sở (đã có trong decision-log) | – |
| A12 | P&L R3: nhập chi phí trực tiếp trong app mức đơn giản, chưa có thuê nhà/khấu hao (BL 9 #26) | Thêm phân hệ chi phí |

## 10. Câu hỏi mở (sẽ gom ESC cùng DOM ở đợt 3 – chưa tạo ESC ở đợt này)
- Xác nhận ranh giới MVP R2/R3/sau MVP/ngoài phạm vi ở mục 5 (BL 9 #21).
- Booking engine công khai (M15) có bắt buộc cho RC không (A6)?
- Ngoài ra: các nhóm ESC dự kiến ở `plan.md` mục 8.

## 11. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 (đợt 1) | Bản nháp đầu tiên | PO |
