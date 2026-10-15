# Ma trận phân quyền (RBAC) – OTTIMO Desk

- Tác giả: BA | Round 1 – Bước 2 (Sản xuất, đợt 2) | Ngày: 15/10/2026 | Phiên bản: 0.1 (chờ review DOM, ARC; khuyến nghị mạnh SEC, QA)
- Nguồn: BL mục 2 và 8.2 #27; `security/data-risk-assessment.md` mục 3 (thang C0–C3), mục 4 (kiểm kê D01–D28), mục 8 (R-REG), mục 11; `business-rules.md` (BR-432, 433, 610…); `PRD.md` mục 4; backlog US-002, 003, 007, 020, 048, 087; decision-log 15/10/2026.
- Không chép con số nghiệp vụ: hạn mức duyệt, thời hạn lưu… ghi bằng mã BR.
- Đọc cùng `state-machines.md` (cột "Ai được chuyển" dùng cùng mã vai).

## 1. Vai và nhóm người dùng

| Mã | Vai (code) | Nhóm PRD | Ai (BL/persona) | Thiết bị chính `[GIẢ ĐỊNH]` | Màn hình mặc định sau đăng nhập |
|---|---|---|---|---|---|
| OWN | `owner` – Chủ đầu tư | U1 | Chủ đầu tư (P1) | Điện thoại + laptop | Tổng quan |
| MGR | `manager` – Quản lý | U1 | Quản lý anh Hoàng Anh | Laptop + điện thoại | Tổng quan |
| FDL | `front_desk_lead` – Lễ tân trưởng | U2 | Lễ tân trưởng Hạnh | Máy quầy | Lễ tân (room rack) |
| FD | `front_desk` – Lễ tân (gồm người trực đêm BR-611) | U2 | Lễ tân (P2) | Máy quầy + điện thoại | Lễ tân (room rack) |
| HK | `housekeeping` – Buồng phòng | U3 | Chị Lan, chị Mai (P3) | Điện thoại | Buồng phòng – việc hôm nay |
| MT | `maintenance` – Bảo trì/kỹ thuật | U3 | Anh Tùng (P3 kiêm) | Điện thoại | Bảo trì – phiếu đang mở |
| SAL | `sales_staff` – Sale nội bộ (nhân viên) | U4 | NV Hạnh | Điện thoại | Sale & báo giá |
| CTV | `collaborator` – CTV/môi giới (ngoài biên chế) | U4 | CTV Minh Anh (P4) | Điện thoại | Sale & báo giá |
| GST | Khách (không có tài khoản; truy cập bằng link theo đơn) | U5 | P5, P6, P7 | Điện thoại | App khách của đơn |
| SYS | Hệ thống (job, webhook) | – | – | – | – |

Quy tắc vai:
1. **Kế thừa**: FDL = FD + quyền duyệt trong hạn mức BR-433 + ngoại lệ nhận phòng (BR-402). OWN = MGR + quản lý tài khoản/vai + đặt hạn mức FOC và tỷ lệ hoa hồng (mục 5.3).
2. **Nhiều vai một người**: quyền = hợp các vai (ví dụ P2 lễ tân kiêm sale nội bộ = FD ∪ SAL; P3 = HK ∪ MT). Phạm vi dữ liệu "của mình" của SAL vẫn áp cho màn Sale; khi thao tác ở màn Lễ tân thì theo quyền FD.
3. **Theo cơ sở**: mọi quyền gắn với cơ sở (đa cơ sở thiết kế sẵn, MVP 1 cơ sở – decision-log). Người dùng chỉ thấy cơ sở được gán.
4. **Không có vai F&B, kế toán riêng** (decision-log PO): việc kho do FD+HK, việc kế toán do OWN/MGR.
5. Vai khách GST không phải tài khoản: link riêng của đơn, hết hạn khi trả phòng (decision-log SEC F09); dữ liệu nhạy cảm cần thêm bước xác minh nhẹ (US-106 AC3 – cách làm SEC/ARC chốt).

## 2. Ký hiệu

| Ký hiệu | Nghĩa |
|---|---|
| ✔ | Được, toàn bộ dữ liệu của cơ sở |
| M | Chỉ dữ liệu **của mình** (do mình tạo, được gán phụ trách, hoặc mình là người chốt) |
| T | Chỉ dữ liệu **liên quan việc hôm nay** của mình (căn có việc/phiếu được giao hoặc trong danh sách hôm nay) |
| Đ | Chỉ đơn của chính khách (link) |
| R | Chỉ xem (không sửa) |
| D | Được gửi, **cần duyệt** qua SM-10 |
| L | Mỗi lần xem/thao tác ghi nhật ký truy cập C3 |
| ✖ | Không có quyền: không hiện menu/nút **và** server từ chối, ghi nhật ký lần bị từ chối (US-002 AC2) |

Mức phân loại dữ liệu theo SEC mục 3: **C0** công khai · **C1** nội bộ · **C2** nhạy cảm · **C3** rất nhạy cảm.

## 3. Ma trận theo màn hình

