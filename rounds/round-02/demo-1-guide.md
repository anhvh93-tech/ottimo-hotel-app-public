# Hướng dẫn tự thử – Demo lần 1 (Round 2, sau Sprint 3)

> Người soạn: UXR · 17/10/2026 · **v1.3** (v1.1: UXR tự bấm đủ 10 kịch bản, 17/10 trưa. v1.2: UXR đi lại KB1–KB4, KB6–KB8 sau vòng sửa 9, 17/10 chiều. **v1.3: UXR đi lại trên bản dựng `fe4b166` (sau vòng sửa 9b, 9c), 17/10 15:20–15:45** – KB4, KB6, KB7 đầy đủ; KB1–KB3, KB8 lướt kiểm hồi quy; thêm phần lễ tân xem ảnh khách gửi ở KB9. **Bỏ bước 0 của KB7**: trả phòng sau 12:30 nay vào thẳng **Trả phòng** được, app tự tính phụ thu trả muộn ở bước Phụ phí) · Dành cho anh/chị (chủ đầu tư) tự bấm trên máy Mac, **khoảng 70 phút**.
> Đi kèm (cùng thư mục `rounds/round-02/`): **phiếu ghi nhận** `demo-1-feedback-form.md` (mở song song, ghi ngay khi thấy lạ) và **trang giới hạn** `demo-1-limits.md` (**đọc 2 phút trước khi bắt đầu**, nhất là mục C). Không còn chỗ nào phải làm theo thứ tự đặc biệt.
> Các ô dữ liệu do OPS điền ngày 17/10 (nguồn: `rounds/round-02/outputs/OPS/demo-1.md`). Mã đơn, căn và tên khách giữ nguyên mỗi lần dựng lại; ngày luôn tính theo hôm chạy lệnh.

## 1. Chuẩn bị (5 phút)
- Docker Desktop đang chạy. Trình duyệt Chrome (hoặc Safari).
- 2 ảnh **bất kỳ** (JPG/PNG, ví dụ ảnh chụp màn hình) để trên Desktop – dùng làm "ảnh giấy tờ", "ảnh biên nhận". **Không dùng ảnh CCCD/hộ chiếu thật, không nhập số giấy tờ, SĐT, số tài khoản thật.** Ảnh giấy tờ mẫu nếu OPS có: **có sẵn** – `product/infra/demo/.out/anh-giay-to-mau.png` và `anh-bien-nhan-mau.png` (hình vẽ giả, có gạch đỏ, không có chữ hay số thật).
- Điện thoại có app ngân hàng – **chỉ để quét QR, không chuyển tiền**.
- Nên làm **từ 09:00 đến 17:00, cùng ngày chạy lệnh**: app dùng đồng hồ thật (giờ nhận 14:00, ân hạn trả 12:30, sau 18:00 tính thêm đêm). Thử **buổi chiều** vẫn được: KB7 khi đó có phụ thu trả muộn – app tự tính ở bước Phụ phí (KB7 bước 2).
- Tắt/bật lại Docker giữa buổi **không còn** làm mất giấy tờ đã nhập (đã sửa 17/10; UXR đã khởi động lại bản demo và mở lại được số, ảnh giấy tờ). Chỉ lệnh **Tắt** và **Làm lại từ đầu** bên dưới mới xóa dữ liệu.

**Bật** (Terminal, một lệnh): `cd ~/Desktop/hotel-app && ./product/infra/demo/demo-up.sh` → chờ dòng **`XONG – demo từ commit …`** kèm 3 địa chỉ và đường dẫn tệp tài khoản (~**5–8 phút** lần đầu vì phải build; các lần sau ~**2 phút**). Trên máy này Docker là **OrbStack** – mở OrbStack trước.
**Mở**: Desk (máy quầy) http://localhost:8181 – **mọi vai đều đăng nhập ở đây**, kể cả Buồng phòng, Kỹ thuật, Sale, CTV · Trang khách http://localhost:8183 (chỉ dùng ở KB9). Địa chỉ http://localhost:8182 (app nhân viên trên điện thoại) hiện chỉ là **khung trống** – có ở Sprint 4, không cần mở. Dùng đúng chữ `localhost`, **không** dùng `127.0.0.1` (app sẽ từ chối thao tác ghi).
**Bản đang chạy** (dựng từ commit **`fe4b166`** bằng `demo-up.sh --smoke` lúc 15:20 – smoke **ĐẠT**; UXR làm mới dữ liệu bằng `demo-reset.sh`, **XONG lúc 15:46 ngày 17/10**, sau khi đi thử): đã có sẵn, không cần chạy lệnh Bật; giữ chỗ D5 hết hạn lúc **20:45 ngày 17/10**; mật khẩu và link khách là bản mới trong tệp tài khoản; vẫn phải làm **Bước 0**. Thử vào ngày khác thì chạy "Làm lại từ đầu" trước.
**Tắt**: `./product/infra/demo/demo-down.sh` (xóa luôn dữ liệu demo; stack dev không bị đụng) · **Làm lại từ đầu** (xóa mọi thao tác, dựng lại dữ liệu theo hôm nay, **mật khẩu và link khách đổi mới**, cần làm lại Bước 0): `./product/infra/demo/demo-reset.sh` (~2 phút).

