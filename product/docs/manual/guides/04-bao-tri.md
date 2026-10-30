# Hướng dẫn Bảo trì – App nhân viên OTTIMO

- Dành cho: **nhân viên bảo trì, kỹ thuật (MT)**
- Thiết bị: **điện thoại**, địa chỉ `staff.ottimo.vn` (app nhân viên). Desk `desk.ottimo.vn` dùng để xem phiếu và lịch khóa phòng; tới v1.0.1, khóa phòng do lễ tân hoặc người trực làm trên Desk (mục 5).
- Áp dụng cho: **OTTIMO Desk v1.0** (bản `v1.0.0`), chạy thật từ **thứ Hai 02/11/2026**
- Lập: BA · 30/10/2026 · Bộ hướng dẫn theo bộ phận, bản 1.1 (tách từ Sổ tay sử dụng OTTIMO Desk v1.0, bản nội dung 1.5; sửa theo review DOM, SEC, UXD, QA ngày 30/10)
- Tài liệu không chứa mật khẩu, mã cửa hay thông tin khách.
- **Tài liệu nội bộ OTTIMO – không chuyển tiếp cho người ngoài OTTIMO, không gửi vào nhóm chat, không chụp, không đăng lên mạng. Nghỉ việc hoặc hết hợp tác: xóa tệp trên máy và báo chủ đầu tư.** Bộ hướng dẫn chỉ do chủ đầu tư gửi, và không bao giờ có ô đăng nhập hay hỏi mật khẩu; tệp "hướng dẫn" nhận từ người khác thì không mở, báo chủ đầu tư.

<!-- Nguồn: product/docs/manual/user-manual-v1.0.md bản 1.5 mục 0.2, 0.4, 0.8, 3.1, 3.9, 3.10, 4.1, 5.1, 5.5, 5.8. Phần "làm trên Desk" (mục 4.4) theo mã nguồn product/apps/admin-web/src/pages/ops/WorkOrderDrawer.tsx (chuỗi wo.action.start, wo.action.wait_parts_save, wo.done_title, wo.no_photo_desk) – QA đã kiểm tên nút trên staging (qa3-rc1.md mục 22.3, 22.4; BUG-R3-053). -->

## Cách đọc tệp này

- Chữ **in đậm** là tên nút, tên màn hình đúng như trên app và Desk. Ảnh màn hình có mã ở dưới ảnh (ví dụ C2-05). Khung nét đứt ghi **Chưa có ảnh** hoặc **Ảnh mới · chờ chụp** là ảnh đang chờ chụp: cứ làm theo chữ.
- Khung **Tạm ở v1.0** là việc chưa làm được và cách làm thay. Cách tạm tới bản v1.0.1 gom ở **mục 9**.
- **Hiện OTTIMO có một người trực giữ cả 6 vai, trong đó có vai quản lý.** Tài khoản có vai quản lý **chưa đăng nhập được app nhân viên** ở v1.0. Vì vậy người trực hiện nay xử lý phiếu sửa trên Desk (mục 4.4). Phần còn lại dành cho nhân viên bảo trì có tài khoản riêng.

---

## 1. Đăng nhập

### 1.1 Anh/chị đăng nhập ở đâu

| Việc | Địa chỉ | Thiết bị |
|---|---|---|
| Nhận và xử lý phiếu sửa, báo sự cố | `staff.ottimo.vn` (app nhân viên) | Điện thoại |
| Xem phiếu, lịch khóa phòng trên Desk (tới v1.0.1 chưa tạo phiếu, chưa khóa phòng được trên Desk – mục 5) | `desk.ottimo.vn` (OTTIMO Desk) | Máy quầy hoặc máy tính; xong thì đăng xuất |

- Chỉ vào bằng cách **gõ địa chỉ**, dấu trang, hoặc biểu tượng trên màn hình chính. Không bấm link đăng nhập gửi qua Zalo, tin nhắn.
- Mỗi người **một tài khoản** do chủ đầu tư tạo. App nhân viên và Desk dùng **cùng** tên đăng nhập và mật khẩu.

### 1.2 Lần đầu đăng nhập

