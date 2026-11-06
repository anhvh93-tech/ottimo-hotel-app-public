# Sổ vận hành OTTIMO – dành cho chủ đầu tư

- Dành cho: chủ đầu tư (OWN). Quản lý (MGR) và lễ tân trưởng (FDL) đọc phần của mình ở mục 1.
- Lập: BA · Round 4 – Tổng kết · 06/11/2026 · Bản 1.7 (07/11/2026, Round 5: đếm kho minibar mỗi tuần K-MB ở mục 1.2; kiểm điện thoại cơ sở còn tắt tự lưu ảnh ở mục 1.3; đổi giá căn xong báo giá thử 1 đêm từ ngày hiệu lực trở đi ở mục 4.1 bước 7; phiếu nạp gồm dòng không vào tủ) · Bản 1.6 (07/11/2026, Round 5: lễ tân trưởng bật 2 bước trước ngày lên v1.0.5; đổi vai chỉ trên Desk) · Bản 1.5 (06/11/2026, Round 5: không lưu `weekend_nights`, `min_stay` tới khi v1.0.5 lên; con số "máy chủ mất hẳn" theo cùng một cách tính) · Bản 1.4 (06/11/2026, Round 5: lượt sao lưu thứ hai lúc 15:00, mức mất dữ liệu khi máy chủ mất hẳn) · Bản 1.3 (06/11/2026, Round 5: sửa theo review bảo mật – mã thoát của lượt kéo, Time Machine, nghi máy chủ bị xâm nhập, báo ngay khi lượt tự kéo lỗi, người thứ hai ở phòng Báo động) · Bản 1.2 (06/11/2026, Round 5: kéo sao lưu về Mac ít nhất 2 ngày một lần, phòng Báo động có thể thêm một người, mức mất dữ liệu tối đa, diễn tập khôi phục 35 ngày)
- Áp dụng từ: 06/11/2026. Hôm nay OTTIMO chạy thật đủ 4 trang: Desk, app nhân viên, trang khách, website 5 ngôn ngữ (form đặt phòng và giá ước tính đã bật).
- Cách dùng: in mục 1 dán cạnh bàn làm việc. Đánh dấu ô `[ ]` khi xong. Mục 3 mở ra khi có sự cố.
- Đọc cùng: sổ tay sử dụng `product/docs/manual/user-manual-v1.0.md`, từ điển tham số `product/docs/tham-so-quy-tac.md`, bộ hướng dẫn theo vai `product/docs/manual/guides/`.
- Tài liệu nội bộ OTTIMO. Không chứa mật khẩu, mã, số tài khoản, địa chỉ máy chủ hay dữ liệu khách.

**Ba điều luôn nhớ**
1. Desk là nguồn chính. Tin Google Chat, email chỉ là chuông báo.
2. Không chắc là lỗi nặng hay nhẹ: coi là **P0**, báo đội ngay (mục 3).
3. Đội không bao giờ hỏi mật khẩu, mã 2 bước, số tài khoản. Ai hỏi những thứ đó là giả.

---

## 1. Việc định kỳ

Ký hiệu vai: **OWN** chủ đầu tư · **MGR** quản lý · **FDL** lễ tân trưởng · **FD** lễ tân. Hiện một người trực giữ nhiều vai: người đó làm phần của mọi vai mình giữ.

### 1.1 Hằng ngày

**Chủ đầu tư (OWN)**
- [ ] Trước 09:00, kể cả ngày nghỉ: kiểm bảo mật buổi sáng – 4 bước ở sổ tay mục 1.1 (tài khoản nhận VietQR đúng một dòng **Đang dùng**, không dòng **Đã lên lịch** lạ; **Cần chú ý** và **Nhật ký tiền** không có thao tác mình không làm; ghi một dòng sổ giao ca). Làm tới khi đội bảo mật báo bỏ.
- [ ] Đọc thư "Security notice" / "Notice:" về hộp thư riêng (nếu có) theo bảng **Thư nào – làm gì** ở sổ tay mục 0.3a. Thư về việc mình không làm: mục 3.
- [ ] Xem **Tổng quan → Cần duyệt**: duyệt hoặc từ chối miễn/giảm, hoàn tiền, xóa công nợ trong ngày. Chi các khoản hoàn người trực tạo (người trực không tự duyệt, không tự chi).
- [ ] Có tin **FAIL** ở phòng Google Chat "OTTIMO – Báo động", hoặc email từ Healthchecks.io / UptimeRobot: làm theo mục 2.3.

**Quản lý hoặc chủ đầu tư (MGR/OWN)**
- [ ] Trước 09:00: **Nhật ký tiền → Chờ đối soát** – khớp từng khoản chuyển khoản, VietQR với sao kê ngân hàng (sổ tay mục 1.12).
- [ ] Cuối ngày: đối chiếu tiền mặt trong két với **Nhật ký tiền** và sổ giao ca; nhận tiền vượt quỹ lẻ, hai bên ký sổ (sổ tay mục 1.14).
- [ ] Trong 24 giờ sau mỗi lần trả muộn quá 18:00: xem lại phụ thu bằng giá 1 đêm (**Cần chú ý**, sổ tay mục 1.9).
- [ ] **WR8 – xóa tin Chat trong 24 giờ.** Khi có người xóa một yêu cầu website theo yêu cầu người gửi: quản lý phòng Chat (MGR, dự phòng OWN) tìm mã `REQ-…` trong phòng "OTTIMO – Yêu cầu đặt phòng", xóa **mọi tin của luồng** (tin đầu, tin nhắc, tin "Đã xóa dữ liệu…", tin nhân viên trả lời), tìm lại cho chắc, rồi ghi **sổ xóa Chat** (chỉ mã). Chi tiết: hướng dẫn `guides/01-chu-dau-tu-quan-ly.md` mục 12.2.

**Lễ tân (FDL, FD)**
- [ ] Giữ Desk mở trên máy quầy và điện thoại cơ sở 07:00–22:00. Xem **Yêu cầu từ website** mỗi lần cầm máy.
- [ ] Yêu cầu website mới: bấm **Nhận xử lý** ngay (Desk đặt hạn 15 phút). Trả lời khách **trong 60 phút** nếu khách gửi 07:00–22:00; gửi ngoài giờ thì **trước 09:00 sáng hôm sau** – đúng lời trang cảm ơn đã hứa. Chưa báo giá kịp thì gửi câu 1 trong hạn (sổ tay mục 2.18).
- [ ] Giá trong báo giá Desk là giá cuối. Desk báo "Khác giá web khách đã thấy" thì gửi kèm một câu giải thích.
- [ ] Khách xin xóa yêu cầu đã gửi qua web: xóa trên Desk theo WR8, **chép mã `REQ-…` trước khi bấm Xóa ngay**, nhắn quản lý chỉ mã và chữ "xóa Chat theo WR8".
- [ ] **Khai báo lưu trú**: mở **Vận hành → Giấy tờ & khai báo**. Khách Việt Nam khai trước 23:00 ngày đến; khách nước ngoài trong 12 giờ từ lúc nhận phòng. Tab **Cần cập nhật ngày đi** xử lý trong ngày. Không để dòng đỏ qua ca (sổ tay mục 2.11).
- [ ] 22:00: chép tay danh sách khách đến và khách đi ngày mai, cất ngăn khóa, hủy bản cũ (sổ tay mục 0.9; tạm tới v1.1).
- [ ] Đầu ca, cuối ca: theo sổ tay mục 2.1 và tờ dán quầy `product/docs/staff-one-pager.md`.

### 1.1a Hai ngày một lần – cho đội kéo bản sao lưu về Mac

Làm tới khi v1.0.5 có lịch kéo tự động (mục 2.2). Đội và đội bảo mật chốt nhịp này ngày 06/11/2026.

- [ ] **OWN – cho phép kéo bản sao lưu**, ít nhất **2 ngày một lần**. Mở Claude Code trong thư mục dự án, gõ: "Kéo bản sao lưu production về Mac". Đội chỉ kết nối máy chủ vào ngày anh/chị cho phép trong chat. Anh/chị chỉ cần đồng ý khi đội hỏi.
- Lần gần nhất: 06/11/2026, khoảng 19:00. Lần tới: 08/11/2026.
- Đội báo lại một dòng: giờ chạy, **mã thoát (0 là ổn)**, số tệp mới, tên bản mới nhất, có dòng "server copy changed" không.
- Cách kéo từ lần kéo 08/11: bản đã có trên Mac **không bao giờ bị máy chủ ghi đè hay xóa**. Bản quá 35 ngày trong thư mục sao lưu trên Mac tự xóa sau mỗi lần kéo. Anh/chị không tự xóa, không chuyển thư mục.
- **Giữ đúng lời hứa 35 ngày** trong thông báo quyền riêng tư: thư mục sao lưu trên Mac không được nằm trong Time Machine hay iCloud.
  - Đội kiểm chỉ đọc ngày 06/11: Mac chưa có ổ Time Machine nào, nên chưa có bản chép nào ngoài thư mục sao lưu. Thư mục **chưa** được loại khỏi Time Machine: nếu sau này anh/chị bật Time Machine, các bản sao lưu sẽ bị chép và giữ lâu hơn 35 ngày. Thư mục nằm ngoài Desktop và Documents nên iCloud Drive không đồng bộ.
  - Đội đề nghị loại thư mục này khỏi Time Machine (mục 5.4). Đội chỉ đổi khi anh/chị đồng ý trong chat.
  - Anh/chị định bật Time Machine trước khi đồng ý: báo đội trước.
  - Ở mỗi lần kéo, bắt đầu từ 08/11, đội kiểm lại (chỉ đọc) và ghi có/không vào nhật ký quyết định.
- Đội báo **"server copy changed"** (lượt kéo kết thúc với **mã 3**): bản trên máy chủ khác bản đã có trên Mac. Coi là **P0 bảo mật**, nghi máy chủ bị xâm nhập, tới khi đội bảo mật kết luận (mục 3.1). Bản trên Mac vẫn giữ nguyên. Anh/chị không xóa, không kéo lại, không đăng nhập máy chủ. Khác với P0 thường ở mục 3.4:
  - Không duyệt phát hành nào (email "Review deployments") tới khi đội bảo mật báo.
  - Đội có thể đề nghị tạm tắt máy chủ. Khi đó Desk ngừng, quầy làm theo mục 3.2 với sổ giấy. Anh/chị quyết.
  - Nếu xác nhận dữ liệu khách bị lộ, có thể phải báo cơ quan chức năng trong 72 giờ. Đội và luật sư chuẩn bị, anh/chị quyết.
- Lượt kéo lỗi mạng hoặc kết nối (**mã 2**): đội báo anh/chị trong ngày, kéo lại vào lần anh/chị cho phép kế tiếp. Không để quá 2 ngày.
- Mã kiểm tra một bản trên Mac không khớp (**mã 1**): đội xử lý, báo anh/chị trong ngày. Kéo lại không tự sửa được lỗi này.
- Máy chủ hỏng hẳn thì chỉ còn bản trên Mac để dựng lại (mục 2.1a).

### 1.2 Hằng tuần

Đội đề xuất làm vào sáng thứ Hai.

- [ ] **OWN** – lần kéo bản sao lưu về Mac gần nhất cách hôm nay không quá 2 ngày (mục 1.1a). Quá: nhắn đội kéo ngay hôm đó.
- [ ] **OWN** – hộp thư `info@ottimo.vn` (cả mục Spam): còn thư "down", "failing" từ UptimeRobot, Healthchecks.io chưa xử lý không. Còn: mục 2.3.
- [ ] **OWN** – phòng "OTTIMO – Báo động": tin **FAIL** nào chưa có tin **OK** theo sau. Có: báo đội trong ngày.
- [ ] **OWN** – **đếm kho minibar (K-MB)**, khoảng 10 phút: tồn đầu + nhập − tồn cuối so với phiếu nạp (gồm cả dòng không vào tủ); so 3 dòng phiếu nạp ngẫu nhiên với **Folio** của đơn. Lệch quá 2 món một tuần: hỏi người trực, ghi sổ (hướng dẫn `01` mục 2.1).
- [ ] **MGR** – **Chờ đối soát**: không còn khoản ghi **Quá … ngày**.
- [ ] **MGR** – **Giấy tờ & khai báo**, tab **Tất cả**: không còn hồ sơ quá hạn; hồ sơ **Cổng từ chối** đã khai lại.
- [ ] **MGR** – **Cần chú ý**: công nợ, phiếu sửa quá hạn đã có người xử lý.
- [ ] **MGR** – sổ xóa Chat: mọi mã WR8 trong tuần đã có dòng "đã xóa".
- [ ] **OWN** – ghi các góp ý của nhân viên, khách vào một ghi chú để mang vào buổi review (mục 5). Chỉ ghi mã đơn, không ghi tên, số điện thoại khách.

### 1.3 Hằng tháng

Đội đề xuất làm cùng buổi review tháng (mục 5).

- [ ] **OWN – rà thành viên phòng "OTTIMO – Yêu cầu đặt phòng"**: chỉ OWN, MGR, FDL, FD, tài khoản `@ottimo.vn`. Không sale, CTV, buồng phòng, bảo trì, không ai lạ. Quản lý phòng chỉ là OWN và MGR.
- [ ] **OWN – đối chiếu sổ xóa Chat** với các yêu cầu đóng lý do "Đã xóa theo yêu cầu của người gửi" trong tháng (**Yêu cầu từ website** → **Đã đóng**). Mã nào thiếu dòng "đã xóa": xóa luồng Chat ngay.
- [ ] **OWN** – phòng "OTTIMO – Báo động": chỉ có anh/chị và người thứ hai anh/chị đã chọn (nếu có, mục 7.2). Không ai lạ.
- [ ] **OWN – Người dùng & vai**: người nghỉ đã **Khóa tài khoản** và **Xóa email**; mỗi người đúng vai; quản lý đã có email nhận thông báo bảo mật.
- [ ] **OWN – Tham số quy tắc → Lịch sử thay đổi**: mỗi dòng trong tháng có tên người sửa và lý do. Không có dòng mình không biết.
- [ ] **OWN – một giá ở mọi nơi** (ESC-043 C): báo giá thử một ca trên Desk, so với ottimo.vn và Booking.com, Agoda, Airbnb cùng ngày, cùng số khách.
- [ ] **OWN + kế toán** – **Nhật ký tiền** lọc cả tháng; đối chiếu theo cách thanh toán; hóa đơn GTGT vẫn xuất ngoài Desk (sổ tay mục 1.13, 4.3).
- [ ] **OWN** – yêu cầu xem, sửa, xóa dữ liệu của khách (lễ tân chuyển lên) đã xử lý xong.
- [ ] **OWN** – **Thiết bị được cấp**: chỉ còn máy quầy đang dùng; máy mất hoặc thay đã thu hồi.
- [ ] **OWN** – **điện thoại cơ sở**: Zalo, WhatsApp, Telegram, Viber vẫn tắt tự lưu ảnh và file vào thư viện ảnh. App cập nhật có thể bật lại: thấy bật thì tắt lại ngay (hướng dẫn `01` mục 13).

### 1.4 Hằng năm và các mốc ngày

**Hằng năm**
- [ ] **Xóa phòng Chat "OTTIMO – Yêu cầu đặt phòng"** một lần mỗi năm, vào ngày cố định anh/chị đã ghi trong lịch (xác nhận 06/11/2026). Tạo phòng mới cùng cài đặt (hướng dẫn `01` mục 12.1). Làm **cùng đội**: đội dán đường gửi tin mới cho Desk và làm lại kiểm thử xóa tin (K1) bằng một yêu cầu "TEST OTTIMO". Việc này giữ đúng câu "xóa khi không còn cần" trong thông báo quyền riêng tư.
- [ ] **Gia hạn tên miền `ottimo.vn` tại Mắt Bão** trước ngày hết hạn. Kiểm tài khoản Mắt Bão vẫn bật tự gia hạn, xác thực 2 lớp, khóa chuyển nhượng. Tên miền hết hạn là website, Desk, trang khách và email cùng ngừng.
- [ ] Gia hạn **máy chủ ở Nhân Hòa** và **Google Workspace** (email `info@`, Google Chat) theo kỳ hợp đồng.
- [ ] **Chốt giá năm sau**: giá căn (**Danh mục căn**), tham số giá, danh sách `special_dates` của năm sau, rồi gia hạn `web_estimate.open_until`. Desk nhắc khi còn dưới 60 ngày. Chưa gia hạn thì web ghi "giá theo yêu cầu" cho các đêm sau ngày đó.
- [ ] Muốn tăng giá Noel – Tết: báo đội **trước 15/12** để đổi Desk, web và OTA cùng lúc.
- [ ] Kiểm thuế VAT áp từ 01/01 năm mới (ESC-033), sửa `vat_rate` nếu luật đổi.
- [ ] Cho phép đội đổi khóa phiên đăng nhập và mật khẩu cơ sở dữ liệu (12 tháng một lần). Mọi người sẽ phải đăng nhập lại.
- [ ] Kiểm 10 mã khôi phục 2 bước, khóa sao lưu và bản ngoại tuyến của khóa dữ liệu (KEK) còn đủ ở 2 nơi đã cất. Không mở, không chụp.
- [ ] Hỏi luật sư hạn lưu giấy tờ và thông báo quyền riêng tư còn đúng luật không. Đổi gì thì báo đội.

**Mốc gần nhất**

| Ngày | Việc | Ai |
|---|---|---|
| 08/11/2026, rồi ít nhất 2 ngày một lần | Cho đội kéo bản sao lưu về Mac (mục 1.1a) | OWN + đội |
| Chậm nhất 20/11/2026 | Diễn tập khôi phục sao lưu: anh/chị dành khoảng 30 phút mở khóa giải mã. Chỉ anh/chị mở được khóa | OWN + đội |
| 20/11/2026 | Review lần 1 (mục 5.3) | OWN + đội |
| Trước 01/12/2026 | Quyết ESC-033: VAT từ 01/01/2027 | OWN |
| 04/12/2026 | Review lần 2 | OWN + đội |
| Trước 15/12/2026 | Báo đội nếu tăng giá Noel – Tết | OWN |
| Trước 01/01/2027 | Gia hạn `web_estimate.open_until` khi đã chốt giá 2027 | OWN |
| 22/01/2027 | Chứng chỉ HTTPS của ottimo.vn tới hạn – hệ thống tự gia hạn, anh/chị không làm gì | Tự động |
| Theo lịch OWN | Xóa phòng Chat hằng năm | OWN + đội |

### 1.5 Khi có người mới hoặc người nghỉ

- [ ] **Người mới**: tạo tài khoản đúng vai (**Người dùng & vai**, chỉ OWN), đưa mật khẩu tạm tận tay. Quản lý, lễ tân trưởng bật 2 bước ngay. Quản lý nhập email nhận thông báo bảo mật. Đào tạo theo sổ tay mục 5.8 trên trang tập.
- [ ] Người mới là MGR, FDL hoặc FD: cài điện thoại theo bảng ở hướng dẫn `01` mục 12.1 **trước**, rồi mới thêm vào phòng "OTTIMO – Yêu cầu đặt phòng".
- [ ] **Trước ngày lên v1.0.5:** mọi lễ tân trưởng đã bật 2 bước, anh/chị nhìn tận mắt (hướng dẫn `01` mục 1.9 bước 8). Từ v1.0.5, lễ tân trưởng chưa bật bị hạn chế ngay ở lượt bấm kế tiếp sau khi bản lên, kể cả giữa ca (release notes v1.0.5).
- [ ] **Đổi vai chỉ làm trên Desk** (**Người dùng & vai → Sửa vai**): Desk đăng xuất người đó ngay trên mọi máy, quyền mới áp dụng ngay. Không nhờ đội đổi vai thẳng trong cơ sở dữ liệu. Sự cố buộc đội phải làm vậy: đội phải làm như Desk, tức đăng xuất người đó và báo phần mềm vai đã đổi (tăng `roles_version`); thiếu bước này thì quyền cũ còn dùng được tới khoảng 1 phút (đội bảo mật 07/11).
- [ ] **Người nghỉ**: làm khối **Ngày cuối của người nghỉ** ở sổ tay mục 1.5 (8 bước, gồm gỡ khỏi phòng Chat, đổi mật khẩu dùng chung, đổi mã cửa căn thuê tháng trong 7 ngày). Người đó ở phòng "OTTIMO – Báo động": gỡ khỏi phòng cùng ngày.

---

## 2. Hệ thống tự làm – anh/chị không cần làm

### 2.1 Bảng việc tự động

| Việc | Bao lâu một lần | Lỗi thì báo ở đâu |
|---|---|---|
| Sao lưu toàn bộ dữ liệu, đã mã hóa | Mỗi đêm, khoảng 03:00 | Phòng "OTTIMO – Báo động" khi quá 26 giờ không có bản mới |
| Giữ bản sao lưu trên máy chủ | Bản 7 ngày gần nhất, bản Chủ nhật tới 35 ngày. Bản cũ hơn tự xóa | – |
| Kiểm sức khỏe máy chủ: các dịch vụ đang chạy, dịch vụ khởi động lại liên tục, ổ đĩa đầy 80 %, bộ nhớ, lỗi máy chủ, sao lưu, chứng chỉ, việc tự xóa ảnh giấy tờ, hàng đợi thư bảo mật, số lần đổi email, cấu hình gửi thư, khóa bảng thông báo quyền riêng tư | 30 phút | Phòng "OTTIMO – Báo động": tin **FAIL** khi có lỗi, nhắc lại mỗi 6 giờ khi lỗi còn, tin **OK** khi hồi phục. Tin không có dữ liệu khách |
| Kiểm giá trên web: route giá bị dội (khách thật có thể không thấy giá), căn thiếu giá niêm yết nên bị bỏ khỏi giá web, công tắc hiện giá bị bật/tắt | 30 phút | Phòng "OTTIMO – Báo động". Tin công tắc gửi mỗi lần đổi: anh/chị vừa tự đổi thì bỏ qua |
| Chuông báo khi chính việc kiểm im lặng (Healthchecks.io) | Sau mỗi lượt kiểm | Email `info@ottimo.vn` khi im quá 1 giờ hoặc lượt kiểm báo lỗi |
| Kiểm 5 trang từ bên ngoài: desk, staff, g, ottimo.vn, www (UptimeRobot) | 5 phút | Email `info@ottimo.vn` |
| Gia hạn chứng chỉ HTTPS (ổ khóa trên trình duyệt) | Tự động trước hạn | Phòng "OTTIMO – Báo động" khi còn dưới 14 ngày |
| Tự xóa ảnh giấy tờ đúng hạn | Hằng giờ | Phòng "OTTIMO – Báo động" khi 26 giờ không chạy |
| Vá bảo mật hệ điều hành máy chủ | Tự động; khởi động lại khi cần lúc 02:30 | – |
| Tin yêu cầu website mới vào phòng "OTTIMO – Yêu cầu đặt phòng" (mức A: mã, giờ, hạn, link Desk) | Mỗi yêu cầu, mọi giờ. Nhắc khi quá hạn chưa ai nhận; nhắc lúc 07:30 cho yêu cầu đêm | Chưa tự báo khi tin không gửi được (mục 2.2) |
| Giá ước tính trên web | Mỗi lần khách xem. Web dùng cùng cách tính của Desk, kênh Trực tiếp | Như dòng "Kiểm giá trên web" |
| Thư bảo mật: đổi tài khoản nhận, đặt lại 2 bước, dùng mã khôi phục, đổi email | Mỗi lần có việc | Về email nhận thông báo bảo mật mỗi người tự nhập trên Desk (sổ tay mục 0.3a) |
| Nhật ký: ai sửa giá, tham số, tiền, ai xem giấy tờ | Mỗi thao tác | Xem trên Desk (**Lịch sử thay đổi**, **Nhật ký tiền**) |

### 2.1a Mất tối đa bao nhiêu dữ liệu khi có sự cố

