# PRD – OTTIMO Desk · App All-in-one cho OTTIMO Boutique Stay (MVP)

- Người viết: PO | Round 1 – Bước 2, đợt 1 (cập nhật đợt 3; sửa ở bước 4 theo review BA, DOM, QA; Round 2 tuần 1 – W12 áp kết quả 13 ESC) | Ngày: 16/10/2026
- Trạng thái: **v0.4** – đã qua review bắt buộc của BA, DOM (bước 3) và sửa ở bước 4 (`rounds/round-01/responses/PO-responses.md`). Phạm vi MVP: **INV quyết ESC-012 16/10** – phương án A (ranh giới, mục tiêu), **R-C** cho Round 2 (mục 5.4), logo L-A (câu hỏi BL 9 #21). INV đã quyết cả 13 ESC theo đề xuất của đội; thông tin INV còn phải gửi vẫn giữ nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` (mục 10). Kết cục 26 câu hỏi BL mục 9: `open-questions-resolution.md`.
- Đầu vào: `00-brief/investor-brief.md` (gọi tắt **Brief**), `01-decisions/decision-log.md`, `product/docs/round-0-baseline.md` (gọi tắt **BL**), `rounds/round-01/plan.md`.
- Tài liệu liên quan: `business-rules.md` (DOM – nguồn sự thật cho mọi con số quy tắc, mã BR-xxx), `use-cases.md`, `state-machines.md`, `rbac-matrix.md` (BA), `metrics-definitions.md` (DATA), `architecture.md` (ARC), `baseline-issues-triage.md` (DOM), `research/personas.md`, `research/journeys.md` (UXR), `integrations.md` (INT), `security/data-risk-assessment.md` (SEC).
- Backlog chi tiết: `03-backlog/backlog.md`.

> **Quy ước số liệu:** PRD này không là nguồn sự thật cho giá, %, giờ, phí – chỉ tham chiếu mã **BR-xxx** của `business-rules.md` (tiêu chí QC B3). Con số còn lại trong PRD là mục tiêu kinh doanh (mục 3) hoặc số liệu hiện trạng từ BL, không phải quy tắc. Mọi con số quy tắc là **giá trị mặc định cấu hình được** (decision-log 15/10/2026); chính sách theo phương án A – **INV quyết ESC-004…ESC-008 16/10**, vẫn đổi được bằng tham số.

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
| Khai báo lưu trú làm tay, một mốc hạn chung cho mọi khách, không có nhắc thật | Rủi ro bị xử phạt hành chính (hạn khách nước ngoài có thể sớm hơn – BR-603) | BL 5.12 |

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
| G3 | Giảm phí kênh bằng cách kéo khách về kênh trực tiếp | Trực tiếp 52,2/186,4 tr ≈ **28%** doanh thu phòng T9; phí kênh ≈ 18,1 tr/tháng | Trực tiếp **≥ 35%** doanh thu phòng sau 3 tháng vận hành (CTV không tính là kênh trực tiếp – INV quyết ESC-012 16/10) | BL 5.11 |
| G4 | Giữ biên lợi nhuận gộp | GOP ~61% (T9) | **≥ 60%** (INV quyết ESC-012 16/10) | BL 5.11 |
| G5 | Tuân thủ pháp lý | Khai báo làm tay | **100%** khách được khai báo đúng hạn (mục tiêu kinh doanh – nghĩa vụ pháp lý); 0 sự cố lộ dữ liệu giấy tờ | BL 5.12, 5.13 |

### 3.2 Chỉ số thành công của sản phẩm (đo sau khi INV vận hành thật từ Round 4)
Các chỉ số dưới đây là đích đội đề xuất, INV đồng ý (INV quyết ESC-012 16/10 – phương án A); công thức chính xác do DATA chốt trong `metrics-definitions.md`.

| # | Chỉ số | Đích | Cách đo (dự kiến) |
|---|---|---|---|
| S1 | Số lần **đặt trùng phòng** do hệ thống | **0** | Theo `metrics-definitions.md` (DATA): **S1a** (đích 0) – cặp căn × đêm có ≥ 2 khối chiếm tồn phòng cùng lúc (`hold`, `confirmed`, `in_house` hoặc OOO) trong dữ liệu Desk; **S1b** (báo riêng) – cảnh báo overbooking do đơn OTA về khi đã hết phòng; **S1c** (giám sát) – đêm xung đột chưa gán căn |
| S2 | Tỉ lệ khách được **khai báo lưu trú đúng hạn** (hạn theo BR-602 / BR-603) | **100%** với khách nhận phòng trong giờ trực lễ tân (`front_desk_hours` – BR-811) – đây là đích nghiệm thu, khớp G5; **≥ 98%** tính trên toàn bộ khách là ngưỡng cảnh báo của DATA (phần thiếu thường do khách đến ngoài giờ trực mà không check-in online) | Thời điểm ghi mã hồ sơ so với hạn |
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

5 nhóm người dùng (4 nội bộ + khách), theo decision-log 15/10/2026 "cả 4 nhóm dùng thử". Persona chi tiết do UXR viết ở `research/personas.md` (mô phỏng – cần INV kiểm chứng). Quyền chi tiết (màn hình, hành động, trường nhạy cảm) theo `rbac-matrix.md` của BA – mã vai trong ngoặc là mã dùng chung cho mọi tài liệu và code; bảng dưới chỉ là định hướng sản phẩm.

| # | Nhóm | Ai (theo BL) | Thiết bị chính `[GIẢ ĐỊNH]` | Việc quan trọng nhất | Không được thấy (định hướng) |
|---|---|---|---|---|---|
| U1a | **Chủ đầu tư** (`owner`) | Chủ đầu tư | Laptop + điện thoại | Xem KPI và "cần chú ý", duyệt FOC/giảm giá, cấu hình giá & quy tắc, gán vai, cấp thiết bị được phép xem giấy tờ, xem báo cáo kênh và P&L | – (toàn quyền; mọi lần xem ảnh giấy tờ vẫn ghi log) |
| U1b | **Quản lý** (`manager`) | Quản lý anh Hoàng Anh | Laptop + điện thoại | Vận hành hằng ngày, duyệt FOC/hoàn tiền theo hạn mức, sửa tham số vận hành, xử lý yêu cầu dữ liệu cá nhân | **Không được làm** (rbac mục 5.3): gán vai/mở khóa tài khoản, sửa hạn mức FOC, tỷ lệ hoa hồng, phí kênh |
| U2 | **Lễ tân** (`front_desk`; lễ tân trưởng `front_desk_lead`; gồm người trực đêm) | Lễ tân Hạnh | Máy tính quầy + điện thoại | Room rack, đặt phòng, nhận/trả phòng, bill & thu tiền, khai báo lưu trú, trả lời khách | P&L, giá vốn, hoa hồng người khác |
| U3 | **Buồng phòng / Bảo trì** (`housekeeping`, `maintenance`) | Chị Lan, Chị Mai; Anh Tùng (kỹ thuật) | Điện thoại | Việc hôm nay, đổi trạng thái buồng, kiểm phòng, minibar, phiếu sửa chữa, chốt số điện nước | Giấy tờ khách, giá phòng, doanh thu, giá vốn kho (chỉ thấy số lượng) |
| U4 | **CTV / Sale** (`sales_staff`, `collaborator`) | NV Hạnh (sale nội bộ), CTV Minh Anh | Điện thoại | Báo giá, giữ chỗ, theo dõi khách tiềm năng, xem hoa hồng **của mình** | Giấy tờ khách, P&L, báo cáo kênh, hoa hồng người khác, phòng chi tiết khách không do mình bán |
| U5 | **Khách lưu trú** (`guest` – không có tài khoản, dùng link của đơn) – 3 kiểu: (a) ngắn ngày nội địa đặt trực tiếp/Zalo; (b) khách OTA (nhiều người nước ngoài); (c) khách nước ngoài thuê tháng, làm việc từ xa (Anh/Nga) | Ji-woo, Huy, Daniel, Emma (dữ liệu mẫu BL 3.21) | Điện thoại, không cài app | Check-in online, nhận mã cửa/thông tin Wi-Fi, gửi yêu cầu, xem hóa đơn & điện nước, ở thêm/trả muộn, đánh giá | Mọi dữ liệu không thuộc đơn của mình |

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
| M0 | **Nền tảng**: đăng nhập, phân quyền 4 vai + khách, cơ sở/căn/nhóm căn, tham số cấu hình, nhật ký thao tác | BL 2, 4.1, 7 | Đăng nhập, RBAC theo màn hình + hành động + trường nhạy cảm, danh mục căn & giá niêm yết, bảng tham số quy tắc, nhật ký thao tác, giờ Việt Nam và **ngày nghiệp vụ đổi lúc 06:00** (BR-010), hộp xác nhận cho hành động không đảo ngược (HR-06), duyệt FOC bằng **xác thực lại mật khẩu** của người duyệt, tài khoản 8 vai tạo bằng dữ liệu khởi tạo, **thiết bị được cấp** cho dữ liệu giấy tờ (US-142) | Quản lý người dùng tự phục vụ (US-008), PIN duyệt riêng, xác thực hai bước cho `owner`/`manager` (US-143) | Vận hành đa cơ sở thật (đã thiết kế sẵn) |
| M1 | **Tổng quan (dashboard)** | BL 3.2 | KPI đêm nay (công suất, khách đến/đi, đang ở), "cần chú ý" tính từ dữ liệu thật, việc trong ngày | ADR/RevPAR tháng, biểu đồ công suất 30+14 ngày, so sánh kỳ trước | Cảnh báo lệch mục tiêu (BL 9 #25) |
| M2 | **Lễ tân** | BL 3.3–3.10 | Room rack 14 ngày, đặt phòng mới ngắn ngày (kênh, giá, mã OTA), chi tiết đơn & folio, nhận phòng (phụ thu sớm + FOC có duyệt), trả phòng 3 bước + bill, gia hạn, trả muộn, xác nhận giờ trả, nhắc trả phòng theo mốc giờ (hiển thị + nhắc nội bộ), chống đặt trùng ở máy chủ, đổi căn/đổi ngày/đổi phòng, đánh dấu và khôi phục no-show (BR-311), trả sớm (Should), nhận phòng trước 06:00 = bán thêm đêm (BR-417), khôi phục no-show trong ngày nghiệp vụ (BR-315) | In/xuất PDF bill, gửi bill qua email/Zalo, nhắc trả phòng tự động gửi tới khách, **đóng ca / bàn giao ca** có đối soát tiền mặt và chuyển khoản (US-124, BR-526), bảng dự phòng khi mất mạng/mất điện (US-145, BR-961…964) | – |
| M3 | **Giấy tờ & khai báo lưu trú** | BL 3.11, 5.12, 5.13 | Nhập/tải ảnh giấy tờ, đối chiếu tự động (tên, hạn hộ chiếu, thị thực, đủ người), đồng ý lưu giấy tờ, khai báo **bán tự động** (sao chép dữ liệu → cổng BCA → ghi mã hồ sơ), nhắc hạn theo BR-602/BR-603/BR-611, ảnh mã hóa + log xem + tự xóa theo hạn BR-610 | Đọc QR CCCD gắn chip, đọc MRZ hộ chiếu; **yêu cầu của chủ thể dữ liệu** (xem/sửa/xóa/rút đồng ý/nhận bản sao – UC-30, SEC R-DSR) | Kết nối tự động với cổng BCA (nếu BCA cấp kết nối) |
| M4 | **Buồng phòng** | BL 3.12, 5.15 | Trạng thái buồng 7 mã, đổi trạng thái trên điện thoại, việc hôm nay (tự sinh khi trả phòng/gia hạn/yêu cầu khách), checklist kiểm phòng, lịch dọn khách dài hạn | Phân việc theo người, ảnh sau kiểm phòng | Ca làm việc, chấm công (BL 9 #13 – đề xuất ngoài MVP) |
| M5 | **Bảo trì** | BL 3.14 | Phiếu sửa chữa (mức độ, người xử lý, trạng thái), **khóa phòng chặn bán thật** | Bảo trì định kỳ tự sinh kỳ kế tiếp, chốt số điện nước → hóa đơn tháng | – |
| M6 | **Kho F&B / minibar** | BL 3.13, 3.15, 5.14 | Kiểm minibar khi trả phòng và giữa kỳ (ghi folio), danh mục mặt hàng + giá bán | Xuất nhập tồn, kiểm kê, bổ sung tủ trừ kho, mặt hàng cần nhập, bán chạy | Giá vốn bình quân, nhà cung cấp, đơn đặt hàng, hạn sử dụng |
| M7 | **Khách hàng (CRM)** | BL 3.16, 3.17, 5.16–5.18 | Hồ sơ khách, chống tạo trùng theo SĐT/email, người đi cùng & trẻ em trong đơn, bộ chọn khách dùng chung | Gộp hồ sơ (cập nhật mọi tham chiếu + nhật ký), phân khúc, độ đầy đủ hồ sơ, dòng thời gian, đồng ý ưu đãi theo người | Chiến dịch ưu đãi theo phân khúc, hạng thành viên |
| M8 | **Sale & báo giá** | BL 3.18, 5.2–5.5 | Công cụ báo giá ngắn ngày + dài hạn, giữ chỗ (khóa phòng, hết hạn tự xử lý), xác nhận cọc/ký quỹ, sinh hợp đồng dài hạn, **ghi nhận đã thu từng kỳ** (để vòng đời HĐ tạo ở R2 không bị kẹt), văn bản báo giá để gửi Zalo | **Đơn nhóm nhiều căn** (US-140, BR-321…326), kanban khách tiềm năng, danh sách HĐ + nhắc thu đầy đủ, chào gia hạn HĐ, trả phòng dài hạn có khấu trừ/hoàn ký quỹ, hoa hồng CTV/sale (ghi nhận + đã chi), xuất PDF hợp đồng | Ký số hợp đồng (BL 9 #17 – đề xuất ngoài MVP) |
| M9 | **Kênh OTA** | BL 3.19, 5.21 | Ghi nhận đơn OTA nhập tay (kênh, mã OTA, giá thực tế); đơn OTA trùng **không bị chặn** mà gắn cờ xung đột, vào làn "Chưa gán căn", báo đỏ (US-139); lớp đồng bộ **giả lập** để đóng/mở phòng | Kết nối channel manager thật (theo ESC-009): đơn về tự động (đơn trùng đi theo luồng xung đột đã có từ R2), đẩy phòng trống & giá, nhật ký đồng bộ, đối soát | Tối ưu giá theo kênh tự động |
| M10 | **Báo cáo** | BL 3.20, 5.11 | – (chỉ KPI ở Tổng quan) | Báo cáo vận hành (công suất, ADR, RevPAR, ALOS, cơ cấu ngắn/dài hạn), kênh bán (phí kênh, thực thu), FOC, P&L đơn giản (nhập chi phí trong app), xuất file | Đánh giá OTA tự lấy từ kênh, lợi nhuận ròng có khấu hao |
| M11 | **App khách** (web trên điện thoại, mở bằng link/QR) | BL 3.21, 5.19 | Mở bằng link riêng theo đơn, check-in online (giấy tờ + giờ đến + đồng ý), gửi yêu cầu (định tuyến tới đúng bộ phận), xem hóa đơn/folio, thông tin lưu trú (Wi-Fi, giờ, chỉ đường), VI/EN; xác minh nhẹ bằng mã một lần trước khi xem mã cửa/hóa đơn (US-141); sau trả phòng link còn ân hạn ngắn **chỉ** để xem bill và trả phát sinh | Ở thêm/trả muộn tự phục vụ, trả phòng nhanh qua app (BR-427), thanh toán online, hóa đơn điện nước tháng cho khách dài hạn, tab Đà Lạt, xin đánh giá theo mốc, tiếng Nga | Mã cửa tự động qua API khóa thông minh |
| M12 | **Thanh toán & hóa đơn** (xuyên phân hệ) | BL 5.20 | Ghi nhận thu tiền 4 cách (chuyển khoản VietQR, thẻ, tiền mặt, đã thu qua OTA), VietQR theo số tiền bill (sandbox/tĩnh), folio đúng công thức. **Không nhận tiền mã hóa** (USDT…) dưới mọi hình thức – không phải phương tiện thanh toán hợp pháp ở Việt Nam (BR-527). Chuyển khoản lễ tân tự ghi mang cờ "chờ đối soát" tới khi quản lý tick theo sao kê (BR-527) | VNPay/MoMo (theo ESC-010), phát hành hóa đơn điện tử MISA meInvoice, hoàn cọc | Đối soát ngân hàng tự động |
| M13 | **Giao tiếp với khách** (xuyên phân hệ) | Brief mục 5, BL 7 | Mẫu tin nhắn đa ngôn ngữ (VI/EN/RU) để **sao chép gửi** qua nhóm chat/Zalo | Gửi tự động qua Zalo OA/ZNS và email (theo ESC-010) | WhatsApp/KakaoTalk tự động |
| M14 | **Khóa cửa thông minh** | Brief mục 7 #3 | Lễ tân **nhập tay** mã cửa vào đơn, app khách hiển thị đúng thời hạn | – | Tích hợp API hãng khóa: sinh mã theo ngày sinh nhật, mã có hạn (khi đã chọn hãng) |
| M15 | **Trang đặt phòng trực tiếp** (booking engine công khai) | BL 3.19 (kênh Website), Brief mục 1 | – | **Should**: trang xem phòng trống + giá trực tiếp + gửi yêu cầu giữ chỗ (sale xác nhận) | Đặt và thanh toán tức thì không cần người duyệt |

**Vì sao ranh giới như vậy** (PO tự quyết theo quyền ưu tiên backlog; phạm vi lớn: INV quyết ESC-012 16/10 – phương án A):
- R2 tập trung vào **4 việc hằng ngày có rủi ro cao nhất**: không đặt trùng, đúng tiền khi nhận/trả phòng, khai báo đúng hạn, buồng phòng biết căn nào cần dọn. Đây là những gì INV cần để "vận hành OTTIMO thật" (Brief mục 6).
- Tích hợp thật (channel manager, VNPay/MoMo, MISA, Zalo ZNS) để **R3** vì đều cần **tài khoản/hợp đồng do INV cấp** (protocol mục 8) – R2 chạy với giả lập/sandbox và nhập tay.
- Kho F&B đầy đủ, CRM gộp hồ sơ, báo cáo, kanban sale có giá trị nhưng **không chặn vận hành hằng ngày** → R3.
- Khóa cửa API để sau MVP vì **chưa biết hãng** (Rủi ro R2 trong plan); MVP vẫn phục vụ khách bằng mã nhập tay.

### 5.3 Ngoài phạm vi (không làm trong dự án, trừ khi INV quyết qua ESC)
| # | Hạng mục | Lý do |
|---|---|---|
| X1 | POS nhà hàng/quầy bar | OTTIMO không có nhà hàng; Brief mục 7 #3: chưa dùng POS |
| X2 | Kế toán tổng hợp, sổ sách thuế, tính lương | Dùng phần mềm kế toán riêng; app chỉ cung cấp số liệu doanh thu/chi phí vận hành |
| X3 | Xếp lịch ca làm việc, chấm công nhân sự | Đội nhỏ, giá trị thấp so với công sức (BL 9 #13) – INV quyết ESC-012 16/10 (không làm chấm công). **Không gồm** đóng ca/bàn giao tiền – đó là kiểm soát tiền, nằm trong MVP R3 (US-124) |
| X4 | Ký số hợp đồng điện tử (chữ ký số có giá trị pháp lý) | Cần nhà cung cấp chữ ký số và tư vấn pháp lý; MVP chỉ xuất PDF hợp đồng (BL 9 #17) |
| X5 | Kết nối trực tiếp từng OTA (không qua channel manager) | Airbnb chỉ mở API cho đối tác lớn; dùng channel manager (BL 3.19) |
| X6 | Đồng bộ lịch bằng iCal | Chậm, dễ đặt trùng (BL 3.19) |
| X7 | Tự động định giá (revenue management/AI) | Cần dữ liệu vận hành thật vài tháng trước |
| X8 | Chương trình hạng thành viên/tích điểm | Chính sách kinh doanh chưa có; chỉ giữ mã giảm khách quay lại (BL 5.18) |
| X9 | Đa tiền tệ thanh toán | Thu VND; chỉ hiển thị quy đổi USD tham khảo (BL 9 #24) |
| X10 | App cài từ App Store/Google Play cho khách | Khách không phải cài app (BL 3.21); hình thức kỹ thuật app nhân viên do ARC quyết |
| X11 | Tiếng Hàn, tiếng Trung | Thay bằng tiếng Nga (decision-log P4); có thể thêm sau theo feedback |

### 5.4 Điều chỉnh phạm vi Round 2 theo R-C (INV quyết ESC-012 16/10)
Bảng 5.2 giữ ranh giới MVP; trong cột "MVP – R2" các phần sau **dời sang đầu Round 3** (vẫn Must, vẫn trong MVP):
- **M8:** báo giá dài hạn (US-081); sinh HĐ + lịch kỳ thu (US-086 AC3); ghi nhận đã thu từng kỳ (US-119 AC5). R2 thay bằng **đơn dài hạn nhập tay** (US-017 AC5a) để khách dài hạn vẫn chiếm phòng trên rack; thu tiền ghi bằng US-119 AC1.
- **M1:** nhắc kỳ thu / chào gia hạn HĐ trong "Cần chú ý" (US-012 AC2, job J12).
- **M11:** xem folio/hóa đơn trên app khách (US-111); mã cửa trên app khách (phần mã cửa của US-108 AC2); xác minh mã một lần (US-141). Ở R2 app khách không hiện dữ liệu nhạy cảm nào (plan R2 P-R2-4).
- **M13:** mẫu tin nhắn đa ngôn ngữ (US-125).
- **M14:** lễ tân nhập mã cửa vào đơn (US-128) – R2 lễ tân giao mã như hiện nay.
- **M4 (PO quyết R2 Sprint 2):** lịch dọn tự động cho khách dài hạn (US-056) dời đầu R3 cùng HĐ – đơn dài hạn nhập tay ở R2 mặc định không có gói dọn (BR-204), dọn theo yêu cầu BR-506. Còn **71 story Must R2**. Ở R2 lễ tân chỉ tick "Đã giao mã cửa/thẻ" (US-025 AC7), không lưu mã.

Luồng 6.1: bước "Đặt / Thanh toán" của khách dài hạn (giữ chỗ → hợp đồng, ký quỹ + kỳ đầu) và "xem folio" của bước Lưu trú chuyển R3. Chi tiết: `rounds/round-02/plan.md` mục 2, `03-backlog/backlog.md`.

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
- **Lễ tân:** nhận bàn giao ca → xem Tổng quan/"cần chú ý" → room rack → đặt phòng/giữ chỗ → nhận phòng + giấy tờ + khai báo trước hạn (BR-602/BR-603) → xử lý yêu cầu khách → nhắc/chốt giờ trả → trả phòng + bill + thu tiền → đóng ca (R3). Người trực đêm làm trên **thiết bị của cơ sở** đã được cấp quyền (PHÂN XỬ ORC).
- **Buồng phòng/Bảo trì:** mở điện thoại → việc hôm nay → bắt đầu dọn → dọn xong → kiểm phòng (checklist) → báo sự cố (tạo phiếu, khóa phòng nếu cần) → kiểm minibar → (bảo trì) xử lý phiếu, mở khóa phòng, chốt số điện nước.
- **CTV/Sale:** nhận yêu cầu khách → báo giá → gửi Zalo → giữ chỗ → báo đã chuyển cọc kèm ảnh (CTV) / xác nhận cọc (sale nội bộ cho đơn của mình, lễ tân) → (dài hạn) hợp đồng → xem hoa hồng của mình (CTV chỉ thấy phần của mình – rbac A04, A53).
- **Chủ đầu tư/Quản lý:** xem KPI + cần chú ý → duyệt FOC/giảm giá → chỉnh giá & tham số → xem báo cáo kênh, P&L (R3).

## 7. Yêu cầu phi chức năng (mức sản phẩm – chi tiết kỹ thuật do ARC/SEC)
| # | Yêu cầu | Mức đích |
|---|---|---|
| N1 | Ngôn ngữ | Giao diện nhân viên: VI (EN có sẵn chuỗi). App khách: VI + EN ở R2, thêm RU ở R3. Bill song ngữ VI/EN cho khách nước ngoài |
| N2 | Thiết bị | Lễ tân: trình duyệt máy tính. Buồng phòng/sale: điện thoại màn hình ≥ 360px. Khách: điện thoại, không cài app |
| N3 | Tốc độ cảm nhận | Màn hình chính tải ≤ 2 giây trên 4G; thao tác lưu phản hồi ≤ 1 giây `[GIẢ ĐỊNH]` |
| N4 | Mạng yếu | Buồng phòng đổi trạng thái được khi mạng chập chờn (lưu tạm, gửi lại) – mức độ do ARC đề xuất (BL 9 #22) |
| N5 | Thời gian | Giờ Việt Nam (Asia/Ho_Chi_Minh) cho mọi hạn (BR-001): hạn khai báo (BR-602/603), giờ chuẩn nhận/trả (BR-401), hết hạn giữ chỗ (BR-302/303) |
| N6 | Dữ liệu cá nhân | Tuân thủ Nghị định 13/2023 và Luật BVDLCN 91/2025/QH15 (theo BL 5.13 – SEC xác minh); ảnh giấy tờ mã hóa, chỉ lễ tân + quản lý xem trên thiết bị được cấp, log mọi lần xem, tự xóa theo hạn. Lưu ý sức khỏe của khách (dị ứng…) chỉ chọn từ danh mục, không ghi vào ghi chú tự do – cần đồng ý riêng hay không chờ luật sư (ESC-001) |
| N7 | Thanh toán | Không lưu số thẻ; dùng cổng thanh toán |
| N8 | Truy vết | Mọi thao tác tiền (folio, FOC, giảm giá, hủy, hoàn cọc) ghi ai – lúc nào – giá trị cũ/mới |
| N9 | Khả dụng | Truy cập được bằng bàn phím; trạng thái không chỉ bằng màu (khắc phục BL 8.3) |
| N10 | Chi phí hạ tầng | ≤ 1 triệu đ/tháng (chưa gồm channel manager, SMS/Zalo); dữ liệu khách đặt tại Việt Nam, gói hosting H-B – INV quyết ESC-002 16/10. Tên miền `[GIẢ ĐỊNH – chờ INV xác nhận]` – INV gửi (ESC-010) |
| N11 | Sao lưu | Theo mục tiêu khôi phục của OPS (decision-log: mất tối đa ~15 phút dữ liệu – RPO ≤ 15 phút); backup ≤ 35 ngày (SEC) |

## 8. Phụ thuộc và rủi ro sản phẩm
| # | Phụ thuộc / rủi ro | Ảnh hưởng tới phạm vi | Cách xử lý |
|---|---|---|---|
| D1 | Chính sách giá, hủy, phụ thu, ký quỹ, FOC, điện nước, VAT (BL 9 #1–12, #16) – INV quyết ESC-004…008 16/10 theo phương án A; còn chờ INV gửi sức chứa thật từng căn (ESC-004) và loại hình kinh doanh (ESC-008) `[GIẢ ĐỊNH – chờ INV xác nhận]` | Tiêu chí nghiệm thu dùng giá trị mặc định của BR | Mọi con số là tham số; ESC-004 … ESC-008 |
| D2 | Channel manager chưa chọn (BL 9 #18) | M9 R3 có thể trễ | R2 nhập tay + giả lập; R3 Beds24 – INV quyết ESC-009 16/10 |
| D3 | Tài khoản Zalo OA, merchant VNPay/MoMo, VietQR, MISA, cổng BCA (BL 9 #15, #19, #20) | Tích hợp R3 bị chặn nếu INV chưa cấp | R2 làm phần không cần tài khoản; bộ kênh B (VietQR + báo tiền về + VNPay + MISA + email) – INV quyết ESC-010 16/10; tài khoản ngân hàng `[GIẢ ĐỊNH – chờ INV xác nhận]` – INV gửi |
| D4 | Hãng khóa cửa chưa rõ; mã sinh nhật dễ đoán | M14 tự động để sau MVP | Nhập mã tay trong MVP; mã ngẫu nhiên, mã sinh nhật ddmm + 3 số khi khách muốn – INV quyết ESC-011 16/10; thông tin khóa `[GIẢ ĐỊNH – chờ INV xác nhận]` – INV gửi |
| D5 | Persona/hành trình là mô phỏng | Ưu tiên có thể lệch nhu cầu thật | INV kiểm chứng với lễ tân, buồng phòng, khách dài hạn theo phiếu 1 trang trước bước Sản xuất R2 – INV quyết ESC-003 16/10 |
| D6 | Phạm vi R2 lớn (M0–M5, M8, M11, M12 cùng lúc); ước lượng lệch: ARC 9–11, BE 20–25 tuần-người backend | Trễ R2 | Thứ tự ưu tiên trong R2: M0 → M2/M8 (đơn, chống trùng) → M3 → M4/M5 → M11; story Should R2 được dời R3 nếu thiếu thời gian; **không được cắt**: nền tảng, chống trùng, folio/thanh toán, bảo vệ giấy tờ. **INV quyết ESC-012 16/10: R-C** – 72 story Must R2 (5 story dời đầu R3, 4 story làm một phần – mục 5.4). Vòng đời HĐ dài hạn: tạo + ghi thu kỳ ở cùng một round (cả hai dời đầu R3 theo R-C; R2 có đơn dài hạn nhập tay để chiếm phòng trên rack); trả phòng dài hạn, điện nước ở R3 |
| D7 | Thời hạn lưu ảnh giấy tờ cần luật sư (BL 9 #14) | Tự xóa dùng giá trị mặc định | Tham số cấu hình; INV quyết ESC-001 16/10: thuê luật sư rà soát trước khi đưa dữ liệu khách thật vào (cuối R2) |

## 9. Giả định (dùng cho PRD này)
Mọi giả định cần ghi vào `decision-log.md` (ORC ghi khi commit) với nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]`. Từ 16/10/2026 các giả định gắn với ESC-001…013 đã được INV quyết theo đề xuất của đội (ghi "INV quyết ESC-xxx 16/10"); nhãn chỉ còn ở thông tin INV phải gửi và giả định không thuộc ESC.

| # | Giả định | Ảnh hưởng nếu sai |
|---|---|---|
| A1 | Mọi con số quy tắc ở BL mục 5 là giá trị mặc định cấu hình được (đã có trong decision-log) | Phải sửa tham số, không sửa code |
| A2 | Mục tiêu kênh trực tiếp ≥ 35% doanh thu phòng và GOP ≥ 60% là đích hợp lý (G3, G4) – INV quyết ESC-012 16/10 | Chỉ ảnh hưởng chỉ số đo, không ảnh hưởng tính năng |
| A3 | Đích S1–S12 do đội đề xuất – INV quyết ESC-012 16/10 | Điều chỉnh đích sau khi INV vận hành |
| A4 | Không có vai F&B, kế toán riêng; quyền của `manager` khác `owner` đã chốt ở `rbac-matrix.md` mục 5.3 – chờ INV xác nhận | Thêm vai con trong RBAC |
| A5 | Lễ tân trưởng là lễ tân có thêm quyền duyệt FOC trong hạn mức; lễ tân được **tự miễn** minibar trong hạn mức lần + hạn mức tháng 500.000 đ/người/tháng (INV quyết ESC-007 16/10) | Đổi quyền duyệt |
| A6 | Khách tìm phòng chủ yếu qua OTA và hỏi trực tiếp Zalo/CTV; booking engine công khai chỉ là Should R3 | Nếu INV coi website đặt phòng là bắt buộc → tăng phạm vi R3 |
| A7 | Khóa cửa: MVP lễ tân nhập mã tay; tự động sinh mã sau MVP (INV quyết ESC-011 16/10; thông tin khóa `[GIẢ ĐỊNH – chờ INV xác nhận]` – INV gửi) | Nếu INV muốn tự động ngay → phụ thuộc chọn hãng có API |
| A8 | R2 chạy thanh toán ở chế độ ghi nhận + VietQR (mã QR theo số tiền, không tự đối soát); cổng VNPay ở R3 (INV quyết ESC-010 16/10 – bộ B; tài khoản ngân hàng `[GIẢ ĐỊNH – chờ INV xác nhận]` – INV gửi, R2 dùng tài khoản thử) | Nếu cần thu online ngay R2 → cần tài khoản sandbox sớm |
| A9 | Nhân viên dùng giao diện tiếng Việt; khách dùng VI/EN (RU từ R3) | Thêm ngôn ngữ giao diện nhân viên |
| A10 | Thiết bị: lễ tân máy tính, buồng phòng/sale điện thoại; không yêu cầu chạy offline hoàn toàn (BL 9 #22) | Nếu cần offline đầy đủ → thay đổi kiến trúc |
| A11 | MVP 1 cơ sở, thiết kế sẵn đa cơ sở (đã có trong decision-log) | – |
| A12 | P&L R3: nhập chi phí trực tiếp trong app mức đơn giản, chưa có thuê nhà/khấu hao (BL 9 #26) | Thêm phân hệ chi phí |
| A13 | "Hôm nay" trong app = ngày nghiệp vụ đổi lúc 06:00 (BR-010) | Khách đến sau nửa đêm biến khỏi danh sách nếu sai |
| A14 | Người trực đêm dùng thiết bị của cơ sở (máy quầy/máy tính bảng) được owner cấp quyền (PHÂN XỬ ORC) – ca tối phương án T-A: INV quyết ESC-010 16/10 | Nếu không có người/thiết bị → khách khuya phải check-in online trước |

## 10. Câu hỏi mở → ESC (đợt 3)
Toàn bộ 26 câu hỏi BL mục 9 và các câu mới (DOM Q-D1…Q-D5, DATA O-1…O-3, BA, UXD, OPS) đã có kết cục – bảng truy vết ở `open-questions-resolution.md`. **Trạng thái 16/10/2026: INV đã quyết cả 13 ESC (001–013) theo đề xuất của đội** (`02-escalations/escalations-index.md`). Thông tin INV còn phải gửi, giữ nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` tới khi nhận: sức chứa thật từng căn (ESC-004), loại hình kinh doanh – doanh nghiệp hay hộ kinh doanh (ESC-008), tài khoản ngân hàng nhận VietQR + tên miền (ESC-010), thông tin hãng/model khóa cửa (ESC-011). Danh sách ESC:

| ESC | Nội dung | Ảnh hưởng PRD |
|---|---|---|
| ESC-001 | Luật sư: thời hạn lưu giấy tờ, hạn khai báo khách NN, ngưỡng tuổi trẻ em, hạn trả lời yêu cầu dữ liệu, nhận phòng khi hộ chiếu/thị thực không đạt, lưu ý sức khỏe | M3, N6 |
| ESC-002 | Nơi đặt dữ liệu + gói hosting + tên miền | N10, N11 |
| ESC-003 | Kiểm chứng nhanh với người dùng thật | Mục 4, D5 |
| ESC-004 | Chính sách giá ngắn ngày, sức chứa từng căn, ở tối thiểu, mùa cao điểm Đà Lạt | M2, M8 |
| ESC-005 | Thuê dài hạn, phí dịch vụ, hoa hồng | M8 |
| ESC-006 | Hủy, hoàn cọc, chấm dứt HĐ, giữ chỗ hết hạn, hoàn ký quỹ, bất khả kháng, khách không cọc online được | M2, M8, M12 |
| ESC-007 | Phụ thu nhận sớm/trả muộn (cả cơ sở tính cho đơn OTA), hạn mức FOC, hạn mức tháng lễ tân tự miễn | M0, M2 |
| ESC-008 | Điện nước, giặt ủi, dọn phòng, VAT, loại hình kinh doanh, thuế suất có ngày hiệu lực | M5, M12, M10 |
| ESC-009 | Channel manager | M9 |
| ESC-010 | Tài khoản thanh toán, hóa đơn, Zalo, email, cổng khai báo; ai trực tối, ở đâu, thiết bị gì; gửi mã xác minh qua OTA/Zalo | M3, M11, M12, M13 |
| ESC-011 | Khóa cửa và mã sinh nhật | M14 |
| ESC-012 | Phạm vi MVP, phạm vi Round 2 khi ước lượng vượt, mục tiêu G3/G4 (CTV có tính kênh trực tiếp), logo | Mục 3, 5, D6 |
| ESC-013 | Môi trường chạy thử khung + kiểm tra tự động (INV cài Node 22 + Docker, tạo repo GitHub riêng tư) | Hạ tầng R2 (không đổi phạm vi) |

## 11. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 (đợt 1) | Bản nháp đầu tiên | PO |
| 15/10/2026 | 1 (đợt 3) | Bỏ con số quy tắc, tham chiếu BR; thêm mã vai RBAC; bổ sung phân hệ (no-show, trả sớm, xác nhận hành động, yêu cầu chủ thể dữ liệu, xung đột OTA, trả phòng nhanh); gắn ESC-001…012 vào phụ thuộc và câu hỏi mở | PO |
| 15/10/2026 | 1 (bước 4) | Theo review BA/DOM/QA: S1 trỏ S1a/S1b DATA, S2 thống nhất với G5; tách U1 thành `owner`/`manager`; M0 xác thực lại bằng mật khẩu ở R2, PIN + 2FA ở R3, thiết bị được cấp; ngày nghiệp vụ 06:00; xung đột OTA lên R2; ghi thu kỳ HĐ lên R2; đóng ca R3 (tách khỏi X3); đơn nhóm R3; không nhận tiền mã hóa; sửa luồng CTV ở 6.2; N11 theo RPO của OPS; D6 thêm ước lượng lệch và câu phụ ESC-012; thêm giả định A13, A14 | PO |
| 16/10/2026 | 2 (tuần 1 – W12) | v0.4: áp kết quả 13 ESC INV quyết 16/10 – bỏ nhãn giả định ở G3, G4, S1–S12, X3, N10, A2, A3, A5, A14, D1–D7, quy ước số liệu; giữ nhãn cho thông tin INV còn phải gửi (sức chứa – ESC-004, loại hình kinh doanh – ESC-008, tài khoản ngân hàng + tên miền – ESC-010, thông tin khóa – ESC-011); thêm mục 5.4 phạm vi R2 theo R-C | PO |
| 16/10/2026 | 2 (Sprint 2 – Phản hồi & sửa) | Mục 5.4 thêm dòng M4: US-056 dời R3 (71 Must R2) | PO |