Chủ đầu tư **đưa mật khẩu tạm tận tay**. Không gửi qua chat. Lần đầu làm cùng chủ đầu tư.

**Bước A – Đổi mật khẩu tạm** (trên Desk, một lần):
1. Mở trình duyệt, gõ `desk.ottimo.vn`.
2. Nhập **Tên đăng nhập** và **Mật khẩu** (mật khẩu tạm). Bấm **Đăng nhập**.
3. Màn **Đặt mật khẩu của bạn**: nhập **Mật khẩu hiện tại** (mật khẩu tạm), **Mật khẩu mới**, **Nhập lại mật khẩu mới**.
4. Bấm **Lưu và vào ứng dụng**.
5. Desk mở trang **Bảo trì**. Không cần làm gì thêm: bấm **tên của mình → Đăng xuất**.

Làm lại bước A mỗi lần chủ đầu tư **Đặt lại mật khẩu** cho anh/chị. App nhân viên chưa có màn đổi mật khẩu tạm (mục 9).

Quy tắc mật khẩu: ít nhất 10 ký tự, không chứa tên hoặc số điện thoại của mình, không phải mật khẩu phổ biến.

[ẢNH: C0-02-Đặt mật khẩu lần đầu]

<!-- QA đã kiểm Q2 (qa3-rc1.md mục 22.2): vai chỉ Bảo trì đổi mật khẩu tạm trên Desk rồi vào app được; Desk mở thẳng trang Bảo trì. -->

**Bước B – Đăng nhập app nhân viên:**
1. Mở trình duyệt điện thoại, gõ `staff.ottimo.vn`.
2. Nhập **Tên đăng nhập**, **Mật khẩu**. Bấm **Đăng nhập**.
3. Trình duyệt hỏi lưu mật khẩu: chọn **Không bao giờ**.
4. Chọn "Thêm vào Màn hình chính" để mở nhanh lần sau.

[ẢNH: C0-09-Đăng nhập app nhân viên]

### 1.3 Đăng nhập hằng ngày

**App nhân viên:**
1. Mở biểu tượng trên màn hình chính (hoặc gõ `staff.ottimo.vn`).
2. Nhập **Tên đăng nhập**, **Mật khẩu**. Bấm **Đăng nhập**.
3. Thanh dưới có: **Phiếu sửa**, **Các căn**, **Báo sự cố**, **Tôi**. Chuông **Thông báo** ở trên. Bảo trì không thấy tên khách.
4. Đổi ngôn ngữ: **Tôi → Ngôn ngữ giao diện** (Tiếng Việt / English).

[ẢNH: C4-01-Phiếu sửa trên app]

**Desk** (xem phiếu và lịch khóa phòng):
1. Gõ `desk.ottimo.vn`. Nhập **Tên đăng nhập**, **Mật khẩu**. Bấm **Đăng nhập**.
2. Desk mở sẵn trang **Bảo trì** (menu: **Vận hành → Phiếu sửa**). Menu có thêm **Các căn**, **Buồng phòng** (chỉ xem). Tới v1.0.1, hộp **Phiếu sửa mới** và **Khóa phòng có kế hoạch** không có căn để chọn: nhờ lễ tân (mục 5).
3. Xong việc: **tên của mình → Đăng xuất**. Trên máy quầy, luôn đăng xuất trước khi rời máy.

[ẢNH: G4-01-Desk của vai Bảo trì, menu Phiếu sửa]

Khi đăng nhập, app hoặc Desk có thể báo:

| Báo | Làm gì |
|---|---|
| "Tên đăng nhập hoặc mật khẩu không đúng. Quên mật khẩu? Nhờ chủ đầu tư đặt lại." | Gõ lại chậm, kiểm chữ hoa. Vẫn sai: báo chủ đầu tư |
| "Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại." | Chờ đúng số phút |
| "Không có mạng. Cần kết nối để đăng nhập." | Bật Wi-Fi hoặc 4G rồi đăng nhập lại |
| Ngay lần đăng nhập đầu, hoặc sau khi chủ đầu tư đặt lại mật khẩu: app vào được nhưng báo "Chưa tải được phiếu sửa – Có thể do mạng yếu…" | Chưa đổi mật khẩu tạm. Làm bước A trên Desk (mục 1.2) rồi đăng nhập lại app (tới khi sửa lỗi, mục 9) |
| **Đăng nhập lại để gửi tiếp** | Đăng nhập lại. Thao tác đã bấm khi mất mạng vẫn còn, sẽ tự gửi |
| "Phiên đăng nhập đã hết" (Desk) | Đăng nhập lại; thông tin đang nhập vẫn được giữ trên máy đó |

