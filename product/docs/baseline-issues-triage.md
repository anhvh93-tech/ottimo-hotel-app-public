# Phân loại 30 lỗi Baseline (BL 8.2) – Round 1

- Tác giả: DOM | Round 1 – Bước 4 (Phản hồi & sửa) | Ngày: 15/10/2026 | Phiên bản: 0.2 (xử lý BA-DOM-16, BA-DOM-17, PO-DOM-07 và cập nhật theo `business-rules.md` v0.2)
- Nguồn: `product/docs/round-0-baseline.md` mục 8.2 (gọi tắt **BL**); quy tắc tham chiếu: `product/docs/business-rules.md` (mã **BR-xxx**); câu hỏi cho INV: mục 16 của business-rules (mã **Q1…Q12, Q-D1…Q-D5**).

## 1. Cách phân loại

| Phân loại | Nghĩa | Việc tiếp theo |
|---|---|---|
| **Sửa** | Lỗi logic hoặc thiếu sót; cách làm đúng đã rõ theo chuẩn ngành (DOM chốt trong BR). Có thể còn **con số** chờ INV, nhưng không chặn việc thiết kế/code vì con số là tham số cấu hình | Vai xử lý đưa vào đặc tả/ERD/API/story R2; QA viết test case theo BR |
| **Cần INV quyết** | Đúng/sai phụ thuộc chính sách kinh doanh hoặc pháp lý của OTTIMO; đội chưa được tự quyết | PO gom vào ESC (đợt 3). Trong lúc chờ, đội dùng giá trị mặc định có nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` |
| **Bỏ** | Chỉ là dữ liệu mẫu/hiện tượng của prototype, sẽ tự hết khi làm thật; không cần việc riêng (có thể kèm một quy tắc phòng ngừa) | Không tạo story; QA không cần test case riêng |

Mức ảnh hưởng: **Cao** = sai tiền, pháp lý, mất dữ liệu, bán trùng phòng; **TB** = sai số liệu báo cáo hoặc thao tác sai dễ xảy ra; **Thấp** = hiển thị/tiện dụng.

Vai xử lý: vai **chính** viết đầu tiên, vai trong ngoặc phối hợp. R1 = xử lý trong tài liệu Round 1; R2/R3 = code Round 2/3.

**Cột Round lấy theo backlog đợt 3 (`03-backlog/backlog.md`) – khi lệch nhau thì backlog là chuẩn.** Cột Story lấy từ cột "Nguồn" của backlog (story có nhắc "BL 8.2 #n"); QA có thể sinh lại tự động bằng script truy vết.

## 2. Bảng phân loại

| # BL 8.2 | Lỗi (tóm tắt) | Phân loại | Mức | BR liên quan | Hướng xử lý | Vai xử lý | Round | Story |
|---|---|---|---|---|---|---|---|---|
| 1 | Phụ thu sớm/muộn của đơn dài hạn tính trên tiền thuê **tháng** (30% × 11,13 tr ≈ 3,3 tr) | Sửa | Cao | BR-102, BR-213, BR-413 | Cơ sở tính = giá đêm quy đổi (thuê tháng ÷ 30) → 111.000 thay vì 3.339.000. Chính sách miễn phí cho dài hạn chờ INV (Q7) – mặc định miễn đến 15:00 nếu căn trống | BE (BA, QA) | R1 đặc tả, R2 code | US-027 |
| 2 | Mở modal nhận phòng lúc 11:05 tự tính phụ thu 30% ngay | Sửa | TB | BR-414 | Ô giờ mặc định = giờ chuẩn 14:00/12:00; chỉ đề xuất phụ thu khi lễ tân nhập giờ thực tế; lễ tân xác nhận trước khi ghi folio | UXD (FE, BE) | R1 wireframe, R2 | US-026 |
| 3 | Kiểm tra hạn hộ chiếu luôn "Khớp" | Sửa | Cao | BR-605 | So thật: hạn hộ chiếu > ngày trả phòng; thị thực ≥ ngày trả phòng; ngày đi khai báo không vượt hạn tạm trú | BE (FE, QA) | R2 | US-044 |
| 4 | Bảng `LATE` (miễn phí đến 13:00) khai báo nhưng không dùng; code tính phí từ 12:01 | Cần INV quyết | TB | BR-412 | Tham số `late_grace_until`; mặc định 12:00 (như code). DOM khuyến nghị ân hạn 12:30 khi căn không có khách đến (Q7) | PO gom ESC (DOM) | ESC cuối R1; code R2 | US-029 |
| 5 | Phiếu sửa chữa tick "Khóa phòng" chỉ đổi trạng thái buồng, không chặn bán | Sửa | Cao | BR-804, BR-301, BR-906 | OOO là khối chặn tồn phòng có khoảng ngày nửa mở [bắt đầu, ngày mở bán lại) như đơn (BR-804 v0.2); rack, kiểm trùng, channel manager đều coi là hết phòng; không khóa căn đang có khách; báo đơn tương lai bị ảnh hưởng | ARC (BA, BE, INT) | R1 ERD/state, R2 | US-019, US-061 |
| 6 | Trả phòng dài hạn: bill không có tiền thuê lẻ, điện nước kỳ cuối, khấu trừ/hoàn ký quỹ | Sửa | Cao | BR-214, BR-502, BR-511, BR-522 | Luồng quyết toán: chốt công tơ ngày trả → khấu trừ phạt/bồi thường có ảnh → hoàn phần còn lại, quản lý duyệt. Thời hạn hoàn (7 ngày làm việc) chờ INV (Q9) | BA (UXD, BE) | R1 quy trình + wireframe luồng 4, R3 code (US-041 Must R3) | US-041 |
| 7 | "Khách đến" hiện cả đơn hủy/giữ chỗ; "Khách đi" hiện đơn hủy | Sửa | TB | BR-404, BR-301 | Khách đến = `confirmed` ngày đến hôm nay; khách đi = `in_house` ngày đi hôm nay; `hold` hiện mục riêng | BE (FE) | R2 | US-011 |
| 8 | Đơn giữ chỗ tính là đêm đã bán trong công suất và biểu đồ | Sửa | TB | BR-301, BR-904 | Đêm bán chỉ gồm confirmed/in_house/checked_out | DATA (BE) | R1 metrics, R2 (US-010), R3 báo cáo (US-100) | US-010, US-100 |
| 9 | Đơn tạo từ báo giá không sinh bản ghi khai báo lưu trú | Sửa | Cao | BR-608 | Mọi luồng tạo đơn (đặt mới, báo giá, OTA, HĐ) đều sinh bản ghi khai báo | BE (BA) | R2 | US-047 |
| 10 | [LỆCH] Số liệu HĐ mẫu: kỳ thu Daniel 36,03 tr ≠ công thức 37,84 tr; hoa hồng Emma theo tỷ lệ CTV dù người chốt là nhân viên | Bỏ | Thấp | BR-006, BR-212 (phòng ngừa) | Là dữ liệu mẫu do nhập tay. Phòng ngừa: HĐ lưu snapshot số tiền đã thỏa thuận; sửa tay phải có lý do + quản lý duyệt; tỷ lệ hoa hồng lấy theo loại người chốt lúc báo giá. Không cần story riêng | – (BE áp BR-006 chung) | – | US-086 (phòng ngừa) |
| 11 | [LỆCH] Phí OTA trong P&L 15,5 tr ≠ bảng kênh 15,79 tr | Sửa | TB | BR-901, BR-902 | Một nguồn: P&L lấy tổng phí kênh thực tế theo đơn; không nhập tay | DATA (BE) | R1 metrics, R3 | US-099, US-101 |
| 12 | Thông báo gia hạn OTA ghi "15%" cho Airbnb trong khi bảng kênh 15,5% | Sửa | Thấp | BR-422, BR-901 | Mọi chữ có tỷ lệ phí kênh lấy từ cấu hình kênh, không viết cứng | UXD nội dung (FE) | R2 | US-028, US-099 |
| 13 | Hai quy ước quy đổi giá (÷12 cho giá đêm, ÷30 cho dài hạn); giá gia hạn dùng giá niêm yết thay giá đơn | Cần INV quyết | Cao | BR-101, BR-102, BR-421 | Đội đã tách rõ 2 loại giá đêm (BR-102, chuẩn ngành). INV cần xác nhận: ÷12 là chủ ý? làm tròn? giá gia hạn đơn OTA (Q1). Mặc định: gia hạn đơn trực tiếp giữ giá đơn; đơn OTA dùng giá trực tiếp hiện hành | PO gom ESC (DOM); BE áp mặc định | ESC cuối R1; code R2 | US-028 |
| 14 | Độ đầy đủ hồ sơ: "Đồng ý nhận ưu đãi" luôn đạt | Sửa | Thấp | BR-955 | 3 trạng thái: chưa hỏi / đồng ý / từ chối; chỉ đạt khi đã trả lời | BE (BA) | R3 (US-078 Could R3) | US-078 |
| 15 | Khóa tên = sắp xếp chữ cái → báo trùng sai (đảo chữ), bỏ sót tên viết thiếu | Sửa | Thấp | BR-952 | So khớp gần đúng tên đã chuẩn hóa + ngày sinh/quốc tịch | BE | R2 chặn trùng SĐT/email (US-072); R3 so khớp gần đúng tên (US-079 Could) | US-072, US-079 |
| 16 | Gộp hồ sơ không cập nhật người đi cùng, khai báo, lead, công tơ, CRM; không có nhật ký gộp | Sửa | TB | BR-953 | Chuyển mọi tham chiếu theo mã khách; nhật ký gộp; mã cũ tra được | ARC (BE) | R1 ERD, R3 (US-074 Should R3) | US-074 |
| 17 | Lead nối với khách bằng **tên** | Sửa | TB | BR-954 | Nối bằng mã khách | ARC (BE) | R1 ERD, R3 (US-090 Should R3) | US-090 |
| 18 | Sinh mã không an toàn (WO, khách, hóa đơn có thể trùng) | Sửa | Cao | BR-007 | Mã do server cấp, duy nhất, liên tục; phạm vi/chu kỳ từng loại theo BR-007 v0.2 (bill `F26-000123` theo cơ sở trong năm, khách theo tổ chức) | ARC (BE) | R1 ARC Pha B, R2 | US-023 |
| 19 | Hết hạn giữ chỗ và hiệu lực báo giá 3 ngày không được thực thi | Sửa | Cao | BR-302, BR-303, BR-304 | Job theo lịch: nhắc 2 giờ trước, tự hủy và mở phòng; báo giá hết hiệu lực. Tự hủy hay để sale quyết – INV xác nhận (Q11), mặc định tự hủy | ARC (BE, INT) | R1 ARC job, R2 | US-083, US-085 |
| 20 | Sửa giá OTA: rỗng/0 bị bỏ qua lặng lẽ; không có giá sàn/trần | Sửa | TB | BR-105 | Báo lỗi tại ô; chặn ngoài khoảng sàn–trần (mặc định 70%–250% giá nền, chờ INV trong Q1) | FE (BE, UXD) | R3 (US-097 Should R3) | US-097 |
| 21 | Công tơ: chỉ số mới < cũ ép về 0; không lưu kỳ | Sửa | TB | BR-502, BR-503 | Chặn và yêu cầu lý do + quản lý duyệt; lưu lịch sử kỳ, ảnh công tơ | BE (UXD) | R3 (US-064 Must R3) | US-064 |
| 22 | Doanh thu dài hạn tính theo số tháng làm tròn; CRM dùng số cứng `LEGACY` | Sửa | TB | BR-215, BR-904 | Doanh thu phân bổ theo đêm; dòng tiền theo kỳ tách riêng. Số cứng `LEGACY` bỏ khi nhập dữ liệu thật (phần này không cần việc) | DATA (BE) | R1 metrics, R3 (US-103) | US-103 |
| 23 | Hủy giữ chỗ không lý do, không phí; không có chính sách hủy đơn đã cọc | Cần INV quyết | Cao | BR-308, BR-309, BR-310, BR-313, BR-314 | Phần đội tự sửa: lý do hủy bắt buộc (BR-308). Phần INV: mức hoàn cọc ngắn ngày, chấm dứt HĐ sớm (Q6). Mặc định: ≥ 7 ngày hoàn 100%, 3–6 ngày 50%, < 3 ngày 0% | PO gom ESC (DOM); BA vẽ luồng hủy | ESC cuối R1; R2 (US-021, US-135), R3 (US-123) | US-021, US-135, US-123 |
| 24 | FOC tự duyệt: người thao tác tự chọn tên người duyệt | Sửa | Cao | BR-432, BR-433, BR-435, BR-436 | Người gửi không chọn người duyệt; hệ thống định tuyến; người duyệt xác nhận bằng PIN của chính họ; không tự duyệt trừ hạn mức tự miễn minibar của lễ tân (BR-436). Hạn mức theo cấp chờ INV (Q8, ESC-007) | BA RBAC (BE, SEC) | R1 RBAC, R2 | US-006, US-007 |
| 25 | Không tách VAT dù ghi "đã gồm VAT" | Cần INV quyết | Cao | BR-523, BR-524 | Cách tách đã rõ (giá trước thuế = giá gồm thuế ÷ (1 + thuế suất)); thuế suất 8%/10%, áp cho dài hạn, phí phạt – kế toán xác nhận (Q16) | PO gom ESC (DOM, INT cho MISA) | ESC cuối R1; R2 (US-032) | US-032 |
| 26 | Đặt phòng mới chỉ ngắn ngày, ngày đến tối đa 31/12/2026, tối đa 60 đêm, không chọn giá theo kênh | Sửa | TB | BR-112, BR-108, BR-104 | Cửa sổ bán 365 ngày; ngắn ngày 1–27 đêm, từ 28 đêm qua báo giá dài hạn; giá theo lịch giá kênh | PO story (BE, FE, UXD) | R1 backlog, R2 | US-017 |
| 27 | Rò rỉ quyền: Sale thấy số giấy tờ và P&L; Buồng phòng thấy giá vốn; mọi vai bấm được mọi hành động | Sửa | Cao | BR-610, BR-432 | Ma trận phân quyền theo màn hình, hành động, trường nhạy cảm (giấy tờ, giá vốn, P&L, hoa hồng) | BA (SEC, ARC) | R1 RBAC | US-002, US-003, US-020, US-048, US-087 |
| 28 | Số cứng trên Tổng quan (ADR, % tăng, "Cần chú ý", cảnh báo thị thực…) | Sửa | TB | BR-907, BR-904 | "Cần chú ý" sinh từ danh sách quy tắc BR-907; KPI tính từ dữ liệu theo công thức DATA | DATA (BE, FE) | R1 metrics, R2–R3 | US-010, US-012 |
| 29 | Đêm khả dụng không trừ phòng OOO | Sửa | TB | BR-804, BR-904 | Đêm khả dụng = số căn × ngày − đêm OOO | DATA (ARC) | R1 metrics, R2 (US-019, US-061), R3 (US-100) | US-019, US-061, US-100 |
| 30 | Kiểm trùng lịch chỉ ở giao diện, không có giao dịch → đặt trùng khi nhiều người dùng | Sửa | Cao | BR-906, BR-312 | Kiểm trùng ở server trong cùng giao dịch ghi cho mọi luồng chiếm phòng | ARC (BE) | R1 ARC Pha A/B, R2 | US-018 |

## 3. Tổng hợp

| Phân loại | Số lỗi | Danh sách # |
|---|--:|---|
| Sửa | 25 | 1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 26, 27, 28, 29, 30 |
| Cần INV quyết | 4 | 4, 13, 23, 25 |
| Bỏ | 1 | 10 |
| **Tổng** | **30** | |

Trong 25 lỗi "Sửa", có 7 lỗi còn **con số** chờ INV nhưng không chặn thiết kế (đã có mặc định cấu hình): #1 (Q7), #6 (Q9), #19 (Q11), #20 (Q1), #24 (Q8), #26 (Q4), #21 (ngưỡng bất thường).

Theo vai xử lý chính: ARC 6 (#5, 16, 17, 18, 19, 30) · BE 7 (#1, 3, 7, 9, 14, 15, 21; #10 chỉ áp BR-006 chung) · DATA 5 (#8, 11, 22, 28, 29) · BA 3 (#6, 24, 27) · UXD 2 (#2, 12) · FE 1 (#20) · PO 1 story (#26) + 4 ESC (#4, 13, 23, 25).

Mức Cao (13 lỗi – QA ưu tiên test case): #1, 3, 5, 6, 9, 13, 18, 19, 23, 24, 25, 27, 30 (trong đó #13, #23, #25 thuộc nhóm chờ INV).

## 4. Vấn đề mới DOM phát hiện (ngoài 30 lỗi BL 8.2)

| Mã | Vấn đề | Bằng chứng | Phân loại | BR / câu hỏi | Vai xử lý |
|---|---|---|---|---|---|
| X-01 | Hạn khai báo **người nước ngoài** là 12 giờ kể từ khi đến (BR-603 v0.2: giờ đến thực tế + 12 giờ, không áp 23:00 cho khách NN), không phải 23:00 như BL áp cho mọi khách | BL 5.12 dùng 23:00 cho cả `TT-` (NN) và `LT-` (VN) | Cần INV quyết (pháp lý, luật sư) | BR-603, Q-D3 | PO gom ESC (SEC, DOM) |
| X-02 | Mâu thuẫn mô hình phí dài hạn: BL có phí dịch vụ cố định + gói dọn; thực tế HĐ "chỉ tiền thuê, dọn 100k/lần không bắt buộc" | BL 5.2 so với Brief mục 5 | Cần INV quyết | BR-204, BR-506, Q-D1 | PO gom ESC (DOM) |
| X-03 | Hoa hồng CTV ngắn ngày 8% (công cụ báo giá) nhưng báo cáo kênh dùng 7% | BL 5.3 so với BL 5.11 | Cần INV quyết | BR-903, Q-D2 | PO gom ESC; DATA |
| X-04 | Giá ngắn ngày dài đêm đắt hơn thuê tháng (căn 202: 20 đêm 13,46 tr so với 1 tháng 9,8 tr) – sale/CTV có thể báo giá bất lợi cho khách hoặc mất khách | Tính từ BL 5.2–5.3 | Sửa | BR-108 | BE (UXD công cụ báo giá) |
| X-05 | Mã cửa theo ngày sinh khách dễ đoán (rủi ro an ninh) | Brief mục 7 #3 | Cần INV quyết (cùng SEC) | BR-403, Q-D4 | INT, SEC |
| X-06 | Không có quy trình no-show, overbooking, đổi phòng, trả phòng sớm, đồ để quên | BL không mô tả | Sửa | BR-311, 312, 315, 316, 317, 424, 428, 513 | BA (quy trình) |
| X-07 | Không có sức chứa tối đa từng căn (form cho 1–6 khách mọi căn) | BL 3.5, 3.18 | Cần INV quyết (thông tin chỉ INV có) | BR-110, Q5, Q-D5 | PO gom ESC |
| X-08 | Tiền thuê/điện nước quá hạn của khách dài hạn không có cảnh báo theo mốc | BL 5.20 chỉ ghi "nhắc trước 7 ngày" | Sửa | BR-207 | BE (BA) – R3 (US-088 Must R3) |
| X-09 | Không có quy tắc **đơn nhóm / đoàn nhiều căn** (cọc chung, hủy một phần, bill gộp/tách) | BL chỉ có đơn một căn | Sửa | BR-321…326 | PO story (BA, BE) – đề xuất Should R2, Must R3 |
| X-10 | Không có **đóng ca / đối soát chuyển khoản** – lễ tân tự xác nhận chuyển khoản mà không ai đối chiếu sao kê | BL không mô tả; SM-12 | Sửa | BR-526, BR-527 | PO story (BA) – đề xuất Must R3 (US-124) |
| X-11 | Không có quy trình **mất mạng / mất điện** ở quầy | BL không mô tả; ADR-005 | Sửa | BR-961…964 | BA P12 (ARC, UXD) |
| X-12 | "Hôm nay" cắt lúc 00:00 làm khách đến sau nửa đêm biến khỏi danh sách | Định nghĩa thiếu | Sửa | BR-010 | BA, BE |

## 5. Lịch sử thay đổi
- v0.2 (15/10/2026, bước 4): cột Round theo backlog đợt 3 (#4, 6, 8, 11, 13, 14, 15, 16, 17, 20, 21, 22, 23, 25, 29; X-08); thêm cột Story; cập nhật #5, #18, #24, X-01, X-06 theo `business-rules.md` v0.2; thêm X-09…X-12.
- v0.1 (15/10/2026, bước 2): bản đầu.
