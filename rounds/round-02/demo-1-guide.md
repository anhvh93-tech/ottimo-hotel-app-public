# Hướng dẫn tự thử – Demo lần 1 (Round 2, sau Sprint 3)

> Người soạn: UXR · 17/10/2026 · v1.0 · Dành cho anh/chị (chủ đầu tư) tự bấm trên máy Mac, **khoảng 60 phút**.
> Đi kèm (cùng thư mục `rounds/round-02/`): **phiếu ghi nhận** `demo-1-feedback-form.md` (mở song song, ghi ngay khi thấy lạ) và **trang giới hạn** `demo-1-limits.md` (**đọc 2 phút trước khi bắt đầu** để không mất công tìm phần chưa làm).
> Các ô dữ liệu do OPS điền ngày 17/10 (nguồn: `rounds/round-02/outputs/OPS/demo-1.md`). Mã đơn, căn và tên khách giữ nguyên mỗi lần dựng lại; ngày luôn tính theo hôm chạy lệnh.

## 1. Chuẩn bị (5 phút)
- Docker Desktop đang chạy. Trình duyệt Chrome (hoặc Safari).
- 2 ảnh **bất kỳ** (JPG/PNG, ví dụ ảnh chụp màn hình) để trên Desktop – dùng làm "ảnh giấy tờ", "ảnh biên nhận". **Không dùng ảnh CCCD/hộ chiếu thật, không nhập số giấy tờ, SĐT, số tài khoản thật.** Ảnh giấy tờ mẫu nếu OPS có: **có sẵn** – `product/infra/demo/.out/anh-giay-to-mau.png` và `anh-bien-nhan-mau.png` (hình vẽ giả, có gạch đỏ, không có chữ hay số thật).
- Điện thoại có app ngân hàng – **chỉ để quét QR, không chuyển tiền**.
- Nên làm **từ 09:00 đến 17:00, cùng ngày chạy lệnh**: app dùng đồng hồ thật (giờ nhận 14:00, ân hạn trả 12:30, sau 18:00 tính thêm đêm).

**Bật** (Terminal, một lệnh): `cd ~/Desktop/hotel-app && ./product/infra/demo/demo-up.sh` → chờ dòng **`XONG – demo từ commit …`** kèm 3 địa chỉ và đường dẫn tệp tài khoản (~**5–8 phút** lần đầu vì phải build; các lần sau ~**2 phút**). Trên máy này Docker là **OrbStack** – mở OrbStack trước.
**Mở**: Desk (máy quầy) http://localhost:8181 · Trang khách http://localhost:8183 (chỉ dùng ở KB9) – **đã xác nhận**; app nhân viên http://localhost:8182 (không bắt buộc). Dùng đúng chữ `localhost`, **không** dùng `127.0.0.1` (app sẽ từ chối thao tác ghi).
**Tắt**: `./product/infra/demo/demo-down.sh` (đã xác nhận – xóa luôn dữ liệu demo; stack dev không bị đụng) · **Làm lại từ đầu** (xóa mọi thao tác, dựng lại dữ liệu theo hôm nay, **mật khẩu và link khách đổi mới**): `./product/infra/demo/demo-reset.sh` (~2 phút).

## 2. Đăng nhập theo vai
Tên đăng nhập và mật khẩu: mở file **`product/infra/demo/.out/demo-accounts.md`** (chỉ có trên máy này, không gửi file đó cho ai). Đổi vai: bấm **tên mình ở menu → Đăng xuất**, rồi đăng nhập vai khác. Sai mật khẩu 5 lần sẽ khóa tài khoản 15 phút – nên sao chép, đừng gõ tay.

| Vai | Dùng ở | Vai | Dùng ở |
|---|---|---|---|
| Chủ đầu tư | Bước 0, KB8, KB10 | Lễ tân | KB1–KB8 |
| Quản lý | KB8 | Buồng phòng | KB1 |
| Lễ tân trưởng | KB8 | CTV / môi giới | KB1, KB3 |
| Sale nội bộ, Bảo trì | Không bắt buộc (xem thêm nếu còn giờ) | | |

