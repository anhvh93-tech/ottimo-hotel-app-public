# Hướng dẫn chuyển đổi ngày đầu – OTTIMO Desk v1.0 (DOM-1)

- Dành cho: Chủ đầu tư (OWN), lễ tân trưởng (FDL), quản lý (MGR, nếu có), kế toán | Lập: PO, 26/10/2026, góc nhìn nghiệp vụ theo `product/docs/business-rules.md` v0.4.3 · **Sửa PO 26/10 (tối): giờ nhận phòng từ 12:00 theo BR v0.4.6 (FB-INV-004)** – mốc chuyển giữ 14:00
- Trạng thái: **bản 1 – chờ DOM rà và diễn tập trên staging** (mục 8). Chỗ ghi [GIẢ ĐỊNH – DOM xác nhận] có thể đổi sau diễn tập; nguyên tắc ở mục 0 không đổi.
- Đi kèm: `rounds/round-03/inv-golive-checklist.md` (C2, C4) · `product/docs/staff-one-pager.md`
- Repo công khai: tài liệu này không chứa và không cần số tài khoản, số giấy tờ, mã cửa hay mật khẩu. Danh sách chuyển đổi (mục 3) giữ ở OTTIMO, không gửi đội.

Ký hiệu: **D** = ngày chạy. **Mốc chuyển** = 14:00 ngày D (mốc sổ sách, không phải giờ nhận phòng: khách nhận phòng từ 12:00 – BR-401 v0.4.6).

## 0. Năm nguyên tắc

1. **Một mốc chuyển: 14:00 ngày D** (giờ phòng chắc chắn sẵn sàng; sau 12:00 nên không phát sinh phụ thu nhận sớm). Từ **đêm D** trở đi mọi đêm, mọi khoản thu nằm trên Desk. Trước đó nằm trong sổ cũ.
2. **Mỗi đồng tiền chỉ ở một sổ.** Khoản nào đã nhập Desk thì sổ cũ ghi "Đã chuyển sang Desk", kế toán không cộng hai lần.
3. **Không nhập lịch sử.** Đơn đã trả phòng, doanh thu cũ, công nợ cũ ở lại sổ cũ. Không tạo đơn giả để chở số liệu cũ: đơn giả làm sai công suất, doanh thu và khai báo lưu trú.
4. **Nhập trước, đối chiếu sau, rồi mới bỏ sổ.** Hai lần đối chiếu có người ký (D−1 và tối D), sổ giấy song song 3 ngày.
5. **Danh sách không chứa bí mật.** Số giấy tờ đọc trực tiếp từ sổ đăng ký cũ khi nhập, không chép sang danh sách. Không chụp lại giấy tờ, không gửi qua Zalo.

## 1. Chọn ngày D

| Nên | Vì sao |
|---|---|
| **Thứ Hai hoặc thứ Ba** | Ngày đến thứ Sáu, thứ Bảy, ngày đặc biệt bị áp **tối thiểu 2 đêm** (BR-113). Khách đang ở chỉ còn 1 đêm sẽ khó nhập |
| Ngày có **ít khách đang ở** nhất trong tuần | Mỗi khách đang ở là một lần nhập tay và một lần nhập giấy tờ |
| Không có đoàn, không trùng ngày đặc biệt (+15 %/+30 %) | Tránh giá đặc biệt và đơn nhóm (đơn nhóm chưa có ở v1.0) |
| Buổi B2 xong **ít nhất 1 ngày trước D** | Tài khoản nhận VietQR có hiệu lực từ hôm sau |
| Báo động (Healthchecks, UptimeRobot, Google Chat) đã gắn | Điều kiện QC cho ngày chạy với dữ liệu thật |

## 2. Lịch – ai làm gì, giờ nào

