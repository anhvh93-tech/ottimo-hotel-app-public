# Sổ tay sử dụng OTTIMO Desk v1.0

- Dành cho: Chủ đầu tư dùng để đào tạo từng bộ phận trước ngày chạy thật **thứ Hai 02/11/2026**
- Áp dụng cho: **OTTIMO Desk v1.0** – bản phát hành `v1.0.0`, chạy trên Desk thật từ 30/10/2026
- Lập: BA · 27/10/2026 · Bản nội dung 1.4 (30/10/2026: Product Owner cập nhật theo bản `v1.0.0` và kết quả thử luồng giữ chỗ quá hạn trên bản thật; trước đó đã sửa theo góp ý của chuyên gia nghiệp vụ, Product Owner, bảo mật và kết quả kiểm trên bản thật)
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
| `ottimo.vn` | **Website** | Khách tìm hiểu | Mọi thiết bị | Giới thiệu OTTIMO; nút Zalo, gọi điện, email |

- Trang khách không có tên đăng nhập. Mỗi đơn có một link riêng do lễ tân tạo (mục 2.9). **Từ 02/11 tới bản v1.0.1, chưa gửi link cho khách thật** (mục 2.9).
- Form "Yêu cầu đặt phòng" trên website **đang tắt** (chủ đầu tư quyết ngày 26/10: bật khi luật sư trả lời). Khách liên hệ qua Zalo hoặc điện thoại.

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

Menu dưới tên của mình gồm: **Đổi mật khẩu** · **Xác thực 2 bước** · **Ngôn ngữ giao diện** · **Giao diện** (Theo máy / Sáng / Tối) · **Đăng xuất**.

[ẢNH: C0-06-Menu Tài khoản]

### 0.3 Đăng nhập 2 bước (bắt buộc với chủ đầu tư và quản lý)

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

**Sắp hết mã khôi phục:** Desk nhắc "Sắp hết mã khôi phục". Bấm **tên của mình → Xác thực 2 bước → Tạo bộ mã mới** (trên máy riêng). Bộ cũ hết hiệu lực ngay.

### 0.4 Mất điện thoại, quên mật khẩu

| Tình huống | Làm gì |
|---|---|
| Lễ tân, buồng phòng, bảo trì, sale quên mật khẩu | **Báo chủ đầu tư.** Chủ đầu tư đặt lại, đưa mật khẩu tạm tận tay |
| Nhân viên mất điện thoại có đăng nhập app nhân viên | **Báo chủ đầu tư ngay** để khóa tài khoản và đặt lại mật khẩu |
| Chủ đầu tư hoặc quản lý mất điện thoại, còn mã khôi phục | Ở màn nhập mã, bấm **Mất điện thoại? Dùng mã khôi phục**, nhập một mã, bấm **Đăng nhập bằng mã khôi phục**. Desk mở **Đăng ký lại trên điện thoại mới**: làm lại như mục 0.3. Quản lý: rồi **báo chủ đầu tư** để **Đặt lại mật khẩu** cho mình (Desk đăng xuất trên mọi máy, kể cả máy bị mất) |
| Mất điện thoại hoặc máy tính bảng có **app khóa cửa** | **Báo chủ đầu tư ngay** để đổi mật khẩu tài khoản app khóa và thu hồi quyền của máy đó |
| Quản lý mất cả điện thoại lẫn mã khôi phục | **Báo chủ đầu tư.** Không xin mã của người khác |
| Chủ đầu tư mất cả điện thoại lẫn mã khôi phục | Chủ đầu tư làm theo thủ tục khôi phục riêng đã diễn tập với đội kỹ thuật (không ghi trong sổ tay này) |

**Không ai** – chủ đầu tư, quản lý, đội kỹ thuật, ngân hàng hay OTA – hỏi mật khẩu, mã 6 số hay mã khôi phục của anh/chị. Ai hỏi thì không đưa và báo chủ đầu tư.

### 0.5 Máy quầy được cấp quyền

- Giấy tờ khách, ảnh giấy tờ và **Nhận phòng** chỉ làm được trên **máy đã được chủ đầu tư cấp quyền** (mục 1.6).
- Góc trái màn hình Desk hiện **Máy quầy đã cấp quyền** hoặc **Máy chưa cấp quyền giấy tờ**.
- Trên máy chưa cấp quyền, mục menu **Giấy tờ & khai báo** và bước giấy tờ khi nhận phòng đều bị ẩn; Desk báo "Máy này chưa được cấp quyền". Điện thoại cá nhân không bao giờ được cấp quyền.
- Máy quầy đã cấp quyền **không cài, không mở Zalo, Zalo Web hay ứng dụng chat** nào, và không dùng để nhắn khách (mục 2.4).

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
> - Mất mạng: dùng danh sách để giao căn đã sạch cho khách có tên trong danh sách **sau khi xem giấy tờ gốc** của người đứng tên, thu tiền, ghi sổ giấy, nhập bù trong 24 giờ. **Không chụp giấy tờ khách bằng điện thoại** để nhập sau. Có mạng lại thì nhập giấy tờ trên máy quầy (khách đưa lại giấy tờ tại quầy; link check-in online đang tạm dừng – mục 2.9) và giữ đúng hạn khai báo (mục 2.11).
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
| Sáng, cùng lượt kiểm bảo mật (tới v1.0.1) | Xem lại các dòng có chữ "giữ chỗ" trong sổ giao ca và các yêu cầu hoàn mới; **duyệt và chi các khoản hoàn người trực tạo** (người trực không tự duyệt, không tự chi được – mục 2.4). Xem lại các khoản miễn/giảm người trực làm bằng quyền quản lý | Sổ giao ca, **Cần duyệt**, **Nhật ký tiền → Hoàn tiền** |
| Trong ngày | Duyệt yêu cầu miễn/giảm, hoàn tiền, xóa công nợ | **Cần duyệt** |
| Trong 24 giờ sau mỗi lần trả muộn quá 18:00 | Xem lại phụ thu bằng giá 1 đêm (mục 1.9) | **Tổng quan → Cần chú ý** |
| Mỗi ngày | Đối chiếu chuyển khoản với sao kê | **Nhật ký tiền → Chờ đối soát** |
| Cuối ngày (3 ngày đầu: 22:00 cùng lễ tân) | Đối chiếu tiền trong ngày với sổ giấy và két | **Nhật ký tiền** (mục 1.13) |

> **Tạm ở v1.0 – kiểm bảo mật mỗi sáng** (tới khi thư "Security notice" về tới chủ đầu tư; lỗi đang sửa ở bản vá): ở v1.0 thư báo đổi tài khoản nhận tiền, dùng mã khôi phục, đặt lại 2 bước **chưa gửi tới ai**. Vì vậy mỗi sáng trước 09:00:
> 1. **Chủ đầu tư** mở **Tham số quy tắc → Tài khoản nhận chuyển khoản (VietQR)**: đúng **một** dòng **Đang dùng**, tên chủ tài khoản đúng, **không** có dòng **Đã lên lịch** lạ. Có dòng lạ: **Hủy lịch** ngay và làm theo mục 1.7 "Nhận thông báo đổi tài khoản nhận mà anh/chị không làm".
> 2. **Chủ đầu tư** xem **Tổng quan → Cần chú ý** và **Nhật ký tiền** từ hôm qua tới hôm nay: có dòng **Đổi tài khoản nhận chuyển khoản** mà mình không làm, hay dấu hiệu ai đó dùng mã khôi phục/đặt lại 2 bước của mình, thì **gọi đội ngay**. Không đổi lại tài khoản trên chính phiên đó.
> 3. **Chủ đầu tư hoặc quản lý** đối soát tiền chuyển khoản trên app ngân hàng với các khoản VietQR trên Desk của ngày hôm trước (mục 1.12). Khoản Desk ghi nhận mà ngân hàng không có: báo chủ đầu tư ngay.
> 4. **Chủ đầu tư** ghi một dòng vào sổ giao ca: "Đã kiểm TK nhận + nhật ký – <giờ>". Không ghi số tài khoản.
<!-- SEC-on-B2-readiness mục 1.3 B1–B4; BUG-R3-032 (P1, v1.0.1). Desk v1.0 không có chuông thông báo và không có màn nhật ký security/config: "chuông" = Tổng quan → Cần chú ý; đổi tài khoản nhận hiện trong Nhật ký tiền (config.changed → "Đổi tài khoản nhận chuyển khoản"); sự kiện mfa.* chưa xem được trên Desk – SEC/QA xác nhận cách chủ đầu tư thấy mfa.recovery_code_used/mfa.reset* ở v1.0. -->

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
- Desk **tự cộng** đêm thứ Sáu, thứ Bảy **+15 %** và **ngày đặc biệt +30 %**. Anh/chị **không** nhập giá cuối tuần riêng.
- Ngày đặc biệt (+30 %, tối thiểu 2 đêm, không hoàn cọc khi hủy) đang cài: đêm 24/12/2026–01/01/2027 · Tết Nguyên đán đêm 05–10/02/2027 · Giỗ Tổ Hùng Vương đêm 16/4/2027 · đêm 30/4 và 1/5/2027 · đêm 1/9 và 2/9/2027. Danh sách đầy đủ ở **Tham số quy tắc**. Chủ đầu tư thêm ngày thì Desk tự áp.
- Đơn ≥ 7 đêm Desk tự giảm 10 %, ≥ 14 đêm giảm 15 % (kênh Trực tiếp, CTV).

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
- Đơn, báo giá, hợp đồng tạo **trước** ngày hiệu lực **giữ giá cũ**.
- **Lỡ lên lịch nhầm một giá tương lai:** mở **Sửa**, chọn **đúng ngày hiệu lực** của giá nhầm, nhập giá đúng, **Lưu**. Giá đúng thay giá nhầm của ngày đó; giá lên lịch ngày khác giữ nguyên.

[ẢNH: C1-04-Sửa giá đã lên lịch]

> **Tạm ở v1.0:** Desk chưa hiện danh sách giá đã lên lịch và chưa có nút hủy (dự kiến v1.0.1). Mỗi lần lên lịch giá cho ngày sau, ghi **căn, giá, ngày hiệu lực** vào sổ. Muốn bỏ một giá đã lên lịch: nhập lại giá hiện hành với **đúng ngày hiệu lực** đó.

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
- **Form "Yêu cầu đặt phòng" trên website**: công tắc nằm ở nhóm **Khác**, dòng `public_booking_requests_enabled` (chưa có tên tiếng Việt), giá trị `false` là tắt. Chỉ chủ đầu tư bật. Theo quyết định của chủ đầu tư ngày 26/10, **giữ tắt** tới khi luật sư trả lời.

> **Lỗi đang sửa – Wi-Fi (sửa ở v1.0.1):** Desk chưa có chỗ nhập Wi-Fi của cơ sở, nên trang khách chưa hiện Wi-Fi (từ bản `v1.0.0`, ngày đến và trong lúc ở trang khách ghi "hỏi lễ tân"). Tới khi sửa xong: khách xem **thẻ Wi-Fi trong căn**; lễ tân đọc tên mạng và mật khẩu Wi-Fi khi khách hỏi. Đừng nói khách "xem Wi-Fi trên trang khách".

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
- **Khóa tài khoản**: dùng khi nghỉ việc hoặc mất điện thoại. Desk hỏi **Mật khẩu đăng nhập** và **Mã trong ứng dụng xác thực (6 số)**. **Mở khóa** khi cần dùng lại.
- Trạng thái **Tạm khóa do sai mật khẩu**: chờ hết thời gian khóa, hoặc đặt lại mật khẩu.

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

> **Lỗi đang sửa:** ở v1.0 thư báo đổi tài khoản nhận **chưa gửi tới email** của chủ đầu tư. Vì vậy chủ đầu tư kiểm mỗi sáng theo khung ở mục 1.1.

[ẢNH: C1-11-Tài khoản nhận đang dùng]

