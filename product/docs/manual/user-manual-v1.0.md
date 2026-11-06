# Sổ tay sử dụng OTTIMO Desk v1.0

- Dành cho: Chủ đầu tư dùng để đào tạo từng bộ phận trước ngày chạy thật **thứ Hai 02/11/2026**
- Áp dụng cho: **OTTIMO Desk v1.0** – bản phát hành `v1.0.4` (Desk thật chạy từ 30/10/2026)
- Lập: BA · 27/10/2026 · Bản nội dung 1.19 (07/11/2026; v1.0.4 đang chạy trên production từ 06/11/2026). Lịch sử các bản: mục 5.7.
- Sổ tay không chứa mật khẩu, mã 2 bước, mã khôi phục, số tài khoản, mã cửa hay số giấy tờ. Khi đào tạo, anh/chị cũng không ghi những thứ này lên bảng hay vào tài liệu phát tay.
- **Tài liệu nội bộ OTTIMO – không chụp, không đăng lên mạng. Nghỉ việc thì trả lại.**

<!-- Nguồn kỹ thuật (không hiện khi dựng HTML): bản 1.3 theo `v1.0.0` (commit `8b3aec8` = rc.6; thay đổi rc.3 → rc.6: rounds/round-03/qa/qa3-rc1.md mục 17–19); bản 1.0–1.2 theo `v1.0.0-rc.3` (commit `70fe734`); `release-notes.md` (v1.0.0, PO 30/10), `staff-one-pager.md`, `day-one-guide.md`, `business-rules.md` v0.4.7, `rbac-matrix.md` v0.2.5, `production-defaults.ts`, chuỗi chữ thật của Desk và app nhân viên. Danh sách ảnh: `product/docs/manual/screenshot-list.md`. Review: `rounds/round-03/reviews/DOM-on-BA-user-manual.md`, `PO-on-BA-user-manual.md`; phản hồi `rounds/round-03/responses/BA-on-manual-reviews.md`. -->

## Cách đọc sổ tay

- Mỗi chương dành cho một bộ phận và đọc riêng được. Chương 0 và chương 5 dùng chung cho mọi người. Từ ngữ khó (folio, FOC, đối soát…) giải thích ở mục **5.0**.
- Chữ **in đậm** là tên nút, tên màn hình, tên ô đúng như trên giao diện. Bản vá hằng tuần có thể đổi vị trí nút hoặc vài chữ nhỏ; việc phải làm thì giữ nguyên.
- `[ẢNH: mã-mô tả]` là chỗ chèn ảnh chụp màn hình.
- Khung **Tạm ở v1.0** là việc bản này chưa làm được và cách làm thay cho tới bản sau.
- Khung **Lỗi đang sửa** là lỗi đội đã biết và đang sửa. Làm theo cách tạm trong khung; khi bản sửa lên, chủ đầu tư báo lại.
- Con số (giờ, phần trăm, tiền) ghi theo tham số ngày 27/10/2026. Chủ đầu tư đổi được ở **Tham số quy tắc**. Khi số trên Desk khác số trong sổ tay:
  - Chủ đầu tư vừa đổi tham số (xem **Lịch sử thay đổi**): làm theo Desk.
  - Không rõ vì sao khác, nhất là **số tiền**: vẫn làm theo Desk, nhưng **báo lễ tân trưởng ngay trong ca** kèm mã đơn. Có thể là lỗi ("P0" nếu sai tiền, mục 5.5).
- Học thao tác ở đâu, tập bài nào: mục **5.8**.
- Chủ đầu tư và quản lý đọc thêm: **Sổ vận hành** `product/docs/so-van-hanh.md` (việc định kỳ, khi có báo động, khi có sự cố) và **Từ điển tham số quy tắc** `product/docs/tham-so-quy-tac.md` (nghĩa, giới hạn, mức đội đề xuất của từng tham số – mục 1.4).
- **Hiện OTTIMO có một người trực quầy giữ cả 6 vai** (quản lý, lễ tân trưởng, lễ tân, buồng phòng, bảo trì, sale), chưa chia ca. Sổ tay viết theo vai để dùng được khi có thêm người. Tới lúc đó: chỗ ghi "lễ tân trưởng", "quản lý" là chính người trực, làm bằng quyền của vai đó và luôn ghi lý do; "báo quản lý" nghĩa là ghi sổ giao ca để chủ đầu tư xem lại sáng hôm sau; "đầu ca" là lúc mở quầy, "cuối ca" là trước khi rời quầy.

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
| `ottimo.vn` | **Website** | Khách tìm hiểu, gửi yêu cầu đặt phòng | Mọi thiết bị | Giới thiệu OTTIMO bằng 5 ngôn ngữ; form **Yêu cầu đặt phòng** có giá ước tính; nút Zalo, gọi điện, email |

- Trang khách không có tên đăng nhập. Mỗi đơn có một link riêng do lễ tân tạo (mục 2.9). **Check-in online đã mở lại từ 06/11/2026**: lễ tân gửi link cho khách của đơn đã xác nhận (mục 2.9).
- Website ngày 06/11: form "Yêu cầu đặt phòng" **đã bật từ chiều 30/10**; đủ **5 ngôn ngữ** – tiếng Anh ở trang chính, tiếng Việt `/vi/`, tiếng Hàn `/ko/`, tiếng Trung giản thể `/zh/`, tiếng Nga `/ru/`; **giá ước tính đã bật từ 06/11**; thông báo quyền riêng tư bản **2026-11-04**, đủ 5 ngôn ngữ. Yêu cầu khách gửi hiện ở **Yêu cầu từ website** (mục 2.18). Chủ đầu tư tắt được form hoặc giá ngay trên Desk (mục 1.4).

[ẢNH: C0-10-Trang khách trên điện thoại]

### 0.2 Đăng nhập Desk

1. Mở trình duyệt Chrome hoặc Safari, vào `desk.ottimo.vn`.
2. Nhập **Tên đăng nhập** và **Mật khẩu**. Bấm **Đăng nhập**.
3. Lần đầu: Desk mở màn **Đặt mật khẩu của bạn**. Nhập **Mật khẩu hiện tại** (mật khẩu tạm chủ đầu tư đưa), **Mật khẩu mới**, **Nhập lại mật khẩu mới**. Bấm **Lưu và vào ứng dụng**.
4. Chủ đầu tư và quản lý: lần đầu, sau khi đổi mật khẩu tạm, Desk mở **Bật xác thực 2 bước** (mục 0.3). Các lần sau: nhập thêm mã 6 số.
5. Desk mở màn chính theo vai: chủ đầu tư và quản lý vào **Tổng quan**; lễ tân vào **Hôm nay**; sale và CTV vào **Báo giá & giữ chỗ**.

[ẢNH: C0-01-Đăng nhập Desk]
[ẢNH: C0-02-Đặt mật khẩu lần đầu]

Quy tắc mật khẩu: ít nhất 10 ký tự, không chứa tên hoặc số điện thoại của mình, không phải mật khẩu phổ biến.

> **Trước ngày chạy 02/11:** trên Desk thật (`desk.ottimo.vn`) chỉ **đăng nhập, đổi mật khẩu tạm, đăng xuất**. Không tạo đơn, không thu tiền thử: dữ liệu tiền trên Desk thật chỉ ghi thêm, không xóa được. Tập thao tác trên **Desk tập** bằng tài khoản tập (mục 5.8).

Luôn nhớ:
- **Mỗi người một tài khoản.** Không dùng chung. Không đọc mật khẩu qua điện thoại. Không gõ mật khẩu cho người khác.
- Chỉ đăng nhập ở `desk.ottimo.vn` bằng cách **gõ địa chỉ hoặc dùng dấu trang**. Không bấm link đăng nhập gửi qua Zalo, email, tin nhắn.
- Trình duyệt hỏi **Lưu mật khẩu?** thì luôn chọn **Không bao giờ**, nhất là trên máy quầy.
- Rời máy thì bấm **tên của mình** ở góc trên bên phải → **Đăng xuất**.
- Quên mật khẩu: nhờ chủ đầu tư **Đặt lại mật khẩu** (mục 1.5). Desk không có nút "quên mật khẩu".
- Gõ sai nhiều lần: Desk báo "Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại."

Menu dưới tên của mình gồm: **Đổi mật khẩu** · **Bảo mật tài khoản** · **Ngôn ngữ giao diện** · **Giao diện** (Theo máy / Sáng / Tối) · **Đăng xuất**. Trước v1.0.3, mục **Bảo mật tài khoản** có tên **Xác thực 2 bước**.

Trang **Bảo mật tài khoản** có hai khối: **Xác thực 2 bước** (mục 0.3) và **Email nhận thông báo bảo mật** (mục 0.3a).

[ẢNH: C0-06-Menu Tài khoản]

### 0.3 Đăng nhập 2 bước (bắt buộc với chủ đầu tư và quản lý)

Lễ tân trưởng cũng bắt buộc (mục 1.5). **Từ v1.0.5** Desk tự ép: lễ tân trưởng chưa bật bị hạn chế ngay ở lượt bấm kế tiếp sau khi bản lên, chỉ còn màn **Bật xác thực 2 bước**. Vì vậy lễ tân trưởng bật **trước ngày lên v1.0.5**, theo các bước dưới đây.

Ở v1.0, bước thứ hai là **mã 6 số trong ứng dụng xác thực** trên điện thoại (Google Authenticator, Microsoft Authenticator hoặc tương tự), kèm **10 mã khôi phục** dùng khi mất điện thoại. Desk v1.0 chưa đăng nhập bằng Face ID/vân tay (passkey).

**Bật lần đầu** (Desk tự mở màn **Bật xác thực 2 bước** ngay sau khi anh/chị đổi mật khẩu tạm). **Làm việc này trên máy hoặc điện thoại riêng của anh/chị, không làm trên máy quầy.**
1. Cài ứng dụng xác thực trên điện thoại. Bấm **Tôi đã cài – Tiếp tục**.
2. Nhập mật khẩu đăng nhập. Bấm **Tạo mã QR**.
3. Trong ứng dụng xác thực: **Thêm tài khoản → Quét mã QR**, quét mã trên màn hình.
4. Nhập mã 6 số ứng dụng đang hiện. Bấm **Xác nhận**.
5. Desk hiện **10 mã khôi phục** một lần duy nhất. Bấm **In** (lấy giấy ngay khỏi máy in) hoặc **Tải về (.txt)** rồi chép vào trình quản lý mật khẩu, **xóa tệp và dọn thùng rác**. **Không in, không tải trên máy quầy.** Cất 2 nơi tách khỏi điện thoại. Không chụp ảnh, không gửi qua chat.
6. Tích ô **Tôi đã cất 10 mã này ở nơi an toàn, tách khỏi điện thoại**. Nút **Hoàn tất (tích ô "đã lưu" trước)** đổi thành **Hoàn tất**. Bấm **Hoàn tất**.

[ẢNH: C0-03-Bật xác thực 2 bước, mã QR]
[ẢNH: C0-04-Mười mã khôi phục]

**Đăng nhập hằng ngày:**
1. Nhập tên đăng nhập, mật khẩu, bấm **Đăng nhập**.
2. Màn **Nhập mã xác thực**: mở ứng dụng, nhập mã 6 số đang hiện. Bấm **Xác nhận**.

[ẢNH: C0-05-Nhập mã xác thực]

**Thao tác nhạy cảm** (thêm người dùng, đổi tài khoản nhận tiền, cấp quyền máy…): Desk mở hộp **Xác nhận bằng mật khẩu và mã xác thực**. Mỗi mã chỉ dùng một lần; vừa dùng thì chờ ứng dụng hiện mã mới.

**Sắp hết mã khôi phục:** Desk nhắc "Sắp hết mã khôi phục". Bấm **tên của mình → Bảo mật tài khoản → khối Xác thực 2 bước → Tạo bộ mã mới** (trên máy riêng; trước v1.0.3: **tên của mình → Xác thực 2 bước → Tạo bộ mã mới**). Bộ cũ hết hiệu lực ngay.

### 0.3a Email nhận thông báo bảo mật (có từ v1.0.3)

> **Có từ v1.0.3.** Tới khi v1.0.3 lên, Desk chưa có khối này. **Sau khi lên, chủ đầu tư vẫn kiểm bảo mật mỗi sáng tới khi đội bảo mật báo bỏ** (mục 1.1). Thấy thư đầu tiên về hộp thư **chưa** phải lúc bỏ. Thứ tự nhập email ngày v1.0.3 lên: mục 1.16.
>
> Nếu đội báo **tạm quay về bản trước**: menu trở lại tên **Xác thực 2 bước** và khối email tạm ẩn. Email đã lưu vẫn dùng, thư báo bảo mật vẫn tới. Không cần nhập lại. Cần đổi email gấp thì báo chủ đầu tư.

OTTIMO gửi thư báo tới địa chỉ này khi có việc quan trọng với tài khoản: dùng mã khôi phục, đặt lại 2 bước, đổi tài khoản nhận cọc, đổi email. Đọc và xử lý theo bảng **Thư nào – làm gì** ở cuối mục.

| Vai | Email nhận thông báo bảo mật |
|---|---|
| Chủ đầu tư, quản lý | **Bắt buộc.** Chưa có, Desk nhắc trên đầu trang: "Tài khoản của bạn chưa có email nhận thông báo bảo mật. Thêm email để được báo khi có thay đổi quan trọng." Bấm **Thêm email** |
| Lễ tân trưởng | Không bắt buộc, **khuyến khích** thêm email riêng (vai này có quyền duyệt trong hạn mức và nhận phòng ngoại lệ) |
| Vai khác | Không bắt buộc. Muốn nhận thì thêm như dưới đây |

**Chọn hộp thư nào:**
- Dùng **email riêng chỉ mình anh/chị đọc**, ví dụ `ten.rieng@example.test`.
- **Không dùng hộp thư chung** của cơ sở: `info@ottimo.vn`, `booking@ottimo.vn`, Gmail dùng cho Booking.com/Agoda/Airbnb, hộp thư của quầy, email của người nhà. Lý do: ai đọc được hộp thư chung cũng đọc và xóa được thư báo của anh/chị.
- **Desk chặn `info@` và `booking@` của cơ sở**, kể cả dạng có dấu cộng như `info+…@`, `booking+…@`. Các hộp thư chung khác (Gmail dùng cho OTA, hộp thư của quầy…) Desk không nhận ra, anh/chị phải tự tránh.
- Hộp thư này **không đăng nhập trên máy quầy, máy tính bảng của cơ sở** hay máy dùng chung, và **không cài tự chuyển tiếp** sang hộp thư khác. Nên bật đăng nhập 2 bước cho chính hộp thư đó.

**Mỗi người tự nhập email của mình:**
1. Bấm **tên của mình → Bảo mật tài khoản**. Khối **Email nhận thông báo bảo mật** ở dưới khối **Xác thực 2 bước**. Góc phải khối ghi **Chưa có** hoặc **Đã có**.
2. Chưa có email: nhập vào ô **Email**, bấm **Thêm email**. Đã có: bấm **Đổi email**, nhập địa chỉ mới, bấm **Lưu email**.
3. Hộp **Lưu email nhận thông báo bảo mật** hiện **Địa chỉ mới**. Đọc lại từng ký tự. Nhập **Mật khẩu đăng nhập**, và **Mã trong ứng dụng xác thực (6 số)** nếu tài khoản có 2 bước. Bấm **Lưu email**.
   - Địa chỉ là `info@` hoặc `booking@`: **sau khi** bấm **Lưu email**, Desk báo dưới ô **Email**: "Đây là hộp thư chung của cơ sở. Thông báo bảo mật cần tới một email riêng." Mật khẩu và mã **không bị tính là sai**, mã chưa bị dùng. Nhập một email riêng khác.
4. Desk báo "Đã lưu. Thông báo đã gửi tới địa chỉ này. Sau 15 phút chưa thấy thư, hãy xem mục Spam hoặc kiểm tra lại địa chỉ." (lần đầu thêm) hoặc "Đã lưu. Thông báo đã gửi tới địa chỉ mới và địa chỉ cũ. Sau 15 phút chưa thấy thư, hãy xem mục Spam hoặc kiểm tra lại địa chỉ." (khi đổi). Mở hộp thư trên máy hoặc điện thoại riêng, tìm thư **OTTIMO – Security notice: notification email changed**. Thư nằm trong Spam: đánh dấu **Không phải thư rác**.

[ẢNH: C0-12-Khối Email nhận thông báo bảo mật]
[ẢNH: C0-13-Hộp Lưu email nhận thông báo bảo mật]

- "Mật khẩu hoặc mã chưa đúng. Kiểm tra lại rồi nhập mã mới.": chờ ứng dụng hiện mã mới, nhập lại. Tài khoản **không có** 2 bước (không có ô mã): câu này nghĩa là **mật khẩu chưa đúng**, nhập lại mật khẩu.
- Sai **5 lần**, Desk báo "Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại." (khoảng 15 phút). Trong lúc đó **mọi thao tác cần mật khẩu và mã đều chờ** (duyệt, đổi tài khoản nhận, cấp quyền máy…), không riêng khối email. Không tự sai 5 lần mà vẫn thấy câu này: báo chủ đầu tư (chủ đầu tư: gọi đội).
- "Địa chỉ này đã được lưu. Không có gì thay đổi.": địa chỉ đã đúng, không cần làm gì.
- "Email chưa đúng dạng, ví dụ ten@example.com.": gõ lại địa chỉ.
- **Xóa email**: sau khi xóa, anh/chị không nhận thông báo bảo mật qua email nữa. Chủ đầu tư và quản lý muốn thay địa chỉ thì bấm **Đổi email**, không xóa.
- Desk hiện **đủ** địa chỉ email ở khối này và ở **Người dùng & vai** (không che). **Không chụp màn hình** các màn này để gửi chat hay báo lỗi: báo lỗi bằng lời, chép đủ câu Desk báo. Thư báo và thông báo trong app không ghi địa chỉ.
- Chủ đầu tư đặt email cho nhân viên ở **Người dùng & vai** (mục 1.5).

**Ai nhận thư khi email thay đổi.** Mỗi lần email của một tài khoản được thêm, đổi hoặc xóa, OTTIMO gửi thư **Security notice** tới **địa chỉ mới** (khi thêm hoặc đổi), **địa chỉ cũ** (khi đổi hoặc xóa) và **các chủ đầu tư** (mọi lần). Thư không ghi địa chỉ email, không có link, không hỏi mật khẩu hay mã.

**Thư nào – làm gì.** Tiêu đề thư luôn bắt đầu bằng "OTTIMO – ", ghi tiếng Anh rồi tiếng Việt. Người có tài khoản đó và các chủ đầu tư đều nhận thư (dòng 3: các chủ đầu tư).

| Tiêu đề thư | Gửi khi | Việc này mình **không** biết trước thì làm gì |
|---|---|---|
| **Security notice: a recovery code was used** / Thông báo bảo mật: đã dùng mã khôi phục | Một tài khoản (kể cả của mình) đăng nhập bằng mã khôi phục | **Thư về chính mình:** mở Desk bằng cách **gõ địa chỉ**, **đổi mật khẩu**, **Tạo bộ mã mới** (mục 0.3), rồi gọi chủ đầu tư (chủ đầu tư: gọi đội). **Thư về nhân viên** (chủ đầu tư): **gọi điện** cho người đó theo số đã lưu sẵn. Người đó nói không phải mình: **Khóa tài khoản** ngay (mục 1.5), xem **Tổng quan → Cần chú ý**, gọi đội |
| **Security notice: 2-step verification was reset** / Thông báo bảo mật: xác thực 2 bước đã được đặt lại (**từ v1.0.4**; ở v1.0.3: **Security notice: two-step sign-in was reset** / Thông báo bảo mật: đăng nhập 2 bước đã được đặt lại) | 2 bước của một tài khoản bị đặt lại. Thư có thể ghi "bởi đội kỹ thuật OTTIMO" | Làm như dòng trên. Thư ghi "bởi đội kỹ thuật OTTIMO" mà anh/chị không đang làm thủ tục khôi phục với đội: **gọi đội ngay theo số đã biết**, không theo số nào ghi trong thư. **Từ v1.0.4**, chủ đầu tư cũng nhận thư này mỗi lần chính mình bấm **Đặt lại xác thực 2 bước** cho một người (mục 1.5; thư không có chữ "bởi đội kỹ thuật OTTIMO"): đó là việc mình biết trước, không cần làm gì |
| **Security notice: receiving account update** / Thông báo bảo mật: cập nhật tài khoản nhận chuyển khoản (**từ v1.0.4**; ở v1.0.3: **Notice: the deposit receiving account was changed** / Thông báo: tài khoản nhận cọc đã thay đổi) | Tài khoản nhận chuyển khoản (VietQR) được lên lịch đổi, hoặc lịch đổi bị **hủy**. Từ v1.0.4 thân thư nói rõ: đặt lịch – "A new receiving bank account was set, effective from {ngày}." / "Tài khoản ngân hàng nhận chuyển khoản mới đã được đặt, có hiệu lực từ ngày {ngày}."; hủy lịch – "The receiving bank account change scheduled for {ngày} was cancelled." / "Lịch đổi tài khoản ngân hàng nhận chuyển khoản từ ngày {ngày} đã được hủy."; có lúc chỉ có câu chung "…vừa được cập nhật" | Làm theo mục 1.7 "Nhận thông báo đổi tài khoản nhận mà anh/chị không làm": chủ đầu tư **Hủy lịch**, đổi mật khẩu, tạo bộ mã khôi phục mới, báo đội. Lễ tân **ngừng gửi mã VietQR** tới khi chủ đầu tư xác nhận |
| **Security notice: notification email changed** / Thông báo bảo mật: email nhận thông báo đã thay đổi | Email của một tài khoản được thêm, đổi hoặc xóa | **Thư về email của mình:** không trả lời thư. Mở Desk bằng cách **gõ địa chỉ**, **đổi mật khẩu**, báo chủ đầu tư ngay trong ngày. **Thư về email của nhân viên** (chủ đầu tư): **gọi điện** hỏi người đó. Không phải người đó làm: **Khóa tài khoản** như dòng đầu |

- Ở v1.0.3, thư về tài khoản nhận cọc **không có chữ "Security notice"** (tiêu đề bắt đầu bằng "Notice:"). **Từ v1.0.4**, cả 4 loại thư đều bắt đầu bằng "Security notice:". Thư **hủy** lịch đổi tài khoản nhận cũng có tiêu đề "receiving account update", giống thư đặt lịch: đọc câu đầu của thư để biết là đặt hay hủy. Việc mình không biết trước thì vẫn làm theo dòng tài khoản nhận ở bảng trên. **Đừng lọc thư theo chữ Security notice.** Thư đầu tiên của OTTIMO vào Spam thì đánh dấu **Không phải thư rác**.
- Thư báo của OTTIMO **không có link**, không hỏi mật khẩu hay mã. Thư nào có link đăng nhập hoặc hỏi mã là thư giả: không bấm, báo chủ đầu tư.
- **Từ v1.0.4**, thư dùng đúng chữ trên Desk: "xác thực 2 bước" (không còn "đăng nhập 2 bước"), "chủ đầu tư" (không còn "chủ cơ sở"), "tài khoản nhận chuyển khoản" (không còn "tài khoản nhận cọc"). Chân thư: "Thư bảo mật của OTTIMO không bao giờ có đường liên kết và không bao giờ hỏi mật khẩu hay bất kỳ mã nào."
- Hỏi lại ai về một thư báo: **gọi điện** theo số đã lưu sẵn, **không hỏi qua Zalo hay tin nhắn** (tài khoản chat cũng có thể đã bị người khác chiếm).

### 0.4 Mất điện thoại, quên mật khẩu

| Tình huống | Làm gì |
|---|---|
| Lễ tân, buồng phòng, bảo trì, sale quên mật khẩu | **Báo chủ đầu tư.** Chủ đầu tư đặt lại, đưa mật khẩu tạm tận tay |
| Nhân viên mất điện thoại có đăng nhập app nhân viên | **Báo chủ đầu tư ngay** để khóa tài khoản và đặt lại mật khẩu |
| Chủ đầu tư hoặc quản lý mất điện thoại, còn mã khôi phục | Ở màn nhập mã, bấm **Mất điện thoại? Dùng mã khôi phục**, nhập một mã, bấm **Đăng nhập bằng mã khôi phục**. Desk mở **Đăng ký lại trên điện thoại mới**: làm lại như mục 0.3. Quản lý: rồi **báo chủ đầu tư** để **Đặt lại mật khẩu** cho mình (Desk đăng xuất trên mọi máy, kể cả máy bị mất) |
| Mất điện thoại hoặc máy tính bảng có **app khóa cửa** | **Báo chủ đầu tư ngay** để đổi mật khẩu tài khoản app khóa và thu hồi quyền của máy đó |
| Quản lý mất cả điện thoại lẫn mã khôi phục | **Báo chủ đầu tư**, không xin mã của người khác. Chủ đầu tư **gặp tận mặt** người đó rồi mới làm, **không làm theo tin nhắn** hay cuộc gọi. Chưa gặp được ngay: **Khóa tài khoản** của người đó trước (mục 1.5; khóa cũng đăng xuất người đó trên mọi máy, kể cả điện thoại bị mất), gặp rồi mới làm tiếp. Chủ đầu tư, trên máy riêng, lúc người đó ngồi cùng, bấm **Đặt lại xác thực 2 bước** cho người đó (mục 1.5, khối **Đặt lại xác thực 2 bước**); đã khóa thì **Mở khóa** sau đó. Người đó **giữ tài khoản cũ** (tên đăng nhập, vai, email, lịch sử thao tác), đăng nhập ngay trên laptop riêng bằng mật khẩu của mình. Desk mở **Bật xác thực 2 bước**: người đó bật lại trên điện thoại mới, cất 10 mã khôi phục mới (mục 0.3), xong mới rời đi. **Không nhờ đội kỹ thuật đặt lại 2 bước**; **Đặt lại mật khẩu không gỡ 2 bước** |
| Buồng phòng, bảo trì, lễ tân trưởng (dùng app nhân viên) đã bật 2 bước rồi mất cả điện thoại lẫn mã khôi phục | **Báo chủ đầu tư.** Chủ đầu tư gặp tận mặt như dòng trên (chưa gặp được ngay: **Khóa tài khoản** trước), rồi **Đặt lại xác thực 2 bước** cho người đó (mục 1.5). Người đó giữ tài khoản cũ, đăng nhập lại Desk và app nhân viên bằng tên đăng nhập, mật khẩu của mình; Desk và app không hỏi mã nữa. Lễ tân trưởng bật lại 2 bước trên Desk ngay buổi đó (bắt buộc – mặc định đội chọn, mục 1.5 bước 7; anh/chị đổi được, báo đội); buồng phòng, bảo trì bật lại chỉ khi muốn (tùy chọn). Không nhờ đội đặt lại |
| Chủ đầu tư mất cả điện thoại lẫn mã khôi phục | Chủ đầu tư làm theo thủ tục khôi phục riêng đã diễn tập với đội kỹ thuật (không ghi trong sổ tay này). OTTIMO chỉ có một tài khoản chủ đầu tư, nên không ai trong Desk đặt lại được mật khẩu hay 2 bước cho chủ đầu tư. Muốn thêm tài khoản chủ đầu tư cho **một người khác** anh/chị tin cậy (ví dụ đồng sở hữu) thì báo đội trước: người đó có toàn quyền như anh/chị, và hai chủ đầu tư đặt lại được mật khẩu và 2 bước cho nhau. Không tạo tài khoản chủ đầu tư thứ hai cho chính mình. |

**Không ai** – chủ đầu tư, quản lý, đội kỹ thuật, ngân hàng hay OTA – hỏi mật khẩu, mã 6 số hay mã khôi phục của anh/chị. Ai hỏi thì không đưa và báo chủ đầu tư.

### 0.5 Máy quầy được cấp quyền

- Giấy tờ khách, ảnh giấy tờ, **Nhận phòng** và **Nhập nơi nhận hoàn** chỉ làm được trên **máy đã được chủ đầu tư cấp quyền** (mục 1.6).
- Góc trái màn hình Desk hiện **Máy quầy đã cấp quyền** hoặc **Máy chưa cấp quyền giấy tờ**.
- Trên máy chưa cấp quyền, mục menu **Giấy tờ & khai báo** và bước giấy tờ khi nhận phòng đều bị ẩn; Desk báo "Máy này chưa được cấp quyền". Điện thoại cá nhân không bao giờ được cấp quyền.
- **Lỗi nhỏ đang sửa (v1.0.3 hoặc v1.0.4):** trên máy chưa cấp quyền, nút **Nhập nơi nhận hoàn** vẫn hiện, nhưng bấm **Lưu** thì Desk không lưu và báo "Máy này chưa được cấp quyền xem giấy tờ và mã cửa…". Gặp câu này khi lưu nơi nhận hoàn: chuyển sang máy quầy đã cấp quyền, làm lại.
- Máy quầy đã cấp quyền **không cài, không mở Zalo, Zalo Web hay ứng dụng chat** nào, **không đăng nhập hộp thư riêng** (Gmail hay email của ai), và không dùng để nhắn khách (mục 2.4, 0.3a).

[ẢNH: C0-08-Chip máy quầy đã cấp quyền]
[ẢNH: C0-11-Chip máy chưa cấp quyền]

### 0.6 Ngày trên Desk đổi lúc 06:00

- Ngày kinh doanh bắt đầu **06:00**, không phải 00:00. Từ 00:00 đến 05:59, Desk và app nhân viên vẫn tính là **ngày hôm trước**.
- Ví dụ: 02:00 sáng ngày 03/11, khách vãng lai đến ở luôn. Desk tạo đơn ngày đến **02/11**, tính 1 đêm, trả phòng 12:00 ngày 03/11.
- Không ai bị tính thêm đêm chỉ vì đồng hồ qua 00:00.
- Mốc 06:00 **không** áp cho hạn khai báo lưu trú: hạn khai báo luôn tính theo **giờ đồng hồ thật** (mục 2.11).

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
| Quản trị | **Danh mục căn** | Sửa | Sửa | Xem | Xem | Xem |
| Quản trị | **Tham số quy tắc** | Sửa | Sửa | – | – | – |
| Quản trị | **Người dùng & vai**, **Thiết bị được cấp** | Có | – | – | – | – |

[ẢNH: C0-07-Thanh menu Desk của lễ tân]

### 0.8 Nguyên tắc dữ liệu khách (Nghị định 13/2023)

1. **Giấy tờ khách chỉ nằm trên Desk.** Không chụp bằng điện thoại (cá nhân hay của cơ sở), không gửi qua Zalo/Messenger, không in ra để đó.
2. Chỉ **lễ tân và quản lý** xem số giấy tờ đầy đủ và ảnh giấy tờ. Buồng phòng, bảo trì, sale, CTV không thấy. Đây là thiết kế, không phải lỗi.
3. Chỉ bấm **Xem đủ số / ảnh** khi đang làm thủ tục hoặc khai báo cho **đúng đơn đó**. Xem vì tò mò là vi phạm nội quy. Mỗi lần xem đều được ghi nhật ký (người, giờ, đơn). Desk hỏi lại mật khẩu, có hiệu lực 15 phút; số và ảnh tự ẩn sau vài giây hoặc khi rời tab.
4. **Thông báo trước, hỏi đồng ý sau.** Hai lúc khác nhau:
   - **Trước khi nhận giấy tờ** (đầu bước Giấy tờ khi nhận phòng, mục 2.10): chỉ khách tờ **Your ID details** đặt trong khung mica trên quầy (`staff-one-pager.md` Tờ 4). Câu mời: "Before I take your ID, please read this note on how we use it." / "Trước khi nhận giấy tờ, mời anh/chị đọc tờ này về cách chúng tôi dùng thông tin." Tờ ghi: dùng để khai báo lưu trú; ảnh mã hóa, chỉ lễ tân và quản lý xem; hỏi riêng việc lưu ảnh, không đồng ý cũng không sao; xóa trong vòng 3 tháng sau trả phòng, trừ phần luật yêu cầu lưu lâu hơn, bản sao lưu đã mã hóa xóa trong 35 ngày sau đó; muốn xem, sửa, xóa thì hỏi lễ tân.
   - **Ở Khối 1 "Đối chiếu và đồng ý lưu ảnh"** (mục 2.11 bước 3): hỏi khách có **đồng ý lưu ảnh giấy tờ** không. Chỉ hỏi khi có chụp ảnh giấy tờ; hỏi **từng người lớn** được chụp. Khách đang ở lúc chuyển đổi ngày D không chụp lại ảnh nên không hỏi. Đọc đúng số ngày **N** Desk hiện ở câu hỏi đồng ý (N = 1 thì đọc "1 day" / "1 ngày"). Gọi khách là "anh" hoặc "chị", không đọc "anh/chị".
     - EN: "May we keep photos of your ID for N days after check-out? They are then deleted automatically. If you'd rather not, that's fine – we use them only to register your stay, then delete them."
     - VI: "Anh/chị có đồng ý cho OTTIMO lưu ảnh giấy tờ N ngày sau khi trả phòng không? Sau đó ảnh tự xóa. Anh/chị không đồng ý cũng không sao, chúng tôi chỉ dùng ảnh để khai báo lưu trú rồi xóa."
   - Ghi câu trả lời trên Desk. Không đồng ý vẫn khai báo được; ảnh bị xóa ngay khi cổng khai báo xác nhận, hoặc khi đơn hủy/không đến trước khi khai.
   - Khách không đọc được tờ EN/VI, hoặc khó đọc: lễ tân đọc to câu hạn lưu (đoạn 3 của tờ, bản EN). Khách hỏi thêm về dữ liệu của mình: theo điểm 8. Khách hỏi "30 ngày hay 3 tháng": câu trả lời ở mục 5.4.
<!-- Chữ: UXD-on-PO-v1.0.0-docs.md mục 1.1–1.2, dựa trên SEC-on-PO-v1.0.0-docs.md mục B (đủ 6 ý). Thứ tự thông báo trước khi nhận giấy tờ: SEC D01 = UXD DT1-01. Đọc to khi khách không đọc được: SEC D07 (UXD không thêm RU lên tờ tới khi có bản dịch v2 đã duyệt). Chỉ hỏi khi chụp ảnh, hỏi từng người lớn: DOM DOC-10. Từ 02/11 mọi consent_record kênh desk mang notice_version privacy-2026-10-v1 đi kèm tờ "OTTIMO · ID notice · 11/2026" (UXD DT1-S02 – SEC quyết có ghi decision-log). -->
5. Hạn giữ dữ liệu giấy tờ:
   - Ảnh của khách đồng ý lưu: ở v1.0 tự xóa **30 ngày** sau trả phòng. Mức 3 tháng chủ đầu tư đã chọn sẽ áp ở bản vá sau khi đội bảo mật duyệt. **Khi nói với khách, luôn đọc số ngày trên câu hỏi đồng ý của Desk.**
   - Hồ sơ **khai báo chưa xong**: ảnh tự xóa **7 ngày sau trả phòng**, kể cả khi khách đã đồng ý. Vì vậy khai đúng hạn.
   - Dữ liệu điền sẵn cho khách quay lại giữ **3 tháng** sau lần trả phòng cuối. Quá hạn thì nhập lại giấy tờ; đó là đúng thiết kế.
6. **Không ghi** số giấy tờ, số thẻ thanh toán, thông tin sức khỏe vào ô ghi chú, lời nhắn cho khách hay lý do. Desk chặn một số dãy số dài.
7. Trẻ em: chỉ nhập **số định danh** (nếu có) và **năm sinh**, **không chụp** giấy tờ của trẻ. Với dữ liệu cá nhân, khách **dưới 16 tuổi** là trẻ em (khác mốc 12 tuổi của phụ thu).
8. Khách xin xem, sửa, xóa dữ liệu của mình (tờ **Your ID details** mời khách hỏi lễ tân): ghi lại yêu cầu, **chuyển chủ đầu tư**. Ở v1.0 chủ đầu tư xử lý bằng tay. Không hứa ngày.
9. **Báo lỗi cho đội: mô tả bằng lời** – mã đơn, căn, giờ, đã bấm gì, Desk báo gì, mã tham chiếu Desk hiện. **Không** ghi tên, số điện thoại, email, số giấy tờ của khách. **Không chụp màn hình có dữ liệu khách để gửi đội.** Mọi thứ gõ qua `/feedback` đều được lưu vào kho mã của dự án, nên coi như người ngoài đọc được.
10. **Mã cửa** chỉ nằm trên app khóa. Không ghi vào ghi chú đơn, sổ giao ca, sổ giấy, giấy dán quầy, nhóm chat nội bộ; không gửi cho đồng nghiệp bằng tin nhắn. Cần giao ca thì nói trực tiếp hoặc xem lại trên app khóa.
11. **Số thẻ thanh toán**: không nhận qua điện thoại, Zalo, email hay giấy; không chụp thẻ, không ghi số thẻ (mục 2.13).

### 0.9 Khi mất mạng, mất điện

- Desk cần mạng để nhận phòng, thu tiền, giấy tờ, trả phòng. Mất mạng thì Desk chỉ cho xem dữ liệu lúc gần nhất, và chỉ khi trang đang mở sẵn.
- Thứ tự: dùng 4G điện thoại của cơ sở phát Wi-Fi cho máy quầy → mở Desk trên điện thoại cơ sở (chỉ để xem đơn và thu tiền; không dùng điện thoại cá nhân; xong thì đăng xuất) → **danh sách giấy và sổ giấy** (khung bên dưới).
- Chưa xem được phòng trống thì **không nhận đơn mới**: ghi số điện thoại, hẹn gọi lại.
- Có mạng lại: nhập bù trong 24 giờ, ghi đúng giờ thật và ghi chú lý do.
- App nhân viên vẫn bấm được khi mất mạng; thao tác tự gửi khi có mạng (mục 3.10).
- Mất điện: an toàn của khách trước, sổ sách sau (mục 5.5).

> **Tạm ở v1.0 (tới v1.1):** chưa có bảng dự phòng in sẵn mỗi sáng.
> - 22:00 mỗi tối, lễ tân ca tối chép tay **danh sách khách đến và khách đi ngày mai** từ **Sơ đồ phòng / Đơn đặt phòng**:
>   - Khách đến: **mã đơn**, tên gọi, căn, giờ đến dự kiến, còn phải thu, số điện thoại.
>   - Khách đi: **mã đơn**, căn, giờ trả đã hẹn, còn phải thu. Không cần số điện thoại.
>   - **Không** ghi số giấy tờ, mã cửa, email, số tài khoản.
> - Danh sách luôn nằm **trong ngăn khóa**, chìa do người đang trực giữ. Không để trên mặt quầy, không chụp ảnh, không mang ra khỏi cơ sở, không gửi qua tin nhắn.
> - Chỉ giữ **một bản**. Chép bản mới xong thì hủy bản cũ ngay: **cắt nhỏ** (máy hủy giấy, hoặc xé ngang dọc nhiều lần), bỏ vào thùng rác khu nhân viên, không bỏ thùng rác sảnh.
> - Mất mạng: dùng danh sách để giao căn đã sạch cho khách có tên trong danh sách **sau khi xem giấy tờ gốc** của người đứng tên, thu tiền, ghi sổ giấy, nhập bù trong 24 giờ. **Không chụp giấy tờ khách bằng điện thoại** để nhập sau. Có mạng lại thì nhập giấy tờ trên máy quầy (khách đưa lại giấy tờ tại quầy) và giữ đúng hạn khai báo (mục 2.11).
> - **Ba ngày đầu (02, 03, 04/11)** lễ tân ghi thêm **sổ giấy** (đơn, tiền thu), đối chiếu với Desk lúc 22:00.
> - **Sổ giấy** (ba ngày đầu, và mọi lần mất mạng) không ghi số giấy tờ, số thẻ, mã cửa. Hết dùng thì nộp chủ đầu tư cất két cùng chứng từ kế toán.
<!-- Theo SEC FB-R3-SEC-BA-06 (đóng phần SEC của DOM thẻ 10): SEC chấp nhận SĐT khách đến trên giấy theo BR-961 với các điều kiện trên. -->

---

## Chương 1. Chủ đầu tư và quản lý (OWN, MGR)

> Trước khi bắt đầu: đọc mục 0.2 (đăng nhập), 0.3 (2 bước – bắt buộc với anh/chị), 0.8 (dữ liệu khách). Các mục ghi **Chỉ chủ đầu tư** thì quản lý không thấy menu.

### 1.1 Việc mỗi ngày

| Khi nào | Việc | Ở đâu |
|---|---|---|
| **Mỗi sáng trước 09:00, kể cả ngày nghỉ** (chủ đầu tư) | Kiểm bảo mật buổi sáng (khung bên dưới) | **Tham số quy tắc**, **Tổng quan**, **Nhật ký tiền**, app ngân hàng |
| Sáng | Xem **Cần chú ý** và **Cần duyệt** | **Tổng quan** |
| Sáng, cùng lượt kiểm bảo mật (tới v1.0.3) | Xem lại các dòng có chữ "giữ chỗ" trong sổ giao ca và các yêu cầu hoàn mới; **duyệt và chi các khoản hoàn người trực tạo** (người trực không tự duyệt, không tự chi được – mục 2.4). Khoản đã hẹn khách: hoàn muộn nhất 24 giờ sau khi khách nhận phòng; Desk báo khoản thu chưa đối soát thì đối soát cọc cũ ở **Chờ đối soát** trước. Xem lại các khoản miễn/giảm người trực làm bằng quyền quản lý | Sổ giao ca, **Cần duyệt**, **Nhật ký tiền → Hoàn tiền** |
| Trong ngày | Duyệt yêu cầu miễn/giảm, hoàn tiền, xóa công nợ | **Cần duyệt** |
| Trong 24 giờ sau mỗi lần trả muộn quá 18:00 | Xem lại phụ thu bằng giá 1 đêm (mục 1.9) | **Tổng quan → Cần chú ý** |
| Mỗi ngày | Đối chiếu chuyển khoản với sao kê | **Nhật ký tiền → Chờ đối soát** |
| **Mỗi tuần** (từ v1.0.5) | Rà các lần sửa giảm dòng phát sinh 7 ngày qua: ai, đơn nào, trước → sau, lý do. Chú ý dòng minibar đếm lại thấp hơn (lý do **Đếm lại minibar**) và người sửa giảm nhiều lần. Đối chiếu với các dòng lễ tân ghi ở sổ giao ca | **Nhật ký tiền** → bộ lọc **Sửa giảm dòng – 7 ngày** (mục 1.15) |
| **Mỗi tuần** (chủ đầu tư, khoảng 10 phút) | **Đếm kho minibar (K-MB).** Theo từng món: tồn đầu tuần + nhập − tồn cuối = số đã lấy ra; so với tổng phiếu nạp, **gồm cả dòng không vào tủ**. Món nào tuần nào cũng có dòng "dùng khác": xem lại. Lúc đếm thì xem hạn dùng, món còn dưới 1 tháng thì nạp trước. Chọn ngẫu nhiên 3 dòng phiếu nạp sau trả phòng: mở đơn đã trả phòng của căn đó, ngày đó, xem **Folio**. Số món minibar tính tiền phải bằng số món trên phiếu; món miễn phí không có dòng trên bill nên không so. Không dùng trang **Buồng phòng** cho lượt này (chỉ hiện việc hôm nay). Phiếu nhiều hơn bill: xem **Nhật ký thao tác tiền** của đơn đó, có lần sửa giảm hay đếm lại thấp hơn không. Lệch quá 2 món một tuần, hoặc một dòng ngẫu nhiên lệch: hỏi người trực, ghi sổ | Kho minibar, sổ kho, phiếu nạp; **Đơn đặt phòng** → **Folio**; **Nhật ký tiền** |
| Cuối ngày (3 ngày đầu: 22:00 cùng lễ tân) | Đối chiếu tiền trong ngày với sổ giấy và két | **Nhật ký tiền** (mục 1.13) |

> **Tạm – kiểm bảo mật mỗi sáng, tới khi đội bảo mật báo bỏ** (đội báo qua điều phối viên). Trước v1.0.3, thư báo đổi tài khoản nhận tiền, dùng mã khôi phục, đặt lại 2 bước **chưa gửi tới ai**. Từ v1.0.3 thư gửi tới email nhập ở mục 0.3a, nhưng **vẫn kiểm** cho tới khi đội xác nhận đường gửi thư ổn định: v1.0.3 lên, hay thấy thư đầu tiên, **chưa** phải lúc bỏ. Ngày v1.0.3 lên: làm theo mục 1.16. Mỗi sáng trước 09:00:
> 1. **Chủ đầu tư** mở **Tham số quy tắc → Tài khoản nhận chuyển khoản (VietQR)**: đúng **một** dòng **Đang dùng**, tên chủ tài khoản đúng, **không** có dòng **Đã lên lịch** lạ. Có dòng lạ: **Hủy lịch** ngay và làm theo mục 1.7 "Nhận thông báo đổi tài khoản nhận mà anh/chị không làm".
> 2. **Chủ đầu tư** xem **Tổng quan → Cần chú ý** và **Nhật ký tiền** từ hôm qua tới hôm nay: có dòng **Đổi tài khoản nhận chuyển khoản** mà mình không làm, hay dấu hiệu ai đó dùng mã khôi phục/đặt lại 2 bước của mình, thì **gọi đội ngay**. Không đổi lại tài khoản trên chính phiên đó.
> 3. **Chủ đầu tư hoặc quản lý** đối soát tiền chuyển khoản trên app ngân hàng với các khoản VietQR trên Desk của ngày hôm trước (mục 1.12). Khoản Desk ghi nhận mà ngân hàng không có: báo chủ đầu tư ngay.
> 4. **Chủ đầu tư** ghi một dòng vào sổ giao ca: "Đã kiểm TK nhận + nhật ký – <giờ>". Không ghi số tài khoản.
<!-- SEC-on-B2-readiness mục 1.3 B1–B4; BUG-R3-032 (P1, v1.0.3, chậm nhất 09/11). Desk v1.0 không có chuông thông báo và không có màn nhật ký security/config: "chuông" = Tổng quan → Cần chú ý; đổi tài khoản nhận hiện trong Nhật ký tiền (config.changed → "Đổi tài khoản nhận chuyển khoản"); sự kiện mfa.* chưa xem được trên Desk – SEC/QA xác nhận cách chủ đầu tư thấy mfa.recovery_code_used/mfa.reset* ở v1.0. -->

### 1.2 Màn Tổng quan

1. Đăng nhập. Desk mở **Tổng quan** (đêm nay).
2. Hàng số liệu: **Công suất đêm nay**, **Khách đến / đi**, **Đang ở**. Giữ chỗ chưa cọc và đơn OTA chưa gán căn không tính vào công suất.
3. **Cần duyệt (n)**: yêu cầu đang chờ anh/chị.
4. **Cần chú ý (n)**: việc cần xử lý (khai báo sắp hạn, công nợ, phiếu sửa quá hạn, phụ thu chờ xem lại…). Dòng **Chỉ chủ đầu tư thấy** là cảnh báo miễn phí vượt ngưỡng.
5. Mỗi dòng có nút **Mở** hoặc nút xử lý ngay (**Thu công nợ**, **Xóa công nợ**, **Đã xem**, **Đã xử lý**). Dòng khẩn phải ghi **Ghi chú xử lý**.
6. Màn tự tải lại khoảng 30 giây một lần.

[ẢNH: C1-01-Tổng quan]

### 1.3 Danh mục căn, giá đêm và giá tháng

Theo quyết định của chủ đầu tư ngày 26/10:
- **Giá đêm niêm yết** và **Giá tháng** nhập **riêng**, độc lập. Đổi giá này không đổi giá kia.
- Giá đêm là giá **đêm ngày thường, kênh Trực tiếp, cho định mức của căn, đã gồm VAT**, bội số 1.000 đ.
- **Một giá mọi đêm**, kể cả thứ Sáu, thứ Bảy, lễ, Tết (ESC-045, từ ngày chủ đầu tư chuyển giá): ở **Tham số quy tắc**, tab **Khác**, `weekend_uplift_pct` và `special_uplift_pct` đều là 0. Anh/chị **không** nhập giá cuối tuần riêng. Muốn tăng giá Noel – Tết: báo đội trước 15/12 để đổi Desk và OTA cùng lúc. Kiểm nhanh: báo giá thử một Studio (101–203), **ngày đến thứ Sáu, 2 đêm**, 2 người lớn. Phải ra **1.600.000** (2 × 800.000). Ra 1.840.000 là `weekend_uplift_pct` chưa về 0. Ra số khác là giá căn chưa đổi (**Đổi giá một căn** bên dưới).
- Ngày đặc biệt (không tăng giá; vẫn ở tối thiểu 2 đêm, không hoàn cọc khi hủy) đang cài: đêm 24/12/2026–01/01/2027 · Tết Nguyên đán đêm 05–10/02/2027 · Giỗ Tổ Hùng Vương đêm 16/4/2027 · đêm 30/4 và 1/5/2027 · đêm 1/9 và 2/9/2027. Danh sách đầy đủ ở **Tham số quy tắc**. Chủ đầu tư thêm ngày thì Desk tự áp.
- **Không giảm theo số đêm** (bảng giá 01/11, từ ngày chủ đầu tư chuyển giá): ở tab **Khác**, `los_discount` là `[]`. Kiểm: báo giá căn 401, 7 đêm từ thứ Hai, 5 người lớn: phải ra **10.150.000**, không có dòng "Đã giảm …% vì ở từ 7 đêm (BR-107)".
- **Phụ thu trẻ 6–11 tuổi** (ESC-045, cùng ngày chuyển giá): **Tham số quy tắc** → tab **Số người & phụ thu** → **Phụ thu trẻ 6–11 tuổi vượt định mức (mỗi đêm)** = 150.000. Kiểm nhanh: báo giá thêm 1 trẻ 6–11 tuổi vượt định mức, phụ thu phải là 150.000 mỗi đêm.

**Đổi giá một căn:**
1. **Quản trị → Danh mục căn**. Bảng có cột **Giá tháng**, **Giá đêm niêm yết**, **Bán**.
2. Bấm **Sửa** ở dòng căn.
3. Mục **Giá niêm yết**: nhập **Giá tháng** và/hoặc **Giá đêm niêm yết**.
4. Sau khi gõ giá mới, Desk hiện ô **Hiệu lực từ** và **Lý do đổi giá**. Chọn **Hiệu lực từ** (hôm nay hoặc ngày sau). Gõ lại đúng giá đang dùng thì Desk báo "Đây là giá đang dùng…" và **Lưu** bị khóa.
5. Nhập **Lý do đổi giá**. Bấm **Lưu**.
6. Desk báo "Đã lưu căn …" hoặc "Đã lưu căn …. Giá áp dụng từ …".

[ẢNH: C1-02-Danh mục căn]
[ẢNH: C1-03-Sửa căn, giá đêm và giá tháng]

Lưu ý:
- Desk cảnh báo khi giá đêm thấp hơn giá tháng chia 30 ngày. Nếu đúng ý anh/chị, vẫn lưu được.
- **Desk chưa cảnh báo khi giá đêm cao bất thường** (ví dụ gõ thừa số 0: 8.000.000 thay 800.000): Desk vẫn lưu, và báo giá ở quầy cùng giá trên web sai cùng lúc. **Đổi giá xong, báo giá thử 1 đêm của căn đó, chọn một đêm từ ngày hiệu lực trở đi** (không lưu báo giá). Báo giá cho đêm trước ngày hiệu lực vẫn ra giá cũ, không kiểm được gì. Ra số lạ: giá đã hiện trên web thì tắt `public_show_prices` trước (mục 1.4); mở **Sửa**, chọn **đúng ngày hiệu lực** của giá sai (hôm nay hay ngày sau đều được), nhập giá đúng, **Lưu**: Desk thay giá của ngày đó; xem các đơn và báo giá tạo từ lúc lưu giá sai tới lúc sửa: các đơn này giữ giá sai, báo quản lý xem lại từng đơn, hoặc báo đội. Áp dụng ngay, tới khi Desk có cảnh báo giá đêm cao bất thường (v1.0.5 nếu kịp, không thì v1.0.6).
  <!-- PO release notes, Giới hạn đã biết (3279a4ec); V5-5C, FB-R5-DOM-FE-121-01. Khi V5-5C lên: đổi gạch này thành câu Desk cảnh báo cả giá cao, giữ lời khuyên báo giá thử. -->
- Đơn, báo giá, hợp đồng **đã tạo trước lúc lưu** giá mới giữ giá lúc tạo. Từ lúc lưu, đơn và báo giá mới cho các đêm từ ngày hiệu lực trở đi lấy giá mới, kể cả khi tạo trước ngày đó. Web cũng bán các đêm đó với giá mới ngay từ lúc lưu.
  <!-- DOM FB-R5-DOM-BA-06 (DOM-on-ba-v105-docs.md mục 5): báo giá và web lấy giá niêm yết của từng đêm (quote-pricing.ts listPrices, public-rate.ts); đơn và báo giá giữ giá lúc tạo (BR-006); rooms.service.ts thay dòng giá cùng ngày hiệu lực, không sửa được dòng đã qua (DATE_IN_PAST). -->
- **Lỡ lên lịch nhầm một giá tương lai:** mở **Sửa**, chọn **đúng ngày hiệu lực** của giá nhầm, nhập giá đúng, **Lưu**. Giá đúng thay giá nhầm của ngày đó; giá lên lịch ngày khác giữ nguyên.

[ẢNH: C1-04-Sửa giá đã lên lịch]

> **Có từ v1.0.2:** **Danh mục căn** → mở căn: danh sách giá đêm/giá tháng đã lên lịch cho các ngày sau (chủ đầu tư và quản lý thấy, lễ tân không thấy). Hủy được một dòng chưa tới ngày hiệu lực; không hủy được dòng đang áp dụng hay dòng giá duy nhất của căn. Không hủy dòng giá đầu tiên của căn mới (lỗi BUG-R4-015, sửa ở v1.0.3). Bỏ việc ghi sổ mỗi lần lên lịch giá.
>
> **Tạm ở v1.0 (tới khi v1.0.2 lên):** Desk chưa hiện danh sách giá đã lên lịch và chưa có nút hủy. Mỗi lần lên lịch giá cho ngày sau, ghi **căn, giá, ngày hiệu lực** vào sổ. Muốn bỏ một giá đã lên lịch: nhập lại giá hiện hành với **đúng ngày hiệu lực** đó.

**Ngừng bán một căn** (ví dụ chủ đầu tư dùng riêng dài ngày): trong **Sửa**, tắt **Đang bán**. Căn không hiện trong form đặt phòng; sơ đồ phòng ghi **Ngừng bán**. Đơn đã có giữ nguyên. Hỏng hóc thì dùng **khóa phòng** (mục 4.1), không dùng ngừng bán.

**Định mức và tối đa**: trong **Sửa**, mục **Số người**. **Tối đa** chỉ bằng định mức hoặc định mức + 1 (người thứ thêm ngủ sofa). Không tính trẻ dưới 6 tuổi.

### 1.4 Tham số quy tắc

> **Lỗi đang sửa – hai tham số (sửa ở v1.0.5):** **Tới khi v1.0.5 lên**, không bấm **Lưu thay đổi** ở hai dòng `weekend_nights` (**Đêm tính là cuối tuần**) và `min_stay` (**Ở tối thiểu**), nhóm **Khác**: Desk v1.0.4 nhận cả giá trị sai dạng, lưu sai thì Desk không nhận ra đêm cuối tuần, hoặc mọi báo giá và đơn trực tiếp mới báo lỗi, không gỡ được trong ngày (BUG-R5-001, BUG-R5-003). Buộc phải đổi: nhắn đội trước, chọn **Hiệu lực từ** từ ngày mai để còn **Hủy lịch** được. Lỡ lưu: báo đội ngay, coi là **P0** (chủ đầu tư gõ `/feedback P0`, quản lý gọi chủ đầu tư).

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
- **Form "Yêu cầu đặt phòng" trên website**: công tắc nằm ở nhóm **Khác**, dòng `public_booking_requests_enabled` (chưa có tên tiếng Việt), giá trị `false` là tắt. Chỉ chủ đầu tư bật, tắt. Form **đã bật từ chiều 30/10**. Tắt có hiệu lực ngay trong ngày; khách thấy nút Zalo thay cho form.
- **Giá ước tính trên website**: dòng `public_show_prices` (nhóm **Khác**, chưa có tên tiếng Việt), chỉ chủ đầu tư. **Đã bật từ 06/11.** Giá web sai, hoặc vừa nhập nhầm giá căn: chủ đầu tư đặt `false` ngay trên Desk; khoảng 2 phút sau web hết hiện giá, form vẫn nhận yêu cầu. Phòng Google Chat **"OTTIMO – Báo động"** nhận một tin báo công tắc đổi – đúng thiết kế. Bật lại theo luật thường: đã lưu trong ngày thì bật từ ngày mai.
- **Ngày cuối web hiện giá**: dòng `web_estimate.open_until` (nhóm **Khác**), mặc định 2027-01-01. Đêm từ ngày này trở đi web ghi "giá theo yêu cầu", khách vẫn gửi được yêu cầu. Chủ đầu tư chốt giá năm sau rồi gia hạn; Desk nhắc khi còn dưới 60 ngày.
- Nghĩa, giới hạn, mức đề xuất của từng tham số và các tham số đang lệch sổ tay: **Từ điển tham số quy tắc** `product/docs/tham-so-quy-tac.md`. Khi nào đổi, đổi xong kiểm gì: **Sổ vận hành** `product/docs/so-van-hanh.md` mục 4.

> **Lỗi đang sửa – Wi-Fi (sửa ở v1.0.5 hoặc v1.0.6):** Desk chưa có chỗ nhập Wi-Fi của cơ sở, nên trang khách chưa hiện Wi-Fi (từ bản `v1.0.0`, ngày đến và trong lúc ở trang khách ghi "hỏi lễ tân"). Tới khi sửa xong: khách xem **thẻ Wi-Fi trong căn**; lễ tân đọc tên mạng và mật khẩu Wi-Fi khi khách hỏi. Đừng nói khách "xem Wi-Fi trên trang khách".

<!-- Chờ ORC: phần Desk của V5-58 (FE-2, nhánh r5-fe-v5-58) chưa có PR; phía máy chủ là PR #120. Khi biết bản: vào v1.0.5 thì bỏ ngoặc vuông, bỏ khối "Lỗi đang sửa – Wi-Fi" ở trên và các câu "trang khách chưa hiện Wi-Fi", "Desk chưa có ô nhập" (sổ tay mục 2.9, 2.21, 5.4, 5.6; tệp 02 mục 16.1, 17.6; tệp 03 mục 11.2, 12; tệp 01 mục 9.2, 15.6); lễ tân đọc Wi-Fi trên Desk khi khách hỏi. Dời v1.0.6 thì đổi chữ trong ngoặc vuông. Tên màn, tên nút: lấy theo phần Desk khi có. Bước 1, 4, 5 theo DOM FB-R5-DOM-BA-05 (DOM-on-ba-v105-docs.md mục 5, b0fa79ff); câu báo khách: CPY rounds/round-05/outputs/CPY/guest-notice-wifi-change.md mục 2, 3, 6 (12d71871), nguyên văn. Trước khi Wi-Fi trên Desk lên mà phải đổi mật khẩu: dùng câu thay ở CPY mục 1 ("Please ask reception for the new password."). UXD không dựng HTML khối này trước khi ORC báo. Nguồn: DOM-on-be-pr-120-v5-58.md mục 3, FB-R5-DOM-BA-120-02; hợp đồng 0.3.13 mục 1.13 (A101: OWN, MGR sửa; S36: OWN, MGR, FDL, FD xem); BR-012 (7), BR-808. -->
> **[Chờ xác nhận – Wi-Fi trên Desk vào v1.0.5] Wi-Fi của cơ sở trên Desk.** Chủ đầu tư và quản lý sửa; lễ tân trưởng, lễ tân chỉ xem. Trang khách đọc ngay ở lần tải sau, từ ngày đến.
>
> **Ngày lên bản:** chủ đầu tư nhập **tên mạng** và **mật khẩu** Wi-Fi trên Desk, đọc kỹ dòng xác nhận "Khách sẽ thấy: …" rồi lưu. Sau đó mở trang khách của một đơn đang ở để kiểm: đọc trên màn hình, không chụp ảnh, không chép ra chat. Ô mật khẩu để trống là **mạng mở**: chỉ dùng khi bộ phát cũng để mạng mở. OTTIMO dùng mạng có mật khẩu.
>
> **Đổi mật khẩu Wi-Fi:**
> 1. Đổi trong **13:00–17:00**, nên đầu khung. Trước đó in sẵn **thẻ Wi-Fi mới** cho 10 căn và 2 thẻ dự phòng để trong ngăn quầy. Ngoài khung giờ này chỉ đổi khi chủ đầu tư quyết vì mạng bị dùng sai.
> 2. Đổi trên **bộ phát trước**, rồi lưu trên Desk ngay sau đó, cùng một lượt. Lưu trên Desk trước thì trang khách hiện mật khẩu bộ phát chưa nhận.
> 3. Mở trang khách của một đơn để kiểm.
> 4. Báo lễ tân. Lễ tân báo mọi khách đang ở, kể cả khách dài hạn, bằng câu chuẩn ở cuối khối này: Zalo dùng bản ngắn, kênh khác dùng bản đầy đủ. Không gửi mật khẩu hay link trang khách trong tin. Desk không tự báo quầy hay khách.
>    - Không gửi cho khách đi hôm nay, khách nhận phòng sau giờ đổi, và đơn hôm nay đã có 2 tin chủ động: các khách này được báo ở quầy khi hỏi (ghi sổ giao ca mã đơn).
>    - Một khách có nhiều căn (đoàn, gia đình): một tin cho người liên hệ của đơn.
>    - Đổi gấp ngoài khung giờ: tin này là tin sự cố, gửi ngay.
> 5. Thay **thẻ Wi-Fi trong căn**, đủ 10 căn:
>    - căn trống: thay ngay, trước khách nhận phòng kế tiếp;
>    - căn có khách: buồng phòng thay ở lần dọn tới. Khách hỏi trước lúc đó: lễ tân đưa thẻ mới ở quầy; thẻ trong căn vẫn thay ở lần dọn tới;
>    - khách dài hạn không có lần dọn trong 3 ngày: hẹn khách một giờ để thay, chỉ vào căn khi khách đồng ý. Khách không muốn ai vào căn: đưa thẻ mới để khách tự thay, xin lại thẻ cũ;
>    - ghi sổ giao ca **số căn** chưa thay (không ghi mật khẩu), gạch khi xong. Thẻ cũ mang về quầy, cắt nhỏ rồi bỏ.
> 6. Không ghi mật khẩu vào sổ giao ca, sổ giấy, tin nhắn nội bộ hay ảnh chụp.
>
> Tên mạng không được có số căn hay tên đăng nhập của người nào ở OTTIMO. Mật khẩu Wi-Fi không được trùng mật khẩu đăng nhập Desk của người lưu. Desk báo lỗi thì đổi chữ rồi lưu lại. Desk ghi nhật ký mỗi lần lưu, kể cả lưu lại đúng giá trị cũ; nhật ký không có mật khẩu.
>
> **Câu báo khách đổi mật khẩu Wi-Fi** (CPY). Sao chép, không gõ lại: dấu "–" là gạch ngang dài. Một ngôn ngữ mỗi tin: tiếng Việt cho khách Việt, tiếng Anh cho khách khác. Thay {name} bằng tên khách. Email: tiêu đề "OTTIMO · Wi-Fi password updated" / "OTTIMO · Mật khẩu Wi-Fi mới". Khách cần mật khẩu ngay: lễ tân đọc trên Desk, tại quầy hoặc qua điện thoại.
>
> **Bản đầy đủ** – WhatsApp, Telegram, Viber, email, SMS, hộp thư OTA
>
> EN:
>
> Hello {name}, we have updated the Wi-Fi password at OTTIMO. Your devices will need the new password to reconnect. Please reopen your stay page to see it, or ask reception. We will also replace the Wi-Fi card in your room; until then, it shows the previous password. Thank you for your understanding.
>
> VI:
>
> Chào {name}, OTTIMO vừa đổi mật khẩu Wi-Fi. Thiết bị của bạn cần mật khẩu mới để kết nối lại. Bạn vui lòng mở lại trang lưu trú để xem, hoặc hỏi lễ tân. OTTIMO sẽ thay thẻ Wi-Fi trong phòng; trước khi thay, thẻ vẫn ghi mật khẩu cũ. Cảm ơn bạn đã thông cảm.
>
> **Bản ngắn** – Zalo (OA hoặc số cơ sở)
>
> EN:
>
> Hello {name}, we have updated the Wi-Fi password at OTTIMO – please reopen your stay page to see it, or ask reception. The Wi-Fi card in your room shows the previous password until we replace it.
>
> VI:
>
> Chào {name}, OTTIMO vừa đổi mật khẩu Wi-Fi – bạn vui lòng mở lại trang lưu trú để xem, hoặc hỏi lễ tân. Thẻ Wi-Fi trong phòng vẫn ghi mật khẩu cũ cho tới khi OTTIMO thay thẻ mới.

**Danh mục minibar:** **Quản trị → Minibar**. Chủ đầu tư, quản lý **Thêm mặt hàng** hoặc **Sửa**: **Tên tiếng Việt**, **Tên tiếng Anh**, đơn vị, **Mức chuẩn mỗi tủ**, **Giá bán**, **Giá vốn**, **Tồn tối thiểu**, công tắc **Miễn phí**. Giá mới áp cho lần kiểm minibar sau; dòng đã ghi folio giữ giá cũ. Lễ tân và buồng phòng chỉ xem, không thấy giá vốn.

[ẢNH: C1-21-Danh mục minibar]

### 1.5 Người dùng và vai (chỉ chủ đầu tư)

Các vai trong v1.0:

| Vai trên Desk | Dành cho | Đăng nhập 2 bước |
|---|---|---|
| **Chủ đầu tư** | Chủ đầu tư | Bắt buộc |
| **Quản lý** | Quản lý | Bắt buộc |
| **Lễ tân trưởng** | Lễ tân trưởng: thêm quyền duyệt trong hạn mức, nhận phòng ngoại lệ, kiểm phòng | **Bắt buộc** – mặc định đội chọn, anh/chị đổi được (báo đội); Desk tự ép từ v1.0.5: chưa bật thì bị hạn chế ngay ở lượt bấm kế tiếp sau khi bản lên |
| **Lễ tân** | Lễ tân, người trực đêm | Chưa |
| **Buồng phòng** | Nhân viên buồng phòng | Tùy chọn |
| **Bảo trì** | Kỹ thuật | Tùy chọn |
| **Sale nội bộ** | Nhân viên bán hàng của OTTIMO | Không bắt buộc – nên bật |
| **CTV / môi giới** | Cộng tác viên ngoài | Không bắt buộc – nên bật |

Một người có thể có nhiều vai (ví dụ lễ tân kiêm sale). Không có vai "Kế toán" riêng (mục 4.3).

**Thêm người dùng:**
1. **Quản trị → Người dùng & vai → Thêm người dùng**.
2. Nhập **Tên hiển thị**, **Tên đăng nhập** (chữ thường không dấu, ví dụ `lan.hk`).
3. **Mật khẩu tạm** do Desk tạo sẵn (bấm **Tạo mật khẩu khác** nếu muốn).
4. Chọn một hoặc nhiều vai. Bấm **Tạo tài khoản**.
5. Xác nhận bằng mật khẩu và mã 6 số.
6. Desk hiện **Mật khẩu tạm của …** **một lần**. Đưa tận tay người dùng. Không gửi qua chat.
7. **Đăng nhập 2 bước theo vai** (mặc định đội chọn; anh/chị đổi được, báo đội). App nhân viên đăng nhập được bằng 2 bước và đổi mật khẩu tạm ngay trên app; bật 2 bước chỉ làm trên Desk (mục 3.1).
   - **Lễ tân trưởng: bắt buộc.** Desk chưa tự ép tới v1.0.5, nên anh/chị làm 3 việc: tạo tài khoản; ngồi cùng người đó bật 2 bước trên Desk ngay buổi đầu (quét mã bằng điện thoại riêng của họ, cất 10 mã khôi phục như mục 0.3); nhìn tận mắt khối **Xác thực 2 bước** ở trang **Bảo mật tài khoản** của họ đã bật, rồi mới giao việc. Dặn lễ tân trưởng **không tự tắt** 2 bước (Desk chưa chặn tới v1.0.5); cần tắt thì hỏi anh/chị.
     - **Từ v1.0.5 Desk tự ép.** Lễ tân trưởng chưa bật bị hạn chế **ngay ở lượt bấm kế tiếp** sau khi bản lên, kể cả đang đăng nhập dở, không chờ lần đăng nhập sau. Desk chỉ còn màn **Bật xác thực 2 bước**, thao tác vừa bấm không được lưu; app nhân viên báo mở Desk để bật. Lễ tân trưởng cũng không tự tắt 2 bước được nữa.
     - **Trước ngày lên v1.0.5:** cho mọi lễ tân trưởng bật 2 bước trên máy riêng như trên và nhìn tận mắt đã bật, nhất là người trực đêm. Không để ai bật lần đầu trên máy quầy giữa ca. Mất điện thoại sau khi đã bật: đặt lại 2 bước như cũ (khối **Đặt lại xác thực 2 bước** cuối mục này).
   - **Buồng phòng, bảo trì: tùy chọn.** Chỉ bật khi người đó có điện thoại riêng và giữ được mã khôi phục; không cần khuyến khích.
   - **Sale nội bộ, CTV** chỉ dùng Desk: tự bật được, nên bật.
   - Người đã bật mà mất cả điện thoại lẫn mã khôi phục: anh/chị **gặp tận mặt** rồi **Đặt lại xác thực 2 bước** cho người đó (khối **Đặt lại xác thực 2 bước** cuối mục này), không tạo tài khoản mới. Không nhờ đội đặt lại 2 bước, không làm theo tin nhắn.

[ẢNH: C1-07-Người dùng và vai]
[ẢNH: C1-08-Thêm người dùng]
[ẢNH: C1-09-Mật khẩu tạm hiện một lần]

Cột **Thao tác** có **Sửa vai** và **Khác…**. Tài khoản đã khóa có thêm nút **Mở khóa** ngay sau **Khác…**. Bấm **Khác…** để mở **Đặt lại mật khẩu**, **Khóa tài khoản** (chỉ hiện với tài khoản đang dùng) và **Đặt lại xác thực 2 bước** (chỉ hiện với người đã bật 2 bước). Dòng của chính anh/chị không có **Khác…**: không ai tự đặt lại 2 bước cho mình. Mất mạng thì các nút này mờ.

**Các việc khác** (cột **Thao tác** ở dòng người dùng):
- **Sửa vai** → chọn vai → **Lưu vai**. Người đó bị đăng xuất ngay trên mọi máy.
- **Đặt lại mật khẩu**: người đó bị đăng xuất và phải đổi mật khẩu tạm ở lần đăng nhập tới. **Không gỡ 2 bước** (mục 0.4).
- **Khóa tài khoản**: dùng khi nghỉ việc hoặc mất điện thoại. Desk hỏi **Mật khẩu đăng nhập** và **Mã trong ứng dụng xác thực (6 số)**. **Mở khóa** khi cần dùng lại.
- **Đặt lại xác thực 2 bước** (trong **Khác…**): dùng khi người đã bật 2 bước mất cả điện thoại lẫn mã khôi phục. Xem khối **Đặt lại xác thực 2 bước** cuối mục này.
- Trạng thái **Tạm khóa do sai mật khẩu**: chờ hết thời gian khóa, hoặc đặt lại mật khẩu.
- **Người nghỉ hẳn** (nhân viên nghỉ việc, CTV hết hợp tác) – **áp dụng ngay**: làm theo khối **Ngày cuối của người nghỉ** ngay dưới danh sách này (gồm **Khóa tài khoản** rồi **Xóa email**; v1.0.3 đang gửi thư như vậy, v1.0.4 giữ nguyên). Tài khoản người nghỉ hẳn **không Mở khóa lại**. Khóa tạm (nghỉ phép, nghi lộ mật khẩu, mất điện thoại): chỉ **Khóa tài khoản**, **giữ email**.
- **Tạm khóa do sai mật khẩu** là việc **Desk tự làm** khi có người gõ sai mật khẩu nhiều lần, **khác** nút **Khóa tài khoản**. Tài khoản ở trạng thái này **vẫn nhận** thư bảo mật về chính mình (có thể đang bị dò mật khẩu), và máy đang đăng nhập **không** bị đăng xuất. Người đó nói không gõ sai: làm như dòng trên (hỏi lại, **Đặt lại mật khẩu**, xem **Cần chú ý**); cần chặn ngay trên mọi máy thì bấm **Khóa tài khoản**.

**Ngày cuối của người nghỉ** (nhân viên nghỉ việc, CTV hết hợp tác) – **áp dụng ngay**, chủ đầu tư làm. Chỉ **Khóa tài khoản** thì chưa đủ: người nghỉ vẫn còn ở phòng Google Chat (tin có thông tin khách), còn biết mã cửa, còn giữ việc dở.

**Thứ tự:**
- **Người nghỉ êm:** bước 1 → 8 theo số (riêng **Đăng xuất** app nhân viên ở bước 7 làm trước bước 3). Bước 3, 5, 6, 7 làm **cuối ca cuối cùng** của người đó, không để sang hôm sau.
- **Người bị cho thôi việc:** **ngay lúc báo, trong cùng một lần ngồi máy**, làm liền: bước 3 → phần app khóa của bước 6 (gỡ ủy quyền, vô hiệu mã/thẻ nhân viên) → bước 5 → bước 7 → phần còn lại của bước 6. Sau đó mới làm bước 1, 2, 4, 8 (anh/chị cùng người đó đếm két tại quầy).

1. **Tiền mặt quầy và sổ giao ca:** người đó đếm két, đối chiếu tiền mặt (mục 1.14), bàn giao sổ giao ca; anh/chị đếm lại và ký nhận. Người nghỉ êm làm **trước** khi khóa, vì khóa xong người đó không đăng nhập để chốt ca được.
2. **Việc người đó đang giữ dở:** ghi mã từng việc vào sổ giao ca, giao người khác làm tiếp:
   - yêu cầu website người đó đã **Nhận xử lý**; phiếu sửa đã **Nhận việc** mà chưa **Sửa xong**; việc dọn đang làm dở;
   - yêu cầu hoàn **còn mở** do người đó tạo (mục 1.12): nơi nhận còn trống thì người khác nhập, không phải người nghỉ. Chỉ còn anh/chị thì nhập **Chuyển khoản** rồi duyệt và chi; anh/chị nhập **Tiền mặt** thì không tự duyệt được khoản đó.
3. **Khóa tài khoản** (dòng **Khóa tài khoản** ở trên). Tài khoản người nghỉ hẳn **không Mở khóa lại**: mật khẩu, 2 bước và mã khôi phục cũ vẫn còn hiệu lực. Tuyển lại thì tạo tài khoản mới (tên đăng nhập mới, mật khẩu tạm mới, bật 2 bước lại nếu vai cần).
4. **Xóa email** của người đó (phần **Đặt email cho nhân viên** ngay dưới: mở hộp, bấm **Xóa email**, xác nhận bằng mật khẩu và mã 6 số). Sau bước 3, tài khoản này không nhận thư bảo mật về chính mình nữa, **trừ một** thư **Security notice: notification email changed** gửi tới địa chỉ cũ ở bước này (thư không có dữ liệu khách). Người nghỉ êm: báo trước cho người đó về thư này. Anh/chị cũng nhận một bản; các chủ đầu tư vẫn nhận bản của mình.
5. **Google Chat:** gỡ người đó khỏi phòng "OTTIMO – Yêu cầu đặt phòng" (`guides/01-chu-dau-tu-quan-ly.md` mục 12.1), và phòng "OTTIMO – Báo động" nếu người đó là người thứ hai (sổ vận hành mục 7.2). Khóa Desk **không** gỡ người đó khỏi phòng. Người đó có tài khoản `@ottimo.vn` riêng: tạm ngưng tài khoản đó trong Admin console.
6. **Chìa, mã, mật khẩu dùng chung** (những thứ người đó biết hoặc được giao):
   - thu chìa cơ, thẻ tổng, thẻ nhân viên của khóa;
   - app khóa: gỡ tài khoản ủy quyền của người đó, vô hiệu mã/thẻ nhân viên trên khóa;
   - extranet OTA (Booking.com, Agoda, Airbnb…): gỡ tài khoản riêng của người đó, hoặc đổi mật khẩu từng kênh;
   - hộp thư chung (`booking@`, hộp thư của quầy) và Gmail dùng cho OTA: đổi mật khẩu, đăng xuất mọi phiên;
   - đổi mã mở máy của điện thoại cơ sở, máy tính bảng, máy quầy; Zalo cơ sở: đăng xuất rồi đăng nhập lại;
   - đổi mã két, mật khẩu Wi-Fi quản trị, mật khẩu phát Wi-Fi (4G) của điện thoại cơ sở;
   - mã cửa: người bị cho thôi việc thì tạo mã mới cho các căn đang có khách mà người đó biết mã, giao mã mới cho khách (mục 0.8 điểm 10 và `guides/02-le-tan.md` mục 7.5). Căn HĐ thuê tháng mà người đó biết mã: hẹn khách đổi mã trong 7 ngày, kể cả khi nghỉ êm.
   Không ghi mật khẩu, mã mới vào sổ giao ca, nhóm chat hay giấy dán quầy.
7. **Thiết bị:** máy riêng của người đó đã được cấp quyền thì bấm **Thu hồi** ở dòng máy (mục 1.6). App nhân viên trên điện thoại riêng: khóa tài khoản chỉ đưa app về màn đăng nhập, dữ liệu đọc ngoại tuyến (tên gọi khách, số căn, phiếu sửa) vẫn còn tới khi bấm **Đăng xuất**. Người nghỉ êm: nhờ họ bấm **Tôi → Đăng xuất** trong app trước mặt anh/chị, **trước** bước 3. Người bị cho thôi việc: nhờ họ xóa dữ liệu trang của app hoặc gỡ app; không làm thì ghi sổ giao ca, không ép.
8. **Giữ chỗ:** rà **Cần chú ý** và **Đơn đặt phòng** → **Đang hiệu lực** các giữ chỗ người đó tạo hoặc chốt. Người đó không còn nhận thông báo giữ chỗ quá hạn: giao người khác theo dõi tới khi đơn có cọc hoặc hủy.

**CTV hết hợp tác:** làm bước 3, 4 và 8; bước 7 nếu máy của CTV đã được cấp quyền (CTV không ở phòng Google Chat; lỡ có thì làm cả bước 5). **Khóa tài khoản** không xóa hoa hồng còn nợ của các đơn CTV đó đã chốt: anh/chị vẫn chi theo bảng nội bộ, và báo CTV cách nhận số liệu (CTV không còn đăng nhập để xem).

Người nghỉ là người trực duy nhất: anh/chị sắp xếp người trực quầy (chính anh/chị, hoặc người mới đã có tài khoản) **trước** khi khóa.

**Đặt email cho nhân viên** (có từ v1.0.3, chỉ chủ đầu tư, trên máy riêng):
1. **Quản trị → Người dùng & vai**. Cột **Email** hiện địa chỉ của từng người hoặc **Chưa có**. Quản lý chưa có email: chữ **Chưa có** hiện trong khung cảnh báo.
2. Ở dòng người đó, bấm **Sửa email**.
3. Hộp **Email nhận thông báo bảo mật – {tên}**: nhập email riêng của người đó, ví dụ `ten.rieng@example.test`. Hỏi tận miệng, đọc lại cho người đó nghe, và hỏi: "Hộp thư này chỉ mình em đọc phải không?" Không dùng hộp thư chung (`info@ottimo.vn`, `booking@ottimo.vn`, Gmail dùng cho OTA, hộp thư của quầy – mục 0.3a). Bấm **Lưu email**.
4. Hộp xác nhận hiện **Địa chỉ mới** và câu "OTTIMO sẽ gửi thông báo tới địa chỉ mới, địa chỉ cũ (nếu có) và các chủ đầu tư." Nhập **Mật khẩu đăng nhập** và **Mã trong ứng dụng xác thực (6 số)**. Bấm **Lưu email**. Địa chỉ là `info@` (từ v1.0.4: cả `booking@`) thì Desk báo "Đây là hộp thư chung của cơ sở…" sau bước này; mật khẩu và mã không bị tính là sai.
5. Desk báo "Đã lưu email của {tên}. Thông báo đã gửi tới địa chỉ này và các chủ đầu tư." (lần đầu) hoặc "Đã lưu email của {tên}. Thông báo đã gửi tới địa chỉ mới, địa chỉ cũ và các chủ đầu tư." (khi đổi). Nhờ người đó mở hộp thư trên máy hoặc điện thoại riêng, xem đã có thư **Security notice** chưa. Anh/chị cũng nhận một bản: đọc theo bảng **Thư nào – làm gì** (mục 0.3a).

[ẢNH: C1-22-Hộp Sửa email của nhân viên]

- Xóa email của một người: mở hộp như bước 3, bấm **Xóa email**, xác nhận như bước 4.
- Dòng của chính anh/chị không có nút: "Đổi email của bạn ở Bảo mật tài khoản." (mục 0.3a). Dòng của chủ đầu tư khác: "Mỗi chủ đầu tư tự đặt email của mình."
- Quản lý không thấy cột **Email** và không đặt email cho người khác.
- Lễ tân trưởng: email không bắt buộc, nhưng **khuyến khích** thêm (mục 0.3a).

**Đặt lại xác thực 2 bước** (chỉ chủ đầu tư, trên máy riêng). Dùng khi một người **đã bật 2 bước** mà mất cả điện thoại (hoặc ứng dụng xác thực) lẫn mã khôi phục. Người đó **giữ tài khoản cũ**: tên đăng nhập, vai, email và lịch sử thao tác không đổi. Người còn mã khôi phục thì tự vào bằng mã (mục 0.4), không cần khối này.

Trước khi bấm:
- **Gặp tận mặt** người đó. Không làm theo tin nhắn, cuộc gọi hay email, kể cả khi người nhắn biết tên đăng nhập hoặc xưng là đội kỹ thuật.
- Chưa gặp được ngay: **Khóa tài khoản** của người đó trước. Khóa cũng đăng xuất người đó trên mọi máy, kể cả điện thoại bị mất. Gặp rồi mới đặt lại, xong thì **Mở khóa**.
- Làm lúc người đó ngồi cùng anh/chị. **Quản lý và lễ tân trưởng** mang theo laptop riêng và điện thoại mới đã cài ứng dụng xác thực, bật lại 2 bước ngay buổi đó, không để tài khoản chỉ còn mật khẩu qua đêm. Vai khác: bước 4, 5 ở phần **Người đó làm tiếp**.

1. **Quản trị → Người dùng & vai**. Ở dòng người đó, bấm **Khác…** → **Đặt lại xác thực 2 bước**.
2. Hộp **Đặt lại xác thực 2 bước cho {tên}?** ghi: "Người này sẽ bị đăng xuất trên mọi máy và mã khôi phục cũ hết hiệu lực. Ở lần đăng nhập tới, người này thêm lại OTTIMO vào ứng dụng xác thực trên điện thoại." Kiểm đúng tên người.
3. Ô **Lý do đặt lại (ví dụ: mất điện thoại)**: ghi ngắn, ví dụ "Mất điện thoại và mã khôi phục, đã gặp tận mặt". Ít nhất 3 ký tự. Không ghi số điện thoại, số giấy tờ hay tên khách.
4. Nhập **Mật khẩu đăng nhập** và **Mã trong ứng dụng xác thực (6 số)** của anh/chị. Bấm **Đặt lại xác thực 2 bước**.
5. Desk báo "Đã đặt lại xác thực 2 bước cho {tên}." Trong **Khác…** của người đó không còn mục **Đặt lại xác thực 2 bước** (2 bước đang tắt).

[ẢNH: C1-23-Hộp Đặt lại xác thực 2 bước]

- Đổi ý: bấm **Hủy**. Không có gì thay đổi, không có thư.
- Ô lý do trống hoặc dưới 3 ký tự: Desk báo "Ghi lý do (ít nhất 3 ký tự)." dưới ô. Mã chưa bị dùng.
- "Mật khẩu hoặc mã chưa đúng. Kiểm tra lại rồi nhập mã mới.": hộp vẫn mở, lý do vẫn còn. Chờ ứng dụng hiện mã mới, nhập lại. Sai 5 lần: chờ khoảng 15 phút.
- Hộp tự đóng, danh sách tải lại, rồi Desk báo "Đã có người đổi xác thực 2 bước của {tên} trước bạn – hiện không còn bật, nên không cần đặt lại. Danh sách đã được tải lại.": 2 bước của người đó vừa được tắt hoặc đặt lại ở chỗ khác. Không bấm lại.
  - Anh/chị vừa đặt lại ở tab hay máy khác: người đó làm tiếp như phần **Người đó làm tiếp**.
  - Không phải anh/chị: coi như người cầm điện thoại bị mất đã vào tài khoản và tự tắt 2 bước. **Đặt lại mật khẩu ngay** (**Khác… → Đặt lại mật khẩu**, mật khẩu tạm đưa tận tay), rồi người đó làm tiếp như phần **Người đó làm tiếp**.

**Ngay khi đặt lại, Desk tự làm:**
- Đăng xuất người đó **trên mọi máy**, kể cả điện thoại bị mất (Desk và app nhân viên).
- **Mã khôi phục cũ** và mục OTTIMO trong ứng dụng xác thực cũ **hết hiệu lực**. 2 bước của người đó **tắt** tới khi bật lại.
- **Mật khẩu giữ nguyên.** **Đặt lại mật khẩu luôn** (**Khác… → Đặt lại mật khẩu**, đưa mật khẩu tạm tận tay) khi điện thoại bị lấy cắp, khi mật khẩu Desk có lưu hay ghi trên điện thoại đó (trình duyệt tự điền, ghi chú, giấy để cùng điện thoại), hoặc khi không chắc. Mỗi lần xác nhận cần một mã 6 số mới.
- Gửi thư **OTTIMO – Security notice: 2-step verification was reset** / Thông báo bảo mật: xác thực 2 bước đã được đặt lại tới email nhận thông báo của người đó (nếu có) và **mọi chủ đầu tư**, kể cả anh/chị. Thư này anh/chị biết trước: không cần làm gì (mục 0.3a). Chuông **Thông báo** của app nhân viên có dòng "Xác thực 2 bước của bạn đã được đặt lại" (người đó) và "Xác thực 2 bước của một tài khoản khác đã được đặt lại" (chủ đầu tư).
- Ghi **nhật ký bảo mật**: ai đặt lại, cho ai, lúc nào, lý do. Desk v1.0 chưa có màn xem nhật ký này. Cần tra thì nhắn Điều phối viên tên đăng nhập của người đó, không kèm lý do.

**Người đó làm tiếp, ngay lúc ngồi cùng anh/chị:**
1. Đăng nhập Desk trên laptop riêng bằng tên đăng nhập và mật khẩu của mình (vừa **Đặt lại mật khẩu** thì đổi mật khẩu tạm trước).
2. **Vai quản lý (kể cả người trực):** Desk tự mở **Bật xác thực 2 bước**. Làm lại mục 0.3 trên điện thoại mới, cất 10 mã khôi phục mới. Chưa xong thì Desk chưa cho làm việc khác.
3. **Lễ tân trưởng:** Desk không tự mở. Vào **tên của mình → Bảo mật tài khoản**, khối **Xác thực 2 bước** → **Bật ngay**, làm như mục 0.3 (bắt buộc – mặc định đội chọn, bước 7 ở trên; anh/chị đổi được, báo đội). Anh/chị nhìn tận mắt khối **Xác thực 2 bước** đã bật rồi mới giao việc.
4. **Sale nội bộ, CTV:** đăng nhập bằng mật khẩu, Desk không hỏi mã. **Nên bật lại ngay buổi đó** như bước 3 (không bắt buộc), khi người đó có điện thoại riêng và cất được 10 mã khôi phục.
5. **Buồng phòng, bảo trì:** tùy chọn. Không bật lại thì tài khoản chỉ có mật khẩu, như trước khi bật; Desk và app không hỏi mã. Bật lại như bước 3 chỉ khi người đó muốn, có điện thoại riêng và giữ được mã khôi phục.
6. App nhân viên: người vừa bật lại đăng nhập app sau khi bật xong, app hỏi mã 6 số mới. Người không bật lại đăng nhập app bằng mật khẩu (mục 3.1).

### 1.6 Thiết bị được cấp (chỉ chủ đầu tư)

Máy quầy phải được cấp quyền thì lễ tân mới nhận phòng và xem giấy tờ được.

1. Ngồi tại **chính máy cần cấp**. Đăng nhập Desk bằng tài khoản chủ đầu tư.
2. **Quản trị → Thiết bị được cấp**. Form cấp quyền chỉ hiện trên máy **chưa** được cấp; máy đã cấp chỉ thấy "Máy này đã được cấp quyền." và bảng thiết bị.
3. Nhập **Tên máy** (ví dụ "Máy quầy 1"), chọn **Loại thiết bị**: **Máy quầy / laptop** hoặc **Máy tính bảng của cơ sở**.
4. Tích đủ 5 mục **Kiểm máy trước khi cấp**: **Ổ đĩa đã mã hóa** · **Tự khóa màn hình sau 5 phút** · **Trình duyệt không cài tiện ích** · **Tắt lịch sử/đồng bộ bộ nhớ tạm** · **Đội kỹ thuật đã kiểm máy này**. Nút ghi **Cấp quyền thiết bị này (còn … mục kiểm)** tới khi tích đủ.
5. Nhập **Nhập lại mật khẩu đăng nhập để cấp quyền** và **Mã trong ứng dụng xác thực (6 số)**. Bấm **Cấp quyền thiết bị này**.
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
6. Hộp **Kiểm tra trước khi lưu** hiện mã BIN, **Số tài khoản (che)**, tên chủ tài khoản, hiệu lực. Đối chiếu mã BIN, tên chủ tài khoản và 4 số cuối với ứng dụng ngân hàng. Sai thì **← Sửa lại**. Đúng thì bấm **Lưu tài khoản nhận**, xác nhận bằng mật khẩu và mã 6 số.
7. Desk báo đã lên lịch. Chủ đầu tư và quản lý thấy thông báo trong Desk.

> **Lỗi đang sửa:** ở v1.0 thư báo đổi tài khoản nhận **chưa gửi tới email** của chủ đầu tư. Vì vậy chủ đầu tư kiểm mỗi sáng theo khung ở mục 1.1, tới khi đội bảo mật báo bỏ. Sửa ở v1.0.3: thư tới email chủ đầu tư nhập ở mục 0.3a, tiêu đề **OTTIMO – Notice: the deposit receiving account was changed / Thông báo: tài khoản nhận cọc đã thay đổi**. Thư này **không có chữ "Security notice"**: đừng lọc thư theo chữ đó. **Từ v1.0.4** tiêu đề đổi thành **OTTIMO – Security notice: receiving account update / Thông báo bảo mật: cập nhật tài khoản nhận chuyển khoản**, gửi cả khi đặt lịch lẫn khi hủy lịch đổi.

[ẢNH: C1-11-Tài khoản nhận đang dùng]

> **Lỗi nhỏ đã biết (sửa ở bản vá sau):** câu gợi ý trên màn bảo "tạo một mã VietQR nhỏ và quét thử". Làm theo sổ tay: **không tạo mã thử, không chuyển tiền** (gạch đầu tiên bên dưới).

[ẢNH: C1-12-Đổi tài khoản nhận, bước xem lại]

**Nhận thông báo đổi tài khoản nhận mà anh/chị không làm**, hoặc thấy dòng **Đã lên lịch** lạ:
- **Chủ đầu tư**: mở Desk bằng cách **gõ địa chỉ** (không bấm link trong email hay tin nhắn), **Hủy lịch** ngay, **đổi mật khẩu**, **tạo bộ mã khôi phục mới**, báo đội.
- **Quản lý**: **gọi chủ đầu tư ngay** (quản lý không có nút Hủy lịch). Tới khi chủ đầu tư xác nhận, lễ tân **ngừng gửi mã VietQR**, mời khách trả tiền mặt hoặc thẻ.

- Sau khi lưu, Desk chỉ hiện **4 số cuối**. Muốn kiểm số đầy đủ: với **đơn thật đầu tiên** cần thu chuyển khoản, trước khi gửi mã cho khách, tự quét mã bằng ứng dụng ngân hàng, **xem tên chủ tài khoản, không chuyển tiền**. **Không tạo đơn thử trên Desk thật** (đơn thử làm nhảy số đơn và lẫn vào dữ liệu thật).
- Đổi ý trước ngày hiệu lực: bấm **Hủy lịch**.
- Trong 24 giờ sau khi tài khoản mới có hiệu lực, mã VietQR hiện cảnh báo "Tài khoản nhận vừa đổi trong 24 giờ qua…". Khi đó lễ tân **chưa cho khách chuyển**, **gọi điện cho chủ đầu tư** xác nhận đã tự đổi tài khoản; chủ đầu tư đồng ý mới tiếp tục (mục 2.13). Anh/chị nên báo trước cho lễ tân mỗi lần đổi.

### 1.8 Duyệt yêu cầu (Cần duyệt)

Yêu cầu đi tới **mọi người có quyền duyệt**. Người gửi không chọn tên người duyệt. Người duyệt đầu tiên quyết định.

| Loại yêu cầu | Ai gửi | Ai duyệt |
|---|---|---|
| Miễn phí (FOC) khoản phát sinh, giảm giá đặc biệt tiền phòng | Lễ tân, lễ tân trưởng | Lễ tân trưởng ≤ 300.000 đ/lần và ≤ 1.500.000 đ/tháng · Quản lý ≤ giá 1 đêm/lần · Chủ đầu tư không giới hạn |
| Hoàn tiền (cọc, trả thừa, hủy, trả sớm) | Lễ tân trở lên | Quản lý, chủ đầu tư (mọi số tiền), **không phải người tạo yêu cầu**. Hiện một người trực: chủ đầu tư duyệt |
| Xóa công nợ | Quản lý (vượt giá 1 đêm) | Chủ đầu tư |
| Nhận phòng khi buồng chưa sẵn sàng (chỉ căn `VD`, `CL`; căn có khách `OC`, `OD` hoặc căn còn đơn khác đang ở: từ chối) | Lễ tân | Lễ tân trưởng trở lên |
| Trả muộn khi có khách đến cùng ngày, không còn căn thay | Lễ tân trở lên | Quản lý, chủ đầu tư |
| Khôi phục đơn "không đến" ngoài điều kiện tự làm | Lễ tân | Quản lý, chủ đầu tư |
| Gia hạn báo giá đã hết hiệu lực | Sale, CTV | Quản lý, chủ đầu tư |

**Duyệt hoặc từ chối:**
1. **Cần duyệt** (hoặc **Tổng quan → Cần duyệt**).
2. Đọc: ai gửi, lúc nào, số tiền, lý do, **Cách hoàn** (với hoàn tiền).
   - Yêu cầu nhận phòng khi buồng chưa sẵn sàng: chỉ duyệt khi **Lý do** ghi đã kiểm căn trống, có giờ và người kiểm. Căn có khách đổi phòng hôm nay mà **Lý do** không ghi đã kiểm: gọi quầy hoặc từ chối.
3. Bấm **Duyệt** → nhập **Mật khẩu đăng nhập** (Desk không hỏi mã 6 số ở bước này) → xác nhận. Hoặc **Từ chối** → ghi **Lý do từ chối** + **Mật khẩu đăng nhập**.
4. Yêu cầu bị sửa sau khi anh/chị mở: Desk báo, bấm **Tải lại** rồi quyết định.

[ẢNH: C1-13-Cần duyệt]
[ẢNH: C1-14-Hộp duyệt]

**Đơn có hơn một yêu cầu hoàn.** Một đơn có thể có hai yêu cầu hoàn trở lên, ví dụ một từ **Trả sớm** và một từ **Trả phòng** (tiền đã thu cho đêm được FOC sau đó). Đó là các khoản khác nhau, không phải hoàn trùng. Trước khi **Từ chối** một yêu cầu hoàn:
1. Cộng các yêu cầu hoàn **còn mở** của cùng mã đơn ở **Nhật ký tiền → Hoàn tiền** (tìm theo mã đơn). Tab này hiện cả yêu cầu **Chờ duyệt** và yêu cầu **Đã duyệt** chưa chi xong; yêu cầu đã duyệt không còn ở **Cần duyệt**. Dòng có "Đã ghi hoàn …" thì chỉ cộng phần chưa chi. Khoản đã chi xong không cộng.
2. Lấy số Desk còn nợ khách: dòng **Hoàn lại khách … đ** trên **Phiếu thanh toán** (khung đơn → **Xem Phiếu thanh toán**). Desk đã trừ các dòng **Đã hoàn …** và phần OTA giữ. Không tự lấy **Đã thu** trừ **Tổng cộng**: **Đã thu** là tổng đã thu, chưa trừ khoản đã hoàn. Phiếu không có dòng **Hoàn lại khách** thì số ở bước này là 0.
   - Ví dụ: **Trả sớm** 400.000 đã chi tiền mặt lúc trả phòng, còn chờ 800.000 (đêm FOC). Phiếu ghi **Đã hoàn 400.000 đ (Tiền mặt)**, **Hoàn lại khách 800.000 đ** → tổng còn mở 800.000 **bằng** → duyệt.
   - Đơn **chưa trả phòng** thì chưa có Phiếu. Lúc này thường chỉ có một yêu cầu (**Trả sớm**): duyệt bình thường, Desk không cho chi quá số khách trả thừa. Nên chi sau khi khách trả phòng, vì bill cuối có thể thêm minibar hoặc phụ thu.
3. Tổng ở bước 1 **bằng** số ở bước 2: **không có hoàn trùng**. Không từ chối chỉ vì đơn có hai yêu cầu: từ chối nhầm thì khách mất tiền. Vẫn đọc lý do từng yêu cầu như mọi yêu cầu hoàn (FOC đã duyệt, trả sớm, cọc lớn hơn bill). Lý do không khớp folio thì hỏi người tạo trước khi duyệt.
4. Tổng **lớn hơn** số ở bước 2 (thường vì có phát sinh mới sau khi tạo yêu cầu, ví dụ minibar lúc trả phòng): không từ chối, bấm **Duyệt** từng yêu cầu. Desk không cho duyệt quá số còn nợ khách: yêu cầu vượt thì Desk báo "Yêu cầu không còn cần duyệt nên đã tự đóng." và tự tạo **yêu cầu thay thế** đúng số còn lại.
   - Desk có thể đóng **cả các yêu cầu khác đang chờ** của đơn và gộp thành **một** yêu cầu thay thế. Riêng phần **đã duyệt chưa chi** đã vượt số còn nợ khách thì Desk đóng cả yêu cầu **đã duyệt** (mới nhất trước) và **xóa nơi nhận đã nhập** của yêu cầu đó (từ v1.0.4: nơi nhận chuyển sang yêu cầu thay thế, xem gạch **Trước khi duyệt yêu cầu thay thế**). Duyệt theo thứ tự nào thì số tiền cuối vẫn đúng.
   - **Nhận ra yêu cầu thay thế**: hàng **Cần duyệt** và **Hoàn tiền** ghi lý do **Hoàn tiền khách trả thừa**, cùng chữ với mọi khoản hoàn tiền trả thừa, nên chưa đủ để nhận ra; người gửi thường là người tạo yêu cầu cũ, giờ gửi là lúc Desk tự đóng yêu cầu cũ. Mở **Nhật ký tiền → Nhật ký thao tác tiền**, tìm mã đơn: có cặp dòng **cùng phút**, **Đã tự đóng** (số cũ, "Yêu cầu không còn cần duyệt nên đã tự đóng.") rồi **Gửi yêu cầu duyệt** (số mới). Cột lý do của dòng sau ghi **Hoàn tiền khách trả thừa**. Cột người làm thường ghi người bấm **Duyệt**, hoặc người vừa sửa folio, không phải người tạo. Đó là yêu cầu thay thế, không phải yêu cầu lạ. Desk cũng tự đóng khi có người sửa folio đã chốt: khi đó người gửi yêu cầu thay thế có thể là người vừa sửa. Người gửi là chính anh/chị (vừa sửa folio) thì người khác duyệt (hiện là chủ đầu tư).
   - Yêu cầu **đã duyệt** đang chờ chi mà không còn ở **Hoàn tiền** (Nhật ký thao tác tiền có dòng **Đã tự đóng** cho số đó): không chi theo số cũ; tìm yêu cầu thay thế của cùng mã đơn, làm như gạch dưới.
   - **Trước khi duyệt yêu cầu thay thế**: **Nhật ký tiền → Hoàn tiền** → dòng của mã đơn → kiểm **Cách hoàn** của **yêu cầu mới**. Ở v1.0.3, yêu cầu thay thế **không mang nơi nhận** của yêu cầu cũ, nên thường hiện "—" và nút **Nhập nơi nhận hoàn**. **Áp dụng từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên; tới lúc đó làm như câu trước): yêu cầu thay thế **giữ nơi nhận** (**Cách hoàn**) của yêu cầu bị đóng, nếu các yêu cầu cũ chỉ có **một** nơi nhận, do **một** người nhập. Yêu cầu cũ **không có** nơi nhận thì không tính: một yêu cầu có nơi nhận, một yêu cầu trống thì yêu cầu mới vẫn giữ nơi nhận đó. Vẫn **kiểm Cách hoàn** của yêu cầu mới và đối chiếu với nơi nhận khách đã đưa trước khi duyệt. Người đã nhập nơi nhận ở yêu cầu cũ vẫn **không** duyệt được yêu cầu mới, **trừ chủ đầu tư với khoản chuyển khoản** (như cũ: chủ đầu tư tự nhập chuyển khoản rồi vẫn duyệt và chi được). Các yêu cầu cũ có **2 nơi nhận khác nhau**, hoặc nơi nhận do **2 người khác nhau** nhập: yêu cầu mới **không có** nơi nhận (—), phải **Nhập nơi nhận hoàn** lại. Dòng ghi "Cách hoàn: …" thì đối chiếu với nơi nhận khách đã đưa. Dòng không có cách hoàn (—) thì **Nhập nơi nhận hoàn** trước (mục 1.12), trên máy đã cấp quyền: chuyển khoản thì chủ đầu tư tự nhập rồi vẫn duyệt và chi được; tiền mặt thì người tạo yêu cầu cũ nhập (người nhập nơi nhận tiền mặt không duyệt được khoản đó). Từ v1.0.4 thêm:
     - **Duyệt không mang sang.** Yêu cầu cũ đã duyệt (chưa chi) bị đóng thì yêu cầu thay thế ở **Chờ duyệt**: duyệt lại như mọi yêu cầu. Đây không phải lỗi.
     - Yêu cầu thay thế **tạo trước ngày v1.0.4 lên** vẫn trống (—): không ai chép lại. Nhập nơi nhận như cách ở v1.0.3.
     - **Nhật ký thao tác tiền** có dòng mới **Chép nơi nhận hoàn sang yêu cầu thay thế**, cùng phút với cặp dòng **Đã tự đóng** – **Gửi yêu cầu duyệt**. Dòng này là việc Desk tự làm, không phải ai sửa nơi nhận.
     - **Cách hoàn mang sang không còn hợp**: ví dụ **Tiền mặt** mà khách đã về (chi sau trả phòng), hoặc khách báo đổi tài khoản. Không duyệt. Liên hệ khách 1–1 lấy nơi nhận mới. Ở dòng của yêu cầu mới bấm **Nhập nơi nhận hoàn** (nút vẫn hiện khi dòng đã có nơi nhận), chọn lại **Cách hoàn**, bấm **Lưu** (mục 1.12). Người vừa lưu là người nhập: người đó không duyệt được khoản này, trừ chủ đầu tư với chuyển khoản.
   - Nhập hoặc đổi nơi nhận **sau khi đã duyệt** thì Desk đưa yêu cầu về **Chờ duyệt**, phải duyệt lại.
   - Khách đã về, chưa có số tài khoản: nhắn khách 1–1 từ tài khoản của OTTIMO. Không ghi số tài khoản vào sổ giao ca hay nhóm chat.
   - Duyệt xong, cộng lại theo bước 1–2.
5. Desk không tự đóng như bước 4 mà tổng đã duyệt vượt số ở bước 2, hoặc không rõ một yêu cầu từ đâu: **dừng**, không duyệt, không chi. Ghi sổ giao ca mã đơn và các số, báo chủ đầu tư và đội kỹ thuật. Các nguồn Desk tự ghi là hợp lệ: **Trả sớm**, **Trả phòng** (lý do lễ tân ghi), hủy đơn có cọc, "Tự sinh từ khoản thu …", "Tự sinh từ A32 …", yêu cầu thay thế sau khi tự đóng (nhận ra theo cặp dòng **Đã tự đóng** – **Gửi yêu cầu duyệt** cùng phút ở Nhật ký thao tác tiền, bước 4). Ngoài các nguồn này mới là "không rõ từ đâu".
6. Tổng **nhỏ hơn** số ở bước 2, và khung đơn hiện "Khách đã trả phòng và còn dư …": gửi **Đề nghị hoàn …** cho phần đó (mục 1.11). Khung đơn không hiện dòng này thì tính lại theo bước 1–2. Vẫn lệch thì làm như bước 5, không tạo yêu cầu bằng cách khác.

**Đơn HĐ thuê tháng** (đơn dài hạn nhập tay): không hoàn theo khối này. Đơn HĐ có yêu cầu hoàn hoặc hiện "còn dư": không duyệt, không gửi **Đề nghị hoàn**; đối chiếu HĐ giấy và sổ kế toán, quản lý hỏi chủ đầu tư. Tiền thuê và ký quỹ xử lý ngoài app (mục 2.14a nhánh HĐ thuê tháng, mục 2.7).

**Luôn duyệt bằng tài khoản của chính mình.** Ở v1.0, Desk từ chối mọi ô "mật khẩu của quản lý" trên phiên của lễ tân (vì quản lý có 2 bước). Khi lễ tân cần duyệt ngay tại quầy: lễ tân **đăng xuất**, quản lý đăng nhập tài khoản mình trên máy quầy, duyệt, đăng xuất; hoặc quản lý duyệt trên laptop riêng.

> **Tạm ở v1.0:** chưa có xác nhận từ xa trên điện thoại của quản lý (có ở v1.1). Không đọc mật khẩu qua điện thoại, không đưa mật khẩu cho lễ tân gõ hộ.

Quy tắc tách nhiệm (Desk tự kiểm):
- Không ai tự duyệt yêu cầu của chính mình, trừ khoản nằm trong hạn mức tự áp của vai.
- **Hoàn tiền – không tự duyệt, không ngoại lệ:** người tạo yêu cầu hoàn (hủy đơn, sửa dòng…) không duyệt được khoản đó, kể cả quản lý, chủ đầu tư. Desk từ chối, yêu cầu vẫn chờ người duyệt khác. Người tạo yêu cầu cũng không chi khoản đó. Riêng chủ đầu tư được chi khoản **chuyển khoản** do mình tạo, sau khi người khác đã duyệt.
- Hoàn **tiền mặt**: người nhập nơi nhận không duyệt được khoản đó, kể cả chủ đầu tư. Vì vậy người tạo yêu cầu nhập nơi nhận trước, rồi người khác duyệt. Người duyệt được chi tiền mặt.
- Hoàn chuyển khoản: người chi ≠ người tạo yêu cầu ≠ người duyệt ≠ người nhập nơi nhận. **Riêng chủ đầu tư** được vừa duyệt vừa chi cùng một khoản, và được chi khoản do mình tạo sau khi người khác đã duyệt (gạch đầu dòng trên). **Quản lý không bao giờ** vừa duyệt vừa chi cùng một khoản.
- Tổng miễn trên một lượt ở vượt ngưỡng: Desk báo chủ đầu tư (không chặn).

### 1.9 Phụ thu trả muộn bằng giá 1 đêm – xem lại sau trả phòng

Khi khách rời **sau 18:00** mà đêm đó căn **đã có khách khác đến**, lễ tân không bán thêm đêm được. Lễ tân gọi anh/chị báo trước, rồi chọn **Ghi phụ thu – quản lý xem lại**: Desk ghi đúng giá 1 đêm của đêm đó, không sửa, không miễn tại quầy (mục 2.15). Anh/chị xem lại **trong 24 giờ kể từ lúc lễ tân bấm trả phòng**.

1. Anh/chị nhận thông báo. Mở **Tổng quan → Cần chú ý**, dòng **Đơn …: phụ thu trả muộn bằng giá 1 đêm chờ xem lại** (có hạn xem).
2. Bấm **Mở folio** (folio: bảng tiền của lượt ở). Đọc lý do lễ tân ghi và số đã thu.
3. **Đồng ý**: bấm **Đã xem**. Xong.
4. **Nên giảm hoặc miễn**: trong folio, ở dòng phụ thu bấm **Điều chỉnh** → nhập số mới (hoặc **Bỏ cả dòng**) → **Lý do điều chỉnh** → **Ghi điều chỉnh**. Desk **tự tạo yêu cầu hoàn** phần chênh.
5. Yêu cầu hoàn đi vào **Cần duyệt**. **Người sửa dòng không tự duyệt khoản hoàn**: quản lý sửa thì chủ đầu tư duyệt; chủ đầu tư sửa thì **quản lý** duyệt (Desk không cho chủ đầu tư tự duyệt khoản này).
6. Sau khi duyệt, chi hoàn ở **Nhật ký tiền → Hoàn tiền** (mục 1.12).
7. Quá 24 giờ chưa xem: Desk báo chủ đầu tư, bill đóng, không sửa được nữa.

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

- **Folio** (bảng tiền của một lượt ở) đã chốt khi trả phòng. Chỉ quản lý và chủ đầu tư ghi **Điều chỉnh** (bút toán: ghi thêm dòng sửa, không xóa dòng cũ), có lý do. Desk ghi một dòng đảo và một dòng mới.
- Ghi nhầm một khoản thu: trong folio, mục **Giao dịch thu** → **Đảo giao dịch** → **Lý do đảo**. Còn phải thu tăng lại đúng số đó.
- Khách còn dư tiền sau trả phòng: khung đơn hiện "Khách đã trả phòng và còn dư …". Bấm **Đề nghị hoàn …** để vào luồng hoàn.
- Phát sinh sau trả phòng (ví dụ phát hiện hư hỏng, minibar thiếu): theo quy định được ghi trong **24 giờ** sau trả phòng, **kèm ảnh**.

- **Trong 24 giờ sau khi hoàn tất trả phòng** (từ bản `v1.0.0`): mở đơn **Đã trả phòng** → **Thêm phát sinh** → chọn **Khoản**, **Số lượng**, **Ghi chú** → **Thêm vào folio**. Lễ tân trở lên làm được.
  - Khoản phạt hoặc đền bù: ô **Ghi chú** đổi thành **Ảnh hoặc ghi chú bằng chứng** và **bắt buộc**. Đính ảnh bằng **Thêm ảnh từ buồng phòng**, hoặc ghi rõ chỗ hỏng. Ảnh chụp bằng điện thoại của cơ sở (không chụp khách, giấy tờ); đính xong thì xóa ảnh khỏi điện thoại. Đơn chưa gửi nội quy thì hộp có cảnh báo: đọc trước khi thêm khoản phạt.
  - Khung đơn hiện **Còn phải thu** và nút **Thu công nợ**; liên hệ khách thu theo mục 1.10.
  - Ghi nhầm: quản lý mở **Folio & điều chỉnh** → chọn dòng → **Điều chỉnh** → **Bỏ cả dòng (ghi bút toán đảo, không xóa)**, hoặc sửa số lượng/đơn giá, ghi **Lý do điều chỉnh**. Lễ tân không điều chỉnh được folio đã chốt. Đơn còn công nợ thì Desk không cho giảm hay bỏ dòng: quản lý dùng **Xóa công nợ** (mục 1.10).
- **Quá 24 giờ:** Desk khóa folio. **Không ai** thêm hay điều chỉnh được, kể cả quản lý và chủ đầu tư. Desk báo "Phiếu thanh toán đã khóa sau khi trả phòng…" – bỏ qua vế "Chỉ quản lý ghi được bút toán điều chỉnh", vế này sai (lỗi đang sửa, mục 5.6). Nút **Thêm phát sinh** và **Điều chỉnh** có thể còn hiện tới khoảng 1 giờ sau khi khóa; bấm thì Desk từ chối.
  - Khoản còn nợ: **Thu công nợ**, hoặc quản lý **Xóa công nợ**.
  - Phát hiện mới sau 24 giờ (hư hỏng, minibar): ghi sổ giao ca kèm mã đơn, báo chủ đầu tư. Không thu ngoài Desk.
<!-- BUG-R3-022 Closed 28/10 (rc.4, qa3-rc1.md 17.5). Sửa 30/10 theo BA M13-04, M13-05: folio-lines.service.ts chặn folio closed và settled quá post_checkout_window_until với mọi vai; FolioDialog canAdjust = settled ? mgr : fd; AddChargeDialog evidenceRequired, houseRulesMissing. Câu error.FOLIO_LOCKED sai vế sau = BUG-R3-045 (P3, v1.0.3 hoặc v1.0.4). Ca folio `closed` chưa diễn tập trên staging. -->
- Khách trả phòng sớm: từ v1.0.2 Desk tính và ghi phí, tạo yêu cầu hoàn qua nút **Trả sớm** (mục 2.14a); quản lý không giảm tiền phòng trên folio bằng tay.

### 1.12 Nhật ký tiền, đối soát và hoàn tiền

**Quản trị → Nhật ký tiền** có 3 tab:

| Tab | Dùng để |
|---|---|
| **Nhật ký thao tác tiền** | Xem mọi thao tác tiền: lúc nào, ai làm, thao tác gì, đơn nào, trước → sau, lý do. Lọc **Từ ngày** – **Đến ngày** (không lọc theo giờ, không lọc theo người). Lễ tân chỉ thấy khoản của mình |
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
1. Tab **Hoàn tiền** (tìm dòng theo **mã đơn** OTM-… và giờ gửi). Khoản chưa có nơi nhận: **Nhập nơi nhận hoàn** → chọn **Cách hoàn** (Desk chọn sẵn **Tiền mặt**; khách nhận lại theo cách đã trả thì bấm **Cùng cách khách đã trả**; hoặc **Chuyển khoản**) → **Lưu**. Dòng ghi "Cách hoàn: …" là xong, yêu cầu vẫn **Chờ duyệt**. Chỉ lưu được trên máy quầy đã cấp quyền (mục 0.5). Thường người tạo yêu cầu nhập trước khi duyệt; người nhập nơi nhận **tiền mặt** không duyệt được khoản đó (mục 1.8).
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

> **Tạm ở v1.0:** chưa có báo cáo tháng, báo cáo kênh, báo cáo FOC (miễn phí), xuất dữ liệu ra bảng tính (có ở v1.2). Cách làm thay:
> - Cuối tháng xem **Nhật ký tiền** lọc theo tháng cùng kế toán.
> - Công suất từng đêm: ghi lúc **22:00** cùng lần đối chiếu (số căn **Đang ở** trên **Sơ đồ phòng**, không tính giữ chỗ, khóa phòng, đơn nội bộ), hoặc sáng hôm sau đếm cột đêm hôm qua trên **Sơ đồ phòng**. Không lấy ô **Công suất đêm nay** buổi sáng: buổi sáng ô này là đêm sắp tới.
> - Không chụp màn hình có tên khách gửi qua chat.

### 1.14 Đóng ca

> **Tạm ở v1.0 (tới v1.3):** chưa có màn đóng ca và bàn giao tiền mặt. Dùng **sổ giao ca** giấy:
> 1. Két có **quỹ lẻ cố định** để thối tiền, số tiền do chủ đầu tư đặt: ______ đ (ghi ở đầu sổ giao ca). Tiền vượt quỹ lẻ **nộp chủ đầu tư** (hoặc người chủ đầu tư giao) mỗi ngày; hai bên ký sổ.
> 2. Ai lấy tiền ra hoặc bỏ tiền vào két trong ca của người khác (quản lý chi hoàn, sale nộp tiền mặt, nộp tiền về chủ đầu tư) thì **ghi ngay một dòng vào sổ giao ca**: giờ, số tiền, mã đơn, chữ ký.
> 3. Cuối ca tính: **Tiền phải có = quỹ lẻ đầu ca + tiền mặt thu trong ca − tiền mặt chi trong ca − tiền nộp về**. Thu/chi của mình lấy từ **Nhật ký tiền → Nhật ký thao tác tiền** (lễ tân chỉ thấy khoản của mình). Thu/chi của người khác lấy từ sổ giao ca.
> 4. Đếm két. Ghi tiền phải có, tiền đếm, chênh lệch và lý do. Hai người giao và nhận cùng ký.
> 5. Chênh lệch khác 0: báo quản lý trong ca.
> 6. Ca đêm qua 00:00: lọc **Từ ngày** hôm trước **Đến ngày** hôm nay, chỉ cộng các dòng có giờ (cột **Lúc**) nằm trong ca.
<!-- Số quỹ lẻ: [GIẢ ĐỊNH – chờ INV đặt số] (DOM thẻ 04). -->

Trong 3 ngày đầu, lấy luôn sổ giao ca để đối chiếu lúc 22:00 với sổ giấy và Desk.

### 1.15 Nhật ký và kiểm soát

- Mọi thao tác tiền, miễn giảm, đổi giá, đổi tham số đều có người làm, giờ, lý do.
- **Từ v1.0.5 – bộ lọc Sửa giảm dòng – 7 ngày** ở **Nhật ký tiền** (chỉ quản lý, chủ đầu tư thấy):
  - hiện mọi lần một dòng phát sinh bị làm nhỏ đi trong 7 ngày gần nhất: bỏ dòng, giảm số lượng, giảm giá, đếm lại minibar thấp hơn (lý do **Đếm lại minibar**); có cả lần sửa của quản lý, chủ đầu tư;
  - không gồm tiền đêm (giá đêm, phụ thu người, chênh đổi căn);
  - 7 ngày tính theo ngày lịch: lần sửa lúc 00:00–05:59 nằm ở ngày lịch hôm sau;
  - lễ tân không thấy bộ lọc này. Tới v1.0.6, lễ tân ghi các dòng mình đã sửa giảm vào sổ giao ca trước khi giao ca (mục 2.1).
<!-- Nguồn: BR-438 (4)(ii), US-177 AC7 (i), UXD copy-v1.0.5.md 9.5 (mlog.filter_reductions), PR #108 (reductionsOnly), DOM-on-be-prs-101-108-110.md mục 2, 3.2. FE chưa có nhánh dựng bộ lọc (07/11); chưa có ảnh. DOM-on-ba-v105-docs.md mục 4, FB-R5-DOM-BA-03; BE-A2 0b2ebb45 (ORC 07/11): lần đếm lại làm dòng minibar nhỏ đi ghi thêm folio_line.adjusted nên có trong bộ lọc, vào v1.0.5 nếu #110 gộp trước. #110 trượt khỏi tag thì trả lại câu "Tới khi có bản sửa, lần đếm lại minibar chưa hiện ở bộ lọc này…" (commit d467578b). -->
- Mỗi lần xem giấy tờ đầy đủ đều được ghi nhật ký truy cập.
> **Tạm ở v1.0:** Desk chưa có màn xem nhật ký truy cập giấy tờ. Cần tra ai đã xem giấy tờ của một khách (ví dụ khách khiếu nại): chủ đầu tư nhắn Điều phối viên **chỉ mã đơn** và chữ "tra nhật ký giấy tờ". Kết quả gửi riêng cho chủ đầu tư, không lưu trong kho mã. **Không** gõ tên khách hay nội dung khiếu nại vào `/feedback`.
<!-- Nguồn: SEC FB-R3-SEC-BA-01 (c); decision-log ORC 27/10 "không đưa dữ liệu khách thật vào repo công khai". -->

### 1.16 Việc riêng của chủ đầu tư trong tuần đầu

- Đổi giờ nhận phòng 12:00 trên Booking.com, Agoda, Airbnb, Google Maps, fanpage, thẻ trong căn trước 02/11. Câu chuẩn: "Check-in from 12:00 (your room is always ready by 14:00) · Check-out by 12:00" / "Nhận phòng từ 12:00 (phòng luôn sẵn sàng lúc 14:00) · Trả phòng trước 12:00". Không viết "phòng sẵn sàng từ 12:00".
- **Báo lễ tân trưởng danh sách kênh OTA đã đăng giờ nhận/trả và mức phụ thu trong nội quy.** Kênh chưa đăng thì lễ tân chưa thu phụ thu nhận sớm/trả muộn của khách đặt qua kênh đó (mục 2.10).
- Ghi rõ ai được đóng/mở phòng trên extranet từng kênh (mục 2.6).
- Đặt số **quỹ lẻ** trong két (mục 1.14).
- Chuyển đổi dữ liệu ngày D theo hướng dẫn chuyển đổi ngày đầu (chủ đầu tư giữ).
- Yêu cầu của khách về dữ liệu cá nhân: xử lý bằng tay.
- Hóa đơn GTGT: vẫn xuất ngoài Desk (mục 4.3).
- **Kho minibar (K-MB, từ tuần này):** hàng minibar để ở một chỗ riêng có khóa, chủ đầu tư giữ chìa dự phòng. Nhập mua thì ghi sổ kho: ngày, món, số lượng. Đặt **phiếu nạp** ở kho: người nạp tủ ghi mỗi lần một dòng (ngày, căn, món, số lượng lấy ra), không ghi tên khách. Hàng ra kho mà không vào tủ cũng ghi một dòng: ngày, món, số lượng, lý do (**hết hạn** / **vỡ, hỏng** / **dùng khác**: ghi ngắn), cột căn để "–". Món hết hạn hay vỡ giữ lại vỏ hoặc chai tới lần đếm tuần, rồi bỏ. Đếm kho lần đầu để có tồn đầu tuần. Vì sao: hiện buồng phòng báo số bằng lời và lễ tân nhập, nên Desk không bắt được lần đếm thấp ngay từ đầu. Đếm kho mỗi tuần (mục 1.1, dòng **Mỗi tuần**) bắt được cả gian lận lẫn đếm nhầm, và cho số thật để quyết nhập hàng.
  <!-- K-MB: DOM rounds/round-05/responses/DOM-responses.md, đề xuất (A) 2 (rủi ro chốt chặn đếm lại minibar, DOM chấp nhận tới khi có màn đếm cho buồng phòng). -->
- **Điện thoại cơ sở – tắt tự lưu ảnh** (đội bảo mật 07/11, quy định): ở Zalo, WhatsApp, Telegram, Viber, tắt tự lưu ảnh và file vào thư viện ảnh (WhatsApp: **Hiển thị file phương tiện** trên Android, **Lưu vào Camera Roll** trên iPhone). Làm trong **lượt thử xóa tin** cùng lễ tân: gửi tin "TEST XOA" từ tài khoản một nhân viên tới từng tài khoản OTTIMO, rồi xóa theo mục 2.21, hai dòng "Khách lỡ gửi số thẻ"; làm Zalo OA trước. Ghi lại kênh nào đã tắt. Ở bước email, cho đội biết Google Vault có bật quy tắc giữ thư không. Tin thử không có chữ số, không ảnh thẻ, kể cả số thẻ thử; không dùng tài khoản hay dữ liệu khách. Lượt thử không chặn bản phát hành; kết quả gửi đội qua điều phối viên. Thay điện thoại cơ sở: tắt lại ngay trên máy mới.
- **Ngày v1.0.3 lên – email nhận thông báo bảo mật** (mục 0.3a):
  1. **Chủ đầu tư nhập email của mình trước**, thấy thư của mình về hộp thư riêng rồi mới bảo quản lý (và người trực có vai quản lý) nhập.
  2. Khi quản lý nhập, chủ đầu tư nhận một thư báo email của quản lý đã đổi. Thư này là bình thường: đây là lần tập đọc thư theo bảng **Thư nào – làm gì**.
  3. Thấy thư thì báo đội **"đã nhận"** qua điều phối viên. **Không dán địa chỉ email vào chat.**
  4. **Vẫn kiểm bảo mật mỗi sáng** (mục 1.1) tới khi đội bảo mật báo bỏ.

---

## Chương 2. Lễ tân (FDL, FD)

> Trước khi bắt đầu: đăng nhập `desk.ottimo.vn` bằng tài khoản của mình trên **máy quầy đã cấp quyền** (mục 0.5). Ngày trên Desk đổi lúc **06:00**. Giấy tờ khách chỉ nằm trên Desk. Lễ tân trưởng có thêm việc riêng ở mục 2.22.

Luôn nhớ:
- **Mỗi người một tài khoản.** Không đọc mật khẩu qua điện thoại, không gõ mật khẩu quản lý vào màn của mình. Rời máy thì đăng xuất.
- **Giấy tờ khách chỉ nằm trên Desk.** Không chụp, không gửi Zalo. **Mã cửa không gửi bằng chữ hay ảnh**: chỉ đọc tại quầy hoặc tự gọi ra số trên đơn, khi đơn đã đủ điều kiện (mục 2.10).
- **Nhận phòng từ 12:00, phòng luôn sẵn sàng lúc 14:00.** Không hứa "phòng sẵn sàng từ 12:00".
- **Chỉ bấm "đã nhận" khi chắc tiền đã về** (mục 2.13). Ảnh chụp hay SMS chuyển khoản của khách không phải bằng chứng. Mã VietQR hiện **"Tài khoản nhận vừa đổi"**: chưa cho khách chuyển, gọi chủ đầu tư trước.
- Đơn OTA mới: **nhập Desk ngay**, rồi đóng phòng trên extranet các kênh khác. Ba ngày đầu ghi thêm **sổ giấy**, đối chiếu 22:00.

### 2.1 Đầu ca, cuối ca

**Đầu ca:**
1. Đăng nhập. Desk mở **Hôm nay**.
2. Đọc **Cần chú ý** trước. Xử lý từ dòng đỏ trở xuống.
3. Xem **Khách đến (n)**, **Khách đi (n)**, **Giữ chỗ chưa cọc (n)**, **Yêu cầu của khách**. Khối **Giữ chỗ chưa cọc (n)** chỉ có giữ chỗ **đến hôm nay**, gồm cả đơn đã nhận một phần cọc, và chỉ hiện khi có đơn.
4. **Rà giữ chỗ (tới bản v1.0.3):** theo khung "Giữ chỗ quá hạn" ở mục 2.4 – **Đơn đặt phòng** → lọc **Đang hiệu lực** → mở từng dòng **Giữ chỗ · chờ cọc**. Rà **3 mốc mỗi ngày**: lúc mở quầy (muộn nhất 09:00), **11:00**, trước khi rời quầy (muộn nhất 21:00); thêm mỗi lần thấy **Giữ chỗ sắp hết hạn**.
5. Bàn giao với ca trước: tiền mặt trong két, việc dở dang (sổ giao ca).

**Cuối ca:**
1. **Khách đi** hôm nay không còn căn chưa trả phòng: khách đã đi thì **Trả phòng** (ghi giờ rời thật), khách ở thêm thì **Gia hạn**. Từ v1.0.5, sau 00:00 danh sách này không còn hiện căn đó (mục 2.20). **Cần chú ý** không còn dòng đỏ chưa xử lý (hoặc đã ghi chú, bàn giao). Tới v1.0.3: mọi giữ chỗ "còn 0 giờ 00 phút" đỏ đã hủy, hoặc đã có dòng "Giữ – …" trong sổ giao ca (mục 2.4). Đơn đã có dòng đó không phải xử lý lại ở lượt rà sau.
2. Đối chiếu tiền mặt theo mục 1.14.
3. **Dòng tự sửa giảm trong ca (từ v1.0.5, tới v1.0.6).** Từ v1.0.5, lễ tân và lễ tân trưởng chỉ tự sửa giảm (bỏ dòng, giảm số lượng, giảm giá) dòng phát sinh do chính mình nhập trong ngày; dòng khác phải **Gửi miễn có duyệt**. Danh sách đóng ca có khối các dòng này từ v1.0.6. Tới đó, trước khi giao ca:
   - mở **Nhật ký tiền → Nhật ký thao tác tiền**, lọc ngày như mục 1.14 bước 3 và 6;
   - tìm các dòng **Điều chỉnh dòng folio** của mình trong ca mà cột **Trước → sau** nhỏ đi: bỏ dòng, giảm số lượng, giảm giá. Đếm lại minibar thấp hơn cũng hiện là **Điều chỉnh dòng folio**, lý do **Đếm lại minibar**. Cùng lần đếm đó còn có hàng **Đảo dòng folio** (và hàng **Thêm dòng folio** nếu còn món tính tiền): không ghi riêng hai hàng này.
   - ghi sổ giao ca mỗi dòng: giờ, mã đơn, dòng gì, số trước → sau, lý do. Không ghi tên khách;
   - báo người nhận ca các dòng đã sửa.
4. Ba ngày đầu: so sổ giấy với Desk lúc 22:00.
5. **Đăng xuất**.

### 2.2 Màn Hôm nay

| Khối | Nội dung | Nút |
|---|---|---|
| Số liệu | **Đang ở**, **Khách đến hôm nay**, **Khách đi hôm nay**, **Công suất đêm nay** | – |
| **Khách đến (n)** | Tên, căn, số đêm, giờ đến dự kiến, giấy tờ (**Chưa có giấy tờ**, **Đã làm thủ tục trước**…), **Còn phải thu** | **Nhận phòng**, **Mở đơn** |
| **Khách đi (n)** | Giờ trả, trạng thái liên lạc (**Chưa trả lời – gọi xác nhận**, **Đã trả lời**, **Quá giờ trả phòng**) | **Trả phòng**, **Xác nhận giờ trả** |
| **Giữ chỗ chưa cọc (n)** | Giữ chỗ **đến hôm nay** (gồm cả đơn đã nhận một phần cọc) và thời gian còn lại, ví dụ "còn 1 giờ 20 phút (hết hạn …)" | **Mở đơn** |
| **Cần chú ý** | Khai báo sắp hạn, đơn OTA chưa gán căn, công nợ, phiếu sửa… | **Mở**, **Đã xử lý** |
| **Yêu cầu của khách** | Yêu cầu gửi từ trang khách | **Đã nhận**, **Làm xong**, **Không thực hiện được** |

Dòng **Có khách đến cùng căn hôm nay** ở khách đi: ưu tiên chốt giờ trả với khách này.

[ẢNH: C2-01-Hôm nay]

> **Lỗi nhỏ đã biết (sửa ở v1.0.3 hoặc v1.0.4):** trong **Cần chú ý**, dòng giữ chỗ sắp hết hạn chưa ghi mã đơn. Bấm vào dòng để mở đơn.

### 2.3 Sơ đồ phòng

1. **Vận hành → Sơ đồ phòng**. Lưới 10 căn × 14 ngày.
2. **Lùi 7 ngày** / **Tới 7 ngày** / **Hôm nay** để đổi khoảng ngày. **Kiểu xem**: **Lưới** hoặc **Danh sách**. Lọc **Nhóm căn**.
3. Mỗi thanh là một đơn: **Giữ chỗ · chờ cọc**, **Đã xác nhận**, **Đang ở**, **Đã trả phòng**, **Hợp đồng dài hạn** (nhãn **HĐ**, **Nhập tay**), **Khóa phòng**.
4. Bấm vào thanh để mở **khung đơn**. Bấm vào **ô trống** để đặt căn đó từ ngày đó.
5. Làn **Chưa gán căn – xung đột OTA** hiện đơn OTA về khi căn đã kín (mục 2.6).
6. Đơn đã hủy, không đến không hiện trên sơ đồ.

[ẢNH: C2-02-Sơ đồ phòng, chú giải]

### 2.4 Báo giá, giữ chỗ và cọc VietQR

**Nhắn khách từ đâu:** chỉ từ **tài khoản Zalo/số điện thoại của OTTIMO trên điện thoại của cơ sở** (hoặc hộp thư OTA). Không nhắn khách từ Zalo cá nhân. **Máy quầy đã cấp quyền không cài và không mở Zalo/Zalo Web.** Mở Desk trên điện thoại cơ sở để **Sao chép gửi Zalo**. **Điện thoại cơ sở tắt tự lưu ảnh và file vào thư viện ảnh** ở Zalo, WhatsApp, Telegram, Viber (chủ đầu tư cài, mục 1.16). Thấy ảnh khách gửi tự vào thư viện ảnh, thường sau khi app cập nhật: xóa ảnh đó, cả trong thùng rác ảnh, tắt lại cài đặt, báo chủ đầu tư.
<!-- [GIẢ ĐỊNH – chờ INV xác nhận] (SEC FB-R3-SEC-BA-09): OTTIMO có tài khoản Zalo của cơ sở (OA hoặc số cơ sở) trên điện thoại của cơ sở. Nếu chưa có, dùng tạm số điện thoại cơ sở. -->

Tin có số tiền hoặc mã VietQR: chỉ gửi mã **Desk vừa tạo cho đúng đơn**, kèm câu: "OTTIMO only messages you from this account and your OTA inbox, and never changes bank details by message." / "OTTIMO chỉ nhắn từ tài khoản này và hộp thư OTA, không bao giờ đổi số tài khoản qua tin nhắn." Không gửi ảnh QR cũ, không gõ số tài khoản bằng tay.
<!-- UXD hoàn thiện câu chống giả danh theo brand guideline (SEC thẻ 09). -->

**Báo giá:**
1. **Khách & bán → Báo giá & giữ chỗ**, tab **Căn trống**.
2. Nhập **Ngày đến**, **Số đêm**, **Người lớn (từ 12 tuổi)**, trẻ em.
3. Chọn căn trong danh sách căn trống. Desk mở **Báo giá**: số đêm thường, số đêm thứ Sáu/thứ Bảy, phụ thu người, **Tổng tiền đơn**, **Cọc để giữ phòng** (30 % tiền phòng). Chọn **Khách đứng tên** ngay trong hộp này (tìm, hoặc **Tạo nhanh khách**).
4. Bấm **Lưu báo giá**. Chọn **Ngôn ngữ gửi khách** (Tiếng Việt, English, Русский), bấm **Sao chép gửi Zalo**, dán vào tin nhắn riêng với khách.
5. Báo giá giữ giá **3 ngày**. Hết hạn thì **Lập báo giá mới**.

[ẢNH: C2-03-Báo giá, tab căn trống]
[ẢNH: C2-04-Hộp báo giá]

**Giữ chỗ khi khách đồng ý:**
1. Trong báo giá, bấm **Khách đồng ý – Giữ chỗ**.
2. Hộp **Giữ chỗ**: chọn **Giữ trong** 12 h, 24 h hoặc 48 h (mặc định 24). Hạn giữ không vượt 12:00 ngày đến. (Khách đứng tên đã chọn ở bước Báo giá.)
3. Bấm **Tạo giữ chỗ**. Desk tạo đơn **Giữ chỗ · chờ cọc** và mã **VietQR** đúng số cọc, nội dung chuyển khoản là **mã đơn**.
4. Gửi mã QR cho khách theo cách ở đầu mục (**Sao chép số tiền**, **Sao chép nội dung** nếu khách tự gõ). Mã có dòng **"Tài khoản nhận vừa đổi"**: chưa gửi, gọi chủ đầu tư xác nhận trước (mục 2.13). Desk nhắc 2 giờ trước khi hết hạn.
5. Quá hạn chưa cọc: Desk tự hủy và mở bán lại căn.

[ẢNH: C2-05-Giữ chỗ và mã VietQR cọc]

**Xác nhận đã nhận cọc:**
1. **Chỉ xác nhận khi chắc tiền đã về tài khoản OTTIMO**, theo cách kiểm tiền ở mục 2.13. Ảnh chụp màn hình của khách không phải bằng chứng.
2. Mở đơn → **Xác nhận đã nhận cọc**.
3. Hộp **Xác nhận cọc · OTM-…**: kiểm **Số tiền đã nhận** và **Cách thanh toán** (VietQR, Chuyển khoản, Tiền mặt, Thẻ). Bấm **Xác nhận đã nhận cọc**. Số nhận khác số cọc thì nút đổi thành **Ghi nhận …** và Desk báo khoản được ghi như chuyển khoản tay, chờ đối soát.

> **Lỗi đang sửa:** hộp **Xác nhận cọc** chưa có ô mã giao dịch. Ghi mã giao dịch ngân hàng (nếu có) vào sổ giao ca kèm mã đơn, để quản lý đối soát.
4. Đơn chuyển **Đã xác nhận**, căn bị chặn trên sơ đồ.

[ẢNH: C2-06-Xác nhận đã nhận cọc]

Lưu ý:
- **Xử lý trước hạn.** Trước hạn, Desk làm được cả ba việc: xác nhận cọc, gia hạn, hủy. Sau hạn, ở v1.0 chỉ còn hủy (khung "Giữ chỗ quá hạn" bên dưới). Tiền đã về thì bấm xác nhận **trước giờ hạn**: ghi tay sau hạn thì Desk từ chối, kể cả khi tiền về trước hạn (hộp chưa có ô giờ nhận tiền).
- Khách chuyển thiếu: vẫn ghi được số đã nhận; đơn giữ **Giữ chỗ · chờ cọc** và hiện số còn thiếu. **Gọi hoặc nhắn khách ngay trong ngày** xin phần còn lại trước hạn. Ở v1.0 Desk **chưa có** "Chấp nhận cọc thiếu": giữ chỗ cọc thiếu không thành **Đã xác nhận** được. Khách nói "trả phần còn lại khi đến": nói thật với khách và chọn (a) khách chuyển nốt trước hạn, hoặc (b) giữ đơn theo khung bên dưới, báo khách khi nhận phòng sẽ thanh toán đủ và khoản đã chuyển được chủ đầu tư hoàn lại (tiền mặt tại quầy khi chủ đầu tư có mặt, hoặc chuyển khoản trong 24 giờ).
- Thấy **Giữ chỗ sắp hết hạn** (Desk nhắc 2 giờ trước hạn ở **Cần chú ý** trên Desk; người tạo giữ chỗ còn có tin ở **hộp Thông báo trên app nhân viên**): gọi khách ngay.
- Khách chuyển dư: ghi **Lý do thu vượt**; phần dư thành tiền thừa của khách.
- Mã VietQR hết hạn: bấm **Tạo mã VietQR mới** (mã cũ hết hiệu lực), hoặc ghi như chuyển khoản tay (**Chờ đối soát**).
- Gia hạn giữ chỗ: **Gia hạn giữ chỗ (1 lần)**, tối đa thêm 24 giờ, không quá 12:00 ngày đến. **Chỉ làm trước hạn**; sau hạn nút này không còn.
- Sale/CTV đã báo khách chuyển cọc: khung đơn hiện **CTV/sale đã báo chuyển cọc** kèm **Xem ảnh biên nhận**. Vẫn kiểm sao kê trước khi xác nhận.
- **Hộp Thông báo nằm trên app nhân viên** (`staff.ottimo.vn`, chuông **Thông báo**). Desk không có hộp Thông báo. Máy hoặc điện thoại ở quầy đăng nhập app nhân viên trong ca (mục 3.1) để thấy tin giữ chỗ.
  - **Tin không đổ chuông:** không có âm thanh, không hiện ngoài app; chỉ có số tin chưa đọc khi mở app. Mở hộp ở mỗi mốc rà giữ chỗ.
  - **Tin chỉ để nhắc.** Gõ mã đơn trong tin vào ô tìm ở **Đơn đặt phòng**, bấm **Tất cả**, rồi làm theo **trạng thái đơn**, không theo câu tin.
  - **Tới v1.0.5**, mọi tin giữ chỗ hiện câu chung "Thông báo mới – xem chi tiết trên OTTIMO Desk" kèm mã đơn. Tin đó có thể là giữ chỗ chưa cọc đã tự hủy, giữ chỗ có cọc đã quá hạn, hoặc giữ chỗ còn chờ cọc sau 12:00 ngày đến. Tài khoản có vai quản lý (như tài khoản người trực hiện nay) nhận cả ba loại.
  - **Từ v1.0.5**, mỗi loại có câu riêng.
- Check-in online: từ v1.0.4, khung đơn giữ chỗ không còn mục **Link check-in online**. Xác nhận cọc trước, rồi gửi link theo mục 2.9.

> **Lỗi nhỏ đã biết (sửa ở v1.0.3 hoặc v1.0.4):** hộp "Giữ chỗ" hiện số cọc và nội dung chuyển khoản hai lần; khách đến hôm nay vẫn hiện ô chọn thời hạn giữ dù không giữ được.

**Giữ chỗ tới hạn – Desk tự làm gì:**
- **Chưa cọc:** Desk tự hủy trong khoảng 1 phút sau hạn, nhả căn, không phí. Tin báo nằm ở **hộp Thông báo trên app nhân viên**, kèm mã đơn, không có tên khách:
  - **v1.0.4 (đang chạy):** chỉ người tạo và người chốt đơn nhận tin; không có ai thì lễ tân, lễ tân trưởng nhận. Tin hiện câu chung "Thông báo mới – xem chi tiết trên OTTIMO Desk", giống hệt tin của giữ chỗ có cọc đã quá hạn. Giữ chỗ do sale, CTV tạo thì quầy không có tin (sale, CTV không dùng app nhân viên).
  - **Từ v1.0.5:** tin hiện "Giữ chỗ chưa cọc đã hết hạn và tự hủy". Người nhận: người tạo, người chốt và **mọi người có tài khoản đang hoạt động, có vai lễ tân hoặc lễ tân trưởng tại cơ sở**. Tài khoản đã khóa không nhận. Mỗi người một tin cho mỗi đơn.
  - Có tin hay không, vẫn rà giữ chỗ theo mã đơn ở Tờ 2a tới khi chủ đầu tư báo hết tạm. Thấy tin: mở đơn theo mã (gõ mã vào ô tìm ở **Đơn đặt phòng**, bấm **Tất cả**), rồi làm theo trạng thái đơn:
    - Đơn **Đã hủy**, lý do **Hết hạn giữ chỗ**: kiểm tiền về theo mã đơn rồi báo khách (đơn sale, CTV: báo người đó trước).
    - Đơn còn **Giữ chỗ · chờ cọc**: đơn chưa hủy, căn vẫn giữ. **Không** báo khách đơn đã hủy. Đã có cọc: làm theo gạch **Đã nhận cọc (đủ hoặc thiếu)** ngay dưới đây. Chưa nhận đồng nào (Desk chưa kịp tự hủy): làm theo Tờ 2a, dòng **Hết hạn, chưa cọc**, câu "Quá hạn vài phút…". <!-- DOM 07/11 (lượt đọc 792e510a): thêm vế "chưa nhận đồng nào" cho khớp `02` 4.5 (ý (2)/(3) của 17.1) và Tờ 2a; không đổi ý. -->
  <!-- FB-R5-DOM-PO-08 (rounds/round-05/reviews/DOM-on-ba-v105-docs.md mục 1): v1.0.4 cả ba kind giữ chỗ (hold_expired, hold_overdue_with_deposit, hold_overdue_cap) hiện staff.notif.k.other kèm mã đơn; push: false. Câu "Từ v1.0.5 mỗi loại có câu riêng" đúng khi MOB #117 lên cùng tag với #100 (DOM giả định 1). -->
- **Đã nhận cọc (đủ hoặc thiếu):** Desk **không** tự hủy (có tiền của khách). Đơn giữ nguyên **Giữ chỗ · chờ cọc**, căn vẫn bị giữ, đồng hồ hiện **"còn 0 giờ 00 phút"** màu đỏ (trong sổ tay gọi tắt là **"0h00"**). Phải xử lý trước **12:00 ngày đến**.

> **Lỗi đang sửa – Giữ chỗ quá hạn (tới bản v1.0.3).** Ở v1.0:
> - Desk chưa đưa giữ chỗ quá hạn vào **Cần chú ý** hay hộp thông báo. Riêng giữ chỗ **có yêu cầu giảm giá hoặc miễn phí (FOC)** thì không tự hủy, kể cả khi chưa cọc.
> - **Sau hạn chỉ còn Hủy giữ chỗ.** Desk từ chối **Xác nhận đã nhận cọc** ("Giữ chỗ đã hết hạn…"), ẩn **Gia hạn giữ chỗ**, và chưa có "Chấp nhận cọc thiếu".
> - **Desk ghi sai với giữ chỗ có cọc:** khung đơn ghi "Giữ chỗ đã hết hạn lúc … – **đơn đã tự hủy**", câu lỗi ghi "căn đã **mở bán lại**". Thực tế đơn **chưa** hủy (trạng thái vẫn **Giữ chỗ · chờ cọc**), căn vẫn bị giữ, tiền khách vẫn trên đơn. Hộp hủy ghi "**Không thu phí (giữ chỗ chưa cọc)**" và không hiện dòng hoàn: **đừng tin dòng này** – Desk vẫn tạo yêu cầu hoàn đủ số đã nhận.
>
> **Rà ở đâu, khi nào.** Người trực rà **3 mốc mỗi ngày**: lúc mở quầy (muộn nhất 09:00), **11:00** (trước trần 12:00 ngày đến), trước khi rời quầy (muộn nhất 21:00); thêm mỗi lần thấy **Giữ chỗ sắp hết hạn**. Lượt rà đủ: **Đơn đặt phòng** → lọc **Đang hiệu lực** → mở từng dòng **Giữ chỗ · chờ cọc** (10 căn, 1–2 phút). **Hôm nay** chỉ có giữ chỗ đến hôm nay; **Sơ đồ phòng** chỉ hiện 14 ngày – hai màn này chỉ để nhìn nhanh. Xử lý theo thứ tự:
> 1. **Còn dưới 2 giờ:** xử lý **trước hạn** (Lưu ý ở trên). Đây là việc chính.
> 2. **Chưa cọc mà đã "còn 0 giờ 00 phút"** (thường là đơn có yêu cầu giảm giá/FOC):
>    - **Hủy giữ chỗ** ngay khi thấy, không chờ gọi khách. **Lý do hủy**: **Không liên lạc được** (khách không cọc tới hạn). Không chọn **Khác (ghi rõ)** (khung "Hủy với lý do Khác" bên dưới). Ghi sổ giao ca "OTM-… hủy – hết hạn giữ chỗ, chưa cọc". Không phí. Căn mở lại.
>    - Nhắn hoặc gọi khách (đơn CTV: nhắn CTV trước; CTV liên hệ khách trong 1 giờ, quá 1 giờ hoặc đã 11:00 ngày đến thì gọi thẳng số khách trên đơn). Khách còn muốn:
>      - **Đến từ ngày mai:** tạo **giữ chỗ mới**, chọn **12 h**. Báo giá cũ còn hiệu lực (3 ngày): bấm lại **Khách đồng ý – Giữ chỗ** từ báo giá đó; hết hiệu lực thì **Lập báo giá mới** theo giá hiện hành. Giảm giá hoặc FOC của đơn cũ không tự sang đơn mới: xin lại trên từng đêm của đơn mới, ghi lý do. Trong hạn mức quản lý (mỗi lần không quá giá 1 đêm), Desk áp ngay bằng quyền quản lý của người trực. Desk báo phải chờ chủ đầu tư duyệt: nhắn chủ đầu tư mã đơn và số tiền. Ghi sổ giao ca "Tạo lại từ OTM-… (hết hạn dd/mm)".
>      - **Đến hôm nay:** không giữ chỗ được. Gửi VietQR, tạo đơn khi tiền về. Khách đang trên đường: căn còn thì nhận khi tới, như khách vãng lai.
>    - **Chỉ tạo lại một lần** cho cùng khách, cùng kỳ ở. Giữ chỗ tạo lại mà lại quá hạn: hủy, không giữ nữa.
>    - Không cần báo ai. Báo chủ đầu tư chỉ khi khách đòi giữ giá cũ mà báo giá đã hết hiệu lực và giá hiện hành cao hơn.
> 3. **Đã có cọc mà đã "còn 0 giờ 00 phút":** gọi khách, rồi làm theo bảng dưới. **Không** bấm **Xác nhận đã nhận cọc** (Desk từ chối). **Không** tạo đơn mới trước khi hủy đơn cũ (Desk chặn trùng, hoặc ghi cọc hai lần).
>
> Ví dụ: căn 202, 3 đêm 05–08/11 = 2.376.000 đ, cọc yêu cầu 700.000 đ, khách đã chuyển 300.000 đ, hạn 10:00 03/11.
>
> | Khách nói | Làm gì ở v1.0 | Ai, hạn |
> |---|---|---|
> | "Không đi nữa", hoặc không liên lạc được tới **11:00 ngày đến** | **Hủy giữ chỗ**, **Lý do hủy**: **Khách đổi ý** (khách báo không đi) hoặc **Không liên lạc được** (gọi không được). Không chọn **Khác (ghi rõ)**. Desk giữ lại 0 đ, tạo yêu cầu hoàn **300.000 đ** (hộp hủy không hiện dòng này). Người trực, trên máy quầy đã cấp quyền, mở **Nhật ký tiền → Hoàn tiền** → dòng của mã đơn → **Nhập nơi nhận hoàn** → **Cách hoàn**: bấm **Cùng cách khách đã trả** (Desk chọn sẵn **Tiền mặt** – phải đổi) → **Lưu**. Dòng ghi "Cách hoàn: Cùng cách khách đã trả" là xong. Ghi sổ giao ca "OTM-… hủy – hết hạn giữ chỗ, có cọc – chờ chủ đầu tư hoàn 300.000". **Chủ đầu tư duyệt** ở **Cần duyệt** rồi **chi** | Người trực hủy và nhập nơi nhận; **chủ đầu tư duyệt và chi**. Desk không cho người tạo yêu cầu hoàn tự duyệt hay tự chi, kể cả có quyền quản lý. Hủy muộn nhất 12:00 ngày đến |
> | "Vẫn đi, trả nốt" (chuyển nốt hoặc trả khi đến) | **Không** nhận thêm chuyển khoản vào đơn cũ (Desk không ghi được sau hạn). **Để nguyên đơn**: Desk không tự hủy đơn có cọc, căn vẫn giữ. Ghi sổ giao ca: "OTM-… Giữ – cọc thiếu 400.000, thu khi đến – [người quyết] dd/mm". Báo khách: phần còn lại thanh toán khi nhận phòng | Người trực, bằng quyền quản lý. Quyết trước 12:00 ngày đến |
> | Khách đó tới quầy (đơn vẫn **Giữ chỗ · chờ cọc**) | **Nếu chủ đầu tư đã báo v1.0.3 lên**: **Xác nhận đã nhận cọc** phần còn lại → **Nhận phòng**. **Nếu chưa**: (a) **Hủy giữ chỗ** đơn cũ, **Lý do hủy**: **Khách đổi ý** → Desk tạo yêu cầu hoàn 300.000. **Nhập nơi nhận hoàn** ngay: **Chuyển khoản** (mặc định). **Tiền mặt** chỉ khi chủ đầu tư đang ở quầy, hoặc đã hẹn qua điện thoại một giờ cụ thể tới quầy trong thời gian khách ở. (Hộp **Nhập nơi nhận hoàn** chọn sẵn **Tiền mặt**: chọn đúng **Cách hoàn** rồi bấm **Lưu**.) (b) **Đặt phòng mới** cùng căn, nhập đúng giá từng đêm đã chốt, **cùng Kênh và Nguồn / CTV chốt đơn** như đơn cũ (không chọn **Khách vãng lai**). **Thu cọc ngay lúc đặt**: **Số tiền đã nhận** ít nhất bằng **Cọc cần thu** (ví dụ 700.000), chọn **Cách thanh toán** – Desk không lưu đơn khi chưa đủ cọc. Desk chọn sẵn **Chuyển khoản VietQR**: đổi đúng cách khách đã trả trước khi bấm **Tạo đơn**. Ghi sổ giao ca "OTM-mới thay OTM-cũ". Đơn cũ có giảm giá hoặc FOC: xin lại trên đơn mới như bước 2 ở trên ("Đến từ ngày mai"), trước khi thu ở bước (c). (c) Ở bước nhận phòng thu **phần còn lại** (ví dụ 2.376.000 − 700.000 = **1.676.000**) → **Nhận phòng**. (d) **Chủ đầu tư duyệt và chi** 300.000: tiền mặt tại quầy (khách thực trả 2.076.000), hoặc chuyển khoản lại. **Chủ đầu tư vắng thì khách chưa nhận lại cọc cũ tại quầy được**, kể cả khi người trực có quyền quản lý. Nói thật với khách: "We will transfer your 300,000 VND deposit back to you within 24 hours." / "OTTIMO sẽ chuyển khoản lại 300.000 đ tiền cọc cho anh/chị trong vòng 24 giờ." Chỉ hẹn tiền mặt khi chủ đầu tư đã hẹn giờ tới quầy. Ghi cách hẹn và giờ hẹn vào sổ giao ca, nhắn chủ đầu tư ngay mã đơn và số tiền (không ghi tên khách). Chủ đầu tư hoàn trong lượt kiểm sáng hôm sau, muộn nhất 24 giờ sau khi khách nhận phòng. Desk báo khoản thu chưa đối soát: chủ đầu tư đối soát khoản cọc cũ ở **Nhật ký tiền → Chờ đối soát** trước, rồi mới chi | Người trực (a–c); chủ đầu tư duyệt và chi (d). Khi khách đến |
> | Khách đã lỡ chuyển nốt **sau** hạn | Tiền đã ở tài khoản OTTIMO nhưng Desk không ghi được vào đơn cũ. Kiểm tiền về như mục 2.13, rồi ghi sổ giao ca: mã đơn, số tiền, giờ tiền về. Mở đơn cũ xem **Đã thu**: khoản này đã có trên đơn cũ (lỡ bấm xác nhận qua VietQR) thì không ghi lại ở bước (b) – Desk hoàn cả khoản này khi hủy đơn cũ. Khi khách đến, làm như dòng trên. Phần đã chuyển ghi ở **bước (b)**, vào **Số tiền đã nhận**, **Cách thanh toán** **Chuyển khoản** (không chọn VietQR), ghi chú "chuyển dd/mm hh:mm". Chưa đủ **Cọc cần thu** (ví dụ đã chuyển 400.000, cọc 700.000): khách chuyển thêm 300.000 ngay, ghi chung **một** khoản chuyển khoản 700.000, ghi chú cả hai lần chuyển. Khách không chuyển thêm được: không gộp tiền mặt hay thẻ vào khoản này. Thu đủ cọc bằng tiền mặt hoặc thẻ; khoản đã chuyển sau hạn ghi sổ giao ca, chủ đầu tư chuyển trả về đúng tài khoản đã chuyển trong 24 giờ. Bước (c) chỉ thu phần còn lại | Người trực; chủ đầu tư đối chiếu sao kê sáng hôm sau |
>
> Không hạ giá đêm để cọc yêu cầu thấp xuống cho đủ: làm sai giá và doanh thu.
>
> **Hủy với lý do Khác – lỗi đang sửa (tới v1.0.3 hoặc v1.0.4):** chọn **Khác (ghi rõ)** thì hộp hủy báo "Chưa tính được phí hủy nên chưa hủy được" và khóa nút, kể cả khi đã gõ ghi chú và bấm **Thử lại**. Chọn lý do có sẵn: **Không liên lạc được** (gọi không được, khách không cọc tới hạn) hoặc **Khách đổi ý** (khách không đi, hoặc làm lại đơn khi khách đến). Điều cần giải thích ghi vào sổ giao ca, không ghi tên khách.
>
> **Sổ giao ca:** mỗi đơn đã xử lý một dòng – mã đơn, đã làm gì (không ghi tên khách). **Trước khi rời quầy**: mọi giữ chỗ "còn 0 giờ 00 phút" đã hủy, hoặc đã có dòng "Giữ – …". Chủ đầu tư xem lại các dòng có chữ "giữ chỗ" và các yêu cầu hoàn mới trong lượt kiểm sáng (mục 1.1).
>
> Khi OTTIMO có thêm lễ tân: rà ở đầu mỗi ca, và việc quyết đơn có cọc thiếu chuyển về quản lý. Khi chủ đầu tư báo v1.0.3 đã lên đủ bản sửa: bỏ khung này, làm theo Desk mới.
<!-- Quyết định DOM 30/10: rounds/round-03/reviews/DOM-on-PO-v1.0.0-docs.md mục A.1–A.4 (thẻ DOC-01…08), BA M13-01, M13-02, M13-03, M13-06. Lỗi: BUG-R3-041 (P2), WA-04, BUG-R3-042 (P1, V1), 043 (P2, V2), 044 (P2, V3 + M13-03) – đích v1.0.3 (backlog 5.6, PO 03/11). Điều kiện bỏ khung: v1.0.3 có V1, V2, V4 + QA thử lại ba lối ra BR-303 trước và sau hạn (DOM-09). Lệch với DOM A.3: DOM ghi "Ghi chú nội bộ" trên đơn, nhưng khung đơn đã tạo chưa có ô ghi chú cho lễ tân (cùng lý do mục 2.14a; ô "Ghi chú nội bộ" chỉ có khi đặt đơn kênh Nội bộ) → PO dùng sổ giao ca. QA thử luồng trên staging 30/10 (rounds/round-03/qa/qa3-rc1.md mục 20, việc 20.7): không dùng lý do Khác (BUG-R3-046, P2, v1.0.3 hoặc v1.0.4); người tạo yêu cầu hoàn không tự duyệt (SELF_APPROVAL_FORBIDDEN) và không tự chi tiền mặt (SELF_REFUND_FORBIDDEN), không ngoại lệ – sửa câu "người trực hủy và duyệt" của DOM A.3; người nhập nơi nhận tiền mặt không duyệt được khoản đó, kể cả OWN; đơn Trực tiếp mới phải đủ cọc lúc đặt (422 DEPOSIT_INSUFFICIENT); nút link check-in online trên giữ chỗ (BUG-R3-047, P3; đã sửa ở v1.0.4). -->

### 2.5 Đặt phòng ngắn ngày (khách trực tiếp, CTV)

1. **Sơ đồ phòng** (bấm ô trống hoặc **Đặt phòng mới**) hoặc **Đơn đặt phòng → Đặt phòng mới**.
2. **Căn**, **Ngày đến – ngày đi**. Danh sách căn có đủ các căn đang bán; Desk báo ngay dưới ô ngày là căn **còn trống cả khoảng ngày** hay đã kín, và chặn khi lưu nếu kín. (Chữ phụ trên màn "chỉ hiện căn … còn trống" chưa đúng – đang sửa.)
3. **Số khách**: **Người lớn (từ 12 tuổi)**, **Trẻ 6–11 tuổi**, **Trẻ dưới 6 tuổi**.
4. **Kênh**: **Trực tiếp**, **CTV / môi giới**, **OTA** hoặc **Nội bộ**.
   - Trực tiếp: chọn **Nguồn**: **Zalo / điện thoại**, **Website**, **Khách vãng lai**, **Khách quay lại**, **Sale nội bộ** (chọn **Người chốt**).
   - CTV: chọn **CTV chốt đơn** (bắt buộc).
   - Nội bộ: phòng dùng nội bộ, mặc định không thu tiền, vẫn chiếm phòng. Chỉ tạo khi chủ đầu tư hoặc quản lý đã đồng ý. **Ghi chú nội bộ** ghi người cho, lý do, số đêm miễn phí. Người ở cần ở thêm: tới khi chủ đầu tư báo v1.0.4 đã lên, **không bấm Gia hạn** (Desk tính giá Trực tiếp cho đêm thêm, BUG-R4-038); làm theo mục 2.12 bước 7.
     - **Giá mỗi đêm của đơn Nội bộ** (bước 8): có thu thì gõ giá cho **mọi** đêm; miễn phí cả đơn thì để trống **mọi** ô (đơn 0 đ). Không gõ 0 vào ô: Desk không nhận (từ v1.0.4 Desk báo "Miễn phí: để trống ô. Có thu: nhập giá lớn hơn 0."). Từ v1.0.4, gõ một phần số đêm thì Desk chặn, không tạo đơn, và báo "Đơn Nội bộ: nhập giá cho mọi đêm, hoặc để trống hết nếu miễn phí cả đơn."
     - **Đơn Nội bộ có cả đêm thu và đêm miễn phí:** gõ giá cho mọi đêm, đêm miễn phí gõ cùng giá với đêm có thu. Ghi trong **Ghi chú nội bộ** đêm nào miễn phí, ai cho, và "chờ quản lý sửa 0 đ". Quản lý hoặc chủ đầu tư mở **Folio & điều chỉnh** → dòng tiền phòng của đêm đó → **Điều chỉnh** → **Giá đêm mới (trước giảm theo số đêm)** 0, ghi **Lý do điều chỉnh**. Bỏ qua dòng chữ nhỏ dưới ô giá (nói sàn–trần và xin giảm giá đặc biệt): đêm của đơn Nội bộ không áp sàn–trần, gõ 0 lưu được. Chữ cũ, sửa ở v1.0.5. Làm ngay sau khi tạo đơn, muộn nhất **trước khi nhận phòng**: lúc nhận phòng Desk thu đủ tiền phòng, kể cả đêm chưa về 0. **Không** dùng miễn phí (FOC) hay giảm giá đặc biệt 100 %. Sửa xong, lễ tân kiểm **Folio**: tiền phòng và **Còn phải thu** đúng số.
     - Lễ tân và lễ tân trưởng không sửa được về 0. Chưa có quản lý thì để đơn như đã gõ và ghi sổ giao ca. Tới lúc **nhận phòng** mà đêm đó chưa về 0 (Folio còn tiền của đêm miễn phí): **chưa thu**. Gọi quản lý hoặc chủ đầu tư sửa (làm được từ xa trên Desk), kiểm lại **Còn phải thu**, rồi mới thu và nhận phòng. Không liên lạc được ai: thu đúng số Desk đòi, ghi sổ giao ca "OTM-…: thu dư … cho đêm miễn phí dd/mm, chờ quản lý sửa 0 đ". Quản lý sửa trước khi trả phòng. Lúc trả phòng, bước **Bill & thu tiền** báo khách trả thừa: hoàn phần dư như mục 2.14 bước 6.
     - Đêm đầu hoặc đêm cuối đã về 0 thì phụ thu nhận sớm hoặc trả muộn của đêm đó cũng 0. Đêm đầu miễn phí mà khách nhận sớm: đêm đó phải về 0 trước khi nhận phòng thì phụ thu nhận sớm mới là 0.
     - **Tới v1.0.3** Desk chưa chặn: gõ một phần thì Desk bỏ hết số đã gõ, đơn thành 0 đ mà không báo. Gõ đủ mọi đêm hoặc để trống hết.
<!-- DOM BR-105 v0.5.8 (1)–(5) (ARC-on-v104-pr82-rate-source.md mục 8); v0.5.9 (4): hạn sửa về 0 là trước khi nhận phòng, vì B9 điều kiện balance_paid thu đủ tiền phòng mọi kênh trừ OTA trả trước (DOM #72 thẻ 01). Chặn gõ một phần: FE #82, gộp main f9ff4e1f (câu booking.error.rate_empty_internal; gõ 0: booking.error.rate_zero_internal, v1.0.3 báo booking.error.rate_empty). Sửa đêm về 0 (A31, chỉ OWN/MGR, đơn còn Giữ chỗ / Đã xác nhận / Đang ở): #71, gộp main 2c8cd8cf; FolioDialog nhận 0, chữ folio.adjust_night_help vẫn nhắc sàn–trần và xin giảm giá đặc biệt (không áp cho đêm Nội bộ, folio-lines.service.ts); câu "Bỏ qua dòng chữ nhỏ…" theo UXD #72 thẻ 06, khóa riêng folio.adjust_night_help_internal ở v1.0.5 thì bỏ câu này. Dự phòng giảm 100 % của DOM không cần nữa. -->
5. **Khách đứng tên**: gõ tên, SĐT, email hoặc mã khách để tìm. Chưa có thì **Tạo nhanh khách "…"** → hộp **Hồ sơ khách mới**: Họ và tên, **Số điện thoại / Zalo** (cần ít nhất SĐT hoặc email), Quốc tịch, Ngôn ngữ giao tiếp.
6. Kênh Trực tiếp và CTV **bắt buộc có số điện thoại**. Ô **Số điện thoại / Zalo** trên form đặt phòng chỉ hiện khi hồ sơ khách chưa có số. **Email** không bắt buộc.
7. **Giờ đến dự kiến** (nếu khách báo).
8. **Giá mỗi đêm**: Desk điền theo lịch giá (**Nguồn giá** ghi rõ). Chỉ sửa khi đã chốt giá khác với khách, trong khoảng **sàn–trần** (giá thấp nhất và cao nhất được phép nhập). Từ ngày chủ đầu tư chuyển giá, Desk không giảm theo số đêm: gõ đúng giá đã chốt với khách. Cột **Giá lịch/đêm (trước giảm theo số đêm)** vẫn ghi "trước giảm theo số đêm": chữ cũ. Đơn từ 7 đêm mà Desk hiện dòng "Đã giảm …% vì ở từ 7 đêm (BR-107)": dừng, báo quản lý. Đơn **Nội bộ**: xem bước 4.
   - **Giá đã gõ khi đổi thông tin khác trên hộp (từ v1.0.4):**
     - Desk **giữ** giá đã gõ khi đổi số khách, đổi ngày (các đêm còn trong khoảng), đổi giữa **Trực tiếp** và **CTV**, đổi sang căn **cùng nhóm căn**, hoặc đổi căn của đơn **OTA** / **Nội bộ**.
     - Desk **xóa** giá đã gõ khi đổi kênh sang hoặc rời **OTA** / **Nội bộ**, và khi đổi căn của đơn **Trực tiếp** / **CTV** sang căn **nhóm khác**. Desk báo "Đã xóa giá đã gõ vì đổi kênh." hoặc "Đã xóa giá đã gõ vì căn … thuộc nhóm căn khác. Kiểm lại giá mỗi đêm trước khi tạo đơn." Đổi nhóm căn thì Desk tính lại theo lịch giá căn mới; muốn giữ ưu đãi cho khách thì gõ lại, trong sàn–trần của nhóm mới.
     - Đêm mới thêm khi đổi ngày: Trực tiếp, CTV lấy giá lịch; OTA làm theo bước 4 mục 2.6.
     - Tới v1.0.3, đổi căn, ngày, số khách hay kênh có thể làm Desk bỏ giá đã gõ hoặc giữ số của lựa chọn trước: chọn xong căn, ngày, số khách, kênh rồi mới gõ giá.
     - Bản nào cũng vậy: kiểm lại từng đêm ngay trước khi bấm **Tạo đơn**. Từ v1.0.4, cột **Nguồn giá** ghi **Giá đã gõ** ở đêm đã gõ tay, **Giá niêm yết (BR-101)** ở đêm Desk điền, "–" ở ô trống. Tới v1.0.3 cột này có thể ghi nhãn lịch giá cả ở đêm đã gõ; đơn vẫn lưu đúng số đã gõ.
9. Xem **Tổng tiền phòng**, **Cọc cần thu**.
10. Ô **Số tiền đã nhận** được điền sẵn bằng số cọc. **Chỉ để nguyên khi khách đã chuyển thật** (đã kiểm theo mục 2.13): chọn **Cách thanh toán**, ghi **Mã giao dịch / ghi chú**, bấm **Tạo đơn**. Desk chọn sẵn **Chuyển khoản VietQR** – đổi đúng cách khách đã trả trước khi bấm **Tạo đơn**. Khách chưa chuyển: bấm **Giữ chỗ đến …** (nút này chỉ có với kênh Trực tiếp/CTV và ngày đến từ ngày mai).
   - **Giá thỏa thuận (đã gõ ở bước 8), khách chưa chuyển cọc** (áp dụng ngay, tới v1.0.5). Tới v1.0.3, **Giữ chỗ đến …** bỏ giá đã gõ mà không báo. Từ v1.0.4, còn giá đã gõ thì Desk khóa nút này và báo "Giữ chỗ chỉ theo giá niêm yết. Đã nhận cọc thì bấm Tạo đơn để lưu giá đã gõ. Chưa nhận cọc thì xóa giá đã gõ rồi giữ chỗ, xác nhận cọc xong thì Điều chỉnh giá ở Folio." Giữ chỗ luôn tính cọc 30 % theo giá niêm yết.
     - **Khách chuyển ngay, trong vài phút:** không giữ chỗ. Tiền về thì **Tạo đơn** với giá đã gõ, cọc 30 % theo giá thỏa thuận.
     - **Phải giữ căn lâu hơn:** xóa các ô giá đã gõ (từ v1.0.4, xóa hết thì nút mở lại), rồi bấm **Giữ chỗ đến …** theo giá niêm yết. Ghi sổ giao ca "OTM-…: giá thỏa thuận … đ/đêm". Báo khách **đúng số cọc Desk hiện** ở giữ chỗ, và nói rõ phần chênh được trừ vào tiền còn lại khi nhận phòng. Không báo cọc theo giá thỏa thuận: số đó thấp hơn mức Desk đòi, nên không **Xác nhận đã nhận cọc** được. Ví dụ: Studio niêm yết 800.000, thỏa thuận 700.000, 2 đêm: cọc giữ chỗ là 500.000; theo giá thỏa thuận chỉ 400.000.
     - **Tiền về:** **Xác nhận đã nhận cọc** như thường (mục 2.4). Ngay sau đó: khung đơn → **Folio & điều chỉnh** → từng dòng tiền phòng → **Điều chỉnh** → **Giá đêm mới (trước giảm theo số đêm)** là giá thỏa thuận; **Lý do điều chỉnh** "Giá thỏa thuận lúc đặt". Từ ngày chủ đầu tư chuyển giá không còn giảm theo số đêm: chữ "trước giảm theo số đêm" trên ô là chữ cũ, gõ đúng giá thỏa thuận. Kiểm **Folio**: tiền phòng bằng tổng thỏa thuận; **Còn phải thu** bằng tổng thỏa thuận trừ cọc đã nhận. Giá thỏa thuận dưới sàn thì không dùng cách này: làm giảm giá đặc biệt có duyệt (mục 2.12, **Miễn phí, giảm giá**).
     - **Không** giữ chỗ theo giá niêm yết rồi, khi tiền về, tạo một đơn mới: phải hủy giữ chỗ trước, căn bị bỏ trống và ca khác hoặc website có thể bán mất.
     - **Khách hủy sau khi đã cọc theo giá niêm yết:** phí hủy tính trên cọc đã nhận. Phần cọc vượt mức theo giá thỏa thuận (100.000 ở ví dụ trên) hoàn đủ, quản lý duyệt.
<!-- QA lượt sau (M24): khách đến hôm nay chưa trả (không có nút Giữ chỗ) – xóa số ở ô Số tiền đã nhận rồi Tạo đơn có được không, đơn ở trạng thái nào. -->

[ẢNH: C2-07-Đặt phòng mới, kênh Trực tiếp]

Desk chặn và giải thích khi:
- **Đặt trùng** căn và đêm đã có đơn. Desk gợi ý **Căn trống cùng nhóm**.
- Ngày đến thứ Sáu, thứ Bảy hoặc ngày đặc biệt mà chỉ ở 1 đêm: "Ngày này cần ở tối thiểu 2 đêm". Ngoại lệ đêm lẻ giữa hai đơn: Desk gợi ý **Dùng căn … (đêm lẻ)**.
- Vượt sức chứa căn.
- Từ **30 đêm** trở lên (từ ngày chủ đầu tư chuyển giá): Desk mở **… đêm là thuê dài hạn** → **Tạo đơn dài hạn nhập tay** (mục 2.7). Câu Desk "Từ 28 đêm …" là chữ cũ, số đúng là 30: đơn 28–29 đêm vẫn là đơn ngắn ngày.
- Đặt khi mất mạng: Desk giữ **nháp** trên máy, tạo đơn khi có mạng.

> **Lỗi nhỏ đã biết (v1.0.3 hoặc v1.0.4):** sau **Tạo nhanh khách**, ô **Khách đứng tên** đôi khi vẫn đỏ tới lần bấm sau. Bấm lại vào ô là hết.

### 2.5a Một khách đặt nhiều căn

> **Tạm ở v1.0:** chưa có đơn nhóm. Làm như sau:
> - Tạo **mỗi căn một đơn**, cùng khách đứng tên. Khi tạo đơn, ghi vào ô **Ghi chú nội bộ**: "Nhóm: OTM-…, OTM-…" (mã các đơn đã tạo trước).
> - **Cọc**: gửi khách mã VietQR của từng đơn. Khách chuyển **một lần** cho cả nhóm: xác nhận cọc ở **từng đơn, đúng số cọc của đơn đó**. Ghi vào sổ giao ca: "OTM-… + OTM-…: chuyển gộp 1 lần, số tiền …". **Không** ghi cả khoản vào một đơn: đơn đó sẽ thành tiền thừa, đơn kia tự hủy khi hết hạn giữ chỗ.
> - CTV giữ chỗ tối đa 3 đơn, sale tối đa 5 đơn: nhóm lớn hơn thì nhờ lễ tân tạo.
> - Hủy một căn: hủy đơn đó theo chính sách hủy. Các đơn còn lại giữ nguyên.
> - Nhận phòng, khai báo lưu trú theo từng đơn, đủ người ở từng căn.

### 2.6 Đơn OTA nhập tay (Booking.com, Agoda, Airbnb…)

> **Tạm ở v1.0:** Desk chưa kết nối kênh OTA (Booking.com, Agoda, Airbnb…) tự động (có ở v1.1). Có đơn OTA mới: **nhập Desk ngay**, rồi **đóng phòng trên extranet** (trang quản lý của kênh) **các kênh khác**. Desk chặn trùng trong Desk, nhưng chưa tự đóng phòng trên kênh.
> - Kiểm extranet mọi kênh **đầu ca, 12:00, 18:00 và cuối ca**.
> - Bật thông báo đơn mới của từng kênh về điện thoại của cơ sở.
> - Chỉ người chủ đầu tư giao mới được đóng/mở phòng trên extranet.

1. **Đặt phòng mới**, **Kênh** = **OTA**.
2. Chọn **Kênh OTA**, nhập **Mã đặt phòng OTA**.
3. **Thanh toán**: **OTA đã thu tiền phòng** hoặc **Khách trả tại OTTIMO**.
   - **OTA đã thu tiền phòng** (Airbnb, Agoda trả trước, Booking "Payments by Booking"): Desk tự ghi **Đã thu qua OTA**. **Không thu lại tiền phòng, không thu cọc.** Tại quầy chỉ thu phụ thu người vượt, nhận sớm/trả muộn, phát sinh.
   - **Khách trả tại OTTIMO**: thu đủ tiền phòng khi nhận phòng như đơn Trực tiếp.
   - Kênh trả bằng **thẻ thanh toán ảo**: chỉ chủ đầu tư/quản lý xem trên extranet và gõ thẳng vào máy POS. Không sao chép, không in, không chụp màn hình số thẻ. Không nhập số thẻ vào Desk.
4. **Giá từng đêm.** Tới v1.0.3: **gõ đủ giá mọi đêm theo xác nhận của OTA** (extranet), kể cả khi ô đã có sẵn số; không để trống ô nào. **Từ v1.0.4:** để trống mọi ô thì Desk lấy giá lịch OTA theo giá niêm yết của căn; hoặc gõ đủ mọi đêm theo xác nhận của OTA. Tiền phòng OTA báo khác số Desk tính (nhất là đơn **Khách trả tại OTTIMO**) thì gõ theo xác nhận của OTA. Không gõ một phần số đêm: Desk báo "Nhập giá mỗi đêm (lớn hơn 0)." Giá ngoài sàn–trần vẫn lưu được, ghi lý do để quản lý xem lại.
5. Số khách theo kênh. Vượt sức chứa: Desk cho lưu kèm lý do, nhắc liên hệ khách.
6. Căn đã kín (kênh bán trùng): Desk báo **Căn … đã kín** và cho chọn căn trống cùng nhóm, hoặc **Lưu chưa gán căn** – đơn vào làn **Chưa gán căn**, quản lý nhận cảnh báo ngay.
7. Bấm **Tạo đơn**. Rồi đóng phòng trên các kênh khác.

[ẢNH: C2-08-Đặt phòng mới, kênh OTA]

**Khách OTA báo thêm người:**
- Có thông báo sửa đơn trên extranet: sửa số khách theo đơn mới, chọn **Khách đã sửa đơn trên …**, nhập **Mã sửa đơn trên extranet**. Không phụ thu.
- Khách tự báo với OTTIMO (Zalo, điện thoại, tại quầy): chọn **Khách báo trực tiếp với OTTIMO**. Giữ số khách đã đặt qua kênh, thu phụ thu người vượt tại quầy.
- Không có bằng chứng sửa đơn trên kênh thì coi là khách tự báo.

**Gán căn cho đơn chưa gán:** khung đơn → **Gán căn** → chọn trong **Căn trống phù hợp** (dòng **Phù hợp nhất** ít tạo đêm lẻ nhất) → **Gán vào căn …**. Căn nhóm cao hơn là **Nâng hạng** – cần lễ tân trưởng xác nhận. Chưa gán căn thì chưa nhận phòng được.

### 2.7 Đơn dài hạn nhập tay

<!-- BUG-R3-019 (P1) Closed 28/10 trên rc.4 (qa3-rc1.md 17.2): bỏ khung "Lỗi đang sửa" theo chú thích BA. Q4 (17.2): folio đơn dài hạn nhập tay 0 dòng, tiền thuê và ký quỹ ghi ngoài app – khớp khung "Tạm ở" dưới đây. -->

1. **Sơ đồ phòng** hoặc **Đơn đặt phòng** → **Đơn dài hạn nhập tay**.
2. **Căn**, **Ngày vào**, **Ngày ra (theo HĐ)**. Desk hiện số tháng và số đêm. Dưới **30 đêm** (từ ngày chủ đầu tư chuyển giá): Desk đề nghị tạo đơn ngắn ngày.
3. **Khách đứng tên**, **Số điện thoại / Zalo**, **Nguồn** (Zalo / điện thoại, Website, Khách vãng lai, Khách quay lại).
4. **Tiền thuê mỗi tháng (theo HĐ)**: gõ đúng số trên hợp đồng giấy.
5. **Ký quỹ đang giữ (ngoài app)**: chỉ để ghi nhớ, không tạo giao dịch.
6. **Số hợp đồng giấy**, **Ghi chú (gói dọn, chu kỳ thu…)**.
7. Bấm **Tạo đơn dài hạn**. Đơn mang cờ **HĐ ngoài hệ thống – sẽ chuyển vào app**, giữ căn trên sơ đồ như mọi đơn.

[ẢNH: C2-09-Đơn dài hạn nhập tay]

> **Tạm ở v1.0:** hợp đồng, lịch kỳ thu, nhắc thu, ký quỹ và **điện nước** chưa có trong Desk (có ở v1.3). Làm như hiện nay:
> - Hợp đồng và ký quỹ: giấy và sổ kế toán. **Không ghi ký quỹ vào Desk.**
> - **Lịch thu**: lễ tân trưởng giữ bảng kỳ thu (giấy hoặc bảng tính trên máy quầy; không ghi số giấy tờ): căn, khách, **ngày kết thúc HĐ** (theo HĐ giấy, không đổi khi gia hạn), kỳ, số tiền, hạn, **ngày đã thu**. Nhắn khách 7 ngày trước hạn và đúng ngày hạn, trong khung 08:00–21:00. Khi khách rời sớm, bảng này cho biết kỳ cuối đã thu chưa (mục 2.14a).
> - **Khách trả trễ**: quá hạn 3 ngày báo quản lý. Quá hạn 10 ngày, quản lý xử lý theo hợp đồng. **Không** đổi mã cửa, **không** khóa cửa, **không** cắt điện nước, **không** mang đồ của khách ra để ép trả.
> - **Điện**: (chỉ số cuối − chỉ số đầu) × **đơn giá trên hợp đồng giấy**. Hợp đồng không ghi đơn giá: báo quản lý trước khi gửi khách. Đơn giá 5.000 đ/kWh chưa in vào hợp đồng mới tới khi kế toán/luật sư xác nhận.
> - **Nước**: 100.000 đ × số người × số ngày ở trong tháng ÷ số ngày của tháng, làm tròn 1.000 đ. Ngày vào tính, ngày trả không tính. Trẻ dưới 6 tuổi miễn (đang chờ chủ đầu tư xác nhận). Ví dụ 2 người vào 10/10, tháng 31 ngày: 100.000 × 2 × 22 ÷ 31 = **142.000 đ**.
> - **Chốt công tơ**: theo mục 4.1. Kỳ tháng 10/2026 chốt ngày 31/10 trong sổ cũ.
> - Thu tiền điện nước và ghi sổ như hiện nay.
> - **Tiền thuê kỳ sau ngày chạy**: khung đơn đang ở **chưa có nút ghi thu giữa kỳ**. Thu và ghi sổ kế toán như hiện nay, ghi chú "Kỳ tháng mm/yyyy"; không ghi vào Desk.
> - Phụ thu người thêm của khách dài hạn: theo hợp đồng giấy; Desk không tự tính ở đơn này.
> - Khoản phát sinh trong lúc ở (giặt, dọn lẻ…): **Thêm phát sinh** như đơn ngắn ngày; thu ở bước 3 trả phòng hoặc **Thu công nợ**.
<!-- QA 28/10 (17.2): tạo đơn dài hạn đạt; nhận phòng/trả phòng đơn dài hạn chưa diễn tập (ngày 2027). DOM xác nhận cách ghi tiền thuê kỳ. -->

### 2.8 Sửa, đổi, hủy đơn trước ngày đến

Mở đơn (từ **Sơ đồ phòng**, **Đơn đặt phòng** hoặc **Hôm nay → Mở đơn**). Khung đơn có thanh **Tiến trình đơn**: **Đặt → Giữ chỗ → Đã cọc → Nhận phòng → Trả phòng**, và các nút theo trạng thái.

[ẢNH: C2-10-Khung đơn và các nút]

**Đổi căn / đổi ngày:**
1. **Đổi căn / đổi ngày** → chọn căn mới, **Ngày đến**, **Ngày đi**.
2. **Lý do đổi** (danh sách chọn) chia 3 nhóm: **Khách xin đổi – tính giá căn mới** · **OTTIMO đổi – giữ giá đã đặt** · **Khác – giữ giá đã đặt**.
3. Desk **Tính thử trước khi lưu**: giá cũ, giá mới từng đêm, **Khách trả thêm** / **Khách được giảm** / **Không đổi tiền**.
4. Báo khách số mới. Tích **Đã báo khách số tiền mới**. Bấm **Lưu thay đổi**. Khách không đồng ý thì đóng hộp, không lưu.
5. Đơn OTA: đổi căn trong cùng ngày thì dùng **Đổi căn / đổi ngày** như thường (ngày giữ theo kênh). Khách sửa **ngày** trên kênh thì **Hủy đơn**, lý do **OTA báo hủy**, **Tiền phạt theo kênh** 0, rồi tạo đơn mới cùng **Mã đặt phòng OTA** theo ngày mới, ghi **Ghi chú nội bộ** "OTA sửa đơn".

[ẢNH: C2-11-Đổi căn, đổi ngày, tính thử]

**Hủy:**
1. Đơn giữ chỗ chưa cọc: **Hủy giữ chỗ** → hộp **Hủy giữ chỗ căn …?** → **Lý do hủy** (Khách đổi ý · Khách tìm được chỗ khác · Giá chưa phù hợp · Đổi ngày · Không liên lạc được · Khác (ghi rõ)) → **Hủy giữ chỗ** (hoặc **Giữ lại đơn**). Không thu phí. **Ở v1.0 không chọn Khác (ghi rõ)** (khung bên dưới).
   - Giữ chỗ **đã nhận một phần cọc** cũng hủy bằng nút này. Ở v1.0 hộp vẫn ghi "Không thu phí (giữ chỗ chưa cọc)" và không hiện dòng hoàn (lỗi đang sửa), nhưng Desk **vẫn tạo yêu cầu hoàn đủ số đã nhận**. Người hủy, trên máy quầy đã cấp quyền, mở **Nhật ký tiền → Hoàn tiền** → **Nhập nơi nhận hoàn** → chọn **Cách hoàn** (Desk chọn sẵn **Tiền mặt**; khách nhận lại theo cách đã trả thì bấm **Cùng cách khách đã trả**) → **Lưu**. Dòng đơn ghi "Cách hoàn: …" là xong. **Người khác người hủy** duyệt ở **Cần duyệt** và chi (hiện một người trực: chủ đầu tư duyệt và chi – mục 2.4).
2. Đơn đã xác nhận: **Hủy đơn** → **Lý do hủy**. Desk tính **phí hủy** và **khoản hoàn** theo chính sách kênh Trực tiếp/CTV. Số ngày báo trước = ngày đến − ngày khách báo (ngày trên Desk):
   - Từ 7 ngày: hoàn 100 % cọc.
   - 3–6 ngày: hoàn 50 %.
   - Dưới 3 ngày: không hoàn.
   - **Đơn có đêm ngày đặc biệt: không hoàn cọc.**
   - Ví dụ đơn đến 22/11: báo ngày 15/11 là 7 ngày, hoàn 100 %. Báo ngày 16/11 là 6 ngày, hoàn 50 %.
   - Bất khả kháng (đèo vào Đà Lạt đóng, chuyến bay hủy do thời tiết, có giấy báo của cơ quan hoặc hãng bay): không hoàn tiền mặt. Quản lý cho **dời ngày** miễn phí trong 3 tháng, áp cả ngày đặc biệt.
   - Đọc số trên hộp **Hủy đơn OTM-… của …?** trước khi bấm **Hủy đơn**. Đổi ý thì bấm **Giữ lại đơn**.
3. Đơn OTA: nhập **Tiền phạt theo kênh** đúng số kênh báo (0 nếu kênh miễn phạt).
4. Có khoản hoàn: Desk tạo yêu cầu hoàn. Người hủy nhập nơi nhận hoàn; **quản lý hoặc chủ đầu tư khác người hủy** duyệt. Tiền mặt: người duyệt chi được. Chuyển khoản: quản lý đã duyệt thì người khác chi; chủ đầu tư được vừa duyệt vừa chi (mục 1.8). Người hủy không tự duyệt, không tự chi được, kể cả có quyền quản lý. Hiện một người trực: chủ đầu tư duyệt và chi.
   - Nhập nơi nhận hoàn trên máy quầy đã cấp quyền: **Nhật ký tiền → Hoàn tiền** → dòng của mã đơn → **Nhập nơi nhận hoàn** → chọn **Cách hoàn** (Desk chọn sẵn **Tiền mặt**; khách nhận lại theo cách đã trả thì bấm **Cùng cách khách đã trả**) → **Lưu**. Dòng đơn ghi "Cách hoàn: …" là xong.
   - Hộp hủy ghi "… – cần quản lý duyệt": ở OTTIMO hiện **chủ đầu tư** duyệt và chi, không đi tìm quản lý.
5. Khách muốn đổi ngày thay vì hủy: **Dời ngày thay vì hủy** (chỉ quản lý).

[ẢNH: C2-12-Hủy đơn]

> **Lỗi đang sửa (v1.0.3 hoặc v1.0.4) – lý do Khác (ghi rõ):** ở cả **Hủy giữ chỗ** và **Hủy đơn**, chọn **Khác (ghi rõ)** thì hộp báo "Chưa tính được phí hủy nên chưa hủy được" và khóa nút, kể cả khi đã gõ ghi chú và bấm **Thử lại**. Chọn lý do có sẵn gần nhất (thường là **Khách đổi ý** hoặc **Không liên lạc được**). Điều cần giải thích ghi vào sổ giao ca kèm mã đơn, không ghi tên khách. Nhập nhầm hoặc trùng đơn: chọn **Khách đổi ý**, sổ giao ca ghi "OTM-… nhập nhầm".

**Khách không đến:**
1. **18:00** khách chưa đến, chưa báo giờ: gọi hoặc nhắn khách.
2. **23:00** vẫn không liên lạc được: khung đơn → **Đánh dấu không đến** → ghi **Kết quả liên lạc** (**Gọi không nghe máy**, **Khách báo đến trễ**…) → **Đánh dấu không đến**. Nút chỉ mở từ 23:00 và sau khi ghi kết quả liên lạc. **Đơn OTA: kiểm extranet trước.** Khách đã hủy trên kênh thì hủy theo kênh, không đánh dấu không đến.
3. Đơn Trực tiếp: Desk giữ **toàn bộ cọc**, hủy các đêm còn lại, mở bán lại căn. Đơn OTA: Desk tạo việc **Báo khách không đến cho …** để báo kênh.
4. Khách đến sau khi đã đánh dấu: **Khôi phục đơn không đến** (trong ngày nghiệp vụ của đêm đến, căn còn trống). Ngoài điều kiện: **Gửi yêu cầu khôi phục** cho quản lý.
5. Đơn đã trả đủ tiền phòng hoặc OTA đã thu: dù đã đánh dấu không đến, **không bán căn đó trong đêm** cho tới 06:00. Khách có thể đến sau nửa đêm.

[ẢNH: C2-13-Đánh dấu không đến]

### 2.9 Gửi link check-in online cho khách

> **Mở lại từ 06/11/2026** (bản v1.0.4). Trang khách có thông báo xử lý dữ liệu bản 2 bằng tiếng Việt, Anh, Nga, cùng nội dung với tờ **Your ID details** v2 ở quầy. Đội bảo mật đã kiểm trang khách (06/11); còn kiểm lượt đồng ý thật đầu tiên.
> - **Ai gửi:** lễ tân, lễ tân trưởng, quản lý, chủ đầu tư. Sale, CTV không cấp, không gửi link (mục 4.2).
> - **Đơn nào:** chỉ đơn **đã xác nhận**. Đơn giữ chỗ không có mục **Link check-in online**: xác nhận cọc trước.
> - Khách không làm check-in online: làm giấy tờ tại quầy như cũ (mục 2.10).
> - **Chủ đầu tư báo "dừng check-in online"** (đội có thể báo dừng khi kiểm thấy lỗi): ngừng tạo, ngừng gửi link. Mọi khách làm giấy tờ tại quầy tới khi chủ đầu tư báo mở lại. Link đã gửi: đội báo có cần thu hồi không. Chưa có lời đội thì không tự thu hồi.
<!-- Mở lại 06/11/2026 14:22 (runbook v1.0.4 N1–N5: rounds/round-04/outputs/OPS/v1.0.4-release-runbook.md; SEC N4 ĐẠT: rounds/round-04/reviews/SEC-on-v104-release-N4.md; decision-log 06/11 dòng "v1.0.4 lên production"). N6 / K11 (d): SEC đếm sau lượt đồng ý thật đầu tiên; lệch thì dừng gửi link tới khi SEC + MOB sửa. Quyền cấp link: rbac-matrix A22, A22a (OWN, MGR, FDL, FD; không SAL, CTV). Mục link chỉ hiện ở đơn đã xác nhận, với lễ tân trở lên: BUG-R3-047 đã sửa ở v1.0.4 (commit 5539b7e6, FE-B P4-40, rounds/round-04/outputs/FE/v1.0.4-fe-holds.md). Quyết định tạm dừng cũ: PO D-T4 30/10, SEC đồng ý 30/10. -->

1. Mở đơn **đã xác nhận**. Mục **Link check-in online** → **Tạo link check-in online**. (Đơn giữ chỗ không có mục này: xác nhận cọc trước.)
2. Hộp **Link check-in online · đơn …** hiện link, **mã QR của link** và hạn link. Bấm **Sao chép link**. **Link chỉ hiện một lần.** Đóng hộp là không xem lại được; cần thì **Tạo link mới** (link cũ ngừng hoạt động). **Không chụp màn hình hộp này** (mã QR là link).
3. Gửi **riêng 1–1** tới số điện thoại (Zalo), email hoặc hội thoại OTA **ghi trên đơn**, từ tài khoản của OTTIMO trên điện thoại cơ sở (mục 2.4) hoặc email của OTTIMO. Không gửi vào nhóm chat. Không kèm mã cửa hay số căn. Người nhắn từ số hoặc tài khoản khác, dù xưng là khách: không gửi; gửi tới liên hệ trên đơn, hoặc mời làm thủ tục tại quầy. Đơn CTV: gửi khách, không gửi CTV.
4. Khách mở link trên điện thoại: đọc thông báo xử lý dữ liệu (**Tôi đã đọc**) → **Giấy tờ** (chọn CCCD/Hộ chiếu rồi **Chụp**, hoặc **Bổ sung tại quầy**) → **Giờ đến** → **Xác nhận** (đồng ý lưu ảnh hay không) → **Gửi thủ tục**.
5. Khi khách gửi xong, **Hôm nay** ghi **Đã làm thủ tục trước**. Lúc khách đến, lễ tân chỉ đối chiếu bản gốc.
6. **Gửi nhầm người** (tới số, email hay tài khoản không phải của khách trên đơn):
   - **Thu hồi link** ngay (Desk hỏi lại; người mở link sẽ thấy "Liên kết đã hết hạn"). Rồi **Tạo link mới**, gửi đúng khách.
   - Ghi sổ giao ca: mã đơn, giờ gửi nhầm, giờ thu hồi, kênh đã gửi. Không ghi tên khách. Không ghi tên hay số của người nhận nhầm.
   - Báo chủ đầu tư **trong ngày**.
   - Trước giờ thu hồi, đơn đã hiện **Đã làm thủ tục trước**, giờ đến mới hoặc yêu cầu mới mà khách thật nói mình chưa gửi: không dùng giấy tờ đó để khai báo; khách đến thì đối chiếu bản gốc như mọi khách; ảnh không phải của người trên đơn thì không **Gắn người**, quản lý **Xóa ảnh** (mục 2.11); báo chủ đầu tư **ngay trong ca**.
   - Vì sao: người nhận nhầm thấy tên gọi của khách, mã đơn, ngày ở, căn, giờ đến, và ghi được vào đơn tới lúc thu hồi. Chủ đầu tư cùng đội bảo mật quyết có phải báo cơ quan chức năng hay không.
   - Không báo khách hay người nhận nhầm, trừ khi đội bảo mật đề nghị.

[ẢNH: C2-14-Link check-in online]

Trang khách tiếng Anh dẫn, có tiếng Việt; thông báo xử lý dữ liệu có thêm tiếng Nga. Trong lúc ở, khách xem nội quy và gửi yêu cầu (khăn, dọn thêm, báo hỏng, trả muộn). Wi-Fi trên trang khách chưa hiện (mục 1.4, lỗi đang sửa; trang ghi "hỏi lễ tân"): khách xem thẻ Wi-Fi trong căn.

> **Lỗi nhỏ đã biết:**
> - Trang khách hiện câu "Ngôn ngữ theo trình duyệt của bạn" cả khi ngôn ngữ lấy theo hồ sơ khách. Không ảnh hưởng.
> - Khách chọn **Bổ sung tại quầy** rồi đóng và mở lại link giữa chừng: bấm **Gửi thủ tục** không được, trang quay về bước Giấy tờ mà không báo gì. Khách gặp vậy thì mời khách làm giấy tờ tại quầy khi đến.

### 2.10 Nhận phòng

**Giờ nhận phòng** (từ ngày chủ đầu tư chuyển giá, bảng giá 01/11):

| Khách vào căn lúc | Desk tính |
|---|---|
| Từ **11:00** (căn đã sạch hoặc đã kiểm – `VC`/`VI`) | **Không phụ thu** |
| **10:00–10:59** | Phụ thu **30 %** giá đêm đầu |
| **06:00–09:59** | Phụ thu **50 %** giá đêm đầu |
| Trước **06:00** | Không phải phụ thu: Desk **thêm đêm trước** (tiền phòng 1 đêm) |

- Ví dụ Studio 800.000: nhận 11:00 → 0; 10:30 → 240.000; 08:00 → 400.000. Sau ngày chuyển giá Desk còn tính phụ thu cho giờ 11:00–11:59: báo quản lý.
- Câu nói với khách: "Check-in is from 12:00. Your room is always ready by 14:00." / "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00." **Không** hứa "phòng sẵn sàng từ 12:00". Không phụ thu từ 11:00 là việc lễ tân làm khi căn đã sẵn sàng, không hứa trước với khách.
- Khách tới 12:00–14:00 mà căn chưa xong: giữ hành lý, mời chờ ở sảnh hoặc đi dạo, hẹn giờ. Không phụ thu, không giảm giá. Gửi hành lý không tính phụ thu.
- Quá 14:00 vẫn chưa xong: báo lễ tân trưởng hoặc quản lý đổi căn sẵn sàng hoặc nâng hạng.
- Đơn OTA: phụ thu nhận sớm/trả muộn tính trên giá Trực tiếp hiện hành của đêm đó, **chỉ khi chủ đầu tư đã đăng giờ nhận/trả và mức phụ thu trong nội quy của kênh đó** (xem khung bên dưới).

> **Tạm ở v1.0 – khách đặt qua Booking.com, Agoda, Airbnb:** chỉ thu phụ thu nhận sớm khi chủ đầu tư đã báo kênh đó đổi giờ nhận phòng 12:00 trong nội quy. Kênh chưa đổi: vẫn ghi giờ nhận thật, chọn **Xin miễn phụ thu (gửi duyệt)**, lý do "Kênh OTA chưa đăng phụ thu", báo quản lý. Lễ tân trưởng giữ danh sách kênh đã đăng do chủ đầu tư báo.

**Các bước:**
1. **Hôm nay → Khách đến → Nhận phòng** (hoặc khung đơn → **Nhận phòng**). Desk mở **Nhận phòng · Căn … · …**.
2. Đọc **Điều kiện nhận phòng**. Mỗi dòng **Đã đủ** hoặc **Còn thiếu**:
   - **Đơn đã được gán căn**
   - **Số khách không vượt sức chứa căn**
   - **Buồng sẵn sàng (VI hoặc VC)**
   - **Đã thu đủ hoặc OTA đã trả/đảm bảo**
   - **Có giấy tờ người đứng tên**
   - **Giấy tờ khách nước ngoài hợp lệ tại ngày nhận**
3. **Bước 1 – Giấy tờ.** **Trước khi nhận giấy tờ**, chỉ khách tờ **Your ID details** trên quầy (mục 0.8 điểm 4). Bắt đầu với **người đứng tên**.
   - Khách đã gửi ảnh qua link: dòng ghi **Khách đã gửi trước qua app** và **Cần nhập thông tin** (ảnh chưa có số liệu). Bấm **Sửa** (nhập lại mật khẩu, hiệu lực 15 phút), chọn **Người trong đoàn** (phải chọn lại; người chưa có trong đơn thì chọn **Người ở chưa có trong đơn**), **Loại giấy tờ**, rồi gõ số, họ tên, ngày sinh, giới tính, quốc tịch, hạn, diện nhập cảnh… từ ảnh và bản gốc → **Lưu giấy tờ**.
   - Chưa có giấy tờ: **Chụp hoặc tải ảnh giấy tờ**, hoặc **Nhập tay** → điền → **Lưu giấy tờ**.
   - Người đi cùng bổ sung được trước hạn khai báo. Bấm **Tiếp tục: Kiểm tra**.
4. **Bước 2 – Kiểm tra.** Desk tự kiểm tên khớp đơn, hạn hộ chiếu, thị thực, đủ giấy tờ. Dòng **Chưa kiểm được**: xem giấy tờ gốc, bấm **Tôi đã kiểm – Đạt** hoặc **Tôi đã kiểm – Không đạt**, ghi **Cách xử lý** và bấm **Lưu** ở từng dòng (**kể cả khi Đạt**). Thiếu thì Desk báo "Ghi cách xử lý cho mọi mục…". Bấm **Tiếp tục: Khai báo**.
5. **Bước 3 – Khai báo.** Desk hiện loại khai báo (**Thông báo lưu trú công dân Việt Nam** hoặc **Khai báo tạm trú người nước ngoài**) và **hạn**. Chọn **Khai báo ngay** (làm theo mục 2.11), hoặc bấm **Khai báo sau (thêm vào việc cần làm)** – Desk sang luôn bước 4.
6. **Bước 4 – Giao mã & hoàn tất:**
   - **Giờ nhận & phụ thu**: mặc định "Nhận từ 12:00 – không phụ thu". Khách vào trước 12:00: bật **Khách nhận sớm**, chỉnh **Giờ nhận thực tế** (giờ khách vào căn). Desk hiện **Phụ thu nhận sớm đề xuất**. Báo khách, tích **Tôi đã báo khách khoản phụ thu này**. Khách xin miễn: **Xin miễn phụ thu (gửi duyệt)**, chọn lý do.
   - **Thu tiền trước khi giao mã**: Desk hiện **Cần thu để nhận phòng** (phần còn lại của đơn Trực tiếp, phụ thu nhận sớm). Thu theo mục 2.13.
   - **Mã cửa**: tạo trên app khóa theo khung "Mã cửa" bên dưới. Chỉnh **Số thẻ phòng đã giao** bằng nút −/+ (1–2 thẻ).
   - Tích **Đã gửi/giao nội quy (VI/EN) cho khách** (bắt buộc). Tích **Đã giao mã cửa/thẻ cho khách** nếu đã giao.
7. Đọc khối **Khi bấm Nhận phòng**. Bấm **Nhận phòng căn …**. Hộp **Nhận phòng căn … cho …?** nhắc lại hạn khai báo, phụ thu, khoản thu: bấm **Nhận phòng căn …** (hoặc **Không, quay lại**). Khoản thu được ghi **cùng lúc** với nhận phòng; nhận phòng không thành thì không ghi tiền.
8. Desk về khung đơn, đơn chuyển **Đang ở**, buồng chuyển **Có khách, sạch**. Giờ mới được giao mã cửa (khung bên dưới).

[ẢNH: C2-15-Nhận phòng, điều kiện và bước Giấy tờ]
[ẢNH: C2-16-Nhận phòng, bước Kiểm tra]
[ẢNH: C2-17-Nhận phòng, bước Khai báo]
[ẢNH: C2-18-Nhận phòng, giờ nhận và phụ thu nhận sớm]
[ẢNH: C2-19-Nhận phòng, thu tiền]
[ẢNH: C2-20-Nhận phòng, mã cửa và hoàn tất]

**Trường hợp đặc biệt:**
- **Căn chưa sẵn sàng** (`VD`, `CL`): lễ tân gửi **Gửi lễ tân trưởng xác nhận** kèm **Lý do**. Lễ tân trưởng tự xác nhận được; buồng chuyển "Có khách, cần dọn" và có việc dọn gấp.
  - **Trước khi gửi hoặc xác nhận:** kiểm căn (hoặc hỏi buồng phòng) thật sự không còn người, không còn đồ của khách, nhất là căn có khách **đổi phòng** trong hôm nay mà chưa chuyển xong. Còn người hoặc đồ: không xác nhận; chờ khách chuyển xong, hoặc đổi đơn mới sang căn trống khác.
  - **Lý do** ghi: "Đã kiểm căn trống lúc hh:mm, người kiểm: <tên nhân viên>". Không ghi tên hay thông tin của khách.
  - Trước khi giao mã căn này: trên app khóa, kiểm căn không còn mã nào khác còn hạn.
- **Căn còn khách: không có ngoại lệ, kể cả lễ tân trưởng.** Gồm căn đang có khách (`OC`, `OD`) và căn **còn đơn khác đang ở**, dù buồng hiện trạng thái nào.
  - Từ v1.0.4 Desk chặn: dòng **Buồng sẵn sàng (VI hoặc VC)** hiện khung đỏ, không có ô **Lý do**, chỉ có nút **Đổi căn / đổi ngày**. Nút này chỉ mở khung đơn: bấm **Đổi căn / đổi ngày** lần nữa trên khung đơn (mục 2.8). Tới v1.0.3 Desk vẫn cho gửi xác nhận: đừng gửi.
  - Đọc câu trong khung đỏ, làm theo đúng ca:
    1. "Căn … còn đơn OTM-… đang ở, chưa trả phòng. …" (hoặc "… còn đơn khác đang ở …", không có mã): mở đơn đó. Có mã thì gõ mã vào ô tìm ở **Đơn đặt phòng**; không có mã thì bấm căn trên **Sơ đồ phòng**.
       - Khách cũ đã đi: kiểm căn rồi **Trả phòng** đơn đó (hay gặp nhất). Đơn đã quá ngày đi thì Desk không có nút **Trả phòng**: làm theo mục 2.14, **Đơn quá ngày đi**.
       - Khách cũ còn ở: giữ hành lý, mời khách mới chờ, hoặc **Đổi căn / đổi ngày** cho khách mới sang căn trống (mục 2.8).
    2. "Căn … vẫn hiện có khách, nhưng không còn đơn nào đang ở. …" (đơn trước đã **Đã trả phòng** mà căn vẫn hiện có khách): **không** nhận khách vào căn này. Desk và app nhân viên chưa có nút sửa trạng thái này, chờ 07:00 cũng không tự hết. Xếp khách sang căn trống sẵn sàng khác (**Đổi căn / đổi ngày**; cùng hạng, không có thì nâng hạng, OTTIMO chịu chênh) và **báo quản lý ngay**. Quản lý nhắn đội kỹ thuật số căn và mã đơn trước để sửa trạng thái căn. Không còn căn nào: quản lý gọi đội trong ca, khách chờ ở sảnh, giữ hành lý. **Không** dùng **Khóa phòng** (OOO) để đặt lại trạng thái: cách đó ghi sai công suất phòng.
       - **Từ v1.0.5** (V5-15; khi chủ đầu tư báo đã lên) không phải báo đội sửa trạng thái. Kiểm căn đã trống thật (không còn người, không còn đồ), rồi **Vận hành → Buồng phòng → Trạng thái buồng** → dòng căn đó → **Báo cần dọn**. Căn chuyển **OD · Có khách, cần dọn** và có việc dọn. Buồng phòng **Bắt đầu dọn** → **Dọn xong** thì căn thành **VC · Đã dọn, chờ kiểm** và nhận phòng được. Khách không chờ được thì đổi đơn sang căn trống như trên.
       - Câu báo bảo "nhờ buồng phòng dọn căn này" (căn đã là **OD · Có khách, cần dọn**, nên không có nút **Báo cần dọn**): kiểm căn đã trống, nhờ buồng phòng dọn. Dọn xong là nhận phòng được. Trường hợp này không có ngoại lệ nhận phòng.
- **Căn khóa sửa chữa** (OOO): **không bao giờ** nhận phòng được.
<!-- SEC FB-R4-SEC-BE-PR74-02 (Minor, mã sửa v1.0.5): ngày khách về căn cũ (B14 stayScope until_parent_departure) mà chưa ghi "đã chuyển về" thì căn tạm không có holder, lên VD/CL là mở được ngoại lệ. Desk và app trên main chưa có nút chọn "chuyển tới hết đơn gốc" lẫn nút ghi "đã chuyển về" (roomReturnRecorded chỉ có ở API), nên sổ tay dùng bước kiểm căn thật, không nói "ghi đã chuyển về". Có nút thì BA thêm bước ghi. -->
<!-- BA 05/11: #74 (máy chủ) và #77 kèm #79 (Desk, gộp main c9af9f4c) đã vào v1.0.4. Câu chặn theo UXD lượt 4: OOO → ci.ooo_never; căn còn lượt ở khác → checkin.room_held_code (có mã) hoặc checkin.room_held; OC/OD không còn lượt ở → checkin.room_status_stuck; checkin.room_occupied chỉ hiện khi máy chủ không gửi cause (trước #74). QA2 #77 @ 055e92d5: lượt quá ngày đi + CL cũng ra room_held_code; VD/CL không còn lượt ở giữ ngoại lệ. Đơn chưa gán căn không có câu chặn căn; #84 (BUG-R4-049) bỏ thêm dòng phụ buồng/sức chứa khi chưa gán căn, sổ tay không tả dòng phụ nên không đổi. Ca 2 trong khung đỏ (trước 05/11 là bước (3)) theo DOM lượt 7 mục 3; 05/11 tách theo từng ca theo UXD #72 thẻ 01, thêm Lý do ghi đã kiểm và kiểm mã cũ trên app khóa theo SEC #72 thẻ 02: v1.0.4 không có nút đưa căn khỏi OC (needs_cleaning chưa có giao diện); nút Cần dọn ở backlog v1.0.5 (PO xếp), có nút thì BA thêm lại bước dọn. -->
- **Khách nhận trước 06:00**: Desk hiện "Khách nhận trước 06:00 – thêm đêm …: … Đây là tiền phòng, không phải phụ thu." Bấm **Thêm đêm và nhận phòng**. Đêm trước đã có khách thì chưa nhận được trước 06:00: nhận từ 06:00 hoặc đổi căn trống.
- **Vượt sức chứa**: **Đổi sang căn đủ chỗ** hoặc **Sửa số khách thực tế** sau khi hỏi khách.
- **Giấy tờ nước ngoài hết hạn hoặc thiếu dấu nhập cảnh**: lễ tân trưởng trở lên xác nhận nhận tiếp (ghi lý do, cách xử lý); quản lý nhận thông báo.
- **Bộ đồ dùng thêm** (khách vượt định mức ngủ sofa) chưa chuẩn bị: vẫn nhận phòng được; việc đã lên đầu hàng đợi buồng phòng.
- **Nhận nhầm**: **Hoàn tác nhận phòng** (chỉ quản lý, trong ngày, khi folio chưa có dòng mới). Lỗi đang sửa: nút vẫn hiện cả khi folio đã có dòng mới (ví dụ đã thu tiền); bấm thì Desk từ chối. Khi đó quản lý bỏ các dòng mới (**Folio & điều chỉnh** → **Điều chỉnh** → **Bỏ cả dòng**) và đảo khoản thu mới (**Giao dịch thu** → **Đảo giao dịch**) trước (mục 1.11), rồi mới hoàn tác.
- Mất mạng giữa chừng: Desk không lưu tạm. Chờ mạng; khách chờ lâu thì ghi sổ giấy, nhập bù khi có mạng.

**Mã cửa:**

> **Tạm ở v1.0:** mã cửa vẫn tạo trên app khóa **ngoài Desk** (quản lý mã trên app có ở v1.1). Desk **không lưu mã cửa**. Desk chỉ ghi đã giao mã/thẻ lúc nào, ai giao. Khi trả phòng hoặc đổi phòng, Desk tạo việc "Xóa mã trên app khóa" để nhắc.
> - App khóa chỉ cài trên **điện thoại hoặc máy tính bảng của cơ sở**, không cài trên điện thoại cá nhân. Tài khoản quản trị app khóa do chủ đầu tư giữ. Lễ tân dùng tài khoản được ủy quyền riêng nếu app khóa cho phép.
> - Mỗi lượt ở **một mã ngẫu nhiên mới** (app khóa tạo). Không dùng ngày sinh, số điện thoại, số căn, mã cũ – kể cả khi chữ gợi ý trên màn Desk nhắc mã theo ngày sinh. Luôn đặt **hạn trên khóa** tới giờ trả phòng (trả muộn đã hẹn thì tới giờ đó).
> - Trả phòng, đổi phòng, khách rời sớm, hủy, không đến: **xóa mã ngay**.
<!-- [GIẢ ĐỊNH – chờ INV xác nhận] (SEC FB-R3-SEC-BA-05): app khóa đang cài trên điện thoại/máy tính bảng của cơ sở. Nếu đang trên máy cá nhân, chuyển trước 02/11. Chữ trên màn (ci.door_step1 "6 số", ci.door_step3 mã theo ngày sinh) lệch BR-403 – UXD sửa ở bản vá sau; sổ tay cố ý không ghi số chữ số. -->

**Giao mã cửa** – chỉ khi đơn đủ điều kiện nhận phòng: **đã nhận phòng trên Desk**, có giấy tờ người đứng tên, đã thu đủ (đơn Trực tiếp). Mã cửa **không gửi bằng chữ hay ảnh qua bất kỳ kênh nào** (Zalo, Messenger, WhatsApp, SMS, email, hộp thư OTA…), kể cả gõ tay. Hai cách giao:
- **Tại quầy**: đọc nhỏ hoặc cho khách xem màn app khóa. Không đọc to khi có người khác đứng gần.
- **Gọi điện**: lễ tân **tự gọi ra** số điện thoại **đã có trên đơn từ trước hôm nay** (hoặc số kênh OTA cung cấp). Chỉ đọc khi người nghe xác nhận đúng **họ tên người đứng tên và ngày đến**. Không để lại lời nhắn thoại. Không đọc cho người nghe hộ.
- **Không** đọc mã trong cuộc gọi khách gọi đến, kể cả khi người gọi nói đúng tên và mã đơn: cúp máy, gọi lại số trên đơn.
- Khách xin đổi số điện thoại trong ngày đến: **không** gọi số mới để đọc mã. Mời khách ra quầy, đối chiếu giấy tờ rồi mới sửa số.
- Nghi ngờ (người khác xin mã thay khách, khách đòi gấp, số lạ): không giao, báo quản lý.

> **Lỗi nhỏ đã biết (v1.0.3 hoặc v1.0.4):** chip **Cần nhập thông tin** / **Đã có** đè nút **Xem đủ số / ảnh**. Thu nhỏ trang (Ctrl và dấu trừ) nếu cần bấm.

### 2.11 Giấy tờ và khai báo lưu trú

**Hạn khai báo:**

| Khách | Hạn |
|---|---|
| Công dân Việt Nam | Trước **23:00** ngày đến. Đến 23:00–23:59: trước **08:00** sáng hôm sau. Đến 00:00–05:59: Desk đếm tới 23:00 cùng ngày, nhưng OTTIMO khai **ngay trong ca, muộn nhất 08:00 sáng** |
| Người nước ngoài | Trong **12 giờ** tính từ giờ nhận phòng |

Hồ sơ sắp hạn và quá hạn hiện ở **Cần chú ý** và cột **Hạn khai báo**.

**Khai báo:**
1. **Vận hành → Giấy tờ & khai báo**. Tab **Cần xử lý**, **Cần cập nhật ngày đi**, **Tất cả**. Cột **Hạn khai báo** đếm ngược, đỏ khi quá hạn.
2. Nút ở mỗi dòng theo trạng thái: **Nhập giấy tờ** (thiếu giấy tờ) · **Mở** (cần kiểm tra, thiếu người) · **Khai báo** (đủ giấy tờ, chờ khai báo – sau khi đã **Đối chiếu xong**).
3. **Khối 1 · Đối chiếu và đồng ý lưu ảnh**: kiểm từng người. Khách đã xem tờ **Your ID details** trước khi đưa giấy tờ. Hỏi từng người lớn có chụp ảnh giấy tờ (câu ở mục 0.8 điểm 4) và chọn **Đồng ý lưu ảnh** hoặc **Không đồng ý – xóa ảnh sau khi khai báo**. Bấm **Đối chiếu xong**.
4. **Khối 2 · Sao chép lên cổng khai báo**: không mở cổng hay dán dữ liệu khi khách khác đang đứng nhìn màn hình. Bấm **Hiện dữ liệu khai báo** (nhập lại mật khẩu). Mở cổng khai báo của Bộ Công an trên cùng máy. Bấm **Sao chép** từng ô theo đúng thứ tự trên cổng, dán vào cổng. Ô ghi "Không có – để trống trên cổng" thì để trống. Dán xong bấm **Xóa bộ nhớ tạm**.
5. Gửi trên cổng. Cổng trả **mã hồ sơ**.
6. **Khối 3 · Ghi kết quả từ cổng**: dán **Mã hồ sơ**, bấm **Đã gửi khai báo**. Khi cổng xác nhận: **Cổng đã xác nhận**. Cổng từ chối: **Cổng từ chối** → ghi **Lý do cổng từ chối**; hồ sơ trở về chờ khai báo để sửa và khai lại.

[ẢNH: C2-21-Giấy tờ và khai báo, danh sách]
[ẢNH: C2-22-Khai báo, ba khối]

- Dữ liệu tự ẩn sau vài phút hoặc khi rời tab. Không dán dữ liệu khai báo vào chỗ khác ngoài cổng.
- Khách nước ngoài **gia hạn, trả sớm hoặc trả phòng**: hồ sơ hiện ở tab **Cần cập nhật ngày đi**. Cập nhật trên cổng trong ngày. Trừ đơn quá ngày đi mà khách đã đi (mục 2.14, **Đơn quá ngày đi**, trường hợp (b)): ngày đi trên cổng là ngày khách đi thật, không dán ô ngày đi Desk hiện.
- Đổi phòng không phải khai báo lại; chỉ đổi số căn trong hồ sơ.
- **Giấy tờ khách gửi qua link chưa gắn người** (thường do có người rời đoàn): mở đơn, bấm **Gắn người**, chọn đúng người. Không gắn thì giấy tờ tự xóa theo giờ Desk ghi.
- Khách xin xóa sớm ảnh: chỉ quản lý, chủ đầu tư làm (**Xóa ảnh**). Lễ tân chuyển yêu cầu cho quản lý.

### 2.12 Trong lúc khách ở

**Thêm dịch vụ, phát sinh vào folio** (bảng tiền của lượt ở):
1. Khung đơn → **Thêm phát sinh**.
2. **Khoản**: **Dọn phòng lẻ**, **Giặt ủi (theo kg)**, **Khử mùi thuốc lá**, **Mất/hỏng thẻ phòng**, các món hư hỏng theo bảng giá (ví dụ **Khăn tắm**, **Ly**, **Remote**), **Đồ ăn uống**, **Dịch vụ khác** (hai khoản cuối nhập giá).
3. **Số lượng**, **Ghi chú**. Khoản phạt (thuốc lá, thẻ, hư hỏng) cần **Ảnh hoặc ghi chú bằng chứng**; nên kiểm đã gửi nội quy cho khách.
4. Bấm **Thêm vào folio**.

[ẢNH: C2-23-Thêm phát sinh]

> **Lỗi nhỏ đã biết (sửa ở v1.0.4):** câu "Phí phạt không tính vào doanh thu phòng" hiện cả khi chọn giặt ủi. Giặt ủi không phải phí phạt; cứ thêm như thường.

**Thêm người đi cùng:** khung đơn → mục **Người ở** → **Thêm người đi cùng** → chọn **Người lớn đi cùng** hoặc **Trẻ em** (trẻ chỉ cần **Năm sinh**). Ô chọn người hiện nhãn "Khách đứng tên" – nhãn nhầm, đang sửa; chọn đúng người đi cùng. Vượt định mức: Desk hiện phụ thu người (từ 6 tuổi trở lên 150.000 đ/đêm, dưới 6 tuổi miễn; Desk hiện 100.000 cho trẻ 6–11 tuổi thì báo quản lý, không tự sửa) → báo khách → tích **Ghi phụ thu … vào folio – tôi đã báo khách** → **Thêm vào đơn**. Nhớ báo buồng phòng chuẩn bị bộ đồ dùng thêm (Desk tự tạo việc).

[ẢNH: C2-24-Thêm người đi cùng]

**Gia hạn:**
1. Khung đơn → **Gia hạn**. Chọn số đêm **Ở thêm** (chỉ đêm còn **Trống**; tối đa 7 đêm liên tiếp).
2. Desk tính tiền. Từ ngày chủ đầu tư chuyển giá không còn giảm theo số đêm: sửa giá đêm thêm thì gõ đúng giá đã chốt với khách.
3. Đơn OTA: phần gia hạn thành đơn con kênh Trực tiếp, chung phiếu thanh toán.
4. Bấm **Gia hạn … đêm · …**. Nhớ kéo dài hiệu lực mã cửa trên app khóa. Khách nước ngoài: cập nhật khai báo trong ngày. Trừ đơn quá ngày đi mà khách đã đi (mục 2.14, **Đơn quá ngày đi**, trường hợp (b)): không kéo dài mã, không khai ngày gia hạn lên cổng.
5. Desk chưa có ô thu tiền khi gia hạn và chưa có nút ghi thu giữa kỳ ở. Ghi vào sổ giao ca: mã đơn, số đêm gia hạn, số tiền. Thu ở bước **Bill & thu tiền** khi trả phòng. Khách gia hạn dài hoặc chưa trả các đêm trước: báo quản lý.
6. **Đơn dài hạn nhập tay (HĐ thuê tháng):** **trước khi bấm Gia hạn**, ghi "OTM-…: HĐ kết thúc dd/mm/yyyy, gia hạn tới dd/mm/yyyy" vào bảng kỳ thu (dòng của căn) và sổ giao ca, lấy ngày từ HĐ giấy. Ở v1.0.3, Desk dời **Ngày ra (theo HĐ)** sang ngày cuối gia hạn và không giữ ngày kết thúc HĐ. **Từ v1.0.4** Desk giữ ngày kết thúc HĐ và **Trả sớm** chọn nhánh theo ngày này: không cần ghi vào sổ giao ca trước khi gia hạn nữa; bảng kỳ thu vẫn giữ cột ngày kết thúc HĐ (mục 2.14a). Ngày ở thêm tính theo HĐ: tiền thuê tháng ÷ 30 (làm tròn 1.000) × số ngày + phí dịch vụ 200.000 × số ngày ÷ 30; Desk không ghi dòng tiền cho phần này – thu và ghi sổ kế toán như tiền thuê.
7. **Đơn kênh Nội bộ cần ở thêm (áp dụng ngay, tới khi chủ đầu tư báo v1.0.4 đã lên): không bấm Gia hạn.** Desk tính đêm gia hạn của đơn Nội bộ theo giá Trực tiếp thay vì 0 đ, và không cho sửa về 0 (BUG-R4-038, sửa ở v1.0.4). Thay vào đó tạo một đơn Nội bộ mới 0 đ cho các đêm thêm. **Từ v1.0.4:** bấm **Gia hạn** như đơn khác; Desk ghi đêm thêm của đơn Nội bộ 0 đ (gõ giá > 0 nếu có thu).
   - **Tạo đơn nối tiếp** (mục 2.5): cùng căn, **Ngày đến** là ngày đi của đơn đang ở, **Ngày đi** là ngày đi mới, kênh **Nội bộ**, cùng người đứng tên và số khách. Ô **Ghi chú nội bộ**: "Ở tiếp OTM-… (thay Gia hạn)". Ngay trước khi bấm **Tạo đơn**, **xóa trống mọi ô Giá mỗi đêm** (không gõ 0 – Desk báo lỗi). Mở hộp từ **Sơ đồ phòng** thì Desk điền sẵn giá Trực tiếp, và chuyển sang **Nội bộ** vẫn giữ các số đó (BUG-R4-037). Tạo xong, mở khung đơn: mục **Folio** phải ghi **Tiền phòng (… đêm) 0** và **Còn phải thu 0**. Khác 0: **Hủy đơn** vừa tạo (chưa nhận phòng, chưa thu tiền), tạo lại đúng cách trên. Ghi sổ giao ca: "OTM-… ở tiếp bằng đơn OTM-…, tới dd/mm".
   - **Căn không còn trống từ ngày đi** (Desk báo kín dưới ô ngày): tạo đơn nối tiếp ở một căn khác còn trống. Người ở chuyển căn vào ngày đi của đơn cũ: trả phòng đơn cũ như thường (thu thẻ, xóa mã căn cũ), nhận phòng đơn mới và giao mã căn mới. Căn chỉ trống một phần các đêm: tạo đơn cho các đêm còn trống. Không còn căn nào trống: báo quản lý.
   - **Vào ngày đi của đơn cũ, trước 18:00 (nên làm đầu ca sáng, trước 12:00):** **Trả phòng** đơn cũ trước (mục 2.14), rồi mới **Nhận phòng** đơn mới. Desk chỉ cho nhận phòng đơn mới từ ngày đến của đơn đó. **Không** nhận phòng đơn mới khi đơn cũ còn **Đang ở**, kể cả bằng xác nhận ngoại lệ buồng chưa sẵn sàng. Trả phòng sau 18:00 thì Desk tính phụ thu bằng một đêm giá Trực tiếp (cùng lỗi).
   - **Trả phòng đơn cũ khi ở tiếp cùng căn:** người ở không đi. Không thu thẻ, không xóa mã cửa: kéo dài hiệu lực mã tới ngày đi mới trên app khóa. Hộp **Hoàn tất trả phòng** có câu "xóa mã trên app khóa": khi ở tiếp cùng căn thì **không** xóa. Minibar, phát sinh làm như thường. Desk chuyển căn sang **Trống, cần dọn** và tạo việc dọn: báo buồng phòng người ở vẫn ở, dọn như căn đang có khách. Buồng phòng có thể thấy 2 việc dọn cho căn này (dọn trả phòng, dọn gấp): dọn **một lần** như căn có khách, rồi bấm xong cả hai.
   - **Nhận phòng đơn mới:** đủ các bước như mục 2.10. Giấy tờ không mang từ đơn cũ sang: nhập lại giấy tờ người ở. Khai báo theo bước **Khai báo** (mục 2.11). Căn đang **Trống, cần dọn** nên dòng **Buồng sẵn sàng** báo **Còn thiếu**: lễ tân bấm **Gửi lễ tân trưởng xác nhận**, lý do "Ở tiếp OTM-…, cùng người"; lễ tân trưởng tự xác nhận được (mục 2.10). Buồng phòng đã dọn xong (căn `VC` hoặc `VI`) trước lúc nhận phòng thì nhận như thường, không cần lễ tân trưởng. Cùng căn thì dùng mã cửa đã kéo dài. Người ở vắng lúc trả phòng đơn cũ: vẫn trả phòng đơn cũ buổi sáng; nhận phòng đơn mới khi người ở về với giấy tờ, trong ngày, và ghi sổ giao ca trong khoảng giữa.
   - **Đã lỡ bấm Gia hạn đơn Nội bộ:** không thu tiền người ở; báo quản lý trước khi trả phòng. Desk chưa có cách gỡ; đội kỹ thuật sẽ báo cách gỡ khi sửa.
<!-- DOM: Mốc thu "muộn nhất 14:00 ngày đầu phần gia hạn" (BR-423, giả định chờ INV) chưa làm được trên Desk v1.0 – DOM xem lại. -->

[ẢNH: C2-25-Gia hạn]

**Đổi phòng khi đang ở:**
1. Khung đơn → **Đổi phòng**.
2. **Vì sao đổi?**: **Sự cố của OTTIMO – giữ giá cũ** hoặc **Khách yêu cầu – giá căn mới**. Ghi **Lý do đổi**.
3. **Căn mới (đã dọn hoặc đã kiểm)**: chọn căn. Căn nhóm cao hơn cần lễ tân trưởng xác nhận.

> **Lỗi đang sửa (sửa ở v1.0.3 hoặc v1.0.4):** danh sách **Căn mới** có thể lẫn căn **chưa dọn** (`VD`). Chọn căn đó thì Desk báo và không lưu gì. **Trước khi chọn, mở Buồng phòng hoặc Sơ đồ phòng kiểm căn đó đang `VC` hoặc `VI`.** Không đổi khách sang căn `VD`.
4. Bấm **Đổi sang căn …** khi khách đã sẵn sàng chuyển. Rồi:
   - Nhờ buồng phòng đếm minibar căn cũ **ngay, trước khi dọn**, báo **số còn lại từng món**. Ghi sổ giao ca: "OTM-… đổi 202 → 203 lúc hh:mm dd/mm – minibar 202 còn: Bia Đà Lạt 0/2, snack 1/1 (người đếm)". Không ghi tên khách. **Không** ghi minibar căn cũ bằng **Thêm phát sinh**: lúc trả phòng, Desk hỏi tủ căn cũ và tính tiền một lần (mục 2.14 bước 2). Báo buồng phòng **bổ sung đủ tủ căn cũ** khi dọn, trước khi căn đó nhận khách mới.
   - Thu thẻ căn cũ, ghi số thẻ trả. **Xóa mã căn cũ trên app khóa.** Giao mã/thẻ căn mới.
   - Bộ đồ dùng thêm: Desk tự tạo việc chuyển. Căn cũ có việc dọn: buồng phòng chỉ dọn khi khách đã ra hết đồ.
   - Đổi do sự cố: khách giữ giá cũ. Muốn bù thêm thì dùng miễn phí, lý do **Bù sự cố**.

[ẢNH: C2-26-Đổi phòng]

**Xác nhận giờ trả** (ngày khách đi): **Hôm nay → Khách đi → Xác nhận giờ trả**, hoặc nút **Xác nhận giờ trả** trên khung đơn **Đang ở** → nhập giờ khách báo (ô ghi nhầm "Giờ trả phòng thực tế" – đang sửa), **Khách trả lời qua** (**Gọi điện**, **Tại quầy**, **Zalo**). Giờ sau 12:00 là trả muộn: dùng **Trả muộn**.

[ẢNH: C2-28-Xác nhận giờ trả]

**Yêu cầu của khách** (từ trang khách, hiện trên **Hôm nay**): **Đã nhận** → làm hoặc chuyển bộ phận → **Làm xong**. Không làm được: **Không thực hiện được** → **Lý do (khách thấy)**. **Lời nhắn cho khách**: khách đọc được, không ghi mã cửa, số giấy tờ, số điện thoại, số thẻ. Yêu cầu có phí ghi vào folio khi xong.

[ẢNH: C2-29-Yêu cầu của khách]

**Miễn phí, giảm giá:**
1. Trong folio (**Folio & điều chỉnh**), ở dòng cần miễn: **Mở form miễn phí / giảm giá**. Hộp **Miễn phí · <dòng> · <số tiền>** mở ra.
2. Dòng phát sinh: Desk để miễn phí (FOC). Dòng tiền phòng: có ô **Loại**, mặc định **Miễn khoản phát sinh (FOC)** – chọn **Giảm giá đặc biệt (tiền phòng)**, trừ đêm bù sự cố của OTTIMO (để FOC, lý do **Bù sự cố**). Nhập **Số tiền miễn** (tối đa phần còn lại của dòng), **Lý do miễn phí** (**Khách quen / VIP**, **Phòng sẵn sàng, không ảnh hưởng khách sau**, **Bù sự cố**, **Khách dài hạn**, **Khác (ghi rõ)**).
3. Minibar trong mức tự miễn của lễ tân (≤ 100.000 đ/lần, ≤ 500.000 đ/tháng): nhập lại mật khẩu → **Tự áp miễn phí**.
4. Còn lại: **Gửi duyệt**. Yêu cầu tự đến người có quyền. Folio ghi dòng miễn **Chờ duyệt**.
5. Theo dõi kết quả trên folio (**Đã áp**, **Bị từ chối**). Lỗi đang sửa: ở màn Trả phòng, dòng miễn **Bị từ chối** vẫn hiện số âm – số đó **không** được trừ; đọc **Còn phải thu** để biết số đúng.
<!-- FE xác nhận (QA M42): hộp từ dòng phụ thu không có ô Loại – BA suy từ mã (foc.tsx kind theo dòng); dòng tiền phòng có ô Loại, chọn sẵn FOC (foc.tsx useState('foc'); DOM #72 thẻ 03, UXD #72 thẻ 02). BUG-R3-030. -->

[ẢNH: C2-30-Miễn phí, giảm giá]

### 2.13 Thu tiền

| Cách | Làm gì | Ghi chú |
|---|---|---|
| **Tiền mặt** | Nhập **Tiền khách đưa**. Desk tính **Thối lại** | Cất két ngay |
| **Thẻ (máy POS tại quầy)** | Khách quẹt/chạm thẻ trên máy POS **trước mặt mình**. Nhập **Mã chuẩn chi trên phiếu POS** | **Không nhập số thẻ** |
| **Chuyển khoản VietQR** | **Tạo VietQR · …** → kiểm dòng cảnh báo (bên dưới) → khách quét → **chắc tiền đã về** (khung bên dưới) → **Ghi nhận đã thu …** | Nội dung chuyển khoản là mã đơn |
| **Chuyển khoản** (tay) | Nhập số tiền, **Mã giao dịch / ghi chú** | Mang cờ **Chờ đối soát** (chờ quản lý khớp với sao kê ngân hàng), vẫn tính là đã thu |

**Mã VietQR hiện dòng "Tài khoản nhận vừa đổi trong 24 giờ qua…":** **chưa cho khách chuyển**. **Gọi điện** (không nhắn) cho chủ đầu tư qua số đã lưu sẵn trong danh bạ điện thoại cơ sở, hỏi chủ đầu tư có vừa đổi tài khoản nhận không. Chủ đầu tư xác nhận thì mới cho khách quét. Không gọi được: mời khách trả tiền mặt hoặc thẻ. Thấy thông báo đổi tài khoản trong Desk mà chưa nghe chủ đầu tư nói: cũng gọi chủ đầu tư.

> **Tạm ở v1.0 – kiểm tiền chuyển khoản đã về** (đang chờ chủ đầu tư quyết cách lễ tân thấy tiền về tại quầy):
> - **07:00–22:00**: gọi hoặc nhắn chủ đầu tư/quản lý **qua số đã lưu sẵn trong danh bạ điện thoại cơ sở**, kèm **mã đơn và số tiền**. Chỉ bấm khi người đó trả lời **đúng mã đơn và số tiền**. Tin xác nhận đến từ số hoặc tài khoản lạ (kể cả có ảnh, tên chủ đầu tư) thì không tin, gọi lại số đã lưu.
> - **22:00–07:00**: mời khách trả **tiền mặt** hoặc **thẻ (máy POS)**. Khách chỉ chuyển khoản được: ghi **Chuyển khoản** (tay) với mã giao dịch khách đọc. Khoản mang cờ **Chờ đối soát**. Ghi vào sổ giao ca để quản lý đối soát **trước 09:00** sáng hôm sau.
> - Không giao mã cửa cho khách mà chưa có giấy tờ người đứng tên.
> - Ảnh chụp màn hình chuyển khoản và **tin nhắn SMS báo tiền** khách đưa xem **không** thay cho xác nhận.
<!-- Chờ ESC-039 (INV, hạn 31/10). Đội đề xuất A: thông báo tiền vào tới thiết bị của cơ sở ở quầy (điều kiện SEC: chỉ báo tiền vào, không số dư, không app ngân hàng có quyền chuyển, không dùng SMS). Khi INV quyết A: sửa khung này thành "nghe/thấy thông báo tiền vào trên thiết bị ở quầy rồi mới bấm", giữ dòng không tin ảnh/SMS. Quy tắc QR "vừa đổi" theo SEC-on-B2-readiness B5. -->

- **Chưa chắc tiền về thì đừng hoàn tất.** Chờ xác nhận, hoặc chọn cách khác.
- Ở **trả phòng**: thu nhiều lần, mỗi lần một cách. Khi **đặt đơn** và khi **nhận phòng**: Desk nhận **một** cách cho mỗi lần thu, và ở nhận phòng thu **đủ** **Cần thu để nhận phòng** bằng cách đó (chuyển khoản, thẻ: đúng bằng số cần thu; tiền mặt: từ số cần thu trở lên, Desk tính tiền thối). Khách muốn trả hai cách lúc nhận phòng: chưa làm được ở v1.0, mời khách trả một cách (thường tiền mặt hoặc thẻ).
- Khối thu tiền khi nhận phòng chọn sẵn **Chuyển khoản VietQR**: bấm đúng cách khách trả trước khi nhập số.
- Đơn Trực tiếp: thu **đủ** phần còn lại khi nhận phòng, **trước khi giao mã cửa**.
- **Không nhận số thẻ** qua điện thoại, Zalo, email hay giấy. Không chụp thẻ, không ghi số thẻ. Khách muốn trả thẻ thì trả tại máy POS ở quầy.
- **Thẻ ảo của OTA**: chỉ chủ đầu tư/quản lý xem trên extranet và gõ thẳng vào máy POS. Không sao chép, không in, không chụp màn hình số thẻ.

[ẢNH: C2-19-Nhận phòng, thu tiền]

### 2.14 Trả phòng – 3 bước

**Giờ trả phòng 12:00.** Hôm trước và sáng ngày đi, lễ tân nhắn khách xác nhận giờ trả (nhắn tay ở v1.0), ghi kết quả bằng **Xác nhận giờ trả** (mục 2.12). Chỉ nhắn trong **08:00–21:00**; tối hôm trước nhắn trước 21:00. Căn có khách đến hôm nay: không mời trả muộn trong tin.

1. **Hôm nay → Khách đi → Trả phòng** (hoặc khung đơn → **Trả phòng**). Desk mở **Trả phòng · Căn … · …**. Khách đã đổi căn giữa kỳ: **trước khi bấm**, mở **Folio** kiểm trùng minibar căn cũ (gạch **Kiểm trùng** dưới **Bước 1 – Minibar**).
2. **Bước 1 – Minibar.** Nhập số **Còn lại / chuẩn** từng món theo số buồng phòng đếm (mục 3.7). Không dùng gì: **Không dùng gì – tủ đủ**. Buồng phòng chưa báo số: hỏi khách đã dùng gì, nhập theo lời khách, ghi chú "chưa đếm". **Không** bấm **Không dùng gì – tủ đủ** khi chưa có số. Xem **Tổng minibar**. Bấm **Tiếp tục: Phụ phí**.
   <!-- ORC 07/11: phần chặn của BR-438 (2a) không vào v1.0.5, đi cùng màn đếm minibar của buồng phòng (R5-B-15). Phần audit của V516-01 (BE-A2 `r5-v516-minibar` 0b2ebb45: lần đếm lại làm dòng minibar nhỏ đi ghi folio_line.adjusted, lý do minibar_recount, nên có trong reductionsOnly, removalsOnly, line_reduction_count) vào v1.0.5 nếu #110 gộp trước. #110 trượt khỏi tag v1.0.5 thì: bỏ câu "Từ v1.0.5, lần đếm lại…" ở gạch dưới; trả lại câu BA-03 cũ (commit d467578b) ở sổ tay 1.1, 1.15, 2.1 cuối ca bước 3, tệp 01 mục 2.1, 8.1, tệp 02 mục 12.4 bước 2. Nguồn: DOM-on-be-prs-101-108-110.md mục 3.3; DOM-responses.md đề xuất minibar (A); DOM-on-ba-v105-docs.md mục 4, FB-R5-DOM-BA-03. -->
   - **Không đếm lại thấp hơn lần đếm trước**, khi lần đó do buồng phòng báo hay lễ tân khác nhập, hoặc do anh/chị nhập từ hôm trước. Khách không nhận số đã đếm: xin miễn theo mục 2.12 (minibar trong hạn mức thì **Tự áp miễn phí**), không hạ số. Đếm lại thấp hơn lần trước vì lần trước sai thật: dừng, **báo quản lý**, ghi sổ giao ca mã đơn và món. Desk không chặn lần đếm thấp hơn. Từ v1.0.5, lần đếm lại làm tiền minibar nhỏ đi hiện ở bộ lọc **Sửa giảm dòng – 7 ngày** của quản lý, chủ đầu tư.
   - **Khách đã đổi căn giữa kỳ, có 2 tủ minibar – từ v1.0.4:**
     - Bước **Minibar** có dòng **Tủ minibar cần đếm**, mỗi tủ một nút: **Căn … (đã chuyển đi)** đứng trước, **Căn … (đang ở)** đứng sau. Desk mở sẵn tủ căn cũ: **nhập số còn lại đã ghi lúc đổi phòng** (sổ giao ca). **Không** đếm lại tủ căn cũ lúc trả phòng: tủ đó đã dọn, đã bổ sung, có thể đã có khách khác. Sổ giao ca không có số: hỏi buồng phòng. Vẫn không có: hỏi khách đã dùng gì ở căn cũ, nhập theo lời khách, ghi chú "chưa đếm", báo quản lý. Tủ căn đang ở: đếm như thường.
     - **Kiểm trùng, trước khi bấm Trả phòng:**
       - Mở **Folio** của đơn. Tìm dòng **Thêm phát sinh** ghi minibar căn cũ lúc đổi phòng (cách cũ, thường là **Đồ ăn uống**).
       - Có dòng đó: **Bỏ cả dòng** (**Folio & điều chỉnh** → dòng đó → **Điều chỉnh** → **Bỏ cả dòng**), **Lý do điều chỉnh** "Trùng minibar tủ căn cũ" → **Ghi điều chỉnh**, rồi vẫn nhập số tủ căn cũ ở bước **Minibar**. Trang **Trả phòng** không có nút sửa dòng folio. Lễ tân trở lên bỏ được khi chưa hoàn tất trả phòng. Desk không cho bỏ thì báo quản lý.
       - **Chỉ** bỏ dòng **Thêm phát sinh** ghi minibar căn cũ lúc đổi phòng: ghi chú của dòng hoặc sổ giao ca cho thấy đúng tủ căn cũ, cùng số tiền. **Không** dùng **Bỏ cả dòng** để miễn hay giảm cho khách: miễn, giảm luôn làm theo mục 2.12, **Miễn phí, giảm giá**.
       - Ghi sổ giao ca: mã đơn, dòng đã bỏ, số tiền, số tủ căn cũ đã nhập. Quản lý xem lại các lần bỏ dòng này.
     - Nút chính ghi tủ kế tiếp, ví dụ **Tiếp tục: Tủ căn 202**. Bấm thì Desk báo "Đã lưu số đếm tủ căn …" và mở tủ còn lại; dòng **Tủ minibar đang đếm** ghi tên tủ trên màn. Tủ đã đếm không hiện lại. Ở tủ cuối, nút là **Tiếp tục: Phụ phí**.
     - Desk hiện **Tủ căn … cần đếm lại** (khách vào lại căn, gia hạn, tủ được bổ sung sau lần đếm trước, hoặc lần đếm trước không phải hôm nay): tủ căn đang ở thì đếm số còn lại trong tủ bây giờ; tủ căn cũ thì nhập số đã ghi lúc đổi phòng. Món đã tính trước đó không bị tính trùng.
     - Bấm hoàn tất mà Desk báo "Chưa kiểm minibar. Làm bước 1 trước khi hoàn tất.": Desk tự về bước **Minibar**, mở tủ còn thiếu. Đếm tủ đó rồi đi tiếp.
     - Desk báo **Số đếm chưa được lưu** (tủ vừa được bổ sung hoặc lượt ở vừa đổi trong lúc đếm): tủ căn đang ở thì đếm lại, tủ căn cũ thì nhập lại số đã ghi lúc đổi phòng, rồi bấm nút chính lần nữa.
     - **Quay lại** bước **Minibar** từ bước sau: Desk đọc lại tủ trên màn, số hiện là lần đếm trước (Desk báo **Folio đã sửa sau lần đếm trước** thì số theo folio). Sửa nếu sai, rồi bấm nút chính.
     - Trước khi thu tiền, xem bill (hoặc **Folio**) có khoản minibar của **cả hai tủ**, khớp số đã nhập (tủ căn cũ theo sổ giao ca, tủ căn đang ở theo số buồng phòng báo), và không còn dòng **Thêm phát sinh** ghi minibar căn cũ. Thiếu khoản nào thì dừng, chưa bấm hoàn tất, báo quản lý.
<!-- v1.0.4: #81 (BUG-R4-042) và #83 (BUG-R4-045, 047, 048) đã gộp main 0df6a67b. Chữ: co.minibar_cabinet, co.minibar_cabinet_old, co.minibar_cabinet_room, co.go_next_cabinet, co.minibar_cabinet_saved, co.minibar_cabinet_counting, co.minibar_recount_title, error.MINIBAR_NOT_CHECKED, common.back. Desk mở sẵn tủ căn cũ (BR-703-01). Khi chủ đầu tư báo v1.0.4 đã lên thì bỏ khối "tới v1.0.3" bên dưới. -->
   - **Khách đã đổi căn giữa kỳ, có 2 tủ minibar – tới v1.0.3** (lỗi Desk BUG-R4-042; cách làm tạm tới khi chủ đầu tư báo v1.0.4 đã lên):
     - Tủ căn cũ: nhập số còn lại đã ghi lúc đổi phòng (sổ giao ca), không đếm lại tủ đó. Kiểm trùng dòng **Thêm phát sinh** minibar căn cũ trước khi bấm **Trả phòng**, như khối từ v1.0.4 ở trên.
     - Đếm xong tủ thứ hai, bấm **Tiếp tục: Phụ phí** mà Desk vẫn đứng ở bước **Minibar** và hiện lại tủ đã đếm (bảng không ghi tên tủ, tiêu đề vẫn là căn đang ở): **không** sửa số, **không** bấm **Không dùng gì – tủ đủ**. Bấm như vậy là Desk đảo khoản minibar đã tính của tủ kia. Chỉ bấm **Tiếp tục: Phụ phí** một lần nữa, giữ nguyên số: Desk ghi lại đúng số cũ, tiền không sai.
     - Trước khi thu tiền ở bước **Bill & thu tiền**, xem bill (hoặc **Folio**): phải có khoản minibar của **cả hai tủ**, khớp số buồng phòng báo (tủ căn cũ: số đã ghi ở sổ giao ca lúc đổi phòng). Thiếu khoản nào thì dừng, chưa bấm hoàn tất.
     - Lỡ bị đảo (Folio có khoản minibar và một dòng trừ đúng số đó): Desk không cho **Điều chỉnh** dòng đã đảo. Khách còn ở quầy: **Thêm phát sinh** → **Khoản**: **Đồ ăn uống**, nhập đúng số tiền đã mất, **Ghi chú** "Minibar tủ căn …: món × số" → **Thêm vào folio** (mục 2.12), rồi thu như thường. Khách đã đi: báo quản lý, quản lý quyết thu lại hay bỏ qua. Cả hai trường hợp: ghi sổ giao ca (mã đơn, số tiền) và báo buồng phòng kiểm, bổ sung tủ đó, vì Desk đã ghi tủ đủ.
3. **Bước 2 – Phụ phí.** Kiểm **Giờ trả phòng thực tế**. Desk tự tính phụ thu trả muộn (mục 2.15). Thêm **Phát sinh khác** nếu có (**Giặt ủi**, **Đồ ăn gọi thêm**, **Hư hỏng, mất đồ**, **Khử mùi thuốc lá**, **Thiếu thẻ phòng**). Có phụ thu: báo khách, tích **Tôi đã báo khách khoản phụ thu này**. Bấm **Tiếp tục: Bill & thu tiền**.
4. **Bước 3 – Bill & thu tiền.** Đọc **Tổng cộng**, **Đã thu**, **Còn phải thu**. Thu theo mục 2.13.
5. Khách lấy hóa đơn công ty: bật **Khách lấy hóa đơn công ty** → **Tên công ty**, **Mã số thuế**, **Địa chỉ công ty**, **Email nhận hóa đơn** → bấm **Lưu** (mục 2.16). Bỏ qua dòng chữ nhỏ nhắc "Round 3 / R2" dưới ô – chữ cũ, đang sửa.
6. Khách trả thừa: Desk hiện "Khách đã trả thừa … đ. Chọn cách xử lý." Chọn **Hoàn lại khách … (tạo đề nghị hoàn)** hoặc **Khách đồng ý để lại khoản thừa – chỉ quản lý trở lên**, ghi lý do.
   - Số Desk hiện chỉ là phần **chưa có** yêu cầu hoàn. Khoản hoàn của **Trả sớm** không hiện lại, không tạo lại.
   - Chọn hoàn thì đơn có **thêm một** đề nghị hoàn cho đúng phần này, không trùng. Ghi trong lý do phần này từ đâu (ví dụ "đêm 05/11 đã thu, được FOC") để người duyệt đối chiếu (mục 1.8).
   - Desk tạo đề nghị hoàn khi bấm hoàn tất (bước 7). Xong bước 8, nhập nơi nhận hoàn ngay khi khách còn ở quầy (mục 2.17, 1.12), trên máy đã cấp quyền. Đơn còn khoản **Trả sớm** chưa chi: báo khách tổng số hoàn và số lần chuyển, ví dụ "You will receive 1,200,000 VND back in two transfers: 400,000 and 800,000 VND." / "OTTIMO sẽ hoàn anh/chị 1.200.000 đ, chuyển làm hai lần: 400.000 đ và 800.000 đ." Số của khoản Trả sớm: **từ v1.0.4** ở dòng **Đang chờ hoàn** dưới **Còn phải thu** (mục 2.14a); ở v1.0.3 ở **Nhật ký tiền → Hoàn tiền**, dòng của mã đơn (chỉ yêu cầu do chính anh/chị tạo hoặc đã được duyệt). Người khác bấm **Trả sớm** (ví dụ ca trước) mà yêu cầu còn chờ duyệt thì **không hiện ở cả hai chỗ**: hỏi quản lý (hoặc chủ đầu tư) trước khi báo khách.
   - **Đơn HĐ thuê tháng** (dài hạn nhập tay): Desk báo trả thừa thì **không** chọn **Hoàn lại khách**, chưa hoàn tất. Dừng, hỏi chủ đầu tư (gửi mã đơn và số Desk hiện). Tiền thuê và ký quỹ xử lý ngoài app (mục 2.14a nhánh HĐ thuê tháng, mục 2.7).
7. Bấm **Đã thu … – hoàn tất** (hoặc **Hoàn tất trả phòng**). Đọc hộp xác nhận, xác nhận.
8. Desk báo "Đã trả phòng. Bill đã lưu." và cấp số **Phiếu thanh toán**. Đơn chuyển **Đã trả phòng**, buồng chuyển **Trống, cần dọn**; có việc dọn, bổ sung minibar, xóa mã trên app khóa.

[ẢNH: C2-31-Trả phòng, bước Minibar]
[ẢNH: C2-32-Trả phòng, bước Phụ phí]
[ẢNH: C2-33-Trả phòng, bước Bill và thu tiền]

- Tiền mặt hoặc thẻ POS **lớn hơn số đang nợ lúc đó** (ví dụ có phụ thu mới ở bước 3): Desk ghi "đã nhận …", khoản thu được ghi vào folio **khi bấm Hoàn tất**. Số cần thu đổi sau khi nhập: bấm **Bỏ khoản thu này**, nhập lại theo số mới (không thu khách lần nữa).
- Khách đi khi chưa trả đủ: **dừng**, gọi quản lý ghi công nợ (mục 1.10). Lễ tân không ghi công nợ.
- Có yêu cầu miễn đang chờ duyệt: chưa hoàn tất được tới khi có kết quả, hoặc rút yêu cầu và thu đủ.
- Sau khi hoàn tất, folio đã chốt. Sửa phải nhờ quản lý (mục 1.11).

**Buồng phòng báo tủ thiếu nhiều hơn số đã tính** (lúc bổ sung minibar, mục 3.7):
- khách đã trả phòng: **Thêm phát sinh** sau trả phòng trong 24 giờ, kèm ảnh tủ, đúng số món chênh (mục 1.11). Quá 24 giờ: ghi sổ giao ca, báo chủ đầu tư;
- khách còn ở: ghi sổ giao ca mã đơn và món, tính ở lần đếm sau.

Buồng phòng vẫn nạp đủ định mức rồi mới bấm **Làm xong**.
<!-- DOM-on-ba-v105-docs.md mục 4, FB-R5-DOM-BA-04 (Suggestion): luật phát sinh sau trả phòng đã có, BR-702, BR-703. -->

**Đơn quá ngày đi, vẫn Đang ở** (ngày đi đã qua mà chưa bấm **Trả phòng**): Desk chỉ cho **Trả phòng** đúng ngày đi của đơn, nên khung đơn và **Hôm nay** không có nút **Trả phòng**. Làm như sau:
1. Kiểm căn và hỏi buồng phòng: khách còn ở hay đã đi, đi ngày nào. Khách đã đi (trường hợp (b) bên dưới): **xóa mã cửa** của khách trên app khóa ngay, không chờ duyệt; ghi sổ giao ca.
2. Khung đơn → **Gia hạn** tới hôm nay: **Ở thêm** từ ngày đi trên đơn tới hôm nay (mục 2.12, **Gia hạn**). Desk báo đêm đó đã kín, hoặc cần quá 7 đêm: dừng, báo quản lý.
   - Kiểm dòng **Ngày đi đổi thành …** là ngày hôm nay. Trước 06:00, "hôm nay" là ngày hôm qua theo lịch. Ví dụ 04:30 ngày 25/11, ngày đi 23/11: **Ở thêm** 1 đêm, ngày đi đổi thành 24/11.
   - Khách đã đi (trường hợp (b)): **không** kéo dài mã cửa (bỏ câu kéo dài mã ở mục 2.12, **Gia hạn** bước 4). Desk báo thị thực hết trước ngày đi mới: ghi lý do "Gia hạn để trả phòng, khách đi ngày …".
3. Chọn đúng trường hợp, rồi **Trả phòng** như các bước trên:
   - **(a) Khách ở thật quá ngày đi:** đêm thêm là đêm bán, thu như gia hạn thường (Trực tiếp, CTV theo giá đêm của đơn; OTA thành đơn con Trực tiếp). **Giờ trả phòng thực tế** là giờ khách rời thật (Desk đòi **Ghi chú giờ trả (vì sao ghi bù)** thì ghi lý do); phụ thu trả muộn hôm nay tính như mục 2.15. Khách đã rời mà chưa trả đủ: dừng, gọi quản lý ghi công nợ (mục 1.10).
   - **(b) Khách đã đi đúng ngày, lễ tân quên bấm Trả phòng** (hay gặp hơn): không thu đêm thêm. Làm theo thứ tự:
     1. **Xin giảm từng đêm thêm.** Trong **Folio & điều chỉnh**, ở từng dòng tiền phòng của đêm thêm: **Mở form miễn phí / giảm giá** → **Loại**: chọn **Giảm giá đặc biệt (tiền phòng)** (Desk chọn sẵn **Miễn khoản phát sinh (FOC)**, phải đổi) → **Số tiền miễn**: để nguyên số Desk điền (cả dòng) → **Lý do miễn phí**: **Khác (ghi rõ)**, ghi "Quên bấm Trả phòng, khách đi ngày …" → **Gửi duyệt** (mục 2.12, **Miễn phí, giảm giá**).
     2. **Chờ duyệt.** Quản lý hoặc chủ đầu tư duyệt. Còn chờ thì Desk chưa cho hoàn tất trả phòng. Khách của căn này đang chờ: gọi quản lý duyệt ngay, không chỉ chờ thông báo. Chờ lâu thì **Đổi căn / đổi ngày** cho khách mới sang căn trống sẵn sàng (mục 2.8).
     3. **Trả phòng.** **Giờ trả phòng thực tế**: trước 12:00 thì để nguyên giờ Desk điền sẵn (Desk không nhận giờ muộn hơn lúc bấm); từ 12:00 trở đi thì gõ 12:00. Không phụ thu. Desk đòi **Ghi chú giờ trả (vì sao ghi bù)** (giờ ghi sớm hơn lúc bấm) thì ghi "Quên bấm Trả phòng, khách đi ngày …" rồi hoàn tất lại. Hộp hoàn tất nhắc xóa mã: mở app khóa, còn mã của lượt này thì xóa.
     4. **Khai báo, khách nước ngoài:** **không** cập nhật ngày đi mới lên cổng khai báo lưu trú, dù hộp **Gia hạn** nhắc. Ngày khách rời là ngày đi trên đơn cũ: cổng chưa ghi thì ghi ngày đó (gõ tay), và ghi sổ giao ca là ghi trễ. Hồ sơ sẽ hiện ở tab **Cần cập nhật ngày đi**; ô ngày đi ở khối **Sao chép lên cổng khai báo** lúc này là ngày gia hạn: **không** dán ô đó. Hạn và cách ghi trễ trên cổng: hỏi quản lý trước khi gửi.
     5. Ghi sổ giao ca: mã đơn, ngày khách đi, số đêm đã gia hạn và xin giảm.
   - Đơn **Nội bộ**: từ v1.0.4 đêm thêm đã 0 đ, không cần xin giảm. Tới v1.0.3, Gia hạn đơn Nội bộ ra giá Trực tiếp (mục 2.12, **Gia hạn** bước 7): báo quản lý trước khi gia hạn.
   - Ví dụ: đơn Trực tiếp 800.000 đ/đêm, ngày đi 23/11, 10:00 ngày 24/11 vẫn **Đang ở**. Gia hạn 1 đêm tới 24/11. Trường hợp (a) thu thêm 800.000 đ; trường hợp (b) thu thêm 0 đ.
<!-- DOM lượt 8 (BR-421, BR-402 v0.5.7): B18 chỉ chạy đúng ngày đi của đơn. Gia hạn có ở mọi đơn Đang ở: allowed-actions.ts cho extend_stay (B13) không theo ngày, check_out (B18) chỉ khi hôm nay là ngày đi. QA TC-V104-RG-26 (05/11): B18 thẳng ra 409 INVALID_TRANSITION; B13 rồi B18 sau 12:00 đòi quyết phụ thu trả muộn; B18 giờ gõ trước 12:00 kèm checkoutTimeNote ra 200. Giờ muộn hơn lúc bấm: 422 TIME_AFTER_ACTION (checkTypedTime), nên (b) trước 12:00 để giờ Desk điền. v1.0.5 đề xuất Trả phòng theo ngày khách thật sự đi (PO/ARC). -->

> **Lỗi nhỏ đã biết (v1.0.3 hoặc v1.0.4):** các nút nhanh ở bước **Phụ phí** (giặt ủi, F&B, hút thuốc, mất thẻ) mở hộp nhưng **chưa chọn sẵn khoản**: chọn tay khoản trong ô **Khoản**. Khung đơn đang ở hiện dòng "Còn phải thu" hai lần, cùng một số.

**Bill / Phiếu thanh toán:**
1. Xem trước phiếu ở **bước 3 Bill & thu tiền** của màn Trả phòng (bản xem trước, chưa có số phiếu). Bản xem trước cũng có nút **In phiếu**, nhưng tờ in ra ghi "Bản xem trước – số phiếu được cấp khi hoàn tất trả phòng": **không đưa tờ này cho khách**. Khung đơn **Đang ở** chưa có nút xem phiếu.
2. Sau khi hoàn tất, mở phiếu bằng một trong hai lối: nút **Xem Phiếu thanh toán** trên màn hoàn tất (cạnh **Về chi tiết đơn**), hoặc khung đơn **Đã trả phòng** → **Xem Phiếu thanh toán**. Chọn **Ngôn ngữ phiếu**: **Tiếng Việt** hoặc **Việt – Anh**. Phiếu đã có **Số phiếu**.
3. **Chỉ in sau khi hoàn tất** (phiếu có **Số phiếu**). Bấm **In phiếu** → hộp in của trình duyệt in **một tờ A4** chỉ có phiếu. Khách cần bản điện tử: trong hộp in chọn **Lưu dưới dạng PDF**, rồi gửi riêng 1–1 cho khách từ tài khoản của OTTIMO (mục 2.4). Không chụp màn hình phiếu gửi khách qua chat.

[ẢNH: C2-35-Phiếu thanh toán, In phiếu]

> **Tạm ở v1.0:** mẫu in chính thức, xuất PDF từ Desk, gửi bill qua email/Zalo và khách xem folio tạm tính trên trang khách có ở v1.2.
<!-- BUG-R3-020 Closed 28/10 trên rc.4 (qa3-rc1.md 17.4): 1 tờ A4, VI và VI–EN. Máy in thật ở quầy chưa thử – INV/OPS in thử 1 tờ trước 02/11. -->

### 2.14a Khách trả phòng sớm (từ v1.0.2)

**Áp dụng từ khi chủ đầu tư báo bản v1.0.2 đã lên.** Khung đơn đang ở có nút **Trả sớm** (lễ tân trở lên) cho cả đơn ngắn ngày và đơn dài hạn nhập tay. Bỏ cách tạm cũ (để căn **Đang ở** tới ngày đi, quản lý giảm tiền trên folio). Vẫn **không mở màn Trả phòng trước ngày đi**. Không hứa số hoàn, không hoàn tiền tại quầy.

<!-- Nguồn: Desk v1.0.2 (PR #22 @ 9d4f0fa8, chuỗi early_departure.*); BR-428, BR-313 v0.5.1, BR-207, BR-210, BR-214, BR-502; ESC-048 = B; DOM-on-PR22-BUG-R4-014.md Lượt 2; ORC 03/11 bỏ nhánh HĐ ký trước 01/11/2026. Bản chi tiết cho lễ tân: guides/02-le-tan.md mục 11.5; cho quản lý: guides/01-chu-dau-tu-quan-ly.md mục 7.3. -->

**Thao tác chung:**
1. Khách báo rời sớm: ghi ngay **sổ giao ca** "OTM-…: khách báo rời ngày dd/mm lúc hh:mm, báo qua (Zalo/điện thoại/tại quầy)".
2. Mở đơn → **Trả sớm** → bước **Ngày rời và giờ báo**: **Ngày rời mới**; **Khách báo lúc** (Desk điền lúc mở hộp – sửa đúng giờ khách đã báo; báo sớm hơn thì ghi **Bằng chứng giờ báo**); đơn OTA nhập **Số OTA giữ lại** theo extranet. Bấm **Xem trước số tiền**.
   - **Trả sớm lúc 00:00–05:59** (áp dụng ngay; Desk chưa chặn, sửa ở v1.0.5): ô **Ngày rời mới** đặt sẵn **ngày hôm trước**, vì tới 06:00 Desk vẫn tính là ngày cũ. Đêm vừa qua là đêm khách **đã ở**, không phải đêm bỏ. Đổi **Ngày rời mới** thành **ngày lịch hôm nay** rồi mới bấm **Xem trước số tiền**. Số ngày báo trước vẫn đếm theo quy tắc thường: ví dụ khách báo 04:30 ngày 03/11, rời 03/11 là báo trước 1 ngày. Bước **Kết quả** sẽ không có **Trả phòng ngay** (Desk ghi "Khách trả phòng ngày … như thường lệ").
   - **Khách đi trước 06:00** (áp dụng ngay, cả khi rời đúng ngày đi ghi trên đơn): nút **Trả phòng** (khung đơn, trang **Hôm nay**) chỉ hiện **từ 06:00**. Lúc khách đi: đóng hộp; thu thẻ, chìa khóa, xóa mã cửa; đếm minibar nếu kịp. Xem **Còn phải thu** ở khung đơn, cộng minibar vừa đếm, rồi **thu ngay trước khi khách đi**: tiền mặt (cất két, để riêng) hoặc thẻ qua máy POS (giữ phiếu POS), như mục 2.13. Lúc này Desk chưa ghi được khoản thu và chưa có mã VietQR. Khách chỉ chuyển khoản được: ghi sổ giao ca số còn thu, đầu ca sáng báo quản lý. Báo khách số sẽ hoàn (nếu có) như mục 2.14. Ghi sổ giao ca "OTM-… khách rời hh:mm, đã thu … bằng …, chờ Trả phòng lúc 06:00". **Không** bấm **Trả sớm** lần nữa, không gọi quản lý chỉ vì chưa có nút. **Từ 06:00** (hoặc đầu ca sáng, **trước 12:00**): khung đơn → **Trả phòng**. Ở bước **Phụ phí**, **để nguyên giờ Desk điền sẵn** ở ô **Giờ trả phòng thực tế** (giờ hiện tại). **Không** gõ giờ trước 06:00 (ví dụ 04:30): Desk sẽ hiện hộp thêm đêm rồi báo giờ sai, không hoàn tất được (lỗi đã biết, đang sửa). Trả phòng trước 12:00 thì Desk không phụ thu, không thêm đêm, nên số tiền vẫn đúng. Quá 12:00 mới làm được: gõ **12:00** ở **Giờ trả phòng thực tế** (không gõ giờ trước 06:00). Desk đòi **Ghi chú giờ trả (vì sao ghi bù)** thì ghi "Khách rời hh:mm, trả phòng trên Desk lúc hh:mm" rồi hoàn tất lại. Không phụ thu. Ở bước **Bill & thu tiền**, ghi khoản đã thu lúc khách đi theo đúng cách đã thu: tiền mặt thì nhập số tiền ở **Tiền khách đưa**; thẻ thì nhập **Mã chuẩn chi trên phiếu POS**. Giờ khách rời thật ghi ở sổ giao ca, không ở Desk: hoàn tất xong, ghi tiếp "OTM-… Trả phòng trên Desk lúc 06:xx, khách rời thật hh:mm". Khách rời đúng ngày đi ghi trên đơn: không dùng **Trả sớm**, làm **Trả phòng** từ 06:00 như trên.
3. Bước **Xem trước**: đọc theo nhánh dưới đây, báo khách, tích ô "Đã báo khách…", bấm **Xác nhận trả sớm**.
4. Bước **Kết quả**: ngày rời là hôm nay thì **Trả phòng ngay** (mục 2.14); ngày sau thì nút **Trả phòng** hiện vào ngày đó.
5. Ngoài Desk: rút hiệu lực mã cửa về giờ trả ngày rời, xóa mã khi khách trả phòng; thu thẻ, đếm minibar, kiểm hư hỏng (**Thêm phát sinh**); khách nước ngoài cập nhật ngày đi trên cổng khai báo trong ngày rời; mở lại các đêm khách bỏ trên extranet mọi kênh đang đóng căn này (Desk ghi dòng này cho mọi đơn; đơn OTA kiểm cả kênh của đơn), chỉ người chủ đầu tư giao mới mở; buồng phòng: hủy việc dọn các ngày sau còn lại, tạo **Dọn trả phòng** ngày rời nếu chưa có (mục 2.19).

**Nhánh ngắn ngày:** Desk tính theo chính sách – đơn Trực tiếp/CTV báo trước từ 1 ngày hoàn 50 % tiền phòng các đêm chưa ở, báo trong ngày rời không hoàn tiền phòng; phụ thu người của các đêm bỏ hoàn 100 % trong cả hai trường hợp; đơn OTA theo kênh. Desk ghi **Phí trả phòng sớm** vào folio và, khi có khoản hoàn, tạo **một** yêu cầu hoàn cho phần trả sớm; lễ tân **Nhập nơi nhận hoàn** (mục 2.17), quản lý/chủ đầu tư khác người tạo duyệt. Đơn Trực tiếp/CTV báo trong ngày rời mà các đêm bỏ không có phụ thu người khách đã trả: Desk ghi 'Không có khoản hoàn.', không có yêu cầu hoàn, không cần nhập nơi nhận. Có phụ thu người đã trả: Desk vẫn tạo **một** yêu cầu hoàn đúng phần đó, làm như khi có khoản hoàn ở trên. Dòng phí trên bill: 'Phí trả phòng sớm (báo trước 0 ngày)'. Trả phòng sau đó **không tạo lại** khoản này. Folio còn tiền khách trả thừa **khác** (ví dụ đêm đã thu rồi được FOC): bước **Bill & thu tiền** hỏi cách xử lý **đúng phần đó**; chọn hoàn thì có **thêm một** đề nghị hoàn, không trùng (mục 2.14 bước 6). Người duyệt đối chiếu theo mục 1.8 trước khi từ chối. Nếu Desk tự đóng yêu cầu **Trả sớm** (có thể xảy ra cả khi đã duyệt mà chưa chi, thường do phát sinh mới như minibar) và tạo yêu cầu thay thế: yêu cầu thay thế không mang nơi nhận của yêu cầu cũ, kiểm **Cách hoàn**, trống (—) thì người tạo nhập lại (mục 1.8 bước 4, cách nhận ra yêu cầu thay thế). **Áp dụng từ v1.0.4:** ở **Trả phòng** (bước **Bill & thu tiền** và màn kết quả), dưới **Còn phải thu**, Desk hiện "Đang chờ hoàn cho khách {số tiền} (yêu cầu từ Trả sớm)." Dòng này chỉ để báo, không chặn **Hoàn tất**. **Giới hạn đã biết của v1.0.4:** lễ tân và lễ tân trưởng chỉ thấy yêu cầu hoàn chờ duyệt do **chính mình** tạo. Yêu cầu do người khác tạo (ví dụ ca trước bấm **Trả sớm**) mà còn chờ duyệt thì **không hiện**, cả ở dòng này lẫn ở **Nhật ký tiền → Hoàn tiền**. Yêu cầu đã được quản lý duyệt thì vẫn thấy như thường. Khách đã Trả sớm mà không thấy dòng, hoặc không chắc: **hỏi quản lý (hoặc chủ đầu tư) trước khi báo khách** số tiền hoàn. Không báo khách "không có khoản hoàn". v1.0.5 (chưa có ngày): trang **Trả phòng** và folio hiện **tổng số đang chờ hoàn** của đơn, kể cả yêu cầu do người khác tạo (chỉ số tiền). Tab **Hoàn tiền** giữ phạm vi như hiện nay. Ví dụ (từ ngày chủ đầu tư chuyển giá): căn 202 từ 9/11 đến 16/11, 7 × 800.000 = 5.600.000 đ, báo 12/11 rời 14/11 → hai đêm bỏ 1.600.000 đ → hoàn **800.000 đ**, phí **800.000 đ**.

**Nhánh HĐ thuê tháng** (đơn dài hạn nhập tay, rời **trước ngày kết thúc ghi trên HĐ giấy** – không dựa vào **Ngày ra** trên Desk nếu đơn đã gia hạn): Desk không tính tiền, chỉ hiện khung **Trả trước hạn hợp đồng thuê tháng** theo thứ tự: câu kiểm "Desk chưa biết tiền thuê đã thu tới đâu. Kiểm kỳ thu cuối và hỏi quản lý rồi mới báo khách." → đã thu đủ "Đã thu tiền thuê tới hết HĐ: không vi phạm. Quyết toán ký quỹ như trả phòng đúng hạn HĐ: trừ điện nước, dọn lẻ, hư hỏng còn nợ, hoàn phần còn lại trong 7 ngày làm việc. Không hoàn các ngày không ở." → chưa thu đủ "Chưa thu đủ tiền thuê tới hết HĐ: vi phạm HĐ. Khách mất toàn bộ ký quỹ (giữ ngoài app), không truy thu giảm giá kỳ hạn." (có số ký quỹ thì câu ghi kèm số), lồng dưới: "Vẫn thu điện nước, dọn lẻ, hư hỏng còn nợ, không trừ vào ký quỹ. Tiền thuê và phí dịch vụ đã thu cho tháng lịch chưa bắt đầu thì hoàn, tháng đang ở thì không (làm ngoài app)."; ô tích **Đã báo khách về ký quỹ và các khoản còn thu, còn hoàn**. Bước **Kết quả** thay câu kiểm bằng "Ký quỹ và tiền thuê xử lý ngoài app, theo nhánh đã báo khách." Khung có thể không hiện số ký quỹ; số đúng theo HĐ giấy và sổ kế toán.
1. Kiểm ngày kết thúc HĐ (HĐ giấy, bảng kỳ thu).
2. Kiểm kỳ thu cuối trong bảng kỳ thu. **Tháng lịch cuối** = tháng chứa ngày kết thúc HĐ (HĐ kết thúc ngày 01 thì là tháng liền trước).
   - Rời trong tháng lịch cuối, kỳ cuối đã thu → **đã thu đủ**.
   - Rời trong tháng lịch cuối trước ngày 05, kỳ cuối chưa tới hạn → thu kỳ cuối khi khách rời, rồi **đã thu đủ**.
   - Rời trong tháng lịch cuối sau ngày 05, kỳ cuối quá hạn chưa thu → quản lý quyết theo HĐ.
   - Rời trước khi tháng lịch cuối bắt đầu → **chưa thu đủ**. Khách xin trả trước các tháng chưa tới để giữ ký quỹ: không nhận, quản lý trả lời.
3. **Hỏi quản lý trước khi báo khách** (hiện một người trực: hỏi chủ đầu tư) – gửi mã đơn, ngày kết thúc HĐ, ngày rời, kỳ cuối, nhánh đề xuất, không ghi tên khách. Ghi sổ giao ca nhánh và người quyết.
4. Báo khách theo nhánh đã xác nhận, tích ô, **Xác nhận trả sớm**.
   - **Đã thu đủ** (ESC-048): không vi phạm; ký quỹ quyết toán như trả phòng đúng hạn HĐ (trừ điện nước kỳ cuối, dọn lẻ, minibar chưa thu, hư hỏng, phí phạt), còn dư hoàn trong **7 ngày làm việc**, quản lý duyệt; không hoàn các ngày không ở.
   - **Chưa thu đủ**: mất toàn bộ ký quỹ, dù báo trước bao nhiêu ngày; không truy thu giảm giá kỳ hạn; điện nước, dọn lẻ, hư hỏng còn nợ thu thêm, không trừ vào ký quỹ; tiền thuê và phí dịch vụ đã thu cho tháng lịch chưa bắt đầu thì hoàn, tháng đang ở không hoàn.
   - Mọi khoản làm ngoài app, ghi sổ kế toán.
5. Khi khách rời: chốt công tơ điện ngày rời có ảnh (mục 4.1); biên bản kiểm phòng có ảnh trong ngày rời (bắt buộc trước khi trừ hư hỏng vào ký quỹ); nhận lại căn, thu thẻ, xóa mã cửa; **Trả phòng** trên Desk như thường.

Ví dụ HĐ 3 tháng 20/11/2026 → 20/02/2027, ký quỹ 8.500.000: rời 15/02 đã thu kỳ 05/02 → hoàn 8.500.000 − điện nước 600.000 (giả sử) = **7.900.000**, không hoàn 16–19/02; rời 03/02 → thu kỳ cuối 5.387.000 + 127.000 rồi quyết toán như trên; rời 25/01 → mất 8.500.000, không nhận trả trước tháng 2 để giữ ký quỹ.

> **Giới hạn tới v1.0.3 (đơn HĐ), sửa ở v1.0.4:**
> - Gia hạn đơn HĐ làm Desk dời **Ngày ra (theo HĐ)** và mất ngày kết thúc HĐ gốc: **trước khi bấm Gia hạn**, ghi "OTM-…: HĐ kết thúc dd/mm/yyyy, gia hạn tới dd/mm/yyyy" vào bảng kỳ thu và sổ giao ca (mục 2.12).
> - Khách đã ở hết HĐ, rời trong phần gia hạn: Desk vẫn hiện khung HĐ (lỗi đã biết). Ký quỹ theo **đã thu đủ**; các ngày gia hạn chưa ở như đơn ngắn ngày Trực tiếp (báo trước từ 1 ngày hoàn 50 %, trong ngày rời không hoàn), ngoài app, quản lý duyệt; tiền gia hạn chưa thu thì không hoàn mà thu các ngày đã ở cộng phần không hoàn của các ngày chưa ở (ví dụ ở guides/02-le-tan.md mục 11.5.4). Vẫn hỏi quản lý trước khi báo khách.
> - Nhật ký đơn HĐ có thể ghi "BR-428 notice …": bỏ qua; nhánh và người quyết ghi sổ giao ca.
>
> **Áp dụng từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên; tới lúc đó làm như trên):
> - Desk **giữ ngày kết thúc HĐ** khi gia hạn. **Ngày ra** trên khung đơn vẫn dời sang ngày cuối gia hạn, và Desk không hiện ngày kết thúc HĐ: bảng kỳ thu vẫn giữ cột này (theo HĐ giấy). Không cần ghi dòng "HĐ kết thúc…" vào sổ giao ca trước khi bấm **Gia hạn** nữa.
> - **Trả sớm** chỉ hiện khung **Trả trước hạn hợp đồng thuê tháng** khi khách rời **trước** ngày kết thúc HĐ. Khách rời trong phần gia hạn sau HĐ: không còn khung này; ký quỹ và tiền các ngày gia hạn vẫn làm ngoài app như cũ (Desk không có dòng tiền cho phần gia hạn của đơn HĐ). Desk hiện (hoặc không hiện) khung HĐ khác với HĐ giấy (ví dụ HĐ đã ký lại với ngày kết thúc mới: Desk vẫn giữ ngày kết thúc cũ): dừng, hỏi quản lý.
> - Nhật ký đơn HĐ rời trước hạn ghi "BR-313 lease early end – deposit per lease" thay cho "BR-428 notice …". Nhánh và người quyết vẫn ghi sổ giao ca.

### 2.15 Trả muộn và khách ở quá 18:00

**Mức phụ thu trả muộn** (trên giá đêm cuối):

| Khách rời | Desk tính |
|---|---|
| Đến **12:30**, căn **không** có khách đến cùng ngày | Không phụ thu (ân hạn) |
| Sau 12:00 – đến **15:00** | **30 %** |
| Sau 15:00 – đến **18:00** | **50 %** |
| Sau **18:00**, đêm đó căn **còn trống** | Tính **thêm 1 đêm** (giá đêm thêm sửa được trong khoảng sàn–trần) |
| Sau **18:00**, đêm đó căn **đã có khách đến** | Phụ thu **bằng giá 1 đêm** – đường "quản lý xem lại" bên dưới |

Căn có khách đến cùng ngày thì không có ân hạn 12:30.

Khách dài hạn: trả tới 15:00 không phụ thu nếu căn không có khách đến. Ngày đầu nhận từ 06:00 không phụ thu nếu căn trống đêm trước. Phụ thu (nếu có) tính trên **tiền thuê tháng theo hợp đồng ÷ 30**, không trên giá đêm niêm yết. Chưa chắc Desk tính đúng với đơn dài hạn nhập tay: báo quản lý, không tự thu.
<!-- QA Q4: chưa kiểm được vì BUG-R3-019 (không tạo được đơn dài hạn). Kiểm lại sau bản sửa. -->

**Hẹn trả muộn trước:**
1. Khung đơn → **Trả muộn**. Nhập **Giờ trả đã hẹn** (dạng 24 giờ, ví dụ 12:30).
2. Desk hiện **Phụ thu đề xuất** (ví dụ 14:30 → 30 % giá đêm cuối). Báo khách, tích **Tôi đã báo khách khoản phụ thu này**. Khách xin miễn: **Xin miễn phụ thu (gửi duyệt)**.
3. Bấm **Lưu giờ trả …**. Việc dọn ghi "dọn sau …". Nhớ kéo dài mã cửa trên app khóa.
4. Căn có khách đến và **không còn căn thay**: Desk chỉ cho **Gửi quản lý duyệt**. Giờ trả chưa đổi tới khi được duyệt. Gợi ý khách gửi hành lý.

**Muốn miễn phụ thu trả muộn: làm trước khi bấm Trả phòng** (đặt giờ trả muộn như trên rồi gửi miễn có duyệt: **Xin miễn phụ thu (gửi duyệt)** ở bước 2, hoặc ở folio theo mục 2.12). Sau **Trả phòng** chỉ quản lý sửa được.
<!-- DOM rounds/round-05/responses/DOM-responses.md, FB-R5-QA-DOM-BR438-01 chọn A: dòng trả muộn ghi lúc Trả phòng nằm trên folio đã chốt, chỉ quản lý sửa theo A32 (BR-433 (e)). Miễn đã duyệt trước đó đi theo sang dòng trả muộn lúc Trả phòng, tối đa bằng số tiền dòng mới. Không chặn v1.0.5. -->

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

> **Tạm ở v1.0:** Desk chưa xuất hóa đơn điện tử (có ở v1.3). Lễ tân **ghi thông tin công ty** ở bước 3 trả phòng (**Khách lấy hóa đơn công ty**) khi khách cần.
> - Cuối mỗi ca, ghi vào sổ giao ca **mọi phiếu thanh toán đã cấp trong ca**: số phiếu, mã đơn, tổng tiền, cách thu, cột "Hóa đơn công ty" (Có/Không). Không ghi số giấy tờ, số thẻ.
> - Kế toán xuất hóa đơn ngoài Desk theo cách kế toán chọn, **ngày hóa đơn là ngày trả phòng** (mục 4.3).
> - Đơn OTA đã trả trước: không hứa với khách số tiền trên hóa đơn; ghi thông tin và chuyển kế toán.
> - Giá niêm yết đã gồm VAT; phiếu thanh toán ghi "Giá đã gồm thuế GTGT".
<!-- PHÁP LÝ – cần kế toán xác nhận: hóa đơn cho khách lẻ không lấy hóa đơn (NĐ 123/2020, BR-524) – câu phụ trong ESC-038 (DOM thẻ 09, 23). -->

[ẢNH: C2-36-Hóa đơn công ty]

### 2.17 Công nợ và hoàn tiền tại quầy

- **Thu công nợ**: khung đơn hoặc **Cần chú ý** → **Thu công nợ** → **Cách thanh toán**, **Tiền** → **Ghi nhận đã thu …**.
- **Ghi công nợ**, **xóa công nợ**: chỉ quản lý, chủ đầu tư (mục 1.10).
- **Đề nghị hoàn** (trả thừa, hủy, trả sớm): lễ tân tạo, rồi trên máy quầy đã cấp quyền **Nhập nơi nhận hoàn** → chọn **Cách hoàn** (Desk chọn sẵn **Tiền mặt**) → **Lưu** (mục 1.12). Quản lý hoặc chủ đầu tư **khác người tạo** duyệt (hiện một người trực: chủ đầu tư).
- **Chi hoàn tiền mặt** (khoản đã duyệt, nơi nhận là tiền mặt): **Nhật ký tiền → Hoàn tiền** → **Chi hoàn tiền mặt** → **Ảnh chứng từ** (biên nhận có chữ ký khách) → xác nhận. Không chi được khoản do chính mình tạo yêu cầu.
- Hoàn chuyển khoản do quản lý hoặc chủ đầu tư làm, người chi khác người tạo yêu cầu và khác quản lý đã duyệt (mục 1.8). Báo khách thời hạn.

[ẢNH: C2-37-Thu công nợ]
[ẢNH: C2-38-Chi hoàn tiền mặt]

> **Lỗi nhỏ đã biết:** sau khi chi hoàn, thông báo có dấu trừ thừa, ví dụ "Đã ghi hoàn -500.000 đ" (số ghi sổ đúng – v1.0.3 hoặc v1.0.4). Nhập nơi nhận hoàn chuyển khoản phải gõ mã ngân hàng 6 số, chưa có danh sách chọn (v1.1).

### 2.18 Yêu cầu từ website

Form "Yêu cầu đặt phòng" trên ottimo.vn **đã bật từ chiều 30/10**. Khi chủ đầu tư tắt form, màn **Yêu cầu từ website** hiện "Form đặt phòng trên website đang tắt"; khách liên hệ qua Zalo, điện thoại: tạo đơn như mục 2.5, **Nguồn** = **Website** nếu khách nói tìm thấy OTTIMO qua website.

Yêu cầu mới hiện ở menu kèm số, hạn trả lời 15 phút. Mở yêu cầu → **Nhận xử lý** → **Báo giá** hoặc **Tạo đơn**; không thành đơn thì **Đóng – không thành đơn**. Chi tiết theo bộ phận (tin Google Chat từ v1.0.1, xóa theo yêu cầu người gửi): bộ hướng dẫn `guides/02-le-tan.md` mục 13.1–13.1d.

Thông báo quyền riêng tư của form: bản **2026-11-04**, đủ 5 ngôn ngữ, ở trang `/privacy/` của từng ngôn ngữ (ví dụ `ottimo.vn/privacy/`, `ottimo.vn/vi/privacy/`). Khách hỏi OTTIMO dùng thông tin trong form thế nào: gửi link trang đó theo ngôn ngữ của khách. Khách xin xem, sửa, xóa dữ liệu: ghi lại và chuyển chủ đầu tư; người gửi form xin xóa yêu cầu của mình: `guides/02-le-tan.md` mục 13.1b.

**Giá ước tính trên website (đã bật từ 06/11).** Form trên ottimo.vn hiện giá ước tính cho ngắn ngày 1–29 đêm, ghi rõ: ước tính, đã gồm thuế, cho số khách đã chọn, chưa giữ phòng. Theo tháng hoặc từ 30 đêm: không có số. Số do Desk tính, cùng cách tính với **Báo giá**, theo tham số đang chạy. Tới khi chủ đầu tư chỉnh xong các tham số giá còn lệch sổ tay (ví dụ mốc ngắn ngày đang thấp hơn 29 đêm), số trên Desk và web có thể khác sổ tay: làm theo Desk (mục **Cách đọc sổ tay**). Đêm từ ngày cuối web hiện giá (mặc định 01/01/2027, mục 1.4): web ghi "giá theo yêu cầu"; lập báo giá trên Desk như mọi yêu cầu. Chủ đầu tư tắt giá web thì yêu cầu gửi lúc đó ghi **Khách chưa thấy giá**.
- Ngăn chi tiết yêu cầu có dòng **Giá ước tính khách đã thấy** ("{số} – tính lúc {giờ}"), hoặc **Khách chưa thấy giá**.
- Hộp báo giá hiện "Khớp giá ước tính khách đã thấy (…)", hoặc cảnh báo **"Khác giá web khách đã thấy: {cũ} → {mới}"** kèm câu "Giá theo lịch giá hôm nay khác số khách thấy trên web. Nói rõ lý do với khách khi gửi báo giá." khi giá theo lịch giá hôm nay khác số khách đã thấy trên web, hoặc "…không so sánh" khi khách xem cho ngày/số khách/hạng khác.
- **Giá trong báo giá Desk là giá cuối.** Có cảnh báo "Khác giá web khách đã thấy": gửi báo giá kèm một câu giải thích ngắn (giá đã đổi từ lúc khách xem, hoặc căn giá thấp nhất của hạng đã có khách). Không hứa giữ số cũ; khách xin giữ thì báo lễ tân trưởng hoặc quản lý quyết.

**Khách viết bằng tiếng Hàn, tiếng Trung, tiếng Nga (từ 06/11 website có đủ 5 ngôn ngữ: tiếng Anh, tiếng Việt, tiếng Hàn, tiếng Trung giản thể, tiếng Nga).** Giao diện Desk vẫn chỉ có tiếng Việt và tiếng Anh.
1. **Nhận ra khách:** **Yêu cầu từ website** có cột **Ngôn ngữ** (Tiếng Anh · Tiếng Việt · Tiếng Hàn · Tiếng Trung (giản thể) · Tiếng Nga) và lọc được theo ngôn ngữ cùng lọc trạng thái; ngăn chi tiết có dòng **Ngôn ngữ khách dùng**.
2. **Mặc định trả lời bằng tiếng Anh.** Báo giá lập từ yêu cầu: Desk chọn sẵn **Ngôn ngữ gửi khách** = **English** cho khách tiếng Hàn, tiếng Trung (kèm câu "Khách viết bằng tiếng Hàn – gửi tin bằng tiếng Anh." ở hộp báo giá và hộp giữ chỗ), **Русский** cho khách tiếng Nga (Desk có mẫu tiếng Nga, kèm câu "Khách viết bằng tiếng Nga – gửi tin bằng tiếng Nga." ở cùng hai chỗ; tin tự soạn vẫn bằng tiếng Anh). Không đổi sang Tiếng Việt; nhìn lại ô này trước khi bấm **Sao chép gửi Zalo**.
3. **Được dùng Google Dịch** (hoặc công cụ dịch tương tự) để đọc tin khách và soạn trả lời, trên mọi màn hình Desk (chủ đầu tư cho phép 01/11). Nên dịch trong ngăn của một yêu cầu đang mở, không dịch cả trang danh sách – lời khuyên cho gọn, không phải lệnh cấm. Số tiền, ngày ở, cọc, chính sách hủy: chỉ dùng chữ Desk tạo, không qua máy dịch. Bản dịch chưa rõ: không đoán, gửi câu 2. **Không** dùng **Dịch trang** (hay công cụ dịch nào) ở màn **Giấy tờ & khai báo** và màn xem ảnh giấy tờ: tờ **Your ID details** bản v2 chỉ báo khách rằng tin nhắn có thể được dịch (SEC-on-plan-v1.0.4 mục 6.3). **Khách nói không muốn tin nhắn của mình được dịch** (mọi khách, không riêng ngày thay tờ): không đưa tin của khách đó qua dịch vụ dịch, và ghi mã đơn `OTM-…` (khách website chưa có đơn: mã yêu cầu `REQ-…`) cùng chữ "không dịch" vào **trang Không dịch** – trang riêng ở đầu sổ giao ca, dùng chung cho mọi ca và mọi ngày, chỉ mã; lập đơn từ yêu cầu đó thì ghi thêm mã đơn vào cùng dòng; sổ giao ca của ca đó vẫn ghi một dòng nhắc. Trước khi dịch tin của một khách, mở trang Không dịch: mã của khách có trong trang với chữ "không dịch" hoặc "chưa xem v2" (`guides/02-le-tan.md` mục 7.2) thì không dịch. Cách ghi đủ: `guides/02-le-tan.md` mục 13.1d.
4. **Ba câu mẫu** (thay `{code}` bằng mã yêu cầu; không emoji, không "!"; phần nghĩa tiếng Việt không gửi khách):
   - Câu 1 – đã nhận, hẹn báo giá (chỉ khi chưa báo giá được ngay). Trong giờ trực 07:00–22:00: "Thank you for your request {code}. We have received it and will send your quote within 1 hour." Ngoài giờ: "Thank you for your request {code}. We have received it and will send your quote before 09:00 tomorrow morning." Thêm cho khách tiếng Hàn, tiếng Trung (không dùng với khách tiếng Nga): "We will write to you in English. You are welcome to reply in your own language."
   - Câu 2 – hỏi lại, mời viết thêm tiếng Anh: "Thank you for your message. To prepare your quote, could you confirm {details}? A few words in English help us make sure we understand you correctly." (`{details}`: `your arrival and departure dates` · `the number of adults and children` · `the ages of the children` · `which room type you prefer`). Chỉ là bản dịch chưa rõ: "Thank you for your message. We want to be sure we understand you correctly. Could you write it again in a few words of English?"
   - Câu 3 – gửi báo giá, đặt ngay trước khối chữ chép từ Desk: "Here is your quote for request {code}. The room is not yet held. When you are ready, reply to this message and we will hold it for you and send the deposit details." Không kèm mã VietQR trong tin này.
5. **Hạn trả lời** như mọi yêu cầu website. Trang cảm ơn đã hứa với khách: gửi trong 07:00–22:00 → trả lời trong 60 phút; gửi ngoài giờ → trước 09:00 sáng hôm sau. Dịch không phải lý do trễ hạn: chưa báo giá kịp thì gửi câu 1 trong hạn.

[ẢNH: C2-39-Yêu cầu từ website, cột Ngôn ngữ và giá ước tính]

### 2.19 Điều phối buồng phòng trên Desk

1. **Vận hành → Buồng phòng**: **Việc buồng phòng hôm nay** (tiến độ **… xong**) và **Trạng thái buồng** từng căn.
2. Thêm việc: **Việc mới** → hộp **Tạo việc buồng phòng**: **Căn**, **Loại việc**, **Ngày làm**, **Ghi chú cho buồng phòng** → bấm **Việc mới** ở cuối hộp.
3. Hủy việc: **Hủy việc** → **Lý do**.
4. Làm thay buồng phòng: **Làm xong** ở dòng việc.
5. **Từ v1.0.5:** căn **OC · Có khách, sạch** có nút **Báo cần dọn** ở cuối dòng căn trong **Trạng thái buồng**. Bấm thì căn chuyển **OD · Có khách, cần dọn** và có việc **Dọn phòng khách đang ở** (Desk báo "Căn … chuyển cần dọn và có việc dọn."). Desk không hỏi xác nhận. Bấm nhầm: **Hủy việc** dọn vừa tạo (bước 3). Một chỗ dùng: căn kẹt trạng thái (mục 2.10).

[ẢNH: C2-40-Buồng phòng trên Desk, việc mới]

### 2.20 Ca đêm (00:00–05:59)

- Desk và app vẫn tính **ngày hôm trước**. Khách đến muộn của đơn hôm qua: nhận phòng như thường.
- **Từ v1.0.5, tới v1.0.6: rà Sơ đồ phòng trước 06:00.** Từ 00:00 tới 05:59, danh sách **Khách đi** ở **Hôm nay** hiện khách đi sáng nay. Danh sách này **không** còn hiện căn có ngày đi là hôm qua theo lịch mà khách chưa trả phòng. Việc chính làm lúc **cuối ca** (mục 2.1, bước 1): trước 00:00, **Khách đi** hôm nay vẫn hiện đúng các căn này. Các bước dưới cho người trực đêm.
  1. Trước 06:00, mở **Sơ đồ phòng**. Tìm căn **Đang ở** mà ngày đi (xem ở khung đơn) là hôm qua theo lịch. Ví dụ: lúc 01:30 ngày 17/11, căn có đơn **Đang ở** ngày đi 16/11.
  2. **Không gõ cửa, không vào căn ban đêm.** Xem dấu hiệu: thẻ, chìa đã trả ở quầy; sổ giao ca; căn đã dọn trong ngày; nhật ký mở cửa trên app khóa, nếu có.
  3. Chắc khách đã đi: **Trả phòng**, ghi giờ khách rời thật. Chắc khách còn ở: **Gia hạn**. Không chắc: để nguyên, ghi sổ giao ca mã đơn; từ 06:00 làm như đơn quá ngày đi (mục 2.14, **Đơn quá ngày đi**).
  4. Từ 06:00, đơn đó thành **quá ngày đi**: lễ tân không tự trả phòng được nữa, phải nhờ quản lý. Người trực hiện giữ vai quản lý nên làm được bằng quyền đó, ghi lý do.
  <!-- Nguồn: DOM-on-be-prs-101-108-110.md mục 4 (câu sổ tay ca đêm), thẻ FB-R5-DOM-ARC-D1-01; DOM-on-ba-v105-docs.md mục 4, FB-R5-DOM-BA-02 (bước 2, 3 thay 07/11: không gõ cửa ban đêm; việc chính ở mốc đóng quầy); ARC-on-be-pr-100-d1.md A4. v1.0.6 (hợp đồng 0.3.14) đưa căn này lên đầu danh sách Khách đi: khi đó bỏ gạch này. -->
- Khách vãng lai đến ở luôn: tạo đơn, ngày đến là **ngày hôm trước**, tính 1 đêm.
- Khách của đơn **hôm nay** đến trước 06:00: Desk thêm đêm trước (mục 2.10).
- Khách trả phòng trước 06:00 (kể cả đúng ngày đi ghi trên đơn): nút **Trả phòng** chỉ hiện từ 06:00. Làm theo mục 2.14a bước 2, gạch **Khách đi trước 06:00**.
- Khách đến sau 22:00 đã làm thủ tục trước: gọi người trực khi tới nơi; người trực đối chiếu giấy tờ gốc, giao mã.
- Hạn khai báo tính theo **giờ đồng hồ thật**, không theo mốc 06:00. Khách Việt Nam đến 23:00–23:59: khai trước 08:00 sáng hôm sau. Đến 00:00–05:59: khai ngay trong ca, muộn nhất 08:00 sáng.

### 2.21 Tình huống thường gặp

| Tình huống | Làm gì |
|---|---|
| Desk báo "Căn vừa được người khác đặt trong lúc bạn nhập" | Thông tin vẫn còn; chọn căn khác rồi lưu |
| Desk báo "Đơn vừa chuyển sang … nên thao tác này không còn dùng được" | Người khác vừa thao tác; các nút đã cập nhật, làm lại theo trạng thái mới |
| Desk báo "Folio vừa thay đổi…" | Số mới đã tải; kiểm lại rồi lưu lần nữa |
| Không thấy bước giấy tờ khi nhận phòng | Máy chưa được cấp quyền; dùng máy quầy đã cấp hoặc nhờ chủ đầu tư cấp |
| Cần quản lý duyệt ngay tại quầy | Đăng xuất; quản lý đăng nhập tài khoản mình, mở **Cần duyệt**, duyệt, đăng xuất. Không gõ mật khẩu quản lý vào màn của mình |
| Khách OTA đã trả trước xin giảm giá | Không hứa. OTTIMO không giảm được tiền OTA đã thu. Có sự cố cần bù: miễn khoản phát sinh tại quầy, hoặc quản lý duyệt hoàn tiền bồi thường. Đơn OTA trả tại OTTIMO: gửi yêu cầu giảm giá đặc biệt |
| Khách nhờ gửi mã cửa qua Zalo, tin nhắn | **Không gửi.** Trả lời: "For your security, OTTIMO never sends door codes by message. We will call you on the phone number in your booking, or you may collect your code at the front desk." / "Vì an toàn của anh/chị, OTTIMO không gửi mã cửa qua tin nhắn. Lễ tân sẽ gọi vào số điện thoại trong đơn đặt phòng, hoặc anh/chị nhận mã tại quầy." Đơn đủ điều kiện (mục 2.10) thì **tự gọi** số trên đơn để đọc mã. Chưa đủ thì mời khách ra quầy |
| Có người gọi đến xin mã cửa, kể cả nói đúng tên và mã đơn | Không đọc. Cúp máy, tự gọi lại số trên đơn (mục 2.10) |
| Mã VietQR hiện "Tài khoản nhận vừa đổi" | Chưa cho khách chuyển. Gọi chủ đầu tư xác nhận (mục 2.13) |
| Khách đọc số thẻ qua điện thoại "cho nhanh" | Không nhận. Mời trả tại máy POS ở quầy |
| Khách lỡ gửi số thẻ hoặc ảnh thẻ qua Zalo, SMS, email | Khách lỡ gửi số thẻ hoặc ảnh thẻ qua tin nhắn, email: không chép, không chụp, không chuyển tiếp, không đọc to, không dùng số đó để thu tiền (không gõ vào máy POS, không nhập Desk). Trả lời khách bằng **một tin mới** (câu chuẩn ở dưới bảng; Zalo số cơ sở dùng bản ngắn; Zalo OA, hộp thư OTA và Messenger dùng bản không có vế xóa; email soạn thư mới; email và SMS bỏ câu thu hồi), không trích lại tin có số; nhờ khách thu hồi tin nếu kênh đó có nút thu hồi. Rồi **xóa ngay** tin đó trên mọi máy của cơ sở đang mở tài khoản này (điện thoại quầy, máy tính quầy), không chờ khách thu hồi; email thì xóa cả trong thùng rác; ảnh thẻ thì xóa cả ảnh đã lưu trong máy, cả trong thùng rác ảnh. SMS thì xóa cả trong **Đã xóa gần đây** / **Thùng rác**. WhatsApp chọn **Xóa ở phía tôi**, Viber chọn **Delete for myself**; Telegram không đánh dấu ô xóa cho khách (**Also delete for …**). Tài khoản mở trên nhiều máy (điện thoại, máy tính, bản web) thì xóa trên từng máy. Zalo OA, hộp thư OTA, Messenger không có nút xóa: làm theo dòng dưới. Khách muốn trả bằng thẻ: mời trả tại máy POS ở quầy. **Ghi sổ giao ca một dòng, không có số:** "hh:mm – `OTM-…` – khách gửi số thẻ qua Zalo / email / SMS – đã xóa trên điện thoại quầy / máy tính quầy, đã nhờ khách thu hồi". Khách chưa có đơn: thay mã đơn bằng "khách chưa có đơn, kênh Zalo"; không ghi tên hay số điện thoại khách. Không ghi số thẻ, 4 số cuối, loại thẻ, ngày hết hạn, ảnh ở bất kỳ đâu (sổ giao ca, sổ giấy, Desk, nhóm chat nội bộ). **Báo chủ đầu tư trước khi hết ca**, bằng một tin ngắn không có số (như dòng sổ giao ca) hoặc nói trực tiếp; không phải chờ trả lời mới xử lý. **Gọi chủ đầu tư ngay, muộn nhất 1 giờ từ lúc biết, kể cả ban đêm**, khi có một trong các ca: số hoặc ảnh thẻ đã bị chép, chụp, chuyển tiếp (kể cả vào nhóm chat nội bộ), đọc to, gõ vào máy POS, Desk hay sổ giấy, hoặc người ngoài quầy đã thấy; máy giữ tin bị mất, hoặc người khác dùng máy đó trước khi tin được xóa; không xóa được tin: máy hoặc tài khoản giữ tin mà lễ tân không mở được, tài khoản đó có người ngoài cơ sở dùng chung, hoặc kênh xóa được mà xóa không thành (vẫn thấy tin sau khi xóa); khách báo thẻ bị trừ tiền lạ, hoặc nghi số thẻ đã bị lộ. Gọi, không nhắn số. Không gọi được thì nhắn "Cần gọi lại – sự cố số thẻ khách, `OTM-…`" (không có số), ghi sổ giao ca, gọi lại tới khi gặp. Không tự hứa gì với khách ngoài câu trả lời trên |
| Khách lỡ gửi số thẻ hoặc ảnh thẻ qua kênh không xóa được: Zalo OA, hộp thư OTA (Airbnb, Booking, Agoda), Messenger | Ở ba kênh này, phía OTTIMO không có nút xóa tin của khách. **Đây là ca thường**, không phải ca "không xóa được tin" ở dòng trên, nên không gọi chủ đầu tư trong 1 giờ. Làm 4 việc: (1) Trả lời bằng **bản không có vế xóa** (dưới bảng), một tin mới, không bấm Trả lời. Mọi luật ở dòng trên vẫn áp: không chép, không chụp, không chuyển tiếp, không đọc to, không gõ vào máy POS, không nhập Desk. (2) Xóa mọi bản sao xóa được: ảnh máy đã tự lưu, cả trong thùng rác ảnh; thư báo tin nhắn mà OTA hoặc Zalo gửi về email cơ sở, nếu thư có nội dung tin (xóa cả trong Thùng rác). (3) **Ghi sổ giao ca một dòng, không có số:** "hh:mm – `OTM-…` – khách gửi số thẻ qua Zalo OA / hộp thư OTA / Messenger – kênh không xóa được, đã nhờ khách thu hồi". Khách chưa có đơn: như dòng trên. Không ghi tên hay số điện thoại khách. (4) **Báo chủ đầu tư trước khi hết ca**, như dòng trên. **Không** bấm **Đánh dấu spam**, không gắn nhãn **Hoàn thành** thay cho xóa: hai thao tác này chỉ ẩn hội thoại. Không hứa với khách là tin sẽ được gỡ. Vẫn **gọi chủ đầu tư ngay, muộn nhất 1 giờ** khi gặp các ca khác ở dòng trên: số hoặc ảnh thẻ đã bị chép, chụp, chuyển tiếp, đọc to, gõ vào máy POS, Desk hay sổ giấy, hoặc người ngoài quầy đã thấy; máy giữ tin bị mất, hoặc người khác dùng máy đó trước khi xóa xong các bản sao; khách báo thẻ bị trừ tiền lạ, hoặc nghi số thẻ đã bị lộ. Zalo OA nằm ở dòng này tới khi đội báo đã xóa được tin khỏi tài khoản OA; Messenger tới khi đội báo cách xóa |
| Khách báo sẽ rời sớm | Mục 2.14a (nút **Trả sớm**, từ v1.0.2). Không hứa số hoàn. Khách thuê tháng: hỏi quản lý trước khi báo khách về ký quỹ |
| Đơn đã quá ngày đi vẫn **Đang ở**, không thấy nút **Trả phòng** | Kiểm căn, hỏi buồng phòng khách đã đi ngày nào. **Gia hạn** tới hôm nay rồi **Trả phòng**. Khách ở thật thì thu đêm thêm; khách đã đi từ trước (quên bấm) thì xin giảm 100 % đêm thêm, quản lý hoặc chủ đầu tư duyệt (mục 2.14, **Đơn quá ngày đi**) |
| Khách để quên đồ | Ghi sổ đồ thất lạc, báo quản lý với đồ giá trị |
| Khách hỏi Wi-Fi | Đọc tên mạng và mật khẩu trên thẻ Wi-Fi trong căn (trang khách chưa hiện Wi-Fi – lỗi đang sửa, sửa ở v1.0.5 hoặc v1.0.6) |
| Hoàn tác nhận phòng bị Desk từ chối | Folio đã có dòng mới; nhờ quản lý (mục 2.10, Trường hợp đặc biệt) |
| Khách muốn xem/xóa dữ liệu của mình | Ghi yêu cầu, chuyển chủ đầu tư |
| Đơn OTA về khi căn đã kín | Lưu chưa gán căn, báo quản lý; gán căn hoặc đổi phòng khách khác (mục 2.6) |
| Phím Esc không đóng khung đơn | Bấm **Đóng** (sửa ở v1.0.4) |
| Tìm đơn theo tên khách không ra | Tìm theo mã đơn, mã OTA hoặc SĐT ở **Khách hàng** (sửa ở v1.0.4) |
| Báo giá thứ Sáu 1 đêm chỉ báo "tối thiểu 2 đêm" sau khi mở hộp | Đúng quy tắc; chọn 2 đêm (chữ sửa ở v1.0.4) |
| Desk lỗi, sai tiền, không làm tiếp được | Mục 5.5 |

**Câu trả lời khi khách lỡ gửi số thẻ** (CPY viết, đội bảo mật duyệt 07/11). Sao chép từ đây, không gõ lại: dấu "–" là gạch ngang dài. Gửi một ngôn ngữ: tiếng Việt cho khách Việt, tiếng Anh cho khách khác. Gửi tin mới, không bấm Trả lời. Gửi xong thì xóa ngay tin của khách (kênh xóa được), không chờ khách thu hồi.

- Thay {name} bằng tên khách. Chưa rõ tên: "Hello," / "Chào bạn,". Khách lớn tuổi: đổi "bạn" sang "anh/chị" cho cả tin.
- Email: soạn thư mới tới địa chỉ của khách, không bấm Trả lời hay Chuyển tiếp. Tiêu đề "OTTIMO · About your message" / "OTTIMO · Về thư bạn gửi", không ghi gì về thẻ. Email và SMS bỏ câu "If your app allows, please unsend it as well." / "Nếu ứng dụng cho phép, bạn vui lòng thu hồi tin đó."
- Không thêm gì vào câu: không nhắc lại số hay loại thẻ, không giải thích rủi ro, không hứa gì thêm. Khách cần trả trước khi đến: gửi **tin riêng, sau tin này**, dùng mã VietQR Desk vừa tạo cho đúng đơn, kèm câu chống giả danh (mục 2.4).

**Bản đầy đủ** – WhatsApp, Telegram, Viber, email, SMS

EN:

> Hello {name}, thank you for getting in touch. For your security, OTTIMO does not accept card details by message or email. We will delete your message on our side straight away. If your app allows, please unsend it as well. You are welcome to pay by card at reception, or we can suggest another way to pay.

VI:

> Chào {name}, cảm ơn bạn đã liên hệ OTTIMO. Vì an toàn của bạn, OTTIMO không nhận thông tin thẻ qua tin nhắn hay email. Ở phía OTTIMO, lễ tân sẽ xóa ngay tin bạn đã gửi. Nếu ứng dụng cho phép, bạn vui lòng thu hồi tin đó. Bạn có thể thanh toán bằng thẻ qua máy POS tại quầy, hoặc chọn cách khác theo hướng dẫn của lễ tân.

**Bản ngắn** – Zalo số cơ sở

EN:

> Thank you – for your security, OTTIMO does not accept card details over chat, so we are deleting your message on our side now. If you can, please recall it too; card payments are welcome at reception, or we can suggest another way.

VI:

> Cảm ơn bạn – vì an toàn của bạn, OTTIMO không nhận thông tin thẻ qua tin nhắn, nên lễ tân sẽ xóa ngay tin bạn đã gửi ở phía OTTIMO. Nếu được, bạn vui lòng thu hồi tin; bạn có thể thanh toán bằng thẻ qua máy POS tại quầy, hoặc theo cách lễ tân hướng dẫn.

**Bản không có vế xóa** – Zalo OA, hộp thư OTA (Airbnb, Booking, Agoda), Messenger

EN:

> Thank you – for your security, OTTIMO does not accept card details by message. If you can, please recall or unsend your message; card payments are welcome at reception, or we can suggest another way.

VI:

> Cảm ơn bạn – vì an toàn của bạn, OTTIMO không nhận thông tin thẻ qua tin nhắn. Nếu được, bạn vui lòng thu hồi tin; bạn có thể thanh toán bằng thẻ qua máy POS tại quầy, hoặc theo cách lễ tân hướng dẫn.

<!-- Hai dòng "Khách lỡ gửi số thẻ" và khối câu trả lời: SEC rounds/round-05/responses/SEC-responses.md mục 6.1 (câu chốt), 6.2 (sổ giao ca), 6.3 (báo chủ đầu tư), 6.5 (16ea5183: duyệt câu CPY, xóa theo kênh, kênh không xóa được theo thiết kế là ca thường, ca bất thường số 3 sửa); DOM FB-R5-DOM-BA-01. Câu khách: CPY rounds/round-05/outputs/CPY/guest-reply-card-number.md mục 2, 3, 5, 6 (lượt 2, 195d7adf; lượt 3, 77d197a4: "at our front desk" thành "at reception"), nguyên văn, không chữ số. Cách xóa: INT rounds/round-05/outputs/INT/message-deletion-by-channel.md (40cd4651). Căn cứ SR-PAY-08, SR-PAY-10, SR-INC-01. Lượt thử T1–T6 (SEC 6.5.5) khác bảng thì BA sửa: T1 đạt thì Zalo OA về bản ngắn, chuyển lên dòng trên; INT tra xong Messenger thì làm tương tự; T2–T4 cho thấy xóa tự đồng bộ thì bỏ câu "xóa trên từng máy". -->

### 2.22 Việc riêng của lễ tân trưởng

| Việc | Xem mục |
|---|---|
| Duyệt miễn/giảm trong hạn mức (≤ 300.000 đ/lần, ≤ 1.500.000 đ/tháng) ở **Cần duyệt** | 1.8 |
| Xác nhận nhận phòng khi buồng chưa sẵn sàng | 2.10 |
| Xác nhận nâng hạng khi gán căn hoặc đổi phòng | 2.6, 2.12 |
| Kiểm phòng trên app nhân viên (căn `VC` → `VI`), xong trước 12:00 với căn có khách đến | 3.6 |
| Đổi căn cho khách sắp đến khi khách cũ ở quá 18:00 | 2.15 |
| Giữ bảng kỳ thu khách dài hạn | 2.7 |
| Giữ danh sách kênh OTA đã đăng phụ thu | 2.10 |

---

## Chương 3. Buồng phòng (HK) – app nhân viên trên điện thoại

> Trước khi bắt đầu: mỗi người một tài khoản do chủ đầu tư tạo. App dùng trên điện thoại, không cần cài từ kho ứng dụng. Buồng phòng **không thấy giấy tờ khách** – đúng thiết kế. Không chụp khách, không chụp giấy tờ.

Luôn nhớ:
- Mở **Việc**, làm từ trên xuống. Mỗi căn: **Bắt đầu dọn** → **Dọn xong**. Desk cập nhật ngay.
- Căn có khách đến hôm nay: căn trống từ đêm qua rà xong **trước 12:00**; căn khách trả rồi khách mới đến cùng ngày dọn ngay, xong **trước 14:00**.
- Khách trả phòng: đếm minibar, **báo lễ tân số còn lại** từng món.
- Hỏng hóc: **Báo sự cố** kèm ảnh chỗ hỏng (không chụp khách, giấy tờ). Gấp thì gọi lễ tân.
- Mất mạng vẫn bấm được. Trả máy hoặc nghỉ việc: **Đăng xuất**.
- **Không mở cửa căn** cho người nói mình là khách, kể cả khi họ biết tên khách. Mời ra quầy hoặc gọi lễ tân.

### 3.1 Đăng nhập và đăng xuất

1. Mở trình duyệt điện thoại, vào `staff.ottimo.vn`. (Nên chọn "Thêm vào Màn hình chính" để mở nhanh lần sau.)
2. Nhập **Tên đăng nhập**, **Mật khẩu**. Bấm **Đăng nhập**. Lần đầu: đổi mật khẩu tạm.
3. Thanh dưới có 4 mục: **Việc**, **Các căn**, **Báo sự cố**, **Tôi**. Chuông **Thông báo** ở trên.
4. Đổi ngôn ngữ: **Tôi → Ngôn ngữ giao diện** (Tiếng Việt / English).
5. Trả máy hoặc nghỉ việc: **Tôi → Đăng xuất**. Đăng xuất xóa dữ liệu đã lưu trên máy. App cảnh báo nếu còn thao tác chưa gửi.

[ẢNH: C0-09-Đăng nhập app nhân viên]
[ẢNH: C3-09-Tôi, đăng xuất]

**Đăng nhập 2 bước trên app nhân viên** (quyết định ORC 04/11, MOB P4-50):
- **App nhân viên có bước nhập mã.** Tài khoản đã bật 2 bước (chủ đầu tư, quản lý, người trực 6 vai, và ai đã bật) đăng nhập app bằng mật khẩu rồi **mã 6 số** trong ứng dụng xác thực. Mất điện thoại: **Mất điện thoại? Dùng mã khôi phục**. Sai 5 lần hoặc quá 5 phút: app báo "Bước nhập mã đã hết hạn. Đăng nhập lại bằng mật khẩu."
- **Mật khẩu tạm đổi ngay trên app**: màn **Đặt mật khẩu của bạn** (**Mật khẩu hiện tại** là mật khẩu tạm, **Mật khẩu mới**, **Nhập lại mật khẩu mới**, bấm **Lưu và vào ứng dụng**). Không cần đổi trên Desk trước.
- **Bật 2 bước chỉ làm trên Desk** (trên máy tính, quét mã bằng chính điện thoại của người đó, cất 10 mã khôi phục). App không có màn bật. Tài khoản phải có 2 bước mà chưa bật, hoặc vừa vào app bằng mã khôi phục: app báo "Tài khoản của bạn cần bật xác thực 2 bước trước khi làm việc." và "Mở OTTIMO Desk trên máy tính để bật xác thực 2 bước, rồi đăng nhập lại ở đây."
- **Ai bật 2 bước** – mặc định đội chọn (anh/chị đổi được, báo đội): **lễ tân trưởng bắt buộc**, không tự tắt; **buồng phòng, bảo trì tùy chọn**; sale nội bộ, CTV nên bật. Cách làm ở mục 1.5 bước 7.
- Người trực có vai quản lý vào được app. **Mặc định đội chọn** (anh/chị muốn giữ cách cũ thì báo đội): người trực **kiểm căn trên app** (mục 3.6), khoảng 1–2 phút mỗi căn, giữ mốc 11:00 và 14:00. Desk ghi ai kiểm, lúc nào, mục nào chưa đạt; căn chưa đạt tự có việc dọn lại. Cách tự kiểm rồi chỉ bấm **Làm xong** (`guides/02-le-tan.md` mục 13.2a) chỉ dùng khi không vào được app, và ghi sổ giao ca.
- **Đã bật 2 bước mà mất cả điện thoại lẫn mã khôi phục:** báo chủ đầu tư. Chủ đầu tư gặp tận mặt rồi **Đặt lại xác thực 2 bước** (mục 1.5). App trên mọi máy của người đó về màn đăng nhập. Người đó giữ tài khoản cũ. Tài khoản có vai chủ đầu tư hoặc quản lý: app báo "Tài khoản của bạn cần bật xác thực 2 bước trước khi làm việc." – bật lại trên Desk trước, rồi đăng nhập app với mã 6 số mới. Vai khác: đăng nhập app bằng mật khẩu, app không hỏi mã cho tới khi bật lại.

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
| Trống từ đêm qua, có khách đến hôm nay | Đầu ca sáng: rà lại căn, dọn nếu cần rồi bấm **Dọn xong**. Lễ tân trưởng kiểm xong trước **12:00** |
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
5. Bấm nhầm: bấm **Hoàn tác** trong khoảng **10 giây** sau khi bấm.

[ẢNH: C3-02-Căn, bắt đầu dọn và dọn xong]

**Sau khi chủ đầu tư đổi mật khẩu Wi-Fi:** ở lần dọn đầu của mỗi căn, thay thẻ Wi-Fi bằng thẻ mới lễ tân đưa, mang thẻ cũ về quầy, báo lễ tân để gạch sổ. Không chụp, không nhắn mật khẩu.
<!-- DOM FB-R5-DOM-BA-05 (DOM-on-ba-v105-docs.md mục 5): điểm "thẻ chào + Wi-Fi" trong lần kiểm 12 điểm (BR-808). Cùng chữ tệp 03 mục 11.2. -->

**Khách không muốn dọn hôm nay:** màn căn → **Khách không muốn dọn** → **Lý do** (**Treo biển "Không làm phiền"**, **Khách nói không cần dọn**, **Lý do khác**) → **Bỏ việc dọn hôm nay** (hoặc **Quay lại**). Lễ tân thấy lý do. Ngày mai vẫn có việc dọn như thường.

[ẢNH: C3-03-Khách không muốn dọn]

### 3.5 Các căn

**Các căn** hiện trạng thái mọi căn. Lọc: **Tất cả**, **Cần dọn**, **Có khách**, **Sạch**, **Đang sửa**. Mỗi căn ghi khách đến hôm nay/ngày mai. Buồng phòng chỉ thấy tên gọi của khách trong ngày, không thấy giá, kênh, giấy tờ.

**Từ v1.0.5:** màn căn **Khách đang ở – đã dọn** có nút **Báo cần dọn** khi app cho phép. Bấm thì căn chuyển **Khách đang ở – cần dọn** và có việc dọn. App không hỏi xác nhận. Mất mạng: thao tác chờ trong hàng đợi như các nút khác (mục 3.10).

[ẢNH: C3-04-Các căn]

### 3.6 Kiểm phòng (lễ tân trưởng)

Ở v1.0, buồng phòng **không tự kiểm** phòng mình dọn (căn của buồng phòng không có nút **Kiểm phòng**). Kiểm phòng chỉ làm trên app nhân viên (Desk không có thao tác kiểm phòng): lễ tân trưởng, chủ đầu tư, quản lý (khung dưới).

> **Áp dụng từ v1.0.4** (mặc định đội chọn; anh/chị đổi được, báo đội): chủ đầu tư, quản lý, lễ tân trưởng (kể cả người trực 6 vai) đăng nhập app bằng mã 6 số và bấm **Kiểm phòng** được. Người trực kiểm căn trên app theo các bước dưới, giữ mốc: căn trống từ đêm qua có khách đến xong **trước 11:00**; căn khách trả có khách mới cùng ngày xong **trước 14:00**; căn trống quá 3 ngày kiểm lại trong ngày khách đến. Trình tự: **Làm xong** (`VC`) → kiểm trên app → **Kiểm đạt – sẵn sàng** (`VI`). Không vào được app: kiểm bằng mắt rồi bấm **Làm xong**, ghi sổ giao ca (`guides/02-le-tan.md` mục 13.2a). Lễ tân trưởng **bắt buộc** bật 2 bước (mục 1.5 bước 7).

1. Lễ tân trưởng đăng nhập `staff.ottimo.vn` trên điện thoại bằng tài khoản của mình (mục 3.1).
2. Nhận thông báo **Căn đã dọn – chờ kiểm**. Mở căn `VC` → nút **Kiểm phòng** → màn **Kiểm phòng … · …**.
3. Đi từng mục trong danh mục (12 mục: ga gối, phòng tắm, khăn, đồ dùng, bếp, bàn làm việc, Wi-Fi, rèm/cửa sổ, mùi, remote/điều hòa/sưởi, thẻ chào…), đánh dấu khi đạt chuẩn OTTIMO. App hiện **Đã kiểm …/12 mục**.
4. Đạt hết: **Kiểm đạt – sẵn sàng**. Căn chuyển **Sẵn sàng đón khách** (`VI`).
5. Chưa đạt: **Chưa đạt** → ghi chỗ chưa đạt → **Ghi chưa đạt**. Căn quay về **Cần dọn (khách đã đi)** và có việc dọn lại.

[ẢNH: C3-05-Kiểm phòng]

Căn trống quá 3 ngày cần kiểm lại trước khi nhận khách.

Ngày lễ tân trưởng nghỉ thì **không ai kiểm được**. Lễ tân vẫn nhận khách vào căn **Đã dọn – chờ kiểm** (`VC`) như thường (điều kiện nhận phòng chấp nhận `VC`). Chủ đầu tư có thể gán thêm vai **Lễ tân trưởng** cho một lễ tân (mục 1.5).

### 3.7 Minibar

**Bổ sung minibar:** việc ghi **Bổ sung minibar: …** kèm tên món và số lượng. Bổ sung xong bấm **Làm xong**.
- **Luôn nạp đủ định mức theo bảng trong căn**, không theo số món ghi trên việc.
- Tủ thiếu nhiều hơn số trên việc: báo lễ tân **trước khi** bấm **Làm xong**.
- Lý do: bấm **Làm xong** là Desk ghi tủ đã đủ. Tủ còn thiếu thì khách sau bị tính tiền món mình không dùng.
- Lấy hàng ở kho để nạp: ghi **phiếu nạp** đặt ở kho, mỗi lần một dòng: ngày, căn, món, số lượng lấy ra. Không ghi tên khách. Hàng lấy ra mà không vào tủ (hết hạn, vỡ, hỏng, dùng khác): vẫn ghi một dòng, cột căn để "–", ghi lý do ngắn. Món hết hạn hay vỡ giữ lại vỏ hoặc chai ở kho tới lần đếm tuần.
<!-- Nguồn: DOM-on-be-prs-101-108-110.md mục 3.3 (trả lời SEC FB-R5-SEC-BE-V516-01), BR-702, BR-703. Phiếu nạp: K-MB, DOM-responses.md đề xuất (A) 2. Áp dụng ngay. Nút thật là "Làm xong" (hk.task.complete). -->

**Khi khách trả phòng:**

> **Tạm ở v1.0:** app nhân viên chưa có màn đếm minibar. Cách làm:
> 1. Lễ tân báo buồng phòng khách sắp trả căn nào.
> 2. Buồng phòng đếm tủ, báo lễ tân **số còn lại từng món** (gọi điện hoặc nói trực tiếp; nhắn tin nội bộ chỉ ghi số căn và số món, không ghi tên khách).
> 3. Lễ tân nhập ở bước **Minibar** khi trả phòng (mục 2.14).
> 4. Đếm sau khi khách đã đi mà thấy thiếu: báo lễ tân ngay, kèm ảnh tủ (chụp tủ, không chụp người). Lễ tân xử lý theo mục 1.11.

Khách đổi phòng: đếm minibar căn cũ **trước khi dọn**, báo lễ tân số còn lại từng món như trên. Báo xong thì **bổ sung đủ tủ** căn cũ khi dọn. Sau khi khách trả phòng, Desk có thể tạo việc **Bổ sung minibar** cho căn cũ: kiểm tủ, đủ thì bấm **Làm xong**.

> **Lỗi nhỏ đã biết (v1.0.3 hoặc v1.0.4):** việc **Bổ sung minibar** còn nằm dưới **Khách đang ở** sau khi khách đã trả phòng. Vẫn làm và bấm **Làm xong** như thường.

### 3.8 Bộ đồ dùng thêm

Khách vượt định mức ngủ sofa. Mỗi người thêm một bộ: 1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải, đồ vệ sinh cá nhân (không gối).
- Việc **Chuẩn bị … bộ đồ dùng thêm – căn …, trước …** → xong bấm **Đã chuẩn bị**.
- Khách đi: **Thu hồi … bộ đồ dùng thêm** → **Đã thu hồi**.
- Khách đổi phòng: **Chuyển … bộ đồ dùng thêm sang căn …** → **Đã chuyển**.

### 3.9 Báo sự cố, hỏng hóc

1. **Báo sự cố** (thanh dưới), hoặc trong màn căn: **Báo sự cố căn này**.
2. Chọn **Căn**, **Chuyện gì xảy ra?**: **Mất nước nóng**, **Điện / đèn**, **Rò nước**, **Khóa cửa**, **Đồ hỏng**, **Khác**. Tắc thoát nước hoặc Wi-Fi: chọn **Khác** và ghi rõ trong **Mô tả** (app chưa có hai loại này – đang sửa; Desk thì có).
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

Lễ tân, lễ tân trưởng đăng nhập app nhân viên cũng nhận tin giữ chỗ kèm mã đơn (mục 2.4). Tới khi v1.0.5 lên, các tin này hiện câu chung "Thông báo mới – xem chi tiết trên OTTIMO Desk". Từ v1.0.5 có câu riêng, ví dụ **Giữ chỗ chưa cọc đã hết hạn và tự hủy**. Bấm vào tin giữ chỗ không mở màn nào: gõ mã đơn vào ô tìm ở **Đơn đặt phòng** trên Desk.

[ẢNH: C3-08-Thông báo]

### 3.12 Không được làm

- Không chụp ảnh khách, giấy tờ, màn hình Desk bằng điện thoại cá nhân.
- Không gửi thông tin khách vào nhóm Zalo.
- Không gửi mã cửa qua tin nhắn. Khách hỏi mã cửa: mời khách ra quầy hoặc gọi lễ tân.
- **Không mở cửa căn** cho người nói mình là khách, kể cả khi họ biết tên khách ("tôi quên mã, mở giúp"). Mời ra quầy hoặc gọi lễ tân.
- Không dùng tài khoản của người khác, không đưa mật khẩu cho người khác.
- Không vào căn đang có khách treo biển "Không làm phiền".

---

## Chương 4. Bảo trì, sale, kế toán

### 4.1 Bảo trì (MT) – app nhân viên

> Trước khi bắt đầu: đăng nhập `staff.ottimo.vn` như mục 3.1. Thanh dưới: **Phiếu sửa**, **Các căn**, **Báo sự cố**, **Tôi**. Bảo trì không thấy tên khách.

Luôn nhớ:
- Phiếu **Gấp**: nhận việc trong **15 phút**, có phương án trong **2 giờ**.
- Bấm **Nhận việc** khi bắt đầu, **Sửa xong** kèm **ảnh sau khi sửa** khi xong.
- Phiếu có khóa phòng: chỉ khi app hiện **Đã mở bán lại căn …** thì căn mới bán được.
- Không vào căn có khách khi chưa báo trước. Không chụp khách, không chụp giấy tờ. **Không mở cửa căn** cho người nói mình là khách: mời ra quầy hoặc gọi lễ tân.
- Chốt công tơ khách dài hạn cuối tháng, có ảnh (khung cuối mục này).

**Thời hạn theo mức độ:**
| Mức | Nhận việc | Xong |
|---|---|---|
| **Gấp** | Trong **15 phút** | Có phương án trong **2 giờ** (sửa xong hoặc lễ tân đổi phòng cho khách) |
| **Trong ngày** | – | Trong **24 giờ** |
| **Không gấp** | – | Trong **3 ngày** |

**Xử lý phiếu:**
1. **Phiếu sửa**. Lọc **Đang mở**, **Gấp**, **Chờ vật tư**. Tự báo một sự cố mới: **+ Phiếu sửa mới**. Phiếu ghi căn, sự cố, hạn (**Nhận việc trước … – còn … phút**, **Quá hạn … phút**).
2. Mở phiếu. Xem **Ảnh lúc báo**, **Người báo**, **Nhật ký phiếu**.
3. Bấm **Nhận việc**.
4. Thiếu vật tư: **Chờ vật tư** → hộp **Chờ vật tư – WO-…**: **Cần vật tư gì?**, **Ngày dự kiến có vật tư** → **Lưu – chờ vật tư** (hoặc **Quay lại**). Hạn tạm dừng tới ngày đó (phiếu Gấp không dừng hạn). Có vật tư: **Sửa tiếp**.
5. Sửa xong: **Sửa xong** → hộp **Sửa xong WO-…**: **Đã làm gì?** → **Ảnh sau khi sửa** (bắt buộc với Gấp và Trong ngày) → **Xác nhận sửa xong**.
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

**Chốt công tơ khách dài hạn:**

> **Tạm ở v1.0 (tới v1.3):** Desk chưa có màn chốt công tơ.
> - Người chốt: ______ (chủ đầu tư ghi theo phân công hiện nay của OTTIMO).
> - Ngày chốt: ngày cuối tháng, lệch tối đa 2 ngày. Ngày cụ thể: ______.
> - Chụp ảnh công tơ điện, nước từng căn có khách dài hạn. Chỉ chụp công tơ; không chụp khách, không gửi nhóm Zalo.
> - Ghi chỉ số, ngày, người chốt vào sổ; đưa số cho lễ tân trưởng/chủ đầu tư tính tiền (mục 2.7).
> - Kỳ tháng 10/2026 chốt ngày 31/10 trong sổ cũ.

### 4.2 Sale nội bộ (SAL) và CTV / môi giới

> Trước khi bắt đầu: đăng nhập `desk.ottimo.vn` (điện thoại hoặc máy tính). Desk mở **Báo giá & giữ chỗ**. Sale/CTV chỉ thấy đơn và khách **của mình**; không thấy giấy tờ, không đặt đơn đã đảm bảo trực tiếp.

Luôn nhớ:
- Báo giá giữ giá **3 ngày**. Giữ chỗ chưa cọc thì Desk **tự hủy** khi hết hạn (ở v1.0, giữ chỗ có yêu cầu giảm giá/FOC thì người trực quầy hủy tay).
- Tới v1.0.3: giữ chỗ của bạn quá hạn, người trực quầy sẽ nhắn bạn. Liên hệ khách và trả lời trong **1 giờ**; quá 1 giờ, hoặc đã 11:00 ngày đến, người trực gọi thẳng khách (mục 2.4).
- Nội dung chuyển khoản luôn là **mã đơn**. CTV không gửi mã VietQR và không xác nhận cọc.
- Không hứa giá, khuyến mãi hay chính sách hủy khác với Desk.
- Không chụp, không xin ảnh giấy tờ của khách. Lễ tân lo giấy tờ khi khách đến.
- Khách ở từ 30 đêm, khách đến hôm nay: nhắn lễ tân.

**Menu:** **Báo giá & giữ chỗ** (tab **Căn trống**, **Báo giá**), **Đơn của tôi**, **Khách của tôi**. Sale nội bộ có thêm **Yêu cầu từ website**.

**Báo giá và giữ chỗ:** làm như mục 2.4 bước Báo giá và Giữ chỗ.
- Báo giá hiện **Bạn nhận (…% tiền phòng – BR-903)** (CTV) hoặc **Sale nhận (…% tiền phòng – BR-903)** (sale): Desk tự điền theo tỷ lệ chủ đầu tư cài.
- Tin có số tiền hoặc mã VietQR: chỉ gửi mã **Desk tạo cho đúng đơn**, kèm câu chống giả danh ở mục 2.4. Không gửi ảnh QR cũ, không gõ số tài khoản bằng tay.
- Giữ chỗ của mình: khung đơn có **Hủy giữ chỗ** và **Gia hạn giữ chỗ (1 lần)**.
- Báo giá hết hiệu lực (3 ngày): **Gửi quản lý gia hạn**, hoặc **Lập báo giá mới**.
- Số giữ chỗ mở cùng lúc: CTV tối đa 3, sale tối đa 5.
- Khách ở từ 30 đêm: hợp đồng dài hạn vẫn làm ngoài app; nhắn lễ tân giữ phòng bằng đơn dài hạn nhập tay.
- Khách đến **hôm nay**: nhắn lễ tân tạo đơn đã thu cho khách.

[ẢNH: C4-06-Báo giá trên điện thoại]

**Cọc:**
- **Sale nội bộ**: gửi mã VietQR **Desk tạo** cho khách (mục 2.4). Mã hiện "Tài khoản nhận vừa đổi": chưa gửi, gọi chủ đầu tư. Kiểm tiền về theo **mục 2.13** (hỏi chủ đầu tư/quản lý, kèm mã đơn và số tiền) rồi mới **Xác nhận đã nhận cọc**. Ảnh chụp của khách không thay xác nhận. Khoản do sale ghi ở trạng thái chờ đối soát; quản lý đối soát trong ngày.
- **CTV**: không gửi QR, không xác nhận cọc. Nhắn lễ tân hoặc sale nội bộ gửi mã VietQR. Khách báo đã chuyển: mở đơn → **Báo đã chuyển cọc** → **Số tiền khách chuyển**, **Ghi chú**, **Đính kèm ảnh biên nhận** (không bắt buộc; JPG, PNG, WebP, tối đa 10 MB) → gửi. Lễ tân hoặc sale nội bộ kiểm sao kê rồi xác nhận.
- Tiền mặt sale/CTV thu hộ: nộp quầy. Lễ tân bấm **Đã nhận tiền mặt** ở **Nhật ký tiền → Chờ đối soát**. Hoa hồng thành "đạt" sau khi khoản này được đối soát.

[ẢNH: C4-07-Báo đã chuyển cọc]

**Đơn của tôi:** xem trạng thái đơn mình chốt. Đơn còn hiệu lực có dòng **Hoa hồng dự kiến của bạn** (đơn đã hủy thì không có).

[ẢNH: C4-08-Đơn của tôi, hoa hồng dự kiến]

> **Tạm ở v1.0:** chưa có màn hoa hồng theo đợt chi (dự kiến v1.3), bảng theo dõi khách tiềm năng (chưa xếp lịch), mẫu tin nhắn (dự kiến v1.2). Sale/CTV không cấp hay gửi link check-in online; lễ tân gửi (mục 2.9). Khách của bạn hỏi link: nhắn lễ tân mã đơn `OTM-…`.

### 4.3 Kế toán

> Ở v1.0 **không có vai "Kế toán" riêng** trên Desk. Việc kế toán do chủ đầu tư hoặc quản lý làm trên Desk, kế toán ngồi cùng hoặc nhận số liệu từ chủ đầu tư. Cách cấp quyền cho kế toán đang chờ chủ đầu tư quyết; đội đề xuất: tuần đầu kế toán chưa có tài khoản, từ v1.1 có vai **Kế toán** chỉ xem tiền và đối soát chuyển khoản (không xem giấy tờ khách, không duyệt, không sửa giá).
<!-- Chờ ESC-038 (đề xuất đã đổi theo DOM thẻ 23: A tuần đầu, C ở v1.1). -->

**Mốc chuyển sổ (ngày D = 02/11/2026):**
- Doanh thu phòng **đêm trước D** theo sổ cũ; **từ đêm D** theo Desk. Không đêm nào nằm ở cả hai sổ.
- Cọc, tiền đã thu trước D được nhập vào Desk: Nhật ký tiền ghi **ngày nhập (D−1)**, ngày thu thật nằm ở ghi chú. Đây là **số chuyển sổ**, không phải tiền thu mới.
- Ký quỹ dài hạn và công nợ cũ (khách đã đi trước D) **ở lại sổ kế toán**, không nhập Desk.
- Chi tiết: hướng dẫn chuyển đổi ngày đầu, mục "Kế toán" (chủ đầu tư giữ).

**Đối chiếu thu chi hằng ngày** (chủ đầu tư/quản lý làm, kế toán cùng xem):
1. **Nhật ký tiền → Nhật ký thao tác tiền**, lọc **Từ ngày** – **Đến ngày** là hôm qua.
2. Cộng theo cách thanh toán: tiền mặt (so két và sổ giao ca), chuyển khoản/VietQR (so sao kê), thẻ POS (so phiếu tổng kết máy POS), **Đã thu qua OTA** (so báo cáo kênh).
3. Tab **Chờ đối soát**: khớp chuyển khoản với sao kê (mục 1.12). Khoản chuyển khoản lễ tân ghi ban đêm phải được đối soát trước 09:00 (mục 2.13).
4. Tab **Hoàn tiền**: kiểm khoản hoàn đã chi có chứng từ.
5. Dòng **Điều chỉnh**, **Đảo giao dịch**, **Miễn phí / giảm giá**, **Ghi công nợ**: đọc lý do; hỏi người làm nếu chưa rõ.

**Sổ giấy 3 ngày đầu (02, 03, 04/11):**
- Lễ tân ghi song song mọi đơn mới và mọi khoản thu vào sổ giấy.
- 22:00 mỗi tối: lễ tân ca tối so sổ giấy với Desk; chủ đầu tư nhận kết quả qua điện thoại. Lệch thì ghi lại, chủ đầu tư gõ `/feedback` **chỉ kèm mã đơn**, không ghi tên khách (mục 0.8 điểm 9); sáng hôm sau lễ tân trưởng và chủ đầu tư xử lý. Không sửa tay lung tung.
- Sáng 05/11: chủ đầu tư quyết **bỏ sổ giấy** nếu 3 tối liền khớp. Sổ giấy hết dùng thì cất két cùng chứng từ kế toán (mục 0.9).

**Hóa đơn GTGT:**
> **Tạm ở v1.0:** xuất ngoài Desk như hiện nay.
> - Mỗi ngày kế toán nhận từ sổ giao ca **danh sách mọi phiếu thanh toán đã cấp**: số phiếu, mã đơn, tổng tiền, cách thu, có/không lấy hóa đơn công ty (mục 2.16).
> - Khách lấy hóa đơn công ty: chủ đầu tư/quản lý mở đơn → **Xem Phiếu thanh toán** để lấy tên công ty, mã số thuế, địa chỉ, email, số tiền.
> - **Ngày hóa đơn là ngày trả phòng.**
> - Hóa đơn cho khách lẻ không lấy hóa đơn, và hóa đơn cho đơn OTA đã trả trước: **kế toán xác nhận cách lập** (đang hỏi chủ đầu tư cùng câu về quyền của kế toán).
> - Giá niêm yết đã gồm VAT 8 %. Mức thuế từ 01/01/2027 chờ kế toán xác nhận.
<!-- PHÁP LÝ – cần kế toán xác nhận (DOM thẻ 09): hóa đơn cho khách lẻ không lấy hóa đơn – câu phụ trong ESC-038. VAT 2027: ESC-033. -->

**Báo cáo tháng:**
> **Tạm ở v1.0:** chưa có báo cáo tháng, kênh, FOC, xuất bảng tính (dự kiến v1.2). Cuối tháng dùng **Nhật ký tiền** lọc cả tháng, ghi tổng theo cách thanh toán. Phí kênh OTA tạm theo tỷ lệ đã đặt (Airbnb 15,5 %, Booking 15 %, Agoda 18 %, Expedia 18 %, Trip.com 15 %).

**Đóng ca, tiền mặt:** theo mục 1.14 (sổ giao ca có chữ ký).

---

## Chương 5. Phụ lục

### 5.0 Từ ngữ trên Desk

| Từ | Nghĩa |
|---|---|
| **Folio** | Bảng tiền của một lượt ở: tiền phòng, phát sinh, miễn giảm, đã thu, còn phải thu |
| **Phiếu thanh toán** (bill) | Bản in/xem của folio khi trả phòng, có số phiếu |
| **Phát sinh** | Khoản thêm ngoài tiền phòng: giặt ủi, đồ ăn, minibar, phí phạt |
| **FOC** | Miễn phí một khoản (free of charge). Cần lý do, có hạn mức theo vai |
| **Giảm giá đặc biệt** | Giảm tiền phòng dưới giá chính sách, phải được duyệt |
| **Hạn mức** | Số tiền tối đa một vai được tự miễn hoặc duyệt mỗi lần, mỗi tháng |
| **Sàn – trần** | Giá thấp nhất và cao nhất được phép nhập cho một căn |
| **Giá niêm yết** | Giá đêm ngày thường, kênh Trực tiếp, chủ đầu tư nhập ở **Danh mục căn** |
| **Định mức / tối đa** | Số người đã gồm trong giá / số người nhiều nhất căn nhận (người thêm ngủ sofa) |
| **Kênh** | Nơi khách đặt: Trực tiếp, CTV/môi giới, OTA, Nội bộ |
| **OTA** | Trang đặt phòng trực tuyến: Booking.com, Agoda, Airbnb, Expedia, Trip.com |
| **Extranet** | Trang quản lý của từng OTA, nơi đóng/mở phòng và xem đơn |
| **Giữ chỗ** | Đơn chưa cọc, giữ căn trong một thời hạn, hết hạn thì tự hủy |
| **Cọc** | Tiền khách trả trước để chắc chỗ (30 % tiền phòng) |
| **VietQR** | Mã QR chuyển khoản đúng số tiền, nội dung là mã đơn |
| **Đối soát** | Khớp một khoản chuyển khoản trên Desk với sao kê ngân hàng |
| **Chờ đối soát** | Khoản ghi là đã thu nhưng quản lý chưa khớp sao kê |
| **Công nợ** | Tiền khách còn nợ sau khi đã trả phòng |
| **Bút toán / Điều chỉnh** | Ghi thêm dòng sửa trên folio đã chốt; dòng cũ không bị xóa |
| **Đảo giao dịch** | Ghi một giao dịch ngược để hủy khoản thu ghi nhầm |
| **Ngày kinh doanh** | Ngày trên Desk, đổi lúc 06:00 (mục 0.6) |
| **Khai báo lưu trú** | Báo khách lưu trú với công an trên cổng khai báo, có hạn (mục 2.11) |
| **Máy được cấp quyền** | Máy quầy chủ đầu tư cho phép xem giấy tờ khách (mục 0.5) |
| **Xác thực 2 bước** | Đăng nhập thêm mã 6 số trong ứng dụng trên điện thoại (mục 0.3) |
| **Bảo mật tài khoản** | Trang mở từ menu dưới tên của mình: khối Xác thực 2 bước và khối Email nhận thông báo bảo mật (mục 0.2; trước v1.0.3 tên là Xác thực 2 bước) |
| **Email nhận thông báo bảo mật** | Email riêng, chỉ người đó đọc, nhận thư báo của OTTIMO; bắt buộc với chủ đầu tư, quản lý. Không dùng hộp thư chung; Desk chặn `info@` và `booking@` (mục 0.3a) |
| **Security notice (Thông báo bảo mật)** | Thư OTTIMO gửi khi có mã khôi phục được dùng, 2 bước bị đặt lại, email đổi. Thư về tài khoản nhận chuyển khoản: ở v1.0.3 tiêu đề là "Notice: …" (không có chữ Security notice); từ v1.0.4 là "Security notice: receiving account update", gửi cả khi đặt lẫn khi hủy lịch đổi. Không có link, không hỏi mã. Cách xử lý: bảng **Thư nào – làm gì** (mục 0.3a) |
| **`VD`, `CL`, `VC`, `VI`, `OC`, `OD`, `OOO`** | Trạng thái buồng (mục 3.2) |
| **Khóa phòng** | Căn tạm không bán để sửa chữa |
| **Desk tập** | Bản Desk dùng để tập, dữ liệu giả, không chuyển tiền thật (mục 5.8) |

### 5.1 Bảng giờ

| Giờ | Việc |
|---|---|
| **06:00** | Ngày mới trên Desk. Trước 06:00 vẫn là ngày hôm trước |
| 07:00 | Lễ tân bắt đầu trả lời yêu cầu của khách; Desk chuyển căn có khách sang "cần dọn" |
| Sáng (từ 08:00) | Nhắn khách đi hôm nay xác nhận giờ trả |
| **12:00** | **Giờ trả phòng.** **Nhận phòng từ 12:00** nếu căn `VC`/`VI`, không phụ thu. Hạn lễ tân trưởng kiểm xong căn trống từ đêm qua có khách đến |
| 12:30 | Hết ân hạn trả muộn (chỉ khi căn không có khách đến cùng ngày) |
| **14:00** | Mọi căn có khách đến hôm nay **chắc chắn sẵn sàng**. Mốc chuyển sổ ngày D |
| 15:00 | Trả muộn từ 30 % lên 50 %. Khách dài hạn trả tới 15:00 không phụ thu (nếu không có khách đến) |
| **18:00** | Gọi khách chưa đến. Sau 18:00 trả phòng: thêm 1 đêm, hoặc phụ thu bằng giá 1 đêm nếu căn đã bán |
| Trước 21:00 | **Khách đi** hôm nay không còn căn chưa trả phòng (mục 2.1, cuối ca bước 1). Nhắn khách đi ngày mai xác nhận giờ trả. Sau 21:00 không nhắn khách |
| 22:00 | Chép danh sách khách đến/đi ngày mai (mục 0.9); ghi công suất đêm. Ba ngày đầu: đối chiếu sổ giấy với Desk |
| **23:00** | Đánh dấu "Không đến" nếu vẫn không liên lạc được. Hạn khai báo khách Việt Nam (đến từ 23:00: trước 08:00 hôm sau; hạn khai báo theo giờ đồng hồ thật) |
| 09:00 | Quản lý đối soát xong khoản chuyển khoản ghi ban đêm |
| +12 giờ từ giờ nhận | Hạn khai báo khách nước ngoài |
| +24 giờ từ trả phòng | Hạn ghi phát sinh sau trả phòng; hạn quản lý xem lại phụ thu bằng giá 1 đêm |

### 5.2 Bảng tiền và quy tắc

Tham số ngày 27/10/2026. Giá, giảm theo số đêm, dài hạn, nhận sớm và phụ thu người theo bảng giá 01/11 và ESC-045, áp dụng từ ngày chủ đầu tư chuyển giá.

| Mục | Giá trị |
|---|---|
| Phụ thu nhận sớm | 06:00–09:59: 50 % · 10:00–10:59: 30 % giá đêm đầu · từ 11:00: 0 · trước 06:00: thêm 1 đêm |
| Phụ thu trả muộn | đến 12:30 (không có khách đến): 0 · đến 15:00: 30 % · đến 18:00: 50 % giá đêm cuối · sau 18:00: thêm 1 đêm hoặc bằng giá 1 đêm |
| Cuối tuần, ngày đặc biệt | Một giá mọi đêm, kể cả thứ Sáu, thứ Bảy, lễ, Tết (ESC-045, từ ngày chủ đầu tư chuyển giá; mọi kênh). Ngày đặc biệt (vẫn ở tối thiểu 2 đêm, không hoàn cọc khi hủy): đêm 24/12/2026–01/01/2027, Tết đêm 05–10/02/2027, Giỗ Tổ đêm 16/4/2027, đêm 30/4 và 1/5/2027, đêm 1/9 và 2/9/2027 |
| Kiểm sau khi chuyển giá | Báo giá thử một Studio, ngày đến thứ Sáu, 2 đêm, 2 người lớn: phải ra 1.600.000. Ra số khác: dừng, báo quản lý, không tự sửa giá. Tới v1.0.3, đêm thứ Sáu, thứ Bảy cột **Nguồn giá** vẫn ghi "Lịch giá: thứ Sáu/thứ Bảy +15% (BR-104)": nhãn cũ, đọc số trong ô giá. Từ v1.0.4 không còn nhãn này. |
| Tối thiểu số đêm | 2 đêm khi ngày đến là thứ Sáu, thứ Bảy, ngày đặc biệt |
| Giảm theo số đêm | Không giảm theo số đêm · từ **30 đêm** là thuê tháng (hợp đồng) |
| Cọc ngắn ngày | 30 % tiền phòng · đơn Trực tiếp thu đủ khi nhận phòng |
| Giữ chỗ | 12/24/48 giờ (mặc định 24), không quá 12:00 ngày đến, gia hạn 1 lần tối đa 24 giờ · báo giá giữ giá 3 ngày |
| Hủy (Trực tiếp, CTV) | Báo trước ≥ 7 ngày hoàn 100 % cọc · 3–6 ngày 50 % · < 3 ngày không hoàn · có đêm ngày đặc biệt: không hoàn · bất khả kháng: dời ngày trong 3 tháng |
| Trả phòng sớm | Báo trước từ 1 ngày: hoàn 50 % tiền phòng các đêm chưa ở · báo trong ngày rời: không hoàn tiền phòng · phụ thu người các đêm bỏ hoàn 100 % (cả hai trường hợp) |
| Phụ thu người vượt định mức | Từ 6 tuổi trở lên 150.000 đ/đêm (trẻ 6–11 tuổi tính như người lớn, ESC-045) · dưới 6 tuổi miễn |
| Dịch vụ, phí | Dọn phòng lẻ 100.000 đ · giặt ủi 30.000 đ/kg (tạm) · khử mùi thuốc lá 500.000 đ · mất/hỏng thẻ 200.000 đ/thẻ (tối đa 2 thẻ/đơn) |
| Khách dài hạn | Điện theo đơn giá trên hợp đồng (mức 5.000 đ/kWh chờ kế toán xác nhận) · nước 100.000 đ/người/tháng theo ngày ở (tính tay ở v1.0) |
| Hạn mức miễn phí | Lễ tân tự miễn minibar ≤ 100.000 đ/lần, ≤ 500.000 đ/tháng · lễ tân trưởng ≤ 300.000 đ/lần, ≤ 1.500.000 đ/tháng · quản lý ≤ giá 1 đêm/lần · chủ đầu tư không giới hạn |
| Công nợ | Hạn mặc định 3 ngày |
| Giá | Đã gồm VAT 8 % |

Nhận sớm từ 11:00 không phụ thu (bảng giá 01/11) áp dụng từ ngày chủ đầu tư chuyển giá. Sau ngày đó Desk còn tính phụ thu cho giờ 11:00–11:59: báo quản lý.
<!-- ESC-035 đã chốt; BR-411 v0.5.0 (bảng giá INV 01/11). BR-107, BR-108 v0.5.0/v0.5.1. -->

### 5.3 Bảng quyền theo vai (rút gọn)

✔ = làm được · D = gửi, chờ duyệt · M = chỉ của mình · – = không

| Việc | Chủ đầu tư | Quản lý | Lễ tân trưởng | Lễ tân | Buồng phòng | Bảo trì | Sale nội bộ | CTV |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Báo giá, giữ chỗ | ✔ | ✔ | ✔ | ✔ | – | – | M | M |
| Tạo đơn đã đảm bảo, đơn OTA, dài hạn nhập tay | ✔ | ✔ | ✔ | ✔ | – | – | – | – |
| Xác nhận cọc | ✔ | ✔ | ✔ | ✔ | – | – | M | – |
| Đổi căn/ngày, hủy, không đến | ✔ | ✔ | ✔ | ✔ | – | – | M (hủy) | M (hủy giữ chỗ) |
| Nhận phòng (máy được cấp) | ✔ | ✔ | ✔ | ✔ | – | – | – | – |
| Nhận phòng khi buồng chưa sẵn sàng | ✔ | ✔ | ✔ | D | – | – | – | – |
| Hoàn tác nhận phòng | ✔ | ✔ | – | – | – | – | – | – |
| Xem giấy tờ, khai báo lưu trú (máy được cấp) | ✔ | ✔ | ✔ | ✔ | – | – | – | – |
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
| Kiểm phòng (VC → VI) trên app nhân viên | – | – | ✔ | – | – | – | – | – |
| Báo sự cố | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | – | – |
| Xử lý phiếu sửa, khóa phòng | ✔ | ✔ | ✔ | ✔ | – | ✔ | – | – |
| Mở khóa phòng không qua phiếu | ✔ | ✔ | – | – | – | – | – | – |
| Sửa giá căn, tham số vận hành | ✔ | ✔ | – | – | – | – | – | – |
| Sửa hạn mức FOC, hoa hồng, phí kênh, tham số bảo mật | ✔ | – | – | – | – | – | – | – |
| Người dùng & vai, thiết bị được cấp, tài khoản nhận tiền | ✔ | – | – | – | – | – | – | – |
| Xem Nhật ký tiền | ✔ | ✔ | M | M | – | – | – | – |

<!-- Nguồn đầy đủ: `product/docs/rbac-matrix.md`. -->

### 5.4 Câu hỏi thường gặp

**Vì sao 01:00 sáng Desk vẫn hiện ngày hôm qua?** Ngày trên Desk đổi lúc 06:00 (mục 0.6).

**Vì sao tôi không thấy ảnh giấy tờ?** Máy chưa được cấp quyền, hoặc vai của anh/chị không được xem (buồng phòng, bảo trì, sale), hoặc ảnh đã tự xóa theo hạn lưu.

**Quản lý ở xa, tôi cần duyệt gấp thì sao?** Quản lý duyệt trên laptop/máy riêng ở **Cần duyệt**. Ở v1.0 chưa có xác nhận trên điện thoại. Không đọc mật khẩu qua điện thoại.

**Khách hỏi phòng sẵn sàng lúc mấy giờ?** "Nhận phòng từ 12:00, phòng luôn sẵn sàng lúc 14:00."

**Khách chuyển khoản nhưng tôi không xem được tài khoản ngân hàng?** Ban ngày (07:00–22:00) gọi hoặc nhắn chủ đầu tư/quản lý qua số đã lưu trong danh bạ điện thoại cơ sở, kèm mã đơn và số tiền; chỉ bấm khi người đó trả lời đúng mã đơn và số tiền. Ban đêm mời khách trả tiền mặt hoặc thẻ; khách chỉ chuyển khoản được thì ghi **Chuyển khoản** (tay) với mã giao dịch, ghi sổ giao ca để quản lý đối soát trước 09:00 (mục 2.13). Ảnh chụp hay SMS báo tiền khách đưa xem không thay sao kê.

**Khách hỏi chính sách hủy?** Đọc mục 2.8. Đơn có đêm ngày đặc biệt (Tết, lễ) không hoàn cọc khi hủy. Không hứa khác Desk.

**Khách hỏi xin gửi mã cửa qua Zalo?** Không gửi. Trả lời bằng câu ở mục 2.21. Đơn đủ điều kiện thì đọc tại quầy, hoặc lễ tân **tự gọi ra** số trên đơn (mục 2.10). Không đọc mã trong cuộc gọi khách gọi đến.

**Mã VietQR có đúng tài khoản không?** Mã luôn trỏ về tài khoản chủ đầu tư đặt. Nếu mã hiện cảnh báo "Tài khoản nhận vừa đổi": **chưa cho khách chuyển**, gọi chủ đầu tư xác nhận trước (mục 2.13).

**Tôi lỡ bấm sai một khoản thu?** Báo quản lý **Đảo giao dịch**. Lễ tân không xóa được giao dịch.

**Khách muốn bill bản giấy hoặc gửi qua Zalo?** Bấm **In phiếu** (mục 2.14 bước 3). Bản điện tử: **Lưu dưới dạng PDF** trong hộp in, gửi riêng 1–1 từ tài khoản của OTTIMO. Không chụp màn hình phiếu gửi qua chat.

**Khách hỏi Wi-Fi?** Đọc thẻ Wi-Fi trong căn. Desk chưa có ô nhập Wi-Fi, trang khách ghi "hỏi lễ tân" (sửa ở v1.0.5 hoặc v1.0.6, mục 1.4).

**Khách hỏi: lễ tân nói lưu ảnh N ngày, sao tờ thông báo ghi 3 tháng?** Hai số đều đúng. Trả lời:
- EN: "Your photos are deleted N days after check-out. The 3 months on the notice covers all ID details, including those saved for your next stay."
- VI: "Ảnh anh/chị đồng ý lưu sẽ xóa sau N ngày kể từ khi trả phòng. Mốc 3 tháng trên tờ thông báo áp cho mọi thông tin giấy tờ, kể cả thông tin lưu sẵn cho lần ở sau."
- Khách hỏi tiếp: chỉ đoạn 3 của tờ (có ý bản sao lưu). Không hứa "xóa ngay", không nói "dài nhất".

**Đơn OTA mới về nhưng Desk không tự có?** Đúng ở v1.0. Lễ tân nhập tay ngay và đóng phòng trên các kênh khác.

**Tôi đổi giá nhưng đơn cũ không đổi?** Đúng. Đơn, báo giá đã tạo trước lúc lưu giá mới giữ giá lúc tạo. Đơn, báo giá tạo sau lúc lưu cho các đêm từ ngày hiệu lực trở đi lấy giá mới (mục 1.3).

**Tại sao đổi tài khoản nhận tiền không có hiệu lực ngay?** Chống tráo tài khoản. Sớm nhất từ ngày kinh doanh kế tiếp.

**Buồng phòng bấm khi mất mạng có mất không?** Không. Thao tác lưu trên máy, tự gửi khi có mạng. Đừng xóa dữ liệu trình duyệt.

**Desk báo "Phiên đăng nhập đã hết"?** Đăng nhập lại; thông tin đang nhập vẫn được giữ trên máy đó.

### 5.5 Khi có sự cố – liên hệ ai

| Sự cố | Báo ai | Trong lúc chờ |
|---|---|---|
| Mất mạng tại quầy | Lễ tân trưởng | 4G điện thoại cơ sở → Desk trên điện thoại cơ sở → danh sách khách đến/đi chép tối qua + sổ giấy (mục 0.9) |
| Mất điện | Lễ tân trưởng → quản lý | Khóa cửa chạy pin vẫn mở bằng mã/thẻ. Đi một vòng các căn có khách, ưu tiên khách có trẻ nhỏ, người lớn tuổi. Báo khách thời gian dự kiến (nếu biết). Máy quầy chạy pin, dùng 4G điện thoại cơ sở, ghi sổ giấy. Mất điện riêng một căn có khách: báo sự cố mức **Gấp**, đổi phòng nếu cần. Quá 4 giờ: quản lý báo chủ đầu tư, quyết đổi phòng hoặc bù (**Bù sự cố**) |
| Desk báo lỗi, không đặt / nhận / trả phòng / thu tiền được, hoặc **sai tiền** | Lễ tân trưởng → quản lý → chủ đầu tư. Chủ đầu tư gõ `/feedback` với chữ **"P0"** ở đầu, **chỉ ghi mã đơn**, không ghi tên khách – đội sửa trong ngày | Ghi sổ giấy, nhập bù khi Desk chạy lại |
| Lỡ bấm **Lưu thay đổi** ở `weekend_nights` hoặc `min_stay` (tới khi v1.0.5 lên), hoặc mọi báo giá trên Desk báo lỗi | Người lưu → chủ đầu tư ngay. Chủ đầu tư gõ `/feedback` với chữ **"P0"** ở đầu: tên dòng tham số, giờ lưu, **Hiệu lực từ** | Không lưu lại khi đội chưa hướng dẫn. Ghi sổ giấy đơn, báo giá chưa làm được, nhập bù khi Desk chạy lại (mục 1.4) |
| Lỗi nhỏ, chữ sai, góp ý | Chủ đầu tư gõ `/feedback <mô tả>` | Làm tiếp; bản vá hằng tuần thứ Tư 09:30–10:30 |
| Quên mật khẩu, mất điện thoại, tài khoản bị khóa | Chủ đầu tư | – |
| Khách khiếu nại về dữ liệu cá nhân | Chủ đầu tư | Ghi lại yêu cầu, không hứa |
| Hỏng hóc trong căn | Báo sự cố trên app; Gấp thì gọi bảo trì và lễ tân | Đổi phòng cho khách nếu cần |
| Nghi lộ mật khẩu hoặc tài khoản lạ đăng nhập | Chủ đầu tư ngay | Chủ đầu tư **Đặt lại mật khẩu** người đó (Desk đăng xuất người đó trên mọi máy) hoặc **Khóa tài khoản** (mục 1.5) |
| Mã VietQR hiện "Tài khoản nhận vừa đổi" mà chưa nghe chủ đầu tư nói | Gọi chủ đầu tư ngay | Chưa cho khách chuyển; mời trả tiền mặt hoặc thẻ |
| Mất điện thoại hoặc máy tính bảng có app khóa cửa | Chủ đầu tư ngay | Chủ đầu tư đổi mật khẩu app khóa, thu hồi quyền máy đó |

**Không gửi mã cửa bằng chữ hay ảnh**, kể cả khi đang có sự cố: đọc tại quầy hoặc tự gọi ra số trên đơn (mục 2.10).

Khi báo lỗi: theo **mục 0.8 điểm 9** – mô tả bằng lời **căn, mã đơn, giờ, đã bấm gì, Desk báo gì**, và **mã tham chiếu** Desk hiện trong câu báo lỗi. Không ghi tên, SĐT, email, số giấy tờ của khách. Không chụp màn hình có dữ liệu khách để gửi đội.

### 5.6 Chưa có ở v1.0 và cách làm tạm

| Chưa có | Bản dự kiến | Cách làm tạm |
|---|---|---|
| Quản lý xác nhận từ xa trên điện thoại | v1.1 | Duyệt ở **Cần duyệt** bằng tài khoản của mình |
| Kết nối OTA tự động | v1.1 | Nhập tay ngay, đóng phòng trên extranet |
| Mã cửa trên app, báo tự động khi khách quá giờ trả | v1.1 | Tạo mã trên app khóa như hiện nay; lễ tân theo dõi giờ trả ở **Hôm nay** |
| Bảng dự phòng in sẵn khi mất mạng | v1.1 | Chép tay danh sách khách đến/đi ngày mai lúc 22:00; sổ giấy 3 ngày đầu |
| Giữ ngày kết thúc HĐ khi gia hạn đơn dài hạn nhập tay | v1.0.4 | Tới khi v1.0.4 lên: ghi ngày kết thúc HĐ vào bảng kỳ thu và sổ giao ca trước khi gia hạn (mục 2.12, 2.14a) |
| "Chấp nhận cọc thiếu" trên Desk | v1.0.3 | Xin khách chuyển đủ trước hạn; không được thì giữ đơn và làm lại khi khách đến (mục 2.4) |
| Danh sách giá đã lên lịch, nút hủy giá đã lên lịch | Có từ v1.0.2 | Tới khi v1.0.2 lên: ghi sổ mỗi lần lên lịch giá (mục 1.3) |
| Thông báo tiền chuyển khoản về tại quầy | Đang chờ chủ đầu tư quyết | Hỏi chủ đầu tư/quản lý; ban đêm mời trả tiền mặt/thẻ (mục 2.13) |
| Đơn nhóm nhiều căn | Chưa xếp lịch | Mỗi căn một đơn (mục 2.5a) |
| Chấm công qua Wi-Fi | v1.1 | Như hiện nay |
| Báo cáo tháng, kênh, FOC; xuất dữ liệu | v1.2 | **Nhật ký tiền** lọc theo kỳ |
| Mẫu tin, lịch nhắn khách, Zalo OA | v1.2 | Nhắn tay bằng câu chuẩn, 08:00–21:00 |
| Hoa hồng theo đợt chi | v1.3 | Xem **Hoa hồng dự kiến** trên đơn; chủ đầu tư chi như hiện nay |
| Bảng theo dõi khách tiềm năng | Chưa xếp lịch | Như hiện nay |
| Mẫu in bill chính thức, xuất PDF từ Desk, gửi bill qua email/Zalo | v1.2 | **In phiếu** qua hộp in của trình duyệt, hoặc **Lưu dưới dạng PDF** rồi gửi riêng 1–1 (mục 2.14) |
| Hợp đồng dài hạn đủ vòng (ký quỹ, kỳ thu, điện nước, chốt công tơ) | v1.3 | **Đơn dài hạn nhập tay** + bảng kỳ thu + sổ (mục 2.7, 4.1) |
| Hóa đơn điện tử | v1.3 | Xuất ngoài Desk |
| Đóng ca | v1.3 | Sổ giao ca có quỹ lẻ và chữ ký (mục 1.14) |
| Khách tự gửi yêu cầu về dữ liệu cá nhân | v1.3 | Chủ đầu tư xử lý tay |
| Đếm minibar trên app buồng phòng | Chưa xếp lịch | Buồng phòng báo số, lễ tân nhập |
| Vai "Kế toán" riêng | Đang chờ chủ đầu tư quyết (đội đề xuất v1.1) | Chủ đầu tư/quản lý làm cùng kế toán (mục 4.3) |

**Lỗi đang sửa** (đội đã biết, đang sửa; khi bản sửa lên, chủ đầu tư báo lại):

| Lỗi | Cách tạm | Mục |
|---|---|---|
| Desk v1.0.4 nhận giá trị sai dạng ở `weekend_nights` và `min_stay` (BUG-R5-001, BUG-R5-003; sửa ở v1.0.5) | **Tới khi v1.0.5 lên**, không bấm **Lưu thay đổi** ở hai dòng `weekend_nights` (**Đêm tính là cuối tuần**) và `min_stay` (**Ở tối thiểu**), nhóm **Khác**: Desk v1.0.4 nhận cả giá trị sai dạng, lưu sai thì Desk không nhận ra đêm cuối tuần, hoặc mọi báo giá và đơn trực tiếp mới báo lỗi, không gỡ được trong ngày (BUG-R5-001, BUG-R5-003). Buộc phải đổi: nhắn đội trước, chọn **Hiệu lực từ** từ ngày mai để còn **Hủy lịch** được. Lỡ lưu: báo đội ngay, coi là **P0** (chủ đầu tư gõ `/feedback P0`, quản lý gọi chủ đầu tư). | 1.4 |
| Thư báo bảo mật chưa gửi tới chủ đầu tư (sửa ở v1.0.3: nhập email ở mục 0.3a) | Chủ đầu tư kiểm bảo mật mỗi sáng trước 09:00 (quản lý cùng đối soát), tới khi đội bảo mật báo bỏ | 1.1, 0.3a |
| Giữ chỗ quá hạn có cọc chưa báo vào **Cần chú ý**; giữ chỗ có yêu cầu giảm giá/FOC không tự hủy | Rà 3 mốc mỗi ngày (mở quầy ≤ 09:00, 11:00, trước khi rời quầy ≤ 21:00) ở **Đơn đặt phòng** → **Đang hiệu lực** → **Giữ chỗ · chờ cọc**; xử lý trước 12:00 ngày đến | 2.1, 2.4 |
| Giữ chỗ **có cọc** đã quá hạn: Desk từ chối **Xác nhận đã nhận cọc**, không gia hạn được; chỉ còn **Hủy giữ chỗ** | Phòng trước (xác nhận, gia hạn trước hạn). Sau hạn: hủy – hoàn, hoặc để nguyên đơn rồi hủy – đặt lại (thu đủ cọc lúc đặt) – thu phần còn lại khi nhận phòng – chủ đầu tư hoàn cọc cũ khi khách đến | 2.4 |
| Giữ chỗ có cọc quá hạn: khung đơn ghi "**đơn đã tự hủy**", câu lỗi ghi "căn đã **mở bán lại**", hộp hủy ghi "**Không thu phí**" | Tin trạng thái **Giữ chỗ · chờ cọc**: đơn chưa hủy, căn vẫn giữ. Hủy thì Desk vẫn tạo yêu cầu hoàn đủ số đã nhận | 2.4, 2.8 |
| Hủy với lý do **Khác (ghi rõ)**: hộp hủy khóa nút | Chọn **Không liên lạc được** hoặc **Khách đổi ý**; điều cần giải thích ghi sổ giao ca | 2.4, 2.8 |
| Folio đã khóa: câu báo ghi "Chỉ quản lý ghi được bút toán điều chỉnh" (sai – không ai ghi được); nút **Thêm phát sinh** / **Điều chỉnh** còn hiện tới khoảng 1 giờ | Bỏ qua vế "chỉ quản lý". Thu công nợ hoặc Xóa công nợ; phát hiện mới ghi sổ giao ca, báo chủ đầu tư | 1.11 |
| Chưa nhập được **Wi-Fi** trên Desk; trang khách ghi "hỏi lễ tân" | Khách xem thẻ Wi-Fi trong căn; lễ tân đọc khi khách hỏi | 1.4 |
| Hộp **Đổi phòng** lẫn căn chưa dọn (`VD`); chọn thì Desk báo, không lưu | Kiểm trạng thái căn trên Buồng phòng/Sơ đồ phòng trước khi chọn | 2.12 |
| Gia hạn đơn kênh Nội bộ: đêm thêm lấy giá Trực tiếp thay vì 0 đ, không sửa về 0 được (BUG-R4-038, sửa ở v1.0.4) | Không bấm **Gia hạn**; tạo đơn Nội bộ mới 0 đ cho các đêm thêm | 2.12 |
| Hộp **Xác nhận cọc** chưa có ô mã giao dịch | Ghi mã giao dịch vào sổ giao ca | 2.4 |
| Màn **Trả phòng** mở được trước ngày đi rồi báo lỗi khi hoàn tất | Không mở màn Trả phòng trước ngày đi; khách rời sớm dùng **Trả sớm** | 2.14a |
| Đơn HĐ đã gia hạn: khách rời trong phần gia hạn vẫn thấy khung **Trả trước hạn hợp đồng thuê tháng**; nhật ký ghi "BR-428 notice …" | Ký quỹ theo nhánh đã thu đủ, hỏi quản lý trước khi báo khách; bỏ qua dòng nhật ký, ghi nhánh vào sổ giao ca | 2.14a |
| App nhân viên thiếu loại sự cố "Tắc thoát nước", "Wi-Fi" | Chọn **Khác**, ghi rõ trong mô tả | 3.9 |
| Trang khách: mở lại link giữa chừng sau khi chọn "Bổ sung tại quầy" thì không gửi được | Làm giấy tờ tại quầy | 2.9 |
| Dòng miễn **Bị từ chối** vẫn hiện số âm ở màn Trả phòng | Đọc **Còn phải thu** | 2.12 |
| **Hoàn tác nhận phòng** bấm được nhưng bị từ chối khi folio có dòng mới | Quản lý bỏ dòng mới (**Điều chỉnh** → **Bỏ cả dòng**) và đảo khoản thu mới trước | 2.10 |
| Một số chữ trên màn chưa đúng (nhãn "Khách đứng tên" ở người đi cùng, "Giờ trả phòng thực tế" ở xác nhận giờ trả, chữ "Round 3 / R2") | Làm theo sổ tay | 2.5, 2.12, 2.14 |
| Từ v1.0.5, tới v1.0.6: lúc 00:00–05:59 danh sách **Khách đi** không hiện căn có ngày đi hôm qua mà khách chưa trả phòng | Cuối ca, **Khách đi** hôm nay không còn căn chưa trả phòng. Ca đêm rà **Sơ đồ phòng** trước 06:00, không gõ cửa căn; không chắc thì để từ 06:00 | 2.1, 2.20 |
| Từ v1.0.5, tới v1.0.6: danh sách đóng ca chưa có khối dòng tự sửa giảm | Trước khi giao ca, lễ tân ghi sổ giao ca từ **Nhật ký thao tác tiền**; quản lý rà bộ lọc **Sửa giảm dòng – 7 ngày** mỗi tuần | 2.1, 1.15 |
<!-- BUG-R3-021 (phần Desk), 023 (phần lọc), 024…031, 032, 041, 042, 043, 044, 045, FB-R3-ARC-BEB-WA-04 (bug-list.md). BUG-R4-026 (P3, đề xuất QA 04/11 – rounds/round-04/qa/v1.0.2-dk10-b18.md mục 9.6, ORC cấp số khi gộp; đích v1.0.4): dòng "Yêu cầu hoàn thay thế". Theo ORC: ghi "đang sửa", không hứa ngày. 06/11 (V5-08, QA V5-02 rounds/round-05/qa/v5-02-closeout.md): BUG-R4-025, 026 Closed ở v1.0.4, bỏ hai dòng ở 5.6 và hộp "mã lý do thô" ở 1.12. Bản 1.3 bỏ dòng 019, 020, 022 (Closed ở rc.4). -->

### 5.7 Lịch sử sổ tay

**Sửa 06/11/2026 – Round 5, có trong bản 1.15** (BA; QC Round 4 ĐK-5, V5-08). **Áp dụng ngay.** Check-in online đã mở lại từ 06/11/2026 cùng v1.0.4, sau khi đội bảo mật kiểm thông báo xử lý dữ liệu bản 2. Bỏ các câu "tạm dừng", "chưa gửi link": mục 0.1, 0.9 (nhập giấy tờ sau khi có mạng lại), 2.4, 2.9 (khung đầu mục viết lại: ai gửi link, đơn nào, khi chủ đầu tư báo dừng; thông báo có thêm tiếng Nga), 4.2, 5.6 (bỏ dòng "Check-in online cho khách thật" ở bảng **Chưa có** và dòng nút link của đơn giữ chỗ), 5.8 (bài tập lễ tân: gửi link, gửi nhầm người). Câu còn đúng, giữ nguyên: Wi-Fi trên trang khách ghi "hỏi lễ tân"; lỗi mở lại link sau khi chọn **Bổ sung tại quầy**. Sửa lại cùng tối (Phản hồi & sửa): câu "đơn giữ chỗ hiện nút link, Desk luôn từ chối, sửa ở v1.0.5" sai từ v1.0.4. Từ v1.0.4 khung đơn giữ chỗ không còn mục **Link check-in online** (BUG-R3-047 đã sửa): sửa ở 2.4, 2.9 (khung đầu mục và bước 1), bỏ dòng ở 5.6. Cùng tối (QA V5-02): bỏ phần **Lỗi nhỏ đã biết** đã sửa ở v1.0.4: hộp mã lý do thô ở 1.12 (BUG-R4-026); ở 5.6 bỏ dòng yêu cầu hoàn thay thế không ghi lý do (BUG-R4-026) và dòng câu **Xem trước** của **Trả sớm** (BUG-R4-025); 1.8 bước 4: hàng yêu cầu thay thế ghi lý do **Hoàn tiền khách trả thừa**. Cùng tối (review bảo mật FB-R5-SEC-BA-01, 07, 08, 10): 2.9 bước 6 gửi nhầm người viết lại (thu hồi, tạo link mới, ghi sổ giao ca mã đơn và giờ, báo chủ đầu tư trong ngày, giấy tờ lạ thì không dùng và báo ngay trong ca); 2.9 bước 3 chỉ gửi tới số, email, hội thoại OTA ghi trên đơn, người xưng là khách từ số khác thì không gửi; 2.9 khung đầu: đội bảo mật còn kiểm lượt đồng ý thật đầu tiên, khi dừng thì link đã gửi chờ đội báo mới thu hồi; 1.5 khối **Ngày cuối của người nghỉ** bước 5 gỡ cả phòng Báo động nếu là người thứ hai.

**Sửa 06/11/2026, có trong bản 1.15** (BA, Round 4 – Phản hồi & sửa; quyết định của chủ đầu tư 06/11: bật giá web với tham số đang chạy). **Áp dụng ngay.** Website theo thực tế 06/11: form đã bật từ 30/10 (bỏ câu "đang tắt tới khi luật sư trả lời"), 5 ngôn ngữ, giá ước tính đã bật, thông báo quyền riêng tư bản 2026-11-04 – mục 0.1, 2.18; công tắc `public_show_prices` và ngày cuối có giá `web_estimate.open_until` – mục 1.4; bỏ dòng form website ở bảng việc chưa có – mục 5.6; dòng trỏ tới sổ vận hành và từ điển tham số – mục **Cách đọc sổ tay**, 1.4. Ảnh C2-39 cần chụp lại (ảnh đang có là màn form tắt; `screenshot-list.md` đã sửa), QA kiểm che dữ liệu trước khi đưa vào. Bản HTML `ottimo-manual-v1.0.html` cần dựng lại. Số bản ghi ở lần đánh số tới.

**Sửa 05/11/2026, chưa đánh số bản** (sau bản 1.13, có trong bản 1.14; BA; ESC-045 câu 1 và 3, DOM #72 thẻ 06): một giá mọi đêm, không còn +15 % thứ Sáu, thứ Bảy và +30 % ngày đặc biệt – mục 1.3, 5.2; phụ thu người vượt định mức từ 6 tuổi trở lên 150.000 đ/đêm, dưới 6 tuổi miễn – mục 1.3, 2.12, 5.2. Cùng lần chuyển giá (bảng giá 01/11; DOM #85 thẻ 01–03, UXD #85 thẻ 02–03): không giảm theo số đêm – mục 1.3, 2.4, 2.5 bước 4 và 8, 2.12, 5.2; dài hạn từ 30 đêm – mục 2.5, 2.7, 4.2, 5.2; nhận sớm không phụ thu từ 11:00, câu nói với khách giữ 12:00 – mục 2.10, 5.2; ví dụ trả sớm 5.600.000 → hoàn 800.000 – mục 2.14a; câu kiểm "ngày đến thứ Sáu, 2 đêm = 1.600.000" thay câu 1 đêm bị chặn tối thiểu 2 đêm. Áp dụng từ ngày chủ đầu tư chuyển giá. Áp dụng ngay (ARC BUG-R4-050 mục 2): khách đi trước 06:00 thì từ 06:00 làm **Trả phòng** với giờ Desk điền sẵn, không gõ giờ trước 06:00, giờ rời thật ghi sổ giao ca – mục 2.14a. Sau khi gộp #72: khách đổi căn giữa kỳ thì kiểm trùng minibar căn cũ trước khi bấm **Trả phòng**, có **Ghi điều chỉnh**; **Bỏ cả dòng** chỉ cho dòng minibar căn cũ bị ghi trùng, ghi sổ giao ca – mục 2.14 (UXD #72 thẻ 10, SEC #72 thẻ 05). Sau #85 (SEC #85 thẻ 01, DOM #85 thẻ 04, UXD #85 thẻ 05–07): mục 4.2 bỏ tỷ lệ trong ngoặc sau **Bạn nhận**, Desk tự điền theo tỷ lệ chủ đầu tư cài; khách đi trước 06:00 mà quá 12:00 mới **Trả phòng** thì gõ 12:00, ghi giờ rời thật ở ghi chú giờ trả – mục 2.14a; trích đủ "Đã giảm …% vì ở từ 7 đêm (BR-107)", chữ cũ nằm ở tiêu đề cột – mục 1.3, 2.5 bước 8; tiêu đề 5.2 ngắn lại, phạm vi xuống dòng dưới, dòng **Kiểm sau khi chuyển giá** tách riêng; gạch **Kiểm trùng** mục 2.14 chia 4 gạch con; khách Trực tiếp/CTV báo trong ngày rời: không hoàn tiền phòng, phụ thu người các đêm bỏ vẫn hoàn 100 % (có thì vẫn có **một** yêu cầu hoàn, không có thì "Không có khoản hoàn."), dòng phí "Phí trả phòng sớm (báo trước 0 ngày)" – mục 2.14a, 5.2 (QA BR-428-02 giờ thật 05/11, DOM #89 thẻ 01); nhãn **Bạn nhận** (CTV) và **Sale nhận** (sale) trích đủ, không ghi tỷ lệ – mục 4.2 (UXD #89 thẻ 01). Số bản ghi cùng lần gộp PR #69.

| Bản | Ngày | Người | Thay đổi |
|---|---|---|---|
| 1.19 | 07/11/2026 | BA (Round 5 – Phản hồi & sửa; SEC `SEC-responses.md` mục 6.5; CPY `guest-reply-card-number.md` lượt 2; DOM `DOM-on-ba-v105-docs.md` mục 4 thẻ FB-R5-DOM-BA-02, 03, 04; DOM `DOM-responses.md` đề xuất minibar (A) 2) | **Áp dụng ngay:** mục 2.21 – câu trả lời khách lỡ gửi số thẻ (CPY, SEC duyệt) đặt dưới bảng, ba bản: bản đầy đủ (WhatsApp, Telegram, Viber, email, SMS; email và SMS bỏ câu thu hồi), bản ngắn (Zalo số cơ sở), bản không có vế xóa (Zalo OA, hộp thư OTA, Messenger); cách xóa theo kênh: SMS xóa cả trong **Đã xóa gần đây** / **Thùng rác**, WhatsApp **Xóa ở phía tôi**, Viber **Delete for myself**, Telegram không đánh dấu ô xóa cho khách, xóa trên từng máy; dòng mới **kênh không xóa được** (Zalo OA, hộp thư OTA, Messenger) là ca thường: gửi bản không có vế xóa, xóa các bản sao xóa được, ghi sổ giao ca, báo chủ đầu tư trước khi hết ca, không đánh dấu spam; ca gọi ngay "không xóa được tin" chỉ còn máy/tài khoản không mở được, tài khoản dùng chung với người ngoài, xóa không thành. Mục 2.4, 1.16 – điện thoại cơ sở tắt tự lưu ảnh và file vào thư viện ảnh ở Zalo, WhatsApp, Telegram, Viber, làm trong lượt thử xóa tin "TEST XOA" cùng chủ đầu tư. Mục 2.1 (cuối ca bước 1), 5.1 – **Khách đi** hôm nay không còn căn chưa trả phòng trước khi rời quầy. Mục 2.20, 5.6 – ca đêm không gõ cửa, không vào căn; không chắc thì để từ 06:00 làm như đơn quá ngày đi. Mục 2.1 (cuối ca bước 3), 1.15, 1.1 – lần đếm lại minibar hiện ở **Nhật ký thao tác tiền** là hàng **Đảo dòng folio** (lý do **Đếm lại minibar**) và hàng **Thêm dòng folio**, chưa hiện ở bộ lọc **Sửa giảm dòng – 7 ngày**. Mục 2.14 – buồng phòng báo tủ thiếu nhiều hơn số đã tính: khách đã trả phòng thì **Thêm phát sinh** trong 24 giờ, khách còn ở thì ghi sổ giao ca. Mục 1.1, 1.16, 3.7 – đếm kho minibar mỗi tuần (K-MB): kho có khóa, sổ kho, phiếu nạp; so 3 dòng phiếu nạp với Folio; lệch quá 2 món một tuần thì hỏi người trực. **Bổ sung cùng ngày** (PO release notes Giới hạn đã biết `3279a4ec`; DOM FB-R5-DOM-BA-120-02): mục 1.3 – Desk chưa cảnh báo giá đêm cao bất thường, đổi giá xong báo giá thử 1 đêm của căn đó (áp dụng ngay, tới V5-5C). Mục 1.4 – khối **[Chờ xác nhận – Wi-Fi trên Desk vào v1.0.5]**: ngày lên bản chủ đầu tư nhập Wi-Fi, quy trình đổi mật khẩu (bộ phát trước rồi lưu trên Desk, báo mọi khách đang ở, thay thẻ Wi-Fi trong căn, không ghi mật khẩu vào sổ hay chat); các câu "sửa ở v1.0.3 hoặc v1.0.4" về Wi-Fi đổi thành "v1.0.5 hoặc v1.0.6". **Bổ sung cùng ngày, lượt 2** (ORC 07/11 theo BE-A2 `0b2ebb45`: phần audit V516-01 vào v1.0.5 nếu #110 gộp trước; phần chặn không vào v1.0.5): lần đếm lại minibar thấp hơn có trong bộ lọc **Sửa giảm dòng – 7 ngày** và hiện là hàng **Điều chỉnh dòng folio** ở **Nhật ký thao tác tiền**, thay câu "chưa hiện ở bộ lọc" (mục 1.1, 1.15, 2.1 cuối ca bước 3); mục 2.14 bước 2 – giữ khối không chặn, bỏ ngoặc vuông, bỏ khối "có chốt chặn"; lễ tân sai lần trước thì báo quản lý. **Bổ sung cùng ngày, lượt 3** (DOM `DOM-on-ba-v105-docs.md` mục 5, `b0fa79ff`; CPY `77d197a4`, `12d71871`): mục 2.21 – ba câu số thẻ bản EN đổi "at our front desk" thành "at reception" (CPY lượt 3, nghĩa không đổi). Mục 1.3 (BA-06) – báo giá thử 1 đêm **từ ngày hiệu lực trở đi**; giá sai sửa bằng lưu lại cùng ngày hiệu lực, hôm nay hay ngày sau; đơn, báo giá **đã tạo trước lúc lưu** giữ giá lúc tạo (thay "tạo trước ngày hiệu lực"), cùng câu ở 5.4. Mục 1.4 (BA-05) – khối chờ xác nhận Wi-Fi: đổi trong 13:00–17:00, in sẵn thẻ; tin báo khách theo CPY (dán nguyên văn), không gửi khách đi hôm nay, khách nhận phòng sau giờ đổi, đơn đã có 2 tin; thay thẻ đủ 10 căn. Mục 3.4 – buồng phòng thay thẻ Wi-Fi ở lần dọn đầu sau khi đổi mật khẩu. Mục 1.1, 1.16, 3.7 (BA-07) – phiếu nạp có dòng hàng không vào tủ |
| 1.18 | 07/11/2026 | BA (Round 5 – Phản hồi & sửa; DOM review PR #101, #108, #110 mục 3.2, 3.3, 4; DOM review tài liệu BA v1.0.5 thẻ FB-R5-DOM-PO-08, FB-R5-DOM-BA-01; SEC `SEC-responses.md` mục 6; ARC A4 PR #100; US-177 AC7 (i)) | **Áp dụng ngay:** mục 2.4 – tin ở hộp Thông báo không đổ chuông, chỉ để nhắc; gõ mã đơn, bấm **Tất cả**, làm theo trạng thái đơn; tới v1.0.5 câu chung kèm mã đơn có thể là giữ chỗ chưa cọc đã tự hủy, giữ chỗ có cọc đã quá hạn, hoặc giữ chỗ còn chờ cọc sau 12:00 ngày đến; đơn **Đã hủy** lý do **Hết hạn giữ chỗ** thì kiểm tiền về rồi báo khách, đơn còn **Giữ chỗ · chờ cọc** thì không báo khách đã hủy. Mục 2.21 – dòng mới **Khách lỡ gửi số thẻ hoặc ảnh thẻ qua Zalo, SMS, email**, luật chung (SEC FB-R5-DOM-BA-01, `SEC-responses.md` mục 6): không chép, không chụp, không chuyển tiếp, không dùng số để thu tiền; trả lời bằng tin mới (câu chuẩn chờ CPY), nhờ khách thu hồi, xóa ngay trên mọi máy của cơ sở; ghi sổ giao ca một dòng không có số; báo chủ đầu tư trước khi hết ca, ca bất thường thì gọi ngay, muộn nhất 1 giờ. Mục 3.7 – bổ sung minibar luôn nạp đủ định mức theo bảng trong căn, không theo số món trên việc. **Áp dụng từ v1.0.5, tới v1.0.6:** mục 2.20, 5.6 – ca đêm rà **Sơ đồ phòng** trước 06:00, căn **Đang ở** có ngày đi hôm qua theo lịch thì **Trả phòng** hoặc **Gia hạn**; mục 2.1 (cuối ca bước 3), 1.1, 1.15, 5.6 – lễ tân ghi sổ giao ca các dòng mình đã sửa giảm trong ca, lấy từ **Nhật ký thao tác tiền**; quản lý, chủ đầu tư rà bộ lọc **Sửa giảm dòng – 7 ngày** mỗi tuần. Mục 2.14 bước 2 – hai khối **[Chờ xác nhận]** về đếm lại minibar thấp hơn lần trước, giữ một khối khi ORC báo chốt chặn có kịp v1.0.5 không. **Bổ sung cùng ngày, áp dụng ngay** (DOM FB-R5-QA-DOM-BR438-01 chọn A): mục 2.15 – muốn miễn phụ thu trả muộn thì làm trước khi bấm **Trả phòng** (đặt giờ trả muộn rồi gửi miễn có duyệt); sau Trả phòng chỉ quản lý sửa được |
| 1.17 | 07/11/2026 | BA (Round 5 – Phản hồi & sửa, V5-71 phần V5-15, V5-40, V5-1B; UXD `copy-v1.0.5.md` 9.7; SEC, ARC review PR #100) | **Áp dụng từ v1.0.5** ở các dòng ghi "Từ v1.0.5"; phần còn lại áp dụng ngay. Mục 0.3, 1.5 (bảng vai và bước 7): từ v1.0.5 Desk tự ép lễ tân trưởng bật 2 bước, người chưa bật bị hạn chế ngay ở lượt bấm kế tiếp sau khi bản lên, kể cả đang đăng nhập; lễ tân trưởng bật trước ngày lên, không tự tắt được nữa. Mục 2.4: hộp Thông báo nằm trên app nhân viên (Desk không có); tin giữ chỗ chưa cọc tự hủy – người nhận ở v1.0.4 và từ v1.0.5 (mọi tài khoản đang hoạt động có vai lễ tân, lễ tân trưởng tại cơ sở), vẫn rà theo mã đơn ở Tờ 2a. Mục 2.10 (ca 2), 2.19 bước 5, 3.5: nút **Báo cần dọn** từ v1.0.5. Mục 3.11: tin giữ chỗ trên app nhân viên. Việc 2.4 viết lại hẳn theo v1.0.4 và Tờ 2a (V5-71) chưa làm ở bản này |
| 1.16 | 06/11/2026 | BA (BUG-R5-001, BUG-R5-003; Round 5 – Phản hồi & sửa) | **Áp dụng ngay, tới khi v1.0.5 lên.** Lời dặn không bấm **Lưu thay đổi** ở `weekend_nights` (**Đêm tính là cuối tuần**) và `min_stay` (**Ở tối thiểu**): Desk v1.0.4 nhận giá trị sai dạng; buộc phải đổi thì nhắn đội trước, **Hiệu lực từ** từ ngày mai để còn **Hủy lịch**; lỡ lưu thì báo đội, coi là P0 – mục 1.4 (khung đầu mục), 5.5 (dòng sự cố), 5.6 (dòng **Lỗi đang sửa**). Gỡ khi v1.0.5 lên (V5-25, V5-71) |
| 1.15 | 06/11/2026 | BA (QC Round 4 ĐK-5, V5-08; SEC FB-R5-SEC-BA-01…11; quyết định của chủ đầu tư 06/11 bật giá web); UXD đánh số khi dựng HTML (V5-04) | Gộp hai khối "Sửa 06/11/2026" ở trên, sau 1.14 (PR #69 gộp 06/11/2026). **Áp dụng ngay.** Check-in online mở lại từ 06/11/2026: bỏ các câu "tạm dừng", "chưa gửi link"; gửi nhầm link thì thu hồi, tạo link mới, ghi sổ giao ca, báo chủ đầu tư trong ngày. Website theo thực tế 06/11: form đã bật, 5 ngôn ngữ, giá ước tính đã bật, thông báo quyền riêng tư bản 2026-11-04 |
| 1.14 | 04/11/2026 | BA (PO FB-R4-PO-BA-032-05; SEC FB-R4-SEC-BA-R4032-06, FB-R4-SEC-BA-PR68-S1) | Gộp **sau** 1.13 (PR #68), **khi chủ đầu tư báo v1.0.4 đã lên production**. Gỡ lời dặn "không bật đăng nhập 2 bước ở v1.0.x" và cách v1.0.3 cho người mất cả điện thoại lẫn mã khôi phục (khóa tài khoản rồi tạo tài khoản mới). Mục 0.4: chỉ còn **Đặt lại xác thực 2 bước**. Mục 1.5: bảng vai ghi giá trị v1.0.4 (lễ tân trưởng bắt buộc, buồng phòng, bảo trì tùy chọn); bước 7 viết lại theo vai, dặn lễ tân trưởng không tự tắt 2 bước; "anh/chị đổi được, báo đội" ở mọi chỗ; cột **Thao tác** có **Sửa vai**, **Khác…** (bỏ khung chờ v1.0.4). Mục 3.1: bỏ 2 đoạn app chặn tài khoản có 2 bước, khung v1.0.4 thành nội dung chính. Mục 3.6, 4.1: bỏ "(không bật 2 bước ở v1.0.x)". Mục 0.3a, 5.0: "Desk chặn `info@` và `booking@` của cơ sở". Dòng **Áp dụng cho**: `v1.0.4`. Dòng **Lập:** chỉ giữ bản hiện hành, lịch sử ở bảng này. Lượt 2 (05/11/2026): gộp các thay đổi đã có trên `main` (#72, #85, #89). Bản này gồm cả các đoạn "Bổ sung 05/11", "Sửa 05/11 theo review #72" ở dòng 1.13 và phần **Sửa 05/11/2026** ở trên bảng. Đã rà phần mới: không còn câu dặn "không bật" hay "chưa bật" 2 bước |
| 1.13 | 04/11/2026 | BA (PO FB-R4-PO-BA-032-06; ARC P4-32 thẻ 01 ý 3) | Gộp **sau** 1.12 (PR #63). **Áp dụng từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên). Mục 0.3a, 1.5 bước 4, 5.0: Desk chặn cả `booking@` (và dạng `info+…@`, `booking+…@`), các hộp thư chung khác vẫn tự tránh. Mục 2.12 bước 6, 2.14a, 5.6: Desk giữ ngày kết thúc HĐ khi gia hạn, **Trả sớm** chỉ hiện khung HĐ khi rời trước ngày kết thúc HĐ, nhật ký ghi BR-313; bảng kỳ thu vẫn giữ cột ngày kết thúc HĐ. Mục 2.14 bước 6, 2.14a: dòng **Đang chờ hoàn** ở Trả phòng (P4-32, PR #64) và giới hạn đã biết: lễ tân, lễ tân trưởng không thấy yêu cầu hoàn chờ duyệt do người khác tạo, cả ở **Nhật ký tiền → Hoàn tiền**; hỏi quản lý trước khi báo khách; sửa ở v1.0.5. **Áp dụng ngay** (DOM chốt 04/11, FB-R4-DOM-PO-RN-05): mục 2.14a bước 2 – Trả sớm lúc 00:00–05:59, ô **Ngày rời mới** đặt sẵn ngày hôm trước; đổi thành ngày lịch hôm nay; rời đúng ngày đi thì dùng **Trả phòng**; Desk chặn ở v1.0.5. Sửa cùng ngày theo review DOM (01–05) và PO (09): nút **Trả phòng** chỉ hiện từ 06:00, khách đi trước 06:00 thì làm Trả phòng từ 06:00 và ghi **Giờ trả phòng thực tế** đúng giờ đi, không bấm Trả sớm lần nữa (2.14a bước 2, 2.20); giới hạn **Đang chờ hoàn**: yêu cầu đã duyệt vẫn thấy, không báo khách "không có khoản hoàn", v1.0.5 hiện tổng số đang chờ hoàn, tab **Hoàn tiền** giữ phạm vi (2.14, 2.14a); câu in đậm "Tới v1.0.3, Desk chỉ chặn được `info@`" (0.3a); ví dụ HĐ ký lại (2.14a). Sửa theo DOM lượt 2 (FB-R4-DOM-BA-PR68-06): gạch **Khách đi trước 06:00** – xem **Còn phải thu**, thu ngay bằng tiền mặt hoặc thẻ POS trước khi khách đi, ghi sổ giao ca; lúc 06:00 ghi khoản đã thu ở bước **Bill & thu tiền**; gõ giờ đi sau 06:00 thì Desk đòi **Ghi chú giờ trả (vì sao ghi bù)** (2.14a bước 2). **Áp dụng ngay** (DOM 04/11 tối, BUG-R4-037 mục 1.8; BUG-R4-038, P0, sửa ở v1.0.4): đơn kênh Nội bộ cần ở thêm thì không bấm **Gia hạn** (đêm thêm lấy giá Trực tiếp, không sửa về 0), tạo đơn Nội bộ mới 0 đ; trả phòng đơn cũ trước rồi mới nhận phòng đơn mới; căn không còn trống thì tạo đơn ở căn khác (2.5, 2.12 bước 7, 5.6). Sửa theo DOM lượt 3 (FB-R4-DOM-BA-PR68-07…10): bước tạo đơn nối tiếp **xóa trống mọi ô Giá mỗi đêm** trước khi bấm **Tạo đơn** (tránh BUG-R4-037) rồi kiểm **Folio** ghi **Tiền phòng (… đêm) 0** và **Còn phải thu 0**, khác 0 thì hủy và tạo lại; 2.10 – **căn đang có khách** (`OC`, `OD`) không xác nhận ngoại lệ nhận phòng, kể cả lễ tân trưởng (Desk chặn từ v1.0.4), bảng 1.8 (duyệt từ xa: từ chối); cách làm tạm đơn Nội bộ áp dụng tới khi v1.0.4 lên (BUG-R4-038, P0, sửa ở v1.0.4), từ v1.0.4 bấm **Gia hạn** như đơn khác; câu xóa mã ở hộp Hoàn tất, 2 việc dọn, căn đã `VC`/`VI`, người ở vắng; đơn OTA gõ đủ giá mọi đêm theo xác nhận OTA, không để trống ô nào (2.6 bước 4). Bổ sung cùng ngày (ARC PR #70 thẻ FB-R4-ARC-FE-PR70-03, 05; DOM trả lời ARC-03/UXD-05): 2.5 bước 8 – **từ v1.0.4** Desk giữ giá đã gõ khi đổi số khách, ngày, Trực tiếp ↔ CTV, căn của đơn OTA, Nội bộ, đổi căn cùng nhóm căn; xóa khi đổi kênh sang/rời OTA, Nội bộ và khi đổi căn của đơn Trực tiếp/CTV sang nhóm khác, kèm câu báo (theo #70 đã gộp); tới v1.0.3 gõ giá sau cùng; đơn OTA từ v1.0.4 để trống thì lấy giá niêm yết, hoặc gõ đủ theo xác nhận OTA (theo #73; mục OTA bước 4); 2.5 bước 10 – giá thỏa thuận thì **không bấm Giữ chỗ** (v1.0.3 bỏ giá đã gõ, v1.0.4 khóa nút), khách chuyển ngay thì **Tạo đơn** với giá đã gõ; phải giữ căn lâu hơn thì giữ chỗ theo giá niêm yết, báo khách đúng số cọc Desk hiện, tiền về thì **Xác nhận đã nhận cọc** rồi **Điều chỉnh** từng đêm về giá thỏa thuận; không hủy giữ chỗ để tạo đơn mới; khách hủy thì hoàn phần cọc vượt (DOM điểm 3). Bổ sung 05/11 (UXD chữ khóa Giữ chỗ; DOM lượt 5, BUG-R4-039): 2.5 bước 10 – từ v1.0.4 Desk khóa **Giữ chỗ đến …** khi còn giá đã gõ và hiện câu báo; xóa hết giá đã gõ thì nút mở lại (theo #75). 1.8, 2.10 – căn `OC`, `OD` hoặc còn đơn khác đang ở (dù buồng hiện trạng thái nào): không có ngoại lệ nhận phòng với mọi vai; tới v1.0.3 đừng bấm, từ v1.0.4 Desk chặn (theo #74, #77); thứ tự: **Trả phòng** đơn trước, mời khách chờ hoặc đổi căn; đơn trước đã trả phòng mà căn vẫn có khách thì không nhận vào căn đó, đổi căn và báo quản lý để đội sửa trạng thái, không dùng **Khóa phòng** (DOM lượt 7). 2.14 bước 2 – cách làm tạm BUG-R4-042 (áp dụng ngay, tới v1.0.3; bỏ khi v1.0.4 lên): khách đã đổi căn giữa kỳ, 2 tủ minibar, Desk đứng lại ở tủ đã đếm thì không sửa số, không bấm **Không dùng gì – tủ đủ**, bấm **Tiếp tục** lần nữa; kiểm bill có minibar cả hai tủ; lỡ bị đảo thì **Thêm phát sinh** → **Đồ ăn uống** (khách còn ở quầy) hoặc báo quản lý (khách đã đi), ghi sổ giao ca, báo buồng phòng bổ sung tủ. 2.10, 2.14, 2.21 – đơn quá ngày đi vẫn **Đang ở**: Desk không có nút Trả phòng, **Gia hạn** tới hôm nay rồi **Trả phòng**; khách ở thật thì thu đêm thêm như gia hạn, quên bấm thì xin giảm 100 % đêm thêm (DOM lượt 8, BR-421 v0.5.7). 2.5 bước 4 – đơn Nội bộ gõ giá đủ mọi đêm (có thu) hoặc để trống hết (0 đ), từ v1.0.4 Desk chặn gõ một phần (theo #82); đơn Nội bộ có cả đêm thu và đêm miễn phí: gõ mọi đêm, quản lý hoặc chủ đầu tư sửa đêm miễn phí về 0 ở Folio trước khi nhận phòng, không dùng FOC hay giảm 100 % (DOM, BR-105 v0.5.8, v0.5.9). 2.10 – trước khi dùng ngoại lệ nhận phòng căn `VD`, `CL`, kiểm căn thật sự trống, nhất là căn có khách đổi phòng hôm nay chưa chuyển xong (SEC FB-R4-SEC-BE-PR74-02). Bổ sung 05/11 sau khi gộp main (#71, #74, #75, #77 kèm #79, #81, #82, #83): 2.10 – từ v1.0.4 dòng **Buồng sẵn sàng** hiện khung đỏ, không có ô **Lý do**, chỉ có **Đổi căn / đổi ngày**, ghi mã đơn đang giữ căn; căn vẫn hiện có khách mà không còn đơn đang ở có câu riêng. 2.14 bước 2 – 2 tủ minibar từ v1.0.4: **Tủ minibar cần đếm**, tủ căn cũ trước, nút **Tiếp tục: Tủ căn …**, **Tủ căn … cần đếm lại**, hoàn tất mà thiếu tủ thì Desk về bước 1; khối BUG-R4-042 chỉ còn cho v1.0.3. 2.14 **Đơn quá ngày đi** (b) – trước 12:00 để giờ Desk điền, từ 12:00 gõ 12:00, ghi **Ghi chú giờ trả** khi Desk đòi (QA TC-V104-RG-26). 2.5 bước 4 – câu Desk khi đơn Nội bộ gõ một phần hoặc gõ 0; lễ tân, lễ tân trưởng không sửa đêm về 0; nhận phòng mà đêm miễn phí chưa về 0 thì chưa thu, gọi quản lý sửa (DOM #72 thẻ 01, BR-105 v0.5.9); đêm 0 thì phụ thu sớm/muộn 0 (BR-105 (4), (5)). 2.5 bước 8 – cột **Nguồn giá** từ v1.0.4 ghi **Giá đã gõ**, **Giá niêm yết (BR-101)** hoặc "–" (theo #82). Sửa 05/11 theo review #72 (DOM, UXD, SEC): 2.5 – đêm miễn phí về 0 trước khi nhận phòng, nhận phòng mà chưa về 0 thì chưa thu; không liên lạc được quản lý thì thu đủ, phần dư hoàn lúc trả phòng; đơn Nội bộ chỉ tạo khi chủ đầu tư hoặc quản lý đồng ý, ghi người cho; bỏ qua chữ phụ dưới ô giá A31 (v1.0.5 sửa). 2.12 **Đổi phòng** – minibar căn cũ đếm trước khi dọn, ghi số còn lại vào sổ giao ca, không **Thêm phát sinh**, buồng phòng bổ sung đủ tủ căn cũ (áp dụng ngay); 2.14 bước 2 – tủ căn cũ nhập số đã ghi, không đếm lại, kiểm trùng dòng phát sinh cũ (**Bỏ cả dòng**), nhãn **Tiếp tục: Phụ phí**; 3.7 – buồng phòng đếm tủ căn cũ trước khi dọn. 2.12 **Miễn phí, giảm giá** bước 2 và 2.14 **Đơn quá ngày đi** (b) – ô **Loại** mặc định FOC, chọn **Giảm giá đặc biệt (tiền phòng)**. 2.14 **Đơn quá ngày đi** – xóa mã cửa ngay, không kéo dài mã, trước 06:00 "hôm nay" là hôm qua, quản lý hoặc chủ đầu tư duyệt, khách mới đang chờ thì gọi quản lý hoặc đổi căn, ngày đi trên cổng khai báo là ngày khách đi thật (2.11, 2.12 **Gia hạn** bước 4). 2.10 – tách theo từng ca, nút trong khung đỏ chỉ mở khung đơn, **Lý do** ghi đã kiểm căn, kiểm mã cũ trên app khóa; 1.8 – người duyệt kiểm **Lý do**. |
| 1.12 | 04/11/2026 | BA (BUG-R4-032, QA TC-V104-MN-02, QC v1.0.4 mục 7.4) | **Áp dụng từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên). Mục 1.5: khung **Khác…** (cột **Thao tác** còn **Sửa vai**, **Khác…**, **Mở khóa**); khối mới **Đặt lại xác thực 2 bước** – chỉ chủ đầu tư, người đã bật 2 bước, gặp tận mặt, lý do ≥ 3 ký tự, xác nhận bằng mật khẩu và mã 6 số; Desk đăng xuất người đó trên mọi máy, xóa mã khôi phục cũ, giữ mật khẩu, gửi thư tới người đó và mọi chủ đầu tư, ghi nhật ký; người đó giữ tài khoản cũ và bật lại ngay (vai quản lý: Desk tự mở **Bật xác thực 2 bước**). Mục 0.4: 2 dòng mất cả điện thoại lẫn mã khôi phục dùng khối này từ v1.0.4, cách khóa tài khoản rồi tạo tài khoản mới chỉ còn cho v1.0.3; chưa gặp được ngay thì **Khóa tài khoản** trước. Mục 0.3a: thư "2-step verification was reset" khi chính chủ đầu tư bấm. Mục 3.1: app sau khi đặt lại. Chữ theo chuỗi `users.reset_2fa*`, `users.more*`, `field_error.reason_required`, `reauth.s2_*`, `error.MFA_ENROLLMENT_REQUIRED`, `staff.notif.sec.mfa_reset_*`, `mfa.nudge_cta` (main @ `40825ee1`). Ảnh mới chờ chụp: C1-23; C1-07 chụp lại có **Khác…**. Sửa cùng ngày theo review SEC (S1, S2) và PO (01–04): chỉ quản lý và lễ tân trưởng phải bật lại ngay buổi đó; sale nội bộ, CTV **không bắt buộc – nên bật** (bảng vai, khối mới bước 4); buồng phòng, bảo trì tùy chọn (bước 5); khóa tài khoản cũng đăng xuất mọi máy; đặt lại mật khẩu luôn khi điện thoại bị lấy cắp hoặc có lưu mật khẩu; 0.4 ghi OTTIMO chỉ có một tài khoản chủ đầu tư; câu `users.reset_2fa_stale` thay câu tạm "Đơn vừa chuyển sang…"; "mặc định đội chọn" thay "quy định OTTIMO". Sửa theo SEC lượt 2 (03, 05): Desk báo 2 bước đã đổi ở chỗ khác mà không phải chủ đầu tư làm thì **Đặt lại mật khẩu ngay**; tài khoản chủ đầu tư thứ hai chỉ cho một người khác anh/chị tin cậy, không cho chính mình |
| 1.11 | 04/11/2026 | BA (round 4, v1.0.4 kéo sớm) | **Áp dụng từ v1.0.4** (khi chủ đầu tư báo v1.0.4 đã lên; bản đang chạy là v1.0.3). Mục 0.3a: tiêu đề thư "Security notice: 2-step verification was reset" / "Thông báo bảo mật: xác thực 2 bước đã được đặt lại" và "Security notice: receiving account update" / "Thông báo bảo mật: cập nhật tài khoản nhận chuyển khoản" (giữ tiêu đề v1.0.3 bên cạnh), thư hủy lịch đổi tài khoản nhận cùng tiêu đề, câu đặt/hủy trong thân thư, chữ thư theo Desk; mục 1.7 khung thư đổi tài khoản nhận; bảng thuật ngữ. Mục 1.8 bước 4: yêu cầu hoàn thay thế giữ nơi nhận khi các yêu cầu cũ có một nơi nhận do một người nhập, vẫn kiểm **Cách hoàn**; 2 nơi nhận khác nhau hoặc 2 người nhập thì nhập lại. Mục 1.5 bước 7, 3.1: app nhân viên có bước nhập mã, đổi mật khẩu tạm ngay trên app, bật 2 bước chỉ trên Desk, bỏ lời dặn không bật 2 bước. **Áp dụng ngay:** mục 1.5 người nghỉ hẳn thì **Khóa tài khoản** rồi **Xóa email** trong ngày; **Tạm khóa do sai mật khẩu** là việc Desk tự làm, vẫn nhận thư bảo mật (SEC M18-08); mục 2.18 không dùng **Dịch trang** ở màn giấy tờ (SEC 6.3). Nguồn: CPY-on-v104-email-copy.md mục 3, 5 (thẻ 01–03), mục 6; INT `v104/int-email` @ 5df13359; SEC-on-plan-v1.0.4.md mục 2.2 (M18-08), 6.2–6.4; BE-A `v104/be-identity` báo cáo mục 1 (M18-08: 2 test, không đổi dispatcher); decision-log 04/11 (MOB P4-50, ORC quyết đổi mật khẩu tạm trên app, bật 2 bước trên Desk); MOB `v104/mob-2fa` @ 59e73cd4; UXD `v104/uxd-manual-font` @ bd9461d6 (`staff.mfa_enroll_desk`); UXD `v104/uxd-id-sheet-v2` @ 82df5fea; BE-D `v104/be-refund-dest` @ 8539bbfb (P4-12) **Sửa cùng ngày theo review DOM** (FB-R4-DOM-BA-104-02, 03, 04, 05, 06; trả lời ở `rounds/round-04/responses/BA-on-DOM-v104.md`): mục 1.5 khối **Ngày cuối của người nghỉ** (8 bước, áp dụng ngay) và mặc định 2 bước từ v1.0.4 (lễ tân trưởng bắt buộc, buồng phòng/bảo trì tùy chọn); mục 1.8 bước 4 yêu cầu hoàn thay thế (ngoại lệ chủ đầu tư với chuyển khoản, yêu cầu cũ trống không tính, duyệt không mang sang, tạo trước v1.0.4 vẫn trống, dòng nhật ký mới, đổi nơi nhận không còn hợp); mục 3.1, 3.6 người trực kiểm căn trên app từ v1.0.4, cách kiểm bằng mắt là dự phòng (mặc định đội chọn, chủ đầu tư đổi được). Ngày thay tờ v2 (thẻ 01) ở `guides/00-index.md` mục 4 và `guides/02-le-tan.md` mục 7.2. Sửa theo DOM lượt 2 và SEC: mục 1.5 khối **Ngày cuối của người nghỉ** – thứ tự riêng cho người bị cho thôi việc, tài khoản người nghỉ hẳn không Mở khóa lại, thư đổi email gửi địa chỉ cũ, chìa/mã/mật khẩu dùng chung (OTA, hộp thư chung, Zalo, máy cơ sở, Wi-Fi phát), đăng xuất app nhân viên, căn HĐ thuê tháng đổi mã trong 7 ngày, CTV có máy được cấp quyền làm thêm bước 7. SEC 13: mục 2.18 ý 3 thêm quy tắc "không dịch" như `guides/02-le-tan.md` 13.1d. DOM lượt 4 (FB-R4-DOM-BA-104-12): "không dịch", "chưa xem v2" ghi ở **trang Không dịch** đầu sổ giao ca, theo mã đơn hoặc mã yêu cầu, giữ qua mọi ca (mục 2.18 ý 3) |
| 1.10 | 04/11/2026 | BA (BUG-R4-025; QC v1.0.3 mục 11.4, gộp ĐK11) | **Áp dụng ngay** (Desk v1.0.2 đã làm như vậy). Bỏ câu "trả phòng sau đó không tạo thêm" yêu cầu hoàn: trả phòng không tạo lại khoản **Trả sớm**, nhưng folio còn tiền trả thừa khác thì bước **Bill & thu tiền** hỏi đúng phần đó, chọn hoàn thì thêm một đề nghị hoàn (2.14 bước 6, 2.14a). Mục 1.8 mới **Đơn có hơn một yêu cầu hoàn**: trước khi từ chối, cộng các yêu cầu còn mở và đối chiếu; bằng thì duyệt; lớn hơn thì duyệt, Desk tự đóng yêu cầu vượt và tạo lại đúng số; bất thường thì dừng, báo chủ đầu tư và đội kỹ thuật. 5.6 thêm lỗi chữ Desk ở hộp **Trả sớm**. Sửa cùng ngày theo DOM FB-R4-DOM-BA-025-01…07 (chưa dựng HTML): 1.8 bước 1 cộng yêu cầu **còn mở** (Chờ duyệt và Đã duyệt chưa chi, ở **Nhật ký tiền → Hoàn tiền**); bước 2 so với dòng **Hoàn lại khách … đ** trên Phiếu thanh toán, bỏ "Đã thu trừ Tổng cộng", có ví dụ và cách làm khi đơn chưa trả phòng; bước 3 "bằng" = không hoàn trùng, vẫn đọc lý do; bước 4 Desk có thể gộp các yêu cầu đang chờ thành một yêu cầu thay thế (lý do "trả thừa"), kiểm **Cách hoàn** và nhập nơi nhận trước khi duyệt, nhập sau khi duyệt thì phải duyệt lại; bước 5 liệt kê các nguồn Desk tự ghi; bước 6 khung đơn không hiện "còn dư" thì tính lại; thêm dòng đơn HĐ thuê tháng không hoàn theo khối này (ESC-048 B). 2.14 bước 6: nhập nơi nhận ngay khi khách còn ở quầy, câu báo khách hai lần chuyển, đơn HĐ thuê tháng không chọn hoàn. 2.14a: yêu cầu thay thế kiểm lại nơi nhận. Sửa cùng ngày theo QA đọc staging 04/11 (`rounds/round-04/qa/v1.0.2-dk10-b18.md` mục 9; FB-R4-DOM-BA-025-02): bỏ cách nhận ra bằng lý do "trả thừa" (Desk không hiện chữ này); 1.8 bước 4 nhận ra yêu cầu thay thế theo cặp dòng **Đã tự đóng** – **Gửi yêu cầu duyệt** cùng phút ở **Nhật ký thao tác tiền**, cột lý do có thể hiện mã `overpayment`; Desk có thể đóng cả yêu cầu **đã duyệt chưa chi** và xóa nơi nhận đã nhập; yêu cầu thay thế không mang nơi nhận, "—" thì **Nhập nơi nhận hoàn** rồi mới duyệt; bước 5 và 2.14a sửa theo; 5.6 thêm lỗi chữ BUG-R4-026. Sửa theo DOM lượt 2 (FB-R4-DOM-BA-025-08, -10): 2.14a viết "Nếu Desk tự đóng…" (không phải luôn xảy ra); 1.8 bước 4 người gửi/người làm "thường", thêm ca người vừa sửa folio đã chốt không tự duyệt |
| 1.9 | 03/11/2026 | BA (DOM FB-R4-DOM-BA-M18-01…07, 09; ARC FB-R4-ARC-BA-M18-01…05 – QC v1.0.3 ĐK11) | **Áp dụng cùng 1.8, từ khi chủ đầu tư báo v1.0.3 đã lên.** Mục 0.3a: bảng **Thư nào – làm gì** cho 4 loại thư (mã khôi phục, đặt lại 2 bước, tài khoản nhận cọc – tiêu đề "Notice:", không có chữ Security notice – và email đổi); không lọc thư theo chữ Security notice; hỏi lại bằng điện thoại, không qua Zalo; chọn **email riêng chỉ mình đọc**, không dùng mọi hộp thư chung (`info@`, `booking@`, Gmail OTA, hộp thư quầy), **Desk chỉ chặn được `info@`** và báo **sau khi** bấm **Lưu email** (không tính sai mật khẩu, mã); hộp thư không mở trên máy quầy, không tự chuyển tiếp; sai 5 lần khóa khoảng 15 phút mọi thao tác cần xác nhận; câu báo với tài khoản chỉ có mật khẩu; chép đủ câu báo Desk; Desk hiện đủ địa chỉ – không chụp gửi; tạm quay về bản trước; lễ tân trưởng khuyến khích có email. Mục 1.1, 0.3a, 1.7: kiểm sáng **tới khi đội bảo mật báo bỏ** (thấy thư đầu tiên chưa phải lúc bỏ). Mục 1.16: thứ tự ngày v1.0.3 lên (chủ đầu tư nhập trước; báo "đã nhận", không dán địa chỉ vào chat). Mục 0.5: máy quầy không đăng nhập hộp thư riêng. Mục 1.5: hỏi "hộp thư chỉ mình em đọc", câu báo đủ. Bảng thuật ngữ: dòng **Security notice**. Mục 1.5 bước 7, 3.1, 3.6 bước 1, 4.1 (DOM FB-R4-DOM-PO-RN103-02, ARC kiểm, áp dụng ngay): buồng phòng, bảo trì, lễ tân trưởng dùng app nhân viên **không bật đăng nhập 2 bước ở v1.0.x**; lỡ bật thì tự tắt ở **Bảo mật tài khoản → Tắt xác thực 2 bước**, mất máy và mã thì báo chủ đầu tư – cùng chữ với bộ hướng dẫn 1.7. Ví dụ địa chỉ đổi sang `ten.rieng@example.test`. Chữ khớp chuỗi Desk ở `v1.0.3` (`da6d6f3d`; ARC đã đối chiếu không đổi so với `3aaa971c`) và tiêu đề thư ở `integrations/notification/email-templates.ts`. Ảnh C0-12, C0-13, C1-22 chụp bằng địa chỉ `@example.test` Theo SEC chốt RN103-05 (03/11, áp dụng ngay) – mục 0.4 (thêm dòng người dùng app nhân viên), 1.5 bước 7, 3.1. Nội dung: mất cả điện thoại lẫn mã khôi phục → báo chủ đầu tư; chủ đầu tư gặp tận mặt, khóa tài khoản cũ (không xóa), tạo tài khoản mới đúng vai cũ, không làm theo tin nhắn; quản lý nhập email ở Bảo mật tài khoản ngay sau khi bật 2 bước; người dùng app nhân viên không bật 2 bước ở tài khoản mới; bỏ "chủ đầu tư báo đội". |
| 1.8 | 04/11/2026 | BA (FB-R4-UXD-FE-EM-09, Desk v1.0.3 – BUG-R3-032) | **Áp dụng từ khi chủ đầu tư báo v1.0.3 đã lên.** Mục menu **Xác thực 2 bước** đổi tên thành **Bảo mật tài khoản** (0.2, 0.3). Mục 0.3a mới: email nhận thông báo bảo mật, mỗi người tự nhập (mật khẩu + mã), không dùng `info@`, ai nhận thư Security notice. Mục 1.5: chủ đầu tư **Sửa email** cho nhân viên. Mục 1.7, 5.6, bảng thuật ngữ: thêm chỗ dẫn. Chữ theo chuỗi Desk `shell.account_security`, `secmail.*`, `users.*email*`, `secnudge.*` (nhánh `v1.0.3-email` @ `3aaa971c`). Ảnh cần chụp lại: C0-06, C1-07; ảnh mới chờ chụp: C0-12, C0-13, C1-22 |
| 1.7 | 03/11/2026 | BA (FB-R4-DOM-BA-05, ESC-048 = B, ORC 03/11) | Mục 2.14a viết lại theo nút **Trả sớm** của Desk v1.0.2: thao tác chung, nhánh ngắn ngày (BR-428), nhánh HĐ thuê tháng (BR-313 v0.5.1, ESC-048: kiểm ngày kết thúc HĐ và kỳ thu cuối, ranh giới tháng lịch cuối, hỏi quản lý trước khi báo khách, quyết toán ký quỹ BR-214, chốt công tơ và biên bản kiểm phòng ngày rời), giới hạn tới v1.0.3; bỏ cách tạm cũ. 1.11 (quản lý không giảm tiền trên folio bằng tay); 2.7 bảng kỳ thu thêm ngày kết thúc HĐ và ngày đã thu; 2.12 Gia hạn bước 6 (ghi "HĐ kết thúc dd/mm/yyyy, gia hạn tới dd/mm/yyyy" trước khi bấm); 2.21; 5.6 (bỏ dòng "Nút trả phòng sớm", thêm giới hạn đơn HĐ tới v1.0.3). Chữ khung HĐ theo chuỗi Desk @ `52702857` (FE-A sửa theo UXD thẻ 26–31) Bổ sung cùng ngày (BA, QC v1.0.2 ĐK9): đổi đích "tới v1.0.1" của cách tạm và lỗi đang sửa sang **v1.0.3**, **v1.0.3 hoặc v1.0.4** hoặc **bản vá sau** theo backlog 5.6 (PO 03/11) và release notes; v1.0.1 (đã lên 03/11) chỉ có tin Google Chat. Tên mục cách tạm thành "Tạm thời tới v1.0.3 và các bản sau" (`01` 15, `02` 17, `03` 12, `04` 9, `05` 8). Không đổi nghiệp vụ. |
| 1.6 | 01/11/2026 | BA (BUG-R4-010, US-175 AC6 sửa theo ESC-044 và INV 01/11 câu 9; US-131 AC10; BR-912 (4); câu mẫu CPY lượt 5) | Mục 2.18: form website **đã bật từ chiều 30/10** (bỏ khung "đang tắt"); giá ước tính trên website và dòng **Giá ước tính khách đã thấy**, cảnh báo **"Khác giá web khách đã thấy: {cũ} → {mới}"** ở hộp báo giá; khách tiếng Hàn, Trung, Nga: cột và lọc **Ngôn ngữ**, mặc định tiếng Anh (Русский cho khách tiếng Nga, kèm câu "Khách viết bằng tiếng Nga – gửi tin bằng tiếng Nga."), được dùng Google Dịch trên mọi màn hình Desk, 3 câu mẫu, hạn trả lời. Áp dụng khi gói website LP-v2 phát hành. Tối 01/11 (BUG-R4-010 lượt 3): sửa tên cảnh báo chênh giá và thêm câu ghi chú khách tiếng Nga cho khớp chữ Desk `lp-v2` @ `0a25716a` |
| 1.5 | 30/10/2026 | PO theo DOM, SEC xác nhận sau QA thử luồng và QA kiểm nút trên Desk (qa3-rc1.md mục 20.8) | Hẹn khách hoàn cọc khi chủ đầu tư vắng: chuyển khoản **trong 24 giờ** (không "trong ngày"), tiền mặt chỉ khi chủ đầu tư đã hẹn giờ; chủ đầu tư đối soát cọc cũ trước khi chi (2.4); giảm giá/FOC xin lại: Desk áp ngay trong hạn mức quản lý, vượt mức chờ chủ đầu tư (2.4); cọc chuyển sau hạn: kiểm **Đã thu** đơn cũ, ghi **Chuyển khoản** không chọn VietQR, không gộp tiền mặt (2.4); đơn đặt lại cùng **Kênh** và **Nguồn / CTV** (2.4); đủ bước **Nhập nơi nhận hoàn** → **Cách hoàn** (chọn sẵn Tiền mặt) → **Lưu**, chỉ trên máy đã cấp quyền (0.5, 1.12, 2.4, 2.8, 2.17); **Cách thanh toán** chọn sẵn Chuyển khoản VietQR (2.4, 2.5, 2.13); một cách thanh toán mỗi lần thu khi đặt đơn và nhận phòng (2.13); tách nhiệm hoàn tiền đúng Desk – chủ đầu tư chi được khoản chuyển khoản do mình tạo (1.8, 2.8, 2.17); lý do hủy cho đơn nhập nhầm (2.8) |
| 1.4 | 30/10/2026 | PO theo QA thử luồng trên staging 30/10 (qa3-rc1.md mục 20); chờ DOM xác nhận nghiệp vụ | Giữ chỗ quá hạn và hủy: không dùng lý do **Khác (ghi rõ)** (lỗi BUG-R3-046), dùng **Không liên lạc được** / **Khách đổi ý**, giải thích ghi sổ giao ca (2.4, 2.8, 5.6); người tạo yêu cầu hoàn không tự duyệt, không tự chi – người trực nhập nơi nhận, chủ đầu tư duyệt và chi; chủ đầu tư vắng thì hẹn khách (1.1, 1.8, 1.12, 2.4, 2.8, 2.17); đặt đơn mới khi khách đến phải thu đủ cọc ngay, bước nhận phòng chỉ thu phần còn lại (2.4); không bấm nút link check-in online trên đơn giữ chỗ (BUG-R3-047; 2.4, 2.9); bài tập 5.8 (6) |
| 1.3 | 30/10/2026 | PO; BA rà 30/10; DOM, UXD, SEC review 30/10 | Theo bản phát hành `v1.0.0` (`8b3aec8`): bỏ khung lỗi đã sửa ở rc.4 – đơn dài hạn nhập tay (2.7), In phiếu (2.14), tên nhóm ở hộp Đổi phòng (2.12); phát sinh sau trả phòng và folio khóa sau 24 giờ (1.11); tạm dừng check-in online tới v1.0.1 (2.9). Sửa theo review 30/10: giữ chỗ quá hạn theo quyết định chuyên gia nghiệp vụ – rà 3 mốc ở **Đơn đặt phòng**, sau hạn Desk chỉ còn Hủy, có cọc thì để nguyên đơn và làm lại khi khách đến (2.1, 2.2, 2.4, 2.8); tờ **Your ID details** trước khi nhận giấy tờ, câu đồng ý mới (0.8, 2.10, 2.11, 5.4); chỉ in phiếu sau khi hoàn tất (2.14); một người trực giữ 6 vai (Cách đọc); cập nhật 5.6, 5.8 |
| 1.2 | 27/10/2026 | BA | Sửa theo kết quả QA kiểm trên staging rc.3 (Q1–Q14, D14–D19, M1–M64), lỗi BUG-R3-019…032 (khung "Lỗi đang sửa"), review SEC (18 thẻ: báo lỗi không kèm dữ liệu khách, giao mã cửa có điều kiện, danh sách giấy 22:00, mã khôi phục, nhắn khách từ tài khoản OTTIMO, kiểm tiền, thẻ thanh toán) và biện pháp bù SEC B1–B6 (kiểm bảo mật mỗi sáng, QR "vừa đổi tài khoản nhận"). Thêm ảnh C0-08b |
| 1.1 | 27/10/2026 | BA | Sửa theo review DOM (23 thẻ) và PO (14 thẻ): mã cửa không gửi qua tin nhắn, trả phòng sớm tạm (2.14a), kiểm tiền chuyển khoản tạm, đóng ca có quỹ lẻ, khách OTA trả trước, nhiều căn (2.5a), dài hạn (lịch thu, điện nước, công tơ), hóa đơn mọi phiếu, dự phòng mất mạng, từ ngữ (5.0), đào tạo (5.8), việc riêng lễ tân trưởng (2.22). Còn chờ QA (Q1–Q19), ESC-038, ESC-039, ESC-035 |
| 1.0 | 27/10/2026 | BA | Bản đầu theo `v1.0.0-rc.3` (`70fe734`). Chờ QA chụp ảnh và kiểm các điểm ghi chú trong mã nguồn tệp, UXD dựng HTML theo nhận diện OTTIMO |

### 5.8 Đào tạo theo bộ phận

**Tập ở đâu:**
- Tập mọi thao tác trên **Desk tập** (trang tập, dữ liệu giả) bằng **tài khoản tập** đội tạo sẵn cho từng người. Địa chỉ và tài khoản tập: chủ đầu tư đưa tận tay trong buổi đào tạo.
- Mật khẩu Desk tập **khác** mật khẩu Desk thật. Không dùng lại mật khẩu Desk thật ở bất kỳ trang nào khác.
- Tài khoản tập bị khóa sau buổi đào tạo cuối. Cần tập thêm thì nhờ chủ đầu tư.
- Chỉ mở Desk tập bằng địa chỉ chủ đầu tư đưa. Không bấm link "trang tập" gửi qua Zalo, email.
- Trên Desk tập: mã VietQR **không dùng để chuyển tiền**; không nhập giấy tờ, số điện thoại hay tài khoản thật.
- Trên **Desk thật** trước 02/11: mỗi người chỉ **đăng nhập, đổi mật khẩu tạm, đăng xuất**. Không tạo đơn, không thu tiền thử.
<!-- Desk tập = staging (desk.staging.ottimo.vn, staff.staging.ottimo.vn). Tài khoản tập do QA/OPS tạo theo ORC (decision-log PO 27/10, checklist INV C3a). Không ghi địa chỉ staging vào bản phát tay theo đề xuất PO thẻ 03; UXD/ORC quyết có in địa chỉ hay không. -->

| Bộ phận | Đọc | Bài tập (trên Desk tập) | Thời lượng |
|---|---|---|---|
| Chủ đầu tư, quản lý | Chương 0, 1, mục 2.13–2.15, 5 | (1) Đăng nhập 2 bước, tạo bộ mã khôi phục mới (trên máy riêng). Chủ đầu tư: làm thử một lượt kiểm bảo mật buổi sáng (mục 1.1). (2) Đổi giá đêm một căn có ngày hiệu lực. (3) Duyệt và từ chối một yêu cầu miễn phí ở **Cần duyệt**. (4) Xem lại một phụ thu trả muộn bằng giá 1 đêm: **Mở folio** → **Đã xem**. (5) Đối soát một khoản ở **Chờ đối soát** | 2 giờ |
| Lễ tân, lễ tân trưởng | Chương 0, 2, mục 3.2, 5 | (1) Báo giá → giữ chỗ → xác nhận cọc; nhận diện mã VietQR có dòng "Tài khoản nhận vừa đổi" và nói được việc phải làm. (2) Đặt phòng Trực tiếp và đơn OTA nhập tay. (3) Nhận phòng đủ 4 bước, có khách nhận sớm; nói được điều kiện giao mã cửa và câu từ chối gửi mã qua tin nhắn. (4) Thêm phát sinh, gia hạn 1 đêm. (5) Trả phòng 3 bước, xem và in phiếu thanh toán. (6) Rà giữ chỗ ở **Đơn đặt phòng** → **Đang hiệu lực** → **Giữ chỗ · chờ cọc**; nói được 3 mốc rà, việc trước hạn, và cách xử lý sau hạn cho giữ chỗ chưa cọc (hủy ngay, tạo lại 1 lần) và có cọc (hủy – hoàn, hoặc để nguyên rồi làm lại khi khách đến); nhận ra dòng "đơn đã tự hủy" và "Không thu phí" sai với đơn có cọc; chọn đúng lý do hủy (không chọn **Khác**); nói được vì sao chủ đầu tư phải duyệt và chi khoản hoàn người trực tạo, và hẹn khách thế nào khi chủ đầu tư vắng (mục 2.4). (7) Chỉ tờ **Your ID details** trước khi nhận giấy tờ, rồi đọc câu hỏi đồng ý lưu ảnh (EN và VI) ở Khối 1; gửi link check-in online cho một đơn đã xác nhận trên Desk tập, nói được việc phải làm khi gửi nhầm người (mục 2.9). Lễ tân trưởng thêm: duyệt một yêu cầu, kiểm phòng trên app nhân viên | 3 giờ |
| Buồng phòng | Chương 0 (0.2, 0.8), 3 | (1) Bắt đầu dọn → Dọn xong. (2) Khách không muốn dọn. (3) Báo sự cố có ảnh, đề nghị khóa căn. (4) Bấm một việc khi tắt mạng, xem **Thao tác trên máy**, bật mạng lại | 1 giờ |
| Bảo trì | Chương 0 (0.2, 0.8), 3.9, 4.1 | (1) Nhận việc phiếu Gấp. (2) Chờ vật tư rồi Sửa tiếp. (3) Sửa xong có ảnh, xem căn mở bán lại | 45 phút |
| Sale, CTV | Chương 0 (0.2, 0.8), 4.2 | (1) Báo giá, sao chép gửi Zalo. (2) Giữ chỗ. (3) CTV: báo đã chuyển cọc kèm ảnh biên nhận giả | 45 phút |
| Kế toán | Chương 0 (0.8), 4.3, mục 1.12–1.14, 2.16 | Cùng chủ đầu tư đọc **Nhật ký tiền** một ngày trên Desk tập; đối chiếu theo cách thanh toán | 1 giờ |

**Xác nhận đã học** (chủ đầu tư giữ ở OTTIMO, không gửi đội):

| Họ tên | Bộ phận | Ngày học | Làm được các bài tập (Có/Chưa) | Chữ ký nhân viên | Chữ ký người đào tạo |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |
