# Hướng dẫn Lễ tân – OTTIMO Desk v1.0

- Dành cho: **lễ tân (FD)**, **lễ tân trưởng (FDL)**, người trực đêm
- Thiết bị: **máy quầy đã được cấp quyền**, địa chỉ `desk.ottimo.vn`. Lễ tân trưởng dùng thêm app nhân viên `staff.ottimo.vn` trên điện thoại để kiểm phòng.
- Áp dụng cho: **OTTIMO Desk v1.0** (bản `v1.0.0`), chạy thật từ **thứ Hai 02/11/2026**
- Lập: BA · 30/10/2026 · Bộ hướng dẫn theo bộ phận, bản 1.2 (tách từ Sổ tay sử dụng OTTIMO Desk v1.0, bản nội dung 1.5; sửa theo review DOM, SEC, UXD, QA ngày 30/10; thêm phòng Google Chat và xóa theo yêu cầu người gửi theo SEC, ESC-041, ESC-042)
- Tài liệu không chứa mật khẩu, mã 2 bước, mã khôi phục, số tài khoản, mã cửa hay số giấy tờ. Khi học, anh/chị cũng không ghi những thứ này lên giấy.
- **Tài liệu nội bộ OTTIMO – không chuyển tiếp cho người ngoài OTTIMO, không gửi vào nhóm chat, không chụp, không đăng lên mạng. Nghỉ việc hoặc hết hợp tác: xóa tệp trên máy và báo chủ đầu tư.** Bộ hướng dẫn chỉ do chủ đầu tư gửi, và không bao giờ có ô đăng nhập hay hỏi mật khẩu; tệp "hướng dẫn" nhận từ người khác thì không mở, báo chủ đầu tư.

<!-- Nguồn: product/docs/manual/user-manual-v1.0.md bản 1.5 (Desk v1.0.0 = 8b3aec8) mục 0.2–0.9, 2.1–2.22, 3.6, 5.1, 5.4–5.6, 5.8; staff-one-pager.md Tờ 1, 2a, 2b, 4; day-one-guide.md mục 10. Chữ nói với khách giữ nguyên văn đã duyệt (UXD-on-PO-v1.0.0-docs.md mục 1.1–1.2, SEC-on-PO-v1.0.0-docs.md mục B). Tệp này thay các tờ in 1, 2a, 2b cho lễ tân (INV 30/10: "ko cần in 5 tờ hướng dẫn"). Tờ 4 "Your ID details" vẫn là thông báo cho khách – xem mục 7.2. Bản 1.2: mục 13.1a–13.1b theo rounds/round-03/outputs/SEC/esc041-gchat-full-details.md mục L2.2, L2.4 (★4, ★7), N5; ARC gchat-booking-request-notify.md mục 8.1; SEC-on-us155-smoke-L.md (cách tìm nút WR8); chuỗi Desk webreq.erase*. -->

## Cách đọc tệp này

- Chữ **in đậm** là tên nút, tên màn hình, tên ô đúng như trên Desk. Bản vá hằng tuần có thể đổi vị trí nút hoặc vài chữ nhỏ; việc phải làm thì giữ nguyên.
- Ảnh màn hình có mã ở dưới ảnh (ví dụ C2-05). Khung nét đứt ghi **Chưa có ảnh** hoặc **Ảnh mới · chờ chụp** là ảnh đang chờ chụp: cứ làm theo chữ.
- Khung **Tạm ở v1.0** là việc Desk chưa làm được và cách làm thay. Khung **Lỗi đang sửa** là lỗi đội đã biết; làm theo cách tạm trong khung. Mọi cách tạm tới bản v1.0.1 gom ở **mục 17**.
- Con số (giờ, phần trăm, tiền) theo tham số ngày 27/10/2026. Khi số trên Desk khác số trong tệp: làm theo Desk. Không rõ vì sao khác, nhất là **số tiền**: vẫn làm theo Desk, nhưng **báo lễ tân trưởng ngay trong ca** kèm mã đơn (mục 19).
- **Hiện OTTIMO có một người trực quầy giữ cả 6 vai** (quản lý, lễ tân trưởng, lễ tân, buồng phòng, bảo trì, sale). Chỗ ghi "lễ tân trưởng", "quản lý" là chính người trực, làm bằng quyền của vai đó và luôn ghi lý do. "Báo quản lý" nghĩa là ghi sổ giao ca để chủ đầu tư xem lại sáng hôm sau. "Đầu ca" là lúc mở quầy, "cuối ca" là lúc đóng quầy (muộn nhất 21:00); sau đóng quầy người trực vẫn trực điện thoại và làm việc 22:00, 23:00 (mục 2).

---

## 1. Đăng nhập

### 1.1 Anh/chị đăng nhập ở đâu

| Việc | Địa chỉ | Thiết bị |
|---|---|---|
| Mọi việc ở quầy | `desk.ottimo.vn` (**OTTIMO Desk**) | **Máy quầy đã cấp quyền** |
| Kiểm phòng (chỉ lễ tân trưởng) | `staff.ottimo.vn` (**app nhân viên**) | Điện thoại (mục 1.8) |
| Nhắn khách, gửi mã VietQR | Desk mở trên **điện thoại của cơ sở** | Điện thoại của cơ sở, có tài khoản Zalo của OTTIMO |

- Chỉ vào bằng cách **gõ địa chỉ** hoặc **dấu trang** trên trình duyệt. Không bấm link đăng nhập gửi qua Zalo, email, tin nhắn.
- Dùng trình duyệt **Chrome** hoặc **Safari**.

### 1.2 Lần đầu đăng nhập

Chủ đầu tư tạo tài khoản và **đưa mật khẩu tạm tận tay**. Mật khẩu tạm không gửi qua chat.

**Tài khoản có vai quản lý (người trực hiện nay):** làm lần đăng nhập đầu trên **laptop hoặc máy tính riêng** (của mình, hoặc của chủ đầu tư sau khi chủ đầu tư đã đăng xuất), **không làm trên máy quầy**. Ngay sau bước 6, Desk mở bật 2 bước và hiện 10 mã khôi phục (mục 1.3). Quét mã QR bằng điện thoại của mình.

1. Mở trình duyệt trên máy quầy (tài khoản có vai quản lý: trên laptop riêng, như trên). Gõ `desk.ottimo.vn`.
2. Nhập **Tên đăng nhập** và **Mật khẩu** (mật khẩu tạm). Bấm **Đăng nhập**.
3. Desk mở màn **Đặt mật khẩu của bạn**. Nhập **Mật khẩu hiện tại** (mật khẩu tạm).
4. Nhập **Mật khẩu mới**.
5. Nhập **Nhập lại mật khẩu mới**.
6. Bấm **Lưu và vào ứng dụng**.
7. Desk mở màn **Hôm nay**.
8. Trình duyệt hỏi **Lưu mật khẩu?**: chọn **Không bao giờ**.

[ẢNH: C0-01-Đăng nhập Desk]
[ẢNH: C0-02-Đặt mật khẩu lần đầu]

Quy tắc mật khẩu: ít nhất 10 ký tự, không chứa tên hoặc số điện thoại của mình, không phải mật khẩu phổ biến. Desk báo "Mật khẩu quá dễ đoán. Chọn mật khẩu khác." thì chọn mật khẩu khác.

> **Trước ngày chạy 02/11:** trên Desk thật (`desk.ottimo.vn`) chỉ **đăng nhập, đổi mật khẩu tạm, đăng xuất**. Không tạo đơn, không thu tiền thử: dữ liệu tiền trên Desk thật chỉ ghi thêm, không xóa được. Tập thao tác trên **Desk tập** bằng **tài khoản tập** (mục 20).

### 1.3 Tài khoản có thêm vai quản lý (người trực hiện nay)

Tài khoản có vai **Quản lý** phải **đăng nhập 2 bước**. Người trực hiện nay giữ cả vai quản lý, nên làm thêm phần này. Lễ tân, lễ tân trưởng không có vai quản lý thì bỏ qua mục này.

**Bật lần đầu** (Desk tự mở màn **Bật xác thực 2 bước** ngay sau khi đổi mật khẩu tạm). **Làm việc này trên máy hoặc điện thoại riêng, không làm trên máy quầy.**
1. Cài ứng dụng xác thực trên điện thoại (Google Authenticator, Microsoft Authenticator hoặc tương tự). Bấm **Tôi đã cài – Tiếp tục**.
2. Nhập mật khẩu đăng nhập. Bấm **Tạo mã QR**.
3. Trong ứng dụng xác thực: **Thêm tài khoản → Quét mã QR**, quét mã trên màn hình.
4. Nhập mã 6 số ứng dụng đang hiện. Bấm **Xác nhận**.
5. Desk hiện **10 mã khôi phục** một lần duy nhất. Bấm **In** (lấy giấy ngay khỏi máy in) hoặc **Tải về (.txt)** rồi chép vào trình quản lý mật khẩu, **xóa tệp và dọn thùng rác**. **Không in, không tải trên máy quầy.** Cất 2 nơi tách khỏi điện thoại. Không chụp ảnh, không gửi qua chat.
6. Tích ô **Tôi đã cất 10 mã này ở nơi an toàn, tách khỏi điện thoại**. Bấm **Hoàn tất**.

[ẢNH: C0-03-Bật xác thực 2 bước, mã QR]
[ẢNH: C0-04-Mười mã khôi phục]

Các lần sau: sau mật khẩu, Desk mở **Nhập mã xác thực**. Mở ứng dụng, nhập mã 6 số đang hiện, bấm **Xác nhận**.

[ẢNH: C0-05-Nhập mã xác thực]

Tài khoản có vai quản lý **chưa đăng nhập được app nhân viên** ở v1.0 (mục 1.8).

### 1.4 Đăng nhập hằng ngày

1. Mở trình duyệt trên máy quầy, vào `desk.ottimo.vn`.
2. Nhập **Tên đăng nhập**, **Mật khẩu**. Bấm **Đăng nhập**.
3. Tài khoản có vai quản lý: nhập mã 6 số (mục 1.3).
4. Desk mở **Hôm nay**.
5. Nhìn góc trái màn hình: phải thấy **Máy quầy đã cấp quyền** (mục 1.5).

Gõ sai nhiều lần (5 lần liền): Desk báo "Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại." (thường 15 phút) và nút **Đăng nhập** mờ. Chờ đúng số phút. Vẫn không vào được: báo chủ đầu tư.

[ẢNH: G2-01-Desk báo thử quá nhiều lần]

### 1.5 Máy quầy được cấp quyền

- Giấy tờ khách, ảnh giấy tờ, **Nhận phòng** và **Nhập nơi nhận hoàn** chỉ làm được trên **máy đã được chủ đầu tư cấp quyền**.
- Góc trái màn hình Desk hiện **Máy quầy đã cấp quyền** hoặc **Máy chưa cấp quyền giấy tờ**.
- Trên máy chưa cấp quyền, mục menu **Giấy tờ & khai báo** và bước giấy tờ khi nhận phòng đều bị ẩn; Desk báo "Máy này chưa được cấp quyền". Gặp vậy: chuyển sang máy quầy đã cấp quyền, hoặc nhờ chủ đầu tư cấp.
- Điện thoại cá nhân **không bao giờ** được cấp quyền.
- Máy quầy đã cấp quyền **không cài, không mở Zalo, Zalo Web hay ứng dụng chat** nào, và không dùng để nhắn khách (mục 4.1).

> **Lỗi nhỏ đang sửa (v1.0.1):** trên máy chưa cấp quyền, nút **Nhập nơi nhận hoàn** vẫn hiện, nhưng bấm **Lưu** thì Desk không lưu và báo "Máy này chưa được cấp quyền xem giấy tờ và mã cửa…". Gặp câu này: chuyển sang máy quầy đã cấp quyền, làm lại.

[ẢNH: C0-08-Chip máy quầy đã cấp quyền]
[ẢNH: C0-11-Chip máy chưa cấp quyền]

### 1.6 Đăng xuất

1. Bấm **tên của mình** ở góc trên bên phải.
2. Bấm **Đăng xuất**.

Đăng xuất **mỗi lần rời máy**, kể cả rời một lát. Trước khi người khác dùng máy quầy, anh/chị phải đăng xuất.

Menu dưới tên của mình gồm: **Đổi mật khẩu** · **Xác thực 2 bước** · **Ngôn ngữ giao diện** · **Giao diện** (Theo máy / Sáng / Tối) · **Đăng xuất**.

[ẢNH: C0-06-Menu Tài khoản]

Desk báo "Phiên đăng nhập đã hết. Đăng nhập lại – thông tin đang nhập vẫn được giữ trên máy này.": đăng nhập lại, làm tiếp.

**Đổi mật khẩu khi muốn:** **tên của mình → Đổi mật khẩu** → màn **Đổi mật khẩu** → **Mật khẩu hiện tại**, **Mật khẩu mới**, **Nhập lại mật khẩu mới** → **Lưu và vào ứng dụng** (đổi ý thì **Quay lại**). Nghi người khác biết mật khẩu: đổi ngay và báo chủ đầu tư.

[ẢNH: G2-02-Màn Đổi mật khẩu]

### 1.7 Quên mật khẩu, bị khóa, mất điện thoại

| Tình huống | Làm gì |
|---|---|
| Quên mật khẩu | **Báo chủ đầu tư.** Desk không có nút "quên mật khẩu". Chủ đầu tư **Đặt lại mật khẩu**, đưa mật khẩu tạm tận tay. Lần đăng nhập tới làm lại như mục 1.2 |
| Desk báo "Tên đăng nhập hoặc mật khẩu không đúng. Quên mật khẩu? Nhờ chủ đầu tư đặt lại." | Gõ lại chậm, kiểm phím viết hoa. Vẫn sai: báo chủ đầu tư |
| Tài khoản bị khóa do sai nhiều lần | Chờ đúng số phút Desk báo, hoặc nhờ chủ đầu tư **Mở khóa**. Bị khóa mà mình **không** gõ sai: báo chủ đầu tư ngay (có thể có người dò mật khẩu) |
| Tài khoản có vai quản lý, mất điện thoại, còn mã khôi phục | Ở màn nhập mã, bấm **Mất điện thoại? Dùng mã khôi phục**, nhập một mã, bấm **Đăng nhập bằng mã khôi phục**. Desk mở **Đăng ký lại trên điện thoại mới**: làm lại như mục 1.3, trên laptop riêng. **Làm xong đăng ký lại ngay, không bỏ dở.** Rồi **báo chủ đầu tư** để **Đặt lại mật khẩu** (Desk đăng xuất trên mọi máy, kể cả máy bị mất) |
| Mất cả điện thoại lẫn mã khôi phục | **Báo chủ đầu tư.** Chủ đầu tư khóa tài khoản cũ và tạo cho anh/chị tài khoản mới (tên đăng nhập mới); đăng nhập lần đầu như mục 1.2 trên laptop riêng. Không xin mã của người khác, không dùng tài khoản người khác trong lúc chờ |
| Mất điện thoại có đăng nhập app nhân viên (lễ tân trưởng) | **Báo chủ đầu tư ngay** để khóa tài khoản và đặt lại mật khẩu |
| Mất **điện thoại của cơ sở** hoặc máy tính bảng có **app khóa cửa** | **Báo chủ đầu tư ngay** để đổi mật khẩu tài khoản app khóa và thu hồi quyền của máy đó |
| Nghi lộ mật khẩu, thấy tài khoản lạ đăng nhập | **Báo chủ đầu tư ngay** |

**Không ai** – chủ đầu tư, quản lý, đội kỹ thuật, ngân hàng hay OTA – hỏi mật khẩu, mã 6 số hay mã khôi phục của anh/chị. Ai hỏi thì không đưa và báo chủ đầu tư.

### 1.8 Lễ tân trưởng: đăng nhập app nhân viên để kiểm phòng

Chỉ cho tài khoản **Lễ tân trưởng không có vai quản lý**. Tài khoản có vai quản lý (như người trực hiện nay) bị app chặn: app báo "Nhập mã trong ứng dụng xác thực để hoàn tất đăng nhập. Đăng nhập 2 bước sẽ có ở bản sau. Nhờ chủ đầu tư hỗ trợ đăng nhập." và không có ô nhập mã. Khi đó không ai bấm kiểm phòng được: người trực tự đi kiểm căn rồi mới bấm **Làm xong** (mục 13.2a), và nhận khách vào căn **Đã dọn – chờ kiểm** (`VC`) như thường (mục 14.2).

1. Mở trình duyệt điện thoại, gõ `staff.ottimo.vn`. (Nên chọn "Thêm vào Màn hình chính" để mở nhanh lần sau.)
2. Nhập **Tên đăng nhập**, **Mật khẩu** (cùng tài khoản với Desk). Bấm **Đăng nhập**.
3. Trình duyệt hỏi lưu mật khẩu: chọn **Không bao giờ**.
4. Xong việc hoặc trả máy: **Tôi → Đăng xuất**.

[ẢNH: C0-09-Đăng nhập app nhân viên]
[ẢNH: C3-09-Tôi, đăng xuất]

Lần đầu, và sau mỗi lần chủ đầu tư **Đặt lại mật khẩu**: đổi mật khẩu tạm trên Desk trước (mục 1.2), rồi mới đăng nhập app nhân viên. App chưa có màn đổi mật khẩu tạm: còn mật khẩu tạm mà vào app thì mọi màn báo "Chưa tải được … Có thể do mạng yếu" (mục 17.6).

### 1.9 Luôn nhớ về tài khoản

- **Mỗi người một tài khoản.** Không dùng chung. Không đọc mật khẩu qua điện thoại. Không gõ mật khẩu cho người khác.
- **Không gõ mật khẩu quản lý vào màn của mình.** Cần quản lý duyệt tại quầy: anh/chị **đăng xuất**, quản lý đăng nhập tài khoản của họ, duyệt ở **Cần duyệt**, đăng xuất. Hoặc quản lý duyệt trên laptop riêng.
- Trình duyệt hỏi **Lưu mật khẩu?**: luôn **Không bao giờ**.
- Rời máy là đăng xuất.

---

## 2. Việc mỗi ngày

| Khi nào | Việc | Ở đâu |
|---|---|---|
| **07:00** | Bắt đầu trả lời tin, yêu cầu của khách. Desk chuyển căn có khách sang "cần dọn". Khi chủ đầu tư đã bật form website: Desk mở trên máy quầy và điện thoại người trực 07:00–22:00, xem **Yêu cầu từ website** (mục 13.1) | Điện thoại cơ sở, **Hôm nay** |
| Trước giờ mở quầy | Khách nhận phòng sớm đã hẹn (từ 06:00, có phụ thu): ra quầy đúng giờ hẹn, làm trên máy quầy | Mục 7.1 |
| Từ 08:00 | Nhắn khách đi hôm nay xác nhận giờ trả; ghi **Xác nhận giờ trả** | Mục 9.6 |
| **Mở quầy (muộn nhất 09:00)** | Đăng nhập, kiểm chip **Máy quầy đã cấp quyền**. Tờ **Your ID details** đúng chỗ, mặt quay ra khách | Mục 1.4, 7.2 |
| Mở quầy | Đọc **Cần chú ý** trước, xử lý từ dòng đỏ trở xuống. Xem **Khách đến (n)**, **Khách đi (n)**, **Giữ chỗ chưa cọc (n)**, **Yêu cầu của khách** | **Hôm nay** (mục 3.1) |
| Mở quầy | **Rà giữ chỗ – mốc 1** (tới v1.0.1) | Mục 17.1 |
| Mở quầy | Đọc sổ giao ca tối qua và dòng chủ đầu tư ghi trong lượt kiểm sáng. Đếm tiền mặt trong két. Khi có nhiều người: bàn giao với ca trước | Sổ giao ca |
| Mở quầy, 12:00, 18:00, đóng quầy | Kiểm extranet mọi kênh OTA; đơn mới thì nhập Desk ngay | Mục 5.3 |
| **Trước 11:00** | Căn trống từ đêm qua có khách đến hôm nay đã rà xong. Người trực hiện nay: tự kiểm rồi bấm **Làm xong** (mục 13.2a). Khi có lễ tân trưởng: kiểm trên app xong trước 12:00 (mục 14.2) | **Buồng phòng** |
| **11:00** | **Rà giữ chỗ – mốc 2** (trước trần 12:00 ngày đến) | Mục 17.1 |
| **12:00** | Giờ trả phòng. Nhận phòng từ 12:00 nếu căn `VC`/`VI`. Khách đi chưa trả mà căn có khách đến tối nay: chốt giờ đi | Mục 7, 11, 11.4 |
| Ngay khi khách trả | Căn có khách đến cùng ngày: dọn, kiểm, bấm **Làm xong** | Mục 13.2a |
| **14:00** | Mọi căn có khách đến hôm nay **chắc chắn sẵn sàng** | **Buồng phòng** |
| **18:00** | Khách chưa đến, chưa báo giờ: gọi hoặc nhắn khách | Mục 6.3 |
| **Đóng quầy (muộn nhất 21:00)** | Nhắn khách đi ngày mai xác nhận giờ trả (sau 21:00 không nhắn khách). **Rà giữ chỗ – mốc 3**, gồm cả giữ chỗ hết hạn trước 09:00 sáng mai (mục 17.1). **Cần chú ý** không còn dòng đỏ chưa xử lý (hoặc đã ghi sổ giao ca). Ghi sổ giao ca các phiếu thanh toán đã cấp (mục 11.7). Đối chiếu tiền mặt (mục 12.4) | Mục 17.1, 11.7, 12.4 |
| Sau đóng quầy | **Người trực vẫn trực** điện thoại cơ sở, bật chuông. Chỉ trả lời khách nhắn tới. Khách đến muộn gọi: ra quầy, làm trên máy quầy (mục 13.3) | Điện thoại cơ sở |
| **22:00** | Trên máy quầy: chép tay danh sách khách đến/đi ngày mai (mục 15). Ba ngày đầu (02, 03, 04/11): so sổ giấy với Desk, báo chủ đầu tư qua điện thoại. Từ 22:00 không xác nhận chuyển khoản qua điện thoại | Sổ giấy |
| **23:00** | Khách chưa đến, vẫn không liên lạc được: **Đánh dấu không đến** (đơn OTA kiểm extranet trước; khách đã báo đến muộn thì không đánh dấu). Hạn khai báo khách Việt Nam | Mục 6.3, 8.3 |
| Xong việc 23:00 | **Đăng xuất** máy quầy | Mục 1.6 |
| Mỗi lần thấy **Giữ chỗ sắp hết hạn** | Gọi khách ngay, xử lý trước hạn | Mục 4.5 |