| Khi | Ai | Việc | Xong khi |
|---|---|---|---|
| D−5 → D−2 | OWN + FDL | Lập **danh sách chuyển đổi** theo mẫu mục 3, từ sổ đặt phòng, sổ thu tiền, extranet OTA, hợp đồng dài hạn | Đủ 5 nhóm, mỗi dòng có số đã thu |
| D−5 → D−2 | Đội (DOM + QA) | **Diễn tập chuyển đổi trên staging** bằng dữ liệu giả, đúng các bước mục 4; sửa hướng dẫn nếu Desk chặn | Mục 8 có câu trả lời |
| D−2 | OWN | Liên hệ khách đang **giữ chỗ chưa cọc**: xin cọc trước D−1, hoặc báo hủy | Nhóm "giữ chỗ" còn ít nhất có thể |
| D−1 trước 12:00 | OWN | Kiểm VietQR thật (checklist C1). Phát `staff-one-pager.md`, mỗi nhân viên đăng nhập thử một lần, đổi mật khẩu tạm | Mọi người vào được; quản lý đã có 2 bước |
| **D−1 14:00–17:00** | FDL nhập, OWN ngồi cạnh để duyệt | Nhập **nhóm 1, 2, 3, 4** (mục 4). Ghi cọc đã thu | Mọi dòng danh sách có mã đơn `OTM-…` |
| **D−1 17:00–17:30** | FDL + OWN | **Đối chiếu 1** (mục 5). OWN ký vào danh sách | Khớp hết, hoặc có ghi chú xử lý |
| D−1 17:30 → mốc | Lễ tân ca | Đơn **mới** nhận: nhập Desk trước, ghi sổ cũ sau | – |
| D 06:00–12:30 | Lễ tân ca | Khách **trả phòng ngày D** làm trong **sổ cũ** như thường (các đơn này không có trên Desk) | – |
| D trước 12:00 | Buồng phòng | Căn **trống từ đêm qua** có khách đến ngày D: kiểm, báo **sẵn sàng** trên app (BR-807) | Căn đó hiện sẵn sàng trên Desk |
| D từ 12:00 | Lễ tân ca | **Khách mới đến ngày D** (nhóm 2, đơn mới): nhận trên Desk ngay khi căn đã được buồng phòng báo **sẵn sàng (`VI`/`VC`) trong ngày D**, không phụ thu. Trước buổi đi căn, trạng thái trên Desk của căn có khách trả ngày D **chưa đúng thực tế** (trả phòng làm ở sổ cũ): không nhận theo trạng thái cũ. Căn chưa xong: giữ hành lý, hẹn giờ, muộn nhất 14:00 | – |
| D 12:30–13:45 | Buồng phòng + FDL | Đi từng căn, cập nhật **trạng thái buồng** trên app: có khách / trống sạch / cần dọn. **Làm căn có khách đến ngày D trước** | Sơ đồ phòng khớp thực tế |
| **D 14:00** | FDL | **Mốc chuyển.** Bấm **Nhận phòng** cho nhóm 3 và 4 (giờ nhận ghi 14:00 = mốc chuyển). Khách mới đến ngày D tiếp tục nhận như thường | Mọi căn có khách hiện "đang ở" |
| D 14:00–17:00 | FDL | **Giấy tờ và khai báo** cho nhóm 3, 4 (mục 4.6) | Không còn hạn khai báo đỏ |
| D 14:00 | OWN | **Khóa sổ cũ**: từ giờ sổ cũ chỉ dùng thu công nợ cũ (nhóm 5) và tra cứu | Ghi dòng "Khóa sổ 14:00 dd/mm", ký |
| **D 22:00** | Lễ tân ca tối + OWN (gọi điện được) | **Đối chiếu 2** (mục 5) + so sổ giấy dự phòng | Khớp; lệch thì `/feedback` |
| D+1, D+2 22:00 | Lễ tân ca tối | So sổ giấy với Desk | – |
| D+3 sáng | OWN | Quyết **bỏ sổ giấy** nếu 3 tối liền khớp | Ghi vào sổ |

## 3. Mẫu danh sách chuyển đổi

Một dòng cho một đơn (đơn nhiều căn: một dòng mỗi căn). Bảng tính hoặc giấy đều được.

| Cột | Ghi gì |
|---|---|
| Nhóm | 1 đơn tương lai · 2 đơn đến ngày D · 3 khách ngắn ngày đang ở, còn ở qua đêm D · 4 khách dài hạn đang ở · 5 công nợ cũ · G giữ chỗ chưa cọc |
| Mã cũ | Mã trong sổ cũ hoặc mã OTA |
| Khách đứng tên, SĐT | Đơn Trực tiếp/CTV bắt buộc có SĐT |
| Kênh, nguồn, người chốt | Trực tiếp (Zalo/điện thoại, website, vãng lai, khách quay lại), CTV (tên CTV), Airbnb, Booking, Agoda… |
| Căn, ngày đến, ngày đi | Nhóm 3, 4: **ngày đến ghi D**, ghi ngày đến thật ở cột ghi chú |
| Người lớn, trẻ em | Theo đơn đã chốt |
| Giá từng đêm đã chốt | Giá khách đã được báo; đơn OTA theo extranet |
| Đã thu: số tiền, ngày, hình thức | Cọc hoặc tiền phòng đã thu. Chuyển khoản ghi ngày tiền về |
| Phần chuyển sang Desk | Nhóm 1, 2: toàn bộ cọc. Nhóm 3: phần đã thu cho các đêm từ D. Nhóm 4: 0 (mục 4.5) |
| Còn phải thu | Theo đơn |
| Mã đơn mới, người nhập, giờ | Điền khi nhập xong |

## 4. Cách nhập từng nhóm

### 4.1 Nhóm 1 và 2 – đơn tương lai, Trực tiếp hoặc CTV, đã cọc
1. **Đơn đặt phòng → Đặt phòng mới.** Chọn kênh, nguồn, người chốt (CTV bắt buộc), căn, ngày, số người, SĐT.
2. **Giá:** để trống nếu giá lịch trên Desk bằng giá đã chốt. Khác thì nhập **giá từng đêm đã chốt**.
   - Đơn **≥ 7 đêm**: Desk tự giảm 10 % (≥ 14 đêm: 15 %) trên giá nhập (BR-107). Vậy nhập **giá trước giảm**.
   - Giá ngoài sàn–trần thì Desk chặn. Nhập giá lịch, rồi xin **giảm giá** qua đường duyệt, lý do "Giá đã chốt trước ngày chạy". OWN duyệt ngay vì đang ngồi cạnh.
   - Kênh Trực tiếp tự cộng **phụ thu người** (BR-110). Lệch với số đã báo khách thì ghi chú, quản lý xử lý bằng miễn giảm.
3. Lưu → đơn **đã xác nhận**, hiện trên sơ đồ phòng.
4. **Ghi cọc:** ghi thu số cọc đã nhận, đúng hình thức (chuyển khoản/tiền mặt), ghi chú "Cọc thu trước ngày chạy – sổ cũ, ngày dd/mm". Khoản chuyển khoản mang cờ **"chờ đối soát"**; OWN hoặc quản lý tick sau khi so sao kê.
5. Sổ cũ: ghi "Đã chuyển sang Desk – OTM-…".

### 4.2 Nhóm 1 và 2 – đơn OTA
- **Đặt phòng mới**, kênh OTA, nhập **mã OTA**, **kiểu thanh toán** (OTA thu hộ hay khách trả tại chỗ), giá từng đêm theo extranet.
- OTA đã thu hộ: **không** ghi cọc; Desk tự ghi "Đã thu qua OTA". Trả tại chỗ: thu khi nhận phòng.
- Kiểm extranet từng kênh: căn đã bán trên kênh này phải đóng trên các kênh khác (Desk chưa tự đóng ở v1.0).

### 4.3 Nhóm G – giữ chỗ chưa cọc
- Tốt nhất xử lý xong ở D−2 (xin cọc hoặc hủy).
- Còn lại: tạo lại ở **Báo giá & giữ chỗ** (báo giá → giữ chỗ), thời hạn bằng phần còn lại của hạn cũ. Hạn giữ không vượt 12:00 ngày đến (BR-302). Hết hạn chưa cọc thì Desk tự hủy và mở lại căn.

### 4.4 Nhóm 3 – khách ngắn ngày đang ở, còn ở qua đêm D
Nhập ở D−1 như một **đơn đến ngày D**, rồi nhận phòng lúc 14:00 ngày D.
1. **Đặt phòng mới**: ngày đến **D**, ngày đi = ngày đi thật, đúng căn, kênh và số người.
2. **Giá từng đêm** như đơn cũ.
   - Đơn cũ được giảm theo tổng số đêm mà phần còn lại **< 7 đêm**: nhập **giá đã giảm** (Desk không giảm thêm).
   - Phần còn lại **≥ 7 đêm**: nhập giá trước giảm (Desk tự giảm).
   - Ngày D rơi vào ngày tối thiểu 2 đêm mà khách chỉ còn 1 đêm: xem mục 7.