Màn **"Màn này đang được làm"** (Hôm nay, Tổng quan, Buồng phòng, Bảo trì) là **đúng kế hoạch** (Sprint 4), không phải lỗi.

**Bước 0 – một lần, 2 phút (Chủ đầu tư):** menu **Quản trị › Thiết bị được cấp** → **Cấp quyền thiết bị này** → tick các mục kiểm máy → đặt tên "Mac demo" → nhập lại mật khẩu. *Mong đợi:* "Máy này đã được cấp quyền". Vì sao: giấy tờ khách và số tài khoản hoàn tiền chỉ mở trên máy quầy được cấp. **Vẫn cần làm Bước 0**: OPS không cấp sẵn được cho trình duyệt của anh/chị (quyền máy nằm trong cookie của chính trình duyệt đó). Nếu nút không có hoặc báo lỗi, tệp tài khoản có cách dự phòng (dán 1 dòng vào Console).

## 3. Dữ liệu demo (OPS điền: căn · khách · mã đơn)
| Mã | Tình huống | Căn · khách | Mã | Tình huống | Căn · khách |
|---|---|---|---|---|---|
| D1 | Đến hôm nay, đã cọc (trực tiếp) | **102** · Nguyễn Thu Trang · OTM-00007 (2 đêm, cọc ~30 %, còn phải thu ~1,1 triệu, chưa nhập giấy tờ) | D6 | Báo giá của CTV | **402** · Vương Thị Hồng · BG-00002 (đến sau 8 ngày, 3 đêm; CTV Minh Anh đang giữ 0 chỗ) |
| D2 | OTA đã trả trước, đến hôm nay | **302** · Anna Petrova · OTM-00008 (Agoda, 3 đêm, 3 người lớn, còn phải thu 0) | D7 | Đơn dài hạn nhập tay | **301** · Đặng Quốc Bảo · OTM-00001 (từ 30 ngày trước, 6 tháng, nhãn "Nhập tay") |
| D3 | Đang ở, trả hôm nay, còn nợ | **103** · Trần Minh Quân · OTM-00002 (ở từ 2 hôm trước, còn nợ 60.000 đ giặt ủi; minibar căn có 4 loại món) | D8 | Căn khóa sửa chữa (OOO) | **203** · khóa từ ngày kia, 2 đêm ("Thay bình nóng lạnh…"); hôm nay 203 vẫn có khách Booking.com |
| D4 | Đang ở giữa kỳ (còn đêm trống sau) | **202** · Lê Hoàng Yến · OTM-00003 (2 người lớn trong Studio định mức 2 → thêm 1 người lớn có phụ thu; trống 2 đêm sau ngày đi) | D9 | Đơn OTA chưa gán căn | Làn đỏ trên cùng · Elena Ivanova · OTM-00027 (Expedia, 4 người lớn, sau 6 ngày, 2 đêm – gán được vào **402**) |
| D5 | Giữ chỗ đang đếm ngược | **201** · Nghiêm Hải Yến · OTM-00006 (sale Đức giữ 12 giờ, **hết hạn khoảng 5 giờ sau lúc chạy lệnh**) | D10 | Đến ngày mai + link check-in online | **402** · Võ Ngọc Ánh · OTM-00011 (2 người lớn). Link đầy đủ: trong `product/infra/demo/.out/demo-accounts.md` (link đổi mỗi lần chạy lệnh) |

## 4. Mười kịch bản (làm theo thứ tự)
Mỗi kịch bản: làm các bước → so với **Mong đợi** → **khác thì ghi vào dòng cùng số trong phiếu** (kèm ảnh chụp màn hình: Cmd+Shift+4).

### KB1 · Sơ đồ phòng theo vai · 5 phút
**Vai:** Lễ tân → Buồng phòng → CTV. **Mục tiêu:** mỗi người chỉ thấy phần việc của mình.
1. Lễ tân: trang Hôm nay → **Mở sơ đồ phòng**. Tìm trên 14 ngày: D1, D2 (đến), D3 (đi), D4 (đang ở), D5 (có đồng hồ), D7 (nhãn "Nhập tay"), D8 ("Khóa"), làn đỏ trên cùng "Chưa gán căn – xung đột OTA". Bấm một thanh → khung chi tiết đơn bên phải; Esc để đóng.
2. Buồng phòng: menu **Các căn**. 3. CTV: **Báo giá & giữ chỗ › Căn trống**.