| Mã | Màn hình (phân hệ PRD) | OWN | MGR | FDL | FD | HK | MT | SAL | CTV | GST |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| S01 | Đăng nhập, đổi mật khẩu, PIN duyệt (M0) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✖ |
| S02 | Tổng quan – KPI đêm nay, khách đến/đi, "Cần chú ý" (M1) | ✔ | ✔ | ✔ | ✔ ¹ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S03 | Room rack 14 ngày (M2) | ✔ | ✔ | ✔ | ✔ | R ² | R ² | R ³ | R ³ | ✖ |
| S04 | Chi tiết đơn + folio (M2) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M ⁴ | Đ |
| S05 | Đặt phòng mới ngắn ngày (M2) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ ⁵ | ✖ ⁵ | ✖ |
| S06 | Nhận phòng (M2) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S07 | Trả phòng 3 bước + bill (M2, M6, M12) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S08 | Gia hạn, trả muộn, xác nhận giờ trả, đổi phòng (M2) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | Đ ⁶ |
| S09 | Giấy tờ & khai báo lưu trú (M3) | ✔ L | ✔ L | ✔ L | ✔ L | ✖ | ✖ | ✖ | ✖ | Đ ⁷ |
| S10 | Buồng phòng – trạng thái, việc hôm nay, checklist (M4) | ✔ | ✔ | ✔ | ✔ | ✔ | R | ✖ | ✖ | ✖ |
| S11 | Bảo trì – phiếu sửa, khóa phòng, bảo trì định kỳ (M5) | ✔ | ✔ | ✔ | ✔ | ◐ ⁸ | ✔ | ✖ | ✖ | ✖ |
| S12 | Chốt công tơ điện nước (M5) | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ ⁹ | ✖ | ✖ | ✖ |
| S13 | Kho F&B / minibar (M6) | ✔ | ✔ | ✔ | ✔ ¹⁰ | ◐ ¹⁰ | ✖ | ✖ | ✖ | ✖ |
| S14 | Khách hàng – CRM (M7) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M | ✖ |
| S15 | Sale & báo giá, kanban lead (M8) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M | ✖ |
| S16 | Hợp đồng dài hạn, kỳ thu (M8) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M R | M R | Đ ¹¹ |
| S17 | Hoa hồng (M8) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | M R | M R | ✖ |
| S18 | Kênh OTA, lịch giá, đồng bộ (M9) | ✔ | ✔ | R | R ¹² | ✖ | ✖ | ✖ | ✖ | ✖ |
| S19 | Báo cáo vận hành (công suất, ADR, RevPAR, ALOS) (M10) | ✔ | ✔ | R ¹³ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S20 | Báo cáo kênh (doanh thu, phí kênh, thực thu) (M10) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S21 | Lãi lỗ P&L + nhập chi phí (M10) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S22 | Báo cáo FOC (M10) | ✔ | ✔ | M R ¹⁴ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S23 | Hộp duyệt (yêu cầu chờ duyệt SM-10) | ✔ | ✔ | ✔ ¹⁵ | M ¹⁶ | M ¹⁶ | M ¹⁶ | M ¹⁶ | ✖ | ✖ |
| S24 | Tham số quy tắc (bảng BR mục 13) (M0) | ✔ | ✔ ¹⁷ | R | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S25 | Danh mục căn, nhóm căn, giá niêm yết (M0) | ✔ | ✔ | R | R | ✖ | ✖ | R | R | ✖ |
| S26 | Người dùng & vai (M0) | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S27 | Nhật ký thao tác (tiền, trạng thái) (M0) | ✔ | ✔ | M | M | ✖ | ✖ | ✖ | ✖ | ✖ |
| S28 | Nhật ký truy cập dữ liệu C3 (M0, M3) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S29 | Mẫu tin nhắn đa ngôn ngữ – dùng / sửa mẫu (M13) | ✔ | ✔ | ✔ dùng | ✔ dùng | ✖ | ✖ | ✔ dùng | ✔ dùng | ✖ |
| S30 | Yêu cầu khách & đồ thất lạc (M11, BR-513) | ✔ | ✔ | ✔ | ✔ | T ¹⁸ | T ¹⁸ | ✖ | ✖ | Đ |
| S31 | Yêu cầu của chủ thể dữ liệu (xem/sửa/xóa/rút đồng ý – SEC R-DSR) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Đ ¹⁹ |