### 1.4 Đăng xuất

**App nhân viên:** **Tôi → Đăng xuất**. App cảnh báo "Còn … thao tác chưa gửi…": **không** bấm **Vẫn đăng xuất**; bật mạng, **Tôi → Thao tác trên máy → Gửi ngay**, rồi mới đăng xuất. Đăng xuất xóa dữ liệu đã lưu trên máy. Phải đăng xuất khi trả máy, đưa điện thoại cho người khác, nghỉ việc.

**Desk:** **tên của mình → Đăng xuất**.

[ẢNH: C3-09-Tôi, đăng xuất]

### 1.5 Quên mật khẩu, mất điện thoại

| Tình huống | Làm gì |
|---|---|
| Quên mật khẩu | **Báo chủ đầu tư.** Không có nút "quên mật khẩu". Chủ đầu tư đặt lại và đưa mật khẩu tạm tận tay. Làm lại mục 1.2 |
| Tài khoản bị khóa do sai nhiều lần | Chờ đúng số phút Desk báo, hoặc nhờ chủ đầu tư **Mở khóa**. Bị khóa mà mình **không** gõ sai: báo chủ đầu tư ngay (có thể có người dò mật khẩu) |
| **Mất điện thoại** có đăng nhập app nhân viên | **Báo chủ đầu tư ngay** để khóa tài khoản và đặt lại mật khẩu |
| Nghi người khác biết mật khẩu | Báo chủ đầu tư ngay |

**Không ai** hỏi mật khẩu của anh/chị. Ai hỏi thì không đưa và báo chủ đầu tư. Mỗi người một tài khoản; không dùng chung, không gõ mật khẩu cho người khác.

---

## 2. Việc mỗi ngày

| Khi nào | Việc |
|---|---|
| Đầu ca | Đăng nhập app. **Phiếu sửa** → lọc **Đang mở**, **Gấp**, **Chờ vật tư**. Xem phiếu **Quá hạn** trước |
| Đầu ca | Phiếu của căn **có khách đến hôm nay**: làm trước. Không xong được **trước 11:00** thì báo lễ tân ngay để đổi căn |
| Việc không gấp trong căn có khách | Hẹn qua lễ tân, làm trong **09:00–18:00** |
| Có thông báo **Phiếu sửa mới** mức **Gấp** | **Nhận việc trong 15 phút**, có phương án trong **2 giờ** |
| Trong ngày | Phiếu **Trong ngày**: xong trong 24 giờ. Phiếu **Không gấp**: trong 3 ngày |
| Khi sửa xong | **Sửa xong** kèm **ảnh sau khi sửa**. Phiếu có khóa phòng: chờ app hiện **Đã mở bán lại căn …** |
| Thấy hỏng hóc khi đi kiểm | Tự tạo **+ Phiếu sửa mới** |
| Bảo trì định kỳ cần khóa căn | Báo lễ tân trước: ngày, căn, lý do. Lễ tân hoặc người trực khóa trên Desk (mục 5) |
| **Ngày cuối tháng** (lệch tối đa 2 ngày) | Chốt công tơ khách dài hạn, có ảnh (mục 6) |
| Cuối ca | **Tôi → Thao tác trên máy** không còn thao tác chờ gửi |

Luôn nhớ:
- Bấm **Nhận việc** khi bắt đầu, **Sửa xong** kèm **ảnh sau khi sửa** khi xong.
- Phiếu có khóa phòng: chỉ khi app hiện **Đã mở bán lại căn …** thì căn mới bán được.
- Không vào căn có khách khi chưa báo trước. Không chụp khách, không chụp giấy tờ.
- **Không mở cửa căn** cho người nói mình là khách: mời ra quầy hoặc gọi lễ tân.

---

## 3. Thời hạn theo mức độ

