# Quy tắc kinh doanh – OTTIMO Boutique Stay (BR-xxx)

- Tác giả: DOM | Round 1 – Bước 2 (Sản xuất, đợt 1) | Ngày: 15/10/2026 | Phiên bản: 0.1 (bản nháp chờ review của PO, BA)
- Nguồn: `product/docs/round-0-baseline.md` (gọi tắt **BL**) mục 4, 5, 8.2, 9; `00-brief/investor-brief.md` (gọi tắt **Brief**) mục 4–5; `01-decisions/decision-log.md`.
- Tài liệu này là **nguồn sự thật duy nhất** cho mọi con số nghiệp vụ (giá, %, giờ, phí). PRD, backlog, đặc tả BA, test case chỉ **tham chiếu mã BR**, không chép lại con số (plan R1 mục 7, tiêu chí B3).

## 0. Cách đọc

### 0.1 Nhãn của mỗi quy tắc
| Nhãn | Ý nghĩa | Ai quyết |
|---|---|---|
| **NGÀNH** | Cách làm chuẩn trong vận hành khách sạn/căn hộ dịch vụ tại Việt Nam, hoặc sửa lỗi logic của prototype. Không phải chính sách riêng của OTTIMO | DOM tự chốt (ghi decision-log) |
| **[GIẢ ĐỊNH – chờ INV xác nhận]** | Giá trị/chính sách riêng của OTTIMO. Lấy từ BL/Brief hoặc DOM đề xuất. Đội dùng để đi tiếp, INV chốt qua ESC cuối Round 1 | INV |
| **PHÁP LÝ – cần xác nhận** | Liên quan luật. DOM ghi nguồn theo hiểu biết, **không phải ý kiến pháp lý**; cần luật sư/kế toán xác nhận trước khi chạy thật | INV + luật sư/kế toán |

Cột "Nguồn" ghi nơi lấy quy tắc. "DOM đề xuất" = BL/Brief chưa có, DOM bổ sung.

### 0.2 Nguyên tắc chung cho mọi con số
1. **Mọi con số là tham số cấu hình** (bảng tham số theo cơ sở, có ngày hiệu lực), không cố định trong code. Danh sách tham số ở **mục 13**.
2. **Chụp lại giá trị (snapshot)**: đơn, báo giá, hợp đồng lưu lại giá và tham số **tại thời điểm tạo**. Đổi tham số về sau **không** làm thay đổi đơn/HĐ đã xác nhận.
3. Mọi thao tác chạm đến tiền (sửa giá, giảm giá, FOC, hủy, hoàn, phạt) ghi nhật ký: ai, lúc nào, giá trị trước/sau, lý do.

### 0.3 Mục lục nhóm quy tắc
| Nhóm | Mã | Nội dung |
|---|---|---|
| 1 | BR-001 … BR-009 | Quy ước chung (giờ, đêm, làm tròn, mã chứng từ, phân loại khách VN/NN) |
| 2 | BR-101 … BR-112 | Giá và bán ngắn ngày |
| 3 | BR-201 … BR-215 | Thuê dài hạn |
| 4 | BR-301 … BR-314 | Giữ chỗ, đặt cọc, hủy, no-show, overbooking |
| 5 | BR-401 … BR-428 | Nhận/trả phòng, nhận sớm/trả muộn, gia hạn, đổi phòng, nhắc trả phòng |
| 6 | BR-431 … BR-435 | FOC (miễn phí) và giảm giá ngoài chính sách |
| 7 | BR-501 … BR-525 | Điện nước, dịch vụ, phí phạt, thanh toán, hóa đơn |
| 8 | BR-601 … BR-612 | Khai báo lưu trú, giấy tờ, dữ liệu cá nhân |
| 9 | BR-701 … BR-706 | Minibar, F&B, kho |
| 10 | BR-801 … BR-811 | Trạng thái buồng, dọn phòng, bảo trì |
| 11 | BR-901 … BR-907 | Kênh bán, hoa hồng, quy ước số liệu, cảnh báo |
| 12 | BR-951 … BR-955 | Hồ sơ khách (CRM) – định danh, trùng, gộp |
| – | Mục 13–17 | Bảng tham số · Tình huống cao điểm/sự cố · Nghĩa vụ pháp lý · Phương án cho câu hỏi BL mục 9 · Đề xuất ghi decision-log |

---

## 1. Quy ước chung (BR-0xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-001 | Mọi mốc giờ (nhận/trả phòng, hạn giữ chỗ, hạn khai báo, nhắc tự động, chốt công tơ) tính theo giờ **Asia/Ho_Chi_Minh** | Hạn giữ chỗ "24 giờ" tạo lúc 10:00 15/10 → hết hạn 10:00 16/10 giờ VN, kể cả khi người thao tác ở nước ngoài | NGÀNH | BL 7, 8.4 |
| BR-002 | Một đơn chiếm khoảng **[ngày đến, ngày đi)**: đêm cuối là đêm trước ngày đi. Số đêm = ngày đi − ngày đến. Hai đơn cùng căn **không trùng** nếu ngày đi của đơn trước = ngày đến của đơn sau | Đến 19/10, đi 22/10 → 3 đêm (19, 20, 21). Đơn A đi 22/10 và đơn B đến 22/10 cùng căn: hợp lệ | NGÀNH | BL 5.4 |
| BR-003 | Đêm lưu trú gắn với **ngày lịch khách bắt đầu ngủ**. Khách nhận phòng trước 06:00 coi như dùng đêm hôm trước (xem BR-411) | Nhận phòng 04:30 ngày 20/10 → tính thêm đêm 19/10 | NGÀNH | BL 5.6 |
| BR-004 | Tiền lưu bằng **VND số nguyên**. USD chỉ để hiển thị tham khảo cho khách nước ngoài, theo tỷ giá cấu hình (cập nhật tay, ghi ngày cập nhật) | Tỷ giá mặc định 26.200 đ/USD: 13.908.000 đ ≈ 530,8 USD | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2, 7 |
| BR-005 | Quy tắc làm tròn (làm tròn **gần nhất**): giá đêm, phụ thu, phí → 1.000 đ; tiền thuê tháng, giá OTA → 10.000 đ; cọc, ký quỹ → 100.000 đ | 666.667 → 667.000; 11.132.000 → 11.130.000; ký quỹ 4.750.000 → 4.800.000 | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.1–5.3, 9 #1 |
| BR-006 | Đơn/báo giá/HĐ lưu **snapshot** giá, tỷ lệ giảm, hệ số ký quỹ, tỷ lệ hoa hồng, chu kỳ thu tại thời điểm tạo. Sửa tay một con số trên HĐ phải có lý do và người duyệt (quản lý trở lên) | HĐ Daniel lưu kỳ thu 36.030.000 do thỏa thuận riêng → hợp lệ nếu có ghi chú lý do; công thức chỉ dùng khi báo giá | NGÀNH | BL 8.2 #10 |
| BR-007 | Mã chứng từ do **server cấp, duy nhất, liên tục theo cơ sở**; không dùng thời gian hoặc số ngẫu nhiên. Mã đã cấp không tái sử dụng kể cả khi hủy | Đơn `OTM-00171`, báo giá `BG-00049`, phiếu sửa `WO-00034`, bill `F-261015-0001`, khách `KH-0018` | NGÀNH | BL 8.2 #18 |
| BR-008 | Nhật ký thao tác tiền bắt buộc (xem 0.2.3). Không cho xóa bút toán; sai thì ghi bút toán điều chỉnh | Sửa phụ thu 210.000 → 150.000: lưu cả 2 giá trị, người sửa, lý do | NGÀNH | BL 8.2 #24 |
| BR-009 | Phân loại **khách VN / khách NN** (dùng cho phụ thu dài hạn và ký quỹ) theo **giấy tờ dùng để khai báo lưu trú**: CCCD/định danh VN → VN; hộ chiếu nước ngoài → NN (kể cả Việt kiều mang hộ chiếu nước ngoài). Lúc báo giá dùng thông tin sale nhập; khi nhận phòng nếu giấy tờ khác loại đã báo → cảnh báo quản lý, **không tự đổi giá HĐ** | Khách Việt kiều quốc tịch Pháp, nhập cảnh bằng hộ chiếu Pháp → NN, +10% dài hạn | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 9 #2 |

---

## 2. Giá và bán ngắn ngày (BR-1xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-101 | **Giá niêm yết** mỗi căn gồm giá tháng và giá đêm. Giá đêm niêm yết = giá tháng ÷ 12, làm tròn 1.000 (BR-005) | Bảng 10 căn ở BL 4.1. Căn 101: 8.000.000 ÷ 12 = 666.667 → **667.000**; căn 401: 12.500.000 ÷ 12 → **1.042.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 4.1, 5.1, 9 #1 |
| BR-102 | Có **hai loại giá đêm**, không được dùng lẫn: (a) *giá đêm niêm yết* (BR-101) để bán ngắn ngày trực tiếp; (b) *giá đêm quy đổi dài hạn* = tiền thuê tháng **của HĐ** ÷ 30, chỉ dùng cho ngày lẻ, phụ thu sớm/muộn, hoàn trả của khách dài hạn | HĐ 11.130.000/tháng → giá đêm quy đổi 371.000 | NGÀNH | BL 5.1, 8.2 #13 |
| BR-103 | **Giá OTA nền** theo nhóm căn: Lầu 1–2 760.000 · Căn N 1.050.000 · Căn N+ 980.000. Đêm thứ Sáu và thứ Bảy +15%, làm tròn 10.000 | Lầu 1–2 cuối tuần 874.000 → **870.000**; Căn N **1.210.000**; Căn N+ **1.130.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.1 |
| BR-104 | **Lịch giá** theo nhóm căn × ngày × kênh. Thứ tự ưu tiên: giá ngày đặc biệt (lễ, Tết, sự kiện) > giá cuối tuần > giá nền. Danh sách ngày đặc biệt và mức tăng cấu hình được | Đề xuất mặc định: Tết Nguyên đán, 30/4–1/5, 2/9, 24/12–1/1: **+30%** trên giá nền; kênh trực tiếp có lịch giá riêng (mặc định = giá đêm niêm yết) | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 9 #1, DOM đề xuất |
| BR-105 | Mỗi nhóm căn có **giá sàn và giá trần**. Sửa giá ngoài khoảng → chặn; giá rỗng hoặc 0 → báo lỗi tại ô, không bỏ qua lặng lẽ | Sàn = 70% giá nền, trần = 250% giá nền. Lầu 1–2: sàn 532.000 → 530.000, trần 1.900.000. Nhập 0 → lỗi "Giá phải từ 530.000 đến 1.900.000" | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 8.2 #20 |
| BR-106 | Giá trên đơn được chốt **từng đêm** lúc xác nhận (snapshot, BR-006). Đổi lịch giá sau đó không ảnh hưởng đơn đã có | Đơn 3 đêm 19–21/10 giá 820.000/đêm; hôm sau tăng giá lên 900.000 → đơn vẫn 2.460.000 | NGÀNH | BL 5.1 |
| BR-107 | **Giảm theo thời gian ở** (ngắn ngày, kênh Trực tiếp và CTV): ≥ 7 đêm −10%; ≥ 14 đêm −15%; áp trên giá từng đêm rồi làm tròn 1.000. **Không áp** cho đơn OTA (giá do OTA quyết) | Căn 202, 7 đêm: 791.667 × 0,9 = 712.500 → 713.000 × 7 = **4.991.000**. 14 đêm: 673.000 × 14 = **9.422.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.3, 9 #4 |
| BR-108 | **Ngưỡng chuyển dài hạn**: từ 15 đêm, công cụ báo giá tự hiện song song phương án thuê 1 tháng để sale chọn phương án có lợi; từ 28 đêm bắt buộc làm báo giá dài hạn (HĐ) | Căn 202, khách VN, 20 đêm: ngắn ngày 20 × 673.000 = **13.460.000** so với 1 tháng 9.500.000 + phí dịch vụ 300.000 = **9.800.000** (+ điện nước theo công tơ, + ký quỹ 4.800.000) | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 9 #4, DOM đề xuất |
| BR-109 | **Phụ thu khách NN +10%** chỉ áp cho **dài hạn**; ngắn ngày không phụ thu theo quốc tịch | Căn 302 dài hạn NN: 11.000.000 × 1,1 = 12.100.000 trước giảm kỳ hạn | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2–5.3, 9 #2 |
| BR-110 | **Sức chứa và phụ thu người**: giá căn gồm 2 người lớn. Người lớn thêm (từ 12 tuổi) 150.000/đêm, gồm nệm phụ; trẻ dưới 6 tuổi ngủ chung miễn phí; trẻ 6–11 tuổi 100.000/đêm. Không vượt sức chứa tối đa từng căn (chặn khi đặt) | Tạm: Lầu 1–2 tối đa 3 người, Căn N và N+ tối đa 4 người. Căn 302, 3 người lớn, 3 đêm: +150.000 × 3 = **450.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 9 #5, DOM đề xuất |
| BR-111 | **Mã khách quay lại** (OTTIMO-BACK5, −5%) chỉ dùng cho kênh Trực tiếp; **không cộng dồn** với giảm theo thời gian ở (BR-107): áp mức có lợi hơn cho khách | 7 đêm được −10% → không áp thêm 5% | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 3.8, 5.18 |
| BR-112 | Đơn phải có **kênh**. Đơn OTA lấy giá từ OTA/channel manager. Form đặt phòng ngắn ngày: cửa sổ bán 365 ngày tính từ hôm nay (không cố định đến 31/12/2026), 1–27 đêm (từ 28 đêm theo BR-108); có chọn kênh "HĐ dài hạn" thông qua luồng báo giá | Ngày 15/10/2026 đặt được đến 14/10/2027 | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 3.5, 8.2 #26 |