## 2. Đăng nhập theo vai
Tên đăng nhập và mật khẩu: mở file **`product/infra/demo/.out/demo-accounts.md`** (chỉ có trên máy này, không gửi file đó cho ai). Mọi vai mở ở **http://localhost:8181** (cột "Mở ở" trong file cũng đã ghi 8181 cho tất cả). Đổi vai: bấm **tên mình ở góc phải trên → Đăng xuất**, rồi đăng nhập vai khác ở cùng cửa sổ (máy đã cấp quyền ở Bước 0 vẫn giữ). Sai mật khẩu 5 lần sẽ khóa tài khoản 15 phút – nên sao chép, đừng gõ tay.

| Vai | Dùng ở | Vai | Dùng ở |
|---|---|---|---|
| Chủ đầu tư | Bước 0, KB8, KB10 | Lễ tân | KB1–KB8 |
| Quản lý | KB8 | Buồng phòng | KB1 |
| Lễ tân trưởng | KB8 (kèm việc gán căn của KB2) | CTV / môi giới | KB1, KB3 |
| Sale nội bộ, Bảo trì | Không bắt buộc (xem thêm nếu còn giờ) | | |

Màn **"Màn này đang được làm"** (Hôm nay, Tổng quan, Buồng phòng, Bảo trì) là **đúng kế hoạch** (Sprint 4), không phải lỗi.

**Bước 0 – một lần, 2 phút (Chủ đầu tư):** menu **Quản trị › Thiết bị được cấp** → ô **Tên máy**: "Mac demo" → tick các mục **Kiểm máy trước khi cấp** (nút cuối ghi "còn n mục kiểm" cho tới khi đủ 4 mục bắt buộc; mục "Đội kỹ thuật đã kiểm máy này" không bắt buộc) → **Nhập lại mật khẩu đăng nhập** → **Cấp quyền thiết bị này**. *Mong đợi:* "Máy này đã được cấp quyền.", dòng "Mac demo · Máy này" trong bảng, góc trái dưới hiện "Máy quầy đã cấp quyền". Bảng có sẵn một máy mẫu của đội ("Máy quầy lễ tân (demo)") – bỏ qua, đừng thu hồi. Vì sao: giấy tờ khách và số tài khoản hoàn tiền chỉ mở trên máy quầy được cấp. **Vẫn cần làm Bước 0**: OPS không cấp sẵn được cho trình duyệt của anh/chị (quyền máy nằm trong cookie của chính trình duyệt đó). Nếu nút không có hoặc báo lỗi, tệp tài khoản có cách dự phòng (dán 1 dòng vào Console).

## 3. Dữ liệu demo (OPS điền: căn · khách · mã đơn)
| Mã | Tình huống | Căn · khách | Mã | Tình huống | Căn · khách |
|---|---|---|---|---|---|
| D1 | Đến hôm nay, đã cọc (trực tiếp) | **102** · Nguyễn Thu Trang · OTM-00007 (2 đêm, cọc ~30 %, còn phải thu ~1,1 triệu, chưa nhập giấy tờ) | D6 | Báo giá của CTV | **402** · Vương Thị Hồng · BG-00002 (đến sau 8 ngày, 3 đêm, 3 người lớn; CTV Minh Anh đang giữ 0 chỗ) |
| D2 | OTA đã trả trước, đến hôm nay | **302** · Anna Petrova · OTM-00008 (Agoda, 3 đêm, 3 người lớn, còn phải thu 0) | D7 | Đơn dài hạn nhập tay | **301** · Đặng Quốc Bảo · OTM-00001 (từ 30 ngày trước, 6 tháng, nhãn "Nhập tay") |
| D3 | Đang ở, trả hôm nay, còn nợ | **103** · Trần Minh Quân · OTM-00002 (ở từ 2 hôm trước, còn nợ 60.000 đ giặt ủi; minibar căn có 10 món, 4 món miễn phí) | D8 | Căn khóa sửa chữa (OOO) | **203** · khóa từ ngày kia, 2 đêm ("Thay bình nóng lạnh…"); hôm nay 203 có khách Booking.com đến (Kim Min-ji) |
| D4 | Đang ở giữa kỳ (còn đêm trống sau) | **202** · Lê Hoàng Yến · OTM-00003 (2 người lớn trong Studio định mức 2, tối đa 3; trống 2 đêm sau ngày đi) | D9 | Đơn OTA chưa gán căn | Làn đỏ trên cùng · Elena Ivanova · OTM-00027 (Expedia, 4 người lớn, sau 6 ngày, 2 đêm – gán được vào **402**, là căn nhóm cao hơn nên cần **Lễ tân trưởng**) |
| D5 | Giữ chỗ đang đếm ngược | **201** · Nghiêm Hải Yến · OTM-00006 (sale Đức giữ 12 giờ, **hết hạn khoảng 5 giờ sau lúc chạy lệnh** – bản đang chạy: 20:45 ngày 17/10) | D10 | Đến ngày mai + link check-in online | **402** · Võ Ngọc Ánh · OTM-00011 (2 người lớn). Link đầy đủ: trong `product/infra/demo/.out/demo-accounts.md` (link đổi mỗi lần chạy lệnh) |

