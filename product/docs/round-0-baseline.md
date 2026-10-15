# OTTIMO Desk – Đặc tả ngược từ bản prototype (Round 0 · Baseline)

> Nguồn: file HTML một trang "OTTIMO Desk" (2.173 dòng, bản vibe-code của chủ đầu tư).
> Mục đích: làm điểm xuất phát chung cho nhóm agent (PO, BA, chuyên gia nghiệp vụ, designer, kiến trúc sư, QA) khi dựng lại thành app production.
> Quy ước: mọi con số và quy tắc dưới đây lấy đúng từ code. Chỗ nào code mâu thuẫn hoặc chỉ là số cứng (hardcode) thì có ghi chú **[HC]** (hardcode) hoặc **[LỆCH]** (không khớp công thức).
> Ngày tham chiếu trong code: `T0 = 15/10/2026` (Thứ Năm). Mọi ngày trong dữ liệu mẫu lưu dưới dạng *độ lệch ngày* so với T0 (`s`, `e`, `d`, `due`…).

---

## 1. Tổng quan

| Hạng mục | Nội dung |
|---|---|
| Sản phẩm | Phần mềm quản lý vận hành (PMS mini + CRM + sale + kênh OTA + app khách) cho **OTTIMO Boutique Stay**, Đà Lạt, Lâm Đồng |
| Quy mô | **10 căn hộ / phòng**, chia 3 nhóm: "Lầu 1–2" (6 căn), "Căn N" (2 căn), "Căn N+" (2 căn) |
| Mô hình kinh doanh | Lai: **ngắn ngày** (theo đêm, bán qua OTA + trực tiếp) và **dài hạn** (hợp đồng 1–24 tháng, thu theo kỳ, điện nước theo công tơ). Mục tiêu 4–6 căn dài hạn để giữ nền công suất, phần còn lại bán ngắn ngày để kéo ADR |
| Công nghệ prototype | Một file HTML duy nhất, CSS + JavaScript thuần (IIFE, không framework), render bằng chuỗi template `innerHTML`. Dữ liệu mẫu nằm trong biến JS trong bộ nhớ; tải lại trang là mất hết. Không backend, không API, không lưu trữ (kể cả localStorage). Font tải từ Google Fonts |
| Kiến trúc code | Phát triển theo "lớp" v1 → v8: các bản sau ghi đè hàm cũ (monkey-patch: `R.dash`, `R.fo`, `R.rpt`, `R.guests`, `bookingDrawer`, `phone`, `createGuest`). Nhiều listener `document.addEventListener('click')` cùng xử lý một `data-*` (ví dụ `data-regsave` có 2 handler) |
| Ngày demo | Thứ Năm 15/10/2026; có "giờ demo" chuyển được 09:30 / 11:05 (mặc định) / 12:20 |
| Ngôn ngữ UI | Tiếng Việt; bill song ngữ Việt/Anh khi khách nước ngoài; app khách dự kiến thêm Anh, Hàn, Trung |
| Điều hướng | Sidebar trái (desktop) + thanh tab dưới (≤900px). Hỗ trợ deep-link bằng `#hash` = mã màn hình |

---

## 2. Vai trò người dùng và quyền xem (ROLEV)

Bộ chọn "Xem với vai trò" trên topbar. Đây chỉ là **ẩn/hiện menu**; không có đăng nhập, không có phân quyền dữ liệu hay hành động.

| Màn hình (mã) | Chủ đầu tư `owner` | Lễ tân `fo` | Buồng phòng `hk` | Sale / CTV `sale` | Khách `guest` |
|---|:-:|:-:|:-:|:-:|:-:|
| Tổng quan `dash` | ✔ | ✔ | | | |
| Lễ tân `fo` | ✔ | ✔ | | | |
| Giấy tờ & khai báo `reg` | ✔ | ✔ | | | |
| Buồng phòng `hk` | ✔ | ✔ | ✔ (mặc định) | | |
| Bảo trì `mt` | ✔ | ✔ | ✔ | | |
| Kho F&B `fnb` | ✔ | ✔ | ✔ | | |
| Khách hàng CRM `guests` | ✔ | ✔ | | ✔ | |
| Sale & báo giá `sales` | ✔ | | | ✔ (mặc định) | |
| Kênh OTA `ota` | ✔ | ✔ | | | |
| Báo cáo `rpt` | ✔ | | | ✔ | |
| App khách `gapp` | ✔ | ✔ | | | ✔ (duy nhất) |

Nhóm menu: **Vận hành** (dash, fo, reg, hk, mt, fnb) · **Khách & doanh thu** (guests, sales, ota, rpt) · **Trải nghiệm khách** (gapp).
Khi đổi vai mà màn hình hiện tại không được phép → chuyển về màn hình đầu tiên trong danh sách của vai đó.

Nhân sự xuất hiện trong dữ liệu mẫu: Chị Lan, Chị Mai (buồng phòng); Lễ tân Hạnh / Lễ tân trưởng Hạnh; Anh Tùng (kỹ thuật); NV Hạnh (sale nội bộ); CTV Minh Anh; Quản lý anh Hoàng Anh; "Giám sát".

**Mâu thuẫn quyền:** mục "Lưu trữ giấy tờ" ghi *"Buồng phòng, sale và CTV không thấy giấy tờ"*, nhưng vai Sale vẫn vào CRM và thấy ô "Khoá định danh → Giấy tờ" (loại + số giấy tờ đã che một phần). Vai Sale còn xem được báo cáo Lãi lỗ; vai Buồng phòng xem được giá vốn kho.

---

## 3. Danh sách màn hình và phân hệ

### 3.1 Khung chung (shell)
- **Sidebar** (232px): logo chữ "OTTIMO" + "BOUTIQUE STAY · DESK", menu có icon, chân trang "Bản demo giao diện · dữ liệu mẫu · Hôm nay: Thứ Năm 15/10/2026".
- **Topbar** (dính trên cùng): tiêu đề màn hình (font serif), huy hiệu "Demo · dữ liệu mẫu", chọn vai.
- **Mobile ≤900px**: ẩn sidebar, có thanh tab cuộn ngang ở đáy với nhãn rút gọn (F&B, Giấy tờ, CRM, Sale, OTA).
- **Lớp phủ `#layer`**: chứa drawer bên phải (chi tiết đơn), modal giữa màn hình, toast (tự tắt sau 2,8 giây, `role=status`). Phím Esc hoặc bấm nền tối để đóng.

### 3.2 Tổng quan – `dash`
- **Thẻ "Khách trả phòng hôm nay chưa trả"** (từ v5, cũng hiện ở màn Lễ tân) – xem 3.3b.
- **4 KPI**:
  - Công suất đêm nay = số căn có khách đêm nay / 10 (kèm số căn khoá). Dữ liệu mẫu: 6/10 = 60%, 1 căn khoá.
  - ADR tháng 10 = **891.000 đ [HC]**, "▲ 2,3% so với tháng 9" [HC].
  - RevPAR tháng 10 = doanh thu 1–14/10 ÷ 140 đêm-phòng (≈ 732k).
  - Doanh thu 1–14/10 = tổng 14 ngày cuối của `OCC30` (115 đêm) × 891.000 ≈ 102,5 tr; "▲ 12% cùng kỳ T9" [HC].
- **Hôm nay**: 2 cột Khách đến / Khách đi. Mỗi dòng: số căn, tên khách (mở drawer), kênh · số đêm · số khách · giờ đến; nút "Nhận phòng" (đơn `cf`) hoặc "Trả phòng" (đơn `in`), hoặc chip "Đã nhận" / "Đã trả".
- **Biểu đồ công suất**: cột SVG 30 ngày qua (`OCC30`, số cứng) + 14 ngày tới (tính từ đơn đã đặt, màu nhạt), đường đứt "Hôm nay", tooltip khi rê chuột. Mục tiêu tháng 10: **80%**.
- **Cần chú ý**: 4 dòng cứng [HC] (VIP căn 302; căn 401 khoá; thu tiền quý Daniel 1/11 – 36,0 tr; HĐ Emma hết hạn 4/12, chào gia hạn trước 4/11) + 1 dòng tính được: số đơn chưa khai báo lưu trú (đơn có `s≤0`, trạng thái none/partial/review/scanned), "Hạn 23:00 hôm nay. Thêm 1 cảnh báo thị thực (căn 102)" [HC].
- **Việc trong ngày**: số việc buồng phòng chưa xong, số phiếu sửa chữa đang mở ("1 phiếu mức độ cao" [HC]), số yêu cầu từ app khách. Bấm để chuyển màn hình.

### 3.3 Lễ tân – `fo`
**a) Sơ đồ phòng (room rack)**: lưới 10 căn × 14 ngày (từ T0−2 đến T0+11), cột hôm nay tô màu. Đầu dòng: số căn, tên căn, chip trạng thái buồng. Mỗi đơn là một thanh (button) trải từ ngày đến tới ngày đi, bấm mở drawer. Loại thanh: Đang ở (đậm), Đã xác nhận (vàng đồng), HĐ dài hạn (xanh xám), Giữ chỗ chờ cọc (viền đứt), Đã trả phòng (xám), Khoá phòng (sọc đỏ). Nút "+ Đặt phòng mới".
Danh sách dưới rack: 3 tab "Khách đến (n) / Khách đi (n) / Đang ở (n)".

**b) Thẻ khách trả phòng hôm nay chưa trả** (đơn `e=0` và `st=in`):
- Chọn "giờ demo" 09:30 / 11:05 / 12:20.
- Trạng thái (`depState`): đã trả lời giờ trả → xanh; trả muộn đã chốt → hiện phí/FOC; nếu chưa trả lời: trước 11:00 "Đã nhắc, chờ khách trả lời"; 11:00–11:59 "Chưa trả lời · lễ tân gọi xác nhận"; từ 12:00 "Quá giờ trả phòng X phút". Viền thẻ đổi màu theo trạng thái tệ nhất.
- Thông tin: SĐT, khách kế tiếp của căn, số đêm tối đa có thể ở thêm (≤7), nhật ký nhắc.
- Nút: Ở thêm (khoá nếu không còn đêm trống), Trả muộn, Xác nhận giờ trả, Nhắc lại (ghi log "Zalo + app"); khi đã chốt thì chỉ còn "Trả phòng".
- Mục "Quy tắc nhắc tự động" (xem 5.9).

### 3.4 Drawer chi tiết đơn (bookingDrawer)
- Đơn khoá phòng (`ooo`): tên căn, chip "Khoá phòng", lý do, khoảng ngày, "Phiếu WO-031" [HC].
- Đơn thường: mã đơn · kênh, tên khách; thanh tiến trình 5 bước – ngắn ngày: *Đặt/báo giá → Giữ chỗ → Đã cọc → Nhận phòng → Trả phòng*; dài hạn: *Báo giá → Giữ chỗ → Ký HĐ & cọc → Nhận phòng → Thu theo kỳ*. Chip trạng thái, quốc tịch, tag, trạng thái khai báo.
- Bảng thông tin: căn (nhóm), ngày đến/đi kèm thứ, số đêm, số khách, sở thích, ghi chú.
- **Folio**:
  - Giữ chỗ: tiền thuê/tiền phòng, cọc cần thu, hạn giữ chỗ, cách thanh toán.
  - Dài hạn: tiền thuê tháng, gói dọn, ký quỹ đang giữ, điện nước "Theo công tơ".
  - Ngắn ngày: tiền phòng (số đêm gốc × giá), các dòng phát sinh (`b.fnb`: minibar, phụ thu, gia hạn, FOC âm), trừ "Đã cọc / đã thu", "Còn phải thu" (hoặc "Đã thanh toán đủ" khi đã trả phòng).
- **Nút hành động theo trạng thái**: Xác nhận đã nhận cọc / Huỷ giữ chỗ (`hold`); Nhận phòng (`cf` và đến hôm nay); Trả phòng (`in` và `e≤0`); Gửi link check-in online (`cf`); Kiểm minibar (`in` và `e>0`); Giấy tờ & khai báo (`in`/`cf` và `s≤0`); Xem bill (đã có bill); Mở hồ sơ khách.
- **Khách trong đơn** (v8): danh sách người đặt (chip "Đứng tên · thanh toán"), người đi cùng (quan hệ, có/chưa có liên hệ, có/chưa đồng ý ưu đãi, trạng thái link mời), trẻ em (năm sinh, "chỉ dùng để khai báo lưu trú"). Cột "phân bổ" = doanh thu đơn ÷ số người lớn. Dòng cảnh báo "Thiếu n" nếu số người khai < số khách đơn. Nút "+ Thêm người đi cùng", "Gửi link check-in cho cả nhóm", "Gửi link mời" từng người.