> **Lỗi nhỏ đã biết (sửa ở v1.0.1):** câu gợi ý trên màn bảo "tạo một mã VietQR nhỏ và quét thử". Làm theo sổ tay: **không tạo mã thử, không chuyển tiền** (gạch đầu tiên bên dưới).

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
| Nhận phòng khi buồng chưa sẵn sàng | Lễ tân | Lễ tân trưởng trở lên |
| Trả muộn khi có khách đến cùng ngày, không còn căn thay | Lễ tân trở lên | Quản lý, chủ đầu tư |
| Khôi phục đơn "không đến" ngoài điều kiện tự làm | Lễ tân | Quản lý, chủ đầu tư |
| Gia hạn báo giá đã hết hiệu lực | Sale, CTV | Quản lý, chủ đầu tư |

**Duyệt hoặc từ chối:**
1. **Cần duyệt** (hoặc **Tổng quan → Cần duyệt**).
2. Đọc: ai gửi, lúc nào, số tiền, lý do, **Cách hoàn** (với hoàn tiền).
3. Bấm **Duyệt** → nhập **Mật khẩu đăng nhập** (Desk không hỏi mã 6 số ở bước này) → xác nhận. Hoặc **Từ chối** → ghi **Lý do từ chối** + **Mật khẩu đăng nhập**.
4. Yêu cầu bị sửa sau khi anh/chị mở: Desk báo, bấm **Tải lại** rồi quyết định.

[ẢNH: C1-13-Cần duyệt]
[ẢNH: C1-14-Hộp duyệt]

**Luôn duyệt bằng tài khoản của chính mình.** Ở v1.0, Desk từ chối mọi ô "mật khẩu của quản lý" trên phiên của lễ tân (vì quản lý có 2 bước). Khi lễ tân cần duyệt ngay tại quầy: lễ tân **đăng xuất**, quản lý đăng nhập tài khoản mình trên máy quầy, duyệt, đăng xuất; hoặc quản lý duyệt trên laptop riêng.

> **Tạm ở v1.0:** chưa có xác nhận từ xa trên điện thoại của quản lý (có ở v1.1). Không đọc mật khẩu qua điện thoại, không đưa mật khẩu cho lễ tân gõ hộ.

Quy tắc tách nhiệm (Desk tự kiểm):
- Không ai tự duyệt yêu cầu của chính mình, trừ khoản nằm trong hạn mức tự áp của vai.
- **Hoàn tiền không có ngoại lệ:** người tạo yêu cầu hoàn (hủy đơn, sửa dòng…) không tự duyệt và không tự chi, kể cả quản lý, chủ đầu tư. Desk từ chối, yêu cầu vẫn chờ người duyệt khác.
- Hoàn **tiền mặt**: người nhập nơi nhận không duyệt được khoản đó, kể cả chủ đầu tư. Vì vậy người tạo yêu cầu nhập nơi nhận trước, rồi người khác duyệt. Người duyệt được chi tiền mặt.
- Hoàn chuyển khoản: người chi ≠ người tạo yêu cầu ≠ người duyệt ≠ người nhập nơi nhận. **Riêng chủ đầu tư** được vừa duyệt vừa chi cùng một khoản. **Quản lý không bao giờ** vừa duyệt vừa chi cùng một khoản.
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
<!-- BUG-R3-022 Closed 28/10 (rc.4, qa3-rc1.md 17.5). Sửa 30/10 theo BA M13-04, M13-05: folio-lines.service.ts chặn folio closed và settled quá post_checkout_window_until với mọi vai; FolioDialog canAdjust = settled ? mgr : fd; AddChargeDialog evidenceRequired, houseRulesMissing. Câu error.FOLIO_LOCKED sai vế sau = BUG-R3-045 (P3, v1.0.1). Ca folio `closed` chưa diễn tập trên staging. -->
- Khách trả phòng sớm: quản lý điều chỉnh tiền phòng các đêm chưa ở theo mục 2.14a bước 6.

### 1.12 Nhật ký tiền, đối soát và hoàn tiền

**Quản trị → Nhật ký tiền** có 3 tab:

| Tab | Dùng để |
|---|---|
| **Nhật ký thao tác tiền** | Xem mọi thao tác tiền: lúc nào, ai làm, thao tác gì, đơn nào, trước → sau, lý do. Lọc **Từ ngày** – **Đến ngày** (không lọc theo giờ, không lọc theo người). Lễ tân chỉ thấy khoản của mình |
| **Chờ đối soát** | Khớp từng khoản chuyển khoản, VietQR với sao kê ngân hàng |
| **Hoàn tiền** | Nhập nơi nhận hoàn, chi hoàn tiền mặt, ghi đã hoàn chuyển khoản |

[ẢNH: C1-18-Nhật ký thao tác tiền]

> **Lỗi nhỏ đã biết (sửa ở v1.0.2):** cột lý do có thể hiện **mã lý do thô** (chữ tiếng Anh nối bằng gạch dưới). Đọc phần lý do người làm tự ghi, bỏ qua mã.

**Đối soát chuyển khoản (mỗi ngày, quản lý hoặc chủ đầu tư):**
1. Mở tab **Chờ đối soát**. Mở sao kê ngân hàng cùng lúc.
2. Với mỗi khoản: thấy tiền về thì bấm **Đã khớp sao kê** → xác nhận. Không thấy tiền thì bấm **Không thấy tiền**: folio trở lại còn phải thu, quản lý được báo.
3. Khoản quá 2 ngày chưa đối soát hiện **Quá … ngày**.
4. Không đối soát khoản do chính mình ghi (trừ chủ đầu tư).

[ẢNH: C1-19-Chờ đối soát]

"Chờ đối soát" vẫn tính là đã thu: lễ tân nhận phòng, trả phòng bình thường.

**Hoàn tiền chuyển khoản (sau khi đã duyệt):**
1. Tab **Hoàn tiền**. Khoản chưa có nơi nhận: **Nhập nơi nhận hoàn** (**Cách hoàn**: Tiền mặt, Chuyển khoản, Cùng cách khách đã trả). Thường người tạo yêu cầu nhập trước khi duyệt; người nhập nơi nhận **tiền mặt** không duyệt được khoản đó (mục 1.8).
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
4. **Rà giữ chỗ (tới bản v1.0.1):** theo khung "Giữ chỗ quá hạn" ở mục 2.4 – **Đơn đặt phòng** → lọc **Đang hiệu lực** → mở từng dòng **Giữ chỗ · chờ cọc**. Rà **3 mốc mỗi ngày**: lúc mở quầy (muộn nhất 09:00), **11:00**, trước khi rời quầy (muộn nhất 21:00); thêm mỗi lần thấy **Giữ chỗ sắp hết hạn**.
5. Bàn giao với ca trước: tiền mặt trong két, việc dở dang (sổ giao ca).

**Cuối ca:**
1. **Cần chú ý** không còn dòng đỏ chưa xử lý (hoặc đã ghi chú, bàn giao). Tới v1.0.1: mọi giữ chỗ "còn 0 giờ 00 phút" đỏ đã hủy, hoặc đã có dòng "Giữ – …" trong sổ giao ca (mục 2.4). Đơn đã có dòng đó không phải xử lý lại ở lượt rà sau.
2. Đối chiếu tiền mặt theo mục 1.14.
3. Ba ngày đầu: so sổ giấy với Desk lúc 22:00.
4. **Đăng xuất**.

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

> **Lỗi nhỏ đã biết (sửa ở v1.0.1):** trong **Cần chú ý**, dòng giữ chỗ sắp hết hạn chưa ghi mã đơn. Bấm vào dòng để mở đơn.

### 2.3 Sơ đồ phòng

1. **Vận hành → Sơ đồ phòng**. Lưới 10 căn × 14 ngày.
2. **Lùi 7 ngày** / **Tới 7 ngày** / **Hôm nay** để đổi khoảng ngày. **Kiểu xem**: **Lưới** hoặc **Danh sách**. Lọc **Nhóm căn**.
3. Mỗi thanh là một đơn: **Giữ chỗ · chờ cọc**, **Đã xác nhận**, **Đang ở**, **Đã trả phòng**, **Hợp đồng dài hạn** (nhãn **HĐ**, **Nhập tay**), **Khóa phòng**.
4. Bấm vào thanh để mở **khung đơn**. Bấm vào **ô trống** để đặt căn đó từ ngày đó.
5. Làn **Chưa gán căn – xung đột OTA** hiện đơn OTA về khi căn đã kín (mục 2.6).
6. Đơn đã hủy, không đến không hiện trên sơ đồ.

[ẢNH: C2-02-Sơ đồ phòng, chú giải]

### 2.4 Báo giá, giữ chỗ và cọc VietQR

**Nhắn khách từ đâu:** chỉ từ **tài khoản Zalo/số điện thoại của OTTIMO trên điện thoại của cơ sở** (hoặc hộp thư OTA). Không nhắn khách từ Zalo cá nhân. **Máy quầy đã cấp quyền không cài và không mở Zalo/Zalo Web.** Mở Desk trên điện thoại cơ sở để **Sao chép gửi Zalo**.
<!-- [GIẢ ĐỊNH – chờ INV xác nhận] (SEC FB-R3-SEC-BA-09): OTTIMO có tài khoản Zalo của cơ sở (OA hoặc số cơ sở) trên điện thoại của cơ sở. Nếu chưa có, dùng tạm số điện thoại cơ sở. -->

Tin có số tiền hoặc mã VietQR: chỉ gửi mã **Desk vừa tạo cho đúng đơn**, kèm câu: "OTTIMO only messages you from this account and your OTA inbox, and never changes bank details by message." / "OTTIMO chỉ nhắn từ tài khoản này và hộp thư OTA, không bao giờ đổi số tài khoản qua tin nhắn." Không gửi ảnh QR cũ, không gõ số tài khoản bằng tay.
<!-- UXD hoàn thiện câu chống giả danh theo brand guideline (SEC thẻ 09). -->

**Báo giá:**
1. **Khách & bán → Báo giá & giữ chỗ**, tab **Căn trống**.
2. Nhập **Ngày đến**, **Số đêm**, **Người lớn (từ 12 tuổi)**, trẻ em.
3. Chọn căn trong danh sách căn trống. Desk mở **Báo giá**: số đêm thường, số đêm thứ Sáu/thứ Bảy, giảm theo số đêm, phụ thu người, **Tổng tiền đơn**, **Cọc để giữ phòng** (30 % tiền phòng). Chọn **Khách đứng tên** ngay trong hộp này (tìm, hoặc **Tạo nhanh khách**).
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
- Khách chuyển thiếu: vẫn ghi được số đã nhận; đơn giữ **Giữ chỗ · chờ cọc** và hiện số còn thiếu. **Gọi hoặc nhắn khách ngay trong ngày** xin phần còn lại trước hạn. Ở v1.0 Desk **chưa có** "Chấp nhận cọc thiếu": giữ chỗ cọc thiếu không thành **Đã xác nhận** được. Khách nói "trả phần còn lại khi đến": nói thật với khách và chọn (a) khách chuyển nốt trước hạn, hoặc (b) giữ đơn theo khung bên dưới, báo khách khi nhận phòng sẽ thanh toán đủ và khoản đã chuyển được chủ đầu tư hoàn lại (tại quầy hoặc chuyển khoản trong ngày).
- Thấy **Giữ chỗ sắp hết hạn** (Desk nhắc 2 giờ trước hạn ở **Cần chú ý** và hộp thông báo): gọi khách ngay.
- Khách chuyển dư: ghi **Lý do thu vượt**; phần dư thành tiền thừa của khách.
- Mã VietQR hết hạn: bấm **Tạo mã VietQR mới** (mã cũ hết hiệu lực), hoặc ghi như chuyển khoản tay (**Chờ đối soát**).
- Gia hạn giữ chỗ: **Gia hạn giữ chỗ (1 lần)**, tối đa thêm 24 giờ, không quá 12:00 ngày đến. **Chỉ làm trước hạn**; sau hạn nút này không còn.
- Sale/CTV đã báo khách chuyển cọc: khung đơn hiện **CTV/sale đã báo chuyển cọc** kèm **Xem ảnh biên nhận**. Vẫn kiểm sao kê trước khi xác nhận.
- Khung đơn giữ chỗ hiện **Tạo link check-in online** và **Thu hồi link**: **không bấm**. Desk chỉ cấp link cho đơn đã xác nhận nên luôn từ chối (lỗi nhỏ, dự kiến sửa ở v1.0.1); check-in online cũng đang tạm dừng (mục 2.9).

> **Lỗi nhỏ đã biết (sửa ở v1.0.1):** hộp "Giữ chỗ" hiện số cọc và nội dung chuyển khoản hai lần; khách đến hôm nay vẫn hiện ô chọn thời hạn giữ dù không giữ được.

**Giữ chỗ tới hạn – Desk tự làm gì:**
- **Chưa cọc:** Desk tự hủy trong khoảng 1 phút sau hạn, nhả căn, không phí.
- **Đã nhận cọc (đủ hoặc thiếu):** Desk **không** tự hủy (có tiền của khách). Đơn giữ nguyên **Giữ chỗ · chờ cọc**, căn vẫn bị giữ, đồng hồ hiện **"còn 0 giờ 00 phút"** màu đỏ (trong sổ tay gọi tắt là **"0h00"**). Phải xử lý trước **12:00 ngày đến**.

> **Lỗi đang sửa – Giữ chỗ quá hạn (tới bản v1.0.1).** Ở v1.0:
> - Desk chưa đưa giữ chỗ quá hạn vào **Cần chú ý** hay hộp thông báo. Riêng giữ chỗ **có yêu cầu giảm giá hoặc miễn phí (FOC)** thì không tự hủy, kể cả khi chưa cọc.
> - **Sau hạn chỉ còn Hủy giữ chỗ.** Desk từ chối **Xác nhận đã nhận cọc** ("Giữ chỗ đã hết hạn…"), ẩn **Gia hạn giữ chỗ**, và chưa có "Chấp nhận cọc thiếu".
> - **Desk ghi sai với giữ chỗ có cọc:** khung đơn ghi "Giữ chỗ đã hết hạn lúc … – **đơn đã tự hủy**", câu lỗi ghi "căn đã **mở bán lại**". Thực tế đơn **chưa** hủy (trạng thái vẫn **Giữ chỗ · chờ cọc**), căn vẫn bị giữ, tiền khách vẫn trên đơn. Hộp hủy ghi "**Không thu phí (giữ chỗ chưa cọc)**" và không hiện dòng hoàn: **đừng tin dòng này** – Desk vẫn tạo yêu cầu hoàn đủ số đã nhận.
>
> **Rà ở đâu, khi nào.** Người trực rà **3 mốc mỗi ngày**: lúc mở quầy (muộn nhất 09:00), **11:00** (trước trần 12:00 ngày đến), trước khi rời quầy (muộn nhất 21:00); thêm mỗi lần thấy **Giữ chỗ sắp hết hạn**. Lượt rà đủ: **Đơn đặt phòng** → lọc **Đang hiệu lực** → mở từng dòng **Giữ chỗ · chờ cọc** (10 căn, 1–2 phút). **Hôm nay** chỉ có giữ chỗ đến hôm nay; **Sơ đồ phòng** chỉ hiện 14 ngày – hai màn này chỉ để nhìn nhanh. Xử lý theo thứ tự:
> 1. **Còn dưới 2 giờ:** xử lý **trước hạn** (Lưu ý ở trên). Đây là việc chính.
> 2. **Chưa cọc mà đã "còn 0 giờ 00 phút"** (thường là đơn có yêu cầu giảm giá/FOC):
>    - **Hủy giữ chỗ** ngay khi thấy, không chờ gọi khách. **Lý do hủy**: **Không liên lạc được** (khách không cọc tới hạn). Không chọn **Khác (ghi rõ)** (khung "Hủy với lý do Khác" bên dưới). Ghi sổ giao ca "OTM-… hủy – hết hạn giữ chỗ, chưa cọc". Không phí. Căn mở lại.
>    - Nhắn hoặc gọi khách (đơn CTV: nhắn CTV trước; CTV liên hệ khách trong 1 giờ, quá 1 giờ hoặc đã 11:00 ngày đến thì gọi thẳng số khách trên đơn). Khách còn muốn:
>      - **Đến từ ngày mai:** tạo **giữ chỗ mới**, chọn **12 h**. Báo giá cũ còn hiệu lực (3 ngày): bấm lại **Khách đồng ý – Giữ chỗ** từ báo giá đó; hết hiệu lực thì **Lập báo giá mới** theo giá hiện hành. Giảm giá hoặc FOC của đơn cũ phải xin lại (người trực tự duyệt bằng quyền quản lý, có lý do). Ghi sổ giao ca "Tạo lại từ OTM-… (hết hạn dd/mm)".
>      - **Đến hôm nay:** không giữ chỗ được. Gửi VietQR, tạo đơn khi tiền về. Khách đang trên đường: căn còn thì nhận khi tới, như khách vãng lai.
>    - **Chỉ tạo lại một lần** cho cùng khách, cùng kỳ ở. Giữ chỗ tạo lại mà lại quá hạn: hủy, không giữ nữa.
>    - Không cần báo ai. Báo chủ đầu tư chỉ khi khách đòi giữ giá cũ mà báo giá đã hết hiệu lực và giá hiện hành cao hơn.
> 3. **Đã có cọc mà đã "còn 0 giờ 00 phút":** gọi khách, rồi làm theo bảng dưới. **Không** bấm **Xác nhận đã nhận cọc** (Desk từ chối). **Không** tạo đơn mới trước khi hủy đơn cũ (Desk chặn trùng, hoặc ghi cọc hai lần).
>
> Ví dụ: căn 202, 3 đêm 05–08/11 = 2.376.000 đ, cọc yêu cầu 700.000 đ, khách đã chuyển 300.000 đ, hạn 10:00 03/11.
>
> | Khách nói | Làm gì ở v1.0 | Ai, hạn |
> |---|---|---|
> | "Không đi nữa", hoặc không liên lạc được tới **11:00 ngày đến** | **Hủy giữ chỗ**, **Lý do hủy**: **Khách đổi ý** (khách báo không đi) hoặc **Không liên lạc được** (gọi không được). Không chọn **Khác (ghi rõ)**. Desk giữ lại 0 đ, tạo yêu cầu hoàn **300.000 đ** (hộp hủy không hiện dòng này). Người trực mở **Nhật ký tiền → Hoàn tiền** → **Nhập nơi nhận hoàn**, **Cách hoàn**: **Cùng cách khách đã trả**. Ghi sổ giao ca "OTM-… hủy – hết hạn giữ chỗ, có cọc – chờ chủ đầu tư hoàn 300.000". **Chủ đầu tư duyệt** ở **Cần duyệt** rồi **chi** | Người trực hủy và nhập nơi nhận; **chủ đầu tư duyệt và chi**. Desk không cho người tạo yêu cầu hoàn tự duyệt hay tự chi, kể cả có quyền quản lý. Hủy muộn nhất 12:00 ngày đến |
> | "Vẫn đi, trả nốt" (chuyển nốt hoặc trả khi đến) | **Không** nhận thêm chuyển khoản vào đơn cũ (Desk không ghi được sau hạn). **Để nguyên đơn**: Desk không tự hủy đơn có cọc, căn vẫn giữ. Ghi sổ giao ca: "OTM-… Giữ – cọc thiếu 400.000, thu khi đến – [người quyết] dd/mm". Báo khách: phần còn lại thanh toán khi nhận phòng | Người trực, bằng quyền quản lý. Quyết trước 12:00 ngày đến |
> | Khách đó tới quầy (đơn vẫn **Giữ chỗ · chờ cọc**) | **Nếu chủ đầu tư đã báo v1.0.1 lên**: **Xác nhận đã nhận cọc** phần còn lại → **Nhận phòng**. **Nếu chưa**: (a) **Hủy giữ chỗ** đơn cũ, **Lý do hủy**: **Khách đổi ý** → Desk tạo yêu cầu hoàn 300.000. **Nhập nơi nhận hoàn** ngay: **Tiền mặt** nếu chủ đầu tư có mặt hoặc sẽ tới quầy trong thời gian khách ở; **Chuyển khoản** nếu không. (b) **Đặt phòng mới** cùng căn, nhập đúng giá từng đêm đã chốt. **Thu cọc ngay lúc đặt**: **Số tiền đã nhận** ít nhất bằng **Cọc cần thu** (ví dụ 700.000), chọn **Cách thanh toán** – Desk không lưu đơn khi chưa đủ cọc. Ghi sổ giao ca "OTM-mới thay OTM-cũ". (c) Ở bước nhận phòng thu **phần còn lại** (ví dụ 2.376.000 − 700.000 = **1.676.000**) → **Nhận phòng**. (d) **Chủ đầu tư duyệt và chi** 300.000: tiền mặt tại quầy (khách thực trả 2.076.000), hoặc chuyển khoản lại. **Chủ đầu tư vắng thì khách chưa nhận lại cọc cũ tại quầy được**, kể cả khi người trực có quyền quản lý. Nói thật với khách và hẹn một trong hai cách: OTTIMO chuyển khoản lại trong ngày sau khi chủ đầu tư duyệt; hoặc khách nhận tiền mặt ở quầy khi chủ đầu tư có mặt trong thời gian ở. Ghi cách đã hẹn vào sổ giao ca, báo chủ đầu tư | Người trực (a–c); chủ đầu tư duyệt và chi (d). Khi khách đến |
> | Khách đã lỡ chuyển nốt **sau** hạn | Tiền đã ở tài khoản OTTIMO nhưng Desk không ghi được vào đơn cũ. Ghi sổ giao ca: mã đơn, số tiền, giờ tiền về. Khi khách đến, làm như dòng trên. Phần đã chuyển ghi ở **bước (b)**, vào **Số tiền đã nhận**, **Cách thanh toán** chuyển khoản, ghi chú "chuyển dd/mm hh:mm". Chưa đủ **Cọc cần thu** (ví dụ đã chuyển 400.000, cọc 700.000): khách chuyển thêm phần thiếu ngay, ghi chung một khoản chuyển khoản, ghi chú cả hai lần chuyển. Bước (c) chỉ thu phần còn lại | Người trực; chủ đầu tư đối chiếu sao kê sáng hôm sau |
>
> Không hạ giá đêm để cọc yêu cầu thấp xuống cho đủ: làm sai giá và doanh thu.
>
> **Hủy với lý do Khác – lỗi đang sửa (tới v1.0.1):** chọn **Khác (ghi rõ)** thì hộp hủy báo "Chưa tính được phí hủy nên chưa hủy được" và khóa nút, kể cả khi đã gõ ghi chú và bấm **Thử lại**. Chọn lý do có sẵn: **Không liên lạc được** (gọi không được, khách không cọc tới hạn) hoặc **Khách đổi ý** (khách không đi, hoặc làm lại đơn khi khách đến). Điều cần giải thích ghi vào sổ giao ca, không ghi tên khách.
>
> **Sổ giao ca:** mỗi đơn đã xử lý một dòng – mã đơn, đã làm gì (không ghi tên khách). **Trước khi rời quầy**: mọi giữ chỗ "còn 0 giờ 00 phút" đã hủy, hoặc đã có dòng "Giữ – …". Chủ đầu tư xem lại các dòng có chữ "giữ chỗ" và các yêu cầu hoàn mới trong lượt kiểm sáng (mục 1.1).
>
> Khi OTTIMO có thêm lễ tân: rà ở đầu mỗi ca, và việc quyết đơn có cọc thiếu chuyển về quản lý. Khi chủ đầu tư báo v1.0.1 đã lên đủ bản sửa: bỏ khung này, làm theo Desk mới.
<!-- Quyết định DOM 30/10: rounds/round-03/reviews/DOM-on-PO-v1.0.0-docs.md mục A.1–A.4 (thẻ DOC-01…08), BA M13-01, M13-02, M13-03, M13-06. Lỗi: BUG-R3-041 (P2), WA-04, BUG-R3-042 (P1, V1), 043 (P2, V2), 044 (P2, V3 + M13-03) – đích v1.0.1 (backlog 5.6). Điều kiện bỏ khung: v1.0.1 có V1, V2, V4 + QA thử lại ba lối ra BR-303 trước và sau hạn (DOM-09). Lệch với DOM A.3: DOM ghi "Ghi chú nội bộ" trên đơn, nhưng khung đơn đã tạo chưa có ô ghi chú cho lễ tân (cùng lý do mục 2.14a; ô "Ghi chú nội bộ" chỉ có khi đặt đơn kênh Nội bộ) → PO dùng sổ giao ca. QA thử luồng trên staging 30/10 (rounds/round-03/qa/qa3-rc1.md mục 20, việc 20.7): không dùng lý do Khác (BUG-R3-046, P2, v1.0.1); người tạo yêu cầu hoàn không tự duyệt (SELF_APPROVAL_FORBIDDEN) và không tự chi tiền mặt (SELF_REFUND_FORBIDDEN), không ngoại lệ – sửa câu "người trực hủy và duyệt" của DOM A.3; người nhập nơi nhận tiền mặt không duyệt được khoản đó, kể cả OWN; đơn Trực tiếp mới phải đủ cọc lúc đặt (422 DEPOSIT_INSUFFICIENT); nút link check-in online trên giữ chỗ (BUG-R3-047, P3). -->

