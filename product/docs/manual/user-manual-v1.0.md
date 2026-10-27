# Sổ tay sử dụng OTTIMO Desk v1.0

- Dành cho: Chủ đầu tư dùng để đào tạo từng bộ phận trước ngày chạy thật **thứ Hai 02/11/2026**
- Áp dụng cho bản: `v1.0.0-rc.3` (commit `70fe734`), đang chạy trên production từ 27/10/2026
- Lập: BA · Round 3 – Sản xuất · 27/10/2026 · Bản nội dung 1.0 (UXD dựng bản HTML theo nhận diện OTTIMO, QA chụp ảnh trên staging)
- Nguồn: `release-notes.md` (v1.0.0), `staff-one-pager.md`, `day-one-guide.md`, `business-rules.md` v0.4.7, `rbac-matrix.md` v0.2.5, chuỗi chữ thật của Desk và app nhân viên
- Repo công khai: sổ tay không chứa mật khẩu, mã 2 bước, mã khôi phục, số tài khoản, mã cửa, số giấy tờ hay địa chỉ máy chủ. Khi đào tạo, anh/chị cũng không ghi những thứ này lên bảng hay vào tài liệu phát tay.

## Cách đọc sổ tay

- Mỗi chương dành cho một bộ phận và đọc riêng được. Chương 0 và chương 5 dùng chung cho mọi người.
- Chữ **in đậm** là tên nút, tên màn hình, tên ô đúng như trên giao diện. Bản vá hằng tuần có thể đổi vị trí nút hoặc vài chữ nhỏ; việc phải làm thì giữ nguyên.
- `[ẢNH: mã-mô tả]` là chỗ sẽ chèn ảnh chụp màn hình. Danh sách ảnh: `product/docs/manual/screenshot-list.md`.
- Khung **Tạm ở v1.0** là việc bản này chưa làm được và cách làm thay cho tới bản sau.
- Con số (giờ, phần trăm, tiền) ghi theo tham số ngày 27/10/2026. Chủ đầu tư đổi được ở **Tham số quy tắc**. Khi số trên Desk khác số trong sổ tay, **làm theo Desk** và báo đội sửa sổ tay.

| Chương | Dành cho |
|---|---|
| 0. Mở đầu | Tất cả |
| 1. Chủ đầu tư và quản lý | Chủ đầu tư (OWN), quản lý (MGR) |
| 2. Lễ tân | Lễ tân trưởng (FDL), lễ tân (FD), người trực đêm |
| 3. Buồng phòng | Buồng phòng (HK), lễ tân trưởng phần kiểm phòng |
| 4. Bảo trì, sale, kế toán | Bảo trì (MT), sale nội bộ (SAL), CTV/môi giới, người làm kế toán |
| 5. Phụ lục | Tất cả |

---

## Chương 0. Mở đầu – dùng chung cho mọi người

### 0.1 Hệ thống gồm những gì

| Địa chỉ | Tên gọi | Ai dùng | Thiết bị | Dùng để |
|---|---|---|---|---|
| `desk.ottimo.vn` | **OTTIMO Desk** | Chủ đầu tư, quản lý, lễ tân, sale, CTV | Máy quầy, laptop; sale/CTV dùng được trên điện thoại | Đặt phòng, nhận/trả phòng, thu tiền, giấy tờ, duyệt, cài đặt |
| `staff.ottimo.vn` | **App nhân viên** | Buồng phòng, bảo trì, lễ tân trưởng (kiểm phòng) | Điện thoại | Việc dọn, kiểm phòng, báo sự cố, phiếu sửa |
| `g.ottimo.vn` | **Trang khách** | Khách của từng đơn | Điện thoại của khách | Làm thủ tục trước (check-in online), Wi-Fi, gửi yêu cầu trong lúc ở |
| `ottimo.vn` | **Website** | Khách tìm hiểu | Mọi thiết bị | Giới thiệu OTTIMO; nút Zalo, gọi điện, email |

- Trang khách không có tên đăng nhập. Mỗi đơn có một link riêng do lễ tân tạo (mục 2.9).
- Form "Yêu cầu đặt phòng" trên website **đang tắt** (ESC-030 A). Khách liên hệ qua Zalo hoặc điện thoại.

[ẢNH: C0-10-Trang khách trên điện thoại]

### 0.2 Đăng nhập Desk

1. Mở trình duyệt Chrome hoặc Safari, vào `desk.ottimo.vn`.
2. Nhập **Tên đăng nhập** và **Mật khẩu**. Bấm **Đăng nhập**.
3. Lần đầu: Desk mở màn **Đặt mật khẩu của bạn**. Nhập **Mật khẩu hiện tại** (mật khẩu tạm chủ đầu tư đưa), **Mật khẩu mới**, **Nhập lại mật khẩu mới**. Bấm **Lưu và vào ứng dụng**.
4. Chủ đầu tư và quản lý: nhập thêm mã 6 số (mục 0.3).
5. Desk mở màn chính theo vai: chủ đầu tư và quản lý vào **Tổng quan**; lễ tân vào **Hôm nay**; sale và CTV vào **Báo giá & giữ chỗ**.

[ẢNH: C0-01-Đăng nhập Desk]
[ẢNH: C0-02-Đặt mật khẩu lần đầu]

Quy tắc mật khẩu: ít nhất 10 ký tự, không chứa tên hoặc số điện thoại của mình, không phải mật khẩu phổ biến.

Luôn nhớ:
- **Mỗi người một tài khoản.** Không dùng chung. Không đọc mật khẩu qua điện thoại. Không gõ mật khẩu cho người khác.
- Rời máy thì bấm **Tài khoản** (góc trên) → **Đăng xuất**.
- Quên mật khẩu: nhờ chủ đầu tư **Đặt lại mật khẩu** (mục 1.5). Desk không có nút "quên mật khẩu".
- Gõ sai nhiều lần: Desk báo "Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại."

[ẢNH: C0-06-Menu Tài khoản]

### 0.3 Đăng nhập 2 bước (bắt buộc với chủ đầu tư và quản lý)

Ở v1.0, bước thứ hai là **mã 6 số trong ứng dụng xác thực** trên điện thoại (Google Authenticator, Microsoft Authenticator hoặc tương tự), kèm **10 mã khôi phục** dùng khi mất điện thoại. Desk v1.0 chưa đăng nhập bằng Face ID/vân tay (passkey).

**Bật lần đầu** (Desk tự mở màn **Bật xác thực 2 bước** ở lần đăng nhập đầu):
1. Cài ứng dụng xác thực trên điện thoại. Bấm **Tôi đã cài – Tiếp tục**.
2. Nhập mật khẩu đăng nhập. Bấm **Tạo mã QR**.
3. Trong ứng dụng xác thực: **Thêm tài khoản → Quét mã QR**, quét mã trên màn hình.
4. Nhập mã 6 số ứng dụng đang hiện. Bấm **Xác nhận**.
5. Desk hiện **10 mã khôi phục** một lần duy nhất. Bấm **In** hoặc **Tải về (.txt)**. Cất 2 nơi tách khỏi điện thoại (giấy trong két, trình quản lý mật khẩu). Không chụp ảnh, không gửi qua chat.
6. Tích ô **Tôi đã cất 10 mã này ở nơi an toàn, tách khỏi điện thoại**. Bấm **Hoàn tất**.

[ẢNH: C0-03-Bật xác thực 2 bước, mã QR]
[ẢNH: C0-04-Mười mã khôi phục]

**Đăng nhập hằng ngày:**
1. Nhập tên đăng nhập, mật khẩu, bấm **Đăng nhập**.
2. Màn **Nhập mã xác thực**: mở ứng dụng, nhập mã 6 số đang hiện. Bấm **Xác nhận**.

[ẢNH: C0-05-Nhập mã xác thực]

**Thao tác nhạy cảm** (thêm người dùng, đổi tài khoản nhận tiền, cấp quyền máy…): Desk mở hộp **Xác nhận bằng mật khẩu và mã xác thực**. Mỗi mã chỉ dùng một lần; vừa dùng thì chờ ứng dụng hiện mã mới.

**Sắp hết mã khôi phục:** Desk nhắc "Sắp hết mã khôi phục". Vào **Tài khoản → Xác thực 2 bước → Tạo bộ mã mới**. Bộ cũ hết hiệu lực ngay.

### 0.4 Mất điện thoại, quên mật khẩu

| Tình huống | Làm gì |
|---|---|
| Lễ tân, buồng phòng, bảo trì, sale quên mật khẩu | **Báo chủ đầu tư.** Chủ đầu tư đặt lại, đưa mật khẩu tạm tận tay |
| Nhân viên mất điện thoại có đăng nhập app nhân viên | **Báo chủ đầu tư ngay** để khóa tài khoản và đặt lại mật khẩu |
| Chủ đầu tư hoặc quản lý mất điện thoại, còn mã khôi phục | Ở màn nhập mã, bấm **Mất điện thoại? Dùng mã khôi phục**, nhập một mã, bấm **Đăng nhập bằng mã khôi phục**. Desk mở **Đăng ký lại trên điện thoại mới**: làm lại như mục 0.3 |
| Quản lý mất cả điện thoại lẫn mã khôi phục | **Báo chủ đầu tư.** Không xin mã của người khác |
| Chủ đầu tư mất cả điện thoại lẫn mã khôi phục | Chủ đầu tư làm theo thủ tục khôi phục riêng đã diễn tập với đội kỹ thuật (không ghi trong sổ tay này) |

Không ai trong đội kỹ thuật hỏi mật khẩu, mã 6 số hay mã khôi phục của anh/chị.

### 0.5 Máy quầy được cấp quyền

- Giấy tờ khách, ảnh giấy tờ và **Nhận phòng** chỉ làm được trên **máy đã được chủ đầu tư cấp quyền** (mục 1.6).
- Góc trái màn hình Desk hiện **Máy quầy đã cấp quyền** hoặc **Máy chưa cấp quyền giấy tờ**.
- Trên máy chưa cấp quyền, bước giấy tờ bị ẩn và Desk báo "Máy này chưa được cấp quyền". Điện thoại cá nhân không bao giờ được cấp quyền.

[ẢNH: C0-08-Chip máy quầy đã cấp quyền]

### 0.6 Ngày trên Desk đổi lúc 06:00

- Ngày kinh doanh bắt đầu **06:00**, không phải 00:00. Từ 00:00 đến 05:59, Desk và app nhân viên vẫn tính là **ngày hôm trước**.
- Ví dụ: 02:00 sáng ngày 03/11, khách vãng lai đến ở luôn. Desk tạo đơn ngày đến **02/11**, tính 1 đêm, trả phòng 12:00 ngày 03/11.
- Không ai bị tính thêm đêm chỉ vì đồng hồ qua 00:00.

### 0.7 Menu Desk theo vai

| Nhóm menu | Mục | Chủ đầu tư | Quản lý | Lễ tân trưởng | Lễ tân | Sale / CTV |
|---|---|:-:|:-:|:-:|:-:|:-:|
| Điều hành | **Tổng quan** | Có | Có | – | – | – |
| Điều hành | **Cần duyệt** | Có | Có | Có | – | – |
| Vận hành | **Hôm nay** | Có | Có | Có | Có | – |
| Vận hành | **Sơ đồ phòng** | Có | Có | Có | Có | – |
| Vận hành | **Đơn đặt phòng** | Có | Có | Có | Có | **Đơn của tôi** |
| Vận hành | **Giấy tờ & khai báo** | Có | Có | Có | Có | – |
| Vận hành | **Buồng phòng**, **Bảo trì** | Có | Có | Có | Có | – |
| Khách & bán | **Khách hàng** | Có | Có | Có | Có | **Khách của tôi** |
| Khách & bán | **Báo giá & giữ chỗ** | Có | Có | Có | Có | Có |
| Khách & bán | **Yêu cầu từ website** | Có | Có | Có | Có | Sale nội bộ |
| Quản trị | **Nhật ký tiền** | Có | Có | Có | Có | – |
| Quản trị | **Minibar** | Sửa | Sửa | Xem | Xem | – |
| Quản trị | **Danh mục căn**, **Tham số quy tắc** | Sửa | Sửa | Xem | Xem | Xem giá |
| Quản trị | **Người dùng & vai**, **Thiết bị được cấp** | Có | – | – | – | – |

[ẢNH: C0-07-Thanh menu Desk của lễ tân]

### 0.8 Nguyên tắc dữ liệu khách (Nghị định 13/2023)

1. **Giấy tờ khách chỉ nằm trên Desk.** Không chụp bằng điện thoại cá nhân, không gửi qua Zalo/Messenger, không in ra để đó.
2. Chỉ **lễ tân và quản lý** xem số giấy tờ đầy đủ và ảnh giấy tờ. Buồng phòng, bảo trì, sale, CTV không thấy. Đây là thiết kế, không phải lỗi.
3. Mỗi lần bấm **Xem đủ số / ảnh** đều được ghi nhật ký. Desk hỏi lại mật khẩu, có hiệu lực 15 phút; số và ảnh tự ẩn sau vài giây hoặc khi rời tab.
4. Hỏi khách có **đồng ý lưu ảnh giấy tờ** không. Không đồng ý vẫn khai báo được; ảnh bị xóa ngay khi cổng khai báo xác nhận.
5. Ảnh của khách đồng ý tự xóa sau số ngày Desk ghi trong câu hỏi đồng ý (v1.0: 30 ngày sau trả phòng; chủ đầu tư đã chọn 3 tháng, áp từ bản v1.0.1).
6. **Không ghi** số giấy tờ, số thẻ thanh toán, thông tin sức khỏe vào ô ghi chú, lời nhắn cho khách hay lý do. Desk chặn một số dãy số dài.
7. Trẻ em: chỉ cần năm sinh; số định danh trẻ không cần ảnh.
8. Khách xin xem, sửa, xóa dữ liệu của mình: ghi lại yêu cầu, **chuyển chủ đầu tư**. Ở v1.0 chủ đầu tư xử lý bằng tay.
9. Ảnh chụp màn hình gửi đội khi báo lỗi: **che** số giấy tờ, số tài khoản, mã QR, mã cửa.

### 0.9 Khi mất mạng, mất điện

- Desk cần mạng để nhận phòng, thu tiền, giấy tờ, trả phòng. Mất mạng thì Desk chỉ cho xem dữ liệu lúc gần nhất.
- Thứ tự: dùng 4G điện thoại của cơ sở phát Wi-Fi cho máy quầy → mở Desk trên điện thoại cơ sở → **sổ giấy**.
- Chưa xem được phòng trống thì **không nhận đơn mới**: ghi số điện thoại, hẹn gọi lại.
- Có mạng lại: nhập bù trong 24 giờ, ghi đúng giờ thật và ghi chú lý do.
- App nhân viên vẫn bấm được khi mất mạng; thao tác tự gửi khi có mạng (mục 3.9).

> **Tạm ở v1.0:** chưa có bảng dự phòng in sẵn mỗi sáng (có ở v1.1). **Ba ngày đầu (02, 03, 04/11)** lễ tân ghi thêm **sổ giấy** (đơn, tiền thu), đối chiếu với Desk lúc 22:00.

---

## Chương 1. Chủ đầu tư và quản lý (OWN, MGR)

> Trước khi bắt đầu: đọc mục 0.2 (đăng nhập), 0.3 (2 bước – bắt buộc với anh/chị), 0.8 (dữ liệu khách). Các mục ghi **Chỉ chủ đầu tư** thì quản lý không thấy menu.

### 1.1 Việc mỗi ngày

| Khi nào | Việc | Ở đâu |
|---|---|---|
| Sáng | Xem **Cần chú ý** và **Cần duyệt** | **Tổng quan** |
| Trong ngày | Duyệt yêu cầu miễn/giảm, hoàn tiền, xóa công nợ | **Cần duyệt** |
| Trong 24 giờ sau mỗi lần trả muộn quá 18:00 | Xem lại phụ thu bằng giá 1 đêm (mục 1.9) | **Tổng quan → Cần chú ý** |
| Mỗi ngày | Đối chiếu chuyển khoản với sao kê | **Nhật ký tiền → Chờ đối soát** |
| Cuối ngày (3 ngày đầu: 22:00 cùng lễ tân) | Đối chiếu tiền trong ngày với sổ giấy và két | **Nhật ký tiền** (mục 1.13) |

