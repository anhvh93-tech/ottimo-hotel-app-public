# Quy tắc kinh doanh – OTTIMO Boutique Stay (BR-xxx)

- Tác giả: DOM | Round 2 – Tuần 1 | Ngày: 16/10/2026 | Phiên bản: **0.3** (áp quyết định INV 16/10 cho ESC-001, 004–008, 010, 011 và thông tin INV gửi 16/10: định mức từng căn, loại hình doanh nghiệp, hãng khóa, tài khoản nhận; sửa BUG-R2-001…003 – xem **mục 18 Lịch sử thay đổi**). Mã BR cũ giữ nguyên, quy tắc mới dùng số mới.
- Nguồn: `product/docs/round-0-baseline.md` (gọi tắt **BL**) mục 4, 5, 8.2, 9; `00-brief/investor-brief.md` (gọi tắt **Brief**) mục 4–5; `01-decisions/decision-log.md`.
- Tài liệu này là **nguồn sự thật duy nhất** cho mọi con số nghiệp vụ (giá, %, giờ, phí). PRD, backlog, đặc tả BA, test case chỉ **tham chiếu mã BR**, không chép lại con số (plan R1 mục 7, tiêu chí B3).

## 0. Cách đọc

### 0.1 Nhãn của mỗi quy tắc
| Nhãn | Ý nghĩa | Ai quyết |
|---|---|---|
| **NGÀNH** | Cách làm chuẩn trong vận hành khách sạn/căn hộ dịch vụ tại Việt Nam, hoặc sửa lỗi logic của prototype. Không phải chính sách riêng của OTTIMO | DOM tự chốt (ghi decision-log) |
| **INV quyết ESC-xxx 16/10** (mới v0.3) | Chính sách riêng của OTTIMO **đã được INV chọn** (phương án đội đề xuất) ngày 16/10/2026. Là giá trị chính thức để code và in lên báo giá/nội quy; đổi giá trị phải có INV đồng ý (vẫn là tham số, không sửa code) | INV |
| **[GIẢ ĐỊNH – chờ INV xác nhận]** | Giá trị/chính sách riêng của OTTIMO **chưa** có quyết định hoặc **còn chờ INV gửi thông tin** (ghi rõ thông tin nào). Lấy từ BL/Brief hoặc DOM đề xuất. Đội dùng để đi tiếp | INV |
| **PHÁP LÝ – cần xác nhận** | Liên quan luật. DOM ghi nguồn theo hiểu biết, **không phải ý kiến pháp lý**; cần luật sư/kế toán xác nhận trước khi chạy thật | INV + luật sư/kế toán |

Cột "Nguồn" ghi nơi lấy quy tắc. "DOM đề xuất" = BL/Brief chưa có, DOM bổ sung.

### 0.2 Nguyên tắc chung cho mọi con số
1. **Mọi con số là tham số cấu hình** (bảng tham số theo cơ sở, có ngày hiệu lực), không cố định trong code. Danh sách tham số ở **mục 13**.
2. **Chụp lại giá trị (snapshot)**: đơn, báo giá, hợp đồng lưu lại giá và tham số **tại thời điểm tạo**. Đổi tham số về sau **không** làm thay đổi đơn/HĐ đã xác nhận.
3. Mọi thao tác chạm đến tiền (sửa giá, giảm giá, FOC, hủy, hoàn, phạt) ghi nhật ký: ai, lúc nào, giá trị trước/sau, lý do.
4. **Con số nào không có khóa ở mục 13 thì không được dùng trong code.** Thấy con số trong BR mà mục 13 chưa có khóa → báo DOM bổ sung, không viết cứng.
5. **Biên khoảng thời gian**: khi BR viết "A–B" cho khung giờ thì hiểu là **[A, B)** (gồm A, không gồm B), trừ khi ghi khác. Khi BR viết "quá N ngày/giờ" thì **đủ N là quá**.

### 0.3 Mục lục nhóm quy tắc
| Nhóm | Mã | Nội dung |
|---|---|---|
| 1 | BR-001 … BR-011 | Quy ước chung (giờ, đêm, làm tròn, mã chứng từ, phân loại khách VN/NN, **ngày nghiệp vụ**, **đếm ngày báo trước**) |
| 2 | BR-101 … BR-113 | Giá và bán ngắn ngày (thêm **ở tối thiểu** BR-113) |
| 3 | BR-201 … BR-215 | Thuê dài hạn |
| 4 | BR-301 … BR-317 | Giữ chỗ, đặt cọc, hủy, no-show (**khôi phục no-show** BR-315), overbooking, **tự gán căn OTA** BR-316, **xử lý xung đột OTA** BR-317 |
| 4A | BR-321 … BR-326 | **Đơn nhóm / đoàn nhiều căn** (mới v0.2) |
| 5 | BR-401 … BR-428 | Nhận/trả phòng, nhận sớm/trả muộn (**nhận trước 06:00** BR-417), gia hạn, đổi phòng, nhắc trả phòng |
| 6 | BR-431 … BR-436 | FOC (miễn phí) và giảm giá ngoài chính sách (**tự miễn trong hạn mức** BR-436) |
| 7 | BR-501 … BR-527 | Điện nước, dịch vụ, phí phạt, thanh toán, hóa đơn, **đóng ca / đối soát** BR-526, BR-527 |
| 8 | BR-601 … BR-613 | Khai báo lưu trú, giấy tờ, dữ liệu cá nhân (**hệ quả kiểm giấy tờ NN** BR-613) |
| 9 | BR-701 … BR-706 | Minibar, F&B, kho |
| 10 | BR-801 … BR-811 | Trạng thái buồng, dọn phòng, bảo trì |
| 11 | BR-901 … BR-907 | Kênh bán, hoa hồng, quy ước số liệu, cảnh báo |
| 12 | BR-951 … BR-955 | Hồ sơ khách (CRM) – định danh, trùng, gộp |
| 12A | BR-961 … BR-964 | **Vận hành khi mất mạng / mất điện** (mới v0.2) |
| – | Mục 13–18 | Bảng tham số · Tình huống cao điểm/sự cố · Nghĩa vụ pháp lý · Phương án cho câu hỏi BL mục 9 · Đề xuất ghi decision-log · **Lịch sử thay đổi** |

---

## 1. Quy ước chung (BR-0xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-001 | Mọi mốc giờ (nhận/trả phòng, hạn giữ chỗ, hạn khai báo, nhắc tự động, chốt công tơ) tính theo giờ **Asia/Ho_Chi_Minh** | Hạn giữ chỗ "24 giờ" tạo lúc 10:00 15/10 → hết hạn 10:00 16/10 giờ VN, kể cả khi người thao tác ở nước ngoài | NGÀNH | BL 7, 8.4 |
| BR-002 | Một đơn chiếm khoảng **[ngày đến, ngày đi)**: đêm cuối là đêm trước ngày đi. Số đêm = ngày đi − ngày đến. Hai đơn cùng căn **không trùng** nếu ngày đi của đơn trước = ngày đến của đơn sau | Đến 19/10, đi 22/10 → 3 đêm (19, 20, 21). Đơn A đi 22/10 và đơn B đến 22/10 cùng căn: hợp lệ | NGÀNH | BL 5.4 |
| BR-003 | Đêm lưu trú gắn với **ngày lịch khách bắt đầu ngủ**. Khách nhận phòng trước 06:00 coi như dùng đêm hôm trước – cách xử lý ở **BR-417** (v0.2); mốc 06:00 trùng mốc đổi ngày nghiệp vụ (BR-010) | Nhận phòng 04:30 ngày 20/10 → tính thêm đêm 19/10 (đêm bán, không phải phụ thu) | NGÀNH | BL 5.6 |
| BR-004 | Tiền lưu bằng **VND số nguyên**. USD chỉ để hiển thị tham khảo cho khách nước ngoài, theo tỷ giá cấu hình (cập nhật tay, ghi ngày cập nhật) | Tỷ giá mặc định 26.200 đ/USD: 13.908.000 đ ≈ 530,8 USD | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2, 7 |
| BR-005 | Quy tắc làm tròn (làm tròn **gần nhất**): giá đêm, phụ thu, phí → 1.000 đ; tiền thuê tháng, giá OTA → 10.000 đ; cọc, ký quỹ → 100.000 đ | 666.667 → 667.000; 11.132.000 → 11.130.000; ký quỹ 4.750.000 → 4.800.000 | INV quyết ESC-004 16/10 | BL 5.1–5.3, 9 #1; ESC-004 |
| BR-006 | Đơn/báo giá/HĐ lưu **snapshot** giá, tỷ lệ giảm, hệ số ký quỹ, tỷ lệ hoa hồng, chu kỳ thu tại thời điểm tạo. Sửa tay một con số trên HĐ phải có lý do và người duyệt (quản lý trở lên) | HĐ Daniel lưu kỳ thu 36.030.000 do thỏa thuận riêng → hợp lệ nếu có ghi chú lý do; công thức chỉ dùng khi báo giá | NGÀNH | BL 8.2 #10 |
| BR-007 | Mã chứng từ do **server cấp, duy nhất, liên tục**; không dùng thời gian hoặc số ngẫu nhiên. Mã đã cấp không tái sử dụng kể cả khi hủy. **Phạm vi và chu kỳ đánh số** (v0.2): đơn `OTM-`, báo giá `BG-`, phiếu sửa `WO-`, **nhóm đơn `NH-` + 5 số** (BR-321, theo erd mục mã chứng từ), phiếu thu → liên tục **theo cơ sở**, không đặt lại; bill → `F` + 2 số năm + số liên tục **theo cơ sở trong năm**, đặt lại về 1 ngày 1/1 (giờ VN); khách `KH-` → liên tục **theo tổ chức** (hồ sơ khách dùng chung các cơ sở). Số bill cấp khi folio `settled` | Đơn `OTM-00171`, báo giá `BG-00049`, phiếu sửa `WO-00034`, nhóm đơn `NH-00012`, bill **`F26-000123`** (bill thứ 123 năm 2026 của cơ sở; bill đầu năm 2027 là `F27-000001`), khách `KH-0018` | NGÀNH | BL 8.2 #18; ARC M6 |
| BR-008 | Nhật ký thao tác tiền bắt buộc (xem 0.2.3). Không cho xóa bút toán; sai thì ghi bút toán điều chỉnh | Sửa phụ thu 210.000 → 150.000: lưu cả 2 giá trị, người sửa, lý do | NGÀNH | BL 8.2 #24 |
| BR-009 | Phân loại **khách VN / khách NN** (dùng cho phụ thu dài hạn và ký quỹ) theo **giấy tờ dùng để khai báo lưu trú**: CCCD/định danh VN → VN; hộ chiếu nước ngoài → NN (kể cả Việt kiều mang hộ chiếu nước ngoài). Lúc báo giá dùng thông tin sale nhập; khi nhận phòng nếu giấy tờ khác loại đã báo → cảnh báo quản lý, **không tự đổi giá HĐ** | Khách Việt kiều quốc tịch Pháp, nhập cảnh bằng hộ chiếu Pháp → NN, +10% dài hạn | INV quyết ESC-004 16/10 | BL 9 #2; ESC-004 |
| BR-010 | **Ngày nghiệp vụ** (business date): ngày làm việc của cơ sở **đổi lúc 06:00** giờ VN (`business_day_rollover`), không đổi lúc 00:00. Từ 00:00 đến 05:59 vẫn thuộc ngày nghiệp vụ hôm trước. Áp cho: "hôm nay / đêm nay" trên mọi màn hình và danh sách (BR-404), điều kiện "hôm nay = ngày đến" khi nhận phòng, KPI "đêm nay", phạm vi dữ liệu theo ngày của vai (rbac phạm vi T), khôi phục no-show (BR-315), đóng ca (BR-526). **Không áp** cho hạn pháp lý (BR-602, BR-603): các hạn này tính theo giờ đồng hồ thực | Đơn đến 20/10, khách tới quầy 01:30 ngày 21/10 → ngày nghiệp vụ vẫn là 20/10: đơn vẫn ở "Khách đến hôm nay" và nhận phòng được; KPI "đêm nay" lúc 02:00 là đêm 20/10. Lúc 06:00 ngày 21/10 → ngày nghiệp vụ 21/10 | NGÀNH | BR-003; DOM-PO-04, BA-DOM-09 |
| BR-011 | **Đếm số ngày báo trước** (cho hủy, trả sớm, chấm dứt HĐ): số ngày báo trước = **ngày mốc − ngày nghiệp vụ lúc khách báo** (đếm ngày lịch, giờ VN, BR-010), không tính theo giờ. Ngày mốc: hủy đơn ngắn ngày (BR-309) → **ngày đến**; trả phòng sớm (BR-428) → **ngày khách rời đi mới**; chấm dứt HĐ (BR-313) → **ngày trả phòng khách báo**; hủy HĐ trước khi vào ở (BR-314) → **ngày vào ở** của HĐ. Thời điểm báo = thời điểm ghi nhận yêu cầu trong app (hoặc giờ tin nhắn/email của khách nếu lễ tân nhập bù, ghi kèm bằng chứng) | Đơn đến 22/10: báo hủy 15/10 bất kỳ giờ nào → 7 ngày; báo 01:00 ngày 16/10 → ngày nghiệp vụ 15/10 → vẫn 7 ngày; báo 10:00 ngày 16/10 → 6 ngày | NGÀNH | BA-DOM-07 |

---

## 2. Giá và bán ngắn ngày (BR-1xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-101 | **Giá niêm yết** mỗi căn gồm giá tháng và giá đêm. Giá đêm niêm yết = giá tháng ÷ 12, làm tròn 1.000 (BR-005) | Bảng 10 căn ở BL 4.1. Căn 101: 8.000.000 ÷ 12 = 666.667 → **667.000**; căn 401: 12.500.000 ÷ 12 → **1.042.000** | INV quyết ESC-004 16/10 | BL 4.1, 5.1, 9 #1; ESC-004 |
| BR-102 | Có **hai loại giá đêm**, không được dùng lẫn: (a) *giá đêm niêm yết* (BR-101) để bán ngắn ngày trực tiếp; (b) *giá đêm quy đổi dài hạn* = tiền thuê tháng **của HĐ** ÷ 30, chỉ dùng cho ngày lẻ, phụ thu sớm/muộn, hoàn trả của khách dài hạn | HĐ 11.130.000/tháng → giá đêm quy đổi 371.000 | NGÀNH | BL 5.1, 8.2 #13 |
| BR-103 | **Giá OTA nền** theo nhóm căn: Lầu 1–2 760.000 · Căn N 1.050.000 · Căn N+ 980.000. Đêm thứ Sáu và thứ Bảy +15%, làm tròn 10.000. Cách tăng giá cuối tuần/ngày đặc biệt áp cho **mọi kênh** theo BR-104 | Lầu 1–2 cuối tuần 874.000 → **870.000**; Căn N **1.210.000**; Căn N+ **1.130.000** | INV quyết ESC-004 16/10 | BL 5.1; ESC-004 |
| BR-104 | **Lịch giá** theo nhóm căn × ngày × kênh, áp cho **mọi kênh kể cả Trực tiếp và CTV** (v0.3). Giá một đêm = giá nền của kênh × (1 + mức tăng), làm tròn theo BR-005 (Trực tiếp/CTV 1.000; OTA 10.000). Giá nền: Trực tiếp/CTV = giá đêm niêm yết (BR-101); OTA = giá OTA nền (BR-103). Mức tăng **không cộng dồn**, lấy một mức theo thứ tự ưu tiên: ngày đặc biệt (lễ, Tết, mùa cao điểm, sự kiện) **+30%** > đêm thứ Sáu, thứ Bảy **+15%** > 0%. Khoảng ngày trong danh sách ngày đặc biệt **gồm cả hai đầu** (24/12–1/1 = các đêm 24/12 … 1/1). Danh sách và mức tăng cấu hình được, có ngày hiệu lực; cập nhật mỗi năm (Tết âm lịch đổi ngày). Giảm theo thời gian ở (BR-107) áp **sau** lịch giá, trên giá từng đêm. Lưu ý "bằng giá" (rate parity): giá trực tiếp công khai không thấp hơn OTA nếu hợp đồng OTA có điều khoản này – INV tự kiểm hợp đồng | Ngày đặc biệt mặc định: Tết Nguyên đán, 30/4–1/5, 2/9, 24/12–1/1. Căn 202 (niêm yết 792.000): đêm thứ Ba 10/11 → **792.000**; đêm thứ Bảy 14/11 → 792.000 × 1,15 = 910.800 → **911.000**; đêm 31/12 (thứ Năm, ngày đặc biệt) → 792.000 × 1,3 = 1.029.600 → **1.030.000**. OTA nhóm Lầu 1–2 đêm 31/12: 760.000 × 1,3 = 988.000 → **990.000**. Mùa cao điểm Đà Lạt (hè, Festival Hoa, mùa hoa): chưa có trong lịch đến khi INV gửi danh sách | INV quyết ESC-004 16/10; danh sách mùa cao điểm Đà Lạt: [GIẢ ĐỊNH – chờ INV gửi danh sách] (ESC-004 P-A) | BL 9 #1; ESC-004 (dòng 2, 7) |
| BR-105 | Mỗi nhóm căn có **giá sàn và giá trần**. Sửa giá ngoài khoảng → chặn; giá rỗng hoặc 0 → báo lỗi tại ô, không bỏ qua lặng lẽ | Sàn = 70% giá nền, trần = 250% giá nền. Lầu 1–2: sàn 532.000 → 530.000, trần 1.900.000. Nhập 0 → lỗi "Giá phải từ 530.000 đến 1.900.000" | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 8.2 #20 |
| BR-106 | Giá trên đơn được chốt **từng đêm** lúc xác nhận (snapshot, BR-006). Đổi lịch giá sau đó không ảnh hưởng đơn đã có | Đơn 3 đêm 19–21/10 giá 820.000/đêm; hôm sau tăng giá lên 900.000 → đơn vẫn 2.460.000 | NGÀNH | BL 5.1 |
| BR-107 | **Giảm theo thời gian ở** (ngắn ngày, kênh Trực tiếp và CTV): ≥ 7 đêm −10%; ≥ 14 đêm −15%; áp trên giá từng đêm rồi làm tròn 1.000. **Không áp** cho đơn OTA (giá do OTA quyết) | Giảm áp trên **giá từng đêm sau lịch giá** (BR-104), làm tròn 1.000. Căn 202, 7 đêm 9/11–16/11/2026 (thứ Hai → thứ Hai; có đêm thứ Sáu 13/11 và thứ Bảy 14/11): ngày thường 792.000 × 0,9 = 712.800 → 713.000; cuối tuần 911.000 × 0,9 = 819.900 → 820.000 → 5 × 713.000 + 2 × 820.000 = **5.205.000**. 14 đêm 9/11–23/11 (4 đêm cuối tuần): 792.000 × 0,85 = 673.200 → 673.000; 911.000 × 0,85 = 774.350 → 774.000 → 10 × 673.000 + 4 × 774.000 = **9.826.000** | INV quyết ESC-004 16/10 | BL 5.3, 9 #4; ESC-004 |
| BR-108 | **Ngưỡng chuyển dài hạn**: từ 15 đêm, công cụ báo giá tự hiện song song phương án thuê 1 tháng để sale chọn phương án có lợi; từ 28 đêm bắt buộc làm báo giá dài hạn (HĐ) | Căn 202, khách VN, 20 đêm 9/11–29/11/2026 (6 đêm thứ Sáu/thứ Bảy): ngắn ngày 14 × 673.000 + 6 × 774.000 = **14.066.000** so với 1 tháng 9.500.000 + phí dịch vụ 300.000 = **9.800.000** (+ điện nước theo công tơ, + ký quỹ 4.800.000) | INV quyết ESC-004 16/10 | BL 9 #4, DOM đề xuất; ESC-004 |
| BR-109 | **Phụ thu khách NN +10%** chỉ áp cho **dài hạn**; ngắn ngày không phụ thu theo quốc tịch | Căn 302 dài hạn NN: 11.000.000 × 1,1 = 12.100.000 trước giảm kỳ hạn | INV quyết ESC-004 16/10 | BL 5.2–5.3, 9 #2; ESC-004 |
| BR-110 | **Định mức, sức chứa và phụ thu người** (viết lại v0.3 theo thông tin INV gửi 16/10). Mỗi căn có **định mức** (`room.<no>.base_occupancy` = số người đã gồm trong giá) và **sức chứa tối đa** (`room.<no>.max_occupancy`, chặn khi đặt); cả hai là thuộc tính **của từng căn**, giá trị theo nhóm chỉ là mặc định khi tạo căn. Thực tế OTTIMO: **Studio** 101, 102, 103, 201, 202, 203 – 1 giường, định mức **2**; **căn hộ 2 phòng ngủ riêng** 301, 401 – 2 giường lớn, định mức **4**; **1 phòng ngủ + giường phụ** 302, 402 – 1 giường lớn + 1 giường 1m4, định mức **3** (giường 1m4 đã gồm trong định mức: người thứ 3 không bị phụ thu). Người tính vào định mức và sức chứa: người lớn (từ 12 tuổi) và trẻ 6–11 tuổi; **trẻ dưới 6 tuổi** ngủ chung **miễn phí, không tính** vào định mức và sức chứa (vẫn khai báo lưu trú, BR-601). Người vượt định mức: người lớn thêm 150.000/đêm (gồm nệm phụ), trẻ 6–11 tuổi 100.000/đêm; người lớn được xếp vào định mức trước, nên người vượt tính theo mức thấp hơn. **Sức chứa tối đa tạm = định mức + 1** (một nệm phụ) đến khi INV xác nhận (ESC-014). Tuổi tính tại **ngày đến**. Thêm người giữa kỳ ở → phụ thu từ đêm thêm người, lễ tân xác nhận trước khi ghi folio (như BR-414). **Đơn OTA**: không cộng phụ thu người nếu số khách trên đơn OTA đã gồm người đó (OTA đã tính giá theo số khách); chỉ thu khi số người thực tế vượt số khách trên đơn | Căn 202 (Studio, định mức 2), 3 người lớn, 3 đêm: +150.000 × 3 = **450.000**. Căn 302 (định mức 3), 3 người lớn, 3 đêm: **0 đ**. Căn 301 (định mức 4), 4 người lớn + 1 trẻ 8 tuổi, 3 đêm: người vượt là trẻ → +100.000 × 3 = **300.000**. Căn 202, 2 người lớn + 1 trẻ 4 tuổi: **0 đ**, không tính vào sức chứa. Căn 202, 4 người lớn → **chặn** (vượt tối đa tạm 3) | Định mức từng căn (INV gửi 16/10) và mức phụ thu: INV quyết ESC-004 16/10; sức chứa tối đa = định mức + 1: [GIẢ ĐỊNH – chờ INV xác nhận] (ESC-014) | BL 9 #5; ESC-004 dòng 5; INV 16/10 (định mức từng căn) |
| BR-111 | **Mã khách quay lại** (OTTIMO-BACK5, −5%) chỉ dùng cho kênh Trực tiếp; **không cộng dồn** với giảm theo thời gian ở (BR-107): áp mức có lợi hơn cho khách | 7 đêm được −10% → không áp thêm 5% | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 3.8, 5.18 |
| BR-112 | Đơn phải có **kênh**. Đơn OTA lấy giá từ OTA/channel manager. Form đặt phòng ngắn ngày: cửa sổ bán 365 ngày tính từ hôm nay (không cố định đến 31/12/2026), 1–27 đêm (từ 28 đêm theo BR-108); có chọn kênh "HĐ dài hạn" thông qua luồng báo giá | Ngày 15/10/2026 đặt được đến 14/10/2027 | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 3.5, 8.2 #26 |
| BR-113 | **Ở tối thiểu (min stay)** theo nhóm căn × ngày đến × kênh: đơn có ngày đến rơi vào ngày bị đặt ở tối thiểu phải có số đêm ≥ mức đó. Đẩy lên channel manager cùng lịch giá. **Mặc định bật** (v0.3): ngày đến là **thứ Sáu, thứ Bảy hoặc ngày đặc biệt** (BR-104) → tối thiểu **2 đêm**, mọi kênh. **Ngoại lệ đêm lẻ** (đêm trống kẹp giữa hai đơn của cùng một căn): (a) web trực tiếp, quầy, CTV: hệ thống tự nhận đơn 1 đêm nếu trong nhóm có căn mà đêm đó là đêm lẻ, và gán vào căn đó; (b) OTA: ở tối thiểu trên kênh tính theo nhóm, nên hệ thống chỉ đẩy tối thiểu = 1 cho nhóm–ngày khi **mọi** căn còn trống của nhóm đêm đó đều là đêm lẻ. Ngoài hai trường hợp này, lễ tân trưởng trở lên được bỏ qua cho một đơn trực tiếp, ghi lý do | Khách xin đến thứ Bảy 24/10 ở 1 đêm → chặn ở web/OTA ("Tối thiểu 2 đêm"). Căn 202 có đơn đi 24/10 và đơn đến 25/10 (đêm 24/10 lẻ) → web nhận đơn 1 đêm và gán 202. Đêm 24/10 nhóm Lầu 1–2 còn 202 (lẻ) và 101 (không lẻ) → trên OTA vẫn tối thiểu 2 đêm | INV quyết ESC-004 16/10 (M-A); cách xử lý đêm lẻ: NGÀNH | DOM-PO-13; ESC-004 dòng 6 |