Ghi chú:
1. FD thấy KPI đêm nay và "Cần chú ý" vận hành; **không** thấy dòng tài chính (doanh thu tháng, ADR, RevPAR, cảnh báo FOC BR-435). Cảnh báo FOC chỉ đến OWN.
2. HK, MT xem rack ở dạng **trạng thái căn + có/không có khách đến hôm nay/ngày mai**; không thấy tên khách ngoài phạm vi T, không thấy kênh, giá.
3. SAL/CTV xem **phòng trống** (căn – đêm còn/hết) để báo giá; không thấy tên khách, kênh, giá của đơn người khác.
4. CTV chỉ thấy đơn mình chốt; không thấy folio chi tiết ngoài tổng tiền phòng và cọc (cơ sở hoa hồng).
5. SAL/CTV không đặt phòng ngắn ngày trực tiếp; tạo **giữ chỗ từ báo giá** ở S15 (BR-112, luồng P01/P02).
6. GST: yêu cầu ở thêm/trả muộn (R3 tự phục vụ – US-113); lễ tân xác nhận.
7. GST: chỉ tải giấy tờ của đơn mình (check-in online) và xem trạng thái "đã nhận/đã khai"; không xem lại ảnh đã tải.
8. HK: tạo phiếu (báo sự cố), xem phiếu của căn mình đang dọn; không đổi trạng thái phiếu.
9. MT: chỉ thấy số căn + chỉ số, **không thấy tên khách** (SEC D18).
10. FD: xuất nhập tồn, kiểm kê (nhập số), minibar; HK: kiểm minibar, tick bổ sung tủ; **HK không thấy giá vốn** (US-003 AC2). Giá vốn chỉ OWN/MGR (mục 6).
11. GST dài hạn: xem HĐ của mình, lịch dọn, kỳ thu, hóa đơn điện nước (US-114).
12. FD: xem tình trạng đồng bộ và nhật ký lỗi (BR-905) để xử lý cảnh báo; không sửa giá.
13. FDL: báo cáo vận hành không có doanh thu (chỉ công suất, ALOS, số đêm) – BA đề xuất, chờ DOM.
14. FDL: báo cáo FOC của các yêu cầu mình gửi hoặc duyệt.
15. FDL: yêu cầu thuộc hạn mức FDL theo BR-433.
16. M: chỉ thấy trạng thái các yêu cầu mình gửi.
17. MGR sửa tham số vận hành; **không** sửa hạn mức FOC (`foc_limits`), tỷ lệ hoa hồng, phí kênh – chỉ OWN (mục 5.3).
18. HK/MT: yêu cầu định tuyến tới bộ phận mình (BR-811); đồ thất lạc: HK được tạo bản ghi (người nhặt), không xem danh sách đồ giá trị.
19. GST: gửi yêu cầu qua app; OWN/MGR xử lý (SEC R-DSR-01).

## 4. Ma trận theo hành động

Cột "Duyệt" = vai duyệt khi hành động cần duyệt (SM-10). Hạn mức theo BR-433.

### 4.1 Đơn, rack, nhận/trả phòng
| # | Hành động | OWN | MGR | FDL | FD | HK | MT | SAL | CTV | GST | SYS | Duyệt / ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| A01 | Tạo đơn ngắn ngày đã đảm bảo (B2) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ (OTA R3) | – |
| A02 | Tạo giữ chỗ (B1) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M | ✖ | ✖ | Khách của mình |
| A03 | Gia hạn giữ chỗ (B3) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M | ✖ | ✖ | 1 lần (BR-303) |
| A04 | Xác nhận cọc/ký quỹ (B4) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | ✖ ²⁰ | ✖ | ✔ (IPN R3) | – |
| A05 | Hủy giữ chỗ (B5) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M | ✖ | ✔ hết hạn | Lý do BR-308 |
| A06 | Hủy đơn đã đảm bảo (B10) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M ²¹ | ✖ | ✖ | ✔ (OTA R3) | Phần hoàn → A43 |
| A07 | Đổi căn / đổi ngày (B7) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Lý do bắt buộc |
| A08 | Dời ngày thay vì hủy (B8) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | BR-309 |
| A09 | Đánh dấu no-show (B11) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Không tự động (BR-311) |
| A10 | Khôi phục no-show (B12) | ✔ | ✔ | D | D | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Duyệt MGR+ (SQ-1) |
| A11 | Nhận phòng (B9) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A12 | Nhận phòng khi buồng chưa VC/VI | ✔ | ✔ | ✔ | D | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | FDL+ (BR-402) |
| A13 | Hoàn tác nhận phòng (B17) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A14 | Gia hạn (B13) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | D (R3) | ✖ | GST gửi yêu cầu, FD xác nhận |
| A15 | Đổi phòng (B14) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Lý do bắt buộc |
| A16 | Đặt trả muộn (B15) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | D | ✖ | Có khách đến cùng ngày → MGR+ (BR-416) |
| A17 | Trả sớm (B16) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Hoàn → A43 |
| A18 | Hoàn tất trả phòng (B18) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | Đ ²² | ✖ | – |
| A19 | Ghi công nợ khi trả phòng (BR-525) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A20 | Thêm người đi cùng / trẻ em vào đơn | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | Đ | ✖ | – |
| A21 | Nhập/sửa mã cửa, số thẻ phòng (BR-403) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Mã cửa = C3 |
| A22 | Gửi link app khách / link check-in | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | ✖ | ✖ | ✔ | – |