### 1.2 Màn Tổng quan

1. Đăng nhập. Desk mở **Tổng quan** (đêm nay).
2. Hàng số liệu: **Công suất đêm nay**, **Khách đến / đi**, **Đang ở**. Giữ chỗ chưa cọc và đơn OTA chưa gán căn không tính vào công suất.
3. **Cần duyệt (n)**: yêu cầu đang chờ anh/chị.
4. **Cần chú ý (n)**: việc cần xử lý (khai báo sắp hạn, công nợ, phiếu sửa quá hạn, phụ thu chờ xem lại…). Dòng **Chỉ chủ đầu tư thấy** là cảnh báo miễn phí vượt ngưỡng.
5. Mỗi dòng có nút **Mở** hoặc nút xử lý ngay (**Thu công nợ**, **Xóa công nợ**, **Đã xem**, **Đã xử lý**). Dòng khẩn phải ghi **Ghi chú xử lý**.
6. Màn tự tải lại khoảng 30 giây một lần.

[ẢNH: C1-01-Tổng quan]

### 1.3 Danh mục căn, giá đêm và giá tháng

Theo quyết định 26/10 (FB-INV-005, ESC-036 A):
- **Giá đêm niêm yết** và **Giá tháng** nhập **riêng**, độc lập. Đổi giá này không đổi giá kia.
- Giá đêm là giá **đêm ngày thường, kênh Trực tiếp, cho định mức của căn, đã gồm VAT**, bội số 1.000 đ.
- Desk **tự cộng** đêm thứ Sáu, thứ Bảy **+15 %** và ngày đặc biệt (Tết, 30/4–1/5, 2/9, 24/12–1/1) **+30 %**. Anh/chị **không** nhập giá cuối tuần riêng.
- Đơn ≥ 7 đêm Desk tự giảm 10 %, ≥ 14 đêm giảm 15 % (kênh Trực tiếp, CTV).

**Đổi giá một căn:**
1. **Quản trị → Danh mục căn**. Bảng có cột **Giá tháng**, **Giá đêm niêm yết**, **Bán**.
2. Bấm **Sửa** ở dòng căn.
3. Mục **Giá niêm yết**: nhập **Giá tháng** và/hoặc **Giá đêm niêm yết**.
4. Chọn **Hiệu lực từ** (hôm nay hoặc ngày sau).
5. Nhập **Lý do đổi giá**. Bấm **Lưu**.
6. Desk báo "Đã lưu căn …" hoặc "Đã lưu căn …. Giá áp dụng từ …".

[ẢNH: C1-02-Danh mục căn]
[ẢNH: C1-03-Sửa căn, giá đêm và giá tháng]

Lưu ý:
- Desk cảnh báo khi giá đêm thấp hơn giá tháng chia 30 ngày. Nếu đúng ý anh/chị, vẫn lưu được.
- Đơn, báo giá, hợp đồng tạo **trước** ngày hiệu lực **giữ giá cũ**.
- **Lỡ lên lịch nhầm một giá tương lai:** mở **Sửa**, chọn **đúng ngày hiệu lực** của giá nhầm, nhập giá đúng, **Lưu**. Giá đúng thay giá nhầm của ngày đó; giá lên lịch ngày khác giữ nguyên.

[ẢNH: C1-04-Sửa giá đã lên lịch]

**Ngừng bán một căn** (ví dụ chủ đầu tư dùng riêng dài ngày): trong **Sửa**, tắt **Đang bán**. Căn không hiện trong form đặt phòng; sơ đồ phòng ghi **Ngừng bán**. Đơn đã có giữ nguyên. Hỏng hóc thì dùng **khóa phòng** (mục 4.1), không dùng ngừng bán.

**Định mức và tối đa**: trong **Sửa**, mục **Số người**. **Tối đa** chỉ bằng định mức hoặc định mức + 1 (người thứ thêm ngủ sofa). Không tính trẻ dưới 6 tuổi.

### 1.4 Tham số quy tắc

1. **Quản trị → Tham số quy tắc**. Tham số chia nhóm: **Giữ chỗ, cọc, hủy** · **Số người & phụ thu** · **Giờ nhận/trả** · **FOC, hoa hồng, phí kênh** · **Bảo mật** · **Khác**.
2. Bấm **Sửa** ở tham số cần đổi.
3. Nhập **Giá trị mới**, chọn **Hiệu lực từ**, ghi **Lý do**. Bấm **Lưu thay đổi**.
4. Xem lại ai đổi gì ở **Lịch sử thay đổi** trong cùng hộp.

[ẢNH: C1-05-Tham số quy tắc]
[ẢNH: C1-06-Sửa tham số]

Quy tắc:
- Thay đổi áp cho đơn tạo **sau** ngày hiệu lực.
- Quản lý **không** sửa được hạn mức miễn phí (FOC), tỷ lệ hoa hồng, phí kênh và nhóm **Bảo mật**. Chỉ chủ đầu tư.
- Dòng ghi **Chờ chủ đầu tư xác nhận** hoặc **Chờ luật sư/kế toán xác nhận** là giá trị tạm, vẫn đang áp.
- **Form "Yêu cầu đặt phòng" trên website**: công tắc nằm ở nhóm **Bảo mật**, chỉ chủ đầu tư bật. Theo ESC-030 A, **giữ tắt** tới khi luật sư trả lời.
<!-- QA: kiểm trên staging công tắc form website (khóa public_booking_requests_enabled) hiện ở nhóm nào, tên hiển thị là gì; Wi-Fi (wifi.ssid, wifi.password) hiện ở nhóm "Khác" hay chỗ khác. -->
- **Wi-Fi** của cơ sở (tên mạng, mật khẩu) chủ đầu tư nhập ở **Tham số quy tắc** trong buổi cài đặt. Khách thấy Wi-Fi trên trang khách từ ngày nhận phòng.

**Danh mục minibar:** **Quản trị → Minibar**. Chủ đầu tư, quản lý **Thêm mặt hàng** hoặc **Sửa**: **Tên tiếng Việt**, **Tên tiếng Anh**, đơn vị, **Mức chuẩn mỗi tủ**, **Giá bán**, **Giá vốn**, **Tồn tối thiểu**, công tắc **Miễn phí**. Giá mới áp cho lần kiểm minibar sau; dòng đã ghi folio giữ giá cũ. Lễ tân và buồng phòng chỉ xem, không thấy giá vốn.

[ẢNH: C1-21-Danh mục minibar]

### 1.5 Người dùng và vai (chỉ chủ đầu tư)

Các vai trong v1.0:

| Vai trên Desk | Dành cho | Đăng nhập 2 bước |
|---|---|---|
| **Chủ đầu tư** | Chủ đầu tư | Bắt buộc |
| **Quản lý** | Quản lý | Bắt buộc |
| **Lễ tân trưởng** | Lễ tân trưởng: thêm quyền duyệt trong hạn mức, nhận phòng ngoại lệ, kiểm phòng | Chưa |
| **Lễ tân** | Lễ tân, người trực đêm | Chưa |
| **Buồng phòng** | Nhân viên buồng phòng | Chưa |
| **Bảo trì** | Kỹ thuật | Chưa |
| **Sale nội bộ** | Nhân viên bán hàng của OTTIMO | Chưa |
| **CTV / môi giới** | Cộng tác viên ngoài | Chưa |

Một người có thể có nhiều vai (ví dụ lễ tân kiêm sale). Không có vai "Kế toán" riêng (mục 4.3).

**Thêm người dùng:**
1. **Quản trị → Người dùng & vai → Thêm người dùng**.
2. Nhập **Tên hiển thị**, **Tên đăng nhập** (chữ thường không dấu, ví dụ `lan.hk`).
3. **Mật khẩu tạm** do Desk tạo sẵn (bấm **Tạo mật khẩu khác** nếu muốn).
4. Chọn một hoặc nhiều vai. Bấm **Tạo tài khoản**.
5. Xác nhận bằng mật khẩu và mã 6 số.
6. Desk hiện **Mật khẩu tạm của …** **một lần**. Đưa tận tay người dùng. Không gửi qua chat.

[ẢNH: C1-07-Người dùng và vai]
[ẢNH: C1-08-Thêm người dùng]
[ẢNH: C1-09-Mật khẩu tạm hiện một lần]

**Các việc khác** (cột **Thao tác** ở dòng người dùng):
- **Sửa vai** → chọn vai → **Lưu vai**. Người đó bị đăng xuất ngay trên mọi máy.
- **Đặt lại mật khẩu**: người đó bị đăng xuất và phải đổi mật khẩu tạm ở lần đăng nhập tới.
- **Khóa tài khoản**: dùng khi nghỉ việc hoặc mất điện thoại. **Mở khóa** khi cần dùng lại.
- Trạng thái **Tạm khóa do sai mật khẩu**: chờ hết thời gian khóa, hoặc đặt lại mật khẩu.

### 1.6 Thiết bị được cấp (chỉ chủ đầu tư)

Máy quầy phải được cấp quyền thì lễ tân mới nhận phòng và xem giấy tờ được.

1. Ngồi tại **chính máy cần cấp**. Đăng nhập Desk bằng tài khoản chủ đầu tư.
2. **Quản trị → Thiết bị được cấp**.
3. Nhập **Tên máy** (ví dụ "Máy quầy 1"), chọn **Loại thiết bị**: **Máy quầy / laptop** hoặc **Máy tính bảng của cơ sở**.
4. Tích đủ các mục **Kiểm máy trước khi cấp**.
5. Nhập lại mật khẩu (và mã 6 số nếu Desk hỏi). Bấm **Cấp quyền thiết bị này**.
6. Đăng xuất. Lễ tân đăng nhập trên máy này sẽ thấy **Máy quầy đã cấp quyền**.

[ẢNH: C1-10-Thiết bị được cấp]

- Quyền có hạn (máy quầy dài hơn, máy tính bảng ngắn hơn). Hết hạn thì cấp lại.
- Máy hỏng, mất hoặc bán: bấm **Thu hồi** ở dòng máy. Máy đó không xem được giấy tờ ngay.
- Không bao giờ cấp quyền cho điện thoại cá nhân.

### 1.7 Tài khoản nhận chuyển khoản – VietQR (chỉ chủ đầu tư)

Mọi mã VietQR khách quét đều chuyển tiền vào tài khoản này.

1. **Quản trị → Tham số quy tắc**, kéo tới khối **Tài khoản nhận chuyển khoản (VietQR)**.
2. Bấm **Đổi tài khoản nhận**.
3. Nhập **Mã BIN ngân hàng (6 số)**, **Số tài khoản**, **Nhập lại số tài khoản**, **Tên chủ tài khoản** (chữ in hoa không dấu, như trên ngân hàng).
4. Chọn **Hiệu lực từ**. Sớm nhất là **ngày kinh doanh kế tiếp**. Không đổi ngay trong ngày được: đây là cách chống tráo tài khoản, không phải lỗi.
5. Ghi **Lý do đổi** (không ghi số tài khoản vào lý do). Bấm **Xem lại**.
6. Đối chiếu với ứng dụng ngân hàng. Bấm **Lưu tài khoản nhận**, xác nhận bằng mật khẩu và mã 6 số.
7. Desk báo đã lên lịch. Chủ đầu tư và quản lý nhận thông báo (kể cả email từ `info@ottimo.vn`).

[ẢNH: C1-11-Tài khoản nhận đang dùng]
[ẢNH: C1-12-Đổi tài khoản nhận, bước xem lại]

- Sau khi lưu, Desk chỉ hiện **4 số cuối**. Muốn kiểm số đầy đủ: tạo một mã VietQR nhỏ trên một đơn thử, **quét bằng ứng dụng ngân hàng, xem tên chủ tài khoản, không chuyển tiền**, rồi hủy đơn thử.
- Đổi ý trước ngày hiệu lực: bấm **Hủy lịch**.
- Trong 24 giờ sau khi đổi, mã VietQR của lễ tân hiện cảnh báo "Tài khoản nhận vừa đổi…". Lễ tân đọc lại tên tài khoản với khách.

### 1.8 Duyệt yêu cầu (Cần duyệt)

Yêu cầu đi tới **mọi người có quyền duyệt**. Người gửi không chọn tên người duyệt. Người duyệt đầu tiên quyết định.

| Loại yêu cầu | Ai gửi | Ai duyệt |
|---|---|---|
| Miễn phí (FOC) khoản phát sinh, giảm giá đặc biệt tiền phòng | Lễ tân, lễ tân trưởng | Lễ tân trưởng ≤ 300.000 đ/lần và ≤ 1.500.000 đ/tháng · Quản lý ≤ giá 1 đêm/lần · Chủ đầu tư không giới hạn |
| Hoàn tiền (cọc, trả thừa, hủy, trả sớm) | Lễ tân trở lên | Quản lý, chủ đầu tư (mọi số tiền) |
| Xóa công nợ | Quản lý (vượt giá 1 đêm) | Chủ đầu tư |
| Nhận phòng khi buồng chưa sẵn sàng | Lễ tân | Lễ tân trưởng trở lên |
| Trả muộn khi có khách đến cùng ngày, không còn căn thay | Lễ tân trở lên | Quản lý, chủ đầu tư |
| Khôi phục đơn "không đến" ngoài điều kiện tự làm | Lễ tân | Quản lý, chủ đầu tư |
| Gia hạn báo giá đã hết hiệu lực | Sale, CTV | Quản lý, chủ đầu tư |

**Duyệt hoặc từ chối:**
1. **Cần duyệt** (hoặc **Tổng quan → Cần duyệt**).
2. Đọc: ai gửi, lúc nào, số tiền, lý do, **Cách hoàn** (với hoàn tiền).
3. Bấm **Duyệt** → nhập **Mật khẩu đăng nhập** → xác nhận. Hoặc **Từ chối** → ghi **Lý do từ chối**.
4. Yêu cầu bị sửa sau khi anh/chị mở: Desk báo, bấm **Tải lại** rồi quyết định.

[ẢNH: C1-13-Cần duyệt]
[ẢNH: C1-14-Hộp duyệt]

**Luôn duyệt bằng tài khoản của chính mình.** Ở v1.0, Desk từ chối mọi ô "mật khẩu của quản lý" trên phiên của lễ tân (vì quản lý có 2 bước). Khi lễ tân cần duyệt ngay tại quầy: lễ tân **đăng xuất**, quản lý đăng nhập tài khoản mình trên máy quầy, duyệt, đăng xuất; hoặc quản lý duyệt trên laptop riêng.

> **Tạm ở v1.0:** chưa có xác nhận từ xa trên điện thoại của quản lý (có ở v1.1). Không đọc mật khẩu qua điện thoại, không đưa mật khẩu cho lễ tân gõ hộ.

Quy tắc tách nhiệm (Desk tự kiểm):
- Không ai tự duyệt yêu cầu của chính mình, trừ khoản nằm trong hạn mức tự áp của vai.
- Hoàn chuyển khoản: người chi ≠ người tạo yêu cầu ≠ người duyệt ≠ người nhập nơi nhận. **Riêng chủ đầu tư** được vừa duyệt vừa chi cùng một khoản. **Quản lý không bao giờ** vừa duyệt vừa chi cùng một khoản.
- Tổng miễn trên một lượt ở vượt ngưỡng: Desk báo chủ đầu tư (không chặn).

### 1.9 Phụ thu trả muộn bằng giá 1 đêm – xem lại sau trả phòng (ESC-031)

Khi khách rời **sau 18:00** mà đêm đó căn **đã có khách khác đến**, lễ tân không bán thêm đêm được. Lễ tân gọi anh/chị báo trước, rồi chọn **Ghi phụ thu – quản lý xem lại**: Desk ghi đúng giá 1 đêm của đêm đó, không sửa, không miễn tại quầy (mục 2.15). Anh/chị xem lại **trong 24 giờ kể từ lúc lễ tân bấm trả phòng**.

1. Anh/chị nhận thông báo. Mở **Tổng quan → Cần chú ý**, dòng **Đơn …: phụ thu trả muộn bằng giá 1 đêm chờ xem lại** (có hạn xem).
2. Bấm **Mở folio**. Đọc lý do lễ tân ghi và số đã thu.
3. **Đồng ý**: bấm **Đã xem**. Xong.
4. **Nên giảm hoặc miễn**: trong folio, ở dòng phụ thu bấm **Điều chỉnh** → nhập số mới (hoặc **Bỏ cả dòng**) → **Lý do điều chỉnh** → **Ghi điều chỉnh**. Desk **tự tạo yêu cầu hoàn** phần chênh.
5. Yêu cầu hoàn đi vào **Cần duyệt**. **Người sửa dòng không tự duyệt khoản hoàn**: quản lý sửa thì chủ đầu tư duyệt.
6. Sau khi duyệt, chi hoàn ở **Nhật ký tiền → Hoàn tiền** (mục 1.12).
7. Quá 24 giờ chưa xem: Desk báo chủ đầu tư, bill đóng, không sửa được nữa.
<!-- QA: kiểm trường hợp chủ đầu tư tự sửa dòng phụ thu (bước 4) thì ai duyệt khoản hoàn tự sinh – quản lý hay Desk chặn. -->

[ẢNH: C1-15-Cần chú ý, phụ thu chờ xem lại]
[ẢNH: C1-16-Folio, điều chỉnh dòng]

Ví dụ: căn 203 đêm thường giá 792.000 đ. Khách rời 20:30, đêm đó căn đã có khách đến. Desk ghi phụ thu 792.000 đ. Quản lý xét giảm 50 %: sửa dòng còn 396.000 đ, Desk tạo yêu cầu hoàn 396.000 đ, chủ đầu tư duyệt, lễ tân hoặc quản lý chi.

### 1.10 Công nợ

- **Ghi công nợ** (khách đi khi chưa trả đủ) **chỉ quản lý hoặc chủ đầu tư** làm, trên phiên của chính mình, ở bước **Bill & thu tiền** khi trả phòng:
  1. Lễ tân dừng ở bước 3, đăng xuất. Quản lý đăng nhập (hoặc làm trên máy riêng), mở **Trả phòng** của đơn đó.
  2. Thu phần khách trả được (nếu có).
  3. Bật **Ghi công nợ – khách trả sau**. Chọn **Hạn thanh toán** (từ ngày mai; mặc định 3 ngày), ghi **Lý do ghi công nợ**.
  4. Bấm **Ghi công nợ … – hoàn tất**.
- **Thu công nợ** (lễ tân làm được): khung đơn hoặc **Cần chú ý** → **Thu công nợ** → chọn **Cách thanh toán**, nhập **Tiền** → **Ghi nhận đã thu …**. Thu một phần được.
- **Xóa công nợ** (chỉ quản lý, chủ đầu tư): **Xóa công nợ** → chọn **Khoản xóa công nợ** → **Lý do xóa công nợ** → nhập lại mật khẩu → **Xóa công nợ …**. Quản lý xóa tới giá 1 đêm; vượt mức thì yêu cầu chuyển chủ đầu tư duyệt.
- Công nợ hiện ở **Cần chú ý** tới khi thu đủ hoặc xóa.

[ẢNH: C1-17-Xóa công nợ]

### 1.11 Sửa sau khi đã trả phòng

- Folio đã chốt khi trả phòng. Chỉ quản lý và chủ đầu tư ghi **Điều chỉnh** (bút toán), có lý do. Desk không xóa dòng cũ: ghi một dòng đảo và một dòng mới.
- Ghi nhầm một khoản thu: trong folio, mục **Giao dịch thu** → **Đảo giao dịch** → **Lý do đảo**. Còn phải thu tăng lại đúng số đó.
- Khách còn dư tiền sau trả phòng: khung đơn hiện "Khách đã trả phòng và còn dư …". Bấm **Đề nghị hoàn …** để vào luồng hoàn.
- Phát sinh sau trả phòng (ví dụ phát hiện hư hỏng): ghi được trong **24 giờ** sau trả phòng.

### 1.12 Nhật ký tiền, đối soát và hoàn tiền

**Quản trị → Nhật ký tiền** có 3 tab:

| Tab | Dùng để |
|---|---|
| **Nhật ký thao tác tiền** | Xem mọi thao tác tiền: lúc nào, ai làm, thao tác gì, đơn nào, trước → sau, lý do. Lọc **Từ ngày** – **Đến ngày**, lọc người làm |
| **Chờ đối soát** | Khớp từng khoản chuyển khoản, VietQR với sao kê ngân hàng |
| **Hoàn tiền** | Nhập nơi nhận hoàn, chi hoàn tiền mặt, ghi đã hoàn chuyển khoản |

[ẢNH: C1-18-Nhật ký thao tác tiền]

**Đối soát chuyển khoản (mỗi ngày, quản lý hoặc chủ đầu tư):**
1. Mở tab **Chờ đối soát**. Mở sao kê ngân hàng cùng lúc.
2. Với mỗi khoản: thấy tiền về thì bấm **Đã khớp sao kê** → xác nhận. Không thấy tiền thì bấm **Không thấy tiền**: folio trở lại còn phải thu, quản lý được báo.
3. Khoản quá 2 ngày chưa đối soát hiện **Quá … ngày**.
4. Không đối soát khoản do chính mình ghi (trừ chủ đầu tư).

[ẢNH: C1-19-Chờ đối soát]

"Chờ đối soát" vẫn tính là đã thu: lễ tân nhận phòng, trả phòng bình thường.

**Hoàn tiền chuyển khoản (sau khi đã duyệt):**
1. Tab **Hoàn tiền**. Khoản chưa có nơi nhận: **Nhập nơi nhận hoàn** (**Cách hoàn**: Tiền mặt, Chuyển khoản, Cùng cách khách đã trả).
2. Chuyển tiền bằng ứng dụng ngân hàng của OTTIMO.
3. Khi ngân hàng báo thành công: **Ghi đã hoàn chuyển khoản / qua máy POS** → **Mã giao dịch ngân hàng / mã hoàn POS** → **Ảnh chứng từ** → xác nhận.

[ẢNH: C1-20-Hoàn tiền]

### 1.13 Báo cáo ở v1.0

| Cần biết | Xem ở |
|---|---|
| Công suất, khách đến/đi đêm nay | **Tổng quan** |
| Tiền thu, hoàn, miễn, điều chỉnh theo ngày, theo người | **Nhật ký tiền → Nhật ký thao tác tiền**, lọc ngày |
| Khoản chuyển khoản chưa khớp | **Nhật ký tiền → Chờ đối soát** |
| Ai đổi tham số, giá | **Tham số quy tắc → Sửa → Lịch sử thay đổi** |

> **Tạm ở v1.0:** chưa có báo cáo tháng, báo cáo kênh, báo cáo FOC, xuất dữ liệu ra bảng tính (có ở v1.2). Cách làm thay: cuối tháng xem **Nhật ký tiền** lọc theo tháng cùng kế toán; công suất theo ngày ghi tay từ **Tổng quan** mỗi sáng nếu cần. Không chụp màn hình có tên khách gửi qua chat.

### 1.14 Đóng ca

> **Tạm ở v1.0:** chưa có màn đóng ca và bàn giao tiền mặt (có ở v1.3). Cách làm thay mỗi cuối ca:
> 1. Lễ tân đếm tiền mặt trong két.
> 2. Mở **Nhật ký tiền → Nhật ký thao tác tiền**, lọc hôm nay, đếm các dòng **Tiền mặt** thu và chi trong ca.
> 3. Ghi số đếm, số trên Desk và chênh lệch (nếu có, kèm lý do) vào **sổ giao ca** giấy; hai người giao và nhận cùng ký.
> 4. Chênh lệch khác 0: báo quản lý trong ca.

### 1.15 Nhật ký và kiểm soát

- Mọi thao tác tiền, miễn giảm, đổi giá, đổi tham số đều có người làm, giờ, lý do.
- Mỗi lần xem giấy tờ đầy đủ đều được ghi nhật ký truy cập.
<!-- QA: v1.0 có màn xem "Nhật ký truy cập giấy tờ" (S28) cho OWN/MGR không? Menu không có mục này. Nếu không có, giữ câu dưới. -->
> **Tạm ở v1.0:** Desk chưa có màn xem nhật ký truy cập giấy tờ. Cần tra (ví dụ khách khiếu nại), chủ đầu tư báo đội qua `/feedback`.

### 1.16 Việc riêng của chủ đầu tư trong tuần đầu

- Đổi giờ nhận phòng 12:00 trên Booking.com, Agoda, Airbnb, Google Maps, fanpage, thẻ trong căn trước 02/11. Câu chuẩn: "Check-in from 12:00 (your room is always ready by 14:00) · Check-out by 12:00" / "Nhận phòng từ 12:00 (phòng luôn sẵn sàng lúc 14:00) · Trả phòng trước 12:00". Không viết "phòng sẵn sàng từ 12:00".
- Chuyển đổi dữ liệu ngày D theo `product/docs/day-one-guide.md`.
- Yêu cầu của khách về dữ liệu cá nhân: xử lý bằng tay.
- Hóa đơn GTGT: vẫn xuất ngoài Desk (mục 4.3).

---

## Chương 2. Lễ tân (FDL, FD)

> Trước khi bắt đầu: đăng nhập `desk.ottimo.vn` bằng tài khoản của mình trên **máy quầy đã cấp quyền** (mục 0.5). Ngày trên Desk đổi lúc **06:00**. Giấy tờ khách chỉ nằm trên Desk. Lễ tân trưởng có thêm: duyệt trong hạn mức, xác nhận nhận phòng ngoại lệ, kiểm phòng trên app nhân viên (mục 3.6).

### 2.1 Đầu ca, cuối ca

**Đầu ca:**
1. Đăng nhập. Desk mở **Hôm nay**.
2. Đọc **Cần chú ý** trước. Xử lý từ dòng đỏ trở xuống.
3. Xem **Khách đến (n)**, **Khách đi (n)**, **Giữ chỗ chưa cọc (n)**, **Yêu cầu của khách**.
4. Bàn giao với ca trước: tiền mặt trong két, việc dở dang (sổ giao ca).

**Cuối ca:**
1. **Cần chú ý** không còn dòng đỏ chưa xử lý (hoặc đã ghi chú, bàn giao).
2. Đối chiếu tiền mặt theo mục 1.14.
3. Ba ngày đầu: so sổ giấy với Desk lúc 22:00.
4. **Đăng xuất**.

### 2.2 Màn Hôm nay

| Khối | Nội dung | Nút |
|---|---|---|
| Số liệu | **Đang ở**, **Khách đến hôm nay**, **Khách đi hôm nay**, **Công suất đêm nay** | – |
| **Khách đến (n)** | Tên, căn, số đêm, giờ đến dự kiến, giấy tờ (**Chưa có giấy tờ**, **Đã làm thủ tục trước**…), **Còn phải thu** | **Nhận phòng**, **Mở đơn** |
| **Khách đi (n)** | Giờ trả, trạng thái liên lạc (**Chưa trả lời – gọi xác nhận**, **Đã trả lời**, **Quá giờ trả phòng**) | **Trả phòng**, **Xác nhận giờ trả** |
| **Giữ chỗ chưa cọc (n)** | Thời gian còn lại của giữ chỗ | **Mở đơn** |
| **Cần chú ý** | Khai báo sắp hạn, đơn OTA chưa gán căn, công nợ, phiếu sửa… | **Mở**, **Đã xử lý** |
| **Yêu cầu của khách** | Yêu cầu gửi từ trang khách | **Đã nhận**, **Làm xong**, **Không thực hiện được** |

Dòng **Có khách đến cùng căn hôm nay** ở khách đi: ưu tiên chốt giờ trả với khách này.

[ẢNH: C2-01-Hôm nay]

### 2.3 Sơ đồ phòng

1. **Vận hành → Sơ đồ phòng**. Lưới 10 căn × 14 ngày.
2. **Lùi 7 ngày** / **Tới 7 ngày** / **Hôm nay** để đổi khoảng ngày. **Kiểu xem**: **Lưới** hoặc **Danh sách**. Lọc **Nhóm căn**.
3. Mỗi thanh là một đơn: **Giữ chỗ · chờ cọc**, **Đã xác nhận**, **Đang ở**, **Đã trả phòng**, **Hợp đồng dài hạn** (nhãn **HĐ**, **Nhập tay**), **Khóa phòng**.
4. Bấm vào thanh để mở **khung đơn**. Bấm vào **ô trống** để đặt căn đó từ ngày đó.
5. Làn **Chưa gán căn – xung đột OTA** hiện đơn OTA về khi căn đã kín (mục 2.6).
6. Đơn đã hủy, không đến không hiện trên sơ đồ.

[ẢNH: C2-02-Sơ đồ phòng, chú giải]

### 2.4 Báo giá, giữ chỗ và cọc VietQR

**Báo giá:**
1. **Khách & bán → Báo giá & giữ chỗ**, tab **Căn trống**.
2. Nhập **Ngày đến**, **Số đêm**, **Người lớn (từ 12 tuổi)**, trẻ em.
3. Chọn căn trong danh sách căn trống. Desk mở **Báo giá**: số đêm thường, số đêm thứ Sáu/thứ Bảy, giảm theo số đêm, phụ thu người, **Tổng tiền đơn**, **Cọc để giữ phòng** (30 % tiền phòng).
4. Bấm **Lưu báo giá**. Chọn **Ngôn ngữ gửi khách**, bấm **Sao chép gửi Zalo**, dán vào tin nhắn riêng với khách.
5. Báo giá giữ giá **3 ngày**. Hết hạn thì **Lập báo giá mới**.

[ẢNH: C2-03-Báo giá, tab căn trống]
[ẢNH: C2-04-Hộp báo giá]

**Giữ chỗ khi khách đồng ý:**
1. Trong báo giá, bấm **Khách đồng ý – Giữ chỗ**.
2. Chọn **Khách đứng tên** (tìm, hoặc **Tạo nhanh khách**), **Giữ trong** 12, 24 hoặc 48 giờ (mặc định 24). Hạn giữ không vượt 12:00 ngày đến.
3. Bấm **Tạo giữ chỗ**. Desk tạo đơn **Giữ chỗ · chờ cọc** và mã **VietQR** đúng số cọc, nội dung chuyển khoản là **mã đơn**.
4. Gửi mã QR cho khách (**Sao chép số tiền**, **Sao chép nội dung** nếu khách tự gõ). Desk nhắc 2 giờ trước khi hết hạn.
5. Quá hạn chưa cọc: Desk tự hủy và mở bán lại căn.

[ẢNH: C2-05-Giữ chỗ và mã VietQR cọc]

**Xác nhận đã nhận cọc:**
1. Mở ứng dụng ngân hàng của OTTIMO. **Chỉ xác nhận khi thấy tiền đã về tài khoản OTTIMO.** Ảnh chụp màn hình của khách không phải bằng chứng.
2. Mở đơn → **Xác nhận đã nhận cọc**.
3. Kiểm **Số tiền đã nhận**, **Cách thanh toán**, ghi **Mã giao dịch / ghi chú** (không ghi số thẻ). Bấm **Xác nhận đã nhận cọc**.
4. Đơn chuyển **Đã xác nhận**, căn bị chặn trên sơ đồ.

[ẢNH: C2-06-Xác nhận đã nhận cọc]

Lưu ý:
- Khách chuyển thiếu: vẫn ghi được số đã nhận; đơn giữ **Giữ chỗ · chờ cọc** và hiện số còn thiếu.
- Khách chuyển dư: ghi **Lý do thu vượt**; phần dư thành tiền thừa của khách.
- Mã VietQR hết hạn: bấm **Tạo mã VietQR mới** (mã cũ hết hiệu lực), hoặc ghi như chuyển khoản tay (**Chờ đối soát**).
- Gia hạn giữ chỗ: **Gia hạn giữ chỗ (1 lần)**, tối đa thêm 24 giờ, không quá 12:00 ngày đến.
- Sale/CTV đã báo khách chuyển cọc: khung đơn hiện **CTV/sale đã báo chuyển cọc** kèm **Xem ảnh biên nhận**. Vẫn kiểm sao kê trước khi xác nhận.

> **Lỗi nhỏ đã biết (sửa ở v1.0.1):** hộp "Giữ chỗ" hiện số cọc và nội dung chuyển khoản hai lần; khách đến hôm nay vẫn hiện ô chọn thời hạn giữ dù không giữ được.

### 2.5 Đặt phòng ngắn ngày (khách trực tiếp, CTV)

1. **Sơ đồ phòng** (bấm ô trống hoặc **Đặt phòng mới**) hoặc **Đơn đặt phòng → Đặt phòng mới**.
2. **Căn**, **Ngày đến – ngày đi**. Desk chỉ hiện căn đang bán và còn trống cả khoảng ngày.
3. **Số khách**: **Người lớn (từ 12 tuổi)**, **Trẻ 6–11 tuổi**, **Trẻ dưới 6 tuổi**.
4. **Kênh**: **Trực tiếp**, **CTV / môi giới**, **OTA** hoặc **Nội bộ**.
   - Trực tiếp: chọn **Nguồn**: **Zalo / điện thoại**, **Website**, **Khách vãng lai**, **Khách quay lại**, **Sale nội bộ** (chọn **Người chốt**).
   - CTV: chọn **CTV chốt đơn** (bắt buộc).
   - Nội bộ: phòng dùng nội bộ, không tính doanh thu, vẫn chiếm phòng.
5. **Khách đứng tên**: gõ tên, SĐT, email hoặc mã khách để tìm. Chưa có thì **Tạo nhanh khách "…"**.
6. **Số điện thoại / Zalo**: **bắt buộc** với kênh Trực tiếp và CTV. **Email** không bắt buộc.
7. **Giờ đến dự kiến** (nếu khách báo).
8. **Giá mỗi đêm**: Desk điền theo lịch giá (**Nguồn giá** ghi rõ). Chỉ sửa khi đã chốt giá khác với khách, trong khoảng sàn–trần.
9. Xem **Tổng tiền phòng**, **Cọc cần thu**.
10. Khách đã chuyển cọc: nhập **Số tiền đã nhận**, **Cách thanh toán**, **Mã giao dịch / ghi chú**. Bấm **Tạo đơn**. Chưa cọc: bấm **Giữ chỗ đến …**.

[ẢNH: C2-07-Đặt phòng mới, kênh Trực tiếp]

Desk chặn và giải thích khi:
- **Đặt trùng** căn và đêm đã có đơn. Desk gợi ý **Căn trống cùng nhóm**.
- Ngày đến thứ Sáu, thứ Bảy hoặc ngày đặc biệt mà chỉ ở 1 đêm: "Ngày này cần ở tối thiểu 2 đêm". Ngoại lệ đêm lẻ giữa hai đơn: Desk gợi ý **Dùng căn … (đêm lẻ)**.
- Vượt sức chứa căn.
- Từ **28 đêm** trở lên: Desk mở **… đêm là thuê dài hạn** → **Tạo đơn dài hạn nhập tay** (mục 2.7).
- Đặt khi mất mạng: Desk giữ **nháp** trên máy, tạo đơn khi có mạng.

> **Lỗi nhỏ đã biết (v1.0.1):** sau **Tạo nhanh khách**, ô **Khách đứng tên** đôi khi vẫn đỏ tới lần bấm sau. Bấm lại vào ô là hết.

### 2.6 Đơn OTA nhập tay (Booking.com, Agoda, Airbnb…)

> **Tạm ở v1.0:** Desk chưa kết nối kênh OTA tự động (có ở v1.1). Có đơn OTA mới: **nhập Desk ngay**, rồi **đóng phòng trên extranet các kênh khác**. Desk chặn trùng trong Desk, nhưng chưa tự đóng phòng trên kênh.

1. **Đặt phòng mới**, **Kênh** = **OTA**.
2. Chọn **Kênh OTA**, nhập **Mã đặt phòng OTA**.
3. **Thanh toán**: **OTA đã thu tiền phòng** hoặc **Khách trả tại OTTIMO**.
4. Nhập giá từng đêm **theo extranet**. Giá ngoài sàn–trần vẫn lưu được, ghi lý do để quản lý xem lại.
5. Số khách theo kênh. Vượt sức chứa: Desk cho lưu kèm lý do, nhắc liên hệ khách.
6. Căn đã kín (kênh bán trùng): Desk báo **Căn … đã kín** và cho chọn căn trống cùng nhóm, hoặc **Lưu chưa gán căn** – đơn vào làn **Chưa gán căn**, quản lý nhận cảnh báo ngay.
7. Bấm **Tạo đơn**. Rồi đóng phòng trên các kênh khác.

[ẢNH: C2-08-Đặt phòng mới, kênh OTA]

**Gán căn cho đơn chưa gán:** khung đơn → **Gán căn** → chọn trong **Căn trống phù hợp** (dòng **Phù hợp nhất** ít tạo đêm lẻ nhất) → **Gán vào căn …**. Căn nhóm cao hơn là **Nâng hạng** – cần lễ tân trưởng xác nhận. Chưa gán căn thì chưa nhận phòng được.

### 2.7 Đơn dài hạn nhập tay

1. **Sơ đồ phòng** hoặc **Đơn đặt phòng** → **Đơn dài hạn nhập tay**.
2. **Căn**, **Ngày vào**, **Ngày ra (theo HĐ)**. Desk hiện số tháng và số đêm. Dưới 28 đêm: Desk đề nghị tạo đơn ngắn ngày.
3. **Khách đứng tên**, **Số điện thoại / Zalo**.
4. **Tiền thuê mỗi tháng (theo HĐ)**: gõ đúng số trên hợp đồng giấy.
5. **Ký quỹ đang giữ (ngoài app)**: chỉ để ghi nhớ, không tạo giao dịch.
6. **Số hợp đồng giấy**, **Ghi chú (gói dọn, chu kỳ thu…)**.
7. Bấm **Tạo đơn dài hạn**. Đơn mang cờ **HĐ ngoài hệ thống – sẽ chuyển vào app**, giữ căn trên sơ đồ như mọi đơn.

[ẢNH: C2-09-Đơn dài hạn nhập tay]

> **Tạm ở v1.0:** hợp đồng, lịch kỳ thu, nhắc thu, ký quỹ và **điện nước** chưa có trong Desk (có ở v1.3). Làm như hiện nay:
> - Hợp đồng và ký quỹ: giấy và sổ kế toán. **Không ghi ký quỹ vào Desk.**
> - Điện nước mỗi tháng: chốt chỉ số công tơ (có ảnh), tính tay **điện 5.000 đ/kWh**, **nước 100.000 đ/người/tháng** theo số ngày ở (trẻ dưới 6 tuổi miễn – đang chờ chủ đầu tư xác nhận). Thu và ghi sổ như hiện nay.
> - Tiền thuê kỳ sau ngày chạy: ghi theo `day-one-guide.md` mục 4.5 (ghi thu trên đơn, ghi chú "Kỳ tháng mm/yyyy").
> - Phụ thu người thêm của khách dài hạn: theo hợp đồng giấy; Desk không tự tính ở đơn này.
<!-- QA: diễn tập Q3 của day-one-guide – đơn dài hạn nhập tay ghi thu tiền thuê ở đâu trên khung đơn (nút nào), folio có dòng tiền thuê không, khi trả phòng Desk đòi thu bao nhiêu hay coi là tiền thừa. Sửa đoạn trên theo kết quả. -->

### 2.8 Sửa, đổi, hủy đơn trước ngày đến

Mở đơn (từ **Sơ đồ phòng**, **Đơn đặt phòng** hoặc **Hôm nay → Mở đơn**). Khung đơn có thanh **Tiến trình đơn**: **Đặt → Giữ chỗ → Đã cọc → Nhận phòng → Trả phòng**, và các nút theo trạng thái.

[ẢNH: C2-10-Khung đơn và các nút]

**Đổi căn / đổi ngày:**
1. **Đổi căn / đổi ngày** → chọn căn mới, **Ngày đến**, **Ngày đi**.
2. **Lý do đổi** chia 3 nhóm: **Khách xin đổi – tính giá căn mới** · **OTTIMO đổi – giữ giá đã đặt** · **Khác – giữ giá đã đặt**.
3. Desk **Tính thử trước khi lưu**: giá cũ, giá mới từng đêm, **Khách trả thêm** / **Khách được giảm** / **Không đổi tiền**.
4. Báo khách số mới. Tích **Đã báo khách số tiền mới**. Bấm **Lưu thay đổi**. Khách không đồng ý thì đóng hộp, không lưu.
5. Đơn OTA: chỉ đổi căn nội bộ, ngày theo kênh.

[ẢNH: C2-11-Đổi căn, đổi ngày, tính thử]

**Hủy:**
1. Đơn giữ chỗ chưa cọc: **Hủy giữ chỗ** → **Lý do hủy** → **Hủy giữ chỗ**. Không thu phí.
2. Đơn đã xác nhận: **Hủy đơn** → **Lý do hủy**. Desk tính **phí hủy** và **khoản hoàn** theo chính sách (kênh Trực tiếp: báo trước ≥ 7 ngày hoàn 100 % cọc; 3–6 ngày hoàn 50 %; dưới 3 ngày không hoàn). Đọc số trên hộp trước khi bấm.
3. Đơn OTA: nhập **Tiền phạt theo kênh** đúng số kênh báo (0 nếu kênh miễn phạt).
4. Có khoản hoàn: Desk tạo yêu cầu hoàn, **cần quản lý duyệt**.
5. Khách muốn đổi ngày thay vì hủy: **Dời ngày thay vì hủy** (chỉ quản lý).

[ẢNH: C2-12-Hủy đơn]

**Khách không đến:**
1. **18:00** khách chưa đến, chưa báo giờ: gọi hoặc nhắn khách.
2. **23:00** vẫn không liên lạc được: khung đơn → **Đánh dấu không đến** → ghi **Kết quả liên lạc** (**Gọi không nghe máy**, **Khách báo đến trễ**…) → **Đánh dấu không đến**. Nút chỉ mở từ 23:00 và sau khi ghi kết quả liên lạc.
3. Đơn Trực tiếp: Desk giữ cọc theo chính sách, mở bán lại căn. Đơn OTA: Desk tạo việc **Báo khách không đến cho …** để báo kênh.
4. Khách đến sau khi đã đánh dấu: **Khôi phục đơn không đến** (trong ngày nghiệp vụ của đêm đến, căn còn trống). Ngoài điều kiện: **Gửi yêu cầu khôi phục** cho quản lý.

[ẢNH: C2-13-Đánh dấu không đến]

### 2.9 Gửi link check-in online cho khách

1. Mở đơn (giữ chỗ hoặc đã xác nhận). Mục **Link check-in online** → **Tạo link check-in online**.
2. Bấm **Sao chép link**. **Link chỉ hiện một lần.** Đóng hộp là không xem lại được; cần thì **Tạo link mới** (link cũ ngừng hoạt động).
3. Gửi **riêng 1–1** cho khách của đơn (Zalo, WhatsApp, email). Không gửi vào nhóm chat. Không kèm mã cửa hay số căn.
4. Khách mở link trên điện thoại: đọc thông báo xử lý dữ liệu, chụp giấy tờ từng người (hoặc chọn **Bổ sung tại quầy**), chọn giờ đến, chọn đồng ý lưu ảnh hay không.
5. Khi khách gửi xong, **Hôm nay** ghi **Đã làm thủ tục trước**. Lúc khách đến, lễ tân chỉ đối chiếu bản gốc.
6. Gửi nhầm người: **Thu hồi link**.

[ẢNH: C2-14-Link check-in online]

Trang khách tiếng Anh dẫn, có tiếng Việt. Trong lúc ở, khách xem Wi-Fi (từ ngày nhận phòng), nội quy và gửi yêu cầu (khăn, dọn thêm, báo hỏng, trả muộn).

> **Lỗi nhỏ đã biết (v1.0.1):** trang khách hiện câu "Ngôn ngữ theo trình duyệt của bạn" cả khi ngôn ngữ lấy theo hồ sơ khách. Không ảnh hưởng.

### 2.10 Nhận phòng

**Giờ nhận phòng (từ 26/10):**

| Khách vào căn lúc | Desk tính |
|---|---|
| Từ **12:00** (căn đã sạch hoặc đã kiểm – `VC`/`VI`) | **Không phụ thu** |
| **10:00–11:59** | Phụ thu **30 %** giá đêm đầu |
| **06:00–09:59** | Phụ thu **50 %** giá đêm đầu |
| Trước **06:00** | Không phải phụ thu: Desk **thêm đêm trước** (tiền phòng 1 đêm) |

- Câu nói với khách: "Check-in from 12:00 (your room is always ready by 14:00)" / "Nhận phòng từ 12:00, phòng luôn sẵn sàng lúc 14:00". **Không** hứa "phòng sẵn sàng từ 12:00".
- Khách tới 12:00–14:00 mà căn chưa xong: giữ hành lý, mời chờ ở sảnh hoặc đi dạo, hẹn giờ. Không phụ thu, không giảm giá. Gửi hành lý không tính phụ thu.
- Quá 14:00 vẫn chưa xong: báo lễ tân trưởng hoặc quản lý đổi căn sẵn sàng hoặc nâng hạng.
- Đơn OTA: phụ thu nhận sớm tính trên giá Trực tiếp hiện hành của đêm đó.

**Các bước:**
1. **Hôm nay → Khách đến → Nhận phòng** (hoặc khung đơn → **Nhận phòng**). Desk mở **Nhận phòng · Căn … · …**.
2. Đọc **Điều kiện nhận phòng**. Mỗi dòng **Đã đủ** hoặc **Còn thiếu**:
   - **Đơn đã được gán căn**
   - **Số khách không vượt sức chứa căn**
   - **Buồng sẵn sàng (VI hoặc VC)**
   - **Đã thu đủ hoặc OTA đã trả/đảm bảo**
   - **Có giấy tờ người đứng tên**
   - **Giấy tờ khách nước ngoài hợp lệ tại ngày nhận**
3. **Bước 1 – Giấy tờ.** Bắt đầu với **người đứng tên**. Khách đã gửi qua link: dòng ghi **Khách đã gửi trước qua app**, bấm **Xem đủ số / ảnh** để đối chiếu với bản gốc. Chưa có: **Chụp hoặc tải ảnh giấy tờ**, hoặc **Nhập tay** → điền → **Lưu giấy tờ**. Người đi cùng bổ sung được trước hạn khai báo. Bấm **Tiếp tục: Kiểm tra**.
4. **Bước 2 – Kiểm tra.** Desk tự kiểm tên khớp đơn, hạn hộ chiếu, thị thực, đủ giấy tờ. Dòng **Chưa kiểm được**: xem giấy tờ gốc, bấm **Tôi đã kiểm – Đạt** hoặc **Tôi đã kiểm – Không đạt**, ghi **Cách xử lý**. Bấm **Tiếp tục: Khai báo**.
5. **Bước 3 – Khai báo.** Desk hiện loại khai báo (**Thông báo lưu trú công dân Việt Nam** hoặc **Khai báo tạm trú người nước ngoài**) và **hạn**. Chọn **Khai báo ngay** (làm theo mục 2.11) hoặc **Khai báo sau (thêm vào việc cần làm)**. Bấm **Tiếp tục: Giao mã & hoàn tất**.
6. **Bước 4 – Giao mã & hoàn tất:**
   - **Giờ nhận & phụ thu**: mặc định "Nhận từ 12:00 – không phụ thu". Khách vào trước 12:00: bật **Khách nhận sớm**, chỉnh **Giờ nhận thực tế** (giờ khách vào căn). Desk hiện **Phụ thu nhận sớm đề xuất**. Báo khách, tích **Tôi đã báo khách khoản phụ thu này**. Khách xin miễn: **Xin miễn phụ thu (gửi duyệt)**, chọn lý do.
   - **Thu tiền trước khi giao mã**: Desk hiện **Cần thu để nhận phòng** (phần còn lại của đơn Trực tiếp, phụ thu nhận sớm). Thu theo mục 2.13.
   - **Mã cửa**: tạo trên app khóa như hiện nay (mục "Mã cửa" bên dưới). Nhập **Số thẻ phòng đã giao** (tối đa 2).
   - Tích **Đã gửi/giao nội quy (VI/EN) cho khách** (bắt buộc). Tích **Đã giao mã cửa/thẻ cho khách** nếu đã giao.
7. Đọc khối **Khi bấm Nhận phòng**. Bấm **Nhận phòng căn …**, xác nhận.
8. Desk báo "Đã nhận phòng căn …. Hạn khai báo: …". Đơn chuyển **Đang ở**, buồng chuyển **Có khách, sạch**.

[ẢNH: C2-15-Nhận phòng, điều kiện và bước Giấy tờ]
[ẢNH: C2-16-Nhận phòng, bước Kiểm tra]
[ẢNH: C2-17-Nhận phòng, bước Khai báo]
[ẢNH: C2-18-Nhận phòng, giờ nhận và phụ thu nhận sớm]
[ẢNH: C2-19-Nhận phòng, thu tiền]
[ẢNH: C2-20-Nhận phòng, mã cửa và hoàn tất]

**Trường hợp đặc biệt:**
- **Căn chưa sẵn sàng** (đang `VD`, `CL`, `OD`): lễ tân gửi **Gửi lễ tân trưởng xác nhận** kèm **Lý do**. Lễ tân trưởng tự xác nhận ngoại lệ được; buồng chuyển "Có khách, cần dọn" và có việc dọn gấp. Căn đang khóa sửa chữa (OOO) thì **không bao giờ** nhận phòng được.
- **Khách nhận trước 06:00**: Desk hiện "Khách nhận trước 06:00 – thêm đêm …: … Đây là tiền phòng, không phải phụ thu." Bấm **Thêm đêm và nhận phòng**. Đêm trước đã có khách thì chưa nhận được trước 06:00: nhận từ 06:00 hoặc đổi căn trống.
- **Vượt sức chứa**: **Đổi sang căn đủ chỗ** hoặc **Sửa số khách thực tế** sau khi hỏi khách.
- **Giấy tờ nước ngoài hết hạn hoặc thiếu dấu nhập cảnh**: lễ tân trưởng trở lên xác nhận nhận tiếp (ghi lý do, cách xử lý); quản lý nhận thông báo.
- **Bộ đồ dùng thêm** (khách vượt định mức ngủ sofa) chưa chuẩn bị: vẫn nhận phòng được; việc đã lên đầu hàng đợi buồng phòng.
- **Nhận nhầm**: **Hoàn tác nhận phòng** (chỉ quản lý, trong ngày, khi folio chưa có dòng mới).
- Mất mạng giữa chừng: Desk không lưu tạm. Chờ mạng; khách chờ lâu thì ghi sổ giấy, nhập bù khi có mạng.

**Mã cửa:**

> **Tạm ở v1.0:** mã cửa vẫn tạo và giao khách **ngoài Desk**, trên app khóa như hiện nay (có ở v1.1). Desk **không lưu mã cửa**. Desk chỉ ghi đã giao mã/thẻ lúc nào, ai giao. Khi trả phòng hoặc đổi phòng, Desk tạo việc "Xóa mã trên app khóa" để nhắc. Không gửi mã cửa trong cùng tin nhắn có số căn hoặc địa chỉ.
<!-- QA/UXD: chữ hướng dẫn trên màn (ci.door_step1) ghi "mã 6 số", BR-403 (INV 19/10) là 8 số – báo UXD sửa chữ ở v1.0.1. Sổ tay cố ý không ghi số chữ số. -->

> **Lỗi nhỏ đã biết (v1.0.1):** trên màn 1366 px, chip **Cần nhập thông tin** đè nút **Xem đủ số / ảnh**. Thu nhỏ trang (Ctrl và dấu trừ) nếu cần bấm.

### 2.11 Giấy tờ và khai báo lưu trú

**Hạn khai báo:**

| Khách | Hạn |
|---|---|
| Công dân Việt Nam | Trước **23:00** ngày đến. Đến từ 23:00 thì trước **08:00** sáng hôm sau |
| Người nước ngoài | Trong **12 giờ** tính từ giờ nhận phòng |

Hồ sơ sắp hạn và quá hạn hiện ở **Cần chú ý** và cột **Hạn khai báo**.

**Khai báo:**
1. **Vận hành → Giấy tờ & khai báo**. Tab **Cần xử lý**, **Cần cập nhật ngày đi**, **Tất cả**. Cột **Hạn khai báo** đếm ngược, đỏ khi quá hạn.
2. Dòng còn thiếu giấy tờ: **Nhập giấy tờ**. Đủ giấy tờ: **Khai báo**.
3. **Khối 1 · Đối chiếu và đồng ý lưu ảnh**: kiểm từng người. Hỏi khách và chọn **Đồng ý lưu ảnh** hoặc **Không đồng ý – xóa ảnh sau khi khai báo**. Bấm **Đối chiếu xong**.
4. **Khối 2 · Sao chép lên cổng khai báo**: bấm **Hiện dữ liệu khai báo** (nhập lại mật khẩu). Mở cổng khai báo của Bộ Công an trên cùng máy. Bấm **Sao chép** từng ô theo đúng thứ tự trên cổng, dán vào cổng. Ô ghi "Không có – để trống trên cổng" thì để trống. Dán xong bấm **Xóa bộ nhớ tạm**.
5. Gửi trên cổng. Cổng trả **mã hồ sơ**.
6. **Khối 3 · Ghi kết quả từ cổng**: dán **Mã hồ sơ**, bấm **Đã gửi khai báo**. Khi cổng xác nhận: **Cổng đã xác nhận**. Cổng từ chối: **Cổng từ chối** → ghi **Lý do cổng từ chối**; hồ sơ trở về chờ khai báo để sửa và khai lại.

[ẢNH: C2-21-Giấy tờ và khai báo, danh sách]
[ẢNH: C2-22-Khai báo, ba khối]

- Dữ liệu tự ẩn sau vài phút hoặc khi rời tab. Không dán dữ liệu khai báo vào chỗ khác ngoài cổng.
- Khách nước ngoài **gia hạn, trả sớm hoặc trả phòng**: hồ sơ hiện ở tab **Cần cập nhật ngày đi**. Cập nhật trên cổng trong ngày.
- Đổi phòng không phải khai báo lại; chỉ đổi số căn trong hồ sơ.
- **Giấy tờ khách gửi qua link chưa gắn người** (thường do có người rời đoàn): mở đơn, bấm **Gắn người**, chọn đúng người. Không gắn thì giấy tờ tự xóa theo giờ Desk ghi.
- Khách xin xóa sớm ảnh: chỉ quản lý, chủ đầu tư làm (**Xóa ảnh**). Lễ tân chuyển yêu cầu cho quản lý.

### 2.12 Trong lúc khách ở

**Thêm dịch vụ, phát sinh vào folio:**
1. Khung đơn → **Thêm phát sinh**.
2. **Khoản**: **Dọn phòng lẻ**, **Giặt ủi (theo kg)**, **Khử mùi thuốc lá**, **Mất/hỏng thẻ phòng**, các món hư hỏng theo bảng giá, **Đồ ăn uống**, **Dịch vụ khác** (hai khoản cuối nhập giá).
3. **Số lượng**, **Ghi chú**. Khoản phạt (thuốc lá, thẻ, hư hỏng) cần **Ảnh hoặc ghi chú bằng chứng**; nên kiểm đã gửi nội quy cho khách.
4. Bấm **Thêm vào folio**.

[ẢNH: C2-23-Thêm phát sinh]

**Thêm người đi cùng:** khung đơn → mục **Người ở** → **Thêm người đi cùng** → **Loại** (người lớn hoặc trẻ em; trẻ chỉ cần **Năm sinh**). Vượt định mức: Desk hiện phụ thu người (người lớn 150.000 đ/đêm, trẻ 6–11 tuổi 100.000 đ/đêm, dưới 6 tuổi miễn) → báo khách → tích **Ghi phụ thu … vào folio – tôi đã báo khách** → **Thêm vào đơn**. Nhớ báo buồng phòng chuẩn bị bộ đồ dùng thêm (Desk tự tạo việc).

[ẢNH: C2-24-Thêm người đi cùng]

**Gia hạn:**
1. Khung đơn → **Gia hạn**. Chọn số đêm **Ở thêm** (chỉ đêm còn **Trống**; tối đa 7 đêm liên tiếp).
2. Desk tính tiền, áp lại giảm theo số đêm nếu tổng đủ 7 hoặc 14 đêm.
3. Đơn OTA: phần gia hạn thành đơn con kênh Trực tiếp, chung phiếu thanh toán.
4. Bấm **Gia hạn … đêm · …**. Nhớ kéo dài hiệu lực mã cửa trên app khóa. Khách nước ngoài: cập nhật khai báo trong ngày.

[ẢNH: C2-25-Gia hạn]

**Đổi phòng khi đang ở:**
1. Khung đơn → **Đổi phòng**.
2. **Vì sao đổi?**: **Sự cố của OTTIMO – giữ giá cũ** hoặc **Khách yêu cầu – giá căn mới**. Ghi **Lý do đổi**.
3. **Căn mới (đã dọn hoặc đã kiểm)**: chỉ hiện căn sẵn sàng, không bị khóa. Căn nhóm cao hơn cần lễ tân trưởng xác nhận.
4. Bấm **Đổi sang căn …**. Thu thẻ cũ, giao mã/thẻ mới. Căn cũ có việc dọn.

[ẢNH: C2-26-Đổi phòng]

**Xác nhận giờ trả** (ngày khách đi): **Hôm nay → Khách đi → Xác nhận giờ trả** → giờ khách báo, **Khách trả lời qua** (**Gọi điện**, **Tại quầy**, **Zalo**). Giờ sau 12:00 là trả muộn: dùng **Trả muộn**.

[ẢNH: C2-28-Xác nhận giờ trả]

**Yêu cầu của khách** (từ trang khách, hiện trên **Hôm nay**): **Đã nhận** → làm hoặc chuyển bộ phận → **Làm xong**. Không làm được: **Không thực hiện được** → **Lý do (khách thấy)**. **Lời nhắn cho khách**: khách đọc được, không ghi mã cửa, số giấy tờ, số điện thoại, số thẻ. Yêu cầu có phí ghi vào folio khi xong.

[ẢNH: C2-29-Yêu cầu của khách]

**Miễn phí, giảm giá:**
1. Trong folio, ở dòng cần miễn: **Mở form miễn phí / giảm giá**.
2. **Loại**: **Miễn khoản phát sinh (FOC)** hoặc **Giảm giá đặc biệt (tiền phòng)**. **Số tiền miễn**, lý do (**Khách quen / VIP**, **Phòng sẵn sàng, không ảnh hưởng khách sau**, **Bù sự cố**, **Khách dài hạn**, **Khác (ghi rõ)**).
3. Minibar trong mức tự miễn của lễ tân (≤ 100.000 đ/lần, ≤ 500.000 đ/tháng): nhập lại mật khẩu → **Tự áp miễn phí**.
4. Còn lại: **Gửi duyệt**. Yêu cầu tự đến người có quyền. Folio ghi dòng miễn **Chờ duyệt**.
5. Theo dõi kết quả trên folio (**Đã áp**, **Bị từ chối**).

[ẢNH: C2-30-Miễn phí, giảm giá]

### 2.13 Thu tiền

| Cách | Làm gì | Ghi chú |
|---|---|---|
| **Tiền mặt** | Nhập **Tiền khách đưa**. Desk tính **Thối lại** | Cất két ngay |
| **Thẻ (máy POS tại quầy)** | Quẹt máy POS. Nhập **Mã chuẩn chi trên phiếu POS** | **Không nhập số thẻ** |
| **Chuyển khoản VietQR** | **Tạo VietQR · …** → khách quét → **chờ thấy tiền về ứng dụng ngân hàng OTTIMO** → **Ghi nhận đã thu …** | Nội dung chuyển khoản là mã đơn |
| **Chuyển khoản** (tay) | Nhập số tiền, **Mã giao dịch / ghi chú** | Mang cờ **Chờ đối soát**, vẫn tính là đã thu |

- **Chưa thấy tiền về thì đừng hoàn tất.** Hỏi khách ảnh giao dịch, chờ, hoặc chọn cách khác.
- Thu nhiều lần, nhiều cách được: ghi phần đã nhận, chọn cách khác cho phần còn lại.
- Đơn Trực tiếp: thu **đủ** phần còn lại khi nhận phòng, **trước khi giao mã cửa**.
- Không quét mã VietQR trên staging để chuyển tiền thật.

[ẢNH: C2-19-Nhận phòng, thu tiền]

### 2.14 Trả phòng – 3 bước

**Giờ trả phòng 12:00.** Hôm trước và sáng ngày đi, lễ tân nhắn khách xác nhận giờ trả (nhắn tay ở v1.0), ghi kết quả bằng **Xác nhận giờ trả** (mục 2.12).

1. **Hôm nay → Khách đi → Trả phòng** (hoặc khung đơn → **Trả phòng**). Desk mở **Trả phòng · Căn … · …**.
2. **Bước 1 – Minibar.** Nhập số **Còn lại / chuẩn** từng món theo số buồng phòng đếm (mục 3.7). Không dùng gì: **Không dùng gì – tủ đủ**. Xem **Tổng minibar**. Bấm **Tiếp tục: Phụ phí**.
3. **Bước 2 – Phụ phí.** Kiểm **Giờ trả phòng thực tế**. Desk tự tính phụ thu trả muộn (mục 2.15). Thêm **Phát sinh khác** nếu có (**Giặt ủi**, **Đồ ăn gọi thêm**, **Hư hỏng, mất đồ**, **Khử mùi thuốc lá**, **Thiếu thẻ phòng**). Có phụ thu: báo khách, tích **Tôi đã báo khách khoản phụ thu này**. Bấm **Tiếp tục: Bill & thu tiền**.
4. **Bước 3 – Bill & thu tiền.** Đọc **Tổng cộng**, **Đã thu**, **Còn phải thu**. Thu theo mục 2.13.
5. Khách lấy hóa đơn công ty: bật **Khách lấy hóa đơn công ty** → **Tên công ty**, **Mã số thuế**, **Địa chỉ công ty**, **Email nhận hóa đơn** (mục 2.16).
6. Khách trả thừa: chọn **Hoàn lại khách … (tạo đề nghị hoàn)** hoặc **Khách đồng ý để lại khoản thừa – chỉ quản lý trở lên**, ghi lý do.
7. Bấm **Đã thu … – hoàn tất** (hoặc **Hoàn tất trả phòng**). Đọc hộp xác nhận, xác nhận.
8. Desk báo "Đã trả phòng. Bill đã lưu." và cấp số **Phiếu thanh toán**. Đơn chuyển **Đã trả phòng**, buồng chuyển **Trống, cần dọn**; có việc dọn, bổ sung minibar, xóa mã trên app khóa.

[ẢNH: C2-31-Trả phòng, bước Minibar]
[ẢNH: C2-32-Trả phòng, bước Phụ phí]
[ẢNH: C2-33-Trả phòng, bước Bill và thu tiền]

- Tiền mặt hoặc thẻ POS **lớn hơn số đang nợ lúc đó** (ví dụ có phụ thu mới ở bước 3): Desk ghi "đã nhận …", khoản thu được ghi vào folio **khi bấm Hoàn tất**. Số cần thu đổi sau khi nhập: bấm **Bỏ khoản thu này**, nhập lại theo số mới (không thu khách lần nữa).
- Khách đi khi chưa trả đủ: **dừng**, gọi quản lý ghi công nợ (mục 1.10). Lễ tân không ghi công nợ.
- Có yêu cầu miễn đang chờ duyệt: chưa hoàn tất được tới khi có kết quả, hoặc rút yêu cầu và thu đủ.
- Sau khi hoàn tất, folio đã chốt. Sửa phải nhờ quản lý (mục 1.11).

