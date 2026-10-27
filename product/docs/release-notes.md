# OTTIMO Desk – Release notes

Ghi chép thay đổi theo từng phiên bản, viết cho chủ đầu tư và nhân viên. Bản mới nhất ở trên.
Đánh số: `v1.0.0` bản chính · `v1.0.x` bản vá lỗi · `v1.x.0` bản thêm tính năng (quy trình: `rounds/round-03/release-v1-plan.md` mục 7).

---

## v1.0.0 – Bản vận hành đầu tiên

- Trạng thái: **NHÁP – `v1.0.0-rc.3`** – chờ QC "cổng v1.0" (QC chấm sau buổi B2 trên bản thật, 09:00 thứ Tư 28/10). Cập nhật lần cuối: PO, 27/10/2026.
- Bản ứng viên: `v1.0.0-rc.3` (commit `70fe734`), chạy trên staging và **production từ 27/10/2026** (anh/chị đồng ý 27/10). Production chưa có dữ liệu tới buổi B2. PO ghi tag `v1.0.0` và ngày phát hành khi QC chấm ĐẠT.
- Ngày chạy: **thứ Hai 02/11/2026** (anh/chị chốt 26/10).
- Địa chỉ: Desk `desk.ottimo.vn` · app nhân viên (buồng phòng, bảo trì, lễ tân trưởng) `staff.ottimo.vn` · trang khách `g.ottimo.vn` · website `ottimo.vn`
- Hướng dẫn dùng cho từng bộ phận: **Sổ tay sử dụng OTTIMO Desk v1.0** (`product/docs/manual/user-manual-v1.0.md`, bản cuối 30/10). Bản tóm tắt dán quầy: `product/docs/staff-one-pager.md`.

### Thay đổi từ `rc.1` (26/10) đến `rc.3` (27/10)

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Khách rời sau 18:00 khi đêm đó căn đã có khách đến** – vá trước ngày chạy theo quyết định của anh/chị | Ở bước "Bill & thu tiền", Desk chọn sẵn **"Ghi phụ thu – quản lý xem lại"**: số bằng giá 1 đêm do Desk tính, lễ tân không sửa được, không có ô miễn, phải ghi lý do; không cần mật khẩu của ai. Quản lý và anh/chị nhận thông báo, xem lại ở **Cần chú ý** trong 24 giờ kể từ lúc bấm trả phòng: đồng ý thì bấm **Đã xem**; nên giảm thì sửa dòng phụ thu, Desk tự tạo yêu cầu hoàn và người sửa không tự duyệt khoản hoàn. Quá hạn, Desk báo anh/chị | ESC-031 (26/10), ESC-024 B |
| **Thu tiền mặt/thẻ ở bước cuối trả phòng** khi vừa có phụ thu mới | Tiền mặt hoặc thẻ POS lớn hơn số đang nợ lúc đó (ví dụ phụ thu sau 18:00 vừa ghi ở bước 3): Desk ghi "đã nhận", khoản thu vào folio khi bấm **Hoàn tất**. Desk không nhận quá số còn phải thu; số cần thu đổi sau khi nhập thì Desk báo và cho **Bỏ** khoản đó để nhập lại | BUG-R3-017 |
| **Nhận phòng từ 12:00** | Ô giờ nhận mặc định "Nhận từ 12:00 – không phụ thu"; phụ thu nhận sớm chỉ trước 12:00 (chi tiết ở mục "Giờ nhận và trả phòng" bên dưới) | FB-INV-004 (26/10) |
| **Giá đêm và giá tháng nhập riêng** | **Danh mục căn → Sửa**: ô **Giá đêm niêm yết** nhập được, không còn tự bằng giá tháng ÷ 12. Giá đêm anh/chị nhập là giá ngày thường, kênh Trực tiếp; Desk vẫn tự cộng cuối tuần và ngày đặc biệt như cũ. Desk cảnh báo (vẫn cho lưu) khi giá đêm thấp hơn giá tháng chia 30 | FB-INV-005, ESC-036 A (26/10) |
| **Sửa một giá đã lên lịch bị nhập nhầm** | Mở **Sửa**, chọn đúng ngày hiệu lực của giá nhầm, nhập giá đúng, **Lưu**: giá đúng thay giá nhầm của ngày đó. Phần còn lại (xem danh sách giá đã lên lịch, nút hủy) **dời v1.0.1** | BUG-R3-018 phần 2; phần 1 → v1.0.1 |
| Giá trị khởi tạo theo câu trả lời 26/10 | Hạng Studio City View 101, 201 / Garden View 102, 103, 202, 203; tên hạng Premium, Signature theo e-brochure; điện 5.000 đ/kWh, nước 100.000 đ/người/tháng (ghi để tính tay, xem "Giới hạn đã biết") | INV 26/10 (8 câu DOM) |