| Sự cố | Hiện nay | Từ v1.0.5 |
|---|---|---|
| Dữ liệu hỏng hoặc bị xóa nhầm, máy chủ vẫn còn | Tới **24 giờ**: máy chủ sao lưu mỗi đêm một lượt | Tới **12 giờ**: thêm lượt sao lưu lúc **15:00** |
| Máy chủ mất hẳn (hỏng đĩa, nhà cung cấp khóa tài khoản, bị chiếm quyền) | Chỉ còn bản trên Mac. Mất phần dữ liệu sau bản mới nhất có trên Mac. Vì vậy kéo đúng nhịp mục 1.1a. Kéo đúng nhịp 2 ngày: mất tới **72 giờ** (thường khoảng **64 giờ**, khi kéo lúc khoảng 19:00); kéo trễ thì cộng thêm đúng số giờ trễ. | Tới **60 giờ** (thường khoảng **52 giờ**) khi vẫn kéo tay; tới khoảng **36 giờ** khi Mac tự kéo hằng ngày (mục 2.2). |

- Con số "mất tối đa 15 phút" ghi từ trước chưa đúng: máy chủ chưa có cách sao lưu liên tục.
- Anh/chị xác nhận mức **12 giờ** ở buổi review 20/11 (mục 5.4). Muốn dưới 12 giờ thì cần máy chủ phụ, có chi phí. Đội sẽ trình phương án riêng khi anh/chị muốn.
- Phần dữ liệu bị mất, nhân viên nhập lại từ OTA, Zalo, sổ giấy.

### 2.2 Chưa có – đề xuất v1.0.5

| Việc | Hiện nay làm thế nào | Đề xuất |
|---|---|---|
| Bản sao lưu ngoài máy chủ tự kéo về theo lịch | Đội kéo tay về Mac **ít nhất 2 ngày một lần**, vào ngày anh/chị cho phép (mục 1.1a) | chưa có – đề xuất v1.0.5: Mac của anh/chị tự kéo hằng ngày, chỉ cài khi anh/chị đồng ý (mục 5.4). Lượt tự kéo lỗi thì có email báo ngay về `info@ottimo.vn`; lỗi "server copy changed" là P0 như mục 1.1a. Quá **48 giờ** không có lượt kéo nào thành công (ví dụ Mac tắt) cũng có email |
| Lượt sao lưu thứ hai trong ngày | Mỗi đêm một lượt, mất tối đa 24 giờ (mục 2.1a) | chưa có – đề xuất v1.0.5: thêm lượt **15:00**, mất tối đa 12 giờ |
| Tự báo khi tin Google Chat không gửi được ("chat dead") | Đội kiểm bằng lệnh khi có việc. Lễ tân luôn xem Desk nên không sót yêu cầu | chưa có – đề xuất v1.0.5: thêm vào lượt kiểm 30 phút |
| Nhắc hạn tên miền, máy chủ, Google Workspace | Anh/chị tự nhớ (mục 1.4) | chưa có – đề xuất v1.0.5: nhắc trước 30 ngày vào phòng Báo động |
| Nhắc diễn tập khôi phục sao lưu | Đội diễn tập ít nhất mỗi round, cần anh/chị khoảng 30 phút mở khóa giải mã. Lần gần nhất 29/10/2026; lần tới chậm nhất 20/11/2026 (mục 1.4) | chưa có – đề xuất v1.0.5: quá **35 ngày** chưa diễn tập thì phòng Báo động nhận tin **FAIL**. Biên bản trình ở buổi review, chỉ có số đếm |
| Nhắc ngày xóa phòng Chat hằng năm | Lịch riêng của anh/chị | chưa có – đề xuất v1.0.5: dòng nhắc ở **Cần chú ý** trước 14 ngày |
| Nhắc đổi khóa 12 tháng | Đội nhớ theo sổ bí mật | chưa có – đề xuất v1.0.5: nhắc vào phòng Báo động |

**Có sẵn nhưng chưa bật:** cảnh báo "thư bảo mật không tới ai". Đang chờ quản lý nhập email nhận thông báo bảo mật trên Desk. Quản lý nhập xong, anh/chị báo đội "quản lý đã nhập email" (không dán địa chỉ). Đội bật sau 24 giờ.

### 2.3 Nhận tin báo động thì làm gì

1. Mở `desk.ottimo.vn` bằng dấu trang, trên điện thoại dùng **4G** (không dùng Wi-Fi quầy).
2. **Không vào được**: P0 – làm mục 3 ngay. Ghi giờ nhận tin và tên mục trong tin.
3. **Vào được**: người trực làm việc bình thường. Anh/chị báo đội trong ngày bằng `/feedback`, kèm giờ nhận tin và tên mục trong tin.
4. Tin **OK** đến sau tin **FAIL**: không cần làm gì. Mang vào buổi review nếu lặp lại.
5. Không tự sửa máy chủ, không đăng nhập máy chủ.
6. **Người thứ hai trong phòng** (nếu anh/chị đã thêm, mục 7.2) nhận **FAIL**: làm bước 1. Không vào được Desk: gọi anh/chị ngay, người trực làm theo mục 3.2. Vào được: nhắn anh/chị trong ngày, kèm giờ nhận tin và tên mục trong tin. Anh/chị báo đội theo mục 3.3.

---

## 3. Khi có sự cố

### 3.1 P0 hay lỗi thường

| Mức | Khi nào | Ví dụ |
|---|---|---|
| **P0 – báo ngay** | Khách không đặt được | Form trên ottimo.vn báo lỗi với mọi khách; Desk không tạo được đơn, giữ chỗ; mọi báo giá trên Desk báo lỗi |
| | Hệ thống sập | Desk, app nhân viên, trang khách hoặc website không mở được trên 4G |
| | Không làm được việc chính ở quầy | Không nhận phòng, trả phòng, thu tiền được |
| | **Sai tiền** | Báo giá, folio, cọc, hoàn sai; giá web khác giá Desk khi thử cùng ca, cùng lúc; mã VietQR ra tên chủ tài khoản sai |
| | Mất dữ liệu | Đơn, khoản thu biến mất |
| | Nghi bị xâm nhập hoặc lộ dữ liệu khách | Dòng **Đã lên lịch** lạ ở tài khoản nhận; thư bảo mật về việc mình không làm; tài khoản lạ đăng nhập; ảnh giấy tờ gửi nhầm ra ngoài; lượt kéo sao lưu báo "server copy changed" (mục 1.1a) |
| **Lỗi thường** | Vẫn làm được việc bằng cách khác | Chữ sai, nút khó tìm, chậm nhưng vẫn chạy, tin Chat không đến mà Desk vẫn có yêu cầu, tin FAIL rồi OK trong vòng 1 giờ |

Không chắc: coi là P0.

### 3.2 Làm ngay ở quầy

| Triệu chứng | Làm tạm | Báo ai |
|---|---|---|
| Desk không mở trên máy quầy | Thử điện thoại cơ sở dùng 4G. Mở được: lỗi mạng quầy, không phải P0 – phát 4G cho máy quầy | Lễ tân trưởng |
| Desk không mở cả trên 4G | Sổ giấy + danh sách khách đến/đi chép lúc 22:00 (sổ tay mục 0.9). Chưa xem được phòng trống thì không nhận đơn mới: ghi số, hẹn gọi lại. Có lại thì nhập bù trong 24 giờ | Lễ tân trưởng → quản lý → OWN gõ `/feedback P0` |
| Form web lỗi, hoặc web gửi yêu cầu sai | OWN tắt form: **Tham số quy tắc** → `public_booking_requests_enabled` = false. Khách liên hệ qua Zalo hoặc điện thoại như trước khi có form | OWN gõ `/feedback P0` |
| Giá web sai | OWN tắt giá web: `public_show_prices` = false. Lâu nhất khoảng 2 phút là web hết hiện giá. Phòng Báo động sẽ nhận một tin công tắc – đúng thiết kế. Báo giá Desk vẫn là giá cuối | OWN gõ `/feedback P0` |
| Lỡ bấm **Lưu thay đổi** ở `weekend_nights` hoặc `min_stay` (tới khi v1.0.5 lên), hoặc mọi báo giá trên Desk báo lỗi | Không lưu lại khi đội chưa hướng dẫn. Ghi sổ giấy đơn, báo giá chưa làm được; nhập bù khi Desk chạy lại | OWN gõ `/feedback P0` ngay: tên dòng tham số, giờ lưu, **Hiệu lực từ**. P0 vì báo giá có thể dừng tới hết ngày, không gỡ được trên Desk (mục 4.1) |
| Số tiền trên Desk lạ | Không thu thêm, không hoàn khi chưa rõ. Ghi mã đơn và số Desk hiện vào sổ giao ca | Lễ tân trưởng → quản lý → OWN gõ `/feedback P0` |
| Mã VietQR hiện "Tài khoản nhận vừa đổi" mà chưa nghe OWN báo, hoặc tên chủ tài khoản sai | Chưa cho khách chuyển. Mời trả tiền mặt hoặc thẻ | Gọi OWN ngay. OWN làm hướng dẫn `01` mục 10.2 rồi gõ `/feedback P0` |
| Nghi lộ mật khẩu, tài khoản lạ đăng nhập | OWN **Đặt lại mật khẩu** người đó (đăng xuất mọi máy) hoặc **Khóa tài khoản** | OWN gõ `/feedback P0` |
| Mất điện | An toàn khách trước. Khóa cửa chạy pin vẫn mở. Máy quầy chạy pin, 4G, sổ giấy | Lễ tân trưởng → quản lý. Quá 4 giờ: OWN quyết đổi phòng hoặc bù |
| Tin Chat không đến | Không cần làm tạm: lễ tân đang xem Desk | OWN báo đội trong ngày (lỗi thường) |