## 4. Mười kịch bản (làm theo thứ tự)
Mỗi kịch bản: làm các bước → so với **Mong đợi** → **khác thì ghi vào dòng cùng số trong phiếu** (kèm ảnh chụp màn hình: Cmd+Shift+4). Điều đã ghi trong mục C trang giới hạn thì **không cần ghi lại**.
Mẹo chung: bấm một thanh trên sơ đồ phòng mở **khung chi tiết đơn** bên phải; đóng bằng **Esc** hoặc nút **X** (sau vài thao tác Esc không ăn – dùng nút X). Các đơn ở xa hơn 14 ngày: bấm **›** (Tới 7 ngày) trên sơ đồ, hoặc vào **Đơn đặt phòng** và gõ **mã đơn** (ô Tìm kiếm chỉ tìm theo mã đơn, mã OTA, mã khách – chưa tìm theo tên).

### KB1 · Sơ đồ phòng theo vai · 5 phút
**Vai:** Lễ tân → Buồng phòng → CTV. **Mục tiêu:** mỗi người chỉ thấy phần việc của mình.
1. Lễ tân: trang Hôm nay → nút **Mở sơ đồ phòng** (sơ đồ mở ở kiểu **Lưới**, 14 ngày tính từ 2 hôm trước). Tìm: D1 (102 "Nguyễn Thu Tr…"), D2 (302 "Anna Petrova · đến hôm nay"), D3 (103, thanh tối kết thúc hôm nay), D4 (202, thanh tối), D5 (201, viền đứt, biểu tượng đồng hồ cát), D7 (301, thanh xanh "HĐ · Đặng Quốc Bảo · đến …" nhãn "Nhập tay"), D8 (203, ô sọc đỏ "Khóa phòng"), làn đỏ trên cùng "Chưa gán căn – xung đột OTA (1)". Bấm thanh D5 → khung chi tiết ghi "Hết hạn giữ chỗ sau … giờ … phút"; Esc để đóng.
2. Buồng phòng: menu **Các căn**. 3. CTV: đăng nhập là vào thẳng **Báo giá & giữ chỗ**, tab **Căn trống**.

**Mong đợi:** Lễ tân thấy tên khách trên thanh; kênh và tiền (Folio) trong khung chi tiết. Buồng phòng chỉ thấy số căn, tình trạng buồng (ví dụ "VC · Đã dọn, chờ kiểm") và "Có khách đến hôm nay/ngày mai" – **không** tên khách, giá, kênh; số bộ đồ dùng thêm chỉ hiện khi căn có khách vượt định mức (dữ liệu ban đầu chưa có căn nào). CTV thấy ô trống và "Đã kín", đơn của chính mình ghi "Đã kín · của bạn" – **không** thấy khách của người khác. **Ghi ngay** nếu Buồng phòng hoặc CTV thấy tên khách hay số tiền.