Luôn nhớ trong ca:
- **Giấy tờ khách chỉ nằm trên Desk.** Không chụp, không gửi Zalo.
- **Mã cửa không gửi bằng chữ hay ảnh**: chỉ đọc tại quầy hoặc tự gọi ra số trên đơn, khi đơn đã đủ điều kiện (mục 7.5).
- **Nhận phòng từ 12:00, phòng luôn sẵn sàng lúc 14:00.** Không hứa "phòng sẵn sàng từ 12:00".
- **Chỉ bấm "đã nhận" khi chắc tiền đã về** (mục 10). Ảnh chụp hay SMS chuyển khoản của khách không phải bằng chứng. Mã VietQR hiện **"Tài khoản nhận vừa đổi"**: chưa cho khách chuyển, gọi chủ đầu tư trước.
- Đơn OTA mới: **nhập Desk ngay**, rồi đóng phòng trên extranet các kênh khác. Ba ngày đầu ghi thêm **sổ giấy**, đối chiếu 22:00.
- **Ngày trên Desk đổi lúc 06:00**, không phải 00:00. Từ 00:00 đến 05:59 vẫn là ngày hôm trước (mục 13.3).

---

## 3. Màn Hôm nay và Sơ đồ phòng

### 3.1 Hôm nay

| Khối | Nội dung | Nút |
|---|---|---|
| Số liệu | **Đang ở**, **Khách đến hôm nay**, **Khách đi hôm nay**, **Công suất đêm nay** | – |
| **Khách đến (n)** | Tên, căn, số đêm, giờ đến dự kiến, giấy tờ (**Chưa có giấy tờ**, **Đã làm thủ tục trước**…), **Còn phải thu** | **Nhận phòng**, **Mở đơn** |
| **Khách đi (n)** | Giờ trả, trạng thái liên lạc (**Chưa trả lời – gọi xác nhận**, **Đã trả lời**, **Quá giờ trả phòng**) | **Trả phòng**, **Xác nhận giờ trả** |
| **Giữ chỗ chưa cọc (n)** | Giữ chỗ **đến hôm nay** (gồm cả đơn đã nhận một phần cọc) và thời gian còn lại, ví dụ "còn 1 giờ 20 phút (hết hạn …)". Chỉ hiện khi có đơn | **Mở đơn** |
| **Cần chú ý** | Khai báo sắp hạn, đơn OTA chưa gán căn, công nợ, phiếu sửa… | **Mở**, **Đã xử lý** |
| **Yêu cầu của khách** | Yêu cầu gửi từ trang khách | **Đã nhận**, **Làm xong**, **Không thực hiện được** |

Dòng **Có khách đến cùng căn hôm nay** ở khách đi: ưu tiên chốt giờ trả với khách này.

[ẢNH: C2-01-Hôm nay]

> **Lỗi nhỏ đã biết (sửa ở v1.0.1):** trong **Cần chú ý**, dòng giữ chỗ sắp hết hạn chưa ghi mã đơn. Bấm vào dòng để mở đơn.

### 3.2 Sơ đồ phòng

1. **Vận hành → Sơ đồ phòng**. Lưới 10 căn × 14 ngày.
2. **Lùi 7 ngày** / **Tới 7 ngày** / **Hôm nay** để đổi khoảng ngày. **Kiểu xem**: **Lưới** hoặc **Danh sách**. Lọc **Nhóm căn**.
3. Mỗi thanh là một đơn: **Giữ chỗ · chờ cọc**, **Đã xác nhận**, **Đang ở**, **Đã trả phòng**, **Hợp đồng dài hạn** (nhãn **HĐ**, **Nhập tay**), **Khóa phòng**.
4. Bấm vào thanh để mở **khung đơn**. Bấm vào **ô trống** để đặt căn đó từ ngày đó.
5. Làn **Chưa gán căn – xung đột OTA** hiện đơn OTA về khi căn đã kín (mục 5.3).
6. Đơn đã hủy, không đến không hiện trên sơ đồ.

[ẢNH: C2-02-Sơ đồ phòng, chú giải]

### 3.3 Menu của lễ tân

[ẢNH: C0-07-Thanh menu Desk của lễ tân]

Lễ tân thấy: **Hôm nay**, **Sơ đồ phòng**, **Đơn đặt phòng**, **Giấy tờ & khai báo**, **Buồng phòng**, **Bảo trì**, **Khách hàng**, **Báo giá & giữ chỗ**, **Yêu cầu từ website**, **Nhật ký tiền** (chỉ khoản của mình), **Minibar** (xem), **Danh mục căn** (xem). Lễ tân trưởng có thêm **Cần duyệt**.

---

## 4. Báo giá, giữ chỗ và cọc VietQR

### 4.1 Nhắn khách từ đâu

- Chỉ từ **tài khoản Zalo/số điện thoại của OTTIMO trên điện thoại của cơ sở** (hoặc hộp thư OTA). Không nhắn khách từ Zalo cá nhân.
- **Máy quầy đã cấp quyền không cài và không mở Zalo/Zalo Web.** Mở Desk trên điện thoại cơ sở để **Sao chép gửi Zalo**.
- Tin có số tiền hoặc mã VietQR: chỉ gửi mã **Desk vừa tạo cho đúng đơn**, kèm câu:
  - "OTTIMO only messages you from this account and your OTA inbox, and never changes bank details by message."
  - "OTTIMO chỉ nhắn từ tài khoản này và hộp thư OTA, không bao giờ đổi số tài khoản qua tin nhắn."
- Không gửi ảnh QR cũ, không gõ số tài khoản bằng tay.
- Đơn của CTV: gửi mã cọc **thẳng cho khách** từ tài khoản OTTIMO (số điện thoại trên đơn). Không gửi mã cho CTV để chuyển tiếp.
- Sale nội bộ làm việc ngoài quầy gọi hoặc nhắn **chỉ mã đơn** nhờ gửi mã cọc: mở đơn trên Desk ở điện thoại cơ sở, gửi mã cho khách từ tài khoản OTTIMO kèm câu trên.

### 4.2 Báo giá

1. **Khách & bán → Báo giá & giữ chỗ**, tab **Căn trống**.
2. Nhập **Ngày đến**, **Số đêm**, **Người lớn (từ 12 tuổi)**, trẻ em.
3. Chọn căn trong danh sách căn trống. Desk mở **Báo giá**: số đêm thường, số đêm thứ Sáu/thứ Bảy, giảm theo số đêm, phụ thu người, **Tổng tiền đơn**, **Cọc để giữ phòng** (30 % tiền phòng).
4. Chọn **Khách đứng tên** ngay trong hộp này (tìm, hoặc **Tạo nhanh khách**).
5. Bấm **Lưu báo giá**.
6. Chọn **Ngôn ngữ gửi khách** (Tiếng Việt, English, Русский). Bấm **Sao chép gửi Zalo**. Dán vào tin nhắn riêng với khách.
7. Báo giá giữ giá **3 ngày**. Hết hạn thì **Lập báo giá mới**.

[ẢNH: C2-03-Báo giá, tab căn trống]
[ẢNH: C2-04-Hộp báo giá]

### 4.3 Giữ chỗ khi khách đồng ý

1. Trong báo giá, bấm **Khách đồng ý – Giữ chỗ**.
2. Hộp **Giữ chỗ**: chọn **Giữ trong** 12 h, 24 h hoặc 48 h (mặc định 24). Hạn giữ không vượt 12:00 ngày đến. Tới v1.0.1: chọn thời hạn để giờ hết hạn rơi vào **09:00–21:00**. Ví dụ tạo lúc 15:00: chọn **24 h** (hạn 15:00 hôm sau), không chọn 12 h (hạn 03:00 sáng).
3. Bấm **Tạo giữ chỗ**. Desk tạo đơn **Giữ chỗ · chờ cọc** và mã **VietQR** đúng số cọc, nội dung chuyển khoản là **mã đơn**.
4. Gửi mã QR cho khách theo mục 4.1 (**Sao chép số tiền**, **Sao chép nội dung** nếu khách tự gõ).
5. Mã có dòng **"Tài khoản nhận vừa đổi"**: chưa gửi, gọi chủ đầu tư xác nhận trước (mục 10.2).
6. Desk nhắc 2 giờ trước khi hết hạn.
7. Quá hạn chưa cọc: Desk tự hủy và mở bán lại căn.

[ẢNH: C2-05-Giữ chỗ và mã VietQR cọc]

> **Lỗi nhỏ đã biết (sửa ở v1.0.1):** hộp "Giữ chỗ" hiện số cọc và nội dung chuyển khoản hai lần; khách đến hôm nay vẫn hiện ô chọn thời hạn giữ dù không giữ được.

### 4.4 Xác nhận đã nhận cọc

1. **Chỉ xác nhận khi chắc tiền đã về tài khoản OTTIMO**, theo cách kiểm tiền ở mục 10.3. Ảnh chụp màn hình của khách không phải bằng chứng.
2. Mở đơn → **Xác nhận đã nhận cọc**.
3. Hộp **Xác nhận cọc · OTM-…**: kiểm **Số tiền đã nhận** và **Cách thanh toán** (VietQR, Chuyển khoản, Tiền mặt, Thẻ).
4. Bấm **Xác nhận đã nhận cọc**. Số nhận khác số cọc thì nút đổi thành **Ghi nhận …** và Desk báo khoản được ghi như chuyển khoản tay, chờ đối soát.
5. Đơn chuyển **Đã xác nhận**, căn bị chặn trên sơ đồ.

> **Lỗi đang sửa:** hộp **Xác nhận cọc** chưa có ô mã giao dịch. Ghi mã giao dịch ngân hàng (nếu có) vào sổ giao ca kèm mã đơn, để quản lý đối soát.

[ẢNH: C2-06-Xác nhận đã nhận cọc]

### 4.5 Lưu ý khi giữ chỗ

- **Xử lý trước hạn.** Trước hạn, Desk làm được cả ba việc: xác nhận cọc, gia hạn, hủy. Sau hạn, ở v1.0 chỉ còn hủy (mục 17.1). Tiền đã về thì bấm xác nhận **trước giờ hạn**: ghi tay sau hạn thì Desk từ chối, kể cả khi tiền về trước hạn.
- **Khách chuyển thiếu:** vẫn ghi được số đã nhận; đơn giữ **Giữ chỗ · chờ cọc** và hiện số còn thiếu. **Gọi hoặc nhắn khách ngay trong ngày** xin phần còn lại trước hạn. Ở v1.0 Desk **chưa có** "Chấp nhận cọc thiếu". Khách nói "trả phần còn lại khi đến": nói thật với khách và chọn (a) khách chuyển nốt trước hạn, hoặc (b) giữ đơn theo mục 17.1, báo khách khi nhận phòng sẽ thanh toán đủ và khoản đã chuyển được chủ đầu tư hoàn lại (tiền mặt tại quầy khi chủ đầu tư có mặt, hoặc chuyển khoản trong 24 giờ).
- Thấy **Giữ chỗ sắp hết hạn** (Desk nhắc 2 giờ trước hạn ở **Cần chú ý** và hộp thông báo): gọi khách ngay.
- Khách chuyển dư: ghi **Lý do thu vượt**; phần dư thành tiền thừa của khách.
- Mã VietQR hết hạn: bấm **Tạo mã VietQR mới** (mã cũ hết hiệu lực), hoặc ghi như chuyển khoản tay (**Chờ đối soát**).
- Gia hạn giữ chỗ: **Gia hạn giữ chỗ (1 lần)**, tối đa thêm 24 giờ, không quá 12:00 ngày đến. **Chỉ làm trước hạn**; sau hạn nút này không còn.
- Sale/CTV đã báo khách chuyển cọc: khung đơn hiện **CTV/sale đã báo chuyển cọc** kèm **Xem ảnh biên nhận**. Vẫn kiểm tiền về trước khi xác nhận.
- Khung đơn giữ chỗ hiện **Tạo link check-in online** và **Thu hồi link**: **không bấm** (mục 17.3).

---

## 5. Đặt phòng

### 5.1 Đặt phòng ngắn ngày (khách trực tiếp, CTV)

1. **Sơ đồ phòng** (bấm ô trống hoặc **Đặt phòng mới**) hoặc **Đơn đặt phòng → Đặt phòng mới**.
2. Chọn **Căn**, **Ngày đến – ngày đi**. Desk báo ngay dưới ô ngày căn **còn trống cả khoảng ngày** hay đã kín, và chặn khi lưu nếu kín. (Chữ phụ "chỉ hiện căn … còn trống" chưa đúng – đang sửa.)
3. **Số khách**: **Người lớn (từ 12 tuổi)**, **Trẻ 6–11 tuổi**, **Trẻ dưới 6 tuổi**.
4. **Kênh**: **Trực tiếp**, **CTV / môi giới**, **OTA** hoặc **Nội bộ**.
   - Trực tiếp: chọn **Nguồn**: **Zalo / điện thoại**, **Website**, **Khách vãng lai**, **Khách quay lại**, **Sale nội bộ** (chọn **Người chốt**).
   - CTV: chọn **CTV chốt đơn** (bắt buộc).
   - Nội bộ: phòng dùng nội bộ, không tính doanh thu, vẫn chiếm phòng.
5. **Khách đứng tên**: gõ tên, SĐT, email hoặc mã khách để tìm. Chưa có thì **Tạo nhanh khách "…"** → hộp **Hồ sơ khách mới**: Họ và tên, **Số điện thoại / Zalo** (cần ít nhất SĐT hoặc email), Quốc tịch, Ngôn ngữ giao tiếp.
6. Kênh Trực tiếp và CTV **bắt buộc có số điện thoại**. Ô **Số điện thoại / Zalo** trên form chỉ hiện khi hồ sơ khách chưa có số. **Email** không bắt buộc.
7. **Giờ đến dự kiến** (nếu khách báo).
8. **Giá mỗi đêm**: Desk điền theo lịch giá (**Nguồn giá** ghi rõ). Chỉ sửa khi đã chốt giá khác với khách, trong khoảng **sàn–trần**. **Luôn nhập giá trước giảm dài ngày.** Đơn từ 7 đêm Desk tự giảm 10 % (từ 14 đêm 15 %) trên số anh/chị nhập. Ví dụ đã báo khách căn 202, 7 đêm 9–16/11 là 5.205.000 đ: để nguyên giá lịch. Gõ giá đã giảm 713.000 thì Desk giảm tiếp còn 642.000 đ/đêm, đơn thiếu 519.000 đ.
9. Xem **Tổng tiền phòng**, **Cọc cần thu**.
10. Ô **Số tiền đã nhận** được điền sẵn bằng số cọc. **Chỉ để nguyên khi khách đã chuyển thật** (đã kiểm theo mục 10.3): chọn **Cách thanh toán**, ghi **Mã giao dịch / ghi chú**, bấm **Tạo đơn**. Desk chọn sẵn **Chuyển khoản VietQR** – đổi đúng cách khách đã trả trước khi bấm **Tạo đơn**.
11. Khách chưa chuyển: bấm **Giữ chỗ đến …** (chỉ có với kênh Trực tiếp/CTV và ngày đến từ ngày mai).

[ẢNH: C2-07-Đặt phòng mới, kênh Trực tiếp]

Desk chặn và giải thích khi:
- **Đặt trùng** căn và đêm đã có đơn. Desk gợi ý **Căn trống cùng nhóm**.
- Ngày đến thứ Sáu, thứ Bảy hoặc ngày đặc biệt mà chỉ ở 1 đêm: "Ngày này cần ở tối thiểu 2 đêm". Ngoại lệ đêm lẻ giữa hai đơn: Desk gợi ý **Dùng căn … (đêm lẻ)**.
- Vượt sức chứa căn.
- Từ **28 đêm** trở lên: Desk mở **… đêm là thuê dài hạn** → **Tạo đơn dài hạn nhập tay** (mục 5.4).
- Đặt khi mất mạng: Desk giữ **nháp** trên máy, tạo đơn khi có mạng.

> **Lỗi nhỏ đã biết (v1.0.1):** sau **Tạo nhanh khách**, ô **Khách đứng tên** đôi khi vẫn đỏ tới lần bấm sau. Bấm lại vào ô là hết.

### 5.2 Một khách đặt nhiều căn

> **Tạm ở v1.0:** chưa có đơn nhóm. Làm như sau:
> - Tạo **mỗi căn một đơn**, cùng khách đứng tên. Khi tạo đơn, ghi vào ô **Ghi chú nội bộ**: "Nhóm: OTM-…, OTM-…" (mã các đơn đã tạo trước).
> - **Cọc**: gửi khách mã VietQR của từng đơn. Khách chuyển **một lần** cho cả nhóm: xác nhận cọc ở **từng đơn, đúng số cọc của đơn đó**. Ghi vào sổ giao ca: "OTM-… + OTM-…: chuyển gộp 1 lần, số tiền …". **Không** ghi cả khoản vào một đơn.
> - CTV giữ chỗ tối đa 3 đơn, sale tối đa 5 đơn: nhóm lớn hơn thì lễ tân tạo.
> - Hủy một căn: hủy đơn đó theo chính sách hủy. Các đơn còn lại giữ nguyên.
> - Nhận phòng, khai báo lưu trú theo từng đơn, đủ người ở từng căn.

### 5.3 Đơn OTA nhập tay (Booking.com, Agoda, Airbnb…)

> **Tạm ở v1.0:** Desk chưa kết nối kênh OTA tự động (có ở v1.1). Có đơn OTA mới: **nhập Desk ngay**, rồi **đóng phòng trên extranet** (trang quản lý của kênh) **các kênh khác**. Desk chặn trùng trong Desk, nhưng chưa tự đóng phòng trên kênh.
> - Kiểm extranet mọi kênh **đầu ca, 12:00, 18:00 và cuối ca**.
> - Bật thông báo đơn mới của từng kênh về điện thoại của cơ sở.
> - Chỉ người chủ đầu tư giao mới được đóng/mở phòng trên extranet.

1. **Đặt phòng mới**, **Kênh** = **OTA**.
2. Chọn **Kênh OTA**, nhập **Mã đặt phòng OTA**.
3. **Thanh toán**: **OTA đã thu tiền phòng** hoặc **Khách trả tại OTTIMO**.
   - **OTA đã thu tiền phòng** (Airbnb, Agoda trả trước, Booking "Payments by Booking"): Desk tự ghi **Đã thu qua OTA**. **Không thu lại tiền phòng, không thu cọc.** Tại quầy chỉ thu phụ thu người vượt, nhận sớm/trả muộn, phát sinh.
   - **Khách trả tại OTTIMO**: thu đủ tiền phòng khi nhận phòng như đơn Trực tiếp.
   - Kênh trả bằng **thẻ thanh toán ảo**: chỉ chủ đầu tư/quản lý xem trên extranet và gõ thẳng vào máy POS. Không sao chép, không in, không chụp màn hình số thẻ. Không nhập số thẻ vào Desk.
4. Nhập giá từng đêm **theo extranet**. Giá ngoài sàn–trần vẫn lưu được, ghi lý do để quản lý xem lại.
5. Số khách theo kênh. Vượt sức chứa: Desk cho lưu kèm lý do, nhắc liên hệ khách.
6. Căn đã kín (kênh bán trùng): Desk báo **Căn … đã kín** và cho chọn căn trống cùng nhóm, hoặc **Lưu chưa gán căn** – đơn vào làn **Chưa gán căn**, quản lý nhận cảnh báo ngay.
7. Bấm **Tạo đơn**. Rồi đóng phòng trên các kênh khác.

[ẢNH: C2-08-Đặt phòng mới, kênh OTA]

**Khách OTA báo thêm người:**
- Có thông báo sửa đơn trên extranet: sửa số khách theo đơn mới, chọn **Khách đã sửa đơn trên …**, nhập **Mã sửa đơn trên extranet**. Không phụ thu.
- Khách tự báo với OTTIMO (Zalo, điện thoại, tại quầy): chọn **Khách báo trực tiếp với OTTIMO**. Giữ số khách đã đặt qua kênh, thu phụ thu người vượt tại quầy.
- Không có bằng chứng sửa đơn trên kênh thì coi là khách tự báo.