### 4.2 Folio, tiền, duyệt
| # | Hành động | OWN | MGR | FDL | FD | HK | MT | SAL | CTV | GST | SYS | Duyệt / ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| A30 | Thêm dòng phát sinh từ danh mục (phụ thu, giặt, phạt BR-511) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | Nhật ký BR-008 |
| A31 | Sửa giá một dòng / giá đêm ngoài lịch giá | ✔ | ✔ | ✔ | ✔ ²³ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Trong sàn–trần BR-105 |
| A32 | Điều chỉnh folio đã `settled` (bút toán) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Lý do bắt buộc |
| A33 | Ghi nhận thu tiền (giao dịch `succeeded`) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | ✖ | ✖ | ✔ | Nhật ký tiền |
| A34 | Đảo giao dịch ghi sai | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A35 | Gửi FOC / giảm giá đặc biệt | ✔ | ✔ | D | D ²⁴ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | SM-10 |
| A36 | Duyệt FOC / giảm giá đặc biệt | ✔ | ✔ ²⁵ | ✔ ²⁵ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Không duyệt cho chính mình (trừ MGR/OWN) – BR-432 |
| A37 | Kiểm minibar (nhập số còn lại) | ✔ | ✔ | ✔ | ✔ | ✔ ²⁶ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A38 | Xuất hóa đơn GTGT (thông tin công ty) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | Đ ²⁷ | ✔ (MISA R3) | – |
| A39 | Tạo VietQR / link thanh toán | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | ✖ | Đ (R3) | ✔ | – |
| A43 | Gửi yêu cầu hoàn tiền (cọc, ký quỹ, trả sớm) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Duyệt MGR+ (BR-522) |
| A44 | Xem tổng thu trong ngày theo cách thanh toán | ✔ | ✔ | ✔ | M ²⁸ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |

### 4.3 Sale, hợp đồng, hoa hồng
| # | Hành động | OWN | MGR | FDL | FD | HK | MT | SAL | CTV | Duyệt / ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| A50 | Lập/lưu báo giá ngắn ngày và dài hạn | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✔ | ✔ | Snapshot BR-006 |
| A51 | Gia hạn báo giá hết hiệu lực (Q4) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | D | D | BR-304 |
| A52 | Tạo / chuyển giai đoạn lead | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M | – |
| A53 | Báo "khách đã chuyển cọc" (kèm ảnh biên nhận) | – | – | – | – | ✖ | ✖ | M | M | FD/SAL xác nhận A04 |
| A54 | Gia hạn HĐ (H4) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | D | ✖ | MGR+ duyệt khi SAL đề xuất |
| A55 | Sửa tay con số trên HĐ (H5) | ✔ | ✔ | D | D | ✖ | ✖ | ✖ | ✖ | MGR+ (BR-006) |
| A56 | Ghi chấm dứt sớm (H6) / hủy HĐ trước vào ở (H3) | ✔ | ✔ | ✔ H6 | ✔ H6 | ✖ | ✖ | ✖ | ✖ | H3: MGR+ |
| A57 | Duyệt quyết toán ký quỹ (H9) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | BR-214 |
| A58 | Ghi nhận thu kỳ (T2) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | – |
| A59 | Miễn kỳ thu (T3) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A60 | Xem hoa hồng | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | M | M | US-087, US-089 |
| A61 | Đánh dấu đã chi hoa hồng | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A62 | Xuất PDF hợp đồng (R3) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M ²⁹ | ✖ | – |

### 4.4 Giấy tờ & khai báo
| # | Hành động | OWN | MGR | FDL | FD | Khác | Ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|---|
| A70 | Nhập/tải giấy tờ, đối chiếu (K3–K5) | ✔ L | ✔ L | ✔ L | ✔ L | GST Đ (tải lên) | Không nhận ảnh qua chat (R-REG-08) |
| A71 | Xem ảnh giấy tờ | ✔ L | ✔ L | ✔ L | ✔ L ³⁰ | ✖ | Chỉ trong hạn lưu BR-610 |
| A72 | Ghi đồng ý lưu ảnh (BR-609) | ✔ | ✔ | ✔ | ✔ | GST Đ | Không bắt buộc để khai báo (R-REG-05) |
| A73 | Sao chép dữ liệu khai báo, ghi mã hồ sơ (K6–K10) | ✔ L | ✔ L | ✔ L | ✔ L ³¹ | ✖ | Chỉ trên máy quầy được cấp (R-REG-07) |
| A74 | Xóa sớm ảnh theo yêu cầu khách | ✔ L | ✔ L | ✖ | ✖ | ✖ | R-DSR |
| A75 | Xuất dữ liệu giấy tờ hàng loạt | ✖ | ✖ | ✖ | ✖ | ✖ | **Cấm với mọi vai** (C3 – SEC mục 3) |
| A76 | Xem nhật ký truy cập C3 | ✔ | ✔ | ✖ | ✖ | ✖ | – |