### KB2 · Đặt phòng mới + thử đặt trùng · 7 phút
**Vai:** Lễ tân. **Mục tiêu:** đặt nhanh, và không bao giờ đặt trùng.
1. Sơ đồ phòng → nút **Đặt phòng mới** (góc phải trên) → ô **Căn**: một căn trống; **Ngày đến – ngày đi**: đến **sau hôm nay ít nhất 8 ngày**, 2 đêm (chọn tối thứ Sáu + thứ Bảy để thấy giá cuối tuần); **Kênh** Trực tiếp; ô **Khách đứng tên**: gõ tên giả → chọn **Tạo nhanh khách "…"** → nhập SĐT giả (0900 000 001) → **Lưu hồ sơ** (ô tên có thể vẫn hiện chữ đỏ "Bắt buộc" – bỏ qua, khách đã được chọn); **Số tiền đã nhận** để nguyên số cọc gợi ý; **Cách thanh toán** **Tiền mặt** → **Tạo đơn** (= đơn A; ghi lại mã OTM-… ở góc khung chi tiết).
2. **Đặt phòng mới** lần nữa với **đúng căn và ngày đó**: chọn xong căn, dưới ô Căn hiện dòng nhỏ "Trùng lịch · Căn trống cùng nhóm: …". Tạo nhanh khách giả khác (0900 000 002), Tiền mặt → **Tạo đơn** → app chặn bằng khung đỏ trên đầu form → bấm một nút **"Dùng căn …"** → app **tạo đơn ngay** ở căn đó (= đơn B; giá tính lại theo căn mới). Ghi lại mã. Hai đơn này dùng lại ở KB8.
3. Thử đặt D8: **Đặt phòng mới**, ngày đến = ngày kia, 2 đêm, ô Căn chọn **203** → dòng nhỏ "Khóa phòng · Căn trống cùng nhóm: …"; chọn một khách bất kỳ, bấm **Tạo đơn** → bị chặn. Đóng form bằng nút **X** (form tự giữ nháp: lần sau mở **Đặt phòng mới** sẽ thấy lại căn 203 và ngày vừa chọn – chọn lại căn, ngày là được).
4. Làn đỏ "Chưa gán căn" (D9) → nút **Gán căn** → khung đơn Elena Ivanova → nút **Gán căn** ở cuối → hộp chọn căn: 402 ghi "Nâng hạng – cần lễ tân trưởng xác nhận" và Lễ tân **không chọn được** (đúng quy tắc). Bấm Hủy; việc gán làm ở KB8 bước 3 bằng vai Lễ tân trưởng.

**Mong đợi:** giá từng đêm tự tính, có cột "Nguồn giá" (thứ Sáu/thứ Bảy +15 %); cọc 30 % tiền phòng, làm tròn. Trùng lịch: báo ngay dưới ô Căn khi chọn, **chặn hẳn khi bấm Tạo đơn** với câu nêu căn, tên khách và ngày bị trùng, kèm nút căn thay thế; dữ liệu đã nhập không mất. Căn khóa không đặt được, câu báo nêu số căn và ngày ("Căn 203 đang khóa sửa chữa từ … đến …. Chọn căn khác."). Lễ tân không tự nâng hạng được.

### KB3 · CTV báo giá, giữ chỗ, lễ tân xác nhận cọc · 6 phút
**Vai:** CTV → Lễ tân. **Mục tiêu:** CTV tự báo giá tại chỗ; tiền cọc phải qua lễ tân xác nhận.
1. CTV: tab **Báo giá** → bấm **BG-00002** → **Ngôn ngữ gửi khách**: đổi Tiếng Việt ↔ English → **Sao chép gửi Zalo** (chỉ sao chép; app báo "Đã chép"). Xem hoa hồng: tab **Căn trống** → chọn ngày đến từ mai trở đi → **Tìm kiếm** → nút **Báo giá** cạnh một căn → form hiện dòng **"Bạn nhận (8% tiền phòng)"** → **Hủy** (không lưu).
2. Mở lại BG-00002 → **Khách đồng ý – Giữ chỗ** → Giữ trong **24 h** → **Tạo giữ chỗ** → **Mở đơn** → **Báo đã chuyển cọc** (số tiền tự điền, thêm ghi chú; ô đính ảnh biên nhận có ở Sprint 4) → bấm **Báo đã chuyển cọc**.
3. Lễ tân: Sơ đồ phòng → thanh **Vương Thị Hồng** ở căn 402 (viền đứt) → **Xác nhận đã nhận cọc** (ô số tiền điền sẵn số cọc cần thu) → ô **Cách thanh toán** chọn **Chuyển khoản** → **Xác nhận đã nhận cọc**. Đóng khung bằng nút X.

**Mong đợi:** văn bản báo giá không có hoa hồng/SĐT nội bộ; ngôn ngữ gửi khách hiện có Tiếng Việt và English. Giữ chỗ có mã đơn và giờ hết hạn ("Hết hạn giữ chỗ sau 23 giờ 59 phút"); CTV giữ tối đa 3 chỗ cùng lúc. Sau xác nhận: đơn "Đã xác nhận"; **Nhật ký tiền** ghi "Ghi nhận thu tiền · Chuyển khoản · **Chờ đối soát**" và "Ghi hoa hồng dự kiến".