### 2.5 Đặt phòng ngắn ngày (khách trực tiếp, CTV)

1. **Sơ đồ phòng** (bấm ô trống hoặc **Đặt phòng mới**) hoặc **Đơn đặt phòng → Đặt phòng mới**.
2. **Căn**, **Ngày đến – ngày đi**. Danh sách căn có đủ các căn đang bán; Desk báo ngay dưới ô ngày là căn **còn trống cả khoảng ngày** hay đã kín, và chặn khi lưu nếu kín. (Chữ phụ trên màn "chỉ hiện căn … còn trống" chưa đúng – đang sửa.)
3. **Số khách**: **Người lớn (từ 12 tuổi)**, **Trẻ 6–11 tuổi**, **Trẻ dưới 6 tuổi**.
4. **Kênh**: **Trực tiếp**, **CTV / môi giới**, **OTA** hoặc **Nội bộ**.
   - Trực tiếp: chọn **Nguồn**: **Zalo / điện thoại**, **Website**, **Khách vãng lai**, **Khách quay lại**, **Sale nội bộ** (chọn **Người chốt**).
   - CTV: chọn **CTV chốt đơn** (bắt buộc).
   - Nội bộ: phòng dùng nội bộ, không tính doanh thu, vẫn chiếm phòng.
5. **Khách đứng tên**: gõ tên, SĐT, email hoặc mã khách để tìm. Chưa có thì **Tạo nhanh khách "…"** → hộp **Hồ sơ khách mới**: Họ và tên, **Số điện thoại / Zalo** (cần ít nhất SĐT hoặc email), Quốc tịch, Ngôn ngữ giao tiếp.
6. Kênh Trực tiếp và CTV **bắt buộc có số điện thoại**. Ô **Số điện thoại / Zalo** trên form đặt phòng chỉ hiện khi hồ sơ khách chưa có số. **Email** không bắt buộc.
7. **Giờ đến dự kiến** (nếu khách báo).
8. **Giá mỗi đêm**: Desk điền theo lịch giá (**Nguồn giá** ghi rõ). Chỉ sửa khi đã chốt giá khác với khách, trong khoảng **sàn–trần** (giá thấp nhất và cao nhất được phép nhập). **Luôn nhập giá trước giảm dài ngày.** Đơn từ 7 đêm Desk tự giảm 10 % (từ 14 đêm 15 %) trên số anh/chị nhập. Ví dụ đã báo khách căn 202, 7 đêm 9–16/11 là 5.205.000 đ: để nguyên giá lịch. Gõ giá đã giảm 713.000 thì Desk giảm tiếp còn 642.000 đ/đêm, đơn thiếu 519.000 đ.
9. Xem **Tổng tiền phòng**, **Cọc cần thu**.
10. Ô **Số tiền đã nhận** được điền sẵn bằng số cọc. **Chỉ để nguyên khi khách đã chuyển thật** (đã kiểm theo mục 2.13): chọn **Cách thanh toán**, ghi **Mã giao dịch / ghi chú**, bấm **Tạo đơn**. Khách chưa chuyển: bấm **Giữ chỗ đến …** (nút này chỉ có với kênh Trực tiếp/CTV và ngày đến từ ngày mai).
<!-- QA lượt sau (M24): khách đến hôm nay chưa trả (không có nút Giữ chỗ) – xóa số ở ô Số tiền đã nhận rồi Tạo đơn có được không, đơn ở trạng thái nào. -->

[ẢNH: C2-07-Đặt phòng mới, kênh Trực tiếp]

Desk chặn và giải thích khi:
- **Đặt trùng** căn và đêm đã có đơn. Desk gợi ý **Căn trống cùng nhóm**.
- Ngày đến thứ Sáu, thứ Bảy hoặc ngày đặc biệt mà chỉ ở 1 đêm: "Ngày này cần ở tối thiểu 2 đêm". Ngoại lệ đêm lẻ giữa hai đơn: Desk gợi ý **Dùng căn … (đêm lẻ)**.
- Vượt sức chứa căn.
- Từ **28 đêm** trở lên: Desk mở **… đêm là thuê dài hạn** → **Tạo đơn dài hạn nhập tay** (mục 2.7).
- Đặt khi mất mạng: Desk giữ **nháp** trên máy, tạo đơn khi có mạng.

> **Lỗi nhỏ đã biết (v1.0.1):** sau **Tạo nhanh khách**, ô **Khách đứng tên** đôi khi vẫn đỏ tới lần bấm sau. Bấm lại vào ô là hết.

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

### 2.7 Đơn dài hạn nhập tay

<!-- BUG-R3-019 (P1) Closed 28/10 trên rc.4 (qa3-rc1.md 17.2): bỏ khung "Lỗi đang sửa" theo chú thích BA. Q4 (17.2): folio đơn dài hạn nhập tay 0 dòng, tiền thuê và ký quỹ ghi ngoài app – khớp khung "Tạm ở" dưới đây. -->

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
   - Giữ chỗ **đã nhận một phần cọc** cũng hủy bằng nút này. Ở v1.0 hộp vẫn ghi "Không thu phí (giữ chỗ chưa cọc)" và không hiện dòng hoàn (lỗi đang sửa), nhưng Desk **vẫn tạo yêu cầu hoàn đủ số đã nhận**. Người hủy **Nhập nơi nhận hoàn** ở **Nhật ký tiền → Hoàn tiền**; **người khác người hủy** duyệt ở **Cần duyệt** và chi (hiện một người trực: chủ đầu tư duyệt và chi – mục 2.4).
2. Đơn đã xác nhận: **Hủy đơn** → **Lý do hủy**. Desk tính **phí hủy** và **khoản hoàn** theo chính sách kênh Trực tiếp/CTV. Số ngày báo trước = ngày đến − ngày khách báo (ngày trên Desk):
   - Từ 7 ngày: hoàn 100 % cọc.
   - 3–6 ngày: hoàn 50 %.
   - Dưới 3 ngày: không hoàn.
   - **Đơn có đêm ngày đặc biệt: không hoàn cọc.**
   - Ví dụ đơn đến 22/11: báo ngày 15/11 là 7 ngày, hoàn 100 %. Báo ngày 16/11 là 6 ngày, hoàn 50 %.
   - Bất khả kháng (đèo vào Đà Lạt đóng, chuyến bay hủy do thời tiết, có giấy báo của cơ quan hoặc hãng bay): không hoàn tiền mặt. Quản lý cho **dời ngày** miễn phí trong 3 tháng, áp cả ngày đặc biệt.
   - Đọc số trên hộp **Hủy đơn OTM-… của …?** trước khi bấm **Hủy đơn**. Đổi ý thì bấm **Giữ lại đơn**.
3. Đơn OTA: nhập **Tiền phạt theo kênh** đúng số kênh báo (0 nếu kênh miễn phạt).
4. Có khoản hoàn: Desk tạo yêu cầu hoàn. Người hủy nhập nơi nhận hoàn; **quản lý hoặc chủ đầu tư khác người hủy** duyệt và chi. Người hủy không tự duyệt, không tự chi được, kể cả có quyền quản lý. Hiện một người trực: chủ đầu tư duyệt và chi.
5. Khách muốn đổi ngày thay vì hủy: **Dời ngày thay vì hủy** (chỉ quản lý).

[ẢNH: C2-12-Hủy đơn]

> **Lỗi đang sửa (v1.0.1) – lý do Khác (ghi rõ):** ở cả **Hủy giữ chỗ** và **Hủy đơn**, chọn **Khác (ghi rõ)** thì hộp báo "Chưa tính được phí hủy nên chưa hủy được" và khóa nút, kể cả khi đã gõ ghi chú và bấm **Thử lại**. Chọn lý do có sẵn gần nhất (thường là **Khách đổi ý** hoặc **Không liên lạc được**). Điều cần giải thích ghi vào sổ giao ca kèm mã đơn, không ghi tên khách.

**Khách không đến:**
1. **18:00** khách chưa đến, chưa báo giờ: gọi hoặc nhắn khách.
2. **23:00** vẫn không liên lạc được: khung đơn → **Đánh dấu không đến** → ghi **Kết quả liên lạc** (**Gọi không nghe máy**, **Khách báo đến trễ**…) → **Đánh dấu không đến**. Nút chỉ mở từ 23:00 và sau khi ghi kết quả liên lạc. **Đơn OTA: kiểm extranet trước.** Khách đã hủy trên kênh thì hủy theo kênh, không đánh dấu không đến.
3. Đơn Trực tiếp: Desk giữ **toàn bộ cọc**, hủy các đêm còn lại, mở bán lại căn. Đơn OTA: Desk tạo việc **Báo khách không đến cho …** để báo kênh.
4. Khách đến sau khi đã đánh dấu: **Khôi phục đơn không đến** (trong ngày nghiệp vụ của đêm đến, căn còn trống). Ngoài điều kiện: **Gửi yêu cầu khôi phục** cho quản lý.
5. Đơn đã trả đủ tiền phòng hoặc OTA đã thu: dù đã đánh dấu không đến, **không bán căn đó trong đêm** cho tới 06:00. Khách có thể đến sau nửa đêm.

[ẢNH: C2-13-Đánh dấu không đến]

### 2.9 Gửi link check-in online cho khách

> **Tạm dừng với khách thật từ 02/11 tới bản v1.0.1:** trang khách của bản `v1.0.0` còn thông báo xử lý dữ liệu bản cũ, chưa nêu hạn lưu thông tin giấy tờ. **Không tạo, không gửi link check-in online cho khách thật**, kể cả đơn chuyển đổi ngày D. Mọi khách làm giấy tờ tại quầy (mục 2.10): chỉ tờ **Your ID details** trước khi nhận giấy tờ, rồi hỏi đồng ý lưu ảnh ở Khối 1 (mục 0.8 điểm 4). Khách muốn gửi yêu cầu trong lúc ở: nhắn Zalo hoặc gọi lễ tân.
> - **Lỡ gửi link:** mở đơn → **Thu hồi link** ngay (bước 6). Ghi **mã đơn** vào sổ giao ca (không ghi tên khách), báo chủ đầu tư trong ngày. Khách tới quầy thì chỉ tờ **Your ID details** như mọi khách. Không xóa ảnh khách đã gửi (cần cho khai báo lưu trú).
> - Đội kiểm mỗi sáng số link mới tạo trên Desk thật; khác 0 thì đội báo chủ đầu tư **mã đơn** để đối chiếu với sổ giao ca.
> - Đơn **giữ chỗ** cũng hiện nút **Tạo link check-in online**: không bấm (Desk luôn từ chối với đơn giữ chỗ – lỗi nhỏ, v1.0.1).
> - Chỉ dùng lại mục này khi chủ đầu tư báo "mở lại check-in online". Trên Desk tập vẫn tập các bước dưới với dữ liệu giả.
<!-- Quyết định PO 30/10 (D-T4 phương án a, QC v1-gate.md mục 4.2): rounds/round-03/outputs/PO/v1.0.0-docs-update.md. SEC đồng ý 30/10 (SEC-on-PO-v1.0.0-docs.md mục A, S4, S5; thẻ D05). Mở lại khi: v1.0.1 có privacy-2026-10-v2 trên production ở mọi ngôn ngữ trang khách (gồm RU), cùng chữ với tờ Your ID details, OWN/OPS đặt privacy_notice_version mới, SEC kiểm 4 việc ở mục C.1. -->