### Có trong bản này

**Desk (lễ tân, quản lý, chủ đầu tư)**
- **Sơ đồ phòng và đặt phòng:** sơ đồ 14 ngày, đặt trực tiếp, chặn đặt trùng, đổi căn/đổi ngày, hủy, khách không đến, đơn OTA nhập tay, đơn dài hạn nhập tay.
- **Báo giá, giữ chỗ, cọc:** báo giá có hạn, giữ chỗ tự hết hạn, mã VietQR đúng số tiền và mã đơn, xác nhận đã nhận cọc.
- **Giờ nhận và trả phòng (đổi 26/10 theo quyết định của anh/chị):** khách **nhận phòng từ 12:00** khi căn đã sẵn sàng, căn **chắc chắn sẵn sàng lúc 14:00**; **trả phòng 12:00** như cũ. Từ 12:00 không có phụ thu nhận sớm; nhận trước 12:00 Desk tính 30 % (10:00–11:59) hoặc 50 % (06:00–09:59) giá đêm đầu. Câu nói với khách: "Check-in from 12:00 (your room is always ready by 14:00) · Check-out by 12:00" / "Nhận phòng từ 12:00 (phòng luôn sẵn sàng lúc 14:00) · Trả phòng trước 12:00".
- **Nhận phòng, lưu trú, trả phòng:** phụ thu nhận sớm/trả muộn tự tính, gia hạn, thêm dịch vụ vào folio, trả phòng 3 bước, thu tiền nhiều lần, công nợ và thu nợ. Trả sau 18:00 khi đêm đó căn đã có khách đến: lễ tân ghi phụ thu bằng giá 1 đêm, quản lý xem lại trong 24 giờ (xem "Thay đổi từ rc.1").
- **Phiếu thanh toán (bill):** xem trên màn hình trước và sau trả phòng, chọn **Tiếng Việt** hoặc **Việt – Anh**, nút **In phiếu** in qua hộp in của trình duyệt (in giấy, hoặc "Lưu dưới dạng PDF" của trình duyệt rồi gửi riêng cho khách). Mẫu in chính thức và gửi bill tự động ở v1.2 (bảng dưới). *[QA đang kiểm bản in trên Chrome máy quầy 27/10 – Q5 của sổ tay; nếu không dùng được, PO sửa dòng này thành "xem trên màn hình".]*
- **Danh mục căn và giá:** giá đêm và giá tháng nhập riêng, có ngày hiệu lực; lịch giá tự cộng cuối tuần và ngày đặc biệt.
- **Giấy tờ và khai báo lưu trú:** nhập giấy tờ, đối chiếu, nhắc hạn khai báo. Ảnh giấy tờ chỉ lễ tân và quản lý xem, tự xóa theo hạn lưu chủ đầu tư đặt.
- **Ngày kinh doanh:** từ 00:00 đến 05:59, Desk và app buồng phòng vẫn tính là ngày hôm trước. Ngày mới bắt đầu lúc 06:00.
- **Kiểm soát:** phân quyền theo vai, nhật ký mọi thao tác tiền, miễn giảm có hạn mức và người duyệt, báo chủ đầu tư khi tổng miễn trên một lượt ở vượt ngưỡng.
- **Bảo mật:** đăng nhập 2 bước bắt buộc cho chủ đầu tư và quản lý, có mã khôi phục; xác thực lại trước thao tác nhạy cảm.
- **Chủ đầu tư tự cài đặt:** tự đặt tài khoản nhận chuyển khoản (có hiệu lực từ ngày hôm sau, có cảnh báo khi vừa đổi); tự thêm nhân viên và gán vai.
- **Yêu cầu từ website:** hàng chờ trên Desk cho yêu cầu đặt phòng gửi từ ottimo.vn; tạo đơn từ yêu cầu, nguồn ghi "website". Hàng chờ chỉ có dữ liệu khi form trên website được bật (xem "Giới hạn đã biết").