**Gán căn cho đơn chưa gán:** khung đơn → **Gán căn** → chọn trong **Căn trống phù hợp** (dòng **Phù hợp nhất** ít tạo đêm lẻ nhất) → **Gán vào căn …**. Căn nhóm cao hơn là **Nâng hạng** – cần lễ tân trưởng xác nhận. Chưa gán căn thì chưa nhận phòng được.

### 5.4 Đơn dài hạn nhập tay

1. **Sơ đồ phòng** hoặc **Đơn đặt phòng** → **Đơn dài hạn nhập tay**.
2. **Căn**, **Ngày vào**, **Ngày ra (theo HĐ)**. Desk hiện số tháng và số đêm. Dưới 28 đêm: Desk đề nghị tạo đơn ngắn ngày.
3. **Khách đứng tên**, **Số điện thoại / Zalo**, **Nguồn** (Zalo / điện thoại, Website, Khách vãng lai, Khách quay lại).
4. **Tiền thuê mỗi tháng (theo HĐ)**: gõ đúng số trên hợp đồng giấy.
5. **Ký quỹ đang giữ (ngoài app)**: chỉ để ghi nhớ, không tạo giao dịch.
6. **Số hợp đồng giấy**, **Ghi chú (gói dọn, chu kỳ thu…)**.
7. Bấm **Tạo đơn dài hạn**. Đơn mang cờ **HĐ ngoài hệ thống – sẽ chuyển vào app**, giữ căn trên sơ đồ như mọi đơn.

[ẢNH: C2-09-Đơn dài hạn nhập tay]

> **Tạm ở v1.0:** hợp đồng, lịch kỳ thu, nhắc thu, ký quỹ và **điện nước** chưa có trong Desk (có ở v1.3). Làm như hiện nay:
> - Hợp đồng và ký quỹ: giấy và sổ kế toán. **Không ghi ký quỹ vào Desk.**
> - **Lịch thu**: lễ tân trưởng giữ bảng kỳ thu (giấy hoặc bảng tính trên máy quầy; không ghi số giấy tờ): căn, khách, kỳ, số tiền, hạn. Nhắn khách 7 ngày trước hạn và đúng ngày hạn, trong khung 08:00–21:00.
> - **Khách trả trễ**: quá hạn 3 ngày báo quản lý. Quá hạn 10 ngày, quản lý xử lý theo hợp đồng. **Không** đổi mã cửa, **không** khóa cửa, **không** cắt điện nước, **không** mang đồ của khách ra để ép trả.
> - **Điện**: (chỉ số cuối − chỉ số đầu) × **đơn giá trên hợp đồng giấy**. Hợp đồng không ghi đơn giá: báo quản lý trước khi gửi khách. Đơn giá 5.000 đ/kWh chưa in vào hợp đồng mới tới khi kế toán/luật sư xác nhận.
> - **Nước**: 100.000 đ × số người × số ngày ở trong tháng ÷ số ngày của tháng, làm tròn 1.000 đ. Ngày vào tính, ngày trả không tính. Trẻ dưới 6 tuổi miễn (đang chờ chủ đầu tư xác nhận). Ví dụ 2 người vào 10/10, tháng 31 ngày: 100.000 × 2 × 22 ÷ 31 = **142.000 đ**.
> - Chỉ số công tơ: bảo trì chốt cuối tháng, đưa số cho lễ tân trưởng. Kỳ tháng 10/2026 chốt ngày 31/10 trong sổ cũ.
> - **Tiền thuê kỳ sau ngày chạy**: khung đơn đang ở **chưa có nút ghi thu giữa kỳ**. Thu và ghi sổ kế toán như hiện nay, ghi chú "Kỳ tháng mm/yyyy"; không ghi vào Desk.
> - Phụ thu người thêm của khách dài hạn: theo hợp đồng giấy; Desk không tự tính ở đơn này.
> - Khoản phát sinh trong lúc ở (giặt, dọn lẻ…): **Thêm phát sinh** như đơn ngắn ngày; thu ở bước 3 trả phòng hoặc **Thu công nợ**.

---

## 6. Sửa, đổi, hủy đơn trước ngày đến

Mở đơn (từ **Sơ đồ phòng**, **Đơn đặt phòng** hoặc **Hôm nay → Mở đơn**). Khung đơn có thanh **Tiến trình đơn**: **Đặt → Giữ chỗ → Đã cọc → Nhận phòng → Trả phòng**, và các nút theo trạng thái.

[ẢNH: C2-10-Khung đơn và các nút]

### 6.1 Đổi căn / đổi ngày

1. **Đổi căn / đổi ngày** → chọn căn mới, **Ngày đến**, **Ngày đi**.
2. **Lý do đổi** chia 3 nhóm: **Khách xin đổi – tính giá căn mới** · **OTTIMO đổi – giữ giá đã đặt** · **Khác – giữ giá đã đặt**.
3. Desk **Tính thử trước khi lưu**: giá cũ, giá mới từng đêm, **Khách trả thêm** / **Khách được giảm** / **Không đổi tiền**.
4. Báo khách số mới. Tích **Đã báo khách số tiền mới**. Bấm **Lưu thay đổi**. Khách không đồng ý thì đóng hộp, không lưu.
5. Đơn OTA: đổi căn trong cùng ngày thì dùng **Đổi căn / đổi ngày** như thường. Khách sửa **ngày** trên kênh thì **Hủy đơn**, lý do **OTA báo hủy**, **Tiền phạt theo kênh** 0, rồi tạo đơn mới cùng **Mã đặt phòng OTA** theo ngày mới, ghi **Ghi chú nội bộ** "OTA sửa đơn".

[ẢNH: C2-11-Đổi căn, đổi ngày, tính thử]

### 6.2 Hủy

1. **Đơn giữ chỗ chưa cọc:** **Hủy giữ chỗ** → hộp **Hủy giữ chỗ căn …?** → **Lý do hủy** → **Hủy giữ chỗ** (hoặc **Giữ lại đơn**). Không thu phí. **Ở v1.0 không chọn Khác (ghi rõ)** (mục 17.2).
   - Giữ chỗ **đã nhận một phần cọc** cũng hủy bằng nút này. Hộp vẫn ghi "Không thu phí (giữ chỗ chưa cọc)" và không hiện dòng hoàn (lỗi đang sửa), nhưng Desk **vẫn tạo yêu cầu hoàn đủ số đã nhận**. Nhập nơi nhận hoàn ngay (mục 12.2).
2. **Đơn đã xác nhận:** **Hủy đơn** → **Lý do hủy**. Desk tính **phí hủy** và **khoản hoàn** theo chính sách kênh Trực tiếp/CTV. Số ngày báo trước = ngày đến − ngày khách báo (ngày trên Desk):
   - Từ 7 ngày: hoàn 100 % cọc.
   - 3–6 ngày: hoàn 50 %.
   - Dưới 3 ngày: không hoàn.
   - **Đơn có đêm ngày đặc biệt: không hoàn cọc.**
   - Ví dụ đơn đến 22/11: báo ngày 15/11 là 7 ngày, hoàn 100 %. Báo ngày 16/11 là 6 ngày, hoàn 50 %.
   - Bất khả kháng (đèo vào Đà Lạt đóng, chuyến bay hủy do thời tiết, có giấy báo của cơ quan hoặc hãng bay): không hoàn tiền mặt. Quản lý cho **dời ngày** miễn phí trong 3 tháng, áp cả ngày đặc biệt.
   - Đọc số trên hộp **Hủy đơn OTM-… của …?** trước khi bấm **Hủy đơn**. Đổi ý thì bấm **Giữ lại đơn**.
3. **Đơn OTA:** nhập **Tiền phạt theo kênh** đúng số kênh báo (0 nếu kênh miễn phạt).
4. **Có khoản hoàn:** Desk tạo yêu cầu hoàn. Người hủy nhập nơi nhận hoàn (mục 12.2). **Người hủy không tự duyệt, không tự chi được**, kể cả có quyền quản lý. Hiện một người trực: **chủ đầu tư duyệt và chi**. Hộp hủy ghi "… – cần quản lý duyệt": ở OTTIMO hiện chủ đầu tư duyệt, không đi tìm quản lý.
   - **4a. Sale/CTV nhắn khách báo hủy:** hủy **trong ngày khách báo** (ngày trên Desk, đổi lúc 06:00). Tin tới sau giờ quầy thì hủy ngay ở lượt mở quầy sáng hôm sau. Nếu bậc hoàn Desk tính thấp hơn bậc theo ngày khách báo, ghi sổ giao ca: "OTM-… khách báo hủy dd/mm hh:mm qua CTV/sale, Desk tính theo ngày hủy dd/mm". Chủ đầu tư xem trong lượt kiểm sáng và quyết phần chênh. Không hứa với khách trước khi chủ đầu tư quyết.
5. Khách muốn đổi ngày thay vì hủy: **Dời ngày thay vì hủy** (chỉ quản lý).

[ẢNH: C2-12-Hủy đơn]

Câu trả lời khi khách hỏi chính sách hủy: đọc đúng mục này. Đơn có đêm ngày đặc biệt (Tết, lễ) không hoàn cọc khi hủy. Không hứa khác Desk.

### 6.3 Khách không đến

1. **18:00** khách chưa đến, chưa báo giờ: gọi hoặc nhắn khách.
2. **23:00** vẫn không liên lạc được: khung đơn → **Đánh dấu không đến** → ghi **Kết quả liên lạc** (**Gọi không nghe máy**, **Khách báo đến trễ**…) → **Đánh dấu không đến**. Nút chỉ mở từ 23:00 và sau khi ghi kết quả liên lạc. **Đơn OTA: kiểm extranet trước.** Khách đã hủy trên kênh thì hủy theo kênh, không đánh dấu không đến.
3. Đơn Trực tiếp: Desk giữ **toàn bộ cọc**, hủy các đêm còn lại, mở bán lại căn. Đơn OTA: Desk tạo việc **Báo khách không đến cho …** để báo kênh.
4. Khách đến sau khi đã đánh dấu: **Khôi phục đơn không đến** (trong ngày nghiệp vụ của đêm đến, căn còn trống). Ngoài điều kiện: **Gửi yêu cầu khôi phục** cho quản lý.
5. Đơn đã trả đủ tiền phòng hoặc OTA đã thu: dù đã đánh dấu không đến, **không bán căn đó trong đêm** cho tới 06:00. Khách có thể đến sau nửa đêm.

[ẢNH: C2-13-Đánh dấu không đến]

---

## 7. Nhận phòng

### 7.1 Giờ nhận phòng

| Khách vào căn lúc | Desk tính |
|---|---|
| Từ **12:00** (căn đã sạch hoặc đã kiểm – `VC`/`VI`) | **Không phụ thu** |
| **10:00–11:59** | Phụ thu **30 %** giá đêm đầu |
| **06:00–09:59** | Phụ thu **50 %** giá đêm đầu |
| Trước **06:00** | Không phải phụ thu: Desk **thêm đêm trước** (tiền phòng 1 đêm) |

- Câu nói với khách: "Check-in is from 12:00. Your room is always ready by 14:00." / "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00." **Không** hứa "phòng sẵn sàng từ 12:00".
- Khách tới 12:00–14:00 mà căn chưa xong: giữ hành lý, mời chờ ở sảnh hoặc đi dạo, hẹn giờ. Không phụ thu, không giảm giá. Gửi hành lý không tính phụ thu.
- Quá 14:00 vẫn chưa xong: lễ tân trưởng hoặc quản lý đổi căn sẵn sàng hoặc nâng hạng, ghi lý do.
- Đơn OTA: phụ thu nhận sớm/trả muộn tính trên giá Trực tiếp hiện hành của đêm đó, **chỉ khi chủ đầu tư đã đăng giờ nhận/trả và mức phụ thu trong nội quy của kênh đó**.

> **Tạm ở v1.0 – khách đặt qua Booking.com, Agoda, Airbnb:** chỉ thu phụ thu nhận sớm khi chủ đầu tư đã báo kênh đó đổi giờ nhận phòng 12:00 trong nội quy. Kênh chưa đổi: vẫn ghi giờ nhận thật, chọn **Xin miễn phụ thu (gửi duyệt)**, lý do "Kênh OTA chưa đăng phụ thu", báo quản lý. Lễ tân trưởng giữ danh sách kênh đã đăng do chủ đầu tư báo.

### 7.2 Tờ "Your ID details" – cho khách xem trước khi nhận giấy tờ

**Mọi khách làm giấy tờ tại quầy phải được xem tờ "Your ID details" trước khi anh/chị nhận giấy tờ.** Đây là thông báo bắt buộc cho khách về việc dùng thông tin giấy tờ.

Cho khách xem theo thứ tự:
1. **Bản in khổ A4** trong khung mica trên quầy, mặt quay ra khách, chỗ khách đứng làm thủ tục, không bị che (cách chính, theo quyết định của chủ đầu tư 30/10).
2. **Bản in dự phòng** trong ngăn quầy. Tờ trên quầy hỏng hay mất thì thay ngay bằng bản này, ghi sổ giao ca để chủ đầu tư in lại trong ngày.
3. **Máy tính bảng của cơ sở** – chỉ khi chưa thay được bản in, và chỉ khi máy đạt đủ điều kiện dưới đây:
   - Máy **dành riêng** cho tờ này. **Không** dùng máy quầy hay màn hình máy quầy, điện thoại cơ sở, máy cá nhân, máy có app khóa cửa.
   - Máy **không** được cấp quyền thiết bị và **không** đăng nhập Desk, app nhân viên, Zalo, email, app khóa cửa.
   - Máy có mật mã màn hình. Trên máy chỉ có tệp **`your-id-details-tablet.html`** (hoặc bản PDF A4 của tờ), mở từ máy, không cần mạng.
   - Trước khi quay về phía khách: bật **Không làm phiền**, mở tờ, chạm một lần cho toàn màn hình, rồi khóa vào tờ (iPad: **Truy cập được hướng dẫn**; Android: **Ghim ứng dụng**). Nhìn lại: màn hình chỉ có tờ, dòng chân "OTTIMO · ID notice · 11/2026".
   - Máy không đạt đủ điều kiện: **không dùng**.

Không có bản in nào và không có máy đạt điều kiện: không nhận giấy tờ, gọi chủ đầu tư.

Câu mời khách đọc (trước khi nhận giấy tờ):
- EN: "Before I take your ID, please read this note on how we use it."
- VI: "Trước khi nhận giấy tờ, mời anh/chị đọc tờ này về cách chúng tôi dùng thông tin."

Khách không đọc được tờ EN/VI, hoặc khó đọc: đọc to câu hạn lưu (đoạn 3 của tờ, bản EN). Khách hỏi thêm về dữ liệu của mình: ghi lại yêu cầu, chuyển chủ đầu tư, không hứa ngày.

Nội dung tờ (nguyên văn, không sửa chữ):

> OTTIMO
>
> **Your ID details**
> *Thông tin giấy tờ của bạn*
>
> OTTIMO uses your ID details to register your stay with the police, as required by Vietnamese law. ID photos are encrypted; only reception and managers can see them.
>
> We will ask separately whether we may keep your ID photos after registration. Saying no does not affect your stay.
>
> ID photos and saved ID details are deleted within 3 months after check-out, unless the law requires us to keep them longer. Copies in our encrypted backups are deleted within a further 35 days.
>
> To see, correct or delete your details, please ask reception.
>
> ---
>
> OTTIMO dùng thông tin giấy tờ của bạn để khai báo lưu trú với cơ quan công an theo luật Việt Nam. Ảnh giấy tờ được mã hóa; chỉ lễ tân và quản lý xem được.
>
> Chúng tôi sẽ hỏi riêng bạn có muốn cho lưu ảnh giấy tờ sau khi khai báo hay không. Bạn không đồng ý cũng không ảnh hưởng gì tới việc lưu trú.
>
> Ảnh và thông tin giấy tờ được xóa trong vòng 3 tháng sau khi trả phòng, trừ phần pháp luật yêu cầu lưu lâu hơn. Bản sao trong dữ liệu sao lưu đã mã hóa được xóa trong 35 ngày sau đó.
>
> Muốn xem, sửa hoặc xóa thông tin của bạn, vui lòng hỏi lễ tân.
>
> OTTIMO · ID notice · 11/2026

[ẢNH: G2-03-Tờ Your ID details khổ A4 trong khung mica trên quầy]

<!-- SEC S1 (SEC-on-BA-department-guides.md, 30/10): máy tính bảng chỉ là cách dự phòng thứ 3, đủ điều kiện mới dùng. Bản điện tử đúng chữ và dòng chân "OTTIMO · ID notice · 11/2026" (SEC D08). Bản in A4: product/docs/print/pdf/to-4-your-id-details-a4.pdf. -->

### 7.3 Các bước nhận phòng

1. **Hôm nay → Khách đến → Nhận phòng** (hoặc khung đơn → **Nhận phòng**). Desk mở **Nhận phòng · Căn … · …**.
2. Đọc **Điều kiện nhận phòng**. Mỗi dòng **Đã đủ** hoặc **Còn thiếu**:
   - **Đơn đã được gán căn**
   - **Số khách không vượt sức chứa căn**
   - **Buồng sẵn sàng (VI hoặc VC)**
   - **Đã thu đủ hoặc OTA đã trả/đảm bảo**
   - **Có giấy tờ người đứng tên**
   - **Giấy tờ khách nước ngoài hợp lệ tại ngày nhận**
3. **Bước 1 – Giấy tờ.** **Trước khi nhận giấy tờ**, cho khách xem tờ **Your ID details** (mục 7.2). Rồi mới nhận giấy tờ. Bắt đầu với **người đứng tên**.
   - Chưa có giấy tờ: **Chụp hoặc tải ảnh giấy tờ**, hoặc **Nhập tay** → điền → **Lưu giấy tờ**.
   - Khách đã gửi ảnh qua link (đơn cũ): dòng ghi **Khách đã gửi trước qua app** và **Cần nhập thông tin**. Bấm **Sửa** (nhập lại mật khẩu, hiệu lực 15 phút), chọn **Người trong đoàn** (phải chọn lại; người chưa có trong đơn thì chọn **Người ở chưa có trong đơn**), **Loại giấy tờ**, rồi gõ số, họ tên, ngày sinh, giới tính, quốc tịch, hạn, diện nhập cảnh… từ ảnh và bản gốc → **Lưu giấy tờ**.
   - Người đi cùng bổ sung được trước hạn khai báo. Bấm **Tiếp tục: Kiểm tra**.
4. **Bước 2 – Kiểm tra.** Desk tự kiểm tên khớp đơn, hạn hộ chiếu, thị thực, đủ giấy tờ. Dòng **Chưa kiểm được**: xem giấy tờ gốc, bấm **Tôi đã kiểm – Đạt** hoặc **Tôi đã kiểm – Không đạt**, ghi **Cách xử lý** và bấm **Lưu** ở từng dòng (**kể cả khi Đạt**). Thiếu thì Desk báo "Ghi cách xử lý cho mọi mục…". Bấm **Tiếp tục: Khai báo**.
5. **Bước 3 – Khai báo.** Desk hiện loại khai báo (**Thông báo lưu trú công dân Việt Nam** hoặc **Khai báo tạm trú người nước ngoài**) và **hạn**. Chọn **Khai báo ngay** (mục 8), hoặc bấm **Khai báo sau (thêm vào việc cần làm)** – Desk sang luôn bước 4.
6. **Bước 4 – Giao mã & hoàn tất:**
   - **Giờ nhận & phụ thu**: mặc định "Nhận từ 12:00 – không phụ thu". Khách vào trước 12:00: bật **Khách nhận sớm**, chỉnh **Giờ nhận thực tế** (giờ khách vào căn). Desk hiện **Phụ thu nhận sớm đề xuất**. Báo khách, tích **Tôi đã báo khách khoản phụ thu này**. Khách xin miễn: **Xin miễn phụ thu (gửi duyệt)**, chọn lý do.
   - **Thu tiền trước khi giao mã**: Desk hiện **Cần thu để nhận phòng** (phần còn lại của đơn Trực tiếp, phụ thu nhận sớm). Thu theo mục 10. Khối thu chọn sẵn **Chuyển khoản VietQR**: bấm đúng cách khách trả trước khi nhập số.
   - **Mã cửa**: tạo trên app khóa theo mục 7.5. Chỉnh **Số thẻ phòng đã giao** bằng nút −/+ (1–2 thẻ).
   - Tích **Đã gửi/giao nội quy (VI/EN) cho khách** (bắt buộc). Tích **Đã giao mã cửa/thẻ cho khách** nếu đã giao.
7. Đọc khối **Khi bấm Nhận phòng**. Bấm **Nhận phòng căn …**. Hộp **Nhận phòng căn … cho …?** nhắc lại hạn khai báo, phụ thu, khoản thu: bấm **Nhận phòng căn …** (hoặc **Không, quay lại**). Khoản thu được ghi **cùng lúc** với nhận phòng; nhận phòng không thành thì không ghi tiền.
8. Desk về khung đơn, đơn chuyển **Đang ở**, buồng chuyển **Có khách, sạch**. Giờ mới được giao mã cửa.