### 4.5 Buồng phòng, bảo trì, kho
| # | Hành động | OWN | MGR | FDL | FD | HK | MT | Ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|---|
| A80 | Bắt đầu dọn / dọn xong (R1–R3) | ✔ | ✔ | ✔ | ✔ | ✔ | ✖ | – |
| A81 | Kiểm phòng đạt VC → VI (R4) | ✔ | ✔ | ✔ | ✖ | ◐ ³² | ✖ | BR-802, BR-808 |
| A82 | Báo cần dọn OC → OD (R8) | ✔ | ✔ | ✔ | ✔ | ✔ | ✖ | – |
| A83 | Tạo/giao/hủy việc buồng phòng | ✔ | ✔ | ✔ | ✔ | ◐ ³³ | ✖ | – |
| A84 | Tạo phiếu sửa chữa (W1) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | – |
| A85 | Nhận / cập nhật / hoàn thành phiếu (W2–W4) | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | – |
| A86 | Tạo/kéo dài khối OOO (O1, O3) | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | Trùng đơn tương lai → MGR+ xác nhận |
| A87 | Mở khóa OOO không qua phiếu (O4) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | – |
| A88 | Chốt công tơ (BR-502) | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | Ảnh bắt buộc |
| A89 | Lưu chỉ số nhỏ hơn kỳ trước (BR-503) | ✔ | ✔ | D | D | ✖ | D | MGR+ |
| A90 | Nhập kho, xuất kho, kiểm kê | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | Chênh lệch vượt BR-705 → MGR+ |
| A91 | Sửa danh mục mặt hàng, giá bán, giá vốn | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | – |
| A92 | Ghi đồ thất lạc (BR-513) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Đồ giá trị → bàn giao MGR |

### 4.6 Cấu hình, người dùng, báo cáo
| # | Hành động | OWN | MGR | FDL | FD | Khác | Ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|---|
| A100 | Tạo/khóa tài khoản, gán vai, đặt lại mật khẩu | ✔ | ✖ | ✖ | ✖ | ✖ | US-002, US-008 |
| A101 | Sửa tham số vận hành (giờ, hạn, phụ thu, giá…) | ✔ | ✔ | ✖ | ✖ | ✖ | US-005 |
| A102 | Sửa hạn mức FOC, tỷ lệ hoa hồng, phí kênh | ✔ | ✖ | ✖ | ✖ | ✖ | Tách người đặt hạn mức với người duyệt `[GIẢ ĐỊNH]` |
| A103 | Sửa lịch giá, đẩy giá lên kênh | ✔ | ✔ | ✖ | ✖ | ✖ | BR-105 |
| A104 | Bật/tắt mở bán kênh | ✔ | ✔ | ✖ | ✖ | ✖ | – |
| A105 | Xuất báo cáo ra bảng tính (C2) | ✔ L | ✔ L | ✖ | ✖ | ✖ | SEC: xuất C2 cần quyền riêng + nhật ký |
| A106 | Sửa mẫu tin nhắn | ✔ | ✔ | ✖ | ✖ | ✖ | US-127 |
| A107 | Gộp hồ sơ khách | ✔ | ✔ | ✔ | ✔ | ✖ | BR-953 |

Ghi chú hành động:
20. CTV **không xác nhận cọc** vì không kiểm được tiền vào tài khoản OTTIMO; CTV dùng A53, FD/SAL xác nhận A04 `[GIẢ ĐỊNH – chờ INV xác nhận]`.
21. SAL hủy đơn trực tiếp do mình chốt; phần hoàn đi qua A43.
22. GST "trả phòng nhanh" (BR-427) chỉ khi còn phải thu = 0.
23. FD sửa giá trong khoảng sàn–trần BR-105; giảm dưới giá chính sách = "giảm giá đặc biệt" → A35.
24. FD tự áp được FOC minibar trong hạn mức vai FD (BR-433, BR-704) – chờ DOM trả lời SQ-3 (`state-machines.md` mục 16).
25. Trong hạn mức lần và tháng của vai (BR-433); vượt → chuyển cấp trên; xác thực bằng PIN/mật khẩu của chính người duyệt.
26. HK nhập số lượng; không thấy thành tiền và giá vốn.
27. GST nhập thông tin xuất hóa đơn công ty qua app (R3).
28. FD thấy tổng thu ca của mình (bàn giao tiền mặt – US-124).
29. SAL xuất PDF HĐ do mình chốt; bản PDF cho SAL **không in số giấy tờ** (SEC D17).
30. Xem ảnh sau khi khai báo đã `confirmed` phải chọn lý do (đối chiếu lại, khách yêu cầu, cơ quan chức năng) – BA đề xuất, chờ SEC.
31. Bản text sao chép chỉ dùng trên máy quầy, có nút xóa clipboard (R-REG-07).
32. HK tự kiểm chỉ khi đủ checklist + ảnh và cơ sở bật chế độ "1 người" (BR-802).
33. HK chỉ hủy việc "dọn phòng khách đang ở" khi khách từ chối dọn (ghi lý do).

## 5. Phê duyệt và hạn mức