1. Mở đơn **đã xác nhận**. Mục **Link check-in online** → **Tạo link check-in online**. (Đơn giữ chỗ ở v1.0 cũng hiện mục này nhưng Desk không cấp link; xác nhận cọc trước.)
2. Hộp **Link check-in online · đơn …** hiện link, **mã QR của link** và hạn link. Bấm **Sao chép link**. **Link chỉ hiện một lần.** Đóng hộp là không xem lại được; cần thì **Tạo link mới** (link cũ ngừng hoạt động). **Không chụp màn hình hộp này** (mã QR là link).
3. Gửi **riêng 1–1** cho khách của đơn, từ tài khoản của OTTIMO trên điện thoại cơ sở (mục 2.4) hoặc email. Không gửi vào nhóm chat. Không kèm mã cửa hay số căn.
4. Khách mở link trên điện thoại: đọc thông báo xử lý dữ liệu (**Tôi đã đọc**) → **Giấy tờ** (chọn CCCD/Hộ chiếu rồi **Chụp**, hoặc **Bổ sung tại quầy**) → **Giờ đến** → **Xác nhận** (đồng ý lưu ảnh hay không) → **Gửi thủ tục**.
5. Khi khách gửi xong, **Hôm nay** ghi **Đã làm thủ tục trước**. Lúc khách đến, lễ tân chỉ đối chiếu bản gốc.
6. Gửi nhầm người: **Thu hồi link** (Desk hỏi lại; khách mở link sẽ thấy "Liên kết đã hết hạn").

[ẢNH: C2-14-Link check-in online]

Trang khách tiếng Anh dẫn, có tiếng Việt. Trong lúc ở, khách xem nội quy và gửi yêu cầu (khăn, dọn thêm, báo hỏng, trả muộn). Wi-Fi trên trang khách chưa hiện (mục 1.4, lỗi đang sửa; trang ghi "hỏi lễ tân"): khách xem thẻ Wi-Fi trong căn.

> **Lỗi nhỏ đã biết:**
> - Trang khách hiện câu "Ngôn ngữ theo trình duyệt của bạn" cả khi ngôn ngữ lấy theo hồ sơ khách. Không ảnh hưởng.
> - Khách chọn **Bổ sung tại quầy** rồi đóng và mở lại link giữa chừng: bấm **Gửi thủ tục** không được, trang quay về bước Giấy tờ mà không báo gì. Khách gặp vậy thì mời khách làm giấy tờ tại quầy khi đến.

### 2.10 Nhận phòng

**Giờ nhận phòng (từ 26/10):**

| Khách vào căn lúc | Desk tính |
|---|---|
| Từ **12:00** (căn đã sạch hoặc đã kiểm – `VC`/`VI`) | **Không phụ thu** |
| **10:00–11:59** | Phụ thu **30 %** giá đêm đầu |
| **06:00–09:59** | Phụ thu **50 %** giá đêm đầu |
| Trước **06:00** | Không phải phụ thu: Desk **thêm đêm trước** (tiền phòng 1 đêm) |

- Câu nói với khách: "Check-in is from 12:00. Your room is always ready by 14:00." / "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00." **Không** hứa "phòng sẵn sàng từ 12:00".
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
- **Căn chưa sẵn sàng** (đang `VD`, `CL`, `OD`): lễ tân gửi **Gửi lễ tân trưởng xác nhận** kèm **Lý do**. Lễ tân trưởng tự xác nhận ngoại lệ được; buồng chuyển "Có khách, cần dọn" và có việc dọn gấp. Căn đang khóa sửa chữa (OOO) thì **không bao giờ** nhận phòng được.
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
<!-- [GIẢ ĐỊNH – chờ INV xác nhận] (SEC FB-R3-SEC-BA-05): app khóa đang cài trên điện thoại/máy tính bảng của cơ sở. Nếu đang trên máy cá nhân, chuyển trước 02/11. Chữ trên màn (ci.door_step1 "6 số", ci.door_step3 mã theo ngày sinh) lệch BR-403 – UXD sửa ở v1.0.1; sổ tay cố ý không ghi số chữ số. -->

**Giao mã cửa** – chỉ khi đơn đủ điều kiện nhận phòng: **đã nhận phòng trên Desk**, có giấy tờ người đứng tên, đã thu đủ (đơn Trực tiếp). Mã cửa **không gửi bằng chữ hay ảnh qua bất kỳ kênh nào** (Zalo, Messenger, WhatsApp, SMS, email, hộp thư OTA…), kể cả gõ tay. Hai cách giao:
- **Tại quầy**: đọc nhỏ hoặc cho khách xem màn app khóa. Không đọc to khi có người khác đứng gần.
- **Gọi điện**: lễ tân **tự gọi ra** số điện thoại **đã có trên đơn từ trước hôm nay** (hoặc số kênh OTA cung cấp). Chỉ đọc khi người nghe xác nhận đúng **họ tên người đứng tên và ngày đến**. Không để lại lời nhắn thoại. Không đọc cho người nghe hộ.
- **Không** đọc mã trong cuộc gọi khách gọi đến, kể cả khi người gọi nói đúng tên và mã đơn: cúp máy, gọi lại số trên đơn.
- Khách xin đổi số điện thoại trong ngày đến: **không** gọi số mới để đọc mã. Mời khách ra quầy, đối chiếu giấy tờ rồi mới sửa số.
- Nghi ngờ (người khác xin mã thay khách, khách đòi gấp, số lạ): không giao, báo quản lý.

> **Lỗi nhỏ đã biết (v1.0.1):** chip **Cần nhập thông tin** / **Đã có** đè nút **Xem đủ số / ảnh**. Thu nhỏ trang (Ctrl và dấu trừ) nếu cần bấm.

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
- Khách nước ngoài **gia hạn, trả sớm hoặc trả phòng**: hồ sơ hiện ở tab **Cần cập nhật ngày đi**. Cập nhật trên cổng trong ngày.
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

> **Lỗi nhỏ đã biết (sửa ở v1.0.2):** câu "Phí phạt không tính vào doanh thu phòng" hiện cả khi chọn giặt ủi. Giặt ủi không phải phí phạt; cứ thêm như thường.

**Thêm người đi cùng:** khung đơn → mục **Người ở** → **Thêm người đi cùng** → chọn **Người lớn đi cùng** hoặc **Trẻ em** (trẻ chỉ cần **Năm sinh**). Ô chọn người hiện nhãn "Khách đứng tên" – nhãn nhầm, đang sửa; chọn đúng người đi cùng. Vượt định mức: Desk hiện phụ thu người (người lớn 150.000 đ/đêm, trẻ 6–11 tuổi 100.000 đ/đêm, dưới 6 tuổi miễn) → báo khách → tích **Ghi phụ thu … vào folio – tôi đã báo khách** → **Thêm vào đơn**. Nhớ báo buồng phòng chuẩn bị bộ đồ dùng thêm (Desk tự tạo việc).

[ẢNH: C2-24-Thêm người đi cùng]

**Gia hạn:**
1. Khung đơn → **Gia hạn**. Chọn số đêm **Ở thêm** (chỉ đêm còn **Trống**; tối đa 7 đêm liên tiếp).
2. Desk tính tiền, áp lại giảm theo số đêm nếu tổng đủ 7 hoặc 14 đêm. Sửa giá đêm thêm thì cũng nhập **giá trước giảm**.
3. Đơn OTA: phần gia hạn thành đơn con kênh Trực tiếp, chung phiếu thanh toán.
4. Bấm **Gia hạn … đêm · …**. Nhớ kéo dài hiệu lực mã cửa trên app khóa. Khách nước ngoài: cập nhật khai báo trong ngày.
5. Desk chưa có ô thu tiền khi gia hạn và chưa có nút ghi thu giữa kỳ ở. Ghi vào sổ giao ca: mã đơn, số đêm gia hạn, số tiền. Thu ở bước **Bill & thu tiền** khi trả phòng. Khách gia hạn dài hoặc chưa trả các đêm trước: báo quản lý.
<!-- DOM: Mốc thu "muộn nhất 14:00 ngày đầu phần gia hạn" (BR-423, giả định chờ INV) chưa làm được trên Desk v1.0 – DOM xem lại. -->

[ẢNH: C2-25-Gia hạn]

**Đổi phòng khi đang ở:**
1. Khung đơn → **Đổi phòng**.
2. **Vì sao đổi?**: **Sự cố của OTTIMO – giữ giá cũ** hoặc **Khách yêu cầu – giá căn mới**. Ghi **Lý do đổi**.
3. **Căn mới (đã dọn hoặc đã kiểm)**: chọn căn. Căn nhóm cao hơn cần lễ tân trưởng xác nhận.

> **Lỗi đang sửa (sửa ở v1.0.1):** danh sách **Căn mới** có thể lẫn căn **chưa dọn** (`VD`). Chọn căn đó thì Desk báo và không lưu gì. **Trước khi chọn, mở Buồng phòng hoặc Sơ đồ phòng kiểm căn đó đang `VC` hoặc `VI`.** Không đổi khách sang căn `VD`.
4. Bấm **Đổi sang căn …**. Rồi:
   - Nhờ buồng phòng đếm minibar căn cũ. Món đã dùng ghi vào folio ngay bằng **Thêm phát sinh**.
   - Thu thẻ căn cũ, ghi số thẻ trả. **Xóa mã căn cũ trên app khóa.** Giao mã/thẻ căn mới.
   - Bộ đồ dùng thêm: Desk tự tạo việc chuyển. Căn cũ có việc dọn.
   - Đổi do sự cố: khách giữ giá cũ. Muốn bù thêm thì dùng miễn phí, lý do **Bù sự cố**.

[ẢNH: C2-26-Đổi phòng]

**Xác nhận giờ trả** (ngày khách đi): **Hôm nay → Khách đi → Xác nhận giờ trả**, hoặc nút **Xác nhận giờ trả** trên khung đơn **Đang ở** → nhập giờ khách báo (ô ghi nhầm "Giờ trả phòng thực tế" – đang sửa), **Khách trả lời qua** (**Gọi điện**, **Tại quầy**, **Zalo**). Giờ sau 12:00 là trả muộn: dùng **Trả muộn**.

[ẢNH: C2-28-Xác nhận giờ trả]

**Yêu cầu của khách** (từ trang khách, hiện trên **Hôm nay**): **Đã nhận** → làm hoặc chuyển bộ phận → **Làm xong**. Không làm được: **Không thực hiện được** → **Lý do (khách thấy)**. **Lời nhắn cho khách**: khách đọc được, không ghi mã cửa, số giấy tờ, số điện thoại, số thẻ. Yêu cầu có phí ghi vào folio khi xong.

[ẢNH: C2-29-Yêu cầu của khách]

**Miễn phí, giảm giá:**
1. Trong folio (**Folio & điều chỉnh**), ở dòng cần miễn: **Mở form miễn phí / giảm giá**. Hộp **Miễn phí · <dòng> · <số tiền>** mở ra.
2. Loại do dòng quyết định: dòng phát sinh → miễn phí (FOC); dòng tiền phòng → giảm giá đặc biệt. Nhập **Số tiền miễn** (tối đa phần còn lại của dòng), **Lý do miễn phí** (**Khách quen / VIP**, **Phòng sẵn sàng, không ảnh hưởng khách sau**, **Bù sự cố**, **Khách dài hạn**, **Khác (ghi rõ)**).
3. Minibar trong mức tự miễn của lễ tân (≤ 100.000 đ/lần, ≤ 500.000 đ/tháng): nhập lại mật khẩu → **Tự áp miễn phí**.
4. Còn lại: **Gửi duyệt**. Yêu cầu tự đến người có quyền. Folio ghi dòng miễn **Chờ duyệt**.
5. Theo dõi kết quả trên folio (**Đã áp**, **Bị từ chối**). Lỗi đang sửa: ở màn Trả phòng, dòng miễn **Bị từ chối** vẫn hiện số âm – số đó **không** được trừ; đọc **Còn phải thu** để biết số đúng.
<!-- FE xác nhận (QA M42): hộp từ dòng phụ thu không có ô Loại – BA suy từ mã (foc.tsx kind theo dòng); dòng tiền phòng mở ra Giảm giá đặc biệt. BUG-R3-030. -->

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
- Thu nhiều lần, nhiều cách được: ghi phần đã nhận, chọn cách khác cho phần còn lại.
- Đơn Trực tiếp: thu **đủ** phần còn lại khi nhận phòng, **trước khi giao mã cửa**.
- **Không nhận số thẻ** qua điện thoại, Zalo, email hay giấy. Không chụp thẻ, không ghi số thẻ. Khách muốn trả thẻ thì trả tại máy POS ở quầy.
- **Thẻ ảo của OTA**: chỉ chủ đầu tư/quản lý xem trên extranet và gõ thẳng vào máy POS. Không sao chép, không in, không chụp màn hình số thẻ.