> **Lỗi nhỏ đã biết (v1.0.1):** các nút nhanh ở bước **Phụ phí** (giặt ủi, F&B, hút thuốc, mất thẻ) mở hộp nhưng **chưa chọn sẵn khoản**: chọn tay khoản trong ô **Khoản**. Khung đơn đang ở hiện dòng "Còn phải thu" hai lần, cùng một số.

**Bill / Phiếu thanh toán:**
1. Trước khi trả phòng, xem trước bằng **Xem Phiếu thanh toán** trên khung đơn (bản xem trước, chưa có số phiếu).
2. Sau khi hoàn tất, mở lại **Xem Phiếu thanh toán**. Chọn **Ngôn ngữ phiếu**: **Tiếng Việt** hoặc **Việt – Anh**.
3. Bấm **In phiếu**. Trình duyệt mở hộp in: in giấy, hoặc chọn "Lưu dưới dạng PDF" của trình duyệt.

[ẢNH: C2-35-Phiếu thanh toán, In phiếu]

> **Tạm ở v1.0:** mẫu in chính thức, xuất PDF từ Desk, gửi bill qua email/Zalo và khách xem folio tạm tính trên trang khách có ở v1.2. Khách cần bill qua tin nhắn: in PDF từ trình duyệt, gửi riêng 1–1 cho khách.
<!-- QA: kiểm nút "In phiếu" trên staging (Chrome, máy quầy): bản in có đủ dòng, đúng ngôn ngữ, không lẫn khung Desk. Nếu không dùng được, sửa đoạn trên thành "chưa in được, đưa khách xem trên màn hình". -->

### 2.15 Trả muộn và khách ở quá 18:00

**Mức phụ thu trả muộn** (trên giá đêm cuối):

| Khách rời | Desk tính |
|---|---|
| Đến **12:30**, căn **không** có khách đến cùng ngày | Không phụ thu (ân hạn) |
| Sau 12:00 – đến **15:00** | **30 %** |
| Sau 15:00 – đến **18:00** | **50 %** |
| Sau **18:00**, đêm đó căn **còn trống** | Tính **thêm 1 đêm** (giá đêm thêm sửa được trong khoảng sàn–trần) |
| Sau **18:00**, đêm đó căn **đã có khách đến** | Phụ thu **bằng giá 1 đêm** – đường "quản lý xem lại" bên dưới |

Căn có khách đến cùng ngày thì không có ân hạn 12:30. Khách dài hạn: trả tới 15:00 không phụ thu nếu không có khách đến.

**Hẹn trả muộn trước:**
1. Khung đơn → **Trả muộn**. Nhập **Giờ trả đã hẹn** (dạng 24 giờ, ví dụ 12:30).
2. Desk hiện **Phụ thu đề xuất**. Báo khách, tích **Tôi đã báo khách khoản phụ thu này**.
3. Bấm **Lưu giờ trả …**. Việc dọn ghi "dọn sau …". Nhớ kéo dài mã cửa trên app khóa.
4. Căn có khách đến và **không còn căn thay**: Desk chỉ cho **Gửi quản lý duyệt**. Giờ trả chưa đổi tới khi được duyệt. Gợi ý khách gửi hành lý.

[ẢNH: C2-27-Trả muộn]

**Khi khách ở quá 18:00 mà đêm đó căn đã bán cho khách khác:**
1. **Phòng trước**: từ 12:00, chốt giờ đi với khách đi hôm nay nếu căn có khách đến tối nay.
2. Khách vẫn ở quá 18:00: lễ tân trưởng hoặc quản lý **đổi căn cho khách sắp đến** sang căn trống khác (cùng hạng trước, lý do "OTTIMO đổi – giữ giá đã đặt"). Khi đó đêm nay căn trống lại, Desk tính thêm 1 đêm cho khách ở quá giờ như thường.
3. Không còn căn trống: **gọi quản lý** (không được thì chủ đầu tư) báo trước. Không chờ duyệt, không xin mật khẩu.
4. Trả phòng như mục 2.14. Bước **Phụ phí** hiện **Trả sau mốc trả muộn**: "Đêm nay căn đã có khách nên không bán thêm đêm được. Thay vào đó thu phụ thu trả muộn bằng giá 1 đêm".
5. Bước **Bill & thu tiền**: mục **Cách xác nhận khoản phụ thu** đã chọn sẵn **Ghi phụ thu – quản lý xem lại**. Số do Desk tính, **không sửa được**, **không có ô miễn**. Ghi **Lý do** (ví dụ "Rời 20:30, căn có khách đến tối nay").
6. Thu đủ số Desk hiện. Bấm hoàn tất. Quản lý nhận thông báo để xem lại trong 24 giờ.
7. Khách xin giảm: **không hứa**. Nói: quản lý xem lại trong 24 giờ; nếu được giảm, OTTIMO hoàn lại.
8. Khách không chịu trả: **không hoàn tất trả phòng**, gọi quản lý hoặc chủ đầu tư.
9. Desk báo "Phụ thu vừa được tính lại" hoặc "Đêm nay căn đã trống lại…": số đã tải lại, làm theo số mới.

[ẢNH: C2-34-Trả sau 18:00, ghi phụ thu quản lý xem lại]

### 2.16 Hóa đơn GTGT

> **Tạm ở v1.0:** Desk chưa xuất hóa đơn điện tử (MISA ở v1.3). Lễ tân chỉ **ghi thông tin công ty** ở bước 3 trả phòng (**Khách lấy hóa đơn công ty**). Rồi ghi **mã đơn** vào sổ giao ca, mục "cần xuất hóa đơn", để kế toán xuất ngoài Desk (mục 4.3). Giá niêm yết đã gồm VAT; phiếu thanh toán ghi "Giá đã gồm thuế GTGT".

[ẢNH: C2-36-Hóa đơn công ty]

### 2.17 Công nợ và hoàn tiền tại quầy

- **Thu công nợ**: khung đơn hoặc **Cần chú ý** → **Thu công nợ** → **Cách thanh toán**, **Tiền** → **Ghi nhận đã thu …**.
- **Ghi công nợ**, **xóa công nợ**: chỉ quản lý, chủ đầu tư (mục 1.10).
- **Đề nghị hoàn** (trả thừa, hủy, trả sớm): lễ tân tạo, ghi **Cách hoàn** và nơi nhận. Quản lý hoặc chủ đầu tư duyệt.
- **Chi hoàn tiền mặt** (khoản đã duyệt, nơi nhận là tiền mặt): **Nhật ký tiền → Hoàn tiền** → **Chi hoàn tiền mặt** → **Ảnh chứng từ** (biên nhận có chữ ký khách) → xác nhận. Không chi được khoản do chính mình tạo yêu cầu.
- Hoàn chuyển khoản do quản lý làm. Báo khách thời hạn.

[ẢNH: C2-37-Thu công nợ]
[ẢNH: C2-38-Chi hoàn tiền mặt]

> **Lỗi nhỏ đã biết:** sau khi chi hoàn, thông báo có dấu trừ thừa, ví dụ "Đã ghi hoàn -500.000 đ" (số ghi sổ đúng – v1.0.1). Nhập nơi nhận hoàn chuyển khoản phải gõ mã ngân hàng 6 số, chưa có danh sách chọn (v1.1).

### 2.18 Yêu cầu từ website

> **Tạm ở v1.0:** form "Yêu cầu đặt phòng" trên ottimo.vn **đang tắt** (ESC-030 A). Màn **Yêu cầu từ website** hiện "Form đặt phòng trên website đang tắt" và không có yêu cầu mới. Khách liên hệ qua Zalo, điện thoại: tạo đơn như mục 2.5, **Nguồn** = **Website** nếu khách nói tìm thấy OTTIMO qua website.

Khi chủ đầu tư bật form: yêu cầu mới hiện ở menu kèm số, hạn trả lời 15 phút. Mở yêu cầu → **Nhận xử lý** → **Báo giá** hoặc **Tạo đơn**; không thành đơn thì **Đóng – không thành đơn**.

[ẢNH: C2-39-Yêu cầu từ website, form tắt]

### 2.19 Điều phối buồng phòng trên Desk

1. **Vận hành → Buồng phòng**: **Việc buồng phòng hôm nay** (tiến độ **… xong**) và **Trạng thái buồng** từng căn.
2. Thêm việc: **Việc mới** → **Căn**, **Loại việc**, **Ngày làm**, **Ghi chú cho buồng phòng** → lưu.
3. Hủy việc: **Hủy việc** → **Lý do**.
4. Làm thay buồng phòng: **Làm xong** ở dòng việc.

[ẢNH: C2-40-Buồng phòng trên Desk, việc mới]

### 2.20 Ca đêm (00:00–05:59)

- Desk và app vẫn tính **ngày hôm trước**. Khách đến muộn của đơn hôm qua: nhận phòng như thường.
- Khách vãng lai đến ở luôn: tạo đơn, ngày đến là **ngày hôm trước**, tính 1 đêm.
- Khách của đơn **hôm nay** đến trước 06:00: Desk thêm đêm trước (mục 2.10).
- Khách đến sau 22:00 đã làm thủ tục trước: gọi người trực khi tới nơi; người trực đối chiếu giấy tờ gốc, giao mã.
- Khách Việt Nam đến từ 23:00: hạn khai báo 08:00 sáng hôm sau.

### 2.21 Tình huống thường gặp

| Tình huống | Làm gì |
|---|---|
| Desk báo "Căn vừa được người khác đặt trong lúc bạn nhập" | Thông tin vẫn còn; chọn căn khác rồi lưu |
| Desk báo "Đơn vừa chuyển sang … nên thao tác này không còn dùng được" | Người khác vừa thao tác; các nút đã cập nhật, làm lại theo trạng thái mới |
| Desk báo "Folio vừa thay đổi…" | Số mới đã tải; kiểm lại rồi lưu lần nữa |
| Không thấy bước giấy tờ khi nhận phòng | Máy chưa được cấp quyền; dùng máy quầy đã cấp hoặc nhờ chủ đầu tư cấp |
| Cần quản lý duyệt ngay tại quầy | Đăng xuất; quản lý đăng nhập tài khoản mình, mở **Cần duyệt**, duyệt, đăng xuất. Không gõ mật khẩu quản lý vào màn của mình |
| Khách đặt OTA đến xin giảm giá | Không tự giảm; gửi yêu cầu giảm giá đặc biệt, quản lý duyệt |
| Khách nhờ gửi mã cửa qua Zalo | Gửi mã riêng, không kèm số căn, địa chỉ |
| Khách để quên đồ | Ghi sổ đồ thất lạc, báo quản lý với đồ giá trị |
| Khách muốn xem/xóa dữ liệu của mình | Ghi yêu cầu, chuyển chủ đầu tư |
| Đơn OTA về khi căn đã kín | Lưu chưa gán căn, báo quản lý; gán căn hoặc đổi phòng khách khác (mục 2.6) |
| Phím Esc không đóng khung đơn | Bấm **Đóng** (sửa ở v1.0.2) |
| Tìm đơn theo tên khách không ra | Tìm theo mã đơn, mã OTA hoặc SĐT ở **Khách hàng** (sửa ở v1.0.2) |
| Báo giá thứ Sáu 1 đêm chỉ báo "tối thiểu 2 đêm" sau khi mở hộp | Đúng quy tắc; chọn 2 đêm (chữ sửa ở v1.0.2) |
| Desk lỗi, sai tiền, không làm tiếp được | Mục 5.5 |

---

## Chương 3. Buồng phòng (HK) – app nhân viên trên điện thoại

> Trước khi bắt đầu: mỗi người một tài khoản do chủ đầu tư tạo. App dùng trên điện thoại, không cần cài từ kho ứng dụng. Buồng phòng **không thấy giấy tờ khách** – đúng thiết kế. Không chụp khách, không chụp giấy tờ.

### 3.1 Đăng nhập và đăng xuất

1. Mở trình duyệt điện thoại, vào `staff.ottimo.vn`. (Nên chọn "Thêm vào Màn hình chính" để mở nhanh lần sau.)
2. Nhập **Tên đăng nhập**, **Mật khẩu**. Bấm **Đăng nhập**. Lần đầu: đổi mật khẩu tạm.
3. Thanh dưới có 4 mục: **Việc**, **Các căn**, **Báo sự cố**, **Tôi**. Chuông **Thông báo** ở trên.
4. Đổi ngôn ngữ: **Tôi → Ngôn ngữ giao diện** (Tiếng Việt / English).
5. Trả máy hoặc nghỉ việc: **Tôi → Đăng xuất**. Đăng xuất xóa dữ liệu đã lưu trên máy. App cảnh báo nếu còn thao tác chưa gửi.

[ẢNH: C0-09-Đăng nhập app nhân viên]
[ẢNH: C3-09-Tôi, đăng xuất]

Chủ đầu tư và quản lý (có 2 bước) chưa đăng nhập được app nhân viên ở v1.0: app báo "Đăng nhập 2 bước sẽ có ở bản sau".

### 3.2 Trạng thái phòng

| Mã | Trên Desk | Trên app nhân viên | Nghĩa |
|---|---|---|---|
| `VD` | VD · Trống, cần dọn | Cần dọn (khách đã đi) | Khách đã trả, chưa dọn |
| `CL` | CL · Đang dọn | Đang dọn | Đã bấm **Bắt đầu dọn** |
| `VC` | VC · Đã dọn, chờ kiểm | Đã dọn – chờ kiểm | Dọn xong, chờ lễ tân trưởng kiểm |
| `VI` | VI · Đã kiểm, sẵn sàng | Sẵn sàng đón khách | Kiểm đạt |
| `OC` | OC · Có khách, sạch | Khách đang ở – đã dọn | Có khách, phòng sạch |
| `OD` | OD · Có khách, cần dọn | Khách đang ở – cần dọn | Có khách, cần dọn |
| `OOO` | OOO · Khóa phòng, đang sửa | Đang sửa – không bán | Khóa để sửa chữa |

Lễ tân nhận khách vào căn `VC` hoặc `VI`. Mỗi sáng lúc 07:00, Desk chuyển các căn có khách sang "cần dọn" để có việc dọn trong ngày.

### 3.3 Việc của tôi

1. Mở **Việc**. Màn **Việc của tôi**, tiến độ **… xong**.
2. Việc chia nhóm: **Làm trước** · **Khách đang ở** · **Sau khi khách trả phòng** · **Đã xong** · **Đã bỏ**.
3. Làm từ trên xuống. Mỗi việc ghi căn, loại việc, giờ cần xong, **Có khách đến hôm nay …**, **Thay ga gối** (3 đêm một lần), **Khách nhắn: "…"**.
4. Việc **Chờ khách trả phòng**: chưa bấm được tới khi lễ tân trả phòng cho khách.

[ẢNH: C3-01-Việc của tôi]

**Giờ cần xong:**
| Căn | Xong trước |
|---|---|
| Trống từ đêm qua, có khách đến hôm nay | **12:00** (kiểm và báo sẵn sàng đầu ca sáng) |
| Khách trả rồi khách mới đến cùng ngày | **14:00** (dọn ngay khi khách trả) |
| Bộ đồ dùng thêm cho người ở thêm | **12:00** |

Các loại việc: **Dọn trả phòng**, **Dọn phòng khách đang ở**, **Dọn theo gói dài hạn**, **Bổ sung minibar**, **Yêu cầu của khách**, **Dọn sau sửa chữa**, **Dọn phòng thêm (khách yêu cầu)**, **Dọn gấp – khách vào khi đang dọn**, chuẩn bị/thu hồi/chuyển bộ đồ dùng thêm.

### 3.4 Dọn phòng