| Mức | Nhận việc | Xong |
|---|---|---|
| **Gấp** | Trong **15 phút** | Có phương án trong **2 giờ** (sửa xong hoặc lễ tân đổi phòng cho khách) |
| **Trong ngày** | – | Trong **24 giờ** |
| **Không gấp** | – | Trong **3 ngày** |

Gấp là: an toàn, hoặc khách đang ở bị ảnh hưởng (mất nước nóng, mất điện, khóa hỏng, rò nước).

Phiếu Gấp của căn có khách quá hạn phương án: lễ tân đổi phòng cho khách hoặc đề nghị bù sự cố. Báo lễ tân ngay khi biết không kịp.

---

## 4. Xử lý phiếu sửa

### 4.1 Trên app nhân viên

1. **Phiếu sửa**. Lọc **Đang mở**, **Gấp**, **Chờ vật tư**. Phiếu ghi căn, sự cố, hạn (**Nhận việc trước … – còn … phút**, **Quá hạn … phút**).
2. Mở phiếu. Xem **Ảnh lúc báo**, **Người báo**, **Nhật ký phiếu**.
3. Bấm **Nhận việc**.
4. Thiếu vật tư: **Chờ vật tư** → hộp **Chờ vật tư – WO-…**: **Cần vật tư gì?**, **Ngày dự kiến có vật tư** → **Lưu – chờ vật tư** (hoặc **Quay lại**). Hạn tạm dừng tới ngày đó (phiếu Gấp không dừng hạn). Có vật tư: **Sửa tiếp**.
5. Sửa xong: **Sửa xong** → hộp **Sửa xong WO-…**: **Đã làm gì?** → **Ảnh sau khi sửa** (bắt buộc với Gấp và Trong ngày) → **Xác nhận sửa xong**.
6. Phiếu có khóa phòng: căn mở khóa, mở bán lại, chuyển **Cần dọn (khách đã đi)**, buồng phòng nhận việc **Dọn sau sửa chữa**. Chỉ khi app hiện **Đã mở bán lại căn …** thì căn mới bán được. **Bước này cần có mạng.**

[ẢNH: C4-01-Phiếu sửa trên app]
[ẢNH: C4-02-Phiếu, nhận việc và chờ vật tư]
[ẢNH: C4-03-Sửa xong, ảnh sau sửa]

Ảnh sau sửa: chỉ chụp chỗ đã sửa. Không chụp khách, giấy tờ, đồ cá nhân của khách.

### 4.2 Vào căn có khách

- Báo lễ tân trước để lễ tân báo khách. Không vào khi chưa báo trước.
- Căn treo biển "Không làm phiền": không vào, báo lễ tân.
- **Ngoại lệ – sự cố an toàn** (nước rò lan ra ngoài căn, mùi khét, khói, chập điện, khách kẹt trong căn):
  1. Lễ tân gọi số khách trên đơn.
  2. Gõ cửa, xưng rõ là kỹ thuật OTTIMO.
  3. Khách không trả lời: **hai người cùng vào** (lễ tân và bảo trì; chỉ có một người thì gọi điện cho chủ đầu tư trong lúc vào).
  4. Chỉ làm việc khẩn, không động vào đồ của khách.
  5. Ghi sổ giao ca: mã đơn, giờ vào, giờ ra, ai vào, đã làm gì. Báo chủ đầu tư và báo khách ngay khi liên lạc được.

<!-- UXD viết câu xưng với khách khi gõ cửa (EN dẫn, VI hỗ trợ) – DOM G08. -->
- Sự cố không sửa được ngay mà khách không ở được: báo lễ tân đổi phòng cho khách trước khi khóa căn.

### 4.3 Tự báo một sự cố mới

**Phiếu sửa** → **+ Phiếu sửa mới**. Hoặc **Báo sự cố** (thanh dưới):
1. Chọn **Căn**, **Chuyện gì xảy ra?**: **Mất nước nóng**, **Điện / đèn**, **Rò nước**, **Khóa cửa**, **Đồ hỏng**, **Khác**. Tắc thoát nước hoặc Wi-Fi: chọn **Khác**, ghi rõ trong **Mô tả** (mục 9).
2. **Mô tả**, **Ảnh** (chỉ chỗ hỏng), **Mức độ**.
3. Căn không ở được: tích **Đề nghị khóa căn – không bán đến khi sửa xong**.
4. Bấm **Gửi báo sự cố**. App báo **Đã tạo phiếu …**.