3. Ghi chú đơn: "Khách ở từ dd/mm (sổ cũ), mã cũ …".
4. **Ghi thu phần đã trả cho các đêm từ D**: khách ngắn ngày thường trả đủ khi nhận phòng (BR-305), nên phần này thường bằng tiền các đêm còn lại. Ghi chú "Chuyển từ sổ cũ – đã thu ngày dd/mm". Phần của các đêm trước D ở lại sổ cũ.
5. **14:00 ngày D: Nhận phòng**, giờ nhận ghi 14:00 (mốc chuyển). Không phát sinh phụ thu nhận sớm (BR-411 v0.4.6: từ 12:00 là 0 %). Không đổi mã cửa (mã cửa vẫn quản lý ngoài app ở v1.0).
6. Khi khách trả phòng: bill trên Desk chỉ gồm các đêm từ D và khoản mới. Nếu khách cần một bill trọn kỳ ở, lễ tân đưa thêm phần sổ cũ.

Khách **trả phòng sáng ngày D**: không nhập. Trả phòng trong sổ cũ.

### 4.5 Nhóm 4 – khách dài hạn đang ở
- **Đặt phòng mới → Đơn dài hạn nhập tay**: căn, ngày vào = **D**, ngày ra = ngày hết hợp đồng, tiền/tháng. Đơn mang cờ "HĐ ngoài hệ thống" và giữ căn như mọi đơn.
- **Ký quỹ, lịch kỳ thu, điện nước** giữ theo hợp đồng giấy và sổ kế toán tới v1.3. **Không ghi ký quỹ vào Desk.** [GIẢ ĐỊNH – DOM xác nhận] Nếu ghi, Desk có thể coi là tiền thừa phải hoàn khi trả phòng.
- Kỳ thuê thu **sau** D: ghi thu trên đơn, ghi chú "Kỳ tháng mm/yyyy".
- Nhận phòng lúc 14:00 ngày D như nhóm 3.

### 4.6 Giấy tờ và khai báo lưu trú cho nhóm 3, 4
Khách đã được khai báo khi đến. Trên Desk (**Giấy tờ & khai báo**):
1. Nhập giấy tờ **người đứng tên**, gõ từ sổ đăng ký cũ. **Không chụp lại ảnh** (hạn lưu ảnh đã đặt ngắn nhất; khách cũng không phải đưa giấy tờ lại).
2. Đánh dấu **đã khai**, ghi mã hồ sơ đã có. [GIẢ ĐỊNH – DOM xác nhận khi diễn tập: Desk cho đánh dấu đã khai khi không có ảnh]
3. Làm **trước 23:00 ngày D**. Desk tính hạn khai báo từ giờ nhận 14:00, nên quá hạn sẽ báo đỏ dù khách đã được khai từ trước.

### 4.7 Nhóm 5 – công nợ cũ (khách đã đi còn nợ)
- **Không nhập vào Desk.** Desk chỉ ghi công nợ khi trả phòng qua Desk.
- Kế toán giữ danh sách, thu và ghi ở sổ cũ. Khách nợ cũ quay lại ở: nhắc tại quầy, thu và ghi sổ cũ, không gộp vào bill Desk.

## 5. Đối chiếu

**Đối chiếu 1 – D−1 17:00** (FDL + OWN, ký):
- [ ] **Sơ đồ phòng** D → D+14: từng căn, từng đêm khớp sổ cũ và extranet.
- [ ] **Tổng cọc đã nhập Desk** (Nhật ký tiền, lọc theo ngày D−1) = tổng cột "Phần chuyển sang Desk" của nhóm 1, 2, 3.
- [ ] "Cần chú ý" không còn **xung đột** đơn trùng.
- [ ] Mỗi dòng danh sách có mã `OTM-…`; sổ cũ ghi "Đã chuyển sang Desk".

**Đối chiếu 2 – D 22:00** (lễ tân ca tối; OWN nhận kết quả qua điện thoại):
- [ ] Số căn "đang ở" trên Desk = số căn có khách thật.
- [ ] Không còn hạn khai báo đỏ cho khách nhóm 3, 4.
- [ ] Tiền thu trong ngày trên Desk = sổ giấy dự phòng.
- [ ] Buồng phòng: căn trả trong ngày đã có việc dọn trên app.

Lệch thì không sửa tay lung tung: ghi lại, gõ `/feedback` với mã đơn, sáng hôm sau FDL và OWN xử lý.

## 6. Kế toán