**Mong đợi:** Lễ tân thấy đủ tên, kênh, tiền. Buồng phòng thấy tình trạng buồng, "có khách đến hôm nay/mai", số bộ đồ dùng thêm – **không** tên khách, giá, kênh. CTV thấy căn trống/"Đã kín", **không** thấy khách của người khác. **Ghi ngay** nếu Buồng phòng hoặc CTV thấy tên khách hay số tiền.

### KB2 · Đặt phòng mới + thử đặt trùng · 6 phút
**Vai:** Lễ tân. **Mục tiêu:** đặt nhanh, và không bao giờ đặt trùng.
1. **+ Đặt phòng mới**: một căn trống, ngày đến **sau hôm nay ít nhất 8 ngày**, 2 đêm, kênh Trực tiếp, tạo nhanh khách tên giả + SĐT giả (0900 000 001), cọc mặc định, cách thanh toán **Tiền mặt** → **Tạo đơn** (= đơn A).
2. Đặt lại **đúng căn và ngày đó** cho khách giả khác (0900 000 002) → khi báo trùng, bấm **"Dùng căn …"** gợi ý → tạo (= đơn B, cọc tiền mặt). Hai đơn này dùng lại ở KB8.
3. Thử chọn căn D8 (đang khóa). 4. Làn "Chưa gán căn" (D9) → **Gán căn**.

**Mong đợi:** giá từng đêm tự tính (cuối tuần cao hơn), cọc 30 %. Đặt trùng bị chặn ngay khi chọn căn/ngày (nêu căn, ngày bị trùng) kèm căn thay thế; dữ liệu đã nhập không mất. Căn khóa không đặt được. Gán căn xong làn đỏ biến mất.

### KB3 · CTV báo giá, giữ chỗ, lễ tân xác nhận cọc · 5 phút
**Vai:** CTV → Lễ tân. **Mục tiêu:** CTV tự báo giá tại chỗ; tiền cọc phải qua lễ tân xác nhận.
1. CTV: tab **Báo giá** → mở D6 (hoặc lập mới ở tab Căn trống, ngày từ mai trở đi) → đổi ngôn ngữ gửi khách VI/EN/RU → **Sao chép gửi Zalo** (chỉ sao chép, không gửi).
2. **Khách đồng ý – Giữ chỗ** → 24 giờ → **Mở đơn** → **Báo đã chuyển cọc** (nhập số tiền và ghi chú; ô đính ảnh biên nhận có ở Sprint 4).
3. Lễ tân: sơ đồ phòng → giữ chỗ vừa tạo → **Xác nhận đã nhận cọc** (chuyển khoản).

**Mong đợi:** CTV chỉ thấy hoa hồng của mình ("Bạn nhận …"), văn bản báo giá không có hoa hồng/SĐT nội bộ. Giữ chỗ có mã đơn và đồng hồ đếm ngược (CTV giữ tối đa 3 chỗ cùng lúc). Sau xác nhận: đơn "Đã xác nhận", khoản cọc mang cờ **"Chờ đối soát"**.

### KB4 · Nhận phòng khách đến hôm nay · 8 phút
**Vai:** Lễ tân (máy đã cấp quyền). **Mục tiêu:** đủ giấy tờ, thu đủ, nội quy, thẻ – không bỏ sót.
1. Mở D1 → **Nhận phòng**. Xem khung **Điều kiện nhận phòng** (Đã đủ / Còn thiếu).
2. **Giấy tờ:** **Nhập tay** cho người đứng tên (dữ liệu giả, 1 ảnh bất kỳ) → **Xem đủ số / ảnh** → nhập lại mật khẩu. **Kiểm tra:** chọn kết quả. **Khai báo:** chọn **Khai báo sau** (không mở cổng khai báo thật).
3. **Giao mã & hoàn tất:** **Thu tiền** phần còn lại bằng Tiền mặt. Bật **Khách nhận sớm**, chọn giờ từ 06:00 đến 13:59 và trước giờ hiện tại (ghi chú "thử demo" nếu được hỏi) → tick **Tôi đã báo khách khoản phụ thu này** → tick **Xin miễn phụ thu (gửi duyệt)**, lý do "Khách quen / VIP" (dùng ở KB10). Số thẻ 2, tick **Đã gửi/giao nội quy** → **Nhận phòng căn …** → xác nhận.