[ẢNH: C2-19-Nhận phòng, thu tiền]

### 2.14 Trả phòng – 3 bước

**Giờ trả phòng 12:00.** Hôm trước và sáng ngày đi, lễ tân nhắn khách xác nhận giờ trả (nhắn tay ở v1.0), ghi kết quả bằng **Xác nhận giờ trả** (mục 2.12). Chỉ nhắn trong **08:00–21:00**; tối hôm trước nhắn trước 21:00. Căn có khách đến hôm nay: không mời trả muộn trong tin.

1. **Hôm nay → Khách đi → Trả phòng** (hoặc khung đơn → **Trả phòng**). Desk mở **Trả phòng · Căn … · …**.
2. **Bước 1 – Minibar.** Nhập số **Còn lại / chuẩn** từng món theo số buồng phòng đếm (mục 3.7). Không dùng gì: **Không dùng gì – tủ đủ**. Buồng phòng chưa báo số: hỏi khách đã dùng gì, nhập theo lời khách, ghi chú "chưa đếm". **Không** bấm **Không dùng gì – tủ đủ** khi chưa có số. Xem **Tổng minibar**. Bấm **Tiếp tục: Phụ phí**.
3. **Bước 2 – Phụ phí.** Kiểm **Giờ trả phòng thực tế**. Desk tự tính phụ thu trả muộn (mục 2.15). Thêm **Phát sinh khác** nếu có (**Giặt ủi**, **Đồ ăn gọi thêm**, **Hư hỏng, mất đồ**, **Khử mùi thuốc lá**, **Thiếu thẻ phòng**). Có phụ thu: báo khách, tích **Tôi đã báo khách khoản phụ thu này**. Bấm **Tiếp tục: Bill & thu tiền**.
4. **Bước 3 – Bill & thu tiền.** Đọc **Tổng cộng**, **Đã thu**, **Còn phải thu**. Thu theo mục 2.13.
5. Khách lấy hóa đơn công ty: bật **Khách lấy hóa đơn công ty** → **Tên công ty**, **Mã số thuế**, **Địa chỉ công ty**, **Email nhận hóa đơn** → bấm **Lưu** (mục 2.16). Bỏ qua dòng chữ nhỏ nhắc "Round 3 / R2" dưới ô – chữ cũ, đang sửa.
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
1. Xem trước phiếu ở **bước 3 Bill & thu tiền** của màn Trả phòng (bản xem trước, chưa có số phiếu). Bản xem trước cũng có nút **In phiếu**, nhưng tờ in ra ghi "Bản xem trước – số phiếu được cấp khi hoàn tất trả phòng": **không đưa tờ này cho khách**. Khung đơn **Đang ở** chưa có nút xem phiếu.
2. Sau khi hoàn tất, mở phiếu bằng một trong hai lối: nút **Xem Phiếu thanh toán** trên màn hoàn tất (cạnh **Về chi tiết đơn**), hoặc khung đơn **Đã trả phòng** → **Xem Phiếu thanh toán**. Chọn **Ngôn ngữ phiếu**: **Tiếng Việt** hoặc **Việt – Anh**. Phiếu đã có **Số phiếu**.
3. **Chỉ in sau khi hoàn tất** (phiếu có **Số phiếu**). Bấm **In phiếu** → hộp in của trình duyệt in **một tờ A4** chỉ có phiếu. Khách cần bản điện tử: trong hộp in chọn **Lưu dưới dạng PDF**, rồi gửi riêng 1–1 cho khách từ tài khoản của OTTIMO (mục 2.4). Không chụp màn hình phiếu gửi khách qua chat.

[ẢNH: C2-35-Phiếu thanh toán, In phiếu]

> **Tạm ở v1.0:** mẫu in chính thức, xuất PDF từ Desk, gửi bill qua email/Zalo và khách xem folio tạm tính trên trang khách có ở v1.2.
<!-- BUG-R3-020 Closed 28/10 trên rc.4 (qa3-rc1.md 17.4): 1 tờ A4, VI và VI–EN. Máy in thật ở quầy chưa thử – INV/OPS in thử 1 tờ trước 02/11. -->

### 2.14a Khách trả phòng sớm

> **Tạm ở v1.0:** Desk chưa trả phòng được trước ngày đi. **Từ bản v1.0.1 (dự kiến 04/11) có nút trên Desk**; khi đó làm theo nút và bỏ cách dưới đây. Từ 02/11 tới lúc có bản vá, khi khách báo rời sớm:
> 1. Ghi vào **sổ giao ca** (khung đơn chưa có ô ghi chú cho lễ tân): "OTM-…: khách báo rời ngày dd/mm lúc hh:mm, báo qua (Zalo/điện thoại/tại quầy)". Giờ báo quyết định tiền hoàn. **Không hứa số hoàn**, không hoàn tiền tại quầy. **Không mở màn Trả phòng trước ngày đi** (Desk sẽ báo lỗi khi hoàn tất).
> 2. Khi khách rời: thu thẻ (ghi số thẻ trả), **xóa mã trên app khóa ngay**, nhờ buồng phòng đếm minibar, kiểm hư hỏng. Món đã dùng và hư hỏng: **Thêm phát sinh** vào folio.
> 3. Khách nước ngoài: **cập nhật ngày đi trên cổng khai báo trong ngày khách rời**. Desk chưa nhắc việc này.
> 4. Buồng phòng: **Hủy việc** dọn khách ở lại các ngày sau, lý do "Khách đã rời sớm". Tạo **Việc mới → Dọn trả phòng** cho ngày khách rời (mục 2.19).
> 5. Báo quản lý trong ca. Căn vẫn hiện **Đang ở** tới ngày đi: **không** nhận khách khác vào căn này ngoài Desk. Có khách mới cần căn thì gọi quản lý.
> 6. Đúng ngày đi trên đơn: lễ tân bấm **Trả phòng** như thường (giờ trả là giờ bấm, không ghi lùi), sổ giao ca ghi "đã rời ngày dd/mm". Quản lý mở folio trong 24 giờ và giảm tiền phòng các đêm chưa ở theo chính sách:
>    - Đơn Trực tiếp/CTV báo trước từ 1 ngày: hoàn 50 % tiền các đêm chưa ở. Phụ thu người của các đêm đó hoàn 100 %.
>    - Báo trong ngày rời: không hoàn.
>    - Đơn OTA: theo kênh.
>    - Cách giảm: ở dòng tiền phòng đêm chưa ở, **Điều chỉnh** giá đêm. Giá mới thấp hơn **sàn** thì Desk không lưu: khi đó dùng **Mở form miễn phí / giảm giá** trên dòng đó (giảm giá đặc biệt), số tiền = phần hoàn, lý do "Khách rời sớm".
>    - Desk tự tạo yêu cầu hoàn. Người sửa dòng không tự duyệt khoản hoàn (mục 1.9).
>
> Ví dụ: đơn căn 202 từ 9/11 đến 16/11, 5.205.000 đ. Ngày 12/11 khách báo sẽ rời 14/11, tức báo trước 2 ngày. Hai đêm bỏ là 14/11 (thứ Bảy) 820.000 đ và 15/11 713.000 đ, cộng 1.533.000 đ. Hoàn 50 % là 766.500 đ, **làm tròn lên 767.000 đ** (làm tròn có lợi cho khách). Các đêm đã ở **không** tính lại mức giảm 7 đêm.
>
> Cho kế toán: theo cách tạm này, đêm khách bỏ vẫn hiện là đêm bán trong **Nhật ký tiền** tới khi quản lý điều chỉnh. Phần giữ lại nằm trong tiền phòng, không tách thành dòng "phí trả phòng sớm".
<!-- QA D14: chưa diễn tập trọn (chỉ có khách đi đúng ngày là căn 203). Ngày 29/10 QA trả phòng OTM-00359 (ngày đi thật) để kiểm bước 6, nhất là đường giảm dưới sàn (giảm giá đặc biệt trên folio đã chốt có tạo yêu cầu hoàn không). DOM xác nhận cách giảm. BUG-R3-024: màn Trả phòng mở được bằng URL trước ngày đi, hoàn tất 409, câu báo sai. -->

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
- **Đề nghị hoàn** (trả thừa, hủy, trả sớm): lễ tân tạo, ghi **Cách hoàn** và nơi nhận. Quản lý hoặc chủ đầu tư **khác người tạo** duyệt (hiện một người trực: chủ đầu tư).
- **Chi hoàn tiền mặt** (khoản đã duyệt, nơi nhận là tiền mặt): **Nhật ký tiền → Hoàn tiền** → **Chi hoàn tiền mặt** → **Ảnh chứng từ** (biên nhận có chữ ký khách) → xác nhận. Không chi được khoản do chính mình tạo yêu cầu.
- Hoàn chuyển khoản do quản lý làm. Báo khách thời hạn.

[ẢNH: C2-37-Thu công nợ]
[ẢNH: C2-38-Chi hoàn tiền mặt]

> **Lỗi nhỏ đã biết:** sau khi chi hoàn, thông báo có dấu trừ thừa, ví dụ "Đã ghi hoàn -500.000 đ" (số ghi sổ đúng – v1.0.1). Nhập nơi nhận hoàn chuyển khoản phải gõ mã ngân hàng 6 số, chưa có danh sách chọn (v1.1).

### 2.18 Yêu cầu từ website

> **Tạm ở v1.0:** form "Yêu cầu đặt phòng" trên ottimo.vn **đang tắt** (theo quyết định của chủ đầu tư, bật khi luật sư trả lời). Màn **Yêu cầu từ website** hiện "Form đặt phòng trên website đang tắt" và không có yêu cầu mới. Khách liên hệ qua Zalo, điện thoại: tạo đơn như mục 2.5, **Nguồn** = **Website** nếu khách nói tìm thấy OTTIMO qua website.

Khi chủ đầu tư bật form: yêu cầu mới hiện ở menu kèm số, hạn trả lời 15 phút. Mở yêu cầu → **Nhận xử lý** → **Báo giá** hoặc **Tạo đơn**; không thành đơn thì **Đóng – không thành đơn**.

[ẢNH: C2-39-Yêu cầu từ website, form tắt]

### 2.19 Điều phối buồng phòng trên Desk

1. **Vận hành → Buồng phòng**: **Việc buồng phòng hôm nay** (tiến độ **… xong**) và **Trạng thái buồng** từng căn.
2. Thêm việc: **Việc mới** → hộp **Tạo việc buồng phòng**: **Căn**, **Loại việc**, **Ngày làm**, **Ghi chú cho buồng phòng** → bấm **Việc mới** ở cuối hộp.
3. Hủy việc: **Hủy việc** → **Lý do**.
4. Làm thay buồng phòng: **Làm xong** ở dòng việc.

[ẢNH: C2-40-Buồng phòng trên Desk, việc mới]

### 2.20 Ca đêm (00:00–05:59)