- **Doanh thu phòng:** đêm trước D theo sổ cũ; từ đêm D theo Desk. Không có đêm nào nằm ở cả hai sổ.
- **Cọc và tiền đã thu trước D nhưng nhập Desk:** Nhật ký tiền ghi **ngày nhập (D−1)**, ngày thu thật nằm ở ghi chú. Kế toán coi đây là số chuyển sổ, không phải tiền thu mới.
- **Ký quỹ dài hạn, công nợ cũ:** ở sổ kế toán, không ở Desk.
- **Hóa đơn GTGT:** vẫn xuất ngoài app như hiện nay.

## 7. Khi Desk chặn lúc nhập

| Desk báo | Làm gì |
|---|---|
| "Ngày này cần ở tối thiểu 2 đêm" (khách đang ở chỉ còn 1 đêm cuối tuần) | Quản lý hoặc OWN xử lý. [GIẢ ĐỊNH – DOM xác nhận cách làm khi diễn tập.] Tránh bằng cách chọn D là thứ Hai hoặc thứ Ba |
| Giá ngoài khoảng sàn–trần | Nhập giá lịch, xin giảm giá qua đường duyệt (mục 4.1 bước 2) |
| Hết phòng / trùng đơn | Có thể là **trùng thật** trong sổ cũ. Dừng, kiểm sổ và extranet, xử lý trước D |
| Cần số điện thoại | Lấy SĐT của khách; đơn Trực tiếp/CTV bắt buộc |
| Ngày đến đã qua | Đúng: Desk không nhận đơn đến trong quá khứ. Nhóm 3, 4 nhập ngày đến là D |

## 8. Câu đội kiểm khi diễn tập trên staging (DOM + QA, trước D−1, không cần INV)

| # | Câu | Ảnh hưởng nếu khác giả định |
|---|---|---|
| Q1 | Ở quầy, đơn ngày đến thứ Sáu/Bảy 1 đêm cho khách đang ở có cách nhập không (ngoại lệ đêm lẻ BR-113, hay quản lý)? | Sửa mục 7 dòng 1 |
| Q2 | Ghi thu cọc cho đơn đã xác nhận tạo ở quầy: có đúng cờ "chờ đối soát", ghi chú hiện ở Nhật ký tiền? | Sửa mục 4.1 bước 4 |
| Q3 | "Đơn dài hạn nhập tay": folio có dòng tiền thuê không; khi trả phòng Desk đòi thu bao nhiêu? | Sửa mục 4.5 |
| Q4 | Đánh dấu "đã khai" khi chỉ nhập số giấy tờ, không ảnh, có được không? | Sửa mục 4.6 |
| Q5 | Nhận phòng nhóm 3 lúc 14:00: điều kiện "đã thu đủ" (BR-402 (2)) đạt khi đã ghi thu chuyển sổ? | Sửa mục 4.4 bước 4 |
| Q6 | Trạng thái buồng ban đầu sau `production-bootstrap`; đổi trạng thái từng căn ở đâu? | Sửa lịch D 12:30 |
| Q7 | Căn chủ đầu tư dùng riêng có nhập bằng kênh "Nội bộ" được không? | Thêm một dòng ở mục 4 |
| Q8 | Khách ở quá 18:00, đêm đó căn đã bán: sau khi đổi căn đơn sắp đến (cùng nhóm, rồi khác nhóm), Desk có chuyển sang "Trả phòng – tính thêm 1 đêm" (không cần quản lý) không? | Sửa `staff-one-pager.md` mục "Khi khách ở quá 18:00", ESC-031 |
| Q9 | Quản lý duyệt ở "Cần duyệt" bằng phiên của mình trên máy quầy, rồi đăng xuất: lễ tân đăng nhập lại có mất dữ liệu đang nhập không? | Sửa mục 9 |
| Q10 | (ESC-031) Trên staging có bản vá BE-B + màn FE: khi đêm ngày đi không bán được, màn trả phòng hiện "Ghi phụ thu – quản lý xem lại" thay ô mật khẩu quản lý; số chỉ đọc 792.000 (căn 203 đêm thường); quản lý thấy mục "Cần chú ý" và sửa được dòng trên bill trong 24 giờ? Tên nút trên màn khác chữ trong tài liệu? | Sửa `staff-one-pager.md` bước 3–5 và mục 9 (tên nút, hoặc quay về cách cũ nếu bản vá chưa lên) |