### KB4 · Nhận phòng khách đến hôm nay · 13 phút
**Vai:** Lễ tân (máy đã cấp quyền). **Mục tiêu:** đủ giấy tờ, thu đủ, nội quy, thẻ – không bỏ sót.
1. Sơ đồ phòng → thanh D1 → **Nhận phòng** (cuối khung). Màn có 4 bước (Giấy tờ · Kiểm tra · Khai báo · Giao mã & hoàn tất) và khung **Điều kiện nhận phòng** (Đã đủ / Còn thiếu).
2. **Giấy tờ:** dòng Khách 1 → **Nhập tay** → Loại giấy tờ **CCCD** → **Số giấy tờ**: số giả 12 chữ số (ví dụ 012345678901) → Họ tên có sẵn → **Ngày sinh**, **Giới tính**, **Địa chỉ thường trú** (giả) → (tùy chọn) **Chụp hoặc tải ảnh giấy tờ** → chọn ảnh giấy tờ mẫu → **Lưu giấy tờ** → app báo "Đã lưu", dòng Khách 1 thành "CCCD · số cuối 8901 · 1 ảnh · Đã có". Bấm **Xem đủ số / ảnh** → nhập mật khẩu → **Xác nhận** → dòng Khách 1 hiện đủ 12 số **và ảnh giấy tờ** vừa tải; chờ 60 giây (hoặc bấm **Ẩn số**) để thấy số và ảnh tự ẩn. Bấm lại trong 15 phút thì không phải nhập mật khẩu.
   **Kiểm tra:** **Tiếp tục: Kiểm tra** → app tự kiểm ("Tên khớp với đơn: Đạt", "Đủ giấy tờ cho 2 khách: Không đạt") → ghi ô **Cách xử lý** (ví dụ "Khách 2 bổ sung trước hạn khai báo"). **Khai báo:** **Tiếp tục: Khai báo** → **Khai báo sau (thêm vào việc cần làm)** (không mở cổng khai báo thật) → app tự chuyển sang bước **Giao mã & hoàn tất**.
3. **Giao mã & hoàn tất:** khung **Thu tiền trước khi giao mã** → **Tiền mặt** → (thử ô "Tiền khách đưa" để xem tiền thối) → **Ghi nhận đã thu …**. Khung **Giờ nhận & phụ thu**: bật **Khách nhận sớm** → **Giờ nhận thực tế** từ 06:00 đến 13:59 và trước giờ hiện tại → tick **Tôi đã báo khách khoản phụ thu này** → bật **Xin miễn phụ thu (gửi duyệt)** → lý do **Khách quen / VIP** (dùng ở KB10). **Số thẻ phòng đã giao** bấm + lên 2, tick **Đã gửi/giao nội quy (VI/EN) cho khách** → **Nhận phòng căn 102** → hộp xác nhận → **Nhận phòng căn 102**. Giờ nhận ghi sớm hơn lúc bấm quá 30 phút (buổi chiều thì luôn như vậy) → app báo "Còn 1 ô cần sửa" và hiện ô **Ghi chú giờ nhận (vì sao ghi bù)** → ghi "thử demo" → bấm **Nhận phòng căn 102** lần nữa → hộp xác nhận → bấm lại.

**Mong đợi:** dòng giấy tờ chỉ hiện 4 số cuối; xem đủ số và ảnh phải nhập mật khẩu (có hiệu lực 15 phút trên máy này) và tự ẩn sau 60 giây ("Tự ẩn sau 60 giây hoặc khi rời tab"). Khi ảnh đang hiện, chữ "Đã có" và nút "Ẩn số" bên phải ảnh đè lên nhau – nút vẫn bấm được (mục C). Nút Nhận phòng khóa, kèm câu "Tick 'Đã gửi/giao nội quy' để bật nút Nhận phòng", cho tới khi thu đủ và tick nội quy; "Đã giao mã cửa/thẻ cho khách" không bắt buộc. Xong: "Đã nhận phòng căn 102. Hạn khai báo: …", đơn "Đang ở", folio có dòng "Phụ thu nhận sớm (nhận lúc …)" và dòng "Miễn phí – **Chờ duyệt**".

### KB5 · Khách OTA đã trả trước · 3 phút
**Vai:** Lễ tân. Sơ đồ phòng → thanh D2 → xem phần **Folio** trong khung → **Nhận phòng** → xem khung Điều kiện (muốn nhận phòng thật thì nhập tay giấy tờ như KB4 – không bắt buộc).
**Mong đợi:** Folio ghi "Cọc cần thu 0", **Còn phải thu 0 đ**; trên màn Nhận phòng, điều kiện "Đã thu đủ hoặc OTA đã trả/đảm bảo" là **Đã đủ** ngay. **Ghi ngay** nếu app đòi thu lại tiền phòng.