**Mong đợi:** số giấy tờ chỉ hiện 4 số cuối, xem đủ phải nhập mật khẩu và tự ẩn sau khoảng 60 giây. Nút Nhận phòng khóa (có câu giải thích) cho tới khi thu đủ và tick nội quy; "Đã giao mã/thẻ" không bắt buộc. Xong: đơn "Đang ở", folio có phụ thu nhận sớm và dòng miễn **"Chờ duyệt"**.

### KB5 · Khách OTA đã trả trước · 3 phút
**Vai:** Lễ tân. Mở D2 → xem folio → **Nhận phòng** (làm tiếp như KB4 nếu muốn).
**Mong đợi:** tiền phòng ghi "… đã thu", **Còn phải thu = 0** (chỉ còn khoản phát sinh tại quầy nếu có); điều kiện "Đã thu đủ hoặc OTA đã trả" đạt ngay. **Ghi ngay** nếu app đòi thu lại tiền phòng.

### KB6 · Gia hạn và thêm người khi đang ở · 4 phút
**Vai:** Lễ tân. Mở D4 → **Gia hạn** → chọn 1 đêm → xem giá, nguồn giá → **Gia hạn 1 đêm · …**. Rồi mục **Người ở** → **Thêm người đi cùng** → Người lớn đi cùng (tạo nhanh, tên giả).
**Mong đợi:** đêm đã kín không chọn được; sơ đồ phòng kéo dài thanh; có nhắc kéo dài mã cửa trên app khóa. Thêm người vượt định mức → app nêu phụ thu người từ đêm nay để lễ tân xác nhận + việc chuẩn bị bộ đồ dùng thêm; vượt sức chứa tối đa → không cho thêm. **Ghi lại** nếu vượt định mức mà không thấy nói gì về phụ thu.

### KB7 · Trả phòng 3 bước + bill + VietQR · 7 phút
**Vai:** Lễ tân. Mở D3 → **Trả phòng**.
1. **Minibar:** nhập 1–2 món đã dùng (hoặc "Không dùng gì – tủ đủ"). 2. **Phụ phí:** xem giờ trả (quá giờ ân hạn thì app đề xuất phụ thu trả muộn – đúng quy tắc), thêm 1 phát sinh (ví dụ giặt ủi).
3. **Bill & thu tiền:** **Xem Phiếu thanh toán**, đổi Tiếng Việt ↔ Việt – Anh, **In phiếu** (Cmd+P rồi Hủy). Chọn **Chuyển khoản VietQR → Tạo VietQR**. Quét bằng app ngân hàng: **chỉ xem số tiền, nội dung, tên tài khoản nhận rồi thoát – không bấm Chuyển**. Quay lại bấm **Đã thấy tiền về** → **Hoàn tất trả phòng** → xác nhận.

**Mong đợi:** "Còn phải thu" cập nhật sau mỗi bước. App ngân hàng đọc đúng số tiền và nội dung = mã đơn. **Tài khoản nhận** là 3 dòng anh/chị đã ghi trong `product/.env` (OPS cài sẵn qua Tham số, không in ra đâu; đội không biết đó là tài khoản thật hay tài khoản thử): nếu là tài khoản thật, app ngân hàng hiện đúng tên chủ tài khoản – vẫn **chỉ xem rồi thoát**; nếu là số thử, app ngân hàng báo không tìm thấy tài khoản là bình thường. Xong: số phiếu, danh sách việc đã tạo (dọn căn, bổ sung minibar, xóa mã trên app khóa), khoản VietQR "Chờ đối soát". Nếu thấy "Chưa cài tài khoản nhận…" → ghi lại, chọn Tiền mặt để đi tiếp.

