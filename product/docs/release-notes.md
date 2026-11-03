# OTTIMO Desk – Release notes

Ghi chép thay đổi theo từng phiên bản, viết cho chủ đầu tư và nhân viên. Bản mới nhất ở trên.
Đánh số: `v1.0.0` bản chính · `v1.0.x` bản vá lỗi · `v1.x.0` bản thêm tính năng (quy trình: `rounds/round-03/release-v1-plan.md` mục 7).
Từ 01/11/2026 bản vá đi theo **đợt**: đợt nào xong trước thì lên trước, mỗi đợt nhận số kế tiếp (`rounds/round-04/plan-v1.0.1.md` mục 2). Kế hoạch cũ gom mọi việc vào một bản vá ngày 04/11. Nay chia như sau:

- **v1.0.1** – tin Google Chat. Đã phát hành 03/11.
- **v1.0.2** – trả phòng sớm, giá hẹn theo ngày. Đã phát hành 03/11.
- **v1.0.3** – email nhận thông báo bảo mật. Chờ phát hành, hạn chậm nhất 09/11.
- **v1.0.4** – giữ chỗ quá hạn, ngày kết thúc HĐ khi gia hạn, giá hẹn của căn mới, thông báo xử lý dữ liệu bản 2 và mở lại check-in online. Dự kiến 08/11, chậm nhất 10/11.

PO chốt phạm vi v1.0.3 ngày 03/11 (`rounds/round-04/plan-v1.0.3.md`): v1.0.3 chỉ sửa thư báo bảo mật để chắc kịp hạn 09/11. Các bảng "Chưa có" bên dưới đã ghi theo số mới (cập nhật 04/11).

---

## v1.0.3 – Email nhận thông báo bảo mật

- Trạng thái: **CHỜ PHÁT HÀNH.** Cổng QC rút gọn: **ĐẠT CÓ ĐIỀU KIỆN** (`rounds/round-04/qc/v1.0.3-gate.md`); quyết định có hiệu lực khi đội làm xong các điều kiện trước Release. Bản lên production là đúng bản đã chạy thử trên staging (commit `da6d6f3d`). Anh/chị duyệt Release như v1.0.1 và v1.0.2.
- Ngày phát hành: (điền khi Release)
- Bản này sửa **BUG-R3-032** (P1): thư "Security notice" chưa tới ai. Hạn sửa chậm nhất **09/11** (ESC-040).
- Áp dụng từ khi anh/chị báo "v1.0.3 đã lên". Hướng dẫn: bộ hướng dẫn theo bộ phận bản 1.7 (áp dụng khi v1.0.3 lên) – chủ đầu tư và quản lý `01` mục 1.6a, 1.7, 1.9, 2.2, 10.1, 10.2, 15.1; lễ tân `02` mục 1.3, 1.5, 1.6, 1.8; buồng phòng `03` mục 1.6; bảo trì `04` mục 1.5; sale, CTV `05` mục 1.5. Sổ tay gốc bản nội dung 1.9 – mục 0.2, 0.3a (email của mình), 0.4, 0.5, 1.1, 1.5 (chủ đầu tư sửa email cho nhân viên), 1.7, 1.16 (thứ tự ngày lên bản), 3.1, 3.6, 4.1, 5.0.

### Có trong bản này

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Email nhận thông báo bảo mật** | Menu dưới tên của mình có mục **Bảo mật tài khoản** (trước đây là **Xác thực 2 bước**). Trang này có khối mới **Email nhận thông báo bảo mật**. OTTIMO gửi thư **Security notice** tới địa chỉ này khi có thay đổi quan trọng: đổi tài khoản nhận chuyển khoản, dùng mã khôi phục, đặt lại xác thực 2 bước, đổi email. Chủ đầu tư và quản lý **bắt buộc** có email: chưa có thì Desk nhắc ở đầu trang. Lễ tân trưởng: không bắt buộc, khuyến khích có. Vai khác không bắt buộc. Thư đổi tài khoản nhận cọc có tiêu đề **"OTTIMO – Notice: …"**, không có chữ "Security notice": đừng lọc thư theo chữ đó. Nhận thư về việc mình không làm: mở Desk bằng cách **gõ địa chỉ**, làm theo bảng **Thư nào – làm gì** (`01` mục 1.6a). Với thư tài khoản nhận cọc: **Hủy lịch**, đổi mật khẩu, tạo bộ mã khôi phục mới, báo đội. Lễ tân **ngừng gửi mã VietQR** tới khi anh/chị xác nhận (`01` mục 10.2, sổ tay 1.7) | BUG-R3-032, ESC-040 |
| **Ai đặt email của ai** | **Mỗi người tự đặt email của mình** ở **Bảo mật tài khoản**. **Chủ đầu tư sửa được email của người khác** (quản lý, nhân viên) ở **Người dùng & vai** → **Sửa email**. Mỗi chủ đầu tư tự đặt email của mình; không ai sửa hộ. Quản lý và các vai khác không sửa email của người khác | V3-01, sổ tay 0.3a, 1.5 |
| **Xác nhận mỗi lần lưu** | Thêm, đổi hay xóa email đều phải nhập **mật khẩu đăng nhập**, và **mã 6 số** nếu tài khoản có xác thực 2 bước | SEC |
| **Thư báo khi email thay đổi** | Mỗi lần thêm, đổi hoặc xóa email, OTTIMO gửi thư tới **địa chỉ mới** (khi thêm, đổi), **địa chỉ cũ** (khi đổi, xóa) và **chủ đầu tư** (mọi lần). Thư không ghi địa chỉ email, không có đường liên kết, không hỏi mật khẩu hay mã. Nhận thư mà mình không đổi: không trả lời thư, mở Desk bằng cách gõ địa chỉ, đổi mật khẩu, báo chủ đầu tư trong ngày | SEC, CPY |
| **Chặn `info@`** | Desk từ chối `info@ottimo.vn` và báo: "Đây là hộp thư chung của cơ sở. Thông báo bảo mật cần tới một email riêng." **Desk chỉ chặn được địa chỉ này.** Các hộp thư chung khác như `booking@ottimo.vn`, Gmail dùng cho Booking/Agoda/Airbnb, hộp thư của quầy thì Desk vẫn nhận: **không dùng**. Hộp thư nhận chỉ một người đọc, không đăng nhập trên máy quầy, không tự chuyển tiếp sang hộp khác. Câu báo hiện sau khi bấm **Lưu email** trong hộp xác nhận; mật khẩu và mã không bị tính là sai | SEC, DOM, ARC |
| **App nhân viên** | Hộp **Thông báo** ghi rõ nghĩa, ví dụ "Email nhận thông báo bảo mật của bạn đã thay đổi", không còn hiện mã nội bộ. App không lưu địa chỉ email trên điện thoại | BUG-R4-021 |
| **Buồng phòng, bảo trì, sale nội bộ, CTV** | Thấy lại email của chính mình sau khi lưu | BUG-R4-018 |
| **Sale nội bộ, CTV: bật 2 bước được** | Từ bản này trang **Bảo mật tài khoản** hiện đúng mã QR và 10 mã khôi phục cho buồng phòng, bảo trì, sale nội bộ, CTV (ở v1.0.2 không hiện). Sale, CTV chỉ dùng Desk: tự bật được, nên bật | BUG-R4-022 |
| **Người dùng app nhân viên: chưa bật đăng nhập 2 bước ở v1.0.x** | Buồng phòng, bảo trì (mới bật được từ bản này) và lễ tân trưởng (bật được từ v1.0.0) dùng app nhân viên. **App nhân viên chưa đăng nhập được bằng 2 bước**: bật xong, app báo "Đăng nhập 2 bước sẽ có ở bản sau. Nhờ chủ đầu tư hỗ trợ đăng nhập." và người đó **không vào được app** (không nhận việc dọn, không bấm dọn xong). Anh/chị dặn khi cấp tài khoản (`01` mục 1.9). **Lỡ bật:** đăng nhập Desk bằng mật khẩu và mã → **Bảo mật tài khoản → Tắt xác thực 2 bước** → đăng nhập lại app. Lỡ bật rồi mất cả điện thoại lẫn mã khôi phục: báo chủ đầu tư; chủ đầu tư làm như `01` mục 1.7 (gặp tận mặt, khóa tài khoản cũ, tạo tài khoản mới đúng vai cũ, người đó không bật 2 bước) | DOM, ARC, SEC, BUG-R4-022 |

### Việc anh/chị làm sau khi lên