**App nhân viên (điện thoại – buồng phòng, bảo trì, lễ tân trưởng)**
- Buồng phòng: việc dọn tự sinh (gồm việc bổ sung minibar), bắt đầu dọn → dọn xong, báo sự cố có ảnh, vẫn bấm được khi mất mạng.
- **Lễ tân trưởng kiểm phòng** theo checklist trên app (căn "Đã dọn – chờ kiểm" → "Sẵn sàng"). Buồng phòng tự kiểm **đang tắt** (giá trị khởi tạo); anh/chị bật được ở **Tham số quy tắc** khi muốn.
- Bảo trì: phiếu sửa, chờ vật tư, sửa xong có ảnh, khóa và mở bán lại căn.

**Trang khách (link riêng của từng đơn)**
- Check-in online: tải giấy tờ, chọn giờ đến, gửi yêu cầu trong lúc ở. Tiếng Anh dẫn, có tiếng Việt.

**Website ottimo.vn**
- Trang giới thiệu OTTIMO (concept "The art of staying well"), tiếng Anh và tiếng Việt, đã lên mạng từ **25/10/2026**.
- Nút liên hệ mở Zalo, gọi điện, email. Form "Yêu cầu đặt phòng" có sẵn trong bản này nhưng **đang tắt**.

### Chưa có trong bản này
| Tính năng | Dự kiến |
|---|---|
| Xem danh sách giá đã lên lịch và hủy một giá đã lên lịch | v1.0.1 |
| Quản lý xác nhận từ xa trên điện thoại | v1.1 |
| Kết nối kênh OTA tự động (Beds24) | v1.1 |
| Mã cửa 8 số quản lý trên app; báo tự động khi khách quá giờ trả phòng | v1.1 |
| Bảng dự phòng in sẵn mỗi sáng (khi mất mạng) | v1.1 |
| Chấm công qua Wi-Fi OTTIMO trên app nhân viên | v1.1 |
| Báo cáo tháng, kênh, FOC; xuất dữ liệu | v1.2 |
| Mẫu tin và lịch nhắn khách; Zalo OA | v1.2 |
| **Mẫu in bill chính thức**, xuất PDF từ Desk, gửi bill qua email/Zalo; khách xem folio tạm tính trên trang khách (v1.0 đã in phiếu qua trình duyệt – xem trên) | v1.2 |
| Hợp đồng dài hạn đủ vòng (ký quỹ, kỳ thu, điện nước); hoa hồng CTV/sale ghi theo đợt chi | v1.3 |
| Hóa đơn điện tử MISA; đóng ca; tiếng Nga; khách tự gửi yêu cầu về dữ liệu cá nhân | v1.3 |
| Buồng phòng đếm minibar trên app; bảng theo dõi khách tiềm năng cho sale | Chưa xếp lịch – xếp theo góp ý sau ngày chạy |

### Giới hạn đã biết