### KB6 · Gia hạn và thêm người khi đang ở · 5 phút
**Vai:** Lễ tân. Sơ đồ phòng → thanh D4 → **Gia hạn** → hộp liệt kê từng đêm kèm giá ("20/10 · … · Trống"; đêm đã kín bị khóa) → để tick 1 đêm → **Gia hạn 1 đêm · … đ**. Rồi trong khung đơn → **Thêm người đi cùng** → hộp **Người ở** (sẵn chọn **Người lớn đi cùng**) → ô tìm khách (nhãn ô đang ghi "Khách đứng tên") gõ tên giả → **Tạo nhanh khách "…"** → SĐT giả → **Lưu hồ sơ** → app ghi "Thêm người này không có phụ thu (vẫn trong định mức căn)" → **Thêm vào đơn**. Thêm 1 người lớn nữa (vượt định mức) → app hiện khung **Phụ thu người vượt định mức** → tick **Ghi phụ thu … đ vào folio – tôi đã báo khách** → **Thêm vào đơn**. Thử thêm người thứ 4 (quá sức chứa).
**Mong đợi:** đêm đã kín không chọn được; hộp nhắc "Nhớ kéo dài hiệu lực mã cửa trên app khóa tới giờ trả mới"; xong: "Đã gia hạn 1 đêm – trả phòng …", thanh trên sơ đồ dài thêm. Người thứ 3: app nêu số tiền trước khi thêm (ví dụ "phụ thu 600.000 đ cho 4 đêm còn lại, tính từ đêm nay"), folio có từng dòng "Phụ thu 1 người vượt định mức · đêm …", thanh D4 trên sơ đồ ghi "Vượt định mức 1 · chuẩn bị bộ đồ dùng thêm". Người thứ 4: "Căn 202 ở tối đa 3 khách…", nút Thêm vào đơn khóa. Chưa có lựa chọn **xin miễn** phụ thu người – app ghi rõ "Vẫn ghi phụ thu rồi báo quản lý" (mục C).

### KB7 · Trả phòng 3 bước + bill + VietQR · 7 phút
**Vai:** Lễ tân. Sơ đồ phòng → thanh D3 (mở khung chi tiết đơn). Thử buổi sáng hay buổi chiều đều **vào thẳng Trả phòng** (không cần bấm Trả muộn trước).
1. Bấm **Trả phòng**. **Minibar:** bảng 10 món – ở cột "Còn lại" bấm **−** cho 1–2 món đã dùng (hoặc nút **Không dùng gì – tủ đủ**) → **Tiếp tục: Phụ phí**.
2. **Phụ phí:** ô **Giờ trả phòng thực tế** điền sẵn **giờ hiện tại** (máy có thể hiện dạng 03:33 PM = 15:33). Trước 12:30: "Trả đúng giờ – không phụ thu". **Sau 12:30**: app hiện "Phụ thu trả muộn: … đ (…% giá đêm cuối)" và ô **Tôi đã báo khách khoản phụ thu này** – nút **Tiếp tục** khóa tới khi tick. Mức với D3 (giá đêm cuối 863.000): **12:30–15:00: 30 % = 259.000 đ**; **15:00–18:00: 50 % = 432.000 đ**; **sau 18:00** app tính thêm 1 đêm thay cho phụ thu – nên làm KB7 trước 17:30. Đây là đúng quy tắc (khách ở quá giờ ân hạn phải trả phụ thu), không phải lỗi. Mục **Phát sinh khác** → **Giặt ủi** → trong ô **Khoản** chọn lại "Giặt ủi (theo kg)" → **Thêm vào folio** → (sau 12:30: tick **Tôi đã báo khách…**) → **Tiếp tục: Bill & thu tiền**.3. **Bill & thu tiền:** **Xem Phiếu thanh toán** → **Ngôn ngữ phiếu** Tiếng Việt ↔ Việt – Anh → **In phiếu** (Cmd+P rồi Hủy) → đóng. **Cách thanh toán: Chuyển khoản VietQR** → **Tạo VietQR · … đ**. Quét bằng app ngân hàng: **chỉ xem số tiền, nội dung, tên tài khoản nhận rồi thoát – không bấm Chuyển**. Quay lại bấm **Ghi nhận đã thu … đ** → nút cuối đổi thành **Đã thu … đ – hoàn tất** → bấm → hộp xác nhận → bấm lần nữa.