---

## 3. Thuê dài hạn (BR-2xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-201 | **Bảng kỳ hạn** (giảm giá, hệ số ký quỹ VN/NN, chu kỳ thu, hoa hồng NV/CTV) | 1 tháng: 0% · 0,5/1 · 1 tháng · 3%/5%. 3 tháng: 5% · 1/1 · 3 · 4%/6%. 6 tháng: 8% · 1/1,5 · 3 · 5%/7%. 1 năm: 12% · 1/2 · 3 · 6%/8,3%. 2 năm: 15% · 2/2 · 3 · 4%/6% (hoa hồng 2 năm thấp hơn 1 năm: INV giữ nguyên) | INV quyết ESC-005 16/10 | BL 5.2, 9 #3; ESC-005 |
| BR-202 | Kỳ hạn tối thiểu 1 tháng. Kỳ hạn không trùng 5 mốc → áp mức của **mốc thấp hơn gần nhất** | HĐ 4 tháng → áp mức 3 tháng (giảm 5%); HĐ 9 tháng → mức 6 tháng (8%) | INV quyết ESC-005 16/10 | DOM đề xuất |
| BR-203 | **Tiền thuê/tháng** = làm tròn 10.000 của giá tháng × (1 + 10% nếu NN) × (1 − giảm kỳ hạn) | Daniel (301, NN, 1 năm): 11.500.000 × 1,1 × 0,88 = 11.132.000 → **11.130.000** | INV quyết ESC-004, ESC-005 16/10 | BL 5.2 |
| BR-204 | **Phí dịch vụ và dọn phòng**: phí dịch vụ cố định theo nhóm (Lầu 1–2 300.000, Căn N 400.000, Căn N+ 350.000/tháng) + gói dọn định kỳ tùy chọn (0–3 lần/tuần; phí/tháng = số lần × 52/12 × giá/lần, làm tròn 1.000). Dọn lẻ ngoài gói theo BR-506. **Áp theo loại HĐ** (v0.3, Q-D1 đã quyết): HĐ **đang chạy trước khi dùng app** (nhập tay, US-017 AC5a – như HĐ "10 tr/tháng chỉ gồm tiền thuê" ở Brief mục 5) giữ "chỉ tiền thuê": phí dịch vụ snapshot = 0, dọn lẻ 100.000/lần; **HĐ mới** áp phí dịch vụ theo nhóm + gói dọn tùy chọn. Sale đặt phí dịch vụ = 0 cho HĐ mới phải có lý do và quản lý duyệt (BR-006) | HĐ mới căn 302, dọn 2 lần/tuần: 2 × 4,333 × 200.000 = 1.733.000 → phí dịch vụ 350.000 + 1.733.000 = **2.083.000**. HĐ đang chạy 10.000.000/tháng, khách gọi dọn lẻ 3 lần trong tháng → phí dịch vụ 0 + **300.000** | INV quyết ESC-005 16/10 | BL 5.2; Brief 5; ESC-005 dòng 3 |
| BR-205 | **Điện nước ước tính** chỉ dùng trong báo giá: VN 120 kWh + 3,5 m³/người; NN 170 kWh + 4 m³/người. Thu thật theo công tơ (BR-501…504) | NN 1 người: 170 × 3.500 + 4 × 25.000 = **695.000/tháng** (chỉ để báo giá) | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2 |
| BR-206 | **Ký quỹ** = làm tròn 100.000 của tiền thuê × hệ số (BR-201). Giữ suốt HĐ; không dùng để trừ tiền thuê hằng kỳ; không tính lãi; chỉ khấu trừ/hoàn khi quyết toán (BR-214) hoặc chấm dứt sớm (BR-313) | Daniel: 11.130.000 × 2 = 22.260.000 → **22.300.000** | NGÀNH (cách giữ); hệ số: INV quyết ESC-005 16/10 | BL 5.2 |
| BR-207 | **Chu kỳ thu** = min(chu kỳ của kỳ hạn, số tháng HĐ). Tiền thuê + phí dịch vụ **thu trước, đầu mỗi kỳ**; điện nước thu **sau**, hằng tháng. Nhắc trước hạn 7 ngày và đúng ngày hạn; quá hạn 3 ngày → cảnh báo đỏ cho quản lý; quá hạn 10 ngày → quản lý xử lý theo HĐ. App **không tự khóa cửa** khách vì nợ | HĐ 6 tháng thu 3 tháng/lần: kỳ 1 ngày 1/11, kỳ 2 ngày 1/2; nhắc 25/1, cảnh báo đỏ 4/2 | Chu kỳ thu: INV quyết ESC-005 16/10; mốc nhắc: [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.2, 5.20 |
| BR-208 | **Thu khi chốt** (ký HĐ) = ký quỹ + (tiền thuê + phí dịch vụ) × chu kỳ. Đơn giữ chỗ dài hạn chuyển "đã xác nhận" khi nhận đủ ký quỹ; kỳ đầu thu muộn nhất ngày vào ở, trước khi giao mã cửa | Ví dụ BL 5.2 (302, NN, 6 tháng): 16.700.000 + (11.130.000 + 2.083.000) × 3 = **56.339.000**. Hoa hồng của HĐ này (BR-212), CTV chốt: (7% + 1%) × 11.130.000 × 6 = **5.342.400** (đợt 1 = 2.671.200; đợt 2 = 2.671.200); nếu NV chốt: (5% + 1%) × 66.780.000 = **4.006.800** | INV quyết ESC-005 16/10 | BL 5.2, 5.5 |
| BR-209 | **Ngày kết thúc HĐ** tính theo **tháng lịch**: ngày trả phòng = ngày bắt đầu + n tháng (thay cho "× 30,4 ngày" của prototype) | Vào ở 1/11/2026, 6 tháng → trả phòng **1/5/2027** trước 12:00. Vào 31/1, 1 tháng → trả 28/2 (ngày cuối tháng) | NGÀNH | BL 5.2 |
| BR-210 | **Ngày lẻ** ngoài kỳ HĐ (ở thêm vài ngày, HĐ bắt đầu giữa tháng tính phần lẻ) tính theo giá đêm quy đổi (BR-102) × số ngày; phí dịch vụ tính theo tỷ lệ ngày | Ở thêm 5 ngày: 371.000 × 5 = **1.855.000** + phí dịch vụ 350.000 × 5/30 = 58.000 | [GIẢ ĐỊNH – chờ INV xác nhận] | DOM đề xuất |
| BR-211 | **Gia hạn HĐ**: cảnh báo "chào gia hạn" trước ngày hết hạn 30 ngày; gia hạn = HĐ mới hoặc phụ lục với giá và tham số **tại thời điểm gia hạn**; ký quỹ chuyển tiếp, bù phần chênh nếu hệ số mới cao hơn. Với khách NN kiểm thị thực còn hạn đến ngày kết thúc mới (BR-605) | Emma hết HĐ 4/12 → cảnh báo từ 4/11; thị thực hết 20/11 → cảnh báo đỏ thị thực | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 3.2, 5.20 |
| BR-212 | **Hoa hồng dài hạn**: tỷ lệ theo người chốt (NV hoặc CTV) và kỳ hạn (BR-201), +1% nếu khách NN. Cơ sở tính = tiền thuê × số tháng (**không** gồm phí dịch vụ, điện nước, ký quỹ). Tỷ lệ và người chốt lưu snapshot. Chi 2 đợt: 50% sau khi thu đủ kỳ đầu; 50% sau khi khách ở hết 50% thời hạn. Khách chấm dứt sớm trước đợt 2 → không chi đợt 2. **Lịch chi gộp** (v0.2): một đợt đủ điều kiện → bản ghi hoa hồng `earned`; ngày 1 hằng tháng gộp mọi bản ghi `earned` của tháng lịch trước thành `payable`; chi trước **ngày 10** (sau ngày chốt số liệu ngày 5 của DATA). Bản ghi bị điều chỉnh sau khi đã chi (khách được hoàn tiền) → trừ vào kỳ chi sau, không sửa bản ghi cũ (BR-008). Áp cả hoa hồng ngắn ngày (BR-903) | Daniel (CTV, 1 năm, NN): (8,3% + 1%) × 11.130.000 × 12 = **12.421.080**; đợt 1 = 6.210.540 (khớp dữ liệu "đã chi 50%"). HĐ 302 (BR-208): **5.342.400**. Đợt 1 đủ điều kiện 18/10 → `payable` 1/11 → chi trước 10/11 | Cách tính: NGÀNH; tỷ lệ và lịch chi: INV quyết ESC-005 16/10 | BL 5.2, 9 #3, 8.2 #10 |
| BR-213 | Dài hạn **không** áp phụ thu nhận sớm/trả muộn theo giá tháng. Nếu có phụ thu, cơ sở là giá đêm quy đổi (BR-102). Chính sách miễn phí cho dài hạn: xem BR-413 | – | NGÀNH | BL 8.2 #1 |
| BR-214 | **Quyết toán khi trả phòng dài hạn** (bill cuối): tiền thuê ngày lẻ chưa thu (nếu có) + điện nước kỳ cuối (chốt số ngày trả, BR-502) + minibar/dọn lẻ chưa thu + phí phạt, bồi thường (BR-511, 512) − **ký quỹ**. Kết quả dương → thu thêm; âm → hoàn khách trong **7 ngày làm việc**, quản lý duyệt hoàn (BR-522). Biên bản kiểm phòng có ảnh là bắt buộc trước khi khấu trừ | Ký quỹ 22.300.000 − điện nước kỳ cuối 650.000 − mất 1 thẻ 200.000 → hoàn **21.450.000** | Luồng: NGÀNH; thời hạn hoàn: INV quyết ESC-006 16/10 | BL 8.2 #6, 9 #9 |
| BR-215 | **Doanh thu dài hạn** trong báo cáo vận hành phân bổ **theo đêm**: tiền thuê tháng ÷ **số đêm của tháng hợp đồng** (tháng HĐ = từ ngày bắt đầu kỳ tháng đến hết ngày trước kỳ tháng kế, BR-209), nên tổng đêm-phòng luôn bằng tổng tiền HĐ. Tiền thu theo kỳ là dòng tiền, theo dõi riêng. Công thức chi tiết và cách chia sang tháng báo cáo: `metrics-definitions.md` Q-10 (DATA chốt) | HĐ bắt đầu 15/10, thuê 11.130.000: tháng HĐ 1 = 15/10–14/11 (31 đêm) → 359.032/đêm; trong tháng báo cáo 10 có 17 đêm (15–31/10) → 6.103.548 (làm tròn đồng); tháng 11 nhận 14 đêm còn lại. HĐ bắt đầu 1/11: tháng HĐ 1 = 1/11–30/11 (30 đêm) → 371.000/đêm. Doanh thu phân bổ không phụ thuộc khách đã trả cả quý từ trước | NGÀNH | BL 5.11, 8.2 #22; DATA Q-10 |

---

## 4. Giữ chỗ, đặt cọc, hủy, no-show, overbooking (BR-3xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-301 | **Trạng thái đơn** (tên chuẩn, BA dùng trong sơ đồ trạng thái): `hold` giữ chỗ chờ cọc · `confirmed` đã xác nhận · `in_house` đang ở · `checked_out` đã trả phòng · `cancelled` đã hủy · `no_show` không đến. Khóa phòng (OOO) **không phải đơn khách** mà là khối chặn tồn phòng (BR-804). `hold` khóa phòng nhưng **không** là đêm bán, không là doanh thu | Đơn hold 3 đêm không làm tăng công suất | NGÀNH | BL 4.4, 8.2 #8 |
| BR-302 | **Hạn giữ chỗ**: chọn 12 / 24 / 48 giờ (mặc định 24). Hạn thực tế = min(thời điểm tạo + số giờ, 12:00 ngày đến). Đặt cho chính ngày hôm nay → không giữ chỗ, phải thu cọc/xác nhận ngay | Tạo 20:00 15/10, đến 16/10, chọn 24h → hạn **12:00 16/10** (không phải 20:00 16/10) | Hạn 12/24/48: INV quyết ESC-006 16/10; trần 12:00: NGÀNH | BL 5.5 |
| BR-303 | **Hết hạn giữ chỗ**: nhắc sale 2 giờ trước hạn; đến hạn chưa cọc → hệ thống **tự hủy** (`cancelled`, lý do "Hết hạn giữ chỗ"), mở lại phòng trên mọi kênh, báo sale. Sale được gia hạn giữ 1 lần, tối đa +24 giờ, trước khi hết hạn; hạn mới **vẫn không vượt trần 12:00 ngày đến** (BR-302) | Hạn 10:00 16/10 → nhắc 08:00; 10:00 tự hủy; lead quay về "Đã báo giá". Giữ chỗ tạo 09:00 15/10, đến 17/10, hạn 09:00 16/10; gia hạn +24 giờ → 09:00 17/10 (trước trần 12:00 17/10: hợp lệ). Nếu đến 16/10 thì gia hạn chỉ tới **12:00 16/10** | INV quyết ESC-006 16/10 | BL 5.5, 8.2 #19, 9 #11 |
| BR-304 | **Báo giá có hiệu lực 3 ngày**, không khóa phòng. Hết hiệu lực → trạng thái "Hết hiệu lực"; muốn tạo giữ chỗ phải tính lại theo giá hiện hành (hoặc quản lý gia hạn báo giá) | BG lập 15/10 → hết hiệu lực 23:59 18/10 | INV quyết ESC-006 16/10 | BL 5.4, 8.2 #19 |
| BR-305 | **Cọc ngắn ngày** (Trực tiếp, CTV) = 30% **tiền phòng** của đơn (tổng giá các đêm sau lịch giá và giảm giá – BR-104, 107), **không gồm** phụ thu người (BR-110), phụ thu nhận sớm/trả muộn, dịch vụ; làm tròn 100.000. Phần còn lại (gồm phụ thu người) thu khi nhận phòng, trước khi giao mã cửa | Căn 202, 7 đêm 9/11–16/11 = 5.205.000 (BR-107) → cọc 1.561.500 → **1.600.000**; còn **3.605.000** thu khi nhận phòng. Có thêm 1 người lớn (Studio định mức 2): cọc vẫn 1.600.000; phụ thu 150.000 × 7 = 1.050.000 thu khi nhận phòng | INV quyết ESC-006 16/10 | BL 5.3, 5.5 |
| BR-306 | **Cọc dài hạn** = ký quỹ (BR-206); xác nhận cọc sinh HĐ với kỳ thu đầu = ngày vào ở (BR-208) | – | INV quyết ESC-006 16/10 | BL 5.5 |
| BR-307 | **Đơn OTA**: lưu "kiểu thanh toán" của từng đơn từ channel manager: OTA thu hộ (Airbnb, Agoda trả trước, Booking "Payments by Booking") hoặc khách trả tại chỗ. Không thu cọc lại với đơn OTA đã trả trước; đơn trả tại chỗ thu đủ khi nhận phòng | Airbnb 3 đêm → folio ghi "Đã thu qua OTA", còn phải thu = phát sinh | NGÀNH | BL 5.5 |
| BR-308 | **Hủy giữ chỗ chưa cọc**: không phí; **bắt buộc lý do** (danh mục: khách đổi ý, tìm được chỗ khác, giá, đổi ngày, không liên lạc được, khác + ghi chú). **Mã lý do hủy** (`cancel_reason_code`, dùng chung cho mọi luồng hủy – v0.2): `guest_cancelled` (khách tự hủy qua app/web/kênh), `guest_changed_mind`, `found_other`, `price`, `date_change`, `unreachable`, `hold_expired` (hết hạn giữ chỗ, BR-303), `ota_cancelled` (OTA báo hủy, BR-310), `overbooking_relocated` (dời khách, BR-312), `group_partial` (hủy một căn trong nhóm, BR-324), `other` (+ ghi chú) | Khách bấm hủy trên web đặt phòng → `guest_cancelled`; 10:00 hết hạn giữ chỗ → `hold_expired` | NGÀNH | BL 8.2 #23 |
| BR-309 | **Hủy đơn ngắn ngày trực tiếp/CTV đã cọc** (INV chọn ESC-006 A): hủy ≥ 7 ngày trước ngày đến → hoàn 100% cọc; 3–6 ngày → hoàn 50% cọc; < 3 ngày → không hoàn. Ngày cao điểm (BR-104) → không hoàn sau khi cọc. Thay vì hoàn, quản lý được cho **dời ngày 1 lần** trong 3 tháng, giữ nguyên cọc. Phần cọc giữ lại ghi là "phí hủy". Số ngày báo trước đếm theo **BR-011** (ngày mốc = ngày đến). "Dời ngày trong 3 tháng" = ngày đến mới không muộn hơn ngày đến cũ + `reschedule_window_months` tháng. Ngày cao điểm không hoàn = đơn có **ít nhất 1 đêm** rơi vào ngày đặc biệt (BR-104). **Bất khả kháng** (v0.3): đèo vào Đà Lạt sạt lở/đóng, sân bay Liên Khương hủy chuyến do thời tiết – có bằng chứng (thông báo của cơ quan chức năng/hãng bay) → dời ngày miễn phí trong `force_majeure_reschedule_months` (3 tháng), **không hoàn tiền mặt**, quản lý duyệt; áp cả ngày cao điểm | Đơn 3 đêm × 820.000 = 2.460.000, cọc 738.000 → **700.000**. Hủy trước 5 ngày → hoàn 350.000, phí hủy 350.000. **Biên** (đến 22/10): báo 15/10 = 7 ngày → hoàn 700.000; báo 16/10 = 6 ngày → hoàn 350.000; báo 19/10 = 3 ngày → hoàn 350.000; báo 20/10 = 2 ngày → hoàn 0. Bất khả kháng: đèo Prenn đóng ngày 21/10, có thông báo → dời đơn, ngày đến mới muộn nhất 22/1/2027, giữ nguyên cọc 700.000 | INV quyết ESC-006 16/10 | BL 8.2 #23, 9 #6; ESC-006 dòng 7 |
| BR-310 | **Hủy đơn OTA**: theo chính sách hủy của OTA trên đơn đó; app chỉ nhận trạng thái và số tiền phạt từ channel manager, không tự tính | – | NGÀNH | BL 5.21 |
| BR-311 | **No-show**: 18:00 ngày đến chưa thấy khách và không có giờ đến dự kiến → lễ tân gọi/nhắn. Đến 23:00 vẫn chưa đến và không liên lạc được → lễ tân đánh dấu `no_show` (**không tự động**, vì khách có thể đến khuya). Hệ quả: đơn trực tiếp giữ toàn bộ cọc, hủy các đêm còn lại, mở bán lại; đơn OTA báo no-show qua channel manager/extranet để không bị tính hoa hồng. Khách đã báo đến trễ → giữ phòng cả đêm, đêm vẫn tính. Mốc giờ tính trong **ngày nghiệp vụ** của ngày đến (BR-010). Nút "Đánh dấu không đến" bị khóa khi chưa ghi kết quả liên lạc. Khôi phục no-show: **BR-315** | Đơn trực tiếp 2 đêm, cọc 500.000, không đến → giữ 500.000, mở bán đêm thứ 2 | Quy trình: NGÀNH; mốc giờ: INV quyết ESC-006 16/10 | DOM đề xuất |
| BR-312 | **Overbooking và ưu tiên khi đơn OTA và đơn trực tiếp trùng căn** (viết lại v0.2). OTTIMO **không bán vượt** (0%). Trùng chỉ xảy ra do đồng bộ trễ. 7 điểm: **(1) Không bao giờ từ chối hay tự hủy đơn OTA** đã về: luôn tạo `confirmed` (có cờ xung đột nếu chưa gán được căn). Tự hủy một đơn OTA chỉ là phương án cuối, cần MGR+ duyệt. **(2) Tự gán căn** cho đơn OTA mới theo **BR-316** (chỉ trong nhóm). **(3) Ai giữ căn khi trùng thật** (cùng căn – đêm): đơn được **server ghi nhận trước** giữ căn – tính theo thời điểm ghi nhận trong app, không theo thời điểm OTA tạo đơn; đơn đến sau bị dời. **Không bao giờ dời**: khách `in_house`, khách dài hạn, VIP/khách quen, đơn Airbnb đặt đúng căn trong ảnh (dời sang căn khác cùng nhóm chỉ khi khách đồng ý). **(4) Thứ tự phương án dời**: (i) căn trống cùng nhóm, không thu thêm – lễ tân tự làm; (ii) nâng hạng miễn phí sang nhóm khác – lễ tân trưởng trở lên xác nhận; (iii) chuyển khách sang cơ sở tương đương gần đó, OTTIMO trả chênh lệch đêm đầu + xe – MGR+ duyệt. Khi buộc phải chuyển khách ra ngoài, **ưu tiên chọn khách trực tiếp/CTV** (liên lạc được, bù đắp linh hoạt, không bị OTA phạt) **nếu khách đồng ý**; không thì chuyển đơn đến sau. **(5) Thời hạn**, **(6) đồng bộ lỗi kéo dài**, **(7) ghi nhận**: theo **BR-317** | Đơn trực tiếp ghi nhận 10:02 và đơn Agoda ghi nhận 10:05 cùng vào căn 203 đêm 20/10 → đơn trực tiếp giữ 203; đơn Agoda được gán 202 (trống, cùng nhóm). Nếu nhóm hết căn: gợi ý nâng hạng sang 301 cho lễ tân trưởng xác nhận; hết hẳn → hỏi khách trực tiếp có đồng ý chuyển sang cơ sở gần đó (OTTIMO trả chênh lệch đêm đầu + xe), khách không đồng ý → chuyển khách Agoda | Quy trình: NGÀNH; chi phí bồi thường: [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.21, 8.2 #30; DOM-INT-01 |
| BR-313 | **Chấm dứt HĐ dài hạn sớm** (INV chọn ESC-006 A): khách báo trước ≥ 30 ngày → mất 50% ký quỹ; báo trước < 30 ngày → mất 100% ký quỹ. Số ngày báo trước theo BR-011 (ngày mốc = **ngày trả phòng khách báo**, không phải ngày kết thúc HĐ). Tiền thuê đã trả cho tháng **chưa bắt đầu** được hoàn; tháng đang ở không hoàn. Không truy thu phần giảm giá kỳ hạn (phương án khác ở Q6) | Daniel trả trước quý (11/2026–1/2027), báo nghỉ 1/12 với 30 ngày báo trước, nghỉ 31/12: mất 11.150.000 ký quỹ, hoàn tiền thuê tháng 1 | INV quyết ESC-006 16/10 | BL 9 #6 |
| BR-314 | **Hủy HĐ trước ngày vào ở** (đã ký quỹ, INV chọn ESC-006 A; đếm ngày theo BR-011, ngày mốc = ngày vào ở): ≥ 30 ngày trước → hoàn 50% ký quỹ; < 30 ngày → không hoàn. Kỳ đầu (nếu đã thu) hoàn 100% | Ký quỹ 16.700.000, hủy trước 40 ngày → hoàn 8.350.000 | INV quyết ESC-006 16/10 | BL 9 #6 |
| BR-315 | **Khôi phục no-show** (đưa đơn `no_show` về `confirmed` để nhận phòng). **FD/FDL (gồm người trực đêm) tự khôi phục** khi đủ 3 điều kiện: (1) còn trong **ngày nghiệp vụ** của đêm đến (trước 06:00 hôm sau, BR-010); (2) căn của đơn vẫn trống, chưa bán lại, không phải đổi căn; (3) không phát sinh hoàn tiền hay đổi giá. Bắt buộc lý do; MGR nhận thông báo; danh sách khôi phục hiện trong đóng ca (BR-526). Ngoài 3 điều kiện (căn đã bán lại, phải đổi căn, có tiền ra, đã qua ngày nghiệp vụ) → **MGR+ duyệt** qua luồng duyệt. Đơn OTA **đã báo no-show lên kênh** → luôn MGR+ và phải báo kênh hủy no-show | Đơn đến 20/10 bị đánh dấu no-show 23:10; khách đến 01:30 ngày 21/10, căn 203 vẫn trống, đã cọc đủ → lễ tân trực đêm tự khôi phục, ghi lý do "Khách đến muộn, xe trễ" và nhận phòng. Khách đến 07:00 ngày 21/10 (đã qua ngày nghiệp vụ) → cần MGR duyệt | NGÀNH | BA SQ-1; DOM-BA (B12) |
| BR-316 | **Tự gán căn cho đơn OTA** về theo nhóm căn (không theo căn): (1) **căn ánh xạ** nếu kênh đăng từng căn (Airbnb – khách đặt đúng căn trong ảnh); (2) **căn trống cùng nhóm**: ưu tiên căn `VI`/`VC` khi ngày đến là hôm nay, rồi căn **ít tạo đêm lẻ nhất** (đêm trống kẹp giữa hai đơn); (3) **không tự gán sang nhóm khác** – chỉ gợi ý để lễ tân trưởng/quản lý xác nhận (nâng hạng là quyết định có giá: có thể chặn đơn giá cao đến sau). Thứ tự nhóm "cao hơn" lấy từ `room_group.sort_order` do INV cấu hình, **không suy từ giá**. Không còn căn → đơn `confirmed` ở trạng thái xung đột "chưa gán căn", không nhận phòng được đến khi gán; xử lý theo BR-312/317. Lễ tân nhập tay đơn OTA vào căn đã kín → server trả lỗi kèm gợi ý căn trống, không tự đổi căn mà không báo | Đơn Booking nhóm Lầu 1–2 đến 20/10, đi 22/10. Căn 201 có đơn đến 22/10 → gán vào 201 không để đêm trống. Căn 202 có đơn đến 23/10 → gán vào 202 để lại **đêm 22 lẻ** khó bán. → Tự gán **201**. Lý do không suy từ giá: giá OTA nền Căn N+ (980.000) thấp hơn Căn N (1.050.000) | NGÀNH | ARC E2; DOM-INT-01 (2) |
| BR-317 | **Xử lý xung đột OTA – thời hạn, đồng bộ lỗi, ghi nhận** (tiếp BR-312). **(5) Thời hạn**: ngày đến ≤ 24 giờ → báo đỏ ngay cho lễ tân + quản lý, phải có phương án trong `conflict_resolve_minutes_urgent` (60 phút); ngày đến xa hơn → "Cần chú ý", phương án trước 12:00 hôm sau. Liên hệ khách **trước** khi khách lên đường. **(6) Đồng bộ lỗi kéo dài**: channel manager không nhận lệnh quá `channel_sync_outage_alert_minutes` (15 phút) → cảnh báo đỏ kèm checklist cho quản lý **đóng bán thủ công trên extranet** các ngày mà nhóm còn ≤ 1 căn trống; có lại kết nối → đối soát toàn bộ tồn và đơn (BR-905). **(7) Ghi nhận**: mỗi xung đột có bản ghi (nguyên nhân, đơn liên quan, phương án, người quyết, chi phí) để DATA báo cáo số vụ/tháng (mục tiêu S1 = 0) | Đơn Agoda về 09:00 cho đêm nay, trùng căn → báo đỏ, hạn phương án 10:00. Channel manager lỗi từ 14:00, 14:15 chưa hồi → cảnh báo đỏ + checklist đóng bán ngày 24/10 (nhóm N còn 1 căn) | NGÀNH | DOM-INT-01 (5–7) |

---

## 4A. Đơn nhóm / đoàn nhiều căn (BR-32x) – mới v0.2

> Đơn nhóm = một **mã nhóm** liên kết nhiều đơn căn. Mỗi đơn căn vẫn đi theo trạng thái đơn riêng (BR-301) và mọi quy tắc của đơn lẻ, trừ phần dưới đây. Áp cho đơn Trực tiếp/CTV; đơn OTA nhiều căn giữ theo OTA, chỉ gắn mã nhóm để xem chung.

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-321 | **Tạo nhóm**: từ báo giá nhiều căn hoặc gom các đơn đã có. Nhóm có **một người đặt** và **một người trả** (có thể khác nhau, ví dụ công ty trả). Kiểm trùng và tồn phòng cho **tất cả** căn trong cùng giao dịch: thiếu 1 căn thì không tạo nửa nhóm, báo căn nào hết và gợi ý căn thay | Gia đình 3 căn 201, 202, 203 đêm 31/12–2/1 → mã nhóm `NH-00012` gồm 3 đơn `OTM-`; 203 vừa bị đặt → báo "203 đã hết", gợi ý căn trống cùng nhóm Lầu 1–2 (ví dụ 101); nhóm Lầu 1–2 hết căn → gợi ý nâng hạng 301 để lễ tân trưởng xác nhận (BR-316) | NGÀNH | DOM-PO-02, DOM-BA-04 |
| BR-322 | **Cọc chung**: cọc nhóm = tổng cọc từng căn theo BR-305 (làm tròn ở cấp nhóm). Một giao dịch cọc chung được **phân bổ** về từng đơn căn theo tỷ lệ tiền phòng (phần lẻ làm tròn dồn vào căn cuối). Hạn giữ chỗ nhóm là một hạn chung (BR-302); hết hạn chưa cọc → hủy cả nhóm | 3 căn: 2.400.000 + 2.400.000 + 3.000.000 = 7.800.000 → cọc 30% = 2.340.000 → **2.300.000**; phân bổ 707.692 → 708.000; 708.000; còn lại 884.000 | Cách làm: NGÀNH; % cọc: INV quyết ESC-006 16/10 | DOM-PO-02 |
| BR-323 | **Danh sách khách từng căn**: người đặt gửi tên khách theo căn trước `group_rooming_list_days` ngày (mặc định 3) trước ngày đến; quá hạn → nhắc sale. Giấy tờ từng người vẫn bắt buộc trước hạn khai báo (BR-601…603) | Đến 31/12 → hạn danh sách 28/12 | INV quyết ESC-006 16/10 | DOM-PO-02 |
| BR-324 | **Hủy một phần**: hủy từng căn tính theo BR-309 **trên phần cọc đã phân bổ cho căn đó**, ngày mốc = ngày đến của căn đó (BR-011). Hủy cả nhóm = hủy từng căn. Nhóm còn lại < `group_min_rooms` (mặc định 2) vẫn giữ mã nhóm | Hủy căn 202 trước 5 ngày: cọc phân bổ 708.000 → hoàn 50% = 354.000; phí hủy 354.000; 201 và 203 không đổi | INV quyết ESC-006 16/10 (theo BR-309) | DOM-PO-02 |
| BR-325 | **Bill nhóm**: mặc định **bill gộp** cho người trả (mỗi căn là một nhóm dòng trên bill); được **tách** theo căn hoặc theo khách khi trả phòng (phát sinh riêng như minibar có thể để từng khách tự trả). Trả phòng từng căn vẫn theo BR-426; bill gộp chỉ chốt khi căn cuối trả phòng hoặc người trả yêu cầu. Mỗi bill (gộp hoặc tách) một số `F` (BR-007) | Bill gộp `F26-000140`: tiền phòng 3 căn + phụ thu; minibar căn 202 tách cho khách 202 tự trả → bill `F26-000141` | NGÀNH | DOM-PO-02 |
| BR-326 | **Hoa hồng nhóm**: tính trên tổng tiền phòng của nhóm, **một** bản ghi hoa hồng cho người chốt (không tách theo căn); căn hủy không tính (BR-903). **Giảm theo thời gian ở** (BR-107) xét theo **từng căn**, không cộng số đêm các căn | CTV chốt nhóm 3 căn 7.800.000 → 8% = **624.000** (một dòng). 3 căn × 2 đêm không được giảm 7 đêm | Cách tính: NGÀNH; tỷ lệ: INV quyết ESC-005 16/10 | DOM-PO-02 |

---

## 5. Nhận/trả phòng, nhận sớm/trả muộn, gia hạn, đổi phòng (BR-4xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-401 | **Giờ chuẩn**: nhận phòng 14:00, trả phòng 12:00 | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.6; Brief 4 |
| BR-402 | **Điều kiện nhận phòng**: (1) buồng VI hoặc VC (khác → cảnh báo; **ngoại lệ**: lễ tân trưởng trở lên được nhận tiếp khi buồng VD/CL, ghi lý do, căn chuyển OD và tạo việc dọn **ưu tiên**; buồng OOO thì không bao giờ; ngoại lệ này **không** áp cho đổi phòng khách đang ở – BR-424, BR-803); (2) đã thu đủ tiền phòng còn lại (đơn trực tiếp/CTV) hoặc đơn OTA đã trả trước/đảm bảo; (3) có giấy tờ của **người đứng tên** trước khi giao mã cửa; người đi cùng bổ sung trước hạn khai báo (BR-602, 603) | – | NGÀNH | BL 3.6 |
| BR-403 | **Mã cửa / thẻ**: mã có hiệu lực từ giờ nhận đến giờ trả (gồm giờ trả muộn đã duyệt); hủy ngay khi trả phòng hoặc đổi phòng. Mã mặc định **6 chữ số ngẫu nhiên**. Mã theo ngày sinh (yêu cầu INV) chỉ khi khách muốn, dạng **ddmm + 3 số ngẫu nhiên** (7 số), **giữ 3 số kể cả khi khóa có giới hạn thử sai** (v0.3). Mã đúng ngày sinh không thêm số: không chấp nhận. Mỗi khách nhận tối đa 2 thẻ (1 chính + 1 dự phòng, BR-511). **Khóa của OTTIMO: TTLock** (INV cho biết 16/10) – INT kiểm khả năng tạo/hủy mã tự động qua gateway, việc tự khóa khi nhập sai và hoạt động khi mất điện (BR-964); đến khi INT xác nhận, lễ tân nhập mã tay vào app | Ngày sinh 12/03 → mã gợi ý `1203` + `472` = **1203472** | Hiệu lực: NGÀNH; dạng mã: INV quyết ESC-011 16/10; hãng khóa: INV cung cấp 16/10 | Brief 7 #3, 5; ESC-011 |
| BR-404 | **Danh sách hôm nay** ("hôm nay" = **ngày nghiệp vụ**, BR-010): "Khách đến" = đơn `confirmed` có ngày đến = hôm nay; "Khách đi" = đơn `in_house` có ngày đi = hôm nay; đơn `hold` ngày đến hôm nay hiện ở mục riêng "Giữ chỗ chưa cọc"; đơn `cancelled`, `no_show` không hiện | – | NGÀNH | BL 8.2 #7 |
| BR-411 | **Nhận sớm** (% trên giá đêm của **đêm đầu** trong đơn ngắn ngày; đơn OTA xem cơ sở ở BR-415): từ 14:00 → 0%; 10:00–13:59 → 30%; 06:00–09:59 → 50%. **Trước 06:00 không phải phụ thu**: đó là bán thêm đêm hôm trước (BR-003) – xử lý theo **BR-417**, ghi là đêm bán và doanh thu phòng (BR-904), không ghi dòng phụ thu | Giá đơn 700.000: nhận 11:00 → **210.000**; 08:00 → **350.000**; 05:30 → không có phụ thu, thêm đêm hôm trước theo BR-417 (đơn trực tiếp: +1 đêm 700.000 nếu căn trống) | INV quyết ESC-007 16/10 | BL 5.6 |
| BR-412 | **Trả muộn** (% trên giá đêm của **đêm cuối**; đơn OTA xem BR-415). **Ân hạn đến 12:30** (`late_grace_until`, gồm 12:30, tính theo phút) **chỉ khi căn không có khách đến cùng ngày** (`late_grace_requires_no_same_day_arrival`: không có đơn `confirmed`/`hold` gán vào căn đó có ngày đến = ngày trả phòng, xét lúc trả phòng) → 0%. Hết ân hạn, hoặc căn có khách đến cùng ngày → tính bậc như không có ân hạn: (12:00, 15:00] → 30%; (15:00, 18:00] → 50% (ân hạn **không dời** mốc bậc). **Sau 18:00 không phải phụ thu**: là ở thêm 1 đêm → xử lý như **gia hạn** (BR-416, BR-421), không ghi dòng phụ thu | Giá 700.000, căn **không** có khách đến: trả 12:20 → **0 đ**; 12:30 → **0 đ**; 12:31 → **210.000**; 15:00 → **210.000**; 17:00 → **350.000**; 19:00 → gia hạn 1 đêm 700.000 (BR-421). Căn **có** khách đến 14:00: trả 12:01 hoặc 12:20 → **210.000** | INV quyết ESC-007 16/10 | BL 5.6, 8.2 #4, 9 #7; ESC-007 dòng 1 |
| BR-413 | **Khách dài hạn** nhận sớm ngày đầu / trả muộn ngày cuối: cơ sở = giá đêm quy đổi (BR-102). Miễn phí đến 15:00 nếu căn không có khách đến cùng ngày (INV chọn ESC-007 A) | Thuê 11.130.000 → 371.000/đêm; trả muộn 15:00 nếu phải thu: 30% = **111.000** (không phải 3.339.000 như prototype) | Cơ sở tính: NGÀNH; miễn phí đến 15:00: INV quyết ESC-007 16/10 | BL 8.2 #1, 9 #7 |
| BR-414 | **Phụ thu không tự áp**: ô giờ nhận/trả trong form mặc định = **giờ chuẩn** (14:00 / 12:00), không phải giờ hiện tại. Hệ thống chỉ đề xuất phụ thu khi lễ tân nhập giờ thực tế sớm/muộn; lễ tân xác nhận trước khi ghi folio | Mở form lúc 11:05 → giờ nhận hiển thị 14:00, phụ thu 0 cho đến khi lễ tân đổi giờ | NGÀNH | BL 8.2 #2 |
| BR-415 | **Khách OTA**: tiền phòng theo OTA; phụ thu nhận sớm/trả muộn, dọn lẻ, phạt theo chính sách OTTIMO, thu trực tiếp. Điều kiện: chính sách đã đăng trong mục nội quy/house rules trên OTA. **Cơ sở phụ thu nhận sớm/trả muộn của đơn OTA** (v0.2) = **giá kênh Trực tiếp hiện hành** của đêm đó (cùng nguồn giá với gia hạn đơn OTA, BR-421), không dùng giá OTA trên đơn (đã gồm phí kênh, khách không thấy rõ) | Ji-woo, Booking.com, căn 203, giá OTA 820.000/đêm; đêm đầu là thứ Ba (không phải cuối tuần/ngày đặc biệt) nên giá trực tiếp = giá niêm yết 792.000. Nhận 11:00 → 30% × 792.000 = 237.600 → **238.000** (không phải 30% × 820.000 = 246.000) | Cách tính: NGÀNH; cơ sở và mức phí: INV quyết ESC-007 16/10 (O-A) | BL 9 #7; PO-DOM-03 |
| BR-416 | **Giới hạn trả muộn**: không chấp nhận trả muộn nếu căn có khách đến cùng ngày và không còn căn thay thế cùng nhóm, trừ quản lý duyệt. Trả muộn **sau 18:00** = thêm 1 đêm → xử lý như **gia hạn** (BR-421) để đêm được khóa trên kênh và tính vào công suất | Khách xin trả 19:00, căn có khách 14:00 → chặn; đề xuất gửi hành lý | NGÀNH | BL 3.10 |
| BR-417 | **Nhận phòng trước 06:00** (thêm đêm hôm trước, BR-003, BR-411). (1) Kiểm căn **còn trống đêm hôm trước** ở server (BR-906); căn có khách đêm đó (dù khách trả hôm nay) hoặc có khối OOO → không cho nhận sớm, gợi ý gửi hành lý / chờ ở sảnh / căn khác cùng nhóm đang trống. (2) Đơn **Trực tiếp/CTV**: thêm 1 đêm vào đầu đơn, giá = giá đêm của đơn (trừ đêm ngày đặc biệt lấy giá ngày đó, như BR-421). (3) Đơn **OTA**: không sửa đơn OTA; tạo **đơn con kênh Trực tiếp** cho đêm đó liên kết đơn gốc (như BR-422), giá = giá kênh Trực tiếp hiện hành của đêm đó; đơn con vào thẳng `in_house` cùng lúc nhận phòng. (4) Đêm thêm là **đêm bán**, doanh thu phòng (BR-904), có khai báo lưu trú theo giờ đến thực tế. (5) Lễ tân xác nhận số tiền trước khi ghi folio (BR-414) | Đơn Agoda căn 302 đến 20/10; khách xe giường nằm tới 04:40 ngày 20/10; đêm 19/10 (thứ Hai) căn 302 trống → tạo đơn con Trực tiếp đêm 19/10 giá trực tiếp hiện hành (giá niêm yết 302 = 11.000.000 ÷ 12 → **917.000**), đơn con `in_house` 04:40. Nếu 302 có khách đêm 19/10 trả hôm nay → không nhận, gợi ý gửi hành lý | NGÀNH; giá đêm thêm: [GIẢ ĐỊNH – chờ INV xác nhận] | DOM-PO-03, DOM-PO-12, DATA |
| BR-421 | **Gia hạn ngắn ngày**: tối đa 7 đêm qua luồng gia hạn nhanh; muốn ở thêm > 7 đêm hoặc tổng ≥ 28 đêm → báo giá dài hạn (BR-108). Kiểm trùng ở server. **Giá**: đơn Trực tiếp/CTV giữ **giá đêm của đơn**, trừ đêm rơi vào ngày đặc biệt (BR-104) thì lấy giá ngày đó; đơn OTA lấy **giá kênh Trực tiếp hiện hành** của đêm đó. Lễ tân sửa được trong khoảng sàn–trần (BR-105) | Đơn trực tiếp 201 giá 700.000 thêm 2 đêm → **1.400.000**. Đơn Booking căn 401 giá 990.000 ở thêm 1 đêm thứ Tư → giá trực tiếp **1.042.000**; nếu đêm thêm là thứ Bảy → 1.042.000 × 1,15 = 1.198.300 → **1.198.000** (BR-104) | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.8, 8.2 #13 |
| BR-422 | **Gia hạn đơn OTA**: không sửa đơn trên OTA; phần gia hạn là **đơn con kênh Trực tiếp** liên kết đơn gốc (báo cáo kênh đúng, folio chung). Thông báo "tiết kiệm phí kênh" lấy tỷ lệ từ cấu hình kênh (BR-901), không viết cứng | Đơn Airbnb gia hạn 2 đêm × 1.042.000 → thông báo "tiết kiệm 15,5% phí kênh ≈ 323.000" | NGÀNH | BL 5.8, 8.2 #12 |
| BR-423 | **Thu tiền gia hạn**: thu ngay khi khách xác nhận, muộn nhất 14:00 ngày đầu của phần gia hạn | – | [GIẢ ĐỊNH – chờ INV xác nhận] | DOM đề xuất |
| BR-424 | **Đổi phòng** khi đang ở: bắt buộc lý do. Căn mới phải `VI`/`VC` (không dùng ngoại lệ BR-402 (1)). Do lỗi OTTIMO (sự cố) → giữ giá cũ, được nâng hạng miễn phí. Do khách yêu cầu → giá căn mới tính từ đêm đổi. Căn cũ → VD/OD + tạo việc dọn; hủy mã cửa cũ, cấp mã mới; khai báo lưu trú không phải khai lại (cùng cơ sở), chỉ đổi số căn nội bộ | Mất nước nóng căn 203 → chuyển sang 301 (Căn N), giữ giá 820.000 | NGÀNH | Brief 5, DOM đề xuất |
| BR-425 | **Nhắc trả phòng tự động** (ngắn ngày): 20:00 hôm trước (Zalo/app, hỏi ở thêm kèm giá nếu căn trống); 09:00 ngày trả (lần 2, nút Trả đúng giờ / Ở thêm / Trả muộn); 11:00 chưa trả lời → báo lễ tân gọi; 12:00 quá giờ → báo đỏ lễ tân + quản lý nếu căn có khách đến hôm nay (lên đầu danh sách); căn không có khách đến → báo lúc 12:31, sau ân hạn (BR-412). Dài hạn: nhắc trước 7 ngày và 1 ngày | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.9 |
| BR-426 | **Trả phòng 3 bước** (minibar → phụ phí → bill). Khuyến nghị buồng phòng kiểm minibar/hư hỏng ngay khi khách báo trả (qua app nhân viên) để lễ tân không giữ khách quá 5 phút. Không hoàn tất trả phòng khi "còn phải thu" > 0 mà chưa ghi giao dịch thanh toán, trừ quản lý ghi công nợ có hạn (BR-525) | – | NGÀNH | BL 3.7 |
| BR-427 | **Trả phòng khi không có người ở quầy** (trả phòng nhanh – sáng sớm/đêm), viết lại v0.2: **(a) Điều kiện**: nút "Trả phòng" trên app khách chỉ bật khi **còn phải thu = 0** tại thời điểm bấm (đơn OTA đã trả trước, hoặc khách đã trả đủ qua link); còn nợ → app hiện link thanh toán trước. **(b) Hệ quả khi bấm**: đơn `checked_out`, mã cửa hủy, buồng → VD, folio `settled` và cấp số bill (BR-007), bill tạm gửi email/Zalo. **(c) Phát sinh sau trả phòng** (minibar, hư hỏng, mất thẻ phát hiện khi buồng phòng kiểm): ghi thành **dòng "phát sinh sau trả phòng"** trên chính folio `settled` (không sửa dòng cũ, BR-008), do lễ tân trở lên ghi trong `post_checkout_charge_hours` (24 giờ) kể từ lúc trả phòng, kèm ảnh bằng chứng; gửi khách link thanh toán. **(d) Khách không trả** khoản phát sinh hết `post_checkout_charge_hours` → tự chuyển **công nợ** (BR-525) và báo quản lý; quản lý được FOC theo BR-433. **(e) Hóa đơn điện tử** (BR-524) xuất khi folio `closed` = hết hạn phát sinh hoặc lễ tân xác nhận "không có phát sinh", không xuất lúc khách bấm. Link app khách sống tối đa hết thời hạn này (ân hạn 24 giờ, phạm vi thu hẹp – SEC) | Khách đơn Booking (trả trước) bay chuyến 06:00, bấm trả phòng 04:00 → `checked_out`. 09:00 buồng phòng thấy thiếu 2 lon bia → lễ tân ghi phát sinh 70.000, gửi link. 04:00 hôm sau khách chưa trả → công nợ 70.000, báo quản lý. Không có phát sinh → lễ tân xác nhận 09:30, folio `closed`, xuất hóa đơn | NGÀNH; 24 giờ: INV quyết ESC-007 16/10 (F-A) | DOM đề xuất; BA-DOM-05 |
| BR-428 | **Trả phòng sớm** (trước ngày đi): đơn trực tiếp báo trước **≥ 1 ngày** (đếm theo BR-011, ngày mốc = **ngày rời đi mới**) → hoàn 50% tiền các đêm chưa ở; báo cùng ngày rời đi (0 ngày) → không hoàn. Đơn OTA theo OTA. Mở bán lại ngay các đêm còn lại | Đơn 4 đêm 20–24/10 × 700.000. Báo 21/10 xin rời 22/10 (1 ngày) → bỏ đêm 22, 23 → hoàn 50% × 1.400.000 = **700.000**. Báo 22/10 lúc 08:00, rời 22/10 (0 ngày) → không hoàn. Báo 01:00 sáng 22/10 (ngày nghiệp vụ 21/10), rời 22/10 → 1 ngày → hoàn **700.000** | INV quyết ESC-006 16/10 | DOM đề xuất |

---

## 6. FOC (miễn phí) và giảm giá ngoài chính sách (BR-43x)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-431 | **Phạm vi FOC**: miễn khoản **phát sinh** (phụ thu nhận sớm/trả muộn, minibar, dọn lẻ, phạt, bồi thường, đêm bù do sự cố). Giảm tiền phòng ngoài chính sách gọi là "giảm giá đặc biệt", đi qua cùng cơ chế duyệt | – | NGÀNH | BL 5.7 |
| BR-432 | Bắt buộc **lý do** (Khách quen/VIP · Phòng sẵn sàng, không ảnh hưởng khách sau · Bù sự cố · Khách dài hạn · Khác + ghi chú) và **người duyệt là tài khoản thật có quyền**, xác nhận bằng mật khẩu/PIN của chính người duyệt. **Người gửi không chọn tên người duyệt**: hệ thống tự định tuyến yêu cầu tới **mọi** tài khoản có quyền duyệt giá trị đó (BR-433), **gồm cả chủ đầu tư** (hạn mức không giới hạn): tất cả thấy yêu cầu trong hàng chờ "Chờ duyệt", ai xác nhận trước thì yêu cầu đóng. **Thông báo đẩy** (v0.3) chỉ gửi cho vai thấp nhất đủ hạn mức và quản lý; chủ đầu tư nhận thông báo đẩy khi giá trị vượt hạn mức quản lý hoặc cơ sở không có tài khoản quản lý đang hoạt động (tránh làm phiền chủ đầu tư với khoản nhỏ). **Không ai duyệt yêu cầu của chính mình, trừ khi giá trị nằm trong hạn mức tự áp của vai mình** (lễ tân: FOC minibar theo BR-436; quản lý, chủ đầu tư: theo BR-433) | Lễ tân Hạnh gửi FOC trả muộn 210.000 kèm lý do "Khách quen" → yêu cầu vào hàng chờ của mọi tài khoản lễ tân trưởng, quản lý, chủ đầu tư; thông báo đẩy tới lễ tân trưởng và quản lý; anh Hoàng Anh (lễ tân trưởng) mở và xác nhận bằng PIN của mình; tới lúc đó folio để "chờ duyệt". Form **không** có ô chọn người duyệt | NGÀNH | BL 5.7, 8.2 #24; BA-DOM-02 |
| BR-433 | **Hạn mức duyệt** (INV chọn ESC-007 A): Lễ tân: chỉ **tự miễn** FOC minibar ≤ 100.000/lần và ≤ 500.000/người/tháng (BR-436), không duyệt cho người khác. Lễ tân trưởng: ≤ 300.000/lần và ≤ 1.500.000/tháng (duyệt cho người khác; FOC của chính mình ngoài phần minibar BR-436 → quản lý duyệt). Quản lý: ≤ giá 1 đêm phòng/lần, không giới hạn tháng. Chủ đầu tư: không giới hạn. Vượt hạn mức → chuyển duyệt lên cấp trên qua thông báo | Trả muộn 15:00 phí 210.000: lễ tân trưởng duyệt được. Trả muộn 17:00 căn 401 (đêm cuối thứ Tư, 1.042.000): 50% = **521.000** > 300.000 → cần quản lý (≤ giá 1 đêm 1.042.000). Miễn tiền đêm thêm khi nhận trước 06:00 (BR-417) **không phải FOC phụ thu** mà là "giảm giá đặc biệt" trên tiền phòng (BR-431), cùng cơ chế duyệt | INV quyết ESC-007 16/10 | BL 9 #8 |
| BR-434 | Bill ghi **dòng phát sinh + dòng FOC âm** để triệt tiêu (giữ dấu vết giá trị đã miễn). Mọi FOC vào báo cáo FOC tháng (giá trị, số lần, lý do, người duyệt) | Trả muộn 210.000 + "Miễn phí (FOC) · Khách quen" −210.000 | NGÀNH | BL 5.7 |
| BR-435 | **Cảnh báo thất thoát**: tổng FOC tháng > 3% doanh thu phòng tháng, hoặc một người duyệt > 10 lần/tháng → cảnh báo chủ đầu tư | Doanh thu phòng 186,4 tr → ngưỡng 5,59 tr | INV quyết ESC-007 16/10 | DOM đề xuất |
| BR-436 | **Lễ tân tự miễn FOC minibar trong hạn mức** (ngoại lệ hẹp của BR-432, "hạn mức xử lý tại chỗ"): (1) chỉ loại FOC **minibar** (BR-704); (2) ≤ `foc_self_apply.front_desk.per_time` (100.000/lần) **và** tổng tự miễn trong tháng lịch của chính người đó ≤ `foc_self_apply.front_desk.per_month` (500.000/người/tháng); (3) xác nhận bằng PIN của chính mình, lý do bắt buộc; dòng FOC ghi "tự áp trong hạn mức"; (4) vào báo cáo FOC, cảnh báo BR-435 và danh sách đóng ca (BR-526) để lễ tân trưởng xem lại. Vượt hạn mức lần hoặc tháng → yêu cầu chuyển "chờ duyệt" lên lễ tân trưởng (BR-432). Lễ tân trưởng thừa hưởng đúng phần này, không hơn | Khách tranh cãi 1 lon bia 35.000 lúc 11:30 → lễ tân Hạnh tự miễn ngay, tổng tháng 420.000 → 455.000. Lần sau 60.000 → 515.000 > 500.000 → chuyển lễ tân trưởng duyệt | Cơ chế: NGÀNH; hạn mức: INV quyết ESC-007 16/10 (H-A) | BA SQ-3; DOM-PO-01 |

---

## 7. Điện nước, dịch vụ, phí phạt, thanh toán, hóa đơn (BR-5xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-501 | **Đơn giá điện nước cố định**: điện 3.500 đ/kWh, nước 25.000 đ/m³. *Lưu ý pháp lý*: Bộ Công Thương có quy định về giá điện bán cho người thuê nhà; OTTIMO là cơ sở lưu trú nên có thể thuộc trường hợp khác – **cần kế toán/luật sư xác nhận** trước khi in đơn giá trên HĐ | Daniel tháng 10: 142 kWh × 3.500 = 497.000; 8 m³ × 25.000 = 200.000 → **697.000** | INV quyết ESC-008 16/10 (đơn giá cố định) + PHÁP LÝ – kế toán/luật sư xác nhận trước khi in lên HĐ mới | BL 5.10, 9 #10; Brief 4 |
| BR-502 | **Chốt công tơ**: hằng tháng vào ngày cuối tháng (cho phép ±2 ngày); **ảnh công tơ bắt buộc**, ghi người chốt. Chỉ số đầu ghi lúc nhận phòng; chỉ số cuối ghi lúc trả phòng. Lưu lịch sử từng kỳ | Kỳ 1–31/10 chốt 31/10 (từ 29/10 đến 2/11) | NGÀNH | BL 5.10 |
| BR-503 | **Kiểm tra chỉ số**: mới < cũ → chặn lưu, phải chọn lý do "Thay công tơ / quay vòng" và quản lý duyệt. Tiêu thụ > 2 lần trung bình 3 kỳ trước (hoặc > 300 kWh / > 10 m³ khi chưa có lịch sử) → cảnh báo kiểm tra trước khi gửi khách | Kỳ trước 140, 150, 145 kWh; kỳ này 320 kWh → cảnh báo | NGÀNH; ngưỡng: [GIẢ ĐỊNH – chờ INV xác nhận] | BL 8.2 #21 |
| BR-504 | Chốt xong → sinh **hóa đơn điện nước tháng**, hiện trong app khách, hạn thanh toán 5 ngày. Kiểm tra hợp lý: Brief ghi thực tế khách tháng ~1,2–2 tr/tháng | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.10; Brief 5 |
| BR-505 | **Internet, rác, gửi xe**: đã gồm trong tiền thuê/phí dịch vụ, không thu riêng | – | INV quyết ESC-008 16/10 | BL 9 #10 |
| BR-506 | **Dọn phòng lẻ theo yêu cầu** (ngoài gói/lịch dọn): 100.000/lần, gồm lau dọn, thay ga gối, vệ sinh nhà tắm, bếp. Khách đặt qua app → tạo việc buồng phòng → ghi folio khi xong | Khách dài hạn gọi 3 lần dọn lẻ trong tháng → **300.000** cộng vào hóa đơn tháng | INV quyết ESC-005 16/10 | Brief 5 |
| BR-507 | **Giặt ủi**: bảng giá cấu hình (theo kg hoặc theo món); INV cung cấp. Tạm 30.000/kg | 2,5 kg → **75.000** | [GIẢ ĐỊNH – chờ INV xác nhận] – chờ INV gửi bảng giá giặt ủi (ESC-008) | BL 9 #12 |
| BR-511 | **Phí phạt** (thực tế Brief 5): (a) hút thuốc trong phòng → **khử mùi 500.000/lần** (được hút ở ban công); (b) **mất/hỏng thẻ phòng 200.000/thẻ**; mỗi khách được cấp 2 thẻ (1 chính + 1 dự phòng), trả đủ 2 thẻ khi đi → 0 đ. Điều kiện để thu: nội quy đã gửi khách (VI/EN/RU) khi nhận phòng và có trong mô tả trên OTA; có bằng chứng (ảnh/ghi chú của buồng phòng). Ghi folio dòng "Phí phạt" (không phải doanh thu phòng); dài hạn khấu trừ khi quyết toán (BR-214); được FOC theo BR-433 | Khách trả 1/2 thẻ → **200.000**; phát hiện mùi thuốc lá + mất 1 thẻ → **700.000** | [GIẢ ĐỊNH – chờ INV xác nhận] | Brief 5 |
| BR-512 | **Hư hỏng, mất đồ**: theo bảng giá đền bù do INV cung cấp (khăn, ga, ly, remote…); món ngoài bảng → quản lý định giá; ảnh bằng chứng bắt buộc | Tạm: khăn tắm 150.000, ly 50.000, remote 200.000 | [GIẢ ĐỊNH – chờ INV xác nhận] – chờ INV gửi bảng giá đền bù (ESC-008) | BL 3.7 |
| BR-513 | **Đồ khách để quên**: ghi sổ (ảnh, căn, ngày, người nhặt), báo khách trong 24 giờ, lưu giữ 30 ngày; giấy tờ tùy thân, tiền, đồ giá trị bàn giao quản lý cất giữ có biên bản | – | Quy trình: NGÀNH; thời hạn: [GIẢ ĐỊNH – chờ INV xác nhận] | Brief 5 |
| BR-521 | **Phương thức thanh toán**: VietQR (nội dung chuyển khoản = mã bill), VNPay/MoMo (link), thẻ qua cổng (**không lưu số thẻ**), tiền mặt, "đã thu qua OTA". Mỗi khoản thu là một giao dịch có mã, gắn folio; một folio có nhiều giao dịch (trả nhiều lần, nhiều cách). **Tài khoản nhận VietQR** (v0.3): INV cho biết hiện là **tài khoản cá nhân** tại Techcombank – số tài khoản chỉ cấu hình trong app (`payment_receiving_account`), **không ghi vào tài liệu**. OTTIMO là doanh nghiệp (BR-524) → nhận tiền phòng vào tài khoản cá nhân có rủi ro kế toán/thuế (doanh thu không qua tài khoản công ty, khó đối chiếu với hóa đơn GTGT) – câu hỏi cho kế toán ở ESC-008; DOM khuyến nghị chuyển sang tài khoản công ty trước khi vận hành thật. App lưu loại chủ tài khoản (`payment_receiving_account.owner_type`) và hiện cảnh báo cho chủ đầu tư khi là cá nhân | Bill 3.491.000: chuyển khoản 3.000.000 + tiền mặt 491.000 | NGÀNH; tài khoản nhận cá nhân: PHÁP LÝ – cần kế toán xác nhận (ESC-008) | BL 5.20 |
| BR-522 | **Hoàn tiền** (cọc, ký quỹ, trả sớm): quản lý duyệt; hoàn qua cùng phương thức hoặc chuyển khoản; ghi giao dịch âm có lý do | – | NGÀNH | BL 8.2 #6 |
| BR-523 | **VAT**: giá niêm yết **đã gồm VAT** (INV chọn ESC-008 A). Khi xuất hóa đơn tách: giá trước thuế = giá gồm thuế ÷ (1 + thuế suất). Thuế suất là tham số **có ngày hiệu lực** (`vat_rate` theo khoảng ngày): mức 8% theo hiểu biết của DOM là mức giảm có thời hạn, có thể hết hiệu lực sau 31/12/2026 – kế toán xác nhận; bill tách VAT theo thuế suất hiệu lực tại **ngày xuất hóa đơn**; tạm 8%. Ký quỹ không xuất hóa đơn (không phải doanh thu) cho đến khi bị khấu trừ. Cách xử lý thuế với phí phạt/bồi thường: kế toán xác nhận | 1.080.000 gồm VAT 8% → 1.000.000 + VAT 80.000 | Giá gồm VAT: INV quyết ESC-008 16/10; thuế suất, thời hạn, phí phạt: PHÁP LÝ – cần xác nhận (kế toán) | BL 5.20, 8.2 #25, 9 #16 |
| BR-524 | **Thời điểm xuất hóa đơn điện tử** (MISA meInvoice): ngắn ngày khi hoàn tất trả phòng; dài hạn mỗi kỳ thu; điện nước mỗi tháng. Diện hóa đơn khởi tạo từ máy tính tiền (BL ghi doanh thu > 1 tỷ/năm) – kế toán xác nhận. Phát hành theo **sự kiện nghiệp vụ** này, **không** theo từng giao dịch thu (cọc ngắn ngày không xuất hóa đơn khi nhận cọc). Trả phòng nhanh: xuất khi folio `closed` (BR-427). **Loại hình kinh doanh** (v0.3, INV cho biết 16/10): **doanh nghiệp – Công ty Cổ phần UTMG Living** → phát hành **hóa đơn GTGT** của công ty; `business_entity_type` = `enterprise`; mã số thuế và thông tin người bán INV/kế toán nhập khi cấu hình MISA; `invoice_trigger` theo sự kiện nghiệp vụ | Đơn 3 đêm cọc 700.000 ngày 15/10, trả phòng 22/10 thanh toán phần còn lại → **một** hóa đơn ngày 22/10 cho toàn bộ tiền phòng | Loại hình: INV cung cấp 16/10 (ESC-008); thời điểm phát hành, diện máy tính tiền: PHÁP LÝ – cần xác nhận (kế toán) | BL 5.20; Brief 7 #3 |
| BR-525 | **Công nợ** (công ty, CTV thanh toán sau): sau MVP. Trong MVP chỉ quản lý được ghi "công nợ" khi trả phòng, có hạn thanh toán và cảnh báo quá hạn; ngoại lệ tự động: phát sinh sau trả phòng chưa thu (BR-427 d) | – | [GIẢ ĐỊNH – chờ INV xác nhận] | DOM đề xuất |
| BR-526 | **Đóng ca / chốt ngày** (kiểm soát tiền, không phải chấm công): cuối mỗi ca, người trực (a) xem tổng thu của ca theo cách thanh toán; (b) nhập **tiền mặt đếm thực tế**; chênh lệch ≠ 0 phải ghi lý do và gửi quản lý; (c) xem danh sách **chuyển khoản ghi tay "chờ đối soát"** (BR-527); (d) bàn giao việc tồn cho ca sau: khai báo chưa `sent`, khách đến chưa tới (no-show sắp tới mốc), yêu cầu khách đang mở, phiếu sửa mức Cao, đơn khôi phục no-show (BR-315), FOC tự miễn (BR-436), đối chiếu buồng – đơn (BR-806). Ca được đóng bởi người trực, xác nhận PIN; ca sau nhận bàn giao bằng PIN. Ca đã đóng không sửa giao dịch, chỉ ghi điều chỉnh (BR-008). Chốt ngày theo ngày nghiệp vụ (BR-010) | Ca 14:00–22:00: hệ thống tiền mặt 3.491.000, đếm thực tế 3.441.000 → chênh −50.000, lý do "thối nhầm khách 203", gửi quản lý. 2 chuyển khoản ghi tay 3.000.000 và 1.500.000 chờ đối soát | NGÀNH | DOM-PO-06, DOM-BA-03 |
| BR-527 | **Chuyển khoản ghi tay và cách thu không nhận**: khi chưa có webhook xác nhận tiền về (I2b – R3), lễ tân ghi "đã nhận chuyển khoản" kèm ảnh/mã giao dịch; giao dịch mang cờ **`chờ đối soát`** cho đến khi quản lý trở lên tick sau khi xem sao kê (lưu người tick, giờ tick), hoặc webhook xác nhận. Quá `bank_reconcile_alert_days` (2 ngày) chưa đối soát → "Cần chú ý". Đối soát thấy không có tiền → báo quản lý, folio trở lại còn phải thu. **Không nhận tiền mã hóa** (không phải phương tiện thanh toán hợp pháp tại VN – cần xác nhận). Khách không cọc online được (ví dụ thẻ do ngân hàng Nga phát hành không dùng được ở nước ngoài) → nhận đơn **không cọc**, thu đủ bằng tiền mặt/chuyển khoản nội địa khi đến, **quản lý duyệt từng đơn** (INV chọn ESC-006 A). Giữ ngắn: chỉ nhận khi ngày đến cách lúc đặt ≤ `no_deposit_max_lead_days` (2 ngày); đơn `confirmed` mang cờ "Không cọc – thu khi đến"; đến `no_deposit_hold_until` (18:00 ngày đến) chưa thấy khách → lễ tân gọi; không liên lạc được → hủy (`unreachable`), mở bán, không phí | Khách đưa ảnh chuyển khoản 3.000.000 lúc 15:00 → giao dịch "chờ đối soát"; 9:00 hôm sau quản lý xem sao kê, thấy tiền → tick. Không thấy tiền → folio 203 còn phải thu 3.000.000, báo quản lý | Cách làm: NGÀNH; tiền mã hóa: PHÁP LÝ – cần xác nhận (ESC-001); khách không cọc online: INV quyết ESC-006 16/10 (mốc 2 ngày, 18:00: DOM đề xuất) | DOM-PO-06, DOM-PO-10 |

---

## 8. Khai báo lưu trú, giấy tờ, dữ liệu cá nhân (BR-6xx)

> Toàn bộ nhóm này liên quan pháp luật. DOM ghi nguồn theo hiểu biết nghiệp vụ, **không thay ý kiến luật sư**. SEC phụ trách phần dữ liệu cá nhân (`security/data-risk-assessment.md`).
>
> **v0.3 – INV quyết ESC-001 16/10 (phương án A)**: thuê luật sư rà soát gói dữ liệu cá nhân **trước khi đưa dữ liệu khách thật vào app** (cuối Round 2). Cho tới khi luật sư rà xong, **giữ nguyên các mặc định pháp lý hiện hành** của nhóm này (hạn khai báo NN `hours_only` +12 giờ, ngưỡng trẻ em dưới 16 tuổi, xóa ảnh giấy tờ ngay khi `confirmed`/`void`, lưu ảnh 30 ngày sau trả phòng, hệ quả BR-613, không nhận tiền mã hóa). Nhãn **PHÁP LÝ – cần xác nhận** giữ nguyên; luật sư sửa số nào thì chỉ đổi tham số mục 13.

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-601 | **Mọi người lưu trú** (người đứng tên, người đi cùng, trẻ em) phải có thông tin giấy tờ trước hạn khai báo. Số người cần giấy tờ = số khách của đơn; thêm người giữa chừng → khai bổ sung | Đơn 3 khách, mới quét 2 → trạng thái "Thiếu người đi cùng" | NGÀNH | BL 5.12 |
| BR-602 | **Hạn thông báo lưu trú – công dân VN**: trước 23:00 ngày đến; khách đến từ 23:00 trở đi → trước 08:00 sáng hôm sau. "Ngày đến" = **ngày lịch của giờ đến thực tế** (giờ đồng hồ, không dùng ngày nghiệp vụ BR-010) | Khách đến 23:40 ngày 20/10 → hạn **08:00 21/10**. Khách đến 01:30 ngày 21/10 → hạn **23:00 21/10** (mục tiêu nội bộ: khai trong ca sáng) | PHÁP LÝ – cần xác nhận (theo DOM hiểu: Luật Cư trú 68/2020/QH14, Điều 30) | BL 5.12 |
| BR-603 | **Hạn khai báo tạm trú – người nước ngoài** (viết lại v0.2): hạn = **giờ đến thực tế + 12 giờ** (`registration_deadline_foreigner_hours`). **Không áp mốc 23:00** cho khách NN (mốc 23:00 chỉ dành cho khách VN, BR-602). **Khác với BL** (BL dùng 23:00 cho mọi khách). "Giờ đến" = thời điểm nhận phòng thực tế ghi trong app (lễ tân bấm nhận phòng; khách tự nhận qua check-in online → thời điểm khách xác nhận đã đến, hoặc lần mở cửa đầu tiên nếu khóa báo về – lấy mốc **sớm hơn**). Không dùng ngày đến của đơn, không dùng ngày nghiệp vụ. Tham số `registration_deadline_foreigner_mode` = `hours_only` (mặc định); giữ lựa chọn `earlier_of` (sớm hơn giữa +12 giờ và 23:00 ngày đến) chỉ để bật nếu luật sư yêu cầu qua ESC-001. Nhắc người trực trước hạn `registration_reminder_before_minutes` (120 phút). **Mục tiêu nội bộ** (không phải hạn luật): khai trong ca nhận phòng | Đến 08:00 → hạn **20:00 cùng ngày**. Đến 21:30 ngày 20/10 → hạn **09:30 ngày 21/10**. Đến 23:40 ngày 20/10 → hạn **11:40 ngày 21/10**. Đến 01:30 ngày 21/10 → hạn **13:30 ngày 21/10**. (Nếu luật sư chọn `earlier_of`: đến 21:30 → 23:00 cùng ngày; đến sau 23:00 → +12 giờ) | PHÁP LÝ – cần xác nhận (theo DOM hiểu: Luật Nhập cảnh, xuất cảnh, quá cảnh, cư trú của người nước ngoài tại VN 47/2014/QH13 và các luật sửa đổi, Điều 33) | BL 5.12; Brief 5 |
| BR-604 | **Cập nhật ngày đi thực tế** trên cổng khai báo khi khách trả phòng, trả sớm hoặc gia hạn (Brief 5). App tạo việc "Cập nhật ngày đi" cho lễ tân với mọi đơn có khai báo NN | Khách trả sớm 2 ngày → việc cập nhật trong ngày trả | PHÁP LÝ – cần xác nhận | Brief 5 |
| BR-605 | **Kiểm tra giấy tờ NN**: hộ chiếu còn hạn **đến sau** ngày trả phòng (so thật, không mặc định "Khớp"); thị thực/miễn thị thực/thẻ tạm trú còn hạn đến ngày trả phòng. Ngày đi dự kiến khai báo **không vượt** hạn tạm trú: nếu đơn/HĐ dài hơn → cảnh báo đỏ, khai đến hết hạn thị thực, nhắc khách gia hạn trước `visa_expiry_warning_days`: **30 ngày với khách dài hạn** (gia hạn qua dịch vụ mất 5–10 ngày làm việc), **14 ngày với khách ngắn ngày**. Hệ quả khi kiểm "Không đạt": **BR-613** | Emma (dài hạn) thị thực đến 20/11, HĐ đến 4/12 → khai đến 20/11, nhắc từ **21/10**. Khách ngắn ngày thị thực đến 20/11 → nhắc từ 6/11 | PHÁP LÝ – cần xác nhận | BL 5.12, 8.2 #3; Brief 5 |
| BR-606 | **Hồ sơ khai báo NN** cần: ảnh trang thông tin hộ chiếu, dấu nhập cảnh, thị thực hoặc diện miễn thị thực, ngày đến/đi, mục đích, SĐT. Khai trên cổng `tbltkbtt.bocongan.gov.vn` (bán tự động: app chuẩn bị dữ liệu, lễ tân dán, nhập mã hồ sơ) | – | PHÁP LÝ – cần xác nhận | Brief 5; BL 3.11 |
| BR-607 | **Trạng thái khai báo** – danh sách tên chuẩn, đúng thứ tự SM-05 của BA: `none`, `pre` (khách gửi trước qua app), `partial`, `review`, `scanned`, `sent`, `confirmed`, `needs_update` (cần cập nhật ngày đi), `updated`, **`void`** (đơn hủy hoặc no-show **trước khi khai xong** – không còn trong danh sách cần khai). Luồng chuyển chi tiết (gồm `sent → scanned` khi cổng từ chối, `review → partial`, `pre → review`) theo `state-machines.md` SM-05 (K1–K11), BR không chép lại sơ đồ | Đơn 2 khách NN ở `partial` bị hủy → `void`, ảnh giấy tờ xử lý theo BR-609 (b) | NGÀNH | BL 5.12 |
| BR-608 | **Mọi luồng tạo đơn** (đặt mới, từ báo giá, đơn OTA về, HĐ dài hạn) đều sinh bản ghi khai báo. Đơn con gia hạn (BR-422) không sinh bản ghi mới mà tạo việc cập nhật ngày đi. Khách dài hạn khai 1 lần + cập nhật khi gia hạn/đổi giấy tờ | – | NGÀNH | BL 8.2 #9 |
| BR-609 | **Đồng ý lưu ảnh giấy tờ** là bắt buộc trước khi lưu ảnh (ký trên app hoặc tại quầy). Khách không đồng ý → chỉ dùng để khai báo rồi không lưu ảnh, chỉ lưu các trường văn bản cần thiết. **Thời điểm xóa ảnh** (v0.2, thống nhất với SEC): (a) không đồng ý → xóa **ngay khi khai báo chuyển `confirmed`** (đã có mã hồ sơ); `id_image_purge_max_hours` (24 giờ) là **hạn trên** cho job dự phòng khi xóa ngay bị lỗi; (b) đơn `cancelled`/`no_show` trước khi khai (khai báo `void`) → xóa ngay khi `void`, cùng hạn trên; (c) khách rút đồng ý → như (a) nếu chưa khai xong, xóa ngay nếu đã khai | Khách không đồng ý, khai báo `confirmed` 15:20 → ảnh xóa lúc 15:20; nếu lệnh xóa lỗi, job dự phòng phải xóa xong trước 15:20 hôm sau | PHÁP LÝ – cần xác nhận | BL 5.13 |
| BR-610 | **Lưu trữ và quyền xem**: ảnh mã hóa, tách khỏi hồ sơ khách; chỉ lễ tân và quản lý (và chủ đầu tư) xem được; buồng phòng, sale, CTV không thấy cả số giấy tờ đã che; mỗi lần mở ảnh ghi nhật ký; tự xóa ảnh **30 ngày sau trả phòng**; hồ sơ khách chỉ giữ 4 số cuối | – | PHÁP LÝ – cần xác nhận (thời hạn 30 ngày là đề xuất của BL) | BL 5.13, 8.2 #27, 9 #14 |
| BR-611 | **Khai báo ca tối**: nếu sau 22:00 không có lễ tân trực → khách đến khuya làm check-in online trên app (giấy tờ trước), người trực đêm/quản lý nhận thông báo và khai báo trên điện thoại; app nhắc lúc 22:00 và 07:00 các hồ sơ chưa khai (`registration_digest_times`). Người trực đêm khai trên **thiết bị của cơ sở** đã được cấp quyền (máy quầy hoặc máy tính bảng của cơ sở), không trên điện thoại cá nhân (phân xử ORC theo SEC); ca tối (INV chọn ESC-010 T-A): **một người trực đêm vai lễ tân có mặt tại cơ sở**, dùng máy quầy hoặc máy tính bảng của cơ sở; quản lý là người dự phòng (nhận thông báo, đến cơ sở khi cần) | Khách Hàn đến 01:30 → hạn khai 13:30 (BR-603); 07:00 người trực sáng nhận danh sách nhắc | INV quyết ESC-010 16/10 | BL 9 #15 |
| BR-612 | **Trẻ em** dùng số định danh cá nhân từ giấy khai sinh/hộ chiếu; năm sinh chỉ dùng cho khai báo lưu trú và phụ thu trẻ em (BR-110). **Ngưỡng tuổi bảo vệ dữ liệu trẻ em** là tham số `minor_data_age_threshold` (tạm: **dưới 16 tuổi** theo SEC R-CON-05, chờ luật sư qua ESC-001); khác với ngưỡng tuổi phụ thu (BR-110) – hai tham số không dùng lẫn | Khách 15 tuổi → dữ liệu theo chế độ trẻ em (cần đồng ý của cha mẹ/người giám hộ – SEC); phụ thu vẫn tính người lớn (≥ 12 tuổi) | NGÀNH; ngưỡng tuổi: PHÁP LÝ – cần xác nhận | BL 5.12; rbac mục 9 |
| BR-613 | **Hệ quả khi kiểm giấy tờ NN "Không đạt"** (BR-605) – mặc định đội đề xuất: (a) thị thực/miễn thị thực hết **trước ngày đi** nhưng còn hạn tại ngày nhận → **không chặn**; khai đến hết hạn thị thực, cảnh báo đỏ, nhắc khách gia hạn (BR-605); (b) hộ chiếu hết hạn **trong kỳ ở** (sau ngày nhận, trước ngày trả) → không chặn, cảnh báo, lễ tân ghi cách xử lý; (c) hộ chiếu **đã hết hạn tại ngày nhận**, thị thực đã hết hạn tại ngày nhận, hoặc **thiếu dấu nhập cảnh / chứng nhận nhập cảnh** → **chặn giao mã cửa**; chỉ **lễ tân trưởng trở lên** được xác nhận nhận tiếp, ghi lý do và cách xử lý, quản lý nhận thông báo. Mọi trường hợp ghi nhật ký kết quả kiểm | Khách hộ chiếu hết hạn 10/10, nhận phòng 15/10 → chặn, lễ tân trưởng xem xét. Emma thị thực hết 20/11, HĐ đến 4/12 → nhận bình thường, khai đến 20/11 | PHÁP LÝ – cần xác nhận (ESC-001) | PO-DOM-04; SM-05 K5; SEC R-REG-03 |

---

## 9. Minibar, F&B, kho (BR-7xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-701 | **Tủ chuẩn** mỗi căn 17 món theo bảng BL 4.13. Đồ miễn phí (nước suối, cà phê phin, trà atiso) trừ kho nhưng **không tính tiền**, ghi chi phí phòng | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 4.13, 5.14 |
| BR-702 | Đã dùng = chuẩn − còn lại (giới hạn 0…chuẩn). Tiền = đã dùng × giá bán | 2 bia (35.000) + 1 snack (30.000) + 2 nước suối (miễn phí) = **100.000** | NGÀNH | BL 5.14 |
| BR-703 | **Kiểm minibar**: buồng phòng kiểm mỗi lần dọn phòng có khách và khi khách báo trả phòng; lễ tân xác nhận lúc trả phòng. Khách dài hạn: kiểm khi dọn định kỳ, ghi folio, thu cùng hóa đơn tháng | – | NGÀNH | BL 5.14 |
| BR-704 | Khách khiếu nại minibar → lễ tân **tự miễn** trong hạn mức lần và tháng theo **BR-436** (không cần người thứ hai duyệt); quá mức chuyển lễ tân trưởng duyệt (BR-432, 433) | – | INV quyết ESC-007 16/10 | DOM đề xuất |
| BR-705 | **Kho**: tồn cuối = tồn đầu + nhập − xuất minibar − xuất khác ± kiểm kê; xuất không vượt tồn; giá vốn **bình quân gia quyền** (thay cho ghi đè của prototype); trạng thái Hết hàng (≤ 0) / Cần nhập (≤ tối thiểu) / Đủ. Kiểm kê hằng tháng; chênh lệch > 5% giá trị tồn → quản lý duyệt | Tồn 10 lon bia giá 12.000, nhập 24 lon giá 13.000 → giá vốn mới (120.000 + 312.000) ÷ 34 = **12.706** | NGÀNH | BL 3.15, 5.14 |
| BR-706 | Hàng có hạn sử dụng (sữa tươi, mì…): xuất theo hạn gần nhất trước, cảnh báo trước hạn 7 ngày (sau MVP) | – | NGÀNH | BL 7 |

---

## 10. Trạng thái buồng, dọn phòng, bảo trì (BR-8xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-801 | **7 trạng thái buồng**: VC (Trống · sạch), VI (Đã kiểm · sẵn sàng), VD (Trống · cần dọn), CL (Đang dọn), OC (Có khách · sạch), OD (Có khách · cần dọn), OOO (Hỏng · khóa phòng). Trạng thái buồng tách khỏi trạng thái đơn nhưng được đồng bộ theo sự kiện | – | NGÀNH | BL 4.5 |
| BR-802 | **Chuyển trạng thái hợp lệ và người được chuyển**: VD/OD → CL (buồng phòng); CL → VC hoặc OC (buồng phòng, "Dọn xong"); VC → VI (người kiểm: lễ tân trưởng/quản lý, hoặc buồng phòng tự kiểm đủ checklist + ảnh khi chỉ có 1 người – bật/tắt bằng `hk_self_inspection_enabled`, mặc định tắt); OC → OD (buồng phòng/lễ tân). Tự động: nhận phòng → OC; trả phòng → VD; gia hạn → OD; 07:00 hằng ngày căn có khách ngắn ngày OC → OD; khách dài hạn chỉ OD theo lịch gói. OOO chỉ vào/ra qua phiếu sửa chữa (BR-804) | – | NGÀNH | BL 5.15 |
| BR-803 | **Giao phòng**: căn đang có khối OOO không bán được. Căn VD/CL vẫn bán được cho ngày tương lai nhưng **không nhận phòng** được đến khi VC/VI, **trừ ngoại lệ BR-402 (1)**: lễ tân trưởng trở lên xác nhận có lý do, căn chuyển OD và có việc dọn ưu tiên. **Đổi phòng khách đang ở** (BR-424) **không** dùng ngoại lệ này: căn mới phải VI/VC (khách đang ở đã có phòng). **Đổi căn cho đơn tương lai** không cần căn đang sạch, chỉ kiểm trùng và khối OOO. Ưu tiên giao VI > VC | Khách đến 13:30, căn 203 đang CL, khách mệt muốn vào ngay → lễ tân trưởng xác nhận "khách đồng ý vào khi đang dọn nốt", căn → OD, việc dọn ưu tiên. Đổi phòng khách đang ở sang 202 đang VD → chặn | NGÀNH | BL 3.6 |
| BR-804 | **Khóa phòng (OOO)**: tạo từ phiếu sửa chữa (hoặc khóa có kế hoạch) **kèm khoảng ngày dự kiến**; tạo khối chặn tồn phòng → rack, kiểm trùng, channel manager đều coi là hết phòng; trừ khỏi đêm khả dụng. Không khóa căn đang có khách (đổi phòng trước, BR-424); khoảng khóa trùng đơn tương lai → hiện danh sách đơn cần dời trước khi lưu. Phiếu "Xong" → căn VD, mở bán. **Quy ước khoảng ngày (v0.2)**: khối OOO dùng **cùng quy ước nửa mở với đơn (BR-002)**: lưu **[ngày bắt đầu, ngày mở bán lại)** – ngày mở bán lại là ngày đầu tiên được bán. Giao diện hỏi "ngày dự kiến xong"; ngày mở bán lại mặc định = ngày xong + `ooo_reopen_buffer_days` (1 ngày, để dọn + kiểm sau sửa); hiển thị rõ cả hai ngày cho người tạo. Phiếu "Xong" sớm hơn dự kiến → mở bán từ đêm kế tiếp sau khi căn `VI`. Trường dữ liệu đề nghị ARC đặt tên `reopenDatePlanned` (thay `endDatePlanned`) để không hiểu nhầm | Phiếu WO "Hỏng bình nóng lạnh 401", bắt đầu 15/10, dự kiến xong 17/10 → lưu **[15/10, 18/10)** = khóa đêm 15, 16, 17 (3 đêm), mở bán từ 18/10; đêm khả dụng tháng 10 = 310 − 3 = **307**. Dữ liệu mẫu BL 4.4 (401 khóa đêm 15 và 16, đơn OTM-0154 bán từ 17/10) đọc là [15/10, 17/10) = 2 đêm – hợp lệ, không trùng OTM-0154 | NGÀNH | BL 8.2 #5, #29 |
| BR-805 | Căn **VI** chưa giao khách quá `vacant_reinspect_days` (3 ngày, tính từ thời điểm kiểm đạt; **đủ 72 giờ là quá**) → tự chuyển **VC** (cần kiểm lại bụi, mùi trước khi giao). Căn VC giữ nguyên VC | Kiểm đạt 10:00 15/10 → 10:00 18/10 chuyển VC; 09:59 18/10 vẫn VI | NGÀNH | DOM đề xuất; PO-DOM-08, BA-DOM-13 |
| BR-806 | **Đối chiếu buồng – đơn** mỗi sáng 07:00 và khi mở rack: OC/OD mà không có đơn `in_house` → cảnh báo; đơn `in_house` mà buồng VC/VD → cảnh báo | – | NGÀNH | DOM đề xuất |
| BR-807 | **Lịch dọn**: ngắn ngày dọn hằng ngày nếu khách không từ chối, thay ga mỗi 3 đêm; dài hạn theo gói (ngày cố định, khung 9:00–11:00) + dọn lẻ (BR-506). **Thứ tự ưu tiên dọn**: căn có khách đến hôm nay (đến sớm trước) > VIP/khách quen > căn trả phòng > căn khách ở lại | – | Dọn hằng ngày ngắn ngày, thay ga mỗi 3 đêm: INV quyết ESC-008 16/10; lịch dài hạn, thứ tự ưu tiên: NGÀNH | BL 5.15, 9 #12 |
| BR-808 | **Checklist kiểm phòng 12 điểm** (BL 3.12: ga gối, phòng tắm, khăn 2 tắm/2 mặt/1 chân, amenity, bếp, bàn làm việc, Wi-Fi ≥ 50 Mbps, rèm/cửa sổ, mùi, remote/điều hòa/sưởi, thẻ chào + Wi-Fi, ảnh) là điều kiện chuyển VC → VI | – | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 3.12 |
| BR-809 | **Mức độ phiếu sửa chữa và thời hạn**: Cao (an toàn hoặc ảnh hưởng khách đang ở: mất nước nóng, mất điện, khóa cửa hỏng, rò nước) → nhận trong 15 phút, có **phương án** trong 2 giờ (phương án = sửa xong hoặc đổi phòng/bù sự cố; **không dừng** hạn khi chờ vật tư); Trung bình → **xử lý xong** trong 24 giờ; Thấp → xử lý xong trong 72 giờ. TB/Thấp được **tạm dừng** hạn khi phiếu `waiting_parts` nếu kỹ thuật ghi **ngày dự kiến có vật tư**; quá ngày đó → cảnh báo lại và vào "Cần chú ý". Căn có khách dài hạn: nâng một bậc nếu ảnh hưởng làm việc/sinh hoạt (Wi-Fi, nước nóng). Yêu cầu "Báo hỏng" từ app khách mặc định Trung bình, lễ tân nâng mức | Mất nước nóng căn 203 lúc 21:00 → Cao, 23:00 chưa sửa được → đổi phòng (BR-424) + FOC bù sự cố | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 3.14; Brief 5 |
| BR-810 | **Bảo trì định kỳ**: hoàn thành → tự sinh kỳ kế tiếp = ngày hoàn thành + chu kỳ; hạn ≤ 7 ngày → cảnh báo | Bảo dưỡng bình nóng lạnh (6 tháng) xong 24/10/2026 → kỳ tới 24/4/2027 | NGÀNH | BL 4.8 |
| BR-811 | **Yêu cầu từ app khách** định tuyến theo BL 5.19 (Dọn thêm, Khăn/đồ dùng → Buồng phòng; Báo hỏng → Bảo trì; Xe/tour, Trả muộn, Khác → Lễ tân). Lễ tân trả lời trong 10 phút trong giờ trực **[07:00, 22:00)** (gồm 07:00, không gồm 22:00); ngoài giờ trả lời tự động kèm giờ xử lý | Yêu cầu gửi 21:59 → trong giờ, hạn trả lời 22:09; gửi 22:00 → ngoài giờ, trả lời tự động | [GIẢ ĐỊNH – chờ INV xác nhận] | BL 5.19 |

---

## 11. Kênh bán, hoa hồng, quy ước số liệu, cảnh báo (BR-9xx)

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-901 | **Phí kênh**: tỷ lệ cấu hình theo kênh (Airbnb 15,5%; Booking.com 15%; Agoda 18%; Expedia 18%; Trip.com 15%; Website/Zalo 0%). Mỗi đơn lưu **phí kênh thực tế** (từ channel manager nếu có, không thì theo tỷ lệ). Thực thu = doanh thu − phí kênh thực tế | Đơn Agoda 2.000.000 → phí 360.000, thực thu **1.640.000** | Tỷ lệ: [GIẢ ĐỊNH – chờ INV xác nhận]; cách lưu: NGÀNH | BL 5.11, 8.2 #12 |
| BR-902 | **Một nguồn số liệu**: báo cáo kênh và P&L cùng lấy phí kênh từ tổng phí theo đơn; không nhập tay con số riêng cho P&L | Tháng 9: phí OTA P&L phải = 15.794.500 (tổng bảng kênh trừ CTV), không phải 15.500.000 | NGÀNH | BL 8.2 #11 |
| BR-903 | **Hoa hồng ngắn ngày**: CTV 8%, nhân viên 3% trên **tiền phòng** (không gồm phụ thu, minibar, phạt). Chỉ ghi nhận khi đơn `checked_out` và đã thu đủ; đơn hủy/no-show → 0. Lịch chi gộp theo tháng như BR-212. Q-D2 đã quyết (v0.3): CTV **8%**, báo cáo kênh lấy hoa hồng thực tế từng đơn, không dùng 7% | Đơn CTV căn 202, 7 đêm 9/11–16/11 = 5.205.000 (BR-107) → hoa hồng 8% = **416.400** | INV quyết ESC-005 16/10 | BL 5.3, 5.11 |
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

## 12A. Vận hành khi mất mạng / mất điện (BR-96x) – mới v0.2

> Đà Lạt mùa mưa hay mất điện, mất mạng cục bộ. Theo ARC (ADR-005), thao tác tiền và tồn phòng bắt buộc có mạng; các quy tắc dưới đây là quy trình nghiệp vụ dự phòng. Phần kỹ thuật (bản đọc offline, đồng bộ lại) do ARC/UXD quyết. BA đưa vào quy trình P12.

| Mã | Quy tắc | Mặc định & ví dụ số | Nhãn | Nguồn |
|---|---|---|---|---|
| BR-961 | **Chuẩn bị dự phòng hằng ngày**: mỗi sáng sau `contingency_sheet_time` (06:30) hệ thống tạo **bảng dự phòng** của ngày nghiệp vụ: khách đến/đi, căn được gán, trạng thái buồng, số tiền còn phải thu từng đơn, giờ đến dự kiến, SĐT liên hệ khẩn của khách và quản lý. **Không** gồm số giấy tờ, ảnh giấy tờ, mã cửa. Lễ tân in giấy hoặc lưu bản đọc offline trên máy quầy của cơ sở; bản của hôm trước hủy/xóa | 06:30 ngày 24/10: bảng 3 khách đến, 2 khách đi, 10 căn, tổng còn phải thu 6.200.000 | NGÀNH | DOM-BA-04 |
| BR-962 | **Khi mất kết nối**: thứ tự thử: (1) 4G điện thoại của cơ sở phát Wi-Fi cho máy quầy; (2) app trên thiết bị của cơ sở dùng 4G; (3) sổ giấy theo mẫu. Trong thời gian mất kết nối: **không nhận đơn mới qua điện thoại khi chưa xem được tồn phòng** – ghi thông tin khách, hẹn xác nhận lại; vẫn được giao phòng cho khách đã có trong bảng dự phòng (căn đã gán, đã sạch) và thu tiền ghi sổ giấy (tiền mặt, ảnh chuyển khoản); mã cửa dùng mã đã gửi khách trước hoặc thẻ dự phòng theo hướng dẫn hãng khóa (INT). Mất kết nối > `channel_sync_outage_alert_minutes` → quản lý đóng bán thủ công trên extranet theo BR-317 | Mất mạng 14:00–16:00, khách đặt qua điện thoại 14:30 → ghi tên, SĐT, hẹn gọi lại 16:00; khách Booking có trong bảng dự phòng đến 14:20 → giao căn 203 đã VI, ghi giờ nhận 14:20 vào sổ | NGÀNH | DOM-BA-04; S7 |
| BR-963 | **Nhập bù sau khi có mạng**: cho ghi **giờ thực tế trong quá khứ** (giờ nhận/trả, giờ thu tiền) kèm lý do bắt buộc "nhập bù sau mất mạng/mất điện" và người nhập; phụ thu và hạn khai báo tính theo **giờ thực tế**, không theo giờ nhập (BR-414, BR-603). Nhập bù chỉ trong `offline_backfill_max_hours` (24 giờ); quá hạn → quản lý nhập. Nhập bù xong → hệ thống kiểm trùng và đối soát kênh (BR-905, BR-906) trước khi mở lại bán | Khách NN nhận 14:20, nhập bù 16:05 → hạn khai báo 02:20 hôm sau (14:20 + 12 giờ), không phải 04:05 | NGÀNH | DOM-BA-04 |
| BR-964 | **Mất điện**: khóa cửa chạy pin vẫn mở bằng mã/thẻ (khóa TTLock – INT xác nhận theo hãng); lễ tân kiểm danh sách khách đang ở (bảng dự phòng), ưu tiên khách có trẻ nhỏ/người lớn tuổi; phiếu sửa mức Cao cho căn có khách nếu mất điện riêng căn; mất điện toàn khu kéo dài > 4 giờ → quản lý quyết đổi phòng/bù sự cố (BR-424, BR-431) | Mất điện cả khu 19:00–23:30 → quản lý quyết tặng bữa sáng/FOC theo BR-433, ghi lý do "Bù sự cố" | NGÀNH; mức bù: [GIẢ ĐỊNH – chờ INV xác nhận] | DOM-BA-04 |

---

## 13. Bảng tham số cấu hình (giá trị mặc định)

> ARC dùng bảng này để thiết kế bảng cấu hình (theo cơ sở, có ngày hiệu lực). Tên khóa tiếng Anh để dùng trong code. Cột "Trạng thái": **INV-0xx** = INV quyết ESC-0xx 16/10 (giá trị chính thức); **INV-TT** = thông tin INV gửi 16/10; GĐ = [GIẢ ĐỊNH – chờ INV xác nhận]; NGÀNH = DOM chốt; PL = cần luật sư/kế toán.
> v0.2: đã thêm mọi khóa còn thiếu (ARC M2, BA-DOM-08). Tên khóa đối chiếu `erd.md` mục 9.3; nếu ARC đã đặt tên khác cho cùng ý nghĩa thì dùng tên của ARC, DOM đồng bộ lại câu chữ. Nhắc lại 0.2.4: con số không có khóa ở đây thì không được dùng trong code.
> **v0.3**: đổi mặc định theo quyết định INV 16/10 – các dòng có chữ **(đổi v0.3)** là giá trị mới; QA đổi seed DS-E và `br-examples.json` theo các dòng này (xem `rounds/round-02/outputs/DOM/w1-oracle-review.md`).

| Khóa tham số | Mặc định | BR | Trạng thái |
|---|---|---|---|
| `timezone` | Asia/Ho_Chi_Minh | BR-001 | NGÀNH |
| `business_day_rollover` | 06:00 | BR-010 | NGÀNH |
| `fx_usd_vnd` | 26.200 | BR-004 | GĐ |
| `rounding.night_rate` / `.monthly_rent` / `.deposit` / `.fee` | 1.000 / 10.000 / 100.000 / 1.000 | BR-005 | INV-004 |
| `room.<no>.monthly_list_price` | Bảng BL 4.1 | BR-101 | INV-004 |
| `night_from_month_divisor` | 12 | BR-101 | INV-004 |
| `long_stay_daily_divisor` | 30 | BR-102 | NGÀNH |
| `ota_base_rate.<group>` | 760.000 / 1.050.000 / 980.000 | BR-103 | INV-004 |
| `weekend_uplift_pct`, `weekend_nights`, `weekend_uplift_channels` | 15%, Thứ Sáu + Thứ Bảy, **mọi kênh** (đổi v0.3: thêm kênh Trực tiếp/CTV) | BR-103, 104 | INV-004 |
| `special_dates[]`, `special_uplift_pct`, `special_uplift_channels` | Tết, 30/4–1/5, 2/9, 24/12–1/1 (gồm hai đầu); +30%; **mọi kênh** (đổi v0.3). Mùa cao điểm Đà Lạt: chưa có – chờ INV gửi | BR-104 | INV-004; mùa cao điểm GĐ |
| `rate_floor_pct`, `rate_ceiling_pct` | 70%, 250% giá nền | BR-105 | GĐ |
| `los_discount` | ≥ 7 đêm 10%; ≥ 14 đêm 15% (chỉ Trực tiếp/CTV, áp sau lịch giá) | BR-107 | INV-004 |
| `long_stay_compare_from_nights`, `long_stay_required_from_nights` | 15, 28 | BR-108 | INV-004 |
| `foreigner_surcharge_pct` | 10% (chỉ dài hạn, theo giấy tờ BR-009) | BR-109 | INV-004 |
| `room.<no>.base_occupancy` (định mức – giá trị căn, **ưu tiên**), `room_group.<group>.default_base_occupancy` | **(đổi v0.3)** Studio 101–103, 201–203: **2**; 301, 401: **4**; 302, 402: **3**. Mặc định nhóm: Lầu 1–2 2 · Căn N 4 · Căn N+ 3 (thay `base_occupancy` = 2 chung) | BR-110 | INV-TT |
| `room.<no>.bed_config` | Studio: 1 giường; 301, 401: 2 phòng ngủ, 2 giường lớn; 302, 402: 1 giường lớn + 1 giường 1m4 | BR-110 | INV-TT |
| `room.<no>.max_occupancy`, `room_group.<group>.default_max_occupancy` | **(đổi v0.3)** = định mức + 1 nệm phụ: Studio **3**; 301, 401 **5**; 302, 402 **4** (thay 3/4/4). Trẻ dưới 6 tuổi không tính | BR-110 | GĐ (ESC-014) |
| `extra_adult_fee`, `adult_from_age`, `child_free_under_age`, `child_fee_6_11` | 150.000; 12; 6; 100.000 (tính cho người vượt **định mức của căn**) | BR-110 | INV-004 |
| `return_guest_code`, `return_guest_pct`, `stackable` | OTTIMO-BACK5; 5%; không | BR-111 | GĐ |
| `booking_window_days`, `short_stay_max_nights` | 365; 27 | BR-112 | GĐ |
| `min_stay[]` (nhóm × ngày đến × kênh) | **(đổi v0.3) bật**: 2 đêm khi ngày đến là thứ Sáu, thứ Bảy hoặc ngày đặc biệt, mọi kênh; ngoại lệ đêm lẻ theo BR-113 | BR-113 | INV-004 |
| `min_stay_orphan_night_exception` | bật (web/quầy/CTV: theo căn; OTA: khi mọi căn trống của nhóm đều là đêm lẻ) | BR-113 | NGÀNH |
| `lease_terms[]` | Bảng BR-201 | BR-201 | INV-005 |
| `service_fee.<group>`, `cleaning_package.<group>[k]` | Bảng BL 5.2 cho **HĐ mới**; HĐ đang chạy trước khi dùng app = 0 (đổi v0.3) | BR-204 | INV-005 |
| `utility_estimate` | VN 120 kWh, 3,5 m³/người; NN 170 kWh, 4 m³/người | BR-205 | GĐ |
| `rent_reminder_days`, `rent_overdue_alert_days`, `rent_overdue_escalate_days` | 7; 3; 10 | BR-207 | GĐ |
| `lease_renewal_offer_days` | 30 | BR-211 | GĐ |
| `commission_payout` | 50% sau kỳ đầu; 50% khi qua 50% thời hạn | BR-212 | INV-005 |
| `commission_payable_day`, `commission_pay_by_day` | ngày 1; ngày 10 tháng sau | BR-212, 903 | INV-005 |
| `deposit_refund_working_days` | 7 | BR-214 | INV-006 |
| `long_stay_checkout_inspection_deadline` | trong ngày trả phòng (trước 23:59), có ảnh | BR-214 | INV-006 |
| `hold_hours_options`, `hold_hours_default`, `hold_latest_time_on_arrival` | 12/24/48; 24; 12:00 | BR-302 | INV-006 (trần 12:00: NGÀNH) |
| `hold_expiry_reminder_hours`, `hold_extension_max_hours` | 2; 24 (1 lần, không vượt `hold_latest_time_on_arrival`) | BR-303 | INV-006 |
| `quote_validity_days` | 3 | BR-304 | INV-006 |
| `short_stay_deposit_pct`, `deposit_base` | 30%; tiền phòng sau lịch giá và giảm giá, **không gồm** phụ thu người/sớm/muộn, dịch vụ | BR-305 | INV-006 (cơ sở tính: NGÀNH) |
| `cancel_policy_direct` | ≥ 7 ngày 100%; 3–6 ngày 50%; < 3 ngày 0% hoàn (đếm theo BR-011) | BR-309 | INV-006 |
| `cancel_peak_no_refund`, `reschedule_max_times`, `reschedule_window_months` | có; 1; 3 | BR-309 | INV-006 |
| `force_majeure_reschedule_months` | 3 (dời miễn phí, không hoàn tiền mặt, quản lý duyệt) – mới v0.3 | BR-309 | INV-006 |
| `no_show_call_time`, `no_show_mark_time` | 18:00; 23:00 | BR-311 | INV-006 |
| `early_termination` | báo ≥ 30 ngày mất 50% ký quỹ; < 30 ngày mất 100% | BR-313 | INV-006 |
| `room_group.<group>.sort_order` | INV cấu hình (thứ tự nâng hạng, không suy từ giá) | BR-316 | GĐ |
| `conflict_resolve_minutes_urgent`, `conflict_urgent_window_hours`, `conflict_resolve_deadline_far` | 60; 24; 12:00 hôm sau | BR-317 | NGÀNH |
| `channel_sync_outage_alert_minutes`, `manual_close_when_rooms_left_le` | 15; 1 | BR-317, 962 | NGÀNH |
| `group_rooming_list_days`, `group_min_rooms` | 3; 2 | BR-323, 324 | INV-006 |
| `checkin_time`, `checkout_time` | 14:00; 12:00 | BR-401 | GĐ |
| `door_code_min_digits`, `birthday_code_random_digits` | 6; **3** (đổi v0.3: bỏ lựa chọn 2 số khi khóa có giới hạn thử sai) | BR-403 | INV-011 + SEC |
| `door_lock_vendor` | TTLock (mới v0.3); tạo mã tự động: chờ INT xác nhận gateway | BR-403 | INV-TT |
| `early_checkin_tiers` | [10:00, 14:00) 30%; [06:00, 10:00) 50%; trước 06:00 → **không phụ thu**, xử lý BR-417 | BR-411 | INV-007 |
| `late_checkout_tiers` | (12:00, 15:00] 30%; (15:00, 18:00] 50%; sau 18:00 → **không phụ thu**, gia hạn BR-416/421 | BR-412 | INV-007 |
| `late_grace_until`, `late_grace_requires_no_same_day_arrival` | **12:30** (đổi v0.3, thay 12:00); có | BR-412 | INV-007 |
| `ota_surcharge_base` | `direct_current_rate` (giá kênh Trực tiếp hiện hành, gồm lịch giá BR-104) | BR-415 | INV-007 |
| `long_stay_free_late_until` | 15:00 (nếu không có khách đến) | BR-413 | INV-007 |
| `extension_max_nights` | 7 | BR-421 | GĐ |
| `extension_payment_deadline` | 14:00 ngày đầu phần gia hạn | BR-423 | GĐ |
| `checkout_reminders` | 20:00 hôm trước; 09:00; 11:00; quá giờ: 12:00 nếu căn có khách đến hôm nay, **12:31** nếu không (đổi v0.3 theo ân hạn) | BR-425 | GĐ |
| `post_checkout_charge_hours` | 24 | BR-427 | INV-007 |
| `early_departure_refund` | báo trước ≥ 1 ngày (BR-011) hoàn 50% đêm chưa ở | BR-428 | INV-006 |
| `foc_limits` | LT trưởng 300.000/lần, 1.500.000/tháng; Quản lý 1 đêm/lần; Chủ đầu tư không giới hạn | BR-433 | INV-007 |
| `foc_approval_push_roles` | vai thấp nhất đủ hạn mức + quản lý; chủ đầu tư khi vượt hạn mức quản lý hoặc không có quản lý đang hoạt động (mới v0.3) | BR-432 | NGÀNH |
| `foc_self_apply.front_desk.per_time`, `foc_self_apply.front_desk.per_month`, `foc_self_apply.front_desk.categories` | 100.000; 500.000/người/tháng; minibar | BR-436 | INV-007 |
| `foc_alert_pct_of_room_revenue`, `foc_alert_count_per_approver` | 3%; 10 | BR-435 | INV-007 |
| `electricity_price`, `water_price` | 3.500; 25.000 | BR-501 | INV-008 + PL |
| `meter_reading_day`, `meter_anomaly_factor`, `meter_anomaly_default_kwh`, `meter_anomaly_default_m3` | cuối tháng ± 2 ngày; × 2; 300; 10 | BR-502, 503 | GĐ |
| `utility_bill_due_days` | 5 | BR-504 | GĐ |
| `adhoc_cleaning_fee` | 100.000 | BR-506 | INV-005 |
| `laundry_price_per_kg` | 30.000 (tạm – chờ INV gửi bảng giá) | BR-507 | GĐ |
| `smoking_fee`, `key_card_fee`, `key_cards_per_booking` | 500.000; 200.000; 2 | BR-511 | GĐ |
| `lost_found_keep_days`, `lost_found_notify_hours` | 30; 24 | BR-513 | GĐ |
| `payment_receiving_account.owner_type` | `individual` (Techcombank, INV 16/10; số tài khoản chỉ cấu hình trong app) – cảnh báo chủ đầu tư; mới v0.3 | BR-521 | INV-TT + PL |
| `vat_rate` (theo khoảng ngày hiệu lực), `prices_include_vat` | 8% (đến khi kế toán xác nhận ngày hết hiệu lực); có | BR-523 | PL; `prices_include_vat` INV-008 |
| `business_entity_type`, `invoice_trigger` | **`enterprise`** – CTCP UTMG Living, hóa đơn GTGT (đổi v0.3); theo sự kiện BR-524 | BR-524 | INV-TT + PL |
| `bank_reconcile_alert_days` | 2 | BR-527 | GĐ |
| `no_deposit_max_lead_days`, `no_deposit_hold_until` | 2; 18:00 ngày đến (mới v0.3, khách không cọc online được, quản lý duyệt) | BR-527 | INV-006 (giá trị: NGÀNH) |
| `cash_variance_requires_reason` | mọi chênh lệch ≠ 0 | BR-526 | NGÀNH |
| `registration_deadline_vn` | 23:00 ngày đến (đến từ 23:00 → 08:00 hôm sau) | BR-602 | PL (luật sư rà – ESC-001) |
| `registration_deadline_foreigner_hours`, `registration_deadline_foreigner_mode` | 12; `hours_only` (lựa chọn `earlier_of` chỉ bật nếu luật sư yêu cầu) | BR-603 | PL (luật sư rà – ESC-001) |
| `registration_reminder_before_minutes` | 120 | BR-603, S8 | NGÀNH |
| `s2_shift_end_buffer_minutes` | 60 – đệm sau giờ hết ca khi đo mục tiêu nội bộ "khai trong ca nhận phòng" (chỉ số S2 của DATA, không phải hạn luật) | BR-603 | NGÀNH |
| `registration_digest_times` | 22:00; 07:00 | BR-611 | INV-010 |
| `visa_expiry_warning_days.long_stay`, `.short_stay` | 30; 14 | BR-605 | GĐ |
| `id_image_retention_days_after_checkout` | 30 | BR-610 | PL (luật sư rà – ESC-001) |
| `id_image_purge_max_hours` | 24 (hạn trên của job dự phòng; xóa chính là ngay khi `confirmed`/`void`) | BR-609 | PL + SEC |
| `minor_data_age_threshold` | dưới 16 tuổi | BR-612 | PL (luật sư rà – ESC-001) |
| `minibar_standard[]` | Bảng BL 4.13 (17 món) | BR-701 | GĐ |
| `stocktake_variance_approval_pct` | 5% | BR-705 | GĐ |
| `expiry_warning_days` | 7 | BR-706 | NGÀNH |
| `hk_self_inspection_enabled` | tắt | BR-802 | GĐ |
| `vacant_reinspect_days` | 3 (đủ 72 giờ là quá) | BR-805 | NGÀNH |
| `ooo_reopen_buffer_days` | 1 | BR-804 | NGÀNH |
| `room_status_reconcile_time` | 07:00 | BR-806 | NGÀNH |
| `daily_clean_status_time`, `linen_change_every_nights`, `long_stay_cleaning_window` | 07:00; 3; [09:00, 11:00) | BR-802, 807 | INV-008 (dọn hằng ngày, thay ga 3 đêm); khung dài hạn NGÀNH |
| `wo_sla` | Cao 15 phút nhận / 2 giờ phương án (không dừng); TB 24 giờ xong; Thấp 72 giờ xong (TB/Thấp dừng khi `waiting_parts` có ngày dự kiến) | BR-809 | GĐ |
| `maintenance_due_warning_days` | 7 | BR-810 | NGÀNH |
| `guest_request_response_minutes`, `front_desk_hours` | 10; [07:00, 22:00) | BR-811 | GĐ |
| `channel_commission_pct.<channel>` | Airbnb 15,5; Booking 15; Agoda 18; Expedia 18; Trip.com 15; Trực tiếp 0 | BR-901 | GĐ |
| `short_stay_commission_pct` | CTV 8%; NV 3% | BR-903 | INV-005 |
| `contingency_sheet_time` | 06:30 | BR-961 | NGÀNH |
| `offline_backfill_max_hours` | 24 | BR-963 | NGÀNH |
| `power_outage_escalate_hours` | 4 | BR-964 | GĐ |

---

## 14. Tình huống cao điểm và sự cố (gắn với BR)

> Dùng làm đầu vào cho QA (test case) và UXD (trạng thái lỗi). Bản đầy đủ "10 tình huống ác mộng" là việc còn lại của DOM (xem report).

| # | Tình huống | Quy tắc áp dụng | App phải làm được |
|---|---|---|---|
| S1 | Tết, cả 10 căn kín; Agoda đẩy về 1 đơn cho căn đã bán trực tiếp (đồng bộ trễ) | BR-312, 905, 906 | Cảnh báo đỏ ngay, gợi ý căn thay thế, ghi chi phí dời khách |
| S2 | 21:00 mất nước nóng căn 203, khách Nga không nói tiếng Việt | BR-809, 424, 431 | Phiếu Cao, đổi phòng trong 2 giờ, mẫu tin nhắn RU/EN, FOC bù sự cố có duyệt |
| S3 | Khách Hàn (đơn đến 20/10) tới 01:30 ngày 21/10, không có lễ tân trực | BR-611, 603, 402, 010, 315 | Check-in online trước, mã cửa gửi khi giấy tờ hợp lệ; đơn vẫn thuộc ngày nghiệp vụ 20/10 (vẫn ở "Khách đến hôm nay"); hạn khai báo NN = 01:30 + 12 giờ = **13:30 ngày 21/10** hiện cho người trực sáng (danh sách nhắc 07:00). Nếu đơn đã bị đánh dấu no-show lúc 23:00 → người trực tự khôi phục theo BR-315 |
| S4 | Khách dài hạn trả phòng, mất 1 thẻ, phòng có mùi thuốc lá, điện nước kỳ cuối chưa chốt | BR-214, 502, 511 | Quyết toán ký quỹ trong một màn hình, ảnh bằng chứng, hoàn tiền chờ quản lý duyệt |
| S5 | Hai lễ tân cùng nhận điện thoại đặt căn 203 cùng đêm | BR-906 | Một người thành công, người kia nhận thông báo rõ ràng |
| S6 | Khách xin trả 17:00 trong khi căn có khách đến 14:00 | BR-416, 412 | Chặn và gợi ý gửi hành lý; quản lý duyệt nếu có căn thay thế |
| S7 | Mất mạng internet tại quầy 2 giờ đúng 14:00 (giờ nhận phòng), hoặc mất điện cả khu buổi tối | BR-961…964, 317, 905 | Bảng dự phòng in sẵn từ sáng; thử 4G trước, sổ giấy sau; không nhận đơn điện thoại khi chưa xem tồn; quản lý đóng bán thủ công trên extranet sau 15 phút; có mạng lại → nhập bù giờ thực tế có lý do, kiểm trùng, đối soát kênh (ARC/UXD quyết phần kỹ thuật offline) |
| S8 | Khách NN đến 08:00, lễ tân quen hạn 23:00 | BR-603 | Hiện hạn **20:00 cùng ngày** (08:00 + 12 giờ, không áp mốc 23:00 cho khách NN); nhắc trước `registration_reminder_before_minutes` = 120 phút → nhắc lúc **18:00** |
| S9 | CTV báo giá cho khách 20 đêm theo giá ngắn ngày | BR-108 | Báo giá tự hiện phương án 1 tháng rẻ hơn |
| S10 | Lễ tân tự duyệt FOC nhiều lần cho người quen | BR-432, 433, 435, 436 | Không chọn được người duyệt, không tự duyệt ngoài hạn mức tự miễn minibar (lần + tháng); tự miễn hiện trong đóng ca; cảnh báo chủ đầu tư khi vượt ngưỡng |
| S11 | Đoàn 3 căn đêm 31/12, hủy bớt 1 căn trước 5 ngày, trả phòng muốn bill gộp nhưng 1 khách tự trả minibar | BR-321…326, 309 | Hủy một căn tính trên cọc phân bổ; bill gộp + bill tách minibar |
| S12 | Cuối ca tối tiền mặt thiếu 50.000, có 2 chuyển khoản khách đưa ảnh chụp màn hình | BR-526, 527 | Đóng ca bắt buộc lý do chênh lệch; chuyển khoản "chờ đối soát" tới khi quản lý tick theo sao kê |

---

## 15. Nghĩa vụ vận hành tại Việt Nam app cần hỗ trợ (cần INV/luật sư/kế toán xác nhận)

> v0.3: INV quyết ESC-001 16/10 – thuê luật sư rà soát trước khi có dữ liệu khách thật; đến lúc đó giữ mặc định pháp lý hiện hành (mục 8). Mọi dòng dưới đây vẫn **cần xác nhận**.

| Nghĩa vụ | App hỗ trợ | BR | Ghi chú |
|---|---|---|---|
| Thông báo lưu trú công dân VN | Chuẩn bị dữ liệu, nhắc hạn, lưu mã hồ sơ | BR-601, 602, 607, 613 | Luật Cư trú 2020 – cần xác nhận |
| Khai báo tạm trú người nước ngoài + cập nhật ngày đi | Như trên + hạn 12 giờ + việc cập nhật ngày đi | BR-603…606 | Luật 47/2014 và sửa đổi – cần xác nhận; tài khoản cổng do INV cung cấp |
| Bảo vệ dữ liệu cá nhân (giấy tờ, ảnh, trẻ em) | Đồng ý, mã hóa, phân quyền, nhật ký xem, tự xóa | BR-609, 610 | BL dẫn Luật BVDLCN 91/2025/QH15; SEC đánh giá, luật sư xác nhận |
| Hóa đơn điện tử (MISA meInvoice) | Tách VAT, xuất đúng thời điểm, thông tin công ty/MST | BR-523, 524 | Người bán: CTCP UTMG Living (doanh nghiệp, hóa đơn GTGT – INV 16/10). Thuế suất, thời điểm và diện máy tính tiền – kế toán xác nhận |
| Nhận tiền phòng của doanh nghiệp | Lưu loại chủ tài khoản nhận, cảnh báo khi là cá nhân | BR-521 | Tài khoản VietQR hiện là tài khoản cá nhân – kế toán xác nhận rủi ro thuế/kế toán (ESC-008, câu bổ sung 16/10) |
| Niêm yết giá dịch vụ lưu trú | Bảng giá/nội quy hiển thị cho khách (app khách, web) | BR-101, 511 | Cần xác nhận yêu cầu niêm yết cụ thể |
| Thu tiền điện nước của khách thuê | Đơn giá trên HĐ và hóa đơn tháng | BR-501 | Cần xác nhận quy định giá điện cho người thuê |

---

## 16. Đề xuất phương án cho câu hỏi BL mục 9 (thuộc nghiệp vụ) – để PO gom ESC ở đợt 3

> **v0.3 – đã quyết hết**: INV chọn phương án đội đề xuất cho toàn bộ câu ở mục này ngày 16/10 (ESC-004 … ESC-008, ESC-010, ESC-011 – xem `02-escalations/`). Mục giữ lại chỉ để truy vết; giá trị chính thức nằm ở các BR và mục 13. Lưu ý tên phương án ở mục này **khác** tên trong ESC: Q1 "B" = ESC-004 A; Q7 ân hạn "B" (12:30) = ESC-007 A; Q-D1 "C" = ESC-005 A dòng 3. Q-D5 (sức chứa): INV gửi định mức từng căn 16/10 (BR-110); sức chứa tối đa còn chờ ở ESC-014.
>
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
- **Q15 – Tài khoản cổng Bộ Công an và khai báo ca tối**: INV xác nhận đã có tài khoản cơ sở lưu trú chưa và ai giữ; DOM đề xuất BR-611 (check-in online + người trực nhận thông báo trên thiết bị của cơ sở). **Phát hiện mới:** hạn khai báo người nước ngoài là 12 giờ kể từ khi đến, không phải 23:00 (BR-603 v0.2) – đề nghị luật sư xác nhận trong ESC-001.
- **Q16 – VAT**: giá đã gồm VAT, tách khi xuất; thuế suất 8% hay 10% và áp cho cả dài hạn – kế toán xác nhận; cách xử lý thuế với phí phạt, bồi thường, ký quỹ bị khấu trừ (BR-523).

### Câu hỏi mới DOM phát hiện (ngoài 26 câu BL)

| Mã | Câu hỏi | Khuyến nghị DOM | Nhóm ESC gợi ý |
|---|---|---|---|
| Q-D1 | Phí dịch vụ cố định + gói dọn (BL) hay "chỉ tiền thuê + dọn 100k/lần" (thực tế)? | C – tham số, HĐ cũ đặt 0 | Chính sách dài hạn |
| Q-D2 | Hoa hồng CTV ngắn ngày 8% (công cụ báo giá) hay 7% (báo cáo kênh)? | 8% trên tiền phòng, báo cáo lấy từ hoa hồng thực tế từng đơn | Chính sách dài hạn (hoa hồng) |
| Q-D3 | Hạn khai báo người nước ngoài 12 giờ thay vì 23:00? | (v0.2) Hạn = giờ đến thực tế + 12 giờ, không áp mốc 23:00 cho khách NN; giữ lựa chọn `earlier_of` để bật nếu luật sư yêu cầu | Pháp lý (ESC-001) |
| Q-D4 | Mã cửa theo ngày sinh khách dễ đoán – có chấp nhận thêm số ngẫu nhiên? | (v0.3) INV quyết ESC-011 A: ddmm + 3 số ngẫu nhiên, giữ 3 số kể cả khi khóa có giới hạn thử sai; khóa TTLock | Tài khoản bên thứ ba / khóa cửa (ESC-011) |
| Q-D5 | Sức chứa tối đa và số giường thực tế từng căn? | (v0.3) INV gửi 16/10: định mức Studio 2, 301/401 4, 302/402 3 và số giường (BR-110); sức chứa tối đa tạm = định mức + 1 – ESC-014 | Chính sách giá |

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
| ~~2026-10-15~~ | ~~1~~ | ~~Hạn khai báo NN: áp hạn sớm hơn giữa +12 giờ và 23:00~~ – **đã thay** bằng dòng DOM "giờ đến + 12 giờ, bỏ mốc 23:00 cho khách NN" trong decision-log (bước 4) | DOM | ARC M1 |
| 2026-10-15 | 1 | Lịch dọn dài hạn ngày cố định, khung 9:00–11:00 (khách đổi qua app) | DOM | BL 9 #12 – plan R1 mục 8 giao DOM tự chốt |

> v0.2: các dòng decision-log mới của bước 4 nằm ở `rounds/round-01/responses/DOM-responses.md` mục "Dòng decision-log đề xuất" (ORC ghi).

**v0.3 – dòng đề xuất ORC ghi (Round 2, tuần 1)**

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-16 | 2 | BR v0.3: đổi mặc định theo INV quyết ESC-004…008, 010, 011 (lịch giá +30%/+15% mọi kênh; ở tối thiểu 2 đêm bật; ân hạn trả phòng 12:30 khi căn không có khách đến; mã sinh nhật ddmm + 3 số; bất khả kháng dời 3 tháng); nhãn "INV quyết ESC-xxx 16/10" | DOM (theo INV) | ESC-004…011 đã quyết; BUG-R2-001 |
| 2026-10-16 | 2 | Định mức từng căn (Studio 2; 301, 401: 4; 302, 402: 3) là thuộc tính căn, phụ thu tính cho người vượt định mức; trẻ dưới 6 tuổi không tính định mức/sức chứa; sức chứa tối đa tạm = định mức + 1 chờ ESC-014 | DOM (số: INV 16/10) | INV gửi thông tin 16/10 |
| 2026-10-16 | 2 | Cọc ngắn ngày tính trên tiền phòng (sau lịch giá, giảm giá), không gồm phụ thu người/sớm/muộn/dịch vụ | DOM | Câu hỏi QA W7; khớp chữ "tiền phòng" trong ESC-006 A |
| 2026-10-16 | 2 | Duyệt FOC: mọi vai đủ hạn mức (gồm chủ đầu tư) thấy và duyệt được trong hàng chờ; thông báo đẩy chỉ tới vai thấp nhất đủ hạn mức + quản lý, chủ đầu tư khi vượt hạn mức quản lý | DOM | Câu hỏi QA W7 (BR-432-01) |
| 2026-10-16 | 2 | Ngoại lệ đêm lẻ cho ở tối thiểu: web/quầy theo căn, OTA chỉ khi mọi căn trống của nhóm đều là đêm lẻ | DOM | Cách thực hiện ESC-004 M-A |
| 2026-10-16 | 2 | Khách không cọc online được: đơn không cọc chỉ khi đến trong 2 ngày, quản lý duyệt, giữ đến 18:00 ngày đến | DOM | Cách thực hiện ESC-006 A dòng 8 |
| 2026-10-16 | 2 | Loại hình: doanh nghiệp – CTCP UTMG Living, hóa đơn GTGT; khóa TTLock; tài khoản VietQR cá nhân là rủi ro kế toán – hỏi kế toán (ESC-008) | INV (thông tin) | INV 16/10 |

---

## 18. Lịch sử thay đổi

### v0.3 – 16/10/2026 (Round 2, Tuần 1 – áp quyết định INV, sửa BUG-R2-001…003)
Nguồn: INV đồng ý 13 ESC theo phương án đội (decision-log 16/10); thông tin INV gửi 16/10 qua ORC; `rounds/round-02/qa/bug-list.md`.

**Đổi giá trị mặc định (mục 13)**
| Khóa | v0.2 | v0.3 | Căn cứ |
|---|---|---|---|
| `weekend_uplift_channels`, `special_uplift_channels` (mới) | +15%/+30% chỉ ghi cho OTA; Trực tiếp = giá niêm yết | **mọi kênh** kể cả Trực tiếp/CTV | ESC-004 A dòng 2 |
| `min_stay[]` | 1 đêm (tắt) | **2 đêm** khi đến T6, T7, ngày đặc biệt – bật; ngoại lệ đêm lẻ | ESC-004 M-A |
| `base_occupancy` → `room.<no>.base_occupancy` | 2 cho mọi căn | Studio 2; 301, 401: 4; 302, 402: 3 | INV 16/10 |
| `room.<no>.max_occupancy` | 3 / 4 / 4 theo nhóm | định mức + 1: Studio 3; 301, 401: 5; 302, 402: 4 (tạm) | INV 16/10 + ESC-014 |
| `service_fee.<group>` | áp mọi HĐ | HĐ mới; HĐ đang chạy = 0 | ESC-005 A dòng 3 |
| `late_grace_until` | 12:00 (không ân hạn) | **12:30** (khi căn không có khách đến) | ESC-007 A |
| `checkout_reminders` | báo đỏ 12:00 | 12:00 nếu có khách đến; 12:31 nếu không | theo ESC-007 A |
| `birthday_code_random_digits` | 3 (2 nếu khóa giới hạn thử sai) | **3** | ESC-011 A |
| `business_entity_type` | chờ INV | `enterprise` (CTCP UTMG Living) | INV 16/10 |
| Mới: `force_majeure_reschedule_months`, `no_deposit_max_lead_days`, `no_deposit_hold_until`, `foc_approval_push_roles`, `min_stay_orphan_night_exception`, `room.<no>.bed_config`, `door_lock_vendor`, `payment_receiving_account.owner_type`, `deposit_base` | – | 3; 2; 18:00; xem BR-432; bật; xem BR-110; TTLock; individual; tiền phòng | ESC-006, INV 16/10, DOM |

**Quy tắc sửa**
| Mã | Thay đổi | Nguồn |
|---|---|---|
| Mục 0.1 | Thêm nhãn "INV quyết ESC-xxx 16/10"; nhãn GIẢ ĐỊNH chỉ còn cho việc chưa quyết hoặc chờ INV gửi thông tin | ORC |
| BR-104 | Lịch giá áp mọi kênh; công thức, thứ tự ưu tiên không cộng dồn, khoảng ngày gồm hai đầu; ví dụ số (đóng `notCovered` BR-104 của QA) | ESC-004 |
| BR-107, 108, 305, 903 | Ví dụ tính lại vì đêm T6/T7 kênh Trực tiếp nay +15%: 7 đêm 5.205.000; 14 đêm 9.826.000; 20 đêm 14.066.000; cọc 1.600.000; hoa hồng 416.400 | ESC-004 |
| BR-110 | Viết lại theo định mức từng căn; trẻ dưới 6 không tính; ví dụ mới | INV 16/10 |
| BR-113 | Bật mặc định; ngoại lệ đêm lẻ | ESC-004 M-A, BUG-R2-001 |
| BR-204, 903 | Đóng Q-D1, Q-D2 | ESC-005 |
| BR-305 | Cọc tính trên tiền phòng, không gồm phụ thu người | Câu hỏi QA |
| BR-309 | Thêm bất khả kháng | ESC-006 dòng 7 |
| BR-321 | Mã nhóm `NH-00012` (khớp erd `NH-{n:05}`); gợi ý căn có thật (101, nâng hạng 301) | BUG-R2-002 |
| BR-007 | Thêm mã nhóm đơn `NH-` | Khớp erd |
| BR-403 | Giữ 3 số ngẫu nhiên; khóa TTLock | ESC-011, INV 16/10 |
| BR-412, 425 | Ân hạn 12:30, ân hạn không dời mốc bậc; ví dụ 12:30/12:31; nhắc quá giờ theo ân hạn | ESC-007, BUG-R2-001 |
| BR-415, 417, 421 | Ghi rõ thứ trong tuần của đêm ví dụ (vì lịch giá cuối tuần) | ESC-004 |
| BR-432 | Định tuyến gồm chủ đầu tư; thông báo đẩy | Câu hỏi QA |
| BR-433 | Ví dụ mới (trả muộn 17:00 căn 401 = 521.000 → quản lý); ghi rõ đêm trước 06:00 là giảm giá đặc biệt | BUG-R2-003 |
| BR-521, 524 | Tài khoản nhận cá nhân (rủi ro, hỏi kế toán); loại hình doanh nghiệp, hóa đơn GTGT | INV 16/10 |
| BR-527 | Cách giữ đơn không cọc | ESC-006 dòng 8 |
| BR-611 | Ca tối T-A | ESC-010 |
| BR-803 | Ví dụ 204 → 202 | BUG-R2-002 |
| Mục 8, 15 | Ghi chú ESC-001: giữ mặc định pháp lý tới khi luật sư rà | ESC-001 |
| Mục 16, 17 | Đánh dấu đã quyết; dòng decision-log đề xuất v0.3 | – |
| Nhãn | Đổi sang "INV quyết ESC-xxx 16/10": BR-005, 009, 101, 103, 104, 107–110, 113, 201–204, 206–208, 212, 214, 302–306, 309, 311, 313, 314, 322–324, 326, 403, 411–413, 415, 427, 428, 433, 435, 436, 501, 505, 506, 523, 527, 611, 704, 807, 903 (một phần với các ô ghi kèm). **Giữ GIẢ ĐỊNH**: BR-004, 105, 111, 112, 205, 207 (mốc nhắc), 210, 211, 312 (chi phí bồi thường), 401, 417 (giá đêm thêm), 421, 423, 425, 503, 504, 507 và 512 (chờ INV gửi bảng giá), 511, 513, 525, 701, 808, 809, 811, 901, 964, mùa cao điểm BR-104, sức chứa tối đa BR-110 | – |

### v0.2 – 15/10/2026 (Round 1, Bước 4 – phản hồi review BA, PO và 21 lỗi tự nhận DOM-on-PO mục B)
Nguyên tắc: **mã BR cũ giữ nguyên, không đánh số lại**; quy tắc mới dùng số mới.

**Quy tắc mới**
| Mã | Nội dung | Nguồn |
|---|---|---|
| BR-010 | Ngày nghiệp vụ đổi lúc 06:00 | BA-DOM-09, DOM-PO-04 (B.11) |
| BR-011 | Đếm số ngày báo trước (ngày mốc cho hủy, trả sớm, chấm dứt HĐ) | BA-DOM-07 |
| BR-113 | Ở tối thiểu (min stay), mặc định tắt | DOM-PO-13 (B.16) |
| BR-315 | Khôi phục no-show (FD tự làm khi đủ 3 điều kiện) | BA-DOM-09, SQ-1 (B.12) |
| BR-316 | Tự gán căn cho đơn OTA (chỉ trong nhóm) | ARC E2, DOM-INT-01 (B.15) |
| BR-317 | Xử lý xung đột OTA: thời hạn, đồng bộ lỗi kéo dài, ghi nhận | DOM-INT-01 (B.15) |
| BR-321…326 | Đơn nhóm / đoàn nhiều căn: tạo nhóm, cọc chung, danh sách khách, hủy một phần, bill gộp/tách, hoa hồng nhóm | DOM-PO-02 (B.16) |
| BR-417 | Nhận phòng trước 06:00 = thêm đêm hôm trước (đơn trực tiếp thêm đêm; đơn OTA tạo đơn con Trực tiếp) | DOM-PO-03, DATA (B.6) |
| BR-436 | Lễ tân tự miễn FOC minibar trong hạn mức lần + tháng | BA-DOM-02, SQ-3 (B.8, B.9) |
| BR-526 | Đóng ca / chốt ngày | DOM-PO-06, DOM-BA-03 (B.16) |
| BR-527 | Chuyển khoản ghi tay "chờ đối soát"; không nhận tiền mã hóa; khách không cọc online được | DOM-PO-06, DOM-PO-10 |
| BR-613 | Hệ quả khi kiểm giấy tờ NN "Không đạt" | PO-DOM-04 |
| BR-961…964 | Vận hành khi mất mạng / mất điện | DOM-BA-04 (B.16) |

**Quy tắc sửa**
| Mã | Thay đổi | Nguồn |
|---|---|---|
| BR-003 | Trỏ tới BR-417 và BR-010 | B.6 |
| BR-007 | Phạm vi và chu kỳ đánh số từng loại mã; bill dạng `F26-000123` (liên tục theo cơ sở trong năm) thay `F-yymmdd-nnnn` | ARC M6, BA-DOM-11 (B.2) |
| BR-107 | Ví dụ dùng giá đêm đã làm tròn 792.000 | BA-DOM-15 |
| BR-110 | Sức chứa là thuộc tính từng căn, nhóm chỉ là mặc định; tuổi tính tại ngày đến; thêm người giữa kỳ; đơn OTA; ví dụ trẻ 8 tuổi | ARC M7, BA-DOM-12 (B.3), DOM-PO-05 |
| BR-208, BR-212 | Ví dụ hoa hồng 5.342.400 (đợt 2.671.200); lịch chi gộp theo tháng | QA, SQ-4 (B.14, B.21) |
| BR-215 | Chia theo số đêm của **tháng hợp đồng** (bỏ "tháng lịch"), ví dụ HĐ bắt đầu giữa tháng | DATA, PO-DOM-09 (B.7) |
| BR-303 | Gia hạn giữ chỗ vẫn bị trần 12:00 ngày đến | BA-DOM-14 |
| BR-308 | Danh mục mã lý do hủy `cancel_reason_code` (có `guest_cancelled`) | DATA (bước 4) |
| BR-309, 313, 314, 428 | Đếm ngày báo trước theo BR-011, ví dụ đúng biên; BR-428 đổi "≥ 24 giờ" thành "≥ 1 ngày" | BA-DOM-07 |
| BR-311 | Theo ngày nghiệp vụ; trỏ BR-315 | B.12 |
| BR-312 | Viết lại đủ 7 điểm ưu tiên khi đơn OTA và trực tiếp trùng căn | DOM-INT-01 (B.15) |
| BR-402, BR-803 | Ngoại lệ nhận phòng khi buồng VD/CL (lễ tân trưởng+, căn → OD, dọn ưu tiên); không áp cho đổi phòng khách đang ở | BA-DOM-04 |
| BR-403 | Mã sinh nhật ddmm + ≥ 3 số ngẫu nhiên | SEC TM-38, DOM-PO-08 (B.10) |
| BR-404 | "Hôm nay" = ngày nghiệp vụ | B.11 |
| BR-411, BR-412 | Bỏ bậc 100%: trước 06:00 → BR-417 (đêm bán); sau 18:00 → gia hạn; ân hạn có điều kiện "không có khách đến cùng ngày" | BA-DOM-14, DATA (B.6) |
| BR-415 | Cơ sở phụ thu sớm/muộn của đơn OTA = giá Trực tiếp hiện hành | PO-DOM-03 |
| BR-427 | Tách thành điều kiện / hệ quả / phát sinh sau trả phòng / không trả → công nợ / thời điểm hóa đơn | BA-DOM-05 |
| BR-432, BR-433, BR-704 | Ví dụ không cho người gửi chọn người duyệt; định tuyến tự động; ngoại lệ tự áp trong hạn mức; hạn mức tháng của lễ tân | BA-DOM-02 (B.8, B.9) |
| BR-523, BR-524 | Thuế suất có ngày hiệu lực; loại hình kinh doanh; phát hành theo sự kiện nghiệp vụ, không theo từng lần thu | DOM-PO-09, DOM-INT-02 (B.20) |
| BR-602 | "Ngày đến" = ngày lịch của giờ đến thực tế; ví dụ đến sau nửa đêm | BA-DOM-01 |
| BR-603 | Hạn khách NN = giờ đến thực tế + 12 giờ, **bỏ mốc 23:00 cho khách NN** (khách VN giữ 23:00); định nghĩa "giờ đến"; ví dụ 21:30 → 09:30, 23:40 → 11:40, 01:30 → 13:30; chế độ `hours_only` mặc định | ARC M1, QA #4, BA-DOM-01, PO-DOM-02 (B.1) |
| BR-605 | Nhắc gia hạn thị thực: dài hạn 30 ngày, ngắn ngày 14 ngày | B.19 |
| BR-607 | Đủ danh sách trạng thái SM-05, thêm `void` | QA #10, BA-DOM-10, PO-DOM-05 (B.5) |
| BR-609 | Xóa ảnh ngay khi khai báo `confirmed` (hoặc `void`); 24 giờ là hạn trên cho job dự phòng (theo SEC) | BA-DOM-06, PO-DOM-06 (B.17) |
| BR-611 | Khai ca tối trên thiết bị của cơ sở; khóa mốc nhắc | ORC phân xử, B.18 |
| BR-612 | Tham số ngưỡng tuổi bảo vệ dữ liệu trẻ em (dưới 16, chờ luật sư) | BA-DOM-09, B.18 |
| BR-802 | Khóa `hk_self_inspection_enabled` | B.18 |
| BR-804 | Khối OOO nửa mở [bắt đầu, ngày mở bán lại); mở bán lại = ngày xong + 1; đọc lại BL 4.4 | QA #1, BA-DOM-03, PO-DOM-01 (B.4) |
| BR-805 | VI quá 3 ngày → VC; đủ 72 giờ là quá | BA-DOM-13, PO-DOM-08 |
| BR-809 | Mức Cao không dừng hạn; TB/Thấp dừng khi chờ vật tư có ngày dự kiến | SQ-2 (B.13) |
| BR-811 | Giờ trực [07:00, 22:00) | BA-DOM-13 |
| BR-903 | Lịch chi gộp theo BR-212 | B.14 |
| Mục 0.2 | Thêm nguyên tắc 4 (không có khóa thì không dùng trong code) và 5 (quy ước biên khoảng thời gian) | BA-DOM-08 |
| Mục 13 | Thêm hơn 40 khóa còn thiếu (gồm `business_day_rollover`, `registration_deadline_foreigner_mode`, `registration_reminder_before_minutes`, `post_checkout_charge_hours`, `hk_self_inspection_enabled`, `minor_data_age_threshold`, `id_image_purge_max_hours`, `late_grace_requires_no_same_day_arrival`, `ooo_reopen_buffer_days`, `s2_shift_end_buffer_minutes`…) | ARC M2, BA-DOM-08 (B.18), DATA |
| Mục 14 | S3, S7, S8, S10 sửa; thêm S11 (đoàn), S12 (đóng ca) | B.1, B.16 |

### v0.1 – 15/10/2026 (Round 1, Bước 2)
Bản đầu: 129 quy tắc, khoảng 60 tham số, 10 tình huống, nghĩa vụ pháp lý, phương án câu hỏi BL mục 9.