1. Bấm vào việc của căn. Màn **Căn …**.
2. Bấm **Bắt đầu dọn**. App ghi **Bắt đầu lúc …**. Desk thấy **Đang dọn**.
3. Làm theo các bước gợi ý (**Vệ sinh nhà tắm, thay khăn**, **Lau bếp, đổ rác, kiểm tủ lạnh**, **Bổ sung đồ dùng, nước suối**).
4. Bấm **Dọn xong**:
   - Căn trống: chuyển **Đã dọn – chờ kiểm**; lễ tân trưởng được báo đi kiểm.
   - Căn có khách: chuyển **Khách đang ở – đã dọn**.
5. Bấm nhầm: bấm **Hoàn tác** trong vài giây sau khi bấm.

[ẢNH: C3-02-Căn, bắt đầu dọn và dọn xong]

**Khách không muốn dọn hôm nay:** màn căn → **Khách không muốn dọn** → **Lý do** (**Khách nói không cần dọn**, **Treo biển "Không làm phiền"**, **Lý do khác**) → **Bỏ việc dọn hôm nay**. Lễ tân thấy lý do. Ngày mai vẫn có việc dọn như thường.

[ẢNH: C3-03-Khách không muốn dọn]

### 3.5 Các căn

**Các căn** hiện trạng thái mọi căn. Lọc: **Tất cả**, **Cần dọn**, **Có khách**, **Sạch**, **Đang sửa**. Mỗi căn ghi khách đến hôm nay/ngày mai. Buồng phòng chỉ thấy tên gọi của khách trong ngày, không thấy giá, kênh, giấy tờ.

[ẢNH: C3-04-Các căn]

### 3.6 Kiểm phòng (lễ tân trưởng)

Ở v1.0, buồng phòng **không tự kiểm** phòng mình dọn. **Lễ tân trưởng** (hoặc quản lý trên Desk) kiểm.

1. Lễ tân trưởng đăng nhập `staff.ottimo.vn` trên điện thoại bằng tài khoản của mình.
2. Nhận thông báo **Căn đã dọn – chờ kiểm**. Mở căn → **Kiểm phòng …**.
3. Đi từng mục trong danh mục, đánh dấu khi đạt chuẩn OTTIMO. App hiện **Đã kiểm …/… mục**.
4. Đạt hết: **Kiểm đạt – sẵn sàng**. Căn chuyển **Sẵn sàng đón khách** (`VI`).
5. Chưa đạt: **Chưa đạt** → ghi chỗ chưa đạt → **Ghi chưa đạt**. Căn quay về **Cần dọn (khách đã đi)** và có việc dọn lại.

[ẢNH: C3-05-Kiểm phòng]

Căn trống quá 3 ngày cần kiểm lại trước khi nhận khách.

### 3.7 Minibar

**Bổ sung minibar:** việc ghi **Bổ sung minibar: …** kèm tên món và số lượng. Bổ sung xong bấm **Làm xong**.

**Khi khách trả phòng:**

> **Tạm ở v1.0:** app nhân viên chưa có màn đếm minibar. Cách làm:
> 1. Lễ tân báo buồng phòng khách sắp trả căn nào.
> 2. Buồng phòng đếm tủ, báo lễ tân **số còn lại từng món** (gọi điện hoặc nói trực tiếp; nhắn tin nội bộ chỉ ghi số căn và số món, không ghi tên khách).
> 3. Lễ tân nhập ở bước **Minibar** khi trả phòng (mục 2.14).
<!-- QA: xác nhận app nhân viên rc.3 không có màn nhập số minibar (chỉ có việc "Bổ sung minibar"); nếu có, viết lại mục 3.7. -->

> **Lỗi nhỏ đã biết (v1.0.1):** việc **Bổ sung minibar** còn nằm dưới **Khách đang ở** sau khi khách đã trả phòng. Vẫn làm và bấm **Làm xong** như thường.

### 3.8 Bộ đồ dùng thêm

Khách vượt định mức ngủ sofa. Mỗi người thêm một bộ: 1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải, đồ vệ sinh cá nhân (không gối).
- Việc **Chuẩn bị … bộ đồ dùng thêm – căn …, trước …** → xong bấm **Đã chuẩn bị**.
- Khách đi: **Thu hồi … bộ đồ dùng thêm** → **Đã thu hồi**.
- Khách đổi phòng: **Chuyển … bộ đồ dùng thêm sang căn …** → **Đã chuyển**.

### 3.9 Báo sự cố, hỏng hóc

1. **Báo sự cố** (thanh dưới), hoặc trong màn căn: **Báo sự cố căn này**.
2. Chọn **Căn**, **Chuyện gì xảy ra?**: **Mất nước nóng**, **Điện / đèn**, **Rò nước**, **Khóa cửa**, **Tắc thoát nước**, **Wi-Fi**, **Đồ hỏng**, **Khác**.
3. **Mô tả**: vài chữ để kỹ thuật biết cần mang gì.
4. **Ảnh (nên có)**: bấm **Chụp**. Chỉ chụp chỗ hỏng; không chụp khách, không chụp giấy tờ.
5. **Mức độ**: **Gấp** (an toàn hoặc khách đang ở bị ảnh hưởng: mất nước nóng, mất điện, khóa hỏng, rò nước) · **Trong ngày** (sửa xong trong 24 giờ) · **Không gấp** (trong 3 ngày).
6. Căn không ở được: tích **Đề nghị khóa căn – không bán đến khi sửa xong**. Lễ tân hoặc bảo trì quyết định khóa.
7. Bấm **Gửi báo sự cố**. App báo **Đã tạo phiếu …**. Phiếu Gấp: bảo trì, lễ tân, quản lý được báo; bảo trì nhận việc trong 15 phút.

[ẢNH: C3-06-Báo sự cố]

Sự cố gấp mà đang mất mạng: phiếu lưu trên máy, tự gửi sau; **gọi lễ tân ngay**, đừng chờ.

Đồ khách để quên: báo lễ tân ngay.

### 3.10 Khi mất mạng

- App hiện thanh "Mất mạng. Bấm vẫn được – thao tác sẽ tự gửi khi có mạng".
- Thao tác chờ gửi hiện chip **Chờ gửi** và mục **… thao tác đang chờ gửi**. Xem ở **Tôi → Thao tác trên máy**; bấm **Gửi ngay** khi có mạng.
- Mục **Cần xem lại**: máy chủ không nhận (ví dụ căn đã đổi trạng thái, giờ bấm quá xa). Đọc lý do, bấm **Gửi lại "…"** hoặc **Đã hiểu**.
- **Đừng xóa dữ liệu trình duyệt hay gỡ app khi còn thao tác chờ gửi.**
- Kiểm phòng và đóng phiếu có khóa phòng cần có mạng.

[ẢNH: C3-07-Thao tác trên máy]

### 3.11 Thông báo

Chuông **Thông báo**: **Phiếu sửa mới**, **Việc gấp đã lên đầu danh sách**, **Căn đã dọn – chờ kiểm**, **Việc đã được hủy vì đơn thay đổi**, **Yêu cầu mới của khách**. Bấm để mở việc.

[ẢNH: C3-08-Thông báo]

### 3.12 Không được làm

- Không chụp ảnh khách, giấy tờ, màn hình Desk bằng điện thoại cá nhân.
- Không gửi thông tin khách vào nhóm Zalo.
- Không dùng tài khoản của người khác, không đưa mật khẩu cho người khác.
- Không vào căn đang có khách treo biển "Không làm phiền".

---

## Chương 4. Bảo trì, sale, kế toán

### 4.1 Bảo trì (MT) – app nhân viên

> Trước khi bắt đầu: đăng nhập `staff.ottimo.vn` như mục 3.1. Thanh dưới: **Phiếu sửa**, **Các căn**, **Báo sự cố**, **Tôi**. Bảo trì không thấy tên khách.

**Thời hạn theo mức độ:**
| Mức | Nhận việc | Xong |
|---|---|---|
| **Gấp** | Trong **15 phút** | Có phương án trong **2 giờ** (sửa xong hoặc lễ tân đổi phòng cho khách) |
| **Trong ngày** | – | Trong **24 giờ** |
| **Không gấp** | – | Trong **3 ngày** |

**Xử lý phiếu:**
1. **Phiếu sửa**. Lọc **Đang mở**, **Gấp**, **Chờ vật tư**. Phiếu ghi căn, sự cố, hạn (**Nhận việc trước … – còn … phút**, **Quá hạn … phút**).
2. Mở phiếu. Xem **Ảnh lúc báo**, **Người báo**, **Nhật ký phiếu**.
3. Bấm **Nhận việc**.
4. Thiếu vật tư: **Chờ vật tư** → **Cần vật tư gì?**, **Ngày dự kiến có vật tư** → **Lưu – chờ vật tư**. Hạn tạm dừng tới ngày đó (phiếu Gấp không dừng hạn). Có vật tư: **Sửa tiếp**.
5. Sửa xong: **Sửa xong** → **Đã làm gì?** → **Ảnh sau khi sửa** (bắt buộc với Gấp và Trong ngày) → **Xác nhận sửa xong**.
6. Phiếu có khóa phòng: căn mở khóa, mở bán lại, chuyển **Cần dọn (khách đã đi)**, buồng phòng nhận việc **Dọn sau sửa chữa**. Chỉ khi app hiện **Đã mở bán lại căn …** thì căn mới bán được. Bước này cần có mạng.

[ẢNH: C4-01-Phiếu sửa trên app]
[ẢNH: C4-02-Phiếu, nhận việc và chờ vật tư]
[ẢNH: C4-03-Sửa xong, ảnh sau sửa]

**Khóa phòng để sửa** (bảo trì hoặc lễ tân, trên Desk **Vận hành → Bảo trì**):
1. Tab **Phiếu sửa** → **Phiếu sửa mới** → căn, **Tiêu đề**, **Mô tả**, **Mức độ**, ảnh.
2. Cần khóa: tích **Khóa căn – không bán đến khi sửa xong** → **Khóa từ**, **Dự kiến xong**, **Lý do khóa** → **Tạo phiếu và khóa căn**. Desk tính ngày mở bán lại (cộng thời gian dọn và kiểm).
3. Căn đang có khách: chưa khóa được – lễ tân đổi phòng cho khách trước.
4. Khoảng khóa trùng đơn đã đặt: dời các đơn sang căn khác trước (lý do "Căn hỏng / sự cố"), rồi khóa.
5. Bảo trì có kế hoạch: tab **Khóa phòng** → **Khóa phòng có kế hoạch**. Đổi ngày: **Đổi ngày mở bán**. Bỏ: **Hủy khóa**.
6. **Mở khóa sớm** không qua phiếu: chỉ quản lý.

[ẢNH: C4-04-Desk Bảo trì, tab Khóa phòng]
[ẢNH: C4-05-Phiếu sửa mới và khóa căn trên Desk]

### 4.2 Sale nội bộ (SAL) và CTV / môi giới

> Trước khi bắt đầu: đăng nhập `desk.ottimo.vn` (điện thoại hoặc máy tính). Desk mở **Báo giá & giữ chỗ**. Sale/CTV chỉ thấy đơn và khách **của mình**; không thấy giấy tờ, không đặt đơn đã đảm bảo trực tiếp.

**Menu:** **Báo giá & giữ chỗ** (tab **Căn trống**, **Báo giá**), **Đơn của tôi**, **Khách của tôi**. Sale nội bộ có thêm **Yêu cầu từ website**.

**Báo giá và giữ chỗ:** làm như mục 2.4 bước Báo giá và Giữ chỗ.
- Báo giá hiện **Bạn nhận (…% tiền phòng)** (CTV 8 %, sale 3 %) và **OTTIMO còn lại**.
- Báo giá hết hiệu lực (3 ngày): **Gửi quản lý gia hạn**, hoặc **Lập báo giá mới**.
- Số giữ chỗ mở cùng lúc: CTV tối đa 3, sale tối đa 5.
- Khách ở từ 28 đêm: hợp đồng dài hạn vẫn làm ngoài app; nhắn lễ tân giữ phòng bằng đơn dài hạn nhập tay.
- Khách đến **hôm nay**: nhắn lễ tân tạo đơn đã thu cho khách.

[ẢNH: C4-06-Báo giá trên điện thoại]

**Cọc:**
- **Sale nội bộ**: gửi mã VietQR cho khách. Kiểm tiền về tài khoản OTTIMO rồi **Xác nhận đã nhận cọc**. Khoản do sale ghi ở trạng thái chờ đối soát; quản lý đối soát trong ngày.
- **CTV**: không gửi QR, không xác nhận cọc. Nhắn lễ tân hoặc sale nội bộ gửi mã VietQR. Khách báo đã chuyển: mở đơn → **Báo đã chuyển cọc** → **Số tiền khách chuyển**, **Đính kèm ảnh biên nhận** (JPG, PNG, WebP, tối đa 10 MB) → gửi. Lễ tân hoặc sale nội bộ kiểm sao kê rồi xác nhận.
- Tiền mặt sale/CTV thu hộ: nộp quầy. Lễ tân bấm **Đã nhận tiền mặt** ở **Nhật ký tiền → Chờ đối soát**. Hoa hồng thành "đạt" sau khi khoản này được đối soát.

[ẢNH: C4-07-Báo đã chuyển cọc]

**Đơn của tôi:** xem trạng thái đơn mình chốt, **Hoa hồng dự kiến của bạn**.

[ẢNH: C4-08-Đơn của tôi, hoa hồng dự kiến]

> **Tạm ở v1.0:** chưa có màn hoa hồng chi tiết, kanban khách tiềm năng, mẫu tin nhắn (v1.2). Sale/CTV không cấp hay gửi link check-in online; lễ tân gửi.

### 4.3 Kế toán

> Ở v1.0 **không có vai "Kế toán" riêng** trên Desk. Việc kế toán do chủ đầu tư hoặc quản lý làm trên Desk, kế toán ngồi cùng hoặc nhận số liệu từ chủ đầu tư. Cách cấp quyền cho kế toán đang chờ chủ đầu tư quyết (**ESC-038**; đội đề xuất: kế toán chưa có tài khoản ở v1.0).

**Mốc chuyển sổ (ngày D = 02/11/2026):**
- Doanh thu phòng **đêm trước D** theo sổ cũ; **từ đêm D** theo Desk. Không đêm nào nằm ở cả hai sổ.
- Cọc, tiền đã thu trước D được nhập vào Desk: Nhật ký tiền ghi **ngày nhập (D−1)**, ngày thu thật nằm ở ghi chú. Đây là **số chuyển sổ**, không phải tiền thu mới.
- Ký quỹ dài hạn và công nợ cũ (khách đã đi trước D) **ở lại sổ kế toán**, không nhập Desk.
- Chi tiết: `product/docs/day-one-guide.md` mục 6.

**Đối chiếu thu chi hằng ngày** (chủ đầu tư/quản lý làm, kế toán cùng xem):
1. **Nhật ký tiền → Nhật ký thao tác tiền**, lọc **Từ ngày** – **Đến ngày** là hôm qua.
2. Cộng theo cách thanh toán: tiền mặt (so két và sổ giao ca), chuyển khoản/VietQR (so sao kê), thẻ POS (so phiếu tổng kết máy POS), **Đã thu qua OTA** (so báo cáo kênh).
3. Tab **Chờ đối soát**: khớp chuyển khoản với sao kê (mục 1.12).
4. Tab **Hoàn tiền**: kiểm khoản hoàn đã chi có chứng từ.
5. Dòng **Điều chỉnh**, **Đảo giao dịch**, **Miễn phí / giảm giá**, **Ghi công nợ**: đọc lý do; hỏi người làm nếu chưa rõ.

**Sổ giấy 3 ngày đầu (02, 03, 04/11):**
- Lễ tân ghi song song mọi đơn mới và mọi khoản thu vào sổ giấy.
- 22:00 mỗi tối: lễ tân ca tối so sổ giấy với Desk; chủ đầu tư nhận kết quả qua điện thoại. Lệch thì ghi lại, gõ `/feedback` kèm mã đơn; sáng hôm sau lễ tân trưởng và chủ đầu tư xử lý. Không sửa tay lung tung.
- Sáng 05/11: chủ đầu tư quyết **bỏ sổ giấy** nếu 3 tối liền khớp.

**Hóa đơn GTGT:**
> **Tạm ở v1.0:** xuất ngoài Desk như hiện nay. Mỗi ngày kế toán nhận danh sách **mã đơn cần xuất hóa đơn** từ sổ giao ca của lễ tân. Chủ đầu tư/quản lý mở đơn → **Xem Phiếu thanh toán** để lấy tên công ty, mã số thuế, địa chỉ, email, số tiền. Giá niêm yết đã gồm VAT 8 % (tới khi kế toán xác nhận thay đổi từ 01/01/2027 – ESC-033).

**Báo cáo tháng:**
> **Tạm ở v1.0:** chưa có báo cáo tháng, kênh, FOC, xuất bảng tính (v1.2). Cuối tháng dùng **Nhật ký tiền** lọc cả tháng, ghi tổng theo cách thanh toán. Phí kênh OTA tạm theo tỷ lệ đã đặt (Airbnb 15,5 %, Booking 15 %, Agoda 18 %, Expedia 18 %, Trip.com 15 %).

**Đóng ca, tiền mặt:** theo mục 1.14 (sổ giao ca có chữ ký).

---

## Chương 5. Phụ lục

### 5.1 Bảng giờ

| Giờ | Việc |
|---|---|
| **06:00** | Ngày mới trên Desk. Trước 06:00 vẫn là ngày hôm trước |
| 07:00 | Lễ tân bắt đầu trả lời yêu cầu của khách; Desk chuyển căn có khách sang "cần dọn" |
| Sáng | Nhắn khách đi hôm nay xác nhận giờ trả |
| **12:00** | **Giờ trả phòng.** **Nhận phòng từ 12:00** nếu căn `VC`/`VI`, không phụ thu. Hạn buồng phòng báo sẵn sàng căn trống từ đêm qua có khách đến |
| 12:30 | Hết ân hạn trả muộn (chỉ khi căn không có khách đến cùng ngày) |
| **14:00** | Mọi căn có khách đến hôm nay **chắc chắn sẵn sàng**. Mốc chuyển sổ ngày D |
| 15:00 | Trả muộn từ 30 % lên 50 %. Khách dài hạn trả tới 15:00 không phụ thu (nếu không có khách đến) |
| **18:00** | Gọi khách chưa đến. Sau 18:00 trả phòng: thêm 1 đêm, hoặc phụ thu bằng giá 1 đêm nếu căn đã bán |
| Tối | Nhắn khách đi ngày mai xác nhận giờ trả |
| 22:00 | Ba ngày đầu: đối chiếu sổ giấy với Desk |
| **23:00** | Đánh dấu "Không đến" nếu vẫn không liên lạc được. Hạn khai báo khách Việt Nam (đến từ 23:00: trước 08:00 hôm sau) |
| +12 giờ từ giờ nhận | Hạn khai báo khách nước ngoài |
| +24 giờ từ trả phòng | Hạn ghi phát sinh sau trả phòng; hạn quản lý xem lại phụ thu bằng giá 1 đêm |

### 5.2 Bảng tiền và quy tắc (tham số ngày 27/10/2026)

| Mục | Giá trị |
|---|---|
| Phụ thu nhận sớm | 06:00–09:59: 50 % · 10:00–11:59: 30 % giá đêm đầu · từ 12:00: 0 · trước 06:00: thêm 1 đêm |
| Phụ thu trả muộn | đến 12:30 (không có khách đến): 0 · đến 15:00: 30 % · đến 18:00: 50 % giá đêm cuối · sau 18:00: thêm 1 đêm hoặc bằng giá 1 đêm |
| Cuối tuần, ngày đặc biệt | Thứ Sáu, thứ Bảy +15 % · Tết, 30/4–1/5, 2/9, 24/12–1/1 +30 % (mọi kênh) |
| Tối thiểu số đêm | 2 đêm khi ngày đến là thứ Sáu, thứ Bảy, ngày đặc biệt |
| Giảm theo số đêm | ≥ 7 đêm 10 % · ≥ 14 đêm 15 % (Trực tiếp, CTV) · ≥ 28 đêm là dài hạn |
| Cọc ngắn ngày | 30 % tiền phòng · đơn Trực tiếp thu đủ khi nhận phòng |
| Giữ chỗ | 12/24/48 giờ (mặc định 24), không quá 12:00 ngày đến, gia hạn 1 lần tối đa 24 giờ · báo giá giữ giá 3 ngày |
| Hủy (Trực tiếp) | Báo trước ≥ 7 ngày hoàn 100 % · 3–6 ngày 50 % · < 3 ngày không hoàn |
| Phụ thu người vượt định mức | Người lớn (từ 12 tuổi) 150.000 đ/đêm · trẻ 6–11 tuổi 100.000 đ/đêm · dưới 6 tuổi miễn |
| Dịch vụ, phí | Dọn phòng lẻ 100.000 đ · giặt ủi 30.000 đ/kg (tạm) · khử mùi thuốc lá 500.000 đ · mất/hỏng thẻ 200.000 đ/thẻ (tối đa 2 thẻ/đơn) |
| Khách dài hạn | Điện 5.000 đ/kWh · nước 100.000 đ/người/tháng (tính tay ở v1.0) |
| Hạn mức miễn phí | Lễ tân tự miễn minibar ≤ 100.000 đ/lần, ≤ 500.000 đ/tháng · lễ tân trưởng ≤ 300.000 đ/lần, ≤ 1.500.000 đ/tháng · quản lý ≤ giá 1 đêm/lần · chủ đầu tư không giới hạn |
| Công nợ | Hạn mặc định 3 ngày |
| Giá | Đã gồm VAT 8 % |

Tỷ lệ phụ thu nhận sớm đang chờ chủ đầu tư xác nhận lần cuối (ESC-035); đổi thì Desk tự áp, sổ tay cập nhật sau.

### 5.3 Bảng quyền theo vai (rút gọn)

✔ = làm được · D = gửi, chờ duyệt · M = chỉ của mình · – = không

| Việc | Chủ đầu tư | Quản lý | Lễ tân trưởng | Lễ tân | Buồng phòng | Bảo trì | Sale nội bộ | CTV |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Báo giá, giữ chỗ | ✔ | ✔ | ✔ | ✔ | – | – | M | M |
| Tạo đơn đã đảm bảo, đơn OTA, dài hạn nhập tay | ✔ | ✔ | ✔ | ✔ | – | – | – | – |
| Xác nhận cọc | ✔ | ✔ | ✔ | ✔ | – | – | M | – |
| Đổi căn/ngày, hủy, không đến | ✔ | ✔ | ✔ | ✔ | – | – | M (hủy) | – |
| Nhận phòng (máy được cấp) | ✔ | ✔ | ✔ | ✔ | – | – | – | – |
| Nhận phòng khi buồng chưa sẵn sàng | ✔ | ✔ | ✔ | D | – | – | – | – |
| Hoàn tác nhận phòng | ✔ | ✔ | – | – | – | – | – | – |
| Xem giấy tờ, khai báo lưu trú | ✔ | ✔ | ✔ | ✔ | – | – | – | – |
| Trả phòng, thu tiền | ✔ | ✔ | ✔ | ✔ | – | – | – | – |
| Ghi công nợ khi trả phòng | ✔ | ✔ | – | – | – | – | – | – |
| Thu công nợ | ✔ | ✔ | ✔ | ✔ | – | – | – | – |
| Xóa công nợ | ✔ | ✔ (≤ 1 đêm) | – | – | – | – | – | – |
| Miễn phí, giảm giá đặc biệt | ✔ | ✔ | ✔ trong hạn mức | D (minibar tự áp trong hạn mức) | – | – | – | – |
| Duyệt hoàn tiền | ✔ | ✔ | – | – | – | – | – | – |
| Chi hoàn tiền mặt | ✔ | ✔ | ✔ | ✔ | – | – | – | – |
| Chi hoàn chuyển khoản | ✔ | ✔ | – | – | – | – | – | – |
| Điều chỉnh folio đã chốt, đảo giao dịch | ✔ | ✔ | – | – | – | – | – | – |
| Đối soát chuyển khoản | ✔ | ✔ | – | – | – | – | – | – |
| Dọn phòng | ✔ | ✔ | ✔ | ✔ | ✔ | – | – | – |
| Kiểm phòng (VC → VI) | ✔ | ✔ | ✔ | – | – | – | – | – |
| Báo sự cố | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | – | – |
| Xử lý phiếu sửa, khóa phòng | ✔ | ✔ | ✔ | ✔ | – | ✔ | – | – |
| Mở khóa phòng không qua phiếu | ✔ | ✔ | – | – | – | – | – | – |
| Sửa giá căn, tham số vận hành | ✔ | ✔ | – | – | – | – | – | – |
| Sửa hạn mức FOC, hoa hồng, phí kênh, tham số bảo mật | ✔ | – | – | – | – | – | – | – |
| Người dùng & vai, thiết bị được cấp, tài khoản nhận tiền | ✔ | – | – | – | – | – | – | – |
| Xem Nhật ký tiền | ✔ | ✔ | M | M | – | – | – | – |

Nguồn đầy đủ: `product/docs/rbac-matrix.md`.

### 5.4 Câu hỏi thường gặp

**Vì sao 01:00 sáng Desk vẫn hiện ngày hôm qua?** Ngày trên Desk đổi lúc 06:00 (mục 0.6).

**Vì sao tôi không thấy ảnh giấy tờ?** Máy chưa được cấp quyền, hoặc vai của anh/chị không được xem (buồng phòng, bảo trì, sale), hoặc ảnh đã tự xóa theo hạn lưu.

**Quản lý ở xa, tôi cần duyệt gấp thì sao?** Quản lý duyệt trên laptop/máy riêng ở **Cần duyệt**. Ở v1.0 chưa có xác nhận trên điện thoại. Không đọc mật khẩu qua điện thoại.

**Khách hỏi phòng sẵn sàng lúc mấy giờ?** "Nhận phòng từ 12:00, phòng luôn sẵn sàng lúc 14:00."

**Khách chuyển khoản nhưng tôi chưa thấy tiền?** Chưa bấm xác nhận. Chờ, hoặc chọn cách thu khác. Ảnh chụp của khách không thay sao kê.

**Mã VietQR có đúng tài khoản không?** Mã luôn trỏ về tài khoản chủ đầu tư đặt. Nếu có cảnh báo "Tài khoản nhận vừa đổi", đọc lại tên tài khoản với khách.

**Tôi lỡ bấm sai một khoản thu?** Báo quản lý **Đảo giao dịch**. Lễ tân không xóa được giao dịch.

**Khách muốn bill gửi qua Zalo?** In phiếu, chọn "Lưu dưới dạng PDF" trong hộp in của trình duyệt, gửi riêng 1–1 cho khách (bản gửi tự động có ở v1.2).

**Đơn OTA mới về nhưng Desk không tự có?** Đúng ở v1.0. Lễ tân nhập tay ngay và đóng phòng trên các kênh khác.

**Tôi đổi giá nhưng đơn cũ không đổi?** Đúng. Đơn, báo giá tạo trước ngày hiệu lực giữ giá cũ.

**Tại sao đổi tài khoản nhận tiền không có hiệu lực ngay?** Chống tráo tài khoản. Sớm nhất từ ngày kinh doanh kế tiếp.

**Buồng phòng bấm khi mất mạng có mất không?** Không. Thao tác lưu trên máy, tự gửi khi có mạng. Đừng xóa dữ liệu trình duyệt.

**Desk báo "Phiên đăng nhập đã hết"?** Đăng nhập lại; thông tin đang nhập vẫn được giữ trên máy đó.

### 5.5 Khi có sự cố – liên hệ ai

| Sự cố | Báo ai | Trong lúc chờ |
|---|---|---|
| Mất mạng tại quầy | Lễ tân trưởng | 4G điện thoại cơ sở → Desk trên điện thoại cơ sở → sổ giấy |
| Mất điện | Lễ tân trưởng → quản lý | Sổ giấy; quá 4 giờ báo chủ đầu tư |
| Desk báo lỗi, không đặt / nhận / trả phòng / thu tiền được, hoặc **sai tiền** | Lễ tân trưởng → quản lý → chủ đầu tư. Chủ đầu tư gõ `/feedback` với chữ **"P0"** ở đầu – đội sửa trong ngày | Ghi sổ giấy, nhập bù khi Desk chạy lại |
| Lỗi nhỏ, chữ sai, góp ý | Chủ đầu tư gõ `/feedback <mô tả>` | Làm tiếp; bản vá hằng tuần thứ Tư 09:30–10:30 |
| Quên mật khẩu, mất điện thoại, tài khoản bị khóa | Chủ đầu tư | – |
| Khách khiếu nại về dữ liệu cá nhân | Chủ đầu tư | Ghi lại yêu cầu, không hứa |
| Hỏng hóc trong căn | Báo sự cố trên app; Gấp thì gọi bảo trì và lễ tân | Đổi phòng cho khách nếu cần |
| Nghi lộ mật khẩu hoặc tài khoản lạ đăng nhập | Chủ đầu tư ngay (khóa tài khoản, đặt lại mật khẩu) | Đăng xuất mọi máy |

Khi báo lỗi, ghi: **căn, mã đơn, giờ, đã bấm gì, Desk báo gì**. Chụp màn hình được thì **che** số giấy tờ, số tài khoản, mã QR, mã cửa. Desk có **mã tham chiếu** trong câu báo lỗi: ghi lại mã này.

### 5.6 Chưa có ở v1.0 và cách làm tạm

| Chưa có | Bản dự kiến | Cách làm tạm |
|---|---|---|
| Quản lý xác nhận từ xa trên điện thoại | v1.1 | Duyệt ở **Cần duyệt** bằng tài khoản của mình |
| Kết nối OTA tự động | v1.1 | Nhập tay ngay, đóng phòng trên extranet |
| Mã cửa trên app, báo tự động khi khách quá giờ trả | v1.1 | Tạo mã trên app khóa như hiện nay; lễ tân theo dõi giờ trả ở **Hôm nay** |
| Bảng dự phòng in sẵn khi mất mạng | v1.1 | Sổ giấy 3 ngày đầu |
| Chấm công qua Wi-Fi | v1.1 | Như hiện nay |
| Báo cáo tháng, kênh, FOC; xuất dữ liệu | v1.2 | **Nhật ký tiền** lọc theo kỳ |
| Mẫu tin, lịch nhắn khách, Zalo OA | v1.2 | Nhắn tay bằng câu chuẩn |
| Mẫu in bill, PDF, gửi bill qua email/Zalo | v1.2 | **In phiếu** qua trình duyệt |
| Hợp đồng dài hạn đủ vòng (ký quỹ, kỳ thu, điện nước) | v1.3 | **Đơn dài hạn nhập tay** + sổ |
| Hóa đơn điện tử | v1.3 | Xuất ngoài Desk |
| Đóng ca | v1.3 | Sổ giao ca có chữ ký (mục 1.14) |
| Khách tự gửi yêu cầu về dữ liệu cá nhân | v1.3 | Chủ đầu tư xử lý tay |
| Đếm minibar trên app buồng phòng | chưa xếp bản | Buồng phòng báo số, lễ tân nhập |
| Vai "Kế toán" riêng | chờ ESC-038 | Chủ đầu tư/quản lý làm cùng kế toán |
| Form "Yêu cầu đặt phòng" trên website | Có sẵn, đang tắt (ESC-030) | Zalo, điện thoại |

### 5.7 Lịch sử sổ tay

| Bản | Ngày | Người | Thay đổi |
|---|---|---|---|
| 1.0 | 27/10/2026 | BA | Bản đầu theo `v1.0.0-rc.3` (`70fe734`). Chờ QA chụp ảnh và kiểm các điểm ghi chú trong mã nguồn tệp, UXD dựng HTML theo nhận diện OTTIMO |