**Mong đợi:** "Còn phải thu" trong khung Folio cập nhật sau mỗi bước (sau 12:30, ở bước 1–2 số này đã gồm phụ thu trả muộn dù danh sách dòng chưa có dòng đó – dòng hiện ở bước 3, mục C). Thử sau 12:30: bước 3 và Phiếu thanh toán có dòng "Phụ thu trả muộn (giờ trả)" (bản Việt – Anh: "Late check-out fee"); số "Tổng cộng" và số cần thu đã gồm khoản này, thu một lần là hoàn tất được (UXR thử lúc 15:33: tổng 2.195.000, cần thu 582.000 = giặt ủi 60.000 + minibar 60.000 + giặt ủi thêm 30.000 + phụ thu 432.000). App ngân hàng đọc đúng số tiền và nội dung = mã đơn viết liền (ví dụ OTM00002). Màn VietQR hiện "Tài khoản nhận" che giữa số; có thể kèm dòng "Tài khoản nhận vừa đổi trong 24 giờ qua – đọc lại tên và số tài khoản với khách…" (đúng – OPS vừa cài lúc dựng demo). **Tài khoản nhận** là 3 dòng anh/chị đã ghi trong `product/.env` (OPS cài sẵn qua Tham số, không in ra đâu; đội không biết đó là tài khoản thật hay tài khoản thử): nếu là tài khoản thật, app ngân hàng hiện đúng tên chủ tài khoản – vẫn **chỉ xem rồi thoát**; nếu là số thử, app ngân hàng báo không tìm thấy tài khoản là bình thường. Xong: "Đã trả phòng. Bill đã lưu. Phiếu F26-…", danh sách việc đã tạo (dọn căn, bổ sung minibar, xóa mã trên app khóa); khoản VietQR vào tab "Chờ đối soát". Nếu thấy "Chưa cài tài khoản nhận…" → ghi lại, chọn Tiền mặt để đi tiếp.

### KB8 · Hoàn tiền tách quyền · 10 phút
**Mục tiêu:** không ai một mình vừa duyệt vừa chi tiền hoàn (riêng chủ đầu tư được).
1. **Lễ tân:** **Đơn đặt phòng** → ô Tìm kiếm gõ mã đơn A → bấm mã → **Hủy đơn** → đọc hộp xác nhận → chọn **Lý do hủy** (bắt buộc) → **Hủy đơn**. Làm tương tự với đơn B (đơn đã hủy rời danh sách "Đang hiệu lực"; muốn xem lại bấm **Tất cả**). Vào **Nhật ký tiền** → nút **Hoàn tiền**: hai khoản 500.000 "Chờ duyệt" → đơn A **Nhập nơi nhận hoàn** = **Tiền mặt** → Lưu; đơn B = **Chuyển khoản**: ô **Ngân hàng nhận** là **mã BIN 6 số** của ngân hàng (ví dụ 970436; gõ chữ sẽ bị xóa), số tài khoản giả 1234567890, tên giả → Lưu.
2. **Quản lý:** **Cần duyệt** → **Duyệt** cả hai khoản hoàn (nhập mật khẩu). **Để lại** yêu cầu "Miễn khoản phát sinh (FOC) · 259.000" của D1 cho chủ đầu tư duyệt ở KB10. Rồi **Nhật ký tiền › Hoàn tiền** → đơn B → **Ghi đã hoàn chuyển khoản / qua máy POS** → nhập mã giao dịch bất kỳ → **Ảnh chứng từ** (ảnh biên nhận mẫu) → bấm nút cùng tên.
3. **Lễ tân trưởng:** trước hết làm nốt KB2: Sơ đồ phòng → **Gán căn** → khung Elena → **Gán căn** → chọn 402 → **Gán vào căn 402** (làn đỏ biến mất). Rồi **Nhật ký tiền › Hoàn tiền** → đơn A → **Chi hoàn tiền mặt** → **Ảnh chứng từ** (ảnh biên nhận mẫu) → **Chi hoàn tiền mặt**.
4. **Chủ đầu tư:** **Nhật ký tiền › Hoàn tiền** → đơn B → **Ghi đã hoàn chuyển khoản / qua máy POS** → **Xem đủ số tài khoản** (nhập mật khẩu) → mã giao dịch "TEST-001" → **Ảnh chứng từ** (ảnh biên nhận mẫu) → bấm nút cùng tên. (Đơn A đã được lễ tân trưởng chi ở bước 3.)