[ẢNH: C2-15-Nhận phòng, điều kiện và bước Giấy tờ]
[ẢNH: C2-16-Nhận phòng, bước Kiểm tra]
[ẢNH: C2-17-Nhận phòng, bước Khai báo]
[ẢNH: C2-18-Nhận phòng, giờ nhận và phụ thu nhận sớm]
[ẢNH: C2-19-Nhận phòng, thu tiền]
[ẢNH: C2-20-Nhận phòng, mã cửa và hoàn tất]

> **Lỗi nhỏ đã biết (v1.0.1):** chip **Cần nhập thông tin** / **Đã có** đè nút **Xem đủ số / ảnh**. Thu nhỏ trang (Ctrl và dấu trừ) nếu cần bấm.

### 7.4 Trường hợp đặc biệt khi nhận phòng

- **Căn chưa sẵn sàng** (đang `VD`, `CL`, `OD`): lễ tân gửi **Gửi lễ tân trưởng xác nhận** kèm **Lý do**. Lễ tân trưởng tự xác nhận ngoại lệ được; buồng chuyển "Có khách, cần dọn" và có việc dọn gấp. Căn đang khóa sửa chữa (`OOO`) thì **không bao giờ** nhận phòng được.
- **Khách nhận trước 06:00**: Desk hiện "Khách nhận trước 06:00 – thêm đêm …: … Đây là tiền phòng, không phải phụ thu." Bấm **Thêm đêm và nhận phòng**. Đêm trước đã có khách thì chưa nhận được trước 06:00: nhận từ 06:00 hoặc đổi căn trống.
- **Vượt sức chứa**: **Đổi sang căn đủ chỗ** hoặc **Sửa số khách thực tế** sau khi hỏi khách.
- **Giấy tờ nước ngoài hết hạn hoặc thiếu dấu nhập cảnh**: lễ tân trưởng trở lên xác nhận nhận tiếp (ghi lý do, cách xử lý); quản lý nhận thông báo.
- **Bộ đồ dùng thêm** (khách vượt định mức ngủ sofa) chưa chuẩn bị: vẫn nhận phòng được; việc đã lên đầu hàng đợi buồng phòng.
- **Nhận nhầm**: **Hoàn tác nhận phòng** (chỉ quản lý, trong ngày, khi folio chưa có dòng mới). Lỗi đang sửa: nút vẫn hiện cả khi folio đã có dòng mới (ví dụ đã thu tiền); bấm thì Desk từ chối. Khi đó quản lý bỏ các dòng mới (**Folio & điều chỉnh** → **Điều chỉnh** → **Bỏ cả dòng**) và đảo khoản thu mới (**Giao dịch thu** → **Đảo giao dịch**) trước, rồi mới hoàn tác.
- Mất mạng giữa chừng: Desk không lưu tạm. Chờ mạng; khách chờ lâu thì ghi sổ giấy, nhập bù khi có mạng.

### 7.5 Mã cửa

> **Tạm ở v1.0:** mã cửa vẫn tạo trên app khóa **ngoài Desk** (quản lý mã trên app có ở v1.1). Desk **không lưu mã cửa**. Desk chỉ ghi đã giao mã/thẻ lúc nào, ai giao. Khi trả phòng hoặc đổi phòng, Desk tạo việc "Xóa mã trên app khóa" để nhắc.
> - App khóa chỉ cài trên **điện thoại hoặc máy tính bảng của cơ sở**, không cài trên điện thoại cá nhân. Tài khoản quản trị app khóa do chủ đầu tư giữ. Lễ tân dùng tài khoản được ủy quyền riêng nếu app khóa cho phép.
> - Mỗi lượt ở **một mã ngẫu nhiên mới** (app khóa tạo). Không dùng ngày sinh, số điện thoại, số căn, mã cũ – kể cả khi chữ gợi ý trên màn Desk nhắc mã theo ngày sinh. Luôn đặt **hạn trên khóa** tới giờ trả phòng (trả muộn đã hẹn thì tới giờ đó).
> - Trả phòng, đổi phòng, khách rời sớm, hủy, không đến: **xóa mã ngay**.

**Giao mã cửa** – chỉ khi đơn đủ điều kiện: **đã nhận phòng trên Desk**, có giấy tờ người đứng tên, đã thu đủ (đơn Trực tiếp). Mã cửa **không gửi bằng chữ hay ảnh qua bất kỳ kênh nào** (Zalo, Messenger, WhatsApp, SMS, email, hộp thư OTA…), kể cả gõ tay. Hai cách giao:
- **Tại quầy**: đọc nhỏ hoặc cho khách xem màn app khóa. Không đọc to khi có người khác đứng gần.
- **Gọi điện**: lễ tân **tự gọi ra** số điện thoại **đã có trên đơn từ trước hôm nay** (hoặc số kênh OTA cung cấp). Chỉ đọc khi người nghe xác nhận đúng **họ tên người đứng tên và ngày đến**. Không để lại lời nhắn thoại. Không đọc cho người nghe hộ.

Không được:
- **Không** đọc mã trong cuộc gọi khách gọi đến, kể cả khi người gọi nói đúng tên và mã đơn: cúp máy, gọi lại số trên đơn.
- Khách xin đổi số điện thoại trong ngày đến: **không** gọi số mới để đọc mã. Mời khách ra quầy, đối chiếu giấy tờ rồi mới sửa số.
- Nghi ngờ (người khác xin mã thay khách, khách đòi gấp, số lạ): không giao, báo quản lý.
- **Không ghi mã cửa** vào ghi chú đơn, sổ giao ca, sổ giấy, giấy dán quầy, nhóm chat nội bộ; không gửi cho đồng nghiệp bằng tin nhắn. Cần giao ca thì nói trực tiếp hoặc xem lại trên app khóa.

Khách nhờ gửi mã cửa qua Zalo, tin nhắn: **không gửi**. Trả lời:
- EN: "For your security, OTTIMO never sends door codes by message. We will call you on the phone number in your booking, or you may collect your code at the front desk."
- VI: "Vì an toàn của anh/chị, OTTIMO không gửi mã cửa qua tin nhắn. Lễ tân sẽ gọi vào số điện thoại trong đơn đặt phòng, hoặc anh/chị nhận mã tại quầy."

Đơn đủ điều kiện thì **tự gọi** số trên đơn để đọc mã. Chưa đủ thì mời khách ra quầy.

---

## 8. Giấy tờ và khai báo lưu trú

### 8.1 Nguyên tắc dữ liệu khách (Nghị định 13/2023)

1. **Giấy tờ khách chỉ nằm trên Desk.** Không chụp bằng điện thoại (cá nhân hay của cơ sở), không gửi qua Zalo/Messenger, không in ra để đó.
2. Chỉ **lễ tân và quản lý** xem số giấy tờ đầy đủ và ảnh giấy tờ. Buồng phòng, bảo trì, sale, CTV không thấy. Đây là thiết kế, không phải lỗi.
3. Chỉ bấm **Xem đủ số / ảnh** khi đang làm thủ tục hoặc khai báo cho **đúng đơn đó**. Xem vì tò mò là vi phạm nội quy. Mỗi lần xem đều được ghi nhật ký (người, giờ, đơn). Desk hỏi lại mật khẩu, có hiệu lực 15 phút; số và ảnh tự ẩn sau vài giây hoặc khi rời tab.
4. **Thông báo trước, hỏi đồng ý sau** – hai lúc khác nhau:
   - **Trước khi nhận giấy tờ**: cho khách xem tờ **Your ID details** (mục 7.2).
   - **Ở Khối 1 "Đối chiếu và đồng ý lưu ảnh"** (mục 8.3 bước 3): hỏi khách có **đồng ý lưu ảnh giấy tờ** không (mục 8.2).
5. Hạn giữ dữ liệu giấy tờ:
   - Ảnh của khách đồng ý lưu: ở v1.0 tự xóa **30 ngày** sau trả phòng. **Khi nói với khách, luôn đọc số ngày trên câu hỏi đồng ý của Desk.**
   - Hồ sơ **khai báo chưa xong**: ảnh tự xóa **7 ngày sau trả phòng**, kể cả khi khách đã đồng ý. Vì vậy khai đúng hạn.
   - Dữ liệu điền sẵn cho khách quay lại giữ **3 tháng** sau lần trả phòng cuối. Quá hạn thì nhập lại giấy tờ; đó là đúng thiết kế.
6. **Không ghi** số giấy tờ, số thẻ thanh toán, thông tin sức khỏe vào ô ghi chú, lời nhắn cho khách hay lý do. Desk chặn một số dãy số dài.
7. Trẻ em: chỉ nhập **số định danh** (nếu có) và **năm sinh**, **không chụp** giấy tờ của trẻ. Với dữ liệu cá nhân, khách **dưới 16 tuổi** là trẻ em (khác mốc 12 tuổi của phụ thu).
8. Khách xin xem, sửa, xóa dữ liệu của mình: ghi lại yêu cầu, **chuyển chủ đầu tư**. Không hứa ngày. Người gửi form website chưa thành đơn xin xóa: mục 13.1b. Khách xin xóa sớm ảnh: chỉ quản lý, chủ đầu tư làm (**Xóa ảnh**).

### 8.2 Câu hỏi đồng ý lưu ảnh (Khối 1)

- Chỉ hỏi khi **có chụp ảnh giấy tờ**. Hỏi **từng người lớn** được chụp.
- Khách đang ở lúc chuyển đổi ngày D không chụp lại ảnh nên không hỏi.
- Đọc đúng số ngày **N** Desk hiện ở câu hỏi (N = 1 thì đọc "1 day" / "1 ngày").
- Gọi khách là "anh" hoặc "chị", không đọc "anh/chị".

Câu đọc:
- EN: "May we keep photos of your ID for N days after check-out? They are then deleted automatically. If you'd rather not, that's fine – we use them only to register your stay, then delete them."
- VI: "Anh/chị có đồng ý cho OTTIMO lưu ảnh giấy tờ N ngày sau khi trả phòng không? Sau đó ảnh tự xóa. Anh/chị không đồng ý cũng không sao, chúng tôi chỉ dùng ảnh để khai báo lưu trú rồi xóa."

Ghi câu trả lời trên Desk. Không đồng ý vẫn khai báo được, khách vẫn ở bình thường; ảnh bị xóa ngay khi cổng khai báo xác nhận, hoặc khi đơn hủy/không đến trước khi khai.

Khách hỏi "lễ tân nói lưu ảnh N ngày, sao tờ thông báo ghi 3 tháng?". Hai số đều đúng. Trả lời:
- EN: "Your photos are deleted N days after check-out. The 3 months on the notice covers all ID details, including those saved for your next stay."
- VI: "Ảnh anh/chị đồng ý lưu sẽ xóa sau N ngày kể từ khi trả phòng. Mốc 3 tháng trên tờ thông báo áp cho mọi thông tin giấy tờ, kể cả thông tin lưu sẵn cho lần ở sau."
- Khách hỏi tiếp: chỉ đoạn 3 của tờ (có ý bản sao lưu). Không hứa "xóa ngay", không nói "dài nhất".

### 8.3 Khai báo

**Hạn khai báo** (theo **giờ đồng hồ thật**, không theo mốc 06:00 của Desk):

| Khách | Hạn |
|---|---|
| Công dân Việt Nam | Trước **23:00** ngày đến. Đến 23:00–23:59: trước **08:00** sáng hôm sau. Đến 00:00–05:59: Desk đếm tới 23:00 cùng ngày, nhưng OTTIMO khai **ngay trong ca, muộn nhất 08:00 sáng** |
| Người nước ngoài | Trong **12 giờ** tính từ giờ nhận phòng |

Hồ sơ sắp hạn và quá hạn hiện ở **Cần chú ý** và cột **Hạn khai báo**.

1. **Vận hành → Giấy tờ & khai báo**. Tab **Cần xử lý**, **Cần cập nhật ngày đi**, **Tất cả**. Cột **Hạn khai báo** đếm ngược, đỏ khi quá hạn.
2. Nút ở mỗi dòng theo trạng thái: **Nhập giấy tờ** (thiếu giấy tờ) · **Mở** (cần kiểm tra, thiếu người) · **Khai báo** (đủ giấy tờ, chờ khai báo – sau khi đã **Đối chiếu xong**).
3. **Khối 1 · Đối chiếu và đồng ý lưu ảnh**: kiểm từng người. Khách đã xem tờ **Your ID details** trước khi đưa giấy tờ. Hỏi từng người lớn có chụp ảnh giấy tờ (mục 8.2) và chọn **Đồng ý lưu ảnh** hoặc **Không đồng ý – xóa ảnh sau khi khai báo**. Bấm **Đối chiếu xong**.
4. **Khối 2 · Sao chép lên cổng khai báo**: không mở cổng hay dán dữ liệu khi khách khác đang đứng nhìn màn hình. Bấm **Hiện dữ liệu khai báo** (nhập lại mật khẩu). Mở cổng khai báo của Bộ Công an trên cùng máy. Bấm **Sao chép** từng ô theo đúng thứ tự trên cổng, dán vào cổng. Ô ghi "Không có – để trống trên cổng" thì để trống. Dán xong bấm **Xóa bộ nhớ tạm**.
5. Gửi trên cổng. Cổng trả **mã hồ sơ**.
6. **Khối 3 · Ghi kết quả từ cổng**: dán **Mã hồ sơ**, bấm **Đã gửi khai báo**. Khi cổng xác nhận: **Cổng đã xác nhận**. Cổng từ chối: **Cổng từ chối** → ghi **Lý do cổng từ chối**; hồ sơ trở về chờ khai báo để sửa và khai lại.

[ẢNH: C2-21-Giấy tờ và khai báo, danh sách]
[ẢNH: C2-22-Khai báo, ba khối]

- Dữ liệu tự ẩn sau vài phút hoặc khi rời tab. Không dán dữ liệu khai báo vào chỗ khác ngoài cổng.
- Khách nước ngoài **gia hạn, trả sớm hoặc trả phòng**: hồ sơ hiện ở tab **Cần cập nhật ngày đi**. Cập nhật trên cổng trong ngày.
- Đổi phòng không phải khai báo lại; chỉ đổi số căn trong hồ sơ.
- **Giấy tờ khách gửi qua link chưa gắn người** (thường do có người rời đoàn): mở đơn, bấm **Gắn người**, chọn đúng người. Không gắn thì giấy tờ tự xóa theo giờ Desk ghi.

---

## 9. Trong lúc khách ở

### 9.1 Thêm dịch vụ, phát sinh vào folio

Folio là bảng tiền của lượt ở.
1. Khung đơn → **Thêm phát sinh**.
2. **Khoản**: **Dọn phòng lẻ**, **Giặt ủi (theo kg)**, **Khử mùi thuốc lá**, **Mất/hỏng thẻ phòng**, các món hư hỏng theo bảng giá (ví dụ **Khăn tắm**, **Ly**, **Remote**), **Đồ ăn uống**, **Dịch vụ khác** (hai khoản cuối nhập giá).
3. **Số lượng**, **Ghi chú**. Khoản phạt (thuốc lá, thẻ, hư hỏng) cần **Ảnh hoặc ghi chú bằng chứng**; nên kiểm đã gửi nội quy cho khách.
4. Bấm **Thêm vào folio**.

[ẢNH: C2-23-Thêm phát sinh]

> **Lỗi nhỏ đã biết (sửa ở v1.0.2):** câu "Phí phạt không tính vào doanh thu phòng" hiện cả khi chọn giặt ủi. Giặt ủi không phải phí phạt; cứ thêm như thường.

### 9.2 Thêm người đi cùng

1. Khung đơn → mục **Người ở** → **Thêm người đi cùng**.
2. Chọn **Người lớn đi cùng** hoặc **Trẻ em** (trẻ chỉ cần **Năm sinh**). Ô chọn người hiện nhãn "Khách đứng tên" – nhãn nhầm, đang sửa; chọn đúng người đi cùng.
3. Vượt định mức: Desk hiện phụ thu người (người lớn 150.000 đ/đêm, trẻ 6–11 tuổi 100.000 đ/đêm, dưới 6 tuổi miễn). Báo khách.
4. Tích **Ghi phụ thu … vào folio – tôi đã báo khách** → **Thêm vào đơn**.
5. Desk tự tạo việc cho buồng phòng chuẩn bị bộ đồ dùng thêm.

[ẢNH: C2-24-Thêm người đi cùng]

### 9.3 Gia hạn

1. Khung đơn → **Gia hạn**. Chọn số đêm **Ở thêm** (chỉ đêm còn **Trống**; tối đa 7 đêm liên tiếp).
2. Desk tính tiền, áp lại giảm theo số đêm nếu tổng đủ 7 hoặc 14 đêm. Sửa giá đêm thêm thì cũng nhập **giá trước giảm**.
3. Đơn OTA: phần gia hạn thành đơn con kênh Trực tiếp, chung phiếu thanh toán.
4. Bấm **Gia hạn … đêm · …**. Kéo dài hiệu lực mã cửa trên app khóa. Khách nước ngoài: cập nhật khai báo trong ngày.
5. Desk chưa có ô thu tiền khi gia hạn và chưa có nút ghi thu giữa kỳ ở. Ghi vào sổ giao ca: mã đơn, số đêm gia hạn, số tiền. Thu ở bước **Bill & thu tiền** khi trả phòng. Khách gia hạn dài hoặc chưa trả các đêm trước: báo quản lý.

[ẢNH: C2-25-Gia hạn]

### 9.4 Đổi phòng khi đang ở

1. Khung đơn → **Đổi phòng**.
2. **Vì sao đổi?**: **Sự cố của OTTIMO – giữ giá cũ** hoặc **Khách yêu cầu – giá căn mới**. Ghi **Lý do đổi**.
3. **Trước khi chọn căn mới**, mở **Buồng phòng** hoặc **Sơ đồ phòng** kiểm căn đó đang `VC` hoặc `VI` (lỗi đang sửa: danh sách có thể lẫn căn chưa dọn `VD`; chọn căn đó thì Desk báo và không lưu gì). Không đổi khách sang căn `VD`.
4. **Căn mới (đã dọn hoặc đã kiểm)**: chọn căn. Căn nhóm cao hơn cần lễ tân trưởng xác nhận.
5. Bấm **Đổi sang căn …**. Rồi:
   - Nhờ buồng phòng đếm minibar căn cũ. Món đã dùng ghi vào folio ngay bằng **Thêm phát sinh**.
   - Thu thẻ căn cũ, ghi số thẻ trả. **Xóa mã căn cũ trên app khóa.** Giao mã/thẻ căn mới.
   - Bộ đồ dùng thêm: Desk tự tạo việc chuyển. Căn cũ có việc dọn.
   - Đổi do sự cố: khách giữ giá cũ. Muốn bù thêm thì dùng miễn phí, lý do **Bù sự cố**.

[ẢNH: C2-26-Đổi phòng]

### 9.5 Miễn phí, giảm giá

1. Trong folio (**Folio & điều chỉnh**), ở dòng cần miễn: **Mở form miễn phí / giảm giá**. Hộp **Miễn phí · <dòng> · <số tiền>** mở ra.
2. Loại do dòng quyết định: dòng phát sinh → miễn phí (FOC); dòng tiền phòng → giảm giá đặc biệt.
3. Nhập **Số tiền miễn** (tối đa phần còn lại của dòng), **Lý do miễn phí** (**Khách quen / VIP**, **Phòng sẵn sàng, không ảnh hưởng khách sau**, **Bù sự cố**, **Khách dài hạn**, **Khác (ghi rõ)**).
4. Minibar trong mức tự miễn của lễ tân (≤ 100.000 đ/lần, ≤ 500.000 đ/tháng): nhập lại mật khẩu → **Tự áp miễn phí**.
5. Còn lại: **Gửi duyệt**. Yêu cầu tự đến người có quyền. Folio ghi dòng miễn **Chờ duyệt**.
6. Theo dõi kết quả trên folio (**Đã áp**, **Bị từ chối**). Lỗi đang sửa: ở màn Trả phòng, dòng miễn **Bị từ chối** vẫn hiện số âm – số đó **không** được trừ; đọc **Còn phải thu** để biết số đúng.

[ẢNH: C2-30-Miễn phí, giảm giá]

### 9.6 Xác nhận giờ trả

- Hôm trước và sáng ngày đi, nhắn khách xác nhận giờ trả (nhắn tay ở v1.0). Chỉ nhắn trong **08:00–21:00**; tối hôm trước nhắn trước 21:00. Căn có khách đến hôm nay: không mời trả muộn trong tin.
- Ghi kết quả: **Hôm nay → Khách đi → Xác nhận giờ trả**, hoặc nút **Xác nhận giờ trả** trên khung đơn **Đang ở** → nhập giờ khách báo (ô ghi nhầm "Giờ trả phòng thực tế" – đang sửa), **Khách trả lời qua** (**Gọi điện**, **Tại quầy**, **Zalo**).
- Giờ sau 12:00 là trả muộn: dùng **Trả muộn** (mục 11.3).

[ẢNH: C2-28-Xác nhận giờ trả]

### 9.7 Yêu cầu của khách

Hiện trên **Hôm nay**. **Đã nhận** → làm hoặc chuyển bộ phận → **Làm xong**. Không làm được: **Không thực hiện được** → **Lý do (khách thấy)**. **Lời nhắn cho khách**: khách đọc được, không ghi mã cửa, số giấy tờ, số điện thoại, số thẻ. Yêu cầu có phí ghi vào folio khi xong.