1. Desk → **tên của mình → Bảo mật tài khoản** → nhập **hộp thư riêng** chỉ anh/chị đọc vào ô **Email** (không dùng `info@ottimo.vn` hoặc `booking@ottimo.vn`, không dùng Gmail chung của OTA) → bấm **Thêm email** → trong hộp xác nhận, đọc lại **Địa chỉ mới**, nhập mật khẩu và mã 6 số → **Lưu email**.
2. Mở hộp thư, tìm thư **Security notice: notification email changed**. Thấy thư thì nhắn đội "đã nhận". **Không dán địa chỉ email vào chat.** Sau 15 phút chưa thấy: xem mục Spam (thấy thì đánh dấu **Không phải thư rác**), kiểm lại địa chỉ, rồi báo đội. Không cần thử lại nhiều lần.
3. Đội có thể nhờ anh/chị thử **một lần** nhập `info@ottimo.vn` theo hướng dẫn riêng, để xác nhận Desk từ chối địa chỉ này. Việc này không bắt buộc.
4. **Sau khi anh/chị đã thấy thư của mình**: người trực (đang giữ vai quản lý, nên **bắt buộc** có email) **tự nhập** email riêng ở **Bảo mật tài khoản**. Anh/chị sẽ nhận một thư báo email của người trực đã đổi: thư này là bình thường. Người trực không tự làm được thì anh/chị đặt hộ ở **Người dùng & vai → Sửa email**, hỏi tận miệng địa chỉ. **Anh/chị nhập trước, người trực nhập sau**: làm ngược thì thư báo gửi anh/chị không có người nhận, đội bảo mật phải chờ thêm mới báo bỏ được B1–B6.
5. **Lượt kiểm B1–B6 mỗi sáng vẫn tiếp tục tới khi đội bảo mật báo bỏ**, ít nhất 24 giờ sau khi anh/chị nhận thư. Không bỏ ngay ngày lên bản.

### Thay đổi cấu trúc dữ liệu (đọc trước khi duyệt Release)

- Bản này thêm **0091**: bảng ghi các lần đổi email, để gửi thư tới địa chỉ cũ. Địa chỉ cũ bị xóa ngay sau khi thư đã gửi, chậm nhất sau 7 ngày.
- 0091 **chỉ đi tiến**. Nếu sau khi lên mà Desk lỗi nặng, đội lùi **phần mềm** về v1.0.2; dữ liệu giữ nguyên (đã diễn tập trên staging). Trong lúc lùi, menu trở lại tên **Xác thực 2 bước** và khối email tạm ẩn: anh/chị không thêm hay đổi email. Email đã lưu vẫn dùng, thư báo bảo mật vẫn tới, **không cần nhập lại**. Thư báo đổi email trong khoảng đó được gửi bù sau khi lên lại, khi anh/chị đồng ý. App nhân viên bản cũ có thể hiện mã `user.email_changed` trong lúc lùi: bỏ qua.
- Thư không tới (lỗi đường gửi thư) **không** phải lý do lùi phần mềm. Đội kiểm đường gửi thư, anh/chị giữ lượt kiểm B1–B6.
- Khôi phục dữ liệu từ bản sao lưu chỉ làm khi dữ liệu hỏng và anh/chị quyết. Đội sao lưu ngay trước khi lên.
- Bản này không đổi luồng tiền: đặt phòng, folio, thu tiền, cọc giữ nguyên như v1.0.2.

### Giới hạn đã biết

- **Chưa có nút "Đặt lại xác thực 2 bước" cho người khác trên Desk** (BUG-R4-020, P3). **Đặt lại mật khẩu không gỡ 2 bước.** Người trực (hoặc người khác có 2 bước) mất cả điện thoại lẫn mã khôi phục: người đó báo anh/chị, không xin mã của ai. Anh/chị **gặp tận mặt** người đó, **không làm theo tin nhắn**, rồi trên máy riêng: (1) **Khóa tài khoản** cũ ngay (để khóa, **không xóa**: giữ nhật ký); (2) **Thêm người dùng** mới cho chính người đó, **tên đăng nhập mới**, đúng các vai cũ; (3) đưa mật khẩu tạm tận tay. Người đó đăng nhập trên laptop riêng, **bật 2 bước** trên điện thoại mới và **nhập email nhận thông báo ngay** (vai quản lý bắt buộc có email). Đây là cách duy nhất ở v1.0.3, như `01` mục 1.7. **v1.0.4 sẽ có nút đặt lại 2 bước trên Desk.**
- **Chưa bật đăng nhập 2 bước cho người dùng app nhân viên ở v1.0.x** (buồng phòng, bảo trì, lễ tân trưởng). App nhân viên chưa có bước nhập mã: bật xong là không vào được app. **Lỡ bật:** đăng nhập Desk bằng mật khẩu và mã → **Bảo mật tài khoản → Tắt xác thực 2 bước** → đăng nhập lại app. Lỡ bật rồi mất cả điện thoại lẫn mã khôi phục: báo chủ đầu tư; chủ đầu tư làm như dòng trên (gặp tận mặt, khóa tài khoản cũ, tạo tài khoản mới đúng vai cũ), người đó không bật 2 bước. App nhân viên có bước nhập mã dự kiến ở v1.0.4.
- **Cột Email ở Người dùng & vai có thể ngắt địa chỉ giữa chữ** trên màn 1440 px (BUG-R4-023, P3). Cần chép địa chỉ thì mở **Sửa email**: ô nhập hiện trên một dòng. Ảnh sổ tay C1-07, C1-22 mang lỗi này; chụp lại khi sửa.
- **Hộp xác nhận chỉ có ô mật khẩu** (tài khoản không có 2 bước): nhập sai mật khẩu thì Desk báo "Mật khẩu hoặc mã chưa đúng. Kiểm tra lại rồi nhập mã mới." (BUG-R4-024, P3). Không có mã nào cần nhập: chỉ nhập lại mật khẩu đúng.
- **Chưa giới hạn số lần đổi email.** Mọi lần đổi cần mật khẩu và mã, thư tới cả địa chỉ cũ và chủ đầu tư. Lượt kiểm hằng ngày của đội báo khi một người đổi quá 5 lần trong 24 giờ. Giới hạn cứng ở v1.0.4.
- **Thư thật chỉ thử được trên production.** Staging không gửi thư ra ngoài. Lần anh/chị lưu email là lần đầu thư đi tới hộp thư ngoài tên miền `ottimo.vn`.
- **Check-in online vẫn tạm dừng với khách thật.** Thông báo xử lý dữ liệu bản 2 **không** có trong bản này (dời v1.0.4). Lễ tân vẫn không tạo, không gửi link check-in online; mọi khách làm giấy tờ tại quầy như mục v1.0.0 "Giới hạn đã biết". Mở lại khi bản có thông báo bản 2 lên, đội bảo mật kiểm xong và đội báo "mở lại".
- **Lượt kiểm B1–B6 mỗi sáng tiếp tục tới khi đội bảo mật báo bỏ** (cách làm ở mục v1.0.0). Đội bảo mật chỉ báo bỏ khi bản đã lên, anh/chị đã nhận thư và qua ít nhất 24 giờ không có thư nào bị kẹt.
- **Giữ chỗ quá hạn**: vẫn rà 3 mốc mỗi ngày (sổ tay 2.4) tới v1.0.4.
- **Duyệt hoàn: một đơn có thể có hơn một yêu cầu hoàn** (BUG-R4-025, đính chính mục v1.0.2). Ví dụ: một yêu cầu từ **Trả sớm** và một yêu cầu từ **Trả phòng** cho đêm đã thu rồi được FOC. Hai yêu cầu cho hai khoản khác nhau, **không phải hoàn trùng**. Trước khi từ chối một yêu cầu, cộng các yêu cầu đang chờ của đơn và đối chiếu với số khách đã trả thừa trên folio (**Đã thu** trừ **Tổng cộng**). Tổng bằng số trả thừa thì các yêu cầu đều đúng, không từ chối vì nghĩ là trùng: từ chối nhầm thì khách mất tiền.
- **Đơn HĐ thuê tháng đã gia hạn** và **hủy giá hẹn của căn mới** (BUG-R4-015): giữ cách làm ở mục v1.0.2 "Giới hạn đã biết" tới v1.0.4.

### Chưa có trong bản này

| Tính năng | Dự kiến |
|---|---|
| Giữ chỗ đã có cọc mà quá hạn: ghi thêm tiền và xác nhận được; ô **Chấp nhận cọc thiếu – lý do**; báo giữ chỗ quá hạn vào hộp thư và **Cần chú ý**; chữ đúng cho giữ chỗ có cọc (BUG-R3-042, 043, 041, 044) | **v1.0.4** (dự kiến 08/11, chậm nhất 10/11) |
| Thông báo xử lý dữ liệu bản 2 trên trang khách; mở lại check-in online | **v1.0.4**, sau khi đội bảo mật kiểm |
| Desk giữ ngày kết thúc HĐ khi gia hạn đơn HĐ | **v1.0.4** |
| Không hủy được dòng giá đầu tiên của căn mới (BUG-R4-015) | **v1.0.4** |
| App nhân viên có bước nhập mã 2 bước khi đăng nhập; nút **Đặt lại xác thực 2 bước** cho người khác trên Desk (BUG-R4-020) | **v1.0.4** |
| Cột Email không ngắt giữa địa chỉ; câu báo sai mật khẩu đúng với hộp chỉ có mật khẩu (BUG-R4-023, 024) | **v1.0.4** |
| Giới hạn cứng số lần đổi email | **v1.0.4** |
| Các việc khác trong bảng "Chưa có" của v1.0.2 và v1.0.0 | Theo đích ghi ở bảng đó |

### Ghi chú kỹ thuật (không đổi giao diện)

- Lượt kiểm hằng ngày của đội thêm 3 dòng về email: tài khoản chủ đầu tư/quản lý chưa có email, số lần đổi email trong 24 giờ, địa chỉ có ký tự lạ. Kết quả chỉ ghi số, không ghi địa chỉ.
- Cảnh báo "thư bảo mật không có người nhận" bật sau, ít nhất 24 giờ sau khi anh/chị lưu email, khi đủ điều kiện và anh/chị đồng ý.
- Trên staging: diễn tập lên bản và lùi bản có dữ liệu mới đạt 16/16 bước; kiểm giao diện Desk và app nhân viên đạt 6/6.

---

## v1.0.2 – Trả phòng sớm và giá hẹn theo ngày

- Trạng thái: **ĐÃ PHÁT HÀNH – tag `v1.0.2` trên commit `e5fffe05`**, production chạy từ **03/11/2026** (anh/chị duyệt Release). Cổng QC rút gọn: **ĐẠT CÓ ĐIỀU KIỆN** (`rounds/round-04/qc/v1.0.2-gate.md`). Lượt kiểm sau khi lên đạt K1–K9. Đội sao lưu ngay trước khi lên; lệnh quay lui đã diễn tập trên staging.
- Áp dụng từ khi anh/chị báo "v1.0.2 đã lên". Hướng dẫn: bộ hướng dẫn theo bộ phận bản 1.5 – lễ tân `02` mục 11.5 và 17.5, chủ đầu tư và quản lý `01` mục 7.3; sổ tay gốc bản nội dung 1.7 mục 2.14a.

### Có trong bản này

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Nút Trả sớm – đơn ngắn ngày** | Khung đơn đang ở có nút **Trả sớm** (lễ tân trở lên). Hộp có 3 bước: **Ngày rời và giờ báo** → **Xem trước** → **Kết quả**. Bước **Xem trước** do máy chủ tính và **chưa ghi gì**; chỉ khi bấm **Xác nhận trả sớm** Desk mới ghi. Desk tính theo chính sách trả sớm: đơn Trực tiếp/CTV báo trước từ 1 ngày thì hoàn 50 % tiền phòng các đêm chưa ở, phụ thu người của các đêm đó hoàn đủ; báo trong ngày rời thì không hoàn. Đơn OTA: lễ tân nhập **Số OTA giữ lại** theo extranet. Các đêm bỏ được mở bán lại ngay. Có khoản hoàn thì Desk tạo **một** yêu cầu hoàn cho phần trả sớm, quản lý duyệt, anh/chị chi. Trả phòng sau đó **không tạo lại** khoản này. Nếu folio còn tiền khách trả thừa **khác** (ví dụ đêm đã thu rồi được FOC), bước **Bill** hỏi cách xử lý phần đó; chọn hoàn thì có **thêm một** đề nghị hoàn cho đúng phần này, không trùng. *(Đính chính 04/11, BUG-R4-025: bản trước ghi "trả phòng sau đó không tạo thêm".)* Giờ báo ghi lùi (khách đã nhắn từ trước) phải kèm bằng chứng | B16, BR-428 |
| **Nút Trả sớm – đơn HĐ thuê tháng** (đơn dài hạn nhập tay) | Bước **Xem trước** không có bảng tiền. Desk hiện khung **Trả trước hạn hợp đồng thuê tháng** với hai nhánh: **đã thu tiền thuê tới hết HĐ** thì không vi phạm HĐ, quyết toán ký quỹ như trả phòng đúng hạn, không hoàn các ngày không ở; **chưa thu đủ** thì vi phạm HĐ, mất toàn bộ ký quỹ, không truy thu giảm giá kỳ hạn. Desk chưa biết kỳ thu đã thu tới đâu, nên lễ tân kiểm bảng kỳ thu và **hỏi quản lý (hiện là anh/chị) trước khi báo khách**. Ký quỹ và tiền thuê vẫn xử lý ngoài app | ESC-048 B (03/11), ESC-045 câu 4, BR-313 |
| **Bỏ cách tạm cũ khi khách rời sớm** | Không để căn **Đang ở** tới ngày đi, không giảm tiền phòng trên folio bằng tay nữa. Màn **Trả phòng** vẫn chỉ dùng vào ngày đi: khách rời hôm nay thì bấm **Trả phòng ngay** ở bước **Kết quả** của hộp **Trả sớm** | BR-428, sổ tay 2.14a |
| **Xem và hủy giá hẹn theo ngày** | **Danh mục căn** → mở căn: có danh sách giá đêm/giá tháng đã lên lịch cho các ngày sau. Hủy được một dòng chưa tới ngày hiệu lực; không hủy được dòng đang áp dụng hay dòng giá duy nhất của căn. Chủ đầu tư và quản lý thấy danh sách, lễ tân không thấy. Đơn đã đặt giữ giá lúc đặt. Bỏ việc ghi sổ mỗi lần lên lịch giá | BUG-R3-018 phần 2 |
| **Form website chặn số giấy tờ và số thẻ chặt hơn** | Lời nhắn trên form "Yêu cầu đặt phòng" có số CCCD, hộ chiếu hay số thẻ, kể cả khi viết tách bằng dấu cách, dấu chấm, ký tự ẩn hay chữ số khổ rộng, thì form báo khách sửa và **không lưu gì**. Số phòng, ngân sách, số điện thoại vẫn gửi bình thường. Đôi khi form chặn nhầm (ví dụ hai số điện thoại nối bằng chữ "no"): khách viết lại bằng "hoặc" hay "/". Đội theo dõi tỉ lệ bị chặn 4 tuần đầu, quá 2 % thì xem lại | PR #24, BUG-R3-058, GCHAT-07 |
| **Làm sạch chữ trong tin Google Chat** | Tin Chat dùng cùng bộ dò với form, và bỏ các ký tự có thể làm giả đường link. Hiện tin vẫn ở **mức A** (chỉ mã yêu cầu, giờ, hạn trả lời, link Desk; không có chữ khách viết), nên anh/chị chưa thấy khác. Đây là điều kiện trước khi bật mức tin có chi tiết khách | PR #24, SEC mục 10 |
| **Thông báo quyền riêng tư chỉ thêm, không sửa, không xóa** | Hệ thống khóa nơi lưu các bản thông báo quyền riêng tư của website: chỉ thêm được bản mới; không sửa, không xóa bản cũ. Nhờ vậy luôn chứng minh được khách đã đồng ý với bản nào khi gửi form. Nhân viên không có việc gì mới | PN-01 |

### Thay đổi cấu trúc dữ liệu (đọc trước khi duyệt Release)

- Bản này đổi cấu trúc cơ sở dữ liệu lần đầu kể từ v1.0.0: **0089** (chốt để bước **Xem trước** của **Trả sớm** không ghi gì; cho phép hủy dòng giá hẹn) và **0090** (khóa chỉ-thêm cho bản thông báo quyền riêng tư).
- Hai thay đổi này **chỉ đi tiến**. Nếu sau khi lên mà Desk lỗi nặng, đội lùi **phần mềm** về v1.0.1; dữ liệu giữ nguyên và v1.0.1 vẫn chạy được trên dữ liệu mới. Khi đó Desk không còn nút **Trả sớm** và danh sách giá hẹn: lễ tân quay lại cách tạm cũ (sổ tay 2.14a bản trước).
- Khôi phục dữ liệu từ bản sao lưu sẽ mất mọi thao tác sau giờ sao lưu, nên **chỉ làm khi dữ liệu hỏng và anh/chị quyết**. Đội sao lưu ngay trước khi lên.
- Đội kỹ thuật không sửa hay xóa tay bảng thông báo quyền riêng tư trên máy chủ.

### Giới hạn đã biết

- **Đơn HĐ thuê tháng đã gia hạn** (sửa ở v1.0.4): bấm **Gia hạn** thì Desk dời **Ngày ra (theo HĐ)** sang ngày cuối gia hạn và không giữ ngày kết thúc HĐ. Trước khi gia hạn, ghi ngày kết thúc HĐ vào bảng kỳ thu và sổ giao ca. Khách rời trong phần gia hạn vẫn thấy khung **Trả trước hạn hợp đồng thuê tháng**: đây không phải vi phạm HĐ, làm theo `02` mục 11.5.4. Nhật ký của đơn HĐ có thể ghi "BR-428 notice …": bỏ qua, nhánh và người quyết ghi ở sổ giao ca.
- **Trả phòng trước ngày đi chỉ qua Trả sớm.** Màn **Trả phòng** vẫn mở được trước ngày đi nhưng báo lỗi khi hoàn tất (BUG-R3-024): không dùng.
- **Hộp Trả sớm trên màn 1440 × 900:** ô tích "Đã báo khách…" và nút **Xác nhận trả sớm** có thể nằm dưới mép màn. Cuộn xuống trong hộp để thấy.
- **Hủy giá hẹn của căn mới** (BUG-R4-015, P3, sửa ở v1.0.4): căn mới có ngày bắt đầu bán ở tương lai, đã lên lịch thêm một giá sau đó, rồi hủy dòng giá đầu tiên, thì căn không báo giá được cho tới ngày của dòng sau. Không sai tiền. Cách tránh: không hủy dòng giá đầu tiên của căn mới. Lỡ hủy: lên lịch lại giá đúng ngày bắt đầu bán.
- **Chữ đơn cách cho tiếng Nga** (BUG-R4-017, P3): ô mã và Wi-Fi hiện chữ Nga bằng font dự phòng; cửa sổ kỹ thuật của trình duyệt báo lỗi font. Không ảnh hưởng thao tác.
- **Tin Google Chat vẫn ở mức A.** Mức có chi tiết khách bật sau, khi đủ các điều kiện bảo mật (cần phòng Chat thử – ESC-046).
- **Vẫn giữ các cách tạm của v1.0.0** cho thư báo bảo mật (lượt kiểm B1–B6 mỗi sáng trước 09:00, tới khi đội bảo mật báo bỏ sau khi v1.0.3 lên), giữ chỗ quá hạn (rà 3 mốc mỗi ngày, tới v1.0.4) và check-in online (tạm dừng với khách thật, tới khi có thông báo xử lý dữ liệu bản 2 – dự kiến v1.0.4). Chi tiết ở mục v1.0.0 bên dưới.

### Chưa có trong bản này

| Tính năng | Dự kiến |
|---|---|
| Ô email cho người dùng; thư báo bảo mật tới hộp thư riêng của chủ đầu tư (BUG-R3-032, P1) | **v1.0.3** (xem mục v1.0.3), chậm nhất **09/11** (ESC-040). Quá hạn thì đội bảo mật báo lại anh/chị |
| Giữ chỗ đã có cọc mà quá hạn: ghi thêm tiền và xác nhận được; ô **Chấp nhận cọc thiếu – lý do**; báo giữ chỗ quá hạn vào hộp thư và **Cần chú ý**; chữ đúng cho giữ chỗ có cọc (BUG-R3-042, 043, 041, 044) | **v1.0.4** (dự kiến 08/11, chậm nhất 10/11; thay mốc "v1.0.3, dự kiến 07/11" cũ) |
| Thông báo xử lý dữ liệu bản 2 trên trang khách; mở lại check-in online | **v1.0.4**, sau khi đội bảo mật kiểm (không kịp v1.0.3) |
| Desk giữ ngày kết thúc HĐ khi gia hạn đơn HĐ; khung HĐ chỉ hiện khi khách rời trước ngày kết thúc HĐ | **v1.0.4** |
| Không hủy được dòng giá đầu tiên của căn mới (BUG-R4-015) | **v1.0.4** |
| Các việc khác trong bảng "Chưa có" của v1.0.0 | Theo đích ghi ở bảng đó |

### Ghi chú kỹ thuật (không đổi giao diện)

- Tệp lệnh cho chủ đầu tư có thêm mục quay lui phần mềm; thêm lệnh kiểm nhật ký thông báo quyền riêng tư và bước diễn tập khôi phục (PR #26).
- Trên staging, mọi số tiền trả sớm ở bước **Xem trước** trùng đúng số ghi thật, và bước **Xem trước** không đổi bảng dữ liệu nào (kiểm 124 bảng).

---

## v1.0.1 – Tin Google Chat cho yêu cầu từ website

- Trạng thái: **ĐÃ PHÁT HÀNH – tag `v1.0.1` trên commit `755cad16`**, production chạy từ **03/11/2026**. Lượt kiểm sau khi lên đạt 14/14: tin thử tới đúng phòng Chat, xóa được bằng quyền quản lý phòng. QC: `rounds/round-04/qc/v1.0.1-gate.md`.

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Tin báo yêu cầu website vào Google Chat** | Mỗi yêu cầu mới trên form ottimo.vn đăng một tin vào phòng **"OTTIMO – Yêu cầu đặt phòng"**, kèm tin nhắc và tin báo khi yêu cầu quá hạn trả lời. Tin ở **mức A**: mã yêu cầu, giờ nhận, hạn trả lời, mức gấp, link mở Desk; không có tên hay liên hệ của khách. Xem và trả lời khách vẫn trên Desk. Cách dùng: `01` mục 12, `02` mục 13.1a | US-155, ESC-041 |
| **Câu báo giá ghi đúng số ít, số nhiều** | "1 night" thay cho "1 nights"; tiếng Nga và tiếng Việt cũng đúng | BUG-R4-009 |
| Kiểm hạ tầng | Lệnh kiểm hằng ngày báo rõ loại lỗi; nhật ký thông báo quyền riêng tư vào bản sao lưu mã hóa. Không đổi giao diện | PR #23, #25 |

Không có trong v1.0.1 (dù kế hoạch cũ hẹn các việc này cho bản vá 04/11): trả phòng sớm và giá hẹn – nay ở **v1.0.2**; thư báo bảo mật – nay ở **v1.0.3**; giữ chỗ quá hạn, thông báo xử lý dữ liệu bản 2 – nay ở **v1.0.4** (cập nhật 04/11).

---

## v1.0.0 – Bản vận hành đầu tiên

- Trạng thái: **ĐÃ PHÁT HÀNH – tag `v1.0.0` trên commit `8b3aec8`** (cùng mã với `v1.0.0-rc.6`). Gắn tag ngày **30/10/2026** sau cổng QC v1.0 (ĐẠT CÓ ĐIỀU KIỆN, `rounds/round-03/qc/v1-gate.md`) và quyết định ESC-040 A của anh/chị (30/10). Cập nhật lần cuối: PO, 30/10/2026 (khuya, sau khi đội thử luồng giữ chỗ quá hạn và kiểm từng nút hoàn tiền trên bản thử).
- Bản đang chạy: **production chạy đúng mã này từ 07:51 ngày 30/10/2026** (anh/chị đồng ý 29/10). Gắn tag không cài lại gì: lượt Release tự sinh khi gắn tag bị từ chối vì cùng một bản.
- Ngày chạy với khách thật: **thứ Hai 02/11/2026** (anh/chị chốt 26/10), sau khi xong các việc "Chặn D" trong `rounds/round-03/qc/v1-gate.md` mục 4.2–4.3.
- Bản vá kế tiếp (cập nhật 04/11 theo cách đánh số đợt): **v1.0.1** đã lên 03/11 (tin Google Chat); **v1.0.2** đã lên 03/11 (trả phòng sớm và giá hẹn); **v1.0.3** thư báo bảo mật (chậm nhất 09/11); **v1.0.4** thông báo xử lý dữ liệu bản 2, giữ chỗ quá hạn – báo và xác nhận cọc sau hạn (dự kiến 08/11, chậm nhất 10/11). Xem "Chưa có trong bản này".
- Địa chỉ: Desk `desk.ottimo.vn` · app nhân viên (buồng phòng, bảo trì, lễ tân trưởng) `staff.ottimo.vn` · trang khách `g.ottimo.vn` · website `ottimo.vn`
- Hướng dẫn dùng cho từng bộ phận: **Sổ tay sử dụng OTTIMO Desk v1.0** (`product/docs/manual/user-manual-v1.0.md`, bản nội dung 1.5, 30/10). Bản tóm tắt dán quầy: `product/docs/staff-one-pager.md`. Chuyển đổi ngày đầu: `product/docs/day-one-guide.md`.

### Thay đổi từ `rc.3` (27/10) đến `v1.0.0` (= `rc.6`, 29/10)

`rc.4`, `rc.5` chỉ chạy trên staging. Production đi thẳng từ `rc.3` lên `rc.6` sáng 30/10.

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Tạo được đơn dài hạn nhập tay** | Form **Đơn dài hạn nhập tay** có ô **Nguồn** (Zalo / điện thoại, Website, Khách vãng lai, Khách quay lại). Đơn giữ căn trên sơ đồ, mang cờ "HĐ ngoài hệ thống". Tiền thuê và ký quỹ vẫn ghi ngoài app như cũ | BUG-R3-019 (P1) |
| **In phiếu dùng được** | **In phiếu** in đúng một tờ A4 chỉ có phiếu, Tiếng Việt hoặc Việt – Anh, chữ và màu theo nhận diện OTTIMO. Chưa thử trên máy in ở quầy: in thử một tờ trước ngày 02/11 | BUG-R3-020 |
| **Ghi phát sinh sau trả phòng** | Đơn đã trả phòng có nút **Thêm phát sinh** trong 24 giờ sau khi hoàn tất trả phòng (ví dụ phát hiện hư hỏng, minibar thiếu); khoản phạt, đền bù phải kèm ảnh hoặc ghi chú bằng chứng. Ghi nhầm: quản lý mở **Folio & điều chỉnh** → **Điều chỉnh** → **Bỏ cả dòng** hoặc sửa số, ghi lý do. Quá 24 giờ Desk khóa folio: **không ai** thêm hay điều chỉnh được, kể cả quản lý (câu báo lỗi trên Desk còn ghi "chỉ quản lý…" – sai, xem "Giới hạn đã biết") | BUG-R3-022 |
| **Khung Folio đúng số sau trả phòng** | Bấm **Hoàn tất** xong, khung Folio đọc lại số của hệ thống, không còn báo "Còn phải thu" khi khách đã trả đủ | BUG-R3-033 |
| **Hộp Đổi phòng dễ đọc hơn** | Tên nhóm căn hiện bằng chữ (không còn mã L12, N, NPLUS). Danh sách còn có thể lẫn căn chưa dọn: chọn căn đó thì Desk báo và không lưu gì (lọc hẳn ở v1.0.4 hoặc v1.0.5) | BUG-R3-023 (một phần) |
| **Wi-Fi trên trang khách** | Ngày đến và trong lúc ở, trang khách ghi "hỏi lễ tân" thay cho câu sai cũ. Ô nhập Wi-Fi trên Desk ở v1.0.4 hoặc v1.0.5 | BUG-R3-021 (một phần) |
| **Việc tự động chạy đúng** | Desk tự đóng phiếu sau 24 giờ trả phòng và ghi công nợ nếu khách còn nợ; mã VietQR quá hạn tự chuyển "hết hạn"; giữ chỗ **chưa cọc** quá hạn tự hủy và nhả căn, giữ chỗ **đã có cọc** được giữ lại để lễ tân xử lý. Ở `rc.3` ba việc này không chạy (production lúc đó chưa có đơn nên không ảnh hưởng) | BUG-R3-037, 038, 039 (P1) |

### Thay đổi từ `rc.1` (26/10) đến `rc.3` (27/10)

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Khách rời sau 18:00 khi đêm đó căn đã có khách đến** – vá trước ngày chạy theo quyết định của anh/chị | Ở bước "Bill & thu tiền", Desk chọn sẵn **"Ghi phụ thu – quản lý xem lại"**: số bằng giá 1 đêm do Desk tính, lễ tân không sửa được, không có ô miễn, phải ghi lý do; không cần mật khẩu của ai. Quản lý và anh/chị nhận thông báo, xem lại ở **Cần chú ý** trong 24 giờ kể từ lúc bấm trả phòng: đồng ý thì bấm **Đã xem**; nên giảm thì sửa dòng phụ thu, Desk tự tạo yêu cầu hoàn và người sửa không tự duyệt khoản hoàn. Quá hạn, Desk báo anh/chị | ESC-031 (26/10), ESC-024 B |
| **Thu tiền mặt/thẻ ở bước cuối trả phòng** khi vừa có phụ thu mới | Tiền mặt hoặc thẻ POS lớn hơn số đang nợ lúc đó (ví dụ phụ thu sau 18:00 vừa ghi ở bước 3): Desk ghi "đã nhận", khoản thu vào folio khi bấm **Hoàn tất**. Desk không nhận quá số còn phải thu; số cần thu đổi sau khi nhập thì Desk báo và cho **Bỏ** khoản đó để nhập lại | BUG-R3-017 |
| **Nhận phòng từ 12:00** | Ô giờ nhận mặc định "Nhận từ 12:00 – không phụ thu"; phụ thu nhận sớm chỉ trước 12:00 (chi tiết ở mục "Giờ nhận và trả phòng" bên dưới) | FB-INV-004 (26/10) |
| **Giá đêm và giá tháng nhập riêng** | **Danh mục căn → Sửa**: ô **Giá đêm niêm yết** nhập được, không còn tự bằng giá tháng ÷ 12. Giá đêm anh/chị nhập là giá ngày thường, kênh Trực tiếp; Desk vẫn tự cộng cuối tuần và ngày đặc biệt như cũ. Desk cảnh báo (vẫn cho lưu) khi giá đêm thấp hơn giá tháng chia 30 | FB-INV-005, ESC-036 A (26/10) |
| **Sửa một giá đã lên lịch bị nhập nhầm** | Mở **Sửa**, chọn đúng ngày hiệu lực của giá nhầm, nhập giá đúng, **Lưu**: giá đúng thay giá nhầm của ngày đó. Phần còn lại (xem danh sách giá đã lên lịch, nút hủy) **có ở v1.0.2** | BUG-R3-018 phần 2; phần 1 → v1.0.2 |
| Giá trị khởi tạo theo câu trả lời 26/10 | Hạng Studio City View 101, 201 / Garden View 102, 103, 202, 203; tên hạng Premium, Signature theo e-brochure; điện 5.000 đ/kWh, nước 100.000 đ/người/tháng (ghi để tính tay, xem "Giới hạn đã biết") | INV 26/10 (8 câu DOM) |

### Có trong bản này

**Desk (lễ tân, quản lý, chủ đầu tư)**
- **Sơ đồ phòng và đặt phòng:** sơ đồ 14 ngày, đặt trực tiếp, chặn đặt trùng, đổi căn/đổi ngày, hủy, khách không đến, đơn OTA nhập tay, đơn dài hạn nhập tay.
- **Báo giá, giữ chỗ, cọc:** báo giá có hạn, giữ chỗ tự hết hạn, mã VietQR đúng số tiền và mã đơn, xác nhận đã nhận cọc.
- **Giờ nhận và trả phòng (đổi 26/10 theo quyết định của anh/chị):** khách **nhận phòng từ 12:00** khi căn đã sẵn sàng, căn **chắc chắn sẵn sàng lúc 14:00**; **trả phòng 12:00** như cũ. Từ 12:00 không có phụ thu nhận sớm; nhận trước 12:00 Desk tính 30 % (10:00–11:59) hoặc 50 % (06:00–09:59) giá đêm đầu. Câu nói với khách: "Check-in is from 12:00. Your room is always ready by 14:00. Check-out is by 12:00." / "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00. Trả phòng trước 12:00."
- **Nhận phòng, lưu trú, trả phòng:** phụ thu nhận sớm/trả muộn tự tính, gia hạn, thêm dịch vụ vào folio, trả phòng 3 bước, thu tiền nhiều lần, công nợ và thu nợ. Trả sau 18:00 khi đêm đó căn đã có khách đến: lễ tân ghi phụ thu bằng giá 1 đêm, quản lý xem lại trong 24 giờ (xem "Thay đổi từ rc.1").
- **Phiếu thanh toán (bill):** xem trên màn hình trước và sau trả phòng, chọn **Tiếng Việt** hoặc **Việt – Anh**, nút **In phiếu** in một tờ A4 qua hộp in của trình duyệt (in giấy, hoặc "Lưu dưới dạng PDF" của trình duyệt rồi gửi riêng cho khách). Mẫu in chính thức và gửi bill tự động ở v1.2 (bảng dưới).
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
- **Tạm chưa dùng với khách thật từ 02/11 tới khi bản có thông báo xử lý dữ liệu bản 2 lên (dự kiến v1.0.4) và đội báo "mở lại"** (xem "Giới hạn đã biết" – check-in online).

**Website ottimo.vn**
- Trang giới thiệu OTTIMO (concept "The art of staying well"), tiếng Anh và tiếng Việt, đã lên mạng từ **25/10/2026**.
- Nút liên hệ mở Zalo, gọi điện, email. Form "Yêu cầu đặt phòng" có sẵn trong bản này nhưng **đang tắt**.

### Chưa có trong bản này
| Tính năng | Dự kiến |
|---|---|
| Ô email cho người dùng; thư báo bảo mật tới hộp thư riêng của chủ đầu tư (BUG-R3-032) | **v1.0.3**, chậm nhất 09/11 |
| Nút **Trả phòng sớm** trên Desk (máy chủ tính tiền hoàn) | v1.0.2 |
| Thông báo xử lý dữ liệu bản 2 trên trang khách (thêm câu hạn lưu), mở lại check-in online | **v1.0.4** |
| Báo giữ chỗ quá hạn vào hộp thư và **Cần chú ý** (BUG-R3-041); giữ chỗ có yêu cầu giảm giá/FOC quá hạn tự hủy được | **v1.0.4** |
| Giữ chỗ **đã có cọc** mà quá hạn: lễ tân ghi thêm tiền và xác nhận được tới khi khách nhận phòng (BUG-R3-042) | **v1.0.4** |
| Ô **Chấp nhận cọc thiếu – lý do** trong hộp Xác nhận cọc, cho quản lý và chủ đầu tư (BUG-R3-043) | **v1.0.4** |
| Desk ghi đúng giữ chỗ có cọc: không ghi "đơn đã tự hủy" hay "căn đã mở bán lại"; hộp hủy hiện số sẽ hoàn (BUG-R3-044); **Cần chú ý** liệt kê mọi giữ chỗ quá hạn, mọi ngày đến | **v1.0.4** |
| Câu báo khi folio đã khóa ghi đúng (không còn "chỉ quản lý ghi được…") (BUG-R3-045) | v1.0.4 hoặc v1.0.5 |
| Nhập nơi nhận hoàn trên máy chưa cấp quyền: câu báo đúng việc, nút khóa kèm giải thích (BUG-R3-048) | v1.0.4 hoặc v1.0.5 |
| Ô nhập Wi-Fi của cơ sở trên Desk | v1.0.4 hoặc v1.0.5 |
| Hộp Đổi phòng chỉ liệt kê căn đã dọn hoặc đã kiểm | v1.0.4 hoặc v1.0.5 |
| Giữ ảnh giấy tờ của khách đồng ý lưu tới 3 tháng (v1.0: 30 ngày) | Bản vá sau v1.0.3, chưa xếp bản – cần đội bảo mật duyệt |
| Xem danh sách giá đã lên lịch và hủy một giá đã lên lịch | v1.0.2 |
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

**Ba việc phải làm hằng ngày từ 02/11** (cập nhật 04/11: B1–B6 tới khi đội bảo mật báo bỏ sau v1.0.3; giữ chỗ quá hạn và check-in online tới v1.0.4) (đào tạo ở buổi C3a, có trong sổ tay mục 1.1, 2.4, 2.9 và Tờ 2a dán quầy). Hiện OTTIMO có một người trực giữ cả 6 vai (anh/chị quyết 29/10): "người trực" dưới đây là người đó; anh/chị xem lại mỗi sáng.

- **Thư báo bảo mật chưa tới ai (BUG-R3-032, mức P1).** Khi có thay đổi nhạy cảm (đổi tài khoản nhận chuyển khoản, dùng mã khôi phục, đặt lại đăng nhập 2 bước), Desk có tạo thư "Security notice" nhưng v1.0.0 chưa có ô email của người dùng, nên **thư không gửi tới ai** – kể cả `info@ottimo.vn` (hộp thư chung không dùng cho thư bảo mật). Thông báo trong Desk vẫn hiện. Các lớp chặn vẫn đủ: chỉ chủ đầu tư đổi được tài khoản nhận, phải xác thực lại, có hiệu lực từ hôm sau, mã VietQR báo "Tài khoản nhận vừa đổi". Anh/chị chấp nhận phát hành với lỗi này ngày 30/10 (ESC-040 A). Tới khi đội bảo mật báo bỏ (sau khi v1.0.3 lên, anh/chị nhận được thư và qua ít nhất 24 giờ; v1.0.3 chậm nhất 09/11), **mỗi sáng trước 09:00, kể cả ngày nghỉ**, làm 6 việc bù của đội bảo mật (B1–B6):
  - B1 – chủ đầu tư mở **Tài khoản nhận chuyển khoản**: đúng một dòng đang dùng, tên chủ tài khoản đúng, không có dòng đã lên lịch lạ;
  - B2 – chủ đầu tư xem **Cần chú ý** và **Nhật ký tiền** 24 giờ qua: có thay đổi tài khoản nhận, mã khôi phục, đặt lại 2 bước mà mình không làm thì gọi đội ngay, không đổi lại trên chính phiên đó;
  - B3 – ghi một dòng vào sổ giao ca "Đã kiểm TK nhận + nhật ký – <giờ>", không ghi số tài khoản;
  - B4 – chủ đầu tư hoặc quản lý đối soát tiền chuyển khoản trên app ngân hàng với các khoản VietQR trên Desk của hôm trước;
  - B5 – mọi ca: mã VietQR có dòng "Tài khoản nhận vừa đổi" thì chưa cho khách chuyển, gọi chủ đầu tư xác nhận trước;
  - B6 – kênh dự phòng là điện thoại; không chia sẻ mật khẩu; mã khôi phục chỉ trên giấy.

  Quá 09/11 chưa sửa thì đội bảo mật báo lại anh/chị. Cách làm: Sổ tay mục 1.1.
- **Giữ chỗ quá hạn – Desk không báo, và sau hạn chỉ còn nút Hủy** (BUG-R3-041 P2, WA-04, BUG-R3-042 P1, BUG-R3-043 P2, BUG-R3-044 P2). Không sai tiền, không đặt trùng, nhưng căn có thể bị giữ im lặng và khách cọc thiếu không nhận phòng được trên đơn gốc. Cụ thể ở `v1.0.0`:
  - Giữ chỗ **đã có cọc** (đủ hoặc thiếu) mà tới hạn thì Desk giữ lại đơn, đúng quy tắc, nhưng không báo vào hộp thư hay **Cần chú ý**. Giữ chỗ **có yêu cầu giảm giá/FOC** thì không tự hủy, kể cả khi chưa cọc.
  - **Sau hạn**, Desk không cho **Xác nhận đã nhận cọc** (báo "Giữ chỗ đã hết hạn…"), không cho **Gia hạn giữ chỗ**, và **chưa có ô "Chấp nhận cọc thiếu"** ở bất kỳ lúc nào. Chỉ còn **Hủy giữ chỗ**.
  - Desk ghi sai với giữ chỗ có cọc (BUG-R3-044): khung đơn ghi "**đơn đã tự hủy**" và câu lỗi ghi "**căn đã mở bán lại**" trong khi đơn vẫn **Giữ chỗ · chờ cọc** và căn vẫn bị giữ; hộp hủy ghi "**Không thu phí (giữ chỗ chưa cọc)**" và không hiện số hoàn. **Đừng tin dòng "Không thu phí" này:** Desk vẫn tạo yêu cầu hoàn đủ số đã nhận, xem ở **Cần duyệt** và **Nhật ký tiền → Hoàn tiền**.

  Cách tạm (chuyên gia nghiệp vụ chốt 30/10):
  - **Phòng trước:** khách chuyển thiếu thì xin phần còn lại ngay trong ngày; cần thêm giờ thì **Gia hạn giữ chỗ (1 lần)** trước hạn; tiền về thì bấm xác nhận **trước giờ hạn**.
  - **Rà 3 mốc mỗi ngày** (mở quầy, muộn nhất 09:00 · 11:00 · trước khi rời quầy, muộn nhất 21:00): **Đơn đặt phòng** → lọc **Đang hiệu lực** → mở từng dòng **Giữ chỗ · chờ cọc**. Trên màn, đơn quá hạn hiện "còn 0 giờ 00 phút" màu đỏ.
  - **Lý do hủy:** chọn **Không liên lạc được** hoặc **Khách đổi ý**, không chọn **Khác (ghi rõ)** (Desk khóa nút hủy, xem dòng BUG-R3-046 bên dưới). Lý do thật ghi sổ giao ca.
  - **Chưa cọc mà quá hạn:** hủy ngay, báo khách; khách còn muốn thì tạo giữ chỗ mới 12 giờ, chỉ một lần.
  - **Có cọc mà quá hạn:** khách không đi → hủy, Desk tạo yêu cầu hoàn đủ; người trực nhập nơi nhận hoàn, **anh/chị duyệt và chi**. Khách vẫn đi → **để nguyên đơn** (căn vẫn giữ), ghi sổ giao ca. Khi khách đến: hủy đơn cũ → đặt đơn mới cùng căn, cùng giá, cùng kênh và CTV, **thu đủ cọc ngay lúc đặt** (Desk không lưu đơn thiếu cọc) → nhận phòng, thu phần còn lại → **anh/chị duyệt và hoàn phần cọc cũ** (tiền mặt tại quầy hoặc chuyển khoản lại trong 24 giờ). Khách phải nhận lại tiền rồi trả lại, nên chỉ dùng tới khi v1.0.4 có BUG-R3-042 và 043.
  - **Người trực không tự duyệt, không tự chi khoản hoàn do mình tạo** khi hủy đơn, kể cả có quyền quản lý: đây là quy tắc tách nhiệm đã chốt; phần duyệt không có ngoại lệ, kể cả quản lý hay chủ đầu tư. Hiện một người trực giữ 6 vai, nên **mọi khoản hoàn sinh ra khi người trực hủy đơn đều chờ anh/chị duyệt và chi**. Anh/chị vắng thì khách chưa nhận lại cọc tại quầy được: người trực nói thật với khách và hẹn chuyển khoản lại trong 24 giờ (anh/chị làm trong lượt kiểm sáng), hoặc nhận tiền mặt khi anh/chị đã hẹn giờ tới quầy. Cọc cũ khách chuyển khoản mà chưa đối soát thì Desk chưa cho chi: anh/chị đối soát ở **Nhật ký tiền → Chờ đối soát** trước. Muốn người trực tự hoàn tại quầy là đổi quy tắc tách nhiệm, cần đội bảo mật xem và anh/chị quyết; không có trong v1.0.3 và v1.0.4.
  - Anh/chị xem lại các dòng "giữ chỗ" trong sổ giao ca và các yêu cầu hoàn mới trong lượt kiểm sáng B1–B6.

  Bỏ cách tạm khi v1.0.4 có đủ BUG-R3-041, WA-04, 042, 043 và đội đã thử lại cả ba lối ra (xác nhận cọc, chấp nhận cọc thiếu, hủy hoàn) trước và sau hạn. Cách làm đầy đủ: Sổ tay mục 2.4.
- **Check-in online tạm dừng với khách thật** (PO quyết 30/10 trong phạm vi bản, không đổi chính sách; **đội bảo mật đã đồng ý 30/10**). Trang khách v1.0.0 còn thông báo xử lý dữ liệu bản 1, chưa nêu hạn lưu thông tin giấy tờ điền sẵn. Bản 2 cần sửa mã; không kịp v1.0.3 nên dời **v1.0.4**. Từ 02/11 tới khi bản có thông báo bản 2 lên production và đội báo "mở lại": lễ tân **không tạo, không gửi link check-in online** cho khách thật; mọi khách làm giấy tờ tại quầy. **Trước khi nhận giấy tờ**, lễ tân chỉ khách tờ **Your ID details** đặt trên quầy (hạn lưu, sao lưu, cách hỏi về dữ liệu); tới bước đối chiếu thì hỏi đồng ý lưu ảnh, đọc đúng số ngày Desk hiện. Lỡ gửi link: **Thu hồi link** ngay, ghi mã đơn vào sổ giao ca (không ghi tên khách), báo anh/chị; đội đếm số link mới mỗi sáng để phát hiện. Trong thời gian này khách cũng không dùng trang khách để gửi yêu cầu trong lúc ở: khách nhắn Zalo hoặc gọi lễ tân như hiện nay. Đơn chuyển đổi ngày D cũng không gửi link. Tập trên staging thì vẫn tập mục 2.9 với dữ liệu giả. Mở lại khi: v1.0.4 (hoặc bản sau) có thông báo bản 2 ở mọi ngôn ngữ trang khách (gồm tiếng Nga), cùng chữ với tờ ở quầy, và đội bảo mật kiểm xong.

**Cách làm khác so với sau này**
- **Trả phòng sớm**: Desk chưa có nút trả phòng trước ngày đi (có ở v1.0.2 – cách dưới đây chỉ dùng tới khi v1.0.2 lên). Lễ tân ghi sổ giao ca và báo quản lý; quản lý điều chỉnh tiền phòng các đêm chưa ở theo quy tắc trả phòng sớm. Không hứa số hoàn với khách. Cách làm: Sổ tay mục 2.14a.
- **Wi-Fi**: Desk chưa có chỗ nhập Wi-Fi (v1.0.4 hoặc v1.0.5), trang khách ghi "hỏi lễ tân". Khách xem thẻ Wi-Fi trong căn; lễ tân đọc tên mạng và mật khẩu khi khách hỏi.
- **Đổi phòng khi khách đang ở**: hộp **Đổi phòng** còn có thể liệt kê căn chưa dọn. Xem **Buồng phòng** hoặc **Sơ đồ phòng** trước khi chọn; chọn nhầm căn chưa dọn thì Desk báo và không lưu gì.
- **Form "Yêu cầu đặt phòng" trên ottimo.vn tắt** tới khi anh/chị quyết ESC-030 (bật khi luật sư chưa trả lời, hay chờ luật sư). Trong lúc này khách liên hệ qua Zalo hoặc điện thoại. Khi được quyết, chủ đầu tư bật trên Desk trong 1 phút, không cần cài lại.
- **Đơn OTA nhập tay.** Có đơn OTA mới thì lễ tân nhập vào Desk ngay và đóng phòng trên extranet của kênh khác. Desk chặn trùng trong app, nhưng chưa tự đóng phòng trên kênh.
- **Quản lý chưa xác nhận được ngay trên màn của lễ tân, tại quầy hay từ xa.** Vì quản lý và chủ đầu tư đều có đăng nhập 2 bước, Desk từ chối mọi ô "mật khẩu của quản lý" trên phiên của lễ tân. Cách làm ở v1.0:
  - Miễn/giảm vượt hạn mức, xóa công nợ, hoàn tiền: lễ tân gửi yêu cầu, quản lý hoặc chủ đầu tư duyệt ở **"Cần duyệt"** bằng tài khoản của chính mình (máy quầy sau khi lễ tân đăng xuất, hoặc thiết bị riêng).
  - **Phụ thu trả muộn bằng giá 1 đêm** (khách rời sau 18:00 mà đêm đó căn đã có khách đến): đã vá trong `rc.3` (ESC-031) – lễ tân gọi quản lý báo trước, rồi **"Ghi phụ thu – quản lý xem lại"**, quản lý xem lại trong 24 giờ. Giới hạn của v1.0: quản lý nghe máy và muốn miễn ngay thì **khách vẫn trả đủ tại quầy, rồi OTTIMO hoàn** sau khi quản lý sửa dòng (không miễn tại quầy được). Vẫn nên phòng trước: chốt giờ đi từ 12:00 với khách đi hôm nay nếu căn có khách đến tối nay; khách ở quá 18:00 thì ưu tiên đổi căn cho khách sắp đến để Desk tính thêm 1 đêm như thường. Cách làm: Sổ tay mục 1.9, 2.15; `staff-one-pager.md`.
  - Không đọc mật khẩu qua điện thoại, không đưa mật khẩu cho lễ tân gõ hộ.
- **Chủ đầu tư và quản lý chưa đăng nhập app nhân viên** (`staff.ottimo.vn`) vì tài khoản có đăng nhập 2 bước; app báo "Đăng nhập 2 bước sẽ có ở bản sau". Kiểm phòng do lễ tân trưởng làm trên app.
- **Minibar khi trả phòng:** app nhân viên chưa có màn đếm minibar. Buồng phòng đếm tủ, báo lễ tân số còn lại từng món (gọi hoặc nói trực tiếp; tin nhắn nội bộ không ghi tên khách); lễ tân nhập ở bước Minibar.
- **Giá đã lên lịch:** Desk chưa hiện danh sách giá đã lên lịch cho ngày sau và chưa có nút hủy (có ở v1.0.2). Mỗi lần lên lịch giá cho ngày sau, ghi căn, giá, ngày hiệu lực vào sổ. Muốn bỏ một giá đã lên lịch: nhập lại giá hiện hành với đúng ngày hiệu lực đó. Ở buổi B2, anh/chị nhập giá có hiệu lực ngay hôm đó.
- **Hạn lưu ảnh giấy tờ của khách đồng ý lưu:** v1.0 tự xóa **30 ngày** sau trả phòng (giới hạn hiện tại của tham số). Mức 3 tháng anh/chị chọn 26/10 áp ở bản vá sau khi đội bảo mật duyệt. Lễ tân đọc số ngày trên câu hỏi đồng ý của Desk khi nói với khách. Tờ **Your ID details** ở quầy ghi câu chung: xóa trong vòng 3 tháng sau khi trả phòng, trừ phần pháp luật yêu cầu lưu lâu hơn; bản sao trong dữ liệu sao lưu đã mã hóa xóa trong 35 ngày sau đó (`staff-one-pager.md` Tờ 4, khớp trang chính sách trên ottimo.vn).
- **Kế toán chưa có tài khoản riêng trên Desk.** Việc đối chiếu do anh/chị hoặc quản lý làm trên Desk, kế toán ngồi cùng hoặc nhận số liệu. Cách cấp quyền cho kế toán chờ anh/chị quyết **ESC-038**.
- **Nhật ký xem giấy tờ:** mỗi lần xem số giấy tờ đầy đủ đều được ghi, nhưng Desk v1.0 chưa có màn để anh/chị tự xem nhật ký này; cần tra thì báo đội qua `/feedback`.
- **Giờ nhận phòng 12:00 trên các kênh ngoài Desk** anh/chị tự đổi trước ngày chạy: extranet Booking.com, Agoda, Airbnb (giờ nhận phòng và nội quy), Google Maps, fanpage, thẻ trong căn. Kênh OTA chưa đổi thì chưa thu được phụ thu nhận sớm của khách đặt qua kênh đó. Tin nhắn xác nhận và tin nhắc trước ngày đến ở v1.0 vẫn gửi tay: dùng câu chuẩn ở trên, không viết "phòng sẵn sàng từ 12:00".
- **Mã cửa** vẫn tạo trên app khóa như hiện nay, ngoài Desk. Chỉ đọc cho khách tại quầy hoặc lễ tân tự gọi ra số điện thoại trên đơn; không gửi bằng tin nhắn, email hay ảnh.
- **Tài khoản nhận chuyển khoản** mới nhập chỉ có hiệu lực **từ ngày hôm sau**. Đây là cách chống tráo tài khoản, không phải lỗi.
- **Khách dài hạn** dùng "Đơn dài hạn nhập tay" để giữ căn trên sơ đồ. Tiền thuê, ký quỹ, lịch kỳ thu, điện nước chưa có trong app: thu và ghi theo sổ hiện nay (Sổ tay mục 2.7). Khoản phát sinh trong lúc ở (giặt, dọn lẻ) ghi bằng **Thêm phát sinh** như đơn ngắn ngày.
- **Hóa đơn GTGT** vẫn xuất ngoài app. Desk ghi thông tin công ty để xuất.
- **Mất mạng:** chưa có bảng dự phòng in sẵn. Ba ngày đầu giữ sổ giấy song song (hướng dẫn `product/docs/day-one-guide.md`).
- **Yêu cầu của khách về dữ liệu cá nhân** (xem, sửa, xóa): khách hỏi lễ tân (tờ ở quầy ghi vậy); lễ tân ghi lại, chuyển anh/chị; anh/chị xử lý bằng tay.
- **Hủy đơn với lý do "Khác (ghi rõ)" chưa làm được** (BUG-R3-046, P2, sửa ở v1.0.4 hoặc v1.0.5). Ở hộp **Hủy giữ chỗ** và **Hủy đơn**, chọn **Khác (ghi rõ)** thì hộp báo "Chưa tính được phí hủy nên chưa hủy được" và khóa nút, kể cả khi đã gõ ghi chú và bấm **Thử lại**. Không sai tiền (không hủy được thì không ghi gì). Cách làm: chọn lý do có sẵn gần nhất, thường là **Không liên lạc được** hoặc **Khách đổi ý**; điều cần giải thích ghi vào sổ giao ca kèm mã đơn. Sổ tay mục 2.4, 2.8.
- **Folio đã khóa sau 24 giờ** (BUG-R3-045, P3): câu báo trên Desk ghi "Chỉ quản lý ghi được bút toán điều chỉnh" nhưng thực tế không ai ghi được, kể cả quản lý; nút **Thêm phát sinh** còn hiện tới khoảng 1 giờ sau khi khóa. Khoản còn nợ: **Thu công nợ** hoặc **Xóa công nợ**. Phát hiện mới sau 24 giờ: ghi sổ giao ca, báo anh/chị. Sổ tay mục 1.11.
- **Email:** đường gửi thư đã thử ở buổi B2 (thư thử tới hộp thư của chủ đầu tư, không vào Spam). **Thư báo bảo mật chưa tới ai** (BUG-R3-032, sửa ở v1.0.3): xem đầu mục này. Hộp `info@ottimo.vn` là hộp thư chung, không dùng để nhận thư bảo mật.

**Lỗi nhỏ còn mở (mức P3, không sai tiền, không chặn việc)** – sửa ở bản vá hằng tuần. PO chốt phạm vi v1.0.3 ngày 03/11: v1.0.3 chỉ có thư báo bảo mật. Dòng ghi "v1.0.4–v1.0.5" đi v1.0.4 nếu kịp mà không làm trễ nhóm giữ chỗ quá hạn, không thì v1.0.5
- Desk, hộp "Giữ chỗ": số cọc và nội dung chuyển khoản hiện hai lần; khi khách đến hôm nay vẫn hiện ô chọn thời hạn giữ dù không giữ được (v1.0.4–v1.0.5).
- Desk, bước "Phụ phí" khi trả phòng: các nút nhanh (giặt ủi, F&B, hút thuốc, mất thẻ) mở hộp nhưng chưa chọn sẵn khoản – lễ tân chọn tay (v1.0.4–v1.0.5).
- Desk, khung đơn đang ở: dòng "Còn phải thu" hiện hai lần, cùng một số (v1.0.4–v1.0.5).
- Desk, sau khi chi hoàn: thông báo có dấu trừ thừa, ví dụ "Đã ghi hoàn -500.000 đ" (v1.0.4–v1.0.5). Số tiền ghi sổ đúng.
- Desk, "Cần chú ý": dòng giữ chỗ sắp hết hạn chưa ghi mã đơn (v1.0.4–v1.0.5).
- Desk, **Nhật ký tiền → Hoàn tiền**: trên máy **chưa** cấp quyền, nút **Nhập nơi nhận hoàn** vẫn hiện; bấm **Lưu** thì Desk không lưu (đúng) nhưng báo sai lý do "Máy này chưa được cấp quyền xem giấy tờ và mã cửa…" (BUG-R3-048, v1.0.4–v1.0.5). Nhập nơi nhận hoàn trên máy quầy đã cấp quyền. Sổ tay mục 0.5.
- Desk, khung đơn **giữ chỗ**: hiện nút **Tạo link check-in online** và **Thu hồi link**, nhưng Desk chỉ cấp link cho đơn đã xác nhận nên luôn từ chối (BUG-R3-047, v1.0.4–v1.0.5). Không bấm; check-in online đang tạm dừng (xem đầu mục).
- Desk, nhận phòng: chip "Cần nhập thông tin" đè nút "Xem đủ số / ảnh" trên màn 1366 px (v1.0.4–v1.0.5).
- Desk, đặt phòng mới: sau "Tạo nhanh khách", ô "Khách đứng tên" đôi khi vẫn đỏ tới lần bấm sau (v1.0.4–v1.0.5).
- App buồng phòng: việc "Bổ sung minibar" còn nằm dưới "Khách đang ở" sau khi khách đã trả phòng (v1.0.4–v1.0.5).
- Trang khách: câu "Ngôn ngữ theo trình duyệt của bạn" hiện cả khi ngôn ngữ lấy theo hồ sơ khách (v1.0.4–v1.0.5).
- Desk, một số chữ chưa gọn: mã lý do thô trong Nhật ký tiền, tiêu đề hộp mật khẩu khi xem số tài khoản, câu "phí phạt" hiện cả với giặt ủi, nhãn ô người đi cùng, phím Esc không đóng khung đơn, báo giá thứ Sáu 1 đêm chỉ báo "tối thiểu 2 đêm" sau khi mở hộp, tìm đơn chưa tìm theo tên khách (v1.0.5).
- Desk, nơi nhận hoàn tiền: phải gõ mã ngân hàng 6 số, chưa có danh sách chọn ngân hàng (v1.1).
- Kiểm tra trình đọc màn hình (VoiceOver) cho hộp xác nhận chưa xong (v1.1).
- Thêm từ lượt kiểm sổ tay và rc.4–rc.6 (bản vá v1.0.x, cách làm tạm ở Sổ tay mục 5.6): màn **Trả phòng** mở được trước ngày đi rồi báo lỗi khi hoàn tất; hộp **Xác nhận cọc** chưa có ô mã giao dịch (ghi sổ giao ca); app nhân viên thiếu loại sự cố "Tắc thoát nước", "Wi-Fi"; trang khách mất lựa chọn "Bổ sung tại quầy" khi mở lại link; vài chữ còn lộ "Round 3" hoặc nhãn chưa đúng; app nhân viên hiện hai câu trái nhau khi chủ đầu tư/quản lý đăng nhập; folio ở màn Trả phòng hiện số âm cho dòng miễn **Bị từ chối** (số đó không bị trừ); nút **Hoàn tác nhận phòng** bấm được nhưng bị từ chối khi folio đã có dòng mới; mục "tiền dư đơn đã đóng" còn hiện tới khi Desk đóng phiếu; phiếu ghi "Phụ thu trả muộn (00:15)" cho khoản phụ thu bằng 1 đêm; phí hủy, phí không đến ghi từ 00:00 tới 05:59 mang ngày lịch thay vì ngày kinh doanh (BUG-R3-024…031, 034–036).

**Ghi chú kỹ thuật (không ảnh hưởng bản thật)**
- Hai trường hợp công nợ chỉ xảy ra với dữ liệu ghi trước tháng 10/2026 (FZ-08, BUG-R2-210). Bản thật bắt đầu từ dữ liệu trống nên không gặp. Đội vẫn sửa ở v1.1.
- App buồng phòng chưa được nhân viên thật thử trên điện thoại thật. Tuần đầu đội theo dõi góp ý của buồng phòng qua `/feedback`.
- Bản ghi nhật ký của buổi cài đặt production (B2, 28/10) thiếu danh sách căn và kênh; dữ liệu căn, kênh trên Desk đúng. Nhật ký chỉ ghi thêm nên bản ghi cũ giữ nguyên; lỗi không lặp lại từ `v1.0.0` (BUG-R3-040).

### Cách báo lỗi
Gõ `/feedback <mô tả>`. Lỗi làm không đặt, nhận, trả phòng hay thu tiền được, hoặc sai tiền: ghi "P0" ở đầu, đội sửa trong ngày.