**Mong đợi:** hủy trước ≥ 7 ngày → hộp hủy ghi "Không giữ phí hủy; hoàn đủ 500.000 cho khách – cần quản lý duyệt", tab Hoàn tiền có 500.000/đơn. Quản lý **bị chặn** chi khoản mình vừa duyệt, câu báo "Bạn đã tạo, duyệt hoặc nhập tài khoản nhận cho khoản hoàn này nên không tự chi được. Nhờ quản lý khác hoặc chủ đầu tư…". Lễ tân trưởng thấy khoản đã duyệt và chi được tiền mặt; với khoản chuyển khoản, lễ tân trưởng thấy dòng "Hoàn chuyển khoản do quản lý thực hiện". Chủ đầu tư chi được. Xong: mỗi khoản ghi "Đã ghi hoàn 500.000 đ." (Thêm nếu còn giờ: Lễ tân tự chi khoản mình tạo → bị chặn.)

### KB9 · Check-in online như khách (VI/EN/RU) · 6 phút
**Vai:** Khách – mở **cửa sổ ẩn danh** (Cmd+Shift+N, để không lẫn phiên Desk), dán link D10. Muốn xem cỡ điện thoại: Cmd+Option+I → biểu tượng điện thoại.
1. Ô **Ngôn ngữ** đầu trang chọn **Русский** → bấm nút làm thủ tục (bản tiếng Nga) → xem trang thông báo dữ liệu → đổi lại **Tiếng Việt** ngay trên trang đó → **Tôi đã đọc** → Khách 1: **Hộ chiếu** → **Chụp** (chọn ảnh bất kỳ); Khách 2: **Bổ sung tại quầy** → **Tiếp tục**.
2. Chọn khung giờ đến → **Tiếp tục** → câu "Lưu ảnh giấy tờ sau khi khai báo?": chọn Đồng ý hoặc Không → **Gửi thủ tục**.
3. Mở lại link, đổi English rồi Русский.

**Mong đợi:** sau khi gửi, Khách 1 ghi "Đã gửi – vì an toàn, ảnh không hiện lại ở đây"; không có mã cửa, không có bill; câu đồng ý **không chọn sẵn** (nút Gửi thủ tục khóa tới khi chọn). Màn xong: "Xong! Hẹn gặp bạn ngày …". Mở lại thấy thẻ "Đã làm thủ tục trước". Bản RU: phần thông báo dữ liệu hiện tiếng Anh, có dòng tiếng Nga báo bản dịch đang được duyệt (đúng – chờ người bản ngữ duyệt). Lễ tân (tùy chọn): **Giấy tờ & khai báo › Tất cả** → dòng 402 Võ Ngọc Ánh, cột Trạng thái "Khách đã gửi trước qua app" → bấm nút ở cuối dòng → **Xem đủ số / ảnh** (nhập mật khẩu) → thấy ảnh khách vừa gửi qua link, tự ẩn sau 60 giây.

### KB10 · Việc của chủ đầu tư · 5 phút
**Vai:** Chủ đầu tư.
1. **Cần duyệt** → "OTM-00007 · Miễn khoản phát sinh (FOC) · 259.000" (từ KB4) → **Duyệt** → mật khẩu → **Duyệt**. Mở lại D1: dòng "Miễn phí" hết chữ "Chờ duyệt", còn phải thu về 0.
2. **Nhật ký tiền**: tab **Nhật ký thao tác tiền** (mọi thao tác tiền, ai, lúc nào) → tab **Chờ đối soát**: cọc KB3 (Chuyển khoản 900.000) và VietQR KB7 → **Đã khớp sao kê**. Danh sách có sẵn 2 khoản mẫu khác – xử lý hay không tùy ý.
3. **Tham số quy tắc**: xem các tab nhóm; tab "Giữ chỗ, cọc, hủy" → **Sửa** ở dòng "Cọc ngắn ngày" → Giá trị mới 150 → nhập Lý do → **Lưu thay đổi** → bị chặn; sửa thành 35, **Hiệu lực từ** = ngày mai → **Lưu thay đổi** → bấm Sửa lần nữa để xem **Lịch sử thay đổi**.

**Mong đợi:** mỗi thao tác tiền có tên người và giờ, không có nút xóa; khoản đã đối soát rời danh sách chờ. Tham số có giới hạn ("Giá trị phải từ 0 đến 100"), lưu xong báo "Đã lưu Cọc ngắn ngày, hiệu lực từ …"; bảng vẫn hiện giá trị đang áp dụng (30 %) tới ngày hiệu lực, lịch sử có dòng mới với tên anh/chị và lý do. Màn Tổng quan "đang được làm" là đúng (Sprint 4).

## 5. Sau khi thử
Điền phiếu `demo-1-feedback-form.md` (5–10 phút) rồi gửi trong chat: **`/feedback`** + dán phiếu, kèm ảnh chụp. Buổi này là **anh/chị tự thử**; thử với lễ tân, buồng phòng thật sẽ làm sau theo `product/docs/research/real-user-check-guide.md`.