Đội kỹ thuật làm việc qua Claude Code, không có số điện thoại trực. Nhà cung cấp (Nhân Hòa cho máy chủ, Mắt Bão cho tên miền, Google Workspace cho email và Chat): chỉ liên hệ khi đội đề nghị, không tự đổi cài đặt.

### 3.3 Báo cho đội

1. Mở Claude Code trong thư mục dự án `hotel-app` trên Mac, như các buổi trước.
2. Gõ `/feedback` rồi mô tả. P0 thì chữ **P0** đứng đầu. Mẫu:
   `/feedback P0 – Từ 14:05 Desk không mở trên máy quầy và 4G. Màn hình trắng. Đơn OTM-… căn 203 đang chờ nhận phòng. Lễ tân đang ghi sổ giấy.`
3. Ghi đủ: **khi nào** (giờ), **ở đâu** (Desk, app nhân viên, trang khách, website; tên màn hình), **mã đơn** `OTM-…` hoặc **mã yêu cầu** `REQ-…`, căn, **đã bấm gì**, **Desk báo gì** (chép nguyên câu và **mã tham chiếu** nếu có), **đã làm tạm gì**.
4. **Không** ghi tên, số điện thoại, email, số giấy tờ của khách. Mọi thứ gõ qua `/feedback` được lưu vào kho mã công khai của dự án: coi như người ngoài đọc được.
5. Ảnh chụp màn hình: chỉ gửi khi lời mô tả chưa đủ. Chụp màn **không có** dữ liệu khách. Không tránh được thì che kín tên, số điện thoại, email, số giấy tờ, số tài khoản, mã cửa trước khi gửi. Không bao giờ gửi ảnh CCCD, hộ chiếu.
6. Đội hỏi lại tối đa 2 câu. Trả lời ngắn, rồi chờ đội báo.

### 3.4 Đội xử lý P0 thế nào

Nghi máy chủ bị xâm nhập ("server copy changed", mục 1.1a): **không** làm bước 2–5 dưới đây. Làm theo mục 1.1a, chờ đội bảo mật báo.

1. Điều phối viên ghi phiếu phản hồi và gửi anh/chị một bảng ngắn: "hiểu thế này, mức P0 – đúng không".
2. Lỗi do bản vừa phát hành: đội đề xuất **quay lui về bản trước** trong vài phút. Dữ liệu giữ nguyên. Đội chỉ làm khi anh/chị đồng ý trong chat.
3. Vai liên quan sửa ngay, ngoài lịch round.
4. QA kiểm lại, QC duyệt rút gọn. Đội sao lưu trước khi phát hành.
5. Anh/chị duyệt phát hành: bấm duyệt trong email "Review deployments" của GitHub, hoặc đồng ý trong chat khi đội hỏi.
6. Điều phối viên báo lại: đã sửa gì, ở bản nào, cách kiểm. Cách làm ở quầy đổi thì sổ tay được cập nhật.

Mục tiêu: xong trong ngày.

**Lỗi thường:** đội ghi phiếu, đưa vào danh sách việc, sửa ở round kế tiếp. Anh/chị chạy round ở buổi review (mục 5). Bản vá phát hành khung thứ Tư 09:30–10:30, giờ ít khách nhận, trả phòng.

---

## 4. Khi muốn đổi giá, tham số, nội dung web

### 4.1 Tự làm trên Desk

Anh/chị tự làm được, không cần báo đội:
- Giá đêm, giá tháng từng căn: **Quản trị → Danh mục căn → Sửa**.
- Tham số giá: cuối tuần, ngày đặc biệt, giảm theo số đêm, phụ thu người, cọc. Trừ `weekend_nights` và `min_stay` tới khi v1.0.5 lên (khung dưới).
- Danh sách ngày đặc biệt, giờ nhận/trả, hạn giữ chỗ.
- Hai công tắc web: form đặt phòng (`public_booking_requests_enabled`), hiện giá (`public_show_prices`). Tắt được ngay trong ngày.
- Ngày cuối web hiện giá (`web_estimate.open_until`).
- Danh mục minibar, người dùng và vai, máy quầy được cấp.
- Tài khoản nhận VietQR: chỉ OWN, nhập lại mật khẩu và mã 2 bước, có hiệu lực từ hôm sau.

> **Lỗi đang sửa – hai tham số (sửa ở v1.0.5):** **Tới khi v1.0.5 lên**, không bấm **Lưu thay đổi** ở hai dòng `weekend_nights` (**Đêm tính là cuối tuần**) và `min_stay` (**Ở tối thiểu**), nhóm **Khác**: Desk v1.0.4 nhận cả giá trị sai dạng, lưu sai thì Desk không nhận ra đêm cuối tuần, hoặc mọi báo giá và đơn trực tiếp mới báo lỗi, không gỡ được trong ngày (BUG-R5-001, BUG-R5-003). Buộc phải đổi: nhắn đội trước, chọn **Hiệu lực từ** từ ngày mai để còn **Hủy lịch** được. Lỡ lưu: báo đội ngay, coi là **P0** (chủ đầu tư gõ `/feedback P0`, quản lý gọi chủ đầu tư).

**Các bước (mỗi lần sửa):**
- [ ] 1. Đọc mục của tham số trong từ điển `product/docs/tham-so-quy-tac.md`: ý nghĩa, giới hạn, tham số đi kèm, mức đội đề xuất.
- [ ] 2. **Quản trị → Tham số quy tắc** → chọn tab → **Sửa** (giá căn: **Danh mục căn → Sửa**).
- [ ] 3. Nhập **Giá trị mới**. Ô dạng danh sách: sao chép rồi dán, giữ đủ dấu ngoặc.
- [ ] 4. Chọn **Hiệu lực từ**: hôm nay (Desk điền sẵn; ngày trên Desk đổi lúc 06:00) hoặc ngày sau. Đơn, báo giá, hợp đồng đã tạo **giữ số cũ**.
- [ ] 5. Ghi **Lý do** ngắn. Bấm **Lưu thay đổi**.
- [ ] 6. Mở **Lịch sử thay đổi** trong cùng hộp. Dòng mới phải có **tên anh/chị**, đúng giá trị, đúng ngày hiệu lực. Không thấy tên mình, hoặc thấy dòng lạ: dừng, báo đội (P0 nếu là tài khoản nhận tiền hoặc tham số bảo mật).
- [ ] 7. Tham số giá: báo giá thử một ca trên Desk (không lưu báo giá) theo bảng "Ví dụ kiểm nhanh" của từ điển. Mở ottimo.vn, thử cùng ca: web phải ra cùng số. Giá căn: báo giá thử 1 đêm của căn đó **từ ngày hiệu lực trở đi**, vì Desk chưa cảnh báo giá đêm cao bất thường (gõ thừa số 0) tới khi có bản sửa.
- [ ] 8. Ghi sổ giao ca: tên tham số, ngày hiệu lực. Báo lễ tân trưởng.