Từ 02/11 tới bản v1.0.1, khách chưa có link trang khách (mục 17.3), nên yêu cầu chủ yếu tới qua Zalo hoặc điện thoại.

[ẢNH: C2-29-Yêu cầu của khách]

---

## 10. Thu tiền

### 10.1 Các cách thu

| Cách | Làm gì | Ghi chú |
|---|---|---|
| **Tiền mặt** | Nhập **Tiền khách đưa**. Desk tính **Thối lại** | Cất két ngay |
| **Thẻ (máy POS tại quầy)** | Khách quẹt/chạm thẻ trên máy POS **trước mặt mình**. Nhập **Mã chuẩn chi trên phiếu POS** | **Không nhập số thẻ** |
| **Chuyển khoản VietQR** | **Tạo VietQR · …** → kiểm dòng cảnh báo (mục 10.2) → khách quét → **chắc tiền đã về** (mục 10.3) → **Ghi nhận đã thu …** | Nội dung chuyển khoản là mã đơn |
| **Chuyển khoản** (tay) | Nhập số tiền, **Mã giao dịch / ghi chú** | Mang cờ **Chờ đối soát**, vẫn tính là đã thu |

- **Chưa chắc tiền về thì đừng hoàn tất.** Chờ xác nhận, hoặc chọn cách khác.
- Ở **trả phòng**: thu nhiều lần, mỗi lần một cách. Khi **đặt đơn** và khi **nhận phòng**: Desk nhận **một** cách cho mỗi lần thu, và ở nhận phòng thu **đủ** **Cần thu để nhận phòng** bằng cách đó (chuyển khoản, thẻ: đúng bằng số cần thu; tiền mặt: từ số cần thu trở lên, Desk tính tiền thối). Khách muốn trả hai cách lúc nhận phòng: chưa làm được ở v1.0, mời khách trả một cách (thường tiền mặt hoặc thẻ).
- Đơn Trực tiếp: thu **đủ** phần còn lại khi nhận phòng, **trước khi giao mã cửa**.
- **Không nhận số thẻ** qua điện thoại, Zalo, email hay giấy. Không chụp thẻ, không ghi số thẻ. Khách muốn trả thẻ thì trả tại máy POS ở quầy.
- **Thẻ ảo của OTA**: chỉ chủ đầu tư/quản lý xem trên extranet và gõ thẳng vào máy POS.

[ẢNH: C2-19-Nhận phòng, thu tiền]

### 10.2 Mã VietQR hiện dòng "Tài khoản nhận vừa đổi trong 24 giờ qua…"

1. **Chưa cho khách chuyển.**
2. **Gọi điện** (không nhắn) cho chủ đầu tư qua số đã lưu sẵn trong danh bạ điện thoại cơ sở. Hỏi chủ đầu tư có vừa đổi tài khoản nhận không.
3. Chủ đầu tư xác nhận thì mới cho khách quét.
4. Không gọi được: mời khách trả tiền mặt hoặc thẻ.

Thấy thông báo đổi tài khoản trong Desk mà chưa nghe chủ đầu tư nói: cũng gọi chủ đầu tư.

### 10.3 Kiểm tiền chuyển khoản đã về

> **Tạm ở v1.0** (đang chờ chủ đầu tư quyết cách lễ tân thấy tiền về tại quầy):
> - **07:00–22:00**: gọi hoặc nhắn chủ đầu tư/quản lý **qua số đã lưu sẵn trong danh bạ điện thoại cơ sở**, kèm **mã đơn và số tiền**. Chỉ bấm khi người đó trả lời **đúng mã đơn và số tiền**. Tin xác nhận đến từ số hoặc tài khoản lạ (kể cả có ảnh, tên chủ đầu tư) thì không tin, gọi lại số đã lưu.
> - **22:00–07:00**: mời khách trả **tiền mặt** hoặc **thẻ (máy POS)**. Khách chỉ chuyển khoản được: ghi **Chuyển khoản** (tay) với mã giao dịch khách đọc. Khoản mang cờ **Chờ đối soát**. Ghi vào sổ giao ca để quản lý đối soát **trước 09:00** sáng hôm sau.
> - Không giao mã cửa cho khách mà chưa có giấy tờ người đứng tên.
> - Ảnh chụp màn hình chuyển khoản và **tin nhắn SMS báo tiền** khách đưa xem **không** thay cho xác nhận.

<!-- Chờ ESC-039 (INV). Khi INV quyết A: sửa khung này theo sổ tay 1.5 mục 2.13. -->

---

## 11. Trả phòng

### 11.1 Trả phòng – 3 bước

**Giờ trả phòng 12:00.**

1. **Hôm nay → Khách đi → Trả phòng** (hoặc khung đơn → **Trả phòng**). Desk mở **Trả phòng · Căn … · …**.
2. **Bước 1 – Minibar.** Nhập số **Còn lại / chuẩn** từng món theo số buồng phòng đếm. Không dùng gì: **Không dùng gì – tủ đủ**. Buồng phòng chưa báo số: hỏi khách đã dùng gì, nhập theo lời khách, ghi chú "chưa đếm". **Không** bấm **Không dùng gì – tủ đủ** khi chưa có số. Xem **Tổng minibar**. Bấm **Tiếp tục: Phụ phí**.
3. **Bước 2 – Phụ phí.** Kiểm **Giờ trả phòng thực tế**. Desk tự tính phụ thu trả muộn (mục 11.3). Thêm **Phát sinh khác** nếu có (**Giặt ủi**, **Đồ ăn gọi thêm**, **Hư hỏng, mất đồ**, **Khử mùi thuốc lá**, **Thiếu thẻ phòng**). Có phụ thu: báo khách, tích **Tôi đã báo khách khoản phụ thu này**. Bấm **Tiếp tục: Bill & thu tiền**.
4. **Bước 3 – Bill & thu tiền.** Đọc **Tổng cộng**, **Đã thu**, **Còn phải thu**. Thu theo mục 10.
5. Khách lấy hóa đơn công ty: bật **Khách lấy hóa đơn công ty** → **Tên công ty**, **Mã số thuế**, **Địa chỉ công ty**, **Email nhận hóa đơn** → bấm **Lưu** (mục 11.7). Bỏ qua dòng chữ nhỏ nhắc "Round 3 / R2" dưới ô – chữ cũ, đang sửa.
6. Khách trả thừa: chọn **Hoàn lại khách … (tạo đề nghị hoàn)** hoặc **Khách đồng ý để lại khoản thừa – chỉ quản lý trở lên**, ghi lý do.
7. Bấm **Đã thu … – hoàn tất** (hoặc **Hoàn tất trả phòng**). Đọc hộp xác nhận, xác nhận.
8. Desk báo "Đã trả phòng. Bill đã lưu." và cấp số **Phiếu thanh toán**. Đơn chuyển **Đã trả phòng**, buồng chuyển **Trống, cần dọn**; có việc dọn, bổ sung minibar, xóa mã trên app khóa.
9. **Xóa mã cửa trên app khóa ngay.** Thu thẻ phòng.

[ẢNH: C2-31-Trả phòng, bước Minibar]
[ẢNH: C2-32-Trả phòng, bước Phụ phí]
[ẢNH: C2-33-Trả phòng, bước Bill và thu tiền]

- Tiền mặt hoặc thẻ POS **lớn hơn số đang nợ lúc đó** (ví dụ có phụ thu mới ở bước 3): Desk ghi "đã nhận …", khoản thu được ghi vào folio **khi bấm Hoàn tất**. Số cần thu đổi sau khi nhập: bấm **Bỏ khoản thu này**, nhập lại theo số mới (không thu khách lần nữa).
- Khách đi khi chưa trả đủ: **dừng**, gọi quản lý ghi công nợ. Lễ tân không ghi công nợ. Người trực hiện nay có vai quản lý thì tự bật **Ghi công nợ – khách trả sau** ở bước 3 trên phiên của mình, theo tệp 01 mục 6.
- Có yêu cầu miễn đang chờ duyệt: chưa hoàn tất được tới khi có kết quả, hoặc rút yêu cầu và thu đủ.
- Sau khi hoàn tất, folio đã chốt. Sửa phải nhờ quản lý (trong 24 giờ). Lễ tân trở lên **Thêm phát sinh** sau trả phòng được trong 24 giờ: mở đơn **Đã trả phòng** → **Thêm phát sinh** → **Khoản**, **Số lượng**, **Ghi chú** → **Thêm vào folio**. Khoản phạt hoặc đền bù: **Ảnh hoặc ghi chú bằng chứng** bắt buộc. Quá 24 giờ: Desk khóa folio, không ai thêm hay sửa được; phát hiện mới ghi sổ giao ca kèm mã đơn, báo chủ đầu tư.

> **Lỗi nhỏ đã biết (v1.0.1):** các nút nhanh ở bước **Phụ phí** (giặt ủi, F&B, hút thuốc, mất thẻ) mở hộp nhưng **chưa chọn sẵn khoản**: chọn tay khoản trong ô **Khoản**. Khung đơn đang ở hiện dòng "Còn phải thu" hai lần, cùng một số.

### 11.2 Phiếu thanh toán (bill)

1. Xem trước phiếu ở **bước 3 Bill & thu tiền** (bản xem trước, chưa có số phiếu). Bản xem trước cũng có nút **In phiếu**, nhưng tờ in ra ghi "Bản xem trước – số phiếu được cấp khi hoàn tất trả phòng": **không đưa tờ này cho khách**.
2. Sau khi hoàn tất, mở phiếu: nút **Xem Phiếu thanh toán** trên màn hoàn tất (cạnh **Về chi tiết đơn**), hoặc khung đơn **Đã trả phòng** → **Xem Phiếu thanh toán**.
3. Chọn **Ngôn ngữ phiếu**: **Tiếng Việt** hoặc **Việt – Anh**. Phiếu đã có **Số phiếu**.
4. **Chỉ in sau khi hoàn tất.** Bấm **In phiếu** → hộp in của trình duyệt in **một tờ A4** chỉ có phiếu.
5. Khách cần bản điện tử: trong hộp in chọn **Lưu dưới dạng PDF**, rồi gửi riêng 1–1 cho khách từ tài khoản của OTTIMO (mục 4.1). Không chụp màn hình phiếu gửi khách qua chat.

[ẢNH: C2-35-Phiếu thanh toán, In phiếu]

### 11.3 Trả muộn

**Mức phụ thu trả muộn** (trên giá đêm cuối):

| Khách rời | Desk tính |
|---|---|
| Đến **12:30**, căn **không** có khách đến cùng ngày | Không phụ thu (ân hạn) |
| Sau 12:00 – đến **15:00** | **30 %** |
| Sau 15:00 – đến **18:00** | **50 %** |
| Sau **18:00**, đêm đó căn **còn trống** | Tính **thêm 1 đêm** (giá đêm thêm sửa được trong khoảng sàn–trần) |
| Sau **18:00**, đêm đó căn **đã có khách đến** | Phụ thu **bằng giá 1 đêm** – mục 11.4 |

Căn có khách đến cùng ngày thì không có ân hạn 12:30.

Khách dài hạn: trả tới 15:00 không phụ thu nếu căn không có khách đến. Ngày đầu nhận từ 06:00 không phụ thu nếu căn trống đêm trước. Phụ thu (nếu có) tính trên **tiền thuê tháng theo hợp đồng ÷ 30**. Chưa chắc Desk tính đúng với đơn dài hạn nhập tay: báo quản lý, không tự thu.

**Hẹn trả muộn trước:**
1. Khung đơn → **Trả muộn**. Nhập **Giờ trả đã hẹn** (dạng 24 giờ, ví dụ 12:30).
2. Desk hiện **Phụ thu đề xuất** (ví dụ 14:30 → 30 % giá đêm cuối). Báo khách, tích **Tôi đã báo khách khoản phụ thu này**. Khách xin miễn: **Xin miễn phụ thu (gửi duyệt)**.
3. Bấm **Lưu giờ trả …**. Việc dọn ghi "dọn sau …". Kéo dài mã cửa trên app khóa.
4. Căn có khách đến và **không còn căn thay**: Desk chỉ cho **Gửi quản lý duyệt**. Giờ trả chưa đổi tới khi được duyệt. Gợi ý khách gửi hành lý.

[ẢNH: C2-27-Trả muộn]

### 11.4 Khách ở quá 18:00 mà đêm đó căn đã bán cho khách khác

1. **Phòng trước**: từ 12:00, chốt giờ đi với khách đi hôm nay nếu căn có khách đến tối nay.
2. Khách vẫn ở quá 18:00: lễ tân trưởng hoặc quản lý **đổi căn cho khách sắp đến** sang căn trống khác (cùng hạng trước, lý do "OTTIMO đổi – giữ giá đã đặt"). Khi đó đêm nay căn trống lại, Desk tính thêm 1 đêm cho khách ở quá giờ như thường.
3. Không còn căn trống: **gọi quản lý** (không được thì chủ đầu tư) báo trước. Không chờ duyệt, không xin mật khẩu.
4. Trả phòng như mục 11.1. Bước **Phụ phí** hiện **Trả sau mốc trả muộn**: "Đêm nay căn đã có khách nên không bán thêm đêm được. Thay vào đó thu phụ thu trả muộn bằng giá 1 đêm".
5. Bước **Bill & thu tiền**: mục **Cách xác nhận khoản phụ thu** đã chọn sẵn **Ghi phụ thu – quản lý xem lại**. Số do Desk tính, **không sửa được**, **không có ô miễn**. Ghi **Lý do** (ví dụ "Rời 20:30, căn có khách đến tối nay").
6. Thu đủ số Desk hiện. Bấm hoàn tất. Quản lý nhận thông báo để xem lại trong 24 giờ.
7. Khách xin giảm: **không hứa**. Nói: quản lý xem lại trong 24 giờ; nếu được giảm, OTTIMO hoàn lại.
8. Khách không chịu trả: **không hoàn tất trả phòng**, gọi quản lý hoặc chủ đầu tư.
9. Desk báo "Phụ thu vừa được tính lại" hoặc "Đêm nay căn đã trống lại…": số đã tải lại, làm theo số mới.

[ẢNH: C2-34-Trả sau 18:00, ghi phụ thu quản lý xem lại]

### 11.5 Khách trả phòng sớm

Khách báo sẽ rời trước ngày đi: làm theo **mục 17.5** (cách tạm tới v1.0.1). Không hứa số hoàn, không hoàn tiền tại quầy, **không mở màn Trả phòng trước ngày đi**.

### 11.6 Khách để quên đồ

Ghi sổ đồ thất lạc, báo quản lý với đồ giá trị.

### 11.7 Hóa đơn GTGT

> **Tạm ở v1.0:** Desk chưa xuất hóa đơn điện tử (có ở v1.3). Lễ tân **ghi thông tin công ty** ở bước 3 trả phòng (**Khách lấy hóa đơn công ty**) khi khách cần.
> - Cuối mỗi ca, ghi vào sổ giao ca **mọi phiếu thanh toán đã cấp trong ca**: số phiếu, mã đơn, tổng tiền, cách thu, cột "Hóa đơn công ty" (Có/Không). Không ghi số giấy tờ, số thẻ.
> - Kế toán xuất hóa đơn ngoài Desk, **ngày hóa đơn là ngày trả phòng**.
> - Đơn OTA đã trả trước: không hứa với khách số tiền trên hóa đơn; ghi thông tin và chuyển kế toán.
> - Giá niêm yết đã gồm VAT; phiếu thanh toán ghi "Giá đã gồm thuế GTGT".

[ẢNH: C2-36-Hóa đơn công ty]

---

## 12. Công nợ, hoàn tiền và tiền mặt tại quầy

### 12.1 Công nợ

- **Thu công nợ**: khung đơn hoặc **Cần chú ý** → **Thu công nợ** → **Cách thanh toán**, **Tiền** → **Ghi nhận đã thu …**. Thu một phần được.
- **Ghi công nợ**, **xóa công nợ**: chỉ quản lý, chủ đầu tư.

[ẢNH: C2-37-Thu công nợ]

### 12.2 Đề nghị hoàn và nhập nơi nhận hoàn

Khi hủy có cọc, khách trả thừa, khách trả sớm: Desk hoặc lễ tân tạo yêu cầu hoàn. Người tạo nhập nơi nhận ngay, **trên máy quầy đã cấp quyền**:
1. **Quản trị → Nhật ký tiền**, tab **Hoàn tiền**.
2. Tìm dòng theo **mã đơn** OTM-… và giờ gửi.
3. Bấm **Nhập nơi nhận hoàn**.
4. Chọn **Cách hoàn**. Desk chọn sẵn **Tiền mặt** – phải chọn lại cho đúng:
   - Khách nhận lại theo cách đã trả: bấm **Cùng cách khách đã trả**.
   - Chuyển khoản: chọn **Chuyển khoản** (phải gõ mã ngân hàng 6 số, chưa có danh sách chọn).
   - **Tiền mặt** chỉ khi chủ đầu tư đang ở quầy, hoặc đã hẹn một giờ cụ thể tới quầy.
5. Bấm **Lưu**. Dòng ghi "Cách hoàn: …" là xong. Yêu cầu vẫn **Chờ duyệt**.
6. Ghi sổ giao ca: mã đơn, số tiền hoàn, "chờ chủ đầu tư duyệt và chi". Không ghi tên khách.

[ẢNH: G2-04-Nhập nơi nhận hoàn, chọn Cách hoàn]

**Ai duyệt, ai chi:** người tạo yêu cầu hoàn **không tự duyệt, không tự chi**, kể cả có quyền quản lý. Người nhập nơi nhận **tiền mặt** không duyệt được khoản đó. Hiện một người trực: **chủ đầu tư duyệt và chi**.

### 12.3 Chi hoàn tiền mặt

Chỉ khoản **đã duyệt**, nơi nhận là tiền mặt, và **không phải** khoản do chính anh/chị tạo yêu cầu:
1. **Nhật ký tiền → Hoàn tiền** → dòng của mã đơn → **Chi hoàn tiền mặt**.
2. **Ảnh chứng từ**: biên nhận có chữ ký khách.
3. Xác nhận.
4. Ghi sổ giao ca: giờ, số tiền, mã đơn, chữ ký.

[ẢNH: C2-38-Chi hoàn tiền mặt]

> **Lỗi nhỏ đã biết:** sau khi chi hoàn, thông báo có dấu trừ thừa, ví dụ "Đã ghi hoàn -500.000 đ" (số ghi sổ đúng – v1.0.1).

Hoàn chuyển khoản do quản lý hoặc chủ đầu tư làm. Báo khách thời hạn đã hẹn.

### 12.4 Đối chiếu tiền mặt cuối ca

> **Tạm ở v1.0 (tới v1.3):** chưa có màn đóng ca. Dùng **sổ giao ca** giấy:
> 1. Két có **quỹ lẻ cố định** do chủ đầu tư đặt (ghi ở đầu sổ giao ca). Tiền vượt quỹ lẻ **nộp chủ đầu tư** (hoặc người chủ đầu tư giao) mỗi ngày; hai bên ký sổ.
> 2. Ai lấy tiền ra hoặc bỏ tiền vào két trong ca của người khác (chi hoàn, sale nộp tiền mặt, nộp tiền về chủ đầu tư) thì **ghi ngay một dòng vào sổ giao ca**: giờ, số tiền, mã đơn, chữ ký.
> 3. Cuối ca tính: **Tiền phải có = quỹ lẻ đầu ca + tiền mặt thu trong ca − tiền mặt chi trong ca − tiền nộp về**. Thu/chi của mình lấy từ **Nhật ký tiền → Nhật ký thao tác tiền** (lễ tân chỉ thấy khoản của mình). Thu/chi của người khác lấy từ sổ giao ca.
> 4. Đếm két. Ghi tiền phải có, tiền đếm, chênh lệch và lý do. Hai người giao và nhận cùng ký.
> 5. Chênh lệch khác 0: báo quản lý trong ca.
> 6. Ca đêm qua 00:00: lọc **Từ ngày** hôm trước **Đến ngày** hôm nay, chỉ cộng các dòng có giờ (cột **Lúc**) nằm trong ca.

Tiền mặt sale/CTV thu hộ nộp quầy: lễ tân bấm **Đã nhận tiền mặt** ở **Nhật ký tiền → Chờ đối soát**, ghi sổ giao ca.

---

## 13. Việc khác ở quầy

### 13.1 Yêu cầu từ website

Form "Yêu cầu đặt phòng" trên ottimo.vn **đã bật từ chiều 30/10**. Khi chủ đầu tư tắt form, màn **Yêu cầu từ website** hiện "Form đặt phòng trên website đang tắt". Khách liên hệ qua Zalo, điện thoại: tạo đơn như mục 5.1, **Nguồn** = **Website** nếu khách nói tìm thấy OTTIMO qua website.

Khi form bật: yêu cầu mới hiện ở menu **Yêu cầu từ website** kèm số. Mở yêu cầu → **Nhận xử lý** → **Báo giá** hoặc **Tạo đơn**; không thành đơn thì **Đóng – không thành đơn**.