### 5.1 Loại yêu cầu và người duyệt
| Loại yêu cầu (SM-10) | Người gửi | Người duyệt | Căn cứ |
|---|---|---|---|
| FOC phát sinh (phụ thu, minibar, dọn lẻ, phạt, bồi thường, đêm bù sự cố) | FD, FDL | FDL / MGR / OWN theo hạn mức | BR-431–433 |
| Giảm giá đặc biệt tiền phòng | FD, FDL, SAL | MGR / OWN theo hạn mức | BR-431 |
| Hoàn tiền (cọc, ký quỹ, trả sớm, hủy) | FD+ | MGR, OWN | BR-522 |
| Sửa tay con số trên HĐ | FD+, SAL | MGR, OWN | BR-006 |
| Nhận phòng khi buồng chưa sẵn sàng | FD | FDL, MGR, OWN | BR-402 |
| Trả muộn khi có khách đến cùng ngày | FD+ | MGR, OWN | BR-416 |
| Chỉ số công tơ nhỏ hơn kỳ trước | FD+, MT | MGR, OWN | BR-503 |
| Chênh lệch kiểm kê vượt ngưỡng | FD+ | MGR, OWN | BR-705 |
| Định giá hư hỏng ngoài bảng | FD+ | MGR, OWN | BR-512 |
| Gia hạn báo giá | SAL, CTV, FD+ | MGR, OWN | BR-304 |
| Khôi phục no-show | FD, FDL | MGR, OWN | SM-01 B12 |
| Công nợ khi trả phòng | – (MGR+ tự ghi) | MGR, OWN | BR-525 |