**Lưu ý:**
- Đã lưu thì **trong ngày không sửa lại được**. Lỡ sai: lưu lại với **Hiệu lực từ = ngày mai**, hoặc **Hủy lịch** dòng chưa tới ngày. Giá sai đang hiện trên web: tắt `public_show_prices` trước.
- Một số tham số phải đổi cùng nhau (ví dụ mức tăng cuối tuần với đêm tính là cuối tuần, giá căn với giá OTA nền). Xem "Các cặp phải đổi cùng nhau" trong từ điển.
- Đổi giá căn và tham số giá nên làm trong một lần. Làm lệch nhau thì Desk và web ra số lai.
- Quản lý sửa được tham số vận hành. **Chỉ OWN** sửa hạn mức FOC, hoa hồng, VAT, lưu trữ dữ liệu, tham số bảo mật.
- Tham số ghi **[Bảo mật]**: chỉ sửa khi đội khuyên. **[Chưa dùng]**, **[Đã bỏ]**: không cần sửa.
- Các tham số còn lệch sổ tay (từ điển, mục "Tham số trên production lệch sổ tay"): anh/chị chỉnh theo từ điển, rồi báo đội "đã chỉnh tham số" để đội rà sổ tay và giá OTA theo.

### 4.2 Phải báo đội trước

Gõ `/feedback` và ghi "thay đổi", không cần chữ P0.

- [ ] **Mốc thuê tháng** (`long_stay_required_from_nights`, đi kèm `short_stay_max_nights`): web phải phát hành lại **cùng ngày**, nếu không form web hiện hai thông điệp trái nhau. Báo trước, chọn ngày cùng đội.
- [ ] **Chữ, ảnh trên website** ở bất kỳ ngôn ngữ nào. Số điện thoại lễ tân trên web và trang khách (đội phải dựng lại bản web).
- [ ] **Thông báo quyền riêng tư** và câu đồng ý trên form: đội bảo mật duyệt chữ, có thể cần luật sư; đội đăng phiên bản mới cho cả 5 ngôn ngữ.
- [ ] **Thêm hoặc bớt ngôn ngữ** trên web.
- [ ] **Giá OTA**: anh/chị vẫn tự đổi trên extranet Booking.com, Agoda, Airbnb. Báo đội trước để giữ một giá ở mọi nơi và cập nhật sổ tay. Ô nhập giá OTA nền trên Desk chưa có (v1.0.5): không tự thêm.
- [ ] **Tăng giá Noel – Tết**: báo trước 15/12.
- [ ] Thêm căn, đổi nhóm căn, đổi tên hạng phòng hiện trên web.
- [ ] Mức chi tiết của tin Google Chat (đang ở mức A); tạo phòng Chat mới; đổi đường gửi tin của Desk.
- [ ] Hạn lưu giấy tờ dài hơn giới hạn Desk cho phép.
- [ ] Cho thêm người đăng nhập hộp thư `info@ottimo.vn`, hoặc đổi địa chỉ gửi thư của hệ thống.
- [ ] Tên miền, bản ghi DNS ở Mắt Bão, máy chủ, gói dịch vụ trả phí.
- [ ] Tính năng mới.

---

## 5. Review định kỳ

### 5.1 Lịch

| Giai đoạn | Lịch | Ngày đề xuất |
|---|---|---|
| Tháng đầu | 2 tuần một lần | Thứ Sáu 20/11/2026 và thứ Sáu 04/12/2026 |
| Từ tháng 1/2027 | Mỗi tháng một lần | Thứ Sáu tuần đầu tháng. Trùng lễ, Tết thì dời một tuần |

Mỗi buổi khoảng 45–60 phút. Ngoài lịch: P0 báo ngay (mục 3), không chờ review.

### 5.2 Lệnh dùng trong Claude Code

| Lệnh | Dùng khi |
|---|---|
| `/status` | Đầu buổi: xem tiến độ, lỗi còn mở theo P0–P3, việc đang chờ anh/chị quyết (kèm đề xuất của đội) |
| `/feedback <mô tả>` | Ghi từng điều muốn sửa hoặc thêm. Mỗi điều một lần gõ |
| `/round <số>` | Cho đội chạy bản sửa: đủ 7 bước, có review chéo, kiểm thử, QC. Round tiếp theo là `/round 5` |

### 5.3 Mỗi lần review xem gì

- [ ] 1. Gõ `/status`. Đọc 15 dòng.
- [ ] 2. **Việc chờ quyết (ESC)**: chọn phương án. Không chắc thì chọn đề xuất của đội.
- [ ] 3. **Lỗi còn mở**: còn P0, P1 nào không. P2, P3 nào anh/chị muốn sửa trước.
- [ ] 4. **Báo động trong kỳ**: bao nhiêu tin FAIL, đã hồi phục hết chưa, có mục nào lặp lại.
- [ ] 5. **Sao lưu**: lần kéo về Mac gần nhất (không quá 2 ngày); trong kỳ có lượt kéo nào báo "server copy changed" không; lần diễn tập khôi phục gần nhất (không quá 35 ngày).
- [ ] 6. **Website**: số yêu cầu mới, số trả lời đúng hạn, số quá hạn, khách theo ngôn ngữ. Mọi WR8 đã xóa Chat.
- [ ] 7. **Giá**: Desk = web = OTA; tham số còn lệch sổ tay; mốc sắp tới ở mục 1.4.
- [ ] 8. **Người và quyền**: người dùng và vai, thành viên hai phòng Chat.
- [ ] 9. **Góp ý** của nhân viên, khách (ghi chú tuần ở mục 1.2): gõ `/feedback` cho từng điều.
- [ ] 10. **Quyết**: chạy `/round 5` (hoặc số kế tiếp) cho các việc đã chọn, hay gom tiếp tới buổi sau.

Sau buổi review: đội làm, rồi báo "QC ĐẠT" kèm ghi chú phát hành. Anh/chị duyệt phát hành, đọc ghi chú phát hành `product/docs/release-notes.md`, báo lễ tân trưởng điều đổi ở quầy.

### 5.4 Việc mang vào buổi review đầu tiên (20/11/2026)

- [ ] Chỉnh các tham số còn lệch sổ tay: 8 dòng phần A và dòng `rounding.ota_rate` ở mục "Tham số trên production lệch sổ tay" của từ điển. Riêng mốc thuê tháng (`long_stay_required_from_nights`, `short_stay_max_nights`): chọn ngày cùng đội vì web phải phát hành lại cùng ngày (mục 4.2). Từ 06/11 web hiện giá theo bảng tham số đang chạy, theo quyết định của anh/chị.
- [ ] **Chốt giá 2027** (giá căn ở **Danh mục căn**, tham số giá, `special_dates` năm 2027) rồi **gia hạn `web_estimate.open_until`** tới ngày cuối đã chốt giá (ví dụ 2028-01-01 nếu chốt cả năm 2027). Chưa gia hạn thì từ **01/01/2027** web ghi "giá theo yêu cầu" cho mọi đêm từ ngày đó; khách vẫn gửi được yêu cầu, lễ tân báo giá trên Desk. Desk nhắc khi còn dưới 60 ngày, tức là từ đầu tháng 11.
- [ ] Quyết ESC-033 (VAT 2027), hạn trước 01/12.
- [ ] Quản lý nhập email nhận thông báo bảo mật, để đội bật cảnh báo thư (mục 2.2).
- [ ] Hỏi đội bảo mật: đã bỏ được kiểm bảo mật buổi sáng chưa.
- [ ] Diễn tập khôi phục sao lưu: nếu chưa làm, hẹn khoảng 30 phút trước buổi này (mục 1.4).
- [ ] Trả lời **có hoặc không**, không gửi giá trị: (a) sao lưu tự động của nhà cung cấp máy chủ đang tắt, hoặc giữ tối đa 7 ngày; (b) bản ngoại tuyến của khóa dữ liệu và khóa giải mã sao lưu vẫn còn, anh/chị mở được; (c) FileVault trên Mac vẫn bật (đã xác nhận 27/10).
- [ ] **Đồng ý hay không** cho đội loại thư mục sao lưu trên Mac khỏi Time Machine (mục 1.1a). Chỉ đổi danh sách loại trừ của Time Machine, không xóa gì. Đồng ý sớm hơn thì nhắn đội trong chat, không cần chờ buổi này.
- [ ] **Đồng ý hay không** cho đội cài lịch tự kéo sao lưu hằng ngày về Mac của anh/chị (v1.0.5). Chưa đồng ý thì đội vẫn kéo tay theo mục 1.1a.
- [ ] **Xác nhận** mức mất dữ liệu, thay con số 15 phút ghi từ trước (mục 2.1a): mất tối đa **12 giờ** từ v1.0.5 khi máy chủ còn; khi máy chủ mất hẳn: tới 60 giờ (thường khoảng 52 giờ) nếu kéo tay, tới khoảng 36 giờ nếu Mac tự kéo hằng ngày. Hiện mức thật là 24 giờ khi máy chủ còn, tới 72 giờ (thường khoảng 64 giờ) khi máy chủ mất hẳn.
- [ ] Chọn **một người thứ hai** vào phòng "OTTIMO – Báo động" (mục 7.2). Không tốn tiền.
- [ ] Chọn việc cho v1.0.5: ô nhập giá OTA nền trên Desk, các việc "chưa có" ở mục 2.2.