> **Tạm ở v1.0 (tới v1.0.1 có tin báo qua Google Chat):** Desk chưa báo yêu cầu mới ra ngoài màn hình. Khi form bật:
> - Desk mở trên máy quầy và điện thoại người trực **07:00–22:00**. Xem **Yêu cầu từ website** mỗi lần cầm máy, và ngay sau mỗi việc ở quầy.
> - Hạn trả lời 15 phút áp trong **08:00–21:00**. Trả lời khách từ tài khoản OTTIMO (mục 4.1).
> - Yêu cầu tới ngoài giờ: bấm **Nhận xử lý** khi thấy, nhắn khách từ 08:00 sáng hôm sau.
>
> Từ v1.0.1 vẫn giữ Desk mở như trên. Tin Google Chat (mục 13.1a) chỉ giúp thấy yêu cầu nhanh hơn; **Desk vẫn là nguồn chính**.

[ẢNH: C2-39-Yêu cầu từ website, form tắt]

### 13.1a Tin báo yêu cầu qua Google Chat (từ v1.0.1)

**Áp dụng từ bản v1.0.1** (dự kiến khoảng 04/11/2026), khi chủ đầu tư báo bản đã lên. Từ bản này, tin Chat **có chi tiết khách**: tên, liên hệ, lời nhắn. Trước đó chưa có tin Chat: người trực giữ Desk mở 07:00–22:00 (mục 13.1).

- **Phòng:** **"OTTIMO – Yêu cầu đặt phòng"** trên Google Chat, tài khoản `@ottimo.vn`.
- **Thành viên:** chủ đầu tư, quản lý, lễ tân trưởng, lễ tân. Chủ đầu tư và quản lý là **quản lý phòng** (người được xóa tin, thêm, bớt người).
- **Không mở Google Chat trên máy quầy đã cấp quyền.** Chỉ dùng ứng dụng Google Chat trên điện thoại (cùng luật với Zalo ở mục 4.1: máy quầy không cài, không mở ứng dụng chat).

Desk tự đăng tin vào phòng khi:

| Khi nào | Tin có gì |
|---|---|
| Có yêu cầu mới, **mọi giờ, kể cả ban đêm** | Tin đầu: mã yêu cầu `REQ-…`, giờ nhận, hạn phản hồi, mức gấp (ví dụ "cần gọi ngay"), ngày ở, số khách, **tên, liên hệ, kênh khách chọn, lời nhắn**. Dòng cuối luôn là **Mở Desk** |
| Yêu cầu quá hạn mà chưa ai **Nhận xử lý** | Tin nhắc trong cùng luồng: chỉ mã và giờ |
| 07:30 sáng | Tin nhắc trong cùng luồng cho yêu cầu ban đêm còn chưa ai nhận |
| Yêu cầu vừa bị xóa theo yêu cầu người gửi (mục 13.1b) | Tin trong cùng luồng: "Đã xóa dữ liệu của … theo yêu cầu của khách…". Chỉ có mã |

Cách dùng:
1. Thấy tin: mở Desk, **Nhận xử lý** như mục 13.1. Trả lời khách từ tài khoản OTTIMO (mục 4.1), **không** trả lời khách từ Chat.
2. Báo đồng nghiệp trong phòng: chỉ ghi **mã yêu cầu** và việc ("đã nhận", "đã gọi"). **Không** gõ lại tên, số điện thoại, lời nhắn của khách.
3. **Tin thật từ Desk** luôn kết thúc bằng một dòng **Mở Desk** tới `desk.ottimo.vn`; lời nhắn của khách nằm trong khung chữ đơn sắc và mọi link trong đó đã bị vô hiệu. Tin khác dạng này, hoặc có link lạ: không bấm, báo chủ đầu tư.
4. Bấm **Mở Desk** chỉ trên điện thoại **đã đăng nhập Desk**. Trang mở ra mà hỏi mật khẩu, hoặc địa chỉ không đúng `desk.ottimo.vn`: đóng lại, vào Desk bằng dấu trang (mục 1.1).
5. Không chụp, không chép, không chuyển tiếp tin sang Zalo hay nơi khác.
6. Muốn yên tĩnh ban đêm: dùng **Không làm phiền** của Google Chat hoặc của điện thoại. Không rời phòng, không tắt hẳn thông báo của phòng.

**Tài khoản vào phòng:**
- Chỉ tài khoản **@ottimo.vn** đã bật **xác minh 2 bước của Google** (khác với 2 bước của Desk). Không dùng Gmail cá nhân, không dùng tài khoản chung.
- **Không mời** sale nội bộ, CTV, buồng phòng, bảo trì hay người ngoài OTTIMO vào phòng. Ai xin vào: báo chủ đầu tư.
- Mất điện thoại có Google Chat: báo chủ đầu tư ngay, như mất điện thoại có Desk (mục 19).

**Cài đặt bắt buộc trên điện thoại của mọi thành viên** – làm **trước khi** được thêm vào phòng; chủ đầu tư xem tận mắt:

| Việc | iPhone | Android |
|---|---|---|
| Máy có khóa màn hình | **Cài đặt → Face ID/Touch ID & Mật mã** → bật mật mã | **Cài đặt → Bảo mật → Khóa màn hình**: mã PIN, mật khẩu hoặc hình vẽ. Không chọn "Vuốt" hay "Không" |
| Ẩn nội dung thông báo trên màn hình khóa | **Cài đặt → Thông báo → Chat → Hiển thị bản xem trước → Khi được mở khóa** | **Cài đặt → Thông báo → Thông báo trên màn hình khóa → Ẩn nội dung nhạy cảm**. Tên mục khác nhau theo hãng ("Ẩn nội dung", "Chỉ hiện biểu tượng"): chọn mục không hiện chữ của tin |
| Tắt email thông báo của Google Chat | Làm một lần cho tài khoản, trên máy tính: mở `chat.google.com` → bánh răng **Cài đặt** → **Thông báo qua email** → **Tắt** | Như iPhone |

- Kiểm sau khi cài: nhờ người khác nhắn thử vào phòng khi máy đang khóa. Màn hình khóa chỉ hiện "Chat" hoặc "Tin nhắn mới", **không** hiện chữ của tin.
- Lỡ nhận thư "tin chưa đọc" của Google Chat trong Gmail: tự xóa thư đó.

### 13.1b Người gửi form xin xóa dữ liệu (xóa theo yêu cầu – WR8)

Khách đã gửi form trên website nhắn hoặc gọi xin xóa yêu cầu của họ.

- **Ai làm:** chủ đầu tư, quản lý, lễ tân trưởng (Desk chỉ hiện nút cho 3 vai này). Lễ tân: ghi mã yêu cầu hoặc giờ khách báo, chuyển lễ tân trưởng hoặc quản lý trong ca. Người trực hiện nay giữ vai quản lý: tự làm đủ các bước.
- **Phần trên Desk áp dụng ngay.** **Phần xóa trong Google Chat áp dụng từ v1.0.1.**

**Trên Desk:**
1. **Yêu cầu từ website** → gõ mã yêu cầu vào ô tìm, hoặc bấm **Tìm theo liên hệ** và nhập đúng một SĐT hoặc email khách đã dùng. Yêu cầu đã đóng vẫn tìm được.
2. Mở yêu cầu, cuộn xuống dưới khối **Liên hệ** → **Xóa theo yêu cầu người gửi**.
3. Chọn **Cách xác minh người xin xóa**:
   - **Họ liên hệ từ chính SĐT hoặc email trên yêu cầu**: nhập SĐT hoặc email họ đã dùng để liên hệ (Desk chỉ so khớp, không lưu); hoặc
   - **Tôi đã gọi lại đúng SĐT trên yêu cầu và người nghe xác nhận muốn xóa**.
   Không xác minh được: không xóa, ghi sổ giao ca **chỉ mã yêu cầu**, báo chủ đầu tư.
4. **Chép mã yêu cầu `REQ-…`** ra giấy nháp (chỉ mã) trước khi bấm **Xóa ngay**. Xóa xong không khôi phục được, yêu cầu đóng và không mở lại được.
5. Người gửi xin bản sao dữ liệu: chỉ gửi tới đúng liên hệ trên yêu cầu.
6. Yêu cầu đã thành đơn: Desk không xóa ở đây. Ghi lại, chuyển chủ đầu tư (mục 8.1).

**Trong Google Chat (từ v1.0.1):**

| Bước | Ai | Khi nào | Làm gì |
|---|---|---|---|
| 1 | Người xóa trên Desk | Như trên | Xóa trên Desk, đã chép mã yêu cầu |
| 2 | Người xóa trên Desk | Ngay sau bước 1 | Là chủ đầu tư hoặc quản lý: tự làm bước 3. Là lễ tân trưởng: nhắn quản lý (quản lý vắng thì chủ đầu tư) **chỉ mã yêu cầu** và chữ "xóa Chat theo WR8". **Không** chép tên, SĐT, lời nhắn |
| 3 | Quản lý phòng (quản lý; dự phòng chủ đầu tư) | **Trong 24 giờ** từ lúc xóa trên Desk | Trong phòng **"OTTIMO – Yêu cầu đặt phòng"**, tìm theo mã: gõ 8 ký tự sau "REQ-". Xóa **mọi tin của luồng đó**: tin đầu (có chi tiết khách), các tin nhắc, tin "Đã xóa dữ liệu…", và **mọi tin nhân viên trả lời** trong luồng. Tìm lại lần nữa để chắc không còn |
| 4 | Quản lý phòng | Ngay sau bước 3 | Ghi **sổ xóa Chat** (trang riêng cuối sổ giao ca): mã yêu cầu · ngày xóa trên Desk · ngày xóa Chat · người làm · "đã xóa" hoặc "không còn trong Chat". **Chỉ mã, không tên, không SĐT.** Không nhắn gì trong phòng Chat về việc xóa |
| 5 | Chủ đầu tư | Mỗi tháng, cùng lúc rà thành viên phòng | Đối chiếu sổ xóa Chat với các yêu cầu đóng lý do "Đã xóa theo yêu cầu của người gửi" trong tháng trên Desk. Mã nào chưa có dòng "đã xóa": làm ngay bước 3 |

- Cả quản lý và chủ đầu tư vắng, không ai xóa được trong 24 giờ: chủ đầu tư làm khi về, ghi lý do chậm vào sổ xóa Chat.
- Quản lý phòng không thấy nút xóa ở tin do Desk đăng: báo chủ đầu tư ngay, chủ đầu tư báo đội.
- Yêu cầu bị đánh dấu spam sau khi tin đã đăng: nên xóa luồng trong Chat như bước 3 (không bắt buộc).

### 13.2 Điều phối buồng phòng trên Desk

1. **Vận hành → Buồng phòng**: **Việc buồng phòng hôm nay** (tiến độ **… xong**) và **Trạng thái buồng** từng căn.
2. Thêm việc: **Việc mới** → hộp **Tạo việc buồng phòng**: **Căn**, **Loại việc**, **Ngày làm**, **Ghi chú cho buồng phòng** → bấm **Việc mới** ở cuối hộp.
3. Hủy việc: **Hủy việc** → **Lý do** (**Treo biển "Không làm phiền"**, **Khách nói không cần dọn**, **Lý do khác** – lý do khác phải ghi **Ghi chú**) → **Hủy việc**.
4. Làm thay buồng phòng: **Làm xong** ở dòng việc. Người trực hiện nay đánh dấu việc dọn ở đây (tài khoản có vai quản lý chưa vào được app nhân viên).

Trạng thái buồng: `VD` trống, cần dọn · `CL` đang dọn · `VC` đã dọn, chờ kiểm · `VI` đã kiểm, sẵn sàng · `OC` có khách, sạch · `OD` có khách, cần dọn · `OOO` khóa phòng, đang sửa. Nhận khách vào căn `VC` hoặc `VI`. Mỗi sáng 07:00, Desk chuyển các căn có khách sang "cần dọn".

[ẢNH: C2-40-Buồng phòng trên Desk, việc mới]

### 13.2a Khi chưa ai kiểm phòng được (người trực hiện nay)

Tài khoản giữ 6 vai chưa vào được app nhân viên, nên không ai bấm **Kiểm phòng** (`VC` → `VI`). Desk vẫn cho nhận khách vào căn `VC`. Việc kiểm bằng mắt **vẫn phải làm**, chỉ là không ghi trên app:
1. **Chỉ bấm Làm xong khi căn đã đạt.** Dọn xong căn trống (tự dọn, hoặc người dọn báo xong): đi một vòng căn theo 12 mục kiểm (ga gối, phòng tắm, khăn, đồ dùng, bếp, bàn làm việc, Wi-Fi, rèm/cửa sổ, mùi, remote/điều hòa/sưởi, thẻ chào…). Mở thử nước nóng và sưởi. Đạt hết mới bấm **Làm xong** ở dòng việc. Chưa đạt: dọn lại, chưa bấm.
2. **Căn trống từ đêm qua, có khách đến hôm nay:** rà xong **trước 11:00**, còn 1 giờ để xử lý trước giờ nhận phòng 12:00. **Căn khách trả mà có khách mới đến cùng ngày:** dọn ngay khi khách trả, bấm **Làm xong** **trước 14:00**.
3. **Căn trống quá 3 ngày:** rà lại trong ngày khách đến dù Desk đang hiện `VC`. Mở cửa sổ cho thoáng, xả nước nóng 1–2 phút, xem côn trùng, ẩm mốc, mùi. Ghi sổ giao ca: "Rà lại căn … – hh:mm".
4. **Căn khách trả mà chưa bấm Làm xong** vẫn là `VD`, Desk coi căn chưa sẵn sàng. Dọn và kiểm xong thì bấm ngay, đừng để cuối ngày.
5. **Khách đang ở không muốn dọn** (treo biển, khách nói không cần): **Hủy việc** → hộp **Hủy việc "…" – căn …?** → **Lý do**: **Treo biển "Không làm phiền"** hoặc **Khách nói không cần dọn** → **Hủy việc** (đổi ý: **Không, quay lại**). Ngày mai vẫn có việc dọn như thường.
6. Người dọn thuê theo giờ, không có tài khoản: người trực bấm **Làm xong** thay, sau khi tự đi kiểm theo bước 1.
7. Thứ tự dọn khi nhiều việc: như tệp 03 mục 2.

Khi OTTIMO có lễ tân trưởng không giữ vai quản lý: người đó kiểm trên app nhân viên (mục 14.2), bỏ mục này.

### 13.3 Ca đêm (00:00–05:59)

- Desk và app vẫn tính **ngày hôm trước**. Khách đến muộn của đơn hôm qua: nhận phòng như thường.
- Khách vãng lai đến ở luôn: tạo đơn, ngày đến là **ngày hôm trước**, tính 1 đêm. Ví dụ 02:00 sáng ngày 03/11: Desk tạo đơn ngày đến **02/11**, tính 1 đêm, trả phòng 12:00 ngày 03/11.
- Khách của đơn **hôm nay** đến trước 06:00: Desk thêm đêm trước (mục 7.4).
- Khách báo sẽ đến sau 22:00: hỏi giờ đến dự kiến và số điện thoại liên lạc lúc đến. Ghi sổ giao ca "OTM-… đến khoảng hh:mm". Đơn này **không** đánh dấu không đến lúc 23:00.
- Khách đến sau 22:00: người trực ra quầy, làm **đủ các bước nhận phòng như ban ngày** trên **máy quầy đã cấp quyền** (mục 7.3):
  1. Cho xem tờ **Your ID details** trước khi nhận giấy tờ.
  2. Nhận giấy tờ gốc.
  3. Hỏi đồng ý lưu ảnh (mục 8.2).
  4. Thu tiền: từ 22:00 mời tiền mặt hoặc thẻ (mục 18).
  5. **Nhận phòng**, rồi mới giao mã. Không giao mã trước khi xong giấy tờ. Không làm nhận phòng trên điện thoại.
- Hạn khai báo tính theo **giờ đồng hồ thật**. Khách Việt Nam đến 23:00–23:59: khai trước 08:00 sáng hôm sau. Đến 00:00–05:59: khai ngay trong ca, muộn nhất 08:00 sáng.

### 13.4 Báo hỏng hóc, khóa phòng

Khách báo hỏng: tạo phiếu ở **Vận hành → Bảo trì** → tab **Phiếu sửa** → **Phiếu sửa mới** → căn, **Tiêu đề**, **Mô tả**, **Mức độ**, ảnh. Căn không ở được: tích **Khóa căn – không bán đến khi sửa xong** → **Khóa từ**, **Dự kiến xong**, **Lý do khóa** → **Tạo phiếu và khóa căn**. Căn đang có khách: đổi phòng cho khách trước rồi mới khóa. Chi tiết: tệp 04.

> **Tạm ở v1.0 (tới v1.0.1):** tài khoản chỉ có vai Bảo trì chưa chọn được căn trên Desk, nên **không tạo phiếu, không khóa phòng được trên Desk**. Bảo trì báo sự cố trên app (tích **Đề nghị khóa căn**) hoặc nhắn lễ tân ngày, căn, lý do. **Lễ tân hoặc người trực** tạo phiếu và khóa phòng (cả **Khóa phòng có kế hoạch**) trên Desk theo mục này.

[ẢNH: C4-05-Phiếu sửa mới và khóa căn trên Desk]

---

## 14. Việc riêng của lễ tân trưởng

### 14.1 Danh sách việc

| Việc | Xem mục |
|---|---|
| Duyệt miễn/giảm trong hạn mức (≤ 300.000 đ/lần, ≤ 1.500.000 đ/tháng) ở **Cần duyệt** | 14.3 |
| Xác nhận nhận phòng khi buồng chưa sẵn sàng | 7.4 |
| Xác nhận nâng hạng khi gán căn hoặc đổi phòng | 5.3, 9.4 |
| Kiểm phòng trên app nhân viên (căn `VC` → `VI`), xong trước 12:00 với căn có khách đến | 14.2 |
| Đổi căn cho khách sắp đến khi khách cũ ở quá 18:00 | 11.4 |
| Giữ bảng kỳ thu khách dài hạn | 5.4 |
| Giữ danh sách kênh OTA đã đăng phụ thu | 7.1 |

### 14.2 Kiểm phòng trên app nhân viên

Ở v1.0, buồng phòng **không tự kiểm** phòng mình dọn. **Chỉ lễ tân trưởng** kiểm, trên app nhân viên. Chủ đầu tư và quản lý không kiểm được ở đâu trong v1.0.

1. Đăng nhập `staff.ottimo.vn` trên điện thoại (mục 1.8).
2. Nhận thông báo **Căn đã dọn – chờ kiểm**. Mở căn `VC` → nút **Kiểm phòng** → màn **Kiểm phòng … · …**.
3. Đi từng mục trong danh mục (12 mục: ga gối, phòng tắm, khăn, đồ dùng, bếp, bàn làm việc, Wi-Fi, rèm/cửa sổ, mùi, remote/điều hòa/sưởi, thẻ chào…), đánh dấu khi đạt chuẩn OTTIMO. App hiện **Đã kiểm …/12 mục**.
4. Đạt hết: **Kiểm đạt – sẵn sàng**. Căn chuyển **Sẵn sàng đón khách** (`VI`).
5. Chưa đạt: **Chưa đạt** → ghi chỗ chưa đạt → **Ghi chưa đạt**. Căn quay về **Cần dọn (khách đã đi)** và có việc dọn lại.

[ẢNH: C3-05-Kiểm phòng]

- Căn trống quá 3 ngày cần kiểm lại trước khi nhận khách.
- Kiểm phòng cần có mạng.
- Ngày lễ tân trưởng nghỉ, hoặc tài khoản có vai quản lý (người trực hiện nay), thì **không ai bấm kiểm được**. Lễ tân vẫn nhận khách vào căn **Đã dọn – chờ kiểm** (`VC`), sau khi căn đã được kiểm bằng mắt theo mục 13.2a.

### 14.3 Duyệt yêu cầu trong hạn mức

1. **Cần duyệt**.
2. Đọc: ai gửi, lúc nào, số tiền, lý do.
3. Bấm **Duyệt** → nhập **Mật khẩu đăng nhập** → xác nhận. Hoặc **Từ chối** → ghi **Lý do từ chối** + **Mật khẩu đăng nhập**.
4. Yêu cầu bị sửa sau khi mở: Desk báo, bấm **Tải lại** rồi quyết định.

[ẢNH: C1-13-Cần duyệt]
[ẢNH: C1-14-Hộp duyệt]

Không ai tự duyệt yêu cầu của chính mình, trừ khoản nằm trong hạn mức tự áp của vai. Lễ tân trưởng **không duyệt hoàn tiền**.

---

## 15. Khi mất mạng, mất điện

- Desk cần mạng để nhận phòng, thu tiền, giấy tờ, trả phòng. Mất mạng thì Desk chỉ cho xem dữ liệu lúc gần nhất, và chỉ khi trang đang mở sẵn.
- Thứ tự: dùng 4G điện thoại của cơ sở phát Wi-Fi cho máy quầy → mở Desk trên điện thoại cơ sở (chỉ để xem đơn và thu tiền; không dùng điện thoại cá nhân; xong thì đăng xuất) → **danh sách giấy và sổ giấy** (khung bên dưới).
- Chưa xem được phòng trống thì **không nhận đơn mới**: ghi số điện thoại, hẹn gọi lại.
- Có mạng lại: nhập bù trong 24 giờ, ghi đúng giờ thật và ghi chú lý do.
- Mất điện: an toàn của khách trước, sổ sách sau (mục 19).