DOM ghi câu trả lời vào cột cuối và sửa các mục liên quan trước D−1. PO duyệt bản sửa.

## 9. Việc cần quản lý xác nhận trong những ngày đầu (v1.0)

Bản thật bật **đăng nhập 2 bước bắt buộc** cho quản lý và chủ đầu tư. Vì vậy Desk **từ chối mọi ô "mật khẩu của quản lý"** trên phiên của lễ tân (SEC giữ chặn này). Lúc chuyển đổi và các ngày sau, chỉ dùng các đường sau (không đường nào cần mật khẩu của người khác):

| Việc | Cách làm ở v1.0 |
|---|---|
| Giảm giá ngoài sàn–trần lúc nhập đơn cũ, miễn/giảm vượt hạn mức lễ tân, xóa công nợ, duyệt hoàn | Lễ tân gửi yêu cầu, ghi lý do. Quản lý hoặc OWN mở **"Cần duyệt"** bằng **tài khoản của chính mình** (lễ tân đăng xuất khỏi máy quầy trước, hoặc quản lý dùng thiết bị riêng) và duyệt. Lúc nhập D−1, OWN ngồi cạnh nên duyệt ngay |
| Ghi công nợ khi trả phòng | Quản lý hoặc OWN làm bước Bill trên phiên của chính mình |
| Phụ thu trả muộn bằng giá 1 đêm (khách rời sau 18:00, đêm đó căn đã bán) | Theo ESC-031 (INV 26/10, vá trước ngày D): phòng trước và đổi căn khách sắp đến theo `staff-one-pager.md`. Không còn căn: lễ tân gọi quản lý/OWN báo trước, rồi chọn "Ghi phụ thu – quản lý xem lại" – Desk ghi đúng giá 1 đêm, không sửa, không miễn, lý do bắt buộc, không cần mật khẩu của ai. Quản lý/OWN nhận thông báo và mục "Cần chú ý", xem lại trong 24 giờ kể từ lúc bấm trả phòng: đồng ý → "Đã xem"; nên giảm → sửa dòng phụ thu trên bill, yêu cầu hoàn tự sinh, OWN duyệt hoàn (người sửa không tự duyệt). Quá 24 giờ chưa xem → Desk báo OWN, bill đóng. Nếu ngày D bản vá chưa lên production (Q10): giữ cách cũ – gọi OWN, ghi sổ giấy số Desk hiển thị, báo "P0" (BR-416 (i)–(viii)) |

Không ai đọc mật khẩu qua điện thoại hay đưa mật khẩu cho người khác gõ hộ, kể cả trong ngày chuyển đổi.


## 10. Từ ngày D tới bản v1.0.1 (dự kiến 04/11) – ba việc khác thường

Thêm 30/10 (PO, theo bản `v1.0.0` và cổng QC v1.0 mục 4.2). Chi tiết ở `release-notes.md` mục "Giới hạn đã biết", sổ tay mục 1.1, 2.1, 2.4, 2.9 và `staff-one-pager.md`.

| Việc | Ai | Khi nào | Tới khi nào |
|---|---|---|---|
| **Không tạo, không gửi link check-in online** cho khách thật, kể cả các đơn nhập ở mục 4.1–4.3. Mọi khách làm giấy tờ tại quầy, lễ tân hỏi đồng ý lưu ảnh bằng câu chuẩn và chỉ tờ thông báo giấy tờ ở quầy. In và dán tờ thông báo **trước 12:00 ngày D** | Lễ tân; OWN in tờ thông báo | Mọi ca | Chủ đầu tư báo "mở lại" sau khi v1.0.1 lên production (quyết định D-T4 của PO) |
| **Rà giữ chỗ "0h00" đỏ** trên Sơ đồ phòng và Hôm nay, xử lý hết trước 12:00 ngày đến. Lần rà đầu tiên: ngay sau khi nhập xong nhóm G (mục 4.3) | Lễ tân, lễ tân trưởng; quản lý quyết đơn có cọc thiếu | Đầu mỗi ca | Bản v1.0.1 (BUG-R3-041, WA-04) |
| **Kiểm bảo mật buổi sáng B1–B6** | OWN; quản lý đối soát cùng | Mỗi sáng trước 09:00, kể cả ngày nghỉ | Bản v1.0.1 sửa BUG-R3-032 (chậm nhất 09/11, ESC-040 A) |