### 5.2 Quy tắc duyệt
1. Người duyệt xác nhận **bằng tài khoản và PIN/mật khẩu của chính mình**; người gửi không chọn tên người duyệt (BR-432, US-007 – khắc phục BL 8.2 #24).
2. Không duyệt cho yêu cầu của chính mình, trừ MGR/OWN (BR-432).
3. Hạn mức lần và hạn mức tháng theo BR-433; vượt → tự chuyển cấp trên (SM-10 A4).
4. Cảnh báo thất thoát BR-435 chỉ gửi OWN.
5. Mọi yêu cầu, kể cả bị từ chối, vào báo cáo FOC/nhật ký (BR-434).

### 5.3 Tách nhiệm vụ (kiểm soát nội bộ) `[GIẢ ĐỊNH – chờ INV xác nhận]`
- Người đặt hạn mức FOC, tỷ lệ hoa hồng, phí kênh (OWN) khác người duyệt FOC hằng ngày (FDL/MGR).
- CTV không xác nhận tiền (A04) và không xem dữ liệu khách ngoài khách của mình.
- MGR không tự gán vai cho mình hay người khác (A100 chỉ OWN).

## 6. Ma trận theo trường dữ liệu nhạy cảm

Ký hiệu thêm: **Đầy** = xem đầy đủ · **Che** = che giữa (ví dụ `0905***456`) · **4S** = chỉ 4 ký tự cuối · **Tên+căn** = chỉ tên gọi + số căn · **K** = không thấy (trường không trả về từ API, không chỉ ẩn trên giao diện).

| Mã SEC | Trường | Mức | OWN/MGR | FDL/FD | HK | MT | SAL | CTV | GST |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| D01 | Họ tên, ngày sinh, giới tính, quốc tịch | C2 | Đầy | Đầy | Tên+căn (T) | K | Tên + quốc tịch (M) | Tên + quốc tịch (M) | Đ |
| D02 | SĐT, Zalo/WhatsApp, email | C2 | Đầy | Đầy | K | K | Đầy (M) | Đầy (M) | Đ |
| D03 | Số CCCD / định danh | C3 | Đầy L (màn khai báo); 4S (CRM) | Đầy L (màn khai báo); 4S (CRM) | K | K | **K** | **K** | 4S (Đ) |
| D04 | Hộ chiếu (số, ngày cấp/hết hạn, MRZ) | C3 | như D03 | như D03 | K | K | **K** | **K** | 4S + hạn (Đ) |
| D05 | Thị thực, nhập cảnh | C3 | Đầy L | Đầy L | K | K | K | K | Hạn thị thực (Đ) |
| D06 | Ảnh giấy tờ | C3 | Đầy L | Đầy L | K | K | K | K | K (sau khi tải) |
| D07 | Địa chỉ thường trú, quê quán | C3 | Đầy L | Đầy L | K | K | K | K | K |
| D09 | Dữ liệu trẻ em (tên, năm sinh, số định danh) | C3 | Đầy L | Đầy L | K | K | K | K | Đ |
| D10 | Người đi cùng: tên, **quan hệ**, liên hệ | C2 | Đầy | Đầy | Số người | K | Số người, **không** quan hệ | Số người | Đ |
| D11 | Lịch sử lưu trú (ngày, căn, kênh, giờ thực tế) | C2 | Đầy | Đầy | Hôm nay (T) | K | M | M | Đ |
| D12 | Sở thích, tag, ghi chú tự do | C2/C3 | Đầy | Đầy | "Lưu ý phục vụ" từ danh mục (T) | K | Tag (M) | K | K |
| D13 | Dữ liệu thẻ (PAN, CVV) | C3 cấm lưu | K | K | K | K | K | K | K |
| D14 | Kết quả thanh toán (mã giao dịch, số tiền, 4 số cuối thẻ, tên người chuyển) | C2 | Đầy | Đầy | K | K | Cọc đơn M | K | Đ |
| D15 | Tài khoản ngân hàng nhận hoàn | C3 | Đầy L | Che | K | K | K | K | Đ (nhập) |
| D16 | Thông tin xuất hóa đơn (công ty, MST) | C2 | Đầy | Đầy | K | K | K | K | Đ |
| D17 | Hợp đồng dài hạn (số tiền, kỳ thu) / số giấy tờ in trên HĐ | C2 / C3 | Đầy / Đầy L | Đầy / 4S | K | K | M / **K** | M (tiền thuê, kỳ hạn) / **K** | Đ / 4S |
| D18 | Chỉ số điện nước gắn khách dài hạn | C2 | Đầy | Đầy | K | Chỉ số + căn, **không tên** | K | K | Đ |
| D19 | Mã đặt phòng OTA, dữ liệu channel manager | C2 | Đầy | Đầy | K | K | K | K | Đ (mã của mình) |
| D20 | Hồ sơ đồng ý | C2 | Đầy | Trạng thái có/không | K | K | K | K | Đ (của mình, rút lại được) |
| D21 | Vân tay | C3 | K (không lưu trên hệ thống) | K | K | K | K | K | K |
| D22 | Mã cửa còn hiệu lực, thẻ từ | C3 | Đầy L | Đầy L | K | K | K | K | Đ (chỉ trong khoảng hiệu lực BR-403) |
| D23 | Yêu cầu từ app khách, tin nhắn | C2 | Đầy | Đầy | Loại + căn + nội dung (T, định tuyến) | như HK | K | K | Đ |
| D25 | Token link app khách | C3 | K (chỉ tạo/thu hồi) | K (chỉ tạo/thu hồi) | K | K | K | K | – |
| D26 | CTV/Sale: số tài khoản, CCCD/MST | C3 | Đầy L | K | K | K | Của mình | Của mình | – |
| D27 | Tài khoản nhân viên, nhật ký thao tác | C2 | Đầy | Nhật ký của mình | K | K | K | K | – |
| D28 | Lead (tên, liên hệ, nhu cầu) | C2 | Đầy | Đầy | K | K | M | M | – |

**Dữ liệu kinh doanh nhạy cảm (BL 8.2 #27)**:
| Trường | Mức | OWN/MGR | FDL | FD | HK | MT | SAL | CTV | GST |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Giá bán phòng, folio của đơn | C2 | Đầy | Đầy | Đầy | **K** | K | M | M (tổng tiền phòng, cọc) | Đ |
| Giá bán minibar (bảng giá trong phòng) | C0 | Đầy | Đầy | Đầy | Đầy | K | K | K | Đầy |
| **Giá vốn kho**, giá trị tồn theo giá vốn, lãi gộp F&B | C2 | Đầy | K | K | **K** (chỉ số lượng) | K | K | K | K |
| **P&L**, chi phí vận hành, GOP | C2 | Đầy | K | K | K | K | **K** | **K** | K |
| Phí kênh thực tế từng đơn, thực thu, báo cáo kênh | C2 | Đầy | K | K | K | K | K | K | K |
| Tỷ lệ phí kênh cấu hình (dùng trong thông báo gia hạn BR-422) | C1 | Đầy | R | R | K | K | K | K | K |
| Doanh thu tháng, ADR, RevPAR | C2 | Đầy | K ¹³ | K | K | K | K | K | K |
| **Hoa hồng** – của mình | C2 | Đầy | – | – | – | – | Đầy (M) | Đầy (M) | K |
| **Hoa hồng** – của người khác, tổng hoa hồng | C2 | Đầy | K | K | K | K | **K** | **K** | K |
| Phần "OTTIMO còn lại" trên báo giá | C2 | Đầy | Đầy | Đầy | K | K | Đầy (báo giá M) | K ³⁴ | K |
| Báo cáo FOC | C2 | Đầy | M | K | K | K | K | K | K |

34. CTV thấy "Sale nhận" (hoa hồng của mình) trên báo giá, không thấy "OTTIMO còn lại" (biên lợi nhuận) – BA đề xuất, chờ PO/DOM.

## 7. Giải quyết mâu thuẫn BL mục 2 và BL 8.2 #27

| # | Mâu thuẫn trong prototype | Quyết định trong ma trận | Căn cứ |
|---|---|---|---|
| M1 | Lưu trữ giấy tờ ghi "buồng phòng, sale, CTV không thấy giấy tờ", nhưng vai Sale vào CRM thấy loại + số giấy tờ đã che | SAL/CTV: trường giấy tờ (D03–D07) **không trả về** ở mọi màn hình, kể cả dạng che và loại giấy tờ; "Khóa định danh" trong CRM của SAL/CTV chỉ còn SĐT, email, mã OTA (của khách mình) | BR-610, SEC D03/D04, US-003 AC1 |
| M2 | Vai Sale xem được báo cáo Lãi lỗ | P&L chỉ OWN/MGR; SAL/CTV chỉ có màn Hoa hồng (của mình) | US-003 AC3, PRD U4 |
| M3 | Vai Buồng phòng xem được giá vốn kho | HK xem số lượng, mức chuẩn, món thiếu; không có cột giá vốn, giá trị tồn, lãi gộp | US-003 AC2 |
| M4 | Mọi vai bấm được mọi hành động trong drawer/modal mở từ CRM | Quyền kiểm theo **hành động** (mục 4) ở server, độc lập màn hình đang mở; nút chỉ hiện khi vai + trạng thái hợp lệ (US-020); gọi trực tiếp → từ chối + ghi nhật ký | US-002 AC2 |
| M5 | "Xem với vai trò" chỉ ẩn menu, không có đăng nhập | Đăng nhập tài khoản riêng; menu, API, trường dữ liệu cùng theo ma trận này | US-001 |
| M6 | Sale thấy CRM toàn bộ khách | SAL/CTV chỉ thấy khách/lead **của mình** (M) | US-087, SEC D01/D02 |
| M7 | Buồng phòng thấy Kho F&B đầy đủ, Bảo trì đầy đủ | HK: minibar + bổ sung tủ, báo sự cố; MT: phiếu sửa, công tơ (không tên khách) | PRD U3, SEC D18 |
| M8 | Lễ tân không thấy Báo cáo nhưng thấy "Kênh OTA" đầy đủ (sửa giá, bật/tắt kênh) | FD/FDL chỉ xem tình trạng đồng bộ; sửa giá, bật/tắt kênh là MGR+ | BR-905, US-097, US-098 |

## 8. Quy tắc thực thi (cho ARC/BE/SEC)
1. Kiểm quyền ở **server** cho cả màn hình (API đọc), hành động (API ghi) và trường (lọc trường trong phản hồi). Ẩn trên giao diện chỉ là phụ.
2. Phạm vi "M" xác định bằng: `created_by`, `assigned_to` (lead/khách phụ trách), `closer_id` (người chốt đơn/HĐ). Phạm vi "T" bằng danh sách căn có việc/phiếu giao cho người dùng trong ngày nghiệp vụ hiện tại (giờ VN, BR-001).
3. Dữ liệu C3: đọc qua API riêng, mỗi lần đọc ghi nhật ký (ai, lúc nào, đơn/khách nào, lý do nếu có); cấm xuất hàng loạt; không đưa vào log, URL, thông báo đẩy, nội dung tin nhắn (SEC mục 3).
4. Xuất file C2 (A105) cần quyền riêng và ghi nhật ký.
5. Mỗi lần bị từ chối quyền ghi nhật ký (người, hành động, đối tượng) – OWN xem ở S27.
6. Link app khách (GST) chỉ truy cập đúng đơn; hết hạn khi trả phòng (SEC F09); với đơn dài hạn hết hạn khi HĐ `closed`.
7. Phiên đăng nhập nhân viên trên điện thoại (HK, MT, SAL, CTV) không được hiển thị trường C3 ngay cả khi người dùng có thêm vai FD – trường C3 chỉ mở trên thiết bị quầy được cấp *(BA đề xuất, chờ SEC/ARC)*.

## 9. Ngưỡng "trẻ em" – mâu thuẫn cần thống nhất
| Nguồn | Ngưỡng | Dùng để |
|---|---|---|
| BL 3.17 (modal Thêm người đi cùng) | dưới 14 tuổi | Loại "Trẻ em" trong đơn (không hồ sơ CRM, chỉ năm sinh) |
| SEC R-CON-05 (luật trẻ em VN) | dưới 16 tuổi | Chế độ bảo vệ dữ liệu trẻ em (C3, không CRM/marketing) |
| BR-110 | bậc tuổi riêng | Phụ thu người/trẻ em (giá) |

Quyết định BA (cách trình bày đặc tả, thuộc quyền BA): tách **hai thuộc tính độc lập** trên mỗi người trong đơn:
- `is_minor_data` = tuổi dưới **ngưỡng bảo vệ dữ liệu của SEC** (thay ngưỡng BL 3.17): người này xử lý như D09 (C3), không tạo hồ sơ CRM, không lưu liên hệ, không đồng ý marketing.
- Bậc tuổi tính phụ thu: theo BR-110, không liên quan quyền dữ liệu.
Đề nghị DOM thêm tham số ngưỡng vào BR-612; ngưỡng cuối cùng do luật sư xác nhận trong phạm vi ESC-001 (đề xuất bổ sung câu hỏi – xem report BA).

## 10. Truy vết
| Story | Mục trong tài liệu này |
|---|---|
| US-001, US-002 | 1, 3, 8 |
| US-003 | 6, 7 (M1–M3) |
| US-007 | 4.2 (A35, A36), 5 |
| US-020 | 4 (cùng `state-machines.md`) |
| US-048 | 4.4, 6 (D03–D06) |
| US-080 | 6 (phần "OTTIMO còn lại", hoa hồng) |
| US-087, US-089 | 3 (S14–S17), 4.3, 6 |

## 11. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 (đợt 2) | Bản đầu: 9 vai + hệ thống, 31 màn hình, ~70 hành động, ma trận trường theo D01–D28 và dữ liệu kinh doanh; giải quyết BL 2 và 8.2 #27 | BA |