**Cách làm khác so với sau này**
- **Form "Yêu cầu đặt phòng" trên ottimo.vn tắt** tới khi anh/chị quyết ESC-030 (bật khi luật sư chưa trả lời, hay chờ luật sư). Trong lúc này khách liên hệ qua Zalo hoặc điện thoại. Khi được quyết, chủ đầu tư bật trên Desk trong 1 phút, không cần cài lại.
- **Đơn OTA nhập tay.** Có đơn OTA mới thì lễ tân nhập vào Desk ngay và đóng phòng trên extranet của kênh khác. Desk chặn trùng trong app, nhưng chưa tự đóng phòng trên kênh.
- **Quản lý chưa xác nhận được ngay trên màn của lễ tân, tại quầy hay từ xa.** Vì quản lý và chủ đầu tư đều có đăng nhập 2 bước, Desk từ chối mọi ô "mật khẩu của quản lý" trên phiên của lễ tân. Cách làm ở v1.0:
  - Miễn/giảm vượt hạn mức, xóa công nợ, hoàn tiền: lễ tân gửi yêu cầu, quản lý hoặc chủ đầu tư duyệt ở **"Cần duyệt"** bằng tài khoản của chính mình (máy quầy sau khi lễ tân đăng xuất, hoặc thiết bị riêng).
  - **Phụ thu trả muộn bằng giá 1 đêm** (khách rời sau 18:00 mà đêm đó căn đã có khách đến): đã vá trong `rc.3` (ESC-031) – lễ tân gọi quản lý báo trước, rồi **"Ghi phụ thu – quản lý xem lại"**, quản lý xem lại trong 24 giờ. Giới hạn của v1.0: quản lý nghe máy và muốn miễn ngay thì **khách vẫn trả đủ tại quầy, rồi OTTIMO hoàn** sau khi quản lý sửa dòng (không miễn tại quầy được). Vẫn nên phòng trước: chốt giờ đi từ 12:00 với khách đi hôm nay nếu căn có khách đến tối nay; khách ở quá 18:00 thì ưu tiên đổi căn cho khách sắp đến để Desk tính thêm 1 đêm như thường. Cách làm: Sổ tay mục 1.9, 2.15; `staff-one-pager.md`.
  - Không đọc mật khẩu qua điện thoại, không đưa mật khẩu cho lễ tân gõ hộ.
- **Chủ đầu tư và quản lý chưa đăng nhập app nhân viên** (`staff.ottimo.vn`) vì tài khoản có đăng nhập 2 bước; app báo "Đăng nhập 2 bước sẽ có ở bản sau". Kiểm phòng do lễ tân trưởng làm trên app. *[QA đang kiểm trên staging 27/10 – Q7, Q8 của sổ tay.]*
- **Minibar khi trả phòng:** app nhân viên chưa có màn đếm minibar. Buồng phòng đếm tủ, báo lễ tân số còn lại từng món (gọi hoặc nói trực tiếp; tin nhắn nội bộ không ghi tên khách); lễ tân nhập ở bước Minibar. *[QA đang kiểm – Q6.]*
- **Giá đã lên lịch:** Desk chưa hiện danh sách giá đã lên lịch cho ngày sau và chưa có nút hủy (v1.0.1). Mỗi lần lên lịch giá cho ngày sau, ghi căn, giá, ngày hiệu lực vào sổ. Muốn bỏ một giá đã lên lịch: nhập lại giá hiện hành với đúng ngày hiệu lực đó. Ở buổi B2, anh/chị nhập giá có hiệu lực ngay hôm đó.
- **Hạn lưu ảnh giấy tờ của khách đồng ý lưu:** v1.0 tự xóa **30 ngày** sau trả phòng (giới hạn hiện tại của tham số). Mức 3 tháng anh/chị chọn 26/10 áp ở bản vá sau khi đội bảo mật duyệt. Lễ tân đọc số ngày trên câu hỏi đồng ý của Desk khi nói với khách.
- **Kế toán chưa có tài khoản riêng trên Desk.** Việc đối chiếu do anh/chị hoặc quản lý làm trên Desk, kế toán ngồi cùng hoặc nhận số liệu. Cách cấp quyền cho kế toán chờ anh/chị quyết **ESC-038**.
- **Nhật ký xem giấy tờ:** mỗi lần xem số giấy tờ đầy đủ đều được ghi, nhưng Desk v1.0 chưa có màn để anh/chị tự xem nhật ký này; cần tra thì báo đội qua `/feedback`. *[QA đang kiểm – Q3; nếu Desk đã có màn này, PO bỏ dòng.]*
- **Giờ nhận phòng 12:00 trên các kênh ngoài Desk** anh/chị tự đổi trước ngày chạy: extranet Booking.com, Agoda, Airbnb (giờ nhận phòng và nội quy), Google Maps, fanpage, thẻ trong căn. Kênh OTA chưa đổi thì chưa thu được phụ thu nhận sớm của khách đặt qua kênh đó. Tin nhắn xác nhận và tin nhắc trước ngày đến ở v1.0 vẫn gửi tay: dùng câu chuẩn ở trên, không viết "phòng sẵn sàng từ 12:00".
- **Mã cửa** vẫn tạo và gửi khách như hiện nay, ngoài app.
- **Tài khoản nhận chuyển khoản** mới nhập chỉ có hiệu lực **từ ngày hôm sau**. Đây là cách chống tráo tài khoản, không phải lỗi.
- **Khách dài hạn** dùng "Đơn dài hạn nhập tay": giữ phòng và ghi thu tiền. Chưa có ký quỹ, lịch kỳ thu, điện nước trong app; phần này giữ theo sổ hiện nay.
- **Hóa đơn GTGT** vẫn xuất ngoài app. Desk ghi thông tin công ty để xuất.
- **Mất mạng:** chưa có bảng dự phòng in sẵn. Ba ngày đầu giữ sổ giấy song song (hướng dẫn `product/docs/day-one-guide.md`).
- **Yêu cầu của khách về dữ liệu cá nhân** (xem, sửa, xóa): chủ đầu tư xử lý bằng tay.
- **Email:** thông báo bảo mật (ví dụ tài khoản nhận chuyển khoản vừa đổi) gửi từ `info@ottimo.vn` tới chủ đầu tư. Nếu thư thử ở buổi cài đặt chưa tới, cảnh báo vẫn hiện trong Desk.