---

## 6. Những điều không bao giờ làm

- [ ] **Không dán** mật khẩu, mã 2 bước, mã khôi phục, khóa sao lưu, khóa dữ liệu (KEK), số tài khoản, mật khẩu Wi-Fi, đường dẫn webhook của hai phòng Chat, địa chỉ ping Healthchecks vào Claude Code, `/feedback`, email, Zalo hay bất kỳ chat nào.
- [ ] **Không gửi ảnh** có CCCD, hộ chiếu, ảnh giấy tờ, tên, số điện thoại, email khách, số tài khoản, mã cửa. Không gõ tên khách vào `/feedback`.
- [ ] **Không cấp quyền sai vai**: không mời sale, CTV, buồng phòng, bảo trì vào phòng "OTTIMO – Yêu cầu đặt phòng"; phòng "OTTIMO – Báo động" chỉ có anh/chị và tối đa **một** người thứ hai anh/chị chọn (mục 7.2); không cấp vai quản lý, chủ đầu tư "cho tiện"; không dùng chung tài khoản. Tài khoản chủ đầu tư thứ hai chỉ cấp cho một người khác anh/chị tin cậy.
- [ ] Không tắt 2 bước của chủ đầu tư, quản lý, lễ tân trưởng.
- [ ] Không tự đăng nhập máy chủ, không chạy lệnh ai gửi qua tin nhắn hay email.
- [ ] Không sửa bản ghi DNS ở Mắt Bão khi chưa báo đội.
- [ ] Không duyệt "Review deployments" trên GitHub khi đội chưa báo QC đạt và chưa hỏi anh/chị.
- [ ] Không tập thao tác trên Desk thật. Dữ liệu thật chỉ ghi thêm, không xóa được. Tập trên trang tập.
- [ ] Không xóa phòng Chat, webhook "Desk OTTIMO", webhook "ottimo-alert" ngoài lịch xóa hằng năm cùng đội.
- [ ] Không xóa, không chuyển thư mục sao lưu OTTIMO trên Mac, kể cả khi đội báo "server copy changed".
- [ ] Không cho người khác đăng nhập `info@ottimo.vn` khi chưa báo đội.
- [ ] Không gửi mã cửa bằng chữ hay ảnh. Không mở Google Chat trên máy quầy.
- [ ] Không bấm link trong tin tự xưng là Desk mà không dẫn tới `desk.ottimo.vn`.

---

## 7. Danh bạ hệ thống

### 7.1 Các trang

| Địa chỉ | Tên | Ai dùng |
|---|---|---|
| `desk.ottimo.vn` | OTTIMO Desk | OWN, MGR, lễ tân, sale, CTV |
| `staff.ottimo.vn` | App nhân viên | Buồng phòng, bảo trì, lễ tân trưởng (kiểm phòng) |
| `g.ottimo.vn` | Trang khách | Khách, qua link riêng của từng đơn |
| `ottimo.vn`, `www.ottimo.vn` | Website | Khách. 5 ngôn ngữ: English (trang chính), `/vi/`, `/ko/`, `/zh/`, `/ru/`. Thông báo quyền riêng tư ở `/privacy/` của từng ngôn ngữ |
| `desk.staging.ottimo.vn`, `staff.staging.ottimo.vn` | Trang tập | Đào tạo, dữ liệu giả. Mật khẩu khác Desk thật. Mã VietQR ở đây không dùng để chuyển tiền |

### 7.2 Phòng Chat và cảnh báo

| Tên | Có gì | Ai ở trong |
|---|---|---|
| Google Chat "OTTIMO – Yêu cầu đặt phòng" | Tin yêu cầu website mức A | OWN, MGR, FDL, FD. Quản lý phòng: OWN, MGR |
| Google Chat "OTTIMO – Báo động" | Tin FAIL, OK của máy chủ | OWN. Có thể thêm **một** người thứ hai anh/chị chọn (ngay dưới bảng) |
| Healthchecks.io, check `ottimo-production` | Báo khi việc kiểm máy chủ im lặng | Email về hộp thư nhóm `info@ottimo.vn` |
| UptimeRobot, 5 trang | Báo khi trang không mở được từ bên ngoài | Email về hộp thư nhóm `info@ottimo.vn` |
| GitHub, môi trường `production` | Email "Review deployments" mỗi lần phát hành | OWN là người duyệt |

**Thêm người thứ hai vào phòng "OTTIMO – Báo động"** (anh/chị chọn, không tốn tiền):
- Vì sao: hiện cảnh báo chỉ tới một mình anh/chị. Ban đêm, lúc anh/chị không xem điện thoại, không ai khác nhận.
- Ai: **một** người anh/chị tin cậy, có tài khoản `@ottimo.vn`. Đội đề xuất quản lý (MGR) hoặc lễ tân trưởng (FDL).
- Tin trong phòng chỉ có tên mục kiểm và số đếm, không có dữ liệu khách.
- Trước khi thêm: điện thoại người đó đã cài theo hướng dẫn `01` mục 12.1 (2 bước, khóa màn hình, quản lý thiết bị).
- Cách thêm: anh/chị mở phòng trong Google Chat, thêm người đó bằng tài khoản `@ottimo.vn` là **thành viên** (không làm quản lý phòng). Trong phòng không thêm ứng dụng hay webhook nào khác ngoài cảnh báo `ottimo-alert`. Cho người đó đọc mục 2.3 bước 6 (lễ tân trưởng: hướng dẫn `02` mục 13.5). Thêm xong, nhắn đội "đã thêm người thứ hai vào phòng Báo động – vai …". Không ghi tên, email.
- Người đó nhận **FAIL**: làm theo mục 2.3 bước 6.
- Người đó nghỉ việc: gỡ khỏi phòng cùng ngày (mục 1.5).

### 7.3 Nhà cung cấp

| Dịch vụ | Nhà cung cấp |
|---|---|
| Tên miền `ottimo.vn`, DNS | Mắt Bão |
| Máy chủ (đặt tại Việt Nam) | Nhân Hòa |
| Email `info@`, Google Chat | Google Workspace |
| Chứng chỉ HTTPS | Let's Encrypt, tự gia hạn |
| Báo động | Healthchecks.io, UptimeRobot (gói miễn phí) |

### 7.4 Tài liệu