[ẢNH: C3-06-Báo sự cố]

### 4.4 Làm trên Desk (người trực hiện nay)

Tài khoản có vai quản lý chưa vào được app nhân viên. Người trực xử lý phiếu trên Desk:
1. **Vận hành → Bảo trì**, tab **Phiếu sửa**.
2. Bấm vào phiếu. Khung phiếu mở ra.
3. Bấm **Nhận việc** (quản lý thấy thêm **Hủy phiếu**). Sau đó khung có **Chờ vật tư** (hộp **Chờ vật tư – WO-…**: **Cần vật tư gì?**, **Ngày dự kiến có vật tư** → **Lưu – chờ vật tư**) và **Sửa xong**.
4. **Sửa xong**: ghi **Đã làm gì?**; **Ảnh sau khi sửa**: chọn ảnh từ máy (Desk ghi "Ảnh sau sửa: chụp bằng app kỹ thuật hoặc chọn ảnh ở đây"). Ảnh chụp bằng điện thoại của cơ sở, chỉ chỗ đã sửa; đính xong thì xóa khỏi điện thoại.
5. Bấm **Xác nhận sửa xong**, đọc hộp "Khi bấm Xác nhận…" (mở khóa căn, căn chuyển "Cần dọn (khách đã đi)", việc "Dọn sau sửa chữa") rồi bấm **Xác nhận sửa xong** lần nữa (đổi ý: **Không, quay lại**). Phiếu có khóa phòng: chờ Desk hiện **Đã mở bán lại căn …**.

[ẢNH: G4-02-Desk, khung phiếu sửa với Nhận việc và Sửa xong]

---

## 5. Khóa phòng để sửa (trên Desk)

Lễ tân hoặc người trực, trên Desk **Vận hành → Bảo trì**:

> **Tạm ở v1.0 (tới v1.0.1):** tài khoản chỉ có vai Bảo trì mở được hộp **Phiếu sửa mới** và **Khóa phòng có kế hoạch** nhưng ô **Căn** không có lựa chọn nào, nên không tạo phiếu, không khóa phòng được trên Desk. Bảo trì báo sự cố trên app (tích **Đề nghị khóa căn**, mục 4.3) hoặc nhắn lễ tân **ngày, căn, lý do**; lễ tân hoặc người trực làm các bước dưới đây.
1. Tab **Phiếu sửa** → **Phiếu sửa mới** → căn, **Tiêu đề**, **Mô tả**, **Mức độ**, ảnh.
2. Cần khóa: tích **Khóa căn – không bán đến khi sửa xong** → **Khóa từ**, **Dự kiến xong**, **Lý do khóa** → **Tạo phiếu và khóa căn**. Desk tính ngày mở bán lại (cộng thời gian dọn và kiểm).
3. Căn đang có khách: chưa khóa được – lễ tân đổi phòng cho khách trước.
4. Khoảng khóa trùng đơn đã đặt: lễ tân dời các đơn sang căn khác trước (lý do "Căn hỏng / sự cố"), rồi khóa.
5. Bảo trì có kế hoạch: tab **Khóa phòng** → **Khóa phòng có kế hoạch**. Đổi ngày: **Đổi ngày mở bán**. Bỏ: **Hủy khóa**.
6. **Mở khóa sớm** không qua phiếu: chỉ quản lý.

[ẢNH: C4-04-Desk Bảo trì, tab Khóa phòng]
[ẢNH: C4-05-Phiếu sửa mới và khóa căn trên Desk]

Căn đang khóa sửa (`OOO`) thì không bao giờ nhận khách được. Hỏng hóc dùng **khóa phòng**, không dùng "ngừng bán".

---

## 6. Chốt công tơ khách dài hạn