**Lỗi nhỏ còn mở (mức P3, không sai tiền, không chặn việc)** – sửa ở bản vá hằng tuần
- Desk, hộp "Giữ chỗ": số cọc và nội dung chuyển khoản hiện hai lần; khi khách đến hôm nay vẫn hiện ô chọn thời hạn giữ dù không giữ được (v1.0.1).
- Desk, bước "Phụ phí" khi trả phòng: các nút nhanh (giặt ủi, F&B, hút thuốc, mất thẻ) mở hộp nhưng chưa chọn sẵn khoản – lễ tân chọn tay (v1.0.1).
- Desk, khung đơn đang ở: dòng "Còn phải thu" hiện hai lần, cùng một số (v1.0.1).
- Desk, sau khi chi hoàn: thông báo có dấu trừ thừa, ví dụ "Đã ghi hoàn -500.000 đ" (v1.0.1). Số tiền ghi sổ đúng.
- Desk, "Cần chú ý": dòng giữ chỗ sắp hết hạn chưa ghi mã đơn (v1.0.1).
- Desk, nhận phòng: chip "Cần nhập thông tin" đè nút "Xem đủ số / ảnh" trên màn 1366 px (v1.0.1).
- Desk, đặt phòng mới: sau "Tạo nhanh khách", ô "Khách đứng tên" đôi khi vẫn đỏ tới lần bấm sau (v1.0.1).
- App buồng phòng: việc "Bổ sung minibar" còn nằm dưới "Khách đang ở" sau khi khách đã trả phòng (v1.0.1).
- Trang khách: câu "Ngôn ngữ theo trình duyệt của bạn" hiện cả khi ngôn ngữ lấy theo hồ sơ khách (v1.0.1).
- Desk, một số chữ chưa gọn: mã lý do thô trong Nhật ký tiền, tiêu đề hộp mật khẩu khi xem số tài khoản, câu "phí phạt" hiện cả với giặt ủi, nhãn ô người đi cùng, phím Esc không đóng khung đơn, báo giá thứ Sáu 1 đêm chỉ báo "tối thiểu 2 đêm" sau khi mở hộp, tìm đơn chưa tìm theo tên khách (v1.0.2).
- Desk, nơi nhận hoàn tiền: phải gõ mã ngân hàng 6 số, chưa có danh sách chọn ngân hàng (v1.1).
- Kiểm tra trình đọc màn hình (VoiceOver) cho hộp xác nhận chưa xong (v1.1).

**Ghi chú kỹ thuật (không ảnh hưởng bản thật)**
- Hai trường hợp công nợ chỉ xảy ra với dữ liệu ghi trước tháng 10/2026 (FZ-08, BUG-R2-210). Bản thật bắt đầu từ dữ liệu trống nên không gặp. Đội vẫn sửa ở v1.1.
- App buồng phòng chưa được nhân viên thật thử trên điện thoại thật. Tuần đầu đội theo dõi góp ý của buồng phòng qua `/feedback`.

### Cách báo lỗi
Gõ `/feedback <mô tả>`. Lỗi làm không đặt, nhận, trả phòng hay thu tiền được, hoặc sai tiền: ghi "P0" ở đầu, đội sửa trong ngày.