### 3.5 Modal Đặt phòng mới (newBookingModal – bản v7)
- Trường: Căn (mặc định 203), Kênh (5 kênh đầu của `CH`: Trực tiếp, Airbnb, Booking.com, Agoda, CTV / môi giới – **không có HĐ dài hạn**), Ngày đến (min 15/10/2026, max 31/12/2026), Số đêm (1–60, mặc định 2), Số khách (1–6, mặc định 2), Giá/đêm (trống = giá niêm yết làm tròn nghìn), Mã đặt phòng OTA (chỉ hiện khi kênh là OTA).
- Bộ chọn khách (guestPicker – xem 3.14).
- Kiểm tra: ngày đến ≥ hôm nay; số đêm ≥1; không trùng lịch với đơn khác chưa trả/chưa huỷ (kể cả khoá phòng) – báo tên khách và khoảng ngày trùng; kênh Trực tiếp/CTV bắt buộc có SĐT; SĐT ≥9 chữ số; email đúng dạng; không trùng SĐT/email hồ sơ có sẵn.
- Khi lưu: tạo đơn `OTM-0{OSEQ}` (bắt đầu 170), trạng thái `cf`, `dep=0`; tạo bản ghi khai báo `REG` (need = số khách); ghi nhật ký đồng bộ "Desk → 7 kênh: đóng căn…"; gắn mã OTA vào hồ sơ khách nếu chưa có.

### 3.6 Modal Nhận phòng (ciModal)
- Cảnh báo nếu buồng chưa ở trạng thái VC/VI.
- Giờ nhận thực tế (mặc định = giờ demo nếu trước 14:00, ngược lại 14:00) → tự tính phụ thu nhận sớm (5.6). Khối FOC (5.7).
- Lưu: đơn → `in`, buồng → `OC`, ghi giờ nhận, ghi phụ thu (và dòng FOC âm + `FOCLOG`) vào folio. Toast nhắc "nhớ khai báo trước 23:00" nếu chưa khai báo.

### 3.7 Modal Trả phòng (mbModal chế độ `co`) → Bill (billModal) – quy trình 3 bước
1. **Kiểm minibar & F&B**: bảng 10 mặt hàng, nhập "số còn lại" (0…chuẩn), tự tính số đã dùng và tiền (đồ miễn phí ghi "Miễn phí").
2. **Phụ phí**: Giặt ủi, Đồ ăn gọi thêm/bếp, Hư hỏng mất đồ (bước nhảy 10.000 đ), Giờ trả phòng thực tế (mặc định giờ trả muộn đã hẹn, hoặc giờ demo nếu sau 12:00, ngược lại 11:30) → phụ thu trả muộn tự tính; khối FOC; Cách thanh toán (Chuyển khoản QR / Thẻ / Tiền mặt / Đã thu qua OTA). Bảng tóm tắt "Còn phải thu".
3. **Xem bill & thu tiền**: hiện bill (3.8), tuỳ chọn "Khách lấy hoá đơn GTGT ghi tên công ty" (Tên công ty, MST 10 hoặc 13 số, email). Nút "← Sửa lại" và "Đã thu X đ · hoàn tất trả phòng".
- Hoàn tất (`finishCheckout`): ghi minibar vào folio + nhật ký kho; ghi phụ phí; ghi trả muộn và FOC (+`FOCLOG`); đơn → `out`, lưu bill; buồng → `VD`; cập nhật tồn minibar căn; tự tạo việc "Dọn trả phòng" (Chị Lan) nếu chưa có, và việc "Bổ sung minibar" kèm danh sách hàng; mở lại bill ở chế độ "đã thu" với dấu "ĐÃ THU ĐỦ".

### 3.8 Bill / phiếu thanh toán (billHTML)
- Đầu: logo "OTTIMO · BOUTIQUE STAY · ĐÀ LẠT", "MST: (điền khi đăng ký)", tiêu đề "Phiếu thanh toán / Guest folio", số `F-261015-{4 số cuối mã đơn}`, thời điểm `15/10/2026 11:42` [HC], thu ngân "Lễ tân Hạnh" [HC].
- Meta: khách, căn, nhận–trả (kèm giờ thực tế), mã đặt phòng · kênh.
- Bảng: mỗi đêm một dòng tiền phòng (chỉ ngắn ngày); dòng phát sinh đã ghi folio; minibar lần này; giặt ủi/đồ ăn/hư hỏng; trả muộn và dòng FOC âm; dòng "Đồ miễn phí" giá 0.
- Tổng cộng, trừ đã cọc (dài hạn = 0), "Còn phải thu" / "Đã thanh toán". "Giá đã bao gồm thuế GTGT". Khách nước ngoài: song ngữ + quy đổi USD theo tỷ giá **26.200** [HC].
- Nếu chuyển khoản và chưa thu: mã QR giả (`fakeQR`) + nội dung CK = số bill bỏ gạch.
- Sau khi thu: khối "Hoá đơn điện tử" (công ty + MST hoặc "Khách lẻ"), mã tra cứu `K26TOT` + 6 số cuối timestamp, gửi tới email.
- Chân bill: mã đặt trực tiếp lần sau **OTTIMO-BACK5 giảm 5%**.
- Ở chế độ đã thu: nút Gửi qua email / Zalo-WhatsApp (chỉ toast), ghi chú bản thật cần in máy in bill / tải PDF.

### 3.9 Modal Gia hạn (extModal)
- Chọn số đêm ở thêm 1…`max` (max = số đêm liên tiếp còn trống, tối đa 7); giá mỗi đêm mặc định = giá niêm yết căn làm tròn 10.000 (không phải giá đơn).
- Liệt kê từng đêm "Trống"; gợi ý căn trống cùng nhóm nếu muốn ở lâu hơn.
- Đơn OTA (Airbnb, Booking.com, Agoda, Expedia, Trip.com): cảnh báo "phần gia hạn thu trực tiếp tại OTTIMO, không sửa đơn trên OTA… không mất 18% (Agoda) / 15% (còn lại) phí kênh".
- Lưu: kiểm tra trùng lần nữa; `b.e += n`; nếu giá khác giá đơn hoặc đơn OTA → thêm dòng folio "Gia hạn n đêm… thu trực tiếp" và tăng `extN`; buồng → `OD`; đổi việc "Dọn trả phòng" thành "Dọn phòng khách đang ở"; ghi log đồng bộ đóng phòng.

### 3.10 Modal Trả muộn (lateModal) và Xác nhận giờ trả (timeModal)
- Trả muộn: cảnh báo nếu có khách đến căn đó hôm nay; giờ trả (mặc định 15:00) → phụ thu theo bậc (5.6); FOC. Lưu vào đơn (`lateT`, `lateFoc`, lý do, người duyệt) và nhật ký nhắc; sửa ghi chú việc dọn "dọn sau giờ này".
- Xác nhận giờ trả: chọn 10:00 / 10:30 / 11:00 / 11:30 (mặc định) / 12:00 + ghi chú → ghi log "Gọi điện, khách trả lúc…".

### 3.11 Giấy tờ & khai báo lưu trú – `reg`
- **4 KPI**: Cần xử lý hôm nay (đơn `s≤0` chưa xong; hạn 23:00), Đã gửi khai báo (sent + confirmed / tổng đơn), Cảnh báo thị thực, "Ảnh giấy tờ tự xoá 30 ngày sau trả phòng (đề xuất)".
- **Quy trình 5 bước**: Quét (QR CCCD gắn chip, MRZ hộ chiếu, hoặc khách tải trước qua app) → Đối chiếu → Lưu trữ (mã hoá) → Khai báo lên `tbltkbtt.bocongan.gov.vn` trước 23:00 ngày khách đến → Xác nhận (ghi mã hồ sơ).
- **Bảng "Khách cần khai báo"**: căn, khách (quốc tịch, ngày, cờ cảnh báo thị thực), số giấy tờ đã có/cần, chip trạng thái, hạn (`Khi nhận phòng dd/m` / `Trước 23:00 hôm nay` / `Đã quá hạn`). Bấm chọn dòng.
- **Panel chi tiết**: cảnh báo; khung quét (khi còn thiếu người) với "Chụp hoặc tải ảnh" và "Dùng ảnh mẫu (demo)"; danh sách người (tên in hoa, loại giấy, số che, ngày sinh, quốc tịch, thị thực, ngày nhập cảnh, hạn hộ chiếu, cách đọc); **Đối chiếu tự động** (5.12); ô đồng ý lưu giấy tờ; nút "Lưu và chuyển sang khai báo" (khoá nếu thiếu người) → "Khai báo lên hệ thống Bộ Công an" → "Công an đã xác nhận".
- **Modal khai báo (regSendModal)**: tiêu đề "Khai báo tạm trú người nước ngoài" (nếu có người có thị thực) hoặc "Thông báo lưu trú công dân Việt Nam"; 3 bước: sao chép dữ liệu dạng text, mở cổng Bộ Công an (link ngoài), dán mã hồ sơ (gợi ý `TT-…` cho NN, `LT-…` cho VN). Ghi chú: bán tự động vì chưa thấy Bộ Công an công bố kết nối cho phần mềm ngoài.
- **Khối "Lưu trữ giấy tờ và dữ liệu cá nhân"** (đề xuất, cần luật sư xác nhận) – xem 5.13.

### 3.12 Buồng phòng – `hk`
- Chip đếm theo trạng thái; bộ lọc Tất cả / Cần dọn (VD, OD, CL) / Có khách (OC, OD) / Sẵn sàng (VC, VI).
- **Thẻ mỗi căn**: viền trên màu theo trạng thái, số căn, chip trạng thái, tên căn, thông tin hiện tại (khách đang ở + gói dọn / khách trả phòng hôm nay / lý do khoá / phòng trống), khách đến kế tiếp, nút chuyển trạng thái (5.15), nút "Minibar · thiếu n" khi có khách đang ở.
- **Việc hôm nay**: checkbox, căn, tên việc, ghi chú, người làm, chip "App khách" nếu sinh từ app; đếm x/y đã xong. Tick việc "Bổ sung minibar" sẽ trừ kho và nạp lại tủ.
- **Checklist kiểm phòng 12 điểm** (văn bản tĩnh): ga gối phẳng; phòng tắm khô, không tóc; khăn đủ bộ **2 khăn tắm, 2 mặt, 1 chân**; amenity đủ, quay nhãn ra; bếp sạch, tủ lạnh trống, có nước suối; bàn làm việc đèn và ổ cắm; **Wi-Fi ≥ 50 Mbps**; rèm trơn, cửa sổ kín; không mùi, đã thông gió; remote, điều hoà/sưởi; thẻ chào và thông tin Wi-Fi; chụp ảnh phòng sau kiểm.

### 3.13 Kiểm minibar giữa kỳ (mbModal chế độ `post`)
Giống bước 1 của trả phòng; lưu: ghi tiền vào folio, cộng `sold`, xuất kho bổ sung tủ về mức chuẩn ngay, ghi nhật ký kho, cập nhật "lần kiểm" của căn.

### 3.14 Bảo trì – `mt`
- **Phiếu sửa chữa**: bảng Mã, Căn, Mô tả (chip "App khách"), Mức độ (Cao / Trung bình / Thấp), Người xử lý, Ngày báo, Trạng thái (dropdown sửa trực tiếp: Mới / Đang xử lý / Chờ vật tư / Xong). Chuyển "Xong" khi căn đang OOO → mở khoá, buồng → VD, xoá đơn khoá phòng của căn.
- **Modal phiếu mới**: Căn, Mức độ (mặc định Trung bình), Mô tả (bắt buộc), "Khoá phòng đến khi sửa xong" (đặt HK = OOO). Người xử lý mặc định "Chưa giao".
- **Bảo trì định kỳ (PM)**: tên việc, chu kỳ, hạn; hạn ≤7 ngày → chip cảnh báo.
- **Chốt số điện nước**: kỳ 1–31/10; nhập chỉ số mới điện/nước cho căn dài hạn; thành tiền tự tính (5.10). Ghi chú "Chốt xong số tự vào hoá đơn tháng và hiện trong app của khách" (chưa làm thật).

### 3.15 Kho F&B – `fnb`
- **4 KPI**: Doanh thu F&B 1–15/10 (minibar, 4,2 tr), Lãi gộp F&B (≈63,6%, giá vốn 1,5 tr), Đồ miễn phí tặng khách (≈0,63 tr, tính vào chi phí phòng), Mặt hàng cần nhập (3: Bia Larue, Mì ly, Vang Đà Lạt).
- **Bảng xuất nhập tồn tháng 10**: Tồn đầu, Nhập, Xuất minibar, Xuất khác, Kiểm kê ±, Tồn cuối, Tối thiểu, Trạng thái (Hết hàng / Cần nhập / Đủ). Dòng tổng giá trị tồn theo giá vốn. Nút "+ Nhập kho", "Xuất kho", "Kiểm kê".
- **Modal kho (stockModal)**:
  - Nhập: mặt hàng, số lượng, giá nhập/đơn vị (nếu nhập thì cập nhật giá vốn – thay thế, không bình quân), NCC + số phiếu.
  - Xuất: số lượng (không vượt tồn), lý do (Xuất bếp/welcome, Hư hỏng/hết hạn, Dùng nội bộ), ghi chú.
  - Kiểm kê: nhập số đếm thực tế, hiện chênh lệch và giá trị chênh lệch; lưu điều chỉnh vào `adj`.
- **Minibar từng căn**: chuẩn mỗi tủ **17 món**; liệt kê món thiếu, lần kiểm gần nhất, tiền chưa ghi folio; nút Kiểm minibar.
- **Bán chạy tháng 10** (thanh ngang) và **Nhật ký kho** (8 dòng gần nhất).

### 3.16 Khách hàng (CRM) – `guests` (bản v7/v8)
- **Cột trái**: tiêu đề "Khách hàng · n", "+ Khách mới"; cảnh báo "n cặp hồ sơ có thể trùng" với nút Gộp (tối đa 3 cặp); chip phân khúc kèm số lượng; ô tìm (tên có/không dấu, SĐT ≥3 chữ số, email, mã KH, tag); danh sách khách (avatar chữ cái đầu, mã KH, quốc tịch, SĐT); ghi chú thứ tự định danh.
- **Cột phải**: avatar, mã KH (+ "đã gộp …"), tên, quốc tịch, tag; nút Sửa thông tin / Gộp hồ sơ / Báo giá. Thanh **độ đầy đủ hồ sơ** (5.17). 4 KPI: Lượt lưu trú (đứng tên / đi cùng), Doanh thu thanh toán, Doanh thu phân bổ, Nguồn khách. **Khoá định danh** 4 ô: SĐT, Email, Giấy tờ, Mã OTA. Thông tin: ngày sinh, ngôn ngữ, liên hệ ưu tiên, công ty/MST, khai báo lưu trú, đồng ý lưu giấy tờ, nhận ưu đãi, ghi chú. **Hay đi cùng** (nhóm hộ `NH-xxxx`). Sở thích. **Dòng thời gian** (sự kiện CRM mẫu + đơn + yêu cầu app).
- **Modal Khách mới / Sửa hồ sơ (guestForm)**: Họ tên (theo giấy tờ), SĐT/Zalo/WhatsApp, Email, Ngày sinh, Quốc tịch (12 lựa chọn: VN, KR, CN, JP, TW, SG, US, UK, FR, DE, AU, Khác), Ngôn ngữ (Tiếng Việt, English, 한국어, 中文, 日本語), Liên hệ ưu tiên (Zalo, WhatsApp, Gọi điện, Email, KakaoTalk), Công ty, MST, Nhóm khách (Khách quen, VIP, Dài hạn, Làm việc từ xa, Kỷ niệm, Gia đình có trẻ em, Tiềm năng), Sở thích (phân cách dấu phẩy), Ghi chú nội bộ, Đồng ý nhận ưu đãi. Số giấy tờ **không nhập tay**, chỉ lấy từ bước quét. Cảnh báo trùng trực tiếp khi gõ, có nút "Gộp vào hồ sơ đó" / "Mở hồ sơ đó".
- **Modal Gộp hồ sơ (mergeModal)**: chọn hồ sơ giữ lại (gợi ý đứng đầu). Xem 5.16.
- **Bộ chọn khách (guestPicker)** dùng chung ở Đặt phòng mới, Tạo đơn từ báo giá, Thêm người đi cùng: ô tìm (tên, SĐT, email, mã KH; ≥2 ký tự; tối đa 5 kết quả) hoặc form tạo nhanh (Họ tên, SĐT, Email, Quốc tịch, Liên hệ ưu tiên) với cảnh báo trùng và nút "Dùng hồ sơ này".

### 3.17 Modal Thêm người đi cùng (partyModal)
- Loại: Người lớn (chọn/tạo hồ sơ qua guestPicker, quan hệ: Vợ/chồng, Người yêu, Gia đình, Bạn, Đồng nghiệp, Chưa rõ; ô "Chính người này đồng ý nhận ưu đãi – không dùng đồng ý của người đặt") hoặc Trẻ em dưới 14 tuổi (họ tên, năm sinh 2010–2026).
- Chặn thêm trùng người. Gán cùng mã nhóm hộ `NH-{số mã KH người đặt}`. Nếu số người > `pax` thì tăng `pax`.

### 3.18 Sale & báo giá – `sales`
- **4 KPI**: Giá trị đang chào (tổng `v` lead chưa chốt), Đơn đang giữ chỗ, HĐ dài hạn đang chạy (x/10 căn, mục tiêu 4–6), Hoa hồng còn phải chi (tổng `com − paid` của hợp đồng).
- **Công cụ báo giá** (form trái, kết quả phải, tính lại tức thì): Tên khách, Căn, Hình thức (Theo đêm / Thuê dài hạn), Loại khách (Việt Nam / Nước ngoài), Kỳ hạn (1 tháng, 3 tháng, 6 tháng, 1 năm, 2 năm), Dọn phòng (Không, 1/tuần, 2/tuần, 3/tuần), Ngày vào ở (min 15/10/2026), Số người (1–6) hoặc Số đêm (1–30), Người chốt (CTV/môi giới hoặc Nhân viên).
  - Kết quả: chip phòng trống/trùng lịch/ngày đã qua; gợi ý tối đa 6 căn trống khác; 3 KPI (khách trả/tháng hoặc tổng tiền phòng + quy USD cho khách NN; ký quỹ hoặc cọc 30%; thu khi chốt); bảng chi tiết; "Sale nhận" (hoa hồng) và "OTTIMO còn lại".
  - Nút: **Lưu báo giá** (tạo `BG-0{QSEQ}` từ 48, cập nhật/tạo lead giai đoạn "Đã báo giá"), **Sao chép gửi Zalo** (văn bản báo giá, "Báo giá có hiệu lực 3 ngày"), **Tạo đơn giữ chỗ →** (khoá nếu trùng lịch hoặc ngày đã qua).
- **Modal Tạo đơn giữ chỗ (orderModal)**: thanh bước Báo giá → Giữ chỗ → Nhận cọc → Nhận phòng; chọn/tạo khách (bắt buộc SĐT); Hạn giữ chỗ 12 / **24 (mặc định)** / 48 giờ; Cách nhận cọc (Chuyển khoản mã QR theo đơn / Thẻ quốc tế link thanh toán / Tiền mặt tại quầy). Lưu: kiểm trùng lại; tạo khách mới với tag "Tiềm năng" + "Dài hạn/Ngắn ngày"; tạo đơn `hold`; chuyển lead sang "Giữ chỗ · chờ cọc"; ghi log khoá căn trên 7 kênh. Ghi chú: hết hạn mà chưa cọc thì tự mở lại phòng (**chưa làm**).
- **Kanban khách tiềm năng** 4 cột: Mới → Đã báo giá → Giữ chỗ · chờ cọc → Đã chốt. Thẻ: tên, nhu cầu, mã BG/đơn, giá trị, người phụ trách, nút (Báo giá → / Mở báo giá / Đã nhận cọc / chip Đã chốt). "Báo giá →" nạp tên + số căn vào công cụ báo giá.
- **Xác nhận cọc (confirmDeposit)**: đơn → `cf`, `dep = depDue`; lead → Đã chốt; bỏ tag "Tiềm năng"; nếu dài hạn → tạo `CONTRACTS` (kỳ tới = ngày vào ở, số tiền = thu khi chốt − ký quỹ, hoa hồng đã chi 0); log đồng bộ.
- **Huỷ giữ chỗ (cancelHold)**: đơn → `cx`, lead quay lại "Đã báo giá", log mở lại phòng.
- **Bảng hợp đồng dài hạn**: khách, căn, kỳ hạn, thời gian, thuê/tháng, ký quỹ, thu kỳ tới (hoặc chip "Chào gia hạn" nếu `nextAmt=0`), sale, hoa hồng đã chi/tổng.

### 3.19 Kênh OTA – `ota`
- **Sơ đồ kiến trúc**: Kênh OTA (Airbnb, Booking.com, Agoda, Expedia, Trip.com, Traveloka, Google) ⇄ Channel manager (ví dụ Beds24 hoặc ezCloud) ⇄ OTTIMO Desk (nguồn dữ liệu chính) ⇄ Kênh trực tiếp (App khách, Website, Zalo). Ghi chú: Airbnb chỉ mở API cho đối tác lớn nên phải đi qua channel manager; **không dùng iCal** (chỉ đồng bộ ngày, chậm, dễ trùng phòng); đơn OTA về tự tạo đơn và hồ sơ, gộp theo SĐT/email/số giấy tờ.
- **Bảng kênh đang bán**: tên, kết nối (Đã kết nối / Chờ duyệt / Chưa kết nối), số căn đã ghép, lần đồng bộ gần nhất, số đơn tháng 10, hoa hồng, công tắc Mở bán (chỉ kênh đã kết nối; bật/tắt ghi log "mở/đóng bán toàn bộ 10 căn").
- **Giá và phòng trống 7 ngày tới**: theo 3 nhóm căn; ô giá sửa được (bước 10.000), dưới là "Còn n" hoặc "Hết phòng" (đỏ). Nút "Đẩy lên tất cả kênh" (ghi log, cập nhật "Vừa xong").
- **Nhật ký đồng bộ** 10 dòng gần nhất.

### 3.20 Báo cáo – `rpt` (4 tab)
- **Vận hành**: bảng chỉ số theo tháng (Tháng 8 [25–31/8]: 39 đêm/70; Tháng 9: 214/300, DT 186,4 tr; Tháng 10 [1–14]: 115/140) + dòng "Tháng 10 đã đặt trước 15–31/10" (trên 170 đêm-phòng, "Còn n đêm-phòng trống cần bán"); biểu đồ công suất; cơ cấu đêm-phòng tháng 9 (**Ngắn ngày 154, Dài hạn 60**); thời gian ở trung bình theo kênh (**Airbnb 3,4; Booking 2,6; Agoda 2,2; Trực tiếp 4,1 đêm**) [HC]; bảng **FOC tháng 10**; khối **Khách lưu trú theo người** (số khách, khách/phòng, doanh thu/khách, % người đi cùng có liên hệ, số khách chưa có thông tin, chỉ số "người đi cùng tự đặt lại").
- **Kênh bán** (tháng 9): doanh thu theo kênh và bảng phí kênh / thực thu (5.11).
- **Lãi lỗ** (tháng 9): KPI Tổng doanh thu, Chi phí vận hành, GOP + biên, GOPPAR; bảng khoản mục (5.11).
- **Đánh giá**: Airbnb **4,92/5 (18)**, Booking.com **9,4/10 (11)**, Google Maps **4,9/5 (23)**; khen: Sạch sẽ 82%, Yên tĩnh 64%, Thiết kế đẹp 58%, Nhân viên 51%, Bàn làm việc 33%; cần cải thiện: Nước nóng 9%, Wi-Fi 6%, Chỗ đậu xe 5% (90 ngày, dữ liệu mẫu). Quy trình xin đánh giá 4 bước (5.18).

### 3.21 App khách – `gapp`
- Khung điện thoại mô phỏng + phần giải thích bên phải ("mở bằng link hoặc QR trong phòng, không cần cài"). Chọn 3 khách mẫu:
  - **Daniel (dài hạn, căn 301)**: Trang chủ (hợp đồng 1 năm 1/8/2026 → 31/7/2027, còn 290 ngày, ký quỹ 22.300.000; lịch dọn 1 lần/tuần, lần tới Thứ Sáu 16/10 9:00–11:00; kỳ thanh toán tới 36.030.000 đ hạn 1/11/2026 quý 2; Wi-Fi OTTIMO_301). Hoá đơn tháng 10: tiền thuê đã trả theo quý; Điện 142 kWh × 3.500 = 497.000; Nước 8 m³ × 25.000 = 200.000; cần thanh toán 697.000 đ [HC]; lịch sử Quý 1 36.030.000, ký quỹ 22.300.000, điện nước T8–T9 1.284.000.
  - **Ji-woo (sắp đến, căn 203, 19–22/10, Booking.com)**: check-in online 3 bước (Giấy tờ: số + ảnh hộ chiếu → Giờ đến 12–14 / **14–16** / 16–18 / sau 18 + ghi chú → Hoàn tất "phòng sẵn sàng 14:00, mã cửa gửi email sáng hôm đó"). Hoàn tất thì đánh dấu khách đã khai báo và đổ dữ liệu mẫu vào REG ở trạng thái "Đã nhận trước qua app". Hoá đơn: 3 đêm × 820.000 = 2.460.000, thanh toán khi nhận phòng. Chỉ đường: sân bay Liên Khương ~45 phút.
  - **Huy (trả phòng hôm nay, căn 201)**: 3 lựa chọn – Trả đúng giờ (ghi 11:30), Ở thêm 1 đêm (giá niêm yết làm tròn 10k, nếu còn trống), Trả muộn đến 15:00 (30% giá đơn = 210.000 đ). Lưu ý trước khi đi: để chìa khoá trên bàn, lễ tân kiểm minibar 5 phút, cần xe sân bay báo trước 1 giờ.
- Tab **Yêu cầu**: 6 loại (5.19), ghi chú, gửi → hiện thẻ "Đã nhận". Tab **Đà Lạt**: Hồ Tuyền Lâm (SUP 6:30, 20 phút), Đồi chè Cầu Đất, Chợ đêm (10 phút đi bộ), 5 quán cà phê; nút nhờ đặt xe/tour.
- Phần nhân viên: "Yêu cầu vừa nhận" (căn, loại, khách, ghi chú, chuyển tới bộ phận nào).

---