- Desk và app vẫn tính **ngày hôm trước**. Khách đến muộn của đơn hôm qua: nhận phòng như thường.
- Khách vãng lai đến ở luôn: tạo đơn, ngày đến là **ngày hôm trước**, tính 1 đêm.
- Khách của đơn **hôm nay** đến trước 06:00: Desk thêm đêm trước (mục 2.10).
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
| Khách báo sẽ rời sớm | Mục 2.14a. Không hứa số hoàn |
| Khách để quên đồ | Ghi sổ đồ thất lạc, báo quản lý với đồ giá trị |
| Khách hỏi Wi-Fi | Đọc tên mạng và mật khẩu trên thẻ Wi-Fi trong căn (trang khách chưa hiện Wi-Fi – lỗi đang sửa, sửa ở v1.0.1) |
| Hoàn tác nhận phòng bị Desk từ chối | Folio đã có dòng mới; nhờ quản lý (mục 2.10, Trường hợp đặc biệt) |
| Khách muốn xem/xóa dữ liệu của mình | Ghi yêu cầu, chuyển chủ đầu tư |
| Đơn OTA về khi căn đã kín | Lưu chưa gán căn, báo quản lý; gán căn hoặc đổi phòng khách khác (mục 2.6) |
| Phím Esc không đóng khung đơn | Bấm **Đóng** (sửa ở v1.0.2) |
| Tìm đơn theo tên khách không ra | Tìm theo mã đơn, mã OTA hoặc SĐT ở **Khách hàng** (sửa ở v1.0.2) |
| Báo giá thứ Sáu 1 đêm chỉ báo "tối thiểu 2 đêm" sau khi mở hộp | Đúng quy tắc; chọn 2 đêm (chữ sửa ở v1.0.2) |
| Desk lỗi, sai tiền, không làm tiếp được | Mục 5.5 |

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

Chủ đầu tư và quản lý (có 2 bước) chưa đăng nhập được app nhân viên ở v1.0: app báo "Đăng nhập 2 bước sẽ có ở bản sau" (cùng lúc hiện câu "Nhập mã…" nhưng không có ô nhập mã – lỗi chữ, đang sửa).

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

**Khách không muốn dọn hôm nay:** màn căn → **Khách không muốn dọn** → **Lý do** (**Treo biển "Không làm phiền"**, **Khách nói không cần dọn**, **Lý do khác**) → **Bỏ việc dọn hôm nay** (hoặc **Quay lại**). Lễ tân thấy lý do. Ngày mai vẫn có việc dọn như thường.

[ẢNH: C3-03-Khách không muốn dọn]

### 3.5 Các căn

**Các căn** hiện trạng thái mọi căn. Lọc: **Tất cả**, **Cần dọn**, **Có khách**, **Sạch**, **Đang sửa**. Mỗi căn ghi khách đến hôm nay/ngày mai. Buồng phòng chỉ thấy tên gọi của khách trong ngày, không thấy giá, kênh, giấy tờ.

[ẢNH: C3-04-Các căn]

### 3.6 Kiểm phòng (lễ tân trưởng)

Ở v1.0, buồng phòng **không tự kiểm** phòng mình dọn (căn của buồng phòng không có nút **Kiểm phòng**). **Chỉ lễ tân trưởng** kiểm, trên app nhân viên. Chủ đầu tư và quản lý không kiểm được ở đâu trong v1.0: Desk không có thao tác kiểm phòng, còn app nhân viên chưa cho hai vai này đăng nhập (mục 3.1).

1. Lễ tân trưởng đăng nhập `staff.ottimo.vn` trên điện thoại bằng tài khoản của mình.
2. Nhận thông báo **Căn đã dọn – chờ kiểm**. Mở căn `VC` → nút **Kiểm phòng** → màn **Kiểm phòng … · …**.
3. Đi từng mục trong danh mục (12 mục: ga gối, phòng tắm, khăn, đồ dùng, bếp, bàn làm việc, Wi-Fi, rèm/cửa sổ, mùi, remote/điều hòa/sưởi, thẻ chào…), đánh dấu khi đạt chuẩn OTTIMO. App hiện **Đã kiểm …/12 mục**.
4. Đạt hết: **Kiểm đạt – sẵn sàng**. Căn chuyển **Sẵn sàng đón khách** (`VI`).
5. Chưa đạt: **Chưa đạt** → ghi chỗ chưa đạt → **Ghi chưa đạt**. Căn quay về **Cần dọn (khách đã đi)** và có việc dọn lại.

[ẢNH: C3-05-Kiểm phòng]

Căn trống quá 3 ngày cần kiểm lại trước khi nhận khách.

Ngày lễ tân trưởng nghỉ thì **không ai kiểm được**. Lễ tân vẫn nhận khách vào căn **Đã dọn – chờ kiểm** (`VC`) như thường (điều kiện nhận phòng chấp nhận `VC`). Chủ đầu tư có thể gán thêm vai **Lễ tân trưởng** cho một lễ tân (mục 1.5).

### 3.7 Minibar

**Bổ sung minibar:** việc ghi **Bổ sung minibar: …** kèm tên món và số lượng. Bổ sung xong bấm **Làm xong**.

**Khi khách trả phòng:**

> **Tạm ở v1.0:** app nhân viên chưa có màn đếm minibar. Cách làm:
> 1. Lễ tân báo buồng phòng khách sắp trả căn nào.
> 2. Buồng phòng đếm tủ, báo lễ tân **số còn lại từng món** (gọi điện hoặc nói trực tiếp; nhắn tin nội bộ chỉ ghi số căn và số món, không ghi tên khách).
> 3. Lễ tân nhập ở bước **Minibar** khi trả phòng (mục 2.14).
> 4. Đếm sau khi khách đã đi mà thấy thiếu: báo lễ tân ngay, kèm ảnh tủ (chụp tủ, không chụp người). Lễ tân xử lý theo mục 1.11.

> **Lỗi nhỏ đã biết (v1.0.1):** việc **Bổ sung minibar** còn nằm dưới **Khách đang ở** sau khi khách đã trả phòng. Vẫn làm và bấm **Làm xong** như thường.

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
- Tới v1.0.1: giữ chỗ của bạn quá hạn, người trực quầy sẽ nhắn bạn. Liên hệ khách và trả lời trong **1 giờ**; quá 1 giờ, hoặc đã 11:00 ngày đến, người trực gọi thẳng khách (mục 2.4).
- Nội dung chuyển khoản luôn là **mã đơn**. CTV không gửi mã VietQR và không xác nhận cọc.
- Không hứa giá, khuyến mãi hay chính sách hủy khác với Desk.
- Không chụp, không xin ảnh giấy tờ của khách. Lễ tân lo giấy tờ khi khách đến.
- Khách ở từ 28 đêm, khách đến hôm nay: nhắn lễ tân.

**Menu:** **Báo giá & giữ chỗ** (tab **Căn trống**, **Báo giá**), **Đơn của tôi**, **Khách của tôi**. Sale nội bộ có thêm **Yêu cầu từ website**.

**Báo giá và giữ chỗ:** làm như mục 2.4 bước Báo giá và Giữ chỗ.
- Báo giá hiện **Bạn nhận (…% tiền phòng)** (CTV 8 %, sale 3 %).
- Tin có số tiền hoặc mã VietQR: chỉ gửi mã **Desk tạo cho đúng đơn**, kèm câu chống giả danh ở mục 2.4. Không gửi ảnh QR cũ, không gõ số tài khoản bằng tay.
- Giữ chỗ của mình: khung đơn có **Hủy giữ chỗ** và **Gia hạn giữ chỗ (1 lần)**.
- Báo giá hết hiệu lực (3 ngày): **Gửi quản lý gia hạn**, hoặc **Lập báo giá mới**.
- Số giữ chỗ mở cùng lúc: CTV tối đa 3, sale tối đa 5.
- Khách ở từ 28 đêm: hợp đồng dài hạn vẫn làm ngoài app; nhắn lễ tân giữ phòng bằng đơn dài hạn nhập tay.
- Khách đến **hôm nay**: nhắn lễ tân tạo đơn đã thu cho khách.

[ẢNH: C4-06-Báo giá trên điện thoại]

**Cọc:**
- **Sale nội bộ**: gửi mã VietQR **Desk tạo** cho khách (mục 2.4). Mã hiện "Tài khoản nhận vừa đổi": chưa gửi, gọi chủ đầu tư. Kiểm tiền về theo **mục 2.13** (hỏi chủ đầu tư/quản lý, kèm mã đơn và số tiền) rồi mới **Xác nhận đã nhận cọc**. Ảnh chụp của khách không thay xác nhận. Khoản do sale ghi ở trạng thái chờ đối soát; quản lý đối soát trong ngày.
- **CTV**: không gửi QR, không xác nhận cọc. Nhắn lễ tân hoặc sale nội bộ gửi mã VietQR. Khách báo đã chuyển: mở đơn → **Báo đã chuyển cọc** → **Số tiền khách chuyển**, **Ghi chú**, **Đính kèm ảnh biên nhận** (không bắt buộc; JPG, PNG, WebP, tối đa 10 MB) → gửi. Lễ tân hoặc sale nội bộ kiểm sao kê rồi xác nhận.
- Tiền mặt sale/CTV thu hộ: nộp quầy. Lễ tân bấm **Đã nhận tiền mặt** ở **Nhật ký tiền → Chờ đối soát**. Hoa hồng thành "đạt" sau khi khoản này được đối soát.

[ẢNH: C4-07-Báo đã chuyển cọc]

**Đơn của tôi:** xem trạng thái đơn mình chốt. Đơn còn hiệu lực có dòng **Hoa hồng dự kiến của bạn** (đơn đã hủy thì không có).

[ẢNH: C4-08-Đơn của tôi, hoa hồng dự kiến]

> **Tạm ở v1.0:** chưa có màn hoa hồng theo đợt chi (dự kiến v1.3), bảng theo dõi khách tiềm năng (chưa xếp lịch), mẫu tin nhắn (dự kiến v1.2). Sale/CTV không cấp hay gửi link check-in online; lễ tân gửi (đang tạm dừng tới v1.0.1, mục 2.9).

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
| Trước 21:00 | Nhắn khách đi ngày mai xác nhận giờ trả. Sau 21:00 không nhắn khách |
| 22:00 | Chép danh sách khách đến/đi ngày mai (mục 0.9); ghi công suất đêm. Ba ngày đầu: đối chiếu sổ giấy với Desk |
| **23:00** | Đánh dấu "Không đến" nếu vẫn không liên lạc được. Hạn khai báo khách Việt Nam (đến từ 23:00: trước 08:00 hôm sau; hạn khai báo theo giờ đồng hồ thật) |
| 09:00 | Quản lý đối soát xong khoản chuyển khoản ghi ban đêm |
| +12 giờ từ giờ nhận | Hạn khai báo khách nước ngoài |
| +24 giờ từ trả phòng | Hạn ghi phát sinh sau trả phòng; hạn quản lý xem lại phụ thu bằng giá 1 đêm |

### 5.2 Bảng tiền và quy tắc (tham số ngày 27/10/2026)

| Mục | Giá trị |
|---|---|
| Phụ thu nhận sớm | 06:00–09:59: 50 % · 10:00–11:59: 30 % giá đêm đầu · từ 12:00: 0 · trước 06:00: thêm 1 đêm |
| Phụ thu trả muộn | đến 12:30 (không có khách đến): 0 · đến 15:00: 30 % · đến 18:00: 50 % giá đêm cuối · sau 18:00: thêm 1 đêm hoặc bằng giá 1 đêm |
| Cuối tuần, ngày đặc biệt | Thứ Sáu, thứ Bảy +15 % · ngày đặc biệt +30 % (mọi kênh): đêm 24/12/2026–01/01/2027, Tết đêm 05–10/02/2027, Giỗ Tổ đêm 16/4/2027, đêm 30/4 và 1/5/2027, đêm 1/9 và 2/9/2027 |
| Tối thiểu số đêm | 2 đêm khi ngày đến là thứ Sáu, thứ Bảy, ngày đặc biệt |
| Giảm theo số đêm | ≥ 7 đêm 10 % · ≥ 14 đêm 15 % (Trực tiếp, CTV) · ≥ 28 đêm là dài hạn |
| Cọc ngắn ngày | 30 % tiền phòng · đơn Trực tiếp thu đủ khi nhận phòng |
| Giữ chỗ | 12/24/48 giờ (mặc định 24), không quá 12:00 ngày đến, gia hạn 1 lần tối đa 24 giờ · báo giá giữ giá 3 ngày |
| Hủy (Trực tiếp, CTV) | Báo trước ≥ 7 ngày hoàn 100 % cọc · 3–6 ngày 50 % · < 3 ngày không hoàn · có đêm ngày đặc biệt: không hoàn · bất khả kháng: dời ngày trong 3 tháng |
| Trả phòng sớm | Báo trước từ 1 ngày: hoàn 50 % tiền các đêm chưa ở (phụ thu người các đêm đó hoàn 100 %) · báo trong ngày rời: không hoàn |
| Phụ thu người vượt định mức | Người lớn (từ 12 tuổi) 150.000 đ/đêm · trẻ 6–11 tuổi 100.000 đ/đêm · dưới 6 tuổi miễn |
| Dịch vụ, phí | Dọn phòng lẻ 100.000 đ · giặt ủi 30.000 đ/kg (tạm) · khử mùi thuốc lá 500.000 đ · mất/hỏng thẻ 200.000 đ/thẻ (tối đa 2 thẻ/đơn) |
| Khách dài hạn | Điện theo đơn giá trên hợp đồng (mức 5.000 đ/kWh chờ kế toán xác nhận) · nước 100.000 đ/người/tháng theo ngày ở (tính tay ở v1.0) |
| Hạn mức miễn phí | Lễ tân tự miễn minibar ≤ 100.000 đ/lần, ≤ 500.000 đ/tháng · lễ tân trưởng ≤ 300.000 đ/lần, ≤ 1.500.000 đ/tháng · quản lý ≤ giá 1 đêm/lần · chủ đầu tư không giới hạn |
| Công nợ | Hạn mặc định 3 ngày |
| Giá | Đã gồm VAT 8 % |