> **Tạm ở v1.0 (tới v1.3):** Desk chưa có màn chốt công tơ.
> - Người chốt: ______ (chủ đầu tư ghi theo phân công hiện nay của OTTIMO).
> - Ngày chốt: ngày cuối tháng, lệch tối đa 2 ngày. Ngày cụ thể: ______.
> - Chụp ảnh công tơ điện, nước từng căn có khách dài hạn. Chỉ chụp công tơ; không chụp khách, không gửi nhóm Zalo.
> - Ghi chỉ số, ngày, người chốt vào sổ; đưa số cho lễ tân trưởng/chủ đầu tư tính tiền.
> - Khách dài hạn **nhận phòng**: chốt chỉ số **đầu kỳ** ngay hôm đó, có ảnh. **Trả phòng**: chốt chỉ số cuối, có ảnh, trước khi lễ tân trả phòng.
> - Hiện không có khách dài hạn đang ở (chủ đầu tư xác nhận 30/10): chưa có kỳ nào phải chốt. Khi có khách dài hạn đầu tiên, chủ đầu tư điền người chốt và ngày chốt ở trên.

---

## 7. Khi mất mạng

- App hiện thanh "Mất mạng. Bấm vẫn được – thao tác sẽ tự gửi khi có mạng".
- Thao tác chờ gửi hiện chip **Chờ gửi**. Xem ở **Tôi → Thao tác trên máy**; bấm **Gửi ngay** khi có mạng.
- Mục **Cần xem lại**: máy chủ không nhận. Đọc lý do, bấm **Gửi lại "…"** hoặc **Đã hiểu**.
- **Đóng phiếu có khóa phòng cần có mạng.** Mất mạng thì app báo "Mất mạng – chưa mở bán lại được. Đóng phiếu có khóa phòng cần có mạng để lễ tân thấy ngay." Có mạng lại thì làm lại bước **Sửa xong**, chờ **Đã mở bán lại căn …**.
- **Đừng xóa dữ liệu trình duyệt hay gỡ app khi còn thao tác chờ gửi.**
- Sự cố gấp mà mất mạng: **gọi lễ tân ngay**, đừng chờ.

[ẢNH: C3-07-Thao tác trên máy]

---

## 8. Tình huống thường gặp và không được làm

### 8.1 Tình huống thường gặp

| Tình huống | Làm gì |
|---|---|
| Phiếu Gấp không kịp phương án trong 2 giờ | Báo lễ tân ngay để đổi phòng cho khách |
| Thiếu vật tư | **Chờ vật tư**, ghi ngày dự kiến. Phiếu Gấp vẫn chạy hạn: báo lễ tân |
| Sửa xong mà app chưa hiện **Đã mở bán lại căn …** | Kiểm mạng, chờ. Chưa hiện thì căn chưa bán được; báo lễ tân |
| Có người nói "tôi quên mã, mở cửa giúp" | **Không mở.** Mời ra quầy hoặc gọi lễ tân |
| Khách hỏi mã cửa, Wi-Fi | Mời khách ra quầy hoặc gọi lễ tân; Wi-Fi: chỉ thẻ Wi-Fi trong căn |
| Mất điện riêng một căn có khách | Phiếu **Gấp**; lễ tân đổi phòng nếu cần |
| App báo lỗi, không làm tiếp được | Ghi bằng lời: căn, mã phiếu, giờ, đã bấm gì, app báo gì. Báo lễ tân hoặc chủ đầu tư |

### 8.2 Không được làm

- Không vào căn có khách khi chưa báo trước. Không vào căn treo "Không làm phiền", trừ sự cố an toàn (mục 4.2).
- Không chụp khách, giấy tờ, đồ cá nhân của khách. Không gửi ảnh vào nhóm Zalo.
- **Không mở cửa căn** cho người nói mình là khách.
- Không gửi, không đọc mã cửa.
- Không dùng tài khoản của người khác, không đưa mật khẩu cho người khác.
- Không bán lại căn (không báo lễ tân "xong rồi") khi app chưa hiện **Đã mở bán lại căn …**.
- Không xóa dữ liệu trình duyệt, không gỡ app khi còn thao tác chờ gửi.

---

## 9. Tạm thời tới v1.0.1