## 4. Mô hình dữ liệu (theo prototype)

> Prototype dùng mảng/đối tượng JS. Ngày = số nguyên lệch so với T0. Tiền = VND số nguyên.

### 4.1 `ROOMS` – căn
| Trường | Ý nghĩa |
|---|---|
| `no` | Số căn (101…402) |
| `name` | Tên thương mại ("The Amber"…) |
| `grp` | Nhóm căn: `Lầu 1–2`, `Căn N`, `Căn N+` – quyết định phí dịch vụ, chi phí dọn, giá OTA nền |
| `night` | Giá niêm yết 1 đêm |
| `month` | Giá niêm yết thuê tháng |

| Căn | Tên | Nhóm | Giá đêm | Giá tháng |
|---|---|---|--:|--:|
| 101 | The Amber | Lầu 1–2 | 666.667 | 8.000.000 |
| 102 | The Fern | Lầu 1–2 | 750.000 | 9.000.000 |
| 103 | The Bloom | Lầu 1–2 | 750.000 | 9.000.000 |
| 201 | The Mist | Lầu 1–2 | 708.333 | 8.500.000 |
| 202 | The Valley | Lầu 1–2 | 791.667 | 9.500.000 |
| 203 | The Sage | Lầu 1–2 | 791.667 | 9.500.000 |
| 301 | The Velvet | Căn N | 958.333 | 11.500.000 |
| 302 | The Ivory | Căn N+ | 916.667 | 11.000.000 |
| 401 | The Pine | Căn N | 1.041.667 | 12.500.000 |
| 402 | The Ember | Căn N+ | 1.000.000 | 12.000.000 |

Nhận xét: **giá đêm = giá tháng ÷ 12** ở cả 10 căn (thuê tháng ≈ 12 đêm). Giá đêm có số lẻ (666.667) – cần quy tắc làm tròn.

### 4.2 `G` – hồ sơ khách (guest)
`id`, `code` (`KH-0001`… cấp tuần tự), `name`, `nat` (mã quốc gia 2 ký tự hoặc tự do), `ph`, `em`, `dob` (YYYY-MM-DD), `doc` (mô tả giấy tờ, ví dụ "CCCD", "Hộ chiếu · Visa DN 12 tháng"), `reg` (đã khai báo lưu trú hay chưa – cờ cấp hồ sơ), `tags[]`, `prefs[]` (sở thích/lưu ý phục vụ), `note`, `contact` (kênh liên hệ ưu tiên), `lang`, `mkt` (đồng ý nhận ưu đãi), `company`, `mst`, `otaRef` ("Airbnb · HMX4K2"), `hh` (mã nhóm hộ `NH-xxxx`), `merged[]` (mã các hồ sơ đã gộp vào), `src[]`, `consent`.
Mẫu: 17 khách (g1–g17), trong đó g14 "Do Mai Anh" là hồ sơ trùng cố ý với g12 "Đỗ Mai Anh" (trùng email) để demo gộp.

### 4.3 `CRMX` – dữ liệu CRM bổ sung (g7, g2, g5, g6, g8)
`consent.doc` (đồng ý lưu giấy tờ: ngày + hình thức), `consent.mkt` (nhận ưu đãi), `src[]` (nguồn khách), `tl[]` = [độ lệch ngày, sự kiện] cho dòng thời gian.

### 4.4 `BK` – đơn đặt phòng / hợp đồng / khoá phòng
| Trường | Ý nghĩa |
|---|---|
| `id` | `OTM-0xxx` (đơn), `OOO-xxx` (khoá phòng) |
| `room`, `g` | Căn; khách đứng tên/thanh toán |
| `ch` | Kênh: `Trực tiếp`, `Airbnb`, `Booking.com`, `Agoda`, `CTV / môi giới`, `HĐ dài hạn` (mảng `CH`) |
| `s`, `e` | Ngày đến, ngày đi (đêm cuối là `e−1`) |
| `st` | `hold` giữ chỗ chờ cọc · `cf` đã xác nhận · `in` đang ở · `out` đã trả · `cx` đã huỷ · `ooo` khoá phòng |
| `type` | `short` · `long` · `ooo` |
| `rate` | Ngắn ngày: giá/đêm; dài hạn: tiền thuê/tháng |
| `pax` | Số khách |
| `dep` | Tiền cọc/ký quỹ đã nhận |
| `depDue`, `first`, `hold`, `pay`, `term`, `com` | Thông tin đơn giữ chỗ tạo từ báo giá: cọc cần thu, thu khi chốt, hạn giữ, cách trả, kỳ hạn, hoa hồng |
| `clean` | Gói dọn (dài hạn), ví dụ "2 lần/tuần · T2, T5" |
| `eta` | Giờ đến dự kiến |
| `note` | Lý do khoá phòng |
| `fnb[]` | Dòng phát sinh folio `{n, amt, q, u, d}` (minibar, phụ thu, gia hạn, FOC số âm, giặt ủi…) |
| `extN` | Số đêm gia hạn đã ghi thành dòng folio riêng |
| `ciTime`, `coTime`, `lateT`, `lateFoc`, `lateReason`, `lateBy` | Giờ nhận/trả thực tế, thông tin trả muộn và FOC |
| `bill`, `paid` | Bill đã phát hành, số tiền thu cuối |
| `guests[]` | Thành viên đơn: `{g, role:'booker'|'sharer', rel, inv}` hoặc trẻ em `{name, role:'child', yob}` |
| `otaRef` | Mã đặt phòng trên OTA |

Dữ liệu mẫu: 18 bản ghi ban đầu (16 đơn khách, 1 khoá phòng 401 ngày 0–2, 2 đơn đã trả). Dài hạn: OTM-0108 (Emma, 102, −40→50) và OTM-0091 (Daniel, 301, −75→290).

### 4.5 `HKS` / `HK` – trạng thái buồng
| Mã | Nhãn | Màu |
|---|---|---|
| VC | Trống · sạch | xanh lá |
| VI | Đã kiểm · sẵn sàng | xanh lá |
| VD | Trống · cần dọn | cam |
| CL | Đang dọn | vàng đồng |
| OC | Có khách · sạch | xanh dương |
| OD | Có khách · cần dọn | cam |
| OOO | Hỏng · khoá phòng | đỏ |
`HK` = map số căn → mã trạng thái (lưu riêng, không suy ra từ đơn).

### 4.6 `TASKS` – việc buồng phòng
`id`, `room`, `t` (tên việc), `m` (ghi chú), `who`, `done`, `src` (1 = từ app khách), `refill[]` (danh sách hàng cần bổ sung minibar), `refilled`.

### 4.7 `WO` – phiếu sửa chữa
`id` (`WO-0xx`), `room`, `t`, `p` (Cao/Trung bình/Thấp), `st` (Mới/Đang xử lý/Chờ vật tư/Xong), `who`, `d` (ngày báo), `src`.

### 4.8 `PM` – bảo trì định kỳ
`t`, `due` (độ lệch ngày), `cyc`. Mẫu: Vệ sinh lõi lọc nước tổng (3 tháng, hạn +5), Bảo dưỡng bình nóng lạnh 10 căn (6 tháng, +9), Kiểm tra bình chữa cháy & đèn exit (1 tháng, +16), Giặt rèm, thảm toàn bộ căn (6 tháng, +31). Chưa có cơ chế tạo kỳ kế tiếp.

### 4.9 `METER` – công tơ
`room`, `g`, `eo`/`en` (điện cũ/mới, kWh), `wo`/`wn` (nước cũ/mới, m³). Mẫu: 102 (điện 2140, nước 188), 301 (3312, 254).

### 4.10 `LEADS` / `STAGES` – khách tiềm năng
`id`, `n` (tên – cũng là khoá nối với khách!), `need`, `v` (giá trị = tổng tiền thuê), `who`, `st` (0–3), `src`, `q` (mã báo giá), `bk` (mã đơn giữ chỗ). Giai đoạn: Mới / Đã báo giá / Giữ chỗ · chờ cọc / Đã chốt.

### 4.11 `CONTRACTS` – hợp đồng dài hạn
`g`, `room`, `term`, `from`, `to`, `rent`, `dep`, `next` (ngày thu kỳ tới), `nextAmt`, `com` (tổng hoa hồng), `paid` (hoa hồng đã chi), `who`.

### 4.12 `REG` / `REGST` – khai báo lưu trú (theo mã đơn)
`st`, `need` (số người cần giấy tờ), `people[]`, `code` (mã hồ sơ công an), `warn`, `consent`.
Người (`P`): `name` (in hoa), `doc` (CCCD / Hộ chiếu / Số định danh trẻ em), `no` (che giữa), `dob`, `nat` (ISO-3 với NN), `main` (đứng tên), `exp` (hạn hộ chiếu), `visa`, `entry`, `visaEnd` (độ lệch ngày hết hạn thị thực), `how` (cách đọc), `addr`.
Trạng thái: `none` Chưa quét · `partial` Thiếu người đi cùng · `review` Đã quét, chờ lưu · `scanned` Chờ khai báo · `sent` Đã gửi, chờ công an xác nhận · `confirmed` Đã xác nhận · `pre` Đã nhận trước qua app.
`SAMPLE` – dữ liệu giả lập kết quả quét cho OTM-0150, OTM-0152 (2 trẻ em), OTM-0153.

### 4.13 `FNB` – mặt hàng F&B/minibar
| id | Tên | ĐVT | Giá vốn | Giá bán | Chuẩn/tủ | Tồn đầu | Nhập | Xuất MB | Xuất khác | Tối thiểu | Đã bán |
|---|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| nuoc | Nước suối 500ml | chai | 4.000 | miễn phí | 2 | 120 | 96 | 70 | 10 | 48 | 70 |
| coca | Coca-Cola lon | lon | 8.000 | 25.000 | 2 | 48 | 24 | 30 | 0 | 24 | 28 |
| bia | Bia Larue lon | lon | 12.000 | 35.000 | 2 | 48 | 0 | 28 | 0 | 24 | 26 |
| sua | Sữa tươi Đà Lạt 180ml | hộp | 7.000 | 20.000 | 2 | 36 | 36 | 22 | 6 | 20 | 20 |
| caphe | Cà phê phin giấy Đà Lạt | gói | 6.000 | miễn phí | 2 | 100 | 0 | 46 | 4 | 30 | 46 |
| atiso | Trà atiso túi lọc | túi | 2.500 | miễn phí | 2 | 80 | 0 | 30 | 0 | 30 | 30 |
| snack | Snack khoai tây | gói | 9.000 | 30.000 | 1 | 24 | 12 | 15 | 0 | 10 | 14 |
| mi | Mì ly | ly | 7.000 | 25.000 | 2 | 30 | 0 | 18 | 0 | 12 | 17 |
| macca | Hạt macca Lâm Đồng 100g | túi | 45.000 | 95.000 | 1 | 12 | 12 | 9 | 0 | 6 | 8 |
| vang | Vang Đà Lạt 187ml | chai | 38.000 | 90.000 | 1 | 10 | 0 | 8 | 0 | 5 | 7 |
Trường `adj` = điều chỉnh kiểm kê.

### 4.14 `MB`, `MBCHK`, `FTX`
- `MB[room][item]` = số còn trong tủ (khởi tạo = chuẩn; một số căn thiếu sẵn).
- `MBCHK[room]` = lần kiểm gần nhất ("14/10 · Chị Mai").
- `FTX` – nhật ký kho: [ngày, loại (Nhập kho / Xuất bổ sung minibar / Bán minibar / Dùng đồ miễn phí / Xuất bếp-welcome / Hư hỏng, hết hạn / Dùng nội bộ / Kiểm kê), mặt hàng, SL, tham chiếu, người].

### 4.15 `DEPC`, `CLOCKS`, `LATE`
- `DEPC[bookingId]` = `{log:[[giờ, kênh, nội dung]], reply: null|'time'|'late'|'extend', time, fee, foc}` – theo dõi nhắc và phản hồi trả phòng.
- `CLOCKS` = giờ demo 09:30, 11:05, 12:20.
- `LATE` = [['13:00','Đến 13:00',0], ['15:00',…,0.3], ['18:00',…,0.5]] – **khai báo nhưng không dùng**; công thức thật nằm ở `lateP` (5.6).

### 4.16 `FOCR`, `FOCBY`, `FOCLOG`
- Lý do FOC: Khách quen / VIP · Phòng sẵn sàng, không ảnh hưởng khách sau · Bù cho sự cố trong kỳ ở · Khách thuê dài hạn · Khác.
- Người duyệt: "Quản lý · anh Hoàng Anh", "Lễ tân trưởng · Hạnh".
- `FOCLOG` = [ngày, đơn · khách, khoản miễn, giá trị, lý do, người duyệt]. Mẫu: 12/10 OTM-0136 nhận sớm 10:30 (30%) 234.000; 6/10 OTM-0121 trả muộn 14:00 (30%) 213.000.

### 4.17 `PR`, `WPM`, `Q` – tham số báo giá
- `WPM = 52/12 ≈ 4,333` tuần/tháng.
- `PR.terms` (xem 5.2), `PR.prem = 10` (% phụ thu khách NN), `PR.bonusNN = 1` (% hoa hồng cộng thêm khi khách NN), `PR.grp` (phí theo nhóm căn), `elec 3.500`, `water 25.000`, `kwhVN 120`, `kwhNN 170`, `m3VN 3,5`, `m3NN 4`.
- `Q` – trạng thái form báo giá: `room, guest ('VN'|'NN'), mode ('long'|'short'), term (index), clean (−1..2), pax, sale ('CTV'|'IN'), start, nights, name`.

### 4.18 `CHN`, `SYNC`, `BASE`, `RATES` – kênh
- `CHN`: `{n, st ('on'|'pending'|'off'), map ('10/10'), last, bk (đơn tháng 10), com, open, note}`.
- `SYNC`: nhật ký [giờ, hướng (ví dụ "Airbnb → Desk", "Desk → 7 kênh"), nội dung].
- `BASE` giá OTA nền theo nhóm; `RATES[nhóm][0..6]` giá 7 ngày tới.

### 4.19 `REQT`, `REQS` – yêu cầu từ app khách
`REQT`: `{k, l, s, to}`; `REQS`: `{g, room, t, note, to}` (to = Buồng phòng / Bảo trì / Lễ tân).

### 4.20 `SEGS` – phân khúc CRM
Tất cả · Khách quen (tag) · Dài hạn (tag) · Nước ngoài (`nat ≠ VN`) · VIP (tag) · Người đi cùng (chỉ từng là sharer, chưa từng đứng tên) · Tiềm năng (tag).

### 4.21 Danh mục khác
`NATS`, `LANGS`, `TAGS`, `CONTACTS`, `RELS` (xem 3.16–3.17); `OCC30` (số căn bán 30 ngày qua, số cứng); `S` (trạng thái UI: role, view, foTab, hkFilter, guest, rpt, gp, gt, reqType, ci, regSel, seg, clock); bộ đếm `QSEQ=48`, `OSEQ=170`, `GSEQ`.

---

## 5. Quy tắc nghiệp vụ và công thức

### 5.1 Giá niêm yết
- Giá đêm và giá tháng theo bảng 4.1 (giá đêm = giá tháng ÷ 12).
- Đơn mới: giá mặc định = giá đêm niêm yết làm tròn đến 1.000 đ (`round(night/1000)*1000`).
- Giá OTA nền theo nhóm (`BASE`): **Lầu 1–2: 760.000 · Căn N: 1.050.000 · Căn N+: 980.000**; **Thứ Sáu và Thứ Bảy +15%**, làm tròn 10.000 (Lầu 1–2 cuối tuần 870.000; Căn N 1.210.000; Căn N+ 1.130.000).
- Gia hạn / ở thêm qua app: giá niêm yết căn làm tròn 10.000 (ví dụ 201: 710.000).
- `rateNight` cho dài hạn = tiền thuê tháng ÷ 30 (không thống nhất với quy tắc ÷12 ở trên).

### 5.2 Báo giá dài hạn (`calcQ`, mode `long`)
Bảng kỳ hạn (`PR.terms`):

| Kỳ hạn | Giảm giá | Ký quỹ khách VN (× tiền thuê) | Ký quỹ khách NN | Chu kỳ thu (tháng) | HH nhân viên | HH CTV |
|---|--:|--:|--:|--:|--:|--:|
| 1 tháng | 0% | 0,5 | 1 | 1 | 3% | 5% |
| 3 tháng | 5% | 1 | 1 | 3 | 4% | 6% |
| 6 tháng | 8% | 1 | 1,5 | 3 | 5% | 7% |
| 1 năm | 12% | 1 | 2 | 3 | 6% | 8,3% |
| 2 năm | 15% | 2 | 2 | 3 | 4% | 6% |

Phí theo nhóm căn (`PR.grp`): `fix` = phí dịch vụ cố định/tháng thu khách; `fc` = chi phí cố định/tháng của OTTIMO; `cl[k] = [giá thu/lần dọn, chi phí/lần dọn]` với k = 0 (1 lần/tuần), 1 (2 lần/tuần), 2 (3 lần/tuần).

| Nhóm | fix | fc | 1/tuần | 2/tuần | 3/tuần |
|---|--:|--:|---|---|---|
| Lầu 1–2 | 300.000 | 150.000 | 180.000 / 100.000 | 160.000 / 100.000 | 150.000 / 100.000 |
| Căn N | 400.000 | 200.000 | 250.000 / 140.000 | 230.000 / 140.000 | 210.000 / 140.000 |
| Căn N+ | 350.000 | 180.000 | 220.000 / 120.000 | 200.000 / 120.000 | 180.000 / 120.000 |

Công thức (NN = khách nước ngoài; `n` = số lần dọn/tuần = clean+1):
- **Tiền thuê/tháng** = làm tròn 10.000 của `giá tháng × (1 + 10% nếu NN) × (1 − giảm giá kỳ hạn)`.
- **Phí dọn/tháng** = làm tròn 1.000 của `n × 52/12 × giá thu/lần` (0 nếu không dọn).
- **Phí dịch vụ/tháng** = `fix + phí dọn`.
- **Điện nước ước tính/tháng** = `kWh × 3.500 + m³ × 25.000`, với kWh = 120 (VN) / 170 (NN), m³ = 3,5 (VN) / 4 (NN) **× số người**. Chỉ để báo giá; thực tế thu theo công tơ.
- **Khách trả/tháng** = thuê + dịch vụ + điện nước ước tính.
- **Ký quỹ** = làm tròn 100.000 của `tiền thuê × hệ số ký quỹ (VN/NN)`.
- **Chu kỳ thu** = min(chu kỳ kỳ hạn, số tháng).
- **Thu khi chốt** = ký quỹ + (thuê + dịch vụ) × chu kỳ.
- **Tổng HĐ** = (thuê + dịch vụ) × số tháng (không tính điện nước).
- **Tỷ lệ hoa hồng** = HH CTV hoặc HH nhân viên theo kỳ hạn **+1% nếu khách NN**; **Hoa hồng** = tiền thuê × số tháng × tỷ lệ (chỉ tính trên tiền thuê, không trên phí dịch vụ).
- **Chi phí OTTIMO** = `n × 52/12 × chi phí/lần dọn × số tháng + fc × số tháng`.
- **OTTIMO còn lại** = tổng HĐ − hoa hồng − chi phí (chưa tính điện nước).
- **Ngày kết thúc** = ngày bắt đầu + round(số tháng × 30,4) ngày.
- Quy USD hiển thị: ÷ 26.200.

Ví dụ mặc định của form (căn 302, khách NN, 6 tháng, dọn 2/tuần, 1 người, CTV, vào ở 1/11/2026): thuê 11.130.000; dịch vụ 350.000 + 1.733.000 = 2.083.000; điện nước 595.000 + 100.000 = 695.000 → khách trả **13.908.000/tháng**; ký quỹ 16.700.000; thu khi chốt 56.339.000; hoa hồng 8% = 5.342.400; chi phí 7.320.000; OTTIMO còn lại 66.615.600.

Đối chiếu hợp đồng mẫu Daniel (301, NN, 1 năm, CTV): thuê 11.500.000 × 1,1 × 0,88 = 11.132.000 → **11.130.000** ✔; ký quỹ ×2 → **22.300.000** ✔; hoa hồng (8,3+1)% × 133.560.000 = **12.421.080** ✔ (đã chi 50% = 6.210.540).

### 5.3 Báo giá ngắn ngày (`calcQ`, mode `short`)
- **Giảm theo thời gian ở**: ≥14 đêm **−15%**; ≥7 đêm **−10%**; dưới 7 đêm 0%.
- Giá đêm = làm tròn 1.000 của `giá đêm niêm yết × (1 − giảm)`; tổng = giá đêm × số đêm. Không có phụ thu khách NN cho ngắn ngày.
- **Cọc giữ phòng = 30% tổng**, làm tròn 100.000; "thu khi chốt" = cọc; phần còn lại thu khi nhận phòng.
- **Hoa hồng ngắn ngày**: CTV **8%**, nhân viên **3%** trên tổng tiền phòng.
- Chi phí = chi phí 1 lần dọn của nhóm (`cl[0][1]`) × số đêm. OTTIMO còn lại = tổng − hoa hồng − chi phí.
- Số đêm form báo giá: 1–30.

### 5.4 Báo giá – kiểm tra phòng trống, hiệu lực
- Trùng lịch: có đơn cùng căn, trạng thái khác `out`/`cx` (tức tính cả `hold`, `cf`, `in`, `ooo`), giao khoảng `[s, e)`.
- Gợi ý căn thay thế: mọi căn khác trống trong cùng khoảng (tối đa hiển thị 6).
- Không tạo đơn nếu ngày bắt đầu đã qua hoặc trùng lịch.
- Văn bản báo giá ghi "**Báo giá có hiệu lực 3 ngày**" (chưa theo dõi hết hạn).

### 5.5 Giữ chỗ và đặt cọc
- Luồng: Báo giá → Giữ chỗ (`hold`) → Nhận cọc/ký quỹ (`cf`) → Nhận phòng (`in`) → Trả phòng (`out`) / Thu theo kỳ (dài hạn).
- Hạn giữ chỗ: **12 / 24 / 48 giờ** (mặc định 24h). Trong thời gian giữ: căn bị khoá trên mọi kênh; khách nhận link thanh toán; hết hạn chưa cọc thì **tự mở lại phòng** (mới là mô tả, chưa có bộ đếm).
- Khoản cần thu: dài hạn = ký quỹ (theo 5.2); ngắn ngày = cọc 30%.
- Xác nhận cọc → đơn `cf`, ghi `dep`; dài hạn thì sinh hợp đồng với kỳ thu đầu = ngày vào ở, số tiền = (thuê + dịch vụ) × chu kỳ.
- Đơn OTA mẫu: cọc = toàn bộ (Airbnb thu trước), hoặc 0 (Booking.com/Agoda trả tại chỗ) – không có quy tắc, chỉ là dữ liệu.

### 5.6 Phụ thu nhận sớm / trả muộn (v6)
- **Giờ chuẩn**: nhận phòng **14:00**, trả phòng **12:00**.
- **Nhận sớm** (`earlyP`, % trên giá đêm của đơn): từ 14:00 → 0%; **10:00–13:59 → 30%**; **06:00–09:59 → 50%**; **trước 06:00 → 100% (tính 1 đêm)**.
- **Trả muộn** (`lateP`): đến 12:00 → 0%; **12:01–15:00 → 30%**; **15:01–18:00 → 50%**; **sau 18:00 → 100% (tính 1 đêm)**.
- Phí = round(tỷ lệ × `b.rate`). Với đơn dài hạn `b.rate` là tiền thuê tháng → phụ thu bị tính theo giá tháng (lỗi, xem mục 8).
- Ví dụ: 201 giá 700.000, trả muộn 15:00 → 210.000 đ.
- Khách xin trả muộn qua app: chỉ có một lựa chọn "đến 15:00 · 30%".

### 5.7 FOC (miễn phí phụ thu)
- Áp dụng cho phụ thu nhận sớm và trả muộn.
- Bắt buộc chọn **lý do** (5 lựa chọn ở 4.16) và **người duyệt** (Quản lý anh Hoàng Anh hoặc Lễ tân trưởng Hạnh).
- Bill vẫn ghi dòng phụ thu, kèm một dòng âm "Miễn phí (FOC) · lý do" để triệt tiêu.
- Mọi FOC ghi vào `FOCLOG` và báo cáo "Miễn phí (FOC) tháng 10" (tổng giá trị, số lần, lý do, người duyệt) để quản lý soát cuối tháng.
- Prototype không có bước duyệt thật: người thao tác tự chọn tên người duyệt.

### 5.8 Gia hạn
- Số đêm tối đa = số đêm liên tiếp còn trống sau ngày đi hiện tại, giới hạn **7**.
- Đơn OTA: phần gia hạn thu trực tiếp tại OTTIMO, không sửa đơn trên OTA, dùng giá trực tiếp (tránh 15–18% phí kênh).
- Folio: thêm dòng "Gia hạn n đêm" nếu giá khác giá đơn hoặc đơn OTA; ngược lại chỉ kéo dài `e` và tính theo giá đơn.
- Hệ quả: buồng → OD, việc dọn trả phòng đổi thành dọn phòng khách đang ở, đóng phòng trên các kênh.

### 5.9 Nhắc trả phòng tự động (mô tả quy tắc)
1. **20:00 hôm trước**: gửi Zalo/app nhắc giờ trả, hỏi có ở thêm, kèm giá nếu căn còn trống.
2. **09:00 ngày trả**: chưa trả lời thì nhắc lần 2 (nút Trả đúng giờ / Ở thêm / Trả muộn).
3. **11:00**: vẫn chưa trả lời thì báo lễ tân gọi điện.
4. **12:00**: quá giờ thì báo đỏ cho lễ tân và quản lý; căn có khách mới đến trong ngày được ưu tiên lên đầu.
5. Khách chọn ở thêm: tự kiểm phòng trống, giữ phòng, đóng bán OTA, cộng tiền vào folio.

### 5.10 Điện nước theo công tơ
- Đơn giá: **điện 3.500 đ/kWh**, **nước 25.000 đ/m³**. Kỳ chốt 1–31/10 (chốt ngày 31 hằng tháng).
- Thành tiền = max(0, điện mới − cũ) × 3.500 + max(0, nước mới − cũ) × 25.000; chỉ tính khi đã nhập đủ cả 2 chỉ số.
- Áp dụng cho khách dài hạn; chốt xong dự kiến tự vào hoá đơn tháng và app khách (chưa làm).

### 5.11 Kênh bán, phí kênh, thực thu, KPI tài chính
**Hoa hồng tham chiếu theo kênh** (`CHN`): Airbnb **15,5%**, Booking.com **15%**, Agoda **18%**, Expedia **18%**, Trip.com **15%**, Traveloka (chờ duyệt, chưa có), Google đặt trực tiếp "theo click", Website & Zalo **0%**. CTV/môi giới trong báo cáo kênh: **7%**. Expedia và Trip.com mới ghép 6/10 căn.
Số đơn tháng 10 theo kênh: Airbnb 14, Booking 11, Agoda 6, Expedia 1, Trip.com 0, Google 5, Website & Zalo 9.

**Báo cáo kênh tháng 9** (Thực thu = DT × (1 − phí)):

| Kênh | Doanh thu | Phí | Phí kênh | Thực thu |
|---|--:|--:|--:|--:|
| Trực tiếp (Zalo, web) | 52.200.000 | 0% | 0 | 52.200.000 |
| Airbnb | 48.500.000 | 15,5% | 7.517.500 | 40.982.500 |
| Booking.com | 37.300.000 | 15% | 5.595.000 | 31.705.000 |
| CTV / môi giới | 33.500.000 | 7% | 2.345.000 | 31.155.000 |
| Agoda | 14.900.000 | 18% | 2.682.000 | 12.218.000 |
| **Tổng** | **186.400.000** | | **18.139.500** | **168.260.500** |
Thông điệp: chuyển khách quay lại về kênh trực tiếp để tiết kiệm 15–18% phí OTA.

**Lãi lỗ tháng 9** (GOP, chưa gồm thuê nhà và khấu hao):
- Doanh thu: phòng 186.400.000; phí dịch vụ & dọn 6.200.000; điện nước thu lại 3.100.000 → **195.700.000**.
- Chi phí: phí OTA 15.500.000; hoa hồng CTV 2.350.000; lương 28.000.000; điện nước internet 11.300.000; giặt là & amenity 7.400.000; marketing 6.000.000; sửa chữa bảo trì 3.200.000; phần mềm & khác 2.000.000 → **75.750.000**.
- **GOP = 119.950.000** (biên ≈ 61,3%); **GOPPAR** = GOP ÷ 300 đêm-phòng ≈ **400k**.
- [LỆCH] Phí OTA trong P&L (15,5 tr) khác tổng tính từ bảng kênh (15,79 tr).

**KPI vận hành**:
- **Công suất (Occupancy)** = đêm bán ÷ đêm khả dụng (10 căn × số ngày). Đêm "bán" = căn có đơn không phải khoá phòng phủ đêm đó (tính cả `hold`, `cf`, `in`, kể cả dài hạn).
- **ADR** = doanh thu phòng ÷ đêm bán. **RevPAR** = doanh thu phòng ÷ đêm khả dụng.
- Số liệu: Tháng 8 (25–31/8) 39/70 = 55,7%, DT 32.916.672, ADR ≈ 844.017; Tháng 9 214/300 = 71,3%, ADR ≈ 871.028, RevPAR ≈ 621.333; Tháng 10 (1–14) 115/140 = 82,1%, ADR 891.000 [HC], RevPAR ≈ 731.893.
- Đêm khả dụng **không trừ** phòng khoá (OOO).
- **ALOS** (thời gian ở trung bình) chỉ là số cứng theo kênh (3,4 / 2,6 / 2,2 / 4,1 đêm), chưa có công thức.
- Khách/phòng = tổng `pax` ÷ số đơn; Doanh thu/khách = doanh thu đơn ÷ tổng `pax`.

**Doanh thu một đơn (`bkRev`)**: 0 nếu `hold`/`cx`/khoá phòng; ngắn ngày = (số đêm − `extN`) × giá + tổng dòng folio; dài hạn = tiền thuê × max(1, round((min(e, hôm nay) − s) / 30)) + dòng folio.
**Doanh thu thanh toán** (CRM) = tổng `bkRev` các đơn khách đứng tên (+ số cũ `LEGACY` g5 = 4.750.002). **Doanh thu phân bổ** = mỗi đơn chia đều cho số người lớn có hồ sơ. Báo cáo kinh doanh vẫn tính theo đơn, không nhân theo người.

### 5.12 Khai báo lưu trú
- **Hạn**: trước **23:00 ngày khách đến**. Hiển thị: đến trong tương lai → "Khi nhận phòng dd/m"; đến hôm nay → "Trước 23:00 hôm nay"; đã qua mà chưa xong → "Đã quá hạn".
- **Loại khai báo**: có người mang thị thực → "Khai báo tạm trú người nước ngoài" (mã gợi ý `TT-yymmdd-xxxx`); toàn người Việt → "Thông báo lưu trú công dân Việt Nam" (`LT-…`). Cổng: `tbltkbtt.bocongan.gov.vn`, tài khoản cơ sở lưu trú.
- **Trình tự trạng thái**: none → (quét từng người) partial → review (đủ người) → [đồng ý lưu giấy tờ bắt buộc] scanned → [nhập mã hồ sơ] sent → [công an xác nhận] confirmed. Khách check-in online qua app → `pre`.
- **Đối chiếu tự động**: (1) tên trên giấy tờ khớp tên đặt phòng – so sánh bỏ dấu, bỏ ký tự ngoài chữ cái, chấp nhận đảo thứ tự từ (ví dụ "Weber Daniel" = "Daniel Weber"); (2) hộ chiếu còn hạn sau ngày trả phòng (**hiện luôn đánh "Khớp", không so thật**); (3) thị thực/miễn thị thực còn hạn đến ngày trả phòng (`visaEnd ≥ e`); (4) đủ giấy tờ cho số khách (`people ≥ need`).
- Cảnh báo thị thực mẫu: Emma – thị thực DL đến 20/11/2026, trước ngày hết hợp đồng 4/12 → nhắc gia hạn.
- Trẻ em dùng "Số định danh (trẻ em)", nhập từ giấy khai sinh; khi lưu, người đi cùng từ giấy tờ được tự gắn vào đơn (trẻ em → `child`, người lớn → tìm hồ sơ khớp tên + ngày sinh, không có thì tạo mới với quan hệ "Chưa rõ").
- Khi gửi khai báo → `G.reg = true` cho người đứng tên.
- Quét giả lập: mỗi lần quét lấy người kế tiếp trong `SAMPLE`; hết mẫu thì sinh "KHÁCH ĐI CÙNG n" giả. Toast "tự điền 4 trường" (5 nếu có thị thực).

### 5.13 Lưu trữ giấy tờ và dữ liệu cá nhân (đề xuất trong prototype, cần luật sư)
- Lưu trong database OTTIMO Desk, **máy chủ đặt tại Việt Nam**; ảnh giấy tờ **mã hoá**, tách riêng với hồ sơ khách; hồ sơ khách chỉ giữ **4 số cuối** để nhận diện khách quen.
- Chỉ **lễ tân và quản lý** được xem; buồng phòng, sale, CTV không thấy; **mỗi lần mở ảnh đều ghi log** ai xem, lúc nào.
- Ảnh **tự xoá sau 30 ngày kể từ ngày trả phòng** (số đề xuất); khách có quyền yêu cầu xoá sớm.
- Căn cứ: **Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, hiệu lực 1/1/2026** – cần đồng ý rõ ràng; rò rỉ dữ liệu phải thông báo trong **72 giờ**.
- Phải tích "khách đã đồng ý cho OTTIMO lưu ảnh giấy tờ" (ký trên app hoặc tại quầy) trước khi lưu.

### 5.14 Minibar, F&B, kho
- Mỗi tủ có mức chuẩn theo mặt hàng (tổng 17 món). Đã dùng = chuẩn − còn lại (giới hạn 0…chuẩn). Tiền = đã dùng × giá bán; đồ miễn phí (nước, cà phê, trà atiso) vẫn trừ kho nhưng **không tính tiền**, ghi vào chi phí phòng.
- Buồng phòng nhập số còn lại khi dọn; lễ tân xác nhận khi trả phòng.
- **Tồn cuối = tồn đầu + nhập − xuất minibar − xuất khác ± kiểm kê**. Trạng thái: ≤0 "Hết hàng"; ≤ tối thiểu "Cần nhập"; còn lại "Đủ".
- "Xuất minibar" ghi khi bổ sung tủ (kiểm giữa kỳ: ngay lập tức; trả phòng: khi tick việc "Bổ sung minibar"). "Đã bán" (`sold`) ghi khi khách dùng. Hai số khác nhau theo thời điểm.
- Xuất kho không được vượt tồn. Nhập kho có giá mới thì ghi đè giá vốn.
- KPI: Doanh thu F&B = Σ sold × giá bán (≈ 4.245.000); Giá vốn = Σ sold × giá vốn của hàng có bán (≈ 1.547.000); **Lãi gộp ≈ 63,6%**; Đồ miễn phí = Σ sold × giá vốn hàng miễn phí (≈ 631.000).
- Nhà cung cấp mẫu: NCC Phúc Hưng (phiếu PN-0112), Đà Lạt Milk (PN-0111).

### 5.15 Trạng thái buồng và việc dọn
- Chuyển trạng thái bằng nút: VD/OD → **CL** (Bắt đầu dọn); CL → **OC** (nếu đang có khách) hoặc **VC** (Dọn xong); VC → **VI** (Kiểm đạt); OC → **OD** (Báo cần dọn); OOO → **VD** (Mở khoá → cần dọn); VI không có nút.
- Dọn xong (sang VC/OC) tự đánh dấu xong việc "Dọn…" đầu tiên chưa xong của căn đó.
- Nhận phòng → OC; trả phòng → VD; gia hạn → OD; tạo phiếu sửa có tick khoá → OOO; phiếu "Xong" khi căn OOO → VD.
- Gói dọn dài hạn: 1, 2 hoặc 3 lần/tuần (ví dụ Emma "2 lần/tuần · T2, T5", Daniel "1 lần/tuần · T6"; lịch giờ 9:00–11:00).
- Việc tự sinh: "Dọn trả phòng" (khi trả phòng), "Bổ sung minibar" (khi trả phòng có tiêu hao), việc từ app khách (dọn thêm, khăn/đồ dùng).

### 5.16 Định danh, phát hiện trùng và gộp hồ sơ khách
- **Thứ tự khoá định danh**: số giấy tờ (khi đã quét) → SĐT → email → mã đặt phòng OTA. Trùng khoá thì báo, không cho tạo hồ sơ thứ hai.
- **Chuẩn hoá**: SĐT = chỉ giữ chữ số, đầu "0" đổi thành "84"; email = trim + chữ thường; tên = bỏ dấu, "đ"→"d", bỏ ký tự ngoài chữ cái, in hoa.
- **Tiêu chí trùng (`findDups`)**: trùng SĐT (chuẩn hoá ≥8 chữ số); trùng email; trùng tên **và** ngày sinh. Danh sách cặp nghi trùng (`dupPairs`) còn thêm cặp **trùng tên** (so khoá tên bằng cách sắp xếp các chữ cái).
- Khi tạo/sửa: trùng SĐT/email → chặn lưu ("Gộp hồ sơ thay vì tạo trùng"); chỉ trùng tên + ngày sinh → cảnh báo nhưng vẫn cho lưu.
- **Validation hồ sơ**: bắt buộc họ tên; cần ít nhất SĐT hoặc email; SĐT ≥9 chữ số; email dạng `x@y.z`; MST 10 hoặc 13 chữ số (cho phép gạch ngang). Đặt trực tiếp/CTV và tạo đơn từ báo giá bắt buộc SĐT.
- **Gộp (`doMerge`)**: chuyển đơn, hợp đồng, yêu cầu app sang hồ sơ giữ lại; điền các trường trống (SĐT, email, ngày sinh, công ty, MST, mã OTA) từ hồ sơ bị gộp; nối mã OTA; hợp tag và sở thích; nối ghi chú với tiền tố "[Gộp từ KH-xxxx]"; lưu `merged[]`; `reg` = OR; xoá hồ sơ cũ ("mã cũ vẫn tra được trong nhật ký" – chưa có nhật ký).

### 5.17 Độ đầy đủ hồ sơ
8 tiêu chí, mỗi tiêu chí 12,5%: Họ tên, SĐT, Email, Quốc tịch, Ngày sinh, Giấy tờ (có giấy tờ đã quét trong đơn hoặc `reg`), Sở thích (≥1), Đồng ý nhận ưu đãi (`mkt !== undefined` – luôn đúng, lỗi). Hiển thị % + danh sách còn thiếu.