Tỷ lệ phụ thu nhận sớm đang chờ chủ đầu tư xác nhận lần cuối; đổi thì Desk tự áp, sổ tay cập nhật sau.
<!-- ESC-035 chờ INV. -->

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

**Khách hỏi Wi-Fi?** Đọc thẻ Wi-Fi trong căn. Desk chưa có ô nhập Wi-Fi, trang khách ghi "hỏi lễ tân" (sửa ở v1.0.1, mục 1.4).

**Khách hỏi: lễ tân nói lưu ảnh N ngày, sao tờ thông báo ghi 3 tháng?** Hai số đều đúng. Trả lời:
- EN: "Your photos are deleted N days after check-out. The 3 months on the notice covers all ID details, including those saved for your next stay."
- VI: "Ảnh anh/chị đồng ý lưu sẽ xóa sau N ngày kể từ khi trả phòng. Mốc 3 tháng trên tờ thông báo áp cho mọi thông tin giấy tờ, kể cả thông tin lưu sẵn cho lần ở sau."
- Khách hỏi tiếp: chỉ đoạn 3 của tờ (có ý bản sao lưu). Không hứa "xóa ngay", không nói "dài nhất".

**Đơn OTA mới về nhưng Desk không tự có?** Đúng ở v1.0. Lễ tân nhập tay ngay và đóng phòng trên các kênh khác.

**Tôi đổi giá nhưng đơn cũ không đổi?** Đúng. Đơn, báo giá tạo trước ngày hiệu lực giữ giá cũ.

**Tại sao đổi tài khoản nhận tiền không có hiệu lực ngay?** Chống tráo tài khoản. Sớm nhất từ ngày kinh doanh kế tiếp.

**Buồng phòng bấm khi mất mạng có mất không?** Không. Thao tác lưu trên máy, tự gửi khi có mạng. Đừng xóa dữ liệu trình duyệt.

**Desk báo "Phiên đăng nhập đã hết"?** Đăng nhập lại; thông tin đang nhập vẫn được giữ trên máy đó.

### 5.5 Khi có sự cố – liên hệ ai

| Sự cố | Báo ai | Trong lúc chờ |
|---|---|---|
| Mất mạng tại quầy | Lễ tân trưởng | 4G điện thoại cơ sở → Desk trên điện thoại cơ sở → danh sách khách đến/đi chép tối qua + sổ giấy (mục 0.9) |
| Mất điện | Lễ tân trưởng → quản lý | Khóa cửa chạy pin vẫn mở bằng mã/thẻ. Đi một vòng các căn có khách, ưu tiên khách có trẻ nhỏ, người lớn tuổi. Báo khách thời gian dự kiến (nếu biết). Máy quầy chạy pin, dùng 4G điện thoại cơ sở, ghi sổ giấy. Mất điện riêng một căn có khách: báo sự cố mức **Gấp**, đổi phòng nếu cần. Quá 4 giờ: quản lý báo chủ đầu tư, quyết đổi phòng hoặc bù (**Bù sự cố**) |
| Desk báo lỗi, không đặt / nhận / trả phòng / thu tiền được, hoặc **sai tiền** | Lễ tân trưởng → quản lý → chủ đầu tư. Chủ đầu tư gõ `/feedback` với chữ **"P0"** ở đầu, **chỉ ghi mã đơn**, không ghi tên khách – đội sửa trong ngày | Ghi sổ giấy, nhập bù khi Desk chạy lại |
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
| Nút trả phòng sớm | v1.0.1 (dự kiến 04/11) | Mục 2.14a: ghi sổ giao ca, quản lý giảm tiền phòng trên folio |
| Check-in online cho khách thật (chờ thông báo xử lý dữ liệu bản mới) | v1.0.1 | Khách làm giấy tờ tại quầy; tờ **Your ID details** trước khi nhận giấy tờ, câu đồng ý ở Khối 1 (mục 0.8, 2.9) |
| "Chấp nhận cọc thiếu" trên Desk | v1.0.1 | Xin khách chuyển đủ trước hạn; không được thì giữ đơn và làm lại khi khách đến (mục 2.4) |
| Danh sách giá đã lên lịch, nút hủy giá đã lên lịch | v1.0.1 | Ghi sổ mỗi lần lên lịch giá (mục 1.3) |
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
| Form "Yêu cầu đặt phòng" trên website | Có sẵn, đang tắt tới khi luật sư trả lời | Zalo, điện thoại |

**Lỗi đang sửa** (đội đã biết, đang sửa; khi bản sửa lên, chủ đầu tư báo lại):

| Lỗi | Cách tạm | Mục |
|---|---|---|
| Thư báo bảo mật chưa gửi tới chủ đầu tư | Chủ đầu tư kiểm bảo mật mỗi sáng trước 09:00 (quản lý cùng đối soát) | 1.1 |
| Giữ chỗ quá hạn có cọc chưa báo vào **Cần chú ý**; giữ chỗ có yêu cầu giảm giá/FOC không tự hủy | Rà 3 mốc mỗi ngày (mở quầy ≤ 09:00, 11:00, trước khi rời quầy ≤ 21:00) ở **Đơn đặt phòng** → **Đang hiệu lực** → **Giữ chỗ · chờ cọc**; xử lý trước 12:00 ngày đến | 2.1, 2.4 |
| Giữ chỗ **có cọc** đã quá hạn: Desk từ chối **Xác nhận đã nhận cọc**, không gia hạn được; chỉ còn **Hủy giữ chỗ** | Phòng trước (xác nhận, gia hạn trước hạn). Sau hạn: hủy – hoàn, hoặc để nguyên đơn rồi hủy – đặt lại (thu đủ cọc lúc đặt) – thu phần còn lại khi nhận phòng – chủ đầu tư hoàn cọc cũ khi khách đến | 2.4 |
| Giữ chỗ có cọc quá hạn: khung đơn ghi "**đơn đã tự hủy**", câu lỗi ghi "căn đã **mở bán lại**", hộp hủy ghi "**Không thu phí**" | Tin trạng thái **Giữ chỗ · chờ cọc**: đơn chưa hủy, căn vẫn giữ. Hủy thì Desk vẫn tạo yêu cầu hoàn đủ số đã nhận | 2.4, 2.8 |
| Hủy với lý do **Khác (ghi rõ)**: hộp hủy khóa nút | Chọn **Không liên lạc được** hoặc **Khách đổi ý**; điều cần giải thích ghi sổ giao ca | 2.4, 2.8 |
| Khung đơn giữ chỗ hiện nút link check-in online, Desk luôn từ chối | Không bấm (check-in online đang tạm dừng) | 2.4, 2.9 |
| Folio đã khóa: câu báo ghi "Chỉ quản lý ghi được bút toán điều chỉnh" (sai – không ai ghi được); nút **Thêm phát sinh** / **Điều chỉnh** còn hiện tới khoảng 1 giờ | Bỏ qua vế "chỉ quản lý". Thu công nợ hoặc Xóa công nợ; phát hiện mới ghi sổ giao ca, báo chủ đầu tư | 1.11 |
| Chưa nhập được **Wi-Fi** trên Desk; trang khách ghi "hỏi lễ tân" | Khách xem thẻ Wi-Fi trong căn; lễ tân đọc khi khách hỏi | 1.4 |
| Hộp **Đổi phòng** lẫn căn chưa dọn (`VD`); chọn thì Desk báo, không lưu | Kiểm trạng thái căn trên Buồng phòng/Sơ đồ phòng trước khi chọn | 2.12 |
| Hộp **Xác nhận cọc** chưa có ô mã giao dịch | Ghi mã giao dịch vào sổ giao ca | 2.4 |
| Màn **Trả phòng** mở được trước ngày đi rồi báo lỗi khi hoàn tất | Không mở màn Trả phòng trước ngày đi | 2.14a |
| App nhân viên thiếu loại sự cố "Tắc thoát nước", "Wi-Fi" | Chọn **Khác**, ghi rõ trong mô tả | 3.9 |
| Trang khách: mở lại link giữa chừng sau khi chọn "Bổ sung tại quầy" thì không gửi được | Làm giấy tờ tại quầy | 2.9 |
| Dòng miễn **Bị từ chối** vẫn hiện số âm ở màn Trả phòng | Đọc **Còn phải thu** | 2.12 |
| **Hoàn tác nhận phòng** bấm được nhưng bị từ chối khi folio có dòng mới | Quản lý bỏ dòng mới (**Điều chỉnh** → **Bỏ cả dòng**) và đảo khoản thu mới trước | 2.10 |
| Một số chữ trên màn chưa đúng (nhãn "Khách đứng tên" ở người đi cùng, "Giờ trả phòng thực tế" ở xác nhận giờ trả, chữ "Round 3 / R2") | Làm theo sổ tay | 2.5, 2.12, 2.14 |
<!-- BUG-R3-021 (phần Desk), 023 (phần lọc), 024…031, 032, 041, 042, 043, 044, 045, FB-R3-ARC-BEB-WA-04 (bug-list.md). Theo ORC: ghi "đang sửa", không hứa ngày. Bản 1.3 bỏ dòng 019, 020, 022 (Closed ở rc.4). -->

### 5.7 Lịch sử sổ tay

| Bản | Ngày | Người | Thay đổi |
|---|---|---|---|
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
| Lễ tân, lễ tân trưởng | Chương 0, 2, mục 3.2, 5 | (1) Báo giá → giữ chỗ → xác nhận cọc; nhận diện mã VietQR có dòng "Tài khoản nhận vừa đổi" và nói được việc phải làm. (2) Đặt phòng Trực tiếp và đơn OTA nhập tay. (3) Nhận phòng đủ 4 bước, có khách nhận sớm; nói được điều kiện giao mã cửa và câu từ chối gửi mã qua tin nhắn. (4) Thêm phát sinh, gia hạn 1 đêm. (5) Trả phòng 3 bước, xem và in phiếu thanh toán. (6) Rà giữ chỗ ở **Đơn đặt phòng** → **Đang hiệu lực** → **Giữ chỗ · chờ cọc**; nói được 3 mốc rà, việc trước hạn, và cách xử lý sau hạn cho giữ chỗ chưa cọc (hủy ngay, tạo lại 1 lần) và có cọc (hủy – hoàn, hoặc để nguyên rồi làm lại khi khách đến); nhận ra dòng "đơn đã tự hủy" và "Không thu phí" sai với đơn có cọc; chọn đúng lý do hủy (không chọn **Khác**); nói được vì sao chủ đầu tư phải duyệt và chi khoản hoàn người trực tạo, và hẹn khách thế nào khi chủ đầu tư vắng (mục 2.4). (7) Chỉ tờ **Your ID details** trước khi nhận giấy tờ, rồi đọc câu hỏi đồng ý lưu ảnh (EN và VI) ở Khối 1; nói được việc phải làm khi lỡ gửi link check-in online. Lễ tân trưởng thêm: duyệt một yêu cầu, kiểm phòng trên app nhân viên | 3 giờ |
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