| Việc | Cách tạm |
|---|---|
| App thiếu loại sự cố "Tắc thoát nước", "Wi-Fi" (Desk thì có) | Chọn **Khác**, ghi rõ trong **Mô tả** |
| Desk chưa có chỗ nhập Wi-Fi; trang khách ghi "hỏi lễ tân" | Khách xem thẻ Wi-Fi trong căn |
| Tài khoản có vai quản lý chưa vào được app nhân viên | Người trực xử lý phiếu trên Desk (mục 4.4) |
| Chốt công tơ chưa có trên Desk (tới v1.3) | Chụp ảnh, ghi sổ (mục 6) |
| App chưa có màn đổi mật khẩu tạm; còn mật khẩu tạm thì mọi màn báo "Chưa tải được … Có thể do mạng yếu" (BUG-R3-052) | Đổi mật khẩu tạm trên Desk (mục 1.2 bước A) rồi đăng nhập lại app. Làm lại sau mỗi lần chủ đầu tư đặt lại mật khẩu |
| Vai Bảo trì không chọn được căn trên Desk: không tạo phiếu, không khóa phòng được (BUG-R3-053) | Báo sự cố trên app (tích **Đề nghị khóa căn**) hoặc nhắn lễ tân ngày, căn, lý do; lễ tân hoặc người trực làm trên Desk (mục 5) |

---

## 10. Bảng giờ

| Giờ | Việc |
|---|---|
| **06:00** | Ngày mới trên app và Desk |
| Phiếu Gấp + 15 phút | Hạn nhận việc |
| Phiếu Gấp + 2 giờ | Hạn có phương án (sửa xong hoặc lễ tân đổi phòng) |
| Phiếu Trong ngày + 24 giờ | Hạn xong |
| Phiếu Không gấp + 3 ngày | Hạn xong |
| 09:00–18:00 | Việc không gấp trong căn có khách (hẹn qua lễ tân) |
| **11:00** | Căn có khách đến chưa sửa xong: báo lễ tân |
| **12:00** | Giờ trả phòng; căn khách trả cần dọn trước 14:00 – báo lễ tân nếu sửa chữa làm chậm |
| **14:00** | Mọi căn có khách đến hôm nay phải sẵn sàng |
| Cuối tháng (±2 ngày) | Chốt công tơ khách dài hạn |

---

## 11. Khi có sự cố – gọi ai

| Sự cố | Gọi ai | Trong lúc chờ |
|---|---|---|
| Sự cố gấp ở căn có khách | **Lễ tân** (đổi phòng nếu cần) | Nhận việc trên app trong 15 phút |
| Mất điện cả khu | Lễ tân → quản lý | Khóa cửa chạy pin vẫn mở bằng mã/thẻ. Mất điện quá 4 giờ: quản lý báo chủ đầu tư |
| Có người lạ xin mở cửa căn | Lễ tân | Không mở |
| App hoặc Desk báo lỗi | Lễ tân hoặc chủ đầu tư | Ghi bằng lời, **không** ghi tên khách, **không** chụp màn hình có dữ liệu khách |
| Quên mật khẩu, mất điện thoại, tài khoản bị khóa | Chủ đầu tư | – |
| Mất điện thoại hoặc máy tính bảng có app khóa cửa | Chủ đầu tư ngay | – |

Số điện thoại lễ tân và chủ đầu tư: chủ đầu tư đưa trong buổi đào tạo.

---

## 12. Bài tập đào tạo (45 phút)

Tập trên **bản tập** bằng **tài khoản tập** chủ đầu tư đưa tận tay. Mật khẩu tập khác mật khẩu thật. Chỉ mở bản tập bằng địa chỉ chủ đầu tư đưa.

1. Đăng nhập app, đăng xuất.
2. **Nhận việc** một phiếu **Gấp**.
3. **Chờ vật tư** rồi **Sửa tiếp**.
4. **Sửa xong** có ảnh, xem căn **Đã mở bán lại**.
5. Trên app tập: **Báo sự cố** có tích **Đề nghị khóa căn**. Nói được cách nhắn lễ tân xin khóa phòng có kế hoạch (tới v1.0.1 bảo trì chưa khóa được trên Desk).
6. Nói được: thời hạn 3 mức; vì sao không mở cửa cho người tự nhận là khách.