### 5.18 Phân khúc, nguồn khách, đánh giá, giữ chân
- Phân khúc: xem 4.20. Nhóm hộ `NH-xxxx` để gửi ưu đãi theo nhóm, tránh nhắn trùng.
- Người đi cùng phải **tự** đồng ý nhận ưu đãi (không dùng đồng ý của người đặt); gửi link mời để họ tự điền liên hệ.
- Mã giảm: **OTTIMO-BACK5 – giảm 5%** khi đặt trực tiếp lần sau (in trên bill); "mã khách quen 5%" (CRM mẫu).
- Quy trình xin đánh giá: (1) ngày thứ 2 lưu trú app hỏi "Mọi thứ ổn chứ?", chưa hài lòng → báo lễ tân; (2) sáng trả phòng: cảm ơn, tặng thiệp + mã giảm đặt trực tiếp; (3) sau trả phòng 1 ngày: mời đánh giá trên kênh khách đã đặt; (4) trả lời mọi đánh giá trong 24 giờ, ký tên quản lý.

### 5.19 Yêu cầu từ app khách – định tuyến
| Loại | Mô tả | Chuyển tới | Hệ quả |
|---|---|---|---|
| Dọn phòng thêm | Ngoài lịch dọn của gói | Buồng phòng | Tạo TASK (Chưa giao) |
| Khăn, đồ dùng | Khăn, gối, amenity | Buồng phòng | Tạo TASK |
| Báo hỏng | Điện, nước, thiết bị | Bảo trì | Tạo WO mức Trung bình |
| Đặt xe, tour | Sân bay, tham quan | Lễ tân | Chỉ ghi REQS |
| Trả phòng muộn | Tuỳ tình trạng phòng | Lễ tân | Chỉ ghi REQS |
| Yêu cầu khác | Lễ tân trả lời trong **10 phút** | Lễ tân | Chỉ ghi REQS |

### 5.20 Hoá đơn và thanh toán
- Phương thức: chuyển khoản (VietQR theo số tiền bill, nội dung = số bill), thẻ, tiền mặt, "đã thu qua OTA"; khi giữ chỗ còn có link thanh toán thẻ quốc tế.
- Giá đã gồm VAT (chưa tách thuế).
- Doanh thu > 1 tỷ/năm → **mỗi lần thu tiền phát hành hoá đơn điện tử từ máy tính tiền**, gửi dữ liệu cơ quan thuế qua nhà cung cấp (MISA, Viettel, VNPT…). Không lấy thông tin công ty → hoá đơn khách lẻ.
- Dài hạn thu theo kỳ (thường 3 tháng/lần) + điện nước hằng tháng; nhắc thu trước 7 ngày (ghi trong "Cần chú ý").
- Gia hạn hợp đồng: chào gia hạn 3 tháng, trước hết hạn khoảng 1 tháng (ví dụ Emma).

### 5.21 Đồng bộ kênh (mô tả)
- Desk là nguồn dữ liệu chính; mọi thay đổi phòng trống (đặt mới, giữ chỗ, gia hạn, khoá phòng, huỷ) phát lệnh "Desk → 7 kênh" đóng/mở phòng.
- Đơn từ OTA về Desk tự tạo đơn và hồ sơ khách; gộp theo SĐT/email/số giấy tờ.
- Sửa giá theo nhóm căn × ngày, bấm đẩy lên tất cả kênh; giá từng OTA có thể cộng phí kênh.

---

## 6. Design system đang dùng

### 6.1 Phong cách
Ấm, mộc, "boutique Đà Lạt": nền kem giấy, chữ than, điểm nhấn màu **gỗ sồi (oak)**; tiêu đề font serif tạo cảm giác khách sạn nhỏ cao cấp; thân chữ sans hiện đại hỗ trợ tiếng Việt tốt. Mật độ thông tin vừa phải, nhiều thẻ bo góc, đường kẻ mảnh, bóng đổ rất nhẹ. Có chế độ tối đầy đủ (theo hệ điều hành, hoặc ép bằng `data-theme`).

### 6.2 Màu (token)
| Token | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `--bg` | #F4F0E8 | #1B1A18 | Nền trang |
| `--surface` | #FBF9F4 | #24221F | Thẻ, input, modal |
| `--surface2` | #EEE8DC | #2D2A26 | Nền phụ, seg control, track |
| `--side` | #ECE5D8 | #201E1C | Sidebar |
| `--ink` | #2B2B2B | #EDE8DF | Chữ chính, nút chính |
| `--muted` | #6B6760 | #A9A398 | Chữ phụ |
| `--faint` | #9A948A | #7D776E | Chữ rất nhạt |
| `--line` | #E0D8CA | #38342F | Viền, đường kẻ |
| `--oak` | #B08D57 | #C9A56E | Nhấn thương hiệu, focus ring, biểu đồ |
| `--oak-ink` | #86693B | #D9B987 | Chữ trên nền oak-soft |
| `--oak-soft` | #F1E7D6 | #3A3226 | Nền nhấn nhẹ, mục đang chọn |
| `--bar-in` / `-t` | #2F2D2A / #F4F0E8 | #E3DCCF / #1B1A18 | Thanh "đang ở"; khung điện thoại, header app khách |
| `--bar-cf` / `-t` | #C9A56E / #2B2B2B | #B8925A / #1B1A18 | Thanh "đã xác nhận" |
| `--bar-long` / `-t` | #5B7387 / #FFFFFF | #7E98AD / #111 | Thanh "hợp đồng dài hạn" |
| `--ok` / `--ok-bg` | #3D7552 / #E2EEE5 | #7FBF95 / #22352A | Thành công |
| `--warn` / `--warn-bg` | #9A5F1C / #F5E8D3 | #E0A866 / #3A2E1E | Cảnh báo |
| `--bad` / `--bad-bg` | #A8403C / #F5DFDC | #E58A84 / #3D2422 | Lỗi, khoá phòng |
| `--info` / `--info-bg` | #3E5E78 / #E0E8EF | #8DB0CC / #22303B | Thông tin |
| `--shadow` | 0 1px 2px rgba(43,43,43,.06), 0 8px 24px rgba(43,43,43,.08) | đậm hơn | Drawer, modal, toast |

### 6.3 Chữ
- **Lora** (serif, 500/600, có italic 500): logo (letter-spacing .3em), tiêu đề h1 (22px), h2 (18px), số KPI (26px), số căn, tổng bill.
- **Be Vietnam Pro** (sans, 400/500/600): toàn bộ thân chữ 14px / line-height 1.5.
- h3: 11px, chữ hoa, letter-spacing .13em, màu muted – dùng làm nhãn nhóm.
- Số liệu dùng `font-variant-numeric: tabular-nums`. Định dạng tiền `vi-VN` ("1.234.000 đ", "36,0 tr", "891k").

### 6.4 Bố cục, khoảng cách, bo góc
- Sidebar 232px; nội dung padding 24/28px (mobile 16px), khoảng cách lưới 16–22px.
- Bo góc: thẻ 12px; input/nút 8px; modal 14px; chip/pill 999px; khung điện thoại 36px viền 10px.
- Breakpoint: 1100 (dash 1 cột), 1000 (báo giá 1 cột), 900 (mobile shell, KPI 2 cột), 760 (g2/g3 1 cột), 700, 520.
- Tôn trọng `prefers-reduced-motion` (chỉ drawer có animation trượt 0,22s); hỗ trợ safe-area iOS.

### 6.5 Component
Nút (`btn`, `pri` nền mực, `sm`, `ghost`, disabled .45), chip trạng thái (`s-ok/warn/bad/info/oak`, có chấm), seg control (aria-pressed), thẻ KPI, card + card-h, list row, bảng (header chữ hoa nhỏ, dòng tổng đậm, dòng chọn tô oak 11%), room rack (lưới, thanh đặt phòng 6 loại), thẻ buồng (viền trên 4px theo trạng thái), kanban, timeline (chấm tròn viền oak), steps-row (thanh tiến trình nhiều bước), switch bật/tắt, tag picker, thanh tiến độ (`cp-bar`), ô khoá định danh (`idkeys`), drawer phải 440px, modal 480/660px, toast, khung quét giấy tờ (scan-frame tỷ lệ 1,58), sơ đồ kiến trúc (`arch`), biểu đồ cột SVG + thanh ngang (`hbar`), bill (đường kẻ đứt, dấu "ĐÃ THU ĐỦ" xoay −6°), khung điện thoại app khách với tab dưới.
Icon: bộ line icon tự vẽ 24×24, nét 1,7, bo đầu (dash, fo, reg, hk, mt, fnb, guests, sales, ota, rpt, gapp, home, bell, bill, map).

---

## 7. Những gì CHỈ là giả lập – cần làm thật

| Hạng mục | Hiện trạng prototype | Cần làm thật |
|---|---|---|
| Backend & lưu trữ | Biến JS trong bộ nhớ, tải lại là mất | Database, API, đa người dùng đồng thời, khoá lạc quan chống đặt trùng |
| Ngày giờ | `T0` cố định 15/10/2026, "giờ demo" | Đồng hồ thật, múi giờ Asia/Ho_Chi_Minh, job theo lịch |
| Đăng nhập & phân quyền | Dropdown đổi vai, chỉ ẩn menu | Xác thực, RBAC theo vai + theo dữ liệu (giấy tờ, giá vốn, P&L), nhật ký thao tác |
| Quét giấy tờ (OCR/QR/MRZ) | Lấy dữ liệu mẫu `SAMPLE`; ảnh tải lên bị bỏ qua | Đọc QR CCCD gắn chip, MRZ hộ chiếu, OCR; lưu ảnh mã hoá; tự xoá theo hạn; log xem ảnh |
| Khai báo lưu trú | Sao chép text, mở cổng công an, dán mã tay | Giữ bán tự động hoặc tích hợp nếu Bộ Công an cấp kết nối; nhắc hạn 23:00 |
| Đồng bộ OTA | Ghi dòng log `SYNC`; công tắc chỉ đổi biến | Tích hợp channel manager (Beds24/ezCloud…), webhook đơn về, đẩy giá/phòng trống, xử lý lỗi và đối soát |
| Thanh toán | `fakeQR` là hình ngẫu nhiên; link thẻ chỉ là chữ | VietQR thật, cổng thanh toán thẻ, đối soát giao dịch, hoàn cọc |
| Hoá đơn điện tử | Sinh mã `K26TOT…` giả | Tích hợp nhà cung cấp HĐĐT (MISA/Viettel/VNPT), HĐ từ máy tính tiền, tách VAT |
| Gửi tin (Zalo/WhatsApp/email/app) | Toast "Đã gửi…" | Zalo OA/ZNS, email, push/web app; mẫu tin đa ngôn ngữ |
| Nhắc trả phòng tự động | Log mẫu + trạng thái theo giờ demo | Scheduler 20:00 / 09:00 / 11:00 / 12:00, nhận phản hồi khách |
| Hết hạn giữ chỗ | Chỉ là chữ | Bộ đếm giờ, tự huỷ và mở phòng, thông báo |
| App khách | Khung điện thoại trong cùng trang, 3 khách cố định, số liệu cứng | Web app riêng truy cập bằng link/QR theo đơn, xác thực khách, đa ngôn ngữ (EN, KR, CN), mã cửa |
| Check-in online | Form 3 bước không lưu ảnh | Tải giấy tờ, ký đồng ý điện tử, giờ đến, sở thích |
| Báo cáo | Phần lớn số cứng (OCC30, tháng 8–9, P&L, kênh, đánh giá, ALOS, ADR 891k) | Tính từ dữ liệu thật, chốt kỳ, xuất file |
| Chốt điện nước | Ô nhập tính tiền tại chỗ, không đi đâu | Ghi kỳ, sinh hoá đơn tháng, hiện trong app khách, lịch sử chỉ số |
| In / PDF bill | Không có | In máy in bill, xuất PDF |
| Đánh giá OTA | Số mẫu | Lấy từ OTA/Google, quy trình xin và trả lời đánh giá |
| Bảo trì định kỳ | Danh sách tĩnh | Tự sinh kỳ kế tiếp, giao việc |
| Kho | Không có NCC, PO, đơn vị quy đổi | Phiếu nhập/xuất, giá vốn bình quân, hạn sử dụng |
| Tỷ giá USD | 26.200 cứng | Cấu hình hoặc lấy tỷ giá ngày |

---

## 8. Điểm mạnh nên giữ, và lỗi / thiếu sót / rủi ro