---

## 3. Thuê dài hạn (BR-2xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-201 | **Bảng kỳ hạn** (giảm giá, hệ số ký quỹ VN/NN, chu kỳ thu, hoa hồng NV/CTV) | 1 tháng: 0% · 0,5/1 · 1 tháng · 3%/5%. 3 tháng: 5% · 1/1 · 3 · 4%/6%. 6 tháng: 8% · 1/1,5 · 3 · 5%/7%. 1 năm: 12% · 1/2 · 3 · 6%/8,3%. 2 năm: 15% · 2/2 · 3 · 4%/6% | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2, 9 #3 |
| BR-202 | Kỳ hạn tối thiểu 1 tháng. Kỳ hạn không trùng 5 mốc → áp mức của **mốc thấp hơn gần nhất** | HĐ 4 tháng → áp mức 3 tháng (giảm 5%); HĐ 9 tháng → mức 6 tháng (8%) | [GIẢ ĐỊNH – chờ INV xác nhận] | DOM đề xuất |
| BR-203 | **Tiền thuê/tháng** = làm tròn 10.000 của giá tháng × (1 + 10% nếu NN) × (1 − giảm kỳ hạn) | Daniel (301, NN, 1 năm): 11.500.000 × 1,1 × 0,88 = 11.132.000 → **11.130.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2 |
| BR-204 | **Phí dịch vụ và dọn phòng**: phí dịch vụ cố định theo nhóm (Lầu 1–2 300.000, Căn N 400.000, Căn N+ 350.000/tháng) + gói dọn định kỳ tùy chọn (0–3 lần/tuần; phí/tháng = số lần × 52/12 × giá/lần, làm tròn 1.000). Dọn lẻ ngoài gói theo BR-506. **Lưu ý mâu thuẫn**: Brief mục 5 mô tả HĐ thực tế "10 tr/tháng chỉ gồm tiền thuê, dọn 100k/lần không bắt buộc" – xem câu hỏi Q-D1 mục 16 | Căn 302, dọn 2 lần/tuần: 2 × 4,333 × 200.000 = 1.733.000 → phí dịch vụ 350.000 + 1.733.000 = **2.083.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2; Brief 5 |
| BR-205 | **Điện nước ước tính** chỉ dùng trong báo giá: VN 120 kWh + 3,5 m³/người; NN 170 kWh + 4 m³/người. Thu thật theo công tơ (BR-501…504) | NN 1 người: 170 × 3.500 + 4 × 25.000 = **695.000/tháng** (chỉ để báo giá) | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2 |
| BR-206 | **Ký quỹ** = làm tròn 100.000 của tiền thuê × hệ số (BR-201). Giữ suốt HĐ; không dùng để trừ tiền thuê hằng kỳ; không tính lãi; chỉ khấu trừ/hoàn khi quyết toán (BR-214) hoặc chấm dứt sớm (BR-313) | Daniel: 11.130.000 × 2 = 22.260.000 → **22.300.000** | NGÀNH (cách giữ); hệ số: [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2 |
| BR-207 | **Chu kỳ thu** = min(chu kỳ của kỳ hạn, số tháng HĐ). Tiền thuê + phí dịch vụ **thu trước, đầu mỗi kỳ**; điện nước thu **sau**, hằng tháng. Nhắc trước hạn 7 ngày và đúng ngày hạn; quá hạn 3 ngày → cảnh báo đỏ cho quản lý; quá hạn 10 ngày → quản lý xử lý theo HĐ. App **không tự khóa cửa** khách vì nợ | HĐ 6 tháng thu 3 tháng/lần: kỳ 1 ngày 1/11, kỳ 2 ngày 1/2; nhắc 25/1, cảnh báo đỏ 4/2 | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2, 5.20 |
| BR-208 | **Thu khi chốt** (ký HĐ) = ký quỹ + (tiền thuê + phí dịch vụ) × chu kỳ. Đơn giữ chỗ dài hạn chuyển "đã xác nhận" khi nhận đủ ký quỹ; kỳ đầu thu muộn nhất ngày vào ở, trước khi giao mã cửa | Ví dụ BL 5.2 (302, NN, 6 tháng): 16.700.000 + (11.130.000 + 2.083.000) × 3 = **56.339.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2, 5.5 |
| BR-209 | **Ngày kết thúc HĐ** tính theo **tháng lịch**: ngày trả phòng = ngày bắt đầu + n tháng (thay cho "× 30,4 ngày" của prototype) | Vào ở 1/11/2026, 6 tháng → trả phòng **1/5/2027** trước 12:00. Vào 31/1, 1 tháng → trả 28/2 (ngày cuối tháng) | NGÀNH | BL 5.2 |
| BR-210 | **Ngày lẻ** ngoài kỳ HĐ (ở thêm vài ngày, HĐ bắt đầu giữa tháng tính phần lẻ) tính theo giá đêm quy đổi (BR-102) × số ngày; phí dịch vụ tính theo tỷ lệ ngày | Ở thêm 5 ngày: 371.000 × 5 = **1.855.000** + phí dịch vụ 350.000 × 5/30 = 58.000 | [GIẢ ĐỊNH – chờ INV xác nhận] | DOM đề xuất |
| BR-211 | **Gia hạn HĐ**: cảnh báo "chào gia hạn" trước ngày hết hạn 30 ngày; gia hạn = HĐ mới hoặc phụ lục với giá và tham số **tại thời điểm gia hạn**; ký quỹ chuyển tiếp, bù phần chênh nếu hệ số mới cao hơn. Với khách NN kiểm thị thực còn hạn đến ngày kết thúc mới (BR-605) | Emma hết HĐ 4/12 → cảnh báo từ 4/11; thị thực hết 20/11 → cảnh báo đỏ thị thực | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 3.2, 5.20 |
| BR-212 | **Hoa hồng dài hạn**: tỷ lệ theo người chốt (NV hoặc CTV) và kỳ hạn (BR-201), +1% nếu khách NN. Cơ sở tính = tiền thuê × số tháng (**không** gồm phí dịch vụ, điện nước, ký quỹ). Tỷ lệ và người chốt lưu snapshot. Chi 2 đợt: 50% sau khi thu đủ kỳ đầu; 50% sau khi khách ở hết 50% thời hạn. Khách chấm dứt sớm trước đợt 2 → không chi đợt 2 | Daniel (CTV, 1 năm, NN): (8,3% + 1%) × 11.130.000 × 12 = **12.421.080**; đợt 1 = 6.210.540 (khớp dữ liệu "đã chi 50%") | Cách tính: NGÀNH; tỷ lệ và lịch chi: [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2, 9 #3, 8.2 #10 |
| BR-213 | Dài hạn **không** áp phụ thu nhận sớm/trả muộn theo giá tháng. Nếu có phụ thu, cơ sở là giá đêm quy đổi (BR-102). Chính sách miễn phí cho dài hạn: xem BR-413 | – | NGÀNH | BL 8.2 #1 |
| BR-214 | **Quyết toán khi trả phòng dài hạn** (bill cuối): tiền thuê ngày lẻ chưa thu (nếu có) + điện nước kỳ cuối (chốt số ngày trả, BR-502) + minibar/dọn lẻ chưa thu + phí phạt, bồi thường (BR-511, 512) − **ký quỹ**. Kết quả dương → thu thêm; âm → hoàn khách trong **7 ngày làm việc**, quản lý duyệt hoàn (BR-522). Biên bản kiểm phòng có ảnh là bắt buộc trước khi khấu trừ | Ký quỹ 22.300.000 − điện nước kỳ cuối 650.000 − mất 1 thẻ 200.000 → hoàn **21.450.000** | Luồng: NGÀNH; thời hạn hoàn: [GIẢ ĐỊNH – chờ INV xác nhận] | BL 8.2 #6, 9 #9 |
| BR-215 | **Doanh thu dài hạn** trong báo cáo vận hành phân bổ **theo đêm** (tiền thuê tháng ÷ số đêm của tháng lịch); tiền thu theo kỳ là dòng tiền, theo dõi riêng. Công thức chi tiết do DATA chốt trong `metrics-definitions.md` | Tháng 10 (31 đêm), thuê 11.130.000 → 359.032/đêm, dù khách đã trả cả quý ngày 1/8 | NGÀNH | BL 5.11, 8.2 #22 |

---

## 4. Giữ chỗ, đặt cọc, hủy, no-show, overbooking (BR-3xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-301 | **Trạng thái đơn** (tên chuẩn, BA dùng trong sơ đồ trạng thái): `hold` giữ chỗ chờ cọc · `confirmed` đã xác nhận · `in_house` đang ở · `checked_out` đã trả phòng · `cancelled` đã hủy · `no_show` không đến. Khóa phòng (OOO) **không phải đơn khách** mà là khối chặn tồn phòng (BR-804). `hold` khóa phòng nhưng **không** là đêm bán, không là doanh thu | Đơn hold 3 đêm không làm tăng công suất | NGÀNH | BL 4.4, 8.2 #8 |
| BR-302 | **Hạn giữ chỗ**: chọn 12 / 24 / 48 giờ (mặc định 24). Hạn thực tế = min(thời điểm tạo + số giờ, 12:00 ngày đến). Đặt cho chính ngày hôm nay → không giữ chỗ, phải thu cọc/xác nhận ngay | Tạo 20:00 15/10, đến 16/10, chọn 24h → hạn **12:00 16/10** (không phải 20:00 16/10) | Hạn 12/24/48: [GIẢ ĐỊNH – chờ INV xác nhận]; trần 12:00: NGÀNH | BL 5.5 |
| BR-303 | **Hết hạn giữ chỗ**: nhắc sale 2 giờ trước hạn; đến hạn chưa cọc → hệ thống **tự hủy** (`cancelled`, lý do "Hết hạn giữ chỗ"), mở lại phòng trên mọi kênh, báo sale. Sale được gia hạn giữ 1 lần, tối đa +24 giờ, trước khi hết hạn | Hạn 10:00 16/10 → nhắc 08:00; 10:00 tự hủy; lead quay về "Đã báo giá" | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.5, 8.2 #19, 9 #11 |
| BR-304 | **Báo giá có hiệu lực 3 ngày**, không khóa phòng. Hết hiệu lực → trạng thái "Hết hiệu lực"; muốn tạo giữ chỗ phải tính lại theo giá hiện hành (hoặc quản lý gia hạn báo giá) | BG lập 15/10 → hết hiệu lực 23:59 18/10 | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.4, 8.2 #19 |
| BR-305 | **Cọc ngắn ngày** (Trực tiếp, CTV) = 30% tổng tiền phòng, làm tròn 100.000. Phần còn lại thu khi nhận phòng, trước khi giao mã cửa | Căn 202, 7 đêm 4.991.000 → cọc 1.497.300 → **1.500.000**; còn 3.491.000 thu khi nhận phòng | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.3, 5.5 |
| BR-306 | **Cọc dài hạn** = ký quỹ (BR-206); xác nhận cọc sinh HĐ với kỳ thu đầu = ngày vào ở (BR-208) | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.5 |
| BR-307 | **Đơn OTA**: lưu "kiểu thanh toán" của từng đơn từ channel manager: OTA thu hộ (Airbnb, Agoda trả trước, Booking "Payments by Booking") hoặc khách trả tại chỗ. Không thu cọc lại với đơn OTA đã trả trước; đơn trả tại chỗ thu đủ khi nhận phòng | Airbnb 3 đêm → folio ghi "Đã thu qua OTA", còn phải thu = phát sinh | NGÀNH | BL 5.5 |
| BR-308 | **Hủy giữ chỗ chưa cọc**: không phí; **bắt buộc lý do** (danh mục: khách đổi ý, tìm được chỗ khác, giá, đổi ngày, không liên lạc được, khác + ghi chú) | – | NGÀNH | BL 8.2 #23 |
| BR-309 | **Hủy đơn ngắn ngày trực tiếp/CTV đã cọc** (đề xuất): hủy ≥ 7 ngày trước ngày đến → hoàn 100% cọc; 3–6 ngày → hoàn 50% cọc; < 3 ngày → không hoàn. Ngày cao điểm (BR-104) → không hoàn sau khi cọc. Thay vì hoàn, quản lý được cho **dời ngày 1 lần** trong 3 tháng, giữ nguyên cọc. Phần cọc giữ lại ghi là "phí hủy" | Đơn 3 đêm × 820.000 = 2.460.000, cọc 738.000 → **700.000**. Hủy trước 5 ngày → hoàn 350.000, phí hủy 350.000 | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 8.2 #23, 9 #6 |
| BR-310 | **Hủy đơn OTA**: theo chính sách hủy của OTA trên đơn đó; app chỉ nhận trạng thái và số tiền phạt từ channel manager, không tự tính | – | NGÀNH | BL 5.21 |
| BR-311 | **No-show**: 18:00 ngày đến chưa thấy khách và không có giờ đến dự kiến → lễ tân gọi/nhắn. Đến 23:00 vẫn chưa đến và không liên lạc được → lễ tân đánh dấu `no_show` (**không tự động**, vì khách có thể đến khuya). Hệ quả: đơn trực tiếp giữ toàn bộ cọc, hủy các đêm còn lại, mở bán lại; đơn OTA báo no-show qua channel manager/extranet để không bị tính hoa hồng. Khách đã báo đến trễ → giữ phòng cả đêm, đêm vẫn tính | Đơn trực tiếp 2 đêm, cọc 500.000, không đến → giữ 500.000, mở bán đêm thứ 2 | Quy trình: NGÀNH; mốc giờ: [GIẢ ĐỊNH – chờ INV xác nhận] | DOM đề xuất |
| BR-312 | **Overbooking**: OTTIMO **không bán vượt** (0%). Khi trùng do đồng bộ trễ → cảnh báo đỏ ngay cho lễ tân + quản lý, xử lý "dời khách": (1) chuyển căn trống cùng nhóm hoặc cao hơn, không thu thêm; (2) hết phòng → đặt chỗ tương đương gần đó, OTTIMO trả chênh lệch đêm đầu + xe. Ưu tiên dời đơn mới nhất, ngắn nhất, không dời khách đang ở, khách dài hạn, VIP/khách quen | Đơn Agoda và đơn trực tiếp cùng vào căn 203 đêm 20/10 → chuyển khách đơn mới sang 202 nếu trống | Quy trình: NGÀNH; chi phí bồi thường: [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.21, 8.2 #30 |
| BR-313 | **Chấm dứt HĐ dài hạn sớm** (đề xuất): khách báo trước ≥ 30 ngày → mất 50% ký quỹ; báo trước < 30 ngày → mất 100% ký quỹ. Tiền thuê đã trả cho tháng **chưa bắt đầu** được hoàn; tháng đang ở không hoàn. Không truy thu phần giảm giá kỳ hạn (phương án khác ở Q6) | Daniel trả trước quý (11/2026–1/2027), báo nghỉ 1/12 với 30 ngày báo trước, nghỉ 31/12: mất 11.150.000 ký quỹ, hoàn tiền thuê tháng 1 | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 9 #6 |
| BR-314 | **Hủy HĐ trước ngày vào ở** (đã ký quỹ, đề xuất): ≥ 30 ngày trước → hoàn 50% ký quỹ; < 30 ngày → không hoàn. Kỳ đầu (nếu đã thu) hoàn 100% | Ký quỹ 16.700.000, hủy trước 40 ngày → hoàn 8.350.000 | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 9 #6 |

---

## 5. Nhận/trả phòng, nhận sớm/trả muộn, gia hạn, đổi phòng (BR-4xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-401 | **Giờ chuẩn**: nhận phòng 14:00, trả phòng 12:00 | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.6; Brief 4 |
| BR-402 | **Điều kiện nhận phòng**: (1) buồng VI hoặc VC (khác → cảnh báo, lễ tân trưởng trở lên mới được nhận tiếp, ghi lý do); (2) đã thu đủ tiền phòng còn lại (đơn trực tiếp/CTV) hoặc đơn OTA đã trả trước/đảm bảo; (3) có giấy tờ của **người đứng tên** trước khi giao mã cửa; người đi cùng bổ sung trước hạn khai báo (BR-602, 603) | – | NGÀNH | BL 3.6 |
| BR-403 | **Mã cửa / thẻ**: mã có hiệu lực từ giờ nhận đến giờ trả (gồm giờ trả muộn đã duyệt); hủy ngay khi trả phòng hoặc đổi phòng. Mã theo ngày sinh khách (yêu cầu INV) dễ đoán → đề xuất thêm 2 số ngẫu nhiên; SEC đánh giá. Mỗi khách nhận tối đa 2 thẻ (1 chính + 1 dự phòng, BR-511) | Ngày sinh 12/03 → mã gợi ý `1203` + `47` | Hiệu lực: NGÀNH; dạng mã: [GIẢ ĐỊNH – chờ INV xác nhận] | Brief 7 #3, 5 |
| BR-404 | **Danh sách hôm nay**: "Khách đến" = đơn `confirmed` có ngày đến = hôm nay; "Khách đi" = đơn `in_house` có ngày đi = hôm nay; đơn `hold` ngày đến hôm nay hiện ở mục riêng "Giữ chỗ chưa cọc"; đơn `cancelled`, `no_show` không hiện | – | NGÀNH | BL 8.2 #7 |
| BR-411 | **Nhận sớm** (% trên giá đêm của **đêm đầu** trong đơn ngắn ngày): từ 14:00 → 0%; 10:00–13:59 → 30%; 06:00–09:59 → 50%; trước 06:00 → 100% (tính 1 đêm, BR-003) | Giá đơn 700.000: nhận 11:00 → **210.000**; 08:00 → **350.000**; 05:30 → **700.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.6 |
| BR-412 | **Trả muộn** (% trên giá đêm của **đêm cuối**): đến 12:00 → 0%; 12:01–15:00 → 30%; 15:01–18:00 → 50%; sau 18:00 → 100%. Có tham số "ân hạn đến" (mặc định 12:00 = không ân hạn; xem Q7) | Giá 700.000, trả 15:00 → **210.000**; trả 17:00 → **350.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.6, 8.2 #4, 9 #7 |
| BR-413 | **Khách dài hạn** nhận sớm ngày đầu / trả muộn ngày cuối: cơ sở = giá đêm quy đổi (BR-102). Đề xuất miễn phí đến 15:00 nếu căn không có khách đến cùng ngày | Thuê 11.130.000 → 371.000/đêm; trả muộn 15:00 nếu phải thu: 30% = **111.000** (không phải 3.339.000 như prototype) | Cơ sở tính: NGÀNH; miễn phí đến 15:00: [GIẢ ĐỊNH – chờ INV xác nhận] | BL 8.2 #1, 9 #7 |
| BR-414 | **Phụ thu không tự áp**: ô giờ nhận/trả trong form mặc định = **giờ chuẩn** (14:00 / 12:00), không phải giờ hiện tại. Hệ thống chỉ đề xuất phụ thu khi lễ tân nhập giờ thực tế sớm/muộn; lễ tân xác nhận trước khi ghi folio | Mở form lúc 11:05 → giờ nhận hiển thị 14:00, phụ thu 0 cho đến khi lễ tân đổi giờ | NGÀNH | BL 8.2 #2 |
| BR-415 | **Khách OTA**: tiền phòng theo OTA; phụ thu nhận sớm/trả muộn, dọn lẻ, phạt theo chính sách OTTIMO, thu trực tiếp. Điều kiện: chính sách đã đăng trong mục nội quy/house rules trên OTA | – | NGÀNH; mức phí: [GIẢ ĐỊNH – chờ INV xác nhận] | BL 9 #7 |
| BR-416 | **Giới hạn trả muộn**: không chấp nhận trả muộn nếu căn có khách đến cùng ngày và không còn căn thay thế cùng nhóm, trừ quản lý duyệt. Trả muộn **sau 18:00** = thêm 1 đêm → xử lý như **gia hạn** (BR-421) để đêm được khóa trên kênh và tính vào công suất | Khách xin trả 19:00, căn có khách 14:00 → chặn; đề xuất gửi hành lý | NGÀNH | BL 3.10 |
| BR-421 | **Gia hạn ngắn ngày**: tối đa 7 đêm qua luồng gia hạn nhanh; muốn ở thêm > 7 đêm hoặc tổng ≥ 28 đêm → báo giá dài hạn (BR-108). Kiểm trùng ở server. **Giá**: đơn Trực tiếp/CTV giữ **giá đêm của đơn**, trừ đêm rơi vào ngày đặc biệt (BR-104) thì lấy giá ngày đó; đơn OTA lấy **giá kênh Trực tiếp hiện hành** của đêm đó. Lễ tân sửa được trong khoảng sàn–trần (BR-105) | Đơn trực tiếp 201 giá 700.000 thêm 2 đêm → **1.400.000**. Đơn Booking căn 401 giá 990.000 ở thêm 1 đêm → giá trực tiếp **1.042.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.8, 8.2 #13 |
| BR-422 | **Gia hạn đơn OTA**: không sửa đơn trên OTA; phần gia hạn là **đơn con kênh Trực tiếp** liên kết đơn gốc (báo cáo kênh đúng, folio chung). Thông báo "tiết kiệm phí kênh" lấy tỷ lệ từ cấu hình kênh (BR-901), không viết cứng | Đơn Airbnb gia hạn 2 đêm × 1.042.000 → thông báo "tiết kiệm 15,5% phí kênh ≈ 323.000" | NGÀNH | BL 5.8, 8.2 #12 |
| BR-423 | **Thu tiền gia hạn**: thu ngay khi khách xác nhận, muộn nhất 14:00 ngày đầu của phần gia hạn | – | [GIẢ ĐỊNH – chờ INV xác nhận] | DOM đề xuất |
| BR-424 | **Đổi phòng** khi đang ở: bắt buộc lý do. Do lỗi OTTIMO (sự cố) → giữ giá cũ, được nâng hạng miễn phí. Do khách yêu cầu → giá căn mới tính từ đêm đổi. Căn cũ → VD/OD + tạo việc dọn; hủy mã cửa cũ, cấp mã mới; khai báo lưu trú không phải khai lại (cùng cơ sở), chỉ đổi số căn nội bộ | Mất nước nóng căn 203 → chuyển sang 301 (Căn N), giữ giá 820.000 | NGÀNH | Brief 5, DOM đề xuất |
| BR-425 | **Nhắc trả phòng tự động** (ngắn ngày): 20:00 hôm trước (Zalo/app, hỏi ở thêm kèm giá nếu căn trống); 09:00 ngày trả (lần 2, nút Trả đúng giờ / Ở thêm / Trả muộn); 11:00 chưa trả lời → báo lễ tân gọi; 12:00 quá giờ → báo đỏ lễ tân + quản lý, căn có khách đến hôm nay lên đầu. Dài hạn: nhắc trước 7 ngày và 1 ngày | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.9 |
| BR-426 | **Trả phòng 3 bước** (minibar → phụ phí → bill). Khuyến nghị buồng phòng kiểm minibar/hư hỏng ngay khi khách báo trả (qua app nhân viên) để lễ tân không giữ khách quá 5 phút. Không hoàn tất trả phòng khi "còn phải thu" > 0 mà chưa ghi giao dịch thanh toán, trừ quản lý ghi công nợ có hạn (BR-525) | – | NGÀNH | BL 3.7 |
| BR-427 | **Trả phòng khi không có người ở quầy** (sáng sớm/đêm): khách bấm "Trả phòng" trên app khách; hóa đơn gửi email/Zalo; minibar kiểm sau, phát sinh gửi khách thanh toán qua link trong 24 giờ | Khách bay chuyến 6:00 rời phòng 4:00 | NGÀNH | DOM đề xuất |
| BR-428 | **Trả phòng sớm** (trước ngày đi): đơn trực tiếp báo trước ≥ 24 giờ → hoàn 50% tiền các đêm chưa ở; báo trong ngày → không hoàn. Đơn OTA theo OTA. Mở bán lại ngay các đêm còn lại | Đơn 4 đêm × 700.000, báo trước 1 ngày, bỏ 2 đêm cuối → hoàn 700.000 | [GIẢ ĐỊNH – chờ INV xác nhận] | DOM đề xuất |

---

## 6. FOC (miễn phí) và giảm giá ngoài chính sách (BR-43x)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-431 | **Phạm vi FOC**: miễn khoản **phát sinh** (phụ thu nhận sớm/trả muộn, minibar, dọn lẻ, phạt, bồi thường, đêm bù do sự cố). Giảm tiền phòng ngoài chính sách gọi là "giảm giá đặc biệt", đi qua cùng cơ chế duyệt | – | NGÀNH | BL 5.7 |
| BR-432 | Bắt buộc **lý do** (Khách quen/VIP · Phòng sẵn sàng, không ảnh hưởng khách sau · Bù sự cố · Khách dài hạn · Khác + ghi chú) và **người duyệt là tài khoản thật có quyền**, xác nhận bằng mật khẩu/PIN của chính người duyệt. Người thao tác không tự duyệt cho mình, trừ quản lý và chủ đầu tư | Lễ tân Hạnh chọn "người duyệt: anh Hoàng Anh" → app gửi yêu cầu duyệt tới tài khoản anh Hoàng Anh, chưa duyệt thì folio để "chờ duyệt" | NGÀNH | BL 5.7, 8.2 #24 |
| BR-433 | **Hạn mức duyệt** (đề xuất): Lễ tân: chỉ FOC minibar ≤ 100.000/lần. Lễ tân trưởng: ≤ 300.000/lần và ≤ 1.500.000/tháng. Quản lý: ≤ giá 1 đêm phòng/lần, không giới hạn tháng. Chủ đầu tư: không giới hạn. Vượt hạn mức → chuyển duyệt lên cấp trên qua thông báo | Trả muộn 15:00 phí 210.000: lễ tân trưởng duyệt được; nhận sớm trước 06:00 phí 1.042.000: cần quản lý | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 9 #8 |
| BR-434 | Bill ghi **dòng phát sinh + dòng FOC âm** để triệt tiêu (giữ dấu vết giá trị đã miễn). Mọi FOC vào báo cáo FOC tháng (giá trị, số lần, lý do, người duyệt) | Trả muộn 210.000 + "Miễn phí (FOC) · Khách quen" −210.000 | NGÀNH | BL 5.7 |
| BR-435 | **Cảnh báo thất thoát**: tổng FOC tháng > 3% doanh thu phòng tháng, hoặc một người duyệt > 10 lần/tháng → cảnh báo chủ đầu tư | Doanh thu phòng 186,4 tr → ngưỡng 5,59 tr | [GIẢ ĐỊNH – chờ INV xác nhận] | DOM đề xuất |

---

## 7. Điện nước, dịch vụ, phí phạt, thanh toán, hóa đơn (BR-5xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-501 | **Đơn giá điện nước cố định**: điện 3.500 đ/kWh, nước 25.000 đ/m³. *Lưu ý pháp lý*: Bộ Công Thương có quy định về giá điện bán cho người thuê nhà; OTTIMO là cơ sở lưu trú nên có thể thuộc trường hợp khác – **cần kế toán/luật sư xác nhận** trước khi in đơn giá trên HĐ | Daniel tháng 10: 142 kWh × 3.500 = 497.000; 8 m³ × 25.000 = 200.000 → **697.000** | [GIẢ ĐỊNH – chờ INV xác nhận] + PHÁP LÝ – cần xác nhận | BL 5.10, 9 #10; Brief 4 |
| BR-502 | **Chốt công tơ**: hằng tháng vào ngày cuối tháng (cho phép ±2 ngày); **ảnh công tơ bắt buộc**, ghi người chốt. Chỉ số đầu ghi lúc nhận phòng; chỉ số cuối ghi lúc trả phòng. Lưu lịch sử từng kỳ | Kỳ 1–31/10 chốt 31/10 (từ 29/10 đến 2/11) | NGÀNH | BL 5.10 |
| BR-503 | **Kiểm tra chỉ số**: mới < cũ → chặn lưu, phải chọn lý do "Thay công tơ / quay vòng" và quản lý duyệt. Tiêu thụ > 2 lần trung bình 3 kỳ trước (hoặc > 300 kWh / > 10 m³ khi chưa có lịch sử) → cảnh báo kiểm tra trước khi gửi khách | Kỳ trước 140, 150, 145 kWh; kỳ này 320 kWh → cảnh báo | NGÀNH; ngưỡng: [GIẢ ĐỊNH – chờ INV xác nhận] | BL 8.2 #21 |
| BR-504 | Chốt xong → sinh **hóa đơn điện nước tháng**, hiện trong app khách, hạn thanh toán 5 ngày. Kiểm tra hợp lý: Brief ghi thực tế khách tháng ~1,2–2 tr/tháng | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.10; Brief 5 |
| BR-505 | **Internet, rác, gửi xe**: đã gồm trong tiền thuê/phí dịch vụ, không thu riêng | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 9 #10 |
| BR-506 | **Dọn phòng lẻ theo yêu cầu** (ngoài gói/lịch dọn): 100.000/lần, gồm lau dọn, thay ga gối, vệ sinh nhà tắm, bếp. Khách đặt qua app → tạo việc buồng phòng → ghi folio khi xong | Khách dài hạn gọi 3 lần dọn lẻ trong tháng → **300.000** cộng vào hóa đơn tháng | [GIẢ ĐỊNH – chờ INV xác nhận] | Brief 5 |
| BR-507 | **Giặt ủi**: bảng giá cấu hình (theo kg hoặc theo món); INV cung cấp. Tạm 30.000/kg | 2,5 kg → **75.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 9 #12 |
| BR-511 | **Phí phạt** (thực tế Brief 5): (a) hút thuốc trong phòng → **khử mùi 500.000/lần** (được hút ở ban công); (b) **mất/hỏng thẻ phòng 200.000/thẻ**; mỗi khách được cấp 2 thẻ (1 chính + 1 dự phòng), trả đủ 2 thẻ khi đi → 0 đ. Điều kiện để thu: nội quy đã gửi khách (VI/EN/RU) khi nhận phòng và có trong mô tả trên OTA; có bằng chứng (ảnh/ghi chú của buồng phòng). Ghi folio dòng "Phí phạt" (không phải doanh thu phòng); dài hạn khấu trừ khi quyết toán (BR-214); được FOC theo BR-433 | Khách trả 1/2 thẻ → **200.000**; phát hiện mùi thuốc lá + mất 1 thẻ → **700.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | Brief 5 |
| BR-512 | **Hư hỏng, mất đồ**: theo bảng giá đền bù do INV cung cấp (khăn, ga, ly, remote…); món ngoài bảng → quản lý định giá; ảnh bằng chứng bắt buộc | Tạm: khăn tắm 150.000, ly 50.000, remote 200.000 | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 3.7 |
| BR-513 | **Đồ khách để quên**: ghi sổ (ảnh, căn, ngày, người nhặt), báo khách trong 24 giờ, lưu giữ 30 ngày; giấy tờ tùy thân, tiền, đồ giá trị bàn giao quản lý cất giữ có biên bản | – | Quy trình: NGÀNH; thời hạn: [GIẢ ĐỊNH – chờ INV xác nhận] | Brief 5 |
| BR-521 | **Phương thức thanh toán**: VietQR (nội dung chuyển khoản = mã bill), VNPay/MoMo (link), thẻ qua cổng (**không lưu số thẻ**), tiền mặt, "đã thu qua OTA". Mỗi khoản thu là một giao dịch có mã, gắn folio; một folio có nhiều giao dịch (trả nhiều lần, nhiều cách) | Bill 3.491.000: chuyển khoản 3.000.000 + tiền mặt 491.000 | NGÀNH | BL 5.20 |
| BR-522 | **Hoàn tiền** (cọc, ký quỹ, trả sớm): quản lý duyệt; hoàn qua cùng phương thức hoặc chuyển khoản; ghi giao dịch âm có lý do | – | NGÀNH | BL 8.2 #6 |
| BR-523 | **VAT**: giá niêm yết **đã gồm VAT**. Khi xuất hóa đơn tách: giá trước thuế = giá gồm thuế ÷ (1 + thuế suất). Thuế suất là tham số; tạm 8%. Ký quỹ không xuất hóa đơn (không phải doanh thu) cho đến khi bị khấu trừ. Cách xử lý thuế với phí phạt/bồi thường: kế toán xác nhận | 1.080.000 gồm VAT 8% → 1.000.000 + VAT 80.000 | PHÁP LÝ – cần xác nhận (kế toán) | BL 5.20, 8.2 #25, 9 #16 |
| BR-524 | **Thời điểm xuất hóa đơn điện tử** (MISA meInvoice): ngắn ngày khi hoàn tất trả phòng; dài hạn mỗi kỳ thu; điện nước mỗi tháng. Diện hóa đơn khởi tạo từ máy tính tiền (BL ghi doanh thu > 1 tỷ/năm) – kế toán xác nhận | – | PHÁP LÝ – cần xác nhận (kế toán) | BL 5.20; Brief 7 #3 |
| BR-525 | **Công nợ** (công ty, CTV thanh toán sau): sau MVP. Trong MVP chỉ quản lý được ghi "công nợ" khi trả phòng, có hạn thanh toán và cảnh báo quá hạn | – | [GIẢ ĐỊNH – chờ INV xác nhận] | DOM đề xuất |

---

## 8. Khai báo lưu trú, giấy tờ, dữ liệu cá nhân (BR-6xx)

> Toàn bộ nhóm này liên quan pháp luật. DOM ghi nguồn theo hiểu biết nghiệp vụ, **không thay ý kiến luật sư**. SEC phụ trách phần dữ liệu cá nhân (`security/data-risk-assessment.md`).

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-601 | **Mọi người lưu trú** (người đứng tên, người đi cùng, trẻ em) phải có thông tin giấy tờ trước hạn khai báo. Số người cần giấy tờ = số khách của đơn; thêm người giữa chừng → khai bổ sung | Đơn 3 khách, mới quét 2 → trạng thái "Thiếu người đi cùng" | NGÀNH | BL 5.12 |
| BR-602 | **Hạn thông báo lưu trú – công dân VN**: trước 23:00 ngày đến; khách đến sau 23:00 → trước 08:00 sáng hôm sau | Khách đến 23:40 ngày 20/10 → hạn **08:00 21/10** | PHÁP LÝ – cần xác nhận (theo DOM hiểu: Luật Cư trú 68/2020/QH14, Điều 30) | BL 5.12 |
| BR-603 | **Hạn khai báo tạm trú – người nước ngoài**: trong **12 giờ** kể từ khi khách đến cơ sở lưu trú. **Khác với BL** (BL dùng 23:00 cho mọi khách). App tính hạn = giờ nhận phòng thực tế + 12 giờ và hiển thị hạn **sớm hơn** giữa hạn này và 23:00 ngày đến | Nhận 08:00 → hạn **20:00 cùng ngày** (sớm hơn 23:00); nhận 21:30 → hạn **09:30 hôm sau** | PHÁP LÝ – cần xác nhận (theo DOM hiểu: Luật Nhập cảnh, xuất cảnh, quá cảnh, cư trú của người nước ngoài tại VN 47/2014/QH13 và các luật sửa đổi, Điều 33) | BL 5.12; Brief 5 |
| BR-604 | **Cập nhật ngày đi thực tế** trên cổng khai báo khi khách trả phòng, trả sớm hoặc gia hạn (Brief 5). App tạo việc "Cập nhật ngày đi" cho lễ tân với mọi đơn có khai báo NN | Khách trả sớm 2 ngày → việc cập nhật trong ngày trả | PHÁP LÝ – cần xác nhận | Brief 5 |
| BR-605 | **Kiểm tra giấy tờ NN**: hộ chiếu còn hạn **đến sau** ngày trả phòng (so thật, không mặc định "Khớp"); thị thực/miễn thị thực/thẻ tạm trú còn hạn đến ngày trả phòng. Ngày đi dự kiến khai báo **không vượt** hạn tạm trú: nếu đơn/HĐ dài hơn → cảnh báo đỏ, khai đến hết hạn thị thực, nhắc khách gia hạn trước 14 ngày | Emma thị thực đến 20/11, HĐ đến 4/12 → khai đến 20/11, nhắc từ 6/11 | PHÁP LÝ – cần xác nhận | BL 5.12, 8.2 #3; Brief 5 |
| BR-606 | **Hồ sơ khai báo NN** cần: ảnh trang thông tin hộ chiếu, dấu nhập cảnh, thị thực hoặc diện miễn thị thực, ngày đến/đi, mục đích, SĐT. Khai trên cổng `tbltkbtt.bocongan.gov.vn` (bán tự động: app chuẩn bị dữ liệu, lễ tân dán, nhập mã hồ sơ) | – | PHÁP LÝ – cần xác nhận | Brief 5; BL 3.11 |
| BR-607 | **Trạng thái khai báo** (BL 5.12): `none` → `partial` → `review` → `scanned` → `sent` → `confirmed`; `pre` = khách gửi trước qua app. Thêm `needs_update` (cần cập nhật ngày đi) → `updated` | – | NGÀNH | BL 5.12 |
| BR-608 | **Mọi luồng tạo đơn** (đặt mới, từ báo giá, đơn OTA về, HĐ dài hạn) đều sinh bản ghi khai báo. Đơn con gia hạn (BR-422) không sinh bản ghi mới mà tạo việc cập nhật ngày đi. Khách dài hạn khai 1 lần + cập nhật khi gia hạn/đổi giấy tờ | – | NGÀNH | BL 8.2 #9 |
| BR-609 | **Đồng ý lưu ảnh giấy tờ** là bắt buộc trước khi lưu ảnh (ký trên app hoặc tại quầy). Khách không đồng ý → chỉ dùng để khai báo rồi không lưu ảnh, chỉ lưu các trường văn bản cần thiết | – | PHÁP LÝ – cần xác nhận | BL 5.13 |
| BR-610 | **Lưu trữ và quyền xem**: ảnh mã hóa, tách khỏi hồ sơ khách; chỉ lễ tân và quản lý (và chủ đầu tư) xem được; buồng phòng, sale, CTV không thấy cả số giấy tờ đã che; mỗi lần mở ảnh ghi nhật ký; tự xóa ảnh **30 ngày sau trả phòng**; hồ sơ khách chỉ giữ 4 số cuối | – | PHÁP LÝ – cần xác nhận (thời hạn 30 ngày là đề xuất của BL) | BL 5.13, 8.2 #27, 9 #14 |
| BR-611 | **Khai báo ca tối**: nếu sau 22:00 không có lễ tân trực → khách đến khuya làm check-in online trên app (giấy tờ trước), người trực đêm/quản lý nhận thông báo và khai báo trên điện thoại; app nhắc lúc 22:00 và 07:00 các hồ sơ chưa khai | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 9 #15 |
| BR-612 | **Trẻ em** dùng số định danh cá nhân từ giấy khai sinh/hộ chiếu; năm sinh chỉ dùng cho khai báo lưu trú và phụ thu trẻ em (BR-110) | – | NGÀNH | BL 5.12 |

---

## 9. Minibar, F&B, kho (BR-7xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-701 | **Tủ chuẩn** mỗi căn 17 món theo bảng BL 4.13. Đồ miễn phí (nước suối, cà phê phin, trà atiso) trừ kho nhưng **không tính tiền**, ghi chi phí phòng | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 4.13, 5.14 |
| BR-702 | Đã dùng = chuẩn − còn lại (giới hạn 0…chuẩn). Tiền = đã dùng × giá bán | 2 bia (35.000) + 1 snack (30.000) + 2 nước suối (miễn phí) = **100.000** | NGÀNH | BL 5.14 |
| BR-703 | **Kiểm minibar**: buồng phòng kiểm mỗi lần dọn phòng có khách và khi khách báo trả phòng; lễ tân xác nhận lúc trả phòng. Khách dài hạn: kiểm khi dọn định kỳ, ghi folio, thu cùng hóa đơn tháng | – | NGÀNH | BL 5.14 |
| BR-704 | Khách khiếu nại minibar → lễ tân FOC được ≤ 100.000/lần (BR-433); quá mức chuyển lễ tân trưởng | – | [GIẢ ĐỊNH – chờ INV xác nhận] | DOM đề xuất |
| BR-705 | **Kho**: tồn cuối = tồn đầu + nhập − xuất minibar − xuất khác ± kiểm kê; xuất không vượt tồn; giá vốn **bình quân gia quyền** (thay cho ghi đè của prototype); trạng thái Hết hàng (≤ 0) / Cần nhập (≤ tối thiểu) / Đủ. Kiểm kê hằng tháng; chênh lệch > 5% giá trị tồn → quản lý duyệt | Tồn 10 lon bia giá 12.000, nhập 24 lon giá 13.000 → giá vốn mới (120.000 + 312.000) ÷ 34 = **12.706** | NGÀNH | BL 3.15, 5.14 |
| BR-706 | Hàng có hạn sử dụng (sữa tươi, mì…): xuất theo hạn gần nhất trước, cảnh báo trước hạn 7 ngày (sau MVP) | – | NGÀNH | BL 7 |

---

## 10. Trạng thái buồng, dọn phòng, bảo trì (BR-8xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-801 | **7 trạng thái buồng**: VC (Trống · sạch), VI (Đã kiểm · sẵn sàng), VD (Trống · cần dọn), CL (Đang dọn), OC (Có khách · sạch), OD (Có khách · cần dọn), OOO (Hỏng · khóa phòng). Trạng thái buồng tách khỏi trạng thái đơn nhưng được đồng bộ theo sự kiện | – | NGÀNH | BL 4.5 |
| BR-802 | **Chuyển trạng thái hợp lệ và người được chuyển**: VD/OD → CL (buồng phòng); CL → VC hoặc OC (buồng phòng, "Dọn xong"); VC → VI (người kiểm: lễ tân trưởng/quản lý, hoặc buồng phòng tự kiểm đủ checklist + ảnh khi chỉ có 1 người); OC → OD (buồng phòng/lễ tân). Tự động: nhận phòng → OC; trả phòng → VD; gia hạn → OD; 07:00 hằng ngày căn có khách ngắn ngày OC → OD; khách dài hạn chỉ OD theo lịch gói. OOO chỉ vào/ra qua phiếu sửa chữa (BR-804) | – | NGÀNH | BL 5.15 |
| BR-803 | **Giao phòng**: căn đang có khối OOO không bán được. Căn VD/CL vẫn bán được cho ngày tương lai nhưng **không nhận phòng** được đến khi VC/VI. Ưu tiên giao VI > VC | – | NGÀNH | BL 3.6 |
| BR-804 | **Khóa phòng (OOO)**: tạo từ phiếu sửa chữa (hoặc khóa có kế hoạch) **kèm khoảng ngày dự kiến**; tạo khối chặn tồn phòng → rack, kiểm trùng, channel manager đều coi là hết phòng; trừ khỏi đêm khả dụng. Không khóa căn đang có khách (đổi phòng trước, BR-424); khoảng khóa trùng đơn tương lai → hiện danh sách đơn cần dời trước khi lưu. Phiếu "Xong" → căn VD, mở bán | Phiếu WO "Hỏng bình nóng lạnh 401", khóa 15–17/10 → 3 đêm không bán, đêm khả dụng tháng 10 = 310 − 3 = 307 | NGÀNH | BL 8.2 #5, #29 |
| BR-805 | Căn **VC/VI quá 3 ngày** chưa có khách → tự về VC, cần kiểm lại (bụi, mùi) trước khi giao | – | NGÀNH | DOM đề xuất |
| BR-806 | **Đối chiếu buồng – đơn** mỗi sáng 07:00 và khi mở rack: OC/OD mà không có đơn `in_house` → cảnh báo; đơn `in_house` mà buồng VC/VD → cảnh báo | – | NGÀNH | DOM đề xuất |
| BR-807 | **Lịch dọn**: ngắn ngày dọn hằng ngày nếu khách không từ chối, thay ga mỗi 3 đêm; dài hạn theo gói (ngày cố định, khung 9:00–11:00) + dọn lẻ (BR-506). **Thứ tự ưu tiên dọn**: căn có khách đến hôm nay (đến sớm trước) > VIP/khách quen > căn trả phòng > căn khách ở lại | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.15, 9 #12 |
| BR-808 | **Checklist kiểm phòng 12 điểm** (BL 3.12: ga gối, phòng tắm, khăn 2 tắm/2 mặt/1 chân, amenity, bếp, bàn làm việc, Wi-Fi ≥ 50 Mbps, rèm/cửa sổ, mùi, remote/điều hòa/sưởi, thẻ chào + Wi-Fi, ảnh) là điều kiện chuyển VC → VI | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 3.12 |
| BR-809 | **Mức độ phiếu sửa chữa và thời hạn**: Cao (an toàn hoặc ảnh hưởng khách đang ở: mất nước nóng, mất điện, khóa cửa hỏng, rò nước) → nhận trong 15 phút, có phương án trong 2 giờ (sửa hoặc đổi phòng); Trung bình → 24 giờ; Thấp → 72 giờ. Yêu cầu "Báo hỏng" từ app khách mặc định Trung bình, lễ tân nâng mức | Mất nước nóng căn 203 lúc 21:00 → Cao, 23:00 chưa sửa được → đổi phòng (BR-424) + FOC bù sự cố | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 3.14; Brief 5 |
| BR-810 | **Bảo trì định kỳ**: hoàn thành → tự sinh kỳ kế tiếp = ngày hoàn thành + chu kỳ; hạn ≤ 7 ngày → cảnh báo | Bảo dưỡng bình nóng lạnh (6 tháng) xong 24/10/2026 → kỳ tới 24/4/2027 | NGÀNH | BL 4.8 |
| BR-811 | **Yêu cầu từ app khách** định tuyến theo BL 5.19 (Dọn thêm, Khăn/đồ dùng → Buồng phòng; Báo hỏng → Bảo trì; Xe/tour, Trả muộn, Khác → Lễ tân). Lễ tân trả lời trong 10 phút trong giờ trực (07:00–22:00); ngoài giờ trả lời tự động kèm giờ xử lý | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.19 |

---

## 11. Kênh bán, hoa hồng, quy ước số liệu, cảnh báo (BR-9xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-901 | **Phí kênh**: tỷ lệ cấu hình theo kênh (Airbnb 15,5%; Booking.com 15%; Agoda 18%; Expedia 18%; Trip.com 15%; Website/Zalo 0%). Mỗi đơn lưu **phí kênh thực tế** (từ channel manager nếu có, không thì theo tỷ lệ). Thực thu = doanh thu − phí kênh thực tế | Đơn Agoda 2.000.000 → phí 360.000, thực thu **1.640.000** | Tỷ lệ: [GIẢ ĐỊNH – chờ INV xác nhận]; cách lưu: NGÀNH | BL 5.11, 8.2 #12 |
| BR-902 | **Một nguồn số liệu**: báo cáo kênh và P&L cùng lấy phí kênh từ tổng phí theo đơn; không nhập tay con số riêng cho P&L | Tháng 9: phí OTA P&L phải = 15.794.500 (tổng bảng kênh trừ CTV), không phải 15.500.000 | NGÀNH | BL 8.2 #11 |
| BR-903 | **Hoa hồng ngắn ngày**: CTV 8%, nhân viên 3% trên **tiền phòng** (không gồm phụ thu, minibar, phạt). Chỉ ghi nhận khi đơn `checked_out` và đã thu đủ; đơn hủy/no-show → 0. **Lưu ý mâu thuẫn**: báo cáo kênh BL dùng 7% cho CTV – xem Q-D2 | Đơn CTV 7 đêm 4.991.000 → hoa hồng **399.280** | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.3, 5.11 |
| BR-904 | **Quy ước đếm đêm và doanh thu** (bàn giao DATA chốt công thức): đêm bán = đêm có đơn `confirmed`/`in_house`/`checked_out` (gồm dài hạn); **không** gồm `hold`, `cancelled`, `no_show`. Đêm khả dụng = số căn × số ngày − đêm OOO. Doanh thu phòng không gồm phụ thu, minibar, điện nước, phí phạt, phí hủy (các khoản này vào "doanh thu khác") | Tháng 10: 10 căn × 31 = 310 − 3 đêm OOO = 307 đêm khả dụng | NGÀNH | BL 5.11, 8.2 #8, #29 |
| BR-905 | **Đồng bộ kênh**: Desk là nguồn tồn phòng. Mọi thay đổi tồn (đặt, giữ chỗ, hủy, gia hạn, đổi phòng, OOO, hết hạn giữ chỗ) đẩy lên channel manager, mục tiêu ≤ 1 phút. Đơn OTA về tự tạo đơn + hồ sơ, gộp theo khóa định danh (BR-951). Không dùng iCal. Đồng bộ lỗi → cảnh báo lễ tân + tự thử lại | – | NGÀNH | BL 5.21, 3.19 |
| BR-906 | **Chống đặt trùng** kiểm ở server trong cùng giao dịch ghi (không chỉ ở giao diện), áp cho mọi luồng tạo/sửa đơn, giữ chỗ, gia hạn, đổi phòng, OOO | Hai lễ tân cùng đặt căn 203 đêm 20/10 → một người thành công, người kia báo "Căn vừa được đặt" | NGÀNH | BL 8.2 #30 |
| BR-907 | **"Cần chú ý" trên Tổng quan** sinh từ quy tắc, không viết cứng: khách VIP/khách quen đến hôm nay; căn OOO; kỳ thu dài hạn trong 7 ngày (BR-207); HĐ hết hạn trong 30 ngày (BR-211); khai báo chưa xong gần hạn (BR-602/603); thị thực hết trước ngày đi (BR-605); phiếu sửa mức Cao đang mở (BR-809); giữ chỗ hết hạn trong 2 giờ (BR-303); công tơ chưa chốt (BR-502); đồng bộ kênh lỗi (BR-905); FOC vượt ngưỡng (BR-435) | – | NGÀNH | BL 3.2, 8.2 #28 |

---

## 12. Hồ sơ khách – định danh, trùng, gộp (BR-95x)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-951 | **Khóa định danh** theo thứ tự: số giấy tờ (sau khi quét) → SĐT → email → mã OTA. Chuẩn hóa: SĐT chỉ giữ chữ số, "0" đầu → "84"; email trim + chữ thường; tên bỏ dấu, in hoa. Trùng SĐT/email → chặn tạo mới, đề nghị gộp | 0905 123 456 = +84905123456 | NGÀNH | BL 5.16 |
| BR-952 | **Phát hiện tên trùng** dùng so sánh gần đúng (khoảng cách chuỗi trên tên đã chuẩn hóa, chấp nhận đảo thứ tự từ) **kết hợp** ngày sinh hoặc quốc tịch; **không** dùng khóa "sắp xếp chữ cái" | "WEBER DANIEL" ≈ "DANIEL WEBER" cùng ngày sinh → nghi trùng; "AN NHI" và "NHI AN" khác ngày sinh → không báo | NGÀNH | BL 8.2 #15 |
| BR-953 | **Gộp hồ sơ** chuyển **mọi** tham chiếu (đơn với vai đứng tên và đi cùng, khai báo, lead, HĐ, công tơ, yêu cầu app, dữ liệu CRM) sang hồ sơ giữ lại; lưu nhật ký gộp; mã cũ tra được và tự chuyển về mã mới | – | NGÀNH | BL 8.2 #16 |
| BR-954 | **Lead, báo giá, đơn nối với khách bằng mã khách**, không bằng tên | – | NGÀNH | BL 8.2 #17 |
| BR-955 | **Độ đầy đủ hồ sơ**: tiêu chí "Đồng ý nhận ưu đãi" chỉ đạt khi khách **đã trả lời** (có hoặc không); 3 trạng thái: chưa hỏi / đồng ý / từ chối. Người đi cùng tự đồng ý, không dùng đồng ý của người đặt | – | NGÀNH | BL 5.17, 5.18, 8.2 #14 |

---

## 13. Bảng tham số cấu hình (giá trị mặc định)

> ARC dùng bảng này để thiết kế bảng cấu hình (theo cơ sở, có ngày hiệu lực). Tên khóa tiếng Anh để dùng trong code. Cột "Trạng thái": GĐ = [GIẢ ĐỊNH – chờ INV xác nhận]; NGÀNH = DOM chốt; PL = cần luật sư/kế toán.

| Khóa tham số | Mặc định | BR | Trạng thái |
|---|---|---|---|
| `timezone` | Asia/Ho_Chi_Minh | BR-001 | NGÀNH |
| `fx_usd_vnd` | 26.200 | BR-004 | GĐ |
| `rounding.night_rate` / `.monthly_rent` / `.deposit` / `.fee` | 1.000 / 10.000 / 100.000 / 1.000 | BR-005 | GĐ |
| `room.<no>.monthly_list_price` | Bảng BL 4.1 | BR-101 | GĐ |
| `night_from_month_divisor` | 12 | BR-101 | GĐ |
| `long_stay_daily_divisor` | 30 | BR-102 | NGÀNH |
| `ota_base_rate.<group>` | 760.000 / 1.050.000 / 980.000 | BR-103 | GĐ |
| `weekend_uplift_pct`, `weekend_nights` | 15%, Thứ Sáu + Thứ Bảy | BR-103 | GĐ |
| `special_dates[]`, `special_uplift_pct` | Tết, 30/4–1/5, 2/9, 24/12–1/1; +30% | BR-104 | GĐ |
| `rate_floor_pct`, `rate_ceiling_pct` | 70%, 250% giá nền | BR-105 | GĐ |
| `los_discount` | ≥ 7 đêm 10%; ≥ 14 đêm 15% | BR-107 | GĐ |
| `long_stay_compare_from_nights`, `long_stay_required_from_nights` | 15, 28 | BR-108 | GĐ |
| `foreigner_surcharge_pct` | 10% (chỉ dài hạn) | BR-109 | GĐ |
| `base_occupancy`, `extra_adult_fee`, `child_free_under_age`, `child_fee_6_11`, `max_occupancy.<group>` | 2; 150.000; 6; 100.000; 3 / 4 / 4 | BR-110 | GĐ |
| `return_guest_code`, `return_guest_pct`, `stackable` | OTTIMO-BACK5; 5%; không | BR-111 | GĐ |
| `booking_window_days`, `short_stay_max_nights` | 365; 27 | BR-112 | GĐ |
| `lease_terms[]` | Bảng BR-201 | BR-201 | GĐ |
| `service_fee.<group>`, `cleaning_package.<group>[k]` | Bảng BL 5.2 | BR-204 | GĐ |
| `utility_estimate` | VN 120 kWh, 3,5 m³/người; NN 170 kWh, 4 m³/người | BR-205 | GĐ |
| `rent_reminder_days`, `rent_overdue_alert_days`, `rent_overdue_escalate_days` | 7; 3; 10 | BR-207 | GĐ |
| `lease_renewal_offer_days` | 30 | BR-211 | GĐ |
| `commission_payout` | 50% sau kỳ đầu; 50% khi qua 50% thời hạn | BR-212 | GĐ |
| `deposit_refund_working_days` | 7 | BR-214 | GĐ |
| `hold_hours_options`, `hold_hours_default`, `hold_latest_time_on_arrival` | 12/24/48; 24; 12:00 | BR-302 | GĐ |
| `hold_expiry_reminder_hours`, `hold_extension_max_hours` | 2; 24 (1 lần) | BR-303 | GĐ |
| `quote_validity_days` | 3 | BR-304 | GĐ |
| `short_stay_deposit_pct` | 30% | BR-305 | GĐ |
| `cancel_policy_direct` | ≥ 7 ngày 100%; 3–6 ngày 50%; < 3 ngày 0% hoàn | BR-309 | GĐ |
| `no_show_call_time`, `no_show_mark_time` | 18:00; 23:00 | BR-311 | GĐ |
| `early_termination` | báo ≥ 30 ngày mất 50% ký quỹ; < 30 ngày mất 100% | BR-313 | GĐ |
| `checkin_time`, `checkout_time` | 14:00; 12:00 | BR-401 | GĐ |
| `early_checkin_tiers` | 10:00–13:59 30%; 06:00–09:59 50%; < 06:00 100% | BR-411 | GĐ |
| `late_checkout_tiers`, `late_grace_until` | 12:01–15:00 30%; 15:01–18:00 50%; > 18:00 100%; ân hạn 12:00 | BR-412 | GĐ |
| `long_stay_free_late_until` | 15:00 (nếu không có khách đến) | BR-413 | GĐ |
| `extension_max_nights` | 7 | BR-421 | GĐ |
| `checkout_reminders` | 20:00 hôm trước; 09:00; 11:00; 12:00 | BR-425 | GĐ |
| `early_departure_refund` | báo ≥ 24 giờ hoàn 50% đêm chưa ở | BR-428 | GĐ |
| `foc_limits` | Lễ tân 100.000 (minibar); LT trưởng 300.000/lần, 1.500.000/tháng; Quản lý 1 đêm/lần; Chủ đầu tư không giới hạn | BR-433 | GĐ |
| `foc_alert_pct_of_room_revenue`, `foc_alert_count_per_approver` | 3%; 10 | BR-435 | GĐ |
| `electricity_price`, `water_price` | 3.500; 25.000 | BR-501 | GĐ + PL |
| `meter_reading_day`, `meter_anomaly_factor` | cuối tháng ± 2 ngày; × 2 | BR-502, 503 | GĐ |
| `utility_bill_due_days` | 5 | BR-504 | GĐ |
| `adhoc_cleaning_fee` | 100.000 | BR-506 | GĐ |
| `laundry_price_per_kg` | 30.000 | BR-507 | GĐ |
| `smoking_fee`, `key_card_fee`, `key_cards_per_booking` | 500.000; 200.000; 2 | BR-511 | GĐ |
| `lost_found_keep_days` | 30 | BR-513 | GĐ |
| `vat_rate`, `prices_include_vat` | 8%; có | BR-523 | PL |
| `registration_deadline_vn` | 23:00 ngày đến (đến sau 23:00 → 08:00 hôm sau) | BR-602 | PL |
| `registration_deadline_foreigner_hours` | 12 | BR-603 | PL |
| `visa_expiry_warning_days` | 14 | BR-605 | GĐ |
| `id_image_retention_days_after_checkout` | 30 | BR-610 | PL |
| `minibar_standard[]` | Bảng BL 4.13 (17 món) | BR-701 | GĐ |
| `stocktake_variance_approval_pct` | 5% | BR-705 | GĐ |
| `vacant_reinspect_days` | 3 | BR-805 | NGÀNH |
| `daily_clean_status_time`, `linen_change_every_nights` | 07:00; 3 | BR-802, 807 | GĐ |
| `wo_sla` | Cao 15 phút nhận / 2 giờ phương án; TB 24 giờ; Thấp 72 giờ | BR-809 | GĐ |
| `guest_request_response_minutes`, `front_desk_hours` | 10; 07:00–22:00 | BR-811 | GĐ |
| `channel_commission_pct.<channel>` | Airbnb 15,5; Booking 15; Agoda 18; Expedia 18; Trip.com 15; Trực tiếp 0 | BR-901 | GĐ |
| `short_stay_commission_pct` | CTV 8%; NV 3% | BR-903 | GĐ |

---

## 14. Tình huống cao điểm và sự cố (gắn với BR)

> Dùng làm đầu vào cho QA (test case) và UXD (trạng thái lỗi). Bản đầy đủ "10 tình huống ác mộng" là việc còn lại của DOM (xem report).

| # | Tình huống | Quy tắc áp dụng | App phải làm được |
|---|---|---|---|
| S1 | Tết, cả 10 căn kín; Agoda đẩy về 1 đơn cho căn đã bán trực tiếp (đồng bộ trễ) | BR-312, 905, 906 | Cảnh báo đỏ ngay, gợi ý căn thay thế, ghi chi phí dời khách |
| S2 | 21:00 mất nước nóng căn 203, khách Nga không nói tiếng Việt | BR-809, 424, 431 | Phiếu Cao, đổi phòng trong 2 giờ, mẫu tin nhắn RU/EN, FOC bù sự cố có duyệt |
| S3 | Khách Hàn đến 01:30, không có lễ tân trực | BR-611, 603, 402 | Check-in online trước, mã cửa gửi khi giấy tờ hợp lệ, hạn khai báo NN 13:30 hôm sau hiện cho người trực sáng |
| S4 | Khách dài hạn trả phòng, mất 1 thẻ, phòng có mùi thuốc lá, điện nước kỳ cuối chưa chốt | BR-214, 502, 511 | Quyết toán ký quỹ trong một màn hình, ảnh bằng chứng, hoàn tiền chờ quản lý duyệt |
| S5 | Hai lễ tân cùng nhận điện thoại đặt căn 203 cùng đêm | BR-906 | Một người thành công, người kia nhận thông báo rõ ràng |
| S6 | Khách xin trả 17:00 trong khi căn có khách đến 14:00 | BR-416, 412 | Chặn và gợi ý gửi hành lý; quản lý duyệt nếu có căn thay thế |
| S7 | Mất mạng internet tại quầy 2 giờ | BR-905 | Báo trạng thái mất đồng bộ; khi có mạng thì đẩy lại tồn phòng và kiểm trùng (ARC/UXD quyết cách làm offline) |
| S8 | Khách NN đến 08:00, lễ tân quen hạn 23:00 | BR-603 | Hiện hạn 20:00 cùng ngày, nhắc trước 2 giờ |
| S9 | CTV báo giá cho khách 20 đêm theo giá ngắn ngày | BR-108 | Báo giá tự hiện phương án 1 tháng rẻ hơn |
| S10 | Lễ tân tự duyệt FOC nhiều lần cho người quen | BR-432, 433, 435 | Không tự duyệt được; cảnh báo chủ đầu tư khi vượt ngưỡng |

---

## 15. Nghĩa vụ vận hành tại Việt Nam app cần hỗ trợ (cần INV/luật sư/kế toán xác nhận)

| Nghĩa vụ | App hỗ trợ | BR | Ghi chú |
|---|---|---|---|
| Thông báo lưu trú công dân VN | Chuẩn bị dữ liệu, nhắc hạn, lưu mã hồ sơ | BR-601, 602, 607 | Luật Cư trú 2020 – cần xác nhận |
| Khai báo tạm trú người nước ngoài + cập nhật ngày đi | Như trên + hạn 12 giờ + việc cập nhật ngày đi | BR-603…606 | Luật 47/2014 và sửa đổi – cần xác nhận; tài khoản cổng do INV cung cấp |
| Bảo vệ dữ liệu cá nhân (giấy tờ, ảnh, trẻ em) | Đồng ý, mã hóa, phân quyền, nhật ký xem, tự xóa | BR-609, 610 | BL dẫn Luật BVDLCN 91/2025/QH15; SEC đánh giá, luật sư xác nhận |
| Hóa đơn điện tử (MISA meInvoice) | Tách VAT, xuất đúng thời điểm, thông tin công ty/MST | BR-523, 524 | Thuế suất và diện máy tính tiền – kế toán xác nhận |
| Niêm yết giá dịch vụ lưu trú | Bảng giá/nội quy hiển thị cho khách (app khách, web) | BR-101, 511 | Cần xác nhận yêu cầu niêm yết cụ thể |
| Thu tiền điện nước của khách thuê | Đơn giá trên HĐ và hóa đơn tháng | BR-501 | Cần xác nhận quy định giá điện cho người thuê |

---

## 16. Đề xuất phương án cho câu hỏi BL mục 9 (thuộc nghiệp vụ) – để PO gom ESC ở đợt 3

> Mỗi câu: phương án, ưu/nhược, **khuyến nghị DOM**, và mặc định đội dùng nếu INV chưa trả lời (= giá trị trong BR). Cột "Nhóm ESC" theo plan R1 mục 8. PO quyết cách gộp thành ESC cuối cùng.

### Nhóm ESC "Chính sách giá & giảm giá" (BL 9 #1, #2, #4, #5)

**Q1 – Giá đêm = giá tháng ÷ 12, làm tròn, giá mùa/lễ cho kênh trực tiếp** (BR-101, 104, 005)
- A: Giữ ÷12, làm tròn 1.000, kênh trực tiếp **không** có giá mùa/lễ. – Ưu: đơn giản, giống prototype. – Nhược: dịp Tết bán trực tiếp rẻ hơn OTA, mất doanh thu.
- B: Giữ ÷12 làm giá nền trực tiếp; thêm lịch giá ngày đặc biệt +30% và cuối tuần +15% cho **mọi kênh**. – Ưu: bắt được cầu cao điểm Đà Lạt (lễ, Tết, cuối tuần); nhất quán giữa các kênh. – Nhược: phải duy trì lịch ngày lễ hằng năm.
- C: Bỏ ÷12, INV tự nhập giá đêm từng căn. – Ưu: linh hoạt nhất. – Nhược: thêm việc nhập, dễ lệch giữa giá tháng và giá đêm.
- **Khuyến nghị: B** (Đà Lạt có mùa vụ và cuối tuần rõ; giá trực tiếp nên luôn bằng hoặc rẻ hơn OTA một chút để kéo khách về kênh trực tiếp). Mặc định nếu chưa quyết: B với +30% lễ, +15% cuối tuần.

**Q2 – Phụ thu khách NN +10%** (BR-009, 109)
- A: Chỉ dài hạn, phân loại theo giấy tờ lưu trú (Việt kiều mang hộ chiếu NN = NN). – Ưu: rõ ràng, kiểm được bằng giấy tờ; bù chi phí khai báo, tiêu thụ điện nước cao hơn. – Nhược: Việt kiều có thể không vui.
- B: Áp cả ngắn ngày. – Ưu: thêm doanh thu. – Nhược: OTA không cho phân biệt giá theo quốc tịch; khách so giá dễ thấy chênh, rủi ro bị đánh giá kém.
- C: Bỏ phụ thu NN, thay bằng ký quỹ cao hơn. – Ưu: giá niêm yết như nhau. – Nhược: giảm doanh thu dài hạn ~10%.
- **Khuyến nghị: A.** Mặc định: A.

**Q4 – Giảm theo số đêm, ngưỡng chuyển dài hạn** (BR-107, 108)
- A: Giảm 10%/15% chỉ cho kênh Trực tiếp và CTV; OTA theo OTA; từ 15 đêm hiện so sánh với thuê 1 tháng, từ 28 đêm bắt buộc HĐ. – Ưu: không phá giá trên OTA; tránh trường hợp khách 20 đêm trả 13,46 tr trong khi thuê tháng 9,8 tr. – Nhược: sale phải giải thích HĐ cho khách ngắn.
- B: Áp giảm cho mọi kênh (cấu hình khuyến mãi dài ngày trên OTA). – Ưu: tăng ALOS trên OTA. – Nhược: phí OTA 15–18% trên giá đã giảm, biên mỏng.
- **Khuyến nghị: A.** Mặc định: A.

**Q5 – Phụ thu thêm người, trẻ em, giường phụ; sức chứa** (BR-110)
- A: Giá gồm 2 người lớn; người lớn thêm 150.000/đêm; trẻ < 6 miễn phí; 6–11 tuổi 100.000; sức chứa Lầu 1–2: 3, Căn N/N+: 4. – Ưu: thông lệ phổ biến. – Nhược: số sức chứa là tạm, INV phải xác nhận theo diện tích/giường thực tế.
- B: Không phụ thu người, chỉ giới hạn sức chứa. – Ưu: đơn giản. – Nhược: mất doanh thu nhóm 3–4 người, hao tổn amenity, điện nước.
- **Khuyến nghị: A**, INV cung cấp **sức chứa và số giường thực tế từng căn** (thông tin chỉ INV có). Mặc định: A.

### Nhóm ESC "Chính sách dài hạn" (BL 9 #3)

**Q3 – Bảng kỳ hạn, hoa hồng và thời điểm chi** (BR-201, 212)
- Bảng giảm giá/ký quỹ/chu kỳ thu: khuyến nghị **giữ nguyên BL 5.2** (đã khớp HĐ Daniel).
- HH 2 năm (4%/6%) thấp hơn 1 năm (6%/8,3%): có thể là chủ ý (HĐ dài đã giảm 15%, giảm hoa hồng để giữ biên). Phương án: A giữ nguyên; B cho 2 năm = 1 năm. **Khuyến nghị A** nếu INV xác nhận là chủ ý.
- Cơ sở tính HH: A chỉ tiền thuê (như BL); B gồm phí dịch vụ. **Khuyến nghị A** (phí dịch vụ là chi phí vận hành, không phải công bán hàng).
- Thời điểm chi: A 50% sau kỳ đầu + 50% sau khi qua 50% thời hạn; B 100% sau kỳ đầu; C chia theo từng kỳ thu. **Khuyến nghị A** (cân bằng động lực sale và rủi ro khách bỏ sớm). Mặc định: A.

**Q-D1 (DOM bổ sung) – Mâu thuẫn phí dịch vụ/dọn giữa BL và thực tế** (BR-204, 506)
- Bối cảnh: BL báo giá có phí dịch vụ cố định 300–400k/tháng + gói dọn định kỳ; Brief mục 5 nói HĐ thực tế "10 tr/tháng chỉ gồm tiền thuê, dọn 100k/lần không bắt buộc".
- A: Giữ mô hình BL (phí dịch vụ + gói dọn tùy chọn) + dọn lẻ 100k. – Ưu: thu thêm, bù chi phí cố định. – Nhược: khác cách đang làm với khách hiện tại.
- B: Bỏ phí dịch vụ cố định; chỉ tiền thuê + dọn theo lần 100k (như thực tế). – Ưu: giá báo dễ hiểu, khớp hợp đồng đang chạy. – Nhược: mất 300–400k/căn/tháng.
- C: Cả hai: phí dịch vụ là tham số, đặt = 0 cho HĐ cũ, áp cho HĐ mới. – Ưu: linh hoạt, không ép khách cũ. – Nhược: hai loại HĐ cùng tồn tại.
- **Khuyến nghị: C.** Mặc định: C (phí dịch vụ mặc định theo BL, sale đặt 0 được khi có lý do).

### Nhóm ESC "Hủy, hoàn cọc, chấm dứt HĐ, giữ chỗ/báo giá hết hạn, quyết toán ký quỹ" (BL 9 #6, #9, #11)

**Q6 – Chính sách hủy và chấm dứt sớm** (BR-309, 313, 314, 428)
- Ngắn ngày trực tiếp/CTV:
  - A (khuyến nghị): ≥ 7 ngày hoàn 100% cọc; 3–6 ngày hoàn 50%; < 3 ngày không hoàn; ngày cao điểm không hoàn; cho dời ngày 1 lần. – Ưu: giống thông lệ OTA "linh hoạt vừa", khách dễ chấp nhận, bảo vệ dịp cao điểm. – Nhược: phải giải thích trước khi nhận cọc.
  - B: Cọc không hoàn trong mọi trường hợp. – Ưu: đơn giản, giữ tiền. – Nhược: giảm tỉ lệ chốt khách trực tiếp, khách so với OTA "hủy miễn phí".
  - C: Hoàn 100% nếu hủy trước 3 ngày. – Ưu: cạnh tranh. – Nhược: rủi ro phòng trống sát ngày.
- Chấm dứt HĐ dài hạn sớm:
  - A (khuyến nghị): báo trước ≥ 30 ngày mất 50% ký quỹ; < 30 ngày mất 100%; hoàn tiền thuê tháng chưa bắt đầu.
  - B: Mất 100% ký quỹ + truy thu phần giảm giá kỳ hạn đã hưởng (ví dụ HĐ 1 năm giảm 12%, ở 4 tháng → truy thu 12% × 4 tháng tiền thuê gốc). – Ưu: chống khách "lách" giá dài hạn. – Nhược: nặng, dễ tranh chấp.
- Mặc định: A cho cả hai.

**Q9 – Quyết toán ký quỹ khi trả phòng dài hạn** (BR-214)
- A (khuyến nghị): kiểm phòng có ảnh trong ngày trả, khấu trừ điện nước kỳ cuối + phạt/bồi thường + phát sinh, hoàn phần còn lại trong 7 ngày làm việc, quản lý duyệt.
- B: Hoàn ngay tại quầy khi trả phòng. – Ưu: khách hài lòng. – Nhược: chưa kịp phát hiện hư hỏng, hóa đơn điện nước kỳ cuối.
- Mặc định: A.

**Q11 – Giữ chỗ và báo giá hết hạn** (BR-303, 304)
- A (khuyến nghị): tự hủy giữ chỗ khi hết hạn + nhắc sale trước 2 giờ + cho gia hạn 1 lần 24 giờ; báo giá hết hiệu lực sau 3 ngày, tạo đơn phải tính lại giá.
- B: Không tự hủy, chỉ báo sale quyết. – Ưu: sale chủ động. – Nhược: phòng bị "treo" trên mọi OTA nếu sale quên, mất doanh thu.
- Mặc định: A.

### Nhóm ESC "Phụ thu nhận sớm/trả muộn + hạn mức FOC" (BL 9 #7, #8)

**Q7 – Ân hạn, khách dài hạn, khách OTA** (BR-412, 413, 415)
- Ân hạn trả phòng:
  - A: Không ân hạn (tính từ 12:01, như code). – Ưu: thu tối đa. – Nhược: dễ bị đánh giá kém vì 10–20 phút.
  - B (khuyến nghị): ân hạn đến 12:30, **chỉ khi** căn không có khách đến cùng ngày; mốc 13:00 của bảng `LATE` bỏ. – Ưu: thân thiện, ít tranh cãi, không ảnh hưởng dọn phòng cho khách sau. – Nhược: mất một ít phụ thu.
  - C: Ân hạn đến 13:00 cho mọi khách. – Nhược: ép thời gian dọn khi có khách 14:00.
- Khách dài hạn: khuyến nghị miễn phí nhận sớm ngày đầu/trả muộn ngày cuối đến 15:00 nếu căn trống; nếu thu thì theo giá đêm quy đổi (÷30).
- Khách OTA: khuyến nghị áp chính sách OTTIMO, thu trực tiếp, đăng trong house rules trên OTA.
- Mặc định: A (giữ như code) cho đến khi INV chọn; dài hạn và OTA như khuyến nghị.

**Q8 – Hạn mức FOC và cách phê duyệt** (BR-432, 433, 435)
- A (khuyến nghị): hạn mức theo cấp như BR-433; người duyệt xác nhận bằng mật khẩu/PIN của chính họ trên app; cảnh báo khi FOC tháng > 3% doanh thu phòng.
- B: Mọi FOC đều cần quản lý duyệt. – Ưu: chặt. – Nhược: chậm tại quầy lúc đông khách, quản lý bị làm phiền liên tục.
- C: Không hạn mức, chỉ báo cáo cuối tháng (như prototype). – Nhược: rủi ro thất thoát, không kiểm soát được.
- Mặc định: A.

### Nhóm ESC "Điện nước, phí dịch vụ, giặt ủi" (BL 9 #10, #12 phần giá)

**Q10 – Đơn giá điện nước, phí khác** (BR-501, 505)
- A: Đơn giá cố định 3.500/kWh, 25.000/m³. – Ưu: dễ hiểu, dễ tính. – Nhược: cần xác nhận pháp lý về giá điện bán lại.
- B: Theo bậc EVN và giá nước địa phương tại thời điểm. – Ưu: an toàn pháp lý nếu bị coi là "cho thuê nhà ở". – Nhược: phức tạp, phải cập nhật giá.
- **Khuyến nghị: A**, nhưng INV hỏi kế toán/luật sư về quy định giá điện cho người thuê trước khi in lên HĐ mới. Internet/rác/gửi xe: gồm trong tiền thuê (không thu riêng). Mặc định: A.

**Q12 – Lịch dọn, giặt ủi** (BR-507, 807)
- Lịch dọn dài hạn ngày cố định, khung 9:00–11:00: **đội tự chốt** (giữ như BL, khách đổi lịch qua app).
- Dọn hằng ngày cho khách ngắn ngày: A (khuyến nghị) dọn hằng ngày trừ khi khách từ chối, thay ga mỗi 3 đêm; B chỉ dọn theo yêu cầu (tiết kiệm nhân công, phù hợp khách ở lâu).
- Giặt ủi: INV cung cấp bảng giá; tạm 30.000/kg.

### Đầu vào DOM cho nhóm "Pháp lý" (BL 9 #14, #15, #16) – PO/SEC chủ trì

- **Q14 – Thời hạn lưu ảnh giấy tờ**: giữ đề xuất 30 ngày sau trả phòng cho ảnh; thông tin khai báo dạng văn bản (không ảnh) giữ lâu hơn để tra cứu khách quen và phục vụ cơ quan chức năng – thời hạn do luật sư đề xuất (BR-610).
- **Q15 – Tài khoản cổng Bộ Công an và khai báo ca tối**: INV xác nhận đã có tài khoản cơ sở lưu trú chưa và ai giữ; DOM đề xuất BR-611 (check-in online + người trực nhận thông báo). **Phát hiện mới:** hạn khai báo người nước ngoài có thể là 12 giờ, không phải 23:00 (BR-603) – đề nghị luật sư xác nhận trong cùng ESC.
- **Q16 – VAT**: giá đã gồm VAT, tách khi xuất; thuế suất 8% hay 10% và áp cho cả dài hạn – kế toán xác nhận; cách xử lý thuế với phí phạt, bồi thường, ký quỹ bị khấu trừ (BR-523).

### Câu hỏi mới DOM phát hiện (ngoài 26 câu BL)

| Mã | Câu hỏi | Khuyến nghị DOM | Nhóm ESC gợi ý |
|---|---|---|---|
| Q-D1 | Phí dịch vụ cố định + gói dọn (BL) hay "chỉ tiền thuê + dọn 100k/lần" (thực tế)? | C – tham số, HĐ cũ đặt 0 | Chính sách dài hạn |
| Q-D2 | Hoa hồng CTV ngắn ngày 8% (công cụ báo giá) hay 7% (báo cáo kênh)? | 8% trên tiền phòng, báo cáo lấy từ hoa hồng thực tế từng đơn | Chính sách dài hạn (hoa hồng) |
| Q-D3 | Hạn khai báo người nước ngoài 12 giờ thay vì 23:00? | Áp hạn sớm hơn giữa hai mốc cho đến khi luật sư xác nhận | Pháp lý |
| Q-D4 | Mã cửa theo ngày sinh khách dễ đoán – có chấp nhận thêm 2 số ngẫu nhiên? | Có (SEC cùng đánh giá) | Tài khoản bên thứ ba / khóa cửa |
| Q-D5 | Sức chứa tối đa và số giường thực tế từng căn? | INV cung cấp; tạm 3/4/4 | Chính sách giá |

---

## 17. Đề xuất dòng ghi `decision-log.md` (ORC ghi khi commit – DOM không sửa trực tiếp để tránh xung đột với các vai chạy song song)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
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