### KB8 · Hoàn tiền tách quyền · 8 phút
**Mục tiêu:** không ai một mình vừa duyệt vừa chi tiền hoàn (riêng chủ đầu tư được).
1. **Lễ tân:** hủy đơn A (KB2) → đọc số hoàn/phí **trước khi** xác nhận → lý do → hủy. Hủy đơn B. Vào **Nhật ký tiền › Hoàn tiền**: đơn A **Nhập nơi nhận hoàn** = Tiền mặt; đơn B = Chuyển khoản (ngân hàng bất kỳ, số tài khoản giả 1234567890, tên giả).
2. **Quản lý:** **Cần duyệt** → duyệt cả hai (nhập mật khẩu). Rồi **Nhật ký tiền › Hoàn tiền** → thử **Ghi đã hoàn chuyển khoản** cho đơn B.
3. **Lễ tân trưởng:** đơn A → **Chi hoàn tiền mặt** + ảnh biên nhận. Mở đơn B.
4. **Chủ đầu tư:** đơn B → **Xem đủ số tài khoản** (mật khẩu) → **Ghi đã hoàn chuyển khoản**, mã giao dịch "TEST-001", ảnh chứng từ.

**Mong đợi:** hủy trước ≥ 7 ngày → hoàn 100 % cọc. Quản lý **bị chặn** chi khoản mình vừa duyệt. Lễ tân trưởng chi được tiền mặt, nhưng với chuyển khoản chỉ thấy "Hoàn chuyển khoản do quản lý thực hiện". Chủ đầu tư chi được. (Thêm nếu còn giờ: Lễ tân tự chi khoản mình tạo → bị chặn.)

### KB9 · Check-in online như khách (VI/EN/RU) · 5 phút
**Vai:** Khách – mở **cửa sổ mới** (Cmd+N), dán link D10. Muốn xem cỡ điện thoại: Cmd+Option+I → biểu tượng điện thoại.
1. Chọn ngôn ngữ đầu trang → **Tôi đã đọc** → Khách 1: chọn Hộ chiếu → Chụp (chọn ảnh bất kỳ); Khách 2 (nếu đơn có 2 khách): **Bổ sung tại quầy**.
2. Chọn giờ đến → câu đồng ý lưu ảnh: chọn Có hoặc Không → **Gửi thủ tục**.
3. Mở lại link, đổi EN rồi RU.

**Mong đợi:** ảnh đã gửi **không hiện lại**; không có mã cửa, không có bill; câu đồng ý **không chọn sẵn**. Mở lại thấy thẻ "Đã làm thủ tục trước". Bản RU: phần thông báo dữ liệu và đồng ý hiện tiếng Anh (đúng – chờ người bản ngữ duyệt). Lễ tân (tùy chọn): **Giấy tờ & khai báo › Tất cả** → đơn D10 thấy giấy tờ "khách gửi qua app".

### KB10 · Việc của chủ đầu tư · 5 phút
**Vai:** Chủ đầu tư.
1. **Cần duyệt** → yêu cầu miễn phụ thu từ KB4 → **Duyệt** (mật khẩu). Mở lại đơn D1: còn phải thu về 0.
2. **Nhật ký tiền**: tab Nhật ký (mọi thao tác tiền hôm nay, ai, lúc nào) → tab **Chờ đối soát**: cọc KB3 và VietQR KB7 → **Đã khớp sao kê**.
3. **Tham số quy tắc**: xem các nhóm; thử nhập giá trị vô lý (ví dụ cọc 150 %) → bị chặn; sửa 1 tham số hiệu lực từ ngày mai → **Lịch sử thay đổi**.

**Mong đợi:** mỗi thao tác tiền có tên người và giờ, không xóa được; khoản đã đối soát rời danh sách chờ. Tham số có giới hạn trên/dưới, chỉ áp cho đơn tạo sau ngày hiệu lực. Màn Tổng quan "đang được làm" là đúng (Sprint 4).

## 5. Sau khi thử
Điền phiếu `demo-1-feedback-form.md` (5–10 phút) rồi gửi trong chat: **`/feedback`** + dán phiếu, kèm ảnh chụp. Buổi này là **anh/chị tự thử**; thử với lễ tân, buồng phòng thật sẽ làm sau theo `product/docs/research/real-user-check-guide.md`.