### 8.1 Điểm mạnh nên giữ
- **Hiểu đúng mô hình lai** ngắn ngày + dài hạn: cùng một sơ đồ phòng, cùng một công cụ báo giá; công thức dài hạn chi tiết (giảm theo kỳ, phụ thu NN, ký quỹ theo quốc tịch, chu kỳ thu, chi phí dọn thật) và hiển thị **biên lợi nhuận còn lại** sau hoa hồng cho người bán.
- **Luồng báo giá → giữ chỗ → cọc → nhận phòng** khép kín, có kiểm trùng lịch ở mọi bước và kanban sale gắn với đơn.
- **Quy trình trả phòng 3 bước** (minibar → phụ phí → bill) gắn liền kho, buồng phòng, hoá đơn; tự sinh việc dọn và bổ sung minibar.
- **FOC có lý do + người duyệt + báo cáo** – kiểm soát thất thoát tốt.
- **Khai báo lưu trú** được coi là nghĩa vụ hằng ngày với hạn 23:00, có đối chiếu tự động, xử lý trẻ em, cảnh báo thị thực, tư duy bảo vệ dữ liệu (Luật 91/2025/QH15).
- **CRM định danh nhiều khoá**, phát hiện và gộp trùng, phân biệt người đứng tên / người đi cùng, doanh thu thanh toán vs phân bổ, đồng ý ưu đãi theo từng người.
- **Nhắc trả phòng theo mốc giờ** và gia hạn có kiểm phòng trống + khuyến khích thu trực tiếp khi khách OTA ở thêm.
- Yêu cầu từ app khách đi thẳng vào hàng việc của bộ phận đúng.
- Design system nhất quán, có dark mode, responsive tới mobile, dùng nhiều thuộc tính ARIA (aria-current, aria-pressed, role=dialog, role=status, aria-label cho input bảng).
- Nhiều chú thích nghiệp vụ ngay trong UI (ghi chú "note") – nguồn yêu cầu tốt cho BA.

### 8.2 Lỗi logic và mâu thuẫn số liệu
1. **Phụ thu sớm/muộn cho đơn dài hạn** dùng `b.rate` = tiền thuê **tháng** → trả muộn 30% của 11,13 tr ≈ 3,3 tr. Cần dùng giá đêm quy đổi (hoặc chính sách riêng cho dài hạn).
2. **Mặc định nhận sớm bị tính phí**: giờ nhận mặc định = giờ demo (11:05) nếu trước 14:00 → mặc định phụ thu 30% ngay khi mở modal.
3. **Kiểm tra hạn hộ chiếu luôn "Khớp"** (`checks.push([true,…])`), không so với ngày trả phòng.
4. **Bảng `LATE` (13:00 miễn phí) không được dùng**; công thức thật tính phí từ 12:01. Cần chốt có "ân hạn" hay không.
5. **Khoá phòng bằng phiếu sửa chữa không chặn bán**: tick "Khoá phòng" chỉ đặt HK = OOO, không tạo đơn `ooo` → sơ đồ phòng, kiểm trùng, phòng trống OTA vẫn coi là trống.
6. **Trả phòng dài hạn**: bill không có tiền thuê, không có điện nước kỳ cuối, **không có hoàn/khấu trừ ký quỹ** (dep = 0).
7. **`arrivals()` không loại đơn `cx`/`hold`** → đơn huỷ/giữ chỗ có ngày đến hôm nay vẫn hiện trong "Khách đến". `departures()` không loại `cx`.
8. **Đơn giữ chỗ (`hold`) được tính là đêm đã bán** trong công suất và biểu đồ.
9. **Đơn tạo từ báo giá không tạo bản ghi khai báo `REG`**; đơn ngắn ngày tạo từ "Đặt phòng mới" thì có.
10. **[LỆCH] Hợp đồng mẫu**: kỳ thu tới của Daniel 36.030.000 ≠ công thức ((11.130.000 + 1.483.000) × 3 = 37.839.000); hoa hồng Emma 1.975.000 (≈7%, tỷ lệ CTV) trong khi người chốt là "NV Hạnh" (nhân viên 4% + 1% = 5% → 1.411.500).
11. **[LỆCH] Phí OTA trong P&L** (15,5 tr) ≠ bảng kênh (15,79 tr); hoa hồng CTV 2,35 tr khớp.
12. **Thông báo gia hạn OTA** nói "15%" cho Airbnb trong khi bảng kênh ghi 15,5%.
13. **Giá đêm niêm yết ÷12 và `rateNight` dài hạn ÷30** – hai quy ước quy đổi khác nhau; giá gia hạn mặc định dùng giá niêm yết chứ không dùng giá đơn (khách OTA giá 990.000 có thể được gia hạn 1.000.000 hoặc ngược lại).
14. **Độ đầy đủ hồ sơ**: tiêu chí "Đồng ý nhận ưu đãi" luôn đạt vì `mkt` luôn được gán false/true.
15. **Khoá tên = sắp xếp chữ cái** → hai tên khác nhau nhưng cùng tập chữ cái (đảo chữ) bị báo trùng; ngược lại tên viết thiếu/dư một chữ thì không phát hiện.
16. **Gộp hồ sơ** không cập nhật `b.guests[]` (người đi cùng), `REG`, `LEADS` (lead nối theo **tên**), `METER`, `CRMX` → tham chiếu treo; không có nhật ký gộp dù UI hứa "mã cũ vẫn tra được".
17. **Lead nối với khách bằng tên** (`l.n === name`) – trùng tên là gắn nhầm.
18. **Sinh mã không an toàn**: `WO-0{33+len−4}` (phiếu tay) và `WO-0{40+len}` (từ app) có thể trùng; mã khách `g{n+random}` có thể trùng; mã hoá đơn từ `Date.now()`.
19. **Hết hạn giữ chỗ, hiệu lực báo giá 3 ngày** không được thực thi.
20. **Sửa giá OTA**: nhập giá rỗng/0 bị bỏ qua lặng lẽ; không giới hạn giá sàn/trần.
21. **Công tơ**: chỉ số mới < cũ bị ép về 0 thay vì báo lỗi; không lưu kỳ.
22. **Doanh thu dài hạn** tính theo số tháng đã ở làm tròn (`round(ngày/30)`), không theo lịch thu thực tế; CRM dùng số cứng `LEGACY` cho g5.
23. **Huỷ giữ chỗ** không có lý do, không có phí huỷ; không có chính sách huỷ cho đơn đã cọc.
24. **FOC tự duyệt**: người thao tác tự chọn tên người duyệt – không có xác thực/phê duyệt.
25. **Không có VAT tách dòng** dù ghi "đã gồm VAT"; không xử lý thuế lưu trú/phí khác.
26. **Đặt phòng mới** chỉ hỗ trợ ngắn ngày, ngày đến tối đa 31/12/2026, tối đa 60 đêm; không chọn được giá theo kênh.
27. **Rò rỉ quyền**: Sale thấy số giấy tờ (đã che) trong CRM và P&L; Buồng phòng thấy giá vốn; mọi vai bấm được mọi hành động trong drawer/modal mở từ CRM.
28. **Số cứng trên Dashboard** (ADR, % tăng, các thẻ "Cần chú ý", "1 phiếu mức độ cao", "cảnh báo thị thực căn 102") sẽ sai ngay khi dữ liệu đổi.
29. Đêm khả dụng không trừ phòng khoá (OOO) → RevPAR/công suất có thể bị hiểu sai.
30. Kiểm trùng lịch chỉ ở client, không có giao dịch → đặt trùng khi nhiều người dùng.

### 8.3 Khả năng truy cập (a11y)
- Modal/drawer **không bẫy focus, không đưa focus vào khi mở, không trả focus khi đóng**.
- Dòng bảng khai báo bấm bằng `tr` (có button bên trong nhưng vùng bấm chính không dùng bàn phím được).
- Tooltip biểu đồ chỉ theo chuột; biểu đồ SVG không có bảng dữ liệu thay thế.
- Trạng thái chủ yếu truyền bằng màu (thanh rack, viền thẻ buồng) – đã có nhãn chữ ở chip nhưng thanh rack chỉ có `title`.
- `alert` cảnh báo trong modal không có `role="alert"` (chỉ lỗi form có).
- Ô số lượng/giá nhỏ (64–96px) khó thao tác trên mobile; tab dưới mobile có 9–11 mục cuộn ngang.
- Thẻ `<title>` nằm trong `<body>`; trang thiếu `lang="vi"`.

### 8.4 Hiệu năng và kỹ thuật
- Mỗi thao tác gọi `render()` dựng lại toàn bộ màn hình bằng `innerHTML` (mất trạng thái input, cuộn); ổn ở 10 căn nhưng không mở rộng được.
- `dupPairs()` O(n²) chạy mỗi lần render CRM.
- Nhiều listener toàn cục chồng nhau, monkey-patch nhiều lớp → khó bảo trì, dễ lỗi thứ tự xử lý.
- Tính toán ngày bằng độ lệch số nguyên, không xử lý múi giờ/DST.
- Font Google tải ngoài – cần tự host cho production/offline.

---

## 9. Câu hỏi mở cần chủ đầu tư xác nhận

**Giá & bán hàng**
1. Giá đêm niêm yết = giá tháng ÷ 12 là chủ ý? Quy tắc làm tròn giá đêm (666.667)? Có giá theo mùa/lễ Tết/cuối tuần cho kênh trực tiếp (ngoài +15% T6–T7 trên OTA)?
2. Phụ thu khách nước ngoài +10% chỉ áp cho dài hạn – có áp cho ngắn ngày? Căn cứ phân biệt VN/NN (quốc tịch hay loại giấy tờ)? Việt kiều thì sao?
3. Bảng giảm giá, ký quỹ, chu kỳ thu, hoa hồng theo kỳ hạn (5.2) đã chốt chưa? Vì sao HH 2 năm thấp hơn 1 năm? Hoa hồng tính trên tiền thuê hay cả phí dịch vụ? Chi hoa hồng khi nào (ví dụ 50% khi ký, 50% sau…)?
4. Ngắn ngày: giảm 10% (≥7 đêm), 15% (≥14 đêm) áp cho mọi kênh? Từ bao nhiêu đêm thì chuyển sang báo giá dài hạn (1 tháng)?
5. Phụ thu thêm người, trẻ em, giường phụ? Sức chứa tối đa mỗi căn?
6. Chính sách huỷ và hoàn cọc cho đơn trực tiếp/CTV (ngắn ngày và dài hạn)? Phạt chấm dứt hợp đồng sớm?

**Vận hành**
7. Phụ thu nhận sớm/trả muộn: có ân hạn đến 13:00 (như bảng `LATE`) không? Áp dụng thế nào cho khách dài hạn? Cho khách OTA (theo chính sách OTA hay chính sách OTTIMO)?
8. FOC: hạn mức theo người duyệt? Lễ tân trưởng được duyệt đến bao nhiêu? Có cần phê duyệt trên app (PIN/OTP) không?
9. Trả phòng dài hạn: quy trình kiểm phòng, khấu trừ ký quỹ, thời hạn hoàn ký quỹ, chốt điện nước kỳ cuối?
10. Đơn giá điện 3.500 đ/kWh, nước 25.000 đ/m³ cố định hay theo bậc EVN? Có phí internet/rác/gửi xe?
11. Hạn giữ chỗ hết hạn: tự huỷ hoàn toàn hay báo sale quyết định? Báo giá hết hạn 3 ngày có tự khoá?
12. Lịch dọn dài hạn theo ngày cố định; khung giờ 9:00–11:00 cố định? Giặt ủi tính giá thế nào (bảng giá)?
13. Có cần quản lý ca làm việc, chấm công, phân việc buồng phòng theo người không?

**Pháp lý & dữ liệu**
14. Thời hạn lưu ảnh giấy tờ 30 ngày sau trả phòng – luật sư xác nhận? Có lưu thông tin khai báo (không ảnh) lâu hơn không?
15. Có tài khoản cơ sở lưu trú trên cổng Bộ Công an chưa? Ai chịu trách nhiệm khai báo ca tối (sau 23:00 khách mới đến thì xử lý sao)?
16. Hoá đơn điện tử: đã chọn nhà cung cấp nào? Thuế suất VAT áp dụng (8% hay 10%)? Giá niêm yết đã gồm VAT cho cả dài hạn?
17. Hợp đồng thuê dài hạn có cần mẫu hợp đồng điện tử/ký số trong app không?

**Kênh & tích hợp**
18. Chọn channel manager nào (Beds24, ezCloud, khác)? Ngân sách phí hàng tháng? Có bán Expedia/Trip.com/Traveloka thật không?
19. Kênh liên lạc chính: Zalo OA (ZNS) có sẵn chưa? WhatsApp/KakaoTalk cho khách nước ngoài?
20. Cổng thanh toán (VNPay, OnePay, Stripe…)? Tài khoản ngân hàng nhận VietQR?

**Sản phẩm**
21. Phạm vi MVP: những phân hệ nào bắt buộc cho ngày mở bán (ví dụ: rack + đơn + khai báo + bill), những gì để sau (app khách, F&B, P&L)?
22. Ai dùng thiết bị gì: lễ tân máy tính, buồng phòng điện thoại? Có cần chạy offline khi mất mạng?
23. App khách: cần mã cửa thông minh/khoá điện tử tích hợp không? Ngôn ngữ ưu tiên đầu tiên?
24. Có mở rộng sang nhiều cơ sở (multi-property) trong tương lai không? Có cần đa tiền tệ?
25. Các số mục tiêu: công suất 80%/tháng, 4–6 căn dài hạn – có muốn hệ thống cảnh báo khi lệch mục tiêu không?
26. Báo cáo P&L cần nhập chi phí trực tiếp trong app hay lấy từ kế toán? Có cần chi phí thuê nhà, khấu hao để ra lợi nhuận ròng?