| Cần gì | Ở đâu trong thư mục dự án |
|---|---|
| Sổ tay sử dụng (mọi bộ phận) | `product/docs/manual/user-manual-v1.0.md`. Bản HTML theo nhận diện OTTIMO: nhờ đội dựng lại khi cần (sổ tay và bộ hướng dẫn sửa 06/11, bản HTML chưa dựng lại) |
| Hướng dẫn theo vai | `product/docs/manual/guides/` – `01` chủ đầu tư và quản lý, `02` lễ tân, `03` buồng phòng, `04` bảo trì, `05` sale và CTV |
| Tờ dán quầy | `product/docs/staff-one-pager.md` |
| Từ điển tham số (198 tham số) | `product/docs/tham-so-quy-tac.md` |
| Quy tắc nghiệp vụ | `product/docs/business-rules.md` |
| Ghi chú phát hành | `product/docs/release-notes.md` |
| Quyết định đã chốt | `01-decisions/decision-log.md` |
| Việc chờ anh/chị quyết | `02-escalations/escalations-index.md` |
| Phản hồi anh/chị đã gửi | `04-investor-feedback/` |
| Sổ vận hành này | `product/docs/so-van-hanh.md` |
| Tài liệu máy chủ (cho đội) | `product/infra/server/README.md` |

### 7.5 Đang chạy ngày 06/11/2026

- Desk, app nhân viên, trang khách: **v1.0.4**.
- Website: **landing-v2.0.0**, 5 ngôn ngữ. Form đặt phòng bật. Giá ước tính bật từ 06/11.
- Thông báo quyền riêng tư trên web: phiên bản **2026-11-04**, 5 ngôn ngữ.
- Tin Google Chat: **mức A** (không có dữ liệu khách).
- Check-in online cho khách: đã mở lại cùng v1.0.4.

---

## Giả định đang dùng – chờ anh/chị xác nhận

| # | Giả định | Nếu anh/chị muốn khác |
|---|---|---|
| G1 | Review 20/11 và 04/12/2026, sau đó thứ Sáu tuần đầu mỗi tháng | Báo ngày khác ở buổi review hoặc qua `/feedback` |
| G2 | Kéo bản sao lưu về Mac ít nhất 2 ngày một lần, đội chạy vào ngày anh/chị cho phép (đội và đội bảo mật chốt 06/11, mục 1.1a) | Muốn Mac tự kéo hằng ngày: đồng ý ở buổi review 20/11, đội cài ở v1.0.5 (mục 5.4) |
| G3 | Lỗi thường sửa ở round kế tiếp; bản vá phát hành khung thứ Tư 09:30–10:30 | Chọn khung giờ khác |
| G4 | Ngày xóa phòng Chat hằng năm là ngày anh/chị đã ghi trong lịch. Chưa chọn thì đội đề xuất tuần đầu tháng 11 | Báo đội ngày đã chọn (không cần lý do) |

## Lịch sử

| Ngày | Bản | Người | Nội dung |
|---|---|---|---|
| 06/11/2026 | 1.0 | BA | Bản đầu, ngày OTTIMO chạy đủ Desk, app nhân viên, trang khách, website 5 ngôn ngữ có form và giá ước tính |
| 06/11/2026 | 1.1 | BA | Round 4 – Phản hồi & sửa. Mục 5.4: việc cần chốt ở buổi review 20/11 là giá 2027 và gia hạn `web_estimate.open_until`; chưa gia hạn thì từ 01/01/2027 web ghi "giá theo yêu cầu". Mục 7.4: bản HTML của sổ tay cần dựng lại |
| 06/11/2026 | 1.2 | BA | Round 5 – Sản xuất (QC Round 4 ĐK-4). Mục 1.1a mới: kéo sao lưu về Mac ít nhất 2 ngày một lần vào ngày anh/chị cho phép; cách kéo mới không ghi đè bản trên Mac; "server copy changed" là P0 bảo mật. Mục 1.2, 5.3 ý 5, G2 theo nhịp này. Mục 1.3, 1.5, 2.3, 6, 7.2: phòng Báo động có thể thêm một người thứ hai. Mục 2.1a mới: mất dữ liệu tối đa 24 giờ, 12 giờ từ v1.0.5. Mục 2.2: báo kéo chậm sau 48 giờ, lượt sao lưu 14:00, nhắc diễn tập sau 35 ngày thay cho "hằng quý". Mục 1.4, 5.4: diễn tập chậm nhất 20/11 và các việc mang vào buổi review 20/11. Mục 3.1: thêm ví dụ P0 |
| 06/11/2026 | 1.3 | BA | Round 5 – Phản hồi & sửa (review SEC `rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md`). Mục 1.1a: dòng báo lại có giờ chạy và mã thoát; cách kéo mới từ lần kéo 08/11; Time Machine, iCloud áp cho mọi bản trên Mac, ghi đúng kết quả kiểm chỉ đọc 06/11 (chưa có ổ Time Machine, thư mục chưa được loại, iCloud không đồng bộ); mã 3 = bản trên máy chủ khác bản trên Mac, không duyệt phát hành, có thể tạm tắt máy chủ, có thể phải báo trong 72 giờ; tách mã 1 với mã 2. Mục 3.4: nhánh nghi xâm nhập không làm bước 2–5. Mục 2.2: lượt tự kéo lỗi báo ngay, 48 giờ là ngưỡng im lặng. Mục 5.4: câu Time Machine tách khỏi câu lịch tự kéo; FileVault đã xác nhận 27/10. Mục 7.2: người thứ hai là thành viên, điện thoại cài theo `01` 12.1, không thêm webhook khác, đọc 2.3 bước 6. Chưa sửa: con số 12/13 giờ và dòng máy chủ mất hẳn ở 2.1a, 2.2, 5.4, chờ OPS chọn giờ lượt sao lưu thứ hai (FB-R5-SEC-BA-05) |
| 06/11/2026 | 1.4 | BA | Round 5 – Phản hồi & sửa (SEC FB-R5-SEC-BA-05, chữ ở mục 2a của review; OPS `c224f0e8`, V5-62). Lượt sao lưu thứ hai lúc **15:00** (production 03:00 + 15:00): mục 2.1a, 2.2, 5.4. Mục 2.1a dòng "Máy chủ mất hẳn" có con số: hiện nay khoảng 64 giờ; từ v1.0.5 khoảng 60 giờ nếu kéo tay, khoảng 36 giờ nếu Mac tự kéo hằng ngày. Mục 5.4: câu xác nhận nêu cả hai kịch bản |
| 06/11/2026 | 1.5 | BA | Round 5 – Phản hồi & sửa (BUG-R5-001, BUG-R5-003; OPS PR #93, `hosting-plan.md` mục 7 dòng RPO / RTO). **Áp dụng ngay, tới khi v1.0.5 lên:** mục 4.1 khung "Lỗi đang sửa – hai tham số" (không bấm **Lưu thay đổi** ở `weekend_nights`, `min_stay`; buộc phải đổi thì nhắn đội trước, **Hiệu lực từ** từ ngày mai để còn **Hủy lịch**; lỡ lưu thì báo đội, coi là P0) và câu "Trừ…" ở danh sách tự làm; mục 3.1 ví dụ P0 "mọi báo giá trên Desk báo lỗi"; mục 3.2 dòng "Lỡ bấm Lưu thay đổi…". Mục 4.1 ví dụ cặp tham số: "mức tăng cuối tuần với đêm tính là cuối tuần" thay "cuối tuần với ở tối thiểu" (theo từ điển 1.2: `weekend_nights` không ảnh hưởng ở tối thiểu). Mục 2.1a, 5.4: con số "máy chủ mất hẳn" theo cùng một cách – mức tối đa, kèm mức thường khi kéo lúc khoảng 19:00: hiện nay tới 72 giờ (thường khoảng 64 giờ); từ v1.0.5 kéo tay tới 60 giờ (thường khoảng 52 giờ); Mac tự kéo hằng ngày tới khoảng 36 giờ |
| 07/11/2026 | 1.6 | BA | Round 5 – Phản hồi & sửa (V5-40, V5-71; SEC `rounds/round-05/reviews/SEC-on-be-pr-100-d1.md` mục 7, ARC `ARC-on-be-pr-100-d1.md` mục 2). Mục 1.5: trước ngày lên v1.0.5 mọi lễ tân trưởng đã bật 2 bước; đổi vai chỉ trên Desk, đội sửa vai thẳng trong cơ sở dữ liệu thì phải đăng xuất người đó và tăng `roles_version` như Desk. Mục 6: không tắt 2 bước của lễ tân trưởng |