> **Tạm ở v1.0 (tới v1.1):** chưa có bảng dự phòng in sẵn mỗi sáng.
> - 22:00 mỗi tối, lễ tân ca tối chép tay **danh sách khách đến và khách đi ngày mai** từ **Sơ đồ phòng / Đơn đặt phòng**:
>   - Khách đến: **mã đơn**, tên gọi, căn, giờ đến dự kiến, còn phải thu, số điện thoại.
>   - Khách đi: **mã đơn**, căn, giờ trả đã hẹn, còn phải thu. Không cần số điện thoại.
>   - **Không** ghi số giấy tờ, mã cửa, email, số tài khoản.
> - Danh sách luôn nằm **trong ngăn khóa**, chìa do người đang trực giữ. Không để trên mặt quầy, không chụp ảnh, không mang ra khỏi cơ sở, không gửi qua tin nhắn.
> - Chỉ giữ **một bản**. Chép bản mới xong thì hủy bản cũ ngay: **cắt nhỏ** (máy hủy giấy, hoặc xé ngang dọc nhiều lần), bỏ vào thùng rác khu nhân viên, không bỏ thùng rác sảnh.
> - Mất mạng: dùng danh sách để giao căn đã sạch cho khách có tên trong danh sách **sau khi xem giấy tờ gốc** của người đứng tên, thu tiền, ghi sổ giấy, nhập bù trong 24 giờ. **Không chụp giấy tờ khách bằng điện thoại** để nhập sau. Có mạng lại thì nhập giấy tờ trên máy quầy (khách đưa lại giấy tờ tại quầy) và giữ đúng hạn khai báo.
> - **Ba ngày đầu (02, 03, 04/11)** lễ tân ghi thêm **sổ giấy** (đơn, tiền thu), đối chiếu với Desk lúc 22:00.
> - **Sổ giấy** không ghi số giấy tờ, số thẻ, mã cửa. Hết dùng thì nộp chủ đầu tư cất két cùng chứng từ kế toán.

---

## 16. Tình huống thường gặp và không được làm

### 16.1 Tình huống thường gặp

| Tình huống | Làm gì |
|---|---|
| Desk báo "Căn vừa được người khác đặt trong lúc bạn nhập" | Thông tin vẫn còn; chọn căn khác rồi lưu |
| Desk báo "Đơn vừa chuyển sang … nên thao tác này không còn dùng được" | Người khác vừa thao tác; các nút đã cập nhật, làm lại theo trạng thái mới |
| Desk báo "Folio vừa thay đổi…" | Số mới đã tải; kiểm lại rồi lưu lần nữa |
| Không thấy bước giấy tờ khi nhận phòng | Máy chưa được cấp quyền; dùng máy quầy đã cấp hoặc nhờ chủ đầu tư cấp |
| Cần quản lý duyệt ngay tại quầy | Đăng xuất; quản lý đăng nhập tài khoản mình, mở **Cần duyệt**, duyệt, đăng xuất. Không gõ mật khẩu quản lý vào màn của mình |
| Khách OTA đã trả trước xin giảm giá | Không hứa. OTTIMO không giảm được tiền OTA đã thu. Có sự cố cần bù: miễn khoản phát sinh tại quầy, hoặc quản lý duyệt hoàn tiền bồi thường. Đơn OTA trả tại OTTIMO: gửi yêu cầu giảm giá đặc biệt |
| Khách nhờ gửi mã cửa qua Zalo, tin nhắn | **Không gửi.** Đọc câu ở mục 7.5 |
| Có người gọi đến xin mã cửa, kể cả nói đúng tên và mã đơn | Không đọc. Cúp máy, tự gọi lại số trên đơn |
| Mã VietQR hiện "Tài khoản nhận vừa đổi" | Chưa cho khách chuyển. Gọi chủ đầu tư xác nhận (mục 10.2) |
| Khách đọc số thẻ qua điện thoại "cho nhanh" | Không nhận. Mời trả tại máy POS ở quầy |
| Khách báo sẽ rời sớm | Mục 17.5. Không hứa số hoàn |
| Khách hỏi phòng sẵn sàng lúc mấy giờ | "Check-in is from 12:00. Your room is always ready by 14:00." / "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00." |
| Khách hỏi Wi-Fi | Đọc tên mạng và mật khẩu trên thẻ Wi-Fi trong căn. Đừng nói khách "xem Wi-Fi trên trang khách" (mục 17.6) |
| Khách muốn xem/xóa dữ liệu của mình | Ghi yêu cầu, chuyển chủ đầu tư |
| Người gửi form website xin xóa yêu cầu của họ | Mục 13.1b |
| Tin lạ trong phòng Google Chat (không có dòng **Mở Desk** cuối tin, có link lạ) | Không bấm, báo chủ đầu tư (mục 13.1a) |
| Đơn OTA về khi căn đã kín | Lưu chưa gán căn, báo quản lý; gán căn hoặc đổi phòng khách khác (mục 5.3) |
| Hoàn tác nhận phòng bị Desk từ chối | Folio đã có dòng mới; nhờ quản lý (mục 7.4) |
| Lỡ bấm sai một khoản thu | Báo quản lý **Đảo giao dịch**. Lễ tân không xóa được giao dịch |
| Phím Esc không đóng khung đơn | Bấm **Đóng** (sửa ở v1.0.2) |
| Tìm đơn theo tên khách không ra | Tìm theo mã đơn, mã OTA hoặc SĐT ở **Khách hàng** (sửa ở v1.0.2) |
| Báo giá thứ Sáu 1 đêm chỉ báo "tối thiểu 2 đêm" sau khi mở hộp | Đúng quy tắc; chọn 2 đêm (chữ sửa ở v1.0.2) |
| Desk báo "Phiên đăng nhập đã hết" | Đăng nhập lại; thông tin đang nhập vẫn được giữ trên máy đó |
| Vì sao 01:00 sáng Desk vẫn hiện ngày hôm qua? | Ngày trên Desk đổi lúc 06:00 |
| Desk lỗi, sai tiền, không làm tiếp được | Mục 19 |

### 16.2 Không được làm

- Không dùng chung tài khoản, không đọc mật khẩu qua điện thoại, không gõ mật khẩu quản lý vào màn của mình.
- Không chụp giấy tờ khách, không gửi giấy tờ qua Zalo/Messenger, không in giấy tờ ra để đó.
- Không nhận giấy tờ khi khách chưa được xem tờ **Your ID details**.
- Không gửi mã cửa bằng chữ hay ảnh qua bất kỳ kênh nào. Không đọc mã cho người gọi đến. Không ghi mã cửa ra giấy hay vào Desk.
- Không bấm "đã nhận" khi chưa chắc tiền về. Không tin ảnh chụp, SMS chuyển khoản.
- Không nhận số thẻ qua điện thoại, Zalo, email, giấy.
- Không cài, không mở Zalo/Zalo Web trên máy quầy. Không nhắn khách từ Zalo cá nhân.
- Không gửi ảnh QR cũ, không gõ số tài khoản bằng tay.
- Không ghi số giấy tờ, số thẻ, thông tin sức khỏe vào ghi chú, lý do, lời nhắn.
- Không chụp màn hình có dữ liệu khách để gửi ai, kể cả gửi đội kỹ thuật.
- Không hứa giá, chính sách hủy, số hoàn khác Desk.
- Không nhận khách vào căn `VD`, `CL`, `OD` mà không qua xác nhận của lễ tân trưởng. Không bao giờ nhận khách vào căn `OOO`.
- Không bán căn của đơn đã trả đủ/OTA đã thu trong đêm đánh dấu không đến, trước 06:00.
- Không thu tiền ngoài Desk.
- Không tạo, không gửi link check-in online cho khách thật (tới khi chủ đầu tư báo mở lại).
- Không chép tên, SĐT, lời nhắn của khách từ phòng Google Chat sang Zalo hay nơi khác. Không mở Google Chat trên máy quầy. Không mời ai vào phòng Chat (mục 13.1a).

---

## 17. Tạm thời tới v1.0.1

Các việc dưới đây làm theo cách tạm từ **02/11** tới khi **chủ đầu tư báo** bản v1.0.1 đã lên (dự kiến 04/11). Khi chủ đầu tư báo, bỏ cách tạm, làm theo Desk mới.

### 17.1 Rà giữ chỗ 3 mốc mỗi ngày

**Vì sao:** Desk chưa đưa giữ chỗ quá hạn vào **Cần chú ý** hay hộp thông báo. Giữ chỗ **có yêu cầu giảm giá hoặc miễn phí (FOC)** thì không tự hủy, kể cả khi chưa cọc. **Sau hạn chỉ còn Hủy giữ chỗ**: Desk từ chối **Xác nhận đã nhận cọc** ("Giữ chỗ đã hết hạn…"), ẩn **Gia hạn giữ chỗ**, chưa có "Chấp nhận cọc thiếu".

**Desk ghi sai với giữ chỗ có cọc:** khung đơn ghi "Giữ chỗ đã hết hạn lúc … – **đơn đã tự hủy**", câu lỗi ghi "căn đã **mở bán lại**". Thực tế đơn **chưa** hủy (trạng thái vẫn **Giữ chỗ · chờ cọc**), căn vẫn bị giữ, tiền khách vẫn trên đơn. Hộp hủy ghi "**Không thu phí (giữ chỗ chưa cọc)**" và không hiện dòng hoàn: **đừng tin dòng này** – Desk vẫn tạo yêu cầu hoàn đủ số đã nhận.

**Khi nào rà:** lúc mở quầy (muộn nhất 09:00) · **11:00** · lúc đóng quầy (muộn nhất 21:00) · mỗi lần thấy **Giữ chỗ sắp hết hạn**.

**Ở mốc 3 (đóng quầy):** mọi giữ chỗ có hạn **trước 09:00 sáng mai** coi như "còn dưới 2 giờ" và xử lý ngay theo (1):
- tiền đã về thì xác nhận;
- khách cần thêm thời gian thì **Gia hạn giữ chỗ (1 lần)** để hạn mới rơi sau 09:00 (không quá 12:00 ngày đến);
- khách không đi nữa thì hủy.

Lý do: sau 22:00 không ai xác nhận được tiền về, và sau hạn Desk chỉ còn **Hủy giữ chỗ**.

**Rà ở đâu:**
1. **Vận hành → Đơn đặt phòng**.
2. Lọc **Đang hiệu lực**.
3. Mở từng dòng **Giữ chỗ · chờ cọc** (10 căn, 1–2 phút).

**Hôm nay** chỉ có giữ chỗ đến hôm nay; **Sơ đồ phòng** chỉ hiện 14 ngày – hai màn này chỉ để nhìn nhanh.

[ẢNH: G2-05-Đơn đặt phòng, lọc Đang hiệu lực, dòng Giữ chỗ chờ cọc]
[ẢNH: G2-06-Khung đơn giữ chỗ quá hạn, còn 0 giờ 00 phút đỏ]

**Xử lý theo thứ tự:**

**(1) Còn dưới 2 giờ:** xử lý **trước hạn** (mục 4.5): thu đủ rồi xác nhận, gia hạn 1 lần, hoặc hủy. Đây là việc chính.

**(2) Chưa cọc mà đã "còn 0 giờ 00 phút"** (trong tệp gọi tắt là "0h00"; thường là đơn có yêu cầu giảm giá/FOC):
- **Hủy giữ chỗ** ngay khi thấy, không chờ gọi khách. **Lý do hủy**: **Không liên lạc được** (khách không cọc tới hạn). Không chọn **Khác (ghi rõ)** (mục 17.2).
- Ghi sổ giao ca "OTM-… hủy – hết hạn giữ chỗ, chưa cọc". Không phí. Căn mở lại.
- Nhắn hoặc gọi khách (đơn CTV: nhắn CTV trước; CTV liên hệ khách trong 1 giờ, quá 1 giờ hoặc đã 11:00 ngày đến thì gọi thẳng số khách trên đơn). Khách còn muốn:
  - **Đến từ ngày mai:** tạo **giữ chỗ mới**, chọn **12 h** nếu hạn rơi trước 21:00; nếu không thì chọn **24 h** (mục 4.3). Báo giá cũ còn hiệu lực (3 ngày): bấm lại **Khách đồng ý – Giữ chỗ** từ báo giá đó; hết hiệu lực thì **Lập báo giá mới** theo giá hiện hành. Giảm giá hoặc FOC của đơn cũ không tự sang đơn mới: xin lại trên từng đêm của đơn mới, ghi lý do. Trong hạn mức quản lý (mỗi lần không quá giá 1 đêm), Desk áp ngay bằng quyền quản lý của người trực. Desk báo phải chờ chủ đầu tư duyệt: nhắn chủ đầu tư mã đơn và số tiền. Ghi sổ giao ca "Tạo lại từ OTM-… (hết hạn dd/mm)".
  - **Đến hôm nay:** không giữ chỗ được. Gửi VietQR, tạo đơn khi tiền về. Khách đang trên đường: căn còn thì nhận khi tới, như khách vãng lai.
- **Chỉ tạo lại một lần** cho cùng khách, cùng kỳ ở. Giữ chỗ tạo lại mà lại quá hạn: hủy, không giữ nữa.
- Không cần báo ai. Báo chủ đầu tư chỉ khi khách đòi giữ giá cũ mà báo giá đã hết hiệu lực và giá hiện hành cao hơn.

**(3) Đã có cọc mà đã "còn 0 giờ 00 phút":** gọi khách, rồi làm theo bảng dưới. **Không** bấm **Xác nhận đã nhận cọc** (Desk từ chối). **Không** tạo đơn mới trước khi hủy đơn cũ (Desk chặn trùng, hoặc ghi cọc hai lần). Phải xử lý trước **12:00 ngày đến**.

Ví dụ: căn 202, 3 đêm 05–08/11 = 2.376.000 đ, cọc yêu cầu 700.000 đ, khách đã chuyển 300.000 đ, hạn 10:00 03/11.

| Khách nói | Làm gì ở v1.0 | Ai, hạn |
|---|---|---|
| "Không đi nữa", hoặc không liên lạc được tới **11:00 ngày đến** | **Hủy giữ chỗ**, **Lý do hủy**: **Khách đổi ý** (khách báo không đi) hoặc **Không liên lạc được** (gọi không được). Không chọn **Khác (ghi rõ)**. Desk giữ lại 0 đ, tạo yêu cầu hoàn **300.000 đ** (hộp hủy không hiện dòng này). Trên máy quầy đã cấp quyền: **Nhật ký tiền → Hoàn tiền** → dòng của mã đơn → **Nhập nơi nhận hoàn** → **Cách hoàn**: bấm **Cùng cách khách đã trả** (Desk chọn sẵn **Tiền mặt** – phải đổi) → **Lưu**. Dòng ghi "Cách hoàn: Cùng cách khách đã trả" là xong. Ghi sổ giao ca "OTM-… hủy – hết hạn giữ chỗ, có cọc – chờ chủ đầu tư hoàn 300.000". **Chủ đầu tư duyệt** ở **Cần duyệt** rồi **chi** | Người trực hủy và nhập nơi nhận; **chủ đầu tư duyệt và chi**. Hủy muộn nhất 12:00 ngày đến |
| "Vẫn đi, trả nốt" (chuyển nốt hoặc trả khi đến) | **Không** nhận thêm chuyển khoản vào đơn cũ (Desk không ghi được sau hạn). **Để nguyên đơn**: Desk không tự hủy đơn có cọc, căn vẫn giữ. Ghi sổ giao ca: "OTM-… Giữ – cọc thiếu 400.000, thu khi đến – [người quyết] dd/mm". Báo khách: phần còn lại thanh toán khi nhận phòng | Người trực, bằng quyền quản lý. Quyết trước 12:00 ngày đến |
| Khách đó tới quầy (đơn vẫn **Giữ chỗ · chờ cọc**) | Xem các bước (a)–(d) ngay dưới bảng | Người trực (a–c); chủ đầu tư duyệt và chi (d). Khi khách đến |
| Khách đã lỡ chuyển nốt **sau** hạn | Tiền đã ở tài khoản OTTIMO nhưng Desk không ghi được vào đơn cũ. Kiểm tiền về như mục 10.3, rồi ghi sổ giao ca: mã đơn, số tiền, giờ tiền về. Mở đơn cũ xem **Đã thu**: khoản này đã có trên đơn cũ (lỡ bấm xác nhận qua VietQR) thì không ghi lại ở bước (b) – Desk hoàn cả khoản này khi hủy đơn cũ. Khi khách đến, làm như dòng trên. Phần đã chuyển ghi ở **bước (b)**, vào **Số tiền đã nhận**, **Cách thanh toán** **Chuyển khoản** (không chọn VietQR), ghi chú "chuyển dd/mm hh:mm". Chưa đủ **Cọc cần thu** (ví dụ đã chuyển 400.000, cọc 700.000): khách chuyển thêm 300.000 ngay, ghi chung **một** khoản chuyển khoản 700.000, ghi chú cả hai lần chuyển. Khách không chuyển thêm được: không gộp tiền mặt hay thẻ vào khoản này. Thu đủ cọc bằng tiền mặt hoặc thẻ; khoản đã chuyển sau hạn ghi sổ giao ca, chủ đầu tư chuyển trả về đúng tài khoản đã chuyển trong 24 giờ. Bước (c) chỉ thu phần còn lại | Người trực; chủ đầu tư đối chiếu sao kê sáng hôm sau |

**Khách tới quầy, đơn vẫn Giữ chỗ · chờ cọc:**
- **Nếu chủ đầu tư đã báo v1.0.1 lên**: **Xác nhận đã nhận cọc** phần còn lại → **Nhận phòng**.
- **Nếu chưa**:
  - **(a)** **Hủy giữ chỗ** đơn cũ, **Lý do hủy**: **Khách đổi ý** → Desk tạo yêu cầu hoàn 300.000. **Nhập nơi nhận hoàn** ngay: **Chuyển khoản** (cách nên dùng). **Tiền mặt** chỉ khi chủ đầu tư đang ở quầy, hoặc đã hẹn qua điện thoại một giờ cụ thể tới quầy trong thời gian khách ở. (Hộp **Nhập nơi nhận hoàn** chọn sẵn **Tiền mặt**: chọn đúng **Cách hoàn** rồi bấm **Lưu**.)
  - **(b)** **Đặt phòng mới** cùng căn, nhập đúng giá từng đêm đã chốt, **cùng Kênh và Nguồn / CTV chốt đơn** như đơn cũ (không chọn **Khách vãng lai**). **Thu cọc ngay lúc đặt**: **Số tiền đã nhận** ít nhất bằng **Cọc cần thu** (ví dụ 700.000), chọn **Cách thanh toán** – Desk không lưu đơn khi chưa đủ cọc. Desk chọn sẵn **Chuyển khoản VietQR**: đổi đúng cách khách đã trả trước khi bấm **Tạo đơn**. Ghi sổ giao ca "OTM-mới thay OTM-cũ". Đơn cũ có giảm giá hoặc FOC: xin lại trên đơn mới như ở (2) "Đến từ ngày mai", trước khi thu ở bước (c).
  - **(c)** Ở bước nhận phòng thu **phần còn lại** (ví dụ 2.376.000 − 700.000 = **1.676.000**) → **Nhận phòng**.
  - **(d)** **Chủ đầu tư duyệt và chi** 300.000: tiền mặt tại quầy (khách thực trả 2.076.000), hoặc chuyển khoản lại. **Chủ đầu tư vắng thì khách chưa nhận lại cọc cũ tại quầy được**, kể cả khi người trực có quyền quản lý. Nói thật với khách:
    - EN: "We will transfer your 300,000 VND deposit back to you within 24 hours."
    - VI: "OTTIMO sẽ chuyển khoản lại 300.000 đ tiền cọc cho anh/chị trong vòng 24 giờ."
  - Chỉ hẹn tiền mặt khi chủ đầu tư đã hẹn giờ tới quầy. Ghi cách hẹn và giờ hẹn vào sổ giao ca, nhắn chủ đầu tư ngay mã đơn và số tiền (không ghi tên khách).

Không hạ giá đêm để cọc yêu cầu thấp xuống cho đủ: làm sai giá và doanh thu.

**Sổ giao ca:** mỗi đơn đã xử lý một dòng – mã đơn, đã làm gì, lý do thật (không ghi tên khách). **Lúc đóng quầy**: mọi giữ chỗ 0h00 đỏ đã hủy, hoặc đã có dòng "Giữ – …". Đơn đã có dòng đó không phải xử lý lại ở lượt rà sau. Chủ đầu tư xem lại các dòng có chữ "giữ chỗ" và các yêu cầu hoàn mới trong lượt kiểm sáng.

Khi OTTIMO có thêm lễ tân: rà ở đầu mỗi ca, và việc quyết đơn có cọc thiếu chuyển về quản lý.

### 17.2 Không dùng lý do hủy "Khác (ghi rõ)"

Ở cả **Hủy giữ chỗ** và **Hủy đơn**, chọn **Khác (ghi rõ)** thì hộp báo "Chưa tính được phí hủy nên chưa hủy được" và khóa nút, kể cả khi đã gõ ghi chú và bấm **Thử lại**.
- Chọn lý do có sẵn gần nhất: **Không liên lạc được** (gọi không được, khách không cọc tới hạn) hoặc **Khách đổi ý** (khách không đi, hoặc làm lại đơn khi khách đến).
- Nhập nhầm hoặc trùng đơn: chọn **Khách đổi ý**, sổ giao ca ghi "OTM-… nhập nhầm".
- Điều cần giải thích ghi vào sổ giao ca kèm mã đơn, không ghi tên khách.

[ẢNH: G2-07-Hộp Hủy giữ chỗ, danh sách Lý do hủy]

### 17.3 Check-in online tạm dừng

- **Không tạo, không gửi link check-in online cho khách thật**, kể cả đơn chuyển đổi ngày D. Mọi khách làm giấy tờ tại quầy: cho xem tờ **Your ID details** trước khi nhận giấy tờ (mục 7.2), rồi hỏi đồng ý lưu ảnh ở Khối 1 (mục 8.2).
- Khách muốn gửi yêu cầu trong lúc ở: nhắn Zalo hoặc gọi lễ tân.
- Đơn **giữ chỗ** cũng hiện nút **Tạo link check-in online**: không bấm (Desk luôn từ chối với đơn giữ chỗ).
- **Lỡ gửi link:** mở đơn → **Thu hồi link** ngay. Ghi **mã đơn** vào sổ giao ca (không ghi tên khách), báo chủ đầu tư trong ngày. Khách tới quầy thì cho xem tờ **Your ID details** như mọi khách. Không xóa ảnh khách đã gửi (cần cho khai báo lưu trú).
- Đội kiểm mỗi sáng số link mới tạo trên Desk thật; khác 0 thì đội báo chủ đầu tư mã đơn để đối chiếu với sổ giao ca.
- Chỉ gửi link lại khi chủ đầu tư báo "mở lại check-in online". Trên Desk tập vẫn tập các bước với dữ liệu giả.

[ẢNH: C2-14-Link check-in online]

### 17.4 Chủ đầu tư duyệt và chi mọi khoản hoàn

- Người trực tạo yêu cầu hoàn (hủy, trả thừa, trả sớm) và **nhập nơi nhận hoàn** (mục 12.2).
- **Chủ đầu tư duyệt và chi.** Desk không cho người tạo yêu cầu tự duyệt, tự chi, kể cả có quyền quản lý.
- Chủ đầu tư vắng: khách chưa nhận lại tiền tại quầy được. Hẹn chuyển khoản lại **trong 24 giờ**, hoặc nhận tiền mặt khi chủ đầu tư đã hẹn giờ tới quầy (câu ở mục 17.1 (d)).
- Chủ đầu tư hoàn trong lượt kiểm sáng hôm sau, muộn nhất 24 giờ sau khi khách nhận phòng.

### 17.5 Khách trả phòng sớm

Desk chưa trả phòng được trước ngày đi. Khi khách báo rời sớm:
1. Ghi vào **sổ giao ca**: "OTM-…: khách báo rời ngày dd/mm lúc hh:mm, báo qua (Zalo/điện thoại/tại quầy)". Giờ báo quyết định tiền hoàn. **Không hứa số hoàn**, không hoàn tiền tại quầy. **Không mở màn Trả phòng trước ngày đi** (Desk sẽ báo lỗi khi hoàn tất).
2. Khi khách rời: thu thẻ (ghi số thẻ trả), **xóa mã trên app khóa ngay**, nhờ buồng phòng đếm minibar, kiểm hư hỏng. Món đã dùng và hư hỏng: **Thêm phát sinh** vào folio.
3. Khách nước ngoài: **cập nhật ngày đi trên cổng khai báo trong ngày khách rời**. Desk chưa nhắc việc này.
4. Buồng phòng: **Hủy việc** dọn khách ở lại các ngày sau, **Lý do**: **Lý do khác**, **Ghi chú** "Khách đã rời sớm". Tạo **Việc mới → Dọn trả phòng** cho ngày khách rời (mục 13.2).
5. Báo quản lý trong ca. Căn vẫn hiện **Đang ở** tới ngày đi: **không** nhận khách khác vào căn này ngoài Desk. Có khách mới cần căn thì gọi quản lý.
6. Đúng ngày đi trên đơn: bấm **Trả phòng** như thường (giờ trả là giờ bấm, không ghi lùi), sổ giao ca ghi "đã rời ngày dd/mm". Quản lý giảm tiền phòng các đêm chưa ở trong 24 giờ (tệp 01). Chính sách: đơn Trực tiếp/CTV báo trước từ 1 ngày hoàn 50 % tiền các đêm chưa ở (phụ thu người các đêm đó hoàn 100 %); báo trong ngày rời không hoàn; đơn OTA theo kênh.

### 17.6 Lỗi đang sửa khác

| Lỗi | Cách tạm |
|---|---|
| Chưa nhập được Wi-Fi trên Desk; trang khách ghi "hỏi lễ tân" | Khách xem thẻ Wi-Fi trong căn; lễ tân đọc khi khách hỏi |
| Hộp **Đổi phòng** lẫn căn chưa dọn (`VD`) | Kiểm trạng thái căn trên Buồng phòng/Sơ đồ phòng trước khi chọn (mục 9.4) |
| Hộp **Xác nhận cọc** chưa có ô mã giao dịch | Ghi mã giao dịch vào sổ giao ca |
| Nút **Nhập nơi nhận hoàn** hiện trên máy chưa cấp quyền nhưng không lưu | Làm trên máy quầy đã cấp quyền (mục 1.5) |
| Folio đã khóa: câu báo ghi "Chỉ quản lý ghi được bút toán điều chỉnh" (sai – không ai ghi được) | Bỏ qua vế "chỉ quản lý". Thu công nợ; phát hiện mới ghi sổ giao ca, báo chủ đầu tư |
| Dòng miễn **Bị từ chối** vẫn hiện số âm ở màn Trả phòng | Đọc **Còn phải thu** |
| **Hoàn tác nhận phòng** bấm được nhưng bị từ chối khi folio có dòng mới | Nhờ quản lý (mục 7.4) |
| Một số chữ trên màn chưa đúng ("Khách đứng tên" ở người đi cùng, "Giờ trả phòng thực tế" ở xác nhận giờ trả, "Round 3 / R2", gợi ý mã cửa theo ngày sinh) | Làm theo tệp này |
| App nhân viên chưa có màn đổi mật khẩu tạm: còn mật khẩu tạm mà vào app thì mọi màn báo "Chưa tải được … Có thể do mạng yếu" (BUG-R3-052) | Đổi mật khẩu tạm trên Desk trước (mục 1.2), rồi đăng nhập lại app. Áp cả sau mỗi lần chủ đầu tư **Đặt lại mật khẩu** |
| Tài khoản chỉ có vai Bảo trì không chọn được căn trên Desk: không tạo phiếu, không khóa phòng được (BUG-R3-053) | Bảo trì báo trên app hoặc nhắn ngày, căn, lý do; lễ tân hoặc người trực tạo phiếu, khóa phòng trên Desk (mục 13.4) |

---

## 18. Bảng giờ

| Giờ | Việc |
|---|---|
| **06:00** | Ngày mới trên Desk. Trước 06:00 vẫn là ngày hôm trước |
| 07:00 | Bắt đầu trả lời yêu cầu của khách; Desk chuyển căn có khách sang "cần dọn". Từ 07:00 hỏi chủ đầu tư/quản lý để kiểm tiền về. Form website đã bật: Desk mở trên máy quầy và điện thoại người trực tới 22:00 (mục 13.1) |
| 07:30 (từ v1.0.1) | Google Chat nhắc các yêu cầu website ban đêm còn chưa ai nhận (mục 13.1a) |
| Sáng (từ 08:00) | Nhắn khách đi hôm nay xác nhận giờ trả. Hạn khai báo khách Việt Nam đến từ 23:00 hôm trước |
| Mở quầy, muộn nhất **09:00** | Rà giữ chỗ mốc 1 |
| 09:00 | Quản lý đối soát xong khoản chuyển khoản ghi ban đêm |
| **Trước 11:00** | Căn trống từ đêm qua có khách đến đã rà xong (mục 13.2a) |
| **11:00** | Rà giữ chỗ mốc 2 |
| **12:00** | **Giờ trả phòng.** **Nhận phòng từ 12:00** nếu căn `VC`/`VI`, không phụ thu. Trần hạn giữ chỗ ngày đến. Hạn kiểm phòng căn trống từ đêm qua có khách đến |
| 12:30 | Hết ân hạn trả muộn (chỉ khi căn không có khách đến cùng ngày) |
| **14:00** | Mọi căn có khách đến hôm nay **chắc chắn sẵn sàng** |
| 15:00 | Trả muộn từ 30 % lên 50 % |
| **18:00** | Gọi khách chưa đến. Sau 18:00 trả phòng: thêm 1 đêm, hoặc phụ thu bằng giá 1 đêm nếu căn đã bán |
| **Đóng quầy, muộn nhất 21:00** | Nhắn khách đi ngày mai xác nhận giờ trả. Rà giữ chỗ mốc 3, gồm giữ chỗ hết hạn trước 09:00 sáng mai. Sau 21:00 không nhắn khách; người trực vẫn trực điện thoại |
| 22:00 | Chép danh sách khách đến/đi ngày mai. Ba ngày đầu: đối chiếu sổ giấy với Desk. Từ 22:00 không xác nhận chuyển khoản qua điện thoại: mời tiền mặt/thẻ |
| **23:00** | Đánh dấu "Không đến" nếu vẫn không liên lạc được. Hạn khai báo khách Việt Nam. Xong thì đăng xuất máy quầy |
| +12 giờ từ giờ nhận | Hạn khai báo khách nước ngoài |
| +24 giờ từ trả phòng | Hạn ghi phát sinh sau trả phòng |
| +24 giờ từ khi xóa yêu cầu website trên Desk (từ v1.0.1) | Hạn quản lý phòng xóa tin trong Google Chat (mục 13.1b) |
| Thứ Tư 09:30–10:30 | Bản vá hằng tuần (Desk có thể chậm vài phút) |

---

## 19. Khi có sự cố – gọi ai

Số điện thoại của chủ đầu tư và người liên quan: **lưu sẵn trong danh bạ điện thoại cơ sở**. Không gọi số lạ gửi qua tin nhắn.

| Sự cố | Báo ai | Trong lúc chờ |
|---|---|---|
| Mất mạng tại quầy | Lễ tân trưởng | 4G điện thoại cơ sở → Desk trên điện thoại cơ sở → danh sách khách đến/đi chép tối qua + sổ giấy (mục 15) |
| Mất điện | Lễ tân trưởng → quản lý | Khóa cửa chạy pin vẫn mở bằng mã/thẻ. Đi một vòng các căn có khách, ưu tiên khách có trẻ nhỏ, người lớn tuổi. Báo khách thời gian dự kiến (nếu biết). Máy quầy chạy pin, dùng 4G điện thoại cơ sở, ghi sổ giấy. Mất điện riêng một căn có khách: báo sự cố mức **Gấp**, đổi phòng nếu cần. Quá 4 giờ: quản lý báo chủ đầu tư |
| Desk báo lỗi, không đặt / nhận / trả phòng / thu tiền được, hoặc **sai tiền** | Lễ tân trưởng → quản lý → **chủ đầu tư**. Lỗi "P0", đội sửa trong ngày | Ghi sổ giấy, nhập bù khi Desk chạy lại |
| Lỗi nhỏ, chữ sai, góp ý | Ghi sổ giao ca, chủ đầu tư chuyển đội | Làm tiếp |
| Quên mật khẩu, mất điện thoại, tài khoản bị khóa | Chủ đầu tư | Mục 1.7. Không dùng tài khoản người khác trong lúc chờ |
| Nghi lộ mật khẩu hoặc tài khoản lạ đăng nhập | **Chủ đầu tư ngay** | Đổi mật khẩu nếu còn vào được |
| Khách khiếu nại về dữ liệu cá nhân | Chủ đầu tư | Ghi lại yêu cầu, không hứa |
| Hỏng hóc trong căn | Phiếu sửa trên Desk; Gấp thì gọi bảo trì | Đổi phòng cho khách nếu cần |
| Mã VietQR hiện "Tài khoản nhận vừa đổi" mà chưa nghe chủ đầu tư nói | **Gọi chủ đầu tư ngay** | Chưa cho khách chuyển; mời trả tiền mặt hoặc thẻ |
| Mất điện thoại hoặc máy tính bảng có app khóa cửa | **Chủ đầu tư ngay** | – |
| Tờ **Your ID details** trên quầy hỏng hoặc mất | Chủ đầu tư (in lại trong ngày) | Thay ngay bằng bản dự phòng trong ngăn quầy, ghi sổ giao ca. Không có bản in nào và không có máy tính bảng đạt điều kiện: không nhận giấy tờ (mục 7.2) |

**Khi báo lỗi: mô tả bằng lời** – căn, mã đơn, giờ, đã bấm gì, Desk báo gì, và **mã tham chiếu** Desk hiện trong câu báo lỗi. **Không** ghi tên, số điện thoại, email, số giấy tờ của khách. **Không chụp màn hình có dữ liệu khách để gửi đội.** Không gửi mã cửa bằng chữ hay ảnh, kể cả khi đang có sự cố.

---

## 20. Từ ngữ và bài tập

### 20.1 Từ ngữ trên Desk

| Từ | Nghĩa |
|---|---|
| **Folio** | Bảng tiền của một lượt ở: tiền phòng, phát sinh, miễn giảm, đã thu, còn phải thu |
| **Phiếu thanh toán** (bill) | Bản in/xem của folio khi trả phòng, có số phiếu |
| **Phát sinh** | Khoản thêm ngoài tiền phòng: giặt ủi, đồ ăn, minibar, phí phạt |
| **FOC** | Miễn phí một khoản (free of charge). Cần lý do, có hạn mức theo vai |
| **Giảm giá đặc biệt** | Giảm tiền phòng dưới giá chính sách, phải được duyệt |
| **Hạn mức** | Số tiền tối đa một vai được tự miễn hoặc duyệt mỗi lần, mỗi tháng |
| **Sàn – trần** | Giá thấp nhất và cao nhất được phép nhập cho một căn |
| **Kênh** | Nơi khách đặt: Trực tiếp, CTV/môi giới, OTA, Nội bộ |
| **OTA** | Trang đặt phòng trực tuyến: Booking.com, Agoda, Airbnb, Expedia, Trip.com |
| **Extranet** | Trang quản lý của từng OTA, nơi đóng/mở phòng và xem đơn |
| **Giữ chỗ** | Đơn chưa cọc, giữ căn trong một thời hạn |
| **Cọc** | Tiền khách trả trước để chắc chỗ (30 % tiền phòng) |
| **VietQR** | Mã QR chuyển khoản đúng số tiền, nội dung là mã đơn |
| **Đối soát** / **Chờ đối soát** | Khớp khoản chuyển khoản trên Desk với sao kê / khoản ghi là đã thu nhưng chưa khớp sao kê |
| **Công nợ** | Tiền khách còn nợ sau khi đã trả phòng |
| **Đảo giao dịch** | Ghi một giao dịch ngược để hủy khoản thu ghi nhầm |
| **Ngày kinh doanh** | Ngày trên Desk, đổi lúc 06:00 |
| **Khai báo lưu trú** | Báo khách lưu trú với công an trên cổng khai báo, có hạn |
| **Máy được cấp quyền** | Máy quầy chủ đầu tư cho phép xem giấy tờ khách |
| **`VD`, `CL`, `VC`, `VI`, `OC`, `OD`, `OOO`** | Trạng thái buồng (mục 13.2) |
| **Desk tập** | Bản Desk dùng để tập, dữ liệu giả, không chuyển tiền thật |

### 20.2 Bảng tiền hay dùng (tham số 27/10/2026)

| Mục | Giá trị |
|---|---|
| Phụ thu nhận sớm | 06:00–09:59: 50 % · 10:00–11:59: 30 % giá đêm đầu · từ 12:00: 0 · trước 06:00: thêm 1 đêm |
| Phụ thu trả muộn | đến 12:30 (không có khách đến): 0 · đến 15:00: 30 % · đến 18:00: 50 % giá đêm cuối · sau 18:00: thêm 1 đêm hoặc bằng giá 1 đêm |
| Cuối tuần, ngày đặc biệt | Thứ Sáu, thứ Bảy +15 % · ngày đặc biệt +30 %: đêm 24/12/2026–01/01/2027, Tết đêm 05–10/02/2027, Giỗ Tổ đêm 16/4/2027, đêm 30/4 và 1/5/2027, đêm 1/9 và 2/9/2027 |
| Tối thiểu số đêm | 2 đêm khi ngày đến là thứ Sáu, thứ Bảy, ngày đặc biệt |
| Giảm theo số đêm | ≥ 7 đêm 10 % · ≥ 14 đêm 15 % (Trực tiếp, CTV) · ≥ 28 đêm là dài hạn |
| Cọc ngắn ngày | 30 % tiền phòng · đơn Trực tiếp thu đủ khi nhận phòng |
| Giữ chỗ | 12/24/48 giờ (mặc định 24), không quá 12:00 ngày đến, gia hạn 1 lần tối đa 24 giờ · báo giá giữ giá 3 ngày |
| Hủy (Trực tiếp, CTV) | Báo trước ≥ 7 ngày hoàn 100 % cọc · 3–6 ngày 50 % · < 3 ngày không hoàn · có đêm ngày đặc biệt: không hoàn · bất khả kháng: dời ngày trong 3 tháng |
| Phụ thu người vượt định mức | Người lớn (từ 12 tuổi) 150.000 đ/đêm · trẻ 6–11 tuổi 100.000 đ/đêm · dưới 6 tuổi miễn |
| Dịch vụ, phí | Dọn phòng lẻ 100.000 đ · giặt ủi 30.000 đ/kg (tạm) · khử mùi thuốc lá 500.000 đ · mất/hỏng thẻ 200.000 đ/thẻ (tối đa 2 thẻ/đơn) |
| Hạn mức miễn phí | Lễ tân tự miễn minibar ≤ 100.000 đ/lần, ≤ 500.000 đ/tháng · lễ tân trưởng ≤ 300.000 đ/lần, ≤ 1.500.000 đ/tháng |
| Giá | Đã gồm VAT 8 % |

### 20.3 Tập ở đâu, bài tập (3 giờ)

- Tập mọi thao tác trên **Desk tập** (dữ liệu giả) bằng **tài khoản tập**. Địa chỉ và tài khoản tập: chủ đầu tư đưa tận tay trong buổi đào tạo. Chỉ mở Desk tập bằng địa chỉ chủ đầu tư đưa; không bấm link "trang tập" gửi qua Zalo, email.
- Mật khẩu Desk tập **khác** mật khẩu Desk thật. Không dùng lại mật khẩu Desk thật ở bất kỳ trang nào khác. Tài khoản tập bị khóa sau buổi đào tạo cuối.
- Trên Desk tập: mã VietQR **không dùng để chuyển tiền**; không nhập giấy tờ, số điện thoại hay tài khoản thật.

Bài tập:
1. Đăng nhập lần đầu, đổi mật khẩu tạm, đăng xuất. Chỉ ra chip **Máy quầy đã cấp quyền**.
2. Báo giá → giữ chỗ → xác nhận cọc; nhận diện mã VietQR có dòng "Tài khoản nhận vừa đổi" và nói được việc phải làm.
3. Đặt phòng Trực tiếp và đơn OTA nhập tay.
4. Nhận phòng đủ 4 bước, có khách nhận sớm. Cho khách xem tờ **Your ID details** trước khi nhận giấy tờ, rồi đọc câu hỏi đồng ý lưu ảnh (EN và VI) ở Khối 1. Nói được điều kiện giao mã cửa và câu từ chối gửi mã qua tin nhắn.
5. Thêm phát sinh, gia hạn 1 đêm.
6. Trả phòng 3 bước, xem và in phiếu thanh toán.
7. Rà giữ chỗ ở **Đơn đặt phòng** → **Đang hiệu lực** → **Giữ chỗ · chờ cọc**; nói được 3 mốc rà, việc trước hạn, và cách xử lý sau hạn cho giữ chỗ chưa cọc (hủy ngay, tạo lại 1 lần) và có cọc (hủy – hoàn, hoặc để nguyên rồi làm lại khi khách đến); nhận ra dòng "đơn đã tự hủy" và "Không thu phí" sai với đơn có cọc; chọn đúng lý do hủy (không chọn **Khác**); **Nhập nơi nhận hoàn** với **Cùng cách khách đã trả**; nói được vì sao chủ đầu tư phải duyệt và chi khoản hoàn người trực tạo, và hẹn khách thế nào khi chủ đầu tư vắng.
8. Nói được việc phải làm khi lỡ gửi link check-in online.
9. Lễ tân trưởng thêm: duyệt một yêu cầu, kiểm phòng trên app nhân viên.
10. Người trực hiện nay thêm (trên Desk tập): dọn và kiểm một căn rồi bấm **Làm xong** (mục 13.2a); hủy một việc dọn với lý do **Khách nói không cần dọn**; tạo, nhận và đóng một phiếu sửa trên Desk (tệp 04 mục 4.4); nói được việc 22:00, 23:00 sau khi đóng quầy và cách nhận phòng khách đến sau 22:00 (mục 13.3).
